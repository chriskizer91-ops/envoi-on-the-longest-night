# Dawnroost: what a 3D build needs

Dawnroost, the Warden waystation and Sol's old home, seen from above at a slant, at night. A walled yard on a rocky, wooded hill. Grey dressed-stone curtain walls with crenellations, square towers and a big round tower; a north gate (top) leads up to the living node, and the main gate (bottom) out to the forest road, both with lanterns on their pillars and blue banners with a gold sun. Inside: cobbled roads and yards; the long Warden hall (rough stone walls, red tile roof with dormers and four chimneys, blue sun banners, barrels at the door); stables with arched stalls, straw and lanterns; a cottage; a forge with an open front, anvils and a grindstone; a roofed well with glowing water among flower beds, with a bench; a post-and-rail fence; weapon racks and chained posts in the training yard. Through a gateway in the east wall, a timber dock on stilts over dark water, with a crane and crates (where the Magpie moors). Outside the walls: grassy hillside with tiny white and blue flowers, grey boulders and cliffs, dark pines and leafy trees. Light: cold blue moonlight, warm lamplight from black iron lamp posts and wall lanterns, lit windows.

Painting: `reference/art/walk/walk-dawnroost.png` (1536 x 1024). Boxes are in its pixels unless the row says otherwise.

| id | kind | what it is, in plain words | where in the painting (x0, y0, x1, y1) | shared? |
|---|---|---|---|---|
| `shared_cobbles_town` | ground | Cobbles: the roads and yards inside the walls (grey-brown rounded cobbles with grass in the gaps; a line of gold-lit cracks runs down the road from the north gate) | 580, 200, 700, 640 | yes, made by group wickhollow |
| `dawn_grass_flowers` | ground | Hillside grass: dark green grass speckled with tiny white, blue and pink wildflowers, outside the walls | 940, 820, 1030, 910 (stand-in cut from 1355, 845, 1415, 885) | no |
| `stable_straw` | ground | Straw on the stable floors, golden in the lamplight | 800, 330, 1010, 400 (stand-in cut from 835, 376, 853, 394) | no |
| `shared_wall_castle` | material | Castle wall: grey dressed stone blocks in neat rows with pale mortar (the curtain walls, towers and gates; also the living node's walls) | 940, 740, 1180, 840 (stand-in cut from 955, 768, 1020, 818) | yes, new shared id, made here |
| `shared_stone_wall_rough` | material | Rough stone walls: the Warden hall's and the cottage's walls (irregular grey-brown stones) | 143, 373, 527, 450 | yes, made by group wickhollow |
| `shared_roof_tiles_red` | material | Red clay roof tiles: the hall's, stables', cottage's and forge's roofs (the same small red-brown tiles as Wickhollow's) | 143, 247, 527, 373 | yes, made by group wickhollow |
| `shared_boardwalk_planks` | ground | The dock's deck: brown planks running left to right (lighter and warmer than Bogmire's) | 1294, 203, 1500, 395 | yes, made in Bogmire |
| `shared_water_dark` | ground | Dark water round the dock at the top right | 1300, 0, 1536, 200 | yes, made in Bogmire |
| `shared_rock_cliff` | material | Grey boulders and cliffs on the hillside below the walls | 0, 640, 200, 1024 | yes, made by another group |
| `warden_hall_front` | skin | The Warden hall, from the front: a long low hall of rough grey-brown stone, a red tile roof with five little dormer windows and four stone chimneys, an arched plank door with a lantern each side, two lit windows, two blue banners with a gold sun, barrels at the door | 135, 212, 535, 460 | no |
| `north_gate` | skin | The north gate: a gatehouse in the curtain wall, two square towers with crenellations, a round arch over a cobbled way, a lantern on each side | 510, 40, 712, 200 | no |
| `main_gate` | skin | The main gate: two square towers with lanterns on top and on their faces, iron-bound doors standing open, a blue sun banner on the wall beside | 520, 690, 775, 870 | no |
| `stables_front` | skin | The stables: a long building with three stone arches into stalls with straw, a lantern over each arch, a red tile roof, stall gates | 768, 205, 1040, 400 | no |
| `round_tower` | skin | The round tower: a tall round tower of grey stone with a crenellated top and two small lit windows | 920, 0, 1085, 230 | no |
| `cottage_front` | skin | The cottage: a small stone house with a red tile roof, an arched plank door, a lit window, flower beds and crates beside it | 340, 540, 525, 700 | no |
| `forge_front` | skin | The forge: an open-fronted smithy under a red tile roof on timber posts, a stone hearth and chimney at the back, anvils, tools on the wall, a grindstone, a lantern | 980, 520, 1210, 725 | no |
| `yard_well` | skin | The yard well: a round stone well with a small shingled roof on two posts and a windlass, the water inside glowing pale blue-white | 738, 472, 826, 592 | no |
| `banner_sun_blue` | skin | A Warden banner: a long deep-blue banner with a gold sun and a pointed end, hung from a short rod | 450, 100, 496, 180 | no |
| `lamp_post_iron` | skin | A lamp post: a slim black iron post with a lantern on top, warm glass (seven round the town) | 690, 415, 724, 512 | no |
| `wall_lantern` | skin | A wall lantern: an iron lantern on a bracket on a gate pillar | 545, 770, 575, 822 | no |
| `dock_crane` | skin | The dock crane: a wooden post crane with a long arm, a rope and an iron hook | 1360, 120, 1490, 245 | no |
| `weapon_rack` | skin | A weapon rack: a wooden frame holding spears and swords upright (in the training yard by the hall) | 135, 460, 215, 545 | no |
| `rail_fence` | skin | A post-and-rail fence: dark wooden posts with two rails (along the yard in front of the stables) | 765, 405, 1110, 455 | no |
| `pine_dark` | plant | A dark pine: a small fir with dense dark blue-green branches | 885, 655, 955, 745 | no |
| `leafy_tree` | plant | A leafy tree: a round-crowned tree with dark leaves speckled with little pale flowers (over the walls and by the cottage) | 285, 0, 425, 85 | no |
| `flower_bush` | plant | A flowering bush: a low dark bush thick with little yellow, white and pink flowers (in beds along the walls, round the well) | 388, 140, 470, 200 | no |
| `barrels` | prop | Barrels: behind the hall, at its door, by the forge and the gateway, on the dock | 120, 190, 180, 240 | no |
| `crates` | prop | Crates stacked on the dock by the crane | 1395, 200, 1450, 272 | no |
| `anvils_grindstone` | prop | The forge's two anvils on wooden blocks and its grindstone | 1010, 655, 1205, 722 | no |
| `well_bench` | prop | A wooden bench by the well, and a small crate | 765, 590, 860, 630 | no |
| `chained_posts` | prop | The chained posts and the tall post in the training yard (practice posts linked with chain) | 215, 475, 335, 600 | no |
| `mooring_posts` | prop | Mooring posts and a barrel at the dock's south edge | 1320, 350, 1462, 425 | no |
| `dock_frame` | prop | The dock's timber frame: posts and cross braces under the deck, standing in the water | 1290, 390, 1500, 470 | no |
| `stone_steps` | prop | Rough stone steps going down the hillside outside the west wall | 145, 740, 200, 800 | no |
| `chimneys` | prop | Square stone chimneys with dark pots (four on the hall, one on the stables, the forge's tall one) | 205, 210, 245, 252 | no |
| `flower_beds` | prop | Flower beds round the well and along the hall and walls | 670, 490, 740, 615 | no |
| `light_lamp_posts` | light | Seven iron lamp posts: two inside the north gate, two by the well and the hall, one by the dock gateway, two on the dock's east rail | 690, 415, 724, 512 | no |
| `light_gate_lanterns` | light | Lanterns on the gates' pillars and towers, and on the west wall's pillars | 520, 690, 775, 870 | no |
| `light_windows` | light | Warm windows: the hall's dormers and windows, the cottage, the round tower's slits | 135, 212, 535, 460 | no |
| `light_stables_forge` | light | Lanterns under the stable arches, and the forge's lantern and hearth | 768, 205, 1040, 400 | no |
| `light_well` | light | The well's water glows pale blue-white | 738, 472, 826, 592 | no |
| `dawn_sky` | sky | What lies beyond (from the Thornhollow fight painting): a full moon in a deep purple sky with thin clouds, high snowy mountains and dark pine forest | 0, 0, 1448, 520 in the fight painting `reference/art/battle-backgrounds/12-thornhollow-dawnroost-living-node.png` | no |

42 rows: 3 stand-ins, 20 prompts, 10 props.
