// Part C: 67–100.1 s. Folding together (the paw squashes a dumpling) → laughing with grandma → the horns appear → 11:30 → empty chairs → the bus stuck → the parents → the roof view again → the decision
import * as X from './common.js';
const { PAL, canvas, fillPaper, paperShadow, noShadow, piece, fill, cut, trace, Pl, P, ellipsePoly, curve, put, mul, T, S, R, ap, beginLight, pool, lightRect, applyLight, bloom, E,
  drawGirl, drawScissors, walkPose, drawNian, NPOSE, NJ, runPose, drawFolk, kit, HOUSES, HERO, GATE, GROUND, NIGHT, lanternPiece, kitchenKit, drawClockHands, KPAL, foldedSheet, CR, W, H, cam, st, E_, pt, mixPose, shake, pop, drawVillage, drawMountain, roadAt, wallBg, burst, flash, spray, mountainKit,
  TT, tb, clamp, lerp, seg, ss, eio, eo, ei, back, hash, track, spring, cutTaper } = X;
import { roofView } from './partA.js';
export const EV = [];
export const SHOTS = {};
const ev = (t, type, extra = {}) => EV.push({ t, type, ...extra });

function tableBg2(g, C) {
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); fillPaper(g, 'indigo', 0, 0, W, H, C, 'rgba(40,16,14,.55)'); g.restore();
  const K = kitchenKit();
  put(g, K.board, mul(C, T(960, 560)), { shadow: 1.2 });
  put(g, K.flour, mul(C, mul(T(880, 600), S(1.1, 1))), { shadow: .4 });
  put(g, K.bowlTop, mul(C, T(1450, 300)), { shadow: 1.4 });
  put(g, K.pin, mul(C, mul(T(560, 260), R(-.3))), { shadow: 1.2 });
  for (let k = 0; k < 6; k++) put(g, K.dumpRow[k], mul(C, mul(T(430 + k * 118, 880 - (k % 2) * 8), R(-.2 + .15 * (k % 3)))), { shadow: 1.1 });
}
// ---------- 小雪 folds a dumpling in the three moves again (her hands only) ----------
export function shotFoldTD2(g, t) {
  const K = kitchenKit(), C = cam(960, 600, 1.55);
  beginLight('rgb(232,220,206)');
  tableBg2(g, C);
  const stg = t < TT.foldA ? 0 : t < TT.foldB ? 1 : 2, s = pop(t, [TT.foldA, TT.foldB, TT.foldC][stg] ?? -1, 1.12) || 1;
  const done = t >= TT.foldC, slide = eo(seg(st(t), TT.foldC, TT.foldC + .5));
  put(g, K.dump[stg], mul(C, mul(T(960 - 200 * slide, 560 + 60 * slide), S(2.3 * s))), { shadow: 1.3 });
  if (done && slide > .9) put(g, K.dump[0], mul(C, mul(T(960, 560), S(2.3 * (pop(t, TT.foldC + .55, 1.1) || 1)))), { shadow: 1.3 });
  const ts = st(t), tr = k => track(k)(ts);
  const xL = [[66.7, [800, 980, -.2]], [TT.foldA - .2, [870, 800, -.1]], [TT.foldA, [890, 720, 0]], [TT.foldA + .4, [860, 780, -.1]], [TT.foldB, [900, 740, 0]], [TT.foldB + .4, [880, 790, -.1]], [TT.foldC, [920, 760, .1]], [TT.foldC + .4, [780, 900, -.3]], [70.3, [800, 980, -.2]]];
  const xR = [[66.7, [1120, 980, .2]], [TT.foldA - .2, [1050, 800, .1]], [TT.foldA, [1030, 720, 0]], [TT.foldA + .4, [1060, 780, .1]], [TT.foldB, [1020, 740, 0]], [TT.foldB + .4, [1040, 790, .1]], [TT.foldC, [1000, 760, -.1]], [TT.foldC + .4, [1140, 900, .3]], [70.3, [1120, 980, .2]]];
  const [xl, xr] = [tr(xL), tr(xR)], pinch = t > TT.foldB - .1 && t < TT.foldC + .2;
  put(g, K.handGirl[pinch ? 'pinch' : 'open'], mul(C, mul(T(xl[0], xl[1]), mul(R(xl[2]), S(1.4)))), { shadow: 1.6 });
  put(g, K.handGirl[pinch ? 'pinch' : 'open'], mul(C, mul(T(xr[0], xr[1]), mul(R(xr[2]), S(-1.4, 1.4)))), { shadow: 1.6 });
  // the Nian's paw waits at the top edge, drumming its claws
  put(g, K.paw, mul(C, mul(T(1240, 180 + 6 * Math.sin(ts * 9)), mul(R(Math.PI + .3), S(1.3)))), { shadow: 2 });
  pool(1000, 300, 1500, 'rgba(255,210,150,1)', .5);
  applyLight(g);
}
[TT.foldA, TT.foldB, TT.foldC].forEach(s => ev(s, 'pat')); ev(TT.foldC + .3, 'slide'); ev(66.7, 'roomtone', { dur: 12.6 });

