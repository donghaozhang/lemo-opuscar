// ---------- characters: a 2.5D rig drawn in brush strokes, in screen space ----------
// A figure is placed in world units (100 px per metre, ground at y = 0, y negative upward, facing dir = +1 right).
// Every frame the pose is solved (two-bone IK for legs and arms), transformed through the camera and painted as
// washes: no outlines, one darker edge stroke per limb is the only "line". Strokes are built under a fixed seed so
// the bristles stay put while the pose moves.

const SKIN = '#e7c6a6', SKIN2 = '#d5a784', SKIN_OLD = '#dfc3a7', PINK = '#d98a7a';
const INKF = '#2b2420', BROWN = '#4a3a2c';

// character sheets: proportions (world px) and colours
const CHARS = {
  he6:  { h: 115, head: 11.5, neck: 4, torso: 33, thigh: 23, shin: 21, uarm: 19, farm: 17, hipW: 9, shW: 10, torsoW: 15, limbW: 6.5, armW: 5, hair: 'pigtails', skin: SKIN, hairCol: '#2e2420', top: '#c8442a', bottom: '#4f6f9a', shoes: '#7a4a3a', legSkin: true, age: 6, girl: true },
  he10: { h: 140, head: 12, neck: 5, torso: 42, thigh: 30, shin: 28, uarm: 23, farm: 21, hipW: 10, shW: 12, torsoW: 17, limbW: 7, armW: 5.5, hair: 'bob', skin: SKIN, hairCol: '#2e2420', top: '#e8e0cc', scarf: '#c8442a', bottom: '#3f5f88', shoes: '#3a3a3a', legSkin: false, age: 10, girl: true },
  he18: { h: 165, head: 12.5, neck: 6, torso: 50, thigh: 40, shin: 38, uarm: 28, farm: 25, hipW: 11, shW: 13, torsoW: 19, limbW: 7.5, armW: 6, hair: 'long', skin: SKIN, hairCol: '#2e2420', top: '#e4dccb', bottom: '#53607a', shoes: '#e2d8c8', legSkin: false, age: 18, girl: true, bag: '#c8442a' },
  he25: { h: 165, head: 12.5, neck: 6, torso: 50, thigh: 40, shin: 38, uarm: 28, farm: 25, hipW: 11, shW: 13, torsoW: 20, limbW: 7.5, armW: 6, hair: 'tied', skin: SKIN, hairCol: '#2e2420', top: '#c8442a', bottom: '#4a4a52', shoes: '#5a4a40', legSkin: false, age: 25, girl: true },
  gp60: { h: 176, head: 13, neck: 7, torso: 56, thigh: 44, shin: 42, uarm: 30, farm: 27, hipW: 12, shW: 15, torsoW: 22, limbW: 8.5, armW: 6.5, hair: 'short', skin: SKIN_OLD, hairCol: '#8d8a84', top: '#e9e3d4', bottom: '#6d6f73', shoes: '#3a3530', legSkin: false, age: 60, stoop: .08, wrinkle: .3 },
  gp64: { h: 174, head: 13, neck: 7, torso: 55, thigh: 44, shin: 42, uarm: 30, farm: 27, hipW: 12, shW: 15, torsoW: 22, limbW: 8.5, armW: 6.5, hair: 'short', skin: SKIN_OLD, hairCol: '#a6a39d', top: '#dcd9cf', bottom: '#5e6166', shoes: '#3a3530', legSkin: false, age: 64, stoop: .14, wrinkle: .5 },
  gp72: { h: 170, head: 13, neck: 7, torso: 54, thigh: 43, shin: 41, uarm: 29, farm: 26, hipW: 12, shW: 15, torsoW: 22, limbW: 8.5, armW: 6.5, hair: 'short', skin: '#d9bea4', hairCol: '#c9c6bf', top: '#8f8a80', bottom: '#4f5157', shoes: '#3a3530', legSkin: false, age: 72, stoop: .22, wrinkle: .75 },
  gp79: { h: 166, head: 13, neck: 7, torso: 53, thigh: 42, shin: 40, uarm: 28, farm: 26, hipW: 12, shW: 15, torsoW: 21, limbW: 8, armW: 6.2, hair: 'short', skin: '#d8bca2', hairCol: '#dcd9d2', top: '#8b8f98', bottom: '#4a4c52', shoes: '#3a3530', legSkin: false, age: 79, stoop: .3, wrinkle: 1 },
};

