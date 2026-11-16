# Envoi in 3D: the world

The world3d job (November 16, 2026): Envoi's places made 3D one at a time, with Moon Faire's Io walking them. The first
is Wickhollow's town square. Brief: `../workshop/world-3d.md`; slip: `../workshop/slips/world-3d.md`.

## The page

| Page | File | State |
|---|---|---|
| Wickhollow | `envoi-3d-wickhollow.html` → `dist/envoi-3d-wickhollow.html` | November 16. The town square at night: the cobbled square and the Moonwell (its ring of low wall and flower beds, its glowing water, the iron arch and lantern), the chapel with its rose window and steps, the churchyard behind its iron railing, Nettie's house and her striped stall, Hilde's forge with its glowing hearth, the house by the bridge, the lower house, the cottage and the shed in the south-east garden, the east bridge over the river with its four lamp pillars, the lake with its two jetties, the west stairs, the lane under the garden fence, the south road down toward Io's cottage, eighteen lamps, benches, barrels, crates, flower beds, gravestones and about a thousand trees. Io walks it: drag on the left half of the screen to walk (push far to jog), on the right half to turn the camera. The one button shows the painting from above over the 3D, with the frame rate and the counts. |

## How it is made

- **On the painting's own layout.** Everything is placed in the painting's pixels (1536 x 1024), as `src/game/maps.js` keeps the
  walking map. Across, one pixel is 4 cm (Io is 42 px tall in the 2D walk and 1.7 m); down the painting, 5 cm (the
  Moonwell's ring is painted 1.25 times wider than tall, because the painting looks down at a slant).
- **Where Io can stand is the walking map's own.** Its walk and block areas, unchanged, plus everything solid the 3D
  adds (the buildings' footprints, the stall, the lamps, the statue). Her step slides along walls and hops the thin seams
  where two of the map's areas meet, as the 2D walk does.
- `engine/core.js`: pixels and metres, a geometry builder that merges everything by material, the texture loader (Chris's
  made texture when the page carries one, otherwise the pack's stand-in), and the night shaders: a near-white sky light
  (the textures are already painted at night), the moon for the shape of things, the lamps' warm light painted into a light
  map in the painting's pixels, soft shade under trees and by walls, fog, the water, the sky with its moon and no stars.
  Anything between the camera and Io thins away in a fine screen, so she is never hidden.
- `engine/paint.js`: the small pictures the packs don't hold, painted in code: lit windows, plank doors, the rose window,
  flower clusters, the stall's fruit, the lamps' halos, the Moonwell's water, Io's soft shadow.
- `engine/world.js`: builds a place from its data: the ground (cobbles, earth, grass and paving laid by a splat map drawn
  from the walk areas), the water, the buildings (walls by storey, gabled or lean-to roofs, doors, windows, lanterns,
  chimneys, dormers, the hearth), the stall, walls with railings or pickets, stone steps, the Moonwell, lamps, jetties, the
  bridge, props, flower beds, rocks along the banks, trees (in patches, so those out of view are skipped), far hills and
  snowy mountains.
- `engine/walker.js`: Io (`src/moon-io.js`, lightest, unchanged) with the nearest three lamps lighting her, the thumb and
  the keys, the follow camera, the guide, the frame rate (the screen's sharpness drops a step if the phone falls under
  27 frames a second, and comes back above 55).
- `places/wickhollow.js`: the square's data. `places/wickhollow-trees.js`: where its trees stand, made from the painting.

```
npm install --prefix tools                                         # once
node moon-faire-witches/tools/patch-io.mjs                         # Io's added moves (built, not kept in git)
node moon-faire-witches/world3d/tools/make-trees.mjs wickhollow    # the trees, from the painting
node tools/build.mjs --offline moon-faire-witches/world3d/envoi-3d-wickhollow.html   # dist/envoi-3d-wickhollow.html
node moon-faire-witches/world3d/tools/check-layout.mjs             # nothing solid on walkable ground
node moon-faire-witches/world3d/tools/walls-test.mjs dist/envoi-3d-wickhollow.html   # Io to every edge, through no wall
node moon-faire-witches/world3d/tools/shots.mjs dist/envoi-3d-wickhollow.html <out> [--size 915x412]   # phone stills
```

## Chris's textures

Each texture is written out twice in the place's data: `texture-packs/made/<id>.png` and the stand-in. The offline build puts
whichever pictures exist inside the file, and the page uses the made one when it's there. So when the hub drops a round
of Chris's textures into `texture-packs/made/`, rebuilding the page is all it takes.

## The numbers (Wickhollow, November 16)

- The whole square: 248,000 triangles in 139 meshes (1,044 trees, 18 lamps, 65 halos). In view from behind Io, upright:
  150,000 to 185,000 triangles and 60 to 80 draw calls, of which Io is 45,000 triangles and 26 calls.
- Frame time: headless stills run on a software renderer, which says nothing about a phone. The page measures the real one:
  the painting button shows it.

## Next

The jetty, Io's cottage and the Thornwood, one at a time, each with its own page and file; then the other places, group by
group. Each is a data file like `places/wickhollow.js`, made from its texture pack's inventory and its walking map.
