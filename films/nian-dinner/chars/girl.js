// 小雪: jointed red-paper girl (profile facing right). Units: height ≈ 450; origin = centre of the soles, y points down.
// Pieces: head (knit hat with pom-pom, two braids, swappable face pieces), padded jacket (origin = pelvis), upper arm ×2, forearm+mitten ×2, thigh ×2, shin+boot ×2, scissors.
import { PAL, piece, P, Pl, trace, fill, cut, cutLine, cutTaper, inset, within, ellipsePoly, curve } from '../engine/paper.js';
import { sawRow, sawEdge, crescent, crescentPts, crescentRows, swirl, rosette, plum, coin, dots, taper, strands } from '../engine/motifs.js';
import { mul, T, R, S, put, ap } from '../engine/rig.js';

export const GIRL = '#e0352c';          // one step brighter than China red (the hero)
export const GIRL_FAR = '#b8191b';      // far-side limbs
export const PELVIS = -128;
const G = {};

// ---------- head: origin = neck joint; the face looks right ----------
// head circle centre (0,-82) r 74; hat covers the top; braids hang behind
const HEAD = (() => { const o = []; for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI * 2; o.push([Math.cos(a) * 74 * (1 + .04 * Math.cos(a * 2)), -82 + Math.sin(a) * 72]); } return o; })();
export function faceParams(expr) {
  // eye: open (0..1 upper lid height), pupil r, pupil offset, brow: [innerDy (right end), outerDy], mouth kind
  const F = {
    neutral: { open: .8, pr: 6.5, px: 0, py: 0, brow: [0, 0], mouth: 'line' },
    smile: { open: 0, pr: 0, brow: [-2, 0], mouth: 'smile' },
    surprise: { open: 1.15, pr: 4.5, px: 1, py: -1, brow: [-9, -7], mouth: 'o' },
    sad: { open: .45, pr: 7, px: -1, py: 2, brow: [-7, 2], mouth: 'down' },
    determined: { open: .55, pr: 6, px: 2, py: 0, brow: [6, -3], mouth: 'press' },
    laugh: { open: 0, pr: 0, brow: [-4, -4], mouth: 'open' },
    worried: { open: .9, pr: 5, px: 0, py: -1, brow: [-10, 0], mouth: 'wave' },
    lookup: { open: .85, pr: 6.5, px: 1, py: -4, brow: [-2, -1], mouth: 'smallsmile' },
    lookdown: { open: .7, pr: 6.5, px: 1, py: 3, brow: [0, 0], mouth: 'line' },
  };
  return F[expr] || F.neutral;
}
function face(g, expr) {
  const f = faceParams(expr), E = [40, -90];
  if (f.open > 0) {
    // open eye: upper lid crescent + lower lid crescent leave bridges; pupil is a hole
    crescent(g, E[0], E[1] + 2, 14, Math.PI * 1.05, Math.PI * 1.95, 5 + 6 * f.open);
    crescent(g, E[0], E[1] - 1, 13, Math.PI * .12, Math.PI * .88, 3.2);
    if (f.pr) cut(g, q => q.arc(E[0] + 2 + f.px, E[1] - 2 + f.py, f.pr, 0, 7));
  } else if (expr === 'laugh') {
    crescent(g, E[0], E[1] + 6, 13, Math.PI * 1.08, Math.PI * 1.92, 5.5);
    for (const k of [-1, 0, 1]) cutTaper(g, [[E[0] + k * 9, E[1] + 12], [E[0] + k * 11, E[1] + 19]], 2.6);
  } else {
    crescent(g, E[0], E[1] + 5, 13, Math.PI * 1.08, Math.PI * 1.92, 5.5);     // ∩ smiling eye
  }
  // brow
  const bi = -121 + f.brow[0], bo = -117 + f.brow[1];
  taper(g, [[24, bo], [40, (bi + bo) / 2 - 3], [57, bi]], 4.6);
  // mouth (at the front of the face)
  const M = [56, -56];
  if (f.mouth === 'line') taper(g, [[M[0] - 8, M[1]], [M[0], M[1] + .5], [M[0] + 6, M[1]]], 2.6);
  else if (f.mouth === 'smile' || f.mouth === 'smallsmile') taper(g, [[M[0] - 10, M[1] - 2], [M[0] - 3, M[1] + 2], [M[0] + 5, M[1] - 3]], f.mouth === 'smile' ? 3.2 : 2.6);
  else if (f.mouth === 'o') cut(g, q => q.ellipse(M[0] - 2, M[1], 4.2, 5.6, 0, 0, 7));
  else if (f.mouth === 'down') taper(g, [[M[0] - 9, M[1] - 1], [M[0] - 3, M[1] - 4], [M[0] + 4, M[1]]], 2.8);
  else if (f.mouth === 'press') taper(g, [[M[0] - 9, M[1]], [M[0] + 5, M[1]]], 3);
  else if (f.mouth === 'open') cut(g, q => { q.moveTo(M[0] - 12, M[1] - 4); q.quadraticCurveTo(M[0] - 2, M[1] + 14, M[0] + 6, M[1] - 2); q.closePath(); });
  else if (f.mouth === 'wave') taper(g, [[M[0] - 10, M[1]], [M[0] - 6, M[1] - 2.5], [M[0] - 2, M[1] + .5], [M[0] + 2, M[1] - 2], [M[0] + 5, M[1]]], 2.4);
  // cheek rosette
  rosette(g, 34, -64, 8, 5, -.3, .22);
}
function headPiece(expr = 'neutral', col = GIRL, seed = 3) {
  return piece([-120, -252, 100, 14], g => {
    const out = P(HEAD, true, .3, seed);
    // braids (behind the head): two chains of beads hanging from the hat line down the back, each ending in a pom
    const braid = (x0, y0, len, s2) => {
      const pts = [[x0, y0], [x0 - 8, y0 + len * .35], [x0 - 2, y0 + len * .7], [x0 - 10, y0 + len]];
      const c = curve(pts, false, 3);
      const L = [], Rr = []; for (let i = 0; i < c.length; i++) { const a = c[Math.max(0, i - 1)], b = c[Math.min(c.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, w = 9 + 4 * Math.sin(i / c.length * Math.PI * 5); L.push([c[i][0] - dy / l * w, c[i][1] + dx / l * w]); Rr.push([c[i][0] + dy / l * w, c[i][1] - dx / l * w]); }
      fill(g, q => trace(q, P([...L, ...Rr.reverse()], true, .3, s2)), col);
      fill(g, q => trace(q, P(ellipsePoly(x0 - 10, y0 + len + 8, 15, 14, 0, 22).slice(0, -1), true, .4, s2 + 1)), col);
      rosette(g, x0 - 10, y0 + len + 8, 9, 6, 0, .22);
      for (let k = 1; k < 5; k++) crescent(g, c[Math.floor(k / 5 * (c.length - 1))][0], c[Math.floor(k / 5 * (c.length - 1))][1], 7, -2.6, -.6, 2.6);
    };
    braid(-60, -92, 92, seed + 11); braid(-36, -70, 70, seed + 13);
    fill(g, q => trace(q, out), col);
    inset(g, out, 3.5, 1.5, col);
    // knit hat: dome over the head top, brim band at y ≈ -126, pom-pom on top
    const hat = P([[-78, -134], [-70, -170], [-44, -200], [-6, -212], [36, -202], [64, -174], [74, -138]], false, .3, seed + 2);
    fill(g, q => { trace(q, hat.concat([[74, -138], [-78, -134]]), false); q.closePath(); }, col);
    inset(g, hat.concat([[74, -138], [-78, -134]]), 3.5, 1.5, col);
    cutTaper(g, curve([[-74, -142], [0, -150], [72, -144]], false, 2), 3.2);          // brim line
    cutTaper(g, curve([[-70, -130], [0, -134], [70, -130]], false, 2), 2.6);           // hat edge over the face
    g.save(); g.beginPath(); trace(g, [[-78, -148], [78, -148], [78, -130], [-78, -130]]); g.clip(); crescentRows(g, -78, -148, 78, -130, 7, 2.6, 0, .75); g.restore();   // ribbed band
    for (const [x0, y0, x1, y1] of [[-40, -164, -20, -198], [-6, -170, 2, -206], [28, -164, 20, -196]]) cutTaper(g, curve([[x0, y0], [(x0 + x1) / 2 + 4, (y0 + y1) / 2], [x1, y1]], false, 2), 3);   // knit lines
    fill(g, q => trace(q, P(ellipsePoly(-4, -220, 22, 20, 0, 24).slice(0, -1), true, .5, seed + 4)), col);   // pom-pom
    rosette(g, -4, -220, 13, 7, .2, .22);
    // ear, hairline wisps under the hat
    cutTaper(g, curve([[-2, -96], [-9, -90], [-8, -76], [0, -72]], false, 2), 2.8);
    sawRow(g, curve([[6, -130], [30, -128], [56, -124]], false, 2), 8, 5, 1, .7);
    // —— face piece (swapped whole) ——
    face(g, expr);
  }, { seed, col });
}
// ---------- padded jacket, origin = pelvis ----------
const TORSO_OUT = [[-14, -124], [10, -128], [26, -118], [36, -98], [40, -70], [40, -42], [46, -12], [56, 16], [26, 24], [-12, 24], [-52, 18], [-44, -12], [-38, -46], [-36, -90], [-28, -114]];
function torsoPiece(col = GIRL, seed = 7) {
  return piece([-64, -140, 66, 34], g => {
    const out = P(TORSO_OUT, true, .3, seed);
    fill(g, q => trace(q, out), col);
    inset(g, out, 3.5, 1.5, col);
    // fur collar: sawtooth row under the neck
    const collar = curve([[-30, -112], [-10, -108], [14, -108], [32, -114]], false, 2);
    cutTaper(g, collar, 2.6); sawRow(g, collar, 10, 5.5, 1, .72);
    // front opening + frog buttons (coin cuts)
    cutTaper(g, curve([[26, -104], [31, -76], [35, -44], [38, -12], [44, 14]], false, 2), 2.6);
    for (const [x, y] of [[26, -88], [30, -60], [34, -32], [38, -6]]) coin(g, x - 7, y, 4.4);
    within(g, out, () => {
      // quilting crescents on the body
      g.save(); g.beginPath(); g.rect(-34, -98, 54, 90); g.clip(); crescentRows(g, -34, -98, 20, -8, 7.5, 2.8, 0, .72); g.restore();
      // hem: sawtooth
      const hem = curve([[-48, 8], [0, 10], [50, 8]], false, 2); cutTaper(g, hem, 2.4); sawRow(g, hem, 8, 6, -1, .7);
    });
    rosette(g, -2, -60, 15, 8, .2, .2);   // chest rosette (plum-blossom)
    taper(g, [[-26, -96], [-28, -60], [-30, -24]], 2.4);
  }, { seed, col });
}
function upperArmPiece(col, seed) {
  return piece([-24, -14, 26, 62], g => {
    const out = P([[-16, -8], [0, -12], [16, -8], [19, 18], [16, 50], [0, 56], [-14, 52], [-18, 20]], true, .3, seed);
    fill(g, q => trace(q, out), col); inset(g, out, 3, 1.4, col);
    within(g, out, () => crescentRows(g, -20, 8, 24, 46, 7, 2.6, 0, .72));
  }, { seed, col });
}
// forearm + mitten (origin = elbow). hand: 'mitten' (closed), 'open' (flat palm forward), 'hold' (grip)
function foreArmPiece(col, seed, hand = 'mitten') {
  return piece([-28, -12, 32, 84], g => {
    const out = P([[-14, -6], [0, -9], [14, -6], [17, 22], [20, 42], [0, 46], [-19, 44], [-16, 20]], true, .3, seed);
    const H = hand === 'open' ? P([[-10, 40], [10, 40], [13, 58], [9, 74], [0, 77], [-6, 72], [-12, 60]], true, .3, seed + 1)
      : hand === 'hold' ? P([[-10, 40], [10, 40], [14, 52], [10, 64], [-6, 66], [-13, 54]], true, .3, seed + 1)
        : P([[-11, 40], [11, 40], [15, 54], [9, 68], [-4, 70], [-13, 60]], true, .3, seed + 1);
    fill(g, q => trace(q, H), col);
    fill(g, q => trace(q, P(hand === 'open' ? [[9, 44], [17, 50], [16, 57], [10, 55]] : [[8, 45], [16, 48], [16, 54], [9, 54]], true, .2, seed + 2)), col);   // thumb
    fill(g, q => trace(q, out), col); inset(g, out, 3, 1.4, col);
    const cuff = curve([[-18, 32], [0, 34], [19, 32]], false, 2); cutTaper(g, cuff, 2.4); sawRow(g, curve([[-18, 36], [0, 38], [19, 36]], false, 2), 6, 5, 1, .7);   // fur cuff
    within(g, out, () => crescentRows(g, -20, 2, 24, 24, 6.5, 2.4, 0, .72));
    if (hand !== 'open') crescent(g, 1, 56, 7, -2.2, -.9, 2.4);   // mitten thumb line
  }, { seed, col });
}
function thighPiece(col, seed) {
  return piece([-24, -12, 26, 74], g => {
    g.scale(1, .84);
    const out = P([[-17, -8], [0, -10], [18, -8], [19, 28], [16, 66], [0, 70], [-15, 66], [-18, 28]], true, .3, seed);
    fill(g, q => trace(q, out), col);
    taper(g, [[5, 6], [7, 34], [5, 58]], 2.4); taper(g, [[-7, 12], [-9, 38], [-7, 56]], 2.2);
  }, { seed, col });
}
// shin + boot with a fur top
function shinPiece(col, seed) {
  return piece([-24, -10, 54, 84], g => {
    g.scale(1, .86);
    const out = P([[-15, -6], [0, -8], [15, -6], [14, 30], [12, 50], [-13, 50], [-15, 30]], true, .3, seed);
    const boot = P([[-16, 44], [6, 42], [16, 46], [30, 52], [40, 58], [46, 66], [44, 74], [30, 77], [-14, 77], [-19, 70], [-19, 58]], true, .3, seed + 1);
    fill(g, q => trace(q, out), col);
    fill(g, q => trace(q, boot), col);
    const top = curve([[-14, 48], [0, 46], [14, 48]], false, 2); cutTaper(g, top, 2.4); sawRow(g, top, 7, 5, 1, .7);   // fur top of the boot
    cutTaper(g, curve([[-16, 70], [12, 71], [42, 70]], false, 2), 2.2);          // sole line
    crescent(g, 24, 60, 6, Math.PI * 1.1, Math.PI * 1.9, 2.2);
    taper(g, [[-2, 10], [0, 30], [-1, 42]], 2.2);
  }, { seed, col });
}
// scissors: two blades riveted at the origin
function bladePiece(col, seed, flip) {
  const s = flip ? -1 : 1;
  return piece([-46, -20, 66, 20], g => {
    const blade = P([[-2, 0], [10, -4 * s], [30, -4.5 * s], [58, -1.2 * s], [60, 0], [30, 1.2 * s], [8, 3 * s]], true, .15, seed);
    const shank = P([[0, -2.5 * s], [-16, 2 * s], [-22, 6 * s], [-20, 9 * s], [-4, 3 * s]], true, .15, seed + 1);
    fill(g, q => trace(q, blade), col); fill(g, q => trace(q, shank), col);
    fill(g, q => { q.ellipse(-31, 9 * s, 13, 8.5, .25 * s, 0, 7); }, col);
    cut(g, q => { q.ellipse(-31, 9 * s, 7.6, 4.6, .25 * s, 0, 7); });
    cutLine(g, .9, q => { q.moveTo(12, -1.5 * s); q.lineTo(48, -.8 * s); });
  }, { seed, col, edge: .8 });
}
export const EXPRS = ['neutral', 'smile', 'surprise', 'sad', 'determined', 'laugh', 'worried', 'lookup', 'lookdown'];
export function buildGirl() {
  if (G.torso) return G;
  G.head = {}; for (const e of EXPRS) G.head[e] = headPiece(e);
  G.torso = torsoPiece();
  G.uaF = upperArmPiece(GIRL, 11); G.uaB = upperArmPiece(GIRL_FAR, 12);
  G.faF = {}; G.faB = {};
  for (const h of ['mitten', 'open', 'hold']) { G.faF[h] = foreArmPiece(GIRL, 13, h); G.faB[h] = foreArmPiece(GIRL_FAR, 14, h); }
  G.thF = thighPiece(GIRL, 15); G.thB = thighPiece(GIRL_FAR, 16);
  G.shF = shinPiece(GIRL, 17); G.shB = shinPiece(GIRL_FAR, 18);
  G.bladeA = bladePiece('#9c1323', 19, false); G.bladeB = bladePiece('#9c1323', 20, true);
  return G;
}
export const GJ = { hipF: [6, 6], hipB: [-10, 6], shF: [6, -108], shB: [-10, -110], neck: [2, -118], elbow: [0, 50], knee: [0, 54], foot: [0, 66] };
export const GPOSE = {
  rest: { lean: 0, head: 0, shB: .12, elB: -.1, shF: -.1, elF: -.2, hipB: .06, knB: 0, hipF: -.06, knF: 0, expr: 'neutral', handF: 'mitten', handB: 'mitten' },
};
// walk cycle at phase ph (radians); stride amplitude a
export function walkPose(ph, a = .55, extra = {}) {
  const s = Math.sin(ph), c = Math.cos(ph);
  return { ...GPOSE.rest, hipF: -a * s, knF: Math.max(0, .9 * c) * a, hipB: a * s, knB: Math.max(0, -.9 * c) * a, shF: a * .7 * s, elF: -.5, shB: -a * .7 * s, elB: -.5, lean: .04, bob: Math.abs(c) * 6, ...extra };
}
// draw: C = world→screen, pose = joint angles; opt.order for draw order; returns matrices and joints
export function drawGirl(g, C, pose, opt = {}) {
  const Gp = buildGirl(), p = { ...GPOSE.rest, ...pose };
  let dy = 0;
  if (p.ground) {   // put the lower foot on the ground
    const r0 = mul(T(0, PELVIS), R(p.lean || 0));
    const fk = (hip, a1, a2) => ap(mul(mul(mul(r0, T(...hip)), R(a1)), mul(T(...GJ.knee), R(a2))), GJ.foot);
    const f1 = fk(GJ.hipF, p.hipF, p.knF), f2 = fk(GJ.hipB, p.hipB, p.knB);
    dy = -Math.max(f1[1], f2[1]);
  }
  let root = mul(C, T(p.x || 0, (p.y || 0) - (p.bob || 0)));
  if (p.flip) root = mul(root, S(-1, 1));
  if (p.scale) root = mul(root, S(p.scale));
  root = mul(root, T(0, PELVIS + dy)); root = mul(root, R(p.lean || 0));
  const M = {};
  M.torso = root;
  M.thB = mul(mul(root, T(...GJ.hipB)), R(p.hipB)); M.shB = mul(mul(M.thB, T(...GJ.knee)), R(p.knB));
  M.thF = mul(mul(root, T(...GJ.hipF)), R(p.hipF)); M.shF = mul(mul(M.thF, T(...GJ.knee)), R(p.knF));
  M.uaB = mul(mul(root, T(...GJ.shB)), R(p.shB)); M.faB = mul(mul(M.uaB, T(...GJ.elbow)), R(p.elB));
  M.uaF = mul(mul(root, T(...GJ.shF)), R(p.shF)); M.faF = mul(mul(M.uaF, T(...GJ.elbow)), R(p.elF));
  M.head = mul(mul(root, T(...GJ.neck)), R(p.head));
  const o = { shadow: opt.shadow ?? 1 };
  const order = opt.order || ['uaB', 'faB', 'thB', 'shB', 'thF', 'shF', 'torso', 'head', 'uaF', 'faF'];
  for (const k of order) {
    if (k === 'uaB') put(g, Gp.uaB, M.uaB, o);
    else if (k === 'faB') { put(g, Gp.faB[p.handB], M.faB, o); if (p.propB) p.propB(g, mul(M.faB, T(0, 56))); }
    else if (k === 'thB') put(g, Gp.thB, M.thB, o);
    else if (k === 'shB') put(g, Gp.shB, M.shB, o);
    else if (k === 'thF') put(g, Gp.thF, M.thF, o);
    else if (k === 'shF') put(g, Gp.shF, M.shF, o);
    else if (k === 'torso') put(g, Gp.torso, M.torso, o);
    else if (k === 'head') put(g, Gp.head[p.expr] || Gp.head.neutral, M.head, o);
    else if (k === 'uaF') put(g, Gp.uaF, M.uaF, o);
    else if (k === 'faF') {
      if (p.scissors) drawScissors(g, mul(mul(M.faF, T(2, 56)), S(p.scissors.s ?? 1.4)), p.scissors.ang ?? -1.2, p.scissors.open ?? .3, o);
      if (p.propUnder) p.propUnder(g, mul(M.faF, T(0, 56)));
      put(g, Gp.faF[p.handF], M.faF, o);
      if (p.prop) p.prop(g, mul(M.faF, T(0, 56)));
    }
  }
  return {
    M, joints: {
      neck: ap(M.head, [0, 0]), shF: ap(M.uaF, [0, 0]), elF: ap(M.faF, [0, 0]), hipF: ap(M.thF, [0, 0]), knF: ap(M.shF, [0, 0]),
      shB: ap(M.uaB, [0, 0]), elB: ap(M.faB, [0, 0]), hipB: ap(M.thB, [0, 0]), knB: ap(M.shB, [0, 0]), handF: ap(M.faF, [0, 56]), handB: ap(M.faB, [0, 56]), eye: ap(M.head, [40, -90]), top: ap(M.head, [-4, -240])
    }
  };
}
export function drawScissors(g, M, ang = 0, open = .3, o = {}) {
  const Gp = buildGirl(), base = mul(M, R(ang));
  put(g, Gp.bladeB, mul(base, R(open / 2)), o);
  put(g, Gp.bladeA, mul(base, R(-open / 2)), o);
  g.save(); g.setTransform(...base); g.beginPath(); g.arc(0, 0, 2.6, 0, 7); g.fillStyle = '#5a0a12'; g.fill(); g.restore();
}
