# Art Request 12: The Wilderness Scenes, at Night

**Received October 5, 2026,** all eight, in three packs from Chris's generator (Warm Roads, Northern Wilds, Frostmere), each 1536 × 1024 at night with the camps' landing ground empty, under the file names below in `../../reference/art/walk/wilds/`. The packs' notes (a preview of each band's scenes, which candidate he kept and why, the prompts, and this brief as it was supplied) are kept as they came in `../../reference/art/walk/wilds/packs/`. **Traced October 5** by the ultracode hub: squeezed to his "100% extra light" (117 to 166 KB each, in `../../art/walk/`), traced into walking maps and joined in a row, and on a demo page for him to walk: https://claude.ai/artifact/2WSu7uWvtDUmF5JwxV5xwC (`../../envoi-final-draft/wilds/README.md`). **In the game since October 5** (`d5dce10`, at his go-ahead): traced in `../../src/game/maps.js`, the camps are where the Magpie lands, and the world map is only for flying (`../../handoff/tasks.md`, T02; `../design-decisions.md`, "October 5, 2026: the wilderness scenes in the game").

October 5, 2026. Chris decided on October 3 that the world map is only for flying the Magpie and that walking happens only on painted scenes, like his wilderness path example. On October 5 he approved the plan for those scenes ("The walking plan is good, make the scenes at night"). These are the eight painted wilderness scenes that replace walking on the world map in bands 2, 3 and 4. Band 1 needs none: the Thornwood is its wild walk already.

**Why:** today bands 2 and 3 (and the start of band 4) are walked on the world map. With these, every step Io takes is on a painted scene, with random fights on the way and side paths to explore, and the world map is for flying.

## The eight scenes

Each band starts at a camp where the Magpie lands, and its scenes join up in a row to the band's town or gate. A path that leaves one scene at an edge comes into the next at the opposite edge.

| # | Scene | Band | Its paths | Then | File name |
|---|---|---|---|---|---|
| 1 | The Warm Roads camp | 2 | the old road leaves at the right edge | 2 | `walk-warm-roads-camp.png` |
| 2 | The Ember Line road | 2 | in at the left edge, out at the top | 3 | `walk-ember-line-road.png` |
| 3 | The forest road to Dawnroost | 2 | in at the bottom, out at the top | Dawnroost's south road | `walk-dawnroost-forest-road.png` |
| 4 | The northern camp | 3 | the path leaves at the right edge | 5 | `walk-northern-camp.png` |
| 5 | Eldergrove's edge | 3 | in at the left edge, out at the right | 6 | `walk-eldergrove-edge.png` |
| 6 | The cold moor | 3 | in at the left edge, out at the right | the northern crossroads' west road | `walk-cold-moor.png` |
| 7 | The frozen camp | 4 | the path leaves at the right edge | 8 | `walk-frozen-camp.png` |
| 8 | Frostmere's shore | 4 | in at the left edge, out at the top | the frozen pass | `walk-frostmere-shore.png` |

## How to make them

1. **Start with 2, the Ember Line road.** Keep the best one, then attach it as the style reference to every other prompt, so all eight match.
2. **Attach to every prompt:**
   - your wilderness path example (`reference/art/walk/wilds/wilderness-path-example.webp`), for its view and layout only, not its daylight;
   - the game's Thornwood map (`reference/art/walk/walk-thornwood.png`), for the night look the game's maps share;
   - the band's battle painting, for the region's colours and materials, not its camera: `reference/art/battle-backgrounds/11-verdant-wilds-warm-roads-moor.png` for band 2, `02-woodland-eldergrove-first-age-clearing.png` for band 3, `05-ironspire-frostmere-lakeside-meadow.png` for band 4.
