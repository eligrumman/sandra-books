'use strict';
/* Neurographics guide: a step-by-step flow with a drawing sheet. Nothing leaves the page. */
(() => {
const S = window.SITE, IMG = window.IMAGES || {works: {}};
const LANGS = ['he', 'ru', 'en'];
const $ = id => document.getElementById(id);
const store = {get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch {} }};
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const h = (tag, props = {}, ...kids) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (k === 'html') e.innerHTML = v;
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat()) if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(c));
  return e;
};

/* ---------- language ---------- */
let lang = (() => {
  const q = new URLSearchParams(location.search).get('lang');
  if (LANGS.includes(q)) return q;
  const s = store.get('sl-lang');
  return LANGS.includes(s) ? s : 'he';
})();
const t = (k, vars) => {
  let s = S.text[lang][k] ?? k;
  if (vars) for (const [a, b] of Object.entries(vars)) s = s.replace('{' + a + '}', b);
  return s;
};
const L = arr => arr[LANGS.indexOf(lang)] ?? arr[0];

/* ---------- constants ---------- */
const PAPER = '#fbf8f1';
const COLORS = ['#1d1b24', '#2459c6', '#d23b3b', '#2f8f5b', '#e8862b', '#7a46c2', '#f2c11b']; // no metallic markers
const WIDTHS = [5, 9, 20]; // logical units on a 1000 x 1000 sheet
const WORDS = /[\p{L}\p{N}][\p{L}\p{N}'’\-־]*/gu;
const TOTAL = 11;
const state = {
  step: 0,
  sheets: {train: newSheet(), main: newSheet()},
  tool: {color: 1, width: 1, mode: 'pen'},
  theme: '',
  words: {text: '', phase: 'idle', end: 0, surprised: new Set(), id: 0},
  check: ['', '', '', ''],
  changed: ''
};
function newSheet() { return {items: [], ver: 0, roundedUpTo: 0, anim: null}; }

/* ---------- geometry: crossings of the strokes and their fillets ---------- */
function segCross(a, b, c, d) {
  const r = [b[0] - a[0], b[1] - a[1]], s = [d[0] - c[0], d[1] - c[1]];
  const den = r[0] * s[1] - r[1] * s[0];
  if (Math.abs(den) < 1e-9) return null;
  const u = ((c[0] - a[0]) * s[1] - (c[1] - a[1]) * s[0]) / den;
  const v = ((c[0] - a[0]) * r[1] - (c[1] - a[1]) * r[0]) / den;
  if (u < 0 || u > 1 || v < 0 || v > 1) return null;
  const lr = Math.hypot(...r), ls = Math.hypot(...s);
  return {p: [a[0] + u * r[0], a[1] + u * r[1]], sin: Math.abs(den) / (lr * ls || 1)};
}
// the point at `dist` along a polyline from P, leaving through segment i in direction sign (+1 forward, -1 back)
function walk(pts, i, P, sign, dist) {
  let cur = P, idx = sign > 0 ? i + 1 : i, left = dist;
  for (;;) {
    if (idx < 0 || idx >= pts.length) return {pt: cur, d: dist - left};
    const q = pts[idx], len = Math.hypot(q[0] - cur[0], q[1] - cur[1]);
    if (len >= left) { const f = left / (len || 1); return {pt: [cur[0] + (q[0] - cur[0]) * f, cur[1] + (q[1] - cur[1]) * f], d: dist}; }
    left -= len; cur = q; idx += sign;
  }
}
function crossings(sheet) {
  if (sheet.cacheVer === sheet.ver) return sheet.cross;
  const strokes = [];
  sheet.items.forEach((it, n) => { if (it.t === 's' && it.pts.length > 2) strokes.push({n, it}); });
  const out = [];
  for (let A = 0; A < strokes.length; A++) for (let B = A; B < strokes.length; B++) {
    const a = strokes[A], b = strokes[B], pa = a.it.pts, pb = b.it.pts;
    for (let i = 0; i < pa.length - 1; i++) {
      for (let j = A === B ? i + 6 : 0; j < pb.length - 1; j++) {
        const x0 = Math.min(pa[i][0], pa[i + 1][0]), x1 = Math.max(pa[i][0], pa[i + 1][0]), y0 = Math.min(pa[i][1], pa[i + 1][1]), y1 = Math.max(pa[i][1], pa[i + 1][1]);
        if (Math.max(pb[j][0], pb[j + 1][0]) < x0 || Math.min(pb[j][0], pb[j + 1][0]) > x1 || Math.max(pb[j][1], pb[j + 1][1]) < y0 || Math.min(pb[j][1], pb[j + 1][1]) > y1) continue;
        const c = segCross(pa[i], pa[i + 1], pb[j], pb[j + 1]);
        if (!c || c.sin < 0.26) continue;
        if (out.some(o => o.a === a.n && o.b === b.n && Math.hypot(o.p[0] - c.p[0], o.p[1] - c.p[1]) < 9)) continue;
        out.push({a: a.n, b: b.n, p: c.p, i, j, order: Math.max(a.n, b.n)});
      }
    }
  }
  for (const c of out) {
    const ia = sheet.items[c.a], ib = sheet.items[c.b], T = Math.min(70, Math.max(34, Math.max(ia.w, ib.w) * 3 + 24)); c.T = T;
    const col = sheet.items[c.order].color, w = Math.max(3, (ia.w + ib.w) / 2 * 0.95);
    const ra = [1, -1].map(s => walk(ia.pts, c.i, c.p, s, T)), rb = [1, -1].map(s => walk(ib.pts, c.j, c.p, s, T));
    c.arcs = [];
    for (const x of ra) for (const y of rb) if (x.d > T * 0.45 && y.d > T * 0.45) c.arcs.push({A: x.pt, B: y.pt, col, w});
  }
  sheet.cross = out; sheet.cacheVer = sheet.ver;
  return out;
}
function arcPath(ctx, arc, P, k) {
  ctx.beginPath(); ctx.moveTo(arc.A[0], arc.A[1]);
  const n = 14;
  for (let s = 1; s <= n; s++) {
    const f = s / n * k, g = 1 - f;
    ctx.lineTo(g * g * arc.A[0] + 2 * g * f * P[0] + f * f * arc.B[0], g * g * arc.A[1] + 2 * g * f * P[1] + f * f * arc.B[1]);
  }
}

/* ---------- painting ---------- */
function strokePath(ctx, pts) {
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  if (pts.length === 2) ctx.lineTo(pts[1][0], pts[1][1]);
  for (let i = 1; i < pts.length - 1; i++) ctx.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2);
  if (pts.length > 2) ctx.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
}
function gapsOf(sheet) { // the stretch of each line inside a rounded corner is replaced by the arcs
  const g = new Map();
  for (const c of crossings(sheet)) if (c.order < sheet.roundedUpTo && c.arcs.length) for (const n of [c.a, c.b]) { if (!g.has(n)) g.set(n, []); g.get(n).push({p: c.p, r: c.T * 0.97}); }
  return g;
}
function drawStroke(ctx, it, extra = 0, gaps = null) {
  ctx.lineWidth = it.w + extra; ctx.strokeStyle = ctx.fillStyle = it.color;
  if (gaps && gaps.length && it.pts.length > 1) {
    let run = [];
    const flush = () => { if (run.length > 1) { strokePath(ctx, run); ctx.stroke(); } run = []; };
    for (const q of it.pts) { if (gaps.some(g => Math.hypot(q[0] - g.p[0], q[1] - g.p[1]) < g.r)) flush(); else run.push(q); }
    flush(); return;
  }
  if (it.pts.length === 1) { ctx.beginPath(); ctx.arc(it.pts[0][0], it.pts[0][1], (it.w + extra) / 2, 0, 7); ctx.fill(); return; }
  strokePath(ctx, it.pts); ctx.stroke();
}
const MASK = 800;
function maskOf(sheet) { // barrier raster of strokes and fillets, for colouring small pieces
  if (sheet.maskVer === sheet.ver && sheet.mask) return sheet.mask;
  const c = document.createElement('canvas'); c.width = c.height = MASK;
  const x = c.getContext('2d', {willReadFrequently: true}); x.setTransform(MASK / 1000, 0, 0, MASK / 1000, 0, 0); x.lineCap = x.lineJoin = 'round';
  const gp = gapsOf(sheet);
  sheet.items.forEach((it, n) => { if (it.t === 's') drawStroke(x, {...it, color: '#000'}, 3, gp.get(n)); });
  for (const c2 of crossings(sheet)) if (c2.order < sheet.roundedUpTo) for (const a of c2.arcs) { x.lineWidth = a.w + 3; x.strokeStyle = '#000'; arcPath(x, a, c2.p, 1); x.stroke(); }
  const d = x.getImageData(0, 0, MASK, MASK).data, m = new Uint8Array(MASK * MASK);
  for (let i = 0; i < m.length; i++) m[i] = d[i * 4 + 3] > 90 ? 1 : 0;
  sheet.mask = m; sheet.maskVer = sheet.ver;
  return m;
}
function flood(m, sx, sy, limit) { // 4-connected region of free pixels; null when it leaks or is too large
  const N = MASK, seen = new Uint8Array(N * N), stack = [sy * N + sx], px = [];
  seen[stack[0]] = 1;
  while (stack.length) {
    const p = stack.pop(); px.push(p);
    if (px.length > limit) return null;
    const x = p % N, y = (p / N) | 0;
    for (const q of [x > 0 ? p - 1 : -1, x < N - 1 ? p + 1 : -1, y > 0 ? p - N : -1, y < N - 1 ? p + N : -1]) {
      if (q < 0 || seen[q] || m[q]) continue;
      seen[q] = 1; stack.push(q);
    }
  }
  return px;
}
function seedFor(m, x, y) {
  const sx = Math.round(x * MASK / 1000), sy = Math.round(y * MASK / 1000);
  for (let r = 0; r <= 4; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    const px = sx + dx, py = sy + dy;
    if (px >= 0 && py >= 0 && px < MASK && py < MASK && !m[py * MASK + px]) return [px, py];
  }
  return null;
}
function fillLayer(sheet) {
  const fills = sheet.items.filter(it => it.t === 'f');
  if (!fills.length) return null;
  if (sheet.fillVer === sheet.ver && sheet.fillCanvas) return sheet.fillCanvas;
  const m = maskOf(sheet), c = document.createElement('canvas'); c.width = c.height = MASK;
  const x = c.getContext('2d'), img = x.createImageData(MASK, MASK);
  for (const f of fills) {
    const s = seedFor(m, f.x, f.y); if (!s) continue;
    const px = flood(m, s[0], s[1], MASK * MASK * 0.12); if (!px) continue;
    const r = parseInt(f.color.slice(1, 3), 16), g = parseInt(f.color.slice(3, 5), 16), b = parseInt(f.color.slice(5, 7), 16);
    for (const p of px) { img.data[p * 4] = r; img.data[p * 4 + 1] = g; img.data[p * 4 + 2] = b; img.data[p * 4 + 3] = 255; }
  }
  x.putImageData(img, 0, 0);
  sheet.fillCanvas = c; sheet.fillVer = sheet.ver;
  return c;
}
// paper, colour, strokes and the fillets that are finished (the animating ones are painted by overlay)
function paintBase(ctx, sheet, W) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, W);
  const fl = fillLayer(sheet); if (fl) { ctx.imageSmoothingEnabled = true; ctx.drawImage(fl, 0, 0, W, W); }
  ctx.setTransform(W / 1000, 0, 0, W / 1000, 0, 0); ctx.lineCap = ctx.lineJoin = 'round';
  const gp = gapsOf(sheet);
  sheet.items.forEach((it, n) => { if (it.t === 's') drawStroke(ctx, it, 0, gp.get(n)); });
  for (const c of crossings(sheet)) if (c.order < sheet.roundedUpTo && !isAnimating(sheet, c)) for (const a of c.arcs) { ctx.lineWidth = a.w; ctx.strokeStyle = a.col; arcPath(ctx, a, c.p, 1); ctx.stroke(); }
}
function isAnimating(sheet, c) { return sheet.anim && c.order >= sheet.anim.from && c.order < sheet.roundedUpTo; }
function animProgress(sheet, c, now) {
  const an = sheet.anim, list = an.list, rank = list.indexOf(c);
  const delay = rank / Math.max(1, list.length) * 500;
  return Math.min(1, Math.max(0, (now - an.t0 - delay) / 480));
}

