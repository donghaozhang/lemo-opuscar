// cast.js — the cast of 《蒸笼爵士》: 王师傅, the newsboy, the rat, and the living kitchen (rolling pin, cleaver, kettle, stove flame,
// steamer stack, alarm clock) + buns. Character-local coordinates: origin = the ground between the feet, y down (negative = up).
// Every character takes p = { x, y, k, sx, sy (squash/stretch), lean, mirror, ex (expression name or object), arms, legs, t, ... }.
import * as T from './toon.js';
import { P, pieEye, brow, mouth, glove, shoe, hose, steam, ribbon, union } from './parts.js';
import { clamp, lerp, TAU, hash } from '/core/lib.js';
const { shape, stroke, ell, arc, spline, quad, rr, rect, push, pop, translate, rotate, scale, dot } = T;
const D2R = Math.PI / 180;

// —— expressions: eyes / brows / mouth ——
export const EX = {
  neutral: { eyes: { type: 'open' }, brows: 'flat', mouth: 'smile' },
  sleepy: { eyes: { type: 'open', lid: .58, ly: .4 }, brows: 'flat', mouth: 'flat' },
  asleep: { eyes: { type: 'shut' }, brows: null, mouth: 'o', mopen: .5 },
  yawn: { eyes: { type: 'shut' }, brows: 'up', mouth: 'yawn' },
  happy: { eyes: { type: 'happy' }, brows: 'up', mouth: 'grin' },
  joy: { eyes: { type: 'happy' }, brows: 'up', mouth: 'beam' },
  surprised: { eyes: { type: 'wide' }, brows: 'up', mouth: 'o' },
  scared: { eyes: { type: 'wide', lx: -.4 }, brows: 'sad', mouth: 'wavy' },
  angry: { eyes: { type: 'open', lid: .3 }, brows: 'angry', mouth: 'frown' },
  hungry: { eyes: { type: 'open', ly: -.2, lx: .5 }, brows: 'sad', mouth: 'flat' },
  sad: { eyes: { type: 'open', ly: .5 }, brows: 'sad', mouth: 'frown' },
  sly: { eyes: { type: 'open', lid: .45, lx: .7 }, brows: 'angry', mouth: 'grin' },
  tender: { eyes: { type: 'open', lid: .32, ly: .1 }, brows: 'sad', mouth: 'smile' },
  determined: { eyes: { type: 'open', lid: .2 }, brows: 'angry', mouth: 'flat' },
  tempted: { eyes: { type: 'open', lx: .2, ly: .65 }, brows: 'up', mouth: 'o', mopen: .5 },
  torn: { eyes: { type: 'open', lx: -.8 }, brows: 'sad', mouth: 'flat' },
  resolve: { eyes: { type: 'open', lid: .15, lx: .5 }, brows: 'flat', mouth: 'smile' },
  teary: { eyes: { type: 'open', lid: .25 }, brows: 'sad', mouth: 'smile', tear: 1 },
  grin: { eyes: { type: 'open', lx: .3 }, brows: 'up', mouth: 'grin' },
  wink: { eyes: { type: 'open', lx: .4 }, brows: 'up', mouth: 'grin', wink: 1 },
  squeeze: { eyes: { type: 'squeeze' }, brows: 'angry', mouth: 'wavy' },
};
const exOf = e => typeof e === 'string' ? (EX[e] || EX.neutral) : (e || EX.neutral);
// a face: eyes at ±dx around (cx,cy), size s (eye half-height)
export function face(cx, cy, s, e, o = {}) {
  e = exOf(e);
  const dx = o.dx ?? s * 1.05, ey = { ...e.eyes, ...(o.eyes || {}) }, lidCol = o.lidCol || P.white;
  for (const side of [-1, 1]) {
    const exx = cx + side * dx;
    if (e.wink && side === -1) pieEye(exx, cy, s * .72, s, { type: 'happy' });
    else pieEye(exx, cy, s * .72, s, { ...ey, side, lidCol, lid: ey.lid, lidTilt: ey.lidTilt ? ey.lidTilt * side : 0 });
    if (e.brows) brow(exx, cy - s * 1.35 - (e.brows === 'up' ? s * .2 : 0), s * 1.25, e.brows, side);
  }
  if (e.tear) { const tx_ = cx - dx + s * .2, ty = cy + s * 1.2; T.shape(spline([[tx_, ty - s * .4], [tx_ + s * .35, ty + s * .4], [tx_, ty + s * .65], [tx_ - s * .35, ty + s * .4]], true, 5), { fill: P.white, lw: T.S.lw * .7 }); }
  if (o.nose !== false) o.nose ? o.nose() : T.shape(ell(cx, cy + s * 1.15, s * .32, s * .26), { fill: P.ink, lw: T.S.lw * .6 });
  if (o.mouth !== false) mouth(cx, cy + (o.my ?? s * 1.9), (o.mw ?? s * 2.1), e.mouth, { open: e.mopen ?? .6 });
}
// common: hose arms with gloves; arms = [{x,y,hand,bend,rot,flip,front}], from shoulders
function arms(list, sh, w, col, front) {
  list.forEach((A, i) => {
    if (!A || !!A.front !== front) return;
    const s = sh[i]; hose(s, [A.x, A.y], A.bend ?? (i ? -14 : 14), w, col);
    const ang = A.rot ?? Math.atan2(A.y - s[1], A.x - s[0]);
    glove(A.x, A.y, ang, A.hand || 'open', A.hk || 1, { flip: A.flip ?? i === 0 });
  });
}
function legs(list, hip, w, sk = 1, col = P.ink) {
  list.forEach((L, i) => { const s = i ? 1 : -1; L = L || { x: s * 34, y: 0 }; hose([hip[i][0], hip[i][1]], [L.x, L.y - 8 * sk], L.bend ?? s * 4, w, col); });
  list.forEach((L, i) => { const s = i ? 1 : -1; L = L || { x: s * 34, y: 0 }; shoe(L.x - (L.dir ?? s) * 6 * sk, L.y, L.dir ?? s, sk * (L.k || 1), L.ang || 0); });
}
function begin(p) { push(); translate(p.x, p.y); scale(p.k || 1); if (p.mirror) scale(-1, 1); scale(p.sx || 1, p.sy || 1); if (p.lean) rotate(p.lean); }
// pose helpers: default arm/leg targets
const LEGS = (w = 34) => [{ x: -w, y: 0 }, { x: w, y: 0 }];

