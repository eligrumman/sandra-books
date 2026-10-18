'use strict';
(() => {
const S = window.SITE, IMG = window.IMAGES || {works: {}, studio: {}};
const $ = id => document.getElementById(id);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const store = {get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch {} }};
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

const query = new URLSearchParams(location.search).get('lang');
let lang = (query || store.get('sl-lang') || (navigator.language || '').slice(0, 2)) === 'ru' ? 'ru' : 'he';
let filter = 'all', visible = [], current = 0;
const t = k => S.text[lang][k] ?? k;
const L = arr => arr[lang === 'he' ? 0 : 1];
const work = id => S.works.find(w => w.id === id);

/* ---------- images ---------- */
function srcset(id, max) {
  const m = IMG.works[id]; if (!m) return {src: `assets/img/works/${id}-800.webp`};
  const widths = m.s.filter(w => !max || w <= max);
  return {
    src: `assets/img/works/${id}-${widths.includes(1600) ? 1600 : widths[0]}.webp`,
    srcset: widths.map(w => `assets/img/works/${id}-${w}.webp ${Math.min(w, m.w)}w`).join(', ')
  };
}
function img(id, {sizes = '100vw', max, lazy = true, alt = ''} = {}) {
  const i = document.createElement('img'), s = srcset(id, max), m = IMG.works[id];
  if (s.srcset) { i.srcset = s.srcset; i.sizes = sizes; }
  i.src = s.src; i.alt = alt; i.decoding = 'async';
  if (lazy) i.loading = 'lazy';
  if (m) { i.width = m.w; i.height = m.h; }
  return i;
}
const largest = id => { const m = IMG.works[id]; return `assets/img/works/${id}-${m ? m.s[m.s.length - 1] : 800}.webp`; };
const meta = w => [t(w.m), w.s ? `${w.s} ${t('cm')}` : '', w.y || ''].filter(Boolean).join(' · ');

/* ---------- i18n ---------- */
function applyLang() {
  const root = document.documentElement;
  root.lang = lang; root.dir = lang === 'he' ? 'rtl' : 'ltr';
  document.title = t('title');
  $$('[data-t]').forEach(e => { e.innerHTML = t(e.dataset.t); });
  $$('[data-t-label]').forEach(e => e.setAttribute('aria-label', t(e.dataset.tLabel)));
  $$('[data-t-alt]').forEach(e => e.alt = t(e.dataset.tAlt));
  $$('[data-lang]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
  $$('[data-book-link]').forEach(a => a.href = 'book/?lang=' + lang);
  $$('[data-dragon-link]').forEach(a => a.href = 'dragon/?lang=' + lang);
  const url = new URL(location.href); url.searchParams.set('lang', lang); history.replaceState(null, '', url);
  store.set('sl-lang', lang);
  renderMarquee(); renderSeries(); renderFilters(); renderGallery(); renderStudio(); renderHeroCaption(); journeyText(-1, true);
  if ($('lightbox').open) show(current);
}
$$('[data-lang]').forEach(b => b.addEventListener('click', () => { if (b.dataset.lang !== lang) { lang = b.dataset.lang; applyLang(); } }));

/* ---------- header ---------- */
const header = $('header'), menuBtn = $('menuBtn'), nav = $('nav');
let lastY = 0;
function onScrollHeader() {
  const y = window.scrollY;
  header.classList.toggle('solid', y > 40);
  header.classList.toggle('hide', y > lastY && y > 600 && !nav.classList.contains('open'));
  lastY = y;
}
function setMenu(open) {
  nav.classList.toggle('open', open); header.classList.toggle('menu-open', open);
  menuBtn.setAttribute('aria-expanded', String(open));
}
menuBtn.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
$$('a', nav).forEach(a => a.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('open')) { setMenu(false); menuBtn.focus(); } });
// highlight the section in view
const navLinks = $$('a', nav), sections = navLinks.map(a => document.querySelector(a.getAttribute('href')));
const spy = new IntersectionObserver(entries => entries.forEach(en => {
  if (!en.isIntersecting) return;
  navLinks.forEach(a => a.getAttribute('href') === '#' + en.target.id ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current'));
}), {rootMargin: '-45% 0px -50% 0px'});
sections.forEach(s => s && spy.observe(s));

/* ---------- hero ---------- */
const arch = $('heroArch'), heroIds = S.hero.filter(id => work(id));
let heroIndex = 0, heroTimer = 0;
heroIds.forEach((id, i) => {
  const im = img(id, {sizes: '(max-width:900px) 82vw, 560px', lazy: i > 0});
  if (i === 0) { im.fetchPriority = 'high'; im.classList.add('on'); }
  arch.append(im);
});
$('heroDots').replaceChildren(...heroIds.map((_, i) => el('i', i === 0 ? 'on' : '')));
function renderHeroCaption() {
  const w = work(heroIds[heroIndex]);
  $('heroCaption').textContent = `${L(w.t)} · ${t(w.m)}`;
  const m = IMG.works[w.id]; if (m) document.documentElement.style.setProperty('--glow', m.c);
}
function heroGo(n) {
  const imgs = $$('img', arch);
  imgs[heroIndex].classList.remove('on'); $('heroDots').children[heroIndex].classList.remove('on');
  heroIndex = (n + imgs.length) % imgs.length;
  imgs[heroIndex].classList.add('on'); $('heroDots').children[heroIndex].classList.add('on');
  renderHeroCaption();
}
function heroPlay() { clearInterval(heroTimer); if (!reduced.matches) heroTimer = setInterval(() => { if (!document.hidden) heroGo(heroIndex + 1); }, 5200); }
$('heroArt').addEventListener('click', () => { const i = S.works.findIndex(w => w.id === heroIds[heroIndex]); filter = 'all'; renderFilters(); renderGallery(); openArt(visible.findIndex(w => w.id === S.works[i].id)); });
$('heroArt').style.cursor = 'zoom-in';
heroPlay();

/* ---------- marquee ---------- */
function renderMarquee() {
  const words = S.marquee[lang], track = $('marquee'), frag = [];
  for (let r = 0; r < 4; r++) words.forEach(w => { frag.push(el('span', '', w)); frag.push(el('span', 'star', '✳')); });
  track.replaceChildren(...frag);
}

/* ---------- journey ---------- */
const journey = $('journey'), layers = $('journeyLayers'), scenes = S.journey;
journey.style.setProperty('--scenes', scenes.length + 0.6);
scenes.forEach((s, i) => { const im = img(s.id, {sizes: '100vw', lazy: i > 0}); im.style.objectPosition = s.pos; im.alt = ''; layers.append(im); });
const staticBox = el('div', 'journey-static');
journey.querySelector('.journey-stage').append(staticBox);
let journeyIndex = -1;
function journeyText(i, force) {
  if (i === -1) i = Math.max(0, journeyIndex);
  if (i === journeyIndex && !force) return;
  const s = scenes[i], w = work(s.id), copy = document.querySelector('.journey-copy');
  const write = () => {
    $('journeyCount').textContent = String(i + 1).padStart(2, '0') + ' / ' + String(scenes.length).padStart(2, '0');
    $('journeyKind').textContent = L(S.series.find(x => x.id === w.kind)[lang]);
    $('journeyTitle').innerHTML = s[lang][0];
    $('journeySub').textContent = s[lang][1];
    $('journeyCredit').textContent = `${L(w.t)} · ${t(w.m)}`;
    copy.classList.remove('swap');
  };
  if (force || journeyIndex === -1) write(); else { copy.classList.add('swap'); setTimeout(write, 260); }
  journeyIndex = i;
  staticBox.replaceChildren(...scenes.map(sc => {
    const f = el('figure'), cap = el('figcaption'); f.append(img(sc.id, {sizes: '(max-width:840px) 100vw, 50vw', max: 1600}));
    cap.append(el('h2', '', sc[lang][0]), el('p', '', sc[lang][1])); f.append(cap); return f;
  }));
}
function staticJourney() { return reduced.matches; }
function updateJourney() {
  document.body.classList.toggle('static-journey', staticJourney());
  if (staticJourney()) return;
  const r = journey.getBoundingClientRect(), vh = window.innerHeight;
  if (r.bottom < 0 || r.top > vh) return;
  const total = Math.max(1, journey.offsetHeight - vh), p = Math.min(1, Math.max(0, -r.top / total));
  const pos = p * (scenes.length - 1), i = Math.min(scenes.length - 1, Math.floor(pos + 0.0001)), local = pos - i;
  const imgs = layers.children;
  for (let k = 0; k < imgs.length; k++) {
    const im = imgs[k];
    if (k === 0) { im.style.transform = `scale(${1.15 - Math.min(1, pos) * 0.15})`; continue; }
    const reveal = Math.min(1, Math.max(0, (pos - (k - 1) - 0.35) / 0.6));
    im.style.clipPath = reveal >= 1 ? 'none' : `circle(${reveal * 75}% at 50% 55%)`;
    im.style.transform = `scale(${1.18 - reveal * 0.18})`;
    im.style.visibility = reveal > 0 ? 'visible' : 'hidden';
  }
  journeyText(local > 0.6 && i < scenes.length - 1 ? i + 1 : i);
  $('journeyBar').style.width = (p * 100) + '%';
}

/* ---------- series ---------- */
function renderSeries() {
  $('seriesRail').replaceChildren(...S.series.map((s, i) => {
    const b = el('button', 'series-card reveal in'); b.type = 'button';
    const count = S.works.filter(w => w.kind === s.id).length;
    b.append(img(s.cover, {sizes: '(max-width:1100px) 40vw, 22vw', max: 800}), el('span', 'num', String(i + 1).padStart(2, '0')));
    const body = el('span', 'body'); body.append(el('h3', '', s[lang][0]), el('p', '', s[lang][1]), el('span', 'count', `${count} ${t('works')} ${lang === 'he' ? '←' : '→'}`));
    b.append(body);
    b.addEventListener('click', () => { filter = s.id; renderFilters(); renderGallery(); $('works').scrollIntoView({behavior: reduced.matches ? 'auto' : 'smooth'}); });
    return b;
  }));
}

/* ---------- gallery ---------- */
function renderFilters() {
  const opts = [{id: 'all', name: t('all'), n: S.works.length}, ...S.series.map(s => ({id: s.id, name: s[lang][0], n: S.works.filter(w => w.kind === s.id).length}))];
  $('filters').replaceChildren(...opts.map(o => {
    const b = el('button'); b.type = 'button'; b.setAttribute('aria-pressed', String(o.id === filter));
    b.append(o.name); b.append(el('sup', '', o.n));
    b.addEventListener('click', () => { filter = o.id; renderFilters(); renderGallery(); });
    return b;
  }));
}
function renderGallery() {
  visible = S.works.filter(w => filter === 'all' || w.kind === filter);
  $('grid').replaceChildren(...visible.map((w, i) => {
    const b = el('button', 'work'); b.type = 'button'; b.style.animationDelay = Math.min(i, 8) * 45 + 'ms';
    b.setAttribute('aria-label', `${t('open')}: ${L(w.t)}`);
    const frame = el('span', 'frame'), m = IMG.works[w.id];
    if (m) frame.style.setProperty('--bg', m.c);
    const im = img(w.id, {sizes: '(max-width:520px) 46vw, (max-width:900px) 45vw, 30vw', max: 1600, alt: L(w.t)});
    im.addEventListener('load', () => im.classList.add('loaded'), {once: true});
    if (im.complete) im.classList.add('loaded');
    frame.append(im);
    const cap = el('span', 'cap'), txt = el('span');
    txt.append(el('h3', '', L(w.t))); txt.lastChild.textContent = L(w.t);
    const p = el('p'); p.textContent = meta(w); txt.append(p);
    cap.append(txt, el('span', 'no', String(S.works.indexOf(w) + 1).padStart(2, '0')));
    b.append(frame, cap);
    b.addEventListener('click', () => openArt(i));
    return b;
  }));
  $('gridStatus').textContent = `${visible.length} ${t('shown')}`;
}

/* ---------- lightbox ---------- */
const lb = $('lightbox'), lbImg = $('lbImg');
let zoom = false, lastFocus = null;
function show(i) {
  current = (i + visible.length) % visible.length;
  const w = visible[current];
  lbImg.classList.add('fading');
  const next = new Image(); next.src = largest(w.id);
  const swap = () => { lbImg.src = next.src; lbImg.alt = L(w.t); lbImg.classList.remove('fading'); };
  next.decode ? next.decode().then(swap, swap) : (next.onload = swap);
  setZoom(false);
  $('lbTitle').textContent = L(w.t);
  $('lbMeta').textContent = meta(w);
  $('lbCount').textContent = String(current + 1).padStart(2, '0') + ' / ' + String(visible.length).padStart(2, '0');
  const link = $('lbLink'); link.hidden = !w.p; if (w.p) link.href = 'https://www.under1000.com/he-IL/products/' + w.p;
  [visible[current + 1], visible[current - 1]].forEach(n => { if (n) { const p = new Image(); p.src = largest(n.id); } });
}
function openArt(i) {
  if (i < 0) i = 0;
  lastFocus = document.activeElement; show(i); lb.showModal(); document.documentElement.style.overflow = 'hidden';
  $('announce').textContent = L(visible[current].t);
}
function closeArt() { lb.close(); }
lb.addEventListener('close', () => { document.documentElement.style.overflow = ''; setZoom(false); if (lastFocus) lastFocus.focus({preventScroll: true}); });
$('lbClose').addEventListener('click', closeArt);
$('lbPrev').addEventListener('click', () => show(current - 1));
$('lbNext').addEventListener('click', () => show(current + 1));
lb.addEventListener('click', e => { if (e.target === lb || e.target === $('lbStage')) closeArt(); });
document.addEventListener('keydown', e => {
  if (!lb.open) return;
  const fwd = lang === 'he' ? 'ArrowLeft' : 'ArrowRight', back = lang === 'he' ? 'ArrowRight' : 'ArrowLeft';
  if (e.key === fwd) { e.preventDefault(); show(current + 1); }
  if (e.key === back) { e.preventDefault(); show(current - 1); }
});
function setZoom(on, x = .5, y = .5) {
  zoom = on; lbImg.classList.toggle('zoom', on);
  lbImg.style.transformOrigin = `${x * 100}% ${y * 100}%`;
  lbImg.style.transform = on ? 'scale(2.2)' : '';
}
lbImg.addEventListener('click', e => {
  if (moved) return;
  const r = lbImg.getBoundingClientRect();
  setZoom(!zoom, (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
});
lbImg.addEventListener('pointermove', e => {
  if (!zoom || e.pointerType !== 'mouse') return;
  const r = lbImg.getBoundingClientRect();
  lbImg.style.transformOrigin = `${Math.min(100, Math.max(0, (e.clientX - r.left) / r.width * 100))}% ${Math.min(100, Math.max(0, (e.clientY - r.top) / r.height * 100))}%`;
});
// swipe
let sx = 0, sy = 0, moved = false;
$('lbStage').addEventListener('pointerdown', e => { sx = e.clientX; sy = e.clientY; moved = false; });
$('lbStage').addEventListener('pointerup', e => {
  const dx = e.clientX - sx, dy = e.clientY - sy;
  if (!zoom && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) {
    moved = true; setTimeout(() => moved = false, 50);
    const forward = lang === 'he' ? dx > 0 : dx < 0; show(current + (forward ? 1 : -1));
  }
});

/* ---------- studio reel ---------- */
function renderStudio() {
  $('studioReel').replaceChildren(...S.studio.map(s => {
    const f = el('figure'), m = IMG.studio[s.id] || {w: 1400, h: 933, c: '#333'}, im = el('img');
    im.src = `assets/img/studio/${s.id}.webp`; im.width = m.w; im.height = m.h; im.loading = 'lazy'; im.decoding = 'async'; im.alt = s[lang];
    f.style.background = m.c; f.style.aspectRatio = `${m.w} / ${m.h}`;
    f.append(im, el('figcaption', '', s[lang])); return f;
  }));
}
(() => { // drag to scroll with a mouse
  const reel = $('studioReel'); let down = false, x0 = 0, s0 = 0;
  reel.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; down = true; x0 = e.clientX; s0 = reel.scrollLeft; reel.classList.add('drag'); });
  window.addEventListener('pointerup', () => { down = false; reel.classList.remove('drag'); });
  reel.addEventListener('pointermove', e => { if (down) reel.scrollLeft = s0 - (e.clientX - x0); });
  reel.addEventListener('keydown', e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); reel.scrollBy({left: (e.key === 'ArrowRight' ? 1 : -1) * reel.clientWidth * .6, behavior: 'smooth'}); } });
})();

/* ---------- reveal on scroll ---------- */
const revealer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => entries.forEach(en => {
  if (en.isIntersecting) { en.target.classList.add('in'); revealer.unobserve(en.target); }
}), {rootMargin: '0px 0px -8% 0px', threshold: .08}) : null;
$$('.reveal').forEach(e => revealer ? revealer.observe(e) : e.classList.add('in'));

/* ---------- loop ---------- */
let ticking = false;
function frame() { ticking = false; onScrollHeader(); updateJourney(); }
window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, {passive: true});
window.addEventListener('resize', () => requestAnimationFrame(frame));
reduced.addEventListener?.('change', () => { heroPlay(); frame(); });

$('year').textContent = new Date().getFullYear();
applyLang();
frame();
window.__site = {get lang() { return lang; }, get visible() { return visible; }, openArt, show, updateJourney};
})();
