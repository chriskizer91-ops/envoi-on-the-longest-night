# Envoi with the Moon Faire witches: Chris's decisions

Where the work lives: repo `chriskizer91-ops/envoi-on-the-longest-night`, branch `claude/moon-faire-witches`, folder `moon-faire-witches/` (its README has the details and the full cast table). It started from the game's newest branch, `ccr-31761774-76j8j3`, which builds Chris's "final polish" file. Everything outside the folder stays as Envoi was.

**Where the game stands, what's being worked on, what's left, and the jobs other conversations can take: the board, `claude/envoi-board.md`.** This document keeps what Chris decided, and what was delivered when.

## Chris's decisions (November 15, 2026)

- Keep the work that went into Envoi: arenas, foes, effects, battle screen, maps and places.
- Moon Faire's Io (the Herbal Witch: natural herbal healing and summoning) replaces Envoi's Io.
- Io's spells (evening answer): she uses the Envoi summon and all of Lunara. My reading is Envoi Io's whole kit on her new body: her spells, Lunara and Envoi. This replaces the earlier "not the Envoi summon".
- Io keeps her own Moon Faire spells as well ("keep it if we can make them look uniform"), with the Flipbook filter as a toggle to make everything look like one picture.
- The Jester (the duality of life and death; fate) completely replaces Sol.
- The Jester's rules are exactly Moon Faire's: Fate, seals, Sealed Fate, taunts, and Curtain Call as her big move.
- Keep Envoi's levels, its foes and how often they come. Only the final boss is Moon Faire's.
- Moon Faire's fair folk play Envoi's townsfolk, at their lightest. Use what's available to fit Envoi's story.
- Both witches get a trance effect made in code. Their strongest move gets something special. For the Jester's Curtain Call: glowing purple, purple mist or pixel particles.
- Both witches use their lightest model, walking and fighting. Walking Io is the 3D model too.
- Rebuild the combat: rename things, change the numbers that pop up, change the math, and rebalance.
- Battle upgrades, all yes: Moon Faire's director camera, bodies that react, spells that mark the arena, and turn openers and finishers.
- No new paintings yet. Spell animations and new foes are in.
- The whole game is going to be made 3D: texture packs from all of Envoi's maps first (made by several helpers at once).
- Deliver single HTML files to download, not published pages.

## Chris's decisions (November 16)

