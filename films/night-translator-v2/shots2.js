// v2 shots: one painter per shot name, f(g, t, shot) with t = film time (hand-crank sampled), shot = {t0, t1, opt}.
// Each returns { cam, focus, tint, tintAmt }. Every motion is an eased keyframe track keyed to the cue sheet (HIT).
import { xiaoYi, laoJiao } from './robots.js';
import * as SET from './sets.js';
import * as S2 from './sets2.js';
import { form, ellipsePts, stroke, grey, catmull, S as IS } from './engine/ink.js';
import { HIT, SEC, at, LAMP_ROWS, lampAt, TINT } from './timeline.js';
import { K, clamp, lerp, ss, eo, ei, seg, hash, camApply, toFilm, back } from './lib.js';
import { red, maskAlpha } from './mask.js';
import { REELS } from './cardspecs.js';

export const GY = 925, XS = 1.2, LS = 1.15;
const XY0 = { x: 548, y: GY, s: XS }, LJ0 = { x: 990, y: GY, s: LS, dir: -1 };
const loc = (st, p) => [(p[0] - st.x) / (st.s ?? 1), (p[1] - st.y - (st.dy ?? 0)) / (st.s ?? 1)];
const B = n => SEC[n].beat;
const REST = { L: [XY0.x - 62, GY - 70], R: [XY0.x + 62, GY - 70] };
const DESK_CAM = { x: 700, y: 680, z: 1.9 };
const XY_FACE = [548, GY - 100 * XS];
const LJ_HEAD = [990 - 30, GY - (34 + 220) * LS - 34 * LS];
const setCam = (g, cam) => { IS.lineScale = 1 / Math.pow(cam.z, .55); camApply(g, cam); };
export const hoursAt = t => K([[0, 11.9], [SEC.ESTAB.t0, 11.98], [HIT.say, 12.0], [SEC.WEST.t0, 12.05], [SEC.MONT.t0, 1.0 + 12], [SEC.JAM.t0, 17.6], [HIT.lamps, 18.0]], t);
const pileAt = t => K([[0, 1], [HIT.wGrab, 1], [HIT.wGrab + .2, 20 / 21, 'snap'], [SEC.MONT.t0, 18 / 21], [SEC.JAM.t0, 1 / 21], [99, 1 / 21]], t);
const doneAt = t => K([[0, .05], [SEC.MONT.t0, .2], [SEC.JAM.t0, .98]], t);

// blurred background: draw the set into an offscreen canvas with the camera, then blur it in (depth of field)
const OFF = document.createElement('canvas'); OFF.width = 1440; OFF.height = 1080; const OG = OFF.getContext('2d');
function blurredSet(g, cam, draw, px = 5) {
  OG.setTransform(1, 0, 0, 1, 0, 0); OG.filter = 'none'; OG.globalAlpha = 1; OG.fillStyle = '#fff'; OG.fillRect(0, 0, 1440, 1080);
  setCam(OG, cam); maskAlpha(0); draw(OG); maskAlpha(1);
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.filter = `blur(${px}px)`; g.drawImage(OFF, 0, 0); g.filter = 'none'; g.restore();
  setCam(g, cam);
}
const ret = (cam, focusW, tint = 'blue', tintAmt = .55) => ({ cam, focus: toFilm(cam, focusW), tint, tintAmt });

// ================================================================ COLD OPEN
export function coldRoll(g, t, sh) {
  const u = t - sh.t0, cx = K([[0, 1150], [3.2, 820]], u), cam = { x: cx, y: 820, z: 2.0 };
  setCam(g, cam);
  form(g, [[-200, -200], [1800, -200], [1800, 900], [-200, 900]], { v: .17, line: 0, grad: .1 });
  for (let b = 0; b < 8; b++) form(g, [[b * 260 - 40, 300], [b * 260 + 180, 300], [b * 260 + 180, 900], [b * 260 - 40, 900]], { v: .13, line: 1.6 });
  form(g, [[-200, 900], [1800, 900], [1800, 1300], [-200, 1300]], { v: .24, line: 2, grad: .1 });
  for (let i = -8; i < 24; i++) stroke(g, [[i * 90, 904], [i * 90 - 60, 1300]], 1.2, { taper: 0, alpha: .5 });
  g.save(); g.globalAlpha = .22; g.fillStyle = grey(1); g.beginPath(); g.moveTo(700, -200); g.lineTo(980, -200); g.lineTo(1300, 1300); g.lineTo(900, 1300); g.fill(); g.restore();
  const x = K([[0, 1500], [3.3, 720]], u), r = 70;
  SET.firelight(g, x, 860, 260, 0, .35);
  SET.can(g, x, 900 - r + 6, r, .58);
  g.save(); g.translate(x, 900 - r + 6); g.rotate(-(x - 1500) / r); stroke(g, [[0, -r * .78], [0, -r * .2]], 3, { taper: 0 }); g.restore();
  return ret(cam, [x, 860], 'blue', .7);
}
function coldCorner(g, o) {
  SET.archive(g, { lampOn: 0, sconce: 0, moon: 1, pile: 1, done: .05, hours: 11.9 });
}
const XY_ASLEEP = { x: 250, y: GY, s: XS };
export function coldBump(g, t, sh) {
  const cam = { x: 400, y: 730, z: 1.55 }; setCam(g, cam);
  coldCorner(g);
  const cx = K([[sh.t0, 820], [HIT.bump, 318, 'lin'], [HIT.bump + .25, 345, 'eo']], t);
  const xy = { ...XY_ASLEEP, t, blink: 1, tilt: K([[HIT.bump, .12], [HIT.bump + .05, .02], [HIT.bump + .4, .1]], t), squash: K([[HIT.bump, .94], [HIT.bump + .06, .84, 'eo'], [HIT.bump + .4, .94]], t),
    ant: Math.sin((t - HIT.bump) * 22) * K([[HIT.bump, 0], [HIT.bump + .05, 1], [HIT.bump + 1, 0]], t) - .3,
    bulb: (t > HIT.bulb && (t < HIT.bulb + .1 || (t > HIT.bulb + .22 && t < HIT.bulb + .28) || t > HIT.bulb + .4)) ? 1 : 0, armL: { t: [-50, -20] }, armR: { t: [50, -20] } };
  xiaoYi(g, xy);
  SET.can(g, cx, GY - 24, 24, .55);
  return ret(cam, [300, GY - 100], 'blue', .7);
}
function xyClose(g, t, st, cam, setDraw) {
  blurredSet(g, cam, setDraw, 6);
  xiaoYi(g, st);
}
export function coldFace(g, t, sh) {
  const cam = { x: 250, y: GY - 105, z: 4.2 };
  const st = { ...XY_ASLEEP, t, blink: K([[HIT.eyes - .1, 1], [HIT.eyes + .1, 0]], t), bulb: 1, ex: K([[HIT.eyes, 0], [HIT.eyes + .2, -.7], [HIT.lookUp - .2, .6], [HIT.lookUp, 0]], t),
    ey: K([[HIT.lookUp, 0], [HIT.lookUp + .15, -1, 'eo']], t), brow: K([[HIT.lookUp, 0], [HIT.lookUp + .2, .5]], t), tilt: K([[HIT.eyes, .1], [HIT.eyes + .4, 0]], t), squash: K([[HIT.eyes, .94], [HIT.eyes + .3, 1]], t),
    armL: { t: [-50, -20] }, armR: { t: [50, -20] } };
  xyClose(g, t, st, cam, gg => coldCorner(gg));
  return ret(cam, [250, GY - 110], 'blue', .7);
}
export function coldTilt(g, t, sh) {
  const u = seg(t, sh.t0, sh.t1), cam = { x: 720, y: lerp(640, -830, eo(u * 1.05)), z: 1.05 };
  setCam(g, cam);
  S2.mountain(g, { t, teeter: 1, lightY: cam.y });
  return ret(cam, [720, cam.y], 'blue', .7);
}
export function coldTake(g, t, sh) {
  const cam = { x: 250, y: GY - 110, z: 3.6 };
  const st = { ...XY_ASLEEP, t, bulb: 1, ex: 0, ey: K([[HIT.take - .05, -1], [HIT.take, 0, 'snap'], [HIT.take + .25, -1, 'eo']], t),
    wide: K([[HIT.take - .05, 1], [HIT.take + .05, 1.55, 'eo'], [sh.t1, 1.4]], t), brow: K([[HIT.take - .05, .5], [HIT.take + .05, 1]], t),
    squash: K([[HIT.take - .1, 1], [HIT.take - .02, .82], [HIT.take + .08, 1.16, 'eo'], [HIT.take + .3, 1, 'spring']], t),
    ant: Math.sin((t - HIT.take) * 30) * K([[HIT.take, 0], [HIT.take + .05, 1.4], [sh.t1 + .5, 0]], t), armL: { t: [-80, -110] }, armR: { t: [80, -110] } };
  xyClose(g, t, st, cam, gg => coldCorner(gg));
  return ret(cam, [250, GY - 110], 'blue', .7);
}

