// Shots: CLIMB · WINDOW · DAWN · END.
import { cel, path, poly, line, rgba, mix, airbrush, vgrad, TAU, W, H, LWK } from './cel.js';
import { PAL } from './pal.js';
import { head } from './heads.js';
import { figure } from './people.js';
import { mech, lunchbox } from './mech.js';
import { rain, flare, lamp, speedLines } from './fx.js';
import { drawLoop } from './plates.js';
import { chromeTitle, glint, phoneChat } from './ui.js';
import { rainOn, flash, cockpit, oldPhoto, dumpling, sepia } from './shotsA.js';
import { HIT, SEC, at, q12, q8, TXT } from './timeline.js';
import { K, clamp, lerp, ss, eo, ei, seg, hash } from './lib.js';
const ST = PAL.storm, MO = PAL.mono, DW = PAL.dawn;

// ================================================================ CLIMB
function towerView(S, scrollY, o = {}) {
  const { g, e, A } = S, T = o.dawn ? A.towerDawn : A.tower;
  g.drawImage(A.storm.c, -300, -200); e.drawImage(A.storm.e, -300, -200);
  const tx = o.x ?? 260, y = -(T.h - H) + scrollY;
  g.drawImage(T.c, tx, y); e.drawImage(T.e, tx, y);
  return { tx, y, T };
}
export function towerLow(S) {
  const { g, e, t, lt, A } = S;
  g.drawImage(A.storm.c, -300, -200); e.drawImage(A.storm.e, -300, -200);
  flash(S, at('CLIMB', .5), .12, 1);
  // extreme low angle: the tower converging up into the storm (a perspective trapezoid of the facade)
  const T = A.tower;
  g.save(); g.beginPath(); g.moveTo(560, 0); g.lineTo(1360, 0); g.lineTo(1720, H); g.lineTo(200, H); g.closePath(); g.clip();
  for (let i = 0; i < 40; i++) { const v = i / 40, y0 = H * (1 - v), w = lerp(1520, 800, v); g.drawImage(T.c, 0, T.h - 300 - i * 90, T.w, 90, 960 - w / 2, y0 - H / 40, w, H / 40 + 1); e.drawImage(T.e, 0, T.h - 300 - i * 90, T.w, 90, 960 - w / 2, y0 - H / 40, w, H / 40 + 1); }
  g.restore();
  // 大黄 at the base, reaching up to grab the facade
  const reach = ss(seg(lt, 0, 1.6));
  mech(g, e, ST, { x: 960, y: 1420, s: 1.2, eyes: 1, beacon: Math.floor(t * 4) % 2, armL: { a1: lerp(-.4, -2.8, reach), a2: -.1, pose: reach > .9 ? 'fist' : 'open' }, armR: { a1: lerp(.4, 2.6, reach), a2: .1, pose: 'open' }, rim: '#8ab0ff' });
  rainOn(S, { n: 300, ang: .08, a: .35 });
  return {};
}
export function climb(S) {
  const { g, e, t, lt } = S, tq = q12(t);
  const { tx, y, T } = towerView(S, lerp(800, 1500, S.u));
  // the mech on the facade, seen from behind-ish (front view, arms up alternating)
  const ph = (tq * 1.4) % 1, up = Math.sin(ph * TAU);
  mech(g, e, ST, { x: 1000, y: 1000, s: .95, eyes: 1, beacon: Math.floor(t * 4) % 2, lean: .02, armL: { a1: -2.7 + up * .3, a2: -.2, pose: 'fist' }, armR: { a1: 2.7 + up * .3, a2: .2, pose: 'fist' }, walk: ph * .5, rim: '#8ab0ff' });
  // wind-driven rain, nearly horizontal
  rainOn(S, { n: 340, ang: 1.1, a: .38, len: [60, 160] });
  return {};
}
export function gust(S) {
  const { g, e, t, lt } = S, tq = q12(t);
  const { tx, y } = towerView(S, 1500);
  const slip = K([[HIT.slip - .02, 0], [HIT.slip + .12, 1, 'eo'], [HIT.slip + .9, .7]], tq);
  const shake = t > HIT.slip && t < HIT.slip + .3 ? Math.sin(t * 100) * 16 : 0;
  g.save(); g.translate(shake, 0);
  mech(g, e, ST, { x: 1000 + slip * 120, y: 980 + slip * 140, s: 1.1, eyes: 1, beacon: 1, lean: slip * .35, armL: { a1: -2.8, a2: -.1, pose: 'fist' }, armR: { a1: lerp(2.7, 1.2, slip), a2: lerp(.2, 1.2, slip), pose: 'open' }, rim: '#8ab0ff' });
  if (t > HIT.slip && t < HIT.slip + .5) for (let i = 0; i < 14; i++) { const u = (t - HIT.slip) * 2; lamp(g, e, 860 + hash(i) * 80 - u * 40, 220 + u * 400 * hash(i + 3), 6, '#ffe680', 1 - u); }
  g.restore();
  speedLines(g, Math.floor(t * 24), { type: 'h', n: 50, col: '#cfe3ff', a: .35 });
  rainOn(S, { n: 380, ang: 1.25, a: .4, len: [80, 200] });
  return {};
}
const pilotFace = (Pp, expr, o = {}) => g => { g.save(); g.translate(o.x ?? 880, o.y ?? 480); g.scale(o.s ?? 2.6, o.s ?? 2.6); LWK.k = .75; head(g, Pp, 'g', { view: 'q', expr, look: o.look, E: o.E }); LWK.k = 1; g.restore(); };
export function climbFace(S) {
  const { g, e, t } = S, tq = q8(t);
  const sh = Math.sin(t * 30) * 3;
  g.save(); g.translate(sh, 0);
  cockpit(g, e, ST, t, { lights: 1, steady: true, box: true, rainGlass: true, pilot: pilotFace(ST, t < at('CLIMB', 3.5) ? 'fierce' : 'resolute', { look: [.4, -.7], E: { sweat: true } }),
    outside: (gg, ee) => { gg.save(); gg.globalAlpha = .7; gg.drawImage(S.A.tower.c, 0, 2000 - (t - SEC.CLIMB.t0) * 300, 1400, 1080, 260, 0, 1400, 1080); gg.restore(); } });
  g.restore();
  rainOn(S, { n: 200, ang: 1.1, a: .25 });
  return {};
}
export function arrive(S) {
  const { g, e, t, lt, u } = S, tq = q12(t);
  // close on the facade at the 88th floor: the yellow 88F plate, one office lit blue with 阿杰 inside; 大黄's head and
  // hand rise into frame beside it
  g.drawImage(S.A.storm.c, -300, -200); e.drawImage(S.A.storm.e, -300, -200);
  const T = S.A.tower, z = 2.2, fy = T.h - 88 * T.fh;
  g.save(); g.translate(-200, 540 - (fy + T.fh / 2) * z); g.scale(z, z); g.drawImage(T.c, 0, 0); g.restore();
  e.save(); e.translate(-200, 540 - (fy + T.fh / 2) * z); e.scale(z, z); e.drawImage(T.e, 0, 0); e.restore();
  // the lit office window (centre) and the big 88F plate
  const wy = 540 - T.fh * z / 2 + 6;
  g.fillStyle = '#bfe6ff'; g.fillRect(860, wy, 560, T.fh * z - 22); airbrush(e, 1140, wy + 40, 420, 120, '#8fd0ff', .6);
  g.save(); g.translate(1060, wy + T.fh * z - 22); g.scale(.13, .13); figure(g, MO, 'j', { pose: 'sit', expr: 'dull' }); g.restore();
  g.save(); g.fillStyle = '#ffd23f'; g.fillRect(1500, wy - 4, 230, 100); g.font = '900 86px "Noto Sans SC"'; g.fillStyle = '#1a1424'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(TXT.floor, 1615, wy + 48); g.restore();
  airbrush(e, 1615, wy + 46, 160, 70, '#ffd23f', .35);
  const rise = ss(seg(t, S.sh.t0, HIT.arrive));
  mech(g, e, ST, { x: 560, y: lerp(1900, 1420, rise), s: 1.2, eyes: 1, beacon: 1, armL: { a1: -2.9, a2: -.1, pose: 'fist' }, armR: { a1: 2.5, a2: .3, pose: 'open' }, rim: '#8ab0ff' });
  rainOn(S, { n: 280, ang: .9, a: .32 });
  return { texts: [{ id: 'floor', text: TXT.floor, x0: 1500, y0: wy, x1: 1730, y1: wy + 96 }] };
}

