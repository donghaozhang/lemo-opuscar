// Characters as flat woodblock figures: colour block + key block (union outline), slight misregistration, specks.
// Every rig is a pure function of its parameters; poses are blended numerically (never switched inside an if).
import { clamp, lerp, mulberry, hash, vnoise, ss, eio, TAU } from '/core/lib.js';
import { W, H, PAL, TX, mk, smooth, poly, carve, rgba, mix } from './print.js';

const S = PAL.sumi;
export const CAT = { white: '#f7f0de', ochre: '#d39a45', dark: '#4a4540', pink: '#e9a99a', iris: '#d8a73c', irisK: '#9fbccb' };

// ———————————— figure compositor: colour canvas + key canvas, union outline ————————————
const FC = mk(), FK = mk();
const fc = FC.getContext('2d'), fk = FK.getContext('2d');
let BB = null;   // screen-space bbox being drawn
export function figure(dst, fn, { reg = [1.7, 2.1], speck = .22, grain = .06, bbox = null, colour = 1 } = {}) {
  const m = dst.getTransform();
  // screen bbox (default: whole frame)
  let x0 = 0, y0 = 0, x1 = W, y1 = H;
  if (bbox) {
    const pts = [[bbox[0], bbox[1]], [bbox[2], bbox[1]], [bbox[0], bbox[3]], [bbox[2], bbox[3]]].map(([a, b]) => [m.a * a + m.c * b + m.e, m.b * a + m.d * b + m.f]);
    x0 = Math.max(0, Math.floor(Math.min(...pts.map(p => p[0])) - 8)); y0 = Math.max(0, Math.floor(Math.min(...pts.map(p => p[1])) - 8));
    x1 = Math.min(W, Math.ceil(Math.max(...pts.map(p => p[0])) + 8)); y1 = Math.min(H, Math.ceil(Math.max(...pts.map(p => p[1])) + 8));
    if (x1 <= x0 || y1 <= y0) return;
  }
  BB = [x0, y0, x1, y1];
  for (const c of [fc, fk]) { c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.clearRect(x0, y0, x1 - x0, y1 - y0); c.setTransform(m); c.lineCap = 'round'; c.lineJoin = 'round'; }
  fn(API);
  for (const c of [fc, fk]) c.setTransform(1, 0, 0, 1, 0, 0);
  // printed texture
  if (grain) { fc.globalCompositeOperation = 'source-atop'; fc.globalAlpha = grain; fc.drawImage(TX.grain, 0, 0); }
  fc.globalCompositeOperation = 'destination-out'; fc.globalAlpha = speck; fc.drawImage(TX.speck, 0, 0, W, H);
  fk.globalCompositeOperation = 'destination-out'; fk.globalAlpha = speck * .5; fk.drawImage(TX.speck, 0, 0, W, H);
  fc.globalAlpha = 1; fk.globalAlpha = 1; fc.globalCompositeOperation = 'source-over'; fk.globalCompositeOperation = 'source-over';
  dst.save(); dst.setTransform(1, 0, 0, 1, 0, 0);
  const w = x1 - x0, h = y1 - y0;
  if (colour > 0) { dst.globalAlpha = colour; dst.drawImage(FC, x0, y0, w, h, x0 + reg[0], y0 + reg[1], w, h); dst.globalAlpha = 1; }
  dst.drawImage(FK, x0, y0, w, h, x0, y0, w, h);
  dst.restore();
}
// shapes: functions that build a path on the given context
const API = {
  col: fc, key: fk,
  // a group of shapes filled with one colour and outlined as one union
  group(shapes, fill, lw, ink = S) {
    shapes = shapes.flat(3);
    fk.strokeStyle = ink; fk.lineWidth = lw * 2;
    for (const sh of shapes) { fk.beginPath(); sh(fk); fk.stroke(); }
    fc.fillStyle = fill; for (const sh of shapes) { fc.beginPath(); sh(fc); fc.fill(); }
    fk.save(); fk.globalCompositeOperation = 'destination-out'; fk.fillStyle = '#000'; for (const sh of shapes) { fk.beginPath(); sh(fk); fk.fill(); } fk.restore();
  },
  // colour inside what's already painted on the colour canvas (patches, stripes)
  atop(fn) { fc.save(); fc.globalCompositeOperation = 'source-atop'; fn(fc); fc.restore(); },
  fill(fn, col) { fc.fillStyle = col; fc.beginPath(); fn(fc); fc.fill(); },
  kfill(fn, col = S) { fk.fillStyle = col; fk.beginPath(); fn(fk); fk.fill(); },
  line(pts, w, col = S, closed = false) { fk.strokeStyle = col; fk.lineWidth = w; fk.beginPath(); smooth(fk, pts, closed); fk.stroke(); },
  carve(pts, w, o = {}) { carve(fk, pts, w, { col: S, ...o }); },
  // punch a hole in both colour and key (for openings)
};

// ———————————— geometry helpers ————————————
const rot = (p, a) => [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a)];
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const mul = (a, k) => [a[0] * k, a[1] * k];
const L2 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
export function ik(a, b, l1, l2, bend) {
  let dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1e-6;
  const ux = dx / d, uy = dy / d, dm = Math.min(d, (l1 + l2) * .999), q = (l1 * l1 - l2 * l2 + dm * dm) / (2 * dm), h = Math.sqrt(Math.max(0, l1 * l1 - q * q));
  return [[a[0] + ux * q - uy * h * bend, a[1] + uy * q + ux * h * bend], [a[0] + ux * dm, a[1] + uy * dm]];
}
// tapered limb along a polyline as a closed polygon + round joints
function limb(pts, w0, w1) {
  const n = pts.length, out = [x => {
    const L = [], R = [];
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      let dx = b[0] - a[0], dy = b[1] - a[1]; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
      const w = lerp(w0, w1, i / (n - 1)) / 2; L.push([pts[i][0] - dy * w, pts[i][1] + dx * w]); R.push([pts[i][0] + dy * w, pts[i][1] - dx * w]);
    }
    x.moveTo(L[0][0], L[0][1]); for (const p of L.slice(1)) x.lineTo(p[0], p[1]); for (const p of R.reverse()) x.lineTo(p[0], p[1]); x.closePath();
  }];
  // round joints only at the ends and at real bends (a densified curve needs none)
  for (let i = 0; i < n; i++) { if (n > 4 && i > 0 && i < n - 1) continue; const w = lerp(w0, w1, i / (n - 1)) / 2; out.push(x => { x.moveTo(pts[i][0] + w, pts[i][1]); x.arc(pts[i][0], pts[i][1], w, 0, TAU); }); }
  return out;
}
const ell = (c, rx, ry, a = 0) => x => { x.moveTo(c[0] + rx * Math.cos(a), c[1] + rx * Math.sin(a)); x.ellipse(c[0], c[1], rx, ry, a, 0, TAU); };
const polyS = (pts) => x => smooth(x, pts, true);
const polyL = (pts) => x => poly(x, pts);
// a sampled smooth curve through points (Catmull-Rom)
function cr(p, per = 6) {
  const n = p.length, out = [];
  for (let i = 0; i < n - 1; i++) {
    const a = p[Math.max(0, i - 1)], b = p[i], c = p[i + 1], d = p[Math.min(n - 1, i + 2)];
    for (let s = 0; s < per; s++) { const t = s / per, t2 = t * t, t3 = t2 * t; out.push([0, 1].map(k => .5 * (2 * b[k] + (-a[k] + c[k]) * t + (2 * a[k] - 5 * b[k] + 4 * c[k] - d[k]) * t2 + (-a[k] + 3 * b[k] - 3 * c[k] + d[k]) * t3))); }
  }
  out.push(p[n - 1]); return out;
}

// ———————————— FISH ————————————
// c: centre, len: length in px, ang: angle (0 = head to the right), bend: −1..1 flop, o.dead: x-eye
export function fishShape(c, len, ang = 0, bend = 0) {
  const T = p => { const q = rot([p[0] * len, (p[1] + bend * .5 * (p[0] + .1) * (p[0] + .1)) * len], ang); return [c[0] + q[0], c[1] + q[1]]; };
  const top = [[.5, 0], [.42, -.075], [.25, -.12], [0, -.125], [-.22, -.09], [-.36, -.035]], bot = [[-.36, .03], [-.2, .08], [0, .11], [.25, .1], [.42, .06]];
  const body = [...top, ...bot].map(T), tail = [[-.33, 0], [-.5, -.13], [-.47, 0], [-.52, .12]].map(T);
  return { T, body, tail, eye: T([.38, -.025]), gill: [[.3, -.08], [.27, 0], [.3, .07]].map(T), fin: [[.05, -.12], [-.05, -.2], [-.15, -.1]].map(T), belly: [[.42, .05], [.2, .085], [-.05, .085], [-.3, .03]].map(T), back: [[.45, -.04], [.2, -.1], [-.1, -.1], [-.33, -.03]].map(T) };
}
export function fish(A, c, len, ang = 0, bend = 0, lw = 2.6) {
  const F = fishShape(c, len, ang, bend);
  A.group([polyL(F.tail), polyL(F.fin)], PAL.prus, lw * .8);
  A.group([polyS(F.body)], PAL.skyL, lw);
  A.atop(x => { x.fillStyle = PAL.prusL; x.beginPath(); smooth(x, [...F.back, ...F.back.slice().reverse().map(p => add(p, rot([0, len * .045], ang)))], true); x.fill();
    x.fillStyle = CAT.white; x.beginPath(); smooth(x, [...F.belly, ...F.belly.slice().reverse().map(p => add(p, rot([0, -len * .035], ang)))], true); x.fill(); });
  A.line(F.gill, lw * .7);
  A.kfill(x => x.arc(F.eye[0], F.eye[1], len * .03, 0, TAU));
  A.fill(x => x.arc(F.eye[0] - len * .008, F.eye[1] - len * .008, len * .009, 0, TAU), CAT.white);
  // scale marks (a few carved ticks)
  for (let i = 0; i < 6; i++) { const p = F.T([.15 - i * .07, -.03 + (i % 2) * .03]); A.line([p, add(p, rot([-len * .025, len * .02], ang))], lw * .45); }
}

