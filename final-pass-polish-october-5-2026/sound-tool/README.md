# Envoi Sound Check

Chris asked for it on October 5, after the final pass's file: "a tool that is all of the sound files that get used in the game and I want to go through them one by one and listen to them and they have to be in the tool in the way that they'll be in the game. So like if I press the button it plays whatever will be in the game. So like wind can't just be a real quick sound."

**The page:** `../Envoi Sound Check.html` (one file, about 2.2 MB, his two songs inside; it plays with no internet, on a phone or a laptop). He opens it, taps **Tap to start the sound**, and goes through the groups.

## What it plays, and how

Every sound the game plays (113 cards; the list behind them is `../sounds/inventory.md`), through **the game's own sound code**: the page is built from the same files the game is (`src/game/thareia-audio.js`, `songs.js`, `footsteps.js`, `src/battle/sound.js`, and each cutscene's own sound files), so a button plays exactly what the game plays, and after a change there the page plays the change.

| Group | How a button plays it |
|---|---|
| Io's footsteps | Io walks for 8 s on that ground: one step each time one of her painted feet lands, at her pace, breaking into a run after a moment, as `field.js` does |
| The places, as you walk them | A minute in that place: each of its sounds now and then on the game's own timer (`game.js`, every half second, each sound's gap picked at random between its two numbers), with its music; Io walking if ticked. The line under the card names each sound as it plays |
| The places' sounds, one at a time | Each once, as loud as at its loudest place |
| Things that happen on the maps, the Magpie, menus and shops | Each once, as the game plays it |
| Battles | A whole fight (the sting, the foes appearing, the theme, blows each way, the last foe falling, the win or the set fight's fanfare); the theme; each effect; each move as its sounds follow each other (the gaps close to the game's: in the game they follow the animation) |
| Music | Each piece; for his two songs, also their last 12 s into their start, where they loop |
| Cutscenes | Each cutscene's whole soundtrack, its cues at their times (their `scene.js` and `player.js`), and each of its sounds. The cutscene sets a sound left or right, near or far, by where it is in the picture; the page plays them from the middle |

The game's three volumes (Music, Effects, Surroundings: Off, Soft, Normal, Loud) are along the top, as in Settings.

## The "Fixed" buttons

Where the code shows a sound broken, a green **Fixed** button plays it with the fix beside the game's own. The fixes are switches in the game's sound code, **off in the game** until Chris says yes (as the four try ideas were): `ThareiaAudio.fix.noise`, `Footsteps.fix.run` and `.stone`, and the battle's `fix.noise`.

- **noise** (the library and the battle): the noise loops, so a noisy sound lasts as long as it's written. Today the wind, the river, the leaves, the blizzard, the sea, the campfire's hiss, the bats, the sting's crash, the take-off's rush and the music's wind stop dead at a random 0.5 to 2 s (the noise is 2 s long, started up to 1.5 s in, never looped), and the battle's eclipse at 1 to 1.5 s.
- **run** (the footsteps): no running step is dropped (they come every 0.18 s; the game drops any sooner than 0.19 s after the last).
- **stone** (the footsteps): the stone step two and a half times as loud (it was a faint tick).
- The mist's wind in the flight, fixed: as loud as the maps' wind, on Surroundings (the page only; the game's change would be in `fly.js`).

**On Chris's yes to a fix:** set its switch on in the game (`const FIX = { noise: true }` and the rest), rebuild, run the full pass (`../checks/full-pass.sh`), send his file again; the page's "Fixed" and as-in-the-game buttons then sound the same.

## His notes

Each card has **Keep**, **Fix** and **Drop**, and a note. They're kept on his device (the page's own storage), and **Copy my notes** puts them all on the clipboard as text (and shows them below the button, to copy by hand if the clipboard is refused), each with its card's id in brackets (`[place-cold-moor]`, `[amb-wind]`, `[b-wraith-eclipse]`...), to find it here.

## Building and checking

```sh
node final-pass-polish-october-5-2026/sound-tool/make.mjs     # game-tables.js from game.js, then the page, copied to ../Envoi Sound Check.html
flock /tmp/claude-0/browser.lock node final-pass-polish-october-5-2026/sound-tool/check.mjs   # every button makes sound, no page error; the notes kept and copied
```

`game-tables.js` is made by `make.mjs` from the game (`Game.AMBIENCE`, `Game.MUSIC` in `src/game/game.js`, and the places' names in `maps.js`): don't edit it by hand.
