# Cutscenes

Started October 4, 2026, evening, when Chris shared three Bramble Colossus pages and asked whether a film like the field study's could be a cutscene in the game: the first time the party meets the Colossus in the wilds, and the opening of the final battle, with the camera coming in from far off onto the four of them. This folder holds the plan and a brief for each cutscene. Each one is made by its own session, in its own folder here, and comes back to the game's session to go in.

## Can the game have cutscenes like the film?

Yes, with two changes to how the film is made:

- **Shorter.** The field study's film runs about four minutes, and its short ("In motion") about a minute and a half. A cutscene before a fight should be under a minute, and the player can always skip it.
- **Lighter.** The film was made for a laptop: about 3.8 million triangles a frame at High. On Chris's Pixel 7a a cutscene needs a Phone detail, as the prologue test in `../../3d-cutscenes/` has (Light, Phone and Laptop), and should hold about 30 frames a second. A film can run at 24 to 30 without looking wrong.

Everything else carries over: the film camera (`cinema.js`: depth of field, bloom, moonlight shafts, a film grade, letterbox), shots written as data, and sound made in code. And it's cheap in the file: the prologue test, Io and her garden included, is 0.38 MB as one page, and a cutscene is code, not video. Video would cost several megabytes a minute.

**The game already tells this moment in words.** When the Colossus is met, the battle says: "Beside the frozen road stands a thicket as big as a house, green where nothing else is. The snow round it has melted." Then: "The ground splits. It heaves itself up out of the earth, and a great thorned bud opens on a glowing heart: a Bramble Colossus." The field study already shows that warm green ring in the frost. The cutscene shows what those lines say.

## What there is to build on

| What | Where | What it gives a cutscene |
|---|---|---|
| The prologue test | `../../3d-cutscenes/` (`Prologue_In_Ios_Garden.html`) | The scene player (`player.js`), shots as data (`scenes.js`), the film camera, the game's dialogue box, Light / Phone / Laptop detail, an end card that reports the frame rate, and the cutscene Io with her paper doll's face (Chris's request for cutscenes) |
| The field study | `../../3d-model-field-studies/bramble-colossus/` | The Colossus at laptop detail (98k triangles at detail .25), its meadow by Frostmere in 3D (`frostmere.js`), the film (`film.js`), the short (`motion.js`) and every sound (`sounds.js`) |
| The Io study | `../../3d-model-main-characters/io/` | Io at the same detail as the field study, in her garden |
| Chris's battle page | `../../reference/demos/bramble-colossus-battle.html` | A boss fight with a director's camera, moods (dusk, a storm, Wrath), a far world painted in code, and film-like finishing (bloom, god rays, a grade, letterbox). A reference for the look; its source isn't in this repository |
| Colossus in the Meadow | `../../living-battlefields/` | The living battlefield: the meadow that answers the fight |
| The game's models | `../../src/models/` | Sol, Halcyon, Noctara and the rest, each with every move the game uses |

## The two cutscenes

| Cutscene | Its folder | Brief |
|---|---|---|
| **The Colossus, first met:** under a minute, the first time the party meets it beside the frozen road; ends where its fight begins | `colossus-first-meeting/` | `briefs/colossus-first-meeting.md` |
| **The finale's opening:** the camera comes in from far off, over the peaks and Misthollow, down to the dead Moonwell and the four of them: Io and Sol, Noctara and Halcyon; ends where the last fight begins | `finale-opening/` | `briefs/finale-opening.md` |

## Starter messages

Paste one into a new Claude Code session on the `envoi-on-the-longest-night` repository. No pictures are needed: everything is in the repository.

```text
You're a cutscene session for Envoi on the Longest Night. First bring your branch up to the game: git fetch origin ccr-31761774-76j8j3 && git merge --ff-only FETCH_HEAD
Then read envoi-final-draft/cutscenes/README.md and envoi-final-draft/cutscenes/briefs/colossus-first-meeting.md, and make the cutscene for the first time the party meets the Bramble Colossus. Show me its page when it's ready.
```

```text
You're a cutscene session for Envoi on the Longest Night. First bring your branch up to the game: git fetch origin ccr-31761774-76j8j3 && git merge --ff-only FETCH_HEAD
Then read envoi-final-draft/cutscenes/README.md and envoi-final-draft/cutscenes/briefs/finale-opening.md, and make the opening cutscene of the final battle. Show me its page when it's ready.
```

**For the finest render of the four (optional, alongside the finale):** the Io study shows how far a character can go past her game model at laptop detail. Three more sessions could do the same for the other three, each keeping her game model's look, bones and moves, so the finale cutscene can swap them in with a line each. Each takes this message, with the name changed:

```text
You're a modeling session for Envoi on the Longest Night. First bring your branch up to the game: git fetch origin ccr-31761774-76j8j3 && git merge --ff-only FETCH_HEAD
Then read 3d-model-main-characters/README.md and 3d-model-main-characters/io/README.md, and make Halcyon's study the same way, in 3d-model-main-characters/halcyon/. Show me her page when it's ready.
```

(Sol's goes in `3d-model-main-characters/sol/`, Noctara's in `3d-model-main-characters/noctara/`.)

## Rules for every cutscene session

1. **Only your folder.** Work in `envoi-final-draft/cutscenes/<your cutscene>/` and nowhere else: not `src/`, not the game, not the other folders you build on. Copy what you need from them into your folder unchanged, as `3d-cutscenes/` did, and say in your README where each copy came from. Anything you change in a copy, mark it in a comment.
2. **The game's rules hold.** The main cast is all women, and Halcyon is "she" everywhere. The Drowned Mother, Old Snuff and the mandrakes are retired. Moths are souls going home. The sky has no stars until the ending. In cutscenes Io is the cutscene Io (`3d-cutscenes/io-cutscene.js`, her paper doll's face, Chris's request); her bones, clothes and moves stay as they are, and the battles keep the game's Io.
3. **Words are placeholders.** Use the game's own lines (`src/game/script.js`, and the fights' `introMsg` and `introAfter` in `src/game/fights.js`) or none. The lore conversation writes the real ones, so keep every line in one data file.
4. **Made in code.** three.js r128, no image, model, sound or video files, nothing loaded from the web except three.js itself from cdnjs on the published page. The game's offline file puts three.js inside.
5. **A page for Chris's phone.** One file, `<Name>_Cutscene.html`, published privately, with Light, Phone and Laptop detail (Phone chosen on a phone), a Skip button, sound on a tap, and an end card that says how many frames a second it drew.
6. **Ready for the game.** Besides the page, a module the game can call: `window.CUTSCENES['<id>'] = { title, play(container, opts) }`, where `play` builds everything inside `container`, plays, and returns a promise that settles `'done'` or `'skipped'`. Then it frees everything, its WebGL context included (`renderer.dispose()` and `renderer.forceContextLoss()`), before the battle builds its own. `opts` carries `{ quality, volume: { music, effects, surroundings } }`.
7. **Check it headless** at 915 × 412 (the Pixel 7a held sideways) and at a laptop's size, with stills of every shot, as `3d-cutscenes/tools/shots.mjs` does. No errors.
8. **Hand it back.** Commit only your folder and push to your own branch. Your last message is a slip for the game's session:

