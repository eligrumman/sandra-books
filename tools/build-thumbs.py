#!/usr/bin/env python3
"""Hero-wall thumbnails: <id>-480.webp next to every wall image (works and body-art photos).
The home wall shows tiles 145-290 CSS px wide; the 800 files (60-380 KB each) made the phone wait.
Source: the largest existing variant (1600 when present, else 800); the originals stay untouched.
Prints each body-art photo's average colour (the tile placeholder; it goes into body-art-data.js as c).
Run: python3 -E tools/build-thumbs.py   (only writes missing thumbs; --force rewrites them)"""
import sys
from pathlib import Path
from PIL import Image

IMG = Path(__file__).resolve().parent.parent / 'dist' / 'assets' / 'img'
W, Q = 480, 72
force = '--force' in sys.argv


def source(folder, wid):
    for w in (1600, 800):
        p = folder / f'{wid}-{w}.webp'
        if p.exists():
            return p
    return None


def main():
    total = 0
    for sub in ('works', 'body-art'):
        folder = IMG / sub
        ids = sorted({p.name.rsplit('-', 1)[0] for p in folder.glob('*-800.webp')})
        for wid in ids:
            src, out = source(folder, wid), folder / f'{wid}-{W}.webp'
            im = Image.open(src).convert('RGB')
            if sub == 'body-art':
                c = im.resize((1, 1), Image.Resampling.BOX).getpixel((0, 0))
                print(f"{wid} c: '#%02x%02x%02x'" % c)
            if out.exists() and not force:
                continue
            if im.width > W:
                im = im.resize((W, round(im.height * W / im.width)), Image.Resampling.LANCZOS)
            im.save(out, 'WEBP', quality=Q, method=6)
            total += out.stat().st_size
            print(out.relative_to(IMG), im.size, out.stat().st_size // 1024, 'KB')
    print('written KB', total // 1024)


if __name__ == '__main__':
    main()
