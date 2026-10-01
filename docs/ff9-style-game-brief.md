# Project brief: an FF9-style JRPG built from reusable pieces

## Who I am and what I'm doing

I make small browser games with Claude, mostly on my phone, using Claude chats and Claude Code sessions. I've already made Game Boy-style JRPGs that work well. One has about 5–6 hours of play, with new areas, real loot progression and stories I helped write. I'm now pushing toward the look and feel of **Final Fantasy IX**: painted backgrounds, 3D characters on top, an active-time battle system, and a real story with real characters. FF9 is the game I grew up on, and I spent years trying to beat it as a kid.

I'm not trying to copy FF9's characters, creatures, names or story. Everything in this game should be **original**. FF9 is the reference for *how it feels and how it's built*, not what's in it.

Alongside this, I'm building a separate gift game: a calm walk around a real zebu cattle farm for my friend Dottie, a retired digital art teacher. That game uses the same engine approach, and some characters are meant to be shared between the two games.

## The demo I'm attaching: "Night Square: the Shadow Wraith"

This is a single-file HTML proof of concept, a witch fighting a Shadow Wraith in a moonlit village square. Treat it as the starting engine. What's inside:

- **One painted backdrop** (1448×1086 WebP, about 625 KB, embedded) with a hidden three.js (r128) camera matched to it: 12° field of view and 24° pitch, at 54 painting pixels per meter. The narrow field of view acts like a long lens, which flattens the perspective so it lines up with a high three-quarter "diorama" painting.
- **Scene data in one `LAYOUT` object, all in painting-pixel coordinates:**
  - `walk`: the walkable-area outline (46 points)
  - `obst`: obstacle circles (well, lamp posts)
  - `occ`: foreground cutouts, so characters walk *behind* the well, fences and buildings. These are invisible, depth-only shapes standing upright in the 3D scene.
  - `lights`: point lights placed on the painted lamps, so 3D characters are lit by the painting
  - `start`: the starting position

  A helper converts any painting pixel to a ground-plane position by casting a ray from the camera.
- **A camera director** that pans and zooms across the painting: frame one character, frame two characters together, follow a character, fit a group, and add shake.
- **Three characters built entirely in code** (witch, wraith, goddess), with no model files:
  - Bodies made from spheres, cylinders and lathe profiles, with `MeshStandardMaterial`
  - A nested joint hierarchy that the animations move
  - Procedural animation from an action table, blended over idle and walk
  - Spring physics for hair, coat, skirt and hat
- **Battle systems:** a turn gauge (ATB), a Trance meter, a command menu, spells and effects, a summon sequence, synthesized music and sound effects, and a win/lose screen.

## How I want to build: digital Legos

Instead of one giant game made in one go, I want a library of **reusable pieces ("bricks")**. Each brick gets its own file and a short spec saying what it takes in, what it gives back, and an example. Future sessions then read a page of spec instead of a huge game file, and new games become mostly assembly plus new art.

Bricks I see so far:

1. **Scene engine:** painted backdrop, matched camera, walk area, obstacles, cutouts and lights, pulled out of the demo without the battle code.
2. **Scene format:** the `LAYOUT` data plus **exits** (this door leads to that scene) and **camera triggers**. This is the most important brick, since everything snaps to it.
3. **Scene editor:** a phone-friendly tool where I load a painting, line up a 3D ground grid with sliders (camera height, tilt, lens), paint the walk area, trace cutouts, place lights and exits, and export the scene data.
4. **Camera director:** the shot functions from the demo.
5. **Character factory contract**, shared by every character:
   ```js
   makeX(look) → { root, fx, play(name, force), animate(t, dt, motion), reset(), setLook(look),
                   action, progress, busy, headPos(out), handPos(out, side) }
   ```
   1 unit = 1 meter, feet on y = 0, facing +z. Every character also gets a `look` object (colors and swappable parts) from the start.
6. **Battle system:** ATB, Trance, commands, effects. This can be its own brick, separate from exploring.
7. **Dialogue, menus, save system, synthesized audio.**

Characters already in progress elsewhere: a customizable farmer, a zebu cow, and possibly a **wandering painter-mage** who visits the farm game as a surprise cameo and is also a party member or NPC here.

## What I want to work on in this project

**Characters first.** I want to design and build the main cast: party members, key NPCs and a few enemies. All are code-built to the same quality as the witch in the demo and all follow the contract above. For each one, I'd like:

- A short concept: who they are, their role in battle, and their personality, which should show in how they move.
- A test-bench page to view them, play every action and try their looks.
- At the end, a standalone `.js` file and a README.

**Then a vertical slice** before anything bigger: one town, one field area, one dungeon, three party members and one boss, about an hour of play. If that works using the scene editor and the bricks, the rest of the game is mostly content.

## What I already know about the limits

- **Volume is the real cost.** FF9 had hundreds of painted scenes. The scene editor is what keeps the cost per scene low. I make the paintings with an image model, which is good at keeping a consistent style across many prompts.
- **Consistency across many sessions** depends on the specs and a stable contract.
- **Emotional acting** (hugging, crying, big gestures) is where code-built animation hits its ceiling first. For big story beats, I'd rather lean on camera work and painted stills, which is what FF9 did with its FMVs.

## Technical constraints

- Single self-contained HTML files, published as Claude artifacts.
- Scripts may load only from cdnjs.cloudflare.com, cdn.jsdelivr.net/npm, cdn.tailwindcss.com and code.jquery.com. Fonts may come from Google Fonts. Images must be embedded. There's a 16 MB limit per page.
- three.js **r128** (no `CapsuleGeometry`).
- It must run well on a mid-range phone with touch controls.

## How to start

Read the attached demo, tell me briefly what you see as its strongest reusable parts and its weakest spots, then help me plan the main cast. Ask me about the story and the party before building anyone.
