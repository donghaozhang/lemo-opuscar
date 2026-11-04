// Shots: DRIVE · BILL · DRONE (night neon street in the typhoon).
import { cel, path, poly, line, rgba, mix, airbrush, vgrad, TAU, W, H, LWK } from './cel.js';
import { PAL } from './pal.js';
import { head } from './heads.js';
import { figure } from './people.js';
import { mech, drone, lunchbox } from './mech.js';
import { rain, flare, lamp, speedLines, trail } from './fx.js';
import { drawLoop, neonText, neonRect } from './plates.js';
import { hud } from './ui.js';
import { rainOn, flash, wetFloor, cockpit, levelGauge } from './shotsA.js';
import { HIT, SEC, at, q12, q8, TXT } from './timeline.js';
import { K, clamp, lerp, ss, eo, ei, seg, hash } from './lib.js';
const N = PAL.night;

// the street: sky, skyline, street front, wet road with reflections; x = scroll (px), y0 = road top
function street(S, x, o = {}) {
  const { g, e, A } = S, y0 = o.y0 ?? 760;
  g.drawImage(A.storm.c, -((x * .05) % 400) - 200, -300); e.drawImage(A.storm.e, -((x * .05) % 400) - 200, -300);
  drawLoop(g, A.sky.c, A.sky.w, -x * .25, y0 - 760 + 120, A.sky.w, A.sky.h); drawLoop(e, A.sky.e, A.sky.w, -x * .25, y0 - 760 + 120, A.sky.w, A.sky.h);
  drawLoop(g, A.street.c, A.street.w, -x * .6, y0 - 700, A.street.w, A.street.h); drawLoop(e, A.street.e, A.street.w, -x * .6, y0 - 700, A.street.w, A.street.h);
  vgrad(g, 0, y0, W, H - y0, [[0, '#1a1030'], [1, '#0a0614']]);
  drawLoop(g, A.refl.c, A.refl.w, -x * .6, y0, A.refl.w, A.refl.h); drawLoop(e, A.refl.e, A.refl.w, -x * .6, y0, A.refl.w, A.refl.h);
  // lane markings
  for (let i = -1; i < 8; i++) { const lx = ((i * 320 - x * 1.0) % 2560 + 2560) % 2560 - 320; g.fillStyle = rgba('#e8e0f0', .35); g.fillRect(lx, y0 + 200, 160, 10); }
}
function car(g, e, x, y, s, col, dir = 1) {
  g.save(); g.translate(x, y); g.scale(s * dir, s);
  cel(g, path([[-160, 0], [-170, -50, 1], [-110, -60], [-60, -110], [70, -110], [120, -60], [170, -50, 1], [170, 0, 1]]), { f: col, s: mix(col, '#000000', .45), so: [-10, -8], h: mix(col, '#ffffff', .35), ho: [4, 4], l: mix(col, '#000000', .7), lw: 3 });
  cel(g, path([[-50, -100], [60, -100], [100, -60], [-90, -60]]), { f: '#2a3a6a', h: '#8ab0ff', hi: [[[-30, -96], [0, -96], [-30, -64], [-60, -64]]], l: '#0a0a1a', lw: 2 });
  for (const wx of [-100, 100]) { const w = new Path2D(); w.arc(wx, 0, 34, 0, TAU); cel(g, w, { f: '#16161e', l: '#05050a', lw: 3 }); }
  g.restore();
  lamp(g, e, x - 165 * s * dir, y - 40 * s, 14 * s, '#ff3a3a', 1);
  lamp(g, e, x + 165 * s * dir, y - 40 * s, 16 * s, '#fff2c0', 1);
}

