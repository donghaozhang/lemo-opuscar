// 愚公移山 · stage: the print frame, camera, carving-in helpers, letterpress captions, the print pass
import * as WC from './engine/index.js';
import { clamp } from '/core/lib.js';

export const W = 1920, H = 1080;
export const IMG = { x: 44, y: 38, w: 1832, h: 890 };      // printed image area; captions live in the bottom margin
export const PW = IMG.w, PH = IMG.h;                       // plate coordinates
export const RED = '#C4321E';                              // the one colour: sunrise red
export const [M, m] = WC.canvas(W, H);                     // carve mask (white = cut)
export const [C, c] = WC.canvas(W, H);                     // colour plate (alpha)
let P = null;
export function printer() { return P || (P = WC.makePrinter(W, H)); }

// camera: centre (x,y) in plate coords, zoom z, roll r
export function camMatrix(cam = {}, full = false) {
  const z = cam.z ?? 1, r = cam.r ?? 0, cs = Math.cos(r) * z, sn = Math.sin(r) * z;
  const ox = full ? W / 2 : IMG.x + IMG.w / 2, oy = full ? H / 2 : IMG.y + IMG.h / 2;
  const x = cam.x ?? PW / 2, y = cam.y ?? PH / 2;
  return [cs, sn, -sn, cs, ox - (cs * x - sn * y), oy - (sn * x + cs * y)];
}
// plate → screen
export function toScreen(cam, x, y) { const k = camMatrix(cam); return [k[0] * x + k[2] * y + k[4], k[1] * x + k[3] * y + k[5]]; }

// start a frame: paper everywhere, black block in the image area, camera applied to mask + plate
export function begin(cam = {}, { full = false, ground = '#000' } = {}) {
  m.setTransform(1, 0, 0, 1, 0, 0); c.setTransform(1, 0, 0, 1, 0, 0);
  m.fillStyle = '#fff'; m.fillRect(0, 0, W, H); c.clearRect(0, 0, W, H);
  for (const g of [m, c]) {
    g.save();
    if (!full) { g.beginPath(); g.rect(IMG.x, IMG.y, IMG.w, IMG.h); g.clip(); }
    g.transform(...camMatrix(cam, full));
  }
  m.fillStyle = ground; m.fillRect(-6000, -6000, 14000, 14000);
}
export function end() { m.restore(); c.restore(); m.setTransform(1, 0, 0, 1, 0, 0); c.setTransform(1, 0, 0, 1, 0, 0); }

// ---------------------------------------------------------------- carving in time
// Strokes built with reveal {t0:0, t1:1, key, speed} carry a key in s.t0 (0..1) and a duration in seconds.
// carve() maps that key onto a window [T0,T1] of shot-local time, so the same cached strokes can be carved
// in any shot at any moment. Strokes without a reveal are always fully cut.
const prog = (s, lt, T0, T1) => {
  if (s.t0 < -1e8) return 1;
  const st = T0 + s.t0 * (T1 - T0), u = clamp((lt - st) / s.dur);
  return u < 1 ? u * (.55 + .45 * u) : 1;
};
export function carve(g, list, lt = 1e9, T0 = 0, T1 = 1, color = '#fff', tips = null) {
  g.fillStyle = color; g.beginPath();
  for (const s of list) {
    const pr = prog(s, lt, T0, T1); if (pr <= 0) continue;
    const Lv = WC.strokePath(g, s, pr);
    if (tips && pr < 1 && Lv > 0) tips.push(tipOf(s, Lv));
  }
  g.fill('nonzero');
}
function tipOf(s, Lv) {
  const p = s.p, n = p.length / 2; let L = 0;
  for (let i = 1; i < n; i++) {
    const d = Math.hypot(p[2 * i] - p[2 * i - 2], p[2 * i + 1] - p[2 * i - 1]);
    if (L + d >= Lv) { const f = (Lv - L) / (d || 1); return { x: p[2 * i - 2] + (p[2 * i] - p[2 * i - 2]) * f, y: p[2 * i - 1] + (p[2 * i + 1] - p[2 * i - 1]) * f, a: Math.atan2(p[2 * i + 1] - p[2 * i - 1], p[2 * i] - p[2 * i - 2]), w: s.w[i] ?? s.w[0] }; }
    L += d;
  }
  return { x: p[2 * n - 2], y: p[2 * n - 1], a: 0, w: s.w[0] };
}
// a WC.shape drawn with carving in time (halo first, then the solid, then its hatching)
export function carveShape(g, S, lt = 1e9, T0 = 0, T1 = 1, { fill = true, white = false } = {}) {
  if (S.halo.length) carve(g, S.halo, lt, T0, T1, '#fff');
  if (fill) WC.fillPoly(g, S.polys, white ? '#fff' : '#000');
  carve(g, S.strokes, lt, T0, T1, white ? '#000' : '#fff');
}
// reveal option for builders: key(x,y) → 0..1, carved over the window given at draw time
export const RV = (key, speed = 1000, jit = .08) => ({ t0: 0, t1: 1, key, speed, jit });

// ---------------------------------------------------------------- captions (letterpress in the bottom margin)
export function caption(text, a = 1) {
  if (!text || a <= 0) return;
  m.save(); m.setTransform(1, 0, 0, 1, 0, 0);
  m.font = '600 46px "Noto Serif SC"'; m.textAlign = 'center'; m.textBaseline = 'middle';
  try { m.letterSpacing = '6px'; } catch (e) { }
  m.fillStyle = `rgba(0,0,0,${a})`;
  m.fillText(text, W / 2 + 3, IMG.y + IMG.h + (H - IMG.y - IMG.h) / 2 + 2);
  try { m.letterSpacing = '0px'; } catch (e) { }
  m.restore();
}
export const CAP_BOX = text => { const w = text.length * 52 + 20; return [W / 2 - w / 2, IMG.y + IMG.h + 30, W / 2 + w / 2, H - 30]; };

// print the mask (+ colour plate) and put it on the target, with an impression jolt
export function print(g, o = {}) {
  const out = printer().render(M, C, { seed: o.seed ?? 3, inkSeed: o.inkSeed ?? 3, reg: o.reg || [3, 2], plateAmt: o.plateAmt ?? 1, plate: RED, edge: o.edge ?? 1, mode: o.mode, sheen: o.sheen, wetX: o.wetX, grainAng: o.grainAng });
  const j = o.jolt || [0, 0];
  if (j[0] || j[1]) { g.fillStyle = '#EFE8D8'; g.fillRect(0, 0, W, H); }
  g.drawImage(out, j[0], j[1]);
  return out;
}
// a hard cut lands like a new impression: 2 frames of misregistration
export const jolt = lt => lt < 1 / 24 ? [5, -3] : lt < 2 / 24 ? [-2, 1] : [0, 0];
export const regJolt = lt => lt < 1 / 24 ? [10, -6] : lt < 2 / 24 ? [6, 1] : [3, 2];
