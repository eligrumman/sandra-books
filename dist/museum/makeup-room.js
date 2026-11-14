// The mirror room, the museum's fourth room: a white backstage makeup room. Vanity mirrors framed with bulbs
// along both long walls; in front of each, in a makeup chair, a figure wearing Sandra Leifer's body art
// (cut out of the real photo). From the aisle you see them from behind; their faces are in the mirrors.
// Built into the museum scene (museum/index.html), so the same walk, joystick, card, tour and zoom apply.
import * as THREE from 'three';
import {Reflector} from '../assets/vendor/Reflector.js';

// The figures. h/w: the cutout's pixels, H: its height in metres at life size (from the size of the head),
// eye: the eye line from the top (share of H). link: the catalog work this shoot is (it opens the catalog
// image and its card shows the catalog title); without one the figure opens its own body-art photo.
// side 1 = the right-hand wall as you come in, -1 = the left; listed in walking order (down the right, back up the left).
export const FIG = [
  {id: '06', link: 'work-chromatic-reverie', w: 1060, h: 1593, H: .5, eye: .30, side: 1},
  {id: '02', w: 946, h: 1017, H: .6, eye: .36, side: 1},
  {id: '10', w: 1030, h: 1492, H: .67, eye: .24, side: 1},
  {id: '14', link: 'work-gaze', w: 1061, h: 1593, H: .73, eye: .27, side: 1},
  {id: '19', w: 770, h: 1290, H: 1.12, eye: .22, side: 1},
  {id: '11', w: 998, h: 1036, H: .75, eye: .42, side: 1, credit: 'Susanna'},
  {id: '20', w: 1120, h: 1214, H: 1.1, eye: .24, side: -1},
  {id: '09', w: 1477, h: 1065, H: .58, eye: .16, side: -1},
  {id: null, side: -1}, // an empty seat: body-art-13 is the 2025 contest photo, and contest and event photos stay out of this room
  {id: '03', w: 1061, h: 1539, H: .64, eye: .29, side: -1},
  {id: '17', w: 1026, h: 1549, H: .72, eye: .285, side: -1},
  {id: '01', link: 'work-smoke', w: 1260, h: 1503, H: .58, eye: .28, side: -1}
];
// photos whose cutout was not clean enough: framed on the end wall
export const PRINTS = [{id: '04', w: 912, h: 1600}, {id: '16', w: 1067, h: 1600}, {id: '21', w: 1068, h: 1600}];

export const HW = 4.2, D = 14; // half the room's width, its depth
const N = 6, PITCH = 1.85, ROW = N * PITCH; // stations per wall, their spacing
const COUNTER = {h: .8, d: .5}, MIR = {w: 1, h: 1.1, y: .88 + .55}, BOARD = {w: 1.4, h: 1.5};
const CHAIR = {x: 1.0, seat: .5, top: 1.06, w: .5}; // x: the seat's distance from the mirror wall
const FIGX = 1.03, EYE = 1.15, CROP = .62; // the figure's plane from the wall, a seated eye line, the lowest cut

