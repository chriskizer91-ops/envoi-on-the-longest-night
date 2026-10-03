# Art Request 08: Everyone on the Maps as Paper Dolls

Io now walks the maps the way Path Polish paints her: a painted walk sheet with six steps in each of four directions (`reference/art/walk/io-walk-sheet.png`, from Chris's Witch Way). The 3D models stay for the battles. Everyone else who stands or walks on the maps needs the same kind of sheet, so they look as if they belong beside her. Until their sheets come in, they stay as pixel figures.

These nineteen prompts make one walk sheet for each of them: Sol, Halcyon, Ysmera, Quill (with Inkblot), and the fifteen townsfolk of request 06.

How to make them:

- **Attach Io's walk sheet** (`reference/art/walk/io-walk-sheet.png`) to every prompt, as the reference for the style and the layout. Where a person has a model sheet or a portrait, attach that too, for their face and clothes (named below each prompt).
- **One sheet per person:** a PNG with a transparent background, 1536 × 1024, six columns by four rows. Row 1 walks toward you, row 2 walks left, row 3 walks right, row 4 walks away, seen from behind. Six steps in each row.
- **No transparency?** If the tool can't make a transparent background, ask for a flat, plain pure green background (#00FF00) with nothing else on it, and the game cuts it out.
- **The whole figure in every frame,** from the top of the head or hat to the boots, with a little space round it, the same size in every frame and the feet on the same line along each row. Small slips are fine: the game finds each frame by itself.
- **Heights, as on Io's sheet:** an adult is as tall as Io, her hat nearly touching the top of each cell. Pell and Tamsin, the two girls, are about three quarters of that. Pim and Tock, the gnomes, are about two thirds. Ysmera, an Aurosi from the moon, is a little taller and much slimmer.
- **Generate two to four of each and keep the cleanest:** the same person in every frame, no extra or missing limbs, nothing cut off at a cell's edge, and a smooth walk.
- **Save them** in `reference/art/walkers/` under the file names below.

What happens next: Claude cuts each sheet into its frames and shrinks it to about two thirds for the phone (about 150 to 250 KB each, so about 4 MB for all nineteen, inside the game's 30 MB). Each person is drawn the way Io is: they breathe when they stand, turn to face her when she talks to them, and walk in the story's scenes.

## Style lock

Every prompt starts with this.

```text
A character walk-cycle sprite sheet for a 2D fantasy RPG, matching the attached sprite sheet exactly in style, scale, proportions, outlines, lighting and layout: high-detail HD pixel art with clean dark outlines and soft painterly shading, a slightly chibi JRPG figure about three and a half heads tall. 1536 by 1024 pixels on a transparent background: six columns and four rows of 256 by 256 cells, one full-body figure centred in each cell with a little space around it, its feet on the same line near the bottom of the cell, the same size in every frame. Row 1: walking toward the viewer. Row 2: walking to the left. Row 3: walking to the right. Row 4: walking away from the viewer, seen from behind. Each row is six evenly spaced steps of one smooth walk cycle. The same character, clothes and colors in every frame. No shadow, no ground, no text, no labels, no grid lines, no border.
```

Each prompt below is the style lock followed by its own paragraph.

## Io's friends

**1. Sol** (`sol-walk.png`). Attach `reference/art/sol-model.webp` and `reference/art/portraits/portrait-sol.png`.

```text
Sol, the last Ember Warden: a tall, broad-shouldered swordswoman of 24, the same woman as the attached model sheet. Sun-browned freckled skin, amber eyes, short tousled copper-red hair with one long braid down her back wrapped in gold cord, small gold hoop earrings. A brushed bronze half-plate breastplate over a burnt-orange tabard with a gold sun crest hanging to her knees, cream linen sleeves, one large left pauldron of layered bronze kestrel feathers with a glowing amber sunstone, bronze gauntlets, bronze knee guards and greaves over dark brown leather boots, brown leather belts. A short midnight-blue cape lined and edged in gold, with a gold sun on its back. Her sunsteel longsword is sheathed at her left hip, its sun-shaped crossguard showing. A confident, easy stride.
```

**2. Halcyon** (`halcyon-walk.png`). Attach `reference/art/halcyon-model.png`.

```text
Halcyon, the Gloam Knight: a tall, stern woman in blackened armour, the same knight as the attached model sheet. Soot-black plate with fine gold edging and worn bronze showing through, upswept pauldrons of broad pointed plates, dark gauntlets, chainmail at her sides, and a kingfisher-teal tabard over the breastplate bearing a sun clawed through by four gouges, its front panel to the knee and its back panel to the ankle. An open-faced blackened helm with a pointed kite-shaped front plate rising above the crown, and a tall crest of kingfisher-teal, grey-white and charcoal feathers along its top. White hair swept back under the helm, loose strands beside her face, and a long thick white braid down her back to a gold cuff. Narrow, cold, glowing blue eyes. Her long gloamsteel sword, its edge a cold blue, hangs sheathed at her side. A slow, heavy, measured walk.
```

**3. Ysmera Brightkeel** (`ysmera-walk.png`). The shipmaster, an Aurosi elf from the moon. Attach `reference/art/portraits/portrait-shipmaster-a.png`.

```text
Ysmera Brightkeel, an elven shipmaster from the moon, the same woman as the attached portrait: tall and very slender, light-boned and graceful, ageless, with long tapering pointed ears, pale luminous skin with a faint gold sheen and calm silver-grey eyes. Long straight silver-white hair dressed high with fine gold pins set with small glowing amber sunstones. A high-collared, ankle-length coat of deep midnight-blue silk embroidered in gold with airship sails and crescent moons, over a pale ivory blouse and slim dark trousers, soft dark boots, and a heavy gold chain of office with a large glowing amber sunstone pendant. She carries a slim brass navigator's instrument in one hand. A light, unhurried, elegant walk.
```

**4. Quill, with Inkblot** (`quill-walk.png`). The old sailor whose skiff becomes the Magpie.

```text
Quill, an old sailor and stall-keeper in his seventies: a weathered face, a short grey beard, a navy-blue sailor's coat with brass buttons over a cream shirt, worn brown trousers tucked into dark boots, a dark navy cap, and a quill pen tucked behind his left ear. Inkblot, a small black crow, rides on his left shoulder in every frame. A rolling sailor's gait, a little stiff in the knees.
```

## Wickhollow

**5. Mayor Gretch** (`gretch-walk.png`).

```text
Mayor Gretch, the mayor of a small witch's village, a woman in her sixties: a lined, kind, determined face, grey-white hair in a neat bun, a long plum-purple dress to her ankles with a mustard-gold knitted shawl round her shoulders, a small brass chain of office, and sensible dark shoes. A brisk, upright walk.
```

**6. Nettie** (`nettie-walk.png`).

```text
Nettie, a village herb-witch in her thirties: a friendly freckled face, long straight pale-blonde hair, a long moss-green robe with a gold trim down the front, a dark violet witch's hat with a narrow gold band and no horns, dark boots, and a bundle of dried herbs tucked at her collar. A cheerful, quick walk.
```

**7. Hilde** (`hilde-walk.png`).

```text
Hilde, a village blacksmith, a broad strong woman in her forties: a sun-browned cheerful face with a smudge of soot, short dark-brown hair, a slate-blue work shirt with rolled sleeves under a heavy brown leather apron to her knees, dark work trousers and heavy boots. A strong, steady stride.
```

## Bogmire

**8. Old Wenna** (`wenna-walk.png`).

```text
Old Wenna, a swamp-town herbalist, a woman in her eighties: a deeply lined, shrewd, amused face, grey-white hair in a loose bun, a long faded plum dress with a mustard-gold wrap and a faded plum shawl, a string of little herb pouches round her neck, and soft dark shoes. A slow, small-stepped walk with a slight stoop.
```

**9. Tobb** (`tobb-walk.png`).

```text
Tobb, the innkeeper of a stilt town in a fen, a big man in his fifties: a broad, tired, kind face, short brown hair, a slate-blue shirt under a long brown leather apron, dark trousers and boots, and a lantern-keeper's brass key on a cord round his neck. A heavy, unhurried walk.
```

**10. Pell** (`pell-walk.png`). A girl of about nine: about three quarters of Io's height.

```text
Pell, a girl of about nine from a swamp town, about three quarters as tall as an adult: a brave, serious little face, copper-orange hair to her shoulders, a mustard-yellow tunic over dusky purple leggings and small dark boots, holding an unlit brass lamp against her chest in both hands. A small, determined walk.
```

## Dawnroost

**11. Marta** (`marta-walk.png`).

```text
Marta, the old cook of a knights' waystation, a woman in her seventies: a round, warm, grieving face, grey-white hair in a bun, a long plum dress with a mustard-gold shawl and a flour-dusted apron, a small faded sun badge pinned at her collar, and soft dark shoes. A slow, warm, rocking walk.
```

**12. Brann** (`brann-walk.png`).

```text
Brann, the smith of a knights' waystation, a broad man in his forties: a square, earnest face, short dark-brown hair and a trimmed beard, a slate-blue shirt under a heavy brown leather apron, dark trousers and heavy boots, and a faint warm glow of sunstone on his hands. A broad, purposeful stride.
```

**13. Tamsin** (`tamsin-walk.png`). A girl of about ten: about three quarters of Io's height.

```text
Tamsin, a girl of about ten at a knights' waystation, about three quarters as tall as an adult: a curious, wide-eyed freckled face, copper-orange hair, a mustard-yellow tunic over dusky purple leggings and small dark boots, a wooden practice sword over her shoulder. A bouncy, eager walk.
```

## The shipyard

**14. Pim** (`pim-walk.png`). A gnome: about two thirds of Io's height.

```text
Pim, a gnome of the moon's people who works at an airship yard, a woman, about two thirds as tall as an adult and a little stout: a small, bright, cheerful face with pale skin and pointed ears, a short white braid, a tall star-blue pointed cap with a tiny gold star at its tip, a rust-brown work tunic, slate-grey trousers and small dark boots. A quick, bustling little walk.
```

**15. Tock** (`tock-walk.png`). A gnome: about two thirds of Io's height.

```text
Tock, a gnome shipwright of the moon's people, a man, about two thirds as tall as an adult and stout: a small wry face with pale skin, pointed ears and a full white beard, a tall star-blue pointed cap with a tiny gold star at its tip, a rust-brown work tunic with tools in its pockets, slate-grey trousers and small dark boots. A stumping, purposeful little walk.
```

**16. Old Gil** (`gil-walk.png`).

```text
Old Gil, the keeper of an airship yard's bunkhouse, a man in his seventies: a gentle, tired face, grey-white hair tied back, a long plum-colored coat with a mustard-gold scarf, dark trousers and boots, and a ring of iron keys at his belt. A slow, shuffling walk.
```

## Misthollow

**17. Sorrel** (`sorrel-walk.png`).

```text
Sorrel, the herb-witch of a mountain town of pale towers, a woman in her forties: a calm, cold-pinched face, long straight pale-blonde hair, a long moss-green robe with gold trim under a frosted grey cloak, a dark violet witch's hat with a narrow gold band and no horns, dark boots, and a little frost on her shoulders. A calm, careful walk, as if on ice.
```

**18. Ede** (`ede-walk.png`).

```text
Ede, the innkeeper of a mountain town of pale towers, a woman in her sixties: a stubborn, unafraid face, grey-white hair in a bun, a long plum dress with a mustard-gold shawl under a heavy grey winter cloak, and dark boots. A firm, no-nonsense walk.
```

**19. The watchwoman** (`watch-walk.png`).

```text
The watchwoman of a mountain town of pale towers, a strong woman in her thirties: a weary, watchful face, short dark-brown hair, a slate-blue padded tunic under a brown leather jerkin with a town badge, dark trousers and heavy boots, a lantern held low in one hand. A watchful, steady patrol walk.
```

## Not needed now

Lunara, Noctara and Envoi don't walk the maps, so they need no sheet. If a later scene puts them on a map, they can be added the same way.
