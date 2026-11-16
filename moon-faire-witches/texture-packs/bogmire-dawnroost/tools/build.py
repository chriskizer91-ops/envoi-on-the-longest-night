# build.py: makes group bogmire-dawnroost's texture packs from places.py: for each place its refs/, stand-in/,
# inventory.md and prompts.json.  usage: python3 -I build.py [place ...]
import sys, os, json
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE); sys.path.insert(0, os.path.join(HERE, '..', '..', 'tools'))
from PIL import Image
from seamless import make
from montage import montage, even_colour
from places import PLACES

GROUP = os.path.normpath(os.path.join(HERE, '..'))
MADE_IN = {  # where each shared id this group uses is made
    'shared_boardwalk_planks': 'yes, made in Bogmire', 'shared_water_dark': 'yes, made in Bogmire',
    'shared_planks_wall': 'yes, made in Bogmire', 'shared_roof_shingle': 'yes, made in Bogmire',
    'shared_roof_thatch': 'yes, made in Bogmire', 'shared_wall_castle': 'yes, new shared id, made in Dawnroost',
    'shared_cobbles_town': 'yes, made by group wickhollow', 'shared_roof_tiles_red': 'yes, made by group wickhollow',
    'shared_awning_stripes': 'yes, made by group wickhollow',
    'shared_stone_wall_rough': 'yes, made by group wickhollow', 'shared_rock_cliff': 'yes, made by another group',
}


def shape_of(row):
    pr = row.get('prompt', {})
    if pr.get('shape'): return pr['shape']
    if row['kind'] in ('ground', 'material'): return 'Square'
    x0, y0, x1, y1 = row['box']; r = (x1 - x0) / max(1, (y1 - y0))
    return 'Wide (3:2)' if r > 1.3 else 'Tall (2:3)' if r < 0.77 else 'Square'


def ref_crop(img, box, out):
    x0, y0, x1, y1 = box; w, h = x1 - x0, y1 - y0
    m = 0.08
    b = (max(0, x0 - w * m), max(0, y0 - h * m), min(img.width, x1 + w * m), min(img.height, y1 + h * m))
    c = img.crop(tuple(round(v) for v in b))
    L = max(c.size); t = min(768, max(384, L * 3)) if L < 768 else 768
    s = t / L
    c = c.resize((max(1, round(c.width * s)), max(1, round(c.height * s))), Image.LANCZOS)
    c.save(out, quality=85)


def build(place):
    P = PLACES[place]; d = os.path.join(GROUP, place)
    os.makedirs(os.path.join(d, 'refs'), exist_ok=True); os.makedirs(os.path.join(d, 'stand-in'), exist_ok=True)
    img = Image.open(P['painting']).convert('RGB')
    prompts = []; n = dict(rows=0, stand=0, prompts=0, props=0)
    lines = [f"# {P['title']}: what a 3D build needs", '', P['note'], '',
             'Painting: `' + os.path.relpath(P['painting'], '/home/claude/envoi-game') + '` (1536 x 1024). Boxes are in its pixels unless the row says otherwise.', '',
             '| id | kind | what it is, in plain words | where in the painting (x0, y0, x1, y1) | shared? |',
             '|---|---|---|---|---|']
    for r in P['rows']:
        n['rows'] += 1
        src = r.get('src'); im = Image.open(src).convert('RGB') if src else img
        where = ', '.join(str(v) for v in r['box'])
        if src: where += ' in the fight painting `' + os.path.relpath(src, '/home/claude/envoi-game') + '`'
        if 'std' in r and r['shared'] != 'listed':
            st = r['std']
            if st[0] == 'crop' and tuple(st[1]) != tuple(r['box']): where += ' (stand-in cut from ' + ', '.join(str(v) for v in st[1]) + ')'
            elif st[0] == 'recolour': where += ' (stand-in: the wall blocks at ' + ', '.join(str(v) for v in st[1]) + ', recoloured to this stone)'
            elif st[0] == 'montage': where += ' (stand-in pieced from small clean strips of it)'
            elif st[0] == 'upright': where += ' (stand-in: the boardwalk planks turned upright, recoloured to these walls)'
        if r['shared'] == 'made': sh = MADE_IN[r['id']].replace(', made in ' + P['title'], ', made here').replace('new shared id, made in ' + P['title'], 'new shared id, made here')
        elif r['shared'] == 'listed': sh = MADE_IN[r['id']]
        else: sh = r.get('where_note', 'no')
        lines.append(f"| `{r['id']}` | {r['kind']} | {r['what']} | {where} | {sh} |")
        if r['shared'] == 'listed' or r.get('skip_ref'): continue
        if 'prompt' in r or r['kind'] in ('prop', 'sky'):
            ref_crop(im, r.get('ref', r['box']), os.path.join(d, 'refs', r['id'] + '.jpg'))
        if r['kind'] == 'prop': n['props'] += 1
        if 'std' in r:
            s = r['std']
            if s[0] == 'crop':
                out = make(im, s[1], size=512, squash=s[2])
            elif s[0] == 'recolour':
                import numpy as np
                base = make(im, s[1], size=512, squash=s[2])
                samp = np.concatenate([np.asarray(im.crop(b), dtype=np.float32).reshape(-1, 3) for b in s[3]])
                a = np.asarray(base, dtype=np.float32).reshape(-1, 3)
                a = (a - a.mean(0)) + samp.mean(0) * 0.85
                out = Image.fromarray(np.clip(a.reshape(512, 512, 3), 0, 255).astype(np.uint8))
            elif s[0] == 'upright':
                import numpy as np
                src_t = Image.open(os.path.join(d, 'stand-in', s[1] + '.png')).convert('RGB').rotate(90)
                samp = np.concatenate([np.asarray(im.crop(b), dtype=np.float32).reshape(-1, 3) for b in s[2]])
                a = np.asarray(src_t, dtype=np.float32).reshape(-1, 3)
                a = (a - a.mean(0)) / (a.std(0) + 1e-3) * samp.std(0) * 0.9 + samp.mean(0)
                out = Image.fromarray(np.clip(a.reshape(512, 512, 3), 0, 255).astype(np.uint8))
            else:
                _, rows, rh, sq, mir, sig = s
                m = even_colour(montage(im, rows, rh, sq, mir), sig)
                out = make(m, (0, 0, m.width, m.height), size=512)
            out.save(os.path.join(d, 'stand-in', r['id'] + '.png')); n['stand'] += 1
        if 'prompt' in r:
            pr = r['prompt']
            prompts.append(dict(id=r['id'], file=r['id'] + '.png', shape=shape_of(r), rules=pr.get('rules', r['kind'] if r['kind'] in ('ground', 'material', 'skin', 'roof', 'plant') else 'skin'),
                                refs=[f"{place}/{r['id']}.jpg", f"{place}.png"], title=pr['title'], subject=pr['subject'], use=pr['use'],
                                shared=r['shared'] == 'made'))
            n['prompts'] += 1
    lines += ['', f"{n['rows']} rows: {n['stand']} stand-ins, {len(prompts)} prompts, {n['props']} props.", '']
    open(os.path.join(d, 'inventory.md'), 'w').write('\n'.join(lines))
    json.dump(prompts, open(os.path.join(d, 'prompts.json'), 'w'), indent=1, ensure_ascii=False)
    print(place, n)
    return n


if __name__ == '__main__':
    for p in (sys.argv[1:] or list(PLACES)): build(p)
