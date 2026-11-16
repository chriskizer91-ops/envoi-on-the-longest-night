# night-square: texture pack

The night square: the first fight, in Wickhollow's square, seen from high above (a steep camera, not side-on). Worn cobbles round a stone well with a lantern arch, iron lamp posts, a striped market stall, the forge with its fire, half-timbered houses with plum-red tile roofs and lit windows, the chapel with its bell tower and graveyard, a stone bridge over the river, twisted dark trees with green wisps, and the moon over a far castle. It is the same square as the Wickhollow walking map (walk-wickhollow-square.png), so the town's shared textures (cobbles, roofs, walls) are made by the Wickhollow pack; this pack covers what the fight's 3D build needs from this painting.

Painting: `reference/art/backdrops/night-square.webp` (1448 x 1086); in the prompts it is called `night-square.png`.
Boxes are x0, y0, x1, y1 in that painting's pixels. Ground stand-ins are cut from the nearest ground with a strong squash (the painting is side-on), unless the row says they come from a walking map. `backdrop/` holds the far-land slices at full width.

| id | kind | what it is, in plain words | where in the painting | shared? |
|---|---|---|---|---|
| `shared_cobbles_town` | ground | The square's worn cobbles, with rings of cobbles round the well (made by the Wickhollow walking-map pack from walk-wickhollow-square.png). | 380, 560, 1100, 1086 | yes (listed only: made elsewhere) |
| `shared_roof_tiles_red` | roof | The houses', forge's and chapel's plum-red tile roofs (made by the Wickhollow walking-map pack). | 0, 230, 540, 420 | yes (listed only: made elsewhere) |
| `shared_awning_stripes` | material | The stall's plum-and-gold striped awning cloth (made by the Wickhollow walking-map pack). | 110, 640, 300, 720 | yes (listed only: made elsewhere) |
| `shared_stone_wall_rough` | material | The low stone garden walls, gate posts and the chapel's stonework (made by the Wickhollow walking-map pack). | 1100, 700, 1200, 830 | yes (listed only: made elsewhere) |
| `shared_planks_wall` | material | Plank and timber parts of the forge and stall (made by a walking-map pack). | 880, 160, 960, 230 | yes (listed only: made elsewhere) |
| `shared_water_river` | material | The river on the right, dark with violet glints (made by a walking-map pack). | 1000, 220, 1448, 560 | yes (listed only: made elsewhere) |
| `nightsq_well` | skin | The square's well: a round stone well on a stepped round base, an iron arch over it with a hanging lantern and a bucket chain, ringed by short iron posts with chains. [here: prompt] | 585, 555, 830, 775 | no |
| `nightsq_well_prop` | prop | The well as a 3D object: base steps, round wall, iron arch, lantern, chain, and the ring of posts and chains (the fight already traces its shape). | 585, 555, 830, 775 | no |
| `nightsq_lamp_post` | skin | The square's iron lamp posts: a black post with a curly bracket and a hanging lantern (five of them). [here: prompt] | 300, 565, 380, 760 | no |
| `nightsq_lamp_prop` | prop | The lamp post as a 3D object; five stand in the square (left, right, front, by the road and by the bridge). | 300, 565, 380, 760 | no |
| `nightsq_stall` | skin | The market stall: a wooden counter and crates under a striped plum-and-gold awning with a scalloped edge. [here: prompt] | 60, 610, 305, 800 | no |
| `nightsq_forge_front` | skin | The forge: a timber-framed smithy with a crossed-hammers sign, an open front with the fire glowing in its hearth, an anvil and a ladder. [here: prompt] | 295, 380, 640, 600 | no |
| `nightsq_chapel_front` | skin | The chapel: grey stone with a bell tower and cross, a round rose window, an arched wooden door with lanterns each side, and steps down to the square. [here: prompt] | 700, 0, 960, 420 | no |
| `nightsq_house_front` | skin | A half-timbered house: dark timber frame, pale plaster, lit windows with flower boxes, an arched door, a round corner turret, plum-red tile roof. [here: prompt] | 1180, 600, 1448, 900 | no |
| `nightsq_iron_railing` | skin | Black iron railings with spear tips between stone posts, round the graveyard and along the garden walls. [here: prompt] | 440, 250, 700, 370 | no |
| `nightsq_graveyard` | prop | The graveyard beside the chapel: stone crosses, rounded headstones, a few candles and a weeping angel statue on a plinth. | 480, 170, 700, 340 | no |
| `nightsq_bridge` | prop | The cobbled stone bridge over the river, with stone end posts, wooden rails and lamp posts, leading off to the road on the right. | 980, 330, 1448, 520 | no |
| `nightsq_magenta_flowers` | plant | Bushes of magenta flowers in the beds by the walls and houses. [here: prompt] | 540, 880, 700, 1000 | no |
| `nightsq_gnarled_tree` | plant | Twisted dark old trees beyond the river (the Thornwood's edge), with small green wisps of light floating among them. [here: prompt] | 1000, 0, 1448, 220 | no |
| `shared_tree_pine` | plant | Dark pines behind the houses (made in frostmere). | 430, 120, 520, 260 | yes (listed only: made elsewhere) |
| `nightsq_lights` | light | Warm light: the five lamp posts and the well's lantern (amber), the forge fire (orange, the brightest), the chapel lanterns and the houses' windows. Cold: the moon (top left) and the small green wisps in the trees. | 0, 300, 1448, 1086 | no |
| `nightsq_backdrop` | sky | Backdrop slice: the moon, a castle on a far hill, pine slopes and the river in the distance (top left), and the dark trees (top right). The camera looks down, so very little sky is seen. [here: backdrop] | 0, 0, 1448, 250 | no |
