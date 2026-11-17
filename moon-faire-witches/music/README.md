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

## Herbal Decay: under everything (November 17)

**Off for now** (Chris, that afternoon: "I want the song in there but your six dark songs work better ... we will come
back to you for the songs when we are ready"). The song and its knob stay in every page; the knob starts at 0 and nothing
is loaded until it is turned up. Chris's songs (these five and Herbal Decay) are to be come back to when he is ready.


`herbal-decay-battle-aac-96k.m4a` is Chris's file exactly as he gave it (AAC 96 kbps, 3:20, md5
5d8dfc3afd99b09a03cb90c20e959a8b), never re-compressed: the build copies its bytes into each page. `herbal-decay.js` says
where it is; `../src/song-bed.js` plays it on a gapless loop under everything, very quietly walking about (about -36 LUFS)
and a little louder in fights (about -32, some 11 dB under the battle music made in code), with a knob 0-10 (5 as set)
kept on the phone (`mfw.songBed`). The knob is in the battle's menu row ("Song") and in the walking pages' Menu. The
battle's Sound on/off silences it too. Any new page of the game loads `../music/herbal-decay.js` and `../src/song-bed.js`
and calls `SongBed.place('world' or 'battle')`.
