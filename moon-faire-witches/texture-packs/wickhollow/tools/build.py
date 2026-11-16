# build.py: makes the wickhollow group's texture packs (refs, stand-ins, prompts.json, inventory.md) from places.py.
# usage: python3 -I build.py [place ...]      (no place = all four)
import sys, os, json
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE); sys.path.insert(0, os.path.join(HERE, '..', '..', 'tools'))
from seamless import make
from PIL import Image
import numpy as np
from places import PLACES, PAINT, SQUASH_NOTE

GROUP = os.path.dirname(HERE)
_cache = {}
def img(key):
    if key not in _cache: _cache[key] = Image.open(PAINT[key]).convert('RGB')
    return _cache[key]

def ref(row, place, out):
    src, box = row.get('refsrc', row.get('src', place)), row.get('ref', row['box'])
    c = img(src).crop(tuple(box))
    k = min(768 / max(c.size), max(1.0, 384 / max(c.size)))  # small crops are enlarged so they read, never past 768
    if abs(k - 1) > 1e-3: c = c.resize((round(c.width * k), round(c.height * k)), Image.LANCZOS)
    c.save(out, quality=85)

def stand(row, place, out):
    s = row['stand']; src = img(row.get('src', place))
    if 'angle' in s:  # turn the patch first so rows or stripes run straight
        cx, cy, side = s['centre'][0], s['centre'][1], s['side']; r = side
        big = src.crop((cx - r, cy - r, cx + r, cy + r)).rotate(s['angle'], resample=Image.BICUBIC)
        if 'period' in s:  # stripes: cut a whole number of periods wide, so the left edge meets the right
            w = s['period'] * s.get('periods', 2); h = s.get('height', w)
            p = big.crop((r - w / 2, r - h / 2, r + w / 2, r + h / 2)).resize((512, 512), Image.LANCZOS)
            t = make(p, (0, 0, 512, 512), size=512, squash=1.0)
        else:
            h = side / 2; k = s.get('squash', 1.0)
            t = make(big, (r - h, r - h / k, r + h, r + h / k), size=512, squash=k)
    else:
        t = make(src, tuple(s['box']), size=512, squash=s.get('squash', 1.0))
    t.save(out)

def where(row, place):
    src = row.get('src', place); b = row['box']
    txt = f"{b[0]}, {b[1]}, {b[2]}, {b[3]}"
    return txt if src == place else f"{txt} in {PAINT_NAME[src]}"

PAINT_NAME = {'glade': "Wickhollow's fight painting (the river glade)", 'thornfight': "the Thornwood's fight painting (the bridge)"}

def shared_txt(row):
    s = row.get('shared', False)
    if s is True: return 'yes' + ('' if row.get('made', True) else ' (listed only: ' + row.get('madein', 'made in another place') + ')')
    if s is False: return 'no'
    return s

def build(place):
    P = PLACES[place]; d = os.path.join(GROUP, place)
    os.makedirs(os.path.join(d, 'refs'), exist_ok=True); os.makedirs(os.path.join(d, 'stand-in'), exist_ok=True)
    prompts, lines = [], []
    lines += [f"# {P['name']}: texture pack inventory", '', P['note'], '',
              f"Painting: `{os.path.relpath(PAINT[place], os.path.join(GROUP, '..', '..', '..'))}` (1536 x 1024). " + SQUASH_NOTE, '',
              '| id | kind | what it is, in plain words | where in the painting (x0, y0, x1, y1) | shared? |', '|---|---|---|---|---|']
    nref = nstand = nprop = 0
    for row in P['rows']:
        made = row.get('made', True)
        lines.append(f"| `{row['id']}` | {row['kind']} | {row['what']} | {where(row, place)} | {shared_txt(row)} |")
        if not made: continue
        if row['kind'] == 'prop': nprop += 1
        if 'prompt' in row or row['kind'] in ('prop', 'sky') or row.get('ref') is not None and row['kind'] != 'light':
            ref(row, place, os.path.join(d, 'refs', row['id'] + '.jpg')); nref += 1
        if row['kind'] in ('ground', 'material'):
            stand(row, place, os.path.join(d, 'stand-in', row['id'] + '.png')); nstand += 1
        if 'prompt' in row:
            p = row['prompt']
            prompts.append({'id': row['id'], 'file': row['id'] + '.png', 'shape': p['shape'], 'rules': p.get('rules', row['kind']),
                            'refs': [f"{place}/{row['id']}.jpg", f"{place}.png"], 'title': p['title'], 'subject': p['subject'],
                            'use': p['use'], 'shared': row.get('shared', False) is True})
    with open(os.path.join(d, 'prompts.json'), 'w') as f: json.dump(prompts, f, indent=2, ensure_ascii=False); f.write('\n')
    with open(os.path.join(d, 'inventory.md'), 'w') as f: f.write('\n'.join(lines) + '\n')
    print(place, 'rows', len(P['rows']), 'refs', nref, 'stand-ins', nstand, 'prompts', len(prompts), 'props', nprop)

if __name__ == '__main__':
    for pl in (sys.argv[1:] or list(PLACES)): build(pl)
