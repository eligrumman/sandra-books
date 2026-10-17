import fs from 'node:fs';
import assert from 'node:assert/strict';
const root=new URL('./portfolio/',import.meta.url);
const h=fs.readFileSync(new URL('index.html',root),'utf8');
assert.ok(!h.includes('href="https://sandraleifer.com"'));
assert.equal((h.match(/data-book-link/g)||[]).length,2);
for(const p of ['index.html','app.js','style.css','book.json','book-ru.json','locales.json'])assert.ok(fs.existsSync(new URL('book/'+p,root)));
for(const lang of ['book.json','book-ru.json']){const b=JSON.parse(fs.readFileSync(new URL('book/'+lang,root)));assert.equal(b.length,30);for(const p of b)assert.ok(fs.existsSync(new URL('book/'+p.image,root)));}
assert.ok(fs.readFileSync(new URL('book/index.html',root),'utf8').includes('id="artistBack"'));
console.log('PASS: internal book links, Hebrew/Russian complete reader and 30 local book illustrations.');
