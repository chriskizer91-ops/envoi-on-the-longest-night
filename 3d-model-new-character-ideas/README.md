# 3D Model: New Character Ideas

Creatures and characters Chris brings to the project as ideas, each with its code-built 3D model and a bench page to judge it on, polished in this folder. None of them is part of the game's story until Chris places it (`docs/questions/open.md` asks where each one might fit). Each model follows the same Model Build Spec as the cast (`docs/specs/model-build-spec.md`), so any of them can join a battle later without changes.

| Idea | Folder | Page | State |
|---|---|---|---|
| Bramble Horror | `bramble-horror/` | https://claude.ai/artifact/ASy7Y7hL3EuAHZbFDwihWv | Version 2, October 3, 2026 |
| Bramble Colossus, the Bramble Horror grown into a boss | `bramble-colossus/` | https://claude.ai/artifact/HbXsmA8xNLUnLMQ6px7h6Q | Version 1, October 3, 2026 |

The Bramble Colossus has no `original/`: it was made here from the Bramble Horror, as Chris asked, and its bench shares the Bramble Horror's `bench.css` and `glade.js`.

## What goes in an idea's folder

| Path | What it is |
|---|---|
| `README.md` | What the idea is, what changed, its numbers, and what is still open |
| `<id>.js` | The model: one function `make<Name>(opts)`, three.js r128, no imports |
| `<id>-*.html`, `bench.js`, `bench.css` | The bench page's source, built into one file by `tools/build.mjs` |
| `*_Bench.html` | The built page, one self-contained file to open or pass on |
| `original/` | The idea exactly as Chris brought it, never edited; its model drives the bench's Before switch (for ideas he brought as files) |
| `renders/` | Before-and-after records |

To rebuild a page after changing its files, from the repository's top folder:

```sh
node tools/build.mjs 3d-model-new-character-ideas/bramble-horror/bramble-horror.html
cp dist/bramble-horror.html 3d-model-new-character-ideas/bramble-horror/Bramble_Horror_Bench.html
```

The same for `bramble-colossus/bramble-colossus.html`. `dist/<name>.artifact.html` is each page without its outer document tags, for publishing.
