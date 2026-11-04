// scenes.js — environments on the native grid: street, overworld map, parallax city, battle backdrops, bus stop, lobby, stairwell well,
// stair flights, corridor + door 2803, close-up backdrops; rain overlay (colour-cycled) and splashes.
import { C, T, W, H, FB, sprite, outline, bayer, hash, clamp, lerp, mod, LIGHT, WARM, LL, WW } from './px.js';
import { text, text2, textW } from './font.js';

// —— rain overlay: streaks with the 4 cycle indices, every 3 px one index; built once per density ——
const RAIN = {};
export function rainLayer(density = 1, slant = 1) {
  const key = density + ':' + slant; if (RAIN[key]) return RAIN[key];
  const f = new FB(); f.clear(T);
  const n = Math.round(150 * density);
  for (let i = 0; i < n; i++) {
    const x0 = Math.floor(hash(i, 1) * (W + 40)) - 20, y0 = Math.floor(hash(i, 2) * (H + 20)) - 20, len = 9 + Math.floor(hash(i, 3) * 9), ph = Math.floor(hash(i, 4) * 4);
    for (let j = 0; j < len; j++) { const y = y0 + j, x = x0 - Math.floor(j * slant / 4); f.px(x, y, C.r0 + mod(Math.floor(j / 3) + ph, 4)); }
  }
  RAIN[key] = f; return f;
}
// splashes on a ground band (deterministic, 3-frame life)
export function splashes(fb, t, y0, y1, n = 26, x0 = 0, x1 = W) {
  const fr = Math.floor(t * 24);
  for (let i = 0; i < n; i++) {
    const life = mod(fr + i * 7, 9); if (life > 2) continue;
    const cyc = Math.floor((fr + i * 7) / 9);
    const x = Math.round(x0 + hash(i, cyc, 5) * (x1 - x0)), y = Math.round(y0 + hash(i, cyc, 6) * (y1 - y0));
    if (life === 0) fb.px(x, y, C.silver);
    else if (life === 1) { fb.px(x - 1, y - 1, C.steel); fb.px(x + 1, y - 1, C.steel); fb.px(x, y, C.slate); }
    else { fb.px(x - 2, y, C.slate); fb.px(x + 2, y, C.slate); }
  }
}
const sky = (fb, y1, cols = [C.deep, C.ink, C.night]) => fb.gradV(0, 0, W, y1, cols);
// building silhouette with lit windows. warmChance: fraction of lit windows
function building(fb, x, y, w, h, o = {}) {
  const base = o.base ?? C.night, edge = o.edge ?? C.dslate;
  fb.rect(x, y, w, h, base); fb.rect(x, y, 1, h, edge); fb.rect(x, y, w, 1, edge);
  const seed = o.seed ?? x;
  for (let wy = y + 4; wy < y + h - 6; wy += o.wy || 7) for (let wx = x + 3; wx < x + w - 4; wx += o.wx || 6) {
    const r = hash(wx, wy, seed); if (r > (o.lit ?? .35)) { fb.rect(wx, wy, 3, 3, C.ink); continue; }
    const c = r < .08 ? C.amber : r < .2 ? C.tan : C.slate; fb.rect(wx, wy, 3, 3, c); if (c === C.amber) fb.px(wx, wy, C.yellow);
  }
}
// —— 1. the noodle-shop street (side view). camX scrolls. floor line y=124 ——
export const STREET = { floor: 124 };
export function street(fb, t, camX = 0, o = {}) {
  sky(fb, 90);
  // far skyline (0.3x)
  const fx = Math.round(camX * .3);
  for (let i = -2; i < 14; i++) { const bx = i * 34 - fx % 34 - 0, bh = 40 + Math.floor(hash(i + Math.floor(fx / 34), 9) * 50); building(fb, bx, 96 - bh, 30, bh, { base: C.deep, edge: C.ink, lit: .22, seed: i + Math.floor(fx / 34) }); }
  const X = -Math.round(camX);
  // shop block wall
  fb.rect(X - 20, 30, 240, 82, C.dslate); fb.rect(X - 20, 30, 240, 2, C.slate);
  for (let y = 34; y < 60; y += 6) for (let x = X - 18; x < X + 218; x += 12) fb.rect(x + (y % 12 ? 0 : 6), y, 11, 5, C.night);   // brick hint upper
  // neon sign board "面馆" + "24h?" (closed, no). Neon letters use cycling indices
  fb.rect(X + 30, 36, 74, 26, C.ink); fb.frame(X + 30, 36, 74, 26, C.umber);
  const nc = o.neonOff ? C.umber : (r) => C.n0 + mod(Math.floor(r / 3), 4);
  text2(fb, '面馆', X + 42, 38, nc, { outline: C.ink });
  // awning
  for (let i = 0; i < 18; i++) fb.poly([[X + 14 + i * 8, 64], [X + 22 + i * 8, 64], [X + 23 + i * 8, 74], [X + 13 + i * 8, 74]], i % 2 ? C.crimson : C.sand);
  for (let i = 0; i < 18; i++) fb.ell(X + 18 + i * 8, 74, 4, 2, i % 2 ? C.crimson : C.sand);
  fb.rect(X + 12, 63, 148, 2, C.umber);
  // shop window, warm lit, steamy; door with 打烊 sign
  fb.rect(X + 18, 80, 86, 32, C.umber);
  fb.dither(X + 20, 82, 82, 28, (x, y) => .55 - (y - 82) / 60, C.brown, C.tan);
  for (let i = 0; i < 3; i++) fb.rect(X + 30 + i * 22, 98, 12, 2, C.dbrown);                       // stools
  fb.rect(X + 110, 80, 30, 44, C.umber); fb.rect(X + 112, 82, 26, 42, C.dbrown); fb.rect(X + 113, 83, 11, 40, C.brown); fb.rect(X + 126, 83, 11, 40, C.brown);
  fb.rect(X + 115, 90, 20, 10, C.sand); text(fb, '打烊', X + 117, 89, C.crimson, { size: 8 });
  fb.px(X + 124, 104, C.amber); fb.px(X + 126, 104, C.amber);
  // gutter + drainpipe
  fb.rect(X + 160, 30, 4, 94, C.slate); fb.rect(X + 161, 30, 1, 94, C.steel);
  // sidewalk
  fb.rect(X - 20, 112, 400, 12, C.slate); for (let x = X - 20; x < X + 380; x += 16) fb.rect(x, 112, 1, 12, C.dslate);
  fb.rect(X - 20, 112, 400, 1, C.steel);
  // curb + road
  fb.rect(0, 124, W, 2, C.steel); fb.rect(0, 126, W, 54, C.ink);
  fb.dither(0, 126, W, 54, (x, y) => .25 + (y - 126) / 200, C.ink, C.night);
  for (let x = X - 40; x < X + 400; x += 40) fb.rect(x, 150, 20, 2, C.dslate);                     // lane dashes
  // puddles with neon reflection (shimmer indices)
  puddle(fb, X + 60, 136, 44, 6, o.neonOff); puddle(fb, X + 190, 160, 60, 7); puddle(fb, X + 300, 140, 30, 4);
  // street lamp
  const lx = X + 232; fb.rect(lx, 40, 3, 84, C.night); fb.rect(lx, 40, 1, 84, C.slate); fb.rect(lx - 10, 38, 14, 3, C.night); fb.rect(lx - 12, 41, 8, 3, C.silver);
  if (!o.noLamp) { fb.glow(lx - 8, 60, 30, 40, WARM, .8); fb.glow(lx - 8, 120, 34, 8, WARM, .9); }
  // shop window spill on the pavement
  fb.glow(X + 60, 116, 54, 9, WARM, .9);
  // second building (right)
  building(fb, X + 250, 20, 110, 92, { base: C.night, edge: C.dslate, lit: .3, seed: 77 });
}
function puddle(fb, x, y, w, h, off) {
  fb.ell(x, y, w / 2, h / 2, (X, Y, nx, ny) => { const r = bayer(X, Y); return Math.abs(ny) < .35 && Math.abs(nx) < .6 ? (off ? C.p1 : (r < .5 ? C.n2 : C.p1)) : r < .5 ? C.p0 : C.p1; });
}

