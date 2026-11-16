SLIP: world-map
State:    Working: step 1 of 4 is built and sent to Chris (November 16). Next: step 2 (choosing where to go, the dotted
          line). Step 3 (the flight) waits on Chris: which ship he flies.
Plan:     From the project document claude/travel-and-3d-map.md (its starter text). A demo page at a time, one offline
          HTML each: 1) the 3D map of Aethermoor from the night atlas, showing where Io is; 2) choosing where to go, on
          foot or by flight, with a dotted line from here to there for a flight; 3) the flight in Skies of Aethermoor on
          the night map, as many raiders as the flight is long; 4) landing, back into the zone page at that landing.
          Files only in moon-faire-witches/world-map/ (and this slip); moon-faire-witches/world3d/ is the world-3d
          job's: the map uses its zone pages' travel hook once the zone shell is in, and asks here for anything it needs
          changed there. Skies (chriskizer91-ops/airship-game-in-aethermoor-) is read only; anything copied from it names
          its source in the commit message.
Branch:   work/world-map (from work/world-3d at 0046851)   Commit: 200d29d
Files:    moon-faire-witches/world-map/ (all new): README.md, envoi-map-where.html, map/map3d.js, map/places.js,
          map/art.js, map/map.css, art/night-1.avif to night-4.avif, art/height.png, art/land.png,
          tools/make-map-art.mjs, tools/check-places.mjs, tools/shots.mjs, tools/touch-test.mjs
          moon-faire-witches/workshop/slips/world-map.md
          Nothing else changed.
File for Chris: envoi-map-where.html (3.9 MB, works offline). It opens on all of Aethermoor and flies down to Io at
          Wickhollow. One finger drags the map, two pinch to zoom and twist to turn. The moon button (bottom right)
          finds Io again. "Move Io" (bottom left) puts her in any of the 21 walking places, to see each one.
Done:     The night atlas over a height map read off the day atlas: low water, land rising from its shores, mountains
          where the painting has rock and snow (highest round Peak's Veil, Frostmere and Misthollow, about 1,600 m),
          the edges fading into open sea, a night sky with stars and the moon in the north-west. The four zones from
          World.BANDS: zones not reached yet, and everything outside the four, under a slow drifting mist; a faint line
          where two zones meet; a gold line round Io's zone. Io's pin: a beam of moonlight, a crescent on top, a ring
          pulsing on the ground, her name tag (Io and the place). Close in: her zone's other places by name (a gold
          diamond where the Magpie lands) and the other open zones' landings; overlapping names give way, Io's first.
          The 21 walking places placed on the atlas (map/places.js, each with why); her spot in her painting moves her
          pin within the place's 72 x 48 atlas pixels. A map anyone can open: WorldMap.create(host, { art, open, io })
          (README, "For the zone pages").
Checked:  check-places.mjs: all 21 places on land and in their own zones, all 7 landings in their zones; each place's
          exits on foot against the way they lie on the map: all within an eighth of a turn, except the jetty (below).
          touch-test.mjs at 412 x 915, as a phone's fingers: 8 of 8 (opens on the whole map, 12,881 away; flies down to
          Io at Wickhollow exactly; a drag moves the map; a pinch zooms 1,150 to 550; a twist turns it 34°; "Move Io"
          lists the 21 places; choosing Misthollow flies there and names it; the moon button finds her again, north up).
          Stills at 412 x 915 and 915 x 412 for 10 views (the whole map, every zone, close in, turned round): 0 page
          errors. Counts: about 200,000 triangles for the whole map, 100,000 to 150,000 close in; 9 to 11 draw calls.
          Frame rate on the Pixel 7a: not measurable headless; the "Move Io" list shows it (the page draws less sharp
          on its own if it falls under 40 frames a second).
Chris said: (not yet)
For the hub: Not ready to bring in yet (steps 2 to 4 to come). When it is: take moon-faire-witches/world-map/ and this
          slip; nothing else changed. Build: node tools/build.mjs --offline moon-faire-witches/world-map/envoi-map-where.html.
Open:     1. For Chris: are the walking places where he sees them? The jetty is west of Wickhollow on foot, but the
             Magpie's dock (its landing on the atlas) is east of it; the map keeps the jetty at the dock, where flights
             land. Eldergrove's edge sits east of the northern camp (as the walk goes), not at the painted Eldergrove
             village to the south-west; Frostmere's shore is south of the frozen pass, by the river out of Frostmere,
             not on the lake itself (as the walk goes).
          2. For Chris, before step 3: which ship he flies: the Magpie, or one of Skies' own (the Zephyr skiff, the Gale,
             the Tradewind, the Tempest).
          3. For the world-3d job, when the zone shell is in: its travel hook opens WorldMap.create with Io's place and
             spot, and the zones reached (from the shared save).
          4. The night atlas has a visible seam where its left column of tiles meets the middle (the painting's own; the
             left column is a little lighter). Clouds over the map, or a blend along the join, could hide it later.