```text
CUTSCENE SLIP: <title>
Brief:   envoi-final-draft/cutscenes/briefs/<id>.md
Branch:  <your branch>   Commit: <short hash>
Folder:  envoi-final-draft/cutscenes/<id>/   (nothing outside it changed)
Page:    <the claude.ai/artifact link>
Module:  <file>, window.CUTSCENES['<id>']; plays <seconds>; <MB> as one file without three.js
Speed:   <frames a second at Phone and Laptop, measured headless; Chris's phone if he said>
Copies:  <each file copied in, and where from>
Words:   <the lines it shows, all placeholders>
Open:    <anything for Chris or the game's session>
```

## Into the game

Both came back on October 4, late evening, and went in the same night, when Chris said "the cut scenes are done". For the next one, the game's session merges its branch after checking it touched only its folder (as `../model-studio/intake.md` does for models), loads its module in `../../putting-it-all-together/game.html` and names its fight in `src/game/game.js` (`cutsceneFor`). Then: the size, a rebuild, the tests, and the game and chapter demos published.

How the two play (`src/game/game.js`, "the cutscenes"):

- **The Colossus:** the first wild fight against one plays the cutscene, at the Colossus's own level. **The finale:** the cutscene plays before the first try. Each plays once a game (the save's `seen`, under the cutscene's id): a second Colossus, or another try at the finale, goes straight to the fight.
- **The fight starts where the cutscene ends.** Its last picture stays over the battle while the battle builds, then fades into it. The battle starts with its quick intro, so the lines the cutscene has shown aren't said again, and with `standing`: the foes are already where the cutscene left them, so they don't rise a second time (`src/battle/screen.js`, `intro`). That answers both cutscenes' "quick intro, second rise" note.
- **Skip** (the button, or Esc) still counts as seen. The game's Music, Effects and Surroundings volumes go in (its Normal is the cutscene's 1), and a phone gets Phone detail.
- **Watch again:** once a game has shown one, the menu's Settings can play it again, over the menu.
- **Size:** the modules are 0.40 and 0.45 MB inside the page. The published game is 14.4 MB with both (the build's measure), and a published page may be 16 MB at most, so little more fits inside it. Past that, the split build puts the art beside the page (`../../putting-it-all-together/README.md`, "Building and checking"). The file Chris keeps is 17.1 MB, with room up to 30.

## The board

| Cutscene | Session | Page | In the game |
|---|---|---|---|
| The Colossus, first met (45 s) | Branch `claude/lucid-ritchie-bt1e9z`, merged October 4 | https://claude.ai/artifact/GTMr6zTMt5iwoFt5uxG5nY | In (October 4, late evening): before the first Bramble Colossus |
| The finale's opening (72 s) | The same branch | https://claude.ai/artifact/PTwiL7MmnCWkdwA54yHex9 | In (October 4, late evening): before the finale's first try |
| Studies of Sol, Halcyon and Noctara (optional) | Not started | | |
