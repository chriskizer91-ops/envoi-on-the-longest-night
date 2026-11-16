# look.py: shows a box of the atlas by night and by day side by side, enlarged, with a grid every 100 atlas px.
# usage: python3 -I look.py x0 y0 x1 y1 out.jpg [scale]
import sys
from PIL import Image, ImageDraw
R = '/home/claude/envoi-game/reference/art/world-map/'
N = Image.open(R + 'night/Aethermoor-Natural-Night-Atlas.webp').convert('RGB')
D = Image.open(R + 'day/Aethermoor-Nine-Region-Atlas.webp').convert('RGB')
x0, y0, x1, y1 = map(int, sys.argv[1:5]); out = sys.argv[5]
s = float(sys.argv[6]) if len(sys.argv) > 6 else 1.0
w, h = round((x1 - x0) * s), round((y1 - y0) * s)
im = Image.new('RGB', (w * 2 + 8, h), 'white')
for i, A in enumerate((N, D)):
    c = A.crop((x0, y0, x1, y1)).resize((w, h), Image.LANCZOS); d = ImageDraw.Draw(c)
    for gx in range((x0 // 100 + 1) * 100, x1, 100):
        d.line([((gx - x0) * s, 0), ((gx - x0) * s, h)], fill=(255, 0, 0) if gx % 500 == 0 else (255, 255, 0)); d.text(((gx - x0) * s + 2, 2), str(gx), fill=(255, 255, 0))
    for gy in range((y0 // 100 + 1) * 100, y1, 100):
        d.line([(0, (gy - y0) * s), (w, (gy - y0) * s)], fill=(255, 0, 0) if gy % 500 == 0 else (255, 255, 0)); d.text((2, (gy - y0) * s + 2), str(gy), fill=(255, 255, 0))
    im.paste(c, (i * (w + 8), 0))
im.save(out, quality=88)
