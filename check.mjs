import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const html=fs.readFileSync('dist/index.html','utf8');
const book=JSON.parse(fs.readFileSync('dist/book.json'));
const audit=JSON.parse(fs.readFileSync('dist/audit.json'));
const original=fs.readFileSync('story-pages.txt','utf8').trim().split('===PAGE===').map(s=>s.trim());
assert.equal(book.length,30);assert.equal(original.length,29);
assert.equal(new Set(book.map(p=>p.image)).size,30);
for(let n=1;n<=29;n++){
  assert.equal(book[n].n,n);let text=book[n].text;
  for(const c of [...audit.corrections].reverse().filter(c=>c.page===n))text=text.replace(c.after,c.before);
  assert.equal(text,original[n-1],`Unexplained text difference on page ${n}`);
  assert.ok(fs.statSync('dist/'+book[n].image).size>10000);
  assert.ok(book[n].start>0&&book[n].start<book[n].end&&book[n].end<1);
}
class Element{
  constructor(){this.children=[];this.style={setProperty(){}};this.dataset={};this.attrs={};this.classList={add(){},remove(){},toggle(){}};this.tagName='DIV';this.textContent='';}
  append(...c){this.children.push(...c)}replaceChildren(...c){this.children=c}setAttribute(k,v){this.attrs[k]=v}removeAttribute(k){delete this.attrs[k]}addEventListener(){}focus(){}showModal(){this.open=true}close(){this.open=false}
}
const elements=Object.fromEntries([...html.matchAll(/id="([^"]+)"/g)].map(m=>[m[1],new Element()]));
const events={};const values=new Map();const location={hash:'',search:''};
const extras={};
const document={getElementById:id=>{assert.ok(elements[id],`Missing ${id}`);return elements[id]},createElement:()=>new Element(),documentElement:new Element(),body:new Element(),activeElement:new Element(),querySelectorAll:s=>s==='.thumb'?elements.pageGrid.children:[],querySelector:s=>s==='dialog[open]'?null:(extras[s]??=new Element()),addEventListener:(n,f)=>events[n]=f,title:''};
const ctx=vm.createContext({document,localStorage:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)},location,history:{replaceState:(a,b,url)=>{location.hash=url.slice(url.indexOf('#'));location.search=url.slice(0,url.indexOf('#'))}},window:{scrollTo(){},addEventListener(){}},fetch:async f=>({ok:true,json:async()=>JSON.parse(fs.readFileSync('dist/'+f))}),Image:Element,URLSearchParams,console});
vm.runInContext(fs.readFileSync('dist/app.js','utf8'),ctx);
await new Promise(r=>setImmediate(r));
assert.equal(elements.cover.hidden,false);
elements.start.onclick();assert.equal(elements.rangeLabel.textContent,'עמוד 1 מתוך 29');
for(let n=1;n<=29;n++){
  assert.equal(elements.story.children.map(c=>c.textContent).join('\n'),book[n].text.split('\n').filter(Boolean).join('\n'));
  assert.equal(elements.art.src,book[n].image);
  if(n<29)elements.next.onclick();
}
assert.equal(elements.next.disabled,true);assert.equal(elements.ending.hidden,false);
elements.prev.onclick();assert.equal(location.hash,'#p=28');
events.keydown({key:'ArrowRight',preventDefault(){}});assert.equal(location.hash,'#p=27');
elements.pageRange.oninput({target:{value:9}});assert.equal(location.hash,'#p=9');
elements.night.onclick();assert.equal(elements.night.attrs['aria-checked'],'true');
for(let i=0;i<10;i++)elements.larger.onclick();assert.equal(elements.sizeLabel.textContent,'145%');
elements.home.onclick();assert.equal(elements.reader.hidden,true);
elements.resume.onclick();assert.equal(location.hash,'#p=9');
/*console.log('PASS: 29 complete ordered texts, 30 distinct assets, 8 explained corrections, all page navigation, boundaries, resume, keyboard, font limits and night state. Browser layout remains unverified (preview infrastructure unavailable).');*/

const ru=JSON.parse(fs.readFileSync('dist/book-ru.json'));
const rawRu=fs.readFileSync('story-ru.txt','utf8').trim().split('===PAGE===');
assert.equal(ru.length,book.length);assert.equal(rawRu.length,29);
for(let n=1;n<=29;n++){
 const [title,...text]=rawRu[n-1].trim().split('\n');
 assert.equal(ru[n].title,title);assert.equal(ru[n].text,text.join('\n'));
 assert.equal(ru[n].image,book[n].image);assert.equal(ru[n].chapter,book[n].chapter);
 assert.ok(!/[\u0590-\u05ff]/.test(ru[n].text),'No Hebrew leaking into Russian story');
}
elements.language.onchange({target:{value:'ru'}});
assert.equal(location.hash,'#p=9');assert.equal(location.search,'?lang=ru');assert.equal(document.documentElement.dir,'ltr');
assert.equal(elements.rangeLabel.textContent,'Страница 9 из 29');
assert.equal(elements.pageGrid.children.length,30);assert.equal(elements.notes.children.length,5);
elements.start.onclick();
for(let n=1;n<=29;n++){
 assert.equal(elements.story.children.map(c=>c.textContent).join('\n'),ru[n].text.split('\n').filter(Boolean).join('\n'));
 if(n<29)elements.next.onclick();
}
assert.equal(elements.next.disabled,true);
events.keydown({key:'ArrowLeft',preventDefault(){}});assert.equal(location.hash,'#p=28');
elements.language.onchange({target:{value:'he'}});assert.equal(location.hash,'#p=28');assert.equal(document.documentElement.dir,'rtl');
assert.equal(elements.story.children.map(c=>c.textContent).join('\n'),book[28].text);
assert.equal(elements.pageGrid.children.length,30);assert.equal(elements.notes.children.length,5);
assert.equal(values.get('unicorn-page'),'28');assert.equal(elements.sizeLabel.textContent,'145%');assert.equal(elements.night.attrs['aria-checked'],'true');
console.log('PASS: 29 complete ordered pages in both languages, shared assets, Hebrew source regression, language switching retains page/settings, RTL/LTR keyboard, navigation and all five editorial questions.');
