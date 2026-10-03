# Art Request 06: The Townsfolk's Portraits

The game is playable with every townsperson talking. Io, Sol and Ysmera speak with their painted portraits (request 05); everyone else shows a pixel portrait for now: their walking sprite's head and shoulders, blown up. These sixteen prompts replace those with paintings in the same style as the pilot three.

Each person's colors match their walking sprite (`src/game/sprites.js`), so the painting and the sprite read as the same person. Two pairs share a sprite (Gretch and the other elders, Hilde and the other workers); the paintings tell them apart.

How to make them: as in request 05. Square, 1:1, at least 1024 × 1024, head and shoulders turned slightly to the viewer's left, a plain deep indigo background, moonlight from the upper left and a warm lamp from below right. Generate two to four of each and keep the best. Save them in `reference/art/portraits/` under the file names below, and they go into the game in place of the pixel portraits.

## Style lock

Every prompt starts with this.

```text
Highly detailed painted character portrait for a fantasy JRPG dialogue box, in the spirit of Final Fantasy IX character art: rich hand-painted rendering with crisp clean edges, expressive eyes, detailed hair and fabric, not photoreal, not pixel art, not anime cel shading. Head and shoulders, the face in the upper middle of the frame, turned slightly toward the viewer's left. Night lighting: soft cool silver-blue moonlight from the upper left, a warm amber lamp glow from below right. Plain deep indigo background with a faint soft vignette. No text, no frame, no border, no UI. Square 1:1, at least 1024 by 1024.
```

Each prompt below is the style lock followed by its own paragraph.

## Wickhollow

**1. Mayor Gretch** (`portrait-gretch.png`). Wickhollow's mayor, steady and worried.

```text
Mayor Gretch, the mayor of a small witch's village, a woman in her sixties: a lined, kind, determined face, grey-white hair in a neat bun, a plum-purple dress with a mustard-gold knitted shawl round her shoulders and a small brass chain of office.
```

**2. Nettie** (`portrait-nettie.png`). The village's other witch, who sells herbs.

```text
Nettie, a village herb-witch in her thirties: a friendly freckled face, long straight pale-blonde hair, a moss-green robe with a gold trim down the front, and a dark violet witch's hat with a narrow gold band, no horns. A bundle of dried herbs tucked at her collar.
```

**3. Hilde** (`portrait-hilde.png`). The smith, broad and cheerful.

```text
Hilde, a village blacksmith, a broad strong woman in her forties: a sun-browned cheerful face with a smudge of soot, short dark-brown hair, a slate-blue work shirt with rolled sleeves under a heavy brown leather apron.
```

**4. Quill** (`portrait-quill.png`). The old sailor whose skiff becomes the Magpie, with his crow Inkblot.

```text
Quill, an old sailor and stall-keeper, a man in his seventies: a weathered face, a short grey beard, a navy-blue sailor's coat with brass buttons and a dark navy cap, a quill pen tucked behind his left ear. A small black crow, Inkblot, perched on his shoulder.
```

## Bogmire

**5. Old Wenna** (`portrait-wenna.png`). Bogmire's herbalist, who knows her jars by touch.

```text
Old Wenna, a swamp-town herbalist, a woman in her eighties: a deeply lined, shrewd, amused face, grey-white hair in a loose bun, a faded plum shawl over a mustard-gold wrap, a string of little herb pouches round her neck.
```

**6. Tobb** (`portrait-tobb.png`). The innkeeper on stilts.

```text
Tobb, the innkeeper of a stilt town in a fen, a big man in his fifties: a broad tired kind face, short brown hair, a slate-blue shirt under a brown leather apron, a lantern-keeper's brass key on a cord round his neck.
```

**7. Pell** (`portrait-pell.png`). A Bogmire girl who keeps her mother's lamp in the window.

```text
Pell, a girl of about nine from a swamp town: a brave, serious little face, copper-orange hair to her shoulders, a mustard-yellow tunic, holding an unlit brass lamp against her chest.
```

## Dawnroost

**8. Marta** (`portrait-marta.png`). The Wardens' old cook, who kept their bunks made.

```text
Marta, the old cook of a knights' waystation, a woman in her seventies: a round, warm, grieving face, grey-white hair in a bun, a plum dress with a mustard-gold shawl and a flour-dusted apron edge, a small faded sun badge pinned at her collar.
```

**9. Brann** (`portrait-brann.png`). Dawnroost's smith, who brings the node's light down to the Magpie.

```text
Brann, the smith of a knights' waystation, a broad man in his forties: a square, earnest face, short dark-brown hair and a trimmed beard, a slate-blue shirt under a brown leather apron, a faint warm glow of sunstone on his hands.
```

**10. Tamsin** (`portrait-tamsin.png`). A girl at Dawnroost who has never seen a Warden.

```text
Tamsin, a girl of about ten at a knights' waystation: a curious, wide-eyed freckled face, copper-orange hair, a mustard-yellow tunic, a wooden practice sword over her shoulder.
```

## The shipyard

**11. Pim** (`portrait-pim.png`). An Aurosi gnome, the yard's herb-seller.

```text
Pim, a gnome of the moon's people who works at an airship yard, a woman: a small bright cheerful face with pale skin and pointed ears, a short white braid, a tall star-blue pointed cap with a tiny gold star at its tip, a rust-brown work tunic.
```

**12. Tock** (`portrait-tock.png`). An Aurosi gnome shipwright.

```text
Tock, a gnome shipwright of the moon's people, a man: a small wry face with pale skin, pointed ears and a full white beard, a tall star-blue pointed cap with a tiny gold star at its tip, a rust-brown work tunic with tools in its pockets.
```

**13. Old Gil** (`portrait-gil.png`). Keeper of the yard's bunkhouse.

```text
Old Gil, the keeper of an airship yard's bunkhouse, a man in his seventies: a gentle tired face, grey-white hair tied back, a plum-colored coat with a mustard-gold scarf, a ring of iron keys at his shoulder.
```

## Misthollow

**14. Sorrel** (`portrait-sorrel.png`). Misthollow's herb-witch, whose herbs have gone pale in the cold.

```text
Sorrel, the herb-witch of a mountain town of pale towers, a woman in her forties: a calm, cold-pinched face, long straight pale-blonde hair, a moss-green robe with gold trim under a frosted grey cloak, and a dark violet witch's hat with a narrow gold band. A little frost on her shoulders.
```

**15. Ede** (`portrait-ede.png`). Misthollow's innkeeper, who keeps the fire lit for spite.

```text
Ede, the innkeeper of a mountain town of pale towers, a woman in her sixties: a stubborn, unafraid face, grey-white hair in a bun, a plum dress with a mustard-gold shawl and a heavy grey winter cloak, firelight warm on one side of her face.
```

**16. The watchwoman** (`portrait-watch.png`). The town guard at the foot of the Moonwell's stair.

```text
The watchwoman of a mountain town of pale towers, a strong woman in her thirties: a weary, watchful face, short dark-brown hair, a slate-blue padded tunic under a brown leather jerkin with a town badge, a lantern held low.
```
