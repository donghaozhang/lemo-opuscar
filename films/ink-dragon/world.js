// The painting: a 3000×2000 landscape (painting units). Far ranges in 清, middle ranges with 披麻皴 and moss, a towering pine cliff on the left with the
// summit where the cloud sleeps, a dry river bed with a beached boat, and the village on the far bank with a withered tree and the child with a bowl.
// Static parts are cached in layers at init; water, rain, villagers, the cloud and the dragon are drawn per frame.
import { mk, draw, mass, blot, TONE } from './ink.js';
import { ridgeFn, mountainLayer, cun, cliff, pine, ripple } from './land.js';
import { layer, fadeLayer, vn2, fbm2, lerp, clamp, vnoise, add2, mid, curve, keys, pulse } from './util.js';
import { mulberry } from '/core/lib.js';

export const PW = 3000, PH = 2000;
export const SUMMIT = [560, 430];            // where the cloud sleeps
export const VILLAGE = { x: 2300, y: 1420 };
export const CHILD = [2250, 1500];
export const TREE = [2500, 1330];
export const BOAT = [1780, 1620];
export const COLOPHON = { x: 2910, y: 1000 };   // the painter's inscription (vertical)
export const TITLE = { x: 2740, y: 1000 };      // 墨龙借雨 written at the end (cell 170)
export const SEAL = [2680, 1740];
export const ENTRY = [2850, 520];               // where the dragon enters the painted sky

// river centreline (dry bed) from the cliff foot to the right edge
export function riverC(u) { return [lerp(880, 3050, u), 1770 - 300 * u + Math.sin(u * 5.2) * 70 + Math.sin(u * 11) * 18]; }
export const riverW = u => 95 - 30 * u;

let LAY = null;
export const layers = () => LAY;

