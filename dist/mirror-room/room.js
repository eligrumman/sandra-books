// The mirror room: Sandra Leifer's body art worn by life-size figures (cut out of the real photos), between mirrors.
// A figure opens its photo in the body-art lightbox (assets/js/body-art.js). A figure of Sandra walks the room with a brush.
import * as THREE from 'three';
import {Reflector} from '../assets/vendor/Reflector.js';

const $ = id => document.getElementById(id);

/* ---------- language (same as the museum: ?lang=, then the site's remembered language, Hebrew by default) ---------- */
const T = {
  he: {back: '→ לגלריית הבודי־ארט', title: 'חדר<br>המראות', loading: 'מכינים את החדר…', enter: 'להיכנס לחדר',
    help: 'גררו כדי להסתכל מסביב · W A S D או החצים כדי ללכת · לחיצה על הרצפה מובילה לשם · לחיצה על דמות פותחת את התמונה',
    helpTouch: 'גררו כדי להסתכל מסביב · הקישו על הרצפה כדי ללכת · הקישו על דמות כדי לראות את התמונה',
    noGl: 'הדפדפן הזה לא מצליח להציג את החדר בתלת־ממד.', gallery: 'לגלריית הבודי־ארט', page: 'חדר המראות · סנדרה לייפר',
    alt: 'בודי־ארט מאת סנדרה לייפר', photo: (n, t) => `תמונה ${n} מתוך ${t}`, credit: n => `צילום: ${n}`, close: 'סגירה', prev: 'התמונה הקודמת', next: 'התמונה הבאה', dialog: 'גלריית תמונות'},
  ru: {back: '← К галерее боди-арта', title: 'Зеркальный<br>зал', loading: 'Готовим зал…', enter: 'Войти в зал',
    help: 'Тяните, чтобы осмотреться · W A S D или стрелки, чтобы идти · нажмите на пол, чтобы пройти туда · нажмите на фигуру, чтобы открыть фото',
    helpTouch: 'Тяните, чтобы осмотреться · коснитесь пола, чтобы пройти · коснитесь фигуры, чтобы открыть фото',
    noGl: 'Этот браузер не может показать зал в 3D.', gallery: 'К галерее боди-арта', page: 'Зеркальный зал · Сандра Лейфер',
    alt: 'Боди-арт, Сандра Лейфер', photo: (n, t) => `фото ${n} из ${t}`, credit: n => `Фото: ${n}`, close: 'Закрыть', prev: 'Предыдущее фото', next: 'Следующее фото', dialog: 'Галерея фотографий'},
  en: {back: '← Back to the body-art gallery', title: 'The mirror<br>room', loading: 'Preparing the room…', enter: 'Enter the room',
    help: 'Drag to look around · W A S D or the arrows to walk · click the floor to go there · click a figure to see its photo',
    helpTouch: 'Drag to look around · tap the floor to walk · tap a figure to see its photo',
    noGl: 'This browser cannot show the room in 3D.', gallery: 'Body-art gallery', page: 'The mirror room · Sandra Leifer',
    alt: 'Body art by Sandra Leifer', photo: (n, t) => `photo ${n} of ${t}`, credit: n => `Photo: ${n}`, close: 'Close', prev: 'Previous photo', next: 'Next photo', dialog: 'Photo gallery'}
};
const LANGS = ['he', 'ru', 'en'];
const store = {get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch {} }};
let lang = new URLSearchParams(location.search).get('lang') || store.get('sl-lang') || 'he'; if (!LANGS.includes(lang)) lang = 'he';
const t = k => T[lang][k];
const touch = matchMedia('(pointer:coarse)').matches;
const links = [...document.querySelectorAll('#mrList .ba-item a')];
const galleryHref = () => '../' + (lang === 'he' ? '' : lang + '/') + 'body-art/';
function applyLang() {
  const h = document.documentElement; h.lang = lang; h.dir = lang === 'he' ? 'rtl' : 'ltr';
  document.title = t('page');
  $('back').textContent = t('back'); $('back').href = galleryHref();
  $('ltitle').innerHTML = t('title'); $('lsub').textContent = t('loading'); $('enter').textContent = t('enter');
  $('hint').textContent = touch ? t('helpTouch') : t('help');
  $('fbText').textContent = t('noGl'); $('fbLink').textContent = t('gallery'); $('fbLink').href = galleryHref();
  links.forEach((a, i) => {
    const label = `${t('alt')}, ${t('photo')(i + 1, links.length)}`;
    a.querySelector('img').alt = label; a.setAttribute('aria-label', label);
    const c = a.parentNode.querySelector('.ba-credit'); if (c) c.textContent = t('credit')(c.dataset.credit);
  });
  $('baLb').setAttribute('aria-label', t('dialog')); $('baLbClose').setAttribute('aria-label', t('close'));
  $('baLbPrev').setAttribute('aria-label', t('prev')); $('baLbNext').setAttribute('aria-label', t('next'));
  document.querySelectorAll('[data-lang]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
  store.set('sl-lang', lang);
  const u = new URL(location.href); u.searchParams.set('lang', lang); history.replaceState(null, '', u);
}
document.querySelectorAll('[data-lang]').forEach(b => b.addEventListener('click', () => { lang = b.dataset.lang; applyLang(); }));
applyLang();

/* ---------- WebGL or a way out ---------- */
function webgl() { try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch { return false; } }
if (!webgl()) { $('fallback').hidden = false; $('loading').remove(); throw new Error('no WebGL'); }

/* ---------- quality: phones get one mirror, smaller textures, no real-time shadows ---------- */
const q = new URLSearchParams(location.search).get('q');
const low = q ? q === 'low' : (touch || Math.min(innerWidth, innerHeight) < 600);
const DPR = Math.min(low ? 1.5 : 2, devicePixelRatio || 1);

/* ---------- the room ---------- */
const RW = 10, RL = 16, RH = 4.2, X = RW / 2, Z = RL / 2, EYE = 1.6;
const renderer = new THREE.WebGLRenderer({antialias: !low, powerPreference: 'high-performance'});
renderer.setPixelRatio(DPR); renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.2;
if (!low) { renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.shadowMap.autoUpdate = false; }
document.body.prepend(renderer.domElement);
const scene = new THREE.Scene(); scene.background = new THREE.Color('#0b0a0a');
const fovFor = a => a < 1 ? Math.min(82, 62 + (1 - a) * 40) : 62; // a tall phone screen gets a wider view
const camera = new THREE.PerspectiveCamera(fovFor(innerWidth / innerHeight), innerWidth / innerHeight, .05, 120);
camera.rotation.order = 'YXZ';
let yaw = 0, pitch = -0.04;
camera.position.set(0, EYE, innerWidth < innerHeight ? Z - 2.4 : Z - .9);

scene.add(new THREE.HemisphereLight('#fff1e0', '#1a1613', 0.75));
const key = new THREE.DirectionalLight('#ffe9d2', 0.7); key.position.set(2, 6, 4); scene.add(key);

function canvasTex(w, h, draw, repeat) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 4;
  if (repeat) { tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.repeat.set(...repeat); }
  return tx;
}
const rnd = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
// polished dark concrete
const floorTex = canvasTex(1024, 1024, (g, w, h) => {
  g.fillStyle = '#2a2623'; g.fillRect(0, 0, w, h);
  for (let k = 0; k < 90; k++) { const x = rnd() * w, y = rnd() * h, r = 40 + rnd() * 160, gr = g.createRadialGradient(x, y, 0, x, y, r); const l = rnd() < .5 ? '0,0,0' : '255,240,225'; gr.addColorStop(0, `rgba(${l},${.035 + rnd() * .04})`); gr.addColorStop(1, `rgba(${l},0)`); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); }
  for (let k = 0; k < 9000; k++) { g.fillStyle = `rgba(${rnd() < .5 ? '0,0,0' : '255,255,255'},${rnd() * .05})`; g.fillRect(rnd() * w, rnd() * h, 1.5, 1.5); }
  g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = 2; g.strokeRect(0, 0, w, h);
}, [RW / 4, RL / 4]);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(RW, RL), new THREE.MeshStandardMaterial({map: floorTex, roughness: .42, metalness: 0}));
floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
// dark warm plaster
const plaster = canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = '#3a3430'; g.fillRect(0, 0, w, h);
  for (let k = 0; k < 6000; k++) { g.fillStyle = `rgba(${rnd() < .5 ? '0,0,0' : '255,240,225'},${rnd() * .045})`; g.fillRect(rnd() * w, rnd() * h, 2, 2); }
}, [4, 2]);
const wallMat = new THREE.MeshStandardMaterial({map: plaster, roughness: .95});
const black = new THREE.MeshStandardMaterial({color: '#0d0c0c', roughness: .6});
const brass = new THREE.MeshStandardMaterial({color: '#a8844f', roughness: .35, metalness: .85});
function box(w, h, d, mat, x, y, z, parent = scene) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); parent.add(m); return m; }
function plane(w, h, mat, x, y, z, ry = 0, parent = scene) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.position.set(x, y, z); m.rotation.y = ry; parent.add(m); return m; }
plane(RL, RH, wallMat, -X, RH / 2, 0, Math.PI / 2); plane(RL, RH, wallMat, X, RH / 2, 0, -Math.PI / 2);
const ceil = new THREE.Mesh(new THREE.PlaneGeometry(RW, RL), new THREE.MeshStandardMaterial({color: '#141212', roughness: 1})); ceil.rotation.x = Math.PI / 2; ceil.position.y = RH; scene.add(ceil);
// baseboards and a soft cove light along the walls, two light lines on the ceiling: in the mirrors they run on without end
for (const s of [-1, 1]) {
  box(.03, .12, RL, black, s * (X - .015), .06, 0);
  const cove = box(.02, .012, RL, new THREE.MeshBasicMaterial({color: '#ffcf9e'}), s * (X - .04), .125, 0);
  box(.24, .05, RL, black, s * 2.2, RH - .025, 0);
  box(.09, .02, RL, new THREE.MeshBasicMaterial({color: '#e9dccb'}), s * 2.2, RH - .06, 0);
  cove.material.toneMapped = false;
}
// end walls: a mirror in a thin brass frame (both ends on large screens, the far end on phones)
const MW = 8.2, MH = 3.5, MY = .25 + MH / 2;
function endWall(zw, facing) {
  const ry = facing > 0 ? 0 : Math.PI;
  for (const [w, h, x, y] of [[(RW - MW) / 2, RH, -(MW + RW / 2) / 2 * 1, RH / 2], [(RW - MW) / 2, RH, (MW + RW / 2) / 2, RH / 2], [MW, RH - MY - MH / 2, 0, (RH + MY + MH / 2) / 2], [MW, MY - MH / 2, 0, (MY - MH / 2) / 2]])
    plane(w, h, wallMat, x, y, zw, ry);
}
const mirrors = [];
const MirrorShader = {
  name: 'Mirror',
  uniforms: {color: {value: null}, tDiffuse: {value: null}, textureMatrix: {value: null}},
  vertexShader: `uniform mat4 textureMatrix; varying vec4 vUv; varying vec2 vPlane;
    #include <common>
    #include <logdepthbuf_pars_vertex>
    void main() { vUv = textureMatrix * vec4(position, 1.0); vPlane = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    #include <logdepthbuf_vertex>
    }`,
  fragmentShader: `uniform vec3 color; uniform sampler2D tDiffuse; varying vec4 vUv; varying vec2 vPlane;
    #include <logdepthbuf_pars_fragment>
    void main() {
      #include <logdepthbuf_fragment>
      vec3 base = texture2DProj(tDiffuse, vUv).rgb;
      float e = min(min(vPlane.x, 1.0 - vPlane.x) * 2.3, min(vPlane.y, 1.0 - vPlane.y));
      float edge = mix(0.78, 1.0, smoothstep(0.0, 0.06, e));
      gl_FragColor = vec4(base * color * edge, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`
};
let rendering = false; // one mirror at a time: a mirror seen in another shows its last frame, which makes the endless corridor
function mirror(zw, facing) {
  const aspect = innerWidth / innerHeight, long = low ? 768 : Math.min(1600, Math.round(Math.max(innerWidth, innerHeight) * DPR * .62));
  const tw = Math.round(aspect >= 1 ? long : long * aspect), th = Math.round(aspect >= 1 ? long / aspect : long);
  const m = new Reflector(new THREE.PlaneGeometry(MW, MH), {textureWidth: tw, textureHeight: th, clipBias: .003, color: '#d9dcdd', shader: MirrorShader, multisample: low ? 0 : 4});
  m.position.set(0, MY, zw + facing * .02); if (facing < 0) m.rotation.y = Math.PI;
  const own = m.onBeforeRender;
  m.onBeforeRender = function (...a) { if (rendering) return; rendering = true; own.apply(this, a); rendering = false; };
  scene.add(m); mirrors.push(m);
  // frame
  const f = .05, d = .06, z = zw + facing * .03;
  box(MW + 2 * f, f, d, brass, 0, MY + MH / 2 + f / 2, z); box(MW + 2 * f, f, d, brass, 0, MY - MH / 2 - f / 2, z);
  box(f, MH, d, brass, -MW / 2 - f / 2, MY, z); box(f, MH, d, brass, MW / 2 + f / 2, MY, z);
}
endWall(-Z, 1); mirror(-Z, 1);
endWall(Z, -1);
if (!low) mirror(Z, -1);
else plane(MW, MH, new THREE.MeshStandardMaterial({color: '#2b2623', roughness: .9}), 0, MY, Z - .01, Math.PI);

