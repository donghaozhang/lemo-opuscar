// 《我的怪兽朋友》: seven pages of a crayon picture book, 36 shots, page turns between them. Everything drawn steps at 12 fps (the line boil), the camera at 24.
import { layer, clear, line, fill, dab, text, handCircle, ellipse, smooth, xf, CAM, BOIL, W, H, sx, sy } from './crayon.js';
import { group, clearGroup, part, DRAW } from './rig.js';
import { kid, head, monster, EXPR, MEXPR, mixEx, mixMex, crayonStick, bgKid, teacher, teacherBack, backpackProp } from './chars.js';
import * as PG from './pages.js';
import { PAL } from './pal.js';
import * as TL from './timeline.js';
import { snap, drawTurn, SNAP_A, SNAP_B, TURN } from './book.js';
import { clamp, lerp, hash, ss, eio, eo, ei, back, mulberry } from '/core/lib.js';
const K = PAL.crayon, { HIT, SHOT, SUBS, TURNS } = TL;
const pr = PG.pr, { el } = PG;
const Q = new URLSearchParams(location.search), POSTER = Q.get('poster') === '1';
export const DUR = TL.DUR;
const FULL = [1300, 730, 0.7385];
const DD = { hair: 'bowl', shirt: K.orange, bottom: K.sky, hairCol: K.brown };
const NN = { hair: 'pigtails', shirt: K.yellow, dress: true, hairCol: K.ink, ribbons: true };
const mv = (t, t0, t1, A, B, e = eio) => { const u = e(pr(t, t0, t1)); return A.map((a, i) => lerp(a, B[i], u)); };
const stepT = (t, fps = 12) => Math.floor(t * fps + 1e-6) / fps;   // things that act on 12s
const bob = (t, hz = 4) => Math.abs(Math.sin(stepT(t) * Math.PI * hz));

// ---------------- events for the mix (window.EV) ----------------
export const EV = [];
const ev = (t, type, o = {}) => EV.push({ t: +t.toFixed(3), type, ...o });
{
  // crayon lines (stick-slip grain) and colouring (swishes) while a page draws itself
  [[0, 1.6, -0.2], [1.6, 1.4, 0.3], [3.4, 4.0, 0], [12.6, 2.8, 0], [26.6, 2.4, 0], [33.0, 5.0, 0.2], [42.5, 0.4, 0.2], [56.0, 1.2, -0.4], [59.0, 4.0, 0.3], [63.0, 1.8, 0], [80.6, 3.0, 0],
   [82.4, 1.2, -0.2], [110.0, 2.4, 0.1], [131.6, 2.9, 0]].forEach(([t, d, pan]) => ev(t, 'scratch', { dur: d, pan }));
  [[0, 2.6, -0.2], [5.0, 3.4, 0], [13.6, 2.4, 0], [27.6, 2.0, 0], [37.0, 3.5, 0.2], [56.6, 0.8, -0.4], [59.5, 3.5, 0.3], [63.6, 1.2, 0], [81.0, 2.6, 0], [112.0, 1.2, 0.1], [132.0, 2.8, 0]].forEach(([t, d, pan]) => ev(t, 'scribble', { dur: d, pan }));
  [[7.0, 1.4], [98.6, 0.8], [134.6, 1.0]].forEach(([t, d]) => ev(t, 'write', { dur: d }));
  [[28.5, 2.7, 1], [41.0, 1.2, 1], [125.6, 1.4, 1]].forEach(([t, d, dir]) => ev(t, 'brush', { dur: d, dir }));
  TURNS.forEach(([a]) => ev(a, 'page', { dur: 0.6 }));
  ev(0, 'paper'); ev(HIT.truck, 'crayonSwap'); ev(HIT.balloon, 'balloonRise'); ev(HIT.childWave, 'wave'); ev(HIT.teacherWave, 'wave'); ev(17.0, 'run', { dur: 1.8 });
  ev(HIT.mouthOpen, 'mouthOpen'); ev(HIT.mouthClose, 'mouthClose');
  ev(HIT.lamp, 'click'); ev(HIT.boxIn, 'boxRattle'); [30.6, 31.3].forEach(t => ev(t, 'hover')); ev(HIT.purple, 'crayonPick');
  ev(HIT.eyesShine, 'glint'); ev(HIT.pupils, 'dot'); ev(HIT.pupils + 0.2, 'dot'); ev(HIT.blink, 'blink'); ev(HIT.looks, 'blink', { gain: .5 });
  ev(HIT.armOut, 'creak'); ev(HIT.climb, 'stretch'); ev(HIT.land, 'landSoft'); ev(HIT.jaw, 'jaw'); ev(HIT.gasp, 'gasp'); ev(HIT.blanket, 'cloth'); ev(HIT.shrink1, 'shrink', { dur: .7 });
  ev(HIT.squeak, 'squeak'); ev(HIT.peek, 'cloth', { gain: .5 }); ev(HIT.giggle, 'giggle'); ev(HIT.pop, 'pop'); ev(HIT.hug, 'felt');
  ev(HIT.squeeze, 'squeeze'); ev(HIT.zip, 'zip'); ev(HIT.unzip, 'unzip'); ev(HIT.eyesGlance, 'tick'); ev(HIT.eyesGlance + .4, 'tick');
  for (let i = 0; i < 16; i++) ev(59.0 + i * .25, 'step', { pan: .2 });
  [HIT.crunch1, HIT.crunch2, HIT.crunch3, HIT.crunch4, HIT.crunchY].forEach((t, i) => { ev(t - .4, 'crayonPick', { gain: .6 }); ev(t, 'crunch', { i }); ev(t + .25, 'felt', { gain: .4 }); });
  ev(HIT.twitch, 'sniff'); ev(HIT.twitch + .5, 'sniff'); ev(HIT.antic, 'inhale'); ev(HIT.sneeze, 'sneeze'); ev(HIT.sneeze + .05, 'splat'); ev(HIT.kidsLook, 'chirp');
  ev(HIT.sandpit, 'sand'); ev(HIT.pat, 'pat'); ev(HIT.pat + .3, 'pat'); ev(HIT.giggle2, 'giggle', { gain: .6 }); ev(HIT.bell, 'bell');
  ev(HIT.balloonSeen, 'rubber'); ev(HIT.nudge, 'felt'); ev(HIT.skid, 'skid'); ev(HIT.shrink2, 'shrink', { dur: 1.2, gain: .7 }); ev(HIT.shrink2 + .7, 'beanBounce');
  ev(HIT.breath, 'breathIn'); ev(HIT.breath + .6, 'breathOut'); ev(HIT.step, 'step', { gain: 1.2 }); ev(HIT.crayonOut, 'felt', { gain: .6 });
  ev(HIT.grow, 'grow', { dur: 2.0 }); ev(HIT.lift, 'swish'); ev(HIT.freed, 'snap'); ev(HIT.freed + .3, 'rubber', { gain: .7 }); ev(HIT.niniLaugh, 'laugh'); ev(HIT.twinkle, 'glint', { gain: .7 });
  ev(HIT.burp, 'burp'); ev(HIT.crayonPop, 'crayonPop'); ev(HIT.crayonPop + .6, 'catch'); ev(HIT.eyes2, 'dot'); ev(HIT.eyes2 + .2, 'dot'); ev(HIT.shake, 'rattle'); ev(HIT.hop, 'hop');
  for (let i = 0; i < 8; i++) ev(115.0 + i * .25, 'step', { gain: .8, pan: -.2 + i * .05 }); for (let i = 0; i < 8; i++) ev(115.1 + i * .25, 'hop', { gain: .4 });
  ev(HIT.bounce, 'hop', { gain: 1.2 }); ev(HIT.bounce + .5, 'hop', { gain: 1.2 }); ev(HIT.ride, 'felt'); ev(HIT.twoShot, 'laugh', { gain: .7 }); ev(HIT.twoShot + .4, 'giggle');
  ev(HIT.yawn, 'yawn'); ev(HIT.shrink3, 'shrink', { dur: 1.0, gain: .6 }); ev(HIT.climbIn, 'creak'); ev(HIT.inBook, 'flutter'); ev(HIT.bookCloses, 'bookClose'); ev(HIT.bookCloses, 'click', { gain: .6 });
  ev(HIT.crayonDown, 'crayonDown');
  // ambience beds
  [['city', 0, 11.4], ['yard', 12.0, 25.4], ['room', 26.0, 55.4], ['morning', 56.0, 63.0], ['class', 63.0, 79.4], ['yard', 80.0, 90.0], ['wind', 90.0, 100.0], ['yard', 100.0, 124.4], ['room', 125.0, 131.0], ['room', 131.0, 140.0]].forEach(([kind, t0, t1]) => ev(t0, 'amb', { kind, t0, t1 }));
  TL.SILENCE.forEach(([t0, t1]) => ev(t0, 'silence', { t0, t1 }));
  TL.SECS.forEach(s => ev(s.t, 'cue', { id: s.id }));
}

// ---------------- layers ----------------
const BG = { f: layer(), l: layer() }, BG2 = { f: layer(), l: layer() };
const G0 = group(), G1 = group(), G2 = group(), G3 = group(), G4 = group();
const FX = layer(), TXS = layer(), TXM = layer(), WASH = layer(), SUBK = layer(), SUBT = layer();
const allClear = () => { [BG.f, BG.l, BG2.f, BG2.l, FX, TXS, TXM, WASH, SUBK, SUBT].forEach(clear); [G0, G1, G2, G3, G4].forEach(clearGroup); };
let TEXTBOX = [];   // for TEXTS(t): on-screen lettering boxes

