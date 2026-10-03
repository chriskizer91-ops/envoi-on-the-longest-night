# Next Session: Where the Work Stands

October 3, 2026, end of the session that put the game together. Read this first. Then:

- `docs/handoff.md` lists everything the game still wants.
- `putting-it-all-together/README.md` lists every piece, where it comes from and its state.
- `docs/design-decisions.md` (the October 3 sections) has the reasons behind what is built.

## Where things are

- **The branch:** all the work is on `ccr-9e19f4e2-29pyn6`, pushed.
  - The repository's default branch is still `claude/admiring-hawking-p7m87n`, and nothing is merged into it yet. Chris decides when.
  - Mooncart builds the default branch, so the game reaches Mooncart only after that merge.
- **The game:** `putting-it-all-together/game.html`, built from `src/`. It plays from the title to the ending.
- **Pages on Chris's phone** (private until he shares them):

| Page | Link |
|---|---|
| The game, put together (version 3) | https://claude.ai/artifact/9ix7XE5CT9pLrDATugkg2w |
| Io on Foot: her walk, with sliders and the footstep ideas | https://claude.ai/artifact/G1B5cMkYzBq4RiausDAAQj |
| Walking Map Resolution: the maps' compression choices | https://claude.ai/artifact/7F4pu4v3BQiKAZAtVJkC1i |
| The Bramble Colossus on its own | https://claude.ai/artifact/H2QTXhNnEi7W7Qbs6BXvA2 |

  To update a page from a new session, pass its link as `url` to the Artifact tool. Read it first: the tool asks for that before a publish.

## What this session did

**Put everything together** in `putting-it-all-together/`:

- the Bramble Colossus as the last band's great wild foe;
- living battlefields on every painted battle;
- three save slots and a save code;
- word speed, larger text, and separate music and effects volumes;
- the scenes' people walking on the maps;
- the offline file Chris keeps;
- the game test;
- `node tools/build.mjs` with no arguments builds the game too, for Mooncart.

**Then, after Chris's first play on his phone:**

- **No footsteps.** Each step played a whole four-step clip, so the clips piled into a clatter. Two gentler ideas are on Io on Foot to try by ear.
- **Io walks as Path Polish paints her,** on the ground maps and the world map:
  - the code is `src/walk/painted-io.js`, from Chris's `follow-me-down-witch-way`, `versions/path-polish/game`;
  - her walk sheet is `art/walk/io-walk.webp`;
  - she kneels at a well before its letter is read, and casts moonlight when she rests at a Moonwell;
  - the 3D model stays for battle;
  - **Chris's settings:** 52 map px tall, 15% of the screen's shorter side, pace 1.7 (`game.js`, `Field.create`).
- **All thirteen walking maps retraced** close to the painted ground (`src/game/maps.js`):
  - **walk areas:** where her feet can stand;
  - **blocks:** things cut out of the walk areas;
  - **fronts:** pieces of the painting redrawn over anyone standing behind them (lamp posts, trees, arches).
  - People and spots now stand on the paths. Every exit, person, spot and arrival can be reached.
- **The walking maps squeezed** to Chris's pick, "75% light": AVIF at 1152 px, quality 30. That is 1.1 MB for all thirteen instead of 3.6 MB.
- **Scenes:** the camera can follow a walking person (`{ focus: { on: 'sol' } }`), and each scene frames its people above the words.
- **Art request 08** (`docs/art-requests/08-paper-dolls.md`): one walk sheet for each of nineteen people, in Io's sheet's style.
  - `tools/cut-sheet.mjs` is ready to cut each sheet into the game's walker.
- **Chris's three songs** are saved in `art/music/`, to go in last.
- **Size:** the file Chris keeps is 15.0 MB (the limit he set is 30 MB). The published game is 14.3 MB on one page (a published page may be 16 MB).

## Waiting on Chris

1. **The footsteps:** none (as now), Path Polish's soft steps, or the cloak swish. He can try all three on Io on Foot.
2. **Art request 08's nineteen walk sheets,** and requests 06 (portraits) and 07 (story stills).
3. **At least two new mobs** for the wilds.
4. **The lore conversation:** every word of the script is still a placeholder.
5. **The songs** go in only when the whole build is finished, unless he says sooner. Ask before wiring them in.
6. **Judgment calls the map tracing made,** for him to confirm after a play:
   - **Cottage:** the forest path east doesn't quite meet the garden in the painting. A way through behind the hollyhocks and the fir keeps it reachable.
   - **Shipyard:** the slip's ramp is walkable, and the Magpie sits in its cradle.
   - **Dawnroost's living node:** she can climb the dais steps to the crystal.
   - **Bogmire:** the Magpie ties up on the west landing platform.
   - **Misthollow:** the watchwoman stands at the foot of the great stair. The chapel ledge passes behind one railing pillar.

## When things arrive

### The paper dolls (art request 08)

- **Cut each sheet:** Chris saves it as `reference/art/walkers/<id>-walk.png`. Then `node tools/cut-sheet.mjs reference/art/walkers/<id>-walk.png <id>` makes `art/walkers/<id>.webp` and `<id>.json`.
  - The tool finds the 24 figures by itself, on a clear or a green ground.
  - It lines their feet up at the phone's size.
  - The JSON gives the columns, the rows (in the order s, w, e, n), the cell size and where the feet stand.
  - Consider AVIF for the sheets too (add an option to `cut-sheet.mjs`).
- **Still to write: the drawing.**
  - Turn `painted-io.js` into a painted walker that reads that JSON.
  - In `field.js`, draw people and the scenes' actors with it once their sheet exists, keyed by their `look` or id in `maps.js` and `script.js`.
  - The standing frame is frame 1 of the facing row, with a slow breathing bob, as Io has. They turn to face her when she talks, as now.
  - Keep each person's height as drawn: children and gnomes are smaller on their sheets.
  - Make a demo page first (CLAUDE.md: every step ends in a page Chris can open on his phone).

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
