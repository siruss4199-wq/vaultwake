#!/usr/bin/env python3
"""Chapter 6, The Keeper's Promise: runtime art from the director's pack (build 51a, 2026-11-02).
The same method as tools/lowwater-art.py (Chapter 5); only the pack, the names and the crop differ.

Masters (docs/art-source/keepers-promise-2026-11-02/): the pack's four concept masters kept as
near-lossless WebP (quality 92; the PNGs' SHA-256 are in the pack's manifest.json, copied there):
  map-before / map-after   the damaged and the restored station (1024 x 1536). They were painted
                           apart (the pack's ART_REVIEW.md): the map shows one or the other, never
                           patches of both, and never crossfades them as layers.
  stages                   a 7 x 3 concept sheet on cream (1916 x 821): one column per place, rows are
                           stages 1..3 (stage 1 = the first repair done). Not transparent runtime art.
  story                    a 2 x 2 storyboard (1536 x 1024): arrival, records chest, route map,
                           inner station door. Illustration direction only; the lines live in data.

Output (v5/assets/premium/coast/keepers-promise/):
  station-map-before|after.webp   both maps cropped to 1024 x 1195 (the same crop: sky and the far
      buildings trimmed, the reef landing at the bottom kept), like Chapter 4's headland
  place-ch6-<place>-<n>.webp      the sheet's cream keyed out by a flood fill from its border (only
      background joined to the edge goes; cream stone inside a sprite stays), the edge feathered by
      1 px; every separate piece goes to the 7 x 3 grid cell its centre is in (a tall stage-3 finial
      reaching above its cell stays with its sprite), trimmed and centred on a square
  story-<name>.webp               the storyboard's four panels (768 x 512 each, as painted)
  ../../keepers-promise-vibrant.webp  the area's strip picture (1200 x 400) from the damaged map

  python3 -I tools/keeper-art.py --import <pack>/Vaultwake_Chapter6   copy the masters, then export
  python3 -I tools/keeper-art.py                                         export from the kept masters
"""
import json, os, shutil, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'docs/art-source/keepers-promise-2026-11-02')
OUT = os.path.join(ROOT, 'v5/assets/premium/coast/keepers-promise')
PLACES = ['landing', 'wheel', 'records', 'workshop', 'regulator', 'desk', 'overlook']
# storyboard order: top left, top right, bottom left, bottom right. All four are used; none of the
# cards they illustrate names the wave seal over a generated emblem (ART_REVIEW.md).
STORIES = ['station', 'keeper', 'work', 'coast']
MAP_CROP = (0, 150, 1024, 1345)
KEY_TOLERANCE = 30  # summed RGB distance from the cell's border cream that still counts as background


def import_pack(pack):
    os.makedirs(SRC, exist_ok=True)
    for n in ('before', 'after', 'stages', 'story'):
        im = Image.open(os.path.join(pack, 'assets', n + '.png'))
        im.save(os.path.join(SRC, ('map-' + n if n in ('before', 'after') else n) + '.webp'), quality=92, method=6)
    for f in ['manifest.json', 'CLAUDE_HANDOFF.md', 'README.md', 'QA.md', 'ART_REVIEW.md', 'NARRATIVE.md',
              'stages.json', 'stages.csv', 'story-cards.json', 'prompts.json']:
        dst = os.path.join(SRC, 'pack', f)
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copyfile(os.path.join(pack, f), dst)


def key_sheet(sheet):
    """Alpha for the whole sheet: the cream joined to the sheet's border is keyed out (a flood fill, so
    cream stone inside a sprite stays), the edge shrunk by 1 px and softened so no cream fringe shows."""
    probe = sheet.copy()
    w, h = probe.size
    mark = (255, 0, 255)
    for x in range(0, w, 4):
        for y in (0, h - 1):
            if probe.getpixel((x, y)) != mark:
                ImageDraw.floodfill(probe, (x, y), mark, thresh=KEY_TOLERANCE)
    for y in range(0, h, 4):
        for x in (0, w - 1):
            if probe.getpixel((x, y)) != mark:
                ImageDraw.floodfill(probe, (x, y), mark, thresh=KEY_TOLERANCE)
    # cream shut in by a sprite (the sky under a rope bridge): a flat patch of the border's own colour,
    # flood filled tightly and kept only when large, so textured cream stone is not touched
    cream = np.asarray(sheet.getpixel((2, 2)), np.int32)
    flat = np.abs(np.asarray(probe, np.int32) - cream).sum(axis=2) < 10
    for y in range(0, h, 3):
        for x in range(0, w, 3):
            if flat[y, x] and probe.getpixel((x, y)) != mark:
                trial = probe.copy()
                ImageDraw.floodfill(trial, (x, y), (0, 255, 0), thresh=14)
                hole = (np.asarray(trial) == (0, 255, 0)).all(axis=2)
                if hole.sum() > 400:
                    probe.paste(Image.fromarray(np.where(hole[..., None], np.uint8(mark), np.asarray(probe))), (0, 0))
                flat &= ~hole
    bg = (np.asarray(probe) == mark).all(axis=2)
    alpha = Image.fromarray(np.where(bg, 0, 255).astype(np.uint8))
    return alpha.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))


