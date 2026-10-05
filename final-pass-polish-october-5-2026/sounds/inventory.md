# Every sound in *Envoi on the Longest Night*: inventory for the sound audition tool

Read-only survey of `/home/user/envoi-on-the-longest-night` at HEAD `3312583` (October 5, 16:37). The sound code there is
the same as in Chris's own file (`final-pass-polish-october-5-2026/from-chris/Envoi_on_the_Longest_Night-1.html`,
`ENVOI_TRY = {steps, words, door, buy10}`). His file was built before commit `7ec00e8` (16:17), which only adds a pause
while the page is hidden. Every sfx, ambience, music and footstep call in his file was checked against src, and they all
match. `footsteps.js` and `screen.js` minify to exactly the same code.

Paths are relative to the repo. `file:line` is where the sound is made, or where the game triggers it.

## Counts

| Group | Distinct sounds | What they are |
|---|---|---|
| 1. Walking and places | **28** | 4 kinds of footstep, 18 place ambiences, 6 place effects (door, rest, a well's herb, a well's shards, an Ember Line node, a keepsake or gift) |
| 2. The Magpie and the flight | **4** | take-off, landing, the wind at the mist, an upgrade fitted |
| 3. Menus, dialogue, shops, saves | **4** | save, confirm, heal (herbs from the menu), buy. Dialogue, choices and opening the menu make no sound |
| 4. Battles | **20** | the sting before every fight, the 18 battle effects, the battle theme |
| 5. Music | **6** (+2 fallbacks) | 4 made-up pieces and Chris's 2 songs. 2 more made-up pieces play only if a song file can't load |
| 6. Cutscenes | **28** | Colossus first met: 17. Finale's opening: 11 (one of them is set to silence) |
| **Heard in play** | **90** (92 with the fallbacks) | |
| 7. Never played by the game | 150 library sounds, 3 library pieces, 1 song file | among them the four 4-step `step-*` clips (the old "buzz") |

---

## 0. The sound engines (what a tool must load)

| Engine | File | AudioContext | Output chain | Follows | Can a page call it outside the game? |
|---|---|---|---|---|---|
| **Thareia library**: 182 synthesized effects plus 9 made-up pieces | `src/game/thareia-audio.js` → `window.ThareiaAudio` | One, made by `sfxInit()` (:27) | each sound gets a per-call gain `k` → `OUT` (0.85) → compressor (−16 dB, 4:1, 3 ms/200 ms) → speakers. Reverb send: a generated 2.4 s convolver, wet 0.4 | Effects (`sfx`), Surroundings (`'amb'` bus) or Music | Yes. It's a plain script with no game state. `sfxInit()` must run inside a tap |
| **Footsteps** (try idea I01) | `src/game/footsteps.js` → `window.Footsteps.make(ctx)` | Borrows the library's: `make(() => ThareiaAudio.sfxContext())` | own gain = Effects/0.75 → **straight to the speakers** (no compressor, no reverb) | Effects, plus the Footsteps setting | Yes |
| **Chris's songs** | `src/game/songs.js` → `window.Songs.create({src, ctx})` | none. Each song is an `<audio loop>` element. On iPhones only, it goes through the library's context | `element.volume` = level × Music/0.75 | Music | Yes. Needs `src(path)` to turn `art/music/...` into a URL (a `data:` URL works) |
| **Battle sound** | `src/battle/sound.js` → `makeBattleSound()` | Its **own** (:15) | sfx bus 0.9×E/0.75 and music bus 0.3×M/0.75 → master 0.6 → compressor (−14 dB, 4:1) → speakers | Effects and Music | Yes. Call `init()` inside a tap, then `setVolumes(m, e)` |
| **Cutscene: the Colossus, first met** | `envoi-final-draft/cutscenes/colossus-first-meeting/copies/sounds.js` (`makeFieldSounds`) + `.../src/sfx.js` (`cutsceneSfx`) | Its own, made in `init()` and closed when the cutscene ends | groups bramble 0.9×E and night 0.55×S → master → compressor (−12 dB) | Effects and Surroundings | Only from the **source files**. The game's bundle (`colossus-first-meeting.js`) wraps them in an IIFE and exposes only `CUTSCENES[id].play()` |
| **Cutscene: the finale's opening** | `envoi-final-draft/cutscenes/finale-opening/src/sound.js` (`makeMoonwellSounds`) | Its own, closed at the end | buses music, effects and surroundings at the game's values → master → compressor (−14 dB) | Music, Effects and Surroundings | Only from the source file, for the same reason |

**The game's volume settings** (`game.js:152`, Settings rows `:846–849`): Off 0, Soft 0.4, Normal 0.75 (the default), Loud 1.
- The library uses `VOL = setting/0.75` (`setVolume`, :631): 0, 0.53, 1, 1.33.
- The battle uses the same /0.75. The songs use level × setting/0.75.
- The cutscenes get `min(1.25, setting/0.75)` (`game.js:675`): Normal is 1 and Loud is capped at 1.25.
- With Effects Off, nothing that goes through the game's `sfx()` plays, and neither do the footsteps. With Surroundings Off, no ambience plays. With Music Off, made-up music, songs and the battle theme all stop.

**Two quirks of the library that shape many sounds:**
- **Every sound is multiplied by its measured level.** `LEVEL` (`thareia-audio.js:362`) was generated from offline renders so that each sound is equally loud at gain 1. The per-call gain is `k = LEVEL[id] × VOL(bus) × gain` (`playSfx`, :352–359). Some levels are huge: wind 12.41, door 15.68, and rope-creak, sea and blizzard sit at the 16 cap.
- **The library's noise is a 2-second buffer that never loops.** It is made at `:35` (`NOISE`) and `noise()` (:83–87) starts it at a random offset of 0–1.5 s (`s.start(t, Math.random()*1.5)`). So **every noise layer longer than 0.5 s stops dead at a random moment between 0.5 and 2 s**, whatever its written length. The level often drops from fairly loud straight to silence.
  - Affected: wind (written as 3 s), river, leaves, blizzard, sea (the waves), campfire (the hiss), bats, the crash in `boss`, the rush in `ship-takeoff`, and the music's `wind` and `crash` instruments.
  - The battle engine has the same flaw on a smaller scale: a 1.5 s buffer at a random 0–0.5 s offset. It audibly cuts only `eclipse`.

---

## 1. Walking and places (28)

### 1.1 Footsteps (4). The game's current footsteps

**They only exist with the try idea switched on.** That means `ENVOI_TRY.steps`, which Chris's file has (`game.js:165, 198`). The Settings row "Footsteps" offers None, **Soft steps** (the default when switched on) and Cloak's swish (`game.js:849`).