export function makeupRoom(ctx) {
  const {scene, renderer, camera, room, H, WALL, DOOR, low, textTex, canvasTex, fit, fontOf, onLoad} = ctx;
  const group = new THREE.Group(); scene.add(group);
  const zf = room.front, zb = room.back, zc = (zf + zb) / 2, z0 = zf - 2.35; // z0: the first station
  const sz = k => z0 - k * PITCH, rowZ = z0 - (N - 1) * PITCH / 2;
  const rnd = (() => { let s = 11; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  const add = (m, parent = group) => { parent.add(m); return m; };
  function box(w, h, d, mat, x, y, z, parent) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); return add(m, parent); }
  function plane(w, h, mat, x, y, z, ry = 0, parent) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.position.set(x, y, z); m.rotation.y = ry; return add(m, parent); }
  // place an object on a wall: s = side (1 right wall, -1 left), d = distance out from the wall, z along it
  const onWall = (o, s, d, y, z) => { o.position.set(s * (HW - d), y, z); o.rotation.y = s > 0 ? -Math.PI / 2 : Math.PI / 2; return o; };

  /* ---------- the white room ---------- */
  const white = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#f3f0eb'; g.fillRect(0, 0, w, h);
    for (let k = 0; k < 5000; k++) { g.fillStyle = `rgba(${rnd() < .5 ? '120,110,100' : '255,255,255'},${rnd() * .035})`; g.fillRect(rnd() * w, rnd() * h, 2, 2); }
  }, [3, 1]);
  // a touch of shade where the walls meet the floor and the ceiling
  const wallShade = canvasTex(8, 256, (g, w, h) => {
    const l = g.createLinearGradient(0, 0, 0, h);
    l.addColorStop(0, 'rgba(120,110,100,.28)'); l.addColorStop(.07, 'rgba(120,110,100,0)'); l.addColorStop(.92, 'rgba(110,100,90,0)'); l.addColorStop(1, 'rgba(110,100,90,.3)');
    g.fillStyle = l; g.fillRect(0, 0, w, h);
  });
  const wallMat = new THREE.MeshBasicMaterial({map: white, color: new THREE.Color(1.12, 1.1, 1.07)});
  const shadeMat = new THREE.MeshBasicMaterial({map: wallShade, transparent: true, depthWrite: false});
  const wall = (len, x, z, ry, door) => {
    const pieces = door == null ? [[-len / 2, len / 2]] : [[-len / 2, door - DOOR.w / 2], [door + DOOR.w / 2, len / 2]];
    for (const [a0, a1] of pieces) {
      const m = plane(a1 - a0, H, wallMat, x, H / 2, z, ry); m.translateX((a0 + a1) / 2);
      const s = plane(a1 - a0, H, shadeMat, x, H / 2, z, ry); s.translateX((a0 + a1) / 2); s.translateZ(.004);
      const b = box(a1 - a0, .1, .02, base, x, .05, z); b.rotation.y = ry; b.translateX((a0 + a1) / 2); b.translateZ(.01);
    }
    if (door != null) { const m = plane(DOOR.w, H - DOOR.h, wallMat, x, (H + DOOR.h) / 2, z, ry); m.translateX(door); }
  };
  const base = new THREE.MeshLambertMaterial({color: '#dcd6ce', emissive: '#5a5650'});
  wall(D, HW, zc, -Math.PI / 2); wall(D, -HW, zc, Math.PI / 2);
  wall(2 * HW, 0, zb, 0); wall(2 * HW, 0, zf - WALL / 2, Math.PI, 0);
  // pale stone tiles
  const tiles = canvasTex(1024, 1024, (g, w, h) => {
    const n = 4, s = w / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const l = 84 + rnd() * 3; g.fillStyle = `hsl(32,10%,${l}%)`; g.fillRect(i * s, j * s, s, s);
      for (let k = 0; k < 500; k++) { g.fillStyle = `rgba(${rnd() < .5 ? '90,80,70' : '255,255,255'},${rnd() * .06})`; g.fillRect(i * s + rnd() * s, j * s + rnd() * s, 2 + rnd() * 3, 2 + rnd() * 3); }
    }
    g.fillStyle = 'rgba(120,110,100,.5)'; for (let i = 0; i <= n; i++) { g.fillRect(i * s - 1.5, 0, 3, h); g.fillRect(0, i * s - 1.5, w, 3); }
  }, [2 * HW / 2.4, D / 2.4]);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(2 * HW, D), new THREE.MeshLambertMaterial({map: tiles, emissive: '#3a3632'}));
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, .003, zc); add(floor);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(2 * HW, D), new THREE.MeshBasicMaterial({color: '#f1eee9'})); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, H, zc); add(ceil);
  // square ceiling lights down the aisle
  const panelMat = new THREE.MeshBasicMaterial({color: '#fffaf1', toneMapped: false});
  for (let k = 0; k < 4; k++) { const p = new THREE.Mesh(new THREE.PlaneGeometry(.7, .7), panelMat); p.rotation.x = Math.PI / 2; p.position.set(0, H - .005, zf - 2 - k * 3.3); add(p); }

  /* ---------- soft light and shadow sprites ---------- */
  const radial = stops => canvasTex(128, 128, (g, w, h) => { const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); stops.forEach(([o, c]) => r.addColorStop(o, c)); g.fillStyle = r; g.fillRect(0, 0, w, h); });
  const shadowTex = radial([[0, 'rgba(60,45,35,.5)'], [.5, 'rgba(60,45,35,.22)'], [1, 'rgba(60,45,35,0)']]);
  const poolTex = radial([[0, 'rgba(255,205,150,.55)'], [.5, 'rgba(255,205,150,.18)'], [1, 'rgba(255,205,150,0)']]);
  // the glow of the bulbs on the wall: strongest along the bulb frame, fading out
  const halo = canvasTex(256, 256, (g, w, h) => {
    const im = g.createImageData(w, h), bx = BOARD.w / 2 - .1, by = BOARD.h / 2 - .08, S = 2.6; // the texture covers S metres
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const x = Math.abs((i + .5) / w - .5) * S, y = Math.abs((j + .5) / h - .5) * S;
      const dx = Math.max(0, x - bx), dy = Math.max(0, y - by), out = Math.hypot(dx, dy), inside = x < bx && y < by;
      const d = inside ? Math.min(bx - x, by - y) : out;
      const a = Math.exp(-((d / .16) ** 2)) * .85 + Math.exp(-((out / .55) ** 2)) * .35 * (inside ? 1 : 1);
      const o = (j * w + i) * 4; im.data[o] = 255; im.data[o + 1] = 214; im.data[o + 2] = 165; im.data[o + 3] = Math.min(255, a * 255);
    }
    g.putImageData(im, 0, 0);
  });
  function instanced(geo, mat, n, each) {
    const m = new THREE.InstancedMesh(geo, mat, n), o = new THREE.Object3D();
    for (let i = 0; i < n; i++) { o.position.set(0, 0, 0); o.rotation.set(0, 0, 0); o.scale.set(1, 1, 1); each(o, i); o.updateMatrix(); m.setMatrixAt(i, o.matrix); }
    m.instanceMatrix.needsUpdate = true; m.computeBoundingSphere?.(); return add(m);
  }
  const stations = [];
  for (let k = 0; k < 2 * N; k++) { const f = FIG[k], s = f.side, j = s > 0 ? k : k - N; stations.push({f, s, z: s > 0 ? sz(j) : sz(N - 1 - j)}); }
  const flat = (tex, add) => new THREE.MeshBasicMaterial({map: tex, transparent: true, depthWrite: false, blending: add ? THREE.AdditiveBlending : THREE.NormalBlending});
  instanced(new THREE.PlaneGeometry(2.6, 2.6), flat(halo, true), stations.length, (o, i) => { const st = stations[i]; onWall(o, st.s, .008, MIR.y + .05, st.z); });
  // warm light on the counter and on the floor in front of each mirror; shadows under the chairs and along the counters
  instanced(new THREE.PlaneGeometry(1.5, .9), flat(poolTex, true), stations.length, (o, i) => { const st = stations[i]; o.position.set(st.s * (HW - .3), COUNTER.h + .022, st.z); o.rotation.x = -Math.PI / 2; });
  instanced(new THREE.PlaneGeometry(2.4, 2.4), flat(poolTex, true), stations.length, (o, i) => { const st = stations[i]; o.position.set(st.s * (HW - 1.2), .006, st.z); o.rotation.x = -Math.PI / 2; });
  instanced(new THREE.PlaneGeometry(1.1, 1.1), flat(shadowTex), stations.length, (o, i) => { const st = stations[i]; o.position.set(st.s * (HW - CHAIR.x), .008, st.z); o.rotation.x = -Math.PI / 2; });
  const strip = canvasTex(8, 64, (g, w, h) => { const l = g.createLinearGradient(0, 0, 0, h); l.addColorStop(0, 'rgba(60,45,35,.45)'); l.addColorStop(1, 'rgba(60,45,35,0)'); g.fillStyle = l; g.fillRect(0, 0, w, h); });
  for (const s of [1, -1]) { const m = plane(ROW + .6, .45, flat(strip), s * (HW - COUNTER.d - .2), .007, rowZ); m.rotation.set(-Math.PI / 2, 0, s > 0 ? -Math.PI / 2 : Math.PI / 2); }

  /* ---------- the counters ---------- */
  const lacquer = new THREE.MeshLambertMaterial({color: '#f6f3ee', emissive: '#8a8580'});
  const fronts = canvasTex(1024, 128, (g, w, h) => {
    g.fillStyle = '#f6f3ee'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(120,105,90,.35)';
    for (let k = 0; k <= N * 2; k++) g.fillRect(k * w / (N * 2) - 1, 6, 2, h - 18);
    g.fillRect(0, h * .36, w, 2);
    g.fillStyle = 'rgba(150,135,120,.55)'; for (let k = 0; k < N * 2; k++) g.fillRect((k + .5) * w / (N * 2) - 14, h * .2, 28, 4);
    g.fillStyle = 'rgba(90,80,70,.5)'; g.fillRect(0, h - 12, w, 12);
  });
  const oak = canvasTex(1024, 64, (g, w, h) => { g.fillStyle = '#c9a57a'; g.fillRect(0, 0, w, h); for (let k = 0; k < 160; k++) { g.strokeStyle = `rgba(${rnd() < .5 ? '120,80,40' : '235,205,165'},${.08 + rnd() * .12})`; g.lineWidth = .5 + rnd() * 1.5; g.beginPath(); const y = rnd() * h; g.moveTo(0, y); g.bezierCurveTo(w / 3, y + rnd() * 8 - 4, w * 2 / 3, y + rnd() * 8 - 4, w, y + rnd() * 6 - 3); g.stroke(); } });
  const top = new THREE.MeshStandardMaterial({map: oak, roughness: .45});
  for (const s of [1, -1]) {
    const L = ROW + .6, cab = box(COUNTER.d, COUNTER.h - .04, L, [lacquer, lacquer, lacquer, lacquer, lacquer, lacquer], s * (HW - COUNTER.d / 2), (COUNTER.h - .04) / 2, rowZ);
    const fm = new THREE.MeshLambertMaterial({map: fronts, emissive: '#8a8580', emissiveMap: fronts}); cab.material[s > 0 ? 1 : 0] = fm; // the face towards the room
    const t = box(COUNTER.d + .04, .04, L + .04, top, s * (HW - COUNTER.d / 2 - .02), COUNTER.h - .02, rowZ);
  }

  /* ---------- the mirrors: one reflector per wall, showing only inside each frame ---------- */
  const MirrorShader = {
    name: 'VanityMirror',
    uniforms: {color: {value: null}, tDiffuse: {value: null}, textureMatrix: {value: null}, cells: {value: N}, fill: {value: MIR.w / PITCH}, seen: {value: 0}},
    vertexShader: `uniform mat4 textureMatrix; varying vec4 vUv; varying vec2 vPlane;
      #include <common>
      #include <logdepthbuf_pars_vertex>
      void main() { vUv = textureMatrix * vec4(position, 1.0); vPlane = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      #include <logdepthbuf_vertex>
      }`,
    fragmentShader: `uniform vec3 color; uniform sampler2D tDiffuse; uniform float cells; uniform float fill; uniform float seen; varying vec4 vUv; varying vec2 vPlane;
      #include <logdepthbuf_pars_fragment>
      void main() {
        #include <logdepthbuf_fragment>
        float c = abs(fract(vPlane.x * cells) - 0.5) / (fill * 0.5);
        if (c > 1.0) discard;
        vec3 base = seen > 0.5 ? mix(vec3(0.55, 0.53, 0.5), vec3(0.95, 0.92, 0.87), smoothstep(0.0, 1.0, vPlane.y)) : texture2DProj(tDiffuse, vUv).rgb;
        float e = min((1.0 - c) * fill * 0.5 * cells / ${(MIR.h / ROW).toFixed(5)}, min(vPlane.y, 1.0 - vPlane.y));
        float edge = mix(0.82, 1.0, smoothstep(0.0, 0.05, e));
        gl_FragColor = vec4(base * color * edge, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  };
  const scale = low ? .55 : .8, cap = low ? 1024 : 1800;
  const rtSize = () => { const w = innerWidth * renderer.getPixelRatio() * scale, h = innerHeight * renderer.getPixelRatio() * scale, k = Math.min(1, cap / Math.max(w, h)); return [Math.round(w * k), Math.round(h * k)]; };
  const mirrors = [];
  let reflecting = false; // one reflection at a time: a mirror seen in the other shows its last picture
  for (const s of [1, -1]) {
    const [tw, th] = rtSize();
    const m = new Reflector(new THREE.PlaneGeometry(ROW, MIR.h), {textureWidth: tw, textureHeight: th, clipBias: .003, color: '#e3e6e6', shader: MirrorShader, multisample: low ? 0 : 4});
    onWall(m, s, .036, MIR.y, rowZ); add(m);
    m.camera.layers.set(1); // the reflection draws only this room and the room before it
    const own = m.onBeforeRender;
    m.onBeforeRender = function (r, sc, cam) {
      if (reflecting || cam.position.z > zf + 8) return;
      reflecting = true; for (const o of mirrors) if (o !== m) o.material.uniforms.seen.value = 1;
      own.call(this, r, sc, cam);
      for (const o of mirrors) o.material.uniforms.seen.value = 0; reflecting = false;
    };
    mirrors.push(m);
  }
  // the board each mirror is set in, a thin frame, and the bulbs around it
  const boardMat = new THREE.MeshLambertMaterial({color: '#f7f4ef', emissive: '#a39e98'});
  instanced(new THREE.BoxGeometry(BOARD.w, BOARD.h, .03), boardMat, stations.length, (o, i) => { const st = stations[i]; onWall(o, st.s, .015, MIR.y + .05, st.z); });
  const ring = new THREE.Shape(); ring.moveTo(-MIR.w / 2 - .018, -MIR.h / 2 - .018); ring.lineTo(MIR.w / 2 + .018, -MIR.h / 2 - .018); ring.lineTo(MIR.w / 2 + .018, MIR.h / 2 + .018); ring.lineTo(-MIR.w / 2 - .018, MIR.h / 2 + .018);
  const hole = new THREE.Path(); hole.moveTo(-MIR.w / 2, -MIR.h / 2); hole.lineTo(-MIR.w / 2, MIR.h / 2); hole.lineTo(MIR.w / 2, MIR.h / 2); hole.lineTo(MIR.w / 2, -MIR.h / 2); ring.holes.push(hole);
  instanced(new THREE.ShapeGeometry(ring), new THREE.MeshStandardMaterial({color: '#b9b4ad', roughness: .3, metalness: .4}), stations.length, (o, i) => { const st = stations[i]; onWall(o, st.s, .04, MIR.y, st.z); });
  const bulbs = [];
  for (const st of stations) {
    const bx = BOARD.w / 2 - .1, yTop = MIR.y + MIR.h / 2 + .12;
    for (let k = 0; k < 8; k++) bulbs.push([st, -bx + k * 2 * bx / 7, yTop]);
    for (const sx of [-1, 1]) for (let k = 0; k < 7; k++) bulbs.push([st, sx * bx, yTop - (k + 1) * (yTop - (MIR.y - MIR.h / 2) + .02) / 7.4]);
  }
  instanced(new THREE.SphereGeometry(.034, 14, 10), new THREE.MeshBasicMaterial({color: '#fff6e6', toneMapped: false}), bulbs.length, (o, i) => { const [st, x, y] = bulbs[i]; onWall(o, st.s, .065, y, st.z); o.translateX(x); });
  instanced(new THREE.CylinderGeometry(.018, .018, .03, 10), new THREE.MeshStandardMaterial({color: '#a9a39b', roughness: .35, metalness: .5}), bulbs.length, (o, i) => { const [st, x, y] = bulbs[i]; onWall(o, st.s, .04, y, st.z); o.translateX(x); o.rotateX(Math.PI / 2); });

  /* ---------- makeup chairs: black leather, a chrome column and base ---------- */
  const leather = new THREE.MeshStandardMaterial({color: '#211e1f', roughness: .42});
  const chrome = new THREE.MeshStandardMaterial({color: '#d4d4d4', roughness: .22, metalness: .55});
  const rounded = (w, h, d, r) => {
    const s = new THREE.Shape(), x = -w / 2 + r, y = -h / 2 + r;
    s.moveTo(x, -h / 2); s.lineTo(w / 2 - r, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, y); s.lineTo(w / 2, h / 2 - r); s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
    s.lineTo(x, h / 2); s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r); s.lineTo(-w / 2, y); s.quadraticCurveTo(-w / 2, -h / 2, x, -h / 2);
    const g = new THREE.ExtrudeGeometry(s, {depth: d - .03, bevelEnabled: true, bevelThickness: .015, bevelSize: .015, bevelSegments: 3, curveSegments: 6}); g.translate(0, 0, -(d - .03) / 2); return g;
  };
  // a chair faces its mirror: local +z points at the wall
  const chairAt = (o, st, dz, y) => { o.position.set(st.s * (HW - CHAIR.x - dz), y, st.z); o.rotation.y = st.s > 0 ? Math.PI / 2 : -Math.PI / 2; return o; };
  const backH = CHAIR.top - CHAIR.seat - .02;
  instanced(rounded(CHAIR.w, backH, .09, .07), leather, stations.length, (o, i) => { chairAt(o, stations[i], .25, CHAIR.seat + .02 + backH / 2); o.rotateX(-.08); });
  instanced((() => { const g = rounded(.5, .46, .09, .06); g.rotateX(Math.PI / 2); return g; })(), leather, stations.length, (o, i) => chairAt(o, stations[i], 0, CHAIR.seat - .045));
  const armGeo = rounded(.07, .06, .44, .025);
  instanced(armGeo, leather, stations.length * 2, (o, i) => { const st = stations[i >> 1]; chairAt(o, st, .02, CHAIR.seat + .2); o.translateX((i & 1 ? 1 : -1) * .27); });
  instanced(new THREE.CylinderGeometry(.012, .012, .2, 8), chrome, stations.length * 2, (o, i) => { const st = stations[i >> 1]; chairAt(o, st, -.05, CHAIR.seat + .09); o.translateX((i & 1 ? 1 : -1) * .27); });
  instanced(new THREE.CylinderGeometry(.035, .045, CHAIR.seat - .1, 16), chrome, stations.length, (o, i) => chairAt(o, stations[i], 0, (CHAIR.seat - .1) / 2 + .03));
  instanced(new THREE.CylinderGeometry(.27, .29, .03, 32), chrome, stations.length, (o, i) => chairAt(o, stations[i], 0, .018));
  instanced(new THREE.TorusGeometry(.2, .012, 8, 32), chrome, stations.length, (o, i) => { chairAt(o, stations[i], -.02, .2); o.rotateX(Math.PI / 2); });

  /* ---------- on the counter: a face-paint palette, a cup of brushes, a sponge ---------- */
  const paints = ['#d23a3a', '#f0a43a', '#f2d64b', '#3fa66b', '#2f7fd6', '#7a4bc4', '#141414', '#f4f1ea', '#d9b38c', '#e46fae', '#46c3c9', '#c08a2c'];
  const ct = COUNTER.h + .001;
  const along = (o, st, out, y, dz) => { o.position.set(st.s * (HW - out), y, st.z + dz); return o; };
  instanced(new THREE.BoxGeometry(.17, .016, .27), new THREE.MeshStandardMaterial({color: '#151314', roughness: .35}), stations.length, (o, i) => along(o, stations[i], .27, ct + .008, -.32 * stations[i].s));
  const pans = new THREE.InstancedMesh(new THREE.CylinderGeometry(.022, .022, .006, 16), new THREE.MeshStandardMaterial({roughness: .3}), stations.length * 12);
  { const o = new THREE.Object3D(), c = new THREE.Color(); let n = 0;
    stations.forEach((st, i) => { for (let k = 0; k < 12; k++) { along(o, st, .27 + ((k % 3) - 1) * .05, ct + .018, -.32 * st.s + (Math.floor(k / 3) - 1.5) * .06); o.updateMatrix(); pans.setMatrixAt(n, o.matrix); pans.setColorAt(n++, c.set(paints[(k + i * 5) % paints.length])); } });
    add(pans); }
  instanced(new THREE.CylinderGeometry(.04, .034, .11, 20, 1, true), new THREE.MeshStandardMaterial({color: '#f4f1ec', roughness: .25, side: THREE.DoubleSide}), stations.length, (o, i) => along(o, stations[i], .2, ct + .055, .36 * stations[i].s));
  instanced(new THREE.CylinderGeometry(.0045, .003, .24, 6), new THREE.MeshStandardMaterial({color: '#2a2220', roughness: .4}), stations.length * 5, (o, i) => { along(o, stations[i / 5 | 0], .2, ct + .14, .36 * stations[i / 5 | 0].s); const a = (i % 5) / 5 * Math.PI * 2; o.translateX(Math.cos(a) * .015); o.translateZ(Math.sin(a) * .015); o.rotateX(Math.sin(a) * .2); o.rotateZ(Math.cos(a) * .2); });
  instanced(new THREE.SphereGeometry(.035, 14, 10), new THREE.MeshStandardMaterial({color: '#e6b9a0', roughness: .9}), stations.length, (o, i) => { along(o, stations[i], .36, ct + .016, .12 * stations[i].s); o.scale.set(1, .45, 1.25); });

  /* ---------- the figures ---------- */
  // one double-sided cutout: its front (towards the mirror) is the photo, its back a figure seen against the light
  const FigShader = {
    vertex: `varying vec2 vUv; varying vec2 vPos; varying vec2 vEdge; attribute vec2 edge;
      void main() { vUv = uv; vPos = position.xy; vEdge = edge; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragment: `uniform sampler2D map; uniform sampler2D back; uniform vec3 tint; uniform vec3 rimColor; uniform vec2 texel; uniform float fade; uniform float chairTop; uniform float chairHalf;
      varying vec2 vUv; varying vec2 vPos; varying vec2 vEdge;
      void main() {
        vec4 c = texture2D(map, vUv);
        vec3 col;
        if (gl_FrontFacing) {
          if (c.a < 0.04) discard;
          // the counter shades the body below its edge
          col = c.rgb * vec3(1.05, 1.0, 0.95) * mix(0.5, 1.0, smoothstep(0.8, 0.98, vPos.y)) * fade;
        } else {
          // seen from behind: below the chair's back only what the chair leaves room for
          // the outline smoothed and closed (no fingers, props or holes): a head and shoulders against the light
          vec4 k = texture2D(back, vUv);
          if (k.r < 0.04 || (vPos.y < chairTop && abs(vPos.x) > chairHalf)) discard;
          c.a = k.r;
          col = tint * mix(0.65, 1.2, smoothstep(0.95, 1.55, vPos.y)) + rimColor * k.g * smoothstep(0.95, 1.3, vPos.y) * 0.55;
        }
        float b = smoothstep(0.0, 0.035, min(vEdge.x, 1.0 - vEdge.x)) * smoothstep(0.0, 0.05, vEdge.y);
        gl_FragColor = vec4(col, c.a * b);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  };
  const loader = new THREE.TextureLoader(), items = [], pickBox = new THREE.BoxGeometry(.75, 1.5, .8), pickPlane = new THREE.PlaneGeometry(MIR.w, MIR.h);
  const hidden = new THREE.MeshBasicMaterial({visible: false});
  stations.forEach((st, k) => {
    if (!st.f.id) return;
    const f = st.f, w = f.H * f.w / f.h, topY = EYE + f.H * f.eye, botY = topY - f.H, cut = Math.max(botY, CROP);
    const geo = new THREE.PlaneGeometry(w, topY - cut);
    geo.translate(0, (topY + cut) / 2, 0);
    // the photo cropped at the cut, and mirrored: in the mirror it reads as photographed
    const uv = geo.attributes.uv, v0 = (cut - botY) / f.H;
    geo.setAttribute('edge', new THREE.BufferAttribute(new Float32Array(uv.array), 2)); // 0..1 across the visible part: the photo's straight borders fade
    for (let i = 0; i < uv.count; i++) uv.setXY(i, 1 - uv.getX(i), v0 + uv.getY(i) * (1 - v0));
    const mat = new THREE.ShaderMaterial({
      uniforms: {map: {value: null}, back: {value: null}, tint: {value: new THREE.Color('#2a2220')}, rimColor: {value: new THREE.Color('#e8b47c')}, texel: {value: new THREE.Vector2(.006, .006 * w / f.H)}, fade: {value: 0}, chairTop: {value: CHAIR.top - .02}, chairHalf: {value: CHAIR.w / 2 - .02}},
      vertexShader: FigShader.vertex, fragmentShader: FigShader.fragment, side: THREE.DoubleSide, transparent: true
    });
    const fig = new THREE.Mesh(geo, mat); fig.visible = false; fig.position.set(st.s * (HW - FIGX), 0, st.z); fig.rotation.y = st.s > 0 ? Math.PI / 2 : -Math.PI / 2; add(fig);
    loader.load(`../assets/img/mirror-room/mr-${f.id}-${low ? 'lo' : 'hi'}.webp`, tx => {
      tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = low ? 2 : 8; mat.uniforms.map.value = tx; mat.uniforms.tint.value.copy(hairTone(tx.image)); mat.uniforms.back.value = backMask(tx.image, f, w); fig.visible = true; fades.push(mat); onLoad();
    }, undefined, onLoad);
    // what a click or a tap finds: the figure in its chair, and its mirror
    const body = new THREE.Mesh(pickBox, hidden); body.position.set(st.s * (HW - CHAIR.x - .05), .9, st.z); add(body);
    const glass = onWall(new THREE.Mesh(pickPlane, hidden), st.s, .05, MIR.y, st.z); add(glass);
    const normal = new THREE.Vector3(-st.s, 0, 0), work = f.link && f.link.startsWith('work-') ? f.link.slice(5) : null;
    const item = {station: true, id: work || 'body-art-' + f.id, work, credit: f.credit, n: k + 1, pic: body, picks: [body, glass],
      center: new THREE.Vector3(st.s * (HW - .05), MIR.y, st.z), normal, right: new THREE.Vector3(0, 0, st.s),
      zoomSrc: work ? null : `../assets/img/body-art/body-art-${f.id}-1600.webp`,
      // stand behind the chair, a little to the side, looking at the face in the mirror
      view(fr) {
        const pos = new THREE.Vector3(st.s * (HW - FIGX - 1.55), 1.65, st.z - st.s * .42);
        const aim = new THREE.Vector3(st.s * (HW + FIGX - .07), EYE + .02, st.z);
        return aimFrom(pos, aim, fr);
      }};
    items.push(item);
    if (work) { // a name card tucked in the corner of the mirror
      const card = new THREE.Mesh(new THREE.PlaneGeometry(.24, .12), new THREE.MeshBasicMaterial({map: textTex(512, 256, (g, cw, ch) => {
        g.fillStyle = '#fbf8f2'; g.fillRect(0, 0, cw, ch); g.strokeStyle = '#d8cdbd'; g.lineWidth = 6; g.strokeRect(3, 3, cw - 6, ch - 6);
        const title = ctx.title(work); g.textAlign = 'center'; g.fillStyle = '#1e1a17'; fit(g, title, 700, 120, '"Amatic SC"', cw - 40, 40); g.fillText(title, cw / 2, ch / 2 + 36);
      })}));
      onWall(card, st.s, .045, MIR.y - MIR.h / 2 + .08, st.z); card.translateX(MIR.w / 2 - .13); card.rotateZ(-.06); add(card);
    }
  });
  // the colour of the hair (the top of the cutout), darkened: the figure's tone seen from behind
  function hairTone(img) {
    const c = document.createElement('canvas'); c.width = c.height = 24; const g = c.getContext('2d', {willReadFrequently: true}); g.drawImage(img, 0, 0, 24, 24);
    const d = g.getImageData(0, 0, 24, 8).data; let r = 0, gg = 0, b = 0, n = 0;
    for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 200) { r += d[i]; gg += d[i + 1]; b += d[i + 2]; n++; }
    const col = n ? new THREE.Color(r / n / 255, gg / n / 255, b / n / 255) : new THREE.Color('#2a2220');
    col.convertSRGBToLinear(); return col.multiplyScalar(.3).lerp(new THREE.Color('#0b0807'), .5);
  }
  const fades = [];
  // the back of a figure: its alpha blurred and cut again (R: the soft shape, G: a thin band just inside its edge)
  // kept to a head, neck and shoulders where the photo has them: hands, props and raised arms belong to the front
  function backMask(img, f, wm) {
    const W = 96, Hh = Math.max(16, Math.round(W * img.height / img.width)), c = document.createElement('canvas'); c.width = W; c.height = Hh;
    const g = c.getContext('2d', {willReadFrequently: true}); g.drawImage(img, 0, 0, W, Hh);
    const im = g.getImageData(0, 0, W, Hh), d = im.data; let a = new Float32Array(W * Hh), b = new Float32Array(W * Hh);
    for (let i = 0; i < W * Hh; i++) a[i] = d[i * 4 + 3] / 255;
    const px = W / wm, eyeY = f.eye * Hh; // pixels per metre, the eye line
    let sx = 0, sn = 0; for (let y = Math.max(0, Math.round(eyeY - .08 * px)); y < Math.min(Hh, eyeY + .06 * px); y++) for (let x = 0; x < W; x++) { const v = a[y * W + x]; sx += x * v; sn += v; }
    const cx = sn ? sx / sn : W / 2, hy = eyeY - .035 * px;
    for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) {
      const dx = (x - cx) / px, dy = (y - hy) / px, ey = (y - eyeY) / px;
      const head = (dx / .125) ** 2 + (dy / .165) ** 2 < 1, neck = Math.abs(dx) < .075 && ey > 0 && ey < .24;
      const sh = ey > .18 && Math.abs(dx) < .11 + .12 * Math.min(1, (ey - .18) / .07);
      if (!(head || neck || sh)) a[y * W + x] = 0;
    }
    const R = 4, blur = (src, dst, dx, dy, n) => { for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) { let s = 0, m = 0; for (let k = -R; k <= R; k++) { const xx = x + k * dx, yy = y + k * dy; if (xx < 0 || yy < 0 || xx >= W || yy >= Hh) continue; s += src[yy * W + xx]; m++; } dst[y * W + x] = s / m; } };
    for (let p = 0; p < 2; p++) { blur(a, b, 1, 0); blur(b, a, 0, 1); }
    const ss = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
    for (let i = 0; i < W * Hh; i++) { const v = a[i], m = ss(.38, .52, v); d[i * 4] = m * 255; d[i * 4 + 1] = m * (1 - ss(.52, .8, v)) * 255; d[i * 4 + 2] = 0; d[i * 4 + 3] = 255; }
    g.putImageData(im, 0, 0);
    const tx = new THREE.CanvasTexture(c); tx.minFilter = THREE.LinearFilter; tx.generateMipmaps = false; return tx;
  }

  /* ---------- the end wall: the room's sign and three framed photos ---------- */
  const PW = .62, frameMat = new THREE.MeshStandardMaterial({color: '#1d1a19', roughness: .5});
  PRINTS.forEach((p, k) => {
    const h = 1.0, w = h * p.w / p.h, x = (1 - k) * 1.9, y = 1.6, g = new THREE.Group(); g.position.set(x, y, zb + .03); add(g);
    box(w + .16, h + .16, .035, frameMat, 0, 0, 0, g);
    plane(w + .1, h + .1, new THREE.MeshBasicMaterial({color: '#f2eee7'}), 0, 0, .018, 0, g);
    const mat = new THREE.MeshBasicMaterial({color: '#ddd'}), pic = plane(w, h, mat, 0, 0, .02, 0, g);
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(w * 3 + .4, 2.6), flat(poolTex, true)); glow.position.set(0, .35, -.012); g.add(glow);
    loader.load(`../assets/img/body-art/body-art-${p.id}-${low ? 800 : 1600}.webp`, tx => { tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = low ? 2 : 8; mat.map = tx; mat.color.set('#ffffff'); mat.needsUpdate = true; onLoad(); }, undefined, onLoad);
    const center = new THREE.Vector3(x, y, zb + .05), normal = new THREE.Vector3(0, 0, 1);
    items.splice(N + k, 0, {station: true, print: true, id: 'body-art-' + p.id, work: null, n: 0, pic, picks: [pic], center, normal, right: new THREE.Vector3(-1, 0, 0),
      zoomSrc: `../assets/img/body-art/body-art-${p.id}-1600.webp`,
      view(fr) { const dist = Math.max(1.6, (h + .3) / (fr.fhN * fr.tanV), (w + .3) / (fr.fwN * fr.tanH)); return aimFrom(center.clone().addScaledVector(normal, dist).setY(1.6), center, fr); }});
  });
  const sign = (s, x, y, z, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(5, 1.25), new THREE.MeshBasicMaterial({transparent: true, map: textTex(1600, 400, ctx.drawSign)})); m.scale.setScalar(s); m.position.set(x, y, z); m.rotation.y = ry; add(m); };
  sign(1, 0, 3.5, zb + .02, 0);
  sign(.78, 0, 3.82, zf - WALL / 2 - .01, Math.PI);

  // turn towards a point and frame it in the part of the screen the card leaves free
  function aimFrom(pos, aim, fr) {
    const dx = aim.x - pos.x, dz = aim.z - pos.z;
    const yaw = Math.atan2(-dx, -dz) + Math.atan(fr.cx * fr.tanH), pitch = Math.atan2(aim.y - pos.y, Math.hypot(dx, dz)) - Math.atan(fr.cy * fr.tanV);
    return {pos, yaw, pitch};
  }

  // everything in this room (and the room before it, seen through the doorway) shows in the mirrors
  group.traverse(o => o.layers.enable(1));

  return {
    items, mirrors, group,
    // stay in the aisle: behind the chairs along the counters, in front of the end wall
    collide(p) {
      if (p.z > zf - .2) return;
      const inRow = p.z < z0 + 1 && p.z > sz(N - 1) - 1, lim = inRow ? HW - CHAIR.x - .62 : HW - .45;
      p.x = Math.max(-lim, Math.min(lim, p.x)); p.z = Math.max(zb + .6, p.z);
    },
    entrance: {pos: new THREE.Vector3(0, 1.65, zf - 1.2), yaw: 0, pitch: -.04},
    update(dt) { for (let i = fades.length - 1; i >= 0; i--) { const u = fades[i].uniforms.fade; u.value = Math.min(1, u.value + dt * 1.5); if (u.value >= 1) fades.splice(i, 1); } },
    resize() { const [w, h] = rtSize(); for (const m of mirrors) m.getRenderTarget().setSize(w, h); }
  };
}