// ---------------- cameras per shot (page coords) ----------------
function camera(t) {
  const s = TL.shotAt(t);
  switch (s) {
    case 's01': { const tip = crayonTip(t); return t < 1.4 ? [tip[0], tip[1], 3.4] : mv(t, 1.4, 3.0, [tip[0], tip[1], 3.4], [1800, 1080, 1.25]); }
    case 's02': return FULL;
    case 's03': return mv(t, 9.0, 11.4, FULL, [2185, 905, 2.6]);
    case 's04': return FULL;
    case 's05': return [640, 1100, 1.5];
    case 's06': return [640, 1050, 2.9];
    case 's07': return [900, 1120, 1.1];
    case 's08': return FULL;
    case 's09': return [1900, 1000, 2.4];
    case 's10': return [1060, 790, 2.3];
    case 's11': return [1060, 790, 2.3];
    case 's12': return [1050, 820, 1.3];
    case 's13': return t < HIT.shrink1 ? [1550, 940, 2.8] : mv(t, 49.2, 50.0, [1180, 1100, 3.0], [1170, 1135, 4.6]);
    case 's14': return [1380, 1010, 1.6];
    case 's15': return mv(t, 53.0, 54.4, [1250, 1000, 2.0], [1420, 940, 1.9]);
    case 's16': return [300, 1120, 2.4];
    case 's17': return [ddWalkX(t) + 160, 1000, 1.5];
    case 's18': return mv(t, 63.0, 66.0, [3050, 920, 1.2], [4330, 920, 1.2], x => x);
    case 's19': return [4330, 900, 1.5];
    case 's20': return t < HIT.kidsLook ? [4250, 770, 4.2] : [3700, 820, 0.95];
    case 's21': return [4980, 600, 2.0];
    case 's22': return [4380, 930, 2.8];
    case 's23': return FULL;
    case 's24': return mv(t, 84.0, 86.0, [2010, 1070, 1.9], [2290, 450, 1.9]);
    case 's25': return [1180, 1050, 1.35];
    case 's26': return [1340, 1010, 2.9];
    case 's27': return [1650, 1050, 1.2];
    case 's28': return FULL;
    case 's29': return [2010, 1000, 2.8];
    case 's30': return [1740, 1000, 1.3];
    case 's31': return [1880, 1180, 2.2];
    case 's32': return FULL;
    case 's32b': return [1880, 1030, 1.7];
    case 's32c': return FULL;
    case 's33': return [1880, 960, 2.2];
    case 's34': return t < 129.5 ? [1250, 950, 1.1] : mv(t, 129.5, 131.0, [1250, 950, 1.1], [1000, 820, 1.4]);
    case 's35': case 's36': return FULL;
  }
  return FULL;
}

// ---------------- page 1: the city ----------------
function crayonTip(t) {   // the crayon's point while it colours the truck's box (0–1.5) and draws the wheels (1.6–3.0)
  if (t < 1.55) { const u = stepT(t) / 1.55, rows = 7, k = Math.floor(u * rows), v = u * rows - k; const x = lerp(1520, 1910, k % 2 ? 1 - v : v), y = 955 + k * 32 + 6 * Math.sin(v * 9); return [x, y]; }
  const t0 = t < 2.3 ? 1.6 : 2.3, cx = t < 2.3 ? 1590 : 1980; const u = pr(t, t0, t0 + .7); const a = -Math.PI / 2 + u * Math.PI * 2; return [cx + Math.cos(a) * 48, 1220 + Math.sin(a) * 48];
}
function actorsPage1(t) {
  // the crayon in the ECU (s01): purple while colouring, indigo for the wheels
  if (t < 3.0) { const tip = crayonTip(t); const col = t < 1.55 ? K.purple : K.ink; const a = -1.0 + 0.08 * Math.sin(stepT(t) * 7); crayonStick(G4, p => p, tip[0] + 30 * Math.cos(a + .2) * 2.4, tip[1] + 30 * Math.sin(a + .2) * 2.4, a, 2.4, 71, col); }
  // Dou Dou's window on the peach house (a bigger window than the others), with the box and the boy
  if (t >= 5.6) {
    const e = el(t, 5.6, 6.0, 6.0, 6.6), wx = 2100, wy = 800, ww = 190, wh = 200;
    const fr = [[wx, wy], [wx + ww, wy], [wx + ww, wy + wh], [wx, wy + wh]];
    part(G1, fr, { col: K.white, p: .9, gap: 9, w: 11, seed: 90, over: 0, draw: e.pf }, { w: 7, seed: 91, draw: e.pl });
    if (t >= 6.0) {
      const u = pr(t, 6.0, 6.5); DRAW.l = u; DRAW.f = pr(t, 6.2, 6.8);
      const look = t < 9.6 ? [-.5, .15] : t < 10.6 ? [-.2, .3] : [.1, .2];
      const E = { ...EXPR.shy, pupil: look, lid: t > 10.8 && t < 10.95 ? 1 : .35 };
      kid(G2, { ...DD, x: wx + ww / 2 + 24, y: wy + wh + 110, s: .82, view: 'q', flip: true, expr: E, seed: 2100, stripe: true });
      DRAW.l = 1; DRAW.f = 1;
      // the box on the sill (beside him) and the sill
      const bx = wx + 8, by = wy + wh - 70; part(G3, [[bx, by], [bx + 64, by], [bx + 64, by + 64], [bx, by + 64]], { col: K.sand, p: .7, gap: 7, w: 9, seed: 92, draw: e.pf }, { w: 6, seed: 93, draw: e.pl });
      line(G3.l, [[bx + 32, by], [bx + 32, by + 64]], { w: 4, seed: 94, p: .6, draw: e.pl });
      part(G3, [[wx - 12, wy + wh - 8], [wx + ww + 12, wy + wh - 8], [wx + ww + 12, wy + wh + 18], [wx - 12, wy + wh + 18]], { col: K.brown, p: .7, gap: 7, w: 9, seed: 95, draw: e.pf }, { w: 6, seed: 96, draw: e.pl });
    }
  }
  // the tiny red balloon drifting up past the truck (planted)
  if (t >= HIT.balloon && t < 11.4) { const u = pr(t, HIT.balloon, 10.5); const bx = 1700 + 60 * Math.sin(u * 5) + 40 * u, by = lerp(1120, 180, eo(u)); PG.balloon(G3.f, G3.l, bx, by, 18, 97, { on: true, pl: 1, pf: 1 }, { string: [[bx, by + 30], [bx - 6, by + 60], [bx + 4, by + 90]] }); }
  // the title lettered in the sky
  if (t >= HIT.title && t < 11.4) { const box = PG.letter(TXS, TXM, TL.TITLE.text, 1300, 400, 190, pr(t, HIT.title, HIT.title + 1.4), 31, { track: 24 }); TEXTBOX.push({ id: 'title', text: TL.TITLE.text, box: titleBox(1300, 400, 190, 6, 24) }); }
}
const titleBox = (x, y, size, n, track) => { const w = (size * n + track * (n - 1)) * CAM.s; return { x0: sx(x) - w / 2, y0: sy(y) - size * CAM.s, x1: sx(x) + w / 2, y1: sy(y) + size * .25 * CAM.s }; };

// ---------------- page 2: the kindergarten ----------------
function actorsPage2(t) {
  const G = KINDER_GATE;
  // other children (drawn with the page): one on the slide, two with a ball, the teacher waving at the door
  const e = el(t, 14.0, 14.8, 14.6, 15.4); if (t >= 14.0) { DRAW.l = e.pl; DRAW.f = e.pf; }
  if (t >= 14.0) {
    bgKid(G1, { x: 1790, y: 890, s: .72, view: 'front', pose: 'sit', expr: 'laughing', hair: 'spiky', shirt: K.green, bottom: K.brown, seed: 2200 });
    const ph = Math.floor(stepT(t) * 3) % 2;
    bgKid(G1, { x: 1200 + 20 * Math.sin(stepT(t) * 2), y: 1360, s: .75, view: 'side', pose: 'walk', ph, expr: 'giggle', hair: 'bun', shirt: K.pink, bottom: K.sky, hairCol: K.ink, seed: 2230 });
    bgKid(G1, { x: 1500, y: 1340, s: .75, view: 'q', pose: 'stand', expr: 'smile', hair: 'spiky', shirt: K.sky, bottom: K.orange, seed: 2260, arms: { R: [[32, -186], [60, -150], [80, -110]] } });
    dab(G1.f, 1420 + 60 * Math.abs(Math.sin(stepT(t) * 3)), 1300 - 120 * Math.abs(Math.sin(stepT(t) * 3)), 28, { col: K.red, seed: 2290, p: .9 }); line(G1.l, handCircle(1420 + 60 * Math.abs(Math.sin(stepT(t) * 3)), 1300 - 120 * Math.abs(Math.sin(stepT(t) * 3)), 28, 2291), { w: 5, seed: 2292 });
    const wave = t >= HIT.teacherWave ? Math.floor(stepT(t) * 6) % 2 : 0;
    if (t < 23.0) teacher(G1, { x: 1450, y: 1200, s: .95, seed: 2300, wave });
  }
  DRAW.l = 1; DRAW.f = 1;
  // Dou Dou at the gate from 14.8: head down, one foot turned in; in s05 a child runs past and waves; in s06 his mouth opens and closes; s07 the teacher's back
  if (t >= 14.8) {
    const e2 = el(t, 14.8, 15.4, 15.2, 15.9); DRAW.l = e2.pl; DRAW.f = e2.pf;
    let E = { ...EXPR.shy };
    if (t >= HIT.mouthOpen && t < HIT.mouthClose) { const u = Math.sin(pr(t, HIT.mouthOpen, HIT.mouthClose) * Math.PI); E = mixEx(EXPR.shy, { ...EXPR.shy, mouth: 'o', lid: .2, pupil: [0, .2] }, u); E.mouth = u > .35 ? 'o' : 'line'; }
    if (t >= HIT.mouthClose) { E = { ...EXPR.shy, lid: .45, pupil: [0, .7], mouth: 'line' }; }
    if (t > 22.3 && t < 22.45) E.lid = 1;
    const legs = [[[-18, -92], [-19, -50], [-20, -10]], [[18, -92], [14, -50], [6, -10]]];
    kid(G2, { ...DD, x: G.x, y: G.y, s: 1, view: t < 23 ? 'front' : 'q', expr: E, backpack: true, legs, seed: 2400, headTilt: .06 });
    DRAW.l = 1; DRAW.f = 1;
  }
  if (t >= 17.0 && t < 19.0) {   // a child runs past, waving at 18.2
    const u = pr(t, 17.0, 18.8), x = lerp(1150, 150, u), ph = Math.floor(stepT(t) * 5) % 2;
    const waving = t >= HIT.childWave && t < 18.8; const wv = Math.floor(stepT(t) * 6) % 2;
    bgKid(G3, { x, y: 1400, s: .85, view: 'side', flip: true, pose: 'walk', ph, expr: 'laughing', hair: 'pigtails', ribbons: false, shirt: K.green, dress: true, hairCol: K.brown, seed: 2500, arms: waving ? { R: [[0, -186], [-20, -230], [-30 + wv * 20, -280]] } : null });
  }
  if (t >= 23.0) teacherBack(G4, { x: 420, y: 1540, s: 1.9, seed: 2600 });
}
const KINDER_GATE = { x: 640, y: 1330 };