// ———————————————— 王师傅 Baker Wang (≈ 400 tall) ————————————————
// p.must: moustache mood -1 droop … +1 curl up; p.cap: cap flop (-1..1); p.head: {dx,dy,rot}
export function wang(p) {
  begin(p);
  const L = p.legs || LEGS(40);
  legs(L, [[-34, -96], [34, -96]], 17);
  const sh = [[-80, -212], [80, -212]];
  arms(p.arms || [{ x: -110, y: -120, hand: 'open' }, { x: 110, y: -120, hand: 'open' }], sh, 16, P.dmid, false);
  // body: grey jacket pear + white apron
  shape(spline([[-70, -246], [-104, -170], [-96, -96], [0, -78], [96, -96], [104, -170], [70, -246], [0, -262]], true, 6), { fill: P.mid, shade: () => T.fillOnly(spline([[30, -250], [104, -170], [96, -96], [40, -84], [70, -170]], true, 5), P.dmid, { boil: 0 }) });
  shape(spline([[-52, -224], [-74, -150], [-70, -92], [0, -82], [70, -92], [74, -150], [52, -224], [0, -232]], true, 6), { fill: P.white });
  stroke([[-30, -150], [30, -150]], T.S.lw * .6); stroke([[-40, -232], [-60, -262]], T.S.lw * .7); stroke([[40, -232], [60, -262]], T.S.lw * .7);
  arms(p.arms || [], sh, 16, P.dmid, true);
  // head
  const H = p.head || {}; push(); translate(H.dx || 0, (H.dy || 0) - 300); rotate((H.rot || 0)); scale(1 + (H.s || 0), 1 - (H.s || 0));
  shape(ell(-66, 6, 14, 18), { fill: P.pale }); shape(ell(66, 6, 14, 18), { fill: P.pale });
  shape(ell(0, 0, 66, 62), { fill: P.pale, shade: () => T.fillOnly(ell(52, 26, 40, 50), P.light, { boil: 0 }) });
  face(0, -6, 17, p.ex, { dx: 25, mouth: false, nose: () => shape(ell(0, 20, 13, 10), { fill: P.light }) });
  // moustache (mood): two strands from under the nose
  const m = p.must ?? 0;
  for (const s of [-1, 1]) {
    const mm = clamp(m, -1, 1), dn = Math.max(0, -mm), upv = Math.max(0, mm);
    const c = spline([[s * 4, 30], [s * 22, 31 + dn * 5 - upv * 3], [s * 40, 33 + dn * 16 - upv * 10], [s * (50 - dn * 6), 38 + dn * 28 - upv * 26], [s * (52 - dn * 10 + upv * 4), 44 + dn * 36 - upv * 42]], false, 6);
    
    shape(ribbon(c, 11, 3), { fill: P.ink, lw: T.S.lw * .5 });
  }
  const mt = exOf(p.ex).mouth; if (mt !== 'flat' && mt !== 'smile') mouth(0, 50, 28, mt, { open: exOf(p.ex).mopen ?? .6 }); else if (mt === 'smile') stroke(quad([-12, 46], [0, 56], [12, 46]), T.S.lw * .8);
  // tall soft baker's cap (flops with p.cap)
  const cf = p.cap || 0;
  shape(rr(-58, -78, 116, 26, 8), { fill: P.white });
  shape(spline([[-56, -74], [-80, -110], [-60, -150], [-10 + cf * 20, -166], [44 + cf * 34, -150 + cf * 6], [74 + cf * 20, -116], [56, -74]], true, 6), { fill: P.white, shade: () => T.fillOnly(ell(40, -110, 40, 50), P.paper, { boil: 0 }) });
  stroke(quad([-30, -80], [-34, -120], [-12, -150]), T.S.lw * .6); stroke(quad([18, -80], [22, -118], [40 + cf * 20, -140]), T.S.lw * .6);
  pop();
  pop();
}

