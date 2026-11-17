# The 3D zones, built to play

Ready-to-play copies of Envoi's four 3D zones. Each is one HTML file that works offline: download it and open it in a
phone's or laptop's browser. Built from the zone pages in `../game/` (November 17, 2026, from `work/world-3d` at
e99820b) with `node tools/build.mjs --offline moon-faire-witches/world3d/game/zone-<n>.html`.

These four zones are the whole walking game so far: every one of the 21 walking maps in `src/game/maps.js` is built in 3D
and sits in one of them. Each zone has its towns and its wild places, joined on foot. Flying between zones (Skies of
Aethermoor, from the 3D map) comes later.

| File | Zone | Size | Its places (the wild ones in bold) |
|---|---|---|---|
| `envoi-3d-zone-1-wickhollow-and-the-fen.html` | 1, Wickhollow and the fen | 21.7 MB | Wickhollow, Io's cottage, the jetty, **the Thornwood**, Bogmire, the fen's dark heart |
| `envoi-3d-zone-2-the-warm-roads.html` | 2, The Warm Roads | 22.5 MB | the Warm Roads camp, **the Ember Line road**, **the forest road to Dawnroost**, Dawnroost, Dawnroost's living node |
| `envoi-3d-zone-3-the-northern-wilds.html` | 3, The northern wilds | 24.0 MB | the northern camp, **Eldergrove's edge**, **the cold moor**, **the northern crossroads**, the shipyard |
| `envoi-3d-zone-4-the-northeast-peaks.html` | 4, The northeast peaks | 20.7 MB | the frozen camp, **Frostmere's shore**, **the frozen pass**, Misthollow, the dead Moonwell |

Each zone starts at its landing: zone 1 on the jetty, zones 2 to 4 at their camps.

## How to play

- **Walk:** drag on the left half of the screen. Push far and she jogs.
- **Turn the camera:** drag on the right half.
- **Go to the next place:** walk to the end of a road. The screen fades with the next place's name, and Io arrives
  where that road leads.
- **Map button** (top right): shows the painting over the 3D from straight above, with the frame rate. "Start again"
  is there too (two taps).
- **Keepsakes:** they show as a shimmer. Walk into one and its card pops up.
- **Saving:** the keepsakes found and where Io stands are kept on the device.

## What's in them

- **Textures:** stand-ins. Chris's own made textures (rounds one and two, on `work/textures-made`) aren't in these
  builds yet. When they go in, these files are built again.
- **People:** the townsfolk aren't standing in the places yet.

The sources are `../places/<id>.js` (one file per place), `../engine/`, and `../game/zones.js` (which places make each
zone). To build again after a change, run `node moon-faire-witches/world3d/tools/make-zones.mjs`, then the build line
above for each zone, and copy `dist/zone-<n>.html` here under its labeled name.