// ---------------- page 3 / 6: the bedroom at night ----------------
const BED = { x: 400, w: 1500 }, DDBED = { x: 1550, y: 1070 }, BOOK = PG.ROOM.book, LAMP = [PG.ROOM.lamp.x, PG.ROOM.lamp.y], BOX = PG.ROOM.box;
const PAGE_MONSTER = { x: BOOK.x + BOOK.w * .75, y: BOOK.y + BOOK.h - 30, s: 1.5 };   // the monster as drawn on the book's right page
function roomWash(t, t0, lampOn = 1, pageWash = 0) {   // the ultramarine night: three horizontal brush passes down the page (t0..t0+2.7), the lamp's cone knocked out, the book page washed later
  const g = WASH.g; g.save(); g.setTransform(CAM.s, 0, 0, CAM.s, W / 2 - CAM.x * CAM.s, H / 2 - CAM.y * CAM.s);
  const bands = [[-100, 540, t0, t0 + 1.0, 1], [460, 1020, t0 + .9, t0 + 1.9, -1], [940, 1560, t0 + 1.8, t0 + 2.7, 1]];
  const X0 = -300, X1 = 2900, R = mulberry(5);
  for (const [y0, y1, a, b, dir] of bands) {
    if (t < a) continue; const u = pr(t, a, b), e = ss(u), f = dir > 0 ? lerp(X0, X1, e) : lerp(X1, X0, e);
    const frontX = y => f + dir * 70 * Math.sin(clamp((y - y0) / (y1 - y0)) * Math.PI) + 12 * Math.sin(y * .05);
    g.save(); g.beginPath();
    if (dir > 0) { g.moveTo(X0 - 50, y0 - 200); for (let y = y0 - 200; y <= y1 + 200; y += 20) g.lineTo(frontX(y), y); g.lineTo(X0 - 50, y1 + 200); }
    else { g.moveTo(X1 + 50, y0 - 200); for (let y = y0 - 200; y <= y1 + 200; y += 20) g.lineTo(frontX(y), y); g.lineTo(X1 + 50, y1 + 200); }
    g.closePath(); g.clip();
    g.beginPath(); for (let x = X0; x <= X1; x += 40) { const y = y0 + 14 * Math.sin(x * .006 + y0) + 12 * hash(x * .37 + y0); x === X0 ? g.moveTo(x, y) : g.lineTo(x, y); }
    for (let x = X1; x >= X0; x -= 40) { const y = y1 + 14 * Math.sin(x * .005 + y1) + 14 * hash(x * .71 + y1); g.lineTo(x, y); }
    g.closePath(); g.fillStyle = '#000'; g.globalAlpha = .82; g.fill();
    g.save(); g.clip();
    for (let i = 0; i < 22; i++) { const yy = lerp(y0, y1, R()), wdt = 6 + R() * 30, dark = R() < .55; g.beginPath(); for (let x = X0; x <= X1; x += 60) { const y = yy + 14 * Math.sin(x * .002 + i) + 6 * Math.sin(x * .01 + i * 2); x === X0 ? g.moveTo(x, y) : g.lineTo(x, y); } g.lineWidth = dark ? wdt : wdt * .5; g.globalCompositeOperation = dark ? 'source-over' : 'destination-out'; g.globalAlpha = dark ? .14 + R() * .12 : .05 + R() * .07; g.strokeStyle = '#000'; g.stroke(); }
    g.globalCompositeOperation = 'source-over';
    if (u < 1) { g.beginPath(); for (let y = y0 - 80; y <= y1 + 80; y += 16) { const x = frontX(y) - dir * 14; y === y0 - 80 ? g.moveTo(x, y) : g.lineTo(x, y); } g.lineWidth = 34; g.globalAlpha = .3; g.stroke(); }
    g.restore(); g.restore();
  }
  // the lamp's cone of light
  PG.lampCone(g, LAMP, t, lampOn);
  // the book's page painted at 41: two quick horizontal passes across the right page
  if (pageWash > 0) {
    const P = { x: BOOK.x + BOOK.w / 2, y: BOOK.y, w: BOOK.w / 2, h: BOOK.h };
    g.save(); g.beginPath(); g.rect(P.x + 4, P.y + 4, P.w - 8, P.h - 8); g.clip();
    [[P.y, P.y + P.h * .55, 0, .55, 1], [P.y + P.h * .45, P.y + P.h, .5, 1, -1]].forEach(([y0, y1, a, b, dir]) => {
      const u = pr(pageWash, a, b); if (u <= 0) return; const f = dir > 0 ? lerp(P.x - 40, P.x + P.w + 40, ss(u)) : lerp(P.x + P.w + 40, P.x - 40, ss(u));
      g.beginPath(); if (dir > 0) { g.moveTo(P.x - 40, y0); for (let y = y0; y <= y1; y += 10) g.lineTo(f + 20 * Math.sin((y - y0) / (y1 - y0) * Math.PI) + 5 * Math.sin(y * .1), y); g.lineTo(P.x - 40, y1); }
      else { g.moveTo(P.x + P.w + 40, y0); for (let y = y0; y <= y1; y += 10) g.lineTo(f - 20 * Math.sin((y - y0) / (y1 - y0) * Math.PI) + 5 * Math.sin(y * .1), y); g.lineTo(P.x + P.w + 40, y1); }
      g.closePath(); g.fillStyle = '#000'; g.globalAlpha = .8; g.fill();
    });
    g.restore();
  }
  g.restore();
}
function brushProp(C, x, y, a, seed) {   // a small flat brush with a wet blue tip, held from the right
  const T = pts => xf(pts, { x, y, r: a });
  part(C, T([[0, -12], [260, -16], [280, 0], [260, 16], [0, 12]]), { col: K.brown, p: .85, gap: 6, w: 8, ang: a + 1.4, seed }, { w: 4.5, seed: seed + 1 });
  part(C, T([[-70, -16], [0, -18], [0, 18], [-70, 16]]), { col: K.sand, p: .6, gap: 5, w: 7, seed: seed + 2 }, { w: 4.5, seed: seed + 3 });
  part(C, T([[-130, -14], [-70, -18], [-70, 18], [-130, 14], [-144, 0]]), { col: K.ink, p: .75, gap: 5, w: 7, seed: seed + 4 }, { w: 4.5, seed: seed + 5 });
}
function monsterOnPage(C, t, o = {}) {   // the monster as drawn (then alive) on the book's right page
  const lineDraw = pr(t, HIT.draw0, HIT.draw0 + 5.0), fillDraw = pr(t, HIT.drawFill0, HIT.drawFill0 + 3.5);
  const wax = pr(t, 37.4, 38.2), pupils = pr(t, HIT.pupils, HIT.pupils + .5);
  let E = MEXPR.happy, look = [0, 0];
  if (t >= HIT.pupils) look = t < HIT.looks ? [0, 0] : t < HIT.looks + .4 ? [-.7, 0] : t < HIT.looks + .8 ? [.7, 0] : [0, .1];
  const alive = t >= HIT.blink + .25;
  const blinkLid = (t >= HIT.blink && t < HIT.blink + .22) ? 1 : 0;
  const base = { x: PAGE_MONSTER.x, y: PAGE_MONSTER.y, s: PAGE_MONSTER.s, seed: 600, look, cheeks: 0, ...o };
  DRAW.l = lineDraw; DRAW.f = fillDraw;
  if (!alive) monster(C, { ...base, wax: Math.max(wax, .001), pupils, expr: { ...MEXPR.happy, teeth: 1 } });
  else monster(C, { ...base, expr: { ...MEXPR.happy, lid: blinkLid }, look });
  DRAW.l = 1; DRAW.f = 1;
}
function actorsPage3(t) {
  // the lamp is coloured at 28.0 (page3 draws the stand); Dou Dou drawn 27.4–28.4 sitting up in bed, the book on his knees from 28.6, the crayon box on the blanket from 29.0
  const lampE = el(t, 27.9, 28.3, 28.0, 28.5);
  if (t >= 27.4) {
    const e = el(t, 27.4, 28.2, 28.0, 28.8); DRAW.l = e.pl; DRAW.f = e.pf;
    const ds = douState(t);
    kid(G1, ds);
    DRAW.l = 1; DRAW.f = 1;
  }
  // the blanket (over his legs): rises to his eyes at 48.0; drops to peek at 50.8
  if (t >= 27.6) {
    const up = t < HIT.blanket ? 0 : t < HIT.peek ? ss(pr(t, HIT.blanket, HIT.blanket + .35)) : t < HIT.giggle ? lerp(1, .55, ss(pr(t, HIT.peek, HIT.peek + .3))) : lerp(.55, 0, ss(pr(t, HIT.giggle, HIT.giggle + .5)));
    const edge = x => -up * 180 * Math.exp(-Math.pow((x - DDBED.x) / 160, 2));
    PG.blanket(G2.f, G2.l, BED.x + 130, BED.x + BED.w + 40, 1000, 1200, 450, el(t, 27.6, 28.2, 28.2, 29.0), edge);
    if (up > 0) { // his hands gripping the blanket edge
      [[DDBED.x - 50], [DDBED.x + 50]].forEach(([hx], i) => part(G2, handCircle(hx, 1000 + edge(hx) + 10, 12, 460 + i, 0, 16), { col: K.peach, p: .55, gap: 8, w: 9, seed: 462 + i }, { w: 5.5, seed: 464 + i }));
    }
  }
  // the open book standing on his knees (from 28.6), the crayon box on the blanket (from 29.0)
  const bookE = el(t, 28.6, 29.2, 29.0, 29.8);
  PG.book(G3.f, G3.l, BOOK.x, BOOK.y, BOOK.w, BOOK.h, 470, bookE);
  const boxMissing = t >= HIT.purple ? [5] : [];
  PG.crayonBox(G3.f, G3.l, BOX.x, BOX.y, .9, 480, el(t, 29.0, 29.5, 29.3, 29.9), boxMissing);
  // the monster drawn on the page (33–40.5), alive from 43.4; climbs off 44.5–46.6
  if (t >= HIT.draw0 && t < HIT.armOut) monsterOnPage(G3, t);
  // the hand with the crayon while drawing (33–40.5) and the hand over the box (30.6–33): drawn from the right, Dou Dou's own hand
  if (t >= 30.3 && t < 33.0) {
    const hx = t < 30.9 ? lerp(2300, 1750, eo(pr(t, 30.3, 30.9))) : t < 31.6 ? lerp(1750, 1830, ss(pr(t, 31.2, 31.6))) : t < HIT.purple ? lerp(1830, 1950, ss(pr(t, 31.9, 32.2))) : lerp(1950, 2200, ei(pr(t, HIT.purple + .2, 33.0)));
    const hy = t < HIT.purple ? 860 + 20 * Math.sin(t * 3) : lerp(880, 760, ss(pr(t, HIT.purple, HIT.purple + .3))) - 60 * ei(pr(t, HIT.purple + .2, 33.0));
    handProp(G4, hx, hy, t >= HIT.purple ? K.purple : null, -1.2);
  }
  if (t >= HIT.draw0 && t < 40.8) {
    const u = stepT(t) * .9; const a = u * 1.7; const r = 110 + 40 * Math.sin(u * 2.3); const hx = PAGE_MONSTER.x + Math.cos(a) * r * 1.1, hy = PAGE_MONSTER.y - 200 + Math.sin(a) * r;
    handProp(G4, hx + 30, hy + 30, K.purple, -1.1);
  }
  // the brush at 41: two passes over the page
  if (t >= HIT.washPage && t < 42.4) { const u = pr(t, HIT.washPage, HIT.washPage + 1.2); const P = { x: BOOK.x + BOOK.w / 2, w: BOOK.w / 2 }; const bx = u < .55 ? lerp(P.x - 40, P.x + P.w + 40, ss(u / .55)) : lerp(P.x + P.w + 40, P.x - 40, ss((u - .5) / .5)); const by = u < .55 ? BOOK.y + 60 + 100 * (u / .55) : BOOK.y + 260 + 100 * ((u - .5) / .5); brushProp(G4, bx + 20, by, -.5, 490); }
  // the pupils dotted in at 42.5: the crayon tip
  if (t >= HIT.pupils - .1 && t < HIT.pupils + .5) { const i = t < HIT.pupils + .2 ? -1 : 1; crayonStick(G4, p => p, PAGE_MONSTER.x + i * 36 + 19, PAGE_MONSTER.y - 220 * 1.5 * .7 - 18, 2.4, 1.0, 491, K.ink); }
  // off the page: an arm out, then the whole monster climbs down onto the blanket
  if (t >= HIT.armOut) monsterFree(G3, t);
}
function handProp(C, x, y, crayonCol, a) {   // a child's hand holding a crayon (or empty), the forearm running out of frame to the right
  part(C, [[x + 20, y - 24], [x + 600, y - 60], [x + 600, y + 10], [x + 20, y + 10]], { col: K.orange, p: .7, gap: 9, w: 10, ang: .1, seed: 495, over: 3 }, { w: 6, seed: 496 });
  part(C, [[x + 20, y - 20], [x + 90, y - 26], [x + 90, y + 12], [x + 20, y + 14]], { col: K.peach, p: .55, gap: 9, w: 10, seed: 497, over: 2 }, { w: 5.5, seed: 498 });
  part(C, handCircle(x, y, 22, 499, 0, 18), { col: K.peach, p: .55, gap: 9, w: 10, seed: 500, over: 2 }, { w: 5.5, seed: 501 });
  if (crayonCol) crayonStick(C, p => p, x - 18, y + 4, a, 1.0, 502, crayonCol);
}
function douState(t) {   // Dou Dou in bed (pages 3 and 6): sitting up, facing left, the book on his knees
  let E = EXPR.curious, arms = null, look = null;
  const base = { ...DD, x: DDBED.x, y: DDBED.y, s: 1, view: 'q', flip: true, pose: 'sit', seed: 3000 };
  if (t < 44.0) { E = { ...EXPR.curious, pupil: [-.5, .3], lid: .1 }; if (t > 35.0 && t < 35.15) E = { ...E, lid: 1 }; if (t > 42.0 && t < 44.0) E = { ...EXPR.surprised, pupil: [-.5, .2], lid: .1, mouth: 'small' }; }
  else if (t < HIT.jaw) E = { ...EXPR.surprised, pupil: [-.6, .3], mouth: 'small' };
  else if (t < HIT.gasp) E = { ...EXPR.surprised, pupil: [-.6, .3], mouth: 'open' };
  else if (t < HIT.peek) E = { ...EXPR.scared, pupil: [-.5, .2] };
  else if (t < HIT.giggle) E = { ...EXPR.curious, pupil: [-.6, .4], lid: .2 };
  else if (t < 55.4) E = t < HIT.pop ? EXPR.giggle : EXPR.laughing;
  // page 6
  if (t >= 125.0) { E = t < HIT.yawn ? { ...EXPR.smile, pupil: [-.5, .2] } : t < 129.0 ? { ...EXPR.smile, pupil: [-.5, .2], lid: .3 } : t < 130.4 ? { ...EXPR.smile, lid: .45, pupil: [-.5, .2] } : { ...EXPR.sleepy, lid: .8 }; if (t >= 129.0 && t < 130.6) { const wv = Math.floor(stepT(t) * 5) % 2; arms = { R: [[-36, -100], [-70, -140], [-80 + wv * 14, -200]] }; } }
  return { ...base, expr: E, arms, headTilt: t > 51 && t < 55.4 ? -.1 : 0 };
}
function monsterFree(C, t) {   // the monster off the page: arm out (44.5), climb (45.3–46.6), land (46.6), shrink (48.6), squeak/grow (50.3–52.2), hug (54)
  const base = { seed: 600, cheeks: 0 };
  if (t < HIT.climb) {   // still on the page, one arm reaching out of the book over the cover edge
    const u = ss(pr(t, HIT.armOut, HIT.climb)); const R = [[90, -121], [lerp(140, 160, u), lerp(-80, 0, u)], [lerp(160, 190, u), lerp(-40, 80, u)]];
    monster(C, { ...base, x: PAGE_MONSTER.x, y: PAGE_MONSTER.y, s: PAGE_MONSTER.s, expr: { ...MEXPR.mischief, lid: .2 }, look: [.5, .4], arms: { R }, stretch: 1 + .08 * u });
    return;
  }
  let x, y, s = 1.0, sq = 1, st = 1, E = MEXPR.happy, pose = 'stand', look = [0, 0], r = 0, arms = null;
  if (t < HIT.land) { const u = pr(t, HIT.climb, HIT.land); x = lerp(PAGE_MONSTER.x + 20, 1150, ss(u)); y = lerp(PAGE_MONSTER.y + 40, 1150, u * u) - 60 * Math.sin(u * Math.PI); s = lerp(PAGE_MONSTER.s, 1.0, u); st = 1 + .25 * Math.sin(u * Math.PI); E = { ...MEXPR.delighted, happy: 0, lid: 0 }; look = [.2, .7]; r = .45 * Math.sin(u * Math.PI); arms = { L: [[-90, -121], [-120, -40], [-90, 40]], R: [[90, -121], [120, -40], [90, 40]] }; }
  else { x = 1150; y = 1150; const u = pr(t, HIT.land, HIT.land + .45); sq = 1 + .32 * Math.sin(u * Math.PI) * (1 - u); E = { ...MEXPR.delighted, happy: 0, lid: 0 }; look = [.6, 0]; }
  if (t >= HIT.jaw) { E = MEXPR.proud; look = [.6, -.1]; }
  if (t >= HIT.gasp) { E = MEXPR.surprised; look = [.6, 0]; }
  if (t >= HIT.shrink1) { const u = pr(t, HIT.shrink1, HIT.shrink1 + .7); s = lerp(1.0, .14, back(u, 1.2)); E = MEXPR.scared; look = [.5, -.2]; }
  if (t >= HIT.squeak) { s = .14; E = MEXPR.surprised; const u = pr(t, HIT.squeak, HIT.squeak + .3); y = 1150 - 40 * Math.sin(u * Math.PI); st = 1 + .3 * Math.sin(u * Math.PI); }
  if (t >= HIT.peek) { s = .14; E = { ...MEXPR.sad, happy: 0 }; look = [.6, -.3]; }
  if (t >= HIT.giggle) { s = .14; E = MEXPR.happy; look = [.6, -.3]; }
  if (t >= HIT.pop) { const u = pr(t, HIT.pop, HIT.pop + .5); s = lerp(.14, 1.0, back(u, 2.2)); E = MEXPR.delighted; look = [.6, -.2]; sq = 1 + .15 * Math.sin(u * Math.PI); }
  if (t >= HIT.hug - .5) { const u = ss(pr(t, HIT.hug - .5, HIT.hug)); x = lerp(1150, 1360, u); pose = 'hug'; E = MEXPR.delighted; const hx = (DDBED.x - 50 - x) / 1, hy = (DDBED.y - 172 - y); arms = { L: [[-90, -121], [lerp(-130, -40, u), lerp(-160, -200, u)], [lerp(-80, hx - 40, u), lerp(-220, hy - 20, u)]], R: [[90, -121], [lerp(130, 120, u), lerp(-160, -190, u)], [lerp(80, hx + 10, u), lerp(-220, hy - 40, u)]] }; }
  if (t >= HIT.hug && t < 55.4) { r = .08 * Math.sin(stepT(t) * 8); }
  monster(C, { ...base, x, y, s, expr: E, pose, look, squash: sq, stretch: st, r, arms });
}
function roomActorsPage6(t) {   // page 6: the bedroom again; the monster yawns, shrinks, climbs back into the book; Dou Dou waves; the book closes; the lamp goes off
  kid(G1, douState(t));
  PG.blanket(G2.f, G2.l, BED.x + 130, BED.x + BED.w + 40, 1000, 1200, 450, { on: true, pl: 1, pf: 1 });
  const closing = pr(t, HIT.bookCloses, HIT.bookCloses + .5), cosv = Math.cos(closing * Math.PI);
  // the book: the left page always; the right page while the cover has not come over it
  const RP = { x: BOOK.x + BOOK.w / 2, y: BOOK.y, w: BOOK.w / 2, h: BOOK.h };
  PG.book(G3.f, G3.l, BOOK.x, BOOK.y, BOOK.w, BOOK.h, 470, { on: true, pl: 1, pf: 1 });
  // the monster
  const inBook = t >= HIT.inBook;
  if (inBook && closing < .5) monster(G3, { x: PAGE_MONSTER.x, y: PAGE_MONSTER.y, s: PAGE_MONSTER.s, seed: 600, expr: t < HIT.bookCloses ? MEXPR.sleepy : MEXPR.asleep, look: [.6, .2] });
  else if (!inBook) {
    let x = 1150, y = 1150, s = 1.0, E = MEXPR.happy, pose = 'stand', look = [.6, 0], sq = 1, st = 1, r = 0;
    if (t >= HIT.yawn && t < HIT.yawn + 1.0) { const u = Math.sin(pr(t, HIT.yawn, HIT.yawn + 1.0) * Math.PI); E = mixMex(MEXPR.sleepy, MEXPR.yawn, u); E.mouth = u > .3 ? 'open' : 'small'; st = 1 + .06 * u; r = -.1 * u; }
    else if (t >= HIT.yawn + 1.0) E = MEXPR.sleepy;
    if (t >= HIT.shrink3) { const u = pr(t, HIT.shrink3, HIT.shrink3 + .6); s = lerp(1.0, PAGE_MONSTER.s * .62, back(u, 1.2)); }
    if (t >= HIT.climbIn) { const u = pr(t, HIT.climbIn, HIT.inBook); x = lerp(1150, PAGE_MONSTER.x, u); y = lerp(1150, PAGE_MONSTER.y, u) - 80 * Math.sin(u * Math.PI); pose = 'climb'; st = 1 + .2 * Math.sin(u * Math.PI); s = lerp(PAGE_MONSTER.s * .62, PAGE_MONSTER.s, u); r = -.25 * Math.sin(u * Math.PI); }
    monster(G3, { x, y, s, seed: 600, expr: E, pose, look, squash: sq, stretch: st, r });
  }
  // the cover closing: from the right edge over the right page to the gutter, then over the left page
  if (closing > 0) {
    const gx = BOOK.x + BOOK.w / 2; let x0, x1;
    if (closing < .5) { x0 = gx; x1 = gx + RP.w * cosv; } else { x0 = gx + RP.w * cosv; x1 = gx; }
    const cov = [[Math.min(x0, x1) - 8, BOOK.y - 14], [Math.max(x0, x1) + 8, BOOK.y - 14], [Math.max(x0, x1) + 8, BOOK.y + BOOK.h + 14], [Math.min(x0, x1) - 8, BOOK.y + BOOK.h + 14]];
    if (Math.abs(x1 - x0) > 6) part(G4, cov, { col: K.purple, p: .85, gap: 8, w: 10, ang: .3, seed: 471 }, { w: 6, seed: 472 });
    if (closing >= 1) { PG.letter(TXS, TXM, '我的', gx - RP.w / 2, BOOK.y + BOOK.h / 2 - 20, 90, 1, 61, { shadow: false, col: K.yellow }); PG.letter(TXS, TXM, '怪兽', gx - RP.w / 2, BOOK.y + BOOK.h / 2 + 90, 90, 1, 62, { shadow: false, col: K.yellow }); }
  }
  PG.crayonBox(G3.f, G3.l, BOX.x, BOX.y, .9, 480, { on: true, pl: 1, pf: 1 }, []);
}

