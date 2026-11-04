// The shots: one painter per section, f(g, t) with t = film time (already hand-crank sampled). Each returns the
// camera it used (so the iris and the burn track subjects through toFilm()). Every motion is an eased keyframe track.
import { xiaoYi, laoJiao } from './robots.js';
import * as SET from './sets.js';
import { form, ellipsePts, stroke, grey, S as IS } from './engine/ink.js';
import { HIT, SEC, at, LAMP_ROWS, lampAt } from './timeline.js';
import { K, clamp, lerp, ss, eo, ei, seg, hash, camApply, toFilm } from './lib.js';
import { red } from './mask.js';
import { PAGE_EN, PAGE_BAD, PAGE_FIX } from './cardspecs.js';

const XY_S = 1.2, LJ_S = 1.15, GY = 925;                       // robot scales and ground line in the archive
const loc = (st, p) => [(p[0] - st.x) / (st.s ?? 1), (p[1] - st.y) / (st.s ?? 1)];
const B = n => SEC[n].beat;

// ---------------------------------------------------------------- clock / pile / done across the night
export function hoursAt(t) {
  return K([[0, 11.97], [HIT.bell - .05, 11.99], [HIT.bell, 12.0, 'snap'], [HIT.hurry, 12.3], [HIT.jam, 17.4], [SEC.HURRY.t1, 17.55], [HIT.dawn, 17.95], [HIT.lamps, 18.0]], t);
}
const pileAt = t => K([[0, 1], [HIT.can1, 1], [HIT.can1 + .3, 20 / 21, 'snap'], [HIT.hurry, 19 / 21], [HIT.jam, 1 / 21], [99, 1 / 21]], t);
const doneAt = t => K([[0, .1], [HIT.stamp1 + .4, .14], [HIT.hurry, .16], [HIT.jam, .95]], t);

// ---------------------------------------------------------------- NIGHT: the archive at midnight (extreme wide)
export function night(g, t) {
  const cam = { x: 720, y: 540, z: 1 }; camApply(g, cam);
  SET.archive(g, { hours: hoursAt(t), pile: 1, done: .1, lampOn: 1 });
  const x = K([[0, 120], [HIT.rollIn, 120], [HIT.park, 548, 'eio']], t);
  const xy = { x, y: GY, s: XY_S, roll: (x - 120) / (18 * XY_S), tilt: K([[HIT.rollIn, 0], [HIT.rollIn + .4, .14], [HIT.park - .5, .1], [HIT.park, -.08], [HIT.park + .4, 0]], t),
    blink: K([[0, 1], [HIT.irisOpen + .9, 1], [HIT.irisOpen + 1.1, 0]], t), ex: K([[HIT.park, 0], [HIT.lens + .2, 1], [HIT.bell, 1], [HIT.bell + .4, 0]], t), ey: K([[HIT.lens + .2, 0], [HIT.bell - .3, -1], [HIT.bell + .6, 0]], t),
    ant: Math.sin(t * 9) * K([[HIT.rollIn, 0], [HIT.rollIn + .3, .6], [HIT.park, .6], [HIT.park + .8, 0]], t), bulb: K([[HIT.irisOpen + 1, 0], [HIT.irisOpen + 1.2, 1], [HIT.irisOpen + 1.6, 0]], t) };
  const lj = { x: 990, y: GY, s: LJ_S, dir: -1, lean: K([[HIT.lens - .4, .05], [HIT.lens, -.08]], t), head: K([[HIT.lens - .3, .3], [HIT.lens, 0]], t),
    lensOut: K([[HIT.lens - .2, 0], [HIT.lens + .2, .5], [HIT.bell, .5], [HIT.bell + .5, 0]], t), glint: K([[HIT.lens, 0], [HIT.lens + .1, 1], [HIT.lens + .6, 0]], t) };
  laoJiao(g, lj); xiaoYi(g, xy);
  return { cam, focus: toFilm(cam, [xy.x, xy.y - 90 * XY_S]) };
}

