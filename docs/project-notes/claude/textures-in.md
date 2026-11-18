# Chris's textures coming in, while the 3D world is built

> **Done (November 16, 15:40). Don't start this job again.** All 21 zips are in: round one 53 of 53, round two 77 of 77,
> 130 pictures, on branch `work/textures-made` in `moon-faire-witches/texture-packs/made/`, each checked against its card and
> its zip's checksum. The record is the slip `claude/slips/textures-made.md`. What's left for textures is under
> **What happens to them after** at the bottom. The starter text below is kept only for a later round (three) if Chris
> ever asks for it.

**Keep everything labeled (Chris, November 16).** Every texture saved keeps its card's file name, a row in
`made/index.csv` (label, kind, round, the zip it came in, card, place, size, checksum, note) and the prompts that made it in
`made/prompts/<zip>.json`. Anything added later gets all three, and anything copied to another game takes its row and
prompts with it, so the assets can be found and used again in Chris's future games.

Chris, November 16 (morning): rounds one and two are all made, but uploading them takes a long time. So the two happen side
by side:

- **The 3D world is built now, with the stand-ins**, by the world-3d conversation and its helpers (the 20 walking places
  left after Wickhollow's square). Nothing waits on the textures.
- **The textures come in through their own conversation**, slowly, whenever Chris has time. Each one swaps in by its file
  name the next time a page is rebuilt: every 3D place lists each texture as Chris's made one first
  (`moon-faire-witches/texture-packs/made/<id>.png`) and the stand-in second.

## What came in (Chris, November 16, 10:32 to 15:10)

- **Rounds one and two: 21 zips, each about 17 to 19 MB. All in by 15:40,** each zip its own commit and push.
- **Round three: not for now** (Chris confirmed in the afternoon that he's hesitant to make it). It is 235 pictures:
  about 150 flat front views (whole house fronts, doors, stall fronts, signs, cart sides), 10 roofs seen from straight
  above, and about 90 plants. The 3D doesn't use the first two kinds: its roofs are the tiled roof textures from rounds one
  and two, and its house fronts are built from the wall textures with the doors and windows made in code. The plants could
  make the bushes, reeds and flowers look more painted, but nothing needs them. Once the 3D places are built, the world-3d
  conversation can name the few plants that would show most (a short list, perhaps 20 to 30), and Chris decides then.

## The quickest way to hand them over

1. **Zips from the phone:** attach one zip at a time. One attachment instead of dozens of pictures.
2. **If the pictures are on the laptop:** open the texture conversation in the Claude desktop app on that laptop and tell
   it the folder. It can copy the whole folder at once.

Keep each picture's name as on its card in the prompts page (for example `shared_cobbles_town.png`). If a name got lost,
the texture conversation matches the picture to its card by eye.

## Starter text for the texture conversation (used; kept for a later round only)

```text
You're a job conversation for the new Envoi (Envoi with the Moon Faire witches): my made textures coming in. First read
the project documents claude/envoi-board.md and claude/textures-in.md. Add the repository
chriskizer91-ops/envoi-on-the-longest-night if it isn't here yet. Start from the game on your own branch:
git fetch origin claude/moon-faire-witches && git checkout -B work/textures-made FETCH_HEAD.
I'll give you my textures from rounds one and two a batch at a time: zips (21 of them, about 18 MB each), pictures, or a
folder on my laptop. For each picture: find its card on the prompts page (moon-faire-witches/texture-packs/tools/build_prompts.py
makes the list; each card names its file, such as shared_cobbles_town.png) and name it so; check it is the shape on its
card and, for ground and surfaces, that it tiles without a seam (look at it 2 x 2). Save it as PNG in
moon-faire-witches/texture-packs/made/ (the only folder you change) and push to work/textures-made after each zip.
Show me each zip's pictures tiled 2 x 2 in one picture, with any problem in plain words. Keep a running count in the
project document claude/slips/textures-made.md (the only project document you write): how many of round one (53) and
round two (77) are in, which are missing, and any that need making again.
```

## What happens to them after (what's left)

- **The world-3d conversation** fetches `work/textures-made` and rebuilds the 3D pages with them, and shows Chris each place
  before and after. Six textures show a line where they repeat (`frozen_waterfall_ice`, `jetty_planks_snow`,
  `shared_planks_wall`, `shared_sky_night`, `road_cobbles_snow`, faintly `desert_ground`): show them in the places that
  use them, and Chris decides then whether to make any again. `shared_planks_wall` now exists, so the shed and lean-to in
  Wickhollow can use it instead of the boardwalk planks.
- **The hub** brings `work/textures-made` into the game's branch, as it does any job. It changes only `made/`.
- The pages make their own smaller copies of each texture for the phone (a made texture can be a few megabytes; the phone
  doesn't need that much), so the originals stay as Chris made them.
