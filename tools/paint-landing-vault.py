# Vaultwake V5: paints the ancient Vault entrance into the Chapter 1 Landing Beach map (the upper-right cliff).
# Produces v5/assets/premium/landing-map-vault.webp from the original painted map and the game's own closed Vault
# door art; no outside imagery. The entrance is composited at 4x and resampled into the painting:
#   - the arch frame is the cliff's own rock texture, smoothed like worked stone, with carved joints, a weathered and
#     chipped outer edge, relief lit from the upper left (the map's light) and a soft cast shadow to the lower right;
#   - the opening follows the wall's slope (k), a deep recess with a dark soffit, a lit right reveal and ambient
#     occlusion, sunlight falling on its lower right; the closed door sits back in it, warmed into the palette, with a
#     faint turquoise heart and seam;
#   - the painting's own fallen rocks are clone-stamped over the threshold and its plants stay on top.
# Re-run (from git history: the map before this change is landing-map.webp at b8c5246):
#   git show b8c5246:v5/assets/premium/landing-map.webp > /tmp/landing-map.webp
#   python3 tools/paint-landing-vault.py /tmp/landing-map.webp v5/assets/premium/coast/vault-door-thumb.webp \
#     v5/assets/premium/landing-map-vault.webp
# Defaults are the shipped values; a JSON 5th argument overrides them (4th: an optional zoomed preview PNG or '-').
import sys,json,numpy as np
from PIL import Image,ImageFilter
MAP,DOOR,OUT=sys.argv[1:4];PREV=sys.argv[4] if len(sys.argv)>4 and sys.argv[4]!='-' else None
P={'k':0.12,'ar':1.12,'hwo':33,'hwi':21,'spring':-2,'base':33,'q':84,**(json.loads(sys.argv[5]) if len(sys.argv)>5 else {})}
S=4                                    # supersampling factor
X0,Y0,X1,Y1=860,170,1024,345           # patch on the 1024 map
cx,cy=P.get('cx',944),P.get('cy',262)  # entrance centre (map px)
k=P.get('k',0.22)                      # wall slope: the face's horizontal runs down-right
hwo,hwi=P.get('hwo',36),P.get('hwi',24)  # outer / inner half widths
spring=P.get('spring',-4)              # where the arch starts (v, map px, from centre)
base=P.get('base',34)                  # threshold (v)
ar=P.get('ar',1.0)                     # arch height ratio
img=Image.open(MAP).convert('RGB');W,H=img.size
patch=img.crop((X0,Y0,X1,Y1)).resize(((X1-X0)*S,(Y1-Y0)*S),Image.BICUBIC)
O=np.asarray(patch).astype(np.float32)/255
h,w=O.shape[:2];yy,xx=np.mgrid[0:h,0:w].astype(np.float32)
mx=X0+xx/S;my=Y0+yy/S
u=mx-cx;v=my-cy-k*u                    # wall coordinates
def arch(hw,top_extra=0.0):
    vv=v-spring;inside_rect=(np.abs(u)<=hw)&(vv>=0)&(v<=base)
    ell=(u/hw)**2+((vv)/(hw*ar+top_extra))**2<=1
    return inside_rect|((vv<0)&ell)
outer=arch(hwo,0);inner=arch(hwi,0)
ring=outer&~inner
def smooth(m,r):
    return np.asarray(Image.fromarray((m*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r))).astype(np.float32)/255
