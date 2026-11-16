# rot.py: like trial.py, but turns the patch first (degrees, counter-clockwise) so rows or stripes run straight.
# usage: python3 -I rot.py <out.png> <painting> cx cy side angle squash [...]
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'tools'))
from seamless import make
from PIL import Image, ImageDraw
def turned(src, cx, cy, side, ang, squash):
    im = Image.open(src).convert('RGB')
    r = side  # cut a box twice the side, turn it, keep the middle
    big = im.crop((cx - r, cy - r, cx + r, cy + r)).rotate(ang, resample=Image.BICUBIC)
    h = side / 2
    return make(big, (r - h, r - h / squash, r + h, r + h / squash), size=512, squash=squash)
if __name__ == '__main__':
    out, a = sys.argv[1], sys.argv[2:]; tiles = []
    while a:
        src, cx, cy, side, ang, k = a[0], *map(float, a[1:6]); a = a[6:]
        t = turned(src, cx, cy, side, ang, k).resize((256, 256))
        q = Image.new('RGB', (512, 512)); [q.paste(t, (i * 256, j * 256)) for i in (0, 1) for j in (0, 1)]
        ImageDraw.Draw(q).text((4, 4), f'{os.path.basename(src)[:14]} c{int(cx)},{int(cy)} s{int(side)} a{ang} k{k}', fill=(255, 255, 0)); tiles.append(q)
    n = len(tiles); cols = min(n, 3); rows = (n + cols - 1) // cols
    sheet = Image.new('RGB', (cols * 516, rows * 516), (40, 40, 40))
    for i, t in enumerate(tiles): sheet.paste(t, ((i % cols) * 516, (i // cols) * 516))
    sheet.save(out)
