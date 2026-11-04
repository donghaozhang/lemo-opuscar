// Shot by shot: cameras, blocking and acting, from the timeline. Returns compositor options per frame and the sound events.
import { SHOT, HIT, SUBS, DUR, SILENCE, shotAt, beatT, WRITE } from './timeline.js';
import { mk, draw, mass, blot, TONE } from './ink.js';
import { dragon, dragonCU, eyeOf, EXPR, mixExpr, splatter } from './dragon.js';
import { cloud, CEXPR, mixC } from './cloud.js';
import * as ST from './studio.js';
import * as WD from './world.js';
import { ripple } from './land.js';
import { inscription } from './subs.js';
import { writeChar, charStrokes, tipAt, inkText } from './glyph.js';
import { seal } from './seal.js';
import { camXf, paperOf, blit, toScreen, lerp, clamp, vnoise, keys, pulse, twos, VERM, W, H } from './util.js';
import { ss, eio, eo, ei, spring, back, mulberry } from '/core/lib.js';

let TMP, TMP2;
export async function init(t1, t2) { TMP = t1; TMP2 = t2; WD.init(); charStrokes('墨', [0, 0, 100]); charStrokes('龙', [0, 0, 100]); charStrokes('借', [0, 0, 100]); charStrokes('雨', [0, 0, 100]); }

const PAINTER = [1010, 182];
const DS = .95;                               // the dragon's scale on the desk (body length 62 desk units)
const CLOUD = { x: 560, y: 300, r: 220 };     // the cloud on the summit (painting units)
const sg = (t, a, b) => clamp((t - a) / (b - a));
const F = 1 / 24;

// ---- helpers ----
// painting → screen transform through a desk camera (the sheet lies at ST.SHEET, scale ST.PSCALE)
function paintXf(cam) { const { s, tx, ty } = camXf(cam); return { s: s * ST.PSCALE, tx: tx + ST.SHEET.x * s, ty: ty + ST.SHEET.y * s }; }
function setXf(A, x) { A.xf(x.s, x.tx, x.ty); A.cc.setTransform(x.s, 0, 0, x.s, x.tx, x.ty); }
function paintingLayers(A, cam, o = {}) {
  const px = paintXf(cam), pc = { x: (W / 2 - px.tx) / px.s, y: (H / 2 - px.ty) / px.s, z: px.s };   // the same transform expressed as a painting camera
  for (const k of ['far', 'mid', 'cliff', 'bank']) blit(A, WD.layers()[k], pc, 1);
  if ((o.cracks ?? 1) > 0) blit(A, WD.layers().cracks, pc, o.cracks ?? 1);
  return pc;
}
// the painting's live parts (in painting space; the caller has set the transform): boat, tree, child, villagers, the cloud
function paintingLife(A, t, o = {}) {
  const L = A.ink;
  WD.boat(L, WD.BOAT[0], WD.BOAT[1], 1, .22, o.float ?? 0);
  WD.deadTree(L, WD.TREE[0], WD.TREE[1], 1, o.leaf ?? 0);
  const bowl = o.bowl ?? 0, drink = o.drink ?? 0;
  WD.figure(L, WD.CHILD[0], WD.CHILD[1], 1, { armL: lerp(-1.25, -.2, drink), armR: lerp(-1.25, -.2, drink), bowlHand: 1, bowl, lean: 0 }, 700);
  // villagers: two by the houses, more come out for the dance
  const dance = o.dance ?? 0, tt = twos(t);
  WD.figure(L, 2200, 1470, .95, dance > 0 ? { armL: 2.8 + Math.sin(tt * 9) * .5, armR: -.6, legs: .4, jump: Math.max(0, Math.sin(tt * 9)) * dance } : { armL: 2.2, armR: 1.2 }, 720);
  WD.figure(L, 2440, 1495, .9, dance > 0 ? { armL: -.8, armR: 2.9 + Math.cos(tt * 9) * .5, legs: .4, jump: Math.max(0, Math.cos(tt * 9)) * dance } : { armL: 1.9, armR: 1.4 }, 740);
  if (dance > 0) { WD.figure(L, 2330, 1545, .9, { armL: 3 - .6 * Math.sin(tt * 9 + 1), armR: 3 - .6 * Math.cos(tt * 9 + 1), legs: .45, jump: Math.max(0, Math.sin(tt * 9 + 1)) * dance }, 760, dance); WD.figure(L, 2560, 1520, .85, { armL: -.5, armR: 2.6, legs: .3, jump: Math.max(0, Math.cos(tt * 9 + 2)) * dance }, 780, dance); }
  if (o.cloud) cloud(A, { ...CLOUD, ...o.cloud }, { t });
}
// the colophon on the painting (painting space): 家山久旱 盼雨 in a vertical column; run = ink that has run
function colophon(A, am = 1, run = 0) { return inkText(A, '家山久旱盼雨', WD.COLOPHON.x, WD.COLOPHON.y, 62, { am, vertical: true, run, tone: .82, wetK: .3 }); }
// the title column 墨龙借雨 (painting space) written by progress 0..1 (one character per quarter); xf = painting→screen DOMMatrix
function titleColumn(A, p, xf, am = 1) {
  const cell = 170; let tip = null;
  const chars = ['墨', '龙', '借', '雨'];
  chars.forEach((ch, i) => { const pp = clamp(p * 4 - i); if (pp <= 0) return; const box = [WD.TITLE.x - cell / 2, WD.TITLE.y + i * cell * 1.02, cell]; const S = writeChar(A, TMP2, ch, box, pp, xf, { am, seed: 71 + i, dry: .22, wet: .4 }); if (pp < 1) tip = tipAt(S, pp, box); });
  return tip;
}
// night: a 清 wash over the whole frame, lifted in a pool of light around the lamp (screen position [x, y, radius]); dawn lifts the wash
const nightWash = (A, k, lampAt) => {
  if (k <= 0) return; const c = A.cw; c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = `rgba(0,0,0,${.15 * k})`; c.fillRect(0, 0, W, H);
  if (lampAt) { c.globalCompositeOperation = 'destination-out'; const g = c.createRadialGradient(lampAt[0], lampAt[1], 0, lampAt[0], lampAt[1], lampAt[2]); g.addColorStop(0, `rgba(0,0,0,${.9 * k})`); g.addColorStop(.5, `rgba(0,0,0,${.5 * k})`); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H); }
  c.restore();
};
const LAMP = [1720, 650];
const NIGHT = { paperCol: [.905, .875, .81], warm: .75, vig: .5 }, DAWN = { paperCol: [.97, .955, .905], warm: .25, vig: .12 };
const lampScreen = (cam, r = 900) => { const p = toScreen(cam, LAMP[0] + 18, LAMP[1] - 8); return [p[0], p[1], r * cam.z]; };
const studioStatic = (A, t, o = {}) => {
  const L = A.ink;
  ST.desk(L);
  ST.inkstone(L, ST.INKSTONE.x, ST.INKSTONE.y, 1, { shine: o.shine ?? 1 });
  ST.brushRest(L, 230, 500, 1);
  ST.sealBox(L, A.cc, ST.SEALBOX.x, ST.SEALBOX.y, 1);
  if (!o.noBrush) ST.brush(L, 300, 790, -.35, 1);
  if (o.lamp !== false) ST.lamp(L, LAMP[0], LAMP[1], 1, { flicker: Math.sin(t * 13) * .5 + .5, am: o.lampAm ?? 1 });
};
const snorePhase = t => t / 4.2;   // one slow snore every 4.2 s
const breathOf = t => Math.sin(snorePhase(t) * Math.PI * 2);

// ---- S01 ECU: the drop on the lip of the inkstone (a side view: the rim across the upper third, the drop hanging below it) ----
function s01(A, t) {
  const L = A.ink, u = t - SHOT.s01;
  const cam = { x: 960 + Math.sin(u * .7) * 4, y: 540 + breathOf(t) * 3, z: 1 };
  A.xf(1, 0, 0); A.cc.setTransform(1, 0, 0, 1, 0, 0);
  // the stone's rim: a dark mass from the top, its lower edge a heavy loaded stroke; the pool beyond is darkness
  mass(L.wet, [[-50, -50], [2000, -50], [2000, 150], [1400, 190], [1000, 230], [700, 215], [300, 190], [-50, 170]], .62, 6, 11, [0, 0, 0, 230, .7, 1.3]);
  draw(L, mk([[-50, 178], [300, 194], [700, 220], [1000, 236], [1400, 195], [2000, 156]], { w: 30, tone: .9, darkDir: [0, 1], side: .85, brWet: true, body: .35, dry: .35, wet: .9, prof: 'even', seed: 21, gapLen: 600 }));
  // the lip: a small notch where the drop hangs
  draw(L, mk([[880, 218], [960, 246], [1050, 222]], { w: 20, tone: .92, dry: .3, wet: .5, prof: 'lens', seed: 22 }));
  // a shadow of the stone on the desk below (pale), so the drop hangs over something
  mass(L.wet, [[-50, 1080], [2000, 1080], [2000, 980], [1200, 960], [600, 975], [-50, 990]], .08, 4, 12);
  // the drop: swells with each snore, trembles, detaches at 3.0 and falls (a thread, then gone)
  const grow = clamp(u / 2.9), fall = sg(t, HIT.dropFall, HIT.dropFall + .3);
  const r = 34 + 72 * eo(grow) + 4 * Math.max(0, breathOf(t)) * grow;
  const trem = Math.sin(t * 31) * 1.5 * (1 - fall) * grow;
  const yD = 246 + r * .9 + fall * fall * 1100, stretch = 1 + .35 * clamp(fall * 3) * (1 - fall);
  const poly = []; for (let i = 0; i < 30; i++) { const a = i / 30 * Math.PI * 2, rr = r * (1 + .03 * Math.sin(a * 3 + t * 9) * (1 - fall)); const yy = Math.sin(a) < 0 ? Math.sin(a) * rr * (.55 + .45 * (1 - grow) + fall * .5) : Math.sin(a) * rr * stretch; poly.push([960 + trem + Math.cos(a) * rr * .92, yD + yy]); }
  mass(L.wet, poly, .9, 2, 23); mass(L.dry, poly, .6, 1.5, 24);
  if (fall < 1) draw(L, mk([[960 + trem, 246], [960 + trem * .5, yD - r * .4]], { w: 12 * (1 - fall) + 2, tone: .9, dry: .2, wet: .6, prof: 'rise', seed: 25 }), 1, 1 - fall * .5);
  // the shine: paper left in the drop
  for (const c of [L.wet, L.dry]) { c.save(); c.globalCompositeOperation = 'destination-out'; c.globalAlpha = .85; c.beginPath(); c.ellipse(960 + trem - r * .3, yD - r * .25, r * .22, r * .14, -.5, 0, 7); c.fill(); c.restore(); }
  return { paper: paperOf(cam), bleed: 7, rim: 1.1, ...NIGHT, night: 1 };
}

// ---- S02 top-down: the drop lands, blooms, becomes the dragon; the eye opens ----
function dragonBirthState(t) {
  const blotR = 1 - sg(t, HIT.tailCurl, HIT.headLift + .9), p = sg(t, HIT.headLift, HIT.eyeOpen - .05), eye = eo(sg(t, HIT.eyeOpen, HIT.eyeOpen + .25));
  return { S: { a: -.15, amp: 5 * (1 - blotR), k: 1, ph: .4, legs: lerp(0, 1, sg(t, HIT.headLift, HIT.eyeOpen)), ground: 13, blotR, expr: EXPR.neutral, headTilt: -.25 * (1 - blotR) }, p: Math.max(.02, p), eye };
}
function s02(A, t) {
  const L = A.ink, cam = { x: ST.DROP_AT[0] + 30, y: ST.DROP_AT[1] - 6, z: 3.4 };
  const X = camXf(cam); A.xf(X.s, X.tx, X.ty); A.cc.setTransform(X.s, 0, 0, X.s, X.tx, X.ty);
  // the desk around: the inkstone's edge at the left, the sheet's edge at the right
  ST.inkstone(L, ST.INKSTONE.x, ST.INKSTONE.y, 1);
  draw(L, mk([[ST.SHEET.x - 2, ST.SHEET.y + 8], [ST.SHEET.x - 2, ST.SHEET.y + ST.SHEET.h + 3]], { w: 5, tone: .35, dry: .5, wet: .6, prof: 'even', seed: 904 }));
  const [dx, dy] = ST.DROP_AT;
  if (t < HIT.dropLand) {   // the falling drop seen from above: a dot shrinking as it goes down to the desk
    const u = sg(t, SHOT.s02, HIT.dropLand); blot(L.wet, dx, dy, 14 - 5 * u, .9, 0, 1, 3);
    return { paper: paperOf(cam), bleed: 5 * 3.4, rim: 1.1, ...NIGHT, night: 1 };
  }
  // landing: a splash of splatter and the blot spreading with a tide-line (ink pooling at its edge comes from the compositor)
  const ul = sg(t, HIT.dropLand, HIT.dropLand + .5);
  splatter(A, dx + 22, dy + 2, 70, sg(t, HIT.dropLand, HIT.dropLand + .7), 5, 16, 1 - .5 * sg(t, 5, 8));
  const st = dragonBirthState(t);
  const scale = DS * (.35 + .65 * eo(ul));
  dragon(A, TMP, st.S, { x: dx + 22 * (1 - st.S.blotR) - 10, y: dy, s: scale, dir: 1, t, p: 1, eye: st.eye, seed: 3, boil: t * 12 });
  // a few rings of thin wet ink around the blot as it spreads
  if (ul < 1) { const c = L.wet; c.save(); c.globalAlpha = .25 * (1 - ul); c.strokeStyle = '#000'; c.lineWidth = 2; c.beginPath(); c.ellipse(dx + 12, dy, 40 + 50 * ul, 30 + 36 * ul, 0, 0, 7); c.stroke(); c.restore(); }
  return { paper: paperOf(cam), bleed: 5 * 3.4 * (1 + .6 * (1 - sg(t, HIT.dropLand, HIT.eyeOpen))), rim: 1.3, ...NIGHT, night: 1, flash: HIT.eyeOpen <= t && t < HIT.eyeOpen + .08 ? .25 : 0 };
}

