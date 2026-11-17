SLIP: world-map
State:    Working: step 1 of 4, the 3D land, now textured with Chris's own ground textures, coloured by zone, and in two
          levels of detail, phone and laptop; real tree models at three levels; and a pass on the water, the mountains and the
          buildings, which are now the 3D game's own (November 17). Next: step 2 (choosing where to go, the dotted line).
Plan:     From the project document claude/travel-and-3d-map.md (its starter text). A demo page at a time, one offline
          HTML each: 1) the 3D map of Aethermoor, showing where Io is; 2) choosing where to go, on foot or by flight,
          with a dotted line from here to there for a flight; 3) the flight in Skies of Aethermoor on the night map, as
          many raiders as the flight is long; 4) landing, back into the zone page at that landing.
          Files only in moon-faire-witches/world-map/ (and this slip); moon-faire-witches/world3d/ is the world-3d
          job's. Skies (chriskizer91-ops/airship-game-in-aethermoor-) is read only; anything copied from it names its
          source in the commit message (nothing copied yet).
Chris said: (15:22, after the first build, which laid the night atlas over a height map) Not the map printed onto
          something that makes it look 3D. Look at the map and make a 3D representation of the world, cruder because
          it's drawn in 3D; infer the elevation from the picture; rotatable, to look round and look at it. It would be
          fantastic if the areas already 3D mapped were correctly represented, but that may be asking too much. It's a
          terrain map: you'd barely see any cities from this level; you might see the castle.
          (20:18) He flies Skies of Aethermoor's ships: its four ships are part of the gates between zones (upgrading
          the ship). The phone version works fine on his phone; he wants a high-detail version for his laptop, two or
          three times as detailed. He proposed having an image AI paint a realistic picture from screenshots of the map
          and laying it over the 3D land, together with the repo's texture packs; and yes, colour the ground by what
          each zone's environment looks like in the game. Answered: the repo's textures on the ground, yes (done); the
          zones' looks, yes (done); a generated picture as the land's surface, not recommended (it is the picture on a
          shape he turned down, it wouldn't line up with the coasts, and it blurs up close), though blurred right down
          it could serve as a soft colour guide later. Waiting to hear whether he agrees.
          (21:19) He uploaded his Field & Forest · Forest Builder page: can we do something like this, using trees like
          these as we zoom in. Done (below).
          (November 17, 06:16) Make a less detailed version of each tree, a third to a quarter as detailed, and have
          that be the tree drawn from three or four times as far away. Done (below).
          (07:52) This is all looking really good. Now the water (it can be flat with an image of the sea painted on
          it); the cliffs look good but the mountains could have a fair bit of improvement; and the houses and buildings
          should look like structures from the 3D of the game. He can get images generated (water surface, mountainside)
          for anything this pass needs. Done (below); four textures asked for in art-requests/world-map-round-1.md.
          (08:42, with four photos of his laptop's screen, and a zip of the four textures asked for) The ripples along
          the coast would look better gone. The river looks as if it moves between the trees, less immersive: make it
          flat. The open grass could have more texture. (His fourth photo showed the buildings washed out to white and
          pink on his laptop.) All done (below). And he wants to consider what it would take for this 3D map to reflect
          the actual in-game map: the buildings accurate, in less detail than the game, and the wild zones looking
          right. Answered with a plan in three passes (Open 7); waiting for his word.
Branch:   work/world-map (from work/world-3d at 0046851)
Files:    moon-faire-witches/world-map/ (all new to the game): README.md, envoi-map-where.html, map/map3d.js,
          map/places.js, map/art.js, map/moods.js, map/map.css, art/aethermoor-terrain-height.png,
          art/aethermoor-terrain-kinds.png, art/aethermoor-ground-layers.webp, art/LABELS.md (what each art file holds),
          art/world-map-round-1/ (Chris's four textures of November 17, as he sent them),
          art/aethermoor-building-layers.webp, map/buildings.js, tools/make-buildings.mjs, art-requests/world-map-round-1.md,
          art/trees/ (24 files: eight trees, each <id>.glb, <id>_mid.glb and <id>_far.glb), map/tree-models.js,
          tools/make-tree-mids.mjs, tools/make-tree-models.mjs, tools/tree-lineup.html, tools/make-terrain.mjs, tools/make-ground-layers.mjs, tools/make-moods.mjs, tools/check-places.mjs,
          tools/shots.mjs, tools/touch-test.mjs
          moon-faire-witches/workshop/slips/world-map.md
          (The first build's art/night-1..4.avif, art/height.png, art/land.png and tools/make-map-art.mjs are gone.)
          Nothing else changed.
File for Chris: envoi-map-where.html (6.0 MB, works offline, one file for phone and laptop: it picks the level, and the
          "Move Io" list has the switch). It opens on the whole land and flies down to Io at
          Wickhollow. One finger turns the land and tips the view; two fingers pinch to zoom, slide to move, twist to
          turn. The moon button (bottom right) finds Io again. "Move Io" (bottom left) puts her in any of the 21 places.
Done:     Nothing of the painting is on the model. tools/make-terrain.mjs reads the day atlas once into two data
          pictures: the kind of ground at each spot (sea, river, lake, pine forest, leafy forest, grass, farmland, fen,
          beach, desert, mesa, rock, snow) and its height, inferred: land rising from its shores, crags and cliff steps
          where grey rock is painted, ridged peaks where the mountains are painted (highest under the snow, about
          2,840 m), flat-topped mesas in the east, a flat fen, rivers in their valleys, flat lakes. map3d.js builds the
          land from those: a sheet of 576 x 384 squares coloured by kind, steep faces bare rock, faceted moonlight; a
          flat sea with pale shallows and surf; about 47,900 small 3D trees where the forests are; Hearthstone Keep on
          its island; a few lit roofs and a tower at each town and landmark (108 houses, 112 lights). Zones not reached
          lie under a low ragged mist that tall ground, the castle and the towers stand out of; a gold line rings Io's
          zone; her pin and the names are as before.
          Evening: the ground wears 24 of Chris's made textures (packed from texture-packs/made/ on work/textures-made
          into art/aethermoor-ground-layers.webp; none a stand-in): the 16 world-map ones by kind of ground, and 8 of the
          zones' own cards so each zone looks like itself (zone 2's flowered grass; zone 3's frosted heather, firs and
          bracken; zone 4's frost meadow and snow-laden firs), the trees changing with them. Each region is also tinted
          and hazed from its walking places' own leaf tints, fog and moonlight (map/moods.js, read from work/world-3d at
          e99820b). Two levels: phone (576 x 384 squares, 47,900 trees, 256 px textures) and laptop (1152 x 768 squares,
          96,100 trees with fuller shapes near, 512 px textures).
          Night: eight of Chris's tree models from his Field & Forest · Forest Builder (art/trees/, labelled): spruce,
          ponderosa pine, bur oak, cottonwood, aspen, weeping willow, mesquite, dead snag, each as a detailed model and
          a light one. Every tree on the map is one of them by its ground, its zone and whether water is by. Far off it
          is its simple shape; as the view comes close the nearest trees become the light models and the very nearest
          the detailed ones (phone: 56 detailed, 900 light; laptop: 150 and 4,200), tinted to the colours of their
          simple shapes. The view comes as close as 550 m (it was 1.5 km), and the ground has a finer grain close to.
          November 17: a middle model of each tree (art/trees/<id>_mid.glb, made from Chris's detailed one by
          tools/make-tree-mids.mjs: the trunk and biggest boughs kept, about one leaf or clump in five kept and made
          bigger; 25 to 27% of the triangles, the dead snag 44%). Three rings now: detailed nearest (closer than 3.6 km
          on a phone, 5.6 km on a laptop), middle from 3 times as far (10.8 km; laptop 3.5 times, 19.6 km), light
          beyond. Phone: 56 detailed, 400 middle, 700 light; laptop: 150, 1,600, 3,200. If the frames come under 26 a
          second with models on the screen, a quarter fewer trees are drawn as models, and again until it holds.
          November 17, the pass on water, mountains and buildings. Water: a flat sea in his two sea textures with small
          crossing ripples, the sky's sheen at a low angle, the moon's path of light, a pale bed in the shallows and
          surf rolling in; rivers and lakes drawn to smooth banks, frozen in zone 4. Mountains: the height reader wears
          the mountain country with 140,000 drops of rain (gullies, ridges, fans); banded rock, snow by height and
          slope; moon shadows and valley shade worked out from the land's shape, over land, sea, trees and buildings.
          Buildings: the 86 buildings of the nine walking places that have any, read from the world-3d job's places
          (work/world-3d at e99820b) by tools/make-buildings.mjs, stand in their true arrangement in the game's 13 wall
          and roof textures (all Chris's made ones, from work/textures-made at bb4a5f0); the castle and the other
          towns are built the same way. 134 buildings, 4,306 triangles, 188 window lights.
          November 17, 08:42's fixes: no surf bands (only the water's pale edge); rivers and lakes still and flat, one
          even colour; soft moonlight on the sea, no sharp glints; open grass with drifts of meadow and clover, patches,
          tufts and flower specks; buildings lit more gently (they washed out on his laptop's graphics card). His four
          new textures are in: the open sea (4 km and 11 km to the square), the shallows, the mountain rock, the scree
          and snow. 27 ground textures now, all his.
Checked:  (08:42's fixes) Phone, all views, and laptop, 6 views: 0 page errors; touch test 10 of 10; places check passes.
          The buildings' brightness on his laptop is for him to confirm (headless stills come out darker than his screen).
          (November 17, the pass) 27 views at the phone's level and 8 at the laptop's: 0 page errors; touch test 10 of 10;
          places check passes. Frame rates not measured.
          (November 17) Both levels, zoomed in and at 3.3, 7 and 10.5 km: 0 page errors; touch test 10 of 10; places
          check passes. tree-lineup.html: every tree at its three levels, the middle ones keeping their shape. Drawn
          zoomed in: phone 1.1 to 1.6 million triangles (it was 0.4 to 1.1), laptop 3.9 to 6.0 million (1.3 to 3.9).
          Frame rates not measured.
          (night) Zoomed-in stills in every zone at both levels: 0 page errors; touch test 10 of 10; places check passes.
          Drawn zoomed in: phone 0.4 to 1.1 million triangles, laptop 1.3 to 3.9 million. Frame rates not measured.
          (evening) Both levels: 0 page errors; touch test 10 of 10 at the phone's level; places check passes. Drawn: phone
          0.2 to 0.8 million triangles; laptop 1.4 to 3.1 million, 76 to 244 draw calls. The laptop's frame rate isn't
          measured (headless): for Chris to say. Earlier: check-places.mjs: all 21 places on land (or at the water's edge) in their own zones, all 7 landings in their
          zones. touch-test.mjs at 412 x 915, as a phone's fingers: 10 of 10 (opens on the whole land; flies down to Io
          at Wickhollow exactly; one finger sideways turns the land 94° round her; one finger up tips the view from 41°
          to 17° above the ground; a pinch zooms 1,000 to 478; two fingers slid move 1,478 m; a twist turns 34°; "Move
          Io" lists 21 places; choosing Misthollow flies there; the moon button finds her, north up). Stills of 16 views
          at 412 x 915 and at 915 x 412: 0 page errors. Held beside the atlas from straight above: the coasts, the
          forests, the fen, the desert and its mesas, the mountains and the capital's island are where the atlas has
          them. Drawn: 450,000 triangles for the whole land, 170,000 to 810,000 close in (most where forest fills the
          view); 25 to 45 draw calls. Frame rate on the Pixel 7a: not measurable headless; the "Move Io" list shows it
          (the page draws less sharp on its own if it falls under 40 frames a second).
For the hub: Not ready to bring in yet (steps 2 to 4 to come). When it is: take moon-faire-witches/world-map/ and this
          slip. Build: node tools/build.mjs --offline moon-faire-witches/world-map/envoi-map-where.html.
Open:     0. For the hub: the page's textures are packed from texture-packs/made/ as it stands on work/textures-made;
             this branch doesn't hold that folder. After that job is brought in, make-ground-layers.mjs runs as is.
             The tree models came from Chris's upload, not from a repository: if they live in one of his repositories
             too, the labels could name it. His Forest Builder's grass, bushes and props are not brought in.
             For Chris: zone 3 reads strongly purple (his frosted heather card); say if it should be calmer. The
             laptop level's frame rate on his MSI.
          1. For Chris: the frame rate on his phone, and whether the land reads right (the heights are inferred: tell
             me any hill, cliff or valley that should be otherwise, and the reader can be told).
          2. Of the places built in 3D, only their buildings are on the map (not walls, wells, bridges, jetties, lamps).
             Misthollow's houses sit on steep ground and some are half sunk in it.
          3. Not there yet: roads, the long bridge to the shipyard, Rotbridge, waterfalls, beaches.
             The open sea's texture still shows its repeat from far above: art-requests/world-map-round-1.md asks
             Chris for a sea made to be seen from high up, and for layered mountain rock.
          4. For Chris: are the walking places where he sees them? The jetty is west of Wickhollow on foot, but the
             Magpie's dock is east of it on the atlas; the map keeps it at the dock.
          5. Answered (20:18): Skies' four ships, the next ship part of each gate between zones.
          7. To make the map reflect the game's places truly (Chris asked what it would take): three passes. (a) Each
             place's own ground on the map: its paths, cobbles, lawns, water, bridge, walls, steps, well and jetties,
             read from its place file as the buildings are, the map's land shaped level under it. (b) Each place's own
             trees where the game has them (its -trees.js file), and the wild places' wide fields, thickets, rocks and
             fog colour. (c) Lining places up with each other: exits pointing at the next place, roads between. The
             catch is scale: a place is about 61 m across and the map is 46 km, so places stay drawn about 7.5 times
             life size, as now. Waiting on Chris to say go, and which place first.
          6. For the world-3d job, when the zone shell is in: its travel hook opens WorldMap.create with Io's place
             and spot, and the zones reached (from the shared save).
