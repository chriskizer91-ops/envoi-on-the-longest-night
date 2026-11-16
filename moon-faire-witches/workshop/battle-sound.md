# Job: battle-sound

Remake every sound of the new battle, and its music. Keep the beats; scrap the sounds.

## Why (Chris, November 16)

"We have to really rework the audio, and I think that the battle audio is the most important, because I can make a song
file for the music that plays in the overworld, but the battle music needs to be reworked significantly. So I would say
scrap all of the sounds, [keep] the beats they hit on: like when an attack lands there's a noise, and there's different
noises that happen with different things in combat happening. But I think you should remake all of the noises."

## What there is now

- The battle still uses Envoi's own sound file, `src/battle/sound.js` (outside this game's folder: **never change it**). It
  is all made in the browser with Web Audio: 17 effects (swish, hit, fire, boom, chime, blade, heal, guard, moon, shriek,
  grasp, eclipse, menu, select, trance, victory, defeat, and a longer fanfare) and one battle theme in D minor at 132 BPM.
- The beats: about 190 calls in `moon-faire-witches/src/battle/screen.js`, each placed at the moment something happens
  (a blow lands, a spell is cast, a summon arrives, a seal closes, a menu is tapped). Today the same few sounds are used
  for very different things: `boom` 26 times, `hit` 25, `chime` 25, `swish` 23, `fire` 15, `grasp` 14, `heal` 13,
  `eclipse` 11, `shriek` 9, `moon` 6, `guard` 4, `blade` 3, `victory` 2, `trance` 2, `menu` 2, `defeat` 2, `select` 1,
  `fanfare` 1. The music: `SND.startMusic()` once as a fight begins, `SND.stopMusic(fade)` 7 times.
- The pages that load the sound file: `battle/battle.html`, `spellbook/spellbook.html`, `lineup/lineup.html`,
  `bigbad/bigbad.html` (each with `<script src="../../src/battle/sound.js">`).

## What to make

1. **A new sound file of this game's own**, `moon-faire-witches/src/battle/sound.js`, with the same face so nothing else
   has to change: `makeBattleSound()` returning `{ init, sfx, startMusic, stopMusic, setMuted, setMusicOff, setVolumes,
   muted, musicOn }`, sound starting only after a tap (`init()`), and every name `screen.js` calls. Point the four pages
   at it.
2. **Every effect remade**, so different things sound different. You may give a beat a better-fitting sound by changing
   the name or the arguments inside its `SND.sfx.…()` call (and add new names to `sfx`), but never move a call or change
   when it happens. What the game's lore gives you to work with (`claude/lore/io-and-kore.md` in the project's knowledge
   has all of it):
   - **Kore** (the Jester): her flail is the gold bells at her hip: everyone hears her coming. Her blows are bells and
     chain. When a foe's Fate meets its Life she closes the seal: **one bell tolls, and everyone hears it**. Curtain Call:
     two curtains of night close over the show and fainted friends get up for the bow. Her taunts are laughter and capers.
     Fate being written on a foe (gold) is her writing down its choices.
   - **Io** (the Herbal Witch): roots, thorns, leaves, seeds, potions and moonflowers; a golden harvest sickle; her
     summons are prayers that take a moment to come (the Elderwood Guardian, a stag of living wood; Lunara, the moth
     goddess; Envoi, a great wyrm of folded letters with a lantern heart). Her trance is moonlight, silver-green.
   - **The foes**: a wisp is a soul starting to go hollow, craving light; a Shadow Wraith is what a wisp becomes when
     nobody helps it; Bramble Horrors and the Bramble Colossus are canes, thorns and berries; Halcyon is a paladin who
     glows; the final boss is a fire that will not end. **A beaten foe isn't killed: it is released, and a pale moth
     rises from it.**
   - The menus: quiet, soft taps that don't tire the ear.
3. **The battle music, remade**: made in code too, so it can change with the fight, and sounding like music, not beeps:
   a theme for ordinary fights, a heavier one for the bosses (Halcyon, the final boss), something that lifts when a witch
   is in her trance or at Curtain Call, and short victory and defeat pieces. Each loops without a seam. If you think a song
   file Chris makes himself (he makes his overworld songs that way) would serve a part better, say so in the slip with the
   prompt to make it, but make the code version anyway.
4. **A Sound Board page**, `moon-faire-witches/sound/sound-board.html`, built as one offline file: every sound by its
   name, a few plain words on what it is for, tap to hear it; and the music, each part playable. Uncluttered on a phone.
5. **The battle with the new sounds**, rebuilt as one offline file.

## Rules

- The project's rules (`CLAUDE.md`) and the workshop's (`moon-faire-witches/workshop/README.md`). Only the files below.
- Everything you save stays labeled (Chris, November 16): say in the sound file, beside each sound, what it is for and
  which beats use it, so it can be found and used again in his future games.
- Loud enough on a phone speaker (a Pixel 7a), never clipping: keep a limiter on the master, and check peaks.

## Files you may change

- `moon-faire-witches/src/battle/sound.js` (new) and `moon-faire-witches/sound/` (new: the board page and any tools)
- `moon-faire-witches/src/battle/screen.js`: only the names and arguments inside `SND.sfx.…()` calls, and the music calls
- the `sound.js` script tag in `battle/battle.html`, `spellbook/spellbook.html`, `lineup/lineup.html`, `bigbad/bigbad.html`
- `moon-faire-witches/README.md`: one row for the Sound Board in the pages table
- `moon-faire-witches/workshop/slips/battle-sound.md`

## Checks

- Every name `screen.js` calls on `SND.sfx` exists in the new file (a small script that reads both and lists any gap: 0).
- Each sound and each part of the music rendered offline (an `OfflineAudioContext` in the headless browser): its length
  and its peak, in a table in the slip; no peak above 0.95 after the limiter.
- `node tools/build.mjs --offline moon-faire-witches/sound/sound-board.html` and the battle page build; both open headless
  with 0 page errors; `node tools/arena-test.mjs dist/battle.html --fights band1,band3,horror,gate5 --level 12 --to turns:6 --turbo 6`
  passes with 0 page errors.

## Done when

The checks pass, Chris has heard the Sound Board and played a fight with the new sounds and is happy with them, and the
slip is written.
