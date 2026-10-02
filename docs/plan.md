# Build Plan

Chris wants to see each piece working on its own before anything is put together, and every model finished before anything else is built. Every step ends in a demo page he can open on his phone, published as a private link and saved in this repo.

Updated October 2, 2026, fourth round (`design-decisions.md`). This plan runs from where things stand to the finished game:

1. Finish the models.
2. Build the battles and balance them.
3. Place every fight in the story.
4. Build walking and flying.
5. Put the game together, one band at a time.

The whole game takes place at night.

## Phase 1: the models

A model is finished when:

- it looks as close to its concept art as code-built 3D allows;
- every attack, summon and reaction it will use in the game works, with hit times that match the motion;
- it follows the Model Build Spec interface and stays inside its budget, so a battle with five of them on screen runs on a phone;
- its demo shows it **in a battle setting**: the Night square, with its opponents standing in their battle places. There is a button for each action, hit markers and damage numbers where the blows land, and a before/after switch against the old model.

| # | Step | What changes | State |
|---|---|---|---|
| 1 | **The shared bench** | One battle-bench page that every model plugs into, a build step that turns it into a single file, and the current models moved into their own files unchanged | Done |
| 2 | **Noctara** | Face, sheer veil, sculpted collar, gold filigree, a star-filled lining, a fuller build with fewer draw calls (see `model-review.md`) | Done; page rebuilt with the finished cast on October 2 |
| 3 | **Lunara** | Face, hair and gown from her sheet, less glare, the scale from the Envoi scenes, and the Embrace action | Done |
| 4 | **Shadow Wraith** | Tattered robe, hands and scythe in soul-green, a pale moth rising on defeat, a tougher look at higher levels | Done |
| 5 | **Great wraith** | The wraith at three times the size, with stolen lamplight inside | Done |
| 6 | **Halcyon** | Cold blue eyes and blade edge, a retreat into the dark, a moth rising at the very end; then refined against her new sheets | Done |
| 7 | **Io, the Witch** | Technical only: the shared interface and fewer draw calls, checked pixel for pixel so nothing visible changes. Her four spells (Lunar Mend, Waxing Light, Moonsteel, Moth Veil) play on her existing motions, with their own effects | Done |
| 8 | **Sol** | Face, bronze armor, the sun crest, and her new Kestrel Stoop: a turn hovering, then the biggest sword hit in the game | Done |
| 9 | **Envoi** | Paper-lantern body, a bigger head and seal, the scale and low coil from the Envoi scenes | Done |
| 10 | **Wisp** | A new model, with its frost variant | Done |
| 10b | **The polish round** | Every item on every model's "what's left" list (below), plus the shared bench and tool fixes | Next |
| 11 | **The cast** | Everyone together at true scale, every action playable against any target, and every attack visual sized for the battle camera | After 10b |

### 10b: the polish round

Each model gets its page rebuilt and republished after its polish. Noctara's list is empty.

| Model | What's left |
|---|---|
| Shared files | `bench.css` miss style; in `bench.js`, a Before model of another actor kind, placing by meters, dashes aimed along the target line, and a real walk phase for Io; in `check.mjs`, a fix for a fresh copy of the repo, a wait before each screenshot, and shots of actions on original models; a choice of close-up anchor in `turnaround`; the lantern cutout that covers Lunara's skirt behind the well; a faint line across the painting in close view |
| Lunara | The sheet's heavier skirt chains; her pointed ears |
| Io | Spell effects scaled up for the battle camera. Her look and motions stay exactly as they are. |
| Wisp | A darker, fuller smoke tail; stronger tears in the hollow; the frost variant checked in every action |
| Wraith and great wraith | A scythe head and hem closer to the sheet; switching to the great wraith without reloading the page |
| Sol | Wispier hair, a rounder face, the cape over her shoulders, and smaller code (140 KB now) |
| Envoi | A full ring round the foe in the strike; a dark splash when the ward takes a hit; the tail kept clear of Io; longer bipyramid lanterns |
| Halcyon | Light-Drinker's streams and Black Noon's swirls as ribbons; the brief cut line in the retreat around u 0.65; her face, which is rounder than the sheets' gaunt one (see `questions/open.md`) |

### 11: the cast page

