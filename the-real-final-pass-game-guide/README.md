# The real final pass game guide

*GAMEWYRM Strategy Special: Envoi on the Longest Night, the Real Final Pass Edition.* A complete player's guide laid out like an early-2000s strategy guide magazine: chrome header bars, color thumb-tabs, boxouts, framed screenshots and maps with numbered callouts.

- **`envoi-real-final-pass-guide.html`** is the whole guide in one file. Every picture and font is inside it, so it opens anywhere, on a phone too, with no internet. On GitHub, open the file and use **Download raw file**.
- It covers the build Chris has as one file, **"Envoi on the Longest Night - final polish.html"** (October 5, 2026; SHA-256 `f24d5248…6a16`), with the four try-page ideas on (footsteps, words that move on by themselves, the door sound, Buy 10). That file and its source are on the `claude/send-note-gigdew` branch, in `final-pass-polish-october-5-2026/`.
- It's also published as a private page: https://claude.ai/artifact/5AWk7ccark6ySmeKm37mWw
- The keepsake and letter checklists remember their ticks in the reader's own browser.

## What's inside

Cover and contents; what's new since the earlier guide; basic training (title, chapters, controls, saving, the menu, every setting); the cast; battle school (gauges, damage, Heat, Sunburn, Trance, charged moves, statuses); the spellbook with damage by level; the atlas and the Magpie; a four-part walkthrough with all 21 walking maps pinned; boss files; the bestiary; all 20 keepsakes; herbs, shops and the level chart; secrets and the five letters; the top 30 tips.

## The earlier guide

An earlier guide to the same game, *MOTHLIGHT Player's Guide*, is on the `claude/bold-carson-8beyc3` branch in `game-guide/`. It was written against a build from early on October 5, before the wilderness scenes, so parts of it are out of date: the world map is no longer walked, eight new walking maps join the camps to the towns, the crossroads well can't be read before Halcyon's ambush, and more. This guide's "What's new" pages list every change.

## How it was made

- Every number comes from the final build's own rules (`src/battle/rules.js`, `engine.js`, `sim.js`, `src/game/*.js`, `envoi-final-draft/items/items.js`), and every map pin from the game's own coordinates.
- Every picture comes from the game: Chris's title painting, the portraits, the painted maps, the keepsake art (all from `art/` on the final-pass branch), and screenshots taken by playing the final polish file in a headless browser.
- `source/` holds what builds the file: the page parts (`src/`), the stylesheet, the map callouts (`mapspec.py`), the compressed images (`img/`) and fonts. Rebuild from the repository root with `python3 the-real-final-pass-game-guide/source/build.py the-real-final-pass-game-guide/envoi-real-final-pass-guide.html`.
- `source/screenshot-tools/` are the Playwright scripts that played the final polish file to take the screenshots (copy the final polish file in as `source/game.html`, set `S` to the `source/` folder, and they write raw shots to `source/shots/`). `source/shots.py` picks and compresses the raw shots into `img/shots/`.

Nothing outside this folder was changed.
