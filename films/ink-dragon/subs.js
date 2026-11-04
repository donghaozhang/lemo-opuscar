// Inscriptions (题跋): the film's only text. Ma Shan Zheng, ink-coloured, no box, a small vermilion square at the head of each line, placed in the shot's
// blank paper; they appear wet and dry in a fraction of a second. Screen space (the camera transform is reset).
import { clamp, VERM } from './util.js';
export function inscription(A, text, x, y, a = 1, o = {}) {
  if (a <= 0) return null;
  const size = o.size || 52, vertical = o.vertical ?? true, chars = [...text];
  const wetK = clamp(1 - a) * .8;
  for (const [ctx, k] of [[A.cw, wetK + .18], [A.cd, 1 - wetK * .6]]) {
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = clamp(a * k * .88); ctx.fillStyle = '#000';
    ctx.font = `${size}px "Ma Shan Zheng"`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    chars.forEach((ch, i) => { const px = vertical ? x : x + (i + .5) * size * 1.04, py = vertical ? y + (i + .5) * size * 1.1 : y; ctx.fillText(ch, px, py); });
    ctx.restore();
  }
  const s = size * .3, cc = A.cc;
  cc.save(); cc.setTransform(1, 0, 0, 1, 0, 0); cc.globalAlpha = clamp(a * .92); cc.fillStyle = `rgb(${VERM.join(',')})`;
  if (vertical) cc.fillRect(x - s / 2, y - s * 1.4, s, s); else cc.fillRect(x - s * .6, y - s / 2, s, s);
  cc.restore();
  const n = chars.length;
  return vertical ? [x - size * .6, y - s * 1.5, x + size * .6, y + n * size * 1.1] : [x - s, y - size * .6, x + n * size * 1.04, y + size * .6];
}