// ---------- the paw tries: picks a wrapper, comes down, squash, flour poof; the second try leaves a dumpling the size of a pillow with claw marks ----------
export function shotPawTD(g, t) {
  const K = kitchenKit(), dy = shake(t, [TT.squash], 9, 45), C = cam(960, 600 + dy / 1.55, 1.55);
  beginLight('rgb(232,220,206)');
  tableBg2(g, C);
  // the wrapper → squashed → (paw lifts) → giant; the paw: keyframed position + a rotation, 12 fps
  const stg = t < TT.squash ? 0 : t < TT.giant - .4 ? 3 : 4;
  const sPop = stg === 3 ? (pop(t, TT.squash, .7) || 1) : stg === 4 ? (pop(t, TT.giant - .4, 1.12) || 1) : 1;
  put(g, K.dump[stg], mul(C, mul(T(960, 580), S((stg === 4 ? 1.1 : 2.3) * sPop))), { shadow: 1.3 });
  if (t >= TT.poof) burst(g, C, t, TT.poof, 960, 560, 16, '#f7f1e2', 260, 12, 31);
  const ts = st(t), tr = k => track(k)(ts);
  const paw = tr([[70.2, [1240, 180, .3]], [TT.pawTry, [1050, 320, .15]], [TT.pawTry + .5, [980, 420, 0]], [TT.squash - .25, [960, 300, 0]], [TT.squash, [960, 560, 0]], [TT.squash + .5, [960, 540, 0]], [TT.squash + 1.2, [980, 380, .1]], [TT.giant - .6, [960, 440, 0]], [TT.giant - .4, [960, 560, 0]], [TT.giant, [960, 520, 0]], [TT.giant + .6, [990, 300, .2]], [76, [1100, 260, .3]]]);
  const flat = t > TT.squash - .05 && t < TT.squash + 1.0;
  put(g, K.paw, mul(C, mul(T(paw[0], paw[1]), mul(R(Math.PI + paw[2]), S(1.3 * (flat ? 1.18 : 1), 1.3 * (flat ? .9 : 1))))), { shadow: flat ? 1.2 : 2.6 });
  // 小雪's hands at the bottom edge, one pointing at the squashed dumpling after the poof
  const pointU = E_(ts, TT.poof + .3, TT.poof + .7);
  put(g, K.handGirl.open, mul(C, mul(T(800 + 60 * pointU, 1000 - 160 * pointU), mul(R(-.2 - .4 * pointU), S(1.4)))), { shadow: 1.6 });
  put(g, K.handGirl.open, mul(C, mul(T(1140, 1000), mul(R(.2), S(-1.4, 1.4)))), { shadow: 1.6 });
  pool(1000, 300, 1500, 'rgba(255,210,150,1)', .5);
  applyLight(g);
}
ev(TT.pawTry, 'pawtap'); ev(TT.squash, 'squash'); ev(TT.poof, 'poof'); ev(TT.giant - .4, 'thud', { gain: .6 }); ev(TT.giant, 'pawtap');