export function init() {
  if (LAY) return LAY;
  LAY = { far: layer(PW, PH), mid: layer(PW, PH), cliff: layer(PW, PH), bank: layer(PW, PH), cracks: layer(PW, PH) };
  // far ranges: pale, dissolving into mist; two overlapping ridge lines
  const far1 = ridgeFn([[300, 330, 160], [900, 260, 150], [1500, 380, 190], [2100, 300, 170], [2700, 360, 180], [3200, 280, 150]], 900, 3, 34);
  LAY.far.ink.wet.drawImage(mountainLayer({ W: PW, H: PH, ridge: far1, depth: 300, tone: .13, rim: .5, rimW: 30, mist: .95, seed: 3 }), 0, 0);
  const far2 = ridgeFn([[600, 220, 180], [1250, 300, 160], [1900, 230, 200], [2500, 260, 160], [2950, 200, 140]], 1040, 5, 30);
  LAY.far.ink.wet.drawImage(mountainLayer({ W: PW, H: PH, ridge: far2, depth: 260, tone: .17, rim: .55, rimW: 26, mist: .9, seed: 5 }), 0, 0);
  // middle range behind the village (right half), textured
  const midR = ridgeFn([[1900, 300, 170], [2300, 420, 160], [2650, 350, 150], [3000, 380, 160]], 1330, 7, 40);
  LAY.mid.ink.wet.drawImage(mountainLayer({ W: PW, H: PH, ridge: midR, xmask: x => clamp((x - 1500) / 260), depth: 330, tone: .4, rim: .8, rimW: 16, mist: .72, seed: 7 }), 0, 0);
  cun(LAY.mid.ink, { x0: 1650, x1: 2980, ridge: midR, tone: .32, cun: 1.3, moss: 1.2, seed: 7, cunLen: 1.2, cunW: 1.3, mossR: 1.5 });
  // the pine cliff on the left: a big rock, face to the right, rising from the river to the summit
  bigCliff(LAY.cliff.ink);
  pine(LAY.cliff.ink, 60, 475, 1.9, 5, 0, 0, 1);   // one pine on the summit, left of the cloud so its face stays clear
  pine(LAY.cliff.ink, 905, 1030, 1.3, 11, 0, 0, 1);          // a pine on the ledge halfway down
  pine(LAY.cliff.ink, 760, 1420, 1.1, 13, 0, 0, 1);
  fadeLayer(LAY.cliff, 0, 1600, 0, 1800, 1, 0);                // the cliff foot vanishes into the river mist
  // the summit: a flat ledge where the cloud sleeps (a loaded stroke + moss dots)
  draw(LAY.cliff.ink, mk([[300, 470], [560, 462], [830, 472]], { w: 16, tone: .7, darkDir: [0, 1], side: .85, brWet: true, body: .25, dry: .5, wet: .9, prof: 'even', seed: 150 }));
  // the river banks: two long dry strokes with lift-and-press, stones, and the village bank
  const bankPts = (side, n = 26) => { const o = []; for (let i = 0; i <= n; i++) { const u = i / n, c = riverC(u), w = riverW(u) + side * 10 + (vnoise(u * 9 + side) - .5) * 20; o.push([c[0], c[1] + side * w, .6 + .6 * vnoise(u * 13 + side * 3)]); } return o; };
  draw(LAY.bank.ink, mk(bankPts(-1), { w: 7, tone: .72, dry: .62, wet: .2, prof: 'even', rough: .2, seed: 160, gapLen: 500 }));
  draw(LAY.bank.ink, mk(bankPts(1), { w: 8, tone: .66, dry: .66, wet: .2, prof: 'even', rough: .2, seed: 161, gapLen: 500 }));
  // a pale wash along the far bank (the ground the village stands on) and stones in the bed
  const R = mulberry(17);
  for (let i = 0; i < 26; i++) { const u = .05 + R() * .9, c = riverC(u), w = riverW(u); blot(LAY.bank.ink.wet, c[0] + (R() - .5) * 60, c[1] + (R() - .5) * 2 * w * .8, 4 + R() * 9, .32 + R() * .2, R() * 3, .55 + R() * .3, 170 + i); }
  for (let i = 0; i < 14; i++) { const u = .05 + R() * .9, c = riverC(u), w = riverW(u); blot(LAY.bank.ink.dry, c[0] + (R() - .5) * 60, c[1] + (R() - .5) * 2 * w * .8, 2 + R() * 4, .5, R() * 3, .6, 190 + i); }
  // the drought cracks (dry layer, faded out when the rain comes)
  cracks(LAY.cracks.ink);
  // the village on the far bank, the withered tree, the boat
  village(LAY.bank.ink);
  deadTree(LAY.bank.ink, TREE[0], TREE[1], 1);
  boat(LAY.bank.ink, BOAT[0], BOAT[1], 1, 0);
  // a few reeds on the near bank, dark foreground
  for (let i = 0; i < 7; i++) { const u = .35 + i * .08, c = riverC(u), x = c[0] + 30, y = c[1] + riverW(u) + 20; reedS(LAY.bank.ink, x, y, 60 + (i % 3) * 20, 1, 200 + i, .15 - (i % 2) * .3); }
  return LAY;
}

