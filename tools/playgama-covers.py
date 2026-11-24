#!/usr/bin/env python3
"""Playgama covers for Vaultwake Merge (2026-11-24, release/playgama): the three slots the Playgama form takes,
square 800x800, portrait 1080x1920 and landscape 1920x1080.

The square and landscape covers are the CrazyGames ones (tools/release-covers.py, release/crazygames-basic/covers),
copied unchanged. The portrait slot is new (CrazyGames used 800x1200): it is made the same way, only from art
already in the game: the whole Home picture (v5/assets/premium/coast/home/home-bg.webp, 941x1672, the same
9:16 shape as the slot, so nothing is cropped; scaled 1.15x), the Vaultwake Merge logo and three painted shell
items from the board. The only words are the title, in the logo.

  python3 tools/playgama-covers.py OUT_DIR
"""
import sys, os, shutil
from PIL import Image, ImageFilter, ImageDraw

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
A = lambda p: os.path.join(ROOT, 'v5/assets/premium', p)
out = sys.argv[1]
os.makedirs(out, exist_ok=True)
home = Image.open(A('coast/home/home-bg.webp')).convert('RGB')
logo = Image.open(A('coast/home/logo.webp')).convert('RGBA')
items = [Image.open(A(f'coast/icons/shell-{t}.webp')).convert('RGBA') for t in (3, 4, 5)]
assert home.size == (941, 1672) and logo.size == (1200, 435)

def scaled(im, w):
    return im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)

def shadowed(im, blur=10, offset=(0, 8), alpha=.55):
    pad = blur * 3
    base = Image.new('RGBA', (im.width + 2 * pad, im.height + 2 * pad), (0, 0, 0, 0))
    sh = Image.new('RGBA', im.size, (8, 30, 40, 255))
    sh.putalpha(im.split()[3].point(lambda v: int(v * alpha)))
    base.alpha_composite(sh, (pad + offset[0], pad + offset[1]))
    base = base.filter(ImageFilter.GaussianBlur(blur))
    base.alpha_composite(im, (pad, pad))
    return base

def put(canvas, im, cx, cy, **kw):
    s = shadowed(im, **kw)
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

def glow(size, colour, radius):
    g = Image.new('RGBA', size, (0, 0, 0, 0))
    w, h = size
    ImageDraw.Draw(g).ellipse((w * .18, h * .18, w * .82, h * .82), fill=colour)
    return g.filter(ImageFilter.GaussianBlur(radius))

def shell_row(canvas, cx, cy, size):
    sizes = [round(size * .8), round(size * .9), size]
    gap = round(size * .22)
    x = cx - (sum(sizes) + 2 * gap) / 2
    for k, (it, s) in enumerate(zip(items, sizes)):
        c = x + s / 2
        if k == 2:
            canvas.alpha_composite(glow((s * 2, s * 2), (255, 236, 170, 200), s * .22), (round(c - s), round(cy - s)))
        put(canvas, it.resize((s, s), Image.LANCZOS), c, cy, blur=8, offset=(0, 6))
        x += s + gap

W, H = 1080, 1920
p = home.resize((W, H), Image.LANCZOS).convert('RGBA')
p.alpha_composite(scrim((W, H), 0, .62))
put(p, scaled(logo, 960), W / 2, 1480, blur=12, offset=(0, 10), alpha=.6)
shell_row(p, W / 2, 1745, 150)
p.convert('RGB').save(os.path.join(out, 'cover-portrait-1080x1920.png'), optimize=True)
src = os.path.join(ROOT, 'release/crazygames-basic/covers')
for n in ('cover-square-800x800.png', 'cover-landscape-1920x1080.png'):
    shutil.copyfile(os.path.join(src, n), os.path.join(out, n))
for n in ('cover-square-800x800.png', 'cover-portrait-1080x1920.png', 'cover-landscape-1920x1080.png'):
    im = Image.open(os.path.join(out, n))
    print(n, im.size, os.path.getsize(os.path.join(out, n)))
