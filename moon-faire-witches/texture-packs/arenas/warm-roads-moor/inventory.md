# warm-roads-moor: texture pack

The Warm Roads' moor: band 2's wild fights, beside the old paved road of the Ember Line. A flat moor of short grass and blooming heather, then a low tumbled drystone wall with gorse and birches, the Ember Line road (the Warm Road) curving away with warm veins glowing between its stones to a carved waymarker, a winding river in the valley, a round watchtower on a crag, pine forest and the snow range. The live 3D ground is short moor grass, heather and gorse; a birch frames the right side.

Painting: `reference/art/battle-backgrounds/11-verdant-wilds-warm-roads-moor.png` (1448 x 1086); in the prompts it is called `warm-roads-moor.png`.
Boxes are x0, y0, x1, y1 in that painting's pixels. Ground stand-ins are cut from the nearest ground with a strong squash (the painting is side-on), unless the row says they come from a walking map. `backdrop/` holds the far-land slices at full width.

| id | kind | what it is, in plain words | where in the painting | shared? |
|---|---|---|---|---|
| `moor_heather_grass` | ground | The moor's floor: short olive moor grass with patches of purple heather in bloom and a few tiny white flowers. Seen from above in wilds/walk-ember-line-road.png and wilds/walk-warm-roads-camp.png. [here: stand-in, prompt] | 0, 712, 1448, 1086 | no |
| `shared_warm_road` | ground | The Ember Line: an old road of worn grey paving stones with thin warm ember veins glowing in the joints, curving away to the waymarker (made by the wilds-south pack as the Warm Road; seen from above in wilds/walk-ember-line-road.png). | 900, 580, 1260, 715 | yes (listed only: made elsewhere) |
| `shared_bark_birch` | material | The birches' white bark (made by the wilds-south pack). | 205, 470, 225, 600 | yes (listed only: made elsewhere) |
| `shared_drystone` | material | The low tumbled drystone field wall behind the moor, half fallen, with gorse along it (made by a walking-map pack: wilds/walk-ember-line-road.png has many). In this painting it is too small to cut a texture from. | 160, 590, 700, 690 | yes (listed only: made elsewhere) |
| `moor_heather_tuft` | plant | A low clump of purple heather in bloom. [here: prompt] | 1220, 915, 1400, 1000 | no |
| `moor_gorse_bush` | plant | A gorse bush with yellow flowers, along the drystone wall. [here: prompt] | 250, 570, 400, 640 | no |
| `moor_birch` | plant | A slim silver birch with a light, airy crown. The game's live tree on the right of this fight is a birch. [here: prompt] | 150, 390, 290, 630 | no |
| `shared_tree_pine` | plant | The pine forest down the valley (made in frostmere). | 560, 480, 640, 600 | yes (listed only: made elsewhere) |
| `moor_waymarker` | skin | A tall carved standing stone by the road with a round ember sigil set in it, on a base of fallen stones: the Ember Line's waymarker (it pulses faintly in the game). [here: prompt] | 1225, 505, 1300, 615 | no |
| `moor_waymarker_prop` | prop | The waymarker as a 3D object: the tall stone, its base and the fallen stones round it. | 1210, 505, 1320, 625 | no |
| `moor_boulders` | prop | Grey mossy boulders and scattered stones on the moor near the road, with heather round them. | 1040, 610, 1448, 715 | no |
| `moor_watchtower` | skin | A round ruined stone watchtower with a battlement top and two lit windows, on a rocky pine-covered crag in the distance. A backdrop piece. [here: prompt] | 995, 355, 1065, 425 | no |
| `shared_water_river` | material | The winding river down in the valley (made by a walking-map pack). | 500, 470, 900, 560 | yes (listed only: made elsewhere) |
| `moor_ember_veins` | light | Warm light: the ember veins in the road and the waymarker's sigil (the game pulses them), and the tower's two windows far off. | 840, 489, 1390, 738 | no |
| `moor_backdrop` | sky | Backdrop slice: sky, moon, snow range, the river valley with pine forest, the watchtower crag, birches, gorse, the wall and the road, down to where the moor begins. [here: backdrop] | 0, 0, 1448, 712 | no |
| `shared_sky_night` | sky | The night sky (made in river-glade). | 620, 0, 1448, 230 | yes (listed only: made elsewhere) |
| `shared_moon` | sky | The full moon (made in river-glade). | 375, 100, 530, 255 | yes (listed only: made elsewhere) |
| `shared_peaks_ironspire` | sky | The snow range (made in frostmere). | 0, 220, 1448, 400 | yes (listed only: made elsewhere) |