// a soft gradient sprite: light pools, contact shadows
const radial = (stops) => canvasTex(256, 256, (g, w, h) => { const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); stops.forEach(([o, c]) => r.addColorStop(o, c)); g.fillStyle = r; g.fillRect(0, 0, w, h); });
const poolTex = radial([[0, 'rgba(255,214,170,.55)'], [.45, 'rgba(255,200,150,.18)'], [1, 'rgba(255,200,150,0)']]);
const shadowTex = radial([[0, 'rgba(0,0,0,.75)'], [.55, 'rgba(0,0,0,.35)'], [1, 'rgba(0,0,0,0)']]);
const beamTex = canvasTex(64, 256, (g, w, h) => { const l = g.createLinearGradient(0, 0, 0, h); l.addColorStop(0, 'rgba(255,225,190,.0)'); l.addColorStop(.08, 'rgba(255,225,190,.5)'); l.addColorStop(1, 'rgba(255,225,190,0)'); g.fillStyle = l; g.fillRect(0, 0, w, h); });
function decal(tex, size, x, z, y = .004, additive = false, sx = 1) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size * sx, size), new THREE.MeshBasicMaterial({map: tex, transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending}));
  m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); scene.add(m); return m;
}
// a ceiling spot over each piece, with a faint beam of light under it
const lampGeo = new THREE.CylinderGeometry(.06, .08, .2, 16);
function spot(x, z, beamH, beamR) {
  const l = new THREE.Mesh(lampGeo, black); l.position.set(x, RH - .12, z); scene.add(l);
  const lens = new THREE.Mesh(new THREE.CircleGeometry(.055, 16), new THREE.MeshBasicMaterial({color: '#fff1dc'})); lens.rotation.x = Math.PI / 2; lens.position.set(x, RH - .221, z); scene.add(lens);
  if (beamH > 0) {
    const cone = new THREE.Mesh(new THREE.CylinderGeometry(.06, beamR, beamH, 24, 1, true), new THREE.MeshBasicMaterial({map: beamTex, transparent: true, opacity: low ? .05 : .065, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide}));
    cone.position.set(x, RH - .22 - beamH / 2, z); scene.add(cone);
  }
}

