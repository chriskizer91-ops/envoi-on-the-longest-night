# The main line (November 18, 2026)

`main` is now the one line for this repository. It was made from `claude/moon-faire-witches` (commit bf02aac) and the
finished work from the other branches was brought into it. No old branch was changed or deleted: they all still stand
exactly where they were.

In numbers: `main` has everything `claude/moon-faire-witches` had, plus **416 new files**. Nothing that was already
there was changed or removed (0 files changed, 0 deleted).

## What came in

Brought in one at a time, oldest work first, so the newest work lands last.

| Branch | What it is | New commits it brought | Where it lands |
|---|---|---|---|
| `work/texture-library` | The catalogue of every texture pack in Chris's repositories | 2 | `moon-faire-witches/texture-library/` |
| `work/reskin` (it holds `work/world-3d`) | The 3D world: all 21 walking places, the four zone pages and their builds, reskinned with Chris's textures and his short list of 28 pictures | 127 | `moon-faire-witches/world3d/`, `moon-faire-witches/texture-packs/` |
| `work/world-map` | The 3D map of Aethermoor, step 1 of 4 | 98 (some shared with the 3D world) | `moon-faire-witches/world-map/` |
| `work/star-map` | The Thareia system star map, and its session note | 1 | `moon-faire-witches/star-map/` |
| `project-notes` | The project's knowledge, the index, the decisions and the two saved artifact pages | 1 | `docs/project-notes/` |

Already inside `claude/moon-faire-witches` before this, so there was nothing to bring: `work/textures-made`,
`work/battle-sound`, `work/dark-music`, `work/dark-music-2`, `work/sfx-choices`.

On the board but with no branch in the repository, so nothing to bring: `fight-math` and `new-lore`. Neither was ever
pushed.

Session notes now together in `docs/project-notes/sessions/`: the hub's, the reskin's (with its 8 pictures), the 3D
map's and the star map's. Those were the only branches with wrap-up notes.

## What clashed

**Nothing clashed.** In all five merges, no file had been changed on both sides, so there was never a choice to make
between an older and a newer version. Every job kept to its own folder.

Four things are worth knowing all the same. None of them broke anything.

1. **Two copies of the texture-library slip.** `moon-faire-witches/workshop/slips/texture-library.md` is the job's own
   copy from the morning of November 16. `docs/project-notes/claude/slips/texture-library.md` is the newer one, from
   that afternoon ("Done"). Both are kept. The newer one is the one to trust.
2. **Two copies of the star map page.** `moon-faire-witches/star-map/thareia-system-star-map.html` and
   `docs/project-notes/artifacts/thareia-system-star-map.html` are the same file, byte for byte. Both are kept.
