// The village: northern houses (gable roofs, tiled sawtooth rows, chimneys), the gate tower with its firecracker string, a stone wall, bare trees, snow drifts,
// red pieces pasted on the indigo world: window flowers, couplets, lanterns. Night palette (indigo papers; far lighter, near darker). Dusk = the same papers under a warmer light map.
import { PAL, piece, P, Pl, trace, fill, cut, cutTaper, inset, within, ellipsePoly, curve, rnd, canvas } from '../engine/paper.js';
import { sawRow, sawEdge, crescent, crescentRows, swirl, doubleSwirl, rosette, plum, coin, dots, taper, along, cloudCut } from '../engine/motifs.js';
import { mul, T, R, S, put } from '../engine/rig.js';
import { tuanhua } from '../engine/tuanhua.js';

export const NIGHT = { sky: 'ink', far: '#34417c', mid: '#2a3568', house: '#3b4a88', houseDark: '#2f3c74', wall: '#33407a', tree: '#2a3468', snow: '#8d99c6', snowNear: '#7484b6', drift: '#9aa6cf', roofSnow: '#a9b4d8' };
export const WIN_LIT = '#ffd79a';
const V = {};
// ---------- house: origin = bottom centre of the wall; gable roof with sawtooth tiles, chimney, window (lattice), door ----------
export function housePiece(opt = {}) {
  const w = opt.w || 380, h = opt.h || 200, col = opt.col || NIGHT.house, seed = opt.seed || 71, rh = opt.rh || 120;
  const win = opt.win || { x: -w * .24, y: -h * .55, w: w * .26, h: h * .42 }, door = opt.door || { x: w * .22, w: w * .22, h: h * .74 };
  const ew = w / 2 + 40, box = [-ew - 30, -h - rh - 90, ew + 30, 12];
  const p = piece(box, g => {
    const eave = -h + 4, ridge = -h - rh;
    // roof: a gable with a slightly curved profile and a thick ridge
    const roof = Pl([[-ew - 18, eave + 2], [-ew + 6, eave - 16], [-w * .36, ridge + 10], [-w * .3, ridge - 4], [0, ridge - 12], [w * .3, ridge - 4], [w * .36, ridge + 10], [ew - 6, eave - 16], [ew + 18, eave + 2]], true, .4, seed);
    fill(g, q => trace(q, roof), col);
    // wall
    const wall = Pl([[-w / 2, eave - 2], [w / 2, eave - 2], [w / 2 + 2, -2], [w / 2 + 12, 0], [-w / 2 - 12, 0], [-w / 2 - 2, -2]], true, .3, seed + 1);
    fill(g, q => trace(q, wall), col);
    // chimney (left of the ridge)
    fill(g, q => trace(q, Pl([[-w * .2, ridge + 2], [-w * .2 + 34, ridge + 2], [-w * .2 + 34, ridge - 54], [-w * .2 - 6, ridge - 54], [-w * .2 - 6, ridge - 44]], true, .3, seed + 2)), col);
    cutTaper(g, [[-w * .2 - 2, ridge - 46], [-w * .2 + 30, ridge - 46]], 2.4);
    // tiles: sawtooth rows down the roof, a ridge line
    for (let k = 0; k < 4; k++) { const u = (k + .7) / 4, y = ridge + (eave - 18 - ridge) * u, half = w * .33 + (ew - 10 - w * .33) * u; sawRow(g, [[-half, y], [half, y]], 11, 10, -1, .7); cutTaper(g, [[-half - 4, y + 2], [0, y + 3], [half + 4, y + 2]], 2.4); }
    cutTaper(g, [[-w * .3, ridge + 2], [0, ridge - 2], [w * .3, ridge + 2]], 3.4);
    swirl(g, w * .34, ridge + 6, 10, 1.4, 3, 0, 1); swirl(g, -w * .34, ridge + 6, 10, 1.4, 3, Math.PI, -1);
    dots(g, along([[-ew + 22, eave - 10], [ew - 22, eave - 10]], 22).map(p => [p.x, p.y]), 3);
    // window: a hole with a lattice frame cut around it
    cut(g, q => q.rect(win.x - win.w / 2, win.y - win.h / 2, win.w, win.h));
    cut(g, q => { q.rect(win.x - win.w / 2 - 9, win.y - win.h / 2 - 9, win.w + 18, win.h + 18); q.rect(win.x - win.w / 2 - 6.5, win.y - win.h / 2 - 6.5, win.w + 13, win.h + 13); }, 'evenodd');
    // door (two leaves, a lintel), couplet slots are red pieces pasted later
    const dx = door.x, dw = door.w, dh = door.h;
    cut(g, q => { q.rect(dx - dw / 2, -dh, dw, dh); q.rect(dx - dw / 2 + 4, -dh + 4, dw - 8, dh - 4); }, 'evenodd');
    cutTaper(g, [[dx, -dh + 4], [dx, -dh / 2], [dx, -4]], 3);
    for (const s of [-1, 1]) crescent(g, dx + s * 9, -dh * .5, 5, 0, Math.PI * 2 - .01, 2.2);
    cut(g, q => { q.rect(dx - dw / 2 - 6, -dh - 22, dw + 12, 14); q.rect(dx - dw / 2 - 3.5, -dh - 19.5, dw + 7, 9); }, 'evenodd');
    // brick base: crescent rows
    within(g, wall, () => { g.save(); g.beginPath(); g.rect(-w, -18, w * 2, 16); g.clip(); crescentRows(g, -w / 2, -16, w / 2, -4, 9, 3, 0, .7); g.restore(); });
    cutTaper(g, [[-w / 2, -20], [0, -21], [w / 2, -20]], 2.4);
    inset(g, wall, 4, 1.6, col);
  }, { seed, col, ss: opt.ss || 2 });
  p.win = win; p.door = door; p.wallH = h; p.ridge = -h - rh; p.ew = ew; p.w = w;
  // snow cap on the roof (a separate white piece along the two roof slopes)
  p.snowCap = piece([-ew - 30, -h - rh - 40, ew + 30, -h + 20], g => {
    const eave = -h + 4, ridge = -h - rh;
    const top = [[-ew - 14, eave - 2], [-ew + 8, eave - 20], [-w * .3, ridge - 8], [0, ridge - 18], [w * .3, ridge - 8], [ew - 8, eave - 20], [ew + 14, eave - 2]];
    const bot = [[ew + 6, eave + 8], [ew - 20, eave - 2], [w * .3, ridge + 12], [0, ridge + 4], [-w * .3, ridge + 12], [-ew + 20, eave - 2], [-ew - 6, eave + 8]];
    fill(g, q => trace(q, P([...top, ...sawEdge(bot, 7, 16, -1, .5, seed)], true, .5, seed + 3)), NIGHT.roofSnow);
  }, { seed: seed + 4, col: NIGHT.roofSnow, ss: 1.5, edge: .7 });
  // red pieces pasted on this house: couplets beside the door, a banner above, a 福 diamond, a window flower
  p.couplets = piece([-14, -dhOf(door) - 40, 14, 0], g => { fill(g, q => trace(q, Pl([[-11, -dhOf(door) - 30], [11, -dhOf(door) - 30], [11, -6], [-11, -6]], true, .4, seed + 5)), PAL.red); for (let k = 0; k < 4; k++) rosette(g, 0, -dhOf(door) - 14 - k * 22 * (dhOf(door) / 100), 5.5, 5, k, .25); }, { seed: seed + 5, ss: 2 });
  p.banner = piece([-door.w / 2 - 22, -24, door.w / 2 + 22, 2], g => { fill(g, q => trace(q, Pl([[-door.w / 2 - 20, -22], [door.w / 2 + 20, -22], [door.w / 2 + 20, -2], [-door.w / 2 - 20, -2]], true, .4, seed + 6)), PAL.red); for (let k = -1; k <= 1; k++) rosette(g, k * 22, -12, 6, 5, k, .25); }, { seed: seed + 6, ss: 2 });
  p.fu = piece([-18, -18, 18, 18], g => { fill(g, q => { q.moveTo(0, -17); q.lineTo(17, 0); q.lineTo(0, 17); q.lineTo(-17, 0); q.closePath(); }, PAL.red); rosette(g, 0, 0, 8, 6, 0, .25); }, { seed: seed + 7, ss: 2 });
  return p;
}
const dhOf = d => d.h;
// ---------- the gate tower (门楼): two pillars, a tiled roof, a plaque, a lantern each side, the firecracker string under the beam ----------
export function gatePiece(col = NIGHT.houseDark, seed = 91) {
  const p = piece([-240, -420, 240, 10], g => {
    const roof = Pl([[-236, -300], [-210, -318], [-150, -392], [0, -404], [150, -392], [210, -318], [236, -300], [200, -290], [-200, -290]], true, .4, seed);
    fill(g, q => trace(q, roof), col);
    for (let k = 0; k < 3; k++) { const u = (k + .7) / 3, y = -404 + (112) * u, half = 150 + 60 * u; sawRow(g, [[-half, y], [half, y]], 11, 10, -1, .7); cutTaper(g, [[-half, y + 2], [0, y + 3], [half, y + 2]], 2.4); }
    cutTaper(g, [[-140, -392], [0, -398], [140, -392]], 3.4);
    swirl(g, 150, -384, 12, 1.5, 3.2, 0, 1); swirl(g, -150, -384, 12, 1.5, 3.2, Math.PI, -1);
    // beam + plaque slot
    fill(g, q => trace(q, Pl([[-210, -292], [210, -292], [210, -250], [-210, -250]], true, .3, seed + 1)), col);
    cut(g, q => { q.rect(-70, -286, 140, 30); q.rect(-66, -282, 132, 22); }, 'evenodd');
    dots(g, along([[-200, -262], [200, -262]], 18).map(q => [q.x, q.y]), 2.6);
    // pillars with brick crescents
    for (const s of [-1, 1]) { const x = s * 170; const pil = Pl([[x - 26, -252], [x + 26, -252], [x + 30, 0], [x - 30, 0]], true, .3, seed + 2 + s); fill(g, q => trace(q, pil), col); inset(g, pil, 3.5, 1.5, col); within(g, pil, () => { g.save(); g.beginPath(); g.rect(x - 30, -60, 60, 60); g.clip(); crescentRows(g, x - 30, -58, x + 30, -4, 8, 2.8, 0, .7); g.restore(); }); }
  }, { seed, col, ss: 2 });
  p.plaque = piece([-70, -16, 70, 16], g => { fill(g, q => trace(q, Pl([[-66, -13], [66, -13], [66, 13], [-66, 13]], true, .4, seed + 8)), PAL.red); rosette(g, -46, 0, 8, 6, 0, .25); rosette(g, 46, 0, 8, 6, 0, .25); plum(g, 0, 0, 9); }, { seed: seed + 8, ss: 2 });
  // firecracker string: a cord with paired red cylinders, a fuse at the bottom
  p.crackers = piece([-40, -10, 40, 300], g => {
    g.strokeStyle = PAL.red; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 272); g.stroke();
    for (let i = 0; i < 9; i++) for (const s of [-1, 1]) { const y = 20 + i * 28; g.save(); g.translate(s * 15, y); g.rotate(s * .5); fill(g, q => q.rect(-22, -8, 44, 16), PAL.red); cut(g, q => q.rect(-16, -1.5, 32, 3)); g.restore(); }
    fill(g, q => q.arc(0, -4, 10, 0, 7), PAL.red);
    g.strokeStyle = PAL.red; g.lineWidth = 2.4; g.beginPath(); g.moveTo(0, 272); g.quadraticCurveTo(14, 288, 6, 298); g.stroke();
  }, { seed: seed + 9, ss: 2 });
  return p;
}
// ---------- stone wall segment with a sawtooth cap of snow ----------
export function wallPiece(w = 700, col = NIGHT.wall, seed = 101) {
  const p = piece([-w / 2 - 10, -100, w / 2 + 10, 10], g => {
    const out = Pl([[-w / 2, -84], [w / 2, -84], [w / 2 + 6, 0], [-w / 2 - 6, 0]], true, .4, seed);
    fill(g, q => trace(q, out), col); inset(g, out, 3.5, 1.5, col);
    within(g, out, () => crescentRows(g, -w / 2, -80, w / 2, -4, 12, 4, 0, .7));
  }, { seed, col, ss: 1.5 });
  p.snow = piece([-w / 2 - 14, -110, w / 2 + 14, -70], g => { const top = []; for (let x = -w / 2 - 10; x <= w / 2 + 10; x += 14) top.push([x, -100 + 6 * Math.sin(x * .05 + seed)]); fill(g, q => trace(q, P([...top, [w / 2 + 10, -82], [-w / 2 - 10, -82]], true, .5, seed + 1)), NIGHT.roofSnow); }, { seed: seed + 1, col: NIGHT.roofSnow, ss: 1.5, edge: .7 });
  return p;
}
// ---------- bare tree (branches as strokes, twigs sawtooth), with snow lines on the branches ----------
export function treePiece(opt = {}) {
  const col = opt.col || NIGHT.tree, seed = opt.seed || 111, s = opt.s || 1;
  return piece([-220, -560, 220, 10], g => {
    g.scale(s, s);
    const br = (x0, y0, a, L, w, d) => {
      const x1 = x0 + Math.cos(a) * L, y1 = y0 + Math.sin(a) * L, mx = (x0 + x1) / 2 + Math.cos(a + 1.57) * L * .14, my = (y0 + y1) / 2 + Math.sin(a + 1.57) * L * .14;
      g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(mx, my, x1, y1); g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.stroke();
      if (d > 0) { br(x1, y1, a - .5 - rnd(d * 7, seed) * .35, L * .72, w * .66, d - 1); br(x1, y1, a + .42 + rnd(d * 5, seed) * .35, L * .64, w * .62, d - 1); if (d === 2) br(x1, y1, a + (rnd(d, seed) - .5) * .4, L * .5, w * .5, 0); }
      else { for (let k = 0; k < 3; k++) { const aa = a + (k - 1) * .5; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x1 + Math.cos(aa) * 16, y1 + Math.sin(aa) * 16); g.lineWidth = 2.2; g.stroke(); } }
    };
    br(0, 0, -1.57, 170, 30, 4);
    // trunk texture
    cutTaper(g, curve([[-4, -20], [-6, -80], [-2, -140]], false, 3), 4);
  }, { seed, col, ss: opt.ss || 2 });
}
// ---------- snow ground: off-white paper with drifts (sawtooth edges) ----------
export function snowPiece(opt = {}) {
  const w = opt.w || 4400, h = opt.h || 360, seed = opt.seed || 121, col = opt.col || NIGHT.snow;
  return piece([-w / 2, -90, w / 2, h], g => {
    const top = []; for (let x = -w / 2; x <= w / 2; x += 16) top.push([x, -18 * Math.sin(x * .004 + seed) - 12 * Math.sin(x * .011 + seed * 3) - 22]);
    fill(g, q => trace(q, [...top, [w / 2, h], [-w / 2, h]]), col);
    for (let k = 0; k < 50; k++) { const x = -w / 2 + rnd(k, seed) * w, y = 30 + rnd(k, seed + 1) * (h - 60); crescent(g, x, y, 14 + rnd(k, seed + 2) * 12, Math.PI * .2, Math.PI * .8, 3); }
  }, { seed, col, ss: opt.ss || 1, edge: .8 });
}
export function driftPiece(w = 600, h = 120, seed = 131, col = NIGHT.drift) {
  return piece([-w / 2 - 10, -h - 10, w / 2 + 10, 10], g => {
    const top = []; for (let i = 0; i <= 30; i++) { const u = i / 30; top.push([-w / 2 + u * w, -h * Math.sin(u * Math.PI) ** .7 * (1 + .15 * Math.sin(u * 9 + seed))]); }
    fill(g, q => trace(q, P([...top, [w / 2, 0], [-w / 2, 0]], true, .5, seed)), col);
    crescent(g, 0, -h * .45, w * .18, Math.PI * .15, Math.PI * .85, 5);
  }, { seed, col, ss: 1.5, edge: .8 });
}
// ---------- far hills (indigo, lighter) ----------
export function hillsPiece(opt = {}) {
  const w = opt.w || 4400, col = opt.col || NIGHT.far, seed = opt.seed || 81, hs = opt.hs || 1;
  return piece([-w / 2, -460 * hs, w / 2, 40], g => {
    const top = [];
    for (let x = -w / 2; x <= w / 2; x += 20) { const u = x / w; top.push([x, -(150 + 150 * Math.sin(u * 6.1 + seed) + 70 * Math.sin(u * 15.7 + seed * 2) + 36 * Math.sin(u * 29 + seed)) * hs * .9 - 60 * hs]); }
    const ridge = sawEdge(top, 14 * hs, 28, 1, .9, seed);
    fill(g, q => trace(q, [...ridge, [w / 2, 40], [-w / 2, 40]]), col);
    for (let k = 0; k < 10; k++) { const x = -w / 2 + (k + .5) * w / 10 + (rnd(k, seed) - .5) * 120, y = -90 * hs - rnd(k, seed + 1) * 70 * hs; cloudCut(g, x, y, 24 * hs, 3, rnd(k, seed + 2) * 6, k % 2 ? 1 : -1); }
    cutTaper(g, top.map(([x, y]) => [x, y + 36 * hs]), 3.2);
  }, { seed, col, ss: opt.ss || 1 });
}
// ---------- small red lantern (origin = top of the cord) ----------
export function lanternPiece(opt = {}) {
  const col = opt.col || PAL.red, seed = opt.seed || 141;
  return piece([-32, -2, 32, 100], g => {
    g.strokeStyle = col; g.lineWidth = 2.4; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 16); g.stroke();
    fill(g, q => q.rect(-11, 14, 22, 6), col);
    fill(g, q => q.ellipse(0, 44, 26, 24, 0, 0, 7), col);
    fill(g, q => q.rect(-9, 66, 18, 6), col);
    for (const v of [-13, 0, 13]) cutTaper(g, curve([[v * .6, 26], [v, 44], [v * .6, 62]], false, 2), 3.4);
    for (const x of [-5, 0, 5]) { g.beginPath(); g.moveTo(0, 72); g.lineTo(x * 1.4, 96); g.lineWidth = 2; g.stroke(); }
  }, { seed, col, ss: 3 });
}
// ---------- falling snow: small white paper flakes stepped at 12 fps, 3 parallax layers; opt.scraps adds red offcuts among them ----------
export function drawSnowfall(g, t, C, layer = 0, opt = {}) {
  const n = [80, 56, 30][layer], r = [2.2, 3.4, 5.5][layer], sp = [24, 38, 60][layer], par = [.3, .55, 1][layer], W = 1920, H = 1080;
  const tt = Math.floor(t * 12) / 12;
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = opt.col || '#eef0f8';
  g.shadowColor = 'rgba(0,0,0,.2)'; g.shadowBlur = 2; g.shadowOffsetX = 1; g.shadowOffsetY = 1.5;
  for (let k = 0; k < n; k++) {
    const x0 = rnd(k, 11 + layer) * (W + 200), y0 = rnd(k, 13 + layer) * (H + 200);
    const x = ((x0 + Math.sin(tt * .9 + k) * 18 - C[4] * par * .3) % (W + 200) + W + 200) % (W + 200) - 100;
    const y = ((y0 + tt * sp * (opt.speed || 1)) % (H + 200)) - 100;
    if (opt.scraps && k % 5 === 0) { g.fillStyle = '#d2201f'; g.beginPath(); g.moveTo(x - r * 2, y - r); g.lineTo(x + r * 2, y - r * 1.6); g.lineTo(x + r * .6, y + r * 1.8); g.closePath(); g.fill(); g.fillStyle = opt.col || '#eef0f8'; }
    else { g.beginPath(); g.arc(x, y, r * (.7 + .5 * rnd(k, 17)), 0, 7); g.fill(); }
  }
  g.restore();
}
// ---------- the village layout: five houses stepping up a slope to the right, the gate at the left, the hero house (小雪's) at the right ----------
export const GROUND = 900;
export const HOUSES = [
  { x: 1120, s: .9, i: 0, g: 0 }, { x: 1540, s: 1.0, i: 1, g: -20 }, { x: 1980, s: 1.05, i: 2, g: -50 }, { x: 2420, s: .95, i: 3, g: -70 }, { x: 2860, s: 1.0, i: 4, g: -100 },
];
export const HERO = { x: 2420, i: 3 };     // 小雪's house: the fourth, with the big round window
export const GATE = { x: 560, g: 0 };
export function kit() {
  if (V.houses) return V;
  V.houses = HOUSES.map((h, i) => housePiece({ w: 360 + (i % 3) * 30, h: 190 + (i % 2) * 16, rh: 116 + (i % 2) * 10, seed: 71 + i * 3, col: i % 2 ? NIGHT.house : NIGHT.houseDark, win: i === HERO.i ? { x: -100, y: -108, w: 110, h: 92 } : { x: -90 - (i % 3) * 6, y: -104, w: 86, h: 70 }, door: { x: 84 + (i % 3) * 8, w: 74, h: 140 } }));
  V.gate = gatePiece(); V.wall = wallPiece(760); V.wall2 = wallPiece(520, NIGHT.wall, 103);
  V.far = hillsPiece({ w: 5200, col: NIGHT.far, seed: 81, hs: 1.3 }); V.mid = hillsPiece({ w: 5200, col: NIGHT.mid, seed: 84, hs: .9 });
  V.snow = snowPiece({ w: 6000 }); V.snowNear = snowPiece({ w: 6000, h: 260, seed: 123, col: NIGHT.snowNear });
  V.drifts = [driftPiece(520, 110, 131), driftPiece(380, 80, 133), driftPiece(700, 130, 135)];
  V.tree = treePiece({ seed: 111 }); V.tree2 = treePiece({ seed: 113, s: .8 });
  V.lantern = lanternPiece({});
  V.flower = tuanhua(1.2, PAL.red); V.flowerS = tuanhua(.5, PAL.red);
  return V;
}
