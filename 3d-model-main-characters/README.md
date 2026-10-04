# 3D Model Main Characters

Claude's own folder, started October 4, 2026, when Chris asked for a new folder of main characters as a higher-quality 3D model test. Everything else in the repository is read here; nothing outside this folder is changed by it.

Each study takes one of the main cast (Io the Witch, Sol, Halcyon, Noctara, Lunara) and builds her again at the level of detail of the Bramble Colossus field study (`../3d-model-field-studies/bramble-colossus/`). The game's model is the brief: her bones, proportions, colours, clothes and every move stay as the game has them, and each study keeps the game model's interface, so it could stand in for it later. What changes is how finely each part is made and how it is lit and drawn.

They are tests and reference models, made for a laptop, each with a `detail` setting that brings it back down toward the phone budget. The game keeps using its own models in `../src/models/` until Chris decides otherwise.

| Character | Folder | Page | State |
|---|---|---|---|
| Io, the Witch | `io/` | https://claude.ai/artifact/NiYpeFMYbEtmib2bcMgQEK (private); `io/Io_Main_Character_Study.html` is the same page as one file | First version, October 4, 2026: the model, her cottage garden, a tour and Explore |

## What goes in a character's folder

| Path | What it is |
|---|---|
| `README.md` | What the study keeps, what is new about each part, its numbers, and what is still open |
| `<id>.js` | The model: one function `make<Name>(opts)`, three.js r128, no imports. Joined from the parts in `model/` |
| `model/` | The model's source in numbered parts (`00-head.js` to `99-interface.js`), joined by `node model/join.mjs` |
| `<place>.js` | Where she is shown, built in 3D |
| `cinema.js` | The film camera, copied from the Bramble Colossus field study |
| `study.html`, `study.css`, `page.js` | The page's source |
| `*_Main_Character_Study.html` | The built page, one file to open in a browser |
| `tools/` | Building the page, and headless pictures of the model and the page |
| `renders/` | Stills from the page |

## Next

Sol, Halcyon, Noctara and Lunara, in whatever order Chris wants, each kept to her game model in the same way.
