# Balance report

Written by `tools/balance.mjs` from the numbers in `src/battle/rules.js`. Each row is 1000 fights with fixed seeds, so the same numbers always give the same report. **52 of 52 targets met.**

The play styles: **careless** picks moves almost at random and heals late; **attentive** (`sensible` in the code), the average player, heals anyone under about half and saves MP for healing; **expert** heals before the next big hit could land, shields against charged moves and uses each summon at the right moment. A fight's length includes 1.5 seconds of thinking for each menu.

| Fight | Level | Style | Wins | Target | Median length | Losses leave | Met |
|---|---|---|---|---|---|---|---|
| The first fight | 1 | careless | 62% | 45% to 75% | 1.1 min | 12% of foe HP | Yes |
| The first fight | 1 | attentive | 100% | 99% to 100% | 1.3 min | 31% of foe HP | Yes |
| Wild packs | 2 | careless | 100% | 80% to 100% | 1.3 min | 14% of foe HP | Yes |
| Wild packs | 5 | careless | 100% | 80% to 100% | 0.8 min |  | Yes |
| Wild packs | 8 | careless | 97% | 80% to 100% | 1.5 min | 15% of foe HP | Yes |
| Wild packs | 13 | careless | 93% | 80% to 100% | 1.6 min | 20% of foe HP | Yes |
| Wild packs | 18 | careless | 85% | 80% to 100% | 1.7 min | 22% of foe HP | Yes |
| Wild packs | 20 | careless | 99% | 80% to 100% | 1.4 min | 18% of foe HP | Yes |
| Wild packs | 6 | careless | 72% | 30% to 90% | 1.7 min | 26% of foe HP | Yes |
| Wild packs | 11 | careless | 58% | 30% to 90% | 1.7 min | 31% of foe HP | Yes |
| Wild packs | 16 | careless | 40% | 30% to 90% | 1.7 min | 38% of foe HP | Yes |
| Wild packs | 2 | attentive | 100% | 97% to 100%, 0.6 to 2.2 min | 1.0 min |  | Yes |
| Wild packs | 5 | attentive | 100% | 97% to 100%, 0.6 to 2.2 min | 0.7 min |  | Yes |
| Wild packs | 8 | attentive | 100% | 97% to 100%, 0.6 to 2.2 min | 1.1 min |  | Yes |
| Wild packs | 13 | attentive | 100% | 97% to 100%, 0.6 to 2.2 min | 1.2 min |  | Yes |
| Wild packs | 18 | attentive | 100% | 97% to 100%, 0.6 to 2.2 min | 1.5 min |  | Yes |
| Wild packs | 20 | attentive | 100% | 97% to 100%, 0.6 to 2.2 min | 1.0 min |  | Yes |
| Wild packs | 6 | attentive | 98% | 90% to 100%, 0.6 to 2.5 min | 1.6 min | 35% of foe HP | Yes |
| Wild packs | 11 | attentive | 97% | 90% to 100%, 0.6 to 2.5 min | 1.8 min | 51% of foe HP | Yes |
| Wild packs | 16 | attentive | 92% | 90% to 100%, 0.6 to 2.5 min | 2.1 min | 52% of foe HP | Yes |
| Wild bramble | 8 | attentive | 57% | 35% to 70% | 1.8 min | 56% of foe HP | Yes |
| Wild bramble | 13 | attentive | 48% | 35% to 70% | 2.0 min | 60% of foe HP | Yes |
| Wild bramble | 18 | attentive | 48% | 35% to 70% | 1.9 min | 62% of foe HP | Yes |
| Wild bramble | 6 | attentive | 23% | 5% to 35% | 1.5 min | 71% of foe HP | Yes |
| Wild bramble | 11 | attentive | 14% | 5% to 35% | 1.4 min | 75% of foe HP | Yes |
| Wild bramble | 16 | attentive | 11% | 5% to 35% | 1.3 min | 76% of foe HP | Yes |
| Wild bramble | 20 | attentive | 87% | 75% to 100% | 1.7 min | 47% of foe HP | Yes |
| Bramble Horror | 4 | careless | 27% | 15% to 60% | 1.8 min | 32% of foe HP | Yes |
| Bramble Horror | 4 | attentive | 93% | 80% to 100% | 2.5 min | 35% of foe HP | Yes |
| Bramble Horror | 9 | careless | 17% | 5% to 40% | 1.7 min | 34% of foe HP | Yes |
| Bramble Horror | 14 | careless | 19% | 5% to 40% | 1.7 min | 34% of foe HP | Yes |
| Bramble Horror | 9 | attentive | 82% | 70% to 92% | 2.5 min | 40% of foe HP | Yes |
| Bramble Horror | 14 | attentive | 82% | 70% to 92% | 2.5 min | 41% of foe HP | Yes |
| Bramble Horror | 4 | expert | 99% | 92% to 100% | 2.4 min | 23% of foe HP | Yes |
| Bramble Horror | 9 | expert | 96% | 92% to 100% | 3.0 min | 27% of foe HP | Yes |
| Bramble Horror | 14 | expert | 96% | 92% to 100% | 3.0 min | 26% of foe HP | Yes |
| Ancient Crown | 14 | attentive | 25% | 20% to 50% | 2.8 min | 52% of foe HP | Yes |
| Ancient Crown | 19 | attentive | 37% | 20% to 50% | 2.9 min | 53% of foe HP | Yes |
| Ancient Crown | 14 | expert | 59% | 45% to 80% | 4.6 min | 35% of foe HP | Yes |
| Ancient Crown | 19 | expert | 64% | 45% to 80% | 4.5 min | 39% of foe HP | Yes |
| The great wraith | 5 | careless | 37% | 20% to 60% | 2.2 min | 17% of foe HP | Yes |
| The great wraith | 5 | attentive | 93% | 80% to 96% | 2.4 min | 12% of foe HP | Yes |
| The great wraith | 5 | expert | 100% | 97% to 100% | 2.6 min | 10% of foe HP | Yes |
| Dawnroost | 10 | attentive | 89% | 80% to 96% | 3.1 min | 51% of foe HP | Yes |
| Dawnroost | 10 | expert | 97% | 93% to 100% | 3.9 min | 46% of foe HP | Yes |
| Halcyon's ambush | 15 | expert | 0% | 0% to 10% | 2.5 min | 88% of foe HP | Yes |
| Halcyon's ambush | 18 | expert | 53% (retreats) | 40% to 85% | 4.7 min | 34% of foe HP | Yes |
| Halcyon's ambush | 20 | expert | 99% (retreats) | 80% to 100% | 2.9 min | 24% of foe HP | Yes |
| The finale | 20 | expert | 76% | 60% to 85% | 7.1 min | 17% of foe HP | Yes |
| The finale | 20 | attentive | 4% | 2% to 10% | 5.1 min | 38% of foe HP | Yes |
| The finale | 19 | expert | 5% | 0% to 10%, losses leave under 45% | 6.9 min | 31% of foe HP | Yes |
| The finale | 18 | expert | 0% | 0% to 2% | 5.0 min | 59% of foe HP | Yes |

