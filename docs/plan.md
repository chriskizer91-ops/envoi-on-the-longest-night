# Build Plan

Chris wants to see each piece working on its own before anything is put together, and every model finished before anything else is built. Every step ends in a demo page he can open on his phone, published as a private link and saved in this repo.

Updated October 2, 2026, seventh round (`design-decisions.md`). This plan runs from where things stand to the finished game, about five hours of play:

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
| 2 | **Noctara** | Face, sheer veil, sculpted collar, gold filigree, a star-filled lining, a fuller build with fewer draw calls (see `model-review.md`) | Done; page rebuilt with the finished cast on October 2. Second pass October 3: black silk in deep folds, metal gold, a lining that opens on the night sky, bigger spells and a defeat into stars (see `model-review.md`) |
| 3 | **Lunara** | Face, hair and gown from her sheet, less glare, the scale from the Envoi scenes, and the Embrace action | Done |
| 4 | **Shadow Wraith** | Tattered robe, hands and scythe in soul-green, a pale moth rising on defeat, a tougher look at higher levels | Done |
| 5 | **Great wraith** | The wraith at three times the size, with stolen lamplight inside | Done |
| 6 | **Halcyon** | Cold blue eyes and blade edge, a retreat into the dark, a moth rising at the very end; then refined against her new sheets | Done |
| 7 | **Io, the Witch** | Technical only: the shared interface and fewer draw calls, checked pixel for pixel so nothing visible changes. Her four spells (Lunar Mend, Waxing Light, Moonsteel, Moth Veil) play on her existing motions, with their own effects | Done |
| 8 | **Sol** | Face, bronze armor, the sun crest, and her new Kestrel Stoop: a turn hovering, then the biggest sword hit in the game | Done |
| 9 | **Envoi** | Paper-lantern body, a bigger head and seal, the scale and low coil from the Envoi scenes | Done |
| 10 | **Wisp** | A new model, with its frost variant | Done |
| 10b | **The polish round** | Every item on every model's "what's left" list (below), plus the shared bench and tool fixes | Done |
| 11 | **The cast** | Everyone together at true scale, every action playable against any target, and every attack visual sized for the battle camera | First version published; waiting on the phone check |

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
| **Battle rules** | Turn gauges for up to two heroes and three foes; Trance; Heat and Sunburn; summons (Lunara from the start, Envoi from Dawnroost, with Sol at 70 Heat or more); herbs as items; elements (Moon against shadow foes, Sun against Halcyon); statuses (Bound, Sundered, Severed, Frost, Folding Ward, Guard, Warden's Vow, Blackout, and the Bramble Horror's Lured and Held). Moth Veil was replaced by Harvest Moon on October 3. |
| **The balance simulator** | A script that plays each fight thousands of times with three play styles (careless, sensible, expert) and reports win rates, fight length and close calls. It checks the targets below every time a number changes. |
| **The battle screen** | A camera director that pulls back to a wide shot for every summon (Lunara, Envoi) and big attack, so the whole creature is in frame; command menus as in the Night square demo, turn bars, HP and MP, Trance and Heat gauges, big damage numbers, a phone layout, experience and level-ups at the end. |
| **Battle backdrops** | Any night painting with its own matched camera, walk area, cutouts and lamps (the format the Night square already uses). All eight from `art-requests/03-battle-backdrops.md` are in `art/backdrops/`; each needs its camera matched and its lamps traced. |

**The groundwork is built (October 2):** the rules tables (`../src/battle/rules.js`), a battle engine that runs without graphics (`engine.js`), and the simulator with its three play styles (`sim.js`, run by `../tools/balance.mjs`). Every target below is met; the report is `balance-report.md`, and the balance page plays any fight turn by turn. The battle screen is next, with step 12.

### The balance targets

| Fight | Target |
|---|---|
| The first fight | A player who pays attention doesn't lose; a careless one often does (Chris, October 2) |
| Wild fights | About a minute or two. Each foe is a level in its band's range (1 to 5, 6 to 10, 11 to 15, 16 to 20), so a band is dangerous to enter and easy by its end |
| Gate fights | A little harder than the wild fights around them |
| The great wraith | The level 5 gate |
| Dawnroost | The level 10 gate: the largest group of stronger wraiths so far |
| Halcyon's ambush | The level 15 gate: Halcyon at 20 against a party at 15 or more, overwhelming, the exception to "a little harder". It ends with the party falling, or with her retreat at 20% HP |
| The finale | An expert at level 20 wins about half the time; at 19 a player loses, but narrowly; below that it can't be won |

