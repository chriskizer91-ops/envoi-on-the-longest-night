# The 3D map's art: what each file is

## The land's data

Both files are made by `../tools/make-terrain.mjs` from Chris's day atlas of Aethermoor
(`reference/art/world-map/day/Aethermoor-Nine-Region-Atlas.webp`, 4608 x 3072, north up). They are data, not pictures to
show: any game that wants Aethermoor as a 3D land can build it from these two. One pixel = 4 atlas pixels = 40 m.

| File | Size | What it holds |
|---|---|---|
| `aethermoor-terrain-height.png` | 1152 x 768 | How high each spot stands. Height in atlas pixels (1 atlas px = 10 m) = (red x 256 + green) / 10 - 100. Sea level is 0; the sea floor goes down to about -30; the highest peak is about 284 (2,840 m), north-east of Misthollow. |
| `aethermoor-terrain-kinds.png` | 1152 x 768 | What kind of ground each spot is, as the red value: 0 sea, 1 river, 2 lake, 3 pine forest, 4 leafy forest, 5 grass, 6 farmland, 7 fen, 8 beach sand, 9 desert, 10 red mesa rock, 11 grey rock, 12 snow. |

To read a spot at atlas (x, y): the pixel at (floor(x / 4), floor(y / 4)).

## The ground textures

`aethermoor-ground-layers.webp` (2048 x 3584) is twenty-seven of Chris's made textures in one picture, each a 512 x 512
square that repeats, left to right, top to bottom. Packed by `../tools/make-ground-layers.mjs` from
`moon-faire-witches/texture-packs/made/<name>.png` (on the branch `work/textures-made` when this was packed, November 16;
all 27 are Chris's own, none a stand-in). Four of them he made for this map on November 17, to be seen from high up
(the prompts are in `../art-requests/world-map-round-1.md`); his files are kept as he sent them in
`world-map-round-1/` (1254 x 1254 each), under the names below, for the hub to add to `texture-packs/made/` too. The names are the cards' file names, so each can be found again in
`texture-packs/made/index.csv`.

| # | Texture (file name in `made/`) | Worn by |
|---|---|---|
| 0 | `pine_forest` | pine forest (zones 1 and 2, and outside the zones) |
| 1 | `broadleaf_forest` | leafy forest (zones 1 and 2) |
| 2 | `grassland` | grass (zone 1) |
| 3 | `farmland` | farmland |
| 4 | `willow_marsh` | the fen |
| 5 | `beach_sand` | beaches and shores |
| 6 | `desert_ground` | the desert floor |
| 7 | `sandstone_mesa` | the mesas, and their cliff faces |
| 8 | `aethermoor_mountain_rock` (it was `bare_rock`) | the mountains' rock, and their steep faces |
| 9 | `coastal_cliff` | every steep face outside the desert |
| 10 | `snowfield` | snow |
| 11 | `aethermoor_mountain_scree_snow` (it was `snowy_mountainside`) | the mountains between bare rock and full snow |
| 12 | `river_water` | (packed, not worn: its painted waves read as running water) |
| 13 | `aethermoor_sea_shallows` (it was `shallow_sea`) | the sea by the shores |
| 14 | `aethermoor_sea_from_high` (it was `deep_sea`) | the open sea |
| 15 | `mountain_lake` | rivers and lakes (a little of it, laid large, over one even colour) |
| 16 | `dawn_grass_flowers` | zone 2's grass |
| 17 | `moor_heather_frost` | zone 3's grass |
| 18 | `frostmere_frost_meadow` | zone 4's grass |
| 19 | `fir_foliage_frosted` | zone 3's pine forest |
| 20 | `fir_foliage_snowladen` | zone 4's pine forest |
| 21 | `moor_bracken_heather` | zone 3's leafy forest |
| 22 | `frosted_undergrowth` | zone 4's leafy forest |
| 23 | `crossroads_frost_moor` | zone 4's farmland |
| 24 | `shared_lake_ice` | zone 4's rivers and lakes, frozen |
| 25 | `shared_grass_meadow` | drifts of meadow in zone 1's open grass |
| 26 | `riverglade_clover_grass` | drifts of clover in zone 1's open grass |

## The buildings' textures

`aethermoor-building-layers.webp` (1024 x 1024) is thirteen of Chris's made wall and roof textures, each a 256 x 256
square that repeats, four to a row. Packed by `../tools/make-buildings.mjs` (all 13 his own, none a stand-in), which
also writes `../map/buildings.js`: the 86 buildings of the nine walking places that have any, read from the 3D world's
places (`moon-faire-witches/world3d/places/`).

| # | Texture (file name in `made/`) | Worn by |
|---|---|---|
| 0 | `shared_stone_wall_rough` | stone ground floors (Wickhollow, the cottage, Dawnroost), chimneys, towers |
| 1 | `wick_wall_timber_plaster` | timber-framed upper storeys |
| 2 | `shared_roof_tiles_red` | Wickhollow's and Dawnroost's roofs |
| 3 | `shared_roof_thatch` | thatched roofs in the towns no walking place covers |
| 4 | `shared_planks_wall` | Bogmire's plank houses, the hut at Frostmere's shore |
| 5 | `shared_roof_shingle` | Bogmire's roofs |
| 6 | `shared_wall_castle` | Hearthstone Keep's walls and towers |
| 7 | `misthollow_roof_blue_slate` | Misthollow's roofs, the castle's roofs |
| 8 | `shared_stone_wall_frosted` | Misthollow's, the Moonwell's and the shipyard's walls |
| 9 | `shared_roof_slate_snow` | the Moonwell's and the shipyard's roofs |
| 10 | `shared_boardwalk_planks` | plank sheds and lean-tos |
| 11 | `cottage_roof_moss` | Io's cottage |
| 12 | `shared_snow` | the snowed-over roof at Frostmere's shore |

## The tree models

`trees/` holds eight of Chris's tree models, taken from his **Field & Forest · Forest Builder** page (the file he
uploaded on November 16; its own names kept). Each tree is three files: `<id>.glb`, his detailed model; `<id>_far.glb`,
his light one for far off; and `<id>_mid.glb`, a middle one **made from his detailed model** by
`../tools/make-tree-mids.mjs` (November 17, at his asking): about a quarter of the triangles, by keeping the trunk and
biggest boughs and about one leaf or clump in five, each kept one made bigger so the crown stays full. They are plain glTF models with a colour at every corner (two parts, bark
and foliage), no pictures, in metres, standing on y = 0. `../tools/make-tree-models.mjs` packs them into
`../map/tree-models.js` for the page.

