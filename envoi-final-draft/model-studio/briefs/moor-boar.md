# Modeling Brief: The Moor Boar (and Old Snag)

Wave 1 · art request 13, section 4 (`docs/art-requests/13-wild-creatures.md`) · October 4, 2026

**Start here:** bring your branch up to the game (`git fetch origin ccr-31761774-76j8j3 && git merge --ff-only FETCH_HEAD`), then read `envoi-final-draft/model-studio/how-to-model.md` and follow it. Chris's two sheets came with the message that sent you here.

| | |
|---|---|
| Folder | `3d-model-new-character-ideas/moor-boar/` |
| File and function | `moor-boar.js`, `makeMoorBoar(opts)` |
| Kind | One or two in a fight; with `great: true`, Old Snag, a great creature fought alone |
| Budget | 50k triangles or fewer (22k at detail 0.5); 12 draw calls for its body, 25 with its effects. As Old Snag up to 80k and 20 / 35 |
| Size | 1.1 m at the shoulder, 2 m long; Old Snag about 1.8 times that, "the size of a cart" |
| Page | `Moor_Boar_Bench.html`, published privately for Chris |

## What it is

The wild boars of the Warm Roads root along the Ember Line for its warmth. With the nodes going cold they are hungry and cross. **Old Snag** is the oldest of them. The hatchet in his shoulder is a Warden's, from long ago, and Sol knows the sun on it. Beaten, a boar shakes itself off and trots away into the heather; as Old Snag goes, the old hatchet drops out of his shoulder and stays on the ground.

From Chris's Aethermoor games: "Old Snag: a boar the size of a cart with a ranger's hatchet buried in its shoulder", with Tusk, Trample, Bristle and Wallow.

## How it looks

The sheets win. What must read from far off: the front-heavy hump, the long snout and yellowed tusks, and the crest of bristles that stands up. A coarse umber and charcoal coat, a grizzled grey muzzle, peat mud on its legs, heather caught in its coat.

- **`frost`** (0 to 1): frost along its crest and snout, its breath steaming, its coat greyer.
- **`upset`** (0 to 1): the crest bristling, ears back, snorting puffs of breath, a red rim to its eyes, a stamping idle.
- **`bristle`** (0 to 1): how far its crest stands up (the `bristle` action takes it to 1).
- **`great`** (option): Old Snag. Bigger, scarred and grey-muzzled, one tusk broken, and an old bronze hatchet with a sun emblem buried in his left shoulder. The hatchet is its own part, so `die` can drop it.

## Its moves

Suggested lengths; time them to your motion and report the real ones.

| Action | About | Hits | What happens |
|---|---|---|---|
| `appear` | 1.6 s | | It crashes out of the heather, charges in and skids to a stop |
| `tusk` | 1.2 s | [.5] | A short rush and an upward hook of the tusks |
| `trample` | 1.8 s | [.45, .7] | It rears and stamps down twice with its front hooves, earth flying |
| `bristle` | 1.0 s | | Hold: every bristle of its crest stands up, head low, snorting, until its next action |
| `wallow` | 3.0 s | cue [.6] | It rolls on its back in dark mud (its own splash), and heals at the cue |
| `paw` | 1.6 s | | Old Snag: hold, head lowered, pawing the ground: the warning before his charge |
| `charge` | 1.6 s | [.55] | Old Snag: from `paw`, a thundering charge through his prey and back |
| `hurt` | 0.6 s | | Interrupt: a squeal and a skid back |
| `block` | 0.45 s | | Interrupt: it turns its shoulder to the blow |
| `die` | 2.4 s | | Hold: it shakes itself off and trots away into the heather, tail up, and fades out. Old Snag's hatchet falls and stays where he stood |

Anchors besides `chest`, `head` and `hit`: `snout`, `hatchet` (Old Snag's, where it lies after `die`). Walk: a trot, and a gallop for the charge.

## For the bench

- **Pack: 1, 2**, and **Old Snag**, with Sol close enough to see the hatchet.
- Sounds made in code: grunts, snorts, squeals, hoofbeats, the wallow's squelch, the hatchet's clink as it lands.
