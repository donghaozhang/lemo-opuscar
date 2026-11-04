// 愚公移山 · the cast as carved figures (profile, facing +x; feet at y = 0, up is −y)
// Every body part is a cached carved shape in its own local space (hatching rides with the limb, no boil).
// Faces are white (carved) skin with black features drawn per frame, so the eyes and brows can act.
//   drawFig(g, M, who, pose, t)  → joints in local space (hands, head, shoulder) for props and follow-through
import * as WC from './engine/index.js';
import { part, drawPart, mul, T, R, S, about, put, ap } from './rig.js';
import * as INK from './ink.js';
import { clamp, lerp } from '/core/lib.js';

const PI = Math.PI;
export const LK = WC.light(.8, -.5, .26);              // grazing key from the front and above
const NULLG = (() => { const c = document.createElement('canvas'); c.width = c.height = 2; return c.getContext('2d'); })();

// ---------------------------------------------------------------- shape builders (local space)
// limb from (0,0) down to (0,len), radii r0 → r1
export function capsule(len, r0, r1, n = 7) {
  const P = [];
  for (let i = 0; i <= n; i++) { const a = PI + i / n * PI; P.push([Math.cos(a) * r0 * -1, Math.sin(a) * r0 * .9]); }
  for (let i = 0; i <= n; i++) { const a = i / n * PI; P.push([Math.cos(a) * r1, len + Math.sin(a) * r1 * .9]); }
  return P;
}
const head = (s, o = {}) => {             // profile head outline facing +x, centre (0,0), radius s
  const nose = o.nose ?? 1, chin = o.chin ?? 1, crown = o.crown ?? 1;
  return [[-.05, -1.0 * crown], [.4, -.95 * crown], [.66, -.62], [.76, -.28], [.8, -.12], [.8 + .2 * nose, .1 + .02 * nose], [.82, .22], [.84, .33], [.79, .42], [.82, .5], [.76 * chin, .7], [.5, .8], [.15, .66], [-.25, .52], [-.62, .3], [-.86, -.05], [-.78, -.55], [-.45, -.88]].map(([x, y]) => [x * s, y * s]);
};

// ---------------------------------------------------------------- the cast
// dims: hip height, thigh, shin, torso (hip→neck), shoulder offset, upper arm, forearm, head radius
const CAST = {
  yugong: {
    hip: 226, th: 108, sh: 112, torso: 176, shX: 2, ua: 96, fa: 88, hr: 56, headOff: [34, -44], foot: 46, limb: [27, 18], arm: [22, 16],
    beard: true, crown: .95, nose: 1.15,
    // short jacket over a hunched back, rope belt, to mid-thigh
    torsoPoly: [[-46, 40], [-60, -40], [-66, -110], [-56, -160], [-30, -190], [10, -198], [40, -180], [56, -130], [60, -60], [58, 0], [64, 46], [10, 56]],
    folds: [[[-50, -10], [58, -6]], [[-36, -150], [-46, -80], [-44, 20]], [[30, -160], [40, -90], [44, -20]]],
    sleeve: [26, 34],
  },
  son: {
    hip: 296, th: 146, sh: 148, torso: 228, shX: 4, ua: 126, fa: 116, hr: 52, headOff: [22, -48], foot: 54, limb: [33, 22], arm: [27, 20],
    cloth: true, nose: 1, crown: 1,
    torsoPoly: [[-54, 40], [-64, -60], [-68, -150], [-56, -206], [-20, -236], [26, -238], [62, -212], [74, -150], [70, -60], [62, 0], [68, 44], [6, 56]],
    folds: [[[-58, -8], [66, -4]], [[-40, -190], [-48, -100]], [[40, -190], [52, -110]]],
    sleeve: [30, 26],
  },
  grandson: {
    hip: 248, th: 122, sh: 124, torso: 190, shX: 4, ua: 106, fa: 98, hr: 48, headOff: [18, -44], foot: 46, limb: [27, 18], arm: [22, 16],
    cloth: true, nose: .9, crown: 1,
    torsoPoly: [[-44, 36], [-52, -50], [-54, -126], [-44, -172], [-14, -196], [22, -198], [50, -176], [58, -120], [56, -50], [50, 0], [54, 38], [4, 48]],
    folds: [[[-48, -6], [54, -2]], [[-30, -160], [-38, -80]]],
    sleeve: [24, 22],
  },
  boy: {
    hip: 136, th: 66, sh: 66, torso: 112, shX: 4, ua: 60, fa: 54, hr: 52, headOff: [12, -50], foot: 32, limb: [17, 13], arm: [14, 11],
    buns: true, nose: .55, crown: 1.05, chin: .9,
    torsoPoly: [[-30, 30], [-36, -40], [-36, -90], [-24, -116], [4, -124], [28, -112], [38, -76], [38, -20], [40, 30], [4, 36]],
    folds: [[[-20, -100], [-24, -30]]],
    sleeve: [16, 14],
  },
  zhisou: {
    hip: 334, th: 162, sh: 168, torso: 264, shX: 6, ua: 140, fa: 128, hr: 50, headOff: [16, -50], foot: 54, limb: [22, 16], arm: [20, 15],
    hat: true, goatee: true, nose: 1.4, crown: 1, chin: 1.1,
    // long scholar's robe to the ankle, flaring
    torsoPoly: [[-40, 0], [-44, -100], [-42, -196], [-30, -250], [4, -272], [34, -256], [46, -190], [48, -90], [50, 0], [74, 200], [84, 318], [-64, 318], [-56, 200]],
    folds: [[[-22, -230], [-26, -100], [-34, 80], [-40, 300]], [[24, -210], [28, -60], [40, 140], [50, 300]], [[-44, -4], [52, -2]]],
    sleeve: [28, 30], robeLong: true,
  },
};

