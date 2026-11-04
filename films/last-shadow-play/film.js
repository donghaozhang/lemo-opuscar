// Frame assembly: shot → set → camera → transmission + front + glow layers → compositor options
import { canvas, DYE } from './carve.js';
import { camM, set, ap, mul, T as TM, S, scaleOf, pressOn, liftOff } from './rig.js';
import { clamp, lerp, seg, ss, eo, ei, back, vnoise } from '/core/lib.js';
import { drawMonkey, drawDemon, buildShowScenery, SGROUND, MLEG } from './show.js';
import { drawMaster, drawBoy, buildMaster, buildBoy } from './people.js';
import { buildSets, drawBooth, drawCrowd, drawLamp, drawFlame, drawMatch, phoneGlow, drawBackRoom, drawRods, drawPlacard, RECT_F, RECT_B, SF, SB, clothF, clothB, cloth2B, cloth2F, LAMP_B } from './sets.js';
import { monkeyPose, demonPose, sceneryState, masterBody, boyBody, masterExpr, boyExpr, lights, SIM } from './acting.js';
import { T, DUR, SHOTS, shotAt, PLACARDS, PLAQUES } from './timeline.js';
export { DUR };

const W = 1920, H = 1080;
const E = (t, a, b) => ss(seg(t, a, b));
const [pc, probe] = canvas(2, 2);          // a throwaway context to solve rigs without drawing
const LAMP = [1120, 160];                  // the oil lamp's hook (world B)
const WARM = [1, .77, .46], COOL = [.78, .87, 1];