- All nine models in the Night square at true scale: Io and Sol on one side, and any mix of wisps, wraiths, the great wraith, Halcyon and Noctara on the other, with Lunara and Envoi summoned in.
- Any action can be aimed at any target. This turns each page's own effects into shared effect bricks (`src/fx/`) that the battle reuses.
- Every attack visual is checked at the battle camera's size and fixed where it reads too small or too big.
- A phone speed check with five models and their effects on screen.

## Phase 2: the battles

The battle is built from bricks: rules in data tables, a battle screen that reads them, and a balance simulator that plays thousands of fights to check win rates. There are no dice: every move has a set amount, with a random swing of up to 25% either way.

### The groundwork (before the first fight)

| Brick | What it is |
|---|---|
| **Rules tables** | Every hero and foe as data: HP, MP, turn speed, and each move's level 1 number, cost, target, element and effect. Everything grows about 20% a level from level 1 (`design-decisions.md`). |
| **The level curve** | A basic hit of about 100 at level 1, 500 at level 10 and 3,200 at level 20. Foes grow the same way, so a fight at the party's level lasts as long at 20 as at 1. |
| **Battle rules** | Turn gauges for up to two heroes and three foes; Trance; Heat and Sunburn; summons (Lunara from the start, Envoi from Dawnroost, with Sol at 70 Heat or more); herbs as items; elements (Moon against shadow foes, Sun against Halcyon); statuses (Bound, Sundered, Severed, Frost, Moth Veil, Folding Ward, Guard, Warden's Vow, Blackout). |
| **The balance simulator** | A script that plays each fight thousands of times with three play styles (careless, sensible, expert) and reports win rates, fight length and close calls. It checks the targets below every time a number changes. |
| **The battle screen** | Command menus as in the Night square demo, turn bars, HP and MP, Trance and Heat gauges, big damage numbers, a phone layout, experience and level-ups at the end. |
| **Battle backdrops** | Any night painting with its own matched camera, walk area, cutouts and lamps (the format the Night square already uses). New paintings come from `art-requests/03-battle-backdrops.md`. The four night battle paintings in `20-min` can stand in until they arrive; they come with matched cameras. |

### The balance targets

| Fight | Target |
|---|---|
| The first fight | Winnable at level 1, but a player who chooses badly can lose |
| Ordinary fights | About a minute or two at the party's level; easier a few levels above |
| The ambush | Can't be won; it ends when Sol steps in front of Io |
| The great wraith | A real test at about level 5 |
| Halcyon | Level 20 against a party at 15 or more; it ends in defeat, or in her retreat at 20% HP |
| The finale | An expert at level 20 wins about half the time; at 19 a player loses, but narrowly; below that it can't be won |

### The battle demos

| # | Demo | What it shows |
|---|---|---|
| 12 | The first fight | Io alone against a Shadow Wraith in the Night square, at level 1, with the Night square demo's numbers. You can lose. Experience and a level-up at the end. |
| 13 | The party | Io and Sol against wisps and wraiths at a chosen level: Heat and Sunburn, Waxing Light and Moonsteel, Lunara. A level slider from 1 to 20 shows the numbers growing. |
| 14 | The ambush | Halcyon, unwinnable. Sol steps in front of Io, and Halcyon leaves. |
| 15 | The great wraith | The Bogmire boss at about level 5. Winning leads to the refit and Moth Veil. |
| 16 | Halcyon | The level 15 gate, in the wilderness: Halcyon at level 20 against the party at 15 or more, with the Kestrel story command. It ends with Halcyon defeating the party, or, if they bring her down to 20% of her HP, with her retreat into the dark. Envoi is in the summon menu. Afterwards Sol learns Kestrel Stoop. |
| 17 | The final battle | Noctara with Halcyon at level 20, at the dead Moonwell in Misthollow: Blackout, Void Sphere, Frost Dust and Crown Shards, Moth Veil against the telegraphed hits, and Envoi's ward and strike. Tuned so a player who plays well at level 20 wins about half the time, and loses narrowly at 19. |

## Phase 3: the story's fights

Every fight gets its place in the story before travel is built, so the maps are painted and traced around them. It is drafted on paper first, then the simulator plays the whole chain in order, carrying HP, MP and herbs from fight to fight, to check that a player who goes straight through arrives at each gate at the right level.

Fights are never invisible random encounters. Foes stand on the walking map, as in Aethermoor: placed fights and visible packs that spot and chase Io. That lets every fight be counted and placed.

The first draft, to settle with Chris:

| Band | Levels | Places | Fights |
|---|---|---|---|
| 1 | 1 to 5 | Wickhollow, the Gloamwood road, the Thornwood, Bogmire | The Night square wraith (Io alone). Sol joins. Wisps, then wraiths, in packs of one to three. The ambush (Halcyon, unwinnable). The great wraith at Bogmire. |
| 2 | 5 to 10 | The Warm Roads hills, Dawnroost | Wisps and wraiths in bigger packs, along roads with dark nodes for Sol to relight. Envoi is made at Dawnroost. |
| 3 | 10 to 15 | The northern wilds | Wraith packs; the first frost wisps as the cold sets in. Halcyon at the level 15 gate. |
| 4 | 15 to 20 | The frozen north, Misthollow | Frost wisps and wraiths at full strength. Noctara and Halcyon at the dead Moonwell. |

To settle with Chris (`questions/open.md`): how long the whole game should take, how many fights that means, whether wilderness packs come back after a rest (so a player can level for the finale), and whether the foe list needs more variety than wisps and wraiths over about 60 fights.

## Phase 4: travel

As in FF9: the world is walked on foot, and later flown over. All of it at night.

| # | Demo | What it shows |
|---|---|---|
| 18 | Walking | The pixel Io, drawn in code to match her 3D outfit, walking one of Chris's close aerial night maps: d-pad and tap-to-walk, a second screen, herbs and a letter at a small well, and a visible wisp that starts the 3D battle. Sliders for her pixel look and the map's lighting. |
| 19 | The Magpie | The airship flying the far view of the world between the stops. Its four levels (refit, charge, final upgrade) set how far it can fly, and landing switches to walking. |

**The maps.** Chris is painting nine highly detailed images of the world, with night versions. The far view from the Magpie is the whole world, scaled down and compressed, since it doesn't need full detail. The walking maps are cut from the detailed images at the pixel Io's scale. A phone-friendly tracing tool marks where she can walk, what she walks behind, and the exits.

**The level bands.** Four bands, 1 to 5, 5 to 10, 10 to 15 and 15 to 20, opened by the Bogmire refit, the charge at Dawnroost's living node, and the upgrade after Halcyon. Sunstone gives the Magpie its lift, and Noctara's cold drains it. A band the ship can't reach yet sits under cold mist on the flying map.

## Phase 5: the game

The pieces joined from title to ending, one band at a time.

1. **Band 1 first, as a playable slice:** the title, the Night square, Sol joining, the Magpie, the ambush, Bogmire and the great wraith, ending at the refit. This is where pacing and balance are checked in real play before the rest is built.
2. **Bands 2, 3 and 4,** each playable when finished.
3. **The ending:** Envoi's last strike, the letters burning, the stars coming back.

Around them:

- **Story scenes:** big beats as painted stills with camera moves and dialogue, as FF9 did with its FMVs. Their prompts will go in `art-requests/`.
- **Menus and saves:** party status, spells, herbs; saves kept in the browser.
- **Music and sound:** the synthesized music and effects from the Night square demo, plus the sound library in `20-min`.
- **The key art** (`../reference/art/key-art-advert.png`) as a poster: a loading screen or the back of the title.

## Art, and when each piece is needed

| Phase | Art | State |
|---|---|---|
| 1 | Model and action sheets | All in (`art-requests/01-model-sheets.md`) |
| 2 | Battle backdrops for the bands and the finale | Prompts ready: `art-requests/03-battle-backdrops.md` |
| 4 | The world maps: nine detailed images and night versions | Chris is painting them; `art-requests/02-world-map.md` has the first prompts |
| 5 | Story stills; close-up walking pieces for the towns if the maps need them | Later requests |

## Technical choices

- **One three.js, r128,** for every page: all the models are built for it. The Magpie, built on r186, gets ported down.
- **Pages are single files** while they fit under 16 MB. When the game outgrows that, its paintings ship as separate files in the same published page, which is still one link.
- **Bricks:** the code lives in small files (one per model, plus rules, battle, walking and airship), and a build step stitches each demo into its page, so later demos reuse earlier ones instead of copying them.
- **Checked before it ships:** every page is rendered headless and screenshotted before Chris sees it.
- **Images are compressed** to WebP at the size each view needs, so the detailed maps and paintings stay light on a phone.
