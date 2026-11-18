"""The texture library page for Chris: one HTML file, every picture inside it.

Run:  python3 -I build_page.py   (needs lib/, cards.json, library.json, matches.py, grade.py)
Writes out/envoi-texture-library.html and out/envoi-texture-library-made.zip
"""
import base64, collections, html, io, json, os, sys, zipfile
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image
from matches import M
from grade import grade

E = html.escape
P = json.load(open('cards.json'))
LIB = json.load(open('library.json'))
ROT = {'shared_boardwalk_planks', 'shared_planks_wall'}
SURF = ('ground', 'material', 'roof')

def jpg(im, t, q=78):
    im = im.convert('RGB').copy(); im.thumbnail((t, t))
    b = io.BytesIO(); im.save(b, 'JPEG', quality=q, optimize=True)
    return 'data:image/jpeg;base64,' + base64.b64encode(b.getvalue()).decode()

GAME = {'moon-faire': 'Moon Faire', 'iron-howler-4': 'Iron Howl 3', 'HYPERDOT-ARCADE': 'Hyperdot Arcade (Molten)',
        'last-road': 'Last Road', 'atoms-games-': 'Creature Catch', 'brightvein': 'Brightvein'}
NOTE = {  # what differs, in plain words (only where it helps)
 'shared_drystone': 'Moon Faire\'s wall is wide (3:2), as it was made: the 3D sets how often it repeats.',
 'shared_boardwalk_planks': 'Turned on its side so the planks run left to right, as the card asks.',
 'shared_planks_wall': 'Turned on its side so the boards stand upright, as the card asks.',
 'thorn_dead_tree': 'Square, not tall: the tree leans like a windswept thorn.',
 'nightsq_lamp_post': 'Iron post with a curled bracket and a hanging lantern, as in the painting.',
 'shared_dirt_track': 'Plain earth: the card also wants flat stones sunk in it.',
 'bog_reeds': 'A row of reeds, not one clump.', 'wilds_reeds': 'A row of reeds, not one clump.',
 'lake_reeds': 'No cattails.', 'reeds_cattails': 'No cattails or frost.', 'bogmire_reeds': 'No feathery plumes.',
 'wilds_iron_lantern_post': 'An iron post: the card wants a wooden one with an arm.',
 'lamp_post_iron': 'Lantern hangs from a bracket: the card has it on top.',
 'lantern_post': 'An iron post: the card wants a wooden one.',
 'wilds_oak_leaves': 'Small leaves: the card wants big oak leaves.',
 'wilds_gorse': 'A patch to repeat, not one bush.', 'moor_gorse_bush': 'A patch to repeat, not one bush.',
 'eldergrove_bracken': 'A patch to repeat, not one clump.', 'bracken_dead': 'A patch to repeat, not one clump.',
 'camp_crate': 'Several crates and barrels in one picture: one would be cut out.',
 'supply_crate': 'Several crates and barrels in one picture: one would be cut out.',
 'covered_wagon': 'Moon Faire\'s painted fair wagon, not a plain canvas one.',
 'yard_well': 'Close: the card has a windlass instead of a lantern.',
 'crossroads_well': 'Close: the card\'s well has a gallows post.',
 'herb_stall_front': 'Moon Faire\'s herb stall: the card\'s awning is blue-green.',
 'wick_stall_nettie': 'The card\'s awning is red and cream stripes, heaped with food.',
 'trader_stall_front': 'The card\'s awning is mauve, with barrels and crates.',
 'shared_moon': 'Only 128 pixels across: too small to use as it is.',
 'shared_roof_thatch': 'Dry golden straw: the card wants damp mossy thatch.',
 'tent_canvas': 'Cream cloth: the card is a little greyer.',
 'node_court_cobbles': 'Round cobbles: the card wants squarish setts.',
}

# ---------- the matches ----------
cards = []
made = {}
for c in P:
    if c['id'] not in M: continue
    fit, fs = M[c['id']]
    src = Image.open('lib/' + fs[0]).convert('RGB')
    if c['id'] in ROT: src = src.transpose(Image.ROTATE_90)
    ref = Image.open(c['stand'] or c['crops'][0]).convert('RGB')
    cut = c['rules'] not in SURF
    g = grade(src, ref, strength=0.85 if cut else 1.0, cutout=cut)
    if fit == 'use': made[c['file']] = g
    repo = fs[0].split('/')[0]
    cards.append(dict(id=c['id'], file=c['file'], title=c['title'], place=c['place'], round=c['round'], rules=c['rules'], fit=fit,
                      surf=c['rules'] in SURF, game=GAME[repo], src=fs[0], extra=fs[1:], note=NOTE.get(c['id'], ''),
                      envoi=jpg(ref, 240), asis=jpg(src, 240), ours=jpg(g, 240)))
