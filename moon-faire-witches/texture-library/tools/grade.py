import numpy as np
from PIL import Image
def srgb2lin(c): return np.where(c<=0.04045,c/12.92,((c+0.055)/1.055)**2.4)
def lin2srgb(c): return np.where(c<=0.0031308,12.92*c,1.055*np.clip(c,0,None)**(1/2.4)-0.055)
M=np.array([[0.4124,0.3576,0.1805],[0.2126,0.7152,0.0722],[0.0193,0.1192,0.9505]]); Mi=np.linalg.inv(M)
W=np.array([0.95047,1.0,1.08883])
def f(t): return np.where(t>0.008856,np.cbrt(t),7.787*t+16/116)
def fi(t): return np.where(t>0.206893,t**3,(t-16/116)/7.787)
def rgb2lab(a):
    x=srgb2lin(a/255.)@M.T/W; fx,fy,fz=f(x[...,0]),f(x[...,1]),f(x[...,2])
    return np.stack([116*fy-16,500*(fx-fy),200*(fy-fz)],-1)
def lab2rgb(l):
    fy=(l[...,0]+16)/116; fx=fy+l[...,1]/500; fz=fy-l[...,2]/200
    x=np.stack([fi(fx),fi(fy),fi(fz)],-1)*W
    return np.clip(lin2srgb(x@Mi.T)*255,0,255)
def mask_of(a):
    # foreground of a cut-out on flat mid grey
    d=np.abs(a.astype(int)-128).max(-1); return d>10
def stats(a,m=None):
    L=rgb2lab(a.astype(float)); v=L[m] if m is not None else L.reshape(-1,3)
    return v.mean(0),v.std(0)+1e-6
def grade(src,ref,strength=1.0,cutout=False,ref_cutout=False):
    a=np.asarray(src.convert('RGB')).astype(float); r=np.asarray(ref.convert('RGB'))
    m=mask_of(a) if cutout else None
    rm=mask_of(r) if ref_cutout else None
    ms,ss=stats(a,m); mr,sr=stats(r,rm)
    L=rgb2lab(a)
    # keep a bit more of the source's contrast in lightness, full colour shift
    tgt_s=sr.copy(); tgt_s[0]=0.5*sr[0]+0.5*ss[0]
    G=(L-ms)/ss*tgt_s+mr
    G=L+(G-L)*strength
    out=lab2rgb(G)
    if m is not None: out=np.where(m[...,None],out,a)
    return Image.fromarray(out.astype(np.uint8))
