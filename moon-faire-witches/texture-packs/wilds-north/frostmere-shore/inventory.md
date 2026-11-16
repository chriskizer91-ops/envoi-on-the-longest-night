# Frostmere's shore: what a 3D build needs

The west shore of Frostmere, a great frozen lake, at night under cold blue moonlight. The right half of the picture is the
lake: dark blue-black ice cracked with long white lines, with drifts of crusted snow lying on it in rings and patches. On
the shore stands a small timber boathouse with a snow-heavy roof, a row of snowy barrels beside it, and a plank jetty
running out onto the ice in two sections on snow-capped posts, with a cold blue-white lantern hanging from a post where
it turns. A snow-dusted cobbled road comes in from the west, forks below a rocky knoll, and runs north between pines off
the top edge, with a side path up to a sheltered hollow among the rocks. Everything else is snow-laden spruces, bare
white birches, big snow-capped rocks and clumps of pale dry reeds frozen into the ice along the shore. No warm light here.

| id | kind | what it is, in plain words | where in the painting (x0, y0, x1, y1) | shared? |
|---|---|---|---|---|
| `road_cobbles_snow` | ground | The road: pale rounded cobbles under a dusting of snow, snow lying in the gaps, verges of deeper snow | 0, 0, 860, 660 | no |
| `shared_snow` | ground | Deep smooth snow on the verges, the shore and the tops of the rocks | 560, 800, 730, 920 | yes, made by group north |
| `shared_lake_ice` | ground | Frozen lake ice: dark blue-black clear ice with long white crack lines and a scatter of frost specks (also the frozen tarn on the cold moor) | 1100, 100, 1536, 1024 | yes, made here |
| `lake_ice_snowcrust` | ground | Snow-crusted ice: the drifts of crusted snow lying on the lake and frozen along the shore, rough and pale, with dark ice showing through in holes | 1240, 180, 1536, 360 | no |
| `jetty_planks_snow` | material | The jetty's deck: grey weathered planks with snow lying along them | 930, 465, 1460, 660 | no |
| `shared_planks_wall` | material | The boathouse's walls: dark weathered vertical boards | 845, 430, 1003, 518 | yes, made by another group (wooden house wall) |
| `cliff_rock_frozen` | material | The dark rock of the big snow-capped rocks, under their snow | 1000, 0, 1090, 90 | no; reused, made in frozen-camp (this group) |
| `fir_foliage_snowladen` | material | The snow-heavy branches of the spruces | 100, 650, 500, 1024 | no; reused, made in frozen-camp (this group) |
| `boathouse_roof_snow` | roof | The boathouse roof from above: a pitched roof under thick snow, icicles at the eaves | 838, 349, 990, 462 | no |
| `boathouse_door_end` | skin | The boathouse's end wall, facing the jetty: a gable of dark vertical boards with a plank door, snow on the roof edge | 934, 349, 1005, 518 | no |
| `boathouse_long_wall` | skin | The boathouse's long wall: dark boards, a small shuttered window, the snowy eaves above | 840, 420, 950, 518 | no |
| `lantern_cold_post` | skin | The cold lantern: an iron lantern with a blue-white light hanging from a wooden post's arm, snow on top | 1168, 425, 1228, 515 | no |
| `reeds_dry_pale` | plant | A clump of pale dry reeds frozen into the ice along the shore | 1030, 545, 1100, 625 | no |
| `birch_sapling_bare` | plant | A young bare birch, thin white stems and fine twigs, frosted | 910, 0, 1005, 110 | no |
| `boathouse` | prop | The boathouse: a small timber hut on a stone footing with a pitched snowy roof, its door end facing the jetty (skins `boathouse_door_end`, `boathouse_long_wall`, roof `boathouse_roof_snow`) | 835, 345, 1005, 520 | no |
| `barrels_row` | prop | A row of barrels with snowy lids along the front of the boathouse | 850, 478, 985, 555 | no |
| `jetty` | prop | The jetty: a plank deck on round posts with snow caps, running out from the boathouse in one section, turning at a post, and running on in a second (deck `jetty_planks_snow`) | 930, 465, 1460, 660 | no |
| `lantern_cold` | prop | The cold lantern on its post at the jetty's turn (skin `lantern_cold_post`) | 1168, 425, 1228, 515 | no |
| `post_in_ice` | prop | A lone old mooring post standing in the ice off the shore, snow on its top | 685, 745, 720, 835 | no |
| `rocks_snowcapped` | prop | Big rounded dark rocks with thick snow caps, along the road and the shore, some standing in the ice | 560, 790, 740, 930 | no |
| `shore_rocks_small` | prop | Small snow-capped rocks in a heap at the water's edge below the boathouse | 790, 520, 990, 625 | no |
| `rocky_knoll` | prop | The rocky knoll between the road north and the way to the boathouse, with a pine on it | 600, 450, 780, 600 | no |
| `tree_spruce_snowy` | prop | Tree: the snow-laden spruce, in thick stands west of the road (young ones to big trees; branches `fir_foliage_snowladen`) | 420, 230, 540, 360 | no |
| `tree_birch_bare` | prop | Tree: bare white birch, several trunks from one root, leafless (also along the shore and among the spruces) | 65, 250, 195, 455 | no |
| `light_cold_lantern` | light | The cold lantern: a small blue-white light, the only lamp here. No warm light anywhere in this place | 1196, 440, 1226, 480 | no |
| `sky_frozen_north` | sky | Not in the walking painting. The frozen north's sky from the frozen road's fight painting: moon behind thin cloud, snowy mountains | 80, 0, 760, 150 in the fight painting `battle-frozen-road.png` | no; reused, made in frozen-camp (this group) |