print('cards', len(cards), collections.Counter(x['fit'] for x in cards))

# ---------- the zip: ready textures under the cards' file names ----------
os.makedirs('out', exist_ok=True)
zpath = 'out/envoi-texture-library-made.zip'
with zipfile.ZipFile(zpath, 'w', zipfile.ZIP_STORED) as z:
    for f, im in sorted(made.items()):
        b = io.BytesIO(); im.save(b, 'PNG', optimize=True); z.writestr('made/' + f, b.getvalue())
    z.writestr('README.txt', 'Ready textures for the 3D Envoi, from Moon Faire\'s open world, shifted into Envoi\'s night colours.\n'
               'Each is saved under its card\'s file name. Bring the made folder to the hub with round 1,\n'
               'and skip these cards on the prompts page.\n\n' + '\n'.join(
                   '%s  <-  moon-faire: %s' % (x['file'], x['src'].split('moon-faire/')[1]) for x in cards if x['fit'] == 'use'))

# ---------- time saved, from the board's estimates ----------
MIN = {1: 60 / 53, 2: 60 / 77, 3: 300 / 235}
use = [x for x in cards if x['fit'] == 'use']
saved = sum(MIN[x['round']] for x in use)
by_round = collections.Counter(x['round'] for x in use)

# ---------- the library ----------
KINDS = ['Ground', 'Stone and walls', 'Wood, straw and bark', 'Roofs', 'Cloth', 'Water, ice and snow', 'Plants', 'Metal',
         'Objects (flat views)', 'Signs and decals', 'Sky and effects', 'Sheets and paintings', 'Tile sets (2D)', 'Bump maps']
packs = {p['id']: p for p in LIB['packs']}
tex = LIB['textures']
pcount = collections.Counter(t['pack'] for t in tex)
lib_items = []
for t in tex:
    lib_items.append(dict(k=KINDS.index(t['kind']), p=t['pack'], n=os.path.splitext(os.path.basename(t['path']))[0], s=t['size'],
                          r=t['repo'], path=t['path'], c=t['copies_n'], i=jpg(Image.open('lib/%s/%s' % (t['repo'], t['path'])), 120, 72)))
lib_items.sort(key=lambda x: (x['k'], list(packs).index(x['p']), x['n']))
n_games = len({p['game'].split(':')[0].split(' (')[0] for p in LIB['packs']})

def card_html(x, big):
    lab = '<div class="lab"><b>%s</b><span>%s · round %d</span></div>' % (E(x['title']), E(x['place'].replace('-', ' ')), x['round'])
    imgs = ('<figure><img src="%s" data-t="%d" alt=""><figcaption>Envoi now</figcaption></figure>' % (x['envoi'], x['surf']) +
            '<figure><img src="%s" data-t="%d" alt=""><figcaption>%s</figcaption></figure>' % (x['asis'], x['surf'], E(x['game'])) +
            '<figure><img src="%s" data-t="%d" alt=""><figcaption>In Envoi\'s colours</figcaption></figure>' % (x['ours'], x['surf']))
    note = '<p class="note">%s</p>' % E(x['note']) if x['note'] else ''
    fn = '<p class="fn">Saved as <code>%s</code></p>' % E(x['file']) if big else ''
    return '<article class="card">%s<div class="row">%s</div>%s%s</article>' % (lab, imgs, note, fn)

ready = ''.join(card_html(x, True) for x in sorted(use, key=lambda x: (x['round'], x['title'])))
close = [x for x in cards if x['fit'] == 'close']
close_by = collections.OrderedDict()
for x in sorted(close, key=lambda x: (x['game'] != 'Moon Faire', x['round'], x['title'])):
    close_by.setdefault('From Moon Faire' if x['game'] == 'Moon Faire' else 'From your other games', []).append(x)
head = ''.join('<h3>%s <small>%d</small></h3>%s' % (k, len(v), ''.join(card_html(x, False) for x in v)) for k, v in close_by.items())

pack_rows = ''.join('<li><b>%s</b><span>%s · %d</span><code>%s/%s</code></li>' % (
    E(p['game']), E(p['style']), pcount[p['id']], E(p['repo']), E(p['folder'].rstrip('/'))) for p in LIB['packs'])
chips = '<button class="chip on" data-k="-1">All</button>' + ''.join(
    '<button class="chip" data-k="%d">%s</button>' % (i, E(k)) for i, k in enumerate(KINDS) if any(x['k'] == i for x in lib_items))
LJS = json.dumps([[x['k'], x['p'], x['n'], x['s'], x['i']] for x in lib_items], separators=(',', ':'))
PJS = json.dumps({k: v['game'] for k, v in packs.items()})
copies = sum(1 for t in tex if t['copies_n'])
n_moon_close = len(close_by.get('From Moon Faire', [])); n_other_close = len(close_by.get('From your other games', []))

