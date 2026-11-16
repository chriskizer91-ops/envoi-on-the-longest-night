# build_prompts.py: one page holding every prompt of Envoi's 3D texture packs (the seven groups' prompts.json), each with its
# reference pictures and its stand-in, and a zip of every reference picture, painting and stand-in to attach.
# After Moon Faire's own page (game/openworld/prompts/build_prompts.py on moon-faire's `open` branch): its prompt rules, as
# they are, with the dusk light left out (Envoi's places are at night) and a rule for plants added.
# usage: python3 -I moon-faire-witches/texture-packs/tools/build_prompts.py [out dir]   (default: dist/ at the repo's root)
import os, io, sys, json, glob, base64, zipfile, html
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); PACKS = os.path.dirname(HERE); REPO = os.path.abspath(os.path.join(PACKS, '..', '..'))
OUT = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else os.path.join(REPO, 'dist')
os.makedirs(OUT, exist_ok=True)

END = "- No text, no letters, no border and no signature."
GROUND = """Paint a square ground texture for a hand-painted fantasy game, in the same painterly style, brushwork and colours as the attached painting.
- Seen from straight above (top-down). No horizon, no sky and no perspective.
- Seamless: the left edge must continue into the right edge, and the top edge into the bottom edge, so the square can repeat without a visible join.
- Even, flat light. No lamp glow, no bright patch, no vignette and no cast shadows. The game adds its own light.
- No objects: no stones big enough to stand out, no bushes, no paths, no people and no animals.
- Even spread: nothing noticeably bigger, brighter or darker than the rest, because the square repeats hundreds of times.
""" + END
MATERIAL = """Paint a square, seamless material texture for a hand-painted fantasy game, in the same painterly style, brushwork and colours as the attached pictures.
- Seen straight on and flat, filling the whole picture edge to edge. No perspective.
- Seamless: the left edge must continue into the right edge, and the top edge into the bottom edge, so the square can repeat without a visible join.
- Even, flat light. No lamp glow, no bright patch, no vignette and no cast shadows. Only soft folds or grain.
- Only the material itself: no objects, no poles, no ropes, no ground and no sky.
- Even spread: nothing noticeably bigger, brighter or darker than the rest, because the square repeats many times.
""" + END
SKIN = """Paint one flat view of a single object for a hand-painted fantasy game, in the same painterly style, brushwork and colours as the attached pictures. Match the object in the attached close-up: the same design, colours, patterns and details.
- A flat, straight-on view with no perspective, like an architect's elevation drawing but fully painted.
- The whole object inside the picture, centred, with a small margin all round.
- Background: one plain flat mid-grey (#808080) with nothing in it. No ground, no grass, no sky, no cast shadow and no other objects.
- Even, soft light from the front. Lantern glass may glow, but no light may spill onto the background.
""" + END
ROOF = SKIN.replace("- A flat, straight-on view with no perspective, like an architect's elevation drawing but fully painted.", "- Seen from exactly straight above, with no perspective (a plan view), fully painted.").replace("- The whole object inside the picture, centred, with a small margin all round.\n", "")
PLANT = """Paint one plant for a hand-painted fantasy game, in the same painterly style, brushwork and colours as the attached pictures. Match the plant in the attached close-up: the same shape, colours and details.
- Seen from the side, whole, with the foot of its stem or trunk at the bottom of the picture.
- The whole plant inside the picture, centred, with a small margin all round.
- Background: one plain flat mid-grey (#808080) with nothing in it. No ground, no sky, no cast shadow and no other plants or objects.
- Even, soft light from the front.
""" + END
RULES = {'ground': GROUND, 'material': MATERIAL, 'skin': SKIN, 'roof': ROOF, 'plant': PLANT}

GROUPS = [('wickhollow', 'Wickhollow', 'The town square, Io\'s cottage, the jetty and the Thornwood.'),
          ('bogmire-dawnroost', 'Bogmire and Dawnroost', 'The fen town on stilts, its heart, Dawnroost and its living node.'),
          ('wilds-south', 'The southern wilds', 'The warm roads\' camp, the Ember Line road, the Dawnroost road and Eldergrove\'s edge.'),
          ('wilds-north', 'The northern wilds', 'The northern camp, the cold moor, the frozen camp and Frostmere\'s shore.'),
          ('north', 'The north', 'The northern crossroads, the shipyard, the frozen pass, Misthollow and the Moonwell.'),
          ('arenas', 'The fight places', 'The nine places the battles are fought in, painted side-on: the far land and sky are already Chris\'s paintings.'),
          ('world', 'The world from the air', 'Aethermoor seen from the Magpie, a land kilometres across.')]
ORDER = [g for g, _, _ in GROUPS]

