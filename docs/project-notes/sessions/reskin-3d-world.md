# Session note: reskin of the 3D world (November 17 to 18, 2026)

A conversation in the project "Envoi And Moon Faire Building". Its full slip is the project document
`claude/slips/reskin.md`; this is the short version kept with the code.

## What it built

All in `moon-faire-witches/world3d/` and `moon-faire-witches/texture-packs/`:

- **The four 3D zones reskinned** with Chris's own textures at full size: `world3d/builds/envoi-3d-zone-1..4-<name>.html`
  (45.5, 47.7, 54.4 and 43.6 MB, each one offline file).
- **Walls that don't repeat as a pattern:** timber frames fitted to each wall with real posts and beams, board walls
  fitted to the storey, stone starting somewhere different on every wall, houses taking turns among several wall pictures.
- **Nothing built is seen through:** the camera keeps a clear line to Io (looks from higher, swings round, looks from
  right above, or comes in). Walls thin away only where she is boxed in.
- **Laptop first:** full sharpness, grain and relief on a laptop; lighter settings on a phone by itself.
- **Two looks:** as painted, and the Flipbook look (a button left of the map's, with a fineness slider; F on the keys).
- **Laptop controls:** tap a direction key twice to run, Shift to sprint; a mouse only turns the camera, no joystick.
- **The short list** in place of round three: `docs/art-requests/15-3d-world-textures-short-list.md` (28 prompts). Chris
  made all 28; they are in and wired: wall variants, painted doors and windows, oak beams, barrels, crates, tree crowns
  built of painted boughs, painted bushes, two decks made again.
- **Labels:** `texture-packs/made-web/index.csv` (every web copy), `texture-packs/made/index-short-list.csv` and
  `made/prompts/Envoi-Shortlist-*.json` (the short list), `made/revised/` (a picture made again, beside the one it
  replaces).
- **Tools:** `texture-packs/tools/` (make-web-copies.mjs, bring-in-short-list.mjs, make-short-list.py);
  `world3d/tools/` (shots.mjs now says whether Io is seen; keys-test.mjs; look-panel-test.mjs).
- **Pictures:** `docs/project-notes/sessions/reskin-3d-world-pictures/` (before and after, as sent to Chris).

## Branch and last commit

`work/reskin`, from `work/world-3d` at 8b876cc. The last commit is the one that added this note; the last build commit
before it is 82fe7f0.

The originals of texture rounds one and two are not on this branch: they are on `work/textures-made`
(`texture-packs/made/`, 130 pictures). Bring that branch in too; no file on it clashes with this one.

## Artifact links

None. Everything was handed to Chris as files in the conversation, and every one of them is in this branch.

## Chris's decisions made here

(All are also in the project document `claude/slips/reskin.md`.)

- The laptop is the main screen: as detailed and good-looking as it can draw; the phone is secondary.
- See-through buildings must not happen. He likes the camera going to right above Io when it has to.
- The game has two looks to toggle: as painted, and a very fine Flipbook look.
- Tapping a direction key twice runs; Shift is a sprint. No joystick for a mouse.
- Round three (235 pictures) is not being made. The short list of 28 replaced it, and all 28 are made.
- Every saved asset stays labeled so it can be used again in later games.

## Unfinished

- The frame rate on Chris's laptop was never measured (the checks here use a software renderer). The new trees cost
  more to draw. The map button shows the frame rate.
- Doors, windows, barrels and trees that a place builds in its own `extra()` wear the new pictures but were laid out
  for the old ones: worth a look place by place. Edge thickets and trees past the fog are still lumps.
- A slim wooden post or beam (under 0.3 m across) can still stand in front of Io.
- The Flipbook look has no ink outlines in the 3D world.
- Anything the world-3d conversation did after 8b876cc needs merging with this branch.