/* ---------- the figures: each photo's model cut out of its background, standing on a plinth at life size ---------- */
// h: the cutout's height in metres (life size, from the size of the head), eye: the eye line from the top (share of h).
// side: -1 left row (facing right), 1 right row (facing left), 0 the far centre (facing the entrance).
const FIG = [
  {id: '20', w: 1120, h: 1214, H: 1.1, eye: .24, x: 0, z: -6.3, side: 0},
  {id: '13', w: 635, h: 1542, H: 1.34, eye: .33, x: -3, z: -5.0, side: -1},
  {id: '19', w: 770, h: 1290, H: 1.12, eye: .22, x: 3, z: -3.9, side: 1},
  {id: '06', w: 1060, h: 1593, H: .5, eye: .30, x: -3, z: -2.8, side: -1},
  {id: '17', w: 1026, h: 1549, H: .72, eye: .285, x: 3, z: -1.7, side: 1},
  {id: '10', w: 1030, h: 1492, H: .67, eye: .24, x: -3, z: -.6, side: -1},
  {id: '15', w: 1061, h: 1498, H: .6, eye: .30, x: 3, z: .5, side: 1},
  {id: '14', w: 1061, h: 1593, H: .73, eye: .27, x: -3, z: 1.6, side: -1},
  {id: '01', w: 1260, h: 1503, H: .58, eye: .28, x: 3, z: 2.7, side: 1},
  {id: '03', w: 1061, h: 1539, H: .64, eye: .29, x: -3, z: 3.8, side: -1},
  {id: '11', w: 998, h: 1036, H: .75, eye: .42, x: 3, z: 4.9, side: 1},
  {id: '02', w: 946, h: 1017, H: .6, eye: .36, x: -3, z: 6.0, side: -1},
  {id: '09', w: 1477, h: 1065, H: .58, eye: .16, x: 3, z: -5.6, side: 1}
];
// photos whose cutout was not clean enough: framed on the side walls
const PANELS = [
  {id: '04', w: 912, h: 1600, x: -X, z: -1.7, side: -1},
  {id: '21', w: 1068, h: 1600, x: X, z: 3.8, side: 1},
  {id: '16', w: 1067, h: 1600, x: -X, z: 4.9, side: -1}
];
const linkOf = id => links.findIndex(a => a.parentNode.dataset.id === 'body-art-' + id);
const loader = new THREE.TextureLoader();
const pickable = [], pieces = [], obstacles = [];
const pedSide = canvasTex(64, 256, (g, w, h) => { const l = g.createLinearGradient(0, 0, 0, h); l.addColorStop(0, '#f1ebe2'); l.addColorStop(.35, '#bdb6ac'); l.addColorStop(1, '#5b5650'); g.fillStyle = l; g.fillRect(0, 0, w, h); });
const pedMats = [new THREE.MeshStandardMaterial({map: pedSide, roughness: .9}), new THREE.MeshStandardMaterial({color: '#f4eee6', roughness: .9}), black];
let loaded = 0, toLoad = FIG.length + PANELS.length;
function progress() { loaded++; $('bar').style.width = (loaded / toLoad * 100) + '%'; if (loaded >= Math.min(6, toLoad)) $('enter').hidden = false; }
function sampleColours(img) {
  // the most vivid colours of the photo, for Sandra's paint
  const c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d', {willReadFrequently: true}); g.drawImage(img, 0, 0, 32, 32);
  const d = g.getImageData(0, 0, 32, 32).data, out = [];
  for (let i = 0; i < d.length; i += 4) { if (d[i + 3] < 200) continue; const col = new THREE.Color(d[i] / 255, d[i + 1] / 255, d[i + 2] / 255), hsl = {}; col.getHSL(hsl); if (hsl.l > .18 && hsl.l < .82) out.push({hsl, s: hsl.s * (1 - Math.abs(hsl.l - .5))}); }
  out.sort((a, b) => b.s - a.s);
  const pick = [];
  for (const o of out) { if (pick.every(p => Math.abs(p.h - o.hsl.h) > .08)) pick.push(o.hsl); if (pick.length === 3) break; }
  return pick.length ? pick.map(h => new THREE.Color().setHSL(h.h, Math.min(1, h.s * 1.15), Math.min(.62, Math.max(.42, h.l)))) : [new THREE.Color('#c04a3a')];
}
const fadeIn = [];
function figure(f, n) {
  const w = f.H * f.w / f.h, ph = Math.max(.32, EYE - .02 - f.H * (1 - f.eye)); // plinth height: the eyes at a person's eye level
  const g = new THREE.Group(); g.position.set(f.x, 0, f.z); scene.add(g);
  const pr = Math.max(.22, Math.min(.42, w * .42)), ped = new THREE.Mesh(new THREE.CylinderGeometry(pr, pr * 1.04, ph, 40), pedMats);
  ped.position.y = ph / 2; ped.castShadow = ped.receiveShadow = !low; g.add(ped);
  decal(shadowTex, pr * 3.4, f.x, f.z, .003); decal(poolTex, 2.6, f.x, f.z, .005, true);
  spot(f.x, f.z, RH - .3 - ph - f.H * .2, Math.max(.5, pr * 1.6));
  const pivot = new THREE.Group(); pivot.position.y = ph + .004; g.add(pivot);
  const geo = new THREE.PlaneGeometry(w, f.H); geo.translate(0, f.H / 2, 0);
  const front = new THREE.MeshBasicMaterial({transparent: true, alphaTest: .02, opacity: 0, color: new THREE.Color(.94, .94, .94)});
  const backing = new THREE.MeshBasicMaterial({transparent: true, alphaTest: .02, opacity: 0, color: '#120f0e'});
  const face = new THREE.Mesh(geo, front); pivot.add(face);
  // a thin dark board behind the print gives the cutout an edge seen from the side, and a silhouette from behind
  for (const dz of [-.006, -.012]) { const e = new THREE.Mesh(geo, backing); e.position.z = dz; pivot.add(e); }
  const back = new THREE.Mesh(geo, backing); back.rotation.y = Math.PI; back.position.z = -.013; pivot.add(back);
  const depth = new THREE.MeshDepthMaterial({depthPacking: THREE.RGBADepthPacking, alphaTest: .5});
  face.castShadow = !low; face.customDepthMaterial = depth;
  const base = f.side === 0 ? 0 : f.side < 0 ? Math.PI / 2 : -Math.PI / 2;
  pivot.rotation.y = base;
  const piece = {kind: 'figure', f, link: linkOf(f.id), mesh: face, mat: front, pivot, base, yaw: base, colours: [new THREE.Color('#c96a4a')], top: ph + f.H * (1 - f.eye), pos: new THREE.Vector3(f.x, ph + f.H * .55, f.z)};
  face.userData.piece = piece; pickable.push(face); pieces.push(piece);
  obstacles.push({x: f.x, z: f.z, r: pr + .38});
  loader.load(`../assets/img/mirror-room/mr-${f.id}-${low ? 'lo' : 'hi'}.webp`, tx => {
    tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = low ? 2 : 8;
    front.map = backing.map = depth.map = tx; front.needsUpdate = backing.needsUpdate = depth.needsUpdate = true;
    piece.colours = sampleColours(tx.image); fadeIn.push({mats: [front, backing], t: 0}); progress();
  }, undefined, progress);
}
function panel(p) {
  // a framed print on the wall, lit from above
  const H = 1.25, W = H * p.w / p.h, g = new THREE.Group();
  g.position.set(p.x - p.side * .02, 1.72, p.z); g.rotation.y = p.side < 0 ? Math.PI / 2 : -Math.PI / 2; scene.add(g);
  box(W + .26, H + .26, .04, black, 0, 0, 0, g);
  plane(W + .18, H + .18, new THREE.MeshBasicMaterial({color: '#e9e3d9'}), 0, 0, .021, 0, g);
  const mat = new THREE.MeshBasicMaterial({color: '#222'}); const pic = plane(W, H, mat, 0, 0, .023, 0, g);
  const wash = plane(W * 3, 3.2, new THREE.MeshBasicMaterial({map: poolTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending}), 0, .45, -.015, 0, g);
  wash.renderOrder = -1;
  const piece = {kind: 'panel', f: p, link: linkOf(p.id), mesh: pic, mat, colours: [new THREE.Color('#d0a050')], pos: new THREE.Vector3(p.x - p.side * .3, 1.72, p.z)};
  pic.userData.piece = piece; pickable.push(pic); pieces.push(piece);
  loader.load(`../assets/img/body-art/body-art-${p.id}-${low ? 800 : 1600}.webp`, tx => {
    tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = low ? 2 : 8; mat.map = tx; mat.color.set(.95, .95, .95); mat.needsUpdate = true;
    piece.colours = sampleColours(tx.image); progress();
  }, undefined, progress);
}
// load the nearest pieces first
[...FIG].sort((a, b) => (b.z - a.z)).forEach(figure);
PANELS.forEach(panel);
// a long gallery bench in the middle
const benchMat = new THREE.MeshStandardMaterial({color: '#3e3128', roughness: .5});
box(.5, .07, 2.6, benchMat, 0, .44, -.4); for (const s of [-1, 1]) box(.42, .4, .06, black, 0, .2, -.4 + s * 1.1);
decal(shadowTex, 3.3, 0, -.4, .003, false, .32);
obstacles.push({box: [-.25 - .4, .25 + .4, -1.7 - .4, .9 + .4]});

