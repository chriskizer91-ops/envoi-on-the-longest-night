# Final Pass: Polish (October 5, 2026)

Started October 5, 2026, in the evening, after the ultracode hub stopped (usage limits) and handed over with `../handoff/wrap-up-2026-10-05.md`. This folder keeps everything from the session that makes the final polish pass: what Chris sent and asked, the record of each fix, the checks that prove them, the pages and the file made, and the hand-off for whoever comes next.

## What Chris asked

> Okay envoi on the longest night is where you can write: make a folder called final pass polish October 5th 2026. Everything that you write will go in there. You can read from the other repos but I think everything you will need to read is envoi. This is the most recent version of the game I have received.

He sent two files and pasted the last session's last message (all three in `from-chris/`, below).

**How this folder is used.** As with pass three (`../envoi-game-pass-3/`) and the final draft (`../envoi-final-draft/`), this folder holds the pass: its records, its checks, its pages and files, and its hand-off. The game itself still lives in `../src/` and `../putting-it-all-together/`, so a fix to the game is made there, where the build reads it. Every file changed outside this folder is listed below, with why.

## What Chris sent

| What | Where | Notes |
|---|---|---|
| The game as one file, "Envoi_on_the_Longest_Night-1.html" (18,088,918 bytes) | `from-chris/Envoi_on_the_Longest_Night-1.html`, exactly as it came | Byte for byte what the game's branch builds at `856f522` with `node tools/build.mjs --min --offline putting-it-all-together/game.html`, plus the one line after its `<title>` that switches the four ideas of the try page on (SHA-256 `c4bdec11d9889bdc565dcc2a9ab97ea6b44f5fb2f63dda6896cb424d87e852ec`, checked October 5). So the source here makes exactly his file, and nothing in it exists only in the file |
| The hand-off note, "Handoff - October 5 2026.md" | `../handoff/wrap-up-2026-10-05.md` | The same, byte for byte, so it isn't copied again |
| The last session's last message | `from-chris/last-message-of-the-last-session.md` | As he pasted it |

## His word during the pass (October 5, evening)

> All of the edits I made with the map editor are already implemented in the version that I shared with you at the beginning of this, you shouldn't need anything from the other account. The only thing that I have a question about is noises and I know this is kind of late in the game. I know that wind noises and foot noises and then a couple other noises sound weird. If all of the bugs have been worked out, if you can deliver to me a single HTML file as the entire game at its current state. That's the best way to give it to me and after you have done all of the bug checks and bug fixes and play tests and like anything that was discussed in that handoff markdown that needed to be done after we finish that and you've delivered that HTML file, then I would like to make a tool that is all of the sound files that get used in the game and I want to go through them one by one and listen to them and they have to be in the tool in the way that they'll be in the game. So like if I press the button it plays whatever will be in the game. So like wind can't just be a real quick sound. A thing that was happening earlier was the walking path noise would be like multiple steps for each step so when the character was walking it was just like a buzz cuz it was making four-step sounds for every single step. So it's things like that but that that's for after looking for bugs because I would assume that changing the audio effects won't cause new bugs to appear

So the pass is, in order:

1. **Every bug fix, check and play test** the hand-off asked for: the audit's other findings (T17), what the audit didn't cover, and the full test pass.
2. **One HTML file, the whole game,** as he keeps it (the four ideas of the try page on, as in the file he sent: "the entire game at its current state"). No published page: he takes the file. (This session's account isn't the one that published the game, the try page and the map editor, so it couldn't update them anyway, nor read the map editor's database; nothing is pending there, at his word.)
3. **Then a sound tool:** every sound the game uses, one by one, each played as the game plays it (the wind as long as it blows in the game, a footstep as each step lands), for him to judge. Nothing in the game's sound changes before he has heard them there.

## The branch

`claude/send-note-gigdew`. It carries the game's branch, `ccr-31761774-76j8j3`, as the old hub left it at `856f522` (a fast-forward: nothing of either was lost), with this pass on top. The game's branch itself is untouched: bring this one into it (or merge it wherever Chris wants the game to live) when the next session starts.

## The file Chris has

