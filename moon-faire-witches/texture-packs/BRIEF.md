# Texture packs from Envoi's paintings: the brief every helper session follows

Chris (November 15, 2026): "get texture packs from all of the maps because we are going to make this whole game 3D".

*Envoi on the Longest Night* is Chris's game. Its places are hand-painted 2D pictures, seen from above at a slant for walking
and side-on for fights. The game is going to be rebuilt in 3D, and every place needs a **texture pack**: the painted
surfaces (ground, walls, roofs, wood, cloth, water, plants) and the painted objects (lamp posts, wells, carts, stalls,
trees) that a 3D builder needs to make the place look like Chris's painting.

Chris makes his final textures in ChatGPT, many at once, from prompts and reference pictures (this is how Moon Faire's open
world was made: 52 prompts, each with reference crops from the paintings). So each pack has two halves:

1. **Stand-ins, made now by code**: a seamless texture cut from the painting for every surface, so a 3D build can start
   today and look roughly right.
2. **Prompts for Chris**: one ChatGPT prompt per texture or object, with reference crops, so he can make the real ones.

Chris can't code. Anything he reads (titles, "used for" lines, your report) is in plain words.

## Your job

You are given a group of places. For each one, look at its full-size painting closely (view it, and view crops of it),
work out every surface and object a 3D version needs, and make its pack in
`moon-faire-witches/texture-packs/<group>/<place>/`.

### For each place

- `inventory.md`: a short note, then a table of everything in the painting a 3D build needs, one row each:
  `id | kind | what it is, in plain words | where in the painting (x0, y0, x1, y1 in the full-size painting's pixels) | shared?`.
  Kinds: `ground` (anything walked on), `material` (a surface that repeats: wall stone, planks, roof slates, cloth, bark,
  ice, water), `skin` (one painted object seen flat from the front: a door, a stall front, a sign, a cart side), `roof`
  (a roof seen from straight above), `plant` (a cut-out: a bush, a tuft, a sapling, a hanging vine), `prop` (a small 3D
  object to model, listed so a builder knows it exists: a barrel, a lamp post, a bench, a well), `light` (lamps, windows,
  fires: where warm light comes from), `sky` (what is seen beyond the place, for a far backdrop).
  Be thorough: a builder should be able to make the place from this list alone.
- `refs/<id>.jpg`: a reference crop from the painting for each row that has a prompt (and for each prop), JPEG quality
  85, at most 768 px on its longest side. Crop generously enough that the thing reads, tightly enough that it is clearly
  the subject.
- `stand-in/<id>.png`: a seamless 512 x 512 texture for every `ground` and `material` row, made with
  `python3 -I moon-faire-witches/texture-packs/tools/seamless.py <painting> x0 y0 x1 y1 <out> --squash k`
  (or `from seamless import make` in your own script). Pick a patch with only that surface in it: no objects, no lamp
  glow, no edges of other things. Ground in a walking map is seen at a slant, so it looks squashed top to bottom: use
  `--squash 1.3` to `1.6` to undo it (look at the result). Fight paintings are side-on: ground there is very slanted, so
  prefer the walking maps for ground, and use fight paintings for what is only there. Look at every stand-in you make,
  tiled 2 x 2, and redo any that shows a repeating blotch, a lamp glow or a seam.
- `prompts.json`: a list of the prompts for this place, each
  `{ "id", "file": "<id>.png", "shape": "Square" | "Wide (3:2)" | "Tall (2:3)", "rules": "ground" | "material" | "skin" | "roof" | "plant",
     "refs": ["<place>/<id>.jpg", "<place>.png" for the whole painting], "title": plain words, "subject": the subject paragraph,
     "use": what it is used for, in plain words, "shared": true | false }`.
  Write the subject paragraph the way Moon Faire's are written (examples below): what it is, how big a patch the square
  shows in metres, its colours and details, at what time of day, and nothing that would repeat badly. The general rules
  (the "rules" field) are added in front of it when the page is made, so do not repeat them.

### Once for your whole group

- `<group>/README.md`: the places, how many textures, prompts and props each has, anything in a painting you were unsure
  of, and which `shared` ids you used.

## Shared textures

