# The 3D map of Aethermoor, and travel between zones

The job from the project document `claude/travel-and-3d-map.md` (Chris's decisions, November 16): whenever the player
travels, on foot or by flight, a 3D map of Aethermoor shows where Io is; for a flight it draws a dotted line from here to
there, then Skies of Aethermoor flies the ship there, and the zone page opens at the landing. Built a demo page at a time:

| Step | Page | State |
|---|---|---|
| 1 | `envoi-map-where.html`: Aethermoor as a 3D model of the land, with Io's pin where she is | Built (November 16; rebuilt as a real 3D land the same day) |
| 2 | Choosing where to go, on foot or by flight, with a dotted line for a flight | Next |
| 3 | The flight in Skies of Aethermoor on the night map, with as many raiders as the flight is long. Chris (November 16): you fly Skies' four ships; upgrading to the next ship is part of each gate between zones | After step 2 |
| 4 | Landing, back into the zone page at that landing | Later |

## Step 1: the land in 3D, and where Io is

Chris (November 16, 15:22): not the painting printed onto a shape. Look at the map and make a 3D representation of the
world, cruder because it is drawn in 3D, with the elevation inferred from the picture, that can be turned and looked
round. A terrain map: from this height you'd barely see a town; you might see the castle.

So nothing of the painting is on the model. `tools/make-terrain.mjs` reads the day atlas once and writes two small data
pictures (`art/`, labelled in `art/LABELS.md`): what kind of ground each spot is, and how high it stands.

- **How the kinds are read:** by colour, with what's round each spot settling the doubtful ones. Water, then pine forest
  (dark, bluer green), leafy forest and grass (yellower green), farmland (gold patches among green), the fen (green cut
  by many channels, in the south), beach, desert floor and red mesas (the east), grey rock and snow (the mountains).
  Under each town the painted roofs and walls count as grass, so a town isn't read as rock or water.
- **How the height is inferred** (the painting has none in it): the sea is low and deepens away from shore; land rises
  from its shores and swells inland; painted grey rock outside the mountains lifts the land into crags and cliff steps;
  where the painting has mountains the land rises into ridged peaks, highest under the snow, climbing over the first
  mile and a half from the sea; the east's red rock stands as flat-topped mesas in two cliff steps; the fen is flat;
  rivers run in their valleys down to sea level; lakes lie flat. The highest point is about 2,840 m, north-east of
  Misthollow. In the model heights are lifted 1.25 times so the land reads from above.
- **The model** (`map/map3d.js`): a sheet of squares lifted to the heights, every steep face turning to cliff, each
  small face catching the moon its own way. A flat sea, pale in
  the shallows, dark in the deep, with surf along the shores. About 47,000 small 3D trees where the forests are (pines,
  round leafy trees, paler ones in the fen). Hearthstone Keep on its island (ring wall, towers, keep and spire), and a
  few lit roofs and a tower where each town and landmark is. Night, stars, the moon high in the north-west.
- **The ground wears Chris's own textures** (November 16, evening): the world-map textures he made (pine forest,
  leafy forest, grassland, farmland, fen, sand, desert, mesa, rock, cliff, snow, river, sea, lake), each repeating on
  its own kind of ground, so the land is sharp at any zoom. Kinds meet in a ragged line. No picture is laid over the
  whole land.
- **Each zone looks like itself.** Grass, woods and fields change with the zone, from the zones' own cards: zone 2's
  flowered grass; zone 3's frosted heather, frosted firs and bracken; zone 4's frost meadow and snow-laden firs. The
  trees change with them. On top of that each region is tinted and hazed from its walking places' own settings in the
  3D world (`map/moods.js`: leaf tints, fog, moonlight), so the fen's heart is dark and the Thornwood a little violet.
