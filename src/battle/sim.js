// sim.js: the balance simulator (plan phase 2). It plays each fight in the game thousands of times with three play
// styles and reports how often each wins, how long the fights take and how close they run. The fights are the plan's:
// the first fight, the wild fights of each band, the four gates and the finale. Runs in the browser (the balance demo)
// and in Node (tools/balance.mjs). Needs rules.js and engine.js. Defines globalThis.BattleSim.
//
// The play styles (the players Chris describes, October 2):
//   careless: picks moves almost at random, Attack most often; heals only in the red, and only half the time; never
//             plans for a big blow
//   sensible: the attentive player, the average one once they have learned the spells: heals anyone under about half,
//             saves MP for healing, uses the spell the foe is weak to, herbs when out of MP, Lunara when the party is low
//   expert:   heals before the next big hit could land, shields against a charged move it can see coming, keeps Sol in
//             Sunburn, sunders bosses, binds them, uses each summon at the right moment
(function (G) {
  'use strict';
  const THINK = 1.5; // seconds a player spends on each menu, added to the fight's length
  // an attentive player walks away from the Bramble Colossus once a fallen hero can't be brought back, or when every
  // hero is under this share of her HP
  let FLEE_LOW = 0.42;

  // ---------- the fights ----------
  // each band's wild packs: about a minute to a minute and a half for a sensible player, and a careless one still wins
  // most of them; three wraiths together are kept for Dawnroost
  // A Bramble Horror ('bramble?') is always met alone, in one wild fight in five; its form is rolled from its band's
  // (Chris, October 3): the Ancient Crown, the worst of them, only from the third band on
  const BAND_PACKS = {
    1: [['wisp', 'wisp'], ['wraith'], ['wisp', 'wraith'], ['wisp', 'wisp', 'wisp'], ['bramble?']],
    2: [['wisp', 'wraith'], ['wraith', 'wraith'], ['wraith', 'wisp', 'wisp'], ['wisp', 'wisp', 'wisp'], ['bramble?']],
    3: [['wraith', 'wraith'], ['wraith', 'wisp', 'wisp'], ['frostWisp', 'frostWisp', 'wraith'], ['wraith', 'frostWisp'], ['bramble?']],
    4: [['frostWisp', 'frostWisp', 'wraith'], ['frostWisp', 'frostWisp', 'frostWisp'], ['wraith', 'wraith', 'frostWisp'], ['wraith', 'wraith'], ['bramble?']],
  };
  const BRAMBLE_FORMS = {
    1: ['bramble', 'brambleAmbush'],
    2: ['bramble', 'brambleAmbush', 'brambleTowering'],
    3: ['bramble', 'brambleTowering', 'brambleAncient'],
    4: ['brambleTowering', 'brambleAncient'],
  };
  const formOf = (id, band, rand) => (id === 'bramble?' ? BRAMBLE_FORMS[band][Math.floor(rand() * BRAMBLE_FORMS[band].length)] : id);
  // the Bramble Colossus, the last band's great wild foe: about one wild fight in twelve there, never in the first three
  // after the party reaches the band, always alone (handoff, October 3)
  const COLOSSUS = { band: 4, chance: 1 / 12, after: 3 };
  // a wild fight's pack: the Colossus when it comes (seen: how many of the band's wild fights the party has had already)
  function wildPack(band, rand, seen) {
    if (band === COLOSSUS.band && (seen == null || seen >= COLOSSUS.after) && rand() < COLOSSUS.chance) return ['colossus'];
    const packs = BAND_PACKS[band]; return packs[Math.floor(rand() * packs.length)];
  }
  // the party carries one of each herb (Chris, October 3); out in the wilds it has the common three
  const BAGS = {
    wild: { moonpetal: 1, mugwort: 1, nightrose: 1 },
    gate: { moonpetal: 1, lavender: 1, mugwort: 1, emberLily: 1, nightrose: 1 },
    finale: { moonpetal: 1, lavender: 1, mugwort: 1, emberLily: 1, nightrose: 1 },
  };
  const bandOf = (L) => (L <= 5 ? 1 : L <= 10 ? 2 : L <= 15 ? 3 : 4);
  // a wild foe's level: any level in its band's range, whatever the party's level (Chris, October 2). A band is
  // dangerous to enter and easy by its end, and a stronger foe is worth more experience
  const BAND_LEVELS = { 1: [1, 5], 2: [6, 10], 3: [11, 15], 4: [16, 20] };
  const wildLevel = (band, rand) => { const [lo, hi] = BAND_LEVELS[band]; return lo + Math.floor(rand() * (hi - lo + 1)); };
  // the story flags a party has at a level when it isn't in the gate fight that grants them
  const flagsAt = (L) => ({ party: true, refit: L > 5, envoi: L > 10, stoop: L > 15 });
  const FIGHTS = {
    first: {
      name: 'The first fight', note: 'Io alone against the Night square wraith, as in the demo', level: 1, levels: [1, 3],
      setup: (L) => ({ party: [{ id: 'io', level: L }], foes: [{ id: 'wraith', level: 1 }], flags: {}, herbs: {} }),
    },
    wild: {
      name: 'Wild fights', note: "a random pack from the party's band, each foe at a level in the band's range", level: 3, levels: [2, 20],
      setup: (L, rand) => {
        const b = bandOf(L), pack = wildPack(b, rand);
        return { party: [{ id: 'io', level: L }, { id: 'sol', level: L }], foes: pack.map((id) => ({ id: formOf(id, b, rand), level: wildLevel(b, rand) })), flags: flagsAt(L), herbs: BAGS.wild };
      },
    },
    // the wild fights without the Bramble Horror (the packs), and the Bramble Horror as the wilds bring it: its band's
    // form, at a level rolled in the band's range
    packs: {
      name: 'Wild packs', note: 'a random pack of wisps and wraiths from the band, as above, without the Bramble Horror', level: 3, levels: [2, 20],
      setup: (L, rand) => {
        const b = bandOf(L), packs = BAND_PACKS[b].filter((p) => p[0] !== 'bramble?'), pack = packs[Math.floor(rand() * packs.length)];
        return { party: [{ id: 'io', level: L }, { id: 'sol', level: L }], foes: pack.map((id) => ({ id, level: wildLevel(b, rand) })), flags: flagsAt(L), herbs: BAGS.wild };
      },
    },
    wildBramble: {
      name: 'Wild bramble', note: "the Bramble Horror as the wilds bring it: its band's form, at a level in the band's range", level: 9, levels: [2, 20],
      setup: (L, rand) => { const b = bandOf(L); return { party: [{ id: 'io', level: L }, { id: 'sol', level: L }], foes: [{ id: formOf('bramble?', b, rand), level: wildLevel(b, rand) }], flags: flagsAt(L), herbs: BAGS.wild }; },
    },
    // the Bramble Horror alone, at the party's own level
    bramble: {
      name: 'Bramble Horror', note: 'the Classic Horror alone, at the party’s level', level: 9, levels: [1, 20],
      setup: (L) => ({ party: [{ id: 'io', level: L }, { id: 'sol', level: L }], foes: [{ id: 'bramble', level: L }], flags: flagsAt(L), herbs: BAGS.wild }),
    },
    // the Bramble Colossus alone, at the party's level, where the party can flee (it is rooted, so fleeing always works)
    colossus: {
      name: 'Bramble Colossus', note: 'the Bramble Colossus alone, at the party’s level; the party can flee', level: 19, levels: [16, 20],
      setup: (L) => ({ party: [{ id: 'io', level: L }, { id: 'sol', level: L }], foes: [{ id: 'colossus', level: L }], flags: flagsAt(L), herbs: BAGS.wild, ends: { canFlee: true } }),
    },
    brambleAncient: {
      name: 'Ancient Crown', note: 'the Ancient Crown alone, at the party’s level', level: 14, levels: [11, 20],
      setup: (L) => ({ party: [{ id: 'io', level: L }, { id: 'sol', level: L }], foes: [{ id: 'brambleAncient', level: L }], flags: flagsAt(L), herbs: BAGS.wild }),
    },
    greatWraith: {
      name: 'The great wraith', note: "the level 5 gate, at Bogmire's dark heart", level: 5, levels: [3, 8],
      setup: (L) => ({ party: [{ id: 'io', level: L }, { id: 'sol', level: L }], foes: [{ id: 'greatWraith', level: 5 }], flags: { party: true }, herbs: BAGS.gate }),
    },
    dawnroost: {
      name: 'Dawnroost', note: 'the level 10 gate: three level 12 wraiths at the living node, without Envoi', level: 10, levels: [8, 13],
      setup: (L) => ({ party: [{ id: 'io', level: L }, { id: 'sol', level: L }], foes: [{ id: 'wraith', level: 12 }, { id: 'wraith', level: 12 }, { id: 'wraith', level: 12 }], flags: { party: true, refit: true }, herbs: BAGS.gate }),
    },
    halcyon: {
      name: "Halcyon's ambush", note: 'the level 15 gate: Halcyon at 20; it ends when the party falls, or when she is down to 20% and retreats', level: 15, levels: [15, 20],
      setup: (L) => ({ party: [{ id: 'io', level: L }, { id: 'sol', level: L }], foes: [{ id: 'halcyon' }], flags: { party: true, refit: true, envoi: true, kestrel: true }, herbs: BAGS.gate, ends: { retreat: { foe: 'halcyon', below: 0.2 } } }),
    },
    finale: {
      // at Noctara's side Halcyon fights at a little over a third of her ambush strength: Blackout gives her extra
      // blows, and at full strength the two of them end the fight before it can become a race. The cold deepens for
      // both
      name: 'The finale', note: 'Noctara with Halcyon, both at 20, at the dead Moonwell; the cold deepens every turn', level: 20, levels: [17, 20],
      setup: (L) => ({ party: [{ id: 'io', level: L }, { id: 'sol', level: L }], foes: [{ id: 'halcyon', hpMul: 0.4, dmgMul: 0.35, rage: G.BattleRules.FOES.noctara.rage }, { id: 'noctara' }], flags: { party: true, refit: true, envoi: true, stoop: true }, herbs: BAGS.finale }),
    },
  };

  // ---------- the balance targets (plan, phase 2) ----------
  // each: a fight at a level, a play style, and the range its win rate (or its fight length) must land in
  const TARGETS = [
    { fight: 'first', level: 1, policy: 'careless', win: [0.45, 0.75], why: 'The first fight: a careless player loses it often' },
    { fight: 'first', level: 1, policy: 'sensible', win: [0.99, 1], why: 'The first fight: a player who pays attention doesn’t lose it' },
    // the wild packs (four wild fights in five): as before the Bramble Horror came
    ...[2, 5, 8, 13, 18, 20].map((L) => ({ fight: 'packs', level: L, policy: 'careless', win: [0.8, 1], why: 'Wild packs: once into a band, most are won even when playing carelessly' })),
    ...[6, 11, 16].map((L) => ({ fight: 'packs', level: L, policy: 'careless', win: [0.3, 0.9], why: 'Wild packs on entering a band: a careless player loses some' })),
    ...[2, 5, 8, 13, 18, 20].map((L) => ({ fight: 'packs', level: L, policy: 'sensible', win: [0.97, 1], minutes: [0.6, 2.2], why: 'Wild packs: about a minute or two' })),
    ...[6, 11, 16].map((L) => ({ fight: 'packs', level: L, policy: 'sensible', win: [0.9, 1], minutes: [0.6, 2.5], why: 'Wild packs on entering a band: an attentive player loses now and then' })),
    // the Bramble Horror as the wilds bring it (one wild fight in five), at a level rolled in the band's range: Chris's rule
    // for how hard a fight is. A decent player always beats a lower-level foe, beats one at her own level about half the
    // time, and seldom beats a higher-level one (October 3)
    ...[8, 13, 18].map((L) => ({ fight: 'wildBramble', level: L, policy: 'sensible', win: [0.35, 0.7], why: 'A wild Bramble Horror in the middle of a band, about the party’s level: won about half the time' })),
    ...[6, 11, 16].map((L) => ({ fight: 'wildBramble', level: L, policy: 'sensible', win: [0.05, 0.35], why: 'A wild Bramble Horror on entering a band, usually above the party: seldom won' })),
    { fight: 'wildBramble', level: 20, policy: 'sensible', win: [0.75, 1], why: 'A wild Bramble Horror at the end of the game, below the party: nearly always won' },
    // the Bramble Horror, always alone and formidable (Chris, October 3): gentler in the first band, where it has no Undergrowth
    { fight: 'bramble', level: 4, policy: 'careless', win: [0.15, 0.6], why: 'The Bramble Horror in the first band: a careless player loses it more often than not' },
    { fight: 'bramble', level: 4, policy: 'sensible', win: [0.8, 1], why: 'The Bramble Horror in the first band: an attentive player usually wins' },
    ...[9, 14].map((L) => ({ fight: 'bramble', level: L, policy: 'careless', win: [0.05, 0.4], why: 'The Bramble Horror alone, at the party’s level: formidable; a careless player usually loses' })),
    ...[9, 14].map((L) => ({ fight: 'bramble', level: L, policy: 'sensible', win: [0.7, 0.92], why: 'The Bramble Horror alone, at the party’s level: an attentive player loses one in five or so' })),
    ...[4, 9, 14].map((L) => ({ fight: 'bramble', level: L, policy: 'expert', win: [0.92, 1], why: 'The Bramble Horror alone: a good player wins' })),
    ...[14, 19].map((L) => ({ fight: 'brambleAncient', level: L, policy: 'sensible', win: [0.2, 0.5], why: 'The Ancient Crown at the party’s level: the worst thing in the wilds; an attentive player wins about one time in three' })),
    ...[14, 19].map((L) => ({ fight: 'brambleAncient', level: L, policy: 'expert', win: [0.45, 0.8], why: 'The Ancient Crown at the party’s level: even a perfect player wins only a little more than half the time' })),
    // the Bramble Colossus at the party's level, from 18 to 20 (handoff, October 3): an expert wins about two times in three;
    // an attentive player about one time in four, and flees when it goes badly, so seldom loses
    ...[18, 19, 20].map((L) => ({ fight: 'colossus', level: L, policy: 'expert', win: [0.55, 0.8], why: 'The Bramble Colossus at the party’s level: an expert wins about two times in three' })),
    ...[18, 19, 20].map((L) => ({ fight: 'colossus', level: L, policy: 'sensible', win: [0.15, 0.4], lose: [0, 0.15], why: 'The Bramble Colossus at the party’s level: an attentive player wins about one time in four, and flees otherwise' })),
    { fight: 'greatWraith', level: 5, policy: 'careless', win: [0.2, 0.6], why: 'The level 5 gate: a little harder than the wild fights' },
    { fight: 'greatWraith', level: 5, policy: 'sensible', win: [0.8, 0.96], why: 'The level 5 gate: a little harder than the wild fights' },
    { fight: 'greatWraith', level: 5, policy: 'expert', win: [0.97, 1], why: 'The level 5 gate: a good player wins' },
    { fight: 'dawnroost', level: 10, policy: 'sensible', win: [0.8, 0.96], why: 'The level 10 gate: the largest group of stronger wraiths so far' },
    { fight: 'dawnroost', level: 10, policy: 'expert', win: [0.93, 1], why: 'The level 10 gate: a good player wins' },
    { fight: 'halcyon', level: 15, policy: 'expert', win: [0, 0.1], why: 'Halcyon at 15: overwhelming' },
    { fight: 'halcyon', level: 18, policy: 'expert', win: [0.4, 0.85], why: 'Halcyon: leveling past 15 is what makes her retreat' },
    { fight: 'halcyon', level: 20, policy: 'expert', win: [0.8, 1], why: 'Halcyon: leveling past 15 is what makes her retreat' },
    { fight: 'finale', level: 20, policy: 'expert', win: [0.6, 0.85], why: 'The finale at 20: a perfect player wins about three times in four, so one who plays well wins about half the time' },
    { fight: 'finale', level: 20, policy: 'sensible', win: [0.02, 0.1], why: 'The finale at 20: an attentive player seldom wins; it takes being locked in' },
    { fight: 'finale', level: 19, policy: 'expert', win: [0, 0.1], margin: 0.45, why: 'The finale at 19: no real chance' },
    { fight: 'finale', level: 18, policy: 'expert', win: [0, 0.02], why: 'The finale below 19 cannot be won' },
  ];
  function check(t, r) {
    const fails = [];
    if (t.win && (r.winRate < t.win[0] || r.winRate > t.win[1])) fails.push('win rate');
    if (t.lose && (r.loseRate < t.lose[0] || r.loseRate > t.lose[1])) fails.push('loss rate');
    if (t.minutes && (r.minutes.median < t.minutes[0] || r.minutes.median > t.minutes[1])) fails.push('length');
    if (t.margin != null && r.loseMargin != null && r.loseMargin > t.margin) fails.push('margin');
    return fails;
  }

  // ---------- experience and shards along the way ----------
  // the average wild fight's experience and shards at a level (its band's packs, at every level in the band's range),
  // and how many wild fights a level takes
  function economy() {
    const RL = G.BattleRules, rows = [];
    for (let L = 1; L < RL.MAX_LEVEL; L++) {
      const b = bandOf(Math.max(2, L)), packs = BAND_PACKS[b], [lo, hi] = BAND_LEVELS[b];
      let xp = 0, sh = 0, n = 0;
      for (const p of packs) for (let lv = lo; lv <= hi; lv++, n++) for (const id of p) {
        const forms = id === 'bramble?' ? BRAMBLE_FORMS[b] : [id];
        for (const f of forms) { xp += RL.grows(RL.FOES[f].xp, lv) / forms.length; sh += RL.grows(RL.FOES[f].shards, lv) / forms.length; }
      }
      xp /= n; sh /= n;
      // the Bramble Colossus comes in one wild fight in twelve in its band, at a level in the band's range
      if (b === COLOSSUS.band) {
        let cx = 0, cs = 0; for (let lv = lo; lv <= hi; lv++) { cx += RL.grows(RL.FOES.colossus.xp, lv); cs += RL.grows(RL.FOES.colossus.shards, lv); }
        const c = COLOSSUS.chance; xp = xp * (1 - c) + c * cx / (hi - lo + 1); sh = sh * (1 - c) + c * cs / (hi - lo + 1);
      }
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
        const k = RL.scale(f.level) * f.dmgMul * ((f.solo && f.def.dmgSolo) || 1) * (1 + f.rage * f.acted) * ((B.tune && B.tune.foeDmg && B.tune.foeDmg[f.id]) || 1) * (f.def.canes ? 1 - 0.08 * (f.def.canes - f.canes) : 1);
        for (const id in f.def.moves) {
          const m = f.def.moves[id];
          if (!m.hits) continue;
          if (m.below && (f.used[id] || f.hp > f.maxHp * m.below) && f.charging !== id) continue;
          if (m.minLevel && f.level < m.minLevel && !f.def.allMoves) continue;
          // a move that only follows another (the Colossus's Devour after its Siren Bloom) counts only while that one gathers
          if (m.weight === 0 && !(f.charging && f.def.moves[f.charging].then === id)) continue;
          const hits = (f.solo && m.hitsSolo) || m.hits;
          let n = (hits.reduce((a, b) => a + b, 0) + (m.seize || 0) + (m.shock ? m.shock.reduce((a, b) => a + b, 0) : 0)) * k * 1.25 * (B.lunara === 1 ? 0.6 : 1);
          if (m.blackout) n = 300 * 1.25 * k * 1.25;
          worst = Math.max(worst, n);
        }
        each.push(worst);
      }
      each.sort((a, b) => b - a);
      const n = each.reduce((a, w, i) => a + (i ? w * 0.75 : w), 0) * (h.defending || h.guarding ? 0.5 : 1);
      return n;
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
      // a Bramble Horror above the party's level: walk away from it (it can't follow)
      if (v.ok('flee') && v.foes.some((f) => f.def.alone && f.level > u.level)) return ['flee'];
      // the Bramble Colossus: an attentive player tries it, and walks away when it goes badly, while it is still strong
      const col = v.foes.find((f) => f.def.heart);
      if (col && v.ok('flee') && col.hp > col.maxHp * 0.25) {
        const noRevive = v.fallen.length && !v.ok('lunara') && !v.ok('herb:nightrose');
        if (noRevive || v.heroes.every((h) => v.pct(h) < FLEE_LOW)) return ['flee'];
      }
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
        if (v.charging && v.charging.def.fearsFire && v.ok('flame')) return ['flame', v.charging.key];
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
      if (v.boss && v.ok('herb:emberLily')) return ['herb:emberLily'];
      if (u.heat >= 100 && v.ok('solarCrest')) return ['solarCrest', tgt];
      if (v.ok('stoopRise') && u.heat >= 70) return ['stoopRise', tgt];
      return ['attack', tgt];
    },

    expert(B, s, rand) {
      const v = look(B, s), u = v.u, RL = v.RL, col = v.foes.find((f) => f.def.heart);
      // a Bramble Horror two levels up, or an Ancient Crown above the party: walk away from it
      if (v.ok('flee') && v.foes.some((f) => f.def.alone && (f.level > u.level + 1 || (f.id === 'brambleAncient' && f.level > u.level)))) return ['flee'];
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
        // a Bramble Horror holds out its Lure: fire breaks it
        if (v.charging && v.charging.def.fearsFire && v.ok('flame')) return ['flame', v.charging.key];
        // a charged move is coming: block it whole, or soften it
        if (v.charging) {
          if (v.ok('envoi') && !B.ward) return ['envoi', tgt];
          if (v.ok('lunara')) return ['lunara', tgt];
        }
        if (atRisk.length) {
          if (atRisk.length > 1 && v.ok('mend') && u.inTrance) return ['mend', atRisk[0].key];
          if (atRisk.length > 1 && v.ok('waxing')) return ['waxing'];
          if (v.ok('mend')) return ['mend', atRisk[0].key];
          if (atRisk.length > 1 && v.ok('herb:lavender')) return ['herb:lavender'];
          if (v.ok('herb:moonpetal')) return ['herb:moonpetal', atRisk[0].key];
        }
        if (v.ok('moonlight')) return ['moonlight', tgt];
        // the Bramble Colossus's heart is bare: Flame Bolt lands on it double, and the fire makes it recoil
        if (col && col.open && !col.charging && v.ok('flame') && u.mp >= 12 + 16) return ['flame', col.key];
        if (u.mp < 36 && v.ok('herb:mugwort')) return ['herb:mugwort', u.key];
        if (v.ok('envoi') && v.boss && v.foes.reduce((a, f) => a + f.hp, 0) > 3240 * RL.scale(u.level)) return ['envoi', tgt];
        const avg = v.heroes.reduce((a, h) => a + v.pct(h), 0) / v.heroes.length;
        if (v.ok('lunara') && (avg < 0.5 || (!v.boss && v.foes.length > 2 && avg < 0.7))) return ['lunara', tgt];
        if (v.boss && v.ok('briars') && !v.boss.bound && v.boss.atb > 0.45 && u.mp >= 18 + 32) return ['briars', v.boss.key];
        // Heat for Sol: Harvest Moon when she is cold (or to light Envoi's heart), Moonsteel to top her up
        const solCold = v.sol && B.alive(v.sol) && !v.sol.inTrance;
        if (solCold && v.ok('harvest') && v.sol.heat < 30 && u.mp > u.maxMp * 0.5) return ['harvest', v.sol.key];
        if (solCold && v.sol.heat < 50 && v.ok('moonsteel') && u.mp > u.maxMp * 0.5) return ['moonsteel', v.sol.key];
        const top = v.heroes.filter((h) => !h.severed && v.pct(h) < 0.6).sort((a, b) => v.pct(a) - v.pct(b));
        if (top.length && v.ok('mend')) return ['mend', top[0].key];
        return [ioDamage(v, mainFoe, 32), tgt];
      }
      // Sol
      const hal = v.foes.find((f) => f.id === 'halcyon');
      if (v.ok('kestrel') && hal) return ['kestrel', hal.key];
      // a charged blow will land before her next turn: rise for Kestrel Stoop and be out of reach when it falls
      if (v.charging && v.ok('stoopRise')) {
        const f = v.charging, foeT = (1 - f.atb) * f.def.atb * (f.bound ? 1 / RL.STATUS.bindSlow : 1), solT = u.def.atb / (B.frost > 0 ? RL.STATUS.frostSlow : 1);
        if (foeT < solT) return ['stoopRise', tgt];
      }
      // a Bramble Horror's Lure holds Io: a sun blade breaks it
      if (v.charging && v.charging.def.fearsFire && v.io && v.io.lured) { if (v.ok('highNoon')) return ['highNoon', v.charging.key]; if (v.ok('flareCut')) return ['flareCut', v.charging.key]; }
      // the Bramble Colossus: a sun blade breaks its Siren Bloom; while its heart is bare, her biggest blow lands double
      if (col && col.open) {
        if (v.ok('highNoon')) return ['highNoon', col.key];
        if (u.heat >= 100 && v.ok('solarCrest')) return ['solarCrest', col.key];
        if (v.ok('flareCut')) return ['flareCut', col.key];
      }
      if (v.ok('highNoon') && (u.tranceLeft <= 1 || mainFoe.hp < mainFoe.maxHp * 0.08)) return ['highNoon', tgt];
      if (v.ok('daybreak') && !vowed(mainFoe)) return ['daybreak', tgt];
      if (v.fallen.length && v.ok('herb:nightrose')) return ['herb:nightrose', v.fallen[0].key];
      // Guard covers Io, but in a race (the finale's deepening cold) a turn spent guarding loses more than it saves
      const race = v.foes.some((f) => f.rage > 0);
      if (!race && v.io && B.alive(v.io) && v.io.hp < v.danger(v.io) && v.ok('guard')) return ['guard'];
      // Io can't keep up (down, out of MP, or in danger herself): Sol uses the herbs
      if (atRisk.length && (!v.io || !B.alive(v.io) || v.io.mp < 16 || atRisk.length > 1)) {
        if (atRisk.length > 1 && v.ok('herb:lavender')) return ['herb:lavender'];
        if (v.ok('herb:moonpetal')) return ['herb:moonpetal', atRisk[0].key];
      }
      // Ember-star Lily: early in a boss fight, or while there's nothing to hit but Warden's Vow
      if (v.ok('herb:emberLily') && v.boss && (vowed(mainFoe) || v.boss.hp > v.boss.maxHp * 0.6)) return ['herb:emberLily'];
      if (vowed(mainFoe)) return v.ok('guard') && u.heat >= 40 ? ['guard'] : ['attack', tgt];
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
    const out = { fight, level, policy, n, win: 0, retreat: 0, lose: 0, fled: 0, stalemate: 0, times: [], close: 0, downs: 0, herbs: 0, foeLeftLose: [] };
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
    out.winRate = (out.win + out.retreat) / n; out.loseRate = out.lose / n; out.fledRate = out.fled / n;
    out.minutes = { p10: q(0.1) / 60, median: q(0.5) / 60, p90: q(0.9) / 60 };
    out.closeRate = out.close / n;
    out.loseMargin = out.foeLeftLose.length ? out.foeLeftLose.reduce((a, b) => a + b, 0) / out.foeLeftLose.length : null;
    delete out.times; delete out.foeLeftLose;
    return out;
  }

  G.BattleSim = { setFleeLow: (x) => { FLEE_LOW = x; }, FIGHTS, POLICIES, BAND_PACKS, BRAMBLE_FORMS, COLOSSUS, wildPack, formOf, BAND_LEVELS, wildLevel, BAGS, TARGETS, check, economy, playOne, run, bandOf, THINK };
})(typeof globalThis !== 'undefined' ? globalThis : window);
