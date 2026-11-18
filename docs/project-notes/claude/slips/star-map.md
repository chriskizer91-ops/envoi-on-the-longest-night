SLIP: star-map
State:    Working: the Thareia system as a 3D star map, a claude.ai artifact ("Thareia System — Aethermoor Space Map",
          https://claude.ai/artifact/BjcJ1MBY5pdQLF4SoHKqWZ). Not in the repository yet. Since November 17, 14:20 it
          carries the real Aethermoor on Thareia, read from the 3D map job's land data. Next: Chris's island maps onto
          the planet, the names of the stars and the four other planets, and what the rest of Thareia's surface is.
Chris said: (November 17, 06:10) The cosmology: Thareia is the planet Aethermoor is on; its moon Aurous goes round it once
          every 500 years; a triple star system (a binary pair everything orbits, and a third star a great distance out
          that is still part of the system); 4 other known planets. Space is the aether, not a vacuum: breathe it and
          you fall into a blissful sleep. Travel between planets is expensive and runs on aether crystal, found in the
          planets and in space, charged by the light of each star. Aurous has the highest known concentration, so its
          people are the wealthiest and most powerful. Most Thareians have traveled by crystal, on little hoppers
          (basically skiffs) up to larger sailing vessels, all with massive crystals.
          (07:08) It is going to be the star system map for his game: improve it.
          (14:20) Aether crystal and the airships' amber sunstone are the same stone: amber crystals. Remove the loose
          crystals floating about; keep the band of crystals and the ships. Only one continent of Thareia (Aethermoor)
          has an image; there are islands round it that he has maps of. He wants Thareia's surface to look like the 3D
          map being built in this project (world-map), "like you're deciding the rough geography of my planet. Maybe
          not." He sent three photos of the world-map page on his laptop.
Files:    One self-contained HTML page (three.js 0.160 from a CDN, about 230 KB), kept as the artifact above. The land
          it carries is packed from work/world-map: moon-faire-witches/world-map/art/aethermoor-terrain-kinds.png and
          aethermoor-terrain-height.png (576 x 384, north up; red = kind x 20, green = height, 24 = sea level).
Done:     The twin suns (gold and blue-white, circling each other) and the far star, with moving surfaces and rays.
          Thareia with Aurous (crystal veins and spires), four placeholder planets (Unnamed I, II, IV, V: a lava
          world, a desert world, a ringed giant, an ice world), the Crystal Drift (a band of free crystal), 12 ships
          (hoppers and sailing vessels) that steer round the suns, the aether as a painted sky with drifting motes.
          Game-map parts: "you are here" (starts at Thareia), tap a world for its card, a crystal cost of 1 to 5 pips,
          Set course (a gold-sailed ship flies there and the marker moves), arrows to step through the nine places.
          Hooks for a game: window.StarMap (getLocation, setLocation, select, home, travelTo, rename, setYear, getYear)
          and the events starmap:select, starmap:depart (from, to, crystal), starmap:arrive (from, to).
          November 17, 14:20: every crystal amber; the loose crystals gone; Thareia's invented continents replaced by
          Aethermoor from the world-map job's own data (forests west, snow peaks north-east, mesas and desert east,
          the central sea and the capital's island, the fen south) on an open ocean; Thareia turns Aethermoor to face
          you when chosen.
Checked:  Headless Chrome at 412 x 880 and 1280 x 760: every body, a journey Thareia to Aurous and to Unnamed IV, the
          tap-through (label, arrow, Set course, arrive), rename, the Ages speed: 0 page errors. Frame rate on the
          Pixel 7a not measurable headless (the page draws less sharp on its own under about 37 frames a second).
Open:     1. Made up, for Chris to change: the order and looks of the four other planets; the cost rule (one pip per
             55 map units of distance, so trips are cheaper when worlds line up); Aethermoor drawn 84 degrees wide at
             26 north (to scale it would be a speck: the atlas is 46 km across); the rest of Thareia is open ocean.
          2. Names wanted: the three stars and the four other planets (the lore compendium in New-game may have them;
             this conversation couldn't open that repository).
          3. Not joined to Envoi's travel yet: the world-map job owns travel inside Aethermoor (W3D.zoneFly, Skies of
             Aethermoor, the save envoi3d-save). Whether the star map shares that save and the Crystal Shards is
             Chris's call.
