#!/usr/bin/env node
// Verbatim check: the visible text of every biography page equals src/site/bio.md (markdown markers removed).
// Usage: node tools/check-bio.mjs                 static: reads <main> of dist/**/about/index.html
//        node tools/check-bio.mjs <he|en|ru> <file>  compares text exported from a browser (innerText of <main>) to the source
import fs from 'node:fs';
const root = new URL('../', import.meta.url);
const src = fs.readFileSync(new URL('src/site/bio.md', root), 'utf8').split(/^={10,} .*$/m).slice(1);
const norm = s => s.replace(/\s+/g, ' ').trim();
const expected = lang => norm(src[['he', 'en', 'ru'].indexOf(lang)].split('\n').map(l => l.trim()).filter(Boolean)
  .map(l => l.replace(/^# /, '').replace(/^- /, '').replace(/^\*\*(.*)\*\*$/, '$1').replace(/^\*(.*)\*$/, '$1')).join(' '));
const unesc = s => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
let bad = 0;
function compare(label, lang, got) {
  const want = expected(lang), ok = got === want;
  console.log(`${ok ? 'MATCH' : 'DIFF '} ${label} (${want.length} chars)`);
  if (!ok) { bad++; const i = [...want].findIndex((c, k) => c !== got[k]); console.log('  first difference at', i, JSON.stringify(want.slice(i - 20, i + 20)), 'vs', JSON.stringify(got.slice(i - 20, i + 20))); }
}
if (process.argv[2]) { // text exported from a browser; agent-browser eval prints a JSON string
  const raw = fs.readFileSync(process.argv[3], 'utf8').trim();
  compare(process.argv[3], process.argv[2], norm(raw.startsWith('"') ? JSON.parse(raw) : raw));
}
else for (const [lang, page] of [['he', 'dist/about/'], ['en', 'dist/en/about/'], ['ru', 'dist/ru/about/']]) {
  const h = fs.readFileSync(new URL(page + 'index.html', root), 'utf8');
  const main = h.match(/<main[^>]*>([\s\S]*?)<\/main>/)[1];
  compare(`${lang} ${page}`, lang, norm(unesc(main.replace(/<[^>]+>/g, ' '))));
}
process.exit(bad ? 1 : 0);
