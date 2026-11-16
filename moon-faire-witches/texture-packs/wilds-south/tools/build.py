# build.py: makes the four packs from places.py: refs/, stand-in/, prompts.json and inventory.md in each place's folder,
# plus previews for checking (stand-ins tiled 2 x 2, and a sheet of all reference crops) in /tmp/ws/prev.
# usage: python3 -I build.py [place ...]
import sys, os, json
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from PIL import Image, ImageDraw
from places import PLACES
from texlib import make_standin, ref_crop

GROUP = os.path.dirname(HERE)
PREV = '/tmp/ws/prev'; os.makedirs(PREV, exist_ok=True)

def tile2(im):
    t = Image.new('RGB', (im.width * 2, im.height * 2))
    for i in range(2):
        for j in range(2): t.paste(im, (i * im.width, j * im.height))
    return t.resize((512, 512), Image.LANCZOS)

def sheet(items, out, cell=180):
    cols = 5; rows = (len(items) + cols - 1) // cols
    S = Image.new('RGB', (cols * cell, rows * (cell + 14)), (40, 40, 40)); d = ImageDraw.Draw(S)
    for k, (label, path) in enumerate(items):
        im = Image.open(path).convert('RGB'); im.thumbnail((cell - 4, cell - 4))
        x, y = (k % cols) * cell, (k // cols) * (cell + 14)
        S.paste(im, (x + 2, y + 2)); d.text((x + 2, y + cell), label[:30], fill=(255, 255, 0))
    S.save(out)

def build(place):
    P = PLACES[place]; img = Image.open(P['painting']).convert('RGB')
    base = os.path.join(GROUP, place); os.makedirs(base + '/refs', exist_ok=True); os.makedirs(base + '/stand-in', exist_ok=True)
    prompts, refsheet, stands = [], [], []
    for r in P['rows']:
        made_here = not r['shared'].startswith(('yes, made in', 'in this group, made in', 'in this group, listed', 'in this group, ref', 'yes, listed'))
        if 'stand' in r:
            s = r['stand']; out = f"{base}/stand-in/{r['id']}.png"
            im = make_standin(img, s['box'], squash=s.get('squash', 1.0), mirror=s.get('mirror'), rot=s.get('rot', 0)); im.save(out)
            tile2(im).save(f"{PREV}/{place}__{r['id']}.png"); stands.append((r['id'], f"{PREV}/{place}__{r['id']}.png"))
        if made_here and ('prompt' in r or r['kind'] in ('prop', 'sky')):
            src = Image.open(r['src']).convert('RGB') if 'src' in r else img
            out = f"{base}/refs/{r['id']}.jpg"
            ref_crop(src, r.get('ref', r['box']), out)
            im = Image.open(out)
            if max(im.size) < 512:   # small subjects are enlarged so they read
                s = 512 / max(im.size); im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS).save(out, quality=85)
            refsheet.append((r['id'], out))
        if 'prompt' in r:
            p = r['prompt']
            prompts.append({'id': r['id'], 'file': r['id'] + '.png', 'shape': p['shape'], 'rules': r['kind'],
                            'refs': [f"{place}/{r['id']}.jpg", f"{place}.png"], 'title': p['title'], 'subject': p['subject'],
                            'use': p['use'], 'shared': r['shared'].startswith(('yes', 'in this group'))})
    with open(base + '/prompts.json', 'w') as f: json.dump(prompts, f, indent=2, ensure_ascii=False); f.write('\n')
    write_inventory(place, P, base)
    sheet(refsheet, f"{PREV}/{place}__refs.png"); sheet(stands, f"{PREV}/{place}__stands.png", cell=256)
    n = lambda k: sum(1 for r in P['rows'] if r['kind'] == k)
    print(place, 'rows', len(P['rows']), 'stand-ins', len(stands), 'prompts', len(prompts), 'props', n('prop'), 'refs', len(refsheet))

def write_inventory(place, P, base):
    L = [f"# {P['name']} (`{place}`): texture pack inventory", '',
         f"Painting: `reference/art/walk/wilds/{os.path.basename(P['painting'])}` (1536 x 1024). Night.", '', P['note'], '',
         'Where a row says "made in" another place, its texture, prompt and reference crop are in that place\'s folder; '
         'here it is only listed, with where it shows in this painting. "In this group" means it is used across these '
         'four wild places (see the group README).', '',
         '| id | kind | what it is, in plain words | where in the painting (x0, y0, x1, y1) | shared? |',
         '|---|---|---|---|---|']
    for r in P['rows']:
        where = ', '.join(str(v) for v in r['box'])
        if 'where' in r: where += f" in {r['where']}"
        L.append(f"| `{r['id']}` | {r['kind']} | {r['what']} | ({where}) | {r['shared']} |")
    with open(base + '/inventory.md', 'w') as f: f.write('\n'.join(L) + '\n')

if __name__ == '__main__':
    for place in (sys.argv[1:] or PLACES): build(place)
