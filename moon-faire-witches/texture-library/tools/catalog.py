import json,os,re,collections
import numpy as np
from PIL import Image
pick=json.load(open('pick.json')); rows=json.load(open('all_images.json'))
where=collections.defaultdict(set)
for r in rows: where[r['sha']].add((r['repo'],r['branch'],r['path']))
PACKS=[ # (name, game, style, repo, prefix, note)
 ('moon-faire-openworld','Moon Faire: the open world','Painted (same style as Envoi)','moon-faire','game/openworld/round','The 56 pictures Chris made in ChatGPT from 52 prompts, in rounds.'),
 ('moon-faire-openworld-game','Moon Faire: the open world, game copies','Painted (same style as Envoi)','moon-faire','game/openworld/data/','Smaller copies the game loads, plus atlases and its painted views.'),
 ('iron-howl','Iron Howl 3: yard, docks and fields','Photo-like, with bump maps','iron-howler-4','game/art/','Also in HYPERDOT-ARCADE (the arcade copy).'),
 ('last-road','Last Road: the outback','Photo-like','last-road','models/textures/',''),
 ('mud-lab','Mud Lab','Photo-like','mud-lab','base/textures/','Same bog grass as Last Road H08.'),
 ('molten','Molten (arcade): forge and frost','Photo-like','HYPERDOT-ARCADE','v2/src/molten3d/art/',''),
 ('claw-fabrics','Claw machine (arcade): plush fabrics','Photo-like','HYPERDOT-ARCADE','v2/src/claw3d/art/fabric/',''),
 ('rc-dirt','Back room RC track (arcade)','Photo-like','HYPERDOT-ARCADE','backroom/art/rc/','Also in the back-room repo.'),
 ('creature-catch-tiles','Creature Catch: cosy 3D tiles','Cartoon','atoms-games-','creature-catch-model-sheets/chapter1/game/assets/tiles/',''),
 ('creature-catch-pixel','Creature Catch: pixel tile sets','Pixel art (2D)','atoms-games-','creature-catch/art/tiles/','Top-down 2D tile sheets, not 3D textures.'),
 ('rut-access','Rut Access: off-road ground','Photo-like','cargames','rut-access/textures/',''),
 ('brightvein-claim','Brightvein: the claim','Lightly painted','brightvein','assets/claim/',''),
 ('farm-paper','Farm: paper cut-outs','Paper cut-out','farm-project','art-farm/assets/paper/',''),
]
def kind(name,pack):
    n=name.lower()
    if pack=='creature-catch-pixel': return 'Tile sets (2D)'
    if re.search(r'-n\.webp$',n): return 'Bump maps'
    if re.search(r'atlas|paint_w|macro|kit_|tent_skin|tent_wrap|hero|things|cutouts|trees\.webp',n): return 'Sheets and paintings'
    if re.search(r'sky|moon\.png|fog|explosion|smoke|muzzle|spark|scorch|impact|lens|steam|hills',n): return 'Sky and effects'
    if re.search(r'sign|decal|emblem|label|neon|billboard|pickup|footprint|marking|hazard',n): return 'Signs and decals'
    if re.search(r'^skin_|door|window|clock|books|cube_vault|healing|herb_shelf|lamp_glass|mailbox|notice|piano|stove|barrel_top|hay_bale_end|crate|container|roller|fence-|grey-tin|red-boards|weathered-wood|white-siding|tin\.webp|stone-ring',n): return 'Objects (flat views)'
    if re.search(r'plant_|^fern|^herb\.|^meadow\.|^reed|leaves|bracken|gorse',n): return 'Plants'
    if re.search(r'roof|shingle|slate',n): return 'Roofs'
    if re.search(r'cloth|canvas|wool|felt|fur|minky|satin|sherpa|velvet|awning|stripe|damask|trim|quilt|rug|doormat|checker',n): return 'Cloth'
    if re.search(r'water|ice|snow|frost|rime|ripples|crystal|salt|playa',n): return 'Water, ice and snow'
    if re.search(r'metal|steel|iron|brass|copper|armour|gunmetal|plate|grating|grille|chain|truss|innards|panel|hex|rubber|hammered|corrugat|^b03|^h05',n): return 'Metal'
    if re.search(r'wood|plank|board|bark|oak|straw|hay|wheat|^b13|^h06',n): return 'Wood, straw and bark'
    if re.search(r'wall|brick|stone|rubble|rock|cobble|paving|concrete|asphalt|basalt|obsidian|columns|strata|craze|limestone|dressed|plaster|cream|facade|blast|quay|hull|^c\d|^b09',n): return 'Stone and walls'
    return 'Ground'
lib=[]
for p in pick:
    pk=next((k for k in PACKS if p['repo']==k[3] and p['path'].startswith(k[4])),None)
    f='lib/%s/%s'%(p['repo'],p['path']); name=os.path.basename(p['path'])
    im=Image.open(f); w,h=im.size
    a=np.asarray(im.convert('RGB').resize((256,int(256*h/w)) if w>256 else (w,h))).astype(float)
    cd=np.abs(np.diff(a,axis=1)).mean(axis=(0,2)); rd=np.abs(np.diff(a,axis=0)).mean(axis=(1,2))
    lr=np.abs(a[:,0]-a[:,-1]).mean(); tb=np.abs(a[0]-a[-1]).mean()
    seam=bool((lr<=2.5*cd.mean() or lr<=1.15*np.percentile(cd,99)) and (tb<=2.5*rd.mean() or tb<=1.15*np.percentile(rd,99)))
    br=sorted({b for (r,b,pa) in where[p['sha']] if r==p['repo'] and pa==p['path']})
    copies=sorted({'%s/%s'%(r,pa) for (r,b,pa) in where[p['sha']] if not (r==p['repo'] and pa==p['path'])})
    k=kind(name,pk[0])
    lib.append(dict(pack=pk[0],game=pk[1],style=pk[2],repo=p['repo'],path=p['path'],branches=br,size='%dx%d'%(w,h),kind=k,kb=os.path.getsize(f)//1024,copies=copies[:6],copies_n=len(copies)))
json.dump(dict(packs=[dict(id=k[0],game=k[1],style=k[2],repo=k[3],folder=k[4],note=k[5]) for k in PACKS],textures=lib),open('library.json','w'),indent=1)
c=collections.Counter(x['kind'] for x in lib); print(c)
print(collections.Counter(x['pack'] for x in lib))
