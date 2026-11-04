// The show inside the film: 孙悟空 (Monkey King) and 白骨精 (White Bone Demon: maiden form and skull form), plus the show's scenery.
// Cloth units: the inner cloth is 1920×1080 "cloth px"; puppets are built facing right with the waist at the origin and flipped by the pose.
import { piece, fill, cut, cutLine, ink, within, smooth, poly, scales, scalesOpen, lattice, coin, cloud, beads, beadLine, plum, meander, strata, cutTaper, flameTongue, DYE } from './carve.js';
import { mul, T, R, S, ap, set, dp, ik, ribbon, rivet, scaleOf } from './rig.js';
import { mulberry } from '/core/lib.js';

const HK = 1.2;
// ================= Monkey King =================
export const MJ = { neck: [6, -118], shF: [15, -102], shB: [-1, -106], rod: [4, -112], hipF: [10, 42], hipB: [-8, 40], elbow: [0, 60], wrist: [0, 52], feather: [-6 * HK, -98 * HK], tail: [-20, 30], cape: [-6, -104] };
export const MLEG = 200 + 46;
const UA = 60, FA = 52, HANDR = 12;
function mkHead() {
  // neck pivot at the origin; face to the right
  return piece([-46 * HK, -150 * HK, 52 * HK, 14 * HK], g => {
    g.scale(HK, HK);
    // Fur (ink) around the back and top of the head with tapered fur slits
    const fur = q => smooth(q, [[-4, 4], [-20, 0], [-32, -20], [-36, -48], [-30, -72], [-14, -86], [8, -88], [24, -80], [28, -66], [22, -58], [10, -54], [-2, -40], [-6, -20]]);
    fill(g, DYE.ink, fur);
    within(g, fur, () => { for (let k = 0; k < 9; k++) cutLine(g, 1.1, q => { q.moveTo(-28 + k * 1.5, -62 + k * 6); q.quadraticCurveTo(-18 + k * 1.2, -58 + k * 7, -8 + k * 1.3, -66 + k * 6); }); for (let k = 0; k < 5; k++) cutTaper(g, [[-24 + k * 3, -14 - k * 8], [-14 + k * 3, -24 - k * 8]], 2.2); });
    // Open-cut face: the outline is a hide strip, the inside a hole; the face mark (vermilion), the eye ring (gold), lines (ink) are strips inside the hole
    const face = q => smooth(q, [[-2, 4], [10, 6], [22, 0], [34, -14], [44, -28], [46, -40], [40, -50], [32, -56], [36, -64], [26, -70], [12, -72], [0, -66], [-8, -48], [-8, -26], [-6, -8]]);
    ink(g, 2.6, face);
    // mouth and chin strips
    ink(g, 1.4, q => { q.moveTo(20, -12); q.quadraticCurveTo(32, -16, 42, -28); });
    ink(g, 1.2, q => { q.moveTo(28, -16); q.quadraticCurveTo(36, -22, 40, -24); });
    // nostril
    ink(g, 1.3, q => { q.moveTo(39, -42); q.quadraticCurveTo(43, -44, 41, -47); });
    // golden eye: a thick gold ring (dyed strip) around the eye hole + ink pupil
    const eye = q => { q.ellipse(22, -50, 10, 5.6, -.1, 0, Math.PI * 2); };
    g.save(); g.lineWidth = 2.6; g.strokeStyle = DYE.gold; g.beginPath(); eye(g); g.stroke(); g.restore();
    ink(g, 1, eye);
    g.beginPath(); g.arc(25, -50, 2.6, 0, Math.PI * 2); g.fillStyle = DYE.ink; g.fill();
    // brow: a flame-shaped ink strip, raised
    fill(g, DYE.ink, q => smooth(q, [[8, -62], [18, -66], [30, -64], [36, -58], [30, -59], [20, -61], [10, -58]]));
    // vermilion peach mark on the forehead and cheek (the opera face)
    fill(g, DYE.red, q => smooth(q, [[6, -60], [12, -74], [26, -74], [30, -62], [22, -58], [12, -58]]));
    cutLine(g, 1.2, q => { q.moveTo(14, -70); q.quadraticCurveTo(18, -66, 24, -70); });
    fill(g, DYE.red, q => smooth(q, [[-2, -44], [4, -30], [-2, -16], [-6, -30]]));
    // Cap (紫金冠): gold dome with cloud cuts and bead rows, a band, two wings, a vermilion pompom
    const dome = q => smooth(q, [[26, -78], [20, -100], [6, -116], [-12, -116], [-26, -100], [-30, -80], [-16, -86], [0, -88], [16, -84]]);
    fill(g, DYE.gold, dome); within(g, dome, () => { cloud(g, -6, -102, 8, 0, 1.3); cloud(g, 10, -98, 6, 2, 1.1, -1); beadLine(g, -22, -90, 20, -90, 1.4, 5); });
    ink(g, 1.7, dome);
    const band = q => poly(q, [[30, -72], [30, -82], [-32, -80], [-33, -70]]);
    fill(g, DYE.red, band); within(g, band, () => meander(g, -30, -73, 28, 3.6, 1)); ink(g, 1.5, band);
    for (const sd of [1, -1]) {   // phoenix wings
      const w = q => smooth(q, [[sd > 0 ? 24 : -26, -96], [sd > 0 ? 44 : -46, -110], [sd > 0 ? 50 : -52, -102], [sd > 0 ? 42 : -44, -90], [sd > 0 ? 30 : -32, -86]]);
      fill(g, DYE.gold, w); within(g, w, () => { for (let k = 0; k < 3; k++) cutLine(g, 1, q => { q.moveTo(sd * (30 + k * 2), -90 - k * 4); q.lineTo(sd * (44 + k), -100 - k * 3); }); }); ink(g, 1.3, w);
    }
    ink(g, 2.4, q => { q.moveTo(-2, -116); q.lineTo(-2, -126); }, DYE.brown);
    const pom = q => { q.arc(-2, -134, 9, 0, Math.PI * 2); };
    fill(g, DYE.red, pom); for (let k = 0; k < 10; k++) { const a = k * Math.PI / 5; cutLine(g, 1, q => { q.moveTo(-2 + Math.cos(a) * 3, -134 + Math.sin(a) * 3); q.lineTo(-2 + Math.cos(a) * 8, -134 + Math.sin(a) * 8); }); }
    ink(g, 1.3, pom);
  }, { seed: 21, ss: 3 });
}
function mkChest() {
  const body = q => smooth(q, [[-24, 4], [-28, -40], [-30, -78], [-25, -100], [-12, -114], [2, -120], [16, -118], [28, -108], [38, -92], [42, -70], [38, -46], [31, -22], [27, 4]]);
  return piece([-40, -130, 50, 10], g => {
    fill(g, DYE.gold, body);
    within(g, body, () => scalesOpen(g, -36, -90, 46, -16, 6.2));
    ink(g, 2.2, q => { q.moveTo(-28, -50); q.quadraticCurveTo(6, -42, 40, -50); });
    const mir = q => { q.arc(16, -62, 13, 0, Math.PI * 2); };
    fill(g, DYE.red, mir); cut(g, q => { q.arc(16, -62, 10, 0, Math.PI * 2); q.arc(16, -62, 7, 0, Math.PI * 2, true); }, 'nonzero'); ink(g, 1.4, mir);
    const cc = q => smooth(q, [[-25, -100], [-29, -90], [-19, -84], [-11, -91], [-1, -82], [9, -91], [19, -84], [29, -93], [36, -92], [32, -104], [18, -118], [2, -124], [-14, -120]]);
    fill(g, DYE.green, cc); within(g, cc, () => { for (const [x, y, f] of [[-19, -94, 1], [-1, -93, -1], [19, -94, 1]]) cloud(g, x, y, 5, 1.2, 1.3, f); lattice(g, -12, -120, 24, -104, 7, 1.5); }); ink(g, 1.5, cc);
    const belt = q => poly(q, [[-26, -14], [30, -14], [28, 5], [-24, 5]]);
    fill(g, DYE.red, belt); within(g, belt, () => { for (let x = -20; x < 24; x += 9) coin(g, x, -4.5, 3.4); }); ink(g, 1.5, belt);
    ink(g, 2.2, body);
  }, { seed: 22 });
}
function mkCape() {     // vermilion cape hanging behind the back, attached at the shoulders
  return piece([-70, -10, 20, 150], g => {
    const c = q => smooth(q, [[-10, 0], [12, 0], [8, 60], [14, 120], [0, 140], [-30, 142], [-62, 130], [-56, 80], [-40, 30]]);
    fill(g, DYE.red, c); within(g, c, () => { for (let y = 24; y < 130; y += 16) for (let x = -56; x < 10; x += 16) cloud(g, x + (y / 16 % 2) * 8, y, 5.5, 0, 1.2, (x / 16) % 2 ? 1 : -1); });
    g.save(); g.beginPath(); c(g); g.clip(); ink(g, 6, c, DYE.gold); g.restore(); ink(g, 1.8, c);
  }, { seed: 23 });
}
function mkSkirt() {    // tiger-skin kilt + vermilion panels
  return piece([-54, -8, 58, 150], g => {
    const kilt = q => smooth(q, [[-30, -4], [28, -4], [42, 50], [50, 130], [0, 136], [-46, 132], [-40, 50]]);
    fill(g, DYE.yellow, kilt);
    within(g, kilt, () => { for (let k = 0; k < 9; k++) { const y = 10 + k * 14; fill(g, DYE.ink, q => smooth(q, [[-44 + k * 2, y], [-10, y - 6 + (k % 2) * 8], [20, y + 2], [48, y - 4], [48, y + 4], [20, y + 8], [-10, y + 2 + (k % 2) * 8], [-44 + k * 2, y + 7]])); } for (let y = 20; y < 130; y += 22) cutLine(g, 2.2, q => { q.moveTo(-40, y); q.quadraticCurveTo(0, y - 6, 46, y); }); });
    ink(g, 1.8, kilt);
    const tab = q => smooth(q, [[-10, -3], [10, -3], [12, 80], [1, 104], [-10, 80]]);
    fill(g, DYE.red, tab); cloud(g, 1, 24, 6, 0, 1.3); coin(g, 1, 50, 5); plum(g, 1, 74, 3.2); ink(g, 1.5, tab);
  }, { seed: 24 });
}
function mkLeg() {
  return piece([-22, -12, 50, 226], g => {
    const tr = q => smooth(q, [[-13, -8], [13, -8], [15, 60], [15, 100], [13, 130], [-11, 132], [-14, 100], [-14, 60]]);
    fill(g, DYE.yellow, tr); within(g, tr, () => { lattice(g, -16, 20, 18, 132, 9, 1.7); }); ink(g, 1.7, tr);
    const boot = q => smooth(q, [[-13, 118], [13, 116], [14, 150], [15, 178], [26, 186], [38, 190], [43, 184], [45, 192], [40, 200], [-15, 200], [-15, 160]]);
    fill(g, DYE.ink, boot); within(g, boot, () => { cloud(g, 0, 140, 7, .3, 1.6); cloud(g, -2, 168, 5.5, 2.4, 1.4, -1); cutLine(g, 1.3, q => { q.moveTo(-13, 124); q.lineTo(13, 122); }); beadLine(g, -9, 151, 9, 150, 1.3, 4.5); });
    const sole = q => poly(q, [[-17, 199], [44, 197], [43, 204], [41, 221], [-15, 223], [-17, 212]]);
    fill(g, DYE.white, sole); within(g, sole, () => { cutLine(g, 1.4, q => { q.moveTo(-15, 205); q.lineTo(42, 203); q.moveTo(-15, 217); q.lineTo(41, 215.5); }); });
    ink(g, 1.7, sole);
  }, { seed: 25 });
}
function mkUA() {
  const sl = q => smooth(q, [[-12, 0], [12, 0], [11, 56], [-10, 56]]);
  return piece([-28, -28, 28, 76], g => {
    fill(g, DYE.red, sl); fill(g, DYE.red, q => q.arc(0, 60, 10, 0, Math.PI * 2));
    within(g, sl, () => scalesOpen(g, -14, 14, 14, 56, 5)); ink(g, 1.6, sl); ink(g, 1.5, q => q.arc(0, 60, 10, 0, Math.PI * 2));
    const gd = q => smooth(q, [[-21, -12], [-7, -25], [14, -23], [25, -7], [17, 12], [0, 19], [-19, 9]]);
    fill(g, DYE.gold, gd); cloud(g, 1, -4, 8.5, 0, 1.6); ink(g, 1.7, gd);
  }, { seed: 26 });
}
function mkFA() {
  return piece([-14, -12, 14, 60], g => {
    fill(g, DYE.red, q => q.arc(0, 0, 9, 0, Math.PI * 2)); ink(g, 1.4, q => q.arc(0, 0, 9, 0, Math.PI * 2));
    const cf = q => smooth(q, [[-10, -2], [10, -2], [9, 34], [-8, 34]]);
    fill(g, DYE.red, cf); within(g, cf, () => scalesOpen(g, -12, 8, 12, 32, 4.4)); ink(g, 1.5, cf);
    const br = q => poly(q, [[-9, 29], [9, 29], [8, 54], [-8, 54]]);
    fill(g, DYE.gold, br); within(g, br, () => lattice(g, -10, 29, 10, 54, 7, 1.5)); ink(g, 1.4, br);
  }, { seed: 27 });
}
function mkHand(kind) {
  return piece([-16, -6, 20, 32], g => {
    g.scale(1.15, 1.15);
    const f = kind === 'grip' ? q => smooth(q, [[-7, -1], [7, -1], [12, 8], [13, 16], [8, 21], [-2, 22], [-8, 14]])
      : q => smooth(q, [[-7, -1], [7, -1], [11, 6], [15, 14], [10, 22], [0, 20], [-6, 24], [-9, 12]]);
    fill(g, DYE.skin, f);
    if (kind === 'grip') { cut(g, q => { q.ellipse(2, 12, 2.6, 3.4, 0, 0, Math.PI * 2); }); for (const y of [8, 12.5, 17]) cutLine(g, .8, q => { q.moveTo(5, y); q.lineTo(10, y + .5); }); }
    else { for (let k = 0; k < 3; k++) cutLine(g, .8, q => { q.moveTo(2 + k * 3, 6 + k); q.lineTo(8 + k * 2, 18 - k * 2); }); }
    ink(g, 1.5, f);
  }, { seed: 28 });
}
function mkStaff() {    // 金箍棒: dark shaft, gold bands at both ends; centre at the origin, along -y..+y
  const L = 200;
  return piece([-12, -L / 2 - 6, 12, L / 2 + 6], g => {
    fill(g, '#2a1408', q => poly(q, [[-4, -L / 2], [4, -L / 2], [4, L / 2], [-4, L / 2]]));
    for (const y of [-L / 2, L / 2 - 28]) { const b = q => poly(q, [[-6, y], [6, y], [6, y + 28], [-6, y + 28]]); fill(g, DYE.gold, b); within(g, b, () => { for (let k = 0; k < 3; k++) cutLine(g, 1, q => { q.moveTo(-6, y + 7 + k * 7); q.lineTo(6, y + 7 + k * 7); }); }); ink(g, 1.3, b); }
    ink(g, 1.2, q => poly(q, [[-4, -L / 2], [4, -L / 2], [4, L / 2], [-4, L / 2]]));
  }, { seed: 29 });
}
let MP = null;
export function buildMonkey() {
  if (MP) return MP;
  MP = { head: mkHead(), chest: mkChest(), cape: mkCape(), skirt: mkSkirt(), leg: mkLeg(), ua: mkUA(), fa: mkFA(), handGrip: mkHand('grip'), handOpen: mkHand('open'), staff: mkStaff() };
  return MP;
}
export const MREST = { x: 0, y: 0, rot: 0, head: 0, waist: 0, legF: -.06, legB: .08, hF: [52, 96], hB: [-20, 100], bendF: 1, bendB: -1, haF: 0, haB: 0, staff: 1, staffA: -1.3, staffHand: 'F', flip: 1, tail: null, feat: null, cape: 0, staffK: 1, staffBlur: 0 };
// Solve world matrices for a pose (cloth units → via Cam)
export function drawMonkey(g, Cam, pose, opt = {}) {
  const P = buildMonkey(), p = { ...MREST, ...pose };
  const MW = mul(mul(T(p.x, p.y), S(p.flip, 1)), R(p.rot));          // puppet root in cloth space
  const W = mul(Cam, MW), K = scaleOf(Cam);
  const sF = ap(MW, ...MJ.shF), sB = ap(MW, ...MJ.shB);
  const tF = ap(MW, MJ.shF[0] + p.hF[0], MJ.shF[1] + p.hF[1]), tB = ap(MW, MJ.shB[0] + p.hB[0], MJ.shB[1] + p.hB[1]);
  const [aF1, aF2] = ik(sF, tF, UA, FA + HANDR, p.bendF * p.flip), [aB1, aB2] = ik(sB, tB, UA, FA + HANDR, p.bendB * p.flip);
  const armM = (s, a1, a2, ha) => { const Mu = mul(Cam, mul(T(...s), R(a1))); const Mf = mul(Mu, mul(T(...MJ.elbow), R(a2 - a1))); const Mh = mul(Mf, mul(T(...MJ.wrist), R(ha))); return [Mu, Mf, Mh]; };
  const [MuF, MfF, MhF] = armM(sF, aF1, aF2, p.haF), [MuB, MfB, MhB] = armM(sB, aB1, aB2, p.haB);
  const Mskirt = mul(W, R(p.waist)), MlegB = mul(Mskirt, mul(T(...MJ.hipB), R(p.legB))), MlegF = mul(Mskirt, mul(T(...MJ.hipF), R(p.legF)));
  const Mhead = mul(W, mul(T(...MJ.neck), R(p.head)));
  g.save(); g.globalCompositeOperation = 'multiply';
  if (opt.alpha != null) g.globalAlpha = opt.alpha;
  // tail (chain) behind everything
  const tb = ap(Mskirt, ...MJ.tail), tdyn = p.tail || [];
  set(g, [1, 0, 0, 1, 0, 0]);
  ribbon(g, tb, Math.PI * (p.flip > 0 ? .95 : .05) + p.rot * p.flip, 9, 16 * K, -.2 * p.flip, tdyn.map(v => v * p.flip), 4.6 * K, DYE.yellow, DYE.ink, K, .5);
  // feathers (two chains) from the cap
  const fb = ap(Mhead, ...MJ.feather), fd = p.feat || [[], []], ha = p.rot + p.head;
  const fa0 = p.flip > 0 ? -1.75 + ha : Math.PI + 1.75 - ha;
  ribbon(g, fb, fa0, 10, 23 * K, -.15 * p.flip, fd[0].map(v => v * p.flip), 4.2 * K, DYE.hide, DYE.gold, K);
  ribbon(g, [fb[0] + 5 * K * p.flip, fb[1]], fa0 + .2 * p.flip, 10, 21 * K, -.16 * p.flip, fd[1].map(v => v * p.flip), 3.8 * K, DYE.hide, '#5a2a14', K);
  // cape, back arm, legs, skirt, chest, head, front arm, staff
  dp(g, mul(W, mul(T(...MJ.cape), R(p.cape))), P.cape);
  dp(g, MuB, P.ua); dp(g, MfB, P.fa);
  const staffIn = p.staff ? (p.staffHand === 'B' ? MhB : MhF) : null;
  if (staffIn && p.staffHand === 'B') drawStaff(g, staffIn, p, P, K);
  dp(g, MhB, p.staffHand === 'B' && p.staff ? P.handGrip : P.handOpen);
  dp(g, MlegB, P.leg); dp(g, MlegF, P.leg); dp(g, Mskirt, P.skirt); dp(g, W, P.chest); dp(g, Mhead, P.head);
  dp(g, MuF, P.ua); dp(g, MfF, P.fa);
  if (staffIn && p.staffHand === 'F') drawStaff(g, staffIn, p, P, K);
  dp(g, MhF, p.staffHand === 'F' && p.staff ? P.handGrip : P.handOpen);
  g.restore();
  set(g, [1, 0, 0, 1, 0, 0]);
  const riv = [ap(W, ...MJ.neck), ap(W, ...MJ.shB), ap(W, ...MJ.shF), ap(Mskirt, ...MJ.hipB), ap(Mskirt, ...MJ.hipF), ap(MuB, ...MJ.elbow), ap(MfB, ...MJ.wrist), ap(MuF, ...MJ.elbow), ap(MfF, ...MJ.wrist)];
  if (opt.rivets !== false) for (const q of riv) rivet(g, q[0], q[1], 3.2 * K);
  // rod anchors: neck rod on the chest, one hand rod (front hand)
  return { rods: [ap(W, ...MJ.rod), ap(MhF, 0, 8)], M: { W, Mhead, MhF, MhB, Mskirt }, eye: ap(Mhead, 22 * HK, -50 * HK), staffM: staffIn };
}
function drawStaff(g, Mh, p, P, K) {
  const G = ap(Mh, 2.3, 13.8);
  let M = mul(T(G[0], G[1]), mul(R(p.staffA * p.flip + (p.flip > 0 ? 0 : 0)), S(p.staffK)));
  // the staff piece is drawn in viewport scale K (Mh already includes the camera)
  M = mul(M, S(K));
  if (p.staffBlur > 0) { g.save(); g.filter = `blur(${p.staffBlur * K}px)`; }
  set(g, M); g.translate(0, -p.staffOff || 0); g.drawImage(P.staff.c, P.staff.x0, P.staff.y0, P.staff.w, P.staff.h);
  if (p.staffBlur > 0) g.restore();
}