3. **At night,** like every map in the game: the story is one long night.
4. **Landscape 3:2, at least 1536 × 1024.** Generate each two to four times and keep the one whose paths read most clearly.
5. **Leave the camps' landing ground empty.** The game draws the Magpie, Io, Sol and everyone else. (In the game the Magpie is a soft glow on the landing ground for now, as at the docks: Chris's call, October 5. Drawing his own 3D Magpie standing there is the other choice, for later.)
6. Save them in `reference/art/walk/wilds/` under the file names above.

**Where to send them:** to the game's session, or to a new session with the workshop's wilderness script (`../../envoi-final-draft/workshop/README.md`), which does the next part while the game's session works on other things.

**What happens next:** Claude squeezes each to your "100% extra light" (as the wild maps are, about 0.1 MB each), traces where Io can walk, joins the scenes to the places around them, moves the three Ember Line nodes from the world map onto the Ember Line road, and takes the walking off the world map (it stays for flying). A demo page on your phone first, then the game.

## Style lock

Every prompt below starts with this. It is the walking maps' own (art request 04), with the wilderness layout of your example added.

```text
Highly detailed hand-painted fantasy RPG ground-level map in a rich painterly pixel-art style, for a game where a small pixel character walks on top of it. A high overhead view, straight on and not rotated: you see the ground from above and the front faces of rocks, ruins and trees, like a classic 16-bit JRPG map but richly painted. Never isometric, no horizon, no sky. A wilderness scene laid out like the attached example: a clear path crossing the picture through open wild ground, with a side path or two leading off to small places worth exploring. Night: deep violet and indigo shadows, silver-blue moonlight from the upper left with soft short shadows to the lower right, and warm amber light only where a fire or lantern burns. Paths, clearings and bridges are clear and easy to read, at least as wide as two people walking side by side, never hidden under branches or overhanging rocks, and the main path runs right off the picture where it leaves. A person would stand about one fourteenth of the picture's height. No people, animals, creatures, ships, text, lettering, UI, borders, grid lines or vignette. Landscape 3:2, at least 1536 × 1024.
```

## 1. The Warm Roads camp

Band 2, where the Magpie lands. A rest: Io and Sol sleep here and the game is saved. Save as `walk-warm-roads-camp.png`.

```text
Highly detailed hand-painted fantasy RPG ground-level map in a rich painterly pixel-art style, for a game where a small pixel character walks on top of it. A high overhead view, straight on and not rotated: you see the ground from above and the front faces of rocks, ruins and trees, like a classic 16-bit JRPG map but richly painted. Never isometric, no horizon, no sky. A wilderness scene laid out like the attached example: a clear path crossing the picture through open wild ground, with a side path or two leading off to small places worth exploring. Night: deep violet and indigo shadows, silver-blue moonlight from the upper left with soft short shadows to the lower right, and warm amber light only where a fire or lantern burns. Paths, clearings and bridges are clear and easy to read, at least as wide as two people walking side by side, never hidden under branches or overhanging rocks, and the main path runs right off the picture where it leaves. A person would stand about one fourteenth of the picture's height. No people, animals, creatures, ships, text, lettering, UI, borders, grid lines or vignette. Landscape 3:2, at least 1536 × 1024.

A travellers' camp on the heather moorland of the Warm Roads, in the western wilds. On the left, a broad flat landing ground of short trampled grass, empty, marked at its corners by four wooden stakes with rope between them, where a small airship sets down. Beside it, the camp: a ring of stones round a glowing campfire, two canvas lean-to tents, bedrolls, a stack of firewood, a kettle on a hook, and a lantern on a post. Behind the camp, an old way-shelter of the Ember Wardens: a low round stone hut with a turf roof and an open door, a faded sun carved over it. An ancient paved road of broad worn flagstones, with fine amber veins of sunstone glowing faintly in its cracks, passes the camp and leaves at the right edge. Around: rolling heather and gorse, low dry-stone walls, a few silver birches, scattered grey boulders. A short side path climbs to a flat lookout rock at the top edge, and another runs down to a little stream at the bottom.
```

