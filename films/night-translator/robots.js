// The two robots, drawn as tonal forms (grey values; the Redraw pass inks them). Local units: world px at scale 1,
// origin at the ground contact point. Every parameter comes from eased keyframe tracks in shots.js (no `if` poses).
import { form, stroke, ellipsePts, catmull, grey, S as IS } from './engine/ink.js';
import { ik, clamp } from './lib.js';
import { red } from './mask.js';

const circ = (cx, cy, r, n = 40) => ellipsePts(cx, cy, r, r, 0, n);
const rot = (p, c, a) => { const s = Math.sin(a), k = Math.cos(a), x = p[0] - c[0], y = p[1] - c[1]; return [c[0] + x * k - y * s, c[1] + x * s + y * k]; };

// a tube limb (shoulder → elbow → hand) as a closed tonal shape
function tube(g, pts, w, v, seed = 1) {
  const L = [], R = [];
  const P = catmull(pts, false, 6);
  for (let i = 0; i < P.length; i++) {
    const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)];
    let tx = b[0] - a[0], ty = b[1] - a[1]; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
    L.push([P[i][0] - ty * w / 2, P[i][1] + tx * w / 2]); R.push([P[i][0] + ty * w / 2, P[i][1] - tx * w / 2]);
  }
  form(g, L.concat(R.reverse()), { v, line: 2, grad: .12, seed });
}

// three-prong grip at the hand, opening `open` (0..1), pointing along angle a
function grip(g, h, a, open, v, s = 1) {
  for (const k of [-1, 0, 1]) {
    const aa = a + k * (.35 + open * .5);
    const p1 = [h[0] + Math.cos(aa) * 7 * s, h[1] + Math.sin(aa) * 7 * s], p2 = [h[0] + Math.cos(aa + k * .4) * 13 * s, h[1] + Math.sin(aa + k * .4) * 13 * s];
    stroke(g, [h, p1, p2], 3.2 * s, { taper: .2 });
  }
  form(g, circ(h[0], h[1], 4.5 * s, 14), { v, line: 1.5 });
}