// ---------------------------------------------------------------- WORK + HURRY: the desk full shot
export const DESK_CAM = { x: 700, y: 680, z: 1.9 };
// one work cycle: grab a can → thread → type → page up the tube → Lao Jiao reads → stamp (or reject)
// c0 = cycle start, b = beat length, n = cycle beats (WORK: 15 beats, one tick + one reject; HURRY: 4 beats per cycle)
function cycleHurry(t) {
  const b = B('HURRY'), t0 = HIT.hurry, cyc = 4 * b, k = Math.floor((t - t0) / cyc), u = (t - t0) / cyc - k;
  return { k, u, c0: t0 + k * cyc, b, cyc };
}
export function desk(g, t, sec) {
  const hurry = sec === 'HURRY';
  let cam = { ...DESK_CAM };
  if (hurry) {                                                    // slow push-in on the jam
    const p = ss(seg(t, HIT.jam - .4, HIT.silence1));
    cam = { x: lerp(700, 650, p), y: lerp(680, 750, p), z: lerp(1.9, 2.7, p) };
  }
  IS.lineScale = 1 / Math.sqrt(cam.z);
  camApply(g, cam);
  const jam = hurry ? K([[HIT.jam - .05, 0], [HIT.jam + .25, 1]], t) : 0;
  const smokeAmt = hurry ? K([[HIT.smoke - .2, 0], [HIT.smoke + .5, .8], [HIT.silence1, 1]], t) : 0;
  const o = { hours: hoursAt(t), pile: pileAt(t), done: doneAt(t), lampOn: 1, jam, viewerSpin: 0, typing: 0, paper: 0, viewerLight: 0 };

  // --- Xiao Yi's hands (world targets), page and can positions
  const xy = { x: 548, y: GY, s: XY_S, roll: 0 };
  const top = SET.pileTop(o.pile), spool = [SET.VIEWER.x - 22, SET.VIEWER.y - 26], keys = [728, 812], inlet = [762, 804];
  const rest = { L: [xy.x - 62, GY - 70], R: [xy.x + 62, GY - 70] };
  let hL = rest.L, hR = rest.R, canP = null, sheet = null, ball = null, tick = false, mark = false, lectern = null;
  let lj = { x: 990, y: GY, s: LJ_S, dir: -1, lean: 0, head: 0, lensOut: 0 };
  let ljPen = [-60, -120], ljStamp = [30, -140];
  const W = HIT.work;

  if (!hurry) {
    // grab (can1) → thread (thread)
    hL = K([[W, rest.L], [HIT.can1 - .25, top, 'eio'], [HIT.can1 + .05, top], [HIT.thread, spool, 'eio'], [HIT.thread + .3, rest.L]], t);
    if (t > HIT.can1 && t < HIT.thread + .05) canP = hL;
    o.viewerSpin = Math.max(0, t - HIT.thread) * 9;
    o.viewerLight = clamp((t - HIT.thread) * 4) * (t < SEC.WORK.t1 ? 1 : 0);
    // typing: right hand hops between keys on sixteenths, then tears the page and posts it up the tube
    const typeBlock = (a, b) => { if (t >= a && t < b) { const i = Math.floor((t - a) / (B('WORK') / 2)); hR = [keys[0] - 30 + (i % 4) * 14, 822 - ((t - a) / (B('WORK') / 2) % 1 < .5 ? 6 : 0)]; hL = [keys[0] - 44 + (i % 3) * 12, 826]; o.typing = i + 1; } };
    typeBlock(HIT.type0, HIT.type1);
    typeBlock(HIT.tube1 + .25, HIT.tube2 - .45);
    o.paper = clamp(K([[HIT.type0, 0], [HIT.type1, 1], [HIT.ding, 1], [HIT.ding + .05, 0, 'snap'], [HIT.tube1 + .25, 0], [HIT.tube2 - .45, 1], [HIT.tube2 - .4, 0, 'snap']], t));
    if (t >= HIT.type1 && t < HIT.tube1 + .25) hR = K([[HIT.type1, [740, 790]], [HIT.ding, [728, 772], 'eio'], [HIT.tube1, inlet, 'eio'], [HIT.tube1 + .25, rest.R]], t);
    if (t >= HIT.tube2 - .45 && t < HIT.tube2 + .3) hR = K([[HIT.tube2 - .45, [728, 772]], [HIT.tube2, inlet, 'eio'], [HIT.tube2 + .3, rest.R]], t);
    if (t >= HIT.ding && t < HIT.tube1) sheet = { p: hR, a: 0 };
    if (t >= HIT.tube2 - .4 && t < HIT.tube2) sheet = { p: hR, a: 0 };
    // page 1: out of the tube onto the lectern, read, stamped ✓, to the basket
    const outP = SET.TUBE_OUT, lec = [892, 706], bas = [SET.BASKET.x, SET.BASKET.y - 60];
    if (t >= HIT.tube1 + .2 && t < HIT.stamp1 + .45) lectern = { p: K([[HIT.tube1 + .2, outP], [HIT.tube1 + .4, lec, 'eo']], t), a: -.15, tick: t > HIT.stamp1 };
    if (t >= HIT.stamp1 + .15 && t < HIT.stamp1 + .45) lectern = { p: K([[HIT.stamp1 + .15, lec], [HIT.stamp1 + .45, bas, 'ei']], t), a: (t - HIT.stamp1) * 9, tick: true };
    // page 2: read, recoil, scribble, crumple, throw → bonk
    if (t >= HIT.tube2 + .2 && t < HIT.throw) lectern = { p: K([[HIT.tube2 + .2, outP], [HIT.tube2 + .4, lec, 'eo']], t), a: -.15, mark: t > HIT.scrib + .1 };
    const head = [xy.x, GY - 150 * XY_S];
    if (t >= HIT.throw && t < HIT.bonk) {
      const u = seg(t, HIT.throw, HIT.bonk), p0 = [900, 650];
      ball = [lerp(p0[0], head[0], u), lerp(p0[1], head[1], u) - Math.sin(u * Math.PI) * 120];
    }
    if (t >= HIT.bonk && t < HIT.bonk + .9) {                     // the ball bounces off the head onto the floor
      const u = seg(t, HIT.bonk, HIT.bonk + .9);
      ball = [head[0] - 150 * u, head[1] - Math.sin(Math.min(1, u * 1.6) * Math.PI) * 70 + ei(u) * 120 + u * 50];
      if (u > .62) ball[1] = Math.min(ball[1], GY + 14);
    }
    if (t >= HIT.bonk + .9) ball = [head[0] - 150, GY + 14];
    // Lao Jiao: read (lean, lens out), stamp, read, recoil (snap), scribble, crumple, throw
    lj.lean = K([[W, 0], [HIT.tube1 + .3, -.16], [HIT.stamp1 + .3, -.16], [HIT.stamp1 + .5, 0], [HIT.tube2 + .3, -.18], [HIT.recoil - .05, -.2], [HIT.recoil + .04, .14, 'eo'], [HIT.recoil + .4, .05], [HIT.throw - .1, .06], [HIT.throw + .1, -.1], [HIT.throw + .5, 0]], t);
    lj.lensOut = K([[W, 0], [HIT.tube1 + .3, .9], [HIT.stamp1 + .4, .9], [HIT.stamp1 + .6, .2], [HIT.tube2 + .3, .9], [HIT.recoil, 1], [HIT.recoil + .05, 0, 'eo'], [HIT.throw + .5, .2]], t);
    lj.head = K([[HIT.recoil - .05, -.05], [HIT.recoil + .04, .22, 'eo'], [HIT.recoil + .5, .05]], t);
    lj.glint = K([[HIT.recoil - .02, 0], [HIT.recoil + .06, 1], [HIT.recoil + .4, 0]], t);
    const lecL = loc(lj, lec);
    ljStamp = K([[W, [30, -140]], [HIT.stamp1 - .3, [lecL[0] + 10, lecL[1] - 60], 'eio'], [HIT.stamp1, [lecL[0] + 4, lecL[1] - 22], 'ei'], [HIT.stamp1 + .2, [lecL[0] + 10, lecL[1] - 70]], [HIT.stamp1 + .6, [30, -140]]], t);
    ljPen = K([[W, [-60, -120]], [HIT.scrib - .15, [lecL[0] + 20, lecL[1] - 40], 'eio'], [HIT.throw - .1, [lecL[0] + 24, lecL[1] - 34]], [HIT.throw - .02, [lecL[0] + 70, lecL[1] - 110], 'eo'], [HIT.throw + .12, [-90, -170], 'eo'], [HIT.throw + .6, [-60, -120]]], t);
    if (t > HIT.scrib && t < HIT.throw - .1) { const w = Math.sin((t - HIT.scrib) * 60) * 10; ljPen = [lecL[0] + 20 + w, lecL[1] - 38 + Math.cos((t - HIT.scrib) * 47) * 5]; }
    // Xiao Yi: bonk (squash, tilt, eyes cross, antenna wobble) → looks at us
    xy.squash = K([[HIT.bonk - .01, 1], [HIT.bonk + .06, .78, 'eo'], [HIT.bonk + .35, 1.06], [HIT.bonk + .6, 1]], t);
    xy.tilt = K([[HIT.bonk - .01, 0], [HIT.bonk + .08, -.12], [HIT.bonk + .5, 0]], t);
    xy.ant = Math.sin((t - HIT.bonk) * 26) * K([[HIT.bonk, 0], [HIT.bonk + .05, 1.4], [HIT.bonk + 1.3, 0]], t);
    xy.brow = K([[HIT.bonk, 0], [HIT.bonk + .1, -1], [HIT.look, -.4], [HIT.look + .5, 0]], t);
    xy.ex = K([[W, 0], [HIT.can1 - .3, -1], [HIT.can1 + .1, -1], [HIT.thread, .6], [HIT.type0, .6], [HIT.tube1, 1], [HIT.tube1 + .3, 1], [HIT.tube2 + .2, 1], [HIT.bonk, 1], [HIT.bonk + .1, 0, 'snap']], t);
    xy.ey = K([[W, 0], [HIT.can1 - .3, .4], [HIT.thread, .6], [HIT.type1, .6], [HIT.tube1, -.6], [HIT.tube2 + .2, -.6], [HIT.bonk, -1], [HIT.bonk + .1, 0, 'snap']], t);
    xy.blink = K([[HIT.look + .45, 0], [HIT.look + .52, 1], [HIT.look + .62, 0]], t);
  } else {
    // ---- HURRY: four fast cycles, the clock spinning; cycle 2 is rejected — Xiao Yi ducks this time
    const { k, u, c0, b, cyc } = cycleHurry(Math.min(t, HIT.jam - .001));
    const live = t < HIT.jam;
    const T0 = c0, gr = c0 + .5 * b, th = c0 + 1 * b, ty0 = c0 + 1.25 * b, ty1 = c0 + 2.5 * b, tu = c0 + 3 * b;
    const topK = SET.pileTop(pileAt(c0));
    if (live) {
      hL = K([[T0, rest.L], [gr - .05, topK, 'eio'], [gr + .02, topK], [th, spool, 'eio'], [th + .12, rest.L]], t);
      if (t > gr && t < th) canP = hL;
      if (t >= ty0 && t < ty1) { const i = Math.floor((t - ty0) / (b / 4)); hR = [keys[0] - 30 + (i % 4) * 14, 822 - (((t - ty0) / (b / 4)) % 1 < .5 ? 6 : 0)]; hL = [keys[0] - 44 + (i % 3) * 12, 826]; o.typing = i + 1; }
      o.paper = clamp(seg(t, ty0, ty1));
      if (t >= ty1 && t < tu + .15) { hR = K([[ty1, [728, 772]], [tu, inlet, 'eio'], [tu + .15, rest.R]], t); if (t < tu) sheet = { p: hR, a: 0 }; o.paper = t < ty1 + .05 ? 1 : 0; }
      // the previous cycle's page arrives at Lao Jiao during this cycle's first half
      const pr = c0 - cyc + 3 * b, lec = [892, 706];
      if (k >= 1 && t < c0 + 1.6 * b) {
        const reject = k - 1 === 1;
        const st = c0 + 1.0 * b;
        if (!reject) {
          lectern = { p: K([[c0, SET.TUBE_OUT], [c0 + .3 * b, lec, 'eo'], [st + .05, lec], [st + .5 * b, [SET.BASKET.x, SET.BASKET.y - 60], 'ei']], t), a: t > st ? (t - st) * 9 : -.15, tick: t > st };
          const L2 = loc(lj, lec);
          ljStamp = K([[c0, [30, -140]], [st - .2, [L2[0] + 10, L2[1] - 60]], [st, [L2[0] + 4, L2[1] - 22], 'ei'], [st + .25, [30, -140]]], t);
        } else {
          // rejected: scribble, crumple, throw … Xiao Yi ducks, the ball sails over and hits the pile
          const L2 = loc(lj, lec), thr = c0 + 1.1 * b, land = thr + .55;
          if (t < thr) lectern = { p: K([[c0, SET.TUBE_OUT], [c0 + .3 * b, lec, 'eo']], t), a: -.15, mark: t > c0 + .6 * b };
          ljPen = K([[c0 + .4 * b, [-60, -120]], [c0 + .6 * b, [L2[0] + 20, L2[1] - 38]], [thr - .03, [L2[0] + 22, L2[1] - 36]], [thr + .05, [L2[0] + 70, L2[1] - 110], 'eo'], [thr + .3, [-60, -120]]], t);
          if (t > c0 + .6 * b && t < thr - .03) ljPen = [L2[0] + 20 + Math.sin(t * 70) * 10, L2[1] - 38];
          if (t >= thr && t < land + .3) { const v = seg(t, thr, land); ball = [lerp(900, 420, v), lerp(650, 760, v) - Math.sin(v * Math.PI) * 140]; if (t > land) ball = [420 - (t - land) * 200, 760 + (t - land) * 300]; }
          xy.squash = K([[thr - .05, 1], [thr + .08, .72, 'eo'], [land, .72], [land + .15, 1.05], [land + .3, 1]], t);
          xy.brow = K([[thr, 0], [thr + .1, .8], [land + .3, 0]], t);
        }
        lj.lean = K([[c0, 0], [c0 + .3 * b, -.16], [st + .1, -.16], [st + .4 * b, 0]], t);
        lj.lensOut = K([[c0, .1], [c0 + .3 * b, .9], [st + .2, .9], [st + .5 * b, .1]], t);
      }
      o.viewerSpin = (t - HIT.hurry) * 14;
      o.viewerLight = 1;
      xy.ex = K([[T0, 0], [gr - .1, -1], [gr + .05, -1], [th, .6], [ty1, .6], [tu, 1], [tu + .2, 0]], t);
      xy.ey = K([[T0, 0], [gr - .1, .4], [th, .6], [ty1, .6], [tu, -.5], [tu + .2, 0]], t);
    } else {
      // the jam: both hands on the viewer, shake it, smoke, freeze, look at us
      const vw = [SET.VIEWER.x, SET.VIEWER.y + 4];
      const sh = t > HIT.shake && t < HIT.smoke ? Math.sin((t - HIT.shake) * 50) * 9 : 0;
      hL = K([[HIT.jam, rest.L], [HIT.jam + .25, [vw[0] - 34 + sh, vw[1]]], [HIT.smoke + .3, [vw[0] - 34, vw[1]]], [HIT.smoke + .5, [vw[0] - 70, vw[1] - 40], 'eo']], t);
      hR = K([[HIT.jam, rest.R], [HIT.jam + .25, [vw[0] + 34 + sh, vw[1]]], [HIT.smoke + .3, [vw[0] + 34, vw[1]]], [HIT.smoke + .5, [vw[0] + 60, vw[1] - 50], 'eo']], t);
      if (t > HIT.smoke + .3) { hL = [hL[0], hL[1]]; }
      o.viewerSpin = (HIT.jam - HIT.hurry) * 14 + K([[HIT.jam, 0], [HIT.jam + .3, .4]], t);
      o.viewerLight = K([[HIT.jam, 1], [HIT.jam + .2, .2], [HIT.shake, .8], [HIT.smoke, .1]], t);
      xy.ex = K([[HIT.jam, .6], [HIT.smoke + .2, .6], [HIT.smoke + .4, 0, 'snap']], t);
      xy.ey = K([[HIT.jam, .6], [HIT.smoke + .2, .6], [HIT.smoke + .4, 0, 'snap']], t);
      xy.brow = K([[HIT.jam, 0], [HIT.jam + .2, .6], [HIT.smoke + .3, 1]], t);
      xy.lean = sh * .6;
      xy.squash = K([[HIT.smoke + .3, 1], [HIT.smoke + .38, 1.12, 'eo'], [HIT.smoke + .7, 1]], t);
      xy.bulb = (Math.floor(t * 8) % 2) * K([[HIT.smoke, 0], [HIT.smoke + .1, 1]], t);
      lj.lean = K([[HIT.smoke, 0], [HIT.smoke + .5, -.12]], t);
      lj.lensOut = K([[HIT.smoke, 0], [HIT.smoke + .3, 1], [HIT.silence1, 1]], t);
      lj.glint = K([[HIT.smoke + .3, 0], [HIT.smoke + .4, 1], [HIT.smoke + .8, 0]], t);
    }
  }
  xy.armL = { t: loc(xy, hL), open: canP ? .5 : .3 };
  xy.armR = { t: loc(xy, hR), open: .3 };
  lj.pen = ljPen; lj.stamp = ljStamp;

  SET.archive(g, o);
  laoJiao(g, lj);
  if (lectern) SET.page(g, lectern.p[0], lectern.p[1], lectern.a, { tick: lectern.tick, mark: lectern.mark });
  if (sheet) SET.page(g, sheet.p[0], sheet.p[1] - 14, sheet.a, {});
  xiaoYi(g, xy);
  if (canP) SET.can(g, canP[0], canP[1], 21, .55);
  if (ball) SET.page(g, ball[0], ball[1], t * 8, { ball: true, mark: true });
  if (smokeAmt > 0) SET.smoke(g, SET.VIEWER.x, SET.VIEWER.y - 10, smokeAmt, t, { n: 9, rise: 220, s: 1.2, v: .8 });
  IS.lineScale = 1;
  return { cam, focus: toFilm(cam, [xy.x, GY - 95 * XY_S]) };
}

