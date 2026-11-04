// 愚公移山 · props, carved in their own space (grip at the origin, the tool pointing along +x)
//   tool(g, name, x, y, angle, scale, t, opts)  — draws at a point in the current canvas space
import * as WC from './engine/index.js';
import * as INK from './ink.js';
import { ap } from './rig.js';
import { mulberry } from '/core/lib.js';

const L = WC.light(.5, -.75, .3), PI = Math.PI;
const C = {};
const S = (k, polys, o) => C[k] || (C[k] = WC.shape(polys, { light: L, R: 10, sp: 4, lo: .45, halo: 4, ...o }));
function drawS(g, s, t, white = false) { WC.drawStrokes(g, s.halo, { t, color: '#fff' }); WC.fillPoly(g, s.polys, white ? '#fff' : '#000'); WC.drawStrokes(g, s.strokes, { t, color: white ? '#000' : '#fff' }); }
const handle = (len, r = 7, x0 = -30) => [[x0, -r], [len, -r * .9], [len + 4, 0], [len, r * .9], [x0, r], [x0 - 4, 0]];

// woven basket (畚): front view, w × h, opening up; fill = earth heap 0..1
function basketShape(k, w, h) {
  return S('bk' + k, [[[-w / 2, 0], [w / 2, 0], [w * .4, h], [-w * .4, h]]], { R: 12, sp: Math.max(3, w / 22), lo: .5, dir: 0, seed: 50 + w | 0 });
}
function drawBasket(g, w, h, fill = 0, t = 1e9, seed = 1) {
  const s = basketShape(w + 'x' + h, w, h);
  drawS(g, s, t);
  // weave: diagonal white cuts both ways, clipped to the basket
  g.save(); g.beginPath(); WC.pathOf(g, s.polys[0]); g.clip();
  const n = 6, lw = Math.max(1.4, w / 40);
  for (let i = -n; i <= n * 2; i++) { const x = -w / 2 + i * w / n; INK.taper(g, [[x, 0], [x + h * .6, h]], lw, '#fff', { a: .2, b: .2, spline: false, seed: i }); INK.taper(g, [[x, 0], [x - h * .6, h]], lw * .8, '#fff', { a: .2, b: .2, spline: false, seed: i + 40 }); }
  g.restore();
  INK.taper(g, [[-w / 2 - 2, 1], [w / 2 + 2, 1]], Math.max(3, w / 14), '#fff', { a: .05, b: .05, spline: false });   // rim
  if (fill > 0) {   // earth heaped above the rim: black mound with stab flecks
    const hh = h * .55 * fill, P = WC.spline([[-w * .48, 0], [-w * .25, -hh * .8], [0, -hh], [w * .28, -hh * .75], [w * .48, 0]], 3);
    INK.poly(g, P, '#000');
    const r = mulberry(seed); for (let i = 0; i < 14 * fill; i++) INK.blob(g, (r() - .5) * w * .7, -r() * hh * .7, 1.2 + r() * 2, 1 + r() * 1.5, '#fff', r() * 3);
  }
}
export function tool(g, name, x, y, ang = 0, k = 1, t = 1e9, o = {}) {
  g.save(); g.translate(x, y); g.rotate(ang); g.scale(k, k);
  if (name === 'hoe') {          // 锄: long handle, iron blade bent down at the far end
    drawS(g, S('hoeH', [handle(250)], { dir: 0, sp: 3, lo: .55 }), t);
    drawS(g, S('hoeB', [[[238, -10], [266, -14], [282, 62], [270, 84], [232, 80]]], { R: 14, sp: 4, lo: .4, dir: PI / 2, seed: 61 }), t);
  } else if (name === 'pick') {  // 镐: handle and a pointed double head
    drawS(g, S('pickH', [handle(240)], { dir: 0, sp: 3, lo: .55 }), t);
    drawS(g, S('pickB', [[[226, -10], [250, -12], [262, -70], [258, -96], [246, -60], [244, 0], [252, 60], [240, 100], [228, 50]]], { R: 10, sp: 4, lo: .4, dir: PI / 2, seed: 62 }), t);
  } else if (name === 'staff') {
    drawS(g, S('staff', [WC.spline([[-30, -7], [120, -9], [300, -6], [330, -10], [330, 8], [300, 7], [120, 8], [-30, 7]], 4, true)], { dir: 0, sp: 3, lo: .55 }), t);
  } else if (name === 'fan') {    // folded or open fan: o.open 0..1
    const op = o.open ?? 0, n = 9, R = 110, a0 = -PI / 2 - op * 1.1, a1 = -PI / 2 + op * 1.1;
    if (op < .1) drawS(g, S('fanC', [[[-6, -8], [R, -12], [R + 6, 0], [R, 12], [-6, 8]]], { dir: 0, sp: 3, lo: .45 }), t);
    else {
      const P = [[0, 0]]; for (let i = 0; i <= 24; i++) { const a = a0 + (a1 - a0) * i / 24; P.push([Math.cos(a + PI / 2) * R, Math.sin(a + PI / 2) * R]); }
      INK.poly(g, P, '#000');
      for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n + PI / 2; INK.taper(g, [[Math.cos(a) * 18, Math.sin(a) * 18], [Math.cos(a) * (R - 6), Math.sin(a) * (R - 6)]], 4, '#fff', { a: .1, b: .2, spline: false }); }
    }
  } else if (name === 'basket') { drawBasket(g, o.w ?? 110, o.h ?? 70, o.fill ?? 0, t, o.seed ?? 1); }
  g.restore();
}
// carrying pole across a shoulder point with two baskets hanging on ropes (swing = rope angle)
export function pole(g, x, y, ang, k = 1, t = 1e9, { swing = 0, fill = .8, span = 170, w = 92, h = 64, front = true } = {}) {
  g.save(); g.translate(x, y); g.rotate(ang); g.scale(k, k);
  for (const s of [-1, 1]) {
    const rx = s * span, rl = 120;
    g.save(); g.translate(rx, 0); g.rotate(-ang + swing * s * .3 + swing);
    INK.taper(g, [[-w * .38, rl], [0, 0], [w * .38, rl]], 3, '#fff', { a: .05, b: .05, spline: false });
    INK.taper(g, [[-w * .38, rl], [0, 0], [w * .38, rl]], 1.6, '#000', { a: .05, b: .05, spline: false });
    g.translate(0, rl); drawBasket(g, w, h, fill, t, s + 3);
    g.restore();
  }
  drawS(g, S('pole', [WC.spline([[-span - 20, -6], [0, -9], [span + 20, -6], [span + 20, 6], [0, 8], [-span - 20, 6]], 4, true)], { dir: 0, sp: 3, lo: .5 }), t);
  g.restore();
}
// grip point and drawing scale of a figure's near hand (from drawFig's `out`)
export function grip(out, which = 'hand') { const M = out[which], hr = out.hr ?? 50; return { x: ap(M, 0, 22)[0], y: ap(M, 0, 22)[1], k: Math.sqrt(Math.abs(M[0] * M[3] - M[1] * M[2])), a: Math.atan2(M[1], M[0]) }; }
export { drawBasket };
