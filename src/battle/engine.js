// engine.js: the battle, without graphics (plan phase 2). It reads the tables in rules.js and runs a fight between up to
// two heroes and three foes, the way the Night square demo does: turn gauges fill while nobody acts and stop while
// anyone does (wait mode), a hero whose gauge fills gets the menu, and heroes go before foes when both are ready.
// The balance simulator drives it thousands of times a second; the battle screen will drive it one turn at a time and
// play back the log each turn returns (every hit, heal, miss and status, in order) with the models and numbers.
// Seeded, so a fight can be replayed exactly. Defines globalThis.BattleEngine.
//
//   const B = BattleEngine.create({ party: [{ id: 'io', level: 3 }, { id: 'sol', level: 3 }],
//     foes: [{ id: 'wraith', level: 3 }, { id: 'wisp', level: 2 }], flags: { party: true }, herbs: { moonpetal: 2 }, seed: 7 });
//   let s = B.turn();           // runs the gauges to the next turn: { type: 'choose' | 'auto' | 'end', unit, log }
//   B.choose('flame', 'wraith'); // the hero's command and its target; returns that action's log
(function (G) {
  'use strict';
  // mulberry32: small, fast and the same everywhere
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function create(setup) {
    const RL = G.BattleRules, HE = RL.HEROES, SU = RL.SUMMONS, ST = RL.STATUS, TR = RL.TRANCE;
    const tune = setup.tune || {};
    const rand = rng(setup.seed == null ? Math.floor(Math.random() * 4294967296) : setup.seed);
    const B = {
      t: 0, gaugeT: 0, turns: 0, units: [], heroes: [], foes: [], queue: [], over: null, cur: null, log: [],
      herbs: Object.assign({}, setup.herbs || {}), flags: Object.assign({}, setup.flags || {}), ends: setup.ends || {},
      lunara: 0, envoi: 0, ward: false, frost: 0, frostLate: null, kestrelUsed: false, might: 0, act: 0, rand, tune,
      stats: { dealt: 0, taken: 0, healed: 0, low: 1, downs: 0, herbsUsed: 0, summons: [] },
    };
    const solo = setup.party.length === 1;

    // ---------- units ----------
    setup.party.forEach((s) => {
      const d = HE[s.id], L = s.level, k = RL.scale(L);
      const u = {
        side: 'hero', id: s.id, key: s.id, name: d.name, def: d, level: L, fill: d.atb,
        maxHp: Math.round(d.hp * k), maxMp: Math.round(d.mp * RL.mpScale(L)),
        atb: s.atb || 0, heat: s.heat || 0, trance: s.trance || 0, tranceReady: false, inTrance: false, tranceLeft: 0, heatBefore: 0,
        defending: false, guarding: false, severed: false, moonNext: false, hovering: null, lured: null,
      };
      u.hp = s.hp != null ? Math.min(s.hp, u.maxHp) : u.maxHp;
      u.mp = s.mp != null ? Math.min(s.mp, u.maxMp) : u.maxMp;
      B.units.push(u); B.heroes.push(u);
    });
    const count = {};
    setup.foes.forEach((s) => { count[s.id] = (count[s.id] || 0) + 1; });
    const seen = {};
    setup.foes.forEach((s) => {
      const d = RL.FOES[s.id], L = d.fixedLevel || s.level, k = RL.scale(L);
      seen[s.id] = (seen[s.id] || 0) + 1;
      const alone = solo && setup.foes.length === 1;
      const hpMul = (tune.foeHp && tune.foeHp[s.id]) || 1;
      const u = {
        side: 'foe', id: s.id, key: count[s.id] > 1 ? s.id + seen[s.id] : s.id, name: d.name + (count[s.id] > 1 ? ' ' + 'ABC'[seen[s.id] - 1] : ''),
        def: d, level: L, fill: d.atb * ((tune.foeAtb && tune.foeAtb[s.id]) || 1), solo: alone,
        maxHp: Math.round(((alone && d.hpSolo) || d.hp) * k * hpMul * (s.hpMul || 1)),
        // a Low Ambush bramble strikes before the party can act
        atb: s.atb != null ? s.atb : d.ambush ? 1 : rand() * 0.25, last: [], used: {}, cd: {},
        bound: false, sunder: 0, evade: 0, vow: 0, charging: null, chargeAt: null, stagger: false, lastAttacker: null,
        dmgMul: (s.dmgMul || 1) * (d.dmg || 1), rage: s.rage != null ? s.rage : d.rage || 0, acted: 0, canes: d.canes || 0, scorchAt: -1,
      };
      u.hp = u.maxHp;
      B.units.push(u); B.foes.push(u);
    });

    const alive = (u) => !!u && u.hp > 0;
    const living = (side) => (side === 'hero' ? B.heroes : B.foes).filter(alive);
    const unit = (key) => B.units.find((u) => u.key === key);
    const hero = (id) => B.heroes.find((u) => u.id === id);
    const swing = () => 1 + (rand() * 2 - 1) * RL.SWING;
    const emit = (e) => { B.log.push(e); return e; };
    const sunburnOn = (h) => h.id === 'sol' && (h.inTrance || h.heat >= HE.sol.sunburn.at);
    const firstFoe = () => living('foe')[0] || null;

    // the Bramble Horror lets its lured prey go (the lure broke, the Grab fell, or it is gone)
    function unlure(f) { for (const h of B.heroes) if (h.lured === f.key) { h.lured = null; emit({ t: 'unlured', to: h.key }); } }
    function down(u) {
      if (u.side === 'foe') unlure(u);
      u.hp = 0; u.atb = 0;
      const i = B.queue.indexOf(u); if (i >= 0) B.queue.splice(i, 1);
      if (u.side === 'hero') {
        B.stats.downs++;
        Object.assign(u, { trance: 0, tranceReady: false, inTrance: false, defending: false, guarding: false, hovering: null, severed: false });
        if (u.id === 'sol') u.heat = 0;
      } else { u.charging = null; }
      emit({ t: 'down', who: u.key });
    }
    function revive(u, frac) {
      u.hp = Math.max(1, Math.round(u.maxHp * frac)); u.atb = 0;
      emit({ t: 'revive', who: u.key, n: u.hp });
    }
    function lowMark() {
      for (const h of B.heroes) if (alive(h)) B.stats.low = Math.min(B.stats.low, h.hp / h.maxHp);
    }

    // ---------- damage and healing ----------
    function hitFoe(a, f, base, el, burn) {
      let n = base * RL.scale(a.level) * swing();
      const w = f.def.weak, r = f.def.resist;
      if (el && w && w[el]) n *= w[el];
      if (el && r && r[el]) n *= r[el];
      if (burn) n *= HE.sol.sunburn.damage;
      if (f.sunder > 0) n *= ST.sunder;
      if (a.side === 'hero') n *= 1 + B.might; // Ember-star Lily
      n = Math.max(1, Math.round(n * (tune.heroDmg || 1)));
      f.hp = Math.max(0, f.hp - n); B.stats.dealt += n; f.lastAttacker = a.side === 'hero' ? a.key : (hero('io') || a).key;
      // a foe who retreats (Halcyon in the ambush) never falls: she leaves first
      if (f.hp <= 0 && B.ends.retreat && B.ends.retreat.foe === f.id) f.hp = 1;
      emit({ t: 'hit', from: a.key, to: f.key, n, el: el || null });
      if (a.side === 'hero' && !a.inTrance && !a.tranceReady) a.trance = Math.min(0.99, a.trance + TR.dealt);
      if (f.hp <= 0) down(f);
      // the Bramble Horror fears fire: once an action, flame makes it recoil (its gauge drops) or breaks its Lure
      else if ((el === 'fire' || el === 'sun') && f.def.fearsFire && f.scorchAt !== B.act) {
        f.scorchAt = B.act;
        if (f.charging) { f.charging = null; f.chargeAt = null; emit({ t: 'scorch', who: f.key, broke: true }); unlure(f); }
        else { f.atb = Math.max(0, f.atb - f.def.fearsFire); emit({ t: 'scorch', who: f.key }); }
      }
      return n;
    }
    // every cane the Bramble Horror has lost takes 8% off its blows
    const caneMul = (f) => (f.def.canes ? 1 - 0.08 * (f.def.canes - f.canes) : 1);
    // a foe's blow on a hero: Guard and the Warden's Oath can pull a single hit off Io onto Sol; Defend and Guard halve
    // it, and Lunara's Embrace takes 40% off
    function hitHero(f, h, base, o) {
      o = o || {};
      let to = h, take = 1;
      const s = hero('sol');
      if (o.single && h.id === 'io' && alive(s) && s !== h && !s.hovering && !o.counter) {
        if (s.guarding) { to = s; emit({ t: 'cover', who: s.key, from: h.key }); }
        else if (h.hp < h.maxHp * HE.sol.oath.below) { to = s; take = HE.sol.oath.take; emit({ t: 'oath', who: s.key, from: h.key }); }
      }
      let n = base * RL.scale(f.level) * swing() * take * (o.mul || 1) * f.dmgMul * ((f.solo && f.def.dmgSolo) || 1) * (1 + f.rage * f.acted) * ((tune.foeDmg && tune.foeDmg[f.id]) || 1) * caneMul(f);
      if (to.defending || to.guarding) n *= ST.defend;
      if (B.lunara === 1) n *= SU.lunara.cut;
      n = Math.max(1, Math.round(n));
      to.hp = Math.max(0, to.hp - n); B.stats.taken += n;
      emit({ t: 'hit', from: f.key, to: to.key, n, guard: !!(to.defending || to.guarding) });
      if (to.id === 'sol' && !to.inTrance) to.heat = Math.min(HE.sol.heat.max, to.heat + HE.sol.heat.perHit);
      if (to.hp > 0 && !to.inTrance && !to.tranceReady) {
        to.trance = Math.min(1, to.trance + n / to.maxHp * TR.taken);
        if (to.trance >= 1) { to.tranceReady = true; emit({ t: 'tranceReady', who: to.key }); }
      }
      if (to.hp <= 0) down(to); else lowMark();
      return { to, n };
    }
    function heal(by, to, base, level) {
      if (!alive(to)) return 0;
      if (to.severed) { emit({ t: 'severed', to: to.key }); return 0; }
      const n = Math.max(1, Math.round(base * RL.scale(level || by.level) * swing()));
      const got = Math.min(n, to.maxHp - to.hp);
      to.hp += got; B.stats.healed += got;
      emit({ t: 'heal', from: by.key, to: to.key, n });
      return got;
    }
    function healPct(by, to, frac) {
      if (!alive(to)) return 0;
      if (to.severed) { emit({ t: 'severed', to: to.key }); return 0; }
      const n = Math.round(to.maxHp * frac), got = Math.min(n, to.maxHp - to.hp);
      to.hp += got; B.stats.healed += got;
      emit({ t: 'heal', from: by.key, to: to.key, n });
      return got;
    }

    // ---------- the turn gauges ----------
    function rate(u) {
      let r = 1 / u.fill;
      if (u.side === 'foe' && u.bound) r *= ST.bindSlow;
      if (u.side === 'hero' && B.frost > 0) r *= ST.frostSlow;
      if (u.lured) r = 0; // drawn to the Bramble Horror's fruit, her gauge stops
      return r;
    }
    // run the gauges for up to `limit` seconds, stopping as soon as anyone's gauge is full
    function advance(limit) {
      let left = limit;
      while (!B.over && !B.queue.length && left > 0) {
        const us = B.units.filter(alive);
        let dt = left;
        for (const u of us) dt = Math.min(dt, (1 - u.atb) / rate(u));
        if (B.frost > 0) dt = Math.min(dt, B.frost);
        dt = Math.max(0, dt);
        for (const u of us) {
          const need = (1 - u.atb) / rate(u);
          u.atb = need <= dt + 1e-9 ? 1 : u.atb + dt * rate(u);
        }
        B.t += dt; B.gaugeT += dt; left -= dt;
        if (B.frost > 0) { B.frost -= dt; if (B.frost <= 1e-9) frostEnds(); }
        for (const u of us) if (alive(u) && u.atb >= 1 && !B.queue.includes(u)) B.queue.push(u);
        checkEnd();
      }
    }
    function frostEnds(by) {
      B.frost = 0; emit({ t: 'frostEnds', by: by || null });
      const late = B.frostLate; B.frostLate = null;
      if (!late || !alive(late.f)) return;
      if (B.ward) { B.ward = false; emit({ t: 'ward', who: late.f.key }); return; }
      for (const h of reach()) for (const base of late.m.hits) if (alive(h)) hitHero(late.f, h, base, { single: false });
      outOfReach(late.f);
    }
    function checkEnd() {
      if (B.over) return B.over;
      if (!living('foe').length) B.over = 'win';
      else if (!living('hero').length) B.over = 'lose';
      else if (B.ends.retreat) {
        const f = B.foes.find((u) => u.id === B.ends.retreat.foe);
        if (f && alive(f) && f.hp <= f.maxHp * B.ends.retreat.below) { B.over = 'retreat'; emit({ t: 'retreat', who: f.key }); }
      }
      if (!B.over && B.turns > (B.ends.maxTurns || 900)) B.over = 'stalemate';
      if (B.over) emit({ t: 'end', result: B.over });
      return B.over;
    }

    // ---------- the foes ----------
    function pickFoeMove(f) {
      const M = f.def.moves, ids = Object.keys(M);
      for (const id of ids) {
        const m = M[id];
        if (m.below && !f.used[id] && f.hp < f.maxHp * m.below) { f.used[id] = true; return id; }
      }
      const halcyonUp = B.foes.some((u) => u.id === 'halcyon' && alive(u));
      const opts = ids.filter((id) => {
        const m = M[id];
        if (m.below) return false;
        if (m.noRepeat && f.last[0] === id) return false;
        if (f.last[0] === id && f.last[1] === id) return false;
        if (m.cooldown && f.cd[id] > 0) return false;
        if (m.hurt && f.hp > f.maxHp * m.hurt) return false;
        if (m.minLevel && f.level < m.minLevel && !f.def.allMoves) return false;
        if (m.blackout && (!halcyonUp || B.ward)) return false; // lore answer 12: no Blackout while Envoi's ward is up
        return true;
      });
      const total = opts.reduce((s, id) => s + M[id].weight, 0);
      let r = rand() * total, pick = opts[0];
      for (const id of opts) { r -= M[id].weight; if (r <= 0) { pick = id; break; } }
      f.last = [pick, f.last[0]];
      if (M[pick].cooldown) f.cd[pick] = M[pick].cooldown + 1;
      return pick;
    }
    // the heroes a foe can reach: while Sol hovers for Kestrel Stoop she is out of reach until her next turn (Chris,
    // October 3). Blows aimed at her go to Io; blows on the whole party pass under her
    const reach = () => living('hero').filter((h) => !h.hovering);
    const outOfReach = (f) => { for (const h of living('hero')) if (h.hovering) emit({ t: 'miss', from: f.key, to: h.key, aloft: true }); };
    function targetFor(f, m) {
      const party = reach();
      if (!party.length) return null;
      if (f.chargeAt) { const u = unit(f.chargeAt); f.chargeAt = null; if (alive(u) && !u.hovering) return u; }
      const one = () => party[Math.floor(rand() * party.length)];
      switch (m.target) {
        case 'io': { const io = hero('io'); return alive(io) && !io.hovering ? io : one(); }
        case 'lastAttacker': { const u = unit(f.lastAttacker); return u && u.side === 'hero' && alive(u) && !u.hovering ? u : one(); }
        case 'lowest': return party.reduce((a, b) => (b.hp < a.hp ? b : a));
        default: return one();
      }
    }
    function useFoeMove(f, id, released) {
      const m = f.def.moves[id];
      emit({ t: 'move', who: f.key, move: id, name: m.name, released: !!released });
      B.t += m.time || 2;
      if (m.target === 'self') {
        if (m.evade) f.evade = m.evade;
        if (m.vow) { f.vow = m.vow; f.vowed = true; }
        if (m.healPct) {
          const n = Math.round(f.maxHp * m.healPct); f.hp = Math.min(f.maxHp, f.hp + n);
          emit({ t: 'heal', from: f.key, to: f.key, n });
        }
        return;
      }
      if (B.ward) { B.ward = false; emit({ t: 'ward', who: f.key, move: id }); return; }
      const hits = (f.solo && m.hitsSolo) || m.hits;
      if (m.blackout) {
        const h = B.foes.find((u) => u.id === 'halcyon' && alive(u));
        emit({ t: 'blackout', who: f.key, by: h.key });
        const c = h.def.moves.gloamCleave, tgt = targetFor(h, c);
        if (!tgt) { outOfReach(h); return; }
        for (const base of c.hits) hitHero(h, tgt, base, { single: true, mul: m.blackout });
        return;
      }
      if (m.frost) { B.frost = Math.max(B.frost, m.frost); emit({ t: 'frost', who: f.key, s: m.frost }); if (m.late) { B.frostLate = { f, m }; return; } }
      if (m.target === 'all') {
        for (const h of reach()) for (const base of hits) if (alive(h)) hitHero(f, h, base, { single: false });
        outOfReach(f);
        return;
      }
      let first = null, took = null;
      for (const base of hits) {
        if (!living('hero').length) break;
        const pool = reach();
        if (!pool.length) { outOfReach(f); break; }
        const tgt = m.target === 'random' ? pool[Math.floor(rand() * pool.length)] : (first && alive(first) ? first : targetFor(f, m));
        const r = hitHero(f, tgt, base, { single: true });
        if (!first) first = tgt;
        if (!took) took = r.to; // whoever the blow actually landed on (Sol's Guard can take it for Io)
        if (m.drain && alive(f)) { f.hp = Math.min(f.maxHp, f.hp + r.n); emit({ t: 'heal', from: f.key, to: f.key, n: r.n }); }
        if (m.sap && alive(r.to)) {
          let n;
          if (r.to.id === 'sol') { n = r.to.inTrance ? 0 : Math.min(r.to.heat, m.sap); r.to.heat -= n; }
          else { n = Math.min(r.to.mp, Math.round(m.sap * RL.mpScale(r.to.level))); r.to.mp -= n; }
          emit({ t: 'sap', to: r.to.key, n, what: r.to.id === 'sol' ? 'heat' : 'mp' });
        }
        if (m.sever && alive(r.to)) { r.to.severed = true; emit({ t: 'sever', to: r.to.key }); }
      }
      // the Grab drags its prey to the root crown: her turn gauge empties, and the lure lets go
      if (m.held && took && alive(took)) { took.atb = 0; const i = B.queue.indexOf(took); if (i >= 0) B.queue.splice(i, 1); emit({ t: 'held', to: took.key }); }
      if (m.held) unlure(f);
    }
    function foeTurn(f) {
      f.atb = 0; f.bound = false; f.vow = 0;
      emit({ t: 'turn', who: f.key });
      if (f.stagger) { f.stagger = false; emit({ t: 'stagger', who: f.key }); }
      else if (f.charging) { const id = f.charging; f.charging = null; useFoeMove(f, id, true); }
      else {
        const id = pickFoeMove(f), m = f.def.moves[id];
        if (m.charge) {
          f.charging = id; B.t += 1.2;
          // a Lure is held out to one hero, and the Grab falls on her
          const tg = m.target === 'all' ? null : targetFor(f, m); f.chargeAt = tg ? tg.key : null;
          emit({ t: 'charge', who: f.key, move: id, name: m.chargeName || m.name, to: f.chargeAt });
          // the Lure: its prey walks toward the fruit, and her gauge stops until the Grab or until flame breaks the lure
          if (m.held && tg) { tg.lured = f.key; const i = B.queue.indexOf(tg); if (i >= 0) B.queue.splice(i, 1); emit({ t: 'lured', to: tg.key }); }
        }
        else useFoeMove(f, id);
      }
      if (f.sunder > 0) f.sunder--;
      f.acted++;
      for (const k in f.cd) if (f.cd[k] > 0) f.cd[k]--;
      B.turns++;
      checkEnd();
    }

    // ---------- the heroes ----------
    const knows = (h, id) => { const d = h.def.moves[id]; return !!d && (!d.need || !!B.flags[d.need]); };
    function cost(h, d) { return d.mp ? (h.inTrance && h.id === 'io' && d.kind === 'moonlore' ? Math.ceil(d.mp / 2) : d.mp) : 0; }
    // every command the hero has right now, with whether it can be used and what it can target
    function options(h) {
      h = h || B.cur;
      const out = [], foes = living('foe').map((u) => u.key), allies = living('hero').map((u) => u.key);
      const fallen = B.heroes.filter((u) => !alive(u)).map((u) => u.key), s = hero('sol');
      const add = (id, o) => out.push(Object.assign({ id, name: (h.def.moves[id] || {}).name, ok: true, why: '', targets: [] }, o));
      if (h.id === 'io') {
        if (h.inTrance) add('moonlight', { targets: foes });
        add('attack', { targets: foes });
        for (const id of ['flame', 'crescent', 'briars', 'mend', 'waxing', 'moonsteel', 'harvest']) {
          if (!knows(h, id)) continue;
          const d = h.def.moves[id], c = cost(h, d);
          const o = { mp: c, ok: h.mp >= c, why: h.mp >= c ? '' : 'MP' };
          o.targets = d.target === 'foe' ? foes : d.target === 'ally' ? allies : d.target === 'sol' ? (alive(s) ? [s.key] : []) : [];
          if (d.target === 'sol' && !o.targets.length) { o.ok = false; o.why = 'Sol is down'; }
          add(id, o);
        }
        add('lunara', { ok: !B.lunara, why: B.lunara ? 'once a battle' : '', targets: foes });
        if (knows(h, 'envoi')) {
          const ok = !B.envoi && alive(s) && s.heat >= SU.envoi.heatNeed;
          add('envoi', { ok, why: B.envoi ? 'once a battle' : ok ? '' : 'Sol needs 70 Heat', targets: foes });
        }
        add('defend', {});
        if (B.ends.canFlee) add('flee', {});
      } else if (h.id === 'sol') {
        if (h.inTrance) { add('highNoon', { targets: foes }); add('daybreak', { targets: foes }); }
        else add('attack', { targets: foes });
        for (const id of ['flareCut', 'sunder', 'emberRush', 'solarCrest']) {
          const d = h.def.moves[id], need = d.heatAll || -d.heat, ok = h.inTrance || h.heat >= need;
          add(id, { heat: need, ok, why: ok ? '' : 'Heat', targets: foes });
        }
        if (knows(h, 'stoopRise')) { const ok = h.inTrance || h.heat >= 40; add('stoopRise', { heat: 40, ok, why: ok ? '' : 'Heat', targets: foes }); }
        const hal = B.foes.find((u) => u.id === 'halcyon' && alive(u));
        if (knows(h, 'kestrel') && hal && !B.kestrelUsed) {
          // Sol knows her once she has seen her fight: from Halcyon's third turn, at half her HP, or as soon as she takes
          // Warden's Vow, Sol's own stance (lore answer 2: Sol knows the stance, not the face), whichever comes first
          const ok = hal.acted >= 2 || hal.hp <= hal.maxHp * 0.5 || !!hal.vowed;
          add('kestrel', { ok, why: ok ? '' : 'not yet', targets: [hal.key] });
        }
        add('guard', {});
        if (B.ends.canFlee) add('flee', {});
      }
      for (const id in B.herbs) {
        if (!(B.herbs[id] > 0)) continue;
        const d = RL.HERBS[id];
        let t = d.target === 'ally' || d.target === 'allies' ? allies : d.target === 'fallen' ? fallen : d.target === 'io' ? allies.filter((k) => k === 'io') : allies.filter((k) => k === 'sol');
        if (d.target === 'allies' || d.target === 'party') t = [];
        const ok = d.target === 'fallen' ? fallen.length > 0 : d.target === 'party' ? !B.might : d.target === 'allies' || t.length > 0;
        out.push({ id: 'herb:' + id, herb: id, name: d.name + ' (' + B.herbs[id] + ')', kind: 'item', ok, why: ok ? '' : d.target === 'party' ? 'already used' : 'nobody to use it on', targets: t });
      }
      return out;
    }

    // burn: whether Sol was in Sunburn as the move began (an Art that spends her Heat still lands hot).
    // Moonsteel's moon edge waits for a move with no element of its own, so a Sun Art doesn't waste it
    function strike(h, f, d, hits, burn) {
      if (!alive(f)) f = firstFoe();
      if (!f) return;
      if (f.evade && d.target === 'foe') { f.evade = 0; emit({ t: 'miss', from: h.key, to: f.key }); return; }
      const moon = h.moonNext && !d.element, el = d.element || (moon ? 'moon' : null);
      if (burn === undefined) burn = sunburnOn(h);
      let cut = false;
      for (const base of hits || d.hits) {
        if (!alive(f)) break;
        hitFoe(h, f, base, el, burn);
        // a heavy blade blow severs one of the Bramble Horror's canes (it keeps at least three)
        if (!cut && d.physical && f.def.canes && base >= 300 && f.canes > 3 && alive(f)) { cut = true; f.canes--; emit({ t: 'cane', who: f.key, left: f.canes }); }
      }
      if (moon) h.moonNext = false;
      if (d.physical && alive(f) && f.vow > 0 && alive(h)) { emit({ t: 'counter', who: f.key, to: h.key }); hitHero(f, h, f.vow, { counter: true }); }
      if (d.bind && alive(f)) { f.bound = true; f.atb = Math.max(0, f.atb - d.bind); emit({ t: 'bound', to: f.key }); }
      if (d.sunder && alive(f)) { f.sunder = d.sunder; emit({ t: 'sundered', to: f.key }); }
    }
    function useHerb(h, id, tgt) {
      const d = RL.HERBS[id];
      B.herbs[id]--; B.stats.herbsUsed++;
      emit({ t: 'herb', who: h.key, herb: id, name: d.name, to: tgt ? tgt.key : null });
      if (d.revive) { if (tgt && !alive(tgt)) revive(tgt, d.revive); return; }
      if (d.heal) { if (d.target === 'allies') for (const a of living('hero')) heal(h, a, d.heal); else heal(h, tgt, d.heal); return; }
      if (d.mp && tgt) { const n = Math.round(d.mp * RL.mpScale(tgt.level)); tgt.mp = Math.min(tgt.maxMp, tgt.mp + n); emit({ t: 'mp', to: tgt.key, n }); }
      if (d.heat && tgt && !tgt.inTrance) { tgt.heat = Math.min(HE.sol.heat.max, tgt.heat + d.heat); emit({ t: 'heat', to: tgt.key, n: d.heat }); }
      if (d.might) { B.might = d.might; emit({ t: 'might', n: d.might }); }
    }
    function heroAct(h, id, tgt, herb) {
      B.act++;
      if (herb) { B.t += 1.8; useHerb(h, herb, tgt); return; }
      const d = h.def.moves[id];
      emit({ t: 'move', who: h.key, move: id, name: d.name, target: tgt ? tgt.key : null });
      B.t += d.time || 2;
      // the dive lands as hot as Sol was when she rose: the rise spends her Heat, so judging it at the dive would never land hot
      const hot = id === 'stoop' && h.stoopHot != null ? h.stoopHot : sunburnOn(h);
      const c = cost(h, d); if (c) h.mp -= c;
      if (h.id === 'sol' && d.heat && !h.inTrance) h.heat = Math.max(0, Math.min(HE.sol.heat.max, h.heat + (d.heat < 0 ? d.heat : 0)));
      switch (id) {
        case 'attack': case 'flame': case 'crescent': case 'briars': case 'moonlight':
        case 'flareCut': case 'sunder': case 'emberRush': case 'daybreak': case 'highNoon': case 'stoop':
          strike(h, tgt, d, null, hot);
          if (id === 'stoop') h.stoopHot = null;
          if (id === 'attack' && h.id === 'sol' && !h.inTrance) h.heat = Math.min(HE.sol.heat.max, h.heat + d.heat);
          break;
        case 'solarCrest': {
          const spent = h.inTrance ? HE.sol.heat.max : h.heat;
          strike(h, tgt, d, [d.crest * spent], hot);
          if (!h.inTrance) h.heat = 0;
          break;
        }
        case 'stoopRise': h.hovering = tgt ? tgt.key : null; h.stoopHot = hot; emit({ t: 'hover', who: h.key }); break;
        case 'kestrel': B.kestrelUsed = true; tgt.stagger = true; emit({ t: 'kestrel', who: h.key, to: tgt.key }); break;
        case 'defend': h.defending = true; break;
        case 'flee': {
          const ok = living('foe').every((f) => f.def.alone) || rand() < 0.5;
          emit({ t: 'flee', who: h.key, ok });
          if (ok) { B.over = 'fled'; emit({ t: 'end', result: 'fled' }); }
          break;
        }
        case 'guard': h.guarding = true; break;
        case 'mend':
          if (h.inTrance) for (const a of living('hero')) heal(h, a, d.heal); else heal(h, tgt, d.heal);
          break;
        case 'waxing': for (const a of living('hero')) heal(h, a, d.heal); break;
        case 'moonsteel':
          if (alive(tgt)) { if (!tgt.inTrance) tgt.heat = Math.min(HE.sol.heat.max, tgt.heat + d.heat); tgt.moonNext = true; emit({ t: 'heat', to: tgt.key, n: d.heat }); }
          break;
        case 'harvest':
          if (alive(tgt)) { if (!tgt.inTrance) tgt.heat = Math.min(HE.sol.heat.max, tgt.heat + d.heat); emit({ t: 'heat', to: tgt.key, n: d.heat }); }
          break;
        case 'lunara': {
          const L = SU.lunara; B.lunara = 1; B.lunaraAt = tgt ? tgt.key : null; B.stats.summons.push('lunara');
          emit({ t: 'summon', who: 'lunara' });
          for (const a of B.heroes) { if (alive(a)) healPct(h, a, L.heal); else revive(a, L.revive); }
          break;
        }
        case 'envoi': {
          const s = hero('sol'); B.envoi = 1; B.ward = true; B.envoiAt = tgt ? tgt.key : null; B.stats.summons.push('envoi');
          if (!s.inTrance) s.heat = 0;
          emit({ t: 'summon', who: 'envoi' });
          break;
        }
      }
    }
    // the summons' strikes, when Io's gauge next fills: Envoi wraps its foe and Io still takes her turn; Lunara's
    // Silver Requiem takes Io's turn (the six beams fall on any foe, Moonfall on the one Io chose)
    function summonStrike(io, who) {
      const S = SU[who]; B.act++;
      const pick = () => { const at = unit(who === 'envoi' ? B.envoiAt : B.lunaraAt); return alive(at) ? at : living('foe').reduce((a, b) => (b.hp > a.hp ? b : a), firstFoe()); };
      emit({ t: 'strike', who });
      B.t += S.time;
      const last = S.hits.length - 1;
      S.hits.forEach((base, i) => {
        if (!living('foe').length) return;
        const f = who === 'lunara' && i < last ? living('foe')[Math.floor(rand() * living('foe').length)] : pick();
        hitFoe(io, f, base, S.element, false);
      });
      if (who === 'envoi') {
        B.envoi = 2; B.ward = false;
        // lore answer 12: its fire ends the Frost Dust slow. The blow waiting in the frost still lands, as the party
        // speeds back up (Chris, October 3)
        if (B.frost > 0) frostEnds('envoi');
      } else B.lunara = 2;
      emit({ t: 'leave', who });
    }
    function heroTurnStart(h) {
      h.atb = 0; h.defending = false; h.guarding = false; h.severed = false;
      emit({ t: 'turn', who: h.key });
      if (h.id === 'io' && B.envoi === 1) { summonStrike(h, 'envoi'); if (checkEnd()) return 'end'; }
      if (h.id === 'io' && B.lunara === 1) { summonStrike(h, 'lunara'); B.turns++; checkEnd(); return 'auto'; }
      if (h.hovering) {
        const f = unit(h.hovering); h.hovering = null;
        heroAct(h, 'stoop', alive(f) ? f : firstFoe());
        afterHero(h, h.def.moves.stoop); return 'auto';
      }
      if (h.tranceReady) {
        h.tranceReady = false; h.inTrance = true; h.tranceLeft = TR.turns; h.trance = 1; B.t += TR.time || 0;
        if (h.id === 'sol') { h.heatBefore = h.heat; h.heat = HE.sol.heat.max; }
        emit({ t: 'trance', who: h.key });
      }
      return 'choose';
    }
    function afterHero(h, d) {
      if (alive(h) && h.id === 'sol' && !h.inTrance && h.heat >= HE.sol.sunburn.at) {
        const n = Math.min(h.hp - 1, Math.round(h.maxHp * HE.sol.sunburn.burn));
        if (n > 0) { h.hp -= n; emit({ t: 'burn', to: h.key, n }); lowMark(); }
      }
      if (h.inTrance && d) {
        h.tranceLeft--;
        if (d.ends || h.tranceLeft <= 0) {
          h.inTrance = false; h.trance = 0;
          if (h.id === 'sol') h.heat = h.heatBefore;
          emit({ t: 'tranceEnds', who: h.key });
        }
      }
      B.turns++;
      checkEnd();
    }

    // ---------- the public surface ----------
    function nextReady() {
      B.queue = B.queue.filter(alive);
      let i = B.queue.findIndex((u) => u.side === 'hero');
      if (i < 0) i = 0;
      return B.queue.splice(i, 1)[0];
    }
    B.turn = function () {
      B.log = [];
      if (B.cur) throw new Error('waiting for ' + B.cur.key + ' to choose');
      if (!B.over && !B.queue.length) advance(Infinity);
      if (B.over) return { type: 'end', result: B.over, log: B.log };
      const u = nextReady();
      if (u.side === 'foe') { foeTurn(u); return { type: B.over ? 'end' : 'auto', result: B.over, unit: u, log: B.log }; }
      const r = heroTurnStart(u);
      if (r === 'choose' && !B.over) { B.cur = u; return { type: 'choose', unit: u, options: options(u), log: B.log }; }
      return { type: B.over ? 'end' : 'auto', result: B.over, unit: u, log: B.log };
    };
    B.choose = function (id, targetKey) {
      const h = B.cur; if (!h) throw new Error('nobody is choosing');
      const o = options(h).find((x) => x.id === id);
      if (!o) throw new Error(h.key + " can't use " + id);
      if (!o.ok) throw new Error(h.key + " can't use " + id + ' now: ' + o.why);
      let tgt = null;
      if (o.targets.length) tgt = unit(o.targets.includes(targetKey) ? targetKey : o.targets[0]);
      B.log = []; B.cur = null;
      heroAct(h, o.herb ? null : id, tgt, o.herb);
      afterHero(h, o.herb ? null : h.def.moves[id]);
      return B.log;
    };
    // for the battle screen: run the gauges in real time; returns anything that happened (Frost Dust landing)
    B.tick = function (dt) { B.log = []; if (!B.cur && !B.over) advance(dt); return B.log; };
    B.ready = () => B.queue.length > 0;
    B.options = options;
    B.unit = unit; B.hero = hero; B.living = living; B.alive = alive;
    B.result = function () {
      return {
        outcome: B.over, time: B.t, gaugeTime: B.gaugeT, turns: B.turns, low: B.stats.low, downs: B.stats.downs,
        herbsUsed: B.stats.herbsUsed, summons: B.stats.summons.slice(), herbs: Object.assign({}, B.herbs),
        heroes: B.heroes.map((h) => ({ id: h.id, hp: h.hp, maxHp: h.maxHp, mp: h.mp, maxMp: h.maxMp })),
        foes: B.foes.map((f) => ({ key: f.key, hp: f.hp, maxHp: f.maxHp })),
        // setup.reward scales a fight's experience and shards (a wild fight in the game: rules.js WILD_REWARD)
        xp: B.over === 'win' || B.over === 'retreat' ? Math.round(B.foes.reduce((s, f) => s + RL.grows((f.solo && f.def.xpSolo) || f.def.xp, f.level), 0) * (setup.reward || 1)) : 0,
        shards: B.over === 'win' || B.over === 'retreat' ? Math.round(B.foes.reduce((s, f) => s + RL.grows((f.solo && f.def.shardsSolo) || f.def.shards, f.level), 0) * (setup.reward || 1)) : 0,
      };
    };
    return B;
  }

  G.BattleEngine = { create, rng };
})(typeof globalThis !== 'undefined' ? globalThis : window);
