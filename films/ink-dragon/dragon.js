// 墨龙: the ink dragon rig. Local units: body length `len` (default 100) from neck to tail tip, y down, facing +x; the caller places it with X {x, y, s, dir}.
// One pale mass (淡) is the body; two loaded strokes (back and belly) carry its contour; mane, ridge and tail tuft are dry flying-white; head in dark ink with
// the one vermilion eye left as paper and dotted red (画龙点睛). The dragon is drawn into a scratch layer T first (so the eye can be cut out of the head
// without erasing the scene) and then pasted onto the picture A.
import { mk, draw, mass, blot, TONE } from './ink.js';
import { lerp, clamp, vnoise, VERM, rot, add2, mid } from './util.js';

// Expressions. brow: + = front end down (angry), − = front end up (worried/curious); lid 0 open … 1 closed; smile: closed lid drawn as an upward arc
export const EXPR = {
  neutral: { brow: 0, lid: .12, eye: 1, mouth: 0, puff: 0, smile: 0 },
  curious: { brow: -.3, lid: 0, eye: 1.15, mouth: .08, puff: 0, smile: 0 },
  worried: { brow: -.5, lid: .22, eye: 1, mouth: .05, puff: 0, smile: 0 },
  angry: { brow: .45, lid: .3, eye: .9, mouth: .35, puff: 0, smile: 0 },
  determined: { brow: .28, lid: .4, eye: .92, mouth: 0, puff: 0, smile: 0 },
  shocked: { brow: -.55, lid: 0, eye: 1.35, mouth: .55, puff: 0, smile: 0 },
  sleepy: { brow: .05, lid: .92, eye: 1, mouth: 0, puff: 0, smile: 0 },
  effort: { brow: .4, lid: .72, eye: .9, mouth: .45, puff: 0, smile: 0 },
  happy: { brow: -.15, lid: 1, eye: 1, mouth: .25, puff: 0, smile: 1 },
  puffed: { brow: .3, lid: .25, eye: .9, mouth: 0, puff: 1, smile: 0 },
  roar: { brow: .5, lid: .2, eye: 1, mouth: 1, puff: .4, smile: 0 },
  dizzy: { brow: -.2, lid: .6, eye: 1.1, mouth: .3, puff: 0, smile: 0 },
  closed: { brow: 0, lid: 1, eye: 1, mouth: 0, puff: 0, smile: 0 },
};
export function mixExpr(a, b, u) { const o = {}; for (const k in a) o[k] = lerp(a[k], b[k], clamp(u)); return o; }

// Default state
export const DEF = {
  a: 0,            // heading (radians, 0 = facing +x, y down so negative = nose up)
  len: 100, amp: 9, k: 1.1, ph: 0, curl: 0, taper: 1,
  legs: 0,         // 0 flying (tucked) … 1 standing
  ground: 14,      // y of the feet below the neck when standing (local)
  gait: 0,         // walking phase (radians); 0 = standing still
  stride: 7,
  headTilt: 0,     // extra head rotation (− = nose up)
  expr: EXPR.neutral,
  wind: [0, 0],    // mane / whisker drift (local)
  tailUp: 0,       // extra lift of the tail tip
  blotR: 0,        // birth morph: 1 = a round blot, 0 = the body
  squash: 1,       // vertical squash (landing on the head, etc.)
};

