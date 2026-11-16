SLIP: world-map
State:    Working: step 1 of 4 rebuilt as a real 3D model of the land and sent to Chris (November 16, afternoon).
          Next: step 2 (choosing where to go, the dotted line). Step 3 (the flight) waits on Chris: which ship he flies.
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
Branch:   work/world-map (from work/world-3d at 0046851)   Commit: bafe30a
Files:    moon-faire-witches/world-map/ (all new to the game): README.md, envoi-map-where.html, map/map3d.js,
          map/places.js, map/art.js, map/map.css, art/aethermoor-terrain-height.png, art/aethermoor-terrain-kinds.png,
          art/LABELS.md (what each art file holds), tools/make-terrain.mjs, tools/check-places.mjs, tools/shots.mjs,
          tools/touch-test.mjs
          moon-faire-witches/workshop/slips/world-map.md
          (The first build's art/night-1..4.avif, art/height.png, art/land.png and tools/make-map-art.mjs are gone.)
          Nothing else changed.
File for Chris: envoi-map-where.html (2.0 MB, works offline). It opens on the whole land and flies down to Io at
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
Checked:  check-places.mjs: all 21 places on land (or at the water's edge) in their own zones, all 7 landings in their
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
Open:     1. For Chris: the frame rate on his phone, and whether the land reads right (the heights are inferred: tell
             me any hill, cliff or valley that should be otherwise, and the reader can be told).
          2. The places already built in 3D aren't matched one for one (a walking place is a thumbnail at this
             height): each town is a handful of roofs in the right spot. Could be done for the towns if Chris wants.
          3. Not there yet: roads, the long bridge to the shipyard, Rotbridge, waterfalls, beaches.
          4. For Chris: are the walking places where he sees them? The jetty is west of Wickhollow on foot, but the
             Magpie's dock is east of it on the atlas; the map keeps it at the dock.
          5. For Chris, before step 3: which ship he flies (the Magpie, or Skies' Zephyr skiff, Gale, Tradewind or
             Tempest).
          6. For the world-3d job, when the zone shell is in: its travel hook opens WorldMap.create with Io's place
             and spot, and the zones reached (from the shared save).
