# tile_batch.py: runs tile_test on several candidates and stacks them into one sheet
# usage: python3 -I tile_batch.py <out.jpg> "<painting> x0 y0 x1 y1 squash label" ...
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'tools'))
from seamless import make
from PIL import Image, ImageDraw
rows = []
for spec in sys.argv[2:]:
    p = spec.split(); src = Image.open(p[0]); box = tuple(int(v) for v in p[1:5]); sq = float(p[5]); lab = ' '.join(p[6:])
    t = make(src, box, 512, True, sq).resize((200, 200), Image.LANCZOS)
    patch = src.convert('RGB').crop(box); patch.thumbnail((200, 200))
    r = Image.new('RGB', (200 + 8 + 400, 400), (40, 40, 40)); r.paste(patch, (0, 0))
    for i in range(2):
        for j in range(2): r.paste(t, (208 + i * 200, j * 200))
    ImageDraw.Draw(r).text((4, 380), lab, fill=(255, 255, 0)); rows.append(r)
cols = 2; W = rows[0].width; H = 400
out = Image.new('RGB', (W * cols + 8, (H + 8) * ((len(rows) + 1) // cols)), (0, 0, 0))
for k, r in enumerate(rows): out.paste(r, ((k % cols) * (W + 8), (k // cols) * (H + 8)))
out.save(sys.argv[1], quality=85)