// ———————————————— 报童 the newsboy (≈ 300 tall) ————————————————
// p.scarf: flutter phase (0 still); p.bag: show bag; p.hole: shoe hole; p.cap tilt
export function boy(p) {
  begin(p);
  const L = p.legs || LEGS(26);
  legs(L, [[-20, -80], [20, -80]], 12, .85);
  if (p.hole !== false) { const R = L[1] || { x: 26, y: 0 }; T.dot(R.x + 8, R.y - 9, 3.4, P.pale); }
  const sh = [[-44, -160], [44, -160]];
  arms(p.arms || [{ x: -70, y: -90, hand: 'open' }, { x: 70, y: -90, hand: 'open' }], sh, 11, P.dmid, false);
  // bag (behind on the far side)
  if (p.bag !== false) { stroke([[-36, -168], [44, -84]], T.S.lw * 1.4); shape(rr(30, -110, 54, 44, 8), { fill: P.light }); for (let i = 0; i < 3; i++) stroke([[40, -100 + i * 9], [76, -100 + i * 9]], T.S.lw * .5); shape(rr(34, -128, 44, 20, 3), { fill: P.white }); }
  // body: short ragged jacket
  const hem = []; for (let i = 0; i <= 8; i++) hem.push([lerp(52, -52, i / 8), -78 + (i % 2 ? 8 : 0)]);
  shape([...spline([[-40, -176], [-60, -120]], false, 4), ...hem, ...spline([[60, -120], [40, -176]], false, 4), [0, -182]], { fill: P.dmid, shade: () => T.fillOnly(rect(16, -190, 60, 120), P.dark, { boil: 0 }) });
  shape(rr(-34, -128, 22, 20, 3), { fill: P.mid });                                   // patch
  stroke([[-30, -126], [-16, -112]], T.S.lw * .45); stroke([[-16, -126], [-30, -112]], T.S.lw * .45);
  arms(p.arms || [], sh, 11, P.dmid, true);
  // scarf: ring + fluttering tail (the mood feature)
  const sf = p.scarf ?? 0, droop = p.scarfDroop || 0;
  shape(rr(-36, -184, 72, 18, 9), { fill: P.light });
  const tail = []; for (let i = 0; i <= 6; i++) { const u = i / 6; tail.push([-30 - u * 70 * (1 - droop * .5), -178 - u * (10 - droop * 60) + Math.sin(u * 5 + sf * 9) * 12 * (1 - droop) * u]); }
  shape(ribbon(spline(tail, false, 4), 18, 12), { fill: P.light });
  for (let i = 2; i <= 5; i += 2) { const q = tail[i]; stroke([[q[0] - 3, q[1] - 8], [q[0] + 3, q[1] + 8]], T.S.lw * .5); }
  // head
  const Hd = p.head || {}; push(); translate(Hd.dx || 0, (Hd.dy || 0) - 232); rotate(Hd.rot || 0);
  shape(ell(-52, 8, 11, 14), { fill: P.pale }); shape(ell(52, 8, 11, 14), { fill: P.pale });
  shape(ell(0, 4, 52, 50), { fill: P.pale, shade: () => T.fillOnly(ell(26, 22, 48, 46), P.light, { boil: 0 }) });
  face(0, 2, 15, p.ex, { dx: 21, my: 32, mw: 26, nose: () => shape(ell(0, 18, 7, 6), { fill: P.light }) });
  T.dot(-30, 24, 2.2, P.mid); T.dot(-24, 28, 2.2, P.mid); T.dot(30, 24, 2.2, P.mid);                 // freckles
  // oversized flat cap with a patch
  const ct = p.capTilt || 0; push(); rotate(ct);
  shape(spline([[-58, -20], [-50, -52], [0, -66], [52, -54], [64, -26], [0, -24]], true, 6), { fill: P.dark });
  shape(spline([[-10, -24], [40, -28], [80, -18], [60, -10], [0, -16]], true, 5), { fill: P.dark });
  shape(rr(-34, -52, 18, 14, 3), { fill: P.dmid }); dot(0, -62, 4, P.ink);
  pop();
  pop();
  pop();
}

