# texlib.py: helpers for the wilds-south packs. make_standin wraps the shared seamless.py; for a long thin subject (a birch
# trunk, the face of a low wall) the patch is first mirrored side by side or top to bottom until it is about square.
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'tools'))
from seamless import make
from PIL import Image

def make_standin(img, box, squash=1.0, mirror=None, flatten=True, rot=0):
    if rot:   # turn the painting round the patch's centre first (a log lying slantwise, so its grain runs across)
        x0, y0, x1, y1 = box; cx, cy = (x0 + x1) / 2, (y0 + y1) / 2; r = max(x1 - x0, y1 - y0)
        big = img.convert('RGB').crop((int(cx - r), int(cy - r), int(cx + r), int(cy + r))).rotate(rot, Image.BICUBIC)
        img = big; box = (r - (x1 - x0) / 2, r - (y1 - y0) / 2, r + (x1 - x0) / 2, r + (y1 - y0) / 2)
    if not mirror:
        return make(img, box, size=512, flatten=flatten, squash=squash)
    p = img.convert('RGB').crop(tuple(int(v) for v in box))
    if squash != 1.0: p = p.resize((p.width, max(1, round(p.height * squash))), Image.LANCZOS)
    if mirror == 'stretch':   # a very thin trunk: its middle strip pulled out sideways (birch marks run across anyway),
        import numpy as np     # made to repeat top to bottom only, since side to side it is the same all the way
        col = np.asarray(p.resize((8, 512), Image.LANCZOS), dtype=np.float32).mean(axis=1, keepdims=True)
        lum = col.mean(axis=(1, 2)); col = col * (lum.mean() / (np.convolve(lum, np.ones(129) / 129, 'same') + 1))[:, None, None]
        b = np.roll(col, 256, 0); y = np.arange(512, dtype=np.float32); d = np.minimum(y, 511 - y) / 128.0
        w = np.clip(1 - d, 0, 1); w = w * w * (3 - 2 * w); col = col * (1 - w[:, None, None]) + b * w[:, None, None]
        return Image.fromarray(np.clip(col, 0, 255).astype(np.uint8)).resize((512, 512), Image.BICUBIC)
    elif mirror == 'x':   # thin upright subject: repeat across
        n = max(1, round(p.height / p.width)); W = Image.new('RGB', (p.width * n, p.height))
        for i in range(n): W.paste(p, (i * p.width, 0))
    else:               # long low subject (a wall face): repeat downward, course on course
        n = max(1, round(p.width / p.height)); W = Image.new('RGB', (p.width, p.height * n))
        for i in range(n): W.paste(p, (0, i * p.height))
    return make(W, (0, 0, W.width, W.height), size=512, flatten=flatten)

def ref_crop(img, box, out, pad=0):
    x0, y0, x1, y1 = box
    p = img.convert('RGB').crop((max(0, x0 - pad), max(0, y0 - pad), min(img.width, x1 + pad), min(img.height, y1 + pad)))
    s = 768 / max(p.width, p.height)
    if s < 1: p = p.resize((round(p.width * s), round(p.height * s)), Image.LANCZOS)
    p.save(out, quality=85)