**"Envoi on the Longest Night - final polish.html"**, here in this folder, sent to him on October 5, at night: 18,095,301 bytes (17.26 MB of his 30), SHA-256 `f24d524826bf626bf9f8ac72755c0527f5b2b173349f136f7c9b33c5d6c63a16`.

- The whole game, everything inside: it plays with no internet. Its title inside is the game's own, "Envoi on the Longest Night"; the file's name says which copy it is, so it isn't mixed up with the one he sent.
- The four ideas of the try page are on, as in the file he sent ("the entire game at its current state"): footsteps (Settings, Footsteps: None turns them off), words that move on by themselves (Settings, Words move on: On a tap turns it back), the door's sound between maps and Buy 10 in the herb shops (no setting).
- Made from this branch with `node tools/build.mjs --min --offline putting-it-all-together/game.html` and the one line after its `<title>`: `<script>window.ENVOI_TRY = {"steps":true,"words":true,"door":true,"buy10":true};</script>`. The game's source is as it stands at `b31afe5` (the commits after it change only records and checks).
- Its saves are its own, as before: a save code (Menu, Saves) carries a game over from the file he had.

## What was checked before it went

The whole pass (`checks/full-pass.sh`), at a Pixel 7a held sideways (915 × 412) unless it says otherwise:

| Check | Result |
|---|---|
| Every map (`tools/check-maps.mjs`) | All 21 ✓ |
| The balance (`tools/balance.mjs`) | 51 of 51 targets met |
| This pass's 20 node checks (walking, game, battles, tools) | All pass |
| This pass's browser checks: the walking map (also at 915 × 356), the freeze, the title, every screen at Chrome's heights (144 measured), Esc, sound while hidden, the set fights, the cutscenes' sound, both endings in their arenas | All pass |
| The battle's menus, sub-menus, targets and end card at five sizes (`checks/battles/battle-fit.mjs`) | Pass. (In the full pass its fight once took longer than its 15-minute wait, and one measurement caught the view mid-slide at 915 × 330; run again alone, all of it passed. See `handoff.md`) |
| The game test: title, new game, walking, the Magpie's flights and landings, menu, saves, save | Pass, at 915 × 412 and at 915 × 356 (Chrome's address bar showing) |
| The game test: the three ways to walk, the four staged scenes, every band's night walks | Pass |
| The game test: the chapters | Pass |
| The game test: a band 3 wild fight played to its end | Pass |
| The game test: the Bramble Colossus (its cutscene, its fight in its arena, its keepsakes) | Pass |
| The game test: the twenty keepsakes (found, worn, counted in a fight) | Pass |
| The game test: Chris's songs where they belong | Pass |
| The game test: the finale's cutscene into its fight | Pass |
| The file Chris keeps, with the four ideas off, played with the internet blocked | Pass |
| **His file** (the four ideas on), played with the internet blocked | Pass |
| The game test catches every fault planted for it (an arena fight on the flat painting, a scene that never plays, a lost save, sounds at Off, the offline file reading beside itself) | Pass |
| The page of polish to try (the four ideas on), and the game with the four off | Both pass |
| The map editor's page test, Copy my work, and the keepsakes it keeps | All pass |
| Every arena, on the new battles' demo (`tools/arena-test.mjs`, all twelve fights) | Pass |
| The four ideas on his file (the offline try page, which is his file but for its title, byte for byte) | Pass: words that move on (and a tap still moves a line at once), the door each way, 47 soft steps and 43 of the cloak's swish (none at None or Effects off), Buy 10 |

## The sound tool (after his file, at his word)

**"Envoi Sound Check.html"**, here in this folder (built from `sound-tool/`, whose README says how): every sound the game plays, 113 cards, each played the way the game plays it through the game's own sound code: a place for a minute on the game's own timer with its music (so the wind is heard as it blows in the game), Io's footsteps as she walks and breaks into a run, a fight from the sting to the win, each piece of music and the loops of his songs, and both cutscenes' soundtracks. Where the code shows a sound broken (the wind and every other noisy sound stopping dead at half a second to two seconds; running footsteps dropping every other step; stone footsteps barely heard; the battle's eclipse cut short; the mist's wind four times too loud), a **Fixed** button plays the fix beside it. The fixes are switches in the game's sound code, off in the game until he says yes. He marks each sound Keep, Fix or Drop with a note, and **Copy my notes** gives them back to paste to Claude.