**The progression pass (Chris, October 2):** wild foes are a level in their band's range; the experience curve gives about 79 wild fights, 40% of them in the last band, a little harder after the first couple of levels; the average (attentive) player loses sometimes, mostly entering a band and at the gates, and rarely wins the finale; no difficulty setting. An expert is all but certain to win until about level 15. Still to do in phase 3: the shards' prices (the Magpie and the shops), and the whole chain of fights played in order.

### The battle demos

| # | Demo | What it shows |
|---|---|---|
| 12 | The first fight | Io alone against a Shadow Wraith in the Night square, at level 1, with the Night square demo's numbers. You can lose. Experience and a level-up at the end. |
| 13 | The party | Io and Sol against wisps and wraiths at a chosen level: Heat and Sunburn, Waxing Light and Moonsteel, Lunara. A level slider from 1 to 20 shows the numbers growing. |
| 14 | The great wraith | The Bogmire boss, the level 5 gate. Winning leads to the refit and Harvest Moon (Moth Veil until October 3). |
| 15 | Dawnroost | The level 10 gate, at the living node: the largest group of stronger wraiths the party has faced, without Envoi. Envoi is made after it, as the reward. |
| 16 | Halcyon's ambush | The level 15 gate, on the way to the shipyard: Halcyon at level 20 against the party at 15 or more, overwhelming, with the Kestrel story command and Envoi in the summon menu. Sol recognizes her during the fight. It ends with the party falling, Sol stepping in front of Io and Halcyon leaving; or, if they bring her down to 20% of her HP, with her retreat into the dark. Afterwards Sol learns Kestrel Stoop. |
| 17 | The final battle | Noctara with Halcyon at level 20, at the dead Moonwell in Misthollow: Blackout, Void Sphere, Frost Dust and Crown Shards; Defend, Kestrel Stoop's dodge, Lunara and Envoi's ward against the telegraphed hits. Tuned so a player who plays well at level 20 wins about half the time, and loses narrowly at 19. The cold deepening shows on screen, and Halcyon kneels when she falls. |

**Step 17 is built (October 3):** `demos/finale.html`. Io and Sol, at a level from 17 to 20, against Noctara and Halcyon, both at 20, at Misthollow's dead Moonwell (`src/stage/dead-moonwell.js`: Bogmire's matched camera at 54 pixels a meter, two braziers, and a band of sky where the stars come back). Noctara has Crown Shards, Void Sphere gathered a turn ahead, Frost Dust (the party slows and the blow lands as the frost thaws) and Blackout (the world goes dark and Halcyon strikes unseen). Her cold deepens 11.5% with every turn she takes and shows by her name and at the screen's edges. Halcyon kneels on her planted blade when she falls. The ending is lore answer 10: Envoi's last strike sends the letters, their light rises, the stars come back, Noctara becomes night with stars in it, and Halcyon goes home as a moth. A test at level 20 played the whole ending with no errors.

**Phase 3 is done (October 3):** the whole journey is data (`src/game/story.js`), and the simulator plays it in order (`src/battle/chain.js`, `tools/chain.mjs`), carrying HP, MP and herbs from fight to fight (`design-decisions.md`, twenty-second round). The balance page shows it step by step.

**The Bramble Horror is built (October 3),** Chris's new wild foe: `demos/bramble.html`. One wild fight in five, always alone, in four forms (Classic Horror, Low Ambush, Towering Reach and the Ancient Crown), on the Thornwood bridge painting (`src/stage/thornwood-bridge.js`). Its model is Chris's, unchanged (`src/models/bramble.js`). Lure then Grab, Consume, Thorn Sweep, Strike and Undergrowth; it fears fire, and a heavy blade severs its canes. The wild-fight targets now measure the packs, and the Bramble has its own (`design-decisions.md`, twenty-first round).

