# Wilderness at Night

The demo page for Chris's eight wilderness scenes (art request 12, painted at night, October 5, 2026): Io walks them the way the game does. It is steps 5 and 6 of the workshop's `wilds` job (`../workshop/wilds.md`). **In the game since October 5** (`plan-into-the-game.md`, at Chris's go-ahead with his four calls left to the defaults: `../../docs/design-decisions.md`, "October 5, 2026: the wilderness scenes in the game"): the scenes are traced in `../../src/game/maps.js`, the camps are the Magpie's landings, and the world map is only flown.

**The page:** https://claude.ai/artifact/2WSu7uWvtDUmF5JwxV5xwC (published privately, October 5). It is `wilds.html` here, built into `dist/wilds.html` and `dist/wilds.artifact.html`, the copy that is published; republish that file to the same link after any change to the scenes or the page.

## What it does

- **Choose a band.** The first card offers the three bands, each named for its region: the Warm Roads (band 2), the northern wilds (band 3) and the northeast peaks (band 4). Io starts at the band's camp, where the Magpie lands.
- **Walking.** Tap where Io should go, hold a finger on the painting to steer her, or use the arrows (on screen, or the keyboard's). She walks on the game's own field, at the game's own settings: the same size, pace and camera, with the painted Io and the paper dolls.
- **The road.** Where the road leaves a scene, she goes on to the next one, with the game's fade. At the end of the band's road, a card names the place she has reached: Dawnroost, the northern crossroads or the frozen pass. Its painting is behind the card, with Io standing where she would arrive. In the game she walks on into it. The card also counts the fights that would have started on the way. **Back to the camp** starts the band again, and **Choose a band** goes back to the first card.
- **Fights.** Where a random fight would start, Io stops and a note says so ("A band 2 fight would start here"), with the count for this walk. No fight is played. They come as often as in the game, about every 770 map pixels walked and never closer than 440. The camps have none.
- **The camps.** By the fire, the gold button says **Rest**. Its note says that in the game Io and Sol rest there and the game is saved. The empty landing ground glows faintly, and its note says the Magpie sets down there.
- **The Ember Line road's three nodes** glow faintly too. The gold button by one lights it ("Sol relights it here"), and it stays lit for that walk. The corner keeps count, and so does the card at Dawnroost.
- **The corner label** names the scene and its band, with the fights so far, and has **Choose a band** under it. Esc or M does the same.
- **The night stays dark** whatever the phone's own light or dark setting.

It works on a phone held sideways or upright, and on a laptop.

## Building and testing

```
node tools/build.mjs envoi-final-draft/wilds/wilds.html
```

This makes `dist/wilds.html` (about 6.4 MB, 6,681,096 bytes on October 5, with every picture inside it) and `dist/wilds.artifact.html` (the same page, the copy to publish).

```
node envoi-final-draft/wilds/page-test.mjs [dist/wilds.html] [--out <dir>] [--size 915x412]
```

The test opens the built page in a browser with no screen and plays it the way a person would, by tapping. For each band it starts at the camp, uses the rest and the landing ground, walks the whole road to its end card through every scene (lighting the Ember Line road's three nodes on the way), checks the card's place and fight count, and goes back to the camp. It saves a screenshot of every scene, note and end card in `--out` (`tools/.cache/wilds-test-<size>` if not given). It fails on any error in the page, on a picture missing from the page, on a step that goes wrong, on a card bigger than the screen, and on a label or note over the d-pad, the mini-map, the gold button or Io. The default size is Chris's Pixel 7a held sideways (915 × 412). Run it at a laptop's size too (`--size 1366x768`). It must end with `page test passed`.

## Files

| File | What it is |
|---|---|
| `wilds.html`, `wilds.css`, `wilds.js` | The page. It loads the game's own pieces as the map editor does: `game.css`, the pixel and painted Io, the paper dolls, `sprites.js`, `maps.js` (with the eight scenes) and `field.js`. Where `wilds.js` copies from the map editor and the game, its first lines say so |
| `plan-into-the-game.md` | The checked plan that put the scenes into the game (October 5), as it was written before that |
| `page-test.mjs` | The test above |
| `README.md` | This file |

## What the page needs from the scenes

The page reads only what every traced scene has, so the tracing can change without the page changing. The eight scenes are in the game's maps, `src/game/maps.js`, under these ids:

- band 2: `warm-roads-camp`, `ember-line-road`, `dawnroost-road`, then the exit to `dawnroost`;
- band 3: `northern-camp`, `eldergrove-edge`, `cold-moor`, then the exit to `crossroads`;
- band 4: `frozen-camp`, `frostmere-shore`, then the exit to `frozen-pass`.

Each camp needs its `start`, a `rest` spot and `land` (the middle of the landing ground). Each scene needs an exit to the next one in its row. The five walks need `wild` for their fights, and the Ember Line road needs its three `node` spots. Rebuild the page whenever `maps.js` changes (Chris's path edits from the map editor too), then run the test at both sizes.

## The eight scenes (October 5)

Traced by the ultracode hub as a workflow: each scene by one agent in a file of its own, then checked against the painting, region by region, by a second agent that tried to find everything wrong with it, then fixed by a third; joined (staged in `src/game/maps-wilds.js` until Chris's okay) with every exit pointed at its neighbour's arrival point. Moved unchanged into `src/game/maps.js` on October 5, and `maps-wilds.js` went (`plan-into-the-game.md` here, and `../../handoff/tasks.md`, T02).

| Map id | Scene | Band | Picture (AVIF) | Walk areas | Blocks | Fronts | Exits to | Spots |
|---|---|---|---|---|---|---|---|---|
| `warm-roads-camp` | The Warm Roads camp | 2 | 163 KB | 7 | 9 | 25 | ember-line-road | rest; land 318, 425 |
| `ember-line-road` | The Ember Line road | 2 | 131 KB | 7 | 3 | 14 | warm-roads-camp, dawnroost-road | node1, node2, node3; fights (band 2, warm-road) |
| `dawnroost-road` | The forest road to Dawnroost | 2 | 132 KB | 7 | 5 | 7 | ember-line-road, dawnroost | fights (band 2, warm-road) |
| `northern-camp` | The northern camp | 3 | 134 KB | 8 | 8 | 18 | eldergrove-edge | rest; land 336, 455 |
| `eldergrove-edge` | Eldergrove's edge | 3 | 146 KB | 9 | 7 | 10 | northern-camp, cold-moor | fights (band 3, northern-crossroads) |
| `cold-moor` | The cold moor | 3 | 166 KB | 4 | 0 | 3 | eldergrove-edge, crossroads | fights (band 3, northern-crossroads) |
| `frozen-camp` | The frozen camp | 4 | 117 KB | 4 | 18 | 32 | frostmere-shore | rest; land 306, 442 |
| `frostmere-shore` | Frostmere's shore | 4 | 148 KB | 5 | 0 | 16 | frozen-camp, frozen-pass | fights (band 4, frozen-road) |

**Checked:** `node tools/check-maps.mjs` prints ✓ for all twenty-one maps (the thirteen old ones, the eight scenes, and every arrival between them); the page test passed at 915 × 412 (band 2 to Dawnroost in 22 taps and 3 fights, band 3 to the crossroads in 15 taps and 3 fights, band 4 to the frozen pass in 12 taps and 1 fight) and at 1366 × 768, with no errors. Again once the scenes were in the game (October 5, rebuilt from `maps.js`, where the next fight's threshold now carries from scene to scene as in the game): passed at 915 × 412 (band 2 in 23 taps and 3 fights, band 3 in 17 taps and 3 fights, band 4 in 11 taps and 1 fight) and at 1366 × 768 (band 2 in 26 taps and 4 fights, band 3 in 19 taps and 4 fights, band 4 in 13 taps and 1 fight), with no errors.

**Arrivals from the towns** (each scene's port by its edge; in the game since October 5, the towns' old ways onto the world map): from Dawnroost's south road into `dawnroost-road` at its top, `[762, 52]`; from the crossroads' west road into `cold-moor` at its right, `[1486, 564]`; from the frozen pass's south end into `frostmere-shore` at its top, `[786, 52]`. Between the scenes: the Warm Roads camp's right `[1484, 456]`, the Ember Line road's left `[50, 592]` and top `[995, 56]`, the forest road's bottom `[1000, 970]`; the northern camp's right `[1478, 512]`, Eldergrove's edge's left `[50, 470]` and right `[1484, 594]`, the cold moor's left `[50, 564]`; the frozen camp's right `[1478, 562]`, Frostmere's shore's left `[50, 622]`.

**Where the side paths end** (places for things to find later, ideas I02 and I13):

- the Warm Roads camp: the lookout rock at the top edge (1022, 62); past the slab bridge, where the south path runs off the bottom edge (842, 1012); the way-shelter's door (766, 326);
- the Ember Line road: inside the ring of standing stones, node 1 (282, 248); the trodden ground on the small rise, node 3 (1318, 138);
- the forest road: the flat stones at the pool's north-west edge (180, 290) and on its south shore (330, 530); the woodcutter's yard under the lean-to (1320, 370), by the chopping block (1255, 410); the lit iron lantern on its post (950, 640) and the sun-carved milestone (1076, 600) beside the road;
- the northern camp: the lit hollow under the mossy boulder (1210, 168), and the trail on from it into the forest (990, 72); the plank bridge over the half-frozen stream (818, 790), and past it, off the bottom edge (770, 1012); a short trail north of the landing ground (362, 140);
- Eldergrove's edge: the hollow in the great tree (556, 220); inside the ring of standing stones (1170, 270), and the trail round behind it (1290, 114); under the ruined arch (450, 620), and the old path south off the bottom edge (550, 1010);
- the cold moor: the ruined shepherd's hut (490, 222); the cairn on the low rise (858, 676); the frozen tarn's shore (1080, 446); the south path off the bottom edge (760, 1012);
- the frozen camp: the foot of the frozen waterfall (1265, 200); the lookout's flat rocks at the bottom edge (800, 900); a snowy clearing under the trees in the north-west (160, 70);
- Frostmere's shore: the sheltered hollow among the rocks (288, 170); the jetty's end, out on the ice (1400, 580); the boathouse door's deck (985, 505).