// ---------- laughing: the kitchen side view; the Nian sits on the floor at the table, 小雪 on a stool; grandma appears in the doorway ----------
const KR = {};
function kitchenRoom() { if (KR.door) return KR; KR.door = piece([-140, -520, 140, 10], g => { fill(g, q => trace(q, Pl([[-130, -510], [130, -510], [130, 0], [-130, 0]], true, .5, 501)), '#2a3568'); cut(g, q => q.rect(-104, -484, 208, 484)); for (let k = 0; k < 3; k++) cut(g, q => q.rect(-120 + k * 90, -500, 60, 8)); }, { seed: 501, col: '#2a3568', ss: 1.5 }); KR.lamp = lanternPiece({ seed: 503 }); return KR; }
export function shotLaughGrandma(g, t) {
  const K = kitchenKit(), kr = kitchenRoom(), C = cam(1000, 640, 1.0);
  beginLight('rgb(205,196,214)');
  wallBg(g, C, 'rgba(6,8,22,.3)');
  put(g, kr.door, mul(C, T(1640, 1000)), { shadow: 1 });
  put(g, kr.lamp, mul(C, mul(T(900, 60), S(2.2))), { shadow: 1 }); put(E, kr.lamp, mul(C, mul(T(900, 60), S(2.2))), { shadow: 0, alpha: .5 });
  pool(...pt(C, [900, 160]), 1000, 'rgba(255,200,140,1)', .8);
  const ts = st(t), laughing = t >= TT.laugh2;
  // the Nian on the floor at the left, laughing: head bobs, jaw open, happy eyes
  const nb = laughing ? Math.sin((t - TT.laugh2) * 14) : 0;
  drawNian(g, mul(C, mul(T(420, 1000), mul(S(.66), T(0, -NJ.ground)))), { ...NPOSE.sit, lean: .15 + .04 * nb, head: -.1 + .06 * nb, jaw: laughing ? .35 + .25 * Math.max(0, nb) : .1, eye: laughing ? 'happy' : 'curious', tail: .6 + .2 * nb, shF: -.4, elF: .4, shB: .3, elB: -.2 }, { shadow: 1.4 });
  put(g, K.tableSide, mul(C, mul(T(1050, 780), S(.9))), { shadow: 1.4 });
  put(g, K.dump[4], mul(C, mul(T(760, 740), S(.55))), { shadow: 1 });
  for (let k = 0; k < 3; k++) put(g, K.dumpRow[k], mul(C, mul(T(980 + k * 90, 752), S(.5))), { shadow: .8 });
  put(g, K.stool, mul(C, T(1200, 850)), { shadow: .9 });
  const hop = laughing ? Math.abs(Math.sin((t - TT.laugh2) * 9)) * 10 : 0;
  drawGirl(g, mul(C, T(1200, 1000 - hop)), { expr: laughing ? 'laugh' : 'smile', flip: true, hipF: -1.45, knF: 1.5, hipB: -1.35, knB: 1.45, shF: laughing ? -.3 : -.9, elF: laughing ? -1.8 : -1.2, shB: -.3, elB: -1.5, head: laughing ? -.2 + .05 * Math.sin(ts * 12) : .05, y: -110 }, { shadow: 1.1 });
  // grandma in the doorway from grandmaDoor: hand over her mouth, then laughing too
  if (t >= TT.grandmaDoor - .3) { const u = E_(ts, TT.grandmaDoor - .3, TT.grandmaDoor + .2), lg = t > TT.grandmaDoor + 1.0; drawFolk(g, mul(C, T(1640 + 60 * (1 - u), 1000)), 'gm', { expr: lg ? 'laugh' : 'surprise', flip: true, shF: lg ? -.6 : -2.0, elF: lg ? -1.2 : -1.9, shB: -.4, elB: -1.0, handF: 'mitten', head: lg ? -.1 : .05, lean: -.03 }, { shadow: 1 }); }
  applyLight(g); bloom(g, .3);
}
ev(TT.laugh2, 'giggle'); ev(TT.laugh2 + .3, 'purr'); ev(TT.laugh2 + .9, 'giggle'); ev(TT.grandmaDoor, 'creak'); ev(TT.grandmaDoor + 1.0, 'chuckle');

