# build.py: makes the wilds-north texture packs from the place lists in places.py.
# For each place it writes refs/<id>.jpg (reference crops), stand-in/<id>.png (seamless 512 x 512 stand-ins),
# inventory.md and prompts.json, and a contact sheet of each to /tmp/wn/ to look at.
# usage: python3 -I build.py [place ...]
import sys, os, json
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, '..', '..', 'tools'))
from PIL import Image, ImageDraw
from seamless import make
import places

ROOT = os.path.normpath(os.path.join(HERE, '..'))
GAME = os.path.normpath(os.path.join(ROOT, '..', '..', '..'))
SHEETS = '/tmp/wn'
_cache = {}

def painting(path):
    if path not in _cache: _cache[path] = Image.open(os.path.join(GAME, path)).convert('RGB')
    return _cache[path]

def rotated(img, box, angle):
    # turn the painting about the box's centre (degrees, counter-clockwise), so a slanting plank or log runs level
    if not angle: return img
    cx, cy = (box[0] + box[2]) / 2, (box[1] + box[3]) / 2
    return img.rotate(angle, resample=Image.BICUBIC, center=(cx, cy))

def ref_crop(img, box, angle=0):
    im = rotated(img, box, angle).crop(tuple(box))
    s = 768 / max(im.size)
    if s < 1: im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    elif max(im.size) < 320:  # small things are scaled up so they read (the long side to about 384 px)
        s = min(4, 384 / max(im.size)); im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    return im

def where(row, place):
    b = row['box']
    src = row.get('src')
    if src: return f"{', '.join(map(str, b))} in the fight painting `{os.path.basename(src)}`"
    return ', '.join(map(str, b))

def build(name):
    P = places.PLACES[name]
    out = os.path.join(ROOT, name); os.makedirs(os.path.join(out, 'refs'), exist_ok=True); os.makedirs(os.path.join(out, 'stand-in'), exist_ok=True)
    for d in ('refs', 'stand-in'):
        for f in os.listdir(os.path.join(out, d)): os.remove(os.path.join(out, d, f))
    main = P['painting']
    rows, prompts, sheet_refs, sheet_tex = [], [], [], []
    for r in P['rows']:
        img = painting(r.get('src', main))
        made_here = r.get('shared') in (None, 'no', 'here')
        if r.get('shared') == 'here': shared_txt = 'yes, made here'
        elif r.get('shared') in (None, 'no'): shared_txt = 'no'
        else: shared_txt = ('yes, ' if r['id'].startswith('shared_') else 'no; reused, ') + r['shared']
        rows.append(f"| `{r['id']}` | {r['kind']} | {r['what']} | {where(r, name)} | {shared_txt} |")
        if not made_here: continue
        has_prompt = 'prompt' in r
        if has_prompt or r['kind'] in ('prop', 'sky', 'light') or r.get('ref'):
            if not (r['kind'] == 'light' and not r.get('ref')):
                im = ref_crop(img, r.get('refbox', r['box']), r.get('angle', 0))
                im.save(os.path.join(out, 'refs', r['id'] + '.jpg'), quality=85); sheet_refs.append((r['id'], im))
        if r['kind'] in ('ground', 'material'):
            st = r['stand']
            si = make(rotated(img, st['box'], st.get('angle', 0)), st['box'], size=512, squash=st.get('squash', 1.0))
            si.save(os.path.join(out, 'stand-in', r['id'] + '.png')); sheet_tex.append((r['id'], si))
        if has_prompt:
            p = r['prompt']
            prompts.append({
                'id': r['id'], 'file': r['id'] + '.png', 'shape': p.get('shape', 'Square'),
                'rules': r['kind'], 'refs': [f"{name}/{r['id']}.jpg", f"{name}.png"],
                'title': p['title'], 'subject': p['subject'], 'use': p['use'],
                'shared': r.get('shared') == 'here'})
    head = ['| id | kind | what it is, in plain words | where in the painting (x0, y0, x1, y1) | shared? |', '|---|---|---|---|---|']
    with open(os.path.join(out, 'inventory.md'), 'w') as f:
        f.write(f"# {P['title']}: what a 3D build needs\n\n{P['note'].strip()}\n\n" + '\n'.join(head + rows) + '\n')
    with open(os.path.join(out, 'prompts.json'), 'w') as f:
        json.dump(prompts, f, indent=2, ensure_ascii=False); f.write('\n')
    # contact sheets to look at
    os.makedirs(SHEETS, exist_ok=True)
    def sheet(items, fn, cell, tile):
        if not items: return
        cols = 4; W = cell * cols; H = (cell + 16) * ((len(items) + cols - 1) // cols)
        sh = Image.new('RGB', (W, H), (40, 40, 40)); d = ImageDraw.Draw(sh)
        for i, (k, im) in enumerate(items):
            x, y = (i % cols) * cell, (i // cols) * (cell + 16)
            if tile:
                t = Image.new('RGB', (1024, 1024)); [t.paste(im, (a, b)) for a in (0, 512) for b in (0, 512)]; im = t
            th = im.copy(); th.thumbnail((cell - 4, cell - 4)); sh.paste(th, (x + 2, y + 16)); d.text((x + 2, y + 2), k, fill=(255, 255, 0))
        sh.save(os.path.join(SHEETS, fn))
    sheet(sheet_refs, f'{name}-refs.png', 300, False)
    sheet(sheet_tex, f'{name}-tex.png', 380, True)
    n = lambda k: sum(1 for r in P['rows'] if r['kind'] == k)
    print(f"{name}: rows {len(P['rows'])}, stand-ins {len(sheet_tex)}, prompts {len(prompts)}, props {n('prop')}, refs {len(sheet_refs)}")
    return len(P['rows']), len(sheet_tex), len(prompts), n('prop')

if __name__ == '__main__':
    for n in (sys.argv[1:] or list(places.PLACES)): build(n)
