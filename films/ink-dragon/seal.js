// A vermilion 白文 seal reading 墨龙 (two characters, intaglio: the lines are knocked out of a slightly irregular red square, with ink-paste speckles).
// The seal-script forms are drawn by code: 墨 as a box with inner bars over a ground line, 龙 as a coiling line with a head hook.
import { vnoise, clamp, VERM } from './util.js';
export function seal(c, x, y, size, am = 1, seed = 3) {
  if (am <= 0) return;
  c.save(); c.translate(x, y);
  const S = size, jit = S * .02;
  c.beginPath();
  const N = 32;
  for (let i = 0; i < N; i++) {
    const t = i / N * 4, side = Math.floor(t), u = t - side;
    let px, py; if (side === 0) { px = u * S; py = 0; } else if (side === 1) { px = S; py = u * S; } else if (side === 2) { px = S - u * S; py = S; } else { px = 0; py = S - u * S; }
    px += (vnoise(seed + i * 1.3) - .5) * jit * 2; py += (vnoise(seed + 40 + i * 1.3) - .5) * jit * 2;
    i ? c.lineTo(px, py) : c.moveTo(px, py);
  }
  c.closePath(); c.fillStyle = `rgba(${VERM.join(',')},${clamp(am)})`; c.fill();
  c.globalCompositeOperation = 'destination-out';
  c.strokeStyle = '#000'; c.fillStyle = '#000'; c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = S * .07;
  const P = pts => { c.beginPath(); pts.forEach(([a, b], i) => { const X = a * S + (vnoise(seed + i * 2.1 + a * 9) - .5) * jit, Y = b * S + (vnoise(seed + 7 + i * 2.1 + b * 9) - .5) * jit; i ? c.lineTo(X, Y) : c.moveTo(X, Y); }); c.stroke(); };
  // 墨 (upper half): a box with two inner bars, four dots below, a ground line
  P([[.2, .1], [.44, .1], [.44, .3], [.2, .3], [.2, .1]]);
  P([[.2, .2], [.44, .2]]); P([[.32, .1], [.32, .36]]);
  P([[.14, .36], [.5, .36]]);
  for (const dx of [.17, .25, .33, .41]) P([[dx, .41], [dx + .02, .45]]);
  P([[.14, .49], [.5, .49]]); P([[.32, .45], [.32, .52]]);
  // 龙 (lower half, right): a coiling line with a hooked head and a tail
  P([[.58, .12], [.86, .12]]); P([[.74, .08], [.66, .3], [.58, .46]]);
  P([[.68, .3], [.68, .6], [.74, .72], [.86, .74], [.9, .62]]);
  P([[.8, .4], [.74, .52]]); P([[.84, .36], [.9, .46]]);
  // a frame line (seals often have an inner border)
  c.lineWidth = S * .035; P([[.08, .6], [.08, .92], [.92, .92], [.92, .82]]);
  for (let i = 0; i < 80; i++) { const a = vnoise(seed + i * 3.7), b = vnoise(seed + 91 + i * 2.9); c.globalAlpha = .5 + .5 * vnoise(i * 1.1); c.beginPath(); c.arc(a * S, b * S, S * (.004 + .012 * vnoise(i * 5.3)), 0, 7); c.fill(); }
  c.restore();
}
