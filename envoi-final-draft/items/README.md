# The Twenty Keepsakes

October 4, 2026, evening. This is Chris's plan for things to find. There are twenty keepsakes, each with a still picture. Io and Sol put them on and take them off on a new Items page, and each one gives its wearer a small, lasting help in fights. This folder has the list (`items.js`), and `../item-places/` is the page where Chris puts each one on the maps. **Nothing here is in the game yet.** It goes in once Chris has placed them and said yes to the list.

## What Chris asked

- Each keepsake gets a still picture, with no animation. Each hero gets a place that shows what she has on, where she can put things on and take them off, and putting one on gives her its effect.
- The two hidden keepsakes already in the game keep a quarter of what they give now. All twenty together: the two hidden ones are a quarter of all the help keepsakes give, and the other eighteen are three quarters.
- "For the 20 keepsake items you should pull them from the thariea or aethermoor games loot set. And maybe we widen what they can do": six only Io can wear, six only Sol can wear, and eight either can wear.
- Chris places them himself, on a version of the map editor that shows every place people walk.

## Who wears what

- Six are Io's alone, six are Sol's alone, and eight either can wear.
- A keepsake is worn by one hero at a time, and there's no limit to how many one hero wears. So if the party finds all twenty, one hero can wear fourteen (her own six and all eight shared ones) while the other wears her own six.
- They go on and come off at any time outside a fight, on the Items page. The shared eight can be moved from one hero to the other.

## How much help: a quarter and three quarters

Today the two hidden keepsakes give 45 points of help, where a point is about one percent of one of a hero's main strengths:

| | Today | After |
|---|---|---|
| Io's: Lunar Mend and Waxing Light heal more | 25% more: 25 points | 6.25% more: 6.25 points |
| Sol's: more HP, and her blows land harder | 10% and 10%: 20 points | 2.5% and 2.5%: 5 points |
| The two hidden ones together | 45 points | 11.25 points: **a quarter** |
| The other eighteen | (not in the game) | 33.75 points, about 1.9 each: **three quarters** |
| **All twenty** | | **45 points**, the same as the two give today |

Yes, Chris's numbers work. Two things follow from them:

- **Each of the eighteen is small on its own,** about 2%. The two hidden ones are about three times as strong as any other.
- **Once everything is found, the total help is what the two give today.** It is spread over the whole game, so finding things matters all the way to the end.

As with the two today, the balance never counts on any of them. Every fight is tuned for heroes wearing nothing, so someone who finds none can still win, and someone who finds all twenty has it a little easier.

The effects are first guesses. Once Chris agrees the list, the balance simulator (`tools/balance.mjs`) will measure what each one is really worth and set its numbers so that the eighteen add up to three quarters.

## The twenty

★ marks the two hidden ones, which are in the game today under the names the Crescent Locket and the Warden's Brooch (`../../docs/questions/open.md`, 24 and 30).

