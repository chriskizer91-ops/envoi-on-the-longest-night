# Modeling Brief: The Blackwater Gar (and Old Jaws)

Wave 3 · art request 13, section 9 (`docs/art-requests/13-wild-creatures.md`) · October 4, 2026

**Start here:** bring your branch up to the game (`git fetch origin ccr-31761774-76j8j3 && git merge --ff-only FETCH_HEAD`), then read `envoi-final-draft/model-studio/how-to-model.md` and follow it. Chris's two sheets came with the message that sent you here.

| | |
|---|---|
| Folder | `3d-model-new-character-ideas/blackwater-gar/` |
| File and function | `blackwater-gar.js`, `makeBlackwaterGar(opts)` |
| Kind | One or two in a fight; with `great: true`, Old Jaws, a great creature fought alone |
| Budget | 50k triangles or fewer (22k at detail 0.5); 12 draw calls for its body, 25 with its effects. As Old Jaws up to 90k and 20 / 35 |
| Size | 3.5 m long; Old Jaws about 2.6 times that |
| Page | `Blackwater_Gar_Bench.html`, published privately for Chris |

## What it is

Long armored fish of the Gloomfen's black water, hunting anything that comes to the water's edge now the fen is dark. **Old Jaws** lives under Rotbridge. Beaten, a gar slides back under the black water and is gone.

From Chris's Aethermoor games: the Blackwater Gar, "all jaw and armour… then it leaps", and Old Jaws with his Death Roll; his map's Rotbridge: "something enormous… in the Blackwater".

## How it looks

The sheets win. What must read from far off: the long needle-toothed jaw, the torpedo body's dark enamel scales, and its gold eyes. Mottled bronze-olive and black, an ivory belly, strong front fins it levers itself up on, duckweed dripping off it.

- **It lives in water.** Its `fx` has its own pool: a patch of dark water with ripples, wide enough for it, at its spot. So it works on any ground the battle has, grass, boardwalk or snow. Its idle glides in the pool with its head and back above the water.
- **`frost`** (0 to 1): ice crusting its scales, and its pool turning to broken ice with dark water between.
- **`upset`** (0 to 1): its jaws working, its body thrashing in the idle, its eyes brighter.
- **`great`** (option): Old Jaws. Ancient, its scales mossy and scarred, old fishing hooks and a length of broken chain caught in its jaw.

## Its moves

Suggested lengths; time them to your motion and report the real ones.

| Action | About | Hits | What happens |
|---|---|---|---|
| `appear` | 1.6 s | | It erupts out of its pool in a burst of water |
| `leap` | 1.8 s | [.6] | It launches out of the pool in a long arc onto its prey, then slides back in |
| `snap` | 1.0 s | [.45] | It levers up onto the bank on its front fins and snaps sideways |
| `dive` | 1.0 s | | Hold: it goes under, leaving only ripples, until `surface` |
| `surface` | 1.0 s | | It rises again |
| `deathRoll` | 2.4 s | [.4, .55, .7] | Old Jaws: it seizes its prey and spins in a roll |
| `hurt` | 0.6 s | | Interrupt: it thrashes |
| `block` | 0.45 s | | Interrupt: it rolls its armored back to the blow |
| `die` | 2.4 s | | Hold: it slides back under the water until only its tail shows, then it's gone, and fades out |

Anchors besides `chest`, `head` and `hit`: `jaws`. No walk: it swims in its pool, and the game doesn't move it.

## For the bench

- **Pack: 1, 2**, and **Old Jaws**; the pool on the meadow's grass.
- Sounds made in code: splashes, the jaws' clack, water draining off it, the death roll's churn.