## 2. The Ember Line road (make this one first)

Band 2. The old road along the Ember Line, where Sol relights the dark nodes. Save as `walk-ember-line-road.png`.

```text
Highly detailed hand-painted fantasy RPG ground-level map in a rich painterly pixel-art style, for a game where a small pixel character walks on top of it. A high overhead view, straight on and not rotated: you see the ground from above and the front faces of rocks, ruins and trees, like a classic 16-bit JRPG map but richly painted. Never isometric, no horizon, no sky. A wilderness scene laid out like the attached example: a clear path crossing the picture through open wild ground, with a side path or two leading off to small places worth exploring. Night: deep violet and indigo shadows, silver-blue moonlight from the upper left with soft short shadows to the lower right, and warm amber light only where a fire or lantern burns. Paths, clearings and bridges are clear and easy to read, at least as wide as two people walking side by side, never hidden under branches or overhanging rocks, and the main path runs right off the picture where it leaves. A person would stand about one fourteenth of the picture's height. No people, animals, creatures, ships, text, lettering, UI, borders, grid lines or vignette. Landscape 3:2, at least 1536 × 1024.

The Warm Roads across open moorland: an ancient paved road of broad worn flagstones, with fine amber veins of sunstone glowing faintly in its cracks, comes in at the left edge, bends across the moor and leaves at the top edge. Three Ember Line nodes stand along it: squat old stone waymarkers, each with a crystal set in its top, gone dim and cold. One stands beside the road; the other two stand at the ends of short side paths, one by a ring of standing stones, one on a small rise. A narrow silver stream crosses the moor and the road passes over it on a little humped stone bridge. Around: heather and gorse, low tumbled dry-stone walls, a few silver birches, grey boulders, a dark copse at one side.
```

## 3. The forest road to Dawnroost

Band 2. The road leaves the moor and climbs through old forest to the Wardens' waystation. Save as `walk-dawnroost-forest-road.png`.

```text
Highly detailed hand-painted fantasy RPG ground-level map in a rich painterly pixel-art style, for a game where a small pixel character walks on top of it. A high overhead view, straight on and not rotated: you see the ground from above and the front faces of rocks, ruins and trees, like a classic 16-bit JRPG map but richly painted. Never isometric, no horizon, no sky. A wilderness scene laid out like the attached example: a clear path crossing the picture through open wild ground, with a side path or two leading off to small places worth exploring. Night: deep violet and indigo shadows, silver-blue moonlight from the upper left with soft short shadows to the lower right, and warm amber light only where a fire or lantern burns. Paths, clearings and bridges are clear and easy to read, at least as wide as two people walking side by side, never hidden under branches or overhanging rocks, and the main path runs right off the picture where it leaves. A person would stand about one fourteenth of the picture's height. No people, animals, creatures, ships, text, lettering, UI, borders, grid lines or vignette. Landscape 3:2, at least 1536 × 1024.

The old Warm Road, its flagstones mossy and broken, comes in at the bottom edge and winds up through a dark western forest of huge oaks and beeches to leave at the top edge, toward a walled waystation. Moonlight falls through gaps in the canopy onto the road; the trees never cover it. Beside the road: a mossy stone milestone with a sun carved on it, a great fallen trunk pushed aside long ago, and an iron lantern on a post, still lit. A side path leads to a still forest pool with flat stones round it; another to a woodcutter's empty lean-to with a chopping block. Ferns, roots and fallen leaves on the forest floor.
```

## 4. The northern camp

Band 3, where the Magpie lands, where the cold begins. A rest. Save as `walk-northern-camp.png`.