// ---------- the insert: the paper-cut now shows the horns and the eye; three more snips ----------
const SN3 = [TT.horns + .3, TT.horns + .9, TT.horns + 1.5, TT.horns + 2.1];
export function shotHornsIns(g, t) {
  const z = 1.5, C = cam(190, -40, z);
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); fillPaper(g, 'rice', 0, 0, W, H, [z * 1.4, 0, 0, z * 1.4, C[4], C[5]], 'rgba(120,80,60,.14)'); g.restore();
  g.save(); g.setTransform(...C); for (let i = 2; i >= 1; i--) { g.fillStyle = i % 2 ? '#9c1418' : '#b51a1c'; g.fillRect(i * 1.2, -CR - 50 + i * 1.5, CR + 50, 2 * CR + 100); } g.restore();
  put(g, foldedSheet(2, 1.6), C, { shadow: 1.4 });
  // the scissors work along the head ring (the stage-3 cuts) at the lower right; the cuts themselves arrive with stage 3 at the unfold
  const u = seg(t, TT.horns, TT.horns + 2.6), a = Math.PI * .1 + u * Math.PI * .5, tip = [Math.cos(a) * 214, 10 + Math.sin(a) * 200], ang = a + Math.PI / 2;
  g.save(); g.setTransform(...C); g.strokeStyle = '#efe4c8'; g.lineWidth = 3; g.beginPath(); for (let i = 0; i <= 40; i++) { const aa = Math.PI * .1 + u * Math.PI * .5 * i / 40; g[i ? 'lineTo' : 'moveTo'](Math.cos(aa) * 214, 10 + Math.sin(aa) * 200); } g.stroke(); g.restore();
  let open = .5; for (const s of SN3) { if (t > s - .12 && t < s) open = lerp(.5, .03, (t - s + .12) / .12); else if (t >= s && t < s + .3) open = lerp(.03, .5, (t - s) / .3); }
  drawScissors(g, mul(C, mul(T(tip[0] - Math.cos(ang) * 120, tip[1] - Math.sin(ang) * 120), S(4.6))), ang, open, { shadow: 3 });
  SN3.forEach((s, k) => burst(g, C, t, s + .05, tip[0], tip[1] + 30, 2, PAL.red, 50, 6, 41 + k));
  const K = kitchenKit(); put(g, K.handGirl.open, mul(C, mul(T(90, -330), mul(R(Math.PI * .85), S(1.4)))), { shadow: 2 });
}
SN3.forEach(s => ev(s, 'snip'));

// ---------- the clock inserts ----------
export function clockShot(g, t, hh, mm, t0, gold = false, pushIn = true) {
  const K = kitchenKit(), z = pushIn ? 1.5 + .25 * seg(t, t0, t0 + 2.2) : 1.7, C = cam(960, 500, z);
  beginLight(gold ? 'rgb(230,214,200)' : 'rgb(196,188,210)');
  wallBg(g, C, 'rgba(6,8,22,.3)');
  // a nail and a hanging cord
  g.save(); g.setTransform(...C); g.strokeStyle = '#8a0c20'; g.lineWidth = 4; g.beginPath(); g.moveTo(960, 300); g.lineTo(960, 380); g.stroke(); g.restore();
  const M = mul(C, T(960, 500));
  put(g, K.clock, M, { shadow: 1.4 });
  // the second hand ticks on 12 fps steps... a paper clock: the minute hand jumps once a second
  const sec = Math.floor(t - t0), m2 = mm + Math.floor((t - t0) / 1.0) * (gold ? 0 : 1 / 60);
  drawClockHands(g, M, hh, mm, gold);
  if (gold) { const c = pt(M, [0, 0]); flash(c[0], c[1], 400 * z, .7 * Math.max(0, 1 - (t - t0) / .8), '255,220,150'); pool(c[0], c[1], 700 * z, 'rgba(255,214,150,1)', .8); }
  pool(960, 200, 900, 'rgba(255,200,140,1)', .55);
  applyLight(g); bloom(g, gold ? .9 : .3);
}
export const shotClock1 = (g, t) => clockShot(g, t, 11, 30, TT.clock1130);
for (let k = 0; k < 4; k++) ev(TT.clock1130 + k * .577, 'tick');

// ---------- grandma at the table looks at the two empty stools ----------
export function shotEmptyChairs(g, t) {
  const K = kitchenKit(), kr = kitchenRoom(), C = cam(1060, 700, 1.1);
  beginLight('rgb(196,188,210)');
  wallBg(g, C, 'rgba(6,8,22,.3)');
  g.save(); g.setTransform(...C); g.fillStyle = '#242c5c'; g.beginPath(); g.arc(1560, 300, 230, 0, 7); g.fill(); g.restore();
  put(g, K.lattice, mul(C, mul(T(1560, 300), S(.78))), { shadow: .5 }); put(g, K.winRim, mul(C, mul(T(1560, 300), S(.78))), { shadow: 1 });
  put(g, kr.lamp, mul(C, mul(T(1000, 60), S(2.2))), { shadow: 1 }); put(E, kr.lamp, mul(C, mul(T(1000, 60), S(2.2))), { shadow: 0, alpha: .5 });
  pool(...pt(C, [1000, 160]), 900 * 1.1, 'rgba(255,200,140,1)', .7);
  for (const x of [700, 960, 1220, 1480]) put(g, K.stool, mul(C, T(x, 860)), { shadow: .9 });
  const ts = st(t), look = E_(ts, TT.emptyChairs + .6, TT.emptyChairs + 1.1);
  drawFolk(g, mul(C, T(760, 1000)), 'gm', { expr: look > .5 ? 'worried' : 'neutral', head: -.1 + .25 * look, lean: .02, shF: -.6, elF: -1.0, shB: -.5, elB: -.9, handF: 'mitten', handB: 'mitten', hipF: -1.4, knF: 1.5, hipB: -1.3, knB: 1.4, y: -110 }, { shadow: 1 });
  put(g, K.tableSide, mul(C, T(1080, 790)), { shadow: 1.4 });
  for (let k = 0; k < 4; k++) put(g, K.bowlSide, mul(C, T(700 + k * 260, 758)), { shadow: 1 });
  for (let k = 0; k < 3; k++) put(g, K.dumpRow[k], mul(C, mul(T(1000 + k * 90, 752), S(.5))), { shadow: .8 });
  applyLight(g); bloom(g, .3);
}
ev(TT.emptyChairs, 'roomtone', { dur: 3.2 }); ev(TT.emptyChairs + .8, 'cloth');

