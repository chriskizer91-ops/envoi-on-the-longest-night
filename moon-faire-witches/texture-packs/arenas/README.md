# Arenas: texture packs for the fight places

The nine places where fights happen. Eight are side-on fight paintings (a camera at eye height looking across a flat
clearing to the far land and the sky); the ninth, the night square, is Wickhollow's square seen from high above. Each
place's folder has `inventory.md` (everything a 3D build of that fight needs), `prompts.json` (the prompts for Chris),
`refs/` (a crop of the painting for every prompt, prop and backdrop), `stand-in/` (seamless 512 x 512 textures made
now), and `backdrop/` (wide slices of the far land and sky at the painting's full width, to wrap round the place).

| place | painting | rows | stand-ins | prompts | props | backdrops |
|---|---|---|---|---|---|---|
| river-glade | battle-backgrounds/01-woodland-wickhollow-river-glade.png | 14 | 2 | 7 | 1 | 1 |
| eldergrove | battle-backgrounds/02-woodland-eldergrove-first-age-clearing.png | 15 | 2 | 5 | 1 | 1 |
| bogmire | battle-backgrounds/03-gloomfen-bogmire-lantern-banks.png | 15 | 1 | 5 | 2 | 1 |
| frostmere | battle-backgrounds/05-ironspire-frostmere-lakeside-meadow.png | 14 | 3 | 5 | 0 | 2 |
| warm-roads-moor | battle-backgrounds/11-verdant-wilds-warm-roads-moor.png | 18 | 1 | 6 | 2 | 1 |
| dawnroost | battle-backgrounds/12-thornhollow-dawnroost-living-node.png | 17 | 2 | 6 | 1 | 1 |
| crossroads | battle-backgrounds/13-northern-crossroads.png | 18 | 3 | 6 | 3 | 1 |
| dead-moonwell | battle-backgrounds/14-ironhold-misthollow-dead-moonwell.png | 15 | 1 | 5 | 2 | 1 |
| night-square | backdrops/night-square.webp | 22 | 0 | 9 | 4 | 1 |
| **all** | | **148** | **15** | **54** | **16** | **10** |

(All paintings are under `reference/art/`. In the prompts each place's whole painting is called `<place>.png`.)

## How the fight places are covered

- **Ground**: each fight place has its own ground texture (stand-in and prompt), cut from the nearest ground of the
  painting with a strong squash (2.5 to 3.2), since side-on ground is very slanted. Each ground row says where the same
  kind of ground is seen better, from above, in a walking map. The crossroads' paving stand-in is cut from
  `walk-northern-crossroads.png`, where the road shows from above.
- **Far land**: one `backdrop/<place>_backdrop.jpg` per place (sky down to where the clearing starts), plus
  `shared_peaks_ironspire` (the snow range alone, from Frostmere). The far pieces worth modelling or placing as cut-outs
  (the river glade's chapel village, Bogmire's stilt hall, the moor's watchtower, Dawnroost's halls and tower,
  Misthollow's towers and bridges, Frostmere's pine islands) each have a skin prompt. Backdrop slices have no prompt:
  they are Chris's paintings already.
- **Light**: each place has a `light` row saying where warm light comes from. The dead Moonwell has none at all.

## Shared ids

Made here (stand-in and/or prompt), because the fight paintings show them best:

- `shared_sky_night` (river-glade; stand-in cut from Eldergrove's painting): the starless plum-indigo sky with thin wisps.
- `shared_moon` (river-glade): the full moon, the same in every fight painting.
- `shared_tree_oak` (river-glade): an old oak, whole.
- `shared_tree_pine` (frostmere): a dark pine, whole, no snow.
- `shared_peaks_ironspire` (frostmere): the great snow range, as a backdrop slice (no prompt).
- `shared_mountain_snow_rock` (frostmere; stand-in cut from Dawnroost's painting): snowy rock faces for far mountains.
- `shared_rock_cliff` (crossroads): a grey rock cliff face, seen side-on.

Only listed (made by other groups): `shared_grass_frosted`, `shared_lake_ice`, `shared_pine_snowy`,
`shared_rock_cliff_snowy`, `shared_snow`, `shared_flagstones`, `shared_water_dark`, `shared_water_river`,
`shared_boardwalk_planks`, `shared_planks_wall`, `shared_roof_shingle`, `shared_roof_tiles_red`,
`shared_awning_stripes`, `shared_stone_wall_rough`, `shared_drystone`, `shared_bark_oak`, `shared_bark_pine`,
`shared_bark_birch`, `shared_forest_floor`, `shared_cobbles_town`, `shared_warm_road`.

## Things I was unsure of

- **Frostmere's lake**: the game calls it frozen (a storm there is a blizzard), but the painting shows open, still
  water. Its own texture (`frostmere_lake_water`) is open water; if the lake is built frozen, use `shared_lake_ice`.
- **Bogmire's bank**: in the game the painting's grassy bank is covered by live black water with a deck on stilts. The
  bank grass is still given, for the banks round the water.
- **The dead Moonwell's braziers**: the scene file for the older dead Moonwell picture mentions two braziers at the near
  corners; this painting has none, and no warm light anywhere.
- **The night square** is the same place as the Wickhollow walking map, in a different (pixel-art) painting. Its
  cobbles, roofs, walls and awning come from the Wickhollow pack, so it has no stand-ins of its own; its prompts are for
  the things the fight's 3D build needs (well, lamps, stall, forge, chapel, a house, railings, plants). The Wickhollow
  pack may have the same buildings from the walking map: pick one look for both.
- **Soft stand-ins**: some surfaces are small and far in the paintings, so their stand-ins are blurry (the ancient
  bark, the lake, the rock cliff, the mountain rock). The prompts matter more there.
- The drystone wall on the moor is too small to cut a texture from; it is listed as `shared_drystone`.

## Remaking

`tools/data.py` holds every row (boxes, prompts); `python3 -I tools/build.py` remakes all packs from it.
