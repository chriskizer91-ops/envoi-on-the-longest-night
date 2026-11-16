# Envoi with the Moon Faire witches

Started November 15, 2026. Chris's idea: keep everything that went into *Envoi on the Longest Night* (the arenas, the foes, the
effects, the battle screen, the walking maps, the story's places), and swap its heroes for the two 3D witches from *Moon Faire*:

- **Io, the Herbal Witch** (Moon Faire's Io) takes Io's place. Natural herbal healing and summoning. She gets summons like
  Envoi's Io (Lunara), but not the Envoi summon.
- **The Jester** completely replaces Sol. The duality of life and death; fate. Her big move is Curtain Call. She has no name yet.
- Both are the lightest version of their models, in the fights and on the walking maps.
- The combat is rebuilt: new names, new numbers that pop up, new math, rebalanced. Battles get Moon Faire's director
  camera, bodies that react, spells that mark the arena, and turn openers and finishers.
- Files go to Chris as single HTML files he downloads and opens, not as published pages.

The rest of Envoi is untouched: this folder is a new game made from its parts, and nothing outside it changes.

## Pages

| Page | File | State |
|---|---|---|
| Io's Spell Book | `spellbook/spellbook.html` → `dist/spellbook.html` | November 15. Moon Faire's Io in Envoi's river glade, with the Jester and a Shadow Wraith. One tab plays her 7 own spells, the other Envoi Io's 9 spells on new moves of hers. For Chris to choose which spells she keeps. |
| Io on Foot: Moon Faire | `walk/walk.html` → `dist/walk.html` | November 15. Envoi's Io on Foot page with Moon Faire's Io as her own 3D model on the 21 walking maps (`src/moon-io-walker.js`, the same face as the painted walk sheet, so `src/game/field.js` draws her unchanged). She kneels at wells and raises her arms at a Moonwell. Starts at 24% of the screen's height. |

## How it is made

- `witches/`: the two light witches, copied unchanged from the `moon-faire` repository (see Sources).
- `src/io-new-moves.frag.js`: Io's new moves for Envoi's spells (`e_throw`, `e_raise`, `e_grasp`, `e_bless`, `e_sky`,
  `e_moon`, `e_guard`), written the way her own moves are. `tools/patch-io.mjs` adds them to her light model as
  `build/io_plus.js` (run it after any change to the moves).
- `src/moon-io.js`: Io behind the same face every Envoi battle model has (`play`, `ACTIONS` with cues and hits, `anchor`,
  `progress`...). The Jester already has that face: she was built to Envoi's model spec.
- `src/kit.js`: a small stage made of Envoi's parts: an arena, the battle effects and sound, and the battle screen's camera
  rules. The witches are drawn in their own Moon Faire look (each witch material turns its colour to sRGB at its last step,
  with a soft studio in their shine), while the arena, foes and effects keep Envoi's look. "Light: Envoi" draws the witches
  the Envoi way instead.

```
node moon-faire-witches/tools/patch-io.mjs
node tools/build.mjs --min --offline moon-faire-witches/spellbook/spellbook.html    # dist/spellbook.html, everything inside
node moon-faire-witches/tools/shoot.mjs dist/spellbook.html <out dir> --plan <plan.json>   # stills at a phone's size, headless
```

`npm install --prefix tools` first (esbuild, three.js and the fonts for the offline build).

## Sources

From `chriskizer91-ops/moon-faire` (read only):

- `witches/io_lod.js`, `io_tex.js`, `witch_levels.js`: branch `claude/moon-faire-fights` (commit `f0f8aed`), `game/fight/witches/`.
  They are built there from Io's own branch `claude/io-3d-model` (commit `3bc17a3`, stage fourteen).
- `witches/jester_lod.js`, `jester_tex.js`, `lod.js`, `meshopt_simplifier.js`, `palette.js`: branch `claude/moon-faire-fights`
  (commit `f0f8aed`), `game/models/jester/`.

From this repository: `src/fx/arena.js`, `src/stage/arena-river-glade.js`, `src/fx/battle-fx.js`, `src/fx/io-spells.js`,
`src/battle/sound.js`, `src/models/wraith.js`, `src/models/lunara.js`, all unchanged.

## Next

1. Chris picks Io's spells from the spell book.
2. The combat rebuild in a copy of Envoi's battle screen and engine: Io and the Jester in the arenas, new moves, names,
   numbers and rules, checked with Envoi's balance simulator; the four battle upgrades.
3. The whole game put together in this folder, with the 3D Io walking and fighting.
