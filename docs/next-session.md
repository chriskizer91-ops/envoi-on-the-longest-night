# Next Session: Where the Work Stands

October 3, 2026, end of the evening session that started **pass three**. Read this first. Then:

- `../envoi-game-pass-3/README.md`: everything from pass three: Chris's decisions, the pages, the measured sizes, and the plans for the new battles and for walking without the world map.
- `docs/handoff.md` lists what the game still wants (written before pass three; the pass-three README supersedes it where they differ).
- `putting-it-all-together/README.md` lists every piece of the game, where it comes from and its state.
- `docs/design-decisions.md` (the October 3 sections, pass three last) has the reasons behind what is built.

## Where things are

- **The branch:** all the work is on `claude/practical-franklin-l1ctf9`, pushed. It holds the game from `ccr-9e19f4e2-29pyn6` (which held all of `second-account-work`) and the creature branch `claude/sleepy-dirac-t4ftx0`, merged.
  - The repository's default branch is still `claude/admiring-hawking-p7m87n`, and nothing is merged into it yet. Chris decides when.
  - Mooncart builds the default branch, so the game reaches Mooncart only after that merge.
- **The game:** `putting-it-all-together/game.html`, built from `src/`. It plays from the title to the ending.
- **Pages on Chris's phone** (private until he shares them; this account can update them in place):

| Page | Link |
|---|---|
| The game (version 5: paper dolls, Chapters, smoother walking) | https://claude.ai/artifact/9ix7XE5CT9pLrDATugkg2w |
| Battle Backgrounds: Chris's paintings behind live 3D ground, with squeeze, weather and phone controls | https://claude.ai/artifact/F7GsYnn8Z21EEndmWXxUQw |
| Wilderness Walk: Io on Chris's wilderness path, nine squeezes | https://claude.ai/artifact/BcRjgVynWymYim84Yb7STk |
| Io on Foot: her walk, with sliders and the footstep ideas | https://claude.ai/artifact/G1B5cMkYzBq4RiausDAAQj |
| Walking Map Resolution: the town maps' compression choices | https://claude.ai/artifact/7F4pu4v3BQiKAZAtVJkC1i |
| The Bramble Colossus on its own | https://claude.ai/artifact/H2QTXhNnEi7W7Qbs6BXvA2 |
| Colossus in the Meadow: the living battlefield's first fight | https://claude.ai/artifact/KCMQSy3QksJbZ4ikquxYVj |

  To update a page from a new session, pass its link as `url` to the Artifact tool. A publish to a page this conversation hasn't read is refused once and hands back the live copy; check it holds nothing your build lacks, then publish again.

## What pass three did (so far)

`../envoi-game-pass-3/README.md` has the list. In short:

- the branches merged, with Noctara's second pass and the living battlefield;
- Chris's nineteen paper dolls on the maps (the townsfolk in still poses, the four scene walkers walking);
- the battle paintings squeezed a little, and the Night square's painting in the file once;
- Chapters on the title (the start, gate 5, 10, 15, the finale);
- the Bramble Horror in band 3 only;
- smoother walking (hold to steer, tap to walk, a one-thumb pad, corners, straight tapped walks), and the fix that makes taps reach the walking map at all;
- the Battle Backgrounds page and art request 11; the Wilderness Walk page.
- **Size:** the file Chris keeps is 12.2 MB (from 15.0); the published game is 11.5 MB.

## Waiting on Chris

1. **The battle squeeze** (Battle Backgrounds page) and **the wilderness squeeze** (Wilderness Walk page).
2. **Art request 11:** four battle paintings (band 2's Warm Roads, Dawnroost's node, the northern crossroads, the dead Moonwell).
3. **The walking plan** without the world map, and whether the wilderness scenes are at night (`questions/open.md`, 20 and 21). Art request 12 follows his answer.
4. **His map path edits** on the Map Paths page (the editor is being built).
5. **The lore conversation:** every word of the script is still a placeholder.
6. **Art requests 06 and 07** (townsfolk portraits, story stills), and the footsteps.
7. **The songs** go in only when the whole build is finished, unless he says sooner.

## Next for Claude

1. **The new battles** (pass-three README, "Next: the new battles"): the living field with a ground for each place, the battle screen using it, a phone setting; demo page first.
2. **Walking without the world map**, once Chris agrees the plan: the wilderness scenes as ground maps, the Magpie's landings at the camps, and the world map's walking taken out.
3. **His map path edits**, when he sends them: read them from the Map Paths page's database, apply them to `src/game/maps.js`, run `node tools/check-maps.mjs`, publish.

## When things arrive

### A new paper doll (a new townsperson, or a sheet redone)

