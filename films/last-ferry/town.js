// The set: a Jiangnan water-town river crossing in autumn, lit five ways (dawn, noon, dusk, night storm, warm dawn).
// One scene; every shot's camera, light state and blocking is computed from t here.
import * as THREE from 'three';
import { PX, PPM, ramp, hex, h2, fbm, texOf, cobbles, rock, woodPlanks, billboard, glow, blob, mulberry, radialTex } from './px.js';
import { mat, mesh, box, mats } from './kit.js';
import { sky, stars, sea, particles, rain, flick } from './fx.js';
import { makeChar, SPX, PAL } from './chars.js';
import { T, SHOTS, shotAt, BOAT_TEXT } from './timeline.js';
import { clamp, seg, ss, eio, eo, lerp, track } from '/core/lib.js';

const V3 = (a) => new THREE.Vector3(...a);
const WATER = -1.2;

// ———————————————————————— textures of this set ————————————————————————
function whitewash(w, h, o = {}) {   // whitewashed wall: pale plaster, grey water stains toward the bottom, a dark plinth
  const P = new PX(w, h), s = o.seed ?? 1, R = ramp(['#6e6e72', '#9a9a9c', '#c4c2bc', '#e2dfd6', '#f3f1ea']), D = ramp(['#2a2a30', '#3e3e46', '#55555c']);
  P.fill((x, y) => { const v = y / h; if (v > .88) return D(.5 + (h2(x, y, s) - .5) * .3, x, y); let n = .72 + (fbm(x * .12, y * .12, s) - .5) * .35 - Math.max(0, v - .5) * .55 * fbm(x * .05, y * .3, s + 2); if (h2(x, y, s + 1) > .992) n -= .3; return R(n, x, y); });
  return P.done();
}
function tiles(w, h, o = {}) {   // black-grey curved roof tiles: rows of half-cylinders, light on the top edge
  const P = new PX(w, h), s = o.seed ?? 3, R = ramp(o.cols ?? ['#0f1216', '#1c2026', '#2c3138', '#3e444c', '#555c64']), rh = 6, cw = 5;
  P.fill((x, y) => { const row = Math.floor(y / rh), yy = y % rh, xx = (x + (row % 2) * 2) % cw; let v = .25 + (1 - yy / rh) * .45 + (h2(Math.floor((x + (row % 2) * 2) / cw), row, s) - .5) * .18; if (yy === 0) v = .9; if (yy === rh - 1) v = .05; if (xx === 0) v -= .2; return R(v, x, y); });
  return P.done();
}
function slabs(w, h, o = {}) {   // stone slab lane: long flat stones with joints
  const P = new PX(w, h), s = o.seed ?? 5, R = ramp(o.cols ?? ['#2a2c30', '#3f4246', '#565a5e', '#6c7074', '#84888a']), bw = 16, bh = 8;
  P.fill((x, y) => { const row = Math.floor(y / bh), off = (row % 2) * 8, col = Math.floor((x + off) / bw), xx = (x + off) % bw, yy = y % bh, id = h2(col, row, s); let v = .4 + id * .35 + (fbm(x * .2, y * .2, s) - .5) * .25; if (yy === 0 || xx === 0) v = .06; else if (yy === 1) v += .1; if (o.wet) v = v * .75 + ((x * 7 + y * 3) % 11 === 0 ? .3 : 0); return R(v, x, y); });
  return P.done();
}
function concrete(w, h, o = {}) {
  const P = new PX(w, h), s = o.seed ?? 7, R = ramp(['#4e4e52', '#66666a', '#7e7e82', '#95959a', '#aaaab0']);
  P.fill((x, y) => { let v = .55 + (fbm(x * .1, y * .1, s) - .5) * .4 + (h2(x, y, s) - .5) * .1; if (y % 24 === 0 || x % 48 === 0) v -= .3; return R(v, x, y); });
  return P.done();
}
function barrier(w, h) {   // red-white construction barrier stripes
  const P = new PX(w, h), R = ramp(['#8a1a18', '#c42a22', '#e84a40']), Wt = ramp(['#9a9a9a', '#d4d4d4', '#f4f4f4']);
  P.fill((x, y) => { const k = Math.floor((x + y) / 8) % 2; const v = .5 + (h2(x, y, 2) - .5) * .25; return k ? R(v, x, y) : Wt(v, x, y); });
  return P.done();
}
function mattex(w, h) {   // woven mat for the boat canopy
  const P = new PX(w, h), R = ramp(['#3a2a16', '#5e4626', '#7e6236', '#9c7c46']);
  P.fill((x, y) => { const k = ((x >> 2) + (y >> 2)) % 2; let v = .45 + k * .3 + (h2(x, y, 4) - .5) * .2; if (x % 4 === 0 || y % 4 === 0) v -= .2; return R(v, x, y); });
  return P.done();
}
function latticeWindow() {   // Chinese lattice window: wooden grid, warm paper panes (emissive)
  const P = new PX(14, 18), E = new PX(14, 18), F = ramp(['#1e120c', '#3a2416', '#55361e']), G = ramp(['#7a4a1c', '#d08a34', '#f6c060', '#ffe6a8']);
  P.fill((x, y) => { const fr = x === 0 || x === 13 || y === 0 || y === 17 || x % 4 === 2 && y % 6 !== 3 || y % 6 === 0 && x % 4 !== 0 || (x % 4 === 0 && y % 6 === 3); if (fr) return F(y === 0 || x === 0 ? .9 : .45, x, y); const v = .6 + (1 - y / 18) * .2 + (h2(x, y, 3) - .5) * .25; const c = G(v, x, y); E.set(x, y, c); return c; });
  return { map: texOf(P.done()), em: texOf(E.done()) };
}
let _lat = null;
function winMat() {
  if (_lat) return _lat;
  const L = latticeWindow();
  _lat = new THREE.MeshStandardMaterial({ map: L.map, emissiveMap: L.em, emissive: new THREE.Color('#ffffff'), emissiveIntensity: 0, roughness: .7 }); return _lat;
}
function foliageCanvas(cols, seed, w = 44, h = 36) {   // a clump of leaves: fbm-thresholded blob, lit from the upper left
  const P = new PX(w, h), R = ramp(cols, .3);
  P.fill((x, y) => { const u = x / w - .5, v = y / h - .5, d = Math.hypot(u * 1.1, v * 1.3), n = fbm(x * .18, y * .18, seed, 4); if (d > .5 + (n - .5) * .5) return null; if (h2(x, y, seed) > .94) return null; return R(.35 + n * .6 - u * .25 - v * .35, x, y); });
  return P.done();
}
function willowCanvas(seed, w = 40, h = 64) {   // hanging willow fronds
  const P = new PX(w, h), R = ramp(['#2e4a1c', '#4a6a28', '#6a8a36', '#90a850', '#b8c870'], .3), Rn = mulberry(seed);
  for (let i = 0; i < 22; i++) { let x = 4 + Rn() * (w - 8); const len = 20 + Rn() * 40, sway = (Rn() - .5) * .3; for (let y = 0; y < len; y++) { P.set(Math.round(x), y, R(.35 + y / len * .5 + (Rn() - .5) * .2, x, y)); if (y % 3 === 0 && Rn() < .5) P.set(Math.round(x) + (Rn() < .5 ? 1 : -1), y, R(.6, x, y)); x += sway; } }
  return P.done();
}
function lanternCanvas(lit, S = 3) {   // a red paper lantern 10×14 units: dark caps, red paper, the flame glow inside scaled by lit
  const P = new PX(10 * S, 14 * S), E = new PX(10 * S, 14 * S), R = ramp(['#4a0e0c', '#8a1c14', '#c43422', '#ec6038', '#ffb070', '#fff0c0'], .3), K = ramp(['#1a1a1e', '#3a3a40', '#5a5a60']);
  P.fill((x, y) => { const u = x / (10 * S) - .5, v = y / (14 * S); if (v < .1 || v > .9) { if (Math.abs(u) < .22) return K(.5 - Math.abs(u), x, y); return null; } const vv = (v - .5) / .4; const edge = Math.abs(u) / (.5 * Math.sqrt(Math.max(0, 1 - vv * vv))); if (edge > 1) return null; const rib = Math.floor(x / S) % 3 === 0 ? -.12 : 0; const base = .32 + (1 - edge) * .25 + rib; const glowv = lit * (1 - Math.hypot(u * 1.4, (v - .5) * 1.6)) * 1.3; const val = Math.min(.99, base + Math.max(0, glowv) * .55); const c = R(val, x, y); if (lit > .02 && glowv > .25) E.set(x, y, R(Math.min(.99, .55 + glowv * .4), x, y)); return c; });
  P.outline(.3);
  return { map: texOf(P.done()), em: texOf(E.done()) };
}
function paperBoatCanvas(S, text) {   // side view of a folded paper boat, optional written characters on the hull
  const w = 16 * S, h = 9 * S, P = new PX(w, h), R = ramp(['#b8b4a8', '#dcd8cc', '#f4f0e6', '#fffdf6'], .3);
  P.fill((x, y) => { const u = x / w, v = y / h; if (v > .62) { const hw = .5 - (v - .62) * .45; if (Math.abs(u - .5) > hw) return null; return R(.7 - (v - .62) * .8 + (u > .5 ? -.1 : .05), x, y); } const sw = (v - .08) * .5; if (v < .08 || Math.abs(u - .5) > sw) return null; return R(.85 - (u > .5 ? .15 : 0), x, y); });
  P.rect(0, Math.round(.62 * h), w, Math.max(1, S >> 1), hex('#a8a498'));
  if (text && S >= 4) {   // write the characters with the CJK font, thresholded to pixels
    const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
    g.fillStyle = '#000'; g.font = `700 ${Math.round(2.2 * S)}px 'Noto Serif SC'`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, w / 2, h * .81);
    const d = g.getImageData(0, 0, w, h).data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 110 && P.get(x, y)) P.set(x, y, hex('#2a2430'));
  }
  P.outline(.25);
  return texOf(P.done());
}

// ———————————————————————— set pieces ————————————————————————
function jHouse(o) {   // Jiangnan house: whitewashed box, black tile roof, stepped gable walls, lattice windows, a dark door
  const g = new THREE.Group(), { w, d, h } = o, wm = o.wm, rm = o.rm, rh = o.rh ?? d * .32;
  const body = box(w, h, d, wm); g.add(body);
  const ov = .4, sl = Math.hypot(d / 2 + ov, rh);
  for (const s of [-1, 1]) { const pg = new THREE.BoxGeometry(w + ov * 2, .14, sl); pg.translate(0, 0, s * sl / 2); const m = mesh(pg, rm); m.rotation.x = s * Math.atan2(rh, d / 2); m.position.set(0, h + rh + .05, 0); g.add(m); }
  const ridge = box(w + ov * 2 + .2, .2, .28, rm); ridge.position.set(0, h + rh, 0); g.add(ridge);
  for (const s of [-1, 1]) { const tri = new THREE.Shape([new THREE.Vector2(-d / 2, 0), new THREE.Vector2(d / 2, 0), new THREE.Vector2(0, rh)]); const tg = new THREE.ShapeGeometry(tri); tg.rotateY(Math.PI / 2 * s); tg.translate(s * w / 2, h, 0); g.add(mesh(tg, wm)); }
  if (o.gable) for (const s of [-1, 1]) {   // 马头墙: stepped parapet rising above the roof at each end
    for (let i = 0; i < 3; i++) { const gw = d * (1 - i * .3), gh = h + rh * (.35 + i * .35) + .3; const b = box(.32, gh, gw, wm); b.position.set(s * (w / 2 + .1), 0, 0); g.add(b); const cap = box(.5, .12, gw + .3, rm); cap.position.set(s * (w / 2 + .1), gh, 0); g.add(cap); }
  }
  const wins = [];
  (o.windows ?? []).forEach(([x, y, z, ry]) => { const q = new THREE.Mesh(new THREE.PlaneGeometry(.8, 1.0), winMat()); q.position.set(x, y, z ?? d / 2 + .02); if (ry) q.rotation.y = ry; g.add(q); wins.push(q);
    const sill = box(.95, .07, .16, mats().beam, { cast: false }); sill.position.set(x, y - .55, (z ?? d / 2 + .02) + .04); if (ry) { sill.rotation.y = ry; sill.position.set(x + Math.sin(ry) * .04, y - .55, z); } g.add(sill); });
  if (o.door != null) { const dm = box(1.0, 1.9, .12, mats().plankDark); dm.position.set(o.door, 0, d / 2 + .02); g.add(dm); }
  g.position.set(o.x, o.y ?? 0, o.z); g.rotation.y = o.ry ?? 0; g.userData.windows = wins; return g;
}
function tree(kind, seed, scale = 1) {   // trunk + foliage billboards (tallow tree: red-orange autumn; willow: hanging fronds)
  const g = new THREE.Group(), R = mulberry(seed);
  const trunk = mesh(new THREE.CylinderGeometry(.14 * scale, .22 * scale, 2.6 * scale, 7).translate(0, 1.3 * scale, 0), mats().beam); g.add(trunk);
  const leaves = [];
  if (kind === 'tallow') {
    const cols = [['#5a1408', '#9a2a10', '#d04a18', '#f07828', '#ffb040'], ['#4a1206', '#8a2410', '#c84414', '#ec6c20', '#ffa838']];
    for (let i = 0; i < 4; i++) { const t = texOf(foliageCanvas(cols[i % 2], seed + i)); const b = billboard(t, 2.6 * scale * (.8 + R() * .4), 2.1 * scale * (.8 + R() * .4), { shadow: true }); b.position.set((R() - .5) * 1.6 * scale, 1.9 * scale + R() * 1.2 * scale, (R() - .5) * .8 * scale); g.add(b); leaves.push(b); }
  } else {
    const t = texOf(willowCanvas(seed));
    for (let i = 0; i < 3; i++) { const b = billboard(t, 2.0 * scale, 3.2 * scale, { shadow: true, ay: 1 }); b.position.set((R() - .5) * 1.2 * scale, 3.1 * scale, (R() - .5) * .6 * scale); g.add(b); leaves.push(b); }
    const crown = texOf(foliageCanvas(['#2a4218', '#46642a', '#6a8838', '#92a850', '#bcc87a'], seed + 9, 48, 24));
    const c = billboard(crown, 3.4 * scale, 1.7 * scale, { shadow: true }); c.position.set(0, 2.5 * scale, 0); g.add(c); leaves.push(c);
  }
  g.userData.leaves = leaves; return g;
}