// expressions: brow (inner end up +1 / down −1), browH (raise), open (lids), smile (−1..1), mouthO (open), cheek, gaze
const EXPR = {
  neutral:  { brow: 0, browH: 0, open: 1, smile: .1, mouthO: 0, cheek: .2, gaze: [0, 0] },
  determined: { brow: -.5, browH: -.2, open: .85, smile: -.1, mouthO: .1, cheek: .3, gaze: [.3, 0] },
  worried:  { brow: .8, browH: .3, open: 1, smile: -.4, mouthO: .25, cheek: .3, gaze: [.1, .2] },
  ouch:     { brow: .4, browH: -.2, open: .15, smile: -.7, mouthO: .6, cheek: .6, gaze: [0, 0] },
  sniff:    { brow: .7, browH: .1, open: .55, smile: -.5, mouthO: .15, cheek: .7, gaze: [0, .3] },
  focus:    { brow: -.2, browH: -.1, open: .8, smile: 0, mouthO: .15, cheek: .3, gaze: [.4, 0] },
  joy:      { brow: .1, browH: .5, open: .55, smile: 1, mouthO: .5, cheek: 1, gaze: [.2, -.1] },
  surprise: { brow: .2, browH: .8, open: 1.2, smile: .2, mouthO: .5, cheek: .3, gaze: [-.5, 0] },
  happy:    { brow: .1, browH: .3, open: .8, smile: .7, mouthO: .15, cheek: .7, gaze: [.3, 0] },
  bitter:   { brow: .5, browH: .2, open: .8, smile: .35, mouthO: 0, cheek: .5, gaze: [-.4, .1] },
  warm:     { brow: .2, browH: .2, open: .7, smile: .6, mouthO: .1, cheek: .8, gaze: [-.2, 0] },
  effort:   { brow: -.6, browH: -.3, open: .5, smile: -.2, mouthO: .4, cheek: .6, gaze: [0, .2] },
  amused:   { brow: .1, browH: .3, open: .7, smile: .7, mouthO: .1, cheek: .5, gaze: [-.3, .2] },
  gentle:   { brow: .3, browH: .1, open: .6, smile: .45, mouthO: 0, cheek: .4, gaze: [0, .1] },
  proud:    { brow: .2, browH: .4, open: .75, smile: .75, mouthO: .2, cheek: .6, gaze: [.3, -.1] },
  tired:    { brow: .5, browH: 0, open: .45, smile: .2, mouthO: 0, cheek: .2, gaze: [-.2, .2] },
  closed:   { brow: .3, browH: .1, open: 0, smile: .3, mouthO: 0, cheek: .3, gaze: [0, 0] },
  moved:    { brow: .6, browH: .3, open: .6, smile: .55, mouthO: .2, cheek: .6, gaze: [-.3, -.1] },
  hesitant: { brow: .6, browH: .2, open: .9, smile: -.15, mouthO: .1, cheek: .3, gaze: [.3, .3] },
  calm:     { brow: .1, browH: .1, open: .75, smile: .3, mouthO: 0, cheek: .3, gaze: [0, 0] },
};
function exprMix(a, b, k) {
  const A = typeof a === 'string' ? EXPR[a] : a, Bx = typeof b === 'string' ? EXPR[b] : b; k = ss(k);
  const o = {}; for (const key in A) o[key] = Array.isArray(A[key]) ? [lerp(A[key][0], Bx[key][0], k), lerp(A[key][1], Bx[key][1], k)] : lerp(A[key], Bx[key], k);
  return o;
}
// a sequence of [time, expression] → blended expression at t (crossfade over `d` seconds)
function exprAt(keys, t, d = .5) {
  let cur = EXPR[keys[0][1]] || keys[0][1];
  for (let i = 1; i < keys.length; i++) { const [tk, e] = keys[i]; if (t < tk - d / 2) break; cur = exprMix(cur, e, seg(t, tk - d / 2, tk + d / 2)); }
  return cur;
}

