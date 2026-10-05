# Handoff: What the Game Still Wants

> **Superseded on October 5, 2026.** What the game still wants is now `../handoff/tasks.md`, kept by the session that is the game's hub (`../handoff/README.md`). This list stays as the record of October 3.

October 3, 2026. The game plays from the title to the ending in one page (https://claude.ai/artifact/UDTnemDCiz2EKcoGqbCtm8), and every part has been played through headless with no errors. This note lists what is waiting on Chris, then everything Claude would add or improve, most important first. `status.md` has the links and `design-decisions.md` the reasons behind what is built.

**Done since, in `../putting-it-all-together/` (October 3, later):** the Bramble Colossus in the game (section 2); living battlefields on every painted battle (section 3, the first way); three save slots, a save code, word speed, larger text and separate volumes (section 9); the offline build (size and delivery); and `tools/game-test.mjs` (technical notes). Each is marked below.

**After Chris's first play (October 3, later still):** no footsteps; Io walks as Path Polish paints her, at Chris's settings; all thirteen walking maps retraced close, with walking behind lamp posts and trees (section 8), and squeezed to his "75% light"; art request 08 for everyone else as paper dolls (section 4); his three songs saved; the published game split into a small page and its pictures (size and delivery). `design-decisions.md` has the details.

## Waiting on Chris

1. **Io on foot** (`demos/io-on-foot.html`): Chris chose her height (52), the camera (15%) and her pace (1.7). Still open: whether the footsteps stay off, or one of the two new ideas goes in.
2. **The lore conversation.** Every line of the script is a placeholder (`src/game/script.js`):
   - the townsfolk's words;
   - the twelve new townsfolk's names: Old Wenna, Tobb and Pell in Bogmire; Marta, Brann and Tamsin at Dawnroost; Pim, Tock and Old Gil at the shipyard; Sorrel, Ede and the watchwoman in Misthollow;
   - the five well letters;
   - every story scene, the ending's words included.
3. **Art requests 06 and 07:** sixteen townsfolk portraits and nine story stills. Each goes in with one line in `src/game/stills.js`.
4. **The songs** are in (October 4, when Chris asked): Moonlit Forest Path for the towns, Herbal Decay for the wilds (`src/game/songs.js`). The fights keep their original battle music at his word, so Herbal Decay Battle stays out. The synthesized pieces keep the rest (the title, the marsh, the ruins, the flight, the ending).
5. **The Bramble Colossus** (`reference/demos/bramble-colossus-bench.html`): built as the plan below says (`demos/colossus.html`). Changes are still welcome: its name, where it lives, its moves.
6. **Art request 08:** a walk sheet for each of nineteen people, so everyone on the maps is a painted paper doll like Io. `node tools/cut-sheet.mjs` cuts each sheet into the game's walker.
7. **The next mobs** for the wilds (at least two), the way `putting-it-all-together/README.md` says.

## Gameplay, in order

### 1. Tuning from a real play

- Fights come every 7 seconds or so of walking in the wilds. The menu's Fewer and More settings scale that; the default may want moving.
- Load time per fight: every battle builds its models from scratch. If the wait shows on the phone, keep the heroes, Lunara and Envoi built between fights, and build only the foes.
- The finale is meant to be hard: an attentive player wins about one try in twenty. If that is too much once played by hand, ease the cold from 11.5% a turn.

### 2. The Bramble Colossus, the last band's great wild foe

**Built (October 3, later):** as planned, without the lair. Siren Bloom and Devour became one move in two turns, broken by fire or a big blow to its bare heart, since a battle turn can't stop halfway through Devour (`design-decisions.md`, "putting it all together").

Chris's model is a perfect boss: the Bramble Horror grown to 7.5 m, with a two-phase fight (Wrath at half HP), a weak point (its heart, bare while the bud is open), fear of fire, canes it loses, and ten big moves.

The plan:

- **Where:** band 4 only. It is a rare wild fight in the northeast peaks, about one in twelve, never in the first fights after landing.
- **Optionally, a lair:** the Thornheart, a hidden meadow below the peaks where spring still holds against Noctara's cold, because its heart is warm. That is the lore reason it grows where everything else is frozen. It would be a world-map place you can walk into, with a well, a letter and a big reward. Seen there first, the Colossus can then turn up in the wilds.
- **The fight:** always alone, Flee allowed, built on the Horror's rules (`BRAMBLE_MOVES`, scorch, canes, lure and grab), plus its own:
  - **Siren Bloom:** charm, the party steps toward it.
  - **Thorn Lance:** a single heavy blow.
  - **Hammerfall:** a club blow on one hero, with a shockwave on all.
  - **Maelstrom:** four hits on the whole party.
  - **Thorn Volley:** three waves of thorns.
  - **Devour:** lifts its prey into the flower; each gulp damages her and heals it, and fire or a big blow to the heart makes it spit her out.
  - **Thornwood:** shoots burst up round its prey and squeeze.
  - **Wrath** at half HP: faster, harder, its veins ember-red.
  - **The weak point:** blows land double on the heart while the bud is open (after Siren Bloom, Devour and Wrath).
- **Targets:**
  - at level 18 to 20, an expert wins about two times in three;
  - an attentive player wins about one time in four, and flees otherwise;
  - its rewards are three times a wild fight's.
- **Steps:** bring `colossus.js` into `src/models/`, add its rules and moves, add its targets to the balance simulator, then a demo page, then the game.

### 3. Living battlefields

The meadow in Chris's bench answers the fight: shockwaves roll through the grass, a roar sends the birds up, Wrath turns the sky into a red storm. Two ways to bring that in:

- **On every painted battle** (cheap, and it fits the look). **Built (October 3, later):** `src/fx/battlefield.js`. The battle screen already knows the ground plane of each painting, so these work on all nine:
  - shockwave rings with dust and turf thrown up where big blows land;
  - drifting ground mist and fireflies, or snow on the frozen road and the dead Moonwell;
  - rain and lightning with thunder for the storms;
  - birds or bats flushed out of the painted trees by roars and big hits;
  - falling leaves when the ground shakes;
  - a red tint over a painting's sky for a boss's second phase.

  What can't move on a painting is the painted grass and trees themselves. Foreground grass tufts in 3D could sway in front, but they'd look unlike the painting.
- **The meadow as the Colossus's own arena** (expensive, and it stands out). The whole 3D meadow, at night, behind that one fight: everything in it reacts.
  - It draws about 380,000 triangles in 150 draw calls; the painted battles draw far less.
  - It needs a frame-rate check on the Pixel 7a inside the full game first.
  - If it holds 30 fps, it is the most alive fight in the game, and a good reason to make the Colossus the band 4 showpiece.

### 4. The townsfolk

- **Painted paper dolls (Chris's call, October 3):** Io walks as Path Polish paints her, so everyone else becomes a painted walker too, one sheet each from art request 08, instead of the paper doll drawn in code that this note first proposed.
  - When a sheet comes in: `node tools/cut-sheet.mjs reference/art/walkers/<id>-walk.png <id>` finds its 24 figures by itself (on a clear or a green ground), and lays them out again with their feet on one line at the phone's size, as `art/walkers/<id>.webp` with a small JSON.
  - Then the field draws that person with the painted walker's code, as it draws Io (`src/walk/painted-io.js`), in place of their pixel figure (`look` in `maps.js`).
  - **Space:** about 200 KB a sheet, about 4 MB for all nineteen.
- **More townsfolk per town** (Chris's mission), each with a line or two that changes with the story. Some can walk a short beat, turn to Io as she passes, or do something: Hilde at her anvil, Pim and Tock at the slip.
- **Inkblot**, Quill's crow, on his shoulder and in his scenes: he is in Quill's sheet in request 08.

### 5. Story staging

- **Actors in the scenes:** **built (October 3, later)** for the four named here: a scene player in `src/game/field.js` and `game.js`, with stage directions in `script.js`, and a walking Halcyon. Today the other scenes are still words over the map. Sol should run in over the bridge, Quill should walk Io to the skiff, Halcyon should step out of the dark at the crossroads and Ysmera should meet them at the slip, all as sprites walking on the map while they talk. That is a small script player: move this person there, face her, wait, say.
- **The stills** from request 07 for the nine big moments.
- **A first-battle tip or two** (how to pick a command, what the gauges mean), shown once. **Built:** the command tip and the Trance tip.

### 6. The world between the stops

- **The D&D map's named places as landmarks** on the world map, each with something to find: Rotbridge, Willowmurk, Mosswatch Tower, Eldergrove, Fawnrest Shrine, Frostmere Lake, Peak's Veil and Stormwatch. That could be a letter, a herb, a short scene, an optional fight, or a side errand for a townsperson.
- **More wells and nodes.** Five letters and three nodes feel thin over four bands.
- **The flight:** more of Chris's demo — town cards with their notes, the whole-map view, the docking and take-off.

### 7. Depth beyond levels

Today the party grows only by levels and the story's gifts (Harvest Moon, Envoi, Kestrel Stoop). A light layer would make the wilds' rewards matter more. Two options, which need Chris's call:

- **Charms** found at wells and landmarks and given by side errands: one worn by each hero, with a small effect (+10% HP, Heat starts at 20, Lunar Mend costs less). **Built differently (October 4):** two hidden keepsakes, one each, that the balance never counts on (`design-decisions.md`, "polish").
- **Moonlore Io learns from the letters:** each letter she gathers teaches a small spell.

### 8. The field

- **Walking behind things: built (October 3, later still).** Each map's fronts (`maps.js`) are pieces of the painting (lamp posts, trees, arches, the Moonwell's frame) drawn again over Io, or anyone, standing behind them. The walk areas themselves now follow the painted ground on all thirteen maps.
- Footsteps and doors in sound; a soft step-in when a map loads. **Footsteps were built and taken out** (Chris didn't like them). `demos/io-on-foot.html` has two other ideas to try by ear: Path Polish's soft steps, and a cloak's swish.
- A run (hold the action button) for long walks. **Built differently:** the pace builds to a run after a moment of walking, so no button is needed.
- An ambient loop per place (wind on the pass, frogs in the fen, the forge at Dawnroost). **Built** from the music library's own sounds, each coming back now and then.

### 9. Menus and saves

- **Three save slots,** and a save code to copy and paste, to move a game between devices or between the two halves of a split demo (each published page keeps its own save). **Built.**
- Text speed, auto-advance and larger text. **Word speed and larger text are built;** auto-advance isn't.
- Separate volume for music and effects. **Built,** and a third for each place's own sounds (October 4).

### 10. Sound

- Chris's songs where he wants them. **Built (October 4).**
- A victory fanfare at the end of every fight, a short one for wild fights.

## Size and delivery

The final deliverable is one HTML file of at most 30 MB (Chris, October 3), sent to Chris to keep. It works offline, so three.js and the fonts are inside it.

| Part | In the file |
|---|---|
| Today's file, with the walking maps squeezed to Chris's "75% light" and Io's walk sheet | 15.0 MB |
| Chris's songs (2.4 MB of files) | +3.2 MB |
| Nineteen paper-doll sheets (art request 08, about 200 KB each) | +5 MB |
| Sixteen portraits | +1.7 MB |
| Nine story stills | +4.2 MB |
| **Everything** | **about 29 MB** |

That is just under 30 MB. For more room, the battle paintings (4.2 MB of files) and the world map (3.0 MB) can be squeezed to AVIF as the walking maps were, with a comparison page like Walking Map Resolution for Chris to choose from. (Overtaken since: the battle paintings were squeezed a little in pass three, and since October 5 every fight but the first is fought in front of Chris's battle backgrounds at his "Strong" squeeze, in the new battles' arenas; the world map's nine walking tiles are out of the game since October 5, when it became only flown, and the flight keeps its own far view and clouds.)

**The published game** fits on one page again (14.3 MB) now that the walking maps are squeezed. When the songs and the art push it past a published page's 16 MB, it is published split, as planned: a small page with its pictures beside it as files, at the same link with the same save. Build that with `node tools/build.mjs --min --split putting-it-all-together/game.html`; `dist/game-split/files.json` lists the pictures to publish with the page. Only the published copy is split, never the file Chris keeps.

**The file Chris keeps must work offline,** so its build embeds three.js and the two fonts instead of loading them from the web. **Built:** `node tools/build.mjs --min --offline putting-it-all-together/game.html` (15.0 MB today, with three.js and the fonts inside). `node tools/game-test.mjs --offline` plays it with the internet blocked and checks that its fonts are inside.

**Mooncart** (`building-with-assets-`) builds this repository with `node tools/build.mjs` and takes every page in `dist/`. With nothing after it, the build now makes the game too (`dist/game.html`), so the game reaches Mooncart once this branch is on the repository's main branch.

## Technical notes

- **Tests:** `tools/game-test.mjs` is the game test (October 3, later): the title, a new game, walking on a ground map and on the world map, the menu, the save slots and code, the staged scenes, and a wild fight or the Colossus to its end. Since October 5 its `world` step flies the Magpie instead (nobody walks the world map), and a `wilds` step walks each band's wilderness scenes by taps. Saves to start at each band came in pass three as the chapters (its `chapters` step).
- **The walking maps:** `node tools/trace-overlay.mjs <map> out.png 1600 --grid 25 --crop x,y,w,h` draws a map's walk areas, blocks and fronts over its painting, close up; `node tools/check-maps.mjs` checks that every exit, person, spot and arrival can be reached.
  - Headless Chrome renders slowly (a 3D fight takes several minutes), so set fights are weakened to keep tests short.
  - The unbuilt page can't load the flight's textures from `file://`; test the built page (`node tools/build.mjs --min putting-it-all-together/game.html`) or serve the folder.
- **Map tracing:** `node tools/check-maps.mjs` after any change to `src/game/maps.js`; `node tools/trace-overlay.mjs <map> <out.png>` to see it.
- **Balance:**
  - `node tools/balance.mjs` for the fights' 51 targets.
  - `node tools/chain.mjs` for the whole journey. Its walks are the game's measured ones (2, 3, 5 and 3 fights a band, measured by `tools/walks.mjs`; since October 5, band 2's also lights the three Ember Line nodes on the way, 2 fights more and their 900 shards: `story.js` `nodes` and `nodeFights`), and wild fights are worth 1.75 times their table (`rules.js` `WILD_REWARD`).
- **Each battle** makes its own WebGL context and frees it at the end. Fine so far; keeping one renderer for the whole game would be gentler on old phones.
- **Retired:** the walking test page (`demos/walk-test.html`) is superseded by the game.
