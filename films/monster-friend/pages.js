// The book's pages: props (houses, trees, the truck, the bed, the desk lamp, the crayon box, the table, the sandpit, the balloon…) and the seven page
// drawings, each drawn and coloured on a schedule in film time (lines first, colour after, as a child colours a page). World coords: a page is 2600×1460.
import { line, fill, dab, ellipse, handCircle, smooth, xf, text, CAM, W, H, sx, sy } from './crayon.js';
import { PAL } from './pal.js';
import { clamp, lerp, hash } from '/core/lib.js';
const K = PAL.crayon;
export const PW = 2600, PH = 1460;
export const pr = (t, a, b) => clamp((t - a) / (b - a));
const LW = 7;
const rect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
const L_ = (seed, extra = {}) => ({ w: LW, seed, ...extra });
const F_ = (col, seed, extra = {}) => ({ col, p: .62, gap: 11, w: 12, seed, over: 6, ...extra });
// an element's progress: lines over [l0,l1], colour over [f0,f1]
export const el = (t, l0, l1, f0 = null, f1 = null) => ({ on: t >= l0, pl: pr(t, l0, l1), pf: f0 == null ? (t >= l1 ? 1 : 0) : pr(t, f0, f1) });
function outline(L, poly, seed, pl, extra = {}) { if (pl > 0) line(L, [...poly, poly[0]], L_(seed, { draw: pl, ...extra })); }
function colour(F, poly, col, seed, pf, extra = {}) { if (pf > 0) fill(F, poly, F_(col, seed, { draw: pf, ...extra })); }

