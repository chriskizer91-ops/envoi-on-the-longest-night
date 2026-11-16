# Bogmire and Dawnroost group: texture packs

Four places: Bogmire and the fen's dark heart (band 1), Dawnroost and its living node (band 2). Each folder has
`inventory.md` (everything a 3D build needs, one row each), `refs/` (a picture cut from the painting for every prompt
and every prop), `stand-in/` (rough repeating textures cut from the painting so a 3D build can start today) and
`prompts.json` (the ChatGPT prompts for the real textures).

| place | painting | inventory rows | stand-ins | prompts | props |
|---|---|---|---|---|---|
| `bogmire` (the stilt town on the fen) | `walk-bogmire.png` | 46 | 5 | 29 | 12 |
| `bogmire-heart` (the fen's dark heart) | `walk-bogmire-heart.png` | 25 | 3 | 9 | 8 |
| `dawnroost` (the Warden waystation) | `walk-dawnroost.png` | 42 | 3 | 20 | 10 |
| `dawnroost-node` (the living sunstone node) | `walk-dawnroost-node.png` | 32 | 3 | 17 | 6 |
| **all four** | | **145** | **14** | **75** | **36** |

The "sky" rows come from each place's fight painting, which shows what lies beyond (moon, mountains, far towns).

## Shared textures

Made here (stand-in and prompt):

- `shared_boardwalk_planks`, `shared_water_dark`, `shared_planks_wall`, `shared_roof_shingle`, `shared_roof_thatch`:
  in `bogmire`
- `shared_wall_castle`: in `dawnroost`. **New shared id**: grey dressed-stone castle walls in neat courses (Dawnroost's
  curtain walls, towers and gates, and the living node's walls). None of the listed walls fits: `shared_stone_wall_rough`
  is irregular house stone and `shared_drystone` is a field wall

Listed only (used here, made by another group): `shared_cobbles_town`, `shared_stone_wall_rough`,
`shared_roof_tiles_red` and `shared_awning_stripes` (all made by group wickhollow), `shared_rock_cliff` (the hillside
boulders and cliffs round Dawnroost and the node; too small and busy here, so better made from a mountain place).

## Things I was unsure of

- **Made twice**: group wickhollow also made `shared_boardwalk_planks` and `shared_water_dark` (in its jetty). This group
  was asked to make them from Bogmire, so both exist; the game's session should keep one of each. Bogmire's planks are
  a darker, cold grey-brown, and its water near black.
- **No bog mud**: `shared_mud_bog` is not made. Bogmire stands on stilts over open water and none of the four paintings
  (nor Bogmire's two fight paintings) shows any mud, so there was nothing to cut it from.
- **Two stand-ins are not straight cuts**: Bogmire's house walls show only in slivers between windows and lanterns, so
  the `shared_planks_wall` stand-in is the boardwalk planks turned upright and recoloured to the walls' colours (its
  boards are narrow: one square covers about 4 m of wall). The sunstone's dais is too small and too bright to cut from,
  so `node_dais_stone`'s stand-in is the node's own wall blocks recoloured to the dais stone.
- **Small, soft stand-ins**: the straw (`stable_straw`) and the wildflower grass (`dawn_grass_flowers`) only show in
  small patches, so their stand-ins are blurry and show a faint repeat. The prompts will fix them.
- **The glowing veins** in the node's floor are thin in its stand-in (a patch with dense veins made stripes when
  repeated). The prompt asks for them evenly spread.
- **Dawnroost's cobbles**: the road from the north gate has a line of gold-lit cracks (the node's light seeping down). It
  is listed under `shared_cobbles_town`; a builder may want a few glowing cracks painted onto that road by hand.
- **The fen's heart**: the great wraith is not in the painting (it comes in the fight), and its green drifts of mist are
  left to a fog effect, not a texture.
- **The sun in the node's floor** is painted at a slant; its prompt asks for it as a perfect circle seen from above.

## How it was made

`tools/places.py` holds everything found in the paintings; `tools/build.py` turns it into the four folders
(`python3 -I tools/build.py`). `tools/view.py`, `grid.py`, `trial.py`, `tiles.py` and `sheet.py` were used to look at
the paintings and check the stand-ins (each tiled 2 x 2); `tools/montage.py` pieces the boardwalk stand-in together from
clean strips between the stalls and carts.
