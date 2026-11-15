// The mirror room, the museum's fourth room: a white backstage makeup room. Vanity mirrors framed with bulbs
// along both long walls; each makeup chair is turned to the aisle and holds one of Sandra Leifer's body-art
// photos, whole and framed, propped on its arms against the backrest. The contest photos hang on the end wall.
// A tap on a photo opens it in the body-art gallery's lightbox (assets/js/body-art.js, set up in museum/index.html).
// Built into the museum scene (museum/index.html), so the same walk, joystick, card, tour and arrows apply. The room is built
// in its own frame (its doorway at z = room.front, x across) inside ctx.parent, which places it off the lobby; items are in world space.
import * as THREE from 'three';
import {Reflector} from '../assets/vendor/Reflector.js';

// The chairs, in walking order: down the right-hand wall as you come in, then back up the left.
// id: the body-art photo (assets/img/body-art/body-art-<id>-*.webp; its size, credit and tags come from body-art-data.js).
// work: the catalog work this shoot is: the chair shows the catalog image, and the card its title and the way to buy it.
export const SEATS = [
  {id: '06', work: 'chromatic-reverie'}, {id: '02'}, {id: '05'}, {id: '10'}, {id: '14', work: 'gaze'}, {id: '19'}, {id: '07'}, {id: '11'}, {id: '04'},
  {id: '20'}, {id: '08'}, {id: '09'}, {id: '16'}, {id: '12'}, {id: '03'}, {id: '17'}, {id: '21'}, {id: '01', work: 'smoke'}
];
// the end wall: the contest photos, 2025 then 2026 (body-art-data.js gives each its year)
export const PRINTS = [{id: '13'}, {id: 'event-01'}, {id: 'event-02'}, {id: 'event-04'}];

const N = SEATS.length / 2, PITCH = 1.6, ROW = N * PITCH; // stations per wall, their spacing
export const HW = 4.2, D = ROW + 2.8; // half the room's width, its depth (the row plus the entrance and the end wall)
const COUNTER = {h: .8, d: .5}, MIR = {w: 1, h: 1.1, y: .88 + .55}, BOARD = {w: 1.4, h: 1.5};
const CHAIR = {x: 1.0, seat: .5, top: 1.06, w: .5}; // x: the seat's distance from the mirror wall
const ARM = CHAIR.seat + .245, LONG = .95, MAT = .035, FR = .025, LEAN = .17; // the arms' top; a photo's long side, its white mat, its frame, its lean

