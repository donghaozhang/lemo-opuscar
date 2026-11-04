// The other people: 奶奶 (grandma), 妈妈, 爸爸, two villagers, the bus driver's cap. Same rig as the girl (profile, origin at the soles), own head and coat pieces.
import { PAL, piece, P, Pl, trace, fill, cut, cutTaper, inset, within, ellipsePoly, curve } from '../engine/paper.js';
import { sawRow, crescent, crescentRows, swirl, rosette, plum, coin, taper, dots, along } from '../engine/motifs.js';
import { mul, T, R, S, put, ap } from '../engine/rig.js';
import { buildGirl, GJ, drawGirl } from './girl.js';

const FAR = '#b8191b';
const F = {};
const HEADO = (r, cy) => { const o = []; for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI * 2; o.push([Math.cos(a) * r * (1 + .04 * Math.cos(a * 2)), cy + Math.sin(a) * r * .97]); } return o; };
// shared face drawing (profile facing right): eye at E, brow, mouth
function face(g, E, kind, sc = 1) {
  const r = 12 * sc;
  if (kind === 'smile' || kind === 'laugh') { crescent(g, E[0], E[1] + 4 * sc, r, Math.PI * 1.08, Math.PI * 1.92, 5 * sc); }
  else if (kind === 'closed') { crescent(g, E[0], E[1] - 3 * sc, r, Math.PI * .1, Math.PI * .9, 4 * sc); }
  else {
    const up = kind === 'worried' ? 14 : kind === 'surprise' ? 15 : 11;
    crescent(g, E[0], E[1] + 2 * sc, r, Math.PI * 1.05, Math.PI * 1.95, up * sc);
    crescent(g, E[0], E[1] - 1 * sc, r * .95, Math.PI * .12, Math.PI * .88, 3 * sc);
    cut(g, q => q.arc(E[0] + 2 * sc, E[1] - 2 * sc + (kind === 'worried' ? -1 : 0), (kind === 'surprise' ? 4 : 5.5) * sc, 0, 7));
  }
  const by = E[1] - 24 * sc, bi = kind === 'worried' ? -8 * sc : kind === 'surprise' ? -8 * sc : kind === 'stern' ? 5 * sc : -1 * sc, bo = kind === 'surprise' ? -6 * sc : 0;
  taper(g, [[E[0] - 14 * sc, by + bo], [E[0], by - 3 * sc], [E[0] + 14 * sc, by + bi]], 3.2 * sc);
  const M = [E[0] + 16 * sc, E[1] + 30 * sc];
  if (kind === 'smile') taper(g, [[M[0] - 10 * sc, M[1] - 2 * sc], [M[0] - 3 * sc, M[1] + 2 * sc], [M[0] + 5 * sc, M[1] - 3 * sc]], 3 * sc);
  else if (kind === 'laugh') cut(g, q => { q.moveTo(M[0] - 12 * sc, M[1] - 4 * sc); q.quadraticCurveTo(M[0] - 2 * sc, M[1] + 12 * sc, M[0] + 6 * sc, M[1] - 2 * sc); q.closePath(); });
  else if (kind === 'surprise') cut(g, q => q.ellipse(M[0] - 2 * sc, M[1], 4 * sc, 5.5 * sc, 0, 0, 7));
  else if (kind === 'worried') taper(g, [[M[0] - 9 * sc, M[1]], [M[0] - 3 * sc, M[1] - 3 * sc], [M[0] + 4 * sc, M[1]]], 2.6 * sc);
  else taper(g, [[M[0] - 8 * sc, M[1]], [M[0] + 5 * sc, M[1]]], 2.6 * sc);
}
// —— 奶奶: a bun, round glasses (two crescent rims with a bridge), a shawl, an apron ——
function grandmaHead(kind, col = PAL.red, seed = 31) {
  return piece([-110, -200, 100, 14], g => {
    const out = P(HEADO(70, -78), true, .3, seed);
    fill(g, q => trace(q, P(ellipsePoly(-62, -126, 26, 24, 0, 24).slice(0, -1), true, .4, seed + 1)), col);   // bun
    fill(g, q => trace(q, out), col);
    inset(g, out, 3.5, 1.5, col);
    swirl(g, -62, -126, 16, 1.9, 3.4, -1.2, 1);
    // hair: parted, combed back; hairline + strands
    const hairline = curve([[62, -118], [40, -128], [10, -136], [-20, -134], [-46, -120], [-60, -100]], false, 2);
    cutTaper(g, hairline, 3.2);
    for (const [r, a0, a1] of [[40, -2.8, -1.2], [52, -3.0, -1.4]]) { const pts = []; for (let i = 0; i <= 20; i++) { const a = a0 + (a1 - a0) * i / 20; pts.push([-2 + Math.cos(a) * r, -84 + Math.sin(a) * r]); } cutTaper(g, pts, 2.8); }
    // glasses: a round rim (two crescents leaving bridges) on the eye + an arm back to the ear
    const E = [36, -86];
    crescent(g, E[0], E[1], 19, -2.3, .5, 3); crescent(g, E[0], E[1], 19, .9, 3.6, 3);
    cutTaper(g, [[18, -92], [0, -90], [-12, -86]], 2.4);
    face(g, E, kind, .9);
    cutTaper(g, curve([[-4, -92], [-12, -84], [-10, -72], [-2, -68]], false, 2), 2.6);   // ear
    // wrinkle crescents on the cheek
    crescent(g, 52, -66, 8, Math.PI * 1.1, Math.PI * 1.9, 2);
  }, { seed, col });
}
function grandmaTorso(col = PAL.red, seed = 33) {
  return piece([-70, -140, 70, 36], g => {
    const out = P([[-16, -122], [12, -126], [30, -116], [40, -94], [44, -60], [46, -30], [52, 0], [60, 22], [20, 28], [-16, 28], [-58, 22], [-50, -10], [-42, -50], [-40, -90], [-30, -112]], true, .3, seed);
    fill(g, q => trace(q, out), col); inset(g, out, 3.5, 1.5, col);
    // shawl: a sawtooth-fringed triangle over the shoulders
    const shawl = curve([[-36, -108], [-20, -70], [0, -56], [22, -70], [36, -104]], false, 2);
    cutTaper(g, shawl, 2.6); sawRow(g, shawl, 9, 6, -1, .7);
    // apron: plum holes in rows, a tie at the waist
    within(g, out, () => { for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) plum(g, -24 + c * 26 + (r % 2) * 13, -36 + r * 24, 6.5); });
    cutTaper(g, curve([[-44, -46], [0, -44], [46, -46]], false, 2), 2.6);
    const hem = curve([[-54, 12], [0, 14], [56, 12]], false, 2); cutTaper(g, hem, 2.4); sawRow(g, hem, 8, 6, -1, .7);
    for (const [x, y] of [[26, -100], [30, -78]]) coin(g, x, y, 4);
  }, { seed, col });
}
// —— adults (妈妈 / 爸爸 / villagers): taller coat, scarf, hat variants ——
function adultHead(kind, hat, col = PAL.red, seed = 41) {
  return piece([-110, -230, 100, 14], g => {
    const out = P(HEADO(66, -80), true, .3, seed);
    if (hat === 'bob') {   // 妈妈: a bob with a side part, a flower clip
      fill(g, q => trace(q, P([[-70, -60], [-82, -100], [-74, -142], [-40, -162], [10, -164], [50, -150], [68, -122], [62, -100], [40, -90], [10, -96], [-20, -92], [-44, -76], [-56, -58]], true, .3, seed + 2)), col);
    }
    fill(g, q => trace(q, out), col);
    inset(g, out, 3.5, 1.5, col);
    if (hat === 'bob') { const fr = curve([[60, -118], [34, -126], [6, -128], [-24, -122], [-46, -104]], false, 2); cutTaper(g, fr, 3); sawRow(g, fr, 9, 5.5, 1, .7); plum(g, -56, -140, 9); for (const [r, a0, a1] of [[44, -2.9, -1.5], [56, -3.1, -1.7]]) { const pts = []; for (let i = 0; i <= 20; i++) { const a = a0 + (a1 - a0) * i / 20; pts.push([-6 + Math.cos(a) * r, -92 + Math.sin(a) * r]); } cutTaper(g, pts, 2.8); } }
    else if (hat === 'furhat') {   // 爸爸 and villagers: a fur hat with ear flaps
      const h = P([[-80, -118], [-76, -150], [-50, -176], [-6, -186], [40, -176], [66, -150], [72, -120], [60, -112], [-70, -112]], true, .3, seed + 3);
      fill(g, q => trace(q, h), col); inset(g, h, 3.5, 1.5, col);
      const band = curve([[-74, -124], [0, -128], [68, -124]], false, 2); cutTaper(g, band, 2.6); sawRow(g, band, 10, 6, 1, .72);
      fill(g, q => trace(q, P([[-78, -120], [-92, -96], [-88, -60], [-70, -66], [-66, -112]], true, .3, seed + 4)), col);   // ear flap
      crescentRows(g, -90, -100, -68, -70, 6, 2.2, 0, .72);
    } else if (hat === 'cap') {   // bus driver / villager 2: a peaked cap
      const h = P([[-72, -116], [-68, -150], [-36, -170], [10, -172], [50, -160], [66, -130], [96, -116], [94, -108], [-70, -108]], true, .3, seed + 5);
      fill(g, q => trace(q, h), col); inset(g, h, 3.5, 1.5, col); cutTaper(g, curve([[-66, -118], [0, -122], [66, -118]], false, 2), 2.6); rosette(g, 0, -146, 8, 6, 0, .25);
    }
    face(g, [38, -84], kind, 1);
    cutTaper(g, curve([[-2, -90], [-10, -82], [-8, -70], [0, -66]], false, 2), 2.6);
  }, { seed, col });
}
function adultTorso(col = PAL.red, seed = 43, scarf = true) {
  return piece([-70, -170, 70, 36], g => {
    const out = P([[-16, -150], [12, -154], [32, -142], [42, -110], [44, -70], [46, -36], [52, -4], [60, 24], [20, 30], [-16, 30], [-58, 24], [-50, -10], [-42, -60], [-40, -110], [-30, -140]], true, .3, seed);
    fill(g, q => trace(q, out), col); inset(g, out, 3.5, 1.5, col);
    if (scarf) { const sc = curve([[-34, -134], [-10, -126], [20, -128], [38, -140]], false, 2); cutTaper(g, sc, 3); sawRow(g, sc, 9, 6, 1, .7); cutTaper(g, curve([[-30, -118], [-6, -112], [24, -114], [40, -124]], false, 2), 2.4); crescentRows(g, -34, -134, 40, -112, 6, 2.2, 0, .72); }
    cutTaper(g, curve([[30, -120], [34, -80], [38, -40], [44, -4], [50, 22]], false, 2), 2.6);
    for (const y of [-100, -70, -40, -10]) coin(g, 24, y, 4.2);
    within(g, out, () => { g.save(); g.beginPath(); g.rect(-38, -104, 60, 110); g.clip(); crescentRows(g, -38, -104, 22, 6, 7.5, 2.8, 0, .72); g.restore(); });
    const hem = curve([[-54, 14], [0, 16], [56, 14]], false, 2); cutTaper(g, hem, 2.4); sawRow(g, hem, 8, 6, -1, .7);
    taper(g, [[-26, -120], [-28, -70], [-30, -24]], 2.4);
  }, { seed, col });
}
export function buildFolk() {
  if (F.gm) return F;
  const G = buildGirl();
  F.gm = { head: {}, torso: grandmaTorso() }; for (const k of ['smile', 'neutral', 'worried', 'surprise', 'laugh', 'closed']) F.gm.head[k] = grandmaHead(k);
  F.mom = { head: {}, torso: adultTorso(PAL.red, 45) }; for (const k of ['smile', 'neutral', 'worried', 'surprise', 'laugh']) F.mom.head[k] = adultHead(k, 'bob', PAL.red, 51);
  F.dad = { head: {}, torso: adultTorso(PAL.red, 47) }; for (const k of ['smile', 'neutral', 'worried', 'surprise', 'laugh']) F.dad.head[k] = adultHead(k, 'furhat', PAL.red, 53);
  F.v1 = { head: {}, torso: adultTorso('#c8102e', 48, false) }; for (const k of ['neutral', 'surprise', 'stern', 'smile']) F.v1.head[k] = adultHead(k, 'furhat', '#c8102e', 55);
  F.v2 = { head: {}, torso: adultTorso('#c8102e', 49, false) }; for (const k of ['neutral', 'surprise', 'stern', 'smile']) F.v2.head[k] = adultHead(k, 'cap', '#c8102e', 57);
  F.limbs = G;
  return F;
}
// draw one of the folk: who = 'gm'|'mom'|'dad'|'v1'|'v2'; same pose keys as the girl; adults are taller (legs ×1.25, torso origin shifted)
export function drawFolk(g, C, who, pose, opt = {}) {
  const Fk = buildFolk(), K = Fk[who], L = Fk.limbs, adult = who !== 'gm';
  const p = { lean: 0, head: 0, shB: .12, elB: -.1, shF: -.1, elF: -.2, hipB: .06, knB: 0, hipF: -.06, knF: 0, expr: 'neutral', handF: 'mitten', handB: 'mitten', ...pose };
  const legS = adult ? 1.3 : 1.05, PELV = -128 * legS, neck = adult ? [2, -146] : [2, -118], sh = adult ? -134 : -108;
  let root = mul(C, T(p.x || 0, (p.y || 0) - (p.bob || 0)));
  if (p.flip) root = mul(root, S(-1, 1));
  if (p.scale) root = mul(root, S(p.scale));
  root = mul(root, T(0, PELV)); root = mul(root, R(p.lean || 0));
  const M = {};
  M.torso = root;
  M.thB = mul(mul(root, T(...GJ.hipB)), mul(R(p.hipB), S(legS))); M.shB = mul(mul(M.thB, T(...GJ.knee)), R(p.knB));
  M.thF = mul(mul(root, T(...GJ.hipF)), mul(R(p.hipF), S(legS))); M.shF = mul(mul(M.thF, T(...GJ.knee)), R(p.knF));
  M.uaB = mul(mul(root, T(-10, sh)), mul(R(p.shB), S(adult ? 1.15 : 1))); M.faB = mul(mul(M.uaB, T(...GJ.elbow)), R(p.elB));
  M.uaF = mul(mul(root, T(6, sh)), mul(R(p.shF), S(adult ? 1.15 : 1))); M.faF = mul(mul(M.uaF, T(...GJ.elbow)), R(p.elF));
  M.head = mul(mul(root, T(...neck)), R(p.head));
  const o = { shadow: opt.shadow ?? 1 };
  const order = opt.order || ['uaB', 'faB', 'thB', 'shB', 'thF', 'shF', 'torso', 'head', 'uaF', 'faF'];
  for (const k of order) {
    if (k === 'uaB') put(g, L.uaB, M.uaB, o);
    else if (k === 'faB') { put(g, L.faB[p.handB], M.faB, o); if (p.propB) p.propB(g, mul(M.faB, T(0, 56))); }
    else if (k === 'thB') put(g, L.thB, M.thB, o);
    else if (k === 'shB') put(g, L.shB, M.shB, o);
    else if (k === 'thF') put(g, L.thF, M.thF, o);
    else if (k === 'shF') put(g, L.shF, M.shF, o);
    else if (k === 'torso') put(g, K.torso, M.torso, o);
    else if (k === 'head') put(g, K.head[p.expr] || K.head.neutral, M.head, o);
    else if (k === 'uaF') put(g, L.uaF, M.uaF, o);
    else if (k === 'faF') { if (p.propUnder) p.propUnder(g, mul(M.faF, T(0, 56))); put(g, L.faF[p.handF], M.faF, o); if (p.prop) p.prop(g, mul(M.faF, T(0, 56))); }
  }
  return { M, joints: { neck: ap(M.head, [0, 0]), handF: ap(M.faF, [0, 56]), handB: ap(M.faB, [0, 56]), eye: ap(M.head, [38, -84]) } };
}
