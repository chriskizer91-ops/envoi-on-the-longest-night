# The 3D game: the zone pages

The first piece of the whole 3D game (November 16, 2026). The game is this folder. Envoi is cut into four **zones**, each a
big section of the world whose places join on foot. Each zone is one page: Io walks from one 3D place to the next through
their exits, and the next place loads while the screen fades to the night with its name. Only one place is in the phone's
memory at a time. Later, the Magpie flies her between zones (the airship game, through the air-travel hook below).

## The zones

The game's four level bands, as Chris confirmed them. A zone page has whichever of its places are built in 3D so far. A
road to a place that isn't built yet just shows its name, as the single-place pages do.

| Zone | Page | Its places (in 3D now in **bold**) | Starts at |
|---|---|---|---|
| 1 Wickhollow and the fen | `zone-1.html` | **wickhollow**, **cottage**, **jetty**, **thornwood**, **bogmire**, **bogmire-heart** | Wickhollow's landing, on the jetty |
| 2 The Warm Roads | `zone-2.html` | warm-roads-camp, ember-line-road, dawnroost-road, **dawnroost**, **dawnroost-node** | the Warm Roads camp (Dawnroost's dock until the camp is built) |
| 3 The northern wilds | `zone-3.html` | northern-camp, eldergrove-edge, cold-moor, crossroads, **shipyard** | the northern camp (the shipyard's slip until the camp is built) |
| 4 The northeast peaks | `zone-4.html` | frozen-camp, frostmere-shore, frozen-pass, **misthollow**, **moonwell** | the frozen camp (Misthollow until a landing's place is built) |

Built sizes (November 16, offline, everything inside): zone 1 21.7 MB, zone 2 17.3 MB, zone 3 13.1 MB, zone 4 15.9 MB.

## Make and build

```
node moon-faire-witches/world3d/tools/make-zones.mjs                                # the four pages, from zones.js
node tools/build.mjs --offline moon-faire-witches/world3d/game/zone-1.html            # dist/zone-1.html (and 2, 3, 4)
node moon-faire-witches/world3d/tools/zone-test.mjs dist/zone-1.html --out <dir>      # the check (below)
```

Run `make-zones.mjs` again **whenever a place is added** (a helper's new `places/<id>.js`) or the zones are regrouped,
then build. It writes each `zone-<n>.html` with the scripts of the places that exist, and `zone-<n>-art.js`, the list of
the texture pictures those places use. (The places name their textures from `world3d/`, one folder up from here, so the
build couldn't find them from a page in `game/`: the list names them from here, and the build puts them inside the file.)
Don't edit those generated files by hand.

## On the phone

The same as the place pages: drag on the left half to walk (push far to jog), on the right half to look, and the one
button shows the painting from above. Walk on into the end of a road and keep going for a moment (a third of a second,
heading out), and she goes: so brushing past a road's end doesn't take her anywhere. The screen fades to the night with
the next place's name, and she arrives where the 2D game puts her, facing into the new place, the camera behind her.
Where a wild place's 3D moved its road out to the edge of its open ground (the Thornwood's), she arrives by that road.

Walking up to the Magpie where she's moored (a soft violet glow at each landing), or into a road out to the wide world
(the cottage's three, the crossroads' two), shows a small card: "The Magpie: flying comes next".

What carries between places and visits: the keepsakes found, and where Io is. Reopening the page puts her back. In the
guide view only, a small **Start again** (tap it twice) puts her back at the zone's landing and puts this zone's keepsakes
back where they were.

## Air travel: the hook (a stable interface)

The airship game plugs in here, and only here. Nothing else in `world3d/` needs to change for it.

**The name:** `W3D.zoneFly(from)`, in `zone.js`.

**When it's called:** when Io walks up to the Magpie where she's moored at one of the zone's landings, or walks into a road
out to the wide world (a walking map's exit with `to: 'world'`).

**What it's given:** one object,

```
{
  zone: 1,                      // the zone page she's on (zones.js)
  place: 'jetty',               // the place she's in: its walking map's id (src/game/maps.js)
  at: [768, 742],               // Io's spot, in that place's painting pixels (1536 x 1024; a wild place's 3D goes past
                                // the painting, so it can be below 0 or past 1536)
  face: 0,                      // which way she faces, radians (0 south, pi north, pi/2 east, -pi/2 west)
  exit: null,                   // or the road out she walked into: { label: 'The world', to: 'world', rect: [x0, y0, x1, y1] }
  landing: 'wickhollow',        // or null: the landing she walked up to, by its id in src/game/game.js LANDINGS
}
```

The landings' ids, and which zone each is in: `wickhollow` (zone 1, at the jetty), `bogmire` (zone 1), `warmCamp` (zone 2),
`dawnroost` (zone 2), `northCamp` (zone 3), `shipyard` (zone 3), `frozenCamp` (zone 4). Each one's spots are in
`zones.js` (`stand`, where Io steps down; `magpie`, where the Magpie is moored).

**What it does today**, in this order:
1. If the zone page was opened with `?fly=<page>`, it goes to that page, with the details in its query:
   `<page>?zone=1&place=jetty&at=768,742&face=0&landing=wickhollow` (or `&exit=<label>` for a road). Before it goes, it
   writes where she is into the shared save.
2. If the zone page is inside a frame, it posts `{ type: 'envoi3d-fly', from }` to the page round it (`postMessage`), and
   that page takes the flight.
3. Otherwise it shows the card "The Magpie: flying comes next".

So the airship game can either open a zone page with `?fly=` naming its own page, or hold the zone page in a frame and
listen for the message. A script on the zone page itself may also simply replace `W3D.zoneFly`.

**How a flight hands back:** open the zone page of the place she lands in, with where she lands in the address:

```
zone-2.html?landing=warmCamp                         at a landing: where Io steps down there, facing south
zone-1.html?place=bogmire&at=130,372                 at a place and a spot (painting pixels)
zone-1.html?place=bogmire&at=130,372&face=1.57       ...and which way she faces (radians)
zone-1.html?place=bogmire                            at that place's own start
```

Add `&fly=<page>` to keep the hook pointing at the airship game. Which zone page has a place: the table above (or
`zones.js`). The page reads the spot, then takes it out of the address, so a reload starts from the save. If she doesn't
fit exactly there, she stands on the nearest ground she can. If the page hasn't got that place (not built yet), it starts
as it would without the address. The built pages sit side by side in `dist/`, so a flight page beside them opens them by
name.

## The shared save

One `localStorage` key, **`envoi3d-save`**, which every page of the game may read and write:

```
{
  "v": 1,
  "found": { "jetty-coin": 1, "frog-ring": 1 },                         // keepsakes found (envoi-final-draft/items/items.js ids)
  "where": { "zone": 1, "place": "jetty", "at": [768, 742], "face": 0 }, // where Io is now: the last page to move her
  "zones": { "1": { "place": "jetty", "at": [768, 742], "face": 0 } }    // where she was last in each zone
}
```

Later pages add their own fields beside these (the shards, the party's level, the Magpie's upgrades: `shards`, `level`,
`magpie`, as they decide). The rules: read it, change only your own fields, keep every field you don't know, and write it
back straight away (read it fresh each time; don't hold an old copy). `v` stays 1 while the shape only grows.

The zone pages write `where` and `zones` as she walks (every two seconds, on each new place, before a flight, and when the
page is put away), and `found` when she finds a keepsake. The single-place pages (`envoi-3d-*.html`) keep their own list
of keepsakes found under `envoi3d-found` (unchanged); a zone page keeps the two the same each time it opens. Nothing is
read or written in a `?test` run.

## Regrouping the zones

Everything about the zones is in `zones.js`: move a place's id from one zone's list to another (or add a fifth zone, with
its landings), run `make-zones.mjs`, build. A road to a place in another zone shows its name ("on the zone 2 page") until
the airship carries her there.

## The check: `tools/zone-test.mjs`

Headless, like the place tools. It walks Io through the zone's roads, place to place, by the thumb's own input (zone 1:
the jetty, Wickhollow, the jetty, Wickhollow, the cottage, Wickhollow, the Thornwood, Bogmire, the heart, Bogmire, the
Thornwood, Wickhollow: eleven switches; `--route a,b,c` for another). After each switch it checks the place, her spot, the
ground under her, which way she faces and the camera, and the memory: the screen's geometries, textures and shader
programs, what's left between two places, and the page's JavaScript memory. Each place must come back to the same counts
every time she enters it. Then the Magpie's card (at the landing, and at a road out to the world), reopening the page (she's
back where she was), and the hook out and back (`?fly=` round to the page itself, and `?landing=`).

## How it's made

- `zones.js`: the zones (data). `zone.js`: the zone page (roads, the fade, the Magpie, the save, the hook). `zone.css`.
- `zone-<n>.html` and `zone-<n>-art.js`: written by `tools/make-zones.mjs`.
- The engine (`../engine/`), small additions only: `W3D.buildPlace` now returns `dispose()` (every geometry, material and
  texture the place made let go, its painted canvases emptied); the walker's `switchTo(place, x, y, face)` takes the old
  place down and builds the next on the same page (the renderer, Io, her lights, the camera, the thumb and the page stay),
  `warm()` sends a whole place to the screen's memory at once under the fade, and `onFrame` lets a zone page take the
  roads out. The single-place pages work exactly as before.
- Which road goes where comes from the walking maps (`src/game/maps.js` exits: `to`, `at`), matched to each 3D place's own
  exits by their rectangle, else their label.
