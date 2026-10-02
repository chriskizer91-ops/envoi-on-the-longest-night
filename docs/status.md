# Where Things Stand

A handoff for the next session. Updated October 2, 2026, after the move to Chris's second account. Every model is touched up and committed. Noctara's page has been rebuilt with the finished cast.

We are in **phase 1, the models** (`plan.md`), at step 10b, the polish round. Every model gets touched up against its sheets and shown on a battle bench page in the Night square, then published as a private page Chris can open on his phone.

## Working from the second account

- **Branch:** commit only to `second-account-work`. Never commit to `main` or any other branch, and never to the sibling repos.
- **Publishing:** pages are published from the second account. They're private to it until Chris shares them. The first account's pages below stay as they are; this account can't update them, so a republished page gets a new link here.

## Published from the second account

| Page | Link | State |
|---|---|---|
| Noctara | https://claude.ai/artifact/JWFwFUZTDum2CZjbGXotir | Rebuilt October 2 with the finished Io, Sol and Halcyon |
| Lunara | https://claude.ai/artifact/Y1hTureSoXGBnTer4tJNSX | Polished October 2: heavier skirt chains and pointed ears |
| Art requests | https://claude.ai/artifact/MNozyJ4DQys2syLfyyv44c | The open prompts with copy buttons: the ground-level maps (request 04) and the night world tiles (request 02). Rebuild with `node tools/art-page.mjs` and republish `dist/art-requests.html` whenever a request changes. |

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
| Io, the Witch | Done, with her new spells in `src/fx/io-spells.js` | Scale the spell effects up for the battle camera; Moth Veil's 35% capacity and two turns, and Moonsteel's Moon-element hit, belong to the battle step |
| Wisp | Done, polished | A darker, fuller smoke tail; stronger tears in the hollow; check the frost variant in every action |
| Shadow Wraith and great wraith | Done | The great wraith's numbers; a scythe head and hem closer to the sheet; switching to the great wraith without a reload (a bench change) |
| Sol | Done | Wispier hair, a rounder face, the cape over her shoulders, and compacting the code (140 KB) |
| Envoi | Done | A full ring round the foe in the strike; a dark splash when the ward takes a hit; keep the tail clear of Io; longer bipyramid lanterns |
| Halcyon | Done | Her face is still rounder than the sheets' gaunt one (kept as built); Light-Drinker's streams and Black Noon's swirls could be ribbons; a brief cut line in the retreat around u 0.65 |
| The cast (step 11) | Not started | Every model together at true scale, after all of the above |

"What's left" comes from each agent's last report. Every model step (2 to 10) is done; step 11, the cast, is next.

## Rules that bit us

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

1. The polish round (plan step 10b): every model's "what's left" list, one model at a time, each page rebuilt and republished here. The shared bench and tool changes are done.
2. The cast page (step 11).
3. Phase 2, the battles. Every number decision so far is in `design-decisions.md`, under October 2: level 1 uses the Night square demo's numbers, everything grows about 20% per level, and 20 is the highest level.

Art in hand (`../reference/art/README.md`):

- every sheet from art request 01;
- all eight battle backdrops from request 03, compressed into `art/backdrops/`;
- the world map, day versions: nine tiles in a 3×3 grid. The night versions come next (request 02).

The ground-level map prompts are request 04, with a pilot of three to make first. The questions for Chris, and the lore questions for his lore conversation, are in `questions/open.md`; the biggest is where the bands and stops sit on the world map.

`tools/compress.mjs` makes the game's WebP copies of Chris's images (`npm install --prefix tools` first).

