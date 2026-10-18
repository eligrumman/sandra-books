#!/usr/bin/env python3
"""Build web images for the site.

Usage: python3 tools/build-images.py <originals-dir>

<originals-dir> holds the photographer's JPEG originals (ALX_*.jpg) from the
shared Drive folder. Artworks that come from the Under 1000 gallery are read
from src/art/. Output goes to dist/assets/img/ together with
dist/assets/js/images.js, which records each image's size and average colour
so the page can reserve space and paint a placeholder before images load.
"""
import json, sys
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
RAW = Path(sys.argv[1]) if len(sys.argv) > 1 else None
OUT = ROOT / 'dist/assets/img'

# id -> source. "raw:" = photographer original, "art:" = src/art file.
WORKS = {
    # Neurographics
    'vortex': 'raw:ALX_0100.jpg', 'mosaic': 'raw:ALX_0116.jpg', 'stargaze': 'raw:ALX_0137.jpg',
    'stained': 'raw:ALX_0161.jpg', 'spiral': 'raw:ALX_0167.jpg', 'threads': 'raw:ALX_0102.jpg',
    'neuro': 'art:neuro.webp', 'tree': 'art:tree.webp',
    # Hidden worlds
    'lilac-dance': 'raw:ALX_0103.jpg', 'night-faces': 'raw:ALX_0106.jpg', 'stone-dream': 'raw:ALX_0110.jpg',
    'forest-moon': 'raw:ALX_0112.jpg', 'old-bridge': 'raw:ALX_0114.jpg', 'red-forest': 'raw:ALX_0117.jpg',
    'europa': 'raw:ALX_0119.jpg', 'water-whisper': 'raw:ALX_0125.jpg', 'lilac-gazes': 'raw:ALX_0128.jpg',
    'earth-profile': 'raw:ALX_0135.jpg', 'forest-giants': 'raw:ALX_0148.jpg',
    # Painting & drawing
    'horse': 'art:horse.webp', 'alchemist': 'art:alchemist.webp', 'mermaid': 'raw:ALX_0134.JPG',
    'blue-tree': 'raw:ALX_0139.JPG', 'blue-horses': 'raw:ALX_0147.jpg', 'star-voyage': 'raw:ALX_0122.jpg',
    'embrace': 'raw:ALX_0129.jpg', 'winter': 'art:winter.webp', 'drawing': 'art:drawing.webp',
    # Canvases sent in chat (about 1500px; replace with the originals when available)
    'tree-tears': 'art:tree-tears.jpg', 'serpent': 'art:serpent.jpg', 'night-light': 'art:night-light.jpg',
    'two-profiles': 'art:two-profiles.jpg', 'blue-current': 'art:blue-current.jpg',
    'angels': 'art:angels.jpg', 'flute': 'art:flute.jpg', 'skull': 'art:skull.jpg', 'cosmic-face': 'art:cosmic-face.jpg',
    # Body art
    'gaze': 'art:gaze.webp', 'smoke': 'art:smoke.webp', 'petals': 'art:petals.webp',
}
STUDIO = {
    'ws-0': 'art:ws-bowl.jpg',
    'hall-1': 'ALX_2948.jpg', 'hall-2': 'ALX_2950.jpg', 'hall-3': 'ALX_2973.jpg', 'hall-4': 'ALX_2988.jpg',
    'ws-1': 'ALX_2996.jpg', 'ws-2': 'ALX_2956.jpg', 'ws-3': 'ALX_2961.jpg', 'ws-4': 'ALX_2975.jpg',
    'ws-5': 'ALX_2966.jpg', 'ws-6': 'ALX_2987.jpg', 'ws-7': 'ALX_2995.jpg',
}
# Crop boxes (left, top, right, bottom as fractions) that remove mats and frames in the photographs.
CROP = {
    'ALX_0119.jpg': (.03, .035, .97, .945), 'ALX_0135.jpg': (.07, .06, .93, .945),
    'flute.jpg': (.025, .03, .975, .965), 'ALX_0117.jpg': (.04, .02, .965, .975), 'ALX_0137.jpg': (.015, .01, .985, .99),
}
LARGE = {'angels', 'flute', 'skull', 'cosmic-face', 'serpent', 'tree-tears', 'night-light', 'two-profiles', 'night-faces', 'embrace', 'star-voyage', 'stargaze', 'spiral', 'mosaic', 'blue-tree', 'red-forest', 'europa', 'stained', 'mermaid', 'lilac-dance'}


def load(src):
    kind, name = src.split(':', 1)
    path = (RAW / name) if kind == 'raw' else (ROOT / 'src/art' / name)
    im = ImageOps.exif_transpose(Image.open(path)).convert('RGB')
    if name in CROP:
        l, t, r, b = CROP[name]
        im = im.crop((round(l * im.width), round(t * im.height), round(r * im.width), round(b * im.height)))
    return im


def avg_colour(im):
    c = im.resize((1, 1), Image.Resampling.BOX).getpixel((0, 0))
    return '#%02x%02x%02x' % c


def save(im, path, width, quality=80):
    if im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.Resampling.LANCZOS)
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, 'WEBP', quality=quality, method=6)
    return im.size


def main():
    if RAW is None or not RAW.is_dir():
        sys.exit('usage: build-images.py <originals-dir>')
    meta = {}
    for wid, src in WORKS.items():
        im = load(src)
        sizes = [800, 1600] + ([2400] if wid in LARGE else [])
        widths = []
        for w in sizes:
            got = save(im, OUT / 'works' / f'{wid}-{w}.webp', w)
            widths.append(w)
            if w >= im.width:
                break  # largest variant is the source size; no upscaling
        meta[wid] = {'w': got[0], 'h': got[1], 'c': avg_colour(im), 's': widths}
        print(wid, im.size, widths)
    studio = {}
    for sid, name in STUDIO.items():
        im = load(name if ':' in name else 'raw:' + name)
        got = save(im, OUT / 'studio' / f'{sid}.webp', 1400, 78)
        studio[sid] = {'w': got[0], 'h': got[1], 'c': avg_colour(im)}
    # Portrait, story covers and social preview
    save(load('art:portrait-workshop.jpg'), OUT / 'portrait-900.webp', 900)
    save(Image.open(ROOT / 'dist/book/assets/page-00.webp').convert('RGB'), OUT / 'unicorn-cover-900.webp', 900)
    save(load('art:winter.webp'), OUT / 'dragon-cover-900.webp', 900)
    # The link-preview image is rendered by tools/og.py.
    js = ROOT / 'dist/assets/js/images.js'
    js.parent.mkdir(parents=True, exist_ok=True)
    js.write_text('// Generated by tools/build-images.py: width, height, average colour, available widths.\n'
                  'window.IMAGES=' + json.dumps({'works': meta, 'studio': studio}, separators=(',', ':')) + ';\n')


if __name__ == '__main__':
    main()
