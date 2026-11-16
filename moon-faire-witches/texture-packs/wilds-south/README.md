# Southern wilds: texture packs

These are the texture packs for four of the eight night wild places in *Envoi on the Longest Night*: the Warm Roads moor, and
the forests on the way to Dawnroost and at Eldergrove's edge. Each place's folder has `inventory.md` (everything a 3D build
needs), `refs/` (reference crops), `stand-in/` (rough 512 x 512 textures cut from the painting, to use until the real ones
are made) and `prompts.json` (the ChatGPT prompts).

| place | painting | inventory rows | stand-ins | prompts | props |
|---|---|---|---|---|---|
| `warm-roads-camp`: the Warm Roads camp, where the airship lands | `walk-warm-roads-camp.png` | 41 | 4 | 11 | 13 |
| `ember-line-road`: the road along the Ember Line | `walk-ember-line-road.png` | 30 | 6 | 12 | 7 (5 new) |
| `dawnroost-road`: the forest road to Dawnroost | `walk-dawnroost-forest-road.png` | 33 | 6 | 14 | 9 (7 new) |
| `eldergrove-edge`: Eldergrove's edge | `walk-eldergrove-edge.png` | 31 | 4 | 14 | 8 (6 new) |
| **all four** | | 135 | 20 | 51 | 37 rows, 31 of them new |

Every texture, prompt and plant is made only once, in the place where it shows best. The other places list it in their
inventory, with where it shows in their painting, and say where it was made. (A few prop rows, such as the boulders and the
birches, are listed again the same way.)

## Shared ids

Used from the brief's list:

- made here: `shared_grass_meadow` (in warm-roads-camp), `shared_dirt_track` (in eldergrove-edge), `shared_forest_floor` and
  `shared_bark_oak` (in dawnroost-road), `shared_drystone` and `shared_water_river` (in ember-line-road).
- listed only, and left for a group whose painting shows them better: `shared_stone_wall_rough` (the round hut's wall at the
  camp; a town shows it better) and `shared_water_dark` (the still pool on the Dawnroost road; the bog paintings show it
  better). If no other group makes them, these two still need making.

New shared ids (added because these surfaces are sure to repeat across the game):

- `shared_warm_road`: the old Warm Road's flagstones with amber light in the seams. It is in the camp and on the Ember Line
  road, and it is the floor of the Warm Road fight. Made in warm-roads-camp, where the stones show biggest.
- `shared_bark_birch`: birch bark. Birches grow in three of these four places, and probably in the north as well. Made in
  warm-roads-camp.

Ids starting `wilds_` are this group's own. They are used in more than one of these four places, and the prompts mark them
`"shared": true`: the heather moor ground, boulder stone, birch, oak and fir leaves, the mossy fallen log, the standing stone,
the lantern post, and the plants (heather, gorse, white flowers, grass tuft, reeds, floating leaves, fern, young fir, violet
undergrowth, shelf mushrooms). The north group may want to use some of them, frosted.

## Things I was unsure of

- **Pine bark (`shared_bark_pine`) was not made.** The firs in these paintings are drawn as cones of boughs with no trunk
  showing, so there was no pine bark to cut from. The fir needles are made (`wilds_fir_boughs`), but the bark still needs a
  painting that shows a pine trunk, maybe a northern one.
- **Rock.** I made the boulders' mossy granite as `wilds_boulder_stone` and did not use `shared_rock_cliff`, because there
  are no cliffs here, only rounded boulders. If the cliff texture ends up looking the same, the two can be merged.
- **Stand-ins of thin things are rough.** The birch trunks are only about 8 pixels wide in the painting, so the birch stand-in
  is just white and dark bands, with a blue tint from the moonlight. The wall face, bridge stone, tent canvas and log bark
  come from small patches too, and are blurry. The real textures will come from the prompts.
- **The node stones' eyes.** They are painted as pale, glassy, moonstone-like discs with no glow. I described them that way
  and listed them as a faint silver gleam, not a warm light. If they should glow amber like the road's seams, change the
  `ember_node_stone` prompt.
- **The skies are from fight paintings.** The walking maps are seen from above, so they show no sky. For the Warm Roads, the
  sky crop comes from the Warm Road fight painting (`reference/art/backdrops/battle-warm-road.png`). For Eldergrove it comes
  from an older battle background that the game doesn't use
  (`reference/art/battle-backgrounds/02-woodland-eldergrove-first-age-clearing.png`). Its style is smoother and more
  realistic, so treat it only as a hint at what lies beyond.
- **Eldergrove's frost.** The roots, bare trees and shrubs at Eldergrove have a light blue-white frost in the painting, so
  its prompts mention frost. The other three places have none.
- **The lookout at the camp** is paved with flat rounded stones like the Dawnroost road's, so its row points to
  `dawnroost_mossy_road` and it gets no texture of its own.

## How it was made

`tools/places.py` holds every row: what it is, where it is in the painting, which patch the stand-in is cut from, and its
prompt. `tools/build.py` makes all four folders from it (`python3 -I tools/build.py`). `tools/texlib.py` wraps the shared
`seamless.py`. For long, thin subjects (a birch trunk, the face of a low wall, a log lying at a slant) it first repeats the
patch, stretches it or turns it, and then makes it seamless. `tools/view.py` makes enlarged crops for looking closely.