```text
Highly detailed hand-painted fantasy RPG ground-level map in a rich painterly pixel-art style, for a game where a small pixel character walks on top of it. A high overhead view, straight on and not rotated: you see the ground from above and the front faces of rocks, ruins and trees, like a classic 16-bit JRPG map but richly painted. Never isometric, no horizon, no sky. A wilderness scene laid out like the attached example: a clear path crossing the picture through open wild ground, with a side path or two leading off to small places worth exploring. Night: deep violet and indigo shadows, silver-blue moonlight from the upper left with soft short shadows to the lower right, and warm amber light only where a fire or lantern burns. Paths, clearings and bridges are clear and easy to read, at least as wide as two people walking side by side, never hidden under branches or overhanging rocks, and the main path runs right off the picture where it leaves. A person would stand about one fourteenth of the picture's height. No people, animals, creatures, ships, text, lettering, UI, borders, grid lines or vignette. Landscape 3:2, at least 1536 × 1024.

A camp in a clearing at the edge of the great northern forests, where the cold is setting in: the first frost silvers the grass and lies white in the hollows. On the left, a broad flat landing ground of frosted short grass, empty, marked at its corners by four wooden stakes with rope between them, where a small airship sets down. Beside it: a campfire glowing in a stone ring, two canvas tents with frost on their ridges, bedrolls, firewood, a lantern on a post. Tall dark pines and old firs close round the clearing. A path leaves at the right edge into the forest. A side path leads to a half-frozen stream with a plank bridge, another to a mossy boulder with a hollow under it.
```

## 5. Eldergrove's edge

Band 3. The edge of a first-age forest, older than any town. Save as `walk-eldergrove-edge.png`.

```text
Highly detailed hand-painted fantasy RPG ground-level map in a rich painterly pixel-art style, for a game where a small pixel character walks on top of it. A high overhead view, straight on and not rotated: you see the ground from above and the front faces of rocks, ruins and trees, like a classic 16-bit JRPG map but richly painted. Never isometric, no horizon, no sky. A wilderness scene laid out like the attached example: a clear path crossing the picture through open wild ground, with a side path or two leading off to small places worth exploring. Night: deep violet and indigo shadows, silver-blue moonlight from the upper left with soft short shadows to the lower right, and warm amber light only where a fire or lantern burns. Paths, clearings and bridges are clear and easy to read, at least as wide as two people walking side by side, never hidden under branches or overhanging rocks, and the main path runs right off the picture where it leaves. A person would stand about one fourteenth of the picture's height. No people, animals, creatures, ships, text, lettering, UI, borders, grid lines or vignette. Landscape 3:2, at least 1536 × 1024.

The edge of Eldergrove, an ancient first-age forest: trees of enormous girth with roots like low walls, their bark silvered by moonlight and the first frost. A worn earth path comes in at the left edge, winds between the great trunks and roots, and leaves at the right edge. Old standing stones carved with faded sun and moon signs lean among the trees, and a ruined stone archway stands half swallowed by roots. Pale glowing fungus on fallen logs, frost on the moss, ferns gone brown. A side path leads into a hollow at the foot of the largest tree, another to a small ring of standing stones.
```

## 6. The cold moor

Band 3. Open, wind-bitten upland on the old road to the northern crossroads. Save as `walk-cold-moor.png`.

```text
Highly detailed hand-painted fantasy RPG ground-level map in a rich painterly pixel-art style, for a game where a small pixel character walks on top of it. A high overhead view, straight on and not rotated: you see the ground from above and the front faces of rocks, ruins and trees, like a classic 16-bit JRPG map but richly painted. Never isometric, no horizon, no sky. A wilderness scene laid out like the attached example: a clear path crossing the picture through open wild ground, with a side path or two leading off to small places worth exploring. Night: deep violet and indigo shadows, silver-blue moonlight from the upper left with soft short shadows to the lower right, and warm amber light only where a fire or lantern burns. Paths, clearings and bridges are clear and easy to read, at least as wide as two people walking side by side, never hidden under branches or overhanging rocks, and the main path runs right off the picture where it leaves. A person would stand about one fourteenth of the picture's height. No people, animals, creatures, ships, text, lettering, UI, borders, grid lines or vignette. Landscape 3:2, at least 1536 × 1024.

A bleak upland moor in the cold north: frost-silvered heather and dead bracken, thin snow lying in the hollows, a few wind-bent dark pines, scattered boulders. An old road of broken flagstones, half grown over, comes in at the left edge and runs across the moor to leave at the right edge, with small stone cairns marking its way. To one side, a ruined shepherd's hut and a tumbled stone sheepfold; on the other, a small frozen tarn with reeds stiff with ice. A side path leads to the hut, another to a cairn on a low rise.
```

