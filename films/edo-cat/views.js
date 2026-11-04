// The view prints on the scroll (wides). Each = cached colour blocks (g1 blues, g2 secondary, g3 reds) + a key block (g0)
// + per-frame live elements (paint). Coordinates are sheet pixels; the border is at FR.
import { clamp, lerp, seg, ss, eio, eo, ei, mulberry, hash, vnoise, track, TAU } from '/core/lib.js';
import { W, H, FR, PAL, smooth, poly, carve, wob, line, fillPath, bokashi, kasumi, rgba, mix } from './print.js';
import { pine, rain, rock, claw, goose } from './nature.js';
import { figure, catSide, pose, gait, blend, kitten, fexpr, monger, MP, manGait, kite, person, boat, fish } from './chars.js';
import { SH, SEC, q8, q12, HIT } from './timeline.js';

const S = PAL.sumi;
const rect = (x, c, x0, y0, x1, y1) => { x.fillStyle = c; x.fillRect(x0, y0, x1 - x0, y1 - y0); };
const K = (x, pts, w = 2.6, o = {}) => carve(x, pts, w, { col: S, ...o });
export const kf = keys => { const f = track(keys.map(([t, v]) => [t, Array.isArray(v) ? v : [v]])); return t => { const r = f(t); return r.length === 1 ? r[0] : r; }; };

// —— shared props ——
export function roofRow(x, y, x0, x1, R, { col = '#5d6670', wall = PAL.plaster, lines = false, h = 46 } = {}) {
  let X = x0;
  while (X < x1) {
    const w = 90 + R() * 150, hh = h * (.7 + R() * .6), top = y - hh;
    if (!lines) {
      if (R() < .35) rect(x, wall, X + 8, top + hh * .45, X + w - 8, y);
      x.fillStyle = col; x.beginPath(); poly(x, [[X - 10, top + hh * .55], [X + w * .2, top], [X + w * .8, top], [X + w + 10, top + hh * .55]]); x.fill();
    } else {
      K(x, [[X - 10, top + hh * .55], [X + w * .2, top], [X + w * .8, top], [X + w + 10, top + hh * .55]], 1.6, { taper: [.1, .1] });
      for (let k = 1; k < 4; k++) { const yy = top + hh * .14 * k; x.strokeStyle = S; x.lineWidth = .9; x.beginPath(); x.moveTo(X + w * .2 - k * w * .07, yy); x.lineTo(X + w * .8 + k * w * .07, yy); x.stroke(); }
    }
    X += w + 6;
  }
}
// banded water: bands of blue with bokashi between, light ripple lines
export function water(x, y0, y1, x0, x1, { c1 = PAL.sky, c2 = PAL.prus, seed = 4 } = {}) {
  bokashi(x, x0, y0, x1, y1, c1, .55, .95, { rough: 14, seed, col2: c2 });
}
export function ripples(x, y0, y1, x0, x1, seed, col = S, a = 1) {
  const R = mulberry(seed); x.strokeStyle = rgba(col, a); x.lineCap = 'round';
  for (let i = 0; i < 70; i++) { const y = y0 + Math.pow(R(), 1.3) * (y1 - y0), u = (y - y0) / (y1 - y0), L = 20 + u * 90 * R(), X = x0 + R() * (x1 - x0); x.lineWidth = .8 + u * 1.6; x.beginPath(); x.moveTo(X, y); x.quadraticCurveTo(X + L / 2, y - 3 - u * 4, X + L, y); x.stroke(); }
}
function stones(x, x0, y0, x1, y1, R, lw = 1.6) {
  x.strokeStyle = S; x.lineWidth = lw;
  for (let y = y0; y < y1; y += 34) { let X = x0 + (Math.floor((y - y0) / 34) % 2) * 30; x.beginPath(); x.moveTo(x0, y); x.lineTo(x1, y); x.stroke(); while (X < x1) { const w = 50 + R() * 40; x.beginPath(); x.moveTo(X, y); x.lineTo(X + (R() - .5) * 6, Math.min(y1, y + 34)); x.stroke(); X += w; } }
}
export function lantern(x, cx, cy, r, lit, col = PAL.beni) {
  if (lit) { const g = x.createRadialGradient(cx, cy, 0, cx, cy, r * 4.5); g.addColorStop(0, 'rgba(244,196,110,.55)'); g.addColorStop(1, 'rgba(244,196,110,0)'); x.fillStyle = g; x.fillRect(cx - r * 5, cy - r * 5, r * 10, r * 10); }
  x.fillStyle = lit ? '#f2c66a' : PAL.white; x.beginPath(); x.ellipse(cx, cy, r, r * 1.25, 0, 0, TAU); x.fill();
  x.fillStyle = col; x.fillRect(cx - r * .9, cy - r * 1.35, r * 1.8, r * .35); x.fillRect(cx - r * .9, cy + r * 1.0, r * 1.8, r * .35);
}
export function lanternKey(x, cx, cy, r) { x.strokeStyle = S; x.lineWidth = 1.8; x.beginPath(); x.ellipse(cx, cy, r, r * 1.25, 0, 0, TAU); x.stroke(); for (let k = -2; k <= 2; k++) { x.lineWidth = .8; x.beginPath(); x.ellipse(cx, cy, r * Math.abs(k) / 2.2, r * 1.2, 0, -Math.PI / 2, Math.PI / 2, k < 0); x.stroke(); } x.lineWidth = 1.5; x.beginPath(); x.moveTo(cx, cy - r * 1.35); x.lineTo(cx, cy - r * 2.2); x.stroke(); }
export function fuji(x, cx, by, w, h, o = {}) {
  // Fuji-like silhouette: truncated cone with concave slopes, snow cap with gully fingers
  const pts = [];
  for (let i = 0; i <= 20; i++) { const u = i / 20; pts.push([cx - w / 2 + u * (w / 2 - w * .07), by - h * Math.pow(u, 1.9)]); }
  pts.push([cx - w * .035, by - h * 1.01], [cx + w * .03, by - h * .995]);
  for (let i = 0; i <= 20; i++) { const u = 1 - i / 20; pts.push([cx + w * .07 + (1 - u) * (w / 2 - w * .07), by - h * Math.pow(u, 1.9)]); }
  if (o.body) { x.fillStyle = o.body; x.beginPath(); poly(x, pts); x.fill(); }
  if (o.snow) {
    const R = mulberry(o.seed || 3), yl = by - h * .62; x.save(); x.beginPath(); poly(x, pts); x.clip();
    x.fillStyle = o.snow; x.beginPath(); x.moveTo(cx - w, yl);
    for (let X = cx - w * .32; X <= cx + w * .32; X += w * .03) { const d = h * (.04 + R() * (R() < .35 ? .22 : .08)); x.lineTo(X - w * .01, yl); x.lineTo(X, yl + d); x.lineTo(X + w * .01, yl); }
    x.lineTo(cx + w, yl); x.lineTo(cx + w, by - h * 1.2); x.lineTo(cx - w, by - h * 1.2); x.closePath(); x.fill(); x.restore();
  }
  if (o.lines) { K(x, pts.slice(0, 22), o.lw || 2, { taper: [.4, .05] }); K(x, pts.slice(21), o.lw || 2, { taper: [.05, .4] }); }
  return pts;
}