// ================= the show on a cloth (M = world→viewport ∘ cloth→world) =================
function drawShow(g, M, t, opt = {}) {
  const S_ = buildShowScenery(), st = sceneryState(t), K = scaleOf(M);
  const out = { monkey: null, demon: null };
  g.save(); g.globalCompositeOperation = 'multiply';
  const dpz = (pc_, x, y, sc = 1, rot = 0, blur = 0, alpha = 1) => { g.save(); if (blur > 0) g.filter = `blur(${blur * K}px)`; g.globalAlpha = alpha; const Mm = mul(M, mul(TM(x, y), mul([Math.cos(rot) * sc, Math.sin(rot) * sc, -Math.sin(rot) * sc, Math.cos(rot) * sc, 0, 0], [1, 0, 0, 1, 0, 0]))); set(g, Mm); g.drawImage(pc_.c, pc_.x0, pc_.y0, pc_.w, pc_.h); g.restore(); };
  if (st.ground) { set(g, M); g.drawImage(S_.ground.c, S_.ground.x0, S_.ground.y0, S_.ground.w, S_.ground.h); }
  if (st.mountain > 0) { const p = pressOn(t, T.mountain, .5); dpz(S_.mountain, 0, 0, 1, 0, p.blur, p.alpha); }
  if (st.pine > 0) { const p = pressOn(t, T.pine, .5); dpz(S_.pine, 190, 900, 1 + (p.sc - 1) * .4, 0, p.blur, p.alpha); }
  if (st.cloud) { const c = st.cloud; dpz(S_.cloud, c.x, c.y, c.sc * (1 + (1 - c.on) * .8), c.rot, c.blur + (1 - c.on) * 20, c.alpha * (.4 + .6 * c.on)); }
  g.restore();
  // the demon (behind the Monkey King), with growth / lift-off
  const dpp = demonPose(t);
  if (dpp) {
    let Md = M, al = 1, bl = 0;
    if (dpp.press != null) { const p = pressOn(t, T.maidenIn, .5); Md = mul(M, mul(TM(dpp.x, dpp.y - 60), mul(S(p.sc), TM(-dpp.x, -(dpp.y - 60))))); al = p.alpha; bl = p.blur; }
    if (dpp.sc) { Md = mul(M, mul(TM(dpp.x, dpp.y), mul(S(dpp.sc), TM(-dpp.x, -dpp.y)))); bl = dpp.blur; }
    if (dpp.off) { const o = dpp.off; if (o.body > 0) { const l = liftOff(t, T.skullOff + .4, 1.1); Md = mul(M, mul(TM(dpp.x, dpp.y - 80), mul(S(l.sc), TM(-dpp.x, -(dpp.y - 80))))); al = l.alpha; bl = l.blur; } }
    if (al > 0) { g.save(); if (bl > 0) g.filter = `blur(${bl * K}px)`; const r = drawDemon(g, Md, { ...dpp, rib: SIM.demonRib(t) ? [SIM.demonRib(t).slice(0, 5), SIM.demonRib(t).slice(4, 9)] : null }, { alpha: al, rivets: al > .6 }); g.restore(); out.demon = { ...r, pose: dpp, M: Md }; }
    if (dpp.off && dpp.off.head > 0 && dpp.off.head < 1) {   // the skull lifting off on its own, after the body is already fading
      // (drawn as part of drawDemon's head; here a second ghost rising)
    }
  }
  const mp = monkeyPose(t);
  if (mp) {
    let Mm = M, al = 1, bl = 0;
    if (mp.press != null) { const p = pressOn(t, T.monkeyIn, .5); Mm = mul(M, mul(TM(mp.x, mp.y + 80), mul(S(p.sc), TM(-mp.x, -(mp.y + 80))))); al = p.alpha; bl = p.blur; }
    if (mp.magic != null && mp.magic < 1) { bl = 6 * (1 - mp.magic); al = .5 + .5 * mp.magic; }
    g.save(); if (bl > 0) g.filter = `blur(${bl * K}px)`;
    const f = SIM.monkeyFeat(t), tl = SIM.monkeyTail(t);
    const r = drawMonkey(g, Mm, { ...mp, feat: [f.map((v, i) => v * .09 * (1 + i * .15)), f.map((v, i) => v * .1 * (1 + i * .12))], tail: tl.map((v, i) => v * .12 * (1 + i * .1)), cape: tl[0] * .3 }, { alpha: al, rivets: al > .6 });
    g.restore(); out.monkey = { ...r, pose: mp, M: Mm };
  }
  // rod label and plaques on the cloth
  const SETS = buildSets();
  g.save(); g.globalCompositeOperation = 'multiply';
  if (st.label) { const l = st.label; g.save(); if (l.blur) g.filter = `blur(${l.blur * K}px)`; g.globalAlpha = l.alpha; set(g, mul(M, mul(TM(l.x, l.y), S(l.sc)))); g.drawImage(SETS.label.c, SETS.label.x0, SETS.label.y0, SETS.label.w, SETS.label.h); g.restore();
    const rp = ap(M, l.x - 240, l.y + 20); drawRods(g, [rp], [[rp[0] - 420 * K, rp[1] + 520 * K]], 2.4 * K, .5, 3 * K); g.globalCompositeOperation = 'multiply'; }
  if (opt.title) { const o = opt.title; g.save(); if (o.blur) g.filter = `blur(${o.blur * K}px)`; g.globalAlpha = o.alpha; set(g, mul(M, mul(TM(960, o.y), S(o.sc)))); g.drawImage(SETS.title.c, SETS.title.x0, SETS.title.y0, SETS.title.w, SETS.title.h); g.restore();
    if (o.alpha > .6) { const r = [[-460, 170], [460, 170]].map(([a, b]) => ap(M, 960 + a, o.y + b)); drawRods(g, r, r.map(p => [p[0] - 260 * K, p[1] + 900 * K]), 2.4 * K, .55, 3 * K); g.globalCompositeOperation = 'multiply'; } }
  if (opt.end) { const o = opt.end; g.save(); set(g, mul(M, mul(TM(o.x, o.y), S(o.sc)))); g.globalAlpha = o.alpha; g.drawImage(SETS.end.c, SETS.end.x0, SETS.end.y0, SETS.end.w, SETS.end.h); g.restore(); const r = [[-180, 200], [180, 200]].map(([a, b]) => ap(M, o.x + a, o.y + b)); drawRods(g, r, r.map(p => [p[0] - 220 * K, p[1] + 900 * K]), 2.4 * K, .5, 3 * K); }
  g.restore();
  return out;
}
// rods held by whom: returns {mF, mB, bF, bB, slackM, slackD} anchors (cloth-space results r.rods are already in M space)
function holds(t) {
  const h = { mF: null, mB: null, bF: null, bB: null, mSlack: false, dSlack: false };
  const mon = t >= T.monkeyIn && !(t >= T.outOfLight && t < T.rise), dem = t >= T.maidenIn && t <= T.tattersEnd;
  if (mon && t < T.handOpens) { h.mF = 'monkeyNeck'; h.mB = t < T.maidenIn ? 'monkeyHand' : null; }
  if (dem && t >= T.maidenIn && t < T.handOpens) h.mB = 'demonNeck';
  if (mon && t >= T.handOpens && t < T.grab) h.mSlack = true;
  if (dem && t >= T.handOpens) h.dSlack = true;
  if (mon && t >= T.grab && t < T.phoneOut) { h.bF = 'monkeyNeck'; h.bB = 'monkeyHand'; }
  if (mon && t >= T.phoneOut && t < T.taken0) { h.bB = 'monkeyNeck'; }
  if (mon && t >= T.tilt1) { h.bF = 'monkeyNeck'; h.bB = 'monkeyHand'; }
  if (t >= T.rodGiven && t < T.land1 + 1.4 && sceneryState(t).cloud) h.bF = 'cloud';
  return h;
}
function anchorWorld(name, show, Mw, t) {   // anchor in world B coordinates (show solved with Mw = cloth→world)
  if (name === 'monkeyNeck') return show.monkey?.rods[0]; if (name === 'monkeyHand') return show.monkey?.rods[1];
  if (name === 'demonNeck') return show.demon?.rods[0];
  if (name === 'cloud') { const c = sceneryState(t).cloud; return c ? ap(Mw, c.x + 60, c.y + 10) : null; }
  return null;
}
const unit = (a, b) => { const d = [b[0] - a[0], b[1] - a[1]], l = Math.hypot(...d) || 1; return [d[0] / l, d[1] / l]; };
function handFromRod(anchor, shoulder, L) { const u = unit(anchor, [shoulder[0], anchor[1] + 140]); return [anchor[0] + u[0] * L, anchor[1] + u[1] * L]; }
function localHand(p, shLocal, world) { const dx = (world[0] - p.x) * p.flip, dy = world[1] - p.y; const c = Math.cos(-p.rot), s = Math.sin(-p.rot); const lx = dx * c - dy * s, ly = dx * s + dy * c; return [lx - shLocal[0], ly - shLocal[1]]; }   // world → shoulder-relative local (undo flip and torso rotation)

