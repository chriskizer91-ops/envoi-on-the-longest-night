# The Map Editor

Chris's one tool for the game's walking maps (October 4, 2026, evening). He asked for the map editor and the item placer as one tool. It is the Walking Paths page (`../../envoi-game-pass-3/map-paths/`), whose path tools it keeps exactly as they were, with the twenty keepsakes (`../items/`) placed on the same maps. Like Walking Paths, it is made for his laptop.

**The page:** https://claude.ai/artifact/M3PokTZsXbbxbx2BSDSrC5, published in the Item Places page's place (it keeps that page's `db` capability). The Walking Paths page (https://claude.ai/artifact/8BmLZd8sJjYBQ6kRbX2enm) couldn't be updated from this account, so it stays as it was: any path edits Chris kept in its browser are still there, to send from it. The map editor starts from the game's paths as they are now, with both of his rounds in.

## What it does

A switch at the top picks what the painting is for.

**Walking paths** works as Walking Paths did:

- every map's walk areas, blocks, fronts, exits and arrivals, people and spots: all twenty-one, the eight wilderness scenes included since October 5 (an arrival at a camp is where Io steps down when the Magpie lands; nothing comes from the world map any more, since it is only flown, so an arrival from it in older edits is left out with a note);
- dragging points and shapes, new shapes, Smooth, undo and redo;
- the check of where Io can reach.

**Keepsakes** is new:

- **The twenty in a list,** by who can wear them, each with its two helps. The picked one's card shows its picture (Chris's, art request 14, since October 4, late evening), who can wear it, where it comes from, its main help and its other help, and where it lies.
- **Putting one on a map:** pick it, press **Put it on this map**, then click the painting. Drag a glint to move it. Delete or **Not placed** takes it off. Shift and the arrows nudge it. Undo and redo work here too, apart from the maps' own.
- **The fourteen that lie on a map** are the two hidden ones and the twelve found there. Each starts where the list puts it (`items.js` `at`): the two hidden ones where they lie in the game today, the twelve where Claude placed them at Chris's word, away from the main ways through (he approved them all on October 4, late evening, and the game has them there). A keepsake he takes off a map stays off. The four gifts and the Colossus's two have nothing to place: their cards say who gives them.
- **A red ring** means Io can't get near enough to pick it up. The check uses the paths as Chris has drawn them, so drawing her a way there in Walking paths clears it. In Walking paths, "Where Io can reach" lists the keepsakes she can't reach, too.
- **Every keepsake's name** is a layer, and so are the keepsakes themselves.
- **A note** for each keepsake: where exactly, or anything else.

**Walk it** walks Io there with the game's own field, in either mode. Each keepsake glints faintly, as the hidden ones do in the game. Standing by one and pressing the action button (Enter, Space or Z, or the button on screen) shows its card: its picture, its name, who can wear it, and its two helps. (The game's own card is fuller: `src/game/keepsakes.js`.) Enter, Esc or OK closes the card, and the keepsake stays found for the rest of that walk.

**Send everything new** sends each changed map's paths and each keepsake that changed since it was last sent. **Send this map's paths** sends the open map's paths alone. **Copy my work** (and, outside claude.ai, **Download my work**) gives the same as text.

Everything is kept in the browser as he works.

## Reading what Chris sent

- **The paths:** as for Walking Paths. `ArtifactData` `list` on the page's link, collection `edits`, one document per map; then `check-edits.mjs` and `apply-edits.mjs` (`../../envoi-game-pass-3/map-paths/README.md`).
- **The keepsakes:** collection `places`, one document per keepsake (`places/<keepsake id>`), shaped `{ item, name, wear, source, giver, map, x, y, note, sent }`. `map`, `x` and `y` are where it lies, in the map's 1536 × 1024 painting. They are `null` for the gifts and the Colossus's two, and for one he took off its map.

## Files

| File | What it is |
|---|---|
| `map-editor.html`, `map-editor.css`, `map-editor.js` | The page. It loads Walking Paths' stylesheet and rules (`map-paths.css`, `edits-core.js`), the game's field, maps, painted Io and paper dolls, and the keepsakes (`../items/items.js`) |
| `page-test.mjs` | The headless test: `node envoi-final-draft/map-editor/page-test.mjs [--out dir]`. It runs every step of Walking Paths' own test, then the keepsakes' steps, and every step must pass |

Build: `node tools/build.mjs envoi-final-draft/map-editor/map-editor.html` (`dist/map-editor.html`, 7.24 MB, 7,586,755 bytes, with the eight wilderness scenes; October 5), then publish `dist/map-editor.artifact.html` to the link above (read it with the Artifact tool first, and publish without `capabilities` so its database is kept).

`map-editor.js` is a copy of `map-paths.js` with the keepsakes added. The Walking Paths files stay as they were, as the record of that page.