// ================================================================ ESTABLISHING
export function estWide(g, t, sh) {
  const u = seg(t, sh.t0, sh.t1), cam = { x: lerp(720, 760, ss(u)), y: lerp(540, 580, ss(u)), z: lerp(1, 1.14, ss(u)) };
  setCam(g, cam);
  const lamp = t < HIT.roll - .5 ? (Math.floor(t * 20) % 3 ? 0 : .6) * clamp((t - sh.t0) * 2) : 1;
  SET.archive(g, { lampOn: lamp, moon: .7, slotGlow: .55, pile: 1, done: .05, hours: hoursAt(t) });
  const x = K([[HIT.roll, 250], [HIT.park, 548, 'eio']], t);
  const xy = { x, y: GY, s: XS, t, roll: (x - 250) / (18 * XS), tilt: K([[HIT.roll, 0], [HIT.roll + .3, .16], [HIT.park - .4, .12], [HIT.park, -.1], [HIT.park + .5, 0, 'spring']], t),
    ant: K([[HIT.roll, 0], [HIT.roll + .3, -.7], [HIT.park - .2, -.5], [HIT.park + .15, .9], [HIT.park + .9, 0, 'spring']], t), ex: K([[HIT.park, 0], [HIT.park + .3, 1]], t), bulb: .6 };
  const lj = { ...LJ0, t, lensOut: 0, head: .05 };
  laoJiao(g, lj); xiaoYi(g, xy);
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); S2.foreground(g, cam.x * cam.z, 1.5, 'L', .07); g.restore();
  return ret(cam, [x, GY - 100], 'blue', .6);
}
export function ljIntro(g, t, sh) {
  const cam = { x: 950, y: 690, z: 2.3 };
  blurredSet(g, cam, gg => SET.archive(gg, { pile: 1, done: .05, hours: hoursAt(t) }), 4);
  const fl = seg(t, HIT.flourish, HIT.flourish + .9);
  const sh0 = [-10, -230];
  const flourish = [sh0[0] - 40 + Math.cos(fl * Math.PI * 2 + 1) * 60, sh0[1] - 20 + Math.sin(fl * Math.PI * 2 + 1) * 60];
  const lj = { ...LJ0, t, lensOut: K([[HIT.unfold - .2, 0], [HIT.unfold + .35, 1, 'back'], [HIT.flourish, 1], [HIT.point, .6]], t),
    glint: K([[HIT.unfold + .2, 0], [HIT.unfold + .3, 1], [HIT.unfold + .8, 0]], t), head: K([[sh.t0, 0], [HIT.unfold, -.12], [HIT.flourish, .1], [HIT.point, -.05]], t),
    lean: K([[HIT.flourish, 0], [HIT.flourish + .4, .08], [HIT.point - .1, .06], [HIT.point + .2, -.12, 'back']], t),
    pen: fl > 0 && fl < 1 ? flourish : K([[sh.t0, [-60, -120]], [HIT.flourish - .3, [-40, -210]], [HIT.point - .2, [-60, -200]], [HIT.point + .2, [-150, -230], 'back']], t),
    penTilt: K([[HIT.flourish, .5], [HIT.flourish + .9, .5 + Math.PI * 2], [HIT.point, .1]], t), stamp: [30, -140] };
  laoJiao(g, lj);
  return ret(cam, LJ_HEAD, 'blue', .6);
}
export function gulp(g, t, sh) {
  const cam = { x: XY0.x, y: GY - 108, z: 3.6 };
  const st = { ...XY0, t, bulb: K([[HIT.nodGo, .3], [HIT.nodGo + .2, 1]], t), ex: K([[sh.t0, 1], [HIT.gulp, 1], [HIT.gulp + .3, 0]], t), ey: K([[HIT.gulp + .3, 0], [HIT.nodGo, .3], [HIT.nodGo + .3, 0]], t),
    wide: K([[sh.t0, 1.25], [HIT.nodGo, 1.2], [HIT.nodGo + .2, .95]], t), brow: K([[sh.t0, .8], [HIT.nodGo - .1, .8], [HIT.nodGo + .1, -.6]], t),
    squash: K([[HIT.gulp - .1, 1], [HIT.gulp + .05, .86, 'eo'], [HIT.gulp + .35, 1.04], [HIT.gulp + .6, 1]], t),
    tilt: K([[HIT.nodGo - .05, 0], [HIT.nodGo + .12, .16], [HIT.nodGo + .35, 0, 'spring']], t),
    ant: K([[sh.t0, 0], [HIT.gulp, -.9], [HIT.nodGo, -.9], [HIT.nodGo + .2, .6], [HIT.nodGo + .8, 0, 'spring']], t), armL: { t: [-62, -40] }, armR: { t: [62, -40] } };
  xyClose(g, t, st, cam, gg => SET.archive(gg, { pile: 1, done: .05, hours: hoursAt(t) }));
  return ret(cam, XY_FACE, 'blue', .55);
}

// ================================================================ THE DESK (WEST / ROMA / MONS / JAM / FIRE)
// st: per-frame desk state; draws the archive, both robots and the props
function desk(g, t, cam, o) {
  setCam(g, cam);
  SET.archive(g, { hours: hoursAt(t), pile: o.pile ?? pileAt(t), done: o.done ?? doneAt(t), lampOn: 1, jam: o.jam ?? 0, viewerSpin: o.spin ?? t * 6, viewerLight: o.vl ?? 1,
    typing: o.typing ?? 0, paper: o.paper ?? 0, lampSwing: o.swing ?? 0, dawn: o.dawn ?? 0 });
  laoJiao(g, o.lj);
  if (o.lectern) SET.page(g, o.lectern.p[0], o.lectern.p[1], o.lectern.a, { tick: o.lectern.tick, mark: o.lectern.mark });
  if (o.sheet) SET.page(g, o.sheet[0], o.sheet[1] - 14, 0, {});
  xiaoYi(g, o.xy);
  if (o.canP) SET.can(g, o.canP[0], o.canP[1], 21, .55, { label: o.canLabel });
  if (o.ball) SET.page(g, o.ball[0], o.ball[1], t * 8, { ball: true, mark: true });
  for (const c of o.cans || []) SET.can(g, c[0], c[1], 21, .52);
  if (o.smoke) SET.smoke(g, SET.VIEWER.x, SET.VIEWER.y - 10, o.smoke, t, { n: 9, rise: 220, s: 1.2, v: .8 });
  if (o.flames) S2.flame(g, o.flames[0], o.flames[1], o.flames[2], t, 1);
}
const deskXY = (t, extra = {}) => ({ ...XY0, t, roll: 0, ...extra });
const deskLJ = (t, extra = {}) => ({ ...LJ0, t, lean: 0, lensOut: .2, pen: [-60, -120], stamp: [30, -140], ...extra });
const LEC = [892, 706];

