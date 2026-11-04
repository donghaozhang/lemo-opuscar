// px.js — indexed 320×180 framebuffer, palette LUTs (cycling, swaps, step fades), Bayer dither, raster primitives, outline, mosaic, swirl
export const W = 320, H = 180, SCALE = 6;
export const T = 255;                         // transparent index

// Master palette: ENDESGA-32 (0–31, free palette by ENDESGA) + film indices (32+)
const HEX = [
  '#be4a2f', '#d77643', '#ead4aa', '#e4a672', '#b86f50', '#733e39', '#3e2731', '#a22633',
  '#e43b44', '#f77622', '#feae34', '#fee761', '#63c74d', '#3e8948', '#265c42', '#193c3e',
  '#124e89', '#0099db', '#2ce8f5', '#ffffff', '#c0cbdc', '#8b9bb4', '#5a6988', '#3a4466',
  '#262b44', '#181425', '#ff0044', '#68386c', '#b55088', '#f6757a', '#e8b796', '#c28569',
  // 32–34 umbrella red (protected)   35–38 home gold (protected)
  '#e43b44', '#a22633', '#f6757a', '#feae34', '#fee761', '#f77622', '#fff4c8',
  // 39–42 rain cycle   43–46 neon cycle   47–48 puddle shimmer   49 phone glow   50 true black  51 deep night
  '#8b9bb4', '#5a6988', '#3a4466', '#3a4466', '#ff0044', '#b55088', '#68386c', '#3e2731', '#5a6988', '#3a4466', '#b8f0ff', '#000000', '#10101c',
];
export const C = {
  rust: 0, clay: 1, sand: 2, tan: 3, brown: 4, dbrown: 5, umber: 6, crimson: 7, red: 8, orange: 9, amber: 10, yellow: 11,
  lime: 12, green: 13, dgreen: 14, teal: 15, navy: 16, blue: 17, cyan: 18, white: 19, silver: 20, steel: 21, slate: 22,
  dslate: 23, night: 24, ink: 25, hot: 26, plum: 27, rose: 28, pink: 29, skin: 30, skinS: 31,
  uR: 32, uRD: 33, uRL: 34, gold: 35, goldL: 36, goldD: 37, warmW: 38,
  r0: 39, r1: 40, r2: 41, r3: 42, n0: 43, n1: 44, n2: 45, n3: 46, p0: 47, p1: 48, glow: 49, black: 50, deep: 51,
};
export const NPAL = HEX.length;
export const PROTECT = new Set([32, 33, 34, 35, 36, 37, 38]);
const rgb = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
export const RGB = HEX.map(rgb);
export const lum = ([r, g, b]) => .299 * r + .587 * g + .114 * b;
const pack = ([r, g, b], a = 255) => (a << 24) | (b << 16) | (g << 8) | r;
const unpack = v => [v & 255, v >> 8 & 255, v >> 16 & 255];
export const CLEAR = 0x00000000;               // a LUT entry of 0 = "show the layer below" (overlay layers only)

function lutFrom(fn) { const L = new Uint32Array(256); for (let i = 0; i < NPAL; i++) { const c = fn(i); L[i] = c === null ? CLEAR : pack(c); } return L; }

// —— Colour cycling. Rain: 4 indices along each streak; a bright head runs down the streak. Neon: a 4-step chase. ——
const RAIN_COLS = ['#a6b4cc', '#6f7f9e', '#3a4466', '#2c3352'];
const NEON_COLS = ['#ff0044', '#f6757a', '#b55088', '#68386c'];
// base: 'rain' or 'clear'; t in seconds → LUT
export function lutAt(t, mode = 'rain') {
  const L = lutFrom(i => RGB[i]);
  const k = ((Math.floor(t * 24) % 4) + 4) % 4;
  for (let j = 0; j < 4; j++) {
    L[C.r0 + j] = mode === 'rain' ? pack(rgb(RAIN_COLS[(j - k + 4) % 4])) : CLEAR;
    L[C.n0 + j] = pack(rgb(NEON_COLS[(j + Math.floor(t * 6)) % 4]));
  }
  const p = Math.floor(t * 8) % 2;
  L[C.p0] = pack(rgb(mode === 'rain' ? (p ? '#5a6988' : '#3a4466') : '#3a4466'));
  L[C.p1] = pack(rgb(mode === 'rain' ? (p ? '#3a4466' : '#5a6988') : '#5a6988'));
  return L;
}
// neon flicker for a broken sign: index n0..n3 all off
export function neonOff(L) { for (let j = 0; j < 4; j++) L[C.n0 + j] = pack(rgb('#3e2731')); return L; }

