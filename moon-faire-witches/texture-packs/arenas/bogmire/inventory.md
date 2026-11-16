# bogmire: texture pack

Bogmire's lantern banks: gate 5, the great wraith, at Bogmire's dark heart. In the painting a grassy bank lies in front of a thick belt of reeds, then black fen water with drowned snags, a long boardwalk on stilts with lamp posts, and Bogmire's stilt houses and a timber tower; weeping willows on both sides, misty wooded hills behind. In the game the bank is covered by live black water and the fight is on a boardwalk deck on stilts, so the water, the planks and the reeds matter most.

Painting: `reference/art/battle-backgrounds/03-gloomfen-bogmire-lantern-banks.png` (1448 x 1086); in the prompts it is called `bogmire.png`.
Boxes are x0, y0, x1, y1 in that painting's pixels. Ground stand-ins are cut from the nearest ground with a strong squash (the painting is side-on), unless the row says they come from a walking map. `backdrop/` holds the far-land slices at full width.

| id | kind | what it is, in plain words | where in the painting | shared? |
|---|---|---|---|---|
| `bogmire_bank_grass` | ground | The painting's grassy bank: dark grass, clover and small white flowers. In the game it is covered by water; keep it for the banks round the water. Wet grass round Bogmire is seen from above in walk-bogmire.png. [here: stand-in, prompt] | 0, 705, 1448, 1086 | no |
| `shared_water_dark` | material | The fen's still black water with lamplight trails on it (made by the Bogmire walking-map pack; seen from above in walk-bogmire-heart.png). In the game it is live water that mirrors the painting. | 680, 520, 1300, 600 | yes (listed only: made elsewhere) |
| `shared_boardwalk_planks` | ground | The boardwalk on stilts: the far one in the painting, and the fight's own deck in the game (made by the Bogmire walking-map pack; seen from above in walk-bogmire-heart.png). | 820, 495, 1300, 545 | yes (listed only: made elsewhere) |
| `bogmire_boardwalk` | prop | The long boardwalk on stilts with a rail and lamp posts, running across the water to the houses. The fight's deck (a square on stilts and a walk out to it) is built the same way. | 800, 490, 1320, 560 | no |
| `bogmire_lantern_post` | prop | A lantern on a wooden post, as on the far boardwalk; two burn low at the deck's near corners in the game. | 1110, 470, 1150, 520 | no |
| `bogmire_reeds` | plant | The thick belt of reeds and rushes with pale feathery plumes, along the water's edge. The game grows live reeds along the water's edges. [here: prompt] | 0, 560, 1448, 700 | no |
| `bogmire_willow` | plant | A weeping willow with long hanging curtains of leaves, dark and misty, on both sides of the fen. [here: prompt] | 0, 330, 270, 600 | no |
| `bogmire_dead_snag` | plant | A drowned dead tree stump standing up out of the water, broken off at the top. [here: prompt] | 1035, 470, 1090, 585 | no |
| `bogmire_stilt_hall` | skin | Bogmire's big stilt hall: a tall timber house with steep gables and lit windows, and a timber lookout tower beside it, on piles over the water. Smaller stilt houses stand to its left. A backdrop piece. [here: prompt] | 1130, 340, 1350, 500 | no |
| `shared_planks_wall` | material | The houses' weathered plank walls (made by a walking-map pack). | 1160, 420, 1240, 480 | yes (listed only: made elsewhere) |
| `shared_roof_shingle` | material | The houses' dark wooden shingle roofs (made by a walking-map pack). | 1170, 380, 1260, 420 | yes (listed only: made elsewhere) |
| `bogmire_town_lights` | light | Warm light: the houses' windows, the boardwalk lamps and their trails on the water. In the game they are dark while the great wraith holds the stolen lamplight, and light again as it flies home. | 608, 304, 1448, 695 | no |
| `bogmire_backdrop` | sky | Backdrop slice: sky, moon, misty wooded hills and crags (no snow range here), willows, water, boardwalk and town, down to the near reeds. [here: backdrop] | 0, 0, 1448, 705 | no |
| `shared_sky_night` | sky | The night sky (made in river-glade). | 620, 0, 1448, 230 | yes (listed only: made elsewhere) |
| `shared_moon` | sky | The full moon (made in river-glade). | 375, 100, 530, 255 | yes (listed only: made elsewhere) |
