// Static checks for the artist site in dist/: content integrity, translations and local references.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const root = new URL('./dist/', import.meta.url);
const read = p => fs.readFileSync(new URL(p, root), 'utf8');
const exists = p => fs.existsSync(new URL(p, root));
const ctx = vm.createContext({window: {}});
vm.runInContext(read('assets/js/images.js') + read('assets/js/data.js') + read('assets/js/catalog.js') + read('assets/js/body-art-data.js'), ctx);
const {SITE, IMAGES, CATALOG} = ctx.window;

// Works: unique, in a known series, with generated images.
const ids = SITE.works.map(w => w.id);
assert.equal(new Set(ids).size, ids.length, 'duplicate work id');
const series = new Set(SITE.series.map(s => s.id));
for (const w of SITE.works) {
  assert.ok(series.has(w.kind), `${w.id}: unknown series ${w.kind}`);
  assert.ok(w.t[0] && w.t[1] && w.t[2], `${w.id}: title in three languages`);
  assert.ok(w.med ? w.med[0] && w.med[1] && w.med[2] : SITE.text.he[w.m] && SITE.text.ru[w.m], `${w.id}: medium`);
  const m = IMAGES.works[w.id];
  assert.ok(m, `${w.id}: no image metadata`);
  for (const size of m.s) assert.ok(fs.statSync(new URL(`assets/img/works/${w.id}-${size}.webp`, root)).size > 5000, `${w.id}-${size}`);
}
// Sandra's catalog: every entry is a work on the site with size, year, price or status and a description.
assert.equal(Object.keys(CATALOG).length, 38, 'catalog size (39 less Fire Amid the Ice, which waits for its own photo)');
for (const [id, c] of Object.entries(CATALOG)) {
  assert.ok(ids.includes(id), `catalog ${id} not on the site`);
  assert.match(c.s, /^\d+ × \d+$/, `${id}: size`);
  assert.match(c.y, /^20\d\d(–20\d\d)?$/, `${id}: year`);
  assert.ok(c.price ? /^₪[\d,]+$/.test(c.price) : c.status, `${id}: price or status`);
  assert.ok(c.d[0].length && c.d[1].length && c.d[2].length, `${id}: description in three languages`);
}
for (const s of SITE.series) {
  assert.ok(SITE.works.some(w => w.kind === s.id), `empty series ${s.id}`);
  assert.ok(ids.includes(s.cover), `series cover ${s.cover}`);
}
for (const id of [...SITE.hero, ...SITE.journey.map(j => j.id)]) assert.ok(ids.includes(id), `hero/journey ${id}`);
for (const s of [...SITE.studio, ...SITE.exhibition]) assert.ok(exists(`assets/img/studio/${s.id}.webp`) && s.he && s.ru && s.en, `studio ${s.id}`);
for (const s of SITE.series) assert.ok(s.he && s.ru && s.en, `series ${s.id} in three languages`);

// Translations: same keys in Hebrew, Russian and English, and every data-t key defined.
const he = Object.keys(SITE.text.he), ru = Object.keys(SITE.text.ru), en = Object.keys(SITE.text.en);
assert.deepEqual([...he].sort(), [...ru].sort(), 'Hebrew and Russian keys differ');
assert.deepEqual([...he].sort(), [...en].sort(), 'Hebrew and English keys differ');
const html = read('index.html');
for (const [, key] of html.matchAll(/data-t(?:-label|-alt)?="([^"]+)"/g)) assert.ok(key in SITE.text.he, `missing text key ${key}`);
for (const j of SITE.journey) assert.ok(j.he.length === 2 && j.ru.length === 2);

