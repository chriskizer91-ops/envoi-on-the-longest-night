# frostmere: texture pack

Frostmere's shore: band 4's wild fights and the Bramble Colossus, by the lake below the Ironspire Peaks. A flat meadow of frosted grass, then dark pines in the mist on the left and the moonlit lake with pine islands on the right, and the great snow range filling the sky. The live 3D ground is frosted meadow grass; a snow-laden pine frames the right side; snow falls lightly. This painting shows the snow range and the pines best, so their shared textures are made here.

Painting: `reference/art/battle-backgrounds/05-ironspire-frostmere-lakeside-meadow.png` (1448 x 1086); in the prompts it is called `frostmere.png`.
Boxes are x0, y0, x1, y1 in that painting's pixels. Ground stand-ins are cut from the nearest ground with a strong squash (the painting is side-on), unless the row says they come from a walking map. `backdrop/` holds the far-land slices at full width.

| id | kind | what it is, in plain words | where in the painting | shared? |
|---|---|---|---|---|
| `frostmere_frost_meadow` | ground | The meadow's floor: short grass touched with frost, rime glinting on the blades, a few tiny white flowers. Frosty ground from above: wilds/walk-frostmere-shore.png (snowier) and shared_grass_frosted. [here: stand-in, prompt] | 0, 712, 1448, 1086 | no |
| `shared_grass_frosted` | ground | Frosted grass in general (made by a walking-map pack); the meadow here is greener. | 0, 712, 1448, 1086 | yes (listed only: made elsewhere) |
| `frostmere_lake_water` | material | The lake: still dark blue water with a silver path of moonlight on it and mist lying on top. The game calls it frozen and its storm is a blizzard, but the painting shows open water; it is seen from above (frozen) in wilds/walk-frostmere-shore.png (shared_lake_ice). The stand-in is cut from a thin clear strip (1285, 650, 1440, 680) and is soft. [here: stand-in, prompt] | 800, 615, 1448, 705 | no |
| `shared_lake_ice` | ground | If the lake is built frozen, use the walking map's black lake ice (made by the wilds-north pack from wilds/walk-frostmere-shore.png). | 800, 615, 1448, 705 | yes (listed only: made elsewhere) |
| `shared_pine_snowy` | plant | The snow-laden pine the game puts on the right of this fight (made by the north pack); the painting's own pines carry no snow (shared_tree_pine). | 240, 465, 340, 660 | yes (listed only: made elsewhere) |
| `frostmere_pine_island` | skin | Low rocky islands in the lake, crowded with dark pines. Backdrop pieces. [here: prompt] | 1090, 590, 1448, 700 | no |
| `shared_tree_pine` | plant | A tall dark pine (fir), the kind that stands all along the lakeshore and in most fight places. The game's live tree here is a snow-laden pine. [here: prompt] | 240, 465, 340, 660 | yes (made here) |
| `shared_bark_pine` | material | Pine trunks (made by a walking-map pack). | 280, 600, 300, 660 | yes (listed only: made elsewhere) |
| `shared_peaks_ironspire` | sky | The great snow range of the Ironspire Peaks with its tall middle peak, the same range behind the river glade, Eldergrove, the moor, Dawnroost, the crossroads and the dead Moonwell. A wide slice for the far backdrop. [here: backdrop] | 0, 200, 1448, 520 | yes (made here) |
| `shared_mountain_snow_rock` | material | The mountains' surface: grey-violet rock faces and ridges with snow lying in the gullies, for building the far mountains in 3D. The stand-in is cut from the same range in Dawnroost's painting (12-thornhollow-dawnroost-living-node.png, 150, 320, 450, 420), where the snow faces repeat best. [here: stand-in, prompt] | 500, 220, 900, 420 | yes (made here) |
| `shared_snow` | ground | Lying snow (made by a walking-map pack); snow also falls lightly here in the game. | 560, 230, 760, 300 | yes (listed only: made elsewhere) |
| `frostmere_backdrop` | sky | Backdrop slice: sky, moon, the snow range, misty pine slopes and the lake with its islands, down to where the meadow begins. [here: backdrop] | 0, 0, 1448, 712 | no |
| `shared_sky_night` | sky | The night sky (made in river-glade). | 620, 0, 1448, 230 | yes (listed only: made elsewhere) |
| `shared_moon` | sky | The full moon (made in river-glade). | 375, 100, 525, 255 | yes (listed only: made elsewhere) |