// ---------------- props ----------------
export function house(F, L, o, e) {
  if (!e.on) return;
  const { x, y, w, h, col, seed } = o;
  const body = rect(x, y - h, w, h);
  colour(F, body, col, seed, e.pf, { p: o.p ?? .5, ang: o.ang ?? .5 });
  outline(L, body, seed + 1, e.pl);
  if (o.gable !== false) { const g = [[x - 14, y - h], [x + w / 2, y - h - (o.gh || w * .42)], [x + w + 14, y - h]]; colour(F, g, o.roof || K.orange, seed + 2, e.pf, { p: .6, ang: 1.1 }); outline(L, g, seed + 3, e.pl); }
  else { const r = rect(x - 16, y - h - 36, w + 32, 36); colour(F, r, o.roof || K.orange, seed + 2, e.pf, { p: .6, ang: .2 }); outline(L, r, seed + 3, e.pl); }
  const [cols, rows] = o.win || [2, 3], ww = w / (cols * 2 + 1), wh = Math.min(ww * 1.2, h / (rows * 2 + 1));
  let k = 0;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const wx = x + ww * (1 + c * 2), wy = y - h + wh * (.8 + r * 2.1); if (wy + wh > y - 10) continue;
    const wp = rect(wx, wy, ww, wh); colour(F, wp, o.winCol || K.sky, seed + 10 + k, e.pf, { p: .7, gap: 7, w: 8, over: 2 }); outline(L, wp, seed + 30 + k, e.pl, { w: 5 }); k++;
  }
  if (o.door) { const dw = ww * 1.1, dp = rect(x + w / 2 - dw / 2, y - wh * 1.9, dw, wh * 1.9); colour(F, dp, o.doorCol || K.brown, seed + 60, e.pf, { p: .7, gap: 7, w: 8, over: 2 }); outline(L, dp, seed + 61, e.pl, { w: 5 }); }
}
export function tree(F, L, x, y, s, seed, e, o = {}) {
  if (!e.on) return;
  const trunk = smooth([[x - 28 * s, y], [x + 28 * s, y], [x + 22 * s, y - 120 * s], [x + 60 * s, y - 190 * s], [x + 30 * s, y - 180 * s], [x + 10 * s, y - 230 * s], [x - 12 * s, y - 230 * s], [x - 34 * s, y - 180 * s], [x - 66 * s, y - 200 * s], [x - 22 * s, y - 120 * s]], 3);
  colour(F, trunk, K.brown, seed, e.pf, { p: .7, gap: 9, w: 10, ang: 1.4 }); outline(L, trunk, seed + 1, e.pl);
  const cy = y - 330 * s, crown = [];
  for (let i = 0; i < 11; i++) { const a = i / 11 * Math.PI * 2; const r = (170 + 30 * Math.sin(i * 2.3 + seed)) * s; crown.push([x + Math.cos(a) * r * (o.wide || 1.25), cy + Math.sin(a) * r]); }
  const cr = smooth(crown, 6);
  colour(F, cr, o.col || K.green, seed + 2, e.pf, { p: .6, gap: 12, w: 13, ang: .8, cross: true, crossP: .5 }); outline(L, cr, seed + 3, e.pl, { w: 7 });
  return { cx: x, cy, r: 170 * s };
}
export function fence(F, L, x0, x1, y, seed, e, gap = null, h = 110) {
  if (!e.on) return;
  const n = Math.floor((x1 - x0) / 70); let k = 0;
  for (let i = 0; i <= n; i++) {
    const x = x0 + i * 70; if (gap && x > gap[0] && x < gap[1]) continue;
    const p = [[x - 16, y], [x - 16, y - h + 20], [x, y - h], [x + 16, y - h + 20], [x + 16, y]];
    const u = clamp(e.pl * (n + 2) - i); if (u <= 0) continue;
    colour(F, p, K.sand, seed + k, e.pf, { p: .6, gap: 8, w: 9, ang: 1.5 }); line(L, [...p, p[0]], L_(seed + 100 + k, { draw: u, w: 6 })); k++;
  }
  [y - 36, y - 80].forEach((yy, i) => line(L, gap ? [[x0, yy], [gap[0] - 20, yy]] : [[x0, yy], [x1, yy]], L_(seed + 200 + i, { draw: e.pl, w: 6 })));
  if (gap) [y - 36, y - 80].forEach((yy, i) => line(L, [[gap[1] + 20, yy], [x1, yy]], L_(seed + 210 + i, { draw: e.pl, w: 6 })));
}
export function gatePosts(F, L, gx0, gx1, y, seed, e) {
  if (!e.on) return;
  [gx0 - 20, gx1 + 20].forEach((x, i) => { const p = rect(x - 22, y - 170, 44, 170); colour(F, p, K.brown, seed + i, e.pf, { p: .7, gap: 8, w: 9, ang: 1.5 }); outline(L, p, seed + 10 + i, e.pl); dab(F, x, y - 180, 24, { col: K.yellow, seed: seed + 20 + i, p: .8 * e.pf }); line(L, handCircle(x, y - 180, 24, seed + 30 + i), L_(seed + 40 + i, { draw: e.pl, w: 5 })); });
}
export function slide(F, L, x, y, seed, e, flip = false) {
  if (!e.on) return;
  const k = flip ? -1 : 1, T = pts => pts.map(([px, py]) => [x + px * k, y + py]);
  const ramp = T([[0, -300], [60, -300], [340, -40], [340, 0], [300, 0], [40, -240], [0, -240]]);
  colour(F, ramp, K.sky, seed, e.pf, { p: .7, gap: 9, w: 10, ang: .9 }); outline(L, ramp, seed + 1, e.pl);
  line(L, T([[-10, 0], [-10, -300], [50, -300]]), L_(seed + 2, { draw: e.pl, col: K.brown }));
  for (let i = 0; i < 5; i++) line(L, T([[-10, -60 - i * 50], [20 + i * 2, -60 - i * 50]]), L_(seed + 3 + i, { draw: e.pl, w: 5, col: K.brown }));
  line(L, T([[310, -40], [340, -40], [340, 0]]), L_(seed + 9, { draw: e.pl, w: 5 }));
}
export function sun(F, L, x, y, r, seed, e) {
  if (!e.on) return;
  const c = handCircle(x, y, r, seed, .08);
  colour(F, c, K.yellow, seed + 1, e.pf, { p: .8, gap: 9, w: 11, ang: .4 }); outline(L, c, seed + 2, e.pl, { col: K.orange });
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2 + .2; line(L, [[x + Math.cos(a) * (r + 22), y + Math.sin(a) * (r + 22)], [x + Math.cos(a) * (r + 60 + 14 * hash(i + seed)), y + Math.sin(a) * (r + 60 + 14 * hash(i + seed))]], L_(seed + 10 + i, { draw: clamp(e.pl * 2 - 1 + i / 12), w: 6, col: K.orange, p: .8 })); }
}
export function cloudOutline(L, x, y, s, seed, e) {
  if (!e.on) return;
  const pts = [];
  for (let i = 0; i < 9; i++) { const a = Math.PI + i / 8 * Math.PI; const r = (60 + 28 * Math.sin(i * 2.7 + seed)) * s; pts.push([x + Math.cos(a) * 130 * s * (i / 8 * 2 - 1 === 0 ? 1 : 1) + lerp(-130, 130, i / 8) * s, y + Math.sin(a) * r * .9]); }
  const c = [...pts, [x + 130 * s, y + 10 * s], [x - 130 * s, y + 10 * s]];
  line(L, [...c, c[0]], L_(seed, { draw: e.pl, col: K.sky, w: 5, p: .7 }));
}
export function bird(L, x, y, s, seed, e) { if (!e.on) return; line(L, [[x - 30 * s, y - 2 * s], [x - 14 * s, y - 18 * s], [x, y], [x + 14 * s, y - 18 * s], [x + 30 * s, y - 2 * s]], L_(seed, { draw: e.pl, w: 5, p: .8 })); }
export function truck(F, L, x, y, seed, e, o = {}) {   // x, y: the ground point under the front of the box; the cab at the right
  if (!e.on) return;
  const box = rect(x, y - 300, 430, 240), cab = smooth([[x + 430, y - 220], [x + 500, y - 220], [x + 560, y - 150], [x + 580, y - 60], [x + 430, y - 60]], 2);
  colour(F, box, K.purple, seed, o.pfBox ?? e.pf, { p: .75, gap: 10, w: 12, ang: .5, cross: true, crossP: .45 }); outline(L, box, seed + 1, e.pl);
  colour(F, cab, K.sky, seed + 2, e.pf, { p: .7, gap: 9, w: 10, ang: .6 }); outline(L, cab, seed + 3, e.pl);
  const win = [[x + 445, y - 205], [x + 495, y - 205], [x + 540, y - 150], [x + 445, y - 150]]; outline(L, win, seed + 4, e.pl, { w: 5 });
  [[x + 90], [x + 480]].forEach(([wx], i) => { const w = handCircle(wx, y - 20, 48, seed + 5 + i, .1); const u = o.pwheel ? o.pwheel[i] : e.pl; colour(F, w, K.ink, seed + 7 + i, u >= 1 ? e.pf : 0, { p: .75, gap: 7, w: 9, ang: .3 + i }); if (u > 0) line(L, w, L_(seed + 9 + i, { draw: u, w: 7 })); if (u >= 1) line(L, handCircle(wx, y - 20, 16, seed + 11 + i), L_(seed + 13 + i, { draw: e.pf, w: 5, col: K.white })); });
  line(L, [[x - 10, y - 60], [x + 600, y - 60]], L_(seed + 15, { draw: e.pl, w: 6 }));
}
export function groundLine(L, x0, x1, y, seed, e, col = K.ink) { if (e.on) line(L, [[x0, y], [x1, y]], L_(seed, { draw: e.pl, w: 7, col, wob: 2 })); }
export function grass(F, L, x0, x1, y, h, seed, e, p = .5) {
  if (!e.on) return;
  const poly = [[x0, y], [x1, y], [x1, y + h], [x0, y + h]];
  colour(F, poly, K.green, seed, e.pf, { p, gap: 14, w: 14, ang: .12, over: 0 });
  for (let i = 0; i < Math.floor((x1 - x0) / 90); i++) { const x = x0 + 40 + i * 90 + hash(i + seed) * 40; line(L, [[x - 10, y + 4], [x, y - 24 - 10 * hash(i)], [x + 10, y + 4]], L_(seed + 10 + i, { draw: e.pl, w: 5, col: K.green, p: .8 })); }
}
export function lampPost(F, L, x, y, seed, e) {
  if (!e.on) return;
  line(L, [[x, y], [x, y - 360], [x + 40, y - 380]], L_(seed, { draw: e.pl, w: 8 }));
  const lamp = rect(x + 20, y - 420, 50, 44); colour(F, lamp, K.yellow, seed + 1, e.pf, { p: .8, gap: 7, w: 8 }); outline(L, lamp, seed + 2, e.pl, { w: 5 });
}
export function door(F, L, x, y, seed, e) {   // a front door with a step (x = centre)
  if (!e.on) return;
  const fr = rect(x - 130, y - 440, 260, 440), dr = rect(x - 90, y - 400, 180, 400), step = rect(x - 170, y, 340, 40);
  colour(F, fr, K.sand, seed, e.pf, { p: .5, gap: 10, w: 11, ang: .3 }); outline(L, fr, seed + 1, e.pl);
  colour(F, dr, K.brown, seed + 2, e.pf, { p: .7, gap: 9, w: 10, ang: 1.5 }); outline(L, dr, seed + 3, e.pl);
  dab(F, x + 60, y - 200, 10, { col: K.yellow, seed: seed + 4, p: .9 * e.pf });
  colour(F, step, K.sand, seed + 5, e.pf, { p: .6, gap: 8, w: 9 }); outline(L, step, seed + 6, e.pl, { w: 5 });
}
export function bed(F, L, x, y, w, seed, e) {   // x: left, y: floor; a bed seen from the front: headboard at the left, mattress, a sky-blue blanket, a white pillow
  if (!e.on) return;
  const hb = smooth([[x, y], [x, y - 420], [x + 20, y - 450], [x + 100, y - 450], [x + 120, y - 420], [x + 120, y]], 2);
  colour(F, hb, K.brown, seed, e.pf, { p: .7, gap: 9, w: 10, ang: 1.5 }); outline(L, hb, seed + 1, e.pl);
  const mat = rect(x + 120, y - 220, w - 120, 120); colour(F, mat, K.sand, seed + 2, e.pf, { p: .45, gap: 11, w: 12, ang: .1 }); outline(L, mat, seed + 3, e.pl);
  [[x + 150], [x + w - 60]].forEach(([lx], i) => { const lg = rect(lx, y - 100, 40, 100); colour(F, lg, K.brown, seed + 4 + i, e.pf, { p: .7, gap: 8, w: 9, ang: 1.5 }); outline(L, lg, seed + 6 + i, e.pl, { w: 5 }); });
  const pil = smooth([[x + 140, y - 230], [x + 400, y - 230], [x + 410, y - 300], [x + 130, y - 300]], 3); colour(F, pil, K.white, seed + 8, e.pf, { p: .9, gap: 7, w: 9 }); outline(L, pil, seed + 9, e.pl, { w: 5 });
}
export function blanket(F, L, x0, x1, yTop, yBot, seed, e, edge = null) {   // the blanket over the bed (drawn after the characters: it covers their legs)
  if (!e.on) return;
  const top = []; for (let x = x0; x <= x1; x += 60) top.push([x, yTop + 10 * Math.sin(x * .02 + seed) + (edge ? edge(x) : 0)]);
  const poly = [...top, [x1, yBot], [x0, yBot]];
  colour(F, poly, K.sky, seed, e.pf, { p: .7, gap: 11, w: 12, ang: .15, cross: true, crossP: .35 }); outline(L, poly, seed + 1, e.pl);
  for (let i = 0; i < 3; i++) line(L, [[x0 + 60, yTop + 40 + i * 40], [x1 - 40, yTop + 44 + i * 40]], L_(seed + 5 + i, { draw: e.pl, w: 4, col: K.white, p: 1 }));
}
export function hangingLamp(F, L, x, y, seed, e, on = 1) {   // a ceiling lamp on a cord: the practical light of the night pages; (x, y) = the bottom of the shade
  if (!e.on) return;
  line(L, [[x, -40], [x + 4, y - 110]], L_(seed, { draw: e.pl, w: 6 }));
  const shade = [[x - 70, y - 110], [x + 70, y - 110], [x + 140, y], [x - 140, y]];
  colour(F, shade, K.yellow, seed + 1, e.pf * on, { p: .9, gap: 8, w: 10, ang: .3 }); outline(L, shade, seed + 2, e.pl);
  if (on > 0 && e.pf > 0) dab(F, x, y + 10, 30, { col: K.white, seed: seed + 3, p: .9 * on * e.pf });
}
export function nightstand(F, L, x, y, seed, e, lampOn = 0) {   // x centre, y floor; a small table (with a toy on it: a red ball)
  if (!e.on) return [x, y - 520];
  if (!lampOn) {
    const top0 = rect(x - 110, y - 300, 220, 30), leg0 = rect(x - 80, y - 270, 160, 270);
    colour(F, leg0, K.brown, seed, e.pf, { p: .65, gap: 10, w: 11, ang: 1.5 }); outline(L, leg0, seed + 1, e.pl);
    colour(F, top0, K.brown, seed + 2, e.pf, { p: .75, gap: 8, w: 9, ang: .1 }); outline(L, top0, seed + 3, e.pl);
    dab(F, x, y - 340, 34, { col: K.red, seed: seed + 4, p: .9 * e.pf }); line(L, handCircle(x, y - 340, 34, seed + 5), L_(seed + 6, { draw: e.pl, w: 5 }));
    return [x, y - 340];
  }
  const top = rect(x - 110, y - 300, 220, 30), leg = rect(x - 80, y - 270, 160, 270);
  colour(F, leg, K.brown, seed, e.pf, { p: .65, gap: 10, w: 11, ang: 1.5 }); outline(L, leg, seed + 1, e.pl);
  colour(F, top, K.brown, seed + 2, e.pf, { p: .75, gap: 8, w: 9, ang: .1 }); outline(L, top, seed + 3, e.pl);
  const stem = rect(x - 14, y - 440, 28, 140), base = rect(x - 60, y - 320, 120, 22); colour(F, base, K.ink, seed + 4, e.pf, { p: .6, gap: 6, w: 8 }); outline(L, base, seed + 5, e.pl, { w: 5 });
  colour(F, stem, K.ink, seed + 6, e.pf, { p: .6, gap: 6, w: 8, ang: 1.5 }); outline(L, stem, seed + 7, e.pl, { w: 5 });
  const shade = [[x - 70, y - 440], [x + 70, y - 440], [x + 110, y - 560], [x - 110, y - 560]];
  colour(F, shade, K.yellow, seed + 8, e.pf * lampOn, { p: .85, gap: 8, w: 10, ang: .4 }); outline(L, shade, seed + 9, e.pl);
  return [x, y - 440];
}
export function windowNight(F, L, x, y, w, h, seed, e, o = {}) {   // a window at night: frame, a crescent moon (yellow) and white-wax stars (invisible until the wash)
  if (!e.on) return;
  const fr = rect(x, y, w, h); outline(L, fr, seed, e.pl, { w: 9, col: K.brown });
  line(L, [[x + w / 2, y], [x + w / 2, y + h]], L_(seed + 1, { draw: e.pl, w: 7, col: K.brown })); line(L, [[x, y + h / 2], [x + w, y + h / 2]], L_(seed + 2, { draw: e.pl, w: 7, col: K.brown }));
  if (o.moon !== false) { const mx = x + w * .3, my = y + h * .3, r = Math.min(w, h) * .14; const cres = []; for (let i = 0; i <= 20; i++) { const a = -1.9 + 3.8 * i / 20; cres.push([mx + Math.cos(a) * r, my + Math.sin(a) * r]); } for (let i = 0; i <= 20; i++) { const a = 1.9 - 3.8 * i / 20; cres.push([mx + r * .45 + Math.cos(a) * r * .8, my + Math.sin(a) * r * .8]); } colour(F, cres, K.yellow, seed + 3, e.pf, { p: .9, gap: 6, w: 8 }); outline(L, cres, seed + 4, e.pl, { w: 5 }); }
  for (let i = 0; i < 9; i++) { const sxx = x + 40 + hash(i * 3.1 + seed) * (w - 80), syy = y + 30 + hash(i * 7.7 + seed) * (h - 60); if (Math.hypot(sxx - (x + w * .3), syy - (y + h * .3)) < 90) continue; const r = 8 + 8 * hash(i + seed); const st = []; for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2 - Math.PI / 2; const rr = k % 2 ? r * .45 : r; st.push([sxx + Math.cos(a) * rr, syy + Math.sin(a) * rr]); } fill(F, st, { col: K.white, p: 1, gap: 3.5, w: 5, over: 1, seed: seed + 20 + i, draw: e.pf }); }
}
export function wallLine(L, x0, x1, y, seed, e) { if (e.on) line(L, [[x0, y], [x1, y]], L_(seed, { draw: e.pl, w: 7, col: K.brown, wob: 2 })); }
export function book(F, L, x, y, w, h, seed, e, o = {}) {   // an open book standing up to face us: two pages, a gutter; returns the right page box
  if (!e.on) return { x: x + w / 2, y, w: w / 2, h };
  const lp = rect(x, y, w / 2, h), rp = rect(x + w / 2, y, w / 2, h);
  // the cover: a thick purple border around the two pages (the pages themselves are bare paper)
  const cover = rect(x - 22, y - 18, w + 44, h + 36), inner = rect(x - 2, y - 2, w + 4, h + 4);
  if (e.pf > 0) [[cover[0], cover[1], inner[1], inner[0]], [cover[1], cover[2], inner[2], inner[1]], [cover[2], cover[3], inner[3], inner[2]], [cover[3], cover[0], inner[0], inner[3]]].forEach((q, i) => fill(F, q, { col: o.cover || K.purple, p: .85, gap: 5, w: 7, over: 1, seed: seed + 10 + i, ang: i % 2 ? 1.5 : 0, draw: e.pf }));
  outline(L, cover, seed + 1, e.pl);
  [lp, rp].forEach((p, i) => outline(L, p, seed + 4 + i, e.pl, { w: 5, p: .7 }));
  line(L, [[x + w / 2, y], [x + w / 2, y + h]], L_(seed + 6, { draw: e.pl, w: 6, p: .8 }));
  return { x: x + w / 2, y, w: w / 2, h };
}
export const CRAYONS = ['red', 'orange', 'yellow', 'green', 'sky', 'purple', 'brown', 'pink'];
export function crayonBox(F, L, x, y, s, seed, e, missing = []) {   // a box of eight crayons standing in it; x, y = bottom centre; missing: indices eaten / taken
  if (!e.on) return;
  const T = pts => pts.map(([px, py]) => [x + px * s, y + py * s]);
  CRAYONS.forEach((c, i) => { if (missing.includes(i)) return; const cx = -150 + i * 42, st = T([[cx - 12, -60], [cx + 12, -60], [cx + 12, -170], [cx, -190], [cx - 12, -170]]); colour(F, st, K[c], seed + 10 + i, e.pf, { p: .9, gap: 5, w: 7, over: 2, ang: 1.5 }); outline(L, st, seed + 30 + i, e.pl, { w: 4 }); });
  const bx = T([[-180, 0], [180, 0], [180, -130], [-180, -130]]); colour(F, bx, K.yellow, seed, e.pf, { p: .8, gap: 8, w: 10, ang: .2 }); outline(L, bx, seed + 1, e.pl);
  line(L, T([[-180, -70], [180, -70]]), L_(seed + 2, { draw: e.pl, w: 5, col: K.green, p: .8 }));
  line(L, T([[-120, -100], [120, -100]]), L_(seed + 3, { draw: e.pl, w: 5, col: K.ink, p: .7 }));
}
export function crayonFlat(F, L, x, y, a, s, col, seed, e) {   // a crayon lying down (used as a prop: picked up, held out, set down)
  if (!e.on) return;
  const T = pts => xf(pts, { x, y, r: a, s });
  const body = [[-70, -16], [44, -16], [70, 0], [44, 16], [-70, 16]];
  colour(F, T(body), col, seed, e.pf, { p: .95, gap: 5, w: 7, over: 2, ang: a + 1.5 }); outline(L, T(body), seed + 1, e.pl, { w: 5 });
  line(L, T([[-26, -16], [-26, 16]]), L_(seed + 2, { draw: e.pl, w: 4, p: .6 }));
}
export function table(F, L, x0, x1, yTop, seed, e) {   // the classroom table: a long top and legs
  if (!e.on) return;
  const top = rect(x0, yTop, x1 - x0, 60); colour(F, top, K.brown, seed, e.pf, { p: .6, gap: 10, w: 11, ang: .08, over: 2 }); outline(L, top, seed + 1, e.pl);
  for (let lx = x0 + 60; lx < x1; lx += 600) { const lg = rect(lx, yTop + 60, 40, 300); colour(F, lg, K.brown, seed + 2 + lx, e.pf, { p: .7, gap: 8, w: 9, ang: 1.5 }); outline(L, lg, seed + 3 + lx, e.pl, { w: 5 }); }
}
export function windowFrame(F, L, x, y, w, h, seed, e) { if (!e.on) return; outline(L, rect(x, y, w, h), seed, e.pl, { w: 9, col: K.brown }); line(L, [[x + w / 2, y], [x + w / 2, y + h]], L_(seed + 1, { draw: e.pl, w: 7, col: K.brown })); }
export function chalkboard(F, L, x, y, w, h, seed, e) { if (!e.on) return; const b = rect(x, y, w, h); colour(F, b, K.green, seed, e.pf, { p: .55, gap: 12, w: 13, ang: .05, cross: true, crossP: .4 }); outline(L, b, seed + 1, e.pl, { col: K.brown, w: 9 }); }
export function sandpit(F, L, x, y, w, seed, e) {   // a sandpit seen from the front: a low frame and a sand mound
  if (!e.on) return;
  const fr = rect(x, y - 40, w, 40); colour(F, fr, K.brown, seed, e.pf, { p: .65, gap: 8, w: 9 }); outline(L, fr, seed + 1, e.pl);
  const s = smooth([[x + 20, y - 40], [x + w * .3, y - 120], [x + w * .6, y - 90], [x + w - 20, y - 40]], 3, false);
  colour(F, [...s, [x + w - 20, y - 40], [x + 20, y - 40]], K.sand, seed + 2, e.pf, { p: .7, gap: 9, w: 11, ang: .1 }); line(L, s, L_(seed + 3, { draw: e.pl }));
}
export function shovel(F, L, x, y, a, seed, e) {   // a toy shovel: a sky-blue blade and a brown handle, the tip at (x, y)
  if (!e.on) return;
  const T = pts => xf(pts, { x, y, r: a });
  const blade = [[0, 0], [60, -40], [50, -120], [-50, -120], [-60, -40]], hd = rect(-10, -300, 20, 180);
  colour(F, T(blade), K.sky, seed, e.pf, { p: .8, gap: 7, w: 9 }); outline(L, T(blade), seed + 1, e.pl, { w: 5 });
  colour(F, T(hd), K.brown, seed + 2, e.pf, { p: .7, gap: 6, w: 8, ang: 1.5 }); outline(L, T(hd), seed + 3, e.pl, { w: 5 });
  outline(L, T([[-30, -330], [30, -330], [30, -300], [-30, -300]]), seed + 4, e.pl, { w: 5 });
}
export function balloon(F, L, x, y, r, seed, e, o = {}) {   // a red balloon at (x, y) (centre), a string of points below it
  if (!e.on) return;
  const b = ellipse(x, y, r * .88, r, 28); colour(F, b, o.col || K.red, seed, e.pf, { p: .9, gap: 6, w: 9, over: 2, ang: .9 }); outline(L, b, seed + 1, e.pl, { w: 6 });
  line(L, [[x - 10, y + r - 2], [x, y + r + 12], [x + 10, y + r - 2]], L_(seed + 2, { draw: e.pl, w: 5 }));
  if (o.string) line(L, o.string, L_(seed + 3, { draw: e.pl, w: 4, p: .8, wob: 1.5 }));
  if (e.pf > .5) line(L, [[x - r * .4, y - r * .35], [x - r * .2, y - r * .6]], L_(seed + 4, { w: 5, col: K.white, p: 1 }));
}
export function speechBubble(L, x, y, w, h, tailTo, seed, e, col = K.purple) {   // a hand-drawn bubble with a tail
  if (!e.on) return;
  const pts = []; for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; pts.push([x + Math.cos(a) * w / 2 * (1 + .04 * Math.sin(i * 2.1)), y + Math.sin(a) * h / 2]); }
  line(L, [...pts, pts[0]], L_(seed, { draw: e.pl, w: 6, col }));
  if (tailTo) line(L, [[x - w * .2, y + h * .45], tailTo, [x - w * .05, y + h * .48]], L_(seed + 1, { draw: e.pl, w: 6, col }));
}
// the title and lettering: a line of text lettered on the page (world coords, boils like everything else), indigo with a purple shadow
export function letter(Lsh, Lmain, str, x, y, size, reveal, seed, o = {}) {
  const sz = size * CAM.s;
  if (o.shadow !== false) text(Lsh, str, sx(x) + 6 * CAM.s, sy(y) + 6 * CAM.s, { size: sz, font: 'ZCOOL KuaiLe', reveal, seed: seed + 1, p: .55, col: o.shadowCol || K.purple, track: (o.track || 0) * CAM.s, align: o.align });
  text(Lmain, str, sx(x), sy(y), { size: sz, font: 'ZCOOL KuaiLe', reveal, seed, p: .95, stroke: 1.5 * CAM.s, col: o.col || K.ink, track: (o.track || 0) * CAM.s, align: o.align });
}

