# Putting It All Together

This folder is where the whole game comes together. Every piece is built and tried on its own first: a model on its bench page, a fight on its demo page, a new creature in `../3d-model-new-character-ideas/`. Then it joins the game here. At the end, the game becomes one file that Chris keeps, and it works with no internet.

Started October 3, 2026. All the work so far is now on one branch, `ccr-9e19f4e2-29pyn6`:

- the whole game, from the title to the ending, from the `second-account-work` branch;
- the new creature ideas (the Bramble Horror, the Bramble Colossus and the wild meadow) from the `claude/sleepy-dirac-t4ftx0` branch.

## What's in the game, and what's coming

| Piece | Where it comes from | State |
|---|---|---|
| The game, from the title to the ending | `game.html` here, built from `../src/` | In. It has been played through headless with no errors, and Chris has played it on his phone |
| Io on foot, painted as in Path Polish: her walk sheet, the cape's ripple, the lean, the breath, kneeling at wells and casting at the Moonwell | `../src/walk/painted-io.js`, from Chris's `follow-me-down-witch-way` (`versions/path-polish/game`) | In, on the ground maps and the world map, at Chris's settings: 52 map px tall, 15% of the screen, pace 1.7. The 3D model stays for the battles. Her own page: `../demos/io-on-foot.html` |
| Where she can walk: every map traced close to the painted ground, with lamp posts, trees and the well's frame drawn over her when she walks behind them | `../src/game/maps.js` (check with `node tools/trace-overlay.mjs` and `node tools/check-maps.mjs`) | In, on all thirteen maps |
| The walking maps, squeezed: Chris's pick "75% light" (1152 px, AVIF), 1.1 MB for all thirteen instead of 3.6 MB | `../art/walk/`, made from `../reference/art/walk/` with `node tools/compress.mjs --avif` | In |
| Io, Sol, Lunara, Envoi, the wisps, the wraiths, Halcyon, Noctara | `../src/models/` | In, all polished |
| The Bramble Horror, version 2 | `../3d-model-new-character-ideas/bramble-horror/` | In. The game's `../src/models/bramble.js` is the same model. It is a lone wild foe in all four bands |
| The Bramble Colossus | `../3d-model-new-character-ideas/bramble-colossus/` | In: the last band's great wild foe, about one wild fight in twelve there, on the frozen road. Its fight on its own: `../demos/colossus.html` |
| The wild meadow's life, on every painted battle: mist, fireflies, snow, dust and turf where big blows land, birds and bats put up by roars, leaves shaken down, a red storm for the Colossus's Wrath | `../src/fx/battlefield.js`, after `../3d-model-new-character-ideas/bramble-horror/meadow.js` | In |
| The story's people walking in: Sol over the bridge, Quill to the skiff, the knight at the crossroads, Ysmera at the slip | `../src/game/script.js` (the stage directions), `../src/game/field.js` | In. The words are still placeholders |
| Walking with sound: each place's own ambience, and a pace that builds to a run | `../src/game/game.js` | In. The footsteps are gone (Chris didn't like them); `io-on-foot.html` has two other ideas to try by ear |
| Saves and settings: three save slots, a save code, word speed, larger text, music and effects volumes | `../src/game/state.js`, `../src/game/game.js` | In |
| Chris's next mobs (at least two, for the wilds) | `../3d-model-new-character-ideas/<name>/` once he brings them | Waiting on Chris. Each one comes in the way the next section says |
| Everyone else on the maps as paper dolls: Sol, Halcyon, Ysmera, Quill and Inkblot, and the fifteen townsfolk | Art request 08 in `../docs/art-requests/`: one walk sheet each, in Io's sheet's style | Waiting on the art. Until then they stay pixel figures |
| The townsfolk's portraits and the story stills | Art requests 06 and 07 in `../docs/art-requests/` | Waiting on the art |
| Every word of the story | `../src/game/script.js`, placeholders for now | Waiting on the lore conversation |
| Chris's three songs: Moonlit Forest Path for the towns, Herbal Decay for the wilds, Herbal Decay Battle for the battles | `../art/music/`, from his Game Music Squeezer page (a 48k copy of the battle song in `../reference/music/`) | Here, saved. They go in last of all, once the whole build is finished |
| The file Chris keeps, which works offline | `tools/build.mjs --offline` | In: three.js and the fonts are inside it, and it plays with the internet blocked. It may grow to 30 MB (Chris); the size section below keeps count |
| The game in Mooncart | Mooncart builds this repository with `node tools/build.mjs`, which makes the game too (`dist/game.html`) | Ready. Mooncart takes the repository's main branch (today `claude/admiring-hawking-p7m87n`), so the game reaches it once this branch is merged there |

