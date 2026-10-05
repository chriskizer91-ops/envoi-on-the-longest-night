# Putting It All Together

A new session starts with `../docs/next-session.md`, where the work stands. This folder is where the whole game comes together. Every piece is built and tried on its own first: a model on its bench page, a fight on its demo page, a new creature in `../3d-model-new-character-ideas/`. Then it joins the game here. At the end, the game becomes one file that Chris keeps, and it works with no internet.

Started October 3, 2026. All the work so far is now on one branch, `ccr-9e19f4e2-29pyn6`:

- the whole game, from the title to the ending, from the `second-account-work` branch;
- the new creature ideas (the Bramble Horror, the Bramble Colossus and the wild meadow) from the `claude/sleepy-dirac-t4ftx0` branch.

## What's in the game, and what's coming

| Piece | Where it comes from | State |
|---|---|---|
| The game, from the title to the ending | `game.html` here, built from `../src/` | In. It has been played through headless with no errors, and Chris has played it on his phone |
| Io on foot, painted as in Path Polish: her walk sheet, the cape's ripple, the lean, the breath, kneeling at wells and casting at the Moonwell | `../src/walk/painted-io.js`, from Chris's `follow-me-down-witch-way` (`versions/path-polish/game`) | In, on every ground map (the world map is only flown since October 5), at Chris's settings: 52 map px tall, 15% of the screen, pace 1.7. The 3D model stays for the battles. Her own page: `../demos/io-on-foot.html` |
| Where she can walk: every map traced close to the painted ground, with lamp posts, trees and the well's frame drawn over her when she walks behind them | `../src/game/maps.js` (check with `node tools/trace-overlay.mjs` and `node tools/check-maps.mjs`) | In, on all twenty-one maps (the eight wilderness scenes since October 5) |
| The walking maps, at full size (1536 px, AVIF): the towns and gates at quality 45 (Chris found the town too compressed at "75% light"), the three wild maps at quality 20 (his "100% extra light" for wilderness); 2.66 MB for the thirteen, and the eight wilderness scenes at quality 20 too (1.17 MB): 3.83 MB for all twenty-one | `../art/walk/`, made from `../reference/art/walk/` (the scenes from `../reference/art/walk/wilds/`) with `node tools/compress.mjs --avif --q 45` (wilds `--q 20`) | In (pass three; the scenes October 5) |
| Io, Sol, Lunara, Envoi, the wisps, the wraiths, Halcyon, Noctara | `../src/models/` | In, all polished |
| The Bramble Horror, version 2 | `../3d-model-new-character-ideas/bramble-horror/` | In. The game's `../src/models/bramble.js` is the same model. A lone wild foe in band 3 only, levels 11 to 15, in all four forms (Chris, pass three) |
| The Bramble Colossus | `../3d-model-new-character-ideas/bramble-colossus/` | In: the last band's great wild foe, about one wild fight in twelve there, on the frozen road. Its fight on its own: `../demos/colossus.html` |
| The wild meadow's life, on every painted battle: mist, fireflies, snow, dust and turf where big blows land, birds and bats put up by roars, leaves shaken down, a red storm for the Colossus's Wrath | `../src/fx/battlefield.js`, after `../3d-model-new-character-ideas/bramble-horror/meadow.js` | In |
| The story's people walking in: Sol over the bridge, Quill to the skiff, the knight at the crossroads, Ysmera at the slip | `../src/game/script.js` (the stage directions), `../src/game/field.js` | In. The words are still placeholders |
| Walking with sound: each place's own ambience, and a pace that builds to a run | `../src/game/game.js` | In. The footsteps are gone (Chris didn't like them); `io-on-foot.html` has two other ideas to try by ear |
| Walking by hand: hold anywhere to steer her, tap or click to walk there in straight lines, a one-thumb pad, slipping round corners | `../src/game/field.js` | In (pass three), after Witch Way's pad and walker. Since October 4 a tap follows narrow ways too, Chris's secret paths included |
| Chapters: start at the beginning, or just before gate 5, 10 or 15 in the town on its doorstep, or at the foot of Misthollow before the finale, with the party as the story leaves it there | `../src/game/game.js` (`CHAPTERS`); a demo page per chapter from `node tools/make-demos.mjs` | In (pass three). In the finished game it unlocks once the game is beaten (Chris, October 4); until then it's on the title from the start |
| The little golden arrow: where the story wants Io next, over the goal when it's in view, else beside her pointing the way, on the walking maps (through the wilderness scenes too), and ringed on the mini-map | `../src/game/goal-arrow.js`; the next step and the way there in `../src/game/game.js` (`nextStep`, `goalOn`) | In (pass three) |
| Saves and settings: three save slots, a save code, word speed, larger text, and the music, effects and surroundings volumes | `../src/game/state.js`, `../src/game/game.js` | In (the surroundings volume since October 4) |
| The twenty keepsakes Chris locked, with his pictures: fourteen lying on the maps (the two hidden ones among them), four gifts from Nettie, Marta, Ysmera and Ede, and two from the first Bramble Colossus. Each goes on as it's found and shows its card; the menu's Items page shows what has been found (never how many are left) and hands a shared one over; each hero's keepsakes count in her fights, and some after them | `../envoi-final-draft/items/items.js` (the list and the places), `../src/game/keepsakes.js` (the save, the totals, the card and the Items page), `../art/keepsakes/` (the tiny pictures, from `../reference/art/keepsakes/`), `../src/game/script.js` (the words) | In (October 4, late evening). The two hidden ones of the morning are two of them, cut to a quarter. The balance never counts on them. The words wait for the lore conversation. Demo page: the keepsakes, below |
| The two cutscenes: the Colossus, first met, before the first Bramble Colossus; the finale's opening, before the finale's first try | `../envoi-final-draft/cutscenes/`, each made by its own session; loaded by `game.html`, played by `../src/game/game.js` | In (October 4, late evening, when Chris said they were done). Each plays once a game, and the fight starts with its foes standing where the cutscene left them. Skip or Esc skips it; Settings can play it again |
| Herbs: up to 99 of each in the bag, three of each to start, each used once a fight; a herb shop in every town (Wickhollow, the jetty, Bogmire, Dawnroost, the shipyard, Misthollow) | `../src/battle/rules.js` (`CARRY`, `HERBS`), `../src/game/maps.js` (the shopkeepers) | In (99 since October 4, late evening, at Chris's word) |
| Chris's next mobs: the wild growing more upset the closer the party comes to Noctara | `../3d-model-new-character-ideas/<name>/` once he brings them | Not yet (Chris). The Gloamwing and the Emberback stay out of the game. Each new one comes in the way the next section says |
| Everyone else on the maps as paper dolls: Sol, Halcyon, Ysmera, Quill and Inkblot, and the fifteen townsfolk | Chris's art request 08 sheets, in `../reference/art/walkers/`, cut into `../art/walkers/` | In (pass three). The four who walk in scenes keep their walk; the townsfolk stand in one to three poses. 0.6 MB for all nineteen |
| The new battles: every fight but the first in its arena, 3D ground in front and Chris's painting of the place far off behind, as Colossus in the Meadow is | `../src/fx/arena.js` and `../src/stage/arena-*.js`, after `../living-battlefields/`; his combat backgrounds (art request 11) at his Strong squeeze in `../art/arena/`; the battle screen's arena mode in `../src/battle/screen.js` and each fight's place in `../src/game/fights.js` (`ARENA_OF`, `ARENA_AT`) | In the game's files since October 5, **switched off** (`const ARENA = false` in `fights.js`, and `game.html` doesn't load the arena's scripts), so the game fights on the flat paintings until Chris has played the demo (https://claude.ai/artifact/FHpBiFsEhvUgvmu5hJaCea) and said yes. How to switch it on: `../envoi-final-draft/arena/README.md`, and `../handoff/tasks.md`, T01 part B |
| The eight wilderness scenes at night (art request 12): a camp in each of bands 2 to 4 where the Magpie lands (a soft glow on its landing ground, as at the docks), and the roads from them to Dawnroost, the northern crossroads and the frozen pass, with random fights on the five walks and none in the camps; the Ember Line's three nodes on their road; the roads that ran off the cottage and the crossroads turn Io back with a line. The world map is only flown (its nine walking tiles are gone; the flight keeps its far view and clouds), and saves made on it load at the nearest place | Chris's pictures (`../reference/art/walk/wilds/`), squeezed into `../art/walk/` and traced in `../src/game/maps.js`; the landings, the old saves and the Magpie kept within reach on foot in `../src/game/game.js` | In (October 5, at Chris's go-ahead, his four calls left to the defaults: `../docs/design-decisions.md`). Walked first on their demo page, https://claude.ai/artifact/2WSu7uWvtDUmF5JwxV5xwC (`../envoi-final-draft/wilds/`) |
| The townsfolk's portraits and the story stills | Art requests 06 and 07 in `../docs/art-requests/` | Waiting on the art. Until the portraits come, the dialogue box shows each paper doll's head and shoulders (`../art/portraits/folk/`, cut by `node tools/cut-sheet.mjs ... --portrait art/portraits/folk`) |
| Every word of the story | `../src/game/script.js`, placeholders for now | Waiting on the lore conversation |
| Chris's songs: Moonlit Forest Path for the towns, Herbal Decay for the wilds (his Herbal Decay Battle is out: the fights keep their original battle music, at his word) | `../art/music/`, from his Game Music Squeezer page (a 48k copy of the battle song in `../reference/music/`), played by `../src/game/songs.js` | In (October 4, when Chris asked for them). Inside the file he keeps; beside the published pages as files |
| The file Chris keeps, which works offline | `tools/build.mjs --offline` | In: three.js and the fonts are inside it, and it plays with the internet blocked. It may grow to 30 MB (Chris); the size section below keeps count |
| The game in Mooncart | Mooncart builds this repository with `node tools/build.mjs`, which makes the game too (`dist/game.html`) | Ready. Mooncart takes the repository's main branch (today `claude/admiring-hawking-p7m87n`), so the game reaches it once this branch is merged there |

## Pages to open on the phone

| Page | Link | What it is |
|---|---|---|
| The game, put together | https://claude.ai/artifact/BgSiyXBu53iW7DJVF1seV8 | The whole game, title to ending, with everything in the table above that says In (since October 4, late evening: the cutscenes, the 99-herb bag and the twenty keepsakes). Its saves are its own: a save code (Menu, Saves) carries a game from the older link, https://claude.ai/artifact/9ix7XE5CT9pLrDATugkg2w, which this account can't update |
| The keepsakes | https://claude.ai/artifact/AAtAnWcqszRj4qhVCfgPp5 | All twenty with Chris's pictures, each card as the game shows it, the Items page, and what they add up to |
| The Bramble Colossus | https://claude.ai/artifact/H2QTXhNnEi7W7Qbs6BXvA2 | Its fight on its own, at a level from 16 to 20 |
| Io on Foot | https://claude.ai/artifact/G1B5cMkYzBq4RiausDAAQj | Io walking the game's maps, with sliders for her height, the camera and her pace, the walking areas shown, her poses, and two footstep ideas to try |
| Walking Map Resolution | https://claude.ai/artifact/7F4pu4v3BQiKAZAtVJkC1i | The walking maps' compression choices, in the game at Chris's settings (he chose "75% light") |
| Wilderness at Night | https://claude.ai/artifact/2WSu7uWvtDUmF5JwxV5xwC | The eight night scenes on their own: Io walks each band's road from its camp, with a note where each fight would start (`../envoi-final-draft/wilds/`) |

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

A 48k copy of the battle song (1.2 MB), the size Chris once said it shouldn't go below, is in `../reference/music/`, in case the 32k one sounds thin.

**In the game since October 4** (Chris: "The three compressed songs are needed to go in"), by `../src/game/songs.js`:

- the towns' song in Wickhollow, the jetty, Dawnroost and the shipyard; the wilds' in the Thornwood, the eight wilderness scenes, the crossroads and the frozen pass (over the world map too, until it was only flown);
- the fights keep their original battle music (Chris: "replace the battle mp3 with the original battle music, the towns and overworld MP3s can still be used"), so Herbal Decay Battle stays here, out of the game;
- the made-up music keeps the title and Io's cottage, the marsh, the ruins, the flight and the ending;
- each as loud as the made-up music it replaces, under the Music volume; a song carries on where it left off;
- the build puts them inside the page (`dist/game.html`, the file Chris keeps, Mooncart's copy), but leaves them beside the copy to publish (`dist/game.artifact.html`, and the demos made from it), with the keepsakes' twenty pictures, listed in `dist/game.beside.json` (`game.html` names the two folders: `<meta name="beside">`), so a published page stays under 16 MB. Publish those 22 files with the page, at the same paths.

## Size

The file Chris keeps may be up to 30 MB. Today it is 16.8 MB (17,660,152 bytes, October 5, with the eight wilderness scenes in and the world map's nine walking tiles out), with the songs and the pictures inside; the published game is 13.4 MB (14,051,253 bytes), under the 16 MB a published page may be, with the songs and the keepsakes' pictures (2.0 MB) as files beside it. The new battles add about 0.4 MB when they're switched on (T01 part B); the portraits and stills (2 to 3 MB) will need the split build (below) or their folders beside the page. `../envoi-game-pass-3/README.md` has the measured parts.

## Building and checking

From the repository's top folder:

```sh
npm install --prefix tools                                   # once
node tools/build.mjs --min putting-it-all-together/game.html  # makes dist/game.html, one file
node tools/game-test.mjs                                      # plays it headless; must end with "game test passed"
node tools/balance.mjs                                        # every fight's balance targets; must meet all of them
```

The published game keeps its songs beside it already (above). If the art pushes the page itself past 16 MB, it is published as a small page with its pictures as files beside it too. Today the page is 13.4 MB (October 5), so `--split` still waits:

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

`tools/game-test.mjs` can also play a wild fight to its end: `--steps title,new,wild --band 2 --level 8`; and walk each band's row of wilderness scenes by taps, from its camp to its town: `--steps title,new,wilds` (`--band 3` for one). `node tools/walks.mjs` measures how many fights each walk meets, against the journey simulator's (`../src/game/story.js`).

The walking maps: `node tools/trace-overlay.mjs wickhollow out.png 1600 --grid 25 --crop 600,200,400,400` draws a map's walk areas (green), blocks (red) and fronts (violet) over the painting, close up; `node tools/check-maps.mjs` checks that every exit, person and spot can be reached, and that the Magpie's landings, the chapters' starts and rests and the camps' landing grounds stand on ground she can reach.

A paper-doll sheet from art request 08: `node tools/cut-sheet.mjs reference/art/walkers/<id>-walk.png <id> --avif --q 45 --portrait art/portraits/folk` cuts it into the game's walker (`art/walkers/<id>.avif`) and its portrait for the dialogue box; then `node tools/walkers-index.mjs` lists both.
