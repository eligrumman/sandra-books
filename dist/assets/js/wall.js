'use strict';
/* Endless wall: every work on a plane that repeats in all directions.
   It drifts slowly by itself, follows the mouse gently (capped speed), slows down over a work
   and near the buttons, and can be dragged with a finger or the mouse. */
window.EndlessWall = function (root, ids, opts) {
  const IMG = window.IMAGES.works, MAX = opts.maxSpeed || 2.6, DRIFT = opts.drift || .45;
  const src = id => { const m = IMG[id]; return `${opts.base}assets/img/works/${id}-${m.s.includes(800) ? 800 : m.s[0]}.webp`; };
  const ratio = id => IMG[id].w / IMG[id].h;
  const world = document.createElement('div'); world.className = 'wall-world'; root.prepend(world);
  const mobile = innerWidth < 700, colW = mobile ? 165 : 290, gap = mobile ? 16 : 34, cols = mobile ? 5 : 7;

  // Lay works into columns (shortest column first); each column repeats with its own height,
  // so there are no empty stretches where short columns would end.
  const columns = Array.from({length: cols}, () => ({items: [], h: 0}));
  ids.forEach((id, k) => {
    const c = columns.reduce((a, b, i) => (b.h < columns[a].h ? i : a), 0), col = columns[c];
    const w = colW * (.88 + ((k * 37) % 4) * .04), h = w / ratio(id);
    col.items.push({id, w, h, y: col.h}); col.h += h + gap;
  });
  const BW = cols * (colW + gap), tiles = [];
  const copiesX = Math.ceil(innerWidth / BW) + 1;
  columns.forEach((col, c) => {
    const copiesY = Math.ceil(innerHeight / col.h) + 1;
    for (let a = 0; a < copiesX; a++) for (let b = 0; b < copiesY; b++) col.items.forEach(it => {
      const el = document.createElement('button'); el.type = 'button'; el.className = 'wall-tile';
      el.style.width = it.w + 'px'; el.style.height = it.h + 'px'; el.setAttribute('aria-label', opts.title(it.id));
      const im = new Image(); im.src = src(it.id); im.alt = ''; im.decoding = 'async'; im.loading = 'lazy'; el.append(im);
      el.dataset.id = it.id; world.append(el);
      tiles.push({el, x: c * (colW + gap) + (colW - it.w) / 2 + a * BW, y: it.y + b * col.h, w: it.w, h: it.h, W: copiesX * BW, H: copiesY * col.h});
    });
  });

  let ox = -BW * .15, oy = -innerHeight * .2, vx = 0, vy = 0, mx = null, my = null, overTile = false;
  let down = false, lx = 0, ly = 0, moved = 0, visible = true;
  const mod = (n, m) => ((n % m) + m) % m;
  const calm = () => (opts.calmZones || []).some(z => { const r = z.getBoundingClientRect(); return mx !== null && mx > r.left - 140 && mx < r.right + 140 && my > r.top - 140 && my < r.bottom + 140; });
  function render() {
    const W = root.clientWidth, H = root.clientHeight;
    for (const t of tiles) {
      const x = mod(t.x + ox + t.w, t.W) - t.w, y = mod(t.y + oy + t.h, t.H) - t.h;
      if (x > W + 40 || y > H + 40) { t.el.style.visibility = 'hidden'; continue; }
      t.el.style.visibility = ''; t.el.style.transform = `translate3d(${x}px,${y}px,0)`;
    }
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
    if (moved < 6) { const t = e.target.closest && e.target.closest('.wall-tile'); if (t && opts.onOpen) opts.onOpen(t.dataset.id); }
  });
  root.addEventListener('wheel', e => { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) { e.preventDefault(); vx -= e.deltaX * .05; } }, {passive: false});
  new IntersectionObserver(([en]) => visible = en.isIntersecting).observe(root);
  loop();
};