## Pages to open on the phone

| Page | Link | What it is |
|---|---|---|
| The game, put together | https://claude.ai/artifact/9ix7XE5CT9pLrDATugkg2w | The whole game, title to ending, with everything in the table above that says In. Its saves are its own: a save code carries a game from the older link |
| The Bramble Colossus | https://claude.ai/artifact/H2QTXhNnEi7W7Qbs6BXvA2 | Its fight on its own, at a level from 16 to 20 |
| Io on Foot | https://claude.ai/artifact/G1B5cMkYzBq4RiausDAAQj | Io walking the game's maps, with sliders for her height, the camera and her pace, the walking areas shown, her poses, and two footstep ideas to try |
| Walking Map Resolution | https://claude.ai/artifact/7F4pu4v3BQiKAZAtVJkC1i | The walking maps' compression choices, in the game at Chris's settings (he chose "75% light") |

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

Chris sent his three songs on October 3, already compressed for the game, and they are saved in `../art/music/`:

| Song | Where it plays | File |
|---|---|---|
| Moonlit Forest Path | the towns | `towns-moonlit-forest-path.webm` (24k stereo, 3:15, 699 KB) |
| Herbal Decay | the wilds | `wilds-herbal-decay.webm` (24k stereo, 3:52, 788 KB) |
| Herbal Decay Battle | the battles | `battle-herbal-decay.webm` (32k stereo, 3:20, 824 KB) |

A 48k copy of the battle song (1.2 MB), the size Chris once said it shouldn't go below, is in `../reference/music/`, in case the 32k one sounds thin. As Chris asked, they go in last, once the whole build is finished. The made-up music keeps the title, the bosses and the ending.

## Size

The file Chris keeps may be up to 30 MB. Today it is 15.0 MB, with the walking maps squeezed to his "75% light". The songs, the paper dolls, the portraits and the stills would bring it to about 29 MB (`../docs/handoff.md`, size and delivery, has the sums). The battle paintings and the world map could be squeezed the same way if more room is needed.

## Building and checking

From the repository's top folder:

```sh
npm install --prefix tools                                   # once
node tools/build.mjs --min putting-it-all-together/game.html  # makes dist/game.html, one file
node tools/game-test.mjs                                      # plays it headless; must end with "game test passed"
node tools/balance.mjs                                        # every fight's balance targets; must meet all of them
```

Once the game is over a published page's 16 MB (with the songs and the art), it is published as a small page with its pictures as files beside it. Today it fits on one page (14.3 MB), so `--split` waits:

```sh
node tools/build.mjs --min --split putting-it-all-together/game.html   # dist/game-split/: the page, art/, files.json
node tools/game-test.mjs dist/game-split/game.html                     # plays the split copy
```

Publish `dist/game-split/game.artifact.html` with every file in `files.json` beside it, at the same paths.

The file Chris keeps, with three.js and the fonts inside it:

```sh
node tools/build.mjs --min --offline putting-it-all-together/game.html
node tools/game-test.mjs --offline   # plays it with the internet blocked; anything it reaches for fails the test
```

Both builds write `dist/game.html`. The published page is built without `--offline`, to leave room under the 16 MB page limit. `node tools/build.mjs` with nothing after it builds every demo page and the game; that is what Mooncart runs.

`tools/game-test.mjs` can also play a wild fight to its end: `--steps title,new,wild --band 2 --level 8`.

The walking maps: `node tools/trace-overlay.mjs wickhollow out.png 1600 --grid 25 --crop 600,200,400,400` draws a map's walk areas (green), blocks (red) and fronts (violet) over the painting, close up; `node tools/check-maps.mjs` checks that every exit, person and spot can be reached.

A paper-doll sheet from art request 08: `node tools/cut-sheet.mjs reference/art/walkers/<id>-walk.png <id>` cuts it into the game's walker (`art/walkers/<id>.webp`).
