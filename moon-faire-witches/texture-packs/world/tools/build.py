# build.py: makes the world pack (aethermoor/): the stand-ins from the night atlas, the reference crops by night and by
# day, the props' crops, and a 2 x 2 tiled check sheet of every stand-in (in /tmp, not in the pack).
# usage: python3 -I build.py
import os, sys
sys.path.insert(0, '/home/claude/envoi-game/moon-faire-witches/texture-packs/tools')
from seamless import make
from PIL import Image, ImageDraw
import numpy as np

R = '/home/claude/envoi-game/reference/art/world-map/'
OUT = '/home/claude/envoi-game/moon-faire-witches/texture-packs/world/aethermoor/'
N = Image.open(R + 'night/Aethermoor-Natural-Night-Atlas.webp').convert('RGB')
D = Image.open(R + 'day/Aethermoor-Nine-Region-Atlas.webp').convert('RGB')

# id: (box in atlas px, squash). The atlas is painted from high up at a slight slant: 1.15 undoes it on land; water is flat
TEX = {
    'pine_forest':        ((700, 1000, 860, 1100), 1.15),
    'broadleaf_forest':   ((1000, 1470, 1180, 1600), 1.15),
    'willow_marsh':       ((1880, 2270, 2010, 2370), 1.15),
    'grassland':          ((1300, 1165, 1380, 1205), 1.15),
    'farmland':           ((1170, 1968, 1300, 2055), 1.15),
    'beach_sand':         ((495, 1735, 550, 1790), 1.0),
    'desert_ground':      ((3440, 1900, 3540, 1960), 1.15),
    'sandstone_mesa':     ((3470, 1400, 3580, 1480), 1.15),
    'bare_rock':          ((3500, 1130, 3560, 1190), 1.15),
    'snowy_mountainside': ((3000, 410, 3100, 490), 1.15),
    'snowfield':          ((2950, 342, 2998, 382), 1.15),
    'town_roofs':         ((1020, 1215, 1100, 1275), 1.0),
    'deep_sea':           ((2250, 1620, 2450, 1780), 1.0),
    'shallow_sea':        ((1180, 2585, 1260, 2625), 1.0),
    'river_water':        ((1395, 1798, 1450, 1828), 1.0),
    'mountain_lake':      ((3262, 775, 3300, 805), 1.0),
    'coastal_cliff':      ((450, 1145, 560, 1195), 1.0),
}

# the props and landmarks: id: (centre in atlas px, half-width of the crop)
PROPS = {
    'wickhollow': ((1348, 1838), 110), 'bogmire': ((1752, 2512), 110), 'dawnroost': ((1325, 1098), 100),
    'shipyard': ((2097, 599), 110), 'misthollow': ((3500, 735), 120),
    'camp_warm_roads': ((820, 1530), 90), 'camp_northern_wilds': ((1150, 590), 90), 'camp_northeast_peaks': ((2760, 1090), 90),
    'northern_crossroads': ((1960, 820), 90), 'frozen_pass': ((3270, 980), 90), 'thornwood': ((1530, 2160), 100),
    'rotbridge': ((2050, 2424), 100), 'willowmurk': ((2898, 2588), 100), 'sunken_ruins': ((2560, 2508), 100),
    'mosswatch_tower': ((1138, 2318), 80), 'eldergrove': ((990, 728), 90), 'fawnrest_shrine': ((1525, 905), 80),
    'frostmere_lake': ((3330, 800), 100), 'peaks_veil': ((2914, 212), 90), 'stormwatch': ((3790, 538), 90),
    'hearthstone_keep': ((2340, 1240), 200), 'dusthaven': ((3525, 1588), 90), 'sandspire': ((4050, 1822), 100),
    'miragewell': ((3560, 2108), 90), 'scorchgate_ruins': ((3300, 2262), 90),
    'stone_bridge': ((1950, 575), 110), 'waterfall': ((3380, 1050), 70), 'sea_stack': ((200, 2500), 100),
    'boardwalk': ((2300, 2430), 100), 'harbour_docks': ((2400, 1420), 100), 'road_track': ((3650, 1500), 120),
}
# the plants and the lights: id: box
EXTRA = {
    'pine_tree': (220, 1410, 310, 1510), 'broadleaf_tree': (610, 1590, 710, 1700), 'willow_tree': (1925, 2335, 2020, 2410),
    'dead_tree': (2020, 2300, 2085, 2390),
    'town_windows': (1270, 1790, 1420, 1890), 'harbour_lanterns': (2280, 1260, 2480, 1440),
}