// ---------------- 小译 Xiao Yi: a film-can drum on one wheel ----------------
// st: x, y (ground), s (scale), tilt (rad, about the wheel hub), squash (1 = none), roll (wheel angle), lean (body x shift),
//     ex, ey (eye look −1..1), blink (0..1), brow (−1 cross … +1 worried), ant (antenna wobble), bulb (0..1 lit),
//     armL / armR: { t: [x, y] hand target in local units (null = hanging), open } ; hidden: draw nothing below y = cut
export function xiaoYi(g, st) {
  const s = st.s ?? 1;
  g.save(); g.translate(st.x, st.y); g.scale(s * (st.flip ?? 1), s);
  const hub = [0, -18];
  // wheel + spokes (rotation = distance / radius, set by the shot)
  form(g, circ(0, -18, 18, 28), { v: .2, line: 2.2, grad: .1 });
  form(g, circ(0, -18, 12, 24), { v: .55, line: 1.4 });
  for (let i = 0; i < 4; i++) { const a = (st.roll ?? 0) + i * Math.PI / 2; stroke(g, [[Math.cos(a) * 3, -18 + Math.sin(a) * 3], [Math.cos(a) * 11, -18 + Math.sin(a) * 11]], 2.2, { taper: 0 }); }
  form(g, circ(0, -18, 3.5, 12), { v: .15, line: 1 });
  // body frame (tilted about the hub, squashed toward the ground)
  g.save(); g.translate(hub[0], hub[1]); g.rotate(st.tilt ?? 0); g.scale(1 / Math.sqrt(st.squash ?? 1), st.squash ?? 1); g.translate(-hub[0] + (st.lean ?? 0), -hub[1]);
  // fork
  for (const k of [-1, 1]) tube(g, [[k * 7, -20], [k * 16, -34], [k * 22, -46]], 6, .5);
  // antenna (spring) + bulb
  const aw = st.ant ?? 0, tip = [aw * 10, -168];
  stroke(g, catmull([[0, -136], [aw * 3 + 2, -146], [aw * 6 - 2, -155], tip], false, 5), 2.4, { taper: .1 });
  form(g, circ(tip[0], tip[1], 6, 16), { v: .55 + .43 * (st.bulb ?? 0), line: 1.6, grad: .2 });
  // arms behind the body edge are drawn after the body (they are in front: robot faces us)
  const B = [0, -88];
  // arms: shoulders on the rim; hand targets in local coordinates (IK). An arm whose hand crosses the body centre
  // passes behind the drum (drawn before it), so it never cuts across the face plate.
  const drawArms = behind => { for (const k of [-1, 1]) {
    const A = k < 0 ? st.armL : st.armR, sh = [B[0] + k * 47, B[1] + 6];
    const tgt = A && A.t ? A.t : [sh[0] + k * 10, sh[1] + 50];
    if ((k * tgt[0] < 0) !== behind) continue;
    const s1 = ik(sh, tgt, 30, 30, 1), s2 = ik(sh, tgt, 30, 30, -1);
    const [e, h] = (k * s1[0][0] > k * s2[0][0]) ? s1 : s2;
    tube(g, [sh, e, h], 7, .62, 3 + k);
    form(g, circ(e[0], e[1], 4, 12), { v: .45, line: 1.2 });
    grip(g, h, Math.atan2(h[1] - e[1], h[0] - e[0]), A?.open ?? .3, .5);
  } };
  drawArms(true);
  // drum: rim, plate, rivets
  form(g, circ(B[0], B[1], 50, 48), { v: .78, line: 2.8, grad: .22, shade: 9 });
  form(g, circ(B[0], B[1], 41, 44), { v: .9, line: 1.6, grad: .14 });
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 + .3; form(g, circ(B[0] + Math.cos(a) * 45.5, B[1] + Math.sin(a) * 45.5, 1.8, 8), { v: .45, line: 0 }); }
  // two small reel holes low on the plate (a can, not a face: no mouth)
  for (const k of [-1, 1]) form(g, circ(B[0] + k * 20, B[1] + 22, 5, 12), { v: .55, line: 1.2 });
  // eyes: lamp glass + pupil + lid; brow plates
  const ex = clamp(st.ex ?? 0, -1, 1), ey = clamp(st.ey ?? 0, -1, 1), bl = clamp(st.blink ?? 0);
  for (const k of [-1, 1]) {
    const c = [B[0] + k * 17, B[1] - 12];
    form(g, circ(c[0], c[1], 11, 24), { v: .25, line: 2 });
    form(g, circ(c[0], c[1], 8.5, 22), { v: .98, line: 0, grad: .05 });
    form(g, circ(c[0] + ex * 3.6, c[1] + ey * 3.6, 3.6, 14), { v: .06, line: 0, grad: 0 });
    if (bl > .02) { const h = 17 * bl; form(g, [[c[0] - 9, c[1] - 9], [c[0] + 9, c[1] - 9], [c[0] + 9, c[1] - 9 + h], [c[0] - 9, c[1] - 9 + h]], { v: .7, line: 1.4, grad: 0 }); }
    const br = (st.brow ?? 0) * .38 * k;                     // + worried (inner end up)
    const b0 = rot([c[0] - 10, c[1] - 17], [c[0], c[1] - 17], br), b1 = rot([c[0] + 10, c[1] - 17], [c[0], c[1] - 17], br);
    tube(g, [b0, b1], 4.2, .2);
  }
  drawArms(false);
  g.restore();
  g.restore();
}
// world position of a point given in Xiao Yi's local (unsquashed) frame
export function xyLocal(st, p) {
  const s = st.s ?? 1, hub = [0, -18], a = st.tilt ?? 0, q = st.squash ?? 1;
  let x = (p[0] + (st.lean ?? 0) - hub[0]) / Math.sqrt(q), y = (p[1] - hub[1]) * q;
  const xx = x * Math.cos(a) - y * Math.sin(a) + hub[0], yy = x * Math.sin(a) + y * Math.cos(a) + hub[1];
  return [st.x + xx * s * (st.flip ?? 1), st.y + yy * s];
}

