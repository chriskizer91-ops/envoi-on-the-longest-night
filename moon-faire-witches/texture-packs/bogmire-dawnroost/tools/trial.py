# trial.py: try stand-in patches and show each as a 2 x 2 tiling, side by side with its source crop, on one contact sheet.
# usage: trial.py <out.png> <painting> x0 y0 x1 y1 squash [<painting> x0 y0 x1 y1 squash ...]
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'tools'))
from seamless import make
from PIL import Image, ImageDraw
a = sys.argv[2:]; out = sys.argv[1]
tiles = []
while a:
    p, box, sq = a[0], tuple(float(v) for v in a[1:5]), float(a[5]); a = a[6:]
    im = make(Image.open(p), box, size=256, squash=sq)
    t = Image.new('RGB', (512, 512)); [t.paste(im, (x, y)) for x in (0, 256) for y in (0, 256)]
    src = Image.open(p).convert('RGB').crop(tuple(int(v) for v in box)); s = 256 / max(src.size)
    src = src.resize((max(1, round(src.width * s)), max(1, round(src.height * s))))
    c = Image.new('RGB', (512 + 260, 530), (40, 40, 40)); c.paste(t, (0, 18)); c.paste(src, (516, 18))
    ImageDraw.Draw(c).text((4, 2), f'{os.path.basename(p)} {box} sq{sq}', fill=(255, 255, 0))
    tiles.append(c)
cols = 2; rows = (len(tiles) + 1) // 2
sheet = Image.new('RGB', (cols * 772, rows * 530), (0, 0, 0))
for i, c in enumerate(tiles): sheet.paste(c, ((i % cols) * 772, (i // cols) * 530))
sheet.save(out); print(out)