## 7. The frozen camp

Band 4, where the Magpie lands, below the frozen pass. A rest. Save as `walk-frozen-camp.png`.

```text
Highly detailed hand-painted fantasy RPG ground-level map in a rich painterly pixel-art style, for a game where a small pixel character walks on top of it. A high overhead view, straight on and not rotated: you see the ground from above and the front faces of rocks, ruins and trees, like a classic 16-bit JRPG map but richly painted. Never isometric, no horizon, no sky. A wilderness scene laid out like the attached example: a clear path crossing the picture through open wild ground, with a side path or two leading off to small places worth exploring. Night: deep violet and indigo shadows, silver-blue moonlight from the upper left with soft short shadows to the lower right, and warm amber light only where a fire or lantern burns. Paths, clearings and bridges are clear and easy to read, at least as wide as two people walking side by side, never hidden under branches or overhanging rocks, and the main path runs right off the picture where it leaves. A person would stand about one fourteenth of the picture's height. No people, animals, creatures, ships, text, lettering, UI, borders, grid lines or vignette. Landscape 3:2, at least 1536 × 1024.

A camp on a broad snowy shelf among the northeastern peaks. On the left, a broad flat landing ground of packed snow, empty, marked at its corners by four wooden stakes with rope between them, where a small airship sets down. Beside it: a campfire glowing in a stone ring with the snow melted round it, two canvas tents heavy with snow, a wooden sled loaded with crates, firewood, a lantern on a post. Snow-laden pines, frosted boulders and the dark faces of low cliffs close round the shelf. A trodden path through the snow leaves at the right edge. A side path leads to a frozen waterfall against the cliff, another to a lookout of flat rocks at the bottom edge.
```

## 8. Frostmere's shore

Band 4. The frozen lake, on the way up to the frozen pass. Save as `walk-frostmere-shore.png`.

```text
Highly detailed hand-painted fantasy RPG ground-level map in a rich painterly pixel-art style, for a game where a small pixel character walks on top of it. A high overhead view, straight on and not rotated: you see the ground from above and the front faces of rocks, ruins and trees, like a classic 16-bit JRPG map but richly painted. Never isometric, no horizon, no sky. A wilderness scene laid out like the attached example: a clear path crossing the picture through open wild ground, with a side path or two leading off to small places worth exploring. Night: deep violet and indigo shadows, silver-blue moonlight from the upper left with soft short shadows to the lower right, and warm amber light only where a fire or lantern burns. Paths, clearings and bridges are clear and easy to read, at least as wide as two people walking side by side, never hidden under branches or overhanging rocks, and the main path runs right off the picture where it leaves. A person would stand about one fourteenth of the picture's height. No people, animals, creatures, ships, text, lettering, UI, borders, grid lines or vignette. Landscape 3:2, at least 1536 × 1024.

The shore of Frostmere, a great frozen lake in the mountains: the right part of the picture is the lake, smooth ice dusted with snow, with long pale cracks glowing faintly blue-white and dark patches of clear ice. A snowy road follows the shore, coming in at the left edge and climbing to leave at the top edge, toward a mountain pass. Along the shore: reeds frozen stiff, snow-covered rocks, a few snow-laden pines, an old iced-in fishing jetty and a small boathouse with snow on its roof and a cold lantern. A side path leads out along the jetty onto the ice, another to a sheltered hollow among the rocks.
```
