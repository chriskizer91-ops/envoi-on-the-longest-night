# seamless.py: turns a patch cut from a painting into a square texture that repeats without a visible join, as a stand-in
# until the real painted texture pack arrives. The patch's light is evened out first (a big soft blur of its brightness
# is divided out, so a lamp's glow or a shadow edge does not repeat), then its edges are blended into a copy of itself
# shifted by half, so the left edge runs into the right and the top into the bottom.
# usage (as a tool):  python3 -I seamless.py <painting.png> <x0> <y0> <x1> <y1> <out.png> [--size 512] [--keep-light] [--squash 1.0]
#   --squash k: stretch the patch's height by k first (ground seen at a slant in a painting looks squashed; 1.3 to 1.6 undoes it)
# or from Python:  from seamless import make; make(img, box, size=512, flatten=True, squash=1.0) -> PIL image
import sys
from PIL import Image, ImageFilter, ImageChops
import numpy as np

def _flatten(a, sigma):
    lum = 0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2]
    blur = np.asarray(Image.fromarray(np.clip(lum, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(sigma)), dtype=np.float32)
    gain = (lum.mean() + 1.0) / (blur + 1.0)
    return np.clip(a * gain[..., None], 0, 255)

def make(img, box, size=512, flatten=True, squash=1.0):
    p = img.convert('RGB').crop(tuple(int(v) for v in box))
    if squash and abs(squash - 1.0) > 1e-3: p = p.resize((p.width, max(1, round(p.height * squash))), Image.LANCZOS)
    s = min(p.width, p.height); p = p.crop(((p.width - s) // 2, (p.height - s) // 2, (p.width - s) // 2 + s, (p.height - s) // 2 + s)).resize((size, size), Image.LANCZOS)
    a = np.asarray(p, dtype=np.float32)
    if flatten: a = _flatten(a, size / 6)
    h = size // 2
    b = np.roll(np.roll(a, h, 0), h, 1)
    # weight of the shifted copy: 1 near the picture's edges (where the original would show its seam), 0 in the middle
    y, x = np.mgrid[0:size, 0:size].astype(np.float32)
    d = np.minimum(np.minimum(x, size - 1 - x), np.minimum(y, size - 1 - y)) / (size * 0.25)
    w = np.clip(1.0 - d, 0, 1); w = w * w * (3 - 2 * w)
    out = a * (1 - w[..., None]) + b * w[..., None]
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))

if __name__ == '__main__':
    args = sys.argv[1:]
    opt = lambda k, d: float(args[args.index(k) + 1]) if k in args else d
    src, x0, y0, x1, y1, out = args[0], *map(float, args[1:5]), args[5]
    im = make(Image.open(src), (x0, y0, x1, y1), size=int(opt('--size', 512)), flatten='--keep-light' not in args, squash=opt('--squash', 1.0))
    im.save(out); print(out, im.size)