// —— Step fades (4 levels), never alpha; protected indices optionally exempt ——
export function darken(L, f, keep = false) {
  const q = Math.round(Math.max(0, Math.min(1, f)) * 4) / 4, O = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    const v = L[i]; if (!v) { O[i] = v; continue; }
    if (keep && PROTECT.has(i)) { O[i] = v; continue; }
    const [r, g, b] = unpack(v); O[i] = pack([r * (1 - q) | 0, g * (1 - q) | 0, b * (1 - q) | 0]);
  }
  return O;
}
export function whiten(L, f) {
  const q = Math.round(Math.max(0, Math.min(1, f)) * 4) / 4, O = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    const v = L[i]; if (!v) { O[i] = v; continue; }
    const [r, g, b] = unpack(v); O[i] = pack([r + (255 - r) * q | 0, g + (255 - g) * q | 0, b + (255 - b) * q | 0]);
  }
  return O;
}
// "night" table: everything but protected + light sources one ramp step darker (for the phone-death beat)
export function dimIdx(L, steps) {
  const O = new Uint32Array(L);
  for (let i = 0; i < NPAL; i++) { if (PROTECT.has(i)) continue; let j = i; for (let s = 0; s < steps; s++) j = DARK[j]; O[i] = L[j]; }
  return O;
}

// —— LIGHT / DARK: one step along each colour's ramp ——
const RAMPS = [
  [50, 51, 25, 24, 23, 22, 21, 20, 19],
  [25, 16, 17, 18, 19], [25, 15, 14, 13, 12], [6, 5, 4, 3, 2, 19],
  [5, 31, 30, 2], [7, 0, 9, 10, 11, 19], [6, 7, 8, 29, 30], [25, 27, 28, 29, 30],
  [33, 32, 34], [37, 35, 36, 38], [42, 41, 40, 39], [46, 45, 44, 43], [47, 48], [26, 26], [1, 1],
];
export const LIGHT = new Uint8Array(256), DARK = new Uint8Array(256);
for (let i = 0; i < 256; i++) { LIGHT[i] = i; DARK[i] = i; }
for (const r of RAMPS) for (let k = 0; k < r.length; k++) { LIGHT[r[k]] = r[Math.min(r.length - 1, k + 1)]; DARK[r[k]] = r[Math.max(0, k - 1)]; }
LIGHT[C.rust] = C.orange; DARK[C.rust] = C.crimson; LIGHT[C.clay] = C.tan; DARK[C.clay] = C.rust;
LIGHT[C.hot] = C.pink; DARK[C.hot] = C.crimson; LIGHT[C.navy] = C.blue; LIGHT[C.teal] = C.dgreen;
// warm light (lamps, door): cool colours move toward warm ones
export const WARM = new Uint8Array(256);
for (let i = 0; i < 256; i++) WARM[i] = LIGHT[i];
Object.assign(WARM, { [C.ink]: C.umber, [C.deep]: C.ink, [C.night]: C.plum, [C.dslate]: C.dbrown, [C.slate]: C.brown, [C.steel]: C.tan, [C.silver]: C.sand,
  [C.navy]: C.plum, [C.teal]: C.dbrown, [C.dgreen]: C.brown, [C.umber]: C.dbrown, [C.dbrown]: C.brown, [C.brown]: C.tan, [C.plum]: C.rose, [C.r2]: C.r1, [C.r3]: C.r2 });

// —— Bayer ——
const B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
export const bayer = (x, y) => (B4[(y & 3) * 4 + (x & 3)] + .5) / 16;

