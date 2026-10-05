# Workshop Brief: the Eight Wilderness Scenes

**Job:** `wilds`. **Branch:** `work/wilds`. **From Chris:** nothing more: his eight pictures for art request 12 (`../../docs/art-requests/12-wilderness-scenes.md`) came on October 5 and are on the game's branch already, as they came, in `../../reference/art/walk/wilds/` (his packs' notes in `packs/` there).

**Done October 5, by the hub itself** (no workshop session was needed): the eight scenes traced, joined and walked on their demo page (`../wilds/README.md`), then put into the game the same day at Chris's go-ahead, with the hub's part at the end done too (`../wilds/plan-into-the-game.md`; `../../handoff/tasks.md`, T02). Since then the world map is only flown. This brief is kept as it was written, so where it says "today", it means before that.

Read `README.md` here first: the loop, the rules every workshop session keeps, and the slip.

## What it's for

Chris decided that the world map is only for flying the Magpie and that walking happens only on painted scenes (October 3), and approved the plan for them, at night (October 5: `../../docs/design-decisions.md`, "October 5, 2026: the wilderness scenes"). Eight scenes take over the walking that bands 2, 3 and 4 do on the world map today. Each band starts at a camp where the Magpie lands, and its scenes join up in a row to the band's town or gate.

This job turns Chris's pictures into walking maps and a demo page where Io walks them. The hub then puts them into the game: the camps as the Magpie's landings, the exits back from Dawnroost, the crossroads and the frozen pass, the Ember Line nodes, and the walking taken off the world map.

## The scenes

| Map id | Scene | Band | Exits (to, and where she arrives) | Picture (in `reference/art/walk/wilds/`) |
|---|---|---|---|---|
| `warm-roads-camp` | The Warm Roads camp | 2 | right edge → `ember-line-road` (by its left edge) | `walk-warm-roads-camp.png` |
| `ember-line-road` | The Ember Line road | 2 | left → `warm-roads-camp`; top → `dawnroost-road` (by its bottom edge) | `walk-ember-line-road.png` |
| `dawnroost-road` | The forest road to Dawnroost | 2 | bottom → `ember-line-road`; top → `dawnroost`, arriving just inside its south road (about `[641, 985]`) | `walk-dawnroost-forest-road.png` |
| `northern-camp` | The northern camp | 3 | right → `eldergrove-edge` | `walk-northern-camp.png` |
| `eldergrove-edge` | Eldergrove's edge | 3 | left → `northern-camp`; right → `cold-moor` | `walk-eldergrove-edge.png` |
| `cold-moor` | The cold moor | 3 | left → `eldergrove-edge`; right → `crossroads`, arriving just inside its west road (about `[40, 485]`) | `walk-cold-moor.png` |
| `frozen-camp` | The frozen camp | 4 | right → `frostmere-shore` | `walk-frozen-camp.png` |
| `frostmere-shore` | Frostmere's shore | 4 | left → `frozen-camp`; top → `frozen-pass`, arriving just inside its south end (about `[788, 990]`) | `walk-frostmere-shore.png` |

Exits from Dawnroost, the crossroads and the frozen pass back into these scenes are the hub's to make: say in your slip where each should arrive.

**In each scene:**

- `wild: { band, scene, rate: 1 }` on the five walks, with the band's battle scene from `GameFights.WILD_SCENE` in `src/game/fights.js` (band 2 `'warm-road'`, band 3 `'northern-crossroads'`, band 4 `'frozen-road'`). The three camps are rests and have no random fights.
- **The camps:** a rest spot at the fire, `{ kind: 'rest', at, label: '<the camp's name>', note: 'A camp. Rest, and the game is saved.' }`, and `land: [x, y]`, the middle of the empty landing ground, where the hub will draw the Magpie.
- **The Ember Line road:** its three nodes as spots with the world map's ids, so saves carry over: `{ kind: 'node', id: 'node1' }`, `'node2'` and `'node3'`, each with `at` and `label: 'An Ember Line node'`, where the picture puts them (one beside the road, two at the ends of side paths).
- **Side paths:** walkable, but no spots of their own; list each side path's end in your slip, as places for things to find later.

## Steps