/* ---------- Sandra: a stylised figure in a dark artist's outfit, a long brush in her right hand and a palette in her left ---------- */
const skin = new THREE.MeshStandardMaterial({color: '#cf9f84', roughness: .62});
const cloth = new THREE.MeshStandardMaterial({color: '#18161a', roughness: .82});
const trousers = new THREE.MeshStandardMaterial({color: '#232027', roughness: .85});
const shoe = new THREE.MeshStandardMaterial({color: '#0d0b0b', roughness: .4});
const hairMat = new THREE.MeshStandardMaterial({color: '#5c2419', roughness: .5});
const scarfMat = new THREE.MeshStandardMaterial({color: '#9b4a3c', roughness: .8, side: THREE.DoubleSide});
// a smooth tapered limb hanging down from its joint (lathe of a capsule-like profile)
function limb(len, r0, r1, mat, bulge = 0, parent) {
  const pts = [], N = 10;
  for (let i = 0; i <= N; i++) { const a = -Math.PI / 2 + i / N * Math.PI / 2; pts.push(new THREE.Vector2(r1 * Math.cos(a) + 1e-4, -len + r1 * Math.sin(a))); }
  for (let i = 1; i < 12; i++) { const s = i / 12; pts.push(new THREE.Vector2(r1 + (r0 - r1) * s + bulge * Math.sin(Math.PI * s), -len + len * s)); }
  for (let i = 0; i <= N; i++) { const a = i / N * Math.PI / 2; pts.push(new THREE.Vector2(r0 * Math.cos(a) + 1e-4, r0 * Math.sin(a))); }
  const m = new THREE.Mesh(new THREE.LatheGeometry(pts, 28), mat); m.castShadow = !low; if (parent) parent.add(m); return m;
}
function lathe(profile, mat, sz = 1, seg = 40) {
  const curve = new THREE.SplineCurve(profile.map(([r, y]) => new THREE.Vector2(r, y)));
  const pts = curve.getPoints(48).map(p => new THREE.Vector2(Math.max(1e-4, p.x), p.y));
  const m = new THREE.Mesh(new THREE.LatheGeometry(pts, seg), mat); m.scale.z = sz; m.castShadow = !low; return m;
}
function ellipsoid(rx, ry, rz, mat) { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 24), mat); m.scale.set(rx, ry, rz); m.castShadow = !low; return m; }
const joint = (parent, x, y, z) => { const j = new THREE.Group(); j.position.set(x, y, z); parent.add(j); return j; };

