# Art Request 02: The World Map

The flying map: the world as the party sees it from the Magpie (plan step 19), and the world map Io walks (step 18). The ground-level maps are `04-walking-maps.md`.

Chris painted the world himself as nine detailed tiles in a 3×3 grid, received on October 2, 2026 as day versions (`../../reference/art/world-map/day/`). The night versions are next: their prompts are at the end ("The night versions"). The prompts just below were the first description of the world and are kept for reference.

The map has to show the four level bands as four regions, from the warm south to the frozen north, because the Magpie can only fly as far as its sunstone allows:

| Band | Levels | Region | What's there |
|---|---|---|---|
| 1 | 1 to 5 | The Gloomfen | Wickhollow, where the Gloamwood meets the Sable river; the Thornwood past the bridge; Bogmire, the stilt town over the fen |
| 2 | 5 to 10 | The Warm Roads hills | Dawnroost, the Warden waystation, built around a living sunstone node |
| 3 | 10 to 15 | The northern wilds | No town: broken Warm Roads, a dimming Ember Line, small wells, the place the party crosses paths with Halcyon |
| 4 | 15 to 20 | The frozen north | Misthollow and its dead Moonwell, under Noctara's cold |

Generate the portrait version first; it fits a phone held upright. Generate each version two to four times and keep the one where the four regions read most clearly. No labels or text: the game adds those.

## Style lock

```text
Hand-painted storybook JRPG world map in the spirit of Final Fantasy IX, seen from high above at a slight angle, as if from an airship. Soft painterly textures with crisp readable shapes, not photoreal, not pixel art, no text, no labels, no compass, no UI, no characters. Night-world palette: deep blue and violet shadows, silver moonlight, warm amber lamplight and glowing amber veins in the ground.
```

## Portrait version

Save as `world-map.png`.

```text
Hand-painted storybook JRPG world map in the spirit of Final Fantasy IX, seen from high above at a slight angle, as if from an airship. Soft painterly textures with crisp readable shapes, not photoreal, not pixel art, no text, no labels, no compass, no UI, no characters. Night-world palette: deep blue and violet shadows, silver moonlight, warm amber lamplight and glowing amber veins in the ground.

Portrait composition, 2:3. A single landmass that runs from a warm south at the bottom to a frozen north at the top, in four clear bands, each separated by a natural border such as a river, a ridge or a fog line.

Bottom band, the Gloomfen: dark marsh and fen pools under moonlight, a slow black river called the Sable winding through it, a dark forest on one side, and a darker, tangled wood across an old stone bridge. On the river where the forest meets the water, a small village of crooked timber houses with warm windows around a cobbled square with a softly glowing well at its center. Further along the fen, a town of wooden houses raised on tall stilts over black water, joined by plank walkways, its lamps strangely dark.

Second band, rising hills: old paved roads follow glowing amber veins that run just under the ground, with small stone waymarker nodes along them. On a hilltop, a fortified stone waystation with a tall round roost-tower, built around a huge glowing amber crystal that lights the hill like a hearth.

Third band, the northern wilds: empty moors and dark pine ridges with no towns, broken stretches of the paved road, the amber veins fading to faint embers, frost creeping over the ground, a few lonely wells and a ruined crossroads.

Top band, the frozen north: snow, ice and freezing mist, the amber veins gone dark, and a town of tall pale towers half lost in the mist around a large well that gives no light at all. The sky above it is a starless black that the moonlight can't reach.

Around the edges of the land, the Aether: a glowing sea of moonlit cloud that ships could sail on.
```

## Landscape version (optional)

Save as `world-map-wide.png`. The same world laid out left to right, for a computer screen or a phone held sideways.

```text
Hand-painted storybook JRPG world map in the spirit of Final Fantasy IX, seen from high above at a slight angle, as if from an airship. Soft painterly textures with crisp readable shapes, not photoreal, not pixel art, no text, no labels, no compass, no UI, no characters. Night-world palette: deep blue and violet shadows, silver moonlight, warm amber lamplight and glowing amber veins in the ground.

Landscape composition, 3:2. A single landmass that runs from a warm south on the left to a frozen north on the right, in four clear bands, each separated by a natural border such as a river, a ridge or a fog line.

First band, the Gloomfen: dark marsh and fen pools under moonlight, a slow black river called the Sable winding through it, a dark forest on one side, and a darker, tangled wood across an old stone bridge. On the river where the forest meets the water, a small village of crooked timber houses with warm windows around a cobbled square with a softly glowing well at its center. Further along the fen, a town of wooden houses raised on tall stilts over black water, joined by plank walkways, its lamps strangely dark.

Second band, rising hills: old paved roads follow glowing amber veins that run just under the ground, with small stone waymarker nodes along them. On a hilltop, a fortified stone waystation with a tall round roost-tower, built around a huge glowing amber crystal that lights the hill like a hearth.

Third band, the northern wilds: empty moors and dark pine ridges with no towns, broken stretches of the paved road, the amber veins fading to faint embers, frost creeping over the ground, a few lonely wells and a ruined crossroads.

Last band, the frozen north: snow, ice and freezing mist, the amber veins gone dark, and a town of tall pale towers half lost in the mist around a large well that gives no light at all. The sky above it is a starless black that the moonlight can't reach.

Around the edges of the land, the Aether: a glowing sea of moonlit cloud that ships could sail on.
```