**Step 16 is built (October 3):** `demos/halcyon-ambush.html`. Io and Sol, at a level from 15 to 20, against Halcyon at 20 at the northern crossroads on the road to the shipyard, the gate out of band 3. The painting's camera is matched from its paved circle (`src/stage/northern-crossroads.js`: 23° pitch, the long 12° lens, 58 pixels a meter), lit by the lantern on the old well and the ember in a toppled waymarker. She is "The Gloam Knight" until Sol knows her stance (her third turn, half her HP or her Warden's Vow); then her name becomes Halcyon and Sol can call to her once with Kestrel, which costs her a turn. Her moves are her model's own: Gloam Cleave, Dusk Arc, Severance, Light-Drinker, Warden's Vow with its counter, and Black Noon charged a turn ahead. Io has Harvest Moon and Envoi. It ends with her retreat into the dark at 20%, or with the party falling, Sol standing over Io and Halcyon leaving; either way Sol learns Kestrel Stoop, springing up to hang in the air like a kestrel. Every line is a placeholder for the lore conversation.

**Step 15 is built (October 3):** `demos/dawnroost.html`. Io and Sol, at a level from 8 to 13, against three level 12 wraiths in the courtyard of Dawnroost's Warden waystation, the gate out of band 2, without Envoi; Io has Moth Veil from the Bogmire refit (Harvest Moon since October 3). The courtyard painting uses Bogmire's matched camera (`src/stage/dawnroost-node.js`), lit by the living sunstone node and two braziers. The fight opens on the node, and the three wraiths rise around it. Win, and Envoi is made there (lore answer 11): Io admits she never burned her letters to the dead, folds them into the wyrm, and Sol lights its heart at the node; then it folds away until she calls it.

**Step 14 is built (October 3):** `demos/great-wraith.html`. Io and Sol, at a level from 3 to 8, against the great wraith (level 5) on Bogmire's dark boardwalk, the first battle away from the Night square. The painting's camera is matched (`src/stage/bogmire-boardwalk.js`: 26° pitch, the long 12° lens, 52 pixels a meter), with its two lanterns as lights and cutouts. The fight opens on the dark town, and the great wraith rises out of the fen. It has Soul Reaper, Soul Bolts, Stolen Fire on both heroes, Swallow Lamplight to heal, and Eclipse when badly hurt, all sized up for a foe three times a wraith's height; the heroes stop short of its reach. Lunara rises from the black water behind the platform. Beaten, it lets the stolen lamplight go: a light flies from it to each dark window, and the town glows again. The end card says the Magpie can be refitted, and that Io learns Moth Veil with the refit. A lost fight wakes the party at the last rest. The battle screen now takes any scene: a page names it (`scene`), and the scene gives Lunara's spot (`summon`) and the windows that light again (`windows`).