// ================= White Bone Demon =================
export const DJ = { neck: [4, -112], shF: [14, -98], shB: [-4, -100], rod: [2, -108], elbow: [0, 54], wrist: [0, 50], rib1: [-14, -20], rib2: [-18, -16] };
const DUA = 54, DFA = 48, DHR = 12;
function maidenHead() {
  return piece([-50 * HK, -140 * HK, 44 * HK, 14 * HK], g => {
    g.scale(HK, HK);
    // Solid face (the tell): skin-dyed hide with the features cut as holes
    const face = q => smooth(q, [[-2, 4], [8, 6], [18, 0], [26, -12], [30, -26], [34, -38], [30, -48], [26, -60], [16, -70], [2, -72], [-8, -62], [-10, -40], [-8, -20], [-6, -6]]);
    fill(g, DYE.skin, face);
    within(g, face, () => {
      cut(g, q => { q.ellipse(16, -44, 7.5, 3.2, -.25, 0, Math.PI * 2); });          // slim eye hole
      fill(g, DYE.ink, q => { q.arc(18.5, -44.5, 2, 0, Math.PI * 2); });
      cutLine(g, 1.2, q => { q.moveTo(8, -54); q.quadraticCurveTo(18, -58, 26, -52); });   // brow
      cut(g, q => { q.ellipse(24, -20, 3.4, 1.6, -.3, 0, Math.PI * 2); });            // small mouth
      cutLine(g, .9, q => { q.moveTo(30, -34); q.quadraticCurveTo(33, -36, 31, -39); });
    });
    ink(g, 2, face);
    // Hair: ink with a high bun, comb lines cut
    const hair = q => smooth(q, [[-6, -6], [-14, -30], [-16, -56], [-12, -76], [0, -84], [14, -82], [24, -70], [16, -70], [2, -72], [-8, -62], [-10, -40], [-8, -20]]);
    fill(g, DYE.ink, hair); within(g, hair, () => { for (let k = 0; k < 6; k++) cutLine(g, .7, q => { q.moveTo(-4 + k * 3, -80); q.quadraticCurveTo(-14 + k, -60 + k * 2, -12 + k * 1.5, -30 + k * 2); }); });
    const bun = q => { q.ellipse(-10, -92, 13, 10, .3, 0, Math.PI * 2); };
    fill(g, DYE.ink, bun); within(g, bun, () => { cutLine(g, .8, q => { q.moveTo(-20, -92); q.quadraticCurveTo(-10, -100, 0, -90); }); });
    // flower (vermilion) and a jade pin
    const fl = q => { for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; q.moveTo(4 + Math.cos(a) * 7, -94 + Math.sin(a) * 7); q.arc(4 + Math.cos(a) * 5, -94 + Math.sin(a) * 5, 4, 0, Math.PI * 2); } };
    fill(g, DYE.red, fl); cut(g, q => q.arc(4, -94, 2, 0, Math.PI * 2)); ink(g, 1, fl);
    ink(g, 2.4, q => { q.moveTo(-24, -98); q.lineTo(-2, -82); }, DYE.jade);
  }, { seed: 31, ss: 3 });
}
function skullHead() {
  return piece([-46 * HK, -140 * HK, 48 * HK, 16 * HK], g => {
    g.scale(HK, HK);
    const sk = q => smooth(q, [[-2, 2], [10, 4], [22, -4], [30, -16], [34, -30], [36, -46], [30, -60], [20, -72], [4, -78], [-14, -74], [-26, -60], [-28, -40], [-22, -24], [-16, -10]]);
    fill(g, DYE.ink, sk);
    within(g, sk, () => {
      cut(g, q => { q.ellipse(18, -46, 9, 7, -.2, 0, Math.PI * 2); });                       // eye socket
      cut(g, q => { q.moveTo(30, -34); q.lineTo(34, -26); q.lineTo(27, -24); q.closePath(); });   // nose hole
      for (let k = 0; k < 5; k++) cut(g, q => { q.rect(12 + k * 4.2, -14, 2.4, 9); });          // teeth
      cutLine(g, 1, q => { q.moveTo(8, -10); q.lineTo(34, -16); });                              // jaw line
      cutLine(g, .9, q => { q.moveTo(-6, -66); q.quadraticCurveTo(0, -50, -14, -40); });        // crack
      cutLine(g, .8, q => { q.moveTo(-20, -56); q.lineTo(-8, -60); });
    });
    ink(g, 2.4, sk);
    // a few grey hair wisps
    for (let k = 0; k < 4; k++) ink(g, 1.4, q => { q.moveTo(-18 - k * 2, -66 + k * 6); q.quadraticCurveTo(-34 - k * 3, -60 + k * 10, -30 - k * 2, -36 + k * 10); }, '#6a5a4a');
  }, { seed: 32, ss: 3 });
}
function maidenBody() {   // dress from the shoulders to the hem; no legs
  return piece([-70, -126, 70, 150], g => {
    const d = q => smooth(q, [[-22, -118], [0, -124], [22, -118], [30, -90], [28, -50], [36, 0], [52, 80], [62, 140], [0, 146], [-60, 140], [-50, 80], [-34, 0], [-26, -50], [-28, -90]]);
    fill(g, DYE.green, d);
    within(g, d, () => { lattice(g, -64, -40, 64, 150, 11, 2.4); for (let y = -100; y < -50; y += 12) cutLine(g, 1.2, q => { q.moveTo(-26, y); q.quadraticCurveTo(0, y + 6, 28, y); }); });
    g.save(); g.beginPath(); d(g); g.clip(); ink(g, 7, d, DYE.red); g.restore();
    const sash = q => poly(q, [[-30, -46], [32, -46], [30, -30], [-28, -30]]);
    fill(g, DYE.red, sash); within(g, sash, () => { for (let x = -24; x < 28; x += 9) coin(g, x, -38, 3.2); }); ink(g, 1.4, sash);
    ink(g, 2, d);
  }, { seed: 33 });
}
function skullBody() {    // ribcage + tattered indigo robe
  return piece([-70, -126, 70, 150], g => {
    const robe = q => poly(q, [[-22, -118], [0, -124], [22, -118], [30, -90], [34, -20], [44, 40], [52, 90], [40, 110], [58, 130], [30, 124], [20, 146], [4, 120], [-10, 144], [-20, 118], [-40, 140], [-34, 110], [-56, 128], [-44, 86], [-36, 40], [-30, -20], [-28, -90]]);
    fill(g, DYE.teal, robe);
    within(g, robe, () => { for (let k = 0; k < 14; k++) { const x = -44 + k * 7, y0 = 20 + (k % 3) * 20; cutTaper(g, [[x, y0], [x + 4, y0 + 40 + (k % 2) * 30], [x + 2, y0 + 90]], 3); } });
    ink(g, 2, robe);
    const rib = q => smooth(q, [[-20, -112], [20, -112], [28, -70], [22, -30], [0, -22], [-22, -30], [-28, -70]]);
    fill(g, DYE.hide, rib);
    within(g, rib, () => { for (let k = 0; k < 6; k++) { const y = -100 + k * 13; cutLine(g, 3.2, q => { q.moveTo(-26, y + 4); q.quadraticCurveTo(-8, y - 6, -2, y + 2); }); cutLine(g, 3.2, q => { q.moveTo(26, y + 4); q.quadraticCurveTo(8, y - 6, 2, y + 2); }); } });
    ink(g, 2, rib); ink(g, 2.4, q => { q.moveTo(0, -116); q.lineTo(0, -24); }, DYE.ink);
  }, { seed: 34 });
}
function maidenUA() { return piece([-16, -14, 16, 70], g => { const s = q => smooth(q, [[-11, 0], [11, 0], [10, 54], [-9, 54]]); fill(g, DYE.hide2, s); within(g, s, () => beadLine(g, -6, 10, -6, 50, 1.2, 6)); ink(g, 1.5, s); fill(g, DYE.hide2, q => q.arc(0, 54, 8, 0, 7)); ink(g, 1.3, q => q.arc(0, 54, 8, 0, 7)); }, { seed: 35 }); }
function maidenFA() { return piece([-30, -12, 20, 70], g => { const s = q => smooth(q, [[-9, 0], [9, 0], [10, 40], [14, 60], [-26, 64], [-14, 40], [-10, 20]]); fill(g, DYE.white, s); within(g, s, () => { for (let k = 0; k < 4; k++) cutLine(g, 1, q => { q.moveTo(-6 - k * 4, 36 + k * 4); q.lineTo(2 - k * 3, 60); }); }); ink(g, 1.5, s); }, { seed: 36 }); }
function boneUA() { return piece([-10, -12, 10, 68], g => { fill(g, DYE.hide, q => poly(q, [[-4, 0], [4, 0], [5, 52], [-5, 52]])); fill(g, DYE.hide, q => q.arc(0, 54, 7, 0, 7)); fill(g, DYE.hide, q => q.arc(0, 2, 7, 0, 7)); ink(g, 1.4, q => poly(q, [[-4, 0], [4, 0], [5, 52], [-5, 52]])); ink(g, 1.2, q => q.arc(0, 54, 7, 0, 7)); }, { seed: 37 }); }
function boneFA() { return piece([-10, -12, 10, 62], g => { fill(g, DYE.hide, q => poly(q, [[-4, 0], [4, 0], [4, 50], [-4, 50]])); ink(g, 1.4, q => poly(q, [[-4, 0], [4, 0], [4, 50], [-4, 50]])); fill(g, DYE.hide, q => q.arc(0, 0, 6, 0, 7)); ink(g, 1.2, q => q.arc(0, 0, 6, 0, 7)); }, { seed: 38 }); }
function claw() { return piece([-14, -6, 34, 40], g => { const p = q => smooth(q, [[-6, -1], [6, -1], [10, 8], [9, 18], [2, 22], [-6, 18], [-8, 8]]); fill(g, DYE.hide, p); ink(g, 1.4, p); for (let k = 0; k < 4; k++) { const a = -.4 + k * .35, x0 = 4 + k * 2, y0 = 16 + k * 1.5; fill(g, DYE.ink, q => { q.moveTo(x0 - 2, y0); q.quadraticCurveTo(x0 + Math.cos(a) * 14, y0 + Math.sin(a) * 14 + 8, x0 + Math.cos(a) * 24, y0 + Math.sin(a) * 24 + 6); q.quadraticCurveTo(x0 + Math.cos(a) * 12, y0 + Math.sin(a) * 12 + 2, x0 + 2, y0); q.closePath(); }); } }, { seed: 39 }); }
function hand2() { return piece([-14, -6, 20, 34], g => { const p = q => smooth(q, [[-6, -1], [6, -1], [10, 6], [14, 14], [8, 22], [-2, 20], [-6, 24], [-8, 12]]); fill(g, DYE.skin, p); for (let k = 0; k < 3; k++) cutLine(g, .7, q => { q.moveTo(2 + k * 3, 6 + k); q.lineTo(7 + k * 2, 18 - k * 2); }); ink(g, 1.4, p); }, { seed: 40 }); }
function basket() { return piece([-30, -40, 30, 30], g => { const b = q => smooth(q, [[-26, -4], [26, -4], [20, 22], [-20, 22]]); fill(g, DYE.yellow, b); within(g, b, () => lattice(g, -28, -6, 28, 24, 7, 1.6)); ink(g, 1.6, b); ink(g, 2.4, q => { q.moveTo(-18, -4); q.quadraticCurveTo(0, -42, 18, -4); }, DYE.brown); for (const [x, y] of [[-12, -10], [2, -14], [14, -8]]) { fill(g, DYE.red, q => q.arc(x, y, 7, 0, 7)); cutLine(g, .8, q => { q.moveTo(x - 2, y - 7); q.lineTo(x + 1, y + 2); }); ink(g, 1.1, q => q.arc(x, y, 7, 0, 7)); } }, { seed: 41 }); }
let DP = null;
export function buildDemon() {
  if (DP) return DP;
  DP = { headM: maidenHead(), headS: skullHead(), bodyM: maidenBody(), bodyS: skullBody(), uaM: maidenUA(), faM: maidenFA(), uaS: boneUA(), faS: boneFA(), claw: claw(), hand: hand2(), basket: basket() };
  return DP;
}
export const DREST = { x: 0, y: 0, rot: 0, head: 0, form: 'maiden', hF: [40, 96], hB: [-16, 98], bendF: 1, bendB: -1, haF: 0, haB: 0, basket: 1, flip: -1, rib: null, headSwap: 0 };
export function drawDemon(g, Cam, pose, opt = {}) {
  const P = buildDemon(), p = { ...DREST, ...pose }, sk = p.form === 'skull';
  const MW = mul(mul(T(p.x, p.y), S(p.flip, 1)), R(p.rot)), W = mul(Cam, MW), K = scaleOf(Cam);
  const sF = ap(MW, ...DJ.shF), sB = ap(MW, ...DJ.shB);
  const tF = ap(MW, DJ.shF[0] + p.hF[0], DJ.shF[1] + p.hF[1]), tB = ap(MW, DJ.shB[0] + p.hB[0], DJ.shB[1] + p.hB[1]);
  const [aF1, aF2] = ik(sF, tF, DUA, DFA + DHR, p.bendF * p.flip), [aB1, aB2] = ik(sB, tB, DUA, DFA + DHR, p.bendB * p.flip);
  const armM = (s, a1, a2, ha) => { const Mu = mul(Cam, mul(T(...s), R(a1))); const Mf = mul(Mu, mul(T(...DJ.elbow), R(a2 - a1))); const Mh = mul(Mf, mul(T(...DJ.wrist), R(ha))); return [Mu, Mf, Mh]; };
  const [MuF, MfF, MhF] = armM(sF, aF1, aF2, p.haF), [MuB, MfB, MhB] = armM(sB, aB1, aB2, p.haB);
  const Mhead = mul(W, mul(T(...DJ.neck), R(p.head)));
  g.save(); g.globalCompositeOperation = 'multiply'; if (opt.alpha != null) g.globalAlpha = opt.alpha;
  // ribbons / tatters from the waist (two chains)
  set(g, [1, 0, 0, 1, 0, 0]);
  const rb = ap(W, -20 * p.flip, -30), rd = p.rib || [[], []];
  const a0 = p.flip > 0 ? Math.PI * .85 : Math.PI * .15;
  ribbon(g, rb, a0 + p.rot * p.flip, 9, 15 * K, .12 * p.flip, rd[0].map(v => v * p.flip), sk ? 3.6 * K : 4.2 * K, sk ? DYE.teal : DYE.red, sk ? null : DYE.jade, K, .7);
  ribbon(g, [rb[0] - 6 * K * p.flip, rb[1] + 8 * K], a0 - .3 * p.flip + p.rot * p.flip, 8, 14 * K, .1 * p.flip, rd[1].map(v => v * p.flip), sk ? 3 * K : 3.6 * K, sk ? DYE.teal : DYE.jade, sk ? null : DYE.red, K, .7);
  dp(g, MuB, sk ? P.uaS : P.uaM); dp(g, MfB, sk ? P.faS : P.faM); dp(g, MhB, sk ? P.claw : P.hand);
  dp(g, W, sk ? P.bodyS : P.bodyM);
  // head: during a swap the old head lifts off (grow, blur, fade) while the new one presses on
  const drawHead = (pc, k, bl, al) => { if (al <= 0) return; g.save(); g.globalAlpha = al * (opt.alpha ?? 1); if (bl > 0) g.filter = `blur(${bl * K}px)`; const M = mul(Mhead, mul(T(0, -40 * HK), mul(S(k), T(0, 40 * HK)))); dp(g, M, pc); g.restore(); };
  if (p.headSwap > 0 && p.headSwap < 1) {
    const u = p.headSwap;
    drawHead(P.headM, 1 + u * 1.2, u * 28, 1 - Math.min(1, u * 1.6));
    const v = Math.max(0, (u - .3) / .7); drawHead(P.headS, 1 + (1 - v) * 1.4, (1 - v) * 26, .2 + .8 * v);
  } else dp(g, Mhead, sk ? P.headS : P.headM);
  dp(g, MuF, sk ? P.uaS : P.uaM); dp(g, MfF, sk ? P.faS : P.faM);
  if (!sk && p.basket) { const Mb = mul(MhF, mul(T(0, 30), R(-aF2 - p.haF))); dp(g, Mb, P.basket); }
  dp(g, MhF, sk ? P.claw : P.hand);
  g.restore();
  set(g, [1, 0, 0, 1, 0, 0]);
  const riv = [ap(W, ...DJ.neck), ap(W, ...DJ.shB), ap(W, ...DJ.shF), ap(MuB, ...DJ.elbow), ap(MfB, ...DJ.wrist), ap(MuF, ...DJ.elbow), ap(MfF, ...DJ.wrist)];
  if (opt.rivets !== false) for (const q of riv) rivet(g, q[0], q[1], 3.2 * K);
  return { rods: [ap(W, ...DJ.rod), ap(MhF, 0, 8)], M: { W, Mhead, MhF, MhB }, claw: ap(MhF, 14 * 1, 30) };
}

