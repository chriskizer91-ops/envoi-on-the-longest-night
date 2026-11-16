# The 3D map of Aethermoor, and travel between zones

The job from the project document `claude/travel-and-3d-map.md` (Chris's decisions, November 16): whenever the player
travels, on foot or by flight, a 3D map of Aethermoor shows where Io is; for a flight it draws a dotted line from here to
there, then Skies of Aethermoor flies the ship there, and the zone page opens at the landing. Built a demo page at a time:

| Step | Page | State |
|---|---|---|
| 1 | `envoi-map-where.html`: the 3D map from the night atlas, with Io's pin where she is | Built (November 16) |
| 2 | Choosing where to go, on foot or by flight, with a dotted line for a flight | Next |
| 3 | The flight in Skies of Aethermoor on the night map, with as many raiders as the flight is long | Waiting on Chris: which ship |
| 4 | Landing, back into the zone page at that landing | Later |

## Step 1: where Io is

- **The land:** Chris's night atlas (4608 x 3072, north up) in four quarters, laid over a height map read off the day atlas
  (they line up): water is low, the land rises from its shores, and the painted rock and snow stand up as mountains, highest
  round Peak's Veil, Frostmere and Misthollow (about 1,600 m at 1 atlas pixel = 10 m, lifted 1.15 times to read from above).
  The edges fade into open sea; the sky is night, with stars and the moon high in the north-west.
- **The zones** are the game's four level bands (`src/game/world.js`, World.BANDS). A zone the party hasn't reached lies under
  a slow drifting mist, as on the 2D game's flying map, and so does everything outside the four (the inland sea's island, the
  east, the south-east) all game. A faint line runs where two zones meet; a gold line rings the zone Io is in.
- **Io's pin:** a beam of moonlight with a crescent on top and a ring pulsing on the ground, her name tag over it ("Io",
  and the place). Close in, the names of her zone's other places show (a gold diamond where the Magpie lands), and the
  landings of the other open zones. Names that would overlap give way, Io's first.
- **On the phone:** one finger drags the map, two pinch to zoom and twist to turn; the closer in, the lower the view tilts.
  The moon button (bottom right) flies back to Io, north up. The page opens on the whole of Aethermoor and flies down to her.
  At the top, the place she's in and its zone. "Move Io" (this demo only) puts her in any of the 21 walking places; the
  zones past hers go under mist. Its list shows the frame rate and the counts.
- **Size:** 3.9 MB, works offline. About 200,000 triangles for the whole map (100,000 to 150,000 in view close in), 9 to
  11 draw calls.

### Where the walking places sit on the atlas

The places weren't on the atlas yet, so these are proposals for Chris to confirm (`map/places.js`, with why for each):
the old world map's spots where Envoi had them (`src/game/game.js`, OLD_WORLD), the Magpie's docks (LANDINGS), the towns
in the painting (`texture-packs/world/aethermoor/inventory.md`), and for the rest, the way each place's exits lead on foot
(`src/game/maps.js`). Each walking painting covers 72 x 48 atlas pixels round its spot, so Io's spot in her painting moves
her pin a little within it. `tools/check-places.mjs` checks every place is on land, in its own zone, and lists where its
exits lead on foot against the way they lie on the map: all agree within an eighth of a turn except **the jetty**, which
is west of Wickhollow on foot but the Magpie's dock, east of it, on the atlas (kept at the dock, where the flights land).

## For the zone pages (the world-3d job's travel hook)

```js
const map = WorldMap.create(hostElement, { art: MAP_ART, open: [1, 2], io: { place: 'thornwood', spot: [760, 512] } });
await map.ready;            // the map is drawn, Io's pin in place
map.findIo();               // fly to her (a promise)
map.setIo(place, spot, fly) // move her pin (spot: [x, y] in her walking painting's 1536 x 1024 pixels, or null)
map.setOpen([1, 2, 3])      // the zones reached; the rest lie under mist
```

It needs three.js r128, `src/game/world.js`, `map/places.js`, `map/art.js` and `map/map3d.js` (and `map/map.css`).

## Files

- `envoi-map-where.html`: step 1's page.
- `map/map3d.js`: the 3D map (the land, the mist and zone lines, Io's pin, the names, the camera and the fingers).
- `map/places.js`: the zones, the 21 walking places and the 7 landings on the atlas.
- `map/art.js`, `map/map.css`: the pictures it reads, and the page's look.
- `art/`: made by `tools/make-map-art.mjs` from `reference/art/world-map/`: `night-1..4.avif` (the night atlas in four
  2304 x 1536 quarters, 2.1 MB in all), `height.png` (576 x 384, the height in tenths of an atlas pixel as red * 256 +
  green) and `land.png` (land white, water black, for the checks).
- `tools/`: `make-map-art.mjs` (the pictures; `--tiles` makes the quarters again), `check-places.mjs`, `shots.mjs`
  (stills at a phone's size), `touch-test.mjs` (the fingers and buttons, as a phone would use them).

## Build and check

```text
node moon-faire-witches/world-map/tools/make-map-art.mjs          (only if the atlases change)
node moon-faire-witches/world-map/tools/check-places.mjs
node tools/build.mjs --offline moon-faire-witches/world-map/envoi-map-where.html
node moon-faire-witches/world-map/tools/shots.mjs dist/envoi-map-where.html <folder> [--size 915x412]
node moon-faire-witches/world-map/tools/touch-test.mjs dist/envoi-map-where.html
```
