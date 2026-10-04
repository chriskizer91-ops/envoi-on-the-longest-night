# Modeling Brief: The Glowcap

Wave 1 · art request 13, section 2 (`docs/art-requests/13-wild-creatures.md`) · October 4, 2026

**Start here:** bring your branch up to the game (`git fetch origin ccr-31761774-76j8j3 && git merge --ff-only FETCH_HEAD`), then read `envoi-final-draft/model-studio/how-to-model.md` and follow it. Chris's two sheets came with the message that sent you here.

| | |
|---|---|
| Folder | `3d-model-new-character-ideas/glowcap/` |
| File and function | `glowcap.js`, `makeGlowcap(opts)` |
| Kind | Pack creature: one or two among other creatures, healing them |
| Budget | 30k triangles or fewer (12k or fewer at detail 0.5); 10 draw calls for its body, 20 with its effects; no lights of its own (its glow is emissive and sprites, since three may stand together) |
| Size | 1.0 to 1.3 m tall, by its seed |
| Page | `Glowcap_Bench.html`, published privately for Chris |

## What it is

A walking cluster of mushrooms the size of a child. Glowcaps walk toward light, any light, and with every light going out they walk toward the party's: Io's witchfire, Sol's sun blade. They aren't wicked; they want the light. Small ones in the Gloamwood, taller frosted ones in Eldergrove. Beaten, it sits down and puts down roots, as the 20-min game has it.

From the Lore & Party Bible's first wilds, and Chris's Aethermoor: "mushrooms the size of children that walk toward light. Any light."

## How it looks

The sheets win. What must read from far off: the big domed cap and its warm honey-gold underglow, the smaller caps round its base, and its little face. Cream-to-apricot caps with rust rims, ivory stalks, a mossy root-ball on short root legs, two small root arms.

- **`glow`** (0 to 2, 1 at rest): how bright its gills burn. Its moves raise it.
- **`frost`** (0 to 1): frost on its caps, small icicles at the rims, its glow dim and flickering, a shiver in its idle.
- **`upset`** (0 to 1): caps trembling and flaring wider, the glow pulsing faster, its little face scowling.
- **`seed`** (option): how many caps (four to six small ones) and their heights, so no two are alike.

## Its moves

Suggested lengths; time them to your motion and report the real ones.

| Action | About | Hits | What happens |
|---|---|---|---|
| `appear` | 1.4 s | | It pops up out of the leaf litter, caps unfolding and lighting |
| `sporePuff` | 1.6 s | [.55] | Every cap puffs a cloud of glittering gold spores toward its prey (its own effect) |
| `glow` | 1.8 s | cue [.5] | Its caps blaze bright gold and the light washes outward: it heals the others at the cue |
| `headbutt` | 1.2 s | [.55] | It waddles in, tips forward and bonks with its big cap |
| `hurt` | 0.6 s | | Interrupt: caps squashed down, spores spilling |
| `block` | 0.45 s | | Interrupt: caps tucked down over its face |
| `die` | 2.6 s | | Hold: it sits down, its caps close and dim, little roots spread into the ground, and it fades out |

Anchors besides `chest`, `head` and `hit`: `cap` (the big cap's crown), `gills` (where the glow comes from). Walk: a waddle on its root legs.

## For the bench

- **Pack: 1, 2, 3**, each from its own seed, and a **Mixed** button that stands one beside a hound if `../thornhound/` exists by then (otherwise skip it).
- Sounds made in code: soft puffs, a warm chime for the glow, little creaks of its roots.
