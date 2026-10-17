# Sandra Leifer — immersive portfolio preview

Isolated concept on `feat/immersive-artist-portfolio`. The existing book in `dist/`, production workflow and custom-domain configuration are not modified. Do not merge or deploy this branch over the book until explicitly requested.

## Experience
Six scroll-linked scenes alternate painting, body art and line work. Nine real artworks form a filterable gallery with keyboard-accessible lightbox. Includes Hebrew/Russian, a motion toggle, reduced-motion preference support, artist biography and a link to the existing book. Gallery links lead to Under 1000; no contact details, testimonials or services were invented.

Run `node check-portfolio.mjs` from repository root. CI validates interactions and uploads the static `portfolio/` directory as an artifact. Browser rendering has not been verified because the managed preview environment is unavailable. Source images were inspected in a contact sheet and all optimized files were decoded and checked.

## Preview hosting
GitHub Pages has one published site per repository. Publishing this branch to this repository's Pages site would replace the live book and affect sandraleifer.com. It is intentionally not deployed there.

For a separate GitHub Pages preview: use a second repository, place the contents of `portfolio/` at its published root, and enable Pages there. No custom domain is required. For Cloudflare Pages: choose this branch, no build command, output directory `portfolio`. Do not change production DNS for the preview.

## Content and images
`sources.json` records the original image URLs and Hebrew artwork titles from the artist's Under 1000 portfolio. Images are optimized locally for this preview, without changing the works. Body-art photographs are presented as portfolio photographs; photographer attribution needs confirmation for the final site. Russian artwork names are working translations.

Biography is based on the artist profile; no treatment claims, credentials or current workshop availability are inferred. Direct contact details, final biography, photographer credits and original full-resolution files can be supplied before the final release.

All rights remain with their respective rights holders. No redistribution license is granted.