// the towering cliff: outline in broken burnt strokes, a pale wash that deepens to the right (shaded face), long hemp-fibre strokes (披麻皴) running down, a few axe-cut wedges, moss on the top
export function bigCliff(L) {
  const R = mulberry(33);
  const left = [[-60, 470], [40, 640], [-20, 860], [60, 1100], [10, 1380], [80, 1700]];
  const face = [[830, 475], [900, 560], [860, 700], [960, 860], [930, 1040], [1010, 1240], [980, 1460], [1040, 1700]];
  const top = [[-60, 470], [200, 462], [450, 468], [650, 460], [830, 475]];
  // wash: pale body with a darker right face
  mass(L.wet, [...top, ...face.slice(1), [80, 1700], ...left.slice(1, -1).reverse()], .26, 8, 33, [200, 470, 1000, 470, .55, 1.35]);
  mass(L.wet, [[700, 480], ...face.slice(1), [700, 1700]], .22, 6, 34, [700, 470, 1050, 470, .2, 1.4]);
  // outline: top and face in segments, lift-and-press
  const outline = (pts, w, sd, tone = .9) => { for (let i = 0; i < pts.length - 1; i++) draw(L, mk([[...pts[i], .7 + R() * .5], [lerp(pts[i][0], pts[i + 1][0], .5) + (R() - .5) * 14, lerp(pts[i][1], pts[i + 1][1], .5) + (R() - .5) * 14, 1.1], [...pts[i + 1], .6 + R() * .5]], { w, tone, dry: .5, wet: .25, prof: 'brush', seed: sd + i, gapLen: 260 })); };
  outline(top, 11, 1000); outline(face, 12, 1020); outline(left, 8, 1040, .7);
  // hemp-fibre texture: many long wavy strokes falling from the top, denser toward the face
  for (let i = 0; i < 110; i++) {
    const u = R(), x0 = lerp(20, 900, Math.pow(u, .6)), y0 = 480 + R() * 900, len = 120 + R() * 300, ph = R() * 6, bend = (R() - .5) * 60;
    const pts = []; for (let k = 0; k <= 6; k++) { const v = k / 6; pts.push([x0 + Math.sin(v * 2.5 + ph) * 22 + v * bend + v * 30 * (u - .3), y0 + v * len, .3 + .8 * Math.sin(v * Math.PI)]); }
    draw(L, mk(pts, { w: 3 + R() * 7, tone: .25 + .45 * u * (.6 + .4 * R()), dry: .55 + R() * .3, wet: .25, prof: 'tip', seed: 1100 + i, gapLen: 220 }), 1, .5 + .5 * R());
  }
  // darker mottling: a few pale lumps of wash on the face so the wall is not one flat tone
  for (let i = 0; i < 12; i++) { const cx = 500 + R() * 420, cy = 560 + R() * 1000, rx = 60 + R() * 120, ry = 90 + R() * 200; const poly = []; for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; poly.push([cx + Math.cos(a) * rx * (1 + .2 * vnoise(k + i)), cy + Math.sin(a) * ry]); } mass(L.wet, poly, .03 + R() * .05, 6, 1400 + i); }
  // axe-cut wedges on the face
  for (let i = 0; i < 16; i++) { const u = R(), p = face[1 + Math.floor(u * (face.length - 2))], x = p[0] - 30 - R() * 120, y = p[1] + R() * 120, len = 60 + R() * 90; draw(L, mk([[x, y], [x - len * .35, y + len * .5], [x - len * .5, y + len]], { w: 18 + R() * 16, tone: .6 + R() * .25, darkDir: [1, 0], side: .8, brWet: true, body: .3, dry: .55, wet: .5, prof: 'nail', seed: 1200 + i }), 1, clamp(1.4 - y / 1700)); }
  // moss dots along the top and the face
  for (let i = 0; i < 60; i++) { const onTop = R() < .6, x = onTop ? 0 + R() * 830 : face[Math.floor(R() * face.length)][0] - 30 + R() * 30, y = onTop ? 462 + R() * 30 : 500 + R() * 1100; for (let k = 0; k < 3; k++) blot(L.wet, x + (R() - .5) * 20, y + (R() - .5) * 12, 4 + R() * 6, .8, R() * 3, .6, 1300 + i * 3 + k); }
}

function reedS(L, x, y, h, s, seed, bend) {
  draw(L, mk([[x, y], [x + bend * h * .2, y - h * .55], [x + bend * h * .5, y - h]], { w: 2.6 * s, tone: .8, dry: .4, wet: .3, prof: 'tip', seed: seed * 3 }));
  draw(L, mk([[x + bend * h * .1, y - h * .4], [x + 18 * s, y - h * .6], [x + 34 * s, y - h * .5]], { w: 4 * s, tone: .7, dry: .45, wet: .4, prof: 'lens', seed: seed * 7 }));
}

// cracked mud: a jittered lattice inside the river bed, drawn as short broken burnt lines
export function cracks(L) {
  const R = mulberry(23);
  for (let i = 0; i < 90; i++) {
    const u = .03 + (i / 90) * .94, c = riverC(u), w = riverW(u);
    for (let j = 0; j < 4; j++) {
      const v = (j + .5) / 4 - .5 + (R() - .5) * .3, x = c[0] + (R() - .5) * 24, y = c[1] + v * 2 * w * .85;
      const L2 = 18 + R() * 22, a = (R() - .5) * 1.2 + (R() < .5 ? 0 : Math.PI / 2);
      draw(L, mk([[x, y], [x + Math.cos(a) * L2 * .5 + (R() - .5) * 6, y + Math.sin(a) * L2 * .5], [x + Math.cos(a) * L2, y + Math.sin(a) * L2]], { w: 2.2 + R() * 1.4, tone: .62, dry: .58, wet: .15, prof: 'tip', seed: 300 + i * 7 + j }), 1, .9);
    }
  }
}