const sandra = new THREE.Group(); scene.add(sandra);
const hips = joint(sandra, 0, .9, 0);
const pelvis = lathe([[0, -.13], [.1, -.115], [.165, -.05], [.172, .02], [.15, .09], [.128, .15]], trousers, .7); hips.add(pelvis);
const spine = joint(hips, 0, .13, 0);
const torso = lathe([[.128, 0], [.123, .06], [.138, .15], [.152, .23], [.156, .3], [.148, .36], [.105, .41], [.05, .43], [0, .435]], cloth, .66); spine.add(torso);
const bust = ellipsoid(.135, .07, .06, cloth); bust.position.set(0, .225, .035); spine.add(bust);
// a long dark smock over the trousers, flaring a little below the waist
const smock = lathe([[.128, .14], [.13, .06], [.15, -.04], [.18, -.16], [.205, -.28], [.215, -.33]], new THREE.MeshStandardMaterial({color: '#1d1a1f', roughness: .85, side: THREE.DoubleSide}), .78); hips.add(smock);
const neck = limb(.09, .042, .046, skin, 0, null); neck.position.y = .5; spine.add(neck); neck.rotation.x = Math.PI; // pointing up
const headJ = joint(spine, 0, .5, .005);
const head = ellipsoid(.088, .112, .1, skin); head.position.y = .1; headJ.add(head);
const jaw = ellipsoid(.07, .06, .075, skin); jaw.position.set(0, .045, .022); headJ.add(jaw);
// a mannequin's face: a nose, a soft brow and lips, no one's likeness
const nose = ellipsoid(.014, .028, .02, skin); nose.position.set(0, .088, .097); nose.rotation.x = -.25; headJ.add(nose);
const brow = ellipsoid(.07, .016, .03, skin); brow.position.set(0, .125, .078); headJ.add(brow);
const lips = ellipsoid(.024, .008, .01, new THREE.MeshStandardMaterial({color: '#9c5a4e', roughness: .5})); lips.position.set(0, .05, .09); headJ.add(lips);
// long auburn hair: a cap, a fall down the back and two locks beside the face
// strands: fine vertical streaks in the hair's colour
const hairTex = canvasTex(256, 64, (g, w, h) => { g.fillStyle = '#5e2619'; g.fillRect(0, 0, w, h); for (let i = 0; i < 700; i++) { const x = rnd() * w, l = rnd(); g.fillStyle = l < .5 ? `rgba(40,10,6,${.25 + rnd() * .35})` : `rgba(150,70,44,${.15 + rnd() * .3})`; g.fillRect(x, 0, .8 + rnd() * 1.4, h); } });
hairMat.map = hairTex; hairMat.color.set('#ffffff'); hairMat.side = THREE.DoubleSide; hairMat.roughness = .55;
const cap = new THREE.Mesh(new THREE.SphereGeometry(1, 36, 18, 0, Math.PI * 2, 0, 1.3), hairMat);
cap.scale.set(.097, .12, .108); cap.position.set(0, .102, -.006); cap.rotation.x = -.32; cap.castShadow = !low; headJ.add(cap);
// the long fall of hair: a shell round the sides and back of the head, open at the face, down past the shoulders
const hairPts = [[.001, .225], [.05, .215], [.088, .19], [.106, .15], [.112, .1], [.108, .05], [.103, .0], [.106, -.05], [.118, -.11], [.13, -.18], [.13, -.25], [.11, -.3], [.085, -.315]].map(([r, y]) => new THREE.Vector2(r, y));
const fall = new THREE.Mesh(new THREE.LatheGeometry(hairPts, 40, .78, Math.PI * 2 - 1.56), hairMat);
fall.scale.set(1, 1, .92); fall.position.set(0, 0, -.012); fall.castShadow = !low; headJ.add(fall);
// a scarf around the neck with one end hanging down the front
const wrap = new THREE.Mesh(new THREE.TorusGeometry(.068, .026, 12, 28), scarfMat); wrap.rotation.x = Math.PI / 2 + .25; wrap.position.set(0, .43, .01); wrap.scale.set(1, 1.12, 1); spine.add(wrap);
const tailJ = joint(spine, .05, .41, .07); const tail = box(.075, .36, .012, scarfMat, 0, -.18, 0, tailJ); tail.castShadow = !low;
function leg(s) {
  const hip = joint(hips, s * .088, -.03, 0);
  limb(.42, .078, .056, trousers, .012, hip);
  const knee = joint(hip, 0, -.42, 0); limb(.4, .056, .04, trousers, .01, knee);
  const ankle = joint(knee, 0, -.4, 0);
  const foot = ellipsoid(.045, .035, .12, shoe); foot.position.set(0, -.035, .055); ankle.add(foot);
  return {hip, knee, ankle};
}
function arm(s) {
  const sh = joint(spine, s * .175, .36, -.005);
  const delt = ellipsoid(.044, .05, .046, cloth); sh.add(delt);
  limb(.28, .046, .036, cloth, .006, sh);
  const elbow = joint(sh, 0, -.28, 0); limb(.24, .036, .028, cloth, .004, elbow);
  const wrist = joint(elbow, 0, -.245, 0);
  const hand = ellipsoid(.03, .075, .045, skin); hand.position.y = -.06; wrist.add(hand);
  const thumb = ellipsoid(.012, .03, .012, skin); thumb.position.set(-s * .028, -.04, .02); thumb.rotation.z = s * .5; wrist.add(thumb);
  return {sh, elbow, wrist, hand};
}
const L = {leg: leg(1), arm: arm(1)}, R = {leg: leg(-1), arm: arm(-1)};
// the brush: a long dark handle, a brass ferrule and a tip loaded with paint
const brush = new THREE.Group(); brush.position.set(0, -.07, .012); brush.rotation.x = Math.PI / 2 - .15; R.arm.wrist.add(brush);
const handle = new THREE.Mesh(new THREE.CylinderGeometry(.0055, .0035, .34, 10), new THREE.MeshStandardMaterial({color: '#3a2618', roughness: .4})); handle.position.y = .05; brush.add(handle);
const ferrule = new THREE.Mesh(new THREE.CylinderGeometry(.0058, .0052, .04, 10), brass); ferrule.position.y = .24; brush.add(ferrule);
const tipMat = new THREE.MeshStandardMaterial({color: '#c04a3a', roughness: .5});
const tip = new THREE.Mesh(new THREE.ConeGeometry(.0065, .045, 10), tipMat); tip.position.y = .282; brush.add(tip);
const tipEnd = new THREE.Object3D(); tipEnd.position.y = .305; brush.add(tipEnd);
// a palette in the left hand
const palette = new THREE.Group(); palette.position.set(.02, -.075, .03); palette.rotation.set(-1.2, 0, .3); L.arm.wrist.add(palette);
const pal = new THREE.Mesh(new THREE.CylinderGeometry(.13, .13, .008, 32), new THREE.MeshStandardMaterial({color: '#b88c5e', roughness: .5})); pal.scale.set(1, 1, .72); pal.position.z = .06; palette.add(pal);
const dabs = [];
for (let i = 0; i < 6; i++) { const a = -1 + i * .5, d = new THREE.Mesh(new THREE.SphereGeometry(.016, 10, 6), new THREE.MeshStandardMaterial({color: '#fff', roughness: .3})); d.scale.y = .35; d.position.set(Math.cos(a) * .09, .006, .06 + Math.sin(a) * .065); palette.add(d); dabs.push(d); }
// soft shadow under her, and a light that follows her
const sShadow = decal(shadowTex, .9, 0, 0, .006);
const follow = new THREE.SpotLight('#ffe8cf', low ? 9 : 14, 9, .42, .85, 1.4);
follow.position.set(0, RH - .2, 0); scene.add(follow); scene.add(follow.target);
if (!low) { follow.castShadow = true; follow.shadow.mapSize.set(1024, 1024); follow.shadow.radius = 4; follow.shadow.bias = -.0005; follow.shadow.camera.near = .5; follow.shadow.camera.far = 7; }

