// Part D: 100.1–144.75 s. The run up the mountain → the lift → carrying the bus down → 11:55 → the villagers' match → the skid → silence and the unfold → the soft face → the fuse pinched, the door → the hug and the gong → midnight backlight → the dinner → the paste → outside, the end card
import * as X from './common.js';
const { PAL, canvas, fillPaper, paperShadow, noShadow, transmitOf, piece, fill, cut, trace, Pl, P, ellipsePoly, curve, put, mul, T, S, R, ap, beginLight, pool, lightRect, applyLight, bloom, rays, E, textPiece, strip, seal, ink,
  drawGirl, walkPose, drawNian, NPOSE, NJ, runPose, drawFolk, kit, HOUSES, HERO, GATE, GROUND, NIGHT, lanternPiece, kitchenKit, drawClockHands, nianCut, CR, W, H, cam, st, E_, pt, mixPose, shake, pop, drawVillage, drawMountain, roadAt, wallBg, burst, flash, crackerBurst, fireworks, spray, mountainKit, tuanhua,
  TT, tb, END, TITLE, clamp, lerp, seg, ss, eio, eo, ei, back, hash, track, spring } = X;
import { busOnRoad, clockShot } from './partC.js';
export const EV = [];
export const SHOTS = {};
const ev = (t, type, extra = {}) => EV.push({ t, type, ...extra });
const BUS_U = .62;
const NIGHTI = (i, t) => (i === HERO.i ? 1 : .8);

// ---------- the run up the road: fast track, heavy parallax; bounds on the beats ----------
const BOUNDS = [TT.bound1, TT.bound2, TT.bound3, TT.bound4];
function runU(t) { return lerp(.18, .56, seg(t, TT.run, TT.reachBus)); }
export function shotRunUp(g, t) {
  const u = runU(t), r = roadAt(u), dy = shake(t, BOUNDS, 6, 50);
  const C = cam(r.x + 240, r.y - 200 + dy, .78);
  drawMountain(g, C, t, { amb: 'rgb(140,142,190)', bloom: .4, snowOpt: { speed: 2.2 }, onRoad: gg => {
    busOnRoad(gg, C, t, { blink: true });
    const ph = (t - TT.run) / (BOUNDS[1] - BOUNDS[0]) * Math.PI * 2 + Math.PI * .3;   // one bound per two beats
    const p = runPose(ph, 1.0); p.flip = true; p.bob = Math.abs(Math.sin(ph)) * 40 + 10 * Math.max(0, Math.sin(ph)) ** 2;
    drawNian(gg, mul(C, mul(T(r.x, r.y - 6), mul(R(r.ang * .6), mul(S(.95), T(0, -NJ.ground))))), p, { shadow: 1.6 });
    for (const b of BOUNDS) { const rb = roadAt(runU(b)); spray(gg, C, t, b, rb.x - 80, rb.y + 30, 10, 180, 9, 61); }
  } });
}
BOUNDS.forEach(b => { ev(b, 'bound'); ev(b + .02, 'snowspray'); }); ev(TT.run, 'windbed', { dur: 19.5, gain: 1.4 });

// ---------- the lift: squat (anticipation), lift, the bus comes free with a spray of snow and tilts onto its back ----------
export function shotLiftBus(g, t) {
  const r = roadAt(BUS_U), dy = shake(t, [TT.lift, TT.free], 10, 45);
  const C = cam(r.x - 40, r.y - 200 + dy, .8);
  const arrive = E_(st(t), TT.reachBus, TT.squat - .2), sq = E_(st(t), TT.squat, TT.squat + .5), lf = E_(st(t), TT.lift, TT.free);
  drawMountain(g, C, t, { amb: 'rgb(140,142,190)', bloom: .45, snowOpt: { speed: 1.6 }, onRoad: gg => {
    const V = kit(); put(gg, V.drifts[0], mul(C, mul(T(r.x + 250, r.y + 60), S(1.3, 1.2 * (1 - .4 * lf)))), { shadow: .7 });
    // the Nian arrives behind the bus (left), squats low, then straightens with the bus held up by its two front paws, the bus tilting back onto its shoulders
    const nx = r.x - 300 + 60 * arrive, ny = r.y + 10;
    const pose = { ...NPOSE.stand, flip: true, eye: 'determined', jaw: lf > .3 ? .35 : .1,
      lean: lerp(0, .3, sq) * (1 - lf) + lerp(0, -.25, lf), head: lerp(.1, .35, sq) * (1 - lf) + lerp(0, -.3, lf),
      shF: lerp(-.3, -1.2, sq) * (1 - lf) + lerp(-1.2, -2.6, lf), elF: lerp(.1, .6, sq) * (1 - lf) + lerp(.6, -.3, lf), shB: lerp(.3, -1.0, sq) * (1 - lf) + lerp(-1.0, -2.5, lf), elB: lerp(-.1, .5, sq) * (1 - lf) + lerp(.5, -.4, lf),
      hipF: lerp(-.08, .6, sq) * (1 - lf) + lerp(.6, -.2, lf), knF: lerp(.04, -.9, sq) * (1 - lf) + lerp(-.9, .3, lf), hipB: lerp(.1, -.6, sq) * (1 - lf) + lerp(-.6, .2, lf), knB: lerp(-.05, .9, sq) * (1 - lf) + lerp(.9, -.3, lf), tail: -.3 - .5 * lf, bob: -lerp(0, 120, sq) * (1 - lf) };
    const r2 = drawNian(gg, mul(C, mul(T(nx, ny), mul(S(.95), T(0, -NJ.ground)))), pose, { shadow: 1.6, order: ['uaB', 'faB', 'thB', 'shB', 'tail', 'thF', 'shF', 'body', 'jaw', 'head'] });
    // the bus: rises and tilts; before the lift it sits nose-down; after: on the Nian's back, held by the paws
    const bdy = -lerp(0, 330, lf), tilt = lerp(-.22, .1, lf), bdx = lerp(0, -140, lf);
    busOnRoad(gg, C, t, { blink: t < TT.lift, dx: bdx, dy: bdy, tilt, s: .8 });
    put(gg, X.buildNian().ua, r2.M.uaF, { shadow: 1.6 }); put(gg, X.buildNian().fa, r2.M.faF, { shadow: 1.6 });
    if (t >= TT.lift) spray(gg, C, t, TT.lift, r.x, r.y + 40, 22, 300, 12, 71);
    if (t >= TT.free) spray(gg, C, t, TT.free, r.x - 100, r.y + 20, 14, 220, 10, 73);
  } });
}
ev(TT.reachBus, 'thud', { gain: .8 }); ev(TT.squat, 'creak'); ev(TT.lift, 'strain'); ev(TT.lift, 'snowspray'); ev(TT.free, 'buscreak'); ev(TT.free, 'crash'); ev(TT.free + .1, 'snowspray');

