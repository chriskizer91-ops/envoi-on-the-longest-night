**Brought in at `39350b5`** on October 5 by the ultracode hub, with the switch off, after a review by dimension; the game test (title, new, and a band 2 wild fight at level 8, 915 × 412) passed on the same page, byte for byte. Corrections from the review are in `../tasks.md` (T01) and `../../envoi-final-draft/arena/README.md`.
# Relay: The New Battles (the Arenas)

**Delivered** October 5, 2026, by the old hub. **Branch:** `work/arenas`, at `865677d`. **Chris's demo page:** https://claude.ai/artifact/FHpBiFsEhvUgvmu5hJaCea (published privately; the old hub sends him the link with this handoff). This is task **T01** in `../tasks.md`.

## What it is

Chris, October 4, 2026: "we have a bunch of battle backgrounds that are supposed to go with the Colossus in the meadow fight arena, so take the Colossus out and put all of the fights into an arena like that, with the different battle backgrounds."

Every fight of the game is fought in its place, the way Colossus in the Meadow is: his painting of the place far off behind, live 3D ground in front that answers every blow, weather in the wilds (rain or a storm one fight in four, a blizzard in the frozen places), the Colossus's red Wrath, the menus never hiding the fight on the phone. Eight places: the river glade, the Warm Roads' moor, Eldergrove, Frostmere, Bogmire, Dawnroost's node, the northern crossroads, the dead Moonwell. The first fight keeps the Night square's flat painting (question 23).

The full write-up for Chris, with the places, what each fight costs the phone, eighteen pictures and how it was checked, is `envoi-final-draft/arena/README.md` on the branch. Read it before anything else here.

**The game's switch is off.** `const ARENA = false;` in `src/game/fights.js`, and `putting-it-all-together/game.html` doesn't load the arena's scripts, so bringing the branch in changes nothing Chris plays. The fights switch over only when Chris says yes after playing the demo (below).

## What the branch holds

Seven commits on top of the game at `ae4a864` (`798cd51` to `fdb24ad`), then the game's branch at `0757ee8` merged in (`01456b7`, no clash), then the demo's link and these checks in its README (`865677d`):

| Path | What |
|---|---|
| `src/fx/arena.js` | The arena (`makeArenaField(place)`): the locked camera, the living sheet over the painting, the live ground, trees, water, the air, the weather, a blow's debris, the Wrath. Made from `living-battlefields/field.js`, which stays as it is. |
| `src/stage/arena-*.js` (8) | One per place: its painting, camera, traced skyline and ground line, ground, tree, air, weather, lamps, where Lunara rises and Envoi coils. Registered in `window.ARENAS`. |
| `art/arena/*.avif` (8) | Chris's battle backgrounds 01, 02, 03, 05, 11, 12, 13 and 14 at his "Strong", from `envoi-game-pass-3/battle-backgrounds/img/<number>-q20.avif` (268 KB). |
| `src/battle/screen.js` | **Shared with the game.** The battle screen's arena mode; everything hangs on `AF` (the arena), so a flat battle runs exactly as before. |
| `src/game/fights.js` | **Shared with the game.** The switch `ARENA`, `ARENA_OF` (each fight's place), `ARENA_AT` (where everyone stands, in metres), `inArena()`. The keepsakes' lines (`wearing()`, `fleeOf()`) are kept as the game has them. |
| `demos/arena.html` | The demo page (built: 2.23 MB). |
| `tools/arena-test.mjs` | Plays the demo headless, counts each frame's draw calls and triangles, saves pictures. |
| `envoi-final-draft/arena/` | The README and `renders/` (18 pictures). |

No docs outside `envoi-final-draft/arena/` are touched: the hub records it in `docs/design-decisions.md`, `putting-it-all-together/README.md`, `docs/still-to-come.md` and `docs/next-session.md` when it merges.

## Bring it in

```sh
git fetch origin work/arenas
git diff --stat HEAD...origin/work/arenas      # what it brings
git merge --no-ff origin/work/arenas
```

It merges without a clash with the game's branch at `0757ee8`. If you've changed `src/battle/screen.js` or `src/game/fights.js` since, review the merge of those two by hand: the arena's lines in `screen.js` all hang on `AF`; in `fights.js`, keep both the arena's `inArena(...)` calls and the keepsakes' `flee: fleeOf(P)`.

Before merging, give its two shared files the adversarial review `../README.md` asks for (the battle screen, phone performance, rules and balance).

## Checked by the old hub after the merge (October 5)

- `node tools/balance.mjs`: 51 of 51 targets met.
- `node tools/check-maps.mjs`: every map ✓, the keepsakes' places included.
- `node tools/build.mjs demos/arena.html`: 2.23 MB. `node tools/build.mjs --min putting-it-all-together/game.html`: the published copy 15,160,262 bytes with its 22 files beside it, as on the game's branch (the arena isn't in the game page yet).
- `node tools/arena-test.mjs --fights band2,colossus,finale --to turns:2` at 915 × 412: band 2's wilds on the moor in a storm (119 draw calls, 340,000 triangles), the Bramble Colossus by Frostmere (102, 322,000) and the finale at the dead Moonwell (156, 373,000), each played on to 24 to 30 seconds of battle. "arena test passed", no errors.
- Read by hand: the branch's changes to `src/game/fights.js` and `src/battle/screen.js` against the game's branch. Everything in `fights.js` is behind `if (arena)`, and in `screen.js` behind `AF`; the arena is disposed with the fight (`BF.dispose()` in `stop()`).
- **The game test with the switch off** (`node tools/game-test.mjs --steps title,new,wild,keepsakes --band 2 --level 8 --size 915x412` on the branch, `865677d`): **"game test passed: title, new, wild, keepsakes in 1088 s"**, no errors. The band 2 wild fight at level 8, on the flat Warm Road painting, won ("Victory!"); then the keepsakes step: the Crescent Locket on the roof, Nettie's gift, the Forge Horseshoe in Wickhollow's nook, the Warden's Brooch in the woods, the Items page, a fight with their helps, the shards after the win, and the first Colossus's gifts.