// —— 2. overworld: tile map 64×44 tiles of 8 px (512×352 px) drawn top-down ——
export const MAP = { tw: 8, w: 64, h: 44 };
// route in map pixels: shop → red light → underpass → bus stop → gate → tower
export const ROUTE = [[44, 300], [44, 252], [116, 252], [180, 252], [180, 196], [236, 196], [300, 196], [300, 140], [372, 140], [420, 140], [420, 92], [452, 92]];
export const PLACES = { shop: [44, 300], light: [116, 252], under: [180, 230], bus: [236, 196], gate: [372, 140], tower: [452, 76] };
function routePoint(u) {   // u 0..1 along ROUTE by length
  const L = []; let tot = 0; for (let i = 1; i < ROUTE.length; i++) { const d = Math.hypot(ROUTE[i][0] - ROUTE[i - 1][0], ROUTE[i][1] - ROUTE[i - 1][1]); L.push(d); tot += d; }
  let s = clamp(u, 0, 1) * tot;
  for (let i = 0; i < L.length; i++) { if (s <= L[i]) { const k = s / L[i]; const a = ROUTE[i], b = ROUTE[i + 1]; return { x: lerp(a[0], b[0], k), y: lerp(a[1], b[1], k), dx: Math.sign(b[0] - a[0]), dy: Math.sign(b[1] - a[1]) }; } s -= L[i]; }
  const a = ROUTE[ROUTE.length - 1]; return { x: a[0], y: a[1], dx: 1, dy: 0 };
}
export { routePoint };
let MAPFB = null;
function buildMap() {
  const f = new FB(MAP.w * 8, MAP.h * 8);
  f.clear(C.ink);
  // ground: dark blocks
  for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) f.d[y * f.w + x] = bayer(x, y) < .2 ? C.night : C.ink;
  // river (diagonal band top-left)
  for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) { const d = x * .55 + y - 120; if (d > 0 && d < 26 && y < 150) f.d[y * f.w + x] = (x + y) % 7 === 0 ? C.p0 : (x * 3 + y) % 11 === 0 ? C.p1 : C.navy; }
  // roads: grid lines
  const roadsH = [92, 140, 196, 252, 300], roadsV = [44, 116, 180, 236, 300, 372, 420, 452];
  for (const ry of roadsH) { f.rect(0, ry - 6, f.w, 13, C.dslate); f.rect(0, ry - 4, f.w, 9, C.deep); for (let x = 0; x < f.w; x += 10) f.rect(x, ry, 5, 1, C.dslate); for (let x = 6; x < f.w; x += 34) { f.px(x, ry - 6, C.amber); } }
  for (const rx of roadsV) { f.rect(rx - 6, 0, 13, f.h, C.dslate); f.rect(rx - 4, 0, 9, f.h, C.deep); for (let y = 0; y < f.h; y += 10) f.rect(rx, y, 1, 5, C.dslate); }
  for (const ry of roadsH) f.rect(0, ry - 4, f.w, 9, C.deep);
  // blocks: buildings with roofs, lit windows, rooftop units
  for (let by = 0; by < 6; by++) for (let bx = 0; bx < 9; bx++) {
    const x0 = [0, 44, 116, 180, 236, 300, 372, 420, 452, 512][bx] + 7, x1 = [44, 116, 180, 236, 300, 372, 420, 452, 512, 512][bx] - 7;
    const y0 = [0, 92, 140, 196, 252, 300, 352][by] + 7, y1 = [92, 140, 196, 252, 300, 352, 352][by] - 7;
    if (x1 - x0 < 8 || y1 - y0 < 8) continue;
    const seed = bx * 13 + by * 7;
    const park = seed % 9 === 4 && !(bx === 7 && by === 1);
    if (park) { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) f.d[y * f.w + x] = bayer(x, y) < .4 ? C.teal : C.dgreen; for (let k = 0; k < 6; k++) { const tx = x0 + 4 + hash(seed, k) * (x1 - x0 - 8), ty = y0 + 4 + hash(seed, k, 2) * (y1 - y0 - 8); f.disc(tx, ty, 3, C.dgreen); f.disc(tx - 1, ty - 1, 1.5, C.green); } continue; }
    // several buildings per block
    let x = x0; while (x < x1 - 6) {
      const w = Math.min(x1 - x, 14 + Math.floor(hash(seed, x) * 18)); const hh = y1 - y0;
      const roof = hash(seed, x, 3) < .5 ? C.slate : C.dslate;
      f.rect(x + 2, y0 + 3, w - 2, hh - 2, C.deep);                 // shadow
      f.rect(x, y0, w - 2, hh - 3, roof); f.rect(x, y0, w - 2, 1, C.steel); f.rect(x, y0, 1, hh - 3, C.steel); f.rect(x + w - 3, y0, 1, hh - 3, C.night);
      for (let k = 0; k < 3; k++) { const ux = x + 3 + Math.floor(hash(seed, x, k + 9) * (w - 9)), uy = y0 + 3 + Math.floor(hash(seed, x, k + 19) * (hh - 10)); f.rect(ux, uy, 3, 2, C.slate); }
      for (let wy = y0 + 2; wy < y0 + hh - 5; wy += 4) if (hash(seed, x, wy) < .18) f.px(x + 2 + Math.floor(hash(x, wy) * (w - 6)), wy, hash(x, wy, 3) < .4 ? C.amber : C.tan);
      x += w;
    }
  }
  // the 幸福里 compound (block bx=7, by=0..1 area): low wall, gate, the tower 3栋
  f.rect(380, 30, 66, 104, C.night); f.frame(380, 30, 66, 104, C.slate);
  f.rect(398, 128, 18, 6, C.dslate);                                  // gate gap
  // tower 3: tall building drawn with a long shadow
  f.rect(442, 34, 26, 50, C.deep); f.rect(436, 30, 26, 50, C.dslate); f.rect(436, 30, 26, 1, C.steel); f.rect(436, 30, 1, 50, C.steel);
  for (let wy = 33; wy < 78; wy += 4) for (let wx = 439; wx < 460; wx += 4) if (hash(wx, wy, 5) < .3) f.px(wx, wy, C.tan);
  // bus stop shelter mark near (236,196)
  f.rect(240, 186, 10, 4, C.steel); f.rect(240, 186, 10, 1, C.silver);
  // noodle shop: a lit roof sign near start
  f.rect(26, 306, 16, 8, C.umber); f.rect(28, 308, 12, 4, C.n0);
  // underpass: the road dips under a rail line (dark band)
  f.rect(160, 220, 40, 14, C.ink); f.rect(150, 224, 60, 3, C.steel); f.rect(150, 230, 60, 3, C.steel);
  // traffic light dot at the intersection
  f.rect(121, 244, 2, 2, C.red);
  MAPFB = f; return f;
}
// draw the overworld: camera centre (cx, cy) in map px. o: {bike:{x,y,dx,dy}, marker, clear}
export function overworld(fb, t, cx, cy, o = {}) {
  const M = MAPFB || buildMap();
  const ox = Math.round(cx - W / 2), oy = Math.round(cy - H / 2);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const c = M.get(x + ox, y + oy); fb.d[y * W + x] = c === T ? C.ink : c; }
  // the gold window: a lit window in tower 3 (protected gold), pulsing 1 px quest marker above it
  const gx = 452 - ox, gy = 50 - oy;
  fb.rect(gx - 1, gy - 1, 4, 4, C.goldD); fb.rect(gx, gy, 2, 2, C.goldL);
  fb.glow(gx + 1, gy + 1, 8, 8, WARM, .7); fb.rect(gx, gy, 2, 2, C.goldL);
  if (o.marker !== false) { const b = Math.floor(t * 4) % 2; for (let j = 0; j < 4; j++) fb.hline(gx - 3 + j, gx + 4 - j, gy - 10 + j + b, C.gold); fb.hline(gx - 3, gx + 4, gy - 11 + b, C.ink); }
  // route dots ahead of the bike
  if (o.route) { const st = o.route[0], en = o.route[1]; for (let u = st; u < en; u += .012) { const p = routePoint(u); if (Math.floor(u / .012) % 2 === 0) fb.px(Math.round(p.x - ox), Math.round(p.y - oy), C.yellow); } }
  if (o.dog) { const dx = 386 - ox, dy = 128 - oy; fb.rect(dx, dy, 4, 3, C.amber); fb.px(dx - 1, dy, C.amber); const w = Math.floor(t * 8) % 2; fb.px(dx + 4, dy - w, C.amber); }
  if (o.bike) bikeTop(fb, o.bike.x - ox, o.bike.y - oy, o.bike.dx, o.bike.dy, t, o.bike.light !== false);
  return { ox, oy };
}
// top-down bike sprite (7×11) with headlight cone
function bikeTop(fb, x, y, dx, dy, t, light) {
  x = Math.round(x); y = Math.round(y);
  const horiz = dx !== 0; const fdir = horiz ? dx : dy;
  if (light) {
    for (let k = 3; k < 22; k++) for (let s = -Math.floor(k * .4); s <= Math.floor(k * .4); s++) {
      const px = horiz ? x + k * dx : x + s, py = horiz ? y + s : y + k * dy; if (bayer(px, py) < 1 - k / 22) { const i = py * W + px; if (px >= 0 && py >= 0 && px < W && py < H) fb.d[i] = LIGHT[fb.d[i]]; }
    }
  }
  const pts = horiz ? [[-5, 0], [5, 0]] : [[0, -5], [0, 5]];
  // body: rider (orange dot) on a teal frame, blue box at the back
  const P = (a, b) => horiz ? [x + a * dx, y + b] : [x + b, y + a * dy];
  fb.line(...P(-5, 0), ...P(5, 0), C.ink);
  fb.rect(...P(-6, -2).map(Math.round), 4, 4, C.ink); fb.rect(...(horiz ? [x - 5 * dx - (dx > 0 ? 0 : 2) , y - 1] : [x - 1, y - 5 * dy - (dy > 0 ? 0 : 2)]), 3, 3, C.blue);
  fb.rect(...(horiz ? [x - 1, y - 1] : [x - 1, y - 1]), 3, 3, C.orange); fb.px(x, y, C.amber);
  fb.px(...P(5, 0), C.white);
}

