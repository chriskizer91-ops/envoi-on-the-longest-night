import json,glob,os
PACKS='/home/claude/envoi/moon-faire-witches/texture-packs'
ORDER=['wickhollow','bogmire-dawnroost','wilds-south','wilds-north','north','arenas','world']
P,byid=[],{}
for f in sorted(glob.glob(PACKS+'/*/*/prompts.json'),key=lambda f:(ORDER.index(f.split('/')[-3]),f)):
    g,pl=f.split('/')[-3],f.split('/')[-2]
    for it in json.load(open(f)):
        stand=os.path.join(PACKS,g,pl,'stand-in',it['id']+'.png')
        crops=[os.path.join(PACKS,g,pl,'refs',os.path.basename(r)) for r in it['refs'] if r.endswith('.jpg')]
        c=dict(it,group=g,place=pl,stand=stand if os.path.exists(stand) else None,crops=crops,also=[])
        if it['shared'] and it['id'] in byid: byid[it['id']]['also'].append(pl); continue
        byid.setdefault(it['id'],c); P.append(c)
names={}
for c in P: names.setdefault(c['file'],[]).append(c)
for f,cs in names.items():
    if len(cs)>1:
        for c in cs: c['file']=c['place'].replace('-','_')+'_'+c['file']
for c in P: c['round']=1 if c['shared'] else 2 if c['rules'] in ('ground','material') else 3
json.dump(P,open('cards.json','w'),indent=0)
import collections
print(len(P),collections.Counter(c['round'] for c in P))
