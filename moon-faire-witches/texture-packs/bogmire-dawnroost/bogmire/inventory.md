# Bogmire: what a 3D build needs

The stilt town on the fen, seen from above at a slant, at night. Everything stands on wooden stilts over still black water: there is no dry ground at all. Raised boardwalks of weathered grey-brown planks on round posts, railed with rope slung between the posts, join the houses; in the middle is a big plank market square with two stalls under cloth awnings (green-blue on the left, faded mauve on the right), a two-lantern lamp in a flower tub with a notice board, two covered handcarts and a row of dark, unlit lanterns (the great wraith has stolen the town's light). The houses are dark vertical-board cabins with big mossy wooden shingle roofs (one has a mossy thatch), stone chimneys, warm lit windows and little porches with barrels and planters; the biggest is the Lanternless Inn, with a hanging sign. A long boardwalk runs north out of the picture to the fen's dark heart. Round the town: reeds, lily pads, dead trees and snags standing in the water, and two dark trees in the top corners. Light: cold blue moonlight, warm lantern light on the boardwalks and from windows. The paths are mostly lit by the six lanterns on posts.

Painting: `reference/art/walk/walk-bogmire.png` (1536 x 1024). Boxes are in its pixels unless the row says otherwise.

| id | kind | what it is, in plain words | where in the painting (x0, y0, x1, y1) | shared? |
|---|---|---|---|---|
| `shared_boardwalk_planks` | ground | Boardwalk planks: the deck of the market square and every boardwalk and dock. Weathered grey-brown boards laid side by side, dark gaps, a few nail heads and knots | 530, 335, 1024, 536 (stand-in pieced from small clean strips of it) | yes, made here |
| `shared_water_dark` | ground | Still black water: the fen under and round the whole town. Almost black blue, very still, a few faint ripples catching the moon | 480, 880, 700, 1024 (stand-in cut from 520, 950, 590, 1020) | yes, made here |
| `shared_planks_wall` | material | House wall of dark vertical boards: the walls of every Bogmire house and the inn. Dark brown weathered boards standing upright, with thin dark gaps, the odd paler board | 395, 715, 615, 785 (stand-in: the boardwalk planks turned upright, recoloured to these walls) | yes, made here |
| `shared_roof_shingle` | material | Wooden shingle roof: big overlapping wooden shingles, dark blue-grey with green moss in the joints (the north-west house, the inn and most houses) | 265, 40, 470, 170 (stand-in cut from 280, 50, 460, 150) | yes, made here |
| `shared_roof_thatch` | material | Thatch: the south-west house's roof and the small house north of the square. Dark, damp reed thatch with moss on it | 430, 625, 610, 705 (stand-in cut from 450, 640, 600, 700) | yes, made here |
| `inn_front` | skin | The Lanternless Inn, from the front: a tall gabled house of dark boards with a big shingle roof, stone chimney, lit windows on three floors, a little balcony, a porch with two lanterns, a door, tables and barrels | 1105, 0, 1345, 300 | no |
| `inn_sign` | skin | The inn's sign: a blank shield-shaped wooden board hanging on two chains from a wooden arm | 1032, 146, 1100, 214 | no |
| `house_nw_front` | skin | The north-west house, from the front: a wide cabin with a big mossy shingle roof, stone chimney, a lit window, a plank door with a lantern beside it, a dark window, barrels on the porch | 250, 12, 475, 230 | no |
| `house_thatch_front` | skin | The south-west house, from the front: a long cabin under a mossy thatch roof, with three windows (two lit), a plank door, planters by the door | 398, 612, 615, 790 | no |
| `house_ne_front` | skin | The north-east house, from the front: a small cabin with a shingle roof and brick-and-stone chimney, a plank door and a window, a railed porch with barrels and a ladder down to the water | 845, 40, 1005, 255 | no |
| `house_moss_front` | skin | The south house, from the front: a cabin under a shaggy moss-grown shingle roof with a chimney, two lit windows, a plank door, a lantern, tables with potted herbs on the porch | 840, 580, 1040, 790 | no |
| `house_gable_front` | skin | The south-east house, from the front: a two-storey gabled house of dark boards with a steep shingle roof, a window in the gable, a door and a lit window below, barrels at the door | 1095, 585, 1275, 795 | no |
| `herb_stall_front` | skin | Old Wenna's herb stall, from the front: a wooden stall under a faded green-blue cloth awning with a scalloped yellow-green edge, bunches of herbs hanging, potted plants, jars and baskets on two tables, a barrel at each end | 575, 325, 728, 462 | no |
| `trader_stall_front` | skin | The trader's stall, from the front: a wooden stall under a faded mauve cloth awning, barrels, crates of goods, small tables, a sack | 828, 325, 982, 462 | no |
| `square_lamp` | skin | The square's lamp: an iron post with two arms, a lit lantern on each, standing in a big round wooden tub of yellow flowers | 738, 352, 810, 495 | no |
| `notice_board` | skin | The notice board: a small wooden board on two legs with four pale paper notices pinned to it | 752, 466, 798, 518 | no |
| `covered_cart` | skin | A covered handcart: a low wooden cart with its load under a pale grey cloth, seen from the side (two at the square's south edge) | 592, 498, 698, 545 | no |
| `lantern_post` | skin | A lantern on a post: a squat lantern with warm glass on top of a round wooden boardwalk post bound with rope (six round the town) | 1286, 360, 1322, 438 | no |
| `dark_lantern` | skin | An unlit lantern: a dark iron lantern standing on the boards, its glass black (the lights the wraith has taken; three by the square's south edge) | 545, 493, 587, 546 | no |
| `mooring_crane` | skin | The mooring crane at the landing: two tall posts with a cross-beam and a brace, a small lantern hanging from the beam on a chain | 32, 238, 172, 340 | no |
| `rope_railing` | skin | Boardwalk railing: short round posts with rope slung in sagging loops between them, along every boardwalk edge | 822, 518, 975, 556 | no |
| `stilt_frame` | skin | The stilts under a house: round posts standing in the water, cross-braced, holding up the deck, with a ladder down to the water | 395, 775, 615, 870 | no |
| `bog_reeds` | plant | A clump of tall reeds standing in the water | 0, 815, 120, 965 | no |
| `bog_lilypads` | plant | Lily pads floating on the water, some with a small pink-red flower | 250, 830, 355, 890 | no |
| `bog_dead_tree` | plant | A dead tree standing in the water: a bare grey trunk with a few broken branches | 160, 760, 265, 935 | no |
| `bog_snag` | plant | A snag: a broken-off dead stump sticking up out of the water | 1235, 880, 1300, 1010 | no |
| `bog_tree_dark` | plant | The dark tree in the north-west corner: a broad tree with dense blue-black foliage | 90, 0, 265, 205 | no |
| `bog_tree_bare` | plant | The tree in the north-east corner: a spreading tree with few leaves and long bare branches | 1410, 0, 1536, 185 | no |
| `bog_bush` | plant | A low dark bush on a tussock in the water | 1255, 945, 1355, 1024 | no |
| `stilt_posts` | prop | Stilt posts: thick round posts of dark wet wood, bound with rope near the top, holding up every boardwalk and house; the boardwalk posts stand a little above the deck | 1100, 440, 1310, 560 | no |
| `barrels` | prop | Barrels and posts on the landing: wooden barrels with iron hoops (also by the inn, on porches, at the square's corners and on the docks) | 165, 330, 250, 392 | no |
| `crates_tub` | prop | Crates and a tub at the square's south-east corner | 980, 500, 1024, 545 | no |
| `bollard` | prop | The bollard where the west boardwalk meets the square: a short thick post | 520, 422, 542, 488 | no |
| `planters` | prop | Small wooden planters with herbs, by the south-west house's door (more on porches) | 415, 740, 488, 785 | no |
| `porch_tables` | prop | Little tables and planters on the south house's porch, with pots of herbs | 850, 735, 1025, 785 | no |
| `ladder` | prop | Wooden ladders from the decks down to the water (under most houses and docks) | 500, 800, 532, 870 | no |
| `water_stair` | prop | The water stair south of the square: a small landing with crates and a barrel, a lantern, and steps down to the water; a bucket on a rope (the well spot) | 690, 805, 830, 895 | no |
| `chimney_stone` | prop | Stone chimneys: small square chimneys of grey stones on the shingle roofs | 262, 10, 300, 65 | no |
| `mooring_post` | prop | Mooring posts on the landing, for tying up punts | 100, 295, 140, 360 | no |
| `west_dock_fingers` | prop | The west dock's three railed fingers over the water, with lanterns on their posts | 30, 520, 240, 660 | no |
| `long_walk_north` | prop | The long boardwalk going north out of the picture to the fen's dark heart, with a lamp pole beside it | 700, 0, 830, 340 | no |
| `light_lanterns` | light | The six lit lanterns on posts (landing, west dock, square's west corner, east boardwalk, inn stair, south-east dock), the hanging lantern on the mooring crane, and the lamp pole by the long walk: warm orange light pooling on the boards | 1286, 360, 1322, 438 | no |
| `light_square_lamp` | light | The two-lantern lamp in the middle of the square: the brightest warm light in town | 738, 352, 810, 495 | no |
| `light_windows` | light | Warm lit windows: the inn (gable, first floor, by the door), the north-west house, the south-west and south houses, the east houses | 1105, 0, 1345, 300 | no |
| `light_wall_lanterns` | light | Small wall lanterns by doors: two on the inn's porch, one by the north-west house's door, one on the south house | 1130, 210, 1310, 275 | no |
| `bog_sky` | sky | What lies beyond (from the fight painting of the Gloomfen lantern banks): a full moon in a purple night sky with thin clouds, dark hills, weeping willows, mist on the water and the lit stilt town in the distance | 0, 0, 1448, 700 in the fight painting `reference/art/battle-backgrounds/03-gloomfen-bogmire-lantern-banks.png` | no |

46 rows: 5 stand-ins, 29 prompts, 12 props.
