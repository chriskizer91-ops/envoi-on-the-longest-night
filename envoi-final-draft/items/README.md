# The Twenty Keepsakes

October 4, 2026, evening. This is Chris's plan for things to find. There are twenty keepsakes, each with a still picture. Io and Sol put them on and take them off on a new Items page, and each one gives its wearer a small, lasting help in fights. This folder has the list (`items.js`), and `../item-places/` is the page where Chris puts each one on the maps. **Nothing here is in the game yet.** It goes in once Chris has placed them and said yes to the list.

## What Chris asked

- Each keepsake gets a still picture, with no animation. Each hero gets a place that shows what she has on, where she can put things on and take them off, and putting one on gives her its effect.
- "For the 20 keepsake items you should pull them from the thariea or aethermoor games loot set": six only Io can wear, six only Sol can wear, and eight either can wear.
- The two hidden keepsakes already in the game keep a quarter of what they give now.
- Later the same evening: "health boost for IO and damage and health boost for sol should stay the same totals But those totals should be reached by 16 of the items and the other should be special." The sixteen differ in size ("some of them might be 1% of something... some of them might be 3%"). The four specials are one Trance item for each hero, "increasing trance charge speed by 20% and that's all it does", and two rings that are "boosts for something else".
- Chris places them himself, on a version of the map editor that shows every place people walk.

## Who wears what

- Six are Io's alone, six are Sol's alone, and eight either can wear.
- A keepsake is worn by one hero at a time, and there's no limit to how many one hero wears. So if the party finds all twenty, one hero can wear fourteen (her own six and all eight shared ones) while the other wears her own six.
- They go on and come off at any time outside a fight, on the Items page. The shared eight can be moved from one hero to the other.

## How much help: the same totals, from sixteen

Today the two hidden keepsakes make Io's Lunar Mend and Waxing Light heal 25% more, and give Sol 10% more HP and blows that land 10% harder. Sixteen keepsakes reach exactly those totals between them:

| Total | Today: the two hidden ones | The two hidden ones, cut to a quarter | The other fourteen | All sixteen |
|---|---|---|---|---|
| Io's healing | 25% | 6.25% (the Orrery) | 18.75%, from four of Io's own: 3.75%, 4.5%, 5% and 5.5% | **25%** |
| Sol's HP | 10% | 2.5% (the Seal) | 7.5%, from five: 1%, 1%, 1%, 1.5% and 3% | **10%** |
| Sol's blows | 10% | 2.5% (the Seal) | 7.5%, from five: 1%, 1%, 1%, 1.5% and 3% | **10%** |

- **The two hidden ones are still the strongest.** The Orrery is the biggest healing keepsake, and the Seal is the only one that helps Sol twice.
- **The sizes differ,** from 1% to 6.25%, as Chris asked, and most of the bigger ones are found later in the game.
- **Io's healing comes only from Io's own keepsakes,** since only she heals. HP and blows come from Sol's own and from the shared ones. Sol's totals are reached when she wears all the shared ones. A shared one that Io wears gives Io its HP, or makes her spells land harder, instead.

The four specials are on top of the totals:

| Special | Who | What it does, and all it does |
|---|---|---|
| ✦ The Veilbell | Io only | Io's Trance fills 20% faster |
| ✦ The Sunstone Lantern | Sol only | Sol's Trance fills 20% faster |
| ✦ The Mire Pearl, a ring | Either | At the start of each of her turns she heals 1% of her HP |
| ✦ The Hag-Stone, a ring | Either | More of her own power: on Io, 10% more MP; on Sol, her Heat builds 10% faster |

As with the two today, the balance never counts on any of them. Every fight is tuned for heroes wearing nothing, so someone who finds none can still win, and someone who finds all twenty has it a little easier. Once Chris agrees the list, the balance simulator (`tools/balance.mjs`) will show how much easier the game gets with all twenty worn.

## The twenty

★ marks the two hidden ones, which are in the game today under the names the Crescent Locket and the Warden's Brooch (`../../docs/questions/open.md`, 24 and 30). ✦ marks the four specials.

