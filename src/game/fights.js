// fights.js: every fight in the game as a battle screen config (src/battle/screen.js, in its game mode). The story's set
// fights carry the words and settings of their demo pages (first-fight, great-wraith, dawnroost, halcyon-ambush,
// finale); wild fights roll a pack from the band (BattleSim.wildPack: the band's packs, the Bramble Horror among them,
// and in the last band, now and then, the Bramble Colossus) at levels in the band's range and play on the band's painting. The party comes in as it stands: its level, HP, MP and the story's
// flags, with one of each herb it carries to use (the menu shows how many it carries). GameFights.config(kind, party,
// opts) -> the cfg for BattleScreen.start, without `game` (the game adds it).
//   kind: 'first' | 'wild' | 'greatWraith' | 'dawnroost' | 'halcyon' | 'finale'
//   party: { level, xp, hp: { io, sol }, mp, herbs, flags, keepsakes } (hp and mp null mean full; keepsakes: the hidden ones found)
//   opts: { band, scene, seen, pack } for a wild fight (seen: the band's wild fights so far; pack: a set pack, for tests)
// Needs rules.js, sim.js, the models and the stage scenes. Defines window.GameFights.
(function () {
  'use strict';
  const RL = () => window.BattleRules, SIM = () => window.BattleSim;
  // where the party and the foes stand on each painting (painting pixels)
  const PLACES = {
    'night-square': { io: [560, 812], sol: [650, 868], slots: [[860, 805], [950, 765], [925, 885]] },
    'thornwood-bridge': { io: [600, 760], sol: [690, 815], slots: [[880, 690], [970, 650], [950, 770]] },
    'gloamwood-road': { io: [560, 800], sol: [650, 860], slots: [[860, 690], [950, 650], [930, 770]] },
    'warm-road': { io: [560, 800], sol: [650, 860], slots: [[860, 690], [950, 650], [930, 770]] },
    'northern-crossroads': { io: [560, 690], sol: [645, 752], slots: [[870, 640], [955, 600], [945, 705]] },
    'frozen-road': { io: [560, 800], sol: [650, 860], slots: [[860, 690], [950, 650], [930, 770]] },
  };
  const hero = (id, at) => (id === 'io'
    ? { id: 'io', make: () => makeWitch({}), home: at, yawBias: -0.38, shadow: 0.62, tall: 2.1, kind: 'io' }
    : { id: 'sol', make: () => makeSol({}), home: at, yawBias: -0.3, shadow: 0.6, tall: 1.9, kind: 'sol', stop: 0.9 });
  const VARIANT = { bramble: 'classic', brambleAmbush: 'ambush', brambleTowering: 'towering', brambleAncient: 'ancient' };
  const bram = (tall, reach, shadow, halfW) => ({ kind: 'bramble', tall, reach, shadow, halfW, yawBias: 0.2, glow: [shadow * 1.1, 0xff3d8a], appearColor: [0.95, 0.35, 0.5] });
  const FOE_LOOK = {
    wraith: { kind: 'wraith', shadow: 0.75, tall: 2.3, yawBias: 0.45, glow: [1.6, 0x2cff7a] },
    wisp: { kind: 'wisp', shadow: 0.3, tall: 1.0, yawBias: 0.9, glow: [0.9, 0xb070ff], state: (u) => ({ level: u.level }) },
    frostWisp: { kind: 'wisp', shadow: 0.3, tall: 1.0, yawBias: 0.9, glow: [0.9, 0x9fd8ff], state: (u) => ({ level: u.level }) },
    bramble: bram(1.9, 1.0, 1.6, 1.9), brambleAmbush: bram(1.6, 1.0, 1.7, 1.9), brambleTowering: bram(2.3, 1.1, 1.4, 2.2), brambleAncient: bram(2.7, 1.5, 2.1, 2.9),
    greatWraith: { kind: 'wraith', shadow: 1.9, tall: 7.4, yawBias: 0.3, glow: [3.6, 0xffa24a], reach: 1.6, near: 3.6, fxScale: 2.8, lights: true },
    halcyon: { kind: 'halcyon', shadow: 0.62, tall: 2.11, yawBias: 0.15, glow: [1.4, 0x6f9cff], appearColor: [0.45, 0.55, 0.95], stop: 0.95 },
    noctara: { kind: 'noctara', shadow: 0.8, tall: 2.5, yawBias: 0.25, glow: [1.7, 0x8a5cff], appearColor: [0.65, 0.5, 1], downAct: 'none' },
    // the Bramble Colossus: about 8 m tall and 11 m across; the heroes stop well short of its mound, and the camera frames
    // it by its width
    colossus: { kind: 'colossus', tall: 7.8, reach: 3.2, shadow: 3.6, halfW: 5.4, yawBias: 0, glow: [3.8, 0xff3d8a], appearColor: [0.95, 0.35, 0.5], fxScale: 2.2 },
  };
  // where the party stands against the Colossus on each painting: about 8.5 m from it, as on its bench (its arms reach 9 m)
  const COLOSSUS_AT = { 'frozen-road': { io: [638, 704], sol: [712, 738], slot: [974, 557] } };
  function makeFoe(id, level, i) {
    if (id === 'wraith') return makeWraith({ level });
    if (id === 'greatWraith') return makeWraith({ level, great: true });
    if (id === 'wisp' || id === 'frostWisp') return makeWisp({ seed: i + 1, frost: id === 'frostWisp' });
    if (VARIANT[id]) return makeBramble({ variant: VARIANT[id], level });
    if (id === 'colossus') return makeBrambleColossus({ level });
    if (id === 'halcyon') return makeHalcyon({});
    if (id === 'noctara') return makeNoctara({});
    throw new Error('no foe ' + id);
  }
  // the party as the engine takes it: each hero's level, HP and MP as they stand, and the keepsake she carries, if
  // it's been found (rules.js KEEPSAKES)
  const keepsakeOf = (P, id) => (P.keepsakes && P.keepsakes[id] && RL().KEEPSAKES[id]) || null;
  function partyOf(P, solo) {
    const p = [{ id: 'io', level: P.level }];
    if (P.hp && P.hp.io != null) p[0].hp = P.hp.io;
    if (P.mp != null) p[0].mp = P.mp;
    if (keepsakeOf(P, 'io')) p[0].healMul = keepsakeOf(P, 'io').heal;
    if (!solo && P.flags && P.flags.party) {
      const s = { id: 'sol', level: P.level }; if (P.hp && P.hp.sol != null) s.hp = P.hp.sol;
      if (keepsakeOf(P, 'sol')) { s.hpMul = keepsakeOf(P, 'sol').hp; s.dmgMul = keepsakeOf(P, 'sol').damage; }
      p.push(s);
    }
    return p;
  }
  const base = (scene, P, solo) => {
    const at = PLACES[scene] || PLACES['gloamwood-road'];
    const heroes = [hero('io', at.io)]; if (!solo && P.flags.party) heroes.push(hero('sol', at.sol));
    return {
      scene, level: P.level, xp: P.xp || 0, heroes, slots: at.slots, foeLook: FOE_LOOK, makeFoe,
      makeLunara: () => makeLunara({}), makeEnvoi: P.flags.envoi ? () => makeEnvoi({}) : undefined,
    };
  };
  const flagsOf = (P, extra) => Object.assign({}, P.flags, extra || {});
  // a fight may use each herb once (rules.js BATTLE_USE), whatever the party carries; the menu shows what it carries
  const bagOf = (P) => {
    const herbs = {}, have = P.herbs || {};
    for (const id in have) if (have[id] > 0) herbs[id] = Math.min(have[id], window.BattleRules.BATTLE_USE);
    return { herbs, carried: Object.assign({}, have) };
  };

  function config(kind, P, opts) {
    opts = opts || {};
    const S = SIM();
    if (kind === 'wild') {
      // opts.seen: how many of the band's wild fights the party has had (the Colossus never comes in the first few)
      const band = opts.band || 1, rand = Math.random;
      const pack = opts.pack || S.wildPack(band, rand, opts.seen);
      const foes = pack.map((id) => ({ id: S.formOf(id, band, rand), level: S.wildLevel(band, rand) }));
      if (foes[0].id === 'colossus') return colossus(P, foes, opts);
      const scene = opts.scene || 'gloamwood-road';
      const c = base(scene, P);
      const lone = foes[0].id.startsWith('bramble');
      if (lone) { const at = PLACES[scene]; c.heroes[0].home = [at.io[0] + 40, at.io[1] - 50]; if (c.heroes[1]) c.heroes[1].home = [at.sol[0] + 40, at.sol[1] - 50]; c.slots = [at.slots[0]]; }
      return Object.assign(c, {
        fight: () => ({ party: partyOf(P), foes, flags: flagsOf(P), ...bagOf(P), ends: { canFlee: true }, reward: window.BattleRules.WILD_REWARD }),
        introMsg: lone ? (fs) => (fs[0].id === 'brambleAmbush' ? 'A low blackberry thicket grows over the road, heavy with fruit.' : 'A blackberry thicket stands by the road, lusher than it should be, and heavy with fruit.') : undefined,
        introAfter: lone ? (fs) => (fs[0].id === 'brambleAmbush' ? 'It was never a thicket. It strikes before anyone can move.' : fs[0].id === 'brambleAncient' ? 'The ground heaves. Old woody horns rise out of its crown: an Ancient Crown.' : 'The ground heaves, its roots flare, and its canes rise toward the party.') : undefined,
        quickIntro: !lone,
        attackText: (fs) => (lone ? 'The ' + fs[0].def.form + ' attacks!' : fs.length > 1 ? 'The foes close in!' : 'The ' + fs[0].name + ' attacks!'),
        winMoth: lone ? 'It thrashes once more, then collapses flat, drops its fruit, withers brown and crumbles away.' : undefined,
        winText: lone ? 'The thicket is only dead canes and fallen fruit now.' : 'The souls go home as pale moths, and the road is quiet again.',
        loseText: 'The party falls. They wake at the last rest with everything they had.',
      });
    }
    if (kind === 'first') {
      const c = base('night-square', P, true);
      c.slots = [[860, 800]]; c.foeLook = { wraith: Object.assign({}, FOE_LOOK.wraith, { shadow: 0.8, yawBias: 0.38 }) };
      return Object.assign(c, {
        bridge: true,
        // the first battle's tips, once each (handoff, section 5)
        tips: {
          menu: 'Io’s Turn gauge is full: pick a command, then its target. While anyone acts or chooses, every gauge waits.',
          trance: 'On her next turn her power wakes: Moonlore costs half, and Moonlight strikes with all of it.',
        },
        fight: () => ({ party: [Object.assign(partyOf(P, true)[0], { atb: 0.6 })], foes: [{ id: 'wraith', level: 1, atb: 0.15 }], flags: {}, ...bagOf(P) }),
        attackText: () => 'The Shadow Wraith attacks!',
        winMoth: 'A pale moth rises from the empty robe and drifts down into the Moonwell.',
        winText: 'The wraith’s robe falls empty, and its soul goes home at last as a pale moth. The Moonwell shines again.',
        loseText: 'The wraith’s shadow swallows the square. Io wakes by the Moonwell; the wraith still waits on the bridge.',
      });
    }
    if (kind === 'greatWraith') {
      const c = base('bogmire-boardwalk', P);
      c.heroes[0].home = [590, 790]; if (c.heroes[1]) c.heroes[1].home = [680, 852]; c.slots = [[920, 645]];
      return Object.assign(c, {
        fight: () => ({ party: partyOf(P), foes: [{ id: 'greatWraith', level: 5 }], flags: flagsOf(P), ...bagOf(P) }),
        introMsg: 'Every lamp and window in Bogmire has gone dark…',
        introAfter: 'The great wraith rises out of the fen, the town’s stolen lamplight burning in its ribs.',
        attackText: () => 'The great wraith attacks!',
        winMoth: 'The great wraith comes apart, and a great pale moth rises out of the empty robe.',
        winLights: true, winLightsText: 'The stolen lamplight flies home, and Bogmire’s windows glow again.', fanfare: true,
        winText: 'Bogmire has its lights back.',
        loseText: 'The party falls on the boardwalk. They wake at the last rest with everything they had, and the great wraith waits.',
      });
    }
    if (kind === 'dawnroost') {
      const c = base('dawnroost-node', P);
      c.heroes[0].home = [530, 700]; c.heroes[1].home = [615, 760]; c.slots = [[805, 645], [880, 600], [875, 722]];
      c.makeEnvoi = () => makeEnvoi({});
      return Object.assign(c, {
        fight: () => ({ party: partyOf(P), foes: [{ id: 'wraith', level: 12 }, { id: 'wraith', level: 12 }, { id: 'wraith', level: 12 }], flags: flagsOf(P), ...bagOf(P) }),
        introMsg: 'Dawnroost’s living node still burns, and its light has drawn the wraiths.',
        introAfter: 'Three wraiths, stronger than any the party has met, rise around the node.',
        attackText: () => 'The wraiths close in!',
        winMoth: 'Three pale moths rise from the empty robes and drift into the light of the node.',
        winEnvoi: true, fanfare: true,
        envoiLines: [
          'Io takes out the letters she was meant to burn, her letters to the dead, and admits she never could.',
          'She folds them into a wyrm, and Sol lights its heart from the living node.',
          'Envoi is made. It folds away until Io calls it.',
        ],
        winText: 'Envoi is made. From now on Io can call it once a battle, while Sol stands with 70 Heat or more.',
        loseText: 'The party falls in the courtyard. They wake at the last rest with everything they had, and the wraiths still circle the node.',
      });
    }
    if (kind === 'halcyon') {
      const c = base('northern-crossroads', P);
      c.heroes[0].home = [560, 690]; c.heroes[1].home = [645, 752]; c.slots = [[895, 622]];
      return Object.assign(c, {
        alias: { halcyon: 'The Gloam Knight' },
        fight: () => ({ party: partyOf(P), foes: [{ id: 'halcyon' }], flags: flagsOf(P, { kestrel: true }), ...bagOf(P), ends: { retreat: { foe: 'halcyon', below: 0.2 } } }),
        introMsg: 'The road north to the shipyard crosses an old ruined crossroads. Someone is waiting there.',
        introAfter: 'A knight in dark armor steps out of the dark, her blade already drawn.',
        attackText: () => 'The knight attacks!',
        knowLines: Object.assign([
          'Sol knows the way this knight fights. It is the way she was taught to fight, in the waystation yard, by one Warden only.',
          '“Halcyon?” Her teacher, who went north eight years ago and never came back.',
        ], { vow: 'Warden’s Vow. Sol knows that stance. “She taught me that.”' }),
        kestrelLine: 'Sol calls out the name Halcyon gave her: “It’s me. Kestrel!”',
        retreatLines: ['Halcyon steps back from them, her blade lowered.', 'The dark rises round her like smoke, and she is gone.'],
        sparedLines: ['Io is down. The knight walks toward her, blade low.', 'Sol drags herself up and stands over Io, her sword raised.', 'Halcyon’s blade stops. For a long moment she only looks at her old squire.', 'Then she steps back into the dark, and is gone.'],
        stoopLines: ['The fight has stirred an old memory: Halcyon in the waystation yard, teaching her squire to hover before she strikes.', 'Sol springs up and hangs in the air like a kestrel.'],
        spared: true,
        endTitles: { retreat: 'Halcyon retreats', lose: 'Spared' },
        endTexts: {
          retreat: 'Halcyon is gone into the dark, and the road to the shipyard is open. Sol has learned Kestrel Stoop.',
          lose: 'Halcyon spared them for her old squire’s sake. The road to the shipyard is open, and Sol has learned Kestrel Stoop.',
        },
      });
    }
    if (kind === 'finale') {
      const c = base('dead-moonwell', P);
      c.heroes[0].home = [560, 762]; c.heroes[1].home = [630, 812]; c.slots = [[750, 690], [828, 642]];
      c.foeLook = Object.assign({}, FOE_LOOK, { halcyon: Object.assign({}, FOE_LOOK.halcyon, { downAct: 'kneel', downNote: 'Halcyon falls to one knee on her planted blade, and stays there.' }) });
      return Object.assign(c, {
        fight: () => { const f = S.FIGHTS.finale.setup(P.level); return Object.assign(f, { party: partyOf(P), flags: flagsOf(P, f.flags), ...bagOf(P) }); },
        finale: true,
        introMsg: 'The dead Moonwell gives no light at all, and the moon is going out.',
        introAfter: 'Noctara the Starless waits at the well, and Halcyon stands at her side.',
        attackText: () => 'The longest night begins!',
        endingLines: [
          'Noctara staggers. Io takes out the last of her letters.',
          'Envoi’s last strike is the real sending: the letters burn for good, and their light rises.',
          'The stars come back.',
          'Noctara is not killed. She becomes night, and there are stars in it.',
          'Halcyon’s blade warms. She goes home, a pale moth rising.',
          'The longest night is over.',
        ],
        endTitles: { win: 'The longest night ends' },
        endTexts: {
          win: 'The stars are back. Io’s letters are sent at last, Noctara is night with stars in it, and Halcyon has gone home.',
          lose: 'The party falls before the dead Moonwell. They wake at the last rest with everything they had, and the night waits. The cold deepens every turn: strike hard and early, and keep Envoi’s ward and Lunara for Void Sphere.',
        },
      });
    }
    throw new Error('no fight ' + kind);
  }
  // the Bramble Colossus, the last band's great wild foe: always alone, rooted (the party can always flee), and worth three
  // times a wild fight. Its lines are placeholders for the lore conversation
  function colossus(P, foes, opts) {
    const scene = COLOSSUS_AT[opts.scene] ? opts.scene : 'frozen-road', at = COLOSSUS_AT[scene], c = base(scene, P);
    c.heroes[0].home = at.io; if (c.heroes[1]) c.heroes[1].home = at.sol; c.slots = [at.slot];
    return Object.assign(c, {
      fight: () => ({ party: partyOf(P), foes, flags: flagsOf(P), ...bagOf(P), ends: { canFlee: true }, reward: window.BattleRules.WILD_REWARD }),
      introMsg: 'Beside the frozen road stands a thicket as big as a house, green where nothing else is. The snow round it has melted.',
      introAfter: 'The ground splits. It heaves itself up out of the earth, and a great thorned bud opens on a glowing heart: a Bramble Colossus.',
      attackText: () => 'The Bramble Colossus attacks!',
      winMoth: 'Its spire cracks at the foot and topples like a tree. Its heart beats once more, and goes dark.',
      winText: 'The Bramble Colossus is felled. Where it stood, its fallen fruit is melting the snow.',
      loseText: 'The party falls among its thorns. They wake at the last rest with everything they had.',
      endTexts: { fled: 'The party backs away down the road. It can’t follow: it is rooted.' },
      fanfare: true,
    });
  }
  // the painting each band's wild fights play on: the Thornwood's own map has its bridge
  const WILD_SCENE = { 1: 'gloamwood-road', 2: 'warm-road', 3: 'northern-crossroads', 4: 'frozen-road' };
  window.GameFights = { config, WILD_SCENE, PLACES };
})();
