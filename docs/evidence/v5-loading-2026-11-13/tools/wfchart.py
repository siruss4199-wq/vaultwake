# Draws a request waterfall (PNG) from a measure.cjs wf-*.json. usage: python3 wfchart.py in.json out.png "title"
import json,sys
from PIL import Image,ImageDraw,ImageFont
d=json.load(open(sys.argv[1]));rows=[r for r in d['rows'] if r.get('end')];s=d['sum']
T=max(9000,max(r['end'] for r in rows)+300);W,rowh,left,top=1400,11,330,70;H=top+rowh*len(rows)+60
im=Image.new('RGB',(W,H),'white');dr=ImageDraw.Draw(im)
try:f=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',11);fb=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',15)
except Exception:f=fb=ImageFont.load_default()
x=lambda t:left+(W-left-20)*t/T
def col(r):
  u=r['url']
  if '/home/' in u:return (214,64,69)
  if r['type']=='Stylesheet':return (120,94,240)
  if r['type']=='Script':return (230,159,0)
  if r['type']=='Document':return (40,40,40)
  if '/ui/' in u:return (86,180,233)
  return (0,158,115)
dr.text((10,8),sys.argv[3],fill='black',font=fb)
dr.text((10,30),f"board playable {s['ready']} ms · first paint {s['fcp']} ms · {s['reqsBeforeReady']} requests / {s['kbBeforeReady']} KB before it",fill='black',font=f)
for k,(name,c) in enumerate([('Home art',(214,64,69)),('styles',(120,94,240)),('modules',(230,159,0)),('board UI art',(86,180,233)),('board pieces',(0,158,115))]):
  dr.rectangle([left+k*150,48,left+k*150+12,58],fill=c);dr.text((left+k*150+16,46),name,fill='black',font=f)
for t in range(0,T,1000):dr.line([x(t),top-4,x(t),H-40],fill=(225,225,225));dr.text((x(t)+2,H-36),f'{t//1000}s',fill='gray',font=f)
for i,r in enumerate(rows):
  y=top+i*rowh;dr.text((6,y-1),(r['url'].split('/')[-1][:44]),fill=(60,60,60),font=f)
  dr.rectangle([x(r['start']),y+1,max(x(r['end']),x(r['start'])+2),y+rowh-2],fill=col(r))
dr.line([x(s['ready']),top-6,x(s['ready']),H-40],fill=(200,0,0),width=2);dr.text((x(s['ready'])+4,top-18),'board playable',fill=(200,0,0),font=f)
im.save(sys.argv[2])