// ---------- the bus stuck in a drift on the mountain road: wheels spin, snow sprays, the headlights blink ----------
const BUS_U = .62;
export function busOnRoad(gg, C, t, o = {}) {
  const Mk = mountainKit(), r = roadAt(o.u ?? BUS_U);
  const tilt = o.tilt ?? -.22, bm = mul(C, mul(T(r.x + (o.dx || 0), r.y - 10 + (o.dy || 0)), mul(R(r.ang + tilt), S(o.s ?? .8))));
  put(gg, Mk.bus, bm, { shadow: 1.2 });
  const spin = o.spin ? t * 30 : (o.roll ?? 0);
  for (const [ax, ay] of Mk.bus.axles) put(gg, Mk.bus.wheel, mul(mul(bm, T(ax, ay)), R(spin)), { shadow: .8 });
  if (o.spin) spray(gg, C, t, Math.floor(t * 2) / 2, r.x - 120, r.y + 40, 8, 160, 9, 51);
  const lamp = pt(bm, Mk.bus.lamp), on = o.blink ? (Math.floor(t * 2) % 2 === 0) : true;
  if (on) { flash(lamp[0], lamp[1], 90 * C[0] / .8, 1); const beam = pt(bm, [420, -40]); pool(beam[0], beam[1], 420 * C[0], 'rgba(255,230,170,1)', .9); for (const w of Mk.bus.wins) { const c = pt(bm, w); flash(c[0], c[1], 26 * C[0] / .8, .6, '255,200,120'); } }
  return bm;
}
export function shotBusStuck(g, t) {
  const r = roadAt(BUS_U), C = cam(r.x + 60, r.y - 120, .95);
  drawMountain(g, C, t, { amb: 'rgb(140,140,190)', bloom: .5, snowOpt: { speed: 1.6 }, onRoad: gg => {
    const V = kit(); put(gg, V.drifts[0], mul(C, mul(T(r.x + 250, r.y + 60), S(1.3, 1.2))), { shadow: .7 });
    busOnRoad(gg, C, t, { spin: t > TT.wheels, blink: true });
  } });
}
ev(TT.busStuck, 'windbed', { dur: 5, gain: 1.6 }); ev(TT.busStuck, 'engineidle', { dur: 4.7 }); ev(TT.wheels, 'wheelspin', { dur: 3.2 }); ev(TT.wheels + .4, 'snowspray'); ev(TT.wheels + 1.6, 'snowspray'); ev(TT.busStuck + 2.0, 'horn');

