# Balance report

Written by `tools/balance.mjs` from the numbers in `src/battle/rules.js`. Each row is 1000 fights with fixed seeds, so the same numbers always give the same report. **32 of 32 targets met.**

The play styles: **careless** picks moves almost at random and heals late; **attentive** (`sensible` in the code), the average player, heals anyone under about half and saves MP for healing; **expert** heals before the next big hit could land, shields against charged moves and uses each summon at the right moment. A fight's length includes 1.5 seconds of thinking for each menu.

| Fight | Level | Style | Wins | Target | Median length | Losses leave | Met |
|---|---|---|---|---|---|---|---|
| The first fight | 1 | careless | 62% | 45% to 75% | 1.1 min | 12% of foe HP | Yes |
| The first fight | 1 | attentive | 100% | 99% to 100% | 1.3 min | 31% of foe HP | Yes |
| Wild fights | 2 | careless | 100% | 80% to 100% | 1.3 min | 14% of foe HP | Yes |
| Wild fights | 5 | careless | 100% | 80% to 100% | 0.8 min |  | Yes |
| Wild fights | 8 | careless | 97% | 80% to 100% | 1.5 min | 15% of foe HP | Yes |
| Wild fights | 13 | careless | 93% | 80% to 100% | 1.6 min | 20% of foe HP | Yes |
| Wild fights | 18 | careless | 85% | 80% to 100% | 1.7 min | 23% of foe HP | Yes |
| Wild fights | 20 | careless | 99% | 80% to 100% | 1.4 min | 18% of foe HP | Yes |
| Wild fights | 6 | careless | 72% | 30% to 90% | 1.7 min | 26% of foe HP | Yes |
| Wild fights | 11 | careless | 58% | 30% to 90% | 1.7 min | 31% of foe HP | Yes |
| Wild fights | 16 | careless | 40% | 30% to 90% | 1.7 min | 38% of foe HP | Yes |
| Wild fights | 2 | attentive | 100% | 97% to 100%, 0.6 to 2.2 min | 1.0 min |  | Yes |
| Wild fights | 5 | attentive | 100% | 97% to 100%, 0.6 to 2.2 min | 0.7 min |  | Yes |
| Wild fights | 8 | attentive | 100% | 97% to 100%, 0.6 to 2.2 min | 1.1 min |  | Yes |
| Wild fights | 13 | attentive | 100% | 97% to 100%, 0.6 to 2.2 min | 1.2 min |  | Yes |
| Wild fights | 18 | attentive | 100% | 97% to 100%, 0.6 to 2.2 min | 1.5 min |  | Yes |
| Wild fights | 20 | attentive | 100% | 97% to 100%, 0.6 to 2.2 min | 1.0 min |  | Yes |
| Wild fights | 6 | attentive | 99% | 90% to 100%, 0.6 to 2.5 min | 1.6 min | 34% of foe HP | Yes |
| Wild fights | 11 | attentive | 97% | 90% to 100%, 0.6 to 2.5 min | 1.8 min | 51% of foe HP | Yes |
| Wild fights | 16 | attentive | 91% | 90% to 100%, 0.6 to 2.5 min | 2.2 min | 51% of foe HP | Yes |
| The great wraith | 5 | careless | 37% | 20% to 60% | 2.2 min | 17% of foe HP | Yes |
| The great wraith | 5 | attentive | 90% | 80% to 96% | 2.4 min | 14% of foe HP | Yes |
| The great wraith | 5 | expert | 99% | 97% to 100% | 2.7 min | 13% of foe HP | Yes |
| Dawnroost | 10 | attentive | 91% | 80% to 96% | 3.1 min | 55% of foe HP | Yes |
| Dawnroost | 10 | expert | 98% | 93% to 100% | 3.9 min | 43% of foe HP | Yes |
| Halcyon's ambush | 15 | expert | 0% | 0% to 10% | 2.7 min | 88% of foe HP | Yes |
| Halcyon's ambush | 18 | expert | 62% (retreats) | 40% to 85% | 5.4 min | 34% of foe HP | Yes |
| Halcyon's ambush | 20 | expert | 100% (retreats) | 80% to 100% | 3.2 min | 24% of foe HP | Yes |
| The finale | 20 | expert | 74% | 60% to 85% | 8.7 min | 13% of foe HP | Yes |
| The finale | 20 | attentive | 6% | 3% to 10% | 6.1 min | 34% of foe HP | Yes |
| The finale | 19 | expert | 3% | 0% to 10%, losses leave under 45% | 8.4 min | 31% of foe HP | Yes |
| The finale | 18 | expert | 0% | 0% to 2% | 6.2 min | 59% of foe HP | Yes |

## Experience and shards

An average wild fight at each level, and how many it takes to level up. A gate is worth about one level; the first fight takes Io straight to level 2.

| Level | To next level | Wild fight gives | Fights for a level | Shards a fight |
|---|---|---|---|---|
| 1 | 160 | 70 | the first fight | 54 |
| 2 | 192 | 70 | 2.7 | 54 |
| 3 | 230 | 70 | 3.3 | 54 |
| 4 | 282 | 70 | 4.0 | 54 |
| 5 | 345 | 70 | 4.9 | 54 |
| 6 | 528 | 248 | 2.1 | 189 |
| 7 | 646 | 248 | 2.6 | 189 |
| 8 | 791 | 248 | 3.2 | 189 |
| 9 | 968 | 248 | 3.9 | 189 |
| 10 | 1,185 | 248 | 4.8 | 189 |
| 11 | 1,451 | 696 | 2.1 | 534 |
| 12 | 1,776 | 696 | 2.6 | 534 |
| 13 | 2,174 | 696 | 3.1 | 534 |
| 14 | 2,661 | 696 | 3.8 | 534 |
| 15 | 3,257 | 696 | 4.7 | 534 |
| 16 | 10,763 | 1,903 | 5.7 | 1,479 |
| 17 | 13,173 | 1,903 | 6.9 | 1,479 |
| 18 | 16,124 | 1,903 | 8.5 | 1,479 |
| 19 | 19,736 | 1,903 | 10.4 | 1,479 |

About 79 wild fights from level 2 to 20 for a player who skips nothing, before the gates' experience is counted.

## The Magpie

| Upgrade | Level | Shards |
|---|---|---|
| The Bogmire refit | 5 | 500 |
| The charge at Dawnroost's living node | 10 | 1,800 |
| The final upgrade at the shipyard | 15 | 4,500 |