// ———————————————— 老鼠 the rat (≈ 200 tall) ————————————————
export function rat(p) {
  begin(p);
  // tail (mood): 'q' question mark, 'whip', 'curl', 'down'
  const tl = p.tail || 'curl', tt = p.t || 0;
  const tailPts = tl === 'q' ? [[-36, -40], [-90, -60], [-110, -130], [-76, -170], [-46, -150], [-60, -120]]
    : tl === 'whip' ? [[-36, -40], [-100, -40 + Math.sin(tt * 30) * 20], [-160, -30 + Math.sin(tt * 30 + 1) * 30], [-210, -40 + Math.sin(tt * 30 + 2) * 30]]
      : tl === 'down' ? [[-36, -40], [-80, -20], [-120, -6], [-160, -4]]
        : [[-36, -40], [-96, -50], [-120, -100], [-96, -126], [-76, -106]];
  shape(ribbon(spline(tailPts, false, 6), 9, 4), { fill: P.ink, lw: T.S.lw * .6 });
  const L = p.legs || LEGS(22);
  legs(L, [[-16, -40], [16, -40]], 10, .7);
  const sh = [[-30, -104], [34, -104]];
  arms(p.arms || [{ x: -50, y: -60, hand: 'open', hk: .7 }, { x: 56, y: -60, hand: 'open', hk: .7 }], sh, 9, P.ink, false);
  shape(spline([[-40, -110], [-50, -60], [-30, -32], [30, -32], [50, -60], [36, -112], [0, -124]], true, 6), { fill: P.mid, shade: () => T.fillOnly(ell(26, -70, 30, 46), P.dmid, { boil: 0 }) });
  shape(ell(4, -66, 26, 30), { fill: P.light });
  if (p.apron) { shape(spline([[-30, -100], [-40, -40], [40, -40], [30, -100], [0, -106]], true, 5), { fill: P.white }); stroke([[-30, -100], [-44, -118]], T.S.lw * .6); stroke([[30, -100], [44, -118]], T.S.lw * .6); }
  arms(p.arms || [], sh, 9, P.ink, true);
  // head: big ears, pointed snout to the right
  push(); translate(10, -150); rotate(p.headRot || 0);
  for (const [ex_, ey_] of [[-30, -34], [24, -40]]) shape(ell(ex_, ey_, 24, 24), { fill: P.mid, shade: () => T.fillOnly(ell(ex_ + 3, ey_ + 3, 14, 14), P.light, { boil: 0 }) });
  shape(spline([[-38, 0], [-30, -30], [6, -36], [40, -20], [84, 4], [80, 14], [40, 22], [-20, 26]], true, 6), { fill: P.mid });
  shape(ell(84, 6, 9, 8), { fill: P.ink });
  face(14, -10, 11, p.ex, { dx: 16, nose: false, my: 26, mw: 22 });
  shape(rect(30, 16, 7, 10), { fill: P.white, lw: T.S.lw * .5 }); shape(rect(38, 16, 7, 10), { fill: P.white, lw: T.S.lw * .5 });
  for (const dy of [-4, 4]) stroke([[70, 6 + dy], [110, dy * 3]], T.S.lw * .4);
  if (p.apron) { shape(rr(-26, -64, 50, 14, 5), { fill: P.white }); shape(ell(0, -76, 30, 18), { fill: P.white }); }
  pop();
  pop();
}

