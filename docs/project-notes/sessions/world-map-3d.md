# Session note: the 3D world map (step 1 of travel)

Written November 18, 2026, as a wrap-up before the game is merged into a new repository.

## What this conversation built

Step 1 of the travel plan (project document `claude/travel-and-3d-map.md`): a 3D map of Aethermoor that shows where
Io is. Everything is in `moon-faire-witches/world-map/` (its `README.md` describes it in full; the job's slip is
`moon-faire-witches/workshop/slips/world-map.md`).

- A real 3D model of the land, its heights inferred from the day atlas (`tools/make-terrain.mjs`): nothing of the
  painting is printed on it. It turns, tips, zooms and slides under the fingers.
- The ground in Chris's made textures, each zone coloured as it looks in the game; two levels of detail in one page
  (phone, laptop).
- Trees from Chris's Forest Builder models at three levels of detail, simple shapes from far off.
- A flat sea, still rivers and lakes, worn mountains with moon shadows.
- All 21 walking places as the 3D game builds them (ground, water, houses, walls, bridges, jetties, trees, lamps),
  taken from the 3D world's own engine by `tools/make-places.mjs`, drawn 7.5 times life size.
- The bog at sea level round Bogmire and the fen's dark heart, with cliffs at its shore.
- A violet night over zones 1 and 2; a thin violet dashed line for the edge of Io's zone; bare trees as twigs from
  far off.

The page: `moon-faire-witches/world-map/envoi-map-where.html`. Build it as one offline file with
`node tools/build.mjs --offline moon-faire-witches/world-map/envoi-map-where.html` (about 8.6 MB).

## Branch and last commit

- Repository: `chriskizer91-ops/envoi-on-the-longest-night`
- Branch: `work/world-map` (from `work/world-3d` at 0046851)
- Last commit of the work: `0c0a0b1` (this note is the commit after it)

It reads, and does not change, `work/world-3d` (places taken at 8b876cc) and `work/textures-made` (textures at
bb4a5f0). Nothing was copied from the Skies of Aethermoor repository.

## Artifact links

None. Every build was sent to Chris as a downloadable offline HTML file, made from the page above by the build
command; nothing exists only as an artifact.

## Chris's decisions made here

(Most are also in the slip, which is mirrored to the project as `claude/slips/world-map.md`.)

- The map is a true 3D model of the land, not the atlas painting laid on a shape. It is a terrain map: towns barely
  show from high up.
- Flights between zones use Skies of Aethermoor's four ships; the next ship is part of each gate between zones.
- One file serves phone and laptop; the laptop level is two to three times as detailed.
- An AI-painted picture laid over the land was advised against, and he let it go.
- No surf ripples along the coast; rivers and lakes lie flat and still.
- Places are drawn about 7.5 times life size, correct in layout, in less detail than the game. The 3D world's floor
  plans are locked for the most part (it is being reskinned).
- Bogmire and the fen's dark heart are swamp at near sea level, bog all the way to the sea, with cliffs at the shore.
- The zone line must not look like a strip of sand.
- Zones 3 and 4 have the right colours. Zones 1 and 2 lean toward the game: a gentle violet night, green and purple
  at once. A place's ground there can be the map's generic grass rather than the game's own plants. No filter was
  put on the game itself.
- Dead trees are twigs from far off, not blobs.

## Unfinished

- Steps 2 to 4 of travel: choosing where to go (a dotted line for a flight), the flight in Skies of Aethermoor,
  landing back in the zone page. Not started.
- Frame rates on Chris's phone and laptop were never measured (only checked headless); zoomed in on a town is the
  heaviest view.
- The forest road to Dawnroost still shows as a faint paler patch from high up.
- A place's own stream or pond stops at the place's edge; it does not run on into the map's rivers.
- Dead trees in the wild land outside the places still use the cone or round shape from far off.
- Not on the map yet: roads between places, the long bridge to the shipyard, Rotbridge, waterfalls, beaches.
- The places were taken before the reskin job changed the 3D world's textures: run `tools/make-places.mjs` again
  once the reskin settles.
- The world-3d job's travel hook (opening this map from the game's pause menu) is not wired.
