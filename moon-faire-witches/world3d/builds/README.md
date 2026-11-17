# The 3D zones, built to play

Ready-to-play copies of Envoi's four 3D zones. Each is one HTML file that works offline: download it and open it in a
phone's or laptop's browser. Built from the zone pages in `../game/` (November 17, 2026, from `work/reskin`) with `node tools/build.mjs --offline moon-faire-witches/world3d/game/zone-<n>.html`.

These four zones are the whole walking game so far: every one of the 21 walking maps in `src/game/maps.js` is built in 3D
and sits in one of them. Each zone has its towns and its wild places, joined on foot. Flying between zones (Skies of
Aethermoor, from the 3D map) comes later.

| File | Zone | Size | Its places (the wild ones in bold) |
|---|---|---|---|
| `envoi-3d-zone-1-wickhollow-and-the-fen.html` | 1, Wickhollow and the fen | 33.6 MB | Wickhollow, Io's cottage, the jetty, **the Thornwood**, Bogmire, the fen's dark heart |
| `envoi-3d-zone-2-the-warm-roads.html` | 2, The Warm Roads | 35.3 MB | the Warm Roads camp, **the Ember Line road**, **the forest road to Dawnroost**, Dawnroost, Dawnroost's living node |
| `envoi-3d-zone-3-the-northern-wilds.html` | 3, The northern wilds | 41.8 MB | the northern camp, **Eldergrove's edge**, **the cold moor**, **the northern crossroads**, the shipyard |
| `envoi-3d-zone-4-the-northeast-peaks.html` | 4, The northeast peaks | 33.2 MB | the frozen camp, **Frostmere's shore**, **the frozen pass**, Misthollow, the dead Moonwell |

Each zone starts at its landing: zone 1 on the jetty, zones 2 to 4 at their camps.

## How to play

On the laptop (the main screen, Chris, November 17):

- **Walk:** W A S D or the arrow keys. **Run:** tap a direction key twice and hold it. **Sprint:** hold Shift.
- **Look:** drag with the mouse, anywhere. (No joystick shows for a mouse.)
- **The Flipbook look:** the button left of the map's, top right (or the F key). A switch, and a fineness slider; it
  starts very fine. Both are kept on the device.

On a phone:

- **Walk:** drag on the left half of the screen. Push far and she jogs. **Look:** drag on the right half.

Both:

- **Go to the next place:** walk to the end of a road. The screen fades with the next place's name, and Io arrives
  where that road leads.
- **Map button** (top right): shows the painting over the 3D from straight above, with the frame rate. "Start again"
  is there too (two taps).
- **Keepsakes:** they show as a shimmer. Walk into one and its card pops up.
- **Saving:** the keepsakes found and where Io stands are kept on the device.

## What's in them

- **Textures:** all four zones are reskinned (November 17, the reskin job, branch `work/reskin`): Chris's own made
  textures at their full size, each wall's picture fitted to its wall, real timbers on the timber-framed houses. One
  texture is still a stand-in: the northern camp's pine bark.
- **Nothing built is seen through:** the camera keeps a clear line to Io instead (it looks from higher, swings round,
  looks from right above her, or comes in). Only where she is boxed in with no clear line at all do walls thin away.
- **Made for the laptop first:** full sharpness, grain close up and relief on surfaces. A phone gets the lighter
  settings by itself. Add `?quality=phone` or `?quality=high` to the address to force either.
- **Two looks:** as painted, and the Flipbook look of the 3D models and the battle (`moon-faire-witches/src/flipbook.js`).
- **People:** the townsfolk aren't standing in the places yet.

The sources are `../places/<id>.js` (one file per place), `../engine/`, and `../game/zones.js` (which places make each
zone). To build again after a change, run `node moon-faire-witches/world3d/tools/make-zones.mjs`, then the build line
above for each zone, and copy `dist/zone-<n>.html` here under its labeled name.