page = r'''<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Your texture packs, for the 3D Envoi</title>
<style>
:root{--bg:#0d1020;--card:#161a30;--line:#262b4a;--ink:#e7e5f2;--mute:#9a9cb8;--moon:#cfd3ff;--lamp:#f2b25c}
*{box-sizing:border-box}html,body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
header{padding:22px 18px 6px}h1{font-size:22px;margin:0 0 4px;font-weight:650;letter-spacing:.2px}
header p{margin:0;color:var(--mute);font-size:14px}
.nums{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:14px 18px 4px}
.num{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:10px 8px;text-align:center}
.num b{display:block;font-size:24px;color:var(--moon);font-weight:650}.num span{font-size:12px;color:var(--mute)}
.num.lamp b{color:var(--lamp)}
nav{position:sticky;top:0;z-index:5;display:flex;gap:6px;padding:10px 18px;background:rgba(13,16,32,.94);backdrop-filter:blur(6px);border-bottom:1px solid var(--line);overflow-x:auto}
nav button{flex:none;background:none;border:1px solid var(--line);color:var(--mute);border-radius:999px;padding:7px 14px;font-size:14px}
nav button.on{background:var(--moon);border-color:var(--moon);color:#141733;font-weight:600}
main{padding:12px 14px 60px;max-width:760px;margin:0 auto}section{display:none}section.on{display:block}
.lead{color:var(--mute);font-size:14px;margin:4px 4px 14px}
.card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:12px;margin:0 0 12px}
.lab b{display:block;font-size:16px;font-weight:600}.lab span{font-size:12px;color:var(--mute);text-transform:capitalize}
.row{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:10px}
figure{margin:0}figure img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px;display:block;background:#222}
figcaption{font-size:11px;color:var(--mute);margin-top:4px;text-align:center}
.note{font-size:13px;color:var(--mute);margin:8px 2px 0}.fn{font-size:12px;color:var(--mute);margin:6px 2px 0}
code{font:12px ui-monospace,Menlo,monospace;color:var(--moon);word-break:break-all}
h3{font-size:15px;margin:18px 4px 10px;color:var(--moon);font-weight:600}h3 small{color:var(--mute);font-weight:400}
.packs{list-style:none;padding:0;margin:0 0 14px}.packs li{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:9px 12px;margin:0 0 6px}
.packs b{display:block;font-size:14px;font-weight:600}.packs span{display:block;font-size:12px;color:var(--mute)}
.chips{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 12px}.chip{background:none;border:1px solid var(--line);color:var(--mute);border-radius:999px;padding:5px 11px;font-size:13px}
.chip.on{border-color:var(--lamp);color:var(--lamp)}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.grid div{font-size:11px;color:var(--mute);line-height:1.25;overflow:hidden}
.grid img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px;display:block;background:#222}.grid i{display:block;font-style:normal;color:#6f7194}
details{margin:0 0 14px}summary{color:var(--moon);font-size:14px;padding:6px 4px;cursor:pointer}details ul{margin-top:8px}
ol.steps{padding-left:22px;margin:4px 0 16px}ol.steps li{margin:0 0 10px}
.box{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px 16px;margin:0 0 12px;font-size:15px}
.box p{margin:0 0 8px}.box p:last-child{margin:0}
#lb{position:fixed;inset:0;background:rgba(5,6,14,.96);display:none;z-index:9;flex-direction:column;align-items:center;justify-content:center;padding:16px}
#lb.on{display:flex}#lb .pic{width:min(92vw,560px);aspect-ratio:1;border-radius:10px;background-repeat:repeat;background-color:#222}
#lb p{color:var(--mute);font-size:13px;margin:12px 0 0;text-align:center}
@media(min-width:700px){.grid{grid-template-columns:repeat(5,1fr)}}
</style></head><body>
<header><h1>Your texture packs, for the 3D Envoi</h1>
<p>Every texture pack in your repos, sorted, and what it can do for the textures Envoi still needs.</p></header>
<div class="nums">
<div class="num"><b>%(ntex)d</b><span>textures in %(npacks)d packs, %(nrepos)d repos</span></div>
<div class="num lamp"><b>%(nuse)d</b><span>Envoi cards ready now</span></div>
<div class="num"><b>%(nclose)d</b><span>more with a head start</span></div>
</div>
<nav><button class="on" data-s="ready">Ready</button><button data-s="head">Head start</button><button data-s="lib">Library</button><button data-s="how">What to do</button></nav>
<main>
<section id="ready" class="on">
<p class="lead">Moon Faire's open-world textures are painted in the same style and with the same prompt rules as Envoi's cards. These %(nuse)d show the same thing a card asks for. The right-hand picture is Moon Faire's texture shifted into the colours of Envoi's painting. Tap any picture to see it bigger; surfaces show 3 × 3, so you can check the seams.</p>
%(ready)s
</section>
<section id="head">
<p class="lead">The right subject, but something is different: a row of reeds instead of one clump, a photo look instead of a painted one, or the wrong colour of awning. Attach one with the card's prompt as an extra picture, or use it as a sharper stand-in until yours is made.</p>
%(head)s
</section>
<section id="lib">
<p class="lead">%(ntex)d pictures from %(npacks)d packs. %(copies)d of them also sit somewhere else (another repo, or a second folder): worth knowing when you tidy up.</p>
<details><summary>The %(npacks)d packs, and where they live</summary><ul class="packs">%(packrows)s</ul></details>
<div class="chips">%(chips)s</div>
<div class="grid" id="grid"></div>
</section>
<section id="how">
<div class="box"><p><b>1. Look through Ready.</b> If you like a texture in Envoi's colours, keep it. If not, make that card in ChatGPT as planned.</p>
<p><b>2. Save the zip</b> (<code>envoi-texture-library-made.zip</code>). Its <code>made</code> folder has all %(nuse)d, each under its card's file name.</p>
<p><b>3. Bring the made folder to the hub with your round 1</b>, and skip those cards on the prompts page.</p></div>
<div class="box"><p><b>Time it saves:</b> %(r1)d cards from round 1, %(r2)d from round 2 and %(r3)d from round 3: about %(saved)d minutes of the 7 hours.</p>
<p><b>The bigger win:</b> the town's cobbles, walls, roofs and moor come from Moon Faire's own open world, so the witches' two games look like one world.</p></div>
<div class="box"><p><b>Found on the way:</b> two different round 3 cards would both be saved as <code>crossroads_crossroads_well.png</code> (the walking map's well and the fight place's well), so one picture would replace the other. The hub can fix the name before round 3.</p></div>
</section>
</main>
<div id="lb"><div class="pic"></div><p></p></div>
<script>
const L=%(ljs)s, PK=%(pjs)s, K=%(kinds)s;
const grid=document.getElementById('grid');
function show(k){grid.innerHTML=L.filter(x=>k<0||x[0]==k).map(x=>'<div><img loading="lazy" src="'+x[4]+'" data-t="'+(x[0]<6?1:0)+'" alt="">'+x[2]+'<i>'+PK[x[1]].split(':')[0]+' · '+x[3]+'</i></div>').join('')}
show(-1);
document.querySelectorAll('.chip').forEach(b=>b.onclick=()=>{document.querySelectorAll('.chip').forEach(c=>c.classList.remove('on'));b.classList.add('on');show(+b.dataset.k)});
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>{document.querySelectorAll('nav button,section').forEach(e=>e.classList.remove('on'));b.classList.add('on');document.getElementById(b.dataset.s).classList.add('on');window.scrollTo(0,0)});
const lb=document.getElementById('lb'),pic=lb.querySelector('.pic'),cap=lb.querySelector('p');
document.addEventListener('click',e=>{const im=e.target.closest('img');if(im&&!lb.contains(im)){const t=im.dataset.t=='1';
pic.style.backgroundImage='url('+im.src+')';pic.style.backgroundSize=t?'33.334%% 33.334%%':'contain';pic.style.backgroundRepeat=t?'repeat':'no-repeat';pic.style.backgroundPosition='center';
cap.textContent=t?'Repeated 3 × 3 to show the seams. Tap to close.':'Tap to close.';lb.classList.add('on')}else if(lb.contains(e.target))lb.classList.remove('on')});
</script></body></html>'''
import re as _re
_V = dict(
    ntex=len(tex), npacks=len(LIB['packs']), nrepos=len({t['repo'] for t in tex}), nuse=len(use), nclose=len(close),
    ready=ready, head=head, packrows=pack_rows, chips=chips, ljs=LJS, pjs=PJS, kinds=json.dumps(KINDS), copies=copies,
    r1=by_round[1], r2=by_round[2], r3=by_round[3], saved=round(saved))
page = _re.sub(r'%\((\w+)\)[sd]', lambda m: str(_V[m.group(1)]), page).replace('%%', '%')
open('out/envoi-texture-library.html', 'w', encoding='utf-8').write(page)
json.dump([{k: v for k, v in x.items() if k not in ('envoi', 'asis', 'ours')} for x in cards], open('out/matches.json', 'w'), indent=1)
print('page KB', len(page) // 1024, 'zip MB', os.path.getsize(zpath) // 2**20, 'saved min', round(saved, 1), dict(by_round))
