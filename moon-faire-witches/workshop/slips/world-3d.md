SLIP: world-3d
State:    Ready to bring in: the whole walking game in 3D. All 21 walking maps are built, in four zones each with its
          towns and wild places, joined on foot (Chris, November 17, 09:17: "these are the four zones each with wilds").
          Every place passes walls-test; nearly all of each 2D walk is walkable in 3D. Built to play: builds/ (pushed).
          Next, when Chris says: his made textures in (all 130 are on work/textures-made), the townsfolk.
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
            3. Dawnroost's node, Misthollow, Misthollow's Moonwell (all done)
            4. the shipyard; the crossroads and the frozen pass; the Warm Roads camp and the Ember Line road (all done)
            5. the Dawnroost forest road and Eldergrove's edge; the northern camp and the cold moor; the frozen camp and
               Frostmere's shore (all done). Every walking place is built.
          Then the whole game, as Chris wants it (11:24 to 11:26): a big game kept as a folder in the repository, each zone
          a big section of its own (loaded when you go there, so the zones can be as large as he likes), the places of a
          zone joined on foot, and air travel between zones by Skies of Aethermoor, his airship game (its own, quite
          advanced game: repository chriskizer91-ops/airship-game-in-aethermoor-). Played from the folder (GitHub Pages
          would give it a link to open on the phone). (The nine fight places and the world map aren't walking places: not
          in this job unless Chris says so.)
          Chris (11:22): anywhere that looks walkable is walkable, or players stop exploring. Done in the engine (open
          ground inside each place's bounds, less water, steep ground and anything solid, measured from what's built; a
          thicket along the edges; a where-she-can-walk view). Wickhollow passes; walk pass 1 made Bogmire's porches,
          the fen's side decks and the jetty's plank arm walkable (3658f69); every helper building now checks it.
          The Thornwood's wishes, done in the engine (536b898): the shade under trees softened once instead of mark by
          mark (most of a wide place's loading: the Thornwood now loads in about 20 s headless, Wickhollow 27 s); the
          sky below the horizon is the fog's colour, so far ground has no seam; the edge thicket is built in the trees'
          patches with lower bushes, so the ones past the fog aren't drawn.
          The node's wishes (188109b): a place's own materials can be a plain colour, glow, or never thin away near Io;
          each ground texture takes a tint.
          The Moonwell's wish (026fa14): the camera never sits inside a wall, house or roof; it slides in toward Io.
          Misthollow's and the Moonwell's wishes (ac8f137): each stair tread stands as high as the ground under its high
          edge and fills down to the ground, so a slope never pokes through; a place can tint any surface (pale stone).
          Walk pass 1's wish (920b6be): over water her feet stay at the place's own height (boards, stilts), never the bed
          (in Bogmire and the heart she had been standing 2.4 m and 4 m under the boards).
          The shipyard's wish (3f8bad7): steps can leave out one cheek. The crossroads' and Warm Roads' wish (26d82c5):
          K.far(x, z), builders for a wide place's outlying things, left undrawn past the fog. The far pass (7d6085d) moved
          the five wide places' outlying things there: a third to a half fewer triangles in view (e.g. the Warm Roads camp
          156,000 to 103,000 at the start, 157,000 to 88,000 out in the wide ground), up to 10 to 30 more draw calls at the
          busiest spots (at most 85); and check-layout now counts the 2D walk's points Io can't stand on in 3D. Walk pass 2
          (1cbd778) closed the larger gaps and built Wickhollow's secret roof way (Chris, October 4): an old oak by the
          lower house, a limb up to its fork, a branch and a ladder onto the roof, a plank walk along the ridge. The walk
          grid now decides each cell at its centre (25a58fb). Points of the 2D walk not walkable in 3D: none in 13 places;
          1 to 15 in seven (edge cells, step corners, posts); Wickhollow 187 (the oak's foot and the roof's edges, so she
          can't step from the cobbles onto the fork or from the limb onto the ridge; the chapel steps' corners).
          The whole game, the zone pages (bf99268, from w3d/zones): zones are the game's four level bands, which already join on
          foot ((1) Wickhollow, cottage, jetty, Thornwood, Bogmire, the heart; (2) Warm Roads camp, Ember Line road,
          forest road, Dawnroost, the node; (3) northern camp, Eldergrove's edge, cold moor, crossroads, shipyard;
          (4) frozen camp, Frostmere's shore, frozen pass, Misthollow, Moonwell); one page per zone, Io walking place to
          place through their exits, each place loaded in turn; the airship hook left for Skies of Aethermoor, whose map
          is the same continent at the same size as the game's night atlas (4608 x 3072). Built: game/zone-1..4.html (21.7,
          22.5, 24.0, 20.7 MB offline), one place in memory at a time (zone-test: the same geometry and texture counts on
          every visit, she lands exactly where the road puts her, no page errors). The hook W3D.zoneFly, the hand-back
          (?landing= or ?place=&at=) and the shared save (envoi3d-save) are in game/README.md and the project document.
          For Chris: at a camp she steps down facing south (out past the rope, the fire behind her), as in the 2D game;
          Start again (two taps, guide view only) also puts the zone's keepsakes back.
          Chris (13:39): the four zones are right; every flight has raiders as in Skies, as many as the flight is long,
          harder later in the game; Skies' Crystal Shards are Envoi's shards (Magpie upgrades, opening zones); a zone opens
          on the party's level and the shards for passage or the upgrades the flight needs; flights use the night map. A
          3D map of Aethermoor (where you are when you travel, a dotted line for a flight, then Skies) is its own
          conversation: the project document claude/travel-and-3d-map.md has the decisions and its starter text. Which
          ship (the Magpie or Skies' own) is still to ask.
          The forest road's wishes (283bfea): a flower bush west or north of the painting no longer crashes the page;
          anything right against the camera (a crown, a trunk) thins away.
          The northern camp's wish: patches past the fog go by their ground distance, so tall trees go with their ground.
          For Chris to confirm (helpers' calls under his 11:22 rule): the frozen ice of the frozen pass's river and of the
          cold moor's tarn and Frostmere's near ice is walkable (its far open water isn't); the camp's stream is open water.
          The frozen camp's wish (ff429d4): bark takes a place's tint (white birches).
Branch:   work/world-3d   Commit: 9007065 (code at 25a58fb; after it the slip, builds/ and two READMEs)
Files:    moon-faire-witches/world3d/ (all new): README.md, envoi-3d-wickhollow.html, engine/core.js, engine/paint.js,
          engine/world.js, engine/walker.js, places/wickhollow.js, places/wickhollow-trees.js, tools/check-layout.mjs,
          tools/make-trees.mjs, tools/shots.mjs, tools/walls-test.mjs, tools/beside.mjs, tools/plan-wickhollow.json,
          HELPERS.md, and for each place built: places/<id>.js, places/<id>-trees.js, envoi-3d-<id>.html,
          tools/plan-<id>.json (cottage, jetty, thornwood, bogmire, bogmire-heart, dawnroost,
          dawnroost-node, moonwell, misthollow, shipyard, crossroads, frozen-pass, warm-roads-camp,
          ember-line-road, dawnroost-road, eldergrove-edge, northern-camp, cold-moor, frozen-camp,
          frostmere-shore); game/ (README.md, zones.js, zone.js, zone-1..4.html and their art lists),
          tools/make-zones.mjs, tools/zone-test.mjs, builds/ (README.md, the labels; the four zones built to play
          offline: envoi-3d-zone-1-wickhollow-and-the-fen.html 21.7 MB, -2-the-warm-roads 22.5 MB,
          -3-the-northern-wilds 24.0 MB, -4-the-northeast-peaks 20.7 MB; one commit and push each)
          moon-faire-witches/workshop/slips/world-3d.md
          Nothing else changed.
File for Chris: builds/envoi-3d-zone-1..4-<name>.html (the whole of each zone, walked place to place; in the repository), and envoi-3d-<place>.html for Wickhollow, the cottage, the jetty, the Thornwood, Bogmire, Bogmire's
          heart, Dawnroost, Dawnroost's node, Misthollow, the Moonwell, the shipyard, the crossroads, the frozen pass,
          the Warm Roads camp, the Ember Line road, the forest road to Dawnroost, Eldergrove's edge, the northern camp, the cold moor, the frozen camp and Frostmere's shore (each 12 to 14 MB, works offline). In each: Drag on the left half of the screen to walk (push far
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
For the hub: Take moon-faire-witches/world3d/ (builds/ included) and this slip; nothing else changed. Build: node
          moon-faire-witches/tools/patch-io.mjs, then node moon-faire-witches/world3d/tools/make-zones.mjs and node
          tools/build.mjs --offline moon-faire-witches/world3d/game/zone-<n>.html (or envoi-3d-<place>.html for one place).
          It reads src/game/maps.js, src/game/game.js (LANDINGS), envoi-final-draft/items/items.js and the texture packs'
          stand-ins, read only. The 3D map job (work/world-map) opens from the zone pages' hook W3D.zoneFly
          (game/README.md: ?fly=<page>, back with ?landing=<id>, the shared save envoi3d-save). When Chris's textures land in
          texture-packs/made/, rebuilding picks them up (the page uses a made texture wherever one is there). Please add
          the page to moon-faire-witches/README.md's table and to the board, and a textures-made job to the board
          (claude/textures-in.md has its starter text).
Open:     1. (Done in walk pass 2: the lower house's roof walk. The Crescent Locket stays in its pocket at [358, 676].)
          2. The townsfolk (Nettie, Hilde, Mayor Gretch) aren't standing in the 3D square yet: src/moon-folk.js could put
             them there, if Chris wants them next.
          3. All 15 textures are stand-ins; the timber-and-plaster walls and the bark are the roughest. shared_planks_wall
             isn't made in any pack yet, so the shed and the lean-to use the boardwalk planks.
          4. For Chris: the frame rate on his phone (the painting view shows it).
          6. Chris's made textures: all 130 of rounds one and two are on work/textures-made. Bringing them in means
             merging that branch, making phone-size copies (a made texture can be a few MB; each page inlines its
             textures), rebuilding every place and zone, and showing Chris each place before and after, with any of the
             six textures that show a line where they repeat (claude/slips/textures-made.md). Waiting for his word.
          7. For Chris: the frozen ice that's walkable (the frozen pass's river, the cold moor's tarn, Frostmere's near
             ice), and whether Io steps off at a camp facing the fire instead of south.
          5. Headless stills show a faint fixed rectangle on the ground near the bottom left of the upright screen: the
             software renderer's, not the page's (it stays put with Io hidden and the camera moved).
