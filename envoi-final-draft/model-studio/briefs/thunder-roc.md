# Modeling Brief: The Thunder-Roc of Stormwatch

Wave 2 · art request 13, section 7 (`docs/art-requests/13-wild-creatures.md`) · October 4, 2026

**Start here:** bring your branch up to the game (`git fetch origin ccr-31761774-76j8j3 && git merge --ff-only FETCH_HEAD`), then read `envoi-final-draft/model-studio/how-to-model.md` and follow it. Chris's two sheets came with the message that sent you here.

| | |
|---|---|
| Folder | `3d-model-new-character-ideas/thunder-roc/` |
| File and function | `thunder-roc.js`, `makeThunderRoc(opts)` |
| Kind | Great creature: fought alone, at Stormwatch, in a storm |
| Budget | 120k triangles or fewer (55k at detail 0.5); 24 draw calls for its body, 40 with its effects |
| Size | 5 m tall standing, 14 m from wingtip to wingtip |
| Page | `Thunder_Roc_Bench.html`, published privately for Chris |

## What it is

The great roc of the storm peaks, the size of a barn. The cold has driven it down from its eyrie, starving and furious. The Wardens take bird names, and Sol was named Kestrel: this is a kestrel against a roc. Beaten, it beats its wings once, rises into the storm, and is gone.

From Chris's Aethermoor games: "a bird the size of a barn… carries off goats", with Wing Gale and Carry Off; and his map's Stormwatch: "something large, heading this way".

## How it looks

The sheets win. What must read from far off, and at this size it will fill the screen: the eagle head with its ivory and gold beak, the storm-grey wings with their pale edges, the white barred chest, and the pale gold sparks along its wings.

- **`frost`** (0 to 1): frost on its crest and wing edges, ice in its feathers, its breath steaming.
- **`upset`** (0 to 1): its crest raised, eyes blazing, the sparks along its wings crackling harder.
- **In the air:** `lift` reports how high its feet are, so the game can shrink its shadow. Its feathers and crest move with spring chains, and the wings' big beats should feel heavy.

## Its moves

Suggested lengths; time them to your motion and report the real ones.

| Action | About | Hits | What happens |
|---|---|---|---|
| `appear` | 2.6 s | | It dives down out of the storm and lands, wings spread |
| `wingGale` | 2.0 s | [.5] | It hovers and gives one huge downbeat, a blast of wind on both heroes |
| `talon` | 1.8 s | [.55] | It swoops on its prey with its talons forward, and climbs away |
| `carryOff` | 3.2 s | [.3] | Hold: it seizes its prey and rises high; the game carries the hero at `talons` |
| `drop` | 1.2 s | [.4] | From on high it lets go (the game drops the hero), then settles back |
| `stormCall` | 2.4 s | [.45, .6, .75] | Wings raised high: the game's lightning strikes the party at the hits |
| `rise` | 1.2 s | | Hold: it takes off and stays aloft (about 6 m up) until `land` |
| `land` | 1.2 s | | It comes down to the ground |
| `hurt` | 0.8 s | | Interrupt: it tumbles back, in the air or on the ground |
| `block` | 0.5 s | | Interrupt: a wing swept across as a shield |
| `die` | 3.0 s | | Hold: it beats its wings once, wheels away up into the storm, and fades out |

Anchors besides `chest`, `head` and `hit`: `beak`, `talons` (where a carried hero hangs). Walk: a heavy hopping stride on the ground; in the air, the beat cycle.

## For the bench

- The meadow's **Storm** weather; a **Rise** and **Land** toggle; the camera pulled back far enough for its wings.
- Sounds made in code: its scream, wingbeats like thunderclaps, the gale's roar, crackling sparks.
