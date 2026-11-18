# Moon Faire witches: the hub's battle, sound and music session (November 15-18, 2026)

## What this conversation built
Everything is in `moon-faire-witches/` (its README lists the pieces):
- **The new battle** (`battle/battle.html`): Io (Moon Faire's Herbal Witch, with Envoi Io's whole kit, Herbcraft and the Elderwood Guardian) and Kore (the Jester, Moon Faire's Fate rules) in Envoi's fights and arenas. Includes the director camera with both sides facing each other, the Flipbook filter, trance glows, Kore never missing, and the rebalance (42 of 51 targets).
- **Everyone Who Fights** (`lineup/`): all 17 fighting models, including Halcyon (Io's body in the paladin outfit, with a code glow) and the final boss's two forms.
- **Texture packs and prompts for a 3D Envoi** (`texture-packs/`), with Chris's 130 textures brought in (`texture-packs/made/`).
- **Sound and music:** 155 battle sounds made in code (`src/battle/sound.js`), wired to every sound moment, plus the Sound Board (`sound/sound-board.html`). Six dark music pieces play by a music plan. Sound Choices (`sound/choices.html`) offers four versions of each of the ten most common sounds. The Battle Music Lab (`music/lab/`) has reusable audio tools. Chris's songs are compressed in `music/`, with the Witches' Songs page. Herbal Decay is in every page, switched off, through `src/song-bed.js`.
- Workshop briefs for the other conversations (`workshop/`) and the board in project knowledge (`claude/envoi-board.md`).

## Branch and last commit
`claude/moon-faire-witches`; the last commit before this note is `0de7acd` (Herbal Decay off for now). The helper branches are all merged: `work/battle-sound`, `work/dark-music`, `work/dark-music-2`, `work/sfx-choices` and `work/textures-made`.

## Artifact links
None. Every page went to Chris as a downloaded single HTML file built into `dist/` with `node tools/build.mjs --offline <page>`. The sources of those pages are all in the repo.

## Decisions made here that aren't in the project knowledge
All of Chris's decisions are written in `claude/envoi-moon-faire-witches.md`, up to November 17 afternoon. Two smaller ones are only here:
- Chris asked for Fable 5.2 helpers set to high for the sound and music work, and liked what they made.
- He asked that every step be proven with screenshots and simple numbers, in plain words.

## Unfinished
- **Sound Choices:** waiting on Chris's picks. Then swap the chosen versions in under their old names and make choices for any of the next ten he marks "Needs choices".
- **Dirge after a lost fight:** wired, but not yet seen in a real loss.
- **Halcyon's fight and the finale:** to be rebuilt in the new battle. The new Halcyon is ready, and the Moon Faire big bad takes Noctara's place. Both fights were left out of `battle.html` until then.
- **Battle upgrades still to come:** bodies that react, spells that mark the arena, and turn openers and finishers.
- **Balance:** 9 targets still missed, such as Bramble Horror attentive and the Colossus.
- **Chris's songs:** on hold. Come back to them when he's ready.
- **The battle-sound helper's slip** (`claude/slips/battle-sound.md`) was never written. The helper was stopped before writing it; its work is all merged.
- **Other jobs to bring in when ready:** world-3d, world-map, fight-math and new-lore (see the board).