// ———————————— CAT, side view ————————————
// pose fields (local units, cat faces +x, ground y = 0, up is −y)
export const CP = {
  stand: { hx: -.4, hy: -.56, sx: .36, sy: -.58, arch: .02, hdx: .17, hdy: -.22, ha: 0, fnx: .4, fny: 0, ffx: .3, ffy: 0, hnx: -.38, hny: 0, hfx: -.46, hfy: 0, ta: -2.2, tc: .25, tw: .1, ear: 0, eye: 1, pupil: .5, brow: 0, jaw: 0, by: 0, rot: 0, rib: 1, haunch: 0 },
  sit: { hx: -.2, hy: -.18, sx: .08, sy: -.5, arch: -.06, hdx: .08, hdy: -.22, ha: -.05, fnx: .13, fny: 0, ffx: .06, ffy: 0, hnx: .06, hny: 0, hfx: -.01, hfy: 0, ta: .1, tc: -.12, tw: .05, haunch: 1, ear: 0, eye: 1, pupil: .6, brow: 0, jaw: 0, by: 0, rot: 0, rib: .6 },
  crouch: { hx: -.36, hy: -.48, sx: .3, sy: -.27, arch: .06, hdx: .2, hdy: -.1, ha: .1, fnx: .42, fny: 0, ffx: .34, ffy: 0, hnx: -.3, hny: 0, hfx: -.38, hfy: 0, ta: -2.6, tc: .3, tw: .25, ear: .2, eye: .8, pupil: .9, brow: -.5, jaw: 0, by: 0, rot: 0, rib: 1 },
  sneak: { hx: -.4, hy: -.42, sx: .34, sy: -.38, arch: .0, hdx: .22, hdy: -.1, ha: .12, fnx: .44, fny: 0, ffx: .3, ffy: 0, hnx: -.34, hny: 0, hfx: -.46, hfy: 0, ta: -2.75, tc: .45, tw: .12, ear: .25, eye: .75, pupil: .3, brow: -.4, jaw: 0, by: 0, rot: 0, rib: 1 },
  leap: { hx: -.48, hy: -.66, sx: .46, sy: -.8, arch: -.04, hdx: .2, hdy: -.16, ha: -.12, fnx: .95, fny: -.72, ffx: .85, ffy: -.62, hnx: -.98, hny: -.42, hfx: -.9, hfy: -.36, ta: -3.0, tc: -.06, tw: .05, ear: -.4, eye: 1.15, pupil: .7, brow: .3, jaw: 0, by: 0, rot: 0, rib: 1 },
  slide: { hx: -.4, hy: -.17, sx: .36, sy: -.16, arch: -.02, hdx: .2, hdy: -.12, ha: .05, fnx: .78, fny: -.02, ffx: .7, ffy: -.06, hnx: -.85, hny: -.02, hfx: -.78, hfy: -.05, ta: -3.0, tc: -.1, tw: .1, ear: -.7, eye: 1.25, pupil: .25, brow: .8, jaw: .6, by: 0, rot: 0, rib: 1 },
  wet: { hx: -.38, hy: -.48, sx: .32, sy: -.46, arch: .1, hdx: .16, hdy: -.12, ha: .3, fnx: .38, fny: 0, ffx: .28, ffy: 0, hnx: -.36, hny: 0, hfx: -.44, hfy: 0, ta: -3.05, tc: .02, tw: .04, ear: -.6, eye: .5, pupil: .5, brow: .5, jaw: 0, by: 0, rot: 0, rib: 1.4 },
};
export function blend(a, b, t) { const o = {}; for (const k in a) o[k] = typeof a[k] === 'number' ? lerp(a[k], b[k] ?? a[k], t) : (t < .5 ? a[k] : b[k]); for (const k in b) if (!(k in o)) o[k] = b[k]; return o; }
export const pose = (name, over = {}) => ({ ...CP[name], ...over });
// gait cycles: phase φ ∈ [0,1)
export function gait(kind, ph, base = 'stand', amt = 1) {
  const P = { ...CP[base] };
  if (kind === 'walk' || kind === 'sneak' || kind === 'limp') {
    const L = kind === 'sneak' ? .36 : kind === 'limp' ? .22 : .3, lift = kind === 'sneak' ? .07 : .09;
    const foot = (off, x0) => { const q = (ph + off) % 1, st = q < .6; const u = st ? q / .6 : (q - .6) / .4; const x = st ? lerp(L / 2, -L / 2, u) : lerp(-L / 2, L / 2, ss(u)); return [x0 + x * amt, st ? 0 : -lift * Math.sin(u * Math.PI) * amt]; };
    [P.hnx, P.hny] = foot(0, P.hnx); [P.fnx, P.fny] = foot(.25, P.fnx); [P.hfx, P.hfy] = foot(.5, P.hfx); [P.ffx, P.ffy] = foot(.75, P.ffx);
    P.by = -.012 * Math.sin(ph * TAU * 2) * amt; P.hdy += .01 * Math.sin(ph * TAU * 2 + 1) * amt;
    if (kind === 'limp') { P.hy += .03 * Math.sin(ph * TAU); P.ha += .08; }
    P.ta += .12 * Math.sin(ph * TAU) * amt;
  } else if (kind === 'run') {
    // rotary gallop: extended (e=1, airborne, long) ↔ gathered (e=−1, short, arched)
    const e = Math.cos(ph * TAU) * amt, g = Math.sin(ph * TAU) * amt;
    const len = .72 + .14 * e, mid = (P.hx + P.sx) / 2;
    P.hx = mid - len / 2; P.sx = mid + len / 2; P.hy = -.6 - .04 * e; P.sy = -.62 + .02 * g;
    P.arch = .02 + .13 * (-e);
    P.fnx = P.sx + .3 * e + .06; P.ffx = P.fnx - .1; P.fny = -Math.max(0, .18 * e + .05 * g); P.ffy = P.fny - .02;
    P.hnx = P.hx - .3 * e - .02; P.hfx = P.hnx + .1; P.hny = -Math.max(0, .15 * e - .05 * g); P.hfy = P.hny - .02;
    if (e < -.3) { P.fnx = P.sx - .06 + .18 * (-e - .3); P.ffx = P.fnx + .06; P.hnx = P.hx + .2; P.hfx = P.hx + .28; }
    P.by = -.1 * Math.max(0, e) ; P.ha = -.04 - .06 * g; P.hdy = -.18 + .03 * e; P.hdx = .2;
    P.ta = -2.9 + .2 * g; P.tc = .05; P.tw = .15; P.ear = -.35;
  }
  return P;
}
// draw the cat. X,Y: ground point (screen/sheet px), s: px per unit, dir ±1. o: {fish: 0..1, look: gaze x, ochre:…}
export function catSide(A, X, Y, s, dir, P, o = {}) {
  const lw = o.lw ?? (2.0 + s * .006);
  const tr = p => { const q = rot([p[0], p[1] + P.by], P.rot); return [X + dir * q[0] * s, Y + q[1] * s]; };
  const Hh = [P.hx, P.hy], Sh = [P.sx, P.sy], ax = sub(Sh, Hh), len = Math.hypot(...ax), a = mul(ax, 1 / len), n = [a[1], -a[0]];
  // torso outline
  const top = [], bot = [];
  for (let i = 0; i <= 10; i++) {
    const u = i / 10, c = add(add(Hh, mul(ax, u)), mul(n, P.arch * Math.sin(Math.PI * u) * len));
    top.push(add(c, mul(n, .1 + .02 * u))); bot.push(sub(c, mul(n, .075 + .1 * Math.pow(u, 1.6))));
  }
  const torso = polyS([...top, ...bot.reverse()].map(tr));
  // legs
  const fr = add(Sh, [.0, .07]), fr2 = add(Sh, [.05, .06]), hr = add(Hh, [.02, .04]), hr2 = add(Hh, [.07, .03]);
  const front = (root, px, py) => { const pw = [px, py - .03], [k, e] = ik(root, pw, .28, .28, 1); return [root, k, e]; };
  const hind = (root, px, py) => { const hock = [px - .07, py - .15], [k, e] = ik(root, hock, .26, .25, -1); return [root, k, e, [px, py - .03]]; };
  const FN = front(fr, P.fnx, P.fny), FF = front(fr2, P.ffx, P.ffy), HN = hind(hr, P.hnx, P.hny), HF = hind(hr2, P.hfx, P.hfy);
  const legShape = (pts, w0, w1, paw) => { const sp = pts.map(tr), p = sp[sp.length - 1]; return [limb(sp, w0 * s, w1 * s), ell([p[0] + dir * .025 * s, p[1] + .005 * s], .055 * s, .032 * s)]; };
  // tail
  let ang = P.ta, tp = add(Hh, [-.06, -.07]); const tail = [tp];
  for (let k = 0; k < 6; k++) { ang += P.tc * .35 + P.tw * Math.sin((o.t || 0) * 5 + k * .9) * .4 + (k === 5 ? .7 : 0); tp = add(tp, [Math.cos(ang) * .105, Math.sin(ang) * .105]); tail.push(tp); }
  const tailS = cr(tail, 4).map(tr);
  // head frame
  const hc = add(Sh, [P.hdx, P.hdy]), HA = P.ha, hf = p => tr(add(hc, rot(p, HA)));
  const earRot = P.ear;   // + forward, − back/flat
  const earPts = (b0, b1, tip) => { const c = L2(b0, b1, .5); const t2 = add(c, rot(sub(tip, c), earRot * .9)); return [b0, t2, b1].map(hf); };
  const earN = earPts([-.09, -.07], [.03, -.115], [-.06, -.26]), earF = earPts([.0, -.1], [.1, -.085], [.08, -.235]);
  const head = [ell(hf([0, 0]), .15 * s, .125 * s, HA), ell(hf([.115, .035]), .08 * s, .062 * s, HA), polyL(earN), ell(hf([-.07, .06]), .09 * s, .07 * s, HA)];
  const neck = limb([add(Sh, [-.02, -.02]), add(hc, [-.03, .03])].map(tr), .2 * s, .18 * s);
  // far side first
  A.group([legShape(FF, .085, .06), legShape(HF, .13, .06), polyL(earF)], mix(CAT.white, '#c9bea4', .45), lw);
  A.group([limb(tailS, .07 * s, .03 * s)], CAT.white, lw);
  A.atop(x => { x.fillStyle = CAT.dark; for (const k of [3, 5]) { const p = tailS[Math.min(tailS.length - 1, k * 4)]; x.beginPath(); x.arc(p[0], p[1], .06 * s, 0, TAU); x.fill(); } const pe = tailS[tailS.length - 1]; x.beginPath(); x.arc(pe[0], pe[1], .07 * s, 0, TAU); x.fill(); });
  const haunch = P.haunch ? [ell(tr(add(Hh, [.03, .05])), .2 * s * P.haunch, .16 * s * P.haunch, P.rot)] : [];
  A.group([torso, neck, legShape(HN, .13, .055), haunch, legShape(FN, .085, .06), ...head], CAT.white, lw);
  // patches: ochre saddle and haunch, dark cap over the head and near ear
  A.atop(x => {
    x.fillStyle = CAT.ochre;
    const sp = [[-.3, -.66], [-.1, -.74], [.12, -.72], [.22, -.64], [.08, -.58], [-.12, -.6], [-.3, -.56]].map(p => tr(add(p, [0, (P.hy + P.sy) / 2 + .57 + P.arch * .5 * len])));
    x.beginPath(); smooth(x, sp, true); x.fill();
    const hp = tr(add(Hh, [-.02, -.02])); x.beginPath(); x.ellipse(hp[0], hp[1], .12 * s, .1 * s, 0, 0, TAU); x.fill();
    x.fillStyle = CAT.dark; x.beginPath(); smooth(x, [[-.16, -.02], [-.12, -.12], [0, -.14], [.06, -.1], [.0, -.05], [-.08, 0]].map(hf), true); x.fill();
    x.beginPath(); poly(x, earN); x.fill();
  });
  // inner ear
  A.fill(x => { const [b0, t2, b1] = earN; poly(x, [L2(b0, t2, .25), L2(t2, L2(b0, b1, .5), .2), L2(b1, t2, .3)]); }, CAT.pink);
  // details (key block)
  const ribs = P.rib ?? 1;
  if (ribs > .05) for (let i = 0; i < 3; i++) { const u = .58 + i * .1, c = add(add(Hh, mul(ax, u)), mul(n, -.0)); A.carve([tr(add(c, mul(n, .02))), tr(add(add(c, mul(n, -.07)), mul(a, -.02))), tr(add(add(c, mul(n, -.11)), mul(a, -.0)))], lw * .8 * ribs, { taper: [.3, .4], jit: .1, seed: i }); }
  // eye
  const ec = [.075, -.025], op = clamp(P.eye, 0, 1.3), eh = .042 * op;
  const eyeP = [add(ec, [-.035, .0]), add(ec, [0, -eh]), add(ec, [.035, -.005]), add(ec, [0, eh * .7])].map(hf);
  if (op > .08) {
    A.fill(x => smooth(x, eyeP, true), CAT.iris);
    const pc = hf(add(ec, [.004 + (o.look || 0) * .012, 0])); const pw = lerp(.008, .022, P.pupil) * s, ph = Math.min(eh * 1.1, .04) * s;
    A.kfill(x => x.ellipse(pc[0], pc[1], pw, ph, HA, 0, TAU));
    A.kfill(x => x.arc(pc[0] - dir * pw * .4, pc[1] - ph * .45, Math.max(1, .006 * s), 0, TAU), CAT.white);
    A.line([eyeP[0], eyeP[1], eyeP[2]], lw * 1.1);
    A.line([eyeP[2], eyeP[3], eyeP[0]], lw * .5);
  } else A.line([hf(add(ec, [-.035, 0])), hf(add(ec, [0, .01])), hf(add(ec, [.035, -.005]))], lw * 1.1);
  // brow tuft: front end down when angry (brow<0), up when surprised
  const bc = add(ec, [0, -.075 - .02 * Math.max(0, P.brow)]);
  A.carve([hf(add(bc, [-.04, .012 * P.brow])), hf(add(bc, [.0, -.004])), hf(add(bc, [.045, -.022 * P.brow]))], lw * 1.3, { taper: [.2, .5], jit: .1 });
  // nose, mouth, jaw
  const jaw = clamp(P.jaw, 0, 1);
  A.kfill(x => { const p = hf([.19, .005]); x.arc(p[0], p[1], .014 * s, 0, TAU); });
  if (jaw > .05) {
    const m0 = [.17, .05], m1 = [.05, .07], j = rot([.13, .02], jaw * .55);
    const mouth = [m0, m1, add([.04, .06], j)].map(hf);
    A.kfill(x => poly(x, mouth), '#7a2b22');
    A.line([hf([.19, .03]), hf(m0), hf(m1)], lw * .9); A.line([hf(m1), hf(add([.04, .06], j))], lw * .9);
    A.kfill(x => { const p = hf([.15, .055]); poly(x, [p, hf([.16, .055]), hf([.155, .085])]); }, CAT.white);
  } else A.line([hf([.19, .03]), hf([.16, .06]), hf([.09, .065])], lw * .8);
  for (let i = 0; i < 3; i++) A.line([hf([.14, .04 + i * .012]), hf([.3, .0 + i * .035 + (o.droop || 0) * .05])], Math.max(1, lw * .4));
  if (o.fish) fish(A, hf([.15, .07]), .52 * s * o.fish, (dir > 0 ? 0 : Math.PI) + dir * (HA + .35), .3, lw * .9);
  return { head: hf([0, 0]), mouth: hf([.15, .07]), eye: hf(ec) };
}

