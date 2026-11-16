# trial.py: try stand-in patches and show each one tiled 2 x 2 in one contact sheet, for looking only.
# usage: python3 -I trial.py <out.png> <painting> x0 y0 x1 y1 squash [<painting> x0 y0 x1 y1 squash ...]
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'tools'))
from seamless import make
from PIL import Image, ImageDraw
out, a = sys.argv[1], sys.argv[2:]
tiles = []
while a:
    src, x0, y0, x1, y1, k = a[0], *map(float, a[1:6]); a = a[6:]
    t = make(Image.open(src), (x0, y0, x1, y1), size=256, squash=k)
    q = Image.new('RGB', (512, 512)); [q.paste(t, (i * 256, j * 256)) for i in (0, 1) for j in (0, 1)]
    ImageDraw.Draw(q).text((4, 4), f'{os.path.basename(src)[:14]} {int(x0)},{int(y0)},{int(x1)},{int(y1)} k{k}', fill=(255, 255, 0))
    tiles.append(q)
n = len(tiles); cols = min(n, 3); rows = (n + cols - 1) // cols
sheet = Image.new('RGB', (cols * 516, rows * 516), (40, 40, 40))
for i, t in enumerate(tiles): sheet.paste(t, ((i % cols) * 516, (i // cols) * 516))
sheet.save(out)
