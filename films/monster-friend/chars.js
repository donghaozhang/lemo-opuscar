// Characters: Dou Dou (豆豆), Ni Ni (妮妮), the purple monster, the yellow monster, the other children and the teacher.
// A skilled adult imitating a child: round heads about 2.6 heads tall, tube limbs, mitten hands. Eyes are white ovals with an indigo pupil,
// a top lid that can close, a lower lid for squinting, a brow stroke, and a white-wax catchlight; the expressions are clearly different.
import { ellipse, handCircle, xf, smooth, bez, CAM } from './crayon.js';
import { part, tube, curve, knock, erase, DRAW, line, fill, dab } from './rig.js';
import { PAL } from './pal.js';
import { hash, clamp, lerp } from '/core/lib.js';
const K = PAL.crayon;
const LW = 7;
const T0 = o => { const k = o.flip ? -1 : 1; return pts => xf(pts, { x: o.x || 0, y: o.y || 0, s: o.s || 1, r: o.r || 0, sx: k }); };
const lo = (seed, extra = {}) => ({ w: LW, seed, ...extra });

// ---------------- expressions ----------------
// lid: top lid 0..1; low: lower lid (squint) 0..1; browY: raise (−1 down … +1 up); browA: angle (+ = inner end up = worried/sad, − = inner end down = angry);
// pupil [dx, dy]; pupilR scale; mouth: 'line' | 'small' | 'smile' | 'open' | 'o' | 'frown' | 'wide' | 'wavy'; cheek: blush strength; happy: closed happy arcs
const EX = (o) => ({ lid: 0, low: 0, browY: 0, browA: 0, pupil: [0, 0], pupilR: 1, mouth: 'small', cheek: .7, happy: 0, ...o });
export const EXPR = {
  neutral: EX({}),
  shy: EX({ lid: .35, browY: .2, browA: .3, pupil: [0, .6], pupilR: .9, mouth: 'line', cheek: 1 }),
  scared: EX({ lid: 0, browY: .9, browA: .5, pupil: [0, 0], pupilR: .6, mouth: 'o', cheek: .3 }),
  giggle: EX({ happy: 1, browY: .4, mouth: 'smile', cheek: 1 }),
  curious: EX({ lid: 0, browY: .8, browA: 0, pupil: [.4, -.2], pupilR: 1.15, mouth: 'small', cheek: .6 }),
  brave: EX({ lid: .15, low: .2, browY: -.3, browA: -.25, pupil: [.3, 0], pupilR: 1, mouth: 'line', cheek: .6 }),
  laughing: EX({ happy: 1, browY: .6, mouth: 'wide', cheek: 1 }),
  sleepy: EX({ lid: .7, browY: 0, pupil: [0, .3], mouth: 'small', cheek: .5 }),
  surprised: EX({ lid: 0, browY: 1, browA: 0, pupil: [0, 0], pupilR: .75, mouth: 'open', cheek: .5 }),
  sad: EX({ lid: .3, browY: .5, browA: .6, pupil: [0, .4], mouth: 'frown', cheek: .6 }),
  asleep: EX({ lid: 1, mouth: 'small', cheek: .5 }),
  smile: EX({ lid: .1, browY: .3, mouth: 'smile', cheek: .9, pupil: [.2, 0] }),
  determined: EX({ lid: .2, low: .3, browY: -.4, browA: -.3, pupil: [.4, 0], mouth: 'line', cheek: .6 }),
};
export function mixEx(a, b, u) { u = clamp(u); const o = {}; for (const k in b) { const x = a[k], y = b[k]; o[k] = Array.isArray(y) ? y.map((v, i) => lerp(x[i], v, u)) : typeof y === 'number' ? lerp(x, y, u) : (u < .5 ? x : y); } return o; }