// ———————————— CAT / KITTEN, face close-up (front view) ————————————
export const FE = {
  neutral: { open: 1, lid: 0, pupil: .5, gx: 0, gy: 0, brow: 0, browY: 0, ear: 0, mouth: 0, jaw: 0, smile: 0, droop: 0, squint: 0, wet: 0, fish: 0, blink: 0, tilt: 0, happy: 0 },
  sly: { open: .55, lid: -.25, pupil: .12, gx: .35, gy: -.2, brow: -.35, browY: 0, ear: .1, mouth: 0, jaw: 0, smile: .5, droop: 0, squint: 0 },
  determined: { open: .62, lid: -.45, pupil: .15, gx: .5, gy: 0, brow: -.85, browY: -.2, ear: .25, mouth: 0, jaw: 0, smile: -.2, droop: 0 },
  shocked: { open: 1.3, lid: .1, pupil: .08, gx: 0, gy: -.3, brow: .9, browY: 1, ear: .35, mouth: 1, jaw: .45, smile: 0, droop: .2 },
  furious: { open: .7, lid: -.8, pupil: .1, gx: .2, gy: -.2, brow: -1.2, browY: -.3, ear: -1, mouth: 2, jaw: .8, smile: 0, droop: 0 },
  awed: { open: 1.35, lid: .15, pupil: 1, gx: 0, gy: -.55, brow: .65, browY: .8, ear: .3, mouth: 1, jaw: .2, smile: 0, droop: .15 },
  tender: { open: .45, lid: .3, pupil: .9, gx: -.3, gy: .35, brow: .45, browY: .1, ear: 0, mouth: 0, jaw: 0, smile: 1, droop: .1, squint: .7, happy: 1 },
  surprised: { open: 1.2, lid: .15, pupil: .85, gx: 0, gy: -.5, brow: .8, browY: .9, ear: .3, mouth: 0, jaw: 0, smile: 0, droop: 0 },
  wet: { open: .35, lid: .2, pupil: .5, gx: 0, gy: 0, brow: .7, browY: .1, ear: -.85, mouth: 0, jaw: 0, smile: -.6, droop: 1, squint: .9, wet: 1 },
  pant: { open: .8, lid: -.4, pupil: .3, gx: .4, gy: -.2, brow: -.6, browY: 0, ear: -.2, mouth: 1, jaw: .35, smile: 0, droop: .3 },
  hungry: { open: 1.15, lid: .3, pupil: 1, gx: 0, gy: -.3, brow: .7, browY: .5, ear: -.15, mouth: 1, jaw: .4, smile: 0, droop: .3 },
  eat: { open: .3, lid: .2, pupil: .8, gx: 0, gy: .6, brow: .3, browY: 0, ear: 0, mouth: 0, jaw: 0, smile: .6, droop: 0, squint: .9, happy: 1 },
};
export const fexpr = (name, over = {}) => ({ ...FE.neutral, ...FE[name], ...over });
// s: head width in px. kit: kitten proportions
export function catFace(A, cx, cy, s, E, { kit = false, t = 0, lw: LW } = {}) {
  const lw = LW ?? (2.4 + s * .005);
  const tl = E.tilt || 0;
  const P = p => { const q = rot([p[0] * s, p[1] * s], tl); return [cx + q[0], cy + q[1]]; };
  const fur = kit ? '#bdb7a6' : CAT.white;
  const earSh = side => {
    const k = side, e = E.ear, flat = Math.max(0, -e), fw = Math.max(0, e);
    const b0 = [k * .14, -.34], b1 = [k * (kit ? .38 : .43), -.24 + (kit ? .02 : 0)];
    const tip = [k * lerp(kit ? .33 : .37, .62, flat) - k * fw * .04, lerp(kit ? -.6 : -.72, -.4, flat) - fw * .03];
    return [b0, tip, b1];
  };
  const eL = earSh(-1), eR = earSh(1);
  // head outline: forehead, cheek tufts, chin
  const cw = kit ? .44 : .5, tuft = kit ? .03 : .07 + (E.wet || 0) * .02;
  const head = [[0, -.37], [.25, -.33], [.4, -.18], [cw - .02, -.02], [cw + tuft, .06], [cw - .05, .1], [cw + tuft * .8, .17], [cw - .1, .21], [.3, .3], [.12, .36], [0, .37],
  [-.12, .36], [-.3, .3], [-cw + .1, .21], [-cw - tuft * .8, .17], [-cw + .05, .1], [-cw - tuft, .06], [-cw + .02, -.02], [-.4, -.18], [-.25, -.33]];
  const headS = polyS(head.map(P));
  A.group([polyL(eL.map(P)), polyL(eR.map(P)), headS], fur, lw);
  // patches
  A.atop(x => {
    if (!kit) {
      x.fillStyle = CAT.ochre; x.beginPath(); smooth(x, [[-.05, -.4], [-.3, -.42], [-.5, -.3], [-.55, -.05], [-.42, .08], [-.28, .06], [-.12, -.08], [-.04, -.25]].map(P), true); x.fill();
      x.beginPath(); poly(x, eL.map(P)); x.fill();
      x.fillStyle = CAT.dark; x.beginPath(); const [b0, tip, b1] = eR; poly(x, [L2(b0, tip, .45), tip, L2(b1, tip, .45)].map(P)); x.fill();
      // tabby stripes on the forehead
      x.strokeStyle = mix(CAT.ochre, '#7a4a22', .5); x.lineWidth = s * .018; x.lineCap = 'round';
      for (const dx of [-.07, 0, .07]) { x.beginPath(); smooth(x, [[dx, -.36], [dx * 1.2, -.3], [dx * .9, -.24]].map(P)); x.stroke(); }
    } else {
      x.strokeStyle = '#8b8577'; x.lineWidth = s * .03; x.lineCap = 'round';
      for (const dx of [-.08, 0, .08]) { x.beginPath(); smooth(x, [[dx, -.37], [dx * 1.3, -.28], [dx, -.22]].map(P)); x.stroke(); }
      for (const k of [-1, 1]) for (const dy of [-.02, .07]) { x.beginPath(); smooth(x, [[k * .5, dy], [k * .38, dy + .01], [k * .32, dy + .04]].map(P)); x.stroke(); }
    }
  });
  // inner ears
  for (const e of [eL, eR]) { const [b0, tip, b1] = e; A.fill(x => poly(x, [L2(b0, tip, .2), L2(tip, L2(b0, b1, .5), .22), L2(b1, tip, .25)].map(P)), CAT.pink); A.line([L2(b0, tip, .3), L2(tip, L2(b0, b1, .5), .35)].map(P), lw * .5); }
  if (!kit) { const [b0, tip, b1] = eR; const n0 = L2(tip, b1, .35), n1 = L2(tip, b1, .45), nn = add(L2(n0, n1, .5), [-.035, .03]); A.kfill(x => poly(x, [n0, nn, n1].map(P)), fur); A.line([n0, nn, n1].map(P), lw * .8); }
  // eyes
  const ex = kit ? .2 : .2, ew = kit ? .13 : .11, eh0 = kit ? .12 : .085, eyeY = kit ? .0 : -.02;
  for (const k of [-1, 1]) {
    const op = clamp(E.open * (1 - (E.blink || 0)), 0, 1.4), c = [k * ex, eyeY], slant = kit ? .05 : .2, sq = E.squint || 0;
    const eh = eh0 * op, ehB = eh * (1 - sq * .8);
    // almond: inner corner, top, outer corner (higher), bottom
    const inner = add(c, [-k * ew, ew * slant * .5]), outer = add(c, [k * ew, -ew * slant]);
    const topC = add(c, [k * ew * .1, -eh * 1.25]), botC = add(c, [k * ew * .05, ehB * .95]);
    const eye = [inner, topC, outer, botC];
    if (E.happy) {
      A.carve([inner, add(c, [0, -.045 * E.happy]), outer].map(P), lw * 1.7, { taper: [.2, .2], jit: .05 });
      A.line([add(inner, [k * .02, .03]), add(c, [0, .035]), add(outer, [-k * .02, .035])].map(P), lw * .5);
    } else if (op > .06 && eh > .006) {
      A.fill(x => smooth(x, eye.map(P), true), kit ? CAT.irisK : CAT.iris);
      // pupil
      const pw = lerp(.014, kit ? .07 : .055, E.pupil), ph = Math.min(eh * 1.15, kit ? .12 : .1), pc = add(c, [E.gx * ew * .45, E.gy * eh * .35]);
      fc.save(); fc.beginPath(); smooth(fc, eye.map(P), true); fc.clip();
      fc.fillStyle = S; fc.beginPath(); const pp = P(pc); fc.ellipse(pp[0], pp[1], pw * s, ph * s, tl, 0, TAU); fc.fill();
      fc.fillStyle = CAT.white; fc.beginPath(); const hl = P(add(pc, [-pw * .5 - .01, -ph * .45])); fc.arc(hl[0], hl[1], s * (kit ? .022 : .016), 0, TAU); fc.fill();
      if (kit) { const h2 = P(add(pc, [pw * .4, ph * .35])); fc.beginPath(); fc.arc(h2[0], h2[1], s * .01, 0, TAU); fc.fill(); }
      // upper lid as fur colour pulled down (lid>0 sleepy/sad lowers the outer side, lid<0 angry lowers the inner side)
      const ld = E.lid || 0;
      if (Math.abs(ld) > .02) { fc.fillStyle = fur; fc.beginPath(); const yi = c[1] - eh * 1.4 + eh * 1.6 * Math.max(0, -ld), yo = c[1] - eh * 1.4 + eh * 1.6 * Math.max(0, ld); poly(fc, [P([inner[0] - k * .05, c[1] - .3]), P([outer[0] + k * .05, c[1] - .3]), P([outer[0] + k * .05, yo]), P([inner[0] - k * .05, yi])]); fc.fill(); }
      fc.restore();
      // lid lines
      const ld2 = E.lid || 0, yi = Math.max(0, -ld2), yo = Math.max(0, ld2);
      const tline = [add(inner, [0, 0]), add(L2(inner, topC, .5), [0, eh * 1.2 * yi * .6]), add(topC, [0, eh * 1.4 * (yi + yo) * .45]), add(L2(topC, outer, .5), [0, eh * 1.2 * yo * .6]), outer];
      A.carve(tline.map(P), lw * 1.5, { taper: [.15, .2], jit: .08, seed: k + 3 });
      A.line([outer, botC, inner].map(P), lw * .6);
    } else {
      // closed: a curved line (happy ^ when smile, flat when blinking)
      const up = (E.smile || 0) > .3 ? -1 : 1;
      A.carve([inner, add(c, [0, up * .025]), outer].map(P), lw * 1.5, { taper: [.2, .2], jit: .05 });
    }
    // brow tuft (inner end: brow>0 up / brow<0 down)
    const by = c[1] - eh0 * 1.25 - .09 - (E.browY || 0) * .045, b = E.brow || 0;
    const bi = [k * (ex - ew * .75), by - b * .05], bo = [k * (ex + ew * .7), by + b * .035 - .01];
    A.carve([bi, L2(bi, bo, .5).map((v, j) => j ? v - .012 : v), bo].map(P), lw * 2.2, { taper: [.15, .6], jit: .1, seed: k });
  }
  // nose, mouth
  const ny = kit ? .13 : .12;
  A.group([polyL([[-.045, ny - .02], [.045, ny - .02], [0, ny + .03]].map(P))], CAT.pink, lw * .6);
  const jaw = E.jaw || 0, mo = E.mouth || 0, sm = E.smile || 0;
  if (mo && jaw > .03) {
    const mw = mo === 2 ? .17 : .1, mh = .05 + jaw * .16;
    const mpts = [[-mw, ny + .07], [0, ny + .045], [mw, ny + .07], [mw * .6, ny + .07 + mh * .8], [0, ny + .07 + mh], [-mw * .6, ny + .07 + mh * .8]];
    A.group([polyS(mpts.map(P))], '#7a2b22', lw);
    A.fill(x => smooth(x, [[-mw * .5, ny + .07 + mh * .75], [0, ny + .07 + mh * .55], [mw * .5, ny + .07 + mh * .75], [0, ny + .07 + mh * .95]].map(P), true), CAT.pink);
    for (const k of [-1, 1]) A.kfill(x => poly(x, [[k * mw * .75, ny + .065], [k * mw * .45, ny + .06], [k * mw * .62, ny + .065 + (mo === 2 ? .07 : .04)]].map(P)), CAT.white);
  } else {
    // ω mouth with smile curvature
    for (const k of [-1, 1]) A.line([[0, ny + .03], [k * .03, ny + .075 + sm * -.01], [k * .075, ny + .06 - sm * .03]].map(P), lw * .9);
    A.line([[0, ny + .03], [0, ny + .045]].map(P), lw * .9);
  }
  // whiskers
  const dr = E.droop || 0;
  for (const k of [-1, 1]) for (let i = 0; i < 3; i++) {
    const r0 = [k * .12, ny + .05 + i * .025], r1 = [k * (.62 + i * .02), ny - .05 + i * .07 + dr * (.12 + i * .03) + Math.sin(t * 3 + i) * .006];
    A.line([r0, L2(r0, r1, .5).map((v, j) => j ? v - .02 * (1 - dr) : v), r1].map(P), Math.max(1.2, lw * .45));
  }
  // cheek fur lines
  for (const k of [-1, 1]) A.line([[k * (cw - .1), .2], [k * (cw - .16), .26]].map(P), lw * .6);
  // wet: water drops falling off the fur
  if (E.wet) { const R = mulberry(Math.floor(t * 8) + 3); for (let i = 0; i < 9; i++) { const px = (R() - .5) * 1.1, py = .3 + R() * .5; const p = P([px, py]); A.group([ell(p, s * .012, s * .022)], PAL.skyL, lw * .4, PAL.prusD); } }
  if (E.fish) fish(A, P([.02, ny + .16]), s * .95, Math.PI + .08 + Math.sin(t * 6) * .03, .15, lw * .9);
  return { P };
}

