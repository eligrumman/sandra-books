'use strict';
(() => {
const S = window.SITE, IMG = window.IMAGES || {works: {}, studio: {}};
const $ = id => document.getElementById(id);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const store = {get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch {} }};
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

// Each language has its own page (/, /ru/, /en/); BASE leads back to the site root from it.
const LANGS = ['he', 'ru', 'en'];
const BASE = document.documentElement.dataset.base || '';
const lang = LANGS.includes(document.documentElement.lang) ? document.documentElement.lang : 'he';
const home = l => BASE + (l === 'he' ? '' : l + '/');
const workUrl = id => home(lang) + 'works/' + id + '/';
const query = new URLSearchParams(location.search).get('lang'); // old links: ?lang=ru
if (LANGS.includes(query) && query !== lang) { location.replace(home(query) + location.hash); return; }
let filter = 'all', visible = [], current = 0, showAll = false;
const PREVIEW = 12;
const t = k => S.text[lang][k] ?? k;
const L = arr => arr[LANGS.indexOf(lang)] ?? arr[0]; // texts are [he, ru, en]
const work = id => S.works.find(w => w.id === id);

/* ---------- images ---------- */
function srcset(id, max) {
  const m = IMG.works[id]; if (!m) return {src: `${BASE}assets/img/works/${id}-800.webp`};
  const widths = m.s.filter(w => !max || w <= max);
  return {
    src: `${BASE}assets/img/works/${id}-${widths.includes(1600) ? 1600 : widths[0]}.webp`,
    srcset: widths.map(w => `${BASE}assets/img/works/${id}-${w}.webp ${Math.min(w, m.w)}w`).join(', ')
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
const largest = id => { const m = IMG.works[id]; return `${BASE}assets/img/works/${id}-${m ? m.s[m.s.length - 1] : 800}.webp`; };
const ltr = s => s ? '\u2066' + s + '\u2069' : ''; // keep '90 × 120' and '2025–2026' in reading order inside Hebrew
const meta = w => [w.med ? L(w.med) : t(w.m), w.s ? `${ltr(w.s)} ${t('cm')}` : '', ltr(String(w.y || ''))].filter(Boolean).join(' · ');

/* ---------- i18n ---------- */
function applyLang() {
  const root = document.documentElement;
  root.lang = lang; root.dir = lang === 'he' ? 'rtl' : 'ltr';
  document.title = t('title');
  $$('[data-t]').forEach(e => { e.innerHTML = t(e.dataset.t); });
  $$('[data-t-label]').forEach(e => e.setAttribute('aria-label', t(e.dataset.tLabel)));
  $$('[data-t-alt]').forEach(e => e.alt = t(e.dataset.tAlt));
  $$('[data-book-link]').forEach(a => a.href = BASE + 'book/?lang=' + lang);
  $$('[data-dragon-link]').forEach(a => a.href = BASE + 'dragon/?lang=' + lang);
  $$('[data-museum-link]').forEach(a => a.href = BASE + 'museum/?lang=' + lang);
  // switching language keeps you in the same section
  $$('[data-lang-link]').forEach(a => a.addEventListener('click', () => { a.href = home(a.dataset.langLink) + location.hash; }));
  store.set('sl-lang', lang);
  renderSeries(); renderFilters(); renderGallery(); renderExhibition(); renderStudio();
  if ($('lightbox').open) show(current);
}
$('moreWorks').addEventListener('click', () => { showAll = !showAll; renderGallery(); if (!showAll) $('works').scrollIntoView({behavior: 'smooth'}); });

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
const navLinks = $$('a', nav).filter(a => a.getAttribute('href').startsWith('#')), sections = navLinks.map(a => document.querySelector(a.getAttribute('href')));
const spy = new IntersectionObserver(entries => entries.forEach(en => {
  if (!en.isIntersecting) return;
  navLinks.forEach(a => a.getAttribute('href') === '#' + en.target.id ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current'));
}), {rootMargin: '-45% 0px -50% 0px'});
sections.forEach(s => s && spy.observe(s));

/* ---------- hero: endless wall ---------- */
window.EndlessWall($('hero'), S.works.map(w => w.id), {
  base: BASE, title: id => L(work(id).t), reduced: reduced.matches,
  calmZones: [document.querySelector('.wall-down'), document.querySelector('.wall-museum')],
  onOpen: id => { filter = 'all'; renderFilters(); renderGallery(); openArt(visible.findIndex(w => w.id === id)); }
});

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
// Masonry that keeps reading order: each work goes to the currently shortest column.
function columnsFor() { const w = $('grid').clientWidth || window.innerWidth; return w < 700 ? 2 : w < 1100 ? 3 : 4; }
let galleryCols = 0;
function layoutGallery(items) {
  if (!showAll) items = items.slice(0, PREVIEW);
  const n = columnsFor(), cols = Array.from({length: n}, () => el('div', 'mcol')), h = new Array(n).fill(0);
  items.forEach((b, i) => { const m = IMG.works[visible[i].id], k = h.indexOf(Math.min(...h)); cols[k].append(b); h[k] += m ? m.h / m.w : 1.2; });
  galleryCols = n; $('grid').replaceChildren(...cols);
}
function renderGallery() {
  visible = S.works.filter(w => filter === 'all' || w.kind === filter);
  const btn = $('moreWorks'); btn.hidden = visible.length <= PREVIEW; btn.textContent = showAll ? t('showLess') : `${t('showAll')} (${visible.length})`;
  layoutGallery(visible.map((w, i) => {
    // a real link to the work's own page; a plain click opens it in the lightbox instead
    const b = el('a', 'work'); b.href = workUrl(w.id); b.style.animationDelay = Math.min(i, 8) * 45 + 'ms';
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
    b.addEventListener('click', e => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return; e.preventDefault(); openArt(i); });
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
  // Price or status, Sandra's description, and a way to ask about the work
  const price = $('lbPrice'); price.textContent = w.status ? L(w.status) : (w.price || ''); price.classList.toggle('muted', !!w.status);
  // straight to the work's page at the Under 1000 gallery when it is on sale there, otherwise to the contact section
  const ask = $('lbAsk'); ask.hidden = !!w.status || !(w.price || w.buy);
  $('lbPage').href = workUrl(w.id);
  ask.href = w.buy || '#contact'; if (w.buy) { ask.target = '_blank'; ask.rel = 'noopener'; } else { ask.removeAttribute('target'); ask.removeAttribute('rel'); }
  const desc = $('lbDesc'), about = $('lbAbout');
  desc.replaceChildren(...(w.d ? L(w.d) : []).map(x => { const p = el('p'); p.textContent = x; return p; }));
  about.hidden = !w.d; desc.hidden = !w.d || about.getAttribute('aria-expanded') !== 'true'; desc.scrollTop = 0;
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
$('lbAbout').addEventListener('click', () => {
  const open = $('lbAbout').getAttribute('aria-expanded') !== 'true';
  $('lbAbout').setAttribute('aria-expanded', String(open)); $('lbDesc').hidden = !open;
});
$('lbAsk').addEventListener('click', () => { if (!$('lbAsk').target) closeArt(); });
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

/* ---------- exhibition ---------- */
function renderExhibition() {
  $('hallGrid').replaceChildren(...S.exhibition.map((s, i) => {
    const f = el('figure', 'hall' + (i === 0 ? ' wide' : '')), m = IMG.studio[s.id] || {w: 1400, h: 933, c: '#333'}, im = el('img');
    im.src = `${BASE}assets/img/studio/${s.id}.webp`; im.width = m.w; im.height = m.h; im.loading = 'lazy'; im.decoding = 'async'; im.alt = s[lang];
    f.style.background = m.c; f.append(im, el('figcaption', '', s[lang])); return f;
  }));
}

/* ---------- studio reel ---------- */
function renderStudio() {
  $('studioReel').replaceChildren(...S.studio.map(s => {
    const f = el('figure'), m = IMG.studio[s.id] || {w: 1400, h: 933, c: '#333'}, im = el('img');
    im.src = `${BASE}assets/img/studio/${s.id}.webp`; im.width = m.w; im.height = m.h; im.loading = 'lazy'; im.decoding = 'async'; im.alt = s[lang];
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
function frame() { ticking = false; onScrollHeader(); }
window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, {passive: true});
window.addEventListener('resize', () => { requestAnimationFrame(frame); if (columnsFor() !== galleryCols) renderGallery(); });
reduced.addEventListener?.('change', () => frame());

$('year').textContent = new Date().getFullYear();
applyLang();
frame();
window.__site = {get lang() { return lang; }, get visible() { return visible; }, openArt, show};
})();