// one eye at local (x, y), radius r; k = horizontal squeeze for the turned eye; skin = colour behind the lid
function eye(C, P, x, y, r, E, sd, s, k = 1, skin = K.peach, pupilCol = K.ink) {
  if (E.happy > .5 || E.lid >= .97) {
    const up = E.happy > .5;   // happy: an upward arc; asleep: a downward arc
    const pts = up ? [[x - r * k, y + r * .35], [x - r * .45 * k, y - r * .4], [x + r * .45 * k, y - r * .4], [x + r * k, y + r * .35]] : [[x - r * k, y - r * .2], [x - r * .45 * k, y + r * .45], [x + r * .45 * k, y + r * .45], [x + r * k, y - r * .2]];
    line(C.l, P(pts), lo(sd, { w: 5, taper: .3 })); return;
  }
  const white = ellipse(x, y, r * k, r * 1.1, 22);
  part(C, P(white), { col: K.white, p: 1, gap: 3.5, w: 6, over: .5, seed: sd, ang: 1.1 }, lo(sd + 1, { w: 4.5 }), { occ: true, kn: false });
  const pr = r * .5 * (E.pupilR || 1), px = x + (E.pupil[0] || 0) * (r * k - pr) * .9, py = y + (E.pupil[1] || 0) * (r * 1.1 - pr) * .8;
  part(C, P(ellipse(px, py, pr * k, pr * 1.05, 14)), { col: pupilCol, p: 1, gap: 2.8, w: 4.5, over: .4, seed: sd + 2, ang: 1.3 }, null, { occ: false, kn: false });
  dab(C.l, ...P([[px + pr * .35 * k, py - pr * .4]])[0], Math.max(1.6, pr * .32) * s, { col: K.white, p: 1, seed: sd + 3, gap: 2, w: 3 });
  // top lid
  if (E.lid > .03) {
    const ly = y - r * 1.1 + 2 * r * 1.1 * E.lid;
    const lid = [...ellipse(x, y, r * k + 1.5, r * 1.1 + 1.5, 18, Math.PI, Math.PI * 2), [x + r * k + 1.5, ly], [x - r * k - 1.5, ly]];
    part(C, P(lid), { col: skin, p: .75, gap: 4, w: 6, over: .8, seed: sd + 4 }, null, { occ: true, kn: false });
    line(C.l, P([[x - r * k - 1.5, ly], [x + r * k + 1.5, ly]]), lo(sd + 5, { w: 4.5 }));
  }
  // lower lid (squint)
  if (E.low > .03) {
    const ly = y + r * 1.1 - 2 * r * 1.1 * E.low * .5;
    const lid = [...ellipse(x, y, r * k + 1.5, r * 1.1 + 1.5, 18, 0, Math.PI), [x - r * k - 1.5, ly], [x + r * k + 1.5, ly]];
    part(C, P(lid), { col: skin, p: .75, gap: 4, w: 6, over: .8, seed: sd + 6 }, null, { occ: true, kn: false });
    line(C.l, P([[x - r * k - 1.5, ly], [x + r * k + 1.5, ly]]), lo(sd + 7, { w: 4 }));
  }
}
function brow(C, P, x, y, r, E, sd, side) {   // side: −1 left eye, +1 right eye (inner end toward the centre)
  const by = y - r * 1.6 - E.browY * r * .45, a = E.browA * r * .35;
  line(C.l, P([[x - r * .95, by + (side < 0 ? -a : a)], [x, by - r * .1], [x + r * .95, by + (side < 0 ? a : -a)]]), lo(sd, { w: 4.5, taper: .3, p: .9 }));
}
function mouthDraw(C, P, x, y, E, sd, k = 1, col = K.red) {
  const m = E.mouth;
  if (m === 'line') { line(C.l, P([[x - 7 * k, y], [x + 7 * k, y]]), lo(sd, { w: 4.5 })); return; }
  if (m === 'small') { line(C.l, P([[x - 6 * k, y - 1], [x, y + 2], [x + 6 * k, y - 1]]), lo(sd, { w: 4.5 })); return; }
  if (m === 'frown') { line(C.l, P([[x - 8 * k, y + 3], [x, y - 2], [x + 8 * k, y + 3]]), lo(sd, { w: 4.5 })); return; }
  if (m === 'wavy') { line(C.l, P([[x - 9 * k, y + 1], [x - 4 * k, y - 2], [x + 1 * k, y + 2], [x + 6 * k, y - 2], [x + 9 * k, y + 1]]), lo(sd, { w: 4.5 })); return; }
  if (m === 'smile') { const s = [[x - 12 * k, y - 4], [x - 6 * k, y + 5], [x + 6 * k, y + 5], [x + 12 * k, y - 4]]; part(C, P(s), { col, p: .8, gap: 3, w: 4, over: .5, seed: sd }, lo(sd + 1, { w: 4.5 }), { occ: false, kn: false }); return; }
  if (m === 'wide') { const s = [[x - 15 * k, y - 4], [x - 8 * k, y + 9], [x + 8 * k, y + 9], [x + 15 * k, y - 4]]; part(C, P(s), { col, p: .85, gap: 3, w: 4, over: .5, seed: sd }, lo(sd + 1, { w: 4.5 }), { occ: false, kn: false }); line(C.l, P([[x - 11 * k, y - 2], [x + 11 * k, y - 2]]), lo(sd + 2, { w: 3, col: K.white, p: 1 })); return; }
  if (m === 'o') { part(C, P(ellipse(x, y + 2, 5 * k, 6, 16)), { col, p: .8, gap: 3, w: 4, over: .5, seed: sd }, lo(sd + 1, { w: 4 }), { occ: false, kn: false }); return; }
  if (m === 'open') { part(C, P(ellipse(x, y + 3, 8 * k, 10, 18)), { col, p: .85, gap: 3, w: 4, over: .5, seed: sd }, lo(sd + 1, { w: 4.5 }), { occ: false, kn: false }); return; }
}