// ———————————— KITTEN, full body (front-ish sit, side profile when eating) ————————————
export function kitten(A, X, Y, s, o = {}) {
  // s: body height px. o.mode: 'peek' | 'sit' | 'eat' | 'hop'; o.ph phase; o.E face expression
  const lw = 1.8 + s * .006, fur = '#bdb7a6', b = o.bob || 0;
  const P = p => [X + p[0] * s * (o.dir || 1), Y + p[1] * s];
  const body = ell(P([0, -.32 + b * .02]), .34 * s, .32 * s);
  const tail = limb(cr([[-.25, -.1], [-.45, -.15], [-.52, -.35], [-.45, -.5]], 4).map(P), .1 * s, .06 * s);
  const paws = [ell(P([-.14, -.02]), .1 * s, .055 * s), ell(P([.14, -.02]), .1 * s, .055 * s)];
  A.group([tail], fur, lw);
  A.group([body, ...paws], fur, lw);
  A.atop(x => { x.strokeStyle = '#8b8577'; x.lineWidth = s * .05; x.lineCap = 'round'; for (const dx of [-.15, 0, .15]) { x.beginPath(); smooth(x, [[dx - .05, -.6], [dx, -.45], [dx - .03, -.3]].map(P)); x.stroke(); } });
  const hs = s * .95, hy = Y - s * (.7 + b * .02) + (o.dip || 0) * s * .25;
  catFace(A, X + (o.hx || 0) * s, hy, hs, o.E || fexpr('hungry'), { kit: true, t: o.t || 0 });
  return { head: [X, hy] };
}