- **Trigger:** `field.js:378` calls `opts.onStep(map, pace > 1.3)` → `game.js:199` `footstep(m)` → `feet.play(settings.steps, m.id, settings.sfx)` (`footsteps.js:36`).
  - A step happens **each time Io's painted walk cycle reaches frame 0 or frame 3 of its six**. `P.walk` grows by distance/52 px, and the frame is `floor(walk×6.4) % 6` (`field.js:377–378`, `painted-io.js:28`). That is one sound per footfall, both feet.
  - Only while the player moves Io. When a scene walks her (`field.io(path)`, `field.js:~408–414`) there are no steps, and other people never have steps.
- **Cadence:**
  - Walking at 1.7 of her heights a second (`game.js:239` pace 1.7, ioH 52): a step every **0.276 s** (3.6 a second).
  - After 0.8 s of walking without stopping, the pace ramps to 1.5× by 1.6 s (`field.js:337`, `RUN = 0.5`). Running, a step comes every **0.184 s** (5.4 a second).
  - `footsteps.js:37` refuses any step less than **0.19 s** after the last one played. While running, roughly every other step is dropped, unevenly.
  - The `running` flag field.js passes is ignored. Walking and running sound the same.
- **The sound:** one short burst of filtered noise from its own 2 s noise buffer, started at a random offset. These bursts are short, so nothing is cut.
  - Attack is a linear rise over 6 ms, then an exponential fall.
  - Output gain = Effects/0.75 (1 at Normal), straight to `AC.destination`.

| Sound | Made at | Ground and maps (`footsteps.js:12`; any other map counts as earth) | Synthesis (filter, length, peak) |
|---|---|---|---|
| Soft step, **earth** | footsteps.js:44–45 | cottage, thornwood, frozen-pass, and all 8 wilderness scenes (warm-roads-camp, ember-line-road, dawnroost-road, northern-camp, eldergrove-edge, cold-moor, frozen-camp, frostmere-shore) | lowpass 560 Hz, Q 0.7, 0.10 s, peak 0.114: a soft thud |
| Soft step, **stone** | footsteps.js:44–45 | wickhollow, dawnroost, dawnroost-node, crossroads, misthollow, moonwell | **highpass** 1350 Hz, 0.045 s, peak **0.037**: a faint tick or hiss, about 10 dB under earth |
| Soft step, **wood** | footsteps.js:44–46 | jetty, bogmire, bogmire-heart, shipyard | bandpass 340 Hz, 0.075 s, peak 0.134, plus a sine "knock" at 135–160 Hz, 0.065 s, peak 0.015 |
| **Cloak's swish** (instead of steps) | footsteps.js:42 | any map | bandpass 1900–2400 Hz (random), Q 0.9, 70 ms rise, 0.24 s, peak 0.045 |

**Tool:**
```js
const feet = Footsteps.make(() => ThareiaAudio.sfxContext());
feet.play('soft' | 'cloak', mapId, 0.75);
```
Call it from a loop that imitates `field.js`, so that the throttle behaves as in the game:
- every animation frame, `walk += speed*dt` (speed 1.7 heights/s, ramping to 2.55 between 0.8 and 1.6 s of continuous "walking");
- play whenever `floor(walk*6.4)%6` changes to 0 or 3.

Offer Walk and Run buttons, and a map or ground picker. **Do not** use the library's `step-grass`, `step-stone`, `step-wood` or `step-water`. Each holds 4 steps (water 3), 0.28 s apart (`thareia-audio.js:185–188`). Commit `b726047` played one per footfall (`sfx('step-'+ground, running ? 0.32 : 0.24)`), and `83a7ccd` (October 3) removed it. That is the "buzz" Chris remembers.

### 1.2 Place ambiences (18). One-shots on a timer, never loops

**Scheduler** (`game.js:201–212`):
- Every **500 ms**, if audio is on, Surroundings isn't Off, nothing is `busy` (dialogue, menu, scene, fight), the page is visible and the mode is `field`, it reads `AMBIENCE[map]` (`game.js:96–120`).
- Each entry is `[sound, a, b, v]`. The first time on that map, the sound is due at `now + a×random`. When due, it plays **once** with `amb(sound, v)` → `ThareiaAudio.playSfx(sound, undefined, v, 'amb')`. The next one is due at `now + a + random×(b−a)`.
- The due times are kept per map+sound for the whole session.
- There are no fades and no loops. Every "wind", "river" or "crickets" you hear on a map is one separate one-shot.
- Surroundings volume; the per-call gain is `LEVEL × v × S/0.75`.

**By map** (music from `game.js:122–123`; ground from `footsteps.js:12`):

