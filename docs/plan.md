# Build Plan

Chris wants to see each piece working on its own before anything is put together, and every model finished before anything else is built. Every step ends in a demo page he can open on his phone, published as a private link and saved in this repo.

Updated October 2, 2026, after Chris's second round of answers (`design-decisions.md`): four level bands up to level 20, a reward at every gate, Io's four spells and Sol's Kestrel Stoop.

## Phase 1: the models

A model is finished when:

- it looks as close to its concept art as code-built 3D allows;
- every attack, summon and reaction it will use in the game works, with hit times that match the motion;
- it follows the Model Build Spec interface and stays inside its budget, so a battle with five of them on screen runs on a phone;
- its demo shows it **in a battle setting**: the Night square, with its opponents standing in their battle places. There is a button for each action, hit markers and damage numbers where the blows land, and a before/after switch against the old model.

| # | Step | What changes | Waiting on |
|---|---|---|---|
| 1 | **The shared bench** (done) | One battle-bench page that every model plugs into, a build step that turns it into a single file, and the current models moved into their own files unchanged | Nothing |
| 2 | **Noctara** (done; second pass October 3) | Face, sheer veil, sculpted collar, gold filigree, a star-filled lining, a fuller build with fewer draw calls. The second pass: black silk in deep folds, metal gold, a lining that opens on the night sky, bigger spells and a defeat into stars (see `model-review.md`) | Nothing |
| 3 | **Lunara** (done) | Face, hair and gown from her sheet, less glare, the scale from the Envoi scenes, and the Embrace action | Nothing |
| 4 | **Shadow Wraith** (done) | Tattered robe, hands and scythe in soul-green, a pale moth rising on defeat, a tougher look at higher levels | Nothing; the optional green sheet helps |
| 5 | **Great wraith** (done) | The wraith at three times the size, with stolen lamplight inside | Nothing (sheets in) |
| 6 | **Halcyon** | Cold blue eyes and blade edge, a retreat into the dark, a moth rising at the very end; then refined against her new sheets | Nothing |
| 7 | **Io, the Witch** (done) | Technical only: the shared interface and fewer draw calls, checked pixel for pixel so nothing visible changes. Her four spells (Lunar Mend, Waxing Light, Moonsteel, Moth Veil) play on her existing motions, with their own effects | Nothing |
| 8 | **Sol** (done) | Face, bronze armor, the sun crest, and her new Kestrel Stoop: a turn hovering, then the biggest sword hit in the game | Nothing (sheets in) |
| 9 | **Envoi** (done) | Paper-lantern body, a bigger head and seal, the scale and low coil from the Envoi scenes | Nothing (sheets in) |
| 10 | **Wisp** (done) | A new model, with its frost variant | Nothing (sheets in) |
| 11 | **The cast** | Everyone together at true scale, every action playable | Steps 2 to 10 |

The sheets were requested in `art-requests/01-model-sheets.md`, and all of them arrived on October 2, 2026. Every step can now run.

## Phase 2: battles

Rules live in data tables, with set damage and a random swing instead of dice, and a balance simulator that plays thousands of fights to check win rates.

| # | Demo | What it shows |
|---|---|---|
| 12 | The first fight | Io alone against a Shadow Wraith in the Night square, at level 1, with the Night square demo's numbers. You can lose. Experience and a level-up at the end. |
| 13 | The party | Io and Sol against wisps and wraiths at a chosen level: Heat and Sunburn, Waxing Light and Moonsteel, Lunara. |
| 14 | The ambush | Halcyon, unwinnable. Sol steps in front of Io, and Halcyon leaves. |
| 15 | The great wraith | The Bogmire boss at about level 5. Winning leads to the refit and Moth Veil. |
| 16 | Halcyon | The level 15 gate, in the wilderness: Halcyon at level 20 against the party at 15 or more, with the Kestrel story command. It ends with Halcyon defeating the party, or, if they bring her down to 20% of her HP, with her retreat into the dark. Envoi is in the summon menu. Afterwards the fight stirs Sol's memory and she learns Kestrel Stoop. |
| 17 | The final battle | Noctara with Halcyon at level 20, at the dead Moonwell in Misthollow: Blackout, Void Sphere, Frost Dust and Crown Shards, Moth Veil against the telegraphed hits, and Envoi's ward and strike. Tuned so a player who plays well at level 20 wins about half the time, and loses narrowly at 19. |

## Phase 3: travel

Like FF9: the world is walked on foot, and later flown over.

| # | Demo | What it shows |
|---|---|---|
| 18 | Walking | The pixel Witch, drawn in code to match her 3D outfit, walking a painted ground-level map: d-pad and tap-to-walk, a second screen, herbs and a letter at a small well, and a visible wisp that starts the 3D battle. Sliders for her pixel look and the map's lighting. |
| 19 | The Magpie | The airship flying the world map between the stops. Its four levels (refit, charge, final upgrade) set how far it can fly, and landing switches to walking. |

**The two maps.** The flying map is the world from the air: one painting, or a few joined pieces, that shows all four stops. The walking maps are the ground up close, painted at the pixel Witch's scale: the wilderness around each stop, and the stops themselves.

**The level bands.** Four bands, 1 to 5, 5 to 10, 10 to 15 and 15 to 20, opened by the Bogmire refit, the charge at Dawnroost's living node, and the upgrade after Halcyon. Sunstone gives the Magpie its lift, and Noctara's cold drains it. The bands hold Wickhollow and Bogmire (1), Dawnroost (2), the wilderness where the party meets Halcyon (3), and Misthollow (4). The world map prompts are in `art-requests/02-world-map.md`.

## Phase 4: the game

The steps joined from title to ending: the story from the lore answers, saves, menus and music. Chris's key art (`../reference/art/key-art-advert.png`) can serve as a poster: a loading screen or the back of the title.

## Technical choices

- **One three.js, r128,** for every page: all the models are built for it. The Magpie, built on r186, gets ported down.
- **Pages are single files** while they fit under 16 MB. If the whole game outgrows that, its paintings can ship as separate files in the same published page, which is still one link.
- **Bricks:** the code lives in small files (one per model, plus rules, battle, walking and airship), and a build step stitches each demo into its page, so later demos reuse earlier ones instead of copying them.
- **Checked before it ships:** every page is rendered headless and screenshotted before Chris sees it.