def save_ref(img, box, path):
    c = img.crop(box); s = min(768 / max(c.size), 3.0)
    c.resize((round(c.width * s), round(c.height * s)), Image.LANCZOS).save(path, quality=85)

def grow(box, k=0.6, minside=120):
    x0, y0, x1, y1 = box; w, h = x1 - x0, y1 - y0
    dx, dy = max(w * k, (minside - w) / 2), max(h * k, (minside - h) / 2)
    return (max(0, int(x0 - dx)), max(0, int(y0 - dy)), min(4608, int(x1 + dx)), min(3072, int(y1 + dy)))

os.makedirs(OUT + 'refs', exist_ok=True); os.makedirs(OUT + 'stand-in', exist_ok=True)
made = {}
for k, (box, sq) in TEX.items():
    im = make(N, box, size=512, squash=sq); im.save(OUT + 'stand-in/' + k + '.png'); made[k] = im
    big = grow(box)
    save_ref(N, big, OUT + 'refs/' + k + '.jpg'); save_ref(D, big, OUT + 'refs/' + k + '-day.jpg')

# lake ice: the painting has no frozen water (Frostmere Lake is painted open), so its stand-in is made from the mountain
# lake's stand-in, its light turned to pale frosted silver-blue, with a little of the snowfield's grain laid over it
lake = np.asarray(made['mountain_lake'], dtype=np.float32); snow = np.asarray(made['snowfield'], dtype=np.float32)
lum = (0.299 * lake[..., 0] + 0.587 * lake[..., 1] + 0.114 * lake[..., 2]); lum = (lum - lum.mean()) / (lum.std() + 1e-3); lum = np.clip(lum, -1.6, 1.6)
ice = np.stack([118 + 14 * lum, 136 + 14 * lum, 168 + 12 * lum], -1)
snow_l = snow.mean(-1, keepdims=True); ice = ice * 0.8 + (snow_l - snow_l.mean() + ice.mean()) * 0.2
Image.fromarray(np.clip(ice, 0, 255).astype(np.uint8)).save(OUT + 'stand-in/lake_ice.png')
save_ref(N, grow(TEX['mountain_lake'][0]), OUT + 'refs/lake_ice.jpg'); save_ref(D, grow(TEX['mountain_lake'][0]), OUT + 'refs/lake_ice-day.jpg')

for k, ((x, y), r) in PROPS.items():
    box = (max(0, x - r), max(0, y - round(r * 0.75)), min(4608, x + r), min(3072, y + round(r * 0.75)))
    save_ref(N, box, OUT + 'refs/' + k + '.jpg'); save_ref(D, box, OUT + 'refs/' + k + '-day.jpg')
for k, box in EXTRA.items():
    save_ref(N, box, OUT + 'refs/' + k + '.jpg'); save_ref(D, box, OUT + 'refs/' + k + '-day.jpg')

# check sheet: every stand-in tiled 2 x 2 at half size
ids = list(TEX) + ['lake_ice']
cols = 6; rows = (len(ids) + cols - 1) // cols
sheet = Image.new('RGB', (cols * 520, rows * 540), 'white'); d = ImageDraw.Draw(sheet)
for i, k in enumerate(ids):
    t = Image.open(OUT + 'stand-in/' + k + '.png').resize((256, 256), Image.LANCZOS)
    tile = Image.new('RGB', (512, 512))
    for a in (0, 256):
        for b in (0, 256): tile.paste(t, (a, b))
    x, y = (i % cols) * 520, (i // cols) * 540
    sheet.paste(tile, (x, y)); d.text((x + 4, y + 516), k, fill='black')
sheet.save('/tmp/wv/sheet.jpg', quality=85)
print('stand-ins', len(ids), 'props', len(PROPS), 'extra', len(EXTRA))
