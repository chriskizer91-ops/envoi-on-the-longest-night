# tiles.py: every stand-in of a place tiled 2 x 2 (at half size), side by side, to check for seams, blotches and glows.
# usage: tiles.py <place folder> <out.png>
import sys, os
from PIL import Image, ImageDraw
d = os.path.join(sys.argv[1], 'stand-in'); fs = sorted(os.listdir(d))
S = Image.new('RGB', (len(fs) * 520, 540), (50, 50, 50)); D = ImageDraw.Draw(S)
for i, f in enumerate(fs):
    im = Image.open(os.path.join(d, f)).convert('RGB').resize((256, 256))
    for x in (0, 256):
        for y in (0, 256): S.paste(im, (i * 520 + x, 20 + y))
    D.text((i * 520 + 2, 3), f, fill=(255, 255, 0))
S.save(sys.argv[2]); print(sys.argv[2])
