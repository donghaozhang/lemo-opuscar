// 愚公移山 · the world, carved. Plate coordinates: 1832 × 890 (the printed image area at 1× camera).
// Every builder is cached and builds itself on first use (deterministic per worker). Strokes carry reveal keys
// (0..1) so a plate can be carved in over any window of shot time with ST.carve / ST.carveShape.
import * as WC from './engine/index.js';
import * as ST from './stage.js';
import * as INK from './ink.js';
import { clamp, mulberry, lerp } from '/core/lib.js';

const PI = Math.PI, PW = ST.PW, PH = ST.PH, RV = ST.RV;
const C = {};
const once = (k, f) => C[k] || (C[k] = f());
const hr = (x, y) => { const v = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453; return v - Math.floor(v); };
export const GROUND = 700;                          // horizon / mountain foot in the wide
const LSUN = WC.light(.7, -.55, .45);               // morning sun from the east (right)

// ---------------------------------------------------------------- generic pieces
// sky of horizontal knife sweeps; tone(x,y) 0..1 (bright = wide cuts). key: reveal order (coarse first)
export function sky(key, rect, tone, o = {}) {
  return once('sky.' + key, () => WC.hatch(new WC.Region([WC.rect(...rect)], { res: 4 }), {
    dir: o.dir || ((x, y) => .02 * Math.sin(x * .002 + y * .001)), tone, sp: o.sp ?? 13, wmax: o.wmax ?? 13, lo: o.lo ?? .15, hi: 1, gamma: 1.1,
    seed: o.seed ?? 21, seg: o.seg || [380, 1100], gap: o.gap || [3, 12], jit: .03, kind: 'u', minLen: 60, maxLen: 40000, reveal: RV(o.key || ((x, y) => clamp(1 - tone(x, y)) * .8 + .2 * hr(x, y)), 1800) }));
}
// a great mountain: a jagged massif with shoulders; the east flank lit (cuts along the fall line), west in shadow
export function massif(key, o) {
  return once('m.' + key, () => {
    const r = mulberry(o.seed ?? 3), [px, py] = o.peak, base = o.base ?? GROUND + 40, hwL = o.hwL, hwR = o.hwR;
    const Lp = [], Rp = [];
    const nl = o.n ?? 9;
    for (let k = 0; k <= nl; k++) { const u = k / nl; Lp.push([px - hwL * u + (r() - .5) * 40 * u, py + (base - py) * Math.pow(u, o.pow ?? 1.35) + (r() - .5) * 70 * Math.sin(u * PI) + (k % 3 === 1 ? -50 : 0)]); }
    for (let k = 1; k <= nl; k++) { const u = k / nl; Rp.push([px + hwR * u + (r() - .5) * 40 * u, py + (base - py) * Math.pow(u, o.pow ?? 1.25) + (r() - .5) * 70 * Math.sin(u * PI) + (k % 3 === 2 ? -56 : 0)]); }
    const poly = [...Lp.reverse(), ...Rp, [px + hwR + 200, base + 400], [px - hwL - 200, base + 400]];
    const spine = y => px + 60 * Math.sin((y - py) * .006) + 20 * Math.sin(y * .03);
    const tone = () => (x, y) => {
      const u = clamp((y - py) / (base - py)), sx = spine(y);
      const strata = .5 + .5 * Math.sin(y * .035 + Math.sin(x * .01) * 2);
      if (x > sx) return clamp(.95 - .55 * u + .18 * strata * (1 - u) - .25 * clamp((x - sx) / (hwR * 1.1)) ** 2);
      return clamp(.12 + .4 * Math.max(0, strata - .78) * (1 - u) + .3 * clamp(1 - (sx - x) / 60) * (1 - u));
    };
    const dir = (x, y) => x > spine(y) ? .9 + .25 * Math.sin(y * .01) : PI - .9;
    const S = WC.shape([poly], { tone, dir, sp: o.sp ?? 9, wmax: o.wmax ?? 9, lo: .25, hi: .95, halo: o.halo ?? 6, seed: o.seed ?? 3, seg: [30, 140], gap: [3, 16], jit: .08, res: 3, kind: 'v',
      reveal: RV((x, y) => clamp((y - py) / (base - py)) * .7 + .3 * r(), 1300) });
    // ridge knife lines (white) along the crest and a few shoulder ridges
    const ridge = WC.cutAlong(WC.resample(Rp.slice(0, 6).map(p => [p[0] - 4, p[1] + 6]), 6), { w: (u) => 5 * (1 - u * .6), kind: 'v', seg: [50, 160], gap: [4, 14], seed: 7, reveal: { t0: 0, t1: .5, speed: 900 } });
    // secondary ridges branching down the shadow flank (white knife lines) and down the lit flank (black)
    for (let i = 0; i < 7; i++) {
      const y0 = py + (base - py) * (.12 + i * .12), x0 = spine(y0), side = i % 2 ? 1 : -1, L = (base - y0) * (.6 + r() * .5);
      const pts = []; for (let k = 0; k <= 12; k++) { const u = k / 12; pts.push([x0 + side * (L * .75 * u) + Math.sin(u * 5 + i) * 14, y0 + L * u * .8]); }
      const cuts = WC.cutAlong(pts, { w: (u) => (side < 0 ? 5 : 4) * (1 - u * .7), kind: 'v', seg: [40, 120], gap: [6, 20], seed: 30 + i, reveal: { t0: .4, t1: .9, speed: 800 } });
      cuts.forEach(c => c.black = side > 0); ridge.push(...cuts);
    }
    return { S, poly, peak: [px, py], spine, ridge, Lp, Rp };
  });
}
export function drawMassif(g, M, lt, T0, T1) { ST.carveShape(g, M.S, lt, T0, T1); ST.carve(g, M.ridge.filter(c => !c.black), lt, T0, T1); ST.carve(g, M.ridge.filter(c => c.black), lt, T0, T1, '#000'); }

