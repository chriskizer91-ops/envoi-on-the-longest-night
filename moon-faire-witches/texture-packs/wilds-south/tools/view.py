# view.py: saves an enlarged crop of a painting with a pixel grid, for looking closely. usage: view.py <png> x0 y0 x1 y1 <out> [scale]
import sys
from PIL import Image, ImageDraw
src, x0, y0, x1, y1, out = sys.argv[1], *map(int, sys.argv[2:6]), sys.argv[6]
sc = float(sys.argv[7]) if len(sys.argv) > 7 else 2
im = Image.open(src).convert('RGB').crop((x0, y0, x1, y1))
im = im.resize((int(im.width * sc), int(im.height * sc)), Image.LANCZOS)
d = ImageDraw.Draw(im)
step = 50
for gx in range((x0 // step + 1) * step, x1, step):
    X = (gx - x0) * sc; d.line([(X, 0), (X, 8)], fill=(255, 255, 0)); d.text((X + 2, 0), str(gx), fill=(255, 255, 0))
for gy in range((y0 // step + 1) * step, y1, step):
    Y = (gy - y0) * sc; d.line([(0, Y), (8, Y)], fill=(255, 255, 0)); d.text((0, Y + 2), str(gy), fill=(255, 255, 0))
im.save(out)