// ---------------- pages ----------------
// each returns nothing; it draws the page's static drawing into BG = { f, l } at film time t. Dynamic things (the balloon drifting, the crayons eaten,
// the monster on the book page) are drawn by film.js on top. Page coordinates: 0..PW × 0..PH; page 4 is two sheets wide (0..5200).
export const CITY_HOUSES = [
  { x: 40, y: 1240, w: 300, h: 560, col: K.sand, seed: 10, win: [2, 3], gh: 120 },
  { x: 380, y: 1240, w: 360, h: 760, col: K.pink, seed: 20, win: [2, 4], roof: K.sky, gh: 150 },
  { x: 790, y: 1240, w: 280, h: 480, col: K.peach, seed: 30, win: [2, 2], door: true },
  { x: 1120, y: 1240, w: 340, h: 900, col: K.sky, seed: 40, win: [2, 5], roof: K.sand, gh: 110, p: .35 },
  { x: 1980, y: 1240, w: 400, h: 640, col: K.peach, seed: 50, win: [2, 3], gh: 140 },
  { x: 2420, y: 1240, w: 260, h: 520, col: K.sand, seed: 60, win: [1, 3], roof: K.pink },
];
export const CITY_WIN = { x: 2122, y: 905, w: 116, h: 132 };   // Dou Dou's window: row 2, right column of the peach house at 1980 (cols 2: ww = 80; wx = 1980+80*3 = 2220? computed below)
export const TRUCK = { x: 1500, y: 1240 };
export function page1(BG, t) {
  const F = BG.f, L = BG.l;
  // the street first (3.0–3.6), then the truck is already being drawn from 0 (its box coloured 0–2.4, the wheels 1.6–3.0), the houses 3.4–7.0, colour 5.0–8.4
  groundLine(L, -200, 2800, 1240, 1, el(t, 3.0, 3.6));
  truck(F, L, TRUCK.x, TRUCK.y, 100, { on: true, pl: pr(t, 2.2, 3.0), pf: pr(t, 2.6, 4.2) }, { pfBox: pr(t, 0.0, 2.6), pwheel: [pr(t, 1.6, 2.3), pr(t, 2.3, 3.0)] });
  CITY_HOUSES.forEach((h, i) => house(F, L, h, el(t, 3.4 + i * .5, 4.1 + i * .5, 5.0 + i * .5, 5.9 + i * .5)));
  [[300, 300, 1.0, 1], [900, 240, .8, 2], [2300, 330, .9, 3]].forEach(([x, y, s, i]) => cloudOutline(L, x, y, s, 70 + i, el(t, 6.2 + i * .3, 7.0 + i * .3)));
  [[1600, 520, 1, 4], [1700, 470, .8, 5]].forEach(([x, y, s, i]) => bird(L, x, y, s, 80 + i, el(t, 7.2, 7.6)));
}
// Dou Dou's window on page 1: the peach house at x=1980, w=400 → ww = 80, wh = 96; row 1 (r=1) col 1 (c=1): wx = 1980 + 80*3 = 2220, wy = 1240-640 + 96*(.8+2.1) = 878
export const DD_WIN = { x: 2220, y: 878, w: 80, h: 96 };