export function deskGrab(g, t, sh) {
  const top = SET.pileTop(1), spool = [SET.VIEWER.x - 22, SET.VIEWER.y - 26];
  const hL = K([[sh.t0, REST.L], [HIT.wGrab - .25, top, 'eio'], [HIT.wGrab + .05, top], [HIT.wThread, spool, 'eio'], [HIT.wThread + .3, REST.L]], t);
  const xy = deskXY(t, { armL: { t: loc(XY0, hL), open: .5 }, ex: K([[sh.t0, 0], [HIT.wGrab - .3, -1], [HIT.wGrab, -1], [HIT.wThread, .6]], t), ey: K([[HIT.wGrab - .3, .4], [HIT.wThread, .6]], t),
    tilt: K([[HIT.wGrab - .35, 0], [HIT.wGrab - .1, -.12], [HIT.wGrab + .2, 0], [HIT.wThread - .1, .08], [HIT.wThread + .2, 0]], t), bulb: .4 });
  desk(g, t, DESK_CAM, { xy, lj: deskLJ(t), canP: t > HIT.wGrab && t < HIT.wThread ? hL : null, spin: Math.max(0, t - HIT.wThread) * 9, vl: t > HIT.wThread ? 1 : .2 });
  return ret(DESK_CAM, XY_FACE, 'blue', .55);
}
export function viewer(g, t, sh) {
  const r = sh.opt.reel, u = t - sh.t0, cam = { x: 720, y: 540, z: 1 }; setCam(g, cam);
  S2.viewerGate(g, t, gg => {
    if (r === 'WEST') S2.western(gg, u);
    if (r === 'ROMA') S2.romance(gg, u, K([[0, 1.4], [sh.t1 - sh.t0, .45]], u));
    if (r === 'MONS') S2.monster(gg, u, Math.max(0, 1 - Math.abs(t - HIT.mFlash) * 6) + Math.max(0, 1 - Math.abs(t - HIT.mFlash - .25) * 9) * .6);
  });
  return ret(cam, [720, 500], { WEST: 'amber', ROMA: 'rose', MONS: 'green' }[r], .85);
}
export const reelTint = r => ({ WEST: 'amber', ROMA: 'rose', MONS: 'green' }[r]);
export function page(g, t, sh) {
  const R = REELS[sh.opt.reel], cam = { x: 720, y: 540, z: 1 }; setCam(g, cam);
  S2.pageInsert(g, { typed: seg(t, sh.t0 + .1, sh.t0 + 1.4), rot: -.02 }, R);
  return ret(cam, [720, 560], 'blue', .4);
}
export function pageFix(g, t, sh) {
  const R = REELS[sh.opt.reel], cam = { x: 720, y: 540, z: 1 }; setCam(g, cam);
  const st = sh.opt.reel === 'WEST' ? [HIT.wStrike, HIT.wFix] : [HIT.rStrike, HIT.rFix];
  S2.pageInsert(g, { typed: 1, strike: seg(t, st[0], st[0] + .35), fix: seg(t, st[1], st[1] + .9), creased: true, seed: 3, rot: .015 }, R);
  return ret(cam, [720, 560], 'blue', .4);
}
export function ljPop(g, t, sh) {
  const cam = { x: 935, y: 610, z: 3.0 }, P = HIT[sh.opt.pop || 'rPop'];
  blurredSet(g, cam, gg => SET.archive(gg, { pile: pileAt(t), done: doneAt(t), hours: hoursAt(t) }), 4);
  laoJiao(g, deskLJ(t, { lensOut: K([[P - .05, .3], [P + .3, 1.7, 'spring']], t), glint: K([[P, 0], [P + .1, 1], [P + .5, 0]], t),
    head: K([[P, 0], [P + .3, .35, 'back']], t), lean: K([[P, 0], [P + .3, -.14]], t) }));
  return ret(cam, LJ_HEAD, 'blue', .55);
}
export function ljRead(g, t, sh) {
  const cam = { x: 935, y: 610, z: 3.0 };
  blurredSet(g, cam, gg => SET.archive(gg, { pile: pileAt(t), done: doneAt(t), hours: hoursAt(t) }), 4);
  const lj = deskLJ(t, { lean: K([[sh.t0, -.14], [HIT.wRecoil - .03, -.18], [HIT.wRecoil + .05, .16, 'eo'], [sh.t1, .08]], t),
    lensOut: K([[sh.t0, .4], [HIT.wZoom + .3, 1.25, 'eo'], [HIT.wRecoil, 1.3], [HIT.wRecoil + .06, 0, 'eo']], t),
    head: K([[HIT.wRecoil - .03, -.05], [HIT.wRecoil + .05, .25, 'eo'], [sh.t1, .1]], t), glint: K([[HIT.wRecoil, 0], [HIT.wRecoil + .08, 1], [HIT.wRecoil + .5, 0]], t),
    pen: K([[HIT.wRecoil, [-60, -120]], [HIT.wRecoil + .4, [-30, -250], 'back']], t), penTilt: K([[HIT.wRecoil, .5], [HIT.wRecoil + .4, -.4]], t) });
  laoJiao(g, lj);
  SET.page(g, LEC[0], LEC[1], -.15, {});
  return ret(cam, LJ_HEAD, 'blue', .55);
}
// the throw: crumple on the lectern, a parabola, then a per-shot ending (bonk / duck / catch)
function throwBall(t, tThrow, tHit, target, h = 120) {
  if (t < tThrow || t >= tHit) return null;
  const u = seg(t, tThrow, tHit), p0 = [900, 650];
  return [lerp(p0[0], target[0], u), lerp(p0[1], target[1], u) - Math.sin(u * Math.PI) * h];
}
function ljThrower(t, tCrumple, tThrow, extra = {}) {
  const L2 = loc(LJ0, LEC);
  return deskLJ(t, { lean: K([[tCrumple - .4, -.12], [tThrow - .1, .08], [tThrow + .1, -.14], [tThrow + .6, 0]], t), lensOut: K([[tCrumple - .3, .8], [tThrow, .3]], t),
    pen: K([[tCrumple - .3, [L2[0] + 20, L2[1] - 40]], [tThrow - .08, [L2[0] + 70, L2[1] - 110], 'eo'], [tThrow + .1, [-90, -170], 'eo'], [tThrow + .7, [-60, -120]]], t),
    stamp: K([[tCrumple - .3, [L2[0] + 4, L2[1] - 30]], [tThrow, [30, -140]]], t), ...extra });
}
export function deskThrow(g, t, sh) {
  const head = [XY0.x, GY - 150 * XS];
  let ball = throwBall(t, HIT.wThrow, HIT.wBonk, head);
  if (t >= HIT.wBonk) { const u = seg(t, HIT.wBonk, HIT.wBonk + .9); ball = [head[0] - 150 * u, Math.min(GY + 14, head[1] - Math.sin(Math.min(1, u * 1.6) * Math.PI) * 70 + ei(u) * 160 + u * 40)]; }
  const xy = deskXY(t, { squash: K([[HIT.wBonk - .01, 1], [HIT.wBonk + .06, .76, 'eo'], [HIT.wBonk + .35, 1.07], [HIT.wBonk + .6, 1, 'spring']], t),
    tilt: K([[HIT.wBonk - .01, 0], [HIT.wBonk + .08, -.14], [HIT.wBonk + .5, 0, 'spring']], t), ant: Math.sin((t - HIT.wBonk) * 26) * K([[HIT.wBonk, 0], [HIT.wBonk + .05, 1.4], [HIT.wBonk + 1.3, 0]], t),
    brow: K([[HIT.wBonk, 0], [HIT.wBonk + .1, -1], [HIT.wLook, -.4], [HIT.wLook + .6, 0]], t), wide: K([[HIT.wBonk, 1], [HIT.wBonk + .1, .7], [HIT.wLook, 1]], t),
    ex: K([[sh.t0, 1], [HIT.wBonk, 1], [HIT.wBonk + .1, 0, 'snap']], t), ey: K([[sh.t0, -.5], [HIT.wBonk + .1, 0, 'snap']], t), blink: K([[HIT.wLook + .5, 0], [HIT.wLook + .57, 1], [HIT.wLook + .66, 0]], t) });
  desk(g, t, DESK_CAM, { xy, lj: ljThrower(t, HIT.wCrumple, HIT.wThrow), ball, lectern: t < HIT.wThrow - .05 ? { p: LEC, a: -.15, mark: true } : null });
  const r = { ...ret(DESK_CAM, XY_FACE) };
  if (t > HIT.wLook) r.iris = lerp(1900, 300, ss(seg(t, HIT.wLook, HIT.wLook + .45)));
  return r;
}
export function deskFlip(g, t, sh) {
  const cam = sh.opt.wide ? { x: 720, y: 700, z: 1.8 } : { x: 600, y: 745, z: 2.5 };
  const s = XS, flipU = seg(t, HIT.rFlip, HIT.rFlip + .55), topU = seg(t, HIT.rTopple, HIT.rTopple + .5);
  const spin = flipU * Math.PI + topU * Math.PI + (flipU >= 1 && topU <= 0 ? Math.sin((t - HIT.rFlip) * 5) * .09 : 0);
  const dy = K([[HIT.rCrouch, 0], [HIT.rFlip, 6], [HIT.rFlip + .28, -150, 'eo'], [HIT.rFlip + .55, 8 * s, 'ei'], [HIT.rTopple, 8 * s], [HIT.rTopple + .25, -90, 'eo'], [HIT.rTopple + .5, 0, 'ei']], t);
  const xy = deskXY(t, { spin: spin % (Math.PI * 2), dy, squash: K([[HIT.rCrouch - .1, 1], [HIT.rCrouch + .2, .78], [HIT.rFlip, .78], [HIT.rFlip + .1, 1.12], [HIT.rFlip + .4, 1], [HIT.rTopple + .5, .8], [HIT.rTopple + .75, 1, 'spring']], t),
    roll: t > HIT.rFlip + .5 && t < HIT.rTopple ? (t - HIT.rFlip) * 26 : 0, ant: -Math.sin((t - HIT.rFlip) * 9) * .3,
    armL: { t: flipU > 0 && topU < 1 ? [-95, -110] : [-62, -40] }, armR: { t: flipU > 0 && topU < 1 ? [95, -110] : [62, -40] }, ex: .3, ey: K([[HIT.rFlip, -.6], [HIT.rFlip + .6, .8]], t),
    brow: K([[HIT.rCrouch, -.6], [HIT.rFlip + .6, .3], [HIT.rTopple, .8]], t), blink: K([[HIT.rTopple + .4, 0], [HIT.rTopple + .5, 1], [HIT.rTopple + .8, 0]], t) });
  const lj = deskLJ(t, { lensOut: K([[HIT.rPop - .05, .3], [HIT.rPop + .3, 1.7, 'spring']], t), glint: K([[HIT.rPop, 0], [HIT.rPop + .1, 1], [HIT.rPop + .5, 0]], t),
    head: K([[HIT.rPop, 0], [HIT.rPop + .4, .35, 'back'], [HIT.rTopple, .3], [HIT.rTopple + .6, 0]], t), lean: K([[HIT.rPop, 0], [HIT.rPop + .3, -.14]], t) });
  desk(g, t, cam, { xy, lj, lectern: { p: LEC, a: -.15 } });
  return ret(cam, [XY0.x, GY - 90], 'blue', .55);
}
export function deskDuck(g, t, sh) {
  const top = SET.pileTop(19 / 21);
  let ball = throwBall(t, HIT.rThrow, HIT.rPile, top, 160);
  const cans = [];
  if (t > HIT.rPile) { const u = t - HIT.rPile; for (let i = 0; i < 3; i++) { const vx = -120 - i * 70, x = top[0] + vx * u, y = Math.min(GY - 21, top[1] - 120 * u + 700 * u * u + i * 6); cans.push([x, y]); } ball = [top[0] + 60 * (t - HIT.rPile), Math.min(GY + 14, top[1] + 500 * (t - HIT.rPile) ** 2)]; }
  const xy = deskXY(t, { squash: K([[HIT.rDuck - .1, 1], [HIT.rDuck + .05, .62, 'eo'], [HIT.rPile + .1, .62], [HIT.rPile + .4, 1.05], [HIT.rPile + .7, 1, 'spring']], t),
    ant: K([[HIT.rDuck - .1, 0], [HIT.rDuck + .05, -1.4], [HIT.rPile + .1, -1.2], [HIT.rPile + .5, .3], [HIT.rPile + 1, 0, 'spring']], t), blink: K([[HIT.rDuck - .05, 0], [HIT.rDuck + .05, 1], [HIT.rPile + .2, 1], [HIT.rPile + .35, 0]], t),
    ex: K([[HIT.rPile + .3, 0], [HIT.rPile + .5, -1]], t), brow: K([[HIT.rDuck, .8], [HIT.rPile + .6, .2]], t), armL: { t: K([[HIT.rDuck - .1, [-62, -40]], [HIT.rDuck + .05, [-30, -120]], [HIT.rPile + .4, [-62, -40]]], t) }, armR: { t: K([[HIT.rDuck - .1, [62, -40]], [HIT.rDuck + .05, [30, -120]], [HIT.rPile + .4, [62, -40]]], t) } });
  desk(g, t, DESK_CAM, { xy, lj: ljThrower(t, HIT.rThrow - .5, HIT.rThrow), ball, cans, pile: t > HIT.rPile ? 16 / 21 : 19 / 21, lectern: t < HIT.rThrow - .05 ? { p: LEC, a: -.15, mark: true } : null });
  return ret(DESK_CAM, XY_FACE);
}
export function thinkCats(g, t, sh) {
  const cam = { x: XY0.x + 40, y: GY - 120, z: 3.0 };
  const u = t - HIT.mThink;
  const st = { ...XY0, t, ex: .5, ey: clamp(lerp(-1, 1, ((u * .8) % 1))), brow: .4, bulb: .6, armL: { t: [-62, -40] }, armR: { t: [62, -40] } };
  xyClose(g, t, st, cam, gg => SET.archive(gg, { pile: pileAt(t), done: doneAt(t), hours: hoursAt(t) }));
  // thought bubbles and the thought iris (screen space)
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  const k = ss(seg(t, sh.t0, HIT.mThink)), R = 330 * k, C = [1040, 330];
  for (const [x, y, r] of [[860, 640, 18], [920, 560, 28]]) form(g, ellipsePts(x, y, r * k, r * k, 0, 16), { v: .95, line: 2 });
  if (R > 2) {
    g.save(); g.beginPath(); g.arc(C[0], C[1], R, 0, 7); g.clip();
    form(g, ellipsePts(C[0], C[1], R, R, 0, 40), { v: .55, line: 0, grad: .2 });
    form(g, catmull([[C[0] - 260, C[1] - 160], [C[0] - 120, C[1] - 260], [C[0] + 60, C[1] - 230], [C[0] + 260, C[1] - 170], [C[0] + 200, C[1] - 90], [C[0] - 220, C[1] - 90]], true, 6), { v: .3, line: 2 });
    for (let i = 0; i < 7; i++) { const ph = (u * .55 + i / 7) % 1, x = C[0] - 200 + hash(i) * 400, y = C[1] - 120 + ph * 520; (i % 2 ? S2.dogSil : S2.catSil)(g, x, y, 1.3, ph * 6 + i); }
    g.restore();
    g.lineWidth = 4; g.strokeStyle = grey(.9); g.beginPath(); g.arc(C[0], C[1], R, 0, 7); g.stroke();
  }
  g.restore();
  return ret(cam, XY_FACE, 'blue', .55);
}
export function pageHand(g, t, sh) {
  const R = REELS.MONS, cam = { x: 720, y: 540, z: 1 }; setCam(g, cam);
  // nib path: strike line (y≈615, x 310 → 760), then the brush correction (y≈800, x 360 → 900)
  const nib = K([[HIT.mPen - .01, [1500, 1000]], [HIT.mStrike, [300, 610], 'eio'], [HIT.mStrike + .35, [770, 600]], [HIT.mFix, [380, 760], 'eio'], [HIT.mFix + .9, [900, 790]], [HIT.mFix + 1.6, [1300, 1000], 'eio']], t);
  S2.pageInsert(g, { typed: seg(t, sh.t0 + .1, sh.t0 + 1.4), strike: seg(t, HIT.mStrike, HIT.mStrike + .35), fix: seg(t, HIT.mFix, HIT.mFix + .9), rot: -.02, pen: t > HIT.mPen ? [nib[0] + 430, nib[1] + 157] : null }, R);
  return ret(cam, [720, 560], 'blue', .4);
}
export function deskCatch(g, t, sh) {
  const catchP = [XY0.x + 60 * XS, GY - 135 * XS];                       // within arm reach (arm = 60)
  let ball = throwBall(t, HIT.mThrow, HIT.mCatch, catchP, 140), held = null;
  if (t >= HIT.mCatch && t < HIT.mUnfold) held = catchP;
  const hR = K([[sh.t0, REST.R], [HIT.mCatch - .25, [catchP[0] + 10, catchP[1] - 10], 'eo'], [HIT.mCatch, catchP], [HIT.mUnfold - .1, [XY0.x + 60, GY - 175]], [HIT.mUnfold + .3, [XY0.x + 40, GY - 150]]], t);
  const hL = K([[HIT.mUnfold - .2, REST.L], [HIT.mUnfold + .3, [XY0.x - 40, GY - 150]]], t);
  const xy = deskXY(t, { armR: { t: loc(XY0, hR), open: K([[HIT.mCatch - .1, .9], [HIT.mCatch, .1]], t) }, armL: { t: loc(XY0, hL) },
    squash: K([[HIT.mCatch - .01, 1], [HIT.mCatch + .06, .88, 'eo'], [HIT.mCatch + .3, 1]], t), ex: K([[sh.t0, 1], [HIT.mCatch - .3, .6], [HIT.mCatch, .8], [HIT.mUnfold, 0], [HIT.mNod + .3, 1]], t),
    ey: K([[sh.t0, -.4], [HIT.mCatch - .2, -1], [HIT.mUnfold, .6], [HIT.mNod, .6], [HIT.mNod + .3, 0]], t),
    tilt: K([[HIT.mNod - .05, 0], [HIT.mNod + .12, .15], [HIT.mNod + .35, 0, 'spring']], t), brow: K([[HIT.mCatch, 0], [HIT.mUnfold, .3], [HIT.mNod, -.3]], t), bulb: K([[HIT.mNod, .2], [HIT.mNod + .2, 1]], t) });
  const lj = ljThrower(t, HIT.mThrow - .5, HIT.mThrow, {
    lensOut: K([[HIT.mThrow, .3], [HIT.mPop - .05, .3], [HIT.mPop + .3, 1.7, 'spring'], [HIT.mBow - .3, 1], [HIT.mBow, .5]], t), glint: K([[HIT.mPop, 0], [HIT.mPop + .1, 1], [HIT.mPop + .5, 0]], t),
    head: K([[HIT.mPop, 0], [HIT.mPop + .3, .3, 'back'], [HIT.mBow - .2, .1], [HIT.mBow + .3, .35], [sh.t1, .25]], t) });
  if (t > HIT.mBow - .3) lj.lean = K([[HIT.mBow - .3, 0], [HIT.mBow + .3, -.18, 'eio'], [sh.t1, -.15]], t);
  const sheetP = t >= HIT.mUnfold ? [(hR[0] + hL[0]) / 2, (hR[1] + hL[1]) / 2 + 10] : null;
  const cam = sh.opt.close ? { x: 600, y: 745, z: 2.5 } : DESK_CAM;
  desk(g, t, cam, { xy, lj, ball: ball || held, sheet: sheetP, lectern: t < HIT.mThrow - .05 ? { p: LEC, a: -.15, mark: true } : null });
  if (sheetP) red(g, m => { m.fillRect(sheetP[0] - 8, sheetP[1] - 20, 16, 3); });
  return ret(cam, XY_FACE);
}

