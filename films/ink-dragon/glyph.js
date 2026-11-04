// Calligraphy. The title 墨龙借雨 is written stroke by stroke by the brush engine: each stroke's centreline is authored by hand in stroke order in a
// 100×100 cell, then snapped onto the medial axis of the real glyph of Ma Shan Zheng (OFL) by hill-climbing a distance transform, with the brush
// pressure taken from the glyph's local thickness; the written strokes are finally clipped by the slightly expanded glyph outline. Stroke order,
// hidden-tip entries, lift-and-press and flying white come from the engine; structure and centre of gravity from the glyph.
// The colophon and inscriptions use the font directly at small size (wet + dry copies: they bleed and dry like the rest).
import { mk, draw, TONE } from './ink.js';
import { lerp, clamp, cv } from './util.js';

// rough centrelines, stroke order, 100-unit cell (y down). The third number is the pressure hint.
export const STROKES = {
  '墨': [
    [[28, 6], [27, 32]], [[28, 6], [72, 6], [72, 32]], [[29, 19], [71, 19]], [[50, 6], [50, 58]], [[29, 32], [71, 32]],
    [[24, 45], [76, 45]], [[14, 58], [86, 58]],
    [[22, 68], [26, 78]], [[38, 67], [41, 78]], [[58, 67], [61, 78]], [[74, 68], [78, 78]],
    [[28, 84], [72, 84]], [[50, 80], [50, 96]], [[12, 96], [88, 96]],
  ],
  '龙': [
    [[20, 22], [62, 19]], [[47, 8], [38, 38], [16, 66]], [[42, 36], [40, 60], [42, 78], [58, 90], [88, 82]], [[66, 40], [56, 62]], [[74, 36], [88, 50]],
  ],
  '借': [
    [[22, 10], [10, 34]], [[20, 24], [20, 92]],
    [[36, 22], [90, 22]], [[50, 10], [50, 40]], [[74, 10], [74, 40]], [[32, 40], [92, 40]],
    [[42, 52], [42, 92]], [[42, 52], [82, 52], [82, 92]], [[44, 70], [80, 70]], [[44, 92], [80, 92]],
  ],
  '雨': [
    [[10, 10], [90, 10]], [[14, 28], [14, 92]], [[14, 28], [86, 28], [86, 86], [78, 93]], [[50, 12], [50, 94]],
    [[28, 44], [36, 52]], [[28, 66], [36, 74]], [[62, 44], [70, 52]], [[62, 66], [70, 74]],
  ],
};

const GRES = 300;   // analysis resolution of one character cell
const cache = {};