// ================================================================ WINDOW (阿杰's office, monitor light)
function office(g, e, t, o = {}) {
  vgrad(g, 0, 0, W, H, [[0, '#0c1224'], [1, '#141a30']]);
  // the window behind: rain, a dark storm, the city far below
  const wx = o.wx ?? 900, ww = o.ww ?? 1020;
  g.fillStyle = '#060814'; g.fillRect(wx, 60, ww, 720);
  for (let i = 0; i < 40; i++) { const c = ['#ffcf80', '#8fdcff', '#ff3fa4'][i % 3]; lamp(g, e, wx + hash(i) * ww, 560 + hash(i + 7) * 200, 3, c, .6); }
  g.strokeStyle = rgba('#cfe3ff', .35); g.lineWidth = 2; for (let i = 0; i < 60; i++) { const x = wx + hash(i) * ww, y = 60 + ((hash(i + 5) * 720 + t * 300) % 720); g.beginPath(); g.moveTo(x, y); g.lineTo(x - 3, y + 30); g.stroke(); }
  if (o.outside) o.outside(g, e);
  g.fillStyle = '#1a2036'; for (const x of [wx, wx + ww / 2, wx + ww]) g.fillRect(x - 10, 60, 20, 720); g.fillRect(wx, 50, ww, 20); g.fillRect(wx, 770, ww, 24);
  // desk + three monitors with code
  g.fillStyle = '#20263a'; g.fillRect(0, 780, W, 300);
  if (o.monitors !== false) for (let m = 0; m < 3; m++) {
    const mx = 120 + m * 300, my = 440;
    g.fillStyle = '#0a0c14'; g.fillRect(mx, my, 270, 180);
    g.fillStyle = '#0e1e30'; g.fillRect(mx + 8, my + 8, 254, 164);
    for (let l = 0; l < 9; l++) { const lw = 40 + hash(l * 7 + m + Math.floor(t * 3)) * 170; g.fillStyle = ['#4dd0ff', '#ffd23f', '#ff6ab0', '#9aff9a'][(l + m) % 4]; g.fillRect(mx + 16 + (l % 3) * 10, my + 16 + l * 17, lw, 7); }
    e.fillStyle = rgba('#5ab0ff', .45); e.fillRect(mx, my, 270, 180);
    g.fillStyle = '#0a0c14'; g.fillRect(mx + 120, my + 180, 30, 80);
  }
  // cans and a cup-noodle stack
  for (let i = 0; i < 7; i++) { const cx = 1000 + i * 46 - (i > 3 ? 160 : 0), cy = 780 - (i > 3 ? 80 : 0); cel(g, poly([[cx - 18, cy - 70], [cx + 18, cy - 70], [cx + 18, cy], [cx - 18, cy]]), { f: ['#3ad06a', '#e84a4a', '#4a8ae8'][i % 3], s: '#1a1a2a', so: [-5, -2], l: '#0a0a14', lw: 2 }); }
  airbrush(g, 500, 520, 700, 420, '#5ab0ff', .18);
}
export function desk(S) {
  const { g, e, t, lt, u } = S, tq = q12(t);
  const z = lerp(1, 1.06, u); g.save(); g.translate(960, 540); g.scale(z, z); g.translate(-960, -540);
  office(g, e, t, { wx: 1020, ww: 860, monitors: false });
  // three monitors on the right, code scrolling
  for (let m = 0; m < 2; m++) { const mx = 1080 + m * 380, my = 420; g.fillStyle = '#0a0c14'; g.fillRect(mx, my, 360, 240); g.fillStyle = '#0e1e30'; g.fillRect(mx + 10, my + 10, 340, 220);
    for (let l = 0; l < 11; l++) { const lw = 50 + hash(l * 7 + m + Math.floor(t * 4)) * 220; g.fillStyle = ['#4dd0ff', '#ffd23f', '#ff6ab0', '#9aff9a'][(l + m) % 4]; g.fillRect(mx + 20 + (l % 3) * 12, my + 22 + l * 18, lw, 8); }
    e.fillStyle = rgba('#5ab0ff', .45); e.fillRect(mx, my, 360, 240); }
  // 阿杰: bust, 3/4 toward the screens, hunched, typing
  const tap = Math.floor(tq * 12) % 2;
  g.save(); g.translate(640, 560 + tap * 3); g.scale(2.0, 2.0); LWK.k = .8;
  head(g, MO, 'j', { view: 'q', expr: 'dull', circles: 1, look: [.6, .2], E: { reflect: '#5ab0ff', shoulders: 10 } });
  LWK.k = 1; g.restore();
  // hands on the keyboard
  g.fillStyle = '#1a1e2c'; g.fillRect(760, 960, 520, 50);
  for (const [hx, k] of [[860, 0], [1080, 1]]) cel(g, path([[hx - 50, 980 - (tap === k ? 10 : 0)], [hx + 40, 970 - (tap === k ? 10 : 0)], [hx + 50, 1020], [hx - 50, 1030]]), { f: MO.jskin.f, s: MO.jskin.s, so: [-4, -4], l: MO.jskin.l, lw: 2.4 });
  g.save(); g.globalCompositeOperation = 'source-atop'; for (let l = 0; l < 3; l++) { const y = ((t * 90 + l * 200) % 700) + 300; g.fillStyle = rgba('#8fd0ff', .07); g.fillRect(0, y, W, 24); } g.restore();
  g.restore();
  return {};
}
export function jieClose(S) {
  const { g, e, t } = S, tq = q8(t);
  office(g, e, t, { monitors: false });
  airbrush(g, 160, 560, 520, 420, '#5ab0ff', .45); airbrush(e, 160, 560, 380, 300, '#5ab0ff', .35);
  const blink = (tq % 1.6) > 1.5 ? 0 : null;
  g.save(); g.translate(1020, 520); g.scale(2.6, 2.6); LWK.k = .75; g.scale(-1, 1);
  head(g, MO, 'j', { view: 'q', expr: 'dull', circles: 1, E: { reflect: '#5ab0ff', open: blink ?? .62 } });
  LWK.k = 1; g.restore();
  // monitor light lines sliding over his face (source-atop)
  g.save(); g.globalCompositeOperation = 'source-atop'; for (let l = 0; l < 4; l++) { const y = ((t * 120 + l * 140) % 600) + 300; g.fillStyle = rgba('#8fd0ff', .08); g.fillRect(0, y, W, 20); } g.restore();
  return {};
}
export function tap(S) {
  const { g, e, t } = S, tq = q12(t);
  office(g, e, t, { wx: 980 });
  const turn = K([[HIT.turn - .05, 0], [HIT.turn + .25, 1, 'back']], tq), freeze = t > HIT.tap1;
  g.save(); g.translate(760, 560); g.scale(2.2, 2.2); LWK.k = .8;
  if (turn < .5) { g.scale(-1, 1); head(g, MO, 'j', { view: 'q', expr: freeze ? 'startled' : 'dull', circles: .8, look: [-.6, 0] }); }
  else head(g, MO, 'j', { view: 'q', expr: 'startled', circles: .8, look: [.8, 0] });
  LWK.k = 1; g.restore();
  // the knock: a shape at the dark window, two tap rings
  for (const tt of [HIT.tap1, HIT.tap2]) { const d = t - tt; if (d > 0 && d < .4) { g.strokeStyle = rgba('#ffe680', 1 - d / .4); g.lineWidth = 6; g.beginPath(); g.arc(1500, 360, 40 + d * 300, 0, TAU); g.stroke(); } }
  g.fillStyle = rgba(ST.mech.f, .5); g.fillRect(1440, 300, 120, 120);
  return {};
}
export function theHand(S) {
  const { g, e, t, lt, u } = S;
  const z = lerp(1, 1.12, ss(u)); g.save(); g.translate(960, 560); g.scale(z, z); g.translate(-960, -560);
  // POV: the window fills the frame; outside, 大黄's hand holds the lunchbox; its eye lamps glow above
  vgrad(g, 0, 0, W, H, [[0, '#0c1224'], [1, '#141a30']]);
  g.fillStyle = '#060814'; g.fillRect(140, 40, 1640, 900);
  airbrush(g, 760, 120, 140, 90, '#ffd23f', .5); airbrush(g, 1160, 120, 140, 90, '#ffd23f', .5); lamp(g, e, 760, 120, 50, '#ffd23f', .9); lamp(g, e, 1160, 120, 50, '#ffd23f', .9);
  cel(g, poly([[400, 0], [1520, 0], [1520, 60], [400, 60]]), { f: ST.mech.f, s: ST.mech.s, so: [0, -20], l: ST.mech.l, lw: 4 });
  // the big hand (tray) and the box, steaming
  g.save(); g.translate(960, 700); g.scale(4.2, 4.2);
  g.fillStyle = ST.mechDark.f; g.fillRect(-34, 0, 68, 90);
  cel(g, (() => { const p = new Path2D(); p.roundRect(-78, 0, 156, 34, 14); return p; })(), { f: ST.mech.f, s: ST.mech.s, so: [-4, -4], l: ST.mech.l, lw: 2.4 });
  for (let i = 0; i < 4; i++) cel(g, (() => { const p = new Path2D(); p.roundRect(-70 + i * 38, -18, 26, 30, 9); return p; })(), { f: ST.mechGrey.f, s: ST.mechGrey.s, so: [-3, -3], l: ST.mechGrey.l, lw: 2 });
  g.restore();
  lunchbox(g, ST, 960, 600, 2.6, { steam: t });
  // the window frame and rain on the glass (in front)
  g.fillStyle = '#1a2036'; for (const x of [140, 960, 1780]) g.fillRect(x - 14, 40, 28, 900); g.fillRect(140, 30, 1640, 24); g.fillRect(140, 930, 1640, 30);
  g.strokeStyle = rgba('#cfe3ff', .4); g.lineWidth = 3; for (let i = 0; i < 80; i++) { const x = 140 + hash(i) * 1640, y = 40 + ((hash(i + 5) * 900 + t * 200 * (1 + hash(i))) % 900); g.beginPath(); g.moveTo(x, y); g.lineTo(x - 2, y + 40); g.stroke(); }
  g.fillStyle = '#20263a'; g.fillRect(0, 960, W, 120);
  g.restore();
  return {};
}
export function eyesECU(S) {
  const { g, e, t, lt, u } = S, tq = q8(t);
  // extreme close-up on his eyes: the yellow of the hand reflected in the irises; held in silence; a tear wells up
  vgrad(g, 0, 0, W, H, [[0, '#101830'], [1, '#18203a']]);
  const z = lerp(5.2, 5.6, u);
  g.save(); g.translate(960, 560 - 22 * z); g.scale(z, z); LWK.k = .5;
  head(g, MO, 'j', { view: 'front', expr: 'stunned', circles: .6, E: { reflect: '#ffd23f', tear: t > at('WINDOW', 3.4), open: t > at('WINDOW', 3.55) && t < at('WINDOW', 3.6) ? 0 : 1.05 } });
  LWK.k = 1; g.restore();
  g.save(); g.globalCompositeOperation = 'source-atop'; g.fillStyle = rgba('#ffd23f', .06); g.fillRect(0, 0, W, H); g.restore();
  return {};
}
export function wave(S) {
  const { g, e, t, lt } = S, tq = q12(t);
  // through the glass: 大黄's dome, its cockpit lamp switching on; 外婆 waves
  vgrad(g, 0, 0, W, H, [[0, '#0a0e1e'], [1, '#141a30']]);
  const on = K([[HIT.chord - .05, 0], [HIT.chord + .15, 1]], t);
  cel(g, (() => { const p = new Path2D(); p.arc(960, 600, 560, 0, TAU); return p; })(), { f: ST.mech.f, s: ST.mech.s, so: [-30, -30], h: ST.mech.h, l: ST.mech.l, lw: 5 });
  const D = new Path2D(); D.arc(960, 600, 470, 0, TAU);
  g.save(); g.clip(D); vgrad(g, 0, 100, W, 1000, [[0, '#14142a'], [1, '#22223a']]);
  const gr = g.createRadialGradient(960, 760, 40, 960, 760, 700); gr.addColorStop(0, rgba('#ffcf80', .75 * on)); gr.addColorStop(1, rgba('#ffcf80', 0)); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  const Pw = on > .5 ? PAL.warm : ST;
  g.save(); g.translate(900, 600); g.scale(2.4, 2.4); LWK.k = .75; head(g, Pw, 'g', { view: 'q', expr: 'tender', look: [.6, 0] }); LWK.k = 1; g.restore();
  // the waving hand
  const wv = Math.sin(tq * 14) * .3;
  g.save(); g.translate(1260, 640); g.rotate(wv); cel(g, path([[-40, 120], [-50, -40], [-20, -90], [30, -90], [50, -40], [40, 120]]), { f: Pw.gskin.f, s: Pw.gskin.s, so: [-5, -5], l: Pw.gskin.l, lw: 3 }); g.restore();
  g.restore();
  g.strokeStyle = ST.glass.l; g.lineWidth = 6; g.stroke(D);
  if (on > 0) airbrush(e, 960, 760, 500, 400, '#ffb860', .5 * on);
  // rain on the office glass in front
  g.strokeStyle = rgba('#cfe3ff', .3); g.lineWidth = 3; for (let i = 0; i < 60; i++) { const x = hash(i) * W, y = (hash(i + 5) * H + t * 240) % H; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 2, y + 40); g.stroke(); }
  return {};
}
export function laugh(S) {
  const { g, e, t, lt } = S, tq = q8(t);
  office(g, e, t, { wx: 1100, monitors: false, outside: (gg, ee) => { airbrush(gg, 1500, 300, 400, 300, '#ffb860', .35); cel(gg, poly([[1100, 600], [2100, 600], [2100, 800], [1100, 800]]), { f: ST.mech.f, s: ST.mech.s, so: [0, -20], l: ST.mech.l, lw: 4 }); } });
  const L = t > HIT.laugh;
  g.save(); g.translate(720, 560); g.scale(2.4, 2.4); LWK.k = .8;
  head(g, MO, 'j', { view: 'q', expr: L ? 'laugh' : 'moved', circles: .4, look: [.8, -.1] });
  LWK.k = 1; g.restore();
  // he wipes his eye with the back of a hand (before the laugh), then reaches for the latch
  const wipe = K([[S.sh.t0, 0], [S.sh.t0 + .4, 1], [HIT.laugh - .1, 1], [HIT.laugh + .2, 0]], tq);
  if (wipe > .05) cel(g, path([[880, 1100], [860, 620 - wipe * 60], [930, 560 - wipe * 60], [980, 600 - wipe * 60], [1000, 1100]]), { f: MO.hoodie.f, s: MO.hoodie.s, so: [-6, -6], l: MO.hoodie.l, lw: 3 });
  return {};
}