| # | Keepsake | Who | What it does | Where it might be | From |
|---|---|---|---|---|---|
| 1 | ★ The Orrery of Hours | Io | Lunar Mend and Waxing Light heal 6% more | Hidden on top of the red roof in Wickhollow (where Io's hidden keepsake lies today) | Aethermoor, No. 26 |
| 2 | Nettie's Hexbane Shawl | Io | The herbs Io uses heal 15% more | Wickhollow: Nettie knots it for Io, for a small favour | Aethermoor, No. 66 |
| 3 | The Mosswatch Lantern | Io | Lunar Mend and Waxing Light cost 5% less MP | Mosswatch Tower, on the southwest coast (a place still to come) | Aethermoor, No. 15 |
| 4 | The Hag-Stone | Io | Io's spells strike 2% harder. On the maps, hidden things glint brighter | Bogmire: Old Wenna keeps it in a jar | Aethermoor, No. 57 |
| 5 | The First Seed | Io | Nightbloom Briars hold a foe longer: its next turn comes later | Eldergrove, at the root of its oldest tree (a place still to come) | Aethermoor, No. 23 |
| 6 | The Veilbell | Io | Frost Dust and frost breath slow Io for half as long | Peak's Veil, the monastery in the clouds (a place still to come) | Aethermoor, No. 40 |
| 7 | ★ The Warden's Seal | Sol | Sol has 2.5% more HP, and her blows land 2.5% harder | Hidden where the trail into the Thornwood's dark woods gives out (where Sol's hidden keepsake lies today) | Aethermoor, No. 4 |
| 8 | The Vale Gauntlets | Sol | Sol's Sunder lasts one turn longer | Dawnroost: on a peg over one of the forty bunks in the Wardens' hall; Marta tells Sol to take them | Aethermoor, No. 24 |
| 9 | The Sunstone Lantern | Sol | Sol starts every fight with 10 Heat | Inside one of the Warm Roads' dark nodes, once Sol relights it | Aethermoor, No. 28 |
| 10 | The Watchkeeper's Kettle | Sol | Sol takes 2% less harm | The shipyard: Old Gil's, from his years keeping watch | Aethermoor, No. 16 |
| 11 | The Ironvein Bracers | Sol | Sol's Heat builds 10% faster | Misthollow, where they were forged (Misthollow is Ironhold on Chris's map) | Aethermoor, No. 43 |
| 12 | The Roc-Feather Cloak | Sol | Kestrel Stoop lands 10% harder | The Thunder-Roc's eyrie at Stormwatch, left behind when it rises into the storm (a place still to come) | Aethermoor, No. 44 |
| 13 | The Mire Pearl | Either | 2% more HP | Gorrow, the Mire-King, in his crown of reeds at Willowmurk (a place still to come) | Aethermoor, No. 17 |
| 14 | Hodge's Unfair Toll | Either | The foes' first turns come a little later | Rotbridge: win the ferryman's toll game (a place still to come) | Aethermoor, No. 53 |
| 15 | The Bogstriders | Either | Her turns come 1% sooner, and when she is grabbed she keeps a little of her turn. On the maps the party walks a little faster | Bogmire | Aethermoor, No. 54 |
| 16 | The Sunstone Heart | Either | She heals a little at the start of each of her turns | In Old Snag's wallow on the Warm Roads' moor: the mud is warm because of it | Aethermoor, No. 34 |
| 17 | The Fawnrest Heartstone | Either | More of her own power: on Io, 4% more MP; on Sol, her Heat builds 4% faster | The White Hart of Fawnrest leaves it at Io's feet when the frost cracks off it | Thareia, No. 75 |
| 18 | Lightfingers | Either | Trance fills 10% faster. Fights give 10% more shards | The shipyard: lost in the cove below the slips | Thareia, No. 77 |
| 19 | The Hushweave Cowl | Either | The big blows a foe warns of (Black Noon, Void Sphere, the great creatures' biggest) hit her 10% softer | Frostmere Lake, under the ice (a place still to come) | Aethermoor, No. 52 |
| 20 | The Thornwreath | Either | Her blows and spells land 2% harder | The Bramble Colossus, the first time it falls | Aethermoor, No. 11 (and Thareia, No. 78) |

**Each effect is different,** as Chris asked ("widen what they can do"). Some only matter in fights. A few also change the maps (glints shine brighter, the party walks faster), and one changes the shards fights give. The shared eight are worth a thought about who wears them: the Heartstone gives each hero more of her own power (Io's MP, Sol's Heat), and the Hushweave Cowl is best on whoever a foe's big blow falls on.

**"Where it might be" is only a suggestion.** Chris places each one on the Item Places page. Eleven of them point at places that aren't walking maps yet: the named places of the D&D map and the great creatures' lairs (art request 13). Until those places exist, each of these can wait as "Not placed", go on a map that exists now, or become "A reward instead".

## Where the names come from

Every name, look and line is one of Chris's own relics. Eighteen come from Aethermoor (`New-game`, `game/src/data/relics.js` on `claude/cool-ptolemy-uc93gg`, Hearth & Heirloom's codex). Two come from Thareia (`thareia/game/src/data/relics.js` on `claude/tender-babbage-4wiplk`). Their looks come from `thareia/game/src/art/item-looks.js` on the same branch.

They are brought into this story. Here it's Noctara's cold that troubles the world, never the Rot, and nothing in them is drowned. Their places point at this game's own people (Nettie, Old Wenna, Marta, Old Gil) and at the D&D map's named places. One person is new, Hodge, the ferryman at Rotbridge, and the great creatures are art request 13's. None of it is canon until Chris says so.

## Placing them: the Item Places page

`../item-places/` is a version of the Walking Paths page (`../../envoi-game-pass-3/map-paths/`), with the same thirteen walking maps and the same rules for where Io can walk. It is published at https://claude.ai/artifact/M3PokTZsXbbxbx2BSDSrC5 and is made for a laptop, like Walking Paths.

1. **Pick a keepsake** in the list on the right. Its card shows who can wear it, what it does, its line, and where it might be.
2. **Pick a map,** press **Put it on this map**, then click the painting where it lies. Drag a glint to move it, and Delete takes the picked one off.
3. **The glint's colour** shows who can wear it: pink for Io, amber for Sol, gold for either. The two hidden ones have a ★ by their names.
4. **A red ring** means Io can't get near enough to pick it up there. The page checks every placement with the game's own walking rules. Move it onto ground she can reach, or draw her a way there on the Walking Paths page.
5. **Walk it** walks Io there with the game's own walking. Each keepsake glints faintly, as the hidden ones do in the game. Stand by one and press the action button to see it.
6. **A reward instead** is for a keepsake that a person or a fight gives rather than one lying on a map. The note says who.
7. **Send my item places** sends all twenty to Claude through the page's database (collection `places`, one document per keepsake). **Copy my item places** is the fallback: paste them in the chat.

The page keeps Chris's places in his browser as he goes, so he can come back to it.

For Claude: read them with the `ArtifactData` tool, `list` on collection `places` of that artifact. Each document holds `{item, name, wear, map, x, y, reward, note, sent}`, with `x` and `y` in the map's 1536 × 1024 painting.

To rebuild the page: `node tools/build.mjs envoi-final-draft/item-places/item-places.html`, then publish `dist/item-places.artifact.html` to the same link with the `db` capability.

## Putting them in the game, once Chris has placed them

1. **The rules:** `ITEMS` in `src/battle/rules.js`, taken from `items.js`, with each effect worked into the battle engine. The two keepsakes are cut to a quarter at the same moment, so the total stays at 45 points.
2. **The numbers:** the balance simulator settles each one.
3. **Finding them:** each lies as a glint where Chris put it, like the two today, or comes from the person or fight he named. Finding one shows its picture, its name and line, and who can wear it.
4. **The Items page:** a new tab in the menu, with Io's and Sol's keepsakes side by side, each with its picture. Tap one to see it, put it on, take it off, or hand a shared one to the other hero.
5. **The save** keeps what was found and who wears what. A save that already has the two keepsakes keeps them.
6. **The pictures:** art request 14 (`../../docs/art-requests/14-keepsake-items.md`). Until they come, each keepsake shows a small drawn stand-in.
7. **A demo page on Chris's phone first,** as always, then the game.

## Questions for Chris

`../../docs/questions/open.md`, 30 to 32: whether these are the right twenty, with the two hidden ones renamed; whether the effects are the right kind; and the new people and places in their lines.