// Local references in every page resolve.
const workPages = ['', 'ru/', 'en/'].flatMap(p => SITE.works.map(w => `${p}works/${w.id}/index.html`));
for (const page of ['index.html', 'ru/index.html', 'en/index.html', 'museum/index.html', 'dragon/index.html', 'book/index.html', 'neurographics/index.html', 'about/index.html', 'ru/about/index.html', 'en/about/index.html', 'body-art/index.html', 'ru/body-art/index.html', 'en/body-art/index.html', 'mirror-room/index.html', 'neurographica/index.html', 'ru/neurographica/index.html', 'en/neurographica/index.html', ...workPages]) {
  const dir = page.includes('/') ? page.slice(0, page.lastIndexOf('/') + 1) : '';
  for (const [, ref] of read(page).matchAll(/(?:src|href)="([^"#?]+)[^"]*"/g)) {
    if (/^(https?:|mailto:|tel:|data:)/.test(ref) || ref.endsWith('/')) continue;
    assert.ok(exists(dir + ref), `${page}: missing ${ref}`);
  }
}
for (const dir of ['book/', 'dragon/', 'museum/']) assert.ok(exists(dir + 'index.html'), dir);
// Search engines: a page per language and per work, each with its language, canonical address,
// the three hreflang alternates and readable structured data; all of them in the sitemap.
const SITE_URL = 'https://sandraleifer.com/';
const sitemap = read('sitemap.xml');
assert.ok(read('robots.txt').includes(`Sitemap: ${SITE_URL}sitemap.xml`), 'robots.txt points to the sitemap');
for (const [i, l] of ['he', 'ru', 'en'].entries()) {
  for (const page of [`${['', 'ru/', 'en/'][i]}index.html`, `${['', 'ru/', 'en/'][i]}about/index.html`, ...SITE.works.map(w => `${['', 'ru/', 'en/'][i]}works/${w.id}/index.html`)]) {
    const h = read(page), url = SITE_URL + page.replace(/index\.html$/, '');
    assert.ok(h.includes(`<html lang="${l}"`), `${page}: lang`);
    assert.ok(h.includes(`<link rel="canonical" href="${url}">`), `${page}: canonical`);
    for (const k of ['he', 'ru', 'en', 'x-default']) assert.ok(h.includes(`hreflang="${k}"`), `${page}: hreflang ${k}`);
    assert.ok(/<title>[^<]{10,}<\/title>/.test(h) && /<meta name="description" content="[^"]{40,}">/.test(h), `${page}: title and description`);
    for (const [, j] of h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) JSON.parse(j);
    assert.ok(sitemap.includes(`<loc>${url}</loc>`), `sitemap: ${url}`);
  }
}
const homeHe = read('index.html');
for (const w of SITE.works) assert.ok(homeHe.includes(`href="works/${w.id}/"`), `home links to ${w.id}`);
for (const n of ['סנדרה לייפר', 'Сандра Лейфер', 'Sandra Leifer']) assert.ok(homeHe.includes(n), `name ${n} in the structured data`);
const museum = read('museum/index.html');
assert.ok(museum.includes('catalog.js') && /Object\.keys\(CATALOG\)/.test(museum), 'museum hangs the whole catalog');
// The rooms open off a lobby: one doorway each, in a different lobby wall, each reachable by ?room=<key> (and ?room=hub: the lobby)
const rooms = [...museum.matchAll(/kind: '(\w+)', key: '(\w+)', at: '(\w+)', wall:/g)];
assert.equal(rooms.length, 4, 'museum: four rooms');
for (const [, kind] of rooms) assert.ok(series.has(kind), `museum room ${kind}`);
assert.equal(new Set(rooms.map(r => r[3])).size, 4, 'museum: each room off its own lobby wall');
for (const k of ['back', 'right', 'left', 'front']) assert.ok(rooms.some(r => r[3] === k) && museum.includes(`${k}: [`), `museum: a room through the lobby's ${k} wall`);
for (const [, , key] of rooms) assert.ok(museum.includes(`data-room="${key}" href="?room=${key}"`) || museum.includes(`href="?room=${key}" data-mirror-room-link data-room="${key}"`), `museum: loading screen links to room ${key}`);
assert.ok(museum.includes("key === 'hub' ? LOBBY") && museum.includes('function goToHub()') && museum.includes('<button class="back lobby" id="lobby" type="button" hidden>') && museum.includes("$('lobby').onclick = goToHub"), 'museum: ?room=hub and a back-to-the-lobby button');
assert.equal([...museum.matchAll(/lobby: '[^']+', backTo: '[^']+', toLobby: '[^']+'/g)].length, 3, 'museum: the lobby words in Hebrew, Russian and English');

// Dragon tale: same reader format as the unicorn, 29 pages in both languages.
const dragon = ['book.json', 'book-ru.json'].map(f => JSON.parse(read('dragon/' + f)));
for (const b of dragon) {
  assert.equal(b.length, 30);
  b.forEach((p, n) => { assert.equal(p.n, n); assert.ok(n === 0 || p.text.length > 100, `dragon page ${n}`); assert.ok(exists('dragon/' + p.image), p.image); });
}
dragon[0].forEach((p, n) => assert.equal(p.chapter, dragon[1][n].chapter, `dragon chapter on page ${n}`));
// Contact: Sandra on WhatsApp, and no trace of the Under 1000 gallery anywhere on the site.
assert.ok(html.includes('https://wa.me/972535380014?text='), 'contact section opens WhatsApp');
for (const page of ['index.html', 'ru/index.html', 'en/index.html', 'museum/index.html', 'assets/js/data.js', 'assets/js/catalog.js', 'assets/js/site.js', ...workPages])
  assert.ok(!/under\s?1000|פחות מאלף/i.test(read(page)), `${page}: mentions Under 1000`);
for (const w of SITE.works.filter(w => !w.status)) assert.ok(read(`works/${w.id}/index.html`).includes('https://wa.me/972535380014?text='), `${w.id}: WhatsApp purchase link`);

// Neurographics guide: page exists, loads the shared texts, every key it uses exists in all three languages.
assert.ok(exists('neurographics/index.html') && exists('neurographics/app.js'), 'neurographics page');
const ng = read('neurographics/index.html');
assert.ok(ng.includes('data.js') && ng.includes('app.js'), 'neurographics loads data.js and app.js');
for (const [, key] of ng.matchAll(/data-t="([^"]+)"/g)) for (const l of ['he', 'ru', 'en']) assert.ok(key in SITE.text[l], `neurographics: ${l} missing ${key}`);
for (const [, key] of read('neurographics/app.js').matchAll(/\bt\('(ng\w+|wa\w+)'\s*[,)]/g)) for (const l of ['he', 'ru', 'en']) assert.ok(key in SITE.text[l], `neurographics app: ${l} missing ${key}`);
for (const k of ['ngS1Title', 'ngS11Title', 'ngCtaBtn', 'waNeuro', 'navNeuro', 'ngTeaser']) for (const l of ['he', 'ru', 'en']) assert.ok(SITE.text[l][k], `neurographics text ${k} ${l}`);
for (const l of ['he', 'ru', 'en']) assert.ok(SITE.waNeuro(l).startsWith('https://wa.me/972535380014?text='), `waNeuro ${l}`);
assert.ok(read('sitemap.xml').includes(`<loc>${SITE_URL}neurographics/</loc>`), 'neurographics in sitemap');
for (const page of ['index.html', 'ru/index.html', 'en/index.html']) assert.ok(read(page).includes('neurographics/'), `${page} links to neurographics`);
// NeuroGraphica, Owner 2026-11-17 ("כתבנו 23 מילים ואז הם נעלמו", paper first, many lines, the figure by hand, forgiving taps).
{
  const app = read('neurographics/app.js'), num = re => +(app.match(re) || [])[1];
  // the words: the 2-minute timer once read a stale, empty box captured at the idle render and wiped the words when time ran out
  assert.ok(/function liveWords\(\) \{[^}]*document\.getElementById\('words'\)/.test(app) && /function finishWords\(\) \{\s*liveWords\(\);/.test(app), 'NG words: the end of the timer reads the box on screen');
  assert.ok(/timerId = setInterval\(wordsTick, 200\)/.test(app) && !/W\.text = area\.value; render\(\)/.test(app) && !/clearInterval\(timerId\); breathTimer = timerId = 0/.test(app), 'NG words: one module timer, not cleared by a re-render or a language switch');
  assert.ok(/try \{ return JSON\.parse\(sessionStorage\.getItem\(SKEY\)/.test(app) && /try \{ sessionStorage\.setItem\(SKEY/.test(app) && /\nrestore\(\);\n/.test(app), 'NG: the visit (texts, words, step, drawing) is kept in sessionStorage, guarded by try/catch');
  assert.ok(num(/maxlength: '(\d+)'/) >= 200, 'NG: the request field takes a long text');
  // paper first: the opening choice, and the paper steps carry no drawing sheet
  for (const k of ['ngPaperBest', 'ngChooseQ', 'ngChoosePaper', 'ngChoosePhone', 'ngChooseScreen', 'ngManyLines', 'ngLinesCount', 'ngLinesMany', 'ngPaperRound', 'ngIllAlt', 'ngIllBefore', 'ngIllAfter', 'ngShapeDraw', 'ngShapeDone', 'ngPaperFinalTitle', 'ngPaperFinalText', 'ngCtaNotePaper']) for (const l of ['he', 'ru', 'en']) assert.ok(SITE.text[l][k], `NG text ${k} ${l}`);
  assert.equal(SITE.text.he.ngChoosePaper, 'יש לי דף וטושים – רוצה הדרכה', 'NG: the paper choice in the Owner\'s words');
  assert.ok(app.includes("id: 'choosePaper'") && app.includes("id: 'choosePhone'") && (app.match(/paper\(\)(\) return | \? )cols\(/g) || []).length >= 6 && app.includes("$('nav').hidden = n === 0"), 'NG: opening choice; paper mode steps are instructions with pictures, no sheet');
  // many lines (a hint, never a block), the figure drawn by hand (no ready triangle)
  assert.ok(num(/const LINES_MIN = (\d+)/) >= 8 && !/nextBtn'\)\.disabled/.test(app), 'NG: at least 8 lines encouraged, Next never blocked');
  assert.ok(!/shapePts|ngShapeTriangle|ngShapeCircle/.test(app) && !('ngShapeTriangle' in SITE.text.he) && app.includes("fig: () => !state.figDone"), 'NG: no ready-made shapes; the figure is drawn freehand');
  // forgiving taps: a finger rounds every sharp corner within >= 28 CSS px; anything that moves is a line, so lines can be added after rounding
  assert.ok(num(/TAP_TOUCH_PX = (\d+)/) >= 28 && /for \(const reach of \[R, 1\.6 \* R\]\)/.test(app) && /if \(best\) return \[best\.c\.id\];/.test(app) && !/hit\.map\(/.test(app), 'NG taps (Owner 2026-11-18): generous reach, but one tap fills exactly one corner, the nearest');
  // round 2 (Owner 2026-11-18): no colouring while filling corners; lines always black, of different widths; the central line thickest
  assert.ok(/const swatches = !o\.paint \? null :/.test(app) && /const mode = \(\) => o\.paint \? 'fill' : o\.fill \? tool\.mode : 'pen';/.test(app) && !/COLORS\[tool\.color\]/.test(app) && !/COLORS\[state\.tool\.color\]/.test(app), 'NG: the colour palette exists only on the colouring board, never on the line or corner boards');
  assert.ok(/const INK = COLORS\[0\]/.test(app) && (app.match(/color: INK/g) || []).length >= 6 && /if \(it\.t === 's'\) it\.color = INK;/.test(app), 'NG: every line is black (drawn, sample, neuro-line, paper pictures, restored sessions)');
  assert.ok(/const lineW = i => Math\.round\(WIDTHS\[i\] \* \(0\.\d+ \+ Math\.random\(\) \* 0\.\d+\)/.test(app) && num(/const FIG_W = (\d+)/) > 1.25 * Math.max(...app.match(/const WIDTHS = \[([\d, ]+)\]/)[1].split(',').map(Number)), 'NG: each line its own width; the central figure line clearly thicker than any other');
  assert.ok(/if \(i !== undefined && c\.order < i\) \{ out\.push\(c\); done\.add\(c\.id\); \}/.test(app) && /for \(const c of junctions\(ps\)\.corners\)/.test(app) && /for \(const c of fillets\(sheet\)\) if \(!\(skip/.test(app), 'NG: a corner filled before a later line ran through its junction keeps its old ink under that line (no corner filling while the central line is drawn)');
  assert.ok(num(/SLOP_TOUCH_PX = (\d+)/) <= 16 && /down\.travel < \(down\.touch \? SLOP_TOUCH_PX : SLOP_MOUSE_PX\)/.test(app) && /sheet\.items\.push\(it\); changed\(\);/.test(app), 'NG: a drag on a rounding step still adds a line');
}

// Biography: a page per language, the home About link points to it, the switcher reaches the other versions, bullets and pull quote present.
for (const [i, l] of ['he', 'ru', 'en'].entries()) {
  const pre = ['', 'ru/', 'en/'][i], b = read(pre + 'about/index.html');
  assert.ok(b.includes(`dir="${l === 'he' ? 'rtl' : 'ltr'}"`), `${pre}about: dir`);
  assert.equal((b.match(/<h1[\s>]/g) || []).length, 1, `${pre}about: one h1`);
  assert.ok(/<ul class="bio-list">[\s\S]*<\/ul>/.test(b) && b.includes('<blockquote>') && b.includes('<figcaption>'), `${pre}about: bullets and pull quote`);
  for (const k of ['he', 'ru', 'en']) assert.ok(b.includes(`<a href="${'../'.repeat(l === 'he' ? 1 : 2)}${k === 'he' ? '' : k + '/'}about/" hreflang="${k}"`), `${pre}about: switcher to ${k}`);
  assert.ok(read(pre + 'index.html').includes('data-bio-link'), `${pre}index: About link to the biography`);
}
// Professional framing: one h1 and a WhatsApp/tel contact on each home page, the draft tale stays out of search engines.
for (const page of ['index.html', 'ru/index.html', 'en/index.html']) {
  const h = read(page);
  assert.equal((h.match(/<h1[\s>]/g) || []).length, 1, `${page}: exactly one h1`);
  assert.ok(/<h1[^>]*>[^<]*Sandra Leifer|<h1[^>]*>(סנדרה לייפר|Сандра Лейфер)/.test(h), `${page}: h1 names Sandra`);
  assert.ok(h.includes('href="tel:+972535380014"'), `${page}: number as a tel: link`);
  assert.ok(h.includes('data-wa-book') && h.includes('id="waFloat"'), `${page}: booking button and floating WhatsApp`);
  assert.ok(!h.includes('new-badge'), `${page}: no New badge on the draft tale`);
}
assert.ok(/<meta name="robots" content="noindex"/.test(read('dragon/index.html')), 'dragon is noindex');
assert.ok(!sitemap.includes('/dragon/'), 'dragon is not in the sitemap');
for (const page of workPages) assert.ok(/content="[^"]*(?:[.!?…״"])">/.test(read(page).match(/<meta name="description" content="[^"]*">/)[0]), `${page}: description ends at a sentence or word boundary`);
for (const dir of ['book/', 'dragon/']) { const h = read(dir + 'index.html'); assert.ok(h.includes('id="footWa"') && h.includes('id="footStudio"') && h.includes('id="metaDesc"'), `${dir}: footer links and language-aware description`); }

// Site improvements: new text keys in all three languages, credibility and bio links on every page type, structured data, hooks.
for (const k of ['heroRoles', 'aboutCred', 'bioMore', 'footTitles', 'achTitle', 'achIntro', 'ach1', 'ach2', 'ach3', 'ach4', 'ach5', 'childrenTitle', 'childrenText', 'studioMethodT', 'studioMethod', 'studioRole', 'fact5', 'fact6']) for (const l of ['he', 'ru', 'en']) assert.ok(SITE.text[l][k] && SITE.text[l][k].length > 5, `text ${k} ${l}`);
assert.ok(/NeuroGraphica|НейроГрафик|נוירוגרפיקה/.test(SITE.text.en.portraitCap + SITE.text.ru.portraitCap + SITE.text.he.portraitCap) && SITE.text.en.portraitCap.includes('NeuroGraphica instructor'), 'portraitCap names her as a NeuroGraphica instructor');
for (const page of ['index.html', 'ru/index.html', 'en/index.html']) {
  const h = read(page);
  assert.ok((h.match(/data-bio-link/g) || []).length >= 3, `${page}: bio links in nav, About and footer`);
  assert.ok(h.includes('class="foot-titles"') && h.includes('id="achievements"') && h.includes('class="wall-roles"') && h.includes('class="studio-method'), `${page}: titles, achievements, roles, method`);
  const ldj = JSON.parse(h.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
  const p = ldj.find(x => x['@type'] === 'Person');
  for (const f of ['description', 'alumniOf', 'memberOf', 'award', 'knowsAbout']) assert.ok(p[f] && p[f].length, `${page}: Person.${f}`);
  assert.ok(ldj.some(x => x['@type'] === 'Organization' && x.founder), `${page}: Children Artists founder`);
  // the fairy tales live in the menu, not on the home page (Owner, 2026-11-20: "ואת האגדות לילדים לא חובה שיהיו בדף הבית / שיהיה בתפריט")
  assert.ok(!h.includes('id="stories"') && !h.includes('class="story-card') && !h.includes('data-dragon-link'), `${page}: no fairy-tales section on the home page`);
  const navHtml = h.match(/<nav class="nav" id="nav"[\s\S]*?<\/nav>/)[0];
  assert.ok(/<a href="(\.\.\/)?book\/" data-book-link data-t="navStories">[^<]+<\/a>/.test(navHtml), `${page}: the main menu links to the fairy tales (book/)`);
}
for (const pre of ['', 'ru/', 'en/']) { const b = read(pre + 'about/index.html'); assert.ok(b.includes('"@type":"ProfilePage"') && b.includes('class="foot-titles"'), `${pre}about: ProfilePage and titles`); }
for (const page of workPages) assert.ok(read(page).includes('class="foot-titles"') && read(page).includes('data-bio-link') && read(page).includes("'sl:wa'"), `${page}: footer titles, bio link, sl:wa hook`);
for (const dir of ['book/', 'museum/', 'neurographics/']) { const h = read(dir + 'index.html'); assert.ok(h.includes(`<link rel="canonical" href="${SITE_URL}${dir}">`) && h.includes('og:description') && h.includes('application/ld+json'), `${dir}: canonical, og and JSON-LD`); }
for (const dir of ['book/', 'neurographics/']) assert.ok(read(dir + 'index.html').includes('class="foot-titles"') || read(dir + 'index.html').includes('footTitles'), `${dir}: titles in the footer`);
assert.ok(read('museum/index.html').includes('id="lbio"'), 'museum: bio link');
assert.ok(read('assets/js/site.js').includes("new CustomEvent('sl:wa'") && read('neurographics/app.js').includes("'sl:wa'"), 'sl:wa hook');
assert.ok(!/<script[^>]+src="https?:\/\/(?!fonts)/.test(read('index.html')), 'no third-party scripts in the HTML (PostHog loads from assets/js/analytics.js)');
// Analytics: every public page loads the shared PostHog file; the unpublished dragon tale does not.
const publicPages = [...workPages, ...['', 'ru/', 'en/'].flatMap(p => [p + 'index.html', p + 'about/index.html']), 'book/index.html', 'museum/index.html', 'neurographics/index.html', 'body-art/index.html', 'ru/body-art/index.html', 'en/body-art/index.html', 'mirror-room/index.html', 'neurographica/index.html', 'ru/neurographica/index.html', 'en/neurographica/index.html'];
for (const page of publicPages) assert.ok(/<script src="(\.\.\/)*assets\/js\/analytics\.js" defer><\/script>/.test(read(page)), `${page}: analytics.js`);
assert.ok(!read('dragon/index.html').includes('analytics.js'), 'dragon: no analytics');
const an = read('assets/js/analytics.js');
assert.ok(an.includes("persistence: 'memory'") && an.includes('disable_session_recording: true') && an.includes("api_host: 'https://eu.i.posthog.com'") && an.includes("document.addEventListener('sl:wa'") && !/phx_/.test(an), 'analytics.js: cookieless config and sl:wa');
assert.ok(SITE.works.find(w => w.id === 'thoughtful-wanderer').t[0] === 'הנווד המהורהר', 'thoughtful-wanderer title matches the catalog');

// Home hero wall: every body-art photo is mixed in once, including the nudity-tagged ones (Owner, 2026-11-15: no problem with them anywhere).
// HERO_SKIP_REVIEW flips them off again (the mix then drops anything review-tagged).
{
  const wctx = vm.createContext({window: {}, document: {}});
  // One photo per model (Owner, 2026-11-15): these six were second photos of a model already shown and are gone everywhere.
  var DROPPED = ['body-art-event-01', 'body-art-event-04', 'body-art-07', 'body-art-18', 'body-art-16', 'body-art-20'];
  for (const id of DROPPED) {
    assert.ok(!ctx.window.BODY_ART.items.some(x => x.id === id), `body-art-data.js: ${id} is dropped`);
    for (const s of [800, 1600]) assert.ok(!exists(`assets/img/body-art/${id}-${s}.webp`), `${id}-${s}.webp is deleted`);
  }
  vm.runInContext(read('assets/js/wall.js'), wctx);
  const BA = ctx.window.BODY_ART.items;
  const mixed = wctx.window.EndlessWall.mix(ids, ctx.window.BODY_ART, false), tiles = mixed.filter(x => typeof x !== 'string');
  assert.equal(tiles.map(x => x.id).sort().join(), BA.map(x => x.id).sort().join(), 'hero wall: every body-art photo, once');
  for (const id of ['body-art-05', 'body-art-08', 'body-art-12']) assert.ok(tiles.some(x => x.id === id), `hero wall: ${id} (nudity-tagged, approved) is on the wall`);
  assert.equal(BA.filter(x => x.review === 'nudity').map(x => x.id).sort().join(), 'body-art-05,body-art-08,body-art-12', 'body-art: the nudity-tagged photos are 05, 08 and 12');
  for (const id of DROPPED) assert.ok(!tiles.some(x => x.id === id), `hero wall: ${id} (second photo of a model) is off the wall`);
  for (const t of tiles) for (const f of ['800']) assert.ok(exists(`assets/img/body-art/${t.id}-${f}.webp`), `hero wall: ${t.id}-${f}`);
  assert.ok(tiles.some(x => x.id === 'body-art-13') && tiles.some(x => x.id === 'body-art-event-02'), 'hero wall: contest photos in');
  assert.equal(mixed.filter(x => typeof x !== 'string').length, BA.length);
  assert.equal(mixed.filter(x => typeof x === 'string').join(), ids.join(), 'hero wall: works unchanged and in order');
  assert.ok(mixed.slice(0, 12).filter(x => typeof x !== 'string').length <= 4, 'hero wall: body-art photos spread, not clumped');
  assert.equal(wctx.window.EndlessWall.mix(ids, ctx.window.BODY_ART, true).filter(x => typeof x !== 'string').length, BA.filter(x => !x.review).length, 'hero wall: the skip flag still works');
  assert.ok(read('assets/js/body-art.js').includes('location.hash') && read('assets/js/site.js').includes("'body-art/#' + id"), 'hero wall: a photo tile opens the body-art lightbox at that photo (#id)');
  assert.ok(/const HERO_SKIP_REVIEW = false;/.test(read('assets/js/site.js')), 'hero wall: nudity-tagged photos on (flag off)');
  assert.ok(read('assets/js/wall.js').includes('(window.IMAGES || {}).works || {}') && /try \{[^\n]*\nwindow\.EndlessWall\(\$\('hero'\)/.test(read('assets/js/site.js')), 'hero wall: a failed images.js never throws (wall.js:6) and never stops the gallery');
  for (const p of ['index.html', 'ru/index.html', 'en/index.html']) assert.ok(read(p).includes('assets/js/body-art-data.js'), `${p}: body-art-data.js for the wall`);
  // Hero images on the phone (Owner 2026-11-16, "עולות אחרי מלא זמן"): the wall loads 480 px thumbnails, and only for tiles on screen;
  // every tile has a placeholder colour; lazy is set before src (Safari otherwise fetched all gallery images at 1600 px on load).
  for (const id of ids) assert.ok(exists(`assets/img/works/${id}-480.webp`), `hero wall thumb: works/${id}-480.webp (python3 -E tools/build-thumbs.py)`);
  for (const t of tiles) assert.ok(exists(`assets/img/body-art/${t.id}-480.webp`) && /^#[0-9a-f]{6}$/.test(t.c), `hero wall thumb + colour: ${t.id}`);
  for (const id of ids) assert.ok(/^#[0-9a-f]{6}$/.test((ctx.window.IMAGES.works[id] || {}).c || ''), `hero wall colour: ${id}`);
  const wall = read('assets/js/wall.js'), site = read('assets/js/site.js');
  assert.ok(wall.includes('-480.webp') && wall.includes('if (!t.on) show(t);') && !/\.loading\s*=/.test(wall) && !/im\.src = src\(it\.id\)/.test(wall), 'hero wall: thumbnails, loaded when a tile first shows (no all-at-once lazy)');
  assert.ok(wall.includes('root.clientWidth') && !/innerWidth < 700/.test(wall), 'hero wall: laid out by the hero size, not a zoomed-out innerWidth');
  assert.ok(site.indexOf("if (lazy) i.loading = 'lazy'") < site.indexOf('i.src = s.src') && !/\.src = [^;]+;[^\n]*\.loading = 'lazy'/.test(site), 'site.js: loading=lazy is set before src');
}

// Body-art gallery: a page per language, every referenced image exists, alt text everywhere, the contest sentence is the bio's own, lightbox hooks, links in.
{
  const BODY = ctx.window.BODY_ART;
  assert.ok(BODY && BODY.items.length === 14, 'body-art data: 14 photos (one per model; with the 5 catalog body works, 19 people)');
  const bio = read('../src/site/bio.md').split(/^={10,} .*$/m).slice(1);
  for (const [i, l] of ['he', 'ru', 'en'].entries()) {
    const pre = ['', 'ru/', 'en/'][i], page = pre + 'body-art/index.html';
    assert.ok(exists(page), `${page} exists`);
    const h = read(page), up = '../'.repeat(l === 'he' ? 1 : 2);
    assert.ok(h.includes(`<html lang="${l}" dir="${l === 'he' ? 'rtl' : 'ltr'}"`), `${page}: lang and dir`);
    assert.ok(h.includes(`<link rel="canonical" href="${SITE_URL}${pre}body-art/">`), `${page}: canonical`);
    for (const k of ['he', 'ru', 'en', 'x-default']) assert.ok(h.includes(`hreflang="${k}"`), `${page}: hreflang ${k}`);
    assert.equal((h.match(/<h1[\s>]/g) || []).length, 1, `${page}: one h1`);
    for (const [, j] of h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) JSON.parse(j);
    assert.ok(sitemap.includes(`<loc>${SITE_URL}${pre}body-art/</loc>`), `sitemap: ${pre}body-art/`);
    const shown = BODY.items.filter(x => !BODY.hideReview.includes(x.review));
    const imgs = [...h.matchAll(/<img src="([^"]+)"([^>]*)>/g)].filter(m => m[1].includes('assets/img/body-art/'));
    assert.equal(imgs.length, shown.length, `${page}: one img per photo`);
    for (const [, src, rest] of imgs) {
      assert.ok(exists(`assets/img/body-art/${src.split('/').pop()}`), `${page}: missing ${src}`);
      assert.ok(/ alt="[^"]{8,}"/.test(rest), `${page}: alt text on ${src}`);
      assert.ok(/ width="\d+" height="\d+"/.test(rest) && rest.includes('loading="lazy"'), `${page}: size and lazy on ${src}`);
    }
    for (const it of shown) {
      for (const s of [800, 1600]) assert.ok(fs.statSync(new URL(`assets/img/body-art/${it.id}-${s}.webp`, root)).size > 5000, `${it.id}-${s}`);
      assert.ok(h.includes(`href="${up}assets/img/body-art/${it.id}-1600.webp"`), `${page}: link to ${it.id}-1600`);
      if (it.review) assert.ok(h.includes('data-review="' + it.review + '"'), `${page}: ${it.id} tagged for review`);
    }
    // the group intro is the bio's sentence verbatim
    const sentence = bio[['he', 'en', 'ru'].indexOf(l)].split('\n').map(x => x.trim()).find(x => /2025/.test(x) && !x.startsWith('#'));
    assert.ok(sentence && h.includes(`<p class="ba-intro">${sentence.replace(/&/g, '&amp;')}</p>`), `${page}: contest sentence from the bio`);
    // contests: 2025 (body-art-13) then 2026 (events), as h3 year headings in page order
    const i25 = h.indexOf('<h3 class="ba-year">2025</h3>'), i26 = h.indexOf('<h3 class="ba-year">2026</h3>'), i13 = h.indexOf('/body-art-13-1600.webp" data-w'), iE1 = h.indexOf('/body-art-event-02-1600.webp" data-w');
    assert.ok(i25 > h.indexOf('id="events"') && i25 < i13 && i13 < i26 && i26 < iE1, `${page}: 2025 heading above body-art-13, 2026 heading above the events`);
    assert.ok(h.indexOf('/body-art-17-1600.webp" data-w') < h.indexOf('id="events"'), `${page}: body-art-13 is no longer in the art group`);
    for (const id of DROPPED) assert.ok(!h.includes(`/${id}-`) && !h.includes(`/${id}.`), `${page}: ${id} (second photo of a model) is gone`);
    // one home, no doubles: the 5 catalog body works come first as cards to their work pages (titles as in the catalog); the photos that duplicated them are gone
    const cat = SITE.works.filter(w => w.kind === 'body');
    assert.equal(cat.length, 5, 'five catalog body works');
    assert.equal((h.match(/class="ba-work"/g) || []).length, cat.length, `${page}: a card per catalog body work`);
    for (const w of cat) assert.ok(h.includes(`href="${up}${['', 'ru/', 'en/'][i]}works/${w.id}/"`) && h.includes(`<span class="ba-work-t">${w.t[i]}</span>`), `${page}: card for ${w.id}`);
    assert.ok(h.indexOf('data-body-works') < h.indexOf('class="ba-grid"'), `${page}: catalog works before the photos`);
    for (const dup of ['body-art-01', 'body-art-06', 'body-art-14', 'body-art-15', 'body-art-event-03']) assert.ok(!h.includes(`/${dup}-`) && !BODY.items.some(x => x.id === dup), `${page}: ${dup} duplicates a catalog work or another frame and stays out`);
    assert.ok(h.includes('id="baLb"') && h.includes('body-art.js') && h.includes('<figcaption class="ba-credit">'), `${page}: lightbox and credit`);
    assert.ok(/Susanna/.test(h), `${page}: photographer credit`);
    assert.ok(read(pre + 'index.html').includes('data-body-link'), `${pre}index: link to the body-art page`);
    const bw = read(`${pre}works/gaze/index.html`);
    assert.ok(bw.includes('data-body-art-link') && bw.includes('body-art/"'), `${pre}works/gaze: link to the body-art page`);
  }
  assert.ok(exists('assets/css/body-art.css') && exists('assets/js/body-art.js'), 'body-art css and js');
  // the gallery's body-art chip is a link to the body-art page in the current language, not a grid filter
  const siteJs = read('assets/js/site.js');
  assert.ok(/o\.id === 'body'[\s\S]{0,200}a\.href = home\(lang\) \+ 'body-art\/'[\s\S]{0,120}dataset\.bodyChip/.test(siteJs), 'site.js: the body-art filter chip links to the body-art page');
}

// The mirror room: a white backstage makeup room, the last room of the museum (museum/makeup-room.js).
// Each makeup chair holds a whole body-art photo, framed (no cut-out figures); the contest photos hang on the end wall;
// a tap, the arrows, the tour, the card and the zoom work exactly as in rooms 1-3 (Owner, 2026-11-15: no full-screen lightbox). The vanity mirrors use the vendored Reflector
// (three@0.160.0, MIT). No walking Sandra; /mirror-room/ only redirects into the museum room; the links into the room.
{
  const m = read('museum/index.html'), js = read('museum/makeup-room.js'), r = read('mirror-room/index.html');
  assert.ok(m.includes("from './makeup-room.js'") && m.includes('makeup: true') && m.includes('id="lroom" href="?room=mirror"'), 'museum: the mirror room is its last room, with a link to it');
  assert.ok(js.includes("from '../assets/vendor/Reflector.js'") && js.includes("from 'three'"), 'makeup-room.js: three and the vendored Reflector');
  assert.ok(!exists('mirror-room/room.js') && !/sandra|trail|walker/i.test(js.replace(/\/\/.*$/gm, '').replace(/Sandra Leifer/g, '')), 'mirror room: no walking Sandra and no paint trail');
  assert.ok(r.includes('<meta name="robots" content="noindex">') && r.includes(`<link rel="canonical" href="${SITE_URL}museum/">`) && r.includes("location.replace('../museum/?room=mirror'") && r.includes('url=../museum/?room=mirror'), 'mirror-room/: redirects into the museum room');
  // the photos: whole, from the body-art folder or the catalog, never the old cut-outs
  const list = name => { const b = js.match(new RegExp(`export const ${name} = \\[([\\s\\S]*?)\\];`)); assert.ok(b, `makeup-room.js: ${name}`); return [...b[1].matchAll(/\{id: '([\w-]+)'(?:, work: '([\w-]+)')?\}/g)].map(x => ({id: x[1], work: x[2] || null})); };
  const seats = list('SEATS'), prints = list('PRINTS'), all = [...seats, ...prints];
  assert.ok(seats.length >= 12 && seats.length % 2 === 0 && prints.length >= 1, 'mirror room: a photo on every chair, and the end wall');
  assert.ok(!exists('assets/img/mirror-room') && !/mirror-room\/mr-|backMask|hairTone/.test(js), 'mirror room: no cut-out figures');
  assert.equal(new Set(all.map(x => x.id)).size, all.length, 'mirror room: no photo twice');
  assert.ok(all.filter(x => x.work).length === 3 && ['smoke', 'gaze', 'chromatic-reverie'].every(n => seats.some(x => x.work === n) && SITE.works.some(w => w.id === n)), 'mirror room: the three catalog shoots show the catalog work (its card and the way to buy it)');
  for (const x of all) if (!x.work) for (const s of [800, 1600]) assert.ok(exists(`assets/img/body-art/body-art-${x.id}-${s}.webp`), `mirror room: body-art-${x.id}-${s}.webp`);
  // every body-art photo is in the room once (Owner, 2026-11-15: the nudity-tagged ones too), the catalog shoots through their works
  const BA = ctx.window.BODY_ART.items, inRoom = all.filter(x => !x.work).map(x => 'body-art-' + x.id);
  for (const id of inRoom) assert.ok(BA.find(b => b.id === id), `mirror room: ${id} is a body-art photo`);
  for (const id of ['body-art-05', 'body-art-08', 'body-art-12']) assert.ok(inRoom.includes(id), `mirror room: ${id} (approved nudity-tagged photo) is in the room`);
  for (const id of ['body-art-13', 'body-art-event-02']) assert.ok(inRoom.includes(id), `mirror room: ${id} (contest) is in the room`);
  for (const id of DROPPED) assert.ok(!inRoom.includes(id), `mirror room: ${id} (second photo of a model) is not in the room`);
  assert.equal(inRoom.slice().sort().join(), BA.map(x => x.id).sort().join(), 'mirror room: every kept body-art photo once, none left out');
  assert.ok(!m.includes('b.review'), 'museum: the room no longer filters review-tagged photos');
  assert.ok(/D = ROW \+ /.test(js), 'mirror room: the depth follows the number of chairs');
  // its visible name is the body-art label in each language (Owner, 2026-11-15: "חדר המראות לשנות לבודי ארט את השם"); ?room=mirror and /mirror-room/ stay
  assert.ok(m.includes("mirror: 'בודי־ארט'") && m.includes("mirror: 'Боди-арт'") && m.includes("mirror: 'Body art'"), 'museum: the room is named בודי־ארט / Боди-арт / Body art');
  for (const [f, h] of [['museum/index.html', m], ['mirror-room/index.html', r], ...['', 'ru/', 'en/'].map(p => [p + 'body-art/index.html', read(p + 'body-art/index.html')])])
    assert.ok(!/חדר המראות|Зеркальный зал|зеркальный зал|The mirror room|Enter the mirror room|mirror room of body art/.test(h.replace(/\/\/.*$|\/\*[\s\S]*?\*\//gm, '')), `${f}: no visible 'mirror room' name left`);
  // navigation and taps as in rooms 1-3 (Owner, 2026-11-15): a tap walks to the photo and shows the card, a tap on the photo you stand at zooms;
  // the zoom is the museum's own; a catalog work on a chair gets that work's full card (and the way to buy it), a photo the card without a price or buy button
  const lb = read('assets/js/body-art.js');
  assert.ok(lb.includes("querySelectorAll('.ba-item a')"), 'body-art.js: the gallery lightbox on /body-art/');
  assert.ok(!/baLb|ba-lb|baLightbox|assets\/js\/body-art\.js|assets\/css\/body-art\.css|openPhoto/.test(m) && m.includes('assets/js/body-art-data.js'), 'museum: no full-screen body-art lightbox in the mirror room');
  assert.ok(m.includes("const i = hit.object.userData.index; if (i === focused) openZoom(i); else goTo(i); }") && !/hung\[\w+\]\.station\) \{ if/.test(m), 'museum: a tap in the mirror room works as in the other rooms (walk, then zoom)');
  assert.ok(m.includes("if (shown === focused) openZoom(shown); else") && m.includes('zimg.src = h.zoomSrc ||') && js.includes('zoomSrc: p.big'), 'museum: the mirror room zooms with the museum zoom');
  // a catalog body work on a chair has only a title: its card falls back to the body-art line; no buy button where hidden (phone grid); no empty details toggle
  assert.ok(m.includes("medium: w.med ? L(w.med) : w.kind === 'body' ? SITE.text[lang].body : ''") && m.includes("desc: w.d ? L(w.d) : []"), 'museum: the card of a catalog body work on a chair');
  assert.ok(m.includes('#lask[hidden]{display:none}') && m.includes(".label.nodesc .lmore{display:none}"), 'museum: hidden buy button and empty details toggle stay hidden on the phone');
  assert.ok(m.includes('id = h.station ? h.work : h.id;') && m.includes('if (!id) return showStation(h);') && /function showStation\(h\) \{[\s\S]*?\$\('lask'\)\.hidden = true;[\s\S]*?\n\}/.test(m), 'museum: catalog works on chairs get the work card; photos get the card without a buy button');
  const refl = read('assets/vendor/Reflector.js'), lic = read('assets/vendor/Reflector.LICENSE.txt');
  assert.ok(refl.includes("} from './three.module.min.js';") && !/from 'three'/.test(refl) && refl.includes('three@0.160.0'), 'Reflector.js: import path and version');
  assert.ok(/The MIT License/.test(lic) && /three\.js authors/.test(lic), 'Reflector.LICENSE.txt: MIT');
  assert.ok(/(?:REVISION|t)="160"/.test(read('assets/vendor/three.module.min.js')), 'vendored three.js is r160');
  assert.ok(!sitemap.includes(`<loc>${SITE_URL}mirror-room/</loc>`), 'sitemap: no mirror-room/ (it redirects)');
  for (const pre of ['', 'ru/', 'en/']) assert.ok(read(pre + 'body-art/index.html').includes(`museum/?room=mirror&amp;lang=${pre ? pre.slice(0, 2) : 'he'}" data-mirror-room-link`), `${pre}body-art: link to the mirror room in the museum`);
}

// Information-architecture quick wins: closing blocks, no internal pages, series only once.
assert.ok(!exists('concepts/'), 'concepts/ is removed');
for (const page of ['about/', 'body-art/']) for (const pre of ['', 'ru/', 'en/']) { const h = read(pre + page + 'index.html'); assert.ok(h.includes('class="closing') && h.includes('data-wa') && h.includes('#studio') && h.includes('#works'), `${pre}${page}: closing block`); }
assert.ok(!read('book/index.html').includes('reviewBtn'), 'book: no editor-notes button');
for (const pre of ['', 'ru/', 'en/']) { const h = read(pre + 'index.html'); assert.ok(!h.includes('id="seriesRail"') && h.indexOf('id="studio"') > h.indexOf('id="works"') && h.indexOf('id="studio"') < h.indexOf('id="exhibition"'), `${pre}home: series once, workshops right after works`); }
// Language suggestion on first visit (Owner approved auto-language 2026-11-15; changed to a banner after best-practice review): only on the Hebrew home, guarded, no redirect.
{
  const walk = d => fs.readdirSync(new URL(d, root), {withFileTypes: true}).flatMap(e => e.isDirectory() ? walk(d + e.name + '/') : [d + e.name]);
  const withRedirect = walk('').filter(f => /\.html$/.test(f) && read(f).includes('lang-suggest: first visit only'));
  assert.deepEqual(withRedirect, ['index.html'], 'lang-suggest only in dist/index.html');
  const h = read('index.html'), m = h.match(/<script>\/\* lang-suggest[\s\S]*?<\/script>/);
  assert.ok(m && h.indexOf(m[0]) < h.indexOf('</head>'), 'auto-lang script is in the head');
  assert.ok(m[0].includes('bot|crawl|spider') && m[0].includes('lighthouse'), 'auto-lang: bot guard');
  assert.equal((m[0].match(/l\.replace\(/g) || []).length, 1, 'lang-suggest: exactly one redirect');
  assert.ok(m[0].includes("if(st){if(st==='ru'||st==='en')l.replace(st+'/'+l.search+l.hash);return}"), 'lang-suggest: redirects only on the visitor\'s own stored ru/en choice');
  assert.ok(m[0].indexOf('l.replace(') > m[0].indexOf('d.referrer') && m[0].indexOf('l.replace(') > m[0].indexOf('bot|crawl'), 'lang-suggest: redirect only after the bot, ?lang= and referrer guards');
  assert.ok(m[0].includes('localStorage.getItem(k)') && m[0].includes("k='sl_lang'"), 'auto-lang: stored-choice guard');
  assert.ok(m[0].includes('lang=') && m[0].includes('d.referrer'), 'auto-lang: ?lang= and referrer guards');
  assert.ok(read('assets/js/site.js').includes("localStorage.setItem('sl_lang'") && read('neurographics/app.js').includes("localStorage.setItem('sl_lang'"), 'language switchers store sl_lang');
  for (const pre of ['ru/', 'en/']) assert.ok(read(pre + 'index.html').includes('hreflang="x-default"'), `${pre}home: hreflang kept`);
}
console.log(`PASS: ${ids.length} works in ${series.size} series with images, ${SITE.studio.length} studio photos, ${he.length} text keys in Hebrew, Russian and English, museum rooms, pages in three languages with sitemap and structured data, local references, dragon tale 29 pages per language.`);

// NeuroGraphica landing page (investor#893, Owner 2026-11-20): Russian first (x-default), Hebrew second, English third; static text that needs no script.
{
  const NG_PAGES = [['ru', 'ru/neurographica/'], ['he', 'neurographica/'], ['en', 'en/neurographica/']];
  for (const [l, dir] of NG_PAGES) {
    assert.ok(exists(dir + 'index.html'), `${dir}: exists`);
    const h = read(dir + 'index.html'), url = SITE_URL + dir;
    assert.ok(h.includes(`<html lang="${l}" dir="${l === 'he' ? 'rtl' : 'ltr'}">`), `${dir}: lang and dir`);
    assert.equal((h.match(/<h1[\s>]/g) || []).length, 1, `${dir}: exactly one h1`);
    assert.ok(/<h1>[^<]*(Нейрографика|נוירוגרפיקה|NeuroGraphica)/.test(h), `${dir}: the h1 names the method`);
    assert.ok((h.match(/<h2[\s>]/g) || []).length >= 6, `${dir}: h2 sections`);
    assert.ok(/<title>[^<]{30,}<\/title>/.test(h) && /<meta name="description" content="[^"]{80,160}">/.test(h), `${dir}: title and description (<= 160 characters)`);
    assert.ok(h.includes(`<link rel="canonical" href="${url}">`), `${dir}: canonical`);
    for (const [k, href] of [['ru', 'ru/neurographica/'], ['he', 'neurographica/'], ['en', 'en/neurographica/'], ['x-default', 'ru/neurographica/']]) {
      assert.ok(h.includes(`<link rel="alternate" hreflang="${k}" href="${SITE_URL}${href}">`), `${dir}: hreflang ${k}`);
      assert.ok(new RegExp(`<loc>${url}</loc>[\\s\\S]*?hreflang="${k}" href="${SITE_URL}${href}"[\\s\\S]*?</url>`).test(sitemap), `sitemap: ${dir} alternate ${k}`);
    }
    assert.ok(sitemap.includes(`<loc>${url}</loc>`), `sitemap: ${url}`);
    assert.ok(h.includes(`<meta property="og:image" content="${SITE_URL}assets/img/og-neurographica-${l}.jpg">`) && exists(`assets/img/og-neurographica-${l}.jpg`), `${dir}: its own og:image`);
    for (const og of ['og:title', 'og:description', 'og:url', 'og:locale']) assert.ok(h.includes(`property="${og}"`), `${dir}: ${og}`);
    const blocks = [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));
    assert.equal(blocks.length, 1, `${dir}: one JSON-LD block`);
    const graph = blocks[0]['@graph'], type = t => graph.find(x => x['@type'] === t);
    for (const t of ['WebPage', 'Person', 'HowTo', 'FAQPage', 'BreadcrumbList']) assert.ok(type(t), `${dir}: JSON-LD ${t}`);
    assert.ok(type('FAQPage').mainEntity.length >= 6 && type('FAQPage').mainEntity.every(q => q.name && q.acceptedAnswer.text), `${dir}: FAQPage questions and answers`);
    assert.ok(type('HowTo').step.length >= 8, `${dir}: HowTo steps`);
    // every FAQ answer and HowTo step in the JSON-LD is also visible text on the page
    const text = h.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
    for (const q of type('FAQPage').mainEntity) assert.ok(text.includes(q.name) && text.includes(q.acceptedAnswer.text), `${dir}: FAQ "${q.name}" visible`);
    for (const st of type('HowTo').step) assert.ok(text.includes(st.text), `${dir}: step ${st.position} visible`);
    // internal links: the simulator, WhatsApp booking, the gallery of works, the bio
    assert.ok(h.includes(`neurographics/?lang=${l}"`) && /href="https:\/\/wa\.me\/972535380014\?text=/.test(h) && h.includes('class="ngl-work"') && h.includes('data-bio-link'), `${dir}: links to the guide, WhatsApp, works and bio`);
    for (const [, id] of h.matchAll(/class="ngl-work" href="(?:\.\.\/)+(?:(?:ru|en)\/)?works\/([\w-]+)\//g)) assert.ok(SITE.works.find(w => w.id === id && w.kind === 'neuro'), `${dir}: ${id} is a NeuroGraphica work`);
    assert.ok(!/<script(?![^>]*(application\/ld\+json|analytics\.js))[^>]*src=/.test(h), `${dir}: no page script beyond analytics`);
    assert.ok(!/₪|\$\d|отзыв|ביקורת|testimonial|review/i.test(text), `${dir}: no prices or reviews (Sandra gave none)`);
    // the language switch reaches every landing page, the current one marked
    for (const [k, d] of NG_PAGES) assert.ok(new RegExp(`<nav class="lang"[^>]*>.*href="(?:\\.\\./)+${d}" hreflang="${k}" lang="${k}"${k === l ? ' aria-current="page"' : ''}>`).test(h), `${dir}: language switch to ${k}`);
  }
  for (const pre of ['', 'ru/', 'en/']) assert.ok(read(pre + 'index.html').includes('href="neurographica/" data-ng-landing'), `${pre}index.html links to its landing page`);
  assert.ok(read('robots.txt').includes('Allow: /') && !/Disallow:\s*\/\S/.test(read('robots.txt')), 'robots.txt allows crawling');
  const llms = read('llms.txt');
  assert.ok(llms.startsWith('# Sandra Leifer') && llms.includes('https://sandraleifer.com/ru/neurographica/') && llms.includes('https://sandraleifer.com/neurographica/') && llms.includes('https://sandraleifer.com/en/neurographica/'), 'llms.txt lists the landing pages');
  // the home template keeps what dist/index.html had (template drift, 2026-11-15): the language suggestion and the body-art data
  const tpl = fs.readFileSync(new URL('./src/site/home.html', import.meta.url), 'utf8');
  assert.ok(tpl.includes('<!--lang-suggest-->') && tpl.includes('body-art-data.js'), 'home template: lang-suggest marker and body-art-data.js');
  for (const page of ['index.html', 'ru/index.html', 'en/index.html']) assert.ok(read(page).includes('assets/js/body-art-data.js" defer'), `${page}: body-art-data.js`);
}
// Phone header must fit 360px (menu button was pushed off-screen at 390, 2026-11-20): the narrow-width rules must outrank the later `.wordmark{font-size:32px}`.
{
  const css = read('assets/css/site.css');
  assert.ok(/@media \(max-width:520px\)\{[^@]*\.header \.wordmark\{font-size:28px/.test(css), 'site.css: .header .wordmark must shrink at <=520px');
  assert.ok(/@media \(max-width:380px\)\{\s*\.header \.wordmark\{font-size:25px/.test(css), 'site.css: .header .wordmark must shrink at <=380px');
}
