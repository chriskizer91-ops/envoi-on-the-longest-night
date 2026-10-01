# Build Plan

Chris wants to see each piece working on its own before anything is put together, and every model finished before anything else is built. Every step ends in a demo page he can open on his phone, published as a private link and saved in this repo.

Updated October 1, 2026, after the lore answers (`lore/lore-answers-2026-10-01.md`).

## Phase 1: the models

A model is finished when:

- it looks as close to its concept art as code-built 3D allows;
- every attack, summon and reaction it will use in the game works, with hit times that match the motion;
- it follows the Model Build Spec interface and stays inside its budget, so a battle with five of them on screen runs on a phone;
- its demo shows it **in a battle setting**: the Night square, with its opponents standing in their battle places. There is a button for each action, hit markers and damage numbers where the blows land, and a before/after switch against the old model.

| # | Step | What changes | Waiting on |
|---|---|---|---|
| 1 | **The shared bench** | One battle-bench page that every model plugs into, a build step that turns it into a single file, and the current models moved into their own files unchanged | Nothing |
| 2 | **Noctara** | Face, sheer veil, sculpted collar, gold filigree, a star-filled lining, a fuller build with fewer draw calls (see `model-review.md`) | Nothing |
| 3 | **Lunara** | Face, hair and gown from her sheet, less glare, the scale from the Envoi scenes, and the Embrace action | Nothing |
| 4 | **Shadow Wraith** | Tattered robe, hands and scythe in soul-green, a pale moth rising on defeat, a tougher look at higher levels | Nothing; the optional green sheet helps |
| 5 | **Great wraith** | The wraith at three times the size, with stolen lamplight inside | Its concept sheet |
| 6 | **Halcyon** | Cold blue eyes and blade edge, a retreat into the dark, a moth rising at the very end | Nothing; her sheets help |
| 7 | **The Witch** | Technical only: the shared interface and fewer draw calls. Checked pixel for pixel so nothing visible changes | Nothing |
| 8 | **Sol** | Face, bronze armor, the sun crest | Her sheets |
| 9 | **Envoi** | Paper-lantern body, a bigger head and seal, the scale and low coil from the Envoi scenes | Its sheets |
| 10 | **Wisp** | A new model, with its frost variant | Its sheets |
| 11 | **The cast** | Everyone together at true scale, every action playable | Steps 2 to 10 |

The sheets are requested in `art-requests/01-model-sheets.md`. Steps 2, 3, 4, 6 and 7 can start now. The rest start when their sheets arrive.

## Phase 2: battles

Rules live in data tables, with set damage and a random swing instead of dice, and a balance simulator that plays thousands of fights to check win rates.

| # | Demo | What it shows |
|---|---|---|
| 12 | The first fight | The Witch alone against a Shadow Wraith in the Night square, at level 1. You can lose. Experience and a level-up at the end. |
| 13 | The party | The Witch and Sol against wisps and wraiths at a chosen level: Heat and Sunburn, healing, Lunara. |
| 14 | The ambush | Halcyon, unwinnable. Sol steps in front of the Witch, and Halcyon leaves. |
| 15 | The great wraith | The Bogmire boss at about level 10. |
| 16 | Halcyon | The winnable fight at about level 20, with the Kestrel story command, ending in her retreat. Envoi is in the summon menu. |
| 17 | The final battle | Noctara with Halcyon at the dead Moonwell: Blackout, Void Sphere, Frost Dust and Crown Shards, and Envoi's ward and strike. Tuned so a player who plays it well wins about half the time. |

## Phase 3: travel

Like FF9: the world is walked on foot, and later flown over.

| # | Demo | What it shows |
|---|---|---|
| 18 | Walking | The pixel Witch, drawn in code to match her 3D outfit, walking a painted ground-level map: d-pad and tap-to-walk, a second screen, herbs and a letter at a small well, and a visible wisp that starts the 3D battle. Sliders for her pixel look and the map's lighting. |
| 19 | The Magpie | The airship flying the world map between the four stops. Its range is locked to the party's level band, and landing switches to walking. |

**The two maps.** The flying map is the world from the air: one painting, or a few joined pieces, that shows all four stops. The walking maps are the ground up close, painted at the pixel Witch's scale: the wilderness around each stop, and the stops themselves.

**The level bands.** 1 to 10 (Wickhollow and Bogmire), 10 to 20 (the Warden waystation), 20 to 30 (Misthollow). The story reason the Magpie can't go farther is still open (`questions/open.md`). The world map prompts get written once it is settled.

## Phase 4: the game

The steps joined from title to ending: the story from the lore answers, saves, menus and music.

## Technical choices

- **One three.js, r128,** for every page: all the models are built for it. The Magpie, built on r186, gets ported down.
- **Pages are single files** while they fit under 16 MB. If the whole game outgrows that, its paintings can ship as separate files in the same published page, which is still one link.
- **Bricks:** the code lives in small files (one per model, plus rules, battle, walking and airship), and a build step stitches each demo into its page, so later demos reuse earlier ones instead of copying them.
- **Checked before it ships:** every page is rendered headless and screenshotted before Chris sees it.
