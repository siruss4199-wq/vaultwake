#!/usr/bin/env python3
"""Chapter 4, The Answering Light: runtime art from the director's pack (build 49a, 2026-11-02).

Masters (docs/art-source/answering-light-2026-11-02/): the pack's individual PNGs kept as
near-lossless WebP (quality 92; the PNGs' SHA-256 are in the pack's manifest.json, copied there),
never edited or cut from a sheet:
  map-before / map-after         the damaged and the restored headland (1024 x 1536, not registered
                                 layers: the map shows one or the other, never patches of both)
  place-ch4-<place>-<1..3>       21 separate transparent stage sprites (1254 px square)
  story-01..04                   four text-free portrait story paintings (1024 x 1536)

Output (v5/assets/premium/coast/answering-light/):
  headland-map-before|after.webp  the maps cropped to the headland (1024 x 1195 from y 60: sky and
      the outer reef trimmed, the arrival boat kept), the same crop for both
  place-ch4-<place>-<n>.webp      the sprites at 512 px with their alpha (the whole object kept)
  story-<name>.webp               the four paintings at 768 x 1152
  ../../answering-light-vibrant.webp  the area's strip picture (1200 x 400) from the damaged map

  python3 tools/headland-art.py --import <pack>/Vaultwake_Chapter4   copies the pack's PNG masters into
      the art-source folder as WebP (with its manifest and handoff docs), then exports
  python3 tools/headland-art.py                                       exports from the kept masters
"""
import json, os, shutil, sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'docs/art-source/answering-light-2026-11-02')
OUT = os.path.join(ROOT, 'v5/assets/premium/coast/answering-light')
PLACES = ['landing', 'steps', 'cottage', 'workshop', 'records', 'lighthouse', 'relay']
STORIES = {'story-01-arrival': 'arrival', 'story-02-keeper-log': 'log', 'story-03-first-light': 'light', 'story-04-route-message': 'message'}
MAP_CROP = (0, 60, 1024, 1255)
SPRITE = 512


def masters():
    names = ['map-before', 'map-after'] + [f'place-ch4-{p}-{n}' for p in PLACES for n in (1, 2, 3)] + list(STORIES)
    return names


def import_pack(pack):
    os.makedirs(SRC, exist_ok=True)
    for n in masters():
        im = Image.open(os.path.join(pack, 'assets', n + '.png'))
        im.save(os.path.join(SRC, n + '.webp'), quality=92, method=6)
    for f in ['manifest.json', 'CLAUDE_HANDOFF.md', 'README.md', 'ТОВЧ.md', 'docs/DESIGN.md', 'docs/ART_INTEGRATION.md',
              'docs/QA_CHECKLIST.md', 'docs/STAGE_TABLE.md', 'data/chapter4-proposal.json', 'data/story-cards.json', 'data/map-hotspots.json']:
        dst = os.path.join(SRC, 'pack', f)
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copyfile(os.path.join(pack, f), dst)


def export():
    os.makedirs(OUT, exist_ok=True)
    out = {'maps': {}, 'sprites': {}, 'stories': {}}
    for kind in ('before', 'after'):
        pic = Image.open(os.path.join(SRC, f'map-{kind}.webp')).convert('RGB').crop(MAP_CROP)
        pic.save(os.path.join(OUT, f'headland-map-{kind}.webp'), quality=84, method=6)
        out['maps'][kind] = {'size': list(pic.size), 'crop': list(MAP_CROP)}
    strip = Image.open(os.path.join(SRC, 'map-before.webp')).convert('RGB').crop((0, 420, 1024, 761)).resize((1200, 400), Image.LANCZOS)
    strip.save(os.path.join(ROOT, 'v5/assets/premium/answering-light-vibrant.webp'), quality=84, method=6)
    for p in PLACES:
        for n in (1, 2, 3):
            im = Image.open(os.path.join(SRC, f'place-ch4-{p}-{n}.webp')).convert('RGBA')
            sp = im.resize((SPRITE, SPRITE), Image.LANCZOS)
            sp.save(os.path.join(OUT, f'place-ch4-{p}-{n}.webp'), quality=86, method=6)
            box = im.getchannel('A').getbbox()
            out['sprites'][f'{p}-{n}'] = {'size': SPRITE, 'opaque_box': list(box)}
    for src, name in STORIES.items():
        im = Image.open(os.path.join(SRC, src + '.webp')).convert('RGB').resize((768, 1152), Image.LANCZOS)
        im.save(os.path.join(OUT, f'story-{name}.webp'), quality=84, method=6)
        out['stories'][name] = {'size': [768, 1152], 'from': src}
    with open(os.path.join(OUT, 'manifest.json'), 'w') as f:
        json.dump(out, f, indent=1)
    print(json.dumps({'files': len(os.listdir(OUT))}))


if __name__ == '__main__':
    if '--import' in sys.argv:
        import_pack(sys.argv[sys.argv.index('--import') + 1])
    export()