Many surfaces appear in several places (the same cobbles, the same snow). Use these shared ids when a surface fits one,
and mark the row and the prompt `"shared": true`. Make its stand-in and prompt from the place where it shows best, and
in other places only list it in the inventory. Add your own shared ids only for surfaces you are sure repeat across the
game; begin them with `shared_`.

`shared_cobbles_town` (Wickhollow-style worn cobbles), `shared_flagstones` (big square paving stones),
`shared_grass_meadow`, `shared_grass_frosted`, `shared_snow`, `shared_ice`, `shared_mud_bog`, `shared_dirt_track`
(packed earth road), `shared_forest_floor` (leaf litter and moss), `shared_boardwalk_planks`, `shared_planks_wall`
(wooden house wall), `shared_stone_wall_rough` (rough stone house or garden wall), `shared_drystone` (field wall),
`shared_roof_slate`, `shared_roof_thatch`, `shared_roof_shingle` (wooden shingles), `shared_bark_oak`, `shared_bark_pine`,
`shared_water_dark` (still black water), `shared_water_river`, `shared_rock_cliff`.

## The prompt rules (Moon Faire's, used as they are)

These are put in front of each prompt by the page. Know them, so your subject paragraphs fit them.

- **ground**: "Paint a square ground texture for a hand-painted fantasy game, in the same painterly style, brushwork and
  colours as the attached painting. Seen from straight above (top-down). No horizon, no sky and no perspective.
  Seamless: the left edge must continue into the right edge, and the top edge into the bottom edge. Even, flat light. No
  lamp glow, no bright patch, no vignette and no cast shadows. No objects. Even spread: nothing noticeably bigger,
  brighter or darker than the rest, because the square repeats hundreds of times. No text, no letters, no border."
- **material**: the same, for a surface seen straight on and flat, filling the picture edge to edge, only the material
  itself, only soft folds or grain.
- **skin**: "Paint one flat view of a single object ... Match the object in the attached close-up. A flat, straight-on
  view with no perspective, like an architect's elevation drawing but fully painted. The whole object inside the picture,
  centred, with a small margin. Background: one plain flat mid-grey (#808080). No ground, no sky, no cast shadow. Even,
  soft light from the front. Lantern glass may glow, but no light may spill onto the background."
- **roof**: as skin, but seen from exactly straight above (a plan view).
- **plant**: as skin, for one plant or tuft cut out on the mid-grey, seen from the side, whole, with its base at the bottom.

Example subject paragraphs (Moon Faire's):

- ground, "Worn cobbles": "Subject: old rounded cobblestones set in packed earth, about 3 m across, as in the ring round
  the fair square. Grey and warm-brown stones of mixed sizes, earth and a little grass in the gaps. Dusk colours."
- material, "Drystone wall face": "Subject: the face of a dry-stone field wall. Rough grey stones of mixed sizes stacked
  without mortar, lichen and moss on them, small dark gaps between. The picture's top edge is the wall's top row of stones
  and its bottom edge is the wall's foot: about 1.8 m of wall, 1.2 m high."
- skin, a stall: "Subject: the herb stall, seen flat from the front. Show the wooden counter with its hanging cloth, the
  bundles of herbs and jars on it, the corner posts, and the awning's front edge with its scalloped trim. The whole stall
  is in the picture."

Envoi's places are at night (moonlight, lamplight, cold mist; the north is snow and frost). Say the time and light in
each subject as the painting shows it, but remember the rules ask for even, flat light in the texture itself.

## How to work

- The game's data about each place is in `src/game/maps.js` (its exits, the spots where things happen, the people, and
  `walk`: the walkable ground traced on the painting). It helps tell walkable ground from the rest.
- Python 3 with Pillow and numpy (`pip install --break-system-packages pillow numpy` if missing). Run Python with `-I`.
  Keep your scripts inside your group's folder (`<group>/tools/`).
- Write only inside your group's folder. Do not change any other file, do not commit, do not publish anything, and do
  not start other sessions.
- Keep each place's folder under about 10 MB.
- When you finish, reply with a short report: per place, how many inventory rows, stand-ins, prompts and props; the
  shared ids you used; anything you were unsure of. Then stop.
