# Session note: the Thareia system star map

Written November 18, 2026, at wrap-up before the merge into the new repository.

## What this conversation built

A 3D star map of the Thareia system, one self-contained HTML page (three.js 0.160 from a CDN, about 235 KB):
`moon-faire-witches/star-map/thareia-system-star-map.html`.

- The twin suns (gold and blue-white, circling each other) and the far third star.
- Thareia, carrying the real Aethermoor: forests west, snow peaks north-east, mesas and desert east, the fen south,
  the central sea and the capital's island. The land is packed from the world-map job's data on `work/world-map`
  (`moon-faire-witches/world-map/art/aethermoor-terrain-kinds.png` and `aethermoor-terrain-height.png`) by
  `moon-faire-witches/star-map/tools/pack-land.py`, and sits inside the page as a 576 x 384 picture.
- Aurous, Thareia's moon, with amber crystal veins and spires; it goes round once every 500 years.
- Four placeholder planets (Unnamed I, II, IV, V), the Crystal Drift (a band of free crystal), 12 ships (hoppers and
  sailing vessels), the aether as a painted sky.
- Game-map parts: "you are here" (starts at Thareia), tap a world for its card, a crystal cost of 1 to 5 pips,
  Set course (a ship flies there and the marker moves), arrows to step through the nine places.
- Hooks for a game: `window.StarMap` (getLocation, setLocation, select, home, travelTo, rename, setYear, getYear) and
  the events `starmap:select`, `starmap:depart`, `starmap:arrive`. The top of the page's script lists them.

## Branch and commit

- Branch: `work/star-map`, new, made at wrap-up from the default branch at 627ee10. Nothing was pushed before this.
- Last commit: the one that adds this note (see `git log -1 work/star-map`).

## Artifact

- Thareia System — Aethermoor Space Map: https://claude.ai/artifact/BjcJ1MBY5pdQLF4SoHKqWZ
  (private to Chris; the page in this branch is the same as its latest version).

## Chris's decisions made here

The project document `claude/slips/star-map.md` holds these too.

- The cosmology: Thareia is the planet Aethermoor is on. Its moon Aurous orbits once every 500 years. A triple star
  system: a binary pair everything orbits, and a third star a great distance out that is still part of the system.
  Four other known planets.
- Space is the aether, not a vacuum: breathe it and you fall into a blissful sleep.
- Travel between planets is expensive and runs on aether crystal, found in the planets and in space, charged by the
  light of each star. Aurous has the highest known concentration, so its people are the wealthiest and most
  powerful. Most Thareians have traveled by crystal, on little hoppers (basically skiffs) up to larger sailing
  vessels, all with massive crystals.
- Aether crystal and the airships' amber sunstone are the same stone: amber crystals.
- No loose crystals floating about; keep the band of crystals and the ships.
- Thareia's surface should look like the 3D map of Aethermoor (the world-map job's). Only Aethermoor has an image;
  there are islands round it that Chris has maps of.

## Unfinished

- The names of the three stars and the four other planets (Chris to give them).
- Chris's island maps, to be placed round Aethermoor; and whether the rest of Thareia is roughed in or left as ocean.
- Made up here, for Chris to change: the order and looks of the four other planets; the cost rule (one pip per 55
  map units, so trips are cheaper when worlds line up); Aethermoor drawn 84 degrees wide at 26 north.
- Not joined to the game's travel (the zone pages' `W3D.zoneFly`, Skies of Aethermoor, the save `envoi3d-save`).
- The frame rate on the Pixel 7a was never measured (headless tests only: 0 page errors at 412 x 880 and 1280 x 760).
- Not built with `tools/build.mjs --offline`: the page still loads three.js from the CDN.
