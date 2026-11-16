# trypatch.py: try several stand-in patches on one painting and lay them out tiled 2 x 2 to compare.
# usage: python3 -I trypatch.py <painting> <out.png> "name x0 y0 x1 y1 squash [angle]" ...
import sys, os; H = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, H); sys.path.insert(0, H + "/../../tools")
from build import painting, rotated
from seamless import make
from PIL import Image, ImageDraw
img = painting(sys.argv[1]); tests = [t.split() for t in sys.argv[3:]]
cell = 300; rows = (len(tests) + 3) // 4
sh = Image.new('RGB', (cell * 4, (cell + 16) * rows), (40, 40, 40)); d = ImageDraw.Draw(sh)
for i, t in enumerate(tests):
    k, b, s = t[0], tuple(map(int, t[1:5])), float(t[5]); a = float(t[6]) if len(t) > 6 else 0
    im = make(rotated(img, b, a), b, squash=s); T = Image.new('RGB', (1024, 1024)); [T.paste(im, (x, y)) for x in (0, 512) for y in (0, 512)]
    T.thumbnail((cell - 4, cell - 4)); x, y = (i % 4) * cell, (i // 4) * (cell + 16); sh.paste(T, (x + 2, y + 16)); d.text((x + 2, y + 2), k, fill=(255, 255, 0))
sh.save(sys.argv[2])