// Spine: n points from the neck backwards. Returns {P, N, u} in local coords (neck at origin).
export function spine(S) {
  const n = 15, P = [], N = [], ds = S.len / (n - 1);
  let x = 0, y = 0, a = Math.PI;                              // walk backwards from the neck
  const curlStep = S.curl * Math.PI * 2 / (n - 1);
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1);
    const env = Math.sin(Math.PI * Math.min(1, u * 1.15)) * .6 + .4 * u;
    const off = S.amp * Math.sin(S.k * u * Math.PI * 2 + S.ph) * env - S.tailUp * u * u * 20;
    P.push([x + off * Math.sin(a), y - off * Math.cos(a)]);   // wave perpendicular to the local body direction
    x += ds * Math.cos(a); y += ds * Math.sin(a);
    a += curlStep * (u < .1 ? u * 10 : 1);
  }
  // rotate the whole spine for the curl (keeps the neck at the origin) and compute normals
  for (let i = 0; i < n; i++) {
    const p0 = P[Math.max(0, i - 1)], p1 = P[Math.min(n - 1, i + 1)], dx = p1[0] - p0[0], dy = p1[1] - p0[1], L = Math.hypot(dx, dy) || 1;
    N.push([dy / L, -dx / L]);                              // "up" side of the body (towards -y for a straight body heading +x)
  }
  for (const nn of N) if (nn[1] > 0) { nn[0] = -nn[0]; nn[1] = -nn[1]; }
  return { P, N, n };
}
// width profile along the body (0 neck → 1 tail tip), in units of w0
const WID = (u, S) => {
  const puff = 1 + .55 * (S.expr.puff || 0) * Math.exp(-Math.pow((u - .2) / .16, 2));
  const base = u < .15 ? lerp(.8, 1, u / .15) : u < .5 ? lerp(1, .82, (u - .15) / .35) : lerp(.82, .07, Math.pow((u - .5) / .5, 1.15 * S.taper));
  return base * puff;
};

// 2-bone IK: hip → foot with segment lengths l1, l2; bend = ±1 chooses the knee side
function ik(hip, foot, l1, l2, bend) {
  const dx = foot[0] - hip[0], dy = foot[1] - hip[1], d = Math.min(Math.hypot(dx, dy), l1 + l2 - .01);
  const a0 = Math.atan2(dy, dx), cosA = clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1), a1 = Math.acos(cosA) * bend;
  const knee = [hip[0] + Math.cos(a0 + a1) * l1, hip[1] + Math.sin(a0 + a1) * l1];
  const f = [hip[0] + dx * d / (Math.hypot(dx, dy) || 1), hip[1] + dy * d / (Math.hypot(dx, dy) || 1)];
  return [hip, knee, f];
}

