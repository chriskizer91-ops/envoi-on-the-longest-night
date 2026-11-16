# The north: texture packs

Five places from the north of *Envoi on the Longest Night*, each in its own folder with `inventory.md` (everything a 3D
build needs, with where it is in the painting), `refs/` (close-up crops to give ChatGPT), `stand-in/` (seamless
textures made now from the paintings, so a 3D build can start today) and `prompts.json` (one prompt per texture or
object for Chris to make the real ones).

| Place | Painting | Inventory rows | Stand-ins | Prompts | Props |
|---|---|---|---|---|---|
| `crossroads`: the northern crossroads (Halcyon's ambush) | `walk-northern-crossroads.png` | 22 | 3 | 11 | 4 |
| `shipyard`: Ysmera Brightkeel's shipyard | `walk-shipyard.png` | 31 | 2 | 9 | 12 |
| `frozen-pass`: the frozen pass | `walk-frozen-pass.png` | 17 | 4 | 9 | 5 |
| `misthollow`: Misthollow | `walk-misthollow.png` | 30 | 2 | 12 | 8 |
| `moonwell`: the dead Moonwell (the final battle) | `walk-misthollow-moonwell.png` | 20 | 3 | 10 | 6 |
| **All five** | | **120** | **14** | **51** | **35** |

## Shared textures

The north is where snow, ice and frost show best, so they are made here. Each shared texture is made once (stand-in and
prompt) in the place where it shows best, and only listed in the others.

| Shared id | Made in | Also used in | New? |
|---|---|---|---|
| `shared_snow` (deep soft snow) | frozen-pass | crossroads, misthollow | from the brief |
| `shared_ice` (cracked river ice) | frozen-pass | crossroads (the frozen pond) | from the brief |
| `shared_grass_frosted` (dry moor grass with frost) | crossroads | | from the brief |
| `shared_snow_patchy` (thin snow over grass and earth, where the snow begins) | crossroads | | new |
| `shared_rock_cliff_snowy` (dark rock columns with snow on the ledges) | frozen-pass | crossroads, shipyard, misthollow | new: the north's rock is always under snow, so it is kept apart from `shared_rock_cliff` |
| `shared_stone_wall_frosted` (pale cut-stone castle blocks, frost in the joints) | moonwell | shipyard, misthollow, crossroads (the ruined walls) | new: the north's walls are coursed castle blocks, not the rough house walls of `shared_stone_wall_rough` |
| `shared_roof_slate_snow` (slate roof with snow on every slate) | shipyard | misthollow (small roofs), moonwell | new |
| `shared_setts_frosted` (squared grey-blue setts, frost in the joints) | misthollow | moonwell (the street) | new: Misthollow's streets are small squared setts, not Wickhollow's rounded cobbles |
| `shared_halftimber_bay` (one bay of timber-framed wall with warm windows) | misthollow | shipyard | new; a skin, not a repeating material (see below) |
| `shared_pine_snowy` (pine heavy with snow) | frozen-pass | misthollow | new; a plant cut-out |
| `shared_cobbles_town` | wickhollow | shipyard (the yard and the bridge) | from the brief; the shipyard's cobbles are the same rounded grey-brown kind |
| `shared_boardwalk_planks` | (another group) | shipyard (pier, quay and the slipway's ramp) | from the brief |

## Things I was unsure of

- **Half-timbered walls** are a skin (`shared_halftimber_bay`, one bay with its windows, repeated bay by bay) rather
  than a repeating material: no patch of timber framing in any painting is free of windows, so a seamless stand-in
  cut from them repeated badly.
- **One-piece ground decals** (the crossroads' compass ring, Misthollow's star inlays in the street, the shipyard's
  ice floes) are skins drawn from straight above, so their prompts use the `roof` rules (plan view on grey).
- **Snow stand-in.** The snow in the painting is all small lumps and drifts, so the stand-in comes from a small patch
  and is soft and a little blurry. It will do until Chris's real one.
- **The crossroads road** stand-in is cut from the west road; the reference crop shows the north road. They are the
  same paving.
- **The shipyard's sea** is its own texture (`shipyard_icy_sea`), not `shared_water_dark`, which the brief describes as
  still black water (a bog's); the sea is navy with small glinting ripples.
- **Skies.** The walking paintings are seen from above and show no sky, so the sky rows point at the fight paintings:
  the crossroads at `battle-backgrounds/13-northern-crossroads.png`, the frozen pass at
  `backdrops/battle-frozen-road.png`, Misthollow and the Moonwell at
  `battle-backgrounds/14-ironhold-misthollow-dead-moonwell.png` (the eclipsed moon). The shipyard's row says it is all
  sea to the horizon. Skies have reference crops but no prompts.
- **The frozen pass's mist** is faint in the painting; its reference crop mostly shows the pines it drifts between.
- **The Moonwell's carving** reads as a moth with spread wings between crescent moons; I described it that way.
- **Misthollow's frozen trough** (where the letter in a jar is) is small; the box at the spot in `maps.js` shows a
  little wooden trough with a tub beside it.

## How it was made

`tools/places.py` holds every row (what it is, where, the stand-in patch and the prompt); `tools/build.py` makes all
five folders from it (`python3 -I tools/build.py`, add `--sheets <dir>` for contact sheets to check by eye).
`tools/view.py`, `tile_test.py` and `tile_batch.py` were used to look at the paintings and try stand-in patches tiled
2 x 2. Every stand-in was looked at tiled 2 x 2 and patches with seams or repeating blotches were replaced.
