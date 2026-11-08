#!/usr/bin/env python3
"""CrazyGames covers for Vaultwake Merge (release 2026-11-08): 1920x1080, 800x1200 and 800x800.

Built only from art already in the game: the Home picture (v5/assets/premium/coast/home/home-bg.webp,
master docs/art-source/coastal-home-2026-10-28), the Vaultwake Merge logo (tools/brand-logo-merge.py)
and three painted shell items from the board (v5/assets/premium/coast/icons/shell-3..5.webp). No art is
enlarged past its own size where it is sharp: the landscape cover keeps the Home picture at 1:1 and
extends it with a blurred, darkened copy of itself. The only words are the title, in the logo.
Rights: every source carries owner_approved=NO in docs/release/VAULTWAKE_ART_RIGHTS_REGISTER.csv, so
these covers are pending the owner's confirmation (release/crazygames-basic/RIGHTS_REPORT.md).

  python3 tools/release-covers.py OUT_DIR [VIDEO_DIR]   (VIDEO_DIR: the portrait video's opening frame)
"""
import sys, os
from PIL import Image, ImageFilter, ImageEnhance, ImageDraw

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
A = lambda p: os.path.join(ROOT, 'v5/assets/premium', p)
out = sys.argv[1]
home = Image.open(A('coast/home/home-bg.webp')).convert('RGB')          # 941 x 1672
logo = Image.open(A('coast/home/logo.webp')).convert('RGBA')            # 1200 x 435
items = [Image.open(A(f'coast/icons/shell-{t}.webp')).convert('RGBA') for t in (3, 4, 5)]  # 192 x 192
assert home.size == (941, 1672) and logo.size == (1200, 435)

def scaled(im, w):
    return im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)

def glow(size, colour, radius):
    g = Image.new('RGBA', size, (0, 0, 0, 0))
    d = ImageDraw.Draw(g)
    w, h = size
    d.ellipse((w * .18, h * .18, w * .82, h * .82), fill=colour)
    return g.filter(ImageFilter.GaussianBlur(radius))

def shadowed(im, blur=10, offset=(0, 8), alpha=.55):
    pad = blur * 3
    base = Image.new('RGBA', (im.width + 2 * pad, im.height + 2 * pad), (0, 0, 0, 0))
    sh = Image.new('RGBA', im.size, (8, 30, 40, 255))
    sh.putalpha(im.split()[3].point(lambda v: int(v * alpha)))
    base.alpha_composite(sh, (pad + offset[0], pad + offset[1]))
    base = base.filter(ImageFilter.GaussianBlur(blur))
    base.alpha_composite(im, (pad, pad))
    return base, pad

def put(canvas, im, cx, cy, **kw):
    s, pad = shadowed(im, **kw)
    canvas.alpha_composite(s, (round(cx - s.width / 2), round(cy - s.height / 2)))

def scrim(size, top, bottom, colour=(9, 44, 58)):
    w, h = size
    m = Image.new('L', (1, h))
    for y in range(h):
        t = y / (h - 1)
        m.putpixel((0, y), int(255 * (top + (bottom - top) * t * t)))
    s = Image.new('RGBA', size, colour + (255,))
    s.putalpha(m.resize(size))
    return s

def shell_row(canvas, cx, cy, size):
    # three steps of one merge chain, the last one larger and lit
    sizes = [round(size * .8), round(size * .9), size]
    gap = round(size * .22)
    total = sum(sizes) + 2 * gap
    x = cx - total / 2
    for k, (it, s) in enumerate(zip(items, sizes)):
        c = x + s / 2
        if k == 2:
            g = glow((s * 2, s * 2), (255, 236, 170, 200), s * .22)
            canvas.alpha_composite(g, (round(c - s), round(cy - s)))
        put(canvas, it.resize((s, s), Image.LANCZOS), c, cy, blur=8, offset=(0, 6))
        x += s + gap

# 1920 x 1080: the Home picture at 1:1 on the left, a blurred copy beyond it, title and a merge chain right
W, H = 1920, 1080
bg = home.crop((760, 120, 941, 760)).resize((W, H), Image.LANCZOS).filter(ImageFilter.GaussianBlur(30))   # sky, far cliffs and sea
bg = ImageEnhance.Color(ImageEnhance.Brightness(bg).enhance(.95)).enhance(1.3).convert('RGBA')
sea = Image.new('RGBA', (1, H))
for y in range(H):
    t = y / (H - 1)                       # sky blue above, lagoon teal below
    sea.putpixel((0, y), (round(70 - 40 * t), round(150 + 20 * t), round(220 - 40 * t), 120))
bg.alpha_composite(sea.resize((W, H)))
panel = home.crop((0, 0, 941, 1080)).convert('RGBA')
mask = Image.new('L', panel.size, 255)
for x in range(941 - 220, 941):
    v = int(255 * (941 - x) / 220)
    ImageDraw.Draw(mask).line([(x, 0), (x, H)], fill=v)
panel.putalpha(mask)
bg.alpha_composite(panel, (0, 0))
bg.alpha_composite(scrim((W, H), 0, .25))
put(bg, scaled(logo, 900), 1415, 400, blur=14, offset=(0, 10), alpha=.6)
shell_row(bg, 1415, 760, 176)
bg.convert('RGB').save(os.path.join(out, 'cover-landscape-1920x1080.png'), optimize=True)

# 800 x 1200 (and the portrait video's 1080 x 1620 opening frame): the Home picture (door, camp and
# pier), the title over the beach
def portrait(W, H):
    k = W / 800
    p = home.crop((0, 0, 941, 1412)).resize((W, H), Image.LANCZOS).convert('RGBA')
    p.alpha_composite(scrim((W, H), 0, .62))
    shell_row(p, W / 2, round(1110 * k), round(104 * k))
    put(p, scaled(logo, round(720 * k)), W / 2, round(905 * k), blur=10, offset=(0, 8), alpha=.6)
    return p.convert('RGB')
portrait(800, 1200).save(os.path.join(out, 'cover-portrait-800x1200.png'), optimize=True)
if len(sys.argv) > 2:
    portrait(1080, 1620).save(os.path.join(sys.argv[2], 'video-cover-1080x1620.png'))

# 800 x 800: the door and camp, the title below
W, H = 800, 800
q = home.crop((0, 60, 941, 1001)).resize((W, H), Image.LANCZOS).convert('RGBA')
q.alpha_composite(scrim((W, H), 0, .55))
put(q, scaled(logo, 660), W / 2, 640, blur=10, offset=(0, 8), alpha=.6)
q.convert('RGB').save(os.path.join(out, 'cover-square-800x800.png'), optimize=True)
for n in ('cover-landscape-1920x1080.png', 'cover-portrait-800x1200.png', 'cover-square-800x800.png'):
    im = Image.open(os.path.join(out, n))
    print(n, im.size, os.path.getsize(os.path.join(out, n)))