The nineteen from art request 08 are in (pass three). For another one:

1. Save the sheet as `reference/art/walkers/<id>-walk.png`, kept as it came.
2. Cut it: `node tools/cut-sheet.mjs reference/art/walkers/<id>-walk.png <id> --ratio <height beside Io> --avif --q 45`, adding `--still` for someone who only stands and turns to talk (most townsfolk). The four who walk in scenes (Sol, Halcyon, Quill, Ysmera) keep the whole walk.
3. List it: `node tools/walkers-index.mjs` writes `src/walk/walkers.js`.
4. The field draws a person with their sheet when their id in `maps.js` (or an actor's id in `script.js`) matches the sheet's (`src/walk/painted-folk.js`).

### A new mob

Follow the eight steps in `putting-it-all-together/README.md`:

1. the idea folder in `3d-model-new-character-ideas/`;
2. the model in `src/models/`;
3. its rules in `src/battle/rules.js` (`FOES`);
4. its look in `src/game/fights.js` (`FOE_LOOK`, `makeFoe`);
5. its moves play through `anyMove` on their own;
6. its balance targets and the bands it lives in (`src/battle/sim.js`, `BAND_PACKS`), checked with `node tools/balance.mjs`;
7. a demo page in `demos/`;
8. one line in `game.html`.

### The songs (last)

| File | Where it plays |
|---|---|
| `art/music/towns-moonlit-forest-path.webm` | the towns: maps whose `MUSIC` in `game.js` is `'town'` |
| `art/music/wilds-herbal-decay.webm` | the wilds: `'travel'` (the Thornwood, the crossroads, the frozen pass, the world map) |
| `art/music/battle-herbal-decay.webm` | the battles: `src/battle/sound.js` `startMusic` |

- All three are Opus files.
- A 48k copy of the battle song is in `reference/music/`, in case the 32k one sounds thin.
- **The build:** `tools/build.mjs` inlines only images today. Extend it for `.webm` (`data:audio/webm`) and the `--split` copy.
- **Playing them:** loop them through an `<audio>` element or Web Audio, under the music volume setting. The made-up music keeps the rest (the title, the marsh, the ruins, the flight, the bosses), unless Chris says otherwise.

### More room, if it's needed

The battle paintings (4.2 MB of files) and the world map (3.0 MB) could be squeezed to AVIF the way the walking maps were. Show Chris a comparison page first, like Walking Map Resolution.

When the published game passes 16 MB:

1. Build with `node tools/build.mjs --min --split putting-it-all-together/game.html`.
2. Publish `dist/game-split/game.artifact.html` to the game's link, with every file in `dist/game-split/files.json` beside it at the same paths.

## How to check work

| Check | Command |
|---|---|
| Once per new container | `npm install --prefix tools` |
| Build the game | `node tools/build.mjs --min putting-it-all-together/game.html` |
| Play it headless | `node tools/game-test.mjs` (must end with "game test passed") |
| The file Chris keeps | `node tools/build.mjs --min --offline putting-it-all-together/game.html`, then `node tools/game-test.mjs --offline` (plays with the internet blocked) |
| The walking maps | `node tools/check-maps.mjs` (every map must print ✓) |
| One map up close | `node tools/trace-overlay.mjs <map> out.png 1600 --grid 25 --crop x,y,w,h`, which draws the walk areas, blocks and fronts over the painting |
| Balance | `node tools/balance.mjs` |

The game test's steps:

- `--steps` picks them from title, new, walk, world, menu, saves, scenes, save, wild and colossus.
- `--size 915x412` is a Pixel 7a held sideways.

## Lessons from this session

- **Helper agents:** four agents tracing maps at once ran into the account's usage limit and stopped halfway. They were resumed after it reset. Run fewer at once, and ask them to work economically.
- **Chris's uploads** can be pages saved from claude.ai, without the media inside. His songs came from his Game Music Squeezer artifact instead (the Artifact tool: `list` with `scope: "files"`, then `read` with `paths`).
- **Art paths** in the scripts must be in double quotes (`"art/..."`) for the build to put the pictures inside the page.
- **Chris's PNGs** can carry a content-credentials block that sharp won't read. `compress.mjs`, `trace-overlay.mjs` and `cut-sheet.mjs` strip it.
- **Sibling repositories** are read-only. When copying from one, name the source repository and path in the commit message (CLAUDE.md).

## Chris's preferences, from this session

- The paper dolls look better than pixels, so everyone on the maps becomes one. The 3D models stay for the battles.
- Pixel-sharp maps up close are fine. He chose the smaller "75% light".
- Every step ends with a page he can open on his phone, in plain words.
- His songs go in last.