export const KINDER = { gate: [520, 760], fenceY: 1180, tree: { x: 2250, y: 1180 } };
export function page2(BG, t) {
  const F = BG.f, L = BG.l;
  const e0 = el(t, 12.6, 13.4, 13.6, 14.6);
  house(F, L, { x: 900, y: 1070, w: 1100, h: 520, col: K.sand, seed: 300, win: [4, 2], gable: false, roof: K.orange, door: true, doorCol: K.sky, p: .4 }, e0);
  sun(F, L, 300, 300, 90, 310, el(t, 13.0, 13.6, 13.6, 14.2));
  tree(F, L, KINDER.tree.x, KINDER.tree.y, 1.1, 320, el(t, 13.2, 14.0, 14.2, 15.2));
  slide(F, L, 1750, 1180, 330, el(t, 13.6, 14.2, 14.4, 15.0));
  fence(F, L, -40, 2650, KINDER.fenceY, 340, el(t, 13.8, 15.0, 15.0, 15.8), KINDER.gate);
  gatePosts(F, L, KINDER.gate[0], KINDER.gate[1], KINDER.fenceY, 360, el(t, 14.2, 14.8, 15.0, 15.6));
  grass(F, L, -100, 2700, 1180, 300, 370, el(t, 14.6, 15.4, 15.4, 16.0), .35);
  [[1300, 260, 1.1, 1], [2000, 200, .8, 2]].forEach(([x, y, s, i]) => cloudOutline(L, x, y, s, 380 + i, el(t, 15.2 + i * .2, 15.8 + i * .2)));
}

