# 3D Model Field Studies

Claude's own folder, started October 4, 2026, when Chris asked for a 3D model folder of my own: everything else in the repository is read here, and nothing outside this folder is changed by it.

Each study takes one of the game's creatures and builds it again as well as code-built 3D in a single HTML file can draw on a laptop, thinking about what the creature is in the world of *Envoi on the Longest Night*. Each is shown as a short nature film, like a natural-history documentary, with an **Explore** mode for turning it round, labelling its parts and playing every move.

They are reference models: a measure of how far a browser page can go, made for a laptop rather than a phone. Each keeps the game's model interface and moves, so it can stand in for the game's version later, and each has a `detail` setting that brings it back down toward the phone budget.

| Study | Folder | Page | State |
|---|---|---|---|
| The Bramble Colossus | `bramble-colossus/` | see its README | Version 1, October 4, 2026 |

## What goes in a study's folder

| Path | What it is |
|---|---|
| `README.md` | What the study shows, what is new about the creature, its numbers, and what is still open |
| `<id>.js` | The model: one function `make<Name>(opts)`, three.js r128, no imports. Built from the parts in `model/` |
| `model/` | The model's source in numbered parts (`00-head.js` to `99-interface.js`), joined by `node model/join.mjs` |
| `<place>.js` | The creature's habitat, built in 3D |
| `cinema.js` | The film camera: high dynamic range, depth of field, bloom, moonlight shafts and a film grade |
| `film.js` | The film: its chapters, shots, moves and words, as data |
| `field-study.html`, `page.js`, `field-study.css` | The page's source |
| `*_Field_Study.html` | The built page, one file to open in a browser |
| `renders/` | Stills from the film and Explore |

## Building a study's page

From the repository's top folder:

```sh
node 3d-model-field-studies/bramble-colossus/model/join.mjs
node tools/build.mjs 3d-model-field-studies/bramble-colossus/field-study.html
cp dist/field-study.html 3d-model-field-studies/bramble-colossus/Bramble_Colossus_Field_Study.html
```

`dist/field-study.artifact.html` is the same page without its outer document tags, for publishing.