// ---- geometry ----
const ik = (ax, ay, tx, ty, l1, l2, side) => {
  let dx = tx - ax, dy = ty - ay, d = Math.hypot(dx, dy) || 1e-6;
  const dd = clamp(d, Math.abs(l1 - l2) + .5, l1 + l2 - .5), ux = dx / d, uy = dy / d;
  const ca = clamp((l1 * l1 + dd * dd - l2 * l2) / (2 * l1 * dd), -1, 1), a = Math.acos(ca) * side;
  const jx = ax + (ux * Math.cos(a) - uy * Math.sin(a)) * l1, jy = ay + (ux * Math.sin(a) + uy * Math.cos(a)) * l1;
  return [[jx, jy], [ax + ux * dd, ay + uy * dd]];
};

// pose: { x, y (ground point under the hip), dir, hipLift (hip height above ground, default standing), lean (torso angle,
//   + = forward), headTilt, turn (0 profile → 1 front), feet: [[x,y],[x,y]] world targets (near, far), hands: [[x,y]|null,...],
//   kneeSide: [±1,±1], elbowSide: [±1,±1], expr, crouch, armsRelaxed }
function solve(C, P) {
  const dir = P.dir ?? 1, stoop = C.stoop || 0;
  const hipY = P.hipY ?? -(C.thigh + C.shin - 2), hip = [P.x, P.y + hipY];
  const lean = (P.lean ?? 0) + stoop;
  const sh = [hip[0] + Math.sin(lean) * C.torso * dir, hip[1] - Math.cos(lean) * C.torso];
  const neckA = lean + (P.headTilt ?? 0) - stoop * .6;
  const nk = [sh[0] + Math.sin(neckA) * C.neck * dir, sh[1] - Math.cos(neckA) * C.neck];
  const head = [nk[0] + Math.sin(neckA) * C.head * 1.05 * dir, nk[1] - Math.cos(neckA) * C.head * 1.05];
  const legs = [], arms = [];
  for (let i = 0; i < 2; i++) {
    const off = (i === 0 ? 1 : -1) * C.hipW * .25 * dir;  // near leg slightly forward of the far leg
    const root = [hip[0] + off, hip[1]];
    const ft = P.feet ? P.feet[i] : [hip[0] + off, P.y];
    const [knee, ankle] = ik(root[0], root[1], ft[0], ft[1], C.thigh, C.shin, (P.kneeSide ? P.kneeSide[i] : 1) * dir);
    legs.push({ root, knee, ankle, foot: ft });
  }
  for (let i = 0; i < 2; i++) {
    const root = [sh[0] + (i === 0 ? 1 : -1) * C.shW * .2 * dir, sh[1] + C.head * .35];
    let ht = P.hands && P.hands[i];
    if (!ht) { const sw = (P.armSwing ? P.armSwing[i] : 0); ht = [root[0] + Math.sin(sw) * (C.uarm + C.farm) * .92 * dir + (P.armsBack ? -8 * dir : 0), root[1] + Math.cos(sw) * (C.uarm + C.farm) * .92]; }
    const [elbow, hand] = ik(root[0], root[1], ht[0], ht[1], C.uarm, C.farm, (P.elbowSide ? P.elbowSide[i] : 1) * dir);
    arms.push({ root, elbow, hand });
  }
  return { hip, sh, nk, head, legs, arms, dir, lean, neckA };
}