// ---------------------------------------------------------------- PAGE: the returned page (insert)
export function pageShot(g, t) {
  const cam = { x: 720, y: 540, z: 1 }; camApply(g, cam);
  SET.pageInsert(g, { strike: seg(t, HIT.strike, HIT.strike + .35), fix: seg(t, HIT.fix, HIT.fix + .9) }, { en: PAGE_EN, bad: PAGE_BAD, fix: PAGE_FIX });
  return { cam, focus: [720, 560] };
}

// ---------------------------------------------------------------- DASH: tracking down the aisle
export function dash(g, t) {
  const u = t - HIT.dash, x = 200 + u * 760;
  const cam = { x: x + 160, y: 700, z: 1.25 };
  camApply(g, cam);
  const x0 = cam.x - 720 / cam.z - 50, x1 = cam.x + 720 / cam.z + 50;
  SET.aisleBack(g, x0, x1);
  const s = 1.45, xy = { x, y: GY, s, roll: x / (18 * s), tilt: .22 + Math.sin(t * 22) * .03, ant: Math.sin(t * 30) * .8, brow: 1, ex: .8, ey: -.6,
    squash: 1 + Math.sin(t * 22) * .03 };
  const canW = [x - 10, GY - 205 * s];
  xy.armL = { t: loc(xy, [canW[0] - 26, canW[1] + 8]) }; xy.armR = { t: loc(xy, [canW[0] + 26, canW[1] + 8]) };
  SET.smoke(g, canW[0], canW[1] - 10, 1, t, { n: 10, rise: 120, drift: -6, s: 1.3, speed: 1.4 });
  xiaoYi(g, xy);
  SET.can(g, canW[0], canW[1], 30, .5);
  // foreground uprights rush past with parallax 1.7 (nearer than the robot)
  g.setTransform(cam.z * 1.7, 0, 0, cam.z * 1.7, 720 - cam.x * cam.z * 1.7, 540 - 700 * cam.z * 1.7 + 200);
  SET.aisleFront(g, cam.x - 900, cam.x + 900);
  return { cam, focus: toFilm(cam, canW) };
}