// ---------------- a child ----------------
// o: x, y (between the feet), s, r, flip, view (front|q|side|back), expr (EXPR or name), pose, hair ('bowl'|'pigtails'|'bun'|'spiky'|'braids'), shirt, bottom, dress (bool), skin,
//    arms {L, R} override [[sh],[el],[hand]] local, legs override, backpack (bool), hold ('crayon' | null), seed
export function kid(C, o) {
  const T = T0(o), view = o.view || 'front', pose = o.pose || 'stand', sd = o.seed || 200, E = typeof o.expr === 'string' ? EXPR[o.expr] : (o.expr || EXPR.neutral);
  const P = pts => T(pts), s = o.s || 1;
  const shirt = o.shirt || K.orange, bottom = o.bottom || K.sky, skin = o.skin || K.peach, hairC = o.hairCol || K.brown;
  const shirtF = { col: shirt, p: .75, gap: 10, w: 12, ang: .45, seed: sd + 1, over: 3 };
  const botF = { col: bottom, p: .75, gap: 9, w: 11, ang: 1.2, seed: sd + 2, over: 3 };
  const skinF = { col: skin, p: .55, gap: 10, w: 11, ang: .6, seed: sd + 3, over: 3 };
  const turn = { front: 0, q: 1, side: 2, back: 3 }[view];
  const wide = turn === 0 ? 1 : turn === 1 ? .9 : turn === 2 ? .68 : 1;
  const legW = 22, armW = 17;
  const limb = (pts, w, f, seed) => part(C, P(tube(curve(pts, 5), w)), f, lo(seed));
  const hand = (c, seed) => part(C, P(handCircle(c[0], c[1], 11, seed, 0, 18)), skinF, lo(seed, { w: 5.5 }));
  const shoe = (c, seed, dir) => part(C, P(ellipse(c[0] + (dir ? 9 * dir : 0), c[1] + 3, dir ? 18 : 14, 9, 18)), { col: K.ink, p: .7, gap: 5, w: 7, seed, over: 1 }, lo(seed + 1, { w: 5 }));
  // ---- skeleton per pose (local, origin between the feet, up is −y) ----
  let headC = [0, -258], headR = 0, headView = view;
  let legs, arms, torso, dressPoly = null, bodyTop = -200;
  const ph = o.ph || 0;
  if (pose === 'walk') {
    const sw = ph ? 1 : -1;
    legs = turn === 2 || turn === 1 ? [[[6, -92], [6 + 18 * sw, -50], [8 + 28 * sw, -10]], [[-6, -92], [-6 - 18 * sw, -50], [-8 - 28 * sw, -10]]] : [[[-18, -92], [-19, -50], [-20 + 6 * sw, -10]], [[18, -92], [19, -50], [20 - 6 * sw, -10]]];
    arms = turn === 2 ? [[[0, -186], [12 * -sw, -146], [20 * -sw, -112]]] : [[[-36 * wide, -186], [-48 * wide + 14 * sw, -146], [-54 * wide + 22 * sw, -112]], [[36 * wide, -186], [48 * wide - 14 * sw, -146], [54 * wide - 22 * sw, -112]]];
  } else if (pose === 'sit') {
    headC = [0, -172]; bodyTop = -114;
    legs = turn === 2 ? [[[8, -26], [60, -30], [70, 20]], [[0, -20], [52, -22], [62, 26]]] : [[[-20, -24], [-30, 10], [-26, 30]], [[20, -24], [30, 10], [26, 30]]];
    arms = turn === 2 ? [[[4, -100], [28, -70], [44, -48]]] : [[[-36, -100], [-44, -66], [-36, -40]], [[36, -100], [44, -66], [36, -40]]];
  } else if (pose === 'reach') {   // one arm straight up (freeing the balloon)
    legs = [[[-18, -92], [-19, -50], [-20, -10]], [[18, -92], [19, -50], [20, -10]]];
    arms = [[[-36 * wide, -186], [-52 * wide, -146], [-58 * wide, -112]], [[36 * wide, -186], [52 * wide, -250], [60 * wide, -330]]];
  } else if (pose === 'hold') {    // arm held out forward with the crayon (side / 3/4)
    legs = turn === 2 ? [[[6, -92], [8, -50], [10, -10]], [[-6, -92], [-8, -50], [-10, -10]]] : [[[-18, -92], [-19, -50], [-20, -10]], [[18, -92], [19, -50], [20, -10]]];
    arms = turn === 2 ? [[[0, -186], [40, -168], [86, -160]]] : [[[-36 * wide, -186], [-52 * wide, -146], [-58 * wide, -112]], [[36 * wide, -186], [70, -170], [104, -162]]];
  } else if (pose === 'cover') {   // both hands over the mouth
    legs = [[[-18, -92], [-19, -50], [-20, -10]], [[18, -92], [19, -50], [20, -10]]];
    arms = [[[-36 * wide, -186], [-48 * wide, -150], [-13, -232]], [[36 * wide, -186], [48 * wide, -150], [13, -232]]];
  } else if (pose === 'lie') {     // in bed, head left, feet right: upper body only shown above the blanket
    headC = [0, -258]; legs = []; arms = [[[-36 * wide, -186], [-56 * wide, -150], [-40, -124]], [[36 * wide, -186], [56 * wide, -150], [40, -124]]]; bodyTop = -200;
  } else if (pose === 'lean') {    // leaning back, feet skidding (being nudged)
    legs = [[[-18, -92], [-34, -56], [-48, -12]], [[18, -92], [-4, -56], [-20, -12]]];
    arms = [[[-36 * wide, -186], [-66 * wide, -170], [-84 * wide, -140]], [[36 * wide, -186], [18, -160], [-6, -150]]];
    headR = (o.flip ? 1 : -1) * .18;
  } else {   // stand
    legs = turn === 2 ? [[[6, -92], [8, -50], [8, -10]], [[-6, -92], [-8, -50], [-8, -10]]] : [[[-18, -92], [-19, -50], [-20, -10]], [[18, -92], [19, -50], [20, -10]]];
    arms = turn === 2 ? [[[0, -186], [14, -146], [26, -112]]] : [[[-36 * wide, -186], [-50 * wide, -146], [-56 * wide, -112]], [[36 * wide, -186], [50 * wide, -146], [56 * wide, -112]]];
  }
  if (o.legs) legs = o.legs;
  if (o.arms) { if (o.arms.L && arms.length > 1) arms[0] = o.arms.L; if (o.arms.R) arms[arms.length - 1] = o.arms.R; }
  const feetDir = turn === 2 ? (o.flip ? -1 : 1) : 0;
  // ---- draw order: backpack, far arm, legs, shorts, torso, near arm, head ----
  if (o.backpack && turn !== 0) {
    const bx = turn === 3 ? 0 : (turn === 2 ? -44 : -34);
    const bp = smooth([[bx - 36, bodyTop + 2], [bx + 36, bodyTop + 2], [bx + 40, bodyTop + 110], [bx - 40, bodyTop + 110]], 4);
    part(C, P(bp), { col: K.sky, p: .8, gap: 8, w: 10, ang: .3, seed: sd + 400, over: 2 }, lo(sd + 401));
    line(C.l, P([[bx - 30, bodyTop + 50], [bx + 30, bodyTop + 50]]), lo(sd + 402, { w: 5 }));
    if (o.peek) monsterEyes(C, P, bx, bodyTop + 24, 10, sd + 410, o.peekLook || [0, 0]);
  }
  const farArm = turn === 1 ? arms[0] : null;
  if (farArm) { limb(farArm, armW, skinF, sd + 60); hand(farArm[2], sd + 62); }
  if (pose !== 'lie') legs.forEach((lg, i) => { limb(lg, legW, skinF, sd + 40 + i * 10); shoe(lg[2], sd + 44 + i * 10, feetDir); });
  // shorts or dress
  if (o.dress) {
    dressPoly = smooth([[-30 * wide, bodyTop], [30 * wide, bodyTop], [44 * wide, bodyTop + 40], [66 * wide, bodyTop + 130], [-66 * wide, bodyTop + 130], [-44 * wide, bodyTop + 40]], 3);
    part(C, P(dressPoly), { ...shirtF, ang: .35 }, lo(sd + 70));
    // a scalloped hem
    for (let i = 0; i < 5; i++) { const x0 = -60 * wide + i * 30 * wide; line(C.l, P([[x0, bodyTop + 130], [x0 + 15 * wide, bodyTop + 140], [x0 + 30 * wide, bodyTop + 130]]), lo(sd + 72 + i, { w: 4.5 })); }
  } else if (pose !== 'lie') {
    const sh = pose === 'sit' ? smooth([[-38 * wide, bodyTop + 60], [38 * wide, bodyTop + 60], [44 * wide, bodyTop + 100], [-44 * wide, bodyTop + 100]], 3) : smooth([[-36 * wide, -140], [36 * wide, -140], [40 * wide, -84], [4, -84], [0, -100], [-4, -84], [-40 * wide, -84]], 3);
    part(C, P(sh), botF, lo(sd + 74));
  }
  // torso (shirt) and a round collar
  if (!o.dress) {
    torso = smooth([[-34 * wide, bodyTop], [34 * wide, bodyTop], [42 * wide, bodyTop + 20], [40 * wide, bodyTop + 72], [-40 * wide, bodyTop + 72], [-42 * wide, bodyTop + 20]], 3);
    part(C, P(torso), shirtF, lo(sd + 76));
    if (o.stripe !== false && turn !== 3) for (let i = 0; i < 2; i++) line(C.l, P([[-32 * wide, bodyTop + 24 + i * 22], [32 * wide, bodyTop + 22 + i * 22]]), lo(sd + 78 + i, { w: 5, col: K.white, p: 1 }));
  }
  // backpack straps (front views)
  if (o.backpack && turn < 2) [-1, 1].forEach((sg, i) => line(C.l, P([[sg * 24 * wide, bodyTop + 4], [sg * 20 * wide, bodyTop + 60]]), lo(sd + 404 + i, { w: 6, col: K.sky, p: .9 })));
  // near arms
  const near = turn === 1 ? [arms[1]] : arms;
  near.forEach((a, i) => { if (!a) return; limb(a, armW, skinF, sd + 100 + i * 4); hand(a[a.length - 1], sd + 102 + i * 4); });
  // sleeves over the shoulders
  if (pose !== 'lie') { const sl = turn === 2 ? [[0, -184]] : turn === 1 ? [[-30, -184], [36, -184]] : [[-36 * wide, -184], [36 * wide, -184]]; sl.forEach(([x, y], i) => part(C, P(smooth([[x - 15, y - 8], [x, y - 14], [x + 15, y - 8], [x + 13, y + 12], [x - 13, y + 12]], 4)), { ...shirtF, seed: sd + 110 + i }, lo(sd + 112 + i, { w: 6 }))); }
  // the held crayon (purple) in the right hand
  if (o.hold === 'crayon') { const h = arms[arms.length - 1][2]; crayonStick(C, P, h[0] + 8, h[1] - 4, -.9 + (o.flip ? .4 : 0), 1.0, sd + 120, o.holdCol || K.purple); }
  // head
  const hc = P([headC])[0];
  head(C, { x: hc[0], y: hc[1], s, r: (o.r || 0) + headR + (o.headTilt || 0) * (o.flip ? -1 : 1), flip: o.flip, view: headView, expr: E, hair: o.hair || 'bowl', hairCol: hairC, skin, seed: sd + 300, ribbons: o.ribbons });
  return { head: hc, hand: P([arms[arms.length - 1][2]])[0], shoulder: P([[36 * wide, bodyTop]])[0] };
}
// a crayon stick (local coords through P): a short hexagonal stick with a cone tip, paper wrapper band
export function crayonStick(C, P, x, y, a, s, sd, col) {
  const T = pts => xf(pts, { x, y, r: a, s });
  const body = [[-26, -6], [16, -6], [26, 0], [16, 6], [-26, 6], [-26, -6]];
  part(C, P(T(body)), { col, p: .95, gap: 4, w: 6, seed: sd, ang: a + 1.5, over: 1 }, lo(sd + 1, { w: 4 }));
  // the paper wrapper (most of the length) with two indigo bands
  part(C, P(T([[-26, -6.5], [8, -6.5], [8, 6.5], [-26, 6.5], [-26, -6.5]])), { col: K.sand, p: .85, gap: 3.5, w: 5, seed: sd + 2, ang: a, over: .5 }, lo(sd + 3, { w: 3.5 }), { occ: true, kn: false });
  [-20, 2].forEach((u, i) => fill(C.f, P(T([[u, -6.5], [u + 4, -6.5], [u + 4, 6.5], [u, 6.5]])), { col: K.ink, p: .8, gap: 2.5, w: 4, seed: sd + 4 + i, ang: a + 1.5, over: .3 }));
}