// ---------- carrying the bus downhill: the headlights light the snow ahead; gallop thuds on the beats ----------
const GAL = [TT.gallop, TT.gallop + .882, TT.gallop + 1.765, TT.gallop + 2.647];
export function shotCarryDown(g, t) {
  const u = lerp(.6, .12, seg(t, TT.downhill2, TT.clock1155)), r = roadAt(u), dy = shake(t, GAL, 7, 50);
  const C = cam(r.x - 200, r.y - 220 + dy, .72);
  drawMountain(g, C, t, { amb: 'rgb(140,142,190)', bloom: .5, snowOpt: { speed: 2.4 }, onRoad: gg => {
    const ph = (t - TT.gallop) / .882 * Math.PI * 2 + 1;
    const p = runPose(ph, .9); p.flip = false; p.bob = Math.abs(Math.sin(ph)) * 30; p.lean = -.25 + .05 * Math.sin(ph); p.shF = -2.4; p.shB = -2.3; p.elF = -.3; p.elB = -.4;
    const r2 = drawNian(gg, mul(C, mul(T(r.x, r.y - 6), mul(R(r.ang * .5), mul(S(.95), T(0, -NJ.ground))))), p, { shadow: 1.6, order: ['uaB', 'faB', 'thB', 'shB', 'tail', 'thF', 'shF', 'body', 'jaw', 'head'] });
    const back_ = ap(r2.M.body, [40, -300]);
    const bm = busOnRoad(gg, C, t, { u, dx: (back_[0] - C[4]) / C[0] - r.x + 60, dy: (back_[1] - C[5]) / C[0] - r.y - 20 - p.bob, tilt: -.08 + .04 * Math.sin(ph), s: .8, blink: false });
    put(gg, X.buildNian().ua, r2.M.uaF, { shadow: 1.6 }); put(gg, X.buildNian().fa, r2.M.faF, { shadow: 1.6 });
    for (const b of GAL) { const rb = roadAt(lerp(.6, .12, seg(b, TT.downhill2, TT.clock1155))); spray(gg, C, t, b, rb.x + 60, rb.y + 30, 10, 180, 9, 81); }
    // the headlight beam ahead on the road: a warm cone on the light map in front of the bus
    const lamp = pt(bm, [214, -40]); pool(lamp[0] - 300 * C[0], lamp[1] + 160 * C[0], 520 * C[0], 'rgba(255,220,160,1)', .7);
  } });
}
GAL.forEach(b => ev(b, 'gallop')); ev(TT.downhill2, 'buscreak'); ev(TT.downhill2 + 1.5, 'buscreak');

export const shotClock2 = (g, t) => clockShot(g, t, 11, 55, TT.clock1155, false, false);
for (let k = 0; k < 4; k++) ev(TT.clock1155 + k * .441, 'tick');

// ---------- the villagers at the gate: they see it coming; a match; the fuse is lit ----------
function fuseSpark(gg, C, t, on, x, y) { if (!on) return; const c = pt(C, [x, y]); flash(c[0], c[1], 40 * C[0] / .8, .9 + .3 * Math.sin(t * 70)); burst(gg, C, t, Math.floor(t * 6) / 6, x, y, 4, '#ffe7b0', 40, 4, 91); }
export function shotVillagersMatch(g, t) {
  const C = cam(GATE.x + 10, 660, 1.0), lit = t >= TT.match + .3, m = E_(st(t), TT.match - .4, TT.match - .05);
  drawVillage(g, C, t, { mode: 'night', winI: NIGHTI, flowers: () => 1, bloom: .5,
    front: gg => {
      const ts = st(t), see = t > TT.villagers + .3;
      drawFolk(gg, mul(C, T(GATE.x - 300, GROUND + 60)), 'v1', { expr: see ? 'surprise' : 'neutral', flip: true, shF: see ? -2.4 : -.6, elF: -.3, shB: -.5, elB: -.9, handF: 'open', head: -.15, scale: .9 }, { shadow: 1 });
      // v2 holds the fuse end; strikes the match at TT.match, the fuse catches
      drawFolk(gg, mul(C, T(GATE.x + 80, GROUND + 60)), 'v2', { expr: see ? 'stern' : 'neutral', flip: true, shF: lerp(-1.0, -2.2, m), elF: -.4, shB: -1.6, elB: -.3, handF: 'hold', handB: 'hold', head: -.1, scale: .9, prop: (q, M2) => { if (t > TT.match - .5 && t < TT.match + .8) { q.save(); q.setTransform(...mul(M2, T(0, -6))); q.strokeStyle = '#e9dcc0'; q.lineWidth = 4; q.beginPath(); q.moveTo(0, 0); q.lineTo(0, -40); q.stroke(); q.restore(); if (t > TT.match) { const c = pt(M2, [0, -50]); flash(c[0], c[1], 50, .9); } } } }, { shadow: 1 });
      fuseSpark(gg, C, t, lit, GATE.x + 6, GROUND - 248 + 300);
    } });
}
ev(TT.villagers + .3, 'gasp'); ev(TT.match, 'match'); ev(TT.match + .3, 'fuse', { dur: TT.silence - TT.match - .3 + 1.5 });

