import sys, base64, io
from PIL import Image
kinds, height, out = sys.argv[1], sys.argv[2], sys.argv[3]
W,H=576,384
k=Image.open(kinds).convert('RGB').resize((W,H),Image.NEAREST)
h=Image.open(height).convert('RGB')
hp=h.load(); kp=k.load()
# height in atlas px = (R*256+G)/10 - 100 ; pack to 8 bits: 0 = -30 (sea floor), 255 = 284 (highest peak)
h8=Image.new('L',h.size); p8=h8.load(); lo,hi=1e9,-1e9
for y in range(h.size[1]):
    for x in range(h.size[0]):
        r,g,_=hp[x,y]; v=(r*256+g)/10-100; lo=min(lo,v); hi=max(hi,v)
        p8[x,y]=max(0,min(255,round((v+30)/314*255)))
h8=h8.resize((W,H),Image.BILINEAR); q=h8.load()
im=Image.new('RGB',(W,H)); ip=im.load(); counts={}
for y in range(H):
    for x in range(W):
        kd=kp[x,y][0]; counts[kd]=counts.get(kd,0)+1; ip[x,y]=(kd*20,q[x,y],0)
buf=io.BytesIO(); im.save(buf,'PNG',optimize=True)
open(out,'w').write('data:image/png;base64,'+base64.b64encode(buf.getvalue()).decode())
print('height range',round(lo),round(hi),'| kinds',sorted(counts.items()),'| png KB',len(buf.getvalue())//1024)