// ground: lit near-horizontal cuts, bright toward the horizon
export function ground(key, y0, y1, o = {}) {
  return once('g.' + key, () => {
    const P = [[-1400, y0], ...WC.resample([[-1400, y0], [PW + 1400, y0]], 60).map(([x, y]) => [x, y + Math.sin(x * .004 + (o.ph ?? 0)) * (o.wave ?? 6)]), [PW + 1400, y0], [PW + 1400, y1], [-1400, y1]];
    return WC.shape([P], { tone: () => o.tone || ((x, y) => clamp(.75 - (y - y0) / (o.fall ?? 260) + .12 * Math.sin(x * .006 + y * .02))), dir: (x, y) => .04 * Math.sin(x * .003 + y * .01) + (o.ang ?? 0), sp: o.sp ?? 11, wmax: 10, lo: .2, hi: 1, halo: 0, maxLen: 40000, seed: o.seed ?? 12, seg: [160, 600], gap: [4, 16], res: 4, kind: 'u',
      reveal: RV((x, y) => clamp((y - y0) / 300) * .6 + .4 * clamp(Math.abs(x - PW / 2) / 1400), 1500) });
  });
}
// radial rays of carved light
export const sunRays = (key, cx, cy, o = {}) => once('ray.' + key, () => WC.rays(cx, cy, { n: o.n ?? 44, r0: o.r0 ?? 90, r1: o.r1 || [500, 1100], w: o.w ?? 16, seed: o.seed ?? 5, a0: o.a0 ?? 0, a1: o.a1 ?? 2 * PI, jit: .7, kind: 'u', reveal: { t0: 0, t1: 1, jit: .4 } }));
// a disc of concentric cuts (the sun), carved white
export function sunDisc(key, cx, cy, r) {
  return once('sun.' + key, () => WC.shape([WC.ellipse(cx, cy, r, r, 48)], { tone: () => () => 1, dir: WC.dirRing(cx, cy), sp: 7, wmax: 9, lo: .1, halo: 6, seed: 9, res: 2, reveal: RV((x, y) => clamp(Math.hypot(x - cx, y - cy) / r), 900) }));
}
// Chinese cloud scroll (祥云): white carved mass, black spiral line inside
export function cloud(key, cx, cy, s, o = {}) {
  return once('cl.' + key, () => {
    const P = [];
    const lobes = o.lobes ?? [[-1.2, .1, .5], [-.6, -.35, .6], [.1, -.5, .7], [.8, -.25, .55], [1.3, .15, .45]];
    const pts = [];
    for (let a = 0; a <= 2 * PI + .01; a += .05) {
      let best = 0; const dx = Math.cos(a), dy = Math.sin(a) * .55;
      for (const [lx, ly, lr] of lobes) { // ray-circle intersection, take the furthest
        const bx = -lx, by = -ly, B = 2 * (dx * bx + dy * by), Cc = bx * bx + by * by - lr * lr, D = B * B - 4 * (dx * dx + dy * dy) * Cc;
        if (D >= 0) best = Math.max(best, (-B + Math.sqrt(D)) / (2 * (dx * dx + dy * dy)));
      }
      pts.push([cx + dx * best * s, cy + Math.max(dy * best * s, .25 * s)]);
    }
    const S = WC.shape([pts], { white: true, tone: () => (x, y) => clamp(.95 - (y - cy + .4 * s) / (1.2 * s) * .7), dir: 0, sp: 8, lo: .5, halo: 6, seed: o.seed ?? 4, res: 3, reveal: RV((x, y) => clamp((x - cx + 1.8 * s) / (3.6 * s)), 1000) });
    const spirals = lobes.slice(1, 4).map(([lx, ly, lr], i) => { const sp = []; for (let k = 0; k < 40; k++) { const u = k / 39, a = -PI / 2 + u * PI * 2.4 * (i % 2 ? -1 : 1), rr = lr * s * .8 * (1 - u * .75); sp.push([cx + lx * s + Math.cos(a) * rr, cy + ly * s * .6 + Math.sin(a) * rr * .55]); } return WC.cutAlong(sp, { w: (u) => 6 * (1 - u * .7), kind: 'k', seg: [400, 900], gap: [0, 1], seed: i, reveal: { t0: .5, t1: .9, speed: 800 } }); }).flat();
    return { S, spirals };
  });
}
export function drawCloud(g, Cl, lt, T0, T1) { ST.carveShape(g, Cl.S, lt, T0, T1, { white: true }); ST.carve(g, Cl.spirals, lt, T0, T1, '#000'); }

