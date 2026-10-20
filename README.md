# Sandra Leifer — artist website

Static trilingual (Hebrew / Russian / English) site for the artist Sandra Leifer, published at sandraleifer.com through GitHub Pages. No build step and no server: `dist/` is the site.

## Structure
- `dist/index.html`: home page with hero, scroll journey, series, gallery with lightbox, exhibition and workshops, about, stories and contact.
- `dist/assets/js/data.js`: all text (`text.he`, `text.ru`, `text.en`), the artworks, their series and captions. Texts given as arrays are `[he, ru, en]`.
- `dist/museum/`: the 3D exhibition. It hangs every work of Sandra's catalog at its real size (canvases in a thin frame, works on paper behind a mat) in one room per series, with a wall label beside each work and a card with the price, the description and a purchase link. Hebrew, Russian and English.
- `dist/assets/js/catalog.js`: generated from Sandra's catalog (`src/catalog/`, exported from https://sites.google.com/view/sandra-leifer-art). For the 39 works in it, it sets the title, technique, size, year, price or status and the description, and it adds the works that were not on the site. Do not edit by hand.
- `dist/assets/js/images.js`: generated image sizes and placeholder colours. Do not edit by hand.
- `dist/book/`: the illustrated reader *Сказка о единороге / סיפור על החד־קרן* (29 pages, Hebrew and Russian).
- `dist/dragon/`: the new tale *Сказка о драконе / סיפור על הדרקון*, a light edit of Sandra's recorded Russian text with a Hebrew translation. It is a draft for her approval. Editorial notes are in `src/dragon-story.json`.
- `src/art/`: artwork images from the Under 1000 gallery (`sources.json` gives their origins); `src/art/catalog/` holds photos from Sandra's catalog.
- `tools/build-catalog.py`: rebuilds `catalog.js` from `src/catalog/`. To import a new export of the catalog: `python3 tools/build-catalog.py <export folder with catalog.csv and artworks/>`, then `python3 tools/build-images.py <originals>` if it brought new photos. Each catalog number is mapped to a site work in `IDS`.
- `tools/build-images.py`: rebuilds `dist/assets/img/` from the photographer's originals: `python3 tools/build-images.py <folder with ALX_*.jpg>`. Add new works to `WORKS` there and to `works` in `data.js`.

## Checks
`node check.mjs` (book) and `node check-site.mjs` (site). Both run in the Pages workflow before each deployment.

## Hosting
`.github/workflows/pages.yml` publishes `dist/` on every push to `main`. The custom domain is set in Settings → Pages. DNS is at Cloudflare (A records to GitHub Pages and `www` CNAME), so hosting can move, for example to Cloudflare Pages with output directory `dist`, by changing DNS only.

A mirror for networks that block the domain is published by `eligrumman/sandra-preview` at https://eligrumman.github.io/sandra-preview/.

## Content to confirm with Sandra
The catalog gives the technique in English only; English shows it as written, and the Hebrew and Russian wording is in `MEDIUM` in `tools/build-catalog.py`. No. 18 of the catalog, *Fire Amid the Ice*, is not on the site: the export carries the photo of *Electric Equine Drift* (`horse`, a different painting) for it. Add its own photo to `src/art/catalog/`, map it in `IDS` and rebuild. The photos of *The Raven's Secret* (4:5) and *Beyond* are cropped differently from the works' catalog sizes, so the museum crops them slightly to the real proportions; new photos would fix that. The book and the dragon tale exist in Hebrew and Russian only. Ten works on the site are not in the catalog: Electric Equine Drift (`horse`, 50 × 50, linked to its Under 1000 page), and the neurographics spiral, stained, tree, vortex and neuro, the drawing and the body-art photos gaze, smoke and petals, whose titles are still working titles in `data.js`, without size or price. The "details and purchase" button opens the work's page at the Under 1000 gallery for the 18 works listed there (`src/under1000/artworks.json`, mapped in `SHOP` in `tools/build-catalog.py`), and the contact section for the others. Where the catalog and the gallery disagree (prices of To Be, Flash, Gaze of Nature, Winter Tale and Encounter; the titles of the last three; the Alchemist sold or on sale), the site shows the catalog until Sandra confirms. The gallery's sizes of Winter Village Dream and Reclining Figure Study do not match the orientation of their photos.

## Rights
No open-source or redistribution license is granted. Rights to the artworks, story texts and illustrations remain with their respective rights holders.