// ————————————————————— BRIDGE (home): dawn and dusk impressions of one key block —————————————————————
// right bank: street y 610 with the fish stall; embankment down to the ledge at 820; the hollow at x 1340–1440
export const BR = { street: 612, ledge: 822, hollow: [1350, 1440, 742, 822], deck: X => 566 - 46 * Math.sin(Math.PI * clamp((X - 20) / 1280)), right: 1300 };
const deckPts = (dy = 0) => { const p = []; for (let X = 0; X <= BR.right + 4; X += 40) p.push([X, BR.deck(X) + dy]); return p; };
const PILES = [140, 380, 620, 860, 1100];
function bridgeLayer(x, imp, part) {
  const dusk = imp === 'dusk', R = mulberry(7);
  if (part === 'sky') {
    if (!dusk) {
      bokashi(x, 0, FR.y0, W, 300, PAL.beniP, .95, 0, { rough: 26, seed: 2 });
      bokashi(x, 0, 250, W, 470, PAL.ochreL, 0, .55, { rough: 20, seed: 5 });
    } else {
      bokashi(x, 0, FR.y0, W, 360, '#1a2440', 1, .6, { rough: 26, seed: 2, col2: '#3a4a6c' });
      bokashi(x, 0, 300, W, 480, PAL.beniL, 0, .85, { rough: 20, seed: 5 });
    }
    // water
    bokashi(x, 0, 520, W, 1042, dusk ? '#2b3b5c' : PAL.sky, dusk ? .95 : .6, 1, { rough: 16, seed: 9, col2: dusk ? '#111a30' : PAL.prus });
    bokashi(x, 0, 820, W, 1042, dusk ? '#0c1426' : PAL.prusD, 0, .7, { rough: 22, seed: 12 });
    if (dusk) { const R2 = mulberry(3); x.fillStyle = 'rgba(232,170,90,.55)'; for (const lx of [1500, 1690, 330, 700]) for (let i = 0; i < 9; i++) { const y = 860 + i * 18 + R2() * 6, w = 30 - i * 2 + R2() * 14; x.fillRect(lx - w / 2 + (R2() - .5) * 10, y, w, 3); } }
  }
  if (part === 'col') {
    // far bank roofs
    roofRow(x, 520, 0, W, mulberry(11), { col: dusk ? '#2c3442' : '#6c7682', wall: dusk ? '#55607a' : PAL.plaster });
    // fire tower
    rect(x, dusk ? '#3a2c22' : PAL.woodD, 636, 260, 646, 470); rect(x, dusk ? '#3a2c22' : PAL.woodD, 694, 260, 704, 470);
    x.fillStyle = dusk ? '#2c3442' : '#6c7682'; x.beginPath(); poly(x, [[618, 262], [670, 222], [722, 262]]); x.fill();
    // right bank: street, embankment, ledge
    rect(x, dusk ? '#6b5d48' : PAL.ochreL, BR.right - 10, BR.street - 8, W, BR.street + 14);
    rect(x, dusk ? '#4c5262' : '#a9a99b', BR.right, BR.street + 14, W, BR.ledge);
    rect(x, dusk ? '#5d6272' : PAL.greyL, BR.right - 30, BR.ledge, W, BR.ledge + 30);
    // the hollow
    x.fillStyle = dusk ? '#0d0f16' : '#2b2a2a'; x.beginPath(); const [h0, h1, hy0, hy1] = BR.hollow; x.moveTo(h0, hy1); x.lineTo(h0, hy0 + 30); x.quadraticCurveTo((h0 + h1) / 2, hy0 - 22, h1, hy0 + 30); x.lineTo(h1, hy1); x.fill();
    // stall: awning, posts, counter
    x.fillStyle = dusk ? '#6a5a3c' : PAL.straw; x.beginPath(); poly(x, [[1420, 470], [1500, 400], [1860, 400], [1876, 470]]); x.fill();
    rect(x, dusk ? '#3a2c22' : PAL.wood, 1450, 470, 1462, BR.street); rect(x, dusk ? '#3a2c22' : PAL.wood, 1830, 470, 1842, BR.street);
    rect(x, dusk ? '#4a3a2a' : PAL.woodL, 1500, 556, 1800, 572); rect(x, dusk ? '#3a2c22' : PAL.wood, 1515, 572, 1527, BR.street); rect(x, dusk ? '#3a2c22' : PAL.wood, 1772, 572, 1784, BR.street);
    // fish on the counter + tubs
    for (let i = 0; i < 5; i++) { x.fillStyle = dusk ? '#56657a' : PAL.skyL; x.beginPath(); x.ellipse(1540 + i * 52, 550, 22, 7, -.1, 0, TAU); x.fill(); }
    x.fillStyle = dusk ? '#5a4a30' : PAL.straw; x.beginPath(); x.ellipse(1560, 600, 34, 12, 0, 0, TAU); x.fill();
    // bridge: deck band, railings, piles
    x.fillStyle = dusk ? '#3b2e24' : PAL.wood; x.beginPath(); poly(x, [...deckPts(0), ...deckPts(26).reverse()]); x.fill();
    for (const px of PILES) { const y = BR.deck(px) + 26; rect(x, dusk ? '#2b221b' : PAL.woodD, px - 9, y, px + 9, 940); rect(x, dusk ? '#2b221b' : PAL.woodD, px + 22, y, px + 38, 930); }
    x.strokeStyle = dusk ? '#4a3a2c' : PAL.woodL; x.lineWidth = 9; x.beginPath(); smooth(x, deckPts(-58)); x.stroke(); x.lineWidth = 5; x.beginPath(); smooth(x, deckPts(-28)); x.stroke();
    for (let X = 60; X < BR.right; X += 110) { rect(x, dusk ? '#4a3a2c' : PAL.woodL, X - 5, BR.deck(X) - 62, X + 5, BR.deck(X)); }
    // little boat in the canal
    x.fillStyle = dusk ? '#3b2e24' : PAL.woodL; x.beginPath(); poly(x, [[560, 760], [600, 778], [800, 778], [840, 756], [800, 766], [600, 766]]); x.fill();
    if (dusk) { x.fillStyle = '#e8b25c'; const R3 = mulberry(21); for (let i = 0; i < 26; i++) { const X = 60 + R3() * 1760, Y = 478 + R3() * 34; if (X > 1300 && X < 1880 && Y > 470) continue; x.fillRect(X, Y, 8, 6); } }
  }
  if (part === 'red') {
    if (!dusk) { x.fillStyle = PAL.beni; x.beginPath(); x.arc(980, 352, 30, 0, TAU); x.fill(); kasumi(x, 840, 470, 900, 22, PAL.white, .95); kasumi(x, 1500, 488, 600, 16, PAL.white, .9); kasumi(x, 260, 476, 420, 14, PAL.white, .9); }
    else { kasumi(x, 840, 470, 900, 22, '#c9cfe0', .55); kasumi(x, 260, 476, 420, 14, '#c9cfe0', .5); }
    // stall cloth (noren) + lanterns
    for (let i = 0; i < 4; i++) rect(x, dusk ? '#2a3a5c' : PAL.ai, 1520 + i * 80, 470, 1590 + i * 80, 520);
    lantern(x, 1490, 500, 16, dusk); lantern(x, 1820, 500, 16, dusk);
    for (const X of [280, 720, 1160]) lantern(x, X, BR.deck(X) - 82, 12, dusk);
  }
  if (part === 'key') {
    const lw = 2.6;
    roofRow(x, 520, 0, W, mulberry(11), { lines: true });
    K(x, [[0, 522], [W, 520]], 2.2, { taper: [0, 0] });
    K(x, [[636, 470], [636, 262]], 1.6); K(x, [[704, 470], [704, 262]], 1.6); for (let y = 290; y < 470; y += 30) { x.strokeStyle = S; x.lineWidth = 1.2; x.beginPath(); x.moveTo(636, y); x.lineTo(704, y + 15); x.moveTo(704, y); x.lineTo(636, y + 15); x.stroke(); }
    K(x, [[618, 262], [670, 222], [722, 262]], 2, { taper: [.1, .1] });
    // right bank
    K(x, [[BR.right - 10, BR.street - 8], [W, BR.street - 8]], lw, { taper: [0, 0] }); K(x, [[BR.right, BR.street + 14], [W, BR.street + 14]], 2, { taper: [0, 0] });
    stones(x, BR.right, BR.street + 14, W, BR.ledge, mulberry(5));
    K(x, [[BR.right - 30, BR.ledge], [W, BR.ledge]], lw, { taper: [0, 0] }); K(x, [[BR.right - 30, BR.ledge + 30], [W, BR.ledge + 30]], 2, { taper: [0, 0] });
    { const [h0, h1, hy0, hy1] = BR.hollow; K(x, [[h0, hy1], [h0, hy0 + 30], [(h0 + h1) / 2, hy0 - 8], [h1, hy0 + 30], [h1, hy1]], lw); }
    K(x, [[1420, 470], [1500, 400], [1860, 400], [1876, 470]], lw, { taper: [.05, .05] }); K(x, [[1420, 470], [1876, 470]], 2);
    for (let X = 1510; X < 1860; X += 28) { x.strokeStyle = S; x.lineWidth = 1; x.beginPath(); x.moveTo(X, 402); x.lineTo(X - 40, 468); x.stroke(); }
    for (const [a, b] of [[1450, 1462], [1830, 1842], [1515, 1527], [1772, 1784]]) { x.strokeStyle = S; x.lineWidth = 1.8; x.strokeRect(a, a > 1500 && a < 1800 ? 572 : 470, b - a, BR.street - (a > 1500 && a < 1800 ? 572 : 470)); }
    x.strokeRect(1500, 556, 300, 16);
    for (let i = 0; i < 5; i++) { x.beginPath(); x.ellipse(1540 + i * 52, 550, 22, 7, -.1, 0, TAU); x.stroke(); }
    x.beginPath(); x.ellipse(1560, 600, 34, 12, 0, 0, TAU); x.stroke();
    for (let i = 0; i < 4; i++) x.strokeRect(1520 + i * 80, 470, 70, 50);
    // bridge
    K(x, deckPts(0), lw, { taper: [0, 0] }); K(x, deckPts(26), lw, { taper: [0, 0] });
    for (let X = 30; X < BR.right; X += 26) { x.strokeStyle = S; x.lineWidth = 1; x.beginPath(); x.moveTo(X, BR.deck(X) + 4); x.lineTo(X, BR.deck(X) + 22); x.stroke(); }
    K(x, deckPts(-62), 2.2, { taper: [0, 0] }); K(x, deckPts(-54), 1.4, { taper: [0, 0] }); K(x, deckPts(-28), 1.6, { taper: [0, 0] });
    for (let X = 60; X < BR.right; X += 110) { x.strokeStyle = S; x.lineWidth = 1.6; x.strokeRect(X - 5, BR.deck(X) - 62, 10, 62); }
    for (const px of PILES) { const y = BR.deck(px) + 26; x.lineWidth = 2; x.strokeRect(px - 9, y, 18, 940 - y); x.strokeRect(px + 22, y, 16, 930 - y); x.lineWidth = 1.2; x.beginPath(); x.moveTo(px - 30, 900); x.quadraticCurveTo(px, 892, px + 60, 900); x.stroke(); }
    for (const X of [280, 720, 1160]) lanternKey(x, X, BR.deck(X) - 82, 12);
    lanternKey(x, 1490, 500, 16); lanternKey(x, 1820, 500, 16);
    K(x, [[560, 760], [600, 778], [800, 778], [840, 756]], 2); K(x, [[560, 760], [600, 766], [800, 766], [840, 756]], 1.4);
    ripples(x, 560, 1040, 0, W, 31);
  }
}
export const BRIDGE = {
  id: 'bridge', w: W, h: H,
  layers: {
    sky_dawn: { g: 1, grain: .12, draw: x => bridgeLayer(x, 'dawn', 'sky') }, col_dawn: { g: 2, grain: .05, draw: x => bridgeLayer(x, 'dawn', 'col') }, red_dawn: { g: 3, draw: x => bridgeLayer(x, 'dawn', 'red') },
    sky_dusk: { g: 1, grain: .12, draw: x => bridgeLayer(x, 'dusk', 'sky') }, col_dusk: { g: 2, grain: .05, draw: x => bridgeLayer(x, 'dusk', 'col') }, red_dusk: { g: 3, draw: x => bridgeLayer(x, 'dusk', 'red') },
    key: { g: 0, speck: .12, draw: x => bridgeLayer(x, 'dawn', 'key') },
  },
  // which impression and block reveals at time t
  blocks(t) {
    // s48: dawn blocks lift off, dusk blocks land; s56: dusk blocks lift off one by one, key stays
    const a = SH.s48.t0, e = SH.s56.t0;
    if (t < a) return [['sky_dawn', 1], ['col_dawn', 1], ['red_dawn', 1], ['key', 1]];
    if (t < e) {
      const off = 1 - clamp((t - a - .25) / .45), on = k => clamp((t - a - 1.3 - k * .42) / .34);
      return off > 0 ? [['sky_dawn', off], ['col_dawn', off], ['red_dawn', off], ['key', 1]] : [['sky_dusk', on(0)], ['col_dusk', on(1)], ['red_dusk', on(2)], ['key', 1]];
    }
    const off = k => 1 - clamp((t - e - .5 - k * .5) / .38);
    return [['sky_dusk', off(0)], ['col_dusk', off(1)], ['red_dusk', off(2)], ['key', 1]];
  },
  paint(ctx, t, R) {
    for (const [n, r] of this.blocks(t)) R.L(n, r);
    const dusk = t >= SH.s48.t0 + 1.3;
    // —— live figures ——
    if (t < SH.s48.t0) {
      // the kite circling high in the dawn sky (plant), until it dives in B
      if (t < SH.s12.t0) { const tq = q8(t), a = tq * .9; R.fig(A => kite(A, 900 + Math.cos(a) * 260, 190 + Math.sin(a) * 60, 90, Math.sin(a) > 0 ? -1 : 1, Math.sin(tq * 9), { t })); }
      // opening: cat sitting on the ledge by the hollow, the kitten's eyes in the dark; the fishmonger at his stall
      if (t < SH.s16.t0) {
        R.fig(A => { catSide(A, 1500, BR.ledge + 2, 95, -1, pose('sit', { ha: -.2 + .1 * Math.sin(q8(t) * 1.3) }), { t: q8(t) }); });
        R.fig(A => kitten(A, 1395, BR.ledge - 4, 44, { E: fexpr('hungry'), t, bob: Math.sin(q8(t) * 3) }));
        R.fig(A => monger(A, 1650, BR.street, 150, 1, MP.arrange, { pole: 'none' }));
      } else if (t < SH.s17.t0) {
        // s16 chase begins: kite away left, cat on the bridge running left, fishmonger runs in from the right
        const lt = t - SH.s16.t0, tq = q8(lt);
        R.fig(A => kite(A, 700 - lt * 420, 300 - lt * 60, 120, -1, Math.sin(tq * 14), { fish: 1, t }));
        const cx = 1150 - lt * 520; R.fig(A => catSide(A, cx, BR.deck(cx), 80, -1, gait('run', (tq * 2.4) % 1), { t: tq }));
        const mx = 1900 - lt * 300; R.fig(A => monger(A, mx, BR.street, 150, -1, manGait('run', (tq * 1.6) % 1), { pole: 'hand', poleAng: -1.1 }));
      }
    } else if (t < SH.s56.t0) {
      // dusk: lanterns live flicker glow (drawn on top), the fishmonger walks off at the end
      if (dusk) { const f = .8 + .2 * Math.sin(q8(t) * 11); ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = .35 * f * clamp((t - SH.s48.t0 - 1.8) / .5); for (const [lx, ly] of [[1490, 500], [1820, 500], [280, BR.deck(280) - 82], [720, BR.deck(720) - 82], [1160, BR.deck(1160) - 82]]) { const g = ctx.createRadialGradient(lx, ly, 0, lx, ly, 120); g.addColorStop(0, 'rgba(255,200,110,.9)'); g.addColorStop(1, 'rgba(255,200,110,0)'); ctx.fillStyle = g; ctx.fillRect(lx - 120, ly - 120, 240, 240); } ctx.restore(); }
      if (t < SH.s49.t0) { const lt = t - SH.s48.t0, cx = 900 + lt * 70; R.fig(A => catSide(A, Math.min(cx, 1290), BR.deck(Math.min(cx, 1290)), 72, 1, gait('limp', (q8(lt) * 1.3) % 1, 'wet'), { t: q8(lt), fish: 1 })); }
      if (t >= SH.s55.t0) {
        const lt = t - SH.s55.t0, mx = 1250 - lt * 120;
        R.fig(A => monger(A, mx, BR.deck(mx), 140, -1, manGait('walk', (q8(lt) * 1.1) % 1), { pole: 'shoulder', lantern: false }));
        R.fig(A => { catSide(A, 1480, BR.ledge + 2, 70, -1, pose('sit', { ha: .15, eye: .4 }), { t }); kitten(A, 1420, BR.ledge - 2, 40, { E: fexpr('eat'), t }); fish(A, [1450, BR.ledge - 6], 60, .2, 0, 1.6); fish(A, [1530, BR.ledge - 4], 64, -.1, 0, 1.6); });
      }
    } else {
      // the end: the key line of the two cats and the two fish stays
      R.fig(A => { catSide(A, 1480, BR.ledge + 2, 70, -1, pose('sit', { ha: .15, eye: .4 }), { t }); kitten(A, 1420, BR.ledge - 2, 40, { E: fexpr('eat'), t }); fish(A, [1450, BR.ledge - 6], 60, .2, 0, 1.6); fish(A, [1530, BR.ledge - 4], 64, -.1, 0, 1.6); }, { colour: 1 - clamp((t - SH.s56.t0 - 1.6) / .4) });
    }
  },
};