// ---- S03 desk-level low angle: shake, stretch, sneeze, look around ----
function s03(A, t) {
  const L = A.ink, cam = { x: 960, y: 560, z: 1 };
  A.xf(1, 0, 0); A.cc.setTransform(1, 0, 0, 1, 0, 0);
  // the desk surface as the horizon, the sheet's edge, the inkstone's silhouette at the left (side view)
  draw(L, mk([[-50, 742], [600, 738], [1300, 741], [1970, 736]], { w: 8, tone: .62, dry: .6, wet: .2, prof: 'even', seed: 31, gapLen: 800 }));
  draw(L, mk([[700, 731], [1970, 729]], { w: 3, tone: .4, dry: .55, prof: 'even', seed: 32 }));   // the sheet's near edge
  mass(L.wet, [[-50, 740], [-50, 560], [60, 520], [280, 505], [470, 530], [520, 600], [500, 740]], .72, 4, 33, [0, 500, 0, 740, .8, 1.3]);
  draw(L, mk([[40, 528], [280, 505], [500, 540]], { w: 14, tone: .9, darkDir: [0, -1], side: .85, brWet: true, body: .3, dry: .4, wet: .9, prof: 'even', seed: 34 }));
  mass(L.wet, [[-50, 1080], [1970, 1080], [1970, 745], [-50, 745]], .06, 0, 35);    // the desk top is a shade darker than the sky of paper
  // the dragon in profile, standing on the desk
  const sc = 4.4, x = 1000, y = 720 - 13 * sc;
  let S = { a: 0, amp: 4, k: 1, ph: 1, legs: 1, ground: 13, expr: EXPR.neutral, headTilt: -.1 };
  let X = { x, y, s: sc, dir: -1, t, seed: 3, boil: t * 12 };
  const stand = sg(t, 8.0, 8.5);
  S.legs = stand; S.a = -.1 * (1 - stand);
  // 8.5–9.5 the wet-puppy shake: fast lateral wiggle of the whole body on twos, splatter flying
  const shake = t >= HIT.shake && t < HIT.shake + 1.0 ? 1 - sg(t, HIT.shake + .7, HIT.shake + 1.0) : 0;
  if (shake > 0) { const tt = twos(t); S.amp = 14 * shake; S.k = 1.6; S.ph = tt * 42; S.headTilt = Math.sin(tt * 42) * .35 * shake; S.expr = EXPR.closed; splatter(A, x - 60 * sc * .3, y - 10, 320, sg(t, HIT.shake + .1, HIT.shake + .9), 9, 22, shake); }
  // 10.5–11.3 stretch: a long cat stretch (back arched up, head low and forward, mouth in a yawn)
  const st = pulse(t, HIT.stretch, HIT.sneeze, .6);
  if (st > 0) { S.amp = -16 * st; S.k = .5; S.ph = Math.PI / 2; S.headTilt = .35 * st; S.expr = mixExpr(EXPR.neutral, EXPR.yawn, st); S.legs = 1; S.stride = 10; S.stretch = 1 + .1 * st; }
  // sneeze: head back (anticipation), then a snap forward with a puff of ink, squash
  const an = pulse(t, HIT.sneeze - .45, HIT.sneeze, .8), sn = t >= HIT.sneeze ? Math.exp(-(t - HIT.sneeze) * 6) : 0;
  if (an > 0) { S.headTilt = -.55 * an; S.expr = mixExpr(EXPR.neutral, EXPR.gasp, an); S.a = -.1 * an; S.stretch = 1 - .12 * an; S.curl = .1 * an; }
  if (sn > 0) { S.headTilt = .5 * sn; S.expr = mixExpr(EXPR.neutral, { ...EXPR.closed, mouth: .4 }, sn); S.squash = 1 - .12 * sn; S.a = .08 * sn; S.stretch = 1 + .18 * sn; S.curl = -.08 * sn; }
  // 12–13 looks around: curious, head turns up and down, the pupil wanders
  if (t >= HIT.lookAround) { const u = t - HIT.lookAround; S.expr = { ...EXPR.curious, pupil: [Math.sin(u * 2.5), -.4 + Math.cos(u * 1.7) * .5] }; S.headTilt = -.2 + Math.sin(u * 2.2) * .25; }
  const d = dragon(A, TMP, S, X);
  if (sn > 0) { const R = mulberry(41); for (let i = 0; i < 9; i++) { const a = Math.PI + (R() - .5) * 1.2, dd = (30 + R() * 120) * (1 - sn) * 2 + 20; blot(L.wet, d.snout[0] + Math.cos(a) * dd, d.snout[1] + Math.sin(a) * dd * .6, (4 + R() * 9) * (.4 + sn), .5 * sn, R() * 3, .7, 50 + i); } }
  return { paper: paperOf(cam), bleed: 5, rim: 1, ...NIGHT, night: 1 };
}

// ---- S04 studio wide: pull-back; tiptoe past the painter; the snort ----
// the dragon's walk on the desk: a path from the landing spot up the left margin and along the top of the sheet, over the painter's fingers
const PATH4 = [[478, 712], [515, 600], [545, 420], [585, 300], [650, 258], [780, 256], [900, 257], [1000, 262], [1060, 292]];
function pathAt(P, u) { const n = P.length - 1, i = Math.min(n - 1, Math.floor(u * n)), f = u * n - i; const a = P[i], b = P[i + 1]; return [lerp(a[0], b[0], f), lerp(a[1], b[1], f), Math.atan2(b[1] - a[1], b[0] - a[0])]; }
function walkU(t) {   // progress along the path: starts at 13.6, freezes at the snort (16.5–17.5), arrives at 19.0
  if (t < 13.4) return 0; if (t < SHOT.s04b) return lerp(0, .5, (t - 13.4) / (SHOT.s04b - 13.4)); if (t < SHOT.s04c) return .8; return lerp(.8, 1, sg(t, SHOT.s04c, 19.0));
}
function studioNight(A, t, cam, o = {}) {   // the top-down studio at night with everything in it
  const L = A.ink, X = camXf(cam); A.xf(X.s, X.tx, X.ty); A.cc.setTransform(X.s, 0, 0, X.s, X.tx, X.ty);
  studioStatic(A, t);
  paintingLayers(A, cam); setXf(A, paintXf(cam));
  paintingLife(A, t, { cloud: { breath: breathOf(t + 2), bubble: .5 + .5 * breathOf(t + 2), expr: CEXPR.asleep } });
  colophon(A, 1, 0);
  A.xf(X.s, X.tx, X.ty); A.cc.setTransform(X.s, 0, 0, X.s, X.tx, X.ty);
  ST.incense(L, A.cc, ST.INCENSE.x, ST.INCENSE.y, 1, { burn: .12 + .006 * (t - 13), t });
  ST.painter(L, PAINTER[0], PAINTER[1], 1, { breath: breathOf(t) + (o.snort || 0) * 1.5 });
  return X;
}
function s04(A, t) {   // wide at night: the dragon sets off up the left margin of the sheet
  const u = eio(sg(t, SHOT.s04, SHOT.s04b)), cam = { x: lerp(640, 760, u), y: lerp(600, 470, u), z: lerp(1.55, 1.3, u) };
  studioNight(A, t, cam);
  const wu = walkU(twos(t)), [px, py, ang] = pathAt(PATH4, wu), moving = (walkU(twos(t) + 1 / 12) - wu) > 0, dir = Math.cos(ang) >= 0 ? 1 : -1;
  const S = { a: dir > 0 ? ang : ang - Math.PI, amp: 4, k: 1, ph: twos(t) * 4, legs: 1, ground: 13, gait: moving ? twos(t) * 22 : 0, stride: 6, expr: EXPR.curious, headTilt: -.15 + .1 * Math.sin(t * 3), vel: moving ? [12, 0] : [0, 0], curl: -.04 };
  dragon(A, TMP, S, { x: px, y: py, s: DS, dir, t, seed: 3, boil: t * 12 });
  return { paper: paperOf(cam), bleed: 5 * cam.z, rim: 1, ...NIGHT, night: 1, lampAt: lampScreen(cam) };
}
function s04b(A, t) {   // side view two-shot: the sleeping face at the right, the dragon tiptoes along the desk toward it, steps on the fingers, the snort
  const L = A.ink, cam = { x: 960, y: 560, z: 1 };
  A.xf(1, 0, 0); A.cc.setTransform(1, 0, 0, 1, 0, 0);
  // the desk edge as the horizon, the far edge behind; the sheet lying on the desk as a thin line
  draw(L, mk([[-50, 742], [600, 738], [1300, 741], [1970, 736]], { w: 8, tone: .62, dry: .6, wet: .2, prof: 'even', seed: 31, gapLen: 800 }));
  mass(L.wet, [[-50, 1080], [1970, 1080], [1970, 745], [-50, 745]], .06, 0, 35);
  draw(L, mk([[-50, 727], [900, 725]], { w: 3, tone: .35, dry: .55, prof: 'even', seed: 36 }));
  // the painter, mirrored to face left-of-frame... drawn facing the dragon (to the left), seated at the right
  const snort = pulse(t, HIT.snort - .1, HIT.snort + .5, .4);
  for (const c of [L.wet, L.dry]) { c.save(); c.translate(1300, 0); c.scale(-1, 1); c.translate(-1300, 0); }
  const pf = ST.painterSide(L, 1340, 700, 2.3, { breath: breathOf(t) + snort * 2.5 });
  for (const c of [L.wet, L.dry]) c.restore();
  // the snort: a puff from the nose (dry ticks), 16.5
  if (snort > 0) { const R = mulberry(47); for (let i = 0; i < 6; i++) { const dd = 20 + 120 * snort; blot(L.dry, 1300 - (pf.nose[0] - 1300) * -1 - 80 - dd * (R() * .8 + .2), pf.nose[1] - 10 + (R() - .5) * 60, (3 + 5 * R()) * (1 - snort * .5), .4 * (1 - snort), 0, .7, 300 + i); } }
  // the dragon walks left to right toward the face on twos; the fingers lie on the desk in front of the face (x ≈ 1120–1160)
  const tt = twos(t), frozen = t >= HIT.snort && t < HIT.snort + 1.0;
  const wx = keys([[15.0, 150], [HIT.snort - .2, 1080], [HIT.snort, 1090], [HIT.snort + 1.0, 1090], [SHOT.s04c, 1400]], tt);
  const moving = !frozen && t > 15.0 && t < SHOT.s04c;
  const S = { a: 0, amp: 5, k: 1, ph: tt * 4, legs: 1, ground: 13, gait: moving ? tt * 22 : 0, stride: 7, expr: frozen ? EXPR.shocked : { ...EXPR.curious, pupil: [.6, -.4] }, headTilt: frozen ? -.35 : -.15 + .1 * Math.sin(t * 3), vel: moving ? [14, 0] : [0, 0], curl: frozen ? .12 : -.04, stretch: frozen ? .88 : 1, squash: frozen ? 1 - .1 * pulse(t, HIT.snort, HIT.snort + .25) : 1 };
  dragon(A, TMP, S, { x: wx, y: 735 - 13 * 2.4, s: 2.4, dir: 1, t, seed: 3, boil: t * 12 });
  return { paper: paperOf(cam), bleed: 5, rim: 1, ...NIGHT, night: 1, lampAt: [1700, 300, 900] };
}
function s04c(A, t) {   // wide again: it hurries on along the top of the sheet to the village side
  const u = ss(sg(t, SHOT.s04c, 19.0)), cam = { x: lerp(880, 960, u), y: lerp(420, 560, u), z: lerp(1.35, 1.0, u) };
  studioNight(A, t, cam);
  const wu = walkU(twos(t)), [px, py, ang] = pathAt(PATH4, wu), moving = (walkU(twos(t) + 1 / 12) - wu) > 0, dir = Math.cos(ang) >= 0 ? 1 : -1;
  const S = { a: dir > 0 ? ang : ang - Math.PI, amp: 4, k: 1, ph: twos(t) * 4, legs: 1, ground: 13, gait: moving ? twos(t) * 26 : 0, stride: 7, expr: EXPR.determined, headTilt: -.1, vel: moving ? [16, 0] : [0, 0], curl: -.04 };
  dragon(A, TMP, S, { x: px, y: py, s: DS, dir, t, seed: 3, boil: t * 12 });
  return { paper: paperOf(cam), bleed: 5 * cam.z, rim: 1, ...NIGHT, night: 1, lampAt: lampScreen(cam) };
}
// ---- S05a close-up: the dragon looks down at the village ----
function s05a(A, t) {
  const S = { a: .2, amp: 3, k: 1, ph: 0, legs: 1, ground: 13, expr: { ...EXPR.worried, pupil: [.5, .9], lid: .15 }, headTilt: .4 + .1 * Math.sin(t * 1.5) };
  const X0 = { x: 1000, y: 290, s: DS, dir: 1, t, seed: 3, boil: t * 12 }, e = eyeOf(S, X0);
  const cam = { x: e[0] + 30, y: e[1] + 40, z: 2.4 };
  studioNight(A, t, cam);
  dragonCU(A, TMP, S, X0, 4.2);
  return { paper: paperOf(cam), bleed: 5 * 1.6, rim: 1, ...NIGHT, night: 1, lampAt: lampScreen(cam) };
}
// ---- S05 push into the painting: the drought, the colophon ----
function s05(A, t) {
  const L = A.ink, u = eio(sg(t, SHOT.s05, 22.6));
  const cam = { x: lerp(1000, 1265, u), y: lerp(420, 640, u), z: lerp(1.4, 3.8, u) };
  const X = camXf(cam); A.xf(X.s, X.tx, X.ty); A.cc.setTransform(X.s, 0, 0, X.s, X.tx, X.ty);
  ST.desk(L);
  paintingLayers(A, cam); setXf(A, paintXf(cam));
  paintingLife(A, t, { cloud: { breath: breathOf(t + 2), bubble: .5 + .5 * breathOf(t + 2), expr: CEXPR.asleep } });
  colophon(A, 1, 0);
  A.xf(X.s, X.tx, X.ty); A.cc.setTransform(X.s, 0, 0, X.s, X.tx, X.ty);
  ST.painter(L, PAINTER[0], PAINTER[1], 1, { breath: breathOf(t) });
  // the dragon at the sheet's top edge looking down at the village (it leaves the frame as the camera pushes in)
  const S = { a: .25, amp: 3, k: 1, ph: 0, legs: 1, ground: 13, expr: { ...EXPR.worried, pupil: [.4, .8] }, headTilt: .45 };
  dragon(A, TMP, S, { x: 1000, y: 290, s: DS, dir: 1, t, seed: 3, boil: t * 12 });
  return { paper: paperOf(cam), bleed: 5 * cam.z, rim: 1, ...NIGHT, night: 1, lampAt: lampScreen(cam) };
}

