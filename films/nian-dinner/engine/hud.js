// Banners (横批 strips carrying the storyteller's lines), cut-letter CJK titles, ink credits
import { PAL, canvas, piece, fill, trace, finishPaper, Pl, rnd } from './paper.js';
import { rosette, sawRow } from './motifs.js';
import { put } from './rig.js';

export const BANNER_COL = '#8f1016';      // darker than the picture's reds so cream text holds
export const CREAM = '#fff1d6';
// cut-letter text piece (yang cut: the glyph is the paper, counters are real holes)
const TXT = {};
export function textPiece(s, size, col = PAL.red, font = 'Ma Shan Zheng', wt = 400, seed = 3, ls = 0) {
  const key = [s, size, wt, col, font, ls].join('|'); if (TXT[key]) return TXT[key];
  const [m, mg] = canvas(10, 10); mg.font = `${wt} ${size}px "${font}"`; if (ls) mg.letterSpacing = ls + 'px';
  const w = Math.ceil(mg.measureText(s).width) + 24, h = Math.ceil(size * 1.3), K = 2;
  const [c, g] = canvas(w * K, h * K); g.scale(K, K); g.font = `${wt} ${size}px "${font}"`; if (ls) g.letterSpacing = ls + 'px';
  g.fillStyle = col; g.textBaseline = 'alphabetic'; g.fillText(s, 12, size * 1.0);
  finishPaper(c, g, { seed, edge: 1.4 });
  return TXT[key] = { c, x0: 0, y0: 0, w, h, K };
}
// banner strip with the text printed in cream: serrated top and bottom, swallow-tail ends, a small rosette at each end
const SUBS = {};
export function banner(text, size = 44, font = 'Noto Serif SC') {
  const key = text + size; if (SUBS[key]) return SUBS[key];
  const [m, mg] = canvas(10, 10); mg.font = `700 ${size}px "${font}"`;
  const tw = mg.measureText(text).width, w = Math.ceil(tw + 190), h = Math.round(size * 1.75), K = 1.5;
  const [c, g] = canvas(w * K, h * K); g.scale(K, K);
  const poly = []; for (let x = 0; x <= w; x += 10) poly.push([x, 4 + (x / 10 % 2) * 3]);
  poly.push([w - 24, h / 2]); for (let x = w; x >= 0; x -= 10) poly.push([x, h - 4 - (x / 10 % 2) * 3]); poly.push([24, h / 2]);
  g.beginPath(); trace(g, Pl(poly, true, .3, 5)); g.fillStyle = BANNER_COL; g.fill();
  for (let k = 0; k < 40; k++) { g.fillStyle = `rgba(222,178,84,${.2 + rnd(k, 3) * .3})`; g.beginPath(); g.arc(34 + rnd(k, 1) * (w - 68), 10 + rnd(k, 2) * (h - 20), .8 + rnd(k, 4) * 1.3, 0, 7); g.fill(); }
  rosette(g, 58, h / 2, 13, 6, 0, .25); rosette(g, w - 58, h / 2, 13, 6, .5, .25);
  finishPaper(c, g, { seed: 9, edge: 1 });
  g.setTransform(K, 0, 0, K, 0, 0); g.font = `700 ${size}px "${font}"`; g.fillStyle = CREAM; g.textBaseline = 'middle'; g.textAlign = 'center';
  g.fillText(text, w / 2, h / 2 + 2);
  return SUBS[key] = { c, w, h };
}
// draw the banners active at t: drop in on two 12 fps steps like a couplet being pasted; returns the boxes for TEXTS
export function drawBanners(g, t, cues, opt = {}) {
  const out = [];
  for (const q of cues) {
    if (t < q.t0 || t > q.t1) continue;
    const s = banner(q.text), u = Math.floor((t - q.t0) * 12) / 12, drop = u < .08 ? -16 : u < .16 ? -5 : 0, a = Math.min(1, (q.t1 - t) / .15);
    const x = 960 - s.w / 2, y = (opt.y ?? 1080 - 76) - s.h + drop;
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = Math.max(0, a);
    g.shadowColor = 'rgba(30,4,8,.5)'; g.shadowBlur = 8; g.shadowOffsetX = 3; g.shadowOffsetY = 5;
    g.drawImage(s.c, x, y, s.w, s.h); g.restore();
    out.push({ id: q.id, text: q.text, x0: x, y0: y, x1: x + s.w, y1: y + s.h });
  }
  return out;
}
// sawtooth border strip (for titles)
export function strip(w, seed = 21, col = PAL.red, h = 40) {
  return piece([0, 0, w, h], q => { const pts = []; for (let x = 0; x <= w; x += 14) pts.push([x, 6 + (x / 14 % 2) * 8]); pts.push([w, h - 6]); for (let x = w; x >= 0; x -= 14) pts.push([x, h - 6]); fill(q, qq => trace(qq, pts), col); for (let x = 30; x < w - 20; x += 60) rosette(q, x, h * .6, 7, 5, 0, .25); }, { ss: 1.5, seed, col });
}
// seal: a red square with a character cut out of it
const SEALS = {};
export function seal(ch, size = 110, seed = 23) {
  const key = ch + size; if (SEALS[key]) return SEALS[key];
  return SEALS[key] = piece([0, 0, size, size], q => { fill(q, qq => trace(qq, Pl([[0, 0], [size, 0], [size, size], [0, size]], true, .6, seed)), PAL.red); q.save(); q.globalCompositeOperation = 'destination-out'; q.font = `400 ${size * .74}px "Ma Shan Zheng"`; q.textAlign = 'center'; q.fillText(ch, size / 2, size * .78); q.restore(); }, { ss: 2, seed });
}
export function ink(g, s, x, y, size = 26, col = '#4a1a10', align = 'center', font = 'Noto Serif SC', wt = 700) {
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.font = `${wt} ${size}px "${font}"`; g.fillStyle = col; g.textAlign = align; g.textBaseline = 'alphabetic'; g.fillText(s, x, y); g.restore();
}