- **Real trees as you zoom in** (November 16, night): eight of Chris's tree models from his Field & Forest · Forest
  Builder (`art/trees/`: spruce, ponderosa pine, bur oak, cottonwood, aspen, weeping willow, mesquite, dead snag).
  Far off, a tree is its simple shape. Closer than 13 km (20 km on a laptop) the trees nearest the eye become his
  light models; closer than 3.6 km (5.6 km) the very nearest become his detailed ones. Between the two (Chris,
  November 17) stand **middle models**, made from his detailed ones at about a quarter of the triangles
  (`tools/make-tree-mids.mjs`), and drawn from three times as far off as the detailed ones (3.5 times on a laptop):
  closer than 10.8 km (19.6 km). If the frames come slowly with models on the screen, fewer trees are drawn as models. They are the same trees in the
  same places, each kind where it belongs (willows in the fen, cottonwoods by water, spruce in the cold zones, mesquite
  in the desert), tinted to the colours their simple shapes have, so zone 3's are frosted and zone 4's under snow.
  The view now comes as close as 550 m.
- **The water** (November 17): the sea is one flat sheet wearing Chris's two sea textures, drifting (the shallow one by
  the shores, the deep one beyond, laid twice at two sizes so its repeat shows less), the sea bed pale through the
  shallowest water, a line of foam on the shore and two more rolling in. All water tilts its face in small crossing
  ripples, takes the sky's sheen at a low angle, and carries the moon's path of light. Rivers and lakes are drawn to
  smooth, slightly ragged banks (not in squares), with a damp dark edge; in zone 4 they are frozen (`shared_lake_ice`).
- **The mountains** (November 17): the height reader now wears the mountain country with rain (140,000 drops, each
  cutting where it runs steep and dropping what it carries where it slows), which gives gullies, sharp ridges and fans;
  the ridges are bent so they don't run straight. On the model, mountain ground is bare rock banded as it rises, snow
  where it is high and not too steep (and wherever the painting has snow), rock with snow in its hollows between.
- **Moon shadows** (November 17): worked out once from the land's shape: hills and peaks throw shadows away from the
  moon (across the land, the sea, the trees and the buildings), and valleys and gullies lie in shade.
- **The buildings are the 3D game's** (November 17): the 86 buildings of the nine walking places that have any
  (`map/buildings.js`, read from the world-3d job's places by `tools/make-buildings.mjs`) stand in their true
  arrangement: each with its own footprint, storeys of wall, ridged roof or lean-to, chimneys, belfry and lit windows,
  wearing the game's own wall and roof textures (13, all Chris's). Bogmire's stand on stilts. Like the trees they are
  drawn several times life size (a town is about 460 m across on the map, 61 m in the game). The castle and the towns
  no walking place covers are built the same way in the same textures. Trees keep clear of each town.
- **Two levels of detail,** chosen by the page (a big screen with a mouse gets the laptop's; `?detail=phone` or
  `?detail=laptop` sets it; the "Move Io" list has the switch):

  | | Phone | Laptop |
  |---|---|---|
  | The land's squares | 576 x 384 | 1152 x 768 |
  | Trees | 47,900, plain shapes | 96,100; fuller shapes near, plain far off |
  | Ground textures | 256 px each | 512 px each |
  | Tree models, zoomed in | 56 detailed, 400 middle, 700 light | 150 detailed, 1,600 middle, 3,200 light |
  | Triangles drawn | 0.4 to 1.6 million | 1.8 to 6.0 million |

- **The zones** are the game's four level bands (`src/game/world.js`). A zone not reached yet lies under a low, ragged
  mist; so does everything outside the four. Tall ground stands half out of it, and the castle and towers show through.
  A faint line runs where two zones meet; a gold line rings the zone Io is in.
- **Io's pin:** a beam of moonlight with a crescent on top and a ring pulsing on the ground, her name tag over it. Close
  in, the names of her zone's other places (a gold diamond where the Magpie lands) and the other open zones' landings.
- **On the phone:** one finger turns the land and tips the view (drag sideways to turn, up to look low across the land,
  down to look from above). Two fingers pinch to zoom, slide to move, twist to turn. The moon button flies back to Io,
  north up. The page opens on the whole land and flies down to her. "Move Io" (this demo only) puts her in any of the
  21 walking places; its list shows the frame rate and the counts.
- **Size:** 5.8 MB, works offline (one file for both levels).

### What isn't there yet

- Of the places already built in 3D, only their **buildings** are on the map: not their walls, wells, bridges, jetties,
  lamps, paving or people.
- No beaches to speak of (the reader keeps only low, pale ground by the water as sand, and little passes), no roads, no
  bridges (the long stone bridge to the shipyard, Rotbridge), no waterfalls.

