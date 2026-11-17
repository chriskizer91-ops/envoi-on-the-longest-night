# Made textures: the copies the game's pages carry

Made by `../tools/make-web-copies.mjs` from Chris's originals in `../made/` (the reskin job, November 17, 2026).

- **The originals are untouched** in `../made/` (PNG, about 2.5 MB each, 360 MB in all).
- **Each copy here is the same picture at its full size** (1254 x 1254, or 1536 x 1024), saved as WebP at quality 95:
  about a quarter of the weight (72 MB in all) with nothing the eye can tell apart. Nothing is shrunk: the laptop is
  the main screen (Chris, November 17).
- **Cut-outs** (the short list's doors, windows, boughs and bushes: one thing on plain grey): the copy is trimmed to the
  thing itself and its grey background made see-through. `world3d/engine/cutouts.js` records what each was trimmed to.
- **A picture made again** sits in `../made/revised/` under the same file name, beside the one it replaces; the copy
  here is made from the revised one (heart_deck_mossy, jetty_planks_snow).
- **Labeled:** every copy keeps its card's file name (`shared_cobbles_town.png` becomes `shared_cobbles_town.webp`),
  and `index.csv` here has a row for each: its label, the original it was made from, its size, and the original's
  checksum, which is the same checksum as its row in `../made/index.csv` (rounds one and two) or
  `../made/index-short-list.csv` (the short list). The prompts that made each picture stay in
  `../made/prompts/`.
- **The 3D places name these copies** (`world3d/places/<id>.js`: `made: "./../texture-packs/made-web/<id>.webp"`), with
  the stand-in second.

If `../made/` gains or changes a picture, run `node moon-faire-witches/texture-packs/tools/make-web-copies.mjs` again,
then rebuild the pages.
