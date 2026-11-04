// Small helpers: easing, keyframe tracks, two-bone IK, the camera (one world → film function).
export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const lerp = (a, b, u) => a + (b - a) * u;
export const ss = x => { x = clamp(x); return x * x * (3 - 2 * x); };
export const eio = x => { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
export const eo = x => { x = clamp(x); return 1 - (1 - x) * (1 - x); };
export const ei = x => { x = clamp(x); return x * x; };
export const seg = (t, a, b) => clamp((t - a) / (b - a));
export const hash = n => { n = Math.sin(n * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); };

// Keyframe track: keys = [[t, v, ease?], ...] (v a number or an array). Eased (smoothstep by default) between keys,
// held before the first and after the last key. ease 'snap' jumps at the key (a deliberate two-frame pop).
export const back = x => { x = clamp(x); const c = 1.9; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };      // overshoot
export const spring = x => { x = clamp(x); return 1 - Math.exp(-6 * x) * Math.cos(x * 14); };                                        // wobble to rest
const EASE = { ss, eio, eo, ei, back, spring, lin: x => clamp(x), snap: x => (x >= 1 ? 1 : 0) };
export function K(keys, t) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1, e] = keys[i];
    if (t < t1) {
      const [t0, v0] = keys[i - 1];
      const u = (EASE[e || 'ss'])((t - t0) / (t1 - t0));
      return Array.isArray(v0) ? v0.map((a, j) => lerp(a, v1[j], u)) : lerp(v0, v1, u);
    }
  }
  return keys[keys.length - 1][1];
}
// a pose from a table of tracks: { name: keys } → { name: value }
export function pose(tracks, t, base = {}) {
  const o = { ...base };
  for (const k in tracks) o[k] = K(tracks[k], t);
  return o;
}

// Two-bone IK (2D): shoulder s, target p, lengths a, b, bend = +1/-1 → [elbow, hand]
export function ik(s, p, a, b, bend = 1) {
  let dx = p[0] - s[0], dy = p[1] - s[1], d = Math.hypot(dx, dy);
  const dd = clamp(d, Math.abs(a - b) + .01, a + b - .01);
  const ang = Math.atan2(dy, dx), cosA = (a * a + dd * dd - b * b) / (2 * a * dd);
  const A = ang + bend * Math.acos(clamp(cosA, -1, 1));
  const e = [s[0] + Math.cos(A) * a, s[1] + Math.sin(A) * a];
  const h = [s[0] + Math.cos(ang) * dd, s[1] + Math.sin(ang) * dd];
  return [e, h];
}

// Camera: world point (cx, cy) at the centre of the 1440×1080 film frame, zoom z. Everything that follows a subject
// (iris, smoke, burn hole) goes through toFilm(), never hand-typed screen coordinates.
export const FW = 1440, FH = 1080;
export function camApply(g, cam) { g.setTransform(cam.z, 0, 0, cam.z, FW / 2 - cam.x * cam.z, FH / 2 - cam.y * cam.z); }
export const toFilm = (cam, p) => [FW / 2 + (p[0] - cam.x) * cam.z, FH / 2 + (p[1] - cam.y) * cam.z];