// ---------------- 老校 Lao Jiao: a tall iron proof-reader on three casters ----------------
// st: x, y, s, dir (−1 faces left), lean (rad), head (tilt rad), lensOut (0..1), glint (0..1),
//     pen: hand target (local) for the pen arm, stamp: hand target for the stamp arm, penRed (pen tip drawn red), hold: 'bucket'|'xy'|null
export function laoJiao(g, st) {
  const s = st.s ?? 1, d = st.dir ?? -1;
  g.save(); g.translate(st.x, st.y); g.scale(s, s);
  // casters + base
  for (const cx of [-34, 0, 34]) form(g, circ(cx, -8, 8, 18), { v: .25, line: 1.8 });
  form(g, [[-46, -14], [46, -14], [30, -34], [-30, -34]], { v: .3, line: 2.4, grad: .2, shade: 6 });
  // stem bends with lean: a quadratic from the base to the neck
  const L = st.lean ?? 0, neck = [Math.sin(L) * 220, -34 - Math.cos(L) * 220];
  const mid = [neck[0] * .35, (neck[1] - 34) / 2];
  const P = catmull([[0, -34], mid, neck], false, 10);
  tube(g, P, 16, .3, 7);
  // collar rings on the stem
  for (const u of [.25, .6]) { const p = P[Math.round(u * (P.length - 1))]; form(g, ellipsePts(p[0], p[1], 9, 4, 0, 16), { v: .5, line: 1.2 }); }
  // head: a box with a hinged monocle lens toward `dir`
  g.save(); g.translate(neck[0], neck[1]); g.rotate((st.head ?? 0) + L * .4);
  form(g, [[-36, -64], [36, -64], [36, -4], [-36, -4]], { v: .24, line: 2.8, grad: .3, shade: 7 });
  form(g, [[-26, -74], [26, -74], [22, -64], [-22, -64]], { v: .4, line: 1.8 });         // a little cap
  const lo = st.lensOut ?? 0, lc = [d * (16 + lo * 26), -34];
  if (lo > .02) tube(g, [[d * 10, -34], lc], 12, .45);
  form(g, circ(lc[0], lc[1], 25, 36), { v: .62, line: 2.6, grad: .3 });
  form(g, circ(lc[0], lc[1], 19, 32), { v: .92, line: 1.2, grad: .25 });
  form(g, circ(lc[0] + d * 2, lc[1] + 1, 5, 14), { v: .1, line: 0 });                     // the iris behind the glass
  if ((st.glint ?? 0) > .02) {                                                             // a four-point glint on the lens
    const k = st.glint * 18, c = [lc[0] - 6, lc[1] - 7];
    form(g, [[c[0], c[1] - k], [c[0] + k * .22, c[1] - k * .22], [c[0] + k, c[1]], [c[0] + k * .22, c[1] + k * .22], [c[0], c[1] + k], [c[0] - k * .22, c[1] + k * .22], [c[0] - k, c[1]], [c[0] - k * .22, c[1] - k * .22]], { v: 1, line: 0, grad: 0 });
  }
  g.restore();
  // two long arms from the upper stem; hand targets in local coordinates (IK)
  const sh = [neck[0] * .82, neck[1] * .82 + 6];
  const arm = (tgt, bend, seed) => { const a1 = ik(sh, tgt, 62, 62, 1), a2 = ik(sh, tgt, 62, 62, -1); const [e, h] = a1[0][1] > a2[0][1] ? a1 : a2; /* elbow hangs down */ tube(g, [sh, e, h], 8, .5, seed); form(g, circ(e[0], e[1], 4.5, 12), { v: .5, line: 1.2 }); return [e, h]; };
  // stamp arm (behind)
  const [se, shd] = arm(st.stamp ?? [d * -26, sh[1] + 100], d > 0 ? 1 : -1, 11);
  form(g, [[shd[0] - 4, shd[1] - 2], [shd[0] + 4, shd[1] - 2], [shd[0] + 4, shd[1] + 12], [shd[0] - 4, shd[1] + 12]], { v: .5, line: 1.4 });
  form(g, [[shd[0] - 11, shd[1] + 12], [shd[0] + 11, shd[1] + 12], [shd[0] + 11, shd[1] + 20], [shd[0] - 11, shd[1] + 20]], { v: .15, line: 1.6 });
  red(g, m => { m.fillRect(shd[0] - 11, shd[1] + 18, 22, 3); });
  // pen arm (front): a long pen with a red nib
  const [pe, ph] = arm(st.pen ?? [d * 40, sh[1] + 96], d > 0 ? -1 : 1, 13);
  const pa = Math.atan2(ph[1] - pe[1], ph[0] - pe[0]) + (st.penTilt ?? .5) * d;
  const nib = [ph[0] + Math.cos(pa) * 26, ph[1] + Math.sin(pa) * 26], back = [ph[0] - Math.cos(pa) * 10, ph[1] - Math.sin(pa) * 10];
  tube(g, [back, nib], 5, .55, 17);
  red(g, m => { m.beginPath(); m.arc(nib[0], nib[1], 4.2, 0, 7); m.fill(); }, .38, () => { g.beginPath(); g.arc(nib[0], nib[1], 4.2, 0, 7); g.fill(); });
  grip(g, ph, pa, .1, .4, .9);
  g.restore();
  return { neck, sh };
}
// world position of Lao Jiao's local point
export const ljLocal = (st, p) => [st.x + p[0] * (st.s ?? 1), st.y + p[1] * (st.s ?? 1)];