## What this pass fixed

All 35 of the audit's other findings (T17 in `../handoff/tasks.md`, each listed with its file and line in `../handoff/wrap-up-2026-10-05.md`), the things the audit didn't cover, and what turned up on the way. Four fixers worked side by side, each in its own copy of the game and its own files (walking, the game, the battles, the tools), and every fix is proven by a check that fails on the old code and passes on the new one. The checks are in `checks/`, one folder per fixer, each with a note at its top saying what it proves and how to run it.

### Walking and the flight

| What was wrong | Now | Check |
|---|---|---|
| Coming onto a map at its top edge (ten arrivals: the cottage, the jetty, Bogmire, the forest road, Dawnroost, the crossroads, Frostmere's shore, the frozen pass, Misthollow, the Ember Line road), Io's head and shoulders were above the screen | She arrives a little lower on the same path, all of her on the screen | `walking/arrivals.mjs` |
| 21 arrivals had her face the viewer: at a map's bottom edge that was back out through the way she came in | She faces into the map, the way she was walking | `walking/arrivals.mjs` |
| A random fight could start a step or two after Halcyon's ambush | The ambush starts the count to the next fight again, as a fight does | `walking/field-check.mjs` |
| The d-pad showed above and through a short question box | It hides while the game asks something, talks or shows the menu | `walking/field-check.mjs` |
| The mini-map, tapped big, ran under the d-pad's Up button on the phone | It stays above the d-pad, at every height down to Chrome's | `walking/field-check.mjs` |
| Flying into the mist that never lifts, the Magpie said she needed more lift | There she says "Cold mist that never lifts: the Magpie turns back." (more lift is still asked for at a band she can't reach yet) | `walking/field-check.mjs` |
| **Found in the pass:** the walking map could freeze (until a reload) when someone in a scene was walked to the exact point she stood on | It can't now: she simply arrives | `walking/still-walk.mjs` |
| Not covered by the audit: the flying map at every screen size | Looked at on the phone held sideways and upright, a laptop and a smaller phone: nothing overlaps or runs off the screen. Nothing to fix | (screenshots only) |

### The game: title, menus, saves, sound

| What was wrong | Now | Check |
|---|---|---|
| The Gate 15 chapter started, and a fight lost there woke the party, on the crossroads' south road, which has been closed since October 5 | It starts where the cold moor's road comes into the crossroads, facing in, and the party wakes at the northern camp, by the Magpie | `game/chapter-start-rest.mjs` |
| On the phone with a save, the game's name was cut off at the top of the title | All of the title fits, on the phone and with Chrome's address bar showing | `game/title-fits.mjs` |
| Closing the game during the scene after the first fight, or after Halcyon's ambush, brought the fight back on Continue | Each is saved as fought before its scene plays | `game/set-fights.mjs` |
| An ambush whose battle failed to run counted as fought, and Kestrel Stoop as learned | It isn't, and the party wakes at its rest, as at the other set fights | `game/set-fights.mjs` |
| Moonlore from the menu spent MP on heroes already at full HP | It says "No one needs it." and keeps her MP, as a herb does | `game/moonlore-full.mjs` |
| The made-up music and the battle's sound kept playing with the page hidden (another app, the screen off) | They wait, as Chris's songs already did, and the cutscenes' own sound too | `game/hidden-audio.mjs`, `game/cutscene-audio.mjs` |
| Taking off a keepsake that adds HP or MP and putting it back on refilled that share | It doesn't: she stays at what she had, and full stays full | `game/keepsake-refill.mjs` |
| On a keyboard, Esc stopped closing the menu after a choice in it, and the shop and the save code boxes had no Esc | Esc closes each, as its own Close, Done or Back does | `game/esc-closes.mjs` |
| **Found in the pass:** in Chrome on the phone (the address bar stays, since the game has no full screen) a keepsake's card put its buttons below the screen | On a short screen held sideways who wears it and the buttons stand beside the card. Every screen of the game was measured at those sizes: the title, its questions, the prologue, all six menu tabs, every keepsake card, the save code boxes, a shop, a talk and the ending | `game/short-screens.mjs` |
| **Found in the pass:** saves made on the old world map (before the wilderness scenes) came down facing out of their map, and the one by the crossroads on its closed south road | They come down facing in, the crossroads' where the cold moor's road comes in | `game/old-world-crossroads.mjs`, `game/old-world-facing.mjs` |

### The battles

| What was wrong | Now | Check |
|---|---|---|
| On the phone, Sol's Kestrel Stoop hover was above the screen in every arena, and "Sol learns Kestrel Stoop" at gate 15's end showed Io alone | The camera keeps all of her as she rises and as she learns it. (In the dive itself, at Chrome's shortest heights, the shot keeps the fighters on the ground first and as much of her as it can) | `battles/stoop-framing.mjs` |
| Envoi's "Last Word" (its banner, flash and shake) never played when its strike ended Noctara's Frost Dust, about one finale strike in four | It plays | `battles/last-word.mjs` |
| A hero who was down when a fight opened (after a fled fight) stood upright, sword out, at HP 0 | She kneels, as one who falls does, and rises when revived (only the models' own actions, Io's look and moves untouched) | `battles/downed-kneels.mjs` |
| The command, sub-menu and target rows were 27 px tall, edge to edge, so a thumb could pick the neighbour; and a win's end card with a level-up put Continue below the screen | Rows are 36 px; on a short screen the windows take the width and Io's eight commands go in three rows, with every fighter above them; the end card fits, Continue on the screen, also with Chrome's address bar | `battles/battle-fit.mjs` |
| In the Bramble Colossus's arena Lunara rose inside the Colossus | She rises off to its left | `battles/lunara-spot.mjs` |
| Damage numbers on the same foe printed over each other, and could leave the screen | Each new one lifts the others a line, and all stay on the screen | `battles/numbers.mjs` |
| The level-up card's HP and MP left out the keepsakes | They count them, as the game then has them | `battles/levelup-keepsakes.mjs` |
| The balance simulator's expert attacked into Halcyon's Warden's Vow | It guards, as an expert would; all 51 balance targets are still met (Halcyon's ambush at level 18: the expert wins 63%, against 53%, inside its 40 to 85%) | `battles/vow-guard.mjs`, `node tools/balance.mjs` |
| Sol's Guard didn't say what it costs | "Guard [−40 Heat]", as her Sword Arts do | `battles/guard-tag.mjs` |
| The end card's frame-rate line (the October 2 decision) never showed | It shows: the average, the slowest second and the cap | `battles/fps-line.mjs` |
| Losing the first fight, the card said Io wakes by the Moonwell; she wakes in her own bed | It says her own bed | `battles/first-lose.mjs` |
| Not covered by the audit: the finale's ending and the spared ending, in their arenas | Both played through the game to their end screens ("The End" and back to the title), with no error | `battles/endings.mjs` |

### The tools (how Chris's map edits get into the game, the build, the tests)

| What was wrong | Now | Check |
|---|---|---|
| **The important one:** `apply-edits.mjs` silently applied nothing from the map editor's "Copy my work", though `check-edits.mjs` had just passed it as safe | It reads every kind of file `check-edits.mjs` reads, writes nothing at all if anything is wrong, and names the keepsakes Chris moved (they go into `items.js` by hand) | `tools/apply-edits-shapes.mjs` |
| The map editor's "Download my work" said "Downloaded" though nothing downloaded | It's gone; where the editor can't send, it says to press Copy my work | `tools/map-editor-copy.mjs` |
| Art left outside the page (a path in single quotes) got no warning, and the offline test couldn't notice, since it ran beside the repository's own art | The build fails and names it; the offline test plays the file from a folder of its own. A plain build still needs nothing installed, as Mooncart builds it | `tools/build-guards.mjs`, `tools/game-test-plants.mjs` |
| With the arenas on, the game test passed a fight that fell back to the flat painting | It fails (the first fight, flat by design, excepted) | `tools/game-test-plants.mjs` |
| `check-edits.mjs` no longer checked the keepsakes could still be reached | It does, where Chris put them | `tools/check-edits-keepsakes.mjs` |
| The map editor's stale document `edits/wickhollow` (already in the game) | Its README says applied documents are deleted from its database. The document itself is on the other account (below) | none (a note) |
| The game test's scenes step couldn't fail, its save step passed on any old save, and nothing saved over a full slot by a tap or checked Effects and Surroundings at Off are silent | Each fails where it should | `tools/game-test-plants.mjs` |
| Nothing checked the sizes: the published page against 16,000,000 bytes, Chris's file against 30 MB | The build prints both in bytes and fails over either | `tools/build-guards.mjs` |
| The map editor stored every keepsake's place on Chris's first visit, so a later move in `items.js` would have been undone by his next send | It keeps and sends only the ones he moved | `tools/map-editor-keepsake-places.mjs` |
| The keepsakes step rolled its fight at random, so it took 100 s or 300 s | It fights one wraith in clear weather every time | `tools/keepsakes-fight-pinned.mjs` |

### Files changed outside this folder, and why

The game's own files, where the build reads them (a fix to the game can live nowhere else), the tools that build and test it, and three pointers so the next session finds this folder:

| File | Why |
|---|---|
| `src/game/maps.js` | The arrivals: all of Io on the screen, facing into the map |
| `src/game/field.js` | No fight a step after the ambush; the d-pad hidden under questions; no freeze on a walk of no length |
| `src/game/fly.js` | The line at the mist that never lifts; the flight's clock never runs backwards |
| `src/game/game.js` | The Gate 15 chapter; the set fights saved before their scenes; Esc; old saves facing in; the cutscenes' sound paused while hidden |
| `src/game/state.js` | Moonlore at full HP; the keepsakes' HP and MP |
| `src/game/game.css` | The title, the keepsake cards and the big mini-map on short screens; the d-pad hidden |
| `src/game/thareia-audio.js`, `src/battle/sound.js` | The made-up music and the battle's sound wait while the page is hidden (no sound itself changed) |
| `src/game/fights.js` | Lunara's place in the Colossus's arena; the first fight's losing line |
| `src/battle/screen.js`, `src/battle/screen.css` | Kestrel Stoop's framing; Last Word; a downed hero kneels; the rows, the menus and the end card on the phone; the damage numbers; the level-up card; the frame-rate line |
| `src/battle/engine.js` | Guard's Heat tag |
| `src/battle/sim.js`, `src/battle/balance-results.js` | The balance tool's expert guards through the Warden's Vow (the game's own numbers are unchanged) |
| `tools/build.mjs` | It fails on art left outside a page and on a page too big |
| `tools/game-test.mjs` | It fails where it used to pass; the keepsakes' fight pinned; the Gate 15 chapter's comments |
| `envoi-game-pass-3/map-paths/` (`apply-edits.mjs`, `check-edits.mjs`, `edits-core.js`, `README.md`) | Chris's map edits from Copy my work go into the game, and the keepsakes' reach is checked |
| `envoi-final-draft/map-editor/` (`map-editor.js`, `map-editor.html`, `page-test.mjs`, `README.md`) | No Download my work; only the keepsakes Chris moved are kept and sent |
| `handoff/README.md`, `handoff/tasks.md`, `CLAUDE.md` | One pointer each to this folder (T17 marked done) |

### Left as they are, on purpose

- **While landing, the Magpie ignores the mist,** so "Land where we took off" pressed far from the take-off stop flies her straight back over it (the audit's walking 6; it was so before the landing fix too).
- **The phone held upright (390 × 844) in a fight:** the arena's picture must fill the screen's height, so Io stands off its left edge (before this pass too). Chris plays sideways.
- **The cottage's old world-map arrival** is on its south road, closed since October 5; she faces up it now and walks on home. Only saves made on the world map before October 5 come down there.
- **The map editor's database** (the stale `edits/wickhollow`, and the keepsakes' places its older version stored) is on the account that published it, which this session's isn't. Nothing in it is pending (Chris: "All of the edits I made with the map editor are already implemented").
- **Every sound,** until Chris has heard them in the sound tool (below).
