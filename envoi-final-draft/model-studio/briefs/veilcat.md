# Modeling Brief: The Veilcat

Wave 3 · art request 13, section 10 (`docs/art-requests/13-wild-creatures.md`) · October 4, 2026

**Start here:** bring your branch up to the game (`git fetch origin ccr-31761774-76j8j3 && git merge --ff-only FETCH_HEAD`), then read `envoi-final-draft/model-studio/how-to-model.md` and follow it. Chris's two sheets came with the message that sent you here.

| | |
|---|---|
| Folder | `3d-model-new-character-ideas/veilcat/` |
| File and function | `veilcat.js`, `makeVeilcat(opts)` |
| Kind | Lone creature, sometimes a pair |
| Budget | 60k triangles or fewer (26k at detail 0.5); 14 draw calls for its body, 28 with its effects |
| Size | 1.0 m at the shoulder, 2.6 m long with its tail |
| Page | `Veilcat_Bench.html`, published privately for Chris |

## What it is

Great snow cats of the high passes round Peak's Veil, the cloud-wrapped monastery on Chris's map: frost-maddened and hungry. Beaten, it bounds away and vanishes into the blowing snow.

From Chris's Thareia notes (mountain cats of the peaks).

## How it looks

The sheets win. What must read from far off: its long low body, the very long thick tail, and its pale amber eyes in their dark rings. Thick smoky grey and cream fur with dark smoky rosettes, a white chest, huge furry paws, long white whiskers with frost in them.

- **`frost`** (0 to 1): ice clotted in its fur, frost on its brows and whiskers, its breath steaming.
- **`upset`** (0 to 1): ears flat, tail lashing, fur bristling along its back, pupils wide.
- **`veiled`** (0 to 1): how far it has melted into blowing snow (the `whiteout` action takes it to 1): a pale, flickering outline inside its own swirl of snow.

## Its moves

Suggested lengths; time them to your motion and report the real ones.

| Action | About | Hits | What happens |
|---|---|---|---|
| `appear` | 1.6 s | | It drops down from a high ledge through falling snow and lands crouched |
| `pounce` | 1.4 s | [.55] | A long leap onto its prey, claws spread, and back |
| `rake` | 1.2 s | [.4, .62] | Two swipes of its forepaws |
| `whiteout` | 1.4 s | | Hold: it melts into a swirl of blowing snow (`veiled` to 1) until its next action |
| `tailSweep` | 1.4 s | [.5] | It spins low, its long tail sweeping through the whole party |
| `hurt` | 0.6 s | | Interrupt: it flinches, ears flat |
| `block` | 0.45 s | | Interrupt: a quick twist away |
| `die` | 2.2 s | | Hold: it bounds away into the snow and is gone, fading out |

Anchors besides `chest`, `head` and `hit`: `paws`. Walk: a low prowl, and a bounding run.

## For the bench

- **Pack: 1, 2**, the meadow in snow, and a **Veiled** slider.
- Sounds made in code: a low growl and a snarl, soft heavy pawfalls, the hiss of blowing snow.
