#!/usr/bin/env python3
"""Build dist/assets/js/catalog.js from Sandra's own catalog.

Usage:
  python3 tools/build-catalog.py                 # rebuild catalog.js from src/catalog
  python3 tools/build-catalog.py <export-dir>    # first import a new export of the Google Sites
                                                 # catalog (catalog.csv + artworks/NN - Title/)

src/catalog/catalog.csv and src/catalog/texts/<id>.md are copies of the export of
https://sites.google.com/view/sandra-leifer-art, which is the source of truth for titles,
technique, size, year, price, status and the description of every artwork.
The images of works that were not on this site yet are copied to src/art/catalog/<id>.jpg.

"""
import csv, json, re, shutil, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'src/catalog'

# Catalog number -> site work id. Matched image to image; the ones marked "new" were
# not on the site before and use the catalog photo.
# None: the export has no photo of the work itself. No. 18, Fire Amid the Ice, carries the photo of
# Electric Equine Drift (the site's 'horse'), a different painting; it waits for its own photo.
IDS = {
    1: 'flute', 2: 'night-faces', 3: 'blue-current', 4: 'earth-profile', 5: 'two-profiles',
    6: 'blue-horses', 7: 'red-forest', 8: 'raven', 9: 'quiet-tale', 10: 'stone-dream',
    11: 'europa', 12: 'unicorn-water', 13: 'angels', 14: 'forest-giants', 15: 'alchemist',
    16: 'lilac-gazes', 17: 'blue-tree', 18: None, 19: 'mermaid', 20: 'night-light',
    21: 'tree-tears', 22: 'forest-moon', 23: 'lilac-dance', 24: 'water-whisper', 25: 'serpent',
    26: 'star-wanderer', 27: 'star-voyage', 28: 'embrace', 29: 'shiva', 30: 'winter',
    31: 'old-bridge', 32: 'threads', 33: 'webs', 34: 'flowing', 35: 'mosaic',
    36: 'aspiration', 37: 'cosmic-face', 38: 'skull', 39: 'stargaze',
}
# Works new to the site: series they join.
NEW = {'raven': 'paint', 'quiet-tale': 'hidden', 'unicorn-water': 'hidden', 'star-wanderer': 'paint',
       'shiva': 'paint', 'webs': 'hidden', 'flowing': 'neuro', 'aspiration': 'neuro'}
# The catalog photo is sharper than the one the site had.
SHARPER = {'blue-current', 'tree-tears'}

# The catalog gives the technique in English only (kept as is for English).
MEDIUM = {
    'Acrylic on canvas': ('אקריליק על בד', 'Акрил на холсте'),
    'Canvas, acrylic': ('אקריליק על בד', 'Акрил на холсте'),
    'Canvas, ink': ('דיו על בד', 'Тушь на холсте'),
    'Acrylic and fabric on canvas': ('אקריליק ובד על בד', 'Акрил и ткань на холсте'),
    'Acrylic and pencils on paper': ('אקריליק ועפרונות על נייר', 'Акрил и карандаши на бумаге'),
    'Paper, acrylic, colored pencils': ('אקריליק ועפרונות צבעוניים על נייר', 'Акрил и цветные карандаши на бумаге'),
    'Paper, acrylic, pencil': ('אקריליק ועיפרון על נייר', 'Акрил и карандаш на бумаге'),
    'Paper, watercolor, colored pencils': ('צבעי מים ועפרונות צבעוניים על נייר', 'Акварель и цветные карандаши на бумаге'),
    'Paper, watercolor, gouache': ('צבעי מים וגואש על נייר', 'Акварель и гуашь на бумаге'),
    'Paper, watercolor, gouache, ink': ('צבעי מים, גואש ודיו על נייר', 'Акварель, гуашь и тушь на бумаге'),
    'Paper, watercolor, ink': ('צבעי מים ודיו על נייר', 'Акварель и тушь на бумаге'),
    'Paper, markers, colored pencils': ('טושים ועפרונות צבעוניים על נייר', 'Маркеры и цветные карандаши на бумаге'),
    'Paper, white pen': ('עט לבן על נייר', 'Белая ручка на бумаге'),
}
STATUS = {'Private Collection': ('באוסף פרטי', 'В частной коллекции', 'Private collection')}


def import_export(exp):
    SRC.mkdir(parents=True, exist_ok=True)
    (SRC / 'texts').mkdir(exist_ok=True)
    (ROOT / 'src/art/catalog').mkdir(parents=True, exist_ok=True)
    shutil.copy(exp / 'catalog.csv', SRC / 'catalog.csv')
    shutil.copy(exp / 'site-texts.md', SRC / 'site-texts.md')
    for d in sorted((exp / 'artworks').iterdir()):
        wid = IDS[int(d.name.split(' ', 1)[0])]
        if wid is None:
            continue
        shutil.copy(next(d.glob('*.md')), SRC / 'texts' / f'{wid}.md')
        if wid in NEW or wid in SHARPER:
            shutil.copy(next(d.glob('*.jpg')), ROOT / 'src/art/catalog' / f'{wid}.jpg')


def paragraphs(block):
    return [re.sub(r'\s+', ' ', p).strip() for p in block.strip().split('\n\n') if p.strip()]


def main():
    if len(sys.argv) > 1:
        import_export(Path(sys.argv[1]))
    rows = list(csv.DictReader(open(SRC / 'catalog.csv', encoding='utf-8-sig')))
    out = {}
    for r in rows:
        wid = IDS[int(r['#'])]
        if wid is None:
            continue
        md = (SRC / 'texts' / f'{wid}.md').read_text(encoding='utf-8')
        parts = dict(re.findall(r'^## (\S+)\n(.*?)(?=^## |\Z)', md, re.S | re.M))
        med = MEDIUM[r['Medium']]
        st = STATUS[r['Status']] if r['Status'] else None
        out[wid] = {
            # every text is [Hebrew, Russian, English]
            'no': int(r['#']), 't': [r['Title (HE)'], r['Title (RU)'], r['Title (EN)']],
            'med': [*med, r['Medium']], 's': r['Size (cm)'], 'y': r['Year'],
            'price': r['Price (ILS)'] or None, 'status': list(st) if st else None,
            'd': [paragraphs(parts['עברית']), paragraphs(parts['RU']), paragraphs(parts['EN'])],
        }
        if wid in NEW:
            out[wid]['kind'] = NEW[wid]
        assert all(out[wid]['d']), wid
    js = ROOT / 'dist/assets/js/catalog.js'
    js.write_text(
        "'use strict';\n"
        '// Generated by tools/build-catalog.py from src/catalog (Sandra\'s catalog). Do not edit by hand.\n'
        '// Titles, technique, size, year, price and description per work, each as [he, ru, en]; works new to the site are appended.\n'
        'window.CATALOG=' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n'
        '(function (S, C) {\n'
        '  for (const id in C) {\n'
        '    const c = C[id]; let w = S.works.find(x => x.id === id);\n'
        "    if (!w) { w = {id, kind: c.kind}; S.works.push(w); }\n"
        '    Object.assign(w, {t: c.t, med: c.med, s: c.s, y: c.y, price: c.price, status: c.status, d: c.d, no: c.no});\n'
        '  }\n'
        '})(window.SITE, window.CATALOG);\n', encoding='utf-8')
    print(len(out), 'catalog works ->', js.relative_to(ROOT))


if __name__ == '__main__':
    main()