- The project's knowledge is a collaboration space: several conversations work on different things at once. The hub hands jobs to other conversations through the board (`claude/envoi-board.md`) instead of to helpers of its own. Other conversations can take the fight math and the 3D world.
- Chris is making the textures from the prompts page, round by round, and brings each round to the hub as it finishes.
- **An alternate universe:** the game is like another game in the same places as Envoi. The townsfolk's conversations started from Envoi's lore, which was wrong for it; the lore is to be written new.
- **Halcyon** is replaced: a woman built on Moon Faire's Io's body (the simple model) in the paladin outfit from Moon Faire's Io outfits model, with her face repainted and a glowing aura made in code.
- **The Queen of Darkness** (Noctara) is replaced by Moon Faire's big bad's 3D model, so darkness can mean something different in this game.
- **The Jester** is named **Kore** (Jupiter's moon named for Persephone), chosen in Chris's lore conversation.
- **The battles are worked on in the hub's conversation**, starting by locking in every model that fights: the two heroes, their summons, the creatures of their spells that aren't their own models, and every foe.
- **Keep everything labeled** (afternoon): everything saved stays labeled and keeps being labeled, so assets can be used again in future projects. For textures that means each keeps its card's file name, a row in `made/index.csv` and its prompts in `made/prompts/`.
- **Round three of the textures: not for now** (afternoon). Chris is hesitant to make its 235 pictures; the 3D builds house fronts and roofs from rounds one and two. A short list of plants may be asked for later (`claude/textures-in.md`).
- Chris feels the game is becoming a full rework (afternoon).
- **Kore never misses her hits** (evening): a foe's dodge is used up on her blow, and her blow lands.
- **The battle's sounds remade** (evening): scrap every old sound but keep the moments they play; different sounds for different things; the battle music remade (Chris makes the walking music himself, as song files).

## Chris's decisions (November 17)

- **His songs** (`moon-faire-witches/music/`): Moonlit Forest Path (two versions: calm walking music) for the overworld map and peaceful places; Herbal Lullaby (carnival-tinted, building up and down) and Untitled ("无标题曲") for the dangerous wild places; Carnival of Ashes (music box mixed with metal carnival music) for battles. All music should be very quiet, the game's ambience, even in battles.
- **The battle music should be darker, more ominous and ethereal**, not the happy carnival sound the first remake had.
- **Locked in: all six dark music parts made in code** ("chef's kiss perfect"): Ashen Reel, Ethereal and Ominous (morning: "I absolutely want to use them"), and Frenzy (highest energy), Dirge (lowest, a lament) and Reckoning (a dark march that rises), made in the same vibe at different energies (afternoon). Music like them is wanted for every circumstance in the game.
- **Where the six play** (approved, afternoon; `PLAN` in `src/battle/sound.js`): Ashen Reel for ordinary fights; Ominous for bosses; Ethereal for a witch's trance; Reckoning for Curtain Call; Frenzy while a fight goes badly (a witch beaten or under a third of her Life), back when it recovers; Dirge after a lost fight; the final boss Ominous, then Reckoning for its last stand.
- **His songs: on hold, to come back to.** He asked for "Herbal Decay" (his .m4a, uncompressed) very quietly under everything with a volume knob, then decided the six dark pieces work better alone: "I want the song in there but your six dark songs work better ... we will come back to you for the songs when we are ready." The song and its knob stay in every page, starting at 0 (off). **When Chris is ready, come back to his songs** (Herbal Decay, Moonlit Forest Path x2, Herbal Lullaby, Untitled, Carnival of Ashes) and decide where each plays.
- **Sound effects next:** the ten most common battle sounds, each with three new versions to choose from (B softer and further away, C darker and heavier, D crisper and punchier; A is the battle's now), on the Sound Choices page; then the next ten most common, to hear and judge. Waiting on his picks.

## Delivered (November 15)

- **Io's Spell Book:** her 7 own spells, and Envoi Io's 9 spells redone on her.
- **Io on Foot: Moon Faire:** her 3D model on Envoi's 21 walking maps.
- **The Fair Folk in Envoi:** all 17 townsfolk played by fair folk, and talking works. Quill is played by the old night-watchman, because the airship captain (the Grey Hat) has no light version: he's about 345,000 triangles.
- **The Final Boss:** Moon Faire's "fire that would not end" at Envoi's dead Moonwell, with wraiths and frost wisps.
- **The New Battle** (`dist/battle.html`): Envoi's fights and arenas at any level with Io and the Jester. Io: all of Envoi Io's spells, Lunara, Envoi, plus Herbcraft (Thornwake, Silverleaf Salve, Moonflower Garden, Rootbound Return, Bramble Cradle) and the Elderwood Guardian. The Jester: Moon Faire's Fate rules, Fate shown as gold stripes on foe bars. Trance glows (Io silver-green, Jester purple; purple through Curtain Call). Flipbook button: the whole fight as one pixel picture in the place's own colours. Halcyon's and the finale's fights are left out until they are rebuilt.
- **Rebalance:** with Moon Faire's numbers as they were, 21 of Envoi's 51 balance targets were met (nearly everything won, even carelessly). Now 42 of 51. Fate per blow is a sixth of a wraith's Life (big foes a third of that), Jester 2000 Life, Rebuke 290, Thornwake 340 for 24 MP, the Guardian only once the Jester has joined.
- **Texture packs for a 3D Envoi** (`moon-faire-witches/texture-packs/`): 31 places (walking maps, the nine fight places, the world map), with inventories, reference crops, seamless stand-ins and 365 prompts in three rounds (53 shared, 77 places' own ground and surfaces, 235 flat views, roofs and plants). One prompts page and a zip of the pictures to attach.

## Delivered (November 16, texture work)

- **The texture library** (morning, branch `work/texture-library`, slip `claude/slips/texture-library.md`): every texture pack in Chris's 27 repositories found and sorted, 388 pictures in 13 packs (`moon-faire-witches/texture-library/library.json`), kept for when he organizes his packs across repositories. Its 16 Moon Faire matches for Envoi's cards are no longer needed.
- **Chris's textures, rounds one and two, all in** (afternoon, branch `work/textures-made`, slip `claude/slips/textures-made.md`): 53 + 77 = 130 pictures from his 21 zips in `moon-faire-witches/texture-packs/made/`, kept exactly as made and labeled (`index.csv`, `prompts/`). Six show a line where they repeat, for Chris to judge in the 3D.

## Delivered (November 17, sound and music)

- **The battle's new sounds** (`work/battle-sound`, a Fable 5.2 helper): `moon-faire-witches/src/battle/sound.js`, 155 sounds made in code, wired to the battle's 247 sound moments with 149 different sounds (it used 18), plus music parts. The **Sound Board** (`moon-faire-witches/sound/sound-board.html`) plays each one.
- **His five songs** compressed for phones (Opus, about 0.7-0.95 MB each, levelled to the same loudness, silence trimmed so they loop), with **The Witches' Songs** page (`moon-faire-witches/music/songs.html`); originals kept in `music/original/`.
- **The Battle Music Lab** (`moon-faire-witches/music/lab/lab.html`): Carnival of Ashes through six studio effects; Carnival of Ashes chopped and rebuilt (a new loop, the same loop darkened, and Fractured Lullaby); and the music made in code, with all six dark parts (`work/dark-music`, `work/dark-music-2`, Fable 5.2 helpers). The tools (`fx.py`, `make_effects.py`, `make_chops.py`) work on any song.
- **Sound Choices** (`moon-faire-witches/sound/choices.html`): the ten most common battle sounds with four versions each (`work/sfx-choices`, a Fable 5.2 helper; 30 new sounds, all within about 3 dB of the originals on a phone speaker), and the next ten to judge. "Copy my picks" writes Chris's choices out to paste back.
- **The six dark pieces wired into the battle** (afternoon), by the plan above; tested: ordinary fight Ashen Reel, Colossus Ominous, a witch at 1 Life Frenzy and back, trance Ethereal, Curtain Call Reckoning (Dirge after a loss not yet seen in a real loss).
- **Herbal Decay in every page, off for now** (`music/herbal-decay-battle-aac-96k.m4a`, his file byte for byte; `src/song-bed.js`): knob in the battle's menu row ("Song") and the walking pages' Menu, 0-10, starting at 0.