// Head: local origin at the face centre, radius ≈ 62
export function head(C, o) {
  const T = T0(o), view = o.view || 'front', sd = o.seed || 100, s = o.s || 1, P = pts => T(pts);
  const E = typeof o.expr === 'string' ? EXPR[o.expr] : (o.expr || EXPR.neutral), hair = o.hair || 'bowl', skin = o.skin || K.peach, hairC = o.hairCol || K.brown;
  const turn = { front: 0, q: 1, side: 2, back: 3 }[view];
  const hairF = { col: hairC, p: .85, gap: 8, w: 10, ang: 1.2, seed: sd + 1, over: 2.5 };
  const skinF = { col: skin, p: .5, gap: 10, w: 12, ang: .5, seed: sd + 2, over: 4 };
  // back hair mass (all views): a big round cap slightly larger than the face
  const hx = turn === 0 ? 0 : turn === 1 ? -10 : -24;
  const cap = hair === 'spiky'
    ? smooth([[-66 + hx * .4, 10], [-70 + hx * .5, -30], [-50, -62], [-30, -90], [-10, -70], [8, -96], [26, -72], [46, -92], [58, -62], [70 - (turn ? 10 : 0), -26], [66 - (turn ? 16 : 0), 10], [0, 8]], 4)
    : smooth([[-70 + hx * .4, 16], [-74 + hx * .5, -24], [-54 + hx * .3, -66], [0 + hx * .2, -80], [52, -66], [72 - (turn ? 10 : 0), -26], [68 - (turn ? 18 : 0), 14], [0, 10]], 6);
  part(C, P(cap), hairF, lo(sd + 3));
  if (turn === 3) { if (hair === 'pigtails') pigtails(C, P, sd, hairC, o.ribbons, 3, s); if (hair === 'bun') bun(C, P, sd, hairC, s); return; }
  // face
  const face = turn < 2 ? ellipse(0, 0, 64, 60, 44) : smooth([[0, -60], [40, -50], [60, -24], [66, -2], [72, 8], [64, 16], [60, 30], [44, 52], [14, 60], [-24, 54], [-50, 30], [-60, 0], [-50, -34], [-28, -56]], 6);
  part(C, P(face), skinF, null);
  if (turn < 2) line(C.l, P(ellipse(0, 0, 64, 60, 36, -0.12, Math.PI + 0.12)), lo(sd + 7)); else line(C.l, P(face.slice(Math.floor(face.length * 2 / 14), Math.floor(face.length * 11 / 14))), lo(sd + 7));
  // fringe by hair style: bowl = a straight-ish fringe; pigtails/bun = a curved fringe with a parting; spiky = zigzag points
  let fr;
  if (hair === 'bowl') fr = turn === 0 ? [[-64, -14], [-60, -38], [-40, -58], [0, -66], [40, -58], [60, -38], [64, -14], [50, -27], [24, -31], [0, -29], [-24, -31], [-50, -27]] : turn === 1 ? [[-60, -16], [-56, -42], [-30, -62], [12, -66], [48, -54], [64, -32], [66, -16], [50, -28], [26, -32], [2, -30], [-22, -32], [-44, -26]] : [[-58, 4], [-56, -34], [-30, -60], [10, -64], [42, -52], [58, -30], [54, -22], [40, -32], [22, -31], [4, -33], [-14, -12], [-26, 12], [-40, 20], [-52, 18]];
  else if (hair === 'spiky') fr = turn === 0 ? [[-64, -10], [-60, -40], [-30, -70], [0, -62], [30, -70], [60, -40], [64, -10], [50, -24], [36, -14], [22, -28], [6, -16], [-10, -30], [-26, -16], [-42, -28], [-54, -16]] : [[-60, -12], [-56, -40], [-30, -66], [12, -62], [48, -60], [64, -30], [66, -12], [52, -26], [38, -14], [22, -28], [6, -18], [-12, -30], [-28, -16], [-44, -26]];
  else fr = turn === 0 ? [[-64, -14], [-60, -38], [-40, -58], [0, -66], [40, -58], [60, -38], [64, -14], [54, -34], [34, -46], [12, -40], [0, -52], [-12, -40], [-34, -46], [-54, -34]] : turn === 1 ? [[-60, -16], [-56, -42], [-30, -62], [12, -66], [48, -54], [64, -32], [66, -16], [56, -34], [36, -48], [10, -38], [-10, -50], [-30, -40], [-48, -28]] : [[-58, 4], [-56, -34], [-30, -60], [10, -64], [42, -52], [58, -30], [54, -18], [44, -34], [26, -44], [8, -36], [-10, -12], [-26, 12], [-40, 18], [-52, 16]];
  const fs = smooth(fr, 3); part(C, P(fs), { ...hairF, seed: sd + 8, ang: 1.0 }, null);
  line(C.l, P(fs.slice(7 * 3 - 3, fs.length - 1)), lo(sd + 9));                     // the fringe's lower edge only
  if (turn === 0) { part(C, P(smooth([[-64, -14], [-56, -10], [-52, 12], [-58, 24], [-70, 22], [-72, 0]], 4)), { ...hairF, seed: sd + 10 }, null); part(C, P(smooth([[64, -14], [56, -10], [52, 12], [58, 24], [70, 22], [72, 0]], 4)), { ...hairF, seed: sd + 12 }, null); }
  else if (turn === 1) part(C, P(smooth([[-60, -14], [-52, -8], [-48, 12], [-54, 22], [-68, 20], [-70, 0]], 4)), { ...hairF, seed: sd + 10 }, null);
  if (hair === 'pigtails') pigtails(C, P, sd, hairC, o.ribbons, turn, s);
  if (hair === 'bun') bun(C, P, sd, hairC, s);
  // ears
  if (turn >= 1) part(C, P(ellipse(turn === 1 ? -58 : -54, 6, 9, 12, 14)), skinF, lo(sd + 14, { w: 5 }));
  // eyes, brows, cheeks, mouth
  const eyeX = turn === 0 ? [-23, 23] : turn === 1 ? [-6, 32] : [44], eyeY = 4, r = 10.5;
  eyeX.forEach((x, i) => { const k = turn === 1 && i === 0 ? .85 : turn === 2 ? .75 : 1; eye(C, P, x, eyeY, r, E, sd + 20 + i * 10, s, k, skin); brow(C, P, x, eyeY, r, E, sd + 50 + i, turn === 0 ? (i ? 1 : -1) : 1); });
  const ck = turn === 0 ? [[-40, 24], [40, 24]] : turn === 1 ? [[-24, 26], [48, 24]] : [[32, 26]];
  ck.forEach(([x, y], i) => dab(C.f, ...P([[x, y]])[0], 10 * s * (E.cheek || .6) + 2 * s, { col: K.pink, p: .55 + .35 * (E.cheek || .6), seed: sd + 30 + i, sq: .7 }));
  const mx = turn === 0 ? 0 : turn === 1 ? 16 : 52, my = 32;
  if (turn === 2) line(C.l, P([[60, 6], [68, 14], [60, 20]]), lo(sd + 40, { w: 4 }));   // nose in profile
  mouthDraw(C, P, mx, my, E, sd + 42, turn === 2 ? .6 : 1);
}
function pigtails(C, P, sd, hairC, ribbons, turn, s) {
  const F = { col: hairC, p: .85, gap: 7, w: 9, ang: 1.0, seed: sd + 200, over: 2 };
  const sides = turn === 2 ? [[-62, -6]] : turn === 3 ? [[-60, -6], [60, -6]] : turn === 1 ? [[-62, -4], [66, -8]] : [[-66, -6], [66, -6]];
  sides.forEach(([x, y], i) => {
    const sg = x < 0 ? -1 : 1;
    const tail = smooth([[x, y - 10], [x + sg * 22, y + 4], [x + sg * 28, y + 40], [x + sg * 16, y + 62], [x - sg * 6, y + 48], [x - sg * 8, y + 14]], 4);
    part(C, P(tail), { ...F, seed: sd + 201 + i }, lo(sd + 203 + i, { w: 6 }));
    if (ribbons !== false) { const bx = x + sg * 6, by = y - 4; part(C, P(smooth([[bx - 14, by - 4], [bx - 20, by - 16], [bx - 4, by - 10], [bx + 4, by - 2], [bx + 16, by - 14], [bx + 18, by], [bx + 6, by + 6], [bx - 6, by + 8]], 3)), { col: K.red, p: .95, gap: 4, w: 6, seed: sd + 210 + i, over: 1 }, lo(sd + 212 + i, { w: 4.5 })); }
  });
}
function bun(C, P, sd, hairC, s) { part(C, P(handCircle(8, -92, 20, sd + 220, 0, 20)), { col: hairC, p: .85, gap: 6, w: 8, seed: sd + 221 }, lo(sd + 222, { w: 6 })); }

