# Build Plan: One Demo at a Time

Chris wants to see each aspect working on its own before everything is put together. Every step below ends in a demo: one web page, published as a private link he can open on his phone. Each demo is also saved in this repo.

Status: proposed, October 1, 2026. Nothing is built yet.

## How each demo works

- **One page.** The same single-file format as the demos Chris made, with three.js r128 loaded from cdnjs.
- **Built from bricks.** The code lives in small files (one per model, rules, battle, walking, airship), and a build step stitches them into the page. A later demo reuses the bricks from earlier ones instead of copying code.
- **Easy to judge by eye.** Model pages get a before/after switch. Pieces borrowed from other repos (the pixel walker especially) get live sliders, so Chris can tune the look himself and tell me the settings he likes.
- **Checked before it ships.** Each page is rendered headless and screenshotted, and the battle rules have tests and a balance simulator.

## The steps

Models and systems alternate, so every step shows something new and the early steps don't wait on the lore conversation.

| # | Demo | What it shows | Needs from Chris |
|---|---|---|---|
| 1 | **The cast** | All seven models side by side at true scale under the game's lighting, a turntable, and a button for every action. Each touch-up lands here with a before/after switch. | Nothing |
| 2 | **The Witch and the Wraith, ready for battle** | Both models on the shared model interface. The Witch looks and moves exactly as now (checked pixel for pixel); the Wraith gets its polish. | Nothing |
| 3 | **The first fight** | The Night square battle rebuilt on the bricks: the Witch alone against a Shadow Wraith. Set damage with a swing instead of dice, a fight you can lose, and experience and a level-up screen at the end. | Nothing |
| 4 | **Noctara, touched up** | The biggest model upgrade (see `model-review.md`). | Which sheet she should follow: `noctara-model-sheet-a.png` (simpler robe) or `-b.png` (gold filigree) |
| 5 | **Sol, touched up** | A better face, bronze armor, the sun crest. | Her model and action sheets, if he still has them |
| 6 | **The party** | The Witch and Sol against a pack of wraiths: Heat and Sunburn, healing, enemy targeting, and Lunara (touched up) as the summon. | Nothing |
| 7 | **Walking** | The pixel Witch, drawn in code to match her 3D outfit, walking on a painted map with d-pad and tap-to-walk. She crosses to a second screen and bumps a visible wraith, and the 3D battle starts in the same place. Sliders for her pixel look and the map's lighting. | Nothing to start: it can use the Night square painting and an existing Wickhollow painting |
| 8 | **The Magpie** | The airship ported to the same three.js as everything else, flying a painted world map between four landing places, with wilderness spots to discover. Landing switches to walking. | The four places (lore conversation), then a world map painting |
| 9 | **Envoi** | The touched-up wyrm, and the summon in battle at mid-game strength, growing with the Witch's level. | Its sheets, if he still has them; how it works now (lore questions 11 and 12) |
| 10 | **The knight's ambush** | The unwinnable fight against Halcyon. He breaks off before the Witch falls. | Man or woman (lore question 1); his sheets, if he still has them |
| 11 | **The final battle** | Noctara with Halcyon at her side: Blackout, Void Sphere, Frost Dust and Crown Shards, tuned so a player who plays it well wins about half the time. | Where it happens (lore question 9) and a backdrop painting |
| 12 | **The game** | The steps joined from title to ending: the story from the lore breakdown, saves, menus, music. | The lore breakdown, and paintings for each place |

The lower-level foe slots in once it is designed (lore question 16): its art sheets, then its model, then it joins the party fights and the wilderness.

## Travel, as proposed

Chris's direction: about four places the Magpie flies between, wilderness between them that can be walked but slowly, and not much running around. The proposal to try in demos 7 and 8:

- **Each place** is a handful of painted walking screens: a town, a ruin, the final stronghold.
- **The world map** is one painting of the whole region, crossed two ways:
  - **By air:** the Magpie flies it freely and lands at the four places. It's fast and has no fights.
  - **On foot:** the pixel Witch can walk the same map, slowly. Visible foes roam it, and discovery spots (hidden places, items, people) sit off the main routes.
- **Quests always name the next place,** so the player never has to wander to find the story.

## Art Chris will be asked for

Prompts go in `docs/art-requests/` as markdown, as each one becomes needed:

- Painted walking screens for the four places, once the lore conversation names them.
- A world map painting with the four landing places.
- Battle backdrops for each place, and for the final battle.
- Model and action sheets for the lower-level foe.
- Possibly fresh model sheets for Sol, Envoi or Halcyon, if the old ones are gone.

## Technical choices

- **One three.js, r128,** for every page: all seven models are built for it. The Magpie (built on r186) gets ported down, not the other way around.
- **Pages stay single files** while they fit under 16 MB. If the full game outgrows that, the paintings can ship as separate files inside the same published page. It is still one link.
- **Rules live in data tables,** not inside the animation code, so balance changes are one-line edits. The balance simulator plays thousands of fights to check win rates.
