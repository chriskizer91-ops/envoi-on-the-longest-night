# Modeling Brief: The Moss Bear

Wave 2 · art request 13, section 5 (`docs/art-requests/13-wild-creatures.md`) · October 4, 2026

**Start here:** bring your branch up to the game (`git fetch origin ccr-31761774-76j8j3 && git merge --ff-only FETCH_HEAD`), then read `envoi-final-draft/model-studio/how-to-model.md` and follow it. Chris's two sheets came with the message that sent you here.

| | |
|---|---|
| Folder | `3d-model-new-character-ideas/moss-bear/` |
| File and function | `moss-bear.js`, `makeMossBear(opts)` |
| Kind | Lone creature: fought alone |
| Budget | 90k triangles or fewer (40k at detail 0.5); 20 draw calls for its body, 35 with its effects |
| Size | 1.6 m at the shoulder on all fours, 3.2 m reared up |
| Page | `Moss_Bear_Bench.html`, published privately for Chris |

## What it is

The great bears of Eldergrove sleep the winter out under the moss. Noctara's cold came early and hard and woke them in the dark, and they can't get back to sleep: grumpy, hungry and enormous. Beaten, it sits back on its haunches, yawns hugely and lumbers off to sleep.

From Chris's Thareia notes (bears in the wilds) and his map's Eldergrove, with its glowing fungi.

## How it looks

The sheets win. What must read from far off: the huge round-shouldered hump, the blanket of moss over its back with the soft gold glow of its mushrooms, and the grey muzzle. Shaggy dark brown fur, small dark sleepy eyes, long dark claws, ferns and lichen in the moss.

- **`frost`** (0 to 1): frost over its moss, icicles in its fur, breath steaming, the mushrooms' glow dimmed.
- **`upset`** (0 to 1): fur raised along its hump, lips curled off its teeth, a growl in its idle, small hot eyes.
- **`sleepy`** (0 to 1): how heavy its eyelids are; its idle sways more.

## Its moves

Suggested lengths; time them to your motion and report the real ones.

| Action | About | Hits | What happens |
|---|---|---|---|
| `appear` | 2.0 s | | It shoves out through a wall of ferns (its own fronds, parting) |
| `maul` | 1.4 s | [.55] | One huge paw swiping down on its prey |
| `swipe` | 1.6 s | [.5] | A wide sweeping blow with both arms, through the whole party |
| `roar` | 2.0 s | cue [.4] | It rears up on its hind legs and roars: the party is shaken |
| `hug` | 2.6 s | [.4, .6, .8] | It rears, grabs its prey and squeezes three times (the game holds the hero at `grip`) |
| `yawn` | 2.4 s | | A huge yawn, eyes closing: it loses its turn |
| `hurt` | 0.7 s | | Interrupt: it flinches back, one paw raised |
| `block` | 0.5 s | | Interrupt: it turns its mossy shoulder to the blow |
| `die` | 3.0 s | | Hold: it sits back on its haunches, yawns, turns and lumbers away, and fades out |

Anchors besides `chest`, `head` and `hit`: `paw` (the striking paw), `grip` (where a hugged hero is held). Walk: a rolling bear's walk.

## For the bench

- **Sleepy** and **Upset** besides Frost, so Chris can see it from drowsy to furious.
- Sounds made in code: growls, the roar, huffs, the yawn, heavy footfalls, leaves and ferns rustling off it.
