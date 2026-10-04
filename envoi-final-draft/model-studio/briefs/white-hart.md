# Modeling Brief: The White Hart of Fawnrest

Wave 2 · art request 13, section 6 (`docs/art-requests/13-wild-creatures.md`) · October 4, 2026

**Start here:** bring your branch up to the game (`git fetch origin ccr-31761774-76j8j3 && git merge --ff-only FETCH_HEAD`), then read `envoi-final-draft/model-studio/how-to-model.md` and follow it. Chris's two sheets came with the message that sent you here.

| | |
|---|---|
| Folder | `3d-model-new-character-ideas/white-hart/` |
| File and function | `white-hart.js`, `makeWhiteHart(opts)` |
| Kind | Great creature: fought alone, in its lair at Fawnrest Shrine |
| Budget | 110k triangles or fewer (50k at detail 0.5); 24 draw calls for its body, 40 with its effects |
| Size | 1.9 m at the shoulder, its antlers reaching 3.4 m |
| Page | `White_Hart_Bench.html`, published privately for Chris |

## What it is

The old white hart that pilgrims to Fawnrest Shrine tied ribbons for. Noctara's cold has crept into it: frost has grown through its antlers like winter branches, and it no longer knows anyone. Menacing and sad at once. Beaten, the frost cracks off its antlers in a shower of ice; it stands a moment, lowers its head to Io, and walks back into the trees.

From Chris's Aethermoor games (the white stag of Fawnrest, "menacing and sad at once") and his map ("white deer", "the forest animals are fleeing something"). In this game its trouble is Noctara's cold and nothing else.

## How it looks

The sheets win. What must read from far off: the white figure against the dark, and the huge antlers glittering with frost. A white coat with a silver sheen, a shaggy throat mane, pale gold eyes, faded red ribbons and a small tarnished bronze bell round its neck.

- **`frost`** (0 to 1) is part of its shape here: ice crystals grow along its antlers from nothing (at 0, the clean antlers of the hart before the cold) to long frozen branches (at 1), with frost in its mane and its breath steaming. Its fight starts near 1, and `die` takes it to 0.
- **`upset`** (0 to 1): its eyes glow a brighter pale gold, ears back, nostrils flaring, its breathing heavier.
- Its ribbons and bell swing with its motion (spring chains), and the bell is a sound cue.

## Its moves

Suggested lengths; time them to your motion and report the real ones.

| Action | About | Hits | What happens |
|---|---|---|---|
| `appear` | 2.2 s | | It steps out of the mist (its own drifting mist) and lifts its head |
| `crownWindup` | 1.6 s | | Hold: antlers lowered, scraping the ground with a forehoof, frost glinting: the warning, held until `crownCharge` |
| `crownCharge` | 1.8 s | [.55] | A gallop head-down through its prey and back |
| `antlerSweep` | 1.6 s | [.5] | Its head swung wide through the whole party |
| `frostBloom` | 2.2 s | [.6] | It rears, and frost bursts from its antlers in glittering branches over both heroes |
| `bellow` | 1.8 s | cue [.4] | A deep bellow, breath pluming: the party is shaken |
| `hurt` | 0.7 s | | Interrupt: it stumbles, nearly to its knees |
| `block` | 0.5 s | | Interrupt: antlers lowered like a shield |
| `die` | 4.0 s | | Hold: released. It stands still, the frost cracks off its antlers in a shower of ice (`frost` to 0), it lowers its head gently, turns and walks away into the mist, and fades out |

Anchors besides `chest`, `head` and `hit`: `antlers` (the crown's middle), `bell`. Walk: a stately walk, and a gallop for the charge.

## For the bench

- **Frost** from 0 to 1 shows the antlers growing their ice; a **Released** button plays `die`.
- Sounds made in code: the bell's tinkle, hooves, the bellow, ice crackling and shattering.
