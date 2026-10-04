# Modeling Brief: The Mire Toad (and Gorrow, the Mire-King)

Wave 1 · art request 13, section 3 (`docs/art-requests/13-wild-creatures.md`) · October 4, 2026

**Start here:** bring your branch up to the game (`git fetch origin ccr-31761774-76j8j3 && git merge --ff-only FETCH_HEAD`), then read `envoi-final-draft/model-studio/how-to-model.md` and follow it. Chris's two sheets came with the message that sent you here.

| | |
|---|---|
| Folder | `3d-model-new-character-ideas/mire-toad/` |
| File and function | `mire-toad.js`, `makeMireToad(opts)` |
| Kind | One or two in a fight; with `great: true`, Gorrow, a great creature fought alone |
| Budget | 45k triangles or fewer (20k at detail 0.5); 12 draw calls for its body, 25 with its effects. As Gorrow up to 75k and 20 / 35 |
| Size | 1.0 m tall sitting, 1.4 m wide; Gorrow about 3.2 times that, "as wide as a hut" |
| Page | `Mire_Toad_Bench.html`, published privately for Chris |

## What it is

The great toads of the Gloomfen, grown bold since Bogmire's lamps went out ("the marsh creatures are getting bolder", Willowmurk on Chris's map). **Gorrow, the Mire-King**, holds court in Willowmurk's pools. Beaten, a toad deflates with a long sad croak and sinks back into the black water; Gorrow sinks back into his pool, crown and all.

From Chris's Aethermoor games: "Gorrow the Mire-King: a frog-king as wide as a hut", with Belly-Flop and "a tongue like a hawser".

## How it looks

The sheets win. What must read from far off: its squat round bulk, the big gold eyes high on its head, and the throat sac swelling into a glowing amber bubble. Warty olive-brown and dark moss skin with ochre-tipped warts, a cream belly, duckweed hanging off it.

- **`frost`** (0 to 1): frost on its back, its skin dulled and grey, sluggish, breath steaming.
- **`upset`** (0 to 1): eyes bulging wider, the throat pulsing fast, its warts flushing a hotter ochre-orange.
- **`swell`** (0 to 1): how puffed up it is (the `swell` action takes it to 1; `bellow` and `pop` let it out).
- **`great`** (option): Gorrow. The same toad, older and wartier, with a crown of reeds, water-lily pads and a few pale lily flowers that glow softly.
- It comes out of water: its `fx` has its own patch of dark water at its feet (a disc with ripples), so it works on any ground, grass or boardwalk.

## Its moves

Suggested lengths; time them to your motion and report the real ones.

| Action | About | Hits | What happens |
|---|---|---|---|
| `appear` | 1.6 s | | It erupts out of the black water in a splash |
| `tongue` | 1.2 s | [.42] | Its long sticky tongue whips out to its prey (`state.target`) and snaps back |
| `swell` | 1.4 s | | Hold: it puffs up into a huge ball, throat sac blazing, until `bellow` or `pop` |
| `bellow` | 1.8 s | [.55] | A huge croak, rings of sound bursting from its glowing throat (its own effect) |
| `pop` | 0.9 s | | Interrupt: a blade popped its swell, and it deflates with a comic wheeze |
| `bellyFlop` | 1.8 s | [.62] | It leaps high and lands belly-first on its prey |
| `royalCroak` | 2.0 s | cue [.45] | Gorrow only: a deep croak that calls two Mire Toads |
| `hurt` | 0.6 s | | Interrupt: squashed flat, wincing |
| `block` | 0.45 s | | Interrupt: it hunkers down, eyes shut |
| `die` | 2.4 s | | Hold: it deflates with a long croak and sinks into its water until only its eyes show, then fades out |

Anchors besides `chest`, `head` and `hit`: `mouth`, `tongue` (the tongue's tip), `throat`. Walk: hops.

## For the bench

- **Pack: 1, 2**, and **Gorrow** (alone, with a Royal Croak that brings two toads in).
- Sounds made in code: croaks low and high, the wet slap of the tongue, the swell's stretching, the belly-flop's splash.
