# sheet.py SHOTS OUT VIEWPORT : before|after pairs per state, full screen at 2x, labelled
import sys,glob,os
from PIL import Image,ImageDraw,ImageFont
D,OUT,V=sys.argv[1:4]
F='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
font=ImageFont.truetype(F,34) if os.path.exists(F) else ImageFont.load_default()
STATES=[('deliver-full','Ready order (crew)'),('merge-full','Merge'),('gold-full','Gold Order'),('build-full','Build (board)'),('build-coast','Build (coast)')]
def pick(label,key):
    g=sorted(glob.glob(f'{D}/{label}-{V}-*-{key}.png'));return g[0] if g else None
rows=[]
for key,name in STATES:
    a,b=pick('before',key),pick('after',key)
    if a and b: rows.append((name,Image.open(a).convert('RGB'),Image.open(b).convert('RGB')))
w,h=rows[0][1].size;gap=24;head=70
sheet=Image.new('RGB',(2*w+3*gap,len(rows)*(h+head+gap)+gap),'white');d=ImageDraw.Draw(sheet)
y=gap
for name,a,b in rows:
    d.text((gap,y+14),f'{name} · BEFORE (702f531)',fill=(140,40,30),font=font);d.text((2*gap+w,y+14),f'{name} · AFTER',fill=(20,110,60),font=font)
    sheet.paste(a,(gap,y+head));sheet.paste(b,(2*gap+w,y+head));y+=h+head+gap
sheet.save(OUT,quality=68);print(OUT,sheet.size,len(rows))