// ---- incense insert (ECU, side view): the stick vertical, the ember ring, the ash flake, the smoke ----
function incenseInsert(A, t, burn, flakeT) {
  const L = A.ink, cam = { x: 960, y: 540 + Math.sin(t * .5) * 2, z: 1 };
  A.xf(1, 0, 0); A.cc.setTransform(1, 0, 0, 1, 0, 0);
  // the holder: a small bowl of sand at the bottom of the frame, the stick rising out of it; burn 0..1 shortens the stick from the top
  const x = 1000, yBowl = 980, yTop = 300 + 420 * burn;
  mass(L.wet, [[x - 150, yBowl - 60], [x + 150, yBowl - 60], [x + 120, yBowl + 40], [x - 120, yBowl + 40]], .42, 4, 60, [0, yBowl - 60, 0, yBowl + 40, .8, 1.3]);
  draw(L, mk([[x - 160, yBowl - 62], [x, yBowl - 72], [x + 160, yBowl - 62]], { w: 12, tone: .85, darkDir: [0, -1], side: .85, brWet: true, body: .3, dry: .4, wet: .8, prof: 'even', seed: 611, gapLen: 400 }));
  draw(L, mk([[x - 130, yBowl + 40], [x, yBowl + 52], [x + 130, yBowl + 40]], { w: 7, tone: .7, dry: .5, prof: 'tip', seed: 612 }));
  for (let i = 0; i < 12; i++) blot(L.wet, x - 120 + i * 22 + (vnoise(i * 3.1) - .5) * 14, yBowl - 50 + (vnoise(i * 1.7 + 2) - .5) * 10, 2 + 3 * vnoise(i), .25, 0, .5, 640 + i);   // sand
  // the stick: a dark bamboo-cored stick with a lighter edge
  draw(L, mk([[x, yBowl - 40], [x + 2, (yTop + yBowl) / 2], [x, yTop]], { w: 26, tone: .86, dry: .4, wet: .25, prof: 'even', rough: .04, seed: 61 }));
  draw(L, mk([[x + 11, yBowl - 42], [x + 12, yTop + 10]], { w: 5, tone: .45, dry: .7, prof: 'even', seed: 62 }), 1, .6);
  // the ember: a burnt dark ring with a paper-white glow at its centre; it pulses
  blot(L.dry, x, yTop - 2, 30, .95, 0, .55, 7); blot(L.wet, x, yTop - 4, 44, .6, 0, .6, 8);
  for (const c of [L.wet, L.dry]) { c.save(); c.globalCompositeOperation = 'destination-out'; c.globalAlpha = .98; c.beginPath(); c.ellipse(x, yTop - 6, 15 * (1 + .12 * Math.sin(t * 9)), 8, 0, 0, 7); c.fill(); c.restore(); }
  // the ash above the ember: pale grey, cracked; the flake breaks off at flakeT and tumbles down
  const ashH = 80, fl = flakeT != null ? sg(t, flakeT, flakeT + .9) : 0;
  draw(L, mk([[x, yTop - 8], [x + 3, yTop - ashH * .5], [x - 2, yTop - ashH * (1 - fl * .7)]], { w: 24, tone: .34, dry: .72, wet: .4, prof: 'even', seed: 63 }), 1, 1);
  for (let i = 0; i < 5; i++) draw(L, mk([[x - 11, yTop - 12 - i * 13], [x + 11, yTop - 14 - i * 13]], { w: 2.2, tone: .5, dry: .6, prof: 'tip', seed: 64 + i }), 1, .8 * (1 - fl));
  if (fl > 0 && fl < 1) { const fy = yTop - ashH + fl * fl * 1100, fx = x + 40 * fl + Math.sin(fl * 9) * 16; draw(L, mk([[fx - 10, fy], [fx + 10, fy + 3]], { w: 15, tone: .36, dry: .7, wet: .3, prof: 'lens', seed: 69 }), 1, 1 - fl * .3); }
  // smoke: two thin dry lines wandering up and curling, on ones
  for (const [sd, k] of [[70, 1], [71, .6]]) { const sm = []; for (let i = 0; i <= 28; i++) { const uu = i / 28; sm.push([x + 6 * k + Math.sin(uu * 5.5 - t * 1.1 + sd) * 46 * uu + (vnoise(uu * 4 + t * .3 + sd) - .5) * 120 * uu * uu, yTop - 10 - uu * (yTop + 60), .95 - uu * .85]); } draw(L, mk(sm, { w: 5 * k, tone: .55, dry: .7, wet: .2, prof: 'tip', rough: .25, seed: sd }), 1, .9 * k); }
  return { paper: paperOf(cam), bleed: 6, rim: 1.1, ...NIGHT, night: 1 };
}

// ---- S06: incense insert, then the dragon decides and dives; the paper takes it like water ----
function s06(A, t) {
  if (t < 27.0) return incenseInsert(A, t, .22, HIT.ashFlake1);
  const L = A.ink;
  const look = sg(t, HIT.eyeToVillage, HIT.eyeToVillage + .5), inh = sg(t, HIT.inhale, HIT.dive);
  const dive = t >= HIT.dive ? sg(t, HIT.dive, HIT.dive + .3) : 0;
  const S = { a: lerp(-.35, .4, look) + .5 * ei(dive) * 2, amp: 3 + 6 * inh, k: 1, ph: inh * 3, legs: 1 - clamp(dive * 3), ground: 13, headTilt: lerp(-.35, .4, look) - .4 * ei(inh) + 1.2 * dive, expr: inh < 1 ? mixExpr({ ...EXPR.worried, pupil: [.6, -.6] }, { ...EXPR.determined, pupil: [.5, .6], puff: .8 }, inh) : EXPR.determined, stretch: 1 - .15 * ei(inh) * (1 - dive) + .4 * dive, curl: .12 * inh * (1 - dive) - .1 * dive, vel: [60 * dive, 40 * dive] };
  if (inh > 0 && inh < 1) S.expr.puff = Math.sin(inh * Math.PI * .5) * 1.2;
  const sc = DS * (1 - .85 * ei(dive)), x = 1000 + 40 * dive, y = 300 + 60 * dive;
  const X0 = { x, y, s: sc, dir: 1, t, seed: 3, boil: t * 12, am: 1 - dive * .8 }, e = eyeOf({ ...S, headTilt: 0 }, { ...X0, s: DS });
  const cam = { x: e[0] + 60, y: e[1] + 40, z: lerp(3.2, 2.4, dive) };
  const X = camXf(cam); A.xf(X.s, X.tx, X.ty); A.cc.setTransform(X.s, 0, 0, X.s, X.tx, X.ty);
  paintingLayers(A, cam); setXf(A, paintXf(cam));
  paintingLife(A, t, { cloud: { breath: breathOf(t + 2), bubble: .5 + .5 * breathOf(t + 2), expr: CEXPR.asleep } });
  A.xf(X.s, X.tx, X.ty); A.cc.setTransform(X.s, 0, 0, X.s, X.tx, X.ty);
  ST.painter(L, PAINTER[0], PAINTER[1], 1, { breath: breathOf(t) });
  if (dive < 1) dragonCU(A, TMP, S, X0, lerp(3.2, 1, ei(dive)));
  // ink rings on the sheet from the dive point (the paper is water)
  if (t >= HIT.dive + .1) { for (let i = 0; i < 4; i++) { const age = t - (HIT.dive + .1) - i * .14; if (age < 0) continue; ripple(L, 1040, 350, 10 + age * 160, clamp(1 - age / 1.2) * .9, 80 + i, .45, 2.4 / cam.z); } }
  return { paper: paperOf(cam), bleed: 5 * cam.z, rim: 1, ...NIGHT, night: 1, lampAt: lampScreen(cam) };
}

// ---- inside the painting: camera helpers ----
function paintCam(A, cam, o = {}) {
  for (const k of ['far', 'mid', 'cliff', 'bank']) blit(A, WD.layers()[k], cam, 1);
  if ((o.cracks ?? 1) > 0) blit(A, WD.layers().cracks, cam, o.cracks ?? 1);
  const X = camXf(cam); A.xf(X.s, X.tx, X.ty); A.cc.setTransform(X.s, 0, 0, X.s, X.tx, X.ty);
  return X;
}
// mist bands: ink lifted in horizontal bands (world-anchored), drawn after the layers
function mist(A, cam, bands) {
  const X = camXf(cam);
  for (const [y0, y1, k] of bands) {
    for (const c of [A.cw, A.cd]) { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'destination-out'; const sy0 = y0 * X.s + X.ty, sy1 = y1 * X.s + X.ty; const g = c.createLinearGradient(0, sy0, 0, sy1); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.5, `rgba(0,0,0,${k})`); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, sy0, W, sy1 - sy0); c.restore(); }
  }
}
// flying-white dust/air streaks behind the dragon's belly
function streaks(A, pts, k, seed = 1, w = 3) { if (k <= 0) return; pts.forEach((p, i) => draw(A.ink, mk([[p[0], p[1]], [p[0] + 60 + i * 30, p[1] + 4 + i * 3]], { w, tone: .5 * k, dry: .75, wet: .05, prof: 'tip', nb: 4, seed: seed + i }), 1, k)); }

