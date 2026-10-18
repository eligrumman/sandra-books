// Static checks for the artist site in dist/: content integrity, translations and local references.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const root = new URL('./dist/', import.meta.url);
const read = p => fs.readFileSync(new URL(p, root), 'utf8');
const exists = p => fs.existsSync(new URL(p, root));
const ctx = vm.createContext({window: {}});
vm.runInContext(read('assets/js/images.js') + read('assets/js/data.js'), ctx);
const {SITE, IMAGES} = ctx.window;

// Works: unique, in a known series, with generated images.
const ids = SITE.works.map(w => w.id);
assert.equal(new Set(ids).size, ids.length, 'duplicate work id');
const series = new Set(SITE.series.map(s => s.id));
for (const w of SITE.works) {
  assert.ok(series.has(w.kind), `${w.id}: unknown series ${w.kind}`);
  assert.ok(w.t[0] && w.t[1], `${w.id}: title in both languages`);
  assert.ok(SITE.text.he[w.m] && SITE.text.ru[w.m], `${w.id}: medium ${w.m}`);
  const m = IMAGES.works[w.id];
  assert.ok(m, `${w.id}: no image metadata`);
  for (const size of m.s) assert.ok(fs.statSync(new URL(`assets/img/works/${w.id}-${size}.webp`, root)).size > 5000, `${w.id}-${size}`);
}
for (const s of SITE.series) {
  assert.ok(SITE.works.some(w => w.kind === s.id), `empty series ${s.id}`);
  assert.ok(ids.includes(s.cover), `series cover ${s.cover}`);
}
for (const id of [...SITE.hero, ...SITE.journey.map(j => j.id)]) assert.ok(ids.includes(id), `hero/journey ${id}`);
for (const s of [...SITE.studio, ...SITE.exhibition]) assert.ok(exists(`assets/img/studio/${s.id}.webp`) && s.he && s.ru, `studio ${s.id}`);

// Translations: same keys in both languages and every data-t key defined.
const he = Object.keys(SITE.text.he), ru = Object.keys(SITE.text.ru);
assert.deepEqual([...he].sort(), [...ru].sort(), 'Hebrew and Russian keys differ');
const html = read('index.html');
for (const [, key] of html.matchAll(/data-t(?:-label|-alt)?="([^"]+)"/g)) assert.ok(key in SITE.text.he, `missing text key ${key}`);
for (const j of SITE.journey) assert.ok(j.he.length === 2 && j.ru.length === 2);

// Local references in every page resolve.
for (const page of ['index.html', 'dragon/index.html', 'book/index.html']) {
  const dir = page.includes('/') ? page.slice(0, page.lastIndexOf('/') + 1) : '';
  for (const [, ref] of read(page).matchAll(/(?:src|href)="([^"#?]+)[^"]*"/g)) {
    if (/^(https?:|mailto:|data:)/.test(ref) || ref.endsWith('/')) continue;
    assert.ok(exists(dir + ref), `${page}: missing ${ref}`);
  }
}
for (const dir of ['book/', 'dragon/']) assert.ok(exists(dir + 'index.html'), dir);

// Dragon tale: same reader format as the unicorn, 29 pages in both languages.
const dragon = ['book.json', 'book-ru.json'].map(f => JSON.parse(read('dragon/' + f)));
for (const b of dragon) {
  assert.equal(b.length, 30);
  b.forEach((p, n) => { assert.equal(p.n, n); assert.ok(n === 0 || p.text.length > 100, `dragon page ${n}`); assert.ok(exists('dragon/' + p.image), p.image); });
}
dragon[0].forEach((p, n) => assert.equal(p.chapter, dragon[1][n].chapter, `dragon chapter on page ${n}`));
assert.ok(!html.includes('mailto:') && !html.includes('tel:'), 'no invented contact details');

console.log(`PASS: ${ids.length} works in ${series.size} series with images, ${SITE.studio.length} studio photos, ${he.length} text keys in Hebrew and Russian, local references, dragon tale 29 pages per language.`);