// ================= Show scenery =================
const groundY = x => 900 + 8 * Math.sin(x / 300) + 5 * Math.sin(x / 110 + 1);
export const SGROUND = groundY;
function mountain() {
  const pk = [[1180, 900], [1260, 760], [1360, 640], [1440, 690], [1540, 560], [1640, 620], [1740, 540], [1850, 660], [1930, 760], [1960, 900]];
  const top = x => { for (let i = 0; i < pk.length - 1; i++) if (x >= pk[i][0] && x <= pk[i + 1][0]) { const u = (x - pk[i][0]) / (pk[i + 1][0] - pk[i][0]); return pk[i][1] + (pk[i + 1][1] - pk[i][1]) * (u * u * (3 - 2 * u)); } return 930; };
  return piece([1170, 520, 1970, 940], g => {
    const m = q => smooth(q, [...pk, [1960, 940], [1180, 940]]);
    fill(g, '#8a7a5a', m);
    within(g, m, () => {
      strata(g, 1170, 1970, x => top(x) + 4 * Math.sin(x / 40), 16, 18, 4.2);
      const r = mulberry(5); for (let i = 1; i < pk.length - 1; i++) if (pk[i][1] < pk[i - 1][1] && pk[i][1] < pk[i + 1][1]) { cloud(g, pk[i][0] - 14, pk[i][1] + 44, 11, r() * 6, 2.2, 1); cloud(g, pk[i][0] + 16, pk[i][1] + 66, 8, r() * 6, 2, -1); }
      // the cave mouth: a dark arch with a bone-white rim
      fill(g, DYE.ink, q => { q.moveTo(1500, 900); q.quadraticCurveTo(1500, 760, 1600, 760); q.quadraticCurveTo(1700, 760, 1700, 900); q.closePath(); });
      cut(g, q => { q.moveTo(1520, 900); q.quadraticCurveTo(1520, 790, 1600, 790); q.quadraticCurveTo(1680, 790, 1680, 900); q.closePath(); });
      for (let k = 0; k < 7; k++) cut(g, q => { q.ellipse(1600 + Math.cos(.4 + k * .38) * 90 * (k % 2 ? 1 : -1), 780 + k * 4, 3, 2, 0, 0, 7); });
    });
    ink(g, 2.4, m);
  }, { ss: 1.4, seed: 51 });
}
function pine() {
  return piece([-220, -520, 220, 20], g => {
    const trunk = q => smooth(q, [[-16, 0], [16, 0], [12, -120], [30, -200], [20, -300], [40, -380], [26, -400], [4, -320], [-12, -240], [-30, -160], [-20, -80]]);
    fill(g, DYE.brown, trunk); within(g, trunk, () => { for (let k = 1; k < 12; k++) cutLine(g, 1.4, q => { const y = -k * 30; q.moveTo(-14, y + 4); q.lineTo(0, y - 3); q.lineTo(14, y + 4); }); }); ink(g, 1.8, trunk);
    const r = mulberry(6);
    for (const [cx, cy, rw, rh] of [[-120, -330, 110, 46], [60, -420, 120, 50], [-40, -250, 90, 40], [120, -300, 100, 44], [-150, -440, 90, 40], [20, -500, 110, 44]]) {
      const cl = q => smooth(q, [[cx - rw, cy], [cx - rw * .6, cy - rh], [cx, cy - rh * 1.2], [cx + rw * .6, cy - rh], [cx + rw, cy], [cx + rw * .5, cy + rh * .5], [cx - rw * .5, cy + rh * .5]]);
      fill(g, DYE.green, cl);
      within(g, cl, () => { for (let k = 0; k < 26; k++) { const x = cx - rw + r() * 2 * rw, y = cy - rh + r() * 1.6 * rh, a = -1.2 + r() * .4; cutLine(g, 1.6, q => { q.moveTo(x, y); q.lineTo(x + Math.cos(a) * 14, y + Math.sin(a) * 14); q.moveTo(x, y); q.lineTo(x + Math.cos(a + .5) * 12, y + Math.sin(a + .5) * 12); q.moveTo(x, y); q.lineTo(x + Math.cos(a - .5) * 12, y + Math.sin(a - .5) * 12); }); } });
      ink(g, 1.8, cl);
      ink(g, 4, q => { q.moveTo(cx, cy + rh * .4); q.quadraticCurveTo(cx / 2, (cy + rh) / 2 - 60, 10, cy + 120); }, DYE.brown);
    }
  }, { ss: 1.6, seed: 52 });
}
function cloudPiece() {   // 筋斗云: a cream swirl cloud with cloud-scroll cuts, on a rod
  return piece([-150, -70, 150, 50], g => {
    const c = q => smooth(q, [[-140, 10], [-120, -30], [-80, -50], [-40, -30], [0, -60], [40, -36], [90, -54], [130, -20], [140, 20], [100, 36], [40, 30], [-20, 40], [-80, 34], [-130, 36]]);
    fill(g, '#efe2c0', c);
    within(g, c, () => { for (const [x, y, rr, f] of [[-100, 0, 22, 1], [-40, -10, 20, -1], [20, -20, 24, 1], [80, -14, 20, -1], [120, 6, 16, 1], [-10, 20, 14, -1]]) cloud(g, x, y, rr, 0, 2.4, f); });
    g.save(); g.beginPath(); c(g); g.clip(); ink(g, 8, c, DYE.teal); g.restore(); ink(g, 2.2, c);
  }, { ss: 1.6, seed: 53 });
}
function groundStrip() {
  const top = []; for (let x = -10; x <= 1930; x += 16) top.push([x, groundY(x)]);
  return piece([0, 870, 1920, 984], g => {
    const gp = q => poly(q, top.concat([[1930, 980], [-10, 980]]));
    fill(g, '#8a5e30', gp);
    within(g, gp, () => { g.fillStyle = DYE.brown; g.fillRect(-10, 958, 1940, 30); meander(g, 0, 973, 1920, 6, 1.8); for (let x = 20; x < 1920; x += 38) coin(g, x, 946, 5.5);
      const rr = mulberry(2); for (let x = 8; x < 1910; x += 18 + rr() * 16) { const y = groundY(x) + 3, h = 12 + rr() * 12; fill(g, DYE.green, q => poly(q, [[x - 6, y + 6], [x - 3, y - h], [x, y + 2], [x + 4, y - h * .8], [x + 7, y + 6]])); } });
    ink(g, 2.4, q => poly(q, top, false), '#2e1a0c');
  }, { ss: 1.5, seed: 54 });
}
let SC = null;
export function buildShowScenery() { if (SC) return SC; SC = { mountain: mountain(), pine: pine(), cloud: cloudPiece(), ground: groundStrip() }; return SC; }
