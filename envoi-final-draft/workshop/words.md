# Workshop Brief: Every Word

**Job:** `words`. **Branch:** `work/words`. **With Chris:** this session is his lore conversation. It asks him what the lore doesn't already answer, and no line goes in until he has approved it.

Read `README.md` here first: the loop, the rules every workshop session keeps, and the slip.

## What it's for

Every line in the game is still a placeholder, written by Claude to hold the story's shape until Chris's lore conversation writes the real ones (`../../docs/still-to-come.md`, 5). This job writes them with him, from his lore, so the game reads as his story. The structure stays: who speaks when, where people walk in a scene, what each line triggers. Only the words change.

## The canon, in order

1. `docs/design-decisions.md`
2. `docs/lore/lore-answers-2026-10-01.md`
3. `docs/lore/amendment-noctara-the-starless.md`
4. `docs/lore/lore-and-party-bible.md`, except the **Drowned Mother, Old Snuff and the mandrakes**, which are retired: never use them or their lore, though the bible still describes them.

And: the questions still open in `docs/questions/open.md` (24 to 32 among them); the main cast is all women, and Halcyon is "she"; moths are souls going home; the wisps and wraiths are Noctara's; the sky has no stars until the ending; nobody dies on screen until the ending.

## What to write

- **`src/game/script.js`**, all of it:
  - what each townsperson says, as the story moves on (`people`);
  - the five letters at the small wells (`wells`);
  - the lines as each keepsake is found, the four gifts' (Nettie's, Marta's, Ysmera's, Ede's) and the first Colossus's (`keepsakes`, `gifts`, `colossusGifts`);
  - every story scene, from the prologue to the ending (`scenes`);
  - the names of the twelve placeholder townsfolk (`cast`): Old Wenna, Tobb and Pell in Bogmire; Marta, Brann and Tamsin at Dawnroost; Pim, Tock and Old Gil at the shipyard; Sorrel, Ede and the watchwoman in Misthollow.
- **`src/game/maps.js`:** the same twelve names where those people stand (their `name:` only).
- **`src/game/fights.js`:** each fight's two lines, `introMsg` and `introAfter`.
- **The two cutscenes' captions:** `envoi-final-draft/cutscenes/colossus-first-meeting/src/words.js` and `envoi-final-draft/cutscenes/finale-opening/src/words.js`. Rebuild each module from its folder afterwards (`node tools/build.mjs`, then `node tools/check.mjs`, which must end with "all good").

**Only the words.** Never the ids, the conditions, the stage directions (the objects inside a scene, which say who walks where), or any code. Keep each line about as long as the one it replaces, most under 150 characters, so it fits the dialogue box on the phone held sideways; a longer speech becomes more lines. A line is `[who, text]` or a string (narration), as the top of `script.js` says.

## How

1. **Start** as `README.md` says, on `work/words`.
2. **Read** the canon and every line as it stands now.
3. **Ask Chris** what you need that the canon doesn't answer, a few questions at a time, starting with the open ones (24 to 32). Write his answers in `docs/lore/lore-answers-2026-10-05.md`, in his words, and mark each question answered in `docs/questions/open.md`.
4. **A script page for his phone** (published privately): for each chapter (the start, gate 5, gate 10, gate 15, the finale and the ending), each place and scene with the line now and the new line beside it, for him to approve or change. Republish it at the same link as you go.
5. **Put the approved lines in,** a chapter at a time, pushing each.
6. **Check:** `node --check src/game/script.js`; build the game (`node tools/build.mjs --min putting-it-all-together/game.html`) and play it headless (`node tools/game-test.mjs --steps title,new,walk,scenes,menu`); both cutscenes' checks end with "all good". No page errors.
7. **The slip**, as `README.md` says, with these too:

```text
Written:  <how many lines, by part; anything still a placeholder>
Answers:  docs/lore/lore-answers-2026-10-05.md (<the questions answered>)
Names:    <each of the twelve townsfolk: old name → new name>
```

## The files this job may change

- `src/game/script.js`: the words, and the twelve names in `cast`.
- `src/game/maps.js`: those twelve people's `name:` only.
- `src/game/fights.js`: `introMsg` and `introAfter` only.
- `envoi-final-draft/cutscenes/*/src/words.js`, and each cutscene's built module and page.
- `docs/lore/lore-answers-2026-10-05.md` (new) and `docs/questions/open.md` (answers).
- `envoi-final-draft/words/`: the script page and its notes.
- `envoi-final-draft/workshop/slips/words.md`.
