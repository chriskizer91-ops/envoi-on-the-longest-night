# Envoi Game, Pass Three

Started October 3, 2026, in the evening, after Chris played the put-together game. This folder keeps everything from the session that started pass three: what Chris decided, what he brought, the pages made, and the plans for what comes next. The game itself still lives in `../src/` and `../putting-it-all-together/`; the pages made for this pass live here, one folder each.

**The branch:** `claude/practical-franklin-l1ctf9`. It holds the game from `ccr-9e19f4e2-29pyn6` (which already held all of `second-account-work`) and the creature branch `claude/sleepy-dirac-t4ftx0`, merged. Chris works from the second account, so its pages can be updated at the same links.

## Pages to open

| Page | Link | What it is |
|---|---|---|
| The game | https://claude.ai/artifact/9ix7XE5CT9pLrDATugkg2w | The whole game, now with the paper dolls, Chapters (start at gate 5, 10, 15 or the finale), and smoother walking |
| Battle Backgrounds | https://claude.ai/artifact/F7GsYnn8Z21EEndmWXxUQw | Chris's combat backgrounds far off, live 3D ground in front: pick a place, squeeze it from 207 KB to 4 KB, play the Colossus fight, try 20 to 60 frames a second and three sharpnesses |
| Wilderness Walk | https://claude.ai/artifact/BcRjgVynWymYim84Yb7STk | Io on Chris's wilderness path example, at his walk settings, with nine squeezes of the painting to switch between |
| Walking Paths | https://claude.ai/artifact/8BmLZd8sJjYBQ6kRbX2enm | The laptop editor for where Io can walk on all 13 maps: drag the paths over each painting, walk her on the change, and send the edits to Claude |

## What Chris decided

- **Mobs.**
  - The Gloamwing looks wrong to him (he may turn it into a bat himself), and the Emberback's fight is too much about fire. Neither goes in the game; both stay in `../3d-model-new-character-ideas/`.
  - No new mobs yet. His idea for later: the closer the party gets to Noctara, the more upset the wild becomes. Those creatures belong to the wild, not to her: the wisps and wraiths are hers.
  - The Bramble Horror lives in levels 10 to 15, the Bramble Colossus in 16 to 20. **Done:** the Horror is in band 3 only (levels 11 to 15), in all four forms; the Colossus was already in band 4.
- **Noctara's second pass is good.** It is in the game now.
- **Higher-detail models** are Chris's experiment. They still have to fit the game's limits, and the limit that matters is the phone's drawing power, not the file's size.
- **Locked in for size:** the Magpie's flying map, and Chris's three songs.
- **Walking.**
  - The world map is for flying the Magpie, the fun part. Nobody walks on it.
  - Walking happens only on painted pictures: town scenes, and wilderness path scenes like Chris's example (`../reference/art/walk/wilds/wilderness-path-example.webp`).
  - He wants direct control and tap or click to walk, as one control. **Done.**
  - He wants an editor page for the map paths, used on his laptop. **Done:** Walking Paths.
- **Battles:** 3D ground in front and a painting far off behind, for every fight, as in Colossus in the Meadow.
  - The paintings can be squeezed much harder than the maps.
  - One painting for each band's wilds, plus the story fights, matched to where they happen on the world map.
  - Chris measured Colossus in the Meadow at 29 to 30 frames a second on his phone, even with the storm blowing mid-attack.
  - A richer look is welcome on a laptop. On a phone the frame rate may drop below 30 if it must.
- **Squeezing:** the battle paintings a little (**done**). Nothing squeezed that doesn't need it, and no clever packing of the code that would make it confusing.
- **The paper dolls:** the townsfolk don't walk, so two or three pictures each. **Done.**
- **Chapters:** start at the beginning, gate 5, gate 10 or gate 15. **Done**, and the finale too.
- **Anything to edit, Chris does on his laptop.**

## What came in

| What | Where it is now |
|---|---|
| Nineteen paper-doll walk sheets (art request 08), in three packs | `../reference/art/walkers/` as they came; cut into `../art/walkers/` |
| Ten combat backgrounds, in two packs | `../reference/art/battle-backgrounds/` as they came |
| The wilderness path example | `../reference/art/walk/wilds/wilderness-path-example.webp` |

## What pass three has built so far

1. **The branches together:** the game, the creature branch, Noctara's second pass and the living battlefield.
2. **The paper dolls on the maps:**
   - Sol, Halcyon, Quill and Ysmera walk in the story's scenes, so they keep all 24 frames.
   - The fifteen townsfolk stand in one to three poses. Where a sheet's side frames all stride, that person faces you instead of turning.
   - All nineteen take 0.6 MB.