**After step 13 (October 2, fourteenth round):** the battle screen has a frame-rate button (the screen's own rate, or a cap of 60, 45 or 30) and shows each fight's frame rate on its end card. Envoi is on the party page from level 11, with Sol at 70 Heat. Kestrel Stoop's hit, which never landed, is fixed, and the finale's cold deepens 7.5% a turn to keep its target.

**Step 13 is built (October 2):** `demos/party.html`. Io and Sol against any of nine packs of wisps, frost wisps and wraiths, at a level from 1 to 20 chosen on the start card. It has Sol's Attack, Sword Arts, Guard, Heat, Sunburn and Dawnbreaker, and Kestrel Stoop above level 15. Io has Waxing Light, Moonsteel and, above level 5, Moth Veil. Lunara strikes the whole pack. Every blow has a target list with an arrow over the foe, herbs come from the Item menu, and Frost Breath frosts the screen's edges. The battle screen (`src/battle/screen.js`) now plays any party against any pack; the first fight is one setup of it.

**Step 12 is built (October 2):** `demos/first-fight.html`, on `src/battle/screen.js`. The engine decides every number and turn; the screen plays each turn's log with the finished models, the shared effects, the Night square demo's camera director, menus, music and sound, and a wide shot for Lunara. It ends with the experience, the shards and the level-up.

## Phase 3: the story's fights

Every fight gets its place in the story before travel is built. It is drafted on paper first, then the simulator plays the whole chain in order, carrying HP, MP and herbs from fight to fight, to check that a player who goes straight through arrives at each gate at the right level.

**How fights happen:**

- **Towns are safe.** People to talk to: shops, and people with information.
- **The wilds have random encounters.** No foes are drawn on the map. Each step in wild country fills a hidden counter, and a fight starts when it passes a random threshold. That keeps the rate even: never two fights back to back, and never a long walk with none. Each area has its own rate, and the rate is a number the balancing tunes. A player can walk back and forth to grind levels.
- **Set fights** wait at fixed places: the gate fights and the story fights.
- **Rest places** in every town, and camps where the way between towns is long. A lost fight wakes the party at the last rest with everything it had, and the fight waits; losing Halcyon's ambush goes on with the story (Chris, October 3).
- **Money is sunstone shards.** Fights give them. The Magpie's upgrades cost shards and need the party's level, so moving on to the next band takes both. Shops sell herbs for shards. The simulator balances shards too: what a player has earned by each gate.

**About five hours:** the story, about 79 wild fights from level 1 to 20 (40% of them in the last band) against wisps, frost wisps, wraiths and the great wraith, and the set fights.

The first draft. The bands are marked on `../reference/art/world-map/bands-and-stops.webp`, which Chris confirmed; the places sit where `../reference/art/world-map/places-on-the-dnd-map.webp` puts them, on his D&D campaign's map (`design-decisions.md`, seventeenth round):

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
| 18 | Walking | The pixel Io, drawn in code to match her 3D outfit, walking the night world map and one ground-level map: d-pad and tap-to-walk, a town with a shopkeeper and someone to talk to, each with a painted portrait when they speak, herbs and a letter at a small well, and a random encounter in the wilds that starts the 3D battle. Sliders for her pixel look, the map's lighting and the encounter rate. |
| 19 | The Magpie | The airship flying the far view of the world between the stops, built from Chris's world travel demo, `reference/demos/the-magpie-over-aethermoor.html`: the skiff in 3D, tap-to-fly and steering, the follow camera and zoom, the whole-map view and mini-map, town banners and cards, docking and take-off, the drifting clouds and fog, and the flying music. It flies over this game's night atlas at 3072×2048 in AVIF (about 740 KB). Its four levels (refit, charge, final upgrade) set how far it can fly, and landing switches to walking. |

**The maps:**

- **The world map** is Chris's nine detailed tiles in a 3×3 grid, 4608×3072 in all, north up, in day and night versions (`../reference/art/world-map/`); the game uses the night ones, with their joins blended in code. The pixel Io walks it at full detail between places, and the random fights happen in its wild country. (Until October 5. Since then nobody walks it: it is only for flying the Magpie, its walking tiles are out of the game, and bands 2, 3 and 4 walk Chris's eight wilderness scenes instead: `design-decisions.md`, "October 5, 2026: the wilderness scenes in the game".)
- **The far view** from the Magpie is the same world, scaled down, since it doesn't need full detail: 3072×2048 with the joins blended, compressed to AVIF at about 740 KB, as in Chris's world travel demo.
- **Ground-level maps** are entered from the world map: the towns and the set-fight places (`art-requests/04-walking-maps.md`). (Since October 5 never from the world map: from the Magpie's landings, from each other and from the wilderness scenes.)
- A phone-friendly tracing tool marks where Io can walk, what she walks behind, the town entrances and the wild areas, once per tile; the day and night versions share it.
- **Walking:** Io is 42 map pixels tall on maps shipped at 768 pixels wide with sharp pixels, at 0.7× zoom (0.8 or 0.9 on a more detailed map), with one walking speed (110 map pixels a second). A **navigation mini-map** in the corner shows the whole map, the part on screen and Io; once the maps are traced it also shows paths, exits and towns.

**The level bands.** Four bands, 1 to 5, 5 to 10, 10 to 15 and 15 to 20, opened by the Bogmire refit, the charge at Dawnroost's living node, and the upgrade after Halcyon. Sunstone gives the Magpie its lift, and Noctara's cold drains it. A band the ship can't reach yet sits under cold mist on the flying map. The central island capital, the east and the southeast are under mist all game: they aren't in the story.

**Where phase 4 stands (October 3):**

- **Every ground-level map is traced** (`src/game/maps.js`): walk areas, blocks, exits, people, rests, wells, set-fight areas and wild settings. `tools/check-maps.mjs` walks each map's grid and reports anything Io can't reach; `tools/trace-overlay.mjs` draws a map's tracing over its painting.
- **The field engine** (`src/game/field.js`): walls, tap-to-walk round them, exits, set fights, talking and using things, random fights by distance walked, the mini-map.
- **The townsfolk** are pixel walkers drawn in code in the pixel Io's manner (`src/game/sprites.js`). They speak with pixel portraits until their paintings come (`art-requests/06-townsfolk-portraits.md`).
- **The world map** (`src/game/world.js`): the night atlas in nine tiles, land only (`tools/world-mask.mjs` makes the mask from the day atlas), the bands under cold mist until the Magpie can reach them, the places, camps and Ember Line nodes.
- **Step 19, the Magpie** (`src/game/fly.js`): rebuilt on r128 from Chris's world travel demo. It uses his skiff model, ported (`src/models/magpie.js`), the demo's camera over a far view of the atlas, his clouds, banners for the stops and landing.
- **Battles in the game:** the battle screen's game mode, with every fight built from the party as it stands (`src/game/fights.js`). Three new battle paintings are matched: the Gloamwood road, the Warm Road and the frozen road.

## Phase 5: the game

The pieces joined from title to ending, one band at a time.

1. **Band 1 first, as a playable slice:** the title, the Night square, Sol joining, the Magpie, the wilds, Bogmire and the great wraith, ending at the refit. This is where pacing and balance are checked in real play before the rest is built.
2. **Bands 2, 3 and 4,** each playable when finished.
3. **The ending:** Envoi's last strike, the letters burning, the stars coming back.

**Where phase 5 stands (October 3):** the whole game is joined in one page (`putting-it-all-together/game.html`, `src/game/game.js`):

- the title, the prologue, the story's scenes and words (`src/game/script.js`), and every set fight in order;
- shops, inns and camps, the menu and the save (`src/game/state.js`);
- Chris's music library from 20-min (`src/game/thareia-audio.js`);
- the ending.

Every part has been played through headless, from the title to the end card, with no errors. It is published as one page (`dist/game.html`, 14.5 MB, minified).

Around them:

- **Story scenes:** big beats as painted stills with camera moves and dialogue, as FF9 did with its FMVs. Their prompts will go in `art-requests/`.
- **Towns:** shopkeepers and people with information. When anyone speaks, their painted portrait appears beside the words (`art-requests/05-portraits.md`); the pixel sprites stay for walking.
- **The shipyard:** run by an Aurosi shipmaster, one of the moon's elves, where the Magpie gets its final upgrade.
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
| 4 | Talking portraits: Io, Sol and the shipmaster first | Prompts ready, pilot first (`art-requests/05-portraits.md`) |
| 5 | Talking portraits for the rest of the cast and the townsfolk; story stills | Later requests |

## Technical choices

- **One three.js, r128,** for every page: all the models are built for it. The Magpie, built on r186, gets ported down.
- **Bricks:** the code lives in small files (one per model, plus rules, battle, walking and airship), and a build step stitches each demo into its page, so later demos reuse earlier ones instead of copying them.
- **Checked before it ships:** every page is rendered headless and screenshotted before Chris sees it.
- **Images are compressed** to WebP at the size each view needs (`tools/compress.mjs`), and the originals stay in `../reference/art/`.
- **The final build minifies the code** (models, effects, battle) to keep the single file inside its budget; the source stays readable.

## Size

The final deliverable is one HTML file with everything inside it, about 30 MB at most, sent to Chris to keep. A published page can be 16 MB at most, so the published game is one link with its paintings as separate files beside the page.

A first budget, with the paintings compressed. The battle images stay high quality, the walking maps can drop to a lower resolution, and the far view from the Magpie is compressed the most (Chris, October 2, tenth round):

| Part | About |
|---|---|
| The code: models, effects, battle, walking, airship, music | 3 MB |
| The world map at night: nine tiles for walking, plus a lighter far view for flying | 4 MB |
| Eight battle backdrops and the Night square | 4 MB |
| Thirteen ground-level maps, at 768 pixels wide with sharp pixels (Chris) | 2 MB |
| Story stills and the title | 4 MB |
| **Total** | **about 17 MB** |