// the bedroom (pages 3 and 6): floor y = 1200; the bed at the left-centre, the nightstand with the lamp at the right, the window above the right
export const ROOM = { floor: 1200, bed: { x: 400, w: 1500 }, lamp: { x: 1000, y: 230 }, stand: { x: 2300 }, win: { x: 1850, y: 180, w: 520, h: 440 }, book: { x: 560, y: 560, w: 760, h: 440 }, box: { x: 1900, y: 1040 } };
export function page3(BG, t, t0 = 26.0, done = false) {   // t0: when the page starts drawing; done: already complete (page 6)
  const F = BG.f, L = BG.l; const T = done ? t0 + 100 : t;
  wallLine(L, -100, 2700, ROOM.floor, 400, el(T, t0 + .6, t0 + 1.2));
  bed(F, L, ROOM.bed.x, ROOM.floor, ROOM.bed.w, 410, el(T, t0 + .7, t0 + 1.5, t0 + 1.6, t0 + 2.6));
  windowNight(F, L, ROOM.win.x, ROOM.win.y, ROOM.win.w, ROOM.win.h, 420, el(T, t0 + 1.0, t0 + 1.7, t0 + 1.8, t0 + 2.6));
  nightstand(F, L, ROOM.stand.x, ROOM.floor, 430, el(T, t0 + 1.2, t0 + 1.8, t0 + 1.9, t0 + 2.5));
  hangingLamp(F, L, ROOM.lamp.x, ROOM.lamp.y, 435, el(T, t0 + 1.4, t0 + 1.9, t0 + 1.9, t0 + 2.4));
  // a small rug and a toy on the floor
  const rug = ellipse(1000, 1300, 420, 70, 24); colour(F, rug, K.orange, 440, el(T, t0 + 1.9, t0 + 2.4, t0 + 2.4, t0 + 3.0).pf, { p: .5, gap: 12, w: 12, ang: .05 }); outline(L, rug, 441, el(T, t0 + 1.9, t0 + 2.4).pl);
}
export function lampCone(g, lampPt, t, k = 1) {   // knock the ultramarine wash out of the lamp's cone of light (page coords on the wash mask; g has the page transform set)
  if (k <= 0) return;
  g.save(); g.globalCompositeOperation = 'destination-out';
  const [lx, ly] = lampPt;
  const cone = [[lx - 140, ly - 10], [lx + 140, ly - 10], [lx + 1250 * k, ly + 1300], [lx - 1150 * k, ly + 1300]];
  for (let i = 0; i < 5; i++) { const s = 1 + i * .08; g.globalAlpha = i === 0 ? .85 : .18; g.beginPath(); cone.forEach(([x, y], j) => { const X = lx + (x - lx) * s, Y = ly + (y - ly); j ? g.lineTo(X, Y) : g.moveTo(X, Y); }); g.closePath(); g.fill(); }
  g.globalAlpha = .75; g.beginPath(); g.ellipse(lx, ly - 50, 170, 100, 0, 0, 7); g.fill();   // the shade's own glow
  g.restore();
}