// ---------------------------------------------------------------- CATCH + TENDER: the end of the aisle
const BUCKET_STAND = [1045, 790];
const CY = 905;                                                  // ground line at the end of the aisle
const CATCH_P = [1000, 630];
export function canArc(t) {                                      // the can's flight, in silence
  const u = seg(t, HIT.launch, HIT.catch), p0 = [700, 640];
  return [lerp(p0[0], CATCH_P[0], u), lerp(p0[1], CATCH_P[1], u) - Math.sin(u * Math.PI) * 470 * (1 - u * .1)];
}
export function catchShot(g, t) {
  const cam = { x: 720, y: 520, z: 1 }; camApply(g, cam);
  SET.aisleEnd(g, {});
  const s = 1.4;
  // Xiao Yi: dash in → trip on the strip → face-down slide → lies still → pops upright
  const x = K([[HIT.catchSec, -120, 'lin'], [HIT.trip, 600, 'lin'], [HIT.trip + .5, 760, 'eo']], t);
  const tilt = K([[HIT.trip, .22], [HIT.launch, .7, 'ei'], [HIT.trip + .5, 1.42, 'eo'], [HIT.heal + .5, 1.42], [HIT.heal + .75, -.15, 'eo'], [HIT.heal + 1.0, 0]], t);
  const xy = { x, y: CY, s, roll: x / (18 * s), tilt, ant: Math.sin(t * 28) * K([[HIT.trip, .8], [HIT.trip + .6, .3], [HIT.heal + .6, .3], [HIT.heal + .8, 1], [HIT.heal + 1.6, 0]], t),
    brow: K([[HIT.catchSec, 1], [HIT.trip, 1], [HIT.trip + .1, -1], [HIT.heal + .6, -1], [HIT.heal + .9, 0]], t), blink: K([[HIT.trip + .5, 0], [HIT.trip + .6, 1], [HIT.heal + .5, 1], [HIT.heal + .7, 0]], t),
    ex: K([[HIT.heal + .8, 0], [HIT.heal + 1.1, 1]], t), squash: K([[HIT.heal + .7, 1], [HIT.heal + .8, .85], [HIT.heal + 1, 1]], t) };
  const holding = t < HIT.launch;
  const canW = holding ? [x - 10 + 60 * tilt, CY - 205 * s + 90 * tilt] : canArc(t);
  if (holding) { xy.armL = { t: [-26, -205 + 8] }; xy.armR = { t: [26, -205 + 8] }; }
  else xy.armL = xy.armR = { t: null };
  // Lao Jiao glides in, scoops the bucket, holds it up; the can drops in
  const lx = K([[HIT.launch, 1600], [HIT.launch + .55, 1150, 'eo']], t);
  const bk = K([[HIT.launch + .55, BUCKET_STAND], [HIT.catch - .12, CATCH_P, 'eio'], [HIT.catch + .1, [CATCH_P[0], CATCH_P[1] + 26], 'eo'], [HIT.catch + .5, CATCH_P], [HIT.heal + 1.3, CATCH_P], [HIT.heal + 1.8, [1000, 812]]], t);
  const lj = { x: lx, y: CY - 5, s: 1.4, dir: -1, lean: K([[HIT.launch + .3, .25], [HIT.launch + .55, -.12], [HIT.catch, -.05]], t), lensOut: K([[HIT.launch + .5, 0], [HIT.launch + .8, 1]], t),
    head: K([[HIT.launch + .55, -.3], [HIT.catch - .2, -.35], [HIT.catch + .3, 0]], t) };
  lj.pen = loc(lj, [bk[0] + 52, bk[1] + 4]); lj.stamp = loc(lj, [bk[0] + 30, bk[1] + 30]);
  laoJiao(g, lj);
  SET.bucket(g, bk[0], bk[1], { water: true });
  if (t < HIT.catch) SET.can(g, canW[0], canW[1], 30, .5);
  if (t < HIT.catch) SET.smoke(g, canW[0], canW[1] - 10, 1, t, { n: 10, rise: 110, drift: holding ? -5 : -2, s: 1.3, speed: 1.3 });
  // steam out of the bucket after the catch
  SET.smoke(g, bk[0], bk[1] - 10, K([[HIT.catch, 0], [HIT.catch + .1, 1.4], [HIT.heal + 1.5, .2]], t), t, { n: 14, rise: 330, s: 2.2, v: .92, speed: .7 });
  xiaoYi(g, xy);
  // a splash crown at the catch
  const sp = seg(t, HIT.catch, HIT.catch + .35);
  if (sp > 0 && sp < 1) for (let i = 0; i < 9; i++) { const a = -Math.PI * (.1 + .8 * i / 8), r = 30 + sp * 70; form(g, ellipsePts(bk[0] + Math.cos(a) * r, bk[1] + Math.sin(a) * r * 1.3 - sp * 20, 6 * (1 - sp) + 2, 9 * (1 - sp) + 2, a, 10), { v: .95, line: 1.2 }); }
  return { cam, focus: toFilm(cam, t < HIT.catch ? canW : bk) };
}