// ================================================================ DRIVE
export function sideTrack(S) {
  const { g, e, t, lt, sh } = S, leg2 = sh.opt.leg === 2, v = leg2 ? 1900 : 1300, x = (leg2 ? 9000 : 0) + lt * v;
  street(S, x);
  // cars passing the other way and being overtaken
  for (let i = 0; i < 3; i++) { const cx = ((i * 900 - lt * (leg2 ? 1300 : 700)) % 2700 + 2700) % 2700 - 400; car(g, e, cx, 900, .9, ['#3a8ad0', '#d04a6a', '#e0e0e0'][i], -1); trail(g, e, [[cx + 150, 864], [cx + 600, 864]], '#ff3a3a', 6); }
  const walk = (lt * (leg2 ? 2.4 : 1.8)) % 1;
  mech(g, e, N, { x: 760, y: 980, s: .95, view: 'side', walk, eyes: 1, beacon: Math.floor(t * 4) % 2, steam: t, lean: .12, armL: { a1: Math.sin(walk * TAU) * .5, a2: -.6, pose: 'fist' }, armR: { a1: -Math.sin(walk * TAU) * .5, a2: -.6, pose: 'fist' } });
  // splashes at each footfall
  const ph = (walk * 2) % 1; if (ph < .25) for (let k = 0; k < 8; k++) { const a = -Math.PI * (k / 7); line(g, [[760 + Math.cos(a) * 60, 990 + Math.sin(a) * 30], [760 + Math.cos(a) * (100 + ph * 200), 990 + Math.sin(a) * (60 + ph * 120)]], rgba('#cfe3ff', .6), 4); }
  // foreground lamp posts (fast parallax)
  for (let i = 0; i < 3; i++) { const px = ((i * 900 - x * 1.6) % 2700 + 2700) % 2700 - 300; g.fillStyle = '#0c0a14'; g.fillRect(px, 0, 36, H); lamp(g, e, px + 18, 120, 30, '#ffd890', .9); }
  if (leg2) speedLines(g, Math.floor(t * 12), { type: 'h', n: 60, col: '#ffffff', a: .4 });
  rainOn(S, { n: 300, ang: .5, a: .3 });
  return {};
}
const pilotFace = (Pp, expr, o = {}) => g => { g.save(); g.translate(o.x ?? 880, o.y ?? 470); g.scale(o.s ?? 2.5, o.s ?? 2.5); LWK.k = .75; head(g, Pp, 'g', { view: 'q', expr, look: o.look, E: o.E }); LWK.k = 1; g.restore(); };
export function bands(S) {
  const { g, e, t } = S;
  cockpit(g, e, N, t, { lights: 1, steady: true, box: true, rainGlass: true, pilot: pilotFace(N, 'fierce', { look: [.5, 0] }),
    outside: (gg, ee) => { for (let i = 0; i < 6; i++) airbrush(gg, ((i * 400 - t * 900) % 2400 + 2400) % 2400 - 200, 300 + hash(i) * 300, 120, 80, ['#ff3fa4', '#35e7ff', '#ffd23f'][i % 3], .4); } });
  // neon light bands sweeping across the held cel (source-atop)
  g.save(); g.globalCompositeOperation = 'source-atop';
  for (let i = 0; i < 3; i++) { const bx = ((t * 1600 + i * 900) % 2800) - 500; const col = ['#ff3fa4', '#35e7ff', '#ffd23f'][i]; const gr = g.createLinearGradient(bx - 140, 0, bx + 140, 0); gr.addColorStop(0, rgba(col, 0)); gr.addColorStop(.5, rgba(col, .32)); gr.addColorStop(1, rgba(col, 0)); g.fillStyle = gr; g.beginPath(); g.moveTo(bx - 200, 0); g.lineTo(bx + 100, 0); g.lineTo(bx + 300, H); g.lineTo(bx, H); g.fill(); }
  g.restore();
  return {};
}
export function charge(S) {
  const { g, e, t, lt, u } = S, tq = q12(t);
  street(S, 4000 + lt * 300, { y0: 700 });
  speedLines(g, Math.floor(t * 12), { type: 'radial', cx: 960, cy: 560, n: 110, col: '#ffffff', a: .55, r0: 260 });
  // cars swerving aside at HIT.swerve
  const sw = seg(t, HIT.swerve - .2, HIT.swerve + .4);
  car(g, e, 960 - 600 - sw * 500, 980, 1.3, '#d04a6a', 1); car(g, e, 960 + 640 + sw * 500, 1000, 1.4, '#3a8ad0', -1);
  const s = lerp(1.0, 1.7, eo(u)), walk = (lt * 2.2) % 1;
  mech(g, e, N, { x: 960, y: 1180 + s * 40, s, walk, eyes: 1, beacon: Math.floor(t * 4) % 2, lean: -.05, armL: { a1: .4 + Math.sin(walk * TAU) * .3, a2: -.5, pose: 'fist' }, armR: { a1: -.4 + Math.sin(walk * TAU) * .3, a2: .5, pose: 'fist' }, cockLight: .4,
    cockpit: gg => { gg.scale(.42, .42); head(gg, N, 'g', { view: 'front', expr: 'fierce' }); } });
  rainOn(S, { n: 260, ang: .05, a: .35 });
  return {};
}
export function boxInsert(S) {
  const { g, e, t } = S;
  vgrad(g, 0, 0, W, H, [[0, '#10101e'], [1, '#1a1a2a']]);
  for (let i = 0; i < 10; i++) { const c = ['#ff3fa4', '#35e7ff', '#ffd23f'][i % 3]; const bx = ((hash(i) * W - t * 300 * (1 + hash(i + 3))) % (W + 300) + W + 300) % (W + 300) - 150; airbrush(g, bx, hash(i + 5) * 700, 70, 70, c, .4, .15); airbrush(e, bx, hash(i + 5) * 700, 60, 60, c, .25); }
  // the holder strap
  cel(g, poly([[640, 820], [1280, 820], [1280, 880], [640, 880]]), { f: N.mechDark.f, s: N.mechDark.s, so: [0, -6], l: N.mechDark.l, lw: 3 });
  lunchbox(g, N, 960, 640, 2.8, { steam: t });
  line(g, [[700, 600], [1220, 600]], '#2a2a34', 18); line(g, [[700, 600], [1220, 600]], '#4a4a5a', 4);
  levelGauge(g, e, 1550, 900, 1.6, Math.sin(t * 9) * .08, 1);
  return {};
}
export function overhead(S) {
  const { g, e, t, A, u } = S;
  g.drawImage(A.storm.c, -200, -500); e.drawImage(A.storm.e, -200, -500);
  // a high wide over rooftops: skyline layers, a lit avenue, the mech small crossing it
  drawLoop(g, A.sky.c, A.sky.w, -600 - u * 80, 360, A.sky.w * 1.2, A.sky.h * 1.2); drawLoop(e, A.sky.e, A.sky.w, -600 - u * 80, 360, A.sky.w * 1.2, A.sky.h * 1.2);
  vgrad(g, 0, 860, W, 220, [[0, '#2a1a3a'], [1, '#120a1e']]);
  for (let i = 0; i < 30; i++) { const lx = (i * 97 + t * 40) % W; lamp(g, e, lx, 880 + (i % 3) * 30, 6, ['#fff2c0', '#ff3a3a'][i % 2], .9); }
  mech(g, e, N, { x: lerp(500, 1300, u), y: 940, s: .32, view: 'side', walk: (t * 1.8) % 1, eyes: 1, beacon: Math.floor(t * 4) % 2 });
  lamp(g, e, lerp(500, 1300, u), 940 - 664 * .32, 30, '#ff9a2a', Math.floor(t * 4) % 2);
  rainOn(S, { n: 200, ang: .3, a: .25 });
  return {};
}