// stab flecks (snow, sparks, petals, stars)
export function flecks(key, n, box, rr, seed, ang = 1.2) { return once('fl.' + key, () => { const r = mulberry(seed); const pts = []; for (let i = 0; i < n; i++) pts.push([box[0] + r() * box[2], box[1] + r() * box[3], rr[0] + r() * (rr[1] - rr[0])]); return WC.flecks(pts, { seed, angle: ang }); }); }

// ---------------------------------------------------------------- THE TWO MOUNTAINS (the wide, re-cut each season)
export const TAIHANG = { peak: [560, 70], hwL: 900, hwR: 520, seed: 31 }, WANGWU = { peak: [1330, 150], hwL: 430, hwR: 820, seed: 47 };
export function mountains() {
  return once('mountains', () => ({
    th: massif('th', { ...TAIHANG, base: GROUND + 30, sp: 9 }),
    ww: massif('ww', { ...WANGWU, base: GROUND + 30, sp: 9 }),
    far: massif('far', { peak: [960, 330], hwL: 1500, hwR: 1500, seed: 5, sp: 6, wmax: 6, base: GROUND + 20, n: 14, halo: 4 }),
    sky: sky('wide', [-1600, -1400, PW + 3200, GROUND + 1400], (x, y) => clamp(.2 + .8 * clamp((y + 200) / (GROUND + 200)) ** 1.8), { sp: 13 }),
    ground: ground('wide', GROUND + 10, PH + 900, { fall: 160 }),
  }));
}
// the notch the family has dug at Taihang's foot: a pale bite with terraces; n 0..1 (a scratch at most)
export function notch(g, n, x = 330, y = GROUND + 18, k = 1) {
  if (n <= 0) return;
  const w = 70 * n * k, h = 42 * n * k;
  INK.poly(g, [[x - w, y], [x - w * .7, y - h * .7], [x - w * .2, y - h], [x + w * .5, y - h * .8], [x + w, y]], '#fff');
  for (let i = 1; i < 4; i++) INK.taper(g, [[x - w * (.8 - i * .15), y - h * i * .22], [x + w * (.85 - i * .12), y - h * i * .2]], 2 * k, '#000', { spline: false });
}
export function drawMountains(g, lt, T0 = -10, T1 = -9, o = {}) {
  const W = mountains();
  ST.carve(g, W.sky, lt, T0, T0 + (T1 - T0) * .55);
  drawMassif(g, W.far, lt, T0 + (T1 - T0) * .2, T0 + (T1 - T0) * .6);
  if (!o.noWW) drawMassif(g, W.ww, lt, T0 + (T1 - T0) * .3, T1);
  if (!o.noTH) drawMassif(g, W.th, lt, T0 + (T1 - T0) * .25, T1);
  ST.carveShape(g, W.ground, lt, T0 + (T1 - T0) * .4, T1);
}

