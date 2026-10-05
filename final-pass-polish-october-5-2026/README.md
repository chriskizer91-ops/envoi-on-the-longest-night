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

`claude/send-note-gigdew`. It carries the game's branch, `ccr-31761774-76j8j3`, as the old hub left it at `856f522` (a fast-forward: nothing of either was lost), with this pass on top.