// ---------- the skid: the Nian halts before the gate with the bus; the string hisses; panic ----------
export function shotSkidHalt(g, t) {
  const dy = shake(t, [TT.skid], 10, 45), C = cam(GATE.x - 560, 620 + dy, .62);
  const sk = seg(st(t), TT.skid - .4, TT.skid + .15), nx = GATE.x - 1700 + 1000 * eo(sk), ny = GROUND + 50;
  drawVillage(g, C, t, { mode: 'night', winI: NIGHTI, flowers: () => 1, bloom: .5,
    mid: gg => {
      const run = t < TT.skid, ph = (t - TT.gallop) / .882 * Math.PI * 2 + 1;
      const p = run ? { ...runPose(ph, .9), bob: Math.abs(Math.sin(ph)) * 30, lean: -.25, shF: -2.4, shB: -2.3, elF: -.3, elB: -.4, eye: 'determined' } : { ...NPOSE.stand, lean: .25, head: -.25, jaw: .6, eye: 'panic', shF: -2.5, shB: -2.4, elF: -.3, elB: -.4, hipF: .6, knF: -.5, hipB: -.3, knB: .3, tail: -.9 };
      const r2 = drawNian(gg, mul(C, mul(T(nx, ny), mul(S(.95), T(0, -NJ.ground)))), p, { shadow: 1.6, order: ['uaB', 'faB', 'thB', 'shB', 'tail', 'thF', 'shF', 'body', 'jaw', 'head'] });
      const back_ = ap(r2.M.body, [40, -300]);
      busOnRoad(gg, C, t, { u: 0, dx: (back_[0] - C[4]) / C[0] - roadAt(0).x + 60, dy: (back_[1] - C[5]) / C[0] - roadAt(0).y - 20 - (p.bob || 0), tilt: run ? -.08 : -.25 * seg(t, TT.skid, TT.skid + .3), s: .8, blink: false });
      put(gg, X.buildNian().ua, r2.M.uaF, { shadow: 1.6 }); put(gg, X.buildNian().fa, r2.M.faF, { shadow: 1.6 });
      if (t >= TT.skid - .2) spray(gg, C, t, TT.skid - .2, nx + 120, ny, 24, 360, 12, 101);
    },
    front: gg => {
      drawFolk(gg, mul(C, T(GATE.x - 300, GROUND + 60)), 'v1', { expr: 'surprise', flip: true, shF: -2.4, elF: -.3, shB: -.5, elB: -.9, handF: 'open', head: -.15, scale: .9 }, { shadow: 1 });
      drawFolk(gg, mul(C, T(GATE.x + 80, GROUND + 60)), 'v2', { expr: 'stern', flip: true, shF: -1.2, elF: -.4, shB: -1.6, elB: -.3, handF: 'hold', head: -.1, scale: .9 }, { shadow: 1 });
      fuseSpark(gg, C, t, true, GATE.x + 6, GROUND + 52);
    } });
}
ev(TT.skid - .3, 'skid'); ev(TT.skid, 'thud', { gain: 1 }); ev(TT.skid, 'snowspray'); ev(TT.skid + .2, 'buscreak'); ev(TT.hiss, 'yelp');

