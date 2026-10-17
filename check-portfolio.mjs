import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root=new URL('./portfolio/',import.meta.url),html=fs.readFileSync(new URL('index.html',root),'utf8');
class Element{
 constructor(tag='DIV',attrs={}){this.tagName=tag.toUpperCase();this.attrs=attrs;this.dataset=Object.fromEntries(Object.entries(attrs).filter(([k])=>k.startsWith('data-')).map(([k,v])=>[k.slice(5),v]));this.children=[];this.style={};this.textContent='';this.classList={toggle(){}};this.open=false;this.offsetHeight=6500;this.offsetTop=0;this.rect={top:0,bottom:6500};this.events={}}
 append(...els){this.children.push(...els)}replaceChildren(...els){this.children=els}setAttribute(k,v){this.attrs[k]=v}removeAttribute(k){delete this.attrs[k]}addEventListener(k,f){this.events[k]=f}showModal(){this.open=true}close(){this.open=false;this.events.close?.()}getBoundingClientRect(){return this.rect}
}
const nodes=[...html.matchAll(/<([a-z][\w-]*)\b([^>]*)>/gi)].map(m=>new Element(m[1],Object.fromEntries([...m[2].matchAll(/([\w-]+)="([^"]*)"/g)].map(x=>[x[1],x[2]]))));
const ids=Object.fromEntries(nodes.filter(n=>n.attrs.id).map(n=>[n.attrs.id,n])),events={},rootEl=new Element(),body=new Element();
function q(s){if(s.startsWith('[data-')){const key=s.slice(1,-1);return nodes.filter(n=>key in n.attrs)}if(s.startsWith('.'))return nodes.filter(n=>(n.attrs.class||'').split(' ').includes(s.slice(1)));return[]}
const document={getElementById:id=>{assert.ok(ids[id],id);return ids[id]},querySelectorAll:q,querySelector:s=>q(s)[0],documentElement:rootEl,body,createElement:t=>new Element(t),addEventListener:(k,f)=>events[k]=f};
const location={href:'https://example.test/portfolio/',search:''},media={matches:false,addEventListener(){}},context=vm.createContext({document,location,window:{innerHeight:1000,matchMedia:()=>media,addEventListener(){},scrollTo(){}},history:{replaceState(){}},URL,URLSearchParams,Image:Element,Date,requestAnimationFrame:()=>1});
vm.runInContext(fs.readFileSync(new URL('app.js',root),'utf8'),context);
assert.equal(ids.galleryGrid.children.length,9);
assert.equal(ids.sceneA.src,'assets/horse.webp');
for(const [kind,count] of [['body',3],['paint',3],['line',3],['all',9]]){q('[data-filter]').find(x=>x.dataset.filter===kind).onclick();assert.equal(ids.galleryGrid.children.length,count)}
ids.galleryGrid.children[0].children[0].onclick();assert.ok(ids.artDialog.open);assert.equal(ids.dialogImage.src,'assets/horse.webp');ids.nextArt.onclick();assert.equal(ids.dialogImage.src,'assets/gaze.webp');ids.closeArt.onclick();assert.equal(body.style.overflow,'');
ids.language.onchange({target:{value:'ru'}});assert.equal(rootEl.dir,'ltr');assert.equal(ids.galleryGrid.children[0].children[0].attrs['aria-label'],'Открыть работу: Электрический галоп');
for(let i=0;i<6;i++){ids.journey.rect.top=-1100*i;vm.runInContext('update()',context);assert.equal(ids.sceneA.src,'assets/'+['horse','gaze','alchemist','smoke','tree','petals'][i]+'.webp')}
ids.motion.onclick();assert.equal(ids.motion.attrs['aria-pressed'],'true');vm.runInContext('update()',context);assert.equal(ids.sceneA.src,'assets/horse.webp');
ids.language.onchange({target:{value:'he'}});assert.equal(rootEl.dir,'rtl');
for(const x of [...html.matchAll(/(?:src|href)="(assets\/[^\"]+|style\.css|app\.js)"/g)])assert.ok(fs.existsSync(new URL(x[1],root)),x[1]);
const images=vm.runInContext('works.map(w=>w.id)',context);for(const id of images)assert.ok(fs.statSync(new URL('assets/'+id+'.webp',root)).size>1000);
const keys=vm.runInContext('Object.keys(text.he)',context);for(const key of keys)assert.ok(vm.runInContext('text.ru['+JSON.stringify(key)+']',context),key);
assert.ok(!html.includes('mailto:')&&!html.includes('tel:'),'No invented contact information');
console.log('PASS: all 9 artworks; 3 category filters; lightbox; 6 alternating painting/body-art scenes; Hebrew/Russian; reduced-motion switch; local asset references. Browser rendering not verified.');
