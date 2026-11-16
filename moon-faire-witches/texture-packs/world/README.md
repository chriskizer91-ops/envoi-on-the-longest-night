# World: Aethermoor from the air

The world map the party flies over in the Magpie, as one texture pack: `aethermoor/`. In 3D the flight will go over a
land kilometres across (a height map coloured by terrain textures), so this pack is the continent's **terrain kinds**
rather than one place's surfaces, plus the towns and landmarks as props with where each is on the map.

The painting is the game's night atlas, `reference/art/world-map/night/Aethermoor-Natural-Night-Atlas.webp`
(4608 x 3072, north up). The stand-ins are cut from it. The day atlas (`reference/art/world-map/day/`, same size, lines up)
gives a second reference crop for every row (`refs/<id>-day.jpg`), because night hides what a terrain is. In the prompts,
`aethermoor.png` stands for the whole night atlas.

## What is in it

| place | inventory rows | stand-ins | prompts | props |
|---|---|---|---|---|
| aethermoor | 56 (18 terrain and water, 4 trees, 2 lights, 1 sky, 31 props) | 18 | 22 (12 ground, 6 material, 4 plant) | 31 |

- **Terrain (ground):** pine forest, leafy woodland, willow marsh, grassland, farm fields, sand beach, desert plain,
  sandstone plateau, bare mountain rock, snowy mountainside, snowfield, town rooftops.
- **Water and steep faces (material):** deep sea, shallow coastal water, river, mountain lake, frozen lake, sea cliff.
- **Trees (plant):** pine, leafy oak-kind tree, weeping willow, dead fen tree, for single trees and forest edges.
- **Props:** the game's stops (Wickhollow, Bogmire, Dawnroost, the shipyard, Misthollow), the three camps, the walking
  scenes' spots, the D&D map's kept names (Rotbridge, Willowmurk, the Sunken Ruins, Mosswatch Tower, Eldergrove, Fawnrest
  Shrine, Frostmere Lake, Peak's Veil, Stormwatch), the places under mist (Hearthstone Keep, Dusthaven, Sandspire,
  Miragewell, the Scorchgate Ruins), and the repeating pieces (the stone bridge, waterfalls, sea stacks, the fen
  boardwalks, harbour docks, roads). Each has its position and its band, checked with the game's own `world.js`.
  Mother's Hollow is left out (it belongs to the Drowned Mother's story).

The scripts that made it are in `tools/` (`build.py` for the images, `gen_docs.py` for `prompts.json` and
`inventory.md`, `look.py`, `fine.py` and `try.py` for looking and trying patches).

## Scale

The prompts give real sizes for a view from a ship a few hundred metres up (squares of 50 m for river water up to 600 m
for open sea). For laying the terrain out, a suggested scale is **1 atlas pixel = 10 m**, a continent about 46 km by 31 km.
Today's flight uses 12 pixels a metre (the whole map is 384 m), so the 3D world is a big step up. The painting draws trees
and houses about ten times too big for 10 m a pixel, so the stand-ins show a few big crowns where the real textures will
show many small ones.

## Unsure, or not in the painting

- **The stand-ins are soft.** The atlas has little detail per square (a tree crown is 10 to 20 pixels), so each stand-in is
  a patch of 40 to 200 pixels enlarged to 512. They give the right colour and pattern, not crisp detail.
- **No moor.** The north is forest, meadow and fields; nothing in the painting reads as moor or heath, so there is no moor row.
- **Lake ice is made up.** Frostmere Lake is painted as open water. `lake_ice`'s stand-in is the open lake's stand-in
  recoloured to frosted silver; its prompt is the real one. Whether Frostmere is frozen in 3D is Chris's call.
- **No glacier as such.** The high white basins between the northern peaks are the `snowfield` row.
- **No surf texture.** The white water round rocks and along shores is best made by the builder as foam along the coastline.
- **The camps have no buildings on the map;** their props are just the landing grounds as painted.
- **Willowmurk is under mist** by the game's band outlines (just east of band 1's edge), though the D&D map puts it in the fen.
- **Day and night differ a little** in small details (the night tiles were repainted from the day ones), so a few day crops
  are not an exact match for their night crops.

## Shared ids

None. The shared ids in the brief are surfaces at walking scale (a few metres of cobbles or snow). This pack's squares are
hundreds of metres of land seen from the air, so none of them is the same texture, and none of this pack's terrain repeats
in other places at this scale. Every row and prompt is `shared: false`.
