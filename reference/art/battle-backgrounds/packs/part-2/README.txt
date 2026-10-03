AETHERMOOR COMBAT BACKGROUNDS — PART 2

Original generated PNGs, supplied at their native resolution.
Open index.html after extracting this ZIP to preview this part.
Part 1 contains woodland, Gloomfen and Ironspire scenes.
Part 2 contains Sunscorch and Hearthsea scenes.

LOCATIONS
07 | Sandspire Moonlit Steppe | Sandspire, The Sunscorch Wastes | images/07-sunscorch-sandspire-moonlit-steppe.png
08 | Miragewell Oasis Margin | Miragewell, Dusthaven, The Sunscorch Wastes | images/08-sunscorch-miragewell-oasis-margin.png
09 | Hearthstone Island Shore | Hearthstone Keep, The Hearthsea | images/09-hearthsea-hearthstone-island-shore.png
10 | Hearthsea Moonlit Headland | The Hearthsea, Hearthstone Keep | images/10-hearthsea-moonlit-headland.png

ART DIRECTION
The approved moonlit battle painting guides the palette and finish.
All images are landscape 4:3 with an open lower-third fighting space, distant landmarks and a starless moonlit sky.
Rain, lightning, storm coloration, combat particles and actors remain live renderer effects.

INTEGRATION
Use the existing field.usePainting(image) hook to preview a selected image.
The source demo retains the original baked sky/object/ground and distance mask when importing a painting.
For precise region-specific weather alignment, supply classification and distance masks matching the selected painting, especially where water or desert cliffs replace forest.
Keep the current battle camera, actor positions, animation timing and combat systems when integrating the art.
These are artwork assets; this pack makes no changes to either uploaded HTML file.

FILES
manifest.json records image names, native dimensions, map locations and SHA-256 checksums.
generation-prompts.json records the full prompts and built-in image-generation mode.
Reference inputs were the source-camera layout guide, the approved Colossus painting and the Magpie world map.