/* ---------- sample neuro-line and shapes ---------- */
function sampleLine() {
  const ph = [Math.random() * 7, Math.random() * 7, Math.random() * 7];
  let x = 150 + Math.random() * 700, y = 150 + Math.random() * 700, a = Math.random() * 6.28, pts = [[x, y]];
  for (let i = 0; i < 300; i++) {
    const turn = 0.075 * (Math.sin(i * 0.05 + ph[0]) + 1.3 * Math.sin(i * 0.019 + ph[1]) + 0.9 * Math.sin(i * 0.11 + ph[2])) + (Math.random() - 0.5) * 0.12;
    a += turn;
    const m = 90, cx = 500 - x, cy = 500 - y;
    if (x < m || x > 1000 - m || y < m || y > 1000 - m) { let da = Math.atan2(cy, cx) - a; da = Math.atan2(Math.sin(da), Math.cos(da)); a += da * 0.12; }
    x += Math.cos(a) * 5.5; y += Math.sin(a) * 5.5; pts.push([x, y]);
  }
  return pts;
}
function shapePts(kind) {
  const wob = (i, n) => 5 * Math.sin(i / n * 6.28 * 2.3 + 1) + 3 * Math.sin(i / n * 6.28 * 5.1);
  let poly;
  if (kind === 'triangle') poly = [[500, 300], [680, 640], [320, 640]];
  else if (kind === 'square') poly = [[350, 350], [650, 350], [650, 650], [350, 650]];
  else poly = null;
  const out = [];
  if (poly) {
    poly = poly.concat([poly[0]]);
    for (let s = 0; s < poly.length - 1; s++) {
      const [a, b] = [poly[s], poly[s + 1]], n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 5);
      for (let i = 0; i < n; i++) out.push([a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n]);
    }
    out.push(poly[0].slice());
  } else {
    const rx = kind === 'ellipse' ? 230 : 170, ry = kind === 'ellipse' ? 140 : 170, n = 150;
    for (let i = 0; i <= n; i++) { const th = i / n * 6.2832, r = 1 + wob(i, n) / 170; out.push([500 + Math.cos(th) * rx * r, 500 + Math.sin(th) * ry * r]); }
  }
  return out;
}
function neurographFigure(fig, color) { // a free line that runs along the outline and weaves through it
  const pts = fig.pts, n = pts.length;
  let cx = 0, cy = 0; for (const p of pts) { cx += p[0]; cy += p[1]; } cx /= n; cy /= n;
  const ph = [Math.random() * 7, Math.random() * 7], out = [], steps = Math.round(n * 1.04);
  for (let k = 0; k < steps; k++) {
    const p = pts[Math.floor(k * n / steps) % n], dx = p[0] - cx, dy = p[1] - cy, len = Math.hypot(dx, dy) || 1;
    const off = 34 * Math.sin(k * 0.21 + ph[0]) + 22 * Math.sin(k * 0.073 + ph[1]) + 10 * Math.sin(k * 0.47);
    if (k % 2 === 0) out.push([p[0] + dx / len * off, p[1] + dy / len * off]);
  }
  return out;
}