// —— 3. parallax city side-scroll (shot: ride). scroll in px of the near layer ——
export function cityScroll(fb, t, s) {
  sky(fb, 110, [C.deep, C.ink, C.night]);
  // layer 1 (0.2): far towers with red aviation lights
  const s1 = Math.round(s * .2);
  for (let i = -1; i < 12; i++) { const k = i + Math.floor(s1 / 40); const bx = i * 40 - mod(s1, 40), bh = 50 + Math.floor(hash(k, 1) * 50); building(fb, bx, 100 - bh, 34, bh + 10, { base: C.deep, edge: C.ink, lit: .15, seed: k }); if (hash(k, 2) < .5 && Math.floor(t * 2 + k) % 2) fb.px(bx + 16, 99 - bh, C.red); }
  // layer 2 (0.55): mid buildings with neon signs (cycling)
  const s2 = Math.round(s * .55);
  for (let i = -1; i < 7; i++) {
    const k = i + Math.floor(s2 / 64); const bx = i * 64 - mod(s2, 64), bh = 44 + Math.floor(hash(k, 3) * 30);
    building(fb, bx, 112 - bh, 58, bh, { base: C.night, edge: C.dslate, lit: .3, seed: k + 50 });
    if (hash(k, 4) < .6) { const sx = bx + 8 + Math.floor(hash(k, 5) * 20), sy = 112 - bh + 8; fb.rect(sx, sy, 6, 22, C.ink); for (let j = 0; j < 4; j++) fb.rect(sx + 1, sy + 1 + j * 5, 4, 4, C.n0 + mod(j + k, 4)); }
  }
  // layer 3 (1.0): street with lamps
  fb.rect(0, 112, W, 6, C.slate); fb.rect(0, 112, W, 1, C.steel); fb.rect(0, 118, W, 62, C.ink);
  fb.dither(0, 118, W, 62, (x, y) => .2 + (y - 118) / 250, C.ink, C.night);
  for (let x = -mod(s, 48); x < W; x += 48) fb.rect(x, 150, 24, 2, C.dslate);
  for (let x = -mod(s, 120); x < W + 20; x += 120) { fb.rect(x, 50, 2, 62, C.night); fb.rect(x - 8, 48, 10, 2, C.night); fb.rect(x - 9, 50, 6, 2, C.silver); fb.glow(x - 6, 110, 26, 8, WARM, .8); fb.glow(x - 6, 70, 18, 22, WARM, .5); }
  for (let x = -mod(s, 90) + 30; x < W; x += 90) puddle(fb, x, 160, 30, 4);
}
// foreground railing (1.6x) drawn after the subject
export function railing(fb, s) { const s4 = Math.round(s * 1.6); fb.rect(0, 166, W, 2, C.night); for (let x = -mod(s4, 26); x < W; x += 26) fb.rect(x, 160, 3, 20, C.ink); fb.rect(0, 160, W, 2, C.ink); }