// ———————————— FISHMONGER, side view body ————————————
// Units: 1 = standing height in px (s). Faces +x. Poses blend numerically.
export const MP = {
  stand: { lean: 0, hipY: -.47, fnx: .07, fny: 0, fbx: -.07, fby: 0, hnx: .1, hny: -.47, hbx: -.06, hby: -.46, ha: 0, neck: 0, brow: 0, mouth: 0, eye: 1, by: 0, crouch: 0 },
  yawn: { lean: -.08, hipY: -.47, fnx: .06, fny: 0, fbx: -.08, fby: 0, hnx: .08, hny: -1.08, hbx: -.06, hby: -1.05, ha: -.35, neck: -.2, brow: .6, mouth: 1, eye: 0, by: 0, crouch: 0 },
  arrange: { lean: .22, hipY: -.45, fnx: .1, fny: 0, fbx: -.08, fby: 0, hnx: .34, hny: -.5, hbx: .28, hby: -.55, ha: .3, neck: .1, brow: 0, mouth: 0, eye: .6, by: 0, crouch: .05 },
  lantern: { lean: .1, hipY: -.47, fnx: .06, fny: 0, fbx: -.08, fby: 0, hnx: .26, hny: -.6, hbx: -.02, hby: -.42, ha: .3, neck: .1, brow: .2, mouth: 0, eye: .7, by: 0, crouch: 0 },
  kneel: { lean: .35, hipY: -.25, fnx: .2, fny: 0, fbx: -.2, fby: 0, hnx: .42, hny: -.12, hbx: .1, hby: -.35, ha: .45, neck: .2, brow: .3, mouth: 3, eye: .5, by: 0, crouch: .5 },
  crawl: { lean: .55, hipY: -.36, fnx: .14, fny: 0, fbx: -.16, fby: 0, hnx: .5, hny: -.08, hbx: .38, hby: -.02, ha: -.2, neck: -.25, brow: .7, mouth: 2, eye: .6, by: 0, crouch: .35 },
  fall: { lean: -.6, hipY: -.4, fnx: .32, fny: -.3, fbx: .1, fby: -.05, hnx: .2, hny: -1.0, hbx: -.25, hby: -.95, ha: -.5, neck: -.3, brow: 1, mouth: 2, eye: 1.2, by: 0, crouch: 0 },
};
export function manGait(kind, ph, base = 'stand') {
  const P = { ...MP[base] };
  if (kind === 'run') {
    const c = Math.sin(ph * TAU), c2 = Math.cos(ph * TAU);
    P.lean = .28; P.hipY = -.45 + .025 * Math.abs(c);
    P.fnx = .2 * c + .06; P.fny = -Math.max(0, .14 * c2); P.fbx = -.2 * c + .06; P.fby = -Math.max(0, -.14 * c2);
    P.hnx = .05 - .2 * c; P.hny = -.62 + .1 * c; P.hbx = .05 + .2 * c; P.hby = -.62 - .1 * c; P.by = -.03 * Math.abs(c2);
    P.brow = -.8; P.mouth = 2; P.ha = .05;
  } else if (kind === 'walk') {
    const c = Math.sin(ph * TAU), c2 = Math.cos(ph * TAU);
    P.fnx = .1 * c + .02; P.fny = -Math.max(0, .06 * c2); P.fbx = -.1 * c + .02; P.fby = -Math.max(0, -.06 * c2);
    P.hnx = .03 - .06 * c; P.hbx = .03 + .06 * c; P.by = -.01 * Math.abs(c2);
  }
  return P;
}
// o: { pole: 'shoulder'|'hand'|'none', baskets: n fish 0..2, umbrella, wet, snow, lantern }
export function monger(A, X, Y, s, dir, P, o = {}) {
  const lw = o.lw ?? (2 + s * .0035);
  const tr = p => [X + dir * p[0] * s, Y + (p[1] + P.by) * s];
  const hip = [0, P.hipY], lean = P.lean, chest = add(hip, rot([0, -.3], lean)), sh = add(hip, rot([0, -.29], lean)), neckB = add(hip, rot([0, -.34], lean));
  const head = add(neckB, rot([.0, -.085], lean + P.neck)), hr = .075;
  // legs: hip → knee → ankle (knee bends forward)
  const leg = (fx, fy, side) => { const root = add(hip, [side * .01, 0]), [k, e] = ik(root, [fx, fy - .04], .23, .22, -1); return [root, k, e]; };
  const LN = leg(P.fnx, P.fny, 1), LB = leg(P.fbx, P.fby, -1);
  const arm = (hx, hy) => { const [el, h] = ik(sh, [hx, hy], .17, .17, 1); return [sh, el, h]; };
  const AN = arm(P.hnx, P.hny), AB = arm(P.hbx, P.hby);
  const skin = PAL.skin, coat = PAL.ai, coatD = '#1d2c44';
  const legSh = L => { const sp = L.map(tr), f = sp[2]; return [limb(sp, .07 * s, .05 * s), ell([f[0] + dir * .025 * s, f[1] + .025 * s], .05 * s, .022 * s)]; };
  const armSh = L => { const sp = L.map(tr), h = sp[2]; return [limb(sp, .06 * s, .045 * s), ell(h, .03 * s, .03 * s)]; };
  // back limbs
  A.group([legSh(LB)], mix(skin, '#b39c7c', .35), lw);
  A.group([armSh(AB)], mix(coat, '#000000', .2), lw);
  // pole behind (shoulder) with baskets
  if (o.pole === 'shoulder') {
    const p0 = tr(add(sh, [-.42, -.0])), p1 = tr(add(sh, [.42, .0]));
    A.group([limb([p0, p1], .022 * s, .022 * s)], PAL.woodL, lw * .8);
    for (const [pp, k] of [[p0, 0], [p1, 1]]) {
      const bx = pp[0], by = pp[1] + .25 * s;
      A.line([pp, [bx - .07 * s, by - .06 * s]], lw * .5); A.line([pp, [bx + .07 * s, by - .06 * s]], lw * .5);
      A.group([polyL([[bx - .1 * s, by - .06 * s], [bx + .1 * s, by - .06 * s], [bx + .08 * s, by + .06 * s], [bx - .08 * s, by + .06 * s]])], PAL.straw, lw);
      A.atop(x => { x.strokeStyle = mix(PAL.straw, '#6b4a22', .5); x.lineWidth = lw * .6; for (let i = -3; i <= 3; i++) { x.beginPath(); x.moveTo(bx + i * .026 * s, by - .06 * s); x.lineTo(bx + i * .022 * s, by + .06 * s); x.stroke(); } });
    }
  }
  // torso (happi coat), shorts
  const torso = polyS([add(sh, rot([-.07, 0], lean)), add(sh, rot([.06, .01], lean)), add(hip, rot([.08, .02], lean)), add(hip, rot([.075, .1], lean)), add(hip, rot([-.085, .1], lean)), add(hip, rot([-.08, 0], lean))].map(tr));
  A.group([legSh(LN)], skin, lw);
  A.group([polyS([add(hip, rot([-.08, -.02], lean)), add(hip, rot([.08, -.02], lean)), add(hip, rot([.07, .07], lean)), add(hip, rot([-.07, .07], lean))].map(tr))], coatD, lw);
  A.group([torso], coat, lw);
  // crest pattern on the coat: white wave-and-circle (paper)
  A.atop(x => { const c = tr(add(hip, rot([-.01, -.15], lean))); x.strokeStyle = PAL.white; x.lineWidth = .012 * s; x.beginPath(); x.arc(c[0], c[1], .045 * s, 0, TAU); x.stroke(); x.beginPath(); x.moveTo(c[0] - .03 * s, c[1] + .005 * s); x.quadraticCurveTo(c[0], c[1] - .03 * s, c[0] + .03 * s, c[1] + .005 * s); x.stroke();
    x.fillStyle = PAL.white; const h0 = tr(add(hip, rot([-.09, .06], lean))), h1 = tr(add(hip, rot([.09, .06], lean))); x.fillRect(Math.min(h0[0], h1[0]), h0[1] - .012 * s, Math.abs(h1[0] - h0[0]), .016 * s); });
  // obi
  A.group([limb([add(hip, rot([-.085, -.04], lean)), add(hip, rot([.085, -.04], lean))].map(tr), .035 * s, .035 * s)], PAL.ochre, lw * .8);
  // head
  const hc = tr(head), ha = (P.ha || 0) * dir;
  const HP = p => { const q = rot([p[0] * dir, p[1]], ha); return [hc[0] + q[0] * s, hc[1] + q[1] * s]; };
  const pate = ell(HP([0, -.005]), hr * s, hr * 1.08 * s);
  const nose = polyS([[.06, -.02], [.092, .012], [.065, .022]].map(HP));
  A.group([pate, nose, ell(HP([.02, .055]), .055 * s, .04 * s)], skin, lw);
  // shaved pate + topknot
  A.atop(x => { x.fillStyle = '#b9c2c0'; x.beginPath(); x.ellipse(...HP([.005, -.055]), .062 * s, .035 * s, ha, 0, TAU); x.fill(); });
  A.group([polyS([[-.04, -.07], [.03, -.085], [.05, -.1], [-.02, -.09]].map(HP))], S, lw * .6);
  // headband
  A.group([limb([[-.077, -.035], [.078, -.04]].map(HP), .028 * s, .028 * s), polyL([[-.07, -.04], [-.13, -.07], [-.12, -.02]].map(HP)), polyL([[-.07, -.03], [-.14, .0], [-.1, .02]].map(HP))], PAL.white, lw * .8);
  // ear
  A.line([[-.01, -.005], [-.03, .01], [-.01, .03]].map(HP), lw * .7);
  // eye + brow
  const eo = P.eye ?? 1;
  if (eo > .25) { A.kfill(x => x.ellipse(...HP([.045, -.012]), .01 * s, .011 * s * Math.min(1.3, eo), 0, 0, TAU)); }
  else A.line([[.03, -.012], [.045, -.007], [.06, -.012]].map(HP), lw);
  A.carve([[.022, -.04 + .012 * P.brow], [.045, -.045 - .004 * Math.abs(P.brow)], [.07, -.04 - .014 * P.brow]].map(HP), lw * 1.6, { taper: [.2, .3], jit: .1 });
  // mouth: 0 closed, 1 yawn, 2 shout, 3 smile
  if (P.mouth === 1) A.group([ell(HP([.055, .045]), .025 * s, .032 * s)], '#7a2b22', lw * .8);
  else if (P.mouth === 2) A.group([ell(HP([.065, .042]), .016 * s, .016 * s)], '#7a2b22', lw * .8);
  else if (P.mouth === 3) A.line([[.04, .038], [.058, .046], [.072, .036]].map(HP), lw * .8);
  else A.line([[.045, .042], [.072, .04]].map(HP), lw * .8);
  // stubble
  A.atop(x => { const R = mulberry(5); x.fillStyle = 'rgba(80,90,95,.55)'; for (let i = 0; i < 26; i++) { const p = HP([.0 + R() * .07, .03 + R() * .045]); x.beginPath(); x.arc(p[0], p[1], .0035 * s, 0, TAU); x.fill(); } });
  // front arm
  A.group([armSh(AN)], coat, lw);
  A.fill(x => { const h = tr(AN[2]); x.arc(h[0], h[1], .028 * s, 0, TAU); }, skin);
  // pole in hand / lantern / umbrella
  const hand = tr(AN[2]);
  if (o.pole === 'hand') { const a = (o.poleAng ?? -1.2); const p0 = [hand[0] - dir * Math.cos(a) * .3 * s, hand[1] - Math.sin(a) * .3 * s], p1 = [hand[0] + dir * Math.cos(a) * .5 * s, hand[1] + Math.sin(a) * .5 * s]; A.group([limb([p0, p1], .022 * s, .022 * s)], PAL.woodL, lw * .8); }
  if (o.lantern) { const lx = hand[0], ly = hand[1] + .1 * s; A.line([hand, [lx, ly - .05 * s]], lw * .6); A.group([ell([lx, ly], .045 * s, .06 * s)], o.lit ? '#f2c66a' : PAL.white, lw * .8); A.atop(x => { x.fillStyle = PAL.beni; x.fillRect(lx - .045 * s, ly - .065 * s, .09 * s, .015 * s); x.fillRect(lx - .045 * s, ly + .05 * s, .09 * s, .015 * s); }); }
  if (o.umbrella) { const u = tr(add(head, [.0, -.08])); A.group([polyS([[u[0] - .2 * s, u[1] + .06 * s], [u[0], u[1] - .05 * s], [u[0] + .2 * s, u[1] + .06 * s], [u[0] + .1 * s, u[1] + .04 * s], [u[0], u[1] + .05 * s], [u[0] - .1 * s, u[1] + .04 * s]])], PAL.straw, lw); for (let i = -2; i <= 2; i++) A.line([[u[0], u[1] - .05 * s], [u[0] + i * .09 * s, u[1] + .05 * s]], lw * .5); }
  if (o.sweat) { for (let i = 0; i < 3; i++) { const p = HP([-.06 + i * .05, -.11 - (o.t * 2 + i * .3) % .1]); A.group([ell(p, .008 * s, .013 * s)], PAL.skyL, lw * .4, PAL.prusD); } }
  return { head: hc, hand, sh: tr(sh) };
}