// ———————————————— 擀面杖 rolling pin (≈ 200 tall) ————————————————
export function pin(p) {
  begin(p);
  const L = p.legs || LEGS(30);
  legs(L, [[-26, -96], [26, -96]], 11, .8);
  const roll = p.roll || 0;
  push(); translate(0, -130); rotate(p.tilt || 0);
  for (const s of [-1, 1]) shape(rr(s > 0 ? 104 : -150, -13, 46, 26, 13), { fill: P.pale });    // handles = its hands
  shape(rr(-110, -36, 220, 72, 34), { fill: P.light, shade: () => { for (let i = 0; i < 7; i++) { const x = ((i * 34 + roll * 60) % 238) - 119; T.fillOnly(rect(x, -36, 6, 72), P.mid, { boil: 0, alpha: .5 }); } T.fillOnly(rect(-120, 12, 240, 30), P.mid, { boil: 0, alpha: .55 }); } });
  face(0, -6, 13, p.ex, { dx: 19, my: 22, mw: 24 });
  pop();
  pop();
}
// ———————————————— 菜刀 cleaver (≈ 330 tall) ————————————————
export function cleaver(p) {
  begin(p);
  const L = p.legs || LEGS(26);
  legs(L, [[-24, -110], [24, -110]], 11, .8);
  const sh = [[-60, -190], [60, -190]];
  arms(p.arms || [{ x: -96, y: -140, hand: 'open', hk: .85 }, { x: 96, y: -140, hand: 'open', hk: .85 }], sh, 11, P.ink, false);
  push(); translate(0, -110); rotate(p.tilt || 0);
  shape(rr(-12, -228, 24, 78, 12), { fill: P.dark });                                             // handle (topknot)
  stroke([[-12, -200], [12, -200]], T.S.lw * .5); stroke([[-12, -176], [12, -176]], T.S.lw * .5);
  shape(rr(-64, -156, 128, 160, 12), { fill: P.pale, shade: () => { T.fillOnly(rect(-70, -160, 140, 26), P.mid, { boil: 0 }); T.fillOnly(rect(36, -160, 40, 170), P.light, { boil: 0 }); } });
  stroke([[-58, -10], [58, -10]], T.S.lw * .5);                                                   // edge bevel
  face(0, -76, 16, p.ex, { dx: 24, my: 32, mw: 30 });
  // glint (mood): a four-point star at the upper corner
  const gl = p.glint ?? 1;
  if (gl > 0) { const s = 14 * gl; shape([[48, -136 - s], [52, -136 - 3], [48 + s, -136], [52, -133], [48, -136 + s], [45, -133], [48 - s, -136], [45, -139]], { fill: P.white, lw: T.S.lw * .5 }); }
  pop();
  arms(p.arms || [], sh, 11, P.ink, true);
  pop();
}
// ———————————————— 铜壶 copper kettle (≈ 290 tall) ————————————————
export function kettle(p) {
  begin(p);
  const L = p.legs || LEGS(36);
  legs(L, [[-30, -50], [30, -50]], 12, .85);
  const sh = [[-76, -120], [76, -120]];
  arms(p.arms || [{ x: -110, y: -70, hand: 'open', hk: .85 }, { x: 110, y: -70, hand: 'open', hk: .85 }], sh, 12, P.ink, false);
  // handle arch + spout
  const hp = spline([[-56, -168], [-50, -236], [0, -260], [50, -236], [56, -168]], false, 6);
  shape(ribbon(hp, 16, 16), { fill: P.dark });
  const sp = spline([[64, -112], [108, -128], [134, -168], [150, -186]], false, 6);
  shape(ribbon(sp, 34, 14), { fill: P.dmid });
  // body + lid
  shape(ell(0, -112, 86, 76), { fill: P.dmid, shade: () => { T.fillOnly(ell(-30, -140, 50, 34), P.mid, { boil: 0 }); T.fillOnly(ell(40, -80, 62, 52), P.dark, { boil: 0, alpha: .7 }); T.fillOnly(spline([[-62, -150], [-50, -176], [-26, -184], [-46, -160]], true, 4), P.white, { boil: 0 }); } });
  stroke(arc(0, -112, 86, 22, .2, Math.PI - .2, 16), T.S.lw * .5);
  shape(ell(0, -184, 44, 14), { fill: P.mid }); shape(ell(0, -198, 12, 10), { fill: P.dark });
  face(0, -112, 18, p.ex, { dx: 27, my: 34, mw: 34, lidCol: P.dmid, nose: () => shape(ell(0, -92, 8, 6), { fill: P.dark }) });
  arms(p.arms || [], sh, 12, P.ink, true);
  pop();
  // steam from the spout (mood)
  if (p.steam && p.steam !== 'none') { push(); translate(p.x, p.y); scale(p.k || 1); if (p.mirror) scale(-1, 1); steam(150, -192, p.steam, p.t || 0, .8); pop(); }
}
// ———————————————— 炉子 + 炉火 the stove and its flame ————————————————
// the stove is a prop (breathes); the flame on the hob is the character: tips droop asleep / flare / dance
export function stove(p) {
  begin(p);
  shape(rr(-110, -170, 220, 170, 10), { fill: P.dark, shade: () => T.fillOnly(rect(50, -170, 70, 170), P.ink, { boil: 0, alpha: .4 }) });
  shape(rr(-124, -186, 248, 22, 6), { fill: P.dmid });
  shape(ell(0, -84, 46, 46), { fill: P.dmid });
  shape(ell(0, -84, 34, 34), { fill: p.glow ? P.pale : P.dark });                                   // firebox door window
  for (let i = -2; i <= 2; i++) stroke([[i * 12, -114], [i * 12, -54]], T.S.lw * .5);
  shape(rr(-96, -14, 30, 14, 4), { fill: P.ink }); shape(rr(66, -14, 30, 14, 4), { fill: P.ink });
  pop();
}
export function flame(p) {
  begin(p);
  const dz = p.droop ?? 0, fl = p.flare ?? 0, t = p.t || 0, ph = Math.floor(t * 12) / 12;
  const tip = (x0, h, w, k) => {
    const sway = Math.sin(ph * 9 + k * 2) * 8 + fl * k * 10, hh = h * (1 + fl * .5) * (1 - dz * .45);
    return spline([[x0 - w, 0], [x0 - w * .9, -hh * .4], [x0 + sway - w * .3 - dz * 30, -hh * .85], [x0 + sway - dz * 46, -hh], [x0 + sway + w * .4 - dz * 20, -hh * .7], [x0 + w, -hh * .3], [x0 + w, 0]], true, 6);
  };
  union([tip(-42, 110, 26, -1), tip(42, 120, 26, 1), tip(0, 190, 50, 0)], P.white);
  shape(tip(0, 120, 30, 0), { fill: P.pale, stroke: false, boil: .5 });
  face(0, -62, 14, p.ex, { dx: 19, my: 26, mw: 26, nose: false });
  pop();
}
// ———————————————— 蒸笼 the steamer stack: 5 bamboo baskets + lid; concertina gap g; face on the 3rd basket ————————————————
export function steamer(p) {
  begin(p);
  const n = 5, bh = 44, rx = 92, gap = p.gap ?? 4, t = p.t || 0;
  const L = p.legs || LEGS(44);
  legs(L, [[-40, -10], [40, -10]], 13, .9);
  const yOf = i => -14 - i * (bh + gap) - (p.sway ? Math.sin(t * 8 + i) * 0 : 0);
  const sh = [[-rx + 2, yOf(2) - bh / 2], [rx - 2, yOf(2) - bh / 2]];
  arms(p.arms || [{ x: -150, y: yOf(2) + 10, hand: 'open' }, { x: 150, y: yOf(2) + 10, hand: 'open' }], sh, 13, P.ink, false);
  for (let i = 0; i < n; i++) {
    const y = yOf(i), dx = p.swayX ? p.swayX * i * i : 0;
    push(); translate(dx, 0);
    shape([...arc(0, y, rx, 18, 0, Math.PI, 12), ...arc(0, y - bh, rx, 18, Math.PI, 0, 12)], { fill: P.light, shade: () => { for (let k = -5; k <= 5; k++) T.fillOnly(rect(k * 16 - 1, y - bh - 20, 3, bh + 40), P.mid, { boil: 0, alpha: .6 }); T.fillOnly(rect(40, y - bh - 20, 60, bh + 40), P.mid, { boil: 0, alpha: .4 }); } });
    shape(ell(0, y - bh, rx, 18), { fill: P.pale });
    stroke(arc(0, y - 8, rx, 18, .1, Math.PI - .1, 12), T.S.lw * .5);
    if (i === 2) face(0, y - bh / 2 - 2, 16, p.ex, { dx: 34, my: 20, mw: 34 });
    pop();
  }
  // lid: dome with a knot (lifts like a hat with p.lid)
  const ly = yOf(n) + bh - (p.lid || 0) * 40, ldx = p.swayX ? p.swayX * 25 : 0;
  push(); translate(ldx, 0);
  shape([...arc(0, ly - bh, rx + 4, 54, Math.PI, TAU, 16), ...arc(0, ly - bh, rx + 4, 16, 0, Math.PI, 10)], { fill: P.light, shade: () => { for (let k = -4; k <= 4; k++) T.fillOnly(rect(k * 20, ly - bh - 60, 3, 60), P.mid, { boil: 0, alpha: .5 }); } });
  shape(ell(0, ly - bh - 54, 12, 9), { fill: P.dmid });
  pop();
  arms(p.arms || [], sh, 13, P.ink, true);
  pop();
  // breathing steam between the baskets
  if (p.breath) { push(); translate(p.x, p.y); scale(p.k || 1); for (let i = 1; i < n; i += 2) { const y = yOf(i) - bh / 2, a = p.breath; shape(ribbon(spline([[rx, y], [rx + 30 * a, y - 10], [rx + 60 * a, y - 30 * a], [rx + 70 * a, y - 50 * a]], false, 4), 14 * a, 4), { fill: P.white, lw: T.S.lw * .6 }); shape(ribbon(spline([[-rx, y], [-rx - 30 * a, y - 10], [-rx - 60 * a, y - 30 * a], [-rx - 70 * a, y - 50 * a]], false, 4), 14 * a, 4), { fill: P.white, lw: T.S.lw * .6 }); } pop(); }
}
// ———————————————— 闹钟 the alarm clock: body = the clock; dial on the belly shows h:m; bells droop when stopped, shake when ringing ————————————————
export function clock(p) {
  begin(p);
  const ring = p.ring || 0, t = p.t || 0, sh_ = ring ? Math.sin(t * 90) * 6 * ring : 0;
  const L = p.legs || LEGS(26);
  legs(L, [[-24, -30], [24, -30]], 10, .7);
  push(); translate(sh_, 0);
  // bells (droop when stopped)
  const droop = p.stopped ? 14 : 0;
  for (const s of [-1, 1]) { push(); translate(s * 46, -186); rotate(s * (.5 + droop * .02) + (ring ? Math.sin(t * 60 + s) * .15 : 0)); shape([...arc(0, 0, 30, 30, Math.PI, TAU, 12), [30, 4], [-30, 4]], { fill: P.mid }); dot(0, -32, 5, P.ink); pop(); }
  stroke([[0, -168], [0, -196]], T.S.lw * 1.2); dot(0, -200, 6, P.ink);
  // key on the back (right side)
  shape([[70, -120], [86, -120], [94, -136], [112, -132], [112, -108], [94, -104], [86, -112], [70, -112]], { fill: P.light });
  // case
  shape(ell(0, -110, 76, 80), { fill: P.dmid, shade: () => T.fillOnly(ell(30, -90, 60, 70), P.dark, { boil: 0, alpha: .6 }) });
  // dial (belly) with hands showing p.time = hours (float)
  const dcx = 0, dcy = -84;
  shape(ell(dcx, dcy, 44, 44), { fill: P.white });
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; stroke([[dcx + Math.sin(a) * 36, dcy - Math.cos(a) * 36], [dcx + Math.sin(a) * (i % 3 ? 40 : 30), dcy - Math.cos(a) * (i % 3 ? 40 : 30)]], T.S.lw * (i % 3 ? .4 : .7)); }
  const h = p.time ?? 4, ah = (h % 12) / 12 * TAU, am = (h % 1) * TAU;
  stroke([[dcx, dcy], [dcx + Math.sin(ah) * 22, dcy - Math.cos(ah) * 22]], T.S.lw * 1.3);
  stroke([[dcx, dcy], [dcx + Math.sin(am) * 33, dcy - Math.cos(am) * 33]], T.S.lw * .9);
  dot(dcx, dcy, 4, P.ink);
  // face above the dial
  face(0, -150, 11, p.ex, { dx: 20, mouth: false, nose: false, lidCol: P.dmid });
  pop();
  pop();
}
// ———————————————— 包子 a bun (≈ 60 wide); best: bigger with a perfect pleat swirl; face optional ————————————————
export function bun(x, y, k = 1, o = {}) {
  push(); translate(x, y); scale(k); rotate(o.rot || 0);
  const b = o.best ? 1.25 : 1;
  shape(spline([[-34 * b, 0], [-30 * b, -22 * b], [-12 * b, -36 * b], [0, -40 * b], [12 * b, -36 * b], [30 * b, -22 * b], [34 * b, 0], [0, 4]], true, 6), { fill: P.white, shade: () => T.fillOnly(ell(18 * b, -8 * b, 24 * b, 20 * b), P.paper, { boil: 0 }) });
  const nP = o.best ? 9 : 6;
  for (let i = 0; i < nP; i++) { const a = -Math.PI * .95 + i / (nP - 1) * Math.PI * .9; stroke(quad([Math.cos(a) * 26 * b, -16 * b + Math.sin(a) * 14 * b], [Math.cos(a) * 12 * b, -30 * b], [0, -38 * b]), T.S.lw * .45); }
  dot(0, -39 * b, 3.5 * b, P.ink);
  if (o.best) T.dot(-14, -16, 3, P.mid);
  pop();
}