// ---------- the climax: 小雪 walks out between the fuse and the beast; silence; she unfolds the paper-cut ----------
const PC = {};
function cutPieces() { if (PC.full) return PC; PC.full = nianCut(3, 1.6); PC.halfR = nianCut(3, 1.6); return PC; }
// the unfold: the sheet is folded in half (right half over the left, back colour up); the flap swings open from the centre fold with fake perspective and shading, then a scale bump
const [Fc, Fg] = canvas(W, H);
// the back of the folded half: the cut's own alpha (holes stay holes) in the lighter back colour, pre-rendered once
function backHalf() { if (PC.back) return PC.back; const q = cutPieces().full, [c, g] = canvas(q.c.width, q.c.height); g.drawImage(q.c, 0, 0); g.globalCompositeOperation = 'source-atop'; g.fillStyle = '#e98f86'; g.fillRect(0, 0, c.width, c.height); g.globalCompositeOperation = 'destination-in'; g.beginPath(); g.rect(0, 0, q.c.width / 2 + 0, q.c.height); g.fill(); return PC.back = c; }
export function drawUnfold(g, M, t, t0, dur = .32) {
  const p = cutPieces().full, u = clamp((t - t0) / dur), s = -Math.cos(Math.PI * eo(u));   // -1 folded → 1 open
  // left half always visible
  g.save(); g.setTransform(...M); g.beginPath(); g.rect(-CR - 20, -CR - 20, CR + 20, 2 * CR + 40); g.clip(); paperShadow(g, M[0], 1.2); g.drawImage(p.c, p.x0, p.y0, p.w, p.h); g.restore();
  // the flap: the right half; when s<0 it lies over the left half showing its back (a lighter red) mirrored
  const lift = Math.sqrt(Math.max(0, 1 - s * s)), N = 12;
  Fg.setTransform(1, 0, 0, 1, 0, 0); Fg.clearRect(0, 0, W, H);
  for (let i = 0; i < N; i++) {
    const x0 = CR * i / N, x1 = CR * (i + 1) / N, xm = (x0 + x1) / 2, sc = 1 + .28 * (xm / CR) * lift;
    const MM = mul(M, [s, 0, 0, sc, 0, 0]);
    Fg.save(); Fg.setTransform(...MM); Fg.beginPath(); Fg.rect(x0 - 1, -CR - 30, x1 - x0 + 2, 2 * CR + 60); Fg.clip();
    if (s > 0) Fg.drawImage(p.c, p.x0, p.y0, p.w, p.h);
    else { Fg.fillStyle = '#e98f86'; Fg.beginPath(); Fg.rect(0, -CR, CR, 2 * CR); Fg.fill(); Fg.globalCompositeOperation = 'destination-in'; Fg.setTransform(...mul(M, [-s, 0, 0, sc, 0, 0])); Fg.drawImage(p.c, p.x0, p.y0, p.w, p.h); Fg.globalCompositeOperation = 'source-over'; }
    const shade = .38 * lift; Fg.fillStyle = s > 0 ? `rgba(40,0,6,${shade})` : `rgba(255,225,205,${.1 + .1 * lift})`; Fg.globalCompositeOperation = 'source-atop'; Fg.fillRect(-CR * 2, -CR * 2, CR * 4, CR * 4);
    Fg.restore();
  }
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.shadowColor = `rgba(50,8,6,${.3 + .25 * lift})`; g.shadowBlur = (6 + 24 * lift) * M[0]; g.shadowOffsetX = (3 + 16 * lift) * M[0]; g.shadowOffsetY = (4 + 20 * lift) * M[0]; g.drawImage(Fc, 0, 0); g.restore();
}
export function shotWalkOut(g, t) {
  const V = kit(), z = .78 + .12 * seg(t, TT.walkOut, TT.softFace), C = cam(GATE.x - 500, 640, z);
  const wk = seg(st(t), TT.walkOut, TT.walkOut + 1.3), gx = GATE.x - 240 - 300 * eio(wk), unfolded = t >= TT.unfold;
  const raise = E_(st(t), TT.walkOut + 1.3, TT.unfold - .1), bump = t > TT.unfold + .3 && t < TT.unfold + .42 ? 1.08 : 1;
  drawVillage(g, C, t, { mode: 'night', winI: NIGHTI, flowers: () => 1, bloom: .5,
    mid: gg => {
      // the Nian frozen with the bus, panic face softening after the unfold
      const nx = GATE.x - 700, ny = GROUND + 50;
      const p = { ...NPOSE.stand, lean: .25, head: -.25 + .15 * E_(t, TT.unfold + .2, TT.unfold + .8), jaw: unfolded ? .2 : .55, eye: t > TT.unfold + .4 ? 'curious' : 'panic', shF: -2.5, shB: -2.4, elF: -.3, elB: -.4, hipF: .6, knF: -.5, hipB: -.3, knB: .3, tail: -.9 };
      const r2 = drawNian(gg, mul(C, mul(T(nx, ny), mul(S(.95), T(0, -NJ.ground)))), p, { shadow: 1.6, order: ['uaB', 'faB', 'thB', 'shB', 'tail', 'thF', 'shF', 'body', 'jaw', 'head'] });
      const back_ = ap(r2.M.body, [40, -300]);
      busOnRoad(gg, C, t, { u: 0, dx: (back_[0] - C[4]) / C[0] - roadAt(0).x + 60, dy: (back_[1] - C[5]) / C[0] - roadAt(0).y - 20, tilt: -.25, s: .8, blink: false });
      put(gg, X.buildNian().ua, r2.M.uaF, { shadow: 1.6 }); put(gg, X.buildNian().fa, r2.M.faF, { shadow: 1.6 });
    },
    front: gg => {
      drawFolk(gg, mul(C, T(GATE.x - 60, GROUND + 60)), 'v1', { expr: 'surprise', flip: true, shF: -2.2, elF: -.4, shB: -.5, elB: -.9, handF: 'open', head: -.1, scale: .9 }, { shadow: 1 });
      drawFolk(gg, mul(C, T(GATE.x + 140, GROUND + 60)), 'v2', { expr: 'stern', flip: true, shF: -1.2, elF: -.4, shB: -1.6, elB: -.3, handF: 'hold', head: -.1, scale: .9 }, { shadow: 1 });
      fuseSpark(gg, C, t, t < TT.pinch, GATE.x + 6, GROUND + 52);
      // 小雪 walks out from the gate to the left, stops between them, raises the folded sheet with both hands, unfolds it
      const ph = st(t) * 8, pose = wk < 1 ? walkPose(ph, .55, { expr: 'determined', flip: true, shF: -1.0, elF: -1.2, shB: -.9, elB: -1.1, handF: 'hold', handB: 'hold' }) : { expr: 'determined', flip: true, lean: -.05, shF: lerp(-1.0, -2.5, raise), elF: lerp(-1.2, -.3, raise), shB: lerp(-.9, -2.4, raise), elB: lerp(-1.1, -.35, raise), handF: 'hold', handB: 'hold', head: lerp(.05, -.2, raise) };
      const r = drawGirl(gg, mul(C, T(gx, GROUND + 60)), { ...pose, ground: wk >= 1 }, { shadow: 1.2 });
      // the paper-cut between her hands: folded (half, back colour) until the unfold
      const hm = r.joints.handF, hb = r.joints.handB, cx = (hm[0] + hb[0]) / 2, cy = (hm[1] + hb[1]) / 2 - 40 * C[0] * raise;
      const sc = C[0] * .62 * bump, M = [sc, 0, 0, sc, cx, cy - 150 * sc];
      if (!unfolded) { const q = cutPieces().full, bk = backHalf();
        gg.save(); gg.setTransform(...M); gg.beginPath(); gg.rect(-CR - 20, -CR - 20, CR + 20, 2 * CR + 40); gg.clip(); paperShadow(gg, sc, 1.2); gg.drawImage(q.c, q.x0, q.y0, q.w, q.h); gg.restore();   // the left half, face up
        gg.save(); gg.setTransform(...mul(M, [-1, 0, 0, 1, 0, 0])); paperShadow(gg, sc, 1.6); gg.drawImage(bk, q.x0, q.y0, q.w, q.h); gg.restore(); }   // the right half folded over it, back colour up (mirrored)
      else drawUnfold(gg, M, t, TT.unfold);
      if (unfolded && t < TT.unfold + .5) { const c = [cx, cy - 120 * sc]; flash(c[0], c[1], 500 * C[0], .5 * (1 - (t - TT.unfold) / .5), '255,210,160'); }
    } });
}
for (let k = 0; k < 5; k++) ev(TT.walkOut + .1 + k * .26, 'crunch', { gain: .8 });
ev(TT.unfold, 'unfold'); ev(TT.unfold - .35, 'cloth');