// ———————————— FISHMONGER, face close-up (front) ————————————
export const ME = {
  neutral: { brow: 0, browY: 0, open: 1, lid: 0, gx: 0, gy: 0, mouth: 'line', jaw: 0, smile: 0, blush: 0, sweat: 0, tilt: 0 },
  yawn: { brow: .7, browY: .6, open: 0, lid: 0, gx: 0, gy: 0, mouth: 'yawn', jaw: 1, smile: 0, blush: 0, sweat: 0, tilt: -.06 },
  take: { brow: 1.1, browY: 1.2, open: 1.5, lid: 0, gx: -.6, gy: 0, mouth: 'O', jaw: .9, smile: 0, blush: .2, sweat: .4, tilt: .04 },
  furious: { brow: -1.2, browY: -.4, open: 1.05, lid: -.6, gx: -.5, gy: 0, mouth: 'shout', jaw: .8, smile: 0, blush: .9, sweat: 0, tilt: -.03 },
  exhausted: { brow: .8, browY: .1, open: .5, lid: .5, gx: 0, gy: .3, mouth: 'pant', jaw: .5, smile: 0, blush: .5, sweat: 1, tilt: .05 },
  agape: { brow: 1, browY: 1, open: 1.3, lid: 0, gx: 0, gy: -.4, mouth: 'O', jaw: .7, smile: 0, blush: .2, sweat: .6, tilt: 0 },
  soft: { brow: .55, browY: .2, open: .55, lid: .45, gx: .2, gy: .5, mouth: 'smile', jaw: 0, smile: .7, blush: .1, sweat: 0, tilt: .05 },
  sigh: { brow: .8, browY: .3, open: .3, lid: .5, gx: 0, gy: .4, mouth: 'sigh', jaw: .25, smile: 0, blush: 0, sweat: 0, tilt: .03 },
  stern: { brow: -.4, browY: -.1, open: .8, lid: -.2, gx: .2, gy: .5, mouth: 'line', jaw: 0, smile: -.4, blush: .2, sweat: 0, tilt: 0 },
};
export const mexpr = (n, o = {}) => ({ ...ME.neutral, ...ME[n], ...o });
export function mongerFace(A, cx, cy, s, E, { t = 0, wet = 0, snow = 0 } = {}) {
  // s: face width px
  const lw = 2.6 + s * .005, tl = E.tilt || 0;
  const P = p => { const q = rot([p[0] * s, p[1] * s], tl); return [cx + q[0], cy + q[1]]; };
  const skin = PAL.skin;
  // neck + collar
  A.group([polyL([[-.28, .45], [.28, .45], [.33, 1.2], [-.33, 1.2]].map(P))], skin, lw);
  A.group([polyL([[-.75, .75], [-.25, .6], [0, 1.2], [-.9, 1.2]].map(P)), polyL([[.75, .75], [.25, .6], [0, 1.2], [.9, 1.2]].map(P))], PAL.ai, lw);
  A.atop(x => { x.fillStyle = PAL.white; for (const k of [-1, 1]) { x.beginPath(); poly(x, [[k * .25, .6], [k * .33, .62], [k * .1, 1.2], [k * .02, 1.2]].map(P)); x.fill(); } });
  // ears + face
  const face = [[0, -.62], [.3, -.58], [.45, -.35], [.48, -.05], [.44, .2], [.33, .42], [.15, .55], [0, .58], [-.15, .55], [-.33, .42], [-.44, .2], [-.48, -.05], [-.45, -.35], [-.3, -.58]];
  A.group([ell(P([-.5, .02]), .07 * s, .12 * s), ell(P([.5, .02]), .07 * s, .12 * s), polyS(face.map(P))], skin, lw);
  // pate + topknot
  A.atop(x => { x.fillStyle = '#b9c2c0'; x.beginPath(); smooth(x, [[-.32, -.56], [0, -.66], [.32, -.56], [.2, -.4], [-.2, -.4]].map(P), true); x.fill();
    if (E.blush) { x.fillStyle = rgba(PAL.beniL, .55 * E.blush); for (const k of [-1, 1]) { x.beginPath(); x.ellipse(...P([k * .3, .18]), .1 * s, .06 * s, 0, 0, TAU); x.fill(); } }
    const R = mulberry(9); x.fillStyle = 'rgba(70,80,88,.5)'; for (let i = 0; i < 160; i++) { const a = R() * Math.PI, r = .3 + R() * .14; const p = P([Math.cos(a) * r * 1.05, .2 + Math.sin(a) * r * .9]); if (p[1] > cy + .26 * s) { x.beginPath(); x.arc(p[0], p[1], s * .005, 0, TAU); x.fill(); } } });
  A.group([polyS([[-.08, -.62], [.12, -.66], [.2, -.76], [.02, -.72], [-.12, -.7]].map(P))], S, lw);
  // headband with knot
  A.group([limb([[-.47, -.33], [-.2, -.38], [.2, -.38], [.47, -.33]].map(P), .1 * s, .1 * s), polyS([[.45, -.38], [.62, -.5], [.66, -.42], [.5, -.33]].map(P)), polyS([[.46, -.32], [.66, -.26], [.62, -.18], [.48, -.28]].map(P))], PAL.white, lw * .9);
  A.atop(x => { x.strokeStyle = PAL.ai; x.lineWidth = s * .012; for (let i = -4; i <= 4; i++) { x.beginPath(); const p = P([i * .1, -.4]); x.moveTo(p[0], p[1]); const q = P([i * .1 + .04, -.31]); x.lineTo(q[0], q[1]); x.stroke(); } });
  // eyes
  for (const k of [-1, 1]) {
    const c = [k * .2, -.12], ew = .1, op = E.open, eh = .055 * op, ld = E.lid || 0;
    if (op > .1) {
      const eye = [[c[0] - ew, c[1]], [c[0], c[1] - eh * 1.2], [c[0] + ew, c[1]], [c[0], c[1] + eh * .8]];
      A.fill(x => smooth(x, eye.map(P), true), PAL.white);
      fc.save(); fc.beginPath(); smooth(fc, eye.map(P), true); fc.clip();
      fc.fillStyle = S; fc.beginPath(); fc.arc(...P([c[0] + E.gx * .035, c[1] + E.gy * .02]), s * .033 * Math.min(1, .6 + op * .3), 0, TAU); fc.fill();
      if (Math.abs(ld) > .02) { fc.fillStyle = skin; const yi = c[1] - eh * 1.3 + eh * 2 * Math.max(0, -ld), yo = c[1] - eh * 1.3 + eh * 2 * Math.max(0, ld); fc.beginPath(); poly(fc, [P([c[0] - k * ew * 1.2, c[1] - .3]), P([c[0] + k * ew * 1.2, c[1] - .3]), P([c[0] + k * ew * 1.2, yo]), P([c[0] - k * ew * 1.2, yi])]); fc.fill(); }
      fc.restore();
      const yi = Math.max(0, -ld), yo = Math.max(0, ld);
      A.carve([[c[0] - k * ew, c[1]], [c[0] - k * ew * .3, c[1] - eh * 1.2 + eh * 1.6 * yi * .7], [c[0] + k * ew * .4, c[1] - eh * 1.2 + eh * 1.6 * yo * .7], [c[0] + k * ew, c[1]]].map(P), lw * 1.4, { taper: [.15, .15], jit: .05 });
    } else A.carve([[c[0] - ew, c[1]], [c[0], c[1] + (E.smile > .3 ? -.02 : .015)], [c[0] + ew, c[1]]].map(P), lw * 1.5, { taper: [.2, .2], jit: .05 });
    // bushy brow: inner end k*0.08
    const by = -.28 - (E.browY || 0) * .06, b = E.brow || 0;
    A.group([polyS([[k * .07, by - b * .06 + .02], [k * .18, by - .05 - Math.abs(b) * .01], [k * .34, by - .02 + b * .04], [k * .3, by + .03 + b * .04], [k * .17, by + .005], [k * .08, by + .05 - b * .06]].map(P))], S, lw * .5);
  }
  // nose
  A.line([[.02, -.1], [.07, .07], [.02, .1], [-.04, .085]].map(P), lw * 1.2);
  // mouth
  const m = E.mouth, j = E.jaw || 0;
  if (m === 'yawn' || m === 'O' || m === 'shout' || m === 'pant' || m === 'sigh') {
    const mw = m === 'yawn' ? .2 : m === 'shout' ? .19 : m === 'O' ? .1 : m === 'sigh' ? .06 : .12, mh = (m === 'yawn' ? .3 : m === 'shout' ? .17 : m === 'O' ? .17 : m === 'sigh' ? .04 : .09) * (.4 + .6 * j);
    const my = .27;
    const pts = m === 'shout' ? [[-mw, my - .03], [0, my - .05], [mw, my - .03], [mw * .8, my + mh], [0, my + mh * 1.15], [-mw * .8, my + mh]] : [[-mw, my], [0, my - mh * .5], [mw, my], [0, my + mh]];
    A.group([polyS(pts.map(P))], '#6a2620', lw);
    if (m === 'yawn' || m === 'shout') A.fill(x => x.ellipse(...P([0, my + mh * .6]), mw * .55 * s, mh * .3 * s, 0, 0, TAU), PAL.beniL);
    if (m === 'shout') A.fill(x => poly(x, [[-mw * .7, my - .035], [mw * .7, my - .035], [mw * .65, my + .0], [-mw * .65, my + .0]].map(P)), PAL.white);
  } else if (m === 'smile') A.carve([[-.15, .25], [-.07, .3 + E.smile * .02], [.07, .3 + E.smile * .02], [.15, .25]].map(P), lw * 1.3, { taper: [.2, .2], jit: .05 });
  else A.carve([[-.12, .28 + (E.smile < 0 ? .02 : 0)], [0, .27 + (E.smile || 0) * -.03], [.12, .28 + (E.smile < 0 ? .02 : 0)]].map(P), lw * 1.3, { taper: [.2, .2], jit: .05 });
  // wrinkles of effort / age
  A.line([[-.12, -.47], [0, -.49], [.12, -.47]].map(P), lw * .6);
  if ((E.brow || 0) < -.3) A.line([[-.03, -.3], [0, -.23], [.03, -.3]].map(P), lw * .6);
  if (E.sweat) for (let i = 0; i < 3; i++) { const p = P([-.42 + i * .4, -.2 + ((t * .4 + i * .37) % 1) * .5]); A.group([x => { x.moveTo(p[0], p[1] - .04 * s); x.quadraticCurveTo(p[0] + .025 * s, p[1], p[0], p[1] + .02 * s); x.quadraticCurveTo(p[0] - .025 * s, p[1], p[0], p[1] - .04 * s); }], PAL.skyL, lw * .5, PAL.prusD); }
  if (wet) { A.atop(x => { x.strokeStyle = rgba(PAL.prusL, .5); x.lineWidth = s * .01; for (let i = 0; i < 7; i++) { const p = P([-.4 + i * .13, -.5 + (i % 3) * .2]); x.beginPath(); x.moveTo(p[0], p[1]); x.lineTo(p[0], p[1] + .12 * s); x.stroke(); } }); }
  if (snow) A.group([polyS([[-.5, -.55], [-.2, -.75], [.2, -.78], [.5, -.58], [.35, -.5], [0, -.62], [-.35, -.5]].map(P))], PAL.white, lw);
  return { P };
}

