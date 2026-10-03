# Putting It All Together

This folder is where the whole game comes together. Every piece is built and tried on its own first: a model on its bench page, a fight on its demo page, a new creature in `../3d-model-new-character-ideas/`. Then it joins the game here. At the end, the game becomes one file that Chris keeps, and it works with no internet.

Started October 3, 2026. All the work so far is now on one branch, `ccr-9e19f4e2-29pyn6`:

- the whole game, from the title to the ending, from the `second-account-work` branch;
- the new creature ideas (the Bramble Horror, the Bramble Colossus and the wild meadow) from the `claude/sleepy-dirac-t4ftx0` branch.

## What's in the game, and what's coming

| Piece | Where it comes from | State |
|---|---|---|
| The game, from the title to the ending | `game.html` here, built from `../src/` | In. It has been played through headless with no errors, but not yet on a phone |
| Io, Sol, Lunara, Envoi, the wisps, the wraiths, Halcyon, Noctara | `../src/models/` | In, all polished |
| The Bramble Horror, version 2 | `../3d-model-new-character-ideas/bramble-horror/` | In. The game's `../src/models/bramble.js` is the same model. It is a lone wild foe in all four bands |
| The Bramble Colossus | `../3d-model-new-character-ideas/bramble-colossus/` | Coming next: the last band's great wild foe (`../docs/handoff.md`, section 2) |
| The wild meadow's life: shockwaves through the grass, birds put up, a red storm for Wrath | `../3d-model-new-character-ideas/bramble-horror/meadow.js` | Coming: brought to every painted battle (`../docs/handoff.md`, section 3) |
| Chris's next mobs (at least two) | `../3d-model-new-character-ideas/<name>/` once he brings them | Waiting on Chris. Each one comes in the way the next section says |
| The townsfolk's portraits and the story stills | Art requests 06 and 07 in `../docs/art-requests/` | Waiting on the art |
| Every word of the story | `../src/game/script.js`, placeholders for now | Waiting on the lore conversation |
| Chris's three songs | Meant to be in `building-with-assets-`, but they aren't there yet | Last of all, once the whole build is finished |
| The file Chris keeps, which works offline | `tools/build.mjs` | Coming: the build will put three.js and the fonts inside the file |

## How a new mob comes into the game

1. **Its idea folder.** Chris brings the creature. It gets its own folder in `../3d-model-new-character-ideas/`, and what he brought stays untouched in `original/`. It is polished there on its own bench page until he is happy with it.
2. **Its model** is copied, unchanged, into `../src/models/`.
3. **Its rules:** its HP, speed and moves go in `../src/battle/rules.js`, and the balance simulator gets targets for how hard it should be (`../src/battle/sim.js`, checked with `node tools/balance.mjs`).
4. **Its fight on screen:** each move plays the model's own motion, and the blows land at the motion's hit times (`../src/battle/screen.js`).
5. **A demo page** in `../demos/` with the fight on its own, to try on the phone.
6. **Into the game:** where it lives in the wilds and how often it comes (`../src/game/fights.js` and `../src/battle/sim.js`), and one line in `game.html` to load its model.

## The songs

Chris wants his three labeled, compressed songs in the game, but only once the whole build is finished. On October 3 they weren't in `building-with-assets-`: no branch or release there has a sound file. When they're uploaded, Chris says which song is which (the title, a battle, a boss, the ending?), and each one replaces the made-up music where it goes.

## Building and checking

From the repository's top folder:

```sh
npm install --prefix tools                                   # once
node tools/build.mjs --min putting-it-all-together/game.html  # makes dist/game.html, one file
node tools/game-test.mjs                                      # plays it headless; must end with "game test passed"
node tools/balance.mjs                                        # every fight's balance targets; must meet all of them
```

`tools/game-test.mjs` can also play a wild fight to its end: `--steps title,new,wild --band 2 --level 8`.