// ---------- the soft face, held ----------
export function shotSoftFace(g, t) {
  const C = cam(GATE.x - 820, GROUND - 400, 1.25);
  drawVillage(g, C, t, { mode: 'night', winI: NIGHTI, flowers: () => 1, bloom: .5, mid: gg => {
    drawNian(gg, mul(C, mul(T(GATE.x - 700, GROUND + 50), mul(S(.95), T(0, -NJ.ground)))), { ...NPOSE.stand, lean: .12, head: -.05 + .02 * Math.sin(st(t) * 3), jaw: .12, eye: 'soft', shF: -2.5, shB: -2.4, elF: -.3, elB: -.4 }, { shadow: 1.6, order: ['uaB', 'faB', 'thB', 'shB', 'tail', 'thF', 'shF', 'body', 'jaw', 'head'] });
  } });
}
ev(TT.softFace + .2, 'breath');

// ---------- the fuse pinched out; the bus door folds open; the parents step down ----------
export function shotPinchDoor(g, t) {
  if (t < TT.door - .1) {
    const C = cam(GATE.x + 40, GROUND - 20, 1.9), pinched = t >= TT.pinch;
    drawVillage(g, C, t, { mode: 'night', winI: NIGHTI, flowers: () => 1, bloom: .5, front: gg => {
      drawFolk(gg, mul(C, T(GATE.x + 140, GROUND + 60)), 'v2', { expr: pinched ? 'smile' : 'stern', flip: true, shF: lerp(-1.2, -1.0, E_(st(t), TT.pinch - .3, TT.pinch)), elF: -.6, shB: -1.4, elB: -.5, handF: 'hold', head: .25, scale: .9 }, { shadow: 1 });
      fuseSpark(gg, C, t, !pinched, GATE.x + 6, GROUND + 52);
      if (pinched) burst(gg, C, t, TT.pinch, GATE.x + 6, GROUND + 52, 5, '#d9d2d8', 50, 5, 111);
    } });
  } else {
    const C = cam(GATE.x - 820, GROUND - 60, 1.05), open = E_(st(t), TT.door, TT.door + .4), out = seg(st(t), TT.door + .4, TT.hug);
    drawVillage(g, C, t, { mode: 'night', winI: NIGHTI, flowers: () => 1, bloom: .5, mid: gg => {
      // the bus set down on the snow beside the gate; the Nian behind it, kneeling, soft
      drawNian(gg, mul(C, mul(T(GATE.x - 1420, GROUND + 50), mul(S(.95), T(0, -NJ.ground)))), { ...NPOSE.sit, lean: .1, head: .0, eye: 'happy', tail: .5, shF: -.2, shB: .3 }, { shadow: 1.6 });
      const bm = busOnRoad(gg, C, t, { u: 0, dx: GATE.x - 760 - roadAt(0).x, dy: GROUND - 10 - roadAt(0).y + 10, tilt: 0, s: .85, blink: false });
      // the door: a flap that folds open (the door hole already exists; a door leaf swings out)
      const dM = mul(bm, T(126, 0)); gg.save(); gg.setTransform(...mul(dM, [1 - open * 1.6, 0, 0, 1, 0, 0])); gg.fillStyle = '#9c1323'; paperShadow(gg, C[0], 1); gg.fillRect(-22, -70, 44, 70); gg.restore();
      // the parents step down: 妈妈 first, 爸爸 after, with the suitcase
      const mx = GATE.x - 600 + 140 * out, dx = GATE.x - 640 + 60 * clamp(out * 1.3 - .3);
      if (out > 0) drawFolk(gg, mul(C, T(mx, GROUND + 60)), 'mom', { ...walkPose(st(t) * 7, .35 * (out < .9 ? 1 : 0)), expr: 'smile', shF: -.8, elF: -.6, shB: -.6, elB: -.5, handF: 'open', handB: 'open', scale: .95 }, { shadow: 1.1 });
      if (out > .25) drawFolk(gg, mul(C, T(dx, GROUND + 60)), 'dad', { ...walkPose(st(t) * 7 + 2, .35 * (out < .95 ? 1 : 0)), expr: 'smile', shF: -.5, elF: -.3, shB: -.2, elB: -.2, handF: 'hold', scale: 1.0, prop: (q, M2) => { q.save(); q.setTransform(...mul(M2, T(0, 0))); q.fillStyle = '#8a0c20'; paperShadow(q, C[0], 1); q.fillRect(-30, -10, 60, 48); q.restore(); } }, { shadow: 1.1 });
    } });
  }
}
ev(TT.pinch, 'pinch'); ev(TT.door, 'doorfold'); ev(TT.door + .6, 'crunch'); ev(TT.door + .9, 'crunch');