// ---------------- page 4: the morning and the classroom ----------------
const M = PG.MORNING, CLS = M.cls;
const ddWalkX = t => lerp(450, 2250, pr(t, 59.0, 63.0));
function actorsPage4(t) {
  // s16: the backpack on the doorstep; the mouse-sized monster walks up, squeezes in, the zip closes, two eyes peek
  if (t < 59.0) {
    const e = el(t, 56.6, 57.1, 57.0, 57.5);
    const sqz = pr(t, HIT.squeeze + .6, HIT.zip - .2);
    if (t >= HIT.squeeze && sqz < 1) { const u = pr(t, HIT.squeeze, HIT.squeeze + .6); const x = lerp(520, 400, u); const ph = Math.floor(stepT(t) * 6) % 2; monster(G1, { x: sqz > 0 ? 380 - 40 * sqz : x, y: 1240 - 20 * sqz, s: .14, seed: 600, pose: 'walk', ph, expr: MEXPR.scared, look: [-.6, -.3], squash: 1 + .3 * sqz, stretch: 1 - .2 * sqz, flip: true }); }
    backpackProp(G2, { x: 330, y: 1240, s: 1.0, seed: 980, e, peek: t >= HIT.zip - .1, look: [.3 + .3 * Math.sin(stepT(t) * 2), -.2], zip: t >= HIT.zip ? ss(pr(t, HIT.zip, HIT.zip + .35)) : null });
    return;
  }
  if (t < 63.0) {   // s17: tight follow: Dou Dou walks right, the backpack's eyes glance about
    const x = ddWalkX(t), ph = Math.floor(stepT(t) * 4) % 2, b = bob(t, 4) * 8;
    const look = t < HIT.eyesGlance ? [.2, -.1] : t < HIT.eyesGlance + .4 ? [-.6, -.3] : t < HIT.eyesGlance + .8 ? [.6, -.4] : [.1, .2];
    kid(G2, { ...DD, x, y: 1240 - b, s: 1, view: 'side', pose: 'walk', ph, expr: { ...EXPR.shy, pupil: [.4, .2], lid: .3 }, backpack: true, peek: true, peekLook: look, seed: 3200 });
    return;
  }
  // the classroom (63–80): children behind the table, crayon boxes, Dou Dou at the right end; the table in front (G3) hides their legs
  const kids = [['spiky', K.green, 2200], ['bun', K.pink, 2230], ['pigtails', K.sky, 2260]];
  PG.CLASS_SEATS.forEach((x, i) => { const [hair, shirt, seed] = kids[i]; const surprised = t >= HIT.kidsLook && t < 76.5; bgKid(G1, { x, y: CLS.tableY + 330, s: .95, view: i === 1 ? 'q' : 'front', pose: 'stand', expr: surprised ? { ...EXPR.surprised, pupil: [i - 1, -.6] } : 'smile', hair, shirt, hairCol: i === 1 ? K.ink : K.brown, bottom: K.brown, seed, arms: { L: [[-34, -186], [-60, -150], [-30, -120]], R: [[34, -186], [60, -150], [30, -120]] } }); });
  // Dou Dou at the right end of the table
  let E = { ...EXPR.shy, pupil: [-.4, .3] }, pose = 'stand', arms = { L: [[-34, -186], [-60, -150], [-30, -120]], R: [[34, -186], [60, -150], [30, -120]] };
  if (t >= HIT.unzip) E = { ...EXPR.curious, pupil: [-.5, .5] };
  if (t >= HIT.crunch1) E = { ...EXPR.surprised, pupil: [-.6, .4], mouth: 'small' };
  if (t >= HIT.crunch3) E = { ...EXPR.giggle };
  if (t >= HIT.sneeze) E = { ...EXPR.surprised, pupil: [-.5, .3], mouth: 'open' };
  if (t >= HIT.laughCU) { E = EXPR.giggle; pose = 'cover'; arms = null; }
  if (t >= HIT.faceFalls) { E = { ...EXPR.shy, pupil: [.2, .4], lid: .4 }; pose = 'stand'; arms = { L: [[-34, -186], [-60, -150], [-30, -120]], R: [[34, -186], [60, -150], [30, -120]] }; }
  kid(G1, { ...DD, x: 4380, y: CLS.tableY + 330, s: 1, view: 'front', pose, expr: E, seed: 3300, arms });
  // the backpack on the floor by his chair: unzips by itself at 65.0
  backpackProp(G2, { x: 4640, y: CLS.floor, s: .9, seed: 985, peek: t >= HIT.unzip + .2 && t < HIT.crunch1 - .9, look: [-.6, -.4], zip: t < HIT.unzip ? 1 : 1 - ss(pr(t, HIT.unzip, HIT.unzip + .4)) });
  // the table in front, then the crayon boxes on it
  PG.table(G3.f, G3.l, CLS.table[0], CLS.table[1], CLS.tableY, 640, { on: true, pl: 1, pf: 1 });
  PG.CLASS_SEATS.forEach((x, i) => PG.crayonBox(G3.f, G3.l, x + 150, CLS.tableY + 4, .55, 650 + i * 10, { on: true, pl: 1, pf: 1 }));
  const eaten = [[HIT.crunch1, 0], [HIT.crunch2, 3], [HIT.crunch3, 4], [HIT.crunch4, 1], [HIT.crunchY, 2]];
  const missing = eaten.filter(([tt]) => t >= tt - .45).map(([, i]) => i);
  PG.crayonBox(G3.f, G3.l, 4500, CLS.tableY + 4, .55, 690, { on: true, pl: 1, pf: 1 }, missing);
  // the cat-sized monster on the table (from 65.6: it climbs out of the backpack and up onto the table)
  if (t >= HIT.unzip + .6 && t < 76.5) monsterTable(G4, t, eaten);
  // the colour burst of the sneeze
  if (t >= HIT.sneeze) sneezeBurst(FX, t);
  // s21: the sandpit through the window: the hiding monster (a mound with eyes) and the shovel
  if (t >= HIT.sandpit - .2 && t < 76.5) {
    const g = t >= HIT.giggle2;
    monster(G1, { x: 4980, y: CLS.win.y + CLS.win.h - 70, s: 1.3, seed: 600, pose: 'hide', expr: g ? MEXPR.delighted : MEXPR.mischief, look: [.5 * Math.sin(stepT(t) * 2), -.2] });
    if (t >= HIT.pat - .5) { const u = t < HIT.pat ? ei(pr(t, HIT.pat - .5, HIT.pat)) : 1; const pat = (t >= HIT.pat && t < HIT.pat + .6) ? Math.abs(Math.sin(pr(t, HIT.pat, HIT.pat + .6) * Math.PI * 2)) : 0; PG.shovel(G2.f, G2.l, lerp(5420, 5190, u), CLS.win.y + CLS.win.h - 100 + 30 * pat, -.75 + .3 * pat, 660, { on: true, pl: 1, pf: 1 }); }
  }
}
function monsterTable(C, t, eaten) {
  const bx = 4500, by = CLS.tableY + 4;
  let x = 4250, y = by, s = .42, E = MEXPR.mischief, pose = 'stand', look = [.6, .2], cheeks = 0, sq = 1, st = 1, r = 0, arms = null;
  if (t < HIT.crunch1 - .6) { const u = pr(t, HIT.unzip + .6, HIT.crunch1 - .6); x = lerp(4620, 4250, u); y = lerp(CLS.floor - 40, by, ss(u)) - 60 * Math.sin(u * Math.PI); pose = 'walk'; }
  const n = eaten.filter(([tt]) => t >= tt).length; cheeks = Math.min(1, n * .25);
  const next = eaten.find(([tt]) => t < tt);
  let heldCol = null;
  if (next && t >= next[0] - .45 && t < next[0]) { pose = 'eat'; heldCol = K[PG.CRAYONS[next[1]]]; E = MEXPR.chew; look = [.2, -.3]; }
  else if (n > 0 && t < HIT.twitch) { const last = eaten[n - 1][0]; const u = pr(t, last, last + .25); sq = 1 + .12 * Math.sin(u * Math.PI); E = { ...MEXPR.chew, lid: .4 }; }
  if (t >= HIT.twitch) { E = MEXPR.pre; r = .05 * Math.sin(stepT(t) * 25); }
  if (t >= HIT.antic) { const u = pr(t, HIT.antic, HIT.sneeze); r = -.25 * u; sq = 1 - .12 * u; st = 1 + .18 * u; E = MEXPR.pre; }
  if (t >= HIT.sneeze) { const u = pr(t, HIT.sneeze, HIT.sneeze + .5); r = lerp(.3, 0, u); st = lerp(1.25, 1, u); sq = lerp(.85, 1, u); E = u < .7 ? MEXPR.sneeze : MEXPR.surprised; cheeks = 1 - u; }
  if (t >= HIT.sneeze + .5) { cheeks = 0; E = { ...MEXPR.surprised, lid: .1 }; look = [-.4, .3]; }
  if (t >= HIT.sandpit) return;   // it has gone (to the sandpit)
  const m = monster(C, { x, y, s, seed: 600, expr: E, pose, look, cheeks, squash: sq, stretch: st, r, arms });
  if (heldCol) crayonStick(C, p => p, m.handL[0] + 6, m.handL[1] - 10, -1.3, .6, 691, heldCol);
}
function sneezeBurst(L, t) {   // every crayon colour sprayed across the page from the monster's mouth
  const u = pr(t, HIT.sneeze, HIT.sneeze + .9); if (u <= 0) return;
  const R = mulberry(77), cols = ['red', 'orange', 'yellow', 'green', 'sky', 'purple', 'pink', 'brown'];
  for (let i = 0; i < 46; i++) {
    const a = -.4 + (R() - .5) * 2.6, d = 120 + R() * 1500, r = 14 + R() * 30, k = R() * .7; if (u < k) continue;
    const v = eo((u - k) / (1 - k)); const x = 4290 + Math.cos(a) * d * v, y = 760 + Math.sin(a) * d * v + 120 * v * v;
    if (Math.hypot(x - 4380, y - 952) < 190) continue;   // never over Dou Dou's face
    dab(L, x, y, r * (0.6 + .4 * v), { col: K[cols[i % 8]], seed: 700 + i, p: .85, sq: .8 });
  }
}

