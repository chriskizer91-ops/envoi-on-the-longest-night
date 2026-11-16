# Job: world-3d

Start making Envoi's world 3D, one place at a time, with Moon Faire's Io walking it: first Wickhollow's town square.

## Where it stands (November 16)

Nothing 3D is built yet. What there is:

- **Texture packs** for all 31 places (`moon-faire-witches/texture-packs/`, start with its `BRIEF.md` and the group README).
  Each place has `inventory.md` (every surface, prop, tree, light and the sky, with where it is in the painting, in the
  painting's pixels), `refs/` (crops of the painting), `stand-in/` (seamless textures cut from the painting, rough but usable
  today) and `prompts.json`.
- **Chris's real textures** are being made now from the prompts page, in three rounds (round 1 is the 53 shared ones:
  cobbles, grass, roofs, walls, planks, water and the like). The hub puts each one in
  `moon-faire-witches/texture-packs/made/` under the file name on its card (`shared_cobbles_town.png` and so on). Whenever a
  made texture is there, the 3D uses it in place of the stand-in with the same id; until then, the stand-in.
- **Io in 3D:** `moon-faire-witches/src/moon-io.js` (`makeMoonIo({ weight: 'lightest' })`, with `walkRun`, `stance` and the
  model interface Envoi's battle models have) and `src/moon-io-walker.js` (how her walk is paced to her speed on the walking
  maps). Load order: see `moon-faire-witches/walk/walk.html`.
- **The 2D walking map** of each place: `src/game/field.js` and `src/game/maps.js` (where Io can walk, the doors, the
  people). The 3D square should keep the same layout, so the painting can lie under it as a guide while building.

## What to do

1. **Wickhollow's square in 3D** (`texture-packs/wickhollow/wickhollow/`, painting
   `reference/art/walk/walk-wickhollow-square.png`): the cobbled square and the Moonwell, the chapel and churchyard, the
   houses round it (simple boxes with their wall and roof textures), the stalls, lamps, benches, trees and the lake edge, as
   laid out in the inventory. Night, as everywhere in Envoi (the story is one long night; the sky has no stars until the
   ending): moonlight, and warm light from the windows and lamps.
2. **Io walks it:** a camera that follows her from behind and above; on the phone, drag anywhere on the left half of the
   screen to walk (a small ring shows where the thumb went), nothing else on screen but a button to show the painting from
   above as a guide. Walls and water stop her.
3. **Fast on Chris's phone** (a Pixel 7a): about 30 frames a second or better. Say the triangle and draw-call counts.
4. Send Chris the page as one HTML file. When he is happy with the square, the jetty, Io's cottage and the Thornwood next,
   one at a time, each with its own file; then the other places, group by group.
5. When Chris's textures arrive in `texture-packs/made/`, rebuild with them and show him the before and after.

## Files you may change

- `moon-faire-witches/world3d/` (everything in it: pages, code, tools)
- `moon-faire-witches/workshop/slips/world-3d.md`

Read-only for this job: the texture packs, the witches and the rest of the game. If a texture pack needs fixing, say so in
the slip under "Open".

## Checks

- Headless stills of the page at 412 × 915 (phone upright) and 915 × 412 (phone on its side): from above, and following Io
  through the square, with the painting beside them for comparison.
- No page errors; the frame time, triangle and draw-call counts written down.
- Io walks from the Moonwell to each edge of the square without passing through a wall.

## Done when

Chris has walked the square on his phone and is happy with it, and the slip says what the next place needs.
