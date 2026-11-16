# Building a 3D place: the brief for each helper

Chris (November 16): build the whole 3D world now with the stand-in textures, using helpers, while his own textures come
in through another conversation. The world-3d conversation hands each helper one or two places; this is what a helper
does. Wickhollow's square is done and is the worked example: `places/wickhollow.js`, `envoi-3d-wickhollow.html`.

## Set up (in your own worktree)

```
ln -s /home/claude/envoi-on-the-longest-night/tools/node_modules tools/node_modules
mkdir -p moon-faire-witches/build && cp /home/claude/envoi-on-the-longest-night/moon-faire-witches/build/io_plus.js moon-faire-witches/build/
```

Read, in this order: `README.md` (this folder), `places/wickhollow.js` (every field a place can have, with comments),
`engine/world.js` (how each field is built; skim), then for your place: its texture pack
(`../texture-packs/<group>/<place>/inventory.md`: every surface, prop, tree, light and the sky, with where it is in the
painting), its full-size painting (look at it whole, then at crops of it with a pixel grid drawn on, as many as you need)
and its walking map (`src/game/maps.js`, `MAPS.<id>`: `walk`, `block`, `front`, `exits`, `people`, `spots`, `start`).
Draw the walk and block areas over the painting before placing anything.

## Make (only these files, all new, named for your place)

- `places/<id>.js`: the place's data, written the way `places/wickhollow.js` is. Everything in the painting's own pixels.
  `ground_h(x, y)` for the ground's height (metres), `walk_h` for where feet stand (decks, bridges), water bodies traced
  from the painting, lawns, buildings (footprints just off the walk area, fronts facing the way the painting shows),
  walls, steps, lamps, jetties, props, flowers, lights, `checks` (from the start to every exit and door), `treeGen`.
  `surfaces` picks the texture for each kind of surface (stone, dry, timber, planks, roof, wood, deck, pave, cloth, soil,
  rock, leaves, firs, bark) and `ground` the four ground textures; `tints` and `night` and `ground.grassTint` tune colours
  (a snowy place wants `grassTint: [1, 1, 1]` and its snow as the ground's grass).
  Anything the engine has no field for (tents, a campfire, boats, a cart, a standing stone, a ruined arch), make in
  `extra(K)`: `K.B` is the geometry builder (`box`, `quad`, `tri`, `cyl`, `geom`), `K.X`/`K.Z` turn pixels into metres,
  `K.gh` is the ground's height, and `K.fire(px, py, size)`, `K.light`, `K.halo`, `K.lantern`, `K.bench`, `K.addBlock`
  (something solid Io can't walk through), `K.circlePx`, `K.rockG` and `K.ico` are there too. Materials are the
  builder's keys: 'stone', 'dry', 'timber', 'planks', 'roof', 'wood', 'deck', 'pave', 'iron', 'cloth', 'glass' (glows by
  itself: give it a colour), 'win', 'door', 'rock', 'soil', 'leafBush', 'fl_mix', 'fl_white', 'fl_violet', 'fl_sun'.
- Each texture written out in full with double quotes, as in `places/wickhollow.js` (the offline build only packs
  pictures it finds as plain paths): `made: "./../texture-packs/made/<id>.png"` and `stand: "./../texture-packs/<group>/<place>/stand-in/<id>.png"`.
  A shared texture's stand-in is wherever it was made: `ls moon-faire-witches/texture-packs/*/*/stand-in/<id>.png`. If a
  texture your place needs has no stand-in anywhere, use the nearest that has one and say so in your report.
- `places/<id>-trees.js`: made by `tools/make-trees.mjs <id>` from the painting (set `treeGen` in your place first; add
  the painting's own trees near paths by hand in `extraTrees`).
- `envoi-3d-<id>.html`: a copy of `envoi-3d-wickhollow.html` with the title, the name on the loading screen, the two place
  scripts and `W3D_PLACES.<id>` changed. Nothing else.
- `tools/plan-<id>.json`: the stills: `{ "name": "top-3d", "top": true }`, `{ "name": "top-with-painting", "guide": true }`,
  then Io at the start and a walk through the place with `{ "to": [x, y] }` steps, and a few views on their own.

Never change the engine, the tools, the other places, or anything outside `moon-faire-witches/world3d/`. If the engine
should do something it doesn't, build it in `extra(K)` for now and put the wish in your report.

## The rules of Envoi's world

- Night, as everywhere in Envoi (the story is one long night): moonlight and warm light from lamps, windows and fires. The
  sky has no stars (they come back only at the ending).
- Io is Moon Faire's Io at her lightest, unchanged. Where she can walk is the walking map's own walk and block areas:
  never change them, never let anything solid stand on them (`tools/check-layout.mjs <id>`), and add to `block` only
  through what the engine adds (buildings' footprints, lamps, solid props).
- The main cast is all women; the Drowned Mother, Old Snuff and the mandrakes are retired (never use them).
- Fast on a phone (Chris has a Pixel 7a): keep the whole place under about 300,000 triangles; trees are the biggest part.

## Check, and look

```
node moon-faire-witches/world3d/tools/make-trees.mjs <id>
node moon-faire-witches/world3d/tools/check-layout.mjs <id>             # nothing solid on walkable ground
node tools/build.mjs --offline moon-faire-witches/world3d/envoi-3d-<id>.html
node moon-faire-witches/world3d/tools/walls-test.mjs dist/envoi-3d-<id>.html   # Io to every goal, through no wall
node moon-faire-witches/world3d/tools/shots.mjs dist/envoi-3d-<id>.html <out> [--size 915x412]
node moon-faire-witches/world3d/tools/beside.mjs <id> <out>/00-top-3d.jpg <out>/beside.jpg
```

Look at every still yourself. Compare the 3D from above with the painting, beside it, and fix what doesn't match: the
buildings' places and sizes, the paths, the water, the trees. Then look at the walking stills: nothing floating, nothing
sunk, no wall Io walks through, the start view reads well, upright (412 x 915) and on its side (915 x 412). 0 page errors.

## Hand back

Commit in your worktree (do not push), with a message that ends with the two attribution lines the world-3d
conversation gives you. Then report: the commit, the files, what's in the place in a few lines, the numbers (the whole
place's triangles, triangles and draw calls in view, walls-test result, page errors), the paths of the stills and the
beside picture, anything not done, any texture with no stand-in, and any wish for the engine.