// her walk: a loop around the bench, between the rows; she stops at some pieces to paint
const path = new THREE.CatmullRomCurve3([
  [1.35, 5.2], [1.45, 2.2], [1.4, -.4], [1.45, -3.0], [1.15, -4.7], [0, -5.15], [-1.15, -4.7], [-1.45, -3.0], [-1.4, -.4], [-1.45, 2.2], [-1.35, 5.2], [0, 5.75]
].map(([x, z]) => new THREE.Vector3(x, 0, z)), true, 'centripetal');
const LEN = path.getLength();
const stops = [];
for (const p of pieces) {
  // the nearest point of the loop to each piece; she paints at about every other one
  let best = 0, bd = 1e9;
  for (let i = 0; i < 400; i++) { const u = i / 400, q2 = path.getPointAt(u), d = (q2.x - p.pos.x) ** 2 + (q2.z - p.pos.z) ** 2; if (d < bd) { bd = d; best = u; } }
  if (bd < 4.5) stops.push({u: best, piece: p});
}
stops.sort((a, b) => a.u - b.u);
const paintAt = stops.filter((s, i) => i % 2 === 0);
const S = {u: .55, phase: 0, mode: 'walk', t: 0, yaw: 0, target: null, colour: new THREE.Color('#c04a3a'), next: 0, done: new Set(), wait: 0, speed: 0};
function at(u) { return path.getPointAt(((u % 1) + 1) % 1); }

/* ---------- paint: a ribbon that follows the brush tip and fades, and a few drops ---------- */
const TRAIL = 70, trail = [], drops = [];
const tGeo = new THREE.BufferGeometry();
const tPos = new Float32Array(TRAIL * 2 * 3), tCol = new Float32Array(TRAIL * 2 * 4), tIdx = [];
for (let i = 0; i < TRAIL - 1; i++) { const a = i * 2; tIdx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
tGeo.setAttribute('position', new THREE.BufferAttribute(tPos, 3).setUsage(THREE.DynamicDrawUsage));
tGeo.setAttribute('color', new THREE.BufferAttribute(tCol, 4).setUsage(THREE.DynamicDrawUsage));
tGeo.setIndex(tIdx);
const ribbon = new THREE.Mesh(tGeo, new THREE.MeshBasicMaterial({vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide}));
ribbon.frustumCulled = false; scene.add(ribbon);
const dGeo = new THREE.BufferGeometry(), DMAX = 60, dPos = new Float32Array(DMAX * 3), dCol = new Float32Array(DMAX * 4);
dGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3).setUsage(THREE.DynamicDrawUsage));
dGeo.setAttribute('color', new THREE.BufferAttribute(dCol, 4).setUsage(THREE.DynamicDrawUsage));
const dropPts = new THREE.Points(dGeo, new THREE.PointsMaterial({size: .022, vertexColors: true, transparent: true, depthWrite: false}));
dropPts.frustumCulled = false; scene.add(dropPts);
const tipW = new THREE.Vector3(), tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();
function updatePaint(now, dt, painting) {
  tipEnd.getWorldPosition(tipW);
  if (painting && (!trail.length || trail[trail.length - 1].p.distanceTo(tipW) > .012)) {
    trail.push({p: tipW.clone(), t: now, c: S.colour.clone()}); if (trail.length > TRAIL) trail.shift();
    if (Math.random() < .12 && drops.length < DMAX) drops.push({p: tipW.clone(), v: new THREE.Vector3((Math.random() - .5) * .3, .1, (Math.random() - .5) * .3), t: now, c: S.colour.clone()});
  }
  while (trail.length && now - trail[0].t > 2.6) trail.shift();
  const n = trail.length;
  for (let i = 0; i < TRAIL; i++) {
    const a = i * 6, b = i * 8;
    if (i >= n) { const l = n ? trail[n - 1].p : tipW; for (const o of [0, 3]) { tPos[a + o] = l.x; tPos[a + o + 1] = l.y; tPos[a + o + 2] = l.z; } tCol.fill(0, b, b + 8); continue; }
    const s = trail[i], prev = trail[Math.max(0, i - 1)].p, next = trail[Math.min(n - 1, i + 1)].p;
    tmp.subVectors(next, prev); tmp2.subVectors(camera.position, s.p); tmp.cross(tmp2).normalize();
    const age = (now - s.t) / 2.6, w = .016 * (1 - age * .6) * Math.min(1, (i + 1) / 4);
    tPos[a] = s.p.x + tmp.x * w; tPos[a + 1] = s.p.y + tmp.y * w; tPos[a + 2] = s.p.z + tmp.z * w;
    tPos[a + 3] = s.p.x - tmp.x * w; tPos[a + 4] = s.p.y - tmp.y * w; tPos[a + 5] = s.p.z - tmp.z * w;
    const al = Math.max(0, 1 - age) ** 1.5 * .95;
    for (const o of [0, 4]) { tCol[b + o] = s.c.r; tCol[b + o + 1] = s.c.g; tCol[b + o + 2] = s.c.b; tCol[b + o + 3] = al; }
  }
  tGeo.attributes.position.needsUpdate = tGeo.attributes.color.needsUpdate = true;
  for (let i = drops.length - 1; i >= 0; i--) { const d = drops[i]; d.v.y -= 9.8 * dt; d.p.addScaledVector(d.v, dt); if (d.p.y < .01 || now - d.t > 1.5) drops.splice(i, 1); }
  for (let i = 0; i < DMAX; i++) {
    const d = drops[i];
    if (!d) { dCol[i * 4 + 3] = 0; continue; }
    dPos.set([d.p.x, d.p.y, d.p.z], i * 3); dCol.set([d.c.r, d.c.g, d.c.b, .9], i * 4);
  }
  dGeo.attributes.position.needsUpdate = dGeo.attributes.color.needsUpdate = true;
}

