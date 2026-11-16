# crossroads: texture pack

The northern crossroads: gate 15, Halcyon's ambush, on the old road north. A flat cold moor of frosted dead grass, then the crossroads itself: a ring of old paving round a carved star, broken standing stones, a toppled carved stone with an ember glow, and a stone well with a lantern hung from a gallows post; frosted rocky slopes with pines, a winding path, sea cliffs and the moonlit sea on the right, the snow range behind. The live 3D ground is the frosted dead grass and moss; a dead tree frames the right side.

Painting: `reference/art/battle-backgrounds/13-northern-crossroads.png` (1448 x 1086); in the prompts it is called `crossroads.png`.
Boxes are x0, y0, x1, y1 in that painting's pixels. Ground stand-ins are cut from the nearest ground with a strong squash (the painting is side-on), unless the row says they come from a walking map. `backdrop/` holds the far-land slices at full width.

| id | kind | what it is, in plain words | where in the painting | shared? |
|---|---|---|---|---|
| `crossroads_frost_moor` | ground | The cold moor's floor: pale straw-coloured dead grass and moss, heavily frosted. Seen from above in walk-northern-crossroads.png and wilds/walk-cold-moor.png (shared_grass_frosted). [here: stand-in, prompt] | 0, 705, 1448, 1086 | no |
| `shared_grass_frosted` | ground | Frosted grass in general (made by a walking-map pack). | 0, 705, 1448, 1086 | yes (listed only: made elsewhere) |
| `crossroads_road_stones` | ground | The crossroads' old paving: worn square stones in a ring round a carved star, with dead grass in the gaps. Far off and slanted in the painting; the stand-in is cut from walk-northern-crossroads.png (705, 860, 825, 980), where the road shows from above. [here: stand-in, prompt] | 560, 600, 900, 700 | no |
| `crossroads_compass_ring` | prop | The paved ring in the middle of the crossroads with a carved star (compass) at its centre, best seen from above in walk-northern-crossroads.png. Build it as a flat disc of paving. | 640, 610, 860, 690 | no |
| `crossroads_standing_stone` | skin | Broken standing stones round the ring: tall rough pillars of grey stone, lichen and frost on them. [here: prompt] | 465, 535, 510, 640 | no |
| `crossroads_fallen_stone` | prop | A toppled carved stone block lying on its side, with a small warm ember glow in a carved panel. | 470, 610, 570, 665 | no |
| `crossroads_well` | skin | The crossroads well: a round stone well with a lantern hung from a wooden gallows post beside it. [here: prompt] | 1060, 560, 1135, 650 | no |
| `crossroads_well_prop` | prop | The well as a 3D object: the round stone wall, the gallows post and the hanging lantern. | 1050, 550, 1150, 660 | no |
| `crossroads_bare_bush` | plant | Leafless bushes with thin bare twigs, frosted, on the left slope. The game's live framing tree here is a dead tree. [here: prompt] | 0, 490, 150, 650 | no |
| `shared_tree_pine` | plant | The pines on the slopes (made in frostmere). | 150, 320, 230, 500 | yes (listed only: made elsewhere) |
| `shared_rock_cliff` | material | The rock faces: grey sea cliffs on the right and rock outcrops on the slopes, with frost and snow on the ledges. Seen side-on here, which shows a cliff face best; the face is small and far, so the stand-in (1325, 445, 1440, 505) is soft. [here: stand-in, prompt] | 1310, 420, 1448, 560 | yes (made here) |
| `shared_rock_cliff_snowy` | material | Where the rocks carry more snow, the north pack's snowy cliff (it covers the crossroads' corners in the walking map). | 1310, 420, 1448, 560 | yes (listed only: made elsewhere) |
| `crossroads_far_sea` | sky | The moonlit sea far off on the right, with small rocky islands. Part of the backdrop. | 1000, 400, 1330, 500 | no |
| `crossroads_lantern` | light | Warm light: the well's lantern, and the faint ember glow of the fallen stone. Everything else is cold moonlight. | 1090, 570, 1120, 600 | no |
| `crossroads_backdrop` | sky | Backdrop slice: sky, moon, snow range, the sea and its cliffs, the frosted slopes with pines, the stones and the well, down to where the moor begins. [here: backdrop] | 0, 0, 1448, 705 | no |
| `shared_sky_night` | sky | The night sky (made in river-glade). | 620, 0, 1448, 230 | yes (listed only: made elsewhere) |
| `shared_moon` | sky | The full moon (made in river-glade). | 380, 105, 520, 245 | yes (listed only: made elsewhere) |
| `shared_peaks_ironspire` | sky | The snow range (made in frostmere). | 0, 225, 1200, 400 | yes (listed only: made elsewhere) |
