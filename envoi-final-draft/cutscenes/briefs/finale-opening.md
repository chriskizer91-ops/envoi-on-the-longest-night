# Cutscene Brief: The Finale's Opening

October 4, 2026 · for a cutscene session · read `../README.md` first; its rules hold here.

**Start here:** bring your branch up to the game (`git fetch origin ccr-31761774-76j8j3 && git merge --ff-only FETCH_HEAD`), then `npm install --prefix tools`.

| | |
|---|---|
| Your folder | `envoi-final-draft/cutscenes/finale-opening/` |
| The page | `Finale_Opening_Cutscene.html`, published privately for Chris |
| The module | `window.CUTSCENES['finale-opening']` (`../README.md`, rule 6) |
| Length | 60 to 90 seconds, skippable |
| Where | Misthollow's dead Moonwell, at the top of the town in the Ironspire peaks, on the longest night |
| Who | Io and Sol; Noctara the Starless and Halcyon at her side |

## What Chris asked for

Chris, October 4: "a cutscene done of the final battle that would be like basically just like the camera from out far, kind of zooming in cinematically too. Super well rendered of all the characters of the last fight. So the four people that will be in the last fight."

In the story this is the moment the lore answers set up: Noctara means to eclipse the Moon from the dead Moonwell on the longest night, so that the night never ends, and the knight who spared them at the crossroads stands beside her. The game's notes say "the finale's opening shows them together". It ends where the last fight begins.

## The place, built in 3D

The game has the dead Moonwell only as paintings, which look right from one spot, and this camera travels. So build it, as much as the camera sees on its way in:

- **The court** where the fight happens, after the painting the finale was fought on until October 5 (`reference/art/backdrops/battle-dead-moonwell.png`; the game's copy is `art/backdrops/battle-dead-moonwell.avif`): frosted flagstones; the round well at the back of the court on a stepped dais, moths and crescents carved round its rim and an iron arch over it with a crescent, black and empty inside, giving no light at all; crescent banners on iron poles; two braziers burning low at the near corners, the only warm light; stairs on every side; towers all round.
- **Its layout** from above is the walking map's (`reference/art/walk/walk-misthollow-moonwell.png`), which agrees with that painting: the round court, the well at its heart, the towers with their crescent banners, and the stair coming up from the south, the way Io and Sol arrive.
- **The far view** is in art request 11's painting of the same place (`reference/art/battle-backgrounds/14-ironhold-misthollow-dead-moonwell.png`, planned for the new battles): the court open toward the snowy peaks, and the eclipse over them.
- **Misthollow below:** pale towers, arches and bridges on the cliffs, every window dark, mist rolling through the streets (`reference/art/walk/walk-misthollow.png`).
- **The Ironspire peaks** beyond, snow on them, far enough off to be cheap.
- **The sky:** no stars (the sky has none until the ending), and the Moon with a black disc already biting into it, as in the painting: Noctara's eclipse, her sign. Snow drifting, frost on everything, breath steaming.

## The cast

| Who | Model | What's useful in it |
|---|---|---|
| Io | The cutscene Io, `3d-cutscenes/io-cutscene.js` (Chris's request: in cutscenes, her paper doll's face) | Her idle, walk and looking about, and the study's moves |
| Sol | `src/models/sol.js` | `guardStep` (she steps in front of Io), `kestrel`, `flareCut`, `block`; her blade glows amber with Heat |
| Halcyon | `src/models/halcyon.js` | `vowStance` (held: Warden's Vow, the stance she taught Sol), `appear`, `blackNoonCharge` (held); cold blue eyes and blade edge, teal and dark armor |
| Noctara | `src/models/noctara.js` (her approved second pass) | `appear`, `crownShards`; her violet edge light, the night in her cloak's lining, her crown and veil |

Use each model as it is. If Sol's, Halcyon's or Noctara's high-detail studies exist by then (`3d-model-main-characters/<name>/`, made like the Io study), add a switch that swaps them in; they keep the same interface.

## The shots (a proposal; make it as good as you can)

One continuous move down from the sky for the first half, then cuts.

| # | About | What it shows |
|---|---|---|
| 1 | 12 s | **The Moon going out.** A sky with no stars, the Moon with a black disc crossing it; a slow tilt down onto the Ironspire peaks. Caption: "The dead Moonwell gives no light at all, and the moon is going out." |
| 2 | 14 s | **Down over Misthollow.** Still one move: gliding down over the dark pale towers, mist rolling through the streets, not a window lit, snow drifting past the lens |
| 3 | 10 s | **Onto the court.** Descending toward the round court from high above: the black well at its heart, and two figures beside it |
| 4 | 6 s | **Halcyon.** Low and close: her blade planted in the frost, its cold blue edge; up to her cold blue eyes |
| 5 | 8 s | **Noctara.** Her edge light against the dark, the night in her lining, her crown; she lifts her face to the eclipse. Caption: "Noctara the Starless waits at the well, and Halcyon stands at her side." |
| 6 | 8 s | **Io and Sol.** From behind them at the head of the stair; Sol's blade lights amber, and Io's witchfire in her hand |
| 7 | 6 s | **Kestrel.** Across the court, Halcyon slides into Warden's Vow (`vowStance`). Sol knows the stance. Hold on her face |
| 8 | 8 s | **The four.** Wide and low across the frost: Io and Sol on one side, Noctara and Halcyon on the other, the dead well between them and the eclipse above. The camera settles into the battle's own framing, and the words: "The longest night begins!" Hand over to the fight |

The battle's framing for the end is in `src/stage/dead-moonwell.js` (its camera: 26 degrees of pitch, the long 12 degree lens, 54 painting pixels a meter) and `src/game/fights.js` (`finale`: the party at painting pixels 560, 762 and 630, 812, the foes at 750, 690 and 828, 642). Ending on that composition lets the game cross-fade straight into the fight. (Since October 5 the game fights the finale in the new battles' arena at the dead Moonwell, in front of painting 14, and the cutscene ends on that arena's opening frame instead: `../finale-opening/README.md`, "The hand-over".)

## Super well rendered

This is the cutscene to spend the look on.

- **The film camera** (`cinema.js`) at its best on a laptop: depth of field pulling focus between the four, bloom on Sol's blade and Io's witchfire, light shafts from the eclipsed Moon through the mist, the grade's cold shadows and warm lights, grain, letterbox.
- **Chris's battle page** (`reference/demos/bramble-colossus-battle.html`) shows how far this project has taken the look already: its god rays, grade, vignette and letterbox are worth reading.
- **Close-ups have to hold up:** rim light from the Moon on every face, a cold fill, warm accents from Sol's blade and Io's fire, and nothing black: readable mid-tones, as the model rules ask.
- **Sound** made in code: wind over the peaks, the frost, the empty well's hush, the blade lighting. Music: none, a low drone, or the game's own made-up music (`src/game/thareia-audio.js`, "Beneath the Stone" plays in Misthollow); Chris's songs can come later.
- **Phone detail** must still hold about 30 frames a second on the Pixel 7a. Measure Phone and Laptop headless at 915 × 412 and report both on the end card.

## What to hand back

- The page, published, with Light, Phone and Laptop, Skip, sound on a tap and the end card.
- The module (`../README.md`, rule 6), and a README: the shots, the place and what it was built from, the numbers (its size as one file without three.js, its frame rates, its build time), every file copied in and where from, and what's open.
- Stills of every shot at phone and laptop size in `renders/`.
- The slip (`../README.md`, rule 8).
