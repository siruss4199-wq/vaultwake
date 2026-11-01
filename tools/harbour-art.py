#!/usr/bin/env python3
"""Chapter 3, The Hidden Harbour: runtime art from the director's masters (build 48a, 2026-11-01).

Masters (docs/art-source/hidden-harbour-2026-11-01/, kept unchanged; see CLAUDE_HANDOFF.md there):
  harbour-restoration-21-sheet-master.webp  7 places (columns) x 3 stages (rows), transparent
  harbour-before-concept-master.webp        the damaged harbour (1024 x 1536)
  harbour-restored-concept-master.webp      the same view restored
  harbour-story-4-sheet-master.webp         four story panels, 2 x 2

Output (v5/assets/premium/coast/hidden-harbour/), with manifest.json (sizes and anchors) and a contact
sheet in the folder given as --sheet:
  place-hb-<place>-<1..3>.webp  21 stage cut-outs. Each object is cut by its own connected pixels (the
      sheet's gutters are not a grid: masts and ropes reach into the row above, two columns touch), so
      a stage never carries a piece of its neighbour. Every cut-out is scaled by the same factor (no
      place is stretched to another's width) onto a 360 px square canvas, its ground (bottom of its
      own pixels) at 90 % and centred: a stage swap stays on its spot.
  harbour-map-before.webp / harbour-map-after.webp  the two concepts cropped to the seven places and
      the sea gate (1024 x 1195 from y 40); the after picture is revealed place by place in the game.
  story-arrival|cargo|signal|departure.webp  the four panels (768 x 512).
  place-hb-boatyard-launched.webp  build 48c: the boatyard's card after the launch, cut from the restored
      map (its finished yard: canopy, lanterns, tools, the cradles empty because the boat has sailed),
      so the card matches the map and no longer falls back to the stage-1 cut-out. A painted vignette of
      the restored concept, not a dedicated cut-out (see the asset brief in the build 48c report).
  python3 tools/harbour-art.py --launched  writes only that picture.
  ../../hidden-harbour-vibrant.webp  the area's strip picture (1200 x 400) from the damaged map.

Corrections (handoff production notes), each an interim one:
  - signal stage 3: its lamp glass recoloured from warm gold to the sea-green of stage 2 and the
    paintings; the brass stays gold (only bright, pale glass pixels in the lantern are moved).
  - arrival panel: the harbour behind the arch is painted restored (repaired roofs, a lit tower); a sea
    mist is laid over it so nothing there reads as already repaired. A painted damaged-harbour arrival
    panel is still missing.
  - boatyard after the launch: no new picture; the game shows stage 1's empty cradles once the boat
    has gone to the departure dock (app.mjs), so one boat is never drawn twice.
Not corrected (missing art, see docs/V5_CHAPTER3_HARBOUR_2026-11-01.md): the damaged map's crane and
departure dock already look working.

  python3 -I tools/harbour-art.py [--sheet DIR]
"""
import colorsys, json, os, sys
from collections import deque
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'docs/art-source/hidden-harbour-2026-11-01')
OUT = os.path.join(ROOT, 'v5/assets/premium/coast/hidden-harbour')
PLACES = ['landing', 'crane', 'warehouse', 'boatyard', 'registry', 'signal', 'departure']
# the sheet's columns, found from its alpha (gaps at alpha > 64); the warehouse and the boatyard touch
# at a shadow, split at x 829
COLS = [(25, 277), (297, 517), (548, 829), (829, 1107), (1117, 1393), (1411, 1630), (1657, 1900)]
# a piece belongs to the stage whose band its ground (lowest pixel) falls in
BANDS = [(0, 275), (275, 540), (540, 821)]
# columns where two stages are one piece: {column: (upper stage row, first row of the lower stage)}
SPLIT = {3: (1, 522)}
# the tip of the boatyard's stage-3 mast lies in stage 2's water shadow, just under its base: erased from
# stage 2 (column-local x0, x1, y0, y1)
ERASE = {(3, 1): (118, 139, 512, 532)}
CANVAS, GROUND, FILL = 360, .9, .8
MAP_CROP = (0, 40, 1024, 1235)


def components(mask):
    """4-connected components of a boolean mask: label image and a list of (label, ymax, size)."""
    h, w = mask.shape
    lab = np.zeros((h, w), np.int32)
    out, n = [], 0
    for y0, x0 in zip(*np.nonzero(mask)):
        if lab[y0, x0]:
            continue
        n += 1
        lab[y0, x0] = n
        q, ymax, size = deque([(y0, x0)]), y0, 0
        while q:
            y, x = q.popleft()
            size += 1
            ymax = max(ymax, y)
            for yy, xx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                if 0 <= yy < h and 0 <= xx < w and mask[yy, xx] and not lab[yy, xx]:
                    lab[yy, xx] = n
                    q.append((yy, xx))
        out.append((n, ymax, size))
    return lab, out