// —— 4. battle backdrops (enemy left, party right). kind: 'cross'|'under'|'gate'|'stairs' ——
export function battleBG(fb, t, kind) {
  if (kind === 'cross') {
    sky(fb, 80); for (let i = 0; i < 9; i++) building(fb, i * 38 - 6, 20 + Math.floor(hash(i, 8) * 30), 34, 90, { lit: .3, seed: i + 300 });
    fb.rect(0, 92, W, 40, C.ink); fb.dither(0, 92, W, 40, (x, y) => (y - 92) / 60, C.ink, C.night);
    for (let i = 0; i < 9; i++) fb.poly([[i * 36 + 10, 100], [i * 36 + 30, 100], [i * 36 + 34, 128], [i * 36 + 8, 128]], C.slate);   // zebra crossing
    fb.glow(90, 60, 50, 60, null || [...LIGHT].map((v, i) => i === C.ink ? C.crimson : i === C.night ? C.crimson : i === C.dslate ? C.rust : v), .7);
  } else if (kind === 'under') {
    fb.clear(C.ink);
    fb.rect(0, 0, W, 34, C.dslate); for (let x = 0; x < W; x += 20) fb.rect(x, 0, 2, 34, C.night);   // rail bridge deck
    fb.rect(0, 34, W, 3, C.steel);
    fb.dither(0, 37, W, 60, (x, y) => .5 - (y - 37) / 120, C.ink, C.night);
    for (let x = 30; x < W; x += 90) { fb.rect(x, 40, 30, 4, C.amber); fb.glow(x + 15, 50, 30, 18, WARM, .6); }
    fb.rect(0, 96, W, 36, C.navy); fb.dither(0, 96, W, 36, (x, y) => ((x + Math.floor(t * 12)) % 9 === 0 ? 1 : .3), C.navy, C.p1);
    fb.rect(0, 96, W, 1, C.cyan);
    // warning sign
    fb.rect(260, 60, 2, 36, C.slate); fb.poly([[251, 48], [271, 48], [261, 64]], C.amber); text(fb, '!', 259, 47, C.ink);
  } else if (kind === 'gate') {
    sky(fb, 90); building(fb, 180, 10, 120, 100, { lit: .25, seed: 500 });
    fb.rect(0, 70, W, 30, C.dslate); for (let x = 0; x < W; x += 12) fb.rect(x, 70, 10, 2, C.slate);  // compound wall
    // gate pillars + sign 幸福里
    fb.rect(40, 40, 14, 60, C.slate); fb.rect(150, 40, 14, 60, C.slate); fb.rect(40, 40, 124, 12, C.night); fb.frame(40, 40, 124, 12, C.steel);
    text(fb, '幸福里', 84, 40, C.sand, { shadow: C.ink });
    fb.rect(166, 60, 26, 30, C.night); fb.rect(170, 64, 18, 10, C.tan); fb.glow(179, 72, 26, 22, WARM, .6);  // guard booth
    fb.rect(0, 100, W, 32, C.ink); fb.dither(0, 100, W, 32, (x, y) => (y - 100) / 50, C.ink, C.night);
  } else if (kind === 'stairs') {
    fb.clear(C.deep);
    for (let i = 0; i < 6; i++) { const x = i * 56 - 10; fb.poly([[x, 130], [x + 50, 60], [x + 56, 60], [x + 6, 130]], C.night); for (let k = 0; k < 7; k++) fb.rect(x + 6 + k * 7, 122 - k * 10, 8, 2, C.dslate); }
    fb.rect(0, 100, W, 32, C.ink);
  }
}
// —— 5. bus stop (side view): shelter, bench, sign; the kid sits under it ——
export function busStop(fb, t, camX = 0) {
  sky(fb, 96); const X = -Math.round(camX);
  for (let i = -1; i < 10; i++) building(fb, X * .4 + i * 40, 20 + Math.floor(hash(i, 21) * 30), 36, 90, { base: C.deep, edge: C.ink, lit: .2, seed: i + 700 });
  fb.rect(0, 112, W, 12, C.slate); fb.rect(0, 112, W, 1, C.steel); fb.rect(0, 124, W, 2, C.steel); fb.rect(0, 126, W, 54, C.ink);
  fb.dither(0, 126, W, 54, (x, y) => .25 + (y - 126) / 200, C.ink, C.night);
  // shelter
  const sx = X + 150; fb.rect(sx, 52, 110, 5, C.steel); fb.rect(sx, 52, 110, 1, C.silver); fb.rect(sx + 4, 57, 3, 67, C.slate); fb.rect(sx + 103, 57, 3, 67, C.slate);
  fb.dither(sx + 8, 58, 94, 50, () => .15, C.night, C.dslate);                                     // back glass
  fb.rect(sx + 60, 62, 36, 40, C.ink); fb.rect(sx + 62, 64, 32, 36, C.navy); text(fb, '停运', sx + 66, 74, C.red, { shadow: C.ink });  // timetable panel: 停运
  fb.glow(sx + 78, 80, 34, 30, LIGHT, .5);
  fb.rect(sx + 16, 108, 50, 3, C.steel); fb.rect(sx + 20, 111, 2, 13, C.slate); fb.rect(sx + 60, 111, 2, 13, C.slate);       // bench
  // bus sign pole
  fb.rect(sx - 16, 40, 2, 84, C.slate); fb.disc(sx - 15, 40, 7, C.blue); fb.disc(sx - 15, 40, 5, C.white); text(fb, '站', sx - 21, 33, C.blue);
  fb.glow(sx + 50, 54, 50, 12, LIGHT, .8);   // shelter light strip
  puddle(fb, X + 70, 150, 50, 6); puddle(fb, X + 250, 140, 40, 5);
}
// —— 6. lobby with the broken lift ——
export function lobby(fb, t) {
  fb.clear(C.night);
  fb.rect(0, 0, W, 112, C.dslate); for (let y = 0; y < 112; y += 16) fb.rect(0, y, W, 1, C.night);
  fb.rect(0, 112, W, 68, C.night); for (let x = 0; x < W; x += 20) fb.line(x, 112, x - 30, 180, C.ink);
  // lift doors
  fb.rect(116, 24, 88, 90, C.slate); fb.rect(120, 28, 80, 86, C.steel); fb.rect(159, 28, 2, 86, C.slate); fb.rect(120, 28, 1, 86, C.silver);
  fb.rect(140, 10, 40, 10, C.ink); text(fb, '--', 152, 8, C.red);
  // the sign taped across
  fb.rect(126, 56, 68, 20, C.amber); fb.frame(126, 56, 68, 20, C.dbrown); text(fb, '电梯维修', 136, 59, C.ink);
  for (let i = 0; i < 4; i++) fb.line(126 + i * 20, 56, 136 + i * 20, 76, C.yellow);
  text(fb, '电梯维修', 136, 59, C.ink);
  // call button panel
  fb.rect(212, 60, 10, 18, C.ink); fb.rect(213, 61, 8, 16, C.slate); fb.disc(217, 69, 2.5, C.steel);
  // fluorescent tube (flickers)
  const on = !(Math.floor(t * 12) % 17 === 3 || Math.floor(t * 12) % 23 === 5);
  fb.rect(80, 2, 160, 3, on ? C.white : C.steel); if (on) fb.glow(160, 30, 140, 50, LIGHT, .6);
}
export function liftButton(fb, lit) { fb.disc(217, 69, 2.5, lit ? C.red : C.steel); }
// —— 7. the stairwell well, looking up: concentric flights shrinking to the top. push 0..1 travels up the well
export function well(fb, t, push, lights = 0) {
  fb.clear(C.black);
  const cx = 160, cy = 86;
  // 28 floors as nested rectangles; depth z; floor k at z = k - push*27
  for (let k = 27; k >= 0; k--) {
    const z = k - push * 26; if (z < -.9) continue;
    const sc = 1 / (1 + z * .32); const w = 300 * sc, h = 200 * sc;
    const x0 = Math.round(cx - w / 2), y0 = Math.round(cy - h / 2), x1 = Math.round(cx + w / 2), y1 = Math.round(cy + h / 2);
    const lit = lights > 0 && k < lights;
    const wall = lit ? (z < 3 ? C.slate : C.dslate) : z < 2 ? C.dslate : z < 8 ? C.night : C.ink;
    const rail = lit ? C.steel : z < 4 ? C.slate : C.night;
    // landing ring
    const th = Math.max(1, Math.round(16 * sc));
    fb.rect(x0, y0, x1 - x0, th, wall); fb.rect(x0, y1 - th, x1 - x0, th, wall); fb.rect(x0, y0, th, y1 - y0, wall); fb.rect(x1 - th, y0, th, y1 - y0, wall);
    fb.frame(x0 + th, y0 + th, x1 - x0 - 2 * th, y1 - y0 - 2 * th, rail);
    // stair zigzag on one side
    for (let j = 0; j < 5; j++) fb.rect(x0 + th + j * Math.max(1, 6 * sc), y0 + th + j * Math.max(1, 3 * sc), Math.max(1, 6 * sc), Math.max(1, sc), rail);
    // floor number
    if (sc > .18) { const s = (k + 1) + 'F'; text(fb, s, x0 + th + 2, y1 - th - 14 * Math.min(1, sc * 1.4), lit ? C.white : C.slate, { size: sc > .5 ? 12 : 8 }); }
  }
  // the top: a small warm square (2803's light leaks down the well)
  const zt = 28 - push * 26, st = 1 / (1 + zt * .32);
  fb.rect(Math.round(cx - 6 * st * 6), Math.round(cy - 4 * st * 6), Math.max(2, Math.round(12 * st * 6)), Math.max(2, Math.round(8 * st * 6)), C.goldD);
}
// —— 8. stair flight (side view, diagonal climb). scroll px; floor label every 60 px of climb
export function stairs(fb, t, s, o = {}) {
  fb.clear(C.deep);
  const lit = o.lit ?? 1;
  const base = lit ? C.dslate : C.night, edge = lit ? C.slate : C.dslate;
  // wall with floor numbers painted, moving diagonally (climb up-right → world moves down-left)
  for (let i = -2; i < 8; i++) {
    const fy = 150 - i * 70 + mod(s, 70) * 1, fl = i + Math.floor(s / 70) + (o.floor0 || 1);
    if (fl < 1 || fl > 28) continue;
    fb.rect(0, Math.round(fy) - 2, W, 2, C.night);
    fb.rect(220, Math.round(fy) - 40, 34, 24, edge); text(fb, fl + 'F', 224, Math.round(fy) - 37, lit ? C.white : C.steel, { shadow: C.ink });
  }
  // flights: steps rising to the right at 1:1.4
  const off = mod(s, 70);
  for (let i = -2; i < 10; i++) {
    const x = i * 10 - Math.round(off * 1.4 % 10), y = 170 - i * 7 + Math.round(off % 7);
    fb.rect(x, y, 11, 7, base); fb.rect(x, y, 11, 1, edge);
  }
  // handrail
  fb.line(0, 120 + Math.round(off % 7), W, 120 - W * .7 + Math.round(off % 7), lit ? C.steel : C.slate);
  if (lit) fb.glow(140, 40, 140, 70, LIGHT, .5);
}
// —— 9. corridor with door 2803 (front view). open 0..1, spill (warm light) ——
export const DOOR = { x: 130, y: 26, w: 60, h: 98 };
export function corridor(fb, t, open, o = {}) {
  fb.clear(C.night);
  fb.rect(0, 0, W, 124, C.night); for (let x = 0; x < W; x += 24) fb.rect(x, 0, 1, 124, C.ink);
  fb.rect(0, 124, W, 56, C.ink); fb.dither(0, 124, W, 56, (x, y) => (y - 124) / 80, C.ink, C.night);
  // corridor sound-light (dim)
  fb.rect(150, 2, 20, 3, o.lampOn ? C.white : C.slate);
  if (o.lampOn) fb.glow(160, 40, 120, 70, LIGHT, .5);
  const { x, y, w, h } = DOOR;
  // frame
  fb.rect(x - 6, y - 6, w + 12, h + 6, C.slate); fb.rect(x - 6, y - 6, w + 12, 1, C.steel); fb.rect(x - 6, y - 6, 1, h + 6, C.steel);
  // doorway interior (warm, protected gold) seen as the door swings
  const ow = Math.round(w * open);
  if (ow > 0) {
    fb.rect(x, y, w, h, C.goldD); fb.dither(x, y, w, h, (X, Y) => .55 - (Y - y) / 300, C.goldD, C.gold);
    fb.rect(x + 6, y + 30, 20, 18, C.goldL); fb.rect(x + 6, y + 30, 20, 1, C.warmW);                // a lamp shade glow inside
  }
  // the door leaf (panels, bevels, studs) shrinking as it swings inward (hinge on the left)
  const lw = w - ow;
  if (lw > 0) {
    fb.rect(x, y, lw, h, C.rust); fb.rect(x, y, lw, 1, C.clay); fb.rect(x, y, 1, h, C.clay);
    if (lw > 20) {
      const pw = lw - 14;
      for (const [py, ph] of [[8, 36], [52, 38]]) { fb.rect(x + 7, y + py, pw, ph, C.crimson); fb.rect(x + 7, y + py, pw, 1, C.umber); fb.rect(x + 7, y + py, 1, ph, C.umber); fb.rect(x + 7, y + py + ph - 1, pw, 1, C.clay); fb.rect(x + 6 + pw, y + py, 1, ph, C.clay); }
      // 福 diamond
      const fx = x + Math.round(lw / 2), fy = y + 26; fb.poly([[fx, fy - 12], [fx + 12, fy], [fx, fy + 12], [fx - 12, fy]], C.red); fb.poly([[fx, fy - 10], [fx + 10, fy], [fx, fy + 10], [fx - 10, fy]], C.red);
      text(fb, '福', fx - 6, fy - 7, C.amber);
      // number plate + handle + peephole
      fb.rect(x + lw / 2 - 12, y - 4, 24, 9, C.amber); text(fb, '2803', x + lw / 2 - 11, y - 6, C.ink, { size: 8 });
      fb.rect(x + lw - 9, y + 54, 4, 10, C.amber); fb.px(x + lw - 8, y + 55, C.yellow);
      fb.disc(x + lw / 2, y + 48, 1, C.ink);
      for (const sy of [10, 40, 70, 90]) fb.px(x + 2, y + sy, C.amber);
    }
  }
  // warm spill on the corridor floor
  if (open > 0) { fb.glow(x + w / 2, 140, 40 + 60 * open, 26, WARM, 1); fb.glow(x + w / 2, 70, 30 + 50 * open, 70, WARM, .4 + .5 * open); }
  // potted plant + shoe rack
  fb.rect(214, 104, 14, 20, C.dbrown); fb.ell(221, 98, 9, 8, C.dgreen); fb.ell(219, 95, 4, 3, C.green);
  fb.rect(70, 112, 34, 12, C.umber); fb.rect(72, 110, 12, 3, C.dslate); fb.rect(88, 110, 12, 3, C.crimson);
}
// interior seen from the doorway (for over-shoulder shots): warm room, table, a photo frame
export function interior(fb, t) {
  fb.clear(C.goldD);
  fb.dither(0, 0, W, 120, (x, y) => .5 - y / 260, C.goldD, C.gold);
  fb.rect(0, 120, W, 60, C.dbrown); fb.dither(0, 120, W, 60, (x, y) => .3, C.dbrown, C.brown);
  fb.rect(40, 30, 40, 30, C.umber); fb.rect(43, 33, 34, 24, C.tan); fb.disc(55, 44, 4, C.dbrown); fb.disc(66, 46, 3, C.brown);     // photo (two figures)
  fb.rect(200, 92, 90, 6, C.brown); fb.rect(206, 98, 4, 30, C.umber); fb.rect(280, 98, 4, 30, C.umber);                         // table
  fb.rect(150, 20, 2, 30, C.umber); fb.ell(151, 54, 14, 8, C.goldL); fb.rect(137, 54, 29, 1, C.warmW);                         // lamp
  fb.rect(250, 40, 30, 30, C.ink); fb.rect(252, 42, 26, 26, C.deep); for (let i = 0; i < 12; i++) fb.px(254 + (i * 7) % 24, 44 + (i * 5) % 22, C.r1);  // window with rain
}
// close-up backdrop: location colour field + a few bokeh-squares of practical lights
export function cuBack(fb, t, kind) {
  if (kind === 'street') { fb.gradV(0, 0, W, H, [C.deep, C.ink, C.night]); for (let i = 0; i < 9; i++) { const x = Math.round(hash(i, 40) * W), y = Math.round(hash(i, 41) * 120); fb.rect(x, y, 6, 6, i % 3 ? C.dslate : C.n0 + i % 4); } fb.glow(250, 60, 80, 70, WARM, .5); }
  if (kind === 'stair') { fb.gradV(0, 0, W, H, [C.black, C.ink, C.night]); for (let i = 0; i < 6; i++) fb.rect(i * 60, 0, 2, H, C.ink); }
  if (kind === 'door') { fb.gradV(0, 0, W, H, [C.goldD, C.gold, C.goldD]); fb.rect(240, 30, 40, 30, C.umber); fb.rect(243, 33, 34, 24, C.tan); }
  if (kind === 'doorOut') { fb.gradV(0, 0, W, H, [C.ink, C.night, C.dslate]); fb.glow(40, 90, 120, 120, WARM, 1); }
  if (kind === 'bus') { fb.gradV(0, 0, W, H, [C.deep, C.ink, C.navy]); fb.rect(0, 30, W, 4, C.steel); for (let i = 0; i < 7; i++) fb.rect(Math.round(hash(i, 3) * W), 50 + Math.round(hash(i, 4) * 60), 5, 5, C.dslate); }
  if (kind === 'night') { fb.gradV(0, 0, W, H, [C.deep, C.ink, C.night]); }
}
