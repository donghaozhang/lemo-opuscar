// 墨龙: the ink dragon rig, redesigned after the producer's notes: a long serpentine body in an S-curve tapering to the tail, a long snout with a jaw
// that opens, two antler horns, long flowing whiskers, a brushy mane on the neck, a row of dorsal spines, four small clawed legs and a flame tuft at
// the tail. Local units: body length `len` (default 100) from the neck to the tail tip, y down, facing +x; X {x, y, s, dir} places it.
// One pale mass (淡) is the body; two loaded strokes (back and belly) carry its contour; mane, spines, tuft are dry flying-white; the head in dark ink
// with the one vermilion eye left as paper and dotted red (画龙点睛). Drawn into a scratch layer T (so the eye and mouth can be cut out of the head
// without erasing the scene), then pasted on the picture A.
import { mk, draw, mass, blot, TONE } from './ink.js';
import { lerp, clamp, vnoise, VERM, rot, add2, mid } from './util.js';

// Expressions. lid: top lid 0 open … 1 closed; lidBot: squint from below; browY: −1 lowered … 1 raised; brow: angle (+ front end down = angry, − = worried);
// pupilR: pupil size; pupil [dx, dy] look direction; mouth 0..1 open; smile −1 frown … 1 smile; whisk −1 drooping … 1 raised; mane 0 flat … 1 bristled; puff: cheeks/chest
const E = (o) => ({ lid: .1, lidBot: 0, browY: 0, brow: 0, eye: 1, pupilR: 1, pupil: [0, 0], mouth: 0, smile: .1, whisk: .2, mane: .3, puff: 0, ...o });
export const EXPR = {
  neutral: E({}),
  curious: E({ lid: 0, browY: .7, brow: -.2, pupilR: 1.2, mouth: .15, smile: .25, whisk: .7, mane: .4 }),
  worried: E({ lid: .3, browY: .35, brow: -.65, pupilR: .9, mouth: .05, smile: -.6, whisk: -.8, mane: .1 }),
  angry: E({ lid: .35, lidBot: .3, browY: -.6, brow: .65, pupilR: .7, mouth: .35, smile: -.7, whisk: -.3, mane: .95 }),
  determined: E({ lid: .4, lidBot: .2, browY: -.35, brow: .45, pupilR: .8, mouth: 0, smile: 0, whisk: .3, mane: .7 }),
  shocked: E({ lid: 0, browY: 1, brow: -.3, pupilR: .5, mouth: .5, smile: 0, whisk: 1, mane: 1 }),
  happy: E({ lid: 1, browY: .4, brow: -.1, mouth: .25, smile: 1, whisk: .9, mane: .5 }),
  sleepy: E({ lid: .85, browY: -.1, pupilR: 1, mouth: .1, smile: 0, whisk: -.6, mane: 0 }),
  roar: E({ lid: .25, lidBot: .3, browY: -.7, brow: .7, pupilR: .6, mouth: 1, smile: -.3, whisk: -.5, mane: 1, puff: .4 }),
  effort: E({ lid: .8, browY: -.6, brow: .5, pupilR: .8, mouth: .45, smile: -.4, whisk: -.3, mane: .85 }),
  puffed: E({ lid: .3, browY: -.4, brow: .4, pupilR: .8, mouth: 0, smile: -.2, whisk: .1, mane: .9, puff: 1 }),
  dizzy: E({ lid: .5, browY: .2, brow: -.2, pupilR: .8, pupil: [.4, .3], mouth: .3, smile: -.3, whisk: -.6, mane: .2 }),
  closed: E({ lid: 1, smile: 0, whisk: 0, mane: .1 }),
  yawn: E({ lid: .9, browY: .3, mouth: .95, smile: 0, whisk: -.3, mane: .2 }),
  pout: E({ lid: .4, browY: -.2, brow: .3, pupilR: .9, mouth: .08, smile: -1, whisk: -.6, mane: .3 }),
  gasp: E({ lid: 0, browY: .8, brow: -.2, pupilR: .6, mouth: .4, smile: 0, whisk: .8, mane: .8 }),
};
export function mixExpr(a, b, u) { u = clamp(u); const o = {}; for (const k in b) { const x = a[k] ?? b[k], y = b[k]; o[k] = Array.isArray(y) ? y.map((v, i) => lerp((x ?? [0, 0])[i] ?? 0, v, u)) : typeof y === 'number' ? lerp(x, y, u) : y; } return o; }

