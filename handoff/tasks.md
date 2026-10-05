# The Tasks Left in the Game

October 5, 2026, early morning. Everything still to do for *Envoi on the Longest Night*, task by task, for the ultracode hub (`README.md`). Written by the old hub from three surveys of the repository (the decision records, what waits on Chris, and the code itself, each claim checked against a file or a command), and from Chris's own messages.

**This file is yours from now on:** keep it current as tasks finish or Chris decides new ones. (A second pass that would have checked it against the files was stopped at Chris's word, so where a step here doesn't match the code, trust the code and fix the step.)

**Kinds.** *Ready*: decided, and nothing to wait for. *Waiting on Chris*: decided, and blocked on his art, answers, notes or yes. *Finishing pass*: decided for the finished game, deliberately later. *Technical*: health of the build, the tests and the docs. *Idea*: offered, not decided. Nothing of an idea is built until Chris says yes; at most a demo page for him to judge.

## At a glance, in the order to take them

| Id | Task | Kind | Waiting on | Can run beside |
|---|---|---|---|---|
| T01 | The new battle arenas: bring them in (switch off), then switch on at Chris's yes | Part A **done** October 5 (`39350b5`), and the review's polish with a sharpness lever (`3685513`, `e8acb83`); part B waiting on Chris | His yes after the demo, for part B | T02 |
| T02 | The wilderness scenes: eight walking maps from his pictures, then walking off the world map | Step 1 **done** October 5 (the demo); step 2 waiting on Chris | His okay after walking the demo, and the four calls in T10 | T01 B |
| T03 | Fix the stale lines in the docs other sessions follow | **Done** October 5 (`9c65e72`) | | |
| T04 | Creatures of the wild (ten families, through the model studio) | Waiting on Chris | His sheets (art request 13); questions 26, 27 | T02; after T01 part A |
| T05 | Every word (the lore conversation, the workshop's `words` job) | Waiting on Chris | Him starting the session, and his answers | T02; after T01 part A |
| T06 | Townsfolk portraits (art request 06) | Waiting on Chris | His sixteen portraits | Anything but T13's size work |
| T07 | Story stills (art request 07) | Waiting on Chris | His nine stills, and one staging choice | T06 |
| T08 | Chris's notes from playing (the chapters, the arena demo, the wilds demo) | Waiting on Chris | His notes | Depends on the note |
| T09 | Map-editor path edits and keepsake moves | Waiting on Chris | "Send everything new" | Not with T02 while it edits `maps.js` |
| T10 | Small calls to put to Chris | Waiting on Chris | His answers | Anything |
| T11 | Chapters unlock only once the game is beaten | Finishing pass | The game being finished | Anything |
| T12 | The game on Mooncart: merge into the default branch | Chris's call | His word | After the round he wants on it |
| T13 | Size and publishing: the 16 MB page | Technical | Nothing | With T01 B, T02, T06, T07 |
| T14 | The file Chris keeps, after each round | Technical | Nothing | After any round |
| T15 | The tests: slow steps, and keeping them true | Technical | Nothing | Anything |
| T16 | The unexplained freeze at 20 frames a second | Technical | A freeze on his phone | With T01 B |
| I01 to I21 | Ideas, one line each, at the end | Idea | His yes | |

**What can run at once.** Never two agents in `src/game/game.js`, `src/battle/screen.js`, `src/game/fights.js` or `src/game/maps.js` at the same time: those four are where the tasks meet. T01 owns `screen.js` and `fights.js` until it's in; T02 owns `maps.js`, `world.js` and the landings in `game.js`; T04's intake and T05's words both touch `fights.js`, so bring T01's part A in first. Art, docs, demo pages and new folders can always run beside anything.

## Ready now

### T01: The new battle arenas

**Kind:** ready (part A), then waiting on Chris (part B). **Who:** the hub.

**Why.** Chris, October 4: "we have a bunch of battle backgrounds that are supposed to go with the Colossus in the meadow fight arena, so take the Colossus out and put all of the fights into an arena like that, with the different battle backgrounds." And `../docs/still-to-come.md` (1): "You see it on your phone first, then it goes into the game."

**Where it stands.** **Part A is done** (October 5): `work/arenas` was reviewed by dimension (flat battles, rules and balance, the phone's cost, the docs) and merged into the game's branch at `39350b5`, switched off. After the merge: balance 51 of 51, every map ✓, the published copy 15,160,262 bytes (4,816 more than before: the two shared files' code, no art), byte for byte the page on which the game test passed (title, new, and a band 2 wild fight at level 8, 915 × 412: "game test passed: title, new, wild in 306 s"), and `demos/arena.html` builds at 2.23 MB. The records say so. Before that: delivered in `relay/arenas.md`, on `work/arenas` (`865677d`), merged with the game's branch at `0757ee8` and checked (balance 51 of 51, every map, three demo fights, and the game test with the switch off: "game test passed: title, new, wild, keepsakes in 1088 s"). The demo page: https://claude.ai/artifact/FHpBiFsEhvUgvmu5hJaCea. The switch is off (`const ARENA = false;` in `src/game/fights.js`, and `putting-it-all-together/game.html` doesn't load the arena's scripts), so bringing it in changes nothing Chris plays. The full write-up: `envoi-final-draft/arena/README.md` on the branch.

**Steps, part A (now):**

1. `git fetch origin work/arenas`, then review its two files shared with the game, `src/battle/screen.js` (the arena mode, everything behind `AF`) and `src/game/fights.js` (the switch, `ARENA_OF`, `ARENA_AT`, `inArena()`, everything behind `if (arena)`), adversarially, by dimension: flat battles exactly as before when `AF` is null; the rules and the balance untouched; the phone's cost; the docs.
2. `git merge --no-ff origin/work/arenas`. If you've changed either shared file since `0757ee8`, keep both the arena's lines and the keepsakes' (`wearing()`, `flee: fleeOf(P)`).
3. Check, then push: `node tools/balance.mjs`, `node tools/check-maps.mjs`, `node tools/build.mjs --min putting-it-all-together/game.html`, `node tools/build.mjs demos/arena.html`, `node tools/game-test.mjs --steps title,new,wild --band 2 --level 8 --size 915x412`.
4. Records: a row for the arenas in `../putting-it-all-together/README.md` (in the game's branch, switched off), `../docs/still-to-come.md` (1), `../docs/next-session.md`; and "Brought in at `<sha>`" as the first line of `relay/arenas.md`.

**Steps, part B (on Chris's yes after he plays the demo):**

5. His yes, in his words, in `../docs/design-decisions.md`. It most likely answers the wild meadow's question too (`../docs/questions/open.md`, "The wild meadow", 4: where the living meadow goes): its way of fighting, behind every fight but the first. Confirm that with him in a line, then mark it answered.
6. Switch on: `const ARENA = true;` in `src/game/fights.js`, and in `putting-it-all-together/game.html`, right after `<script src="../src/fx/battlefield.js"></script>`, the nine lines: `../src/fx/arena.js`, then `../src/stage/arena-<place>.js` for `river-glade`, `warm-roads-moor`, `eldergrove`, `frostmere`, `bogmire`, `dawnroost`, `crossroads` and `dead-moonwell` (the README's "Switching the game over" has them).
7. **Both cutscenes' last shots into the arenas: done ahead** (October 5, behind the switch: nothing changes while it is off). Each cutscene ends on its fight's opening frame and the game cross-fades from its last picture into the fight; on the flat painting that frame is still the painting's camera, exactly as before. When the fight's config has an arena (`cfg.arena`), the game now gives the cutscene the arena (`arenaFor` in `src/game/game.js`: the place's camera, frame and pixels a metre from `makeArenaField.view`, new at the end of `src/fx/arena.js` and used by `makeArenaField` itself; `cfg.heroes[i].home` and `cfg.slots` with their heights and turns; nothing for a flat fight; Settings' Watch again gives it too, with the switch on), and the last shot ends on the arena's eye-height camera with the battle's own opening crop: `arenaFrame` in each cutscene's `src/player.js` mirrors `shotField`, `shotFit` and `applyCam` (the margins times ZK, the giant's-head rule, ZMAX, `BELOW`), and its lens's window slides onto the crop during the glide, so it lands exactly. Each `src/scene.js` lays the arena in its place (`arenaPlaces`): the Colossus's arena with its Colossus on the cutscene's spot, turned about 12 degrees so the party stands in the same direction from it (they stop 1.4 m sooner, shots 4 and 5 moving with them); the finale's square on the court with Halcyon and Noctara's middle where it was (the two move 0.3 m, Io and Sol walk up to the arena's places). In the game, an arena fight after a cutscene opens on that same crop and holds it, menus down, for a second while the picture fades into it: the game fades the picture once the battle says it has drawn that frame (`cfg.game.shown`, from `intro` in `src/battle/screen.js`, after an `await wait(0)`, which carries on once the next frame is drawn: that first frame after `begin()` also builds the new foes' shaders, and the review found that a fade asked for before it would, on a phone, run over the frame before it, the close-up on Io; after 15 s if it never does) instead of 1.2 s after the battle starts building, which in an arena showed the fight still building, or its camera gliding out from Io with the menus up. Proved in a scratch copy of the page with the switch on (never committed: `const ARENA = true` and the nine lines), each cutscene skipped with Esc as a player can: at 915 × 412 and at 1366 × 768, for both fights, the battle's opening crop is the cutscene's last one exactly, read from both cameras (the Colossus: its frame drawn 915 × 686 and cropped from 0, 134 on the phone, 1749 × 1312 from 375, 305 on a laptop; the finale: 1373 × 1029 from 238, 472, and 2049 × 1537 from 356, 639), and side by side and blended at 50% everyone stands in the same place at the same size, on the same eye-level horizon. (The weather was already done: after a cutscene an arena fight starts clear, `game.js` `battle()`.) Both modules rebuilt; both `tools/check.mjs` "all good", with a third section for the arena, the arena the game's own sources give (`GameFights.config` with `opts.arena`, then `Game.arenaFor`, moved out of `start` for it), and section 2 holding the flat last picture to its camera, crop and places before the arenas (`84af961`). `arenaFrame` copies the battle screen's crop rules, and both sides say so (`screen.js` at `ZK`, each `player.js` at `arenaFrame`). The game test's `colossus` step now cuts its fight short, as `keepsakes` does, and closes the two keepsake cards its first win leaves (left open, they kept the game busy, so the `finale` step after it never started its fight); with the arenas on, its `colossus` and `finale` steps check that the fight opened on the cutscene's last lens and crop (the battle's `opening` against the cutscene's `last.camera`). With the switch off `--steps title,new,colossus,finale --band 4 --level 18` passes in one go ("game test passed: title, new, colossus, finale in 283 s", with "Victory! (win)" and both cards closed), and the cutscene's last picture on the flat painting is the same as before (the Colossus's dot for dot; the finale's but for a few snowflakes); in the scratch copy with it on, so do both steps, at 915 × 412 and at 1366 × 768, the crops compared (in 335 s and in 525 s, the same crops as above); and timed there with nothing held, the frame the battle has just drawn when it asks for the fade is the opening crop (the frame that built the new foes' shaders, 10 in 0.77 s for the Colossus and 25 in 1.36 s for the finale, the ask about 20 ms after it; before the fix the finale's ask came while the 3D canvas still held the close-up on Io, its first frame of the opening crop 0.12 s later and 1.28 s long), and no frame while the picture fades builds a shader. The published copy grows by about 10,000 bytes: 15,170,868 switched off (10,375 more), and 15,583,813 switched on (10,814 more than step 8's 15,572,999), still under sixteen million. Left: with the switch off the flat hand-over is as before (its fight opens on Io and glides out with the menus up under the fading picture); the cutscenes' 3D places and the arenas' paintings are different pictures of the place, so under the still camera and figures the background dissolves from one to the other (the meadow's far edge sits higher than the painted one, the cutscene's peaks are nearer); Frostmere's light snow falls only in the fight. The words job (T05) rebuilds the same two modules: whichever lands second rebuilds again.
8. Size (T13): with the arenas the published copy (built with `--min`, without `--offline`) is 15,574,382 bytes (14.9 MB as the build counts; measured October 5 with the polish, the sharpness lever and the review's fix, 1,152 bytes more than without them), under sixteen million: no lever is needed. (The 16,379,946 first written down was the copy an `--offline` build leaves, with three.js and the fonts inside; never publish that one.) Only 0.43 million bytes are then left under sixteen million, so T02's scenes go in with the world's walking tiles out (T13). (`src/battle/screen.js` loads its painting through `ART_BASE` since October 5, so `art/arena` could go beside the page if it ever had to.)
9. Tests: `node tools/game-test.mjs --steps title,new,wild --band 2 --level 8` (its fight now on the moor; it says where each fight is fought and how sharp its 3D is drawn), again with `--sharp 0.5` (the Settings' Half), the `colossus` and `finale` steps (their cutscenes hand over into the arenas; weaken foes as the tests do), `keepsakes`, then the full test; `node tools/arena-test.mjs`; balance unchanged.
10. Publish the game (`dist/game.artifact.html` with every file in `dist/game.beside.json`) at https://claude.ai/artifact/BgSiyXBu53iW7DJVF1seV8, and give Chris the file he keeps (T14).

**Files.** `src/fx/arena.js`, `src/stage/arena-*.js`, `art/arena/`, `src/battle/screen.js`, `src/game/fights.js`, `putting-it-all-together/game.html`, `demos/arena.html`, `tools/arena-test.mjs`, `envoi-final-draft/arena/`, both cutscene folders (part B), the docs above.

**Done when.** Part A: `work/arenas` is in the game's branch, the game builds and plays exactly as before, and the docs say so. Part B: Chris has said yes; every fight but the first is fought in its arena; both cutscenes hand over without a jump; every test passes; the game is published and Chris has the link and the file.

**Done ahead of part B** (October 5, from the review, none of it changes a flat fight): a painting that can't load sends the game back to the map instead of leaving the fight's start card up (`screen.js`, `onerror`); the painting is read through `ART_BASE` like every other picture; a battle that can't start (an arena that fails to build) hands back to the map (`game.js`, `battle()`); the arena fight after a cutscene starts in clear weather; and both cutscenes end on the arena's opening frame, which the fight then opens on (step 7).

**Starting a fight** (the review, checked): each arena fight takes a little longer to set up than a flat one, since its ground is built while the "Setting the scene…" card shows (about a tenth more than the fighters' own build, which every fight already pays), and it never slows the fight itself. If the starts ever feel slow on his phone, the arena's canvases could be built once per place and kept (`src/fx/arena.js` is seeded per place, so they come out the same). The review's smaller notes are done (below).

**Polish and the speed lever** (October 5, `3685513`, behind the switch: the game plays exactly as before, and the one thing it shows, a new Settings row, changes nothing until Chris picks). `src/fx/arena.js`: the sheet's shader works out the rain's puddle noise and ripples only while the ground is wet (a uniform branch on `uWet`, the ripples on `uRain`), and the black water's rain rings only while it rains; `AF.dispose()` disposes the instanced meshes (three r128 frees their buffers only there) and empties every texture's canvases (if the canvases are ever kept per place for faster starts, leave those out); one scratch `THREE.Euler` for the debris; the debris is drawn only while any is up and the birds or bats only while any fly (`AF.stats.debris`, `.birds`), by an instance count of 0 and an empty draw range, never `.visible = false` (`e8acb83`, from the polish's review: hidden at the start, their shaders were built at the first heavy blow of every arena fight, because the start's `renderer.compile()` counts Lunara's and Envoi's lights, hidden straight after; left in the scene, they are built in the opening frames with everything else). The sharpness lever: `src/battle/screen.js` reads the 3D's sharpness like the frame rate (`envoi.sharp`: 1, 0.75 or 0.5, 3/4 by default; or `cfg.sharp`), and `start(cfg).sharpness(v)` changes it mid-fight (`renderer.setPixelRatio`, then `layoutView()`); `demos/arena.html` has a **Sharpness** button beside fps; the game's Settings has **Battle sharpness** (Full, 3/4, Half) beside Battle frame rate. The tools: `arena-test.mjs --seed N` (the same foes and weather every run), the stones and birds up in each counted frame, and the Sharpness button pressed round once a run; `game-test.mjs` says where each fight is fought and how sharp, checks the Settings row, and takes `--sharp`. **Next:** publish the demo again (https://claude.ai/artifact/FHpBiFsEhvUgvmu5hJaCea) so Chris has the button.

Checked, headless (October 5):
- Every place drawn with `arena.js` before and after, on a clear night, in a storm (wet, raining) and just after a heavy blow (28 stones, 28 birds up): all 24 pictures identical, dot for dot. Whenever no stones or birds are up, two draw calls and 2,912 triangles fewer (2,968 where bats fly).
- `node tools/arena-test.mjs --seed 5`, every fight at 915 × 412, before (the page built at `84af961`) and after: both "arena test passed", no errors; the Sharpness button: "3/4 sharp, Half sharp, Full sharp, 3/4 sharp; the 3D drawn 271, 181, 362, 271 pixels tall on a stage 362 tall". The same foes and weather in both; counted at a command right after a turn's blows, so the birds were up in every fight, and stones in five:

| Fight | Weather | Foes | Draw calls | Triangles | The arena's part | Stones, birds up (after) |
|---|---|---|---|---|---|---|
| The first fight (flat) | | a wraith | 81 → 84 | 156,385 → 156,391 | | |
| Band 1 wilds, the river glade | storm | a wisp, a wraith | 111 → 111 | 298,026 → 298,026 | 14 and 27,682 → the same | 6, 27 |
| Band 2 wilds, the moor | storm | a wraith, two wisps | 121 → 121 | 313,698 → 313,698 | 14 and 26,976 → the same | 6, 26 |
| Band 3 wilds, Eldergrove | clear | a wraith, a frost wisp | 110 → 110 | 291,480 → 291,480 | 13 and 21,136 → the same | 6, 26 |
| Band 4 wilds, Frostmere | clear | three frost wisps | 115 → 115 | 264,064 → 264,064 | 14 and 19,600 → the same | 6, 28 |
| The Bramble Horror, Eldergrove | clear | its low ambush | 97 → 96 | 292,506 → 289,706 | 13 and 21,136 → 12 and 18,336 | 0, 28 |
| The Bramble Colossus, Frostmere | blizzard | the Colossus | 101 → 100 | 322,114 → 319,314 | 14 and 19,600 → 13 and 16,800 | 0, 28 |
| Gate 5, Bogmire | clear | the great wraith | 113 → 112 | 271,826 → 269,026 | 21 and 9,816 → 20 and 7,016 | 0, 28 |
| Gate 10, Dawnroost | clear | three wraiths | 129 → 129 | 377,682 → 377,682 | 10 and 6,444 → the same | 6, 27 |
| Gate 15, the crossroads | clear | Halcyon | 111 → 110 | 308,158 → 305,358 | 13 and 23,296 → 12 and 20,496 | 0, 25 |
| The finale, the dead Moonwell | clear | Halcyon, Noctara | 155 → 155 | 372,520 → 369,722 | 12 and 4,352 → 11 and 1,552 | 0, 21 |

  The flat first fight has no arena: its three more draw calls are effects that happened to be on screen at the count. In the finale the arena's part fell by one and the fighters' effects rose by one.
- `node tools/game-test.mjs --steps title,new,wild,menu --band 2 --level 8 --size 915x412` (the switch off): "fought on the flat painting, its 3D at 3/4 sharpness (686 x 309)", "Victory! (win)", "Settings: Battle frame rate 30*, 45, 60, Screen; Battle sharpness Full, 3/4*, Half (Half kept as 0.5, then 3/4 again)", "game test passed: title, new, wild, menu in 275 s".
- With the switch on, in a scratch copy of the game page (`ARENA = true` and the nine lines): `node tools/game-test.mjs --steps title,new,wild --band 2 --level 8 --size 915x412 --sharp 0.5`: "fought in the arena at warm-roads-moor, its 3D at half sharpness (457 x 206)", "Victory! (win)", "game test passed: title, new, wild in 384 s". After the Settings check's last change, `--steps title,new,menu --size 915x412`: "game test passed: title, new, menu in 46 s".
- The demo's header, upright (412 × 915), sideways (915 × 412) and on a laptop (1280 × 800), at a Pixel 7a's pixel ratio: a press on the list is kept and the next fight starts at it; in a fight each press redraws the 3D at once (sideways: 915 × 362 at Half, 1830 × 724 at Full, 1372 × 543 at 3/4). Upright, the fight's four buttons first ran off the screen (Sound cut off); the header now gives them two rows, and sideways and on a laptop they stay on one.
- `node tools/balance.mjs`: 51 of 51 targets met. `node tools/build.mjs demos/arena.html`: 2.24 MB (2,349,166 bytes with the review's fix; 5,208 more than at `84af961`). The published game (`--min`): 15,161,328 bytes, 835 more than at `84af961`, the same file with the review's fix (SHA-256 `aa22f168…`: the game page doesn't load `arena.js`); with the switch on, 15,574,382 (1,152 more).
- After the review's fix (`e8acb83`), on the demo built from it. The reviewer's probe (band 1, clear, waiting for a command, then `throwDebris(0, -4, 1.2, 16)`, then `roar(1)`): no GL program built once the battle had begun, the stones drawn with the same program before and after the throw, the frames after it 2.3, 5.2, 3.0, 2.5 ms against a 2.9 ms median (hidden, at `3685513`: 1.9, 8.0, 11.5 against 2.7, the birds' program built at their first flight and the stones' at the throw; at `84af961`: 1.8, 3.2, 2.1, 3.1). The 24 pictures against `84af961`'s arena: "all 24 identical", with the same two draw calls and 2,912 triangles fewer whenever none are up (2,968 where bats fly). `node tools/arena-test.mjs --seed 5`, every fight at 915 × 412: "arena test passed", no errors, the Sharpness button as before; the arena's part the same as in the table's after column in every fight, and the totals too but for the fighters' own effects at the counted moment (the flat first fight 83, the finale 154 calls and 369,720 triangles). With the switch on (the scratch copy), `node tools/game-test.mjs --steps title,new,wild --band 2 --level 8 --size 915x412` at the default sharpness: "fought in the arena at warm-roads-moor, its 3D at 3/4 sharpness (686 x 309)", "Victory! (win)", "game test passed: title, new, wild in 617 s". With the switch off nothing reaches the game: `dist/game.html` and `dist/game.artifact.html` built from `e8acb83` are byte for byte those built at `3d94dd5`, on which the switch-off test above passed. `node tools/balance.mjs`: 51 of 51.
- **Not done** (seen while checking the fix; as at `84af961`): the rain and the two lightning meshes are still hidden until they first show, so the first bolt of a fight builds its small shader then (`strike()` in a clear fight waiting for a command: one program, a 4.3 ms frame against a 2.5 ms median), and the rain likely builds its own when a storm first rains, as the Colossus's Wrath does mid-fight. The same fix (an empty draw range while they're off) would do, if a first bolt ever stutters on the phone.

**Risks.** How fast it runs on his phone (the busiest: gate 10, 129 draw calls and 378,000 triangles; the finale, 155 and 370,000; the meadow he measured at 29 to 30 fps drew 96 and 319,000). His levers: the 3D's sharpness (the demo's Sharpness button, the game's Settings) and the frame rate. The 20 fps freeze (T16). The Colossus's and the great wraith's heads cut off above the menus on the phone. Bogmire's lamps found by warm colour. Close-ups less close than today's. All in `relay/arenas.md`, "Open points".

### T02: The wilderness scenes

**Kind:** ready. **Who:** the hub, as a workflow (or a session Chris starts with the workshop's `wilds` script; its brief no longer needs the pictures attached).

**Why.** Chris decided on October 3 that the world map is only for flying the Magpie and that walking happens only on painted scenes, and on October 5: "The walking plan is good, make the scenes at night" (`../docs/design-decisions.md`, "October 5, 2026: the wilderness scenes"). His eight pictures came the same night.

**Where it stands.** **The hub took this job on October 5** (the workshop's `wilds` job needs no session): the eight pictures are squeezed into `art/walk/` (1.2 MB, `887719f`), the map tools check a scene traced in a file of its own (`MAPS_EXTRA`) and read `src/game/maps-wilds.js`, where the eight scenes are staged until Chris walks the demo and says yes (the game's page doesn't load that file, so the published page doesn't grow before then); then they move into `maps.js`. **Step 1 is done** (October 5): all eight traced (each by one agent, checked region by region against the painting by a second, fixed by a third), joined in `src/game/maps-wilds.js` with every arrival linked, every map ✓; the demo page `envoi-final-draft/wilds/` (its own headless test passes at 915 × 412 and 1366 × 768, walking every band's road by taps) is published at https://claude.ai/artifact/2WSu7uWvtDUmF5JwxV5xwC. Its README records each scene, the arrivals and where the side paths end. **Step 2 is planned** in `../envoi-final-draft/wilds/plan-into-the-game.md` (read-only, checked against the code at `23145a4`): it must land as one commit (the scenes in `maps.js`, the world's walking tiles and `World.create` out, every `goWorld` caller rerouted, old saves mapped, the tools and tests in step), or the page passes 16 MB or the tools break. It waits on Chris's okay and his four calls (T10, 6 to 9). Before that: the eight pictures are in `../reference/art/walk/wilds/` as he sent them (1536 × 1024, at night, the camps' landing ground empty; his packs' notes in `packs/`, including which candidate he kept and why). Nothing is built: `src/game/maps.js` has the thirteen old maps; bands 2 to 4 are walked on the world map (`src/game/world.js`, random fights from a hidden counter, `src/game/game.js` around line 209); the three camps and the three Ember Line nodes are markers on it (`PLACES` and `LANDINGS` at the top of `game.js`).

**Steps:**

1. **The maps and a demo page,** exactly as `../envoi-final-draft/workshop/wilds.md` says (steps 3 to 7), on a branch of your own or in worktrees:
   - squeeze each: `node tools/compress.mjs reference/art/walk/wilds/<file>.png --out art/walk --avif --q 20 --width 1536` (about 0.1 MB each);
   - trace each as a new entry at the end of `MAPS` in `src/game/maps.js`, with the ids, exits and arrivals in the brief's table (`warm-roads-camp`, `ember-line-road`, `dawnroost-road`, `northern-camp`, `eldergrove-edge`, `cold-moor`, `frozen-camp`, `frostmere-shore`); `wild: { band, scene, rate: 1 }` on the five walks; a rest spot and `land` on each camp; the Ember Line road's nodes as spots with the world map's ids (`node1` to `node3`; his pack says where: one beside the road, two at the ends of side trails);
   - see a trace: `node tools/trace-overlay.mjs <id> /tmp/<id>.png 1600 --grid 25`; check it: `node tools/check-maps.mjs <id>`;
   - fanning out: tracing the eight is the parallel part, but they all end in `maps.js`. Have each agent write its entry into a file of its own and add them to `MAPS` one at a time;
   - the demo page `envoi-final-draft/wilds/wilds.html` (Io walks each band's row from its camp, notes where fights would start), tested headless at 915 × 412 and at a laptop's size, published privately; Chris walks it.
2. **On Chris's okay, into the game** (the brief's "For the hub"):
   - the camps as the Magpie's landings: in `LANDINGS` (`game.js`), `warmCamp`, `northCamp` and `frozenCamp` become `field: ['<camp id>', <land>]` like the docks, instead of `world:`;
   - the world exits that meet the scenes become exits into them: Dawnroost's south one (`maps.js`, rect `[592, 1006, 690, 1024]`) to `dawnroost-road`, the crossroads' west one (`[0, 440, 18, 530]`) to `cold-moor`, and the frozen pass's south one (`[674, 1006, 902, 1024]`) to `frostmere-shore`; where each arrives comes from the traces;
   - **the other world exits:** the crossroads' south and east ones, and the cottage's three (band 1's places are joined directly: Wickhollow, the Thornwood, Bogmire), all open the world map today. Decide what each does once the world map is only for flying (close it, or lead to the nearest scene); if the story doesn't make it plain (`src/game/story.js`), ask Chris;
   - the nodes as field spots (`onSpot`) with the same `st.done` ids, so saves carry over; the story's next steps and the golden arrow (`src/game/goal-arrow.js`) through the scenes;
   - walking off the world map (`world.js`): it opens only for flying;
   - in the same change, the world map's nine walking tiles out of the page (`art/world/night-*.webp`, 2.2 MB on disk; flying keeps `far-view.webp` and `night-clouds.webp`), since the eight pictures add about 1 MB and the page is near 16 MB (T13);
   - the journey simulation in `src/game/story.js` and the encounter counts in `../docs/design-decisions.md` follow the new walks;
   - the test's `world` step walks the world map today (`tools/game-test.mjs`, `step === 'world'`): make it fly instead, and add a step that walks a band's row;
   - rebuild and republish the map editor so Chris can edit the new scenes: `node tools/build.mjs envoi-final-draft/map-editor/map-editor.html`, published at https://claude.ai/artifact/M3PokTZsXbbxbx2BSDSrC5.
3. Build both copies, test (T15), publish the game, give Chris the file (T14), and update `../docs/still-to-come.md` (2), `../docs/next-session.md`, `../putting-it-all-together/README.md` and `../docs/art-requests/12-wilderness-scenes.md`.

**Files.** `art/walk/walk-*.avif` (eight new), `src/game/maps.js`, `src/game/game.js` (`PLACES`, `LANDINGS`, the world's encounters), `src/game/world.js`, `src/game/story.js`, `src/game/goal-arrow.js`, `putting-it-all-together/game.html` (if the world's tiles are named there), `tools/game-test.mjs`, `envoi-final-draft/wilds/`, `envoi-final-draft/map-editor/`, the docs.

**Done when.** Io walks every band from its camp to its town on painted scenes, with fights on the five walks and none in the camps; the Magpie lands at the camps; the world map is only for flying and its walking tiles are gone; old saves still load (the nodes keep their ids); every check passes; Chris has walked the demo, then the game.

**Checks.** `node tools/check-maps.mjs` (every map ✓), `node tools/balance.mjs` (51 of 51), `node tools/game-test.mjs --size 915x412` and `--offline`, the demo page's own test, both builds' sizes (T13).

### T03: The docs other sessions follow

**Kind:** technical. **Who:** the hub, before it starts any workshop or modeling session. Nothing here changes the game.

**Fix:**

1. `../docs/questions/open.md`, question 28: says the great creatures' keepsakes (the Mire Pearl, Sunstone Heart, Fawnrest Heartstone, Roc-Feather Cloak, Thornwreath) "are among the twenty"; none is in the locked list (`../envoi-final-draft/items/items.js`). Correct it before it's asked again. Its header still says "as of October 3".
2. `../docs/next-session.md`: "Waiting on Chris" says to read path edits from the Walking Paths page, which this account can't read: the map editor took over (`../envoi-game-pass-3/map-paths/README.md`). "Room for the art: squeeze the battle paintings and the world map" is overtaken by the arenas and T02.
3. `../docs/art-requests/06-townsfolk-portraits.md` (lines 3 and 5) and `src/game/stills.js` (its header) still speak of pixel sprites and portraits; since pass three the townsfolk are paper dolls (`../docs/design-decisions.md`).
4. `../docs/art-requests/13-wild-creatures.md`, line 3: says request 12 waits on questions 20 and 21, answered October 5.
5. `../docs/still-to-come.md` and `../docs/next-session.md` list "Inkblot on Quill's shoulder" as an idea, but Quill's paper doll already carries the crow in every frame (`art/walkers/quill.avif`). What's left is only Inkblot in scenes or on the Magpie's perch (`src/models/magpie.js`).
6. `tools/game-test.mjs`: its usage line names eleven of its fifteen steps (add `keepsakes`, `songs`, `finale`, `scenes`).
7. `../envoi-final-draft/model-studio/intake.md`: written before the arenas. Add that a creature also needs its place in `ARENA_AT` (pack, lone or great) once T01 is in.
8. `../living-battlefields/README.md` and `../docs/art-requests/10-painted-meadow-backdrop.md`: request 10 (the meadow's backdrop) was never delivered and nothing needs it now (Chris's battle backgrounds took its place); mark it superseded once Chris agrees (T10).

**Done when.** None of these says anything untrue; one commit, "Docs: ...". **Done** October 5 (`9c65e72`), each change checked against the files by a second pass, which also corrected the same false claims in `../envoi-final-draft/README.md` and `../docs/art-requests/08-paper-dolls.md`.

## Waiting on Chris

### T04: Creatures of the wild

**Who:** a modeling session per creature (Chris starts them, or the hub may: `../envoi-final-draft/model-studio/README.md`), then the hub's intake. **Waiting on:** Chris's two sheets per creature (a model sheet and an action sheet) for art request 13, wave 1 first (the thornhound, the glowcap, the mire-toad, the moor-boar). Questions 26 (the list and names) and 27 (how a beaten creature leaves) set their defeat lines but don't block the sheets.

**Why.** Chris, October 4: "give me them as image prompts ... I will make the character sheets of them and then 3D model them in other conversations and bring them back here". Today about nine wild fights in ten are against Noctara's three foes, and bands 1 and 2 have nothing else.

**When sheets arrive:** keep them as they came in `3d-model-new-character-ideas/<id>/original/` (`<id>-model.<ext>`, `<id>-actions.<ext>`, per `how-to-model.md`); open or let Chris open a modeling session on `work/model-<id>` (two or three at once at most); it hands back a return slip. The hub brings each in by `intake.md`: the diff touches only its folder; the budget (a pack creature 45,000 triangles and 12 draw calls, a lone one 90,000 and 20, a great one 120,000 and 24); its model into `src/models/`; its `FOES` entry in `src/battle/rules.js`; `FOE_LOOK` and `makeFoe` in `src/game/fights.js` (and its place in `ARENA_AT` once T01 is in); `BAND_PACKS` in `src/battle/sim.js`; `node tools/balance.mjs` (51 of 51, or new targets agreed) and `node tools/chain.mjs`; a demo in `demos/`; its line in `game.html`; its defeat line (T05's words); `node tools/game-test.mjs --steps title,new,wild --band <b> --level <l>` and `--offline`; publish; the board in the model studio's README.

**Mind.** Old Snag's hatchet (`briefs/moor-boar.md`) is a prop, not a keepsake: the twenty are locked. The Gloamwing and the Emberback stay out of the game (pass three). Each creature costs about 0.06 to 0.09 MB.

### T05: Every word

**Who:** the workshop's `words` session (`../envoi-final-draft/workshop/words.md`), which Chris starts and talks to; the hub brings it in. **Waiting on:** Chris starting it (or his own lore conversation) and approving the lines.

**Why.** Every line in the game is a placeholder for his lore conversation (`src/game/script.js`, its header): the townsfolk and the twelve placeholder names, the five well letters, the 28 story scenes and the ending, the 14 found-keepsake lines, the four gifts and the Colossus's two, each fight's `introMsg` and `introAfter`, and both cutscenes' captions. The open questions go with it: 24, 26 to 29, 32, and the Colossus's name and moves (`../docs/questions/open.md`, "New character ideas", 3).

**The job (its brief has the details):** read the canon in order (CLAUDE.md), ask a few questions at a time, write his answers in `../docs/lore/lore-answers-2026-10-05.md` and mark them answered in `open.md`, a script page per chapter for him to approve, then the approved words only: `script.js`, the twelve `name:` fields in `maps.js`, `introMsg` and `introAfter` in `fights.js`, and each cutscene's `src/words.js` (rebuilt, `tools/check.mjs` "all good"). It never changes conditions or stage directions.

**For the hub.** Leave `script.js` alone while the job is out. Bring T01's part A in before it starts (both touch `fights.js` and the cutscenes). The ending's "Even the ones at the wells" (`script.js`, the ending) is said even when Io found none: making it conditional is the hub's (I17), not the words job's.

### T06: Townsfolk portraits

**Waiting on:** Chris's sixteen portraits for art request 06 (1:1, at least 1024 × 1024, head and shoulders, plain deep indigo ground), saved as `../reference/art/portraits/portrait-<id>.png`. Suggest he attaches each person's paper-doll sheet (`../reference/art/walkers/<id>-walk.png`) so the painting matches the doll.

**Then:** squeeze each into `art/portraits/portrait-<id>.webp` as the first three are, and add `<id>: "art/portraits/portrait-<id>.webp"` to `window.PORTRAITS` in `src/game/stills.js` (double quotes, so the build puts it inside). The ids are the cast's (`script.js`): gretch, nettie, hilde, quill, wenna, tobb, pell, marta, brann, tamsin, pim, tock, gil, sorrel, ede, watch. Build, test, publish. **Size:** portraits and stills together add 2 to 3 MB: put `art/portraits` beside the page or wait for T01's and T02's room (T13).

### T07: Story stills

**Waiting on:** Chris's nine stills for art request 07 (3:2, at least 1536 × 1024, at night, the bottom fifth calm and dark) in `../reference/art/stills/`, and one choice, per scene: today a still *replaces* the walking staging of its scene (`game.js`: a scene with a still plays only its lines), and four scenes are staged (sol, magpie, ambush, shipyard). Ask him: the still, the staging, or the still first and then the staging.

**Then:** squeeze into `art/stills/`, add `<scene id>: "art/stills/<name>.webp"` to `window.STILLS` (`stills.js`). Names to scenes: still-prologue → prologue, still-lights → lights, still-spared → ambush, still-ending → ending, and so on per the request. `still-envoi` needs a hook in the Dawnroost gate's win (Envoi is made there, in `fights.js`, not in a scene); `still-moonwell` needs a place (the finale now opens with its cutscene). Size as T06.

### T08: Chris's notes from playing

**Waiting on:** his notes: the five chapters (the game's Chapters, on the title), the arena demo (T01), the wilds demo (T02), the game itself. Act on each as it comes: his words in `../docs/design-decisions.md`, a demo page if it's new, then the game, tests and a publish. If he wants the five chapter demos back as their own links (the old ones came from his other account and can't be updated), `node tools/make-demos.mjs` after a build, and publish each `dist/demo-*.artifact.html` with the beside files.

### T09: Map-editor edits and keepsake moves

**Waiting on:** Chris pressing "Send everything new" in the map editor (https://claude.ai/artifact/M3PokTZsXbbxbx2BSDSrC5). Today nothing is pending (`edits` holds his Wickhollow nook, already in; `places` is empty).

**Then:** paths: read `edits` with ArtifactData (with `out_dir`), `node envoi-game-pass-3/map-paths/check-edits.mjs <file>`, then `apply-edits.mjs`, and move exits, people, spots and arrivals by hand (`../envoi-final-draft/map-editor/README.md`). Keepsakes: read `places`, copy each new `at` into `../envoi-final-draft/items/items.js`. Then `node tools/check-maps.mjs`, build, `node tools/game-test.mjs --steps title,new,keepsakes`, publish with the beside files. Not while T02 is editing `maps.js`.

### T10: Small calls to put to Chris

Ask these when he's next with you, a few at a time, and write each answer down where it says.

1. **The cutscene Io's face:** both cutscenes use the cutscene Io, with her paper doll's face (`../3d-cutscenes/README.md`). The veil from her hat's brim and the pointed ears are his call; and `design-decisions.md` doesn't yet say he kept the face. If yes to either: `3d-cutscenes/io-cutscene.js` and the copies in both cutscene folders, rebuilt and checked. The battles keep the game's Io either way (CLAUDE.md).
2. **Art request 10** (the meadow's painted backdrop): close it? Nothing needs it now (T03, 8). If he wants his approved Colossus painting kept, it goes in `../reference/art/battle-backgrounds/`.
3. **The field study** (`../3d-model-field-studies/bramble-colossus/`): what more he wants from it ("what more he wants from it is still to be asked", `../docs/next-session.md`). Its lore is question 29.
4. **Inkblot:** his doll already carries the crow; does he want more (in scenes, on the Magpie's rail)? (I05.)
5. **The footsteps** (I01) and the other ideas, whenever he wants to choose.
6. **The five roads out** (T02 step 2): the cottage's south road, west footbridge and east path, and the crossroads' south and east roads, all open the world map today. Default: close them; Io says a line (a placeholder for the words) and turns back. No band's way uses them, and the crossroads' east road would walk her into band 4 before the Magpie can fly there.
7. **How often fights come on the new walks.** Default: as in the Thornwood, about every 770 map pixels: walking straight through, about 3 fights in band 2 (about 5 with the nodes), 5 in band 3 and 3 in band 4, against about 5, 6 and 5 on the world map today. The other choice is busier walks that keep the old counts.
8. **The Magpie at a camp.** Default: a soft glow on the empty landing ground, as at the docks today. The other choice: his own 3D Magpie (the one he flies) drawn standing there, shown on the wilds demo first. Art request 12 told him "the game draws the Magpie", so ask.
9. **The Ember Line nodes.** Default: as on the world map: the arrow leads only where the story goes, and a node Sol has relit goes dark. The other choices: the arrow visits the dark nodes in the road's order, or a relit node keeps a warm glow.

## The finishing pass

### T11: Chapters unlock only once the game is beaten

**Why.** `../docs/design-decisions.md` (pass three): Chapters on the title is for trying a part now; in the finished game it opens once the game is beaten. **Today** the title always offers it (`src/game/game.js`, the Chapters button); winning the finale sets `st.flags.ending` (`game.js`), but nothing marks the device.

**Steps (when Chris says the game is finished):** offer Chapters once any save slot has `flags.ending`, and set a device mark of its own at the same moment (in `localStorage`, beside `envoi.settings`), so Chapters stays open if that save is overwritten. The chapter demo pages open their chapter regardless. Test with the `chapters` step and a save that has won.

### T12: The game on Mooncart

**Chris's call.** The game's branch isn't merged into the repository's default branch (`claude/admiring-hawking-p7m87n`), which is what Mooncart builds (the Mooncart repo, `building-with-assets-`, is read-only from here). When he says so: merge the game's branch into the default branch (a pull request only if he asks for one), and tell him Mooncart picks it up on its next build. Mooncart builds without `--min`, so its copy is bigger than the published page.

## Technical, as the work goes

### T13: Size and publishing

**Today.** The published copy (`dist/game.artifact.html`, built without `--offline`) is 15,161,328 bytes, 14.5 MB as the build counts (it prints MiB), with Chris's songs and the keepsakes' pictures beside it (22 files, `dist/game.beside.json`). The docs read the 16 MB limit in the build's count; in plain bytes only 0.84 million are left under sixteen million. The file Chris keeps is 17.9 MB of its 30.

**Coming:** the arenas +0.4 MB (T01 B); the eight wilderness scenes about +1 MB and the world's walking tiles about −2.6 MB (T02); portraits and stills +2 to 3 MB (T06, T07); each creature +0.06 to 0.09 MB (T04). Room comes back when the eight flat paintings the arenas replace leave the page (about 2.7 MB; the Night square's stays for the first fight and the prologue), once nothing flat uses them.

**The levers,** in order: a folder beside the page (`<meta name="beside" content="...">` in `game.html`; the build lists the files in `dist/<name>.beside.json`, published with the page at the same paths); taking out what's replaced; the split build (`node tools/build.mjs --split`, `../putting-it-all-together/README.md`). Check both sizes after every change that adds art.

### T14: The file Chris keeps, after each round

After any round he wants to keep: `node tools/build.mjs --min --offline putting-it-all-together/game.html`, `node tools/game-test.mjs --offline` (must pass), then send him `dist/game.html` (it works with no internet, everything inside).

### T15: The tests

`tools/game-test.mjs` has fifteen steps; the default seven (title, new, walk, world, menu, saves, save) are quick. Every step that plays a fight is slow headless (wild, colossus, keepsakes, songs) and so are the cutscene steps (colossus, finale; menu replays one). A whole Bramble Colossus fight outlasts the 25-minute wait, so tests weaken set fights (`window.__battle.weaken`). One browser test at a time (four cores). Keep the test true as the game changes: the `world` step (T02), the arenas' fights (T01 B). Neither test can tell how fast a fight runs on his phone: that is his to say.

### T16: The 20 frames a second freeze

Unexplained (`../docs/next-session.md`): on the Battle Backgrounds page, his phone froze at 20 fps. Neither the game nor the arena demo offers 20. If a fight freezes or goes black on his phone after T01 B, start here.

## Ideas Chris hasn't said yes to

Nothing of these is built until he says yes; then a demo page first. Most are in `../docs/still-to-come.md` ("Ideas we haven't decided") and `../envoi-final-draft/README.md`.

| Id | Idea | What a yes would take |
|---|---|---|
| I01 | Footsteps: none (as now), soft steps, or a cloak's swish | The three are on the Io on Foot page (`src/walk/on-foot.js`); bring his pick into the field |
| I02 | Things to find at the D&D map's named places, with optional great creatures in lairs (question 28) | His yes and places; walking-scene prompts after request 12; the great forms of request 13; about 1 to 2.5 MB |
| I03 | A Field Notes page: creatures calmed, places found | A menu tab (today: Party, Herbs, Items, Moonlore, Saves, Settings); little point before T04 |
| I04 | More townsfolk in each town | Paper-doll sheets, portraits and words for each |
| I05 | Inkblot beyond Quill's shoulder (in scenes, on the Magpie's perch) | The perch exists in `src/models/magpie.js`; a small model |
| I06 | Words that move on by themselves | A reading setting beside text speed (`src/game/talk.js`) |
| I07 | Quicker fight starts: keep the heroes built between fights | `screen.js` builds and frees every model each fight; worth it if the arenas load slowly on his phone |
| I08 | A door's sound when a map changes | The sound exists (`thareia-audio.js`, "door"), never played |
| I09 | Wild packs framed closer on the phone | Mostly answered by the arenas (a wisp 30 to 35 px tall against 20); judge on the demo |
| I10 | More of his songs: a theme for each band's wilds, one for the great creatures | His songs; 3 to 4 MB for three or four |
| I11 | Finer studies of Sol, Halcyon and Noctara for the finale's cutscene | Sessions he starts (`work/study-<name>`, the workshop) |
| I12 | A "buy 10" button in the shops | `shop()` in `game.js` |
| I13 | More wells, letters and nodes, and Moonlore learned from the letters | Words from T05; places on the maps |
| I14 | More of the story staged, people walking as they talk | Overlaps T07's stills |
| I15 | The Magpie's flight: town cards with notes, a whole-map view from his demo | The flying map (`src/game/fly.js`) |
| I16 | Gate fights that teach what the finale asks for | Tips are words (T05) |
| I17 | The ending's "Even the ones at the wells" only when Io found them | A condition in `ending()` (`game.js`) on `st.letters`; the hub's, not the words job's |
| I18 | More fight rewards, such as a keepsake from the first Bramble Horror | The twenty are locked: it would change his list |
| I19 | Cutscene follow-ups: a first meeting for each great creature, new poses, the finale's music | Waits on I02 and T04 |
| I20 | Portraits with a few expressions | His art |
| I21 | The Bramble Ancient, the Colossus grown old (never on the game's branch) | His yes; its question was never put to him |