// ---------------- the purple monster ----------------
// local origin between the feet; body height ≈ 220 at s = 1 (a child-sized monster). o: x, y, s, r, flip, expr, pose, look, seed, col, mini (the yellow one), cheeks (puff 0..1), fillDraw/lineDraw (being drawn)
const MEX = (o) => ({ lid: 0, low: 0, browY: 0, browA: 0, pupil: [0, 0], pupilR: 1, mouth: 'smile', cheek: .5, happy: 0, teeth: 1, ...o });
export const MEXPR = {
  happy: MEX({}),
  delighted: MEX({ happy: 1, browY: .6, mouth: 'wide', cheek: 1 }),
  mischief: MEX({ lid: .3, browY: -.2, browA: -.35, pupil: [.5, .2], mouth: 'smile', cheek: .6 }),
  scared: MEX({ lid: 0, browY: .9, browA: .5, pupil: [0, .2], pupilR: .55, mouth: 'o', cheek: .3, teeth: 0 }),
  sad: MEX({ lid: .3, browY: .6, browA: .6, pupil: [0, .5], mouth: 'frown', cheek: .4, teeth: 0 }),
  surprised: MEX({ lid: 0, browY: 1, pupil: [0, 0], pupilR: .7, mouth: 'open', cheek: .4, teeth: 0 }),
  sleepy: MEX({ lid: .75, browY: 0, pupil: [0, .3], mouth: 'small', cheek: .4, teeth: 0 }),
  asleep: MEX({ lid: 1, mouth: 'small', cheek: .4, teeth: 0 }),
  sneeze: MEX({ lid: .95, browY: .8, browA: .5, mouth: 'open', cheek: 1, teeth: 0 }),
  pre: MEX({ lid: .5, browY: .7, browA: .4, pupil: [0, -.5], mouth: 'wavy', cheek: .9, teeth: 0 }),
  chew: MEX({ lid: .35, browY: .1, pupil: [.3, -.1], mouth: 'line', cheek: 1, teeth: 0 }),
  proud: MEX({ lid: .25, low: .2, browY: -.2, browA: -.2, pupil: [.3, 0], mouth: 'smile', cheek: .7 }),
  yawn: MEX({ lid: .9, browY: .4, mouth: 'open', cheek: .5, teeth: 0 }),
};
export function mixMex(a, b, u) { return mixEx(a, b, u); }
function monsterEyes(C, P, x, y, r, sd, look, E = MEXPR.happy, s = 1, col = K.purple, wax = 0, pupils = 1) {
  [-1.1, 1.1].forEach((sg, i) => {
    const ex = x + sg * r * 1.25;
    if (wax) {   // the eyes as the boy draws them: two white-wax circles (invisible on bare paper, they shine under the wash)
      part(C, P(ellipse(ex, y, r, r * 1.1, 22)), { col: K.white, p: 1, gap: 3, w: 6, over: .5, seed: sd + i * 10, ang: 1.1, draw: wax }, null, { occ: true, kn: false });
      if (pupils > 0) { const pr_ = r * .5; part(C, P(ellipse(ex + look[0] * r * .4, y + look[1] * r * .4, pr_, pr_ * 1.05, 14)), { col: K.ink, p: 1, gap: 2.8, w: 4.5, over: .4, seed: sd + 2 + i * 10, ang: 1.3, draw: pupils }, null, { occ: false, kn: false }); }
      return;
    }
    eye(C, P, ex, y, r, { ...E, pupil: look }, sd + i * 10, s, 1, col); brow(C, P, ex, y, r, E, sd + 30 + i, sg);
  });
}
export function monster(C, o) {
  const T = T0(o), sd = o.seed || 600, s = o.s || 1, P = pts => T(pts), col = o.col || K.purple, pose = o.pose || 'stand';
  const E = typeof o.expr === 'string' ? MEXPR[o.expr] : (o.expr || MEXPR.happy), look = o.look || E.pupil || [0, 0];
  const mini = !!o.mini, Hh = mini ? 150 : 220, Wd = mini ? 120 : 150;
  const F = { col, p: .85, gap: 9, w: 11, ang: .4, seed: sd + 1, over: 4, cross: true, crossP: .45, draw: o.fillDraw ?? 1 };
  const lw = (seed, extra = {}) => lo(seed, { draw: o.lineDraw ?? 1, ...extra });
  const puff = o.cheeks || 0, sq = o.squash ?? 1, st = o.stretch ?? 1;
  const S = pts => pts.map(([x, y]) => [x * sq / st, (y) * st / sq]);   // squash & stretch about the feet
  // body: a soft pear (wider at the bottom), two nub horns, ear flaps, a tuft
  const body = smooth(S([[0, -Hh * 1.02], [Wd * .42, -Hh * .96], [Wd * .62 + puff * 14, -Hh * .66], [Wd * .66, -Hh * .3], [Wd * .5, -14], [Wd * .22, -4], [-Wd * .22, -4], [-Wd * .5, -14], [-Wd * .66, -Hh * .3], [-Wd * .62 - puff * 14, -Hh * .66], [-Wd * .42, -Hh * .96]]), 5);
  // legs (short) and arms are drawn before the body (behind) except the near arm for some poses
  const legPts = pose === 'walk' ? [[[-Wd * .3, -16], [-Wd * .36 + (o.ph ? 10 : -10), 0]], [[Wd * .3, -16], [Wd * .36 - (o.ph ? 10 : -10), 0]]] : [[[-Wd * .3, -16], [-Wd * .36, 0]], [[Wd * .3, -16], [Wd * .36, 0]]];
  if (pose !== 'hide' && pose !== 'climb') legPts.forEach((lg, i) => { part(C, P(S(tube(lg, 34))), { ...F, cross: false, seed: sd + 20 + i }, lw(sd + 22 + i)); for (let c = 0; c < 3; c++) line(C.l, P(S([[lg[1][0] - 10 + c * 10, lg[1][1] + 8], [lg[1][0] - 10 + c * 10, lg[1][1] + 20]])), lw(sd + 24 + i * 3 + c, { w: 4 })); });
  // arms: long and soft; per pose
  let arms;
  const aY = -Hh * .55;
  if (pose === 'hug') arms = [[[-Wd * .6, aY], [-Wd * .9, aY - 30], [-Wd * .5, aY - 90]], [[Wd * .6, aY], [Wd * .9, aY - 30], [Wd * .5, aY - 90]]];
  else if (pose === 'lift') arms = [[[-Wd * .6, aY], [-Wd * 1.0, aY - 60], [-Wd * 1.1, aY - 160]], [[Wd * .6, aY], [Wd * 1.0, aY - 60], [Wd * 1.1, aY - 160]]];
  else if (pose === 'nudge') arms = [[[-Wd * .6, aY], [-Wd * 1.0, aY + 10], [-Wd * 1.4, aY + 20]], [[Wd * .6, aY], [Wd * .9, aY + 20], [Wd * 1.2, aY + 30]]];
  else if (pose === 'eat') arms = [[[-Wd * .6, aY], [-Wd * .9, aY + 20], [-Wd * .28, aY + 30]], [[Wd * .6, aY], [Wd * .8, aY + 20], [Wd * 1.0, aY + 40]]];
  else if (pose === 'climb') arms = [[[-Wd * .6, aY], [-Wd * 1.0, aY - 70], [-Wd * .9, aY - 150]], [[Wd * .6, aY], [Wd * 1.0, aY - 70], [Wd * .9, aY - 150]]];
  else if (pose === 'walk') arms = [[[-Wd * .6, aY], [-Wd * .95, aY + 30 - (o.ph ? 30 : 0)], [-Wd * 1.1, aY + 60 - (o.ph ? 50 : 0)]], [[Wd * .6, aY], [Wd * .95, aY + 30 - (o.ph ? 0 : 30)], [Wd * 1.1, aY + 60 - (o.ph ? 0 : 50)]]];
  else arms = [[[-Wd * .6, aY], [-Wd * .95, aY + 30], [-Wd * 1.05, aY + 70]], [[Wd * .6, aY], [Wd * .95, aY + 30], [Wd * 1.05, aY + 70]]];
  if (o.arms) { if (o.arms.L) arms[0] = o.arms.L; if (o.arms.R) arms[1] = o.arms.R; }
  const armDraw = (a, seed) => { part(C, P(S(tube(curve(a, 5), 30, 26))), { ...F, cross: false, seed }, lw(seed + 1)); part(C, P(S(handCircle(a[2][0], a[2][1], 19, seed + 2, 0, 18))), { ...F, cross: false, seed: seed + 3 }, lw(seed + 4, { w: 6 })); };
  if (pose !== 'hide') { if (pose !== 'eat') armDraw(arms[0], sd + 40); if (pose !== 'hug' && pose !== 'lift') armDraw(arms[1], sd + 50); }
  if (pose === 'hide') {   // a mound of sand with the eyes showing
    const mound = smooth([[-Wd * .9, 0], [-Wd * .6, -Hh * .3], [0, -Hh * .42], [Wd * .6, -Hh * .3], [Wd * .9, 0]], 5);
    part(C, P(mound), { col: K.sand, p: .85, gap: 9, w: 11, ang: .3, seed: sd + 5, over: 4 }, lw(sd + 6));
    monsterEyes(C, P, 0, -Hh * .26, 13, sd + 300, look, E, s, K.sand);
    return { top: P([[0, -Hh * .42]])[0] };
  }
  part(C, P(body), F, lw(sd + 8));
  if (pose === 'hug' || pose === 'lift') armDraw(arms[1], sd + 50);   // near arm over the body
  if (pose === 'eat') armDraw(arms[0], sd + 40);                        // the hand at the mouth
  // belly patch (lighter: white wax scribble), horns, ear flaps, tuft
  if ((o.fillDraw ?? 1) * DRAW.f > .6 && !mini) fill(C.f, P(S(ellipse(0, -Hh * .36, Wd * .3, Hh * .2, 20))), { col: K.white, p: .6, gap: 7, w: 9, ang: .3, seed: sd + 9, over: 1 });
  const horns = mini ? [[0, -Hh * 1.0, 0]] : [[-Wd * .3, -Hh * .98, -.3], [Wd * .3, -Hh * .98, .3]];
  horns.forEach(([hx, hy, a], i) => { const hp = smooth(S([[hx - 16, hy + 6], [hx + 16, hy + 6], [hx + 10 + a * 30, hy - 30], [hx + a * 34, hy - 48], [hx - 10 + a * 30, hy - 30]]), 3); part(C, P(hp), { ...F, cross: false, seed: sd + 60 + i }, lw(sd + 62 + i, { w: 6 })); });
  if (!mini) [-1, 1].forEach((sg, i) => { const ex = sg * Wd * .66, ey = -Hh * .74; part(C, P(S(smooth([[ex, ey - 24], [ex + sg * 30, ey - 36], [ex + sg * 40, ey - 8], [ex + sg * 20, ey + 16], [ex, ey + 8]], 4))), { ...F, cross: false, seed: sd + 70 + i }, lw(sd + 72 + i, { w: 6 })); });
  if (mini) line(C.l, P(S(curve([[8, -Hh * 1.0], [20, -Hh * 1.12], [12, -Hh * 1.22], [0, -Hh * 1.16]]))), lw(sd + 75, { w: 5 }));
  else line(C.l, P(S(curve([[0, -Hh * 1.02], [10, -Hh * 1.12], [26, -Hh * 1.14], [22, -Hh * 1.04]]))), lw(sd + 75, { w: 5 }));
  // face: two big eyes, brows, cheeks, a wide mouth with two little teeth
  if (o.wax) { const ey = -Hh * .7, er = mini ? 15 : 19; const kf = DRAW.f, kl = DRAW.l; DRAW.f = 1; DRAW.l = 1; monsterEyes(C, P, 0, ey, er, sd + 300, look, E, s, col, o.wax, o.pupils ?? 0); DRAW.f = kf; DRAW.l = kl; }
  if ((o.lineDraw ?? 1) >= 1 && DRAW.l >= 1) {
    const ey = -Hh * .7, er = mini ? 15 : 19;
    if (!o.wax) monsterEyes(C, P, 0, ey, er, sd + 300, look, E, s, col);
    [[-Wd * .5, -Hh * .5], [Wd * .5, -Hh * .5]].forEach(([x, y], i) => dab(C.f, ...P(S([[x, y]]))[0], (9 + 7 * (E.cheek || .5)) * s, { col: K.pink, p: .55 + .3 * (E.cheek || .5), seed: sd + 90 + i, sq: .7 }));
    const my = -Hh * .44;
    if (E.mouth === 'smile' || E.mouth === 'wide') {
      const wdt = E.mouth === 'wide' ? Wd * .42 : Wd * .34, dep = E.mouth === 'wide' ? 26 : 16;
      const m = [[-wdt, my - 4], [-wdt * .5, my + dep], [wdt * .5, my + dep], [wdt, my - 4]];
      part(C, P(S(m)), { col: K.red, p: .8, gap: 3.5, w: 5, over: .5, seed: sd + 95 }, lw(sd + 96, { w: 5 }), { occ: false, kn: false });
      if (E.teeth) [[-wdt * .35, my - 2], [wdt * .35, my - 2]].forEach(([tx, ty], i) => part(C, P(S([[tx - 6, ty], [tx + 6, ty], [tx, ty + 10]])), { col: K.white, p: 1, gap: 2.5, w: 4, seed: sd + 97 + i }, null, { occ: false, kn: false }));
    } else mouthDraw(C, P, 0, my, { ...E, mouth: E.mouth }, sd + 95, 1.4);
  }
  return { top: P(S([[0, -Hh * 1.02]]))[0], hand: P(S([arms[1][2]]))[0], handL: P(S([arms[0][2]]))[0], eye: P(S([[0, -Hh * .7]]))[0] };
}

