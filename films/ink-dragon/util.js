// Shared helpers: camera (world → screen), layer blits, 2D noise, small geometry
import { lerp, clamp, vnoise } from '/core/lib.js';
export const VERM = [176, 46, 34];
export const W = 1920, H = 1080;

// Camera {x, y, z}: world point (x, y) sits at the screen centre, z = zoom (screen px per world unit)
export const camXf = cam => ({ s: cam.z, tx: W / 2 - cam.x * cam.z, ty: H / 2 - cam.y * cam.z });
export const toScreen = (cam, x, y) => { const { s, tx, ty } = camXf(cam); return [x * s + tx, y * s + ty]; };
export const paperOf = cam => { const { s, tx, ty } = camXf(cam); return [-tx, -ty, s]; };

export const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
// an off-screen picture (wet + dry) of a given size, with ink contexts
export function layer(w, h) {
  const wet = cv(w, h), dry = cv(w, h);
  return { wet, dry, w, h, ink: { wet: wet.getContext('2d'), dry: dry.getContext('2d') } };
}
// paste a world layer (its origin at world (ox, oy), 1 unit = 1 px) into A through the camera
export function blit(A, lay, cam, am = 1, ox = 0, oy = 0, scale = 1) {
  const { s, tx, ty } = camXf(cam);
  for (const k of ['wet', 'dry']) {
    const c = A.ink[k]; c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = am;
    c.drawImage(lay[k], tx + ox * s, ty + oy * s, lay.w * s * scale, lay.h * s * scale); c.restore();
  }
}
// fade a layer's ink with a linear gradient mask (destination-in), in layer pixels
export function fadeLayer(lay, x0, y0, x1, y1, a0 = 1, a1 = 0) {
  for (const k of ['wet', 'dry']) {
    const c = lay.ink[k]; c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'destination-in';
    const g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, `rgba(0,0,0,${a0})`); g.addColorStop(1, `rgba(0,0,0,${a1})`);
    c.fillStyle = g; c.fillRect(0, 0, lay.w, lay.h); c.restore();
  }
}

// 2D value noise and fbm
const h2 = (x, y) => { const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); };
export function vn2(x, y) {
  const i = Math.floor(x), j = Math.floor(y), f = x - i, g = y - j, u = f * f * (3 - 2 * f), v = g * g * (3 - 2 * g);
  return lerp(lerp(h2(i, j), h2(i + 1, j), u), lerp(h2(i, j + 1), h2(i + 1, j + 1), u), v);
}
export const fbm2 = (x, y) => vn2(x, y) * .5 + vn2(x * 2.07 + 5.1, y * 2.07 + 1.3) * .3 + vn2(x * 4.3 + 9, y * 4.3 + 3) * .2;
export const fbm = x => vnoise(x) * .55 + vnoise(x * 2.1 + 17) * .28 + vnoise(x * 4.7 + 41) * .17;

// geometry
export const add2 = (a, b) => [a[0] + b[0], a[1] + b[1]];
export const mid = (a, b, t = .5) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
export const rot = (p, c, a) => { const s = Math.sin(a), co = Math.cos(a), x = p[0] - c[0], y = p[1] - c[1]; return [c[0] + x * co - y * s, c[1] + x * s + y * co]; };
export const curve = (a, c, b, n) => { const o = []; for (let i = 0; i < n; i++) { const t = n === 1 ? .5 : i / (n - 1), u = 1 - t; o.push([u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]); } return o; };
// step time on twos (12 fps) for figure poses
export const twos = t => Math.floor(t * 12) / 12;
// piecewise keyframes: [[t, value], ...] with an easing on each segment
export function keys(ks, t, ease = x => x) {
  if (t <= ks[0][0]) return ks[0][1]; const n = ks.length; if (t >= ks[n - 1][0]) return ks[n - 1][1];
  let i = 0; while (t > ks[i + 1][0]) i++;
  const u = ease(clamp((t - ks[i][0]) / (ks[i + 1][0] - ks[i][0])));
  const a = ks[i][1], b = ks[i + 1][1];
  return Array.isArray(a) ? a.map((v, j) => lerp(v, b[j], u)) : lerp(a, b, u);
}
// an eased pulse 0→1→0 over [a, b]
export const pulse = (t, a, b, k = .5) => { const u = clamp((t - a) / (b - a)); return Math.sin(Math.PI * Math.pow(u, k)); };
export { lerp, clamp, vnoise };
