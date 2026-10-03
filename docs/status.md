# Where Things Stand

A handoff for the next session. Updated October 3, 2026, after the twenty-second round: Chris asked for the rest of the game to be built with every decision made here. Step 17 (the finale) is built and published, phase 3 (the story's fights in order) is done, and phase 4 (walking and flying) is under way.

**Phase 1, the models, is done** (`plan.md`): every model is polished, and the cast page runs at 60 fps with five models on Chris's Pixel 7a. **Phase 2, the battles, has its groundwork and its first battle:** the rules tables, a battle engine without graphics, a balance simulator that meets all 25 targets (Chris approved the new rules), and step 12, the first fight. Steps 13 to 17, the party, the great wraith, Dawnroost, Halcyon's ambush and the finale, are built too. **Phase 3 is done:** the whole journey plays in order in the simulator (`src/game/story.js`, `src/battle/chain.js`). **Phase 4 is under way:** every ground-level map is traced, and the field engine, the world map, the townsfolk, the dialogue box and the game's fights are written.

## Putting it all together (October 3, later)

Chris asked for everything to be brought together in a new folder, `../putting-it-all-together/`. It holds the game's page (moved from `demos/game.html`), and its README lists every piece of the game, where it comes from, and what is still to come: Chris's next mobs, the art, the words, and his three songs, which go in last.

- **Branch:** this work is on `ccr-9e19f4e2-29pyn6`, which holds everything: the game from `second-account-work` and the creature ideas from `claude/sleepy-dirac-t4ftx0`, merged.
- **Built since (the handoff's sections 2, 3, 9 and the delivery notes):**
  - **The Bramble Colossus** in the game: the last band's great wild foe, about one wild fight in twelve there (`design-decisions.md`, "putting it all together"). Its fight on its own is `demos/colossus.html`.
  - **Living battlefields** on every painted battle (`src/fx/battlefield.js`): each painting's own air (mist, fireflies, snow, sparks), dust and turf where big blows land, birds and bats put up by roars, leaves shaken down, and a red storm for the Colossus's Wrath.
  - **New mobs play from their models:** a foe with no choreography of its own plays each move with its model's action and hit times (`anyMove` in `src/battle/screen.js`). The steps for a new mob are in the folder's README.
  - **Saves and settings:** three save slots, a save code to copy to another device or copy of the game, word speed, larger text, and separate music and effects volumes.
  - **The file Chris keeps:** `node tools/build.mjs --min --offline putting-it-all-together/game.html` puts three.js and the two fonts inside the page (15.0 MB), so it works with no internet.
- **After Chris's first play (October 3, later still):**
  - **No footsteps.**
  - **Io walks as Path Polish paints her:** 52 map px tall, 15% of the screen, pace 1.7 (Chris's settings).
  - **All thirteen walking maps retraced** close to the painted ground, with walking behind lamp posts and trees.
  - **Art request 08:** the paper dolls for everyone else.
  - **Chris's songs saved** for the end.
  - **The walking maps squeezed** to his pick, "75% light" (AVIF, 1.1 MB for all thirteen, from 3.6 MB). The game file dropped to 15.0 MB offline.
- **Published (October 3, from this session):**
  - the game put together, https://claude.ai/artifact/9ix7XE5CT9pLrDATugkg2w;
  - the Bramble Colossus on its own, https://claude.ai/artifact/H2QTXhNnEi7W7Qbs6BXvA2;
  - Io on Foot, https://claude.ai/artifact/G1B5cMkYzBq4RiausDAAQj: her walk on the game's maps, with sliders and the footstep ideas;
  - Walking Map Resolution, https://claude.ai/artifact/7F4pu4v3BQiKAZAtVJkC1i: the maps' compression choices, after Chris's Magpie Map Resolution page.
- **Testing:** `node tools/game-test.mjs` plays the built game headless: the title, a new game, walking on a ground map and on the world map, the menu, the save slots and save code, the save, and with `--steps` the staged scenes, a wild fight or the Colossus to its end.

## Working from the second account

- **Branch:** commit only to `second-account-work`. Never commit to `main` or any other branch, and never to the sibling repos.
- **Publishing:** pages are published from the second account. They're private to it until Chris shares them. The first account's pages below stay as they are; this account can't update them, so a republished page gets a new link here.

## Published from the second account

| Page | Link | State |
|---|---|---|
| **The game** | https://claude.ai/artifact/UDTnemDCiz2EKcoGqbCtm8 | October 3: the whole game in one page, title to ending: Io's cottage and Wickhollow, the first fight, Sol and the Magpie, the Thornwood, Bogmire and the great wraith, the world map in four bands under cold mist, flying the Magpie, Dawnroost and Envoi, Halcyon, the shipyard, Misthollow and the finale. Shops, inns, camps, wells with letters, the menu and the save. Every part played headless with no errors. The words are placeholders; the townsfolk speak with pixel portraits until their paintings come |
| The finale | https://claude.ai/artifact/UWft3rdQxCrMV3qnb1fMST | Step 17 (October 3): Io and Sol at level 17 to 20 against Noctara and Halcyon at the dead Moonwell. Crown Shards, Void Sphere, Frost Dust and Blackout; the cold deepens 11.5% a turn and shows by Noctara's name and at the screen's edges; Halcyon kneels when she falls; the ending (lore answer 10) with the stars coming back |
| Bramble Horror | https://claude.ai/artifact/DzNK9CukB2rMsbcEhTSGGV | October 3: Chris's Bramble Horror as a lone wild foe at the Thornwood bridge, any of its four forms at any level from 1 to 20 (at the party's level): Lure then Grab, Consume, Thorn Sweep, Strike, Undergrowth; fire makes it recoil and breaks a lure, a heavy blade severs a cane |
| Halcyon's ambush | https://claude.ai/artifact/9DkTvwCiXQcS1vJa2WSsUA | Step 16 (October 3): Io and Sol at level 15 to 20 against Halcyon at 20 at the northern crossroads, the gate out of band 3. She is the Gloam Knight until Sol knows her stance; Kestrel, Warden's Vow and its counter, Black Noon charged a turn ahead; her retreat at 20%, or the party falls and she spares them; either way Sol learns Kestrel Stoop |
| Dawnroost | https://claude.ai/artifact/JuoPFYrjc9rGZKpuBGF3Jn | Step 15 (October 3): Io and Sol at level 8 to 13 against three level 12 wraiths at Dawnroost's living node, the gate out of band 2; win, and Envoi is made at the node |
| The great wraith | https://claude.ai/artifact/Kk1fEqKFDzGbEcCbkYqZt5 | Step 14 (October 3): Io and Sol at level 3 to 8 against the great wraith on Bogmire's dark boardwalk, the gate out of band 1: Stolen Fire, Swallow Lamplight, Eclipse; beaten, it lets the town's lamplight go and the windows glow again |
| The party | https://claude.ai/artifact/5awxTd1H3htoFJbjinQwz1 | Step 13 (October 2): Io and Sol against nine packs of wisps, frost wisps and wraiths at any level from 1 to 20; Sol's Heat, Sword Arts and Dawnbreaker, Io's new Moonlore (Harvest Moon from level 6), Lunara across the pack, Envoi from level 11, one of each herb, a target for every blow, and a frame-rate button |
| The first fight | https://claude.ai/artifact/MkgkJSQVgGp3JEivcmN2KN | Step 12 (October 2): Io alone against the Night square wraith at level 1, played by the battle engine with the finished models; Lunara's Embrace and Silver Requiem; experience, shards and the level-up at the end. You can lose |
| Battle balance | https://claude.ai/artifact/DruqrA8zAzZNpe4ahRXFwe | Updated October 3: all 52 balance targets with the simulator's results (the Bramble Horror's among them), any fight played turn by turn with its gauges, the level curve, experience and shards, and the rules |
| The cast | https://claude.ai/artifact/Qk8apijsA3ZjVoK88XF4bJ | Step 11 (October 2): every model at true scale; pick an encounter, who acts and their target. Pixel 7a: 60 fps with five models, 39 with eight. Builds models when first needed. October 3: Harvest Moon in place of Moth Veil |
| Walking test | https://claude.ai/artifact/3YJkf77SD43iWJgo6pXmcf | The pixel Io (28 × 42) on all 13 ground-level maps at 768 wide with sharp pixels, 0.7× zoom, one walking speed and a mini-map; the talking portraits in a dialogue box. No walls yet |
| Noctara | https://claude.ai/artifact/JWFwFUZTDum2CZjbGXotir | Rebuilt October 2 with the finished Io, Sol and Halcyon |
| Lunara | https://claude.ai/artifact/Y1hTureSoXGBnTer4tJNSX | Polished October 2: heavier skirt chains and pointed ears |
| Io, the Witch | https://claude.ai/artifact/6vRCkyYzZjn5Fc77GYebyE | Polished October 2: her new spells sized for the battle camera. October 3: Harvest Moon in place of Moth Veil |
| The wisp | https://claude.ai/artifact/GG9LKbSjeohk7UA2UJ7Kcp | Polished October 2: a darker, fuller tail and a deeper, torn hollow; the frost variant checked in every action |
| Shadow Wraith and great wraith | https://claude.ai/artifact/VzY24F1cx38cVhs87wfvKU | Polished October 2: the scythe's ornate head and the long torn hem from its sheet; the Great wraith toggle switches in place |
| Sol | https://claude.ai/artifact/9Sbu4aSYqmmiKytpy3y8as | Polished October 2: wispier hair, a rounder face, the cape over her shoulders, Ember Rush aimed at the wraith |
| Envoi | https://claude.ai/artifact/4XL684grjKstJCGud3MnNm | Polished October 2: longer pointed lanterns, a strike that rings the wraith, a dark splash on the ward, its coils clear of Io, and a wide shot whenever it is summoned |
| Halcyon | https://claude.ai/artifact/WsZX1VshXXxjyfB4cKF1UE | Polished October 2: Light-Drinker's streams and Black Noon's swirls as ribbons, and a retreat that sinks into the dark |
| Art requests | https://claude.ai/artifact/MNozyJ4DQys2syLfyyv44c | Retired: Chris found the page clunky. Image requests now go to him as Markdown files in the chat (`SendUserFile`). |

## Published from the first account

| Page | Link | State |
|---|---|---|
| Noctara | https://claude.ai/artifact/4FzTFkD5JRPhci57H2ybvz | Out of date: built with working copies of the supporting actors. Use the second account's link. |
| Halcyon | https://claude.ai/artifact/7zPEx3g6VC4SFfdZ8zdHj8 | Done: refined against her new sheets on October 2. |
| Lunara | https://claude.ai/artifact/XpsLozXGFgPCwLG5s5iUce | Done |
| Io, the Witch | https://claude.ai/artifact/1mF6YFp3xg1KhGs5tZNYky | Done: technical pass, plus Waxing Light, Moonsteel and Moth Veil |
| Sol | https://claude.ai/artifact/FpVoGvTKCwv8GWiuouJu7N | Done, with Kestrel Stoop |
| Envoi | https://claude.ai/artifact/6W5ZvTmsusQwAEBEkP95hx | Done, with its summon, ward and strike |
| Shadow Wraith and great wraith | https://claude.ai/artifact/HEn78AJYsTpGRs9B4zZ5SW | Done; the Great wraith toggle reloads the page |
| The wisp | https://claude.ai/artifact/TDbtEVzrdJFQ2cXevWFiVF | Done, with its polish round |

## New character ideas

Added October 3, 2026: `../3d-model-new-character-ideas/` holds creatures Chris brings as ideas, polished one folder each and kept apart from the cast until he places them. Their benches share two painted places: the wild glade, and the wild meadow, whose day, night and weather turn by themselves and whose grass answers a creature's blows.

| Idea | Link | State |
|---|---|---|
| Bramble Horror | https://claude.ai/artifact/ASy7Y7hL3EuAHZbFDwihWv | Version 2: thorns, veins and a feeding hollow, whip-sprung canes that coil round the prey, Undergrowth and Scorch, a bench with Io as its prey in the wild glade or the wild meadow. Where it lives is asked in `questions/open.md`. |
| Bramble Colossus | https://claude.ai/artifact/HbXsmA8xNLUnLMQ6px7h6Q | Version 1: the Bramble Horror grown into a 7.5 m boss, with a braided spire, a bud that opens on its glowing heart, ten moves of its own and a Wrath phase at half HP; a bench where it fights Io and Sol, or fights them by itself, in the wild meadow or the wild glade. Its name and place are asked in `questions/open.md`. |

## The models

| Model | State | What's left |
|---|---|---|
| Noctara | Done | — |
| Lunara | Done, polished | — (101.6k triangles, inside the 120k ceiling) |
| Io, the Witch | Done, polished; her new spells in `src/fx/io-spells.js` are sized for the battle camera | Moth Veil's 35% capacity and two turns, and Moonsteel's Moon-element hit, belong to the battle step |
| Wisp | Done, polished twice | — |
| Shadow Wraith and great wraith | Done, polished | The great wraith's numbers belong to the battle step |
| Sol | Done, polished | Her code stays 140 KB: it has no unused parts, so only minifying would shrink it, which the final game's build can do |
| Envoi | Done, polished | — |
| Halcyon | Done, polished | Her face stays as built (Chris, October 2) |
| The cast (step 11) | First version published | `demos/cast.html`: the bench's roster mode. Each actor plays with its own stage; the party's and the summons' stages strike whatever target is picked |

"What's left" comes from each agent's last report. Every model step (2 to 10) is done; step 11, the cast, is next.

## Rules that bit us

- **Never put a `//` comment in the middle of a config line.** It cuts off the rest of the line. Envoi's page once lost its target, height and shadow that way, so its strike wrapped Io instead of the wraith.
- **A bench page must load only original models for its supporting actors** (`makeWitchOriginal`, `makeSolOriginal`, `makeWraithOriginal`...). Lunara's page once bundled a half-edited Sol and crashed on Chris's phone.
- **Commit an agent's files only after its report, and only its own files,** by explicit path. Several agents work in the same folder at once.
- **The machine has 4 cores.** With six agents rendering, headless checks slow down a lot. Give checks long timeouts and run renders one at a time.

## Bench and tool changes (done October 2)

Every change the agents asked for is in, and all eight pages were rebuilt and checked:

- `bench.css` has the `.dmg.miss` style; the wisp's stage no longer injects it.
- `bench.js`:
  - `subject.beforeKind` gives the Before model its own actor kind;
  - `offset: [x, z]` in meters nudges any actor from its painting pixel;
  - `dashAim: true` sends a dash straight along the line to the actor's target;
  - every actor gets a real walk phase (meters walked × 4.2), so Io's stage no longer wraps her models;
  - the painting is drawn into a stage-sized canvas, which removed the seam line in close view and the huge scaled image layer.
- `tools/check.mjs` creates its cache folder on a fresh copy, waits `--wait` ms (350 by default) before each shot, and takes `action@1.2s` for models with no `ACTIONS`.
- `tools/turnaround`: `--q anchor=<name>` and `--q fov=<deg>` for close-ups of any anchor.
- The Night square's well: its lantern cutout is traced to the painted lantern instead of a box, and its bucket chain has a cutout.

## Since the seventeenth round

- **Harvest Moon replaces Moth Veil** at the Bogmire refit: 28 MP for 70 Heat on Sol. Its effect is `harvestMoon` in `src/fx/io-spells.js`; Io's bench page and the cast page show it.
- **One of each herb:** Moonpetal heals 20% more than Lunar Mend; Ember-star Lily makes every blow 10% harder for the rest of the fight.
- **The finale's cold** deepens 11.5% a turn.
- **Halcyon on the battle screen** (`HALCYON_MOVES` in `screen.js`):
  - her own moves, with Warden's Vow's counter after a hero's melee;
  - her charge pose for Black Noon, and the turn she loses after Kestrel;
  - a foe's name can wait for the party to know her (`alias`, with `knowLines`);
  - endings: `retreatLines` for a foe who leaves at a share of her HP, and `spared` with `sparedLines` for a lost fight that goes on with the story;
  - `stoopLines` for learning Kestrel Stoop, and end card titles and texts per outcome (`endTitles`, `endTexts`).
- **The Bramble Horror** (Chris's new wild foe, `BRAMBLE_MOVES` in `screen.js`):
  - one wild fight in five, alone, in four forms;
  - its Lure stops the lured hero's gauge, and its Grab carries her in its canes (`heldBy`, lifted by the model's `holding`);
  - flame makes it recoil and breaks a lure (`scorch`), and a heavy blade severs a cane (`cane`);
  - it wilts as its HP falls;
  - the page's `foeLook.halfW` frames a sprawling foe by its width;
  - its numbers and targets: `design-decisions.md`, twenty-first round.

## The battle groundwork

- `src/battle/rules.js`: every hero, summon, foe, herb and status as data at level 1, growing ×1.2 a level; numbers marked "proposed" wait for Chris (`questions/open.md`).
- `src/battle/engine.js`: the battle without graphics. Seeded and in wait mode, like the Night square demo. `turn()` runs the gauges to the next turn; `choose(move, target)` plays a hero's command; each returns a log of every blow, heal and status for the battle screen to play back.
- `src/battle/sim.js`: the fights (the first fight, the wild packs of each band, the four gates, the finale), the three play styles, and the targets.
- `node tools/balance.mjs --n 1000 --report docs/balance-report.md --results src/battle/balance-results.js` checks every target after any change (about 10 seconds) and refreshes the report and the balance page's results.

## The battle screen

- `src/battle/screen.js` with `screen.css` and `sound.js` (the Night square demo's synthesized music and sound, unchanged). The page holds the markup and a config: the fight's setup, the models to build, and the end texts.
- Each turn, the engine resolves the action and returns its log. The screen splits the log at each move, plays that move's choreography with the model's own hit and cue times, and shows the engine's numbers as the blows land. What the player has been shown (HP, MP, Trance) catches up blow by blow, then matches the engine.
- One screen plays any party (Io alone, or Io and Sol) against up to three foes. The page's config names the heroes and their places, the foe slots, how each foe looks, and `fight(level, pack)`, which returns the engine's setup. A start card can offer a level and a pack (`levels`, `packs`).
- **The frame rate:** a header button cycles through the screen's own rate and caps of 60, 45 and 30, paced to the screen's refreshes and kept in the browser (`envoi.fps`). The end card shows the fight's average and slowest second. Headless Chrome renders only a few frames a second here, so the pacing was checked with simulated 60, 90 and 120 Hz screens.
- **After the fight:** `winLights` sends the stolen lamplight home to the scene's windows (Bogmire); `winEnvoi` with `envoiLines` plays the making of Envoi at the scene's `envoiAt` (Dawnroost).
- **Scenes:** a page names its painting (`scene: 'bogmire-boardwalk'`; the Night square by default). A scene file in `src/stage/` gives the matched camera, the lamps and cutouts, where Lunara rises (`summon`, `summonFrom`) and the windows that light again at the end (`windows`, with `winLights` on the page). A page can open with a line of story before and after the foes rise (`introMsg`, `introAfter`). A giant foe's look sets how far the heroes stop short (`reach`), how close it comes to strike (`near`) and how big its effects are (`fxScale`).
- **Summons:** Lunara rises from the scene's summon spot (the Moonwell in the Night square); Envoi (when the page passes `makeEnvoi`) folds in between the party and the foes, takes the next blow on its Folding Ward (foes aim at the ward), and strikes on Io's next turn.
- Every command with more than one target opens a target list (foes with their HP left, allies with their HP); an arrow marks the one pointed at, and the most hurt is pointed at first.
- Test hooks on `window.__battle`: `begin()`, `skip()`, `pick(id)`, `auto = 'expert'` (a play style from `sim.js` chooses the commands), `turbo`, `setFight(level, pack)`, `weaken(n, who)`, `trace`, `pace` (the frame-rate cap, the screen's measured rate and the fight's frame count). At high `turbo` the models' animations lag the clock (they cap their own step), so a sped-up test takes longer per action than its clock suggests.

## Next steps

Everything Claude would add or improve, and what is waiting on Chris, is in `handoff.md`.


1. **The game is joined in one page** (`putting-it-all-together/game.html`, `src/game/game.js`): title, prologue, the field and world maps, the Magpie's flight, every set fight in order, shops, inns, camps, wells, the menu, the save and the ending. Every part has been played headless with no errors. Build it with `node tools/build.mjs --min putting-it-all-together/game.html`.
2. **Art to come:** the townsfolk's portraits (`art-requests/06-townsfolk-portraits.md`) and the story stills (`art-requests/07-story-stills.md`). When they arrive the page passes 16 MB, so its paintings move to separate files beside it.
3. **The script** is Claude's placeholder throughout (`src/game/script.js`), for the lore conversation to replace.

Art in hand (`../reference/art/README.md`):

- every sheet from art request 01;
- all eight battle backdrops from request 03, compressed into `art/backdrops/`;
- the world map: nine tiles in a 3×3 grid, in day and night versions, with the bands and stops Chris confirmed (`reference/art/world-map/bands-and-stops.webp`);
- all 13 ground-level maps (request 04) and the three pilot portraits (request 05). Every image requested so far is in.

The ground-level map prompts are request 04, with a pilot of three to make first; it went to Chris as a Markdown file. The questions for Chris, and the lore questions for his lore conversation, are in `questions/open.md`.

`tools/compress.mjs` makes the game's WebP copies of Chris's images (`npm install --prefix tools` first).

