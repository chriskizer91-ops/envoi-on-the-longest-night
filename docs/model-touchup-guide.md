# How to Touch Up a Model

The process every model touch-up follows, so the cast stays consistent. Noctara was the first done this way.

## Files

| Path | What it is |
|---|---|
| `src/models/<id>.js` | The working model: one function `make<Name>(opts)`, three.js r128, no imports. Touch-ups edit this. |
| `src/models/originals/<id>.js` | The untouched original, renamed `make<Name>Original`, for the before/after switch. Never edit. |
| `src/bench/bench.js`, `bench.css` | The shared battle bench. Change it only for something every model needs. |
| `src/bench/stage-<id>.js` | Optional staging for one model: screen darkness, overlays, hits on several targets, special labels. |
| `demos/<id>.html` | The bench page for the model: its config (battle place, opponents, action groups, names, sliders). |
| `dist/<id>.html` | Built by `node tools/build.mjs demos/<id>.html`, one self-contained file. `dist/<id>.artifact.html` is the same page without the outer document tags, for publishing. |

## Tools

```sh
node tools/build.mjs demos/<id>.html                                      # build the page
node tools/check.mjs dist/<id>.html --out <dir> idle <action>@0.5 ...    # bench screenshots, any action at any point
node tools/turnaround/render.mjs <id> make<Name> <dir> front left back three face bust:back
node tools/turnaround/render.mjs <id> make<Name> <dir> --eval "m.root.traverse(o => ...)" back   # hide parts to debug
```

`check.mjs` freezes the bench clock and steps it by hand, so every shot lands exactly where asked. `turnaround` renders the model alone like a model sheet, under the game's lighting (or `--light studio`). Crop and combine shots with ImageMagick (`convert a.png b.png +append out.png`) to compare against the concept art.

## Done means

1. **It looks as close to its art as code allows.** Compare the turnaround with the model sheet view by view, and the face close-up with the sheet's face. Faces get real eye geometry (whites, iris rings, lids with a blink morph), as Halcyon and Noctara have.
2. **Every action it will use works,** with hit times that match the motion: check each one in the bench at its hit times.
3. **It follows the Model Build Spec interface:** `root`, `fx`, `animate(phase, walk, t, dt)`, `play`, `guard`, `reset`, `busy`, `action`, `progress`, `dash`, `lift`, `state`, `setFade`, `anchor` (`chest`, `head`, `hit` at least), `ACTIONS` with `hurt` 0.6 s and `block` 0.45 s as interrupts.
4. **It fits the budget:** 50k to 120k triangles, 40 draw calls or fewer for the body (merge meshes that share a material; skin small rigid parts to their joints), textures under about 24 MB, and per-frame animation cost close to the original's. A battle has up to five models on a phone.
5. **Before and after** both work in its bench page, and the page passes a phone-width look.

## The Witch is different

Her pass is technical only: the interface and fewer draw calls. Render her before and after from the same angles and compare the pixels. Nothing visible may change.