/* ---------- her animation ---------- */
const STRIDE = 1.25, SPEED = .72;
const ang = a => Math.atan2(Math.sin(a), Math.cos(a));
const toward = (a, b, k) => a + ang(b - a) * Math.min(1, k);
function pose(dt, now) {
  const walking = S.mode === 'walk' && S.speed > .05, ph = S.phase, s = Math.sin(ph), c = Math.cos(ph), amp = Math.min(1, S.speed / SPEED);
  // legs: the thigh swings, the knee bends in the swing, the foot stays near level
  for (const [side, off] of [[L, 0], [R, Math.PI]]) {
    const sp = Math.sin(ph + off), cp = Math.cos(ph + off);
    const hip = -.42 * sp * amp, knee = (.06 + .78 * Math.max(0, cp) ** 2 * (sp > -.2 ? 1 : .6)) * amp + (1 - amp) * .03;
    side.leg.hip.rotation.x = hip; side.leg.knee.rotation.x = knee; side.leg.ankle.rotation.x = -(hip + knee) * .75 + .18 * Math.max(0, sp) * amp;
    side.leg.hip.rotation.z = 0;
  }
  hips.position.y = .9 - .012 * amp + .016 * Math.cos(2 * ph) * amp + (1 - amp) * .004 * Math.sin(now * 1.6);
  hips.position.x = .012 * s * amp; hips.rotation.y = .07 * s * amp; hips.rotation.z = .03 * s * amp;
  spine.rotation.y = -.11 * s * amp; spine.rotation.x = .035 * amp + (1 - amp) * .012 * Math.sin(now * 1.1); spine.rotation.z = -.02 * s * amp;
  headJ.rotation.y = .04 * s * amp; headJ.rotation.x = -.05;
  tailJ.rotation.x = -.15 - .08 * Math.abs(c) * amp; tailJ.rotation.z = .05 * s * amp;
  fall.rotation.x = .05 + .04 * Math.abs(c) * amp;
  // left arm holds the palette at her waist; it swings a little as she walks
  L.arm.sh.rotation.set(-.15 + .1 * s * amp, 0, .12); L.arm.elbow.rotation.set(-1.25, 0, 0); L.arm.wrist.rotation.set(.1, 0, 0);
  const painting = S.mode === 'paint';
  if (painting) {
    // painting strokes towards the piece
    const k = S.t * 2.2, j = S.t * 1.35;
    R.arm.sh.rotation.set(-.95 + .24 * Math.sin(k), .25 * Math.sin(j), -.25 + .18 * Math.sin(j + 1));
    R.arm.elbow.rotation.set(-.85 + .3 * Math.sin(k + 1.2), 0, 0); R.arm.wrist.rotation.set(-.2 + .25 * Math.sin(k + .6), 0, .2 * Math.sin(j));
    spine.rotation.x = .07; spine.rotation.y = -.12; headJ.rotation.y = -.05; headJ.rotation.x = .03;
    // keep the brush pointing at the work, a little upwards
    brushAim += (-(R.arm.sh.rotation.x + R.arm.elbow.rotation.x + R.arm.wrist.rotation.x) - .25 - brushAim) * Math.min(1, dt * 6);
  } else {
    const lift = S.mode === 'turn' ? .5 : 0;
    brushAim += (0 - brushAim) * Math.min(1, dt * 6);
    R.arm.sh.rotation.set(.32 * s * amp - .05 - lift, 0, -.1); R.arm.elbow.rotation.set(-.32 - .12 * Math.max(0, -s) * amp - lift * .6, 0, 0); R.arm.wrist.rotation.set(0, 0, 0);
  }
  brush.rotation.x = Math.PI / 2 - .15 + brushAim;
  return painting;
}
let brushAim = 0;
const toCam = new THREE.Vector3();
function walkSandra(dt, now) {
  const here = at(S.u);
  if (S.mode === 'walk') {
    // she waits when you stand in her way
    const ahead = at(S.u + .6 / LEN); toCam.set(camera.position.x - here.x, 0, camera.position.z - here.z);
    const dir = tmp.set(ahead.x - here.x, 0, ahead.z - here.z).normalize(), blocked = toCam.length() < 1.15 && toCam.normalize().dot(dir) > .2;
    S.speed += ((blocked ? 0 : SPEED) - S.speed) * Math.min(1, dt * 3);
    S.u = (S.u + S.speed * dt / LEN) % 1; S.phase += S.speed * dt / STRIDE * Math.PI * 2;
    S.yaw = toward(S.yaw, Math.atan2(dir.x, dir.z), dt * 5);
    const st = paintAt.find(p => !S.done.has(p) && Math.abs(ang((S.u - p.u) * Math.PI * 2)) < .004 * Math.PI * 2);
    if (st && !blocked) { S.mode = 'turn'; S.t = 0; S.target = st; S.colour.copy(st.piece.colours[Math.floor(Math.random() * st.piece.colours.length)]); tipMat.color.copy(S.colour); }
    if (S.u < .01) S.done.clear();
  } else {
    S.speed = Math.max(0, S.speed - dt * 2.5); S.phase += S.speed * dt / STRIDE * Math.PI * 2; S.t += dt;
    const p = S.target.piece.pos, face = Math.atan2(p.x - here.x, p.z - here.z);
    if (S.mode === 'turn') { S.yaw = toward(S.yaw, face, dt * 3); if (S.t > .9) { S.mode = 'paint'; S.t = 0; } }
    else if (S.mode === 'paint') { S.yaw = toward(S.yaw, face, dt * 3); if (S.t > 4.2) { S.mode = 'back'; S.t = 0; } }
    else if (S.mode === 'back') { const ahead = at(S.u + .6 / LEN); S.yaw = toward(S.yaw, Math.atan2(ahead.x - here.x, ahead.z - here.z), dt * 4); if (S.t > .7) { S.done.add(S.target); S.mode = 'walk'; } }
    if (S.mode === 'paint') dabs.forEach((d, i) => d.material.color.copy(S.target.piece.colours[i % S.target.piece.colours.length]));
  }
  sandra.position.set(here.x, 0, here.z); sandra.rotation.y = S.yaw;
  sShadow.position.set(here.x, .006, here.z);
  follow.position.set(here.x + .4, RH - .2, here.z + .9); follow.target.position.set(here.x, 1.0, here.z);
  return pose(dt, now);
}

