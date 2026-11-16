# Wickhollow group: texture packs

Four places from the start of the game: Wickhollow's square, Io's cottage, the jetty and the Thornwood. Each folder has
`inventory.md` (everything a 3D build needs, one row each), `refs/` (a reference picture cut from the painting for every
prompt and every prop), `stand-in/` (rough repeating textures cut from the painting so a 3D build can start today) and
`prompts.json` (the ChatGPT prompts for the real textures).

| place | painting | inventory rows | stand-ins | prompts | props |
|---|---|---|---|---|---|
| `wickhollow` (the town square) | `walk-wickhollow-square.png` | 55 | 6 | 25 | 14 |
| `cottage` (Io's cottage and garden) | `walk-wickhollow-cottage.png` | 52 | 4 | 20 | 16 |
| `jetty` (Quill's jetty on the lake) | `walk-wickhollow-jetty.png` | 32 | 4 | 12 | 11 |
| `thornwood` (the bridge into the Thornwood) | `walk-thornwood.png` | 26 | 6 | 12 | 8 |
| **all four** | | **165** | **20** | **69** | **49** |

Some rows only point to a texture made in another of the four places (to avoid making the same thing twice); the
inventory says where.

## Shared textures

Made here (stand-in and prompt), because they show best in these paintings:

- `shared_cobbles_town`: in `wickhollow`
- `shared_grass_meadow`: in `wickhollow`, cut from Wickhollow's fight painting (the river glade), whose meadow is much
  clearer than the walking map's small lawns
- `shared_stone_wall_rough`: in `wickhollow` (stand-in cut from the east bridge's side, the cleanest patch of wall)
- `shared_roof_tiles_red`: in `wickhollow`. **New shared id**: every roof in the town is small red clay tiles, and none
  of the listed shared roofs (slate, thatch, shingle) fits
- `shared_bark_oak`: in `cottage` (the great oak)
- `shared_boardwalk_planks`, `shared_water_dark`, `shared_drystone`: in `jetty`
- `shared_awning_stripes`: in `jetty`. **New shared id**: the red-and-cream striped awning cloth of Quill's and Nettie's
  stalls, a market-stall cloth that should repeat in other towns
- `shared_dirt_track`, `shared_water_river`: in `thornwood`

Listed only (used in these places, made elsewhere): `shared_forest_floor` (under the great oak by the cottage) and
`shared_planks_wall` (the square's garden shed and the forge's lean-to). Both patches here are too small or too busy, so
those are better made from a forest place and a plank-built place.

Ids starting `wick_`, `lake_` and `thorn_` are used across the four places of this group (for example `wick_leaf_canopy`,
`wick_tree_fir`, `lake_lily_pads`, `lake_reeds`) but are not game-wide shared ids.

## Things I was unsure of

- **Quill's skiff, the Magpie, is not in the jetty painting.** The game moors it at the pier's end. Its row (`jetty_skiff`)
  is listed as a prop, with a crop of the empty berth; it will need its own model or art request.
- **The skies.** None of the four walking maps shows any sky (they look down from above). `wick_sky` comes from
  Wickhollow's fight painting (the river glade) and `thorn_sky` from the Thornwood's fight painting (the bridge), which
  shows a castle on a far hill. I don't know whether that castle is a real place in the world.
- **The Thornwood's fight painting differs from its walking map.** The fight painting has thorny vines with red roses on
  the bridge, iron railings and a wide cobbled square. The walking map has an earth road, bramble with dark red berries and
  no roses. The pack follows the walking map.
- **Small things are blurry.** The paintings are 1536 x 1024, so small things like the smith's sign, the rope coils,
  mushrooms and grass tufts are only a few dozen pixels. Their reference crops are enlarged and soft, but the whole
  painting goes with each prompt as well.
- **Some stand-ins are rough.** Walls, bark and the mossy roof come from small patches enlarged a lot, so they look soft
  and you can see them repeat. They are good enough for blocking out a 3D build, not for the final look. The timber-framed
  wall's stand-in repeats a whole beam pattern, which is the right look for that wall.
- The square's walking map has some earth showing at the edges of the lanes, but almost everything walkable is cobbles.
  I listed `shared_dirt_track` there only for those edges.

## Tools

`tools/places.py` holds every row: the boxes, the stand-in patches and the prompt words. `tools/build.py` makes the
refs, the stand-ins, `prompts.json` and `inventory.md` from it. To remake a place, run
`python3 -I tools/build.py <place>` from this folder. `view.py`, `trial.py`, `rot.py` and `sheet.py` are only for
looking at crops and stand-ins.