export const DEF = {
  a: 0, len: 100, amp: 12, k: .9, ph: 0, curl: 0, taper: 1,
  legs: 0, ground: 12, gait: 0, stride: 7,
  headTilt: 0, expr: EXPR.neutral, wind: [0, 0], vel: [0, 0], tailUp: 0,
  blotR: 0, squash: 1, stretch: 1,
};

// Spine: n points from the neck backwards. The wave runs along the body; curl bends the whole body (fraction of a full turn, negative allowed).
export function spine(S) {
  const n = 17, P = [], N = [], ds = S.len / (n - 1);
  let x = 0, y = 0, a = Math.PI;
  const curlStep = S.curl * Math.PI * 2 / (n - 1);
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1);
    const env = Math.sin(Math.PI * Math.min(1, u * 1.1)) * .7 + .3 * u;
    const off = S.amp * 1.7 * Math.sin(S.k * u * Math.PI * 2 + S.ph) * env - S.tailUp * u * u * 20;   // the S-curve: the line of action
    P.push([x + off * Math.sin(a), y - off * Math.cos(a)]);
    x += ds * Math.cos(a); y += ds * Math.sin(a);
    a += curlStep * (u < .1 ? u * 10 : 1);
  }
  for (let i = 0; i < n; i++) {
    const p0 = P[Math.max(0, i - 1)], p1 = P[Math.min(n - 1, i + 1)], dx = p1[0] - p0[0], dy = p1[1] - p0[1], L = Math.hypot(dx, dy) || 1;
    let nx = dy / L, ny = -dx / L; if (ny > 0) { nx = -nx; ny = -ny; } N.push([nx, ny]);
  }
  return { P, N, n };
}
// width profile (0 neck → 1 tail tip) in units of w0
const WID = (u, S) => {
  const puff = 1 + .5 * (S.expr.puff || 0) * Math.exp(-Math.pow((u - .18) / .15, 2));
  const base = u < .2 ? lerp(.72, 1, u / .2) : u < .5 ? lerp(1, .8, (u - .2) / .3) : lerp(.8, .06, Math.pow((u - .5) / .5, 1.3 * S.taper));
  return base * puff;
};
function ik(hip, foot, l1, l2, bend) {
  const dx = foot[0] - hip[0], dy = foot[1] - hip[1], dd = Math.hypot(dx, dy) || 1e-6, d = Math.min(dd, l1 + l2 - .01);
  const a0 = Math.atan2(dy, dx), a1 = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1)) * bend;
  return [hip, [hip[0] + Math.cos(a0 + a1) * l1, hip[1] + Math.sin(a0 + a1) * l1], [hip[0] + dx * d / dd, hip[1] + dy * d / dd]];
}

