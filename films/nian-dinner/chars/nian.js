// 年兽: a big shaggy ball of deep-red paper (profile facing left). Round body with sawtooth fur all round, round head with two curled horns,
// one huge eye (swappable face pieces), a hinged jaw with sawtooth teeth, two arms with oversized paws, two short legs, a tufted tail.
// Units: body centre at the origin; ground at +GROUND when standing on its legs.
import { PAL, piece, P, trace, fill, cut, cutTaper, inset, within, ellipsePoly, curve } from '../engine/paper.js';
import { sawRow, sawEdge, crescent, crescentPts, crescentRows, swirl, doubleSwirl, rosette, plum, dots, taper, along } from '../engine/motifs.js';
import { mul, T, R, S, put, ap } from '../engine/rig.js';

export const NIAN = '#b0141c', NIAN_FAR = '#8a0c20', NIAN_NEAR = '#c4162c';
const N = {};
export const NJ = { neck: [-150, -210], jaw: [-120, 60], shF: [-210, -40], shB: [120, -60], hipF: [-110, 190], hipB: [130, 180], tail: [250, 120], elbow: [0, 120], knee: [0, 110], paw: [0, 150], foot: [0, 120], ground: 420 };

const circle = (cx, cy, r, n = 64, wob = 0) => { const o = []; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; const rr = r * (1 + wob * Math.sin(a * 5 + 1) + wob * .6 * Math.sin(a * 9)); o.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); } return o; };
function bodyPiece() {
  return piece([-400, -400, 420, 320], g => {
    const base = circle(0, 0, 300, 72, .03).map(([x, y]) => [x * 1.08, y * .94]);
    const out = sawEdge(base.concat([base[0]]), 26, 24, 1, .35, 3);
    fill(g, q => trace(q, out), NIAN);
    inset(g, base, 7, 3, NIAN);
    within(g, base, () => {
      // belly: a lighter-feeling patch of crescent rows (a shaggy chest)
      const belly = ellipsePoly(-40, 70, 170, 150, 0, 40);
      cutTaper(g, belly.slice(0, 41), 5);
      within(g, belly, () => crescentRows(g, -210, -80, 130, 220, 20, 7, 0, .72));
      // shoulder and hip swirls (joints)
      doubleSwirl(g, -190, -60, 90, 9, -.4); doubleSwirl(g, 150, -60, 80, 8, 2.6);
      swirl(g, -110, 170, 40, 1.8, 7, .5, 1); swirl(g, 140, 170, 40, 1.8, 7, 2.5, -1);
      // fur lines along the back
      for (const [x, y] of [[-40, -230], [40, -236], [120, -220], [-120, -220]]) cutTaper(g, curve([[x, y], [x + 8, y + 40], [x - 2, y + 80]], false, 3), 6);
      dots(g, along(curve([[-200, -170], [0, -200], [200, -160]], false, 3), 36).map(p => [p.x, p.y]), 7);
    });
  }, { seed: 41, col: NIAN, ss: 2 });
}
// head: origin = neck joint; the face looks left. Head circle centre (-70,-120) r 190
const HC = [-70, -120], HR = 190;
export function nianFace(expr) {
  // eye at E; open = upper lid height 0..1; pr = pupil radius; brow [innerDy (left end), outerDy]; lids: 'half' lowers the upper lid
  const F = {
    lonely: { open: .55, pr: 24, px: -4, py: 4, brow: [-16, 8], half: true },
    normal: { open: .95, pr: 26, px: -2, py: 0, brow: [0, 0] },
    sniff: { open: .25, pr: 18, px: -8, py: 6, brow: [-6, 4] },
    sneeze: { open: 0, pr: 0, brow: [10, -14], squeeze: true },
    panic: { open: 1.25, pr: 11, px: 0, py: -4, brow: [-26, -22] },
    happy: { open: 0, pr: 0, brow: [-6, -6], arc: true },
    eat: { open: .7, pr: 24, px: -2, py: 6, brow: [-4, -2] },
    determined: { open: .6, pr: 22, px: -6, py: -2, brow: [18, -8] },
    soft: { open: .5, pr: 30, px: -2, py: 2, brow: [-8, 2], half: true },
    curious: { open: 1.05, pr: 28, px: -6, py: -2, brow: [-10, -4] },
    lookup: { open: .9, pr: 26, px: 0, py: -14, brow: [-6, -4] },
  };
  return F[expr] || F.normal;
}
function faceCuts(g, expr) {
  const f = nianFace(expr), E = [-120, -150];
  if (f.open > 0) {
    const up = 10 + 34 * f.open;
    crescent(g, E[0], E[1] + (f.half ? 14 : 4), 58, Math.PI * 1.04, Math.PI * 1.96, up);      // upper lid
    crescent(g, E[0], E[1] - 2, 56, Math.PI * .08, Math.PI * .92, 9);                         // lower lid
    cut(g, q => q.arc(E[0] + f.px, E[1] + f.py, f.pr, 0, 7));                                 // pupil hole
  } else if (f.squeeze) {
    crescent(g, E[0], E[1] + 10, 50, Math.PI * .1, Math.PI * .9, 14);                         // squeezed shut ∪ (sneeze)
    for (const k of [-2, -1, 0, 1, 2]) cutTaper(g, [[E[0] + k * 24, E[1] - 40 - Math.abs(k) * 4], [E[0] + k * 30, E[1] - 66 - Math.abs(k) * 6]], 7);
  } else if (f.arc) {
    crescent(g, E[0], E[1] + 12, 52, Math.PI * 1.06, Math.PI * 1.94, 16);                     // happy ∩
  }
  // brow: a thick tapered slit above the eye, sawtooth tufts on it
  const bl = E[1] - 92 + f.brow[0], br = E[1] - 84 + f.brow[1];
  const bc = curve([[E[0] - 70, bl], [E[0], (bl + br) / 2 - 10], [E[0] + 70, br]], false, 3);
  cutTaper(g, bc, 14); sawRow(g, bc, 26, 15, -1, .7);
}
function headPiece(expr = 'normal') {
  return piece([-440, -520, 160, 120], g => {
    const base = circle(HC[0], HC[1], HR, 72, .025);
    // horns: two thick curled crescents on top, curling back (to the right)
    const horn = (dx, s, seed) => {
      const pts = []; for (let i = 0; i <= 24; i++) { const u = i / 24, a = -2.6 + u * 2.4, r = 150 * s * (1 - u * .15); pts.push([HC[0] + dx + 40 + Math.cos(a) * r, HC[1] - 90 + Math.sin(a) * r * .9]); }
      const L = [], Rr = []; for (let i = 0; i < pts.length; i++) { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], dx2 = b[0] - a[0], dy2 = b[1] - a[1], l = Math.hypot(dx2, dy2) || 1, w = 34 * s * (1 - i / pts.length * .75); L.push([pts[i][0] - dy2 / l * w, pts[i][1] + dx2 / l * w]); Rr.push([pts[i][0] + dy2 / l * w, pts[i][1] - dx2 / l * w]); }
      const out = P([...L, ...Rr.reverse()], true, .5, seed);
      fill(g, q => trace(q, out), NIAN);
      for (let k = 1; k <= 5; k++) { const i = Math.floor(k / 6.5 * (pts.length - 1)); crescent(g, pts[i][0], pts[i][1], 22 * s, -2.2, -.8, 7); }
    };
    horn(-20, 1, 7); horn(60, .8, 9);
    // snout: a bulge to the left of the head circle
    const snout = P([[-250, -60], [-300, -90], [-330, -70], [-340, -20], [-320, 30], [-280, 50], [-230, 40]], true, .4, 11);
    const out = sawEdge(base.concat([base[0]]), 22, 22, 1, .35, 5);
    fill(g, q => trace(q, out), NIAN);
    fill(g, q => trace(q, snout), NIAN);
    inset(g, base, 6, 2.6, NIAN);
    inset(g, snout, 5, 2.2, NIAN);
    within(g, base, () => {
      // cheek swirl, forehead cloud, ear
      doubleSwirl(g, -20, -80, 60, 7, .6);
      swirl(g, 30, -200, 38, 1.8, 7, 1.2, -1);
      cutTaper(g, curve([[80, -230], [96, -270], [76, -300]], false, 2), 7);
      // mouth line: upper lip, teeth row hanging down
      const lip = curve([[-320, 40], [-260, 54], [-200, 52], [-150, 36]], false, 3);
      cutTaper(g, lip, 6); sawRow(g, lip, 22, 18, 1, .7);
    });
    // nose: plum-shaped hole at the tip of the snout + nostril swirl
    plum(g, -318, -22, 14, 0);
    swirl(g, -284, -4, 18, 1.5, 5, .3, 1);
    for (const k of [0, 1, 2]) crescent(g, -262 + k * 16, -80 - k * 6, 14, Math.PI * .95, Math.PI * 1.6, 4);   // wrinkles on the snout
    faceCuts(g, expr);
  }, { seed: 43, col: NIAN, ss: 2 });
}
// lower jaw (origin = hinge): teeth up, beard sawtooth down, optional tongue
function jawPiece(tongue = false) {
  return piece([-260, -40, 60, 150], g => {
    const upper = sawEdge(curve([[-220, -2], [-150, -4], [-80, -2], [-10, 0]], false, 3), 16, 26, 1, 0, 9);
    const beard = sawEdge(curve([[-190, 86], [-110, 102], [-40, 88], [12, 50]], false, 3), 28, 26, -1, .3, 11);
    const out = [...upper, ...curve([[-10, 0], [18, 28], [12, 50]], false, 3), ...beard.reverse(), ...curve([[-190, 86], [-232, 58], [-238, 24], [-220, -2]], false, 3)];
    fill(g, q => trace(q, out), NIAN);
    inset(g, out, 5, 2.2, NIAN);
    cutTaper(g, curve([[-206, 26], [-140, 36], [-60, 30], [-10, 16]], false, 3), 5);
    if (tongue) { fill(g, q => trace(q, P([[-200, 8], [-240, -10], [-262, 10], [-250, 34], [-212, 36]], true, .4, 12)), NIAN_NEAR); cutTaper(g, [[-250, 12], [-230, 26]], 4); }
    else swirl(g, -140, 56, 18, 1.5, 6, 0, 1);
  }, { seed: 45, col: NIAN, ss: 2 });
}
// arm: upper (origin = shoulder, hanging down) and forearm + paw with three claw slits
function upperArmPiece(col, seed) {
  return piece([-70, -50, 70, 160], g => {
    const back = sawEdge(curve([[46, -30], [52, 40], [44, 100], [40, 140]], false, 3), 18, 22, -1, .4, seed);
    const out = [[-46, -30], ...back, [-40, 142], ...curve([[-40, 142], [-50, 90], [-54, 40], [-46, -30]], false, 3)];
    fill(g, q => trace(q, out), col);
    for (const [x, y, l] of [[-20, 20, 90], [8, 30, 100]]) cutTaper(g, curve([[x, y], [x - 4, y + l * .5], [x + 2, y + l]], false, 3), 6);
    swirl(g, 0, 10, 26, 1.7, 6, -1, 1);
  }, { seed, col, ss: 2 });
}
function foreArmPiece(col, seed) {
  return piece([-90, -40, 90, 230], g => {
    const back = sawEdge(curve([[40, -14], [44, 50], [40, 100]], false, 3), 16, 20, -1, .4, seed + 1);
    const out = [[-40, -14], ...back, ...curve([[40, 100], [66, 130], [78, 170], [60, 200], [0, 208], [-62, 200], [-80, 168], [-66, 130], [-40, 100], [-40, -14]], false, 3)];
    fill(g, q => trace(q, P(out, true, .3, seed)), col);
    // paw: three claw slits + pad crescents
    for (const x of [-40, -8, 26]) cutTaper(g, [[x, 206], [x + 2, 182], [x, 160]], 6);
    crescent(g, 0, 150, 30, Math.PI * .15, Math.PI * .85, 7);
    swirl(g, 0, 20, 22, 1.6, 6, -1.2, 1);
    cutTaper(g, curve([[-16, 50], [-18, 80], [-14, 110]], false, 3), 5);
  }, { seed, col, ss: 2 });
}
function thighPiece(col, seed) {
  return piece([-80, -50, 80, 150], g => {
    const back = sawEdge(curve([[56, -30], [62, 40], [50, 110]], false, 3), 18, 22, -1, .4, seed);
    const out = [[-56, -30], ...back, [-46, 114], ...curve([[-46, 114], [-62, 60], [-66, 10], [-56, -30]], false, 3)];
    fill(g, q => trace(q, out), col);
    for (const [x, y, l] of [[-24, 10, 80], [10, 20, 80]]) cutTaper(g, curve([[x, y], [x - 4, y + l * .5], [x + 2, y + l]], false, 3), 6);
  }, { seed, col, ss: 2 });
}
function shinPiece(col, seed) {
  return piece([-120, -40, 90, 180], g => {
    const back = sawEdge(curve([[40, -14], [42, 50], [48, 90]], false, 3), 14, 18, -1, .4, seed + 1);
    const out = [[-44, -14], ...back, ...curve([[48, 90], [54, 130], [30, 150], [-50, 154], [-104, 146], [-112, 126], [-96, 110], [-50, 96], [-44, 50], [-44, -14]], false, 3)];
    fill(g, q => trace(q, P(out, true, .3, seed)), col);
    for (const x of [-96, -68, -40]) cutTaper(g, [[x, 150], [x + 1, 132], [x, 116]], 5);   // toes
    swirl(g, 0, 16, 24, 1.8, 6, -1.2, 1);
    cutTaper(g, curve([[-14, 50], [-18, 80], [-12, 104]], false, 3), 5);
  }, { seed, col, ss: 2 });
}
function tailPiece() {
  return piece([-60, -240, 200, 60], g => {
    const c = curve([[0, 0], [60, -40], [110, -110], [120, -180], [80, -220]], false, 3);
    const L = [], Rr = []; for (let i = 0; i < c.length; i++) { const a = c[Math.max(0, i - 1)], b = c[Math.min(c.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, w = 28 * (1 - i / c.length * .4); L.push([c[i][0] - dy / l * w, c[i][1] + dx / l * w]); Rr.push([c[i][0] + dy / l * w, c[i][1] - dx / l * w]); }
    const out = [...sawEdge(L, 20, 24, 1, .3, 13), ...Rr.reverse()];
    fill(g, q => trace(q, out), NIAN);
    // tuft: a lobed fan at the tip
    for (let k = 0; k < 5; k++) { const a = -2.9 + k * .5; fill(g, q => trace(q, P(ellipsePoly(80 + Math.cos(a) * 40, -220 + Math.sin(a) * 40, 22, 14, a, 16).slice(0, -1), true, .4, 20 + k)), NIAN); crescent(g, 80 + Math.cos(a) * 40, -220 + Math.sin(a) * 40, 10, a - 1.2, a + 1.2, 3); }
    cutTaper(g, c.slice(0, Math.floor(c.length * .7)), 6);
  }, { seed: 49, col: NIAN, ss: 2 });
}
export const NEXPRS = ['lonely', 'normal', 'sniff', 'sneeze', 'panic', 'happy', 'eat', 'determined', 'soft', 'curious', 'lookup'];
export function buildNian() {
  if (N.body) return N;
  N.body = bodyPiece(); N.jaw = jawPiece(false); N.jawT = jawPiece(true); N.tail = tailPiece();
  N.head = {}; for (const k of NEXPRS) N.head[k] = headPiece(k);
  N.ua = upperArmPiece(NIAN_NEAR, 51); N.fa = foreArmPiece(NIAN_NEAR, 53); N.uaF = upperArmPiece(NIAN_FAR, 55); N.faF = foreArmPiece(NIAN_FAR, 57);
  N.th = thighPiece(NIAN_NEAR, 61); N.sh = shinPiece(NIAN_NEAR, 63); N.thF = thighPiece(NIAN_FAR, 65); N.shF = shinPiece(NIAN_FAR, 67);
  return N;
}
// poses: angles in radians. arms: shF/elF (near, front) shB/elB (far, back); legs hipF/knF, hipB/knB; head, jaw (0..1 open), tail
export const NPOSE = {
  stand: { lean: 0, head: 0, jaw: 0, tail: .1, shF: -.25, elF: .1, shB: .25, elB: -.1, hipF: -.08, knF: .04, hipB: .1, knB: -.05, eye: 'normal' },
  sit: { lean: .08, head: .05, jaw: 0, tail: .5, shF: .2, elF: .3, shB: .3, elB: -.2, hipF: -1.3, knF: 1.2, hipB: -1.15, knB: 1.1, eye: 'lonely' },
  crouch: { lean: -.35, head: .2, jaw: 0, tail: .3, shF: -.9, elF: .5, shB: -.3, elB: .2, hipF: .5, knF: -.2, hipB: .6, knB: -.3, eye: 'sniff' },
  panic: { lean: .15, head: -.2, jaw: .5, tail: -.9, shF: -2.2, elF: -.6, shB: -2.0, elB: -.5, hipF: -.4, knF: .3, hipB: .4, knB: -.2, eye: 'panic' },
  lift: { lean: -.1, head: -.35, jaw: .2, tail: -.4, shF: -2.6, elF: -.4, shB: -2.4, elB: -.5, hipF: -.6, knF: .9, hipB: .6, knB: -.5, eye: 'determined' },
};
export function runPose(ph, a = 1) {
  const s = Math.sin(ph), c = Math.cos(ph);
  return { ...NPOSE.crouch, lean: -.45 + .06 * s, head: .3, shF: -1.1 + .9 * a * s, elF: .4 - .3 * s, shB: -1.1 - .9 * a * s, elB: .4 + .3 * s, hipF: .5 - .9 * a * s, knF: .2 + .5 * Math.max(0, -c), hipB: .5 + .9 * a * s, knB: .2 + .5 * Math.max(0, c), tail: .4 + .3 * c, bob: Math.abs(c) * 24, eye: 'determined' };
}
// draw: C = world→screen; p = pose (+ x, y, flip, scale); returns matrices and joints
export function drawNian(g, C, pose, opt = {}) {
  const Np = buildNian(), p = { ...NPOSE.stand, ...pose };
  let root = mul(C, T(p.x || 0, (p.y || 0) - (p.bob || 0)));
  if (p.flip) root = mul(root, S(-1, 1));
  if (p.scale) root = mul(root, S(p.scale));
  if (p.pivot) root = mul(mul(mul(root, T(...p.pivot)), R(p.lean || 0)), T(-p.pivot[0], -p.pivot[1])); else root = mul(root, R(p.lean || 0));
  const M = {};
  M.body = root;
  M.uaB = mul(mul(root, T(...NJ.shB)), R(p.shB)); M.faB = mul(mul(M.uaB, T(...NJ.elbow)), R(p.elB));
  M.uaF = mul(mul(root, T(...NJ.shF)), R(p.shF)); M.faF = mul(mul(M.uaF, T(...NJ.elbow)), R(p.elF));
  M.thB = mul(mul(root, T(...NJ.hipB)), R(p.hipB)); M.shB = mul(mul(M.thB, T(...NJ.knee)), R(p.knB));
  M.thF = mul(mul(root, T(...NJ.hipF)), R(p.hipF)); M.shF = mul(mul(M.thF, T(...NJ.knee)), R(p.knF));
  M.tail = mul(mul(root, T(...NJ.tail)), R(p.tail));
  M.head = mul(mul(root, T(...NJ.neck)), R(p.head));
  M.jaw = mul(mul(M.head, T(...NJ.jaw)), R(p.jaw * .7));
  const o = { shadow: opt.shadow ?? 1.6 };
  const order = opt.order || ['uaB', 'faB', 'thB', 'shB', 'tail', 'thF', 'shF', 'body', 'jaw', 'head', 'uaF', 'faF'];
  for (const k of order) {
    if (k === 'uaB') put(g, Np.uaF, M.uaB, o);
    else if (k === 'faB') { put(g, Np.faF, M.faB, o); if (p.propB) p.propB(g, mul(M.faB, T(...NJ.paw))); }
    else if (k === 'thB') put(g, Np.thF, M.thB, o);
    else if (k === 'shB') put(g, Np.shF, M.shB, o);
    else if (k === 'tail') put(g, Np.tail, M.tail, o);
    else if (k === 'thF') put(g, Np.th, M.thF, o);
    else if (k === 'shF') put(g, Np.sh, M.shF, o);
    else if (k === 'body') put(g, Np.body, M.body, o);
    else if (k === 'jaw') put(g, p.tongue ? Np.jawT : Np.jaw, M.jaw, o);
    else if (k === 'head') put(g, Np.head[p.eye] || Np.head.normal, M.head, o);
    else if (k === 'uaF') put(g, Np.ua, M.uaF, o);
    else if (k === 'faF') { if (p.propUnder) p.propUnder(g, mul(M.faF, T(...NJ.paw))); put(g, Np.fa, M.faF, o); if (p.prop) p.prop(g, mul(M.faF, T(...NJ.paw))); }
  }
  if (opt.after) opt.after(M);
  const J = {}; for (const [k, m] of Object.entries({ neck: M.head, jaw: M.jaw, shF: M.uaF, elF: M.faF, shB: M.uaB, elB: M.faB, hipF: M.thF, knF: M.shF, hipB: M.thB, knB: M.shB, tail: M.tail })) J[k] = ap(m, [0, 0]);
  J.pawF = ap(M.faF, NJ.paw); J.pawB = ap(M.faB, NJ.paw); J.eye = ap(M.head, [-120, -150]); J.nose = ap(M.head, [-318, -22]); J.mouth = ap(M.jaw, [-120, 20]);
  return { M, joints: J };
}