| Map | Music | Steps | Ambience: sound (every a–b s, gain v) |
|---|---|---|---|
| cottage (Io's cottage) | made-up `title` | earth | crickets (6–12, .3), owl (14–30, .25) |
| wickhollow | song "Moonlit Forest Path" | stone | crickets (7–14, .25), clock (20–40, .2), dog (25–60, .15) |
| jetty | town song | wood | river (6–10, .35), rope-creak (9–18, .25), crickets (10–16, .2) |
| thornwood (wild) | song "Herbal Decay" | earth | crickets (5–10, .3), owl (12–26, .25), leaves (9–18, .25) |
| bogmire | made-up `marsh` | wood | frog (4–9, .3), crickets (7–13, .22), cave-drip (8–16, .2) |
| bogmire-heart | made-up `ruins` | wood | frog (5–10, .25), bats (12–24, .22), cave-drip (6–12, .22) |
| dawnroost | town song | stone | anvil (5–9, .28), campfire (7–12, .22), crickets (10–18, .18) |
| dawnroost-node | `ruins` | stone | vein-pulse (6–11, .25), campfire (8–14, .2) |
| crossroads (wild) | wilds song | stone | **wind (7–13, .25)**, owl (14–28, .22) |
| shipyard | town song | wood | hammer-wood (5–10, .25), rope-creak (8–15, .22), sea (9–16, .25) |
| frozen-pass (wild) | wilds song | earth | **wind (5–9, .32)**, blizzard (12–22, .2) |
| misthollow | `ruins` | stone | **wind (6–11, .25)**, bell (25–50, .15), owl (16–30, .2) |
| moonwell (the dead Moonwell) | `ruins` | stone | **wind (6–11, .25)**, nothing else |
| warm-roads-camp | wilds song | earth | campfire (5–9, .28), crickets (7–13, .22), owl (16–30, .18) |
| ember-line-road (wild) | wilds song | earth | crickets (6–12, .25), river (9–16, .2), vein-pulse (14–26, .12) |
| dawnroost-road (wild) | wilds song | earth | owl (10–22, .25), leaves (8–15, .25), crickets (9–16, .18) |
| northern-camp | wilds song | earth | campfire (5–9, .28), river (9–16, .2), owl (14–28, .2) |
| eldergrove-edge (wild) | wilds song | earth | leaves (7–14, .25), owl (10–20, .25), **wind (12–22, .15)** |
| cold-moor (wild) | wilds song | earth | **wind (6–11, .28)**, owl (16–30, .16) |
| frozen-camp | wilds song | earth | campfire (5–9, .28), **wind (6–11, .25)**, blizzard (18–30, .12) |
| frostmere-shore (wild) | wilds song | earth | **wind (5–10, .3)**, blizzard (14–24, .16) |

**By sound.** In the "real length" column, *cut* means the noise layer stops at a random 0.5–2 s (see section 0).

| id | thareia-audio.js | LEVEL | What it is | Written length | Real length in the game |
|---|---|---|---|---|---|
| `wind` | :206 | 12.41 | bandpass noise 450→900 Hz (Q 2), attack 0.8 s, gain .25, plus a whistle (bandpass 1400→900, Q 6, panned right) starting at +0.5 s | 3 s | **a 0.5–2 s gust that stops dead**. 8 maps, every 5–22 s |
| `river` | :238 | 2.87 | two noise layers (lowpass 1400 with a 1.3 Hz swell; bandpass 3000 with a 2.1 Hz swell, right), attack 0.5 s | 3 s ("a short sample of a loop") | 0.5–2 s, cut |
| `leaves` | :296 | 5.73 | bandpass noise 3500 Hz with a 3 Hz flutter, attack 0.8 s | 2.8 s | 0.5–2 s, cut |
| `blizzard` | :298 | 16 | noise bandpass 350→900 (Q 5, attack 0.9), plus a second noise from +1 s | 3 s | both layers cut at 0.5–2 s |
| `sea` | :301 | 16 | wave noise lowpass 900 with a 0.35 Hz swell, attack 1.2 s, plus three gull cries at 0.5, 1.2 and 1.9 s | 3 s | the waves are usually cut before or near their crest; the gulls carry on |
| `campfire` | :237 | 8.2 | low hiss (lowpass 600, attack 0.3) plus 30 random crackles over 2.8 s | 3 s ("a short sample of a loop") | the hiss is cut at 0.5–2 s; the crackles go on to 2.8 s |
| `bats` | :308 | 8.43 | bandpass noise with a 22 Hz flutter, plus 8 high squeaks | 1.5 s | the noise is cut at 0.5–1.5 s about 2 times in 3 |
| `crickets` | :293 | 6.03 | three sines at 4.2, 4.6 and 5.0 kHz with a 32 Hz on/off tremolo, rising for 0.4 s and fading to nothing at 3 s | 3 s | 3 s, not cut. A swell, then silence until the next one |
| `owl` | :294 | 4.31 | two lowpassed hoots (420→380 Hz for 0.35 s, then 400→360 Hz for 0.6 s at +0.5 s), reverb .6 | ~1.1 s | same |
| `clock` | :289 | 5.27 | four FM bells (E5 C5 D5 G4), 0.55 s apart | ~3.5 s | same |
| `dog` | :285 | 7.61 | two formant "barks" at 0 and 0.3 s | ~0.45 s | same |
| `rope-creak` | :210 | 16 | two sawtooth creaks with 18 Hz vibrato through bandpass 900 (0.6 s, then 0.5 s at +0.7 s) | ~1.2 s | same (buzzy, at the 16 cap) |
| `frog` | :222 | 1.29 | two square-wave croaks (110 and 105 Hz) with a 30 Hz flutter, 0.38 s apart | ~0.7 s | same |
| `cave-drip` | :300 | 6.1 | five rising blips about 0.55 s apart, reverb .9 | ~2.8 s | same |
| `anvil` | :281 | 1.62 | three FM rings 0.45 s apart, plus light thumps | ~1.5 s | same |
| `vein-pulse` | :259 | 0.93 | 55 Hz and 110 Hz sines with a 1.4 Hz throb | 1.4 s | same |
| `hammer-wood` | :284 | 2.71 | five click-and-knocks 0.35 s apart | ~1.5 s | same |
| `bell` | :239 | 4.96 | two FM tolls at 196 Hz, 1.2 s apart, 2.5 s each | ~3.7 s plus reverb | same |

The Settings preview also plays an ambience. Picking a Surroundings level plays `amb('crickets', 0.5)` (`game.js:843`). That is louder than crickets on any map (.18–.3).

**Tool:**
- One sound: `ThareiaAudio.playSfx(id, undefined, v, 'amb')`.
- "A place as in the game": copy the scheduler (500 ms tick and the same random rule) with that map's `AMBIENCE` list, and let it run **30–60 s or more**. The rarest sounds, Wickhollow's dog (25–60 s) and Misthollow's bell (25–50 s), need a minute.
- Add footsteps and the map's music for the full picture.

### 1.3 Place effects (6). Library, Effects, gain 1

| id | Made at | What it is | When the game plays it (`game.js`) | Length |
|---|---|---|---|---|
| `door` | thareia-audio.js:189, LEVEL **15.68** | latch click (bandpass 1600) plus a creaking door (sawtooth creak, 0.55 s) | **Try idea I08 (on in Chris's file):** each time Io walks off a map into another walking map (`onExit`, :452), never into a fight or a flight. It plays as the screen fades out for 0.3 s | ~0.65 s |
| `hearthfire` | :193, 2.86 | F major chord (2 s), 14 crackles over 1.8 s, a 4-note lullaby from 0.4 s | resting at a camp fire or a Moonwell (`rest`, :612), under the 0.6 s fade to black | ~2.3 s |
| `chest` | :179, 4.96 | hinge creak 0.45 s, latch click, two-note chime | a well's letter leaves an herb Io can carry (:553) | ~1.1 s |
| `coins` | :180, 7.19 | seven FM coin pings | a well leaves shards, or an herb Io can't carry is traded (:554–555) | ~0.5 s |
| `node-wake` | :263, 1.19 | 6-note D arpeggio 0.18 s apart, then a thump and a D major chord at 1.1 s | Sol relights an Ember Line node (:541) | ~2.7 s |
| `secret` | :336, 5.93 | 8-note mysterious flourish 0.09 s apart | Io kneels for a keepsake (:565), a townsperson's gift (:582), the gifts after the first Colossus (:588) | ~1 s |

---

## 2. The Magpie and the flight (4). Library, Effects

| id | Made at | When (`fly.js` / `game.js`) | How | Notes |
|---|---|---|---|---|
| `ship-takeoff` | thareia-audio.js:198, LEVEL 2.21 | each flight starts (`fly.js:115`, with `music('flight')`) | 2.2 s: three hums (110, 165 and 220 Hz) gliding up an octave, a chord, and a rushing noise from +0.4 s that gets cut | matches the 2.2 s climb |
| `ship-land` | :199, 1.09 | **when "Land here" or "Land where we took off" is tapped** (`fly.js:106`), not when she touches down | ~1.65 s: hums gliding down, a thump at 1 s, a creak at 1.15 s | she then flies to the stop and comes down at 3 m/s. From "Land where we took off" that can be a long flight, so the bump comes well before the landing |
| `wind` (at the mist) | :206, 12.41 | the ship turns back from cold mist (`fly.js:150`), **at most once every 3 s** | the same 0.5–2 s cut gust as on the maps | goes through `sfx()`: **Effects bus, gain 1**. That is 3–4× (10–12 dB) louder than the maps' wind, which is Surroundings at .25–.32 |
| `upgrade` | :275, 1.23 | paying for a Magpie upgrade in Bogmire, Dawnroost or the shipyard (`game.js:623`) | ~1.4 s: tool clicks, a thump, a rising hum, a two-note chime | |

The flight has no ambience: the scheduler only runs in `field` mode. Its only bed is the made-up piece `flight` (section 5).

---

## 3. Menus, dialogue, shops, saves (4). Library, Effects, gain 1

| id | Made at | When (`game.js`) | What it is |
|---|---|---|---|
| `ui-save` | thareia-audio.js:120, LEVEL 1.66 | the menu's Save button (:782); saving to a slot (:882) | four rising triangle notes (C5 E5 G5 C6) 0.07 s apart, ~0.7 s |
| `ui-confirm` | :113, 2.08 | a change on the Items page (:827); **picking an Effects level** in Settings, as a preview (:843) | two notes (E5→B5) 0.06 s apart, ~0.26 s |
| `heal` | :165, 2.04 | using an herb from the menu (:820); healing outside fights (:837) | five sine notes (C5–E6) 0.07 s apart, ~0.9 s |
| `ui-buy` | :121, 3.61 | the herb shop's Buy (:953) and Buy 10 (:959, try idea I12, on in Chris's file) | two coin pings 0.07 s apart, ~0.42 s |

**Silent:**
- opening or closing the menu, and moving between its pages;
- dialogue text (no letter blips), questions and answers, toasts;
- the title screen's buttons and the keepsake cards.

The Settings previews: Effects plays `ui-confirm`, and Surroundings plays crickets at 0.5 (section 1.2). Turning Music on again restarts the map's music.

---

## 4. Battles (20)

All of them come from `src/battle/sound.js` (`SND`, created in `game.js:172` and handed over as `cfg.sound`, `:716`), except the first.
- Effects go on the battle sfx bus (Effects); the theme goes on the music bus (Music).
- **The sting before every fight** is `boss` from the library (thareia-audio.js:231, LEVEL 1.23, Effects): `swirl()` in `game.js:659`. It is a dark brass chord, 6 timpani thumps and a crash (the crash gets cut). It plays 0.85 s before the battle screen, after the map music fades out over 0.6 s (`:701`).

### 4.1 The 18 battle effects (`sound.js`)

| Call | Line | What it is | Length | Argument |
|---|---|---|---|---|
| `swish()` | 33 | bandpass noise 2600→700 Hz, peak .35 | 0.2 s | |
| `hit(p)` | 34 | 150→45 Hz sine thump (.55p), a lowpassed noise click (.3p) and a 1900→1200 Hz triangle ping (.08p) | 0.18 s | p is the strength, 0.6–1.3 |
| `fire()` | 35 | lowpass noise opening 400→2200 Hz (attack 0.12), plus a 90→160 Hz saw | 0.55 s | |
| `boom(p)` | 36 | lowpass noise 1200→70 Hz (.55p) plus an 80→32 Hz sine (.6p) | 0.8 s | p 0.4–1.5 |
| `chime()` | 37 | four sines (880, 1320, 1760, 2640 Hz) 0.06 s apart | ~1.1 s | |
| `blade()` | 38 | 1400→2600 Hz sine plus highpass noise | 0.22 s | |
| `heal()` | 39 | five sines (523–1319 Hz) 0.08 s apart | ~1 s | |
| `guard()` | 40 | 660→990 Hz triangle plus a 990 Hz sine | ~0.55 s | |
| `moon()` | 41 | four soft saws (D F A D) with a 0.8 s attack, octave sines, four high bells | 2.4 s | |
| `shriek(len)` | 42 | two saws at 1100/1170 Hz falling to 260 Hz, with 17 Hz vibrato, plus bandpass noise | **len seconds** (0.5–1.4; default 0.9) | **the number is its length, not its loudness** |
| `grasp()` | 43 | low lowpass rumble 180→90 Hz (attack 0.2), plus a 55→42 Hz saw | 1.1 s | |
| `eclipse()` | 44 | 42→30 Hz saw (attack 0.6), plus lowpass noise 150→900 Hz with a **1.6 s swell** | 2.4 s written; **the noise stops dead at 1.0–1.5 s, mid-swell** | |
| `menu()` | 45 | 1100 Hz square blip | 0.05 s | |
| `select()` | 46 | two square blips (1320 then 1760 Hz) | ~0.13 s | |
| `trance()` | 47 | 400→1600 Hz sine sweep plus three bells | ~1.5 s | |
| `fanfare()` | 50 | 11-note D major call (square plus triangle, 0.16 s steps), then a held D chord for 2.4 s over a 147→73 Hz sine, drum taps, a roll and a cymbal | ~4.3 s | |
| `victory()` | 61 | six-note D major arpeggio 0.13 s apart, then a held chord | ~2.25 s | |
| `defeat()` | 62 | four falling triangle notes 0.38 s apart | ~1.7 s | |

### 4.2 The battle theme (`sound.js:66–84`)

- D minor, i–VI–VII–V, 132 BPM, sixteenths scheduled ahead every 25 ms.
- Parts: a sawtooth bass on eighths (lowpass 420), a square-wave sixteenth arpeggio (lowpass 2200), kicks on steps 0, 6, 8 and 11, snare on 2 and 4, hats on the off-sixteenths, a cymbal every 4 bars.
- **The whole theme is a 4-bar, 7.27-second loop that repeats unchanged for the entire fight.**
- `startMusic()` (:83) starts it at full level with no fade-in, at "The foes attack!" (`screen.js:1902`).
- `stopMusic(fade)` (:84) is a linear fade: 1.2 s on a win (1933), 1.0 s on fleeing or losing (1954, 1957), 2 s on the finale's win (1971), 1.4 s or 1.2 s on Halcyon's endings (2051, 2069), 0.3 s on teardown (2472).
- Level: music bus 0.3 × Music/0.75 into the 0.6 master.

### 4.3 What triggers what (`src/battle/screen.js`)

**Flow:**
- the `boss` sting (game.js);
- then a cutscene, if the fight has one;
- then the foes appear. The first fight only (`cfg.bridge`): `shriek(1.2)` (1860). Otherwise one `shriek(1.0)` (1881), unless the fight follows a cutscene (`cfg.standing`);
- then "The foes attack!" and the theme (1902).

**During the fight:**
- choosing a command or target: `select` (345);
- arrow keys and Esc/back, keyboard only: `menu` (343, 353). On a phone only `select` is heard;
- a Trance gauge filling: `chime` (573);
- a foe falling: `shriek(0.9)` (609). A hero falling makes no sound.

**Endings:**
- **Win:** the theme fades, `boom(0.9)` as the last foe dies (1939), then on Bogmire's win a `chime` for each relit lamp (1916). Then **`fanfare`** for set fights (the great wraith at Bogmire, Dawnroost, every Bramble Colossus: `fights.js:193, 209, 288`), otherwise **`victory`** (1947).
- **Lose:** `defeat` (1957). **Flee:** silent (1954).
- **Finale's ending:** chime, fire, swish, fire, then boom(1.5) on the last strike or hit(0.7) on the others (1980–1994); moon as Noctara falls (2006), chime as Halcyon falls (2010), victory (2013).
- **Halcyon's ambush:** chime (2029); Sol learns Kestrel Stoop, swish then chime (2041–2043); her retreat, eclipse (2059); spared, defeat then eclipse (2069, 2090). The end card plays chime (2124).
- **Weather (arena fights):** in the wilds a fight sometimes rolls rain or a storm (`fights.js:76`).
  - A storm brings lightning every 3–8 s, then `boom(0.4–0.8)` after a delay set by its distance. A ground strike (wrath) gives `boom(1.3)` (`arena.js:956, 993` → `screen.js:2205`).
  - The Colossus's Wrath on a flat painting: `boom(0.5–1)` 0.35–0.85 s after each red flash (231).
  - **Rain is silent.**

**Heroes:**

| Move | Sound sequence (screen.js lines) |
|---|---|
| any melee blow (Io's and Sol's Attack, Flare Cut, Sunder, Ember Rush, Solar Crest, Daybreak, High Noon) | per blow: `swish` 0.04 s before the hit (638), then `hit(0.9)`, or `hit(1.2)` for a big blow (625). Multi-blow moves give rapid swish+hit pairs |
| Io: Flame | `fire` (675), then `boom(0.8)` when it lands (683) |
| Io: Crescent | `chime` (689), `blade` (695), `hit(0.7)` per hit (700) |
| Io: Briars | `fire` (708), `grasp` (713), `hit(1.1)` (714) |
| Io: Mend, Waxing | `heal` (722, 731) |
| Io: Moonsteel | `chime` (743), `blade` (748) |
| Io: Harvest Moon | `chime` (755), `fire` (760) |
| Io: Moonlight | `moon` (772), `boom(1.1)` on each strike (782) |
| Defend (Io), Guard (Sol) | `guard` (764, 812) |
| Sol: Kestrel Stoop | `swish` as she rises (820); next turn `swish` (828), then `boom(1.2)` (830) |
| Sol: Kestrel (calls Halcyon) | `chime` (840) |
| Trance | `trance`, plus `moon` for Io or `fire` for Sol (882), then `boom(0.7)` and `chime` (890) |
| Lunara: summon and Embrace | `chime` (904), `moon` and `boom(0.6)` (909), `chime` and `boom(0.5)` (923), `heal` (928) |
| Lunara: Silver Requiem | `moon` (946), `blade` (950), `hit(0.8)` for each of up to 6 beams (962), Moonfall `eclipse` (967), then **`boom(1.5)` and `boom(1.0)` together** (972) |
| Envoi: summon and made | `chime`, `fire`, `swish`, `boom(0.6)`, `boom(1.0)` (1078–1097, 1120–1132) |
| Envoi: ward takes a blow | `hit(1.0)` (1069) |
| Envoi: strike | `fire` (1147), `hit(0.8)` per burn (1159), Last Word **`boom(1.5)` and `boom(1.0)` together** (1154) |
| Herb in battle | `heal` (873) |
| Flee | `swish` (855) |
| Halcyon's counter on a hero | `swish` (660), then `hit(1.1)` (664) |

**Foes:**

| Foe and move | Sound sequence |
|---|---|
| Wraiths: Sweep / Bolts / Grasp | `shriek(0.6)`, `swish`, `hit(1.1)` (1180–1185) / `shriek(0.5)`, `fire`, `hit(0.7)` per bolt (1191–1198) / `grasp`, `hit(1.2)` (1206–1210) |
| Wraiths: Eclipse / Breath / Swallow | **`eclipse` and `shriek(1.4)` together**, then `boom(1.3)` (1216–1222) / `shriek(0.8)`, `fire`, `fire` (1234–1239) / `grasp`, `heal` (1247–1251) |
| Wisp: Flicker / Cling / Wail / Breath / Gutter | `fire`, `hit(0.8)` / `grasp`, `hit(0.6)` / `shriek(0.9)` / `fire` / silent (1259–1296) |
| Halcyon: blows / Dusk Arc / Vow Stance / Black Noon | `swish` and `hit(1.2/1.0)` per blow, plus `heal` when it heals her (1307–1323) / `swish` (1339) / `guard` (1350) / gathering `eclipse` (1699), then `eclipse`, `swish`, `boom(1.5)` (1363–1367) |
| Noctara: Crown Shards / Void Sphere / Frost Dust / Blackout | `chime`, `hit(0.8)` per shard (1382–1386) / `eclipse`, `boom(1.5)` (1394–1397) / `chime`, then `hit(1.1)` when its blow thaws (1405, 1430) / `eclipse`, `swish` and `hit(1.3)` (1413–1418) |
| Bramble Horror: Strike / Sweep / Grab / Consume / Undergrowth / Lure | `swish`, `hit(1.2/0.95)` / `swish`, a hit per hero (1452–1457) / `grasp` / `grasp`, `hit(0.8)`, `heal` / `grasp`, `boom(0.6)` / `chime` (1441–1504) |
| Bramble Colossus: Lance / Slam / Whirl / Volley / Briar / Devour / Enrage / Bloom / quake | `grasp`, `swish` / `grasp`, `eclipse`, `hit(0.9)` / `grasp`, `swish`, `swish` per wave / `swish`, `swish` per thorn / `grasp` / `grasp`, `hit(0.85)`, `heal`, `boom(0.6)` / `grasp`, **`eclipse` and `shriek(1.3)` together** / `chime` / `boom(0.6–1.0)` (1521–1644) |
| Any other foe's move (`anyMove`) | `swish` (unless the move is on itself), then a hit per blow; `heal` if it heals itself (1660–1676) |
| Any foe gathering a charged blow | `eclipse` (1699) |

**Tool:**
```js
const SND = makeBattleSound();
SND.init();                     // in a tap
SND.setVolumes(0.75, 0.75);
SND.sfx.hit(1.1); SND.sfx.shriek(1.4); SND.sfx.fanfare();
SND.startMusic(); /* ... */ SND.stopMusic(1.2);
```
- To hear a move "as in the game", play its sequence with the gaps the motion gives. The exact times come from the models' `ACTIONS[move].hits/cues`, which a tool can't read without the 3D models. About 0.2–0.5 s apart is a fair imitation.
- A melee blow is `swish`, then about 0.05 s later `hit`.
- Let the theme run for at least 15 s, so the 7.3 s loop is heard repeating.

---

## 5. Music (6, plus 2 fallbacks)

**Rules** (`game.js:185–193`):
- Each map plays the id from `MUSIC[map]`. `town` and `travel` become Chris's songs (`SONG`, :175). Every other id is a made-up piece from the library.
- **Same id on the next map:** it keeps going.
- **Song to made-up piece, or the other way:**
  - songs fade in and out over 0.8 s (`songs.js:22`, a 40 ms stepped fade), or 0.6 s when stopped for a change (:191);
  - a made-up piece fades out linearly over 0.6 s;
  - **the next made-up piece starts at once at full level, from its first bar** (`musicPlay`, :596).
- **Fights:** `music(null)` before the fight. Afterwards the map's music returns (:727). **The songs carry on where they left off; the made-up pieces restart from bar 1.**
- The songs pause while the page is hidden. Since 7ec00e8 the library and battle contexts are suspended while hidden.

| Music | Made at | Where | Style | Loop |
|---|---|---|---|---|
| **"Thareia (main theme)"** `title`, made-up | thareia-audio.js:510 | the title screen after the first tap (:1014, :1028), a new game's prologue (:1046), **Io's cottage**, the ending card (:748) | D major, 76 BPM, strings, brass, choir, bells, taiko | 16 bars = **50.5 s**, loops whole |
| **"Gloomfen Drift"** `marsh`, made-up | :557 | Bogmire | D Dorian, 84 BPM, reed, harp, frog percussion, pad | **45.7 s**, loops whole |
| **"Beneath the Stone"** `ruins`, made-up | :546 | Bogmire's dark heart, Dawnroost's living node, Misthollow, the dead Moonwell | A minor, 66 BPM, bells, heartbeat, choir, reed. Bars 1–4 have a `wind` instrument (:403) that is nearly inaudible: a 3.6 s attack on a noise cut at 0.5–2 s | **43.6 s**, loops whole |
| **"Sunstone Wind"** `flight`, made-up | :484 | flying the Magpie (`fly.js:115`) | D Lydian, 80 BPM, echoing bells, choir, heartbeat, `wind` (bars 1–12, nearly inaudible and cut, as above), flute | **60 s**, loops whole |
| **"Moonlit Forest Path"**, Chris's song | `songs.js:19`, file `art/music/towns-moonlit-forest-path.webm` (Opus, 48 kHz, stereo, **3:14.6**) | Wickhollow, the jetty, Dawnroost, the shipyard | level **0.37** × Music/0.75 | `<audio loop>`. Ends quieter (last 2 s mean −31.7 dB) and jumps back to its full start (first 2 s −19.9 dB) |
| **"Herbal Decay"**, Chris's song | `songs.js:20`, `art/music/wilds-herbal-decay.webm` (**3:51.8**) | the Thornwood, the crossroads, the frozen pass, and all 8 wilderness scenes | level **0.41** × Music/0.75 | `<audio loop>`. End −36.3 dB, start −26.6 dB |
| *fallback* "Market Day" `town`, made-up | :533 | only if the town song can't play (`onFail`, :176) | F major, 108 BPM | 35.6 s |
| *fallback* "Over the Wilds" `travel`, made-up | :452 | only if the wilds song can't play | G major, 92 BPM | 73 s the first time, then loops its last 62.6 s |

**Made-up music level:** a bus at 0.9 × Music/0.75, a reverb send at the same level, and a tempo-synced echo (3/16, feedback 0.38, lowpass 2600).

**Tool:**
- Made-up pieces: `ThareiaAudio.musicPlay(id)`, which loops until `ThareiaAudio.musicStop(0.6)`. It calls `sfxInit()` itself.
- Songs:
  ```js
  const songs = Songs.create({ src: (p) => BASE + p, ctx: () => ThareiaAudio.sfxContext() });
  songs.setVolume(0.75);
  songs.play('town' | 'wilds');
  ```
- Offer "jump to the last 10 s" so the loop seam can be heard. For the made-up pieces, run at least one full loop.

---

## 6. Cutscenes (28)

Each plays once (`st.seen`) and can be watched again from Settings (`game.js:691`, which mutes the map music during it).
- Each makes **its own AudioContext**, builds its sounds sample by sample after `init()` (a `ready` flag), and closes the context at the end.
- Volumes come from `csOpts` (`game.js:675`).
- The scripted cue times are below; the cues are in each `src/scene.js`.

### 6.1 "The Colossus, first met" (45 s, 17 sounds)

It plays before the first wild fight with a Bramble Colossus (band 4, `game.js:668`). It has no music.
- Bramble sounds and the cutscene's own sounds are Effects (group 0.9×E).
- The wind and the night are Surroundings (group 0.55×S).
- Reverb: a 3 s "snowy meadow".

| Sound | Made at | Kind | When in the 45 s |
|---|---|---|---|
| wind in the spruce | copies/sounds.js:253 (`makeWind`), started at :373 | **a 36 s seamless stereo loop with gusts**, level .35 × (wind/.6)^.8 ≈ .30 | from 0 (fades in with a 2 s time constant); eased to ≈ .26 at 40 s (`'snd','wind',.42`) |
| eagle owl | `night('owl')` :400 | 1.7 s hoot, 2–3 times, 5.5–8.5 s apart; level .7 | 0.6 s (gain .9, left, far) |
| lake ice | `night('ice')` | falling ringing notes (3 s) or a deep boom (4 s); .55 | 8.9 s (gain .7, right, far) |
| tawny owl, redwings, trees in the frost, wolves | `night()` through `tick()` :412 | random calls (7.6 s / 2–4 "tseeps" of 0.5 s / 1.4 s crack or creak / 6.4 s howl) | possible until 23.75 s, when `'snd','quiet'` stops new calls. First calls fall 8–110 s in |
| the Bramble's: shoots, groan, step (a leg), rustle, breath | `bramble()` :392 through `cast.js:41–46` `BRAMBLE_SOUNDS.appear` | 2.8 s / 3.8 s / 0.7 s ×2 / 0.9–2.1 s / 2.8 s | 23.75 s, the Colossus rises: shoots at 0%, groan at 12%, steps at 42% and 45%, groan at 58%, rustle at 62%, breath at 66% of its appear motion. Big ones hush the night for 35 s |
| creak, rustle | `BRAMBLE_SOUNDS.alert` | ~1–1.6 s each | 33.25 s (`alert`) |
| heartbeat | `bramble('heart')` (`player.js:224`) | 1 s, two soft beats | on each heartbeat while the camera is within about 14 m (the "heart" shot, 33–39 s) |
| frost footsteps (3 variants) | src/sfx.js:15 (`makeStep`), LEVEL .32 | 0.3 s thud plus crunch, pitch ±8% | Io and Sol walking (0–7.5 s, and when they walk again): one per footfall, gain .55 × walk |
| Sol's blade lighting | src/sfx.js:27, LEVEL .7 | 2.2 s whoosh, then a warm hum with a shimmer | 20.55 s, at her chest |
| ground rumble | src/sfx.js:42, LEVEL .9 | 2.6 s deep swell | 22.4 s |

### 6.2 "The finale's opening" (72 s, 11 sounds)

It plays before the finale's first try. Reverb: a 3.4 s "stone court".

| Sound | Made at (`finale-opening/src/sound.js`) | Kind, LEVEL, bus | When in the 72 s |
|---|---|---|---|
| wind over the peaks | :29 | **24 s stereo gust loop** with a high whistle; .45; Surroundings | from 0. Starts at 1.2 (`setWind(.6)`), then 1.3 at 0 s (2 s), 1 at 21 s (4 s), .75 at 27 s, .55 at 36 s, .6 at 65 s |
| the empty well's hush | :44 | 16 s loop, low hollow breath; .32; Surroundings | .05 at 0 s, 1 at 28 s, .55 at 43.5 s |
| drone (its music) | :50 | 32 s A-minor drone; .3; **Music** | 1 from 0 s (rising with a 4 s time constant) |
| braziers' fire | :66 | 10 s loop; **LEVEL 0, so it is silent** | raised to .35 at 31 s and .7 at 50 s; nothing is heard |
| frost crack (2 variants) | :77 | 0.7 s; .3; Surroundings | 36.6 s (right), plus random ones every 5–13 s (first about 6 s in) |
| banner flap (2 variants) | :78 | 0.9 s; .32; Surroundings | 14 s (left, far), plus random ones every 8–18 s (first about 9 s in) |
| footsteps on frosted stone (3 variants) | :79 | 0.32 s; .3; Effects | one per footfall while Io and Sol walk up to the court (50–61 s), gain .55 × walk. Halcyon has steps too, if she walks; Noctara has none |
| Sol's blade | :80 | 2.2 s; .7; Effects | 54.1 s |
| Halcyon's vow (blade turning) | :90 | 2.6 s scrape and ring; .6; Effects | 58.35 s |
| Noctara's rite | :98 | 6 s stereo swell and shimmer; .75; Effects | 43.2 s |
| the great bell | :111 | 9 s toll; .55; Surroundings | 64.6 s (far) |

**Tool:**
- Load the source files as plain scripts: `copies/sounds.js` and `src/sfx.js` for the Colossus, `finale-opening/src/sound.js` for the finale. The game's bundles hide these functions.
- Colossus:
  ```js
  const s = makeFieldSounds();
  s.setGroup('bramble', .9); s.setGroup('night', .55);
  s.init(); s.setWind(.5);     // in a tap
  // wait for s.ready
  s.night('owl', { gain: .9, pan: -.6, far: .8 });
  s.bramble('groan', { gain, pan, far });
  cutsceneSfx(s).play('blade' | 'rumble' | 'step', { gain });
  // a requestAnimationFrame loop calling s.tick(dt) for the random night
  s.close();
  ```
- Finale:
  ```js
  const m = makeMoonwellSounds();
  m.setVolumes({ music: 1, effects: 1, surroundings: 1 });
  m.init(); m.setWind(.6);     // beds start by themselves as they're built
  m.night('wind', { gain: 1.3, secs: 2 });
  m.play('bell' | 'rite' | 'vow' | 'blade' | 'step' | 'crack' | 'flap', { far, pan });
  // m.tick(dt) for the random cracks and flaps
  m.close();
  ```
- Best of all, a "play the cutscene's sound timeline" button that fires the cues above at their times.

---

## 7. Never played by the game

- **150 of the library's 182 effects.** The library's header still says "100". Among them:
  - `step-grass`, `step-stone`, `step-wood` and `step-water` (4 or 3 steps per clip: the old buzz);
  - `deck-steps` (4 steps), `armor-walk` (4), `stairs` (5);
  - `ui-blip`, `ui-open`, `ui-close`, `ui-cursor`;
  - `rain`, `thunder`, `waterfall`, `market` and `well-bucket`;
  - the library's own `victory` and `defeat`.
- **3 of its 9 pieces:** `battle` ("Break the Grip", :469), `boss` ("The Holder Wakes", :518), `desert` ("Sunscorch Road", :569).
- **`art/music/battle-herbal-decay.webm`** (3:19.9). Chris chose the original battle theme instead (October 4).
- **The Io on Foot page** (`demos/io-on-foot.html`, `src/walk/on-foot.js`) has the same footsteps as `footsteps.js`, except that its unknown ground is stone, not earth. It is not part of the game.
- The demos in `reference/`, `living-battlefields/`, `3d-cutscenes/` and `3d-model-*/` have their own sounds and are not in the game.

---

## 8. Suspicious, one line each

1. **Wind on the walking maps is a 0.5–2 s puff that stops dead, once every 5–22 s.** It is a one-shot written as 3 s (`thareia-audio.js:206`), fired by a timer (`game.js:202`). The library's non-looping 2 s noise, started at a random 0–1.5 s offset (`:35`, `:86`), cuts it at random. There is no wind bed.
2. **The same truncation cuts** the river, leaves, blizzard, the sea's waves, the campfire's hiss, the bats' wings, the crash in the `boss` sting before every fight, and the rush in `ship-takeoff`. River and campfire are described in the library itself as "a short sample of a loop", yet the game plays them as one-shots.
3. **The music's `wind` instrument is all but inaudible.** In `flight` and `ruins` it has a 3–3.6 s attack on a noise that stops at 0.5–2 s (`:403`), so it peaks around −20 to −35 dB under its level and then cuts.
4. **Every ambience is one-shots with gaps, never continuous.** Crickets swell and fade over 3 s, then go quiet for 3–13 s. The Moonwell has only wind.
5. **The mist's wind in the flight is about 4× louder than the maps' wind.** It uses Effects at gain 1, while the maps use Surroundings at .25–.32 (`fly.js:150` → `game.js:194`), and it follows the Effects volume, not Surroundings.
6. **Ambience piles up.** The due times keep running during dialogue, menus, fights and other maps. So when Io comes back to a map, or after any talk or fight, every sound of the map that came due fires together on one tick (`game.js:208–210`), for example Wickhollow's crickets, clock and dog at once.
7. **Running footsteps limp.** Steps come every 0.184 s, and `footsteps.js:37` drops any step within 0.19 s of the last. About every other step is silent, unevenly (it depends on frame timing). Walking (0.276 s) is fine.
8. **Stone footsteps are almost inaudible.** A 45 ms highpass hiss at peak .037 against earth .114 and wood .134 (`footsteps.js:44`), on Wickhollow, Dawnroost, the crossroads, Misthollow and the Moonwell.
9. **Footsteps skip the mix.** They go straight to the speakers, missing the library's 0.85 master, compressor and reverb (`footsteps.js:40`). The `running` flag is ignored. Snowy maps (cold moor, frozen camp, Frostmere's shore) use the dull "earth" thud.
10. **The library's `step-*` clips hold 4 steps each** (water 3), 0.28 s apart (`:185–188`). Played once per footfall in commit `b726047`, that was the "buzz". It is gone from the game, but the clips are still in the library and must not be used as the game's footsteps.
11. **Battle `eclipse` is cut off mid-swell.** Its 2.4 s noise swell (attack 1.6 s) plays from a 1.5 s buffer at a random 0–0.5 s offset (`sound.js:19, 30, 44`), so it stops dead at 1.0–1.5 s. Heard in Moonfall, Black Noon, Void Sphere, Blackout, the Wraith's Eclipse, the Colossus's Slam and Enrage, every charged turn, and Halcyon's endings.
12. **`shriek(x)` takes a length, not a loudness.** The callers pass 0.5–1.4 like the strengths of `hit()` and `boom()`, but `x` is the length in seconds (`sound.js:42`).
13. **Some sounds stack up in battle:** `boom(1.5)` with `boom(1.0)` at the same instant (Last Word, Moonfall, the finale), and `eclipse` with `shriek(1.4)` (the Wraith's Eclipse) or with `shriek(1.3)` (the Colossus's Enrage). They likely pump the compressor.
14. **The battle theme is a single 7.27-second, 4-bar loop for the whole fight**, starting at full level with no fade-in (`sound.js:68, 83`).
15. **`ship-land` plays when a landing is chosen, not at touchdown** (`fly.js:106`). From "Land where we took off" the flight there can take a long time before she comes down.
16. **The finale's brazier bed is silent.** Its `LEVEL.fire` is 0 (`finale-opening/src/sound.js:116`), although the script raises it at 31 s and 50 s and its README says it is "heard near them". It has been like this since the cutscene's first commit.
17. **Made-up music restarts from bar 1 after every fight** (Bogmire, the ruins maps, the cottage), and each new piece starts at full level with no fade. Chris's songs carry on where they left off.
18. **Chris's songs jump at their loop point**, from a quiet ending straight back to a full-level start (towns: −31.7 dB to −19.9 dB; wilds: −36.3 dB to −26.6 dB), every 3:15 and 3:52.
19. **The extreme `LEVEL` boosts make loudness vary from play to play.** Wind 12.41, door 15.68, and rope-creak, sea and blizzard at the 16 cap. Because their noise is cut at a random point, two plays can differ a lot. Rope-creak is a buzzy sawtooth at the cap, on the jetty and in the shipyard.
20. **The Surroundings preview in Settings plays crickets at 0.5** (`game.js:843`), louder than they ever play on a map (.18–.3), so it doesn't preview how the maps sound.
21. **Rain in an arena fight makes no sound.** Only a storm's thunder plays, as `boom`.

