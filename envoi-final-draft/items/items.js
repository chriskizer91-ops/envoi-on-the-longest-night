// items.js: the twenty keepsakes Io and Sol can find, locked by Chris on October 4, 2026 (evening). He places them
// himself next; nothing here is in the game until he has.
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
// (the first Bramble Colossus gives it), 'found' (lies on a walking map, where Chris puts it). home: the walking map
// (src/game/maps.js) it belongs to, or null. at: where the two hidden ones lie. main and also: the two helps as numbers,
// in percent unless named: heal (Io's Lunar Mend and Waxing Light heal more), hp (more max HP), might (her blows, and on
// Io her spells, land harder); trance (her Trance fills faster), heat (Sol starts each fight with this much Heat),
// herbHeal (the herbs she uses in a fight heal more), mp (more max MP), mpBack and hpBack (after each fight she gets this
// share back), regen (at the start of each of her turns she heals this share of her max HP), sunder (Sunder lasts this
// many turns longer), stoop (Kestrel Stoop lands harder), shards (fights give more shards), herbPrice (herbs cost less
// in the shops), glint (hidden things glint brighter on the maps), flee (running from a pack works this often, out of
// 1), bigBlows (the big blows a foe warns of hit her softer), frost (Frost slows her for this much less of the time).
// does and also: the same in words; inFight: whether the other help works in fights (true) or outside them (false).
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
      look: 'a little silver locket with a crescent moon on its lid, on a fine silver chain',
    },
    {
      id: 'knotted-shawl', name: 'Nettie’s Knotted Shawl', wear: 'io', source: 'gift', giver: 'nettie',
      main: { heal: 2.5 }, also: { herbHeal: 10 }, inFight: true,
      does: 'Lunar Mend and Waxing Light heal 2.5% more', alsoDoes: 'The herbs she uses in a fight heal 10% more',
      where: 'Nettie gives it to Io in Wickhollow as she sets out', band: 1, home: 'wickhollow',
      look: 'a shawl of grey bog-cotton tied all over with little knots, small bone and wood charms on cords, a moss-green trim',
      from: 'Aethermoor, Codex No. 66 (Nettie’s Hexbane Shawl)',
    },
    {
      id: 'fen-heart-lamp', name: 'The Fen-Heart Lamp', wear: 'io', source: 'found',
      main: { heal: 3 }, also: { mpBack: 5 }, inFight: false,
      does: 'Lunar Mend and Waxing Light heal 3% more', alsoDoes: 'After each fight she gets back 5% of her MP',
      where: 'The fen’s dark heart, still burning where the great wraith sat (after gate 5)', band: 1, home: 'bogmire-heart',
      look: 'a small old hand lamp of black iron and brass, fen mud and a strand of reed on it, a warm steady flame inside',
    },
    {
      id: 'moonglass', name: 'Ysmera’s Moonglass', wear: 'io', source: 'gift', giver: 'ysmera',
      main: { heal: 3.75 }, also: { mp: 10 }, inFight: true,
      does: 'Lunar Mend and Waxing Light heal 3.75% more', alsoDoes: 'She has 10% more MP',
      where: 'Ysmera gives it to Io at the shipyard', band: 3, home: 'shipyard',
      look: 'a round lens of pale, pearly moon-glass with a soft glow inside, in a slender silver setting on a silver chain',
    },
    {
      id: 'pass-bell', name: 'The Pass Bell', wear: 'io', source: 'found',
      main: { heal: 4 }, also: { trance: 10 }, inFight: true,
      does: 'Lunar Mend and Waxing Light heal 4% more', alsoDoes: 'Her Trance fills 10% faster',
      where: 'In the snow beside the road on the frozen pass', band: 4, home: 'frozen-pass',
      look: 'a small bronze hand-bell rimed with frost, a silver handle and clapper, a fine crack in it glowing pale blue-white',
      from: 'Aethermoor, Codex No. 40 (the Veilbell)',
    },
    {
      id: 'heart-seed', name: 'The Colossus Heart-Seed', wear: 'io', source: 'fight',
      main: { heal: 5.5 }, also: { regen: 1 }, inFight: true,
      does: 'Lunar Mend and Waxing Light heal 5.5% more', alsoDoes: 'At the start of each of her turns she heals 1% of her HP',
      where: 'The first Bramble Colossus gives it, when the party first beats one in the last band’s wilds', band: 4, home: null,
      look: 'a seed the size of a plum, a dark bark-like husk veined with warm glowing ember light, bramble tendrils curled round it, one tiny green shoot',
    },
    // ---------- only Sol: each gives her more HP or harder blows ----------
    {
      id: 'wardens-brooch', name: 'The Warden’s Brooch', wear: 'sol', secret: true, source: 'hidden',
      main: { hp: 2.5, might: 2.5 }, also: { trance: 10 }, inFight: true,
      does: 'She has 2.5% more HP, and her blows land 2.5% harder', alsoDoes: 'Her Trance fills 10% faster',
      where: 'Hidden where the trail into the Thornwood’s dark woods gives out', band: 1, home: 'thornwood', at: [1284, 816],
      look: 'an old sunstone brooch in dark bronze, a sun with straight and wavy rays, the stone still glowing warm',
    },
    {
      id: 'hall-gauntlets', name: 'The Wardens’ Hall Gauntlets', wear: 'sol', source: 'gift', giver: 'marta',
      main: { might: 1.5 }, also: { sunder: 1 }, inFight: true,
      does: 'Her blows land 1.5% harder', alsoDoes: 'Her Sunder lasts a turn longer',
      where: 'Marta gives them to Sol at Dawnroost, from a peg over one of the forty bunks in the Wardens’ hall', band: 2, home: 'dawnroost',
      look: 'bronze plate gauntlets with gold trim, a small gold sun on each cuff, every knuckle-plate engraved',
      from: 'Aethermoor, Codex No. 24 (the Vale Gauntlets)',
    },
    {
      id: 'node-sunstone', name: 'The Node Sunstone', wear: 'sol', source: 'found',
      main: { might: 1 }, also: { heat: 10 }, inFight: true,
      does: 'Her blows land 1% harder', alsoDoes: 'She starts each fight with 10 Heat',
      where: 'Dawnroost’s living node, once Sol has relit it (after gate 10)', band: 2, home: 'dawnroost-node',
      look: 'a rough chip of sunstone the size of a walnut, glowing warm amber, wrapped in bronze wire on a leather cord',
    },
    {
      id: 'crossroads-pennant', name: 'The Crossroads Pennant', wear: 'sol', source: 'found',
      main: { hp: 1 }, also: { trance: 10 }, inFight: true,
      does: 'She has 1% more HP', alsoDoes: 'Her Trance fills 10% faster',
      where: 'Tied to the stone ring at the northern crossroads', band: 3, home: 'crossroads',
      look: 'a torn, wind-worn scrap of a Wardens’ pennant, burnt-orange cloth with a gold sun, frayed edges, tied with cord',
    },
    {
      id: 'hearth-coal', name: 'Ede’s Hearth-Coal', wear: 'sol', source: 'gift', giver: 'ede',
      main: { hp: 1.5 }, also: { heat: 10 }, inFight: true,
      does: 'She has 1.5% more HP', alsoDoes: 'She starts each fight with 10 Heat',
      where: 'Ede gives it to Sol at Misthollow’s inn, from the fire they keep lit “for spite”', band: 4, home: 'misthollow',
      look: 'a glowing coal in a little cage of black iron on a chain, bright orange embers, a thin curl of smoke',
    },
    {
      id: 'colossus-thorn', name: 'The Colossus Thorn', wear: 'sol', source: 'fight',
      main: { might: 2 }, also: { stoop: 10 }, inFight: true,
      does: 'Her blows land 2% harder', alsoDoes: 'Kestrel Stoop lands 10% harder',
      where: 'The first Bramble Colossus gives it, when the party first beats one in the last band’s wilds', band: 4, home: null,
      look: 'a thorn as long as a dagger, glossy black-green, its broad base wrapped in leather as a grip',
    },
    // ---------- either: each gives whoever wears it more HP, or harder blows (on Io, her spells) ----------
    {
      id: 'forge-horseshoe', name: 'The Forge Horseshoe', wear: 'either', source: 'found',
      main: { hp: 1 }, also: { shards: 5 }, inFight: false,
      does: 'She has 1% more HP', alsoDoes: 'Fights give 5% more shards',
      where: 'By Hilde’s forge in Wickhollow', band: 1, home: 'wickhollow',
      look: 'an iron horseshoe still faintly glowing warm at its edges, sooty, its nail holes empty',
    },
    {
      id: 'jetty-coin', name: 'The Jetty Coin', wear: 'either', source: 'found',
      main: { might: 1 }, also: { herbPrice: 10 }, inFight: false,
      does: 'Her blows and spells land 1% harder', alsoDoes: 'Herbs cost 10% less in the shops',
      where: 'Between the boards of the jetty where the Magpie is moored', band: 1, home: 'jetty',
      look: 'an old bronze coin, clipped unevenly and worn smooth, a little boat on its face, on a short cord',
      from: 'Aethermoor, Codex No. 53 (Hodge’s Unfair Toll)',
    },
    {
      id: 'frog-ring', name: 'The Thornwood Frog-Ring', wear: 'either', source: 'found',
      main: { hp: 1 }, also: { hpBack: 5 }, inFight: false,
      does: 'She has 1% more HP', alsoDoes: 'After each fight she gets back 5% of her HP',
      where: 'In the Thornwood’s stream, by the moon stone', band: 1, home: 'thornwood',
      look: 'a finger ring of verdigris bronze shaped like a frog’s toes, gripping a warm, damp pearl, strands of reed round it',
      from: 'Aethermoor, Codex No. 17 (the Mire Pearl)',
    },
    {
      id: 'hag-stone', name: 'The Bogmire Hag-Stone', wear: 'either', source: 'found',
      main: { might: 1 }, also: { glint: 1 }, inFight: false,
      does: 'Her blows and spells land 1% harder', alsoDoes: 'Hidden things glint brighter on the maps',
      where: 'Bogmire', band: 1, home: 'bogmire',
      look: 'a smooth grey stone with a round hole worn through it, on a loop of rough twine, a faint silvery light through the hole',
      from: 'Aethermoor, Codex No. 57 (the Hag-Stone)',
    },
    {
      id: 'bogstriders', name: 'The Bogstriders', wear: 'either', source: 'found',
      main: { hp: 1 }, also: { flee: 2 / 3 }, inFight: true,
      does: 'She has 1% more HP', alsoDoes: 'Running from a pack works 2 times in 3, not 1 in 2',
      where: 'Bogmire', band: 1, home: 'bogmire',
      look: 'dark leather boots on wide, splayed willow-wood soles, reed laces, moss at the tops',
      from: 'Aethermoor, Codex No. 54 (the Bogstriders)',
    },
    {
      id: 'kettle-helm', name: 'The Dawnroost Kettle-Helm', wear: 'either', source: 'found',
      main: { hp: 1 }, also: { bigBlows: 10 }, inFight: true,
      does: 'She has 1% more HP', alsoDoes: 'The big blows a foe warns of hit her 10% softer',
      where: 'Dawnroost', band: 2, home: 'dawnroost',
      look: 'a dented iron kettle-helm with bronze trim and rivets, a little bronze weather vane on top',
      from: 'Aethermoor, Codex No. 16 (the Watchkeeper’s Kettle)',
    },
    {
      id: 'dockhand-gloves', name: 'The Dockhand’s Gloves', wear: 'either', source: 'found',
      main: { might: 1 }, also: { shards: 10 }, inFight: false,
      does: 'Her blows and spells land 1% harder', alsoDoes: 'Fights give 10% more shards',
      where: 'Lost in the shipyard’s cove, below the slips', band: 3, home: 'shipyard',
      look: 'dark leather gloves with the fingertips worn through, frost-blue stitching, a silver band at each cuff',
      from: 'Thareia, Codex No. 77 (Lightfingers)',
    },
    {
      id: 'misthollow-cowl', name: 'The Misthollow Cowl', wear: 'either', source: 'found',
      main: { hp: 1 }, also: { frost: 50 }, inFight: true,
      does: 'She has 1% more HP', alsoDoes: 'Frost slows her for half as long',
      where: 'Misthollow', band: 4, home: 'misthollow',
      look: 'a hood of something pale and fine, frost-white with silver spirals, a pearl at the clasp',
      from: 'Aethermoor, Codex No. 52 (the Hushweave Cowl)',
    },
  ];
  // what the main helps reach together: what the two hidden keepsakes gave on October 4. HP and blows reach Sol's totals
  // when she wears all the shared ones; a shared one Io wears gives Io its HP or spells instead
  const TOTALS = { heal: 25, hp: 10, might: 10, hidden: 0.25 };
  G.LOOT = { ITEMS, TOTALS };
})(typeof globalThis !== 'undefined' ? globalThis : window);