// pose: angles in radians; limbs 0 = hanging straight down, + = swung forward (+x)
export const POSE = {
  stand: { lean: 0, head: 0, a1: .08, e1: .15, a2: -.06, e2: .12, q1: 0, k1: 0, q2: 0, k2: 0 },
};
const LIMB = a => R(-a);                       // rotate a down-pointing limb forward by a

function parts(who) {
  const D = CAST[who], key = n => who + '.' + n;
  const P = {};
  const limbDef = (len, r0, r1, extra = {}) => ({ poly: capsule(len, r0, r1), light: LK, R: 16, sp: 6, lo: .5, hi: .95, k: 1.2, amb: 0, a0: PI / 2, halo: 5, ...extra });
  P.thigh = part(key('thigh'), limbDef(D.th + 8, D.limb[0], D.limb[0] * .86, { seed: 3 }));
  // trouser leg flares a little at the bottom, bound at the ankle
  const sh = D.sh, r0 = D.limb[0] * .86, r1 = D.limb[1];
  P.shin = part(key('shin'), { poly: [[-r0, -4], [r0, -4], [r0 * .95, sh * .5], [r1 * 1.2, sh * .82], [r1 * .9, sh + 4], [-r1 * .9, sh + 4], [-r1 * 1.25, sh * .8], [-r0 * 1.02, sh * .45]], light: LK, R: 14, sp: 6, lo: .5, k: 1.2, a0: PI / 2, halo: 5, seed: 4,
    feats: [{ cp: [[-r1, sh * .86], [r1, sh * .78]], w: 2.4 }, { cp: [[-r1, sh * .74], [r1 * 1.1, sh * .66]], w: 2.2 }] });
  const fl = D.foot;
  P.foot = part(key('foot'), { poly: [[-r1 * .9, -8], [r1 * .7, -10], [fl * .7, -4], [fl, 6], [fl * .96, 12], [-r1 * 1.05, 12]], light: LK, R: 8, sp: 4, lo: .5, halo: 4, seed: 5,
    feats: [{ cp: [[-r1, 9], [fl * .95, 9]], w: 2.4 }] });
  const [sw, cw] = D.sleeve, ua = D.ua, fa = D.fa;
  // sleeve: wide at the shoulder, hanging folds; forearm sleeve opens at the cuff
  P.upper = part(key('upper'), { poly: [[-sw * .85, -14], [sw * .7, -16], [sw * .95, ua * .45], [sw * .8, ua + 6], [-sw * .7, ua + 8], [-sw * 1.0, ua * .5]], light: LK, R: 18, sp: 6, lo: .48, k: 1.2, a0: PI / 2, halo: 5, seed: 6,
    feats: [{ cp: [[-sw * .3, 10], [-sw * .4, ua * .6]], w: 2.2 }] });
  P.fore = part(key('fore'), { poly: [[-sw * .7, -6], [sw * .7, -6], [cw * .95, fa * .7], [cw * 1.15, fa + 2], [-cw * 1.05, fa + 4], [-cw * .85, fa * .6]], light: LK, R: 14, sp: 6, lo: .48, k: 1.2, a0: PI / 2, halo: 5, seed: 7,
    feats: [{ cp: [[-cw * .9, fa - 8], [cw, fa - 10]], w: 2.4 }] });
  const hr = D.arm[1] * 1.35;
  P.hand = part(key('hand'), { cp: [[-hr * .8, -2], [hr * .75, -2], [hr * 1.15, hr * .7], [hr * 1.0, hr * 1.5], [hr * .3, hr * 1.95], [-hr * .5, hr * 1.7], [-hr * .95, hr * .9]], white: true, light: LK, R: 6, sp: 4, lo: .7, amb: .3, halo: 4, seed: 8,
    feats: [{ cp: [[hr * .9, hr * .9], [hr * .35, hr * 1.1]], w: 2.2, black: true }] });
  P.torso = part(key('torso'), { cp: D.torsoPoly, light: LK, R: 34, sp: 6.5, lo: .45, hi: .95, k: 1.15, a0: PI / 2 + .08, depth: 34, halo: 6, seed: 9,
    feats: (D.folds || []).map(cp => ({ cp, w: 2.8, seg: [30, 90], gap: [4, 10] })) });
  P.head = part(key('head'), { cp: head(D.hr, D), white: true, outline: 3.4, light: WC.light(.6, -.5, .62), R: D.hr * .7, sp: 4.5, lo: .62, hi: .98, amb: .25, k: .9, halo: 5, seed: 10, dir: 'contour' });
  const hh = D.hr;
  if (D.beard) P.beard = part(key('beard'), { cp: [[.45, .22], [.86, .36], [1.0, .9], [1.02, 1.6], [.92, 2.3], [.74, 2.85], [.6, 2.45], [.36, 1.85], [.08, 1.3], [-.18, .92], [-.12, .52], [.18, .36]].map(([x, y]) => [x * hh, y * hh]),
    white: true, outline: 2.6, light: WC.light(.7, -.3, .6), R: 14, sp: 5, lo: .55, amb: .25, k: .8, halo: 4, seed: 11, dir: PI / 2 + .25,
    feats: [0, 1, 2, 3, 4].map(i => ({ cp: [[(.3 + i * .13) * hh, (.62 + i * .05) * hh], [(.38 + i * .12) * hh, (1.35 + i * .1) * hh], [(.48 + i * .06) * hh, (2.0 + i * .14 - (i === 4 ? .45 : 0)) * hh]], w: 2.4, seg: [30, 80], gap: [3, 9] })) });
  if (D.beard) P.hair = part(key('hair'), { cp: [[-.2, -.8], [-.64, -.62], [-.88, -.2], [-.86, .2], [-.62, .46], [-.42, .22], [-.5, -.14], [-.3, -.5]].map(([x, y]) => [x * hh, y * hh]),
    white: true, outline: 2.2, light: WC.light(-.3, -.6, .6), R: 8, sp: 4, lo: .55, amb: .3, halo: 2, seed: 12, dir: PI / 2 + .6,
    feats: [{ cp: [[-.5 * hh, -.5 * hh], [-.74 * hh, -.1 * hh], [-.7 * hh, .3 * hh]], w: 1.8 }] });
  if (D.beard) P.knot = part(key('knot'), { cp: [[-.24, -.88], [-.14, -1.2], [.12, -1.24], [.24, -.98], [.12, -.84]].map(([x, y]) => [x * hh, y * hh]), light: LK, R: 6, sp: 3, lo: .5, halo: 3, seed: 13,
    feats: [{ cp: [[-.4 * hh, -1.0 * hh], [.4 * hh, -1.14 * hh]], w: 3.2, black: false }] });
  if (D.cloth) P.cloth = part(key('cloth'), { cp: [[-.95, -.15], [-.72, -.84], [0, -1.12], [.62, -.88], [.76, -.5], [.4, -.44], [-.2, -.34], [-.7, .02], [-1.25, .5], [-1.32, .22]].map(([x, y]) => [x * hh, y * hh]), light: LK, R: 10, sp: 4, lo: .45, halo: 3, seed: 14,
    feats: [{ cp: [[-.5 * hh, -.72 * hh], [.2 * hh, -.86 * hh], [.6 * hh, -.62 * hh]], w: 2.4 }] });
  if (D.buns) P.buns = part(key('buns'), { cp: [[-.9, .1], [-.9, -.6], [-.5, -1.0], [.1, -1.06], [.52, -.86], [.68, -.56], [.5, -.5], [.3, -.62], [0, -.56], [-.3, -.42], [-.5, -.2], [-.56, .16]].map(([x, y]) => [x * hh, y * hh]), light: LK, R: 10, sp: 3.5, lo: .45, halo: 3, seed: 15, dir: 'contour' });
  if (D.buns) P.bun = part(key('bun'), { poly: WC.ellipse(0, 0, hh * .36, hh * .32, 20), light: LK, R: 8, sp: 3.5, lo: .4, halo: 3, seed: 16, dir: WC.dirRing(0, 0) });
  if (D.hat) P.hat = part(key('hat'), { poly: [[-.82, -.3], [-.9, -1.9], [.52, -2.0], [.62, -.5], [.66, -.36], [-.3, -.3], [-.7, .1], [-1.15, .7], [-1.25, .62], [-.92, -.06]].map(([x, y]) => [x * hh, y * hh]), light: LK, R: 12, sp: 4, lo: .4, halo: 4, seed: 17, a0: PI / 2,
    feats: [{ cp: [[-.86 * hh, -.66 * hh], [.6 * hh, -.7 * hh]], w: 3.2 }, { cp: [[-.88 * hh, -1.2 * hh], [.56 * hh, -1.28 * hh]], w: 2.6 }] });
  if (D.goatee) P.goatee = part(key('goatee'), { cp: [[.5, .64], [.8, .74], [.74, 1.3], [.62, 1.85], [.52, 1.3], [.42, .9]].map(([x, y]) => [x * hh, y * hh]), light: LK, R: 4, sp: 3, lo: .5, halo: 2, seed: 18, dir: PI / 2 });
  if (D.goatee) P.mous = part(key('mous'), { cp: [[.62, .3], [.9, .34], [1.15, .5], [1.0, .44], [.8, .44], [.6, .4]].map(([x, y]) => [x * hh, y * hh]), light: LK, R: 3, sp: 3, lo: .6, halo: 2, seed: 19, dir: 0 });
  return P;
}
const PARTS = {};
const getParts = who => PARTS[who] || (PARTS[who] = parts(who));