def painting_of(group, place):
    inv = open(os.path.join(PACKS, group, place, 'inventory.md'), encoding='utf-8').read()
    for line in inv.splitlines()[:12]:
        if 'Painting: `' in line: return line.split('Painting: `')[1].split('`')[0]
        if 'night atlas (`' in line: return line.split('night atlas (`')[1].split('`')[0]
    if group == 'wilds-north': return 'reference/art/walk/wilds/walk-%s.png' % place
    raise SystemExit('no painting for ' + group + '/' + place)

# ---- every prompt, the shared ones made once (a second version's close-up is attached as well) ----
P, byid = [], {}
places = sorted(glob.glob(os.path.join(PACKS, '*', '*', 'prompts.json')), key=lambda f: (ORDER.index(f.split(os.sep)[-3]), f))
for f in places:
    group, place = f.split(os.sep)[-3], f.split(os.sep)[-2]
    for it in json.load(open(f, encoding='utf-8')):
        crops = [os.path.join(PACKS, group, place, 'refs', os.path.basename(r)) for r in it['refs'] if r.endswith('.jpg')]
        missing = [c for c in crops if not os.path.exists(c)]
        if missing: raise SystemExit('missing reference ' + ', '.join(missing))
        stand = os.path.join(PACKS, group, place, 'stand-in', it['id'] + '.png')
        c = dict(it, group=group, place=place, crops=crops, painting=painting_of(group, place), stand=stand if os.path.exists(stand) else None, also=[])
        if it['shared'] and it['id'] in byid:
            byid[it['id']]['also'].append(c); continue
        byid.setdefault(it['id'], c); P.append(c)
# a file name used twice for different things gets its place in front
names = {}
for c in P: names.setdefault(c['file'], []).append(c)
for f2, cs in names.items():
    if len(cs) > 1:
        for c in cs: c['file'] = c['place'].replace('-', '_') + '_' + c['file']
for c in P:
    c['round'] = 1 if c['shared'] else 2 if c['rules'] in ('ground', 'material') else 3

# ---- pictures: thumbnails in the page, full size in the zip ----
def jpg(im, q): b = io.BytesIO(); im.convert('RGB').save(b, 'JPEG', quality=q, optimize=True); return b.getvalue()
def uri(b, kind='jpeg'): return 'data:image/%s;base64,' % kind + base64.b64encode(b).decode()
IM, ZIP = {}, {}
def key_for(path, kind):
    k = '%s%d' % (kind, len(IM)); IM[k] = path; return k
crop_key, paint_key, stand_key = {}, {}, {}
def zname_crop(c, path): return 'references/%s/%s' % (c['place'] if c['group'] != 'arenas' else 'fight-' + c['place'], os.path.basename(path))
def zname_paint(p): return 'paintings/' + os.path.splitext(os.path.basename(p))[0] + '.jpg'
def zname_stand(c): return 'stand-ins/%s/%s.png' % (c['place'] if c['group'] != 'arenas' else 'fight-' + c['place'], c['id'])
thumbs = {}
for c in P:
    for cc in [c] + c['also']:
        for p in cc['crops']:
            if p not in crop_key:
                im = Image.open(p); t = im.copy(); t.thumbnail((360, 240)); crop_key[p] = 'c%d' % len(crop_key); thumbs[crop_key[p]] = uri(jpg(t, 76))
                ZIP[zname_crop(cc, p)] = open(p, 'rb').read()
        p = cc['painting']
        if p not in paint_key:
            im = Image.open(os.path.join(REPO, p)); t = im.copy(); t.thumbnail((360, 240)); paint_key[p] = 'p%d' % len(paint_key); thumbs[paint_key[p]] = uri(jpg(t, 76))
            big = im.copy(); big.thumbnail((2048, 2048)); ZIP[zname_paint(p)] = jpg(big, 86)
    if c['stand']:
        im = Image.open(c['stand']); t = im.copy(); t.thumbnail((112, 112)); stand_key[c['stand']] = 's%d' % len(stand_key); thumbs[stand_key[c['stand']]] = uri(jpg(t, 80))
        ZIP[zname_stand(c)] = open(c['stand'], 'rb').read()
        for a in c['also']:
            if a['stand']: ZIP['stand-ins/second-versions/%s-from-%s.png' % (c['id'], a['place'])] = open(a['stand'], 'rb').read()
zpath = os.path.join(OUT, 'Envoi_3D_Texture_References.zip')
with zipfile.ZipFile(zpath, 'w', zipfile.ZIP_STORED) as z:
    for n in sorted(ZIP): z.writestr(n, ZIP[n])

# ---- the page ----
E = html.escape
KIND = {'ground': 'Ground', 'material': 'Material', 'skin': 'Flat view', 'roof': 'Roof from above', 'plant': 'Plant'}
ROUND = {1: 'Round 1', 2: 'Round 2', 3: 'Round 3'}
PLACE_NAME = {}
for f in places:
    group, place = f.split(os.sep)[-3], f.split(os.sep)[-2]
    inv = open(os.path.join(PACKS, group, place, 'inventory.md'), encoding='utf-8').read().splitlines()[0].lstrip('# ').strip()
    PLACE_NAME[(group, place)] = inv.split(':')[0].strip() or place
