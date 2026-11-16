# river-glade: texture pack

Wickhollow's river glade: band 1's wild fights in the Gloamwood. A flat glade of short dark grass and clover runs to a misty wall of old oaks and pines; beyond them the river bends past the little chapel and lit cottages of Wickhollow, under wooded purple hills, the great snow range and the full moon. The live 3D ground in front is the glade's own grass and clover, with an old oak framing the right side. The night sky, the moon and the oak are the same in other fight places, so their shared textures are made here.

Painting: `reference/art/battle-backgrounds/01-woodland-wickhollow-river-glade.png` (1448 x 1086); in the prompts it is called `river-glade.png`.
Boxes are x0, y0, x1, y1 in that painting's pixels. Ground stand-ins are cut from the nearest ground with a strong squash (the painting is side-on), unless the row says they come from a walking map. `backdrop/` holds the far-land slices at full width.

| id | kind | what it is, in plain words | where in the painting | shared? |
|---|---|---|---|---|
| `riverglade_clover_grass` | ground | The glade's floor: short dusky moss-green grass with clover leaves and a few tiny white flowers. The same kind of grass is seen from above in walk-wickhollow-cottage.png and walk-thornwood.png (like shared_grass_meadow, but darker and full of clover). [here: stand-in, prompt] | 0, 705, 1448, 1086 | no |
| `riverglade_moonpetal_tuft` | plant | A clump of small white moonpetal flowers on thin stems, at the glade's edges. [here: prompt] | 0, 930, 130, 1010 | no |
| `riverglade_lavender_tuft` | plant | A clump of small lavender-purple wildflowers, near the right edge of the glade. [here: prompt] | 1290, 900, 1448, 1000 | no |
| `shared_tree_oak` | plant | A big old broad oak, dark green crown and thick grey trunk, at the left of the wood's edge. The game's live tree on the right of this fight is an oak too. [here: prompt] | 110, 320, 430, 705 | yes (made here) |
| `shared_tree_pine` | plant | Dark pines mixed in with the oaks along the wood's edge (made in frostmere). | 1360, 520, 1448, 680 | yes (listed only: made elsewhere) |
| `shared_bark_oak` | material | The oaks' trunks (made by a walking-map pack). | 200, 560, 300, 700 | yes (listed only: made elsewhere) |
| `riverglade_chapel_village` | skin | Far off on the right: Wickhollow's small stone chapel with its spire on a knoll above the river, and a few half-timbered cottages with lit windows. A backdrop piece, not to walk to. [here: prompt] | 1090, 470, 1400, 600 | no |
| `riverglade_jetty` | prop | The old wooden jetty on the far bank with two small lanterns on posts. Far off; model it small or leave it in the backdrop. | 1120, 650, 1275, 705 | no |
| `shared_water_river` | material | The river, a dark still sliver on the far right with lamplight reflected in it (made by a walking-map pack; see walk-wickhollow-jetty.png). | 1110, 620, 1448, 705 | yes (listed only: made elsewhere) |
| `riverglade_village_lights` | light | The only warm light: the chapel windows, the cottage windows and the jetty lanterns, far off on the right. Everything else is moonlight from the upper left. | 1090, 500, 1448, 700 | no |
| `riverglade_backdrop` | sky | Backdrop slice: sky, moon, snow range, wooded purple hills, the misty wood's edge and the far village, down to where the glade begins. [here: backdrop] | 0, 0, 1448, 705 | no |
| `shared_sky_night` | sky | The starless plum-indigo night sky with thin silver-lavender cloud wisps, the same in every fight painting. The stand-in is cut from Eldergrove's painting (0, 40, 330, 260), which has the most even wisps. [here: stand-in, prompt] | 0, 40, 350, 280 | yes (made here) |
| `shared_moon` | sky | The bright near-full moon with its soft bloom, top left of every fight painting. [here: prompt] | 370, 95, 540, 265 | yes (made here) |
| `shared_peaks_ironspire` | sky | The great snow range with its tall middle peak (made in frostmere, where it shows biggest). | 0, 210, 1448, 420 | yes (listed only: made elsewhere) |