// ———————————————— neighbours for the morning queue (Wang's rig, other heads) ————————————————
// v: 'lady' (hair bun, qipao), 'old' (felt hat, beard), 'worker' (cloth cap); ex, k, arms like wang
export function neighbour(p) {
  begin(p);
  const v = p.v || 'lady';
  const L = p.legs || LEGS(30);
  legs(L, [[-26, -90], [26, -90]], 14);
  const sh = [[-64, -200], [64, -200]];
  arms(p.arms || [{ x: -86, y: -110, hand: 'open' }, { x: 86, y: -110, hand: 'open' }], sh, 13, P.dark, false);
  const col = v === 'lady' ? P.light : v === 'old' ? P.dark : P.mid;
  if (v === 'lady') shape(spline([[-48, -236], [-76, -150], [-64, -84], [0, -76], [64, -84], [76, -150], [48, -236], [0, -246]], true, 6), { fill: col, shade: () => { for (let i = -3; i <= 3; i++) T.fillOnly(ell(i * 22, -160, 5, 5), P.mid, { boil: 0 }); } });
  else shape(spline([[-58, -236], [-90, -160], [-84, -90], [0, -78], [84, -90], [90, -160], [58, -236], [0, -248]], true, 6), { fill: col, shade: () => T.fillOnly(rect(20, -250, 80, 180), P.ink, { boil: 0, alpha: .25 }) });
  arms(p.arms || [], sh, 13, P.dark, true);
  push(); translate(0, -290);
  shape(ell(0, 0, 54, 52), { fill: P.pale, shade: () => T.fillOnly(ell(40, 20, 34, 40), P.light, { boil: 0 }) });
  face(0, -4, 14, p.ex, { dx: 20, my: 28, mw: 26, nose: () => shape(ell(0, 14, 8, 7), { fill: P.light }) });
  if (v === 'lady') { shape(spline([[-56, -6], [-50, -44], [0, -60], [50, -44], [56, -6], [40, -30], [0, -40], [-40, -30]], true, 6), { fill: P.ink }); shape(ell(0, -66, 26, 20), { fill: P.ink }); stroke([[-30, -70], [30, -62]], T.S.lw * .7); }
  if (v === 'old') { shape(rr(-60, -46, 120, 16, 6), { fill: P.dmid }); shape(rr(-38, -96, 76, 54, 14), { fill: P.dmid }); shape(spline([[-20, 34], [0, 70], [20, 34]], true, 4), { fill: P.white }); }
  if (v === 'worker') { shape(spline([[-56, -18], [-46, -50], [0, -62], [48, -50], [58, -20]], true, 6), { fill: P.mid }); shape(spline([[0, -22], [50, -26], [74, -16], [0, -14]], true, 4), { fill: P.mid }); }
  pop();
  pop();
}
// the back of the newsboy's head and shoulder (over-the-shoulder foreground): cap from behind, ears, nape, collar, scarf
export function boyBack(p) {
  begin(p);
  shape(spline([[-170, 40], [-150, -60], [-60, -110], [60, -110], [150, -60], [170, 40]], true, 6), { fill: P.dmid, shade: () => T.fillOnly(rect(40, -120, 160, 200), P.dark, { boil: 0 }) });
  shape(rr(-70, -128, 140, 30, 14), { fill: P.light }); for (let i = -2; i <= 2; i++) stroke([[i * 26 - 4, -126], [i * 26 + 4, -100]], T.S.lw * .5);
  shape(ell(-64, -196, 13, 18), { fill: P.pale }); shape(ell(64, -196, 13, 18), { fill: P.pale });
  shape(ell(0, -200, 60, 62), { fill: P.pale, shade: () => T.fillOnly(ell(30, -190, 50, 60), P.light, { boil: 0 }) });
  shape(spline([[-58, -190], [-54, -150], [-20, -138], [20, -138], [54, -150], [58, -190], [0, -200]], true, 5), { fill: P.dark });
  for (let i = -3; i <= 3; i++) stroke([[i * 14, -176], [i * 14 + 3, -150]], T.S.lw * .4, { line: P.ink });
  shape(spline([[-72, -214], [-62, -262], [0, -282], [62, -262], [76, -216], [0, -206]], true, 6), { fill: P.dark });
  dot(0, -278, 5, P.ink); shape(rr(18, -258, 22, 16, 3), { fill: P.dmid });
  pop();
}