// ================================================================ BILL (the billboard)
function billboardSign(g, e, x, y, s, rot, on = 1) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  cel(g, poly([[-420, -170], [420, -170], [420, 170], [-420, 170]]), { f: '#1a1226', s: '#0e0a16', so: [-8, -8], l: '#05030a', lw: 4 });
  for (let i = 0; i < 4; i++) line(g, [[-380 + i * 250, 170], [-380 + i * 250, 420]], '#3a3448', 16);
  g.restore();
  if (on) { g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s); neonRect(g, null, -390, -140, 780, 280, '#ff3fa4', 20); g.restore();
    const M = new DOMMatrix().translate(x, y).rotate(rot * 180 / Math.PI).scale(s, s);
    g.save(); g.setTransform(g.getTransform().multiply(M)); neonText(g, null, TXT.bill, 0, 0, 170, '#ffd23f');
    g.font = '170px "ZCOOL QingKe HuangYou"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff2b0'; g.fillText(TXT.bill, 0, 0); g.restore();
    if (e) { e.save(); e.setTransform(e.getTransform().multiply(M)); e.globalAlpha = .45; neonText(null, e, TXT.bill, 0, 0, 170, '#ffd23f'); e.globalAlpha = 1; neonRect(null, e, -390, -140, 780, 280, '#ff3fa4', 20); e.restore(); } }
}
export function billboard(S) {
  const { g, e, t, lt } = S;
  g.drawImage(S.A.storm.c, -300, -100); e.drawImage(S.A.storm.e, -300, -100);
  // low angle: a rooftop scaffold, the sign shaking in the wind, one corner tearing loose at HIT.tear
  vgrad(g, 0, 700, W, 380, [[0, '#24183a'], [1, '#120c1e']]);
  const tear = seg(t, HIT.tear, HIT.tear + .8), shake = Math.sin(t * 40) * 6 * (1 - tear * .5);
  billboardSign(g, e, 960 + shake, 420 + tear * 60, 1.4, tear * .25, Math.floor(t * 14) % 5 ? 1 : .3);
  if (t > HIT.tear) for (let i = 0; i < 10; i++) { const u = ((t - HIT.tear) * 1.5 + i / 10) % 1; lamp(g, e, 1500 + hash(i) * 120 - u * 80, 600 + u * 500, 5, '#ffe680', 1 - u); }
  rainOn(S, { n: 280, ang: .55, a: .32 });
  return {};
}
function riderFig(g, e, Pp, x, y, s, look) {
  g.save(); g.translate(x, y); g.scale(s, s);
  // scooter
  for (const wx of [-120, 140]) { const w = new Path2D(); w.arc(wx, -40, 42, 0, TAU); cel(g, w, { f: '#16161e', l: '#05050a', lw: 3 }); }
  cel(g, path([[-160, -70], [-60, -90], [40, -60], [150, -150], [190, -140], [150, -40], [-150, -40]]), { f: Pp.white.f, s: Pp.white.s, so: [-6, -6], l: Pp.white.l, lw: 3 });
  cel(g, poly([[-200, -200], [-100, -200], [-100, -100], [-200, -100]]), { f: '#e8a030', s: '#b07020', so: [-6, -6], l: '#4a2a08', lw: 3 });       // the delivery box
  // rider in a green jacket and a helmet with a visor (the visor hides the face)
  cel(g, path([[-60, -100], [-70, -260], [10, -300], [60, -250], [50, -100]]), { f: Pp.rider.f, s: Pp.rider.s, so: [-8, -6], h: Pp.rider.h, l: Pp.rider.l, lw: 3 });
  const hm = new Path2D(); hm.ellipse(0, -340, 62, 56, 0, 0, TAU); cel(g, hm, { f: Pp.rider.f, s: Pp.rider.s, so: [-6, -6], h: Pp.rider.h, ho: [3, 3], l: Pp.rider.l, lw: 3 });
  cel(g, path([[0, -360 - look * 20], [60, -350 - look * 20], [56, -312], [6, -316]]), { f: '#2a3a6a', h: '#a8c8ff', hi: [[[10, -352 - look * 20], [30, -350 - look * 20], [14, -330]]], l: '#0a0a1a', lw: 2 });
  g.restore();
}
export function rider(S) {
  const { g, e, t } = S, tq = q12(t), look = K([[S.sh.t0, 0], [HIT.rider, 1, 'back']], tq);
  street(S, 6000, { y0: 720 });
  riderFig(g, e, N, 900, 1000, 1.25, look);
  // the shadow of the falling sign sweeping over him
  g.save(); g.fillStyle = rgba('#000000', .35 * seg(t, S.sh.t0, S.sh.t1)); g.beginPath(); g.ellipse(900, 1000, 500 * seg(t, S.sh.t0, S.sh.t1) + 100, 60, 0, 0, TAU); g.fill(); g.restore();
  rainOn(S, { n: 240, ang: .5 });
  return {};
}
export function gasp(S) {
  const { g, e, t } = S;
  cockpit(g, e, N, t, { lights: 1, steady: true, box: true, rainGlass: true, pilot: pilotFace(N, t < HIT.gasp + .25 ? 'surprised' : 'fierce', { look: [.3, -.6], s: 2.9, y: 520 }) });
  return {};
}
export function lunge(S) {
  const { g, e, t, lt } = S;
  vgrad(g, 0, 0, W, H, [[0, '#1a1030'], [1, '#2a1640']]);
  speedLines(g, Math.floor(t * 24), { type: 'h', n: 90, col: '#ffffff', a: .7, hmax: 9 });
  mech(g, e, N, { x: lerp(500, 1100, ss(lt / .9)), y: 1100, s: 1.15, view: 'side', walk: .25, lean: .35, eyes: 1, armL: { a1: 2.4, a2: -.2, pose: 'open' }, armR: { a1: 2.6, a2: -.3, pose: 'open' } });
  return {};
}
export function impact(S) {
  const { g, e, t, lt } = S;
  const f = Math.floor(lt * 24);
  // impact frames: inverted / monochrome silhouettes over radial lines, alternating, then a white flash
  g.fillStyle = f % 4 < 2 ? '#fff4d0' : '#120a20'; g.fillRect(0, 0, W, H);
  speedLines(g, f, { type: 'radial', cx: 960, cy: 420, n: 140, col: f % 4 < 2 ? '#120a20' : '#fff4d0', a: .9, r0: 120 });
  const sil = f % 4 < 2 ? '#120a20' : '#fff4d0';
  const SP = { ...N }; for (const k of ['mech', 'mechDark', 'mechGrey', 'glass', 'stripeK']) SP[k] = { f: sil, s: sil, h: sil, l: sil };
  mech(g, null, SP, { x: 960, y: 1180, s: 1.3, eyes: 0, stamp: false, armL: { a1: -2.7, a2: -.2, pose: 'open' }, armR: { a1: 2.7, a2: .2, pose: 'open' } });
  g.fillStyle = sil; g.fillRect(560, 120, 800, 120);
  return { expo: 1.1 };
}
export function catchHold(S) {
  const { g, e, t, lt } = S, shake = lt < .4 ? Math.sin(lt * 90) * 14 * (1 - lt / .4) : 0;
  g.save(); g.translate(shake, shake * .5);
  g.drawImage(S.A.storm.c, -300, -200); e.drawImage(S.A.storm.e, -300, -200);
  vgrad(g, 0, 860, W, 220, [[0, '#24183a'], [1, '#100a1a']]);
  // low angle: 大黄 holding the sign overhead, sparks raining, the rider safe below
  billboardSign(g, e, 960, 210, 1.1, -.05 + Math.sin(t * 6) * .01, 1);
  const r = mech(g, e, N, { x: 960, y: 1240, s: 1.35, eyes: 1, beacon: 1, armL: { a1: -2.75, a2: -.15, pose: 'open' }, armR: { a1: 2.75, a2: .15, pose: 'open' }, rim: '#ff3fa4', cockLight: .6,
    cockpit: gg => { gg.scale(.42, .42); head(gg, N, 'g', { view: 'front', expr: 'fierce' }); } });
  for (let i = 0; i < 18; i++) { const u = ((t * 1.3 + i / 18) % 1); lamp(g, e, 500 + hash(i) * 900, 300 + u * 700, 5, '#ffe680', 1 - u); }
  riderFig(g, e, N, 1560, 1080, .55, 1);
  rainOn(S, { n: 280, ang: .5 });
  g.restore();
  return {};
}
export function setDown(S) {
  const { g, e, t, lt, u } = S, tq = q12(t);
  street(S, 6200, { y0: 760 });
  const down = ss(seg(tq, S.sh.t0, HIT.setDown + .2));
  billboardSign(g, e, lerp(860, 520, down), lerp(300, 860, down), lerp(.7, .55, down), lerp(-.05, .1, down), 0);
  mech(g, e, N, { x: 900, y: 1080, s: .9, eyes: 1, beacon: 1, lean: down * .2, armL: { a1: lerp(-2.7, -.5, down), a2: -.1, pose: 'open' }, armR: { a1: lerp(2.7, .5, down), a2: .1, pose: 'open' } });
  // the rider: a thumbs-up at HIT.thumbs
  riderFig(g, e, N, 1480, 1060, .7, 1);
  if (t > HIT.thumbs) { const k = Math.min(1, (t - HIT.thumbs) * 6); g.save(); g.translate(1500, 790); g.scale(k * 1.2, k * 1.2); cel(g, path([[-24, 0], [20, 0], [24, 40], [-28, 44]]), { f: N.rider.f, l: N.rider.l, lw: 3 }); cel(g, path([[-10, 2], [-10, -46], [8, -48], [8, 2]]), { f: N.rider.h, l: N.rider.l, lw: 3 }); g.restore(); }
  rainOn(S, { n: 240, ang: .45 });
  return {};
}
export function nod(S) {
  const { g, e, t } = S, tq = q8(t);
  const n = K([[HIT.nod - .1, 0], [HIT.nod + .12, 1], [HIT.nod + .35, 0]], tq);
  cockpit(g, e, N, t, { lights: 1, steady: true, box: true, rainGlass: true, pilot: g2 => { g2.save(); g2.translate(0, n * 30); pilotFace(N, 'sly', { look: [.7, .3] })(g2); g2.restore(); } });
  return {};
}