// ---- S07 handscroll pan over mist; the dragon leads ----
function s07(A, t) {   // travelling along the scroll with foreground pines passing (parallax), the dragon leading
  const u = sg(t, SHOT.s07, SHOT.s07b), cam = { x: lerp(2700, 2050, u), y: 720, z: 1.05 };
  paintCam(A, cam);
  mist(A, cam, [[840, 1060, .85], [1200, 1320, .5]]);
  const dx = lerp(2900, 1950, u) + Math.sin(t * 1.1) * 10, dy = 620 + Math.sin(t * 2.3) * 14;
  const S = { a: -.08 + Math.sin(t * 2.3) * .06, amp: 11, k: 1.1, ph: -t * 7, legs: 0, expr: { ...EXPR.curious, pupil: [-.5, .3] }, headTilt: -.05, wind: [6, 0], vel: [45, 0], curl: -.03, stretch: 1.05 };
  dragon(A, TMP, S, { x: dx, y: dy, s: 3.4, dir: -1, t, seed: 3, boil: t * 12 });
  // foreground: two big pines slide past faster than the world (they are nearer the viewer)
  const X = camXf(cam); A.xf(X.s, X.tx, X.ty);
  const fg = (cam.x - 2300) * .7;
  WD.pineFG(A.ink, 2500 + fg, 1720, 3.2, 21, t, .3, 1); WD.pineFG(A.ink, 3300 + fg, 1760, 2.6, 22, t, .3, -1);
  return { paper: paperOf(cam), bleed: 5 * cam.z, rim: .9, vig: .2, warm: .5, night: 0 };
}
function s07b(A, t) {   // close-up in flight: wind in the whiskers and mane, eyes ahead
  const u = sg(t, SHOT.s07b, SHOT.s07c);
  const S = { a: -.08 + Math.sin(t * 2.3) * .05, amp: 11, k: 1.1, ph: -t * 7, legs: 0, expr: { ...EXPR.determined, pupil: [-.6, .1], lid: .25 }, headTilt: -.05 + .04 * Math.sin(t * 3), wind: [10, 0], vel: [60, 0], curl: -.03, stretch: 1.06 };
  const X0 = { x: lerp(2000, 1800, u), y: 640 + Math.sin(t * 2.3) * 10, s: 3.4, dir: -1, t, seed: 3, boil: t * 12 }, e = eyeOf(S, X0);
  const cam = { x: e[0] - 120, y: e[1] + 30, z: 2.2 };
  paintCam(A, cam); mist(A, cam, [[840, 1060, .85]]);
  dragonCU(A, TMP, S, X0, 2.6);
  return { paper: paperOf(cam), bleed: 5 * cam.z, rim: .9, vig: .2, warm: .5, night: 0 };
}
function s07c(A, t) {   // the handscroll pan, high and wide: a small dragon over the mist, the far ranges passing
  const u = sg(t, SHOT.s07c, SHOT.s08), cam = { x: lerp(2200, 1700, u), y: lerp(640, 700, u), z: .86 };
  const dx = lerp(2350, 1500, u) + Math.sin(t * 1.1) * 10, dy = lerp(560, 640, u) + Math.sin(t * 2.3) * 14;
  paintCam(A, cam);
  mist(A, cam, [[840, 1060, .85], [1200, 1320, .5]]);
  const S = { a: -.08 + Math.sin(t * 2.3) * .06, amp: 11, k: 1.1, ph: -t * 7, legs: 0, expr: { ...EXPR.curious, pupil: [-.5, .3] }, headTilt: -.05, wind: [6, 0], vel: [45, 0], curl: -.03, stretch: 1.05 };
  dragon(A, TMP, S, { x: dx, y: dy, s: 2.8, dir: -1, t, seed: 3, boil: t * 12 });
  return { paper: paperOf(cam), bleed: 5 * cam.z, rim: .9, vig: .2, warm: .5, night: 0 };
}
// ---- S08 the dry river: low tracking, the boat ----
function s08(A, t) {
  const t0 = SHOT.s08, t1 = SHOT.s09;
  // camera: tracks left along the bed, slowing from 42.5 at the boat
  const kx = keys([[t0, 2320], [HIT.boat, 1960], [HIT.slow, 1860], [t1, 1800]], t, ss), cam = { x: kx, y: 1560, z: 1.25 };
  paintCam(A, cam);
  mist(A, cam, [[1150, 1330, .4]]);
  const dxk = keys([[t0, 2560], [HIT.boat, 2100], [HIT.slow, 1980], [t1, 1940]], t, ss), dyk = keys([[t0, 1610], [HIT.boat - .5, 1560], [HIT.slow, 1520], [t1, 1500]], t, ss);
  const slow = sg(t, HIT.slow - .4, HIT.slow + .3);
  const S = { a: lerp(-.05, .3, slow) + Math.sin(t * 2) * .04, amp: lerp(11, 6, slow), k: 1.1, ph: -t * (8 - 5 * slow), legs: 0, expr: { ...EXPR.worried, pupil: [-.3, .9 * slow] }, headTilt: .25 * slow + .1, wind: [lerp(6, 2, slow), 0], vel: [lerp(50, 8, slow), 0], stretch: lerp(1.08, 1, slow), curl: -.05 * (1 - slow) };
  const d = dragon(A, TMP, S, { x: dxk, y: dyk, s: 2.9, dir: -1, t, seed: 3, boil: t * 12 });
  // dust raised by its belly: dry streaks trailing behind and settling
  const pts = d.spine.filter((p, i) => i > 2 && i < 12 && i % 2 === 0).map(p => [p[0] + 20, p[1] + 40 + Math.sin(t * 5 + p[0]) * 4]);
  streaks(A, pts, (1 - slow) * .9, 90, 4);
  return { paper: paperOf(cam), bleed: 5 * cam.z, rim: .9, vig: .22, night: 0 };
}
// ---- S09 the pine cliff: tilt up; the cloud at the summit ----
function s09(A, t) {
  const t0 = SHOT.s09, t1 = SHOT.s10, u = eio(sg(t, t0, t1 - .3));
  const cam = { x: lerp(1000, 820, u), y: lerp(1560, 420, u), z: lerp(.95, .8, u) };
  const sh = pulse(t, HIT.cliffDrum - .1, HIT.cliffDrum + .6, .5) * 7;
  paintCam(A, cam);
  mist(A, cam, [[1150, 1330, .45], [1600, 1850, .7]]);
  // the cloud asleep on the summit (seen from 48.3 as the tilt reaches the top)
  cloud(A, { ...CLOUD, breath: breathOf(t + 2), bubble: .5 + .5 * breathOf(t + 2), expr: CEXPR.asleep }, { t });
  // the dragon spirals up the face
  const uu = sg(t, t0, t1 - .2), dy = lerp(1640, 560, eio(uu)), dx = 1330 + Math.sin(uu * Math.PI * 2.5) * 170 - 280 * uu;
  const dirSign = Math.cos(uu * Math.PI * 2.5) >= 0 ? 1 : -1;
  const S = { a: -.9 + Math.cos(uu * Math.PI * 2.5) * .3, amp: 11, k: 1.1, ph: -t * 8, legs: 0, expr: { ...EXPR.determined, pupil: [0, -.6] }, headTilt: -.2, wind: [0, 6], vel: [40, 0], stretch: 1.06, curl: .06 };
  dragon(A, TMP, S, { x: dx, y: dy, s: 2.6, dir: dirSign, t, seed: 3, boil: t * 12 });
  return { paper: paperOf(cam), bleed: 5 * cam.z, rim: .95, vig: .3, shake: [Math.sin(t * 40) * sh, Math.cos(t * 37) * sh], night: 0 };
}
// ---- S10 incense half ----
function s10(A, t) { return incenseInsert(A, t, .52, HIT.ashFlake2); }

