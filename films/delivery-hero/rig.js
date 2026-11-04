// rig.js — capsule-limb character rig with 3-tone shading (light from the upper left), per-part inner line, global ink outline.
// Pose angles in degrees: 0 = straight down, + = toward the facing side. One rig gives every pose; u = scale (1 ≈ 30 px figure, 2 ≈ 60 px).
import { C, T, FB, sprite, outline, clamp, lerp, DARK } from './px.js';
import { head, hairBack, hairFront, EXPR } from './face.js';

const MAT = {
  skin: [C.dbrown, C.skinS, C.skin, C.sand],
  jacket: [C.ink, C.night, C.navy, C.blue],
  coat: [C.ink, C.navy, C.blue, C.cyan],
  pants: [C.ink, C.night, C.dslate, C.slate],
  shoe: [C.ink, C.ink, C.umber, C.dbrown],
  helmet: [C.crimson, C.rust, C.orange, C.amber],
  kidTop: [C.ink, C.navy, C.blue, C.cyan],
  kidShorts: [C.ink, C.umber, C.dbrown, C.brown],
  boots: [C.dbrown, C.amber, C.amber, C.yellow],
  dino: [C.teal, C.dgreen, C.green, C.lime],
  cardigan: [C.umber, C.plum, C.rose, C.pink],
  skirt: [C.ink, C.night, C.dslate, C.slate],
  slipper: [C.umber, C.crimson, C.red, C.pink],
  hairK: [C.ink, C.umber, C.dbrown, C.brown],
  hairL: [C.dslate, C.slate, C.steel, C.silver],
};
const LIGHT_DIR = [-.6, -.8];
function shadeFn(m, back) {
  return (x, y, nx, ny) => {
    const l = nx * LIGHT_DIR[0] + ny * LIGHT_DIR[1];
    let c = l > .45 ? m[3] : l < -.35 ? m[1] : m[2];
    if (back) c = l > .45 ? m[2] : m[1];
    return c;
  };
}
const rad = a => a * Math.PI / 180;
// chain: from (x,y), angles a1 then a1+a2, lengths l1,l2 → [knee/elbow, end]
function chain(x, y, a1, a2, l1, l2, face) {
  const p1 = [x + Math.sin(rad(a1)) * l1 * face, y + Math.cos(rad(a1)) * l1];
  const p2 = [p1[0] + Math.sin(rad(a1 + a2)) * l2 * face, p1[1] + Math.cos(rad(a1 + a2)) * l2];
  return [p1, p2];
}

// proportions per character (u = 1)
const BODY = {
  rider: { leg: [5.5, 5.5], arm: [4.6, 4.4], torso: 9, headR: 5.4, limbR: [1.9, 1.6], torsoW: 4.2, mats: { top: 'jacket', leg: 'pants', foot: 'shoe' } },
  kid: { leg: [3.6, 3.4], arm: [3.2, 3.0], torso: 6, headR: 5.0, limbR: [1.6, 1.3], torsoW: 3.4, mats: { top: 'kidTop', leg: 'kidShorts', foot: 'boots' } },
  lady: { leg: [4.4, 4.2], arm: [4.0, 3.8], torso: 8, headR: 4.8, limbR: [1.7, 1.4], torsoW: 4.2, mats: { top: 'cardigan', leg: 'skirt', foot: 'slipper' } },
};
export const POSE0 = { lean: 0, hipY: 0, armB: [10, 20], armF: [-8, 25], legB: [-6, 4], legF: [8, 4], headTilt: 0, sq: 1, look: 0 };