## Experience and shards

An average wild fight at each level, and how many it takes to level up. A gate is worth about one level; the first fight takes Io straight to level 2.

| Level | To next level | Wild fight gives | Fights for a level | Shards a fight |
|---|---|---|---|---|
| 1 | 160 | 78 | the first fight | 54 |
| 2 | 192 | 78 | 2.5 | 54 |
| 3 | 230 | 78 | 3.0 | 54 |
| 4 | 282 | 78 | 3.6 | 54 |
| 5 | 345 | 78 | 4.4 | 54 |
| 6 | 528 | 254 | 2.1 | 181 |
| 7 | 646 | 254 | 2.5 | 181 |
| 8 | 791 | 254 | 3.1 | 181 |
| 9 | 968 | 254 | 3.8 | 181 |
| 10 | 1,185 | 254 | 4.7 | 181 |
| 11 | 1,451 | 744 | 2.0 | 535 |
| 12 | 1,776 | 744 | 2.4 | 535 |
| 13 | 2,174 | 744 | 2.9 | 535 |
| 14 | 2,661 | 744 | 3.6 | 535 |
| 15 | 3,257 | 744 | 4.4 | 535 |
| 16 | 10,763 | 2,050 | 5.2 | 1,493 |
| 17 | 13,173 | 2,050 | 6.4 | 1,493 |
| 18 | 16,124 | 2,050 | 7.9 | 1,493 |
| 19 | 19,736 | 2,050 | 9.6 | 1,493 |

About 74 wild fights from level 2 to 20 for a player who skips nothing, before the gates' experience is counted.

## The Magpie

| Upgrade | Level | Shards |
|---|---|---|
| The Bogmire refit | 5 | 500 |
| The charge at Dawnroost's living node | 10 | 1,800 |
| The final upgrade at the shipyard | 15 | 4,500 |