/* ---------- moving around: drag to look, keys or a click on the floor to walk ---------- */
const keys = {};
const lb = $('baLb');
addEventListener('keydown', e => { if (lb.open) return; keys[e.key.toLowerCase()] = true; if (e.key.startsWith('Arrow')) e.preventDefault(); glide = null; });
addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
const cv = renderer.domElement; let drag = null, moved = 0, glide = null;
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
function hitAt(x, y) {
  ndc.set(x / innerWidth * 2 - 1, -(y / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
  const hits = ray.intersectObjects([...pickable, floor], false);
  for (const h of hits) {
    if (h.object === floor) return {floor: h.point};
    const p = h.object.userData.piece;
    if (p.kind === 'panel' || alphaAt(p, h.uv) > .3) return {piece: p};
  }
  return null;
}
// only the opaque part of a cutout counts as the figure
const alphaCache = new Map();
function alphaAt(p, uv) {
  const img = p.mat.map && p.mat.map.image; if (!img || !uv) return 1;
  let a = alphaCache.get(p);
  if (!a) { const c = document.createElement('canvas'); c.width = 64; c.height = Math.max(8, Math.round(64 * img.height / img.width)); const g = c.getContext('2d', {willReadFrequently: true}); g.drawImage(img, 0, 0, c.width, c.height); a = {w: c.width, h: c.height, d: g.getImageData(0, 0, c.width, c.height).data}; alphaCache.set(p, a); }
  const x = Math.min(a.w - 1, Math.floor(uv.x * a.w)), y = Math.min(a.h - 1, Math.floor((1 - uv.y) * a.h));
  return a.d[(y * a.w + x) * 4 + 3] / 255;
}
function open(p) { if (p.link < 0) return; glide = null; hideHint(); links[p.link].click(); }
cv.addEventListener('pointerdown', e => { drag = {x: e.clientX, y: e.clientY}; moved = 0; cv.setPointerCapture(e.pointerId); });
cv.addEventListener('pointermove', e => {
  if (drag) {
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y; moved += Math.abs(dx) + Math.abs(dy);
    if (moved > 4) { cv.classList.add('drag'); yaw += dx * .0042; pitch = Math.max(-.7, Math.min(.6, pitch + dy * .0032)); hideHint(); }
    drag = {x: e.clientX, y: e.clientY}; return;
  }
  if (e.pointerType === 'mouse') hoverAt = {x: e.clientX, y: e.clientY};
});
cv.addEventListener('pointerup', e => {
  cv.classList.remove('drag'); const wasDrag = moved >= 6; drag = null; if (wasDrag) return;
  const h = hitAt(e.clientX, e.clientY); if (!h) return;
  if (h.piece) open(h.piece);
  else { const p = h.floor; glide = {x: Math.max(-X + .5, Math.min(X - .5, p.x)), z: Math.max(-Z + .6, Math.min(Z - .6, p.z))}; marker.position.set(glide.x, .01, glide.z); marker.material.opacity = .9; hideHint(); }
});
cv.addEventListener('pointercancel', () => { drag = null; cv.classList.remove('drag'); });
cv.addEventListener('pointerleave', () => { hoverAt = null; });
let hoverAt = null, hovered = null;
const marker = new THREE.Mesh(new THREE.RingGeometry(.16, .2, 40), new THREE.MeshBasicMaterial({color: '#f3eee5', transparent: true, opacity: 0, depthWrite: false}));
marker.rotation.x = -Math.PI / 2; scene.add(marker);
function hover() {
  const h = hoverAt ? hitAt(hoverAt.x, hoverAt.y) : null, p = h && h.piece || null;
  if (p !== hovered) {
    if (hovered) hovered.mat.color.setScalar(hovered.kind === 'panel' ? .95 : .94);
    hovered = p; if (p) p.mat.color.setScalar(1.18);
    cv.classList.toggle('over', !!p);
  }
}
// walls, plinths, the bench and Sandra herself
function collide(p) {
  p.x = Math.max(-X + .45, Math.min(X - .45, p.x)); p.z = Math.max(-Z + .55, Math.min(Z - .55, p.z));
  const sandraOb = {x: sandra.position.x, z: sandra.position.z, r: .55};
  for (const o of [...obstacles, sandraOb]) {
    if (o.box) {
      const [x0, x1, z0, z1] = o.box;
      if (p.x > x0 && p.x < x1 && p.z > z0 && p.z < z1) { const d = [p.x - x0, x1 - p.x, p.z - z0, z1 - p.z], m = Math.min(...d), i = d.indexOf(m); if (i === 0) p.x = x0; else if (i === 1) p.x = x1; else if (i === 2) p.z = z0; else p.z = z1; }
      continue;
    }
    const dx = p.x - o.x, dz = p.z - o.z, d = Math.hypot(dx, dz);
    if (d < o.r) { const k = o.r / Math.max(d, 1e-4); p.x = o.x + dx * k; p.z = o.z + dz * k; }
  }
}

/* ---------- the hint ---------- */
let hintTimer = 0;
function showHint() { $('hint').classList.remove('hide'); clearTimeout(hintTimer); hintTimer = setTimeout(hideHint, 9000); }
function hideHint() { $('hint').classList.add('hide'); }

/* ---------- each frame ---------- */
const clock = new THREE.Clock(), fwd = new THREE.Vector3(), side = new THREE.Vector3();
let frames = 0, last = 0;
function tick() {
  requestAnimationFrame(tick);
  const raw = clock.getDelta(), dt = Math.min(.05, raw), sim = Math.min(.25, raw), now = clock.elapsedTime;
  if (lb.open) { clock.getDelta(); return; } // the photo is open: let the room rest
  frames++;
  const mv = (keys.w || keys.arrowup ? 1 : 0) - (keys.s || keys.arrowdown ? 1 : 0), st = (keys.d ? 1 : 0) - (keys.a ? 1 : 0);
  if (keys.arrowleft) yaw += 1.8 * dt; if (keys.arrowright) yaw -= 1.8 * dt;
  fwd.set(-Math.sin(yaw), 0, -Math.cos(yaw)); side.set(Math.cos(yaw), 0, -Math.sin(yaw));
  const before = camera.position.clone();
  if (mv || st) { camera.position.addScaledVector(fwd, mv * 2.6 * dt).addScaledVector(side, st * 2.2 * dt); hideHint(); }
  else if (glide) {
    const dx = glide.x - camera.position.x, dz = glide.z - camera.position.z, d = Math.hypot(dx, dz);
    if (d < .05) glide = null; else { const k = Math.min(d, Math.max(.6, Math.min(2.4, d * 1.6)) * dt) / d; camera.position.x += dx * k; camera.position.z += dz * k; }
  }
  collide(camera.position);
  if (glide && camera.position.distanceTo(before) < 1e-4) glide = null; // blocked
  marker.material.opacity = glide ? .9 : Math.max(0, marker.material.opacity - dt * 2);
  camera.position.y = EYE; camera.rotation.set(pitch, yaw, 0);
  // the figures turn a little towards you (never more than 55° from where they stand)
  for (const p of pieces) {
    if (p.kind !== 'figure') continue;
    const want = Math.atan2(camera.position.x - p.f.x, camera.position.z - p.f.z);
    const d = Math.max(-.95, Math.min(.95, ang(want - p.base)));
    p.yaw = toward(p.yaw, p.base + d, dt * 2.2); p.pivot.rotation.y = p.yaw;
  }
  for (let i = fadeIn.length - 1; i >= 0; i--) { const f = fadeIn[i]; f.t += dt * 1.5; f.mats.forEach(m => { m.opacity = Math.min(1, f.t); }); if (f.t >= 1) fadeIn.splice(i, 1); }
  const painting = walkSandra(sim, now);
  updatePaint(now, sim, painting);
  if (!touch && frames % 2 === 0) hover();
  if (renderer.shadowMap.enabled) renderer.shadowMap.needsUpdate = true;
  renderer.render(scene, camera);
}
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.fov = fovFor(camera.aspect); camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight);
  const aspect = camera.aspect, long = low ? 768 : Math.min(1600, Math.round(Math.max(innerWidth, innerHeight) * DPR * .62));
  for (const m of mirrors) m.getRenderTarget().setSize(Math.round(aspect >= 1 ? long : long * aspect), Math.round(aspect >= 1 ? long / aspect : long));
});
$('enter').onclick = () => { const l = $('loading'); l.style.opacity = 0; l.style.pointerEvents = 'none'; setTimeout(() => l.remove(), 800); showHint(); };
tick();

// a small hook for automated checks: where a piece is on screen, opening it, where Sandra is, a frame counter
window.__mirrorRoom = {
  pieces: () => pieces.map(p => p.f.id),
  screenOf(i) { const p = pieces[i], v = p.pos.clone().project(camera); return {x: (v.x + 1) / 2 * innerWidth, y: (1 - v.y) / 2 * innerHeight, visible: v.z < 1 && Math.abs(v.x) < 1 && Math.abs(v.y) < 1}; },
  place(x, z, lx, ly, lz) { camera.position.set(x, EYE, z); yaw = Math.atan2(-(lx - x), -(lz - z)); pitch = Math.atan2(ly - EYE, Math.hypot(lx - x, lz - z)); },
  at(u) { S.u = u; },
  look(x, z) { yaw = Math.atan2(-(x - camera.position.x), -(z - camera.position.z)); pitch = 0; },
  sandra: () => ({x: sandra.position.x, z: sandra.position.z, mode: S.mode}),
  frames: () => frames, low, loaded: () => loaded, total: toLoad
};
