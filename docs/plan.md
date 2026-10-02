# Build Plan

Chris wants to see each piece working on its own before anything is put together, and every model finished before anything else is built. Every step ends in a demo page he can open on his phone, published as a private link and saved in this repo.

Updated October 2, 2026, sixth round (`design-decisions.md`). This plan runs from where things stand to the finished game, about five hours of play:

1. Finish the models.
2. Build the battles and balance them.
3. Place every fight in the story.
4. Build walking and flying.
5. Put the game together, one band at a time.

The whole game takes place at night. The final deliverable is one HTML file of about 30 MB at most (see "Size" at the end).

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
| 10b | **The polish round** | Every item on every model's "what's left" list (below), plus the shared bench and tool fixes | Done |
| 11 | **The cast** | Everyone together at true scale, every action playable against any target, and every attack visual sized for the battle camera | Next |

### 10b: the polish round

Each model gets its page rebuilt and republished after its polish. Noctara's list is empty.

| Model | What's left |
|---|---|
| Shared files | `bench.css` miss style; in `bench.js`, a Before model of another actor kind, placing by meters, dashes aimed along the target line, and a real walk phase for Io; in `check.mjs`, a fix for a fresh copy of the repo, a wait before each screenshot, and shots of actions on original models; a choice of close-up anchor in `turnaround`; the lantern cutout that covers Lunara's skirt behind the well; a faint line across the painting in close view |
| Lunara | Done: heavier skirt chains with cross charms, and pointed ears |
| Io | Done: her new spells' effects sized for the battle camera. Her look and motions are unchanged. |
| Wisp | Done: a darker, fuller smoke tail with strands that part and curl; deeper tears in the hollow with pale lips; the frost variant checked in all nine actions |
| Wraith and great wraith | Done: the scythe's ornate openwork head with burning slots, a hem of fewer, longer, wavier tails with the green climbing up them, and the great wraith switched in place |
| Sol | Done: wispier hair with a fringe across her forehead, a rounder face, the cape over her shoulders, and Ember Rush aimed at the wraith. Her 140 KB of code has no unused parts; the final build can minify it |
| Envoi | Done: longer lanterns pointed at both ends; the strike's ring sized from its body so it closes round the foe; a dark splash thrown off the ward when it takes a blow; its place on the bench moved so its coils keep at least 1.6 m from Io |
| Halcyon | Done: Light-Drinker's streams of stolen light as ribbons from her target and round her into the blade; Black Noon's swirls as dark bands spiraling up into the black sun; the retreat sinks into the dark instead of a hard cut. Her face stays as it is. |

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
| **The battle screen** | A camera director that pulls back to a wide shot for every summon (Lunara, Envoi) and big attack, so the whole creature is in frame; command menus as in the Night square demo, turn bars, HP and MP, Trance and Heat gauges, big damage numbers, a phone layout, experience and level-ups at the end. |
| **Battle backdrops** | Any night painting with its own matched camera, walk area, cutouts and lamps (the format the Night square already uses). All eight from `art-requests/03-battle-backdrops.md` are in `art/backdrops/`; each needs its camera matched and its lamps traced. |

### The balance targets

| Fight | Target |
|---|---|
| The first fight | Winnable at level 1, but a player who chooses badly can lose |
| Wild fights | About a minute or two at the party's level; easier a few levels above |
| Gate fights | A little harder than the wild fights around them |
| The great wraith | The level 5 gate |
| Dawnroost | The level 10 gate: the largest group of stronger wraiths so far |
| Halcyon's ambush | The level 15 gate: Halcyon at 20 against a party at 15 or more, overwhelming, the exception to "a little harder". It ends with the party falling, or with her retreat at 20% HP |
| The finale | An expert at level 20 wins about half the time; at 19 a player loses, but narrowly; below that it can't be won |

### The battle demos