// ================================================================ MONTAGE
const mtint = t => lerp(.55, .25, seg(t, SEC.MONT.t0, SEC.MONT.t1));
export function mClock(g, t, sh) { setCam(g, { x: 720, y: 540, z: 1 }); S2.bigClock(g, 12 + K([[sh.t0, sh.opt.h0], [sh.t1, sh.opt.h1, 'lin']], t)); return ret({ x: 720, y: 540, z: 1 }, [720, 540], 'blue', mtint(t)); }
export function mKeys(g, t) { setCam(g, { x: 720, y: 540, z: 1 }); S2.keysClose(g, t); return ret({ x: 720, y: 540, z: 1 }, [720, 540], 'blue', mtint(t)); }
export function mTube(g, t) { setCam(g, { x: 720, y: 540, z: 1 }); S2.tubeOutlet(g, t); return ret({ x: 720, y: 540, z: 1 }, [720, 540], 'blue', mtint(t)); }
export function mStamp(g, t) { setCam(g, { x: 720, y: 540, z: 1 }); S2.stampClose(g, t, B('MONT') * 2); return ret({ x: 720, y: 540, z: 1 }, [720, 540], 'blue', mtint(t)); }
export function mReel(g, t, sh) { setCam(g, { x: 720, y: 540, z: 1 }); S2.reelFace(g, (t - sh.t0) * 5); return ret({ x: 720, y: 540, z: 1 }, [720, 540], 'blue', mtint(t)); }
export function mBasket(g, t, sh) { setCam(g, { x: 720, y: 540, z: 1 }); S2.basketOverflow(g, t, seg(t, sh.t0, sh.t1)); return ret({ x: 720, y: 540, z: 1 }, [720, 540], 'blue', mtint(t)); }
export function mWide(g, t, sh) {
  const cam = { x: 720, y: 540, z: 1 }; setCam(g, cam);
  const u = seg(t, sh.t0, sh.t1), fast = Math.floor(t * 12);
  SET.archive(g, { hours: 15 + u * 1.2, pile: lerp(.6, .2, u), done: lerp(.5, .8, u), lampOn: 1, viewerSpin: t * 30, typing: fast, paper: (t * 3) % 1 });
  const xy = { ...XY0, t, armL: { t: loc(XY0, fast % 2 ? REST.L : SET.pileTop(.5)) }, armR: { t: loc(XY0, fast % 2 ? [740, 820] : [720, 812]) }, ex: fast % 2 ? -1 : .6, bulb: .5 };
  laoJiao(g, deskLJ(t, { lean: fast % 2 ? -.15 : 0, stamp: fast % 2 ? loc(LJ0, [896, 690]) : [30, -140], lensOut: .8 }));
  xiaoYi(g, xy);
  for (let i = 0; i < 3; i++) { const p = ((t * 2.5 + i / 3) % 1); SET.page(g, lerp(770, 880, p), lerp(800, 620, p) - Math.sin(p * Math.PI) * 60, p * 6, {}); }
  return ret(cam, [720, 600], 'blue', mtint(t));
}

