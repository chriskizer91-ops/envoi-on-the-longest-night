# Job: fight-math

Finish rebalancing the new battle's numbers, so the fights with Io and the Jester feel the way Envoi's felt with Io and Sol.

## Where it stands (November 16)

The new battle is a copy of Envoi's (`moon-faire-witches/src/battle/`). `node moon-faire-witches/tools/balance.mjs` runs
Envoi's own 51 balance targets on it (how often a careless, an attentive and an expert player win each fight, and how long it
lasts). With Moon Faire's Fate numbers as they came, 21 were met. The hub's first pass got it to 42 (see "The new battle" in
`moon-faire-witches/README.md` for what changed). These 9 are still missed:

| Fight | Player | Now | Wanted |
|---|---|---|---|
| Wild packs, level 5 | attentive | lasts 0.6 minutes | a little longer |
| Bramble Horror, levels 12 and 14 | attentive | wins 93% | 70% to 92% |
| Bramble Colossus, levels 18 to 20 | attentive | wins 12% | 15% to 40% |
| Halcyon's ambush, level 18 | expert | wins 0% | 40% to 85% |
| The finale, level 20 | expert | wins 15% | 60% to 85% |
| The finale, level 19 | expert | its losses leave 52% of the foes' Life | closer fights |

Halcyon's ambush and the finale are **left out of this job**: Chris has changed both (November 16). Halcyon becomes a
paladin on Io's body, and Moon Faire's big bad takes Noctara's place. The hub rebuilds those two fights and balances them
itself, so leave their numbers as they are.

## What to do

1. Get the misses in by changing the **party's** numbers (Io's and the Jester's moves, Life, MP, speed) and Moon Faire's
   **Fate numbers** (`FATE` in `rules.js`), never the targets and never the foes.
2. Keep the Jester the Jester. `node moon-faire-witches/tools/fate-sim.mjs 300 8 wraith,wisp,wisp` should still show seals
   about twice a fight and a Curtain Call in most pack fights. Her rules stay exactly Moon Faire's.
3. If the simulated players play a witch badly (they were written for Io and Sol, and the Jester's play was added in
   `sim.js`), improve how they play her, the way Envoi's players were written: a careless, an attentive and an expert player.
4. Rebuild the battle page and send it to Chris with a before-and-after table in plain words.

## Files you may change

- `moon-faire-witches/src/battle/rules.js` (numbers, and the notes beside them)
- `moon-faire-witches/src/battle/sim.js` (how the simulated players play; not `TARGETS`, which are Envoi's)
- `moon-faire-witches/src/battle/engine.js` (only a change to the math that the README explains)
- `moon-faire-witches/tools/balance.mjs`, `moon-faire-witches/tools/fate-sim.mjs`
- `moon-faire-witches/README.md`, the section "The new battle" only
- `moon-faire-witches/workshop/slips/fight-math.md`

## Checks

- `node moon-faire-witches/tools/balance.mjs --n 300`: every target met, or the ones left named in the slip with why.
- `node moon-faire-witches/tools/fate-sim.mjs 300 8 wraith,wisp,wisp`: seals and Curtain Calls as above.
- `node tools/build.mjs --offline moon-faire-witches/battle/battle.html`, then
  `node tools/arena-test.mjs dist/battle.html --fights first,band1,band2,band3,band4,horror,colossus,gate5 --level 12 --to turns:6 --turbo 6`
  passes with no page errors.

## Done when

The checks pass, Chris has played the battle file and is happy with how it feels, and the slip is written.
