# Dawnroost's living node: what a 3D build needs

The living node: the walled court on the hilltop above Dawnroost, where Envoi is made. Seen from above at a slant, at night, glowing gold. At the top, the sunstone: a huge amber crystal cluster blazing with light, on a round stepped dais of pale stone ringed by short iron posts and chains, set in a curved niche of the north wall. Its light runs out across the court in glowing gold veins between the cobbles, and in front of it is a big round sun pattern set into the floor. Grey castle walls with crenellations surround the court; stone stairs go up to the wall walk at both top corners. In the court: tall iron braziers burning, red banners with a gold sun (on the walls and on stands over two braziers), benches, barrels, pot plants and flower beds, a stall with a red and white striped awning (west), a weapon rack and a second stall (east), a covered wagon, iron urns on the gateposts. The gate at the bottom opens on the road down to Dawnroost. Outside: rocky cliffs and dark bushes with little flowers. Light: the sunstone's gold, firelight from braziers and wall-top fire bowls, a lantern each side of the gate.

Painting: `reference/art/walk/walk-dawnroost-node.png` (1536 x 1024). Boxes are in its pixels unless the row says otherwise.

| id | kind | what it is, in plain words | where in the painting (x0, y0, x1, y1) | shared? |
|---|---|---|---|---|
| `node_cobbles_veined` | ground | The court's cobbles with glowing gold veins: grey-brown setts with thin bright gold cracks running between them | 300, 170, 1250, 620 (stand-in cut from 380, 420, 520, 520) | no |
| `node_court_cobbles` | ground | The court's plain cobbles, away from the sunstone: grey-mauve squarish setts with moss and tiny yellow flowers in the gaps | 960, 520, 1100, 600 | no |
| `shared_cobbles_town` | ground | The road through the gate down to Dawnroost (rounded cobbles) | 700, 830, 840, 1024 | yes, made by group wickhollow |
| `shared_wall_castle` | material | The court's walls and wall walk: grey dressed stone blocks (made in Dawnroost; the clean wall face at the bottom right shows it too) | 1030, 725, 1160, 815 | yes, new shared id, made in Dawnroost |
| `shared_rock_cliff` | material | The rocky cliffs round the court's hill | 0, 0, 180, 700 | yes, made by another group |
| `shared_awning_stripes` | material | Red and cream striped awning cloth of the two stalls (the same cloth as the Wickhollow jetty's stalls) | 110, 420, 260, 500 | yes, made by group wickhollow |
| `node_dais_stone` | material | The dais stone: pale dressed stone blocks of the sunstone's stepped round dais, warm in its light | 650, 200, 890, 270 (stand-in: the wall blocks at 1085, 742, 1150, 805, recoloured to this stone) | no |
| `sunstone_crystal` | skin | The sunstone: a huge cluster of amber crystals blazing with gold light, on its round stepped dais with short iron posts and chains round it | 650, 40, 890, 270 | no |
| `node_sun_medallion` | skin | The sun in the floor: a big round pattern of dark paving set into the court, with a gold disc in the middle and wavy gold rays (seen squashed; it is a circle) | 640, 365, 900, 535 | no |
| `node_brazier` | skin | A tall iron brazier: a round iron fire basket burning on a stand, on a square stone base (either side of the dais) | 535, 160, 598, 268 | no |
| `node_banner_stand` | skin | A banner stand over a brazier: a black iron pole with a cross-bar holding a red banner with a gold sun, over a burning fire basket | 535, 295, 602, 505 | no |
| `node_banner_red` | skin | A red wall banner with a gold sun (on the court's walls) | 352, 105, 400, 200 | no |
| `node_gate` | skin | The court's gate: a round arch through the crenellated wall, a lantern each side, square pillars with red banners and iron urns on top | 560, 555, 975, 840 | no |
| `gatepost_urn` | skin | An iron urn on a gatepost: a black iron vessel with a shield-shaped front, on a stone pillar top | 565, 555, 628, 640 | no |
| `node_stall_west` | skin | The west stall: a red and white striped cloth awning on wooden poles with rope and red trim, goods on small tables, barrels, a lantern and small orange banners | 95, 405, 290, 570 | no |
| `node_stall_east` | skin | The east weapon rack and stall: spears in a wooden rack with a red sun banner, a red and white striped awning over barrels and a lantern | 1190, 420, 1445, 585 | no |
| `covered_wagon` | skin | A covered wagon: a small wooden wagon with a grey canvas hood and red trim, seen from the side | 185, 580, 295, 692 | no |
| `newel_lantern` | skin | A fire bowl on a stair post: a black iron bowl with flames on top of a stone newel post (at the stairs and the wall corners) | 168, 118, 210, 195 | no |
| `cypress_dark` | plant | A cypress: a slim dark evergreen by the court's south wall (one each side of the gate) | 422, 600, 476, 705 | no |
| `node_flower_bush` | plant | Flowering bushes: dark bushes covered in little white and yellow flowers, along the walls inside and out | 470, 615, 560, 700 | no |
| `pot_plant` | plant | A pot plant: a small flowering shrub in a wooden tub (at the stairs' feet) | 270, 312, 314, 386 | no |
| `wall_stairs` | prop | The stone stairs up to the wall walk, at the top left and top right, with posts and fire bowls | 200, 140, 285, 345 | no |
| `wall_walk` | prop | The wall walk along the top of the walls, with crenellations | 180, 90, 600, 170 | no |
| `dais_posts_chains` | prop | The short black iron posts with chains round the sunstone's dais | 655, 160, 890, 250 | no |
| `barrels_tubs` | prop | Barrels and tubs by the west stairs (more by the east stairs and stalls) | 305, 255, 365, 360 | no |
| `benches` | prop | Wooden benches against the walls and by the stalls | 425, 205, 510, 250 | no |
| `crates_goods` | prop | Crates, bundles and small tables of goods at the stalls | 1360, 500, 1440, 560 | no |
| `light_sunstone` | light | The sunstone: the brightest light, gold, filling the top of the court; the gold veins in the floor glow from it | 650, 40, 890, 270 | no |
| `light_braziers` | light | Four braziers (two by the dais, two under the banner stands): firelight | 535, 160, 598, 268 | no |
| `light_fire_bowls` | light | Fire bowls on the stair posts and the wall-top corners | 140, 50, 560, 200 | no |
| `light_gate_lanterns` | light | A lantern each side of the gate arch, and the stalls' lanterns | 650, 700, 890, 780 | no |
| `node_sky` | sky | What lies beyond (from the node's fight painting): a full moon over purple mountains and dark pine forest, and far off a lit castle town on a lake | 0, 0, 800, 330 in the fight painting `reference/art/backdrops/battle-dawnroost-node.png` | no |

32 rows: 3 stand-ins, 17 prompts, 6 props.
