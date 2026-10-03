// rules.js: the battle rules as data (plan phase 2). Every hero, summon and foe, with each move's level 1 number; the
// level curve grows everything about 20% a level (design decisions, October 2). No dice: each hit is its number times
// a random swing of up to 25% either way. Level 1 is the Night square demo's numbers
// (reference/demos/night-square-shadow-wraith.html); Sol, the herbs and the foes' kits come from the lore bible and
// the Noctara amendment, rescaled to this curve; the rest was set with the balance simulator (tools/balance.mjs) and
// approved by Chris on October 2. Defines globalThis.BattleRules; engine.js reads it.
(function (G) {
  'use strict';
  const CURVE = 1.2, SWING = 0.25, MAX_LEVEL = 20;
  // damage, healing and HP at a level: x1.2 a level, so a basic hit is about 100 at 1, 500 at 10 and 3,200 at 20
  const scale = (level) => Math.pow(CURVE, level - 1);
  // MP grows 6% a level while spell costs stay put : 120 at level 1, about 360 at 20, as in the bible
  const mpScale = (level) => Math.pow(1.06, level - 1);

  // ---------- the party ----------
  // atb: seconds for the turn gauge to fill. A move's hits are level 1 numbers. need: a story flag the move waits for
  // (party: Sol has joined; refit: the Bogmire refit; envoi: Dawnroost; stoop: after Halcyon). time: about how long it
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
        // the Bogmire refit's spell (Chris, October 3: it replaces Moth Veil): a low, warm moon that pours 70 Heat into
        // Sol, enough for Sunburn and for Envoi's heart from nothing. Moonsteel stays the cheap one, with its moon edge
        harvest: { name: 'Harvest Moon', kind: 'moonlore', mp: 28, heat: 70, target: 'sol', need: 'refit', time: 2 },
        defend: { name: 'Defend', kind: 'defend', target: 'self', time: 0.8 },
        // in the wilds the party can run: always from the rooted Bramble Horror, which can't chase; from a pack, one try in two
        flee: { name: 'Flee', kind: 'flee', target: 'self', time: 1.5 },
        moonlight: { name: 'Moonlight', kind: 'trance', hits: [420, 380, 450], element: 'moon', target: 'foe', ends: true, time: 4 },
        // a summon's arrival, as long as it plays on the battle screen (measured October 2)
        lunara: { name: 'Lunara', kind: 'summon', target: 'party', time: 9.8 },
        envoi: { name: 'Envoi', kind: 'summon', target: 'party', need: 'envoi', time: 8.2 },
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
        flee: { name: 'Flee', kind: 'flee', target: 'self', time: 1.5 },
        // Kestrel Stoop: a turn hovering, then on her next turn the biggest sword hit in the game. It costs what one
        // Ember Rush does and beats two of them. While she hovers she is out of reach (Chris, October 3)
        stoopRise: { name: 'Kestrel Stoop', kind: 'art', heat: -40, need: 'stoop', target: 'foe', time: 1.6 },
        stoop: { name: 'Stoop', kind: 'auto', hits: [1500], element: 'sun', physical: true, target: 'foe', time: 2.6 },
        // Dawnbreaker: Attack becomes Daybreak, and High Noon ends the Trance
        daybreak: { name: 'Daybreak', kind: 'trance', hits: [120, 120, 120, 120, 260], physical: true, target: 'foe', time: 3.4 },
        highNoon: { name: 'High Noon', kind: 'trance', hits: [160, 160, 160, 160, 160, 160, 900], element: 'sun', physical: true, target: 'foe', ends: true, time: 4.6 },
        // the story command in Halcyon's fights: once, from half her HP; Sol calls her by the name Halcyon gave her,
        // and Halcyon loses her next turn
        kestrel: { name: 'Kestrel', kind: 'story', need: 'kestrel', target: 'halcyon', time: 2.4 },
      },
      // Heat runs 0 to 100: +20 per Attack, +10 each time she's hit, +40 from Moonsteel, +70 from Harvest Moon. At 70 or more she is in
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
  // in. Either way it lasts at most 4 of her turns , so it can't be held for a whole fight. time: how long the
  // transformation plays on the battle screen.
  const TRANCE = { taken: 1.35, dealt: 0.02, turns: 4, time: 3.8 };

  // ---------- summons, each once a battle; Io's level sets their numbers ----------
  const SUMMONS = {
    // the Embrace on arrival (both heal 60% of max HP, a fallen ally revives at 60%, the party takes 40% less), then
    // Silver Requiem on Io's next turn, which it spends
    lunara: { name: 'Lunara', heal: 0.6, revive: 0.6, cut: 0.6, hits: [150, 150, 150, 150, 150, 150, 1150], element: 'moon', time: 9.4 },
    // Sol standing with 70 Heat or more lights its heart, spending all of it. The Folding Ward then takes the next
    // enemy attack whole, every target included. It strikes when Io's gauge next fills, and Io still takes her turn
    envoi: { name: 'Envoi', heatNeed: 70, hits: [180, 180, 180, 180, 180, 180, 180, 180, 1800], element: 'sun', time: 8.2 },
  };

  // the Bramble Horror's kit, shared by its four forms (the moves on Chris's bench). Undergrowth, its big move, comes from
  // level 8 (the Ancient Crown always has it)
  const BRAMBLE_MOVES = {
    strike: { name: 'Strike', weight: 0.33, hits: [480], target: 'lastAttacker', time: 2.0 },
    sweep: { name: 'Thorn Sweep', weight: 0.24, hits: [300], target: 'all', time: 2.4 },
    // Lure, then Grab: the fruit is held out to one hero for a turn; the canes take her on the next, and her turn gauge empties
    grab: { name: 'Grab', weight: 0.24, charge: true, chargeName: 'Lure', hits: [165, 165, 195], held: true, target: 'one', time: 3.2 },
    // it feeds through its roots on the weakest: each pulse a blow, then a heal of what it took
    consume: { name: 'Consume', weight: 0.2, hurt: 0.7, cooldown: 3, hits: [165, 165, 180], drain: true, target: 'lowest', time: 3.6 },
    undergrowth: { name: 'Undergrowth', weight: 0.16, minLevel: 8, hits: [345, 450], target: 'one', time: 3.8 },
  };
  const bramble = (form, o) => Object.assign({ name: 'Bramble Horror', form, moves: BRAMBLE_MOVES, weak: { fire: 1.5, sun: 1.25 }, fearsFire: 0.3, canes: 6, alone: true }, o);

  // the Bramble Colossus's kit (3d-model-new-character-ideas/bramble-colossus, its bench's moves). Every move plays the
  // model's own motion. wrathWeight: how often it is picked once the Wrath has come (the bench's second phase: Hammerfall,
  // Maelstrom and Thornwood more, Siren Bloom less)
  const COLOSSUS_MOVES = {
    // a single heavy blow: the lead arm spears down through whoever hurt it last
    lance: { name: 'Thorn Lance', weight: 0.22, wrathWeight: 0.17, hits: [560], target: 'lastAttacker', time: 2.4 },
    // both arms twined into one club on one hero, then the shockwave over the whole party
    slam: { name: 'Hammerfall', weight: 0.16, wrathWeight: 0.22, hits: [455], shock: [165], target: 'one', time: 3.6 },
    // every cane whirls round it twice: four blows on the whole party
    whirl: { name: 'Maelstrom', weight: 0.12, wrathWeight: 0.2, hits: [105, 105, 105, 105], target: 'all', time: 4.2 },
    // thorns flung high, raining on the whole party in three waves
    volley: { name: 'Thorn Volley', weight: 0.16, wrathWeight: 0.15, hits: [130, 130, 130], target: 'all', time: 3.8 },
    // shoots as tall as young trees burst up round one hero and squeeze
    briar: { name: 'Thornwood', weight: 0.14, wrathWeight: 0.2, hits: [290, 375], target: 'one', time: 4.4 },
    // its lure: the flower opens wide on its heart and pours pollen over the party, who are charmed (their gauges fill
    // at half speed) and step toward it. On its next turn it Devours the one it chose. Fire, or a big blow to the bare
    // heart, makes it recoil and shut, and breaks the bloom
    bloom: { name: 'Siren Bloom', weight: 0.2, wrathWeight: 0.06, charge: true, charm: 0.5, then: 'devour', target: 'one', time: 3.6 },
    // the bloom's end: its arms lift the charmed hero into the flower, which shuts; a seizing blow, then three gulps, each
    // healing it by what it takes; then it bursts open and sets her back where she stood, its heart bare until its next turn
    devour: { name: 'Devour', weight: 0, seize: 245, hits: [280, 280, 280], drain: true, prey: true, opens: true, target: 'one', time: 5.6 },
    // its second phase, once, at half its HP: faster and harder, its veins burning ember-red; it bursts open, heart bare
    enrage: { name: 'Wrath', below: 0.5, once: true, wrath: { haste: 0.8, fury: 1.2 }, opens: true, target: 'self', time: 3.6 },
  };

  // ---------- foes ----------
  // A regular foe takes a level, so it can meet the party anywhere; Halcyon and Noctara are fixed at 20.
  // A move's weight is how often it's picked; "below" and "once" make a desperation move; "charge" spends one turn
  // gathering (it can be seen coming) and strikes on the next. Targets: lastAttacker, io, random (each hit), all, one,
  // lowest (lowest HP), self. shards and xp are at level 1 and grow with the foe's level.
  const FOES = {
    wraith: {
      // alone against Io (the first fight) it has the Night square demo's 4,200 HP and hits 15% harder than the demo,
      // so a careless player loses about two fights in five and an attentive one almost never (Chris, October 2)
      name: 'Shadow Wraith', hp: 2600, hpSolo: 4200, dmgSolo: 1.15, atb: 3.2, weak: { moon: 1.5 }, resist: { shadow: 0.5 },
      shards: 30, xp: 40, xpSolo: 220, shardsSolo: 60,
      moves: {
        sweep: { name: 'Soul Reaper', weight: 0.4, hits: [190], target: 'lastAttacker', time: 2.6 },
        bolts: { name: 'Soul Bolts', weight: 0.35, hits: [70, 70, 70], target: 'random', time: 2.4 },
        grasp: { name: 'Shadow Grasp', weight: 0.25, hits: [250], target: 'io', time: 2.4 },
        // alone it hits Io for 480; against the party, both for 360
        eclipse: { name: 'Eclipse', below: 0.35, once: true, hits: [360], hitsSolo: [480], target: 'all', time: 3.4 },
      },
    },
    // a soul starting to go hollow: weaker than a wraith, quicker
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
    // the later variant, from Noctara's cold: its breath slows the party's gauges for a few seconds
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
    // ---------- the Bramble Horror (Chris, October 3: reference/demos/bramble-horror-bench.html) ----------
    // A patient predator of the wilds that looks like a lush blackberry thicket: always met alone, and formidable. Four
    // forms: the Classic Horror, the Low Ambush (it strikes before the party can act), the Towering Reach (quicker and
    // harder) and the Ancient Crown (older, more massive, the worst of them). It fears fire: a fire blow makes it recoil
    // (its gauge drops), and breaks a Lure. A heavy blade blow severs a cane, and every cane lost takes 8% off its blows.
    // Lure spends a turn with the fruit held out (it can be seen coming), and the Grab falls on that hero next turn,
    // emptying her turn gauge as she is dragged to the crown.
    // Its level is rolled in the band's range like any wild foe's, so it follows Chris's rule for how hard a fight is: a
    // decent player beats one below her level, about half of those at her level, and seldom one above it. It is worth about
    // 1.6 times an average pack's experience (the Ancient Crown about 3.2 times). Set with the simulator (tools/balance.mjs)
    bramble: bramble('Classic Horror', { hp: 10000, atb: 1.9, xp: 75, shards: 40 }),
    brambleAmbush: bramble('Low Ambush', { hp: 9000, atb: 1.9, ambush: true, xp: 70, shards: 38 }),
    brambleTowering: bramble('Towering Reach', { hp: 9000, atb: 1.7, dmg: 1.1, xp: 80, shards: 45 }),
    brambleAncient: bramble('Ancient Crown', { hp: 15000, atb: 2.0, dmg: 1.25, canes: 7, allMoves: true, xp: 150, shards: 90 }),
    // ---------- the Bramble Colossus (made from Chris's Bramble Horror as he asked, October 3) ----------
    // The Bramble Horror grown as big as a house: the last band's great wild foe, met rarely and always alone, and rooted,
    // so the party can always flee from it. Two phases: at half its HP comes its Wrath. Its heart is its weak point: while
    // the bud is open (Siren Bloom, after Devour, after Wrath) every blow on it lands double. It fears fire like the
    // Bramble Horror, and a heavy blade blow severs one of its four great canes (it keeps two). Worth three times an
    // average wild fight in its band (xp and shards). Set with the simulator (tools/balance.mjs): at the party's level from
    // 18 to 20 an expert wins about two times in three; an attentive player about one time in four, fleeing otherwise
    colossus: { name: 'Bramble Colossus', moves: COLOSSUS_MOVES, hp: 17000, atb: 2.3, weak: { fire: 1.5, sun: 1.25 }, fearsFire: 0.3, canes: 4, minCanes: 2, heart: 2, alone: true, boss: true, xp: 270, shards: 195 },
    // Halcyon, the Gloam Knight, fixed at level 20: the bible's kit on this game's curve. Weak to Sun (the blade
    // remembers), resists Shadow. Tuned for the ambush: a party at 15 falls in about two minutes; an expert at 18
    // brings her to 20% (and her retreat) about half the time, and at 20 almost always
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
    // turn she takes makes her blows 11.5% harder (rage), and Halcyon's too, so the finale is a race. Tuned so a perfect
    // player at 20 wins about three times in four, at 19 has a very slight chance, and an attentive player seldom
    // wins: you have to be locked in, but it isn't impossible (Chris, October 3). (It was 6% until Kestrel Stoop's hit,
    // which never landed, was fixed; it rose to 10% as the expert stopped spending turns on Guard and Moth Veil in the
    // race and the dive began to land hot, and to 11.5% with Harvest Moon and the Ember-star Lily's 10%.)
    noctara: {
      name: 'Noctara', hp: 29000, atb: 2.8, fixedLevel: 20, boss: true, rage: 0.115, shards: 0, xp: 0,
      moves: {
        crownShards: { name: 'Crown Shards', weight: 0.35, hits: [52, 52, 52], target: 'random', time: 2.6 },
        // opens over the party a turn before it collapses: the time for Defend, Kestrel Stoop, Lunara or Envoi's ward
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
  // The party carries one of each (CARRY), so a herb is a special healing, stronger than Io's own: Moonpetal heals 20%
  // more than Lunar Mend, Lavender 20% more than Waxing Light. Ember-star Lily makes every blow the party lands 10%
  // harder for the rest of the fight (Chris, October 3). Heal and revive grow with the user's level; prices are level 1
  // shards and grow with the shop's band
  const CARRY = 1;
  const HERBS = {
    moonpetal: { name: 'Moonpetal', heal: Math.round(HEROES.io.moves.mend.heal * 1.2), target: 'ally', price: 40 },
    lavender: { name: 'Lavender', heal: Math.round(HEROES.io.moves.waxing.heal * 1.2), target: 'allies', price: 60 },
    mugwort: { name: 'Silver Mugwort', mp: 40, target: 'io', price: 50 },
    emberLily: { name: 'Ember-star Lily', might: 0.1, target: 'party', price: 30 },
    nightrose: { name: 'Nightrose', revive: 0.25, target: 'fallen', price: 120 },
  };

  // ---------- experience and shards ----------
  // to go from level L to L+1 (Chris, October 2): about 79 wild fights from level 2 to 20, with about 40% of them in the
  // last band. The first band levels 20% quicker; from level 3 each level asks 2% more than the curve; from 16 on, each
  // level asks 2.7 times as much. A gate is worth about a level early on, and the first fight takes Io straight to 2
  const xpNeed = (level) => Math.round(200 * Math.pow(CURVE, level - 1) * (level <= 5 ? 0.8 : 1) * Math.pow(1.02, Math.max(0, level - 3)) * (level >= 16 ? 2.7 : 1));
  const grows = (n, level) => Math.round(n * Math.pow(CURVE, level - 1));
  // a herb's price in a band's shops: its level 1 price grown to the band's middle level (3, 8, 13 and 18)
  const herbPrice = (id, band) => grows(HERBS[id].price, (band - 1) * 5 + 3);
  // the Magpie's upgrades: the party's level and a price in shards (the story chain will check them)
  const MAGPIE = [
    { level: 5, name: 'The Bogmire refit', shards: 650 },
    { level: 10, name: "The charge at Dawnroost's living node", shards: 2300 },
    { level: 15, name: 'The final upgrade at the shipyard', shards: 4500 },
  ];

  // a wild fight's experience and shards, against the fight tables: the game's walks between stops are shorter than the
  // simulator first assumed, so each wild fight is worth more and the levels at the gates stay where they were
  // (design decisions, twenty-third round)
  const WILD_REWARD = 1.75;

  // a big blow: a single hit this strong at level 1 (or stronger) on the Colossus's bare heart breaks its Siren Bloom
  const BIG_BLOW = 450;

  G.BattleRules = { CURVE, SWING, MAX_LEVEL, scale, mpScale, HEROES, SUMMONS, FOES, STATUS, TRANCE, HERBS, CARRY, xpNeed, grows, herbPrice, MAGPIE, WILD_REWARD, BIG_BLOW };
})(typeof globalThis !== 'undefined' ? globalThis : window);
