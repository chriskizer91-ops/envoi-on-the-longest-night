# Misthollow: texture pack inventory

Painting: `reference/art/walk/walk-misthollow.png` (1536 x 1024). Boxes are x0, y0, x1, y1 in its pixels.

A cold town of pale stone towers built up a mountainside above a sea of mist. A straight street of frosted setts, lined with lamp pillars and navy star banners, runs north up to the dead Moonwell. Halfway down it opens into the upper square (Sorrel's shop with its green awning on the west, the Lantern House inn on the east), then a great stone stair in three flights drops to the lower square and the way out south. Everything is pale grey block stone with snow on every ledge and balustrade; roofs are blue slate with snow along the edges; arched bridges, stairs and terraces climb the cliffs; snowy pines grow between. Warm light comes only from the lamp pillars, the shop window and the inn.

Rows marked shared use one texture for the whole game. "made here" means its stand-in and prompt are in this folder; "listed" means it is made in another place (see the group README).

| id | kind | what it is | where in the painting | shared? |
|---|---|---|---|---|
| shared_setts_frosted | ground | the street and squares: squared grey-blue setts with frost in the joints | (560, 800, 760, 940); stand-in cut from (600, 830, 720, 900) | yes, made here |
| shared_snow | ground | snow drifts on the terraces, ledges and the edges of the squares | (240, 540, 330, 600) | yes, listed |
| misthollow_diamond_inlay | skin | a diamond of pale stone set into the street with a small star in it (there are several up the street) | (732, 615, 800, 680) | no |
| misthollow_roof_blue_slate | material | blue slate roofs with snow lying along their ridges and eaves | (1040, 410, 1180, 495); stand-in cut from (1046, 424, 1136, 474) | no |
| shared_stone_wall_frosted | material | the pale grey block stone of every wall, tower and stair | (330, 90, 450, 200) | yes, listed |
| shared_rock_cliff_snowy | material | the snowy rock cliffs the town is built on | (60, 620, 260, 900) | yes, listed |
| shared_roof_slate_snow | material | some smaller roofs with snow on every slate | (370, 380, 560, 480) | yes, listed |
| shared_halftimber_bay | skin | a bay of timber-framed wall: dark beams and braces with grey stone infill (the Lantern House's upper floor) | (1036, 494, 1182, 618) | yes, made here |
| misthollow_sorrel_shop | skin | Sorrel's shop: a stone front with a green awning over a glowing window of potion bottles, an arched door with a lamp | (365, 470, 585, 612) | no |
| misthollow_lantern_house | skin | the Lantern House inn: stone ground floor with an arched door and a lantern, timber-framed upper floor, warm windows, snowy blue roof, a hanging sign | (925, 398, 1190, 655) | no |
| misthollow_banner | skin | a navy banner with a white eight-pointed star, on an iron pole (along the street and the stairs) | (566, 712, 608, 828) | no |
| misthollow_tower | skin | a tall tower of pale stone with arched windows and a cone roof of blue slate edged in snow | (330, 0, 452, 268) | no |
| misthollow_chapel_front | skin | the small chapel: a steep stone gable with an arched window and arched door, steps up to it | (522, 60, 642, 332) | no |
| misthollow_arch_bridge | skin | an arched stone bridge with a balustrade, spanning a gap in the cliffs | (75, 188, 252, 378) | no |
| misthollow_balustrade | skin | a stone balustrade: small posts under a rail, snow on top (along every terrace and stair) | (100, 190, 228, 234) | no |
| misthollow_great_stair | prop | the great stair: three flights of stone steps between the squares, with gateposts | (430, 690, 1100, 800) | no |
| misthollow_lamp_pillar | prop | a square stone pillar with an iron lantern on top | (574, 628, 616, 706) | no |
| misthollow_barrels_crates | prop | barrels, a crate and a banner's foot under the great stair, snow on their lids | (525, 768, 634, 832) | no |
| misthollow_bench | prop | a wooden bench by the west stairs | (322, 580, 376, 626) | no |
| misthollow_frozen_trough | prop | a small frozen trough with a tub beside it (a letter in a jar is under the ice) | (360, 822, 420, 880) | no |
| misthollow_wagon_wheels | prop | big wooden wagon wheels set against the south wall, with an iron railing | (580, 975, 650, 1024) | no |
| misthollow_inn_sign | prop | the Lantern House's round hanging sign on its bracket | (925, 568, 980, 632) | no |
| misthollow_finial_pillar | prop | a square stone gatepost with a round stone finial | (1066, 665, 1100, 832) | no |
| misthollow_bare_tree_frosted | plant | a bare tree with snow along its branches | (628, 98, 714, 218) | no |
| shared_pine_snowy | plant | snow-laden pines between the buildings and on the cliffs | (1100, 660, 1150, 800) | yes, listed |
| misthollow_lamps | light | the lanterns on the stone pillars all along the street, the squares and the stair | (574, 628, 616, 706) | no |
| misthollow_shop_glow | light | the warm glow of Sorrel's shop window | (380, 510, 500, 600) | no |
| misthollow_inn_windows | light | the Lantern House's warm windows and door lantern | (1040, 500, 1130, 630) | no |
| misthollow_mist_sea | sky | the sea of mist far below the town, with snowy pine slopes dropping into it (east and west edges) | (1330, 560, 1536, 1010) | no |
| misthollow_sky | sky | above the town: an eclipsed moon over great snowy peaks, Misthollow's spires and arched bridges in the mist (from the dead Moonwell fight painting) | (0, 0, 1448, 380) in `reference/art/battle-backgrounds/14-ironhold-misthollow-dead-moonwell.png` | no |

In this folder: 2 stand-ins (`stand-in/`), 12 prompts (`prompts.json`), 22 reference crops (`refs/`).
