// rules.js: the battle rules as data (plan phase 2). Every hero, summon and foe, with each move's level 1 number; the
// level curve grows everything about 20% a level (design decisions, October 2). No dice: each hit is its number times
// a random swing of up to 25% either way. Level 1 is the Night square demo's numbers
// (reference/demos/night-square-shadow-wraith.html); Sol, the herbs and the foes' kits come from the lore bible and
// the Noctara amendment, rescaled to this curve. Anything marked "proposed" is a starting number for the balance
// simulator (tools/balance.mjs) to check. Defines globalThis.BattleRules; engine.js reads it.
(function (G) {
  'use strict';
  const CURVE = 1.2, SWING = 0.25, MAX_LEVEL = 20;
  // damage, healing and HP at a level: x1.2 a level, so a basic hit is about 100 at 1, 500 at 10 and 3,200 at 20
  const scale = (level) => Math.pow(CURVE, level - 1);
  // MP grows 6% a level while spell costs stay put (proposed): 120 at level 1, about 360 at 20, as in the bible
  const mpScale = (level) => Math.pow(1.06, level - 1);

  // ---------- the party ----------
  // atb: seconds for the turn gauge to fill. A move's hits are level 1 numbers. need: a story flag the move waits for
  // (party: Sol has joined; veil: the Bogmire refit; envoi: Dawnroost; stoop: after Halcyon). time: about how long it
  // plays on screen, for the fight's length.
  const HEROES = {
    io: {
      name: 'Io', hp: 1400, mp: 120, atb: 2.4,
      moves: {
        attack: { name: 'Attack', kind: 'attack', hits: [70, 75, 120], physical: true, target: 'foe', time: 3.2 },
        flame: { name: 'Flame Bolt', kind: 'witchcraft', mp: 12, hits: [330], element: 'fire', target: 'foe', time: 2.4 },
        crescent: { name: 'Crescent Blades', kind: 'witchcraft', mp: 24, hits: [88, 88, 88, 88, 88], element: 'moon', target: 'foe', time: 3 },
        // the foe is Bound: its gauge drops by 0.4 and fills at half speed until its next turn
        briars: { name: 'Nightbloom Briars', kind: 'witchcraft', mp: 18, hits: [260], bind: 0.4, target: 'foe', time: 2.6 },
        mend: { name: 'Lunar Mend', kind: 'moonlore', mp: 16, heal: 380, target: 'ally', time: 2.2 },
        // Waxing Light and Moonsteel exist only once Io has a partner; Waxing Light keeps the bible's ratio to Mend
        waxing: { name: 'Waxing Light', kind: 'moonlore', mp: 24, heal: 270, target: 'allies', need: 'party', time: 2.6 },
        moonsteel: { name: 'Moonsteel', kind: 'moonlore', mp: 18, heat: 40, moonNext: true, target: 'sol', need: 'party', time: 1.8 },
        // a barrier that soaks up to 35% of the ally's max HP, for 2 enemy turns
        mothveil: { name: 'Moth Veil', kind: 'moonlore', mp: 22, veil: 0.35, veilTurns: 2, target: 'ally', need: 'veil', time: 2 },
        defend: { name: 'Defend', kind: 'defend', target: 'self', time: 0.8 },
        moonlight: { name: 'Moonlight', kind: 'trance', hits: [420, 380, 450], element: 'moon', target: 'foe', ends: true, time: 4 },
        lunara: { name: 'Lunara', kind: 'summon', target: 'party', time: 6 },
        envoi: { name: 'Envoi', kind: 'summon', target: 'party', need: 'envoi', time: 6 },
      },
    },
    sol: {
      name: 'Sol', hp: 1800, mp: 0, atb: 2.2,
      moves: {
        attack: { name: 'Attack', kind: 'attack', hits: [90, 95, 150], heat: 20, physical: true, target: 'foe', time: 3 },
        flareCut: { name: 'Flare Cut', kind: 'art', heat: -25, hits: [520], element: 'sun', physical: true, target: 'foe', time: 2.4 },
        // the foe takes 25% more for its next 3 turns
        sunder: { name: 'Sunder', kind: 'art', heat: -20, hits: [280], sunder: 3, physical: true, target: 'foe', time: 2.4 },
        emberRush: { name: 'Ember Rush', kind: 'art', heat: -40, hits: [170, 170, 170, 170], physical: true, target: 'foe', time: 3.4 },
        // spends all her Heat (50 at least) for 12 times the Heat spent
        solarCrest: { name: 'Solar Crest', kind: 'art', heatAll: 50, crest: 12, physical: true, target: 'foe', time: 3.2 },
        // halves what she takes, and takes any single hit aimed at Io, until her next turn
        guard: { name: 'Guard', kind: 'defend', heat: -40, target: 'self', time: 0.8 },
        // Kestrel Stoop: a turn hovering, then on her next turn the biggest sword hit in the game. It costs what one
        // Ember Rush does and beats two of them (proposed)
        stoopRise: { name: 'Kestrel Stoop', kind: 'art', heat: -40, need: 'stoop', target: 'foe', time: 1.6 },
        stoop: { name: 'Stoop', kind: 'auto', hits: [1500], element: 'sun', physical: true, target: 'foe', time: 2.6 },
        // Dawnbreaker: Attack becomes Daybreak, and High Noon ends the Trance
        daybreak: { name: 'Daybreak', kind: 'trance', hits: [120, 120, 120, 120, 260], physical: true, target: 'foe', time: 3.4 },
        highNoon: { name: 'High Noon', kind: 'trance', hits: [160, 160, 160, 160, 160, 160, 900], element: 'sun', physical: true, target: 'foe', ends: true, time: 4.6 },
        // the story command in Halcyon's fights: once, from half her HP; Sol calls her by the name Halcyon gave her,
        // and Halcyon loses her next turn
        kestrel: { name: 'Kestrel', kind: 'story', need: 'kestrel', target: 'halcyon', time: 2.4 },
      },
      // Heat runs 0 to 100: +20 per Attack, +10 each time she's hit, +40 from Moonsteel. At 70 or more she is in
      // Sunburn: every hit deals 35% more, and after each of her actions she loses 6% of her max HP
      heat: { max: 100, perHit: 10 },
      sunburn: { at: 70, damage: 1.35, burn: 0.06 },
      // Warden's Oath: when Io is under 25% HP, Sol steps in front of any single-target hit on her and takes it at 70%
      oath: { below: 0.25, take: 0.7 },
    },
  };
  // Trance: the gauge fills from damage taken (n / max HP x 1.35) and 0.02 for each hit dealt. When it's full, the
  // hero enters Trance at the start of her next turn, free. Io's Twin Moons: Moonlore costs half and every heal lands
  // on both; Moonlight cashes it in. Sol's Dawnbreaker: Heat locked at 100, Sunburn costs no HP; High Noon cashes it
  // in. Either way it lasts at most 4 of her turns (proposed), so it can't be held for a whole fight.
  const TRANCE = { taken: 1.35, dealt: 0.02, turns: 4 };

  // ---------- summons, each once a battle; Io's level sets their numbers ----------
  const SUMMONS = {
    // the Embrace on arrival (both heal 60% of max HP, a fallen ally revives at 60%, the party takes 40% less), then
    // Silver Requiem on Io's next turn, which it spends
    lunara: { name: 'Lunara', heal: 0.6, revive: 0.6, cut: 0.6, hits: [150, 150, 150, 150, 150, 150, 1150], element: 'moon', time: 7 },
    // Sol standing with 70 Heat or more lights its heart, spending all of it. The Folding Ward then takes the next
    // enemy attack whole, every target included. It strikes when Io's gauge next fills, and Io still takes her turn
    envoi: { name: 'Envoi', heatNeed: 70, hits: [180, 180, 180, 180, 180, 180, 180, 180, 1800], element: 'sun', time: 7 },
  };

  // ---------- foes ----------
  // A regular foe takes a level, so it can meet the party anywhere; Halcyon and Noctara are fixed at 20.
  // A move's weight is how often it's picked; "below" and "once" make a desperation move; "charge" spends one turn
  // gathering (it can be seen coming) and strikes on the next. Targets: lastAttacker, io, random (each hit), all, one,
  // lowest (lowest HP), self. shards and xp are at level 1 and grow with the foe's level.
  const FOES = {
    wraith: {
      name: 'Shadow Wraith', hp: 2600, hpSolo: 4200, atb: 3.2, weak: { moon: 1.5 }, resist: { shadow: 0.5 },
      shards: 30, xp: 40, xpSolo: 220, shardsSolo: 60,
      moves: {
        sweep: { name: 'Soul Reaper', weight: 0.4, hits: [190], target: 'lastAttacker', time: 2.6 },
        bolts: { name: 'Soul Bolts', weight: 0.35, hits: [70, 70, 70], target: 'random', time: 2.4 },
        grasp: { name: 'Shadow Grasp', weight: 0.25, hits: [250], target: 'io', time: 2.4 },
        // alone it hits Io for 480; against the party, both for 360
        eclipse: { name: 'Eclipse', below: 0.35, once: true, hits: [360], hitsSolo: [480], target: 'all', time: 3.4 },
      },
    },
    // a soul starting to go hollow: weaker than a wraith, quicker (proposed)
    wisp: {
      name: 'Wisp', hp: 1100, atb: 2.8, weak: { moon: 1.5 }, shards: 14, xp: 18,
      moves: {
        flicker: { name: 'Flicker', weight: 0.35, hits: [110], target: 'one', time: 1.8 },
        cling: { name: 'Cling', weight: 0.25, hits: [45, 45, 45], drain: true, target: 'one', time: 2.6 },
        wail: { name: 'Wail', weight: 0.25, hits: [75], target: 'all', time: 1.8 },
        // it shrinks almost to nothing: the next single hit aimed at it misses
        gutter: { name: 'Gutter', weight: 0.15, evade: 1, target: 'self', noRepeat: true, time: 1.5 },
      },
    },
    // the later variant, from Noctara's cold: its breath slows the party's gauges for a few seconds (proposed)
    frostWisp: {
      name: 'Frost wisp', hp: 1200, atb: 2.8, weak: { moon: 1.3, fire: 1.5 }, shards: 18, xp: 22,
      moves: {
        flicker: { name: 'Flicker', weight: 0.3, hits: [110], target: 'one', time: 1.8 },
        cling: { name: 'Cling', weight: 0.2, hits: [45, 45, 45], drain: true, target: 'one', time: 2.6 },
        breath: { name: 'Frost Breath', weight: 0.35, hits: [95], frost: 4, target: 'all', time: 2 },
        gutter: { name: 'Gutter', weight: 0.15, evade: 1, target: 'self', noRepeat: true, time: 1.5 },
      },
    },
    // the Bogmire boss and level 5 gate: the wraith almost three times the size, the town's lamplight inside it.
    // Tuned so a sensible party at 5 wins about 9 times in 10 and a careless one about a third of the time
    greatWraith: {
      name: 'Great wraith', hp: 12800, atb: 3.4, weak: { moon: 1.5 }, resist: { shadow: 0.5 }, boss: true, shards: 200, xp: 200,
      moves: {
        sweep: { name: 'Soul Reaper', weight: 0.35, hits: [400], target: 'lastAttacker', time: 2.8 },
        bolts: { name: 'Soul Bolts', weight: 0.25, hits: [130, 130, 130, 130], target: 'random', time: 2.6 },
        breath: { name: 'Stolen Fire', weight: 0.25, hits: [340], target: 'all', time: 2.8 },
        // drinks a stolen lamp: heals 6% of its HP; only when hurt, and not again for 3 of its turns
        swallow: { name: 'Swallow Lamplight', weight: 0.15, healPct: 0.06, cooldown: 3, hurt: 0.7, target: 'self', time: 2.6 },
        eclipse: { name: 'Eclipse', below: 0.35, once: true, hits: [670], target: 'all', time: 3.4 },
      },
    },
    // Halcyon, the Gloam Knight, fixed at level 20: the bible's kit on this game's curve. Weak to Sun (the blade
    // remembers), resists Shadow. Tuned for the ambush: a party at 15 falls in about two minutes; an expert at 18
    // brings her to 20% (and her retreat) about two times in three, and at 20 always
    halcyon: {
      name: 'Halcyon', hp: 19800, atb: 2.4, fixedLevel: 20, weak: { sun: 1.5 }, resist: { shadow: 0.5 }, boss: true, shards: 120, xp: 80,
      moves: {
        gloamCleave: { name: 'Gloam Cleave', weight: 0.3, hits: [450], target: 'one', time: 2.4 },
        duskArc: { name: 'Dusk Arc', weight: 0.25, hits: [330], target: 'all', time: 2.6 },
        // Severed: can't be healed until her next turn (barriers still soak)
        severance: { name: 'Severance', weight: 0.15, hits: [370], sever: true, target: 'lowest', time: 2.4 },
        // heals Halcyon for the damage, and drinks 40 Heat from Sol or 40 MP from Io
        lightDrinker: { name: 'Light-Drinker', weight: 0.15, hits: [285], drain: true, sap: 40, target: 'one', time: 2.6 },
        // Sol's own stance: until her next turn she counters every physical blow for 370; magic doesn't set it off
        vowStance: { name: "Warden's Vow", weight: 0.15, vow: 370, target: 'self', noRepeat: true, time: 1.2 },
        blackNoon: { name: 'Black Noon', below: 0.3, once: true, charge: true, hits: [975], target: 'all', time: 3.6 },
      },
    },
    // Noctara the Starless, fixed at level 20, with Halcyon beside her. The cold deepens as the fight goes on: every
    // turn she takes makes her blows 6% harder (rage), so the finale is a race. Tuned so an expert at 20 wins a little
    // over half the time, and at 19 falls with about a third of the two bosses' HP left (proposed)
    noctara: {
      name: 'Noctara', hp: 29000, atb: 2.8, fixedLevel: 20, boss: true, rage: 0.06, shards: 0, xp: 0,
      moves: {
        crownShards: { name: 'Crown Shards', weight: 0.35, hits: [52, 52, 52], target: 'random', time: 2.6 },
        // opens over the party a turn before it collapses: the time for Moth Veil, Defend, Lunara or Envoi's ward
        voidSphere: { name: 'Void Sphere', weight: 0.25, charge: true, hits: [280], target: 'all', time: 4.6 },
        // only the party slows, for 10 seconds of gauge time; the damage lands as it speeds back up
        frostDust: { name: 'Frost Dust', weight: 0.2, hits: [56], frost: 10, late: true, target: 'all', time: 2.8 },
        // the screen goes dark and Halcyon strikes unseen, out of turn; with Halcyon gone it isn't used
        blackout: { name: 'Blackout', weight: 0.2, blackout: 1.25, target: 'all', noRepeat: true, time: 6.2 },
      },
    },
  };

  const STATUS = {
    bindSlow: 0.5,   // Bound
    sunder: 1.25,    // Sundered
    frostSlow: 0.6,  // Frost: the party's gauges fill at 60%
    defend: 0.5,     // Defend and Guard
  };

  // ---------- herbs, the items (bible); the map lists them by place, shops sell them for sunstone shards ----------
  // heal and revive grow with the user's level; prices are level 1 shards and grow with the shop's band (proposed)
  const HERBS = {
    moonpetal: { name: 'Moonpetal', heal: 500, target: 'ally', price: 40 },
    lavender: { name: 'Lavender', heal: 200, target: 'allies', price: 60 },
    mugwort: { name: 'Silver Mugwort', mp: 40, target: 'io', price: 50 },
    emberLily: { name: 'Ember-star Lily', heat: 30, target: 'sol', price: 30 },
    nightrose: { name: 'Nightrose', revive: 0.25, target: 'fallen', price: 120 },
  };

  // ---------- experience and shards ----------
  // to go from level L to L+1 (proposed): three or four wild fights a level, about 60 from 1 to 20; a gate is worth
  // about one level, and the first fight takes Io straight to level 2
  const xpNeed = (level) => Math.round(200 * Math.pow(CURVE, level - 1));
  const grows = (n, level) => Math.round(n * Math.pow(CURVE, level - 1));
  // the Magpie's upgrades: the party's level and a price in shards (proposed; the story chain sets them)
  const MAGPIE = [
    { level: 5, name: 'The Bogmire refit', shards: 500 },
    { level: 10, name: "The charge at Dawnroost's living node", shards: 1800 },
    { level: 15, name: 'The final upgrade at the shipyard', shards: 4500 },
  ];

  G.BattleRules = { CURVE, SWING, MAX_LEVEL, scale, mpScale, HEROES, SUMMONS, FOES, STATUS, TRANCE, HERBS, xpNeed, grows, MAGPIE };
})(typeof globalThis !== 'undefined' ? globalThis : window);