def cut_sheet(sheet):
    rgba = np.asarray(sheet.convert('RGBA'))
    alpha = rgba[:, :, 3]
    cells = {}
    for c, (x0, x1) in enumerate(COLS):
        sub = alpha[:, x0:x1]
        # label at half size (fast), then back to full size
        small = sub[::2, ::2] > 40
        lab, comps = components(small)
        lab = np.kron(lab, np.ones((2, 2), np.int32))[:sub.shape[0], :sub.shape[1]]
        rows = np.arange(sub.shape[0])[:, None]
        for r, (y0, y1) in enumerate(BANDS):
            keep = [n for n, ymax, size in comps if size >= 30 and y0 <= ymax * 2 + 1 < y1]
            m = np.isin(lab, keep)
            # a piece that two stages share (the boatyard: stage 3's mast touches stage 2's base) is
            # split at the row where the upper one's ground ends
            if c in SPLIT:
                upper, cut = SPLIT[c]
                both = np.isin(lab, [n for n, ymax, size in comps if size >= 30 and ymax * 2 + 1 >= cut])
                if r == upper:
                    m = m | (both & (rows < cut))
                if r == upper + 1:
                    m = (m & ~both) | (m & (rows >= cut))
                # the split leaves a fleck of the lower stage's mast under the upper one's base: keep only
                # the pieces at least 2 % of the largest
                lab2, comps2 = components(m[::2, ::2])
                big = max(size for _, _, size in comps2)
                lab2 = np.kron(lab2, np.ones((2, 2), np.int32))[:m.shape[0], :m.shape[1]]
                m = m & np.isin(lab2, [n for n, _, size in comps2 if size >= .02 * big])
            # the soft edge and shadow below the threshold: a few pixels around the kept pieces
            m = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(7))) > 0
            cell = rgba[:, x0:x1].copy()
            cell[:, :, 3] = np.where(m, cell[:, :, 3], 0)
            if (c, r) in ERASE:
                ex0, ex1, ey0, ey1 = ERASE[(c, r)]
                # only the wood (red over blue); the teal water shadow around it stays
                box = cell[ey0:ey1, ex0:ex1].astype(int)
                wood = box[:, :, 0] > box[:, :, 2] + 25
                cell[ey0:ey1, ex0:ex1, 3] = np.where(wood, 0, cell[ey0:ey1, ex0:ex1, 3])
            if c in SPLIT:
                # what is left of the other stage's mast behind this base shows as a fleck once the soft
                # edge is added: in the drawn picture, keep the pieces at least 1 % of the largest
                lab3, comps3 = components(cell[:, :, 3] > 8)
                big = max(size for _, _, size in comps3)
                cell[:, :, 3] = np.where(np.isin(lab3, [n for n, _, size in comps3 if size >= .01 * big]), cell[:, :, 3], 0)
            ys, xs = np.nonzero(cell[:, :, 3] > 8)
            box = (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)
            cells[(c, r)] = Image.fromarray(cell).crop(box)
    return cells


def signal_green(im):
    """Stage 3 of the signal tower: the lamp's bright warm glass to sea-green; brass stays gold."""
    a = np.asarray(im.convert('RGBA')).astype(np.float32) / 255
    h, w = a.shape[:2]
    top = int(h * .42)  # the lantern sits in the top part of the cut-out
    out = a.copy()
    for y in range(top):
        for x in range(w):
            r, g, b, al = a[y, x]
            if al < .1:
                continue
            hh, s, v = colorsys.rgb_to_hsv(r, g, b)
            # glass and glow: bright, warm and fairly pale (brass is darker or more saturated)
            if v > .78 and .08 < hh < .19 and s < .82:
                # sea-green of stage 2's lamp (hue about 0.47), the glow's brightness kept
                t = min(1, (v - .78) / .22)
                nr, ng, nb = colorsys.hsv_to_rgb(.47, .35 + .45 * (1 - t), v)
                k = .35 + .65 * min(1, (v - .78) / .1)
                out[y, x, :3] = (1 - k) * a[y, x, :3] + k * np.array([nr, ng, nb])
    return Image.fromarray((out * 255).astype(np.uint8))


def canvas(cut, scale):
    w, h = round(cut.width * scale), round(cut.height * scale)
    img = cut.resize((w, h), Image.LANCZOS)
    c = Image.new('RGBA', (CANVAS, CANVAS), (0, 0, 0, 0))
    x, y = (CANVAS - w) // 2, round(CANVAS * GROUND) - h
    c.alpha_composite(img, (x, max(0, y)))
    return c, {'width': w, 'height': h, 'left': x, 'top': max(0, y)}


def mist(panel):
    """Sea mist over the harbour behind the arch (the arrival panel)."""
    m = Image.new('L', panel.size, 0)
    ImageDraw.Draw(m).polygon([(250, 60), (690, 60), (690, 330), (560, 330), (430, 300), (250, 300)], fill=255)
    m = m.filter(ImageFilter.GaussianBlur(28))
    soft = panel.filter(ImageFilter.GaussianBlur(9))
    haze = Image.new('RGB', panel.size, (226, 240, 244))
    fogged = Image.blend(soft, haze, .52)
    return Image.composite(fogged, panel, m)


# the restored map's boatyard (map pixels): the yard under its canopy and the empty cradles
LAUNCHED_BOX = (530, 450, 1000, 780)