// ————————————————————— RAIN BRIDGE —————————————————————
export const RB = { deck: 640 };
function rainLayer(x, part) {
  if (part === 'sky') {
    bokashi(x, 0, FR.y0, W, 420, '#2a2a2e', 1, 0, { rough: 30, seed: 41, ease: .8 });
    bokashi(x, 0, 380, W, 1042, '#7d8a90', .2, .9, { rough: 18, seed: 43, col2: '#45586a' });
  }
  if (part === 'col') {
    // far shore: pale grey trees and roofs
    x.fillStyle = '#9ca3a0'; x.beginPath(); x.moveTo(0, 520); for (let X = 0; X <= W; X += 30) x.lineTo(X, 500 - Math.abs(Math.sin(X * .013)) * 30 - vnoise(X * .01) * 30); x.lineTo(W, 540); x.lineTo(0, 540); x.fill();
    roofRow(x, 540, 0, W, mulberry(44), { col: '#8a9196', wall: '#c4c3b5', h: 34 });
    // the long bridge, almost side-on
    rect(x, PAL.wood, 0, RB.deck, W, RB.deck + 30);
    for (let X = 80; X < W; X += 260) { rect(x, PAL.woodD, X - 10, RB.deck + 30, X + 10, 980); rect(x, PAL.woodD, X + 40, RB.deck + 30, X + 56, 960); }
    x.strokeStyle = PAL.woodL; x.lineWidth = 9; x.beginPath(); x.moveTo(0, RB.deck - 70); x.lineTo(W, RB.deck - 70); x.stroke();
    for (let X = 40; X < W; X += 130) rect(x, PAL.woodL, X - 5, RB.deck - 72, X + 5, RB.deck);
  }
  if (part === 'key') {
    roofRow(x, 540, 0, W, mulberry(44), { lines: true, h: 34 });
    K(x, [[0, RB.deck], [W, RB.deck]], 2.8, { taper: [0, 0] }); K(x, [[0, RB.deck + 30], [W, RB.deck + 30]], 2.8, { taper: [0, 0] });
    for (let X = 10; X < W; X += 24) { x.strokeStyle = S; x.lineWidth = 1; x.beginPath(); x.moveTo(X, RB.deck + 4); x.lineTo(X, RB.deck + 26); x.stroke(); }
    K(x, [[0, RB.deck - 75], [W, RB.deck - 75]], 2, { taper: [0, 0] }); K(x, [[0, RB.deck - 65], [W, RB.deck - 65]], 1.4, { taper: [0, 0] });
    for (let X = 40; X < W; X += 130) { x.lineWidth = 1.5; x.strokeStyle = S; x.strokeRect(X - 5, RB.deck - 72, 10, 72); }
    for (let X = 80; X < W; X += 260) { x.lineWidth = 2; x.strokeRect(X - 10, RB.deck + 30, 20, 950 - RB.deck); x.strokeRect(X + 40, RB.deck + 30, 16, 930 - RB.deck); }
    ripples(x, 700, 1040, 0, W, 47, PAL.prusD);
  }
}
export const RAINV = {
  id: 'rain', w: W, h: H, cart: { x: 130, y: 70, title: '二 骤雨', t0: () => SH.s18.t0 + .35 },
  layers: { sky: { g: 1, grain: .15, draw: x => rainLayer(x, 'sky') }, col: { g: 2, grain: .05, draw: x => rainLayer(x, 'col') }, key: { g: 0, speck: .12, draw: x => rainLayer(x, 'key') } },
  paint(ctx, t, R) {
    R.L('sky'); R.L('col'); R.L('key');
    const tq = q8(t), t0 = SH.s17.t0;
    // walkers on the deck (both directions), umbrellas tilting into the rain
    const W8 = [[200, 1, '#c9b07a'], [520, -1, PAL.ai], [760, 1, '#b8412f'], [1060, -1, '#c9b07a'], [1380, 1, '#8b8a80'], [1650, -1, PAL.ai]];
    W8.forEach(([x0, d, c], i) => { const X = ((x0 + d * (t - t0) * 70) % 2000 + 2000) % 2000 - 40; R.fig(A => person(A, X, RB.deck, 130, d, i % 3 === 1 ? 'cape' : 'umbrella', (tq * 1.4 + i * .3) % 1, { ucol: c, utilt: -.15 * d })); });
    // the kite ahead, the cat weaving through the walkers (right → left); the fishmonger behind
    if (t >= SH.s18.t0 && t < SH.s22.t0) {
      const k = seg(t, SH.s18.t0, SH.s18.t1);
      R.fig(A => kite(A, lerp(860, -150, k), 250 + Math.sin(tq * 3) * 20, 120, -1, Math.sin(tq * 16), { fish: 1, t }));
      const cx = lerp(1750, 250, k); R.fig(A => catSide(A, cx, RB.deck + 2, 70, -1, gait('run', (tq * 2.5) % 1), { t: tq }));
    }
    rain(ctx, q12(t), [-100, 0, W + 100, H], { sets: [[-1.38, 300, 2, PAL.sumi, .5], [-1.27, 170, 1.4, '#5f5e58', .45]] });
  },
};