// ---------------- the teacher and a simple child (background figures, half-weight lines) ----------------
export function bgKid(C, o) { return kid(C, { stripe: false, ...o }); }
export function teacher(C, o) {
  const T = T0(o), sd = o.seed || 900, P = pts => T(pts), s = o.s || 1;
  // a tall adult: a long dress, a bun, one arm waving
  part(C, P(smooth([[-40, -300], [40, -300], [64, -120], [84, -20], [-84, -20], [-64, -120]], 3)), { col: K.green, p: .7, gap: 11, w: 12, ang: .4, seed: sd + 1, over: 3 }, lo(sd + 2, { w: 5 }));
  [[-40, -290], [-70, -230], [-82, -170]].forEach(() => 0);
  part(C, P(tube(curve([[-38, -290], [-70, -230], [-82, -170]], 5), 16)), { col: K.peach, p: .5, gap: 9, w: 10, seed: sd + 3, over: 2 }, lo(sd + 4, { w: 5 }));
  const wv = o.wave ? 26 : 0;
  part(C, P(tube(curve([[38, -290], [80, -330], [90 + wv, -400 + wv * .3]], 5), 16)), { col: K.peach, p: .5, gap: 9, w: 10, seed: sd + 5, over: 2 }, lo(sd + 6, { w: 5 }));
  part(C, P(handCircle(92 + wv, -404 + wv * .3, 12, sd + 7, 0, 16)), { col: K.peach, p: .5, gap: 8, w: 9, seed: sd + 8 }, lo(sd + 9, { w: 4.5 }));
  head(C, { x: P([[0, -360]])[0][0], y: P([[0, -360]])[0][1], s: s * .9, view: 'front', expr: 'smile', hair: 'bun', hairCol: K.ink, seed: sd + 300 });
}

