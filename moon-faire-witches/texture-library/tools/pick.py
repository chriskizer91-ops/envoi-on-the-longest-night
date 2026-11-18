import json,collections,os,re
rows=json.load(open('all_images.json'))
SETS=[
 ('moon-faire','game/openworld/',None),
 ('last-road','models/textures/',None),
 ('mud-lab','base/textures/',None),
 ('iron-howler-4','game/art/',r'^game/art/[^/]+$'),
 ('HYPERDOT-ARCADE','v2/src/molten3d/art/',r'/(?!back|card_|fx_)[^/]+$'),
 ('HYPERDOT-ARCADE','v2/src/claw3d/art/fabric/',None),
 ('HYPERDOT-ARCADE','backroom/art/rc/',None),
 ('atoms-games-','creature-catch-model-sheets/chapter1/game/assets/tiles/',None),
 ('atoms-games-','creature-catch/art/tiles/',None),
 ('cargames','rut-access/textures/',None),
 ('brightvein','assets/claim/',None),
 ('farm-project','art-farm/assets/paper/',None),
]
by=collections.defaultdict(collections.Counter)
for r in rows:
    for repo,pre,rx in SETS:
        if r['repo']==repo and r['path'].startswith(pre) and (rx is None or re.search(rx,r['path'])):
            by[(repo,r['path'])][r['sha']]+=1
pick=[dict(repo=k[0],path=k[1],sha=c.most_common(1)[0][0],versions=len(c)) for k,c in sorted(by.items())]
json.dump(pick,open('pick.json','w'),indent=0)
print(len(pick)); print(collections.Counter(p['repo'] for p in pick))
