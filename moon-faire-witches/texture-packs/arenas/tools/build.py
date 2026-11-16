# build.py: makes the arenas packs from data.py: refs, stand-ins, backdrops, inventory.md and prompts.json per place,
# and a review sheet per place in /tmp/ar/review/ (every stand-in tiled 2 x 2 next to itself at full size).
# usage: python3 -I build.py [place ...]
import os, sys, json
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE); sys.path.insert(0, os.path.join(HERE, '..', '..', 'tools'))
from PIL import Image, ImageDraw
from seamless import make
from data import PLACES

ROOT = os.path.join(HERE, '..')
REVIEW = '/tmp/ar/review'; os.makedirs(REVIEW, exist_ok=True)
_cache = {}
def img(p):
    if p not in _cache: _cache[p] = Image.open(p).convert('RGB')
    return _cache[p]

def save_ref(im, box, out):
    c = im.crop(tuple(box)); s = min(1.0, 768 / max(c.size))
    if s < 1: c = c.resize((round(c.width * s), round(c.height * s)), Image.LANCZOS)
    c.save(out, quality=85)

def build(place):
    P = PLACES[place]; d = os.path.join(ROOT, place)
    for sub in ('refs', 'stand-in', 'backdrop'): os.makedirs(os.path.join(d, sub), exist_ok=True)
    paint = img(P['painting']); prompts = []; rows = []; tiles = []
    n = dict(rows=0, stand=0, prompts=0, props=0, backdrops=0)
    for r in P['rows']:
        n['rows'] += 1
        made = not r.get('list')
        src = img(r['src']) if r.get('src') else paint
        refbox = r.get('ref', r['box'])
        if made and (r.get('p') or r['kind'] in ('prop', 'sky')):
            # a ref crop always comes from the place's own painting (a walking map only gives a stand-in)
            save_ref(paint, refbox, os.path.join(d, 'refs', r['id'] + '.jpg'))
        if r['kind'] == 'prop': n['props'] += 1
        if made and r.get('backdrop'):
            paint.crop(tuple(r['box'])).save(os.path.join(d, 'backdrop', r['id'] + '.jpg'), quality=88); n['backdrops'] += 1
        if made and r.get('stand'):
            t = make(src, r['stand'], squash=r.get('sq', 1.0)); t.save(os.path.join(d, 'stand-in', r['id'] + '.png')); n['stand'] += 1
            tiles.append((r['id'], t))
        if made and r.get('p'):
            p = r['p']; n['prompts'] += 1
            prompts.append(dict(id=r['id'], file=r['id'] + '.png', shape=p['shape'], rules=p['rules'],
                                refs=[f"{place}/{r['id']}.jpg", f"{place}.png"], title=p['title'], subject=p['subject'],
                                use=p['use'], shared=bool(r['shared'])))
        x0, y0, x1, y1 = r['box']
        made_note = []
        if made and r.get('stand'): made_note.append('stand-in')
        if made and r.get('p'): made_note.append('prompt')
        if made and r.get('backdrop'): made_note.append('backdrop')
        if r.get('list'): sh = 'yes (listed only: made elsewhere)'
        elif r['shared']: sh = 'yes (made here)'
        else: sh = 'no'
        what = r['what'].replace('|', '/') + (f" [here: {', '.join(made_note)}]" if made_note else '')
        rows.append(f"| `{r['id']}` | {r['kind']} | {what} | {x0}, {y0}, {x1}, {y1} | {sh} |")
    rel = os.path.relpath(P['painting'], '/home/claude/envoi-game')
    md = [f"# {place}: texture pack", "", P['note'], "",
          f"Painting: `{rel}` (1448 x 1086); in the prompts it is called `{place}.png`.",
          "Boxes are x0, y0, x1, y1 in that painting's pixels. Ground stand-ins are cut from the nearest ground with a strong squash (the painting is side-on), unless the row says they come from a walking map. `backdrop/` holds the far-land slices at full width.",
          "", "| id | kind | what it is, in plain words | where in the painting | shared? |", "|---|---|---|---|---|"] + rows + [""]
    open(os.path.join(d, 'inventory.md'), 'w').write("\n".join(md))
    json.dump(prompts, open(os.path.join(d, 'prompts.json'), 'w'), indent=2, ensure_ascii=False)
    if tiles:
        W = 300; sheet = Image.new('RGB', (W * 2 * min(3, len(tiles)), (W + 14) * ((len(tiles) + 2) // 3)), (40, 0, 0)); dr = ImageDraw.Draw(sheet)
        for i, (tid, t) in enumerate(tiles):
            q = t.resize((W // 2, W // 2)); tt = Image.new('RGB', (W, W))
            for a in range(2):
                for b in range(2): tt.paste(q, (a * W // 2, b * W // 2))
            x = (i % 3) * W * 2; y = (i // 3) * (W + 14)
            sheet.paste(tt, (x, y + 14)); sheet.paste(t.resize((W, W)), (x + W, y + 14)); dr.text((x + 2, y + 1), tid, fill=(255, 255, 0))
        sheet.save(os.path.join(REVIEW, place + '-stand.jpg'), quality=85)
    return n

if __name__ == '__main__':
    places = sys.argv[1:] or list(PLACES)
    tot = {}
    for pl in places:
        n = build(pl); print(pl, n)
        for k, v in n.items(): tot[k] = tot.get(k, 0) + v
    print('total', tot)
