# Sandra Leifer — artist website

Static trilingual (Hebrew / Russian / English) site for the artist Sandra Leifer, published at sandraleifer.com through GitHub Pages. No build step and no server: `dist/` is the site.

## Structure
- `src/site/home.html`: the home page template. `tools/build-pages.mjs` writes it out as `dist/index.html` (Hebrew), `dist/ru/index.html` and `dist/en/index.html`, with the texts of each language already in the HTML, plus a page per work per language (`dist/works/<id>/`, `dist/ru/works/<id>/`, `dist/en/works/<id>/`), `dist/sitemap.xml` and `dist/robots.txt`. Edit the template or `data.js`, then run `node tools/build-pages.mjs`. Every page has its canonical address, hreflang links to the other two languages and schema.org data (Sandra as a Person under her name in all three languages; each work as a VisualArtwork with size, technique and, when on sale, its price).
- The home page: endless wall, series, gallery with lightbox, exhibition and workshops, about, stories and contact.
- `dist/assets/js/data.js`: all text (`text.he`, `text.ru`, `text.en`), the artworks, their series and captions. Texts given as arrays are `[he, ru, en]`.
- `dist/museum/`: the 3D exhibition. It hangs every work of Sandra's catalog at its real size (canvases in a thin frame, works on paper behind a mat) in one room per series, with a wall label beside each work and a card with the price, the description and a purchase link. Hebrew, Russian and English.
- `dist/assets/js/catalog.js`: generated from Sandra's catalog (`src/catalog/`, exported from https://sites.google.com/view/sandra-leifer-art). For the 39 works in it, it sets the title, technique, size, year, price or status and the description, and it adds the works that were not on the site. Do not edit by hand.
- `dist/assets/js/images.js`: generated image sizes and placeholder colours. Do not edit by hand.
- `dist/book/`: the illustrated reader *Сказка о единороге / סיפור על החד־קרן* (29 pages, Hebrew and Russian).
- `dist/dragon/`: the new tale *Сказка о драконе / סיפור על הדרקון*, a light edit of Sandra's recorded Russian text with a Hebrew translation. It is a draft for her approval. Editorial notes are in `src/dragon-story.json`.
- `src/art/`: artwork images that are not in the photographer's set (`sources.json` gives their origins); `src/art/more/` holds five works that are not in Sandra's catalog; `src/art/catalog/` holds photos from Sandra's catalog.
- `tools/build-catalog.py`: rebuilds `catalog.js` from `src/catalog/`. To import a new export of the catalog: `python3 tools/build-catalog.py <export folder with catalog.csv and artworks/>`, then `python3 tools/build-images.py <originals>` if it brought new photos. Each catalog number is mapped to a site work in `IDS`.
- `tools/build-images.py`: rebuilds `dist/assets/img/` from the photographer's originals: `python3 tools/build-images.py <folder with ALX_*.jpg>`. Add new works to `WORKS` there and to `works` in `data.js`.

## Search engines
After a deployment the site is ready to submit. In Google Search Console add the domain `sandraleifer.com` (verified by a TXT record at Cloudflare) and submit `https://sandraleifer.com/sitemap.xml`; the same in Bing Webmaster Tools. Old `?lang=ru` / `?lang=en` links redirect to `/ru/` and `/en/`. The preview mirror's pages point to sandraleifer.com as their canonical address, so they do not compete with it.

## Checks
`node check.mjs` (book) and `node check-site.mjs` (site). Both run in the Pages workflow before each deployment.

## Hosting
`.github/workflows/pages.yml` publishes `dist/` on every push to `main`. The custom domain is set in Settings → Pages. DNS is at Cloudflare (A records to GitHub Pages and `www` CNAME), so hosting can move, for example to Cloudflare Pages with output directory `dist`, by changing DNS only.

A mirror for networks that block the domain is published by `eligrumman/sandra-preview` at https://eligrumman.github.io/sandra-preview/.

## Content to confirm with Sandra
Titles, technique, size, year, price and descriptions come from Sandra's catalog only (Google Sites). The catalog gives the technique in English only; English shows it as written, and the Hebrew and Russian wording is in `MEDIUM` in `tools/build-catalog.py`. No. 18 of the catalog, *Fire Amid the Ice*, is not on the site: the export carries the photo of *Electric Equine Drift* (`horse`, a different painting) for it. Add its own photo to `src/art/catalog/`, map it in `IDS` and rebuild. The photos of *The Raven's Secret* (4:5) and *Beyond* are cropped differently from the works' catalog sizes, so the museum crops them slightly to the real proportions. The book and the dragon tale exist in Hebrew and Russian only. Fifteen works on the site are not in the catalog and have no price (Electric Equine Drift, the neurographics spiral, stained, tree, vortex, neuro, Tidal Spiral and Chromatic Veins, the drawing, Reclining Figure Study, and the body-art photos); their titles are working titles in `data.js`.

Contact is Sandra's WhatsApp (`whatsapp` in `data.js`). Every "details and purchase" button, on the site, in the museum and on the work pages, opens a chat with a message naming the work, its details and its page (`SITE.waWork`); the contact section opens a chat with a greeting (`SITE.waHello`). Works in a private collection have no purchase button.

## Rights
No open-source or redistribution license is granted. Rights to the artworks, story texts and illustrations remain with their respective rights holders.
