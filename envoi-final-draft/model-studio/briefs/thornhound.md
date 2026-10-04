# Modeling Brief: The Thornhound (and the Rime Wolf)

Wave 1 · art request 13, section 1 (`docs/art-requests/13-wild-creatures.md`) · October 4, 2026

**Start here:** bring your branch up to the game (`git fetch origin ccr-31761774-76j8j3 && git merge --ff-only FETCH_HEAD`), then read `envoi-final-draft/model-studio/how-to-model.md` and follow it. Chris's two sheets came with the message that sent you here.

| | |
|---|---|
| Folder | `3d-model-new-character-ideas/thornhound/` |
| File and function | `thornhound.js`, `makeThornhound(opts)` |
| Kind | Pack creature: two or three in a fight, beside Io and Sol |
| Budget | 45k triangles or fewer (20k or fewer at detail 0.5); 12 draw calls for its body, 25 with its effects; no lights of its own |
| Size | 0.95 m at the shoulder, 1.7 m from nose to tail tip |
| Page | `Thornhound_Bench.html`, published privately for Chris |

## What it is

The wild dogs of the old roads, gone feral in the bramble, with burrs matted into their hides. Noctara's dark has made them restless and hungry, and the farther north they run, the wilder they are. In the peaks they are the **Rime Wolf**: the same hound, bigger, paler and frost-maddened. It belongs to the wild, not to her. Beaten, a hound tucks its tail, slinks off into the thorns and looks back once.

From Chris's Aethermoor games: "lean hunting dogs gone feral in the bramble, burrs matted into their hides" (Bite, Lunge, Pack Howl), and the Rime Wolf, "frost in their ruffs… the bite stays cold".

## How it looks

The sheets win. What must read from the battle camera, far off on a phone: its lean wolfish outline, the thick dark ruff, the long low tail, and its amber eyes. A shaggy charcoal and rust brindle with a cream underjaw; burrs, dry leaves and a few black thorn twigs in the ruff.

- **`frost`** (0 to 1): rime crusting the ruff and muzzle, small icicles in the chin fur, breath steaming from its mouth, the coat paling toward grey, eyes paler. At 1, with the game scaling it 1.15, it is the Rime Wolf.
- **`upset`** (0 to 1): hackles up along its spine, ears back, lips drawn back off its teeth, a hot amber rim to its eyes, a quicker, panting idle.
- **`seed`** (option): each hound a little different, its brindle and the burrs in its ruff, so a pack isn't three copies.

## Its moves

Suggested lengths; time them to your motion and report the real ones.

| Action | About | Hits | What happens |
|---|---|---|---|
| `appear` | 1.6 s | | It bursts out of a thicket mid-leap and lands in its place, hackles up |
| `lunge` | 1.3 s | [.5] | A long low leap at its prey (`dash` carries it in) and back |
| `bite` | 1.0 s | [.45] | Jaws snap shut with a twist of the head |
| `howl` | 2.0 s | cue [.35] | It sits back and howls at the sky: Pack Howl, which calls another hound |
| `circle` | 2.2 s | | It runs a quick arc round its prey and back to its place (the Rime Wolves' Circle) |
| `hurt` | 0.6 s | | Interrupt: a yelp and a small knockback |
| `block` | 0.45 s | | Interrupt: a quick sidestep, head low |
| `die` | 2.4 s | | Hold: tail tucked, ears down, it slinks away, looks back once, and fades out |

Anchors besides `chest`, `head` and `hit`: `mouth`. Walk: a trot, breaking to a lope.

## For the bench

- **Pack: 1, 2, 3** in front of Io and Sol; **Rime Wolf** sets frost 1, upset 1 and the 1.15 scale.
- Sounds made in code: growls, snaps, yelps, the howl (and a second one answering far off).
