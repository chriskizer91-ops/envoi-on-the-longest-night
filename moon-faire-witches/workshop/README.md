# The Moon Faire witches' workshop

How several conversations work on the new game at once (Chris, November 16, 2026: he wants the project knowledge to be "a
collaboration space, so multiple sessions can work on different things", with the hub handing jobs to other conversations
through it instead of to helpers of its own).

It works like Envoi's own workshop (`envoi-final-draft/workshop/README.md`), with two changes: the board lives in the
claude.ai project's knowledge, where every conversation in the project can read it, and what Chris gets is a single HTML
file to download, not a published page.

## Where things are

- **The board:** the project document `claude/envoi-board.md` (in the project's knowledge): where the game stands, what is
  being worked on, what is left, every job and the starter text for it. Only the hub (the conversation that builds the
  game) changes the board, so two conversations never write over each other.
- **The briefs:** this folder, one file per job (`fight-math.md`, `world-3d.md`). A brief says what the job does, which
  files it may change, how to check it, and when it is done.
- **The slips:** what a job hands back. Each job session keeps its own project document `claude/slips/<job>.md` up to date
  (it is the only project document it writes), and the same text in this folder as `slips/<job>.md` on its branch.
- **The game's branch:** `claude/moon-faire-witches`. Every job starts from it and works on its own branch, `work/<job>`.

## The loop

1. **Start.** Chris opens a new conversation in the project, with the `envoi-on-the-longest-night` repository, and pastes
   the job's starter text from the board.
2. **Set up.** The session starts from the game's branch on its own: `git fetch origin claude/moon-faire-witches &&
   git checkout -B work/<job> FETCH_HEAD`, then `npm install --prefix tools` and `node moon-faire-witches/tools/patch-io.mjs`
   (Io's added moves are built, not kept in git). It reads the board, this file, its brief and `moon-faire-witches/README.md`,
   then writes its slip document saying it has started.
3. **Work**, changing only the files its brief allows, and **push** after each step that works: `git push -u origin work/<job>`.
4. **A file for Chris.** Each step ends in one HTML file built with `node tools/build.mjs --offline <page>` and sent to him to
   download and open on his phone (a Pixel 7a), with stills that prove it and simple numbers. He asks for changes in the same
   conversation until he is happy.
5. **The slip** (below), in its project document, in `slips/<job>.md` (pushed) and as its last message.
6. **Into the game.** The hub reads the slips, checks the branch, brings it in and updates the board.

**How many at once:** the hub and two job sessions at most. In Envoi's third pass, four helpers at once ran into the
account's usage limit and stopped halfway.

## Rules for every job session

1. **Only the files your brief allows.** Anything else you think should change goes in your slip under "Open".
2. **The project's rules** (`../../CLAUDE.md`), and these for this game:
   - Io is Moon Faire's Io (the Herbal Witch: natural herbal healing and summoning); the Jester completely replaces Sol and
     has no name. Both use their lightest models. Their looks and the way they move stay exactly as Moon Faire made them.
   - The Jester plays by Moon Faire's Fate rules exactly. The numbers can change; the rules can't.
   - Envoi's levels, foes and how often they come stay as they are. Only the final boss is Moon Faire's.
   - The main cast is all women, and Halcyon is "she" everywhere, code comments included. The Drowned Mother, Old Snuff
     and the mandrakes are retired: never use them or their lore.
   - `chriskizer91-ops/moon-faire` and the other sibling repositories are read-only: copy from them only with the source
     named in the commit message.
   - Lore questions go to Chris in `docs/questions/moon-faire-witches.md` (he answers them in a separate lore conversation).
     New art he needs to make goes in `docs/art-requests/` as prompts.
3. **Plain words for Chris.** He builds games through these conversations and doesn't write code. Show him, with stills
   and simple numbers; keep phone screens uncluttered.
4. **Check before you hand back:** your brief's checks pass, with no page errors.

## The slip

```text
SLIP: <job>
State:    Started | Working | Ready for the hub | Done
Branch:   work/<job>   Commit: <short hash>
Files:    <every file you changed, by path>
File for Chris: <the HTML file's name, and what to try in it>
Done:     <what it does, in a few lines>
Checked:  <your brief's checks, and their results, in numbers>
Chris said: <his notes, and whether he's happy with it>
For the hub: <what the game needs to take it in>
Open:     <anything not done, or for Chris or the hub to decide>
```

## Bringing a job in (for the hub)

1. `git fetch origin work/<job>`, then `git diff --stat HEAD...FETCH_HEAD`: every path must be one its brief allows. If
   anything else changed, take only the allowed files (`git checkout FETCH_HEAD -- <paths>`) and say so in the commit.
2. `git merge --no-ff FETCH_HEAD -m "Bring in <job> from work/<job>"`, rebuild the pages it touches, run its checks again.
3. Update the board.
