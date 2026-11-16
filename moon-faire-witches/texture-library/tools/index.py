import subprocess, os, json, re, collections, sys
R='/home/claude/repos'
IMG=re.compile(r'\.(png|jpe?g|webp|ktx2?|basis|dds|tga|exr|hdr|avif|gif)$', re.I)
rows=[]
for d in sorted(os.listdir(R)):
    g=os.path.join(R,d); repo=d[:-4]
    refs=subprocess.run(['git','-C',g,'for-each-ref','--format=%(refname)','refs/heads','refs/remotes/origin'],capture_output=True,text=True).stdout.split()
    refs=[r for r in refs if not r.endswith('/HEAD')]
    for ref in refs:
        out=subprocess.run(['git','-C',g,'ls-tree','-r',ref],capture_output=True,text=True).stdout
        br=ref.split('/',2)[2].replace('origin/','')
        for line in out.splitlines():
            meta,path=line.split('\t',1)
            mode,typ,sha=meta.split(); size=0
            if typ=='blob' and IMG.search(path):
                rows.append(dict(repo=repo,branch=br,path=path,sha=sha,size=int(size)))
json.dump(rows,open('/home/claude/work/all_images.json','w'))
u={}
for r in rows: u.setdefault(r['sha'],r)
print('image entries',len(rows),'unique pictures',len(u),'total MB',sum(r['size'] for r in u.values())//2**20)
c=collections.Counter(r['repo'] for r in u.values()); print(c.most_common())
