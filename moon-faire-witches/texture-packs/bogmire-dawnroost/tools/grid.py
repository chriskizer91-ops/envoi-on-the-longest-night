# grid.py: a crop of a painting, enlarged, with a labelled grid in the painting's own pixels, to read coordinates off.
# usage: grid.py <painting> x0 y0 x1 y1 <out> [step] [maxside]
import sys
from PIL import Image, ImageDraw
a = sys.argv
x0, y0, x1, y1 = (int(v) for v in a[2:6])
step = int(a[7]) if len(a) > 7 else 50
m = int(a[8]) if len(a) > 8 else 1400
im = Image.open(a[1]).convert('RGB').crop((x0, y0, x1, y1))
s = m / max(im.size)
im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
d = ImageDraw.Draw(im)
for x in range((x0 // step + 1) * step, x1, step):
    X = (x - x0) * s; d.line([(X, 0), (X, im.height)], fill=(0, 255, 255), width=1); d.text((X + 2, 2), str(x), fill=(255, 255, 0))
for y in range((y0 // step + 1) * step, y1, step):
    Y = (y - y0) * s; d.line([(0, Y), (im.width, Y)], fill=(0, 255, 255), width=1); d.text((2, Y + 2), str(y), fill=(255, 255, 0))
im.save(a[6]); print(a[6])