/* ---------- board: a sheet with tools ---------- */
function makeBoard(key, o = {}) {
  const sheet = state.sheets[key], tool = state.tool;
  const wrap = h('div', {class: 'board'});
  const canvas = h('canvas', {class: 'sheet', role: 'img', 'aria-label': t('ngCanvasLabel')});
  const hint = h('div', {class: 'sheet-hint', 'aria-hidden': 'true'}, t('ngDrawHere'));
  const sw = h('div', {class: 'sheet-wrap'}, canvas, hint);
  const status = h('p', {class: 'board-status', role: 'status'});
  const say = (msg, good) => { status.textContent = msg || ''; status.classList.toggle('good', !!good); };
  const swatches = h('div', {class: 'tool-group', role: 'radiogroup', 'aria-label': t('ngColor')}, COLORS.map((c, i) => h('button', {type: 'button', class: 'swatch', role: 'radio', 'aria-checked': String(tool.color === i), 'aria-label': t('ngCol' + i), 'data-c': i,
    onclick: () => { tool.color = i; if (tool.mode === 'fill') tool.mode = 'pen'; sync(); }}, h('i', {style: 'background:' + c}))));
  const widths = h('div', {class: 'tool-group', role: 'radiogroup', 'aria-label': t('ngWidth')}, [['ngThin', 4], ['ngMed', 8], ['ngThick', 14]].map(([k, px], i) => h('button', {type: 'button', class: 'wbtn', role: 'radio', 'aria-checked': String(tool.width === i), 'aria-label': t(k), title: t(k), 'data-w': i,
    onclick: () => { tool.width = i; if (tool.mode === 'fill') tool.mode = 'pen'; sync(); }}, h('i', {style: `height:${px}px`}))));
  const undo = h('button', {type: 'button', class: 'tbtn', onclick: () => { sheet.items.pop(); changed(); }}, t('ngUndo'));
  const clear = h('button', {type: 'button', class: 'tbtn', onclick: () => { sheet.items.length = 0; sheet.roundedUpTo = 0; sheet.anim = null; changed(); }}, t('ngClear'));
  const sample = h('button', {type: 'button', class: 'tbtn', onclick: () => { sheet.items.push({t: 's', pts: sampleLine(), color: COLORS[tool.color], w: WIDTHS[Math.min(tool.width, 1)]}); changed(); }}, t('ngSample'));
  const fillBtn = o.fill ? h('button', {type: 'button', class: 'tbtn', 'aria-pressed': 'false', onclick: () => { tool.mode = tool.mode === 'fill' ? 'pen' : 'fill'; say(tool.mode === 'fill' ? t('ngFillOn') : ''); sync(); }}, t('ngFill')) : null;
  const roundBtn = o.round ? h('button', {type: 'button', class: 'tbtn round', onclick: doRound}, t('ngRoundBtn')) : null;
  const tools = h('div', {class: 'tools', role: 'group', 'aria-label': t('ngTools')}, swatches, widths, h('div', {class: 'tool-group'}, undo, clear, sample, fillBtn, roundBtn));
  wrap.append(sw, tools, status);

  const ctx = canvas.getContext('2d');
  let W = 0, base = null, baseKey = '', raf = 0, live = null;
  function sync() {
    swatches.querySelectorAll('.swatch').forEach(b => b.setAttribute('aria-checked', String(+b.dataset.c === tool.color && tool.mode !== 'fill')));
    widths.querySelectorAll('.wbtn').forEach(b => b.setAttribute('aria-checked', String(+b.dataset.w === tool.width && tool.mode !== 'fill')));
    if (fillBtn) fillBtn.setAttribute('aria-pressed', String(tool.mode === 'fill'));
    canvas.style.cursor = tool.mode === 'fill' ? 'cell' : 'crosshair';
    undo.disabled = clear.disabled = !sheet.items.length;
    hint.hidden = !!sheet.items.length;
    if (roundBtn) { const cs = crossings(sheet), sharp = cs.filter(c => c.order >= sheet.roundedUpTo && c.arcs.length).length; roundBtn.disabled = !sharp; }
    if (o.onChange) o.onChange(sheet);
  }
  function changed() {
    if (sheet.roundedUpTo > sheet.items.length) sheet.roundedUpTo = sheet.items.length;
    sheet.ver++; sheet.anim = null; paint(); sync();
  }
  function doRound() {
    const list = crossings(sheet).filter(c => c.order >= sheet.roundedUpTo && c.arcs.length);
    if (!list.length) return;
    const from = sheet.roundedUpTo;
    sheet.roundedUpTo = sheet.items.length;
    if (reduced()) { sheet.ver++; paint(); sync(); say(t('ngAllRound'), true); return; }
    sheet.anim = {from, t0: performance.now(), list: list.slice().sort((a, b) => a.p[0] - b.p[0])};
    sheet.ver++; sync(); loop();
  }
  function size() {
    const r = canvas.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(200, Math.round(r.width * dpr));
    if (w !== W) { W = w; canvas.width = canvas.height = W; baseKey = ''; }
  }
  function paint(now = performance.now()) {
    if (!canvas.isConnected) return;
    size();
    const key = [sheet.ver, sheet.roundedUpTo, !!sheet.anim, W].join('|');
    if (key !== baseKey) { base = base || document.createElement('canvas'); base.width = base.height = W; paintBase(base.getContext('2d'), sheet, W); baseKey = key; }
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(base, 0, 0);
    ctx.setTransform(W / 1000, 0, 0, W / 1000, 0, 0); ctx.lineCap = ctx.lineJoin = 'round';
    if (sheet.anim) {
      let done = true;
      for (const c of sheet.anim.list) {
        const p = animProgress(sheet, c, now); if (p < 1) done = false;
        if (p > 0) for (const a of c.arcs) { ctx.lineWidth = a.w * (1 + 0.5 * Math.sin(p * 3.14)); ctx.strokeStyle = a.col; arcPath(ctx, a, c.p, p); ctx.stroke(); }
      }
      if (done) { sheet.anim = null; sheet.ver++; setTimeout(() => { paint(); say(t('ngAllRound'), true); }, 0); }
    }
    if (o.sharp) for (const c of crossings(sheet)) if (c.order >= sheet.roundedUpTo && c.arcs.length) {
      const pulse = reduced() ? 0 : Math.sin(now / 260) * 3;
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(224,69,90,.85)'; ctx.beginPath(); ctx.arc(c.p[0], c.p[1], 17 + pulse, 0, 7); ctx.stroke();
    }
    if (live) { ctx.lineWidth = live.w; ctx.strokeStyle = live.color; ctx.beginPath(); live.pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); if (live.pts.length === 1) ctx.lineTo(live.pts[0][0] + .01, live.pts[0][1]); ctx.stroke(); }
  }
  function loop() {
    cancelAnimationFrame(raf);
    const tick = now => {
      if (!canvas.isConnected) return;
      paint(now);
      if (sheet.anim || (o.sharp && !reduced() && crossings(sheet).some(c => c.order >= sheet.roundedUpTo && c.arcs.length))) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }
  const pos = e => { const r = canvas.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * 1000, (e.clientY - r.top) / r.height * 1000]; };
  let pid = null;
  canvas.addEventListener('pointerdown', e => {
    if (pid !== null || (e.pointerType === 'mouse' && e.button !== 0)) return;
    e.preventDefault(); pid = e.pointerId; canvas.setPointerCapture(pid);
    if (sheet.anim) { sheet.anim = null; sheet.ver++; }
    const p = pos(e);
    if (tool.mode === 'fill') { fillAt(p); pid = null; return; }
    live = {pts: [p], color: COLORS[tool.color], w: WIDTHS[tool.width]}; paint();
  });
  canvas.addEventListener('pointermove', e => {
    if (e.pointerId !== pid || !live) return;
    for (const ev of (e.getCoalescedEvents ? e.getCoalescedEvents() : [e])) {
      const p = pos(ev), q = live.pts[live.pts.length - 1];
      if (Math.hypot(p[0] - q[0], p[1] - q[1]) >= 3.5) live.pts.push([Math.max(0, Math.min(1000, p[0])), Math.max(0, Math.min(1000, p[1]))]);
    }
    paint();
  });
  const end = e => {
    if (e.pointerId !== pid) return; pid = null;
    if (live) { const s = live; live = null; sheet.items.push({t: 's', pts: s.pts, color: s.color, w: s.w}); changed(); if (o.onStroke) o.onStroke(sheet); }
  };
  canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('contextmenu', e => e.preventDefault());
  function fillAt(p) {
    const m = maskOf(sheet), s = seedFor(m, p[0], p[1]);
    if (!s) return say(t('ngFillOpen'));
    const px = flood(m, s[0], s[1], MASK * MASK * 0.12);
    if (!px) return say(t('ngFillBig'));
    sheet.items.push({t: 'f', x: p[0], y: p[1], color: COLORS[tool.color]}); say(''); changed();
  }
  new ResizeObserver(() => { baseKey = ''; paint(); }).observe(canvas);
  const api = {el: wrap, paint, sync, say, changed, sheet, color: () => COLORS[tool.color], addItem: it => { sheet.items.push(it); changed(); }, loop};
  requestAnimationFrame(() => { paint(); sync(); loop(); });
  return api;
}

