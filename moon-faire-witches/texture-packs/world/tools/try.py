# try.py: makes trial stand-ins from boxes given on the command line and a contact sheet of them tiled 2 x 2
# usage: python3 -I try.py out.jpg id:x0,y0,x1,y1[,squash] ...
import sys
sys.path.insert(0, '/home/claude/envoi-game/moon-faire-witches/texture-packs/tools')
from seamless import make
from PIL import Image, ImageDraw
N = Image.open('/home/claude/envoi-game/reference/art/world-map/night/Aethermoor-Natural-Night-Atlas.webp').convert('RGB')
items = sys.argv[2:]
sheet = Image.new('RGB', (len(items) * 520, 540), 'white'); d = ImageDraw.Draw(sheet)
for i, it in enumerate(items):
    name, v = it.split(':'); v = [float(t) for t in v.split(',')]
    sq = v[4] if len(v) > 4 else 1.15
    t = make(N, v[:4], size=256, squash=sq)
    tile = Image.new('RGB', (512, 512))
    for a in (0, 256):
        for b in (0, 256): tile.paste(t, (a, b))
    sheet.paste(tile, (i * 520, 0)); d.text((i * 520 + 4, 516), name + ' ' + it.split(':')[1], fill='black')
sheet.save(sys.argv[1], quality=85)
