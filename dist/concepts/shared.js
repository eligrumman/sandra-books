'use strict';
// Shared helpers for the homepage concept prototypes.
window.C = (() => {
  const IMG = window.IMAGES.works, S = window.SITE;
  const best = ['angels', 'flute', 'skull', 'cosmic-face', 'night-faces', 'serpent', 'tree-tears', 'night-light', 'two-profiles', 'blue-current', 'embrace', 'star-voyage', 'stargaze', 'spiral', 'mosaic', 'blue-tree', 'red-forest', 'horse', 'alchemist', 'europa', 'stained', 'gaze', 'lilac-dance', 'mermaid', 'winter', 'lilac-gazes', 'forest-giants', 'smoke', 'petals', 'water-whisper', 'earth-profile', 'tree', 'threads', 'forest-moon', 'vortex', 'neuro', 'drawing', 'old-bridge', 'stone-dream', 'blue-horses'];
  const src = (id, want = 1600) => { const m = IMG[id]; const w = m.s.filter(x => x <= want).pop() || m.s[0]; return `../../assets/img/works/${id}-${w}.webp`; };
  const work = id => S.works.find(w => w.id === id);
  const title = id => work(id).t[0];
  const meta = id => { const w = work(id); return [S.text.he[w.m], w.s ? w.s + ' ס״מ' : '', w.y || ''].filter(Boolean).join(' · '); };
  const ratio = id => IMG[id].w / IMG[id].h;
  const color = id => IMG[id].c;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  return {best, src, title, meta, ratio, color, reduced, IMG};
})();
