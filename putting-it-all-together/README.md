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
| The Bramble Colossus | `../3d-model-new-character-ideas/bramble-colossus/` | In: the last band's great wild foe, about one wild fight in twelve there, on the frozen road. Its fight on its own: `../demos/colossus.html` |
| The wild meadow's life, on every painted battle: mist, fireflies, snow, dust and turf where big blows land, birds and bats put up by roars, leaves shaken down, a red storm for the Colossus's Wrath | `../src/fx/battlefield.js`, after `../3d-model-new-character-ideas/bramble-horror/meadow.js` | In |
| Chris's next mobs (at least two) | `../3d-model-new-character-ideas/<name>/` once he brings them | Waiting on Chris. Each one comes in the way the next section says |
| The townsfolk's portraits and the story stills | Art requests 06 and 07 in `../docs/art-requests/` | Waiting on the art |
| Every word of the story | `../src/game/script.js`, placeholders for now | Waiting on the lore conversation |
| Chris's three songs | Meant to be in `building-with-assets-`, but they aren't there yet | Last of all, once the whole build is finished |
| The file Chris keeps, which works offline | `tools/build.mjs` | Coming: the build will put three.js and the fonts inside the file |

## Pages to open on the phone

| Page | Link | What it is |
|---|---|---|
| The game, put together | https://claude.ai/artifact/9ix7XE5CT9pLrDATugkg2w | The whole game, title to ending, with everything in the table above that says In. Its saves are its own: a save code carries a game from the older link |
| The Bramble Colossus | https://claude.ai/artifact/H2QTXhNnEi7W7Qbs6BXvA2 | Its fight on its own, at a level from 16 to 20 |

Both are private until Chris shares them from the page's Share menu.

## How a new mob comes into the game

1. **Its idea folder.** Chris brings the creature. It gets its own folder in `../3d-model-new-character-ideas/`, and what he brought stays untouched in `original/`. It is polished there on its own bench page until he is happy with it. Its integration card lists its actions and their hit times.
2. **Its model** is copied into `../src/models/`, unchanged (the Colossus's two copies say to keep them alike).
3. **Its rules** go in `../src/battle/rules.js`, in `FOES`: its HP, the time its turn gauge takes, what it is weak to, its experience and shards, and its moves. Each move names the model's action that plays it (`act`), its blows' numbers at level 1 (`hits`), whom it strikes (`target`: one hero, the whole party, whoever hurt it last...) and how often it comes (`weight`).
4. **Its look in battle** goes in `../src/game/fights.js` (`FOE_LOOK`): how tall it is, its shadow and glow, the colors of its blows (`hitColor`, `hitRGB`), and how near it walks up to strike, if it walks (`near`). One line there makes its model (`makeFoe`).
5. **Its fight on screen:** the battle screen plays any move with the model's own action and lands the engine's blows at the action's hit times (`anyMove` in `../src/battle/screen.js`). A mob with something special, like the Colossus's Devour, gets choreography of its own.
6. **How hard it is:** targets in the balance simulator (`../src/battle/sim.js`, checked with `node tools/balance.mjs`), and where it lives in the wilds (`BAND_PACKS` there).
7. **A demo page** in `../demos/` with its fight on its own, to try on the phone (`../demos/colossus.html` is a good one to copy).
8. **Into the game:** one line in `game.html` to load its model.

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