// ---------------------------------------------------------------- the face in profile (per frame, black on white skin)
// expr: { brow: -1 (worried/sad: inner end up) .. +1 (angry/determined: inner end down), open: eye openness 0..1,
//         look: [x,y], mouth: 'flat'|'smile'|'laugh'|'open'|'pout'|'grin'|'frown', jaw: 0..1, squint }
export const EXPR = {
  neutral: { brow: 0, open: .9, mouth: 'flat' },
  weary: { brow: -.6, open: .55, mouth: 'frown', look: [0, .3] },
  resolve: { brow: .8, open: .75, mouth: 'flat' },
  laugh: { brow: -.2, open: .1, mouth: 'laugh', jaw: .8 },
  smile: { brow: -.2, open: .6, mouth: 'smile' },
  serene: { brow: -.3, open: 0, mouth: 'smile' },
  grin: { brow: -.3, open: 1, mouth: 'grin', jaw: .5 },
  pout: { brow: .9, open: .85, mouth: 'pout' },
  sneer: { brow: .5, open: .45, mouth: 'smile', look: [0, .2] },
  shock: { brow: -.9, open: 1.15, mouth: 'open', jaw: 1 },
  up: { brow: -.4, open: 1, mouth: 'open', jaw: .3, look: [.2, -1] },
};
function face(g, D, e) {
  const k = D.hr, ex = .5 * k, ey = -.12 * k;
  const open = e.open ?? .9, look = e.look || [0, 0];
  // ear
  INK.taper(g, [[-.12 * k, -.12 * k], [-.32 * k, -.05 * k], [-.3 * k, .2 * k], [-.1 * k, .22 * k]], 3.4, '#000', { a: .2, b: .2 });
  // eye (profile): sclera, iris, pupil, lids
  INK.eye(g, ex, ey, .4 * k, { open, prof: 1, lookX: look[0] + .2, lookY: look[1], lid: 1.2 });
  // brow: thick, angle by expression (inner end = toward the nose = +x in profile)
  const b = e.brow ?? 0, by = ey - .22 * k;
  INK.taper(g, [[ex - .22 * k, by - .02 * k + b * .02 * k], [ex, by - .06 * k], [ex + .2 * k, by + b * .09 * k]], .085 * k + 2, '#000', { a: .05, b: .3, seed: 3 });
  // wrinkles for the old men
  if (D.beard || D.goatee) {
    INK.taper(g, [[ex - .3 * k, ey - .02 * k], [ex - .4 * k, ey + .08 * k]], 2.2, '#000');
    INK.taper(g, [[.1 * k, -.62 * k], [.4 * k, -.6 * k]], 2, '#000'); INK.taper(g, [[.05 * k, -.5 * k], [.36 * k, -.48 * k]], 2, '#000');
    INK.taper(g, [[.62 * k, .08 * k], [.56 * k, .3 * k], [.68 * k, .42 * k]], 2.4, '#000');   // naso-labial
  }
  // nostril
  INK.taper(g, [[.84 * k, .18 * k], [.9 * k, .2 * k]], 3, '#000');
  // mouth
  const mx = .8 * k, my = .42 * k, jaw = e.jaw ?? 0;
  switch (e.mouth) {
    case 'smile': INK.taper(g, [[mx - .22 * k, my - .1 * k], [mx - .1 * k, my + .02 * k], [mx + .04 * k, my]], 3.2, '#000'); break;
    case 'grin': case 'laugh': case 'open': {
      const w = e.mouth === 'open' ? .14 : .26, h = .1 + jaw * (e.mouth === 'open' ? .26 : .2);
      INK.poly(g, [[mx + .04 * k, my - .06 * k], [mx - w * k, my - .1 * k], [mx - w * .7 * k, my + h * k], [mx + .02 * k, my + h * .8 * k]], '#000');
      if (e.mouth === 'grin' && D.buns) {    // the gap-toothed grin: two teeth with a gap
        INK.poly(g, [[mx - .02 * k, my - .06 * k], [mx - .1 * k, my - .07 * k], [mx - .1 * k, my + .0 * k], [mx - .02 * k, my + .0 * k]], '#fff');
        INK.poly(g, [[mx - .17 * k, my - .08 * k], [mx - .23 * k, my - .09 * k], [mx - .22 * k, my - .02 * k], [mx - .16 * k, my - .01 * k]], '#fff');
      }
      break;
    }
    case 'pout': INK.taper(g, [[mx - .16 * k, my + .04 * k], [mx - .06 * k, my - .04 * k], [mx + .05 * k, my + .02 * k]], 3.6, '#000'); INK.blob(g, mx + .04 * k, my + .06 * k, .05 * k, .03 * k); break;
    case 'frown': INK.taper(g, [[mx - .18 * k, my + .06 * k], [mx - .06 * k, my - .02 * k], [mx + .03 * k, my + .01 * k]], 3, '#000'); break;
    default: INK.taper(g, [[mx - .16 * k, my], [mx + .03 * k, my - .01 * k]], 3, '#000');
  }
}