// Draw. A: picture layers (A.ink wet/dry contexts with the camera transform set, A.cc colour ctx with the same transform); T: scratch layer set (same size as A).
// X: {x, y, s, dir, t, am, p (strokes painted in 0..1), eye (0..1 the vermilion dot), seed}
export function dragon(A, T, S0, X = {}) {
  const S = { ...DEF, ...S0 }, x0 = X.x ?? 0, y0 = X.y ?? 0, sc = X.s ?? 1, dir = X.dir ?? 1, am = X.am ?? 1, p = X.p ?? 1, eyeK = X.eye ?? 1;
  const ca = Math.cos(S.a), sa = Math.sin(S.a);
  // local → world (heading rotation, mirror, scale, squash)
  const T2 = q => { const lx = q[0], ly = q[1] * S.squash; return [x0 + (lx * ca - ly * sa) * sc * dir, y0 + (lx * sa + ly * ca) * sc, q[2] ?? 1]; };
  const list = []; let idx = 0;
  const seedBase = (X.seed ?? 5) * 1000;
  const St = (pts, o) => {   // a stroke (local points)
    const oo = { ...o, w: o.w * sc, seed: seedBase + (idx++) * 97, gapLen: (o.gapLen ?? 40) * sc, boil: X.boil ? (Math.floor(X.boil) % 5) : 0 };
    if (o.darkDir) { const d = o.darkDir; oo.darkDir = [(d[0] * ca - d[1] * sa) * dir, d[0] * sa + d[1] * ca]; }
    list.push({ s: mk(pts.map(T2), oo) });
  };
  const M = (poly, a, jit = .6) => list.push({ m: poly.map(T2), a, jit: jit * sc, seed: idx++ });
  const w0 = S.len * .3, { P, N } = spine(S), n = P.length;
  const up = (i, k) => add2(P[i], [N[i][0] * k, N[i][1] * k]);

  // 1. body mass (淡), morphing from the birth blot when blotR > 0
  const top = [], bot = [];
  for (let i = 0; i < n; i++) { const u = i / (n - 1), hw = w0 * WID(u, S) / 2; top.push(up(i, -hw)); bot.push(up(i, hw)); }
  let poly = [...top, ...bot.reverse()];
  if (S.blotR > 0) {
    const c = [S.len * .18, 2], r = w0 * 1.9, m = poly.length;
    poly = poly.map((q, i) => { const an = (i / m) * Math.PI * 2 + .3, bq = [c[0] + Math.cos(an) * r * (1 + .1 * vnoise(i * .9 + 3)), c[1] + Math.sin(an) * r * .85]; return [lerp(q[0], bq[0], S.blotR), lerp(q[1], bq[1], S.blotR)]; });
  }
  M(poly, .4 + .35 * S.blotR, 1.2);
  if (S.blotR > 0) list.push({ md: poly, a: .5 * S.blotR });
  const K = 1 - S.blotR;    // strokes fade in as the blot becomes a dragon
  if (K > .02) {
    // 2. back stroke (浓, dark edge on the back) and 3. belly stroke (重)
    const back = [], belly = [];
    for (let i = 0; i < n; i++) { const u = i / (n - 1), hw = w0 * WID(u, S) / 2; back.push([...up(i, -hw * .62), WID(u, S) * 1.1]); belly.push([...up(i, hw * .62), WID(u, S)]); }
    St(back, { w: w0 * .58, tone: .84 * K, darkDir: [0, -1], side: .85, brWet: true, body: .24, dry: .38, wet: .9, prof: 'robe', nb: 26, rough: .1 });
    St(belly.slice(0, 11), { w: w0 * .34, tone: .58 * K, darkDir: [0, 1], side: .8, brWet: true, body: .18, dry: .5, wet: .9, prof: 'robe', nb: 16 });
    // 4. dorsal ridge: small dry teeth along the back
    for (let j = 0; j < 7; j++) { const k = 2 + j * 1.5 | 0, u = k / (n - 1), hw = w0 * WID(u, S) / 2, b = up(k, -hw * .96), L = (2.6 + 1.8 * (1 - u)) * S.len / 100, tipx = [b[0] + N[k][0] * L - 2.2, b[1] + N[k][1] * L]; St([add2(b, [1.6, 0]), tipx], { w: 2.2 * S.len / 100, tone: .62 * K, dry: .5, wet: .2, prof: 'nail' }); }
    // 5. belly scales: three short arcs
    for (let j = 0; j < 4; j++) { const k = 2 + j * 2, u = k / (n - 1), hw = w0 * WID(u, S) / 2, c = up(k, hw * .6), r = hw * .5; St([add2(c, [-r, -r * .5]), add2(c, [0, r * .3]), add2(c, [r, -r * .5])], { w: 1.6 * S.len / 100, tone: .45 * K, dry: .6, prof: 'tip' }); }
    // 6. tail tuft
    const tip = P[n - 1], td = [P[n - 1][0] - P[n - 3][0], P[n - 1][1] - P[n - 3][1]], tl = Math.hypot(td[0], td[1]) || 1, tdx = td[0] / tl, tdy = td[1] / tl;
    for (let j = 0; j < 5; j++) { const sp = (j - 2) * .34, L = 15 + 5 * (1 - Math.abs(j - 2) / 2), dx = tdx * Math.cos(sp) - tdy * Math.sin(sp), dy = tdx * Math.sin(sp) + tdy * Math.cos(sp); St([[tip[0] - tdx * 4, tip[1] - tdy * 4], [tip[0] + dx * L * .5 + S.wind[0] * .3, tip[1] + dy * L * .5 + S.wind[1] * .3], [tip[0] + dx * L + S.wind[0] * .8, tip[1] + dy * L + S.wind[1] * .8]], { w: 3.4 * S.len / 100, tone: .72 * K, dry: .66, wet: .15, prof: 'tip' }); }
    // 7. legs (burnt-ink lines, three claws), only when legs > 0; tucked when flying
    const legK = clamp(S.legs);
    for (const [uL, bend, phase] of [[.17, 1, 0], [.21, 1, Math.PI], [.6, -1, Math.PI], [.64, -1, 0]]) {
      const k = Math.round(uL * (n - 1)), hw = w0 * WID(uL, S) / 2, hip = up(k, hw * .55);
      const l1 = w0 * .5, l2 = w0 * .5;
      const walk = S.gait ? Math.sin(S.gait + phase) : 0, lift = S.gait ? Math.max(0, Math.cos(S.gait + phase)) * w0 * .18 : 0;
      const standFoot = [hip[0] + (bend > 0 ? 4 : -3) * S.len / 100 + walk * S.stride, S.ground * S.len / 100 - lift];
      const tuckFoot = [hip[0] - 4 + (bend > 0 ? 0 : -3), hip[1] + l1 * .7];
      const foot = [lerp(tuckFoot[0], standFoot[0], legK), lerp(tuckFoot[1], standFoot[1], legK)];
      const [h, kn, f] = ik(hip, foot, l1, l2, bend);
      const tone = (.86 - (phase > 1 ? .18 : 0)) * K;   // the far leg paler
      St([h, kn, f], { w: 3.4 * S.len / 100, tone, dry: .4, wet: .15, prof: 'even' });
      for (let c = 0; c < 3; c++) { const an = -.55 + c * .5 + (legK < .5 ? 1.0 : .1); St([f, [f[0] + Math.cos(an) * 4.6 * S.len / 100, f[1] + Math.sin(an) * 4.6 * S.len / 100]], { w: 1.8 * S.len / 100, tone: .9 * K, dry: .3, prof: 'nail' }); }
    }
    // 8. head (local head frame at the neck, forward +x, tilted): a big round skull with a short snout, cute proportions (head ≈ 1/3 of the body)
    const ht = S.headTilt, hc = [0, 0];
    const hs = S.len / 100;
    const Hh = q => rot([q[0] * hs, q[1] * hs], hc, ht);
    const headPoly = [[-7, -9], [-3, -14], [5, -16.5], [14, -16], [21, -13], [27, -8], [30, -2], [28.5, 4], [24, 8.5], [15, 11], [4, 11], [-4, 8], [-8, 1]].map(Hh);
    M(headPoly, .64 * K, .6);
    St([Hh([-5, -11]), Hh([6, -16]), Hh([18, -14.5]), Hh([27, -8.5]), Hh([30, -2])], { w: 5 * hs, tone: .9 * K, darkDir: [0, -1], side: .8, brWet: true, body: .3, dry: .36, wet: .8, prof: 'brush' });   // skull / snout top
    St([Hh([-8, 0]), Hh([-5, 7]), Hh([2, 11])], { w: 3.2 * hs, tone: .8 * K, darkDir: [-1, 0], side: .8, brWet: true, body: .25, dry: .4, wet: .7, prof: 'tip' });   // cheek
    // lower jaw (rotates open about the jaw hinge)
    const jawP = Hh([4, 9.5]), mo = S.expr.mouth || 0;
    const J = q => rot(Hh(q), jawP, mo * .5);
    St([J([2, 10.5]), J([14, 11.5]), J([25, 8.5]), J([28.5, 4.5])], { w: 3.4 * hs, tone: .86 * K, dry: .4, wet: .2, prof: 'nail' });
    if (mo > .05) { list.push({ hole: [J([8, 6]), Hh([28, 2]), J([28, 6.5]), J([8, 9.5])], a: mo }); St([J([10, 8.5]), J([18, 9.2])], { w: 2.4 * hs, color: VERM, tone: .8 * mo * K, dry: .3, prof: 'lens', nb: 4 }); }
    // beard tufts under the jaw
    for (let j = 0; j < 3; j++) St([J([8 + j * 3.5, 11]), J([5 + j * 3, 17 + j * .8])], { w: 2 * hs, tone: .7 * K, dry: .6, prof: 'tip' });
    // horns: two branched antlers sweeping back from the crown
    for (const [ox, oy, L] of [[4, -15.5, 1], [10, -16, .85]]) {
      St([Hh([ox, oy]), Hh([ox - 7, oy - 9 * L]), Hh([ox - 17, oy - 15 * L])], { w: 3.2 * hs, tone: .9 * K, dry: .38, wet: .2, prof: 'nail' });
      St([Hh([ox - 7, oy - 9 * L]), Hh([ox - 10, oy - 18 * L])], { w: 2.2 * hs, tone: .8 * K, dry: .5, prof: 'nail' });
    }
    // nostril and whiskers
    St([Hh([26.5, -7.5]), Hh([28, -6.2])], { w: 2.4 * hs, tone: .9 * K, dry: .2, prof: 'dot' });
    const wv = Math.sin((X.t ?? 0) * 3.1) * 1.5;
    for (const [sgn, L] of [[-1, 30], [1, 26]]) {
      const w1 = Hh([29, sgn < 0 ? -3.5 : 1.5]);
      St([w1, Hh([29 + L * .45 + S.wind[0] * .4, sgn * 6 + wv * .6 + S.wind[1] * .3]), Hh([29 + L + S.wind[0], sgn * 11 + wv + S.wind[1] * .8])], { w: 1.6 * hs, tone: .78 * K, dry: .45, prof: 'tip', nb: 4 });
    }
    // mane: dry flame-like strokes streaming back from behind the head
    for (let j = 0; j < 6; j++) { const b = Hh([-4 - j * .8, -12 + j * 3.6]), L = (22 + 5 * Math.sin(j * 1.7)) * hs; St([b, [b[0] - L * .5 + S.wind[0] * .5, b[1] - 4 * hs + Math.sin(j) * 2.5 * hs + S.wind[1] * .4], [b[0] - L + S.wind[0], b[1] - 1.5 * hs + Math.sin(j * 2.3) * 4 * hs + S.wind[1]]], { w: 4 * hs, tone: .72 * K, dry: .64, wet: .15, prof: 'tip' }); }
    // 9. eye: a paper hole in the head, the lid, the brow, and the vermilion dot (drawn last: 点睛)
    const E = S.expr, ec = Hh([14.5, -5.5]), er = 6.2 * hs * (E.eye || 1);
    const browC = Hh([13, -13]);
    const B = q => rot(q, browC, E.brow * .9);
    St([B(Hh([6, -12.5])), B(Hh([13, -14])), B(Hh([21, -12]))], { w: 4.2 * hs, tone: .94 * K, dry: .3, wet: .15, prof: 'nail' });
    list.push({ eye: { c: ec, r: er, lid: E.lid, smile: E.smile || 0, tilt: ht, k: K } });
  }

  // ---- paint: strokes in order into T, then paste T on A ----
  const Tw = T.ink.wet, Td = T.ink.dry;
  for (const c of [Tw, Td]) { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.clearRect(0, 0, T.wet.width, T.wet.height); c.restore(); }
  const xf = A.ink.dry.getTransform(); Tw.setTransform(xf); Td.setTransform(xf);
  const Nn = list.length;
  for (let i = 0; i < Nn; i++) {
    const it = list[i], pi = p >= 1 ? 1 : clamp((p - i / Nn * .85) / .2);
    if (pi <= 0) continue;
    if (it.s) draw(T.ink, it.s, pi, am);
    else if (it.m) mass(Tw, it.m, it.a * am * pi, it.jit, it.seed);
    else if (it.md) mass(Td, it.md, it.a * am * pi, .8, 7);
    else if (it.hole) { for (const c of [Tw, Td]) { c.save(); c.globalCompositeOperation = 'destination-out'; c.globalAlpha = clamp(it.a * 1.2); c.beginPath(); it.hole.forEach((q, j) => j ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.closePath(); c.fill(); c.restore(); } }
    else if (it.eye) {
      const e = it.eye, [cx, cy] = e.c, r = e.r * sc, rl = r * .78 * Math.abs(S.squash);
      const sx = x0 + (cx * ca - cy * S.squash * sa) * sc * dir, sy = y0 + (cx * sa + cy * S.squash * ca) * sc;
      // white of the eye: paper
      for (const c of [Tw, Td]) { c.save(); c.globalCompositeOperation = 'destination-out'; c.globalAlpha = .92 * pi; c.beginPath(); c.ellipse(sx, sy, r, rl, S.a * dir + e.tilt, 0, 7); c.fill(); c.restore(); }
      // lid: ink covering the top part of the eye
      const lid = clamp(e.lid), ly = -rl + 2 * rl * lid;
      if (lid > .02) {
        Td.save(); Td.translate(sx, sy); Td.rotate(S.a * dir + e.tilt); Td.beginPath(); Td.ellipse(0, 0, r, rl, 0, 0, 7); Td.clip();
        Td.fillStyle = `rgba(0,0,0,${.78 * pi * e.k})`; Td.fillRect(-r - 1, -rl - 1, 2 * r + 2, ly + rl + 1);
        Td.restore();
        Tw.save(); Tw.translate(sx, sy); Tw.rotate(S.a * dir + e.tilt); Tw.beginPath(); Tw.ellipse(0, 0, r, rl, 0, 0, 7); Tw.clip();
        Tw.fillStyle = `rgba(0,0,0,${.5 * pi * e.k})`; Tw.fillRect(-r - 1, -rl - 1, 2 * r + 2, ly + rl + 1); Tw.restore();
        // lid line
        Td.save(); Td.translate(sx, sy); Td.rotate(S.a * dir + e.tilt); Td.strokeStyle = '#000'; Td.globalAlpha = .9 * pi * e.k; Td.lineWidth = Math.max(1, r * .22); Td.lineCap = 'round'; Td.beginPath();
        if (e.smile > .5 && lid > .9) Td.arc(0, rl * .6, r * .9, Math.PI * 1.15, Math.PI * 1.85); else { const hw = Math.sqrt(Math.max(0, 1 - (ly / rl) * (ly / rl))) * r; Td.moveTo(-hw, ly); Td.lineTo(hw, ly); }
        Td.stroke(); Td.restore();
      }
      // the vermilion pupil (colour layer of A, which shares the transform)
      if (eyeK > 0 && lid < .9) {
        const pr = Math.max(r * .42, 1.6), c = A.cc; c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = clamp(eyeK * am * .96);
        const [px, py] = (() => { const x = sx + (S.expr.pupil?.[0] || 0) * r * .3, y = sy + (S.expr.pupil?.[1] || 0) * rl * .3; const pt = new DOMPoint(x, y).matrixTransform(xf); return [pt.x, pt.y]; })();
        const prs = pr * xf.a; c.fillStyle = `rgb(${VERM.join(',')})`; c.beginPath(); c.ellipse(px, py, prs, prs * .92, 0, 0, 7); c.fill(); c.restore();
      }
    }
  }
  // paste the scratch layer
  for (const k of ['wet', 'dry']) { const c = A.ink[k]; c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(T[k], 0, 0); c.restore(); }
  Tw.setTransform(1, 0, 0, 1, 0, 0); Td.setTransform(1, 0, 0, 1, 0, 0);
  // return useful world points: neck, snout, tail tip, eye
  const snout = T2(rot([30 * S.len / 100, -2 * S.len / 100], [0, 0], S.headTilt)), tail = T2(P[n - 1]), eye = T2(rot([14 * S.len / 100, -5.5 * S.len / 100], [0, 0], S.headTilt));
  return { neck: T2([0, 0]), snout, tail, eye, spine: P.map(T2) };
}

// A ball of splatter around a point (wet ticks), for the shake and the landing
export function splatter(A, x, y, R, u, seed = 1, nMax = 14, am = 1) {
  if (u <= 0) return;
  const c = A.ink.wet, d = A.ink.dry;
  for (let i = 0; i < nMax; i++) {
    const an = vnoise(seed * 7 + i * 1.3) * Math.PI * 2, dist = R * (.3 + .9 * vnoise(seed * 3 + i * 2.1)) * Math.pow(clamp(u), .6);
    const r = (1.2 + 3.5 * vnoise(i * 5.7 + seed)) * (1 - u * .3);
    blot(vnoise(i) > .5 ? c : d, x + Math.cos(an) * dist, y + Math.sin(an) * dist * .8, r, .6 * am * (1 - clamp(u) * .5), an, .7, seed + i);
  }
}
