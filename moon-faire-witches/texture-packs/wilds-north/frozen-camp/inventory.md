# The frozen camp: what a 3D build needs

A camp on a snowy shelf in the frozen lands, where the airship lands, at night: everything deep in snow under cold
violet-blue moonlight, with a pool of warm firelight in the middle. On the left, a big square landing ground of smooth
snow fenced by four snow-capped wooden stakes and a low rope. Beside it a loaded sled and barrels, a big tent and a small
tent with snow-heavy roofs, a stone fire ring with a fire, log stumps, a barrel, a stack of firewood and a lantern hanging
from a post. A trodden snow trail runs east and branches north to the foot of a tall frozen waterfall of blue ice; a snow
lane winds north-west between pines; a path runs south to a lookout on flat snow-capped rock tops. The shelf drops on
every side to dark cliffs of columned rock hung with icicles. Snow-laden spruces everywhere, with bare frost-white bushes
and a few bushes with red berries.

| id | kind | what it is, in plain words | where in the painting (x0, y0, x1, y1) | shared? |
|---|---|---|---|---|
| `shared_snow` | ground | Smooth snow: the landing ground and the untrodden snow all over the shelf, the lane and the rock tops | 110, 320, 500, 570 | yes, made by group north |
| `snow_trodden_trail` | ground | Trodden snow: the trails and the camp floor, snow packed and pitted with many footprints | 1140, 180, 1290, 520 | no |
| `cliff_rock_frozen` | material | Cliff rock: dark grey-brown columned rock of the cliffs round the shelf, streaked with ice and hung with small icicles | 1040, 0, 1140, 130 | no |
| `frozen_waterfall_ice` | material | Waterfall ice: the frozen fall's columns of blue-white ice | 1150, 0, 1420, 180 | no |
| `fir_foliage_snowladen` | material | Spruce branches heavy with snow: dark blue-green needles under thick white snow | 0, 0, 170, 250 | no |
| `tent_canvas` | material | The tents' canvas (here warm-lit and half under snow) | 674, 179, 868, 366 | no; reused, made in northern-camp (this group) |
| `tent_snow_big_front` | skin | The big tent from the front: a tall ridge tent of brown-grey canvas, its roof under thick snow with icicles on the edge, front flap open | 670, 165, 875, 370 | no |
| `tent_snow_small_front` | skin | The small tent from the front: a low ridge tent under snow, flap open | 905, 300, 1075, 460 | no |
| `tent_roof_snow` | roof | The big tent's roof seen from above: two sloping canvas sides under thick snow | 674, 165, 868, 300 | no |
| `sled_side` | skin | The loaded sled from the side: wooden runners curling up at the front, crates and bundles tied on, snow on top | 550, 270, 715, 405 | no |
| `frozen_waterfall` | skin | The frozen waterfall seen straight on: a cliff with long columns and curtains of blue ice hanging down it, piled ice at its foot | 1130, 0, 1430, 180 | no |
| `icicle_fringe` | plant | A fringe of icicles hanging from a snow-capped ledge | 1135, 15, 1255, 100 | no |
| `bush_bare_frosted` | plant | A bare bush of white frost-covered branches | 1065, 70, 1175, 190 | no |
| `bush_berry_snow` | plant | A low dark bush with clusters of red berries, snow on top | 1140, 525, 1240, 612 | no |
| `spruce_young_snowy` | plant | A young spruce under snow (this one below the landing ground; many more, down to the little fir at the lane's bend, 240-300, 175-255) | 440, 610, 550, 770 | no |
| `landing_stakes_rope_snow` | prop | The landing ground's fence: four thick wooden stakes with snow caps and rope bindings, and a low rope between them | 85, 265, 545, 600 | no |
| `tent_big_snow` | prop | The big ridge tent, snow on its roof (skins `tent_snow_big_front`, `tent_roof_snow`) | 670, 165, 875, 370 | no |
| `tent_small_snow` | prop | The small ridge tent, snow on its roof (skin `tent_snow_small_front`) | 905, 300, 1075, 460 | no |
| `sled` | prop | The loaded cargo sled (skin `sled_side`) | 550, 270, 715, 405 | no |
| `barrels_sled` | prop | Two barrels with snow on their lids, stacked by the sled | 632, 220, 685, 330 | no |
| `barrel_fire` | prop | A barrel with a snowy lid, by the fire | 838, 338, 885, 395 | no |
| `fire_ring_snow` | prop | The stone fire ring with its fire, the snow melted round it to earth | 750, 380, 860, 465 | no |
| `stumps_snow` | prop | Five log stumps with snow on their tops, round the fire | 700, 365, 910, 495 | no |
| `firewood_stack` | prop | A stack of split logs with snow on it, and loose logs in front | 860, 430, 965, 530 | no |
| `lantern_post_frozen` | prop | A wooden post with an arm, a lit lantern hanging from it (like the northern camp's `lantern_post`) | 878, 272, 945, 372 | no |
| `frozen_waterfall_prop` | prop | The frozen waterfall at the trail's north end (skin `frozen_waterfall`, ice `frozen_waterfall_ice`) | 1130, 0, 1430, 180 | no |
| `frozen_fall_small` | prop | A small frozen fall down the cliff below the landing ground | 215, 870, 285, 970 | no |
| `cliff_columns` | prop | The cliffs round the shelf: tall columns of dark rock with snow caps and icicles, dropping into darkness (rock `cliff_rock_frozen`) | 1240, 620, 1536, 920 | no |
| `lookout_rocks` | prop | The lookout: flat snow-capped rock tops at the south path's end, their faces dropping to lower rocks | 690, 800, 1120, 1000 | no |
| `rocks_snowcapped` | prop | Big rounded rocks under thick snow caps, along the trails and the shelf's edges | 1265, 245, 1395, 345 | no |
| `tree_spruce_snowy` | prop | Tree: the snow-laden spruce, the only big tree here (young ones to 15 m tall; branches `fir_foliage_snowladen`) | 25, 10, 165, 255 | no |
| `light_campfire` | light | The campfire: the warm orange light in the middle of the camp, lighting the snow, the tents' fronts, the stumps and the sled | 785, 385, 830, 435 | no |
| `light_lantern` | light | The lantern on its post: a small warm orange light | 882, 288, 912, 330 | no |
| `light_tent` | light | A faint warm glow in the big tent's open front | 785, 285, 835, 345 | no |
| `sky_frozen_north` | sky | Not in the walking painting. From the fight painting of the frozen road: a pale full moon behind thin cloud over jagged snowy mountains, and dark snowy pine ridges in mist | 80, 0, 760, 150 in the fight painting `battle-frozen-road.png` | no |
