SLIP: world-3d
State:    Working: the whole 3D world, with helpers (Chris, November 16, 10:18). Wickhollow's square is ready for him to try.
Plan:     Chris: build the whole 3D world now with the stand-ins, with helpers, while his textures (rounds one and two are
          all made) come in slowly through their own conversation: the project document claude/textures-in.md has the
          way and the starter text. Every 3D place swaps a made texture in by its file name on the next rebuild.
          Round three (fronts, roofs, plants): not for now; perhaps a short list of plants later (claude/textures-in.md).
          Chris (10:34): keepsakes exist in 3D only as a shimmer, and a card pops up when Io walks into one; little pockets
          to find by exploring; wild places as wide open fields round their painting (about three paintings each way), in
          heavy fog so only so much is drawn. Done in the engine (commit 71dbb3f); Wickhollow has its first pocket, with
          the Crescent Locket (its 2D spot was on the lower house's roof). Every helper is building its place that way.
          The 20 walking places left, by helpers: six at a time (Chris, 10:32: his Ultra account has room, and he'll say if
          usage runs fast; this machine's 2 cores are the real limit),
          each following moon-faire-witches/world3d/HELPERS.md on its own branch w3d/<place>, checked and brought into
          work/world-3d here:
            1. the jetty, Io's cottage, the Thornwood (all done; the Thornwood is the first wide wild field)
            2. Bogmire, Bogmire's dark heart, Dawnroost (all done)
            3. Dawnroost's node, Misthollow's Moonwell (done), Misthollow (working)
            4. the shipyard (working); the crossroads and the frozen pass (working); the Warm Roads camp and the Ember
               Line road (working)
            5. the Dawnroost forest road and Eldergrove's edge (working); the northern camp and the cold moor; the frozen camp and
               Frostmere's shore
          Then the whole game, as Chris wants it (11:24 to 11:26): a big game kept as a folder in the repository, each zone
          a big section of its own (loaded when you go there, so the zones can be as large as he likes), the places of a
          zone joined on foot, and air travel between zones by Skies of Aethermoor, his airship game (its own, quite
          advanced game: repository chriskizer91-ops/airship-game-in-aethermoor-). Played from the folder (GitHub Pages
          would give it a link to open on the phone). (The nine fight places and the world map aren't walking places: not
          in this job unless Chris says so.)
          Chris (11:22): anywhere that looks walkable is walkable, or players stop exploring. Done in the engine (open
          ground inside each place's bounds, less water, steep ground and anything solid, measured from what's built; a
          thicket along the edges; a where-she-can-walk view). Wickhollow passes; a helper is making Bogmire's porches,
          the fen's side decks and the jetty's plank arm walkable; every helper building now checks it.
          The Thornwood's wishes, done in the engine (536b898): the shade under trees softened once instead of mark by
          mark (most of a wide place's loading: the Thornwood now loads in about 20 s headless, Wickhollow 27 s); the
          sky below the horizon is the fog's colour, so far ground has no seam; the edge thicket is built in the trees'
          patches with lower bushes, so the ones past the fog aren't drawn.
          The node's wishes (188109b): a place's own materials can be a plain colour, glow, or never thin away near Io;
          each ground texture takes a tint.
          The Moonwell's wish (026fa14): the camera never sits inside a wall, house or roof; it slides in toward Io.
Branch:   work/world-3d   Commit: 026fa14
Files:    moon-faire-witches/world3d/ (all new): README.md, envoi-3d-wickhollow.html, engine/core.js, engine/paint.js,
          engine/world.js, engine/walker.js, places/wickhollow.js, places/wickhollow-trees.js, tools/check-layout.mjs,
          tools/make-trees.mjs, tools/shots.mjs, tools/walls-test.mjs, tools/beside.mjs, tools/plan-wickhollow.json,
          HELPERS.md, and for each place built: places/<id>.js, places/<id>-trees.js, envoi-3d-<id>.html,
          tools/plan-<id>.json (cottage, jetty, thornwood, bogmire, bogmire-heart, dawnroost,
          dawnroost-node, moonwell)
          moon-faire-witches/workshop/slips/world-3d.md
          Nothing else changed.
File for Chris: envoi-3d-<place>.html for Wickhollow, the cottage, the jetty, the Thornwood, Bogmire, Bogmire's
          heart, Dawnroost, Dawnroost's node and the Moonwell (each 12 to 14 MB, works offline). In each: Drag on the left half of the screen to walk (push far
          and she jogs), drag on the right half to turn the camera. The map button (top right) shows your painting over
          the 3D from straight above, with the frame rate and the counts under it; tap it again to go back.
Done:     Wickhollow's square in 3D at night, laid out on the painting in its own pixels: the cobbled square and the
          Moonwell (ring of low wall and flower beds, glowing water, iron arch and lantern, two benches), the chapel (rose
          window, arched door, steps, bell-cote), the churchyard behind its iron railing, Nettie's house and striped stall,
          Hilde's forge (open side with the anvil, glowing hearth, sign), the house by the bridge, the lower house, the
          cottage and shed in the south-east garden, the east bridge (paved deck rising over a stone arch, parapets, four
          lamp pillars) over the river and its falls, the lake and its two jetties, the west stairs, the lane under the
          garden fence, the south road, 18 lamps, flower beds, barrels, crates, gravestones and 1,044 trees placed from the
          painting. Moonlight, the lamps' and windows' warm light, halos, the moon in a starless sky, far hills.
          Io (Moon Faire's, lightest, unchanged) walks it with the walking map's own walk and block areas; the camera
          follows from behind and above and swings slowly round behind her. The three nearest lamps light her.
          A reusable engine (world3d/engine/), so each next place is a data file like places/wickhollow.js.
Checked:  Stills at 412 x 915 and 915 x 412: from straight above beside the painting, and following Io through the square
          (the well, Nettie's stall, the chapel steps, the forge, the bridge lane, the bridge). 0 page errors.
          Io from the Moonwell to all 10 edges and doors (chapel, forge, bridge, the nook, the south road, the lower house,
          the lower jetty, the lane, Nettie's door, the lane by her house), steered by thumb input at 30 frames a second:
          all reached, 0 frames off the walk, 0 inside a house. Pushed straight at each of the 8 buildings with ground in
          front for 6 s: 0 frames inside. Nothing solid stands on walkable ground (but see Open 1).
          Counts: the whole square 248,000 triangles, 139 meshes. In view behind Io: 150,000 to 185,000 triangles and 60
          to 80 draw calls upright, about 220,000 and 105 on its side; Io herself is 45,000 triangles, 26 calls. Frame time
          on the Pixel 7a: not measurable headless (software rendering); the page shows it on the painting view. It starts
          at 1.5 x sharpness and drops a step if it falls under 27 frames a second.
Chris said: (not yet)
For the hub: Take moon-faire-witches/world3d/ and this slip; nothing else changed. Build: node moon-faire-witches/tools/
          patch-io.mjs, then node tools/build.mjs --offline moon-faire-witches/world3d/envoi-3d-wickhollow.html. It reads
          src/game/maps.js (MAPS.wickhollow) and the texture packs' stand-ins, read only. When Chris's textures land in
          texture-packs/made/, rebuilding picks them up (the page uses a made texture wherever one is there). Please add
          the page to moon-faire-witches/README.md's table and to the board, and a textures-made job to the board
          (claude/textures-in.md has its starter text).
Open:     1. The lower house's roof: the walking map lets Io climb the tree and walk the red roof's ridge to the Crescent
             Locket (Chris's secret way, October 4). The 3D house blocks that strip; it needs a roof walk if the
             keepsake's path is to stay.
          2. The townsfolk (Nettie, Hilde, Mayor Gretch) aren't standing in the 3D square yet: src/moon-folk.js could put
             them there, if Chris wants them next.
          3. All 15 textures are stand-ins; the timber-and-plaster walls and the bark are the roughest. shared_planks_wall
             isn't made in any pack yet, so the shed and the lean-to use the boardwalk planks.
          4. For Chris: the frame rate on his phone (the painting view shows it).
          5. Headless stills show a faint fixed rectangle on the ground near the bottom left of the upright screen: the
             software renderer's, not the page's (it stays put with Io hidden and the camera moved).
