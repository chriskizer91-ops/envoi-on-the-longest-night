# Battle Music Lab

Ways to make the battle music darker, more ominous and ethereal, to hear side by side (Chris, November 17, 2026: "a
little darker, a little more ominous, ethereal"). Open `lab.html` (built: `node tools/build.mjs --offline
moon-faire-witches/music/lab/lab.html`).

- **Effects** (`make_effects.py`): Carnival of Ashes, whole, through studio effects: slower, lower, slowed with a big
  room, from far away, warped tape, and a dark mix of a little of each. Files `out/fx-*.webm`.
- **Chopped** (`make_chops.py`): Carnival of Ashes cut up and rebuilt: a new 57-second loop from its own parts (one
  matched cut, the loop's seam is the song's own join), the same loop darkened, and Fractured Lullaby (its quietest
  bars smeared into a floating chord, its tunes slowed and echoing, a heartbeat from its kick drum, its heaviest hits as
  far thunder). Files `out/chop-*.webm`.
- **Made in code**: every music part in `src/battle/sound.js`, read live from it.

The tools are in `fx.py` (speed, pitch, tape, wobble, room, filters, Paulstretch, loop-making, levelling and saving), so
any song can be put through them. `make_data.py` writes `lab-data.js`, the list the page shows. Needs Python with
numpy, scipy, soundfile and librosa, and ffmpeg with rubberband.
