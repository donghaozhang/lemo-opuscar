// Rig helpers shared by every puppet: 2D matrices, two-bone IK, pendulum chains (pre-simulated), keyframe tracks, press-on / lift-off, tremor
import { clamp, lerp, seg, ss, eo, ei, vnoise } from '/core/lib.js';
import { drawPiece, rivet } from './carve.js';

// —— matrices [a,b,c,d,e,f] ——
export const mul = (A, B) => [A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1], A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3], A[0] * B[4] + A[2] * B[5] + A[4], A[1] * B[4] + A[3] * B[5] + A[5]];
export const T = (x, y) => [1, 0, 0, 1, x, y];
export const R = a => { const c = Math.cos(a), s = Math.sin(a); return [c, s, -s, c, 0, 0]; };
export const S = (k, l = k) => [k, 0, 0, l, 0, 0];
export const ap = (M, x, y) => [M[0] * x + M[2] * y + M[4], M[1] * x + M[3] * y + M[5]];
export const set = (g, M) => g.setTransform(M[0], M[1], M[2], M[3], M[4], M[5]);
export const scaleOf = M => Math.sqrt(Math.abs(M[0] * M[3] - M[1] * M[2]));
// camera [cx, cy, z] → matrix (world → viewport); flip: mirror x (seen from behind)
export const camM = ([cx, cy, z], flip = 1) => [z * flip, 0, 0, z, 960 - cx * z * flip, 540 - cy * z];
export const dp = (g, M, pc) => { set(g, M); drawPiece(g, pc); };

// —— two-bone IK: shoulder s → target p (world); returns absolute angles (0 = bone hanging straight down) of the two bones ——
export function ik(s, p, L1, L2, bend = 1) {
  let dx = p[0] - s[0], dy = p[1] - s[1], d = Math.hypot(dx, dy);
  d = Math.max(Math.abs(L1 - L2) + 1, Math.min(L1 + L2 - .3, d));
  const phi = Math.atan2(dy, dx), al = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
  const a1 = phi + bend * al, e = [s[0] + Math.cos(a1) * L1, s[1] + Math.sin(a1) * L1];
  const a2 = Math.atan2(p[1] - e[1], p[0] - e[0]);
  return [a1 - Math.PI / 2, a2 - Math.PI / 2, e];
}

// —— keyframe tracks: keys = [[t, {a: 1, b: [x,y], m: 'smile'}, easeName?], ...]; numbers and arrays blend, strings switch at the key ——
const EASES = { lin: t => t, ss, eo, ei, eio: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2, hold: () => 0, snap: () => 1 };
export function keys(list) {
  list = list.slice().sort((a, b) => a[0] - b[0]);
  return t => {
    if (t <= list[0][0]) return { ...list[0][1] };
    let i = 0; while (i < list.length - 1 && t >= list[i + 1][0]) i++;
    const A = list[i], B = list[i + 1];
    if (!B) return { ...A[1] };
    const e = EASES[B[2] || 'ss'], u = e(seg(t, A[0], B[0]));
    const o = { ...A[1] };
    for (const k of Object.keys(B[1])) {
      const a = A[1][k], b = B[1][k];
      if (typeof b === 'number' && typeof a === 'number') o[k] = lerp(a, b, u);
      else if (Array.isArray(b) && Array.isArray(a)) o[k] = b.map((v, j) => lerp(a[j] ?? v, v, u));
      else o[k] = u >= 1 || (typeof b === 'string' && u > 0) ? b : (a ?? b);
    }
    return o;
  };
}
// blend two pose objects
export function mixPose(A, B, u) {
  const o = { ...A };
  for (const k of Object.keys(B)) {
    const a = A[k], b = B[k];
    if (typeof b === 'number' && typeof a === 'number') o[k] = lerp(a, b, u);
    else if (Array.isArray(b) && Array.isArray(a)) o[k] = b.map((v, j) => lerp(a[j] ?? v, v, u));
    else o[k] = u < .5 ? (a ?? b) : b;
  }
  return o;
}