// draw into fb at ground point (gx, gy). o: {face:1|-1, u, expr, coat, hood, bowl, phone, umbrella, wet, blink, flag}
export function figure(fb, who, pose, gx, gy, o = {}) {
  const u = o.u || 1, face = o.face || 1, B = BODY[who], P = { ...POSE0, ...pose };
  const pad = Math.round(40 * u), w = pad * 2, h = Math.round(64 * u);
  const f = sprite(w, h); const X0 = pad, Y0 = h - Math.round(4 * u);
  const sq = P.sq;                                   // squash (<1) / stretch (>1) around the feet
  const sy = v => Y0 + (v - Y0) * sq, sxs = 1 / Math.sqrt(sq);
  const legL = (B.leg[0] + B.leg[1]) * u;
  const hip = [X0 + (P.hipX || 0) * u * face, Y0 - legL * .97 + P.hipY * u];
  const ang = rad(P.lean);
  const sh = [hip[0] + Math.sin(ang) * B.torso * u * face, hip[1] - Math.cos(ang) * B.torso * u];
  const neck = [sh[0] + Math.sin(ang) * 1.5 * u * face, sh[1] - Math.cos(ang) * 1.5 * u];
  const hc = [neck[0] + Math.sin(ang + rad(P.headTilt)) * B.headR * .95 * u * face, neck[1] - B.headR * 1.0 * u];
  const m = B.mats, top = MAT[o.coat && who === 'rider' ? 'coat' : m.top], leg = MAT[m.leg], foot = MAT[m.foot], skin = MAT.skin;
  const lr = B.limbR[0] * u, ar = B.limbR[1] * u;
  const T2 = (p) => [X0 + (p[0] - X0) * sxs, sy(p[1])];
  const limb = (a, b, r, mat, back) => { const A = T2(a), Bp = T2(b); f.capsule(A[0], A[1], Bp[0], Bp[1], r, shadeFn(mat, back)); };
  const legDraw = (a, back) => {
    const [k, e] = chain(hip[0] + (back ? -1 : 1) * .6 * u * face, hip[1], a[0], a[1], B.leg[0] * u, B.leg[1] * u, face);
    limb([hip[0], hip[1]], k, lr, leg, back); limb(k, e, lr * .92, who === 'kid' ? MAT.boots : leg, back);
    const ft = T2(e); f.capsule(ft[0] - .5 * u * face, ft[1] - .2 * u, ft[0] + 2.2 * u * face, ft[1] + .2 * u, 1.3 * u, shadeFn(foot, back));
  };
  const armDraw = (a, back, hold) => {
    const [el, hd] = chain(sh[0] + (back ? -.8 : .8) * u * face, sh[1] + 1 * u, a[0], a[1], B.arm[0] * u, B.arm[1] * u, face);
    limb([sh[0], sh[1] + 1 * u], el, ar, top, back); limb(el, hd, ar * .9, top, back);
    const H = T2(hd); f.disc(H[0], H[1], 1.15 * u, back ? skin[1] : skin[2]);
    return H;
  };
  // backpack (kid): dino with spikes, behind the torso
  if (who === 'kid') {
    const bp = T2([sh[0] - 3.4 * u * face, sh[1] + 3.5 * u]);
    f.ell(bp[0], bp[1], 3.2 * u, 4.2 * u, shadeFn(MAT.dino));
    for (let i = 0; i < 3; i++) { const sx0 = bp[0] - (2.4 + i * .3) * u * face, sy0 = bp[1] - 3 * u + i * 2.6 * u; f.poly([[sx0, sy0], [sx0 - 2.4 * u * face, sy0 + .8 * u], [sx0, sy0 + 1.8 * u]], C.lime); }
  }
  // back limbs
  armDraw(P.armB, true); legDraw(P.legB, true);
  // torso
  const S = T2(sh), Hh = T2(hip);
  f.capsule(Hh[0], Hh[1] - 1 * u, S[0], S[1] + 1 * u, B.torsoW * u * (who === 'lady' ? 1.1 : 1), shadeFn(top));
  if (who === 'rider' && !o.coat) { const a = T2([lerp(hip[0], sh[0], .55), lerp(hip[1], sh[1], .55)]); f.capsule(a[0] - 3.6 * u, a[1], a[0] + 3.6 * u, a[1], Math.max(.6, .55 * u), C.amber); }
  if (who === 'lady') { const a = T2([hip[0], hip[1]]); f.poly([[a[0] - 4.6 * u, a[1] - 1 * u], [a[0] + 4.6 * u, a[1] - 1 * u], [a[0] + 5.6 * u, a[1] + 5 * u], [a[0] - 5.2 * u, a[1] + 5 * u]], shadeFn(MAT.skirt)); }
  if (o.coat && who === 'rider') { // raincoat skirt over hips
    const a = T2(hip); f.poly([[a[0] - 4.8 * u, a[1] - 3 * u], [a[0] + 4.8 * u, a[1] - 3 * u], [a[0] + 6 * u * face, a[1] + 4 * u], [a[0] - 6 * u * face, a[1] + 4.4 * u]], (x, y) => (x + y) % 9 === 0 ? C.cyan : C.blue);
  }
  legDraw(P.legF, false);
  // head
  const Hc = T2(hc);
  const hs = sprite(Math.round(30 * u), Math.round(36 * u)); const hx = Math.round(15 * u), hy = Math.round(18 * u);
  if (u >= 1.8) {
    const s = B.headR * u / 10.5;
    const e = typeof o.expr === 'string' ? EXPR[o.expr] : (o.expr || EXPR.neutral);
    hairBack(hs, who, hx, hy, s, o); head(hs, who, e, hx, hy, s, { turn: P.look }); hairFront(hs, who, hx, hy, s, e, { ...o, sway: o.flag || 0 });
  } else smallHead(hs, who, hx, hy, u, o, P);
  const flipH = face < 0;
  // paste head (flipped when facing left)
  for (let j = 0; j < hs.h; j++) for (let i = 0; i < hs.w; i++) { const c = hs.d[j * hs.w + (flipH ? hs.w - 1 - i : i)]; if (c !== T) f.px(Math.round(Hc[0] - hx + i), Math.round(Hc[1] - hy + j), c); }
  // front arm last (holds things)
  const hand = armDraw(P.armF, false);
  outline(f, C.ink);
  fb.blit(f, Math.round(gx - X0), Math.round(gy - Y0));
  return { hand: [hand[0] - X0 + gx, hand[1] - Y0 + gy], head: [Hc[0] - X0 + gx, Hc[1] - Y0 + gy], hip: [Hh[0] - X0 + gx, Hh[1] - Y0 + gy], top: [Hc[0] - X0 + gx, Hc[1] - Y0 + gy - B.headR * u] };
}
// small sprite heads (u≈1): 1-px eye, simple hair
function smallHead(f, who, x, y, u, o, P) {
  const r = BODY[who].headR * u, sk = (X, Y, nx, ny) => (-nx * .6 - ny * .5) > .4 ? C.sand : (-nx * .6 - ny * .5) < -.35 ? C.skinS : C.skin;
  f.ell(x, y, r, r * 1.02, sk);
  const ex = x + r * .45, ey = y + r * .12;
  if (who === 'rider') {
    f.clip = [0, 0, f.w, Math.round(y - r * .2)]; f.ell(x - .3 * u, y - .4 * u, r * 1.12, r * 1.08, (X, Y, nx, ny) => (-nx * .6 - ny * .6) > .5 ? C.amber : (-nx * .6 - ny * .6) < -.2 ? C.rust : C.orange); f.clip = [0, 0, f.w, f.h];
    f.rect(x - r * 1.1, Math.round(y - r * .2), r * 2.2, Math.max(1, u * .8), C.umber);
    f.rect(x - .3 * u, y - r * 1.05, Math.max(1, .9 * u), r * .8, C.white);
    // antenna flag
    const fl = o.flag || 0; f.line(x - 1.6 * u, y - r * 1.05, x - 2.6 * u + fl * u, y - r - 5 * u, C.ink); f.poly([[x - 2.6 * u + fl * u, y - r - 5 * u], [x + 1.4 * u + fl * u * 1.4, y - r - 4.2 * u], [x - 2.2 * u + fl * u, y - r - 3 * u]], C.amber);
    // hair tuft back
    f.poly([[x - r * .8, y - r * .1], [x - r - 2.6 * u, y + .3 * u], [x - r * .7, y + 1.2 * u], [x - r - 1.6 * u, y + 2.6 * u], [x - r * .45, y + 2.2 * u]], C.ink);
    if (o.hood) { f.clip = [0, 0, f.w, Math.round(y + .5 * u)]; f.ell(x - .3 * u, y - .3 * u, r * 1.2, r * 1.16, (X, Y, nx, ny) => (-nx * .6 - ny * .5) > .45 ? C.cyan : C.blue); f.clip = [0, 0, f.w, f.h]; }
  }
  if (who === 'kid') {
    f.clip = [0, 0, f.w, Math.round(y - r * .1)]; f.ell(x - .3 * u, y - .3 * u, r * 1.1, r * 1.08, (X, Y, nx, ny) => (-nx * .6 - ny * .6) > .5 ? C.brown : C.dbrown); f.clip = [0, 0, f.w, f.h];
    f.poly([[x - r * .9, y - r * .2], [x - r * 1.05, y + r * .5], [x - r * .5, y + r * .1]], C.dbrown);
    f.poly([[x - 1.5 * u, y - r * .9], [x - 3.2 * u, y - r - 4 * u], [x + .2 * u, y - r * .95], [x + 1.4 * u, y - r - 3 * u], [x + 2.4 * u, y - r * .85]], C.dbrown);
    if (o.wet) f.px(x + r * .9, y + r * .2, C.cyan);
  }
  if (who === 'lady') {
    f.clip = [0, 0, f.w, Math.round(y - r * .05)]; f.ell(x - .2 * u, y - .2 * u, r * 1.08, r * 1.06, (X, Y, nx, ny) => (-nx * .6 - ny * .6) > .5 ? C.silver : C.steel); f.clip = [0, 0, f.w, f.h];
    f.ell(x - r * .55, y - r * .95, 2.4 * u, 2.1 * u, C.steel); f.px(x - r * .55 - 2 * u, y - r * 1.2, C.crimson); f.px(x - r * .55 - 1 * u, y - r * 1.05, C.crimson);
    f.poly([[x - r * 1.05, y - r * .1], [x - r * .5, y - r * .1], [x - r * .7, y + r * .6], [x - r * 1.0, y + r * .7]], C.steel);
  }
  // eye: 1×2 ink (closed: 2×1) ; mouth pixel
  const blink = o.blink || (o.expr === 'sleepy');
  if (blink) f.rect(ex - .5 * u, ey + .5 * u, Math.max(2, 1.6 * u), Math.max(1, .6 * u), C.ink);
  else f.rect(ex, ey - .5 * u, Math.max(1, .8 * u), Math.max(2, 1.6 * u), C.ink);
  if (o.mouthOpen) f.rect(x + r * .55, y + r * .6, Math.max(1, u), Math.max(1, u), C.crimson);
  if (o.sweat) f.px(x + r * 1.1, y - r * .4, C.cyan);
}