def fig(k, cap, zn): return '<figure><img data-k="%s" alt=""><figcaption>%s<br><code>%s</code></figcaption></figure>' % (k, E(cap), E(zn))
def card(c):
    prompt = RULES[c['rules']] + '\n\n' + c['subject'] + '\n\nPicture shape: ' + c['shape'].lower() + '.'
    refs = ''.join(fig(crop_key[p], 'Close-up' if i == 0 else 'Another close-up', zname_crop(c, p)) for i, p in enumerate(c['crops']))
    for a in c['also']:
        refs += ''.join(fig(crop_key[p], 'Close-up from ' + PLACE_NAME[(a['group'], a['place'])], zname_crop(a, p)) for p in a['crops'])
    refs += fig(paint_key[c['painting']], 'The whole painting', zname_paint(c['painting']))
    stand = ('<div class="now"><img data-k="%s" alt=""><span>The stand-in the 3D uses until this comes back (cut from the painting)</span></div>' % stand_key[c['stand']]) if c['stand'] else ''
    where = PLACE_NAME[(c['group'], c['place'])] + (''.join(', ' + PLACE_NAME[(a['group'], a['place'])] for a in c['also']))
    return ('<article class="card" id="%s"><header><span class="code">%s</span><h3>%s</h3><span class="tag r%d">%s</span></header>'
            '<dl><dt>Save as</dt><dd><code>%s</code></dd><dt>Kind</dt><dd>%s, %s</dd><dt>Used for</dt><dd>%s</dd>%s</dl>'
            '<p class="lbl">Attach</p><div class="refs">%s</div>%s<p class="lbl">Prompt</p><pre>%s</pre><button type="button" class="copy">Copy prompt</button></article>') % (
            c['id'], E(c['id']), E(c['title']), c['round'], ROUND[c['round']], E(c['file']), KIND[c['rules']], c['shape'].lower(), E(c['use']),
            ('<dt>Made from</dt><dd>%s</dd>' % E(where)) if c['also'] else '', refs, stand, E(prompt))
rounds = {r: [c for c in P if c['round'] == r] for r in (1, 2, 3)}
check = ''.join('<div><h3>%s: %d pictures</h3><p>%s</p></div>' % (ROUND[r], len(rounds[r]), w) for r, w in (
    (1, 'The shared ones: cobbles, grass, snow, bark, planks, water and the rest that cover many places. Each is made once and used everywhere, so these change the most. Send them back before making the rest.'),
    (2, 'Each place\'s own ground and surfaces: the textures only one or two places have.'),
    (3, 'Flat views of single things (stall fronts, doors, signs), roofs from above, and plants. The 3D can stand in plain shapes for these until they come.')))
sec1 = '<section id="shared"><h2>Shared textures</h2><p class="muted">Made once, used in many places. Each card says which place\'s close-up to attach.</p>%s</section>' % ''.join(card(c) for c in rounds[1])
secs, toc = [], ['<li><a href="#shared">Shared textures</a> (%d)</li>' % len(rounds[1])]
for g, gname, gwhat in GROUPS:
    gp = [c for c in P if c['group'] == g and c['round'] > 1]
    if not gp: continue
    sub = []
    for (g2, pl), nm in PLACE_NAME.items():
        if g2 != g: continue
        cs = sorted([c for c in gp if c['place'] == pl], key=lambda c: (c['round'], c['rules']))
        if cs: sub.append('<h3 class="place" id="%s-%s">%s <span class="muted">(%d)</span></h3>%s' % (g, pl, E(nm), len(cs), ''.join(card(c) for c in cs)))
    secs.append('<section id="%s"><h2>%s</h2><p class="muted">%s</p>%s</section>' % (g, E(gname), E(gwhat), ''.join(sub)))
    toc.append('<li><a href="#%s">%s</a> (%d)</li>' % (g, E(gname), len(gp)))
TPL = open(os.path.join(HERE, 'prompts.tpl.html'), encoding='utf-8').read()
page = (TPL.replace('/*N*/', str(len(P))).replace('/*NZIP*/', str(len(ZIP))).replace('/*CHECK*/', check).replace('/*TOC*/', ''.join(toc))
        .replace('/*SETS*/', sec1 + ''.join(secs)).replace('/*IMAGES*/', json.dumps(thumbs)))
ppath = os.path.join(OUT, 'envoi-3d-texture-prompts.html')
open(ppath, 'w', encoding='utf-8').write(page)
print('prompts', len(P), {r: len(v) for r, v in rounds.items()}, 'zip files', len(ZIP), 'page', len(page) // 1024, 'KB', 'zip', os.path.getsize(zpath) // 1024, 'KB')
