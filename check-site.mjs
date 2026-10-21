// Static checks for the artist site in dist/: content integrity, translations and local references.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const root = new URL('./dist/', import.meta.url);
const read = p => fs.readFileSync(new URL(p, root), 'utf8');
const exists = p => fs.existsSync(new URL(p, root));
const ctx = vm.createContext({window: {}});
vm.runInContext(read('assets/js/images.js') + read('assets/js/data.js') + read('assets/js/catalog.js'), ctx);
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
for (const page of ['index.html', 'ru/index.html', 'en/index.html', 'museum/index.html', 'dragon/index.html', 'book/index.html', ...workPages]) {
  const dir = page.includes('/') ? page.slice(0, page.lastIndexOf('/') + 1) : '';
  for (const [, ref] of read(page).matchAll(/(?:src|href)="([^"#?]+)[^"]*"/g)) {
    if (/^(https?:|mailto:|data:)/.test(ref) || ref.endsWith('/')) continue;
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
  for (const page of [`${['', 'ru/', 'en/'][i]}index.html`, ...SITE.works.map(w => `${['', 'ru/', 'en/'][i]}works/${w.id}/index.html`)]) {
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
for (const r of museum.matchAll(/kind: '(\w+)', wall:/g)) assert.ok(series.has(r[1]), `museum room ${r[1]}`);

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

console.log(`PASS: ${ids.length} works in ${series.size} series with images, ${SITE.studio.length} studio photos, ${he.length} text keys in Hebrew, Russian and English, museum rooms, pages in three languages with sitemap and structured data, local references, dragon tale 29 pages per language.`);