export function tender(g, t) {
  const p = ss(seg(t, HIT.tender, SEC.TENDER.t1));
  const cam = { x: lerp(905, 935, p), y: lerp(640, 680, p), z: lerp(1.2, 1.62, p) };
  IS.lineScale = 1 / Math.sqrt(cam.z);
  camApply(g, cam);
  SET.aisleEnd(g, { strip: false, dawn: K([[HIT.tender, 0], [SEC.TENDER.t1, .12]], t) });
  const bk = [1000, 812];
  const s = 1.4, xy = { x: 840, y: GY + 20, s, roll: 0 };
  const lj = { x: 1180, y: GY + 10, s: 1.4, dir: -1, lean: K([[HIT.raise, 0], [HIT.pat, -.22], [HIT.pat2 + .5, -.18], [SEC.TENDER.t1, -.1]], t), lensOut: .3, head: K([[HIT.glance, 0], [HIT.glance + .4, .12]], t) };
  // lift: the dripping can out of the bucket, up in front of the face
  const canW = K([[HIT.tender, [bk[0] - 10, bk[1] + 20]], [HIT.lift - .3, [bk[0] - 10, bk[1] + 20]], [HIT.lift + .4, [bk[0] - 30, bk[1] - 70], 'eo'], [HIT.glance - .3, [bk[0] - 70, bk[1] - 90], 'eio'], [HIT.raise, [bk[0] - 90, bk[1] - 100]]], t);
  xy.armR = { t: loc(xy, [canW[0] - 26, canW[1] + 18]) };
  xy.armL = { t: loc(xy, K([[HIT.tender, [xy.x - 62, GY - 70]], [HIT.lift + .3, [xy.x - 62, GY - 70]], [HIT.glance - .3, [canW[0] - 70, canW[1] + 24]]], t)) };
  // the flinch (remembering the bonk), then the pat
  xy.squash = K([[HIT.raise - .05, 1], [HIT.raise + .12, .8, 'eo'], [HIT.pat, .8], [HIT.pat + .25, 1.04], [HIT.pat2 + .3, 1]], t);
  xy.blink = K([[HIT.raise - .05, 0], [HIT.raise + .1, 1], [HIT.pat + .2, 1], [HIT.pat + .4, 0]], t);
  xy.brow = K([[HIT.raise - .05, 0], [HIT.raise + .1, .9], [HIT.pat + .3, .9], [HIT.pat + .6, 0]], t);
  xy.ex = K([[HIT.lift, 0], [HIT.lift + .4, .5], [HIT.glance, .4], [HIT.glance + .25, 1]], t);
  xy.ey = K([[HIT.lift, 0], [HIT.lift + .4, .1], [HIT.glance + .25, -.5]], t);
  xy.bulb = K([[HIT.pat2, 0], [HIT.pat2 + .4, 1]], t);
  xy.ant = Math.sin((t - HIT.pat) * 14) * K([[HIT.pat, 0], [HIT.pat + .1, .5], [HIT.pat2 + 1, 0]], t);
  const headTop = [xy.x, GY + 20 - 140 * s * (xy.squash ?? 1)];
  lj.pen = loc(lj, K([[HIT.tender, [1110, 790]], [HIT.raise - .3, [1110, 790]], [HIT.raise + .2, [1040, 520], 'eo'], [HIT.pat - .15, [940, 600], 'eio'], [HIT.pat, [headTop[0] + 30, headTop[1] - 6], 'ei'], [HIT.pat + .2, [headTop[0] + 34, headTop[1] - 30]], [HIT.pat2, [headTop[0] + 30, headTop[1] - 6], 'ei'], [HIT.pat2 + .25, [headTop[0] + 34, headTop[1] - 22]], [HIT.pat2 + 1.3, [headTop[0] + 34, headTop[1] - 18]]], t));
  lj.penTilt = K([[HIT.raise, .5], [HIT.pat - .2, -1.3]], t);
  lj.stamp = loc(lj, [1120, 830]);
  SET.bucket(g, bk[0], bk[1], { water: true });
  SET.smoke(g, bk[0], bk[1] - 10, .25, t, { n: 6, rise: 200, s: 1.6, v: .9, speed: .4 });
  laoJiao(g, lj);
  xiaoYi(g, xy);
  // the can, dripping, its label turned to us: No. 1000
  SET.can(g, canW[0], canW[1], 48, .55, { label: true });
  g.save(); g.fillStyle = grey(.12); g.font = '700 21px "Old Standard TT"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('No. 1000', canW[0], canW[1] - 23); g.restore();
  for (let i = 0; i < 4; i++) { const ph = (t * 1.3 + i / 4) % 1; if (t > HIT.lift) form(g, ellipsePts(canW[0] - 20 + i * 13, canW[1] + 42 + ph * 120, 2.6, 4, 0, 8), { v: .9, line: .8 }); }
  IS.lineScale = 1;
  return { cam, focus: toFilm(cam, [xy.x, GY - 90 * s]) };
}

