# dead-moonwell: texture pack

The dead Moonwell: the finale, Noctara and Halcyon, in Misthollow's great plaza on the longest night. A wide plaza of big frosted flagstones with rime in the cracks, then the great round Moonwell, dark and dead, its wall carved with moths and crescent moons, steps up on both sides, the ruined gothic towers, arcades and bridges of Misthollow on snowy crags in freezing mist, the snow range, and the moon going out (a dark bite taken from it). No warmth anywhere. The stars come back over the sky at the ending.

Painting: `reference/art/battle-backgrounds/14-ironhold-misthollow-dead-moonwell.png` (1448 x 1086); in the prompts it is called `dead-moonwell.png`.
Boxes are x0, y0, x1, y1 in that painting's pixels. Ground stand-ins are cut from the nearest ground with a strong squash (the painting is side-on), unless the row says they come from a walking map. `backdrop/` holds the far-land slices at full width.

| id | kind | what it is, in plain words | where in the painting | shared? |
|---|---|---|---|---|
| `moonwell_frost_flags` | ground | The plaza's floor: big squarish grey-blue flagstones with thick white frost and rime in the cracks. Seen from above in walk-misthollow-moonwell.png (like shared_flagstones, but frozen). [here: stand-in, prompt] | 0, 700, 1448, 1086 | no |
| `shared_flagstones` | ground | Ordinary flagstones without frost (made by a walking-map pack). | 0, 700, 1448, 1086 | yes (listed only: made elsewhere) |
| `shared_snow` | ground | Snow drifted against the well and the steps (made by a walking-map pack); snow falls in the game. | 560, 670, 900, 700 | yes (listed only: made elsewhere) |
| `moonwell_well` | prop | The dead Moonwell: a great round well about 4 m across, its thick stone wall carved all round with moths and crescent moons, its water gone black and dead, a pillar at each side of its front. | 670, 575, 1100, 700 | no |
| `moonwell_moth_panel` | skin | The carving that runs round the well's wall: a moth with spread wings between two crescent moons, repeated. [here: prompt] | 750, 600, 960, 695 | no |
| `moonwell_steps` | prop | Wide stone steps going up on both sides of the well to the ruins behind, frosted and snow-dusted. | 1080, 590, 1300, 695 | no |
| `moonwell_gothic_tower` | skin | Misthollow's ruined gothic towers: tall stone towers with pointed spires, lancet windows and pinnacles, on the crags behind the well. [here: prompt] | 1210, 305, 1310, 470 | no |
| `moonwell_arcade_bridge` | skin | Ruined stone arcades and bridges on tall pointed arches, linking the crags. [here: prompt] | 200, 445, 380, 525 | no |
| `shared_stone_wall_rough` | material | The ruins' rough stonework (made by a walking-map pack; walk-misthollow-moonwell.png shows Misthollow's walls). | 1150, 520, 1300, 580 | yes (listed only: made elsewhere) |
| `shared_rock_cliff_snowy` | material | The snowy crags the ruins stand on (made by the north pack). | 0, 460, 180, 620 | yes (listed only: made elsewhere) |
| `moonwell_waning_moon` | sky | The moon going out: a full moon with a dark round bite taken out of its upper right side. Only here. [here: prompt] | 355, 100, 505, 250 | no |
| `moonwell_backdrop` | sky | Backdrop slice: sky, the waning moon, snow range, Misthollow's ruins on their crags in the mist, the well and its steps, down to where the plaza begins. The game draws stars over this sky at the end. [here: backdrop] | 0, 0, 1448, 700 | no |
| `shared_sky_night` | sky | The night sky (made in river-glade). | 620, 0, 1448, 230 | yes (listed only: made elsewhere) |
| `shared_peaks_ironspire` | sky | The snow range (made in frostmere). | 0, 220, 1448, 400 | yes (listed only: made elsewhere) |
| `moonwell_no_lights` | light | No warm light at all in this painting: only cold moonlight from the upper left and freezing mist. (The other dead Moonwell picture, art/backdrops/battle-dead-moonwell.avif, has two braziers at the near corners; this one does not.) | 0, 0, 1448, 1086 | no |