// ———————————— KITE (black kite, 鸢) ————————————
// X,Y body centre; s wingspan px; dir ±1 (faces); flap: −1 up … 1 down; o.fish: carrying; o.claws: 0..1 extended
export function kite(A, X, Y, s, dir, flap, o = {}) {
  // seen from below at an angle: body along the flight direction, both wings spread across it.
  // flap ∈ [−1 up … 1 down]: span foreshortens and the tips lift/drop; s ≈ wingspan in px
  const lw = o.lw ?? (1.6 + s * .004), col = '#4a3728', colL = '#7d6248', colU = '#a08463';
  const P = p => { const q = rot(p, (o.tilt || 0)); return [X + dir * q[0] * s, Y + q[1] * s]; };
  const u = (clamp(flap, -1, 1) + 1) / 2;   // 0 = wings up, 1 = wings down
  const wing = k => { // k = 0 far wing, 1 near wing (both seen from the side, raised in a V when up)
    const len = k ? .5 : .4, ty = lerp(-len, len * .55, u), tx = lerp(-.12, -.04, u) + (k ? 0 : .06);
    const sh = [.04 - (k ? 0 : .03), -.02], tip = [tx, ty], wrist = L2(sh, tip, .45).map((v, j) => v + (j ? -.04 * (1 - u) : .05));
    const pts = [add(sh, [.04, 0]), wrist, tip];
    const back = [sh[0] - .2, sh[1] + .02];
    for (let i = 0; i < 5; i++) { const q = i / 5, bp = L2(tip, L2(wrist, back, .5), q * .6); const out = sub(bp, L2(wrist, back, .5)); const nn = Math.hypot(...out) || 1; pts.push(add(bp, [-.06 * (1 - q * .5), out[1] / nn * .0])); pts.push(L2(tip, L2(wrist, back, .5), q * .6 + .07)); }
    pts.push(back);
    return pts.map(P);
  };
  A.group([polyL(wing(0))], mix(col, '#000000', .2), lw);
  const body = polyS([[.17, 0], [.11, -.045], [-.02, -.05], [-.16, -.03], [-.2, 0], [-.16, .03], [-.02, .05], [.11, .045]].map(P));
  const tail = polyL([[-.16, -.03], [-.36, -.08], [-.32, 0], [-.36, .08], [-.16, .03]].map(P));
  const headS = ell(P([.17, 0]), .05 * s, .04 * s);
  A.group([tail, body, headS], col, lw);
  A.atop(x => { x.fillStyle = colU; x.beginPath(); smooth(x, [[.08, -.02], [-.06, -.03], [-.12, 0], [-.06, .03], [.08, .02]].map(P), true); x.fill(); });
  A.group([polyS([[.205, -.012], [.25, .0], [.225, .025], [.205, .012]].map(P))], PAL.ochre, lw * .7);
  const e = P([.185, -.012]); A.fill(x => x.arc(e[0], e[1], .013 * s, 0, TAU), '#e8c34a'); A.kfill(x => x.arc(e[0] + dir * .003 * s, e[1], .0065 * s, 0, TAU)); A.line([P([.165, -.03]), P([.205, -.026])], lw * 1.1);
  if (o.fish || o.claws) {
    const fp = P([.0, .1 + .04 * (o.claws || 0)]);
    A.line([P([.02, .02]), fp], lw * 1.5, PAL.ochre); A.line([P([-.02, .02]), add(fp, [-dir * .02 * s, 0])], lw * 1.5, PAL.ochre);
    if (o.fish) fish(A, add(fp, [dir * .01 * s, .012 * s]), .36 * s, (dir > 0 ? 0 : Math.PI) + dir * .15 + (o.fishAng || 0), Math.sin((o.t || 0) * 9) * .3, lw * .9);
  }
  A.group([polyL(wing(1))], col, lw);
  A.atop(x => { x.strokeStyle = colL; x.lineWidth = lw * .9; const w = wing(1); for (let i = 3; i < w.length - 1; i += 2) { x.beginPath(); x.moveTo(...L2(w[0], w[1], .7)); x.lineTo(...w[i]); x.stroke(); } });
}
// big insert: the kite's talons, open (0) → clenched (1)
export function talons(A, X, Y, s, grip, o = {}) {
  // grip 0 = spread wide (strike) … 1 = clenched. X,Y = the foot; s ≈ foot size px
  const lw = 3 + s * .004, yel = '#d9b24a';
  const P = p => [X + p[0] * s, Y + p[1] * s];
  A.group([polyS([[-.2, -1.2], [.22, -1.2], [.2, -.55], [.1, -.42], [-.1, -.42], [-.2, -.6]].map(P))], '#4a3728', lw);
  A.atop(x => { x.strokeStyle = '#2b1f16'; x.lineWidth = lw; for (let i = 0; i < 9; i++) { const a = P([-.15 + (i % 3) * .13, -1.05 + Math.floor(i / 3) * .2]); x.beginPath(); x.moveTo(a[0], a[1]); x.quadraticCurveTo(a[0] + .02 * s, a[1] + .08 * s, a[0] + .06 * s, a[1] + .1 * s); x.stroke(); } });
  A.group([limb([[0, -.5], [0, 0]].map(P), .16 * s, .14 * s)], yel, lw);
  A.atop(x => { x.strokeStyle = '#a07e2e'; x.lineWidth = lw * .7; for (let u = -.45; u < 0; u += .08) { x.beginPath(); x.moveTo(...P([-.07, u])); x.lineTo(...P([.07, u + .02])); x.stroke(); } });
  // three front toes (fan to the right/down), one hind toe (left/down); each curls toward the palm as grip → 1
  const toes = [[.15, 1], [.6, 1], [1.05, 1], [2.55, -1]];
  for (const [a0, sg] of toes) {
    let a = a0 + sg * grip * .5, p = [0, 0]; const pts = [p];
    for (const L of [.3, .22]) { p = add(p, [Math.cos(a) * L, Math.sin(a) * L]); pts.push(p); a += sg * (.25 + grip * 1.0); }
    A.group([limb(pts.map(P), .12 * s, .085 * s)], yel, lw);
    A.atop(x => { x.strokeStyle = '#a07e2e'; x.lineWidth = lw * .6; for (let u = .2; u < 1; u += .2) { const q = P(L2(pts[0], pts[2], u)); x.beginPath(); x.arc(q[0], q[1], .03 * s, a - 1, a + .3); x.stroke(); } });
    // talon: a long curved black hook
    const b = pts[2], c1 = add(b, [Math.cos(a) * .12, Math.sin(a) * .12]), tip = add(c1, [Math.cos(a + sg * 1.2) * .1, Math.sin(a + sg * 1.2) * .1]);
    const nrm = [-Math.sin(a) * .04, Math.cos(a) * .04];
    A.group([polyS([add(b, nrm), add(c1, mul(nrm, .6)), tip, add(c1, mul(nrm, -.5)), sub(b, nrm)].map(P))], S, lw * .5);
  }
}
// ———————————— EXTRAS ————————————
// a generic small townsperson; kind: 'umbrella'|'cape'|'farmer'|'monk'|'fisher'; ph walk phase
export function person(A, X, Y, s, dir, kind, ph = 0, o = {}) {
  const lw = o.lw ?? (1.6 + s * .004), skin = PAL.skin;
  const P = p => [X + dir * p[0] * s, Y + p[1] * s];
  const c = Math.sin(ph * TAU), bob = -.01 * Math.abs(Math.cos(ph * TAU));
  const kimono = o.col || (kind === 'monk' ? '#5f5e58' : kind === 'farmer' ? '#6e7f8c' : PAL.ai);
  const lean = kind === 'farmer' ? (o.bend ? .9 : .1) : kind === 'cape' ? .2 : .08;
  const hip = [0, -.45 + bob], sh = add(hip, rot([0, -.3], lean)), hd = add(hip, rot([0, -.4], lean));
  const legs = [[.09 * c, 0], [-.09 * c, 0]].map(([fx, fy], i) => { const [k, e] = ik(hip, [fx, fy - .03], .23, .22, -1); return [hip, k, e]; });
  for (let i = 1; i >= 0; i--) { A.group([limb(legs[i].map(P), .045 * s, .035 * s), ell(P(add(legs[i][2], [.02, .02])), .04 * s, .016 * s)], i ? mix(skin, '#9d8a6c', .3) : skin, lw); A.atop(x => { x.strokeStyle = '#2b3445'; x.lineWidth = .05 * s; x.beginPath(); x.moveTo(...P(L2(legs[i][1], legs[i][2], .25))); x.lineTo(...P(L2(legs[i][1], legs[i][2], .85))); x.stroke(); }); }
  const hem = .23, kneeF = legs[0][1], kneeB = legs[1][1];
  if (kind === 'cape') A.group([polyS([add(sh, [.06, -.04]), add(sh, [-.08, -.05]), add(hip, [-.2, hem]), add(hip, [.0, hem + .04]), add(hip, [.16, hem - .03])].map(P))], PAL.straw, lw);
  else A.group([polyS([add(sh, [.065, 0]), add(sh, [-.075, 0]), add(hip, [-.11, .02]), [Math.min(kneeB[0], kneeF[0]) - .05, hip[1] + hem], [Math.max(kneeB[0], kneeF[0]) + .05, hip[1] + hem], add(hip, [.1, .02])].map(P))], kimono, lw);
  if (kind !== 'cape') A.atop(x => { x.fillStyle = kind === 'monk' ? '#3c3b37' : PAL.ochre; x.fillRect(...P(add(hip, [-.1, -.04])), .2 * s, .035 * s); });
  if (kind === 'cape') A.atop(x => { x.strokeStyle = mix(PAL.straw, '#5b4020', .5); x.lineWidth = lw * .6; for (let i = 0; i < 9; i++) { const a = P(add(sh, [-.07 + i * .016, .02])), b = P(add(hip, [-.18 + i * .04, .17])); x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); x.stroke(); } });
  A.group([ell(P(hd), .06 * s, .065 * s)], skin, lw);
  if (kind === 'monk') A.atop(x => { x.fillStyle = '#b9c2c0'; x.beginPath(); x.arc(...P(add(hd, [0, -.02])), .055 * s, Math.PI, TAU); x.fill(); });
  else if (kind !== 'umbrella') { // kasa hat
    const hc = add(hd, [0, -.04]);
    A.group([polyS([add(hc, [-.2, .05]), add(hc, [-.06, -.04]), add(hc, [0, -.09]), add(hc, [.06, -.04]), add(hc, [.2, .05]), add(hc, [0, .06])].map(P))], o.hat || PAL.straw, lw);
  } else A.atop(x => { x.fillStyle = S; x.beginPath(); x.arc(...P(add(hd, [-.01, -.02])), .058 * s, Math.PI * .9, TAU * 1.05); x.fill(); });
  if (kind === 'umbrella') {
    const u = add(hd, [.02, -.17 + (o.uy || 0)]), r = .34, ut = o.utilt || 0;
    const U = p => P(add(u, rot(p, ut)));
    A.line([P(add(hd, [.03, .05])), U([0, .0])], lw * .8);
    const canopy = [[-r, .1], [-r * .5, -.02], [0, -.07], [r * .5, -.02], [r, .1], [r * .5, .07], [0, .08], [-r * .5, .07]].map(U);
    A.group([polyS(canopy)], o.ucol || '#c9b07a', lw);
    for (let i = -3; i <= 3; i++) A.line([U([0, -.07]), U([i * r / 3, .085 - Math.abs(i) * .0])], lw * .45);
    A.atop(x => { x.fillStyle = o.uband || PAL.ai; x.beginPath(); x.arc(...U([0, -.06]), .06 * s, 0, TAU); x.fill(); });
  }
  if (kind === 'fisher' || kind === 'farmer') { const hnd = P(add(sh, [.12, .14])); A.line([P(sh), hnd], lw * 2.2, kimono); }
}
// fishing boat (side view): X,Y waterline centre, s length px
export function boat(A, X, Y, s, dir = 1, o = {}) {
  const lw = 2 + s * .004;
  const P = p => { const q = rot(p, o.tilt || 0); return [X + dir * q[0] * s, Y + q[1] * s]; };
  A.group([polyS([[-.5, -.1], [-.3, .05], [.25, .06], [.52, -.16], [.47, -.18], [.2, -.06], [-.3, -.06], [-.48, -.13]].map(P))], PAL.woodL, lw);
  A.atop(x => { x.fillStyle = PAL.woodD; x.beginPath(); poly(x, [[-.45, -.06], [.4, -.07], [.35, -.03], [-.38, -.02]].map(P)); x.fill(); });
  A.line([[-.46, -.08], [.0, -.04], [.47, -.13]].map(P), lw * .6);
  for (let i = 0; i < 4; i++) A.line([[-.3 + i * .18, -.06], [-.28 + i * .18, .04]].map(P), lw * .5);
  if (o.oar) A.group([limb([[-.4, -.1], [-.62, .12]].map(P), .02 * s, .02 * s)], PAL.wood, lw * .7);
  return { prow: P([.46, -.18]), deck: P([.0, -.07]) };
}
// a cat paw in close-up (insert): X,Y wrist, s px, claws 0..1, dir
export function bigPaw(A, X, Y, s, ang, claws = 0, o = {}) {
  const lw = 3 + s * .004;
  const P = p => { const q = rot(p, ang); return [X + q[0] * s, Y + q[1] * s]; };
  const arm = limb([[-1.2, 0], [-.55, .02], [0, 0]].map(P), .34 * s, .3 * s);
  const pad = polyS([[-.05, -.17], [.12, -.2], [.25, -.12], [.3, 0], [.25, .12], [.12, .2], [-.05, .17]].map(P));
  A.group([arm, pad], CAT.white, lw);
  A.atop(x => { x.fillStyle = CAT.ochre; x.beginPath(); smooth(x, [[-1.25, -.2], [-.8, -.22], [-.6, -.1], [-.75, .12], [-1.25, .2]].map(P), true); x.fill(); });
  // toe lines
  for (const yy of [-.08, .02, .1]) A.line([[.12, yy * .9], [.3, yy * 1.2]].map(P), lw * .7);
  if (claws > .02) for (const yy of [-.12, -.03, .06, .14]) { const b = [.27 + .02 * Math.cos(yy * 9), yy * 1.15], tip = add(b, rot([.1 * claws + .02, .03 * claws], .3 * claws)); A.group([polyS([add(b, [0, -.018]), tip, add(b, [0, .018])].map(P))], '#efe6cf', lw * .5); }
  // ribs of the leg (fur strokes)
  for (let i = 0; i < 4; i++) A.line([[-.9 + i * .18, -.13], [-.85 + i * .18, -.08]].map(P), lw * .5);
}
// the fishmonger's hand laying the fish (insert)
export function bigHand(A, X, Y, s, ang, o = {}) {
  const lw = 3 + s * .004, skin = PAL.skin;
  const P = p => { const q = rot(p, ang); return [X + q[0] * s, Y + q[1] * s]; };
  A.group([polyL([[-1.4, -.2], [-.5, -.18], [-.45, .2], [-1.4, .24]].map(P))], PAL.ai, lw);
  A.atop(x => { x.fillStyle = PAL.white; x.beginPath(); poly(x, [[-.62, -.2], [-.52, -.2], [-.48, .22], [-.58, .22]].map(P)); x.fill(); });
  const palm = polyS([[-.5, -.15], [-.1, -.17], [.1, -.13], [.18, -.06], [.2, .06], [.08, .14], [-.2, .18], [-.5, .16]].map(P));
  const fingers = [-.1, -.03, .04, .11].map((y, i) => limb([[.05, y], [.27 + i * .01, y + .02], [.4 - Math.abs(i - 1.5) * .03, y + .07 + (o.curl || 0) * .06]].map(P), .07 * s, .06 * s));
  const thumb = limb([[-.15, -.15], [.0, -.27], [.12, -.3]].map(P), .085 * s, .065 * s);
  A.group([palm, ...fingers, thumb], skin, lw);
  A.line([[-.1, -.05], [.05, .0]].map(P), lw * .5);
}