### Where the walking places sit on the atlas

Proposals for Chris to confirm (`map/places.js`, with why for each): the old world map's spots where Envoi had them
(`src/game/game.js`, OLD_WORLD), the Magpie's docks (LANDINGS), the towns in the painting
(`texture-packs/world/aethermoor/inventory.md`), and for the rest, the way each place's exits lead on foot
(`src/game/maps.js`). `tools/check-places.mjs` checks every place is on land (or at the water's edge), in its own zone,
and prints the ground it stands on and where its exits lead: all agree within an eighth of a turn except **the jetty**,
which is west of Wickhollow on foot but the Magpie's dock, east of it, on the atlas (kept at the dock, where flights land).

## For the zone pages (the world-3d job's travel hook)

```js
const map = WorldMap.create(hostElement, { art: MAP_ART, open: [1, 2], io: { place: 'thornwood', spot: [760, 512] } });
await map.ready;            // the land is built, Io's pin in place
map.findIo();               // fly to her (a promise)
map.setIo(place, spot, fly) // move her pin (spot: [x, y] in her walking painting's 1536 x 1024 pixels, or null)
map.setOpen([1, 2, 3])      // the zones reached; the rest lie under mist
map.heightAt(x, y)          // the land's height at an atlas spot (for the flight's ground, later)
```

It needs three.js r128, `src/game/world.js`, `map/places.js`, `map/art.js` and `map/map3d.js` (and `map/map.css`).

## Art requests

`art-requests/world-map-round-1.md`: four textures worth generating for the sea and the mountains, with prompts.

## Files

- `envoi-map-where.html`: step 1's page.
- `map/map3d.js`: the 3D land (the sheet, the sea, the trees, the castle and towns, the mist and zone lines, Io's pin,
  the names, the camera and the fingers).
- `map/places.js`: the zones, the 21 walking places and the 7 landings on the atlas.
- `map/art.js`, `map/map.css`: the art it reads, and the page's look.
- `map/moods.js`: each walking place's atmosphere (made by `tools/make-moods.mjs`, not by hand).
- `map/buildings.js`: the walking places' buildings (made by `tools/make-buildings.mjs`, not by hand).
- `map/tree-models.js`: the eight tree models, packed (made by `tools/make-tree-models.mjs`, not by hand).
- `art/`: the two data pictures, the ground textures in one picture, the tree models (`trees/`), and `LABELS.md`,
  which says what each holds.
- `tools/`: `make-terrain.mjs` (reads the atlas; `--look <folder>` writes pictures to check by eye),
  `make-ground-layers.mjs` (packs the made textures), `make-moods.mjs` (reads the places' atmospheres),
  `make-buildings.mjs` (reads the 3D game's buildings and packs their textures),
  `make-tree-mids.mjs` (makes the middle tree models), `make-tree-models.mjs` (packs the tree models),
  `tree-lineup.html` (a check page: every tree at its three levels), `check-places.mjs`,
  `shots.mjs` (stills at a phone's size, from set views), `touch-test.mjs` (the fingers and buttons, as a phone would).

## Build and check

```text
node moon-faire-witches/world-map/tools/make-terrain.mjs          (only if the atlas or the reading changes)
node moon-faire-witches/world-map/tools/make-ground-layers.mjs    (when Chris remakes a texture; reads texture-packs/made/)
node moon-faire-witches/world-map/tools/make-moods.mjs            (when the 3D world's places change their tints or fog)
node moon-faire-witches/world-map/tools/make-buildings.mjs        (when the 3D world's places change their buildings)
node moon-faire-witches/world-map/tools/make-tree-mids.mjs        (when a detailed tree model changes; then the next line)
node moon-faire-witches/world-map/tools/make-tree-models.mjs      (when a tree model in art/trees/ changes)
node moon-faire-witches/world-map/tools/check-places.mjs
node tools/build.mjs --offline moon-faire-witches/world-map/envoi-map-where.html
node moon-faire-witches/world-map/tools/shots.mjs dist/envoi-map-where.html <folder> [--size 915x412] [--detail laptop] [--only a,b]
node moon-faire-witches/world-map/tools/touch-test.mjs dist/envoi-map-where.html
```
