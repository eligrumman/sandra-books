'use strict';
// Shared helpers for the homepage concept prototypes.
window.C = (() => {
  const IMG = window.IMAGES.works, S = window.SITE;
  const best = ['night-faces','horse','embrace','stargaze','europa','red-forest','spiral','mermaid','alchemist','gaze','lilac-dance','star-voyage','stained','forest-giants','winter','blue-horses','water-whisper','petals','mosaic','lilac-gazes','smoke','earth-profile','tree','forest-moon','old-bridge','vortex','threads','blue-tree','stone-dream','drawing','neuro'];
  const src = (id, want = 1600) => { const m = IMG[id]; const w = m.s.filter(x => x <= want).pop() || m.s[0]; return `../../assets/img/works/${id}-${w}.webp`; };
  const work = id => S.works.find(w => w.id === id);
  const title = id => work(id).t[0];
  const meta = id => { const w = work(id); return [S.text.he[w.m], w.s ? w.s + ' ס״מ' : '', w.y || ''].filter(Boolean).join(' · '); };
  const ratio = id => IMG[id].w / IMG[id].h;
  const color = id => IMG[id].c;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  return {best, src, title, meta, ratio, color, reduced, IMG};
})();
