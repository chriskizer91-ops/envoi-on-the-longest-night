# Made textures

Chris's finished textures, from the prompts page (`../tools/build_prompts.py`), each under the file name on its card
(for example `shared_cobbles_town.png`). Wherever a made texture is here, the 3D uses it in place of the stand-in with the
same id.

## Keep everything labeled

Chris (November 16, 2026): make sure everything is staying labeled, and keeps being labeled, so these textures can be found
and used again in his future games. So every picture here:

- keeps the file name on its card (never renamed to a number or a date);
- has a row in `index.csv`: its file, label, kind, round, the zip it came in, its card's title and place, its size and its
  checksum, and a note if it has one;
- keeps the prompts that made it, in `prompts/` (one file per zip, exactly as the zip had it).

Anything added later gets the same three things. If a picture is ever moved or copied to another game, its row and its
prompts go with it.

## What is here

Rounds one and two, complete: 53 + 77 = 130 pictures, from Chris's 21 zips (`Envoi-Round1-Part-01` to `-08`,
`Envoi-Round2-Part-01` to `-13`), kept exactly as he made them (checked against each zip's checksums).

Round three (235 pictures: flat fronts, roofs from above and plants) is not being made for now: the 3D builds house fronts
and roofs from these textures, and a few plants may be asked for once the 3D places are built (the project document
`claude/textures-in.md`).

## Checked when they came in

Every picture matched its card by name, the card's shape, and (for the 17 cut-outs) a plain mid-grey background. Each
surface was looked at repeated 2 x 2. Notes on the ones that need one are in `index.csv`:

- A visible line where it repeats, to look at in the 3D (Chris decides whether to make them again): a line across the
  picture where its top edge meets its bottom edge in `frozen_waterfall_ice`, `jetty_planks_snow`, `shared_planks_wall`
  and `shared_sky_night`; a line down it where its left edge meets its right edge in `road_cobbles_snow`, and a faint one
  in `desert_ground`.
- Repeats left to right only, as its card asks: `dawnroost_palisade`, `coastal_cliff`, `stream_ice_edge`,
  `shared_drystone`.