// ---------------------------------------------------------------- the cottage at the foot, the door facing the rock
export const HOUSE = { x: 380, base: 700, w: 300, h: 170, door: [600, 700] };
export function cottage() {
  return once('cottage', () => {
    const { x, base, w, h } = HOUSE;
    const wall = WC.shape([[[x, base], [x, base - h], [x + w, base - h], [x + w, base]]], { light: LSUN, tone: () => (X, Y) => clamp(.7 - (Y - base + h) / 400 + .15 * Math.sin(Y * .2)), dir: 0, sp: 8, lo: .3, halo: 5, seed: 71, res: 2, reveal: RV((X, Y) => clamp((base - Y) / h), 900) });
    const roof = WC.shape([[[x - 50, base - h + 10], [x + 40, base - h - 110], [x + w - 30, base - h - 116], [x + w + 50, base - h + 6]]], { tone: () => (X, Y) => clamp(.25 + .6 * ((X - x) / w)), dir: PI / 2 - .5, sp: 7, lo: .3, halo: 6, seed: 72, res: 2, reveal: RV((X, Y) => clamp((X - x + 50) / (w + 100)), 900) });
    // thatch strands on the roof edge, timber lines
    const thatch = []; for (let i = 0; i < 22; i++) { const X = x - 46 + i * (w + 92) / 21; thatch.push(...WC.cutAlong([[X, base - h + 8], [X + 6, base - h + 24]], { w: 4, kind: 'v', seed: i })); }
    const doorP = [[x + w - 92, base], [x + w - 92, base - 120], [x + w - 22, base - 120], [x + w - 22, base]];
    const win = WC.rect(x + 40, base - 130, 60, 50);
    // the cliff: right in front of the door, from the ground up past the frame
    const cliffP = [[x + w + 120, base + 300], [x + w + 120, base - 60], [x + w + 140, base - 300], [x + w + 110, base - 600], [x + w + 150, base - 1100], [x + w + 120, -3200], [PW + 900, -3200], [PW + 900, base + 300]];
    const cliff = WC.shape([cliffP], { light: LSUN, tone: () => (X, Y) => { const row = Math.floor(Y / 110 + .3 * Math.sin(X * .008)), col = Math.floor((X + row * 57) / 170), v = hr(row, col), f = (Y / 110 + .3 * Math.sin(X * .008)) % 1; return clamp((.1 + .85 * v) * Math.pow(1 - f, 2.2) * clamp(1.15 - (X - x - w - 120) / 1300) + .5 * clamp(1 - (X - x - w - 120) / 36)); }, dir: (X, Y) => .06 * Math.sin(Y * .01 + X * .004), sp: 9, lo: .25, halo: 7, seed: 73, res: 4, seg: [30, 120], reveal: RV((X, Y) => clamp((base - Y) / 1200), 1100) });
    const cracks = []; const r = mulberry(9); for (let i = 0; i < 26; i++) { const X = x + w + 160 + r() * 1200, Y = base - r() * 3600, pts = [[X, Y]]; for (let k = 0; k < 4; k++) pts.push([pts[k][0] + (r() - .5) * 60, pts[k][1] + 30 + r() * 50]); cracks.push(...WC.cutAlong(pts, { w: 3 + r() * 3, kind: 'v', seed: i, reveal: { t0: .5, t1: 1, speed: 700 } })); }
    return { wall, roof, thatch, doorP, win, cliff, cracks };
  });
}
export function drawCottage(g, lt, T0 = -10, T1 = -9, o = {}) {
  const K = cottage(), W = mountains();
  ST.carve(g, W.sky, lt, T0, T0 + (T1 - T0) * .5);
  ST.carveShape(g, W.ground, lt, T0 + (T1 - T0) * .3, T1);
  ST.carveShape(g, K.wall, lt, T0 + (T1 - T0) * .3, T1);
  ST.carve(g, K.thatch, lt, T0 + (T1 - T0) * .6, T1);
  ST.carveShape(g, K.roof, lt, T0 + (T1 - T0) * .3, T1);
  // door: open (dark interior) or shut (planks)
  const open = o.door ?? 0;
  if (lt > T0 + (T1 - T0) * .5) {
    if (open > 0) { const [a, b, c2, d] = K.doorP; INK.poly(g, [a, b, [lerp(b[0], c2[0], 1), b[1]], [lerp(a[0], d[0], 1), a[1]]], '#000'); INK.poly(g, [a, b, [lerp(b[0], c2[0], 1 - open * .8), b[1] + 8 * open], [lerp(a[0], d[0], 1 - open * .8), a[1] - 4]], '#fff');
      for (let i = 1; i < 3; i++) INK.taper(g, [[lerp(a[0], lerp(a[0], d[0], 1 - open * .8), i / 3), a[1] - 4], [lerp(b[0], lerp(b[0], c2[0], 1 - open * .8), i / 3), b[1] + 4]], 3, '#000', { spline: false }); }
    else { INK.poly(g, K.doorP, '#fff'); for (let i = 1; i < 4; i++) INK.taper(g, [[K.doorP[0][0] + i * 17.5, K.doorP[0][1] - 3], [K.doorP[1][0] + i * 17.5, K.doorP[1][1] + 3]], 3, '#000', { spline: false }); }
    INK.poly(g, K.win, o.lamp ? '#fff' : '#000'); INK.taper(g, [[K.win[0][0] + 30, K.win[0][1]], [K.win[0][0] + 30, K.win[2][1]]], 4, o.lamp ? '#000' : '#fff', { spline: false });
  }
  ST.carveShape(g, K.cliff, lt, T0 + (T1 - T0) * .1, T1);
  ST.carve(g, K.cracks, lt, T0, T1, '#000');
}