## How the game uses it

- The Magpie flies over the painting. A band the ship can't reach yet sits under a veil of cold mist, drawn in code, which lifts at each refit or charge.
- The four stops get small markers and names in code, so the painting needs none.
- If one painting is too coarse up close on a phone, a later request can add a close-up piece for each band.

## The night versions

The night versions arrived on October 2, 2026 (`../../reference/art/world-map/night/`); the prompts are kept for reference. The game takes place at night, so the night versions are the ones it uses. Make each by attaching the day tile as image 1 and pasting its prompt. Keep every night tile exactly aligned with its day tile: walk areas and town entrances get traced once and used on both, and a tile that moves things would break the joins.

Check each result against its day tile before keeping it: the coastlines, roads, bridges and towns should sit in the same places. Save each one under its day name with `-night` before `.png`, such as `08-southern-wetlands-bogmire-and-willowmurk-night.png`.

### Tiles 4, 5, 6, 7 and 9

The forests, the central sea, the east and the southwest.

```text
Use case: precise-object-edit. Image 1 is one of nine adjoining regional paintings of a fantasy RPG continent, seen from a high oblique bird's-eye view. Repaint this exact image as the same place at night. Keep everything exactly where it is: the camera, framing, coastlines, mountains, rivers, roads, bridges, islands and every settlement, the same size and shape, and every feature that crosses the four edges, so the nine night paintings still join. Change only the light and the season. Night under a bright moon: deep blue and violet shadows, silver-blue moonlight from the upper left with soft shadows to the lower right, dark water with moonlight glinting on it, and warm amber light in the windows and lamps of every settlement. No stars and no sky. No text, labels, grid, frames, UI, people, creatures or airships. Landscape 3:2, 1536 × 1024, the same size as image 1.
```

### Tile 8: the southern wetlands

Bogmire's lights are being eaten, so its lamps are mostly dark.

```text
Use case: precise-object-edit. Image 1 is one of nine adjoining regional paintings of a fantasy RPG continent, seen from a high oblique bird's-eye view. Repaint this exact image as the same place at night. Keep everything exactly where it is: the camera, framing, coastlines, mountains, rivers, roads, bridges, islands and every settlement, the same size and shape, and every feature that crosses the four edges, so the nine night paintings still join. Change only the light and the season. Night under a bright moon: deep blue and violet shadows, silver-blue moonlight from the upper left with soft shadows to the lower right, dark water with moonlight glinting on it, and warm amber light in the windows and lamps of every settlement. No stars and no sky. No text, labels, grid, frames, UI, people, creatures or airships. Landscape 3:2, 1536 × 1024, the same size as image 1.

This tile is the southern wetlands. The stilt town at the lower left keeps only a few lit lanterns; the rest of its windows and lamps are dark and cold, with a faint green mist over the water round it. The other settlements keep their warm lights.
```

### Tiles 1 and 2: the north

Noctara's cold is setting in.

```text
Use case: precise-object-edit. Image 1 is one of nine adjoining regional paintings of a fantasy RPG continent, seen from a high oblique bird's-eye view. Repaint this exact image as the same place at night. Keep everything exactly where it is: the camera, framing, coastlines, mountains, rivers, roads, bridges, islands and every settlement, the same size and shape, and every feature that crosses the four edges, so the nine night paintings still join. Change only the light and the season. Night under a bright moon: deep blue and violet shadows, silver-blue moonlight from the upper left with soft shadows to the lower right, dark water with moonlight glinting on it, and warm amber light in the windows and lamps of every settlement. No stars and no sky. No text, labels, grid, frames, UI, people, creatures or airships. Landscape 3:2, 1536 × 1024, the same size as image 1.

This tile is the north, where a deep cold is setting in: frost on the high ground and the tops of the trees, thin ice at the edges of rivers and coves, and fewer lit windows than in the south.
```

### Tile 3: the far north

Misthollow's mountains, under Noctara's cold.

```text
Use case: precise-object-edit. Image 1 is one of nine adjoining regional paintings of a fantasy RPG continent, seen from a high oblique bird's-eye view. Repaint this exact image as the same place at night. Keep everything exactly where it is: the camera, framing, coastlines, mountains, rivers, roads, bridges, islands and every settlement, the same size and shape, and every feature that crosses the four edges, so the nine night paintings still join. Change only the light and the season. Night under a bright moon: deep blue and violet shadows, silver-blue moonlight from the upper left with soft shadows to the lower right, dark water with moonlight glinting on it, and warm amber light in the windows and lamps of every settlement. No stars and no sky. No text, labels, grid, frames, UI, people, creatures or airships. Landscape 3:2, 1536 × 1024, the same size as image 1.

This tile is the far north, held by a deep unnatural cold: heavy snow on the mountains and valleys, frozen rivers and waterfalls, ice along the coasts, freezing mist in the valleys, and only a few faint lit windows in the mountain town.
```
