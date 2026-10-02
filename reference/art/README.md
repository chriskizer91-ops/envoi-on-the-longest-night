# Reference Art

Concept art from Chris. The model touch-ups match these. Most files are PNG; the ones that arrived as WebP are kept as they came. Where a sheet comes in an A and a B version, A is the main one and B covers what A leaves unclear.

## Model and action sheets

From art request 01 (`docs/art-requests/01-model-sheets.md`), all received October 2, 2026.

| Model | Model sheet | Action sheet |
|---|---|---|
| Sol | `sol-model.webp` (A, with the 1.78 m ruler), `sol-model-b.webp` | `sol-actions.webp`, `sol-actions-b.webp` (12 poses) |
| Envoi | `envoi-model.webp` (A), `envoi-model-b.webp`, with a 1.6 m figure for scale | `envoi-actions.png`, `envoi-actions-b.png` (8 panels: Unfolding to Rising Away) |
| Wisp | `wisp-model.png`, `wisp-model-b.png` (views, three faces, the hollow, the frost variant) | `wisp-actions.png`, `wisp-actions-b.png` (8 poses) |
| Halcyon | `halcyon-model.png` (A), `halcyon-model-b.png` | `halcyon-actions.png`, `halcyon-actions-b.webp` (10 poses: High Guard to The Last Light, or A Gentler Light in B) |
| Shadow Wraith | `wraith-model.webp` (A, with the 2.2 m ruler), `wraith-model-b.webp`: soul-green, with the hood, hand, ribcage and scythe close up | — |
| Great wraith | `great-wraith.webp` (A: stolen flames in its ribs and robe), `great-wraith-b.webp` (B: the stolen lights as lanterns), `great-wraith-c.webp` (C: flames, with lanterns on its neck chain), each with a 1.6 m figure | The same sheets: sweep, swallowing lamplight, breathing stolen fire, released |

Every sheet from the request is in.

## Earlier sheets and scenes

From Chris's first uploads, October 1, 2026.

| File | What it is |
|---|---|
| `noctara-model-sheet-a.png`, `noctara-model-sheet-b.png` | Noctara's model sheets. B, with the gold filigree, won. |
| `noctara-void-sphere-scene-a.png`, `noctara-void-sphere-scene-b.png` | Noctara casting Void Sphere at the party |
| `noctara-blackout-halcyon.png`, `noctara-blackout-silhouette.png` | Blackout: the screen goes dark and Halcyon strikes |
| `envoi-summon-scene-a.png`, `envoi-strike-scene-b.png` | Envoi's summon and strike. Lunara and Envoi keep their size next to the Witch and the wraith from these two. |
| `lunara-pose-sheet.png` | Lunara, the moth goddess summon |
| `shadow-wraith-pose-sheet.png` | The Shadow Wraith. It is violet here but soul-green in the game. |

## Battle backdrops

From art request 03 (`docs/art-requests/03-battle-backdrops.md`), all received October 2, 2026, in `backdrops/`: eight night paintings at 1448×1086 in the Night square's view. `backdrops/prompts.json` records the prompts Chris's generator used. The game's compressed copies are in `../../art/backdrops/`.

| File | Place | Fight |
|---|---|---|
| `battle-gloamwood-road.png` | The Gloamwood road | Band 1 wild fights |
| `battle-thornwood-bridge.png` | The Thornwood bridge | Band 1 wild fights |
| `battle-bogmire-boardwalk.png` | Bogmire's dark heart | The great wraith, the level 5 gate |
| `battle-warm-road.png` | The Warm Road | Band 2 wild fights |
| `battle-dawnroost-node.png` | Dawnroost's living node | The level 10 gate |
| `battle-northern-crossroads.png` | The northern crossroads | Halcyon's ambush and the level 15 gate |
| `battle-frozen-road.png` | The frozen road | Band 4 wild fights |
| `battle-dead-moonwell.png` | The dead Moonwell at Misthollow | The finale |

## The world map

Chris's world, painted as nine detailed tiles in a 3×3 grid, received October 2, 2026, in day and night versions:

- `world-map/day/` and `world-map/night/`: `regions/` holds the nine 1536×1024 tiles, `placement.json` says where each goes in the 4608×3072 world (north up), and `README.txt` and `Art-Prompts.txt` come from his generator. The night tiles line up exactly with the day ones; some joins differ in brightness, which the game blends in code.
- The section names in the packs describe the land; they don't set lore.
- `world-map/bands-and-stops.webp` marks where the four level bands and the stops sit, and the areas under mist, as Chris confirmed on October 2.

## Portrait references

For art request 05 (`docs/art-requests/05-portraits.md`), in `portraits/`:

- `witch-calm-20min.webp`: the Witch's portrait from `20-min` (`art/portraits/witch-calm.webp`), the closest painted match to Io's 3D look;
- `io-face-render.png`: Io's 3D model, face close-up (from `../renders/2026-10-01-baseline/face-witch.png`);
- `sol-face-sheet.png`: the face views cropped from Sol's model sheet A.

## Portraits and ground-level maps

Received October 2, 2026:

- `portraits/portrait-io.png`, `portrait-sol.png`, `portrait-shipmaster-a.png` (Ysmera Brightkeel): the pilot talking portraits (art request 05), 1254×1254, with `prompts-pilot.txt` from Chris's generator. The game's 640-pixel copies are in `../../art/portraits/`.
- `walk/walk-*.png`: all 13 ground-level maps (art request 04), 1536×1024 at night, with `prompts.txt` and `prompts-pilot.txt`. The game's WebP copies are in `../../art/walk/`.

## Key art

`key-art-advert.png` (1672×941) is an advert for the game, not a title screen. It shows the Witch casting at Noctara, with Lunara and Envoi above, Sol and Halcyon crossing blades below, and a wraith behind Noctara. Use it later wherever a poster fits: a loading screen, the back of the title, or a page's cover image.