// ---------------------------------------------------------------- draw a figure
// pose fields: lean, head, a1/e1 (near arm shoulder/elbow), a2/e2 (far arm), w1/w2 (wrists), q1/k1 (near hip/knee), q2/k2 (far),
//   expr (name or object), beard (swing), hold: { kind, ... } for props drawn in the near hand (see props.js), squash (1 = none)
// pass-based: 1) every halo (one white silhouette edge for the whole figure), 2) parts in depth order
// (fill + hatching + feature cuts); near limbs get a thin knife contour where they cross the body.
function sepCut(P) { return P.sep || (P.sep = WC.cutAlong(WC.offsetPoly(P.outline, 1.2), { closed: true, w: 2.6, kind: 'k', seg: [50, 160], gap: [2, 6], seed: 21 })); }
function bodyOf(g, P, t, sep) {
  if (sep) WC.drawStrokes(g, sepCut(P), { t, color: '#fff' });
  if (P.S) { WC.fillPoly(g, [P.outline], P.def.white ? '#fff' : '#000'); WC.drawStrokes(g, P.S.strokes, { t, color: P.def.white ? '#000' : '#fff' }); }
  if (P.def.outline) { P.ol = P.ol || WC.cutAlong(WC.offsetPoly(P.outline, -P.def.outline * .45), { closed: true, w: P.def.outline, kind: 'k', seg: [60, 200], gap: [0, 1], seed: 9, jw: .2 }); WC.drawStrokes(g, P.ol, { t, color: '#000' }); }
  for (const f of P.feats) { if (f.poly) WC.fillPoly(g, [f.poly], f.col); else WC.drawStrokes(g, f.st, { t, color: f.col }); }
}
export function drawFig(g, M, who, pose = {}, t = 1e9, o = {}) {
  if (o.measure) g = NULLG;
  const D = CAST[who], P = getParts(who), p = { ...POSE.stand, ...pose };
  const sq = p.squash ?? 1;
  if (sq !== 1) M = mul(M, S(1 / Math.sqrt(sq), sq));
  const hipN = [8, -D.hip], hipF = [-8, -D.hip];
  const leg = (hip, q, k) => { const th = mul(T(...hip), LIMB(q)), sh = mul(th, mul(T(0, D.th), LIMB(-k))), ft = mul(sh, mul(T(0, D.sh), LIMB(k - q))); return [th, sh, ft]; };
  const [nT, nS, nF] = leg(hipN, p.q1, p.k1), [fT, fS, fF] = leg(hipF, p.q2, p.k2);
  const lowest = o.free ? 0 : Math.max(ap(nF, 0, 12)[1], ap(fF, 0, 12)[1], ap(nF, D.foot, 12)[1], ap(fF, D.foot, 12)[1]);
  M = mul(M, T(0, -lowest - (p.lift ?? 0)));
  const root = mul(T(0, -D.hip), R(p.lean));
  const shN = [D.shX, -D.torso + 16], shF = [D.shX - 14, -D.torso + 20];
  const arm = (sh, a, e, w) => { const up = mul(root, mul(T(...sh), LIMB(a))), fo = mul(up, mul(T(0, D.ua), LIMB(e))), ha = mul(fo, mul(T(0, D.fa), LIMB(w ?? 0))); return [up, fo, ha]; };
  const [fu, ff, fh] = arm(shF, p.a2, p.e2, p.w2), [nu, nf, nh] = arm(shN, p.a1, p.e1, p.w1);
  const neck = [10, -D.torso], hd = mul(root, mul(T(...neck), mul(R(p.head), T(...D.headOff))));
  const tm = A => mul(M, A);
  const ex = typeof p.expr === 'string' ? EXPR[p.expr] : (p.expr || EXPR.neutral);
  const out = { M, hand: tm(nh), farHand: tm(fh), head: tm(hd), root: tm(root), shoulder: tm(mul(root, T(...shN))), farShoulder: tm(mul(root, T(...shF))), hr: D.hr };
  // display list in depth order: [matrix, part, sep]
  const L = [];
  L.push([fu, P.upper], [ff, P.fore], [fh, P.hand], [fT, P.thigh], [fS, P.shin], [fF, P.foot]);
  if (!D.robeLong) L.push([nT, P.thigh, 1], [nS, P.shin, 1], [nF, P.foot, 1]);
  L.push([root, P.torso]);
  if (D.robeLong) L.push([nF, P.foot]);
  const H = [];
  if (P.bun) H.push([mul(hd, T(-.66 * D.hr, -.86 * D.hr)), P.bun]);
  H.push([hd, P.head]);
  if (P.hair) H.push([hd, P.hair]); if (P.knot) H.push([hd, P.knot]); if (P.cloth) H.push([hd, P.cloth]); if (P.buns) H.push([hd, P.buns]);
  if (P.bun) H.push([mul(hd, T(.02 * D.hr, -1.14 * D.hr)), P.bun]);
  if (P.hat) H.push([hd, P.hat]);
  const bd = mul(hd, about(.4 * D.hr, .3 * D.hr, p.beard ?? 0));
  const A = [[nu, P.upper, 1], [nf, P.fore, 1], [nh, P.hand, 1]];
  // pass 1: halos
  for (const [Mx, Pt] of [...L, ...H, ...A, ...(P.beard ? [[bd, P.beard]] : [])]) put(g, tm(Mx), () => { if (Pt.S && Pt.S.halo.length) WC.drawStrokes(g, Pt.S.halo, { t, color: '#fff' }); });
  if (o.under) o.under(g, out);
  if (o.farProp) put(g, tm(fh), () => o.farProp(g, out));
  for (const [Mx, Pt, sep] of L) put(g, tm(Mx), () => bodyOf(g, Pt, t, sep));
  if (o.back) o.back(g, out);
  for (const [Mx, Pt] of H) put(g, tm(Mx), () => bodyOf(g, Pt, t, 0));
  put(g, tm(hd), () => {
    face(g, D, ex);
    if (P.goatee) { bodyOf(g, P.goatee, t, 0); bodyOf(g, P.mous, t, 0); }
  });
  if (P.beard) put(g, tm(bd), () => {
    bodyOf(g, P.beard, t, 0);
    if (ex.mouth === 'laugh' || ex.mouth === 'open' || ex.mouth === 'grin') { const k = D.hr, j = ex.jaw ?? 0; INK.poly(g, [[.68 * k, .38 * k], [.88 * k, .4 * k], [.84 * k, (.54 + j * .24) * k], [.64 * k, (.52 + j * .2) * k]], '#000'); }
  });
  if (o.prop) put(g, tm(nh), () => o.prop(g, out));
  for (const [Mx, Pt, sep] of A) put(g, tm(Mx), () => bodyOf(g, Pt, t, sep));
  if (o.front) o.front(g, out);
  return out;
}

// blend two poses (numbers lerp; strings switch at u = .5)
export function blend(A, B, u) {
  const o = { ...A };
  for (const k of Object.keys(B)) { const a = A[k], b = B[k]; o[k] = typeof b === 'number' ? lerp(typeof a === 'number' ? a : 0, b, u) : (u < .5 ? (a ?? b) : b); }
  if (A.expr && B.expr && typeof A.expr !== 'string' && typeof B.expr !== 'string') o.expr = blend(A.expr, B.expr, u);
  return o;
}
// keyframed pose track: keys [[t, pose], ...] with smoothstep easing between them
export function track(keys, t, ease = u => u * u * (3 - 2 * u)) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (t < keys[i][0]) { const u = (t - keys[i - 1][0]) / (keys[i][0] - keys[i - 1][0]); return blend(keys[i - 1][1], keys[i][1], ease(u)); }
  return keys[keys.length - 1][1];
}
export const twos = t => Math.floor(t * 12) / 12;      // characters on twos
export { CAST };
