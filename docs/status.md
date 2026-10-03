# Where Things Stand

A handoff for the next session. Updated October 2, 2026, at a planned stopping point while Chris's weekly usage runs low. Every model is touched up, committed and published.

We are in **phase 1, the models** (`plan.md`). Every model gets touched up against its sheets and shown on a battle bench page in the Night square, then published as a private page Chris can open on his phone.

## Published pages

| Page | Link | State |
|---|---|---|
| Noctara | https://claude.ai/artifact/XmiJgGB64CFCyExEdm1k3M | Second pass done October 3: black silk in deep folds, metal gold, a lining that opens on the night sky, bigger spells, and a defeat in which she rises as stars. Its supporting actors are this branch's working copies. The page with the finished Io, Sol and Halcyon is https://claude.ai/artifact/JWFwFUZTDum2CZjbGXotir, still her first pass: rebuild it with the second pass once this branch and the game's branch are merged. |
| Halcyon | https://claude.ai/artifact/7zPEx3g6VC4SFfdZ8zdHj8 | Done: refined against her new sheets on October 2. |
| Lunara | https://claude.ai/artifact/XpsLozXGFgPCwLG5s5iUce | Done |
| Io, the Witch | https://claude.ai/artifact/1mF6YFp3xg1KhGs5tZNYky | Done: technical pass, plus Waxing Light, Moonsteel and Moth Veil |
| Sol | https://claude.ai/artifact/FpVoGvTKCwv8GWiuouJu7N | Done, with Kestrel Stoop |
| Envoi | https://claude.ai/artifact/6W5ZvTmsusQwAEBEkP95hx | Done, with its summon, ward and strike |
| Shadow Wraith and great wraith | https://claude.ai/artifact/HEn78AJYsTpGRs9B4zZ5SW | Done; the Great wraith toggle reloads the page |
| The wisp | https://claude.ai/artifact/TDbtEVzrdJFQ2cXevWFiVF | Done, with its polish round |

## New character ideas

Added October 3, 2026: `../3d-model-new-character-ideas/` holds creatures Chris brings as ideas, polished one folder each and kept apart from the cast until he places them. Their benches share two painted places: the wild glade, and the wild meadow, whose day, night and weather turn by themselves and whose grass answers a creature's blows. Neither place has stars any more (October 3): the sky has none until the ending, and `opts.stars` lights them for it.

| Idea | Link | State |
|---|---|---|
| Bramble Horror | https://claude.ai/artifact/ASy7Y7hL3EuAHZbFDwihWv | Version 2: thorns, veins and a feeding hollow, whip-sprung canes that coil round the prey, Undergrowth and Scorch, a bench with Io as its prey in the wild glade or the wild meadow. Where it lives is asked in `questions/open.md`. |
| Bramble Colossus | https://claude.ai/artifact/HbXsmA8xNLUnLMQ6px7h6Q | Version 1: the Bramble Horror grown into a 7.5 m boss, with a braided spire, a bud that opens on its glowing heart, ten moves of its own and a Wrath phase at half HP; a bench where it fights Io and Sol, or fights them by itself, in the wild meadow or the wild glade. Its name and place are asked in `questions/open.md`. |
| Emberback | https://claude.ai/artifact/TBksnXh6X37EoL6F5wWBHo | Version 1, October 3, from Chris's sheets: the 7 m salamander with its lava-cracked hide, glowing crystal ridge and every pose on its action sheet (Bursting Up, Tail Lash, Ember Spit, Heat Drain, Eruption, starving, asleep as stone), plus Roar and Waking; a bench where it fights Io and Sol in the wild meadow, with Sheet poses to set beside the action sheet and sounds made in code. Its questions are in `questions/open.md`, question 5. |
| Gloamwing | https://claude.ai/artifact/NMbNDwKCSzLbX9DZurydWc | Version 1, October 3, from Chris's sheets: the 3 m night-flier with its barn owl's face, glowing bat wings 9 m across and the moon-sac full of souls, hovering on slow wingbeats, with every pose on its action sheet (Moonlure, Swoop, Wing Gale, Hush, Glut, hurt, released), plus its arrival and Rising; a bench where it fights Io and Sol in the wild meadow, with Sheet poses to set beside the action sheet and sounds made in code. Its questions are in `questions/open.md`, question 6. |
| Bramble Ancient | https://claude.ai/artifact/Lt1LuBqNE2zKKCuYFtAg3B | A test, October 3, of how far the Bramble Colossus can go: the first bramble, as old as the forest, 10 m tall. A trunk of five braided canes in deep, mossy bark, beards of moss, a crown of dead branches round a double flower, an old stone ruin in its roots whose carved signs glow with its heartbeat, old weapons in its bark, glowing mushrooms, fireflies and birds; every move of the Colossus's plus Rootquake and Monolith; a bench where it fights Io and Sol in the wild meadow, with sounds made in code. Its questions are in `questions/open.md`, question 7. |

## Living battlefields

Added October 3, 2026, from Chris's question about locking the battle camera: `../living-battlefields/`.

| Page | Link | State |
|---|---|---|
| Colossus in the Meadow | https://claude.ai/artifact/KCMQSy3QksJbZ4ikquxYVj | Io and Sol against the Bramble Colossus through a locked camera: the far meadow painted once in code (sky with the moon and no stars, mountains, 1,092 trees, 32,000 tufts), a live meadow in front at a fifth of the old meadow's triangles, a fight played from the Awakening to the fall with its Wrath storm, and every sound made in code. A painting of Chris's can replace the code's own (art request 08). |

## The models

| Model | State | What's left |
|---|---|---|
| Noctara | Done | — |
| Lunara | Done | The sheet's heavier skirt chains; her pointed ears |
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

1. Make the bench and tool changes above. Every model pass has finished and is committed and published; no agent is running.
2. Rebuild Noctara's page with the finished models.
3. Build the cast page (step 11).
4. Then phase 2, the battles. Every number decision so far is in `design-decisions.md`, under October 2: level 1 uses the Night square demo's numbers, everything grows about 20% per level, and 20 is the highest level.

Art in hand: every sheet from art request 01 (`../reference/art/README.md`). The world map prompts are in `art-requests/02-world-map.md` for when Chris wants to generate them. Nothing is open in `questions/open.md` except the stats, which the battle steps settle.