// ---------------------------------------------------------------- DAWN: the archive again, the last slot, the lamps
export function dawn(g, t) {
  const pb = K([[HIT.slot + .2, 0], [lampAt(4), 1, 'eio']], t);          // pull back: the slot, then the whole archive
  const cam = { x: lerp(1090, 720, pb), y: lerp(640, 540, pb), z: lerp(1.6, 1, pb) }; camApply(g, cam);
  IS.lineScale = 1 / Math.sqrt(cam.z);
  const lit = []; for (let i = 0; i < LAMP_ROWS; i++) lit.push(K([[lampAt(i), 0], [lampAt(i) + .12, 1, 'eo']], t));
  const dw = K([[HIT.dawn, .18], [HIT.lamps, .4], [lampAt(LAMP_ROWS - 1) + .5, 1]], t);
  const slot = SET.slotPos();
  const fill = K([[HIT.slot - .3, 0], [HIT.slot, 1, 'eo']], t);
  SET.archive(g, { dawn: dw, lit, hours: hoursAt(t), pile: 1 / 21, done: .95, lampOn: K([[HIT.lamps, 1], [lampAt(7), 0]], t), slotFill: fill });
  // Xiao Yi held up to the slot by Lao Jiao
  const s = XY_S;
  const gy = K([[HIT.hoist - .2, GY], [HIT.hoist + .7, slot[1] + 190 * s - 40, 'eio'], [HIT.slot + .6, slot[1] + 190 * s - 40], [lampAt(7) + .4, GY, 'eio']], t);
  const xy = { x: K([[HIT.hoist - .2, 1150], [HIT.hoist + .7, slot[0] + 6, 'eio']], t), y: gy, s, roll: 0 };
  const canHeld = t < HIT.slot - .3;
  const canW = K([[HIT.dawn, [1150, GY - 175 * s]], [HIT.hoist - .2, [1150, GY - 175 * s]], [HIT.hoist + .7, [slot[0] + 6, gy - 175 * s]], [HIT.slot - .3, [slot[0], slot[1] + 4]]], t);
  const cw = canHeld ? [canW[0], t > HIT.hoist - .2 && t < HIT.hoist + .7 ? gy - 175 * s : canW[1]] : null;
  if (cw) { xy.armL = { t: loc(xy, [cw[0] - 30, cw[1] + 6]) }; xy.armR = { t: loc(xy, [cw[0] + 30, cw[1] + 6]) }; }
  else { xy.armL = { t: loc(xy, K([[HIT.slot, [slot[0] - 20, slot[1] + 10]], [HIT.slot + .5, [xy.x - 62, gy - 160]], [lampAt(5), [xy.x - 70, gy - 170]], [lampAt(7) + .4, [xy.x - 62, gy - 70]]], t)) };
    xy.armR = { t: loc(xy, K([[HIT.slot, [slot[0] + 20, slot[1] + 10]], [HIT.slot + .5, [xy.x + 62, gy - 160]], [lampAt(5), [xy.x + 70, gy - 170]], [lampAt(7) + .4, [xy.x + 62, gy - 70]]], t)) }; }
  xy.ex = K([[HIT.dawn, .5], [HIT.seal, 1], [HIT.hoist, 0], [HIT.slot + .3, -.4], [HIT.lamps + .5, -.8], [lampAt(7) + .6, 0]], t);
  xy.ey = K([[HIT.dawn, -.8], [HIT.hoist, -.8], [HIT.slot + .3, 0], [HIT.lamps + .2, .4], [lampAt(4), -.6], [lampAt(7) + .6, 0]], t);
  xy.bulb = K([[HIT.slot, .2], [HIT.slot + .2, 1]], t);
  xy.ant = Math.sin(t * 10) * K([[HIT.slot, 0], [HIT.slot + .1, .7], [HIT.slot + 1.2, 0]], t);
  // Lao Jiao: stamps the seal on the can, then lifts Xiao Yi (hands at the wheel hub and the drum's side)
  const lj = { x: 1310, y: GY, s: LJ_S, dir: -1, lean: K([[HIT.seal - .3, -.12], [HIT.hoist, -.15], [HIT.hoist + .7, .02], [lampAt(7) + .4, -.1], [SEC.DAWN.t1, 0]], t), lensOut: .2,
    glint: K([[lampAt(7), 0], [lampAt(7) + .1, 1], [lampAt(7) + .5, 0]], t), head: K([[lampAt(2), 0], [lampAt(5), -.18], [lampAt(7) + .6, 0]], t) };
  const hub = [xy.x + 4, gy - 18 * s], side = [xy.x + 52 * s, gy - 90 * s];
  const lifting = K([[HIT.hoist - .45, 0], [HIT.hoist - .2, 1], [lampAt(7) + .4, 1], [lampAt(7) + .7, 0]], t);
  const stampT = K([[HIT.dawn, [1240, 740]], [HIT.seal - .25, [canW[0] + 18, canW[1] - 60], 'eio'], [HIT.seal, [canW[0] + 12, canW[1] - 14], 'ei'], [HIT.seal + .25, [canW[0] + 30, canW[1] - 70]], [HIT.hoist - .45, [1240, 760]]], t);
  lj.stamp = loc(lj, [lerp(stampT[0], side[0] + 4, lifting), lerp(stampT[1], side[1], lifting)]);
  lj.pen = loc(lj, [lerp(1250, hub[0] + 16, lifting), lerp(800, hub[1] + 6, lifting)]);
  laoJiao(g, lj);
  xiaoYi(g, xy);
  if (cw) {
    SET.can(g, cw[0], cw[1], 30, .6);
    if (t > HIT.seal) {                                            // the red seal 「译毕」, characters knocked out of the ink
      const sx = cw[0], sy = cw[1] + 2, k = 1 + .25 * (1 - seg(t, HIT.seal, HIT.seal + .15));
      red(g, m => { m.save(); m.translate(sx, sy); m.scale(k, k); m.rotate(-.08); m.fillRect(-17, -17, 34, 34);
        m.globalCompositeOperation = 'destination-out'; m.font = '900 15px "Noto Serif SC"'; m.textAlign = 'center'; m.textBaseline = 'middle'; m.fillText('译', 0, -7); m.fillText('毕', 0, 8); m.restore(); }, .35,
        () => { g.save(); g.translate(sx, sy); g.scale(k, k); g.rotate(-.08); g.fillRect(-17, -17, 34, 34); g.fillStyle = grey(.9); g.font = '900 15px "Noto Serif SC"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('译', 0, -7); g.fillText('毕', 0, 8); g.restore(); });
    }
  }
  IS.lineScale = 1;
  return { cam, focus: toFilm(cam, [xy.x, gy - 90 * s]) };
}

// ---------------------------------------------------------------- the per-event sound list (exported to the mixer)
export function shotEvents() {
  const ev = [];
  const e = (t, type, o = {}) => ev.push({ t: +t.toFixed(4), type, ...o });
  // NIGHT: a squeak per wheel turn while rolling
  { let last = 0; for (let t = HIT.rollIn; t < HIT.park; t += 1 / 96) { const x = K([[HIT.rollIn, 120], [HIT.park, 548, 'eio']], t), turn = Math.floor((x - 120) / (2 * Math.PI * 18 * XY_S) * 2); if (turn > last) { e(t, 'squeak', { v: .6 }); last = turn; } } }
  e(HIT.lens + .08, 'glint'); e(HIT.bell, 'bell');
  // WORK
  e(HIT.can1, 'canGrab'); e(HIT.thread, 'thread');
  for (const [a, b] of [[HIT.type0, HIT.type1], [HIT.tube1 + .25, HIT.tube2 - .45]]) for (let t = a; t < b - 1e-6; t += B('WORK') / 2) e(t, 'key');
  e(HIT.ding, 'ding'); e(HIT.tube1, 'tube'); e(HIT.tube1 + .22, 'pop'); e(HIT.stamp1, 'stamp'); e(HIT.stamp1 + .45, 'paper');
  e(HIT.tube2, 'tube'); e(HIT.tube2 + .22, 'pop'); e(HIT.recoil, 'recoil'); e(HIT.scrib, 'scribble', { d: HIT.throw - .1 - HIT.scrib }); e(HIT.throw - .05, 'crumple'); e(HIT.throw, 'throw');
  e(HIT.bonk, 'bonk'); e(HIT.bonk + .55, 'paper', { v: .5 });
  e(HIT.strike, 'scratch', { d: .35 }); e(HIT.fix, 'scratch', { d: .9, v: .6 });
  // HURRY: four cycles
  const b = B('HURRY');
  for (let k = 0; k < 4; k++) {
    const c0 = HIT.hurry + k * 4 * b;
    e(c0 + .5 * b, 'canGrab', { v: .7 }); e(c0 + b, 'thread', { v: .6 });
    for (let i = 0; i < 5; i++) e(c0 + 1.25 * b + i * b / 4, 'key', { v: .7 });
    e(c0 + 3 * b, 'tube', { v: .7 });
    if (k >= 1) { if (k - 1 === 1) { e(c0 + 1.1 * b, 'throw'); e(c0 + 1.1 * b + .55, 'bonkPile'); } else e(c0 + b, 'stamp', { v: .8 }); }
  }
  e(HIT.jam, 'grind'); e(HIT.shake, 'rattle', { d: HIT.smoke - HIT.shake }); e(HIT.smoke, 'crackle', { d: HIT.shout + 1 - HIT.smoke });
  // DASH / CATCH
  e(HIT.dash, 'crackle', { d: HIT.catch - HIT.dash, v: .8 });
  e(HIT.trip, 'trip'); e(HIT.trip + .5, 'skid'); e(HIT.catch, 'hiss'); e(HIT.catch, 'splash');
  e(HIT.heal + .75, 'boing', { v: .5 });
  // TENDER
  e(HIT.lift, 'drips', { d: 3.5 }); e(HIT.raise, 'flinch'); e(HIT.pat, 'pat'); e(HIT.pat2, 'pat'); e(HIT.pat2 + .4, 'glint', { v: .6 });
  // DAWN
  e(HIT.seal, 'stamp'); e(HIT.hoist, 'lift'); e(HIT.slot, 'clunk');
  for (let i = 0; i < LAMP_ROWS; i++) e(lampAt(i), 'lamp', { i });
  return ev.sort((a, b2) => a.t - b2.t);
}