// ————————————————————— SNOW TEMPLE (tall: 1920 × 1620) —————————————————————
export const SN = { h: 1620, ridge: 420, eave: 980, ground: 1440 };
export const roofTop = X => SN.ridge + (X - 300) * .363;   // snow surface: from the ridge (left) down to the eave (right)
function snowLayer(x, part) {
  const R = mulberry(61);
  if (part === 'sky') {
    bokashi(x, 0, 30, W, 700, '#55585e', .95, 0, { rough: 30, seed: 62 });
    bokashi(x, 0, 1200, W, 1580, '#b9c2c8', 0, .35, { rough: 18, seed: 65 });
  }
  if (part === 'col') {
    // pine at left with snow pads (needle colour; snow = paper)
    pine(x, 180, SN.ground, 2.6, { seed: 5, lean: .25, lines: false, minI: 3 });
    // roof: dark tile under-slope; snow (paper) left unprinted on top
    x.fillStyle = '#4c5560'; x.beginPath(); poly(x, [[300, roofTop(300) + 62], [1650, roofTop(1650) + 62], [1880, roofTop(1650) + 40], [1880, roofTop(1650) + 175], [1600, roofTop(1600) + 172], [300, roofTop(300) + 168]]); x.fill();
    x.fillStyle = PAL.woodD; x.beginPath(); poly(x, [[300, roofTop(300) + 168], [1600, roofTop(1600) + 172], [1880, roofTop(1650) + 175], [1880, roofTop(1650) + 200], [1600, roofTop(1600) + 197], [300, roofTop(300) + 193]]); x.fill();
    // hall wall + pillars below the eave
    rect(x, PAL.plaster, 700, SN.eave + 40, 1880, SN.ground); for (let X = 760; X < 1880; X += 220) rect(x, '#8a3a2c', X, SN.eave + 40, X + 26, SN.ground);
    rect(x, PAL.woodD, 700, SN.eave + 40, 1880, SN.eave + 80);
    // stone lantern
    rect(x, '#9a9a90', 470, 1250, 510, SN.ground); x.fillStyle = '#9a9a90'; x.beginPath(); poly(x, [[420, 1250], [490, 1205], [560, 1250]]); x.fill(); rect(x, '#9a9a90', 440, 1170, 540, 1210);
    // the bell under the eave
    x.fillStyle = '#7a6a3a'; x.beginPath(); smooth(x, [[1550, SN.eave + 90], [1610, SN.eave + 90], [1620, SN.eave + 170], [1540, SN.eave + 170]], true); x.fill();
  }
  if (part === 'snow') {
    // snow on the roof: the paper white with a pale grey shadow edge (printed as grey, paper above)
    x.fillStyle = '#cfd5d8'; x.beginPath(); const R2 = mulberry(5); const edge = []; for (let X = 300; X <= 1650; X += 30) edge.push([X, roofTop(X) + 50 + R2() * 14]); poly(x, [...edge, [1880, roofTop(1650) + 30], [1880, roofTop(1650) + 38], ...edge.slice().reverse().map(([a, b]) => [a, b + 12])]); x.fill();
    rect(x, '#d9dcdc', 0, SN.ground, W, SN.ground + 26);
  }
  if (part === 'key') {
    pine(x, 180, SN.ground, 2.6, { seed: 5, lean: .25, fills: false, minI: 3 });
    K(x, [[300, roofTop(300)], [1000, roofTop(1000) - 4], [1650, roofTop(1650)], [1880, roofTop(1650) - 30]], 2.6, { taper: [0, 0] });
    K(x, [[300, roofTop(300) + 168], [1600, roofTop(1600) + 172], [1880, roofTop(1650) + 175]], 2.8, { taper: [0, 0] });
    K(x, [[300, roofTop(300) + 193], [1600, roofTop(1600) + 197], [1880, roofTop(1650) + 200]], 2.8, { taper: [0, 0] });
    for (let i = 1; i < 52; i++) { const X = 300 + i * 30; if (X > 1860) break; x.strokeStyle = S; x.lineWidth = 1.3; x.beginPath(); x.moveTo(X, roofTop(X) + 64); x.lineTo(X + 8, roofTop(X) + 166); x.stroke(); }
    // ridge ornament
    x.fillStyle = S; x.beginPath(); poly(x, [[300, SN.ridge], [270, SN.ridge - 60], [330, SN.ridge - 30], [345, SN.ridge + 10]]); x.fill();
    K(x, [[700, SN.eave + 40], [1880, SN.eave + 40]], 2.4); K(x, [[700, SN.eave + 80], [1880, SN.eave + 80]], 2);
    for (let X = 760; X < 1880; X += 220) { x.lineWidth = 2; x.strokeStyle = S; x.strokeRect(X, SN.eave + 80, 26, SN.ground - SN.eave - 80); }
    x.strokeRect(470, 1250, 40, SN.ground - 1250); K(x, [[420, 1250], [490, 1205], [560, 1250], [420, 1250]], 2); x.strokeRect(440, 1170, 100, 40); K(x, [[455, 1170], [490, 1120], [525, 1170]], 2);
    K(x, [[1580, SN.eave + 40], [1580, SN.eave + 90]], 2); x.beginPath(); smooth(x, [[1550, SN.eave + 90], [1610, SN.eave + 90], [1620, SN.eave + 170], [1540, SN.eave + 170]], true); x.lineWidth = 2.4; x.stroke();
    K(x, [[0, SN.ground], [W, SN.ground]], 2.4, { taper: [0, 0] });
  }
}
export const SNOWV = {
  id: 'snow', w: W, h: SN.h, cart: { x: 1790, y: 60, title: '三 雪寺', t0: () => SH.s23.t0 + 1.0 },
  layers: { sky: { g: 1, grain: .12, draw: x => snowLayer(x, 'sky') }, col: { g: 2, grain: .05, draw: x => snowLayer(x, 'col') }, snow: { g: 1, speck: .1, draw: x => snowLayer(x, 'snow') }, key: { g: 0, speck: .12, draw: x => snowLayer(x, 'key') } },
  paint(ctx, t, R) {
    R.L('sky'); R.L('col'); R.L('snow'); R.L('key');
    const tq = q8(t), a = SH.s23.t0;
    // the kite on the ridge with the fish; the cat creeping up the roof
    R.fig(A => { kite(A, 420, SN.ridge - 60, 170, -1, -.9 + .08 * Math.sin(tq * 2), { fish: 1, t: 0 }); });
    if (t >= a && t < SH.s28.t0) { const u = seg(t, a, SH.s23.t1), cx = lerp(1660, 820, u);
      R.fig(A => catSide(A, cx, roofTop(cx) + 4, 90, -1, { ...gait('sneak', (tq * 1.2) % 1, 'sneak'), rot: -.36 }, { t: tq })); }
    // falling snow (8 fps)
    const Rn = mulberry(77); ctx.fillStyle = '#f4f1e6';
    for (let i = 0; i < 160; i++) { const sp = 30 + Rn() * 40, X = (Rn() * 2100 + Math.sin(tq + i) * 20), Y = (Rn() * SN.h + tq * sp) % SN.h, r = 2 + Rn() * 4; ctx.beginPath(); ctx.arc(X, Y, r, 0, TAU); ctx.fill(); }
  },
};

