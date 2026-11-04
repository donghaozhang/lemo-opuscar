// font.js — Fusion Pixel Font (OFL) as a 1-bit glyph atlas (glyphs.json, built by tools/glyphs.py), drawn on the native grid
import { C, T } from './px.js';
const G = await (await fetch('./glyphs.json')).json();
export const MISSING = new Set(); window.MISSING = MISSING;
const TOP = { 12: 2, 8: 2 };          // empty rows above the glyph box in the atlas
export const LH = { 12: 13, 8: 9 };   // drawn line height (px)

export function textW(s, size = 12) {
  let w = 0; for (const ch of s) { const g = G[size].g[ch]; if (!g) { MISSING.add(ch); w += size; continue; } w += g[0]; } return w;
}
// draw string; y = top of the line box. opts: shadow colour, outline colour (8-neighbour), map(row)→colour for gradients
export function text(fb, s, x, y, col = C.white, o = {}) {
  const size = o.size || 12, A = G[size], top = TOP[size];
  const draw = (ox, oy, cf) => {
    let cx = Math.round(x) + ox;
    for (const ch of s) {
      const g = A.g[ch]; if (!g) { MISSING.add(ch); cx += size; continue; }
      const [adv, , rows] = g;
      for (let r = 0; r < rows.length; r++) { const v = rows[r]; if (!v) continue; for (let b = 0; b < 16; b++) if (v >> b & 1) fb.px(cx + b, Math.round(y) + oy + r - top, cf(r - top)); }
      cx += adv;
    }
  };
  if (o.outline !== undefined) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1], [0, 2], [1, 2], [-1, 2]]) draw(dx, dy, () => o.outline);
  if (o.shadow !== undefined) draw(1, 1, () => o.shadow);
  draw(0, 0, typeof col === 'function' ? col : () => col);
  return textW(s, size);
}
// 2× text (titles): each atlas pixel becomes 2×2
export function text2(fb, s, x, y, colRow, o = {}) {
  const size = o.size || 12, A = G[size], top = TOP[size];
  const draw = (ox, oy, cf) => {
    let cx = Math.round(x);
    for (const ch of s) {
      const g = A.g[ch]; if (!g) { MISSING.add(ch); cx += size * 2; continue; }
      const [adv, , rows] = g;
      for (let r = 0; r < rows.length; r++) { const v = rows[r]; if (!v) continue; for (let b = 0; b < 16; b++) if (v >> b & 1) { const X = cx + b * 2 + ox, Y = Math.round(y) + (r - top) * 2 + oy; const c = cf((r - top) * 2); fb.px(X, Y, c); fb.px(X + 1, Y, c); fb.px(X, Y + 1, cf((r - top) * 2 + 1)); fb.px(X + 1, Y + 1, cf((r - top) * 2 + 1)); } }
      cx += adv * 2 + (o.track || 0);
    }
  };
  if (o.outline !== undefined) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1], [0, 2], [1, 2], [-1, 2], [0, 3]]) draw(dx, dy, () => o.outline);
  draw(0, 0, typeof colRow === 'function' ? colRow : () => colRow);
}
export const text2W = (s, size = 12, track = 0) => textW(s, size) * 2 + track * [...s].length;
// wrap Chinese text into lines no wider than w (break anywhere except before closing punctuation)
const NOSTART = '，。！？、：；）」』…—~～';
export function wrap(s, w, size = 12) {
  const out = []; let line = '';
  for (const ch of s) {
    if (ch === '\n') { out.push(line); line = ''; continue; }
    if (textW(line + ch, size) > w && line && !NOSTART.includes(ch)) { out.push(line); line = ''; }
    line += ch;
  }
  if (line) out.push(line); return out;
}
