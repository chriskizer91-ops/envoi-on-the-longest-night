# The cold moor: what a 3D build needs

Open moorland in the north, at night under cold blue moonlight, with no lamps or fires at all. An old road of big broken
flagstones crosses the picture from west to east, with trodden earth verges. A frozen-earth side path climbs north to a
ruined shepherd's hut (roofless walls of squared stone, fallen timbers inside) and the low curved wall of its sheepfold;
another runs south over a rocky rise topped by a cairn. In the north-east lies a small frozen tarn, its black ice cracked
white and frosted at the edges, with reeds and stones standing in it. The rest is moor: purple heather and rust-brown
dead bracken under frost, frost-speckled low shrubs, grey mossy boulders, bare white birches and a few low gnarled dark
trees. Three cairns of stacked stones mark the way.

| id | kind | what it is, in plain words | where in the painting (x0, y0, x1, y1) | shared? |
|---|---|---|---|---|
| `moor_road_flags` | ground | The old moor road: big worn grey flagstones, some broken or missing, with trodden earth and frost between them | 0, 425, 1536, 625 | no |
| `frozen_earth_path` | ground | Frozen earth: the brown trodden paths to the hut and south over the rise, and the hut's floor, hard with frost and full of grit and little stones | 280, 160, 480, 470 | no |
| `moor_heather_frost` | ground | Moor heather under frost: low purple heather, dark shrubs speckled with frost and a little rust bracken: the moor's main ground cover | 1000, 620, 1250, 760 | no |
| `moor_bracken_heather` | ground | Dead bracken and heather: patches where rust-brown dead bracken fronds take over from the heather | 380, 900, 560, 1010 | no |
| `shared_lake_ice` | ground | Black ice of the frozen tarn, cracked with white lines | 1000, 100, 1480, 400 | yes, made in frostmere-shore (this group) |
| `lake_ice_snowcrust` | ground | Frosted ice round the tarn's edges: white, crusted, rough | 990, 290, 1500, 410 | no; reused, made in frostmere-shore (this group) |
| `boulder_mossy_frost` | material | Rock of the grey mossy boulders, the rise and the tarn's stones | 1090, 360, 1210, 450 | no; reused, made in northern-camp (this group) |
| `shared_stone_wall_rough` | material | The hut's walls: squared grey stone blocks, roughly laid, mossy | 355, 60, 640, 265 | yes, made by another group (rough stone house wall) |
| `shared_drystone` | material | The sheepfold's low curved wall, and the cairns: stones stacked without mortar | 490, 150, 800, 345 | yes, made by another group (field wall) |
| `hut_ruin_front` | skin | The ruined shepherd's hut seen flat from the front: broken stone walls with a doorway and a window gap, no roof | 355, 60, 640, 265 | no |
| `cairn_stones` | skin | A cairn: a waist-high stack of rounded stones, narrowing to the top | 150, 390, 220, 490 | no |
| `heather_tuft` | plant | A clump of purple heather | 1050, 640, 1130, 700 | no |
| `bracken_dead` | plant | A clump of dead rust-brown bracken | 255, 300, 345, 365 | no |
| `grass_tussock_pale` | plant | A tussock of pale dry moor grass | 135, 235, 195, 300 | no |
| `twig_shrub_bare` | plant | A small bare shrub of pale frosted twigs | 245, 350, 300, 425 | no |
| `reeds_tarn` | plant | A clump of dark reeds standing up through the tarn's ice | 1095, 225, 1175, 320 | no |
| `hut_ruin` | prop | The ruined shepherd's hut: four broken walls of squared stone with a doorway and window gaps, no roof (walls `shared_stone_wall_rough`, front `hut_ruin_front`) | 355, 55, 645, 270 | no |
| `sheepfold_wall` | prop | The sheepfold: a low curved dry-stone wall joined to the hut, with a capstone at its open end (`shared_drystone`) | 490, 145, 800, 345 | no |
| `hut_timbers` | prop | Two fallen roof beams lying inside the hut and the fold, and stone rubble along the walls' feet | 520, 170, 620, 285 | no |
| `cairn_west` | prop | The cairn on the road's north verge, west end (skin `cairn_stones`) | 150, 390, 220, 490 | no |
| `cairn_rise` | prop | The cairn on top of the low rocky rise, at the south path's end | 860, 620, 980, 760 | no |
| `cairn_tarn` | prop | The cairn by the road below the tarn | 1215, 445, 1290, 520 | no |
| `rocky_rise` | prop | The low rocky rise: a heap of big rounded mossy, frosted boulders under the cairn | 720, 680, 1010, 1010 | no |
| `boulders_mossy` | prop | Mossy, frosted boulders scattered over the moor and round the tarn (rock `boulder_mossy_frost`) | 600, 350, 720, 430 | no |
| `tarn_stones` | prop | Round stones standing out of the tarn's ice | 1040, 300, 1120, 370 | no |
| `tree_birch_bare` | prop | Tree: bare white birch, thin, leafless (several: also 20-120, 650-830 and 1400-1530, 20-140) | 1240, 740, 1360, 900 | no |
| `tree_moor_thorn` | prop | Tree: a low gnarled dark tree with a twisted trunk and a dark crown speckled with frost, like an old hawthorn (several, small and big) | 1340, 640, 1536, 1010 | no |
| `sky_north_moor` | sky | Not in the walking painting. The northern wilds' sky from their fight painting: moon, clouds, mountains, dark pine ridges | 300, 0, 1150, 230 in the fight painting `battle-northern-crossroads.png` | no; reused, made in northern-camp (this group) |
