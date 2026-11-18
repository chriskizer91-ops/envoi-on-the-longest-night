# Envoi with the Moon Faire witches: the board

Last updated: November 16, 2026, 16:50, by the hub (the conversation that builds the game and brings everyone's work in).

This is where the game stands, what is being worked on, what is left, and the jobs other conversations can take. **Only the hub changes this board**, so nobody writes over anybody else. A job conversation writes only its own slip, the project document `claude/slips/<job>.md`. Chris's decisions so far are in `claude/envoi-moon-faire-witches.md`; the lore drafts are in `claude/lore/`.

## What this game is

The same places as *Envoi on the Longest Night*, in another world: an alternate universe (Chris, November 16). Moon Faire's Io and Kore (the Jester) are the heroes: the first two of the coven quartet (Io, Kore, Europa the Fox, Callisto the Ranger), each named for a moon of Jupiter. Halcyon is a paladin on Io's body. Moon Faire's big bad stands where Noctara, the Queen of Darkness, stood, so darkness can mean something new. The lore and the townsfolk's conversations are being written new.

## How to start a job (for Chris)

1. Open a new conversation in this project and paste the job's starter text (at the bottom of this board).
2. It works on its own copy of the game and sends you one HTML file to download and try on your phone. Ask it for changes right there until you're happy.
3. Tell the hub when a job says it's ready. The hub brings it into the game and updates this board.

Two or three job conversations at once at most, besides the hub. With four at once, Envoi's helpers ran into the account's usage limit and stopped halfway.

## Where we are

Everything is in the repository `chriskizer91-ops/envoi-on-the-longest-night`, branch `claude/moon-faire-witches`, folder `moon-faire-witches/`. Its `README.md` has the details.

Done and sent to Chris:

- **Io's Spell Book** (Nov 15): Moon Faire's Io with her 7 own spells and Envoi Io's 9.
- **Io on Foot** (Nov 15): her 3D model on all 21 of Envoi's walking maps.
- **The Fair Folk in Envoi** (Nov 15): Moon Faire's fair folk play Envoi's 17 townsfolk, and talking works (with Envoi's old words for now).
- **The Final Boss** (Nov 15): Moon Faire's big bad at the dead Moonwell (its own page, not in the new battle yet).
- **The New Battle** (Nov 15, camera Nov 16): Envoi's fights and arenas with Io and Kore. Kore plays Moon Faire's Fate rules. Both get trance glows, and Kore glows purple through Curtain Call. A Flipbook button turns it into one pixel picture. 42 of Envoi's 51 balance targets are met. Everyone faces their foes, and the camera works as Moon Faire's does: it opens on the painting, then moves (wide behind the party at rest; over a shoulder, from the side or low and close on a move; the bow from the foes' side), with the painting out of focus all the way round. **Kore never misses** (Nov 16): a wisp's dodge is used up on her blow and her blow lands.
- **Texture packs for a 3D Envoi** (Nov 15): 31 places, with rough stand-in textures, and 365 prompts in three rounds on one page.
- **Chris's textures, rounds one and two** (Nov 16): all 130 in (53 + 77, from his 21 zips), checked and labeled, and **brought into the game's branch** (Nov 16, 16:50) in `moon-faire-witches/texture-packs/made/`. Round three: not for now.
- **Everyone Who Fights** (Nov 16, `dist/lineup.html`): all 17 combat models on one page, each with its moves, its state and its triangle count. For Chris to lock them in.
- **The new Halcyon** (Nov 16, on Everyone Who Fights): Moon Faire's base doll (Io's body, from Moon Faire's branch `claude/moon-faire-base-doll-light`) in its paladin outfit at its light weight, about 50,000 triangles, with a glowing outline, a pale glow, rising motes and a light over her face, all made in code. Her moves are the doll's own (Io's), under Halcyon's names.
- **The 3D world** (the `world-3d` conversation, Nov 16): all 21 walking places built in 3D, and the four zone pages that walk them place to place (its slip).
- **The 3D map of Aethermoor, step 1 of 4** (the `world-map` conversation, Nov 16): the land as a real 3D model, showing where Io is (its slip).

## What's being worked on now

| Who | What |
|---|---|
| Chris | Looking over Everyone Who Fights, the new Halcyon, the new camera, the 3D places and the 3D map. |
| The hub | **The battle's sounds and music, remade** (the `battle-sound` job, Chris November 16: "scrap all of the sounds", keep the beats they hit on; the battle music reworked significantly): a helper the hub started (Fable 5.2, high effort) is doing it now, on branch `work/battle-sound`; the hub brings it in and sends Chris a Sound Board page and the battle with the new sounds. Then Halcyon's fight and the finale in the new battle, with the new Halcyon and the big bad in Noctara's place (Curtain Call breaks it open, it refills and fights on alone). |
| `world-3d` | **Taken, don't start again:** working in its own conversation (its slip: `claude/slips/world-3d.md`). Next for it: rebuild the places with Chris's made textures, now on the game's branch. |
| `world-map` | **Taken, don't start again:** the 3D map of Aethermoor and travel between zones, in its own conversation (its slip: `claude/slips/world-map.md`; the decisions: `claude/travel-and-3d-map.md`). Waiting on Chris: which ship he flies. |
| Lore conversation | The lore drafts in `claude/lore/` (Io and Kore, the coven's names, the story), with calls for Chris. |
| `textures-made` | Done and brought in (its slip: `claude/slips/textures-made.md`; how textures come in: `claude/textures-in.md`). |
| `texture-library` | Done: a catalogue of every texture pack in Chris's repositories, kept for later (its slip). |
| Job: `fight-math` | Ready for a conversation to take (without Halcyon's and the finale's fights, which the hub is rebuilding). |

## What's left to do

1. **The battle's sounds and music** (`battle-sound`, being made now): every effect and the battle music remade, on the same beats.
2. **The combat models, locked in:** Chris approves the 17 on Everyone Who Fights, or says what to change.
3. **The final boss in the new battle** (the hub): the big bad in Noctara's place in the finale, in its two forms.
4. **The new Halcyon in the battle** (the hub): her first look is made; next, her fights. Her moves are Io's for now (the doll has no sword), so whether she needs moves of her own is Chris's call.
5. **The new lore** (the lore conversation, job `new-lore`): the alternate universe's story, then every townsfolk's conversations.
6. **The 3D world** (`world-3d`): rebuild the 21 places with Chris's textures and show him each before and after; the townsfolk in the 3D places.
7. **The 3D map and travel** (`world-map`): steps 2 to 4 (choosing where to go, the flight in Skies of Aethermoor, landing).
8. **The fight math** (job `fight-math`): the balance targets still missed (not Halcyon's or the finale's).
9. **The battle upgrades still to come** (the hub): bodies that react, spells that mark the arena, turn openers and finishers. The camera is done.
10. **The whole game put together** in the folder: the 3D world in its zones, the townsfolk, the new battle, travel, from start to finish.

## Waiting on Chris

- **Six textures that show a line where they repeat** (`frozen_waterfall_ice`, `jetty_planks_snow`, `shared_planks_wall`, `shared_sky_night`, `road_cobbles_snow`, faintly `desert_ground`): Chris judges them in the 3D, then decides whether to make any again.
- **Which ship he flies** in the flights (the world-map slip).
- **The doll for other people?** Chris (Nov 16): the base doll's 21 outfits look better than the fair folk's models, and with small changes (face coverings) could play different people. Every doll is Io's body, so each townsperson it plays would be a woman of her build; with the new lore that may be fine. A job for it can be written once he says which people.
- **Lore**: the calls in the `claude/lore/` drafts, and who Halcyon is to the heroes and what she is weak to, and what darkness means in this game (`docs/questions/moon-faire-witches.md`).

## Jobs

| Job | What it does | Brief | Branch | State |
|---|---|---|---|---|
| `battle-sound` | Every sound of the battle and its music remade, on the same beats | `moon-faire-witches/workshop/battle-sound.md` | `work/battle-sound` | Being made by the hub's helper |
| `world-3d` | Envoi's places in 3D, with Moon Faire's Io walking them, in four zones | `moon-faire-witches/workshop/world-3d.md` | `work/world-3d` | Taken (working; its slip) |
| `world-map` | The 3D map of Aethermoor, and travel between zones | `claude/travel-and-3d-map.md` | `work/world-map` | Taken (working; its slip) |
| `fight-math` | Finish the rebalance, keeping Kore's Fate rules exactly (not Halcyon's or the finale's fights) | `moon-faire-witches/workshop/fight-math.md` | `work/fight-math` | Ready |
| `new-lore` | The alternate universe's lore, written with Chris, then every townsfolk's conversations | `moon-faire-witches/workshop/new-lore.md` | `work/new-lore` | Started (lore drafts) |
| `textures-made` | Chris's made textures, rounds one and two, checked and labeled | `claude/textures-in.md` | `work/textures-made` | Done, brought in |
| `texture-library` | The textures Chris already has elsewhere, catalogued | its slip | `work/texture-library` | Done (catalogue only) |
| (the hub) | Halcyon's fight and the finale (the new Halcyon, the big bad), the battle upgrades, bringing jobs in | `moon-faire-witches/README.md`, "Next" | `claude/moon-faire-witches` | Working |

How a job session works, and the slip it hands back: `moon-faire-witches/workshop/README.md`.

## Chris's textures

**Rounds one and two are all in, on the game's branch** (November 16): 130 pictures in `moon-faire-witches/texture-packs/made/`, kept exactly as Chris made them. Wherever a made texture is there, the 3D uses it in place of the stand-in. **Round three is not being made for now** (`claude/textures-in.md`).

**Keep everything labeled (Chris, November 16).** Every texture keeps its card's file name, a row in `made/index.csv` (label, kind, round, the zip it came in, card, place, size, checksum, note) and its prompts in `made/prompts/`. Anything added later gets the same, and anything copied to another game takes its row and prompts with it. The same goes for every sound and every other asset saved.

## Starter texts

**The fight math** (`fight-math`):

```text
You're a job conversation for the new Envoi (Envoi with the Moon Faire witches): the fight math. First read the project document claude/envoi-board.md. Add the repository chriskizer91-ops/envoi-on-the-longest-night if it isn't here yet. Start from the game on your own branch: git fetch origin claude/moon-faire-witches && git checkout -B work/fight-math FETCH_HEAD. Then read moon-faire-witches/workshop/README.md and moon-faire-witches/workshop/fight-math.md, and do that job. Keep your slip in the project document claude/slips/fight-math.md (the only project document you write), push to work/fight-math as you go, and send me the battle as one HTML file with a before-and-after table in plain words.
```

**The battle's sounds** (`battle-sound`): being made by the hub's helper now; only if that stops, paste this into a new conversation:

```text
You're a job conversation for the new Envoi (Envoi with the Moon Faire witches): the battle's sounds and music. First read the project document claude/envoi-board.md and the lore draft claude/lore/io-and-kore.md. Add the repository chriskizer91-ops/envoi-on-the-longest-night if it isn't here yet. Carry on from the branch work/battle-sound if it exists (git fetch origin work/battle-sound && git checkout -B work/battle-sound FETCH_HEAD), or else start from the game: git fetch origin claude/moon-faire-witches && git checkout -B work/battle-sound FETCH_HEAD. Then read moon-faire-witches/workshop/README.md and moon-faire-witches/workshop/battle-sound.md, and do that job. Keep your slip in the project document claude/slips/battle-sound.md (the only project document you write), push to work/battle-sound as you go, and send me the Sound Board and the battle as one HTML file each.
```

**The new lore** (`new-lore`):

```text
You're a job conversation for the new Envoi (Envoi with the Moon Faire witches): the new lore, written with me. First read the project document claude/envoi-board.md and the lore drafts in claude/lore/. Add the repository chriskizer91-ops/envoi-on-the-longest-night if it isn't here yet. Start from the game on your own branch: git fetch origin claude/moon-faire-witches && git checkout -B work/new-lore FETCH_HEAD. Then read moon-faire-witches/workshop/README.md and moon-faire-witches/workshop/new-lore.md, and write the lore with me, starting with a few questions in plain words. Keep your slip in the project document claude/slips/new-lore.md (the only project document you write), and push to work/new-lore as you go.
```

The 3D world's and the world map's starter texts are spent: carry on in those conversations.