/* ---------- steps ---------- */
let breathTimer = 0, timerId = 0;
const clearTimers = () => { clearInterval(breathTimer); clearInterval(timerId); breathTimer = timerId = 0; };

function title(key) { return h('h2', {tabindex: '-1', id: 'stepTitle'}, t(key)); }
function breathing() {
  const word = h('span', {class: 'breath-word', 'aria-hidden': 'true'}, t('ngBreatheIn'));
  const box = h('div', {class: 'breath', 'aria-hidden': 'true'}, h('span', {class: 'breath-dot'}), word);
  let inhale = false;
  const flip = () => { inhale = !inhale; box.classList.toggle('in', inhale); word.textContent = t(inhale ? 'ngBreatheIn' : 'ngBreatheOut'); };
  setTimeout(flip, 60); breathTimer = setInterval(flip, 4500);
  return h('div', {}, box, h('p', {class: 'ng-muted'}, t('ngBreatheNote')));
}

const STEPS = [
  // 1. intro and materials
  () => {
    const w = S.works.find(x => x.id === 'spiral'), m = IMG.works.spiral, title2 = L(w.t);
    const sizes = m.s.filter(s => s <= 1600);
    return h('div', {class: 'ng-hero'},
      h('div', {}, h('p', {class: 'ng-by'}, t('ngBy')), h('h1', {tabindex: '-1', id: 'stepTitle'}, t('ngS1Title')), h('p', {class: 'ng-lead'}, t('ngS1Lead')),
        h('div', {class: 'ng-card'}, h('span', {class: 'ng-label'}, t('ngMatTitle')),
          h('ul', {class: 'ng-list'}, [1, 2, 3, 4, 5].map(i => h('li', {}, t('ngMat' + i)))), h('p', {class: 'ng-muted'}, t('ngMatNote')))),
      h('figure', {}, h('img', {src: `../assets/img/works/spiral-${sizes[0]}.webp`, srcset: sizes.map(s => `../assets/img/works/spiral-${s}.webp ${s}w`).join(', '), sizes: '(max-width:900px) 100vw, 45vw', width: m.w, height: m.h, alt: `${title2}, ${L(['סנדרה לייפר', 'Сандра Лейфер', 'Sandra Leifer'])}`, style: `background:${m.c}`}),
        h('figcaption', {}, t('ngWorkCap', {title: title2}))));
  },
  // 2. what is a neuro-line
  () => {
    const hab = []; for (let i = 0; i <= 40; i++) hab.push([10 + i * 9.75, 80 + Math.sin(i * 0.9) * 38 * (i % 2 ? 1 : 1)]);
    const hp = hab.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const np = []; let a = 0, x = 12, y = 80;
    for (let i = 0; i < 70; i++) { a += (rnd() - 0.5) * 1.6 + 0.25 * Math.sin(i * 0.37); a = Math.max(-1.3, Math.min(1.3, a)); x += 5.4 + rnd() * 2.2; y += Math.sin(a) * 9 + (80 - y) * 0.06; np.push([x, Math.max(14, Math.min(146, y))]); }
    const npath = np.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    const svg = (cls, d, label, delay) => h('figure', {}, h('svg', {viewBox: '0 0 400 160', role: 'img', 'aria-label': label, html: `<path class="${cls} run ${delay}" pathLength="1" d="${d}"/>`}), h('figcaption', {}, label));
    return h('div', {class: 'ng-single'}, title('ngS2Title'), h('p', {class: 'ng-lead'}, t('ngS2Text')),
      h('div', {class: 'ng-anim', role: 'img', 'aria-label': t('ngLineAlt')}, svg('habit', hp, t('ngLineHabit'), 'a'), svg('neuro', npath, t('ngLineNeuro'), 'b')),
      h('p', {class: 'ng-muted'}, t('ngS2Nature')));
  },
  // 3. training
  () => {
    const prompt = h('p', {class: 'prompt', 'aria-live': 'polite'}, t('ngP1'));
    const board = makeBoard('train', {onStroke: sh => { prompt.textContent = t('ngP' + (2 + ((sh.items.length - 1) % 4))); }});
    return h('div', {class: 'ng-cols'}, h('div', {}, title('ngS3Title'), h('p', {class: 'ng-lead'}, t('ngS3Text')), prompt, breathing()), board.el);
  },
  // 4. rounding the corners
  () => {
    const info = h('p', {class: 'ng-info', role: 'status'});
    const board = makeBoard('train', {round: true, sharp: true, onChange: sh => {
      const cs = crossings(sh).filter(c => c.arcs.length), sharp = cs.filter(c => c.order >= sh.roundedUpTo).length;
      info.textContent = !cs.length ? t('ngCrossNone') : sharp ? t('ngCrossInfo', {n: cs.length, c: sharp * 0 + cs.filter(c => c.order >= sh.roundedUpTo).reduce((s, c) => s + c.arcs.length, 0)}) : t('ngAllRound');
      info.classList.toggle('good', cs.length > 0 && !sharp);
    }});
    return h('div', {class: 'ng-cols'}, h('div', {}, title('ngS4Title'), h('p', {class: 'ng-lead'}, t('ngS4Text')), h('p', {class: 'ng-muted'}, t('ngS4Text2')), info), board.el);
  },
  // 5. request / theme
  () => h('div', {class: 'ng-single'}, title('ngS5Title'), h('p', {class: 'ng-lead'}, t('ngS5Text')),
    h('div', {class: 'ng-field'}, h('label', {class: 'ng-label', for: 'theme'}, t('ngThemeLabel')),
      h('input', {class: 'ng-input', id: 'theme', type: 'text', maxlength: '60', autocomplete: 'off', placeholder: t('ngThemePh'), value: state.theme, oninput: e => { state.theme = e.target.value; }})),
    h('p', {class: 'ng-muted'}, t('ngPrivate'))),
  // 6. 20 words in 2 minutes
  () => wordsStep(),
  // 7. check-in
  () => h('div', {class: 'ng-single'}, title('ngS7Title'), h('p', {class: 'ng-lead'}, t('ngS7Text')),
    [1, 2, 3, 4].map(i => h('div', {class: 'ng-field'}, h('label', {class: 'ng-label', for: 'f' + i}, t('ngF' + i)),
      h('textarea', {class: 'ng-text', id: 'f' + i, rows: '2', placeholder: t('ngFieldPh'), oninput: e => { state.check[i - 1] = e.target.value; }}, state.check[i - 1]))),
    h('p', {class: 'ng-muted'}, t('ngPrivate'))),
  // 8. neuro-lines over the sheet
  () => {
    const board = makeBoard('main', {fill: false});
    return h('div', {class: 'ng-cols'}, h('div', {}, title('ngS8Title'), h('p', {class: 'ng-lead'}, t('ngS8Text')), breathing(), changedField()), board.el);
  },
  // 9. rules
  () => {
    const info = h('p', {class: 'ng-info', role: 'status'});
    const board = makeBoard('main', {fill: true, round: true, sharp: true, onChange: sh => {
      const cs = crossings(sh).filter(c => c.arcs.length), sharp = cs.filter(c => c.order >= sh.roundedUpTo).reduce((s, c) => s + c.arcs.length, 0);
      info.textContent = !cs.length ? t('ngCrossNone') : sharp ? t('ngCrossInfo', {n: cs.length, c: sharp}) : t('ngAllRound');
      info.classList.toggle('good', cs.length > 0 && !sharp);
    }});
    return h('div', {class: 'ng-cols'}, h('div', {}, title('ngS9Title'), h('p', {class: 'ng-lead'}, t('ngS9Text')), h('ul', {class: 'ng-list rules'}, [1, 2, 3, 4, 5, 6].map(i => h('li', {}, t('ngRule' + i)))), info), board.el);
  },
  // 10. figure of choice
  () => {
    const msg = {el: null};
    const info = h('p', {class: 'ng-info', role: 'status'});
    const board = makeBoard('main', {fill: true, round: true, sharp: true, onChange: sh => {
      const cs = crossings(sh).filter(c => c.arcs.length), sharp = cs.filter(c => c.order >= sh.roundedUpTo).reduce((s, c) => s + c.arcs.length, 0);
      info.textContent = !cs.length ? '' : sharp ? t('ngCrossInfo', {n: cs.length, c: sharp}) : t('ngAllRound');
      info.classList.toggle('good', cs.length > 0 && !sharp);
    }});
    const sheet = state.sheets.main;
    const add = kind => board.addItem({t: 's', pts: shapePts(kind), color: COLORS[state.tool.color === 0 ? 0 : state.tool.color], w: WIDTHS[2], fig: true});
    const shapes = ['Circle', 'Triangle', 'Square', 'Ellipse'].map(k => h('button', {type: 'button', class: 'tbtn', onclick: () => add(k.toLowerCase())}, t('ngShape' + k)));
    const own = h('button', {type: 'button', class: 'tbtn', onclick: () => { state.tool.width = 2; state.tool.mode = 'pen'; board.sync(); board.el.querySelector('.swatch').focus(); }}, t('ngShapeOwn'));
    const auto = h('button', {type: 'button', class: 'tbtn', onclick: () => {
      const fig = [...sheet.items].reverse().find(it => it.t === 's' && it.fig);
      if (!fig) return board.say(t('ngNeedFigure'));
      const col = COLORS[state.tool.color] === fig.color ? COLORS[(state.tool.color + 1) % COLORS.length] : COLORS[state.tool.color];
      board.addItem({t: 's', pts: neurographFigure(fig, col), color: col, w: WIDTHS[1]}); board.say('');
    }}, t('ngAutoNeuro'));
    return h('div', {class: 'ng-cols'}, h('div', {}, title('ngS10Title'), h('p', {class: 'ng-lead'}, t('ngS10Text')),
      h('span', {class: 'ng-label'}, t('ngShapes')), h('div', {class: 'shape-row'}, shapes, own),
      h('p', {class: 'ng-lead'}, t('ngS10Text2')), h('div', {class: 'shape-row'}, auto), info, changedField()), board.el);
  },
  // 11. final
  () => {
    const sheet = state.sheets.main, cv = h('canvas', {class: 'final-sheet', role: 'img', 'aria-label': t('ngFinalAlt')});
    cv.width = cv.height = 1000; paintFull(cv.getContext('2d'), sheet, 1000);
    const dl = h('button', {type: 'button', class: 'btn btn-solid', onclick: download}, t('ngDownload'));
    const keep = h('button', {type: 'button', class: 'btn btn-ghost', onclick: () => go(9)}, t('ngKeepDrawing'));
    const again = h('button', {type: 'button', class: 'btn btn-ghost', onclick: restart}, t('ngRestart'));
    const cta = h('div', {class: 'cta'}, h('h3', {}, t('ngCtaTitle')), h('p', {class: 'ng-lead'}, t('ngCtaText')),
      h('a', {class: 'btn btn-solid gold', id: 'ctaBtn', href: S.waNeuro(lang), target: '_blank', rel: 'noopener', onclick: () => document.dispatchEvent(new CustomEvent('sl:wa', {detail: {type: 'book', slug: 'neurographics'}}))}, t('ngCtaBtn')), h('p', {class: 'ng-muted'}, t('ngCtaNote')));
    return h('div', {class: 'ng-cols'}, cv, h('div', {}, title('ngS11Title'), h('p', {class: 'ng-lead'}, t('ngS11Text')), h('div', {class: 'final-actions'}, dl, keep, again), cta));
  }
];