// ---------- the hug, then the clock at twelve (gold) and the gong ----------
export function shotHug(g, t) {
  if (t >= TT.gong - .25) { clockShot(g, t, 12, 0, TT.gong, true, false); return; }
  const C = cam(GATE.x - 560, GROUND - 160, 1.1), run = seg(st(t), TT.hug - .2, TT.hug + .55), hug = t >= TT.hug + .55;
  drawVillage(g, C, t, { mode: 'night', winI: NIGHTI, flowers: () => 1, bloom: .5, mid: gg => {
    drawNian(gg, mul(C, mul(T(GATE.x - 1420, GROUND + 50), mul(S(.95), T(0, -NJ.ground)))), { ...NPOSE.sit, lean: .1, eye: 'happy', tail: .6 + .2 * Math.sin(st(t) * 6), shF: -.2, shB: .3 }, { shadow: 1.6 });
    busOnRoad(gg, C, t, { u: 0, dx: GATE.x - 760 - roadAt(0).x, dy: GROUND - roadAt(0).y, tilt: 0, s: .85, blink: false });
    const mx = GATE.x - 460, dx = GATE.x - 580;
    drawFolk(gg, mul(C, T(dx, GROUND + 60)), 'dad', { expr: 'laugh', lean: .1, shF: -1.6, elF: -.9, shB: -1.4, elB: -.8, handF: 'open', handB: 'open', scale: 1.0, hipF: -.3, knF: .4 }, { shadow: 1.1 });
    drawFolk(gg, mul(C, T(mx, GROUND + 60)), 'mom', { expr: 'laugh', lean: hug ? .4 : .15, shF: hug ? -1.3 : -1.7, elF: -1.0, shB: -1.2, elB: -.9, handF: 'open', handB: 'open', scale: .95, hipF: hug ? -.8 : -.2, knF: hug ? .9 : .2, hipB: hug ? -.5 : 0, knB: hug ? .6 : 0 }, { shadow: 1.1 });
    const gx = GATE.x - 160 - 240 * eio(run), ph = st(t) * 11;
    drawGirl(gg, mul(C, T(gx, GROUND + 60)), hug ? { expr: 'laugh', flip: true, lean: -.1, shF: -2.3, elF: -.8, shB: -2.1, elB: -.7, handF: 'open', handB: 'open', head: -.3 } : walkPose(ph, .8, { expr: 'laugh', flip: true, shF: -2.2, elF: -.6, shB: -2.0, elB: -.5, handF: 'open', handB: 'open', head: -.25, bob: Math.abs(Math.cos(ph)) * 14 }), { shadow: 1.2 });
  } });
}
for (let k = 0; k < 3; k++) ev(TT.hug - .1 + k * .2, 'crunch', { gain: .9 }); ev(TT.hug + .55, 'cloth'); ev(TT.hug + .6, 'giggle'); ev(TT.gong, 'gong');

// ---------- midnight: the village backlit, every window flower glowing; rosette fireworks ----------
export function shotBacklitVillage(g, t) {
  const u = seg(t, TT.backlight, TT.table), C = cam(1500 + 300 * eio(u), 560, .55 + .04 * u);
  const FWL = [[TT.fireworks1, 1300, 160, .55], [TT.fireworks2, 2300, 120, .5], [TT.fireworks1 + 1.3, 800, 220, .4], [TT.fireworks2 + .9, 1900, 60, .6], [TT.fireworks2 + 1.5, 2800, 200, .45]];
  drawVillage(g, C, t, { mode: 'midnight', winI: () => 1.2, flowers: () => 1, glowE: 1.0, bloom: 1.0, snowOpt: { scraps: true },
    sky: gg => fireworks(gg, C, t, FWL),
    mid: gg => {
      // the Nian walks into the village with the family, small in the wide
      const ph = st(t) * 6;
      drawNian(gg, mul(C, mul(T(GATE.x + 300 + 180 * u, GROUND + 40), mul(S(.8), T(0, -NJ.ground)))), { ...runPose(ph, .4), lean: -.1, eye: 'happy', bob: Math.abs(Math.cos(ph)) * 6, flip: true }, { shadow: 1.6 });
      for (const [who, dx] of [['dad', 620], ['mom', 720], ['gm', 820]]) drawFolk(gg, mul(C, T(GATE.x + dx + 180 * u, GROUND + 60)), who, { ...walkPose(ph + dx, .4), expr: 'smile', scale: who === 'gm' ? .95 : 1 }, { shadow: 1 });
      drawGirl(gg, mul(C, T(GATE.x + 560 + 180 * u, GROUND + 60)), walkPose(ph + 1, .6, { expr: 'smile', shF: -1.6, elF: -.6 }), { shadow: 1.2 });
    } });
}
ev(TT.backlight, 'glowon'); [TT.fireworks1, TT.fireworks2, TT.fireworks1 + 1.3, TT.fireworks2 + .9, TT.fireworks2 + 1.5].forEach(s => ev(s, 'firework')); ev(TT.backlight + .5, 'crackersfar', { dur: 3.5 });

