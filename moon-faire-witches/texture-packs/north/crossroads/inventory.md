# The northern crossroads: texture pack inventory

Painting: `reference/art/walk/walk-northern-crossroads.png` (1536 x 1024). Boxes are x0, y0, x1, y1 in its pixels.

Four old paved roads meet in a ring of stone with a compass star set in it, out on a cold moor at night. Dry golden grass with frost on it fills the ground between; the north edge is under thin snow, with a frozen pond in the top-left corner. Ruined low walls and broken gateposts line the roads. The well with its lantern (where the letter is) stands south-west of the ring, and a fallen waymarker with a glowing amber rune lies north-east of it. Halcyon's ambush happens in the ring. Snow-dusted rock outcrops and dark pines close in at the corners. The only warm light is the well's lantern and the rune.

Rows marked shared use one texture for the whole game. "made here" means its stand-in and prompt are in this folder; "listed" means it is made in another place (see the group README).

| id | kind | what it is | where in the painting | shared? |
|---|---|---|---|---|
| crossroads_road_paving | ground | the old paving of the four roads: worn grey blocks, dry grass and frost in the gaps | (700, 0, 840, 330); stand-in cut from (0, 446, 120, 532) | no |
| shared_grass_frosted | ground | dry golden moor grass with white frost on it, over dark earth: the ground between the roads | (900, 600, 1160, 800); stand-in cut from (935, 650, 1095, 762) | yes, made here |
| shared_snow_patchy | ground | thin snow lying in patches over dry grass and earth (the north edge of the map) | (840, 100, 1100, 300); stand-in cut from (880, 140, 1060, 260) | yes, made here |
| shared_snow | ground | deeper snow on the hillside along the top edge | (380, 0, 700, 110) | yes, listed |
| shared_ice | ground | the frozen pond in the top-left corner, with snow on its banks | (0, 40, 240, 175) | yes, listed |
| shared_rock_cliff_snowy | material | dark grey rock outcrops dusted with snow, at the corners of the map | (1290, 80, 1536, 300) | yes, listed |
| shared_stone_wall_frosted | material | the cut-stone blocks of the ruined low walls along the roads | (330, 370, 560, 445) | yes, listed |
| crossroads_ring_compass | skin | the round stone ring where the roads meet, its stones laid in circles round a carved compass star (Halcyon's ambush is here); seen from above, laid as one piece | (580, 315, 952, 632) | no |
| crossroads_gatepost | skin | an old square stone gatepost, cracked and leaning, with a stub of broken wall at its foot (two on the north road, two on the south) | (645, 125, 720, 252) | no |
| crossroads_well | skin | the crossroads well: a round stone well with a wooden frame, rope and bucket, a lantern hung on its post (a letter lies under a stone on its rim) | (462, 520, 590, 645) | no |
| crossroads_waymarker | skin | the fallen waymarker: a carved stone pillar lying toppled on its side, an amber rune glowing on it, broken stones round it | (920, 270, 1060, 395) | no |
| crossroads_ruined_wall | prop | stretches of ruined low wall of cut stone with broken pillar stumps, along the west and east roads | (330, 365, 560, 445) | no |
| crossroads_standing_rock | prop | a tall rough rock standing in the grass | (318, 188, 392, 278) | no |
| crossroads_boulder | prop | grey boulders, some dusted with snow, scattered in the grass | (135, 325, 200, 385) | no |
| crossroads_rock_cluster | prop | a cluster of big grey boulders with bare bushes round them | (1150, 585, 1270, 700) | no |
| crossroads_pine_dark | plant | a dark pine with almost no snow on it | (1428, 600, 1512, 800) | no |
| crossroads_dead_tree | plant | a bare black dead tree with twisting branches | (1195, 725, 1310, 885) | no |
| crossroads_bare_shrub | plant | a leafless twiggy bush | (188, 172, 270, 258) | no |
| crossroads_grass_tuft | plant | a tuft of dry golden grass with frost on the tips | (108, 860, 172, 928) | no |
| crossroads_well_lantern | light | the small lantern hanging on the well's post: warm amber, the only lamp here | (548, 540, 580, 590) | no |
| crossroads_rune_glow | light | the amber rune on the fallen waymarker, a faint warm glow on the ground round it | (990, 295, 1035, 340) | no |
| crossroads_sky | sky | beyond the moor: a full moon over a range of snowy peaks, pine valleys filled with mist, violet night sky (from the crossroads fight painting) | (0, 0, 1448, 520) in `reference/art/battle-backgrounds/13-northern-crossroads.png` | no |

In this folder: 3 stand-ins (`stand-in/`), 11 prompts (`prompts.json`), 16 reference crops (`refs/`).