// rasterise the glyph into a cell and compute the distance transform (distance to the nearest paper pixel, in cell px)
function analyse(ch) {
  if (cache[ch]) return cache[ch];
  const c = cv(GRES, GRES), g = c.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, GRES, GRES);
  g.fillStyle = '#000'; g.font = `${GRES * .86}px "Ma Shan Zheng"`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(ch, GRES / 2, GRES / 2 + GRES * .03);
  const d = g.getImageData(0, 0, GRES, GRES).data, ink = new Uint8Array(GRES * GRES);
  let x0 = GRES, x1 = 0, y0 = GRES, y1 = 0;
  for (let i = 0; i < GRES * GRES; i++) { ink[i] = d[i * 4] < 128 ? 1 : 0; if (ink[i]) { const x = i % GRES, y = (i / GRES) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
  // two-pass chamfer distance transform (3-4)
  const INF = 1e6, D = new Float32Array(GRES * GRES);
  for (let i = 0; i < GRES * GRES; i++) D[i] = ink[i] ? INF : 0;
  for (let y = 1; y < GRES; y++) for (let x = 0; x < GRES; x++) { const i = y * GRES + x; if (!ink[i]) continue; let v = D[i]; v = Math.min(v, D[i - GRES] + 3); if (x > 0) v = Math.min(v, D[i - 1] + 3, D[i - GRES - 1] + 4); if (x < GRES - 1) v = Math.min(v, D[i - GRES + 1] + 4); D[i] = v; }
  for (let y = GRES - 2; y >= 0; y--) for (let x = GRES - 1; x >= 0; x--) { const i = y * GRES + x; if (!ink[i]) continue; let v = D[i]; v = Math.min(v, D[i + GRES] + 3); if (x < GRES - 1) v = Math.min(v, D[i + 1] + 3, D[i + GRES + 1] + 4); if (x > 0) v = Math.min(v, D[i + GRES - 1] + 4); D[i] = v; }
  // the glyph's bounding box in cell units (0..100) so hand strokes authored in a 100 box map onto it
  const box = { x0: x0 / GRES * 100, y0: y0 / GRES * 100, x1: x1 / GRES * 100, y1: y1 / GRES * 100 };
  return (cache[ch] = { ink, D, box, canvas: c });
}

// snap one authored stroke onto the glyph: map the 100-box onto the glyph's bounding box, then climb the distance field
function snap(ch, pts) {
  const { ink, D, box } = analyse(ch);
  const map = p => [GRES * (box.x0 + p[0] / 100 * (box.x1 - box.x0)) / 100, GRES * (box.y0 + p[1] / 100 * (box.y1 - box.y0)) / 100];
  // densify
  const P = []; for (let i = 0; i < pts.length - 1; i++) { const a = map(pts[i]), b = map(pts[i + 1]), n = Math.max(2, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 6)); for (let k = 0; k < n; k++) P.push([lerp(a[0], b[0], k / n), lerp(a[1], b[1], k / n)]); }
  P.push(map(pts[pts.length - 1]));
  const at = (x, y) => { x = Math.round(clamp(x, 0, GRES - 1)); y = Math.round(clamp(y, 0, GRES - 1)); return D[y * GRES + x]; };
  const out = [];
  for (const [ox, oy] of P) {
    let x = ox, y = oy;
    // if outside the ink, walk to the nearest ink pixel within 14 px
    if (!at(x, y)) { let best = null, bd = 1e9; for (let dy = -14; dy <= 14; dy++) for (let dx = -14; dx <= 14; dx++) { const xx = Math.round(x + dx), yy = Math.round(y + dy); if (xx < 0 || yy < 0 || xx >= GRES || yy >= GRES) continue; if (ink[yy * GRES + xx]) { const dd = dx * dx + dy * dy; if (dd < bd) { bd = dd; best = [xx, yy]; } } } if (best) { x = best[0]; y = best[1]; } }
    // hill-climb the distance field (towards the stroke's centre), limited to 12 px from the authored point
    for (let it = 0; it < 14; it++) {
      let bx = x, by = y, bv = at(x, y);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) { const v = at(x + dx, y + dy); if (v > bv && Math.hypot(x + dx - ox, y + dy - oy) <= 12) { bv = v; bx = x + dx; by = y + dy; } }
      if (bx === x && by === y) break; x = bx; y = by;
    }
    out.push([x / GRES * 100, y / GRES * 100, at(x, y) / 3 / GRES * 100]);   // third = local half-width in cell units
  }
  // smooth positions a little and derive pressure from the half-width
  const sm = out.map((p, i) => { const a = out[Math.max(0, i - 1)], b = out[Math.min(out.length - 1, i + 1)]; return [(a[0] + 2 * p[0] + b[0]) / 4, (a[1] + 2 * p[1] + b[1]) / 4, p[2]]; });
  const med = sm.map(p => p[2]).sort((a, b) => a - b)[Math.floor(sm.length / 2)] || 3;
  return { pts: sm.map(p => [p[0], p[1], clamp(p[2] / (med || 1), .55, 1.35)]), hw: med };
}