export function dragon(A, T, S0, X = {}) {
  const S = { ...DEF, ...S0 }, x0 = X.x ?? 0, y0 = X.y ?? 0, sc = X.s ?? 1, dir = X.dir ?? 1, am = X.am ?? 1, p = X.p ?? 1, eyeK = X.eye ?? 1, t = X.t ?? 0;
  const ca = Math.cos(S.a), sa = Math.sin(S.a), st = S.stretch;
  const T2 = q => { const lx = q[0] * st, ly = q[1] * S.squash / st; return [x0 + (lx * ca - ly * sa) * sc * dir, y0 + (lx * sa + ly * ca) * sc, q[2] ?? 1]; };
  const list = []; let idx = 0;
  const seedBase = (X.seed ?? 5) * 1000;
  const St = (pts, o) => {
    const oo = { ...o, w: o.w * sc, seed: seedBase + (idx++) * 97, gapLen: (o.gapLen ?? 40) * sc, boil: X.boil ? (Math.floor(X.boil) % 5) : 0 };
    if (o.darkDir) { const d = o.darkDir; oo.darkDir = [(d[0] * ca - d[1] * sa) * dir, d[0] * sa + d[1] * ca]; }
    list.push({ s: mk(pts.map(T2), oo) });
  };
  const M = (poly, a, jit = .6, dryToo = 0) => list.push({ m: poly.map(T2), a, jit: jit * sc, seed: idx++, dryToo });
  const w0 = S.len * .17, { P, N } = spine(S), n = P.length, hs = S.len / 100, Ex = S.expr;
  const up = (i, k) => add2(P[i], [N[i][0] * k, N[i][1] * k]);
  const wind = S.wind, vel = S.vel, drift = [wind[0] - vel[0] * .4, wind[1] - vel[1] * .4];   // what the mane and whiskers trail with
  const wav = (ph) => Math.sin(t * 3.1 + ph);

  // 1. body mass, morphing from the birth blot when blotR > 0
  const top = [], bot = [];
  for (let i = 0; i < n; i++) { const hw = w0 * WID(i / (n - 1), S) / 2; top.push(up(i, -hw)); bot.push(up(i, hw)); }
  let poly = [...top, ...bot.reverse()];
  if (S.blotR > 0) {
    const c = [S.len * .15, 2], r = w0 * 2.4, m = poly.length;
    poly = poly.map((q, i) => { const an = (i / m) * Math.PI * 2 + .3, bq = [c[0] + Math.cos(an) * r * (1 + .1 * vnoise(i * .9 + 3)), c[1] + Math.sin(an) * r * .85]; return [lerp(q[0], bq[0], S.blotR), lerp(q[1], bq[1], S.blotR)]; });
  }
  M(poly, .3 + .45 * S.blotR, 1.2, .5 * S.blotR);
  const K = 1 - S.blotR;
  if (K > .02) {
    // 2. back (浓) and belly (重) loaded strokes
    const back = [], belly = [];
    for (let i = 0; i < n; i++) { const u = i / (n - 1), hw = w0 * WID(u, S) / 2; back.push([...up(i, -hw * .6), WID(u, S) * 1.1]); belly.push([...up(i, hw * .62), WID(u, S)]); }
    St(back, { w: w0 * .34, tone: .8 * K, darkDir: [0, -1], side: .9, brWet: true, body: .22, dry: .48, wet: .8, prof: 'robe', nb: 16, rough: .12 });
    St(belly.slice(0, 14), { w: w0 * .22, tone: .5 * K, darkDir: [0, 1], side: .8, brWet: true, body: .16, dry: .55, wet: .8, prof: 'robe', nb: 10 });
    // 3. belly scales: short arcs
    for (let j = 0; j < 11; j++) { const k = 1 + j, u = k / (n - 1), hw = w0 * WID(u, S) / 2, c = up(k, hw * .45), r = hw * .5; if (r < 1.2) break; St([add2(c, [-r * .9, -r * .35]), add2(c, [0, r * .25]), add2(c, [r * .9, -r * .35])], { w: 1.3 * hs, tone: .4 * K, dry: .6, prof: 'tip', nb: 3 }); }
    // 4. dorsal spines: a row of small triangles along the whole back, bigger at the neck, bristling with the mane
    for (let j = 0; j < 14; j++) { const k = 1 + j; if (k >= n - 2) break; const u = k / (n - 1), hw = w0 * WID(u, S) / 2, b = up(k, -hw * .95), L = (7 - 5 * u) * hs * (1 + .3 * Ex.mane), bk = [N[k][0] * L * .9 - 3 * hs, N[k][1] * L * .9], bk2 = [N[k][0] * L * .4 - .5 * hs, N[k][1] * L * .4]; St([add2(b, [1.5 * hs, 0]), add2(b, bk2), add2(b, bk)], { w: 2.4 * hs, tone: .62 * K, dry: .55, wet: .15, prof: 'nail', nb: 5 }); }
    // 5. the flame tuft at the tail tip
    const tip = P[n - 1], td = [P[n - 1][0] - P[n - 3][0], P[n - 1][1] - P[n - 3][1]], tl = Math.hypot(td[0], td[1]) || 1, tdx = td[0] / tl, tdy = td[1] / tl, tnx = -tdy, tny = tdx;
    for (let j = 0; j < 7; j++) { const sp = (j - 3) * .36, L = (16 + 10 * (1 - Math.abs(j - 3) / 3)) * hs, dx = tdx * Math.cos(sp) - tdy * Math.sin(sp), dy = tdx * Math.sin(sp) + tdy * Math.cos(sp), curlk = (j - 3) * .45 * hs; St([[tip[0] - tdx * 3 * hs, tip[1] - tdy * 3 * hs], [tip[0] + dx * L * .45 + drift[0] * .3, tip[1] + dy * L * .45 + drift[1] * .3], [tip[0] + dx * L + tnx * curlk * 6 + drift[0] * .8 + wav(j) * 1.5, tip[1] + dy * L + tny * curlk * 6 + drift[1] * .8]], { w: (3.4 - .3 * Math.abs(j - 3)) * hs, tone: .74 * K, dry: .66, wet: .15, prof: 'tip' }); }
    // 6. legs: four small clawed legs (upper + lower), tucked when flying
    const legK = clamp(S.legs);
    for (const [uL, bend, phase] of [[.13, 1, 0], [.17, 1, Math.PI], [.52, -1, Math.PI], [.56, -1, 0]]) {
      const k = Math.round(uL * (n - 1)), hw = w0 * WID(uL, S) / 2, hip = up(k, hw * .5);
      const l1 = w0 * .8, l2 = w0 * .78;
      const walk = S.gait ? Math.sin(S.gait + phase) : 0, lift = S.gait ? Math.max(0, Math.cos(S.gait + phase)) * w0 * .25 : 0;
      const standFoot = [hip[0] + (bend > 0 ? 5 : -4) * hs + walk * S.stride, S.ground * hs - lift];
      const tuckFoot = [hip[0] - 5 * hs + (bend > 0 ? 0 : -3 * hs), hip[1] + l1 * .8];
      const foot = [lerp(tuckFoot[0], standFoot[0], legK), lerp(tuckFoot[1], standFoot[1], legK)];
      const [h, kn, f] = ik(hip, foot, l1, l2, bend);
      const far = phase > 1, tone = (far ? .3 : .82) * K;
      St([h, kn], { w: 5 * hs, tone, darkDir: [bend, 0], side: .8, brWet: !far, body: .3, dry: .42, wet: .6, prof: 'press' }); St([kn, f], { w: 3 * hs, tone, dry: .45, wet: .15, prof: 'even' });
      for (let c = 0; c < 3; c++) { const an = -.7 + c * .55 + (legK < .5 ? 1.0 : .05); St([[f[0] - 1 * hs, f[1]], [f[0] + Math.cos(an) * 4.8 * hs, f[1] + Math.sin(an) * 4.8 * hs]], { w: 2 * hs, tone: .92 * K * (far ? .4 : 1), dry: .3, prof: 'nail' }); }
    }
    // 7. head: a rounded skull running into a long snout; local head frame at the neck, forward +x, tilted
    const ht = S.headTilt, hs0 = hs * .72, Hh = q => rot([q[0] * hs0, q[1] * hs0], [0, 0], ht);
    const headPoly = [[-9, -9], [-4, -14], [5, -16], [14, -14.5], [22, -11.5], [29, -8.5], [35, -5.5], [38, -2], [37, 1.5], [31, 3.5], [22, 4.5], [12, 5.5], [2, 6], [-6, 4.5], [-10, 0]].map(Hh);
    M(headPoly, .64 * K, .6);
    if (Ex.puff > .05) M([[8, -2], [16, -6], [24, -3], [26, 4], [18, 8], [9, 7]].map(q => Hh([q[0] + 2, q[1] + 2 * Ex.puff])), .3 * K * Ex.puff, .5);
    St([Hh([-7, -11]), Hh([5, -16.5]), Hh([18, -14]), Hh([30, -8.5]), Hh([38, -2.5])], { w: 4.6 * hs, tone: .9 * K, darkDir: [0, -1], side: .8, brWet: true, body: .3, dry: .36, wet: .8, prof: 'brush' });   // skull and snout top
    St([Hh([-10, 0]), Hh([-7, 5]), Hh([0, 7])], { w: 3 * hs, tone: .78 * K, darkDir: [-1, 0], side: .8, brWet: true, body: .25, dry: .4, wet: .7, prof: 'tip' });   // back of the cheek
    St([Hh([29, -8]), Hh([33, -9.5]), Hh([36, -7])], { w: 2.4 * hs, tone: .85 * K, dry: .3, prof: 'lens' });   // nose bump
    St([Hh([34.5, -6.5]), Hh([36, -5.2])], { w: 2.2 * hs, tone: .92 * K, dry: .2, prof: 'dot' });            // nostril
    // the mouth: lower jaw hinged at (6, 4); corners curl with the smile; open mouth is paper cut from the head with the jaw below
    const mo = Ex.mouth, jawP = Hh([6, 4]);
    const J = q => rot(Hh(q), jawP, mo * .75);
    const smileY = -Ex.smile * 2.2;
    list.push({ jaw: { pts: [J([6, 4]), J([14, 8]), J([24, 8.5]), J([32, 6]), J([37, 2])], mo, K } });
    St([J([5, 4]), J([14, 8.4]), J([24, 8.8]), J([33, 6]), J([37.5, 2])], { w: 3.2 * hs, tone: .86 * K, darkDir: [0, 1], side: .8, brWet: true, body: .3, dry: .4, wet: .6, prof: 'nail' });   // jaw line
    St([Hh([2, 3.5 + smileY * .3]), Hh([6, 4]), Hh([12, 4.2 - smileY])], { w: 1.8 * hs, tone: .8 * K, dry: .4, prof: 'tip' });                                             // mouth corner
    if (mo > .08) list.push({ hole: [Hh([10, 2.5]), Hh([36, 0]), J([36, 1.5]), J([12, 6.5])], a: clamp(mo * 1.5), teeth: mo > .6 ? [Hh([30, 1]), Hh([24, 2]), Hh([18, 3])] : null, tongue: mo > .35 ? [J([14, 5]), J([22, 5.5])] : null });
    // beard tufts
    for (let j = 0; j < 3; j++) St([J([10 + j * 4, 9]), J([6 + j * 3.5, 15 + j * .6 + Ex.whisk * -1.5])], { w: 2 * hs, tone: .7 * K, dry: .6, prof: 'tip' });
    // horns: two branched antlers sweeping back
    for (const [ox, oy, L] of [[2, -15, 1], [9, -15.5, .85]]) {
      St([Hh([ox, oy]), Hh([ox - 6, oy - 9 * L]), Hh([ox - 15, oy - 15 * L]), Hh([ox - 24, oy - 17 * L])], { w: 3.2 * hs, tone: .9 * K, dry: .38, wet: .2, prof: 'nail' });
      St([Hh([ox - 6, oy - 9 * L]), Hh([ox - 8, oy - 17 * L])], { w: 2.2 * hs, tone: .8 * K, dry: .5, prof: 'nail' });
      St([Hh([ox - 15, oy - 15 * L]), Hh([ox - 19, oy - 23 * L])], { w: 1.8 * hs, tone: .75 * K, dry: .55, prof: 'nail' });
    }
    // whiskers: two long waving whiskers from the snout; they rise, droop or stream back with the mood, the wind and the motion
    for (const [sgn, L, ph] of [[-1, 52, 0], [1, 46, 1.7]]) {
      const w1 = Hh([36, sgn < 0 ? -4 : 1]);
      const lift = Ex.whisk * (sgn < 0 ? -14 : -8) - 4 * sgn, sway = wav(ph) * 2.5;
      St([w1, Hh([36 + L * .35 + drift[0] * .3, (sgn * 3) + lift * .35 + sway * .3 + drift[1] * .25]), Hh([36 + L * .7 + drift[0] * .7, (sgn * 7) + lift * .8 + sway * .8 + drift[1] * .6]), Hh([36 + L + drift[0], (sgn * 10) + lift + sway * 1.4 + drift[1]])], { w: 1.7 * hs, tone: .8 * K, dry: .42, prof: 'tip', nb: 4, gapLen: 60 });
    }
    // mane: a brush of dry strokes streaming back from the crown and neck, bristling (raised) with the mood
    const nd = [P[2][0] - P[0][0], P[2][1] - P[0][1]], nl = Math.hypot(nd[0], nd[1]) || 1, bx = nd[0] / nl, by = nd[1] / nl;   // the neck direction (backwards)
    for (let j = 0; j < 7; j++) {
      const b = Hh([-5 - j * 1.2, -14 + j * 3.2]), L = (17 + 6 * Math.sin(j * 1.9)) * hs, raise = Ex.mane * (-.6 + j * .06) - .15 + j * .04;
      const dxm = bx * Math.cos(raise) - by * Math.sin(raise), dym = bx * Math.sin(raise) + by * Math.cos(raise), sw = wav(j * .8) * 2 * hs;
      St([b, [b[0] + dxm * L * .5 + drift[0] * .4, b[1] + dym * L * .5 - 2 * hs + sw * .5 + drift[1] * .3], [b[0] + dxm * L + drift[0] * .9, b[1] + dym * L + sw + drift[1] * .8]], { w: 3.2 * hs, tone: .56 * K, dry: .66, wet: .12, prof: 'tip' });
    }
    // 8. eye: a paper hole, lids, the brow, the vermilion pupil (last: 点睛)
    const ec = Hh([13, -6]), er = 4.6 * hs * (Ex.eye || 1);
    const browC = Hh([12, -13.5 - Ex.browY * 2.6]);
    const B = q => rot(q, browC, Ex.brow * .8);
    St([B(Hh([4, -12.5 - Ex.browY * 2.6])), B(Hh([12, -14.2 - Ex.browY * 2.6])), B(Hh([21, -12 - Ex.browY * 2.6]))], { w: 4 * hs, tone: .94 * K, dry: .3, wet: .15, prof: 'nail' });
    list.push({ eye: { c: ec, r: er, lid: Ex.lid, lidBot: Ex.lidBot || 0, smile: Ex.smile || 0, tilt: ht, k: K, pupil: Ex.pupil || [0, 0], pr: Ex.pupilR || 1 } });
  }

  // ---- paint into T in order, then paste on A ----
  const Tw = T.ink.wet, Td = T.ink.dry;
  for (const c of [Tw, Td]) { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.clearRect(0, 0, T.wet.width, T.wet.height); c.restore(); }
  const xf = A.ink.dry.getTransform(); Tw.setTransform(xf); Td.setTransform(xf);
  const Nn = list.length, rotA = S.a * dir + (S.headTilt || 0) * dir;
  const polyPath = (c, pts) => { c.beginPath(); pts.forEach((q, j) => j ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.closePath(); };
  for (let i = 0; i < Nn; i++) {
    const it = list[i], pi = p >= 1 ? 1 : clamp((p - i / Nn * .85) / .2);
    if (pi <= 0) continue;
    if (it.s) draw(T.ink, it.s, pi, am);
    else if (it.m) { mass(Tw, it.m, it.a * am * pi, it.jit, it.seed); if (it.dryToo) mass(Td, it.m, it.dryToo * am * pi, .8, 7); }
    else if (it.jaw) { if (it.mo > .08) { const q = it.jaw.pts.map(T2); mass(Tw, [...q, T2([30, 0]), T2([12, 2])], .55 * it.K * am * pi, .4, 9); } }
    else if (it.hole) {
      const hp = it.hole.map(T2);
      for (const c of [Tw, Td]) { c.save(); c.globalCompositeOperation = 'destination-out'; c.globalAlpha = clamp(it.a) * pi; polyPath(c, hp); c.fill(); c.restore(); }
      if (it.tongue) { const tq = it.tongue.map(T2); Tw.save(); Tw.globalAlpha = .55 * pi; Tw.strokeStyle = '#000'; Tw.lineWidth = 3.2 * hs * sc; Tw.lineCap = 'round'; Tw.beginPath(); Tw.moveTo(tq[0][0], tq[0][1]); Tw.lineTo(tq[1][0], tq[1][1]); Tw.stroke(); Tw.restore(); }
      if (it.teeth) for (const q of it.teeth) { const tp = T2(q); Td.save(); Td.globalAlpha = .85 * pi; Td.fillStyle = '#000'; Td.beginPath(); Td.moveTo(tp[0] - 1.6 * hs * sc, tp[1] - 1.2 * hs * sc); Td.lineTo(tp[0] + 1.6 * hs * sc, tp[1] - 1.2 * hs * sc); Td.lineTo(tp[0], tp[1] + 2.6 * hs * sc); Td.closePath(); Td.fill(); Td.restore(); }
    }
    else if (it.eye) {
      const e = it.eye, [cx, cy] = e.c, r = e.r * sc * st, rl = e.r * sc * .82 * Math.abs(S.squash) / st;
      const sx = x0 + (cx * st * ca - cy * S.squash / st * sa) * sc * dir, sy = y0 + (cx * st * sa + cy * S.squash / st * ca) * sc;
      const lid = clamp(e.lid), lidB = clamp(e.lidBot);
      const happyClosed = e.smile > .5 && lid > .9;
      if (!happyClosed) {
        for (const c of [Tw, Td]) { c.save(); c.globalCompositeOperation = 'destination-out'; c.globalAlpha = .94 * pi; c.beginPath(); c.ellipse(sx, sy, r, rl, rotA, 0, 7); c.fill(); c.restore(); }
        const ly = -rl + 2 * rl * lid, lyB = rl - 2 * rl * lidB;
        for (const [c, a] of [[Td, .8], [Tw, .5]]) {
          c.save(); c.translate(sx, sy); c.rotate(rotA); c.beginPath(); c.ellipse(0, 0, r, rl, 0, 0, 7); c.clip(); c.fillStyle = `rgba(0,0,0,${a * pi * e.k})`;
          if (lid > .02) c.fillRect(-r - 1, -rl - 1, 2 * r + 2, ly + rl + 1);
          if (lidB > .02) c.fillRect(-r - 1, lyB, 2 * r + 2, rl - lyB + 1);
          c.restore();
        }
        Td.save(); Td.translate(sx, sy); Td.rotate(rotA); Td.strokeStyle = '#000'; Td.globalAlpha = .9 * pi * e.k; Td.lineWidth = Math.max(1, r * .2); Td.lineCap = 'round';
        if (lid > .02) { const hw = Math.sqrt(Math.max(0, 1 - (ly / rl) * (ly / rl))) * r; Td.beginPath(); Td.moveTo(-hw, ly); Td.lineTo(hw, ly); Td.stroke(); }
        if (lidB > .02) { const hw = Math.sqrt(Math.max(0, 1 - (lyB / rl) * (lyB / rl))) * r; Td.beginPath(); Td.moveTo(-hw, lyB); Td.lineTo(hw, lyB); Td.stroke(); }
        Td.restore();
        if (eyeK > 0 && lid < .92) {   // the vermilion pupil (colour layer of A, same transform)
          const pr = Math.max(r * .4 * e.pr, 1.6), c = A.cc; c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = clamp(eyeK * am * .96);
          const lx = sx + (e.pupil[0] * r * .32 * dir), lyy = sy + (e.pupil[1] * rl * .32), pt = new DOMPoint(lx, lyy).matrixTransform(xf), prs = pr * xf.a;
          c.fillStyle = `rgb(${VERM.join(',')})`; c.beginPath(); c.ellipse(pt.x, pt.y, prs, prs * .92, 0, 0, 7); c.fill(); c.restore();
        }
      } else {   // happy: a closed eye drawn as one upward arc
        Td.save(); Td.translate(sx, sy); Td.rotate(rotA); Td.strokeStyle = '#000'; Td.globalAlpha = .9 * pi * e.k; Td.lineWidth = Math.max(1.2, r * .22); Td.lineCap = 'round'; Td.beginPath(); Td.arc(0, rl * .5, r * .95, Math.PI * 1.12, Math.PI * 1.88); Td.stroke(); Td.restore();
      }
    }
  }
  for (const k of ['wet', 'dry']) { const c = A.ink[k]; c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(T[k], 0, 0); c.restore(); }
  Tw.setTransform(1, 0, 0, 1, 0, 0); Td.setTransform(1, 0, 0, 1, 0, 0);
  const snout = T2(rot([38 * hs, -2 * hs], [0, 0], S.headTilt)), tail = T2(P[n - 1]), eye = T2(rot([13 * hs, -6 * hs], [0, 0], S.headTilt));
  return { neck: T2([0, 0]), snout, tail, eye, spine: P.map(T2) };
}

// splatter: a ball of wet ticks around a point
export function splatter(A, x, y, R, u, seed = 1, nMax = 14, am = 1) {
  if (u <= 0) return;
  const c = A.ink.wet, d = A.ink.dry;
  for (let i = 0; i < nMax; i++) {
    const an = vnoise(seed * 7 + i * 1.3) * Math.PI * 2, dist = R * (.3 + .9 * vnoise(seed * 3 + i * 2.1)) * Math.pow(clamp(u), .6);
    const r = (1.2 + 3.5 * vnoise(i * 5.7 + seed)) * (1 - u * .3);
    blot(vnoise(i) > .5 ? c : d, x + Math.cos(an) * dist, y + Math.sin(an) * dist * .8, r, .6 * am * (1 - clamp(u) * .5), an, .7, seed + i);
  }
}