3. **The battle paintings squeezed a little:** the same look, 2.2 MB for all nine instead of 4.2. The Night square's painting is in the file once (it was in twice).
4. **Chapters** on the title screen: the start, gate 5, gate 10, gate 15 and the finale, with the party as the story leaves it at each.
5. **The Bramble Horror moved** to band 3. All 51 balance targets are met, and the journey still reaches every gate at its level.
6. **Smoother walking:**
   - Press and hold anywhere to steer her; a quick tap or click walks her there.
   - The pad works with one thumb, rolling round to any of eight ways.
   - She slips round corners she brushes.
   - Tapped walks go in straight lines.
   - A bug found on the way: a tap never reached the walking map (the hidden world map lay over it), so tap-to-walk had never worked in the game. Fixed.
7. **The Battle Backgrounds page** and **art request 11** (`../docs/art-requests/11-battle-backgrounds.md`): which painting goes with which fight, and four prompts for the places none of the ten show.
8. **The Wilderness Walk page.**
9. **The Walking Paths editor** (`map-paths/`): Witch Way's scene editor remade for this game's maps, with a walk test and a store his edits come back through.
10. **Noctara's second pass checked against the finale:** every move the finale plays is there, with its blow timings.

## The size, measured

The file Chris keeps (offline, one file): **12.2 MB** today, from 15.0 MB at the start of pass three, with all nineteen paper dolls in. The published game is 11.5 MB.

| In the file today | MB |
|---|---|
| World map: walking tiles 2.6, the flight's map 1.1, clouds 0.3 | 3.9 |
| Battle paintings (nine, squeezed a little) | 3.0 |
| Walking maps (13) and Io's walk | 1.7 |
| Code: three.js 0.6, the models 0.7, the game 0.4 | 1.7 |
| Paper dolls (19) | 0.8 |
| Title picture, portraits, fonts, the skiff | 1.1 |

Where it is heading, with everything Chris has asked for:

| Change | MB |
|---|---|
| Chris's three songs | +3.0 |
| Sixteen townsfolk portraits and nine story stills, squeezed | +2.1 to 3.1 |
| The new battles: eight backgrounds at the walking maps' squeeze (about 55 KB each), and the living field's code, in place of the nine old paintings | about −2.2 |
| No walking on the world map: its walking tiles go (the flight keeps its own map), and about eight wilderness scenes come in | about −1.1 |
| New wild creatures, later (about 65 KB each) | about +0.4 |
| **About** | **15 to 16 MB of the 30 MB limit** |

The published page has a 16 MB limit of its own; past it, the published copy goes out as a small page with its pictures beside it (`node tools/build.mjs --min --split`), which is already built.

## Next: the new battles

Chris chose 3D ground in front and a squeezed painting far off behind, for every fight.

1. **Pick the squeeze** on the Battle Backgrounds page (Chris).
2. **The four new paintings** from art request 11: band 2's Warm Roads, Dawnroost's living node, the northern crossroads, and the dead Moonwell (Chris, from the instance that made the pack).
3. **The living field takes a ground for each place** (`../living-battlefields/field.js`):
   - grass in the meadows and woods;
   - frost and snow on the frozen road and at the dead Moonwell;
   - flagstones in Dawnroost's yard and on Misthollow's plaza;
   - boardwalk and black water in Bogmire.
   - Each place has its own weather: mist in the fen, snow in the peaks, and now and then a storm in the wilds.
4. **The battle screen uses it** (`../src/battle/screen.js`): the locked camera, the party and the foes in the clearing, every move and rule as now.
   - A phone setting gives 30 frames a second by default, with 24 or 20 and a softer picture as choices.
   - A demo page comes first, then the game.

## Next: walking without the world map (for Chris to confirm)

Today the world map carries all of band 2's and band 3's wild walking, and the camps where the Magpie lands. Without it, each band's wilds become a short run of painted wilderness scenes between its places, as the Thornwood already is in band 1:

| Band | Scenes | Then |
|---|---|---|
| 1 | none new: the Thornwood is the wild walk | Wickhollow, the Thornwood, Bogmire, the fen's dark heart |
| 2 | about 3: the Warm Roads camp (the Magpie lands), the Ember Line road with its nodes, the forest road to Dawnroost | Dawnroost, the living node |
| 3 | about 3: the northern camp (the Magpie lands), Eldergrove's edge, the cold moor | the northern crossroads, the shipyard |
| 4 | 1 or 2: the frozen camp (the Magpie lands), Frostmere's shore | the frozen pass, Misthollow, the dead Moonwell |

Random fights happen on the wilderness scenes, as in the Thornwood today, and the Magpie flies between the landings. Once Chris agrees the plan, art request 12 follows: one prompt per scene, in the style and layout of his example. Every map in the game is at night, as the story is one long night, so the prompts would ask for night unless Chris wants these by day.

## Waiting on Chris

1. **The battle squeeze:** which level, from the Battle Backgrounds page.
2. **Art request 11:** the four battle paintings.
3. **The walking plan** above, and whether the wilderness scenes are at night.
4. **The wilderness squeeze:** which version, from the Wilderness Walk page.
5. **The map paths:** his edits, sent from the Walking Paths page.
6. Still open from before:
   - the lore conversation (every word is a placeholder);
   - art requests 06 (portraits) and 07 (stills);
   - the footsteps (none, soft steps, or a cloak swish);
   - the songs, which go in last.
