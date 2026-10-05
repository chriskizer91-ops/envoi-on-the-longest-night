# Cutscene Brief: The Colossus, First Met

October 4, 2026 · for a cutscene session · read `../README.md` first; its rules hold here.

**Start here:** bring your branch up to the game (`git fetch origin ccr-31761774-76j8j3 && git merge --ff-only FETCH_HEAD`), then `npm install --prefix tools`.

| | |
|---|---|
| Your folder | `envoi-final-draft/cutscenes/colossus-first-meeting/` |
| The page | `Colossus_First_Met_Cutscene.html`, published privately for Chris |
| The module | `window.CUTSCENES['colossus-first-meeting']` (`../README.md`, rule 6) |
| Length | 40 to 60 seconds, skippable |
| Where | The meadow below the frozen pass by Frostmere Lake, beside the frozen road, at night: the field study's `frostmere.js` |
| Who | The Bramble Colossus (the field study's model), Io (the cutscene Io) and Sol (`src/models/sol.js`) |

## What Chris asked for

Chris, October 4: "if this is a cutscene for the first time you fight this foe in the wilderness that would be epic." He pointed at the field study's film (`3d-model-field-studies/bramble-colossus/`, its page "The Bramble Colossus"). In the game the Colossus is the last band's great wild foe: about one wild fight in twelve on the frozen road, levels 16 to 20, always alone and rooted. This cutscene plays the first time it is met, and ends where its fight begins.

## The story it tells

The battle already says it in two lines, and the cutscene shows them (`src/game/fights.js`, `colossus`):

> Beside the frozen road stands a thicket as big as a house, green where nothing else is. The snow round it has melted.
>
> The ground splits. It heaves itself up out of the earth, and a great thorned bud opens on a glowing heart: a Bramble Colossus.

The field study already shows its warm ring: frost everywhere, and inside about 20 m of it, green grass and small white flowers in the middle of winter.

## The shots (a proposal; make it as good as you can)

| # | About | What it shows |
|---|---|---|
| 1 | 7 s | The frozen road under the moon, no stars. Io and Sol small, walking north through the frost, their breath steaming. Wind and the night's sounds |
| 2 | 6 s | Low through the frosted grass toward a hill of brambles beside the road: green where nothing else is, the snow melted round it, berries glinting. First line |
| 3 | 5 s | Close: one cane lifts and tastes the air (`taste()`), turning toward them. Its heartbeat glows down the canes |
| 4 | 4 s | Io stops; Sol puts out an arm and draws her sword, its edge lighting amber |
| 5 | 9 s | The ground splits round it. It heaves itself up out of the earth (`appear`), every cane rising; the camera pulls back and up to take in all 7.5 m of it. Second line |
| 6 | 6 s | The bud parts on its glowing heart (`alert`, then the bloom), steam breathing out of it into the cold |
| 7 | 6 s | The camera settles behind the party into the battle's framing: Io and Sol lower left, the Colossus upper right, about 8.5 m apart, as the fight stands them (`COLOSSUS_AT` in `src/game/fights.js`). Hold, then hand over |

It has no throat, so it never roars: its sounds are wood, leaves, soil, roots and air (`sounds.js`). Let the night fall silent when it wakes, as the field study does.

**Where the fight is drawn:** until October 5 the Colossus was fought on the frozen road's painting (`reference/art/backdrops/battle-frozen-road.png`, the game's `art/backdrops/battle-frozen-road.avif`). The new battles planned in pass three move it to Frostmere's lakeside meadow (`reference/art/battle-backgrounds/05-ironspire-frostmere-lakeside-meadow.png`), which the field study's meadow was built after. End on the same composition either way, and say in your README which painting your last frame matches best; the game's session matches the hand-off to whichever painting the fight uses then. (Since October 5 the game fights it at Frostmere, in the new battles' arena, and the cutscene ends on that arena's opening frame: `../colossus-first-meeting/README.md`, "The hand-over".)

## How it should look

- The field study's film look: `cinema.js` with depth of field, bloom, moonlight shafts and its grade; letterbox bars while the cutscene plays, opening out to the full frame as it hands over to the fight.
- The Colossus is the field study's model (`3d-model-field-studies/bramble-colossus/colossus.js`) at the level the game meets it, 16 to 20 (its `level` option darkens it and lengthens its thorns, as the short "In motion" shows at level 10), so it matches the fight that follows.
- **Phone detail** must hold about 30 frames a second on Chris's Pixel 7a: the Colossus at detail .25 to .4, less grass, the lake's reflection off or cheaper, a smaller picture. Laptop detail can be the field study's High. Measure both headless at 915 × 412, and report them on the end card as `3d-cutscenes/` does.

## Built to be used again

The great creatures coming in art request 13 (Gorrow at Willowmurk, Old Snag on the moor, the White Hart at Fawnrest, the Thunder-Roc at Stormwatch) will each want a first meeting like this. So keep the player general: a cutscene is a place, a cast and a list of shots, all as data, and a new creature's first meeting should be a new place and shot list, not a new player. Start from `3d-cutscenes/player.js` and `scenes.js`, and the field study's `film.js` and `motion.js`, which already write shots this way.

## What to hand back

- The page, published, with Light, Phone and Laptop, Skip, sound on a tap and the end card.
- The module (`../README.md`, rule 6), and a README: the shots, the numbers (its size as one file without three.js, its frame rates, its build time), every file copied in and where from, and what's open.
- Stills of every shot at phone size in `renders/`.
- The slip (`../README.md`, rule 8).
