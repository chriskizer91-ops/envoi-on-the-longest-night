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
- Ready-made parts (added November 16 from Bogmire's wishes): `decks: [{ r: [x0, y0, x1, y1], y, boards: 'ns' | 'ew',
  stilts: true, bottom: -3.4, rails: { sides: 'nsew', kind: 'rope' | 'wood' } }]` (boardwalks, landings and porches on
  stilts; feet still need `walk_h`), lamps of `kind: 'wood'` (a lantern hanging from a wooden post), doors with
  `plain: true` (a wooden frame, no stone surround or step), `h` on any lamp (metres to its lantern), a 'bark' material for
  things built in `extra(K)`, a roof of its own texture with `roof: { mat: '<name>' }` and
  `extraMats: { '<name>': { tex: '<texture id>', rep, tint, side: 'double' } }` (thatch, another bark), and `startYaw`
  (which way the camera first looks: 0 is north, as the painting; turn by radians).
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

## Chris's direction (November 16, 10:34): pockets, hidden keepsakes, and wide wild places

- **Keepsakes are only a shimmer** in the 3D, until Io walks into one and its card pops up (the engine does this from
  `envoi-final-draft/items/items.js`: every keepsake whose `home` is your map shows at its `at`). Chris likes them hidden
  in **little pockets you find by exploring**: move each one into a pocket with `items: { '<id>': [x, y] }`, and say in
  your report where it is. (A keepsake given by someone, with no `at`, isn't in the world: leave it.)
- **Pockets** (towns and wild places alike): one to three small places past the 2D walk that you only find by looking: a
  strip of garden behind a house, a gap between two walls, a ledge behind a tree, a path round the back of a rock.
  `walkAdd: [{ poly: [[x, y], ...], ground: 'grass' | 'dirt' | 'cob' }]` adds walkable ground; hide the way in behind a
  bush, a tree or a corner. Wickhollow's square has one: the strip down the lower house's west side (its Crescent Locket
  is at the end of it).
- **Wild places are wide open fields**, not just the painting. The painting is the middle of the place: its paths become
  trails, its landmarks stay where they are, and the place goes on round it, about three paintings each way:
  - `extent: [x0, y0, x1, y1]` in pixels, for example `[-1536, -1024, 3072, 2048]` (the painting is 0 to 1536 by 0 to 1024).
  - `open: { bounds: [[x, y], ...] }`: where Io may roam (an uneven edge well inside the extent, so the woods close it in);
    she can go anywhere in it except water and anything solid (every tree trunk, rock, building and lamp is solid).
  - Heavy fog, so only so much is drawn at once: `night: { fogNear: 10, fogFar: 42, far: 90, hills: false, fog: [r, g, b] }`.
    Anything past the fog isn't drawn at all.
  - Rolling ground past the painting: in `ground_h`, add `W3D.vnoise(x / 400, y / 400)` and finer noise (metres up and down),
    kept flat along the trails.
  - Trees past the painting in clumps with clearings between: `treeGen.out: { density, clump, clear, kinds: [leafy, fir,
    bare-thorny], size: [smallest, largest] }`; tree kind 2 is the creepy bare thorny tree. Inside the painting the trees
    still come from the painting itself.
  - Trails out to the edges (`walkAdd`, ground 'dirt'), more places to find along the way (a ruined wall, a ring of
    stones, a fallen tree, a pool, a shrine, built in `extra(K)`), and the exits moved out to the bounds' edge where the
    trails end (`exits`, each `{ rect, label }`).
  - The checks' goals: every exit, every keepsake and every landmark. The whole place can be larger than 300,000
    triangles; what's in view past the fog should stay under about 200,000.

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
