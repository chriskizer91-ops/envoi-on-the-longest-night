// chain.js: plays the whole journey (src/game/story.js) in order with a play style (plan phase 3): every walk's wild fights,
// the rests and shops, the gates and the Magpie's upgrades, carrying each hero's HP, MP and herbs from fight to fight.
// Out of battle Io heals with her Moonlore while her MP lasts; a party worn down walks back to its last rest (a couple
// more encounters on the way). A lost fight wakes the party at its last rest; a lost gate is tried again; Halcyon's ambush
// goes on either way. Where a gate asks for a higher level, or an upgrade for more shards, the player walks the wilds
// near the last rest until they have it (grinding). Needs rules.js, engine.js, sim.js and story.js. Defines
// globalThis.BattleChain = { run(policy, seed), runMany(policy, n) }.
(function (G) {
  'use strict';

  function run(policy, seed, opts) {
    opts = opts || {};
    const RL = G.BattleRules, S = G.BattleSim, E = G.BattleEngine, ST = G.STORY;
    const rand = E.rng((seed || 1) * 7919 + 13), pol = S.POLICIES[policy];
    const P = {
      level: 1, xp: 0, shards: 0, herbs: {}, flags: {}, hp: { io: null, sol: null }, mp: null, rest: null, band: 1,
      wild: 0, grind: 0, back: 0, losses: 0, wildLosses: 0, fled: 0, gateTries: {}, fightTime: 0, steps: [],
    };
    const maxHp = (id) => Math.round(RL.HEROES[id].hp * RL.scale(P.level));
    const maxMp = () => Math.round(RL.HEROES.io.mp * RL.mpScale(P.level));
    const hpOf = (id) => (P.hp[id] == null ? maxHp(id) : P.hp[id]);
    const mpOf = () => (P.mp == null ? maxMp() : P.mp);
    function restore() { P.hp = { io: null, sol: null }; P.mp = null; }
    function gain(xp, shards) {
      P.xp += xp; P.shards += shards;
      while (P.level < RL.MAX_LEVEL && P.xp >= RL.xpNeed(P.level)) {
        // a level up keeps each hero's share of HP and MP
        const fio = hpOf('io') / maxHp('io'), fso = hpOf('sol') / maxHp('sol'), fmp = mpOf() / maxMp();
        P.xp -= RL.xpNeed(P.level); P.level++;
        if (P.hp.io != null) P.hp.io = Math.round(fio * maxHp('io'));
        if (P.hp.sol != null) P.hp.sol = Math.round(fso * maxHp('sol'));
        if (P.mp != null) P.mp = Math.round(fmp * maxMp());
      }
    }
    function party() {
      const p = [{ id: 'io', level: P.level, hp: hpOf('io'), mp: mpOf() }];
      if (P.flags.party) p.push({ id: 'sol', level: P.level, hp: hpOf('sol') });
      return p;
    }
    // one fight with the party as it stands; returns the engine's result
    function fight(setup) {
      const B = E.create(Object.assign({ seed: Math.floor(rand() * 4294967296) }, setup));
      let s, guard = 0;
      while ((s = B.turn()).type !== 'end') { if (s.type === 'choose') { const [id, t] = pol(B, s, rand); B.choose(id, t); } if (++guard > 20000) break; }
      const r = B.result();
      P.fightTime += r.time + r.turns * 0.8;
      P.herbs = Object.assign({}, r.herbs);
      for (const h of r.heroes) { if (h.id === 'io') { P.hp.io = h.hp; P.mp = h.mp; } else P.hp.sol = h.hp; }
      if (r.outcome === 'win' || r.outcome === 'retreat') gain(r.xp, r.shards);
      return r;
    }
    // out of battle: Io heals the hurt with Waxing Light or Lunar Mend while her MP lasts above a reserve, and revives
    // a fallen hero with a Nightrose if she has one (or the party goes back to rest)
    function fieldHeal() {
      const k = RL.scale(P.level), M = RL.HEROES.io.moves, reserve = Math.max(40, maxMp() * 0.35);
      for (const id of ['io', 'sol']) if (P.hp[id] === 0 && (id === 'io' || P.flags.party)) { if (P.herbs.nightrose > 0) { P.herbs.nightrose--; P.hp[id] = Math.round(maxHp(id) * RL.HERBS.nightrose.revive); } }
      if (P.hp.io === 0 || (P.flags.party && P.hp.sol === 0)) return false;
      for (let i = 0; i < 12; i++) {
        const lows = ['io', 'sol'].filter((id) => (id === 'io' || P.flags.party) && hpOf(id) < maxHp(id) * 0.75);
        if (!lows.length) break;
        const mp = mpOf();
        if (lows.length > 1 && P.flags.party && mp - M.waxing.mp >= reserve) { P.mp = mp - M.waxing.mp; for (const id of lows) P.hp[id] = Math.min(maxHp(id), hpOf(id) + Math.round(M.waxing.heal * k)); }
        else if (mp - M.mend.mp >= reserve) { P.mp = mp - M.mend.mp; const id = lows.sort((a, b) => hpOf(a) / maxHp(a) - hpOf(b) / maxHp(b))[0]; P.hp[id] = Math.min(maxHp(id), hpOf(id) + Math.round(M.mend.heal * k)); }
        else break;
      }
      // worn down: under half HP with little MP left
      const worn = ['io', 'sol'].some((id) => (id === 'io' || P.flags.party) && hpOf(id) < maxHp(id) * 0.5) && mpOf() < reserve + M.mend.mp;
      return !worn;
    }
    function goRest() { restore(); }
    // the band's wild fights so far: the Bramble Colossus never comes in the first few after the party reaches its band
    const seen = {};
    function wildSetup(band) {
      const pack = S.wildPack(band, rand, seen[band] || 0); seen[band] = (seen[band] || 0) + 1;
      return { party: party(), foes: pack.map((id) => ({ id: S.formOf(id, band, rand), level: S.wildLevel(band, rand) })), flags: Object.assign({}, P.flags), herbs: Object.assign({}, P.herbs), ends: { canFlee: true }, reward: RL.WILD_REWARD };
    }
    // one random encounter in a band's wilds; a loss wakes the party at its last rest
    function encounter(band, kind) {
      const r = fight(wildSetup(band));
      P[kind]++;
      if (r.outcome === 'fled') { P.fled++; if (!fieldHeal()) goRest(); return; }
      if (r.outcome !== 'win') { P.losses++; P.wildLosses++; goRest(); return; }
      if (!fieldHeal()) { P.back++; P.wild += 0; for (let i = 0; i < 2; i++) { const r2 = fight(wildSetup(band)); P[kind]++; if (r2.outcome !== 'win') { P.losses++; P.wildLosses++; break; } fieldHeal(); } goRest(); }
    }
    function buy(band) {
      const order = ['moonpetal', 'nightrose', 'mugwort', 'lavender', 'emberLily'];
      for (const id of order) {
        if ((P.herbs[id] || 0) >= RL.CARRY) continue;
        const price = RL.herbPrice(id, band);
        if (P.shards >= price) { P.shards -= price; P.herbs[id] = (P.herbs[id] || 0) + 1; }
      }
    }
    const note = (what) => P.steps.push({ what, level: P.level, xp: P.xp, shards: P.shards, wild: P.wild, grind: P.grind, losses: P.losses, time: P.fightTime });

    for (const st of ST.PATH) {
      if (st.flags) Object.assign(P.flags, st.flags);
      if (st.scene) continue;
      if (st.rest) { goRest(); continue; }
      if (st.shop) { buy(ST.PLACES[st.shop].band); continue; }
      if (st.walk) {
        P.band = st.band;
        const camp = opts.campEvery || 7;
        for (let i = 0; i < st.fights; i++) { encounter(st.band, 'wild'); if ((i + 1) % camp === 0) goRest(); }
        note('walk:' + st.walk);
        continue;
      }
      if (st.upgrade != null) {
        const U = RL.MAGPIE[st.upgrade];
        let g = 0;
        while ((P.shards < U.shards || P.level < U.level) && g++ < 400) { encounter(P.band, 'grind'); if (g % 6 === 0) { goRest(); buy(P.band); } }
        P.shards -= U.shards; note('upgrade:' + U.name);
        continue;
      }
      if (st.fight) {
        // a gate waits until the party has its level (walking the wilds near the last rest), then is tried until won
        let g = 0;
        if (st.level) while (P.level < st.level && g++ < 600) { encounter(P.band, 'grind'); if (g % 6 === 0) { goRest(); buy(P.band); } }
        goRest(); buy(P.band);
        let tries = 0, r;
        for (;;) {
          tries++;
          const f = S.FIGHTS[st.fight].setup(P.level, rand);
          const setup = Object.assign({}, f, { party: st.fight === 'first' ? [{ id: 'io', level: P.level }] : party(), herbs: Object.assign({}, P.herbs) });
          if (st.fight !== 'first') setup.flags = Object.assign({}, f.flags, P.flags);
          r = fight(setup);
          if (r.outcome === 'win' || r.outcome === 'retreat' || st.story || tries >= (opts.maxTries || 60)) break;
          P.losses++; goRest(); buy(P.band);
          // after two losses at a gate, a player levels once more before trying again
          if (tries % 2 === 0 && P.level < RL.MAX_LEVEL) { const L0 = P.level; let g2 = 0; while (P.level === L0 && g2++ < 80) { encounter(P.band, 'grind'); if (g2 % 6 === 0) goRest(); } goRest(); buy(P.band); }
        }
        P.gateTries[st.fight] = tries;
        note('fight:' + st.fight + ':' + r.outcome);
        if (st.story || st.fight === 'first') goRest();
        continue;
      }
    }
    return P;
  }

  // many journeys: the average and the spread of each step
  function runMany(policy, n, opts) {
    const runs = [];
    for (let i = 0; i < n; i++) runs.push(run(policy, i + 1, opts));
    const steps = runs[0].steps.map((s, k) => {
      const col = (f) => runs.map((r) => r.steps[k][f]).sort((a, b) => a - b);
      const med = (f) => { const c = col(f); return c[Math.floor(c.length / 2)]; };
      return { what: s.what, level: med('level'), shards: med('shards'), wild: med('wild'), grind: med('grind'), losses: med('losses'), time: med('time') };
    });
    const tries = {};
    for (const k in runs[0].gateTries) { const c = runs.map((r) => r.gateTries[k]).sort((a, b) => a - b); tries[k] = { median: c[Math.floor(c.length / 2)], p90: c[Math.floor(c.length * 0.9)] }; }
    const tot = (f) => { const c = runs.map((r) => r[f]).sort((a, b) => a - b); return c[Math.floor(c.length / 2)]; };
    return { policy, n, steps, tries, wild: tot('wild'), grind: tot('grind'), back: tot('back'), losses: tot('losses'), fled: tot('fled'), hours: tot('fightTime') / 3600 };
  }

  G.BattleChain = { run, runMany };
})(typeof globalThis !== 'undefined' ? globalThis : window);