// ————————————————————— FIELDS + FUJI (diptych: 3840 × 1080) —————————————————————
export const FD = { w: 3840, levee: 760 };
const fieldRows = [560, 590, 628, 676, 736, 806, 890, 990, 1100];
function fieldLayer(x, part) {
  const R = mulberry(81), w = FD.w, SL = .42;
  if (part === 'sky') {
    bokashi(x, 0, FR.y0, w, 330, PAL.prus, .85, 0, { rough: 28, seed: 82 });
    fuji(x, 2900, 548, 760, 330, { body: PAL.prusL });
    // irrigation water strips between rows reflect the sky
    for (let r = 0; r < fieldRows.length - 1; r += 3) { const y = fieldRows[r] + 4; rect(x, rgba(PAL.sky, .7), 0, y, w, y + 6 + r * 1.5); }
  }
  if (part === 'col') {
    // flat, high, parallel field layers; cross dikes parallel and slanted
    for (let r = 0; r < fieldRows.length - 1; r++) {
      const y0 = fieldRows[r], y1 = fieldRows[r + 1];
      x.fillStyle = [PAL.greenL, PAL.green, '#9db35e', PAL.green, '#a5b766', PAL.greenD, PAL.green, '#7f9a48'][r]; x.fillRect(0, y0, w, y1 - y0);
    }
    // distant tree line + village
    x.fillStyle = PAL.greenD; x.beginPath(); x.moveTo(0, 560); for (let X = 0; X <= w; X += 16) x.lineTo(X, 548 - Math.abs(Math.sin(X * .03)) * 8 - vnoise(X * .01) * 14); x.lineTo(w, 562); x.fill();
    // the levee path (ochre) running across both sheets
    rect(x, PAL.ochreL, 0, FD.levee - 22, w, FD.levee + 6);
    pine(x, 900, FD.levee - 18, 1.3, { seed: 9, lean: -.2, lines: false });
    pine(x, 3300, FD.levee - 18, 1.5, { seed: 4, lean: .3, lines: false });
  }
  if (part === 'snow') { fuji(x, 2900, 548, 760, 330, { snow: PAL.white, seed: 5 }); kasumi(x, 2600, 470, 1200, 30, PAL.white, .95); kasumi(x, 1100, 520, 1500, 20, PAL.white, .9); kasumi(x, 3300, 535, 800, 18, PAL.white, .9); }
  if (part === 'key') {
    fuji(x, 2900, 548, 760, 330, { lines: true, lw: 1.8 });
    for (let r = 1; r < fieldRows.length - 1; r++) K(x, [[0, fieldRows[r]], [w, fieldRows[r]]], .8 + r * .35, { taper: [0, 0], jit: .5, per: 2 });
    for (let r = 0; r < fieldRows.length - 1; r++) { const y0 = fieldRows[r], y1 = fieldRows[r + 1], sp = 200 + r * 60; for (let X = -200 + (r * 97) % sp; X < w; X += sp * (.7 + R() * .6)) { if (y0 < FD.levee && y1 > FD.levee - 22) continue; K(x, [[X, y0], [X + (y1 - y0) * SL, y1]], .7 + r * .3, { taper: [.1, .1] }); } }
    // rice tufts: short strokes in rows (near rows larger)
    x.strokeStyle = PAL.greenD; for (let r = 4; r < fieldRows.length - 1; r++) { const y0 = fieldRows[r], y1 = fieldRows[r + 1], s = (r - 3) * 2.2; x.lineWidth = .6 + s * .25; for (let X = 0; X < w; X += 8 + s * 3) for (let y = y0 + 6; y < y1 - 4; y += 10 + s * 3) { if (y > FD.levee - 26 && y < FD.levee + 10) continue; x.beginPath(); x.moveTo(X + (y % 7), y + s); x.lineTo(X + (y % 7) - s * .4, y - s); x.moveTo(X + (y % 7), y + s); x.lineTo(X + (y % 7) + s * .5, y - s * .8); x.stroke(); } }
    K(x, [[0, FD.levee - 22], [w, FD.levee - 22]], 2.4, { taper: [0, 0] }); K(x, [[0, FD.levee + 6], [w, FD.levee + 6]], 2.4, { taper: [0, 0] });
    pine(x, 900, FD.levee - 18, 1.3, { seed: 9, lean: -.2, fills: false });
    pine(x, 3300, FD.levee - 18, 1.5, { seed: 4, lean: .3, fills: false });
  }
}
export const FIELDS = {
  id: 'fields', w: FD.w, h: H, cart: { x: 3740, y: 64, title: '四 稻田', t0: () => SH.s29.t0 + .3 },
  layers: { sky: { g: 1, grain: .1, draw: x => fieldLayer(x, 'sky') }, col: { g: 2, grain: .04, draw: x => fieldLayer(x, 'col') }, snow: { g: 3, speck: .05, draw: x => fieldLayer(x, 'snow') }, key: { g: 0, speck: .12, draw: x => fieldLayer(x, 'key') } },
  paint(ctx, t, R) {
    R.L('sky'); R.L('col'); R.L('snow'); R.L('key');
    const tq = q8(t), a = SH.s28.t0, b = SH.s30.t0;
    // farmers bent over the rice
    [[400, 900], [1500, 1000], [2200, 870], [3000, 960], [3500, 880]].forEach(([X, Y], i) => R.fig(A => person(A, X, Y, 120, i % 2 ? 1 : -1, 'farmer', 0, { bend: 1, hat: PAL.straw })));
    // the kite ahead, the cat along the levee, both travelling right → left over the diptych
    if (t >= SH.s29.t0 && t < SH.s34.t0) { const u = seg(t, SH.s29.t0, SH.s29.t1);
      R.fig(A => kite(A, lerp(3500, 150, u), 300 + Math.sin(tq * 2) * 30, 130, -1, Math.sin(tq * 14), { fish: 1, t }));
      const cx = lerp(3900, 500, u); R.fig(A => catSide(A, cx, FD.levee - 4, 85, -1, gait('run', (tq * 2.5) % 1), { t: tq })); }
  },
  // camera follows the cat: x of the cat at time t
  track: t => lerp(3900, 500, seg(t, SH.s29.t0, SH.s29.t1)),
};

