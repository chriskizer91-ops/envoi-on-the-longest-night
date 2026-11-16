import sys,os,glob
from PIL import Image,ImageDraw,ImageFont
def sheet(files,out,cols=6,t=170,label=lambda f:os.path.basename(f)):
    rows=(len(files)+cols-1)//cols
    W=cols*(t+8); H=rows*(t+26)
    S=Image.new('RGB',(W,H),(40,40,44)); d=ImageDraw.Draw(S)
    try: font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',11)
    except: font=None
    for i,f in enumerate(files):
        try:
            im=Image.open(f); sz=im.size; im=im.convert('RGB'); im.thumbnail((t,t))
        except Exception as e: sz=('?',); im=Image.new('RGB',(t,t),(90,0,0))
        x=(i%cols)*(t+8)+4; y=(i//cols)*(t+26)+4
        S.paste(im,(x,y)); d.text((x,y+t+2),(label(f)[:26]+' %sx%s'%sz[:2] if len(sz)==2 else label(f))[:34],fill=(230,230,230),font=font)
    S.save(out,quality=85)
if __name__=='__main__':
    out=sys.argv[1]; files=sys.argv[2:]
    sheet(files,out)
