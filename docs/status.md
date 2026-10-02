# Where Things Stand

A handoff for the next session. Updated October 2, 2026, at a planned stopping point while Chris's weekly usage runs low.

We are in **phase 1, the models** (`plan.md`). Every model gets touched up against its sheets and shown on a battle bench page in the Night square, then published as a private page Chris can open on his phone.

## Published pages

| Page | Link | State |
|---|---|---|
| Noctara | https://claude.ai/artifact/4FzTFkD5JRPhci57H2ybvz | Done (October 1). Rebuild once every model is final: its supporting actors use working copies. |
| Halcyon | https://claude.ai/artifact/7zPEx3g6VC4SFfdZ8zdHj8 | Done: refined against her new sheets on October 2. |
| Lunara | https://claude.ai/artifact/XpsLozXGFgPCwLG5s5iUce | Done |
| Io, the Witch | https://claude.ai/artifact/1mF6YFp3xg1KhGs5tZNYky | Technical pass done. Her three new spells are in progress (below). |
| Sol | https://claude.ai/artifact/FpVoGvTKCwv8GWiuouJu7N | Done, with Kestrel Stoop |
| Envoi | https://claude.ai/artifact/6W5ZvTmsusQwAEBEkP95hx | Done, with its summon, ward and strike |
| Shadow Wraith and great wraith | https://claude.ai/artifact/HEn78AJYsTpGRs9B4zZ5SW | Done; the Great wraith toggle reloads the page |
| The wisp | https://claude.ai/artifact/TDbtEVzrdJFQ2cXevWFiVF | Done, with its polish round |

## The models

| Model | State | What's left |
|---|---|---|
| Noctara | Done | — |
| Lunara | Done | The sheet's heavier skirt chains; her pointed ears |
| Io, the Witch | Technical pass done | Her new spells (Waxing Light, Moonsteel, Moth Veil) as effects on her existing motions, in `src/fx/io-spells.js` |
| Wisp | Done, polished | A darker, fuller smoke tail; stronger tears in the hollow; check the frost variant in every action |
| Shadow Wraith and great wraith | Done | The great wraith's numbers; a scythe head and hem closer to the sheet; switching to the great wraith without a reload (a bench change) |
| Sol | Done | Wispier hair, a rounder face, the cape over her shoulders, and compacting the code (140 KB) |
| Envoi | Done | A full ring round the foe in the strike; a dark splash when the ward takes a hit; keep the tail clear of Io; longer bipyramid lanterns |
| Halcyon | Done | Her face is still rounder than the sheets' gaunt one (kept as built); Light-Drinker's streams and Black Noon's swirls could be ribbons; a brief cut line in the retreat around u 0.65 |
| The cast (step 11) | Not started | Every model together at true scale, after all of the above |

Work an agent hadn't finished at the stopping point is listed under its model below, from its last report.

## Rules that bit us

- **A bench page must load only original models for its supporting actors** (`makeWitchOriginal`, `makeSolOriginal`, `makeWraithOriginal`...). Lunara's page once bundled a half-edited Sol and crashed on Chris's phone.
- **Commit an agent's files only after its report, and only its own files,** by explicit path. Several agents work in the same folder at once.
- **The machine has 4 cores.** With six agents rendering, headless checks slow down a lot. Give checks long timeouts and run renders one at a time.

## Bench and tool changes the agents asked for

Make these once no agent is mid-pass, since every page shares these files:

- `bench.css`: a `.dmg.miss` style. The wisp's stage file injects one for now.
- `bench.js`:
  - a Before model of a different actor kind than After (Lunara's stage wraps her old model in an adapter);
  - placing the subject by an offset in meters, not only by painting pixel;
  - an option to aim the subject's dash along its target line;
  - a real walk phase for the 'witch' actor kind (Io's stage computes one).
- `tools/check.mjs`:
  - a wait before each screenshot, so damage numbers, which fade in with CSS, show up;
  - shots of actions on original models that have no `ACTIONS`.
- `tools/turnaround`: choosing which anchor a close-up frames.
- The Night square's lantern occluder covers part of Lunara's skirt when she stands behind the well.

## Next steps

1. Review and commit what the running agents report, and publish their pages.
2. Make the bench and tool changes above.
3. Rebuild Noctara's page with the finished models.
4. Build the cast page (step 11).
5. Then phase 2, the battles. Every number decision so far is in `design-decisions.md`, under October 2: level 1 uses the Night square demo's numbers, everything grows about 20% per level, and 20 is the highest level.

Art in hand: every sheet from art request 01 (`../reference/art/README.md`). The world map prompts are in `art-requests/02-world-map.md` for when Chris wants to generate them. Nothing is open in `questions/open.md` except the stats, which the battle steps settle.