// —— keyframed pose blending ——
const KEYS = ['lean', 'hipY', 'hipX', 'headTilt', 'sq', 'look'];
export function blend(a, b, k) {
  const o = {}; a = { ...POSE0, ...a }; b = { ...POSE0, ...b };
  for (const key of KEYS) o[key] = lerp(a[key] ?? 0, b[key] ?? 0, k);
  for (const key of ['armB', 'armF', 'legB', 'legF']) o[key] = [lerp(a[key][0], b[key][0], k), lerp(a[key][1], b[key][1], k)];
  return o;
}
// keys: [[t, pose, ease?]], ease fn applies to the segment arriving at that key
export function poseAt(keys, t) {
  if (t <= keys[0][0]) return { ...POSE0, ...keys[0][1] };
  for (let i = 1; i < keys.length; i++) if (t < keys[i][0]) { const [t0, p0] = keys[i - 1], [t1, p1, ez] = keys[i]; const k = (t - t0) / (t1 - t0); return blend(p0, p1, (ez || (x => x * x * (3 - 2 * x)))(k)); }
  return { ...POSE0, ...keys[keys.length - 1][1] };
}
// common poses
export const POSES = {
  stand: { armB: [8, 18], armF: [-6, 22], legB: [-4, 2], legF: [5, 2] },
  breathe: { hipY: -.3, armB: [8, 18], armF: [-6, 22], legB: [-4, 2], legF: [5, 2] },
  walk0: { armB: [25, 20], armF: [-25, 30], legB: [-22, 10], legF: [22, 4] },
  walk1: { hipY: -.6, armB: [5, 20], armF: [-5, 25], legB: [-2, 30], legF: [4, 2] },
  walk2: { armB: [-25, 30], armF: [25, 20], legB: [22, 4], legF: [-22, 10] },
  walk3: { hipY: -.6, armB: [-5, 25], armF: [5, 20], legB: [4, 2], legF: [-2, 30] },
  ride: { hipY: 3.5, lean: 18, armB: [70, 15], armF: [75, 10], legB: [70, -80], legF: [80, -85] },
  sitSleep: { hipY: 4, lean: 38, headTilt: 25, armB: [60, 40], armF: [65, 45], legB: [65, -80], legF: [75, -85] },
  crouch: { hipY: 3, lean: 15, sq: .86, armB: [-20, 40], armF: [-25, 45], legB: [50, -95], legF: [55, -100] },
  jump: { hipY: -1, lean: -5, sq: 1.12, armB: [150, 10], armF: [160, 5], legB: [-10, 15], legF: [15, -20] },
  shock: { hipY: -1.5, lean: -12, sq: 1.08, armB: [120, 40], armF: [130, 35], legB: [-12, 5], legF: [12, 5] },
  holdUp: { armB: [10, 20], armF: [150, 15], legB: [-4, 2], legF: [5, 2] },
  holdFront: { armB: [60, 50], armF: [70, 45], legB: [-4, 2], legF: [5, 2] },
  reach: { lean: 8, armB: [40, 20], armF: [90, 5], legB: [-8, 2], legF: [10, 2] },
  pat: { lean: 22, hipY: 1, armB: [30, 20], armF: [70, -10], legB: [-10, 10], legF: [25, -25] },
  knock: { armB: [8, 18], armF: [60, 70], legB: [-4, 2], legF: [5, 2] },
  knock2: { lean: 4, armB: [8, 18], armF: [85, 40], legB: [-4, 2], legF: [5, 2] },
  slump: { hipY: 2.5, lean: 25, headTilt: 20, armB: [15, 10], armF: [10, 10], legB: [-5, 10], legF: [10, 10] },
  flop: { hipY: 8.5, lean: 80, headTilt: 10, armB: [100, 0], armF: [95, 0], legB: [80, -10], legF: [90, -5] },
  climb0: { lean: 22, hipY: .5, armB: [30, 20], armF: [60, 60], legB: [-15, 20], legF: [55, -70] },
  climb1: { lean: 22, hipY: -1, armB: [10, 20], armF: [60, 60], legB: [15, -10], legF: [10, -5] },
  bow: { lean: 30, hipY: .5, headTilt: 15, armB: [20, 10], armF: [25, 10], legB: [-6, 4], legF: [6, 4] },
  shrug: { armB: [30, 90], armF: [35, 95], legB: [-4, 2], legF: [5, 2], headTilt: -6 },
  sing: { armB: [8, 18], armF: [75, 70], legB: [-4, 2], legF: [5, 2], headTilt: -8 },
  shiver: { lean: 6, armB: [20, 120], armF: [25, 125], legB: [-3, 3], legF: [3, 3], headTilt: 8 },
  sit: { hipY: 4.5, lean: 4, armB: [30, 40], armF: [35, 45], legB: [80, -85], legF: [85, -88] },
  hunch: { lean: 22, hipY: 1, armB: [40, 60], armF: [45, 65], legB: [-4, 6], legF: [6, 6], headTilt: 10 },
};
