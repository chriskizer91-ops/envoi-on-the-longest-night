# Handoff: the Ultracode Hub

October 5, 2026. For the new session Chris starts in ultracode, which becomes **the hub**: the one session that changes the game and merges everyone else's work into it. Read this first, then `../docs/next-session.md` (where everything stands, the pages and the commands) and `../docs/still-to-come.md` (the short list, in Chris's terms).

## Who is who

- **You, the ultracode hub.** From now on you own the game's branch, `ccr-31761774-76j8j3`: you change the game, merge other sessions' work into it, test it and publish it. Work on that branch and push to it (Chris's starter line gives you leave).
- **The old hub,** the session that built the game from October 3 to 5. Its arena helper's work is delivered in `relay/` here (T01), and it has nothing else running; anything more Chris gives it (most likely pictures) it posts there too. It changes nothing on the game's branch except `handoff/relay/`.
- **Workshop sessions,** which Chris starts himself with the scripts in `../envoi-final-draft/workshop/README.md`: each works on its own branch, `work/<job>`, and leaves a slip. Two jobs are written (`wilds`, `words`); the model studio's creatures (`work/model-<id>`) and the optional character studies (`work/study-<name>`) follow the same rules.
- **Chris** decides what goes in. He plays on his phone (a Pixel 7a, held sideways: 915 × 412), edits on his laptop, makes the art from our requests, and answers lore questions. He isn't a programmer: write what he reads in plain words.

## The relay: check it often

The old hub posts its results in `relay/` on the game's branch. Check it before you start each task and whenever you finish one:

```sh
git fetch origin ccr-31761774-76j8j3 'refs/heads/work/*:refs/remotes/origin/work/*'
git show origin/ccr-31761774-76j8j3:handoff/relay/STATUS.md
```

Since you work on the same branch, `git pull --no-rebase origin ccr-31761774-76j8j3` before each push brings `relay/` in with it (the old hub writes only in `relay/`, and you change only the first line of a note you've brought in, so it merges). When a row in `relay/STATUS.md` says **Delivered**, its note in `relay/` says which branch holds the work and how to bring it in. The same fetch shows any workshop job that has pushed to `work/<job>`: its slip is `envoi-final-draft/workshop/slips/<job>.md` on its branch.

## When Chris sends something

From now on Chris brings things to you (or to a workshop session he starts for the job). Files he attaches reach only the session he attaches them to: keep each exactly as it came, where the table says (`../reference/art/README.md` lists what's kept), and commit it before anything else, so no other session depends on yours to see it. If he sends something to the old hub anyway, it posts it in `relay/` (the `pictures-*` rows).

| He sends | Where it goes first | Then |
|---|---|---|
| The eight night scenes (art request 12) | **Came October 5:** `reference/art/walk/wilds/`, as he sent them | T02, or the workshop's `wilds` job if he starts it there (`../envoi-final-draft/workshop/wilds.md`) |
| Creature sheets (art request 13) | the creature's `3d-model-new-character-ideas/<id>/original/` | A modeling session per creature (`../envoi-final-draft/model-studio/`), then its intake (`intake.md` there) |
| Portraits (request 06) or story stills (request 07) | `reference/art/portraits/`, `reference/art/stills/` | Their tasks below; mind the 16 MB page |
| Lore answers | `docs/lore/lore-answers-2026-10-05.md` (a new file, in his words), marked answered in `docs/questions/open.md` | The words they unblock |
| "Send everything new" in the map editor | its database (collections `edits` and `places`; read with ArtifactData on https://claude.ai/artifact/M3PokTZsXbbxbx2BSDSrC5) | `../envoi-final-draft/map-editor/README.md` says how each goes into the game |
| Notes from playing, or a yes to an idea | `docs/design-decisions.md`, a new dated section with his words | A demo page first, then the game |

## Start

```sh
git fetch origin ccr-31761774-76j8j3 && git checkout -B ccr-31761774-76j8j3 FETCH_HEAD
npm install --prefix tools
node tools/build.mjs --min putting-it-all-together/game.html     # dist/game.html, dist/game.artifact.html, dist/game.beside.json
node tools/game-test.mjs --size 915x412                          # must end with "game test passed"
node tools/balance.mjs                                           # 51 of 51 targets met
node tools/check-maps.mjs                                        # every map prints ✓
```

## The game in one page

- **The page:** `../putting-it-all-together/game.html`, built from `../src/`: `src/game/` (the walking maps, the world map and flight, the menu, saves, the script, the songs, the keepsakes, and `fights.js`, which sets up every fight), `src/battle/` (rules, engine, battle screen, sound, the balance simulator), `src/models/` (every 3D model in code), `src/stage/` (each battle painting's stage), `src/fx/` (the living battlefield and the spells' effects), `src/walk/` (Io's painted walk and the paper dolls), `src/bench/` (the model benches the demos use). Its README lists every piece, where it came from and its state.
- **Canon:** `../docs/design-decisions.md` first (newest sections last), then `../docs/lore/lore-answers-2026-10-01.md`, the Noctara amendment and the bible, without the retired lore (CLAUDE.md).
- **Two builds:** the published page (14.5 MB of its 16 MB, with Chris's songs and the keepsakes' pictures as 22 files beside it, listed in `dist/game.beside.json`), and the file Chris keeps (`node tools/build.mjs --min --offline putting-it-all-together/game.html`: 17.9 MB of its 30, everything inside, works with no internet; test it with `node tools/game-test.mjs --offline`). When the published page would pass 16 MB, the split build (`--split`) is ready.
- **Pages on Chris's phone** (this account can update them; read one with the Artifact tool before publishing to it from a new conversation): the game, https://claude.ai/artifact/BgSiyXBu53iW7DJVF1seV8 (publish `dist/game.artifact.html` with every file in `dist/game.beside.json` beside it); the keepsakes, https://claude.ai/artifact/AAtAnWcqszRj4qhVCfgPp5; the map editor, https://claude.ai/artifact/M3PokTZsXbbxbx2BSDSrC5 (its database holds Chris's path edits, collection `edits`, and keepsake places, `places`); the new battles' demo, https://claude.ai/artifact/FHpBiFsEhvUgvmu5hJaCea; and the two cutscene pages (`../envoi-final-draft/cutscenes/README.md`). The rest came from Chris's other account and can't be updated: a new version of one goes out at a new link (`../docs/next-session.md` lists them all).
- **Tests are slow headless:** a full Bramble Colossus fight takes more than 25 minutes in the test browser, so tests weaken set fights (`window.__battle.weaken`). The machine has 4 cores: run one browser test at a time.

## How Chris works

- **A demo page on his phone first,** before anything goes into the game, then the game, published, with the link in plain words.
- **He decides.** Build what he has decided; an idea he hasn't said yes to gets at most a demo for him to judge, never a change to the game.
- **Art:** write prompts as an art request in `../docs/art-requests/`; he makes the pictures elsewhere and uploads them. Keep what he sends as it came under `../reference/`.
- **Lore:** questions go in `../docs/questions/open.md`; he answers in his lore conversation (the workshop's `words` job can be it).
- **Records:** every decision in `../docs/design-decisions.md` with his words; `../docs/still-to-come.md`, `../docs/next-session.md` and `../putting-it-all-together/README.md` kept current.

## Using ultracode well here

- Fan out over things that don't share files: a creature's intake beside the wilderness scenes beside the words; never two agents in `src/game/game.js`, `src/battle/screen.js`, `src/game/fights.js` or `src/game/maps.js` at once (`tasks.md`, "What can run at once").
- Review before merging: a merge from another branch (the arenas, a workshop job) gets an adversarial review of its diff, by dimension (rules and balance, the battle screen, phone performance, the docs), before it goes in.
- Test in parallel only where it's cheap; browser tests one at a time.

## The tasks

Every task left in the game is defined one by one in **`tasks.md`** here: why (Chris's words, or the record of his decision), where it stands, what it waits on, the steps, the files, when it's done, the checks, and what it can run beside. Its table "At a glance" gives the order. In short:

- **Ready now:** T01, the new battle arenas (delivered on `work/arenas`: review them and bring them in with the switch off; switch on at Chris's yes after the demo, re-aiming both cutscenes' last shots); T02, the wilderness scenes (his eight pictures came on October 5: trace them, a demo page, then walking off the world map); T03, the stale docs.
- **Waiting on Chris:** T04 the creatures (his sheets), T05 every word (the words session), T06 portraits, T07 stills, T08 his notes from playing, T09 map-editor edits, T10 small calls to put to him.
- **Later:** T11 Chapters unlock once the game is beaten (the finishing pass), T12 the game on Mooncart (his call).
- **Always:** T13 size and publishing, T14 his file after each round, T15 the tests, T16 the 20 fps freeze.
- **Ideas,** I01 to I21: nothing is built until he says yes.

`tasks.md` is yours to keep from now on: mark tasks done as they finish, and add what Chris decides.

## Your first moves

**Done October 5** by the ultracode hub: 1 to 3 (T03 `9c65e72`; T01 part A `39350b5`, with the review's fixes; T02 step 1 `cf4a475`, the scenes staged in `src/game/maps-wilds.js` and their demo at https://claude.ai/artifact/2WSu7uWvtDUmF5JwxV5xwC), and 4 is asked. What comes next waits on Chris: his yes to the arenas (T01 part B), his okay to the scenes and his four calls (T02 step 2, T10). `tasks.md` has where each stands.

1. Check the relay (above).
2. T03, quickly, then T01's part A: review `work/arenas` and bring it in with the switch off. The arenas go first because the creatures' intake (T04) and the words (T05) both touch `src/game/fights.js`.
3. T02 as a workflow: the eight scenes traced in parallel, each into a file of its own, then added to `src/game/maps.js` one at a time; then the demo page for Chris to walk.
4. Ask Chris whether he has played the arena demo (https://claude.ai/artifact/FHpBiFsEhvUgvmu5hJaCea): his yes starts T01's part B.