// page 4: the morning (two sheets wide): the front door at the left, the street, the kindergarten fence; then the classroom with the window to the sandpit
export const MORNING = { door: 300, floor: 1240, sun: [1440, 700], fence: [2150, 2700], cls: { x0: 2700, table: [2850, 4600], tableY: 880, win: { x: 4760, y: 300, w: 440, h: 500 }, floor: 1240 } };
export function page4(BG, t) {
  const F = BG.f, L = BG.l, M = MORNING;
  door(F, L, M.door, M.floor, 500, el(t, 56.0, 56.6, 56.6, 57.4));
  groundLine(L, -200, 2750, M.floor, 501, el(t, 56.4, 57.2));
  // the street draws itself ahead of him as he walks (59–63): houses, a lamp post, a tree, the fence of the kindergarten
  [[600, 300, 440, K.pink, 59.0], [1000, 380, 380, K.sand, 59.6], [1560, 460, 500, K.sky, 60.4], [2080, 420, 420, K.peach, 61.2]].forEach(([x, w, h, col, ts], i) => house(F, L, { x, y: M.floor, w, h, col, seed: 510 + i * 10, win: [2, 2], p: .4, gh: 90 }, el(t, ts, ts + .7, ts + .5, ts + 1.4)));
  lampPost(F, L, 1450, M.floor, 540, el(t, 60.6, 61.1, 61.0, 61.5));
  tree(F, L, 2560, M.floor, .8, 550, el(t, 61.8, 62.4, 62.2, 62.9));
  sun(F, L, M.sun[0], M.sun[1], 80, 560, el(t, 60.0, 60.5, 60.3, 61.0));
  fence(F, L, M.fence[0], M.fence[1], M.floor, 570, el(t, 61.8, 62.6, 62.4, 63.0));
  // classroom
  const C = M.cls;
  wallLine(L, C.x0 - 100, 5300, C.floor, 600, el(t, 63.0, 63.6));
  chalkboard(F, L, 2900, 260, 1100, 480, 610, el(t, 63.0, 63.8, 63.6, 64.6));
  windowFrame(F, L, C.win.x, C.win.y, C.win.w, C.win.h, 620, el(t, 63.4, 64.0));
  // through the window: the sandpit (the mound is the monster on page 4 after 73; before that the plain mound)
  sandpit(F, L, C.win.x + 20, C.win.y + C.win.h - 40, C.win.w - 40, 630, el(t, 63.6, 64.2, 64.0, 64.8));
  table(F, L, C.table[0], C.table[1], C.tableY, 640, el(t, 63.0, 63.8, 63.6, 64.6));
}
export const CLASS_SEATS = [3050, 3450, 3850];   // the other children behind the table; Dou Dou at 4380