def launched_boatyard():
    """The boatyard after the launch: a soft-edged vignette of the restored map, on the 360 px canvas."""
    after = Image.open(os.path.join(SRC, 'harbour-restored-concept-master.webp')).convert('RGB').crop(MAP_CROP)
    c = after.crop(LAUNCHED_BOX).convert('RGBA')
    m = Image.new('L', c.size, 0)
    ImageDraw.Draw(m).ellipse((12, 12, c.width - 12, c.height - 12), fill=255)
    c.putalpha(m.filter(ImageFilter.GaussianBlur(14)))
    c.thumbnail((CANVAS, CANVAS), Image.LANCZOS)
    out = Image.new('RGBA', (CANVAS, CANVAS), (0, 0, 0, 0))
    out.alpha_composite(c, ((CANVAS - c.width) // 2, CANVAS - c.height - 18))
    out.save(os.path.join(OUT, 'place-hb-boatyard-launched.webp'), quality=88, method=6)
    return {'file': 'place-hb-boatyard-launched.webp', 'from': 'harbour-map-after', 'box': list(LAUNCHED_BOX)}


def main():
    if '--launched' in sys.argv:
        info = launched_boatyard()
        path = os.path.join(OUT, 'manifest.json')
        manifest = json.load(open(path))
        manifest['pictures']['place-hb-boatyard-launched'] = info
        json.dump(manifest, open(path, 'w'), indent=1)
        print(json.dumps(info))
        return
    sheet_dir = sys.argv[sys.argv.index('--sheet') + 1] if '--sheet' in sys.argv else None
    os.makedirs(OUT, exist_ok=True)
    cells = cut_sheet(Image.open(os.path.join(SRC, 'harbour-restoration-21-sheet-master.webp')))
    cells[(5, 2)] = signal_green(cells[(5, 2)])
    biggest = max(max(c.width, c.height) for c in cells.values())
    scale = CANVAS * FILL / biggest
    manifest = {'canvas': CANVAS, 'ground': GROUND, 'scale': round(scale, 4), 'places': {}, 'pictures': {}}
    for (c, r), cut in sorted(cells.items()):
        img, box = canvas(cut, scale)
        name = f'place-hb-{PLACES[c]}-{r + 1}.webp'
        img.save(os.path.join(OUT, name), quality=88, method=6)
        manifest['places'].setdefault(PLACES[c], {})[r + 1] = {'file': name, 'source': [cut.width, cut.height], **box}
    for kind in ('before', 'after'):
        src = 'harbour-before-concept-master.webp' if kind == 'before' else 'harbour-restored-concept-master.webp'
        pic = Image.open(os.path.join(SRC, src)).convert('RGB').crop(MAP_CROP)
        pic.save(os.path.join(OUT, f'harbour-map-{kind}.webp'), quality=84, method=6)
        manifest['pictures'][f'harbour-map-{kind}'] = {'size': list(pic.size), 'crop': list(MAP_CROP)}
    strip = Image.open(os.path.join(SRC, 'harbour-before-concept-master.webp')).convert('RGB').crop((0, 380, 1024, 721)).resize((1200, 400), Image.LANCZOS)
    strip.save(os.path.join(ROOT, 'v5/assets/premium/hidden-harbour-vibrant.webp'), quality=84, method=6)
    story = Image.open(os.path.join(SRC, 'harbour-story-4-sheet-master.webp')).convert('RGB')
    for k, name in enumerate(['arrival', 'cargo', 'signal', 'departure']):
        p = story.crop(((k % 2) * 768, (k // 2) * 512, (k % 2) * 768 + 768, (k // 2) * 512 + 512))
        if name == 'arrival':
            p = mist(p)
        p.save(os.path.join(OUT, f'story-{name}.webp'), quality=84, method=6)
        manifest['pictures'][f'story-{name}'] = {'size': list(p.size)}
    manifest['pictures']['place-hb-boatyard-launched'] = launched_boatyard()
    with open(os.path.join(OUT, 'manifest.json'), 'w') as f:
        json.dump(manifest, f, indent=1)
    if sheet_dir:
        os.makedirs(sheet_dir, exist_ok=True)
        cs = Image.new('RGB', (7 * 190 + 10, 3 * 190 + 40), (70, 76, 84))
        for (c, r) in cells:
            t = Image.open(os.path.join(OUT, f'place-hb-{PLACES[c]}-{r + 1}.webp')).resize((180, 180))
            cs.paste(t, (10 + c * 190, 30 + r * 190), t)
            ImageDraw.Draw(cs).rectangle((10 + c * 190, 30 + r * 190, 190 + c * 190, 210 + r * 190), outline=(110, 118, 128))
        for c, p in enumerate(PLACES):
            ImageDraw.Draw(cs).text((14 + c * 190, 10), p, fill=(255, 255, 255))
        cs.save(os.path.join(sheet_dir, 'harbour-contact-sheet.png'))
    print(json.dumps({'scale': manifest['scale'], 'files': len(os.listdir(OUT))}))


if __name__ == '__main__':
    main()
