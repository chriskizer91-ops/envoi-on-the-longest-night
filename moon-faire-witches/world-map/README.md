# The 3D map of Aethermoor, and travel between zones

The job from the project document `claude/travel-and-3d-map.md` (Chris's decisions, November 16): whenever the player
travels, on foot or by flight, a 3D map of Aethermoor shows where Io is; for a flight it draws a dotted line from here to
there, then Skies of Aethermoor flies the ship there, and the zone page opens at the landing. Built a demo page at a time:

| Step | Page | State |
|---|---|---|
| 1 | `envoi-map-where.html`: Aethermoor as a 3D model of the land, with Io's pin where she is | Built (November 16; rebuilt as a real 3D land the same day) |
| 2 | Choosing where to go, on foot or by flight, with a dotted line for a flight | Next |
| 3 | The flight in Skies of Aethermoor on the night map, with as many raiders as the flight is long | Waiting on Chris: which ship |
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
- **The model** (`map/map3d.js`): a sheet of 576 x 384 squares lifted to the heights and coloured by kind (the fields a
  patchwork), every steep face turning to bare rock, each small face catching the moon its own way. A flat sea, pale in
  the shallows, dark in the deep, with surf along the shores. About 47,000 small 3D trees where the forests are (pines,
  round leafy trees, paler ones in the fen). Hearthstone Keep on its island (ring wall, towers, keep and spire), and a
  few lit roofs and a tower where each town and landmark is. Night, stars, the moon high in the north-west.
- **The zones** are the game's four level bands (`src/game/world.js`). A zone not reached yet lies under a low, ragged
  mist; so does everything outside the four. Tall ground stands half out of it, and the castle and towers show through.
  A faint line runs where two zones meet; a gold line rings the zone Io is in.
- **Io's pin:** a beam of moonlight with a crescent on top and a ring pulsing on the ground, her name tag over it. Close
  in, the names of her zone's other places (a gold diamond where the Magpie lands) and the other open zones' landings.
- **On the phone:** one finger turns the land and tips the view (drag sideways to turn, up to look low across the land,
  down to look from above). Two fingers pinch to zoom, slide to move, twist to turn. The moon button flies back to Io,
  north up. The page opens on the whole land and flies down to her. "Move Io" (this demo only) puts her in any of the
  21 walking places; its list shows the frame rate and the counts.
- **Size:** 2.0 MB, works offline. 450,000 to 800,000 triangles drawn, depending on how much forest is in view.

### What isn't there yet

- **The places already built in 3D** (the world-3d job's 21 walking places) aren't matched one for one: a walking place is
  about 720 m by 480 m, which at this height is a thumbnail. Each town is a handful of roofs in the right spot.
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

## Files

- `envoi-map-where.html`: step 1's page.
- `map/map3d.js`: the 3D land (the sheet, the sea, the trees, the castle and towns, the mist and zone lines, Io's pin,
  the names, the camera and the fingers).
- `map/places.js`: the zones, the 21 walking places and the 7 landings on the atlas.
- `map/art.js`, `map/map.css`: the data pictures it reads, and the page's look.
- `art/`: the two data pictures and `LABELS.md`, which says what each holds.
- `tools/`: `make-terrain.mjs` (reads the atlas; `--look <folder>` writes pictures to check by eye), `check-places.mjs`,
  `shots.mjs` (stills at a phone's size, from set views), `touch-test.mjs` (the fingers and buttons, as a phone would).

## Build and check

```text
node moon-faire-witches/world-map/tools/make-terrain.mjs          (only if the atlas or the reading changes)
node moon-faire-witches/world-map/tools/check-places.mjs
node tools/build.mjs --offline moon-faire-witches/world-map/envoi-map-where.html
node moon-faire-witches/world-map/tools/shots.mjs dist/envoi-map-where.html <folder> [--size 915x412] [--only a,b]
node moon-faire-witches/world-map/tools/touch-test.mjs dist/envoi-map-where.html
```
