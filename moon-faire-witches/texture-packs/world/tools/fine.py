# fine.py: one box of the night atlas, enlarged, with a grid every 20 atlas px (labels every 100)
# usage: python3 -I fine.py x0 y0 x1 y1 out.jpg [scale] [day]
import sys
from PIL import Image, ImageDraw
R = '/home/claude/envoi-game/reference/art/world-map/'
f = 'day/Aethermoor-Nine-Region-Atlas.webp' if 'day' in sys.argv[7:] else 'night/Aethermoor-Natural-Night-Atlas.webp'
A = Image.open(R + f).convert('RGB')
x0, y0, x1, y1 = map(int, sys.argv[1:5]); s = float(sys.argv[6]) if len(sys.argv) > 6 else 3
c = A.crop((x0, y0, x1, y1)).resize((round((x1 - x0) * s), round((y1 - y0) * s)), Image.LANCZOS); d = ImageDraw.Draw(c)
for g in range((x0 // 20 + 1) * 20, x1, 20):
    d.line([((g - x0) * s, 0), ((g - x0) * s, c.height)], fill=(255, 255, 0) if g % 100 == 0 else (120, 120, 0))
    if g % 100 == 0: d.text(((g - x0) * s + 2, 2), str(g), fill=(255, 255, 0))
for g in range((y0 // 20 + 1) * 20, y1, 20):
    d.line([(0, (g - y0) * s), (c.width, (g - y0) * s)], fill=(255, 255, 0) if g % 100 == 0 else (120, 120, 0))
    if g % 100 == 0: d.text((2, (g - y0) * s + 2), str(g), fill=(255, 255, 0))
c.save(sys.argv[5], quality=85)
