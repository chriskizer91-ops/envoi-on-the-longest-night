# Hand-off: the Final Polish Pass (October 5, 2026, night)

For the next session. Read this first, then `README.md` here (every fix, in Chris's terms, with the check that proves it). The hand-off before this one is `../handoff/wrap-up-2026-10-05.md`; its first moves are done (below), except asking Chris its questions, which wait on him.

## Where everything stands

- **The branch:** `claude/send-note-gigdew`. It is the game's branch, `ccr-31761774-76j8j3` at `856f522` (the old hub's last commit), with this pass on top. The game's branch itself wasn't touched: start by bringing this branch into it (a fast-forward), or work on from this one.
- **Chris has:** the whole game as one HTML file, "Envoi on the Longest Night - final polish.html" in this folder, sent to him on October 5, at night, made from this branch after the full pass (`README.md`, "The file Chris has" and "What was checked before it went"). It has the four ideas of the try page switched on, as the file he sent did (footsteps, words that move on by themselves, the door's sound, Buy 10): the offline build with `<script>window.ENVOI_TRY = {"steps":true,"words":true,"door":true,"buy10":true};</script>` after its `<title>`. He takes the game as a file now ("a single HTML file as the entire game ... That's the best way to give it to me").
- **The published pages are a pass behind.** This session ran on Chris's other account, which can't update the pages the old hub published (the game https://claude.ai/artifact/BgSiyXBu53iW7DJVF1seV8, the try page https://claude.ai/artifact/NZ7C68JJTJ2taFJJgmkcMw, the map editor https://claude.ai/artifact/M3PokTZsXbbxbx2BSDSrC5) nor read the map editor's database. Chris didn't need them: his map edits are all in the game already, at his word. A session on that account can republish them as `../handoff/wrap-up-2026-10-05.md` says ("Before publishing"); the map editor now builds to about 7.59 MB (its README's "Build:" line wants its new size then).
- **Every check:** `checks/full-pass.sh` runs the whole pass, one browser at a time, about two and a half hours (`SECTIONS="1 2"` and `SECTIONS="3 4 5 6 7"` split it in two). Each fixer's checks are in `checks/<area>/`, each with a note at its top.

## Next: Chris's notes from the sound tool

**The tool is made and sent** ("Envoi Sound Check.html" in this folder; `sound-tool/README.md`). When his notes come back (pasted from its Copy my notes, each with its card's id), put each verdict into the game: a Fix whose card has a Fixed button and he liked it, by switching its fix on (`sound-tool/README.md`, "The Fixed buttons"); any other Fix by changing the sound in the game's sound code (the tool plays it again from there once rebuilt, `sound-tool/make.mjs`); a Drop by taking the sound out where the game plays it (`sounds/inventory.md` names the place). Rebuild the tool so he can hear the changes, then the full pass and his file.

### Background: what the tool came from

His words are in `README.md` ("His word during the pass"): every sound the game uses, one by one, each played "in the way that they'll be in the game ... wind can't just be a real quick sound", and nothing in the game's sound changed before he has heard them.

- **The groundwork is done:** `sounds/inventory.md` lists the 90 sounds heard in play (28 walking and places, 4 the flight, 4 menus and saves, 20 battles, 6 music, 28 in the two cutscenes): where each is made, what starts it, how long it lasts, its volume, how a page can play it as the game does, and what looks wrong (its section 8).
- **What sounds wrong, from the code** (his "wind noises and foot noises"):
  - The wind on the maps, and every other sound made from noise (rivers, leaves, the blizzard, the sea, the campfire, the take-off's rush, the crash in the sting before every fight), stops dead after half a second to two seconds: the noise they're made from is 2 s long, starts at a random point up to 1.5 s in, and doesn't loop (`thareia-audio.js`, `noise()` and the `NOISE` buffer). A place's sounds are one-shots on a timer with gaps; nothing in them is continuous.
  - Running footsteps limp (about every other step is dropped, `footsteps.js`); stone footsteps are a faint hiss; the footsteps skip the mix the other sounds share.
  - The battle's `eclipse` is cut off mid-swell; the battle theme is one 7-second loop; the mist's wind in the flight is about four times louder than the maps'.
  - The "buzz" Chris remembers (four steps for every step) was the library's `step-*` clips, each four steps long, played per footfall; it is gone from the game (`83a7ccd`), but the clips are still in the library.
- **How to build it** (the inventory's section 9): six sound engines, each callable from a page of its own without the game (the library, the footsteps, Chris's songs, the battle's sounds, and each cutscene's); a place is a timer of one-shots (`AMBIENCE` and the scheduler in `game.js`), to be run for a minute, not one sound; footsteps one per painted step at the walk's pace; Chris's songs need their two files inside the page.
- **The way to work it, suggested:** a page (a single HTML file, as he likes, and a demo page if this account can publish one) with one button for each sound in its game context (a place's minute of night sounds, Io walking and running on earth, stone and wood, a fight's sounds in the order a move plays them), the game's three volumes, and a note in plain words where the code shows something wrong. Then he says, sound by sound, keep, fix or drop; the fixes go into the game's own sound code, so the tool and the game stay one and the same; then the full pass, and his file again.

## Waiting on Chris

- **The four ideas** of the try page: his file has them on, the game's code keeps them behind their switches (`const TRY` in `game.js`). He hasn't said which to keep; the sound tool will settle the footsteps.
- **The old hub's questions,** not yet put to him: whether the new battles answer his wild meadow question (`../docs/questions/open.md`, 4); the cutscene Io's face, the veil and pointed ears (`../handoff/tasks.md`, T10, 1); art request 10, the field study, Inkblot (T10, 2 to 4).
- **His art and words:** the creature sheets (T04), the townsfolk portraits (T06), the story stills (T07), every word (T05).
- **The finishing pass:** Chapters unlocks once the game is beaten (T11), when he says the game is finished; the game on Mooncart (T12), his call.

## Noticed, left for later

- **A fight that seemed to freeze, most likely only the test browser being slow.** In the full pass, `checks/battles/battle-fit.mjs` once waited 15 minutes for its fight to end (a band 4 wild fight, two frost wisps and a wraith, Io's Trance forced ready, the foes cut to 1 HP, played by the expert at turbo 6); run again alone it passed in 8½ minutes. A replay of that fight's end (8 runs, in the session's scratchpad, not kept) didn't finish within 6 minutes 4 times. The last of them, measured properly, was still running: the test browser was drawing the arena at about 3 frames a second, and the battle was playing the win's ending (the moth) when the wait ran out. The other three were read once, at the timeout (the battle between turns, or a foe mid-move), which looked like a stopped clock but fits the same slowness. No normal-speed test, nor the October 5 audit, has seen a fight stop. Chris called it off ("move on"). If a fight ever does stop on his phone: the battle's frame loop (`frame()` in `src/battle/screen.js`) and its clock are where to look, with a frame counter and the clock read twice, a few seconds apart.

- **The phone held upright in a fight (390 × 844):** the arena's picture fills the screen's height, so Io stands off its left edge, and Sol's feet sit about 7 px behind Io's eight-command menu. Chris plays sideways.
- **Kestrel Stoop in Chrome's shortest heights (915 × 330):** in the dive and the whole-field shots her head can go up to 60 px above the screen while the shot keeps the fighters on the ground (her rise and her learning it keep all of her). An ally's target arrow over a hovering Sol sits at her standing height.
- **Three-column sub-menus:** a long move's MP tag wraps under its name, inside the 36 px row.
- **The frame-rate line** on the end card is blank in headless runs (frames over 250 ms count as stalls), so only a real phone shows it.
- **The cutscenes' sound** is paused while the page is hidden by `playCut()` in `game.js`, which watches the contexts a cutscene makes; the tidier home is each cutscene's own sound module, if they're ever rebuilt.
- **The tools:** check-edits doesn't check a keepsake moved onto a map whose paths aren't in the same file (check-maps catches it once `items.js` has it); a plain build of every page takes about 7 s now (it looks for art left outside each page).
- **The map editor's database** (on the other account): the stale `edits/wickhollow`, and the places its older version stored, to clear with Chris when a session on that account is next there.

## How to work here (what this pass learned)

- **Test at Chrome's sizes too.** Chris most likely opens his file in Chrome on his Pixel 7a held sideways (an assumption: ask him), where the address bar stays (the game has no full screen): about 915 × 356, perhaps 330, not the 915 × 412 every earlier test used. Every screen was fitted to those this pass; keep checking them (`checks/game/short-screens.mjs`, `checks/battles/battle-fit.mjs`, `checks/walking/field-check.mjs --size 915x356`).
- **One browser at a time:** every command that opens a browser goes through `flock /tmp/claude-0/browser.lock`.
- **Fixers side by side:** each in a worktree of its own (`git worktree add -b fix/<area> /home/user/wt/<area> HEAD`), with `tools/node_modules` linked in (`ln -s`) and the link kept out of git (`tools/node_modules` in `.git/info/exclude`: `node_modules/` in `.gitignore` matches folders, not links), the files it owns, never two in `game.js`, `screen.js`, `fights.js` or `maps.js`; then the hub reviews each diff, merges, and runs the full pass. Four fixers used about 1.9 million tokens between them this pass: brief them exactly (the audit gave each finding's file and line) and ask them to work economically.
- **Mooncart builds with plain `node tools/build.mjs`,** in a fresh copy, with nothing installed: keep a plain build free of `tools/node_modules`.
- **The two accounts:** the old hub's pages are on one, this session was on the other. Check which with `Artifact list` before promising Chris a link.
