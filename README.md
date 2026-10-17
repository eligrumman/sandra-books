# Сказка о единороге / סיפור על החד־קרן

Illustrated book by Sandra. One static reader with Hebrew and Russian language selection, 29 story pages and a cover. The Russian text is a translation of the supplied Hebrew manuscript for author review. Illustrations are shared; five editorial questions remain for Sandra.

## Files
- `dist/`: ready-to-host static site, including images, both texts and translations.
- `story-pages.txt`: supplied Hebrew text; `dist/audit.json` records eight corrections.
- `story-ru.txt`: Russian translation, page title followed by text; pages separated by `===PAGE===`.
- `build-translations.py`: rebuild Russian book and editorial notes without modifying Hebrew.
- `check.mjs`: content completeness and reader interaction checks (Node.js).

## GitHub Pages
Upload this project to the chosen GitHub repository on branch `main`. In repository Settings → Pages, choose GitHub Actions as the source. The included `.github/workflows/pages.yml` publishes `dist/`. All URLs are relative and work under a project subpath. No secrets or server are required. This workflow is prepared but has not yet been run on GitHub.

Language is selected using the visible menu, or with `?lang=he` / `?lang=ru`. A link such as `?lang=ru#p=14` opens a specific page. The reader preserves the current page when switching languages and stores reading preferences locally on the device.

## Checks
Run `node check.mjs`. Browser layout verification could not be completed because the managed preview environment failed to start. Content and interaction checks use a DOM stub and do not replace browser testing.

## Rights
No open-source or redistribution license is granted by this repository. Rights to the story and illustrations remain with their respective rights holders.