// —— Maths ——
export function hash(x, y = 0, z = 0) { let h = (x * 374761393 + y * 668265263 + z * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
export const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
export const lerp = (a, b, t) => a + (b - a) * t;
export const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
export const ss = t => t * t * (3 - 2 * t);
export const eo = t => 1 - (1 - t) * (1 - t);
export const ei = t => t * t;
export const eio = t => t < .5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t);
export const back = (t, s = 1.7) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
export const mod = (n, m) => ((n % m) + m) % m;
export const step = (t, fps) => Math.floor(t * fps) / fps;   // sprite stepping (8/12 fps)

// —— Framebuffer ——
export class FB {
  constructor(w = W, h = H) { this.w = w; this.h = h; this.d = new Uint8Array(w * h); this.clip = [0, 0, w, h]; this.map = null; }
  clear(c = 0) { this.d.fill(c); }
  px(x, y, c) {
    x = Math.round(x); y = Math.round(y); const [cx, cy, cw, ch] = this.clip;
    if (x < cx || y < cy || x >= cw || y >= ch || c === T || c === undefined) return;
    this.d[y * this.w + x] = this.map ? this.map[c] : c;
  }
  get(x, y) { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= this.w || y >= this.h) return T; return this.d[y * this.w + x]; }
  rect(x, y, w, h, c) { x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h); for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, c); }
  frame(x, y, w, h, c) { this.rect(x, y, w, 1, c); this.rect(x, y + h - 1, w, 1, c); this.rect(x, y, 1, h, c); this.rect(x + w - 1, y, 1, h, c); }
  hline(x0, x1, y, c) { for (let x = Math.round(x0); x <= Math.round(x1); x++) this.px(x, y, c); }
  vline(x, y0, y1, c) { for (let y = Math.round(y0); y <= Math.round(y1); y++) this.px(x, y, c); }
  line(x0, y0, x1, y1, c) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy;
    for (let n = 0; n < 2000; n++) { this.px(x0, y0, c); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
  }
  disc(cx, cy, r, c) { for (let y = Math.floor(-r - 1); y <= r + 1; y++) for (let x = Math.floor(-r - 1); x <= r + 1; x++) if (x * x + y * y <= r * r + r * .6) this.px(cx + x, cy + y, c); }
  // filled ellipse centred at (cx,cy) (pixel-centre sampling); fn(x,y,nx,ny) may return a colour per pixel
  ell(cx, cy, rx, ry, c) {
    for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++) for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
      const nx = (x + .5 - cx) / rx, ny = (y + .5 - cy) / ry;
      if (nx * nx + ny * ny <= 1) this.px(x, y, typeof c === 'function' ? c(x, y, nx, ny) : c);
    }
  }
  // filled polygon (even-odd, pixel centres)
  poly(pts, c) {
    let y0 = 1e9, y1 = -1e9; for (const [, y] of pts) { y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
      const yc = y + .5, xs = [];
      for (let i = 0; i < pts.length; i++) {
        const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
        if ((ay <= yc && by > yc) || (by <= yc && ay > yc)) xs.push(ax + (yc - ay) / (by - ay) * (bx - ax));
      }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.ceil(xs[k] - .5); x <= Math.floor(xs[k + 1] - .5); x++) this.px(x, y, typeof c === 'function' ? c(x, y) : c);
    }
  }
  // capsule (thick segment) with per-pixel colour from fn(x,y,u,d) — u along 0..1, d = signed distance across / r
  capsule(ax, ay, bx, by, r, c) {
    const x0 = Math.floor(Math.min(ax, bx) - r - 1), x1 = Math.ceil(Math.max(ax, bx) + r + 1), y0 = Math.floor(Math.min(ay, by) - r - 1), y1 = Math.ceil(Math.max(ay, by) + r + 1);
    const vx = bx - ax, vy = by - ay, L2 = vx * vx + vy * vy || 1e-6;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const px = x + .5 - ax, py = y + .5 - ay; const u = clamp((px * vx + py * vy) / L2, 0, 1);
      const qx = px - u * vx, qy = py - u * vy; const d2 = qx * qx + qy * qy;
      if (d2 <= r * r) this.px(x, y, typeof c === 'function' ? c(x, y, qx / r, qy / r, u) : c);
    }
  }
  dither(x0, y0, w, h, f, a, b) { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const X = x0 + x, Y = y0 + y; this.px(X, Y, bayer(X, Y) < f(X, Y) ? b : a); } }
  gradV(x0, y0, w, h, cols) {
    const n = cols.length - 1;
    for (let y = 0; y < h; y++) {
      const v = y / Math.max(1, h - 1) * n, b = Math.min(n - 1, Math.floor(v)), f = v - b;
      for (let x = 0; x < w; x++) this.px(x0 + x, y0 + y, cols[bayer(x0 + x, y0 + y) < f ? b + 1 : b]);
    }
  }
  blit(src, dx, dy, flip = false, map = null) {
    dx = Math.round(dx); dy = Math.round(dy);
    for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
      let c = src.d[y * src.w + (flip ? src.w - 1 - x : x)]; if (c === T) continue;
      if (map) { c = map[c]; if (c === undefined || c === T) continue; }
      this.px(dx + x, dy + y, c);
    }
  }
  // remap pixels inside a region through a table (lighting): test(x,y) → table or null
  relight(x0, y0, w, h, fn) {
    for (let y = Math.max(0, y0); y < Math.min(this.h, y0 + h); y++) for (let x = Math.max(0, x0); x < Math.min(this.w, x0 + w); x++) {
      const tab = fn(x, y); if (!tab) continue; const i = y * this.w + x; const c = this.d[i]; if (c !== T) this.d[i] = tab[c];
    }
  }
  // light pool: Bayer-thresholded rings, inner = 2 steps, outer = 1 step
  glow(cx, cy, rx, ry, tab = LIGHT, strength = 1) {
    this.relight(Math.floor(cx - rx), Math.floor(cy - ry), Math.ceil(rx * 2) + 1, Math.ceil(ry * 2) + 1, (x, y) => {
      const nx = (x + .5 - cx) / rx, ny = (y + .5 - cy) / ry, d = Math.sqrt(nx * nx + ny * ny);
      if (d >= 1) return null; const v = (1 - d) * 2 * strength, b = bayer(x, y);
      if (v - 1 > b) return tab === LIGHT ? LL : tab === WARM ? WW : tab;
      return v > b ? tab : null;
    });
  }
}
export const LL = LIGHT.map(i => LIGHT[i]);
export const WW = WARM.map(i => WARM[i]);
// sprite buffer (transparent) + global 1-px ink outline
export function sprite(w, h) { const f = new FB(w, h); f.clear(T); return f; }
export function outline(f, ink = C.ink, diag = false) {
  const src = f.d.slice(), w = f.w, h = f.h;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (src[y * w + x] !== T) continue;
    let hit = false;
    for (const [dx, dy] of diag ? [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]] : [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < w && Y < h && src[Y * w + X] !== T && src[Y * w + X] !== ink) { hit = true; break; }
    }
    if (hit) f.d[y * w + x] = ink;
  }
  return f;
}
export function sprFromRows(rows, map) {
  const h = rows.length, w = Math.max(...rows.map(r => r.length)), d = new Uint8Array(w * h).fill(T);
  rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) { const ch = r[x]; if (ch === '.' || ch === ' ') continue; const c = map[ch]; if (c === undefined) throw new Error('sprite char ' + ch); d[y * w + x] = c; } });
  return { w, h, d };
}

