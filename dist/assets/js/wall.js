'use strict';
/* Endless wall: every work on a plane that repeats in all directions.
   It drifts slowly by itself, follows the mouse gently (capped speed), slows down over a work
   and near the buttons, and can be dragged with a finger or the mouse. */
window.EndlessWall = function (root, ids, opts) {
  // images.js can fail to load (a dropped request): then works without a known size are left out, and the wall never throws
  const IMG = (window.IMAGES || {}).works || {}, MAX = opts.maxSpeed || 2.6, DRIFT = opts.drift || .45;
  // ids: work ids (strings) or body-art tiles {id, body: true, w, h} built by EndlessWall.bodyArtTiles
  const meta = {}; ids = ids.map(x => { if (typeof x === 'string') return x; meta[x.id] = x; return x.id; });
  ids = ids.filter(id => meta[id] || IMG[id]);
  const src = id => meta[id] ? `${opts.base}assets/img/body-art/${id}-800.webp` : `${opts.base}assets/img/works/${id}-${IMG[id].s.includes(800) ? 800 : IMG[id].s[0]}.webp`;
  // tiles are 145-290 CSS px wide: a 480 px thumbnail (tools/build-thumbs.py) unless the screen needs more pixels than that
  const thumb = id => `${opts.base}assets/img/${meta[id] ? 'body-art' : 'works'}/${id}-480.webp`;
  const pick = (id, w) => w * Math.min(devicePixelRatio || 1, 3) <= 552 ? thumb(id) : src(id);
  const ratio = id => meta[id] ? meta[id].w8 / meta[id].h8 : IMG[id].w / IMG[id].h;
  const world = document.createElement('div'); world.className = 'wall-world'; root.prepend(world);
  // the hero's own size, not innerWidth: while the page loads a mobile browser can report a zoomed-out innerWidth (1560 seen on a 390 px phone)
  const VW = root.clientWidth || innerWidth, VH = root.clientHeight || innerHeight;
  const mobile = VW < 700, colW = mobile ? 165 : 290, gap = mobile ? 16 : 34, cols = mobile ? 5 : 7;

  // Lay works into columns (shortest column first); each column repeats with its own height,
  // so there are no empty stretches where short columns would end.
  const columns = Array.from({length: cols}, () => ({items: [], h: 0}));
  ids.forEach((id, k) => {
    const c = columns.reduce((a, b, i) => (b.h < columns[a].h ? i : a), 0), col = columns[c];
    const w = colW * (.88 + ((k * 37) % 4) * .04), h = w / ratio(id);
    col.items.push({id, w, h, y: col.h}); col.h += h + gap;
  });
  const BW = cols * (colW + gap), tiles = [];
  const copiesX = Math.ceil(VW / BW) + 1;
  columns.forEach((col, c) => {
    const copiesY = Math.ceil(VH / col.h) + 1;
    for (let a = 0; a < copiesX; a++) for (let b = 0; b < copiesY; b++) col.items.forEach(it => {
      const el = document.createElement('button'); el.type = 'button'; el.className = 'wall-tile';
      el.style.width = it.w + 'px'; el.style.height = it.h + 'px'; el.setAttribute('aria-label', opts.title(it.id));
      // placeholder: the work's average colour until the image arrives; the image itself is requested only when the tile first shows (show())
      const bg = meta[it.id] ? meta[it.id].c : IMG[it.id].c; if (bg) el.style.backgroundColor = bg;
      el.dataset.id = it.id; if (meta[it.id]) el.dataset.body = ''; world.append(el);
      tiles.push({el, id: it.id, x: c * (colW + gap) + (colW - it.w) / 2 + a * BW, y: it.y + b * col.h, w: it.w, h: it.h, W: copiesX * BW, H: copiesY * col.h});
    });
  });

  let ox = -BW * .15, oy = -innerHeight * .2, vx = 0, vy = 0, mx = null, my = null, overTile = false;
  let down = false, lx = 0, ly = 0, moved = 0, visible = true;
  const mod = (n, m) => ((n % m) + m) % m;
  // Loads a tile's image the first time it is on screen. loading=lazy cannot do this here: tiles off screen are hidden in place
  // (never moved off), so the browser saw them all in view and fetched every image at once (67 files, 8.9 MB, plus the gallery).
  // The first screenful gets high priority. A failed thumbnail falls back to the 800 file, then one more try after 3 s.
  let firstFrame = true;
  function show(t) {
    t.on = true;
    const im = new Image(), url = pick(t.id, t.w); let tries = 0;
    im.width = Math.round(t.w); im.height = Math.round(t.h); im.alt = ''; im.decoding = 'async';
    if (firstFrame) im.fetchPriority = 'high';
    im.onerror = () => { tries++; if (tries === 1 && url !== src(t.id)) im.src = src(t.id); else if (tries <= 2) setTimeout(() => { im.src = src(t.id) + '?r=' + tries; }, 3000); };
    im.src = url; t.el.append(im);
  }
  const calm = () => (opts.calmZones || []).some(z => { const r = z.getBoundingClientRect(); return mx !== null && mx > r.left - 140 && mx < r.right + 140 && my > r.top - 140 && my < r.bottom + 140; });
  function render() {
    const W = root.clientWidth, H = root.clientHeight;
    for (const t of tiles) {
      const x = mod(t.x + ox + t.w, t.W) - t.w, y = mod(t.y + oy + t.h, t.H) - t.h;
      if (x > W + 40 || y > H + 40) { t.el.style.visibility = 'hidden'; continue; }
      t.el.style.visibility = ''; t.el.style.transform = `translate3d(${x}px,${y}px,0)`;
      if (!t.on) show(t);
    }
    firstFrame = false;
  }
  function loop() {
    if (!down && visible) {
      let tx = -DRIFT, ty = DRIFT * .6; // drifts left and down by itself
      if (mx !== null) {
        const nx = (mx / innerWidth - .5) * 2, ny = (my / root.clientHeight - .5) * 2, dead = .22;
        const f = n => Math.sign(n) * Math.pow(Math.max(0, Math.abs(n) - dead) / (1 - dead), 2);
        const fx = f(nx), fy = f(Math.max(-1, Math.min(1, ny)));
        if (Math.abs(fx) + Math.abs(fy) > .001) { tx = -fx * MAX; ty = -fy * MAX; }
        if (overTile) { tx *= .25; ty *= .25; }
        if (calm() || my < 90) { tx = 0; ty = 0; }
      }
      if (opts.reduced) { tx = 0; ty = 0; }
      vx += (tx - vx) * .035; vy += (ty - vy) * .035;
      ox += vx; oy += vy;
    }
    if (visible) render();
    requestAnimationFrame(loop);
  }
  root.addEventListener('pointermove', e => { if (e.pointerType === 'mouse') { mx = e.clientX; my = e.clientY - root.getBoundingClientRect().top; overTile = !!e.target.closest('.wall-tile'); } });
  root.addEventListener('pointerleave', () => { mx = my = null; overTile = false; });
  world.addEventListener('pointerdown', e => { down = true; moved = 0; lx = e.clientX; ly = e.clientY; vx = vy = 0; world.classList.add('drag'); });
  addEventListener('pointermove', e => { if (!down) return; const dx = e.clientX - lx, dy = e.clientY - ly; ox += dx; oy += dy; vx = Math.max(-12, Math.min(12, dx)); vy = Math.max(-12, Math.min(12, dy)); moved += Math.abs(dx) + Math.abs(dy); lx = e.clientX; ly = e.clientY; });
  addEventListener('pointerup', e => {
    if (!down) return; down = false; world.classList.remove('drag');
    if (moved < 6) { const t = e.target.closest && e.target.closest('.wall-tile'); if (t && opts.onOpen) opts.onOpen(t.dataset.id, t.hasAttribute('data-body')); }
  });
  root.addEventListener('wheel', e => { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) { e.preventDefault(); vx -= e.deltaX * .05; } }, {passive: false});
  new IntersectionObserver(([en]) => visible = en.isIntersecting).observe(root);
  loop();
};

// Body-art photos for the wall: BODY_ART items, minus anything carrying a review tag (e.g. 'nudity') while skipReview is on,
// spread evenly among the work ids (not in one clump). Returns the mixed list for EndlessWall.
window.EndlessWall.mix = function (workIds, bodyArt, skipReview) {
  const photos = ((bodyArt && bodyArt.items) || []).filter(i => !(skipReview && i.review)).map(i => ({id: i.id, body: true, w8: i.w8, h8: i.h8, c: i.c}));
  const out = workIds.slice(), n = workIds.length, m = photos.length;
  photos.forEach((p, j) => out.splice(Math.floor((j + .5) * n / m) + j, 0, p));
  return out;
};
