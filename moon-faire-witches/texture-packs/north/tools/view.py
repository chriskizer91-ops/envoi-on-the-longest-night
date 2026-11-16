# view.py: makes a viewing copy of a painting (or a crop of one) with a coordinate grid, for looking at it
# usage: python3 -I view.py <painting> <out.jpg> [x0 y0 x1 y1] [--grid 100] [--w 1200]
import sys
from PIL import Image, ImageDraw
a = sys.argv[1:]
src, out = a[0], a[1]
nums = [int(v) for v in a[2:6]] if len(a) >= 6 and not a[2].startswith('--') else None
opt = lambda k, d: int(a[a.index(k) + 1]) if k in a else d
g, W = opt('--grid', 100), opt('--w', 1200)
im = Image.open(src).convert('RGB')
box = nums or (0, 0, im.width, im.height)
c = im.crop(box); s = W / c.width
c = c.resize((W, round(c.height * s)), Image.LANCZOS)
d = ImageDraw.Draw(c)
if g:
    for x in range((box[0] // g + 1) * g, box[2], g):
        X = (x - box[0]) * s; d.line([(X, 0), (X, c.height)], fill=(255, 0, 255), width=1); d.text((X + 2, 2), str(x), fill=(255, 255, 0))
    for y in range((box[1] // g + 1) * g, box[3], g):
        Y = (y - box[1]) * s; d.line([(0, Y), (c.width, Y)], fill=(255, 0, 255), width=1); d.text((2, Y + 2), str(y), fill=(255, 255, 0))
c.save(out, quality=88)
