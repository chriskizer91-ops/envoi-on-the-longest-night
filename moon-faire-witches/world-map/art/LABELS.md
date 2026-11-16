# The 3D map's art: what each file is

Both files are made by `../tools/make-terrain.mjs` from Chris's day atlas of Aethermoor
(`reference/art/world-map/day/Aethermoor-Nine-Region-Atlas.webp`, 4608 x 3072, north up). They are data, not pictures to
show: any game that wants Aethermoor as a 3D land can build it from these two. One pixel = 4 atlas pixels = 40 m.

| File | Size | What it holds |
|---|---|---|
| `aethermoor-terrain-height.png` | 1152 x 768 | How high each spot stands. Height in atlas pixels (1 atlas px = 10 m) = (red x 256 + green) / 10 - 100. Sea level is 0; the sea floor goes down to about -30; the highest peak is about 284 (2,840 m), north-east of Misthollow. |
| `aethermoor-terrain-kinds.png` | 1152 x 768 | What kind of ground each spot is, as the red value: 0 sea, 1 river, 2 lake, 3 pine forest, 4 leafy forest, 5 grass, 6 farmland, 7 fen, 8 beach sand, 9 desert, 10 red mesa rock, 11 grey rock, 12 snow. |

To read a spot at atlas (x, y): the pixel at (floor(x / 4), floor(y / 4)).
