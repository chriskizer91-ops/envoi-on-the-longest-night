# dawnroost: texture pack

Dawnroost's yard: gate 10, the three wraiths drawn to the living node. A wide yard of packed earth and old flagstones with weeds in the gaps, a stone dais at the back where the living node (a great golden crystal) burns, two sun banners on poles, timber longhalls with crossed gable horns, a sharpened log palisade, a tall timber watchtower, pine forest and the snow range. No tree; it is a yard.

Painting: `reference/art/battle-backgrounds/12-thornhollow-dawnroost-living-node.png` (1448 x 1086); in the prompts it is called `dawnroost.png`.
Boxes are x0, y0, x1, y1 in that painting's pixels. Ground stand-ins are cut from the nearest ground with a strong squash (the painting is side-on), unless the row says they come from a walking map. `backdrop/` holds the far-land slices at full width.

| id | kind | what it is, in plain words | where in the painting | shared? |
|---|---|---|---|---|
| `dawnroost_yard` | ground | The yard's floor: big worn flagstones and smaller stones set in packed earth, with grass and weeds in the gaps. The node court is seen from above in walk-dawnroost-node.png (its flagstones: shared_flagstones). [here: stand-in, prompt] | 0, 712, 1448, 1086 | no |
| `shared_flagstones` | ground | The node court's flagstones in the walking map (made by the Dawnroost walking-map pack). | 0, 712, 1448, 1086 | yes (listed only: made elsewhere) |
| `dawnroost_node_crystal` | skin | The living node: a great golden crystal with smaller crystals round its foot, glowing warm from inside, on the dais. [here: prompt] | 770, 530, 930, 690 | no |
| `dawnroost_node_dais` | prop | The node's stone dais: a low wide platform of fitted stone with two or three steps and carved square blocks at its corners. | 600, 640, 1100, 720 | no |
| `dawnroost_sun_banner` | skin | A tall purple banner with a golden sun on it, hanging from a crossbar between two poles; one stands each side of the node. [here: prompt] | 995, 500, 1055, 670 | no |
| `dawnroost_longhall` | skin | A timber longhall with a steep dark roof and crossed carved horns on its gable ends, behind the palisade (this one on the left; the one behind the node is the same). [here: prompt] | 390, 500, 620, 640 | no |
| `shared_roof_shingle` | material | The halls' dark wooden shingle roofs (made by a walking-map pack). | 900, 530, 1040, 600 | yes (listed only: made elsewhere) |
| `shared_planks_wall` | material | The halls' plank walls (made by a walking-map pack). | 800, 560, 880, 620 | yes (listed only: made elsewhere) |
| `dawnroost_palisade` | material | The palisade: a wall of upright logs with sharpened tips, round the yard. The stand-in shows only the logs (no tips). [here: stand-in, prompt] | 230, 580, 1448, 700 | no |
| `dawnroost_watchtower` | skin | A tall timber watchtower with a railed lookout gallery and a steep pointed roof, at the right corner of the palisade. [here: prompt] | 1265, 320, 1400, 600 | no |
| `shared_tree_pine` | plant | The pine forest round the fort (made in frostmere). | 100, 400, 240, 650 | yes (listed only: made elsewhere) |
| `dawnroost_node_glow` | light | The one big warm light: the node, which throws warm amber light over the yard from behind the wraiths and sends sparks drifting (the game pulses it). Everything else is cold moonlight. | 724, 456, 1014, 717 | no |
| `dawnroost_backdrop` | sky | Backdrop slice: sky, moon, snow range, pine forest, the halls, palisade, tower, banners and the node, down to where the yard begins. [here: backdrop] | 0, 0, 1448, 712 | no |
| `shared_sky_night` | sky | The night sky (made in river-glade). | 620, 0, 1448, 230 | yes (listed only: made elsewhere) |
| `shared_moon` | sky | The full moon (made in river-glade). | 375, 100, 525, 255 | yes (listed only: made elsewhere) |
| `shared_peaks_ironspire` | sky | The snow range (made in frostmere). | 0, 220, 1448, 430 | yes (listed only: made elsewhere) |
| `shared_mountain_snow_rock` | material | The snow faces of the range (made in frostmere, but its stand-in is cut from this painting). | 150, 320, 450, 420 | yes (listed only: made elsewhere) |