// ———————————————————————— the set ————————————————————————
export function buildTown() {
  const scene = new THREE.Scene(), MM = mats();
  scene.fog = new THREE.FogExp2('#c8d4e0', .012);
  const SK = sky({ top: '#7a9cc8', mid: '#c9d6e4', hor: '#f0d8c0', moonI: 0 }); scene.add(SK.mesh);
  const ST = stars(700, 5); scene.add(ST);

  // —— lights ——
  const sun = new THREE.DirectionalLight('#ffd9b0', 1.6); sun.position.set(30, 12, -10); sun.target.position.set(0, 0, -8); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -42, right: 42, top: 42, bottom: -42, near: 1, far: 160 }); sun.shadow.bias = -.0006; sun.shadow.normalBias = .03; scene.add(sun, sun.target);
  const hemi = new THREE.HemisphereLight('#9fb6d8', '#5a5a60', .9); scene.add(hemi);
  const bolt = new THREE.DirectionalLight('#d8e4ff', 0); bolt.position.set(20, 50, 10); scene.add(bolt, bolt.target);
  const fill = new THREE.PointLight('#bcc8e8', 0, 8, 2); scene.add(fill);
  const lanL = new THREE.PointLight('#ffb050', 0, 12, 2); lanL.castShadow = true; lanL.shadow.mapSize.set(512, 512); lanL.shadow.bias = -.004; lanL.shadow.camera.near = .08; scene.add(lanL);
  const lanG = glow('#ffc070', .7, 1.2); scene.add(lanG);
  const doorL = new THREE.PointLight('#ffd090', 0, 16, 1.6); doorL.castShadow = true; doorL.shadow.mapSize.set(512, 512); doorL.shadow.bias = -.004; scene.add(doorL);
  const doorG = glow('#ffd8a0', 2.4, 1.2); doorG.visible = false; scene.add(doorG);
  const crackL = new THREE.PointLight('#ffb080', 0, 12, 2); scene.add(crackL);

  // —— materials ——
  const wallM = mat(whitewash(96, 96, { seed: 2 })), wallM2 = mat(whitewash(96, 96, { seed: 9 })), roofM = mat(tiles(96, 96, { seed: 3 })), roofM2 = mat(tiles(96, 96, { seed: 8, cols: ['#121418', '#1f2228', '#2f333a', '#42474e', '#5a6068'] }));
  const slabM = mat(slabs(96, 96, { seed: 5 })), stoneM = mat(rock(96, 96, { seed: 2, cols: ['#2a2b30', '#3c3d44', '#50525a', '#64666e', '#7a7c84'] })), concM = mat(concrete(96, 96)), deckM = mat(woodPlanks(96, 96, { pw: 5, len: 96, seed: 8, cols: ['#2a1a12', '#4a3020', '#684630', '#866040', '#a27a52'] }));
  const barM = mat(barrier(48, 48)), matM = mat(mattex(48, 48));
  const dirtM = mat(cobbles(96, 96, { seed: 9, cols: ['#2e2a22', '#45402f', '#5c553e', '#71694c', '#857c5c'] }));

  // —— banks ——
  const nearBank = mesh(new THREE.BoxGeometry(120, 2.4, 20).translate(-10, -1.2, 10), slabM); scene.add(nearBank);
  const nearWall = mesh(new THREE.BoxGeometry(120, 2.6, .6).translate(-10, -1.3, -.3), stoneM); scene.add(nearWall);
  const farBank = mesh(new THREE.BoxGeometry(160, 2.4, 24).translate(0, -1.2, -40), dirtM); scene.add(farBank);
  const farWall = mesh(new THREE.BoxGeometry(160, 2.6, .6).translate(0, -1.3, -27.7), stoneM); scene.add(farWall);
  // near pier: three stone steps down, a wooden jetty, a mooring post, the lantern post, a small roofed shelter at the top
  for (let i = 0; i < 3; i++) { const s = mesh(new THREE.BoxGeometry(3.2, .4, .9).translate(0, -.2 - i * .35, -.45 - i * .9), stoneM); scene.add(s); }
  const jetty = mesh(new THREE.BoxGeometry(2.6, .22, 5).translate(0, -.41, -4.9), deckM, { swap: true }); scene.add(jetty);
  for (let z = -2.8; z >= -7.2; z -= 2.2) for (const x of [-1.1, 1.1]) { const p = mesh(new THREE.CylinderGeometry(.12, .14, 2.2, 7).translate(x, -1.5, z), MM.beam); scene.add(p); }
  const post = box(.22, .9, .22, MM.plankDark); post.position.set(1.05, -.3, -6.6); scene.add(post);
  const lpost = box(.16, 2.6, .16, MM.plankDark); lpost.position.set(-1.1, -.3, -2.9); scene.add(lpost);
  const hook = box(.5, .08, .08, MM.plankDark); hook.position.set(-.9, 2.1, -2.9); scene.add(hook);
  // the shelter
  { const g = new THREE.Group(); for (const [x, z] of [[-1.5, .4], [1.5, .4], [-1.5, 2.6], [1.5, 2.6]]) { const p = box(.18, 2.7, .18, MM.plankDark); p.position.set(x, 0, z); g.add(p); }
    const r1 = new THREE.BoxGeometry(3.8, .12, 1.6); r1.translate(0, 0, -.7); const ra = mesh(r1, roofM2); ra.rotation.x = .35; ra.position.set(0, 3.15, 1.5); g.add(ra);
    const r2 = new THREE.BoxGeometry(3.8, .12, 1.6); r2.translate(0, 0, .7); const rb = mesh(r2, roofM2); rb.rotation.x = -.35; rb.position.set(0, 3.15, 1.5); g.add(rb);
    const rg = box(4.0, .16, .24, roofM2); rg.position.set(0, 3.35, 1.5); g.add(rg);
    const bench = box(2.6, .12, .4, MM.plank); bench.position.set(0, .45, 2.4); g.add(bench);
    scene.add(g); }
  const shLamp = new THREE.Mesh(new THREE.BoxGeometry(.22, .3, .22), new THREE.MeshStandardMaterial({ color: '#2a2016', emissive: '#ffb45a', emissiveIntensity: 0 })); shLamp.position.set(0, 2.55, 1.5); scene.add(shLamp);
  const shL = new THREE.PointLight('#ffae55', 0, 9, 2); shL.position.set(0, 2.45, 1.5); scene.add(shL); const shG = glow('#ffb25e', 1.0, 1.1); shG.position.copy(shLamp.position); shG.material.opacity = 0; scene.add(shG);
  // far steps up the far bank to the clinic lane
  for (let i = 0; i < 4; i++) { const s = mesh(new THREE.BoxGeometry(3.4, .35, .8).translate(2.5, -1.0 + i * .33, -27.6 - i * .55), stoneM); scene.add(s); }
  const lane2 = mesh(new THREE.BoxGeometry(3.0, .06, 7).translate(2.5, .03, -33), slabM); scene.add(lane2);

  // —— the river ——
  const SEA = sea(900, { ppm: 9, deep: '#1a3a3c', shallow: '#2c5a58', crest: '#8ab8b0' }); SEA.mesh.position.y = WATER; scene.add(SEA.mesh);

  // —— houses on the near bank (the town) ——
  const houses = [];
  const H = (o) => { const h = jHouse({ wm: o.alt ? wallM2 : wallM, rm: o.alt ? roofM2 : roofM, ...o }); scene.add(h); houses.push(h); return h; };
  H({ x: -5.5, z: 5.2, w: 6.5, d: 5.2, h: 5.6, gable: 1, door: 1.2, windows: [[-1.6, 2.0], [-1.6, 4.3], [1.6, 4.3]] });
  H({ x: 2.6, z: 5.6, w: 5.2, d: 5.0, h: 4.6, door: -1.0, windows: [[1.2, 2.0], [-1.2, 3.6], [1.2, 3.6]], alt: 1 });
  H({ x: 8.6, z: 6.2, w: 5.0, d: 5.4, h: 5.2, gable: 1, windows: [[0, 2.1], [-1.2, 4.0], [1.3, 4.0]] });
  H({ x: -13.5, z: 5.0, w: 5.6, d: 5.4, h: 4.8, door: .6, windows: [[-1.5, 2.1], [-1.5, 3.9], [1.5, 3.9]], alt: 1 });
  H({ x: -19.5, z: 5.6, w: 5.4, d: 5.0, h: 5.8, gable: 1, windows: [[0, 2.2], [-1.4, 4.4], [1.4, 4.4]] });
  H({ x: -25.5, z: 4.8, w: 5.0, d: 5.2, h: 4.4, door: -.8, windows: [[1.2, 2.0], [0, 3.5]] });
  H({ x: -1.5, z: 11.5, w: 6.0, d: 5.6, h: 6.4, gable: 1, windows: [[-1.5, 3.2], [1.5, 3.2], [0, 5.2]] });
  H({ x: -9.5, z: 12, w: 5.6, d: 5.2, h: 5.4, windows: [[-1.2, 2.4], [1.2, 4.2]], alt: 1 });
  H({ x: 5.0, z: 12.2, w: 5.4, d: 5.4, h: 6.0, gable: 1, windows: [[0, 2.6], [-1.3, 4.6], [1.3, 4.6]] });
  H({ x: -17, z: 12.5, w: 6.2, d: 5.4, h: 5.0, windows: [[-1.6, 2.2], [1.6, 3.8]] });
  H({ x: -24, z: 12, w: 5.0, d: 5.0, h: 6.2, gable: 1, windows: [[0, 2.4], [0, 4.6]], alt: 1 });
  H({ x: -32, z: 6, w: 5.2, d: 5.2, h: 5.0, windows: [[-1.3, 2.2], [1.3, 3.8]] });
  H({ x: 22, z: 8, w: 5.4, d: 5.2, h: 5.6, gable: 1, windows: [[-1.3, 2.4], [1.3, 4.2]] });
  // far bank: fewer houses, the clinic in the middle
  const clinic = H({ x: 2.5, z: -37.5, w: 6.4, d: 5.2, h: 4.4, gable: 1, door: null, windows: [[-2.0, 2.0], [2.0, 2.0]], alt: 1 });
  H({ x: -6.5, z: -39, w: 5.4, d: 5.2, h: 5.0, windows: [[-1.2, 2.2], [1.2, 3.8]] });
  H({ x: 11, z: -39.5, w: 5.0, d: 5.0, h: 4.6, gable: 1, windows: [[0, 2.2]], alt: 1 });
  H({ x: -14, z: -37, w: 5.6, d: 5.2, h: 5.4, windows: [[-1.4, 2.4], [1.4, 4.0]] });
  H({ x: 20, z: -38, w: 5.2, d: 5.2, h: 5.2, windows: [[0, 2.4], [0, 4.0]], alt: 1 });
  // the clinic door (opens at night), its warm interior and the sign
  const doorG2 = new THREE.Group(); const doorM = box(1.1, 2.1, .1, MM.plankDark); doorM.position.set(.55, 0, 0); doorG2.add(doorM); doorG2.position.set(2.5 - .55, 0, -37.5 + 2.6 + .06); scene.add(doorG2);
  const interior = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 2.1), new THREE.MeshBasicMaterial({ color: '#e8b070' })); interior.position.set(2.5, 1.05, -37.5 + 2.6 - .02); interior.visible = false; scene.add(interior);
  // the sign 卫生所 above the door (text drawn with the CJK font, thresholded to pixels, on a white board)
  { const c = document.createElement('canvas'); c.width = 64; c.height = 20; const g = c.getContext('2d'); g.fillStyle = '#eeeae0'; g.fillRect(0, 0, 64, 20); g.fillStyle = '#b02020'; g.font = "700 15px 'Noto Serif SC'"; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('卫生所', 32, 11);
    const tx = new THREE.CanvasTexture(c); tx.magFilter = tx.minFilter = THREE.NearestFilter; tx.colorSpace = THREE.SRGBColorSpace;
    const sg = new THREE.Mesh(new THREE.PlaneGeometry(1.8, .56), new THREE.MeshStandardMaterial({ map: tx, roughness: .8 })); sg.position.set(2.5, 2.65, -37.5 + 2.6 + .05); scene.add(sg); }
  // lamp posts on the lane (lit from dusk)
  const lamps = [];
  for (const [x, z] of [[-8, .7], [6.2, .7], [-22, .8]]) { const g = new THREE.Group(); const pole = box(.14, 3.4, .14, MM.plankDark); g.add(pole); const arm = box(.7, .08, .08, MM.plankDark); arm.position.set(-.3, 3.2, 0); g.add(arm);
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(.28, .3, .28), new THREE.MeshStandardMaterial({ color: '#2a2016', emissive: '#ffb45a', emissiveIntensity: 0 })); lamp.position.set(-.6, 3.0, 0); g.add(lamp);
    const L = new THREE.PointLight('#ffae55', 0, 11, 2); L.position.set(-.6, 2.9, .2); g.add(L); const gl = glow('#ffb25e', .9, 1.0); gl.position.copy(lamp.position); g.add(gl);
    g.position.set(x, 0, z); scene.add(g); lamps.push({ g, L, lamp, gl }); }
  // red paper lanterns at two doors (festive props, dim practicals)
  const redLans = [];
  for (const [x, y, z] of [[-4.2, 2.6, 2.7], [-6.8, 2.6, 2.7], [1.5, 2.4, 3.1]]) { const m = new THREE.Mesh(new THREE.SphereGeometry(.22, 8, 6), new THREE.MeshStandardMaterial({ color: '#c42a1e', emissive: '#ff5a30', emissiveIntensity: 0 })); m.scale.y = 1.25; m.position.set(x, y, z); scene.add(m); redLans.push(m); }
  // window point lights (near the pier, for the night)
  const winL = [[-5.5, 2.2, 2.4], [2.6, 2.1, 3.0], [8.6, 2.2, 3.4], [-13.5, 2.2, 2.2], [-19.5, 2.3, 2.9], [-6.5, 2.2, -36.3], [11, 2.2, -36.9]].map(([x, y, z]) => { const L = new THREE.PointLight('#ff9d4a', 0, 8, 2); L.position.set(x, y, z); scene.add(L); return L; });

  // side canal with a stone arch bridge (west of the pier)
  { const cut = mesh(new THREE.BoxGeometry(3.2, 2.6, 16).translate(-10, -1.3, 8), stoneM); cut.position.y = -2.4; scene.add(cut);   // (the water of the canal is the same plane)
    const canal = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 14), new THREE.MeshBasicMaterial({ color: '#1d3b3c' })); canal.rotation.x = -Math.PI / 2; canal.position.set(-10, WATER + .01, 8); scene.add(canal);
    const shp = new THREE.Shape(); shp.moveTo(-2.4, -2.2); shp.lineTo(-2.4, .5); shp.lineTo(2.4, .5); shp.lineTo(2.4, -2.2); shp.lineTo(1.7, -2.2); shp.absarc(0, -2.2, 1.7, 0, Math.PI, false); shp.lineTo(-2.4, -2.2);
    const ag = new THREE.ExtrudeGeometry(shp, { depth: 2.4, bevelEnabled: false }); ag.rotateY(Math.PI / 2); ag.translate(-11.2, 0, 1.2); const arch = mesh(ag, stoneM); scene.add(arch);
    for (const s of [-1, 1]) { const rail = box(.16, .5, 4.4, stoneM); rail.position.set(-10 + s * 1.3, .5, 2.4); scene.add(rail); } }
  // moored boats along the near wall (props)
  function smallBoat(x, z, ry) { const g = new THREE.Group(); const sh = new THREE.Shape(); sh.moveTo(-1.6, -.5); sh.lineTo(1.3, -.5); sh.quadraticCurveTo(2.0, 0, 1.3, .5); sh.lineTo(-1.6, .5); sh.quadraticCurveTo(-2.0, 0, -1.6, -.5); const hg = new THREE.ExtrudeGeometry(sh, { depth: .5, bevelEnabled: false }); hg.rotateX(-Math.PI / 2); hg.translate(0, -.1, 0); g.add(mesh(hg, deckM)); const cv = mesh(new THREE.CylinderGeometry(.55, .55, 1.6, 10, 1, true, 0, Math.PI).rotateZ(Math.PI / 2).rotateY(Math.PI / 2).translate(-.2, .35, 0), matM); g.add(cv); g.position.set(x, WATER + .1, z); g.rotation.y = ry; scene.add(g); return g; }
  smallBoat(-6.5, -1.4, .1); smallBoat(-21, -1.6, -.08); smallBoat(9, -31.5 + 4, 3.0);
  // trees
  const trees = [];
  const TR = (k, x, z, s, sc) => { const t = tree(k, s, sc); t.position.set(x, 0, z); scene.add(t); trees.push(t); };
  TR('tallow', -4.2, 1.4, 11, 1.25); TR('willow', -16.5, .9, 12, 1.1); TR('willow', 7.6, 1.0, 13, 1.0); TR('tallow', -29, 1.6, 14, 1.0);
  TR('willow', -5.5, -30.5, 15, 1.1); TR('tallow', 9.5, -31.5, 16, 1.0); TR('willow', 18, -31, 17, 1.2); TR('tallow', -20, -30.8, 18, .9);
  // distant hills (north), low
  { const P = new PX(400, 60), c = hex('#6a7a90'); for (let x = 0; x < 400; x++) { const top = 60 * (1 - (.3 + .55 * fbm(x * .015, 0, 21, 4))); for (let y = Math.floor(top); y < 60; y++) P.set(x, y, y - top < 2 ? [c[0] + 20, c[1] + 20, c[2] + 24] : c); }
    const m = new THREE.Mesh(new THREE.PlaneGeometry(520, 78).translate(0, 39, 0), new THREE.MeshBasicMaterial({ map: texOf(P.done()), transparent: true, alphaTest: .5, fog: true })); m.position.set(0, -2, -260); scene.add(m); }

  // —— the new bridge: approaches, piers, deck segments (one missing until dawn), fence, a crane barge with a red lamp ——
  const BX = 14, DECK = 5.5;
  const piers = [-2, -9, -16, -23];
  for (const z of piers) for (const x of [BX - 2, BX + 2]) { const p = mesh(new THREE.BoxGeometry(1.4, DECK + 2.4, 1.6).translate(x, (DECK + 2.4) / 2 - 2.4, z), concM); scene.add(p); const cap = mesh(new THREE.BoxGeometry(6.2, .5, 1.8).translate(BX, DECK - .25, z), concM); scene.add(cap); }
  const spans = [[4, -2], [-2, -9], [-9, -16], [-16, -23], [-23, -32]].map(([a, b]) => { const g = mesh(new THREE.BoxGeometry(6, .7, Math.abs(a - b)).translate(BX, DECK + .35, (a + b) / 2), concM); scene.add(g); for (const s of [-1, 1]) { const r = mesh(new THREE.BoxGeometry(.16, .9, Math.abs(a - b)).translate(BX + s * 2.95, DECK + 1.15, (a + b) / 2), concM); scene.add(r); g.userData.rail = g.userData.rail || []; g.userData.rail.push(r); } return g; });
  const missing = spans[2];
  const approach = (z0, z1, dir) => { const L = Math.abs(z1 - z0), g = new THREE.BoxGeometry(6, .7, Math.hypot(L, DECK)); const m = mesh(g, concM); m.position.set(BX, DECK / 2 + .35, (z0 + z1) / 2); m.rotation.x = dir * Math.atan2(DECK, L); scene.add(m); for (const s of [-1, 1]) { const r = mesh(new THREE.BoxGeometry(.16, .9, Math.hypot(L, DECK)), concM); r.position.set(BX + s * 2.95, DECK / 2 + 1.15, (z0 + z1) / 2); r.rotation.x = dir * Math.atan2(DECK, L); scene.add(r); } return m; };
  approach(4, 13, 1); approach(-32, -41, -1);
  // fences: at the near approach foot (until dawn) and at both edges of the gap
  const fences = [];
  const fence = (x, y, z, ry) => { const f = mesh(new THREE.BoxGeometry(5.6, 1.0, .12).translate(0, .5, 0), barM); f.position.set(x, y, z); f.rotation.y = ry; scene.add(f); fences.push(f); const l = box(.1, 1.1, .1, MM.plankDark); l.position.set(x - 2.7, y, z); scene.add(l); fences.push(l); const l2 = l.clone(); l2.position.x = x + 2.7; scene.add(l2); fences.push(l2); };
  fence(BX, .0, 13.6, 0); fence(BX, DECK + .7, -9.1, 0); fence(BX, DECK + .7, -15.9, 0);
  // crane barge beside the gap
  const barge = new THREE.Group();
  { barge.add(mesh(new THREE.BoxGeometry(5, 1.0, 7).translate(0, .5, 0), concM)); const tw = mesh(new THREE.BoxGeometry(.9, 9, .9).translate(0, 5.5, 0), mat(barrier(48, 48))); tw.material = new THREE.MeshStandardMaterial({ color: '#c8a020', roughness: .8 }); barge.add(tw);
    const boom = mesh(new THREE.BoxGeometry(.4, .4, 9).translate(0, 0, -4), concM); boom.material = tw.material; boom.position.set(0, 10, 0); boom.rotation.x = .5; barge.add(boom);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(.22, 8, 6), new THREE.MeshStandardMaterial({ color: '#400000', emissive: '#ff2020', emissiveIntensity: 0 })); lamp.position.set(0, 10.4, 0); barge.add(lamp); barge.userData.lamp = lamp;
    const lg = glow('#ff3030', 1.6, 1); lg.position.copy(lamp.position); lg.material.opacity = 0; barge.add(lg); barge.userData.lg = lg; }
  barge.position.set(BX + 7, WATER - .4, -12.5); scene.add(barge);
  // the ribbon and its posts at the near approach foot (dawn)
  const ribbonG = new THREE.Group();
  { for (const s of [-1, 1]) { const p = box(.12, 1.3, .12, MM.plankDark); p.position.set(s * 2.9, 0, 0); ribbonG.add(p); }
    const rb = new THREE.Mesh(new THREE.PlaneGeometry(5.8, .22), new THREE.MeshStandardMaterial({ color: '#d81e1e', emissive: '#a01010', emissiveIntensity: .3, side: THREE.DoubleSide })); rb.position.set(0, 1.05, 0); ribbonG.add(rb); ribbonG.userData.rb = rb;
    const bow = new THREE.Mesh(new THREE.SphereGeometry(.26, 8, 6), rb.material); bow.position.set(0, 1.05, 0); ribbonG.add(bow); ribbonG.userData.bow = bow; }
  ribbonG.position.set(BX, 0, 14.2); ribbonG.visible = false; scene.add(ribbonG);
  const crackPole = box(.1, 3.2, .1, MM.plankDark); crackPole.position.set(BX - 4.2, 0, 15.5); crackPole.visible = false; scene.add(crackPole);

  // —— the ferry ——
  const boat = new THREE.Group();
  { const sh = new THREE.Shape(); sh.moveTo(-2.7, -.9); sh.lineTo(1.9, -.9); sh.quadraticCurveTo(2.9, -.3, 3.1, 0); sh.quadraticCurveTo(2.9, .3, 1.9, .9); sh.lineTo(-2.7, .9); sh.quadraticCurveTo(-3.2, 0, -2.7, -.9);
    const hg = new THREE.ExtrudeGeometry(sh, { depth: .62, bevelEnabled: false }); hg.rotateX(-Math.PI / 2); hg.rotateY(Math.PI / 2); hg.translate(0, -.3, 0);
    const hull = mesh(hg, mat(woodPlanks(96, 96, { pw: 4, len: 96, seed: 21, cols: ['#1a110c', '#34211a', '#52341f', '#704a2c', '#8e6236'] }))); boat.add(hull);
    const deck = mesh(new THREE.BoxGeometry(1.5, .08, 5).translate(0, .06, 0), deckM, { swap: true }); boat.add(deck);
    const gunL = mesh(new THREE.BoxGeometry(.16, .22, 5.6).translate(-.85, .42, .2), MM.beam); boat.add(gunL); const gunR = gunL.clone(); gunR.position.x = 1.7; boat.add(gunR);
    const canopy = mesh(new THREE.CylinderGeometry(.8, .8, 1.3, 12, 1, true, 0, Math.PI).rotateZ(Math.PI / 2).rotateY(Math.PI / 2).translate(0, .3, .7), matM); canopy.material.side = THREE.DoubleSide; boat.add(canopy);
    const oar = mesh(new THREE.CylinderGeometry(.04, .05, 3.6, 6).translate(0, -1.8, 0), MM.beam); oar.position.set(.55, 1.0, 2.9); boat.add(oar); boat.userData.oar = oar;
    const pole = box(.08, 1.45, .08, MM.plankDark); pole.position.set(-.62, .1, 2.15); boat.add(pole); const hook2 = box(.4, .06, .06, MM.plankDark); hook2.position.set(-.47, 1.5, 2.15); boat.add(hook2); }
  scene.add(boat);
  // the lantern: a billboard with 5 lit levels, carried by the boat's pole or set down on the pier
  const lanTex = [0, .25, .5, .75, 1].map(l => lanternCanvas(l, 3));
  const lantern = billboard(lanTex[4].map, 10 * SPX * .9, 14 * SPX * .9, { em: lanTex[4].em, emCol: '#ffffff', emI: 2.6, shadow: false, ay: 0 }); scene.add(lantern);
  const setLan = (lit) => { const i = Math.round(clamp(lit) * 4); lantern.material.map = lanTex[i].map; lantern.material.emissiveMap = lanTex[i].em; lantern.material.needsUpdate = false; };

  // paper boats: the small one on the water (three morning boats), the written one for the inserts
  const pbTex = paperBoatCanvas(2, null), pbTexBig = paperBoatCanvas(8, BOAT_TEXT), pbTexBig0 = paperBoatCanvas(8, null);
  const pboats = [0, 1, 2].map(() => { const b = billboard(pbTex, 16 * SPX * .55, 9 * SPX * .55, { shadow: false }); b.visible = false; scene.add(b); return b; });
  const pbBig = billboard(pbTexBig, 16 * SPX * .55, 9 * SPX * .55, { shadow: false }); pbBig.visible = false; scene.add(pbBig);
  const pbBig0 = billboard(pbTexBig0, 16 * SPX * .55, 9 * SPX * .55, { shadow: false }); pbBig0.visible = false; scene.add(pbBig0);

  // —— particles: mist, rain, splashes, confetti, smoke, candy ——
  const R2 = mulberry(77), mistP = [...Array(220)].map(() => [R2() * 70 - 35, R2() * 3 - 1, R2() * 44 - 32, R2() * 10]);
  const mist = particles(mistP.length, (i, t, o) => { const d = mistP[i]; o.x = d[0] + Math.sin(t * .15 + d[3]) * 1.2 + t * .1; o.y = d[1] + Math.sin(t * .25 + d[3] * 2) * .25; o.z = d[2]; o.a = mistK * (.2 + .15 * Math.sin(t * 1.1 + d[3])); o.s = .09; o.r = mistC[0]; o.g = mistC[1]; o.b = mistC[2]; }, { soft: 1 });
  let mistK = 1, mistC = [.85, .9, 1]; scene.add(mist);
  const RB = [-30, -3, -40, 30, 20, 16], RAIN = rain(2600, RB, { speed: 24, len: 1.1, opacity: .3 }); RAIN.visible = false; scene.add(RAIN);
  let splashK = 0; const splash = particles(260, (i, t, o) => { const ph = (t * 2.6 + h2(i, 4)) % 1, cyc = Math.floor(t * 2.6 + h2(i, 4)); o.x = splashBox[0] + h2(i, cyc, 7) * (splashBox[3] - splashBox[0]); o.z = splashBox[2] + h2(i, cyc, 9) * (splashBox[5] - splashBox[2]); o.y = splashBox[1] + ph * .18; o.a = (1 - ph) * .45 * splashK; o.s = .035; o.r = .75; o.g = .85; o.b = 1; });
  let splashBox = [-8, WATER + .02, -14, 8, 0, 0]; scene.add(splash);
  let confK = 0; const conf = particles(160, (i, t, o) => { const u = clamp((t - T.cracker - h2(i, 1) * 1.3) / 2.2); const a = h2(i, 2) * 6.28, sp = 1.5 + h2(i, 3) * 2.5; o.x = BX - 4.2 + Math.cos(a) * sp * u + Math.sin(t * 3 + i) * .1; o.z = 15.5 + Math.sin(a) * sp * u * .5 + .3; o.y = 2.6 + sp * u * 1.2 - 4.5 * u * u + .2; o.a = u > 0 && u < 1 ? 1.2 * (1 - u * .5) : 0; o.s = .05; o.r = 1.6; o.g = .25 + h2(i, 5) * .3; o.b = .2; }, { blend: THREE.NormalBlending });
  scene.add(conf);
  const smoke = particles(60, (i, t, o) => { const u = clamp((t - T.cracker - h2(i, 1) * 1.5) / 3.5); o.x = BX - 4.2 + (h2(i, 2) - .5) * 2 * u + u * 1.5; o.z = 15.5 + (h2(i, 3) - .5) * 1.5; o.y = 2.2 + u * 3; o.a = u > 0 && u < 1 ? .35 * Math.sin(u * Math.PI) : 0; o.s = .2 + u * .5; o.r = .8; o.g = .8; o.b = .85; }, { soft: 1, blend: THREE.NormalBlending });
  scene.add(smoke);
  const candy = new THREE.Mesh(new THREE.BoxGeometry(.09, .06, .06), new THREE.MeshStandardMaterial({ color: '#ff3a3a', emissive: '#801010', emissiveIntensity: .4 })); candy.visible = false; scene.add(candy);

  // —— characters ——
  const C = {
    lz: makeChar('lz', 'lz', 1), lz3: makeChar('lz', 'lz', 3),
    xs: makeChar('xs', 'xs', 1), xs3: makeChar('xs', 'xs', 3, { bundle: { bundle: 1, expr: 'fever' } }),
    k1: makeChar('k1', 'kid', 1), k2: makeChar('k2', 'kid', 1), k3: makeChar('k3', 'kid', 1),
    mo: makeChar('mo', 'mo', 1), mo3: makeChar('mo', 'mo', 3),
    br: makeChar('br', 'br', 1), gr: makeChar('gr', 'gr', 1), gu1: makeChar('gu1', 'gu', 1), gu2: makeChar('gu2', 'gu', 1), gu3: makeChar('gu3', 'drum', 1), gu4: makeChar('gu4', 'gu', 1),
    ob: makeChar('ob', 'ob', 1), ob3: makeChar('ob', 'ob', 3), ow: makeChar('ow', 'ow', 1), goose: makeChar('goose', 'goose', 1), goose3: makeChar('goose', 'goose', 3),
    nurse: makeChar('nurse', 'nurse', 1),
    t1: makeChar('t1', 'town', 1), t2: makeChar('t2', 'town', 1), t3: makeChar('t3', 'town', 1), t4: makeChar('t4', 'town', 1),
  };
  for (const k in C) { scene.add(C[k].root); C[k].root.visible = false; }
  const show = (ch, pos, frame, cam, flip = false) => { ch.root.visible = true; ch.root.position.copy(pos); ch.frame(frame); ch.face(cam, flip); };

  // ———————————————————————— light states per chapter ————————————————————————
  const LS = {
    morning: { sunC: '#ffd9b0', sunI: 2.1, sunD: [30, 11, -8], hemS: '#b4c6e0', hemG: '#6a6a70', hemI: 1.35, fog: '#c8d4e0', fogD: .009, skyT: '#7a9cc8', skyM: '#c9d6e4', skyH: '#f0d8c0', win: 0, lamp: 0, exp: 1.2, warm: .05, sat: 1.0, water: ['#2e4a4a', '#426460', '#7a9c96'], mist: 1, mistC: [.85, .9, 1], stars: 0 },
    noon:    { sunC: '#fff4e0', sunI: 2.3, sunD: [10, 40, 16], hemS: '#bcd0f0', hemG: '#6a6a60', hemI: 1.05, fog: '#d8e4ec', fogD: .005, skyT: '#4e86d0', skyM: '#9cc0ec', skyH: '#e8f0f4', win: 0, lamp: 0, exp: 1.15, warm: 0, sat: 1.08, water: ['#1e4a4c', '#2e6a66', '#7ab0a8'], mist: .15, mistC: [1, 1, 1], stars: 0 },
    dusk:    { sunC: '#ff9a50', sunI: 1.6, sunD: [-40, 9, 8], hemS: '#7a6aa8', hemG: '#3a2a3a', hemI: 1.1, fog: '#5a4a7a', fogD: .009, skyT: '#2a2a60', skyM: '#7a4a8a', skyH: '#ff9a60', win: 2.2, lamp: 1, exp: 1.1, warm: .12, sat: 1.05, water: ['#1a2a44', '#2e3e5c', '#c07050'], mist: .4, mistC: [.9, .7, .8], stars: .2 },
    night:   { sunC: '#6f86c0', sunI: .6, sunD: [-16, 30, -22], hemS: '#34447a', hemG: '#0a0a14', hemI: .8, fog: '#121a30', fogD: .017, skyT: '#050818', skyM: '#0e1a3a', skyH: '#24344e', win: 2.4, lamp: 1, exp: 1.1, warm: .0, sat: 1.0, water: ['#050c18', '#0e2232', '#3a6286'], mist: .3, mistC: [.6, .7, 1], stars: 1 },
    storm:   { sunC: '#6a7ca8', sunI: .5, sunD: [-16, 30, -22], hemS: '#3a4870', hemG: '#0a0a12', hemI: .75, fog: '#141a28', fogD: .021, skyT: '#0a0d18', skyM: '#1a2030', skyH: '#2a3040', win: 1.6, lamp: 1, exp: 1.05, warm: -.1, sat: .9, water: ['#070b14', '#101c2a', '#4a6080'], mist: .1, mistC: [.6, .7, 1], stars: 0 },
    dawn:    { sunC: '#ffb070', sunI: 1.9, sunD: [40, 7, -4], hemS: '#e0b8a0', hemG: '#5a4a50', hemI: .9, fog: '#e8c8b0', fogD: .008, skyT: '#6a8ac0', skyM: '#e6b8a0', skyH: '#ffd8a8', win: .4, lamp: 0, exp: 1.15, warm: .22, sat: 1.05, water: ['#2a3a44', '#4a5a5c', '#ffd0a0'], mist: .8, mistC: [1, .85, .7], stars: 0 },
  };
  const col = new THREE.Color();
  function applyLight(a, b, k, extra = {}) {   // blend two states by k, then apply (with a few per-frame modifiers)
    const L = (x, y) => lerp(x, y, k);
    const C3 = (x, y) => col.set(x).lerp(new THREE.Color(y), k);
    sun.color.copy(C3(a.sunC, b.sunC)); sun.intensity = L(a.sunI, b.sunI) * (extra.sunK ?? 1); sun.position.set(L(a.sunD[0], b.sunD[0]), L(a.sunD[1], b.sunD[1]), L(a.sunD[2], b.sunD[2]));
    hemi.color.copy(C3(a.hemS, b.hemS)); hemi.groundColor.copy(C3(a.hemG, b.hemG)); hemi.intensity = L(a.hemI, b.hemI) * (extra.hemK ?? 1) + (extra.hemAdd ?? 0);
    scene.fog.color.copy(C3(a.fog, b.fog)); scene.fog.density = L(a.fogD, b.fogD);
    SK.u.top.value.copy(C3(a.skyT, b.skyT)); SK.u.mid.value.copy(C3(a.skyM, b.skyM)); SK.u.hor.value.copy(C3(a.skyH, b.skyH)); SK.u.k.value = (extra.skyK ?? 1);
    ST.material.uniforms.k.value = L(a.stars, b.stars) * (extra.skyK ?? 1);
    const win = L(a.win, b.win) * (extra.winK ?? 1); winMat().emissiveIntensity = win; winL.forEach(l => l.intensity = win * 3.2 * (extra.winLK ?? 1));
    const lampK = L(a.lamp, b.lamp) * (extra.lampK ?? 1); lamps.forEach((l, i) => { l.L.intensity = 12 * lampK * flick(extra.t ?? 0, 5 + i * 3); l.lamp.material.emissiveIntensity = 4 * lampK; l.gl.material.opacity = lampK; }); shL.intensity = 7 * lampK * flick(extra.t ?? 0, 2); shLamp.material.emissiveIntensity = 4 * lampK; shG.material.opacity = lampK;
    redLans.forEach(m => m.material.emissiveIntensity = win * .8);
    SEA.u.deep.value.copy(C3(a.water[0], b.water[0])); SEA.u.shallow.value.copy(C3(a.water[1], b.water[1])); SEA.u.crest.value.copy(C3(a.water[2], b.water[2]));
    mistK = L(a.mist, b.mist) * (extra.mistK ?? 1); mistC = [L(a.mistC[0], b.mistC[0]), L(a.mistC[1], b.mistC[1]), L(a.mistC[2], b.mistC[2])];
    return { exp: L(a.exp, b.exp), warm: L(a.warm, b.warm), sat: L(a.sat, b.sat) };
  }
  function flash(t) { let f = 0; for (const [e, k] of [[T.flash1, 1], [T.flash2, .8], [T.flash3, 1], [T.flash4, .9], [T.flash5, .7], [T.flash6, .55]]) { const d = t - e; if (d < 0 || d > 1.3) continue; f = Math.max(f, k * (d < .14 ? .9 + .1 * Math.sin(d * 150) : d < .22 ? .1 : d < .3 ? .5 : .5 * Math.exp(-(d - .3) * 8))); } return f; }

  // ———————————————————————— blocking helpers ————————————————————————
  // the ferry's path per chapter: z along the crossing (near jetty −4.6 → far steps −25.6)
  const NEAR = -4.6, FAR = -25.4, BXP = 2.35;
  function boatPose(t) {
    let z = NEAR, x = BXP, heading = 0, bob = Math.sin(t * 1.1) * .03;
    if (t < 30) z = lerp(NEAR - 1.5, FAR, eo(seg(t, 1.0, T.hull)));
    else if (t < 50) z = lerp(NEAR, FAR, eo(seg(t, T.board + 1.5, 49.6)));
    else if (t < 68) z = lerp(NEAR, NEAR - 9, ss(seg(t, T.hop + .6, 68)));
    else if (t < T.castOff) z = NEAR;
    else if (t < 124.6) { const u = eo(seg(t, T.castOff + .4, T.arrive)); z = lerp(NEAR, FAR, u); const st = ss(seg(t, T.castOff, T.castOff + 3)) * (1 - ss(seg(t, T.arrive - 2, T.arrive))); x = BXP + st * (Math.sin(t * .9) * .9 + Math.sin(t * 2.3) * .3 + .8 * seg(t, T.castOff, T.arrive)); heading = st * (Math.sin(t * .9) * .18 + .12); bob = Math.sin(t * 2.4) * .09 * st + Math.sin(t * 1.1) * .03; }
    else z = NEAR;
    return { x, z, heading, bob };
  }
  // the three morning paper boats drift east with the current from where they were dropped
  function paperDrift(i, t) { const t0 = T.boatDown + i * 7.5; if (t < t0 - .6 || t > 30) return null; const bp = boatPose(Math.min(t, t0)); const u = Math.max(0, t - t0); return new THREE.Vector3(bp.x - 1.5 - u * .3 + Math.sin(u * .8) * .15, WATER + .02 + Math.sin(t * 2.2 + i) * .02, bp.z - 2.6 + u * .25); }

  // walk cycles / idles
  const walk4 = (t, fps = 8) => ['w0', 'w1', 'w2', 'w3'][Math.floor(t * fps) % 4];
  const idle2 = (t, hz = 1.4, a = 'idle0', b = 'idle1') => Math.floor(t * hz) % 2 ? b : a;
  const rowF = (t, pre = 'row') => pre + (Math.floor(t * 2.6) % 4);

  // ———————————————————————— camera tracks ————————————————————————
  const CAMS = {
    s2:  { p: track([[T.boatDown + 2.2, [-.4, -.6, -6.3]], [9.0, [-9, 9, -1]], [13.3, [-17, 19, 24]]]), l: track([[T.boatDown + 2.2, [.9, -1.2, -7.9]], [9.0, [2, 0, -8]], [13.3, [3, 0, -10]]]), fov: [30, 36] },
    s7:  { p: track([[32.5, [7.5, 9.0, 5.5]], [36.5, [6.5, 8.6, 4.5]]]), l: track([[32.5, [.5, -.3, -4.6]], [36.5, [.8, -.3, -4.9]]]), fov: [32, 32] },
    s10: { p: track([[45.5, [7, 32, -18]], [50, [7, 29, -17]]]), l: track([[45.5, [7, 0, -19]], [50, [7, 0, -18.5]]]), fov: [40, 38] },
    s11: { p: track([[52.25, [-15, 17, 21]], [56, [-12.5, 15.5, 18.5]]]), l: track([[52.25, [0, 0, -7]], [56, [1, 0, -7]]]), fov: [34, 34] },
    s15: { p: track([[70, [-12, 14, 15.5]], [73.5, [-11, 13.5, 14.5]]]), l: track([[70, [2, 0, -6]], [73.5, [2.2, 0, -6]]]), fov: [34, 34] },
    s18: { p: track([[81, [-11, 13.5, 14.5]], [84.6, [-10.5, 13, 14]]]), l: track([[81, [2.2, 0, -6]], [84.6, [2.4, 0, -6.4]]]), fov: [34, 34] },
    s24: { p: track([[102.6, [-21, 24, 27]], [106.6, [-19, 23, 25]]]), l: track([[102.6, [4, -1, -14]], [106.6, [4, -1, -15]]]), fov: [36, 35] },
    s31: { p: track([[126.85, [-9, 17, 34]], [130.6, [-7, 15.5, 31]]]), l: track([[126.85, [11, 1, 4]], [130.6, [11.5, 1.5, 3]]]), fov: [38, 36] },
  };

  // ———————————————————————— update ————————————————————————
  function update(t, shot, cam, post, renderer) {
    const V = post.vig.uniforms, id = shot.id;
    for (const k in C) C[k].root.visible = false;
    pboats.forEach(b => b.visible = false); pbBig.visible = pbBig0.visible = false; candy.visible = false;
    let focusP = null, aper = 300, tiltC = null, extra = { t };
    let lit = 0; lanG.visible = true; lantern.visible = true;    // the lantern's level
    let lanPos = null;                  // where the lantern is (null = on the boat's pole)
    let fl = 0, fillGut = 0; fill.color.set('#bcc8e8');
    const bp = boatPose(t); boat.position.set(bp.x, WATER + .25 + bp.bob, bp.z); boat.rotation.set(Math.sin(t * 1.7) * .02 * (t > T.castOff && t < T.arrive ? 2.5 : 1), bp.heading, Math.sin(t * 1.3) * .015);
    boat.userData.oar.rotation.x = -.45 + Math.sin(t * 2.6 * 1.57) * .35; boat.userData.oar.rotation.z = .25;
    const onBoat = (lx, ly, lz) => new THREE.Vector3(lx, ly, lz).applyAxisAngle(new THREE.Vector3(0, 1, 0), bp.heading).add(boat.position);
    // chapter light
    let LSt;
    if (t < 30) LSt = applyLight(LS.morning, LS.morning, 0, extra);
    else if (t < 50) LSt = applyLight(LS.noon, LS.noon, 0, extra);
    else if (t < 68) LSt = applyLight(LS.dusk, LS.night, ss(seg(t, 52, 68)) * .55, { ...extra, winK: 0 });
    else if (t < 124.6) {
      fl = flash(t);
      const stormK = ss(seg(t, T.wind, T.rain + 1.5)) * (1 - ss(seg(t, T.silence2, 124.6)) * .5);
      const darkK = t < T.castOff ? ss(seg(t, T.blow, T.blow + .4)) * (1 - ss(seg(t, T.wind, T.rain + 2)) * .6) * (1 - ss(seg(t, T.lit2, T.lit2 + 1.2))) : 0;   // after the blow-out the world drops; the storm's flashes and the relight bring it back
      const gutK = ss(seg(t, T.gutter, T.dark)) * (1 - ss(seg(t, T.revive, T.revive + 1.2)));                              // the lantern-dies beat: ambient to a quarter
      const amb = (1 - darkK * .5) * (1 - gutK * .7);
      LSt = applyLight(LS.night, LS.storm, stormK, { ...extra, hemK: amb, sunK: amb, skyK: (1 - darkK * .5) * (1 - gutK * .6) + fl * 2.2, winK: (1 - gutK * .7) * (1 - stormK * .4), lampK: 1 - gutK * .5 + (t > T.castOff ? -.3 : 0) });
      fillGut = gutK;
      hemi.intensity += fl * 1.8; bolt.intensity = fl * 10; sun.intensity += fl * .5;
      barge.userData.lamp.material.emissiveIntensity = Math.floor(t * 1.2) % 2 ? 5 : .2; barge.userData.lg.material.opacity = Math.floor(t * 1.2) % 2 ? 1 : .1;
      RAIN.visible = true; const rk = ss(seg(t, T.rain, T.rain + 2.5)) * (1 - ss(seg(t, T.silence2, 124.6)));
      RAIN.material.opacity = (.26 + fl * .35) * rk * (1 - gutK * .5); splashK = rk * (1 - gutK * .6);
      SEA.u.calm.value = -.7 * stormK; SEA.u.bright.value = (1 + fl * 2.5) * amb;
      LSt.exp += fl * .45; LSt.warm -= stormK * .08;
    } else { LSt = applyLight(LS.dawn, LS.dawn, 0, extra); RAIN.visible = false; splashK = 0; barge.userData.lamp.material.emissiveIntensity = 0; barge.userData.lg.material.opacity = 0; SEA.u.calm.value = .3; SEA.u.bright.value = 1.3; }
    if (t < 68 || t >= 124.6) { bolt.intensity = 0; RAIN.visible = false; SEA.u.bright.value = t < 68 ? 1 : 1.3; SEA.u.calm.value = t < 30 ? .5 : .2; }
    // the bridge: the gap closes at dawn; the fences go; the ribbon appears
    missing.visible = t >= 124.6; missing.userData.rail?.forEach(r => r.visible = t >= 124.6); fences.forEach(f => f.visible = t < 124.6); barge.visible = t < 124.6; ribbonG.visible = crackPole.visible = t >= 124.6;
    // trees sway in the storm
    const windK = t >= T.wind && t < 124.6 ? ss(seg(t, T.wind, T.wind + 2)) * (1 - ss(seg(t, T.silence2, 124.6))) : 0;
    trees.forEach((tr, i) => tr.userData.leaves.forEach((b, j) => { b.rotation.set(0, Math.atan2(cam.position.x - tr.position.x, cam.position.z - tr.position.z), (.05 + windK * .22) * Math.sin(t * (2.5 + windK * 5) + i * 1.3 + j) + windK * .12); }));
    SEA.u.t.value = t * (1 + windK * .8); SEA.u.camPos.value.copy(cam.position); SEA.u.fogColor.value.copy(scene.fog.color); SEA.u.fogDensity.value = scene.fog.density;
    ST.material.uniforms.t.value = t; mist.userData.update(t); conf.userData.update(t); smoke.userData.update(t);
    const stepT = Math.floor(t * 8);

    // ———————————————— MORNING ————————————————
    if (t < 30) {
      const ride = t < T.hull;   // children on the boat until it noses the far steps
      // Lao Zhou at the stern; children at the bow and under the canopy edge
      const lzP = onBoat(.15, .34, 2.3), xsP = onBoat(0, .34, -2.1), k1P = onBoat(-.4, .34, -1.3), k2P = onBoat(.45, .34, -.8), k3P = onBoat(-.1, .34, -.2);
      let lzF = rowF(t), xsF = idle2(t, 1.2, 'sit', 'sit1'), flipLz = false, flipXs = false;
      if (id === 's3' || id === 's4') { lzF = t > T.dlgXs1 + 1.0 ? (t > T.dlgLz1 ? rowF(t, 'rowSmile') : rowF(t)) : rowF(t); xsF = t > T.dlgXs1 - .6 ? 'sitAsk' : xsF; if (t > T.dlgLz1 + .8) xsF = 'sitSmile'; flipXs = t > T.dlgXs1 - .6; }
      if (id === 's5') { xsF = 'sitLook'; }
      if (id === 's1' || id === 's2') { const u = t - (T.boatDown - 1.0); xsF = u < 0 ? 'sit' : u < 1.0 ? 'drop0' : u < 1.6 ? 'drop1' : idle2(t, 1.2, 'sit', 'sit1'); }
      if (stepT % 31 === 0 && xsF === 'sit') xsF = 'sitBlink';
      if (id === 's6') {   // the hull touches the steps; the children hop off and run up; Xiao Shi turns and waves; Lao Zhou lifts a hand
        const u = t - T.kidsOff;
        const kids = [[C.k1, k1P, 0], [C.k2, k2P, .35], [C.xs, xsP, .7], [C.k3, k3P, 1.05]];
        for (const [ch, p0, dly] of kids) { const v = u - dly; let pos = p0.clone(), fr = ch === C.xs ? 'sit' : 'sit';
          if (v > 0) { const w = Math.min(1, v / .9); pos = p0.clone().lerp(new THREE.Vector3(2.4 + (ch === C.xs ? .3 : (dly - .5)), -.9, -27.4), w); pos.y = lerp(p0.y, -.9, w) + Math.sin(w * Math.PI) * .25; fr = walk4(t, 9); }
          if (v > .9) { const w = Math.min(1, (v - .9) / 1.6); pos = new THREE.Vector3(2.4 + (ch === C.xs ? .3 : (dly - .5)), -.9, -27.4).lerp(new THREE.Vector3(2.5 + (dly - .5) * .8, .06, -30.2 - (ch === C.xs ? 0 : 1.5)), w); fr = walk4(t, 9); }
          if (ch === C.xs && t > T.wave - .1) { pos = new THREE.Vector3(2.7, .06, -30.2); fr = Math.floor(t * 3) % 2 ? 'wave0' : 'wave1'; }
          if (v > 2.5 && ch !== C.xs) { pos.z -= (v - 2.5) * 2.2; fr = walk4(t, 9); }
          show(ch, pos, fr, cam, ch === C.xs && t > T.wave - .1); }
        lzF = t > T.wave + .3 ? (Math.floor(t * 3) % 2 ? 'wave0' : 'wave1') : 'idle0'; show(C.lz, lzP, lzF, cam, true);
        focusP = C.xs.root.position.clone().setY(.4); aper = 240;
        cam.position.set(7.5, 3.6, -21); cam.fov = 30; cam.lookAt(2.6, -.3, -27.5);
      } else {
        show(C.lz, lzP, lzF, cam, flipLz); show(C.xs, xsP, xsF, cam, flipXs); show(C.k1, k1P, idle2(t, 1.1, 'sit', 'sit1'), cam, true); show(C.k2, k2P, idle2(t + .4, 1.3, 'sit', 'sit1'), cam); show(C.k3, k3P, idle2(t + .9, 1.2, 'sit', 'sit1'), cam, true);
      }
      // the paper boats on the water
      pboats.forEach((b, i) => { b.scale.setScalar(1); const p = paperDrift(i, t); if (p) { b.visible = true; b.position.copy(p); b.rotation.y = Math.atan2(cam.position.x - p.x, cam.position.z - p.z) + .3; } });
      if (id === 's1') {   // water insert: the hand lowers the boat (the boat sprite descends into frame), it touches, ripples; the ferry hull passes above-right
        const p0 = paperDrift(0, Math.max(t, T.boatDown)); const u = seg(t, T.boatDown - .9, T.boatDown); const p = p0.clone(); p.y += (1 - eo(u)) * .55; pboats[0].visible = true; pboats[0].position.copy(p); pboats[0].rotation.y = .7; pboats[0].scale.setScalar(2.0);
        cam.position.set(p0.x - .75, WATER + .42, p0.z + .95); cam.fov = 30; cam.lookAt(p0.x + .1, WATER - .02, p0.z - .15); focusP = p.clone(); aper = 60;
        C.xs.root.visible = C.lz.root.visible = C.k1.root.visible = C.k2.root.visible = C.k3.root.visible = true;   // the ferry above-left, out of focus
      } else if (id === 's2') {
        const Cm = CAMS.s2; cam.position.set(...Cm.p(t)); cam.fov = lerp(Cm.fov[0], Cm.fov[1], ss(seg(t, 7, 13))); cam.lookAt(...Cm.l(t));
        const u = ss(seg(t, 6.5, 10.5)); focusP = (u < .5 ? pboats[0].position.clone() : lzP.clone().setY(lzP.y + .6)); aper = lerp(90, 420, u); tiltC = u > .6 ? null : null;
      } else if (id === 's3') {
        cam.position.copy(onBoat(5.4, 3.2, 2.8 - seg(t, 13.3, 19.2) * .5)); cam.fov = 32; cam.lookAt(onBoat(0, .75, .5)); focusP = onBoat(.1, .9, .4); aper = 240;
      } else if (id === 's4') {
        C.lz.root.visible = false; show(C.lz3, lzP, lzF, cam, false); const hp = C.lz3.headPos(); cam.position.copy(onBoat(2.1 + seg(t, 19.2, 23.3) * -.15, 1.85, 3.3)); cam.fov = 27; cam.lookAt(hp.x, hp.y - .04, hp.z); focusP = hp; aper = 110;
      } else if (id === 's5') {
        const u = ss(seg(t, T.rackBridge - .4, T.rackBridge + .9)); const gap = new THREE.Vector3(BX, DECK + .3, -12.5); cam.position.copy(onBoat(-1.7, 1.5, -3.9)); cam.fov = 38; cam.lookAt(xsP.clone().setY(xsP.y + .8).lerp(gap, .45)); aper = lerp(200, 170, u);
        post.dof.focus = lerp(cam.position.distanceTo(xsP.clone().setY(xsP.y + .5)), cam.position.distanceTo(gap), u); focusP = null;
      }
      fill.position.copy(lzP).add(new THREE.Vector3(.4, 1.5, 2.2)); fill.intensity = .9;
    }
    // ———————————————— NOON ————————————————
    else if (t < 50) {
      const party = [[C.br, 'br'], [C.gr, 'gr'], [C.gu1, 'gu'], [C.gu2, 'gu'], [C.gu3, 'drum'], [C.gu4, 'gu']];
      const jettyP = [[-.5, -.3, -3.2], [.4, -.3, -2.6], [-.6, -.3, -4.4], [.5, -.3, -4.0], [-.4, -.3, -5.6], [.5, -.3, -5.3]];
      const boatP = [[0, .34, -2.2], [.35, .34, -1.5], [-.45, .34, -1.0], [.4, .34, -.3], [-.4, .34, .1], [.05, .34, -.75]];
      const lzP = onBoat(.3, .34, 2.3);
      party.forEach(([ch, kind], i) => {
        const bw = seg(t, T.board + i * .35, T.board + i * .35 + 1.3);
        const pos = new THREE.Vector3(...jettyP[i]).lerp(onBoat(...boatP[i]), ss(bw)); if (bw > 0 && bw < 1) pos.y += Math.sin(bw * Math.PI) * .25;
        let fr = 'idle0';
        if (kind === 'gu') { const k = [2, 3, 5].indexOf(i); const tu = T.umb[k < 0 ? 0 : k]; fr = t < tu ? 'closed' : t < tu + .3 ? 'half' : idle2(t, 1.1, 'open', 'open1'); if (i === 3 && t > T.gust && t < T.gustBack) fr = 'flip'; if (bw > 0 && bw < 1) fr = walk4(t); }
        else if (kind === 'drum') fr = bw > 0 && bw < 1 ? walk4(t) : (Math.floor(t * 4) % 2 ? 'd0' : 'd1');
        else if (kind === 'gr') fr = t > T.gust && t < T.gustBack + .4 ? 'hat' : (bw > 0 && bw < 1 ? walk4(t) : idle2(t, 1.2));
        else fr = bw > 0 && bw < 1 ? walk4(t) : idle2(t, 1.2);
        if (ch === C.br && id === 's9') fr = t < T.candyToss - .3 ? 'idle0' : t < T.candyToss + .5 ? 'toss' : idle2(t, 1.2);
        show(ch, pos, fr, cam, ch === C.br && id === 's9');
      });
      let lzF = t < T.board + 2.8 ? idle2(t, 1.3) : rowF(t, 'rowSmile');
      if (id === 's9') { lzF = t < T.candyToss - .2 ? rowF(t, 'rowSmile') : t < T.candyLand ? 'catchUp' : t < T.candyLand + 1.2 ? 'catchDone' : rowF(t, 'rowSmile'); }
      show(C.lz, lzP, lzF, cam, true);
      if (id === 's9' && t > T.candyToss && t < T.candyLand) { const u = seg(t, T.candyToss, T.candyLand); const a = C.br.at(26, 12, true), b = C.lz.at(14, 10, true); candy.visible = true; candy.position.lerpVectors(a, b, u); candy.position.y += Math.sin(u * Math.PI) * .9; candy.rotation.set(t * 9, t * 7, 0); }
      if (id === 's7') { const Cm = CAMS.s7; cam.position.set(...Cm.p(t)); cam.fov = Cm.fov[0]; cam.lookAt(...Cm.l(t)); focusP = new THREE.Vector3(0, 0, -4); aper = 380; tiltC = .5; }
      else if (id === 's8') { cam.position.set(26.5, 5.2, bp.z + 1.0); cam.fov = 24; cam.lookAt(bp.x, .4, bp.z - .4); focusP = onBoat(0, .8, 0); aper = 420; }
      else if (id === 's9') { cam.position.copy(onBoat(5.4, 3.0, 2.8)); cam.fov = 33; cam.lookAt(onBoat(0, .8, .6)); focusP = onBoat(0, .9, .4); aper = 240; }
      else if (id === 's10') { const Cm = CAMS.s10; cam.position.set(...Cm.p(t)); cam.fov = lerp(Cm.fov[0], Cm.fov[1], seg(t, 45.5, 50)); cam.up.set(0, 0, -1); cam.lookAt(...Cm.l(t)); cam.up.set(0, 1, 0); focusP = onBoat(0, .4, 0); aper = 420; tiltC = .52; }
      fill.intensity = 0;
    }
    // ———————————————— DUSK ————————————————
    else if (t < 68) {
      // windows pop on one per beat (groups), lamp posts come on with the third
      const nOn = T.winOn.filter(x => t >= x).length; const k = nOn / T.winOn.length;
      houses.forEach((h, i) => { const on = i < Math.floor(k * houses.length + .001) ? 1 : 0; h.userData.windows.forEach(q => { q.material = on ? winMat() : winOff; }); });
      winMat().emissiveIntensity = 2.2; winL.forEach((l, i) => l.intensity = (i < nOn ? 1 : 0) * 7); const lampOn = t >= T.winOn[2] ? 1 : 0; lamps.forEach((l, i) => { l.L.intensity = 12 * lampOn * flick(t, 5 + i); l.lamp.material.emissiveIntensity = 4 * lampOn; l.gl.material.opacity = lampOn; }); shL.intensity = 7 * lampOn * flick(t, 2); shLamp.material.emissiveIntensity = 4 * lampOn; shG.material.opacity = lampOn; redLans.forEach(m => m.material.emissiveIntensity = 1.6 * lampOn);
      lit = t < T.lit1 ? 0 : Math.min(1, (t - T.lit1) / .35);
      const lzP = onBoat(.3, .34, 2.3), obP0 = new THREE.Vector3(-.5, -.3, -4.7), owP0 = new THREE.Vector3(.35, -.3, -3.9), gP0 = new THREE.Vector3(.7, -.3, -5.7);
      const boarded = ss(seg(t, T.hop + .2, T.hop + 1.6));
      const obP = obP0.clone().lerp(onBoat(-.3, .34, -1.3), boarded), owP = owP0.clone().lerp(onBoat(.4, .34, -.5), boarded), gP = t < T.hop ? gP0 : gP0.clone().lerp(onBoat(0, .4, -2.3), eo(seg(t, T.hop, T.hop + .5)));
      if (t < T.hop) gP.y += (t > T.flap && t < T.flap + .6 ? Math.sin(seg(t, T.flap, T.flap + .6) * Math.PI) * .3 : 0); else if (t < T.hop + .5) gP.y += Math.sin(seg(t, T.hop, T.hop + .5) * Math.PI) * .6;
      let gF = 'idle'; if (t < T.honk[0]) gF = idle2(t, 1.5, 'idle', 'idle1'); else if (t < T.honk[0] + .5) gF = 'honk'; else if (t < T.flap) gF = 'refuse'; else if (t < T.flap + .6) gF = Math.floor(t * 10) % 2 ? 'flap0' : 'flap1'; else if (t < T.honk[2]) gF = 'refuse'; else if (t < T.honk[2] + .4) gF = 'honk'; else if (t < T.hop) gF = 'refuse'; else if (t < T.hop + .5) gF = 'flap0'; else if (t >= T.honkLight && t < T.honkLight + .5) gF = 'honk'; else gF = 'sit';
      let obF = boarded > 0 && boarded < 1 ? walk4(t) : (t > T.honk[0] - .3 && t < T.hop ? idle2(t, 2, 'coax0', 'coax1') : idle2(t, 1.2)); if (id === 's13') obF = t < T.dlgOb1 + .3 ? 'ask' : t < T.dlgOb1 + 2.6 ? 'ask' : 'nod';
      const owF = boarded > 0 && boarded < 1 ? walk4(t) : idle2(t, 1.1);
      let lzF = t < T.hop + 1.5 ? idle2(t, 1.3) : (id === 's14' ? (t < T.match1 ? 'idle0' : t < T.lit1 + .4 ? 'match' : 'matchLit') : (t < T.dlgLz2 ? rowF(t) : rowF(t, 'rowSmile')));
      if (id === 's13') { lzF = t < T.dlgLz2 - .4 ? idle2(t, 1.3, 'calm', 'idle0') : 'smile'; }
      if (id === 's14' || id === 's13') { show(C.lz3, lzP, lzF, cam, false); show(C.ob3, obP, obF, cam, true); } else { show(C.lz, lzP, lzF, cam, true); show(C.ob, obP, obF, cam, false); }
      show(C.ow, owP, owF, cam, false); show(id === 's12' ? C.goose3 : C.goose, gP, gF, cam, t >= T.hop);
      if (id === 's11') { const Cm = CAMS.s11; cam.position.set(...Cm.p(t)); cam.fov = Cm.fov[0]; cam.lookAt(...Cm.l(t)); focusP = new THREE.Vector3(0, 0, -4); aper = 380; tiltC = .5; }
      else if (id === 's12') { cam.position.set(3.6, 2.1, -8.2 + seg(t, 56, 60.5) * .4); cam.fov = 31; cam.lookAt(-.1, -.1, -4.4); focusP = gP.clone().setY(gP.y + .3); aper = 220; }
      else if (id === 's13') { cam.position.copy(onBoat(-3.0, 2.1, -3.4)); cam.fov = 31; cam.lookAt(onBoat(.1, 1.0, .9)); focusP = onBoat(0, 1.0, .6); aper = 170; fill.intensity = 1.2; }
      else if (id === 's14') { const lp = onBoat(-.6, 1.25, 2.15); cam.position.copy(onBoat(-2.0, 1.75, 4.2)); cam.fov = 30; cam.lookAt(onBoat(-.15, 1.15, 2.2)); focusP = lp; aper = 110; }
      if (id !== 's13') { fill.position.copy(lzP).add(new THREE.Vector3(.4, 1.5, 2.2)); fill.intensity = .8; } else fill.position.copy(lzP).add(new THREE.Vector3(-1.2, 1.5, 1.2));
    }
    // ———————————————— NIGHT ————————————————
    else if (t < 124.6) {
      houses.forEach(h => h.userData.windows.forEach(q => { q.material = winMat(); }));
      const onPier = t < T.castOff;
      const sitP = new THREE.Vector3(-.25, -.3, -2.75), standP = new THREE.Vector3(-.25, -.3, -3.4), moP = new THREE.Vector3(.75, -.3, -3.9);
      lit = t < T.blow ? 1 : t < T.lit2 ? 0 : Math.min(1, (t - T.lit2) / .35);
      if (t >= T.gutter) lit = lerp(1, .06, ss(seg(t, T.gutter, T.dark))); if (t >= T.revive) lit = lerp(.06, 1, ss(seg(t, T.revive, T.revive + .7)));
      const fk = t > T.gutter && t < T.revive + .7 ? 1 + .4 * Math.sin(t * 31) * Math.sin(t * 17) : flick(t, 4);
      if (onPier) {
        // Lao Zhou: ties up (s15), sits (s16, s17), stands when the mother arrives (s20), relights (s23)
        let lzP = standP.clone(), lzF = 'idle0', flip = false, use3 = false;
        if (t < T.sit) { lzP = new THREE.Vector3(.35, -.3, -6.0); lzF = t < T.rope - .3 ? idle2(t, 1.2) : t < T.rope + 1.4 ? (Math.floor(t * 3) % 2 ? 'rope0' : 'rope1') : walk4(t, 7); if (t > T.rope + 1.4) lzP.z = lerp(-6.0, -3.0, seg(t, T.rope + 1.4, T.sit)); flip = t > T.rope + 1.4; lanPos = new THREE.Vector3(.5, -.3, -2.6); }
        else if (t < T.run + 2.2) { lzP = sitP; lzF = t < T.breath ? (stepT % 37 === 0 ? 'sitBlink' : (t < T.sit + 1.5 ? 'sitLook' : 'sit')) : t < T.blow ? 'breath' : t < T.blow + .6 ? 'blow' : 'sit'; use3 = id === 's16' || id === 's17'; lanPos = new THREE.Vector3(.5, -.3, -2.6); }
        else { lzP = standP; lzF = idle2(t, 1.2); lanPos = new THREE.Vector3(.5, -.3, -2.6);
          if (id === 's23') { use3 = true; lzF = t < T.lookBridge ? 'grave' : t < T.lookLantern ? 'lookUpWide' : t < T.match2 ? 'lookDown' : t < T.lit2 + .3 ? 'match' : 'firm'; if (t > T.dlgLz3 + .5) lzF = 'firm'; }
          else if (id === 's20') lzF = t < T.dlgMo1 ? 'grave' : 'grave';
        }
        if (use3) show(C.lz3, lzP, lzF, cam, flip); else show(C.lz, lzP, lzF, cam, flip);
        // the mother: runs along the lane from x = −19 to the pier top, down the steps to the jetty
        if (t >= T.run - .2) {
          const u = t - T.run; let p;
          if (u < 3.4) p = new THREE.Vector3(lerp(-19, -.6, u / 3.4), 0, 1.0);
          else if (u < 4.2) { const w = (u - 3.4) / .8; p = new THREE.Vector3(-.6, lerp(0, -.3, w), lerp(1.0, -2.2, w)); }
          else p = new THREE.Vector3(-.6, -.3, -2.2).lerp(moP, Math.min(1, (u - 4.2) / .5));
          let mf = u < 4.7 ? walk4(t, 10) : (t < T.dlgMo1 + .4 ? 'stand' : t < T.dlgMo1Out ? 'plead' : t < T.lit2 ? 'stand' : 'relief');
          if (id === 's22') { show(C.xs3, moP.clone().add(new THREE.Vector3(-.35, .9, .25)), 'bundle', cam, false); }
          else if (id === 's20' || id === 's23') show(C.mo3, p, mf, cam, true); else show(C.mo, p, mf, cam, true);
        }
      } else {
        // the crossing: Lao Zhou rowing hard at the stern; the mother under the canopy edge with the boy; at the far steps she climbs up to the door
        const lzP = onBoat(.3, .34, 2.3);
        let lzF = t < T.gutter ? rowF(t, 'rowHard') : t < T.cup ? 'fear' : t < T.revive + .8 ? 'cup' : t < T.arrive ? 'cupRelief' : t < T.silence2 ? 'standBreath0' : (t < T.silence2 + 1.4 ? idle2(t, 1.2, 'standBreath0', 'standBreath1') : 'lookUpSmile');
        if (id === 's25') lzF = 'hands';
        if (id === 's26') lzF = rowF(t, 'rowHard');
        if (id === 's27' || id === 's28' || id === 's30' || id === 's25') show(C.lz3, lzP, lzF, cam, true); else show(C.lz, lzP, lzF, cam, true);
        let mp = onBoat(.1, .34, -.6), mf = idle2(t, 1.4);
        if (t >= T.upSteps) { const w = ss(seg(t, T.upSteps, T.doorClose - .2)); mp = onBoat(.1, .34, -.6).lerp(new THREE.Vector3(2.5, .06, -34.7), w); mp.y = lerp(onBoat(0, .34, 0).y, .06, w); mf = walk4(t, 9); }
        if (t < T.doorClose - .2) show(C.mo, mp, mf, cam, false);
        if (t >= T.door) show(C.nurse, new THREE.Vector3(3.1, .06, -34.9), t < T.door + .5 ? 'open' : idle2(t, 1.2), cam, true);
      }
      // the lantern
      if (lanPos) lanPos = lanPos.clone();
      // the clinic door and its light
      const dk = ss(seg(t, T.door, T.door + .7)) * (1 - ss(seg(t, T.doorClose, T.doorClose + .6)) * .85);
      doorG2.rotation.y = -1.9 * ss(seg(t, T.door, T.door + .7)) * (1 - ss(seg(t, T.doorClose, T.doorClose + .6)) * .9); interior.visible = dk > .02;
      doorL.intensity = dk * 20; doorL.position.set(2.5, 1.4, -33.6); doorG.visible = dk > .02; doorG.material.opacity = dk * .6; doorG.position.set(2.5, 1.5, -34.6);
      // cameras
      if (id === 's15') { const Cm = CAMS.s15; cam.position.set(...Cm.p(t)); cam.fov = Cm.fov[0]; cam.lookAt(...Cm.l(t)); focusP = new THREE.Vector3(.5, 0, -4); aper = 380; tiltC = .5; }
      else if (id === 's16') { const u = ss(seg(t, 73.5, 77.5)); cam.position.set(lerp(3.4, 2.0, u), lerp(1.6, .95, u), lerp(-6.2, -4.6, u)); cam.fov = 30; const hp = C.lz3.headPos(); cam.lookAt(lerp(-.1, hp.x, u), lerp(.3, hp.y - .1, u), lerp(-2.9, hp.z, u)); focusP = hp; aper = lerp(200, 120, u); }
      else if (id === 's17') { const hp = C.lz3.headPos(); cam.position.set(hp.x + 1.6, hp.y + .15, hp.z + 1.0); cam.fov = 27; cam.lookAt(hp.x + .05, hp.y - .08, hp.z + .1); focusP = hp; aper = 110; }
      else if (id === 's18') { const Cm = CAMS.s18; cam.position.set(...Cm.p(t)); cam.fov = Cm.fov[0]; cam.lookAt(...Cm.l(t)); focusP = new THREE.Vector3(.5, 0, -4); aper = 380; tiltC = .5; }
      else if (id === 's19') { const mx = C.mo.root.position.x; cam.position.set(mx + 2.4, 2.6, -4.2); cam.fov = 30; cam.lookAt(mx + .9, .8, 1.0); focusP = C.mo.root.position.clone().setY(.9); aper = 260; }
      else if (id === 's20') { cam.position.set(3.6, 2.2, -.2); cam.fov = 30; cam.lookAt(.1, .55, -3.2); focusP = new THREE.Vector3(.2, .6, -3.3); aper = 180; }
      else if (id === 's21') { cam.position.set(3.0, 2.6, -3.0); cam.fov = 38; cam.lookAt(BX, DECK + .4, -12.6); focusP = new THREE.Vector3(BX, DECK, -12.6); aper = 260; }
      else if (id === 's22') { const hp = C.xs3.headPos(); cam.position.set(hp.x + .8, hp.y + .25, hp.z + 1.15); cam.fov = 27; cam.lookAt(hp.x, hp.y - .02, hp.z); focusP = hp; aper = 90; fill.intensity = 2.2; fill.position.copy(hp).add(new THREE.Vector3(.4, .6, 1.2)); }
      else if (id === 's23') { const hp = C.lz3.headPos(); cam.position.set(standP.x + 1.75, hp.y + .25, standP.z + 1.25); cam.fov = 27; cam.lookAt(hp.x, hp.y - .05, hp.z); focusP = hp; aper = 110; }
      else if (id === 's24') { const Cm = CAMS.s24; cam.position.set(...Cm.p(t)); cam.fov = lerp(Cm.fov[0], Cm.fov[1], seg(t, 102.6, 106.6)); cam.lookAt(...Cm.l(t)); focusP = onBoat(0, .5, 0); aper = 420; }
      else if (id === 's25') { const hp = C.lz3.at(20, 30, true); cam.position.copy(hp).add(new THREE.Vector3(1.3, .45, 1.1)); cam.fov = 30; cam.lookAt(hp); focusP = hp; aper = 90; lanG.visible = false; lantern.visible = false; fill.intensity = 2.6; fill.color.set('#ffc890'); fill.position.copy(hp).add(new THREE.Vector3(.6, .5, .9)); }
      else if (id === 's26') { cam.position.copy(onBoat(-5.6, .3, .6)); cam.fov = 30; cam.lookAt(onBoat(0, .9, 1.2)); focusP = onBoat(0, .9, 1.4); aper = 260; fill.intensity = 1.1; fill.position.copy(onBoat(-1.4, 1.6, 2.4)); }
      else if (id === 's27' || id === 's28') { const hp = C.lz3.headPos(true), lp = onBoat(-.6, 1.3, 2.15); cam.position.copy(onBoat(1.9, 2.0, 4.3)); cam.fov = 28; cam.lookAt(lp.clone().lerp(hp, .7)); focusP = lp.clone().lerp(hp, .6); aper = 110; }
      else if (id === 's29') { cam.position.set(8.8, 4.4, -19.0); cam.fov = 38; cam.lookAt(2.6, .2, -30); focusP = new THREE.Vector3(2.5, .3, -29); aper = 230; }
      else if (id === 's30') { const hp = C.lz3.headPos(true); cam.position.copy(hp).add(new THREE.Vector3(1.5, .2, 1.1)); cam.fov = 28; cam.lookAt(hp.x, hp.y - .05, hp.z); focusP = hp; aper = 110; }
      if (id !== 's22' && id !== 's26' && id !== 's25') { fill.intensity = (lit * .5 + .55) * (onPier ? 1 : .9); fill.position.copy((onPier ? standP : onBoat(.3, .34, 2.3))).add(new THREE.Vector3(.5, 1.5, 1.8)); }
      // rain follows the camera's target
      const fp = focusP || new THREE.Vector3(0, 0, -6); RB[0] = fp.x - 22; RB[3] = fp.x + 22; RB[1] = fp.y - 3; RB[4] = fp.y + 18; RB[2] = fp.z - 22; RB[5] = fp.z + 14; RAIN.userData.update(t, [-7 - windK * 6, 0]);
      splashBox = [fp.x - 10, WATER + .02, fp.z - 10, fp.x + 10, 0, fp.z + 8]; splash.userData.update(t);
      lanL.intensity = lit > 0 ? Math.max(.12, (onPier ? 7.0 : 3.8) * Math.pow(lit, 1.3)) * fk : 0; fill.intensity *= (1 - fillGut * .7);
    }
    // ———————————————— DAWN ————————————————
    else {
      houses.forEach(h => h.userData.windows.forEach(q => { q.material = winMat(); }));
      // the crowd gathers at the ribbon and crosses after it falls
      const crowd = [[C.t1, 'town', 0], [C.t2, 'town', .5], [C.br, 'br', 1.0], [C.gr, 'gr', 1.4], [C.ob, 'ob', 2.2], [C.ow, 'ow', 2.6], [C.goose, 'goose', 2.9], [C.t3, 'town', 3.4], [C.t4, 'town', 3.9], [C.k1, 'kid', 4.4], [C.k2, 'kid', 4.7], [C.k3, 'kid', 5.0], [C.gu1, 'gu', 5.6], [C.gu3, 'drum', 6.0], [C.mo, 'mo', 6.5]];
      crowd.forEach(([ch, kind, dly], i) => {
        const x0 = BX + ((i % 5) - 2) * 1.1 + (h2(i, 1) - .5) * .5, z0 = 16 + Math.floor(i / 5) * 1.5 + dly * .3;
        const u = Math.max(0, t - T.crowd - dly * .9), d = u * 1.9;          // metres walked along the approach and deck
        let p; if (d <= 0) p = new THREE.Vector3(x0, 0, z0); else { const z = z0 - d; const y = z > 13 ? 0 : z > 4 ? lerp(0, DECK, (13 - z) / 9) : DECK; p = new THREE.Vector3(x0, y + .7 * (z <= 13 ? 1 : 0) * (z > 4 ? (13 - z) / 9 : 1), z); }
        let fr = d > 0 ? (kind === 'goose' ? (Math.floor(t * 6) % 2 ? 'walk0' : 'walk1') : walk4(t, 7)) : (kind === 'town' ? (t > T.cracker && t < T.ribbon + 1 ? idle2(t, 2.2, 'cheer0', 'cheer1') : idle2(t, 1.2)) : kind === 'goose' ? idle2(t, 1.5, 'idle', 'idle1') : kind === 'gu' ? 'open' : kind === 'drum' ? (Math.floor(t * 4) % 2 ? 'd0' : 'd1') : kind === 'mo' ? 'walk' : idle2(t, 1.2));
        if (kind === 'mo' && d > 0) fr = walk4(t, 7);
        if (p.z > -34) show(ch, p, fr, cam, false);
      });
      // ribbon falls; the firecracker string
      const rbK = ss(seg(t, T.ribbon, T.ribbon + .9)); ribbonG.userData.rb.position.y = lerp(1.05, .06, rbK); ribbonG.userData.rb.rotation.z = rbK * .25; ribbonG.userData.bow.position.y = lerp(1.05, .1, rbK); ribbonG.userData.bow.position.x = rbK * .6;
      const ck = t > T.cracker && t < T.crackerEnd + .6 ? 1 : 0; crackL.position.set(BX - 4.2, 2.6, 15.8); crackL.intensity = ck * (3 + 6 * (Math.floor(t * 23) % 3 === 0 ? 1 : 0)); confK = ck;
      // Lao Zhou alone in the moored boat (near jetty), then the boy
      const lzP = onBoat(.3, .34, 2.3);
      let lzF = 'sit', use3 = false, flip = true;
      if (t < T.look - .2) lzF = stepT % 41 === 0 ? 'sitBlink' : 'sit';
      else if (t < T.look + .5) lzF = 'sitLook';
      else if (t < T.look + 1.1) lzF = 'sitWide';
      else if (t < T.dlgXs2 - .3) lzF = 'sitTender';
      else if (t < T.kneel) lzF = 'hold';
      else if (t < T.boatDown2 + .4) lzF = 'kneel';
      else lzF = 'kneelSet';
      if (id === 's34' || id === 's35') use3 = true;
      if (use3) show(C.lz3, lzP, lzF, cam, flip); else show(C.lz, lzP, lzF, cam, flip);
      if (t >= T.xsRun - .3) {   // Xiao Shi: along the lane, down the steps, along the jetty to the boat
        const u = t - T.xsRun; let p, fr;
        if (u < 0) { p = new THREE.Vector3(-7, 0, 1.0); fr = 'idle0'; }
        else if (u < 1.0) { p = new THREE.Vector3(lerp(-7, -.4, u), 0, 1.0); fr = walk4(t, 10); }
        else if (u < 1.5) { const w = (u - 1.0) / .5; p = new THREE.Vector3(-.4, lerp(0, -.3, w), lerp(1.0, -2.4, w)); fr = walk4(t, 10); }
        else if (u < 2.2) { const w = (u - 1.5) / .7; p = new THREE.Vector3(lerp(-.4, 1.05, w), -.3, lerp(-2.4, -2.8, w)); fr = walk4(t, 10); }
        else { p = new THREE.Vector3(1.05, -.3, -2.8); fr = t < T.dlgXs2 - .2 ? idle2(t, 1.3) : t < T.kneel ? 'hold' : 'holdUp'; }
        const xsC = (id === 's35' || id === 's36') ? C.xs3 : C.xs; show(xsC, p, fr, cam, false);
      }
      // the written paper boat: in the boy's hands (part of the sprite), then on the water drifting east under the bridge
      if (t >= T.boatDown2 - .5) { const u = Math.max(0, t - T.boatDown2); const p = new THREE.Vector3(3.7 + u * 3.3, WATER + .02 + Math.sin(t * 2.4) * .025, -2.6 - u * .3 + Math.sin(u * .9) * .4); if (t < T.boatDown2) p.y += (1 - eo(seg(t, T.boatDown2 - .5, T.boatDown2))) * .5; pbBig.visible = true; pbBig.position.copy(p); pbBig.rotation.y = Math.atan2(cam.position.x - p.x, cam.position.z - p.z) + .45; pbBig.userData.p = p; }
      if (id === 's36') { pbBig.visible = true; const p = new THREE.Vector3(1.75, .4, -2.7); pbBig.position.copy(p); pbBig.rotation.y = Math.atan2(cam.position.x - p.x, cam.position.z - p.z); }
      // cameras
      if (id === 's31') { const Cm = CAMS.s31; cam.position.set(...Cm.p(t)); cam.fov = lerp(Cm.fov[0], Cm.fov[1], seg(t, 126.85, 130.6)); cam.lookAt(...Cm.l(t)); focusP = new THREE.Vector3(BX, 1, 12); aper = 400; tiltC = .5; }
      else if (id === 's32') { cam.position.set(-3.4, 2.1, .2); cam.fov = 30; cam.lookAt(lzP.x + .2, .25, lzP.z - .1); const u = ss(seg(t, 131.6, 132.6)) * (1 - ss(seg(t, 133.3, 134.2))); post.dof.focus = lerp(cam.position.distanceTo(lzP), cam.position.distanceTo(new THREE.Vector3(BX, DECK, 0)), u); focusP = null; aper = 200; }
      else if (id === 's33') { cam.position.set(4.4, 2.5, -7.2); cam.fov = 31; cam.lookAt(-.4, -.2, -1.3); focusP = C.xs.root.position.clone().setY(C.xs.root.position.y + .4); aper = 220; }
      else if (id === 's34') { const hp = C.lz3.headPos(true); cam.position.copy(hp).add(new THREE.Vector3(1.5, .25, 1.2)); cam.fov = 27; cam.lookAt(hp.x, hp.y - .05, hp.z); focusP = hp; aper = 110; fill.intensity = 1.3; fill.position.copy(hp).add(new THREE.Vector3(.8, .5, 1.0)); }
      else if (id === 's35') { cam.position.set(4.7, 1.0, .3); cam.fov = 32; cam.lookAt(1.8, .55, -2.5); focusP = new THREE.Vector3(1.8, .5, -2.5); aper = 150; }
      else if (id === 's36') { const p = pbBig.position; C.xs3.root.visible = false; cam.position.set(p.x + .3, p.y + .2, p.z + 1.0); cam.fov = 27; cam.lookAt(p.x, p.y + .02, p.z); focusP = p.clone(); aper = 60; }
      else if (id === 's37') { const u = ss(seg(t, T.kneel, T.boatDown2 + .6)); const p = pbBig.userData.p || new THREE.Vector3(3.7, WATER, -2.6); cam.position.set(lerp(6.0, p.x + 1.9, u), lerp(2.3, WATER + .42, u), lerp(1.2, p.z - 2.5, u)); cam.fov = 30; cam.lookAt(lerp(2.6, p.x, u), lerp(.1, p.y, u), lerp(-2.3, p.z, u)); focusP = u < .5 ? lzP.clone().setY(lzP.y + .3) : p.clone(); aper = lerp(180, 90, u); }
      else if (id === 's38') { const p = pbBig.userData.p || new THREE.Vector3(14, WATER, -2.6); cam.position.set(p.x - 3.2 + seg(t, 147.1, 150) * .4, WATER + .45, p.z - 2.5); cam.fov = 30; cam.lookAt(p.x + 1.8, p.y, p.z + 1.0); focusP = p.clone(); aper = 120; }
      if (id !== 's34') { fill.intensity = .6; fill.position.copy(lzP).add(new THREE.Vector3(.4, 1.5, 2.0)); }
    }

    // —— the lantern: on the boat's pole unless set down; its light, glow and level ——
    if (t < 50 || (t >= 124.6)) { lit = 0; }
    const lp = lanPos || onBoat(-.62, 1.08, 2.15);
    lantern.position.copy(lp); lantern.rotation.y = Math.atan2(cam.position.x - lp.x, cam.position.z - lp.z); setLan(lit);
    const lc = lp.clone().add(new THREE.Vector3(0, 14 * SPX * .45, 0)), toCam = cam.position.clone().sub(lc).setY(0).normalize().multiplyScalar(.45);
    lanL.position.copy(lc).add(toCam); if (t < 68) lanL.intensity = lit > 0 ? 3.2 * Math.pow(lit, 1.3) * flick(t, 4) : 0; if (t >= 124.6) lanL.intensity = 0;
    const gd = clamp(cam.position.distanceTo(lc) / 9, .22, 2.6); lanG.position.copy(lc); lanG.material.opacity = lit > 0 ? Math.min(.85, .2 + lit * .7) : 0; lanG.scale.setScalar(gd * (.3 + lit * .7 + (t > T.lit1 && t < T.lit1 + .5 ? (1 - (t - T.lit1) / .5) * 1.2 : 0) + (t > T.lit2 && t < T.lit2 + .5 ? (1 - (t - T.lit2) / .5) * 1.2 : 0)));
    lantern.material.emissiveIntensity = (cam.position.distanceTo(lc) < 4 ? 1.9 : 2.6) * (lit > 0 ? 1 : 0);
    // reflections on the water
    const lights = [{ p: lc, c: new THREE.Color('#ffb050'), i: lit * .9 }];
    if (t >= 50 && t < 124.6) { lamps.forEach(l => lights.push({ p: l.g.position.clone().add(new THREE.Vector3(-.6, 2.9, 0)), c: new THREE.Color('#ffae55'), i: .6 * (l.L.intensity > 0 ? 1 : 0) })); lights.push({ p: new THREE.Vector3(2.5, 1.4, -34.5), c: new THREE.Color('#ffd090'), i: doorL.intensity / 36 }); winL.slice(0, 3).forEach(l => lights.push({ p: l.position, c: new THREE.Color('#ff9d4a'), i: l.intensity > 0 ? .25 : 0 })); }
    if (t >= 124.6) lights.push({ p: new THREE.Vector3(60, 6, -40), c: new THREE.Color('#ffd0a0'), i: 1.3 });
    SEA.setLights(lights);
    // post
    cam.updateProjectionMatrix();
    renderer.toneMappingExposure = LSt.exp; V.warm.value = LSt.warm; V.sat.value = LSt.sat; V.amt.value = .6 + (t >= 68 && t < 124.6 ? .12 : 0);
    post.bloom.strength = .5 + (t >= 68 && t < 124.6 ? .2 : 0) + fl * .1;
    if (focusP) post.dof.focus = cam.position.distanceTo(focusP); post.dof.aper = aper; post.dof.maxCoc = 22;
    const wideBand = ['s12', 's13', 's20', 's29', 's33', 's35', 's3', 's9', 's6'].includes(id);
    return { tiltC, subject: focusP, wideBand };
  }
  const winOff = new THREE.MeshStandardMaterial({ map: winMat().map, roughness: .7, color: '#9a9aa0' });
  return { scene, update };
}