function changedField() {
  return h('div', {class: 'ng-field'}, h('label', {class: 'ng-label', for: 'changed'}, t('ngChanged')),
    h('textarea', {class: 'ng-text', id: 'changed', rows: '2', placeholder: t('ngFieldPh'), oninput: e => { state.changed = e.target.value; }}, state.changed));
}

/* ---------- 20 words in 2 minutes ---------- */
const wordList = text => text.match(WORDS) || [];
function wordsStep() {
  const W = state.words, root = h('div', {class: 'ng-cols narrow ng-single'});
  const head = [title('ngS6Title'), h('p', {class: 'ng-lead'}, t('ngS6Text'))];
  if (state.theme.trim()) head.push(h('p', {class: 'ng-by'}, `${t('ngThemeLabel')}: ${state.theme.trim()}`));
  const area = h('textarea', {class: 'ng-text', id: 'words', rows: '6', placeholder: t('ngWordsPh'), 'aria-label': t('ngWordsLabel'), disabled: W.phase !== 'run', readonly: W.phase === 'done', style: 'min-height:150px'}, W.text);
  const count = h('p', {class: 'words-count', 'aria-live': 'off'}, t('ngWordCount', {n: wordList(W.text).length}));
  const timer = h('div', {class: 'timer', role: 'timer', 'aria-label': t('ngTimeLeft')}, fmt(Math.max(0, W.phase === 'run' ? W.end - Date.now() : W.phase === 'done' ? 0 : 120000)));
  const bar = h('div', {class: 't-bar', 'aria-hidden': 'true'}, h('i'));
  const body = h('div');
  const upd = () => { count.textContent = t('ngWordCount', {n: wordList(area.value).length}); };
  area.addEventListener('input', () => { W.text = area.value; upd(); });
  const finish = () => {
    clearInterval(timerId); timerId = 0; W.phase = 'done'; W.text = area.value; render();
    $('announce').textContent = t('ngTimeUp');
  };
  const start = () => {
    W.phase = 'run'; W.end = Date.now() + 120000; render();
    document.getElementById('words').focus();
    clearInterval(timerId);
    timerId = setInterval(() => {
      const left = W.end - Date.now(), tm = document.querySelector('.timer'), bi = document.querySelector('.t-bar i');
      if (!tm) return clearInterval(timerId);
      tm.textContent = fmt(Math.max(0, left)); if (bi) bi.style.transform = `scaleX(${Math.max(0, left) / 120000})`;
      if (left <= 0) finish();
    }, 200);
  };
  function render() { // re-render the step in place (keeps state)
    renderStep(false);
    if (W.phase === 'run') document.getElementById('words').focus();
  }
  const parts = [];
  if (W.phase === 'idle') {
    parts.push(h('p', {class: 'ng-muted'}, t('ngTimerNote')), h('button', {type: 'button', class: 'btn btn-solid', onclick: start}, t('ngStartTimer')), timer, bar, h('label', {class: 'ng-label', for: 'words'}, t('ngWordsLabel')), area, count);
  } else if (W.phase === 'run') {
    parts.push(timer, bar, h('label', {class: 'ng-label', for: 'words'}, t('ngWordsLabel')), area, count, h('button', {type: 'button', class: 'btn btn-ghost', onclick: finish}, t('ngFinishNow')));
  } else {
    const words = wordList(W.text), n = words.length;
    parts.push(h('p', {class: 'words-count'}, t('ngWordCount', {n})), h('p', {class: 'words-msg'}, n > 20 ? t('ngFlow') : t('ngFewer')),
      h('p', {class: 'ng-label'}, t('ngSurprise')),
      h('div', {class: 'chips', role: 'group', 'aria-label': t('ngSurprise')}, words.map((w, i) => h('button', {type: 'button', class: 'chip', 'aria-pressed': String(W.surprised.has(i)), onclick: e => {
        if (W.surprised.has(i)) W.surprised.delete(i); else W.surprised.add(i); e.currentTarget.setAttribute('aria-pressed', String(W.surprised.has(i)));
      }}, w))),
      h('button', {type: 'button', class: 'btn btn-ghost', onclick: () => { W.phase = 'idle'; W.text = ''; W.surprised = new Set(); renderStep(false); }}, t('ngTryAgain')));
    area.hidden = true;
  }
  root.append(...head, ...parts);
  if (W.phase === 'run') { const bi = bar.querySelector('i'); bi.style.transform = `scaleX(${Math.max(0, W.end - Date.now()) / 120000})`; }
  return root;
}
const fmt = ms => { const s = Math.ceil(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

/* ---------- export ---------- */
function paintFull(ctx, sheet, W) {
  paintBase(ctx, sheet, W);
}
function download() {
  const c = document.createElement('canvas'); c.width = c.height = 1600;
  const sheet = state.sheets.main; if (sheet.anim) { sheet.anim = null; }
  paintFull(c.getContext('2d'), sheet, 1600);
  c.toBlob(b => {
    if (!b) return;
    const url = URL.createObjectURL(b), a = h('a', {href: url, download: 'neurographic-drawing.png'});
    document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000);
  }, 'image/png');
}

/* ---------- flow ---------- */
function stopWordsIfRunning() {
  if (timerId) { clearInterval(timerId); timerId = 0; }
  if (state.words.phase === 'run') { state.words.text = (document.getElementById('words') || {value: state.words.text}).value; state.words.phase = 'done'; }
}
function renderStep(focus = true) {
  clearTimers();
  const stage = $('stage'), n = state.step;
  stage.replaceChildren(STEPS[n]());
  if (n === 5 && state.words.phase === 'run') { /* returning to a running timer is not possible: it was closed */ }
  $('stepOf').textContent = t('ngStepOf', {n: n + 1, m: TOTAL});
  const bar = $('bar'); bar.setAttribute('aria-valuenow', n + 1); bar.setAttribute('aria-valuemax', TOTAL); bar.setAttribute('aria-valuetext', t('ngStepOf', {n: n + 1, m: TOTAL})); bar.setAttribute('aria-label', t('ngSteps'));
  $('barFill').style.width = ((n + 1) / TOTAL * 100) + '%';
  $('dots').replaceChildren(...Array.from({length: TOTAL}, (_, i) => h('li', {class: i < n ? 'done' : i === n ? 'now' : ''})));
  $('backBtn').hidden = n === 0; $('backTxt').textContent = t('ngBack');
  $('nextBtn').hidden = n === TOTAL - 1; $('nextTxt').textContent = n === 0 ? t('ngStart') : t('ngNext');
  if (focus) { const ti = document.getElementById('stepTitle'); if (ti) ti.focus({preventScroll: true}); window.scrollTo({top: 0, behavior: reduced() ? 'auto' : 'smooth'}); }
}
function go(n) { stopWordsIfRunning(); state.step = Math.max(0, Math.min(TOTAL - 1, n)); renderStep(); }
function restart() { stopWordsIfRunning(); state.sheets = {train: newSheet(), main: newSheet()}; state.theme = ''; state.words = {text: '', phase: 'idle', end: 0, surprised: new Set()}; state.check = ['', '', '', '']; state.changed = ''; go(0); }

/* ---------- language ---------- */
function applyLang() {
  const root = document.documentElement;
  root.lang = lang; root.dir = lang === 'he' ? 'rtl' : 'ltr';
  document.title = t('ngPageTitle');
  document.querySelectorAll('[data-t]').forEach(e => { e.textContent = t(e.dataset.t); });
  document.querySelectorAll('[data-lang-link]').forEach(a => { if (a.dataset.langLink === lang) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  const base = lang === 'he' ? '../' : '../' + lang + '/';
  $('homeLink').href = base; $('siteLink').href = base;
  document.querySelectorAll('[data-bio-link]').forEach(a => { a.href = base + 'about/'; });
  document.querySelector('footer span').textContent = `© ${new Date().getFullYear()} Sandra Leifer`;
  store.set('sl-lang', lang);
}
document.querySelectorAll('[data-lang-link]').forEach(a => a.addEventListener('click', e => {
  e.preventDefault();
  const next = a.dataset.langLink; if (next === lang) return;
  const val = document.getElementById('words'); if (val && state.words.phase === 'run') state.words.text = val.value;
  lang = next; history.replaceState(null, '', '?lang=' + lang); applyLang(); renderStep(false);
}));
$('backBtn').addEventListener('click', () => go(state.step - 1));
$('nextBtn').addEventListener('click', () => go(state.step + 1));
applyLang(); renderStep(false);
window.__ng = {state, go, get lang() { return lang; }};
})();