// roofs: a loaded stroke slanting down (the tiled slope), a ridge line, two posts; the village is five houses stepped up the bank
export function village(L) {
  const houses = [[2140, 1430, 1], [2290, 1400, 1.1], [2430, 1440, .9], [2540, 1390, 1], [2220, 1330, .85], [2560, 1480, .9]];
  houses.forEach(([x, y, s], i) => house(L, x, y, s, 400 + i));
}
export function house(L, x, y, s, seed) {
  const w = 110 * s, h = 46 * s;
  // the roof: a big slanted loaded stroke, darker along the eave (lower edge)
  draw(L, mk([[x - w * .55, y - h * .1], [x, y - h], [x + w * .55, y - h * .1]], { w: 22 * s, tone: .62, darkDir: [0, 1], side: .85, brWet: true, body: .3, dry: .42, wet: .9, prof: 'lens', seed }));
  draw(L, mk([[x - w * .6, y + 2 * s], [x + w * .6, y + 2 * s]], { w: 5 * s, tone: .85, dry: .4, wet: .2, prof: 'even', seed: seed + 1 }));   // eave line
  draw(L, mk([[x - w * .08, y - h * 1.02], [x + w * .1, y - h * 1.02]], { w: 4 * s, tone: .8, dry: .5, prof: 'even', seed: seed + 2 }));   // ridge
  // walls: pale wash + two posts and a door
  mass(L.wet, [[x - w * .42, y + 4 * s], [x + w * .42, y + 4 * s], [x + w * .4, y + h * .85], [x - w * .4, y + h * .85]], .12, 1.5 * s, seed + 3);
  draw(L, mk([[x - w * .4, y + 4 * s], [x - w * .4, y + h * .85]], { w: 3 * s, tone: .75, dry: .5, prof: 'even', seed: seed + 4 }));
  draw(L, mk([[x + w * .4, y + 4 * s], [x + w * .4, y + h * .85]], { w: 3 * s, tone: .75, dry: .5, prof: 'even', seed: seed + 5 }));
  mass(L.wet, [[x - w * .1, y + h * .3], [x + w * .1, y + h * .3], [x + w * .1, y + h * .85], [x - w * .1, y + h * .85]], .55, 1 * s, seed + 6);   // the dark door
}
// withered tree: a crooked trunk and bare branches in dry burnt ink; `leaf` 0..1 adds moss dots (buds after the rain)
export function deadTree(L, x, y, s, leaf = 0) {
  const trunk = [[0, 0], [-8, -50], [6, -110], [-4, -170], [10, -215]].map(p => [x + p[0] * s, y + p[1] * s]);
  draw(L, mk(trunk, { w: 15 * s, tone: .78, darkDir: [1, 0], side: .8, brWet: true, body: .28, dry: .62, wet: .7, prof: 'press', seed: 500 }));
  const br = [[[6, -110], [-40, -150], [-70, -190]], [[-4, -170], [40, -200], [70, -215]], [[10, -215], [-10, -255], [-30, -290]], [[10, -215], [40, -250], [45, -285]], [[-8, -50], [-40, -70], [-60, -75]]];
  br.forEach((b, i) => draw(L, mk(b.map(p => [x + p[0] * s, y + p[1] * s]), { w: (5.5 - i * .5) * s, tone: .82, dry: .62, wet: .15, prof: 'nail', seed: 510 + i })));
  // twigs
  const R = mulberry(9);
  for (let i = 0; i < 9; i++) { const b = br[i % br.length], p = b[2], L2 = 20 + R() * 20, a = -Math.PI / 2 + (R() - .5) * 2; draw(L, mk([[x + p[0] * s, y + p[1] * s], [x + (p[0] + Math.cos(a) * L2) * s, y + (p[1] + Math.sin(a) * L2) * s]], { w: 2 * s, tone: .75, dry: .7, prof: 'tip', seed: 520 + i })); }
  if (leaf > 0) { const R2 = mulberry(19); for (let i = 0; i < 40; i++) { const u = R2(); if (u > leaf) continue; const b = br[i % br.length], p = mid(b[1], b[2], R2()); blot(L.wet, x + (p[0] + (R2() - .5) * 30) * s, y + (p[1] + (R2() - .5) * 26) * s, (2.5 + R2() * 3) * s, .62, R2() * 3, .6, 530 + i); } }
}
// a small boat: hull as two loaded strokes, a mast, lying tilted on the dry bed (tilt in radians); float 0..1 levels it and lifts it
export function boat(L, x, y, s, tilt = .22, float = 0) {
  const a = tilt * (1 - float), ca = Math.cos(a), sa = Math.sin(a);
  const T = p => [x + (p[0] * ca - p[1] * sa) * s, y - 8 * float * s + (p[0] * sa + p[1] * ca) * s];
  draw(L, mk([T([-70, -14]), T([-40, 6]), T([0, 10]), T([40, 6]), T([72, -16])], { w: 14 * s, tone: .72, darkDir: [0, 1], side: .85, brWet: true, body: .3, dry: .45, wet: .9, prof: 'even', seed: 600 }));
  draw(L, mk([T([-62, -12]), T([0, -6]), T([64, -14])], { w: 4 * s, tone: .85, dry: .45, wet: .2, prof: 'even', seed: 601 }));   // gunwale
  mass(L.wet, [T([-66, -12]), T([64, -14]), T([44, 8]), T([-42, 8])], .2, 1.5 * s, 61);
  draw(L, mk([T([-8, -8]), T([-10, -70])], { w: 3.4 * s, tone: .8, dry: .5, prof: 'even', seed: 602 }));                          // mast
  draw(L, mk([T([-22, -62]), T([6, -64])], { w: 2.4 * s, tone: .7, dry: .55, prof: 'even', seed: 603 }));                          // yard
}

