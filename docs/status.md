# Where Things Stand

A handoff for the next session. Updated October 2, 2026, after the fourteenth round: the frame-rate button, Envoi on the party page, and the Kestrel Stoop fix.

**Phase 1, the models, is done** (`plan.md`): every model is polished, and the cast page runs at 60 fps with five models on Chris's Pixel 7a. **Phase 2, the battles, has its groundwork and its first battle:** the rules tables, a battle engine without graphics, a balance simulator that meets all 25 targets (Chris approved the new rules), and step 12, the first fight. Step 13, the party, is built too. Next is step 14, the great wraith.

## Working from the second account

- **Branch:** commit only to `second-account-work`. Never commit to `main` or any other branch, and never to the sibling repos.
- **Publishing:** pages are published from the second account. They're private to it until Chris shares them. The first account's pages below stay as they are; this account can't update them, so a republished page gets a new link here.

## Published from the second account

| Page | Link | State |
|---|---|---|
| The party | https://claude.ai/artifact/5awxTd1H3htoFJbjinQwz1 | Step 13 (October 2): Io and Sol against nine packs of wisps, frost wisps and wraiths at any level from 1 to 20; Sol's Heat, Sword Arts and Dawnbreaker, Io's new Moonlore, Lunara across the pack, Envoi from level 11, herbs, a target for every blow, and a frame-rate button |
| The first fight | https://claude.ai/artifact/MkgkJSQVgGp3JEivcmN2KN | Step 12 (October 2): Io alone against the Night square wraith at level 1, played by the battle engine with the finished models; Lunara's Embrace and Silver Requiem; experience, shards and the level-up at the end. You can lose |
| Battle balance | https://claude.ai/artifact/DruqrA8zAzZNpe4ahRXFwe | Phase 2 groundwork (October 2): all 25 balance targets with the simulator's results, any fight played turn by turn with its gauges, the level curve, experience and shards, and the new rules for Chris to approve |
| The cast | https://claude.ai/artifact/Qk8apijsA3ZjVoK88XF4bJ | Step 11 (October 2): every model at true scale; pick an encounter, who acts and their target. Pixel 7a: 60 fps with five models, 39 with eight. Builds models when first needed |
| Walking test | https://claude.ai/artifact/3YJkf77SD43iWJgo6pXmcf | The pixel Io (28 × 42) on all 13 ground-level maps at 768 wide with sharp pixels, 0.7× zoom, one walking speed and a mini-map; the talking portraits in a dialogue box. No walls yet |
| Noctara | https://claude.ai/artifact/JWFwFUZTDum2CZjbGXotir | Rebuilt October 2 with the finished Io, Sol and Halcyon |
| Lunara | https://claude.ai/artifact/Y1hTureSoXGBnTer4tJNSX | Polished October 2: heavier skirt chains and pointed ears |
| Io, the Witch | https://claude.ai/artifact/6vRCkyYzZjn5Fc77GYebyE | Polished October 2: her new spells sized for the battle camera |
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
- **Summons:** Lunara rises from the Moonwell; Envoi (when the page passes `makeEnvoi`) folds in between the party and the foes, takes the next blow on its Folding Ward (foes aim at the ward), and strikes on Io's next turn.
- Every command with more than one target opens a target list (foes with their HP left, allies with their HP); an arrow marks the one pointed at, and the most hurt is pointed at first.
- Test hooks on `window.__battle`: `begin()`, `skip()`, `pick(id)`, `auto = 'expert'` (a play style from `sim.js` chooses the commands), `turbo`, `setFight(level, pack)`, `weaken(n, who)`, `trace`, `pace` (the frame-rate cap, the screen's measured rate and the fight's frame count). At high `turbo` the models' animations lag the clock (they cap their own step), so a sped-up test takes longer per action than its clock suggests.

## Next steps

1. Step 14, the great wraith: the Bogmire boss and level 5 gate, with its Stolen Fire, Swallow Lamplight and its lights released at the end; winning leads to the refit and Moth Veil.
2. The progression pass (`plan.md`): foe levels set by area, the experience curve, and half the fights in the last five levels, once Chris answers question 6.
3. Walking (phase 4): trace each ground-level map's walls, exits and walk-behind parts, and set any map's own closer zoom. Io is 42 map px; the maps ship at 768 wide with sharp pixels; the zoom is 0.7×.

Art in hand (`../reference/art/README.md`):

- every sheet from art request 01;
- all eight battle backdrops from request 03, compressed into `art/backdrops/`;
- the world map: nine tiles in a 3×3 grid, in day and night versions, with the bands and stops Chris confirmed (`reference/art/world-map/bands-and-stops.webp`);
- all 13 ground-level maps (request 04) and the three pilot portraits (request 05). Every image requested so far is in.

The ground-level map prompts are request 04, with a pilot of three to make first; it went to Chris as a Markdown file. The questions for Chris, and the lore questions for his lore conversation, are in `questions/open.md`.

`tools/compress.mjs` makes the game's WebP copies of Chris's images (`npm install --prefix tools` first).