---

## 9. The most important facts for building the tool

1. **There are six separate engines.** Every one can be driven from a page with no game state. Load as plain `<script>`s:
   - `src/game/thareia-audio.js`, `src/game/songs.js`, `src/game/footsteps.js` and `src/battle/sound.js`;
   - for the cutscenes, the source files `envoi-final-draft/cutscenes/colossus-first-meeting/copies/sounds.js`, `.../src/sfx.js` and `envoi-final-draft/cutscenes/finale-opening/src/sound.js`. The game's cutscene bundles are IIFEs.

   None of them needs THREE or the models.
2. **Start audio inside a tap.** Call `ThareiaAudio.sfxInit()`, `ThareiaAudio.setVolume(.75, .75, .75)`, `SND.init()` and `SND.setVolumes(.75, .75)`. The library and the battle each have **their own** AudioContext; footsteps reuse the library's; each cutscene engine makes its own.
3. **Library one-shots exactly as the game plays them:**
   - an effect: `ThareiaAudio.playSfx(id)` (Effects, gain 1);
   - an ambience: `ThareiaAudio.playSfx(id, undefined, v, 'amb')` (Surroundings, the map's v);
   - the flight's mist wind: `playSfx('wind')` at gain 1.
4. **A place's ambience is a scheduler, not a sound.** To hear "the wind as long as it blows in the game", copy `game.js:202–212` (a 500 ms tick; first play at `a×random`, then every `a + random×(b−a)` s) with the map's `AMBIENCE` row, and let it run 30–60 s or more. A single "wind" button only gives the 0.5–2 s puff.
5. **Faithful playback reproduces the truncation.** Because the library's noise isn't looped, every long noise layer cuts out at a random 0.5–2 s. That is why wind "is a real quick sound" in the game too. Don't "fix" it in the tool; it is what Chris should hear and judge.
6. **Footsteps are one `feet.play('soft' or 'cloak', mapId, 0.75)` per footfall.** Drive them from a walk loop like `field.js`: 3.6 steps a second walking, 5.4 a second running, with the 0.19 s throttle inside `play()`. The ground comes from the map id: earth, stone or wood.
7. **Made-up music** is `musicPlay(id)` / `musicStop(fade)`, and it loops forever. **Chris's songs** go through `Songs.create({src, ctx}).play('town'|'wilds')`, which needs the two .webm files (3:15 and 3:52) beside the page or as data URLs.
8. **Battle effects take arguments.** `hit(p)` and `boom(p)` take a strength (0.4–1.5). `shriek(len)` takes a length (0.5–1.4 s). A move is a sequence (a melee blow is `swish` then `hit`). The theme is `startMusic()` / `stopMusic(fade)`, a 7.27 s loop.
9. **Cutscene engines need `init()` in a tap, then a wait for `ready`.** Their beds start by themselves. They need a `tick(dt)` loop for the random night sounds, and `close()` to stop. They can also replay their scripted timelines from the cue tables in section 6.
10. **Volume buttons.** To match the game, offer Music, Effects and Surroundings at Off, Soft, Normal and Loud (0, 0.4, 0.75, 1), applied with `ThareiaAudio.setVolume(m, e, s)`, `SND.setVolumes(m, e)` and `songs.setVolume(m)`. Pass the footsteps the Effects value. The cutscenes get `min(1.25, x/.75)`.