// ---- painting ----
// a limb: a wash ribbon plus one darker edge
function limbS(S, a, b, w, col, z, edge = true, nb) {
  const pts = qcurve(a[0], a[1], b[0], b[1], 0, 6);
  const s = mk(pts, w * z, col, { prof: 'even', nb: nb ?? (w * z > 9 ? 3 : 0), a: .9, rib: .74, rough: .18 });
  S.push(s); if (edge) S.push(edgeOf(s, 1, Math.max(1, .09 * w * z), mixc(col, INKF, .55), .55));
  return s;
}
function dab(S, x, y, rx, ry, col, a = .9, ang = 0, nb = 0) {
  const c = Math.cos(ang), sn = Math.sin(ang);
  const pts = []; for (let i = 0; i <= 6; i++) { const u = -rx + 2 * rx * i / 6; pts.push([x + u * c, y + u * sn]); }
  S.push(mk(pts, ry * 2, col, { prof: 'leaf', nb, a, rib: .9, rough: .12 }));
}
const sx = (cam, x) => (x - cam.x) * cam.z + 960, sy = (cam, y) => (y - cam.y) * cam.z + 540;
const sp = (cam, p) => [sx(cam, p[0]), sy(cam, p[1])];

function drawHead(S, C, hc, r, dir, turn, E, z, o = {}) {
  // hc: head centre (screen), r: head radius (screen px), E: expression
  const tilt = o.tilt || 0, cs = Math.cos(tilt), sn = Math.sin(tilt);
  const L = (x, y) => [hc[0] + (x * cs - y * sn), hc[1] + (x * sn + y * cs)];
  const hairCol = C.hairCol, skin = C.skin, old = C.wrinkle || 0;
  // hair mass behind the head
  const back = (lx, ly, rx, ry, a = .95) => { const p = L(lx, ly); dab(S, p[0], p[1], rx, ry, hairCol, a, tilt); };
  if (C.hair === 'long') { back(-dir * r * .45, r * .9, r * .55, r * 1.3, .92); back(-dir * r * .3, r * 1.6, r * .45, r * .9, .85); }
  if (C.hair === 'tied') { back(-dir * r * .95, r * .1, r * .38, r * .42, .95); }
  if (C.hair === 'bob') { back(-dir * r * .25, r * .35, r * .95, r * .95, .9); }
  if (C.hair === 'pigtails') { const p = L(-dir * r * .95 * (1 - turn * .35), r * .25); dab(S, p[0], p[1], r * .22, r * .5, hairCol, .95, tilt + .35 * dir); const q = L(-dir * r * 1.0 * (1 - turn * .35), r * .62); dab(S, q[0], q[1], r * .16, r * .08, '#c8442a', .95, tilt); }
  // face: a wash and a lighter inner dab
  const f1 = L(0, r * .05); dab(S, f1[0], f1[1], r * .92, r * 1.02, skin, .95, tilt, r > 30 ? 3 : 0);
  const f2 = L(dir * r * .12, r * .3); dab(S, f2[0], f2[1], r * .5, r * .48, mixc(skin, SKIN2, .3), .3, tilt);
  // ear (far side in 3/4, near side in profile)
  const ex = -dir * r * lerp(.8, .96, turn); const ep = L(ex, r * .12); dab(S, ep[0], ep[1], r * .16, r * .23, mixc(skin, SKIN2, .4), .9, tilt);
  // hair: dabs laid along the crown so it hugs the head (angles: −π/2 is the top, the face is toward +dir)
  const hairArc = (a0, a1, n, thick, col, a, rOff = .9) => {
    // one soft cap under the dabs so they read as one mass, then overlapping tangential dabs
    const cp = L(-dir * r * .12, -r * .8);
    dab(S, cp[0], cp[1], r * .88, r * .36, col, a * .8, tilt, r > 30 ? 4 : 0);
    for (let k = 0; k < n; k++) {
      const ang = lerp(a0, a1, (k + .5) / n), back = (Math.cos(ang) * -dir + 1) / 2;   // 1 at the back of the head
      const p = L(Math.cos(ang) * r * rOff, Math.sin(ang) * r * rOff);
      dab(S, p[0], p[1], r * Math.abs(a1 - a0) / n * 1.1, thick * (1 + .5 * back), col, a * .75, ang + Math.PI / 2 + tilt);
    }
  };
  const faceA = dir > 0 ? 0 : Math.PI, backA = dir > 0 ? Math.PI : 0;   // angle of the face side / back of the head
  const span = (f, b) => dir > 0 ? [-Math.PI * f, -Math.PI * b] : [-Math.PI * (1 - f), -Math.PI * (1 - b)];
  if (C.hair === 'short') {
    const [a0, a1] = span(1.0, .32 + .2 * old);
    hairArc(a0, a1, 6, r * .16 * (1 - .3 * old), hairCol, .9, .9);
  } else {
    const [a0, a1] = span(1.05, .24);
    hairArc(a0, a1, 7, r * .22, hairCol, .95, .88);
    const fr = L(dir * r * .5, -r * .6); dab(S, fr[0], fr[1], r * .42, r * .2, hairCol, .9, tilt + .35 * dir);  // fringe
    const fr2 = L(dir * r * .15, -r * .72); dab(S, fr2[0], fr2[1], r * .4, r * .18, hairCol, .9, tilt - .1 * dir);
    if (C.hair === 'bob') { const sd = L(-dir * r * .9, r * .2); dab(S, sd[0], sd[1], r * .2, r * .7, hairCol, .92, tilt); }
    if (C.hair === 'tied') { const bn = L(-dir * r * .82, -r * .3); dab(S, bn[0], bn[1], r * .34, r * .32, hairCol, .95, tilt); const bd = L(-dir * r * .74, -r * .06); dab(S, bd[0], bd[1], r * .1, r * .05, '#c8442a', .95, tilt); }
  }
  // cheeks
  if (E.cheek > 0) { const ck = L(dir * r * lerp(.55, .4, turn), r * .32); dab(S, ck[0], ck[1], r * .22, r * .13, PINK, .35 * E.cheek, tilt); if (turn > .3) { const c2 = L(-dir * r * .35 * turn, r * .32); dab(S, c2[0], c2[1], r * .18 * turn, r * .11, PINK, .3 * E.cheek, tilt); } }
  // eyes
  const eyes = [[dir * lerp(.46, .36, turn), 1], [dir * lerp(.46, -.36, turn), turn]];
  const gz = E.gaze || [0, 0];
  for (const [exr, vis] of eyes) {
    if (vis <= 0.02) continue;
    const ew = r * .2 * (.55 + .45 * vis), eh = r * .17 * clamp(E.open, 0, 1.2), ey = -r * .1, cx0 = exr * r;
    const eb = L(cx0, ey);
    // eyeball: a paper-pale dab, then pupil + lid
    dab(S, eb[0], eb[1], ew * 1.05, Math.max(.6, eh * .9), '#f3ece0', .9 * vis, tilt);
    if (E.open > .12) {
      const px = cx0 + gz[0] * ew * .35 * dir, py = ey + gz[1] * eh * .3;
      const pp = L(px, py); dab(S, pp[0], pp[1], Math.min(ew * .55, r * .11), Math.min(eh * .95, r * .11), INKF, .95 * vis, tilt);
      const hl = L(px - dir * r * .03, py - r * .035); dab(S, hl[0], hl[1], Math.max(.6, r * .03), Math.max(.6, r * .03), '#f1e9da', .95 * vis, tilt);
    }
    // upper lid: an ink arc that closes with E.open
    const lidY = ey - eh * (E.open > .12 ? 1 : .0), pts = [];
    for (let i = 0; i <= 6; i++) { const u = i / 6 - .5; pts.push(L(cx0 + u * ew * 2.1, lidY + (E.open > .12 ? -Math.cos(u * Math.PI) * eh * .25 : Math.cos(u * Math.PI) * eh * .15))); }
    S.push(mk(pts, Math.max(.9, r * .055), INKF, { prof: 'even', nb: 0, a: .85 * vis, rough: .2 }));
    if (E.open < .12) { }
    else { const lw = []; for (let i = 0; i <= 5; i++) { const u = i / 5 - .5; lw.push(L(cx0 + u * ew * 1.8, ey + eh * .95 - Math.cos(u * Math.PI) * eh * .1)); } S.push(mk(lw, Math.max(.6, r * .03), INKF, { prof: 'even', nb: 0, a: .35 * vis })); }
    // brow
    const inner = cx0 - dir * ew * .9 * (exr * dir > 0 ? 1 : -1), outer = cx0 + dir * ew * 1.1 * (exr * dir > 0 ? 1 : -1);
    const by = -r * .4 - E.browH * r * .14, bi = by + E.brow * r * -.13, bo = by + E.brow * r * .09;
    const bp = [L(inner, bi), L((inner + outer) / 2, (bi + bo) / 2 - r * .05), L(outer, bo)];
    S.push(mk(qctrl(bp[0][0], bp[0][1], bp[1][0], bp[1][1], bp[2][0], bp[2][1], 6), Math.max(1.2, r * (old > .5 ? .1 : .08)), old > .5 ? '#b5afa5' : mixc(hairCol, INKF, .3), { prof: 'leaf', nb: 0, a: .92 * vis, rough: .25 }));
  }
  // nose
  if (turn < .55) { const n0 = L(dir * r * .95, r * .02), n1 = L(dir * r * 1.1, r * .18), n2 = L(dir * r * .92, r * .28); S.push(mk([n0, n1, n2], Math.max(1, r * .06), mixc(skin, INKF, .5), { prof: 'even', nb: 0, a: .6 })); }
  else { const n0 = L(dir * r * .12, r * .08), n1 = L(dir * r * .2, r * .26); S.push(mk([n0, n1], Math.max(1, r * .055), mixc(skin, INKF, .45), { prof: 'tip', nb: 0, a: .5 })); }
  // mouth
  { const mx = dir * r * lerp(.62, .02, turn), my = r * .5, mw = r * .26 * (.6 + .4 * turn) * (1 + E.mouthO * .2), cur = E.smile * r * .09;
    const pts = []; for (let i = 0; i <= 6; i++) { const u = i / 6 - .5; pts.push(L(mx + u * mw * 2, my - Math.cos(u * Math.PI) * cur + (E.smile > 0 ? 0 : 0))); }
    S.push(mk(pts, Math.max(1, r * .055), '#7a3b2e', { prof: 'even', nb: 0, a: .85, rough: .2 }));
    if (E.mouthO > .2) { const op = L(mx, my + cur * .3 + r * .04); dab(S, op[0], op[1], mw * .7, r * .1 * E.mouthO, '#8a3a2e', .85, tilt); }
  }
  // age lines
  if (old > .25) {
    const lines = [[dir * .55, .18, dir * .62, .38], [dir * .3, .5, dir * .25, .66]];
    for (const [x0, y0, x1, y1] of lines.slice(0, old > .6 ? 2 : 1)) { const a = L(x0 * r, y0 * r), b = L(x1 * r, y1 * r); S.push(mk([a, b], Math.max(.8, r * .035), mixc(skin, INKF, .4), { prof: 'tip', nb: 0, a: .35 + .3 * old })); }
    if (old > .6) { const a = L(dir * r * .35, -r * .5), b = L(dir * r * .75, -r * .48); S.push(mk([a, b], Math.max(.8, r * .03), mixc(skin, INKF, .35), { prof: 'even', nb: 0, a: .35 })); }
  }
}

