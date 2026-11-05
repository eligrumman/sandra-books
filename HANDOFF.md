# Handoff from the cloud session (2026-11-05)

Context from the cloud session that built the current site, for the agent taking over.
Everything below that is code or data is already in the repository; this file records what is
not: open requests, decisions waiting on Sandra, and how the pieces fit together.
The last deployed commit is `683997c` (on `main` and on `claude/jolly-cori-289j0t`).

## How the site is built and published
- `dist/` is the site. It is committed, including generated files; there is no build step in CI.
- `.github/workflows/pages.yml` publishes `dist/` to GitHub Pages (sandraleifer.com, DNS at
  Cloudflare) on every push to `main`, after `node check.mjs` (which also runs `check-site.mjs`).
- Generators, run locally and committed:
  - `python3 -I tools/build-catalog.py [export-dir]` → `dist/assets/js/catalog.js` from `src/catalog/`
    (Sandra's Google Sites catalog; the only source of titles, prices, sizes, descriptions).
  - `python3 -I tools/build-images.py <dir with ALX_*.jpg>` → `dist/assets/img/` and `images.js`.
    The ALX originals are NOT in the repo (hundreds of MB). They are in the photographer's Google
    Drive folder `1zqqANwpQnWdxyLobX_tiMuHZ-A0uVyeo`. Only 39 of ~103 were ever downloaded (the
    Drive connector failed above ~5.7 MB per file); the other 64 large originals were never used.
  - `node tools/build-pages.mjs` → `dist/index.html`, `dist/ru/`, `dist/en/`, 159 work pages under
    `works/`, `sitemap.xml`, `robots.txt`, from the template `src/site/home.html`. Edit the template,
    not `dist/index.html`. Run it after any change to `data.js` or the catalog.
  - `python3 -I tools/build-dragon.py [folder with page-NN.png]` → `dist/dragon/`.
- Preview mirror for networks that block the domain: `eligrumman/sandra-preview` publishes branch
  `feat/immersive-artist-portfolio` of this repo (where `portfolio` is a symlink to `dist`). To
  refresh it the cloud session merged its branch into `feat/immersive-artist-portfolio`, pushed, and
  edited the "Last refreshed" line of the sandra-preview README to trigger its workflow.
- The GitHub App used by the cloud session could not change workflow files; that is why
  `check-site.mjs` is chained from `check.mjs` instead of being its own workflow step.

## Waiting on Sandra (do not guess these)
1. Prices where her catalog and the Under 1000 gallery disagreed (the site shows the catalog):
   To Be (₪6,500 vs ₪5,000), Flash (₪5,000 vs ₪3,300), Gaze of Nature (₪5,500 vs ₪2,600),
   Winter Tale (₪2,500 vs ₪1,200), Encounter (₪1,800 vs ₪970).
2. Titles that differ between the two: Gaze of Nature / Rooted Reverie, Winter Tale / Winter Village
   Dream, Encounter / Celestial Encounter. The site uses the catalog titles.
3. The Alchemist: the catalog says private collection; Under 1000 listed it for sale (₪3,500).
4. Catalog No. 18, *Fire Amid the Ice*, carries the photo of *Electric Equine Drift* (`horse`). They
   are different paintings per the owner; Fire Amid the Ice is off the site until it has a photo.
   Possibly the same painting under two names; ask Sandra.
5. Sizes in Under 1000 that contradict their photos' orientation: Winter Village Dream (30×42 listed,
   landscape photo), Reclining Figure Study (42×30 listed, portrait photo).
6. 15 works on the site are not in her catalog and have no price (Electric Equine Drift, the
   neurographics spiral/stained/tree/vortex/neuro, Tidal Spiral, Chromatic Veins, the pastel drawing,
   Reclining Figure Study, the body-art photos). Their Russian titles were translated by us, and
   several Hebrew titles are working titles. If she adds them to the catalog, map them in `IDS`.
7. The photos of The Raven's Secret (4:5) and Beyond do not match their catalog proportions; the
   museum crops them slightly. New photos would fix it.
8. The dragon tale (`dist/dragon/`, `src/dragon-story.json`) is a light edit of her recorded Russian
   text with a Hebrew translation, awaiting her approval, and still has placeholder illustrations.

## Open requests from the owner
- **Dragon illustrations**: to be generated in ChatGPT with the prompts in `src/dragon-book/prompts.md`
  (also Google Doc `1xuq9OdQ4e71U9On8f_Pu058-d-XapRiM8bpCdhXwGyY`), saved as `page-00.png`…`page-29.png`
  into Drive folder "איורי הדרקון" (`1J-0NR9jwJHUkaQaP6WMMDM_3TsSJt4Xc`), then
  `python3 -I tools/build-dragon.py <folder>`.
- **Search Console / Bing**: the owner has to verify `sandraleifer.com` (TXT record at Cloudflare) and
  submit `https://sandraleifer.com/sitemap.xml`. Not confirmed as done.
- **Social profiles**: none linked yet. When Sandra has Instagram/Facebook, add them to `SAME_AS` in
  `tools/build-pages.mjs` (schema.org Person) and rebuild pages.
- Possible next steps that were discussed but not requested: analytics with WhatsApp-click tracking, a
  workshop sign-up page, a newsletter.

## Decisions the owner made (keep them)
- Contact is Sandra's WhatsApp only, +972 53-538-0014 (`whatsapp` in `data.js`); every purchase button
  opens a chat with a prefilled message about the work (`SITE.waWork`). No email or phone links.
- No reference to the Under 1000 gallery anywhere on the site (Sandra's request); `check-site.mjs`
  fails if one appears.
- Prices and details only from her Google Sites catalog.
- Three languages: Hebrew (default, `/`), Russian (`/ru/`), English (`/en/`).
- Home opens on the endless wall (slow, capped speed, drifts left and down, translucent down arrow);
  the gallery shows 12 works with "all works"; the circle-reveal section and the Sandravision /
  into-the-painting concepts were removed.
- Fonts: Amatic SC headings, Fredoka (he/en) and Comfortaa (ru). Amatic's Hebrew yod looks like vav,
  so the share image (`tools/og.py`) spells her name in Frank Ruhl.
- Museum (`dist/museum/`): every catalog work at real size, three rooms by series (paint, hidden,
  neuro), signs over doorways both ways, doorways offset so they frame works, no bench. On wide
  screens the card sits beside the work with the description open; on phones a bottom bar with the
  description on demand, the camera frames the painting alone, the joystick and language switch hide
  while looking at a work, previous/next arrows sit together on the left, zoom only for the work in
  focus.
- In the gallery lightbox, phones get the image first with the description on demand; wide screens
  show details beside the work.
- `dist/concepts/` holds the earlier design options (noindex, disallowed in robots.txt); the owner
  favoured the endless wall, the walk, the museum and the timeline.