// page 5: the playground: the building corner at the left, the slide, a sandpit, the big tree at the right with the balloon in its branches
export const PLAY = { floor: 1250, tree: { x: 2150, y: 1250, s: 1.6 }, balloon: [2290, 420], nini: [2010, 1250], slide: [350, 1250], sand: [800, 1250] };
export function page5(BG, t, t0 = 80.6) {
  const F = BG.f, L = BG.l, P = PLAY;
  house(F, L, { x: -200, y: 780, w: 700, h: 520, col: K.sand, seed: 700, win: [2, 2], gable: false, roof: K.orange, p: .4 }, el(t, t0, t0 + .6, t0 + .5, t0 + 1.4));
  fence(F, L, 500, 2700, 790, 710, el(t, t0 + .2, t0 + 1.0, t0 + .9, t0 + 1.6), null, 80);
  grass(F, L, -100, 2700, 800, 700, 720, el(t, t0 + .8, t0 + 1.6, t0 + 1.4, t0 + 2.4), .3);
  slide(F, L, P.slide[0], P.slide[1], 730, el(t, t0 + .5, t0 + 1.1, t0 + 1.0, t0 + 1.6));
  sandpit(F, L, P.sand[0], P.sand[1], 520, 740, el(t, t0 + .9, t0 + 1.4, t0 + 1.3, t0 + 1.9));
  tree(F, L, P.tree.x, P.tree.y, P.tree.s, 750, el(t, t0 + 1.2, t0 + 2.0, t0 + 2.0, t0 + 3.0), { wide: 1.15 });
  sun(F, L, 2380, 200, 70, 760, el(t, t0 + .3, t0 + .8, t0 + .7, t0 + 1.2));
  [[700, 300, 1.0, 1], [1500, 240, .8, 2]].forEach(([x, y, s, i]) => cloudOutline(L, x, y, s, 770 + i, el(t, t0 + 1.6 + i * .2, t0 + 2.2 + i * .2)));
}
// page 7: the last page: bare paper, a ground line; the figures and the lettering are drawn by film.js
export function page7(BG, t, t0 = 131.6) {
  groundLine(BG.l, 200, 2400, 1180, 900, el(t, t0, t0 + .6), K.green);
  grass(BG.f, BG.l, 200, 2400, 1180, 60, 901, el(t, t0 + .2, t0 + .9, t0 + .6, t0 + 1.4), .3);
}
