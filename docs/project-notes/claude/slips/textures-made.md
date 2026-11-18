SLIP: textures-made
State:    Ready: rounds one and two are all in (November 16, 15:40). Round three is not being made for now.
Branch:   work/textures-made, from claude/moon-faire-witches at 4653cbe; newest commit bb4a5f0. One commit and push per zip.
Files:    moon-faire-witches/texture-packs/made/ only: 130 pictures, index.csv, prompts/ (21 files), README.md.
Count:
- **Round one: 53 of 53 in.**
- **Round two: 77 of 77 in.**
- **Need making again: none required.** Six show a line where they repeat; look at them in the 3D first (below).

**Keep everything labeled (Chris, November 16).** Everything saved here stays labeled, and keeps being labeled, so it can
be found and used again in his future games. Every picture keeps its card's file name; has a row in `made/index.csv` (file,
label, kind, round, the zip it came in, card title, place, size, checksum, note); and keeps the prompts that made it, in
`made/prompts/<zip>.json`, exactly as the zip had them. Anything added later gets all three. Anyone copying a texture to
another game takes its row and its prompts with it.

How each zip was checked: every picture matched to its card by file name, and its checksum against the zip's own
`image-index.csv` (0 mismatches, also checked again on the pushed branch). Its shape matches its card (square, 2:3 or
3:2). The 17 plants and flat views have a plain mid-grey background (0% of edge pixels off grey). Every surface was looked
at repeated 2 x 2, with a full-size close-up of where the copies meet. The seam number (jump across the edge against the
roughest 5% of steps inside; stand-ins stay at or under 1.5) flagged 75 of 113 surfaces, mostly smooth water, snow and
grass where faint differences look big. By eye, most join cleanly:

- **A line across it, where its top edge meets its bottom edge:** `frozen_waterfall_ice`, `jetty_planks_snow` (snow cut
  across the planks), `shared_planks_wall` (all boards cut at one height), `shared_sky_night`.
- **A line down it, where its left edge meets its right edge:** `road_cobbles_snow`; faint in `desert_ground`.
- **Repeats left to right only, as its card asks** (top and bottom are different edges): `dawnroost_palisade`,
  `coastal_cliff`, `stream_ice_edge`, `shared_drystone`.

Zips taken (21, all November 16): Envoi-Round1-Part-01 to -08 (7, 7, 7, 9, 7, 6, 7, 3 pictures) and
Envoi-Round2-Part-01 to -13 (6, 7, 6, 5, 5, 6, 6, 6, 5, 6, 7, 8, 4).

Sent to Chris: each round repeated 2 x 2 in one picture (round1-all-53.jpg, round2-all-77.jpg), and the six with a line,
each with a close-up (six-to-look-at.jpg).

For the hub: fetch work/textures-made whenever you like; it changes only made/. Nothing else on the branch differs from
claude/moon-faire-witches at 4653cbe.
For world-3d: every place can now swap in Chris's made textures by file name. When you show Chris a place before and
after, include any of the six above that it uses, so he can decide whether to make them again.
Open:     1. Chris decides on the six once he sees them in the 3D.
          2. The texture-library's 16 Moon Faire textures (its slip) are no longer needed for these cards: Chris made all
             of rounds one and two himself.