// ---------------- the teacher's back (over-the-shoulder foreground): hair, bun, ear, neck, collar, shoulders ----------------
export function teacherBack(C, o) {
  const T = T0(o), sd = o.seed || 950, P = pts => T(pts);
  const hairF = { col: K.ink, p: .85, gap: 9, w: 11, ang: 1.1, seed: sd + 1, over: 3 };
  // shoulders and the collar of a green dress (the bottom edge runs out of frame)
  part(C, P(smooth([[-260, -40], [-200, -120], [-90, -170], [0, -180], [90, -170], [200, -120], [260, -40], [280, 200], [-280, 200]], 3)), { col: K.green, p: .7, gap: 11, w: 12, ang: .4, seed: sd + 2, over: 3 }, lo(sd + 3));
  line(C.l, P([[-70, -172], [-30, -150], [0, -140], [30, -150], [70, -172]]), lo(sd + 4, { w: 6, col: K.white, p: 1 }));   // the collar
  part(C, P(smooth([[-34, -170], [34, -170], [36, -230], [-36, -230]], 2)), { col: K.peach, p: .55, gap: 9, w: 10, seed: sd + 5, over: 2 }, lo(sd + 6, { w: 6 }));   // neck
  part(C, P(handCircle(0, -330, 112, sd + 7, .05, 40)), hairF, lo(sd + 8));   // the back of the head: hair
  part(C, P(handCircle(14, -452, 40, sd + 9, .05, 24)), { ...hairF, seed: sd + 10 }, lo(sd + 11, { w: 6 }));   // the bun
  part(C, P(ellipse(104, -320, 16, 24, 16)), { col: K.peach, p: .55, gap: 7, w: 9, seed: sd + 12, over: 2 }, lo(sd + 13, { w: 5 }));   // an ear
  line(C.l, P([[100, -326], [108, -316], [102, -306]]), lo(sd + 14, { w: 4 }));
  for (let i = 0; i < 5; i++) line(C.l, P([[-60 + i * 30, -420 + 10 * Math.abs(i - 2)], [-50 + i * 30, -250]]), lo(sd + 20 + i, { w: 4, p: .5 }));   // hair strands
}
// ---------------- the backpack as a prop (sky blue, a flap, a zip, two straps; eyes peeking from the flap gap) ----------------
export function backpackProp(C, o) {
  const T = T0(o), sd = o.seed || 980, P = pts => T(pts), e = o.e || { on: true, pl: 1, pf: 1 };
  if (!e.on) return;
  const F = { col: K.sky, p: .8, gap: 8, w: 10, ang: .3, seed: sd, over: 2, draw: e.pf };
  const body = smooth([[-80, 0], [80, 0], [88, -150], [60, -200], [-60, -200], [-88, -150]], 4);
  part(C, P(body), F, lo(sd + 1, { draw: e.pl }));
  const flap = smooth([[-84, -150], [84, -150], [76, -90], [0, -78], [-76, -90]], 3);
  if (o.peek) monsterEyes(C, P, 0, -118, 10, sd + 40, o.look || [0, 0], MEXPR.happy, o.s || 1, K.sky);
  part(C, P(flap), { ...F, seed: sd + 2, p: .9 }, lo(sd + 3, { draw: e.pl }));
  if (o.peek) {   // the gap under the flap: eyes showing in a dark slit
    part(C, P([[-50, -92], [50, -92], [46, -70], [-46, -70]]), { col: K.ink, p: .6, gap: 5, w: 7, seed: sd + 4, over: 1 }, null, { occ: true, kn: false });
    monsterEyes(C, P, 0, -82, 9, sd + 40, o.look || [0, 0], MEXPR.happy, o.s || 1, K.ink);
  }
  if (o.zip != null) line(C.l, P([[-70, -150], [-70 + 140 * o.zip, -150]]), lo(sd + 5, { w: 5, col: K.white, p: 1 }));   // the zip (drawn as the slider moves)
  line(C.l, P([[-40, -120], [-40, -30]]), lo(sd + 6, { draw: e.pl, w: 4, p: .6 })); line(C.l, P([[40, -120], [40, -30]]), lo(sd + 7, { draw: e.pl, w: 4, p: .6 }));
  line(C.l, P([[-20, -200], [-10, -222], [10, -222], [20, -200]]), lo(sd + 8, { draw: e.pl, w: 6 }));   // the handle
}