| # | Demo | What it shows |
|---|---|---|
| 12 | The first fight | Io alone against a Shadow Wraith in the Night square, at level 1, with the Night square demo's numbers. You can lose. Experience and a level-up at the end. |
| 13 | The party | Io and Sol against wisps and wraiths at a chosen level: Heat and Sunburn, Waxing Light and Moonsteel, Lunara. A level slider from 1 to 20 shows the numbers growing. |
| 14 | The great wraith | The Bogmire boss, the level 5 gate. Winning leads to the refit and Moth Veil. |
| 15 | Dawnroost | The level 10 gate, at the living node: the largest group of stronger wraiths the party has faced. Envoi comes with it. |
| 16 | Halcyon's ambush | The level 15 gate, on the way to the shipyard: Halcyon at level 20 against the party at 15 or more, overwhelming, with the Kestrel story command and Envoi in the summon menu. It ends with the party falling, Sol stepping in front of Io and Halcyon leaving; or, if they bring her down to 20% of her HP, with her retreat into the dark. Afterwards Sol learns Kestrel Stoop. |
| 17 | The final battle | Noctara with Halcyon at level 20, at the dead Moonwell in Misthollow: Blackout, Void Sphere, Frost Dust and Crown Shards, Moth Veil against the telegraphed hits, and Envoi's ward and strike. Tuned so a player who plays well at level 20 wins about half the time, and loses narrowly at 19. |

## Phase 3: the story's fights

Every fight gets its place in the story before travel is built. It is drafted on paper first, then the simulator plays the whole chain in order, carrying HP, MP and herbs from fight to fight, to check that a player who goes straight through arrives at each gate at the right level.

**How fights happen:**

- **Towns are safe.** People to talk to: shops, and people with information.
- **The wilds have random encounters.** No foes are drawn on the map. Each step in wild country fills a hidden counter, and a fight starts when it passes a random threshold. That keeps the rate even: never two fights back to back, and never a long walk with none. Each area has its own rate, and the rate is a number the balancing tunes. A player can walk back and forth to grind levels.
- **Set fights** wait at fixed places: the gate fights and the story fights.
- **Money.** Fights give money. The Magpie's upgrades cost money and need the party's level, so moving on to the next band takes both. Shops sell herbs. The simulator balances money too: what a player has earned by each gate.

**About five hours:** the story, about 60 wild fights from level 1 to 20 against wisps, frost wisps, wraiths and the great wraith, and the set fights.

The first draft. The places are marked on `../reference/art/world-map/bands-and-stops.webp`, which Chris confirmed:

| Band | Levels | Where on the world map | Places | Fights |
|---|---|---|---|---|
| 1 | 1 to 5 | The southwest and the southern wetlands | Wickhollow, Bogmire | The Night square wraith (Io alone). Sol joins. Wild wisps, then wraiths. The great wraith at Bogmire's dark heart (gate). |
| 2 | 5 to 10 | The western forests and riverlands | The Warm Roads, Dawnroost | Wild wisps and wraiths in bigger packs, along roads with dark nodes for Sol to relight. The largest group of stronger wraiths so far, at Dawnroost's living node (gate), and Envoi. |
| 3 | 10 to 15 | The northwest and the northern passage | The northern wilds, the shipyard | Wild wraith packs; the first frost wisps as the cold sets in. Halcyon's ambush on the way to the shipyard (gate). |
| 4 | 15 to 20 | The snowy northeast peaks | Misthollow and the dead Moonwell | Frost wisps and wraiths at full strength. Noctara and Halcyon (the finale). |

## Phase 4: travel

As in FF9: the world is walked on foot, and later flown over. All of it at night.

| # | Demo | What it shows |
|---|---|---|
| 18 | Walking | The pixel Io, drawn in code to match her 3D outfit, walking the night world map and one ground-level map: d-pad and tap-to-walk, a town with a shopkeeper and someone to talk to, herbs and a letter at a small well, and a random encounter in the wilds that starts the 3D battle. Sliders for her pixel look, the map's lighting and the encounter rate. |
| 19 | The Magpie | The airship flying the far view of the world between the stops, through the drifting clouds and fog of `reference/demos/the-magpie.html`. Its four levels (refit, charge, final upgrade) set how far it can fly, and landing switches to walking. |