// xieyi villager: body mass + two loaded strokes, a head (hair blot + pale face), limbs in burnt ink. pose: {armL, armR (angles), legs (spread), bowl, lean}
export function figure(L, x, y, s, pose = {}, seed = 700, am = 1) {
  const aL = pose.armL ?? 2.4, aR = pose.armR ?? .8, lean = pose.lean ?? 0, spread = pose.legs ?? .25, jump = pose.jump ?? 0;
  const H = 60 * s, yb = y - jump * 10 * s;
  const T = p => [x + p[0] * s + (p[1] / 60) * lean * 12 * s, yb + p[1] * s];
  // robe: a pale mass plus two loaded strokes
  mass(L.wet, [T([-8, -46]), T([8, -46]), T([13, -8]), T([-13, -8])].map(p => p), .18 * am, 1.2 * s, seed);
  draw(L, mk([T([-7, -45]), T([-11, -26]), T([-14, -6])], { w: 7 * s, tone: .7, darkDir: [-1, 0], side: .85, brWet: true, body: .2, dry: .42, wet: .9, prof: 'robe', seed: seed + 1 }), 1, am);
  draw(L, mk([T([7, -45]), T([11, -26]), T([14, -6])], { w: 6 * s, tone: .6, darkDir: [1, 0], side: .85, brWet: true, body: .2, dry: .45, wet: .9, prof: 'robe', seed: seed + 2 }), 1, am);
  draw(L, mk([T([-13, -6]), T([0, -4]), T([14, -6])], { w: 2 * s, tone: .6, dry: .6, prof: 'tip', seed: seed + 3 }), 1, am);
  // head
  blot(L.wet, T([0, -54])[0], T([0, -54])[1], 6.5 * s, .14 * am, 0, 1.1, seed + 4);
  blot(L.wet, T([-1, -58])[0], T([-1, -58])[1], 5.5 * s, .85 * am, .2, .7, seed + 5);
  // arms
  for (const [a, sg] of [[aL, -1], [aR, 1]]) { const sh = T([sg * 6, -42]), e = [sh[0] + Math.cos(a) * sg * 11 * s, sh[1] + Math.sin(a) * 11 * s], h = [e[0] + Math.cos(a - .3 * sg) * sg * 11 * s, e[1] + Math.sin(a - .3 * sg) * 11 * s]; draw(L, mk([sh, e, h], { w: 2.6 * s, tone: .85 * am, dry: .4, wet: .1, prof: 'even', seed: seed + 6 + sg }), 1, am); if (sg === pose.bowlHand) bowl(L, h[0], h[1], s, pose.bowl ?? 0, seed); }
  // legs
  draw(L, mk([T([-4, -8]), T([-4 - spread * 20, 0])], { w: 2.6 * s, tone: .88 * am, dry: .4, prof: 'even', seed: seed + 9 }), 1, am);
  draw(L, mk([T([4, -8]), T([4 + spread * 20, 0])], { w: 2.6 * s, tone: .88 * am, dry: .4, prof: 'even', seed: seed + 10 }), 1, am);
}
// a bowl held up: an arc; fill 0..1 = water level (ink removed → paper; a few rings)
export function bowl(L, x, y, s, fill = 0, seed = 0) {
  draw(L, mk([[x - 9 * s, y - 6 * s], [x - 6 * s, y + 2 * s], [x, y + 4 * s], [x + 6 * s, y + 2 * s], [x + 9 * s, y - 6 * s]], { w: 2.8 * s, tone: .86, dry: .35, wet: .2, prof: 'even', seed: seed + 20 }));
  if (fill > 0) draw(L, mk([[x - 7 * s, y - 4 * s + 2 * (1 - fill) * s], [x + 7 * s, y - 4 * s + 2 * (1 - fill) * s]], { w: 1.6 * s, tone: .5 * fill, dry: .5, wet: .5, prof: 'lens', seed: seed + 21 }));
}

