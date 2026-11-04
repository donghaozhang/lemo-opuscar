// ---------- acting: pose keyframes, cycles, riding and pushing poses, hands, the back of a head ----------
const isNum = v => typeof v === 'number';
function poseMix(A, Bp, k) {
  k = clamp(k); const o = Object.assign({}, A, Bp);
  for (const key in o) {
    const a = A[key], b = Bp[key];
    if (a === undefined || b === undefined) continue;
    if (isNum(a) && isNum(b)) o[key] = lerp(a, b, k);
    else if (key === 'expr') o[key] = exprMix(a, b, k);
    else if (Array.isArray(a) && Array.isArray(b) && a.length === b.length) o[key] = a.map((v, i) => Array.isArray(v) && Array.isArray(b[i]) ? [lerp(v[0], b[i][0], k), lerp(v[1], b[i][1], k)] : isNum(v) && isNum(b[i]) ? lerp(v, b[i], k) : (k < .5 ? v : b[i]));
  }
  return o;
}
// keys: [[t, pose, moveDur], ...]: each pose is reached at t, the move into it starting moveDur before (hold otherwise)
function poseSeq(keys, t) {
  let P = keys[0][1];
  for (let i = 1; i < keys.length; i++) { const [tk, pk, d = .5] = keys[i]; if (t <= tk - d) break; P = poseMix(P, pk, ss(seg(t, tk - d, tk))); if (t < tk) break; }
  return P;
}
const E = n => EXPR[n];
// foot targets for a run/walk cycle: phase in cycles, stride in world px
function cycleFeet(x, ph, stride, lift, dir = 1) {
  const f = i => { const a = (ph + i * .5) * Math.PI * 2; return [x + Math.cos(a) * stride * .5 * dir, -Math.max(0, Math.sin(a)) * lift]; };
  return [f(0), f(1)];
}
// riding: hip on the saddle, hands on the grips, feet on the pedals
function ridePose(C, Bk, o = {}) {
  const sad = bikePt(Bk, BIKE.saddle), grip = bikePt(Bk, BIKE.grip), dir = Bk.dir;
  const small = C.h < 130;
  return Object.assign({ x: sad[0] + 2 * dir, y: Bk.y, dir, hipY: sad[1] - Bk.y - (small ? 1 : 4) + (o.hipLift || 0), lean: small ? .3 : .2, turn: .3, expr: E('focus'),
    feet: [pedalPt(Bk, 0), pedalPt(Bk, 1)], hands: [grip, [grip[0] - 2 * dir, grip[1] + 1]], kneeSide: [1, 1], elbowSide: [1, 1] }, o);
}
// sitting side-saddle on the rack, facing the viewer, a hand on the rider's shoulder
function passengerPose(C, Bk, riderR, o = {}) {
  const rk = bikePt(Bk, [-8, -84]), dir = -Bk.dir;
  const sh = riderR ? [riderR.sh[0] - Bk.dir * 4, riderR.sh[1] + 6] : [rk[0] + 50 * Bk.dir, rk[1] - 40];
  return Object.assign({ x: rk[0], y: Bk.y, dir, hipY: rk[1] - Bk.y, lean: .06, turn: .85, expr: E('calm'),
    feet: [[rk[0] + 16 * Bk.dir, -24], [rk[0] + 26 * Bk.dir, -32]], hands: [sh, [rk[0] - 8 * Bk.dir, rk[1] + 18]], kneeSide: [-1, -1], elbowSide: [-1, 1] }, o);
}
// running behind the bicycle, bent, one hand on the back of the saddle
function pushPose(C, Bk, ph, o = {}) {
  const sad = bikePt(Bk, BIKE.saddle), dir = Bk.dir, x = sad[0] - 58 * dir;
  const feet = cycleFeet(x, ph, 46, 14, dir), bob = 3 * Math.abs(Math.sin(ph * Math.PI * 2));
  return Object.assign({ x, y: Bk.y, dir, hipY: -(C.thigh + C.shin - 10) + bob, lean: .5, turn: .3, expr: E('focus'),
    feet, hands: [[sad[0] - 12 * dir, sad[1] + 3], [x - 20 * dir, -105]], kneeSide: [1, 1], elbowSide: [1, 1] }, o);
}
// walking beside the bicycle, wheeling it: one hand on the grip, one on the saddle
function wheelPose(C, Bk, ph, o = {}) {
  const sad = bikePt(Bk, BIKE.saddle), grip = bikePt(Bk, BIKE.grip), dir = Bk.dir, x = sad[0] - 20 * dir;
  const feet = cycleFeet(x, ph, 40, 8, dir);
  return Object.assign({ x, y: Bk.y, dir, hipY: -(C.thigh + C.shin - 3) + 1.5 * Math.abs(Math.sin(ph * Math.PI * 2)), lean: .08, turn: .35, expr: E('calm'),
    feet, hands: [grip, [sad[0] - 6 * dir, sad[1] + 2]], kneeSide: [1, 1], elbowSide: [1, 1] }, o);
}
function walkPose(C, x, ph, dir, o = {}) {
  const feet = cycleFeet(x, ph, 44, 9, dir);
  return Object.assign({ x, y: 0, dir, hipY: -(C.thigh + C.shin - 3) + 1.5 * Math.abs(Math.sin(ph * Math.PI * 2)), lean: .05, turn: .35, expr: E('calm'), feet, armSwing: [.35 * Math.sin(ph * Math.PI * 2 + Math.PI), .35 * Math.sin(ph * Math.PI * 2)], kneeSide: [1, 1] }, o);
}
function runPose(C, x, ph, dir, o = {}) {
  const feet = cycleFeet(x, ph, 60, 18, dir);
  return Object.assign({ x, y: 0, dir, hipY: -(C.thigh + C.shin - 8) + 4 * Math.abs(Math.sin(ph * Math.PI * 2)), lean: .25, turn: .35, expr: E('joy'), feet, armSwing: [.7 * Math.sin(ph * Math.PI * 2 + Math.PI), .7 * Math.sin(ph * Math.PI * 2)], kneeSide: [1, 1], elbowSide: [1, 1] }, o);
}
// a hand with fingers (screen space): palm at (x,y), size s, pointing dir; grip 1 = closed around something, 0 = open
function handStrokes(S, x, y, s, dir, grip, col = SKIN, o = {}) {
  dab(S, x, y, s * .55, s * .42, col, .92, o.rot || 0, s > 30 ? 3 : 0);
  for (let i = 0; i < 4; i++) {
    const a0 = (o.rot || 0) + dir * (-.35 + i * .28) + (1 - grip) * dir * -.25, len = s * (.55 + .12 * Math.sin(i * 1.2)), curl = grip * .9;
    const p0 = [x + Math.cos(a0) * s * .4, y + Math.sin(a0) * s * .3];
    const p1 = [p0[0] + Math.cos(a0 + curl * .5 * dir) * len * .5, p0[1] + Math.sin(a0 + curl * .5 * dir) * len * .5 + curl * len * .25];
    const p2 = [p1[0] + Math.cos(a0 + curl * 1.3 * dir) * len * .5, p1[1] + Math.sin(a0 + curl * 1.3 * dir) * len * .5 + curl * len * .35];
    S.push(mk([p0, p1, p2], s * .2, col, { prof: 'tip', nb: 0, a: .9, rough: .15 }));
  }
  // the thumb
  const ta = (o.rot || 0) + dir * .9 + (1 - grip) * .3; S.push(mk([[x - dir * s * .1, y - s * .25], [x - dir * s * .1 + Math.cos(ta) * s * .35, y - s * .25 + Math.sin(ta) * s * .35]], s * .2, col, { prof: 'tip', nb: 0, a: .9 }));
}
// the back of a head with pigtails (over-the-shoulder foreground), screen space
function backHeadStrokes(S, x, y, r, C, wind = 0) {
  dab(S, x, y + r * 1.25, r * .95, r * .55, C.top, .92, 0, 5);               // shoulders / collar
  dab(S, x, y + r * .9, r * .28, r * .3, C.skin, .9, 0, 0);                  // neck
  dab(S, x, y, r * .98, r * 1.05, C.hairCol, .95, 0, 6);                     // hair mass
  dab(S, x - r * .2, y - r * .3, r * .7, r * .6, mixc(C.hairCol, '#f1e9da', .12), .5, .3, 3);
  for (const side of [-1, 1]) {                                              // pigtails, with the red bands
    const px = x + side * r * .72, py = y + r * .45;
    dab(S, px + side * r * .05 + wind * r * .15, py + r * .35, r * .2, r * .48, C.hairCol, .95, side * .35 + wind * .2);
    dab(S, px, py - r * .05, r * .17, r * .08, '#c8442a', .95, 0);
  }
  dab(S, x + r * .98, y + r * .1, r * .15, r * .22, mixc(C.skin, SKIN2, .4), .9, 0);   // an ear
}