// ————————————————————— MOUNTAIN PASS (tall: 1920 × 2160) —————————————————————
export const PS = { h: 2160 };
const ZIG = [[1500, 2080], [700, 1820], [1350, 1540], [600, 1250], [1200, 980], [820, 760], [1100, 560]];
function passLayer(x, part) {
  if (part === 'sky') {
    bokashi(x, 0, 30, W, 700, PAL.ochre, .7, 0, { rough: 30, seed: 91 });
    bokashi(x, 0, 30, W, 260, PAL.beniL, .5, 0, { rough: 24, seed: 92 });
    // far peaks
    x.fillStyle = '#8fa3b6'; x.beginPath(); x.moveTo(0, 760); x.lineTo(260, 520); x.lineTo(420, 640); x.lineTo(640, 430); x.lineTo(900, 700); x.lineTo(1300, 470); x.lineTo(1600, 650); x.lineTo(1920, 520); x.lineTo(1920, 900); x.lineTo(0, 900); x.fill();
  }
  if (part === 'col') {
    // the mountain mass: a big ochre-green slope rising from bottom right to the summit
    x.fillStyle = '#9a8a5a'; x.beginPath(); x.moveTo(0, 2160); x.lineTo(0, 1000); x.bezierCurveTo(300, 820, 700, 600, 1050, 540); x.bezierCurveTo(1350, 500, 1700, 640, 1920, 760); x.lineTo(1920, 2160); x.fill();
    // green bands (vegetation layers)
    for (let i = 0; i < 6; i++) { const y = 900 + i * 210; x.fillStyle = i % 2 ? PAL.greenD : '#6f8a46'; x.beginPath(); x.moveTo(0, y + 80); x.quadraticCurveTo(900, y - 40, 1920, y + 60); x.lineTo(1920, y + 130); x.quadraticCurveTo(900, y + 50, 0, y + 170); x.fill(); }
    // the zigzag path (ochre)
    x.strokeStyle = PAL.ochreL; x.lineWidth = 46; x.lineJoin = 'round'; x.lineCap = 'round'; x.beginPath(); x.moveTo(...ZIG[0]); for (const p of ZIG.slice(1)) x.lineTo(...p); x.stroke();
    pine(x, 1650, 1500, 2.2, { seed: 3, lean: -.3, lines: false });
    pine(x, 300, 1150, 1.8, { seed: 8, lean: .3, lines: false });
    pine(x, 1250, 560, 1.4, { seed: 2, lean: -.1, lines: false });
  }
  if (part === 'mist') { kasumi(x, 600, 880, 1200, 40, PAL.white, .95); kasumi(x, 1500, 1380, 900, 36, PAL.white, .9); kasumi(x, 400, 1700, 900, 34, PAL.white, .9); }
  if (part === 'key') {
    x.strokeStyle = S; x.lineWidth = 2; x.beginPath(); x.moveTo(0, 760); x.lineTo(260, 520); x.lineTo(420, 640); x.lineTo(640, 430); x.lineTo(900, 700); x.lineTo(1300, 470); x.lineTo(1600, 650); x.lineTo(1920, 520); x.stroke();
    K(x, [[0, 1000], [300, 850], [700, 640], [1050, 540], [1350, 520], [1700, 640], [1920, 760]], 3, { taper: [0, 0] });
    for (const off of [-23, 23]) { const pts = ZIG.map(([a, b], i) => [a, b + off]); K(x, pts, 2, { taper: [0, 0], per: 2 }); }
    pine(x, 1650, 1500, 2.2, { seed: 3, lean: -.3, fills: false });
    pine(x, 300, 1150, 1.8, { seed: 8, lean: .3, fills: false });
    pine(x, 1250, 560, 1.4, { seed: 2, lean: -.1, fills: false });
    // rock strokes (cun)
    const R = mulberry(93); for (let i = 0; i < 40; i++) { const X = R() * 1900, Y = 900 + R() * 1200; K(x, [[X, Y], [X + 30 + R() * 40, Y + 20 + R() * 30], [X + 50, Y + 70]], 1.6, { taper: [.2, .5] }); }
  }
}
export const PASS = {
  id: 'pass', w: W, h: PS.h, cart: { x: 1790, y: 70, title: '五 山岭', t0: () => SH.s35.t0 + 1.2 },
  layers: { sky: { g: 1, grain: .12, draw: x => passLayer(x, 'sky') }, col: { g: 2, grain: .06, draw: x => passLayer(x, 'col') }, mist: { g: 3, speck: .05, draw: x => passLayer(x, 'mist') }, key: { g: 0, speck: .12, draw: x => passLayer(x, 'key') } },
  zig: ZIG,
  catAt(u) { // position along the zigzag 0..1
    const L = []; let tot = 0; for (let i = 1; i < ZIG.length; i++) { const d = Math.hypot(ZIG[i][0] - ZIG[i - 1][0], ZIG[i][1] - ZIG[i - 1][1]); L.push(d); tot += d; }
    let d = clamp(u) * tot; for (let i = 0; i < L.length; i++) { if (d <= L[i]) { const k = d / L[i]; return { p: [lerp(ZIG[i][0], ZIG[i + 1][0], k), lerp(ZIG[i][1], ZIG[i + 1][1], k)], dir: ZIG[i + 1][0] < ZIG[i][0] ? -1 : 1 }; } d -= L[i]; }
    return { p: ZIG.at(-1), dir: -1 };
  },
  paint(ctx, t, R) {
    R.L('sky'); R.L('col'); R.L('mist'); R.L('key');
    const tq = q8(t), a = SH.s34.t0;
    const u = seg(t, SH.s35.t0, SH.s35.t1 - .2), c = this.catAt(u);
    if (t < SH.s35.t0) return;
    if (t < SH.s39.t0) {
      R.fig(A => catSide(A, c.p[0], c.p[1] + 8, 80, c.dir, gait('run', (tq * 2.4) % 1), { t: tq }));
      R.fig(A => kite(A, lerp(1800, 1100, u), lerp(1700, 420, u), 130, -1, Math.sin(tq * 12), { fish: 1, t }));
      const v = seg(t, SH.s35.t0 + 1.4, SH.s35.t1 + 1), m = this.catAt(v * .55);
      R.fig(A => monger(A, m.p[0], m.p[1] + 10, 150, m.dir, manGait('run', (tq * 1.5) % 1), { pole: 'hand' }));
    } else {
      // summit: the cat on the top looking left to the sea; the kite flying off left
      const lt = t - SH.s39.t0;
      if (lt < 1.6) R.fig(A => catSide(A, 1090 - Math.max(0, lt - 1.4) * 260, 552, 80, -1, lt < 1.4 ? pose('stand', { ha: -.2, eye: 1.2, ear: .3 }) : gait('run', (q8(lt) * 2.4) % 1), { t: q8(lt) }));
      R.fig(A => kite(A, 900 - lt * 300, 380 - lt * 20, 120, -1, Math.sin(q8(lt) * 12), { fish: 1, t }));
    }
  },
};

