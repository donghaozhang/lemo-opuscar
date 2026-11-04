// 愚公移山 · small vector helpers for features cut by hand (eyes, brows, mouths, strands)
import * as WC from './engine/index.js';
import { clamp, mulberry } from '/core/lib.js';

// tapered stroke along a polyline (or spline control points) → filled polygon
// w: width at middle; taper: [start, end] multipliers; col: '#000' (left wood) or '#fff' (cut)
export function taper(g, cp, w, col = '#000', { a = .25, b = .15, spline = true, chip = .08, seed = 1 } = {}) {
  const pts = spline && cp.length > 2 ? WC.spline(cp, 2) : WC.resample(cp, 2);
  const n = pts.length; if (n < 2) return;
  const L = [], R = [], rnd = mulberry(seed);
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1), i0 = Math.max(0, i - 1), i1 = Math.min(n - 1, i + 1);
    let tx = pts[i1][0] - pts[i0][0], ty = pts[i1][1] - pts[i0][1]; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
    const prof = Math.min(1, u / Math.max(.01, a) + .25 * (a > 0 ? 0 : 1)) ** .6 * Math.min(1, (1 - u) / Math.max(.01, b)) ** .7;
    const hw = .5 * w * Math.max(a <= 0 && u < .02 ? 1 : 0, prof) * (1 + chip * (rnd() - .5));
    L.push([pts[i][0] - ty * hw, pts[i][1] + tx * hw]); R.push([pts[i][0] + ty * hw, pts[i][1] - tx * hw]);
  }
  g.fillStyle = col; g.beginPath(); g.moveTo(...L[0]); for (const p of L.slice(1)) g.lineTo(...p); for (const p of R.reverse()) g.lineTo(...p); g.closePath(); g.fill();
}
export function blob(g, cx, cy, rx, ry, col = '#000', rot = 0) { g.fillStyle = col; g.beginPath(); g.ellipse(cx, cy, Math.max(.1, rx), Math.max(.1, ry), rot, 0, Math.PI * 2); g.fill(); }
export function poly(g, P, col = '#000') { g.fillStyle = col; g.beginPath(); WC.pathOf(g, P); g.fill(); }
// almond eye: centre, width, open (0..1), tilt, look (-1..1 x, -1..1 y), facing: 1 = profile right, 0 = front
// draws sclera white, iris+pupil black, a white catchlight, a heavy black upper lid and a thin lower lid
export function eye(g, x, y, w, { open = 1, tilt = 0, lookX = 0, lookY = 0, prof = 0, lid = 1, white = '#fff', ink = '#000', lower = true, iris = .46 } = {}) {
  g.save(); g.translate(x, y); g.rotate(tilt);
  const hw = w / 2, ht = w * .3 * open;
  const up = prof ? [[-hw * .2, 0], [hw * .3, -ht * 1.1], [hw, -ht * .1]] : [[-hw, 0], [0, -ht * 1.25], [hw, 0]];
  const lo = prof ? [[hw, -ht * .1], [hw * .3, ht * .7], [-hw * .2, 0]] : [[hw, 0], [0, ht * .9], [-hw, 0]];
  if (open > .08) {
    // sclera (cut white)
    g.beginPath(); g.moveTo(...up[0]); g.quadraticCurveTo(up[1][0] * 1, up[1][1] * 1.25 - (prof ? 0 : ht * .25), up[2][0], up[2][1]); g.quadraticCurveTo(lo[1][0], lo[1][1] * 1.2, lo[2][0], lo[2][1]); g.closePath();
    g.fillStyle = white; g.fill();
    g.save(); g.clip();
    const ir = w * iris * .5 * (prof ? .8 : 1), ix = (prof ? hw * .35 : 0) + lookX * hw * .45, iy = lookY * ht * .5 + ht * .05;
    g.fillStyle = ink; g.beginPath(); g.arc(ix, iy, ir, 0, Math.PI * 2); g.fill();
    g.fillStyle = white; g.beginPath(); g.arc(ix + ir * .32, iy - ir * .34, ir * .26, 0, Math.PI * 2); g.fill();
    g.restore();
  }
  // upper lid: heavy black line (thicker in the middle-outer part)
  const lw = Math.max(1.6, w * .11 * lid);
  taper(g, [[up[0][0] - w * .04, up[0][1] + w * .02], [up[1][0], up[1][1] - (open > .08 ? lw * .2 : -ht * .2)], [up[2][0] + w * .06, up[2][1] + w * .02]], lw, ink, { a: .2, b: .25 });
  if (lower && open > .08) taper(g, [[lo[0][0], lo[0][1]], [lo[1][0], lo[1][1] + lw * .4], [lo[2][0], lo[2][1]]], lw * .45, ink, { a: .3, b: .3 });
  g.restore();
}
