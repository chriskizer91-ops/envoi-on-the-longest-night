# Chris's texture library, and what it gives the 3D Envoi

Chris (November 16, 2026): he has "a very healthy collection of texture packs" from his other games, and wants to see what
they can do for this game. This folder is the first step: every texture pack in his repositories, found and sorted, and
matched against the 365 cards on the 3D Envoi's prompts page (`../texture-packs/`).

## The library: 388 pictures in 13 packs, from 9 repositories

All 27 of Chris's repositories were searched, on every branch (45,329 picture files, 10,449 different ones). Most are
characters, paintings, screens and icons; these are the texture packs:

| Pack | Look | Pictures | Where |
|---|---|---|---|
| Moon Faire: the open world | Painted (same style as Envoi) | 52 | `moon-faire/game/openworld/round` |
| Moon Faire: the open world, game copies | Painted (same style as Envoi) | 34 | `moon-faire/game/openworld/data` |
| Iron Howl 3: yard, docks and fields | Photo-like, with bump maps | 116 | `iron-howler-4/game/art` |
| Last Road: the outback | Photo-like | 29 | `last-road/models/textures` |
| Mud Lab | Photo-like | 1 | `mud-lab/base/textures` |
| Molten (arcade): forge and frost | Photo-like | 17 | `HYPERDOT-ARCADE/v2/src/molten3d/art` |
| Claw machine (arcade): plush fabrics | Photo-like | 6 | `HYPERDOT-ARCADE/v2/src/claw3d/art/fabric` |
| Back room RC track (arcade) | Photo-like | 4 | `HYPERDOT-ARCADE/backroom/art/rc` |
| Creature Catch: cosy 3D tiles | Cartoon | 48 | `atoms-games-/creature-catch-model-sheets/chapter1/game/assets/tiles` |
| Creature Catch: pixel tile sets | Pixel art (2D) | 23 | `atoms-games-/creature-catch/art/tiles` |
| Rut Access: off-road ground | Photo-like | 17 | `cargames/rut-access/textures` |
| Brightvein: the claim | Lightly painted | 20 | `brightvein/assets/claim` |
| Farm: paper cut-outs | Paper cut-out | 21 | `farm-project/art-farm/assets/paper` |

`library.json` lists every picture: its pack, kind (ground, stone and walls, wood, roofs, cloth, water/ice/snow, plants,
metal, flat views of objects, signs, sky and effects, sheets, 2D tile sets, bump maps), size, the branches it is on, and
where else the very same picture is kept (170 of them are in a second repository or folder: Iron Howl's whole
pack is also in HYPERDOT-ARCADE, Creature Catch's tiles are kept three times, Moon Faire's game folder has smaller copies).

## What it gives the 3D Envoi

Moon Faire's open-world pack is painted in the same style, from the same prompt rules, as Envoi's cards. The other packs
are photo-like, cartoon, pixel or paper cut-out: the right subject sometimes, but not the painted look.

- **Ready now: 16 cards.** A Moon Faire texture showing the same thing the card asks for. Each is shifted into the
  colours of Envoi's painting (its stand-in, or its close-up for cut-outs) by `tools/grade.py`, and saved under the card's
  file name. Chris has them in a zip; when he approves them he brings the `made` folder to the hub with round 1.
- **A head start: 73 cards.** The right subject with something different (one clump wanted, a row given; a
  photo look; another colour). An extra picture to attach to the card's prompt, or a sharper stand-in.

| Card file | Card | Round | Moon Faire's file (in `chriskizer91-ops/moon-faire`) | Note |
|---|---|---|---|---|
| `shared_awning_stripes.png` | Striped awning cloth | 1 | `game/openworld/round1/Moon-Faire-Round1-Materials/cloth_red_cream_stripe.png` |  |
| `shared_boardwalk_planks.png` | Pier planks | 1 | `game/openworld/round1/Moon-Faire-Round1-Materials/wood_planks.png` | Turned on its side so the planks run left to right, as the card asks. |
| `shared_cobbles_town.png` | Town cobbles (Wickhollow) | 1 | `game/openworld/round3/Moon-Faire-Round3-Ground-Plants/ground_cobbles.png` |  |
| `shared_drystone.png` | Rounded stone wall | 1 | `game/openworld/round1/Moon-Faire-Round1-Ground/wall_drystone.png` | Moon Faire's wall is wide (3:2), as it was made: the 3D sets how often it repeats. |
| `shared_grass_meadow.png` | Meadow grass | 1 | `game/openworld/round1/Moon-Faire-Round1-Ground/ground_turf.png` |  |
| `shared_planks_wall.png` | Dark board house wall | 1 | `game/openworld/round3/Moon-Faire-Round3-Materials/wood_dark.png` | Turned on its side so the boards stand upright, as the card asks. |
| `shared_rock_cliff.png` | Grey rock cliff face | 1 | `game/openworld/round1/Moon-Faire-Round1-Ground/ground_rock.png` |  |
| `shared_roof_shingle.png` | Mossy wooden shingle roof | 1 | `game/openworld/round2/Moon-Faire-Round2-Materials/roof_shingles.png` |  |
| `shared_stone_wall_rough.png` | Rough stone wall | 1 | `game/openworld/round2/Moon-Faire-Round2-Materials/stone_rubble.png` |  |
| `wilds_heath_ground.png` | Heather moor | 1 | `game/openworld/round1/Moon-Faire-Round1-Ground/ground_heather.png` |  |
| `camp_tent_canvas.png` | Tent canvas | 2 | `game/openworld/round1/Moon-Faire-Round1-Materials/cloth_cream_awning.png` |  |
| `moor_bracken_heather.png` | Dead bracken and heather | 2 | `game/openworld/round2/Moon-Faire-Round2-Plants/plant_bracken.png` |  |
| `moor_heather_grass.png` | Moor grass and heather | 2 | `game/openworld/round1/Moon-Faire-Round1-Ground/ground_heather.png` |  |
| `stable_straw.png` | Straw on a stable floor | 2 | `game/openworld/round3/Moon-Faire-Round3-Materials/straw.png` |  |
| `nightsq_lamp_post.png` | Iron lamp post | 3 | `game/openworld/round2/Moon-Faire-Round2-Props/skin_lantern_post.png` | Iron post with a curled bracket and a hanging lantern, as in the painting. |
| `thorn_dead_tree.png` | Dead thorn tree | 3 | `game/openworld/round2/Moon-Faire-Round2-Plants/plant_thorn_tree.png` | Square, not tall: the tree leans like a windswept thorn. |

`matches.json` has all 89 matches, each with its card, place, round, fit, source file and note.

## How it was made

`tools/`: `index.py` lists every picture on every branch without downloading them; `pick.py` picks the texture packs;
`catalog.py` sorts them; `cards.py` rebuilds the prompts page's card list; `matches.py` is the hand-made match list (each
match checked by eye against the painting); `grade.py` shifts colours (Lab mean and spread, foreground only for cut-outs);
`build_page.py` makes Chris's page and zip. The sibling repositories were only read.
