# Envoi with the Moon Faire witches

Started November 15, 2026. Chris's idea: keep everything that went into *Envoi on the Longest Night* (the arenas, the foes, the
effects, the battle screen, the walking maps, the story's places), and swap its heroes for the two 3D witches from *Moon Faire*:

- **Io, the Herbal Witch** (Moon Faire's Io) takes Io's place. Natural herbal healing and summoning. She gets summons like
  Envoi's Io (Lunara), but not the Envoi summon.
- **The Jester** completely replaces Sol. The duality of life and death; fate. Her big move is Curtain Call. She has no name yet.
- Both are the lightest version of their models, in the fights and on the walking maps.
- The combat is rebuilt: new names, new numbers that pop up, new math, rebalanced. Battles get Moon Faire's director
  camera, bodies that react, spells that mark the arena, and turn openers and finishers.
- Files go to Chris as single HTML files he downloads and opens, not as published pages.
- (Later the same evening) Moon Faire's fair folk play Envoi's townsfolk, at their lightest; Moon Faire's big bad is the final
  boss. Io's spells are Envoi Io's, with the Envoi summon and all of Lunara. The Jester is exactly Moon Faire's: Fate, seals,
  Sealed Fate, Curtain Call. Envoi's levels, foes and how often they come stay. Both witches get a trance glow made in code,
  and the Jester's Curtain Call glows purple, with mist and pixel motes.

The rest of Envoi is untouched: this folder is a new game made from its parts, and nothing outside it changes.

## Pages

| Page | File | State |
|---|---|---|
| The New Battle | `battle/battle.html` → `dist/battle.html` | November 15. Envoi's fights in their arenas at any level, with Moon Faire's Io and the Jester at their lightest. The battle is a copy of Envoi's (`src/battle/`): Io keeps every Envoi Io spell, Lunara and Envoi, and adds her own Herbcraft (Thornwake, Silverleaf Salve, Moonflower Garden, Rootbound Return, Bramble Cradle) and the Elderwood Guardian. The Jester plays by Moon Faire's Fate rules: taunts, Fate written on whoever strikes her, sealed foes, Sealed Fate and Curtain Call. Fate shows as gold stripes on a foe's bar. Both glow in their trance (Io silver-green, the Jester purple; purple mist and pixel motes through Curtain Call). The Flipbook button draws the whole fight as one pixel picture in the place's own colours. Halcyon's and Noctara's fights are left out until their stories are rebuilt without Sol. |
| Io's Spell Book | `spellbook/spellbook.html` → `dist/spellbook.html` | November 15. Moon Faire's Io in Envoi's river glade, with the Jester and a Shadow Wraith. One tab plays her 7 own spells, the other Envoi Io's 9 spells on new moves of hers. For Chris to choose which spells she keeps. |
| The Fair Folk in Envoi | `walk/town.html` → `dist/town.html` | November 15. Io on Foot with all 17 of Envoi's townsfolk played by Moon Faire's fair folk at a quarter of their triangles (`src/moon-folk.js`, the same face as the paper dolls, so `src/game/field.js` draws them unchanged). Talking: they turn to Io, greet her their own way and talk with their hands; their first lines from Envoi's script show in the game's talking box with a picture of their 3D face. |
| The Final Boss | `bigbad/bigbad.html` → `dist/bigbad.html` | November 15. Moon Faire's big bad in Envoi's dead Moonwell arena with two wraiths and two frost wisps in form one; its blow, call and flinch; the Jester's Curtain Call with her purple glow (`src/trance.js`), which brings Io up again and breaks it into its final form; Io's trance glow; its ending. |
| Io on Foot: Moon Faire | `walk/walk.html` → `dist/walk.html` | November 15. Envoi's Io on Foot page with Moon Faire's Io as her own 3D model on the 21 walking maps (`src/moon-io-walker.js`, the same face as the painted walk sheet, so `src/game/field.js` draws her unchanged). She kneels at wells and raises her arms at a Moonwell. Starts at 24% of the screen's height. |

## How it is made

- `witches/`: the two light witches, copied unchanged from the `moon-faire` repository (see Sources).
- `src/io-new-moves.frag.js`: Io's new moves for Envoi's spells (`e_throw`, `e_raise`, `e_grasp`, `e_bless`, `e_sky`,
  `e_moon`, `e_guard`), written the way her own moves are. `tools/patch-io.mjs` adds them to her light model as
  `build/io_plus.js` (run it after any change to the moves).
- `src/moon-io.js`: Io behind the same face every Envoi battle model has (`play`, `ACTIONS` with cues and hits, `anchor`,
  `progress`...). The Jester already has that face: she was built to Envoi's model spec.
- `src/kit.js`: a small stage made of Envoi's parts: an arena, the battle effects and sound, and the battle screen's camera
  rules. The witches are drawn in their own Moon Faire look (each witch material turns its colour to sRGB at its last step,
  with a soft studio in their shine), while the arena, foes and effects keep Envoi's look. "Light: Envoi" draws the witches
  the Envoi way instead.

```
node moon-faire-witches/tools/patch-io.mjs
node tools/build.mjs --min --offline moon-faire-witches/spellbook/spellbook.html    # dist/spellbook.html, everything inside
node moon-faire-witches/tools/shoot.mjs dist/spellbook.html <out dir> --plan <plan.json>   # stills at a phone's size, headless
```

`npm install --prefix tools` first (esbuild, three.js and the fonts for the offline build).

### The new battle

```
node moon-faire-witches/tools/patch-io.mjs
node tools/build.mjs --offline moon-faire-witches/battle/battle.html          # dist/battle.html
node moon-faire-witches/tools/battleshots.mjs <plan.json> --out <dir>          # stills of set moves, headless
node moon-faire-witches/tools/balance.mjs                                     # Envoi's balance targets, on this battle
```

The numbers were rebalanced with the simulator against Envoi's own targets (`tools/balance.mjs` in this folder runs Envoi's
checks on these rules). With Moon Faire's numbers as they were (a blow on the Jester writing half a wraith's Life), 21 of 51
targets were met: nearly every fight was won, even playing carelessly. Now 42 of 51 are met. What changed (`src/battle/rules.js`):