// ================================================================ THE JAM
export function jamDesk(g, t, sh) {
  const vw = [SET.VIEWER.x, SET.VIEWER.y + 4], spool = [SET.VIEWER.x - 22, SET.VIEWER.y - 26];
  const hL = K([[sh.t0, [XY0.x - 40, GY - 160]], [HIT.jThread, spool, 'eio'], [HIT.jam, [vw[0] - 34, vw[1]]], [HIT.jBump + .4, [vw[0] - 34, vw[1]]]], t);
  const hR = K([[sh.t0, REST.R], [HIT.jam, [vw[0] + 34, vw[1]]]], t);
  const shake = t > HIT.jam && t < HIT.jBump ? Math.sin((t - HIT.jam) * 50) * 8 : 0;
  const swing = t > HIT.jBump ? .3 * Math.sin((t - HIT.jBump) * 3.2) * Math.exp(-(t - HIT.jBump) * .25) : 0;
  const xy = deskXY(t, { armL: { t: loc(XY0, [hL[0] + shake, hL[1]]) }, armR: { t: loc(XY0, [hR[0] + shake, hR[1]]) }, lean: shake * .6,
    squash: K([[HIT.jBump - .05, 1], [HIT.jBump + .05, .86], [HIT.jBump + .3, 1]], t), ex: .6, ey: .6, brow: K([[HIT.jam, 0], [HIT.jam + .2, .8]], t) });
  desk(g, t, DESK_CAM, { xy, lj: deskLJ(t, { lensOut: K([[HIT.jBump, .2], [HIT.jBump + .3, .9]], t), head: K([[HIT.jBump, 0], [HIT.jBump + .3, .2]], t) }),
    canP: t < HIT.jThread ? hL : null, canLabel: true, jam: K([[HIT.jam - .05, 0], [HIT.jam + .25, 1]], t), spin: Math.min(t, HIT.jam) * 9, swing, smoke: K([[HIT.jBump, 0], [sh.t1, .5]], t) });
  return ret(DESK_CAM, XY_FACE, 'blue', .4);
}
export function jamInsert(g, t, sh) {
  const cam = { x: 720, y: 540, z: 1 }; setCam(g, cam);
  const u = t - sh.t0;
  S2.viewerGate(g, t, gg => {
    // the last reel's own frame: our title card — this reel is the film we are watching
    form(gg, [[-50, -50], [1490, -50], [1490, 1130], [-50, 1130]], { v: .06, line: 0, grad: 0 });
    gg.save(); gg.fillStyle = grey(.9); gg.font = '900 96px "Playfair Display SC"'; gg.textAlign = 'center'; gg.textBaseline = 'middle'; gg.fillText('THE NIGHT', 720, 470); gg.fillText('TRANSLATOR', 720, 600); gg.restore();
    // the burn hole spreading from the gate's heat
    const r = 14 + u * u * 70, cx = 1180, cy = 230;
    gg.save(); const gr = gg.createRadialGradient(cx, cy, r * .5, cx, cy, r * 1.3); gr.addColorStop(0, grey(1, 1)); gr.addColorStop(.6, grey(.95, .9)); gr.addColorStop(.8, grey(.35, .9)); gr.addColorStop(1, grey(.1, 0));
    gg.fillStyle = gr; gg.beginPath(); for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2, rr = r * 1.3 * (.8 + hash(i + Math.floor(u * 8)) * .4); i ? gg.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr) : gg.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } gg.fill(); gg.restore();
  }, { run: K([[sh.t0, 40], [sh.t0 + .5, 4]], t) });
  SET.smoke(g, 1000, 900, 1, t, { n: 10, rise: 700, s: 3, v: .85, speed: .5 });
  const fl = Math.max(0, 1 - Math.abs(t - HIT.spark) * 7);
  if (fl > 0) { g.save(); g.globalAlpha = fl * .6; g.fillStyle = '#fff'; g.fillRect(0, 0, 1440, 1080); g.restore(); }
  return ret(cam, [900, 420], 'none', 0);
}
export function jamFace(g, t, sh) {
  const cam = { x: XY0.x, y: GY - 108, z: 3.4 };
  const swing = .3 * Math.sin((t - HIT.jBump) * 3.2) * Math.exp(-(t - HIT.jBump) * .25);
  const st = { ...XY0, t, wide: K([[HIT.jWide - .05, 1], [HIT.jWide + .1, 1.5, 'eo']], t), brow: K([[HIT.jWide, .6], [HIT.jWide + .1, 1]], t), ex: K([[sh.t0, .7], [HIT.silence1, .7], [HIT.silence1 + .5, 0]], t), ey: K([[sh.t0, .5], [HIT.silence1 + .5, 0]], t),
    squash: K([[HIT.jWide - .05, 1], [HIT.jWide + .08, 1.1, 'eo'], [HIT.jWide + .4, 1]], t), ant: K([[HIT.jWide, 0], [HIT.jWide + .1, .8]], t), bulb: (Math.floor(t * 6) % 2) * .8, armL: { t: [-62, -40] }, armR: { t: [62, -40] } };
  xyClose(g, t, st, cam, gg => SET.archive(gg, { pile: pileAt(t), done: doneAt(t), hours: hoursAt(t), lampSwing: swing, jam: 1 }));
  // the swinging lamp's light sweeping across the face
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; S2.glow(g, 720 + swing * 2200, 300, 700, .28); g.restore();
  SET.smoke(g, SET.VIEWER.x - 20, SET.VIEWER.y - 10, 1, t, { n: 9, rise: 260, s: 1.2, v: .8 });
  return ret(cam, XY_FACE, 'none', 0);
}

