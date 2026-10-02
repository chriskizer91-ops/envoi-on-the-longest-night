// sim.js: the balance simulator (plan phase 2). It plays each fight in the game thousands of times with three play
// styles and reports how often each wins, how long the fights take and how close they run. The fights are the plan's:
// the first fight, the wild fights of each band, the four gates and the finale. Runs in the browser (the balance demo)
// and in Node (tools/balance.mjs). Needs rules.js and engine.js. Defines globalThis.BattleSim.
//
// The play styles:
//   careless: picks moves almost at random, heals late and only sometimes, never plans ahead
//   sensible: heals anyone under about half, saves MP for healing, uses its best damage otherwise, herbs when out of MP
//   expert:   heals before the next big hit could land, shields against a charged move it can see coming, keeps Sol in
//             Sunburn, sunders bosses, binds them, uses each summon at the right moment
(function (G) {
  'use strict';
  const THINK = 1.5; // seconds a player spends on each menu, added to the fight's length

  // ---------- the fights ----------
  // each band's wild packs: about a minute to a minute and a half for a sensible player, and a careless one still wins
  // most of them; three wraiths together are kept for Dawnroost
  const BAND_PACKS = {
    1: [['wisp', 'wisp'], ['wraith'], ['wisp', 'wraith'], ['wisp', 'wisp', 'wisp']],
    2: [['wisp', 'wraith'], ['wraith', 'wraith'], ['wraith', 'wisp', 'wisp'], ['wisp', 'wisp', 'wisp']],
    3: [['wraith', 'wraith'], ['wraith', 'wisp', 'wisp'], ['frostWisp', 'frostWisp', 'wraith'], ['wraith', 'frostWisp']],
    4: [['frostWisp', 'frostWisp', 'wraith'], ['frostWisp', 'frostWisp', 'frostWisp'], ['wraith', 'wraith', 'frostWisp'], ['wraith', 'wraith']],
  };
  const BAGS = {
    wild: { moonpetal: 2, mugwort: 1, nightrose: 1 },
    gate: { moonpetal: 4, lavender: 2, mugwort: 3, emberLily: 2, nightrose: 2 },
    finale: { moonpetal: 6, lavender: 3, mugwort: 4, emberLily: 3, nightrose: 3 },
  };
  const bandOf = (L) => (L <= 5 ? 1 : L <= 10 ? 2 : L <= 15 ? 3 : 4);
  // the story flags a party has at a level when it isn't in the gate fight that grants them
  const flagsAt = (L) => ({ party: true, veil: L > 5, envoi: L > 10, stoop: L > 15 });
  const FIGHTS = {
    first: {
      name: 'The first fight', note: 'Io alone against the Night square wraith, as in the demo', level: 1, levels: [1, 3],
      setup: (L) => ({ party: [{ id: 'io', level: L }], foes: [{ id: 'wraith', level: 1 }], flags: {}, herbs: {} }),
    },
    wild: {
      name: 'Wild fights', note: 'a random pack from the band, at the party level', level: 3, levels: [2, 20],
      setup: (L, rand) => {
        const packs = BAND_PACKS[bandOf(L)], pack = packs[Math.floor(rand() * packs.length)];
        return { party: [{ id: 'io', level: L }, { id: 'sol', level: L }], foes: pack.map((id) => ({ id, level: L })), flags: flagsAt(L), herbs: BAGS.wild };
      },
    },
    greatWraith: {
      name: 'The great wraith', note: "the level 5 gate, at Bogmire's dark heart", level: 5, levels: [3, 8],
      setup: (L) => ({ party: [{ id: 'io', level: L }, { id: 'sol', level: L }], foes: [{ id: 'greatWraith', level: 5 }], flags: { party: true }, herbs: BAGS.gate }),
    },
    dawnroost: {
      name: 'Dawnroost', note: 'the level 10 gate: three level 12 wraiths at the living node, without Envoi', level: 10, levels: [8, 13],
      setup: (L) => ({ party: [{ id: 'io', level: L }, { id: 'sol', level: L }], foes: [{ id: 'wraith', level: 12 }, { id: 'wraith', level: 12 }, { id: 'wraith', level: 12 }], flags: { party: true, veil: true }, herbs: BAGS.gate }),
    },
    halcyon: {
      name: "Halcyon's ambush", note: 'the level 15 gate: Halcyon at 20; it ends when the party falls, or when she is down to 20% and retreats', level: 15, levels: [15, 20],
      setup: (L) => ({ party: [{ id: 'io', level: L }, { id: 'sol', level: L }], foes: [{ id: 'halcyon' }], flags: { party: true, veil: true, envoi: true, kestrel: true }, herbs: BAGS.gate, ends: { retreat: { foe: 'halcyon', below: 0.2 } } }),
    },
    finale: {
      // at Noctara's side Halcyon fights at a little over a third of her ambush strength: Blackout gives her extra
      // blows, and at full strength the two of them end the fight before it can become a race. The cold deepens for
      // both (proposed)
      name: 'The finale', note: 'Noctara with Halcyon, both at 20, at the dead Moonwell; the cold deepens every turn', level: 20, levels: [17, 20],
      setup: (L) => ({ party: [{ id: 'io', level: L }, { id: 'sol', level: L }], foes: [{ id: 'halcyon', hpMul: 0.4, dmgMul: 0.35, rage: 0.06 }, { id: 'noctara' }], flags: { party: true, veil: true, envoi: true, stoop: true }, herbs: BAGS.finale }),
    },
  };

  // ---------- the balance targets (plan, phase 2) ----------
  // each: a fight at a level, a play style, and the range its win rate (or its fight length) must land in
  const TARGETS = [
    { fight: 'first', level: 1, policy: 'careless', win: [0.6, 0.95], why: 'Winnable at level 1, but a player who chooses badly can lose' },
    { fight: 'first', level: 1, policy: 'sensible', win: [0.95, 1], why: 'Winnable at level 1' },
    ...[2, 5, 8, 12, 16, 20].map((L) => ({ fight: 'wild', level: L, policy: 'careless', win: [0.85, 1], why: 'Wild fights: most are won even when playing carelessly' })),
    ...[2, 5, 8, 12, 16, 20].map((L) => ({ fight: 'wild', level: L, policy: 'sensible', win: [0.97, 1], minutes: [0.7, 2.2], why: 'Wild fights: about a minute or two at the party level' })),
    { fight: 'greatWraith', level: 5, policy: 'careless', win: [0.2, 0.6], why: 'The level 5 gate: a little harder than the wild fights' },
    { fight: 'greatWraith', level: 5, policy: 'sensible', win: [0.8, 0.96], why: 'The level 5 gate: a little harder than the wild fights' },
    { fight: 'greatWraith', level: 5, policy: 'expert', win: [0.97, 1], why: 'The level 5 gate: a good player wins' },
    { fight: 'dawnroost', level: 10, policy: 'sensible', win: [0.8, 0.96], why: 'The level 10 gate: the largest group of stronger wraiths so far' },
    { fight: 'dawnroost', level: 10, policy: 'expert', win: [0.93, 1], why: 'The level 10 gate: a good player wins' },
    { fight: 'halcyon', level: 15, policy: 'expert', win: [0, 0.1], why: 'Halcyon at 15: overwhelming' },
    { fight: 'halcyon', level: 18, policy: 'expert', win: [0.4, 0.85], why: 'Halcyon: leveling past 15 is what makes her retreat' },
    { fight: 'halcyon', level: 20, policy: 'expert', win: [0.8, 1], why: 'Halcyon: leveling past 15 is what makes her retreat' },
    { fight: 'finale', level: 20, policy: 'expert', win: [0.4, 0.65], why: 'The finale at 20: a good player wins about half the time' },
    { fight: 'finale', level: 19, policy: 'expert', win: [0, 0.1], margin: 0.4, why: 'The finale at 19: no real chance, but close' },
    { fight: 'finale', level: 18, policy: 'expert', win: [0, 0.02], why: 'The finale below 19 cannot be won' },
  ];
  function check(t, r) {
    const fails = [];
    if (t.win && (r.winRate < t.win[0] || r.winRate > t.win[1])) fails.push('win rate');
    if (t.minutes && (r.minutes.median < t.minutes[0] || r.minutes.median > t.minutes[1])) fails.push('length');
    if (t.margin != null && r.loseMargin != null && r.loseMargin > t.margin) fails.push('margin');
    return fails;
  }

  // ---------- experience and shards along the way ----------
  // the average wild fight's experience and shards at a level, and how many wild fights a level takes
  function economy() {
    const RL = G.BattleRules, rows = [];
    for (let L = 1; L < RL.MAX_LEVEL; L++) {
      const packs = BAND_PACKS[bandOf(Math.max(2, L))];
      let xp = 0, sh = 0;
      for (const p of packs) for (const id of p) { xp += RL.grows(RL.FOES[id].xp, L); sh += RL.grows(RL.FOES[id].shards, L); }
      xp /= packs.length; sh /= packs.length;
      rows.push({ level: L, need: RL.xpNeed(L), xp: Math.round(xp), shards: Math.round(sh), fights: RL.xpNeed(L) / xp });
    }
    return rows;
  }

  // ---------- what the play styles look at ----------
  function look(B, s) {
    const RL = G.BattleRules, u = s.unit, opts = s.options;
    const ok = (id) => opts.find((o) => o.id === id && o.ok);
    const foes = B.living('foe'), heroes = B.heroes.filter(B.alive), fallen = B.heroes.filter((h) => !B.alive(h));
    const pct = (h) => h.hp / h.maxHp;
    const io = B.hero('io'), sol = B.hero('sol');
    const boss = foes.find((f) => f.def.boss);
    const lowestFoe = foes.reduce((a, b) => (b.hp < a.hp ? b : a), foes[0]);
    const charging = foes.find((f) => f.charging);
    // what could land on a hero before her next turn: the worst move of the most dangerous foe in full, and three quarters of the
    // worst of each other foe (a charged move counts in full)
    const danger = (h) => {
      const each = [];
      for (const f of foes) {
        let worst = 0;
        const k = RL.scale(f.level) * f.dmgMul * (1 + f.rage * f.acted) * ((B.tune && B.tune.foeDmg && B.tune.foeDmg[f.id]) || 1);
        for (const id in f.def.moves) {
          const m = f.def.moves[id];
          if (!m.hits) continue;
          if (m.below && (f.used[id] || f.hp > f.maxHp * m.below) && f.charging !== id) continue;
          const hits = (f.solo && m.hitsSolo) || m.hits;
          let n = hits.reduce((a, b) => a + b, 0) * k * 1.25 * (B.lunara === 1 ? 0.6 : 1);
          if (m.blackout) n = 300 * 1.25 * k * 1.25;
          worst = Math.max(worst, n);
        }
        each.push(worst);
      }
      each.sort((a, b) => b - a);
      const n = each.reduce((a, w, i) => a + (i ? w * 0.75 : w), 0) * (h.defending || h.guarding ? 0.5 : 1);
      return Math.max(0, n - (h.veil || 0));
    };
    return { RL, u, ok, opts, foes, heroes, fallen, pct, io, sol, boss, lowestFoe, charging, danger };
  }
  const pick = (rand, list) => list[Math.floor(rand() * list.length)];
  // best damage spell for Io against a foe, keeping `reserve` MP back for healing
  function ioDamage(v, f, reserve) {
    const w = f.def.weak || {}, mp = v.u.mp;
    const c = [];
    if (v.ok('crescent') && mp - 24 >= reserve) c.push(['crescent', 440 * (w.moon || 1)]);
    if (v.ok('flame') && mp - 12 >= reserve) c.push(['flame', 330 * (w.fire || 1)]);
    c.push(['attack', 265]);
    c.sort((a, b) => b[1] - a[1]);
    return c[0][0];
  }

  const POLICIES = {
    careless(B, s, rand) {
      const v = look(B, s), u = v.u;
      const t = () => pick(rand, v.foes).key;
      if (u.id === 'io') {
        if (v.ok('moonlight')) return ['moonlight', t()];
        if (v.pct(u) < 0.25 && v.ok('mend') && rand() < 0.5) return ['mend', u.key];
        const w = [['attack', 3], ['flame', 2], ['crescent', 2], ['briars', 1], ['mend', 0.6], ['lunara', 0.4], ['envoi', 0.4], ['defend', 0.3]].filter(([id]) => v.ok(id));
        let r = rand() * w.reduce((a, b) => a + b[1], 0), id = w[0][0];
        for (const [k, n] of w) { r -= n; if (r <= 0) { id = k; break; } }
        if (id === 'mend') return ['mend', pick(rand, v.heroes).key];
        return [id, t()];
      }
      if (v.ok('highNoon') && rand() < 0.5) return ['highNoon', t()];
      if (v.ok('daybreak')) return ['daybreak', t()];
      const arts = ['flareCut', 'sunder', 'emberRush', 'solarCrest', 'stoopRise'].filter((id) => v.ok(id));
      if (arts.length && rand() < 0.4) return [pick(rand, arts), t()];
      return ['attack', t()];
    },

    sensible(B, s, rand) {
      const v = look(B, s), u = v.u, tgt = (v.boss || v.lowestFoe).key;
      if (u.id === 'io') {
        const low = v.heroes.filter((h) => v.pct(h) < 0.45 && !h.severed).sort((a, b) => v.pct(a) - v.pct(b));
        if (v.ok('moonlight')) return low.length && v.ok('mend') ? ['mend', low[0].key] : ['moonlight', tgt];
        if (v.fallen.length) { if (v.ok('lunara')) return ['lunara', tgt]; if (v.ok('herb:nightrose')) return ['herb:nightrose', v.fallen[0].key]; }
        if (low.length) {
          if (low.length > 1 && v.ok('waxing')) return ['waxing'];
          if (v.ok('mend')) return ['mend', low[0].key];
          if (low.length > 1 && v.ok('herb:lavender')) return ['herb:lavender'];
          if (v.ok('herb:moonpetal')) return ['herb:moonpetal', low[0].key];
        }
        if (u.mp < 16 && v.ok('herb:mugwort')) return ['herb:mugwort', u.key];
        const avg = v.heroes.reduce((a, h) => a + v.pct(h), 0) / v.heroes.length;
        if (v.ok('lunara') && avg < 0.45) return ['lunara', tgt];
        if (v.ok('envoi') && v.boss) return ['envoi', tgt];
        return [ioDamage(v, v.boss || v.lowestFoe, 16), tgt];
      }
      // Sol
      if (v.ok('highNoon') && (u.tranceLeft <= 1 || (v.boss ? v.boss.hp < v.boss.maxHp * 0.1 : v.lowestFoe.hp < v.lowestFoe.maxHp * 0.5))) return ['highNoon', tgt];
      if (v.ok('daybreak')) return ['daybreak', tgt];
      if (v.fallen.length && v.ok('herb:nightrose')) return ['herb:nightrose', v.fallen[0].key];
      if (v.io && B.alive(v.io) && v.pct(v.io) < 0.25 && v.ok('guard')) return ['guard'];
      if (v.pct(u) < 0.3 && (!B.alive(v.io) || v.io.mp < 16) && v.ok('herb:moonpetal')) return ['herb:moonpetal', u.key];
      if (u.heat >= 100 && v.ok('solarCrest')) return ['solarCrest', tgt];
      if (v.ok('stoopRise') && u.heat >= 70) return ['stoopRise', tgt];
      return ['attack', tgt];
    },

    expert(B, s, rand) {
      const v = look(B, s), u = v.u, RL = v.RL;
      // in a pack, finish the weakest; against a boss, the boss (but never hit into Warden's Vow if there's a choice)
      const vowed = (f) => f.vow > 0;
      const mainFoe = v.boss && v.foes.length > 1 ? v.foes.filter((f) => !vowed(f)).sort((a, b) => a.hp - b.hp)[0] || v.boss : v.boss || v.lowestFoe;
      const tgt = mainFoe.key;
      const atRisk = v.heroes.filter((h) => !h.severed && h.hp < v.danger(h) * 1.1).sort((a, b) => v.pct(a) - v.pct(b));
      if (u.id === 'io') {
        if (v.fallen.length) {
          if (v.ok('lunara')) return ['lunara', tgt];
          if (v.ok('herb:nightrose')) return ['herb:nightrose', v.fallen[0].key];
        }
        // a charged move is coming: block it whole, or soften it
        if (v.charging) {
          if (v.ok('envoi') && !B.ward) return ['envoi', tgt];
          if (v.ok('lunara')) return ['lunara', tgt];
          const bare = v.heroes.filter((h) => !(h.veil > 0)).sort((a, b) => v.pct(a) - v.pct(b));
          if (bare.length && v.ok('mothveil') && bare[0].hp < v.danger(bare[0]) * 1.3) return ['mothveil', bare[0].key];
        }
        if (atRisk.length) {
          if (atRisk.length > 1 && v.ok('mend') && u.inTrance) return ['mend', atRisk[0].key];
          if (atRisk.length > 1 && v.ok('waxing')) return ['waxing'];
          if (v.ok('mend')) return ['mend', atRisk[0].key];
          if (atRisk.length > 1 && v.ok('herb:lavender')) return ['herb:lavender'];
          if (v.ok('herb:moonpetal')) return ['herb:moonpetal', atRisk[0].key];
          if (v.ok('mothveil') && !(atRisk[0].veil > 0)) return ['mothveil', atRisk[0].key];
        }
        if (v.ok('moonlight')) return ['moonlight', tgt];
        if (u.mp < 36 && v.ok('herb:mugwort')) return ['herb:mugwort', u.key];
        if (v.ok('envoi') && v.boss && v.foes.reduce((a, f) => a + f.hp, 0) > 3240 * RL.scale(u.level)) return ['envoi', tgt];
        const avg = v.heroes.reduce((a, h) => a + v.pct(h), 0) / v.heroes.length;
        if (v.ok('lunara') && (avg < 0.5 || (!v.boss && v.foes.length > 2 && avg < 0.7))) return ['lunara', tgt];
        if (v.boss && v.ok('briars') && !v.boss.bound && v.boss.atb > 0.45 && u.mp >= 18 + 32) return ['briars', v.boss.key];
        if (v.sol && B.alive(v.sol) && !v.sol.inTrance && v.sol.heat < 50 && v.ok('moonsteel') && u.mp > u.maxMp * 0.5) return ['moonsteel', v.sol.key];
        const top = v.heroes.filter((h) => !h.severed && v.pct(h) < 0.6).sort((a, b) => v.pct(a) - v.pct(b));
        if (top.length && v.ok('mend')) return ['mend', top[0].key];
        return [ioDamage(v, mainFoe, 32), tgt];
      }
      // Sol
      const hal = v.foes.find((f) => f.id === 'halcyon');
      if (v.ok('kestrel') && hal) return ['kestrel', hal.key];
      if (v.ok('highNoon') && (u.tranceLeft <= 1 || mainFoe.hp < mainFoe.maxHp * 0.08)) return ['highNoon', tgt];
      if (v.ok('daybreak') && !vowed(mainFoe)) return ['daybreak', tgt];
      if (v.fallen.length && v.ok('herb:nightrose')) return ['herb:nightrose', v.fallen[0].key];
      if (v.io && B.alive(v.io) && v.io.hp < v.danger(v.io) && v.ok('guard')) return ['guard'];
      // Io can't keep up (down, out of MP, or in danger herself): Sol uses the herbs
      if (atRisk.length && (!v.io || !B.alive(v.io) || v.io.mp < 16 || atRisk.length > 1)) {
        if (atRisk.length > 1 && v.ok('herb:lavender')) return ['herb:lavender'];
        if (v.ok('herb:moonpetal')) return ['herb:moonpetal', atRisk[0].key];
      }
      if (vowed(mainFoe)) return v.ok('guard') && u.heat >= 40 ? ['guard'] : v.ok('herb:emberLily') && u.heat < 70 ? ['herb:emberLily', u.key] : ['attack', tgt];
      // keep 70 Heat for Envoi while it's still to come in a boss fight
      const hold = v.boss && v.io && B.alive(v.io) && B.envoi === 0 && B.flags.envoi ? 70 : 0;
      if (v.boss && mainFoe.sunder === 0 && v.ok('sunder') && u.heat - 20 >= hold) return ['sunder', tgt];
      if (v.ok('stoopRise') && u.heat >= 70 && u.heat - 40 >= hold) return ['stoopRise', tgt];
      if (v.ok('flareCut') && u.heat >= 95 && u.heat - 25 >= hold) return ['flareCut', tgt];
      if (v.pct(u) < 0.35 && u.heat >= 70 && v.ok('solarCrest') && !hold) return ['solarCrest', tgt];
      return ['attack', tgt];
    },
  };

  // ---------- running fights ----------
  function playOne(fight, level, policy, seed, tune) {
    const E = G.BattleEngine, rand = E.rng(seed * 2654435761 + 97);
    const setup = Object.assign({ seed, tune }, FIGHTS[fight].setup(level, rand));
    const B = E.create(setup), pol = POLICIES[policy];
    let s, menus = 0, guard = 0;
    while ((s = B.turn()).type !== 'end') {
      if (s.type === 'choose') { menus++; const [id, t] = pol(B, s, rand); B.choose(id, t); }
      if (++guard > 20000) break;
    }
    const r = B.result();
    r.time += menus * THINK; r.menus = menus;
    r.foeLeft = r.foes.reduce((a, f) => a + f.hp, 0) / r.foes.reduce((a, f) => a + f.maxHp, 0);
    return r;
  }
  function run(fight, level, policy, n, opts) {
    opts = opts || {};
    const out = { fight, level, policy, n, win: 0, retreat: 0, lose: 0, stalemate: 0, times: [], close: 0, downs: 0, herbs: 0, foeLeftLose: [] };
    for (let i = 0; i < n; i++) {
      const r = playOne(fight, level, policy, (opts.seed || 1) + i, opts.tune);
      out[r.outcome]++;
      out.times.push(r.time);
      if (r.outcome !== 'lose' && r.low < 0.15) out.close++;
      if (r.outcome === 'lose') out.foeLeftLose.push(r.foeLeft);
      out.downs += r.downs; out.herbs += r.herbsUsed;
    }
    out.times.sort((a, b) => a - b);
    const q = (p) => out.times[Math.min(n - 1, Math.floor(p * n))];
    out.winRate = (out.win + out.retreat) / n;
    out.minutes = { p10: q(0.1) / 60, median: q(0.5) / 60, p90: q(0.9) / 60 };
    out.closeRate = out.close / n;
    out.loseMargin = out.foeLeftLose.length ? out.foeLeftLose.reduce((a, b) => a + b, 0) / out.foeLeftLose.length : null;
    delete out.times; delete out.foeLeftLose;
    return out;
  }

  G.BattleSim = { FIGHTS, POLICIES, BAND_PACKS, BAGS, TARGETS, check, economy, playOne, run, bandOf, THINK };
})(typeof globalThis !== 'undefined' ? globalThis : window);