// ---------------- page 5: the playground ----------------
const P5 = PG.PLAY;
function actorsPage5(t) {
  // other children (drawn 81.6–82.4)
  const e = el(t, 81.6, 82.3, 82.2, 83.0); DRAW.l = e.pl; DRAW.f = e.pf;
  if (t >= 81.6) {
    bgKid(G1, { x: 430, y: 1010, s: .7, view: 'front', pose: 'sit', expr: 'laughing', hair: 'spiky', shirt: K.green, bottom: K.brown, seed: 2200 });
    const ph = Math.floor(stepT(t) * 3) % 2;
    bgKid(G1, { x: 700 + 60 * Math.sin(stepT(t) * 1.2), y: 1120, s: .72, view: 'side', pose: 'walk', ph, expr: 'giggle', hair: 'bun', shirt: K.pink, bottom: K.sky, hairCol: K.ink, seed: 2230 });
    bgKid(G1, { x: 1000, y: 1180, s: .72, view: 'q', pose: 'sit', expr: 'smile', hair: 'pigtails', ribbons: false, shirt: K.sky, dress: true, seed: 2260 });
  }
  DRAW.l = 1; DRAW.f = 1;
  // Ni Ni under the tree (drawn 83.0–83.6): sitting, sad, looking up at the balloon
  const ne = el(t, 83.0, 83.6, 83.4, 84.0); if (t >= 83.0) { DRAW.l = ne.pl; DRAW.f = ne.pf; kid(G2, niniState(t)); DRAW.l = 1; DRAW.f = 1; }
  // the balloon: in the branches until freed, then down to Ni Ni's hand
  balloonState(t);
  // Dou Dou and the monster (drawn 82.4–83.0)
  const de = el(t, 82.4, 83.0, 82.8, 83.4); if (t >= 82.4) { DRAW.l = de.pl; DRAW.f = de.pf; playActors(t); DRAW.l = 1; DRAW.f = 1; }
  // 你好 drawn in the air between them, in a purple crayon bubble
  if (t >= HIT.nihao && t < 100.6) { const u = pr(t, HIT.nihao, HIT.nihao + .8); PG.speechBubble(FX, 1760, 850, 330, 190, [1600, 960], 801, { on: true, pl: Math.min(1, u * 1.6) }); PG.letter(TXS, TXM, '你好', 1760, 890, 120, pr(t, HIT.nihao + .2, HIT.nihao + .8), 33, { shadow: false, col: K.purple, track: 10 }); TEXTBOX.push({ id: 'nihao', text: '你好', box: titleBox(1760, 890, 120, 2, 10) }); }
  // the wax twinkle at 105.5
  if (t >= HIT.twinkle && t < HIT.twinkle + .8) { const u = pr(t, HIT.twinkle, HIT.twinkle + .8), a = Math.sin(u * Math.PI); [[2110, 700], [2030, 660], [2150, 790]].forEach(([x, y], i) => { const r = 14 + 26 * a; line(FX, [[x - r, y], [x + r, y]], { w: 4, col: K.white, p: a, seed: 810 + i, wob: .2 }); line(FX, [[x, y - r], [x, y + r]], { w: 4, col: K.white, p: a, seed: 820 + i, wob: .2 }); }); }
}
function niniState(t) {
  const base = { ...NN, seed: 3400 };
  if (t < 102.0) { let E = { ...EXPR.sad, pupil: [.4, -.7] }; if (t >= HIT.niniUp) E = { ...EXPR.surprised, pupil: [-.6, -.2] }; if (t > 88.0 && t < 88.15) E.lid = 1; return { ...base, x: P5.nini[0], y: P5.nini[1], s: 1, view: 'front', pose: 'sit', expr: E, headTilt: t < HIT.niniUp ? -.08 : .1 }; }
  if (t < 104.8) { return { ...base, x: P5.nini[0], y: P5.nini[1], s: 1, view: 'front', pose: 'stand', expr: { ...EXPR.surprised, pupil: [-.2, -.6], mouth: 'open' }, arms: { R: [[36, -186], [60, -230], [50, -300]] } }; }
  if (t < 107.0) { return { ...base, x: P5.nini[0], y: P5.nini[1], s: 1, view: 'front', pose: 'stand', expr: 'laughing', arms: { R: [[36, -186], [70, -200], [84, -250]] } }; }
  if (t < 110.0) { const caught = t >= HIT.crayonPop + .6; return { ...base, x: P5.nini[0], y: P5.nini[1], s: 1, view: 'q', flip: true, pose: 'stand', expr: caught ? 'laughing' : { ...EXPR.surprised, pupil: [-.6, .2] }, arms: { L: [[-36, -186], [-70, -170], [-70, -130]], R: [[36, -186], [60, -170], [50, -130]] }, hold: caught ? 'crayon' : null, holdCol: K.yellow }; }
  if (t < 115.0) { const E = t < HIT.eyes2 ? { ...EXPR.curious, pupil: [-.5, .5], lid: .15 } : t < HIT.hop ? { ...EXPR.surprised, pupil: [-.5, .5] } : EXPR.laughing; return { ...base, x: P5.nini[0] - 40, y: P5.nini[1], s: 1, view: 'side', flip: true, pose: 'sit', expr: E, hold: 'crayon', holdCol: K.yellow, arms: { R: [[0, -100], [-50, -60], [-90 + 10 * Math.sin(stepT(t) * 4), -30]] } }; }
  const wv = Math.floor(stepT(t) * 4) % 2;
  return { ...base, x: 2010, y: P5.nini[1], s: 1, view: t >= 122.0 ? 'q' : 'front', flip: t >= 122.0, pose: 'stand', expr: 'laughing', arms: { L: [[-36, -186], [-60, -230], [-50 - wv * 10, -300]] }, headTilt: t >= 122 ? -.1 : 0 };
}
function balloonState(t) {
  const B = P5.balloon;
  if (t < HIT.freed) { const k = t >= HIT.lift ? 1 : 0; const sway = 6 * Math.sin(stepT(t) * 1.3); PG.balloon(G1.f, G1.l, B[0] + sway, B[1], 46, 830, { on: true, pl: 1, pf: 1 }, { string: [[B[0] + sway, B[1] + 60], [B[0] - 40, B[1] + 110], [B[0] + 20, B[1] + 170], [B[0] - 30, B[1] + 230]] }); return; }
  if (t < 104.8) { const u = ss(pr(t, HIT.freed, 104.8)); const x = lerp(B[0], 2080, u), y = lerp(B[1], 760, u) + 30 * Math.sin(u * Math.PI * 2); PG.balloon(G1.f, G1.l, x, y, 46, 830, { on: true, pl: 1, pf: 1 }, { string: [[x, y + 60], [x - 10 + 10 * u, y + 160], [lerp(x, 2060, u), lerp(y + 260, 1010, u)]] }); return; }
  // in Ni Ni's hand (right hand up): the string to her hand
  const hx = t < 110 ? 2060 : t < 115 ? 1900 : 1960, hy = t < 110 ? 1010 : t < 115 ? 1210 : 950;
  const bx = hx + 40 + 8 * Math.sin(stepT(t) * 1.1), by = hy - 300 - 10 * Math.sin(stepT(t) * .7);
  PG.balloon(G1.f, G1.l, bx, by, 46, 830, { on: true, pl: 1, pf: 1 }, { string: [[bx, by + 60], [lerp(bx, hx, .5) + 10, lerp(by + 60, hy, .5)], [hx, hy]] });
}
function playActors(t) {   // Dou Dou and the purple monster on the playground; from 110 the yellow monster too
  let dx = 1250, dy = P5.floor, dview = 'q', dflip = false, dpose = 'stand', dE = { ...EXPR.shy, pupil: [.3, .3] }, darms = null, dhold = null, dr = 0, dlegs = null, ds = 1, dph = 0;
  let mx = 1060, my = P5.floor, ms = 1.0, mpose = 'stand', mE = MEXPR.happy, mlook = [.6, 0], msq = 1, mst = 1, mr = 0, marms = null, mflip = false;
  const shoulder = () => [dx + 66, dy - 184];   // the outer edge of the near shoulder, beside the head, so the bean stays visible
  if (t >= 86.5 && t < HIT.nudge) { mE = MEXPR.mischief; mlook = [.7, .2]; }
  if (t >= HIT.nudge) { const u = pr(t, HIT.nudge, HIT.nudge + .5); mx = 1060 + 90 * ss(u); mpose = 'nudge'; mE = MEXPR.mischief; mlook = [.7, .1]; mst = 1 + .06 * Math.sin(u * Math.PI); }
  if (t >= HIT.nudge + .3) { const u = pr(t, HIT.nudge + .3, HIT.skid + .4); dx = 1250 + 80 * ss(u); dpose = 'lean'; dE = { ...EXPR.scared, pupil: [.4, .1] }; }
  if (t >= HIT.freeze) { dx = 1330; dpose = 'stand'; dE = { ...EXPR.scared, pupil: [.5, .2], pupilR: .7 }; mx = 1200; mE = MEXPR.scared; mlook = [.5, -.2]; }
  if (t >= HIT.shrink2) { const u = pr(t, HIT.shrink2, HIT.shrink2 + .7); const sh = shoulder(); ms = lerp(1.0, .085, back(u, 1.0)); mx = lerp(1200, sh[0], ss(u)); my = lerp(P5.floor, sh[1], ss(u)) - 60 * Math.sin(u * Math.PI) * (1 - u); mE = MEXPR.scared; mlook = [.4, .2]; }
  if (t >= HIT.lookBean) { dE = { ...EXPR.scared, pupil: [.8, .55], pupilR: .8, browY: .5 }; }
  if (t >= HIT.lookNini) { dE = { ...EXPR.scared, pupil: [.85, -.05], pupilR: .8, browY: .4, lid: .1 }; }
  if (t >= 94.6) { const u = ss(pr(t, 94.6, 95.0)); darms = { R: [[36, -186], [lerp(50, 64, u), lerp(-146, -170, u)], [lerp(56, 40, u), lerp(-112, -200, u)]] }; dhold = 'crayon'; }
  if (t >= HIT.lookCrayon) { dE = { ...EXPR.shy, pupil: [.2, .85], lid: .25, browY: .3, browA: .2 }; }
  if (t >= HIT.breath) { const u = pr(t, HIT.breath, HIT.breath + 1.0); const br = Math.sin(u * Math.PI); ds = 1 + .035 * br; dE = u < .5 ? { ...EXPR.shy, lid: .6, pupil: [.3, .4], mouth: 'o' } : { ...EXPR.brave, pupil: [.6, 0] }; ms = lerp(.085, .14, ss(u)); mE = MEXPR.sad; mlook = [.6, -.2]; }
  if (t >= HIT.step - .1) { const u = pr(t, HIT.step - .1, HIT.step + .5); dx = lerp(1330, 1480, ss(u)); dy = P5.floor - 10 * Math.sin(u * Math.PI); dpose = u < 1 ? 'walk' : 'stand'; dph = u < .5 ? 0 : 1; dE = { ...EXPR.brave, pupil: [.6, 0] }; darms = { R: [[36, -186], [64, -170], [40, -200]] }; }
  if (t >= HIT.crayonOut) { const u = ss(pr(t, HIT.crayonOut, HIT.crayonOut + .5)); dview = 'side'; dpose = 'hold'; darms = { R: [[0, -186], [lerp(30, 40, u), lerp(-180, -168, u)], [lerp(40, 86, u), lerp(-200, -160, u)]] }; dE = { ...EXPR.brave, pupil: [.5, .1], lid: .15 }; mE = MEXPR.surprised; mlook = [.6, 0]; }
  if (t >= HIT.nihao) { dE = { ...EXPR.smile, pupil: [.5, .1] }; ms = .14; mE = MEXPR.delighted; }
  // the grow (100–102): the monster hops off the shoulder and grows at x = 1550
  if (t >= HIT.grow) {
    const u = pr(t, HIT.grow, HIT.grow + 2.0); const sh = shoulder();
    mx = lerp(sh[0], 1500, ss(Math.min(1, u * 3))); my = lerp(sh[1], P5.floor, ss(Math.min(1, u * 3))) - 100 * Math.sin(Math.min(1, u * 3) * Math.PI);
    ms = lerp(.14, 3.4, back(u, 1.3)); mE = MEXPR.delighted; mlook = [.3, -.3]; mpose = 'stand'; msq = 1 + .1 * Math.sin(u * Math.PI * 3) * (1 - u);
    dview = 'q'; dpose = 'stand'; dE = { ...EXPR.surprised, pupil: [-.3, -.7] }; darms = null; dhold = 'crayon'; dx = 1650; dy = P5.floor;
  }
  // the lift (102.4–103.4): the monster's right hand picks him up to the balloon; he reaches and frees it at 103.6
  if (t >= HIT.lift - .3) {
    ms = 3.4; mx = 1500; mpose = 'lift'; mE = MEXPR.proud; mlook = [.5, -.4];
    const u = ss(pr(t, HIT.lift, HIT.lift + 1.0));
    const hand = [lerp(1680, 2230, u), lerp(P5.floor - 20, 560, u)];
    marms = { L: [[-90, -121], [-150, -100], [-170, -40]], R: [[90, -121], [lerp(140, 165, u), lerp(-60, -161, u)], [(hand[0] - mx) / ms, (hand[1] - my) / ms]] };
    dx = hand[0]; dy = hand[1] - 10; dview = 'front'; dpose = t >= HIT.lift + .6 ? 'reach' : 'stand'; dE = t < HIT.freed ? { ...EXPR.determined, pupil: [.3, -.6] } : EXPR.laughing; dhold = null; darms = null;
  }
  // set down (103.8–104.4) and back to child size by 106
  if (t >= HIT.freed + .2) {
    const u = ss(pr(t, HIT.freed + .2, HIT.freed + 1.0)); const hand = [lerp(2230, 1780, u), lerp(560, P5.floor - 20, u)];
    marms = { L: [[-90, -121], [-150, -100], [-170, -40]], R: [[90, -121], [lerp(165, 120, u), lerp(-161, -30, u)], [(hand[0] - mx) / ms, (hand[1] - my) / ms]] };
    dx = hand[0]; dy = hand[1] - 10; dpose = 'stand'; dE = EXPR.laughing;
  }
  if (t >= HIT.freed + 1.0) { const u = pr(t, HIT.freed + 1.0, 106.0); ms = lerp(3.4, 1.0, ss(u)); marms = null; mpose = 'stand'; mE = MEXPR.delighted; mlook = [.6, 0]; dx = 1780; dy = P5.floor; dview = 'q'; dE = EXPR.laughing; }
  if (t >= HIT.burp - .5) { const u = pr(t, HIT.burp - .5, HIT.burp); msq = 1 + .15 * u; mE = { ...MEXPR.pre, lid: .6 }; mx = 1500; }
  if (t >= HIT.burp) { const u = pr(t, HIT.burp, HIT.burp + .5); msq = lerp(1.15, 1, u); mst = 1 + .2 * Math.sin(u * Math.PI); mE = { ...MEXPR.surprised, mouth: 'open' }; mlook = [.6, -.2]; }
  if (t >= HIT.crayonPop + .6) { mE = MEXPR.proud; mlook = [.6, 0]; }
  if (t >= 110.0 && t < 115.0) { mx = 1500; mE = { ...MEXPR.happy, lid: .2 }; mlook = [.7, .3]; dx = 1700; dview = 'q'; dE = { ...EXPR.curious, pupil: [.5, .5] }; dhold = null; }
  // the yellow crayon flying from the monster's mouth to Ni Ni's hands
  if (t >= HIT.crayonPop && t < HIT.crayonPop + .6) { const u = pr(t, HIT.crayonPop, HIT.crayonPop + .6); const x = lerp(1500, 1960, u), y = lerp(1250 - 97, 1100, u) - 220 * Math.sin(u * Math.PI); PG.crayonFlat(FX, FX, x, y, u * 9, .8, K.yellow, 840, { on: true, pl: 1, pf: 1 }); }
  // the play (115–124.4): the chase, the bounce, the ride; the children laughing
  let yellow = null;
  if (t >= 115.0) {
    dx = 1700; dview = t >= 122 ? 'q' : 'front'; dE = EXPR.laughing; dpose = 'stand'; darms = { R: [[36, -186], [70, -200], [84 - 10 * (Math.floor(stepT(t) * 4) % 2), -250]] }; dhold = null; dr = t >= 122 ? .08 : 0;
    const ph = Math.floor(stepT(t) * 5) % 2;
    if (t < HIT.bounce) { const u = (t - 115.0) / 2.5; const v = u < .5 ? u * 2 : 2 - u * 2; mx = lerp(1450, 900, ss(v)); mflip = u >= .5; mpose = 'walk'; mE = MEXPR.delighted; mlook = mflip ? [.6, 0] : [-.6, 0]; my = P5.floor - 10 * bob(t, 5); yellow = { x: mx + (mflip ? -220 : 220), y: P5.floor - 12 * bob(t + .1, 5), s: .7, pose: 'walk', ph, flip: mflip, expr: 'delighted', look: mflip ? [.6, 0] : [-.6, 0] }; }
    else if (t < HIT.ride) { const u = (t - HIT.bounce) / 1.0; const j = Math.abs(Math.sin(u * Math.PI * 2)); mx = 1100; my = P5.floor - 140 * j; mst = 1 + .2 * j; msq = 1 - .1 * j + .25 * Math.max(0, 1 - Math.abs(Math.sin(u * Math.PI * 2)) * 6) * (j < .05 ? 1 : 0); mE = MEXPR.delighted; mlook = [.3, -.4]; yellow = { x: 1340, y: P5.floor - 160 * Math.abs(Math.sin(u * Math.PI * 2 + 1.2)), s: .7, expr: 'delighted', look: [-.4, -.4], stretch: 1 + .2 * Math.abs(Math.sin(u * Math.PI * 2 + 1.2)) }; }
    else { const u = t - HIT.ride; mx = 1100 + 180 * Math.sin(u * 1.4); mflip = Math.cos(u * 1.4) < 0; mpose = 'walk'; my = P5.floor - 8 * bob(t, 5); mE = MEXPR.delighted; mlook = [.5, -.6]; yellow = { x: mx, y: my - 224 - 8 * bob(t + .1, 5), s: .65, expr: 'delighted', look: [-.5, .3], arms: { L: [[-72, -82], [-120, -130], [-130, -170]], R: [[72, -82], [120, -130], [130, -170]] } }; }
  }
  // draw: the monster first (behind), then Dou Dou, then the yellow one
  monster(G2, { x: mx, y: my, s: ms, seed: 600, expr: mE, pose: mpose, look: mlook, squash: msq, stretch: mst, r: mr, arms: marms, flip: mflip, cheeks: 0 });
  if (!(t >= 110.0 && t < 115.0 && false)) kid(G3, { ...DD, x: dx, y: dy, s: ds, view: dview, flip: dflip, pose: dpose, ph: dph, expr: dE, arms: darms, hold: dhold, r: dr, legs: dlegs, seed: 3500 });
  if (yellow) monster(G3, { seed: 650, mini: true, col: K.yellow, ...yellow });
  // s31: the yellow monster drawn on the ground (110–114.4), then alive
  if (t >= HIT.draw2 && t < 115.0) {
    const lineDraw = pr(t, HIT.draw2, HIT.draw2 + 2.4), fillDraw = pr(t, HIT.draw2 + 2.0, HIT.draw2 + 3.2), wax = pr(t, 112.2, 112.8), pupils = pr(t, HIT.eyes2, HIT.eyes2 + .4);
    const alive = t >= HIT.shake;
    let yx = 1800, yy = P5.floor - 10, ys = .7, yr = 0, ysq = 1, yst = 1, E = MEXPR.happy;
    if (t >= HIT.shake && t < HIT.hop) yr = .12 * Math.sin(stepT(t) * 40);
    if (t >= HIT.hop) { const u = pr(t, HIT.hop, HIT.hop + .6); yy = P5.floor - 10 - 90 * Math.sin(u * Math.PI); yst = 1 + .25 * Math.sin(u * Math.PI); ysq = u >= 1 ? 1 : 1; E = MEXPR.delighted; }
    if (!alive) { DRAW.l = lineDraw; DRAW.f = fillDraw; monster(G3, { x: yx, y: yy, s: ys, seed: 650, mini: true, col: K.yellow, wax: Math.max(wax, .001), pupils, look: [-.3, 0] }); DRAW.l = 1; DRAW.f = 1; }
    else monster(G3, { x: yx, y: yy, s: ys, seed: 650, mini: true, col: K.yellow, expr: E, look: [-.5, -.1], r: yr, squash: ysq, stretch: yst });
    // Ni Ni's hand with the yellow crayon tracing the figure
    if (t < HIT.eyes2 + .4) { const u = stepT(t) * 1.1; const a = u * 1.9; const r = 70 + 30 * Math.sin(u * 2.1); crayonStick(G4, p => p, yx + 40 + Math.cos(a) * r * 1.2, yy - 100 + Math.sin(a) * r, -.9, .9, 845, K.yellow); }
  }
}

