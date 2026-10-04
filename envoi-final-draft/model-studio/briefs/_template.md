# Modeling Brief: <Name>

For anything that isn't one of the ten creatures: another creature, a townsperson in 3D for a cutscene, a prop, a new form of a foe. Copy this file to `briefs/<id>.md`, fill in every `<...>`, and commit it before starting the session, so the session can read it. A brief nobody filled in can't be built.

**Start here:** bring your branch up to the game (`git fetch origin ccr-31761774-76j8j3 && git merge --ff-only FETCH_HEAD`), then read `envoi-final-draft/model-studio/how-to-model.md` and follow it. Chris's sheets came with the message that sent you here.

| | |
|---|---|
| Folder | `3d-model-new-character-ideas/<id>/` |
| File and function | `<id>.js`, `make<Name>(opts)` |
| Kind | <Pack creature, two or three in a fight / Lone creature / Great creature / A character for cutscenes / A prop> |
| Budget | <Pack: 45k triangles, 12 draw calls body, 25 with effects. Lone: 90k, 20, 35. Great: 120k, 24, 40> |
| Size | <its height, its length, its wingspan: whatever it has> |
| Page | `<Name>_Bench.html`, published privately for Chris |

## What it is

<Two to four lines: what it is in this world, where it lives, why it fights (the wild's creatures are upset by Noctara's cold; nothing of the wild serves her), and how it leaves a fight when beaten. Name where the idea came from: Chris's words, his other games, his map.>

## How it looks

The sheets win. <What must read from the battle camera, far off on a phone: its outline, its signature feature, its glow. Its palette, kept out of the other lanes.>

- **`frost`** (0 to 1): <what the cold does to it>.
- **`upset`** (0 to 1): <how fear and anger show>.
- <Other looks or options: `seed`, `great: true`, ...>

## Its moves

Suggested lengths; time them to your motion and report the real ones.

| Action | About | Hits | What happens |
|---|---|---|---|
| `appear` | <s> | | <how it enters> |
| `<move>` | <s> | [<u>] | <what happens> |
| `hurt` | 0.6 s | | Interrupt: a small knockback |
| `block` | 0.45 s | | Interrupt |
| `die` | <s> | | Hold: <how it leaves>, and fades out |

Anchors besides `chest`, `head` and `hit`: <...>. Walk: <its gait>.

## For the bench

- <What Chris should be able to try on the page: Pack 1 to 3, a great form, a weather.>
- Sounds made in code: <its voice and its moves>.