// ---------- the dinner: the family at the table, the Nian squeezed in on a stool with the giant dumpling ----------
export function shotDinner(g, t) {
  const K = kitchenKit(), C = cam(1120, 640, .9);
  beginLight('rgb(236,222,206)');
  wallBg(g, C, 'rgba(6,8,22,.2)');
  // the round window behind, glowing warm (midnight: backlit from inside the room the window is just warm paper), the lamp
  g.save(); g.setTransform(...C); g.fillStyle = '#5a3a44'; g.beginPath(); g.arc(1560, 300, 230, 0, 7); g.fill(); g.restore();
  put(g, K.lattice, mul(C, mul(T(1560, 300), S(.78))), { shadow: .5 }); put(g, K.winRim, mul(C, mul(T(1560, 300), S(.78))), { shadow: 1 });
  const rb = lanternPiece({ seed: 503 }); put(g, rb, mul(C, mul(T(1000, 60), S(2.2))), { shadow: 1 }); put(E, rb, mul(C, mul(T(1000, 60), S(2.2))), { shadow: 0, alpha: .6 });
  pool(...pt(C, [1000, 160]), 1100, 'rgba(255,205,150,1)', .9);
  for (const x of [700, 960, 1220, 1480]) put(g, K.stool, mul(C, T(x, 860)), { shadow: .9 });
  const ts = st(t), gulp = t >= TT.gulp2, laugh = t > TT.gulp2 + .6;
  const sit = { hipF: -1.4, knF: 1.5, hipB: -1.3, knB: 1.4, y: -6 };
  drawFolk(g, mul(C, T(700, 1000)), 'gm', { ...sit, expr: laugh ? 'laugh' : 'smile', shF: -.8, elF: -1.2, handF: 'hold', shB: -.5, elB: -.9 }, { shadow: 1 });
  drawFolk(g, mul(C, T(960, 1000)), 'dad', { ...sit, expr: laugh ? 'laugh' : 'smile', shF: -1.0, elF: -1.3, handF: 'hold', shB: -.5, elB: -.9, y: 26 }, { shadow: 1 });
  drawFolk(g, mul(C, T(1220, 1000)), 'mom', { ...sit, expr: laugh ? 'laugh' : 'smile', shF: -.9, elF: -1.3, handF: 'hold', shB: -.5, elB: -.9, y: 26 }, { shadow: 1 });
  drawGirl(g, mul(C, T(1480, 1000)), { ...sit, expr: laugh ? 'laugh' : 'smile', head: -.25, shF: -1.4, elF: -1.0, handF: 'open', shB: -.6, elB: -.9, y: -10 }, { shadow: 1.1 });
  // the Nian at the right end on a stool too small for it, the giant dumpling in its paws, popped into its mouth at gulp2
  put(g, K.stool, mul(C, mul(T(1760, 900), S(.9))), { shadow: .9 });
  const nb = laugh ? Math.sin((t - TT.gulp2 - .6) * 12) * .04 : 0;
  const r2 = drawNian(g, mul(C, mul(T(1760, 1010), mul(S(.55), T(0, -NJ.ground)))), { ...NPOSE.sit, lean: .1 + nb, head: gulp && t < TT.gulp2 + .5 ? -.35 : .05 + nb, jaw: gulp && t < TT.gulp2 + .5 ? .95 : laugh ? .35 : .1, eye: gulp ? (t < TT.gulp2 + .5 ? 'eat' : 'happy') : 'eat', shF: -1.6 + (gulp ? -.6 : 0), elF: -.5, shB: -1.4 + (gulp ? -.6 : 0), elB: -.5, tail: .6 + .2 * nb, flip: true }, { shadow: 1.4, order: ['uaB', 'faB', 'thB', 'shB', 'tail', 'thF', 'shF', 'body', 'jaw', 'head', 'uaF', 'faF'] });
  if (!gulp) { const pw = r2.joints.pawF; put(g, K.dump[4], [C[0] * .5, 0, 0, C[0] * .5, pw[0] - 20, pw[1] - 90], { shadow: 1.2 }); }
  put(g, K.tableSide, mul(C, mul(T(1200, 790), S(1.15, 1))), { shadow: 1.4 });
  for (let k = 0; k < 5; k++) put(g, K.bowlSide, mul(C, T(700 + k * 260, 758)), { shadow: 1 });
  put(g, K.pot, mul(C, T(1100, 760)), { shadow: 1.2 }); put(g, K.steam[Math.floor(t * 4) % 3], mul(C, T(1100, 660)), { shadow: 0, alpha: .8 });
  for (let k = 0; k < 3; k++) put(g, K.dumpRow[k], mul(C, mul(T(840 + k * 90, 752), S(.5))), { shadow: .8 });
  applyLight(g); bloom(g, .4);
}
ev(TT.table, 'bowls'); ev(TT.table + 1.2, 'chopsticks'); ev(TT.gulp2, 'gulp'); ev(TT.gulp2 + .5, 'burp'); ev(TT.gulp2 + .6, 'laughall'); ev(TT.table, 'roomtone', { dur: 7 });

// ---------- the paste: 小雪 pastes the Nian paper-cut on the round window; a tiny sneeze; a smile ----------
export function shotPasteCU(g, t) {
  const K = kitchenKit(), C = cam(1100, 500, 1.1);
  beginLight('rgb(236,222,206)');
  wallBg(g, C, 'rgba(6,8,22,.2)');
  g.save(); g.setTransform(...C); g.fillStyle = '#5a3a44'; g.beginPath(); g.arc(1300, 420, 296, 0, 7); g.fill(); g.restore();
  put(g, K.lattice, mul(C, T(1300, 420)), { shadow: .5 }); put(g, K.winRim, mul(C, T(1300, 420)), { shadow: 1.2 });
  pool(...pt(C, [1300, 420]), 700, 'rgba(255,200,150,1)', .5);
  const u = E_(st(t), TT.paste - .9, TT.paste), pasted = t >= TT.paste, pat = pasted && t < TT.paste + .12 ? 1.04 : 1;
  const sneeze = t >= TT.sneeze2 && t < TT.smile, smile = t >= TT.smile;
  // the Nian beside her (left), head level with the window; a small sneeze jerk
  const sn = sneeze ? Math.min(1, (t - TT.sneeze2) / .1) * Math.max(0, 1 - (t - TT.sneeze2 - .1) * 2.5) : 0;
  drawNian(g, mul(C, mul(T(300, 1150), mul(S(.95), T(0, -NJ.ground)))), { ...NPOSE.sit, lean: .1 + .2 * sn, head: .05 + .4 * sn, jaw: .15 + .4 * sn, eye: smile ? 'happy' : sneeze ? 'sneeze' : 'curious', tail: .5 }, { shadow: 1.6, order: ['body', 'jaw', 'head'] });
  if (sneeze && t < TT.sneeze2 + .4) burst(g, C, t, TT.sneeze2, 560, 440, 5, '#eef0f8', 90, 6, 121);
  // the stool, 小雪 standing on it, pressing the paper-cut onto the window
  put(g, K.stool, mul(C, T(980, 900)), { shadow: .9 });
  const r = drawGirl(g, mul(C, T(980, 910)), { expr: smile ? 'laugh' : pasted ? 'smile' : 'determined', lean: -.08, shF: lerp(-1.6, -2.3, u), elF: lerp(-.4, -.2, u), shB: lerp(-1.5, -2.2, u), elB: lerp(-.4, -.25, u), handF: 'open', handB: 'open', head: -.25 }, { shadow: 1.2 });
  const hm = r.joints.handF, hb = r.joints.handB, cx = lerp((hm[0] + hb[0]) / 2 + 60, pt(C, [1300, 420])[0], u), cy = lerp((hm[1] + hb[1]) / 2 - 40, pt(C, [1300, 420])[1], u), sc = C[0] * .78 * pat;
  const p = cutPieces().full; put(g, p, [sc, 0, 0, sc, cx, cy], { shadow: 1 + 2 * (1 - u) });
  applyLight(g); bloom(g, .4);
}
ev(TT.paste, 'pat'); ev(TT.paste + .1, 'pat'); ev(TT.sneeze2, 'sneezesmall'); ev(TT.smile, 'chuckle');