| # | Keepsake | Who | What it does | Adds to | Where it might be | From |
|---|---|---|---|---|---|---|
| 1 | ★ The Orrery of Hours | Io | Lunar Mend and Waxing Light heal 6.25% more | Io's healing | Hidden on top of the red roof in Wickhollow (where Io's hidden keepsake lies today) | Aethermoor, No. 26 |
| 2 | Nettie's Hexbane Shawl | Io | Lunar Mend and Waxing Light heal 3.75% more | Io's healing | Wickhollow: Nettie knots it for Io, for a small favour | Aethermoor, No. 66 |
| 3 | The Mosswatch Lantern | Io | Lunar Mend and Waxing Light heal 4.5% more | Io's healing | Mosswatch Tower, on the southwest coast (a place still to come) | Aethermoor, No. 15 |
| 4 | The First Seed | Io | Lunar Mend and Waxing Light heal 5% more | Io's healing | Eldergrove, at the root of its oldest tree (a place still to come) | Aethermoor, No. 23 |
| 5 | The Fawnrest Heartstone | Io | Lunar Mend and Waxing Light heal 5.5% more | Io's healing | The White Hart of Fawnrest leaves it at Io's feet when the frost cracks off it | Thareia, No. 75 |
| 6 | ✦ The Veilbell | Io | Io's Trance fills 20% faster | Special | Peak's Veil, the monastery in the clouds (a place still to come) | Aethermoor, No. 40 |
| 7 | ★ The Warden's Seal | Sol | Sol has 2.5% more HP, and her blows land 2.5% harder | HP and blows | Hidden where the trail into the Thornwood's dark woods gives out (where Sol's hidden keepsake lies today) | Aethermoor, No. 4 |
| 8 | The Vale Gauntlets | Sol | Sol's blows land 1% harder | Blows | Dawnroost: on a peg over one of the forty bunks in the Wardens' hall; Marta tells Sol to take them | Aethermoor, No. 24 |
| 9 | ✦ The Sunstone Lantern | Sol | Sol's Trance fills 20% faster | Special | Inside one of the Warm Roads' dark nodes, once Sol relights it | Aethermoor, No. 28 |
| 10 | The Watchkeeper's Kettle | Sol | Sol has 1% more HP | HP | The shipyard: Old Gil's, from his years keeping watch | Aethermoor, No. 16 |
| 11 | The Ironvein Bracers | Sol | Sol's blows land 3% harder | Blows | Misthollow, where they were forged (Misthollow is Ironhold on Chris's map) | Aethermoor, No. 43 |
| 12 | The Roc-Feather Cloak | Sol | Sol has 3% more HP | HP | The Thunder-Roc's eyrie at Stormwatch, left behind when it rises into the storm (a place still to come) | Aethermoor, No. 44 |
| 13 | ✦ The Mire Pearl | Either | At the start of each of her turns she heals 1% of her HP | Special | Gorrow, the Mire-King, in his crown of reeds at Willowmurk (a place still to come) | Aethermoor, No. 17 |
| 14 | ✦ The Hag-Stone | Either | More of her own power: on Io, 10% more MP; on Sol, her Heat builds 10% faster | Special | Bogmire: Old Wenna keeps it in a jar | Aethermoor, No. 57 |
| 15 | Hodge's Unfair Toll | Either | Her blows and spells land 1% harder | Blows | Rotbridge: win the ferryman's toll game (a place still to come) | Aethermoor, No. 53 |
| 16 | The Bogstriders | Either | She has 1% more HP | HP | Bogmire | Aethermoor, No. 54 |
| 17 | The Sunstone Heart | Either | She has 1% more HP | HP | In Old Snag's wallow on the Warm Roads' moor: the mud is warm because of it | Aethermoor, No. 34 |
| 18 | Lightfingers | Either | Her blows and spells land 1% harder | Blows | The shipyard: lost in the cove below the slips | Thareia, No. 77 |
| 19 | The Hushweave Cowl | Either | She has 1.5% more HP | HP | Frostmere Lake, under the ice (a place still to come) | Aethermoor, No. 52 |
| 20 | The Thornwreath | Either | Her blows and spells land 1.5% harder | Blows | The Bramble Colossus, the first time it falls | Aethermoor, No. 11 (and Thareia, No. 78) |

