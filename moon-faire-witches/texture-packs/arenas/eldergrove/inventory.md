# eldergrove: texture pack

Eldergrove's clearing: band 3's wild fights in the first-age wood. A flat clearing of grass, clover and moss, then a wall of enormous ancient trees whose hollows glow with ember light, mossy ruined stone arches on the left, pines in the mist, and the snow range and moon above. The live 3D ground is the wood's grass, ferns, clover and moss; a great old oak frames the right side.

Painting: `reference/art/battle-backgrounds/02-woodland-eldergrove-first-age-clearing.png` (1448 x 1086); in the prompts it is called `eldergrove.png`.
Boxes are x0, y0, x1, y1 in that painting's pixels. Ground stand-ins are cut from the nearest ground with a strong squash (the painting is side-on), unless the row says they come from a walking map. `backdrop/` holds the far-land slices at full width.

| id | kind | what it is, in plain words | where in the painting | shared? |
|---|---|---|---|---|
| `eldergrove_wood_grass` | ground | The clearing's floor: dark grass, clover, moss and a few tiny white flowers. Seen from above in wilds/walk-eldergrove-edge.png (its clearings and path edges). [here: stand-in, prompt] | 0, 735, 1448, 1086 | no |
| `shared_forest_floor` | ground | Leaf litter and moss under the great trees, round the clearing's edge (made by the wilds-south pack). | 0, 690, 1448, 740 | yes (listed only: made elsewhere) |
| `eldergrove_clover_tuft` | plant | Clover with small white flower heads and tall grass blades, at the clearing's edges. [here: prompt] | 200, 990, 360, 1086 | no |
| `eldergrove_ancient_tree` | plant | One of the enormous first-age trees: a vast twisted trunk with root arches and hollows glowing with ember light, and a huge dark crown. Several stand round the clearing (left, middle and right). [here: prompt] | 1060, 300, 1448, 705 | no |
| `eldergrove_ancient_bark` | material | The ancient trees' bark: twisted grey-violet bark like fused roots. The trees are far off, so the stand-in (cut from the middle giant's trunk at 840, 560, 900, 640) is soft; the prompt matters more. [here: stand-in, prompt] | 1220, 500, 1300, 640 | no |
| `shared_bark_oak` | material | Ordinary oak bark on the smaller trees and on the live oak (made by a walking-map pack). | 400, 560, 470, 680 | yes (listed only: made elsewhere) |
| `shared_tree_oak` | plant | The ordinary old oaks between the giants (made in river-glade). | 300, 410, 620, 700 | yes (listed only: made elsewhere) |
| `shared_tree_pine` | plant | Dark pines in the mist in front of the great trees (made in frostmere). | 540, 540, 620, 700 | yes (listed only: made elsewhere) |
| `eldergrove_ruin_arch` | skin | Ruined stone arches from the first age, tall pointed window arches overgrown with moss and ivy, half hidden in the wood on the left. [here: prompt] | 85, 495, 300, 680 | no |
| `eldergrove_ruin_wall` | prop | The same ruins as a 3D object: two or three broken arch walls, standing apart, with mossy rubble at their feet. | 85, 495, 300, 680 | no |
| `eldergrove_hollow_embers` | light | Small warm ember lights in the hollows and root arches of the ancient trees (the game pulses them). All other light is moonlight from the upper left. | 200, 360, 1448, 700 | no |
| `eldergrove_backdrop` | sky | Backdrop slice: sky, moon, snow range, the giant trees, ruins and pines in the mist, down to where the clearing begins. [here: backdrop] | 0, 0, 1448, 735 | no |
| `shared_sky_night` | sky | The night sky (made in river-glade). | 620, 0, 1448, 230 | yes (listed only: made elsewhere) |
| `shared_moon` | sky | The full moon (made in river-glade). | 375, 100, 525, 255 | yes (listed only: made elsewhere) |
| `shared_peaks_ironspire` | sky | The snow range, partly hidden behind the trees (made in frostmere). | 100, 225, 1000, 390 | yes (listed only: made elsewhere) |
