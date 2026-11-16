# sheet.py: a contact sheet of every image in a folder, each with its file name, to check them at a glance.
# usage: sheet.py <folder> <out.png> [thumb] [cols]
import sys, os
from PIL import Image, ImageDraw
d, out = sys.argv[1], sys.argv[2]
T = int(sys.argv[3]) if len(sys.argv) > 3 else 220; C = int(sys.argv[4]) if len(sys.argv) > 4 else 6
fs = sorted(f for f in os.listdir(d) if f.lower().endswith(('.jpg', '.png')))
rows = (len(fs) + C - 1) // C
S = Image.new('RGB', (C * T, rows * (T + 14)), (60, 60, 60)); D = ImageDraw.Draw(S)
for i, f in enumerate(fs):
    im = Image.open(os.path.join(d, f)).convert('RGB'); im.thumbnail((T - 4, T - 4))
    x, y = (i % C) * T, (i // C) * (T + 14)
    S.paste(im, (x + 2, y + 14)); D.text((x + 2, y + 1), f[:34], fill=(255, 255, 0))
S.save(out); print(out, len(fs))
