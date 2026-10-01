# Lay of the Land

What exists across the project's materials and the four sibling repos, as of October 1, 2026. Nothing here is built yet; this is the inventory to build from.

## The game, as the materials describe it

An FF9-style browser JRPG: painted backdrops, code-built three.js characters standing in them, and active-time (ATB) battles with Trance and summons. The setting is the Moonlight in the Aether world. The battles shown in the concept art are the heart of it:

- **Party:** the Witch (healer, summoner) and Sol (sunsteel sword, Heat and Sunburn).
- **Summons:** Lunara, the Pale Mother (once per battle) and Envoi, the Letter Wyrm (once, final fight, costs Sol's Heat).
- **Foes:** the Shadow Wraith (tier 1), Old Snuff (tier 2), Halcyon (tier 3), and Noctara the Starless as the final boss, with Halcyon fighting beside her.
- **Noctara's moves:** Blackout, Void Sphere, Frost Dust, plus Crown Shards.

The title fits the amendment well. In the bible, keepers burn the letters to the dead "on the longest night," and Envoi is made from those letters. Noctara is darkness and cold, and Halcyon is midwinter.

**Canon order:** `lore/amendment-noctara-the-starless.md` wins over `lore/lore-and-party-bible.md`, which wins over anything in a sibling repo.

## What each source gives us

### The uploaded demos (`reference/demos/`): the starting engine

All target three.js r128 loaded from cdnjs.

| File | What it is | Most useful parts |
|---|---|---|
| `night-square-shadow-wraith.html` | The full ATB battle: the Witch alone against the Shadow Wraith, with Lunara | Witch model (51 bones), Wraith model, Lunara, backdrop camera rig (12° FOV, 24° pitch, 54 px/m), camera director, effects library, synth audio, battle UI, hit-stop clock with `untilP(model, u)` |
| `sol-in-the-night-square.html` | A test bench for Sol in the square (no battle) | `makeSol(opts)`, the first model that follows the Model Build Spec exactly |
| `envoi-letter-wyrm-model-preview.html` | A test bench for Envoi | `makeEnvoi(opts)`, which follows the spec with small deviations (18 bones, `block` 0.6 s, `busy` false during holds) |
| `the-magpie.html` | Airship world map over the Gloomfen | Built from the 20-min engine (three r186, bundled), not the r128 demos |

Known weak spots in the battle demo: everything assumes one hero against one foe, damage numbers and MP costs are written inline (and duplicated in the menus), hit times are hard-coded instead of read from each model's `ACTIONS`, and the Witch, Wraith and Lunara each use a different, older model interface.

### `20-min`: the Moonlight in the Aether slice

The most complete sibling. It is a 20 to 40 minute FF9-style slice with field walking over paintings, cut-scenes, brewing, a barter shop, an airship map and battles.

- **Engine:** three.js **0.186**, ES modules bundled by esbuild into single HTML files. Painted-screen engine (`src/paint.js`, `walkmesh.js`, `layers.js`, `stage.js`, `screen.js`), a JSON scene format in painting pixels with walk areas, cutouts, lights, exits and arrivals (`scenes/*.json`), multi-screen towns (`src/town.js`), dialogue with portraits (`src/field.js`), a cut-scene player (`src/title/`).
- **Battle:** not ATB. It uses the Aethermoor "Initiative Ribbon" with d20 rolls. There are no player summons.
- **Art (`art/`, webp):** 16 field backdrops (including `wickhollow-square`, `bogmire-moot-circle`, `long-boardwalk`, `mothers-hollow`), 5 battle backdrops (`gloamwood-night`, `graveyard-night`, `open-fen-night`, `long-boardwalk-night`, `mothers-hollow-night`), 10 cut-scene stills, the night world map, Magpie airship sheets, portraits and face sheets, herb, brew and swap icons, effect flipbooks.
- **Audio:** all synthesized: `src/audio/synth.js` and `vendor/thareia-sfx/` (100 sound effects and music pieces).
- **Tools:** `tools/balance.mjs` (battle simulator), `tools/overlay.py` (draws a scene's walk area over its painting), `tools/shot.mjs` (screenshots).
- **Docs:** `docs/HANDOFF.md`, `docs/LORE.md`, `docs/SLICE.md`, `docs/BALANCE.md`, `docs/art-requests/`.

### `follow-me-down-witch-way`: the cozy original

A non-combat 2D canvas game (640×360, no three.js): gather herbs by moon phase, brew, help friends in Wickhollow.

- **Art:** the richest source of paintings. 1448×1086 backdrops in `witch_game_assets/backgrounds/` (`village`, `lantern_path`, `stepping_stones`, `moonpool`, `hollow`, `crypt`), 14 more for regions 2 and 3 in `materials/Witch-Way-Bundle/.../backgrounds/`, Witch walker and pose sheets, NPC portraits, 40 painted character and item PNGs, herb, brew, item, charm and moon-phase icons.
- **Audio:** `game/music/moonlit_forest_path_1.mp3` and `_2.mp3`; `Herbal Decay.mp3` in `materials/`.
- **Code worth borrowing as patterns:** `save.js` (localStorage slots), `input.js` (keyboard and touch), `dialogue.js`, the F2 polygon scene editor (`editor.js`).
- **Weight:** about 265 MB of git history. Copy single assets; never vendor the repo.

### `New-game`: Aethermoor and Thareia

The `main` branch only has a D&D-style character sheet and a painted parchment map. The unmerged branches hold the real material:

- `claude/cool-ptolemy-uc93gg`: "Aethermoor: Hearth & Heirloom" through Act III. Turn-based with d20 rolls, loot tiers, a forge. About 150 MB of paintings in `game/art-in/`.
- `claude/tender-babbage-4wiplk`: "Thareia," an FF9-model airship JRPG and the full lore compendium. Useful: 10 battle backdrops at 1448×1086 (`thareia/art-in/scenes/battle-*.png`), the 100-sound effect library, a toon-shaded three.js ship (`thareia/game/src/ui/sky3d/ship.js`), and a Suno battle track (`audio-in/herbal-decay-battle.mp3`).
- Auros the Moon and the Aether come from this canon.

### `building-with-assets-`

Empty on GitHub: no commits, no branches.

## Character readiness

| Character | Code model | Art in hand | Gaps |
|---|---|---|---|
| The Witch | `makeWitch` in the battle demo (older interface) | Pixel sheet (bible), sheets and walkers in `follow-me-down-witch-way` | Needs the spec interface (`ACTIONS`, `anchor`, `state`) |
| Sol | `makeSol`, spec-conforming | Sol demo | None for a first fight |
| Lunara | `makeGoddess` in the battle demo (its own interface) | `reference/art/lunara-pose-sheet.png` | Needs the spec interface |
| Envoi | `makeEnvoi`, spec-conforming | `reference/art/envoi-*.png` | Its "strip the stolen lights" effect was written for the Drowned Mother |
| Shadow Wraith | `makeWraith` in the battle demo (older interface) | `reference/art/shadow-wraith-pose-sheet.png` (violet) | Color: the sheet is violet, the battle build and the Envoi scenes are green, and the amendment keeps the Wraith green to stay apart from Noctara's purple |
| Noctara | Not uploaded yet. The amendment describes a 1.9 m demo build with Blackout, Void Sphere, Frost Dust, Crown Shards and a Frost Dust slider | Two model sheets (`noctara-model-sheet-a/b.png`), Blackout and Void Sphere scenes | The demo build itself |
| Halcyon | None | Only the Blackout scene silhouette | Model sheet, action sheet, model; the open questions in the amendment |
| Old Snuff, Mandrake | None | Prompts in `specs/model-prompt-pack.md` | Everything |

## Backdrops in hand

- **Night square:** the 1448×1086 painting embedded in both battle demos, already matched to the camera.
- **Battle backdrops:** 5 in `20-min/art/battle/`, 10 in `New-game` (`tender-babbage`).
- **Field backdrops:** 16 in `20-min/art/backgrounds/`, 20 or more in `follow-me-down-witch-way`.
- **Nothing yet for Noctara's arena.** Mother's Hollow exists (`20-min`), but its theme is drowning, which the amendment retired.

## Technical forks in the road

1. **three.js r128 or r186.** The demos, the Model Build Spec and every finished model use r128 as a global from cdnjs. The 20-min engine uses r186 bundled with esbuild. The lighting model changed between them (r155 made lights physically based), so models tuned under r128 will look different under r186. Porting 20-min's engine pieces down to r128 looks cheaper than re-tuning every model up.
2. **Four model interfaces.** The battle demo's Witch, Wraith and Lunara, the 20-min `createX()` characters, and the spec models (Sol, Envoi) all differ. The spec interface should win, with adapters for the rest.
3. **ATB or Initiative Ribbon.** The demos and the bible use ATB; 20-min uses the d20 ribbon. The concept art and the bible point to ATB.
4. **Single-file pages.** The brief asks for one self-contained HTML per game, under 16 MB. Each embedded backdrop costs about 0.6 MB as webp, so a build step that inlines assets (as 20-min does) will be needed once there is more than a handful of scenes.

## Lore that disagrees between sources

Three versions of this world exist, and they don't agree:

| | Bible + amendment (this game) | `20-min` | `follow-me-down-witch-way` |
|---|---|---|---|
| Final boss | Noctara the Starless, with Halcyon | The Lantern Mother | None (no combat) |
| Tone | Fights, a goddess of darkness | "Nobody dies," no villains, no gold | No fighting, no danger |
| Party | Witch, Sol | Witch, Inkblot, Nettie | Witch alone |
| Sol, Lunara, Envoi, Halcyon, Noctara | All present | None of them | None of them |

Auros and the Aether come from the Thareia canon in `New-game`.