// ================= backstage (world B) =================
function renderBack(t, cam, o) {
  const C = camM(cam), K = cam[2], SETS = buildSets(), L = lights(t);
  const tr = o.tr, fr = o.fr, gl = o.gl;
  tr.setTransform(1, 0, 0, 1, 0, 0); tr.fillStyle = '#fff'; tr.fillRect(0, 0, W, H);
  // solve the show once in world B (for the hands), then draw it on the cloth (clipped)
  const Mw = clothB();
  const show0 = drawShow(probe, Mw, t);
  const Mc = mul(C, Mw);
  tr.save(); tr.beginPath(); const r0 = ap(C, RECT_B[0], RECT_B[1]), r1 = ap(C, RECT_B[2], RECT_B[3]); tr.rect(r0[0], r0[1], r1[0] - r0[0], r1[1] - r0[1]); tr.clip();
  const show = drawShow(tr, Mc, t);
  tr.restore();
  // furniture: posts, bench, rack, stool
  tr.save(); tr.globalCompositeOperation = 'multiply';
  set(tr, mul(C, TM(130, -20))); tr.drawImage(SETS.post.c, SETS.post.x0, SETS.post.y0, SETS.post.w, SETS.post.h);
  set(tr, mul(C, TM(1900, -20))); tr.drawImage(SETS.post.c, SETS.post.x0, SETS.post.y0, SETS.post.w, SETS.post.h);
  set(tr, mul(C, TM(1600, 700))); tr.drawImage(SETS.bench.c, SETS.bench.x0, SETS.bench.y0, SETS.bench.w, SETS.bench.h);
  set(tr, mul(C, TM(1850, 60))); tr.drawImage(SETS.rack.c, SETS.rack.x0, SETS.rack.y0, SETS.rack.w, SETS.rack.h);
  if (t >= 11) { set(tr, mul(C, mul(TM(1440, 650), S(.55, .7)))); tr.drawImage(SETS.bench.c, SETS.bench.x0, SETS.bench.y0, SETS.bench.w, SETS.bench.h); }
  if (t >= 24) { set(tr, mul(C, mul(TM(1110, 730), S(.42, .62)))); tr.drawImage(SETS.bench.c, SETS.bench.x0, SETS.bench.y0, SETS.bench.w, SETS.bench.h); }
  // the rail along the bottom of the cloth
  tr.fillStyle = '#2a1408'; set(tr, C); tr.fillRect(RECT_B[0] - 30, RECT_B[3] - 2, RECT_B[2] - RECT_B[0] + 60, 14);
  tr.restore();
  // people: resolve hands from the rods they hold
  const hd = holds(t), mb = masterBody(t), bb = boyBody(t);
  const mSh = { F: [mb.x - 34 * 1, mb.y - 184], B: [mb.x + 8, mb.y - 190] }, bSh = { F: [bb.x - 26, bb.y - 122], B: [bb.x + 4, bb.y - 126] };
  const rods = [];   // [anchorWorld, gripViewport(after drawing)] pairs
  const want = (who, side, L) => { const name = hd[who + side]; if (!name) return null; const a = anchorWorld(name, show0, Mw, t); if (!a) return null; const sh = who === 'm' ? mSh[side] : bSh[side]; return { a, h: handFromRod(a, sh, L) }; };
  const mF = want('m', 'F', 250), mB = want('m', 'B', 300), bF = want('b', 'F', 210), bB = want('b', 'B', 230);
  let mp = { ...mb, expr: masterExpr(t), beard: SIM.masterBeard(t) };
  const trm = (mb.tremble || 0); const jit = trm ? [(vnoise(t * 19) - .5) * 14 * trm, (vnoise(t * 23 + 5) - .5) * 10 * trm] : [0, 0];
  const mFw = mF ? [mF.h[0] + jit[0], mF.h[1] + jit[1]] : mb.hFw ? [mb.hFw[0] + jit[0] * .5, mb.hFw[1] + jit[1] * .5] : [mb.x - 200, mb.y - 100];
  let mBw = mB ? [mB.h[0] + jit[0] * .7, mB.h[1] + jit[1] * .7] : mb.hBw ? mb.hBw : [mb.x - 180, mb.y - 60];
  if (t > T.tap - .5 && t < T.tap + .5 && bF) { const u = E(t, T.tap - .5, T.tap - .1) * (1 - E(t, T.tap + .15, T.tap + .5)); mBw = [lerp(mBw[0], bF.h[0] + 30, u), lerp(mBw[1], bF.h[1] + 36, u)]; }
  mp.hF = localHand(mp, [34, -184], mFw); mp.hB = localHand(mp, [-8, -190], mBw);
  if (mb.hBa != null) mp.haB = mb.hBa;
  if (mb.walk != null) { mp.lapA = .5 * Math.sin(mb.walk * 34); mp.shin = .3 + .3 * Math.sin(mb.walk * 34 + 1); }
  let bp = { ...bb, expr: boyExpr(t), tuft: SIM.boyTuft(t) };
  const bjit = bb.tense ? [(vnoise(t * 17 + 3) - .5) * 8, (vnoise(t * 21) - .5) * 6] : [0, 0];
  const bFw = bF ? [bF.h[0] + bjit[0], bF.h[1] + bjit[1]] : bb.hFw ? bb.hFw : [bb.x - 110, bb.y - 60];
  let bBw = bB ? [bB.h[0] + bjit[0] * .6, bB.h[1] + bjit[1] * .6] : bb.hBw ? bb.hBw : [bb.x - 100, bb.y - 40];
  if (t >= T.staffUp && t < T.victory && bB) { const u = E(t, T.staffUp, T.staffTop); bBw = [lerp(bB.h[0], LAMP[0] + 20, u * .75), lerp(bB.h[1], LAMP[1] + 110, u * .75)]; }
  bp.hF = localHand(bp, [26, -122], bFw); bp.hB = localHand(bp, [4, -126], bBw);
  if (bb.hFa != null) bp.haF = bb.hFa;
  const rm = drawMaster(tr, C, mp); const rb = drawBoy(tr, C, bp);
  // props in hands: the match, the jug, the phone
  if (t < 7 && mb.matchA != null) { const hv = ap(C, mFw[0], mFw[1]); drawMatch(fr, gl, C, mFw[0] - 4, mFw[1] + 6, mb.matchA, 1, t, L.match); o.matchTip = [mFw[0] - 4 - Math.sin(mb.matchA) * 56, mFw[1] + 6 - Math.cos(mb.matchA) * 56]; }
  if (t >= 7 && t < 11 && mb.jugA != null) { tr.save(); tr.globalCompositeOperation = 'multiply'; set(tr, mul(C, mul(TM(mFw[0] - 10, mFw[1] + 10), [Math.cos(mb.jugA), Math.sin(mb.jugA), -Math.sin(mb.jugA), Math.cos(mb.jugA), 0, 0]))); tr.drawImage(SETS.jug.c, SETS.jug.x0, SETS.jug.y0, SETS.jug.w, SETS.jug.h); tr.restore();
    for (const d of [T.drop1, T.drop2, T.drop3]) { const u = seg(t, d, d + .22); if (u > 0 && u < 1) { const p = ap(C, 1144 + 10, 120 + u * u * 60); fr.save(); fr.setTransform(1, 0, 0, 1, 0, 0); fr.fillStyle = '#1a0c06'; fr.beginPath(); fr.ellipse(p[0], p[1], 3 * K, 5 * K, 0, 0, 7); fr.fill(); fr.restore(); } } }
  if (bb.phone > 0) { const ph = bFw, a = bb.phone; tr.save(); tr.globalCompositeOperation = 'multiply'; tr.globalAlpha = a; const ang = bb.torch ? -1.2 : (t < 26 ? .9 : .3); set(tr, mul(C, mul(TM(ph[0] - 8, ph[1] + 18), [Math.cos(ang), Math.sin(ang), -Math.sin(ang), Math.cos(ang), 0, 0]))); tr.drawImage(SETS.phone.c, SETS.phone.x0, SETS.phone.y0, SETS.phone.w, SETS.phone.h); tr.restore();
    if (bb.phoneOn) phoneGlow(gl, C, ph[0] - 8, ph[1] + 18, 1, a * (bb.torch ? .9 * L.torch : .55), bb.torch ? 1 : 0); o.phonePos = [ph[0] - 8, ph[1] + 18]; }
  // rods: anchors (viewport) → grips
  const A = (name) => { const a = anchorWorld(name, show0, Mw, t); return a ? ap(C, a[0], a[1]) : null; };
  const rl = [];
  const pushRod = (name, grip, w) => { const a = A(name); if (a && grip) rl.push([a, [grip[0] + (grip[0] - a[0]) * .12, grip[1] + (grip[1] - a[1]) * .12]]); };
  if (hd.mF) pushRod(hd.mF, rm.gripF); if (hd.mB) pushRod(hd.mB, rm.gripB); if (hd.bF) pushRod(hd.bF, rb.gripF); if (hd.bB) pushRod(hd.bB, rb.gripB);
  const railY = ap(C, 0, RECT_B[3])[1];
  if (hd.mSlack) { for (const n of ['monkeyNeck', 'monkeyHand']) { const a = A(n); if (a) rl.push([a, [a[0] + (n === 'monkeyHand' ? 18 : -14) * K + Math.sin(t * 2.1) * 8 * K, Math.max(a[1] + 120 * K, railY)]]); } }
  if (hd.dSlack) { const a = A('demonNeck'); if (a) rl.push([a, [a[0] + 10 * K + Math.sin(t * 1.7 + 1) * 6 * K, Math.max(a[1] + 160 * K, railY)]]); }
  if (t >= T.phoneOut && t < T.tilt1 && show0.monkey) { const a = A('monkeyHand'); if (a) rl.push([a, [a[0] + 40 * K, Math.max(a[1] + 200 * K, railY)]]); }
  drawRods(tr, rl.map(r => r[0]), rl.map(r => r[1]), 1.6 * K, .72, 3.2 * K);
  // the oil lamp (front + glow) at its hook, or in the hands at the hand-over
  let lampPos = LAMP;
  if (t >= T.lampLift) { const dn = E(t, T.lampLift, T.lampOut), tk = E(t, T.taken0, T.taken1); lampPos = [lerp(LAMP[0], 1180, dn), lerp(LAMP[1], 500, dn)]; if (tk > 0) lampPos = [lerp(1180, 1172, tk), lerp(500, 530, tk)]; }
  if (t >= T.tilt1) lampPos = LAMP;
  const held = t >= T.lampLift && t < T.tilt1;
  drawLamp(fr, gl, C, lampPos[0], lampPos[1], 1.1, t, L.lamp * (t >= T.out && t < T.tilt1 ? .35 : 1), held ? 26 : 90, { gutter: seg(t, T.gutter, T.out) * (t < T.out ? 1 : 0) });
  const lampV = ap(C, lampPos[0] + 44, lampPos[1] - 14);
  drawBackRoom(fr, C, lampV, clamp(L.lamp, .25, 1) * (t > T.walkOff ? .6 : 1));
  o.lampPos = lampPos;
  // lamps for the compositor
  const lamps = [];
  const hot = cloth2B(820, 420);
  lamps.push({ x: lampPos[0] + 44, y: lampPos[1] - 14, I: L.lamp * (held ? 2.2 : .55), hot: .35, sigB: held ? 520 : 640, sigC: 110, col: WARM });
  lamps.push({ x: held ? lampPos[0] : hot[0], y: held ? lampPos[1] : hot[1], I: L.lamp * (held ? .5 : .95), hot: .5, sigB: 430, sigC: 160, col: WARM, box: RECT_B, soft: 26 });
  if (L.match > 0 && o.matchTip) lamps.push({ x: o.matchTip[0], y: o.matchTip[1], I: L.match * .55, hot: 2.2, sigB: 120, sigC: 26, col: [1, .62, .32] });
  if (o.phonePos && bb.phoneOn) { if (bb.torch) lamps.push({ x: o.phonePos[0], y: o.phonePos[1], I: L.torch * 1.0, hot: 1.4, sigB: 300, sigC: 70, col: COOL }); else lamps.push({ x: o.phonePos[0], y: o.phonePos[1] - 10, I: .32, hot: 1.2, sigB: 120, sigC: 32, col: COOL }); }
  if (o.dawn) { lamps.length = 0; lamps.push({ x: 670, y: 338, I: 1.25, hot: 0, sigB: 900, sigC: 100, col: [1, .93, .8], box: RECT_B, soft: 30 }); lamps.push({ x: 600, y: 300, I: .18, hot: 0, sigB: 1400, sigC: 100, col: [1, .95, .85] }); }
  return { cam, lamps, amb: o.dawn ? [.07, .065, .06] : (t > T.out && t < T.tilt0 ? [.05, .036, .026] : [.028, .02, .014]), expo: o.dawn ? 1.25 : 1.3, rect: RECT_B, edge: 40, vign: .5, bloom: .3 };
}
// ================= the square (world F) and dawn =================
function renderFront(t, cam, o) {
  const C = camM(cam), K = cam[2], SETS = buildSets(), L = lights(t);
  const tr = o.tr, fr = o.fr, gl = o.gl, dawn = !!o.dawn;
  tr.setTransform(1, 0, 0, 1, 0, 0); tr.fillStyle = '#fff'; tr.fillRect(0, 0, W, H);
  tr.save(); tr.globalCompositeOperation = 'multiply';
  const put = (p, x, y, sc = 1) => { set(tr, mul(C, mul(TM(x, y), S(sc)))); tr.drawImage(p.c, p.x0, p.y0, p.w, p.h); };
  put(SETS.groundF, 0, 0); put(SETS.tree, 230, 772); put(SETS.roofs, 1420, 764); put(SETS.booth, 0, 0);
  if (dawn) put(SETS.dog, 1500 + 60 * Math.sin(t * .3), 760);
  const sag = x => 150 + 60 * Math.sin(Math.PI * x / 1920);
  for (const x of [160, 480, 800, 1120, 1440, 1760]) put(SETS.lantern, x, sag(x) + 12 * Math.sin(t * .8 + x), .95);
  tr.strokeStyle = '#2a1408'; tr.lineWidth = 2; set(tr, C); tr.beginPath(); tr.moveTo(-40, 148); for (let x = 0; x <= 1960; x += 40) tr.lineTo(x, sag(x) - 36); tr.stroke();
  tr.restore();
  // the show, clipped to the cloth
  const Mc = mul(C, clothF());
  tr.save(); tr.beginPath(); const r0 = ap(C, RECT_F[0], RECT_F[1]), r1 = ap(C, RECT_F[2], RECT_F[3]); tr.rect(r0[0], r0[1], r1[0] - r0[0], r1[1] - r0[1]); tr.clip();
  const sopt = {};
  if (t >= T.titleIn && t < T.titleOut + 1) { const up = eo(seg(t, T.titleIn, T.titleIn + .55)), off = seg(t, T.titleOut, T.titleOut + .9); sopt.title = { y: lerp(640, 540, up) - off * 40, sc: (1 + (1 - up) * 1.4) * (1 + ei(off) * .7), blur: (1 - up) * 30 + ei(off) * 28, alpha: (.3 + .7 * up) * (1 - ei(off)) }; }
  if (t >= T.endIn) { const up = eo(seg(t, T.endIn, T.endIn + .6)); sopt.end = { x: 470, y: lerp(600, 500, up), sc: 1 + (1 - up) * 1.2, alpha: .3 + .7 * up }; }
  const show = drawShow(tr, Mc, t, sopt);
  // rods from the front: toward the lower left (the puppeteers' side), or hanging when nobody holds them
  const hd = holds(t), Kc = scaleOf(Mc), rl = [];
  const held = n => { const a = n === 'monkeyNeck' ? show.monkey?.rods[0] : n === 'monkeyHand' ? show.monkey?.rods[1] : n === 'demonNeck' ? show.demon?.rods[0] : null; return a; };
  for (const n of ['monkeyNeck', 'monkeyHand', 'demonNeck']) { const a = held(n); if (!a) continue; const isHeld = [hd.mF, hd.mB, hd.bF, hd.bB].includes(n); if (isHeld) rl.push([a, [a[0] - 700 * Kc, a[1] + 1000 * Kc]]); else if ((n !== 'demonNeck' && hd.mSlack) || (n === 'demonNeck' && hd.dSlack) || (n === 'monkeyHand' && t >= T.phoneOut && t < T.tilt1)) rl.push([a, [a[0] + 6 * Kc * Math.sin(t * 2), a[1] + 1200 * Kc]]); }
  if (show.monkey && t >= T.grab && t < T.phoneOut) { const a = show.monkey.rods[1]; rl.push([a, [a[0] - 700 * Kc, a[1] + 1000 * Kc]]); }
  if (sceneryState(t).cloud && hd.bF === 'cloud') { const c = sceneryState(t).cloud; const a = ap(Mc, c.x + 60, c.y + 10); rl.push([a, [a[0] - 900 * Kc, a[1] + 900 * Kc]]); }
  drawRods(tr, rl.map(r => r[0]), rl.map(r => r[1]), 2.2 * Kc, .55, 3.2 * Kc);
  tr.restore();
  // front: the booth frame and the crowd
  drawBooth(fr, C, dawn ? .25 : clamp(L.lamp, 0, 1) * .9 + .3 * (lights(t).torch));
  if (!dawn) drawCrowd(fr, C, { t, laugh: o.laugh || 0, cheer: o.cheer || 0 });
  // lamps
  const lamps = [];
  if (!dawn) {
    for (const x of [160, 480, 800, 1120, 1440, 1760]) lamps.push({ x, y: sag(x) + 12 * Math.sin(t * .8 + x), I: .5 * (1 + .05 * Math.sin(t * 9 + x)), hot: 1.1, sigB: 150, sigC: 26, col: [1, .6, .3] });
    const hot = cloth2F(820, 420);
    lamps.push({ x: hot[0], y: hot[1], I: L.lamp * .95, hot: .5, sigB: 360, sigC: 130, col: WARM, box: RECT_F, soft: 22 });
    if (t > T.eyeFlare - .15 && t < T.eyeFlare + 1.1 && show.monkey) { const k = E(t, T.eyeFlare - .15, T.eyeFlare + .1) * (1 - E(t, T.eyeFlare + .6, T.eyeFlare + 1.1)); const e = show.monkey.eye, ex = (e[0] - C[4]) / C[0], ey = (e[1] - C[5]) / C[3]; lamps.push({ x: ex, y: ey, I: .55 * k, hot: 2.6, sigB: 24, sigC: 7, col: [1, .86, .45], box: RECT_F, soft: 10 }); }
    if (L.torch > 0) { const tp = cloth2F(60, 960); lamps.push({ x: tp[0], y: tp[1], I: L.torch * 1.3, hot: 1.4, sigB: 290, sigC: 70, col: COOL, box: RECT_F, soft: 22 }); }
  } else {
    lamps.push({ x: 960, y: 300, I: 1.0, hot: 0, sigB: 2600, sigC: 100, col: [1, .92, .76] });
    lamps.push({ x: 960, y: 475, I: .55, hot: 0, sigB: 800, sigC: 100, col: [1, .95, .85], box: RECT_F, soft: 24 });
  }
  return { cam, lamps, amb: dawn ? [.2, .185, .16] : [.04, .028, .018], expo: dawn ? 1.15 : 1.35, rect: RECT_F, edge: 26, vign: dawn ? .3 : .5, bloom: dawn ? .18 : .34, vcol: dawn ? [.8, .72, .62] : [.7, .47, .25] };
}

