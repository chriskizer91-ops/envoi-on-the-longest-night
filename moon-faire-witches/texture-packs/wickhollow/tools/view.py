# view.py: cut a region of a painting and draw a coordinate grid on it (in the full painting's pixels), for looking only.
# usage: python3 -I view.py <painting> x0 y0 x1 y1 <out.png> [grid step] [max side]
import sys
from PIL import Image, ImageDraw
src, x0, y0, x1, y1, out = sys.argv[1], *map(int, sys.argv[2:6]), sys.argv[6]
step = int(sys.argv[7]) if len(sys.argv) > 7 else 50
mx = int(sys.argv[8]) if len(sys.argv) > 8 else 1200
im = Image.open(src).convert('RGB').crop((x0, y0, x1, y1))
k = min(mx / im.width, mx / im.height, 4)
im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
d = ImageDraw.Draw(im)
if step > 0:
    for gx in range((x0 // step + 1) * step, x1, step):
        X = (gx - x0) * k; d.line([(X, 0), (X, im.height)], fill=(255, 0, 255), width=1); d.text((X + 2, 2), str(gx), fill=(255, 255, 0))
    for gy in range((y0 // step + 1) * step, y1, step):
        Y = (gy - y0) * k; d.line([(0, Y), (im.width, Y)], fill=(255, 0, 255), width=1); d.text((2, Y + 2), str(gy), fill=(255, 255, 0))
im.save(out)
