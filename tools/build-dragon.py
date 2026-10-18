#!/usr/bin/env python3
"""Build the dragon tale as an illustrated reader in the same format as the unicorn book.

Usage: python3 tools/build-dragon.py [folder with page-00.png ... page-29.png]

Text comes from src/dragon-book/book.json and book-ru.json. The reader code is
the unicorn reader in dist/book/, copied with its own titles and storage keys.
Illustrations generated for the tale (see src/dragon-book/prompts.md) are taken
from the given folder; any page without one gets a parchment placeholder.
"""
import json, shutil, sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SRC, BOOK, OUT = ROOT / 'src/dragon-book', ROOT / 'dist/book', ROOT / 'dist/dragon'
ART = Path(sys.argv[1]) if len(sys.argv) > 1 else None
TEXT_TOP = 0.38  # illustrations leave the top of the page empty for text; the reader shows the rest

he = json.loads((SRC / 'book.json').read_text())
ru = json.loads((SRC / 'book-ru.json').read_text())
starts = [next(p['n'] for p in he if p['chapter'] == c and p['n']) for c in (1, 2, 3, 4)]

OUT.mkdir(parents=True, exist_ok=True)
for f in OUT.iterdir():
    if f.is_file():
        f.unlink()
(OUT / 'assets').mkdir(exist_ok=True)

# Reader code: the unicorn reader with its own storage keys.
(OUT / 'app.js').write_text((BOOK / 'app.js').read_text().replace("'unicorn-", "'dragon-"))
shutil.copy(BOOK / 'style.css', OUT / 'style.css')

# Text and illustrations.
font = ImageFont.truetype(str(ROOT / 'tools/fonts/frank.ttf'), 46)
small = ImageFont.truetype(str(ROOT / 'tools/fonts/rubik.ttf'), 30)


def placeholder(n, title):
    im = Image.new('RGB', (1024, 1536), (244, 236, 219))
    noise = Image.effect_noise((1024, 1536), 18).convert('L')
    im = Image.blend(im, Image.merge('RGB', [noise.point(lambda v: v * .95 + 10)] * 3), .05)
    d = ImageDraw.Draw(im)
    box = (90, int(1536 * TEXT_TOP) + 40, 934, 1460)
    d.rounded_rectangle(box, 420, outline=(196, 170, 128), width=3)
    cx, cy = 512, (box[1] + box[3]) // 2
    for text, f, y, fill in ((title, font, cy - 40, (110, 82, 50)), ('האיור בדרך · Иллюстрация скоро', small, cy + 40, (150, 126, 96))):
        w = d.textlength(text, font=f, direction='rtl' if f is font else None, language='he' if f is font else None)
        d.text((cx - w / 2, y), text, font=f, fill=fill, direction='rtl' if f is font else None, language='he' if f is font else None)
    return im


for page_he, page_ru in zip(he, ru):
    n = page_he['n']
    src = ART / f'page-{n:02d}.png' if ART else None
    if src and src.exists():
        im = ImageOps.fit(Image.open(src).convert('RGB'), (1024, 1536))
    elif n == 0:  # temporary cover: Sandra's winter painting with the dragon in it
        im = ImageOps.fit(Image.open(ROOT / 'src/art/winter.webp').convert('RGB'), (1024, 1536), centering=(.72, .5))
    else:
        im = placeholder(n, page_he['title'])
    im.save(OUT / 'assets' / f'page-{n:02d}.webp', 'WEBP', quality=82, method=6)
    for p in (page_he, page_ru):
        p['start'] = 0 if n == 0 else TEXT_TOP
        p['end'] = 1
(OUT / 'book.json').write_text(json.dumps(he, ensure_ascii=False, indent=2) + '\n')
(OUT / 'book-ru.json').write_text(json.dumps(ru, ensure_ascii=False, indent=2) + '\n')

# Interface text: the unicorn's, with the tale's own titles.
loc = json.loads((BOOK / 'locales.json').read_text())
loc['he'].update({
    'brand': 'סיפור על הדרקון', 'eyebrow': 'אגדה חדשה', 'title': 'סיפור על\nהדרקון', 'ch2short': 'הדרקון',
    'intro': 'בעמק נסתר בין הרים גבוהים\nחי הדרקון האחרון.\nומה שקרה לו שינה את העמק לתמיד.',
    'meta': '29 עמודים · לגילאי 6–12', 'watercolor': 'אגדה מאת סנדרה לייפר', 'ending': 'וזה כל הסיפור.',
    'footer': 'סיפור על הדרקון · סנדרה לייפר', 'ch1': 'עמק הדרקונים', 'ch2': 'החורף ומקדש האש', 'ch3': 'רוח הצפון', 'ch4': 'נדיה והברית',
    'reviewIntro': 'הנוסח נערך מתוך ההקלטה של סנדרה ברוסית ותורגם לעברית. השמטנו מילות קישור של דיבור ותיקנו את המשפטים, בלי לשנות את העלילה. כאן כמה נקודות שכדאי שסנדרה תחליט עליהן.',
    'corrections': 'מה השתנה בעריכה', 'coverAlt': 'דרקון כחול מעל כפר מושלג, ציור של סנדרה לייפר', 'load': 'פותחים את האגדה…'})