// ————————————————————— SEA + the wave —————————————————————
export const SEA = { hz: 430, shore: 820 };
const WV = { base: 860 };
// the great wave (original): rises on the right, its lip curls leftward; r 0..1 rise, c 0..1 crash
const WF = { back: [[1990, 860], [1930, 720], [1820, 500], [1680, 310], [1520, 180], [1380, 128]],
  lip: [[1250, 132], [1140, 175], [1070, 245], [1048, 320], [1075, 382], [1125, 398]],
  curl: [[1150, 362], [1185, 322]],
  face: [[1215, 330], [1170, 450], [1100, 600], [990, 740], [840, 830], [700, 860]] };
export function waveShape(r, c = 0) {
  const low = ([x, y]) => [x + (1 - r) * 120, WV.base - (WV.base - y) * (.12 + .88 * r)];
  const curl = ss(seg(r, .35, 1)), crest = low(WF.back.at(-1));
  const L = ([x, y]) => { const q = low([x, y]), dx = (q[0] - crest[0]) * (.25 + .75 * curl), dy = (q[1] - crest[1]) * (.25 + .75 * curl); const a = -c * 1.3, ca = Math.cos(a), sa = Math.sin(a); return [crest[0] + dx * ca - dy * sa - c * 60, crest[1] + dx * sa + dy * ca + c * 260]; };
  const back = WF.back.map(low), lip = WF.lip.map(L), cu = WF.curl.map(L);
  const face = WF.face.map((p, i) => { const q = low(p); return i < 2 ? L(p) : [lerp(q[0], q[0] + 80, 1 - curl), q[1] + c * 40 * (i < 3 ? 1 : 0)]; });
  const h = WV.base - crest[1];
  return { h, back, lip, cu, face, crest, tip: lip.at(-1), top: crest, outline: [...back, ...lip, ...cu, ...face] };
}
export function drawWave(x, r, c, t12) {
  if (r <= 0) return null;
  const G = waveShape(r, c);
  x.save(); x.beginPath(); smooth(x, G.outline, true); x.clip();
  // three bands: light near the crest → Prussian → deep in the hollow, bokashi between (wide soft strokes)
  const g = x.createLinearGradient(0, G.crest[1], 0, WV.base); g.addColorStop(0, '#7aa0c4'); g.addColorStop(.3, PAL.prus); g.addColorStop(1, '#13284a'); x.fillStyle = g; x.fillRect(0, 0, W, 1100);
  x.lineCap = 'round'; x.lineJoin = 'round';
  for (const [w, col] of [[260, 'rgba(15,35,68,.35)'], [150, 'rgba(15,35,68,.45)'], [70, 'rgba(10,25,50,.5)']]) { x.strokeStyle = col; x.lineWidth = w; x.beginPath(); smooth(x, G.face.map(([a, b]) => [a + 30, b])); x.stroke(); }
  // white flow lines following the back slope, in groups of three
  x.strokeStyle = 'rgba(244,236,214,.88)';
  for (let k = 0; k < 7; k++) for (let j = 0; j < 3; j++) { const off = 60 + k * 85 + j * 16; x.lineWidth = 3.2 - j * .6; x.beginPath(); smooth(x, G.back.slice(1).map(([a, b], i) => [a - off * .8, b + off * .7 + Math.sin(i * 1.3 + k) * 8])); x.stroke(); }
  x.restore();
  x.strokeStyle = PAL.prusD; x.lineWidth = 3.4; x.lineJoin = 'round'; x.beginPath(); smooth(x, G.outline, true); x.stroke();
  // foam: claws hooking inward (to the left / down) along the crest and the lip, spray in clusters
  const Rn = mulberry(5 + Math.floor(t12 * 12) % 3), crestLine = [...G.back.slice(3), ...G.lip.slice(0, 4)];
  for (let i = 0; i < crestLine.length - 1; i++) {
    const [a, b] = crestLine[i], [a2, b2] = crestLine[i + 1], n = Math.atan2(b2 - b, a2 - a) - Math.PI / 2;
    for (let k = 0; k < 3; k++) { const s = (.6 + Rn() * .5) * (.35 + .65 * r); claw(x, lerp(a, a2, k / 3), lerp(b, b2, k / 3), n - .5, 80 * s, 34 * s, -1.0, { lw: 2.4, sub: 2, ink: PAL.prusD }); }
  }
  if (r > .6) { const sp = G.lip.slice(1); for (let i = 0; i < 26; i++) { const p = sp[i % sp.length], d = 30 + Rn() * 120, a = Math.PI + Rn() * 1.6 - .6, rr = i % 7 === 0 ? 11 : 3 + Rn() * 5; x.fillStyle = '#f4ecd6'; x.beginPath(); x.arc(p[0] + Math.cos(a) * d, p[1] + Math.sin(a) * d - 20, rr, 0, TAU); x.fill(); x.strokeStyle = PAL.prusD; x.lineWidth = 1.6; x.stroke(); } }
  return G;
}
function seaLayer(x, part) {
  if (part === 'sky') {
    bokashi(x, 0, FR.y0, W, 330, PAL.prus, .95, 0, { rough: 28, seed: 101 });
    bokashi(x, 0, SEA.hz, W, 1042, PAL.prusL, .9, 1, { rough: 16, seed: 103, col2: PAL.prusD });
  }
  if (part === 'col') {
    // beach (sand) bottom-left, a rocky point
    x.fillStyle = PAL.ochreL; x.beginPath(); x.moveTo(0, 760); x.quadraticCurveTo(500, 800, 1000, 1042); x.lineTo(0, 1042); x.fill();
    x.fillStyle = '#7d7466'; x.beginPath(); poly(x, [[0, 640], [120, 610], [220, 660], [300, 760], [0, 790]]); x.fill();
    pine(x, 120, 640, 1.2, { seed: 6, lean: .5, lines: false });
  }
  if (part === 'key') {
    K(x, [[0, SEA.hz], [W, SEA.hz]], 1.6, { taper: [0, 0] });
    K(x, [[0, 760], [500, 800], [1000, 1042]], 2.6);
    K(x, [[0, 640], [120, 610], [220, 660], [300, 760]], 2.4);
    pine(x, 120, 640, 1.2, { seed: 6, lean: .5, fills: false });
    // swell rows
    for (let r = 0; r < 9; r++) { const y = SEA.hz + 30 + r * r * 6.5, a = 8 + r * 2.5; const pts = []; for (let X = 0; X <= W; X += 40) pts.push([X, y - a * Math.pow(Math.abs(Math.sin((X + r * 77) * .012)), 3)]); if (r > 3) { const cut = pts.filter(p => p[0] > 250 + r * 60); if (cut.length > 1) K(x, cut, 1 + r * .2, { taper: [.1, .1], per: 2 }); } else K(x, pts, 1 + r * .2, { taper: [0, 0], per: 2 }); }
  }
}
export const SEAV = {
  id: 'sea', w: W, h: H, cart: { x: 130, y: 70, title: '六 怒涛', t0: () => SH.s40.t0 + .3 },
  layers: { sky: { g: 1, grain: .16, draw: x => seaLayer(x, 'sky') }, col: { g: 2, grain: .05, draw: x => seaLayer(x, 'col') }, key: { g: 0, speck: .12, draw: x => seaLayer(x, 'key') } },
  rise: t => t < SH.s40.t0 ? .15 : t < SH.s43.t0 ? lerp(.15, .5, ss(seg(t, SH.s40.t0, SH.s43.t0))) : t < SH.s46.t0 ? lerp(.5, 1, ss(seg(t, SH.s43.t0, SH.s45.t0 + 1))) : 1,
  crash: t => ei(seg(t, SH.s46.t0 - .2, SH.s47.t0 + .5)),
  paint(ctx, t, R) {
    R.L('sky'); R.L('col'); R.L('key');
    const tq = q8(t), r = this.rise(t), c = this.crash(t);
    let G = null; R.D(1, x => { G = drawWave(x, r, c, q12(t)); });
    if (!G) G = waveShape(r, c);
    // the boat: beached (s40) → pushed into the surf (s41) → on the wave face (s45) → down the back (s46)
    let bp, tilt = 0;
    if (t < SH.s41.t0) bp = [760, 838];
    else if (t < SH.s45.t0) { const u = ss(seg(t, SH.s41.t0, SH.s43.t1)); bp = [lerp(760, G.face[2][0] - 30, u), lerp(838, G.face[2][1] + 40, u)]; tilt = -.5 * u; }
    else if (t < SH.s46.t0) { bp = [G.face[2][0] - 30, G.face[2][1] + 40]; tilt = -.5; }
    else { const u = ss(seg(t, SH.s46.t0, SH.s46.t1)); bp = [lerp(G.face[2][0] - 30, 640, u), lerp(G.face[2][1] + 40, 850, u)]; tilt = lerp(-.5, .05, u); }
    R.fig(A => boat(A, bp[0], bp[1], 230, 1, { tilt, oar: true }));
    if (t < SH.s41.t1) [[-150, 1], [150, -1]].forEach(([dx, d], i) => R.fig(A => person(A, 760 + dx + (t >= SH.s41.t0 ? (t - SH.s41.t0) * 80 : 0), 860, 120, -d, 'fisher', (tq * 1.2 + i * .5) % 1)));
    // kite: with the fish until the spray hits it (s42), then up and away
    if (t < SH.s42.t0 + .6) R.fig(A => kite(A, 1250 + Math.sin(tq * 1.3) * 60, 230, 130, -1, Math.sin(tq * 12), { fish: t < SH.s42.t0 + .3 ? 1 : 0, t }));
    else R.fig(A => kite(A, 1250 + (t - SH.s42.t0) * 150, 230 - (t - SH.s42.t0) * 90, 120, 1, Math.sin(tq * 14), { t }));
    // the cat arrives down the beach (s40)
    if (t >= SH.s40.t0 && t < SH.s41.t0) { const u = seg(t, SH.s40.t0, SH.s40.t1); R.fig(A => catSide(A, lerp(150, 560, u), lerp(800, 880, u), 85, 1, gait('run', (tq * 2.6) % 1), { t: tq })); }
  },
};

export const VIEWS = { bridge: BRIDGE, rain: RAINV, snow: SNOWV, fields: FIELDS, pass: PASS, sea: SEAV };
// scroll layout (right → left): bridge at the right end
export const GAP = 260;
export const ORDER = ['sea', 'pass', 'fields', 'snow', 'rain', 'bridge'];
export const SLOT = {}; { let X = 0; for (const id of ORDER) { SLOT[id] = X; X += VIEWS[id].w + GAP; } }
// vertical placement: sheets share their bottom edge (y = 1080); tall sheets extend upward
export const SY = id => H - VIEWS[id].h;