// ---- S11 the summit: the argument ----
function summitState(t) {
  // ---- the cloud's state ----
  let C = { breath: breathOf(t + 2), bubble: .5 + .5 * breathOf(t + 2), expr: CEXPR.asleep, lean: 0, squash: 1, tug: null, gust: 0, look: [0, 0] };
  const mum = pulse(t, HIT.mumble - .05, HIT.roll + .6, .5);
  if (mum > 0) C.expr = mixC(CEXPR.asleep, CEXPR.mumble, mum);
  const roll = sg(t, HIT.roll, HIT.roll + .7); C.lean = -.14 * ss(roll) * (1 - sg(t, HIT.tug0 + .5, HIT.yank)); C.bubble *= 1 - sg(t, HIT.roll, HIT.roll + .1);
  if (t > HIT.roll + .1 && t < HIT.cloudEye) C.bubble = .5 + .5 * breathOf(t + 2);
  const tug = t >= HIT.bite ? sg(t, HIT.tug0, HIT.yank) : 0, yank = t >= HIT.yank ? 1 - sg(t, HIT.yank, HIT.yank + .12) : 1;
  if (t >= HIT.bite && t < HIT.yank + .2) C.tug = [330, 60, Math.min(tug, yank) * .9];
  if (t >= HIT.yank && t < HIT.yank + .8) { const k = pulse(t, HIT.yank, HIT.yank + .8, .4); C.squash = 1 + .1 * k; C.expr = mixC(C.expr, CEXPR.mumble, k); }
  const eye = sg(t, HIT.cloudEye, HIT.cloudEye + .4), blow = sg(t, HIT.gust, HIT.gust + .25), done = sg(t, HIT.gust + 1.3, HIT.gust + 2.2);
  if (eye > 0) { C.expr = mixC(CEXPR.asleep, CEXPR.peek, eye); C.look = [1, .2]; C.bubble = 0; }
  if (t >= HIT.gust) { C.expr = mixC(CEXPR.peek, CEXPR.blow, blow); C.gust = blow * (1 - done); C.expr = mixC(C.expr, CEXPR.asleep, done); }
  // ---- the dragon ----
  let S = { a: 0, amp: 4, k: 1, ph: 0, legs: 1, ground: 13, expr: EXPR.neutral, headTilt: -.2, wind: [0, 0] };
  let x = 940, y = 455 - 13 * 1.75, dir = -1, sc = 1.75, squeak = 0, streak = 0;
  const tt = twos(t);
  if (t < HIT.land) {
    const u = sg(t, SHOT.s11, HIT.land); x = lerp(1500, 940, eo(u)); y = lerp(250, 432, ss(u)); S.legs = sg(t, HIT.land - .3, HIT.land); S.a = -.1; S.amp = 9; S.ph = -t * 8; S.expr = EXPR.curious; S.vel = [30 * (1 - u), 0];
  } else if (t < HIT.throat) {
    const u = sg(t, HIT.land, HIT.land + .3); S.squash = 1 - .18 * Math.sin(u * Math.PI);
    const w = sg(t, HIT.land + .35, HIT.throat - .2); x = lerp(940, 880, w); S.gait = w > 0 && w < 1 ? tt * 22 : 0; S.headTilt = lerp(-.2, -.55, w); S.expr = { ...EXPR.curious, pupil: [-.4, -.7] };
  } else if (t < HIT.tap + .5) {
    const th = pulse(t, HIT.throat, HIT.throat + .35, .5); S.headTilt = -.45 + .25 * th; S.squash = 1 - .05 * th; S.expr = { ...EXPR.neutral, mouth: .3 * th, pupil: [-.4, -.6] };
    const ant = pulse(t, HIT.tap - .35, HIT.tap, 1), tp = t >= HIT.tap ? 1 - sg(t, HIT.tap, HIT.tap + .3) : 0;
    x = 880 + 10 * ant - 26 * tp; S.a = -.15 * tp; S.headTilt = -.45 - .1 * tp; S.stretch = 1 - .06 * ant + .08 * tp; if (tp > 0) S.expr = { ...EXPR.neutral, lid: .4, pupil: [-.4, -.5] };
  } else if (t < HIT.bite) {
    const u = sg(t, HIT.mumble, HIT.roll + .5); S.headTilt = -.4 + .3 * Math.sin(u * Math.PI); S.expr = { ...EXPR.worried, pupil: [-.4, -.5], browY: .5 }; x = 880;
  } else if (t < HIT.yank) {
    const r = sg(t, HIT.bite, HIT.tug0), pull = sg(t, HIT.tug0, HIT.yank);
    x = lerp(880, 870, r) + 70 * pull + Math.sin(tt * 30) * 2 * pull; y = 432 - 30 * r + 20 * pull; S.a = lerp(0, -.95, r) + .4 * pull; S.headTilt = lerp(-.4, -.3, r) + .5 * pull; S.legs = 1; S.gait = pull > 0 ? tt * 26 : 0; S.stride = 9; S.stretch = 1 + .14 * pull; S.curl = -.14 * pull;
    S.expr = pull > 0 ? { ...EXPR.effort, mouth: 0 } : { ...EXPR.determined, mouth: .6 * r }; S.amp = 4 + 6 * pull; S.ph = pull * 3;
  } else if (t < HIT.puff) {
    const u = sg(t, HIT.flung - .15, HIT.landHead);
    if (u < 1) { x = lerp(940, 1300, u); y = 452 - 260 * Math.sin(u * Math.PI) + 10; S.a = -1 - u * 5.2; S.legs = 0; S.amp = 12; S.k = 1.4; S.expr = EXPR.dizzy; S.headTilt = .3; S.curl = .25; S.stretch = 1.15; S.vel = [40, 0]; }
    else { const v = t - HIT.landHead; const sp = spring(v, 6, .3); x = 1300; y = 452 + 10 - 30 * (1 - sp); S.a = -Math.PI * .95 * (1 - sp); S.squash = 1 - .22 * Math.exp(-v * 9); S.legs = sp; S.expr = mixExpr(EXPR.dizzy, EXPR.angry, sg(v, .3, .7)); S.headTilt = .2 * (1 - sp); }
  } else if (t < HIT.blownOff) {
    const w = sg(t, HIT.puff, HIT.inhale2 - .2); x = lerp(1300, 920, ss(w)); S.gait = w > 0 && w < 1 ? tt * 22 : 0; S.stride = 8;
    const pf = sg(t, HIT.inhale2 - .2, HIT.roar), rr = t >= HIT.roar ? 1 - sg(t, HIT.roar + .35, HIT.roar + .7) : 0;
    S.expr = mixExpr({ ...EXPR.angry, puff: .3 }, { ...EXPR.puffed, puff: 1.3 }, pf); if (rr > 0) S.expr = { ...EXPR.roar, puff: .5 * rr }; S.headTilt = -.5 - .3 * pf + .8 * rr; S.a = -.15 * pf + .1 * rr; S.squash = 1 + .06 * pf - .08 * rr; S.stretch = 1 - .1 * pf + .25 * rr; S.curl = .12 * pf - .1 * rr;
    squeak = rr;
    if (t >= HIT.gust) { const g = sg(t, HIT.gust, HIT.blownOff); S.wind = [60 * g, 0]; S.expr = mixExpr(S.expr, EXPR.shocked, g); x += 20 * g; S.a = .2 * g; }
  } else if (t < HIT.climbBack) {
    const u = sg(t, HIT.blownOff, HIT.blownOff + .8); x = lerp(940, 2200, ei(u) * .6 + u * .4); y = lerp(432, 160, u) + Math.sin(u * 7) * 20; S.a = -.3 + u * 7; S.legs = 0; S.amp = 12; S.k = 1.5; S.expr = EXPR.shocked; S.wind = [30, 0]; S.stretch = 1.3; S.vel = [70, 0];
    streak = .8 * (1 - sg(t, HIT.blownOff + .5, HIT.blownOff + 1.2));
  } else {
    const u = sg(t, HIT.climbBack, HIT.climbBack + 1.0); x = lerp(1700, 1120, eo(u)); y = lerp(150, 330, eo(u)) + Math.sin(t * 2.4) * 8; S.legs = 0; S.a = -.1; S.amp = 8; S.ph = -t * 5; S.vel = [25 * (1 - u), 0]; S.curl = -.03;
    const pant = Math.max(0, Math.sin(t * 7)) * (1 - sg(t, HIT.eyeUp, HIT.browSettle)), down = pulse(t, HIT.climbBack + .8, HIT.eyeUp + .2, .6);
    S.expr = { ...EXPR.worried, mouth: .35 * pant, pupil: [-.5 + .3 * down, lerp(-.3, 1, down)] }; S.headTilt = .35 * down - .2 * (1 - down);
    const det = sg(t, HIT.browSettle, HIT.browSettle + .7); if (det > 0) S.expr = mixExpr({ ...EXPR.worried, pupil: [-.5, -.3] }, { ...EXPR.determined, pupil: [-.6, -.2] }, det);
    const rise = sg(t, HIT.rise, SHOT.s12); y -= 700 * ei(rise); x -= 60 * rise; S.a = -.1 - .6 * rise; S.headTilt = -.2 - .3 * rise; S.ph = -t * (5 + 3 * rise); S.stretch = 1 + .15 * rise; S.vel = [50 * rise, 0];
  }
  if (C.tug) { const sn = [x + dir * Math.cos(S.a) * 44, y + Math.sin(S.a) * 44 + 6], wp = [CLOUD.x + 1.1 * CLOUD.r, CLOUD.y + .25 * CLOUD.r]; C.tug = [sn[0] - wp[0], sn[1] - wp[1], C.tug[2]]; }
  return { C, S, x, y, dir, sc, squeak, streak };
}
// draw the summit through a camera; cuK > 1 draws the dragon that much bigger around its eye (a close-up)
function summitDraw(A, t, cam, st, cuK = 1) {
  const L = A.ink;
  paintCam(A, cam); mist(A, cam, [[1150, 1330, .4]]);
  cloud(A, { ...CLOUD, ...st.C }, { t });
  const X0 = { x: st.x, y: st.y, s: st.sc, dir: st.dir, t, seed: 3, boil: t * 12 };
  if (st.streak > 0) draw(L, mk([[1000, 420], [1400, 320], [1900, 190], [2300, 110]], { w: 30, tone: .5, dry: .8, wet: .05, prof: 'tip', nb: 40, seed: 130, gapLen: 900 }), 1, st.streak);
  const d = cuK > 1 ? dragonCU(A, TMP, st.S, X0, cuK) : dragon(A, TMP, st.S, X0);
  if (st.squeak > 0) { const sn = d.snout, k = st.sc * cuK; for (let i = 0; i < 3; i++) draw(L, mk([[sn[0] - 10 * k - i * 3 * k, sn[1] + (i - 1) * 12 * k], [sn[0] - 28 * k - i * 8 * k, sn[1] + (i - 1) * 20 * k]], { w: 1.4 * k, tone: .6 * st.squeak, dry: .6, prof: 'tip', nb: 3, seed: 120 + i }), 1, st.squeak); }
  return { paper: paperOf(cam), bleed: 5 * cam.z, rim: .95, vig: .25, night: 0 };
}
const eyeCam = (st, cuK, z, ox = 0, oy = 0) => { const e = eyeOf(st.S, { x: st.x, y: st.y, s: st.sc, dir: st.dir }); return { x: e[0] + ox, y: e[1] + oy, z }; };
const FACE = [CLOUD.x + .55 * CLOUD.r, CLOUD.y - .12 * CLOUD.r];
function s11(A, t) { const st = summitState(t); return summitDraw(A, t, { x: 900, y: 330, z: 1.2 }, st); }
function s11l(A, t) { const st = summitState(t); const u = sg(t, SHOT.s11l, SHOT.s11m); return summitDraw(A, t, { x: lerp(820, 790, u), y: 380, z: lerp(2.0, 2.2, u) }, st); }
function s11m(A, t) { const st = summitState(t); return summitDraw(A, t, { x: FACE[0] + 40, y: FACE[1] + 50, z: 2.4 }, st); }
function s11n(A, t) { const st = summitState(t); return summitDraw(A, t, eyeCam(st, 3.5, 2.4, -60, 40), st, 3.5); }
function s11o(A, t) { const st = summitState(t); return summitDraw(A, t, { x: 860, y: 400, z: 1.9 }, st); }
function s11p(A, t) { const st = summitState(t); return summitDraw(A, t, { x: 1020, y: 330, z: 1.2 }, st); }
function s11q(A, t) { const st = summitState(t); return summitDraw(A, t, { x: st.x - 40, y: 400, z: 2.0 }, st); }
function s11r(A, t) { const st = summitState(t); return summitDraw(A, t, eyeCam(st, 3.5, 2.3, -80, 50), st, 3.5); }
function s11s(A, t) { const st = summitState(t); return summitDraw(A, t, { x: FACE[0] + 20, y: FACE[1] + 20, z: 2.8 }, st); }
function s11t(A, t) { const st = summitState(t); return summitDraw(A, t, { x: 1000, y: 330, z: 1.15 }, st); }
function s11u(A, t) { const st = summitState(t); return summitDraw(A, t, { x: 1150, y: 300, z: 2.0 }, st); }
function s11c(A, t) { const st = summitState(t); const cam = eyeCam(st, 3, 2.2, -40, 60); if (t >= HIT.rise) { const e0 = eyeOf(st.S, { x: st.x, y: st.y, s: st.sc, dir: st.dir }); cam.y = Math.max(cam.y, e0[1] + 60 + 700 * ei(sg(t, HIT.rise, SHOT.s12)) * .9); } return summitDraw(A, t, cam, st, 3); }
// ---- S11b cut-in: the child's empty bowl ----
function s11b(A, t) {
  const u = sg(t, SHOT.s11b, SHOT.s11c), cam = { x: 2255, y: 1455, z: lerp(2.7, 2.95, u) };
  paintCam(A, cam); paintingLife(A, t, {});
  return { paper: paperOf(cam), bleed: 5 * cam.z, rim: .95, vig: .3, night: 0 };
}
// ---- S12 silence above the cloud; the curl ----
function s12State(t) {
  const curl = sg(t, HIT.curl, HIT.curl + 1.2), open = sg(t, 81.6, 82.0);
  const back = pulse(t, HIT.lookBack, HIT.breath + .4, .5), breath = pulse(t, HIT.breath, HIT.breath + .9, .5), nod = pulse(t, HIT.nod, HIT.nod + .55, .5);
  const S = { a: -.7 + .6 * curl, amp: 3, k: .8, ph: 0, legs: 0, curl: .95 * ss(curl), taper: 1, stretch: 1 - .1 * ss(curl) + .05 * breath,
    expr: mixExpr({ ...EXPR.determined, pupil: [lerp(0, .9, back), lerp(.6, .9, back)], lid: .3, puff: .9 * breath, mouth: .15 * breath }, curl > 0 ? EXPR.closed : EXPR.determined, ss(curl) * (1 - open)),
    headTilt: .2 * curl + .55 * back + .35 * nod - .1 * breath };
  return { S, X: { x: 700 - 30 * curl, y: -430 + Math.sin(t * 1.4) * 6, s: 1.4, dir: 1, t, seed: 3, boil: t * 12 } };
}
function s12(A, t) {   // silence: high wide, the dragon very small above the cloud
  const cam = { x: 700, y: -260, z: .55 };
  paintCam(A, cam);
  cloud(A, { ...CLOUD, breath: breathOf(t + 2), bubble: .5 + .5 * breathOf(t + 2), expr: CEXPR.asleep }, { t });
  const st = s12State(t); dragon(A, TMP, st.S, st.X);
  return { paper: paperOf(cam), bleed: 5 * cam.z, rim: .9, vig: .15, warm: .4, night: 0 };
}
function s12b(A, t) {   // close-up: it looks back at the village, breathes, nods
  const st = s12State(t), e = eyeOf(st.S, st.X), cam = { x: e[0] + 70, y: e[1] + 50, z: 2.3 };
  paintCam(A, cam);
  dragonCU(A, TMP, st.S, st.X, 3.6);
  return { paper: paperOf(cam), bleed: 5 * cam.z, rim: .9, vig: .15, warm: .4, night: 0 };
}
function s12c(A, t) {   // medium: curls into the drop it was born from
  const st = s12State(t), e = eyeOf(st.S, st.X), cam = { x: e[0] - 20, y: e[1] + 40, z: 1.5 };
  paintCam(A, cam);
  dragonCU(A, TMP, st.S, st.X, 1.6);
  return { paper: paperOf(cam), bleed: 5 * cam.z, rim: .9, vig: .15, warm: .4, night: 0 };
}
// ---- S13 the dive stroke; S14 the bloom in the cloud ----
function diveState(t) {
  const hit = HIT.diveStroke + 3 * F, u = sg(t, HIT.diveStroke, hit);
  return { u, hit, entered: t >= hit };
}
function s13(A, t) {
  const push = sg(t, HIT.diveStroke, SHOT.s14), cam = { x: 640, y: lerp(60, 200, push), z: lerp(.8, 1.1, ss(push)) };
  paintCam(A, cam);
  const d = diveState(t), L = A.ink;
  let C = { breath: 0, bubble: 0, expr: CEXPR.asleep, squash: 1, ink: 0, inkAt: [-.15, -.3] };
  if (d.entered) { const v = t - d.hit; C.squash = 1 + .12 * Math.exp(-v * 7) * Math.cos(v * 18); C.ink = .35 * sg(t, d.hit, SHOT.s14); C.expr = mixC(CEXPR.asleep, CEXPR.mumble, pulse(t, d.hit + .4, d.hit + 2.5, .5)); }
  cloud(A, { ...CLOUD, ...C }, { t });
  // the stroke: one flying-white line from the top of the frame into the cloud, in three frames; the dragon is the stroke
  if (!d.entered) {
    const y1 = lerp(-700, 250, d.u);
    draw(L, mk([[640, -800, .4], [640, y1 - 300, 1.1], [642, y1, 1.0]], { w: 64, tone: .85, dry: .62, wet: .3, prof: 'rise', nb: 56, seed: 140, gapLen: 1200 }), 1, 1);
    dragon(A, TMP, { a: Math.PI / 2, amp: 2, k: .6, legs: 0, len: 220, taper: 1.2, expr: EXPR.determined, headTilt: 0, stretch: 1.4, vel: [120, 0] }, { x: 640, y: y1, s: 1.2, dir: 1, t, seed: 3 });
  } else {
    const v = t - d.hit, k = clamp(1 - v / .5);
    draw(L, mk([[640, -800, .4], [640, -200, 1.0], [642, 250, 1.0]], { w: 64, tone: .85 * k, dry: .62, wet: .3, prof: 'rise', nb: 56, seed: 140, gapLen: 1200 }), 1, k);
    // a burst of pale wisps where it went in
    const R = mulberry(43); for (let i = 0; i < 10; i++) { const a = R() * Math.PI * 2, dd = (20 + R() * 120) * clamp(v / .4); blot(L.wet, 660 + Math.cos(a) * dd, 200 + Math.sin(a) * dd * .6, (6 + R() * 14) * (1 - clamp(v / 1.2)), .25 * (1 - clamp(v / 1.2)), R() * 3, .7, 150 + i); }
  }
  return { paper: paperOf(cam), bleed: 5 * cam.z, rim: 1, vig: .2, night: 0 };
}
function s13b(A, t) {   // inside the cloud: the dragon's body unravels into threads of ink that fall as the first drops
  const u = sg(t, SHOT.s13b, SHOT.s14), cam = { x: 600, y: 300, z: lerp(1.5, 1.75, ss(u)) };
  paintCam(A, cam);
  const L = A.ink, v = t - HIT.diveStroke - 3 * F;
  const C = { breath: 0, bubble: 0, expr: mixC(CEXPR.asleep, CEXPR.mumble, pulse(t, SHOT.s13b, SHOT.s14, .5)), squash: 1 + .12 * Math.exp(-v * 7) * Math.cos(v * 18), ink: .35 * sg(t, SHOT.s13b - .4, SHOT.s14), inkAt: [-.15, -.3] };
  cloud(A, { ...CLOUD, ...C }, { t });
  // the dragon inside, pale, undulating slowly, dissolving: its ink fades as the threads take it
  const S = { a: -.2 + .15 * Math.sin(t * .8), amp: 10, k: 1, ph: t * 2.5, legs: 0, expr: { ...EXPR.closed, smile: .6, whisk: .4 }, headTilt: -.1, taper: 1 + .8 * u, stretch: 1 + .2 * u };
  const d = dragon(A, TMP, S, { x: 540, y: 300, s: 2.2, dir: 1, t, seed: 3, boil: t * 12, am: .62 * (1 - ss(u)) + .05, eye: 0 });
  // threads: from points along its spine, thin wavy lines of ink run down through the cloud to its underside and on into drops
  const under = CLOUD.y + .72 * CLOUD.r;
  for (let i = 0; i < 12; i++) {
    const start = sg(t, SHOT.s13b + i * .22, SHOT.s13b + i * .22 + 1.6); if (start <= 0) continue;
    const p = d.spine[2 + Math.floor(i * 1.1)], len = (under - p[1]) * ss(start) + 160 * clamp(start - .6) / .4 * (1 + i % 3 * .3);
    const pts = []; for (let k = 0; k <= 8; k++) { const w = k / 8; pts.push([p[0] + Math.sin(w * 6 + i * 1.7 + t * 1.5) * 14 * (1 - w * .5) + (i - 6) * 8 * w, p[1] + w * len, 1 - w * .6]); }
    draw(L, mk(pts, { w: 4.5, tone: .6 * clamp(start * 2), dry: .5, wet: .4, prof: 'tip', nb: 5, seed: 500 + i, gapLen: 300 }), 1, 1);
    const ey = p[1] + len; if (ey > under + 20) { const dropY = ey + (ey - under) * .3; blot(L.wet, pts[8][0], dropY, 6, .65, 0, 1.3, 520 + i); blot(L.dry, pts[8][0], dropY, 3.6, .5, 0, 1.3, 540 + i); }
  }
  return { paper: paperOf(cam), bleed: 7 * cam.z, rim: 1.2, vig: .22, night: 0, warm: .4 };
}
function s14(A, t) {
  const cam = { x: 600, y: 290, z: 1.9 }, sh = pulse(t, HIT.thunder, HIT.thunder + .3, .3) * 9;
  cam.x += Math.sin(t * 50) * sh; cam.y += Math.cos(t * 43) * sh;
  paintCam(A, cam);
  const ink = .35 + .65 * eio(sg(t, SHOT.s14, HIT.firstDrops)), wake = sg(t, HIT.wake, HIT.wake + .35), belly = sg(t, HIT.lookBelly, HIT.lookBelly + .6), sag = sg(t, HIT.lookBelly + .3, HIT.thunder + 1);
  let E = mixC(CEXPR.mumble, CEXPR.shocked, wake); if (belly > 0) E = mixC(E, CEXPR.heavy, belly);
  const C = { breath: 0, bubble: 0, expr: E, ink, inkAt: [-.15, -.3], squash: 1 + .18 * sag, look: [0, belly], drops: sg(t, HIT.firstDrops, SHOT.s15 + .5), y: CLOUD.y + 30 * sag };
  cloud(A, { ...CLOUD, ...C }, { t });
  return { paper: paperOf(cam), bleed: 6 * cam.z, rim: 1.2, vig: .25 + .1 * sag, night: 0, warm: .4 };
}
// ---- S15 rain: tilt down to the village, the pay-offs, the red drop ----
function s15(A, t) {
  const t0 = SHOT.s15;
  const cx = keys([[t0, 700], [100.0, 2220], [101.5, 2220], [103.0, 650], [104.0, 650]], t, ss), cy = keys([[t0, 450], [96.0, 1300], [100.0, 1430], [101.5, 1430], [103.0, 150], [103.2, 150], [104.0, 1900]], t, ss), cz = keys([[t0, .72], [100, .98], [101.5, 1.0], [103, .9], [104, 1.3]], t, ss);
  const cam = { x: cx, y: cy, z: cz };
  const fill = sg(t, HIT.riverFill, HIT.riverFill + 4), cracks = 1 - sg(t, HIT.riverFill, HIT.riverFill + 3);
  paintCam(A, cam, { cracks });
  mist(A, cam, [[1150, 1330, .3]]);
  WD.water(A.ink, t, fill, 1);
  const drain = sg(t, 101.5, 103.0);
  paintingLife(A, t, { float: sg(t, HIT.boatFloat, HIT.boatFloat + 1.2), leaf: sg(t, 100, 103), bowl: sg(t, HIT.bowlFill, HIT.drink), drink: sg(t, HIT.drink, HIT.drink + .6), dance: sg(t, HIT.dance, HIT.dance + .8), cloud: { breath: 0, bubble: 0, expr: mixC(CEXPR.heavy, { ...CEXPR.asleep, mouth: .15 }, drain), ink: 1 - .85 * drain, inkAt: [-.15, -.3], squash: 1.18 - .18 * drain, drops: 1 - drain, y: CLOUD.y + 30 - 30 * drain } });
  WD.rain(A.ink, cam, t, clamp((t - t0) / .6) * (1 - .9 * sg(t, 102.2, 104)), 1);
  // the red drop: leaves the cloud's belly at 103.0 and falls through blank paper; the camera follows
  if (t >= HIT.redDrop) { const v = t - HIT.redDrop, y = CLOUD.y + 170 + v * v * 2600 + v * 300, x = 650; const X = camXf(cam); const c = A.cc; c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = `rgb(${VERM.join(',')})`; c.globalAlpha = .95; const p = [x * X.s + X.tx, y * X.s + X.ty]; c.beginPath(); c.ellipse(p[0], p[1], 15 * X.s, 21 * X.s, 0, 0, 7); c.fill(); c.restore(); }
  return { paper: paperOf(cam), bleed: 6 * cam.z, rim: 1.15, vig: .25 - .1 * drain, night: 0, warm: .45 };
}
// ---- S16 dawn: the studio wide again; the red drop lands in the inkstone; the painter wakes ----
function dawnStudio(A, t, cam, o = {}) {   // the top-down studio at dawn
  const L = A.ink, X = camXf(cam); A.xf(X.s, X.tx, X.ty); A.cc.setTransform(X.s, 0, 0, X.s, X.tx, X.ty);
  studioStatic(A, t, { shine: 1, lampAm: .6 });
  paintingLayers(A, cam, { cracks: 0 }); setXf(A, paintXf(cam));
  WD.water(A.ink, t, 1, 1);
  paintingLife(A, t, { float: 1, leaf: 1, bowl: 1, drink: 0, cloud: { breath: breathOf(t + 2) * .5, bubble: 0, expr: { ...CEXPR.asleep, mouth: .15 }, ink: .15, inkAt: [-.15, -.3] } });
  colophon(A, 1, .8);
  A.xf(X.s, X.tx, X.ty); A.cc.setTransform(X.s, 0, 0, X.s, X.tx, X.ty);
  ST.incense(L, A.cc, ST.INCENSE.x, ST.INCENSE.y, 1, { burn: 1, t });
  ST.painter(L, PAINTER[0], PAINTER[1], 1, { breath: breathOf(t) * (1 - (o.lift || 0)) + (o.stir || 0) * 2, lift: o.lift || 0, eyes: o.eyes || 0 });
  return X;
}
const dawnK = t => sg(t, HIT.brighten, HIT.brighten + 4);
const dawnTone = t => { const d = dawnK(t); return { vig: lerp(NIGHT.vig, DAWN.vig, d), warm: lerp(NIGHT.warm, DAWN.warm, d), paperCol: NIGHT.paperCol.map((v, i) => lerp(v, DAWN.paperCol[i], d)), night: 1 - d }; };
function s16(A, t) {   // insert: the red drop lands in the inkstone's pool
  const L = A.ink, cam = { x: ST.INKSTONE.x + 10, y: ST.INKSTONE.y, z: 3.0 };
  const X = camXf(cam); A.xf(X.s, X.tx, X.ty); A.cc.setTransform(X.s, 0, 0, X.s, X.tx, X.ty);
  ST.desk(L); ST.inkstone(L, ST.INKSTONE.x, ST.INKSTONE.y, 1, { shine: 1, pool: .85 });
  const v = t - HIT.plip;
  if (v >= 0) { for (let i = 0; i < 4; i++) { const age = v - i * .18; if (age < 0) continue; for (const c of [L.wet, L.dry]) { c.save(); c.globalCompositeOperation = 'destination-out'; c.globalAlpha = .55 * clamp(1 - age / 1.3); c.lineWidth = 2.2; c.strokeStyle = '#000'; c.beginPath(); c.ellipse(ST.INKSTONE.x + 10, ST.INKSTONE.y + 4, 4 + age * 44, (4 + age * 44) * .7, 0, 0, 7); c.stroke(); c.restore(); } } }
  const c = A.cc; c.save(); c.globalAlpha = .96 * (v < 0 ? 1 : clamp(1 - v / 1.1)); c.fillStyle = `rgb(${VERM.join(',')})`; c.beginPath(); c.ellipse(ST.INKSTONE.x + 10, ST.INKSTONE.y + 4 - (v < 0 ? 400 : 0), 5, 5 + (v < 0 ? 3 : 0), 0, 0, 7); c.fill(); c.restore();
  return { paper: paperOf(cam), bleed: 5, rim: 1.1, ...NIGHT, night: 1, lampAt: lampScreen(cam, 1400) };
}
function s16b(A, t) {   // dawn wide: the room pales, the lamp is out, the incense is ash
  const cam = { x: 960, y: 560, z: 1 };
  dawnStudio(A, t, cam, {});
  return { paper: paperOf(cam), bleed: 5, rim: 1, ...dawnTone(t), lampAt: lampScreen(cam, 900 * (1 - dawnK(t))) };
}
function s16c(A, t) {   // side view: the painter stirs and lifts the head
  const L = A.ink, cam = { x: 960, y: 560, z: 1 };
  A.xf(1, 0, 0); A.cc.setTransform(1, 0, 0, 1, 0, 0);
  draw(L, mk([[-50, 742], [600, 738], [1300, 741], [1970, 736]], { w: 8, tone: .62, dry: .6, wet: .2, prof: 'even', seed: 31, gapLen: 800 }));
  mass(L.wet, [[-50, 1080], [1970, 1080], [1970, 745], [-50, 745]], .06, 0, 35);
  draw(L, mk([[-50, 727], [900, 725]], { w: 3, tone: .35, dry: .55, prof: 'even', seed: 36 }));
  const stir = pulse(t, HIT.stir, HIT.stir + 1.2, .5), lift = ss(sg(twos(t), HIT.headUp, SHOT.s16d + .6));
  for (const c of [L.wet, L.dry]) { c.save(); c.translate(1300, 0); c.scale(-1, 1); c.translate(-1300, 0); }
  ST.painterSide(L, 1340, 700, 2.3, { breath: breathOf(t) * (1 - lift) + stir * 2.5, lift });
  for (const c of [L.wet, L.dry]) c.restore();
  return { paper: paperOf(cam), bleed: 5, rim: 1, ...dawnTone(t) };
}
function s16d(A, t) {   // close: the face wakes, the eyes open, the gaze goes to the painting
  const L = A.ink, lift = ss(sg(twos(t), HIT.headUp, SHOT.s16d + .6)), eyes = sg(t, HIT.lookPainting, HIT.lookPainting + .4);
  const cam = { x: 960, y: 560, z: 1 };
  A.xf(1, 0, 0); A.cc.setTransform(1, 0, 0, 1, 0, 0);
  for (const c of [L.wet, L.dry]) { c.save(); c.translate(1300, 0); c.scale(-1, 1); c.translate(-1300, 0); }
  ST.painterSide(L, 1300 + 120, 900, 3.0, { breath: 0, lift, eyes });
  for (const c of [L.wet, L.dry]) c.restore();
  return { paper: paperOf(cam), bleed: 5, rim: 1, ...dawnTone(t) };
}
// ---- S17 insert: the wet painting; the fingertip ----
function s17(A, t) {
  const L = A.ink, u = ss(sg(t, SHOT.s17, SHOT.s18)), cam = { x: lerp(1250, 1290, u), y: lerp(640, 620, u), z: lerp(3.3, 3.9, u) };
  const X = camXf(cam); A.xf(X.s, X.tx, X.ty); A.cc.setTransform(X.s, 0, 0, X.s, X.tx, X.ty);
  ST.desk(L);
  paintingLayers(A, cam, { cracks: 0 }); setXf(A, paintXf(cam));
  WD.water(A.ink, t, 1, 1);
  paintingLife(A, t, { float: 1, leaf: 1, bowl: 1, drink: 0 });
  colophon(A, 1, .8);
  A.xf(X.s, X.tx, X.ty); A.cc.setTransform(X.s, 0, 0, X.s, X.tx, X.ty);
  // the fingertip comes down from the top, touches the paper at 114.0, lifts at 115.0 and withdraws at 116
  const inK = sg(t, 113.0, HIT.touch), out = sg(t, HIT.touch + 1.0, HIT.eyeInkstone);
  if (inK > 0 && out < 1) { const tx = 1215 + 90 * (1 - eo(inK)) + 60 * ei(out), ty = lerp(500, 716, eo(inK)) - 170 * ei(out); ST.hand(L, tx, ty, -1.05, 1, { hold: 'finger', am: 1 - out * .6 }); }
  if (t >= HIT.touch + .15) { const k = sg(t, HIT.touch + .15, HIT.touch + .6); blot(L.wet, 1215, 718, 6 * k, .35, .3, .7, 160); blot(L.wet, 1211, 722, 4 * k, .25, 1, .8, 161); for (let i = 0; i < 3; i++) { const age = (t - HIT.touch - .1) - i * .25; if (age > 0 && age < 1.4) ripple(L, 1215, 719, 4 + age * 26, clamp(1 - age / 1.3) * .7, 180 + i, .4, 1.2); } }
  return { paper: paperOf(cam), bleed: 12 * cam.z / 3.3, rim: 1.35, vig: .15, night: 0, warm: .25, paperCol: [.965, .945, .895] };
}
// ---- S18 the painter writes the title; the seal ----
function s18(A, t) {
  const L = A.ink, cam = { x: 1330, y: 640, z: 2.3 };
  const X = camXf(cam); A.xf(X.s, X.tx, X.ty); A.cc.setTransform(X.s, 0, 0, X.s, X.tx, X.ty);
  ST.desk(L); ST.sealBox(L, A.cc, ST.SEALBOX.x, ST.SEALBOX.y, 1);
  paintingLayers(A, cam, { cracks: 0 }); const px = paintXf(cam); setXf(A, px);
  WD.water(A.ink, t, 1, 1);
  paintingLife(A, t, { float: 1, leaf: 1, bowl: 1, drink: 0 });
  colophon(A, 1, .8);
  const p = sg(t, WRITE.t0, WRITE.t1);
  const xf = new DOMMatrix([px.s, 0, 0, px.s, px.tx, px.ty]);
  const tip = p > 0 ? titleColumn(A, p, xf, 1) : null;
  // the seal below the title, pressed at 125.0
  const sealK = sg(t, HIT.sealPress, HIT.sealPress + .08);
  if (sealK > 0) seal(A.cc, WD.SEAL[0], WD.SEAL[1], 120, .95 * sealK, 5);
  A.xf(X.s, X.tx, X.ty); A.cc.setTransform(X.s, 0, 0, X.s, X.tx, X.ty);
  // the hand with the brush: enters from the top-right, follows the tip while writing, lifts away, then the seal comes down
  const inK = sg(t, HIT.brushUp, WRITE.t0 - .1), outK = sg(t, WRITE.t1, WRITE.t1 + .8);
  let tipS;
  if (p > 0 && p < 1 && tip) tipS = [ST.SHEET.x + tip.x * ST.PSCALE, ST.SHEET.y + tip.y * ST.PSCALE + (tip.lifted ? -14 : 0)];
  else { const sx = ST.SHEET.x + WD.TITLE.x * ST.PSCALE, sy = ST.SHEET.y + WD.TITLE.y * ST.PSCALE; tipS = p <= 0 ? [lerp(sx + 180, sx, eo(inK)), lerp(sy - 150, sy - 10, eo(inK))] : [sx + 60 * outK, ST.SHEET.y + (WD.TITLE.y + 700) * ST.PSCALE - 120 * outK]; }
  if (t < HIT.sealPress - .7) { const g = ST.hand(L, tipS[0], tipS[1], -1.15, 1, { hold: 'brush', am: 1 - .5 * outK }); ST.brush(L, tipS[0], tipS[1], -1.15, 1, { inked: .9 }); void g; }
  // the seal block: descends from the upper right, strikes at 125.0 (a small squash of the picture), lifts
  if (t >= HIT.sealPress - .7 && t < HIT.sealPress + .9) {
    const d = sg(t, HIT.sealPress - .7, HIT.sealPress), up = sg(t, HIT.sealPress + .35, HIT.sealPress + .9);
    const sx = ST.SHEET.x + WD.SEAL[0] * ST.PSCALE + 18, sy = ST.SHEET.y + WD.SEAL[1] * ST.PSCALE + 18;
    const h = (1 - ei(d)) * 1 + up * 1.2, k = 1 + .45 * h;   // the block looks bigger when closer to the camera
    const x = sx, y = sy - 10 * h;
    mass(L.wet, [[x - 20 * k, y - 20 * k], [x + 20 * k, y - 20 * k], [x + 20 * k, y + 20 * k], [x - 20 * k, y + 20 * k]], .78, 1, 170);
    draw(L, mk([[x - 20 * k, y - 20 * k], [x + 20 * k, y - 20 * k], [x + 20 * k, y + 20 * k], [x - 20 * k, y + 20 * k], [x - 20 * k, y - 20 * k]], { w: 3, tone: .9, dry: .3, wet: .2, prof: 'even', seed: 171 }));
    // the hand holding it from above
    mass(L.wet, [[x - 26 * k, y - 60 * k], [x + 26 * k, y - 60 * k], [x + 30 * k, y - 12 * k], [x - 30 * k, y - 12 * k]], .16, 2, 172);
    draw(L, mk([[x - 28 * k, y - 14 * k], [x - 10 * k, y - 4 * k], [x + 12 * k, y - 6 * k], [x + 30 * k, y - 16 * k]], { w: 5 * k, tone: .75, dry: .4, prof: 'tip', seed: 173 }));
    draw(L, mk([[x - 50 * k, y - 120 * k], [x - 10 * k, y - 90 * k], [x + 20 * k, y - 62 * k]], { w: 26 * k, tone: .5, darkDir: [1, 0], side: .85, brWet: true, body: .18, dry: .45, wet: .9, prof: 'robe', seed: 174 }));
  }
  const sh = pulse(t, HIT.sealPress, HIT.sealPress + .15, .3) * 3;
  return { paper: paperOf(cam), bleed: 5 * cam.z / 2, rim: 1.2, vig: .15, night: 0, warm: .25, paperCol: [.965, .945, .895], shake: [0, sh] };
}
// ---- S19 the inkstone: a small dragon curled in the ink; the eye; the ink dries ----
function s19(A, t) {
  const L = A.ink, u = ss(sg(t, SHOT.s19, DUR)), cam = { x: ST.INKSTONE.x + 8, y: ST.INKSTONE.y + 6, z: lerp(3.0, 3.7, u) };
  const X = camXf(cam); A.xf(X.s, X.tx, X.ty); A.cc.setTransform(X.s, 0, 0, X.s, X.tx, X.ty);
  const dry = sg(t, HIT.dryOut, DUR - .2);
  ST.desk(L);
  ST.inkstone(L, ST.INKSTONE.x, ST.INKSTONE.y, 1, { shine: .6, am: 1, pool: .5 });
  // the little dragon curled in the pool: its body is the ink; only the pale eye-white and the vermilion give it away when the eye opens
  const open = sg(t, HIT.eyeOpen2, HIT.eyeOpen2 + .45), close = sg(t, HIT.eyeClose2, HIT.eyeClose2 + .4), sn = pulse(t, HIT.snore3, HIT.snore3 + 1.2, .5);
  const lid = 1 - open * (1 - close);
  const S = { a: -.6, amp: 2, k: .6, ph: .3, legs: 0, curl: .95, expr: { ...EXPR.closed, lid, pupil: [0, .1] }, headTilt: .1, squash: 1 + .04 * sn };
  dragon(A, TMP, S, { x: ST.INKSTONE.x + 24, y: ST.INKSTONE.y - 6, s: .5, dir: -1, t, seed: 3, eye: open * (1 - close), am: 1 - dry * .6 });
  // a tiny snore bubble at its nose
  if (sn > 0) { const bx = ST.INKSTONE.x - 2, by = ST.INKSTONE.y - 2, r = 3 + 5 * sn; for (const c of [L.wet, L.dry]) { c.save(); c.globalCompositeOperation = 'destination-out'; c.globalAlpha = .7; c.lineWidth = 1.2; c.strokeStyle = '#000'; c.beginPath(); c.arc(bx, by, r, .3, 6.0); c.stroke(); c.restore(); } }
  return { paper: paperOf(cam), bleed: 5 * cam.z / 3, rim: 1.1, vig: lerp(.15, .05, dry), night: 0, warm: .25, paperCol: [.965, .945, .895], flash: ei(dry) };
}