- Fate per blow on the Jester: a sixth of a Shadow Wraith's Life (about five blows seal a wraith, two a wisp; a marked blow
  counts double). Big foes (the great wraith, the Bramble Horrors, the Colossus, Halcyon, Noctara) take Fate at a third of that.
- The Jester: 2000 Life (was 2400); her Gilded Rebuke 290 (was 265).
- Io: Thornwake 340 for 24 MP (was 420 for 22). The Elderwood Guardian comes once the Jester has joined (the first fight is
  Io's alone, as in Envoi).

The misses left: the attentive player wins the Bramble Horror a little too often (93%, want 92% at most) and the Colossus
not quite often enough (12%, want 15%); a wild fight at level 5 lasts 0.6 minutes, at the bottom of its range; and
Halcyon's ambush and the finale are now too hard. Those two were built round Sol (Halcyon is weak to Sol's sun), and wait
for their stories to be rebuilt without her.

## Who plays whom

Envoi's names, places and words stay; Moon Faire's fair folk are the bodies (`src/moon-folk.js`, `CAST`):

| Envoi | Where | Moon Faire's fair folk |
|---|---|---|
| Nettie | Wickhollow | fortune-teller |
| Hilde | Wickhollow | pie-seller |
| Mayor Gretch | Wickhollow | chestnut-roaster (second version) |
| Quill | the jetty | old night-watchman |
| Old Wenna | Bogmire | old lamp-seller |
| Tobb | Bogmire | fair baker |
| Pell | Bogmire | farm lad |
| Marta | the Warden waystation | old lamplighter |
| Brann | the Warden waystation | chestnut-roaster |
| Tamsin | the Warden waystation | ballad singer |
| Ysmera Brightkeel | the shipyard | gate keeper |
| Pim, Tock | the shipyard | fair baker and ribbon dyer (second versions), made small for the gnomes |
| Old Gil | the shipyard | ribbon dyer |
| Sorrel | Misthollow | fortune-teller (second version) |
| Ede | Misthollow | old lamplighter (second version) |
| The watchwoman | Misthollow | old night-watchman (second version): she becomes the watchman |

Moon Faire's airship captain (the Grey Hat) would be the natural Quill, but he has no light version: he is about 345,000
triangles, against about 2,700 for a fair folk at a quarter. He needs a light version first.

The final boss is Moon Faire's "fire that would not end" (stand-in name), at the dead Moonwell where Noctara was fought: a
black sun in a corona, which is Noctara's sign and her plan in Envoi's lore (lore answer 8).

## Sources

From `chriskizer91-ops/moon-faire` (read only):

- `witches/io_lod.js`, `io_tex.js`, `witch_levels.js`: branch `claude/moon-faire-fights` (commit `f0f8aed`), `game/fight/witches/`.
  They are built there from Io's own branch `claude/io-3d-model` (commit `3bc17a3`, stage fourteen).
- `witches/jester_lod.js`, `jester_tex.js`, `lod.js`, `meshopt_simplifier.js`, `palette.js`: branch `claude/moon-faire-fights`
  (commit `f0f8aed`), `game/models/jester/`.

- `witches/folk/`: the fair folk, from branch `claude/moon-faire-fair-folk-minds` (commit `0cd2262`): `game/people/npc/`
  (`npc.js`, `npcs.js`, `npc_tex.js`, `emotes.js`), `game/people/kit/person-kit.js`, `game/models/jester/jester_kit.js` (the
  Jester's light model with the person kit's step; it builds her the same as `jester_lod.js`), and `face_plain.js` made from
  `game/people/kit/face_plain.webp`.
- `witches/bigbad/final-fire.js`: branch `claude/moon-faire-levelling` (commit `b830e20`), `game/models/foes/final-fire/`.

From this repository: `src/fx/arena.js`, `src/stage/arena-river-glade.js`, `src/fx/battle-fx.js`, `src/fx/io-spells.js`,
`src/battle/sound.js`, `src/models/wraith.js`, `src/models/lunara.js`, all unchanged.

## The texture packs (for a 3D Envoi)

`texture-packs/`: every walking map, fight place and the world map, made by seven helpers at once from `texture-packs/BRIEF.md`.
Each place has an inventory of everything a 3D build needs, reference crops cut from Chris's paintings, seamless stand-in
textures a 3D build can use today, and the prompts for the real textures. `texture-packs/tools/build_prompts.py` makes one page
of every prompt (365, in three rounds: 53 shared, 77 places' own ground and surfaces, 235 flat views, roofs and plants) and a
zip of the pictures to attach: `dist/envoi-3d-texture-prompts.html` and `dist/Envoi_3D_Texture_References.zip`.

Shared textures two groups both made (the jetty's and Bogmire's planks and dark water, and a few more) are one prompt on the
page, with both close-ups attached; both stand-ins are in the zip.

## Next

1. Chris picks Io's spells from the spell book, and plays the new battle.
2. The battle upgrades still to come: Moon Faire's director camera, bodies that react, spells that mark the arena, turn
   openers and finishers. Then the final boss in the new battle (helpers first, Curtain Call refills it, then alone).
3. Halcyon's and the finale's fights rebuilt for a party without Sol, with their stories.
4. The whole game put together in this folder, with the 3D Io walking and fighting.
5. The 3D places, once Chris's textures come back (the stand-ins can start it).
