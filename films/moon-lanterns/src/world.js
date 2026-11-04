// Paper motifs in metre space (origin where the caller puts it, y up). Each draws with the context's current fillStyle (the sheet colour);
// holes are cut with cut(). Functions that have lit holes also take a glow context, or return the hole geometry for the glow map.
import { mulberry, TAU, clamp, lerp, vnoise } from '/core/lib.js';
import { cut, piece, text } from './paper.js';

const arcs = (x, x0, x1, y, r, dir = 1) => { for (let u = x0; u < x1; u += r * 1.7) { x.moveTo(u, y); x.arc(u + r * .85, y, r * .85, Math.PI, 0, dir < 0); } };

// —— the sea: a band whose top edge is scalloped by waves; wave slits cut into it ——
export function sea(x, o) {
  const { x0, x1, top, depth = .1, r = .006, seed = 1, rows = 3 } = o, R = mulberry(seed);
  x.beginPath(); x.moveTo(x0, top - depth); x.lineTo(x0, top);
  for (let u = x0; u < x1; u += r * 1.7) { x.lineTo(u, top); x.quadraticCurveTo(u + r * .85, top + r * .55, u + r * 1.7, top); }
  x.lineTo(x1, top - depth); x.closePath(); x.fill();
  cut(x, () => {
    x.lineWidth = r * .18; x.lineCap = 'round';
    for (let k = 1; k <= rows; k++) {
      const y = top - k * depth / (rows + 1) * .8, off = R() * r * 2, rr = r * (1 - k * .15);
      for (let u = x0 + off; u < x1; u += rr * 2.4 + R() * rr) { if (R() < .25) continue; x.beginPath(); x.arc(u, y, rr * .8, Math.PI * 1.05, Math.PI * 1.95); x.stroke(); }
    }
  });
}
// —— rocky coast: a jagged profile; strata slits cut ——
export function rocks(x, o) {
  const { x0, x1, base, h, seed = 2, jag = 1, prof } = o, R = mulberry(seed);
  const f = u => { if (prof) return prof(u); const n = (u - x0) / (x1 - x0); return h * (.55 + .45 * Math.sin(n * 5.3 + seed) * Math.sin(n * 2.1)) + h * .12 * jag * Math.sin(n * 41 + seed * 3) + h * .06 * jag * Math.sin(n * 97); };
  x.beginPath(); x.moveTo(x0, base - .3);
  for (let u = x0; u <= x1 + 1e-6; u += (x1 - x0) / 220) x.lineTo(u, base + Math.max(0, f(u)));
  x.lineTo(x1, base - .3); x.closePath(); x.fill();
  cut(x, () => {
    x.lineWidth = h * .012; x.lineCap = 'round';
    for (let i = 0; i < 26; i++) { const u = x0 + R() * (x1 - x0), w = (x1 - x0) * (.02 + R() * .06), y = base + R() * f(u) * .85; if (y < base + h * .05) continue; x.beginPath(); x.moveTo(u, y); x.quadraticCurveTo(u + w / 2, y + h * .01 * (R() - .5), u + w, y - h * .01 * R()); x.stroke(); }
  });
}
// —— hills: soft rolling profile ——
export function hills(x, o) {
  const { x0, x1, base, list, seed = 3 } = o;
  const f = u => { let y = 0; for (const [cx, hh, w] of list) { const d = Math.abs(u - cx) / w; y = Math.max(y, hh * Math.max(0, 1 - d * d)); } return y; };
  x.beginPath(); x.moveTo(x0, base - .3);
  for (let u = x0; u <= x1 + 1e-6; u += (x1 - x0) / 300) x.lineTo(u, base + f(u) + .0006 * Math.sin(u * 300 + seed));
  x.lineTo(x1, base - .3); x.closePath(); x.fill();
}
// —— a house of the village: stone walls, a tiled roof with upturned eaves, lattice windows (returned for the glow map) ——
export function house(x, o) {
  const { cx, base, w, h, win = 2, door = false, seed = 4, flip = false } = o, R = mulberry(seed), x0 = cx - w / 2, x1 = cx + w / 2, holes = [];
  // wall
  x.fillRect(x0, base, w, h);
  // roof: a slab with a curved ridge and eaves that lift at the ends
  const eave = w * .09, ry = base + h, rh = h * .42;
  x.beginPath(); x.moveTo(x0 - eave, ry + rh * .12); x.quadraticCurveTo(x0, ry - .0005, x0 + w * .12, ry);
  x.lineTo(x1 - w * .12, ry); x.quadraticCurveTo(x1, ry - .0005, x1 + eave, ry + rh * .12);
  x.quadraticCurveTo(x1 - w * .2, ry + rh * .5, cx + w * .2, ry + rh); x.lineTo(cx - w * .2, ry + rh); x.quadraticCurveTo(x0 + w * .2, ry + rh * .5, x0 - eave, ry + rh * .12); x.closePath(); x.fill();
  // tile courses cut as fine slits
  cut(x, () => { x.lineWidth = h * .012; for (let k = 1; k < 4; k++) { const yy = ry + rh * k / 4.5; x.beginPath(); x.moveTo(x0 - eave * (1 - k / 4) + w * .05, yy); x.lineTo(x1 + eave * (1 - k / 4) - w * .05, yy); x.stroke(); } });
  // windows: a hole with a thin cross of paper left
  const ww = w * .18, wh = h * .3, wy = base + h * .42;
  const xs = win === 1 ? [cx] : win === 2 ? [cx - w * .22, cx + w * .22] : [cx - w * .3, cx, cx + w * .3];
  if (door) xs.splice(win === 2 ? 1 : 0, 0, null);
  for (const wx of xs) {
    if (wx === null) { const dw = w * .17, dh = h * .55; cut(x, () => { x.beginPath(); x.rect(cx - dw / 2, base, dw, dh); x.fill(); }); holes.push({ k: 'door', x: cx - dw / 2, y: base, w: dw, h: dh }); continue; }
    cut(x, () => { x.beginPath(); x.rect(wx - ww / 2, wy, ww, wh); x.fill(); });
    x.fillRect(wx - ww * .04, wy, ww * .08, wh); x.fillRect(wx - ww / 2, wy + wh * .47, ww, wh * .07);
    holes.push({ k: 'win', x: wx - ww / 2, y: wy, w: ww, h: wh });
  }
  // stones cut into the wall
  cut(x, () => { x.lineWidth = h * .01; for (let i = 0; i < 7; i++) { const sx = x0 + w * .06 + R() * w * .8, sy = base + h * .05 + R() * h * .3, sw = w * (.05 + R() * .1); x.beginPath(); x.moveTo(sx, sy); x.lineTo(sx + sw, sy); x.stroke(); } });
  return holes;
}
// the glow of a house's holes
export function houseGlow(g, holes, col = '#ffb862', k = 1) {
  g.fillStyle = col; for (const h of holes) { if (h.k === 'win') g.fillRect(h.x, h.y, h.w, h.h); else { g.fillStyle = '#ff9a50'; g.fillRect(h.x, h.y, h.w, h.h); g.fillStyle = col; } }
}
// —— the lighthouse: tapering tower, gallery, lamp-room, dome; slit windows up the tower (returned) ——
export function lighthouse(x, o) {
  const { cx, base, h, wb = h * .22, wt = h * .15, slits = 4 } = o, out = { slits: [], lamp: null };
  const gy = base + h * .78, lh = h * .12;   // gallery height, lamp-room height
  x.beginPath(); x.moveTo(cx - wb / 2, base); x.lineTo(cx + wb / 2, base); x.lineTo(cx + wt / 2, gy); x.lineTo(cx - wt / 2, gy); x.closePath(); x.fill();
  // bands
  cut(x, () => { x.lineWidth = h * .006; for (let k = 1; k <= 3; k++) { const yy = base + h * .78 * k / 4, ww = lerp(wb, wt, k / 4); x.beginPath(); x.moveTo(cx - ww / 2 + h * .005, yy); x.lineTo(cx + ww / 2 - h * .005, yy); x.stroke(); } });
  // gallery: a wider slab and railing posts
  const gw = wt * 1.7; x.fillRect(cx - gw / 2, gy, gw, h * .025);
  for (let i = 0; i <= 6; i++) { const px = cx - gw / 2 + gw * i / 6; x.fillRect(px - h * .003, gy + h * .025, h * .006, h * .05); }
  x.fillRect(cx - gw / 2, gy + h * .07, gw, h * .006);
  // lamp room: a drum with panes cut out (the dead lamp: a cold glass cylinder inside, drawn as paper left in the middle)
  const lw = wt * 1.15, ly = gy + h * .025;
  x.fillRect(cx - lw / 2, ly, lw, lh);
  cut(x, () => { for (let i = 0; i < 3; i++) { const px = cx - lw / 2 + lw * (.08 + i * .31), pw = lw * .22; x.beginPath(); x.rect(px, ly + lh * .12, pw, lh * .76); x.fill(); } });
  out.lamp = { x: cx - lw / 2, y: ly, w: lw, h: lh, panes: [0, 1, 2].map(i => ({ x: cx - lw / 2 + lw * (.08 + i * .31), y: ly + lh * .12, w: lw * .22, h: lh * .76 })) };
  // dome and finial
  x.beginPath(); x.moveTo(cx - lw / 2 - h * .01, ly + lh); x.quadraticCurveTo(cx, ly + lh + h * .11, cx + lw / 2 + h * .01, ly + lh); x.closePath(); x.fill();
  x.fillRect(cx - h * .004, ly + lh + h * .05, h * .008, h * .05);
  // slit windows up the tower
  for (let i = 0; i < slits; i++) { const yy = base + h * .12 + i * h * .16, ww = lerp(wb, wt, (yy - base) / (gy - base)); const sx = cx + ww * .06, sw = h * .018, sh = h * .05; cut(x, () => { x.beginPath(); x.roundRect(sx - sw / 2, yy, sw, sh, sw * .5); x.fill(); }); out.slits.push({ x: sx - sw / 2, y: yy, w: sw, h: sh }); }
  // door
  const dw = wb * .3, dh = h * .09; cut(x, () => { x.beginPath(); x.roundRect(cx - dw / 2, base, dw, dh, [0, 0, dw / 2, dw / 2]); x.fill(); }); out.door = { x: cx - dw / 2, y: base, w: dw, h: dh };
  return out;
}
// —— a fishing boat (profile), wheelhouse with a window; mast ——
export function boat(x, o) {
  const { cx, y, L, flip = false } = o, s = flip ? -1 : 1, H = L * .22;
  const X = u => cx + u * s;
  x.beginPath(); x.moveTo(X(-L / 2), y + H * .9); x.quadraticCurveTo(X(-L * .45), y + H * .2, X(-L * .3), y); x.lineTo(X(L * .35), y); x.quadraticCurveTo(X(L * .5), y + H * .1, X(L * .52), y + H * 1.05); x.lineTo(X(L * .3), y + H * .85); x.lineTo(X(-L * .3), y + H * .85); x.closePath(); x.fill();
  // wheelhouse
  const wx = X(L * .05), ww = L * .22, wh = H * 1.1; x.beginPath(); x.roundRect(Math.min(wx, wx + ww * s), y + H * .8, ww, wh, [H * .1]); x.fill();
  const win = { x: Math.min(wx, wx + ww * s) + ww * .15, y: y + H * 1.1, w: ww * .7, h: wh * .5 };
  cut(x, () => { x.beginPath(); x.rect(win.x, win.y, win.w, win.h); x.fill(); });
  // mast and a lamp at the top
  x.fillRect(X(-L * .12) - L * .006, y + H * .8, L * .012, H * 2.2);
  const lamp = { x: X(-L * .12), y: y + H * 3.0, r: L * .02 };
  cut(x, () => { x.beginPath(); x.arc(lamp.x, lamp.y, lamp.r, 0, TAU); x.fill(); });
  x.beginPath(); x.arc(lamp.x, lamp.y, lamp.r * 1.4, 0, TAU); x.fill(); cut(x, () => { x.beginPath(); x.arc(lamp.x, lamp.y, lamp.r, 0, TAU); x.fill(); });
  // hull planks cut
  cut(x, () => { x.lineWidth = H * .05; for (const k of [.3, .55]) { x.beginPath(); x.moveTo(X(-L * .4), y + H * k); x.lineTo(X(L * .42), y + H * k); x.stroke(); } });
  return { win, lamp };
}
// —— festival lanterns: a dark paper frame with the lit body cut out; kinds: lotus, fish, star, carp, round. r = size (m). Returns a glow draw fn ——
export function lantern(x, kind, r, o = {}) {
  const col = o.col || '#ffb862';
  const body = p => { x.save(); x.beginPath(); p(); x.fill(); x.restore(); };
  const shapes = {
    round: () => { x.beginPath(); x.ellipse(0, 0, r, r * .85, 0, 0, TAU); x.fill(); x.fillRect(-r * .35, r * .8, r * .7, r * .18); x.fillRect(-r * .35, -r * .98, r * .7, r * .18); cut(x, () => { x.beginPath(); x.ellipse(0, 0, r * .86, r * .72, 0, 0, TAU); x.fill(); }); x.fillRect(-r * .04, -r * .75, r * .08, r * 1.5); for (const k of [-.5, .5]) { x.beginPath(); x.ellipse(k * r, 0, r * .05, r * .72, 0, 0, TAU); x.fill(); } },
    lotus: () => { x.beginPath(); for (let i = 0; i < 7; i++) { const a = -Math.PI * .1 + i * Math.PI * 1.2 / 6 - Math.PI * .5 - Math.PI * .1, px = Math.cos(a + Math.PI * .5) * r * .9, py = -r * .3 + Math.sin(a + Math.PI * .5) * r * .55; x.moveTo(0, -r * .5); x.quadraticCurveTo(px - r * .15, py + r * .5, px, py + r * .9); x.quadraticCurveTo(px + r * .15, py + r * .5, 0, -r * .5); } x.fill(); x.beginPath(); x.ellipse(0, -r * .45, r, r * .35, 0, 0, TAU); x.fill(); cut(x, () => { for (let i = 0; i < 7; i++) { const a = i * Math.PI * 1.2 / 6 - Math.PI * .6 + Math.PI * .5, px = Math.cos(a) * r * .9, py = -r * .3 + Math.sin(a) * r * .55; x.beginPath(); x.moveTo(0, -r * .4); x.quadraticCurveTo(px - r * .08, py + r * .5, px * .95, py + r * .78); x.quadraticCurveTo(px + r * .08, py + r * .5, 0, -r * .4); x.fill(); } }); },
    fish: () => { x.beginPath(); x.ellipse(0, 0, r * 1.2, r * .6, 0, 0, TAU); x.fill(); x.beginPath(); x.moveTo(r * 1.0, 0); x.lineTo(r * 1.6, r * .5); x.lineTo(r * 1.5, 0); x.lineTo(r * 1.6, -r * .5); x.closePath(); x.fill(); cut(x, () => { x.beginPath(); x.ellipse(-r * .1, 0, r * .95, r * .45, 0, 0, TAU); x.fill(); x.beginPath(); x.moveTo(r * 1.08, 0); x.lineTo(r * 1.45, r * .35); x.lineTo(r * 1.4, 0); x.lineTo(r * 1.45, -r * .35); x.closePath(); x.fill(); }); x.beginPath(); x.arc(-r * .6, r * .12, r * .09, 0, TAU); x.fill(); for (let i = 0; i < 3; i++) { x.beginPath(); x.arc(-r * .1 + i * r * .3, 0, r * .3, Math.PI * .3, Math.PI * .7); x.lineWidth = r * .06; x.stroke(); } },
    star: () => { x.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .45 : r * 1.05; x.lineTo(Math.cos(a) * rr, -Math.sin(a) * rr); } x.closePath(); x.fill(); cut(x, () => { x.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .34 : r * .88; x.lineTo(Math.cos(a) * rr, -Math.sin(a) * rr); } x.closePath(); x.fill(); }); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * TAU / 5; x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.cos(a) * r * .85, -Math.sin(a) * r * .85); x.lineWidth = r * .05; x.stroke(); } },
    carp: () => { x.beginPath(); x.moveTo(-r * 1.1, 0); x.quadraticCurveTo(-r * .6, r * .75, r * .3, r * .55); x.quadraticCurveTo(r * .9, r * .35, r * 1.3, r * .7); x.lineTo(r * 1.15, 0); x.lineTo(r * 1.3, -r * .7); x.quadraticCurveTo(r * .9, -r * .35, r * .3, -r * .55); x.quadraticCurveTo(-r * .6, -r * .75, -r * 1.1, 0); x.closePath(); x.fill(); cut(x, () => { x.beginPath(); x.moveTo(-r * .95, 0); x.quadraticCurveTo(-r * .55, r * .58, r * .3, r * .4); x.quadraticCurveTo(r * .85, r * .2, r * 1.12, r * .45); x.lineTo(r * 1.0, 0); x.lineTo(r * 1.12, -r * .45); x.quadraticCurveTo(r * .85, -r * .2, r * .3, -r * .4); x.quadraticCurveTo(-r * .55, -r * .58, -r * .95, 0); x.closePath(); x.fill(); }); x.beginPath(); x.arc(-r * .62, r * .1, r * .1, 0, TAU); x.fill(); x.lineWidth = r * .05; for (let i = 0; i < 4; i++) { x.beginPath(); x.arc(-r * .3 + i * r * .28, 0, r * .25, Math.PI * .25, Math.PI * .75); x.stroke(); x.beginPath(); x.arc(-r * .3 + i * r * .28, 0, r * .25, -Math.PI * .75, -Math.PI * .25); x.stroke(); } },
  };
  (shapes[kind] || shapes.round)();
  const glows = {
    round: g => { g.beginPath(); g.ellipse(0, 0, r * .86, r * .72, 0, 0, TAU); g.fill(); },
    lotus: g => { for (let i = 0; i < 7; i++) { const a = i * Math.PI * 1.2 / 6 - Math.PI * .6 + Math.PI * .5, px = Math.cos(a) * r * .9, py = -r * .3 + Math.sin(a) * r * .55; g.beginPath(); g.moveTo(0, -r * .4); g.quadraticCurveTo(px - r * .08, py + r * .5, px * .95, py + r * .78); g.quadraticCurveTo(px + r * .08, py + r * .5, 0, -r * .4); g.fill(); } },
    fish: g => { g.beginPath(); g.ellipse(-r * .1, 0, r * .95, r * .45, 0, 0, TAU); g.fill(); g.beginPath(); g.moveTo(r * 1.08, 0); g.lineTo(r * 1.45, r * .35); g.lineTo(r * 1.4, 0); g.lineTo(r * 1.45, -r * .35); g.closePath(); g.fill(); },
    star: g => { g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .34 : r * .88; g.lineTo(Math.cos(a) * rr, -Math.sin(a) * rr); } g.closePath(); g.fill(); },
    carp: g => { g.beginPath(); g.moveTo(-r * .95, 0); g.quadraticCurveTo(-r * .55, r * .58, r * .3, r * .4); g.quadraticCurveTo(r * .85, r * .2, r * 1.12, r * .45); g.lineTo(r * 1.0, 0); g.lineTo(r * 1.12, -r * .45); g.quadraticCurveTo(r * .85, -r * .2, r * .3, -r * .4); g.quadraticCurveTo(-r * .55, -r * .58, -r * .95, 0); g.closePath(); g.fill(); },
  };
  return g => { g.fillStyle = col; (glows[kind] || glows.round)(g); };
}
export const LANTERN_COL = { round: '#ffb862', lotus: '#ffc08a', fish: '#ffb060', star: '#ffd890', carp: '#ff9a58' };
// —— the rabbit lantern: red paper, long ears, a cut eye, a candle hole in the belly; origin at the top of the head (where the string ties) ——
export function rabbit(x, r, o = {}) {
  const earR = o.earR || 0;   // the right ear's extra tilt (the flop)
  // body (sitting), head, ears
  x.beginPath(); x.ellipse(0, -r * 2.1, r * 1.15, r * .95, 0, 0, TAU); x.fill();
  x.beginPath(); x.ellipse(0, -r * .75, r * .8, r * .7, 0, 0, TAU); x.fill();
  const ear = (dx, tilt) => { x.save(); x.translate(dx, -r * .25); x.rotate(tilt); x.beginPath(); x.ellipse(0, r * .75, r * .24, r * .85, 0, 0, TAU); x.fill(); cut(x, () => { x.beginPath(); x.ellipse(0, r * .75, r * .11, r * .6, 0, 0, TAU); x.fill(); }); x.restore(); };
  ear(-r * .32, .18); ear(r * .32, -.18 + earR);
  // tail, feet
  x.beginPath(); x.arc(-r * 1.15, -r * 2.5, r * .25, 0, TAU); x.fill();
  x.beginPath(); x.ellipse(r * .55, -r * 3.0, r * .5, r * .18, 0, 0, TAU); x.fill();
  // cut eye and the candle hole
  cut(x, () => { x.beginPath(); x.ellipse(r * .32, -r * .65, r * .13, r * .17, 0, 0, TAU); x.fill(); x.beginPath(); x.ellipse(0, -r * 2.1, r * .75, r * .6, 0, 0, TAU); x.fill(); });
  x.beginPath(); x.arc(r * .32, -r * .62, r * .05, 0, TAU); x.fill();   // the eye's paper pupil
  // the candle: a small paper wick in the hole
  x.fillRect(-r * .04, -r * 2.5, r * .08, r * .5);
  return g => { g.fillStyle = o.col || '#ffa050'; g.beginPath(); g.ellipse(0, -r * 2.1, r * .75, r * .6, 0, 0, TAU); g.fill(); g.fillStyle = '#ffd0a0'; g.beginPath(); g.ellipse(r * .32, -r * .65, r * .13, r * .17, 0, 0, TAU); g.fill(); const e = (dx, tilt) => { g.save(); g.translate(dx, -r * .25); g.rotate(tilt); g.fillStyle = '#ffb0a0'; g.beginPath(); g.ellipse(0, r * .75, r * .11, r * .6, 0, 0, TAU); g.fill(); g.restore(); }; e(-r * .32, .18); e(r * .32, -.18 + earR); };
}
// —— a fog sheet: a wide band with a torn, drifting top edge and a soft bottom (vellum, drawn at partial alpha by the layer) ——
export function fogSheet(x, o) {
  const { w, h, seed = 5, top = 1 } = o, R = mulberry(seed);
  x.beginPath(); x.moveTo(-w / 2, -h / 2);
  for (let u = -w / 2; u <= w / 2 + 1e-6; u += w / 160) { const n = (u + w / 2) / w; x.lineTo(u, h / 2 - h * top * (.18 * vnoise(n * 7 + seed) + .12 * vnoise(n * 23 + seed * 2) + .05 * vnoise(n * 71))); }
  x.lineTo(w / 2, -h / 2); x.closePath(); x.fill();
  // holes torn in the fog
  cut(x, () => { for (let i = 0; i < 10; i++) { const px = (R() - .5) * w * .9, py = (R() - .6) * h * .5, rr = h * (.03 + R() * .08); x.beginPath(); x.ellipse(px, py, rr * 1.8, rr, R(), 0, TAU); x.fill(); } });
}
// —— the pier: a deck on posts ——
export function pier(x, o) {
  const { x0, x1, y, h = .006, posts = 6 } = o;
  x.fillRect(x0, y, x1 - x0, h);
  for (let i = 0; i < posts; i++) { const px = x0 + (x1 - x0) * (i + .5) / posts; x.fillRect(px - h * .3, y - h * 4, h * .6, h * 4); }
  cut(x, () => { x.lineWidth = h * .12; for (let i = 1; i < 30; i++) { const px = x0 + (x1 - x0) * i / 30; x.beginPath(); x.moveTo(px, y + h * .1); x.lineTo(px, y + h * .9); x.stroke(); } });
  // railing
  x.fillRect(x0, y + h * 2.2, x1 - x0, h * .35); for (let i = 0; i <= 10; i++) { const px = x0 + (x1 - x0) * i / 10; x.fillRect(px - h * .15, y + h, h * .3, h * 1.5); }
}
// —— the cliff path: a lighter band zigzagging up a slope, with steps cut ——
export function pathBand(x, o) {
  const { pts, w = .008 } = o;
  x.lineWidth = w; x.lineCap = x.lineJoin = 'round'; x.beginPath(); pts.forEach(([px, py], i) => i ? x.lineTo(px, py) : x.moveTo(px, py)); x.stroke();
  cut(x, () => { x.lineWidth = w * .12; for (let i = 0; i < pts.length - 1; i++) { const [ax, ay] = pts[i], [bx, by] = pts[i + 1], n = 6; for (let k = 1; k < n; k++) { const u = k / n, px = lerp(ax, bx, u), py = lerp(ay, by, u); x.beginPath(); x.moveTo(px - w * .3, py); x.lineTo(px + w * .3, py); x.stroke(); } } });
}
// —— the moon: a hole in the sky sheet, with a few maria left as paper islands ——
export function moonHole(x, cx, cy, r) {
  cut(x, () => { x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fill(); });
  for (const [px, py, rr] of [[-.3, .25, .2], [.2, .35, .14], [.28, -.1, .18], [-.15, -.35, .15]]) { x.globalAlpha = .35; x.beginPath(); x.arc(cx + px * r, cy + py * r, rr * r, 0, TAU); x.fill(); x.globalAlpha = 1; }
}
export const moonGlow = (g, cx, cy, r, col = '#fff4d0') => { g.fillStyle = col; g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.fill(); };
export function stars(x, o) { const { w, h, n = 120, seed = 9, minY = -1 } = o, R = mulberry(seed), pts = []; for (let i = 0; i < n; i++) { const px = (R() - .5) * w, py = (R() - .5) * h, rr = .0003 + R() * R() * .0006; if (py < minY) continue; pts.push([px, py, rr]); } cut(x, () => { for (const [px, py, rr] of pts) { x.beginPath(); x.arc(px, py, rr, 0, TAU); x.fill(); } }); return g => { g.fillStyle = '#fff6dc'; for (const [px, py, rr] of pts) { g.beginPath(); g.arc(px, py, rr * 1.2, 0, TAU); g.fill(); } }; }
// —— pines on the headland ——
export function pines(x, o) {
  const { x0, x1, base, h, gap, seed = 3 } = o, R = mulberry(seed);
  for (let u = x0 + R() * gap; u < x1; u += gap * (.6 + R() * .8)) {
    const hh = h * (.6 + R() * .6), w = hh * .36, by = base;
    x.beginPath(); x.moveTo(u, by + hh);
    for (let k = 0; k < 4; k++) { const t1 = (k + 1) / 4; x.lineTo(u + w * (.3 + .7 * t1), by + hh * (1 - t1)); x.lineTo(u + w * .25 * (1 - t1) + w * .1, by + hh * (1 - t1) + hh * .05); }
    x.lineTo(u + hh * .03, by - hh * .06); x.lineTo(u - hh * .03, by - hh * .06);
    for (let k = 3; k >= 0; k--) { const t1 = (k + 1) / 4; x.lineTo(u - w * .25 * (1 - t1) - w * .1, by + hh * (1 - t1) + hh * .05); x.lineTo(u - w * (.3 + .7 * t1), by + hh * (1 - t1)); }
    x.closePath(); x.fill();
  }
}
// —— interior props ——
export function lattice(x, o) {   // a window frame: the panes are holes, a lattice of paper left
  const { cx, cy, w, h, nx = 3, ny = 3 } = o;
  x.fillRect(cx - w / 2, cy - h / 2, w, h);
  cut(x, () => { x.beginPath(); x.rect(cx - w / 2 + w * .06, cy - h / 2 + h * .06, w * .88, h * .88); x.fill(); });
  for (let i = 1; i < nx; i++) x.fillRect(cx - w / 2 + w * i / nx - w * .012, cy - h / 2, w * .024, h);
  for (let j = 1; j < ny; j++) x.fillRect(cx - w / 2, cy - h / 2 + h * j / ny - h * .012, w, h * .024);
  // a small cut cloud motif in the top panes (剪纸 cloud)
  return { x: cx - w / 2 + w * .06, y: cy - h / 2 + h * .06, w: w * .88, h: h * .88 };
}
export function tableTop(x, o) { const { x0, x1, y, th = .006 } = o; x.fillRect(x0, y - th, x1 - x0, th); x.fillRect(x0 + .008, y - .06, .006, .06 - th); x.fillRect(x1 - .014, y - .06, .006, .06 - th); cut(x, () => { x.lineWidth = th * .1; for (let i = 0; i < 6; i++) { const yy = y - th * .25 - i * th * .1; x.beginPath(); x.moveTo(x0 + .005 + i * .01, yy); x.lineTo(x1 - .02 - i * .006, yy); x.stroke(); } }); }
export function scissors(x, o) {   // origin at the pivot; open angle a; blades along +y
  const { L = .02, a = .3 } = o;
  const blade = (s) => { x.save(); x.rotate(s * a / 2); x.beginPath(); x.moveTo(-L * .05, 0); x.lineTo(-L * .08, L * .6); x.quadraticCurveTo(0, L * 1.05, L * .08, L * .6); x.lineTo(L * .05, 0); x.closePath(); x.fill(); x.beginPath(); x.ellipse(0, -L * .32, L * .13, L * .3, 0, 0, TAU); x.fill(); cut(x, () => { x.beginPath(); x.ellipse(0, -L * .32, L * .07, L * .2, 0, 0, TAU); x.fill(); }); x.restore(); };
  blade(-1); blade(1); x.beginPath(); x.arc(0, 0, L * .06, 0, TAU); x.fill();
}
export function mooncake(x, cx, cy, r) {   // round cake with a scalloped rim and a cut pattern (a 月 in the middle is drawn by the caller as text)
  x.beginPath(); for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; x.arc(cx + Math.cos(a) * r * .88, cy + Math.sin(a) * r * .88, r * .18, a - 1.6, a + 1.6); } x.closePath(); x.fill();
  x.beginPath(); x.arc(cx, cy, r * .9, 0, TAU); x.fill();
  cut(x, () => { x.lineWidth = r * .07; x.beginPath(); x.arc(cx, cy, r * .62, 0, TAU); x.stroke(); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; x.beginPath(); x.ellipse(cx + Math.cos(a) * r * .76, cy + Math.sin(a) * r * .76, r * .05, r * .1, a, 0, TAU); x.fill(); } });
}
export function mooncakeBox(x, o) { const { cx, cy, w, h } = o; x.beginPath(); x.roundRect(cx - w / 2, cy - h / 2, w, h, h * .08); x.fill(); cut(x, () => { x.lineWidth = h * .04; x.beginPath(); x.roundRect(cx - w / 2 + w * .05, cy - h / 2 + h * .1, w * .9, h * .8, h * .06); x.stroke(); }); }
export function radio(x, o) {   // a small transistor radio: body, a dial window (returned, lit), a grille of slits, a knob and an aerial
  const { cx, cy, w, h } = o;
  x.beginPath(); x.roundRect(cx - w / 2, cy - h / 2, w, h, h * .12); x.fill();
  const dial = { x: cx - w * .42, y: cy + h * .05, w: w * .5, h: h * .3 };
  cut(x, () => { x.beginPath(); x.roundRect(dial.x, dial.y, dial.w, dial.h, h * .04); x.fill(); x.lineWidth = h * .035; for (let i = 0; i < 7; i++) { const yy = cy - h * .35 + i * h * .07; x.beginPath(); x.moveTo(cx + w * .14, yy); x.lineTo(cx + w * .42, yy); x.stroke(); } });
  x.fillRect(dial.x + dial.w * .55, dial.y, h * .02, dial.h);   // the needle
  x.beginPath(); x.arc(cx - w * .17, cy - h * .25, h * .1, 0, TAU); x.fill(); cut(x, () => { x.beginPath(); x.arc(cx - w * .17, cy - h * .25, h * .055, 0, TAU); x.fill(); });
  x.fillRect(cx + w * .36, cy + h / 2 - h * .02, h * .03, h * .9);   // aerial
  return dial;
}
export function stool(x, cx, y, w, h) { x.fillRect(cx - w / 2, y + h - h * .12, w, h * .12); x.fillRect(cx - w * .4, y, w * .08, h); x.fillRect(cx + w * .32, y, w * .08, h); }
export function eaveLantern(x, cx, cy, kind, r, col) { x.fillRect(cx - r * .03, cy, r * .06, r * .6); x.save(); x.translate(cx, cy - r * 1.05); const g = lantern(x, kind, r, { col }); x.restore(); return gg => { gg.save(); gg.translate(cx, cy - r * 1.05); g(gg); gg.restore(); }; }
