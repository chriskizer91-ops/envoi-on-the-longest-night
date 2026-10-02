# Balance report

Written by `tools/balance.mjs` from the numbers in `src/battle/rules.js`. Each row is 1000 fights with fixed seeds, so the same numbers always give the same report. **25 of 25 targets met.**

The play styles: **careless** picks moves almost at random and heals late; **sensible** heals anyone under about half and saves MP for healing; **expert** heals before the next big hit could land, shields against charged moves and uses each summon at the right moment. A fight's length includes 1.5 seconds of thinking for each menu.

| Fight | Level | Style | Wins | Target | Median length | Losses leave | Met |
|---|---|---|---|---|---|---|---|
| The first fight | 1 | careless | 84% | 60% to 95% | 1.1 min | 10% of foe HP | Yes |
| The first fight | 1 | sensible | 100% | 95% to 100% | 1.2 min |  | Yes |
| Wild fights | 2 | careless | 100% | 85% to 100% | 1.1 min |  | Yes |
| Wild fights | 5 | careless | 100% | 85% to 100% | 1.1 min |  | Yes |
| Wild fights | 8 | careless | 100% | 85% to 100% | 1.4 min | 8% of foe HP | Yes |
| Wild fights | 12 | careless | 97% | 85% to 100% | 1.5 min | 16% of foe HP | Yes |
| Wild fights | 16 | careless | 89% | 85% to 100% | 1.7 min | 22% of foe HP | Yes |
| Wild fights | 20 | careless | 89% | 85% to 100% | 1.7 min | 22% of foe HP | Yes |
| Wild fights | 2 | sensible | 100% | 97% to 100%, 0.7 to 2.2 min | 0.8 min |  | Yes |
| Wild fights | 5 | sensible | 100% | 97% to 100%, 0.7 to 2.2 min | 0.8 min |  | Yes |
| Wild fights | 8 | sensible | 100% | 97% to 100%, 0.7 to 2.2 min | 1.1 min |  | Yes |
| Wild fights | 12 | sensible | 100% | 97% to 100%, 0.7 to 2.2 min | 1.2 min |  | Yes |
| Wild fights | 16 | sensible | 100% | 97% to 100%, 0.7 to 2.2 min | 2.0 min |  | Yes |
| Wild fights | 20 | sensible | 100% | 97% to 100%, 0.7 to 2.2 min | 2.0 min |  | Yes |
| The great wraith | 5 | careless | 36% | 20% to 60% | 2.0 min | 17% of foe HP | Yes |
| The great wraith | 5 | sensible | 90% | 80% to 96% | 2.3 min | 14% of foe HP | Yes |
| The great wraith | 5 | expert | 99% | 97% to 100% | 2.6 min | 13% of foe HP | Yes |
| Dawnroost | 10 | sensible | 91% | 80% to 96% | 2.9 min | 55% of foe HP | Yes |
| Dawnroost | 10 | expert | 97% | 93% to 100% | 3.6 min | 43% of foe HP | Yes |
| Halcyon's ambush | 15 | expert | 0% | 0% to 10% | 2.2 min | 90% of foe HP | Yes |
| Halcyon's ambush | 18 | expert | 68% (retreats) | 40% to 85% | 5.1 min | 38% of foe HP | Yes |
| Halcyon's ambush | 20 | expert | 100% (retreats) | 80% to 100% | 3.0 min |  | Yes |
| The finale | 20 | expert | 62% | 40% to 65% | 9.3 min | 17% of foe HP | Yes |
| The finale | 19 | expert | 0% | 0% to 10%, losses leave under 40% | 8.6 min | 34% of foe HP | Yes |
| The finale | 18 | expert | 0% | 0% to 2% | 6.4 min | 62% of foe HP | Yes |

## Experience and shards

An average wild fight at each level, and how many it takes to level up. A gate is worth about one level; the first fight takes Io straight to level 2.

| Level | To next level | Wild fight gives | Fights for a level | Shards a fight |
|---|---|---|---|---|
| 1 | 200 | 47 | the first fight | 36 |
| 2 | 240 | 57 | 4.2 | 44 |
| 3 | 288 | 68 | 4.2 | 52 |
| 4 | 346 | 81 | 4.3 | 62 |
| 5 | 415 | 97 | 4.3 | 75 |
| 6 | 498 | 168 | 3.0 | 128 |
| 7 | 597 | 200 | 3.0 | 153 |
| 8 | 717 | 239 | 3.0 | 182 |
| 9 | 860 | 288 | 3.0 | 219 |
| 10 | 1,032 | 346 | 3.0 | 263 |
| 11 | 1,238 | 468 | 2.6 | 359 |
| 12 | 1,486 | 561 | 2.7 | 431 |
| 13 | 1,783 | 673 | 2.6 | 516 |
| 14 | 2,140 | 808 | 2.6 | 621 |
| 15 | 2,568 | 970 | 2.6 | 745 |
| 16 | 3,081 | 1,279 | 2.4 | 993 |
| 17 | 3,698 | 1,536 | 2.4 | 1,193 |
| 18 | 4,437 | 1,841 | 2.4 | 1,431 |
| 19 | 5,325 | 2,210 | 2.4 | 1,717 |

About 55 wild fights from level 2 to 20 for a player who skips nothing, before the gates' experience is counted.

## The Magpie

| Upgrade | Level | Shards |
|---|---|---|
| The Bogmire refit | 5 | 500 |
| The charge at Dawnroost's living node | 10 | 1,800 |
| The final upgrade at the shipyard | 15 | 4,500 |
