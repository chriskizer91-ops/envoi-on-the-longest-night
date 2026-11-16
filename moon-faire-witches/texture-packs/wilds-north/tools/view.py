# view.py: cut a box out of a painting (optionally with a pixel grid) to look at it closely.
# usage: python3 -I view.py <painting> x0 y0 x1 y1 <out> [--grid 50] [--scale 1.0]
import sys
from PIL import Image, ImageDraw
a = sys.argv[1:]
src, x0, y0, x1, y1, out = a[0], *map(int, a[1:5]), a[5]
g = int(a[a.index('--grid') + 1]) if '--grid' in a else 0
sc = float(a[a.index('--scale') + 1]) if '--scale' in a else 1.0
im = Image.open(src).convert('RGB').crop((x0, y0, x1, y1))
if sc != 1.0: im = im.resize((round(im.width * sc), round(im.height * sc)), Image.LANCZOS)
if g:
    d = ImageDraw.Draw(im)
    for x in range((x0 // g + 1) * g, x1, g):
        X = (x - x0) * sc; d.line([(X, 0), (X, im.height)], fill=(255, 255, 0) if x % (g * 2) == 0 else (255, 120, 0), width=1)
        d.text((X + 2, 2), str(x), fill=(255, 255, 0))
    for y in range((y0 // g + 1) * g, y1, g):
        Y = (y - y0) * sc; d.line([(0, Y), (im.width, Y)], fill=(255, 255, 0) if y % (g * 2) == 0 else (255, 120, 0), width=1)
        d.text((2, Y + 2), str(y), fill=(255, 255, 0))
im.save(out)
