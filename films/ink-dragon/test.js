// Design pages drawn with the real engine: ?test=sheet (model sheet), ?test=frame&shot=s04 (one shot at a time), ?test=strip (action strips)
import { dragon, EXPR, mixExpr, splatter } from './dragon.js';
import { mk, draw, TONE } from './ink.js';
import { VERM, blit, paperOf, camXf } from './util.js';
import * as ST from './studio.js';
import * as WD from './world.js';
import { cloud, CEXPR } from './cloud.js';

function label(A, s, x, y, size = 26) { const c = A.cd; c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#000'; c.globalAlpha = .75; c.font = `${size}px "Noto Serif SC"`; c.fillText(s, x, y); c.restore(); }

export function render(t, A, B, TMP, TMP2, comp, mode, q) {
  A.clear(); B.clear();
  A.xf(1, 0, 0); A.cc.setTransform(1, 0, 0, 1, 0, 0);
  if (mode === 'sheet') {
    const T = +(q.get('t') || 0);
    label(A, '墨龙 model sheet', 60, 60, 34);
    // row 1: flying (right), flying (left), standing, curled (drop)
    const row1 = [
      ['飞 flying', { a: -.15, amp: 7, k: 1.1, ph: T * 6, legs: 0 }, 1],
      ['飞 左向 facing left', { a: .1, amp: 7, k: 1.1, ph: 1.5, legs: 0 }, -1],
      ['立 standing', { a: 0, amp: 3, k: .8, ph: .6, legs: 1, ground: 15 }, 1],
      ['蜷 curled', { a: -.6, amp: 2, k: .5, curl: .95, legs: 0, len: 100, expr: EXPR.closed }, 1],
    ];
    row1.forEach(([n, S, dir], i) => { const x = 330 + i * 450 + (dir < 0 ? 180 : 0), y = 230; dragon(A, TMP, S, { x, y, s: 2.1, dir, t: T, seed: 3 + i }); label(A, n, 170 + i * 450, 390); });
    // row 2: expressions
    const ex = [['好奇 curious', 'curious'], ['忧 worried', 'worried'], ['怒 angry', 'angry'], ['决 determined', 'determined'], ['惊 shocked', 'shocked'], ['喜 happy', 'happy'], ['困 sleepy', 'sleepy'], ['吼 roar', 'roar']];
    ex.forEach(([n, k], i) => { const x = 120 + i * 230, y = 560; dragon(A, TMP, { a: 0, amp: 2, k: 1, len: 60, legs: 1, ground: 10, expr: EXPR[k] }, { x: x - 10, y: y - 20, s: 2.6, t: T, seed: 20 + i }); label(A, n, x - 60, 660, 22); });
    // row 3: key poses: anticipation crouch (puffed), tug (effort), flung (dizzy, squash), birth blot
    const row3 = [
      ['鼓气 puffed', { a: -.25, amp: 4, k: 1, legs: 1, ground: 14, expr: EXPR.puffed, headTilt: -.3 }, 1, 1],
      ['拽 tug', { a: .35, amp: 6, k: 1, legs: 1, ground: 10, expr: EXPR.effort, headTilt: .5, stride: 10 }, 1, 1],
      ['摔 flung', { a: 2.4, amp: 9, k: 1.3, legs: 0, expr: EXPR.dizzy, headTilt: .4 }, 1, 1],
      ['墨点成形 birth 0.5', { a: -.1, amp: 4, k: 1, legs: 0, blotR: .5 }, 1, .55],
    ];
    row3.forEach(([n, S, dir, p], i) => { const x = 300 + i * 450, y = 880; dragon(A, TMP, S, { x, y, s: 1.7, dir, t: T, seed: 40 + i, p }); label(A, n, 170 + i * 450, 1040); });
    // palette: five tones + vermilion
    const c = A.cw; c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
    [.96, .82, .6, .34, .16].forEach((a, i) => { c.fillStyle = `rgba(0,0,0,${a})`; c.fillRect(1480 + i * 60, 30, 48, 48); });
    c.restore(); A.cc.fillStyle = `rgb(${VERM.join(',')})`; A.cc.fillRect(1480 + 300, 30, 48, 48);
    return comp(A, B, { paper: [0, 0, 1], bleed: 5, rim: .9 });
  }
  if (mode === 'studio') {
    const T = +(q.get('t') || 0);
    ST.desk(A.ink);
    WD.init(); const cam = { x: 960, y: 540, z: 1 };
    for (const k of ['far', 'mid', 'cliff', 'bank', 'cracks']) blit(A, WD.layers()[k], cam, 1, ST.SHEET.x, ST.SHEET.y, ST.PSCALE);
    ST.inkstone(A.ink, ST.INKSTONE.x, ST.INKSTONE.y, 1);
    ST.brush(A.ink, 300, 790, -.35, 1);
    ST.brushRest(A.ink, 230, 500, 1);
    ST.sealBox(A.ink, A.cc, ST.SEALBOX.x, ST.SEALBOX.y, 1);
    ST.incense(A.ink, A.cc, ST.INCENSE.x, ST.INCENSE.y, 1, { burn: +(q.get('burn') || .1), t: T });
    ST.painter(A.ink, 1000, 130, 1, { breath: Math.sin(T), lift: +(q.get('lift') || 0) });
    dragon(A, TMP, { a: 0, amp: 4, k: 1, legs: 1, ground: 15, expr: EXPR.curious }, { x: 760, y: 300, s: .5, dir: 1, t: T, seed: 3 });
    return comp(A, B, { paper: paperOf(cam), bleed: 5, rim: .9 });
  }
  if (mode === 'world') {
    WD.init(); const z = +(q.get('z') || .6), cam = { x: +(q.get('x') || 1500), y: +(q.get('y') || 1000), z };
    for (const k of ['far', 'mid', 'cliff', 'bank', 'cracks']) blit(A, WD.layers()[k], cam, 1, 0, 0, 1);
    A.xf(z, camXf(cam).tx, camXf(cam).ty); A.cc.setTransform(z, 0, 0, z, camXf(cam).tx, camXf(cam).ty);
    WD.figure(A.ink, WD.CHILD[0], WD.CHILD[1], 1, { armL: -1.3, armR: -1.3, bowlHand: 1, bowl: 0 }, 700);
    WD.figure(A.ink, WD.CHILD[0] - 120, WD.CHILD[1] + 10, 1, { armL: 2.2, armR: 1.2 }, 720);
    cloud(A, { x: WD.SUMMIT[0], y: WD.SUMMIT[1] - 160, r: 220, breath: 0, ink: +(q.get('ink') || 0), inkAt: [.2, -.3], expr: CEXPR.asleep, bubble: .8 }, { t: 0 });
    dragon(A, TMP, { a: -.1, amp: 9, k: 1.1, legs: 0 }, { x: 1600, y: 700, s: 2.2, dir: -1, t: 0, seed: 3 });
    if (q.get('rain')) WD.rain(A.ink, cam, 0, 1);
    if (q.get('water')) WD.water(A.ink, 0, 1);
    return comp(A, B, { paper: paperOf(cam), bleed: 5 * z, rim: .9 });
  }
  if (mode === 'cloud') {
    const T = +(q.get('t') || 0), ex = Object.keys(CEXPR);
    ex.forEach((k, i) => { const x = 260 + (i % 4) * 470, y = 280 + Math.floor(i / 4) * 480; cloud(A, { x, y, r: 150, breath: 0, ink: k === 'heavy' ? .7 : k === 'shocked' ? .3 : 0, inkAt: [.1, -.2], expr: CEXPR[k], bubble: k === 'asleep' ? .9 : 0, gust: k === 'blow' ? 1 : 0, drops: k === 'heavy' ? .8 : 0, tug: k === 'mumble' ? [180, 40, 1] : null }, { t: T }); label(A, k, x - 60, y + 230); });
    return comp(A, B, { paper: [0, 0, 1], bleed: 5, rim: .9 });
  }
  if (mode === 'glyphs') {   // every character of the film, large, for a visual tofu scan
    const cs = [...(q.get('chars') || '')]; const c = A.cd; c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#000'; c.globalAlpha = .9; c.font = '110px "Ma Shan Zheng"'; c.textBaseline = 'middle'; c.textAlign = 'center';
    cs.forEach((ch, i) => c.fillText(ch, 120 + (i % 14) * 130, 140 + Math.floor(i / 14) * 150)); c.font = '60px "Noto Serif SC"';
    cs.forEach((ch, i) => c.fillText(ch, 120 + (i % 14) * 130, 760 + Math.floor(i / 14) * 90)); c.restore();
    return comp(A, B, { paper: [0, 0, 1] });
  }
  if (mode === 'strip') {   // a few frames of one action, side by side
    const T0 = +(q.get('t') || 0);
    for (let i = 0; i < 6; i++) { const tt = T0 + i * .2; dragon(A, TMP, { a: -.1 + Math.sin(tt * 4) * .2, amp: 6, k: 1.1, ph: tt * 7, legs: 0 }, { x: 160 + i * 300, y: 400, s: 1.3, t: tt, seed: 3 }); label(A, tt.toFixed(1), 100 + i * 300, 560); }
    return comp(A, B, { paper: [0, 0, 1], bleed: 5, rim: .9 });
  }
  return comp(A, B, { paper: [0, 0, 1] });
}