// —— Output: layers (base + overlay with CLEAR entries) → LUT → ×6 ——
export function makeOut(canvas) {
  const lo = document.createElement('canvas'); lo.width = W; lo.height = H;
  const g = lo.getContext('2d'); const img = g.createImageData(W, H); const u32 = new Uint32Array(img.data.buffer);
  const o = canvas.getContext('2d'); o.imageSmoothingEnabled = false;
  return {
    lo, u32,
    present(fb, lut, over = null, overLut = null) {
      const d = fb.d;
      for (let i = 0; i < d.length; i++) u32[i] = lut[d[i]] | 0xff000000;
      if (over) { const L = overLut || lut, od = over.d; for (let i = 0; i < od.length; i++) { const c = od[i]; if (c === T) continue; const v = L[c]; if (v) u32[i] = v; } }
    },
    post(fn) { fn(u32); },
    show() { g.putImageData(img, 0, 0); o.drawImage(lo, 0, 0, W * SCALE, H * SCALE); },
  };
}
export function mosaic(u32, n, cx = W / 2, cy = H / 2) {
  n = Math.round(n); if (n <= 1) return; const src = u32.slice();
  const ox = mod(Math.round(cx), n), oy = mod(Math.round(cy), n);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const bx = clamp(Math.floor((x - ox) / n) * n + ox, 0, W - 1), by = clamp(Math.floor((y - oy) / n) * n + oy, 0, H - 1);
    u32[y * W + x] = src[by * W + bx];
  }
}
// encounter swirl: polar twist growing with s^1.6 around the centre
export function swirl(u32, s, cx = W / 2, cy = H / 2) {
  if (s <= 0) return; const src = u32.slice(); const k = Math.pow(s, 1.6) * 9;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const dx = x - cx, dy = y - cy, r = Math.hypot(dx, dy), a = Math.atan2(dy, dx) + k * Math.max(0, 1 - r / 200);
    const sx = clamp(Math.round(cx + r * Math.cos(a)), 0, W - 1), sy = clamp(Math.round(cy + r * Math.sin(a)), 0, H - 1);
    u32[y * W + x] = src[sy * W + sx];
  }
}
// Bayer dissolve to a solid colour (RGB level): f 0..1
export function dissolve(u32, f, col = 0xffffffff) { if (f <= 0) return; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (bayer(x, y) < f) u32[y * W + x] = col; }
export const packRGB = (r, g, b) => pack([r, g, b]);
