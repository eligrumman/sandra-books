#!/usr/bin/env python3
"""Render the link-preview images of the NeuroGraphica landing page:
dist/assets/img/og-neurographica-ru.jpg, -he.jpg and -en.jpg (1200 x 630).
Background: Sandra's NeuroGraphica work "stained"; text: the page's name in its language.
Hebrew is drawn right to left by reversing the string (PIL here has no raqm); the strings are plain Hebrew words."""
from PIL import Image, ImageDraw, ImageFont, ImageOps, ImageEnhance
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
F = ROOT / 'tools' / 'fonts'
W, H = 1200, 630
TEXT = {
    'ru': ('Нейрографика', 'с Сандрой Лейфер', 'онлайн-гид · обучение · занятия в Израиле', 'corm'),
    'he': ('נוירוגרפיקה', 'עם סנדרה לייפר', 'מדריך אונליין · לימוד · מפגשים בישראל', 'frank'),
    'en': ('NeuroGraphica', 'with Sandra Leifer', 'online guide · learning · sessions in Israel', 'corm'),
}
gold, cream, soft = (230, 196, 140), (246, 240, 230), (225, 218, 210)
for lang, (big, sub, line, face) in TEXT.items():
    art = Image.open(ROOT / 'dist/assets/img/works/stained-1600.webp').convert('RGB')
    art = ImageEnhance.Brightness(ImageOps.fit(art, (W, H), centering=(.5, .5))).enhance(.75)
    # dark band behind the text: left for Russian and English, right for Hebrew
    shade = Image.linear_gradient('L').rotate(-90 if lang == 'he' else 90).resize((W, H))
    dark = Image.new('RGB', (W, H), (12, 10, 18))
    bg = Image.composite(art, dark, shade.point(lambda v: int(max(0, min(255, v * 1.6 - 150)))))
    d = ImageDraw.Draw(bg)
    title = ImageFont.truetype(str(F / f'{face}.ttf'), 120)
    subf = ImageFont.truetype(str(F / f'{face}.ttf'), 58)
    small = ImageFont.truetype(str(F / 'rubik.ttf'), 28)
    url = ImageFont.truetype(str(F / 'corm.ttf'), 32)
    rows = [(big, title, cream, 150), (sub, subf, gold, 290), (line, small, soft, 400)]
    for text, font, fill, y in rows:
        s = text[::-1] if lang == 'he' else text
        w = d.textlength(s, font=font)
        x = W - 80 - w if lang == 'he' else 80
        d.text((x, y), s, font=font, fill=fill)
    lx = W - 80 - 90 if lang == 'he' else 80
    d.line((lx, 470, lx + 90, 470), fill=gold, width=2)
    w = d.textlength('sandraleifer.com', font=url)
    d.text((W - 80 - w if lang == 'he' else 80, 490), 'sandraleifer.com', font=url, fill=gold)
    bg.save(ROOT / f'dist/assets/img/og-neurographica-{lang}.jpg', 'JPEG', quality=84, optimize=True, progressive=True)
    print(lang, (ROOT / f'dist/assets/img/og-neurographica-{lang}.jpg').stat().st_size)
