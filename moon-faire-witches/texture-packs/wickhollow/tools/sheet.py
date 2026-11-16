# sheet.py: contact sheets for looking at a place's refs (with names) or its stand-ins tiled 2 x 2.
# usage: python3 -I sheet.py <place> refs|stand <out.png>
import sys, os
from PIL import Image, ImageDraw
G = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
place, what, out = sys.argv[1:4]
d = os.path.join(G, place, 'refs' if what == 'refs' else 'stand-in')
fs = sorted(os.listdir(d)); cell = 300 if what == 'refs' else 400
tiles = []
for f in fs:
    im = Image.open(os.path.join(d, f)).convert('RGB')
    if what == 'stand':
        t = im.resize((cell // 2, cell // 2)); im = Image.new('RGB', (cell, cell)); [im.paste(t, (i * cell // 2, j * cell // 2)) for i in (0, 1) for j in (0, 1)]
    else: im.thumbnail((cell, cell - 14))
    c = Image.new('RGB', (cell, cell), (60, 60, 60)); c.paste(im, ((cell - im.width) // 2, 14 if what == 'refs' else 0))
    ImageDraw.Draw(c).text((3, 1), f[:-4], fill=(255, 255, 0)); tiles.append(c)
cols = 5 if what == 'refs' else 3; rows = (len(tiles) + cols - 1) // cols
s = Image.new('RGB', (cols * (cell + 4), rows * (cell + 4)), (20, 20, 20))
for i, t in enumerate(tiles): s.paste(t, ((i % cols) * (cell + 4), (i // cols) * (cell + 4)))
s.save(out); print(out, len(tiles))