export function makeupRoom(ctx) {
  const {scene, renderer, camera, room, H, WALL, DOOR, low, textTex, canvasTex, fit, fontOf, onLoad, photo} = ctx;
  const group = new THREE.Group(); (ctx.parent || scene).add(group); group.updateMatrixWorld(true);
  const wq = group.getWorldQuaternion(new THREE.Quaternion()), W = v => v.applyQuaternion(wq), tmp = new THREE.Vector3(); // W: a room direction in world space
  const zf = room.front, zb = room.back, zc = (zf + zb) / 2, z0 = zf - 2.2; // z0: the first station
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
  for (let k = 0; k < 2 * N; k++) { const s = k < N ? 1 : -1, j = s > 0 ? k : k - N; stations.push({seat: SEATS[k], s, z: s > 0 ? sz(j) : sz(N - 1 - j)}); }
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
      if (reflecting || group.worldToLocal(tmp.copy(cam.position)).z > zf + 8) return;
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

  /* ---------- makeup chairs: black leather, a chrome column and base, swivelled round to face the aisle ---------- */
  const leather = new THREE.MeshStandardMaterial({color: '#211e1f', roughness: .42});
  const chrome = new THREE.MeshStandardMaterial({color: '#d4d4d4', roughness: .22, metalness: .55});
  const rounded = (w, h, d, r) => {
    const s = new THREE.Shape(), x = -w / 2 + r, y = -h / 2 + r;
    s.moveTo(x, -h / 2); s.lineTo(w / 2 - r, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, y); s.lineTo(w / 2, h / 2 - r); s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
    s.lineTo(x, h / 2); s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r); s.lineTo(-w / 2, y); s.quadraticCurveTo(-w / 2, -h / 2, x, -h / 2);
    const g = new THREE.ExtrudeGeometry(s, {depth: d - .03, bevelEnabled: true, bevelThickness: .015, bevelSize: .015, bevelSegments: 3, curveSegments: 6}); g.translate(0, 0, -(d - .03) / 2); return g;
  };
  // a chair faces the aisle: local +z points away from its mirror; dz: out towards the aisle
  const chairAt = (o, st, dz, y) => { o.position.set(st.s * (HW - CHAIR.x - dz), y, st.z); o.rotation.y = st.s > 0 ? -Math.PI / 2 : Math.PI / 2; return o; };
  const backH = CHAIR.top - CHAIR.seat - .02;
  instanced(rounded(CHAIR.w, backH, .09, .07), leather, stations.length, (o, i) => { chairAt(o, stations[i], -.25, CHAIR.seat + .02 + backH / 2); o.rotateX(-.08); });
  instanced((() => { const g = rounded(.5, .46, .09, .06); g.rotateX(Math.PI / 2); return g; })(), leather, stations.length, (o, i) => chairAt(o, stations[i], 0, CHAIR.seat - .045));
  const armGeo = rounded(.07, .06, .44, .025);
  instanced(armGeo, leather, stations.length * 2, (o, i) => { const st = stations[i >> 1]; chairAt(o, st, -.02, CHAIR.seat + .2); o.translateX((i & 1 ? 1 : -1) * .27); });
  instanced(new THREE.CylinderGeometry(.012, .012, .2, 8), chrome, stations.length * 2, (o, i) => { const st = stations[i >> 1]; chairAt(o, st, .05, CHAIR.seat + .09); o.translateX((i & 1 ? 1 : -1) * .27); });
  instanced(new THREE.CylinderGeometry(.035, .045, CHAIR.seat - .1, 16), chrome, stations.length, (o, i) => chairAt(o, stations[i], 0, (CHAIR.seat - .1) / 2 + .03));
  instanced(new THREE.CylinderGeometry(.27, .29, .03, 32), chrome, stations.length, (o, i) => chairAt(o, stations[i], 0, .018));
  instanced(new THREE.TorusGeometry(.2, .012, 8, 32), chrome, stations.length, (o, i) => { chairAt(o, stations[i], .02, .2); o.rotateX(Math.PI / 2); });

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

    /* ---------- the photos: whole, framed, propped on the chairs ---------- */
  // photo(id, work) gives {src, hi, big, w, h, credit, year} (museum/index.html: body-art-data.js and the catalog), or null for a photo that may not be shown
  const loader = new THREE.TextureLoader(), items = [];
  const frameMat = new THREE.MeshStandardMaterial({color: '#1c1918', roughness: .45}), matBoard = new THREE.MeshBasicMaterial({color: '#f6f2ea'});
  const backMat = new THREE.MeshLambertMaterial({color: '#6b5b4a', emissive: '#2a221a'}); // the brown paper on a frame's back, seen in the mirrors
  const plaqueTex = (draw) => textTex(640, 160, (g, w, h) => { g.fillStyle = '#fbf8f2'; g.fillRect(0, 0, w, h); g.strokeStyle = '#d8cdbd'; g.lineWidth = 5; g.strokeRect(2.5, 2.5, w - 5, h - 5); draw(g, w, h); });
  // one framed photo; its bottom edge at the group's origin, facing local +z. Returns the photo and its frame (what a tap finds)
  function framed(p, g, longSide) {
    const ph = p.h >= p.w ? longSide : longSide * p.h / p.w, pw = ph * p.w / p.h, k = MAT + FR, fw = pw + 2 * k, fh = ph + 2 * k;
    const frame = box(fw, fh, .032, [frameMat, frameMat, frameMat, frameMat, frameMat, backMat], 0, fh / 2, 0, g);
    plane(pw + 2 * MAT, ph + 2 * MAT, matBoard, 0, fh / 2, .0165, 0, g);
    const mat = new THREE.MeshBasicMaterial({color: '#cfc9c0'}), pic = plane(pw, ph, mat, 0, fh / 2, .018, 0, g);
    const set = tx => { tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = low ? 4 : 8; const old = mat.map; mat.map = tx; mat.color.set('#ffffff'); mat.needsUpdate = true; old?.dispose(); };
    loader.load(p.src, tx => { set(tx); onLoad(); }, undefined, onLoad);
    // the sharper file once you stand in front of it
    let sharp = false; const sharpen = () => { if (sharp || p.hi === p.src) return; sharp = true; loader.load(p.hi, set); };
    return {pic, frame, pw, ph, fw, fh, sharpen};
  }
  // the item the museum walks to, shows a card for and opens in the lightbox
  const itemOf = (p, seat, f, center, normal, right, view) => ({station: true, id: seat.work || 'body-art-' + seat.id, work: seat.work || null, credit: p.credit, year: p.year,
    big: p.big, w: p.w, h: p.h, pic: f.pic, picks: [f.pic, f.frame], center, normal, right, sharpen: f.sharpen, view});
  stations.forEach(st => {
    const p = photo(st.seat.id, st.seat.work); if (!p) return;
    // on the chair's arms, leaning back against its backrest, facing the aisle
    const g = new THREE.Group(); g.position.set(st.s * (HW - CHAIR.x + .1), ARM, st.z); g.rotation.y = st.s > 0 ? -Math.PI / 2 : Math.PI / 2; add(g);
    const lean = new THREE.Group(); lean.rotation.x = -LEAN; g.add(lean);
    const f = framed(p, lean, LONG);
    g.updateMatrixWorld(true);
    const center = f.pic.getWorldPosition(new THREE.Vector3()), tilt = new THREE.Vector3(0, 0, 1).applyQuaternion(f.pic.getWorldQuaternion(new THREE.Quaternion()));
    const normal = W(new THREE.Vector3(-st.s, 0, 0));
    if (st.seat.work) { // the catalog title on a card at the foot of the frame
      const card = new THREE.Mesh(new THREE.PlaneGeometry(.36, .09), new THREE.MeshBasicMaterial({map: plaqueTex((c, cw, ch) => {
        const title = ctx.title(st.seat.work); c.textAlign = 'center'; c.fillStyle = '#1e1a17'; fit(c, title, 700, 104, '"Amatic SC"', cw - 50, 40); c.fillText(title, cw / 2, ch / 2 + 34);
      })}));
      card.position.set(0, .018, .036); card.rotation.z = st.s * .03; lean.add(card);
    }
    items.push(itemOf(p, st.seat, f, center, normal, W(new THREE.Vector3(0, 0, st.s)), fr => {
      // square on to the photo, as close as the screen needs: the photo fills the part of the screen the card leaves free
      const m = fr.wide ? .5 : .03, dist = Math.max(1.05, (f.fh + m) / (fr.fhN * fr.tanV), (f.fw + m) / (fr.fwN * fr.tanH));
      return aimFrom(center.clone().addScaledVector(tilt, dist), center, fr);
    }));
  });

  /* ---------- the end wall: the room's sign and the contest photos ---------- */
  PRINTS.forEach((pr, k) => {
    const p = photo(pr.id); if (!p) return;
    const x = ((PRINTS.length - 1) / 2 - k) * 1.9, g = new THREE.Group(); g.position.set(x, 1.0, zb + .02); add(g);
    const f = framed(p, g, 1.3);
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(f.fw * 3 + .4, 2.8), flat(poolTex, true)); glow.position.set(0, f.fh / 2 + .2, -.012); g.add(glow);
    if (p.year) { // the contest's year on a card under the photo
      const card = new THREE.Mesh(new THREE.PlaneGeometry(.4, .1), new THREE.MeshBasicMaterial({map: plaqueTex((c, cw, ch) => {
        const line = ctx.events() + ' · ' + p.year; c.textAlign = 'center'; c.direction = ctx.rtl() ? 'rtl' : 'ltr'; c.fillStyle = '#1e1a17'; fit(c, line, 400, 52, fontOf(), cw - 50, 18); c.fillText(line, cw / 2, ch / 2 + 18);
      })}));
      card.position.set(0, -.12, .01); g.add(card);
    }
    g.updateMatrixWorld(true);
    const center = f.pic.getWorldPosition(new THREE.Vector3()), normal = W(new THREE.Vector3(0, 0, 1));
    items.splice(N + k, 0, itemOf(p, pr, f, center, normal, W(new THREE.Vector3(-1, 0, 0)), fr => {
      const m = fr.wide ? .5 : .1, dist = Math.max(1.3, (f.fh + m) / (fr.fhN * fr.tanV), (f.fw + m) / (fr.fwN * fr.tanH));
      return aimFrom(center.clone().addScaledVector(normal, dist), center, fr);
    }));
  });
  const sign = (s, x, y, z, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(5, 1.25), new THREE.MeshBasicMaterial({transparent: true, map: textTex(1600, 400, ctx.drawSign)})); m.scale.setScalar(s); m.position.set(x, y, z); m.rotation.y = ry; add(m); };
  sign(1, 0, 3.55, zb + .02, 0);
  // over the doorway, inside: the way back to the lobby
  { const m = new THREE.Mesh(new THREE.PlaneGeometry(5, 1.25), new THREE.MeshBasicMaterial({transparent: true, map: textTex(1600, 400, ctx.drawBack || ctx.drawSign)})); m.scale.setScalar(.78); m.position.set(0, 3.82, zf - WALL / 2 - .01); m.rotation.y = Math.PI; add(m); }

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
    // where you can walk, in the room's own frame [x0, z0, x1, z1]: the aisle between the chairs, and in front of the end wall
    walk: [[-(HW - CHAIR.x - .75), sz(N - 1) - 1, HW - CHAIR.x - .75, z0 + 1], [-(HW - .45), zb + .6, HW - .45, sz(N - 1) - 1], [-(HW - .45), z0 + 1, HW - .45, zf - .5]],
    // at the doorway, looking down the aisle
    entrance: (() => { const d = W(new THREE.Vector3(0, 0, -1)); return {pos: group.localToWorld(new THREE.Vector3(0, 1.65, zf - 1.2)), yaw: Math.atan2(-d.x, -d.z), pitch: -.04}; })(),
    update() {},
    resize() { const [w, h] = rtSize(); for (const m of mirrors) m.getRenderTarget().setSize(w, h); }
  };
}