// draw a figure: C = character, P = pose (world), cam = camera; returns the solved rig (screen) for props to attach to
function drawFigure(ctx, C, P, cam, o = {}) {
  const R = solve(C, P), z = cam.z, dir = R.dir, S0 = [], S1 = [], S2 = [];
  const E = P.expr || EXPR.neutral, turn = P.turn ?? .3;
  const legCol = i => C.legSkin ? C.skin : C.bottom, shoeCol = C.shoes;
  const W = (k, sh = 1) => C[k] * sh;
  withSeed(o.seed || 11, () => {
    // far arm, far leg (lighter)
    const far = i => mixc(i, '#f1e9da', .18);
    const A1 = R.arms[1], L1 = R.legs[1];
    limbS(S0, sp(cam, A1.root), sp(cam, A1.elbow), W('armW') * 1.1, far(C.top), z);
    limbS(S0, sp(cam, A1.elbow), sp(cam, A1.hand), W('armW'), far(C.skin), z, false);
    { const h = sp(cam, A1.hand); dab(S0, h[0], h[1], 3.2 * z, 2.6 * z, far(C.skin), .9); }
    limbS(S0, sp(cam, L1.root), sp(cam, L1.knee), W('limbW') * 1.15, far(C.bottom), z);
    limbS(S0, sp(cam, L1.knee), sp(cam, L1.ankle), W('limbW') * .95, far(legCol(1)), z);
    { const f = sp(cam, L1.ankle); dab(S0, f[0] + dir * 3 * z, f[1] + 1.5 * z, 5 * z, 2.4 * z, far(shoeCol), .9); }
    // torso
    const hip = sp(cam, R.hip), sh = sp(cam, R.sh), nk = sp(cam, R.nk);
    const tw = W('torsoW') * z;
    { const pts = qcurve(hip[0], hip[1] + 2 * z, sh[0], sh[1] - 2 * z, 0, 6); const s = mk(pts, tw, C.top, { prof: 'even', nb: tw > 10 ? 4 : 0, a: .92, rib: .8, rough: .14 }); S1.push(s); S1.push(edgeOf(s, -1, Math.max(1, tw * .08), mixc(C.top, INKF, .5), .5)); }
    // shorts / trousers top
    { const p0 = sp(cam, [R.hip[0], R.hip[1] - 6]), p1 = sp(cam, [R.hip[0], R.hip[1] + 8]); const s = mk(qcurve(p0[0], p0[1], p1[0], p1[1], 0, 4), tw * 1.05, C.bottom, { prof: 'even', nb: 0, a: .9, rib: .85 }); S1.push(s); }
    if (C.scarf) { const p0 = sp(cam, [R.sh[0] - 6 * dir, R.sh[1] + 4]), p1 = sp(cam, [R.sh[0] - 14 * dir, R.sh[1] + 26]); S1.push(mk(qcurve(p0[0], p0[1], p1[0], p1[1], -6 * z, 5), 5 * z, C.scarf, { prof: 'tip', nb: 0, a: .95 })); const c = sp(cam, [R.sh[0], R.sh[1] + 2]); dab(S1, c[0], c[1], 8 * z, 3 * z, C.scarf, .95); }
    // neck
    limbS(S1, sh, nk, C.head * .6, C.skin, z, false);
    // near leg
    const L0 = R.legs[0];
    limbS(S1, sp(cam, L0.root), sp(cam, L0.knee), W('limbW') * 1.2, C.bottom, z);
    limbS(S1, sp(cam, L0.knee), sp(cam, L0.ankle), W('limbW'), legCol(0), z);
    { const f = sp(cam, L0.ankle); dab(S1, f[0] + dir * 3.5 * z, f[1] + 1.5 * z, 5.5 * z, 2.6 * z, shoeCol, .92); }
    if (P.knee) { const k = sp(cam, L0.knee); dab(S1, k[0] + dir * 1.5 * z, k[1], 3.2 * z, 2.6 * z, '#b8432e', .55 * P.knee); }
    // head
    const hc = sp(cam, R.head);
    drawHead(S2, C, hc, C.head * z, dir, turn, E, z, { tilt: (R.neckA) * dir * .6 + (P.headRoll || 0) });
    // near arm (over the torso)
    const A0 = R.arms[0];
    limbS(S2, sp(cam, A0.root), sp(cam, A0.elbow), W('armW') * 1.15, C.top, z);
    limbS(S2, sp(cam, A0.elbow), sp(cam, A0.hand), W('armW'), C.skin, z, false);
    { const h = sp(cam, A0.hand); dab(S2, h[0], h[1], 3.4 * z, 2.8 * z, C.skin, .92); }
  });
  const all = S0.concat(S1, S2);
  if (o.collect) return { R, S: all };
  const p = o.p ?? 1;
  if (p >= 1) for (const s of all) drawS(ctx, s, 1, null, o.alpha ?? 1); else drawList(ctx, all, p, null, o.alpha ?? 1);
  return R;
}