// ---------------- page 7: the last page ----------------
function actorsPage7(t) {
  const t0 = HIT.lastDraw0, y = 1180;
  const figs = [
    [t0, t0 + .8, () => kid(G1, { ...DD, x: 800, y, s: 1.05, view: 'front', expr: 'laughing', seed: 3600, arms: { R: [[36, -186], [70, -200], [60, -250]] } })],
    [t0 + .7, t0 + 1.5, () => kid(G1, { ...NN, x: 1550, y, s: 1.05, view: 'front', expr: 'laughing', seed: 3650, arms: { L: [[-36, -186], [-60, -230], [-50, -300]] } })],
    [t0 + 1.4, t0 + 2.2, () => monster(G1, { x: 1150, y, s: 1.0, seed: 600, expr: MEXPR.delighted, look: [-.3, 0], pose: 'hug', arms: { L: [[-90, -121], [-150, -170], [-250, -170]], R: [[90, -121], [140, -160], [180, -200]] } })],
    [t0 + 2.1, t0 + 2.9, () => monster(G1, { x: 1900, y, s: .8, seed: 650, mini: true, col: K.yellow, expr: MEXPR.delighted, look: [-.5, 0] })],
  ];
  figs.forEach(([a, b, fn]) => { if (t < a) return; DRAW.l = pr(t, a, b); DRAW.f = pr(t, a + .3, b + .5); fn(); });
  DRAW.l = 1; DRAW.f = 1;
  if (t >= t0 + 1.2) { const bx = 1500, by = 760; PG.balloon(G1.f, G1.l, bx, by, 44, 830, el(t, t0 + 1.2, t0 + 1.6, t0 + 1.5, t0 + 2.0), { string: [[bx, by + 58], [bx + 10, by + 150], [bx - 6, by + 232]] }); }
  if (t >= HIT.letters) { PG.letter(TXS, TXM, '我的朋友', 1300, 470, 230, pr(t, HIT.letters, HIT.letters + 1.0), 35, { track: 40 }); TEXTBOX.push({ id: 'friends', text: '我的朋友', box: titleBox(1300, 470, 230, 4, 40) }); }
  // the purple crayon set down at the bottom right (rolls in from the right edge, stops)
  if (t >= HIT.crayonDown - .3) { const u = eo(pr(t, HIT.crayonDown - .3, HIT.crayonDown + .1)); PG.crayonFlat(FX, FX, lerp(2700, 2200, u), 1340, (1 - u) * 4 + .1, 1.3, K.purple, 850, { on: true, pl: 1, pf: 1 }); }
}

