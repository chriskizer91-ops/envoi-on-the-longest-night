SLIP: reskin
State:    All four zones reskinned, with all 28 pictures of Chris's short list wired in, and with Chris (November 17,
          about 16:30). Waiting for what he sees on the laptop.
          Not a board job: Chris asked for it directly in a new conversation in the project (November 17, 09:48).
Branch:   work/reskin, from work/world-3d at 8b876cc. Pushed; newest commit 82fe7f0. (e9bce39: zone 1's code; cce1464
          to bb5a7d3: the texture copies; abbba71: the looks, keys, camera and short list; a725efc: the short list wired
          in; a224877 to 50dc302: its originals, a zip each; 1ca5af2: their web copies; 3310e35 to 82fe7f0: the four
          builds.)
Chris said (November 17):
- Reskin the four 3D zone files with the texture packs that are made. The pattern repeating on the sides of the
  buildings doesn't look good (the roofs are fine): fix the repeat as well as swapping the textures.
- **The laptop is the main screen.** Highly detailed and looking really good at the upper end of what his laptop can
  draw, no corners cut. The phone is secondary.
- See-through buildings must not happen.
- (11:01, after zone 1) "Everything looks really good." He likes the camera going to right above her when it has to.
- **Two looks to toggle:** add the Flipbook look of the 3D models, with its fineness slider. He likes it very fine.
- **Keys:** tapping the forward key twice makes her run (no holding Shift); Shift is then a sprint.
- **No joystick on the laptop:** it made moving harder. The page should know a phone from a laptop.
- Round three: not the 235. A markdown document of the prompts that would help, from all four zones, which he takes to
  the session that made rounds one and two.
