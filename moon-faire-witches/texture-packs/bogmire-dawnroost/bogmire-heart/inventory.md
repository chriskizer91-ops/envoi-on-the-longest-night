# The fen's dark heart: what a 3D build needs

The dark heart of the fen, north of Bogmire, where the great wraith waits (the wraith is not in the painting; it comes in the fight). Seen from above at a slant, at night, all in cold blue with no warm light but two lanterns. The long boardwalk from Bogmire comes in from the bottom to a big square deck of old moss-flecked planks with broken boards at its edges, railed with posts and rope; small side decks go off east and west. At the top, steps lead up to a big dark hall on stilts, with a gable over its plank door and fishing nets hung along its front. Round the square, abandoned houses on stilts stand in the water: dark board walls, black empty windows, roofs of mossy blue-grey shingles or old red-brown tiles, stone chimneys (a few still trailing smoke), ladders, barrels and hanging weed. The water here is wider and more open than in town, rippled, with drifts of green mist over it, lily pads, and broken pilings sticking out of it. The only warm light is the two lanterns at the square's near corners. The green mist is an effect (fog), not a texture.

Painting: `reference/art/walk/walk-bogmire-heart.png` (1536 x 1024). Boxes are in its pixels unless the row says otherwise.

| id | kind | what it is, in plain words | where in the painting (x0, y0, x1, y1) | shared? |
|---|---|---|---|---|
| `heart_deck_mossy` | ground | The old deck of the square: long grey-blue planks, worn and damp, flecked with moss in the gaps, a few missing | 500, 310, 1040, 670 (stand-in cut from 640, 420, 760, 510) | no |
| `heart_water_open` | ground | Open fen water: wider than in town, dark blue with small ripples and many moon glints | 880, 850, 1100, 1024 (stand-in cut from 930, 900, 1020, 990) | no |
| `shared_water_dark` | ground | Still black water under the houses and decks | 150, 120, 450, 260 | yes, made in Bogmire |
| `shared_boardwalk_planks` | ground | The long boardwalk in from Bogmire, the side decks and the walk up to the hall | 727, 660, 810, 1024 | yes, made in Bogmire |
| `heart_roof_red` | material | Old red-brown roof tiles mixed with blue-grey ones, mossy (the house at the left, the hall's right wing, the east houses) | 50, 245, 230, 360 (stand-in cut from 95, 270, 175, 345) | no |
| `shared_roof_shingle` | material | Mossy blue-grey shingle roofs on most of the houses round the square | 434, 49, 593, 148 | yes, made in Bogmire |
| `shared_planks_wall` | material | Dark board walls of the hall and houses (darker and wetter here, never lit) | 590, 80, 1000, 180 | yes, made in Bogmire |
| `hall_front` | skin | The great hall at the top: a long dark hall on stilts with a gable over its plank door, black empty windows, fishing nets hung along its front, barrels by the door, roofs of blue-grey and red-brown | 590, 0, 1000, 225 | no |
| `heart_house_front` | skin | The abandoned house at the left: a cabin under a red-brown tile roof with a stone chimney, a black window, a plank door, a barrel and a coil of rope | 50, 230, 245, 450 | no |
| `heart_house_east` | skin | The abandoned house at the bottom right: a gabled cabin with a steep mossy shingle roof and chimney, a dark door and window, barrels, on a deck on stilts | 1190, 520, 1500, 770 | no |
| `fishing_net` | skin | A fishing net hung in a sagging loop from two pegs, with float corks (along the hall's front) | 598, 135, 680, 205 | no |
| `heart_lantern` | skin | One of the two lanterns still burning: an iron lantern with warm glass on top of a thick rope-bound post at the square's near corners | 522, 605, 560, 695 | no |
| `hanging_weed` | plant | Green weed and slime hanging down from the posts and deck edges | 875, 190, 915, 265 | no |
| `bog_lilypads` | plant | Lily pads on the water (same as Bogmire's) | 260, 860, 360, 960 | no (made in Bogmire) |
| `broken_boards` | prop | Broken boards: gaps in the deck at its edges where planks are missing or snapped and the water shows below | 495, 335, 575, 415 | no |
| `broken_pilings` | prop | Broken pilings: pairs of old posts sticking out of the open water, some with a cross-piece, bound with rope, hung with weed | 185, 895, 255, 1000 | no |
| `mooring_posts` | prop | Tall mooring posts standing alone in the water, with rope bands and a leaning brace | 390, 740, 445, 860 | no |
| `railing_broken` | prop | The square's railing: short posts with rope between them, a few posts leaning or snapped (uses `rope_railing` from Bogmire) | 880, 280, 1060, 340 | no |
| `hall_steps` | prop | The plank walk and steps up to the hall's door, with posts either side | 735, 175, 805, 315 | no |
| `barrels` | prop | Barrels at the hall's door (and on the house porches) | 685, 165, 745, 212 | no |
| `chimney_smoke` | prop | Stone chimneys, a few with a thin trail of grey smoke | 205, 0, 250, 80 | no |
| `ladder` | prop | Ladders and rope coils on the house decks | 275, 140, 312, 180 | no |
| `light_lanterns` | light | The two lanterns at the square's near corners: the only warm light here | 522, 605, 560, 695 | no |
| `light_none_windows` | light | All windows and doors are black: no light inside any building | 590, 0, 1000, 225 | no |
| `heart_sky` | sky | What lies beyond (from the great wraith's fight painting): a full moon behind dark clouds, a purple sky, dead trees and the black spires of distant buildings | 0, 0, 1448, 180 in the fight painting `reference/art/backdrops/battle-bogmire-boardwalk.png` | no |

25 rows: 3 stand-ins, 9 prompts, 8 props.