# noise for an irregular, weathered outline (coarse chips and fine grit)
rng=np.random.default_rng(P.get('seed',7))
def fnoise(cell):
    n=rng.random((h//cell+2,w//cell+2)).astype(np.float32)
    return np.asarray(Image.fromarray((n*255).astype(np.uint8)).resize((w,h),Image.BICUBIC)).astype(np.float32)/255
noise=fnoise(12)*.65+fnoise(4)*.35
dist_in=smooth(outer,S*1.6)                      # 1 deep inside the frame, ~.5 at its edge
outer_soft=((dist_in+(noise-.5)*P.get('chip',.55))>.5).astype(np.float32)*outer.astype(np.float32)
outer_soft=np.maximum(outer_soft,inner.astype(np.float32))
outer_soft=smooth(outer_soft,S*.35)
ring_s=np.clip(outer_soft-smooth(inner,S/2),0,1)
lum=lambda a:(a*[.3,.59,.11]).sum(-1,keepdims=True)
R=O.copy()
# 1. dressed stone frame: the cliff's own texture, smoothed like worked stone, a touch cooler and older
stone=np.asarray(Image.fromarray((O*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(S*1.1))).astype(np.float32)/255
stone=stone*.7+O*.3
L=lum(stone);stone=np.clip(L*np.array([1.0,.965,.9])*1.02+(stone-L)*.55+.01,0,1)
ang=np.arctan2(v-spring,u);rad=np.sqrt(u**2+((v-spring)/ar)**2)
def line(dist,wd):return np.clip(1-np.abs(dist)/wd,0,1)
groove=np.zeros((h,w),np.float32);lip=np.zeros((h,w),np.float32)
for a in np.linspace(-np.pi,0,8)[1:-1]:                 # voussoirs
    d=np.sin(ang-a)*rad;up=(v-spring)<0
    groove=np.maximum(groove,line(d,.55)*up);lip=np.maximum(lip,line(d-.9,.5)*up)
for vv in P.get('courses',[9,22]):                       # jamb courses
    sel=(np.abs(u)>hwi)&(np.abs(u)<hwo)
    groove=np.maximum(groove,line(v-vv,.5)*sel);lip=np.maximum(lip,line(v-vv-.9,.5)*sel)
groove*=ring;lip*=ring
stone=stone*(1-.45*groove[...,None])+.10*lip[...,None]
key=(np.abs(u)<4.2)&((v-spring)<-hwi+.5)&((v-spring)>-hwo-1)&ring
stone[key]=np.clip(stone[key]*1.07,0,1)
# relief: the frame stands a little proud of the cliff, lit on its upper-left edge
of=smooth(outer_soft,S*1.4);gy,gx=np.gradient(of)
bev=np.clip((gx+gy)*-1,-1,1)*S*1.6                   # outward normal towards the upper left -> light
stone=np.clip(stone*(1+np.clip(bev,-.22,.28)[...,None]),0,1)
R=R*(1-ring_s[...,None])+stone*ring_s[...,None]
# 2. the opening: a deep recess; sunlight from the upper left falls on its lower right
op=smooth(inner,S/2)
depth=np.clip((u+hwi)/(2*hwi),0,1)                  # 0 left, 1 right
top=np.clip(((v-spring)+hwi)/(hwi+base),0,1)        # 0 top, 1 threshold
lightin=np.clip(depth*.6+top*.6-.35,0,1)
c0=np.array([.13,.10,.10],np.float32);c1=np.array([.42,.33,.25],np.float32)
rec=c0+(c1-c0)*lightin[...,None]
hp=O-np.asarray(Image.fromarray((O*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(S*1.5))).astype(np.float32)/255
rec=np.clip(rec+hp*.35,0,1)                          # keep the brush texture in the shadow
# right reveal (the inner face of the right jamb) catches the light; the soffit stays dark
revw=P.get('rev',6)
rev=((u>hwi-revw)&inner).astype(np.float32);rev=smooth(rev,S/2)*np.clip((v-spring+hwi)/6,0,1)
rec=rec*(1-rev[...,None]*.9)+np.clip(stone*.92,0,1)*rev[...,None]*.9
soff=(((v-spring)<-hwi+4)&inner).astype(np.float32);soff=smooth(soff,S/2)
rec=rec*(1-.5*soff[...,None])
ao=smooth(inner.astype(np.float32),S*2.2);rec=rec*(.62+.38*np.clip((ao-.5)*2.2,0,1))[...,None]
# 3. the closed door, set back in the recess, sheared to the wall, dim and warm
D=Image.open(DOOR).convert('RGB');ds=int(2*(hwi-5)*S)
dc=D.crop((14,20,346,352)).resize((ds,ds),Image.LANCZOS)
dr=np.asarray(dc).astype(np.float32)/255
du=(u+hwi-6.5)*S/1;dv=(v-spring+hwi-7.5)*S/1     # door square in wall coords
ix=np.clip(du.astype(int),0,ds-1);iy=np.clip(dv.astype(int),0,ds-1)
inside_door=(du>=0)&(du<ds)&(dv>=0)&(dv<ds)
cxd=(du-ds/2);cyd=(dv-ds/2);circ=(cxd**2+cyd**2)<=(ds/2*.98)**2
dmask=smooth((inside_door&circ&inner).astype(np.float32),S/3)
dpx=dr[iy,ix]
g=lum(dpx)
dpx=dpx*.5+np.array([.62,.5,.36])*g*.5            # warm it into the scene's palette
dpx=dpx*(.35+.55*lightin[...,None])                # lit like the recess around it
gem=np.exp(-((cxd/ (ds*.1))**2+(cyd/(ds*.1))**2))  # faint turquoise heart
seam=np.exp(-(cxd/(ds*.012))**2)*circ
dpx=dpx+np.array([.2,.75,.72])*(gem*P.get("gem",.5)+seam*P.get("seam",.2))[...,None]
rec=rec*(1-dmask[...,None]*.92)+dpx*dmask[...,None]*.92
R=R*(1-op[...,None])+rec*op[...,None]
# lintel shadow cast onto the upper door
ls=np.clip(1-((v-spring)+hwi)/12,0,1)*inner
R=R*(1-.35*smooth(ls,S)[...,None])
# 4. no steps: the cliff's fallen rocks stay in front of the threshold
steps=np.zeros((h,w),np.float32)
# 4b. fallen rocks over the threshold: clone-stamp the painting's own rubble from just below
rub=P.get('rubble',[[904,306,950,334,18,-15]])     # source box (map px) and offset
for (sx0,sy0,sx1,sy1,dx,dy) in rub:
    src=O[(sy0-Y0)*S:(sy1-Y0)*S,(sx0-X0)*S:(sx1-X0)*S]
    Ls=lum(src)[...,0];rr,gg,bb=src[...,0],src[...,1],src[...,2]
    rock=((Ls>.52)&~((gg>rr*1.02)&(gg>bb*1.15))).astype(np.float32)
    rock=np.asarray(Image.fromarray((rock*255).astype(np.uint8)).filter(ImageFilter.MinFilter(5)).filter(ImageFilter.GaussianBlur(S*.6))).astype(np.float32)/255
    ty0,tx0=(sy0+dy-Y0)*S,(sx0+dx-X0)*S;hh,ww=src.shape[:2]
    reg=R[ty0:ty0+hh,tx0:tx0+ww];m=rock[...,None]
    # a soft shadow from the rocks onto the doorway behind them
    shm=np.roll(np.roll(rock,-int(S*1.5),0),-int(S*1),1)[...,None]
    reg[:]=reg*(1-.35*shm*(1-m))
    reg[:]=reg*(1-m)+src*m
    steps[ty0:ty0+hh,tx0:tx0+ww]=np.maximum(steps[ty0:ty0+hh,tx0:tx0+ww],rock)
# 5. keep the painting's own plants over the new stonework
r,gch,b=O[...,0],O[...,1],O[...,2]
leaf=((gch>r*1.02)&(gch>b*1.15)&(gch>.25))|((r>gch*1.35)&(r>.5)&(b<r*.8))
leafm=smooth(leaf.astype(np.float32),S/2)*.95
newm=np.clip(np.maximum(ring_s,np.maximum(op,steps)),0,1)
R=R*(1-leafm[...,None]*newm[...,None])+O*(leafm[...,None]*newm[...,None])
# 6. soft contact shadow below/right of the frame, and blend the whole into the cliff
sh=np.clip(smooth(outer_soft,S*1.5)-outer_soft,0,1)
sh=np.roll(np.roll(sh,int(S*1.2),0),int(S*1.2),1)*(1-leafm)
R=R*(1-.3*sh[...,None])
blend=np.clip(smooth(np.maximum(outer_soft,steps)+sh,S*.8)*1.15,0,1)
F=O*(1-blend[...,None])+R*blend[...,None]
# painterly finish: a light median to match the brushwork, back down to map resolution
fi=Image.fromarray((np.clip(F,0,1)*255).astype(np.uint8)).filter(ImageFilter.MedianFilter(3))
small=fi.resize((X1-X0,Y1-Y0),Image.LANCZOS)
out=img.copy();out.paste(small,(X0,Y0))
out.save(OUT,quality=P.get('q',86),method=6)
if PREV:
    big=out.crop((X0-40,Y0-40,X1,Y1+40));big.resize((big.size[0]*3,big.size[1]*3),Image.LANCZOS).save(PREV)
