# Aethermoor from the air: the world map's texture pack

The continent the party flies over in the Magpie. The painting is the game's night atlas (`reference/art/world-map/night/Aethermoor-Natural-Night-Atlas.webp`, 4608 x 3072, north up); every box below is in its pixels. The day atlas (`reference/art/world-map/day/Aethermoor-Nine-Region-Atlas.webp`) has the same size and lines up with it, so each row's refs come in pairs: `refs/<id>.jpg` by night (the game's look) and `refs/<id>-day.jpg` by day (to read what the terrain is). The stand-ins are cut from the night atlas only, from the box in the table; each ref crop is that box with a margin round it.

In 3D this is a land kilometres across, not one place: a height map coloured by these terrain kinds. Each terrain row is one kind, with where on the map it covers. A suggested scale: **1 atlas pixel = 10 m**, so the continent is about 46 km by 31 km (the flight today uses 12 pixels a metre, so the whole map is 384 m: a toy-sized map). The painting draws trees and houses about ten times too big for that scale (a pine crown is 10 to 20 pixels), so the stand-ins show fewer, bigger crowns than the prompts ask for; the prompts give real sizes, so the textures read right from a ship a few hundred metres up.

Not in the painting: moor or heath (the north is forest, meadow and fields), lake ice (Frostmere Lake is painted open; `lake_ice` is made from the open lake's stand-in recoloured, and only its prompt is real), coast surf (the white water round rocks is best done by the builder as foam along the shoreline). No sky is painted: the map is seen from above.

## Terrain and surfaces

| id | kind | what it is, in plain words | where in the painting (x0, y0, x1, y1) | shared? |
|---|---|---|---|---|
| pine_forest | ground | Dense pine and fir forest seen from above: pointed dark crowns packed close. Covers: Most of the land in the west and north: the Gloamwood round Wickhollow, the northwest coast, the northern passage, the foothills of the peaks. | 700, 1000, 860, 1100 | no |
| broadleaf_forest | ground | Woodland of round, leafy trees (oak and beech kind) seen from above, with a few pines among them. Covers: The Verdant Wilds in the west middle (round Dawnroost and the Warm Roads), and patches through the Gloamwood. | 1000, 1470, 1180, 1600 | no |
| willow_marsh | ground | The fen: narrow winding channels of dark water among reed beds, willow clumps and small pines. Covers: The Gloomfen in the south middle, from Bogmire east past the Sunken Ruins to Willowmurk. | 1880, 2270, 2010, 2370 | no |
| grassland | ground | Open meadow and pasture: short grass with a few stones and low bushes. Covers: Clearings and the open ground round towns in the west and north: round Dawnroost, the northern passage, the crossroads. | 1300, 1165, 1380, 1205 | no |
| farmland | ground | A patchwork of small fields in different crops, split by hedgerows. Covers: Round Wickhollow (south of it, about x 950 to 1350, y 1900 to 2080), round Dawnroost and the big town north of the Warm Roads, and the fields of the northern passage. | 1170, 1968, 1300, 2055 | no |
| beach_sand | ground | Pale sand above the waterline, with pebbles and a few tufts of beach grass. Covers: The coves of the west coast, the bays of the north, and the east coast below the desert. | 495, 1735, 550, 1790 | no |
| desert_ground | ground | Dry, open desert ground with small scrub bushes and stones. Covers: The east (the Sunscorch Wastes), about x 3100 to 4300, y 1250 to 2400: under mist all game, but the land is there. | 3440, 1900, 3540, 1960 | no |
| sandstone_mesa | ground | Broken plateau tops of layered red sandstone, with short cliff steps and scree. Covers: The canyon country of the east and southeast: the tops of the plateaus and mesas. | 3470, 1400, 3580, 1480 | no |
| bare_rock | ground | Steep grey mountain rock: angular slabs, cracks and scree, no snow. Covers: The mountain flanks of the east (the Ironspire Peaks below the snow line), the sea stacks and rocky islands. | 3500, 1130, 3560, 1190 | no |
| snowy_mountainside | ground | High mountain slope half under snow: dark rock ribs and boulders with drifts between them. Covers: The northwest snow island (x 0 to 700, y 0 to 250), the northern peaks round Peak's Veil (x 2700 to 3300, y 150 to 650), the northeast peaks (x 3500 to 4300, y 0 to 200) and the tops of the Ironspire Peaks. | 3000, 410, 3100, 490 | no |
| snowfield | ground | Deep snow in the high basins (glacier and snowfield): smooth drifts with a few rocks showing. Covers: The high basins and valleys between the northern peaks (the white fields round x 2850 to 3150, y 300 to 450). | 2950, 342, 2998, 382 | no |
| town_roofs | ground | A town's rooftops from straight above: crowded red-tile and slate roofs with narrow lanes between. Covers: Every town: Wickhollow, Dawnroost, the shipyard, Misthollow, Bogmire (wooden roofs there), Hearthstone Keep. | 1020, 1215, 1100, 1275 | no |
| deep_sea | material | Open ocean: dark navy water with long swells and small silver ripples. Covers: The ring of open ocean round the continent and the inland sea in the middle (round Hearthstone Keep). | 2250, 1620, 2450, 1780 | no |
| shallow_sea | material | Shallow water near the coast, dark blue-green with submerged stones showing through. Covers: The band of shallows 50 to 150 m wide (5 to 15 atlas px) round every coast and island, between the beach or cliff and the deep sea. | 1180, 2585, 1260, 2625 | no |
| river_water | material | A river's surface: dark blue water with streaks of current and small silver ripples. Covers: The rivers of the west (round Wickhollow and the Thornwood), the north and the eastern mountains, and the fen channels. | 1395, 1798, 1450, 1828 | no |
| mountain_lake | material | Still, deep mountain lake water: very dark blue, faint silver ripples. Covers: Frostmere Lake (about x 3240 to 3340, y 740 to 830) and the small pools of the eastern mountains. | 3262, 775, 3300, 805 | no |
| lake_ice | material | A frozen lake: pale silver-blue ice with swirls of snow and long cracks. (Not painted on the map: Frostmere Lake is painted open.) Covers: Frostmere Lake, if the 3D north shows it frozen; any lake in the north. | 3262, 775, 3300, 805 | no |
| coastal_cliff | material | The face of a tall grey sea cliff: vertical sheets and columns of rock with cracks and mossy ledges. Covers: The west coast, the south coast below the fen, round the sea stacks; also any steep slope in the height map. | 450, 1145, 560, 1195 | no |
| pine_tree | plant | One tall pine or fir like the map's pines: dark green tiers of branches. | 220, 1410, 310, 1510 | no |
| broadleaf_tree | plant | One round leafy tree like the map's oaks. | 610, 1590, 710, 1700 | no |
| willow_tree | plant | One weeping willow from the fen, its fronds hanging down. | 1925, 2335, 2020, 2410 | no |
| dead_tree | plant | One bare dead tree from the fen: grey twisting branches, no leaves. | 2020, 2300, 2085, 2390 | no |
| town_windows | light | Warm amber window lights in the houses of the towns (only some windows lit, small and rectangular). | 1270, 1790, 1420, 1890 | no |
| harbour_lanterns | light | Small lantern lights at the docks and gates of Hearthstone Keep and the harbour towns; nothing else on the map gives light. | 2280, 1260, 2480, 1440 | no |
| night_sky | sky | None painted (the map is seen from straight above). The flight today uses its own drifting clouds and a dark violet fog (#0b0820); a 3D far backdrop needs a moonlit night sky from elsewhere, moon high in the upper left. | none | no |

## Props: the towns and landmarks, and where each is on the map

Each is a 3D model to build (no prompt here); its refs are `refs/<id>.jpg` and `refs/<id>-day.jpg`. "Band" is the part of the map the ship can reach (`src/game/world.js`): band 1 the southwest and the fen, 2 the western forests, 3 the northwest and the northern passage, 4 the northeast peaks; "under mist" is never reachable but is still land under the mist. Positions are the D&D map's (`reference/demos/the-magpie-over-aethermoor.html`) and the game's landings (`src/game/game.js`).

| id | kind | what it is, in plain words | where in the painting (x0, y0, x1, y1) | shared? |
|---|---|---|---|---|
| wickhollow | prop | Wickhollow (stop 1): Io's village on a river mouth, a church tower and red-roofed houses. The ship docks at 1446, 1806. Band 1. Centre 1348, 1838. | 1238, 1756, 1458, 1920 | no |
| bogmire | prop | Bogmire (stop 2): the stilt town of the fen, wooden houses on posts and plank walks, a tall wooden tower. The ship docks at 1886, 2462. Band 1. Centre 1752, 2512. | 1642, 2430, 1862, 2594 | no |
| dawnroost | prop | Dawnroost (stop 3; Thornhollow on the D&D map): a walled stone town with red roofs on a meadow. The ship docks at 1365, 1085. Band 2. Centre 1325, 1098. | 1225, 1023, 1425, 1173 | no |
| shipyard | prop | The shipyard (no name on the D&D map): a stone harbour castle on the north coast at the end of the long arched bridge. The ship docks at 2097, 580. Band 3. Centre 2097, 599. | 1987, 517, 2207, 681 | no |
| misthollow | prop | Misthollow (stop 4; Ironhold on the D&D map): a grey stone mountain town among the peaks, above Frostmere Lake. Band 4. Centre 3500, 735. | 3380, 645, 3620, 825 | no |
| camp_warm_roads | prop | The Warm Roads camp: the Magpie's landing ground in the woods (no building painted there). Band 2. Lands at 820, 1530. | 730, 1462, 910, 1598 | no |
| camp_northern_wilds | prop | The northern wilds camp: the Magpie's landing ground in the forest (no building painted there). Band 3. Lands at 1150, 590. | 1060, 522, 1240, 658 | no |
| camp_northeast_peaks | prop | The northeast peaks camp: the Magpie's landing ground on the coast below the peaks (no building painted there). Band 4. Lands at 2760, 1090. | 2670, 1022, 2850, 1158 | no |
| northern_crossroads | prop | The northern crossroads: a walking scene; on the map, a cliff-top meadow above the strait. Band 3. At 1960, 820. | 1870, 752, 2050, 888 | no |
| frozen_pass | prop | The frozen pass: a walking scene; on the map, a mountain slope. Band 4. At 3270, 980. | 3180, 912, 3360, 1048 | no |
| thornwood | prop | The Thornwood: a walking scene between Wickhollow and Bogmire; on the map, woods with a path and a house. Band 1. At 1530, 2160. | 1430, 2085, 1630, 2235 | no |
| rotbridge | prop | Rotbridge: the arched stone and plank crossing in the fen, with a gatehouse. Band 1. At 2050, 2424. | 1950, 2349, 2150, 2499 | no |
| willowmurk | prop | Willowmurk: a small stilt village deep in the fen, joined by boardwalks. Under mist all game (just east of band 1's edge, by world.js). At 2898, 2588. | 2798, 2513, 2998, 2663 | no |
| sunken_ruins | prop | The Sunken Ruins (Misthollow Ruins on the D&D map): pale flooded stone arches and walls in the fen. Band 1. At 2560, 2508. | 2460, 2433, 2660, 2583 | no |
| mosswatch_tower | prop | Mosswatch Tower: a lone red-brown stone tower on a wooded headland. Band 1. At 1138, 2318. | 1058, 2258, 1218, 2378 | no |
| eldergrove | prop | Eldergrove: a small village among big trees. Band 3. At 990, 728. | 900, 660, 1080, 796 | no |
| fawnrest_shrine | prop | Fawnrest Shrine: a grey stone shrine with towers in a clearing. Band 2. At 1525, 905. | 1445, 845, 1605, 965 | no |
| frostmere_lake | prop | Frostmere Lake: a small mountain lake below Misthollow, with a river and falls running out of it (painted open, not frozen). Band 4. Lake about 3240 to 3340, 740 to 830; the D&D label is at 3392, 806. | 3230, 725, 3430, 875 | no |
| peaks_veil | prop | Peak's Veil: a monastery tower on a ridge by the northern peaks. Band 4. At 2914, 212. | 2824, 144, 3004, 280 | no |
| stormwatch | prop | Stormwatch: a walled outpost town on the northeast coast below the peaks. Band 4. At 3790, 538. | 3700, 470, 3880, 606 | no |
| hearthstone_keep | prop | Hearthstone Keep: the capital, a towered castle on its own island in the inland sea, with docks. Under mist all game. At 2340, 1240. | 2140, 1090, 2540, 1390 | no |
| dusthaven | prop | Dusthaven: a domed stone building in a dry canyon. Under mist all game. At 3525, 1588. | 3435, 1520, 3615, 1656 | no |
| sandspire | prop | Sandspire: a desert town with two tall slender towers. Under mist all game. At 4050, 1822. | 3950, 1747, 4150, 1897 | no |
| miragewell | prop | Miragewell: a village round a spring with tall trees and palms. Under mist all game. At 3560, 2108. | 3470, 2040, 3650, 2176 | no |
| scorchgate_ruins | prop | The Scorchgate Ruins: broken stone ruins in the desert. Under mist all game. At 3300, 2262. | 3210, 2194, 3390, 2330 | no |
| stone_bridge | prop | The long arched stone bridge over the northern strait, to the shipyard. Band 3. About 1850 to 2020, 545 to 600. | 1840, 493, 2060, 657 | no |
| waterfall | prop | A waterfall: white water falling down a cliff (there are many: below Frostmere, the north coast, south of Wickhollow). Band 4. This one at 3380, 1050. | 3310, 998, 3450, 1102 | no |
| sea_stack | prop | A sea stack: a tall rock island with moss and surf at its foot (dozens round every coast). Band 1. This one at 200, 2500. | 100, 2425, 300, 2575 | no |
| boardwalk | prop | The fen boardwalks: plank walks on posts over the water, joining Bogmire, Rotbridge and Willowmurk. Band 1 (the eastern end, at Willowmurk, is under mist). This stretch at 2300, 2430. | 2200, 2355, 2400, 2505 | no |
| harbour_docks | prop | Harbour docks: wooden piers on posts (Hearthstone Keep's docks shown; smaller ones at the towns). Under mist. At 2400, 1420. | 2300, 1345, 2500, 1495 | no |
| road_track | prop | Roads and paths: thin pale earth tracks joining the towns (a ribbon laid on the land, not a texture square). Everywhere. This one at 3650, 1500. | 3530, 1410, 3770, 1590 | no |