// ---------- inside the bus: 妈妈 and 爸爸 at the window ----------
export function shotParentsCU(g, t) {
  const C = cam(960, 540, 1.0);
  beginLight('rgb(190,186,210)');
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); fillPaper(g, 'indigo', 0, 0, W, H, C, 'rgba(60,8,12,.5)'); g.restore();
  // the window: a big hole in the red bus wall showing the snowy night; the frame
  g.save(); g.setTransform(...C); g.fillStyle = '#0c1024'; g.fillRect(260, 120, 1400, 620); g.restore();
  const Mk = mountainKit(); put(g, Mk.far, mul(C, mul(T(900, 700), S(.5))), { shadow: 0 });
  g.save(); g.setTransform(...C); paperShadow(g, 1, 1.2); g.fillStyle = '#c8102e'; g.beginPath(); g.rect(200, 60, 1520, 740); g.rect(260, 120, 1400, 620); g.fill('evenodd'); g.restore();
  put(g, kitchenKit().bowlSide, mul(C, mul(T(-100, -100), S(.01))), { shadow: 0 });
  // the two of them seated, worried; 爸爸 checks his watch; a suitcase on the rack
  const ts = st(t);
  drawFolk(g, mul(C, T(700, 1150)), 'mom', { expr: 'worried', scale: 1.5, head: -.08 + .03 * Math.sin(ts * 5), shF: -1.2, elF: -1.4, shB: -.8, elB: -1.2, handF: 'mitten', hipF: -1.4, knF: 1.5, hipB: -1.3, knB: 1.4, y: -130 }, { shadow: 1.2 });
  drawFolk(g, mul(C, T(1260, 1150)), 'dad', { expr: 'worried', scale: 1.5, flip: true, head: .15, shF: -1.4, elF: -1.5, shB: -.8, elB: -1.2, handF: 'hold', hipF: -1.4, knF: 1.5, hipB: -1.3, knB: 1.4, y: -130 }, { shadow: 1.2 });
  // suitcase on the rack above
  g.save(); g.setTransform(...C); paperShadow(g, 1, 1.2); g.fillStyle = '#8a0c20'; g.fillRect(1180, 40, 300, 160); g.fillStyle = '#c8102e'; g.fillRect(1300, 10, 60, 30); g.globalCompositeOperation = 'destination-out'; g.fillRect(1200, 60, 260, 6); g.fillRect(1200, 130, 260, 6); g.restore();
  pool(960, 1000, 1200, 'rgba(255,200,150,1)', .7);
  applyLight(g); bloom(g, .3);
  drawSnowfall(g, t, C, 2, { speed: 2 });
}
import { drawSnowfall } from '../sets/village.js';
ev(TT.parents, 'engineidle', { dur: 2.4, gain: .6 }); ev(TT.parents + 1.2, 'horn');

// ---------- the roof view again: the headlights stuck and blinking; the Nian's head rises beside 小雪 ----------
export function shotRoofView2(g, t) {
  roofView(g, t, { busU: BUS_U, blink: true, people: (gg, RM2) => {
    const rise = E_(st(t), TT.roofView2 + .4, TT.roofView2 + 1.2);
    drawGirl(gg, mul(RM2, T(-640, -40)), { expr: 'worried', head: -.2, shF: -.5, elF: -.6, shB: -.4, elB: -.5, handF: 'mitten', lean: -.04 });
    // the Nian is tall enough to look over the roof: its head rises behind the ridge at the right of her
    drawNian(gg, mul(RM2, mul(T(-220, 420 - 300 * rise), mul(S(.7), T(0, -NJ.ground)))), { ...NPOSE.stand, head: -.2, eye: 'curious', flip: true }, { shadow: 1.4, order: ['body', 'jaw', 'head'] });
  } });
}
ev(TT.roofView2, 'windbed', { dur: 2.6, gain: 1.0 }); ev(TT.roofView2 + .5, 'thud', { gain: .4 });

// ---------- the decision: CU the Nian looks at her, then at the mountain ----------
export function shotDecideCU(g, t) {
  const C = cam(960, 420, 1.0);
  const turn = E_(st(t), TT.decide - .6, TT.decide - .15), dec = t >= TT.decide;
  drawMountain(g, cam(1500, 500, .6), t, { amb: 'rgb(140,142,190)', bloom: .4, front: gg => {
    const M = mul(C, mul(T(560, 1180), mul(S(1.05), T(0, -NJ.ground))));
    const pose = { ...NPOSE.stand, flip: true, head: lerp(.15, -.1, turn), eye: dec ? 'determined' : turn > .5 ? 'normal' : 'soft', jaw: dec ? .15 : 0 };
    if (dec) pose.head += pop(t, TT.decide, 1.0) ? -.08 : 0;
    drawNian(gg, M, pose, { shadow: 1.6 });
    // 小雪 small at the right edge looking up at it
    drawGirl(gg, mul(C, T(1500, 1120)), { expr: 'lookup', head: -.3, shF: -.4, shB: -.3 }, { shadow: 1.2 });
  } });
}
ev(TT.decide, 'bassdrum'); ev(TT.decide - .4, 'breath');

Object.assign(SHOTS, { foldTD2: shotFoldTD2, pawTD: shotPawTD, laughGrandma: shotLaughGrandma, hornsIns: shotHornsIns, clock1: shotClock1, emptyChairs: shotEmptyChairs, busStuck: shotBusStuck, parentsCU: shotParentsCU, roofView2: shotRoofView2, decideCU: shotDecideCU });
