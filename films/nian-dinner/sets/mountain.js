// The mountain: three ridges with pine sawtooth, a zigzag road cut into the near ridge, snow caps; the bus (red paper, windows are holes, headlights emissive)
import { PAL, piece, P, Pl, trace, fill, cut, cutTaper, inset, within, ellipsePoly, curve, rnd } from '../engine/paper.js';
import { sawRow, sawEdge, crescent, crescentRows, swirl, rosette, plum, coin, dots, taper, along, cloudCut } from '../engine/motifs.js';
import { mul, T, R, S, put } from '../engine/rig.js';
import { NIGHT } from './village.js';

const M = {};
// a ridge: y(x) profile with pines (triangle sawtooth) along the top; snow cap as a white band under the ridge line
export function ridgeProfile(w, seed, hs, base) {
  return x => { const u = x / w; return base - (120 + 120 * Math.sin(u * 5.3 + seed) + 60 * Math.sin(u * 13.7 + seed * 2) + 30 * Math.sin(u * 27 + seed)) * hs; };
}
export function ridgePiece(opt = {}) {
  const w = opt.w || 5000, col = opt.col || NIGHT.mid, seed = opt.seed || 61, hs = opt.hs || 1, pines = opt.pines ?? true;
  const prof = ridgeProfile(w, seed, hs, 0);
  const p = piece([-w / 2, -520 * hs, w / 2, 60], g => {
    const top = []; for (let x = -w / 2; x <= w / 2; x += 18) top.push([x, prof(x)]);
    // pines: tall thin triangles along the ridge
    const out = pines ? sawEdge(top, 34 * hs, 26, 1, .8, seed) : top;
    fill(g, q => trace(q, [...out, [w / 2, 60], [-w / 2, 60]]), col);
    // snow line under the ridge (a carved band) and cloud cuts on the slope
    cutTaper(g, top.map(([x, y]) => [x, y + 30 * hs]), 3);
    for (let k = 0; k < 12; k++) { const x = -w / 2 + (k + .5) * w / 12 + (rnd(k, seed) - .5) * 160, y = prof(x) + 90 * hs + rnd(k, seed + 1) * 100 * hs; cloudCut(g, x, y, 22 * hs, 3, rnd(k, seed + 2) * 6, k % 2 ? 1 : -1); }
  }, { seed, col, ss: opt.ss || 1 });
  p.prof = prof;
  // snow cap: white band along the ridge
  p.snow = piece([-w / 2, -540 * hs, w / 2, 0], g => {
    const top = [], bot = []; for (let x = -w / 2; x <= w / 2; x += 18) { top.push([x, prof(x) - 4]); bot.push([x, prof(x) + 22 * hs + 10 * Math.sin(x * .02 + seed)]); }
    fill(g, q => trace(q, [...top, ...bot.reverse()]), NIGHT.roofSnow);
  }, { seed: seed + 1, col: NIGHT.roofSnow, ss: 1, edge: .6 });
  return p;
}
// the road: a lighter paper band that zigzags up the near ridge; returns the piece and a function giving the road centre line (parametric u 0..1, from bottom-left to the top)
export function roadPiece(opt = {}) {
  const pts = opt.pts || [[-2200, 420], [-1500, 300], [-900, 240], [-300, 120], [300, 60], [900, -60], [1500, -150], [2100, -200]];
  const c = curve(pts, false, 6);
  const L = [0]; for (let i = 1; i < c.length; i++) L.push(L[i - 1] + Math.hypot(c[i][0] - c[i - 1][0], c[i][1] - c[i - 1][1]));
  const at = u => { const s = Math.max(0, Math.min(1, u)) * L[L.length - 1]; let i = 0; while (i < L.length - 2 && L[i + 1] < s) i++; const f = (s - L[i]) / (L[i + 1] - L[i] || 1); const a = c[i], b = c[i + 1]; return { x: a[0] + (b[0] - a[0]) * f, y: a[1] + (b[1] - a[1]) * f, ang: Math.atan2(b[1] - a[1], b[0] - a[0]) }; };
  const p = piece([-2300, -300, 2300, 520], g => {
    const Lp = [], Rp = []; for (let i = 0; i < c.length; i++) { const a = c[Math.max(0, i - 1)], b = c[Math.min(c.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, w = 46; Lp.push([c[i][0] - dy / l * w, c[i][1] + dx / l * w]); Rp.push([c[i][0] + dy / l * w, c[i][1] - dx / l * w]); }
    fill(g, q => trace(q, P([...Lp, ...Rp.reverse()], true, .6, 7)), opt.col || '#9aa6cf');
    // tyre tracks: two dashed carved lines
    for (const off of [-14, 14]) { const pts2 = c.map((pt, i) => { const a = c[Math.max(0, i - 1)], b = c[Math.min(c.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [pt[0] - dy / l * off, pt[1] + dx / l * off]; }); for (let i = 0; i < pts2.length - 6; i += 12) cutTaper(g, pts2.slice(i, i + 6), 3); }
    // snow banks: sawtooth along both edges
    sawRow(g, Lp, 10, 14, 1, .7); sawRow(g, Rp, 10, 14, -1, .7);
  }, { seed: 8, col: opt.col || '#9aa6cf', ss: 1, edge: .7 });
  p.at = at; p.len = L[L.length - 1];
  return p;
}
// the bus: red paper, profile facing right (uphill). origin = centre of the body bottom (axle line). Windows are holes; headlight is a hole too (lit by the emissive pass)
export function busPiece(col = '#c8102e', seed = 151) {
  const p = piece([-240, -170, 240, 50], g => {
    const body = Pl([[-220, -150], [180, -150], [214, -130], [228, -80], [226, -10], [200, 6], [-200, 6], [-224, -14], [-226, -110]], true, .5, seed);
    fill(g, q => trace(q, body), col);
    inset(g, body, 5, 2.2, col);
    // windows (holes) with a thin frame line left, the windscreen at the front
    for (let i = 0; i < 4; i++) cut(g, q => q.rect(-196 + i * 86, -134, 70, 56));
    cut(g, q => { q.moveTo(160, -134); q.lineTo(196, -134); q.lineTo(214, -90); q.lineTo(214, -76); q.lineTo(160, -76); q.closePath(); });
    // door
    cut(g, q => { q.rect(104, -70, 44, 70); q.rect(108, -66, 36, 66); }, 'evenodd'); cutTaper(g, [[126, -66], [126, -4]], 2.4);
    // headlight (hole) and bumper line, a plum on the side, crescent rows along the skirt
    cut(g, q => q.arc(214, -40, 14, 0, 7));
    cutTaper(g, [[-200, -8], [200, -8]], 3);
    within(g, body, () => crescentRows(g, -200, -62, 100, -16, 10, 3.5, 0, .7));
    plum(g, -140, -40, 12); rosette(g, 0, -40, 14, 6, 0, .25);
    // roof rack sawtooth
    sawRow(g, [[-200, -154], [180, -154]], 10, 10, -1, .7);
    // wheel arches (holes the wheels sit in)
    cut(g, q => { q.arc(-150, 6, 40, Math.PI, 0); q.closePath(); }); cut(g, q => { q.arc(130, 6, 40, Math.PI, 0); q.closePath(); });
  }, { seed, col, ss: 2 });
  p.wheel = piece([-44, -44, 44, 44], g => { fill(g, q => q.arc(0, 0, 40, 0, 7), '#8a0c20'); cut(g, q => { q.arc(0, 0, 32, 0, 7); q.arc(0, 0, 26, 0, 7, true); }, 'evenodd'); for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; cutTaper(g, [[Math.cos(a) * 8, Math.sin(a) * 8], [Math.cos(a) * 24, Math.sin(a) * 24]], 5); } cut(g, q => q.arc(0, 0, 4, 0, 7)); }, { seed: seed + 1, col: '#8a0c20', ss: 2 });
  p.axles = [[-150, 6], [130, 6]];
  p.lamp = [214, -40]; p.wins = [0, 1, 2, 3].map(i => [-196 + i * 86 + 35, -106]); p.wins.push([188, -105]);
  return p;
}
export function mountainKit() {
  if (M.far) return M;
  M.far = ridgePiece({ w: 6000, col: NIGHT.far, seed: 61, hs: 1.4, pines: false });
  M.mid = ridgePiece({ w: 6000, col: NIGHT.mid, seed: 64, hs: 1.1 });
  M.near = ridgePiece({ w: 6000, col: '#232d60', seed: 67, hs: .8 });
  M.road = roadPiece({});
  M.bus = busPiece();
  return M;
}