// ---------------------------------------------------------------- the map (overhead): house north, two mountains, market south
export const MAP = { house: [700, 120], market: [880, 790] };
export function mapPlate() {
  return once('map', () => {
    const r = mulberry(17);
    // pictographic peaks (white carved hats with black facet lines)
    const peaks = [];
    const range = (cx, cy, n, s) => { for (let i = 0; i < n; i++) { const x = cx + (i - n / 2) * s * .9 + (r() - .5) * 30, y = cy + (r() - .5) * 60 + Math.abs(i - n / 2) * 10, h = s * (1.1 + r() * .5) * (1 - Math.abs(i - n / 2) / n * .6); peaks.push({ x, y, h, w: s }); } };
    range(560, 420, 7, 120); range(1180, 450, 7, 110);
    const pk = peaks.sort((a, b) => a.y - b.y).map((p, i) => WC.shape([[[p.x - p.w * .8, p.y], [p.x - p.w * .2, p.y - p.h * .8], [p.x, p.y - p.h], [p.x + p.w * .3, p.y - p.h * .7], [p.x + p.w * .8, p.y]]], { white: true, tone: () => (x, y) => x > p.x ? .95 : .35, dir: (x, y) => x > p.x ? .9 : PI - .9, sp: 7, lo: .3, halo: 6, seed: 80 + i, res: 2, reveal: RV(() => i / 14 * .9, 1000) }));
    const field = sky('map', [-200, -200, PW + 400, PH + 400], (x, y) => .26 + .06 * Math.sin(x * .003 + y * .002), { sp: 15, wmax: 6, seed: 23 });
    // the river along the east, white
    const river = WC.cutAlong(WC.spline([[1700, -40], [1640, 200], [1720, 420], [1620, 640], [1700, 930]], 6), { w: 22, kind: 'u', seg: [200, 500], gap: [0, 2], seed: 3, reveal: { t0: 0, t1: .5, speed: 1600 } });
    // the detour: house → east around the mountains → south → west to the market
    const detourCP = [[700, 150], [880, 190], [1200, 220], [1500, 260], [1560, 420], [1500, 600], [1320, 690], [1100, 740], [900, 770]];
    const detour = WC.spline(detourCP, 4);
    const straight = WC.resample([[700, 150], [760, 460], [880, 770]], 4);
    return { pk, field, river, detour, straight };
  });
}
export function house(g, x, y, s = 1, lit = false) {   // little map house / cottage pictogram
  INK.poly(g, [[x - 34 * s, y], [x - 34 * s, y - 26 * s], [x, y - 52 * s], [x + 34 * s, y - 26 * s], [x + 34 * s, y]], '#fff');
  INK.poly(g, [[x - 40 * s, y - 24 * s], [x, y - 58 * s], [x + 40 * s, y - 24 * s], [x + 30 * s, y - 24 * s], [x, y - 46 * s], [x - 30 * s, y - 24 * s]], '#000');
  INK.poly(g, WC.rect(x - 8 * s, y - 20 * s, 16 * s, 20 * s), lit ? '#fff' : '#000');
}

