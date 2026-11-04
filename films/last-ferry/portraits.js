// Dialogue-box portraits: a bust (head + shoulders) drawn with the character face code at density 2 into a 48×48-unit box (96×96 px), shown at 2× in the box.
import { PX } from './px.js';
import { Pen, drawFace, CFG, PAL } from './chars.js';

const SPEC = {
  xs_ask:   { c: 'xs', expr: 'ask', look: .3 },
  xs_shy:   { c: 'xs', expr: 'shy', look: .2 },
  lz_smile: { c: 'lz', expr: 'smile' },
  lz_calm:  { c: 'lz', expr: 'calm' },
  lz_firm:  { c: 'lz', expr: 'firm' },
  br_joy:   { c: 'br', expr: 'happy' },
  ob_ask:   { c: 'ob', expr: 'ask', look: .2 },
  mo_fear:  { c: 'mo', expr: 'shout', look: .1 },
};
const cache = {};
export function portrait(key) {
  if (cache[key]) return cache[key];
  const sp = SPEC[key], c = CFG[sp.c], S = 2, P = new PX(48 * S, 48 * S), pen = new Pen(P, null, S);
  const kid = c.kind === 'child', r = kid ? 10 : 9.2, cx = 22, cy = kid ? 26 : 26;
  // shoulders / collar
  pen.poly([[4, 48], [44, 48], [40, 38], [30, 34], [14, 34], [8, 38]], (x, y) => c.top(.65 - (y - 34) * .02, x, y));
  if (c.towel) pen.poly([[8, 37], [14, 35], [16, 48], [10, 48]], (x, y) => PAL.towel(.6 + ((y >> 1) % 2) * .2, x, y));
  if (c.scarf) pen.poly([[14, 34], [30, 34], [22, 44]], (x, y) => PAL.red(.7, x, y));
  if (c.sash) pen.poly([[30, 34], [34, 36], [14, 48], [10, 46]], (x, y) => c.sash(.7, x, y));
  if (c.collar) pen.rect(16, 34, 12, 2, c.collar(.8, 0, 0));
  // neck
  pen.rect(cx - 3, cy + r * .8, 7, 6, c.skin(.4, 0, 0));
  drawFace(pen, { cx, cy, r, skin: c.skin, hair: c.hair, hairCol: c.hairCol, hat: c.hat, old: c.old, kid, expr: sp.expr, look: sp.look || 0, flower: c.flower });
  P.outline(.3);
  return (cache[key] = P.done());
}
export const PORTRAITS = Object.keys(SPEC);
