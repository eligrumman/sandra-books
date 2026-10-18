#!/usr/bin/env python3
"""Render the link-preview image (WhatsApp, Facebook, Telegram) to dist/assets/img/og.jpg."""
import sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageOps, ImageEnhance
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
S = ROOT / 'tools'
W, H = 1200, 630
bg = Image.open(f'{ROOT}/dist/assets/img/works/night-faces-1600.webp').convert('RGB')
bg = ImageOps.fit(bg, (W, H), centering=(.5, .55))
bg = ImageEnhance.Brightness(bg).enhance(.55)
# darker towards the text side (left)
shade = Image.linear_gradient('L').rotate(90).resize((W, H))
dark = Image.new('RGB', (W, H), (12, 10, 18))
bg = Image.composite(bg, dark, shade.point(lambda v: int(70 + v * .7)))
# portrait in an arch on the right
pw, ph = 380, 500
por = ImageOps.fit(Image.open(f'{ROOT}/src/art/portrait.webp').convert('RGB'), (pw, ph), centering=(.5, .35))
mask = Image.new('L', (pw, ph), 0); m = ImageDraw.Draw(mask)
m.rounded_rectangle((0, pw // 2, pw, ph), 14, fill=255); m.ellipse((0, 0, pw, pw), fill=255)
x0, y0 = W - pw - 70, (H - ph) // 2
glow = Image.new('RGBA', (W, H), (0, 0, 0, 0)); g = ImageDraw.Draw(glow)
g.rounded_rectangle((x0 - 10, y0 + 30, x0 + pw + 10, y0 + ph + 30), 30, fill=(0, 0, 0, 170))
bg = Image.alpha_composite(bg.convert('RGBA'), glow.filter(ImageFilter.GaussianBlur(28)))
bg.paste(por, (x0, y0), mask)
d = ImageDraw.Draw(bg)
border = Image.new('L', (pw, ph), 0); b = ImageDraw.Draw(border)
b.rounded_rectangle((10, pw // 2, pw - 10, ph - 10), 8, outline=255, width=2); b.arc((10, 10, pw - 10, pw - 10), 180, 360, fill=255, width=2)
b.rectangle((12, pw // 2 - 2, pw - 12, pw // 2 + 2), fill=0)
bg.paste((236, 212, 173), (x0, y0), border.point(lambda v: v * 0.6 if v else 0).convert('L'))
frank = lambda s: ImageFont.truetype(f'{S}/fonts/frank.ttf', s)
corm = lambda s: ImageFont.truetype(f'{S}/fonts/corm.ttf', s)
rub = lambda s: ImageFont.truetype(f'{S}/fonts/rubik.ttf', s)
gold, cream = (230, 196, 140), (246, 240, 230)
right = x0 - 60  # text block right edge
def rtl(text, font, y, fill):
    w = d.textlength(text, font=font, direction='rtl', language='he')
    d.text((right - w, y), text, font=font, fill=fill, direction='rtl', language='he')
rtl('סנדרה', frank(118), 92, cream)
rtl('לייפר', frank(118), 214, gold)
rtl('אמנית · מורה לאמנות · סופרת', rub(30), 372, (225, 218, 210))
w = d.textlength('Сандра Лейфер', font=corm(40)); d.text((right - w, 426), 'Сандра Лейфер', font=corm(40), fill=(214, 206, 198))
d.line((right - 90, 500, right, 500), fill=gold, width=2)
w = d.textlength('sandraleifer.com', font=corm(30)); d.text((right - w, 516), 'sandraleifer.com', font=corm(30), fill=gold)
bg.convert('RGB').save(f'{ROOT}/dist/assets/img/og.jpg', 'JPEG', quality=86, optimize=True, progressive=True)
