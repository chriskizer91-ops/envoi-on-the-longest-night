# Walking Paths

Chris's editor for where Io can walk on the game's 13 maps, used on his laptop (pass three, October 3, 2026). It follows Witch Way's scene editor (follow-me-down-witch-way, `game/src/editor.js`). Built by a helper agent and reviewed in the session that started pass three.

**The page:** https://claude.ai/artifact/8BmLZd8sJjYBQ6kRbX2enm (private; published with the `db` capability).

## What it does

- Every map's painting, with its walk areas (green), blocks (red), fronts (violet), exits and arrivals (blue and pink), people and spots (yellow), and where Io can reach (cut-off ground in orange).
- Drag points and shapes; double-click an edge to add a point; Delete removes; Smooth rounds a shape or a corner; move exits, people, spots and arrivals; undo and redo.
- Draw new shapes anywhere: **+ Green** (a walk area), **+ Purple** (a front), **+ Red** (a block), first in the panel since October 4: click round the shape, then click its first point again or press Enter.
- **Walk it** runs the game's own field on the edited map, with painted Io and the paper dolls, at Chris's settings.
- Edits are kept in the browser as he works. **Send this map to Claude** and **Send every changed map** write them to the page's database.

## Reading and applying Chris's edits

1. List them: `ArtifactData` `list` on the page's link, collection `edits`. There is one document per map, `edits/<map id>`, in the shape `edits-core.js` documents: the map's `walk`, `block`, `front`, `exits`, `people`, `spots`, `start` and `arrivals`, in `maps.js`'s own coordinates. `changed` names what differs, and `shapes` says which polygons are new so that unchanged ones keep their `lamp()`, `arc()` and `ring()` calls in `maps.js`.
2. Save them to a file and check them: `node envoi-game-pass-3/map-paths/check-edits.mjs <file.json>`. It refuses broken shapes, and anything that cuts off ground Io could reach before.
3. Apply them: `node envoi-game-pass-3/map-paths/apply-edits.mjs <file.json> [more.json ...]` rewrites each changed walk, block and front list in `src/game/maps.js`, keeping every unchanged line as it is (comments, `arc()`, `ring()`, the lamp helpers) and writing new shapes as plain points under the comment of the shape each replaces. Name a redrawn lamp's comment by hand if you like. Moved exits, people, spots and arrivals still go in by hand: each arrival to the exit or place it names (`maps.js` exits, `game.js` `PLACES` and `LANDINGS`).
4. `node tools/check-maps.mjs`, then build, test and publish the game and the chapter demos (`node tools/make-demos.mjs`).

**Done once (October 4, just after midnight):** his first round, eleven maps, five with changes (Io's cottage, Dawnroost, the shipyard, the Thornwood, Wickhollow). **His secret ways are meant** (Chris): green ground can go anywhere she should be able to walk, such as up a tree and over a roof, with purple fronts to hide her. The orange "where Io can reach" marks ground the route-finding for a tap can't plan through (it plans on 12 px squares, so it needs paths about 24 px wide); with the pad or by holding to steer she needs only 12 px, so a narrow secret way still walks end to end (the roof path over Wickhollow's lower house does). Orange is a note, not a mistake.

## Files

| File | What it is |
|---|---|
| `map-paths.html`, `map-paths.css`, `map-paths.js` | The page; it loads the game's `field.js`, `maps.js`, painted Io and the paper dolls |
| `edits-core.js` | The rules the page and the check share: where she can stand and reach, Smooth, the documents' shape, the checks |
| `check-edits.mjs` | Checks a file of edits before they go into `maps.js` |
| `apply-edits.mjs` | Puts checked edits into `maps.js` |
| `page-test.mjs` | The headless test: `node envoi-game-pass-3/map-paths/page-test.mjs [--out dir]` (every step must pass) |

Build: `node tools/build.mjs envoi-game-pass-3/map-paths/map-paths.html` (`dist/map-paths.html`, 2.8 MB).

A note for Chris: smoothing a narrow lane can make it too narrow for Io to pass. The orange "where Io can reach" layer shows it at once.
