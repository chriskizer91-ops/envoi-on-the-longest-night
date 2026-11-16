# view.py: cut a crop of a painting and enlarge it, to look at it closely.  usage: view.py <painting> x0 y0 x1 y1 <out> [maxside]
import sys
from PIL import Image
a = sys.argv
im = Image.open(a[1]).convert('RGB').crop(tuple(int(v) for v in a[2:6]))
m = int(a[7]) if len(a) > 7 else 1200
s = m / max(im.size)
im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS).save(a[6]); print(a[6])
