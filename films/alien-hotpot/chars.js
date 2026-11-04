// chars.js — our own cast: 刘姨 Auntie Liu, 祖格 Zug (tall, deadpan), 皮皮 Pip (small, nervous) + props.
// Every character: local coordinates, origin at the feet, y down; face = 1 looks screen-right (3/4), -1 mirrors.
import { clamp, lerp, hash, TAU } from '/core/lib.js';
import { INK, g, push, pop, translate, rotate, scale, shape, fillOnly, stroke, ell, arc, spline, rr, rect, noodle, quad, dot, text, S, tx, zoom, getM, setM } from './toon.js';
// hands that must be drawn in front of the pot: arm option {late: true} queues the hand + its prop, shop() draws them after the pot
export const LATE = [];
const lateOr = (A, draw) => { if (A?.late) { const m = getM(); LATE.push(() => { const k = getM(); setM(m); draw(); setM(k); }); } else draw(); };

// Palette; `tint` (0..1) pulls every colour toward the current light (cyan fuel wash, morning)
export const BASE = {
  white: '#fffdf6', mouthIn: '#4a1726', tongue: '#e8637a',
  // Liu
  lSkin: '#e9b48a', lSkinS: '#c98c63', lHair: '#3b3445', lHairS: '#2a2433', lGrey: '#a29db3', lShirt: '#4f8a8b', lShirtS: '#3b6b6c',
  apron: '#9a2f3b', apronS: '#74202b', sleeve: '#4a6fb5', sleeveS: '#36548c', glass: '#c8452e', trouser: '#3b3445',
  // Zug
  zSkin: '#7b6fae', zSkinS: '#5d528c', suit: '#e0a83a', suitS: '#b88327', tie: '#6b4a2e', boot: '#4a3a5a', zBulb: '#ffd25a',
  // Pip
  pSkin: '#a9e4c4', pSkinS: '#7fc4a2', hot: '#ff5a3c', hotS: '#d43c25', scarf: '#3d5fd0', scarfS: '#2c4499', pBall: '#ffd25a',
  // devices
  box: '#e4d3ad', boxS: '#c2ad84', scr: '#2a1f2e', scrTx: '#ffb648', glow: '#6ff4ff', glowS: '#bffaff',
  steel: '#9aa3b5', steelS: '#737b8f', pot: '#5d6170', potS: '#43465a', broth: '#d6321f', brothS: '#a8200f', oil: '#ff7a2a',
  chili: '#e2261c', pepper: '#5a2a1a', wood: '#a8683b', woodS: '#82502b', chop: '#d9b27a', tripe: '#e8dcc4', tripeS: '#c8b89c',
  plate: '#f4efe2', plateS: '#d8cfba', coin: '#d9b44a', coinS: '#a8862c',
};
export const C = { ...BASE };
// light: {col, k} — mixes every colour toward col by k (flat, whole-frame light change)
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const toHex = a => '#' + a.map(v => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
export const mix = (a, b, k) => { const A = hex(a), B = hex(b); return toHex(A.map((v, i) => lerp(v, B[i], k))); };
export const mul = (a, b, k) => { const A = hex(a), B = hex(b); return toHex(A.map((v, i) => lerp(v, v * B[i] / 255, k))); };
export function light(col = '#ffffff', k = 0, dark = 0) {
  for (const key in BASE) {
    if (key === 'white' || key === 'glow' || key === 'glowS') { C[key] = BASE[key]; continue; }
    let c = BASE[key]; if (k) c = mul(c, col, k); if (dark) c = mix(c, '#000000', dark); C[key] = c;
  }
}

// —— face parts ——
export function eye(cx, cy, rx, ry, { lid = 0, look = [0, 0], pupil = 4.5, skin = C.lSkin, closed = false, lw = 6, jitter = 0, lower = 0, happy = 0 } = {}) {
  if (closed) { stroke(arc(cx, cy + ry * .1, rx * .85, ry * .5, Math.PI * .1, Math.PI * .9, 14), lw); return; }
  if (happy > .5) { stroke(arc(cx, cy + ry * .35, rx * .8, ry * .55, Math.PI * 1.1, Math.PI * 1.9, 14), lw); return; }
  shape(ell(cx, cy, rx, ry, 36), {
    fill: C.white, lw, shade: () => {
      const px = cx + look[0] * rx * .5 + jitter, py = cy + look[1] * ry * .5;
      dot(px, py, pupil);
      if (lid > 0) {
        const yl = cy - ry + lid * 2 * ry;
        fillOnly([[cx - rx * 1.4, cy - ry * 1.5], [cx + rx * 1.4, cy - ry * 1.5], [cx + rx * 1.4, yl], [cx - rx * 1.4, yl + ry * .06]], skin, { boil: .5 });
        stroke([[cx - rx * 1.2, yl + ry * .06], [cx + rx * 1.2, yl]], lw);
      }
      if (lower > 0) { const yb = cy + ry - lower * 2 * ry; fillOnly([[cx - rx * 1.4, yb], [cx + rx * 1.4, yb], [cx + rx * 1.4, cy + ry * 1.5], [cx - rx * 1.4, cy + ry * 1.5]], skin, { boil: .5 }); stroke([[cx - rx * 1.2, yb], [cx + rx * 1.2, yb]], lw * .8); }
    }
  });
}
// brow: tilt > 0 = inner end down (cross / determined), < 0 = inner end up (worried); h raises it; side = -1 left eye, 1 right eye
export function brow(cx, cy, len, { tilt = 0, h = 0, lw = 9, side = 1, curve = .25 } = {}) {
  const y = cy - h, dx = len / 2, inner = -side;   // inner end points toward the other eye
  const a = [cx + inner * dx, y + tilt * len * .35], b = [cx - inner * dx, y - tilt * len * .35];
  stroke(quad(a, [cx, y - len * curve], b, 10), lw);
}
export function mouth(cx, cy, mw, { o = 0, w = 1, sm = 0, skew = 0, lw = 6, teeth = true, tongue = true, fill = C.mouthIn } = {}) {
  const hw = mw * w / 2, k = mw * .22, lc = [cx - hw, cy - sm * k + skew * k], rc = [cx + hw, cy - sm * k - skew * k];
  if (o < .07) { stroke(quad(lc, [cx, cy + sm * k * 1.2], rc, 12), lw); return; }
  const h = o * mw * .6;
  const up = quad(lc, [cx, cy - h * .25 + sm * k * .4], rc, 12), dn = quad(rc, [cx, cy + h + sm * k * .6], lc, 14);
  shape([...up, ...dn], {
    fill, lw, shade: () => {
      if (teeth && o > .22) fillOnly(rect(cx - hw * 1.2, cy - h, hw * 2.4, h * .3 + 6), C.white, { boil: .3 });
      if (tongue) fillOnly(ell(cx + hw * .15, cy + h * .95, hw * .6, h * .45, 20), C.tongue, { boil: .3 });
    }
  });
}
export function hand(x, y, ang, r = 20, col = C.lSkin, { fist = false, lw = 6 } = {}) {
  push(); translate(x, y); rotate(ang);
  const pts = fist ? spline([[-r * .6, -r * .8], [r * .7, -r * .9], [r * 1.1, -r * .1], [r * .8, r * .8], [-r * .5, r * .9], [-r * .9, 0]])
    : spline([[-r * .5, -r * .85], [r * .5, -r * 1.05], [r * 1.35, -r * .75], [r * 1.05, -r * .3], [r * 1.5, -r * .1], [r * 1.1, r * .3], [r * 1.35, r * .7], [r * .6, r * .95], [-r * .6, r * .8], [-r * .95, 0]]);
  shape(pts, { fill: col, lw });
  pop();
}
export const sweat = (x, y, s = 1) => shape(spline([[x, y - 16 * s], [x + 9 * s, y + 4 * s], [x, y + 12 * s], [x - 9 * s, y + 4 * s]]), { fill: '#cfeeff', lw: 5 });
// chopsticks held in a hand at (x,y): angle a, open 0..1, tip food
export function chopsticks(x, y, a, { L = 150, open = .2, food = null, col = C.chop } = {}) {
  push(); translate(x, y); rotate(a);
  for (const s of [-1, 1]) shape(noodle([-10, s * 4], [L, s * (3 + open * 14)], 0, 9, 5), { fill: col, lw: 4 });
  if (food) { push(); translate(L - 4, 0); food(); pop(); }
  pop();
}
export function tripe(s = 1, cooked = 1, shrink = 0) {   // 毛肚: a ruffled pale sheet with bumps
  const k = lerp(1, .32, shrink) * s;
  push(); scale(k);
  const P = []; for (let i = 0; i < 14; i++) { const a = i / 14 * TAU, r = (i % 2 ? 30 : 36) + Math.sin(i * 2.7) * 3; P.push([Math.cos(a) * r * 1.3, 26 + Math.sin(a) * r * .7]); }
  shape(spline(P), { fill: shrink > .5 ? '#bfa98a' : C.tripe, lw: 5, shade: () => { for (let i = 0; i < 9; i++) dot(-28 + (i % 3) * 26 + (i > 5 ? 6 : 0), 12 + Math.floor(i / 3) * 12, 3.2, C.tripeS); } });
  pop();
}

// —— 刘姨 Auntie Liu ——
// P: {x,y,s,face, lid, look, browL/R {tilt,h}, mouth{o,w,sm,skew}, blink, closed, armR/armL {h:[x,y] hand pos rel. to shoulder, bend, fist, ang}, cross, headTilt, lean, bob, sq, back}
export function liu(P) {
  const f = P.face ?? 1;
  push(); translate(P.x, P.y + (P.bob || 0)); scale((P.s ?? 1) * f, (P.s ?? 1) * (P.sq ?? 1));
  rotate(P.lean || 0);
  // legs
  for (const sx of [-1, 1]) { shape(noodle([sx * 34, -120], [sx * 38, -18], 0, 46, 40), { fill: C.trouser, lw: 7 }); shape(rr(sx * 38 - 30, -24, 66, 26, 12), { fill: '#221a2a', lw: 6 }); }
  const SH = [[-70, -300], [70, -300]];
  const arm = (side, A) => {
    const sh = side < 0 ? SH[0] : SH[1];
    const hp = A ? [sh[0] + A.h[0], sh[1] + A.h[1]] : [sh[0] + side * 22, sh[1] + 150];
    const mid = [lerp(sh[0], hp[0], .5), lerp(sh[1], hp[1], .5)];
    shape(noodle(sh, mid, (A?.bend ?? side * -8) * .5, 40, 36), { fill: C.lShirt, lw: 7 });
    shape(noodle(mid, hp, (A?.bend ?? side * -8) * .5, 40, 34), { fill: C.sleeve, lw: 7, shade: () => fillOnly(rect(-400, mid[1] + 18, 800, 400), C.sleeveS, { boil: .3 }) });
    stroke([[mid[0] - 18, mid[1] - 4], [mid[0] + 18, mid[1] + 4]], 5);
    lateOr(A, () => { if (A?.hold) A.hold(hp); hand(hp[0] + side * 4, hp[1] + 14, (A?.ang ?? side * 1.6), 20, C.lSkin, { fist: A?.fist }); });
  };
  if (P.back) {
    // back view (over-the-shoulder): torso, collar, apron strings, the back of the head with the bun
    shape(spline([[-82, -300], [82, -300], [104, -60], [-104, -60]]), { fill: C.lShirt, lw: 7, shade: () => fillOnly(rect(20, -320, 200, 300), C.lShirtS, { boil: .3 }) });
    stroke([[-90, -170], [90, -170]], 6, { line: INK }); shape(spline([[-12, -172], [12, -172], [26, -140], [0, -150], [-26, -140]]), { fill: C.apron, lw: 5 });
    arm(-1, P.armL); arm(1, P.armR);
    shape(spline([[-40, -305], [40, -305], [34, -322], [-34, -322]]), { fill: C.lShirtS, lw: 6 });   // collar
    push(); translate(0, -372); rotate(P.headTilt || 0);
    shape(ell(-70, 0, 12, 18, 16), { fill: C.lSkin, lw: 6 }); shape(ell(70, 0, 12, 18, 16), { fill: C.lSkin, lw: 6 });   // ears
    shape(spline([[-70, 10], [-74, -40], [-40, -80], [0, -88], [40, -80], [74, -40], [70, 10], [40, 46], [0, 54], [-40, 46]]), { fill: C.lHair, lw: 7, shade: () => { fillOnly(spline([[-20, -86], [10, -88], [0, 40], [-14, 40]]), C.lGrey, { boil: .4 }); fillOnly(rect(30, -100, 80, 160), C.lHairS, { boil: .3 }); } });
    bun(); pop(); pop(); return;
  }
  // torso: shirt, apron, the glasses chain
  shape(spline([[-82, -300], [82, -300], [104, -60], [-104, -60]]), { fill: C.lShirt, lw: 7, shade: () => fillOnly(rect(30, -320, 200, 300), C.lShirtS, { boil: .3 }) });
  shape(spline([[-58, -250], [58, -250], [88, -64], [-88, -64]]), { fill: C.apron, lw: 7, shade: () => { fillOnly(rect(30, -260, 200, 300), C.apronS, { boil: .3 }); } });
  stroke([[-58, -248], [-48, -302]], 5); stroke([[58, -248], [48, -302]], 5);
  shape(rr(-34, -160, 68, 40, 8), { fill: C.apronS, lw: 5 });   // pocket
  stroke(quad([-30, -300], [0, -236], [30, -300], 10), 3, { line: C.glass });   // bead chain
  push(); translate(0, -238); shape(ell(-16, 0, 14, 10, 14), { fill: '#d6e9ee', lw: 4 }); shape(ell(16, 0, 14, 10, 14), { fill: '#d6e9ee', lw: 4 }); stroke([[-3, 0], [3, 0]], 4); pop();
  if (P.cross) {
    // crossed arms: two forearms stacked across the chest
    for (const s of [-1, 1]) shape(noodle([s * 70, -300], [s * 84, -200], 0, 40, 38), { fill: C.lShirt, lw: 7 });
    shape(noodle([-86, -196], [70, -214], -6, 38, 34), { fill: C.sleeve, lw: 7 });
    shape(noodle([86, -200], [-70, -186], 6, 38, 34), { fill: C.sleeve, lw: 7, shade: () => fillOnly(rect(-200, -190, 400, 40), C.sleeveS, { boil: .3 }) });
    hand(-64, -190, 2.9, 18, C.lSkin, { fist: true }); hand(66, -216, -.2, 18, C.lSkin, { fist: true });
  } else { arm(-1, P.armL); arm(1, P.armR); }
  // head
  push(); translate(0, -372); rotate(P.headTilt || 0);
  shape(ell(-62, 6, 11, 17, 16), { fill: C.lSkin, lw: 6 });
  shape(spline([[-64, -10], [-58, -60], [-10, -78], [44, -66], [68, -20], [70, 26], [48, 62], [0, 72], [-44, 60], [-66, 30]]), { fill: C.lSkin, lw: 7, shade: () => fillOnly(spline([[-80, 10], [-50, 70], [10, 90], [-70, 90]]), C.lSkinS, { boil: .3 }) });
  // hair: a perm cap, a grey streak, the bun stuck through by a chopstick
  shape(spline([[-70, 12], [-78, -40], [-48, -82], [0, -92], [48, -84], [76, -48], [70, -30], [54, -52], [30, -68], [4, -62], [-20, -70], [-44, -52], [-60, -14]]), { fill: C.lHair, lw: 7, shade: () => { fillOnly(spline([[0, -92], [20, -90], [6, -46], [-8, -48]]), C.lGrey, { boil: .4 }); } });
  for (let i = -2; i <= 2; i++) stroke(arc(-6 + i * 24, -66 + Math.abs(i) * 7, 9, 7, Math.PI * 1.1, Math.PI * 1.9, 6), 4);
  bun();
  // face (3/4): eyes touch
  const blink = P.blink;
  const ex1 = 2, ex2 = 40, ey = -6;
  const look = P.look || [0, 0];
  for (const [ex, side] of [[ex1, -1], [ex2, 1]]) {
    eye(ex, ey, 19, 22, { lid: P.lid ?? .42, look, pupil: P.pupil ?? 4.5, skin: C.lSkin, lw: 6, closed: P.closed || blink, happy: P.happy, lower: P.lower ?? .08 });
    stroke(arc(ex, ey + 22, 14, 6, Math.PI * .2, Math.PI * .8, 8), 3.5, { line: C.lSkinS });   // eye bags
    const B = side < 0 ? (P.browL || P.brow || {}) : (P.browR || P.brow || {});
    brow(ex + side * 2, ey - 34, 30, { tilt: B.tilt ?? .05, h: B.h ?? 0, lw: 10, side });
  }
  stroke(spline([[30, 4], [38, 18], [34, 28], [24, 26]], false), 5);   // nose
  const m = P.mouth || {};
  mouth(26, 44, 34, { o: m.o || 0, w: m.w ?? 1, sm: m.sm ?? -.25, skew: m.skew || 0, lw: 6 });
  if (m.hum) stroke(quad([14, 44], [26, 40 + m.hum * 4], [38, 44], 8), 6);
  pop(); pop();
}
function bun() {
  push(); translate(-8, -104);
  shape(noodle([-70, 14], [64, -26], 0, 9, 7), { fill: C.chop, lw: 4 });   // chopstick through the bun
  shape(ell(0, 0, 40, 30, 24), { fill: C.lHair, lw: 7, shade: () => fillOnly(ell(16, 10, 30, 22, 16), C.lHairS, { boil: .3 }) });
  stroke(arc(0, 0, 22, 14, Math.PI * 1.1, Math.PI * 1.9, 8), 4);
  pop();
}

// —— 祖格 Zug ——
// P: {x,y,s,face, lid, look, brow{tilt,h}, mouth, blink, armR/armL{h,bend,fist,ang,hold}, headTilt, lean, sq, sit, antenna:[{tip}] chop (chopstick antennae 0..1), smile}
export function zug(P) {
  const f = P.face ?? 1;
  push(); translate(P.x, P.y + (P.bob || 0)); scale((P.s ?? 1) * f, (P.s ?? 1) * (P.sq ?? 1));
  rotate(P.lean || 0);
  const sit = P.sit ?? 0, hipY = lerp(-280, -150, sit);
  // legs: long noodles + boots (when seated: knees forward)
  for (const sx of [-1, 1]) {
    const hip = [sx * 18, hipY];
    if (sit > .5) { const knee = [sx * 18 + 120, hipY + 4]; shape(noodle(hip, knee, 0, 30, 28), { fill: C.suit, lw: 7 }); shape(noodle(knee, [knee[0] + 4, -20], 0, 28, 26), { fill: C.suit, lw: 7 }); shape(rr(knee[0] - 22, -30, 64, 30, 12), { fill: C.boot, lw: 6 }); }
    else { const L = P.leg ? P.leg(sx) : [0, 0]; shape(noodle(hip, [sx * 22 + L[0], -26 + L[1]], sx * -5, 30, 26), { fill: C.suit, lw: 7 }); shape(rr(sx * 22 + L[0] - 24, -32 + L[1], 62, 32, 12), { fill: C.boot, lw: 6 }); }
  }
  // torso: a narrow flight suit with a belt
  const top = hipY - 210;
  shape(spline([[-46, top], [46, top], [54, hipY + 10], [-54, hipY + 10]]), { fill: C.suit, lw: 7, shade: () => fillOnly(rect(16, top - 20, 100, 260), C.suitS, { boil: .3 }) });
  shape(rect(-56, hipY - 24, 112, 22), { fill: C.boot, lw: 6 });
  shape(rr(-12, hipY - 28, 24, 30, 4), { fill: C.coin, lw: 5 });
  stroke([[0, top + 20], [0, hipY - 30]], 4);   // zip
  if (P.belt) { push(); translate(38, hipY - 10); P.belt(); pop(); }
  // neck
  shape(noodle([0, top + 6], [6, top - 64], 0, 30, 26), { fill: C.zSkin, lw: 7 });
  // too-short tie
  shape(spline([[-12, top + 4], [12, top + 4], [16, top + 46], [0, top + 58], [-16, top + 46]]), { fill: C.tie, lw: 6 });
  shape(spline([[-26, top - 6], [26, top - 6], [14, top + 10], [-14, top + 10]]), { fill: C.suitS, lw: 6 });   // collar
  const SH = [[-48, top + 12], [48, top + 12]];
  const arm = (side, A) => {
    const sh = side < 0 ? SH[0] : SH[1];
    const hp = A ? [sh[0] + A.h[0], sh[1] + A.h[1]] : [sh[0] + side * 16, sh[1] + 200];
    shape(noodle(sh, hp, A?.bend ?? side * -14, 26, 22), { fill: C.suit, lw: 7 });
    lateOr(A, () => { if (A?.hold) A.hold(hp); hand(hp[0] + side * 4, hp[1] + 10, A?.ang ?? side * 1.6, 19, C.zSkin, { fist: A?.fist }); });
  };
  arm(-1, P.armL);
  // head: a tall egg
  push(); translate(8, top - 150); rotate(P.headTilt || 0);
  // antenna stub with bulb (or chopstick antennae)
  const at = P.antTip || [0, 0];
  stroke(quad([10, -88], [16 + at[0] * .5, -120], [20 + at[0], -142 + at[1]], 8), 6);
  shape(ell(20 + at[0], -150 + at[1], 12, 12, 14), { fill: C.zBulb, lw: 5 });
  if (P.chop) for (const s of [-1, 1]) { push(); translate(s * 26, -82); rotate(s * .35 + (P.chopWig || 0) * s); shape(noodle([0, 0], [0, -150 * P.chop], 0, 9, 6), { fill: C.chop, lw: 4 }); pop(); }
  shape(spline([[-56, 0], [-50, -60], [-14, -94], [30, -90], [60, -50], [64, 20], [52, 80], [10, 104], [-34, 92], [-58, 50]]), { fill: C.zSkin, lw: 7, shade: () => fillOnly(spline([[-70, 30], [-40, 100], [20, 120], [-80, 120]]), C.zSkinS, { boil: .3 }) });
  const look = P.look || [0, 0], ey = -14;
  for (const [ex, side] of [[-2, -1], [48, 1]]) {
    eye(ex, ey, 26, 30, { lid: P.lid ?? .56, look, pupil: P.pupil ?? 4.5, skin: C.zSkin, lw: 6, closed: P.closed || P.blink, happy: P.happy, lower: P.lower ?? .12 });
    stroke(arc(ex, ey + 30, 18, 8, Math.PI * .2, Math.PI * .8, 8), 4, { line: C.zSkinS });
    const B = P.brow || {};
    brow(ex + side * 2, ey - 44, 34, { tilt: B.tilt ?? 0, h: B.h ?? 0, lw: 8, side, curve: .12 });
  }
  const m = P.mouth || {};
  mouth(24, 60, 54, { o: m.o || 0, w: m.w ?? 1, sm: (m.sm ?? -.08) + (P.smile || 0) * .3, skew: (m.skew || 0) + (P.smile || 0) * .9, lw: 6, teeth: false });
  pop();
  arm(1, P.armR);
  pop();
}

// —— 皮皮 Pip ——
// P: {x,y,s,face, lid, look, brow, mouth, blink, jit (nervous jitter px), flush 0..1 (red from the scarf up), steam 0..1, armR/armL, headTilt, lean, sq, chop (chopstick antennae), tr (translator on chest 1 / in hand 0)}
export function pip(P) {
  const f = P.face ?? 1, t = P.t || 0;
  const jit = P.jit || 0, k12 = Math.floor(t * 12);
  const jx = jit ? (hash(k12 * 1.3) - .5) * 2 * jit : 0, jy = jit ? (hash(k12 * 2.7 + 4) - .5) * 2 * jit : 0;
  push(); translate(P.x + jx, P.y + jy + (P.bob || 0)); scale((P.s ?? 1) * f, (P.s ?? 1) * (P.sq ?? 1));
  rotate(P.lean || 0);
  const fl = clamp(P.flush || 0), skin = fl > 0 ? mix(C.pSkin, C.hot, ease(fl)) : C.pSkin, skinS = fl > 0 ? mix(C.pSkinS, C.hotS, ease(fl)) : C.pSkinS;
  // stubby legs
  for (const sx of [-1, 1]) { const L = P.leg ? P.leg(sx) : [0, 0]; shape(noodle([sx * 24, -60], [sx * 28 + L[0], -14 + L[1]], 0, 26, 24), { fill: skin, lw: 7 }); shape(ell(sx * 30 + 8 + L[0], -12 + L[1], 26, 13, 16), { fill: skinS, lw: 6 }); }
  // pear body
  shape(spline([[-50, -150], [50, -150], [70, -70], [56, -40], [0, -30], [-56, -40], [-70, -70]]), { fill: skin, lw: 7, shade: () => fillOnly(ell(40, -80, 40, 70, 16), skinS, { boil: .3 }) });
  const SH = [[-52, -128], [52, -128]];
  const arm = (side, A) => {
    const sh = side < 0 ? SH[0] : SH[1];
    const hp = A ? [sh[0] + A.h[0], sh[1] + A.h[1]] : [sh[0] + side * 26, sh[1] + 70];
    shape(noodle(sh, hp, A?.bend ?? side * -10, 22, 18), { fill: skin, lw: 7 });
    if (A?.hold) A.hold(hp);
    hand(hp[0] + side * 2, hp[1] + 6, A?.ang ?? side * 1.6, 15, skin, { fist: A?.fist });
  };
  arm(-1, P.armL);
  // translator hanging on its lanyard
  if ((P.tr ?? 1) > .5) { stroke(quad([-30, -150], [0, -100], [30, -150], 10), 4, { line: C.scarfS }); translator(0, -96, .55, { t, beep: P.beep || 0 }); }
  // head
  push(); translate(0, -232); rotate(P.headTilt || 0);
  // antennae with ball tips (steam puffs out of them)
  const wig = P.antWig ?? Math.sin(t * 7) * .05;
  for (const s of [-1, 1]) {
    const base = [s * 34, -64], tip = [s * 62 + wig * 60 * s, -150 + Math.abs(wig) * 30];
    if (P.droop) { tip[0] = s * 90; tip[1] = -60; }
    stroke(quad(base, [s * 40, -120], tip, 10), 6);
    shape(ell(tip[0], tip[1], 14, 14, 14), { fill: fl > .5 ? C.hot : C.pBall, lw: 5 });
  }
  if (P.chop) for (const s of [-1, 1]) { push(); translate(s * 18, -66); rotate(s * .22 + (P.chopWig || 0) * s); shape(noodle([0, 0], [0, -170 * P.chop], 0, 9, 6), { fill: C.chop, lw: 4 }); pop(); }
  shape(spline([[-82, 0], [-74, -50], [-30, -78], [30, -78], [76, -48], [84, 8], [62, 58], [0, 74], [-62, 58]]), { fill: skin, lw: 7, shade: () => fillOnly(spline([[-90, 20], [-50, 70], [30, 80], [-90, 80]]), skinS, { boil: .3 }) });
  // ears (little nubs, the steam vents)
  for (const s of [-1, 1]) shape(ell(s * 84, -4, 12, 16, 14), { fill: skinS, lw: 5 });
  const look = P.look || [0, 0], ey = -20;
  for (const [ex, side] of [[-30, -1], [36, 1]]) {
    eye(ex, ey, 33, 37, { lid: P.lid ?? .08, look, pupil: P.pupil ?? 4.5, skin, lw: 6, jitter: jit ? (hash(k12 * 3.1 + side) - .5) * jit * .8 : 0, closed: P.closed || P.blink, happy: P.happy, lower: P.lower ?? 0 });
    const B = P.brow || {};
    brow(ex + side * 4, ey - 54, 30, { tilt: B.tilt ?? -.35, h: B.h ?? 0, lw: 8, side });
  }
  const m = P.mouth || {};
  // the scarf covers the chin; the mouth sits just above it
  mouth(4, 26, 46, { o: m.o || 0, w: m.w ?? 1, sm: m.sm ?? -.4, skew: m.skew || 0, lw: 6, teeth: true });
  pop();
  // scarf wrapped up to the chin, with a tail
  shape(spline([[-70, -180], [0, -170], [70, -180], [74, -146], [0, -134], [-74, -146]]), { fill: C.scarf, lw: 7, shade: () => fillOnly(rect(20, -210, 100, 80), C.scarfS, { boil: .3 }) });
  const tw = Math.sin(t * 5) * 6;
  shape(spline([[30, -150], [62, -136], [80 + tw, -86], [60 + tw, -80], [40, -128]]), { fill: C.scarf, lw: 6 });
  for (let i = 0; i < 3; i++) stroke([[-40 + i * 30, -176], [-34 + i * 30, -140]], 6, { line: '#f4efe2' });
  arm(1, P.armR);
  // steam bursts (antenna tips, ears, nose)
  pop();
}
const ease = x => x * x * (3 - 2 * x);

// steam puff at (x,y) in the current space, u = 0..1 life, dir = angle
export function puff(x, y, u, dir = -Math.PI / 2, s = 1, col = '#ffffff') {
  if (u <= 0 || u >= 1) return;
  const d = 30 + u * 140 * s, r = (14 + u * 40) * s;
  const cx = x + Math.cos(dir) * d, cy = y + Math.sin(dir) * d;
  const P = []; for (let i = 0; i < 9; i++) { const a = i / 9 * TAU, rr_ = r * (1 + .25 * Math.sin(i * 2.3)); P.push([cx + Math.cos(a) * rr_, cy + Math.sin(a) * rr_]); }
  shape(spline(P), { fill: col, lw: 5, alpha: 1 - u * u });
}

// —— 翻译器 the translator ——
export function translator(x, y, s = 1, { t = 0, beep = 0, screen = null, a = 0 } = {}) {
  push(); translate(x, y); rotate(a); scale(s);
  stroke([[40, -60], [54, -118]], 6); dot(54, -124, 9, beep > 0 ? '#ff4a3a' : '#9a3a3a');
  shape(rr(-70, -64, 140, 128, 18), { fill: C.box, lw: 7, shade: () => fillOnly(rect(36, -70, 50, 140), C.boxS, { boil: .3 }) });
  shape(rr(-54, -48, 108, 60, 8), { fill: C.scr, lw: 6 });
  if (screen) screen(); else { for (let i = 0; i < 3; i++) dot(-30 + i * 30, -18, beep > 0 && Math.floor(t * 12) % 3 === i ? 7 : 4, C.scrTx); }
  for (let i = 0; i < 3; i++) shape(ell(-36 + i * 36, 38, 12, 9, 14), { fill: ['#e85a4a', '#f3c84a', '#7a9be0'][i], lw: 5 });
  pop();
}

// —— 能源舱 the power cell —— glow 0..1, level 0..1
export function cell(x, y, s = 1, { glow = 0, level = 0, t = 0, a = 0 } = {}) {
  push(); translate(x, y); rotate(a); scale(s);
  if (glow > .02) {   // flat translucent rings, not gradients
    shape(ell(0, -10, 120 + glow * 60, 140 + glow * 60, 30), { fill: C.glow, alpha: .14 * glow, stroke: false });
    shape(ell(0, -10, 85 + glow * 30, 105 + glow * 30, 30), { fill: C.glow, alpha: .22 * glow, stroke: false });
  }
  shape(rr(-46, -96, 92, 176, 16), { fill: glow > .05 ? mix('#2c3c4a', C.glow, .35 + glow * .5) : '#2c3c4a', lw: 7, shade: () => {
    const ly = 72 - level * 160; fillOnly(rect(-50, ly, 100, 200), glow > .05 ? C.glowS : '#3e5060', { boil: .3 });
    if (level > .02) { for (let i = 0; i < 3; i++) dot(-20 + i * 20, ly + 20 + ((t * 40 + i * 30) % 50), 5, '#ffffff'); }
    fillOnly(rect(16, -100, 18, 190), 'rgba(255,255,255,.35)', { boil: .2 });
  } });
  shape(rr(-56, -116, 112, 26, 8), { fill: C.steel, lw: 6 });   // cap
  shape(spline([[-24, -116], [24, -116], [14, -140], [-14, -140]]), { fill: C.steelS, lw: 5 });   // funnel
  shape(rr(-56, 72, 112, 24, 8), { fill: C.steel, lw: 6 });
  pop();
}

// —— 九宫格 the nine-grid pot (seen from 3/4 above) ——
export function pot(x, y, s = 1, { t = 0, boil = 1, steam = 1, heat = 1, pick = null, sides = false } = {}) {
  push(); translate(x, y); scale(s);
  // burner + flames
  shape(rr(-150, 40, 300, 50, 10), { fill: '#3a3a48', lw: 7 });
  for (let i = 0; i < 7; i++) { const fx = -105 + i * 35, h = 18 + 8 * Math.sin(t * 18 + i * 1.7); if (heat > 0) shape(spline([[fx - 9, 40], [fx, 40 - h * heat], [fx + 9, 40]]), { fill: '#5aa0ff', lw: 4 }); }
  // pot body
  shape(spline([[-200, -20], [200, -20], [190, 40], [150, 64], [-150, 64], [-190, 40]]), { fill: C.pot, lw: 7, shade: () => fillOnly(rect(60, -40, 200, 120), C.potS, { boil: .3 }) });
  for (const sx of [-1, 1]) shape(rr(sx * 214 - 18, -26, 36, 22, 8), { fill: C.potS, lw: 6 });   // handles
  // rim + broth
  shape(ell(0, -22, 204, 66, 48), { fill: C.steel, lw: 7 });
  shape(ell(0, -22, 184, 54, 48), { fill: C.broth, lw: 6, shade: () => {
    fillOnly(ell(-40, -40, 150, 28, 30), C.oil, { boil: .4, alpha: .5 });
    // floating chillies + peppercorns (they read as hot pot, not soup)
    for (let i = 0; i < 16; i++) { const a = i * 2.39, r = 40 + (i * 37) % 140, cx = Math.cos(a) * r * .95, cy = -22 + Math.sin(a) * r * .28 + Math.sin(t * 3 + i) * 2; if (i % 3) shape(spline([[cx - 16, cy], [cx, cy - 6], [cx + 18, cy - 2], [cx + 4, cy + 5]]), { fill: C.chili, lw: 3.5 }); else dot(cx, cy, 5, C.pepper); }
    // bubbles (12 fps, deterministic)
    const k = Math.floor(t * 12);
    for (let i = 0; i < 18 * boil; i++) { const h1 = hash(i * 7.7 + Math.floor((k + i * 3) / 4) * 1.3), h2 = hash(i * 3.1 + Math.floor((k + i * 3) / 4) * .7); const bx = (h1 - .5) * 330, by = -22 + (h2 - .5) * 90, ph = ((k + i * 3) % 4) / 4; shape(ell(bx, by, 6 + ph * 12, 4 + ph * 7, 12), { fill: C.brothS, lw: 3.5 }); }
  } });
  // the nine-grid: two lines each way, in perspective
  for (const gx of [-60, 60]) stroke([[gx * 1.05, -22 - 50], [gx * 1.05, -22 + 50]], 6, { line: C.steelS });
  for (const gy of [-16, 16]) stroke([[-176, -22 + gy], [176, -22 + gy]], 6, { line: C.steelS });
  if (pick) pick();
  // steam: white wisps, on ones
  for (let i = 0; i < 4 * steam; i++) { if (sides && (i === 1 || i === 2)) continue; const ph = (t * .45 + i * .27) % 1, x0 = -120 + i * 80, y0 = -60 - ph * 260; stroke(spline([[x0, y0], [x0 + 18, y0 - 30], [x0 - 10, y0 - 62], [x0 + 14, y0 - 94]], false), 6, { line: `rgba(255,255,255,${.7 * (1 - ph) * steam})` }); }
  pop();
}

// —— the saucer: a dented dish with a pot-lid dome —— glow = engine, tilt, damage 0..1, hatch 0..1
export function saucer(x, y, s = 1, { glow = .5, tilt = 0, t = 0, dent = 1, hatch = 0, smoke = 0, sq = 1 } = {}) {
  push(); translate(x, y); rotate(tilt); scale(s, s * sq);
  if (glow > .02) { shape(ell(0, 50, 220 + glow * 40, 40 + glow * 20, 30), { fill: C.glow, alpha: .18 * glow, stroke: false }); shape(spline([[-60, 40], [60, 40], [30, 40 + 90 * glow], [-30, 40 + 90 * glow]]), { fill: C.glow, alpha: .25 * glow, stroke: false }); }
  // dish
  shape(spline([[-240, 0], [-150, -36], [150, -36], [240, 0], [150, 40], [-150, 40]]), { fill: '#b9bfcc', lw: 7, shade: () => { fillOnly(rect(-300, 10, 600, 60), '#8d93a3', { boil: .3 }); if (dent) fillOnly(ell(120, -6, 34, 14, 14), '#8d93a3', { boil: .4 }); } });
  for (let i = 0; i < 7; i++) { const lx = -150 + i * 50; shape(ell(lx, 18, 12, 7, 12), { fill: glow > .1 ? C.glow : '#566070', lw: 4 }); }
  // pot-lid dome + knob (the hatch lifts it)
  push(); translate(-120 * hatch, -40 - 60 * hatch); rotate(-.6 * hatch);
  shape(spline([[-120, 0], [-100, -60], [-40, -96], [40, -96], [100, -60], [120, 0]]), { fill: '#d5dae3', lw: 7, shade: () => fillOnly(rect(30, -110, 120, 120), '#a7adbb', { boil: .3 }) });
  shape(rr(-26, -120, 52, 28, 10), { fill: '#3a3a48', lw: 6 });
  pop();
  // legs
  for (const sx of [-1, 1]) stroke([[sx * 120, 34], [sx * 160, 84]], 7);
  pop();
  if (smoke > 0) for (let i = 0; i < 5; i++) { const ph = (t * .5 + i * .2) % 1; puff(x + 60 - i * 10, y - 40, ph, -Math.PI / 2 - .3 + i * .15, 1.4 * s, mix('#3b3550', '#8d89a3', ph)); }
}

// the alien coin: a glowing hexagon
export function hexCoin(x, y, s = 1, { glow = 1, a = 0 } = {}) {
  push(); translate(x, y); rotate(a); scale(s);
  if (glow > 0) { shape(ell(0, 0, 110, 110, 30), { fill: C.glow, alpha: .16 * glow, stroke: false }); shape(ell(0, 0, 76, 76, 30), { fill: C.glow, alpha: .26 * glow, stroke: false }); }
  const P = []; for (let i = 0; i < 6; i++) { const b = i / 6 * TAU + Math.PI / 6; P.push([Math.cos(b) * 50, Math.sin(b) * 50]); }
  shape(P, { fill: C.glow, lw: 6, shade: () => fillOnly(ell(14, 12, 40, 40, 16), C.glowS, { boil: .3 }) });
  const Q = []; for (let i = 0; i < 6; i++) { const b = i / 6 * TAU + Math.PI / 6; Q.push([Math.cos(b) * 26, Math.sin(b) * 26]); }
  shape(Q, { fill: C.glowS, lw: 5 });
  dot(0, 0, 6, INK);
  pop();
}
// an old coin (top-down)
export function coin(x, y, s = 1, { a = 0, edge = 0 } = {}) {
  push(); translate(x, y); rotate(a); scale(s, s * (1 - edge * .8));
  shape(ell(0, 0, 44, 44, 30), { fill: C.coin, lw: 6, shade: () => fillOnly(ell(14, 12, 40, 40, 20), C.coinS, { boil: .3 }) });
  shape(ell(0, 0, 30, 30, 24), { lw: 4, line: C.coinS });
  text('1', 0, 2, { font: '40px "ZCOOL KuaiLe"', fill: C.coinS });
  pop();
}
