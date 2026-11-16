# Texture packs: the northern wilds (group `wilds-north`)

Four of the game's night wilderness places, each with its own folder:

| place | what it is | inventory rows | stand-ins | prompts | props |
|---|---|---|---|---|---|
| `northern-camp` | the camp in a frosted pine wood where the airship lands | 43 | 8 | 17 | 18 |
| `cold-moor` | open frosted moor with a ruined hut, cairns and a frozen tarn | 28 | 4 | 11 | 11 |
| `frozen-camp` | the snowbound camp on a cliff shelf, by a frozen waterfall | 35 | 4 | 13 | 16 |
| `frostmere-shore` | the frozen lake's shore, with a boathouse and a jetty | 26 | 4 | 10 | 10 |

In each folder:

- `inventory.md`: everything a 3D builder needs, one row each, with where it is in the painting.
- `refs/`: a reference picture cut from the painting for every prompt and every prop.
- `stand-in/`: a 512 x 512 repeating texture for every ground and wall-type surface made in that place, cut from the
  painting, to use until the real ones are made.
- `prompts.json`: the ChatGPT prompts for Chris.

The stand-ins and refs are rebuilt with `python3 -I -B tools/build.py` (the lists are in `tools/places.py`).

## Shared textures

Made here (stand-in and prompt):

- `shared_dirt_track`: packed earth road with pebbles, from the northern camp's north path. Another group may make
  it too (the warm roads have lots of earth road): keep whichever reads best.
- `shared_lake_ice` (new): the black, white-cracked ice of a frozen lake, from Frostmere. The cold moor's frozen tarn
  uses it too, and it fits the Frostmere fight painting.

Only listed here (made by others):

- from group `north`: `shared_snow` (frozen camp, Frostmere), `shared_grass_frosted` (the northern camp's landing
  ground, which is a big clean patch if group north wants a second source).
- from other groups: `shared_water_dark` (the northern camp's stream), `shared_bark_pine` (the fir trunks, which are
  almost all hidden under branches here), `shared_stone_wall_rough` (the moor hut's walls), `shared_drystone` (the
  sheepfold and the cairns), `shared_planks_wall` (the boathouse's walls).

Reused inside this group (made once, only listed in the other places): `boulder_mossy_frost`, `tent_canvas` and the
sky `sky_north_moor` (made in the northern camp); `cliff_rock_frozen`, `fir_foliage_snowladen` and the sky
`sky_frozen_north` (made in the frozen camp); `lake_ice_snowcrust` (made at Frostmere).

## Things I was unsure of

- **Skies.** The walking paintings are seen from above and show no sky, so the two sky rows come from the fight
  paintings: `battle-northern-crossroads.png` for the northern camp and the moor, `battle-frozen-road.png` for the
  frozen camp and Frostmere.
- **Snowy cobbles.** Frostmere's road (`road_cobbles_snow`) is snow-dusted cobbles. Group `north`'s town or pass may
  have the same surface; compare before making both.
- **The cold lantern** at Frostmere's jetty looks dark in the painting. The game calls it the cold lantern, so its
  prompt asks for a blue-white glow.
- **The boathouse door.** The end wall facing the jetty has no clear door in the painting; the prompt adds a plank door,
  because the game has her stand at that end on the deck.
- **The moor's dark trees** (`tree_moor_thorn`) look like old hawthorns or stunted pines. I called them gnarled thorn
  trees.
- **The stream at the northern camp** is dark open water with icy edges. I listed it as `shared_water_dark` and made a
  separate strip for its icy edge (`stream_ice_edge`).
- **Rough stand-ins.** Three things are very small in the paintings, so their stand-ins are blurry: `log_bark_mossy`
  (the fallen log), `jetty_planks_snow` and `tent_canvas`. The prompts will give the real ones.
- The frozen camp's tents are the same canvas as the northern camp's (it only looks browner in the firelight), so they
  share `tent_canvas`.