## When Chris says yes: switching the game over

Not done; only on his yes. `envoi-final-draft/arena/README.md` ("Switching the game over") has it exactly:

1. In `src/game/fights.js`, `const ARENA = false;` becomes `const ARENA = true;`.
2. In `putting-it-all-together/game.html`, right after `<script src="../src/fx/battlefield.js"></script>`, the nine script lines: `../src/fx/arena.js`, then `../src/stage/arena-<place>.js` for river-glade, warm-roads-moor, eldergrove, frostmere, bogmire, dawnroost, crossroads and dead-moonwell.

Without step 2, step 1 does nothing: a fight whose arena isn't in the page stays on its flat painting.

3. **Re-aim both cutscenes' last shots.** Each cutscene ends on its fight's opening frame on the flat painting (the frozen road's camera for the Colossus, the dead Moonwell's for the finale: "The hand-over" in each cutscene's README). Switched on, those fights open from the arena's eye-height camera with everyone placed in metres (`src/stage/arena-frostmere.js` and `arena-dead-moonwell.js`; `ARENA_AT.colossus` and `.finale`), so the cross-fade would jump. Neither the helper's checks nor the old hub's covered the game's two cutscene hand-overs. In each cutscene's folder: the `battle` shot in `src/scene.js` to the arena's camera and positions, `node tools/build.mjs`, `node tools/check.mjs` ("all good"); the game loads the rebuilt module from there.

**Mind the size.** Measured October 5 with the game's latest (the keepsakes in), in a scratch copy of the page with the nine lines added:

| | Today | With the arenas |
|---|---|---|
| The file Chris keeps (`--min --offline`) | 17.9 MB | 18.3 MB (of 30) |
| The published page (`dist/game.artifact.html`) | 15,160,262 bytes (14.5 MB as the build counts) | 16,379,946 bytes (15.6 MB as the build counts) |

The build counts in MiB, and the docs say "under the 16 MB a published page may be" in the build's count, which 15.6 is. In plain bytes it is over sixteen million, though, so if a publish is refused for size: add `art/arena` to the page's `<meta name="beside" content="art/music art/keepsakes">` (the eight paintings are literal `"art/arena/..."` paths, so the build leaves them beside the copy and lists them in `dist/game.beside.json`: about 0.36 MB off), or take out the flat paintings the arenas replace (about 2.7 MB; the README's "Ideas for later"; the Night square's stays), or use the split build.

Then build, run `node tools/game-test.mjs --steps title,new,wild --band 2 --level 8` (its wild fight is then on the moor) and the full game test, publish the game with every file in `dist/game.beside.json`, and record Chris's yes in `docs/design-decisions.md`.

## Open points (from the branch's README; for Chris to judge on his phone)

1. **Speed on his phone** is the one thing the test browser can't tell. The busiest fights ask more than the meadow did (the meadow: 96 draw calls and 319,000 triangles at 29 to 30 frames a second on his phone; gate 10: 129 and 378,000; the finale: 155 and 373,000). The levers: the frame cap and the 3D's sharpness.
2. **A freeze or a black screen** on his phone: look first at the unexplained 20 frames a second freeze he saw on the Battle Backgrounds page (20 isn't offered here).
3. **Close-ups are less close** than today's, so the painting never blurs. He may want them closer and softer.
4. **The Colossus and the great wraith** are too tall to fit above the menus on the phone in some shots: their heads go out of the top.
5. **Bogmire's lamps** are found in the painting by their warm colour, so anything warm in the town goes dark with them while the great wraith holds their light.
6. **The painted ground shimmers** in the gusts and shockwaves; one number per place turns it down.