// ================================================================ DAWN
function dawnCity(S, o = {}) {
  const { g, e, A } = S, z = o.z ?? 1, sunY = o.sunY ?? 0;
  g.save(); g.translate(960, 540); g.scale(z, z); g.translate(-960, -540);
  g.drawImage(A.dawnSky.c, -240, -260 + sunY); e.drawImage(A.dawnSky.e, -240, -260 + sunY);
  drawLoop(g, A.skyDawn.c, A.skyDawn.w, -400, 560, A.skyDawn.w, A.skyDawn.h); drawLoop(e, A.skyDawn.e, A.skyDawn.w, -400, 560, A.skyDawn.w, A.skyDawn.h);
  g.restore();
}
function palmScene(g, e, t, s, o = {}) {
  // 大黄's open palm (huge, foreground), 外婆 and 阿杰 sitting on it, the lunchbox open between them
  g.save(); g.translate(o.x ?? 960, o.y ?? 900); g.scale(s, s);
  cel(g, (() => { const p = new Path2D(); p.roundRect(-700, 0, 1400, 220, 70); return p; })(), { f: DW.mech.f, s: DW.mech.s, so: [-30, -20], h: DW.mech.h, ho: [10, 10], l: DW.mech.l, lw: 4 });
  for (let i = 0; i < 3; i++) cel(g, (() => { const p = new Path2D(); p.roundRect(-640 + i * 420, -70, 300, 110, 40); return p; })(), { f: DW.mechGrey.f, s: DW.mechGrey.s, so: [-8, -8], l: DW.mechGrey.l, lw: 3 });
  const tq = q12(t);
  g.save(); g.translate(-300, 10); g.scale(.62, .62); figure(g, DW, 'g', { pose: 'sit', expr: o.gExpr || 'tender', look: [.6, .1], armL: [1.0, .9], armR: [.9, 1.1] }); g.restore();
  g.save(); g.translate(300, 10); g.scale(-.66, .66); figure(g, DW, 'j', { pose: 'sit', expr: o.jExpr || 'happy', look: [.6, 0], armL: [1.2 + Math.sin(tq * 6) * .1, .8], armR: [1.0, 1.0] }); g.restore();
  g.save(); g.translate(0, -30); g.scale(1.4, 1.4);
  cel(g, poly([[-110, 0], [110, 0], [110, 70], [-110, 70]]), { f: DW.tin.f, s: DW.tin.s, so: [-8, -6], h: DW.tin.h, l: DW.tin.l, lw: 2.4 });
  for (let i = 0; i < 4; i++) dumpling(g, DW, -66 + i * 44, -4, .55);
  for (let i = 0; i < 3; i++) { const u = (t * .5 + i / 3) % 1; g.strokeStyle = rgba('#ffffff', .6 * Math.sin(u * Math.PI)); g.lineWidth = 5; g.beginPath(); for (let k = 0; k <= 8; k++) { const v = k / 8; g.lineTo(-30 + i * 30 + Math.sin(v * 5 + u * 6 + i) * 8, -20 - u * 60 - v * 70); } g.stroke(); }
  g.restore();
  g.restore();
}
export function palm(S) {
  const { g, e, t, u } = S;
  dawnCity(S, { sunY: lerp(140, 100, u) });
  // the storm clearing: last clouds drifting off
  g.save(); g.globalAlpha = lerp(.6, .2, u); vgrad(g, 0, 0, W, 300, [[0, '#4a3a6a'], [1, 'rgba(74,58,106,0)']]); g.restore();
  const z = lerp(1, 1.3, ss(u)); g.save(); g.translate(960, 760); g.scale(z, z); g.translate(-960, -760);
  palmScene(g, e, t, 1.0, { y: 860 });
  g.restore();
  return {};
}
export function dumplingShot(S) {
  const { g, e, t, lt } = S, tq = q12(t);
  dawnCity(S, { z: 1.4, sunY: 90 });
  g.save(); g.filter = 'blur(6px)'; g.globalAlpha = .5; g.fillStyle = '#ffe0b0'; g.fillRect(0, 0, W, H); g.restore();
  const up = K([[S.sh.t0, 0], [HIT.bite, 1, 'back']], tq);
  const cx = 960, cy = lerp(760, 520, up);
  line(g, [[cx + 80, cy - 20], [cx + 600, cy - 300]], '#c08a40', 16); line(g, [[cx + 90, cy + 10], [cx + 620, cy - 250]], '#c08a40', 16);
  dumpling(g, DW, cx, cy, 3.4);
  for (let i = 0; i < 3; i++) { const u = (t * .7 + i / 3) % 1; g.strokeStyle = rgba('#ffffff', .7 * Math.sin(u * Math.PI)); g.lineWidth = 10; g.beginPath(); for (let k = 0; k <= 8; k++) { const v = k / 8; g.lineTo(cx - 60 + i * 60 + Math.sin(v * 5 + u * 6 + i) * 20, cy - 100 - u * 120 - v * 160); } g.stroke(); }
  glint(e, cx - 60, cy - 50, K([[HIT.bite, 0], [HIT.bite + .1, .8], [HIT.bite + .4, 0]], t));
  return {};
}
export { dumplingShot as dumpling };
export function grandmaLaugh(S) {
  const { g, e, t } = S;
  dawnCity(S, { z: 1.6, sunY: 80 });
  g.save(); g.filter = 'blur(5px)'; g.globalAlpha = .4; g.fillStyle = '#ffd0a0'; g.fillRect(0, 0, W, H); g.restore();
  g.save(); g.translate(880, 520); g.scale(2.6, 2.6); LWK.k = .75; head(g, DW, 'g', { view: 'q', expr: 'laugh', rim: '#fff0b0', light: [1, -.4] }); LWK.k = 1; g.restore();
  return {};
}
const SCR = document.createElement('canvas').getContext('2d');
const PB_MECH = { x: 1180, y: 1160, s: .55, eyes: 1, beacon: 0, armL: { a1: -2.9, a2: -.1, pose: 'fist' }, armR: { a1: 1.9, a2: .5, pose: 'tray' } };
const PB_HAND = mech(SCR, null, DW, PB_MECH).handR;
export function pullBack(S) {
  const { g, e, t, lt, u, A } = S;
  const k = ss(u), z = lerp(3.0, .7, k), [px, py] = [PB_HAND[0], PB_HAND[1] - 30];
  // the whole city at sunrise: plates, then the tower with 大黄 holding the two of them up on its palm; the camera pulls back from the palm
  dawnCity(S, { z: lerp(1.35, 1, k), sunY: lerp(150, 40, k) });
  g.save(); g.translate(960, 600); g.scale(z, z); g.translate(-lerp(px, 960, k), -lerp(py, 620, k));
  const T = A.towerDawn; g.drawImage(T.c, 0, T.h - 3100, T.w, 2200, 300, -900, 1100, 1730); e.drawImage(T.e, 0, T.h - 3100, T.w, 2200, 300, -900, 1100, 1730);
  mech(g, e, DW, PB_MECH);
  palmScene(g, e, t, .17, { x: px, y: py });
  g.restore();
  flare(e, 1560, lerp(780, 640, k), lerp(.5, 1.0, k), '#ffd890', { ghosts: true });
  return {};
}
export function snap(S) {
  const { g, e, t, lt } = S;
  dawnCity(S, { z: 1.2, sunY: 40 });
  // 阿杰's hands holding up the phone; on its screen: 外婆 giving a thumbs-up in front of 大黄 (the same composition as 1979)
  const flashK = K([[HIT.shutter, 0], [HIT.shutter + .03, 1], [HIT.shutter + .25, 0]], t);
  g.save(); g.translate(960, 560); g.scale(1.25, 1.25);
  g.fillStyle = '#16161e'; g.beginPath(); g.roundRect(-380, -250, 760, 500, 40); g.fill();
  g.save(); g.beginPath(); g.roundRect(-360, -230, 720, 460, 26); g.clip();
  g.drawImage(S.A.dawnSky.c, 600, 300, 1200, 760, -360, -230, 720, 460);
  mech(g, null, DW, { x: 120, y: 360, s: .6, eyes: 1, stamp: false, armL: { a1: .2, a2: -.1, pose: 'open' }, armR: { a1: -.2, a2: .1, pose: 'open' } });
  g.save(); g.translate(-170, 230); g.scale(.55, .55); figure(g, DW, 'g', { expr: 'happy', armR: [2.5, .6] }); g.restore();
  g.strokeStyle = rgba('#ffffff', .7); g.lineWidth = 3; g.strokeRect(-340, -210, 680, 420);
  g.fillStyle = rgba('#ffffff', flashK); g.fillRect(-360, -230, 720, 460);
  g.restore();
  g.restore();
  for (const k of [-1, 1]) cel(g, path([[960 + k * 520, 1100], [960 + k * 470, 800], [960 + k * 520, 760], [960 + k * 580, 820], [960 + k * 600, 1100]]), { f: DW.jskin.f, s: DW.jskin.s, so: [-6, -6], l: DW.jskin.l, lw: 3 });
  return {};
}
export function oldPhotoShot(S) {
  const { g, e, t, u } = S;
  vgrad(g, 0, 0, W, H, [[0, '#3a2a20'], [1, '#1a100c']]);
  const out = oldPhoto(g, e, 960, 560, 1.25, t, { rot: 0, slide: seg(t, HIT.match + .3, HIT.match + 1.2) });
  return { texts: out };
}
export { oldPhotoShot as oldPhoto };
export function endCard(S) {
  const { g, e, t, lt } = S;
  dawnCity(S, { z: 1.0, sunY: 20 });
  g.save(); g.fillStyle = rgba('#120a24', .45); g.fillRect(0, 0, W, H); g.restore();
  const tx = chromeTitle(g, e, TXT.title, 960, 430, 200, lt, { sweepAt: .8 });
  g.save(); g.font = '900 120px "Noto Sans SC"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.strokeStyle = '#120a24'; g.lineWidth = 14; g.globalAlpha = Math.min(1, Math.max(0, (lt - .9) * 3));
  g.strokeText(TXT.end, 960, 720); g.fillStyle = '#ffd23f'; g.fillText(TXT.end, 960, 720); g.restore();
  glint(e, 1210, 360, K([[HIT.end + .3, 0], [HIT.end + .45, 1.2], [HIT.end + .9, 0]], t));
  const endBox = lt > 1.25 ? [{ id: 'end', text: TXT.end, x0: 900, y0: 660, x1: 1020, y1: 780 }] : [];
  return { texts: tx.concat(endBox), fade: lt > 4.2 ? (lt - 4.2) / .8 * .6 : .03, expo: lt > 4.3 ? Math.max(0, 1 - (lt - 4.3) / .7) : 1.06 };
}