| File | Tree | Tall | Triangles (detailed / middle / light) | On the map |
|---|---|---|---|---|
| `tree_spruce` | Spruce | 15.9 m | 4,303 / 1,077 / 106 | pine forest; all the firs of zones 3 and 4 |
| `tree_ponderosa` | Ponderosa Pine | 17.4 m | 6,906 / 1,768 / 76 | pine forest on rock and hills, and mixed among the spruce |
| `tree_oak` | Bur Oak | 10.4 m | 5,442 / 1,400 / 844 | leafy forest |
| `tree_cottonwood` | Cottonwood | 12.2 m | 6,269 / 1,563 / 492 | leafy forest, and by rivers and lakes |
| `tree_aspen` | Quaking Aspen | 13.8 m | 4,574 / 1,195 / 340 | leafy forest; most of zone 3's and 4's leafy trees |
| `tree_willow` | Weeping Willow | 9.5 m | 7,511 / 2,033 / 112 | the fen, and by rivers and lakes |
| `tree_mesquite` | Mesquite | 5.1 m | 5,194 / 1,326 / 590 | the desert and the mesas |
| `tree_snag` | Dead Snag | 7.3 m | 1,723 / 759 / 144 | the fen, the desert, the cold zones |

The dead snag's middle model keeps nearly half its triangles (it is all boughs; at a quarter it was a bare pole).
`../tools/tree-lineup.html` shows all eight at their three levels side by side.

The Forest Builder also has grass, bushes and props (not brought in).

## Each place's atmosphere

`../map/moods.js` isn't art but goes with it: every walking place's leaf tints, fog and moonlight, read from the 3D
world's places (`moon-faire-witches/world3d/places/`) by `../tools/make-moods.mjs`.