// —— pendulum chains, pre-simulated at 120 Hz over [t0,t1] from a driver function → sampler(t) giving per-link angles ——
// drive(t) returns {x, y, a} of the chain root (world or local), links n; k spring, c damping; gravity pulls toward rest angle
export function pendulum(drive, t0, t1, n = 6, k = 55, c = 4.5, gain = [.0022, .9], limit = .8) {
  const dt = 1 / 120, N = Math.ceil((t1 - t0) / dt) + 2, out = new Float32Array(N * n);
  let phi = new Float64Array(n), om = new Float64Array(n), prev = null, pv = [0, 0, 0];
  for (let i = 0; i < N; i++) {
    const t = t0 + i * dt, d = drive(t);
    const v = prev ? [(d.x - prev.x) / dt, (d.y - prev.y) / dt, (d.a - prev.a) / dt] : [0, 0, 0];
    const acc = prev ? [(v[0] - pv[0]) / dt, (v[1] - pv[1]) / dt, (v[2] - pv[2]) / dt] : [0, 0, 0];
    prev = d; pv = v;
    for (let j = 0; j < n; j++) {
      const kk = k * (1 + j * .25), cc = c * (1 + j * .1);
      const f = -kk * phi[j] - cc * om[j] - gain[0] * clamp(acc[0], -5000, 5000) * (1 + j * .3) - gain[1] * clamp(acc[2], -500, 500) * (1 + j * .2) + (j ? 18 * (phi[j - 1] - phi[j]) : 0);
      om[j] += f * dt; phi[j] += om[j] * dt; phi[j] = clamp(phi[j], -limit, limit);
    }
    for (let j = 0; j < n; j++) out[i * n + j] = phi[j];
  }
  return t => { const i = clamp(Math.round((t - t0) * 120), 0, N - 1); const r = []; for (let j = 0; j < n; j++) r.push(out[i * n + j]); return r; };
}

// —— press-on (arrival) / lift-off (exit): returns {sc, blur, alpha} for a piece near the lamp ——
export const pressOn = (t, t0, d = .5) => { const u = eo(seg(t, t0, t0 + d)); return { sc: 1 + (1 - u) * 1.5, blur: (1 - u) * 30, alpha: .3 + .7 * u }; };
export const liftOff = (t, t0, d = .9) => { const u = ei(seg(t, t0, t0 + d)); return { sc: 1 + u * .9, blur: u * 30, alpha: 1 - u, dy: -u * 40 }; };
// hand tremor on every puppet (world px / rad), stronger under tension
export const tremor = (t, k = 1, seed = 0) => ({ x: (vnoise(t * 2.1 + seed) - .5) * 3 * k, y: (vnoise(t * 2.7 + 9 + seed) - .5) * 2.4 * k, a: (vnoise(t * 1.7 + 4 + seed) - .5) * .018 * k });

// draw a chain (tassel / tail / ribbon / beard strip) as a tapering ribbon with carved cross bars
export function ribbon(g, base, dir0, n, segL, curl, dyn, w0, col, col2, K = 1, taper = .62) {
  const pts = [[base[0], base[1]]]; let a = dir0, x = base[0], y = base[1];
  for (let i = 0; i < n; i++) { a += curl + (dyn ? dyn[i] || 0 : 0); x += Math.cos(a) * segL; y += Math.sin(a) * segL; pts.push([x, y]); }
  const L = [], Rr = [];
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], q = pts[Math.min(i + 1, pts.length - 1)], o = pts[Math.max(i - 1, 0)];
    const dx = q[0] - o[0], dy = q[1] - o[1], l = Math.hypot(dx, dy) || 1, w = w0 * (1 - i / pts.length * taper);
    L.push([p[0] - dy / l * w, p[1] + dx / l * w]); Rr.push([p[0] + dy / l * w, p[1] - dx / l * w]);
  }
  g.beginPath(); g.moveTo(L[0][0], L[0][1]); for (const p of L) g.lineTo(p[0], p[1]); for (let i = Rr.length - 1; i >= 0; i--) g.lineTo(Rr[i][0], Rr[i][1]); g.closePath();
  g.fillStyle = col; g.fill();
  if (col2) for (let i = 1; i < pts.length - 1; i += 2) {
    const p0 = L[i], p1 = Rr[i], q0 = L[i + 1], q1 = Rr[i + 1];
    g.beginPath(); g.moveTo(p0[0], p0[1]); g.lineTo(p1[0], p1[1]); g.lineTo((p1[0] + q1[0]) / 2, (p1[1] + q1[1]) / 2); g.lineTo((p0[0] + q0[0]) / 2, (p0[1] + q0[1]) / 2); g.closePath();
    g.fillStyle = col2; g.fill();
  }
  g.beginPath(); g.moveTo(L[0][0], L[0][1]); for (const p of L) g.lineTo(p[0], p[1]); for (let i = Rr.length - 1; i >= 0; i--) g.lineTo(Rr[i][0], Rr[i][1]); g.closePath();
  g.strokeStyle = '#1a100a'; g.lineWidth = 1.2 * K; g.stroke();
  return pts;
}
export { rivet };