**The maps:**

- **The world map** is Chris's nine detailed tiles in a 3×3 grid, 4608×3072 in all, north up, in day and night versions (`../reference/art/world-map/`); the game uses the night ones, with their joins blended in code. The pixel Io walks it at full detail between places, and the random fights happen in its wild country.
- **The far view** from the Magpie is the same world, scaled down, since it doesn't need full detail.
- **Ground-level maps** are entered from the world map: the towns and the set-fight places (`art-requests/04-walking-maps.md`).
- A phone-friendly tracing tool marks where Io can walk, what she walks behind, the town entrances and the wild areas, once per tile; the day and night versions share it.

**The level bands.** Four bands, 1 to 5, 5 to 10, 10 to 15 and 15 to 20, opened by the Bogmire refit, the charge at Dawnroost's living node, and the upgrade after Halcyon. Sunstone gives the Magpie its lift, and Noctara's cold drains it. A band the ship can't reach yet sits under cold mist on the flying map. The central island capital, the east and the southeast are under mist all game: they aren't in the story.

## Phase 5: the game

The pieces joined from title to ending, one band at a time.

1. **Band 1 first, as a playable slice:** the title, the Night square, Sol joining, the Magpie, the wilds, Bogmire and the great wraith, ending at the refit. This is where pacing and balance are checked in real play before the rest is built.
2. **Bands 2, 3 and 4,** each playable when finished.
3. **The ending:** Envoi's last strike, the letters burning, the stars coming back.

Around them:

- **Story scenes:** big beats as painted stills with camera moves and dialogue, as FF9 did with its FMVs. Their prompts will go in `art-requests/`.
- **Towns:** shopkeepers and people with information.
- **Menus and saves:** party status, spells, herbs; saves kept in the browser.
- **Music and sound:** the synthesized music and effects from the Night square demo, plus the sound library in `20-min`.
- **The key art** (`../reference/art/key-art-advert.png`) as a poster: a loading screen or the back of the title.

## Art, and when each piece is needed

| Phase | Art | State |
|---|---|---|
| 1 | Model and action sheets | All in (`art-requests/01-model-sheets.md`) |
| 2 | Eight night battle backdrops | All in (`art-requests/03-battle-backdrops.md`) |
| 4 | The world map: nine tiles in a 3×3 grid | Day and night versions in |
| 4 | Ground-level maps: towns, the shipyard and set-fight places | Prompts ready, pilot first (`art-requests/04-walking-maps.md`) |
| 5 | Story stills | A later request |

## Technical choices

- **One three.js, r128,** for every page: all the models are built for it. The Magpie, built on r186, gets ported down.
- **Bricks:** the code lives in small files (one per model, plus rules, battle, walking and airship), and a build step stitches each demo into its page, so later demos reuse earlier ones instead of copying them.
- **Checked before it ships:** every page is rendered headless and screenshotted before Chris sees it.
- **Images are compressed** to WebP at the size each view needs (`tools/compress.mjs`), and the originals stay in `../reference/art/`.
- **The final build minifies the code** (models, effects, battle) to keep the single file inside its budget; the source stays readable.

## Size

The final deliverable is one HTML file with everything inside it, about 30 MB at most, sent to Chris to keep. A published page can be 16 MB at most, so the published game is one link with its paintings as separate files beside the page.

A first budget, with the paintings compressed:

| Part | About |
|---|---|
| The code: models, effects, battle, walking, airship, music | 3 MB |
| The world map at night: nine tiles, plus the far view | 5 MB |
| Eight battle backdrops and the Night square | 4 MB |
| About twelve ground-level maps | 6 MB |
| Story stills and the title | 4 MB |
| **Total** | **about 22 MB** |