// ---------- outside: the lit window with the beast among the flowers; scraps fall as snow; the end card ----------
const EC = {};
function endBits() { if (EC.l) return EC; EC.l = [...END].map((c, i) => textPiece(c, 140, PAL.red, 'Ma Shan Zheng', 400, 80 + i)); EC.w = EC.l.reduce((s, p) => s + p.w - 24 + 14, 0); EC.top = strip(900, 25); EC.seal = seal('福', 90, 27); return EC; }
export function shotOutsideEnd(g, t, sh) {
  const V = kit(), ec = endBits(), u = seg(t, TT.outside, TT.endCard + 1.0), C = cam(HERO.x - 140 - 160 * eio(u), GROUND - 160 + 30 * eio(u), lerp(1.25, .82, eio(u)));
  const hp = V.houses[HERO.i], h = HOUSES[HERO.i];
  const texts = [];
  const WM = mul(mul(C, mul(T(h.x, GROUND + h.g), S(h.s))), T(hp.win.x, hp.win.y)), wc = pt(WM, [0, 0]), p = cutPieces().full, sc = hp.win.h / (2 * CR) * 1.3;
  drawVillage(g, C, t, { mode: 'midnight', winI: () => 1.2, flowers: (i) => i === HERO.i ? 0 : 1, glowE: .8, bloom: .8, snowOpt: { scraps: true }, rays: [wc[0], wc[1], .18],
    after: gg => {
      // the hero window: light × the paper-cut's transmission (holes stay at full light), plus a faint copy on the glow layer
      gg.save(); gg.globalCompositeOperation = 'multiply'; put(gg, p, mul(WM, S(sc)), { img: transmitOf(p, '#b51d18'), shadow: 0 }); gg.restore();
      put(E, p, mul(WM, S(sc)), { img: transmitOf(p, '#ff7a3a'), shadow: 0, alpha: .35 });
    } });
  if (t >= TT.endCard - .3) {
    const sl = E_(t, TT.endCard - .3, TT.endCard), y0 = 130;
    put(g, ec.top, [1, 0, 0, 1, 510 - (1 - sl) * 1200, y0 - 70], { shadow: 1 }); put(g, ec.top, [1, 0, 0, -1, 510 + (1 - sl) * 1200, y0 + 270], { shadow: 1 });
    let x = 960 - ec.w / 2;
    ec.l.forEach((p, i) => { const s = pop(t, TT.endCard + i / 4, 1.18); if (s) put(g, p, [s, 0, 0, s, x + (1 - s) * p.w / 2, y0 + (1 - s) * p.h / 2], { shadow: 1.4 }); x += p.w - 24 + 14; });
    if (t >= TT.endCard + 1.2) { const s = pop(t, TT.endCard + 1.2, 1.5); put(g, ec.seal, [s, 0, 0, s, 960 + ec.w / 2 + 24 - 45 * (s - 1), y0 + 130 - 45 * (s - 1)], { shadow: 1 }); }
    if (t >= TT.endCard) texts.push({ id: 'end', text: END, x0: 960 - ec.w / 2, y0, x1: 960 + ec.w / 2, y1: y0 + 180 });
    if (t >= TT.endCard + 1.4) { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = E_(t, TT.endCard + 1.4, TT.endCard + 1.9); ink(g, '字体 OFL · 采样 CC0', 960, 1040, 24, '#fff1d6'); g.restore(); if (t >= TT.endCard + 1.9) texts.push({ id: 'credits', text: '字体 OFL · 采样 CC0', x0: 760, y0: 1010, x1: 1160, y1: 1050 }); }
  }
  return texts;
}
[...END].forEach((c, i) => ev(TT.endCard + i / 4, 'letter')); ev(TT.endCard + 1.2, 'stamp'); ev(TT.endCard - .3, 'place'); ev(TT.outside, 'windbed', { dur: 4, gain: .6 }); ev(TT.endCard + 2.0, 'gongsmall');

export function poster(g) {
  const tp = textPiece(TITLE, 120, '#fff1d6', 'Ma Shan Zheng', 400, 7), w = tp.w + 160, x0 = 960 - w / 2;
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.shadowColor = 'rgba(20,4,8,.5)'; g.shadowBlur = 14; g.shadowOffsetX = 5; g.shadowOffsetY = 8; g.fillStyle = '#8f1016';
  g.beginPath(); trace(g, Pl([[x0, 40], [x0 + w, 40], [x0 + w - 36, 125], [x0 + w, 210], [x0, 210], [x0 + 36, 125]], true, .8, 3)); g.fill(); g.restore();
  put(g, tp, [1, 0, 0, 1, 960 - tp.w / 2, 48], { shadow: .5 });
}

Object.assign(SHOTS, { runUp: shotRunUp, liftBus: shotLiftBus, carryDown: shotCarryDown, clock2: shotClock2, villagersMatch: shotVillagersMatch, skidHalt: shotSkidHalt, walkOut: shotWalkOut, softFace: shotSoftFace, pinchDoor: shotPinchDoor, hug: shotHug, backlitVillage: shotBacklitVillage, dinner: shotDinner, pasteCU: shotPasteCU, outsideEnd: shotOutsideEnd });