// ---------------------------------------------------------------- the sea (far plain, horizon, waves)
export function sea() {
  return once('sea', () => {
    const skyS = sky('sea', [-800, -600, PW + 1600, 960], (x, y) => clamp(.3 + .7 * clamp((y + 100) / 560) ** 1.5), { sp: 13 });
    const r = mulberry(4), waves = [];
    for (let row = 0; row < 16; row++) { const y = 470 + row * row * 2.2 + row * 10, s = .4 + row * .12; for (let i = 0; i < 18; i++) { const x = (i + (row % 2) * .5) * 120 - 100 + (r() - .5) * 40, pts = []; for (let k = 0; k <= 8; k++) { const u = k / 8; pts.push([x + u * 90 * s * 1.6, y - Math.sin(u * PI) * 14 * s]); } waves.push(...WC.cutAlong(pts, { w: 3 + 4 * s, kind: 'v', seg: [400, 900], gap: [0, 1], seed: row * 31 + i, reveal: { t0: row / 18, t1: row / 18 + .1, speed: 900 } })); } }
    return { skyS, waves };
  });
}

// ---------------------------------------------------------------- trees
export function willow(key, x, base, h, o = {}) {
  return once('wil.' + key, () => {
    const r = mulberry(o.seed ?? 6);
    const trunk = WC.shape([[[x - 30, base], [x - 18, base - h * .5], [x - 40, base - h], [x + 10, base - h * 1.02], [x + 20, base - h * .5], [x + 34, base]]], { tone: () => (X) => X > x ? .7 : .2, dir: PI / 2, sp: 6, lo: .3, halo: 5, seed: 41, res: 2, reveal: RV((X, Y) => clamp((base - Y) / h), 900) });
    const strands = [];
    for (let i = 0; i < 46; i++) { const sx = x - 20 + (r() - .5) * h * 1.3, sy = base - h * (.85 + r() * .25), L = h * (.4 + r() * .6), pts = []; for (let k = 0; k <= 10; k++) { const u = k / 10; pts.push([sx + Math.sin(u * 2 + i) * 14 + (sx - x) * u * .2, sy + u * L]); } strands.push({ pts, ph: r() * 6 }); }
    return { trunk, strands };
  });
}
export function drawWillow(g, Wl, lt, t, wind = 1) {
  ST.carveShape(g, Wl.trunk, lt, 0, .8);
  for (const s of Wl.strands) { const P = s.pts.map(([x, y], k) => [x + Math.sin(t * 1.6 + s.ph + k * .3) * k * 1.6 * wind, y]); INK.taper(g, P, 7, '#000', { a: .1, b: .5, seed: s.ph * 10 | 0 }); INK.taper(g, P, 2.2, '#fff', { a: .2, b: .5, seed: s.ph * 10 | 0 }); }
}
export function blossomBranch(key, o = {}) {
  return once('bl.' + key, () => {
    const r = mulberry(8);
    const main = WC.shape([WC.spline([[-200, -100], [100, 40], [380, 120], [560, 160], [700, 200], [560, 176], [380, 146], [100, 70], [-200, -50]], 6, true)], { tone: () => () => .35, dir: .3, sp: 5, lo: .3, halo: 5, seed: 3, res: 2 });
    const buds = []; for (let i = 0; i < 70; i++) { const u = r(), x = -150 + u * 820, y = -60 + u * 250 + (r() - .5) * 120; buds.push([x, y, 3 + r() * 7]); }
    return { main, buds };
  });
}