const built = {};
// strokes of one character placed in a world box [x, y, size] (cell → world); returns mk() strokes in order
export function charStrokes(ch, box, o = {}) {
  const key = ch + '|' + box.join(',') + '|' + (o.seed || 0);
  if (built[key]) return built[key];
  const [x0, y0, S] = box, k = S / 100;
  const list = STROKES[ch].map((st, i) => {
    const { pts, hw } = snap(ch, st);
    const P = pts.map(p => [x0 + p[0] * k, y0 + p[1] * k, p[2]]);
    // hidden-tip entry: a short lead-in back along the first segment; tapered exit by the profile
    const a = P[0], b = P[Math.min(2, P.length - 1)], dx = a[0] - b[0], dy = a[1] - b[1], L = Math.hypot(dx, dy) || 1;
    P.unshift([a[0] + dx / L * S * .03, a[1] + dy / L * S * .03, .55]);
    return mk(P, { w: hw * 2 * k * (o.wk ?? 1.15), tone: TONE.jiao, dry: o.dry ?? .2, wet: o.wet ?? .35, prof: 'even', rough: .07, nb: 40, solid: true, seed: (o.seed ?? 71) * 100 + i, per: 4 });
  });
  return (built[key] = list);
}
// write a character by progress p (0..1 over all its strokes), into a temporary layer T then clipped by the glyph mask and pasted on A (screen-space transforms:
// the caller passes the world→screen transform `xf` (DOMMatrix) used for both the strokes and the mask)
export function writeChar(A, T, ch, box, p, xf, o = {}) {
  const S = charStrokes(ch, box, o);
  for (const c of [T.ink.wet, T.ink.dry]) { c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.clearRect(0, 0, T.wet.width, T.wet.height); c.setTransform(xf); }
  const N = S.length, tot = S.reduce((a, s) => a + s.len + box[2] * .12, 0); let acc = 0, any = false;
  for (const s of S) { const t0 = acc / tot, t1 = (acc + s.len + box[2] * .12) / tot; acc += s.len + box[2] * .12; const pp = (p - t0) / (t1 - t0); if (pp > 0) { draw(T.ink, s, Math.min(1, pp), o.am ?? 1); any = true; } }
  if (!any) return S;
  // clip by the glyph outline drawn through the same transform
  const mask = cv(T.wet.width, T.wet.height), mg = mask.getContext('2d'); mg.setTransform(xf);
  const { box: gb } = analyse(ch); const sS = box[2] / ((gb.x1 - gb.x0) / 100 * GRES);
  mg.translate(box[0] - gb.x0 / 100 * GRES * sS, box[1] - gb.y0 / 100 * GRES * sS); mg.scale(sS, sS);
  mg.fillStyle = '#000'; mg.font = `${GRES * .86}px "Ma Shan Zheng"`; mg.textAlign = 'center'; mg.textBaseline = 'middle';
  mg.fillText(ch, GRES / 2, GRES / 2 + GRES * .03); mg.strokeStyle = '#000'; mg.lineWidth = GRES * .02; mg.lineJoin = 'round'; mg.strokeText(ch, GRES / 2, GRES / 2 + GRES * .03);
  for (const key of ['wet', 'dry']) {
    const c = T.ink[key]; c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'destination-in'; c.drawImage(mask, 0, 0); c.globalCompositeOperation = 'source-over';
    const d = A.ink[key]; d.save(); d.setTransform(1, 0, 0, 1, 0, 0); d.drawImage(T[key], 0, 0); d.restore();
  }
  return S;
}
// where the brush tip is while writing: stroke i at progress p (world units)
export function tipAt(S, p, box) {
  const tot = S.reduce((a, s) => a + s.len + box[2] * .12, 0); let acc = 0;
  for (const s of S) { const t0 = acc / tot, t1 = (acc + s.len + box[2] * .12) / tot; acc += s.len + box[2] * .12; if (p < t1 || s === S[S.length - 1]) { const pp = clamp((p - t0) / (t1 - t0)), m = (s.n - 1) * pp, k = Math.floor(m), f = m - k, a = s.P[k], b = s.P[Math.min(s.n - 1, k + 1)]; return { x: lerp(a[0], b[0], f), y: lerp(a[1], b[1], f), lifted: pp >= 1 || pp <= 0 }; } }
  return null;
}

// Small text written with the font (vertical column or horizontal line) into wet + dry layers of A; am = alpha, wetK = share in the wet layer
// (world coordinates under the current transform). run > 0 smears copies downward (ink that has run in the rain).
export function inkText(A, text, x, y, size, o = {}) {
  const am = o.am ?? 1, wetK = o.wetK ?? .35, vertical = o.vertical ?? true, run = o.run ?? 0, font = o.font || 'Ma Shan Zheng';
  const chars = [...text];
  for (const [ctx, k, w] of [[A.ink.wet, wetK, 'wet'], [A.ink.dry, 1 - wetK * .5, 'dry']]) {
    ctx.save(); ctx.fillStyle = '#000'; ctx.font = `${size}px "${font}"`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const put = (dx, dy, a) => { ctx.globalAlpha = clamp(a); chars.forEach((ch, i) => { const px = vertical ? x : x + (i + .5) * size * 1.02, py = vertical ? y + (i + .5) * size * 1.08 : y; ctx.fillText(ch, px + dx, py + dy); }); };
    put(0, 0, am * k * (o.tone ?? .85));
    if (run > 0 && w === 'wet') for (let j = 1; j <= 5; j++) put(0, j * size * .11 * run, am * .22 * run * (1 - j / 6));
    if (run > 0 && w === 'wet') put(0, 0, am * .3 * run);
    ctx.restore();
  }
  const n = chars.length;
  return vertical ? [x - size * .55, y, x + size * .55, y + n * size * 1.08] : [x, y - size * .55, x + n * size * 1.02, y + size * .55];
}