// ================================================================ THE FIRE
export function fireDesk(g, t, sh) {
  const vw = [SET.VIEWER.x, SET.VIEWER.y - 10];
  const toss = (t - HIT.hot) / .42, k = Math.floor(toss), f = toss - k, side = k % 2;
  const pL = [XY0.x - 60, GY - 150], pR = [XY0.x + 60, GY - 150];
  let canP;
  if (t < HIT.yank) canP = vw;
  else if (t < HIT.hot) canP = K([[HIT.yank, vw], [HIT.hot, pR, 'eo']], t);
  else if (t < at('FIRE', 4.5)) { const a = side ? pL : pR, b = side ? pR : pL; canP = [lerp(a[0], b[0], f), lerp(a[1], b[1], f) - Math.sin(f * Math.PI) * 90]; }
  else canP = [XY0.x, GY - 205 * XS];
  const hop = t > HIT.hot && t < at('FIRE', 4.5) ? -Math.abs(Math.sin(toss * Math.PI)) * 22 : 0;
  const near = side ? pR : pL;
  const xy = deskXY(t, { dy: hop, armL: { t: loc({ ...XY0, dy: hop }, t < at('FIRE', 4.5) ? (side ? [pL[0], pL[1] + 30] : canP) : [canP[0] - 26, canP[1] + 8]) },
    armR: { t: loc({ ...XY0, dy: hop }, t < HIT.hot ? canP : t < at('FIRE', 4.5) ? (side ? canP : [pR[0], pR[1] + 30]) : [canP[0] + 26, canP[1] + 8]) },
    wide: 1.35, brow: 1, ex: (canP[0] - XY0.x) / 70, ey: -.6, ant: Math.sin(t * 20) * .7, squash: 1 + hop * -.004 });
  const ljx = K([[HIT.hot, 990], [at('FIRE', 2.5), 990], [at('FIRE', 4.2), 1500, 'ei']], t);
  desk(g, t, DESK_CAM, { xy, lj: deskLJ(t, { x: ljx, lean: K([[at('FIRE', 2.4), 0], [at('FIRE', 3), .3]], t), lensOut: K([[HIT.yank, .2], [HIT.yank + .3, 1.5, 'spring']], t), dir: t > at('FIRE', 2.6) ? 1 : -1 }),
    jam: 1, smoke: .8, canP, canLabel: true, flames: [canP[0], canP[1] - 16, 40] });
  SET.smoke(g, canP[0], canP[1] - 30, 1, t, { n: 7, rise: 160, s: 1.1, v: .8, speed: 1.3 });
  return ret(DESK_CAM, XY_FACE, 'none', 0);
}
export function fireTrack(g, t, sh) {
  const leg2 = sh.opt.leg === 2, u = t - sh.t0, x = (leg2 ? 2600 : 200) + u * 820;
  const cam = { x: x + 150, y: leg2 ? 760 : 700, z: leg2 ? 1.55 : 1.25 };
  setCam(g, cam);
  const x0 = cam.x - 720 / cam.z - 50, x1 = cam.x + 720 / cam.z + 50;
  SET.aisleBack(g, x0, x1);
  const s = 1.45, duck = leg2 ? 0 : K([[HIT.ladder - .35, 0], [HIT.ladder - .12, 1, 'eo'], [HIT.ladder + .25, 1], [HIT.ladder + .45, 0, 'back']], t);
  const xy = { x, y: GY, s, t, roll: x / (18 * s), tilt: .22 + Math.sin(t * 22) * .03 - duck * .1, ant: Math.sin(t * 30) * .8 - duck * 1.2, brow: 1, ex: .8, ey: -.6 + duck * .6, wide: 1.3,
    squash: (1 + Math.sin(t * 22) * .03) * (1 - duck * .4) };
  const canW = [x - 10, GY - 205 * s * xy.squash];
  xy.armL = { t: loc(xy, [canW[0] - 26, canW[1] + 8]) }; xy.armR = { t: loc(xy, [canW[0] + 26, canW[1] + 8]) };
  SET.firelight(g, canW[0], canW[1] + 40, 420, t, .5);
  SET.smoke(g, canW[0], canW[1] - 10, 1, t, { n: 10, rise: 130, drift: -7, s: 1.4, speed: 1.4 });
  xiaoYi(g, xy);
  SET.can(g, canW[0], canW[1], 30, .5);
  S2.flame(g, canW[0], canW[1] - 20, leg2 ? 70 : 50, t, 1);
  if (!leg2) { const lx = 200 + (HIT.ladder - sh.t0) * 820 + 40; if (Math.abs(lx - x) < 900) S2.ladder(g, lx, GY + 12, 640); }
  g.setTransform(cam.z * 1.7, 0, 0, cam.z * 1.7, 720 - cam.x * cam.z * 1.7, 540 - cam.y * cam.z * 1.7 + 200);
  SET.aisleFront(g, cam.x - 900, cam.x + 900);
  return ret(cam, canW, 'none', 0);
}
export function ljTrack(g, t, sh) {
  const u = t - sh.t0, x = 5000 + u * 700, cam = { x: x + 120, y: 640, z: 1.3 };
  setCam(g, cam);
  SET.aisleBack(g, cam.x - 720 / cam.z - 50, cam.x + 720 / cam.z + 50);
  const hookX = 5000 + (HIT.ljGrab - sh.t0) * 700 + 40, hookY = 560;
  const grabbed = t > HIT.ljGrab;
  const bk = grabbed ? [x + 70, GY - 260] : [hookX, hookY];
  if (!grabbed) { form(g, [[hookX - 70, 470], [hookX + 70, 470], [hookX + 70, 520], [hookX - 70, 520]], { v: .9, line: 1.6, grad: 0 }); red(g, m => { m.font = '700 38px "Noto Serif SC"'; m.textAlign = 'center'; m.textBaseline = 'middle'; m.fillText('消防', hookX, 495); }); }
  const lj = { x, y: GY, s: 1.3, t, dir: 1, lean: .26 + Math.sin(t * 18) * .02, lensOut: 1, head: -.1,
    pen: loc({ x, y: GY, s: 1.3 }, grabbed ? [bk[0] + 50, bk[1]] : K([[sh.t0, [x + 60, GY - 230]], [HIT.ljGrab, [hookX + 50, hookY], 'eio']], t)),
    stamp: loc({ x, y: GY, s: 1.3 }, grabbed ? [bk[0] - 50, bk[1]] : [x - 30, GY - 200]) };
  laoJiao(g, lj);
  SET.bucket(g, bk[0], bk[1], { water: true });
  g.setTransform(cam.z * 1.7, 0, 0, cam.z * 1.7, 720 - cam.x * cam.z * 1.7, 540 - cam.y * cam.z * 1.7 + 200);
  SET.aisleFront(g, cam.x - 900, cam.x + 900);
  return ret(cam, [x, GY - 300], 'none', 0);
}
const CY = 905, CATCH_P = [1000, 630], BUCKET_STAND = [1045, 790];
const canArc = t => { const u = seg(t, HIT.launch, HIT.catch), p0 = [700, 640]; return [lerp(p0[0], CATCH_P[0], u), lerp(p0[1], CATCH_P[1], u) - Math.sin(u * Math.PI) * 480 * (1 - u * .1)]; };
export function catchWide(g, t, sh) {
  const cam = { x: 720, y: 520, z: 1 }; setCam(g, cam);
  SET.aisleEnd(g, { bucketless: true });
  const s = 1.4, x = K([[sh.t0, -120, 'lin'], [HIT.trip, 600, 'lin'], [HIT.trip + .5, 760, 'eo']], t);
  const tilt = K([[HIT.trip, .22], [HIT.launch, .7, 'ei'], [HIT.trip + .5, 1.42, 'eo'], [HIT.popUp, 1.42], [HIT.popUp + .25, -.15, 'eo'], [HIT.popUp + .5, 0, 'spring']], t);
  const xy = { x, y: CY, s, t, roll: x / (18 * s), tilt, ant: Math.sin(t * 28) * K([[HIT.trip, .8], [HIT.trip + .6, .3], [HIT.popUp, .3], [HIT.popUp + .2, 1], [HIT.popUp + 1.2, 0]], t),
    brow: K([[sh.t0, 1], [HIT.trip, 1], [HIT.trip + .1, -1], [HIT.popUp, -1], [HIT.popUp + .3, 0]], t), blink: K([[HIT.trip + .5, 0], [HIT.trip + .6, 1], [HIT.popUp - .2, 1], [HIT.popUp, 0]], t),
    ex: K([[HIT.popUp + .3, 0], [HIT.popUp + .6, 1]], t), squash: K([[HIT.popUp + .2, 1], [HIT.popUp + .3, .85], [HIT.popUp + .5, 1]], t), bulb: K([[HIT.popUp + .6, 0], [HIT.popUp + 1, 1]], t) };
  const holding = t < HIT.launch;
  const canW = holding ? [x - 10 + 60 * tilt, CY - 205 * s + 90 * tilt] : canArc(t);
  if (holding) { xy.armL = { t: [-26, -197] }; xy.armR = { t: [26, -197] }; }
  const lx = K([[HIT.launch, 1600], [HIT.launch + .55, 1150, 'eo']], t);
  const bk = K([[HIT.launch + .55, [1100, 700]], [HIT.catch - .12, CATCH_P, 'eio'], [HIT.catch + .1, [CATCH_P[0], CATCH_P[1] + 26], 'eo'], [HIT.catch + .5, CATCH_P], [HIT.heal + 1.3, CATCH_P], [HIT.heal + 1.8, [1000, 812]]], t);
  const lj = { x: lx, y: CY - 5, s: 1.4, t, dir: -1, lean: K([[HIT.launch + .3, .25], [HIT.launch + .55, -.12], [HIT.catch, -.05]], t), lensOut: K([[HIT.launch + .5, 0], [HIT.launch + .8, 1]], t),
    head: K([[HIT.launch + .55, -.3], [HIT.catch - .2, -.35], [HIT.catch + .3, 0], [HIT.popUp + .5, .2]], t) };
  lj.pen = loc(lj, [bk[0] + 52, bk[1] + 4]); lj.stamp = loc(lj, [bk[0] - 30, bk[1] + 30]);
  if (t < HIT.catch) SET.firelight(g, canW[0], canW[1] + 30, 380, t, .45);
  if (t > HIT.launch + .2) { laoJiao(g, lj); SET.bucket(g, bk[0], bk[1], { water: true }); }
  if (t < HIT.catch) { SET.can(g, canW[0], canW[1], 30, .5); S2.flame(g, canW[0], canW[1] - 20, 50, t, 1); SET.smoke(g, canW[0], canW[1] - 10, 1, t, { n: 10, rise: 110, drift: holding ? -5 : -2, s: 1.3, speed: 1.3 }); }
  SET.smoke(g, bk[0], bk[1] - 10, K([[HIT.catch, 0], [HIT.catch + .1, 1.4], [HIT.heal + 1.5, .2]], t), t, { n: 14, rise: 330, s: 2.2, v: .92, speed: .7 });
  xiaoYi(g, xy);
  const sp = seg(t, HIT.catch, HIT.catch + .35);
  if (sp > 0 && sp < 1) for (let i = 0; i < 9; i++) { const a = -Math.PI * (.1 + .8 * i / 8), r = 30 + sp * 70; form(g, ellipsePts(bk[0] + Math.cos(a) * r, bk[1] + Math.sin(a) * r * 1.3 - sp * 20, 6 * (1 - sp) + 2, 9 * (1 - sp) + 2, a, 10), { v: .95, line: 1.2 }); }
  return ret(cam, t < HIT.catch ? canW : bk, 'none', 0);
}

