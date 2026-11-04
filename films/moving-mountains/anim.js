// 愚公移山 · motion helpers: easing, walk/run cycles, swings, the knife overlay, misc
import { clamp, lerp } from '/core/lib.js';
import { blend } from './chars.js';
export const PI = Math.PI;
export const ss = u => { u = clamp(u); return u * u * (3 - 2 * u); };
export const eio = u => { u = clamp(u); return u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
export const eo = u => 1 - Math.pow(1 - clamp(u), 3);
export const ei = u => Math.pow(clamp(u), 3);
export const seg = (t, a, b) => clamp((t - a) / (b - a));
export const tw = t => Math.floor(t * 12) / 12;          // twos
// piecewise keyed value: keys [[t, v], ...] smooth between
export function key(keys, t, e = ss) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (t < keys[i][0]) { const u = e((t - keys[i - 1][0]) / (keys[i][0] - keys[i - 1][0])); const a = keys[i - 1][1], b = keys[i][1]; return typeof a === 'number' ? lerp(a, b, u) : (Array.isArray(a) ? a.map((v, j) => lerp(v, b[j], u)) : blend(a, b, u)); }
  return keys[keys.length - 1][1];
}
// walk cycle (phase in cycles); stride 0..1, base pose merged
export function walk(ph, base = {}, o = {}) {
  const a = ph * 2 * PI, st = o.stride ?? .38, arm = o.arm ?? .3;
  return { ...base, q1: st * Math.sin(a), q2: -st * Math.sin(a), k1: .55 * Math.max(0, Math.sin(a + 1.9)) + .06, k2: .55 * Math.max(0, Math.sin(a + 1.9 + PI)) + .06,
    a1: (base.a1 ?? 0) - arm * Math.sin(a), a2: (base.a2 ?? 0) + arm * Math.sin(a), lift: (o.bob ?? 6) * Math.abs(Math.sin(a)) };
}
export function run(ph, base = {}) {
  const a = ph * 2 * PI;
  return { ...base, lean: (base.lean ?? 0) + .28, q1: .75 * Math.sin(a), q2: -.75 * Math.sin(a), k1: 1.2 * Math.max(0, Math.sin(a + 1.6)) + .2, k2: 1.2 * Math.max(0, Math.sin(a + 1.6 + PI)) + .2,
    a1: -.9 * Math.sin(a) - .2, e1: -1.3, a2: .9 * Math.sin(a) - .2, e2: -1.3, lift: 18 * Math.abs(Math.sin(a)) };
}
// a pick / hoe swing: phase 0..1 (0 = raised, .5 = strike, 1 = raised again) with anticipation + follow-through
export function swingPose(u, base = {}) {
  const up = { lean: -.12, a1: -2.7, e1: -.5, a2: -2.5, e2: -.6, head: -.15, q1: .25, k1: .2, q2: -.15 };
  const hit = { lean: .55, a1: -.7, e1: -.15, a2: -.55, e2: -.2, head: .2, q1: .45, k1: .45, q2: -.3, k2: .1 };
  let p;
  if (u < .35) p = blend(up, { ...up, a1: -2.95, a2: -2.75, lean: -.2 }, ss(u / .35));                // anticipation: wind further back
  else if (u < .45) p = blend({ ...up, a1: -2.95, a2: -2.75, lean: -.2 }, hit, (u - .35) / .1);          // the strike: 2–3 frames
  else if (u < .6) p = hit;                                                                            // settle
  else p = blend(hit, up, ss((u - .6) / .4));
  return { ...base, ...p };
}
// the carver's real knife (drawn on the composited frame in its own colours: steel and boxwood)
export function knife(g, x, y, ang = -2.3, k = 1, o = {}) {
  g.save(); g.translate(x, y); g.rotate(ang); g.scale(k, k);
  // shadow
  g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(160, 26, 170, 16, 0, 0, PI * 2); g.fill();
  // blade (U-gouge)
  const gr = g.createLinearGradient(0, -10, 0, 10); gr.addColorStop(0, '#d9dcdc'); gr.addColorStop(.5, '#8d9396'); gr.addColorStop(1, '#4a4f52');
  g.fillStyle = gr; g.beginPath(); g.moveTo(0, -4); g.lineTo(110, -9); g.lineTo(118, 9); g.lineTo(0, 5); g.quadraticCurveTo(-6, 0, 0, -4); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(4, -3); g.lineTo(108, -7); g.stroke();
  // ferrule
  g.fillStyle = '#6b5a3a'; g.fillRect(112, -12, 16, 24);
  // handle
  const hg = g.createLinearGradient(0, -20, 0, 20); hg.addColorStop(0, '#c99a5c'); hg.addColorStop(.5, '#9a6a35'); hg.addColorStop(1, '#5e3c1c');
  g.fillStyle = hg; g.beginPath(); g.moveTo(128, -13); g.quadraticCurveTo(220, -26, 300, -18); g.quadraticCurveTo(318, 0, 300, 18); g.quadraticCurveTo(220, 26, 128, 13); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(60,35,15,.5)'; g.lineWidth = 1.2; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(140, i * 4); g.quadraticCurveTo(220, i * 6, 296, i * 4); g.stroke(); }
  g.restore();
}
