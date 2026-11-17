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
const PAPER = '#f4ead6'; // the cream of the sheet: canvas, unfilled spaces and the saved PNG (same as --paper-sheet in style.css)
const COLORS = ['#1d1b24', '#2459c6', '#d23b3b', '#2f8f5b', '#e8862b', '#7a46c2', '#f2c11b']; // no metallic markers
const PAINT = COLORS.concat(['#ef8fb1', '#7cc4ee', '#a5d77a', '#b8a1e8', '#a19fa8']); // colouring: the same markers and a few lighter ones, still no metallic
const WIDTHS = [5, 9, 20]; // logical units on a 1000 x 1000 sheet
const WORDS = /[\p{L}\p{N}][\p{L}\p{N}'’\-־]*/gu;
const TOTAL = 13;
const WORDS_STEP = 3;
const LINES_MIN = 8; // the line-drawing step encourages at least this many lines (a hint, never a block)
// a tap rounds every sharp corner within this many CSS px (a finger needs room: at least ~28 px)
const TAP_TOUCH_PX = 32, TAP_MOUSE_PX = 20;
// a press that moves less than this is a tap, not a line
const SLOP_TOUCH_PX = 12, SLOP_MOUSE_PX = 6;
const COARSE = window.matchMedia('(pointer: coarse)').matches; // a phone or a tablet: the screen choice says "phone"
const state = {
  step: 0,
  mode: null, // 'paper': guidance for paper and markers, no drawing sheet; 'phone': the drawing simulator
  figDone: false, // phone mode, step 9: the hand-drawn figure is finished
  sheets: {main: newSheet()},
  tool: {color: 1, width: 1, mode: 'pen', paint: 8},
  theme: '',
  words: {text: '', phase: 'idle', end: 0, surprised: new Set(), id: 0},
  check: ['', '', '', ''],
  check2: ['', '', '', ''],
  changed: ''
};
function newSheet() { return {items: [], ver: 0, anim: null}; }
const paper = () => state.mode === 'paper';

/* ---------- this visit's work survives re-renders, steps, language switches and a reload of the tab ---------- */
const SKEY = 'ng-session-v1';
const sess = {
  get() { try { return JSON.parse(sessionStorage.getItem(SKEY) || 'null'); } catch { return null; } },
  set(v) { try { sessionStorage.setItem(SKEY, JSON.stringify(v)); } catch {} },
  clear() { try { sessionStorage.removeItem(SKEY); } catch {} }
};
const PLAIN = ['t', 'pts', 'color', 'w', 'fig', 'id', 'keys', 'x', 'y'];
const plainItem = it => { const o = {}; for (const k of PLAIN) if (it[k] !== undefined) o[k] = it[k]; if (it.was) o.was = it.was.map(([i, f]) => [i, plainItem(f)]); return o; };
function liveWords() { // the words box on screen is the truth while the timer runs
  const el = document.getElementById('words');
  if (el && state.words.phase === 'run') state.words.text = el.value;
}
let saveT = 0;
function save(now) {
  clearTimeout(saveT);
  const run = () => {
    liveWords();
    const W = state.words;
    sess.set({v: 1, step: state.step, mode: state.mode, figDone: state.figDone, theme: state.theme, changed: state.changed, check: state.check, check2: state.check2,
      words: {text: W.text, phase: W.phase, end: W.end, surprised: [...W.surprised]}, items: state.sheets.main.items.map(plainItem)});
  };
  if (now) run(); else saveT = setTimeout(run, 250);
}
function restore() {
  const d = sess.get();
  if (!d || d.v !== 1) return;
  const str = (v, def = '') => typeof v === 'string' ? v : def, arr4 = a => [0, 1, 2, 3].map(i => str(a && a[i]));
  state.step = Number.isInteger(d.step) ? Math.max(0, Math.min(TOTAL - 1, d.step)) : 0;
  state.mode = d.mode === 'paper' || d.mode === 'phone' ? d.mode : null;
  state.figDone = !!d.figDone; state.theme = str(d.theme); state.changed = str(d.changed);
  state.check = arr4(d.check); state.check2 = arr4(d.check2);
  const w = d.words || {};
  let phase = ['idle', 'run', 'done'].includes(w.phase) ? w.phase : 'idle';
  if (phase === 'run' && !(w.end > Date.now())) phase = 'done';
  state.words = {text: str(w.text), phase, end: +w.end || 0, surprised: new Set(Array.isArray(w.surprised) ? w.surprised : []), id: 0};
  if (Array.isArray(d.items)) {
    state.sheets.main.items = d.items.filter(it => it && (it.t === 's' ? Array.isArray(it.pts) && it.pts.length : it.t === 'r' ? Array.isArray(it.keys) : it.t === 'f'));
    for (const it of state.sheets.main.items) uid = Math.max(uid, it.id || 0);
  }
}

/* ---------- geometry: junctions of the strokes and their rounded corners ----------
   As on paper: the lines stay whole, and each sharp wedge between two neighbouring lines
   at a junction is filled with solid ink up to a curve tangent to both line edges. */
let uid = 0;
const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
const unit = v => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; };
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const DEG = Math.PI / 180;
function segCross(a, b, c, d) {
  const r = [b[0] - a[0], b[1] - a[1]], s = [d[0] - c[0], d[1] - c[1]];
  const den = r[0] * s[1] - r[1] * s[0];
  if (Math.abs(den) < 1e-9) return null;
  const u = ((c[0] - a[0]) * s[1] - (c[1] - a[1]) * s[0]) / den;
  const v = ((c[0] - a[0]) * r[1] - (c[1] - a[1]) * r[0]) / den;
  if (u < 0 || u > 1 || v < 0 || v > 1) return null;
  const lr = Math.hypot(...r), ls = Math.hypot(...s);
  return {p: [a[0] + u * r[0], a[1] + u * r[1]], u, v, sin: Math.abs(den) / (lr * ls || 1)};
}
function flatten(pts) { // the stroke exactly as painted (quadratic curves through the midpoints), as a dense polyline
  if (pts.length < 3) return pts.map(q => q.slice());
  const out = [pts[0].slice()];
  let from = pts[0];
  for (let i = 1; i < pts.length - 1; i++) {
    const c = pts[i], to = [(pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2];
    const n = clamp(Math.ceil((Math.hypot(c[0] - from[0], c[1] - from[1]) + Math.hypot(to[0] - c[0], to[1] - c[1])) / 4), 1, 64);
    for (let k = 1; k <= n; k++) { const f = k / n, g = 1 - f; out.push([g * g * from[0] + 2 * g * f * c[0] + f * f * to[0], g * g * from[1] + 2 * g * f * c[1] + f * f * to[1]]); }
    from = to;
  }
  out.push(pts[pts.length - 1].slice());
  return out;
}
function prep(it) { // geometry of a stroke, cached on it (strokes never change)
  if (it.cum) return it;
  const p = it.geo = flatten(it.pts), cum = [0];
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (let k = 0; k < p.length; k++) {
    if (k) cum.push(cum[k - 1] + Math.hypot(p[k][0] - p[k - 1][0], p[k][1] - p[k - 1][1]));
    x0 = Math.min(x0, p[k][0]); y0 = Math.min(y0, p[k][1]); x1 = Math.max(x1, p[k][0]); y1 = Math.max(y1, p[k][1]);
  }
  it.cum = cum; it.len = cum[cum.length - 1]; it.box = [x0, y0, x1, y1];
  return it;
}
function atLen(it, L) { // the point at arc length L along a stroke
  const p = it.geo, c = it.cum; L = clamp(L, 0, it.len);
  let lo = 0, hi = c.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (c[m] <= L) lo = m; else hi = m; }
  const f = (L - c[lo]) / ((c[hi] - c[lo]) || 1);
  return [p[lo][0] + (p[hi][0] - p[lo][0]) * f, p[lo][1] + (p[hi][1] - p[lo][1]) * f];
}
function closestOn(it, q) { // closest point of a stroke to q: {d, p, L}
  const p = it.geo; let best = {d: 1e9};
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[i], b = p[i + 1], ab = [b[0] - a[0], b[1] - a[1]], l2 = dot(ab, ab) || 1;
    const f = clamp(((q[0] - a[0]) * ab[0] + (q[1] - a[1]) * ab[1]) / l2, 0, 1), c = [a[0] + ab[0] * f, a[1] + ab[1] * f];
    const d = Math.hypot(q[0] - c[0], q[1] - c[1]);
    if (d < best.d) best = {d, p: c, L: it.cum[i] + f * Math.sqrt(l2), i};
  }
  return best;
}
// events where two strokes meet: crossings and T-junctions (a line that ends on another)
function events(sheet) {
  const S = [];
  sheet.items.forEach((it, n) => { if (it.t === 's' && it.pts.length >= 2) { prep(it); S.push(n); } });
  const out = [], I = sheet.items;
  const near = (a, b, A, B) => { const pa = A.box, pb = B.box, m = 40; return !(pa[2] + m < pb[0] || pb[2] + m < pa[0] || pa[3] + m < pb[1] || pb[3] + m < pa[1]); };
  // segment pairs found through a grid of 24-unit cells, so the work grows with the crossings, not with all pairs
  const segs = [], grid = new Map(), G = 24, seen = new Set();
  for (const n of S) { const g = I[n].geo; for (let i = 0; i < g.length - 1; i++) segs.push([n, i]); }
  segs.forEach(([n, i], k) => {
    const g = I[n].geo, x0 = Math.floor(Math.min(g[i][0], g[i + 1][0]) / G), x1 = Math.floor(Math.max(g[i][0], g[i + 1][0]) / G), y0 = Math.floor(Math.min(g[i][1], g[i + 1][1]) / G), y1 = Math.floor(Math.max(g[i][1], g[i + 1][1]) / G);
    for (let gx = x0; gx <= x1; gx++) for (let gy = y0; gy <= y1; gy++) { const c = gx * 4096 + gy; if (!grid.has(c)) grid.set(c, []); grid.get(c).push(k); }
  });
  for (const cell of grid.values()) for (let u = 0; u < cell.length; u++) for (let v = u + 1; v < cell.length; v++) {
    let [ka, kb] = [cell[u], cell[v]];
    let [a, i] = segs[ka], [b, j] = segs[kb];
    if (a > b || (a === b && i > j)) { [a, i, b, j] = [b, j, a, i]; [ka, kb] = [kb, ka]; }
    if (a === b && j < i + 6) continue;
    const key = ka * segs.length + kb; if (seen.has(key)) continue; seen.add(key);
    const A = I[a], B = I[b], c = segCross(A.geo[i], A.geo[i + 1], B.geo[j], B.geo[j + 1]);
    if (!c || c.sin < 0.03) continue; // shallow crossings count too (down to ~2 deg); only near-parallel overlaps are left out
    const la = A.cum[i] + c.u * (A.cum[i + 1] - A.cum[i]), lb = B.cum[j] + c.v * (B.cum[j + 1] - B.cum[j]);
    if (out.some(o => o.a === a && o.b === b && Math.hypot(o.p[0] - c.p[0], o.p[1] - c.p[1]) < 4)) continue;
    out.push({a, b, p: c.p, la, lb, sin: c.sin});
  }
  // T-junctions: an end of a stroke that touches another stroke without crossing it
  for (const s of S) {
    const E = I[s];
    for (const [Lend, Lin] of [[0, Math.min(E.len, 10)], [E.len, Math.max(0, E.len - 10)]]) {
      const e = atLen(E, Lend), dir = unit([e[0] - atLen(E, Lin)[0], e[1] - atLen(E, Lin)[1]]);
      for (const o of S) {
        const O = I[o];
        if (!near(s, o, E, O) || out.some(v => (v.a === s && v.b === o || v.a === o && v.b === s) && Math.hypot(v.p[0] - e[0], v.p[1] - e[1]) < (E.w + O.w) / 2 + 8)) continue;
        const c = closestOn(O, e);
        if (c.d > (E.w + O.w) / 2 + 4) continue;
        if (o === s && Math.abs(c.L - Lend) < 3 * E.w + 20) continue;
        const seg = unit([O.geo[c.i + 1][0] - O.geo[c.i][0], O.geo[c.i + 1][1] - O.geo[c.i][1]]);
        if (Math.abs(dir[0] * seg[1] - dir[1] * seg[0]) < 0.2) continue; // too grazing (< ~12 deg)
        out.push({a: s, b: o, p: c.p, la: Lend, lb: c.L, tee: true});
      }
    }
  }
  return out;
}
function jitter(key) { let x = 2166136261; for (let i = 0; i < key.length; i++) x = Math.imul(x ^ key.charCodeAt(i), 16777619); return ((x >>> 0) % 1000) / 1000 - 0.5; }
// fillet circle for a wedge between rays ua and ub at vertex P (Astra's construction):
// na·(C-P) = ha + r, nb·(C-P) = hb + r with na, nb the unit normals pointing into the wedge.
function solveC(na, nb, qa, qb) { const det = na[0] * nb[1] - na[1] * nb[0]; if (Math.abs(det) < 1e-4) return [NaN, NaN]; return [(qa * nb[1] - na[1] * qb) / det, (na[0] * qb - qa * nb[0]) / det]; }
// the junction graph: nodes (clustered events), their rays, and the corners between neighbouring rays
function junctions(sheet) {
  const key = sheet.items.filter(it => it.t === 's').map(it => it.id).join(',');
  if (sheet.jxKey === key) return sheet.jx;
  const I = sheet.items, ev = events(sheet);
  const thr = e => Math.max(8, 1.2 * Math.max(I[e.a].w, I[e.b].w) + 4); // crossings this close make one knot of ink
  // two lines that cross at a shallow angle overlap over a long stretch: their crossings there (a wobbly hand line can cross
  // the other several times) are one knot, so the reach grows as the angle shrinks
  const span = e => thr(e) * clamp(0.26 / (e.sin || 1), 1, 5);
  const close = (e, f) => Math.hypot(f.p[0] - e.p[0], f.p[1] - e.p[1]) < (e.a === f.a && e.b === f.b ? Math.max(span(e), span(f)) : Math.max(thr(e), thr(f)));
  const nodes = [];
  for (const e of ev) { // complete-link clustering: an event joins a node only if it is close to all of its events
    const n = nodes.find(nd => nd.ev.every(f => close(e, f)));
    if (n) n.ev.push(e); else nodes.push({ev: [e]});
  }
  const onStroke = new Map(); // stroke -> [{L, node}]
  nodes.forEach((nd, k) => { nd.k = k; nd.p = [nd.ev.reduce((s, e) => s + e.p[0], 0) / nd.ev.length, nd.ev.reduce((s, e) => s + e.p[1], 0) / nd.ev.length];
    for (const e of nd.ev) for (const [n, L] of [[e.a, e.la], [e.b, e.lb]]) { if (!onStroke.has(n)) onStroke.set(n, []); onStroke.get(n).push({L, k}); } });
  const corners = [];
  for (const nd of nodes) {
    let rays = [];
    for (const e of nd.ev) for (const [n, L] of [[e.a, e.la], [e.b, e.lb]]) for (const sign of [1, -1]) {
      const it = I[n], w = it.w, avail = sign > 0 ? it.len - L : L;
      if (avail < 0.6 * w + 3) continue; // the line ends here (T-junction or a tiny stub)
      const dup = rays.find(r => r.n === n && r.sign === sign && Math.abs(r.L - L) < 2 * span(e) + w);
      if (dup) { if ((L - dup.L) * sign > 0) Object.assign(dup, {L, e, avail}); continue; }
      rays.push({n, L, sign, e, avail, w});
    }
    for (const r of rays) {
      const it = I[r.n];
      let next = Infinity;
      for (const o of onStroke.get(r.n) || []) if (o.k !== nd.k && (o.L - r.L) * r.sign > 0) next = Math.min(next, Math.abs(o.L - r.L));
      r.next = next;
      const s = Math.min(clamp(1.5 * r.w, 8, 24), r.avail, next * 0.5 || 8);
      const P = r.e.p, q1 = atLen(it, r.L + r.sign * s), q2 = atLen(it, r.L + r.sign * 0.6 * s);
      const u1 = unit([q1[0] - P[0], q1[1] - P[1]]), u2 = unit([q2[0] - P[0], q2[1] - P[1]]);
      r.u = unit([u1[0] + u2[0], u1[1] + u2[1]]); r.curved = dot(u1, u2) < Math.cos(20 * DEG);
      r.ang = Math.atan2(r.u[1], r.u[0]);
    }
    rays = rays.filter(r => Number.isFinite(r.ang)).sort((x, y) => x.ang - y.ang);
    nd.corners = [];
    if (rays.length < 2) continue;
    const top = Math.max(...nd.ev.map(e => Math.max(e.a, e.b)));
    nd.top = top; nd.color = I[top].color;
    if (nd.ev.length > 2) nd.core = hull(nd.ev.map(e => e.p)); // the tiny cell between close crossings is inked in
    const dense = rays.length >= 6 ? 0.8 : 1; // where three or more lines meet, slightly smaller fillets, so the knot stays light
    for (let k = 0; k < rays.length; k++) {
      const ra = rays[k], rb = rays[(k + 1) % rays.length];
      let th = rb.ang - ra.ang; if (th <= 0) th += 2 * Math.PI;
      if (th >= 165 * DEG || th < 1.5 * DEG) continue;
      const ev2 = ra.e === rb.e ? ra.e : nd.ev.find(e => (e.a === ra.n && e.b === rb.n) || (e.a === rb.n && e.b === ra.n));
      const P = ev2 ? ev2.p : nd.p;
      const ua = ra.u, ub = rb.u;
      let na = [-ua[1], ua[0]]; if (dot(na, ub) < 0) na = [-na[0], -na[1]];
      let nb = [-ub[1], ub[0]]; if (dot(nb, ua) < 0) nb = [-nb[0], -nb[1]];
      const ha = ra.w / 2, hb = rb.w / 2, maxW = Math.max(ra.w, rb.w);
      const id = [I[ra.n].id + (ra.sign > 0 ? '+' : '-'), I[rb.n].id + (rb.sign > 0 ? '+' : '-')].sort().join('|') + '@' + Math.round(P[0] / 2) + ',' + Math.round(P[1] / 2);
      const x = clamp((165 * DEG - th) / (45 * DEG), 0, 1);
      let r = (2.6 * maxW + 5) * dense * x * x * (3 - 2 * x) * (1 + 0.1 * jitter(id)); // full below 120 deg, fading out towards 165
      const X0 = solveC(na, nb, ha, hb), X1 = solveC(na, nb, ha + 1, hb + 1), Xs = [X1[0] - X0[0], X1[1] - X0[1]];
      const ta0 = dot(X0, ua), tas = dot(Xs, ua), tb0 = dot(X0, ub), tbs = dot(Xs, ub);
      // how far along each line the ink may run. A shallow wedge (under 30 deg) is solid already where the two lines overlap
      // (up to t0); past that it gets a long thin tongue of ink, still capped, so it never runs along the whole line
      const shallow = th < 30 * DEG;
      const capOf = (ray, t0) => shallow ? Math.min(0.8 * ray.avail, 0.45 * ray.next, t0 + (6 * maxW + 12) * (ray.curved ? 0.7 : 1))
        : Math.min(0.8 * ray.avail, 0.45 * ray.next, (7 * maxW + 12) * dense) * (ray.curved ? 0.7 : 1);
      const ca = capOf(ra, ta0), cb = capOf(rb, tb0);
      if (![ta0, tas, tb0, tbs].every(Number.isFinite) || tas <= 0 || tbs <= 0) continue;
      if (ta0 < 0 || tb0 < 0 || ta0 >= ca || tb0 >= cb) continue;
      r = Math.min(r, (ca - ta0) / tas, (cb - tb0) / tbs);
      if (!(r >= 1)) continue;
      const C = [P[0] + X0[0] + Xs[0] * r, P[1] + X0[1] + Xs[1] * r];
      const V = [P[0] + X0[0], P[1] + X0[1]];
      const ta = Math.min(ca, (ta0 + tas * r) * (1 + 0.1 * jitter(id + 'a'))), tb = Math.min(cb, (tb0 + tbs * r) * (1 + 0.1 * jitter(id + 'b')));
      // the filled shape: along each line's inner edge (sunk slightly into the line, so there is no seam), then the arc
      const eps = (h) => Math.min(1.5, 0.45 * h);
      // each side runs along the real (possibly curved) line, so the curve meets the line's edge exactly
      const side = (ray, t, h, nIn) => {
        const it = I[ray.n], m = clamp(Math.ceil(t / 4), 2, 24), pts = [];
        let nn = nIn, c = P, d = ray.u;
        for (let k2 = 0; k2 <= m; k2++) {
          const L = ray.L + ray.sign * t * k2 / m; c = k2 === 0 ? P : atLen(it, L);
          const c1 = atLen(it, L - ray.sign * 2), c2 = atLen(it, L + ray.sign * 2), dd = unit([c2[0] - c1[0], c2[1] - c1[1]]);
          if (Math.hypot(c2[0] - c1[0], c2[1] - c1[1]) > 0.5) { d = dd; nn = [-dd[1], dd[0]]; if (dot(nn, nIn) < 0) nn = [-nn[0], -nn[1]]; }
          pts.push([c[0] + nn[0] * (h - eps(h)), c[1] + nn[1] * (h - eps(h))]);
        }
        return {pts, T: [c[0] + nn[0] * h, c[1] + nn[1] * h], d};
      };
      const sa = side(ra, ta, ha, na), sb = side(rb, tb, hb, nb);
      // the curve: a cubic with the handles of a circular arc of radius r, tangent to both edges at their ends
      const hl = 4 / 3 * Math.tan((Math.PI - th) / 4) * r;
      const c1 = [sa.T[0] - sa.d[0] * hl, sa.T[1] - sa.d[1] * hl], c2 = [sb.T[0] - sb.d[0] * hl, sb.T[1] - sb.d[1] * hl];
      const vc = unit([V[0] - C[0], V[1] - C[1]]), mid = [C[0] + vc[0] * r, C[1] + vc[1] * r];
      if (![...sa.T, ...sb.T, ...C].every(Number.isFinite)) continue;
      const cn = {id, node: nd, P, V, C, r, M: mid, Ta: sa.T, Tb: sb.T, c1, c2, A: sa.pts, B: sb.pts.reverse(), color: nd.color, order: top, anchor: [(V[0] + mid[0]) / 2, (V[1] + mid[1]) / 2], ang: [ra.ang, rb.ang]};
      nd.corners.push(cn); corners.push(cn);
    }
  }
  sheet.jx = {nodes: nodes.filter(nd => nd.corners.length), corners}; sheet.jxKey = key;
  return sheet.jx;
}
function hull(pts) { // convex hull (monotone chain)
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), x = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const q of p) { while (lo.length > 1 && x(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (const q of p.reverse()) { while (up.length > 1 && x(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}
function roundedSet(sheet) { const s = new Set(); for (const it of sheet.items) if (it.t === 'r') for (const k of it.keys) s.add(k); return s; }
function sharpCorners(sheet) { const rs = roundedSet(sheet); return junctions(sheet).corners.filter(c => !rs.has(c.id)); }
function filletPath(ctx, c, k = 1) { // k < 1 grows the shape from the inner vertex (animation)
  const tr = k === 1 ? q => q : q => [c.V[0] + (q[0] - c.V[0]) * k, c.V[1] + (q[1] - c.V[1]) * k];
  ctx.beginPath();
  c.A.forEach((q, i) => { const z = tr(q); i ? ctx.lineTo(z[0], z[1]) : ctx.moveTo(z[0], z[1]); });
  const T = tr(c.Ta), q1 = tr(c.c1), q2 = tr(c.c2), U = tr(c.Tb); ctx.lineTo(T[0], T[1]); ctx.bezierCurveTo(q1[0], q1[1], q2[0], q2[1], U[0], U[1]);
  for (const q of c.B) { const z = tr(q); ctx.lineTo(z[0], z[1]); }
  ctx.closePath();
}

/* ---------- painting ---------- */
function strokePath(ctx, pts) {
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  if (pts.length === 2) ctx.lineTo(pts[1][0], pts[1][1]);
  for (let i = 1; i < pts.length - 1; i++) ctx.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2);
  if (pts.length > 2) ctx.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
}
function drawStroke(ctx, it, extra = 0) {
  ctx.lineWidth = it.w + extra; ctx.strokeStyle = ctx.fillStyle = it.color;
  if (it.pts.length === 1) { ctx.beginPath(); ctx.arc(it.pts[0][0], it.pts[0][1], (it.w + extra) / 2, 0, 7); ctx.fill(); return; }
  strokePath(ctx, it.pts); ctx.stroke();
}
// strokes in order, each followed by the rounded corners it tops (so a later line still passes over them)
function drawLines(ctx, sheet, skip, mono, extra = 0) {
  const rs = roundedSet(sheet), by = new Map();
  const cores = new Set();
  for (const c of junctions(sheet).corners) if (rs.has(c.id) && !(skip && skip.has(c.id))) { if (!by.has(c.order)) by.set(c.order, []); by.get(c.order).push(c); if (c.node.core) cores.add(c.node); }
  sheet.items.forEach((it, n) => {
    if (it.t !== 's') return;
    drawStroke(ctx, mono ? {...it, color: mono} : it, extra);
    for (const c of by.get(n) || []) { ctx.fillStyle = mono || c.color; filletPath(ctx, c); ctx.fill(); if (extra) { ctx.lineWidth = extra; ctx.strokeStyle = mono; ctx.stroke(); } }
    for (const nd of cores) if (nd.top === n && nd.core.length > 2) { ctx.fillStyle = mono || nd.color; ctx.beginPath(); nd.core.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath(); ctx.fill(); }
  });
}
const MASK = 800;
const geomKey = sheet => sheet.items.filter(it => it.t !== 'f').map(it => it.id).join(',');
function maskOf(sheet) { // barrier raster of the lines and their rounded corners, and its regions
  const key = geomKey(sheet);
  if (sheet.maskKey === key && sheet.mask) return sheet.mask;
  const c = document.createElement('canvas'); c.width = c.height = MASK;
  const x = c.getContext('2d', {willReadFrequently: true}); x.setTransform(MASK / 1000, 0, 0, MASK / 1000, 0, 0); x.lineCap = x.lineJoin = 'round';
  drawLines(x, sheet, null, '#000', 3);
  const d = x.getImageData(0, 0, MASK, MASK).data, N = MASK * MASK, m = new Uint8Array(N);
  for (let i = 0; i < N; i++) m[i] = d[i * 4 + 3] > 90 ? 1 : 0;
  // label the free regions (4-connected), with their areas
  const lab = new Int32Array(N).fill(-1), area = [], stack = [];
  for (let s = 0; s < N; s++) {
    if (m[s] || lab[s] >= 0) continue;
    const id = area.length; let n = 0; lab[s] = id; stack.push(s);
    while (stack.length) {
      const p = stack.pop(); n++;
      const px = p % MASK;
      if (px > 0 && !m[p - 1] && lab[p - 1] < 0) { lab[p - 1] = id; stack.push(p - 1); }
      if (px < MASK - 1 && !m[p + 1] && lab[p + 1] < 0) { lab[p + 1] = id; stack.push(p + 1); }
      if (p >= MASK && !m[p - MASK] && lab[p - MASK] < 0) { lab[p - MASK] = id; stack.push(p - MASK); }
      if (p < N - MASK && !m[p + MASK] && lab[p + MASK] < 0) { lab[p + MASK] = id; stack.push(p + MASK); }
    }
    area.push(n);
  }
  // thin spaces: a sliver whose widest point is about a line's width or less (chamfer distance to the ink, in mask pixels)
  const dist = new Float32Array(N), INF = 1e6;
  for (let i = 0; i < N; i++) dist[i] = m[i] ? 0 : INF;
  for (let y = 0; y < MASK; y++) for (let x0 = 0; x0 < MASK; x0++) { const i = y * MASK + x0; if (!dist[i]) continue; let v = dist[i];
    if (x0 > 0) v = Math.min(v, dist[i - 1] + 1); if (y > 0) { v = Math.min(v, dist[i - MASK] + 1); if (x0 > 0) v = Math.min(v, dist[i - MASK - 1] + 1.4); if (x0 < MASK - 1) v = Math.min(v, dist[i - MASK + 1] + 1.4); } dist[i] = v; }
  for (let y = MASK - 1; y >= 0; y--) for (let x0 = MASK - 1; x0 >= 0; x0--) { const i = y * MASK + x0; if (!dist[i]) continue; let v = dist[i];
    if (x0 < MASK - 1) v = Math.min(v, dist[i + 1] + 1); if (y < MASK - 1) { v = Math.min(v, dist[i + MASK] + 1); if (x0 < MASK - 1) v = Math.min(v, dist[i + MASK + 1] + 1.4); if (x0 > 0) v = Math.min(v, dist[i + MASK - 1] + 1.4); } dist[i] = v; }
  const widest = new Float32Array(area.length), deep = new Int32Array(area.length), edge = new Uint8Array(area.length), cx = new Float64Array(area.length), cy = new Float64Array(area.length);
  for (let i = 0; i < N; i++) { const l = lab[i]; if (l < 0) continue; if (dist[i] > widest[l]) { widest[l] = dist[i]; deep[l] = i; } const x0 = i % MASK; cx[l] += x0; cy[l] += (i - x0) / MASK; if (x0 === 0 || x0 === MASK - 1 || i < MASK || i >= N - MASK) edge[l] = 1; }
  const thin = area.map((a, l) => !edge[l] && a < N * 0.02 && widest[l] <= 3.6);
  const mid = area.map((a, l) => [cx[l] / a * 1000 / MASK, cy[l] / a * 1000 / MASK]); // centre of each space, in sheet units
  sheet.mask = {m, lab, area, thin, mid, widest, deep}; sheet.maskKey = key;
  return sheet.mask;
}
// a thin sliver of paper right next to a rounded junction is inked in, as when inking by hand (its colour: the junction's)
function slivers(sheet) {
  const key = geomKey(sheet);
  if (sheet.slKey === key) return sheet.sl;
  const rs = roundedSet(sheet), byId = new Map();
  const corners = rs.size ? junctions(sheet).corners.filter(c => rs.has(c.id)) : [];
  if (corners.length) {
    const {m, lab, thin} = maskOf(sheet);
    for (const c of corners) {
      const d = unit([c.M[0] - c.V[0], c.M[1] - c.V[1]]);
      for (const s of [1.5, 3, 5, 8]) {
        const px = Math.round((c.M[0] + d[0] * s) * MASK / 1000), py = Math.round((c.M[1] + d[1] * s) * MASK / 1000);
        if (px < 0 || py < 0 || px >= MASK || py >= MASK) continue;
        const i = py * MASK + px; if (m[i]) continue;
        if (thin[lab[i]] && !byId.has(lab[i])) byId.set(lab[i], {color: c.color, node: c.node});
        break;
      }
    }
    // and the specks and slivers caught inside a rounded knot
    const knots = [...new Set(corners.map(c => c.node))].map(nd => ({nd, ext: Math.max(...nd.corners.flatMap(c => [c.Ta, c.Tb, c.M].map(q => Math.hypot(q[0] - nd.p[0], q[1] - nd.p[1]))))}));
    const {mid} = maskOf(sheet);
    thin.forEach((on, l) => {
      if (!on || byId.has(l)) return;
      let best = null;
      for (const k of knots) { const d = Math.hypot(mid[l][0] - k.nd.p[0], mid[l][1] - k.nd.p[1]) - k.ext; if (d <= 20 && (!best || d < best.d)) best = {d, nd: k.nd}; }
      if (best) byId.set(l, {color: best.nd.color, node: best.nd});
    });
  }
  sheet.sl = byId; sheet.slKey = key; sheet.slCanvas = null;
  return byId;
}
function sliverLayer(sheet) { // the inked slivers as an image (not those whose junction is still growing in)
  const sl = slivers(sheet);
  if (!sl.size) return null;
  const an = sheet.anim, ids = [...sl.keys()].filter(l => !(an && sl.get(l).node.corners.some(c => an.keys.has(c.id))));
  const key = ids.join(',');
  if (sheet.slCanvas && sheet.slCanvasKey === key) return sheet.slCanvas;
  const {m, lab} = maskOf(sheet), N = MASK * MASK, own = new Int32Array(N).fill(-1), want = new Set(ids);
  for (let i = 0; i < N; i++) if (!m[i] && want.has(lab[i])) own[i] = lab[i];
  for (let pass = 0; pass < 3; pass++) { // under the lines' edges too, so no paper seam is left
    const add = [];
    for (let i = 0; i < N; i++) {
      if (own[i] >= 0 || !m[i]) continue;
      const px = i % MASK;
      const q = (px > 0 && own[i - 1] >= 0) ? i - 1 : (px < MASK - 1 && own[i + 1] >= 0) ? i + 1 : (i >= MASK && own[i - MASK] >= 0) ? i - MASK : (i < N - MASK && own[i + MASK] >= 0) ? i + MASK : -1;
      if (q >= 0) add.push(i, own[q]);
    }
    for (let k = 0; k < add.length; k += 2) own[add[k]] = add[k + 1];
  }
  const c = document.createElement('canvas'); c.width = c.height = MASK;
  const x = c.getContext('2d'), img = x.createImageData(MASK, MASK), D = img.data, rgb = new Map();
  for (let i = 0; i < N; i++) if (own[i] >= 0) {
    const h = sl.get(own[i]).color; if (!rgb.has(h)) rgb.set(h, [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
    const v = rgb.get(h); D[i * 4] = v[0]; D[i * 4 + 1] = v[1]; D[i * 4 + 2] = v[2]; D[i * 4 + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  sheet.slCanvas = c; sheet.slCanvasKey = key;
  return c;
}
function regionAt(sheet, x, y) { // the region under a point (or next to it, when the point is on a line's anti-aliased edge)
  const {m, lab, area} = maskOf(sheet), ink = slivers(sheet), sx = Math.round(x * MASK / 1000), sy = Math.round(y * MASK / 1000);
  let id = -1; // on a line's edge, accept only when every free pixel nearby belongs to one space; on the line itself, none
  for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
    const px = sx + dx, py = sy + dy;
    if (px < 0 || py < 0 || px >= MASK || py >= MASK || m[py * MASK + px]) continue;
    const l = lab[py * MASK + px]; if (ink.has(l)) continue; if (id >= 0 && l !== id) return null; id = l;
  }
  return id >= 0 ? {id, area: area[id]} : null;
}
function fillLayer(sheet) { // colour behind the lines: each region in the colour last given to it
  const fills = sheet.items.filter(it => it.t === 'f');
  if (!fills.length) return null;
  const key = geomKey(sheet) + '|' + fills.map(f => f.id).join(',');
  if (sheet.fillKey === key && sheet.fillCanvas) return sheet.fillCanvas;
  const {m, lab} = maskOf(sheet), N = MASK * MASK, col = new Map();
  for (const f of fills) { const g = regionAt(sheet, f.x, f.y); if (g) col.set(g.id, f.color); }
  const c = document.createElement('canvas'); c.width = c.height = MASK;
  const x = c.getContext('2d'), img = x.createImageData(MASK, MASK), D = img.data;
  const rgb = new Map([...new Set(col.values())].map(h => [h, [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]]));
  const own = new Int32Array(N).fill(-1); // region whose colour a pixel takes
  for (let i = 0; i < N; i++) if (!m[i] && col.has(lab[i])) own[i] = lab[i];
  for (let pass = 0; pass < 3; pass++) { // run the colour a little under the lines, so no paper shows at their edges
    const add = [];
    for (let i = 0; i < N; i++) {
      if (own[i] >= 0 || !m[i]) continue;
      const px = i % MASK;
      const q = (px > 0 && own[i - 1] >= 0) ? i - 1 : (px < MASK - 1 && own[i + 1] >= 0) ? i + 1 : (i >= MASK && own[i - MASK] >= 0) ? i - MASK : (i < N - MASK && own[i + MASK] >= 0) ? i + MASK : -1;
      if (q >= 0) add.push(i, own[q]);
    }
    for (let k = 0; k < add.length; k += 2) own[add[k]] = add[k + 1];
  }
  for (let i = 0; i < N; i++) if (own[i] >= 0) { const v = rgb.get(col.get(own[i])); D[i * 4] = v[0]; D[i * 4 + 1] = v[1]; D[i * 4 + 2] = v[2]; D[i * 4 + 3] = 255; }
  x.putImageData(img, 0, 0);
  sheet.fillCanvas = c; sheet.fillKey = key;
  return c;
}
// paper, colour, lines and their rounded corners (the ones that are growing are painted by the overlay)
function paintBase(ctx, sheet, W) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, W);
  const fl = fillLayer(sheet); if (fl) { ctx.imageSmoothingEnabled = true; ctx.drawImage(fl, 0, 0, W, W); }
  const sv = sliverLayer(sheet); if (sv) { ctx.imageSmoothingEnabled = true; ctx.drawImage(sv, 0, 0, W, W); }
  ctx.setTransform(W / 1000, 0, 0, W / 1000, 0, 0); ctx.lineCap = ctx.lineJoin = 'round';
  drawLines(ctx, sheet, sheet.anim ? sheet.anim.keys : null);
}
function animProgress(sheet, c, now) {
  const an = sheet.anim, rank = an.order.indexOf(c.id);
  const delay = rank / Math.max(1, an.order.length) * 500;
  const p = Math.min(1, Math.max(0, (now - an.t0 - delay) / 420));
  return 1 - (1 - p) * (1 - p);
}

/* ---------- sample neuro-line and shapes ---------- */
function sampleLine(rnd = Math.random) {
  const ph = [rnd() * 7, rnd() * 7, rnd() * 7];
  let x = 150 + rnd() * 700, y = 150 + rnd() * 700, a = rnd() * 6.28, pts = [[x, y]];
  for (let i = 0; i < 300; i++) {
    const turn = 0.075 * (Math.sin(i * 0.05 + ph[0]) + 1.3 * Math.sin(i * 0.019 + ph[1]) + 0.9 * Math.sin(i * 0.11 + ph[2])) + (rnd() - 0.5) * 0.12;
    a += turn;
    const m = 90, cx = 500 - x, cy = 500 - y;
    if (x < m || x > 1000 - m || y < m || y > 1000 - m) { let da = Math.atan2(cy, cx) - a; da = Math.atan2(Math.sin(da), Math.cos(da)); a += da * 0.12; }
    x += Math.cos(a) * 5.5; y += Math.sin(a) * 5.5; pts.push([x, y]);
  }
  return pts;
}
function handShape(rnd) { // the paper-mode illustration of a figure: a closed outline with a hand's wobble (never a ready-made shape on the user's sheet)
  const ph = rnd() * 6, out = [], n = 150;
  for (let i = 0; i <= n; i++) { const th = i / n * 2 * Math.PI, r = 1 + 0.09 * Math.sin(2 * th + ph) + 0.05 * Math.sin(3 * th + 1.7 * ph) + 0.015 * Math.sin(9 * th); out.push([500 + Math.cos(th) * 190 * r, 530 + Math.sin(th) * 160 * r]); }
  return out;
}
function demoLine(rnd) { // the paper-mode illustration of a neuro-line: edge to edge across the sheet, never repeating
  const a = rnd() * Math.PI, c = [500 + (rnd() - 0.5) * 300, 500 + (rnd() - 0.5) * 300], d = [Math.cos(a), Math.sin(a)], nrm = [-d[1], d[0]];
  const ph = [rnd() * 7, rnd() * 7, rnd() * 7], amp = [50 + rnd() * 50, 25 + rnd() * 30, 10 + rnd() * 10], out = [];
  for (let i = 0; i <= 220; i++) {
    const u = i / 220, s = (u - 0.5) * 1300, off = amp[0] * Math.sin(u * 5.1 + ph[0]) + amp[1] * Math.sin(u * 11.3 + ph[1]) + amp[2] * Math.sin(u * 23 + ph[2]);
    out.push([c[0] + d[0] * s + nrm[0] * off, c[1] + d[1] * s + nrm[1] * off]);
  }
  const inside = q => q[0] > -15 && q[0] < 1015 && q[1] > -15 && q[1] < 1015;
  let best = [], run = [];
  for (const q of out) { if (inside(q)) run.push(q); else { if (run.length > best.length) best = run; run = []; } }
  return run.length > best.length ? run : best;
}
function seeded(seed) { let x = seed; return () => (x = (x * 16807) % 2147483647) / 2147483647; }
function neurographFigure(pts, rnd = Math.random) { // a free line that runs along the outline and weaves through it
  const n = pts.length;
  let cx = 0, cy = 0; for (const p of pts) { cx += p[0]; cy += p[1]; } cx /= n; cy /= n;
  const ph = [rnd() * 7, rnd() * 7], out = [], steps = Math.round(n * 1.04);
  for (let k = 0; k < steps; k++) {
    const p = pts[Math.floor(k * n / steps) % n], dx = p[0] - cx, dy = p[1] - cy, len = Math.hypot(dx, dy) || 1;
    const off = 34 * Math.sin(k * 0.21 + ph[0]) + 22 * Math.sin(k * 0.073 + ph[1]) + 10 * Math.sin(k * 0.47);
    if (k % 2 === 0) out.push([p[0] + dx / len * off, p[1] + dy / len * off]);
  }
  return out;
}

/* ---------- board: a sheet with tools ---------- */
// o.round: rounding (button, and a tap or click on a corner); o.sharp: mark the sharp corners;
// o.tapOnly: a tap never leaves a dot (it rounds a corner or shows a hint; dragging still draws);
// o.extras: the "clear" and "sample line" buttons (on the drawing steps only);
// o.fill: the "colour a small piece" tool; o.paint: colouring mode (any region, the colouring palette)
function makeBoard(key, o = {}) {
  const sheet = state.sheets[key], tool = state.tool;
  const PAL = o.paint ? PAINT : COLORS, cur = () => o.paint ? tool.paint : tool.color;
  const wrap = h('div', {class: 'board'});
  const canvas = h('canvas', {class: 'sheet', role: 'img', 'aria-label': t('ngCanvasLabel')});
  const hint = h('div', {class: 'sheet-hint', 'aria-hidden': 'true'}, t('ngDrawHere'));
  const sw = h('div', {class: 'sheet-wrap'}, canvas, hint);
  const status = h('p', {class: 'board-status', role: 'status'});
  const say = (msg, good) => { status.textContent = msg || ''; status.classList.toggle('good', !!good); };
  const swatches = h('div', {class: 'tool-group', role: 'radiogroup', 'aria-label': t('ngColor')}, PAL.map((c, i) => h('button', {type: 'button', class: 'swatch', role: 'radio', 'aria-checked': String(cur() === i), 'aria-label': t('ngCol' + i), 'data-c': i,
    onclick: () => { if (o.paint) tool.paint = i; else { tool.color = i; if (tool.mode === 'fill') tool.mode = 'pen'; } sync(); }}, h('i', {style: 'background:' + c}))));
  const widths = o.paint ? null : h('div', {class: 'tool-group', role: 'radiogroup', 'aria-label': t('ngWidth')}, [['ngThin', 4], ['ngMed', 8], ['ngThick', 14]].map(([k, px], i) => h('button', {type: 'button', class: 'wbtn', role: 'radio', 'aria-checked': String(tool.width === i), 'aria-label': t(k), title: t(k), 'data-w': i,
    onclick: () => { tool.width = i; if (tool.mode === 'fill') tool.mode = 'pen'; sync(); }}, h('i', {style: `height:${px}px`}))));
  const undo = h('button', {type: 'button', class: 'tbtn', onclick: () => { // one step back; a recolour gives the space its earlier colour back
    const it = sheet.items.pop(); if (it && it.was) for (const [i, f] of it.was) sheet.items.splice(i, 0, f); changed(); }}, t('ngUndo'));
  const clear = o.paint || !o.extras ? null : h('button', {type: 'button', class: 'tbtn', onclick: () => { sheet.items.length = 0; sheet.anim = null; changed(); }}, t('ngClear'));
  const sample = o.paint || !o.extras ? null : h('button', {type: 'button', class: 'tbtn', onclick: () => { sheet.items.push({t: 's', pts: sampleLine(), color: COLORS[tool.color], w: WIDTHS[Math.min(tool.width, 1)]}); changed(); if (o.onStroke) o.onStroke(sheet); }}, t('ngSample'));
  const fillBtn = o.fill ? h('button', {type: 'button', class: 'tbtn', 'aria-pressed': 'false', onclick: () => { tool.mode = tool.mode === 'fill' ? 'pen' : 'fill'; say(tool.mode === 'fill' ? t('ngFillOn') : ''); sync(); }}, t('ngFill')) : null;
  const roundBtn = o.round ? h('button', {type: 'button', class: 'tbtn round', onclick: () => roundKeys(sharpCorners(sheet).map(c => c.id))}, t('ngRoundBtn')) : null;
  const tools = h('div', {class: 'tools', role: 'group', 'aria-label': t('ngTools')}, swatches, widths, h('div', {class: 'tool-group'}, undo, clear, sample, fillBtn, roundBtn));
  wrap.append(sw, tools, status);
  if (o.round) wrap.append(h('p', {class: 'ng-muted board-tip'}, t('ngTapRound')));
  const mode = () => o.paint ? 'fill' : tool.mode;

  const ctx = canvas.getContext('2d');
  let W = 0, base = null, baseKey = '', raf = 0, live = null;
  function sync() {
    swatches.querySelectorAll('.swatch').forEach(b => b.setAttribute('aria-checked', String(+b.dataset.c === cur() && (o.paint || tool.mode !== 'fill'))));
    if (widths) widths.querySelectorAll('.wbtn').forEach(b => b.setAttribute('aria-checked', String(+b.dataset.w === tool.width && tool.mode !== 'fill')));
    if (fillBtn) fillBtn.setAttribute('aria-pressed', String(tool.mode === 'fill'));
    canvas.style.cursor = mode() === 'fill' ? 'cell' : 'crosshair';
    undo.disabled = !sheet.items.length; if (clear) clear.disabled = !sheet.items.length;
    hint.hidden = !!sheet.items.length;
    if (roundBtn) roundBtn.disabled = !sharpCorners(sheet).length;
    if (o.onChange) o.onChange(sheet);
  }
  function changed() {
    for (const it of sheet.items) if (!it.id) it.id = ++uid;
    sheet.ver++; sheet.anim = null; paint(); sync(); save();
  }
  function roundKeys(keys) { // one undoable step; the new corners fill in with a short animation
    if (!keys.length) return;
    sheet.items.push({t: 'r', keys, id: ++uid}); save();
    const byId = new Map(junctions(sheet).corners.map(c => [c.id, c]));
    const left = sharpCorners(sheet).length;
    if (reduced()) { sheet.anim = null; sheet.ver++; paint(); sync(); if (!left) say(t('ngAllRound'), true); return; }
    sheet.anim = {keys: new Set(keys), t0: performance.now(), order: keys.slice().sort((a, b) => byId.get(a).P[0] - byId.get(b).P[0]), left};
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
    const key = [sheet.ver, !!sheet.anim, W].join('|');
    if (key !== baseKey) { base = base || document.createElement('canvas'); base.width = base.height = W; paintBase(base.getContext('2d'), sheet, W); baseKey = key; }
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(base, 0, 0);
    ctx.setTransform(W / 1000, 0, 0, W / 1000, 0, 0); ctx.lineCap = ctx.lineJoin = 'round';
    if (sheet.anim) {
      let done = true;
      for (const c of junctions(sheet).corners) if (sheet.anim.keys.has(c.id)) {
        const p = animProgress(sheet, c, now); if (p < 1) done = false;
        if (p > 0) { ctx.fillStyle = c.color; filletPath(ctx, c, p); ctx.fill(); }
      }
      if (done) { const left = sheet.anim.left; sheet.anim = null; sheet.ver++; setTimeout(() => { paint(); if (!left) say(t('ngAllRound'), true); }, 0); }
    }
    if (o.sharp) {
      const sharp = sharpCorners(sheet), pulse = reduced() ? 0 : Math.sin(now / 260), seen = new Set();
      ctx.fillStyle = 'rgba(224,69,90,.9)'; ctx.strokeStyle = 'rgba(224,69,90,.85)';
      for (const c of sharp) {
        ctx.beginPath(); ctx.arc(c.anchor[0], c.anchor[1], 3.2 + pulse * 0.8, 0, 7); ctx.fill();
        if (!seen.has(c.node)) { seen.add(c.node); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(c.node.p[0], c.node.p[1], 17 + pulse * 3, 0, 7); ctx.stroke(); }
      }
    }
    if (live) { ctx.lineWidth = live.w; ctx.strokeStyle = live.color; ctx.beginPath(); live.pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); if (live.pts.length === 1) ctx.lineTo(live.pts[0][0] + .01, live.pts[0][1]); ctx.stroke(); }
  }
  function loop() {
    cancelAnimationFrame(raf);
    const tick = now => {
      if (!canvas.isConnected) return;
      paint(now);
      if (sheet.anim || (o.sharp && !reduced() && sharpCorners(sheet).length)) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }
  const pos = e => { const r = canvas.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * 1000, (e.clientY - r.top) / r.height * 1000]; };
  const perCss = () => 1000 / (canvas.getBoundingClientRect().width || 1); // sheet units per CSS pixel
  // the corners a tap or click means, generously (Owner 2026-11-17: "if you tapped near, close the nearby corners"):
  // every sharp corner whose mark, vertex or junction centre lies within reach (32 CSS px for a finger, 20 for a mouse);
  // when none is that close, the nearest sharp corner within 1.6 x reach.
  function cornersNear(p, touch) {
    const R = (touch ? TAP_TOUCH_PX : TAP_MOUSE_PX) * perCss(), rs = roundedSet(sheet);
    const sharp = junctions(sheet).corners.filter(c => !rs.has(c.id));
    const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]), d = c => Math.min(dist(p, c.anchor), dist(p, c.P), dist(p, c.node.p));
    const hit = sharp.filter(c => d(c) <= R);
    if (hit.length) return hit.map(c => c.id);
    let best = null;
    for (const c of sharp) { const x = d(c); if (!best || x < best.x) best = {c, x}; }
    return best && best.x <= 1.6 * R ? [best.c.id] : [];
  }
  let pid = null, down = null;
  canvas.addEventListener('pointerdown', e => {
    if (pid !== null || (e.pointerType === 'mouse' && e.button !== 0)) return;
    e.preventDefault(); pid = e.pointerId; canvas.setPointerCapture(pid);
    if (sheet.anim) { sheet.anim = null; sheet.ver++; }
    const p = pos(e);
    if (mode() === 'fill') { fillAt(p); pid = null; return; }
    down = {t: performance.now(), x: e.clientX, y: e.clientY, travel: 0, touch: e.pointerType !== 'mouse'};
    const fig = !!(o.fig && o.fig()); // drawing the figure: always the thick marker
    live = {pts: [p], color: COLORS[tool.color], w: WIDTHS[fig ? 2 : tool.width], fig}; paint();
  });
  canvas.addEventListener('pointermove', e => {
    if (e.pointerId !== pid || !live) {
      if (o.round && pid === null && e.pointerType === 'mouse' && mode() !== 'fill') canvas.style.cursor = cornersNear(pos(e), false).length ? 'pointer' : 'crosshair';
      return;
    }
    for (const ev of (e.getCoalescedEvents ? e.getCoalescedEvents() : [e])) {
      if (down) down.travel = Math.max(down.travel, Math.hypot(ev.clientX - down.x, ev.clientY - down.y));
      const p = pos(ev), q = live.pts[live.pts.length - 1];
      if (Math.hypot(p[0] - q[0], p[1] - q[1]) >= 3.5) live.pts.push([Math.max(0, Math.min(1000, p[0])), Math.max(0, Math.min(1000, p[1]))]);
    }
    paint();
  });
  const end = e => {
    if (e.pointerId !== pid) return; pid = null;
    if (!live) return;
    const s = live; live = null;
    if (down) down.travel = Math.max(down.travel, Math.hypot(e.clientX - down.x, e.clientY - down.y));
    // a tap rounds the sharp corners near it; anything that moves further is a line, on every board, so lines can
    // always be added after rounding (the rounding steps included)
    if (o.round && down && e.type === 'pointerup' && down.travel < (down.touch ? SLOP_TOUCH_PX : SLOP_MOUSE_PX) && (o.tapOnly || performance.now() - down.t < 350)) {
      const keys = cornersNear(s.pts[0], down.touch);
      if (keys.length) { say(''); roundKeys(keys); down = null; return; }
      if (o.tapOnly) { say(t('ngTapMiss')); down = null; paint(); return; } // a miss leaves no dot, only a hint
    }
    down = null;
    if (o.tapOnly && status.textContent === t('ngTapMiss')) say('');
    if (e.type === 'pointercancel' && s.pts.length < 2) { paint(); return; }
    const it = {t: 's', pts: s.pts, color: s.color, w: s.w};
    if (s.fig) { // a figure drawn in one go: when its ends nearly meet, close it
      it.fig = true; const a = s.pts[0], b = s.pts[s.pts.length - 1];
      if (s.pts.length > 20 && Math.hypot(a[0] - b[0], a[1] - b[1]) < 70) it.pts = s.pts.concat([a.slice()]);
    }
    sheet.items.push(it); changed(); if (o.onStroke) o.onStroke(sheet);
  };
  canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('contextmenu', e => e.preventDefault());
  function fillAt(p) {
    const g = regionAt(sheet, p[0], p[1]);
    if (!g) return say(o.paint ? t('ngColorOnLine') : t('ngFillOpen'));
    if (!o.paint && g.area > MASK * MASK * 0.12) return say(t('ngFillBig'));
    // a space holds one colour: a new colour replaces the earlier ones there (kept on the item, so one undo brings them back)
    const color = PAL[cur()], same = [];
    sheet.items.forEach((it, i) => { if (it.t === 'f' && (regionAt(sheet, it.x, it.y) || {}).id === g.id) same.push([i, it]); });
    if (same.length && same[same.length - 1][1].color === color) return;
    for (let k = same.length - 1; k >= 0; k--) sheet.items.splice(same[k][0], 1);
    sheet.items.push({t: 'f', x: p[0], y: p[1], color, was: same.length ? same : null}); say(''); changed();
  }
  new ResizeObserver(() => { baseKey = ''; paint(); }).observe(canvas);
  const api = {el: wrap, paint, sync, say, changed, sheet, color: () => COLORS[tool.color], addItem: it => { sheet.items.push(it); changed(); }, loop};
  requestAnimationFrame(() => { changed(); loop(); });
  return api;
}

/* ---------- steps ---------- */
function roundInfo(info, sh, none) { // junctions and the sharp corners still left
  const nodes = junctions(sh).nodes.length, sharp = sharpCorners(sh).length;
  info.textContent = !nodes ? none : sharp ? t('ngCrossInfo', {n: nodes, c: sharp}) : t('ngAllRound');
  info.classList.toggle('good', nodes > 0 && !sharp);
}
let breathTimer = 0, timerId = 0;
const clearTimers = () => { clearInterval(breathTimer); breathTimer = 0; }; // the words timer is not a view timer: it survives re-renders

function title(key) { return h('h2', {tabindex: '-1', id: 'stepTitle'}, t(key)); }
function breathing() {
  const word = h('span', {class: 'breath-word', 'aria-hidden': 'true'}, t('ngBreatheIn'));
  const box = h('div', {class: 'breath', 'aria-hidden': 'true'}, h('span', {class: 'breath-dot'}), word);
  let inhale = false;
  const flip = () => { inhale = !inhale; box.classList.toggle('in', inhale); word.textContent = t(inhale ? 'ngBreatheIn' : 'ngBreatheOut'); };
  setTimeout(flip, 60); breathTimer = setInterval(flip, 4500);
  return h('div', {}, box, h('p', {class: 'ng-muted'}, t('ngBreatheNote')));
}
const phoneKey = () => COARSE ? 'ngChoosePhone' : 'ngChooseScreen';
function setMode(m) { state.mode = m; save(); }

/* ---------- paper mode: the same steps as instructions, each with a small picture made by the same drawing engine ---------- */
let demo = null;
function demoSheets() {
  if (demo) return demo;
  const rnd = seeded(1117), mk = items => ({...newSheet(), items});
  const roundAll = sh => mk(sh.items.concat([{t: 'r', keys: sharpCorners(sh).map(c => c.id), id: ++uid}]));
  const lines = mk([1, 2, 3, 5, 4, 0, 1].map(c => ({t: 's', pts: demoLine(rnd), color: COLORS[c], w: WIDTHS[1], id: ++uid})));
  const rounded = roundAll(lines);
  const fig = {t: 's', pts: handShape(rnd), color: COLORS[0], w: WIDTHS[2], fig: true, id: ++uid};
  const figure = mk(rounded.items.concat([fig, {t: 's', pts: neurographFigure(fig.pts, rnd), color: COLORS[1], w: WIDTHS[1], id: ++uid}]));
  const figureRounded = roundAll(figure);
  const {area, widest, deep} = maskOf(figureRounded), fills = [];
  area.forEach((a, l) => { if (widest[l] < 5) return; const i = deep[l]; fills.push({t: 'f', x: (i % MASK + 0.5) * 1000 / MASK, y: (Math.floor(i / MASK) + 0.5) * 1000 / MASK, color: PAINT[1 + Math.floor(rnd() * (PAINT.length - 1))], id: ++uid}); });
  const colored = mk(figureRounded.items.concat(fills));
  return (demo = {lines, rounded, figure, figureRounded, colored});
}
function illus(sheet, cls = 'final-sheet ng-illus') {
  const cv = h('canvas', {class: cls, role: 'img', 'aria-label': t('ngIllAlt')});
  cv.width = cv.height = 900; paintBase(cv.getContext('2d'), sheet, 900);
  return cv;
}
function illusPair(a, b) {
  const fig = (sh, cap) => h('figure', {}, illus(sh, 'ng-illus'), h('figcaption', {}, cap));
  return h('div', {class: 'ng-anim ng-pair'}, fig(a, t('ngIllBefore')), fig(b, t('ngIllAfter')));
}
const lead = k => h('p', {class: 'ng-lead'}, t(k)), muted = k => h('p', {class: 'ng-muted'}, t(k)), note = k => h('p', {class: 'ng-info'}, t(k));
const cols = (left, right) => h('div', {class: 'ng-cols'}, h('div', {}, ...left), right);
function ctaBox(noteKey) {
  return h('div', {class: 'cta'}, h('h3', {}, t('ngCtaTitle')), lead('ngCtaText'),
    h('a', {class: 'btn btn-solid gold', id: 'ctaBtn', href: S.waNeuro(lang), target: '_blank', rel: 'noopener', onclick: () => document.dispatchEvent(new CustomEvent('sl:wa', {detail: {type: 'book', slug: 'neurographics'}}))}, t('ngCtaBtn')), muted(noteKey));
}
function roundBoard(titleKey, texts) {
  const info = h('p', {class: 'ng-info', role: 'status'});
  const board = makeBoard('main', {round: true, sharp: true, tapOnly: true, onChange: sh => roundInfo(info, sh, t('ngCrossNone'))});
  return cols([title(titleKey), ...texts, info], board.el);
}

const STEPS = [
  // 1. intro, materials, and the choice: paper and markers (the best way) or the phone
  () => {
    const w = S.works.find(x => x.id === 'spiral'), m = IMG.works.spiral, title2 = L(w.t);
    const sizes = m.s.filter(s => s <= 1600);
    const choose = md => { setMode(md); go(1); };
    const choice = h('div', {class: 'ng-choice', role: 'group', 'aria-labelledby': 'chooseQ'},
      h('p', {class: 'ng-lead ng-paper-best'}, t('ngPaperBest')),
      h('p', {class: 'ng-label', id: 'chooseQ'}, t('ngChooseQ')),
      h('div', {class: 'ng-choice-btns'},
        h('button', {type: 'button', class: 'btn btn-solid gold', id: 'choosePaper', onclick: () => choose('paper')}, t('ngChoosePaper')),
        h('button', {type: 'button', class: 'btn btn-ghost', id: 'choosePhone', onclick: () => choose('phone')}, t(phoneKey()))));
    return h('div', {class: 'ng-hero'},
      h('div', {}, h('p', {class: 'ng-by'}, t('ngBy')), h('h1', {tabindex: '-1', id: 'stepTitle'}, t('ngS1Title')), lead('ngS1Lead'), choice,
        h('div', {class: 'ng-card'}, h('span', {class: 'ng-label'}, t('ngMatTitle')),
          h('ul', {class: 'ng-list'}, [1, 2, 3, 4, 5].map(i => h('li', {}, t('ngMat' + i)))))),
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
    return h('div', {class: 'ng-single'}, title('ngS2Title'), lead('ngS2Text'),
      h('div', {class: 'ng-anim', role: 'img', 'aria-label': t('ngLineAlt')}, svg('habit', hp, t('ngLineHabit'), 'a'), svg('neuro', npath, t('ngLineNeuro'), 'b')),
      muted('ngS2Nature'));
  },
  // 3. request / theme
  () => h('div', {class: 'ng-single'}, title('ngS5Title'), lead('ngS5Text'),
    h('div', {class: 'ng-field'}, h('label', {class: 'ng-label', for: 'theme'}, t('ngThemeLabel')),
      h('input', {class: 'ng-input', id: 'theme', type: 'text', maxlength: '300', autocomplete: 'off', placeholder: t('ngThemePh'), value: state.theme, oninput: e => { state.theme = e.target.value; save(); }})),
    muted('ngPrivate')),
  // 4. 20 words in 2 minutes
  () => wordsStep(),
  // 5. check-in
  () => h('div', {class: 'ng-single'}, title('ngS7Title'), lead('ngS7Text'),
    [1, 2, 3, 4].map(i => h('div', {class: 'ng-field'}, h('label', {class: 'ng-label', for: 'f' + i}, t('ngF' + i)),
      h('textarea', {class: 'ng-text', id: 'f' + i, rows: '2', placeholder: t('ngFieldPh'), oninput: e => { state.check[i - 1] = e.target.value; save(); }}, state.check[i - 1]))),
    muted('ngPrivate')),
  // 6. neuro-lines over the sheet: many of them (on paper, or the one drawing on the screen)
  () => {
    const texts = [title('ngS8Title'), lead('ngS8Text'), muted('ngS3Text'), h('p', {class: 'ng-lead ng-many'}, t('ngManyLines'))];
    if (paper()) return cols([...texts, breathing(), changedField()], illus(demoSheets().lines));
    const info = h('p', {class: 'ng-info', role: 'status'});
    const count = sh => { const n = sh.items.filter(it => it.t === 's' && !it.fig).length; info.textContent = n >= LINES_MIN ? t('ngLinesMany', {n}) : t('ngLinesCount', {n, min: LINES_MIN}); info.classList.toggle('good', n >= LINES_MIN); };
    const board = makeBoard('main', {extras: true, onChange: count});
    return cols([...texts, info, breathing(), changedField()], board.el);
  },
  // 7. rounding the corners of that same drawing
  () => paper() ? cols([title('ngS4Title'), lead('ngS4Text'), note('ngPaperRound'), muted('ngS4Text2')], illusPair(demoSheets().lines, demoSheets().rounded))
    : roundBoard('ngS4Title', [lead('ngS4Text'), muted('ngS4Text2')]),
  // 8. rules
  () => {
    const rules = [lead('ngS9Text'), h('ul', {class: 'ng-list rules'}, [1, 2, 3, 4, 5, 6].map(i => h('li', {}, t('ngRule' + i))))];
    return paper() ? cols([title('ngS9Title'), ...rules], illus(demoSheets().rounded)) : roundBoard('ngS9Title', rules); // colouring belongs to step 11
  },
  // 9. the figure: drawn by hand, the way you feel it (no ready-made shapes)
  () => {
    if (paper()) return cols([title('ngS10Title'), lead('ngS10Text'), lead('ngS10Text2'), changedField()], illus(demoSheets().figure));
    const sheet = state.sheets.main, figs = () => sheet.items.filter(it => it.t === 's' && it.fig);
    if (state.figDone && !figs().length) state.figDone = false;
    if (!state.figDone) { state.tool.width = 2; state.tool.mode = 'pen'; } // the figure: the thick marker
    let doneBtn = null;
    const board = makeBoard('main', {extras: true, fig: () => !state.figDone, onChange: () => { if (doneBtn) doneBtn.disabled = !figs().length; }});
    const left = [title('ngS10Title'), lead('ngS10Text')];
    if (!state.figDone) {
      doneBtn = h('button', {type: 'button', class: 'btn btn-solid', id: 'figDone', disabled: !figs().length, onclick: () => { state.figDone = true; state.tool.width = 1; save(); renderStep(false); }}, t('ngShapeDone'));
      left.push(note('ngShapeDraw'));
      return cols(left, h('div', {}, board.el, h('div', {class: 'shape-row'}, doneBtn))); // under the sheet, where the finger is
    } else {
      const auto = h('button', {type: 'button', class: 'tbtn', onclick: () => {
        const f = figs(); if (!f.length) return board.say(t('ngNeedFigure'));
        const figColor = f[f.length - 1].color, col = COLORS[state.tool.color] === figColor ? COLORS[(state.tool.color + 1) % COLORS.length] : COLORS[state.tool.color];
        board.addItem({t: 's', pts: neurographFigure(f.flatMap(it => it.pts)), color: col, w: WIDTHS[1]}); board.say('');
      }}, t('ngAutoNeuro'));
      left.push(lead('ngS10Text2'), h('div', {class: 'shape-row'}, auto), changedField());
    }
    return cols(left, board.el);
  },
  // 10. over the drawing again: connect the figure and round the new corners (draft text for Sandra's approval)
  () => paper() ? cols([title('ngS11aTitle'), lead('ngS11aText'), note('ngPaperRound')], illusPair(demoSheets().figure, demoSheets().figureRounded))
    : roundBoard('ngS11aTitle', [lead('ngS11aText')]),
  // 11. colouring by feeling: any enclosed space, any colour, tap again to change it (draft text for Sandra's approval)
  () => {
    if (paper()) return cols([title('ngS12Title'), lead('ngS12Text')], illus(demoSheets().colored));
    const board = makeBoard('main', {paint: true});
    return cols([title('ngS12Title'), lead('ngS12Text'), muted('ngS12Text2')], board.el);
  },
  // 12. check in again: what do I feel now (draft text for Sandra's approval)
  () => h('div', {class: 'ng-single'}, title('ngS13Title'), lead('ngS13Text'),
    [1, 2, 3, 4].map(i => h('div', {class: 'ng-field'}, h('label', {class: 'ng-label', for: 'g' + i}, t('ngF' + i)),
      state.check[i - 1].trim() ? h('p', {class: 'ng-muted ng-before'}, t('ngBefore') + ' ' + state.check[i - 1].trim()) : null,
      h('textarea', {class: 'ng-text', id: 'g' + i, rows: '2', placeholder: t('ngFieldPh'), oninput: e => { state.check2[i - 1] = e.target.value; save(); }}, state.check2[i - 1]))),
    muted('ngPrivate')),
  // 13. final
  () => {
    const again = h('button', {type: 'button', class: 'btn btn-ghost', onclick: restart}, t('ngRestart'));
    if (paper()) {
      const tryPhone = h('button', {type: 'button', class: 'btn btn-ghost', onclick: () => { setMode('phone'); go(5); }}, t(phoneKey()));
      return h('div', {class: 'ng-single'}, title('ngPaperFinalTitle'), lead('ngPaperFinalText'), h('div', {class: 'final-actions'}, tryPhone, again), ctaBox('ngCtaNotePaper'));
    }
    const sheet = state.sheets.main, cv = h('canvas', {class: 'final-sheet', role: 'img', 'aria-label': t('ngFinalAlt')});
    cv.width = cv.height = 1000; paintFull(cv.getContext('2d'), sheet, 1000);
    const dl = h('button', {type: 'button', class: 'btn btn-solid', onclick: download}, t('ngDownload'));
    const keep = h('button', {type: 'button', class: 'btn btn-ghost', onclick: () => go(9)}, t('ngKeepDrawing'));
    return h('div', {class: 'ng-cols'}, cv, h('div', {}, title('ngS11Title'), lead('ngS11Text'), h('div', {class: 'final-actions'}, dl, keep, again), ctaBox('ngCtaNote')));
  }
];

function changedField() {
  return h('div', {class: 'ng-field'}, h('label', {class: 'ng-label', for: 'changed'}, t('ngChanged')),
    h('textarea', {class: 'ng-text', id: 'changed', rows: '2', placeholder: t('ngFieldPh'), oninput: e => { state.changed = e.target.value; save(); }}, state.changed));
}

/* ---------- 20 words in 2 minutes ---------- */
// The words live in state.words.text, updated on every keystroke. The timer is one module-level interval that reads the
// box on screen, never a box captured when the step was first drawn (that stale box emptied the words when time ran out).
const wordList = text => text.match(WORDS) || [];
function wordsTick() {
  const left = state.words.end - Date.now(), tm = document.querySelector('.timer'), bi = document.querySelector('.t-bar i');
  if (tm) tm.textContent = fmt(Math.max(0, left));
  if (bi) bi.style.transform = `scaleX(${Math.max(0, left) / 120000})`;
  if (left <= 0) finishWords();
}
function ensureWordsTimer() { if (state.words.phase === 'run' && !timerId) timerId = setInterval(wordsTick, 200); }
function stopWordsTimer() { clearInterval(timerId); timerId = 0; }
function finishWords() {
  liveWords(); stopWordsTimer();
  state.words.phase = 'done'; save(true);
  if (state.step === WORDS_STEP) { renderStep(false); $('announce').textContent = t('ngTimeUp'); }
}
function wordsStep() {
  const W = state.words, root = h('div', {class: 'ng-cols narrow ng-single'});
  const head = [title('ngS6Title'), lead('ngS6Text')];
  if (state.theme.trim()) head.push(h('p', {class: 'ng-by'}, `${t('ngThemeLabel')}: ${state.theme.trim()}`));
  const area = h('textarea', {class: 'ng-text', id: 'words', rows: '6', placeholder: t('ngWordsPh'), 'aria-label': t('ngWordsLabel'), disabled: W.phase !== 'run', readonly: W.phase === 'done', style: 'min-height:150px'}, W.text);
  const count = h('p', {class: 'words-count', 'aria-live': 'off'}, t('ngWordCount', {n: wordList(W.text).length}));
  const timer = h('div', {class: 'timer', role: 'timer', 'aria-label': t('ngTimeLeft')}, fmt(Math.max(0, W.phase === 'run' ? W.end - Date.now() : W.phase === 'done' ? 0 : 120000)));
  const bar = h('div', {class: 't-bar', 'aria-hidden': 'true'}, h('i'));
  area.addEventListener('input', () => { W.text = area.value; count.textContent = t('ngWordCount', {n: wordList(area.value).length}); save(); });
  const start = () => {
    W.phase = 'run'; W.end = Date.now() + 120000; save(true);
    renderStep(false);
    document.getElementById('words').focus();
  };
  const parts = [];
  if (W.phase === 'idle') {
    parts.push(muted('ngTimerNote'), h('button', {type: 'button', class: 'btn btn-solid', onclick: start}, t('ngStartTimer')), timer, bar, h('label', {class: 'ng-label', for: 'words'}, t('ngWordsLabel')), area, count);
  } else if (W.phase === 'run') {
    parts.push(timer, bar, h('label', {class: 'ng-label', for: 'words'}, t('ngWordsLabel')), area, count, h('button', {type: 'button', class: 'btn btn-ghost', onclick: finishWords}, t('ngFinishNow')));
  } else {
    const words = wordList(W.text), n = words.length;
    parts.push(h('p', {class: 'words-count'}, t('ngWordCount', {n})), h('p', {class: 'words-msg'}, n > 20 ? t('ngFlow') : t('ngFewer')),
      h('p', {class: 'ng-label'}, t('ngSurprise')),
      h('div', {class: 'chips', role: 'group', 'aria-label': t('ngSurprise')}, words.map((w, i) => h('button', {type: 'button', class: 'chip', 'aria-pressed': String(W.surprised.has(i)), onclick: e => {
        if (W.surprised.has(i)) W.surprised.delete(i); else W.surprised.add(i); e.currentTarget.setAttribute('aria-pressed', String(W.surprised.has(i))); save();
      }}, w))),
      h('button', {type: 'button', class: 'btn btn-ghost', onclick: () => { W.phase = 'idle'; W.text = ''; W.surprised = new Set(); save(true); renderStep(false); }}, t('ngTryAgain')));
  }
  root.append(...head, ...parts);
  if (W.phase === 'run') { const bi = bar.querySelector('i'); bi.style.transform = `scaleX(${Math.max(0, W.end - Date.now()) / 120000})`; ensureWordsTimer(); }
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
function stopWordsIfRunning() { // leaving the words step closes the two minutes, keeping every word
  if (state.words.phase === 'run') { liveWords(); state.words.phase = 'done'; }
  stopWordsTimer();
}
function renderStep(focus = true) {
  clearTimers();
  const stage = $('stage'), n = state.step;
  stage.replaceChildren(STEPS[n]());
  $('stepOf').textContent = t('ngStepOf', {n: n + 1, m: TOTAL});
  const ms = $('modeSwitch'); ms.hidden = n === 0 || !state.mode; ms.textContent = paper() ? t(phoneKey()) : t('ngChoosePaper');
  const bar = $('bar'); bar.setAttribute('aria-valuenow', n + 1); bar.setAttribute('aria-valuemax', TOTAL); bar.setAttribute('aria-valuetext', t('ngStepOf', {n: n + 1, m: TOTAL})); bar.setAttribute('aria-label', t('ngSteps'));
  $('barFill').style.width = ((n + 1) / TOTAL * 100) + '%';
  $('dots').replaceChildren(...Array.from({length: TOTAL}, (_, i) => h('li', {class: i < n ? 'done' : i === n ? 'now' : ''})));
  $('nav').hidden = n === 0; // step 1 ends with the choice of paper or phone
  $('backBtn').hidden = n === 0; $('backTxt').textContent = t('ngBack');
  $('nextBtn').hidden = n === TOTAL - 1; $('nextTxt').textContent = t('ngNext');
  if (focus) { const ti = document.getElementById('stepTitle'); if (ti) ti.focus({preventScroll: true}); window.scrollTo({top: 0, behavior: reduced() ? 'auto' : 'smooth'}); }
}
function go(n) { stopWordsIfRunning(); state.step = Math.max(0, Math.min(TOTAL - 1, n)); if (state.step > 0 && !state.mode) state.mode = 'phone'; save(true); renderStep(); }
function restart() { stopWordsIfRunning(); state.sheets = {main: newSheet()}; state.mode = null; state.figDone = false; state.theme = ''; state.words = {text: '', phase: 'idle', end: 0, surprised: new Set()}; state.check = ['', '', '', '']; state.check2 = ['', '', '', '']; state.changed = ''; sess.clear(); go(0); }

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
  try { localStorage.setItem('sl_lang', a.dataset.langLink); } catch (err) {} // remembered; the home's first-visit suggestion never overrides it
  const next = a.dataset.langLink; if (next === lang) return;
  liveWords(); save(true); // the words and the running timer carry over to the new language
  lang = next; history.replaceState(null, '', '?lang=' + lang); applyLang(); renderStep(false);
}));
$('backBtn').addEventListener('click', () => go(state.step - 1));
$('nextBtn').addEventListener('click', () => go(state.step + 1));
restore();
addEventListener('pagehide', () => save(true));
document.addEventListener('visibilitychange', () => { if (document.hidden) save(true); });
$('modeSwitch').addEventListener('click', () => { setMode(paper() ? 'phone' : 'paper'); renderStep(false); });
applyLang(); renderStep(false);
window.__ng = {state, go, setMode, save, get lang() { return lang; }, jx: () => junctions(state.sheets.main)}; // for the browser tests
})();