// rain: fast dry diagonal strokes, world-anchored, falling; cam = {x, y, z}; k = density 0..1; the strokes live on ones
export function rain(L, cam, t, k, seed = 1, slant = .22) {
  if (k <= 0) return;
  const n = Math.round(160 * k), vw = 1920 / cam.z, vh = 1080 / cam.z, x0 = cam.x - vw / 2 - 100, y0 = cam.y - vh / 2 - 200;
  for (let i = 0; i < n; i++) {
    const h1 = vnoise(seed + i * 1.37), h2 = vnoise(seed + 7 + i * 2.11), sp = 1500 + 900 * vnoise(i * .7);
    const L2 = (70 + 90 * vnoise(i * 3.1)) / cam.z;
    const y = y0 + ((h2 * (vh + 400) + t * sp) % (vh + 400)), x = x0 + h1 * (vw + 200) + (y - y0) * slant;
    draw(L, mk([[x, y], [x - L2 * slant * .6, y - L2]], { w: 2.2 / cam.z, tone: .6 * k, dry: .62, wet: .08, prof: 'tip', nb: 3, seed: 800 + i }), 1, .8);
  }
}
// river water after the rain: paper left blank, ink rings and a few parallel wave lines near the banks (Song style, dense near the edge); fill 0..1
export function water(L, t, fill, seed = 1) {
  if (fill <= 0) return;
  const R = mulberry(seed + 3);
  for (let i = 0; i < 14; i++) {
    const u = .1 + R() * .85, c = riverC(u), ph = (t * .5 + i * 1.3) % 2.6, r = 8 + ph * 26, a = clamp(1 - ph / 2.6) * fill * .7;
    ripple(L, c[0] + (R() - .5) * 60, c[1] + (R() - .5) * riverW(u), r, a, 900 + i, .24, 2.2);
  }
  for (let i = 0; i < 18; i++) {
    const u = .04 + (i / 18) * .9, c = riverC(u), w = riverW(u), side = i % 2 ? 1 : -1;
    for (let j = 0; j < 3; j++) { const yy = c[1] + side * (w * .75 - j * 12), x0 = c[0] - 30 + j * 6; draw(L, mk([[x0, yy], [x0 + 30, yy + 2 * side], [x0 + 60, yy]], { w: 1.8, tone: .5 * fill * (1 - j * .25), dry: .55, wet: .2, prof: 'tip', nb: 3, seed: 950 + i * 3 + j }), 1, fill); }
  }
}

// a foreground pine drawn per frame (for parallax passes): the library's pine at a large scale, darker
export function pineFG(L, x, y, s, seed, t, wind, flip) { pine(L, x, y, s, seed, t, wind, flip); }