- (15:26 and 15:48) He made all 28 and handed them over as five zips (Envoi-Shortlist-A-Walls, -B-Doors-and-Windows,
  -C-Wood-and-Props, -D-Boughs-and-Bushes, -E-Revised-Decks; E's first upload arrived cut short and he sent it again).

Done in the morning (in moon-faire-witches/world3d/engine/ unless said, so every place has it):
- **His made textures, at full size.** texture-packs/made-web/: a copy of each at its full size as WebP quality 95, made
  by texture-packs/tools/make-web-copies.mjs; labeled in made-web/index.csv. The originals of rounds one and two are
  in texture-packs/made/ on branch work/textures-made, untouched, and are not on this branch. All 21 places name
  made-web/<id>.webp. make-zones.mjs carries a stand-in only where a texture still needs it.
- **Walls.** A timber-framed picture is fitted to each wall (whole bays corner to corner, rows to the storey), with real
  corner posts and beams. Board walls fit the storey, with a trim board where two board storeys stack. Stone starts
  somewhere different on every wall. A place that builds its own walls in extra() can use K.layWall, K.lays and K.wear.
- **Surfaces.** A slow drift of tone; on the laptop, grain close up and relief from the picture.
- **Nothing built is seen through.** The camera keeps a clear line to Io, tested against the real faces of everything
  built (world.js: sight; walker.js: placeCamera): it looks from a little higher, swings round to a clear side, looks
  from right above her, or comes in. Only where she is boxed in do walls thin away as they used to (uCutW). Trees,
  bushes, cloth awnings and a place's own extra materials thin away as before. Walls are drawn from their fronts only.
- **Laptop first.** W3D.quality 'high' on a laptop, 'phone' on a touch screen with no mouse (?quality= forces either).
- **The Flipbook look** (moon-faire-witches/src/flipbook.js unchanged): a button left of the map's, a switch and a
  fineness slider (160 to 720 rows, starting at 600); F on the keys; kept on the device (envoi3d-look).
- **Keys and mouse:** a direction key walks (1.3 m a second); tapped twice and held she runs (3.0); Shift sprints (5.2).
  A mouse only turns the camera and shows no joystick; a finger still gets the thumb ring.
- **The short list:** docs/art-requests/15-3d-world-textures-short-list.md (28 prompts, five groups), made by
  texture-packs/tools/make-short-list.py.

Done in the afternoon: the short list brought in and wired (all 28)
- **Brought in, labeled** (texture-packs/tools/bring-in-short-list.mjs): each picture under its card's file name in
  texture-packs/made/, checked against its zip's own checksum list (28 of 28 match); a row each in
  made/index-short-list.csv (the same columns as made/index.csv; a file of its own because made/index.csv belongs to
  the textures-made job); each zip's prompts.json whole in made/prompts/<zip>.json. The two made again (group E) are in
  made/revised/ under the same names, beside the ones they replace, which stay as they were.
- **Web copies** (make-web-copies.mjs): as before, and the 14 cut-outs (doors, windows, boughs, bushes) trimmed to the
  thing itself with the grey background see-through; engine/cutouts.js records each one's trimmed size. A picture in
  made/revised/ is the one its copy is made from.
- **engine/extras.js:** the pictures every place can use on top of its own textures, by the texture it goes with. On
  every 3D page; make-zones.mjs carries each zone's.
- **Group A, walls:** the houses of a place take turns among their wall's pictures (timber: the first, curved braces,
  close studs; rough stone and its warmer second; frosted stone and its second; board wall and boards-and-battens), so
  neighbours differ. A chapel, tower, gatehouse or hall is dressed stone. One timber house in three has plain plaster
  gables. A place can say for itself (a building's `wear`).
- **Group B, doors and windows:** the painted plank door, arched door, double arched door, lit window, dark window and
  rose window replace the code-drawn ones, each with its own frame or stones; a lit window's glass glows by itself
  (glowmap); about one lit window in four, low on a wall with room beside it, is the one with its shutters open.
- **Group C, wood:** oak for posts, beams and plain wood (where a place used the jetty's floor planks); barrels and
  crates from their pictures; the stall's table; the northern camp's pine bark (no stand-in left anywhere).
- **Group D, trees and bushes:** a crown is built of painted boughs round a smaller, darker heart of the old lumps: oak
  boughs fanned out from the trunk's top, birch boughs hanging from round the crown, fir boughs in tiers sweeping out
  and down round a full-height trunk with two crossed at the tip (snowy ones in the cold places), a spray of thorny
  twigs off the branches of bare trees. Flower beds have painted bushes standing over a low mound. Which bough a place
  gets follows its own leaf texture (BOUGH_FOR in world.js); trees past the painting get fewer.
- **Group E:** Bogmire's dark heart's deck (lighter, mossy) and the snowy planks (no line) are in.
Checked (on the final builds): zone-test all passed for all four zones, walking through every place, no page errors.
          walls-test all passed on all 21 places. Io seen in every close view of the six places checked again
          (Wickhollow, the cottage, Bogmire, Dawnroost, the shipyard, Misthollow); far overviews aside.
          Before and after stills at 1600 x 900 in Wickhollow, and stills in eight other places.
          Not measured: the frame rate on Chris's laptop (headless stills use a software renderer). The trees add
          triangles (Wickhollow 248,000 to 282,000 in all; the frozen camp, with 2,281 trees, 397,000) and leafy cut-outs
          cost more to draw than solid lumps. The map button shows the frame rate; the page drops its sharpness a step
          by itself under 27 frames a second.
Files for Chris: world3d/builds/envoi-3d-zone-1..4-<name>.html (45.5, 47.7, 54.4 and 43.6 MB).
For the hub and world-3d: this branch changes world3d/ (engine, with extras.js and cutouts.js new; places' texture
          paths; Wickhollow's lower house; the 21 place pages' scripts; tools/make-zones.mjs and shots.mjs; HELPERS.md;
          builds/), adds texture-packs/made-web/, the short list's originals in texture-packs/made/ with
          made/index-short-list.csv, made/revised/ and five prompts files, four tools in texture-packs/tools/, and
          docs/art-requests/15-... Bring work/textures-made in as well for the originals of rounds one and two (no file
          clashes with it). Anything world-3d has done since 8b876cc needs merging.
Open:     1. For Chris on the laptop: the frame rate with the new trees, how the camera feels in tight places, and the
             look of the trees from close under them (where a crown is near the camera it thins away, as before).
          2. A place's own doors, windows, barrels and trees built in its extra() (not through the engine's lists) keep
             the engine's materials, so they wear the new pictures, but their frames and sizes were laid out for the old
             ones: worth a look place by place. The edge thickets and far trees past the fog are still lumps.
          3. A slim wooden post or beam (under 0.3 m across) can still stand in front of Io.
          4. The Flipbook look has no ink outlines in the 3D world. If Chris wants them, that is a small addition.
          5. shared_window_dark and the coloured window (winColour, still code-drawn) are rarely used; the shuttered
             window appears only where a wall has room.