1. **Start** as `README.md` says, on `work/wilds`.
2. **Chris's pictures are in** `reference/art/walk/wilds/` already, under art request 12's file names, all eight 1536 × 1024 (3:2), as they came: never change them. His packs' notes (`packs/*/MANIFEST.json`) say what he chose each for (the Ember Line road's three unlit nodes: one beside the road, two at the ends of side trails).
3. **Squeeze each** to Chris's "100% extra light" (full size, AVIF quality 20, as the game's three wild maps are): `node tools/compress.mjs reference/art/walk/wilds/<file>.png --out art/walk --avif --q 20 --width 1536`. About 0.1 MB each.
4. **Trace each scene** as a new entry at the end of `MAPS` in `src/game/maps.js`, in the same shape as the others (read the file's header, and the Thornwood's entry as the nearest example): `name`, `src: "art/walk/<file>.avif"` (double quotes, so the build finds it), `band`, `kind: 'wild'`, `music: 'wild'`, `start`, `walk` close to the painted ground, `block`s cut out, `front`s for the trees, rocks and ruins Io walks behind (each with its base line), `exits` with their arrival points, `people: []`, `spots`, `wild`, and the camps' `land`. Every position is in the painting's own 1536 × 1024 pixels.
   - See a scene's paths over its painting: `node tools/trace-overlay.mjs <map id> /tmp/<map id>.png 1600 --grid 25`.
   - Check it: `node tools/check-maps.mjs <map id>` must pass for every new scene (every exit, spot and arrival reachable).
5. **A demo page:** `envoi-final-draft/wilds/wilds.html` (with its own `.js` and `.css`), built by `node tools/build.mjs envoi-final-draft/wilds/wilds.html`.
   - Io walks the scenes on the game's own field (`src/game/field.js`), painted Io and paper dolls, at the game's settings (as `src/game/game.js` makes its field: speed 110, zoom 0.7, ioH 52, pace 1.7, ioScreen 0.15, encounters about every 770 map pixels and never under 440).
   - A choice of the three bands, each starting at its camp. The exits take her from scene to scene; at the end of a band's row, a card names the town she has reached, and a button takes her back to the camp.
   - Where a random fight would start, a short note ("A band 2 fight would start here"), with a count; the camp's rest, the landing ground and the nodes show notes too.
   - The map editor's Walk it (`../map-editor/`) does much of this already: copy what you need into your folder and say where it came from.
   - The game's night look, whatever the device's theme.
6. **Test it headless** at 915 × 412 (Chris's Pixel 7a held sideways) and at a laptop's size: walk each band's row from the camp to its town by taps, with no page errors, and save a screenshot of every scene. Publish the page privately, and give Chris the link.
7. **Chris walks them** on his phone and asks for changes; path fixes go in `maps.js`, and the page is republished at the same link.
8. **The slip**, as `README.md` says, with these too:

```text
Scenes:   <map id: picture size, AVIF KB, walk polygons, fronts, exits, spots> (all eight)
Checked:  check-maps <result for each>; page test <result>; errors <none, or what>
Arrivals: where the exits from dawnroost, crossroads and frozen-pass should arrive in each scene
Finds:    <each side path's end, by map and point>
```

## The files this job may change

- `src/game/maps.js`: the eight new entries, added at the end of `MAPS`, and nothing else (the existing maps belong to the hub).
- `art/walk/walk-*.avif`: the eight new squeezed pictures.
- `reference/art/walk/wilds/`: Chris's pictures, as they came.
- `envoi-final-draft/wilds/`: the demo page, its test and its README.
- `envoi-final-draft/workshop/slips/wilds.md`.

## For the hub, when it comes back

- Wire the scenes in: the camps as the Magpie's landings (at `land`), the exits from Dawnroost, the crossroads and the frozen pass into them, the nodes as field spots (`onSpot`, with the world map's `st.done` ids), the story's next steps and the little arrow through them, and the walking taken off the world map (it stays for flying).
- **Size:** the eight pictures add about 1 MB to the published page, which is close to its 16 MB, so take the world map's walking tiles (about 2.6 MB) out in the same change.
- The journey simulation's walks (`src/game/story.js`) and the encounter counts in `docs/design-decisions.md` then follow the new scenes.

