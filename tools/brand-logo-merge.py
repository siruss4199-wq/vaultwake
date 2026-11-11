#!/usr/bin/env python3
"""Vaultwake Merge logo (release 2026-11-08): the Home logo's subtitle "COAST CAMP" becomes "MERGE".

Only the small subtitle line changes: the painted VAULTWAKE word, sun and wave are kept pixel for pixel.
The old subtitle letters are cleared (the band below the wave holds nothing else) and MERGE is set in
Liberation Serif Bold (SIL Open Font License 1.1, Debian package fonts-liberation 2.1.5) in the
original's cream with its soft brown shadow; the two arrow rules move in to keep their gap.

  python3 tools/brand-logo-merge.py SOURCE.webp OUT.webp
SOURCE is the committed Coast Camp logo (git show fd76b03:v5/assets/premium/coast/home/logo.webp).
"""
import sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont

FONT = '/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf'
src, out = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGBA')
W, H = im.size
assert (W, H) == (1200, 435), (W, H)
TEXT = (338, 382, 853, 430)          # the subtitle letters, between the two arrow rules
LEFT, RIGHT = (182, 386, 326, 410), (862, 386, 1005, 410)   # the arrow rules, rows clear of the letters above
left, right = im.crop(LEFT), im.crop(RIGHT)
clear = Image.new('RGBA', (W, H), (0, 0, 0, 0))
for box in (TEXT, LEFT, RIGHT):
    im.paste(clear.crop(box), box)

font = ImageFont.truetype(FONT, 54)
word, track = 'MERGE', 22
widths = [font.getbbox(c)[2] - font.getbbox(c)[0] for c in word]
total = sum(widths) + track * (len(word) - 1)
x0, cy = (W - total) // 2, 400
top = font.getbbox('M')[1]
cap = font.getbbox('M')[3] - top
y = cy - cap // 2 - top
mask = Image.new('L', (W, H), 0)
d = ImageDraw.Draw(mask)
x = x0
for c, w in zip(word, widths):
    d.text((x - font.getbbox(c)[0], y), c, font=font, fill=255)
    x += w + track
# soft brown shadow below and right, then the cream face with a slight top-to-bottom warmth
shadow = Image.new('RGBA', (W, H), (74, 44, 18, 0))
shadow.putalpha(mask.filter(ImageFilter.GaussianBlur(2.2)).point(lambda v: int(v * .85)))
im.alpha_composite(shadow, (2, 3))
face = Image.new('RGBA', (W, H))
fd = ImageDraw.Draw(face)
for yy in range(cy - cap // 2 - 2, cy + cap // 2 + 3):
    t = (yy - (cy - cap // 2)) / max(1, cap)
    fd.line([(0, yy), (W, yy)], fill=(int(250 - 18 * t), int(242 - 26 * t), int(222 - 40 * t), 255))
face.putalpha(mask)
im.alpha_composite(face)
gap = 24
im.alpha_composite(left, (x0 - gap - left.width, LEFT[1]))
im.alpha_composite(right, (x0 + total + gap, RIGHT[1]))
im.save(out, 'WEBP', quality=90, method=6)
print(out, im.size)
