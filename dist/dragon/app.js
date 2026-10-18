'use strict';
const $=id=>document.getElementById(id);
const storage={get(k,fallback=null){try{return localStorage.getItem(k)??fallback}catch{return fallback}},set(k,v){try{localStorage.setItem(k,String(v))}catch{}}};
let book=[],books={},audits={},locales={},page=0,size=Number(storage.get('dragon-size','100')),night=storage.get('dragon-night')==='true';
const requested=new URLSearchParams(location.search).get('lang');
let lang=(requested||storage.get('dragon-lang','he'))==='ru'?'ru':'he';
const t=key=>locales[lang]?.[key]||key;
const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
const pageLabel=n=>`${t('page')} ${n}`;
function crop(el,img,p){const span=p.end-p.start;el.style.aspectRatio=`${p.width} / ${p.height*span}`;img.style.height=`${100/span}%`;img.style.top=`${-p.start/span*100}%`;img.src=p.image;img.alt=p.title;}
function go(n,{focus=false,scroll=true}={}){
 page=clamp(Math.round(Number(n)||0),0,29);
 const query=new URLSearchParams(location.search);query.set('lang',lang);history.replaceState(null,'',`?${query}#p=${page}`);
 $('cover').hidden=page!==0;$('reader').hidden=page===0;$('readingNav').hidden=page===0;
 if(page){
  const p=book[page];$('chapter').textContent=`${t('part')} ${p.chapter} · ${t('ch'+p.chapter)}`;$('position').textContent=`${pageLabel(page)} / 29`;
  $('pageTitle').textContent=p.title;$('printedNumber').textContent=page;
  $('story').replaceChildren(...p.text.split('\n').filter(Boolean).map(text=>{const el=document.createElement(/^(חלק|Часть) [234]$/.test(text)?'h2':'p');el.textContent=text;return el;}));
  crop($('artCrop'),$('art'),p);$('artCaption').textContent=p.title;$('prev').disabled=false;$('next').disabled=page===29;
  $('next').setAttribute('aria-label',page===29?t('end'):t('label_next'));$('rangeLabel').textContent=`${pageLabel(page)} ${t('of')} 29`;$('pageRange').value=page;$('ending').hidden=page!==29;
  storage.set('dragon-page',page);$('spread').classList.remove('turn');void $('spread').offsetWidth;$('spread').classList.add('turn');
  if(page<29){const preload=new Image();preload.src=book[page+1].image;}if(focus)$('textPage').focus({preventScroll:true});
 }
 const resume=clamp(Number(storage.get('dragon-page','0'))||0,0,29);$('resume').hidden=!resume;$('resume').textContent=`${t('resume')} ${resume} ${lang==='he'?'←':'→'}`;
 document.title=page?`${book[page].title} · ${t('brand')}`:t('footer');$('announcement').textContent=page?`${pageLabel(page)} ${t('of')} 29: ${book[page].title}`:t('cover');
 if(scroll)window.scrollTo({top:0,behavior:'instant'});
}
function modal(id){$(id).showModal();}
function applySettings(){size=clamp(Number.isFinite(size)?size:100,85,145);document.documentElement.style.setProperty('--scale',size/100);$('sizeLabel').textContent=`${size}%`;$('smaller').disabled=size<=85;$('larger').disabled=size>=145;document.body.classList.toggle('night',night);$('night').setAttribute('aria-checked',String(night));$('night').textContent=t(night?'on':'off');storage.set('dragon-size',size);storage.set('dragon-night',night);}
function buildGrid(){
 $('pageGrid').replaceChildren();
 for(const p of book){const b=document.createElement('button');b.className='thumb';b.dataset.page=p.n;b.setAttribute('aria-label',p.n?`${pageLabel(p.n)}: ${p.title}`:t('cover'));const c=document.createElement('div');c.className='art-crop';const img=document.createElement('img');img.src=p.image;img.loading='lazy';img.alt='';c.append(img);const title=document.createElement('strong');title.textContent=p.title;const number=document.createElement('small');number.textContent=p.n?pageLabel(p.n):t('cover');b.append(c,title,number);b.onclick=()=>{$('pagesDialog').close();go(p.n,{focus:true});};$('pageGrid').append(b);}
}
function showPages(){document.querySelectorAll('.thumb').forEach(b=>{if(Number(b.dataset.page)===page)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});modal('pagesDialog');}
function buildAudit(audit){
 $('notes').replaceChildren();$('corrections').replaceChildren();
 for(const n of audit.notes){const item=document.createElement('section');item.className='note';const h=document.createElement('h4');h.textContent=n.title;const p=document.createElement('p');p.textContent=n.detail;item.append(h,p);for(const number of n.pages){const b=document.createElement('button');b.textContent=pageLabel(number);b.onclick=()=>{$('reviewDialog').close();go(number)};item.append(b);}$('notes').append(item);}
 for(const c of audit.corrections){const p=document.createElement('div');p.className='correction';const label=document.createElement('span');label.textContent=pageLabel(c.page)+': ';const quote=document.createElement('bdi');quote.lang='he';quote.dir='rtl';quote.textContent=`״${c.before}״ ← ״${c.after}״`;p.append(label,quote);$('corrections').append(p);}
}
function setLanguage(value){
 lang=value==='ru'?'ru':'he';book=books[lang];$('artistBack').href='../?lang='+lang;$('artistBack').setAttribute('aria-label',lang==='ru'?'На сайт художницы':'לאתר האמנית');$('artistBack').lastElementChild.textContent=lang==='ru'?'Сайт художницы':'אתר האמנית';storage.set('dragon-lang',lang);document.documentElement.lang=lang;document.documentElement.dir=lang==='he'?'rtl':'ltr';$('language').value=lang;
 document.querySelectorAll('[data-i18n]').forEach(el=>el.textContent=t(el.dataset.i18n));
 document.querySelectorAll('[data-label]').forEach(el=>el.setAttribute('aria-label',t('label_'+el.dataset.label)));
 document.querySelector('.cover-art img').alt=t('coverAlt');
 document.querySelector('#prev b').textContent=lang==='he'?'→':'←';document.querySelector('#next b').textContent=lang==='he'?'←':'→';
 $('settingsBtn').textContent=lang==='he'?'אא':'Аа';$('smaller').textContent=lang==='he'?'א−':'А−';$('larger').textContent=lang==='he'?'א+':'А+';
 buildGrid();buildAudit(audits[lang]);applySettings();go(page,{scroll:false});
}
async function init(){
 try{
 const read=async f=>{const r=await fetch(f);if(!r.ok)throw Error();return r.json()};
 const [he,ru,ah,ar,l]=await Promise.all(['book.json','book-ru.json','audit.json','audit-ru.json','locales.json'].map(read));
 if(he.length!==30||ru.length!==30)throw Error();books={he,ru};audits={he:ah,ru:ar};locales=l;
 const match=location.hash.match(/^#p=(\d+)$/);page=match?Number(match[1]):0;setLanguage(lang);$('loading').hidden=true;$('language').disabled=false;
 }catch{$('loading').textContent=lang==='ru'?'Не удалось открыть книгу. Проверьте подключение и обновите страницу.':'לא הצלחנו לפתוח את הספר. בדקו את החיבור ונסו לרענן.';}
}
$('language').disabled=true;$('language').onchange=e=>setLanguage(e.target.value);
$('start').onclick=()=>go(1,{focus:true});$('resume').onclick=()=>go(Number(storage.get('dragon-page','1')),{focus:true});$('home').onclick=()=>go(0);$('restart').onclick=()=>go(1,{focus:true});$('prev').onclick=()=>go(page-1,{focus:true});$('next').onclick=()=>go(page+1,{focus:true});$('pageRange').oninput=e=>go(e.target.value,{scroll:false});$('pagesBtn').onclick=showPages;$('position').onclick=showPages;$('settingsBtn').onclick=()=>modal('settingsDialog');$('reviewBtn').onclick=()=>modal('reviewDialog');$('smaller').onclick=()=>{size-=10;applySettings()};$('larger').onclick=()=>{size+=10;applySettings()};$('night').onclick=()=>{night=!night;applySettings()};$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch{$('announcement').textContent=t('fullError');}};
 document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>b.closest('dialog').close());document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{$('pagesDialog').close();go(b.dataset.go,{focus:true})});document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close()}}));
 document.addEventListener('keydown',e=>{if(!book.length||document.querySelector('dialog[open]')||['INPUT','SELECT','TEXTAREA'].includes(document.activeElement.tagName))return;if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();const next=lang==='he'?'ArrowLeft':'ArrowRight';go(page+(e.key===next?1:-1),{focus:true})}});
 let touch=null;$('artCrop').addEventListener('touchstart',e=>{touch=e.touches.length===1?{x:e.touches[0].clientX,y:e.touches[0].clientY}:null},{passive:true});$('artCrop').addEventListener('touchend',e=>{if(!touch)return;const dx=e.changedTouches[0].clientX-touch.x,dy=e.changedTouches[0].clientY-touch.y;if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5)go(page+(dx>0?1:-1)*(lang==='he'?1:-1),{focus:true});touch=null},{passive:true});
 window.addEventListener('hashchange',()=>{if(book.length)go(Number(location.hash.match(/^#p=(\d+)$/)?.[1]||0))});init();