def pieces(alpha):
    """The sheet's separate pieces (joined across gaps of a few px), each as (mask, centre): a
    4-neighbour labelling on a half-size grid, scaled back up."""
    near = alpha.point(lambda v: 255 if v > 24 else 0).filter(ImageFilter.MaxFilter(3))
    W, H = near.size
    small = np.asarray(near.resize((W // 2, H // 2), Image.NEAREST)) > 0
    h, w = small.shape
    lab = np.zeros((h, w), np.int32)
    n = 0
    for y0 in range(h):
        for x0 in range(w):
            if small[y0, x0] and not lab[y0, x0]:
                n += 1
                lab[y0, x0] = n
                todo = [(y0, x0)]
                while todo:
                    y, x = todo.pop()
                    for yy, xx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
                        if 0 <= yy < h and 0 <= xx < w and small[yy, xx] and not lab[yy, xx]:
                            lab[yy, xx] = n
                            todo.append((yy, xx))
    big = np.asarray(Image.fromarray(lab).resize((W, H), Image.NEAREST))
    out = []
    for k in range(1, n + 1):
        m = big == k
        py, px = np.nonzero(m)
        if len(px):
            out.append((m, (px.mean(), py.mean())))
    return out


def split_rows(found, H):
    """A piece with real mass in two grid rows is two sprites touching (the gauge's stage-3 finial
    meets its stage-2 base): cut it on its thinnest line within 80 px of the row boundary."""
    out = []
    for m, c in found:
        ys = np.nonzero(m)[0]
        mass = [((ys >= r * H / 3) & (ys < (r + 1) * H / 3)).mean() for r in range(3)]
        rows = [r for r in range(3) if mass[r] > .2]
        if len(rows) < 2:
            out.append((m, c))
            continue
        cuts = []
        for r in rows[1:]:
            b = round(r * H / 3)
            band = m[b - 80:b + 80].sum(axis=1)
            cuts.append(b - 80 + int(np.argmin(band)))
        edges = [0] + cuts + [H]
        for top, bottom in zip(edges, edges[1:]):
            part = m.copy()
            part[:top] = False
            part[bottom:] = False
            py, px = np.nonzero(part)
            if len(px):
                out.append((part, (px.mean(), py.mean())))
    return out


def export():
    os.makedirs(OUT, exist_ok=True)
    out = {'maps': {}, 'sprites': {}, 'stories': {}}
    for kind in ('before', 'after'):
        pic = Image.open(os.path.join(SRC, f'map-{kind}.webp')).convert('RGB').crop(MAP_CROP)
        pic.save(os.path.join(OUT, f'station-map-{kind}.webp'), quality=84, method=6)
        out['maps'][kind] = {'size': list(pic.size), 'crop': list(MAP_CROP)}
    strip = Image.open(os.path.join(SRC, 'map-before.webp')).convert('RGB').crop((0, 560, 1024, 901)).resize((1200, 400), Image.LANCZOS)
    strip.save(os.path.join(ROOT, 'v5/assets/premium/keepers-promise-vibrant.webp'), quality=84, method=6)
    sheet = Image.open(os.path.join(SRC, 'stages.webp')).convert('RGB')
    W, H = sheet.size
    alpha = key_sheet(sheet)
    owner = {}
    for m, (cx, cy) in split_rows(pieces(alpha), H):  # each piece belongs to the grid cell its centre is in
        k = (min(6, int(cx * 7 // W)), min(2, int(cy * 3 // H)))
        owner[k] = m if k not in owner else owner[k] | m
    a_np = np.asarray(alpha)
    for c, p in enumerate(PLACES):
        for r in range(3):
            own = np.where(owner[(c, r)], a_np, 0).astype(np.uint8)
            sp = sheet.convert('RGBA')
            sp.putalpha(Image.fromarray(own))
            bb = Image.fromarray(own).point(lambda v: 255 if v > 24 else 0).getbbox()
            sp = sp.crop(bb)
            side = max(sp.size) + 8
            sq = Image.new('RGBA', (side, side), (0, 0, 0, 0))
            sq.paste(sp, ((side - sp.size[0]) // 2, side - sp.size[1] - 4))
            sq.save(os.path.join(OUT, f'place-ch6-{p}-{r + 1}.webp'), quality=88, method=6)
            out['sprites'][f'{p}-{r + 1}'] = {'size': side, 'opaque_box': list(bb)}
    story = Image.open(os.path.join(SRC, 'story.webp')).convert('RGB')
    SW, SH = story.size
    for k, name in enumerate(STORIES):
        x, y = (k % 2) * SW // 2, (k // 2) * SH // 2
        panel = story.crop((x, y, x + SW // 2, y + SH // 2))
        panel.save(os.path.join(OUT, f'story-{name}.webp'), quality=84, method=6)
        out['stories'][name] = {'size': list(panel.size), 'from': [x, y]}
    with open(os.path.join(OUT, 'manifest.json'), 'w') as f:
        json.dump(out, f, indent=1)
    print(json.dumps({'files': len(os.listdir(OUT))}))


if __name__ == '__main__':
    if '--import' in sys.argv:
        import_pack(sys.argv[sys.argv.index('--import') + 1])
    export()
