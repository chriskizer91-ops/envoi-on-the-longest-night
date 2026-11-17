# The Moon Faire witches' songs

Chris's five songs (made with Suno), brought in November 17, 2026, for the Moon Faire witches. Each is compressed for
phones (Opus in WebM, 32 kbps stereo, about 0.7 to 0.95 MB), levelled to the same loudness (-20 LUFS, peaks under -5 dB)
and trimmed of silence at the end so it loops. The game plays them quietly, as background: Chris wants the music to be
the game's ambience, even in battles. His originals, untouched, are in `original/` under the same names (.mp3).
Listen to them all on `songs.html` (built: `node tools/build.mjs --offline moon-faire-witches/music/songs.html`).

| File | Song | Where it plays | Length | Chris's notes |
|---|---|---|---|---|
| calm-moonlit-forest-path.webm | Moonlit Forest Path | the overworld map, the peaceful places | 3:15 | calm, relaxing walking music; made for Follow Me Down Witch Way (also Envoi's towns-moonlit-forest-path) |
| calm-moonlit-forest-path-atmospheric.webm | Moonlit Forest Path (the second version) | the same | 2:09 | the same feel, more atmospheric |
| danger-herbal-lullaby.webm | Herbal Lullaby | the wild places, where a fight could start | 3:12 | carnival-tinted, atmospheric, building up and down |
| danger-untitled.webm | 无标题曲 ("untitled track") | the same | 3:03 | its Suno title is Chinese for "untitled track" |
| battle-carnival-of-ashes.webm | Carnival of Ashes | the fights | 2:28 | a music box mixed with metal carnival music |

How they were made (one song): measure, then level and compress in a second pass:
`ffmpeg -i original/X.mp3 -af "areverse,silenceremove=start_periods=1:start_threshold=-55dB:detection=peak,areverse,loudnorm=I=-20:TP=-2:LRA=14:<measured>:linear=true" -c:a libopus -b:a 32k X.webm`
