# build.py: makes the north group's texture packs from places.py: for each place its inventory.md, refs/, stand-in/
# and prompts.json. Run from anywhere:  python3 -I build.py [--sheets /tmp/dir]  (--sheets also writes contact sheets
# of the refs and of the stand-ins tiled 2 x 2, for checking by eye)
import sys, os, json
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE); sys.path.insert(0, os.path.join(HERE, '..', '..', 'tools'))
from seamless import make
from places import PLACES
from PIL import Image, ImageDraw

OUT = os.path.normpath(os.path.join(HERE, '..'))
sheets = sys.argv[sys.argv.index('--sheets') + 1] if '--sheets' in sys.argv else None
_cache = {}
def img(path):
    if path not in _cache: _cache[path] = Image.open(path).convert('RGB')
    return _cache[path]

def ref_crop(im, box, margin=0.12):
    x0, y0, x1, y1 = box; mx = max(6, (x1 - x0) * margin); my = max(6, (y1 - y0) * margin)
    c = im.crop((int(max(0, x0 - mx)), int(max(0, y0 - my)), int(min(im.width, x1 + mx)), int(min(im.height, y1 + my))))
    s = 768 / max(c.size)
    if s < 1: c = c.resize((round(c.width * s), round(c.height * s)), Image.LANCZOS)
    return c

def where(r, place):
    b = '(%d, %d, %d, %d)' % tuple(r['box'])
    if r.get('src'): b += ' in `%s`' % os.path.relpath(r['src'], '/home/claude/envoi-game')
    if r.get('stand'): b += '; stand-in cut from (%d, %d, %d, %d)' % tuple(r['stand'])
    return b

for place, P in PLACES.items():
    d = os.path.join(OUT, place); os.makedirs(os.path.join(d, 'refs'), exist_ok=True); os.makedirs(os.path.join(d, 'stand-in'), exist_ok=True)
    painting = img(P['painting'])
    prompts, refs, stands = [], [], []
    for r in P['rows']:
        im = img(r['src']) if r.get('src') else painting
        if r.get('prompt') or r['kind'] in ('prop', 'sky'):
            c = ref_crop(im, r['box']); c.save(os.path.join(d, 'refs', r['id'] + '.jpg'), quality=85); refs.append((r['id'], c))
        if r.get('stand'):
            t = make(im, r['stand'], 512, True, r.get('squash', 1.0)); t.save(os.path.join(d, 'stand-in', r['id'] + '.png')); stands.append((r['id'], t))
        if r.get('prompt'):
            p = r['prompt']
            prompts.append(dict(id=r['id'], file=r['id'] + '.png', shape=p['shape'], rules=p['rules'],
                                refs=['%s/%s.jpg' % (place, r['id']), '%s.png' % place], title=p['title'],
                                subject=p['subject'], use=p['use'], shared=r['shared']))
    # every ground and material row that is made here must have a stand-in; shared rows only listed here need none
    for r in P['rows']:
        if r['kind'] in ('ground', 'material') and r.get('prompt') and not r.get('stand'): raise SystemExit('no stand-in: ' + r['id'])
    with open(os.path.join(d, 'prompts.json'), 'w') as f: json.dump(prompts, f, indent=2, ensure_ascii=False); f.write('\n')
    L = ['# %s: texture pack inventory' % P['name'], '',
         'Painting: `%s` (1536 x 1024). Boxes are x0, y0, x1, y1 in its pixels.' % os.path.relpath(P['painting'], '/home/claude/envoi-game'), '',
         P['note'], '',
         'Rows marked shared use one texture for the whole game. "made here" means its stand-in and prompt are in this folder; '
         '"listed" means it is made in another place (see the group README).', '',
         '| id | kind | what it is | where in the painting | shared? |', '|---|---|---|---|---|']
    for r in P['rows']:
        if r['shared']: sh = 'yes, made here' if r.get('prompt') else 'yes, listed'
        else: sh = 'no'
        L.append('| %s | %s | %s | %s | %s |' % (r['id'], r['kind'], r['what'].replace('|', '/'), where(r, place), sh))
    L += ['', 'In this folder: %d stand-ins (`stand-in/`), %d prompts (`prompts.json`), %d reference crops (`refs/`).' % (len(stands), len(prompts), len(refs)), '']
    with open(os.path.join(d, 'inventory.md'), 'w') as f: f.write('\n'.join(L))
    print(place, 'rows', len(P['rows']), 'stand-ins', len(stands), 'prompts', len(prompts), 'refs', len(refs),
          'props', sum(r['kind'] == 'prop' for r in P['rows']))
    if sheets:
        os.makedirs(sheets, exist_ok=True)
        T = 220; cols = 5; rows = (len(refs) + cols - 1) // cols
        sh_ = Image.new('RGB', (cols * T, rows * (T + 14)), (30, 30, 30)); dr = ImageDraw.Draw(sh_)
        for k, (i, c) in enumerate(refs):
            c = c.copy(); c.thumbnail((T, T)); x, y = (k % cols) * T, (k // cols) * (T + 14)
            sh_.paste(c, (x, y)); dr.text((x + 2, y + T), i[:36], fill=(255, 255, 0))
        sh_.save(os.path.join(sheets, place + '-refs.jpg'), quality=85)
        if stands:
            S = 300; st = Image.new('RGB', (len(stands) * (S + 8), S + 14), (30, 30, 30)); dr = ImageDraw.Draw(st)
            for k, (i, t) in enumerate(stands):
                q = t.resize((S // 2, S // 2), Image.LANCZOS)
                for a in range(2):
                    for b in range(2): st.paste(q, (k * (S + 8) + a * S // 2, b * S // 2))
                dr.text((k * (S + 8) + 2, S), i, fill=(255, 255, 0))
            st.save(os.path.join(sheets, place + '-stands.jpg'), quality=85)
