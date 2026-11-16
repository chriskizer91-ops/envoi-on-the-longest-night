# The frozen pass: texture pack inventory

Painting: `reference/art/walk/walk-frozen-pass.png` (1536 x 1024). Boxes are x0, y0, x1, y1 in its pixels.

A snowbound mountain road climbing north to Misthollow. A paved road, half buried in snow, runs straight up the middle and crosses a frozen river on a short stone crossing between four snow-capped pillars. The river is cracked plates of dark blue ice; to the east it falls down a frozen waterfall of ice columns and icicles. Everything else is deep snow, snow-capped dark rock columns and heavy snow-laden pines, with bare bushes and low mist in the hollows at the edges. South of the river: an iron lamp post with its lantern lit (the only warm light) and someone's abandoned sled with a crate, where the camp is.

Rows marked shared use one texture for the whole game. "made here" means its stand-in and prompt are in this folder; "listed" means it is made in another place (see the group README).

| id | kind | what it is | where in the painting | shared? |
|---|---|---|---|---|
| frozenpass_road_snowy | ground | the pass road: grey paving blocks with snow packed between them and drifting over the edges | (700, 560, 900, 1024); stand-in cut from (740, 820, 840, 900) | no |
| shared_snow | ground | deep soft snow: the ground everywhere off the road | (600, 800, 720, 920); stand-in cut from (648, 838, 704, 884) | yes, made here |
| shared_ice | ground | the frozen river: plates of dark blue ice with white cracks between them | (1100, 440, 1340, 640); stand-in cut from (1180, 540, 1290, 600) | yes, made here |
| shared_rock_cliff_snowy | material | dark grey rock in tall columns and blocks, snow heaped on every ledge | (60, 520, 300, 720); stand-in cut from (100, 560, 250, 700) | yes, made here |
| frozenpass_frozen_waterfall | skin | the frozen waterfall east of the road: ice columns and icicles down dark rock steps into the river | (1175, 95, 1425, 430) | no |
| frozenpass_crossing_pillar | skin | one of the four tall stone pillars at the ends of the river crossing, capped with snow | (650, 292, 708, 528) | no |
| frozenpass_crossing | prop | the river crossing: the paved road carried over the ice between the four pillars | (650, 290, 892, 530) | no |
| frozenpass_lamp_post | prop | an iron lamp post with a lantern hung out on a curled bracket, lit | (572, 552, 628, 692) | no |
| frozenpass_sled | prop | an abandoned wooden sled with curled iron runners, a chain, and a crate beside it | (832, 588, 1000, 732) | no |
| frozenpass_snowy_boulder | prop | small dark rocks with snow caps, half buried | (836, 722, 892, 775) | no |
| frozenpass_rock_column | prop | a big outcrop of dark rock columns with a thick snow cap, pines round it | (280, 85, 485, 265) | no |
| shared_pine_snowy | plant | a dark pine weighed down with heavy snow on every branch | (1395, 530, 1536, 872) | yes, made here |
| frozenpass_bare_bush_snowy | plant | a leafless bush with snow along its twigs | (912, 552, 1012, 658) | no |
| frozenpass_icicles | plant | a fringe of icicles hanging from a rock ledge | (330, 140, 388, 218) | no |
| frozenpass_lamp_light | light | the lit lantern on the lamp post: a pool of warm light on the snow, the only warm light in the pass | (560, 550, 690, 700) | no |
| frozenpass_mist | sky | low mist drifting between the snowy pines in the hollows at the map's edges | (0, 690, 150, 960) | no |
| frozenpass_sky | sky | beyond the pass: a full moon over jagged snowy peaks, dark pine slopes and a frozen river valley (from the frozen road fight painting) | (0, 0, 1448, 420) in `reference/art/backdrops/battle-frozen-road.png` | no |

In this folder: 4 stand-ins (`stand-in/`), 9 prompts (`prompts.json`), 16 reference crops (`refs/`).
