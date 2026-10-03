# Handoff: What the Game Still Wants

October 3, 2026. The game plays from the title to the ending in one page (https://claude.ai/artifact/UDTnemDCiz2EKcoGqbCtm8), and every part has been played through headless with no errors. This note lists what is waiting on Chris, then everything Claude would add or improve, most important first. `status.md` has the links and `design-decisions.md` the reasons behind what is built.

## Waiting on Chris

1. **A play on the phone.** Nothing has been played by hand yet. The headless tests prove it runs, not that it feels right: the walking pace, how often fights come, the difficulty, how long each fight takes to load, and how the battles run on the Pixel 7a inside the full page.
2. **The lore conversation.** Every line of the script is a placeholder (`src/game/script.js`):
   - the townsfolk's words;
   - the twelve new townsfolk's names: Old Wenna, Tobb and Pell in Bogmire; Marta, Brann and Tamsin at Dawnroost; Pim, Tock and Old Gil at the shipyard; Sorrel, Ede and the watchwoman in Misthollow;
   - the five well letters;
   - every story scene, the ending's words included.
3. **Art requests 06 and 07:** sixteen townsfolk portraits and nine story stills. Each goes in with one line in `src/game/stills.js`.
4. **The songs.** Say which song is which (the title, a battle theme, a boss theme, the ending?). Claude puts each where it goes, and the synthesized pieces keep the rest.
5. **The Bramble Colossus** (`reference/demos/bramble-colossus-bench.html`): a yes to the plan below, or changes to it.
6. **The townsfolk's sprites:** a yes to the paper doll below, or another direction.

## Gameplay, in order

### 1. Tuning from a real play

- Fights come every 7 seconds or so of walking in the wilds. The menu's Fewer and More settings scale that; the default may want moving.
- Load time per fight: every battle builds its models from scratch. If the wait shows on the phone, keep the heroes, Lunara and Envoi built between fights, and build only the foes.
- The finale is meant to be hard: an attentive player wins about one try in twenty. If that is too much once played by hand, ease the cold from 11.5% a turn.

### 2. The Bramble Colossus, the last band's great wild foe

Chris's model is a perfect boss: the Bramble Horror grown to 7.5 m, with a two-phase fight (Wrath at half HP), a weak point (its heart, bare while the bud is open), fear of fire, canes it loses, and ten big moves.

The plan:

- **Where:** band 4 only. It is a rare wild fight in the northeast peaks, about one in twelve, never in the first fights after landing.
- **Optionally, a lair:** the Thornheart, a hidden meadow below the peaks where spring still holds against Noctara's cold, because its heart is warm. That is the lore reason it grows where everything else is frozen. It would be a world-map place you can walk into, with a well, a letter and a big reward. Seen there first, the Colossus can then turn up in the wilds.
- **The fight:** always alone, Flee allowed, built on the Horror's rules (`BRAMBLE_MOVES`, scorch, canes, lure and grab), plus its own:
  - **Siren Bloom:** charm, the party steps toward it.
  - **Thorn Lance:** a single heavy blow.
  - **Hammerfall:** a club blow on one hero, with a shockwave on all.
  - **Maelstrom:** four hits on the whole party.
  - **Thorn Volley:** three waves of thorns.
  - **Devour:** lifts its prey into the flower; each gulp damages her and heals it, and fire or a big blow to the heart makes it spit her out.
  - **Thornwood:** shoots burst up round its prey and squeeze.
  - **Wrath** at half HP: faster, harder, its veins ember-red.
  - **The weak point:** blows land double on the heart while the bud is open (after Siren Bloom, Devour and Wrath).
- **Targets:**
  - at level 18 to 20, an expert wins about two times in three;
  - an attentive player wins about one time in four, and flees otherwise;
  - its rewards are three times a wild fight's.
- **Steps:** bring `colossus.js` into `src/models/`, add its rules and moves, add its targets to the balance simulator, then a demo page, then the game.

### 3. Living battlefields

The meadow in Chris's bench answers the fight: shockwaves roll through the grass, a roar sends the birds up, Wrath turns the sky into a red storm. Two ways to bring that in:

- **On every painted battle** (cheap, and it fits the look). The battle screen already knows the ground plane of each painting, so these work on all nine:
  - shockwave rings with dust and turf thrown up where big blows land;
  - drifting ground mist and fireflies, or snow on the frozen road and the dead Moonwell;
  - rain and lightning with thunder for the storms;
  - birds or bats flushed out of the painted trees by roars and big hits;
  - falling leaves when the ground shakes;
  - a red tint over a painting's sky for a boss's second phase.

  What can't move on a painting is the painted grass and trees themselves. Foreground grass tufts in 3D could sway in front, but they'd look unlike the painting.
- **The meadow as the Colossus's own arena** (expensive, and it stands out). The whole 3D meadow, at night, behind that one fight: everything in it reacts.
  - It draws about 380,000 triangles in 150 draw calls; the painted battles draw far less.
  - It needs a frame-rate check on the Pixel 7a inside the full game first.
  - If it holds 30 fps, it is the most alive fight in the game, and a good reason to make the Colossus the band 4 showpiece.

### 4. The townsfolk

- **Better sprites, as a paper doll drawn in code:** a library of parts (faces, hair, hats, coats, aprons, skirts, beards, ears, held things), each drawn pixel by pixel to the pixel Io's standard (three-tone shading, outlines, one-pixel details).
  - Each townsperson is one line of data choosing parts and colors.
  - **Space:** code costs almost nothing. All of today's townsfolk and Io together are under 30 KB of code, and no images.
  - **Images:** a paper doll of small images would also be small (a sheet per part, 2 to 5 KB each, about 100 KB in all).
  - **Why code:** it is consistent with Io's own sprite, which is drawn in code and must keep her look, and it makes adding people trivial.
- **More townsfolk per town** (Chris's mission), each with a line or two that changes with the story. Some can walk a short beat, turn to Io as she passes, or do something: Hilde at her anvil, Pim and Tock at the slip.
- **Inkblot**, Quill's crow, on his shoulder and in his scenes.

### 5. Story staging

- **Actors in the scenes:** today the scenes are words over the map. Sol should run in over the bridge, Quill should walk Io to the skiff, Halcyon should step out of the dark at the crossroads and Ysmera should meet them at the slip, all as sprites walking on the map while they talk. That is a small script player: move this person there, face her, wait, say.
- **The stills** from request 07 for the nine big moments.
- **A first-battle tip or two** (how to pick a command, what the gauges mean), shown once.

### 6. The world between the stops

- **The D&D map's named places as landmarks** on the world map, each with something to find: Rotbridge, Willowmurk, Mosswatch Tower, Eldergrove, Fawnrest Shrine, Frostmere Lake, Peak's Veil and Stormwatch. That could be a letter, a herb, a short scene, an optional fight, or a side errand for a townsperson.
- **More wells and nodes.** Five letters and three nodes feel thin over four bands.
- **The flight:** more of Chris's demo — town cards with their notes, the whole-map view, the docking and take-off.

### 7. Depth beyond levels

Today the party grows only by levels and the story's gifts (Harvest Moon, Envoi, Kestrel Stoop). A light layer would make the wilds' rewards matter more. Two options, which need Chris's call:

- **Charms** found at wells and landmarks and given by side errands: one worn by each hero, with a small effect (+10% HP, Heat starts at 20, Lunar Mend costs less).
- **Moonlore Io learns from the letters:** each letter she gathers teaches a small spell.

### 8. The field

- **Walking behind things:** Io walks over the painted roofs, trees and arches. Each map needs a foreground mask (cut from the painting) drawn over her when she's behind it. The plan named it; it isn't built.
- Footsteps and doors in sound; a soft step-in when a map loads.
- A run (hold the action button) for long walks.
- An ambient loop per place (wind on the pass, frogs in the fen, the forge at Dawnroost).

### 9. Menus and saves

- **Three save slots,** and a save code to copy and paste, to move a game between devices or between the two halves of a split demo (each published page keeps its own save).
- Text speed, auto-advance and larger text.
- Separate volume for music and effects.

### 10. Sound

- Chris's songs where he wants them.
- A victory fanfare at the end of every fight, a short one for wild fights.

## Size and delivery

The final deliverable is one HTML file under 30 MB, sent to Chris to keep. The page today is 14.5 MB: 13.5 MB of paintings (inlined as base64, a third larger than the files) and under 1 MB of code.

| Part | Inlined |
|---|---|
| Today's page | 14.5 MB |
| Chris's songs (about 2.5 MB of files) | +3.3 MB |
| Sixteen portraits | +1.7 MB |
| Nine story stills | +4.2 MB |
| The Colossus, its meadow, and three.js and the fonts embedded so the file works offline | +0.9 MB |
| **The final file** | **about 25 MB** |

**Published demos** have a 16 MB page limit, so once the songs and art come the page no longer fits.

- **Two halves** (bands 1 and 2, bands 3 and 4) would work, but each published page keeps its own save, so carrying a game from one half to the other needs the save code from section 9.
- **Simpler:** one link, with the paintings and songs published as files beside a small page. The same game and the same save; only the published copy is split, not the file Chris keeps.

**The file Chris keeps must work offline,** so its build embeds three.js and the two fonts instead of loading them from the web. `tools/build.mjs` needs that option.

## Technical notes

- **Tests:** the headless test drivers live in the session scratchpad. They should move into `tools/` as one game test, with saves to start at each band.
  - Headless Chrome renders slowly (a 3D fight takes several minutes), so set fights are weakened to keep tests short.
  - The unbuilt page can't load the flight's textures from `file://`; test the built page (`node tools/build.mjs --min putting-it-all-together/game.html`) or serve the folder.
- **Map tracing:** `node tools/check-maps.mjs` after any change to `src/game/maps.js`; `node tools/trace-overlay.mjs <map> <out.png>` to see it.
- **Balance:**
  - `node tools/balance.mjs` for the fights' 52 targets.
  - `node tools/chain.mjs` for the whole journey. Its walks are the game's measured ones (3, 5, 6 and 5 fights a band), and wild fights are worth 1.75 times their table (`rules.js` `WILD_REWARD`).
- **Each battle** makes its own WebGL context and frees it at the end. Fine so far; keeping one renderer for the whole game would be gentler on old phones.
- **Retired:** the walking test page (`demos/walk-test.html`) is superseded by the game.
