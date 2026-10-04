# Modeling Brief: The Ember Beetle

Wave 3 · art request 13, section 8 (`docs/art-requests/13-wild-creatures.md`) · October 4, 2026

**Start here:** bring your branch up to the game (`git fetch origin ccr-31761774-76j8j3 && git merge --ff-only FETCH_HEAD`), then read `envoi-final-draft/model-studio/how-to-model.md` and follow it. Chris's two sheets came with the message that sent you here.

| | |
|---|---|
| Folder | `3d-model-new-character-ideas/ember-beetle/` |
| File and function | `ember-beetle.js`, `makeEmberBeetle(opts)` |
| Kind | Pack creature: two or three in a fight |
| Budget | 30k triangles or fewer (12k at detail 0.5); 10 draw calls for its body, 20 with its effects; no lights of its own |
| Size | 0.9 m to the top of its shell, 1.6 m long |
| Page | `Ember_Beetle_Bench.html`, published privately for Chris |

## What it is

Big beetles that nest in the warm stones along the Ember Line. The nodes are going cold, so they crawl out after any warmth there is, and they go straight for Sol's sun blade. **They have no fire of their own:** Chris found the Emberback's fight too much about fire, so nothing here burns. Beaten, it flips onto its back, waves its legs, rights itself and buzzes off.

From Chris's Thareia notes: ember beetles, "dog-sized, nest by sunstone, can be lured away with heat".

## How it looks

The sheets win. What must read from far off: the high glossy dome of its shell with its warm amber veins, and its mandibles. Dark bronze and black like lacquer, a stubby horn, long feelers, six sturdy legs, mica-thin amber wings folded under the shell.

- **`frost`** (0 to 1): frost on its shell, its legs stiff and slow, its amber veins dull.
- **`upset`** (0 to 1): mandibles clacking, feelers whipping, its veins pulsing brighter.
- **`seed`** (option): small differences in its horn and veining, so a pack isn't three copies.

## Its moves

Suggested lengths; time them to your motion and report the real ones.

| Action | About | Hits | What happens |
|---|---|---|---|
| `appear` | 1.4 s | | It climbs up out of a crack between old stones (its own crack, glowing faintly) |
| `pinch` | 1.0 s | [.5] | It rears up and snaps its mandibles on its prey |
| `ram` | 1.4 s | [.55] | A head-down charge into its prey, and back |
| `burrow` | 1.4 s | | Hold: it digs down and is gone, earth spraying, a mound moving underground until `emerge` |
| `emerge` | 1.2 s | [.3] | It bursts up out of the ground beneath its prey (`state.target`), then scuttles back |
| `hurt` | 0.6 s | | Interrupt: knocked onto its side, legs scrabbling |
| `block` | 0.45 s | | Interrupt: it tucks its legs and head under its shell |
| `die` | 2.6 s | | Hold: it flips onto its back, waves its legs, rights itself, opens its wings and buzzes off upward, and fades out |

Anchors besides `chest`, `head` and `hit`: `jaws`. Walk: a six-legged scuttle, three legs at a time.

## For the bench

- **Pack: 1, 2, 3**; the beetles turn to face whoever has the most Heat (a **Sol's Heat** slider).
- Sounds made in code: clicks and clacks, scuttling, the buzz of its wings, earth spraying.