// ---------------- rendering ----------------
function renderPage(comp, pi, t, { subs = true, vig = .28 } = {}) {
  allClear(); TEXTBOX = [];
  [CAM.x, CAM.y, CAM.s] = camera(t);
  BOIL.amp = (t >= HIT.freeze && t < HIT.breath) ? .5 : (t >= HIT.crayonDown ? lerp(1, .35, pr(t, HIT.crayonDown, HIT.crayonDown + 1.5)) : 1);
  const night = pi === 2 || pi === 5;
  const go = { goff: [hash(BOIL.step) * 300, hash(BOIL.step + 7) * 300], paper: night ? PAL.paperNight : PAL.paper };
  if (pi === 0) { PG.page1(BG, t); actorsPage1(t); }
  else if (pi === 1) { PG.page2(BG, t); actorsPage2(t); }
  else if (pi === 2) { PG.page3(BG, t, 26.0); actorsPage3(t); }
  else if (pi === 3) { PG.page4(BG, t); actorsPage4(t); }
  else if (pi === 4) { PG.page5(BG, t); actorsPage5(t); }
  else if (pi === 5) { PG.page3(BG, t, 26.0, true); roomActorsPage6(t); }
  else { PG.page7(BG, t); actorsPage7(t); }
  // wash (night pages)
  let washed = false;
  if (pi === 2 && t >= HIT.wash0) { roomWash(t, HIT.wash0, pr(t, HIT.lamp, HIT.lamp + .5), pr(t, HIT.washPage, HIT.washPage + 1.2)); washed = true; }
  if (pi === 5) { roomWash(t, HIT.wash0 - 100, 1 - pr(t, HIT.bookCloses, HIT.bookCloses + .4), 1); washed = true; }
  if (subs) subTo(t);
  if (POSTER) posterText();
  // composite: paper → page lines and colour → the actor groups (the night pages: the wash goes before the characters so their faces stay readable, except the drawn monster on the page, which is under the wash)
  comp.paperCam(CAM.x * .6, CAM.y * .6, CAM.s / .6);
  comp.begin(night ? PAL.paperNight : PAL.paper);
  comp.crayon(BG.f.c); comp.crayon(BG.l.c);
  if (night) { comp.group(G1, go); comp.group(G2, go); comp.group(G3, go); if (washed) comp.wash(WASH.c, { color: PAL.wash, resist: .93 }); comp.crayon(BG2.f.c); comp.crayon(BG2.l.c); comp.group(G4, go); }
  else { comp.group(G0, go); comp.group(G1, go); comp.group(G2, go); comp.crayon(BG2.f.c); comp.crayon(BG2.l.c); comp.group(G3, go); comp.group(G4, go); }
  comp.crayon(FX.c, go);
  comp.crayon(TXS.c); comp.crayon(TXM.c);
  comp.knock(SUBK.c, night ? PAL.paperNight : PAL.paper); comp.crayon(SUBT.c);
  const lamp = (pi === 2 && t >= HIT.lamp) || pi === 5 ? [clamp((sx(LAMP[0]) / W)), clamp(1 - sy(LAMP[1]) / H), .9, .35 * (pi === 5 ? 1 - pr(t, HIT.bookCloses, HIT.bookCloses + .4) : pr(t, HIT.lamp, HIT.lamp + .5))] : [.5, .5, 1, 0];
  comp.finish({ vig: night ? vig + .1 : vig, lamp });
}
const glc = () => document.getElementById('gl');
export function frame(comp, t) {
  const turn = TURNS.find(([a, b]) => t >= a && t < b);
  if (!turn) { renderPage(comp, TL.pageAt(t), t); return; }
  const i = TURNS.indexOf(turn), u = pr(t, turn[0], turn[1]);
  renderPage(comp, i, Math.min(t, turn[0]), { subs: false }); snap(SNAP_A, glc());
  renderPage(comp, i + 1, t, { subs: false }); snap(SNAP_B, glc());
  drawTurn(TURN.g, u, SNAP_A, SNAP_B);
  comp.paperCam(0, 0, 1); comp.begin(PAL.paper); comp.image(TURN.c); comp.finish({ vig: 0, emb: 0 });
}
// subtitles: the book's printed words on a ragged patch of bare paper, written left to right in 0.35 s
function subTo(t) {
  const S = SUBS.find(s => t >= s.t0 && t < s.t1 && !s.kind); if (!S) return;
  const rv = pr(t, S.t0, S.t0 + .35);
  const g = SUBK.g; g.save(); g.font = '400 54px "ZCOOL KuaiLe"'; const tw = g.measureText(S.text).width + 4 * (S.text.length - 1); g.restore();
  const cx = 960, cy = 1002, hw = tw / 2 + 46, hh = 46;
  g.save(); g.fillStyle = '#000'; g.beginPath();
  for (let i = 0; i <= 60; i++) { const a = i / 60 * Math.PI * 2; const px = Math.cos(a), py = Math.sin(a); const sq = Math.pow(Math.abs(px), .3) * Math.sign(px); const n = 1 + .06 * Math.sin(a * 7 + 1.3) + .03 * Math.sin(a * 17); const X = cx + sq * hw * n, Y = cy + py * hh * n; i ? g.lineTo(X, Y) : g.moveTo(X, Y); }
  g.closePath(); g.fill(); g.restore();
  text(SUBT, S.text, cx, cy + 18, { size: 54, font: 'ZCOOL KuaiLe', col: K.ink, reveal: rv, seed: 11 + S.t0 * 3, p: 1, stroke: 1.2, track: 4 });
}
function posterText() {
  text(FX, '我的怪兽朋友', 960, 200, { size: 150, font: 'ZCOOL KuaiLe', col: K.purple, p: 1, stroke: 3, seed: 5, track: 20 });
  text(FX, '蜡笔儿童绘本', 960, 290, { size: 54, font: 'ZCOOL KuaiLe', col: K.ink, p: .9, seed: 6, track: 10 });
}
// on-screen lettering for readcheck (the subtitle bar is not reported: its hold is the .srt's)
export function texts(t) { return TEXTBOX.map(b => ({ id: b.id, text: b.text, ...b.box })); }
