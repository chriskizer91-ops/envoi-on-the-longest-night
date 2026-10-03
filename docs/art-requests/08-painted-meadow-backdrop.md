# Art Request 08: The Wild Meadow's Painted Backdrop

For the locked-camera fight, **Colossus in the Meadow** (`../../living-battlefields/`). Everything far off in that fight is a painting: the night sky, the moon, the mountains, the forest round the meadow and the far grass. The page paints its own in code when it opens, and a painting from the image generator can take its place. Only the far part is seen as painted: the grass near enough to move, a tree, the mist, the weather and the fight stay live in front of it.

Numbered 08 so it doesn't clash with the game branch's requests 03 to 07.

## The guide

The painting has to match the page's camera, so it starts from the page's own painting:

- `../../living-battlefields/renders/painting-guide.jpg` (2048 × 1536), or
- **See the painting** on the fight page, in What it costs: press and hold it, or Download it.

Give the guide to the image generator as the starting picture (image-to-image, or "use as reference"), at medium strength, so these stay where they are:

- the horizon, a little over halfway down (61% from the top);
- the forest's edge along it, and the mountains just above the forest;
- the moon, high on the left (about a third of the way across and a sixth of the way down).

Generate it two to four times and keep the one closest to the guide's layout. Before sending it, try it on the phone: **Use my painting**, on the same page, puts it in at once. **The code's own** goes back.

Save it as `meadow-night.png`, 4:3 landscape, 2048 × 1536 or larger, and send it back: it will go in `living-battlefields/paintings/`, and the page will be set to open with it.

## The prompt

The style follows the game's battle backdrops (request 03 on the game's branch): the same painted look and the same night, with no stars. Noctara is the sky with no light in it, and the stars only come back at the ending. The camera is different, though: low and level, behind the party, looking across the meadow, instead of high above.

```text
Highly detailed hand-painted JRPG battle backdrop in a rich painterly style, a wide night landscape seen from about head height, looking level across a meadow to the edge of a forest. Night: deep violet and indigo shadows, silver-blue moonlight. A starless sky: only a big full moon high on the left, with a soft glow round it and a few thin clouds. A wide empty meadow of tall wild grass with pale moonflowers fills the lower part of the picture, flat and open, fading into a low mist at the foot of the forest. A dark ring of old oaks, tall firs and a few bare twisted trees stands along the horizon a little over halfway down, their tops edged with moonlight, hazier the further they are. Behind the forest, soft violet mountains in the haze, the farthest with snow on their crests. Fine painted texture on every leaf and blade. No characters, no creatures, no buildings, no lamps, no text, no UI. 4:3 landscape.
```

If the generator won't take the guide, paste this after the prompt:

```text
Composition: the horizon line sits 61% of the way down the picture. The full moon's center is 31% from the left edge and 17% from the top. The forest rises from the horizon to about 40% from the top; the mountains peak at about 30% from the top.
```