**Two moved group for Chris's rule.** The Hag-Stone (a ring in Aethermoor, as the Mire Pearl is) became shared, so the two rings are the two shared specials. The Fawnrest Heartstone became Io's, so Io has five healing keepsakes and the Orrery stays the strongest of them. Both still fit their places: the White Hart lays the Heartstone at Io's feet, and Old Wenna's jar is in Bogmire, where either hero can be given it.

**"Where it might be" is only a suggestion.** Chris places each one on the Item Places page. Eleven of them point at places that aren't walking maps yet: the named places of the D&D map and the great creatures' lairs (art request 13). Until those places exist, each of these can wait as "Not placed", go on a map that exists now, or become "A reward instead".

## Where the names come from

Every name, look and line is one of Chris's own relics. Eighteen come from Aethermoor (`New-game`, `game/src/data/relics.js` on `claude/cool-ptolemy-uc93gg`, Hearth & Heirloom's codex). Two come from Thareia (`thareia/game/src/data/relics.js` on `claude/tender-babbage-4wiplk`). Their looks come from `thareia/game/src/art/item-looks.js` on the same branch. The two rings are rings there too.

They are brought into this story. Here it's Noctara's cold that troubles the world, never the Rot, and nothing in them is drowned. Their places point at this game's own people (Nettie, Old Wenna, Marta, Old Gil) and at the D&D map's named places. One person is new, Hodge, the ferryman at Rotbridge, and the great creatures are art request 13's. None of it is canon until Chris says so.

## Placing them: the Item Places page

`../item-places/` is a version of the Walking Paths page (`../../envoi-game-pass-3/map-paths/`), with the same thirteen walking maps and the same rules for where Io can walk. It is published at https://claude.ai/artifact/M3PokTZsXbbxbx2BSDSrC5 and is made for a laptop, like Walking Paths.

1. **Pick a keepsake** in the list on the right. Its card shows who can wear it, what it does, its line, and where it might be. ★ marks the two hidden ones and ✦ the four specials.
2. **Pick a map,** press **Put it on this map**, then click the painting where it lies. Drag a glint to move it, and Delete takes the picked one off.
3. **The glint's colour** shows who can wear it: pink for Io, amber for Sol, gold for either.
4. **A red ring** means Io can't get near enough to pick it up there. The page checks every placement with the game's own walking rules. Move it onto ground she can reach, or draw her a way there on the Walking Paths page.
5. **Walk it** walks Io there with the game's own walking. Each keepsake glints faintly, as the hidden ones do in the game. Stand by one and press the action button to see it.
6. **A reward instead** is for a keepsake that a person or a fight gives rather than one lying on a map. The note says who.
7. **Send my item places** sends all twenty to Claude through the page's database (collection `places`, one document per keepsake). **Copy my item places** is the fallback: paste them in the chat.

The page keeps Chris's places in his browser as he goes, so he can come back to it.

For Claude: read them with the `ArtifactData` tool, `list` on collection `places` of that artifact. Each document holds `{item, name, wear, map, x, y, reward, note, sent}`, with `x` and `y` in the map's 1536 × 1024 painting.

To rebuild the page: `node tools/build.mjs envoi-final-draft/item-places/item-places.html`, then publish `dist/item-places.artifact.html` to the same link with the `db` capability.

## Putting them in the game, once Chris has placed them

1. **The rules:** `ITEMS` in `src/battle/rules.js`, taken from `items.js`, with each effect (`fx`) worked into the battle engine. The two keepsakes are cut to a quarter at the same moment, so the totals stay as they are today.
2. **Finding them:** each lies as a glint where Chris put it, like the two today, or comes from the person or fight he named. Finding one shows its picture, its name and line, and who can wear it.
3. **The Items page:** a new tab in the menu, with Io's and Sol's keepsakes side by side, each with its picture. Tap one to see it, put it on, take it off, or hand a shared one to the other hero.
4. **The save** keeps what was found and who wears what. A save that already has the two keepsakes keeps them.
5. **The pictures:** art request 14 (`../../docs/art-requests/14-keepsake-items.md`). Until they come, each keepsake shows a small drawn stand-in.
6. **A demo page on Chris's phone first,** as always, then the game.

## Questions for Chris

`../../docs/questions/open.md`, 30 and 32: whether these are the right twenty, with the two hidden ones renamed, and the new people and places in their lines. Question 31, what kind of help they give, Chris answered with the rule above.
