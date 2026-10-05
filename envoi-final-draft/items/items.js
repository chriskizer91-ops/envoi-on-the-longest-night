// items.js: the twenty keepsakes Io and Sol can find, locked by Chris on October 4, 2026 (evening). He approved their
// places that night and sent their pictures, and they went into the game (src/game/keepsakes.js reads this list).
//
// Chris's rules, as he gave them that evening:
// - six only Io can wear, six only Sol can wear, eight either can wear (one hero could wear fourteen);
// - every keepsake has one main help, a small share of healing, damage or max HP, and one other help, either in fights
//   (Trance fills faster: two keepsakes each; starting a fight with Heat) or outside them (more shards; not walking faster);
// - together the main helps reach what the two hidden keepsakes give today (Io's Lunar Mend and Waxing Light heal 25%
//   more; Sol has 10% more HP, and her blows land 10% harder); the two hidden ones keep a quarter of that and stay the
//   strongest, so the Warden's Brooch keeps both its halves;
// - four are gifts from townsfolk, and the first fight with the Bramble Colossus gives each hero one;
// - names say what each thing is and where it is found.
//
// Several looks still borrow from Chris's Aethermoor relics (chriskizer91-ops/New-game, game/src/data/relics.js on
// claude/cool-ptolemy-uc93gg, and thareia/game/src/data/relics.js on claude/tender-babbage-4wiplk; `from` names the relic).
//
// wear: 'io' | 'sol' | 'either'. source: 'hidden' (lies hidden where it is today), 'gift' (giver gives it), 'fight'
// (the first Bramble Colossus gives it), 'found' (lies on a walking map, found by exploring a town or walking, and
// fighting, through the wilds). home: the walking map (src/game/maps.js) it lies on, or null. at: where it lies there, in
// the painting's 1536 x 1024 pixels: the two hidden ones where they lie today, the twelve found ones where Claude put
// them on October 4 at Chris's word (each away from the main way through, somewhere Io can reach), for him to move as
// he likes in the map editor. main and also: the two helps as numbers,
// in percent unless named: heal (Io's Lunar Mend and Waxing Light heal more), hp (more max HP), might (her blows, and on
// Io her spells, land harder); trance (her Trance fills faster), heat (Sol starts each fight with this much Heat),
// herbHeal (the herbs she uses in a fight heal more), mp (more max MP), mpBack and hpBack (after each fight she gets this
// share back), regen (at the start of each of her turns she heals this share of her max HP), sunder (Sunder lasts this
// many turns longer), stoop (Kestrel Stoop lands harder), shards (fights give more shards), herbPrice (herbs cost less
// in the shops), glint (hidden things glint brighter on the maps), flee (running from a pack works this often, out of
// 1), bigBlows (the big blows a foe warns of hit her softer), frost (Frost slows her for this much less of the time).
// does and also: the same in words; inFight: whether the other help works in fights (true) or outside them (false).
// look: what it looks like, as Chris's picture shows it (art request 14). pic: its tiny picture in the game,
// art/keepsakes/<id>.png (tools/keepsake-pictures.mjs makes them from his packs in reference/art/keepsakes/).
// after: a gate the story must have passed before it lies on its map (st.done in the game).
// Defines window.LOOT = { ITEMS, TOTALS }.
(function (G) {
  'use strict';
  const ITEMS = [
    // ---------- only Io: each makes her Lunar Mend and Waxing Light heal more ----------
    {
      id: 'crescent-locket', name: 'The Crescent Locket', wear: 'io', secret: true, source: 'hidden',
      main: { heal: 6.25 }, also: { trance: 10 }, inFight: true,
      does: 'Lunar Mend and Waxing Light heal 6.25% more', alsoDoes: 'Her Trance fills 10% faster',
      where: 'Hidden on top of the red roof in Wickhollow, at the end of Chris’s secret way', band: 1, home: 'wickhollow', at: [458, 562],
      look: 'a little locket with a crescent moon on its lid and a moonstone in it, on a fine chain',
      pic: "art/keepsakes/crescent-locket.png",
    },
    {
      id: 'knotted-shawl', name: 'Nettie’s Knotted Shawl', wear: 'io', source: 'gift', giver: 'nettie',
      main: { heal: 2.5 }, also: { herbHeal: 10 }, inFight: true,
      does: 'Lunar Mend and Waxing Light heal 2.5% more', alsoDoes: 'The herbs she uses in a fight heal 10% more',
      where: 'Nettie gives it to Io in Wickhollow as she sets out', band: 1, home: 'wickhollow',
      look: 'a plum-purple shawl knotted at the front, edged with cream lace and tassels, a little crescent moon stitched in its corner',
      pic: "art/keepsakes/knotted-shawl.png",
      from: 'Aethermoor, Codex No. 66 (Nettie’s Hexbane Shawl)',
    },
    {
      id: 'fen-heart-lamp', name: 'The Fen-Heart Lamp', wear: 'io', source: 'found',
      main: { heal: 3 }, also: { mpBack: 5 }, inFight: false,
      does: 'Lunar Mend and Waxing Light heal 3% more', alsoDoes: 'After each fight she gets back 5% of her MP',
      where: 'The fen’s dark heart, still burning at the top of the square where the great wraith sat (after gate 5)', band: 1, home: 'bogmire-heart', at: [775, 215],
      look: 'a little brass lantern with green glass panes, a warm flame still burning inside',
      after: 'greatWraith',
      pic: "art/keepsakes/fen-heart-lamp.png",
    },
    {
      id: 'moonglass', name: 'Ysmera’s Moonglass', wear: 'io', source: 'gift', giver: 'ysmera',
      main: { heal: 3.75 }, also: { mp: 10 }, inFight: true,
      does: 'Lunar Mend and Waxing Light heal 3.75% more', alsoDoes: 'She has 10% more MP',
      where: 'Ysmera gives it to Io at the shipyard', band: 3, home: 'shipyard',
      look: 'a hand mirror of pale, pearly moon-glass in a gilded frame, a crescent at its crown',
      pic: "art/keepsakes/moonglass.png",
    },
    {
      id: 'pass-bell', name: 'The Pass Bell', wear: 'io', source: 'found',
      main: { heal: 4 }, also: { trance: 10 }, inFight: true,
      does: 'Lunar Mend and Waxing Light heal 4% more', alsoDoes: 'Her Trance fills 10% faster',
      where: 'The frozen pass: in the snow under the lamp beside the road', band: 4, home: 'frozen-pass', at: [615, 625],
      look: 'a bronze hand-bell rimed with frost and hung with icicles, on a leather-wrapped handle',
      pic: "art/keepsakes/pass-bell.png",
      from: 'Aethermoor, Codex No. 40 (the Veilbell)',
    },
    {
      id: 'heart-seed', name: 'The Colossus Heart-Seed', wear: 'io', source: 'fight',
      main: { heal: 5.5 }, also: { regen: 1 }, inFight: true,
      does: 'Lunar Mend and Waxing Light heal 5.5% more', alsoDoes: 'At the start of each of her turns she heals 1% of her HP',
      where: 'The first Bramble Colossus gives it, when the party first beats one in the last band’s wilds', band: 4, home: null,
      look: 'a seed shaped like a heart, woven of bramble round a glowing amber core, a green leaf at its top',
      pic: "art/keepsakes/heart-seed.png",
    },
    // ---------- only Sol: each gives her more HP or harder blows ----------
    {
      id: 'wardens-brooch', name: 'The Warden’s Brooch', wear: 'sol', secret: true, source: 'hidden',
      main: { hp: 2.5, might: 2.5 }, also: { trance: 10 }, inFight: true,
      does: 'She has 2.5% more HP, and her blows land 2.5% harder', alsoDoes: 'Her Trance fills 10% faster',
      where: 'Hidden where the trail into the Thornwood’s dark woods gives out', band: 1, home: 'thornwood', at: [1284, 816],
      look: 'a round bronze brooch, a bird with its wings spread round a glowing ember-red stone',
      pic: "art/keepsakes/wardens-brooch.png",
    },
    {
      id: 'hall-gauntlets', name: 'The Wardens’ Hall Gauntlets', wear: 'sol', source: 'gift', giver: 'marta',
      main: { might: 1.5 }, also: { sunder: 1 }, inFight: true,
      does: 'Her blows land 1.5% harder', alsoDoes: 'Her Sunder lasts a turn longer',
      where: 'Marta gives them to Sol at Dawnroost, from a peg over one of the forty bunks in the Wardens’ hall', band: 2, home: 'dawnroost',
      look: 'a pair of plate gauntlets in steel and bronze, every plate engraved',
      pic: "art/keepsakes/hall-gauntlets.png",
      from: 'Aethermoor, Codex No. 24 (the Vale Gauntlets)',
    },
    {
      id: 'node-sunstone', name: 'The Node Sunstone', wear: 'sol', source: 'found',
      main: { might: 1 }, also: { heat: 10 }, inFight: true,
      does: 'Her blows land 1% harder', alsoDoes: 'She starts each fight with 10 Heat',
      where: 'Dawnroost’s living node, at the top of the west stair, once Sol has relit the node (after gate 10)', band: 2, home: 'dawnroost-node', at: [205, 135],
      look: 'a glowing amber sunstone in a bronze setting, a little sun worked beneath it',
      after: 'dawnroost',
      pic: "art/keepsakes/node-sunstone.png",
    },
    {
      id: 'crossroads-pennant', name: 'The Crossroads Pennant', wear: 'sol', source: 'found',
      main: { hp: 1 }, also: { trance: 10 }, inFight: true,
      does: 'She has 1% more HP', alsoDoes: 'Her Trance fills 10% faster',
      where: 'The northern crossroads: tied to a waymark far down the east road', band: 3, home: 'crossroads', at: [1395, 470],
      look: 'a red pennant edged in gold, tasselled, on a short staff',
      pic: "art/keepsakes/crossroads-pennant.png",
    },
    {
      id: 'hearth-coal', name: 'Ede’s Hearth-Coal', wear: 'sol', source: 'gift', giver: 'ede',
      main: { hp: 1.5 }, also: { heat: 10 }, inFight: true,
      does: 'She has 1.5% more HP', alsoDoes: 'She starts each fight with 10 Heat',
      where: 'Ede gives it to Sol at Misthollow’s inn, from the fire they keep lit “for spite”', band: 4, home: 'misthollow',
      look: 'a glowing coal in a little cage of bronze wire on a leather cord',
      pic: "art/keepsakes/hearth-coal.png",
    },
    {
      id: 'colossus-thorn', name: 'The Colossus Thorn', wear: 'sol', source: 'fight',
      main: { might: 2 }, also: { stoop: 10 }, inFight: true,
      does: 'Her blows land 2% harder', alsoDoes: 'Kestrel Stoop lands 10% harder',
      where: 'The first Bramble Colossus gives it, when the party first beats one in the last band’s wilds', band: 4, home: null,
      look: 'a great curved thorn, red as embers, its base bound in leather as a grip',
      pic: "art/keepsakes/colossus-thorn.png",
    },
    // ---------- either: each gives whoever wears it more HP, or harder blows (on Io, her spells) ----------
    {
      id: 'forge-horseshoe', name: 'The Forge Horseshoe', wear: 'either', source: 'found',
      main: { hp: 1 }, also: { shards: 5 }, inFight: false,
      does: 'She has 1% more HP', alsoDoes: 'Fights give 5% more shards',
      where: 'Wickhollow: in the nook behind the house by the east bridge', band: 1, home: 'wickhollow', at: [1195, 690],
      look: 'an iron horseshoe still glowing copper at its edges, its nail holes empty',
      pic: "art/keepsakes/forge-horseshoe.png",
    },
    {
      id: 'jetty-coin', name: 'The Jetty Coin', wear: 'either', source: 'found',
      main: { might: 1 }, also: { herbPrice: 10 }, inFight: false,
      does: 'Her blows and spells land 1% harder', alsoDoes: 'Herbs cost 10% less in the shops',
      where: 'The jetty: at the far end of the lakeshore walk, under the willows', band: 1, home: 'jetty', at: [470, 372],
      look: 'an old copper coin with a little sailing boat on its face, green with age at the rim',
      pic: "art/keepsakes/jetty-coin.png",
      from: 'Aethermoor, Codex No. 53 (Hodge’s Unfair Toll)',
    },
    {
      id: 'frog-ring', name: 'The Thornwood Frog-Ring', wear: 'either', source: 'found',
      main: { hp: 1 }, also: { hpBack: 5 }, inFight: false,
      does: 'She has 1% more HP', alsoDoes: 'After each fight she gets back 5% of her HP',
      where: 'The Thornwood: where the north-east trail gives out, past the moon stone', band: 1, home: 'thornwood', at: [1380, 190],
      look: 'a bronze ring with a little green frog sitting on it',
      pic: "art/keepsakes/frog-ring.png",
      from: 'Aethermoor, Codex No. 17 (the Mire Pearl)',
    },
    {
      id: 'hag-stone', name: 'The Bogmire Hag-Stone', wear: 'either', source: 'found',
      main: { might: 1 }, also: { glint: 1 }, inFight: false,
      does: 'Her blows and spells land 1% harder', alsoDoes: 'Hidden things glint brighter on the maps',
      where: 'Bogmire: out along the north-west boardwalk', band: 1, home: 'bogmire', at: [540, 240],
      look: 'a speckled grey stone with a hole worn through it, on a loop of rough twine',
      pic: "art/keepsakes/hag-stone.png",
      from: 'Aethermoor, Codex No. 57 (the Hag-Stone)',
    },
    {
      id: 'bogstriders', name: 'The Bogstriders', wear: 'either', source: 'found',
      main: { hp: 1 }, also: { flee: 2 / 3 }, inFight: true,
      does: 'She has 1% more HP', alsoDoes: 'Running from a pack works 2 times in 3, not 1 in 2',
      where: 'Bogmire: at the east end of the southern boardwalk', band: 1, home: 'bogmire', at: [1420, 750],
      look: 'worn leather boots with moss-green cuffs and thick studded soles',
      pic: "art/keepsakes/bogstriders.png",
      from: 'Aethermoor, Codex No. 54 (the Bogstriders)',
    },
    {
      id: 'kettle-helm', name: 'The Dawnroost Kettle-Helm', wear: 'either', source: 'found',
      main: { hp: 1 }, also: { bigBlows: 10 }, inFight: true,
      does: 'She has 1% more HP', alsoDoes: 'The big blows a foe warns of hit her 10% softer',
      where: 'Dawnroost: at the west end of the wall-walk above the Wardens’ hall', band: 2, home: 'dawnroost', at: [215, 232],
      look: 'a round iron helm with bronze studs, a little rooster weather vane on top',
      pic: "art/keepsakes/kettle-helm.png",
      from: 'Aethermoor, Codex No. 16 (the Watchkeeper’s Kettle)',
    },
    {
      id: 'dockhand-gloves', name: 'The Dockhand’s Gloves', wear: 'either', source: 'found',
      main: { might: 1 }, also: { shards: 10 }, inFight: false,
      does: 'Her blows and spells land 1% harder', alsoDoes: 'Fights give 10% more shards',
      where: 'The shipyard: at the end of the west dock, down in the cove', band: 3, home: 'shipyard', at: [170, 640],
      look: 'worn brown leather gloves with sea-green cuffs',
      pic: "art/keepsakes/dockhand-gloves.png",
      from: 'Thareia, Codex No. 77 (Lightfingers)',
    },
    {
      id: 'misthollow-cowl', name: 'The Misthollow Cowl', wear: 'either', source: 'found',
      main: { hp: 1 }, also: { frost: 50 }, inFight: true,
      does: 'She has 1% more HP', alsoDoes: 'Frost slows her for half as long',
      where: 'Misthollow: at the end of the balcony bridge, up the west stairs', band: 4, home: 'misthollow', at: [135, 245],
      look: 'a frost-white hooded cowl, blue snowflakes stitched round its edge, a silver clasp',
      pic: "art/keepsakes/misthollow-cowl.png",
      from: 'Aethermoor, Codex No. 52 (the Hushweave Cowl)',
    },
  ];
  // what the main helps reach together: what the two hidden keepsakes gave on October 4. HP and blows reach Sol's totals
  // when she wears all the shared ones; a shared one Io wears gives Io its HP or spells instead
  const TOTALS = { heal: 25, hp: 10, might: 10, hidden: 0.25 };
  G.LOOT = { ITEMS, TOTALS };
})(typeof globalThis !== 'undefined' ? globalThis : window);