// ================= cameras =================
// show-cloth cameras: [cx, cy, z] in cloth units → world F camera (z 1 = the cloth fills the frame)
const cc = (cx, cy, z) => { const p = cloth2F(cx, cy); let zf = z * 1920 / (RECT_F[2] - RECT_F[0]); let c = [p[0], p[1], zf]; if (z >= 1) { c[0] = clamp(c[0], RECT_F[0] + 960 / zf, RECT_F[2] - 960 / zf); c[1] = clamp(c[1], RECT_F[1] + 540 / zf, RECT_F[3] - 540 / zf); } return c; };
const L3 = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
function camera(t) {
  const [t0, t1, id] = shotAt(t), u = seg(t, t0, t1);
  const mp = monkeyPose(t), dp = demonPose(t);
  switch (id) {
    case 'match': return [1178, 322, 2.6];
    case 'lamp': return [lerp(1170, 1150, E(t, 3.0, 4.2)), lerp(300, 210, E(t, 3.0, 4.2)), 2.2];
    case 'jug': return [1300, 400, lerp(1.4, 1.36, u)];
    case 'title': return cc(960, 540, lerp(.98, 1.0, u));
    case 'square': return [lerp(760, 1160, ss(u)), 560, .95];
    case 'beckon': return [1250, 470, 1.55];
    case 'boyPhone': return [1062, 528, 2.8];
    case 'rodHand': return [1180, 450, 2.3];
    case 'seat': { const p = E(t, T.pushIn, t1); return L3([960, 540, 1.1], cc(960, 540, 1.0), p); }
    case 'entrance': { const cz = back(seg(t, t1 > T.monkeyIn ? T.monkeyIn : t0, T.monkeyIn + 3 / 24), 1.3); return L3(cc(960, 540, 1.0), cc(640, 420, 1.55), cz).map((v, i) => i === 2 ? v - .04 * E(t, T.freeze1, t1) : v); }
    case 'handsTwist': return [1090, 340, 2.2];
    case 'flip': { const x = mp ? mp.x : 900; return cc(lerp(640, x, .6), 520, 1.25); }
    case 'maiden': return cc(960, 600, 1.3);
    case 'laugh': return [lerp(860, 900, u), 905, 2.0];
    case 'eye': { const w = E(t, T.whip1, T.whip1 + .5); return L3(cc(1174, 490, 2.6), cc(760, 590, 2.5), w); }
    case 'swap': return cc(770, 590, lerp(2.5, 2.3, u));
    case 'boyHooked': return [1110, 540, 2.2];
    case 'fight': { const mx = mp ? mp.x : 1000, dx = dp ? dp.x : 700; return cc((mx + dx) / 2, 580, 1.15); }
    case 'handsFight': return [1075, 410, 2.0];
    case 'leap': { const x = mp ? mp.x : 700; return cc(lerp(760, x, .5), 540, lerp(1.2, 1.3, E(t, T.land2, T.land2 + .6))); }
    case 'claws': return cc(lerp(760, 720, u), 580, lerp(1.9, 2.15, u));
    case 'handsTremor': return [1085, 400, 2.3];
    case 'faceMaster': return [1392, 385, lerp(2.5, 2.65, u)];
    case 'handOpens': return [1095, 430, 2.6];
    case 'fall': { const y = mp ? mp.y : GYv(); return cc(500, lerp(600, 700, E(t, T.fall, T.outOfLight)), 1.4); }
    case 'faceBoy': return [1062, 528, 2.8];
    case 'magic': return [lerp(840, 800, u), 440, lerp(1.0, .98, u)];
    case 'giant': return cc(960, 540, 1.0);
    case 'resolve': { const b = boyBody(t); return [b.x - 36, b.y - 192, lerp(2.6, 2.75, u)]; }
    case 'grab': return [900, 520, 2.4];
    case 'flail': return cc(420, 600, 1.3);
    case 'tongue': return [1120, 400, 2.0];
    case 'tap': return [1100, 470, 2.4];
    case 'cleanFlip': { const x = mp ? mp.x : 420; return cc(lerp(400, x, .6), 540, 1.25); }
    case 'staffUp': return [1010, 330, 1.4];
    case 'strike': { const w = E(t, T.whip2, T.strike - .1), cz = back(seg(t, T.strike, T.strike + 3 / 24), 1.3); return L3(L3(cc(520, 300, 1.3), cc(700, 560, 1.15), w), cc(700, 600, 1.3), cz * (t >= T.strike ? 1 : 0)); }
    case 'liftoff': return cc(lerp(680, 620, u), 520, 1.15);
    case 'crowdCheer': return [1040, 890, 1.9];
    case 'gutter': return [1130, 180, 2.4];
    case 'pocketLook': return [1066, 350, 2.8];
    case 'torch': return [1080, 430, lerp(1.5, 1.45, u)];
    case 'stageLit': return [960, 560, lerp(1.12, 1.18, u)];
    case 'straighten': return [1290, 420, 1.5];
    case 'handover': return [1200, 350, lerp(2.0, 2.1, u)];
    case 'walkoff': return [lerp(1000, 980, u), 460, lerp(1.0, .86, ss(u))];
    case 'dawnWide': return [960, lerp(880, 480, E(t, T.tilt0, T.tilt1)), 1.0];
    case 'dawnBack': return [920, 420, 1.4];
    case 'dawnEnd': return cc(760, 560, 1.1);
  }
  return [960, 540, 1];
}
const GYv = () => 654;
// ================= the frame =================
export function frame(t, tr, fr, gl) {
  const [t0, t1, id, setId] = shotAt(t), cam = camera(t);
  const o = { tr, fr, gl, dawn: setId === 'D' || setId === 'E' };
  if (setId === 'F' || setId === 'D') { o.laugh = E(t, T.laugh - .3, T.laugh + .3) * (1 - E(t, T.laugh + 2.2, T.laugh + 2.6)) + .6 * E(t, T.skullHit, T.skullHit + .3) * (1 - E(t, T.skullHit + 1.8, T.skullHit + 2.3)); o.cheer = E(t, T.childStands - .2, T.childStands + .8) * (t < T.gutter ? 1 : 0) + E(t, T.stageLit, T.stageLit + .6); }
  let out = (setId === 'B' || setId === 'E') ? renderBack(t, cam, o) : renderFront(t, cam, o);
  // transitions: a flash to warm white when the stage lights back up; black until the match
  out.fade = 0; out.fadeCol = [0, 0, 0];
  if (t < T.match) { out.fade = 1; }
  if (id === 'stageLit') { const f = 1 - E(t, T.stageLit, T.stageLit + .35); out.fade = f * .85; out.fadeCol = [1, .9, .7]; }
  if (id === 'walkoff') { out.fade = E(t, T.walkEnd - .2, 129.0) * .9; out.fadeCol = [.04, .025, .02]; }
  if (id === 'dawnWide') { out.fade = (1 - E(t, 129.0, 129.9)) * .9; out.fadeCol = [.9, .85, .75]; }
  // the pillar wipes at the two truck-rounds (into backstage at 34.5 and 66.18)
  for (const tt of [34.5, 66.18]) { const w = seg(t, tt - .25, tt + .25); if (w > 0 && w < 1) { drawPillar(fr, lerp(2500, -600, w)); } }
  // placards
  for (const s of PLACARDS) if (t >= s.t0 && t < s.t1) { const a = Math.min(E(t, s.t0, s.t0 + .2), 1 - E(t, s.t1 - .25, s.t1)); drawPlacard(fr, s.text, a, 1 - eo(seg(t, s.t0, s.t0 + .22))); }
  return out;
}
function drawPillar(g, x) {
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.filter = 'blur(14px)';
  const w = 1300, gr = g.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
  gr.addColorStop(0, 'rgba(12,4,3,0)'); gr.addColorStop(.1, '#120604'); gr.addColorStop(.45, '#3a1009'); gr.addColorStop(.55, '#2a0b07'); gr.addColorStop(.9, '#0e0503'); gr.addColorStop(1, 'rgba(12,4,3,0)');
  g.fillStyle = gr; g.fillRect(x - w / 2, -40, w, 1160);
  g.globalCompositeOperation = 'lighter'; const rg = g.createLinearGradient(x - w / 2, 0, x - w / 2 + 160, 0); rg.addColorStop(0, 'rgba(255,160,80,0)'); rg.addColorStop(.6, 'rgba(255,160,80,.16)'); rg.addColorStop(1, 'rgba(255,160,80,0)'); g.fillStyle = rg; g.fillRect(x - w / 2, -40, 200, 1160);
  g.restore();
}
// ================= texts for readcheck =================
export function texts(t) {
  const out = [];
  for (const s of PLACARDS) if (t >= s.t0 && t < s.t1) { const w = s.text.length * 47 + 140; out.push({ id: s.id, text: s.text, x0: 960 - w / 2, y0: 1080 - 130, x1: 960 + w / 2, y1: 1080 - 60 }); }
  for (const p of PLAQUES) if (t >= p.t0 + .6 && t < p.t1) out.push({ id: p.id, text: p.text, x0: 400, y0: 380, x1: 1520, y1: 700 });
  return out;
}
// ================= sound events =================
export function events() {
  const ev = [], add = (type, t, o = {}) => ev.push({ type, t: +(+t).toFixed(3), ...o });
  add('crickets', 0, { d: T.cricketsOut }); add('room', 0, { d: DUR });
  add('match', T.match); add('ignite', T.lampOn); add('matchout', 5.5);
  add('drop', T.drop1); add('drop', T.drop2); add('drop', T.drop3); add('jugtap', T.jugTap); add('jugdown', 10.3);
  add('phonetap', 7.6); add('phonetap', 8.1); add('phonetap', 8.7); add('phonetap', 9.3); add('phonetap', 22.4);
  add('presson', T.titleIn, { v: 1 }); add('liftoff', T.titleOut);
  add('murmur', T.squareIn, { d: T.hardCut - T.squareIn, v: 1 });
  add('cloth', T.pocket); add('rodtap', T.rodGiven); add('clap', T.clap1); add('clap', T.clap2); add('clap', T.clap3);
  add('presson', T.mountain, { v: .8 }); add('presson', T.pine, { v: .6 }); add('rodtap', T.cloudIn, { v: .5 }); add('flap', T.cloudFlip); add('rodtap', T.cloudFlip + .4, { v: .4 });
  add('presson', T.monkeyIn, { v: 1 }); add('presson', T.labelIn, { v: .5 }); add('liftoff', T.labelOut, { v: .6 });
  add('creak', T.twist, { d: .2 }); add('flap', T.flip1, { v: .7 }); add('land', T.land1); add('twirl', T.twirl1, { d: 1.0 }); add('liftoff', T.cloudOff, { v: .5 });
  add('presson', T.maidenIn, { v: .8 }); for (let k = 0; k < 6; k++) add('step', T.maidenIn + .3 + k * .25, { v: .4 });
  add('laugh', T.laugh, { d: 2.4 }); add('rodtap', T.headTurn, { v: .4 }); add('flare', T.eyeFlare); add('scrape', T.eyeFlare + .05);
  add('swap', T.headSwap); add('flap', T.headSwap + .3, { v: .6 }); add('flap', T.boyO + 1.1, { v: .5 });
  for (const h of [T.hit1, T.hit2, T.hit3, T.hit4]) { add('whoosh', h - .12); add('thwack', h); }
  add('hop', T.hit1 - .45); add('hop', T.hit2 - .45); add('creak', T.tremble1, { d: .5, v: .6 }); add('rattle', T.tremble1, { d: .5, v: .6 });
  add('hop', T.leap); add('whoosh', T.leap + .1, { v: .8 }); add('land', T.land2); add('thwack', T.demonBack, { v: .7 }); add('creak', T.clawsUp, { d: .4, v: .5 });
  add('rattle', T.tremor, { d: T.handOpens - T.tremor, v: 1 }); add('rodslip', T.rodsSlip); add('fallflap', T.fall); add('gasp', T.gasp);
  add('magic', T.rise, { d: T.grab - T.rise }); add('creak', T.grow, { d: 2.0, v: .8 }); add('thud', T.clawDown);
  add('grab', T.grab); add('snap', T.snapBack); add('flap', T.jerk, { v: .8 });
  for (let k = 0; k < 7; k++) add('clatter', T.flail0 + k * .5, { v: .5 + .2 * (k % 2) }); add('skull', T.skullHit); add('laugh', T.skullHit + .2, { d: 1.8, v: .6 });
  add('handtap', T.tap); add('flap', T.flip2, { v: .7 }); add('land', T.land3); add('twirl', T.twirl2, { d: 1.2 });
  add('staffrise', T.staffUp, { d: T.staffTop - T.staffUp }); add('bigwhoosh', T.whip2, { d: T.strike - T.whip2 }); add('strike', T.strike);
  add('liftoff', T.skullOff, { v: 1 }); add('tatters', T.skullOff + .4, { d: 1.6 }); add('cheer', T.childStands, { d: T.gutter - T.childStands + .4, v: .6 });
  add('gutter', T.gutter, { d: T.out - T.gutter }); add('pfft', T.out); add('murmur', T.out + .3, { d: T.torch - T.out, v: .5 });
  add('cloth', T.hand2); add('phoneout', T.phoneOut); add('click', T.click); add('torchon', T.torch); add('cloth', T.raised, { v: .6 });
  add('cheer', T.stageLit, { d: 5.5, v: 1 }); add('applause', T.bigGong, { d: 6.0 });
  add('creak', T.straighten, { d: .8, v: .6 }); add('chain', T.lampLift); add('lamphand', T.taken0);
  add('steps', T.walkOff, { d: T.walkEnd - T.walkOff }); add('birds', T.birds, { d: DUR - T.birds });
  add('creak', T.twist2, { d: .2, v: .5 }); add('flap', T.flip3, { v: .6 }); add('land', T.land4, { v: .8 }); add('presson', T.endIn, { v: .7 });
  return ev.sort((a, b) => a.t - b.t);
}
