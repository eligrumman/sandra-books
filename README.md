# Sandra Leifer — artist website

Static bilingual (Hebrew / Russian) site for the artist Sandra Leifer, published at sandraleifer.com through GitHub Pages. No build step and no server: `dist/` is the site.

## Structure
- `dist/index.html`: home page with hero, scroll journey, series, gallery with lightbox, exhibition and workshops, about, stories and contact.
- `dist/assets/js/data.js`: all text (both languages), the artworks, their series and captions. Edit this file to change titles, techniques or text.
- `dist/assets/js/images.js`: generated image sizes and placeholder colours. Do not edit by hand.
- `dist/book/`: the illustrated reader *Сказка о единороге / סיפור על החד־קרן* (29 pages, Hebrew and Russian).
- `dist/dragon/`: the new tale *Сказка о драконе / סיפור על הדרקון*, a light edit of Sandra's recorded Russian text with a Hebrew translation. It is a draft for her approval. Editorial notes are in `src/dragon-story.json`.
- `src/art/`: artwork images from the Under 1000 gallery (`sources.json` gives their origins).
- `tools/build-images.py`: rebuilds `dist/assets/img/` from the photographer's originals: `python3 tools/build-images.py <folder with ALX_*.jpg>`. Add new works to `WORKS` there and to `works` in `data.js`.

## Checks
`node check.mjs` (book) and `node check-site.mjs` (site). Both run in the Pages workflow before each deployment.

## Hosting
`.github/workflows/pages.yml` publishes `dist/` on every push to `main`. The custom domain is set in Settings → Pages. DNS is at Cloudflare (A records to GitHub Pages and `www` CNAME), so hosting can move, for example to Cloudflare Pages with output directory `dist`, by changing DNS only.

A mirror for networks that block the domain is published by `eligrumman/sandra-preview` at https://eligrumman.github.io/sandra-preview/.

## Content to confirm with Sandra
Titles of the newly photographed works are working titles, and their technique is given generally ("mixed media on paper", "ink and markers on paper"). Confirm or replace them in `data.js`.

## Rights
No open-source or redistribution license is granted. Rights to the artworks, story texts and illustrations remain with their respective rights holders.
