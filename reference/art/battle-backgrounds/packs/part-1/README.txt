AETHERMOOR COMBAT BACKGROUNDS — PART 1

Original generated PNGs, supplied at their native resolution.
Open index.html after extracting this ZIP to preview this part.
Part 1 contains woodland, Gloomfen and Ironspire scenes.
Part 2 contains Sunscorch and Hearthsea scenes.

LOCATIONS
01 | Wickhollow River Glade | Wickhollow, The Gloamwood | images/01-woodland-wickhollow-river-glade.png
02 | Eldergrove First-Age Clearing | Eldergrove, The Verdant Wilds | images/02-woodland-eldergrove-first-age-clearing.png
03 | Bogmire Lantern Banks | Bogmire, The Gloomfen | images/03-gloomfen-bogmire-lantern-banks.png
04 | Misthollow Drowned City | Misthollow Ruins, The Gloomfen | images/04-gloomfen-misthollow-drowned-city.png
05 | Frostmere Lakeside Meadow | Frostmere Lake, The Ironspire Peaks | images/05-ironspire-frostmere-lakeside-meadow.png
06 | Ironhold High Pass | Ironhold, Stormwatch, The Ironspire Peaks | images/06-ironspire-ironhold-high-pass.png

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
