# The Workshop

How several sessions work on the game at once (Chris, October 5, 2026: "We can write handoff notes to new sessions with scripts ... to push to a specific place so other agents can work at max level on more things at once").

Each piece of work that can go ahead on its own has a **brief** here and a **starter script**. Chris starts a new session with the script; the session works only on what its brief allows, pushes to its own branch, `work/<job>` (the specific place), and leaves a **slip** saying what it did. The game's session (the hub) fetches that branch, checks it, merges it into the game, tests it and publishes it. The model studio (`../model-studio/`) and the cutscenes (`../cutscenes/`) are run the same way and belong to the workshop too.

## The loop

1. **Start.** Chris opens a new Claude Code session on the `envoi-on-the-longest-night` repository, at the strongest model and effort he has, pastes a starter script from below, and attaches anything it asks for.
2. **Work.** The session starts from the game's branch on its own branch, reads this file and its brief, and changes only the files its brief allows.
3. **Push** as it goes, to `work/<job>`.
4. **A page for Chris's phone.** He looks, and asks for changes in that same session until he's happy.
5. **The slip.** Saved as `slips/<job>.md` (and pushed) and pasted as its last message.
6. **Into the game.** Chris tells the hub the job is done, or the hub finds the slip when it fetches. The hub brings it in (below).

**How many at once:** two or three. In pass three, four helper sessions at once ran into the account's usage limit and stopped halfway.

**The hub can start them too:** Chris can ask the game's session to open a cloud session on his account for a job, with the same script and anything he uploaded.

## The jobs

| Job | What it does | Brief | Branch | State |
|---|---|---|---|---|
| `wilds` | The eight wilderness scenes from Chris's pictures (art request 12): traced, joined in a row, a demo page where Io walks them | `wilds.md` | the game's branch | **Done by the hub** (October 5): the ultracode hub traced them and built the demo page itself, so no session was needed for this job, and they went into the game the same day at Chris's go-ahead (`../wilds/README.md`; `../../handoff/tasks.md`, T02) |
| `words` | Every word of the game, written with Chris: his lore conversation | `words.md` | `work/words` | Ready |
| `model-<id>` | A creature of the wild, from Chris's two sheets (art request 13) | `../model-studio/` | `work/model-<id>` | Waiting on the sheets |
| `study-<name>` | Sol, Halcyon or Noctara built finer, for the finale's cutscene (optional) | `../../3d-model-main-characters/README.md`, starter in `../cutscenes/README.md` | `work/study-<name>` | Optional |
| (the hub) | The new battle arenas | `../arena/README.md` | the game's branch | In the game since October 5: brought in switched off, and switched on the same day at Chris's yes after the demo (`../../handoff/tasks.md`, T01) |

Anything else that can go ahead on its own gets a brief from `_template.md` first, written by the hub, and its starter script names it.

## Starter scripts

**The wilderness scenes** (attach the eight pictures). Not needed any more: the hub made the scenes, and they are in the game since October 5, so this script is kept only as it was:

```text
You're a workshop session for Envoi on the Longest Night: the wilderness scenes. Start from the game on your own branch: git fetch origin ccr-31761774-76j8j3 && git checkout -B work/wilds FETCH_HEAD
Then read envoi-final-draft/workshop/README.md and envoi-final-draft/workshop/wilds.md, and make the eight wilderness scenes from my pictures, which are in reference/art/walk/wilds/. Push to work/wilds as you go. Show me the demo page when it's ready.
```

**Every word:**

```text
You're a workshop session for Envoi on the Longest Night: every word, written with me. Start from the game on your own branch: git fetch origin ccr-31761774-76j8j3 && git checkout -B work/words FETCH_HEAD
Then read envoi-final-draft/workshop/README.md and envoi-final-draft/workshop/words.md, and write the game's words with me, starting with the questions you need me to answer. Push to work/words as you go.
```

**A creature:** the model studio's scripts (`../model-studio/README.md`), one per creature, with its two sheets.

## Rules for every workshop session

1. **Start from the game, on your own branch:** `git fetch origin ccr-31761774-76j8j3 && git checkout -B work/<job> FETCH_HEAD`, then `npm install --prefix tools` once. If that refuses, stop and tell Chris; don't force anything.
2. **Only the files your brief allows.** The rest of the game belongs to the hub, and other jobs may be working at the same time. Anything else you think should change goes in your slip under "Open".
3. **Push to `work/<job>`** after each step that works: `git push -u origin work/<job>`. If that push is refused, push to your own branch and name it in your slip.
4. **The project's rules** (`../../CLAUDE.md`):
   - the main cast is all women (Io, Sol, Halcyon, Noctara and Lunara), and Halcyon is "she" everywhere, code comments included;
   - the Drowned Mother, Old Snuff and the mandrakes are retired: never use them or their lore, though older notes still describe them;
   - the Witch's 3D model keeps exactly how she looks and moves;
   - moths are souls going home, the wisps and wraiths are Noctara's, and the sky has no stars until the ending;
   - the sibling repositories are read-only: copy from them only with the source named in the commit message.
5. **A page on Chris's phone** before anything goes into the game, published privately. Write what he reads in plain words: he isn't a programmer.
6. **Check before you hand back:** your brief's checks pass, with no page errors.
7. **The slip** (`slips/<job>.md`, then as your last message), in this shape:

```text
WORKSHOP SLIP: <job>
Branch:   work/<job>   Commit: <short hash>
Files:    <every file you changed, by path>
Page:     <the page's claude.ai/artifact link>
Done:     <what it does, in a few lines>
Checked:  <your brief's checks, and their results>
Chris said: <his notes, and whether he's happy with it>
For the hub: <what the game needs next to take it in>
Open:     <anything not done, or for Chris or the hub to decide>
```

## Bringing a job in (for the hub)

1. **Fetch and check:** `git fetch origin work/<job>`, then `git diff --stat HEAD...FETCH_HEAD`: every path must be one its brief allows. If anything else changed, take only the allowed files (`git checkout FETCH_HEAD -- <paths>`) and say so in the commit message.
2. **Merge:** `git merge --no-ff FETCH_HEAD -m "Bring in <job> from work/<job>"`.
3. **Check:** the brief's checks again, `node tools/check-maps.mjs`, `node tools/balance.mjs` (51 of 51), and the game test (`node tools/game-test.mjs`); then do what the slip's "For the hub" asks.
4. **Publish** the game and its demo, update the table above, `../../docs/still-to-come.md`, `../../docs/next-session.md` and `../../putting-it-all-together/README.md`, and tell Chris.

While `words` is out, the hub leaves the words in `src/game/script.js` alone, so the two never change the same lines.

## Files

| File | What it is |
|---|---|
| `README.md` | This: the loop, the jobs, the starter scripts, the rules, bringing a job in |
| `wilds.md` | The brief for the eight wilderness scenes |
| `words.md` | The brief for every word |
| `_template.md` | A blank brief for a new job |
| `slips/` | The slips the jobs leave |