// ================================================================ TENDER
const T_XY = { x: 1000, y: GY, s: 1.35 }, T_LJ = { x: 1290, y: GY, s: 1.3, dir: -1 };
function tenderSet(g, t, d = .12) { SET.archive(g, { dawn: d, pile: 1 / 21, done: .98, hours: hoursAt(t), lampOn: .8 }); }
export function dryWide(g, t, sh) {
  const u = seg(t, sh.t0, sh.t1), cam = { x: lerp(1120, 1130, u), y: lerp(640, 650, u), z: lerp(1.45, 1.55, u) };
  setCam(g, cam); tenderSet(g, t, .1 + u * .05);
  const up = ss(seg(t, sh.t0, HIT.hang + .8));
  const pL = [1180, lerp(860, 520, up)], pX = [1060, lerp(880, 740, up)];
  const lj = { ...T_LJ, t, pen: loc(T_LJ, pL), stamp: [30, -140], lensOut: .9, head: K([[HIT.hang + 1, .1], [sh.t1, -.1]], t), lean: -.08 };
  const xy = { ...T_XY, t, armR: { t: loc(T_XY, pX) }, armL: { t: [-60, -40] }, ex: .7, ey: K([[HIT.hang, .3], [HIT.hang + 1, -.6]], t), bulb: .4 };
  laoJiao(g, lj); xiaoYi(g, xy);
  S2.dryingFilm(g, pX, pL, 60 * up + 10, t);
  return ret(cam, [1100, 700], 'amber', .32);
}
export function penHandover(g, t, sh) {
  const cam = { x: 720, y: 540, z: 1 }; setCam(g, cam);
  blurredSet(g, { x: 1150, y: 640, z: 3 }, gg => tenderSet(gg, t), 9); setCam(g, cam);
  const hx = K([[sh.t0, 1500], [HIT.handover - .2, 1230, 'eo'], [HIT.handover + .5, 1230], [sh.t1, 1700, 'ei']], t);
  const gx = K([[sh.t0, 60], [HIT.handover - .2, 300, 'eo']], t);
  const passed = t > HIT.handover;
  S2.gripHand(g, gx, 600, 4.2, .1, K([[HIT.handover - .1, .9], [HIT.handover + .05, .15]], t));
  if (!passed) S2.penHand(g, hx, 560, 4.2, -.08);
  else {
    S2.penHand(g, hx, 560, 4.2, -.08, true);
    g.save(); g.translate(gx + 120, 612); g.rotate(.1); form(g, [[-20, -21], [620, -23], [620, 23], [-20, 21]], { v: .58, line: 2.6, grad: .2 });
    red(g, m => { m.beginPath(); m.moveTo(620, -23); m.lineTo(725, 0); m.lineTo(620, 23); m.closePath(); m.fill(); }, .38); g.restore();
  }
  return ret(cam, [720, 580], 'amber', .32);
}
export function patTwo(g, t, sh) {
  const u = seg(t, sh.t0, sh.t1), cam = { x: lerp(1120, 1140, u), y: lerp(700, 720, u), z: lerp(1.7, 2.1, ss(u)) };
  setCam(g, cam); tenderSet(g, t, .16);
  const xy = { ...T_XY, t };
  xy.squash = K([[HIT.raise - .05, 1], [HIT.raise + .12, .8, 'eo'], [HIT.pat, .8], [HIT.pat + .25, 1.05], [HIT.pat2 + .3, 1]], t);
  xy.blink = K([[HIT.raise - .05, 0], [HIT.raise + .1, 1], [HIT.pat + .2, 1], [HIT.pat + .4, .45], [sh.t1, .45]], t);
  xy.brow = K([[HIT.raise - .05, 0], [HIT.raise + .1, .9], [HIT.pat + .3, .9], [HIT.pat + .6, 0]], t);
  xy.ex = K([[sh.t0, .3], [HIT.raise - .4, .3], [HIT.raise - .2, 1]], t); xy.ey = K([[sh.t0, .7], [HIT.raise - .4, .7], [HIT.raise - .2, -.6]], t);
  xy.bulb = K([[HIT.pat2, .3], [HIT.pat2 + .4, 1]], t);
  xy.ant = Math.sin((t - HIT.pat) * 14) * K([[HIT.pat, 0], [HIT.pat + .1, .5], [HIT.pat2 + 1, 0]], t);
  // 小译 writes with the red pen on a page held up, then lifts it proudly
  const pg = [T_XY.x + 70, GY - 150 * 1.35];
  const w = seg(t, sh.t0 + .1, HIT.raise - .5), pen = [pg[0] - 20 + w * 40 + Math.sin(t * 40) * 6 * (w > 0 && w < 1), pg[1] - 10 + Math.cos(t * 33) * 4 * (w > 0 && w < 1)];
  xy.armL = { t: loc(T_XY, [pg[0] - 40, pg[1] + 20]) }; xy.armR = { t: loc(T_XY, pen) };
  const headTop = [T_XY.x, GY - 140 * 1.35 * (xy.squash ?? 1)];
  const lj = { ...T_LJ, t, lensOut: .4, lean: K([[HIT.raise, 0], [HIT.pat, -.22], [HIT.pat2 + .5, -.18], [sh.t1, -.1]], t), head: K([[sh.t0, .1], [HIT.pat2 + .6, -.1]], t),
    pen: loc(T_LJ, K([[sh.t0, [1240, 800]], [HIT.raise - .3, [1240, 800]], [HIT.raise + .2, [1180, 560], 'eo'], [HIT.pat - .15, [1080, 640], 'eio'], [HIT.pat, [headTop[0] + 30, headTop[1] - 6], 'ei'], [HIT.pat + .2, [headTop[0] + 34, headTop[1] - 30]], [HIT.pat2, [headTop[0] + 30, headTop[1] - 6], 'ei'], [HIT.pat2 + .25, [headTop[0] + 34, headTop[1] - 22]]], t)),
    penTilt: K([[HIT.raise, .5], [HIT.pat - .2, -1.3]], t), stamp: [30, -140], noPen: true };
  laoJiao(g, lj); xiaoYi(g, xy);
  g.save(); g.translate(pg[0], pg[1]); g.rotate(-.1); form(g, [[-34, -44], [34, -44], [34, 44], [-34, 44]], { v: .94, line: 1.6, grad: .05 });
  for (let i = 0; i < 4; i++) stroke(g, [[-24, -28 + i * 14], [22, -28 + i * 14]], 1.2, { taper: 0, alpha: .6 });
  red(g, m => { m.fillRect(-24, 10, 48 * w, 5); m.fillRect(-24, 22, 36 * w, 5); }, .35); g.restore();
  g.save(); g.translate(pen[0], pen[1]); g.rotate(-1.1); form(g, [[-4, -40], [4, -40], [4, 0], [-4, 0]], { v: .58, line: 1.2 }); red(g, m => { m.beginPath(); m.moveTo(-4, 0); m.lineTo(0, 9); m.lineTo(4, 0); m.fill(); }, .38); g.restore();
  return ret(cam, [T_XY.x, GY - 120 * 1.35], 'amber', .32);
}