// ---- dispatcher, transitions, inscriptions, night wash ----
const SHOTS = { s01, s02, s03, s04, s04b, s04c, s05a, s05, s06, s07, s07b, s07c, s08, s09, s10, s11, s11l, s11m, s11n, s11o, s11p, s11q, s11r, s11s, s11t, s11u, s11b, s11c, s12, s12b, s12c, s13, s13b, s14, s15, s16, s16b, s16c, s16d, s17, s18, s19 };
export function frame(t, A, B, T1, T2) {
  TMP = T1; TMP2 = T2;
  const k = shotAt(t);
  let o = SHOTS[k](A, t) || {};
  // the dive: an ink-bloom transition from the ripple on the sheet into the painted world (S06 → S07): the studio stays the base picture (A),
  // the painted world (B) grows inside the bloom centred on the dive point, 29.57–30.7
  if (t >= HIT.dive + .15 && t < SHOT.s07 + .7) {
    const u = sg(t, HIT.dive + .15, SHOT.s07 + .7);
    A.clear(); B.clear();
    const oa = s06(A, Math.min(SHOT.s07 - .001, t)) || {}, ob = s07(B, Math.max(SHOT.s07, t)) || {};
    const e6 = eyeOf({ a: 1.4, headTilt: 1.6 }, { x: 1040, y: 360, s: DS, dir: 1 }), cam6 = { x: e6[0] + 60, y: e6[1] + 40, z: 2.4 }, X6 = camXf(cam6);
    o = { ...oa, paperB: ob.paper, bleedB: ob.bleed, rimB: ob.rim, trans: [1040 * X6.s + X6.tx, 350 * X6.s + X6.ty, 20 + 2600 * ss(u), 1] };
  }
  // night: the studio at night is a thin 清 wash over everything plus a heavier vignette
  if (o.night > 0) nightWash(A, o.night, o.lampAt);
  // inscriptions
  const boxes = [];
  if (!window.NOSUB) for (const s of SUBS) {
    if (s.kind) continue; if (t < s.t0 || t > s.t1) continue;
    const a = Math.min(clamp((t - s.t0) / .35), clamp((s.t1 - t) / .4)), pos = subPos(s.id, t);
    const b = inscription(A, s.text, pos[0], pos[1], a, { size: pos[2] || 52, vertical: pos[3] ?? true }); if (b) boxes.push({ id: s.id, box: b });
  }
  if (window.POSTER) posterTitle(A);
  delete o.night; delete o.lampAt;
  return o;
}
// each inscription's place in the shot's blank paper: [x, y, size, vertical]
export function subPos(id, t) {
  switch (id) {
    case 'L2': return [1000, 985, 50, false];
    case 'L3': return [1760, 110, 54, true];
    case 'L4': return [200, 120, 56, true];
    case 'L5': return [1760, 110, 56, true];
    case 'L7': return [1560, 150, 54, true];
  }
  return [150, 950, 50, false];
}
function posterTitle(A) {
  const c = A.cd; c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#000'; c.globalAlpha = .9; c.font = '150px "Ma Shan Zheng"'; c.textAlign = 'center'; c.textBaseline = 'middle';
  ['墨', '龙', '借', '雨'].forEach((ch, i) => c.fillText(ch, 1700, 170 + i * 165)); c.restore();
  seal(A.cc, 1660, 850, 84, .95, 5);
}

