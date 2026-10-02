# Where Things Stand

A handoff for the next session. Updated October 2, 2026, after the polish round on Chris's second account. Every model is touched up and polished, and every page is republished here with the shared fixes.

We are finishing **phase 1, the models** (`plan.md`). The polish round (step 10b) is done, and the first version of the cast page (step 11) is published; it needs Chris's phone check. Every model gets touched up against its sheets and shown on a battle bench page in the Night square, then published as a private page Chris can open on his phone.

## Working from the second account

- **Branch:** commit only to `second-account-work`. Never commit to `main` or any other branch, and never to the sibling repos.
- **Publishing:** pages are published from the second account. They're private to it until Chris shares them. The first account's pages below stay as they are; this account can't update them, so a republished page gets a new link here.

## Published from the second account

| Page | Link | State |
|---|---|---|
| The cast | https://claude.ai/artifact/Qk8apijsA3ZjVoK88XF4bJ | Step 11 (October 2): every model at true scale; pick an encounter, who acts and their target. Pixel 7a: 60 fps with five models, 39 with eight. Builds models when first needed |
| Walking test | https://claude.ai/artifact/3YJkf77SD43iWJgo6pXmcf | The pixel Io on the three pilot ground-level maps, to check their scale; the talking portraits in a dialogue box. Waiting on Chris's verdict on the scale |
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

## Next steps

1. Phase 2, the battles, starting with the groundwork: the rules tables, the level curve and the balance simulator.
2. The walking test: Chris's verdict on Io's size on the maps (36 map px to start), which sets the scale of the rest of request 04.
3. Chris's older phone: its make, and whether a single model's page opens on it. Every number decision so far is in `design-decisions.md`, under October 2: level 1 uses the Night square demo's numbers, everything grows about 20% per level, and 20 is the highest level.

Art in hand (`../reference/art/README.md`):

- every sheet from art request 01;
- all eight battle backdrops from request 03, compressed into `art/backdrops/`;
- the world map: nine tiles in a 3×3 grid, in day and night versions, with the bands and stops Chris confirmed (`reference/art/world-map/bands-and-stops.webp`);
- the three pilot ground-level maps (request 04) and the three pilot portraits (request 05).

The ground-level map prompts are request 04, with a pilot of three to make first; it went to Chris as a Markdown file. The questions for Chris, and the lore questions for his lore conversation, are in `questions/open.md`.

`tools/compress.mjs` makes the game's WebP copies of Chris's images (`npm install --prefix tools` first).

