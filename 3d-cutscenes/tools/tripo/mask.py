# mask.py: from Chris's front view of Io, which of its pixels the face fix may paint onto the model (skinmask.png: her
# face whole in the middle, then only skin out to the face's edge, not the hair beside it; the drawn jaw line left out)
# and where her skin tone may cover the sides of her face and neck (sidemask.png: the same, widened a little).
# Usage, from 3d-cutscenes: python3 tools/tripo/mask.py art-requests/io-front.webp tools/tripo
import sys
import numpy as np
from PIL import Image, ImageFilter
src, out = sys.argv[1:3]
im = np.asarray(Image.open(src).convert('RGB')).astype(np.float32) / 255
H, W, _ = im.shape
r, g, b = im[..., 0], im[..., 1], im[..., 2]
mx, mn = im.max(-1), im.min(-1); v = mx; s = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
d = np.maximum(mx - mn, 1e-6)
h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
skin = (v > 0.55) & (s > 0.10) & (s < 0.55) & ((h < 40) | (h > 345)) & (r > g) & (g > b * 0.95)
yy, xx = np.mgrid[0:H, 0:W]
def ell(cx, cy, rx, ry): return np.hypot((xx - cx) / rx, (yy - cy) / ry)
# in picture pixels: her face and neck, the middle of her face, her glasses
outer = (ell(501, 281, 70, 64) < 1.0) | (ell(500, 372, 36, 46) < 1.0)
inner = (ell(501, 285, 50, 50) < 1.0) | (ell(468, 262, 31, 31) < 1.0) | (ell(535, 262, 31, 31) < 1.0) | (ell(501, 262, 16, 8) < 1.0)
full = inner | (skin & outer)
img = Image.fromarray((full * 255).astype(np.uint8))
a3 = np.asarray(img.filter(ImageFilter.MinFilter(3))) / 255.
a11 = np.asarray(img.filter(ImageFilter.MinFilter(11))) / 255.
k = np.clip((yy - 306) / 10, 0, 1)  # below her mouth the drawn jaw line is left out
m = a3 * (1 - k) + np.minimum(a3, a11) * k
Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.6)).save(out + '/skinmask.png')
side = Image.fromarray((full * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(13)).filter(ImageFilter.GaussianBlur(2.0))
side.save(out + '/sidemask.png')
print('wrote', out + '/skinmask.png', out + '/sidemask.png')