3. **The 3D map's picture of the towns is one step behind.** The map took its copy of the 21 places from the 3D world
   before the reskin. The reskin then changed all 21 place files (new texture names, and Wickhollow's lower house).
   The map still builds and passes its checks. To bring it up to date, the map's own tool is
   `moon-faire-witches/world-map/tools/make-places.mjs`. Not run here, because it would change the map's files.
4. **`moon-faire-witches/README.md` does not list the new folders yet** (`world3d/`, `world-map/`, `star-map/`,
   `texture-library/`). The 3D world's slip asked the hub to add them. Not done here.

One line in `INDEX.md` went out of date with the merge and has a note added: the star map page is now on this branch.

## What was checked

All of it on `main` after the last merge.

| Check | Result |
|---|---|
| The four zone pages rebuilt (`make-zones.mjs`, then `tools/build.mjs --offline` for each) | All four came out **byte for byte the same** as the builds already in `moon-faire-witches/world3d/builds/` (45.5, 47.7, 54.4 and 43.6 MB). |
| Each rebuilt zone walked through, headless (`zone-test.mjs`) | Zones 1, 2, 3 and 4: **all passed, 0 page errors.** Zone 1 walks 11 moves through its 6 places, and tests the save and the airship hook. |
| The battle rebuilt (`tools/build.mjs --offline moon-faire-witches/battle/battle.html`) | 10.16 MB, **byte for byte the same** as a build from `claude/moon-faire-witches`. No file the battle uses was touched by any merge. |
| The battle opened headless, and the great wraith fight started | **0 page errors.** The arena, Io and Kore drew. |
| The balance checks (`moon-faire-witches/tools/balance.mjs`, 1,000 fights each) | **44 of 51 targets met**, the same number as on `claude/moon-faire-witches` run the same way. |
| The 3D map page built (8.59 MB), its places check, and opened headless | All 21 places and all 7 landings in their zones. **0 page errors.** |
| Building left the repository clean | 0 tracked files changed by any build step. |

Not checked: frame rates (a headless browser draws in software), and anything by eye on a real phone or laptop.

## The older branches from the first Envoi (not merged, by Chris's word)

None of these was merged by this step. Ten of them are inside `main` anyway, because `claude/moon-faire-witches` grew
out of them: their work is the first Envoi that this game was built on top of. Four have work that is on that branch
only.

| Branch | Last commit | What it is | Is its work inside `main`? |
|---|---|---|---|
| `claude/admiring-hawking-p7m87n` | Oct 2 | The very start: the first model passes and Io's first new spells. It is still the repository's default branch on GitHub. | Yes |
| `second-account-work` | Oct 3 | The whole first game played through and published, with sound settings and Halcyon's aftermath. | Yes |
| `ccr-9e19f4e2-29pyn6` | Oct 3 | All thirteen walking maps traced closely, and the handoff note for the next session. | Yes |
| `claude/quirky-newton-dr3w1q` | Oct 4 | A Tripo test of Io's model from Chris's front view, added and then removed. | Yes |
| `claude/dreamy-hopper-yrhtkf` | Oct 4 | The Bramble Colossus field study: a nature film, an Explore mode, its own sounds. | Yes |
| `claude/confident-albattani-nhdy6e` | Oct 4 | The same field study, plus the start of the main-characters folder (Io at Colossus detail). | Yes |
| `claude/practical-franklin-l1ctf9` | Oct 4 | Polish: Chris's three songs, three volumes, two hidden keepsakes, and the chapters rule. | Yes |
| `claude/lucid-ritchie-bt1e9z` | Oct 4 | The cutscenes: the finale's opening and the first meeting with the Colossus. | Yes |
| `work/arenas` | Oct 5 | The first Envoi's new battles in their arenas, already merged with the game of that day. | Yes |
| `ccr-31761774-76j8j3` | Oct 5 | The first Envoi's hub at its last wrap-up. The branch `claude/moon-faire-witches` started from. | Yes |
| `claude/sleepy-dirac-t4ftx0` | Oct 3 | Creature models from Chris's sheets. One commit is only here: the Bramble Ancient, a test of the Colossus grown old. | **No** (1 commit) |
| `claude/bold-carson-8beyc3` | Oct 5 | A game guide written as a late-'90s magazine walkthrough, also as one HTML file. | **No** (2 commits) |
| `claude/hopeful-lovelace-z2hzjx` | Oct 5 | The "real final pass" game guide: an early-2000s strategy guide for the final polish build, with its screenshots. | **No** (3 commits) |
| `claude/send-note-gigdew` | Oct 5 | The first Envoi's final pass polish: the fixes from the full check, Chris's file as one HTML, and the Envoi Sound Check page. | **No** (55 commits) |

**Worth a look before the merge into the new repository:** `claude/send-note-gigdew` holds the first Envoi's last 55
commits of polish. They are not in `main`, so the first-Envoi game files in `main` are the ones from just before that
polish. That only matters if the new game needs the first Envoi's own latest fixes.

## One thing only Chris can do

GitHub still shows `claude/admiring-hawking-p7m87n` as the repository's default branch. To make `main` the branch
people see first, change the default branch in the repository's settings on GitHub.
