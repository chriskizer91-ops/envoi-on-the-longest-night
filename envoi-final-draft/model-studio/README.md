# The Model Studio

How the game's session (the hub) gets many 3D models built at once, through Chris: he makes the pictures, starts a modeling session for each creature, and brings back what it made. Every modeling session works in its own folder on its own branch, so any number can run side by side without getting in each other's way, and nothing it does can break the game.

## The loop

1. **Pictures.** Chris generates a creature's two sheets from `../../docs/art-requests/13-wild-creatures.md`: the model sheet and the action sheet.
2. **A modeling session.** He starts a new Claude Code session on the `envoi-on-the-longest-night` repository (the strongest model and effort he has), pastes that creature's **starter message** from below, and attaches the two sheets. It works on its own branch, `work/model-<id>`, so the hub always knows where to find it (the workshop's way: `../workshop/README.md`).
3. **The bench page.** The session builds the model in code, checks it against the sheets, and publishes a bench page: the creature in the wild meadow at night in front of Io and Sol, with a button for every move. Chris opens it on his phone and asks for changes in that same session until he's happy.
4. **The return slip.** The session finishes with a short block of text (`return-slip.md`). Chris copies it into the hub.
5. **Into the game.** The hub brings the model in (`intake.md`): its rules and balance, which bands it lives in, a demo page with its fight, then the game, and publishes both for Chris.

**How many at once:** two or three. In pass three, four helper sessions at once ran into the account's usage limit and stopped halfway.

**If copying and pasting gets tiresome:** upload the sheets in the hub session and ask it to start the modeling sessions itself. It can save the sheets to the repository and open a cloud session per creature on your account, with the same starter message.

## Starter messages

Paste one into a new session, with that creature's two sheets attached. Wave 1 first: bands 1 and 2 have no creatures of the wild yet.

**Wave 1**

```text
You're a modeling session for Envoi on the Longest Night. Start from the game on your own branch: git fetch origin ccr-31761774-76j8j3 && git checkout -B work/model-thornhound FETCH_HEAD
Then read envoi-final-draft/model-studio/how-to-model.md and envoi-final-draft/model-studio/briefs/thornhound.md, and build the Thornhound from my two sheets, attached. Push to work/model-thornhound as you go. Show me its bench page when it's ready.
```

```text
You're a modeling session for Envoi on the Longest Night. Start from the game on your own branch: git fetch origin ccr-31761774-76j8j3 && git checkout -B work/model-glowcap FETCH_HEAD
Then read envoi-final-draft/model-studio/how-to-model.md and envoi-final-draft/model-studio/briefs/glowcap.md, and build the Glowcap from my two sheets, attached. Push to work/model-glowcap as you go. Show me its bench page when it's ready.
```

```text
You're a modeling session for Envoi on the Longest Night. Start from the game on your own branch: git fetch origin ccr-31761774-76j8j3 && git checkout -B work/model-mire-toad FETCH_HEAD
Then read envoi-final-draft/model-studio/how-to-model.md and envoi-final-draft/model-studio/briefs/mire-toad.md, and build the Mire Toad and Gorrow from my two sheets, attached. Push to work/model-mire-toad as you go. Show me its bench page when it's ready.
```

```text
You're a modeling session for Envoi on the Longest Night. Start from the game on your own branch: git fetch origin ccr-31761774-76j8j3 && git checkout -B work/model-moor-boar FETCH_HEAD
Then read envoi-final-draft/model-studio/how-to-model.md and envoi-final-draft/model-studio/briefs/moor-boar.md, and build the Moor Boar and Old Snag from my two sheets, attached. Push to work/model-moor-boar as you go. Show me its bench page when it's ready.
```

**Wave 2:** the same message with `moss-bear.md` (the Moss Bear), `white-hart.md` (the White Hart of Fawnrest) or `thunder-roc.md` (the Thunder-Roc of Stormwatch), and the brief's name in its branch too (`work/model-moss-bear`, and so on).

**Wave 3:** the same with `ember-beetle.md` (the Ember Beetle), `blackwater-gar.md` (the Blackwater Gar and Old Jaws) or `veilcat.md` (the Veilcat).

**Anything else** (another creature, a townsperson in 3D for a cutscene, a prop): the hub fills in `briefs/_template.md` as a new brief first, and the starter message names that file.

## The board

Kept up to date by the hub as slips come back.

| Creature | Wave | Sheets | Modeling session | Bench page | In the game |
|---|---|---|---|---|---|
| Thornhound, and the Rime Wolf | 1 | Waiting | | | |
| Glowcap | 1 | Waiting | | | |
| Mire Toad, and Gorrow | 1 | Waiting | | | |
| Moor Boar, and Old Snag | 1 | Waiting | | | |
| Moss Bear | 2 | Waiting | | | |
| The White Hart of Fawnrest | 2 | Waiting | | | |
| The Thunder-Roc of Stormwatch | 2 | Waiting | | | |
| Ember Beetle | 3 | Waiting | | | |
| Blackwater Gar, and Old Jaws | 3 | Waiting | | | |
| Veilcat | 3 | Waiting | | | |

## Why the models are built in code

Every model in the game is written as code that draws it (no model files), the way the Bramble Colossus and the cast are. In the file Chris keeps, a creature built that way costs about 0.06 to 0.09 MB with every move it makes. For comparison, the Tripo test of Io in `3d-cutscenes/` (another branch) came out at 7.8 MB and 502,000 triangles, with no skeleton yet, so it can't move. Ten creatures made that way would take more than the 30 MB file has room for, and the phone couldn't draw them five at a time. Tripo and Meshy are still worth it for close-up cutscene models, which is what that folder is testing.

## Files

| File | What it is |
|---|---|
| `how-to-model.md` | What every modeling session reads first: the steps, the rules, the bench, the hand-back |
| `briefs/<id>.md` | One creature each: what it is, its looks, its budget, its moves |
| `briefs/_template.md` | A blank brief for anything else |
| `return-slip.md` | What a modeling session hands back |
| `intake.md` | How the hub brings a finished model into the game |