// ================================================================ DAWN
export function dawnSeal(g, t, sh) {
  const cam = { x: 1150, y: 700, z: 2.0 }; setCam(g, cam);
  const dw = K([[sh.t0, .3], [sh.t1, .45]], t);
  SET.archive(g, { dawn: dw, pile: 1 / 21, done: .98, hours: hoursAt(t), lampOn: .6 });
  const can = [1140, GY - 190];
  const xy = { ...T_XY, x: 1060, t, bulb: K([[HIT.seal, .4], [HIT.seal + .2, 1]], t), ex: .8, ey: -.2, squash: K([[HIT.seal - .3, 1], [HIT.seal - .1, 1.05], [HIT.seal, .9, 'eo'], [HIT.seal + .3, 1]], t) };
  const stampW = K([[sh.t0, [1080, GY - 120]], [HIT.seal - .3, [can[0], can[1] - 70], 'eio'], [HIT.seal, [can[0], can[1] - 20], 'ei'], [HIT.seal + .3, [can[0] - 10, can[1] - 90], 'eo'], [sh.t1, [1070, GY - 160]]], t);
  xy.armR = { t: loc(xy, stampW) }; xy.armL = { t: [-60, -40] };
  const lj = { ...T_LJ, x: 1290, t, lensOut: K([[HIT.seal, .4], [HIT.seal + .3, 1.2, 'back']], t), glint: K([[HIT.seal + .2, 0], [HIT.seal + .3, 1], [HIT.seal + .8, 0]], t), head: .15,
    pen: loc(T_LJ, [can[0] + 40, can[1] + 6]), stamp: [30, -140] };
  laoJiao(g, lj);
  SET.can(g, can[0], can[1], 34, .62, { label: true });
  g.save(); g.fillStyle = grey(.12); g.font = '700 14px "Old Standard TT"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('No. 1000', can[0], can[1] - 16); g.restore();
  if (t > HIT.seal) {
    const k = 1 + .3 * (1 - seg(t, HIT.seal, HIT.seal + .15));
    red(g, m => { m.save(); m.translate(can[0], can[1] + 8); m.scale(k, k); m.rotate(-.08); m.fillRect(-15, -15, 30, 30); m.globalCompositeOperation = 'destination-out'; m.font = '900 13px "Noto Serif SC"'; m.textAlign = 'center'; m.textBaseline = 'middle'; m.fillText('译', 0, -6); m.fillText('毕', 0, 7); m.restore(); }, .35,
      () => { g.save(); g.translate(can[0], can[1] + 8); g.scale(k, k); g.rotate(-.08); g.fillRect(-15, -15, 30, 30); g.fillStyle = grey(.9); g.font = '900 13px "Noto Serif SC"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('译', 0, -6); g.fillText('毕', 0, 7); g.restore(); });
  }
  xiaoYi(g, xy);
  g.save(); g.translate(stampW[0], stampW[1]); form(g, [[-8, -26], [8, -26], [8, -6], [-8, -6]], { v: .5, line: 1.2 }); form(g, [[-14, -6], [14, -6], [14, 6], [-14, 6]], { v: .2, line: 1.4 }); red(g, m => m.fillRect(-14, 4, 28, 3), .3); g.restore();
  return ret(cam, can, 'gold', .4);
}
export function dawnLift(g, t, sh) {
  const cam = { x: 1100, y: 640, z: 1.6 }; setCam(g, cam);
  const slot = SET.slotPos();
  const fill = K([[HIT.slot - .3, 0], [HIT.slot, 1, 'eo']], t);
  SET.archive(g, { dawn: K([[sh.t0, .45], [sh.t1, .6]], t), pile: 1 / 21, done: .98, hours: hoursAt(t), lampOn: .5, slotFill: fill });
  const s = XS, gy = K([[HIT.hoist - .2, GY], [HIT.hoist + .8, slot[1] + 190 * s - 40, 'eio']], t);
  const xy = { x: K([[HIT.hoist - .2, 1150], [HIT.hoist + .8, slot[0] + 6, 'eio']], t), y: gy, s, t, roll: 0, shadow: 0 };
  const canHeld = t < HIT.slot - .3;
  const cw = canHeld ? [xy.x, gy - 175 * s] : null;
  if (cw) { xy.armL = { t: loc(xy, [cw[0] - 30, cw[1] + 6]) }; xy.armR = { t: loc(xy, [cw[0] + 30, cw[1] + 6]) }; }
  else { xy.armL = { t: loc(xy, [slot[0] - 20, slot[1] + 10]) }; xy.armR = { t: loc(xy, [slot[0] + 20, slot[1] + 10]) }; }
  xy.ex = K([[sh.t0, 0], [HIT.hoist, -.3], [HIT.slot + .3, -.6]], t); xy.ey = K([[sh.t0, -.8], [HIT.slot, -.4]], t);
  xy.bulb = K([[HIT.slot, .5], [HIT.slot + .2, 1]], t); xy.ant = Math.sin(t * 10) * K([[HIT.slot, 0], [HIT.slot + .1, .7], [HIT.slot + 1.2, 0]], t);
  const lj = { x: 1310, y: GY, s: LS, t, dir: -1, lean: K([[HIT.hoist - .5, -.15], [HIT.hoist + .8, .02]], t), lensOut: .3, head: K([[HIT.hoist, 0], [HIT.slot, -.2]], t) };
  const hub = [xy.x + 4, gy - 18 * s], side = [xy.x + 52 * s, gy - 90 * s];
  const lifting = K([[sh.t0, 0], [HIT.hoist - .2, 1]], t);
  lj.stamp = loc(lj, [lerp(1250, side[0] + 4, lifting), lerp(760, side[1], lifting)]);
  lj.pen = loc(lj, [lerp(1250, hub[0] + 16, lifting), lerp(800, hub[1] + 6, lifting)]);
  laoJiao(g, lj); xiaoYi(g, xy);
  if (cw) { SET.can(g, cw[0], cw[1], 30, .6); red(g, m => m.fillRect(cw[0] - 12, cw[1] - 12, 24, 24), .35); }
  return ret(cam, [xy.x, gy - 90 * s], 'gold', .45);
}
export function dawnWide(g, t, sh) {
  const pb = ss(seg(t, sh.t0, lampAt(5)));
  const cam = { x: lerp(1020, 720, pb), y: lerp(600, 540, pb), z: lerp(1.35, 1, pb) }; setCam(g, cam);
  const lit = []; for (let i = 0; i < LAMP_ROWS; i++) lit.push(K([[lampAt(i), 0], [lampAt(i) + .12, 1, 'eo']], t));
  const dw = K([[sh.t0, .6], [lampAt(LAMP_ROWS - 1) + .5, 1]], t);
  SET.archive(g, { dawn: dw, lit, hours: hoursAt(t), pile: 1 / 21, done: .98, lampOn: K([[HIT.lamps, .5], [lampAt(7), 0]], t), slotFill: 1 });
  // dust motes in the beam
  for (let i = 0; i < 40; i++) { const x = 760 + hash(i) * 380 + Math.sin(t * .7 + i) * 20, y = 450 + ((hash(i + 3) * 500 + t * 12 * (hash(i + 5) - .3)) % 500); form(g, ellipsePts(x, y, 1.6, 1.6, 0, 6), { v: 1, line: 0 }); }
  const s = XS, gy = K([[sh.t0, SET.slotPos()[1] + 190 * s - 40], [sh.t0 + 1.2, GY, 'eio']], t);
  const xy = { x: K([[sh.t0, SET.slotPos()[0] + 6], [sh.t0 + 1.2, 1150, 'eio']], t), y: gy, s, t, ex: K([[HIT.lamps, -.8], [lampAt(4), .6], [lampAt(7) + .6, 0]], t), ey: K([[HIT.lamps, -.6], [lampAt(7) + .6, 0]], t),
    bulb: 1, ant: Math.sin(t * 6) * .3, armL: { t: [-62, -40] }, armR: { t: [62, -40] } };
  const lj = { x: 1310, y: GY, s: LS, t, dir: -1, lean: K([[sh.t0, .02], [sh.t0 + 1.2, -.1], [SEC.DAWN.t1, 0]], t), lensOut: .3, glint: K([[lampAt(7), 0], [lampAt(7) + .1, 1], [lampAt(7) + .5, 0]], t), head: K([[lampAt(2), 0], [lampAt(5), -.18], [lampAt(7) + .6, 0]], t) };
  laoJiao(g, lj); xiaoYi(g, xy);
  return ret(cam, [xy.x, gy - 90 * s], 'gold', .5);
}