// on-screen texts for readcheck (full text from the first visible frame, boxes in screen px)
export function texts(t) {
  const out = [];
  for (const s of SUBS) {
    if (t < s.t0 || t > s.t1) continue;
    if (s.kind === 'colophon') {   // world-anchored on the painting in S05
      const u = eio(sg(t, SHOT.s05, 22.6)), cam = { x: lerp(1000, 1265, u), y: lerp(420, 640, u), z: lerp(1.4, 3.8, u) }, px = paintXf(cam);
      const x = WD.COLOPHON.x * px.s + px.tx, y0 = WD.COLOPHON.y * px.s + px.ty, h = 6 * 62 * 1.08 * px.s, w = 62 * px.s;
      out.push({ id: s.id, text: '家山久旱盼雨', x0: x - w / 2, y0, x1: x + w / 2, y1: y0 + h }); continue;
    }
    if (s.kind === 'title') {
      const cam = { x: 1330, y: 640, z: 2.3 }, px = paintXf(cam), x = WD.TITLE.x * px.s + px.tx, y0 = WD.TITLE.y * px.s + px.ty, h = 4 * 173 * px.s, w = 170 * px.s;
      out.push({ id: s.id, text: '墨龙借雨', x0: x - w / 2, y0, x1: x + w / 2, y1: y0 + h }); continue;
    }
    const pos = subPos(s.id, t), size = pos[2] || 52, n = [...s.text].length, vertical = pos[3] ?? true;
    out.push(vertical ? { id: s.id, text: s.text, x0: pos[0] - size * .6, y0: pos[1] - size * .5, x1: pos[0] + size * .6, y1: pos[1] + n * size * 1.1 } : { id: s.id, text: s.text, x0: pos[0] - size * .3, y0: pos[1] - size * .6, x1: pos[0] + n * size * 1.04, y1: pos[1] + size * .6 });
  }
  return out;
}

