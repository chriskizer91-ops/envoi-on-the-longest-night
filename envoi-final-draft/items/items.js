// items.js: the twenty keepsakes Io and Sol can find, as proposed for Chris to place and approve (October 4, 2026).
// Chris: pull them from the Thareia or Aethermoor games' loot; six only Io can wear, six only Sol can wear, and eight
// either can wear, so one hero could wear fourteen and leave the other her own six. The two hidden keepsakes already in
// the game keep a quarter of the whole game's item power (each cut to a quarter of what it gave); the other eighteen
// share the other three quarters.
//
// Every name, look and line is a relic of Chris's Aethermoor games, read from chriskizer91-ops/New-game:
// game/src/data/relics.js on branch claude/cool-ptolemy-uc93gg (Hearth & Heirloom), and the Thareia copy,
// thareia/game/src/data/relics.js on claude/tender-babbage-4wiplk (the Fawnrest Heartstone is Thareia's own).
// They are brought into this story: here it is Noctara's cold that troubles the world, never the Rot, and the lines
// that told of drowned people are rewritten. The effects are this game's, and first guesses: the balance simulator
// sets the exact numbers so that the eighteen add up to three quarters. `worth` is in points, where one point is about
// one percent of one of a hero's main strengths (the two hidden keepsakes gave 45 between them).
//
// wear: 'io' | 'sol' | 'either'. home: a walking map (src/game/maps.js) where it might lie, or null when its proposed
// place isn't a walking map yet. at: where the two hidden ones lie today. Defines window.LOOT = { ITEMS, BUDGET }.
(function (G) {
  'use strict';
  const ITEMS = [
    // ---------- only Io ----------
    {
      id: 'orrery', name: 'The Orrery of Hours', from: 'Aethermoor, Codex No. 26', wear: 'io', secret: true, worth: 6.25,
      does: 'Lunar Mend and Waxing Light heal 6% more',
      where: 'Hidden on top of the red roof in Wickhollow (where Io’s hidden keepsake lies today)', band: 1, home: 'wickhollow', at: [458, 562],
      look: 'a little brass orrery the size of a locket, on a gold chain: a pale moon on its outer ring, and round it tiny topaz stars',
      line: 'It hums the hour it was made in. That hour hasn’t happened yet: the hour the stars come back.',
    },
    {
      id: 'hexbane-shawl', name: 'Nettie’s Hexbane Shawl', from: 'Aethermoor, Codex No. 66', wear: 'io', worth: 1.875,
      does: 'The herbs Io uses heal 15% more',
      where: 'Wickhollow: Nettie knots it for Io, for a small favour', band: 1, home: 'wickhollow',
      look: 'a shawl of grey bog-cotton tied all over with little knots, small bone charms on cords, a moss-green trim',
      line: 'Knotted by Nettie from bog-cotton, one knot for every curse she ever undid.',
    },
    {
      id: 'mosswatch-lantern', name: 'The Mosswatch Lantern', from: 'Aethermoor, Codex No. 15', wear: 'io', worth: 1.875,
      does: 'Lunar Mend and Waxing Light cost 5% less MP',
      where: 'Mosswatch Tower, on the southwest coast (a place still to come)', band: 1, home: null,
      look: 'a bronze and black-iron lantern with topaz glass, moss on its cap, a warm ember light inside',
      line: 'The watchkeepers carried it up the stair every dusk for three hundred years. It has never once gone out.',
    },
    {
      id: 'hag-stone', name: 'The Hag-Stone', from: 'Aethermoor, Codex No. 57', wear: 'io', worth: 1.875,
      does: 'Io’s spells strike 2% harder. On the maps, hidden things glint brighter',
      where: 'Bogmire: Old Wenna keeps it in a jar', band: 1, home: 'bogmire',
      look: 'a grey stone with a hole worn through it, on a ring of pitted bog-iron, tied with twine',
      line: 'Look through the hole and you see what is really there.',
    },
    {
      id: 'first-seed', name: 'The First Seed', from: 'Aethermoor, Codex No. 23', wear: 'io', worth: 1.875,
      does: 'Nightbloom Briars hold a foe longer: its next turn comes later',
      where: 'Eldergrove, at the root of its oldest tree (a place still to come)', band: 3, home: null,
      look: 'a seed the size of a walnut, dark wood veined with gold, set in gold on a chain of wooden beads, one tiny green bud',
      line: 'The seed Eldergrove’s eldest tree grew from, kept at its root for nine hundred years. It is still, very faintly, alive.',
    },
    {
      id: 'veilbell', name: 'The Veilbell', from: 'Aethermoor, Codex No. 40', wear: 'io', worth: 1.875,
      does: 'Frost Dust and frost breath slow Io for half as long',
      where: 'Peak’s Veil, the monastery in the clouds (a place still to come)', band: 4, home: null,
      look: 'a small bronze hand-bell rimed with frost, a silver handle and clapper, a fine crack in it glowing pale blue',
      line: 'Cast from the great bell’s first crack. At Peak’s Veil they rang it every evening for the dead, so their moths could find the way up.',
    },
    // ---------- only Sol ----------
    {
      id: 'wardens-seal', name: 'The Warden’s Seal', from: 'Aethermoor, Codex No. 4', wear: 'sol', secret: true, worth: 5,
      does: 'Sol has 2.5% more HP, and her blows land 2.5% harder',
      where: 'Hidden where the trail into the Thornwood’s dark woods gives out (where Sol’s hidden keepsake lies today)', band: 1, home: 'thornwood', at: [1284, 816],
      look: 'a round gold seal with a sun in relief, gold rays, a topaz at its heart, worn as a brooch; still warm',
      line: 'Pressed into the wax of every oath the Wardens ever swore.',
    },
    {
      id: 'vale-gauntlets', name: 'The Vale Gauntlets', from: 'Aethermoor, Codex No. 24', wear: 'sol', worth: 1.875,
      does: 'Sol’s Sunder lasts one turn longer',
      where: 'Dawnroost: on a peg over one of the forty bunks in the Wardens’ hall; Marta tells Sol to take them', band: 2, home: 'dawnroost',
      look: 'silver plate gauntlets with gold trim, a name engraved on every knuckle-plate, a stormglass gem at each cuff',
      line: 'Every knuckle-plate is engraved with somebody she beat.',
    },
    {
      id: 'sunstone-lantern', name: 'The Sunstone Lantern', from: 'Aethermoor, Codex No. 28', wear: 'sol', worth: 1.875,
      does: 'Sol starts every fight with 10 Heat',
      where: 'Inside one of the Warm Roads’ dark nodes, once Sol relights it', band: 2, home: null,
      look: 'a sunstone the size of a fist caged in brass and bronze, warm amber light spilling out, a topaz on the cap',
      line: 'A sunstone the size of a fist, caged in brass. It never learned to set.',
    },
    {
      id: 'watchkeepers-kettle', name: 'The Watchkeeper’s Kettle', from: 'Aethermoor, Codex No. 16', wear: 'sol', worth: 1.875,
      does: 'Sol takes 2% less harm',
      where: 'The shipyard: Old Gil’s, from his years keeping watch', band: 3, home: 'shipyard',
      look: 'a dented iron kettle-helm with bronze trim and rivets, storm runes round the brim, a little bronze weather vane on top',
      line: 'Dented by every hailstorm it ever saw. It hums when weather is coming.',
    },
    {
      id: 'ironvein-bracers', name: 'The Ironvein Bracers', from: 'Aethermoor, Codex No. 43', wear: 'sol', worth: 1.875,
      does: 'Sol’s Heat builds 10% faster',
      where: 'Misthollow, where they were forged (Misthollow is Ironhold on Chris’s map)', band: 4, home: 'misthollow',
      look: 'black-iron bracers with glowing ember veins, bronze bands and a ruby at each cuff',
      line: 'Forged at Ironhold for someone with small wrists and a big grudge.',
    },
    {
      id: 'roc-feather-cloak', name: 'The Roc-Feather Cloak', from: 'Aethermoor, Codex No. 44', wear: 'sol', worth: 1.875,
      does: 'Kestrel Stoop lands 10% harder',
      where: 'The Thunder-Roc’s eyrie at Stormwatch, left behind when it rises into the storm (a place still to come)', band: 4, home: null,
      look: 'a cloak of huge storm-grey feathers with pale edges over dark leather, a silver clasp with a stormglass gem',
      line: 'A shepherd’s cloak of the Thunder-Roc’s own moulted feathers. It sheds rain, snow and arrows.',
    },
    // ---------- either ----------
    {
      id: 'mire-pearl', name: 'The Mire Pearl', from: 'Aethermoor, Codex No. 17', wear: 'either', worth: 1.875,
      does: '2% more HP',
      where: 'Gorrow, the Mire-King, in his crown of reeds at Willowmurk (a place still to come)', band: 1, home: null,
      look: 'a warm, damp pearl gripped by a verdigris bronze ring shaped like a frog’s toes, strands of reed round it',
      line: 'Grown in the throat of the oldest frog in the fen. It is warm, and never quite dry.',
    },
    {
      id: 'unfair-toll', name: 'Hodge’s Unfair Toll', from: 'Aethermoor, Codex No. 53', wear: 'either', worth: 1.875,
      does: 'The foes’ first turns come a little later',
      where: 'Rotbridge: win the ferryman’s toll game (a place still to come)', band: 1, home: null,
      look: 'a clipped bronze coin worn smooth, on an iron chain',
      line: 'Hodge charges what he likes. Now so do you.',
    },
    {
      id: 'bogstriders', name: 'The Bogstriders', from: 'Aethermoor, Codex No. 54', wear: 'either', worth: 1.875,
      does: 'Her turns come 1% sooner, and when she is grabbed she keeps a little of her turn. On the maps the party walks a little faster',
      where: 'Bogmire', band: 1, home: 'bogmire',
      look: 'dark leather boots on splayed willow-wood soles, reed laces, moss at the tops',
      line: 'Boots for a country where the ground is only a rumour.',
    },
    {
      id: 'sunstone-heart', name: 'The Sunstone Heart', from: 'Aethermoor, Codex No. 34', wear: 'either', worth: 1.875,
      does: 'She heals a little at the start of each of her turns',
      where: 'In Old Snag’s wallow on the Warm Roads’ moor: the mud is warm because of it', band: 2, home: null,
      look: 'a heart-shaped amber sunstone set in gold, its veins glowing like embers, on a gold chain',
      line: 'It beats.',
    },
    {
      id: 'fawnrest-heartstone', name: 'The Fawnrest Heartstone', from: 'Thareia, Codex No. 75', wear: 'either', worth: 1.875,
      does: 'More of her own power: on Io, 4% more MP; on Sol, her Heat builds 4% faster',
      where: 'The White Hart of Fawnrest leaves it at Io’s feet when the frost cracks off it', band: 3, home: null,
      look: 'a heart of topaz set in bronze, a warm light inside it, on a bronze chain',
      line: 'The shrine’s warm stone, that the white hart kept. It still holds the heat of the spring under Fawnrest.',
    },
    {
      id: 'lightfingers', name: 'Lightfingers', from: 'Thareia, Codex No. 77', wear: 'either', worth: 1.875,
      does: 'Trance fills 10% faster. Fights give 10% more shards',
      where: 'The shipyard: lost in the cove below the slips', band: 3, home: 'shipyard',
      look: 'dark leather gloves with the fingertips worn away, frost-blue stitching, a silver cuff band with a sapphire, a gold coin tucked in the cuff',
      line: 'The fingertips are worn through from counting other people’s coin.',
    },
    {
      id: 'hushweave-cowl', name: 'The Hushweave Cowl', from: 'Aethermoor, Codex No. 52', wear: 'either', worth: 1.875,
      does: 'The big blows a foe warns of (Black Noon, Void Sphere, the great creatures’ biggest) hit her 10% softer',
      where: 'Frostmere Lake, under the ice (a place still to come)', band: 4, home: null,
      look: 'a hood woven of something pale and fine that isn’t wool, frost-white with silver spirals, a pearl at the clasp',
      line: 'Woven under the ice by someone who was listening. Wear it and you hear a heartbeat, very slow, very far down.',
    },
    {
      id: 'thornwreath', name: 'The Thornwreath', from: 'Aethermoor, Codex No. 11 (and Thareia No. 78)', wear: 'either', worth: 1.875,
      does: 'Her blows and spells land 2% harder',
      where: 'The Bramble Colossus, the first time it falls', band: 4, home: null,
      look: 'a crown of black bramble canes and bark, thorns, small green buds and red berries, moss',
      line: 'It grew round the Colossus’s heart while nobody was looking, and it has not stopped growing.',
    },
  ];
  // the whole game's item power: what the two hidden keepsakes gave on October 4 (Io's healing +25%; Sol's HP and blows
  // +10% each), in points. The two keep a quarter; the eighteen share the rest
  const BUDGET = { total: 45, secrets: 11.25, others: 33.75, each: 1.875 };
  G.LOOT = { ITEMS, BUDGET };
})(typeof globalThis !== 'undefined' ? globalThis : window);
