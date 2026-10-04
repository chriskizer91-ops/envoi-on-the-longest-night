// items.js: the twenty keepsakes Io and Sol can find, as proposed for Chris to place and approve (October 4, 2026).
// Chris's rules: pull them from the Thareia or Aethermoor games' loot; six only Io can wear, six only Sol can wear, and
// eight either can wear, so one hero could wear fourteen and leave the other her own six. Sixteen of them reach the same
// totals the two hidden keepsakes give today (Io's healing 25% more, Sol's HP and blows 10% each), in sizes that differ
// from 1% to 6.25%; the two hidden ones are among the sixteen and keep a quarter of each total (each cut to a quarter
// of what it gave). The other four are special, on top of the totals: a Trance item for each hero (20% faster, and
// nothing else) and two rings that help in other ways.
//
// Every name, look and line is a relic of Chris's Aethermoor games, read from chriskizer91-ops/New-game:
// game/src/data/relics.js on branch claude/cool-ptolemy-uc93gg (Hearth & Heirloom), and the Thareia copy,
// thareia/game/src/data/relics.js on claude/tender-babbage-4wiplk (the Fawnrest Heartstone is Thareia's own). The two
// rings are rings there too. They are brought into this story: here it is Noctara's cold that troubles the world, never
// the Rot, and the lines that told of drowned people are rewritten.
//
// wear: 'io' | 'sol' | 'either'. fx, in percent: heal (Io's Lunar Mend and Waxing Light heal more), hp (more HP),
// might (blows, and on Io her spells, land harder), trance (the Trance gauge fills faster), power (on Io more MP, on
// Sol her Heat builds faster), regen (at the start of each of her turns she heals this share of her HP). special: one
// of the four on top of the totals. home: a walking map (src/game/maps.js) where it might lie, or null when its
// proposed place isn't a walking map yet. at: where the two hidden ones lie today. Defines window.LOOT = { ITEMS, TOTALS }.
(function (G) {
  'use strict';
  const ITEMS = [
    // ---------- only Io: five add to her healing, one is her Trance item ----------
    {
      id: 'orrery', name: 'The Orrery of Hours', from: 'Aethermoor, Codex No. 26', wear: 'io', secret: true, fx: { heal: 6.25 },
      does: 'Lunar Mend and Waxing Light heal 6.25% more',
      where: 'Hidden on top of the red roof in Wickhollow (where Io’s hidden keepsake lies today)', band: 1, home: 'wickhollow', at: [458, 562],
      look: 'a little brass orrery the size of a locket, on a gold chain: a pale moon on its outer ring, and round it tiny topaz stars',
      line: 'It hums the hour it was made in. That hour hasn’t happened yet: the hour the stars come back.',
    },
    {
      id: 'hexbane-shawl', name: 'Nettie’s Hexbane Shawl', from: 'Aethermoor, Codex No. 66', wear: 'io', fx: { heal: 3.75 },
      does: 'Lunar Mend and Waxing Light heal 3.75% more',
      where: 'Wickhollow: Nettie knots it for Io, for a small favour', band: 1, home: 'wickhollow',
      look: 'a shawl of grey bog-cotton tied all over with little knots, small bone charms on cords, a moss-green trim',
      line: 'Knotted by Nettie from bog-cotton, one knot for every curse she ever undid.',
    },
    {
      id: 'mosswatch-lantern', name: 'The Mosswatch Lantern', from: 'Aethermoor, Codex No. 15', wear: 'io', fx: { heal: 4.5 },
      does: 'Lunar Mend and Waxing Light heal 4.5% more',
      where: 'Mosswatch Tower, on the southwest coast (a place still to come)', band: 1, home: null,
      look: 'a bronze and black-iron lantern with topaz glass, moss on its cap, a warm ember light inside',
      line: 'The watchkeepers carried it up the stair every dusk for three hundred years. It has never once gone out.',
    },
    {
      id: 'first-seed', name: 'The First Seed', from: 'Aethermoor, Codex No. 23', wear: 'io', fx: { heal: 5 },
      does: 'Lunar Mend and Waxing Light heal 5% more',
      where: 'Eldergrove, at the root of its oldest tree (a place still to come)', band: 3, home: null,
      look: 'a seed the size of a walnut, dark wood veined with gold, set in gold on a chain of wooden beads, one tiny green bud',
      line: 'The seed Eldergrove’s eldest tree grew from, kept at its root for nine hundred years. It is still, very faintly, alive.',
    },
    {
      id: 'fawnrest-heartstone', name: 'The Fawnrest Heartstone', from: 'Thareia, Codex No. 75', wear: 'io', fx: { heal: 5.5 },
      does: 'Lunar Mend and Waxing Light heal 5.5% more',
      where: 'The White Hart of Fawnrest leaves it at Io’s feet when the frost cracks off it', band: 3, home: null,
      look: 'a heart of topaz set in bronze, a warm light inside it, on a bronze chain',
      line: 'The shrine’s warm stone, that the white hart kept. It still holds the heat of the spring under Fawnrest.',
    },
    {
      id: 'veilbell', name: 'The Veilbell', from: 'Aethermoor, Codex No. 40', wear: 'io', special: true, fx: { trance: 20 },
      does: 'Io’s Trance fills 20% faster',
      where: 'Peak’s Veil, the monastery in the clouds (a place still to come)', band: 4, home: null,
      look: 'a small bronze hand-bell rimed with frost, a silver handle and clapper, a fine crack in it glowing pale blue',
      line: 'Cast from the great bell’s first crack. At Peak’s Veil they rang it every evening for the dead, so their moths could find the way up.',
    },
    // ---------- only Sol: five add to her HP and blows, one is her Trance item ----------
    {
      id: 'wardens-seal', name: 'The Warden’s Seal', from: 'Aethermoor, Codex No. 4', wear: 'sol', secret: true, fx: { hp: 2.5, might: 2.5 },
      does: 'Sol has 2.5% more HP, and her blows land 2.5% harder',
      where: 'Hidden where the trail into the Thornwood’s dark woods gives out (where Sol’s hidden keepsake lies today)', band: 1, home: 'thornwood', at: [1284, 816],
      look: 'a round gold seal with a sun in relief, gold rays, a topaz at its heart, worn as a brooch; still warm',
      line: 'Pressed into the wax of every oath the Wardens ever swore.',
    },
    {
      id: 'vale-gauntlets', name: 'The Vale Gauntlets', from: 'Aethermoor, Codex No. 24', wear: 'sol', fx: { might: 1 },
      does: 'Sol’s blows land 1% harder',
      where: 'Dawnroost: on a peg over one of the forty bunks in the Wardens’ hall; Marta tells Sol to take them', band: 2, home: 'dawnroost',
      look: 'silver plate gauntlets with gold trim, a name engraved on every knuckle-plate, a stormglass gem at each cuff',
      line: 'Every knuckle-plate is engraved with somebody she beat.',
    },
    {
      id: 'sunstone-lantern', name: 'The Sunstone Lantern', from: 'Aethermoor, Codex No. 28', wear: 'sol', special: true, fx: { trance: 20 },
      does: 'Sol’s Trance fills 20% faster',
      where: 'Inside one of the Warm Roads’ dark nodes, once Sol relights it', band: 2, home: null,
      look: 'a sunstone the size of a fist caged in brass and bronze, warm amber light spilling out, a topaz on the cap',
      line: 'A sunstone the size of a fist, caged in brass. It never learned to set.',
    },
    {
      id: 'watchkeepers-kettle', name: 'The Watchkeeper’s Kettle', from: 'Aethermoor, Codex No. 16', wear: 'sol', fx: { hp: 1 },
      does: 'Sol has 1% more HP',
      where: 'The shipyard: Old Gil’s, from his years keeping watch', band: 3, home: 'shipyard',
      look: 'a dented iron kettle-helm with bronze trim and rivets, storm runes round the brim, a little bronze weather vane on top',
      line: 'Dented by every hailstorm it ever saw. It hums when weather is coming.',
    },
    {
      id: 'ironvein-bracers', name: 'The Ironvein Bracers', from: 'Aethermoor, Codex No. 43', wear: 'sol', fx: { might: 3 },
      does: 'Sol’s blows land 3% harder',
      where: 'Misthollow, where they were forged (Misthollow is Ironhold on Chris’s map)', band: 4, home: 'misthollow',
      look: 'black-iron bracers with glowing ember veins, bronze bands and a ruby at each cuff',
      line: 'Forged at Ironhold for someone with small wrists and a big grudge.',
    },
    {
      id: 'roc-feather-cloak', name: 'The Roc-Feather Cloak', from: 'Aethermoor, Codex No. 44', wear: 'sol', fx: { hp: 3 },
      does: 'Sol has 3% more HP',
      where: 'The Thunder-Roc’s eyrie at Stormwatch, left behind when it rises into the storm (a place still to come)', band: 4, home: null,
      look: 'a cloak of huge storm-grey feathers with pale edges over dark leather, a silver clasp with a stormglass gem',
      line: 'A shepherd’s cloak of the Thunder-Roc’s own moulted feathers. It sheds rain, snow and arrows.',
    },
    // ---------- either: two rings that help in other ways, and six that add HP or blows to whoever wears them ----------
    {
      id: 'mire-pearl', name: 'The Mire Pearl', from: 'Aethermoor, Codex No. 17', wear: 'either', special: true, fx: { regen: 1 },
      does: 'At the start of each of her turns she heals 1% of her HP',
      where: 'Gorrow, the Mire-King, in his crown of reeds at Willowmurk (a place still to come)', band: 1, home: null,
      look: 'a finger ring of verdigris bronze shaped like a frog’s toes, gripping a warm, damp pearl, strands of reed round it',
      line: 'Grown in the throat of the oldest frog in the fen. It is warm, and never quite dry.',
    },
    {
      id: 'hag-stone', name: 'The Hag-Stone', from: 'Aethermoor, Codex No. 57', wear: 'either', special: true, fx: { power: 10 },
      does: 'More of her own power: on Io, 10% more MP; on Sol, her Heat builds 10% faster',
      where: 'Bogmire: Old Wenna keeps it in a jar', band: 1, home: 'bogmire',
      look: 'a finger ring of pitted bog-iron set with a small grey stone with a hole worn through it, tied on with twine',
      line: 'Look through the hole and you see what is really there.',
    },
    {
      id: 'unfair-toll', name: 'Hodge’s Unfair Toll', from: 'Aethermoor, Codex No. 53', wear: 'either', fx: { might: 1 },
      does: 'Her blows and spells land 1% harder',
      where: 'Rotbridge: win the ferryman’s toll game (a place still to come)', band: 1, home: null,
      look: 'a clipped bronze coin worn smooth, on an iron chain',
      line: 'Hodge charges what he likes. Now so do you.',
    },
    {
      id: 'bogstriders', name: 'The Bogstriders', from: 'Aethermoor, Codex No. 54', wear: 'either', fx: { hp: 1 },
      does: 'She has 1% more HP',
      where: 'Bogmire', band: 1, home: 'bogmire',
      look: 'dark leather boots on splayed willow-wood soles, reed laces, moss at the tops',
      line: 'Boots for a country where the ground is only a rumour.',
    },
    {
      id: 'sunstone-heart', name: 'The Sunstone Heart', from: 'Aethermoor, Codex No. 34', wear: 'either', fx: { hp: 1 },
      does: 'She has 1% more HP',
      where: 'In Old Snag’s wallow on the Warm Roads’ moor: the mud is warm because of it', band: 2, home: null,
      look: 'a heart-shaped amber sunstone set in gold, its veins glowing like embers, on a gold chain',
      line: 'It beats.',
    },
    {
      id: 'lightfingers', name: 'Lightfingers', from: 'Thareia, Codex No. 77', wear: 'either', fx: { might: 1 },
      does: 'Her blows and spells land 1% harder',
      where: 'The shipyard: lost in the cove below the slips', band: 3, home: 'shipyard',
      look: 'dark leather gloves with the fingertips worn away, frost-blue stitching, a silver cuff band with a sapphire, a gold coin tucked in the cuff',
      line: 'The fingertips are worn through from counting other people’s coin.',
    },
    {
      id: 'hushweave-cowl', name: 'The Hushweave Cowl', from: 'Aethermoor, Codex No. 52', wear: 'either', fx: { hp: 1.5 },
      does: 'She has 1.5% more HP',
      where: 'Frostmere Lake, under the ice (a place still to come)', band: 4, home: null,
      look: 'a hood woven of something pale and fine that isn’t wool, frost-white with silver spirals, a pearl at the clasp',
      line: 'Woven under the ice by someone who was listening. Wear it and you hear a heartbeat, very slow, very far down.',
    },
    {
      id: 'thornwreath', name: 'The Thornwreath', from: 'Aethermoor, Codex No. 11 (and Thareia No. 78)', wear: 'either', fx: { might: 1.5 },
      does: 'Her blows and spells land 1.5% harder',
      where: 'The Bramble Colossus, the first time it falls', band: 4, home: null,
      look: 'a crown of black bramble canes and bark, thorns, small green buds and red berries, moss',
      line: 'It grew round the Colossus’s heart while nobody was looking, and it has not stopped growing.',
    },
  ];
  // the totals the sixteen reach: what the two hidden keepsakes gave on October 4 (Io's Lunar Mend and Waxing Light
  // heal 25% more; Sol has 10% more HP, and her blows land 10% harder). The two hidden ones keep a quarter of each. HP and
  // blows reach Sol's totals when she wears all the shared ones; a shared one Io wears gives Io its HP or spells instead
  const TOTALS = { heal: 25, hp: 10, might: 10, hidden: 0.25 };
  G.LOOT = { ITEMS, TOTALS };
})(typeof globalThis !== 'undefined' ? globalThis : window);
