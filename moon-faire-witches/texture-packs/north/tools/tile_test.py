# tile_test.py: makes a stand-in from a patch and shows it tiled 2 x 2 next to the patch, to check for seams and blotches
# usage: python3 -I tile_test.py <painting> x0 y0 x1 y1 squash <out.jpg>
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'tools'))
from seamless import make
from PIL import Image
a = sys.argv[1:]
src = Image.open(a[0]); box = tuple(int(v) for v in a[1:5]); sq = float(a[5])
t = make(src, box, 512, True, sq).resize((256, 256), Image.LANCZOS)
patch = src.convert('RGB').crop(box); patch.thumbnail((256, 256))
out = Image.new('RGB', (256 + 8 + 512, 512), (40, 40, 40))
out.paste(patch, (0, 0))
for i in range(2):
    for j in range(2): out.paste(t, (264 + i * 256, j * 256))
out.save(a[6], quality=88)