// ---- sound events for the mixer ----
export function events() {
  const E = [], at = (t, type, o = {}) => E.push({ t, type, ...o });
  // night studio
  at(0, 'amb', { kind: 'room', t0: 0, t1: 30.0 });
  for (let k = 0; k < 8; k++) at(k * 4.2 + .6, 'snore', { gain: k < 1 ? .6 : .8 });
  at(1.0, 'dripStretch', { gain: .5 }); at(2.2, 'dripStretch', { gain: .6 });
  at(HIT.dropFall, 'dropFall', { gain: .8 }); at(HIT.dropLand, 'drip', { gain: 1 }); at(HIT.dropLand + .05, 'bloom', { gain: .8 }); at(HIT.dropLand + .1, 'splatter', { gain: .6 });
  at(HIT.tailCurl, 'wetMove', { gain: .5 }); at(HIT.headLift, 'wetMove', { gain: .6 }); at(HIT.eyeOpen, 'eye', { gain: 1 });
  at(HIT.shake, 'shake', { gain: 1 }); at(HIT.shake + .1, 'splatter', { gain: .9 });
  at(HIT.stretch, 'stretch', { gain: .6 }); at(HIT.sneeze - .4, 'inhale', { gain: .5 }); at(HIT.sneeze, 'sneeze', { gain: 1 });
  at(12.2, 'wetMove', { gain: .3 });
  for (let k = 0; k < 14; k++) { const tt = 13.65 + k * .19; if (tt < HIT.snort) at(tt, 'tiptoe', { gain: .45 }); }
  for (let k = 0; k < 8; k++) at(HIT.snort + 1.05 + k * .19, 'tiptoe', { gain: .45 });
  at(16.2, 'fingers', { gain: .6 }); at(HIT.snort, 'snort', { gain: 1 });
  at(SHOT.s05, 'cloth', { gain: .3 });
  at(SHOT.s06, 'incense', { gain: .8 }); at(HIT.ashFlake1, 'ash', { gain: .9 }); at(HIT.ashFlake1 + .85, 'ashLand', { gain: .5 });
  at(HIT.inhale, 'inhale', { gain: .8 }); at(HIT.dive, 'dive', { gain: 1 }); at(HIT.dive + .1, 'rings', { gain: .9 });
  // the painting
  at(0, 'amb', { kind: 'wind', t0: SHOT.s07, t1: SHOT.s12 });
  at(0, 'amb', { kind: 'mist', t0: SHOT.s07, t1: SHOT.s08 + 1 });
  for (let tt = SHOT.s07 + .2; tt < SHOT.s08; tt += .72) at(tt, 'flap', { gain: .5 });
  at(SHOT.s08, 'amb', { kind: 'dust', t0: SHOT.s08, t1: HIT.slow });
  for (let tt = SHOT.s08 + .1; tt < HIT.slow; tt += .5) at(tt, 'dust', { gain: .5 });
  at(HIT.boat, 'creak', { gain: .5 }); at(HIT.slow, 'flap', { gain: .4 });
  at(SHOT.s09, 'amb', { kind: 'pinewind', t0: SHOT.s09, t1: SHOT.s10 });
  for (let tt = SHOT.s09 + .2; tt < SHOT.s10; tt += .62) at(tt, 'flap', { gain: .55 });
  for (let k = 0; k < 7; k++) at(HIT.snoreJ + k * 4.2, 'cloudSnore', { gain: .8 });
  at(SHOT.s10, 'incense', { gain: .8 }); at(HIT.ashFlake2, 'ash', { gain: .9 }); at(HIT.ashFlake2 + .85, 'ashLand', { gain: .5 }); at(HIT.snore2, 'snore', { gain: .9 });
  at(0, 'amb', { kind: 'summit', t0: SHOT.s11, t1: SHOT.s12 });
  at(HIT.land, 'landSoft', { gain: .8 }); at(HIT.land + .5, 'tiptoe', { gain: .5 }); at(HIT.land + .7, 'tiptoe', { gain: .5 });
  at(HIT.throat, 'throat', { gain: .8 }); at(HIT.tap, 'tap', { gain: 1 }); at(HIT.mumble, 'mumble', { gain: .9 }); at(HIT.roll, 'roll', { gain: .8 }); at(HIT.roll + .05, 'pop', { gain: .6 });
  at(HIT.bite, 'bite', { gain: .8 }); at(HIT.tug0, 'tug', { gain: 1, dur: HIT.yank - HIT.tug0 }); for (let tt = HIT.tug0; tt < HIT.yank; tt += .22) at(tt, 'skid', { gain: .5 });
  at(HIT.yank, 'yank', { gain: 1 }); at(HIT.flung, 'flung', { gain: .9 }); at(HIT.landHead, 'landHead', { gain: 1 }); at(HIT.landHead + .3, 'wobble', { gain: .5 });
  at(HIT.puff + .3, 'tiptoe', { gain: .4 }); at(HIT.puff + .5, 'tiptoe', { gain: .4 }); at(HIT.puff + .7, 'tiptoe', { gain: .4 });
  at(HIT.inhale2 - .2, 'puffUp', { gain: .8 }); at(HIT.inhale2, 'inhale', { gain: 1 }); at(HIT.roar, 'squeak', { gain: 1 });
  at(HIT.cloudEye, 'lid', { gain: .7 }); at(HIT.gust, 'gust', { gain: 1 }); at(HIT.blownOff, 'leaf', { gain: .9 }); at(HIT.blownOff + .3, 'flap', { gain: .3 });
  at(HIT.climbBack, 'flap', { gain: .6 }); at(HIT.climbBack + .4, 'flap', { gain: .5 }); at(HIT.climbBack + 1.0, 'pant', { gain: .8, dur: 2.2 });
  at(HIT.rise, 'riseAir', { gain: .6 });
  at(HIT.drip2, 'drip', { gain: .9 }); at(HIT.breath, 'inhale', { gain: .5 }); at(HIT.nod, 'wetMove', { gain: .25 });
  at(HIT.curl, 'wetMove', { gain: .4 });
  at(HIT.diveStroke, 'diveStroke', { gain: 1 }); at(HIT.diveStroke + 3 / 24, 'cloudHit', { gain: 1 }); at(HIT.diveStroke + .3, 'inkSpread', { gain: .9, dur: 8 });
  at(HIT.wake, 'gasp', { gain: 1 }); at(HIT.lookBelly, 'sag', { gain: .8 }); at(HIT.thunder, 'thunder', { gain: 1 }); at(HIT.firstDrops, 'firstDrops', { gain: .9 });
  at(0, 'amb', { kind: 'rain', t0: SHOT.s15, t1: 104.0, k: 1 });
  at(HIT.pinesDrip, 'pinesDrip', { gain: .7 }); at(HIT.riverFill, 'riverFill', { gain: 1 }); at(HIT.boatFloat, 'creak', { gain: .7 }); at(HIT.boatFloat + .4, 'creak', { gain: .5 });
  for (let k = 0; k < 6; k++) at(HIT.bowlFill + k * .33, 'bowlDrop', { gain: .8, k });
  at(HIT.drink, 'drink', { gain: .7 }); at(HIT.drink + .5, 'chirp', { gain: .8 });
  for (let tt = HIT.dance; tt < 103; tt += .25) at(tt, 'danceStep', { gain: .5 });
  at(HIT.redDrop, 'redDrop', { gain: .8 });
  // dawn
  at(HIT.plip, 'plip', { gain: 1 });
  at(0, 'amb', { kind: 'rainTail', t0: 104.0, t1: 109.0 });
  at(0, 'amb', { kind: 'morning', t0: 106.0, t1: DUR });
  at(HIT.stir, 'cloth', { gain: .8 }); at(SHOT.s16d, 'cloth', { gain: .4 }); at(HIT.headUp, 'cloth', { gain: .7 }); at(HIT.headUp + .3, 'creakChair', { gain: .6 });
  at(SHOT.s17, 'cloth', { gain: .4 }); at(HIT.touch, 'touchPaper', { gain: 1 }); at(HIT.touch + 1.0, 'touchPaper', { gain: .5 });
  at(HIT.brushUp, 'brushUp', { gain: .9 }); at(HIT.dip, 'dip', { gain: .9 });
  // writing: one stroke event per stroke (times filled in by the glyph timing: 14 + 5 + 10 + 8 strokes over 119.5–123.5, one character per second)
  const counts = [14, 5, 10, 8];
  counts.forEach((n, ci) => { for (let i = 0; i < n; i++) at(WRITE.t0 + ci * 1.0 + (i / n) * 1.0, 'stroke', { gain: .6, ci, i, dur: .9 / n }); });
  at(HIT.sealPress - .7, 'sealLift', { gain: .5 }); at(HIT.sealPress, 'seal', { gain: 1 });
  at(HIT.eyeOpen2, 'lid', { gain: .7 }); at(HIT.eyeClose2, 'lid', { gain: .5 }); at(HIT.snore3, 'tinySnore', { gain: .9 }); at(HIT.dryOut, 'drying', { gain: .6, dur: 1.5 });
  for (const [a, b] of SILENCE) at(a, 'silence', { t0: a, t1: b });
  return E;
}