// ================================================================ DRONE
export function droneIn(S) {
  const { g, e, t, lt } = S, tq = q12(t);
  street(S, 7000 + lt * 60, { y0: 760 });
  mech(g, e, N, { x: 620, y: 1100, s: .95, eyes: 1, beacon: 1, armL: { a1: .3, a2: -.2, pose: 'fist' }, armR: { a1: -.3, a2: .2, pose: 'fist' } });
  const dy = K([[S.sh.t0, -200], [S.sh.t0 + .7, 360, 'back']], tq);
  drone(g, e, N, 1320, dy + Math.sin(t * 5) * 8, 1.5, { tilt: Math.sin(t * 3) * .05 });
  // the siren light sweep
  const sw = Math.sin(t * 9); airbrush(e, 1320 + sw * 300, dy, 260, 120, '#ff3a4a', .4);
  rainOn(S, { n: 240, ang: .4 });
  return {};
}
function hudFn(S) {
  const { g, e, t, lt, sh } = S, two = sh.opt.which === 2;
  // the drone's view: the mech front-on, red-tinted, through the HUD
  vgrad(g, 0, 0, W, H, [[0, '#120a18'], [1, '#2a1426']]);
  street(S, 7100, { y0: 820 });
  mech(g, e, N, { x: 960, y: 1300, s: 1.45, eyes: 1, beacon: 1, cockLight: two ? .8 : .3, armL: { a1: .3, a2: -.2, pose: 'fist' }, armR: { a1: -.3, a2: .2, pose: 'fist' },
    cockpit: gg => { gg.scale(.42, .42); head(gg, N, 'g', { view: 'front', expr: two ? 'sly' : 'fierce' }); if (two) lunchbox(gg, N, 0, -40, 1.8, { steam: t }); } });
  g.save(); g.fillStyle = rgba(two ? '#1aff8a' : '#ff1a3a', .14); g.fillRect(0, 0, W, H); g.restore();
  const lines = two ? (t >= HIT.ident ? TXT.hud2 : ['扫描中…', '…']) : TXT.hud1;
  const tx = hud(g, e, lines, lt, two ? (t >= HIT.ident ? '#4dff9a' : '#ffd23f') : '#ff3a4a', { cx: 960, cy: 600, rw: 360, rh: 300, ok: two && t >= HIT.ident });
  return { texts: two && t < HIT.ident ? [] : tx };
}
export { hudFn as hud };
export function smack(S) {
  const { g, e, t } = S, tq = q8(t);
  const smackK = K([[HIT.smack2 - .25, 0], [HIT.smack2, 1, 'ei'], [HIT.smack2 + .25, 0]], tq);
  const shake = t > HIT.smack2 && t < HIT.smack2 + .25 ? Math.sin(t * 120) * 10 : 0;
  g.save(); g.translate(shake, 0);
  cockpit(g, e, N, t, { lights: 1, steady: true, box: true, rainGlass: true, radio: t < HIT.smack2 + .05 ? 'static' : 'ok', pilot: pilotFace(N, t < HIT.static + .3 ? 'surprised' : t < HIT.smack2 + .1 ? 'fierce' : 'sly', { look: [.3, .5] }) });
  if (smackK > .01) { const hx = 1250, hy = lerp(560, 900, smackK); cel(g, path([[hx - 80, hy - 40], [hx + 60, hy - 50], [hx + 70, hy + 50], [hx - 70, hy + 60]]), { f: N.gskin.f, s: N.gskin.s, so: [-6, -6], l: N.gskin.l, lw: 3 });
    cel(g, path([[hx - 80, hy - 40], [hx - 260, hy - 300], [hx - 100, hy - 330], [hx + 60, hy - 50]]), { f: N.gjacket.f, s: N.gjacket.s, so: [-6, -6], l: N.gjacket.l, lw: 3 }); }
  if (t > HIT.smack2 && t < HIT.smack2 + .18) for (let i = 0; i < 12; i++) { const a = -Math.PI * (i / 11); line(g, [[1250 + Math.cos(a) * 120, 900 + Math.sin(a) * 90], [1250 + Math.cos(a) * 220, 900 + Math.sin(a) * 170]], '#ffe680', 7); }
  g.restore();
  // a red scan beam sweeping across the dome from outside
  if (t < HIT.smack2) { g.save(); g.globalCompositeOperation = 'source-atop'; const bx = 400 + Math.sin(t * 5) * 600; g.fillStyle = rgba('#ff3a4a', .18); g.fillRect(bx - 120, 0, 240, H); g.restore(); }
  return {};
}
export function showBox(S) {
  const { g, e, t, lt } = S, tq = q12(t), up = K([[S.sh.t0, 0], [HIT.showBox, 1, 'back']], tq);
  street(S, 7150, { y0: 760 });
  // outside the dome: the cockpit glass big, 外婆 pressing the lunchbox to it; the drone's back in the foreground
  g.save(); g.translate(820, 560);
  const D = new Path2D(); D.arc(0, 0, 420, 0, TAU);
  cel(g, (() => { const p = new Path2D(); p.arc(0, 0, 470, 0, TAU); return p; })(), { f: N.mech.f, s: N.mech.s, so: [-20, -20], l: N.mech.l, lw: 4 });
  g.save(); g.clip(D); vgrad(g, -420, -420, 840, 840, [[0, '#1a1a30'], [1, '#2a2a40']]);
  const gr = g.createRadialGradient(0, 80, 20, 0, 80, 500); gr.addColorStop(0, rgba('#ffcf80', .5)); gr.addColorStop(1, rgba('#ffcf80', 0)); g.fillStyle = gr; g.fillRect(-420, -420, 840, 840);
  g.save(); g.translate(-60, 100); g.scale(1.9, 1.9); LWK.k = .8; head(g, N, 'g', { view: 'q', expr: up > .8 ? 'sly' : 'resolute', look: [.8, -.1] }); LWK.k = 1; g.restore();
  lunchbox(g, N, lerp(120, 200, up), lerp(380, 20, up), 1.9, { steam: t });
  g.fillStyle = rgba('#ffffff', .18); g.beginPath(); g.ellipse(-150, -200, 160, 50, -.6, 0, TAU); g.fill();
  g.restore();
  g.strokeStyle = N.glass.l; g.lineWidth = 5; g.stroke(D);
  g.restore();
  drone(g, e, N, 1560, 420 + Math.sin(t * 5) * 10, 2.2, { tilt: -.1, beam: [-560, 200] });
  rainOn(S, { n: 220, ang: .4 });
  return {};
}
export function escort(S) {
  const { g, e, t, lt } = S, x = 12000 + lt * 1400;
  street(S, x);
  const walk = (lt * 2) % 1;
  mech(g, e, N, { x: 720, y: 990, s: .92, view: 'side', walk, eyes: 1, beacon: Math.floor(t * 4) % 2, lean: .12, armL: { a1: Math.sin(walk * TAU) * .5, a2: -.6, pose: 'fist' }, armR: { a1: -Math.sin(walk * TAU) * .5, a2: -.6, pose: 'fist' } });
  const salute = K([[HIT.green + .3, 0], [HIT.green + .6, 1], [HIT.green + .9, 0]], t);
  drone(g, e, N, 1320, 380 + Math.sin(t * 6) * 14, 1.1, { green: true, tilt: .15 - salute * .5 });
  rainOn(S, { n: 280, ang: .5 });
  return {};
}