loc['ru'].update({
    'brand': 'Сказка о драконе', 'eyebrow': 'Новая сказка', 'title': 'Сказка\nо драконе', 'ch2short': 'о драконе',
    'intro': 'В долине, затерянной среди высоких гор,\nжил последний дракон.\nИ то, что с ним случилось, изменило долину навсегда.',
    'meta': '29 страниц · 6–12 лет', 'watercolor': 'Сказка Сандры Лейфер', 'ending': 'Вот такая вот история.',
    'footer': 'Сказка о драконе · Сандра Лейфер', 'ch1': 'Долина драконов', 'ch2': 'Зима и святилище огня', 'ch3': 'Северный Ветер', 'ch4': 'Надия и договор',
    'reviewIntro': 'Текст отредактирован по аудиозаписи Сандры и переведён на иврит. Мы убрали слова-паразиты устной речи и выправили фразы, не меняя сюжета. Ниже несколько мест, о которых стоит решить Сандре.',
    'corrections': 'Что изменилось при редактуре', 'coverAlt': 'Синий дракон над заснеженной деревней, картина Сандры Лейфер', 'load': 'Открываем сказку…'})
(OUT / 'locales.json').write_text(json.dumps(loc, ensure_ascii=False, indent=2) + '\n')

notes_he = [
    {'title': 'צהובות או זהובות?', 'pages': [1, 23], 'detail': 'בתחילת הסיפור עיני הדרקון צהובות, ואחרי שהוא מחלים הן זהובות. להשאיר כך או לאחד?'},
    {'title': 'רוח הצפון בעברית', 'pages': [18, 19], 'detail': 'ברוסית הרוח היא ״הוא״. בעברית ״רוח״ היא נקבה, ולכן רוח הצפון היא ״חברה״ של הדרקון. זה בסדר?'},
    {'title': '״לא רצה למות פעמיים״', 'pages': [22], 'detail': 'בהקלטה המשפט נקטע (״Он не хотел умирать вторым…״). פירשנו: לא היה לו מה להפסיד, כי הוא ממילא גוסס. כדאי לוודא.'},
    {'title': 'זקן הכפר', 'pages': [8, 20], 'detail': 'בהקלטה מופיעים גם ״староста״ וגם ״старейшина״. איחדנו לדמות אחת: זקן הכפר.'},
]
notes_ru = [
    {'title': 'Жёлтые или золотые?', 'pages': [1, 23], 'detail': 'В начале глаза дракона жёлтые, после исцеления — золотые. Оставить так или сделать одинаково?'},
    {'title': 'Северный Ветер на иврите', 'pages': [18, 19], 'detail': 'На иврите слово «ветер» женского рода, поэтому Ветер там — «подруга» дракона. Так можно?'},
    {'title': '«Не хотел умирать вторым…»', 'pages': [22], 'detail': 'На записи фраза оборвана. Мы поняли так: терять ему было нечего, он и так умирал. Стоит проверить.'},
    {'title': 'Староста и старейшина', 'pages': [8, 20], 'detail': 'На записи встречаются оба слова. Мы оставили одного героя — старейшину.'},
]
edits_he = [{'page': 1, 'before': 'הטקסט המוקלט', 'after': 'הוסרו מילות מילוי של דיבור (״вот״, ״ну״, ״как бы״) וחזרות, והמשפטים הארוכים חולקו.'}]
edits_ru = [{'page': 1, 'before': 'Текст записи', 'after': 'Убраны слова-паразиты («вот», «ну», «как бы») и повторы, длинные фразы разделены.'}]
for name, notes, edits in (('audit.json', notes_he, edits_he), ('audit-ru.json', notes_ru, edits_ru)):
    (OUT / name).write_text(json.dumps({'pages': 29, 'corrections': edits, 'notes': notes}, ensure_ascii=False, indent=2) + '\n')

# Page markup: the unicorn's index with the tale's titles, chapter starts and link preview.
html = (BOOK / 'index.html').read_text()
for a, b in [('סיפור על החד־קרן · סנדרה לייפר', 'סיפור על הדרקון · סנדרה לייפר'), ('סיפור על החד־קרן', 'סיפור על הדרקון'),
             ('החד־קרן', 'הדרקון'), ('#263c35', '#1d2440'), ('https://sandraleifer.com/book/', 'https://sandraleifer.com/dragon/'),
             ('ספר מאויר מאת סנדרה לייפר, בעברית וברוסית.', 'אגדה חדשה מאת סנדרה לייפר, בעברית וברוסית.'),
             ('אגדה על אומץ, חמלה וחברות.', 'אגדה על הדרקון האחרון בעמק.'),
             ('ילדה וחד־קרן לבן נפגשים ליד אגם בין ההרים', 'דרקון כחול מעל כפר מושלג')]:
    html = html.replace(a, b)
for old, new in zip((1, 9, 15, 21), starts):
    html = html.replace(f'data-go="{old}"', f'data-go="{new}"', 1)
(OUT / 'index.html').write_text(html)
print('dragon reader built; chapter starts', starts, '; illustrations from', ART or 'placeholders')
