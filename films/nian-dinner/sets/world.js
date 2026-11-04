// Scene assembly and the night lighting pass: the village (dusk / night / midnight backlight), the mountain, the kitchen wall; effects (shake, scraps, flashes, fireworks rosettes).
import { PAL, canvas, fillPaper, paperShadow, noShadow, transmitOf, holesOf, piece, fill, trace, Pl, P, ellipsePoly, curve } from '../engine/paper.js';
import { put, mul, T, S, R, ap } from '../engine/rig.js';
import { beginLight, pool, lightRect, lightImage, applyLight, glowWindow, bloom, rays, addMasked, E, L, Lc, Ec } from '../engine/light.js';
import { tuanhua, tuanhuaHoles } from '../engine/tuanhua.js';
import { kit, HOUSES, HERO, GATE, GROUND, NIGHT, drawSnowfall } from './village.js';
import { mountainKit } from './mountain.js';
import { clamp, lerp, seg, ss, eo, hash } from '/core/lib.js';
import { sawRow, rosette } from '../engine/motifs.js';

export const W = 1920, H = 1080;
export const cam = (x, y, z) => [z, 0, 0, z, 960 - x * z, 540 - y * z];
export const st = t => Math.floor(t * 12) / 12;
export const E_ = (t, a, b) => ss(seg(t, a, b));
export const pt = (M, p) => [M[0] * p[0] + M[2] * p[1] + M[4], M[1] * p[0] + M[3] * p[1] + M[5]];
export function mixPose(A, B, u) { const o = { ...A }; for (const k of Object.keys(B)) { const a = A[k], b = B[k]; o[k] = (typeof a === 'number' && typeof b === 'number') ? lerp(a, b, u) : (u < .5 ? (a ?? b) : b); } return o; }
export function shake(t, times, a = 5, f = 60) { let d = 0; for (const s of times) if (t > s && t < s + .4) d += a * Math.exp(-(t - s) * 10) * Math.sin((t - s) * f); return d; }
export const pop = (t, t0, k = 1.15) => { const u = st(t - t0); return u < 0 ? 0 : u < .085 ? k : 1; };   // one 12 fps step of overshoot, 0 before

// —— sky ——
export function sky(g, C, mode = 'night') {
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); fillPaper(g, 'ink', 0, 0, W, H, C);
  if (mode === 'dusk') { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, 'rgba(40,36,80,0)'); gr.addColorStop(.45, 'rgba(130,80,120,.5)'); gr.addColorStop(.8, 'rgba(210,130,110,.62)'); gr.addColorStop(1, 'rgba(230,160,120,.7)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
  g.restore();
}
// —— the village. o: { mode:'dusk'|'night'|'midnight', winI(i,t) window brightness, flowers (bool: window flowers pasted), crackers (bool), gateLanterns, behind(g), mid(g), front(g), lights(), after(g), bloom, snow, nianBehind }
const [HLc, HL] = canvas(W, H);
export function drawVillage(g, C, t, o = {}) {
  const V = kit(), z = C[0], mode = o.mode || 'night', night = true;
  beginLight(o.amb || (mode === 'dusk' ? 'rgb(226,210,222)' : mode === 'midnight' ? 'rgb(150,150,200)' : 'rgb(170,172,214)'));
  sky(g, C, mode === 'dusk' ? 'dusk' : 'night');
  if (o.sky) o.sky(g);
  put(g, V.far, mul(C, T(1700, 640)), { shadow: .8 });
  if (o.behind) o.behind(g);
  put(g, V.mid, mul(C, T(1500, 780)), { shadow: .8 });
  // trees behind the houses
  for (const [x, s, p] of [[300, .9, V.tree], [1340, .8, V.tree2], [2680, 1, V.tree], [3300, .85, V.tree2]]) put(g, p, mul(C, mul(T(x, GROUND - 60), S(s))), { shadow: .8 });
  // houses, back to front (right to left on the slope)
  const winBoxes = [];
  for (let i = HOUSES.length - 1; i >= 0; i--) {
    const h = HOUSES[i], hp = V.houses[i], M = mul(C, mul(T(h.x, GROUND + h.g), S(h.s))), win = hp.win;
    const I = o.winI ? o.winI(i, t) : 0;
    if (I > 0) {
      glowWindow(g, M, win, Math.min(1, I), null, { lattice: 3, lw: 3 }); glowWindow(E, M, win, Math.min(1, I) * (o.glowE ?? .7), null, { lattice: 3, lw: 3 });
      lightRect(q => { q.setTransform(...M); q.rect(win.x - win.w / 2, win.y - win.h / 2, win.w, win.h); });
      const c = pt(M, [win.x, win.y]); pool(c[0], c[1] + 40 * z * h.s, 240 * z * h.s, 'rgba(255,176,100,1)', .45 * Math.min(1.2, I));
    } else { g.save(); g.setTransform(...M); g.fillStyle = '#0c1024'; g.fillRect(win.x - win.w / 2, win.y - win.h / 2, win.w, win.h); g.restore(); }
    put(g, hp, M, { shadow: .9 });
    put(g, hp.snowCap, M, { shadow: .5 });
    // red pastes: couplets + banner + 福 + window flower
    if (o.couplets !== false) { for (const s of [-1, 1]) put(g, hp.couplets, mul(M, T(hp.door.x + s * (hp.door.w / 2 + 16), 0)), { shadow: .6 }); put(g, hp.banner, mul(M, T(hp.door.x, -hp.door.h - 26)), { shadow: .6 }); put(g, hp.fu, mul(M, T(hp.door.x, -hp.door.h * .62)), { shadow: .6 }); }
    const flowerOn = o.flowers ? (typeof o.flowers === 'function' ? o.flowers(i, t) : 1) : 0;
    if (flowerOn > 0) { const fs = win.w / 900 * 1.05 * flowerOn; if (mode === 'midnight' && I > 0) { put(g, V.flowerS, mul(M, mul(T(win.x, win.y), S(fs * 2.4))), { img: transmitOf(V.flowerS, '#c9241a'), shadow: 0 }); put(E, V.flowerS, mul(M, mul(T(win.x, win.y), S(fs * 2.4))), { img: transmitOf(V.flowerS, '#ff8a4a'), shadow: 0, alpha: .5 }); } else put(g, V.flowerS, mul(M, mul(T(win.x, win.y), S(fs * 2.4))), { shadow: .5 }); }
    winBoxes.push({ M, win, i, I });
    // lanterns under the eaves
    for (const dx of [-hp.w / 2 + 30, hp.w / 2 - 30]) { const sw = Math.sin(t * 1.3 + i + dx) * .05; put(g, V.lantern, mul(M, mul(T(dx, -hp.wallH - 6), mul(R(sw), S(.8)))), { shadow: .7 }); if (o.lanternsLit !== false) { const c = pt(M, [dx, -hp.wallH + 36]); pool(c[0], c[1], 150 * z * h.s, 'rgba(255,150,90,1)', .35); E.save(); E.setTransform(...mul(M, mul(T(dx, -hp.wallH - 6), S(.8)))); E.globalAlpha = .55; E.drawImage(V.lantern.c, V.lantern.x0, V.lantern.y0, V.lantern.w, V.lantern.h); E.restore(); } }
  }
  // the gate tower at the left, a wall each side
  const GM = mul(C, T(GATE.x, GROUND + GATE.g));
  put(g, V.wall, mul(GM, T(-560, 0)), { shadow: .8 }); put(g, V.wall.snow, mul(GM, T(-560, 0)), { shadow: .4 });
  put(g, V.wall2, mul(GM, T(450, 0)), { shadow: .8 }); put(g, V.wall2.snow, mul(GM, T(450, 0)), { shadow: .4 });
  put(g, V.gate, GM, { shadow: 1 }); put(g, V.gate.plaque, mul(GM, T(0, -270)), { shadow: .6 });
  if (o.crackers !== false) { const sw = (o.crackerSwing ? o.crackerSwing(t) : Math.sin(t * 1.1) * .03); put(g, V.gate.crackers, mul(GM, mul(T(0, -248), R(sw))), { shadow: .8 }); }
  for (const s of [-1, 1]) { const M2 = mul(GM, mul(T(s * 170, -236), mul(R(Math.sin(t * 1.2 + s) * .05), S(1.1)))); put(g, V.lantern, M2, { shadow: .8 }); if (o.gateLit !== false) { const c = pt(M2, [0, 44]); pool(c[0], c[1], 260 * z, 'rgba(255,160,95,1)', .55); E.save(); E.setTransform(...M2); E.globalAlpha = .6; E.drawImage(V.lantern.c, V.lantern.x0, V.lantern.y0, V.lantern.w, V.lantern.h); E.restore(); } }
  if (o.mid) o.mid(g);
  put(g, V.snow, mul(C, T(1500, GROUND + 10)), { shadow: .6 });
  for (const [k, x, s] of [[0, 900, 1], [1, 1800, .9], [2, 2900, 1.1]]) put(g, V.drifts[k], mul(C, mul(T(x, GROUND + 60), S(s))), { shadow: .6 });
  if (o.front) o.front(g);
  // —— light ——
  if (o.lights) o.lights();
  applyLight(g);
  if (o.after) o.after(g);
  bloom(g, o.bloom ?? (mode === 'midnight' ? .9 : .5));
  if (o.rays) rays(g, o.rays[0], o.rays[1], o.rays[2] ?? .4, 18, 2.4);
  if (o.snow !== false) { drawSnowfall(g, t, C, 0, o.snowOpt); drawSnowfall(g, t, C, 1, o.snowOpt); }
  return { winBoxes, GM };
}
// —— the mountain: three ridges and the road; o: { behind, onRoad(g), front, lights, after, snow, amb }
export function drawMountain(g, C, t, o = {}) {
  const Mk = mountainKit(), z = C[0];
  beginLight(o.amb || 'rgb(168,170,214)');
  sky(g, C, 'night');
  if (o.sky) o.sky(g);
  put(g, Mk.far, mul(C, T(1400, 520)), { shadow: .7 }); put(g, Mk.far.snow, mul(C, T(1400, 520)), { shadow: .3 });
  if (o.behind) o.behind(g);
  put(g, Mk.mid, mul(C, T(1200, 700)), { shadow: .7 }); put(g, Mk.mid.snow, mul(C, T(1200, 700)), { shadow: .3 });
  if (o.midLayer) o.midLayer(g);
  put(g, Mk.near, mul(C, T(1000, 980)), { shadow: .8 }); put(g, Mk.near.snow, mul(C, T(1000, 980)), { shadow: .3 });
  put(g, Mk.road, mul(C, T(1000, 760)), { shadow: .5 });
  if (o.onRoad) o.onRoad(g);
  if (o.front) o.front(g);
  if (o.lights) o.lights();
  applyLight(g);
  if (o.after) o.after(g);
  bloom(g, o.bloom ?? .5);
  if (o.snow !== false) { drawSnowfall(g, t, C, 0, o.snowOpt); drawSnowfall(g, t, C, 1, o.snowOpt); drawSnowfall(g, t, C, 2, o.snowOpt); }
}
// road point in world coordinates (the road piece sits at (1000,760))
export function roadAt(u) { const r = mountainKit().road.at(u); return { x: r.x + 1000, y: r.y + 760, ang: r.ang }; }
// —— a plain interior wall (kitchen) with the light map started
export function wallBg(g, C, tint = 'rgba(6,8,22,.35)') { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); fillPaper(g, 'indigo', 0, 0, W, H, C, tint); g.restore(); }
// —— effects ——
// flying paper scraps from a point: n scraps burst at t0, fall and settle; col = paper colour
export function burst(g, C, t, t0, x0, y0, n = 10, col = PAL.red, spread = 120, size = 12, seed = 1) {
  for (let k = 0; k < n; k++) {
    const u = t - t0 - hash(k + seed) * .08; if (u < 0 || u > 1.1) continue;
    const a = hash(k * 3.1 + seed) * 6.28, d = spread * (.5 + hash(k * 7.7 + seed)) * eo(Math.min(1, u / .5)), x = x0 + Math.cos(a) * d, y = y0 + Math.sin(a) * d * .6 + 220 * u * u;
    const sz = size * (.6 + hash(k * 5.3 + seed));
    g.save(); g.setTransform(...mul(C, mul(T(x, y), mul(R(u * 7 + k), S(1))))); g.globalAlpha = 1 - seg(u, .8, 1.1); paperShadow(g, C[0], 1.5);
    g.beginPath(); g.moveTo(-sz, -sz * .3); g.lineTo(sz * .8, -sz * .6); g.lineTo(sz * .3, sz * .7); g.closePath(); g.fillStyle = col; g.fill(); g.restore();
  }
}
// a flash on the emissive layer at screen point (sx, sy)
export function flash(sx, sy, r, a, col = '255,236,190') {
  if (a <= 0) return;
  E.save(); E.setTransform(1, 0, 0, 1, 0, 0); E.globalCompositeOperation = 'lighter'; const gr = E.createRadialGradient(sx, sy, 0, sx, sy, r); gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); E.fillStyle = gr; E.fillRect(sx - r, sy - r, r * 2, r * 2); E.restore();
}
// firecracker string going off: scraps and flashes along a string from (x0,y0) upward, one cracker every 90 ms
export function crackerBurst(g, C, t, t0, x0, y0, n = 16, sc = 1) {
  for (let k = 0; k < n; k++) {
    const tb = t0 + k * .09 + hash(k) * .04, u = t - tb; if (u < 0 || u > .9) continue;
    const bx = x0 + (hash(k * 2.3) - .5) * 60 * sc, by = y0 - k * 16 * sc;
    for (let j = 0; j < 6; j++) {
      const a = j / 6 * 6.28 + k, d = 70 * sc * eo(Math.min(1, u / .3)), x = bx + Math.cos(a) * d, y = by + Math.sin(a) * d + 180 * u * u;
      g.save(); g.setTransform(...mul(C, mul(T(x, y), mul(R(a + u * 8), S(sc))))); g.globalAlpha = 1 - seg(u, .5, .9);
      g.beginPath(); g.moveTo(-9, -4); g.lineTo(9, -7); g.lineTo(3, 8); g.closePath(); g.fillStyle = PAL.red; g.fill(); g.restore();
    }
    if (u < .12) { const c = pt(C, [bx, by]); flash(c[0], c[1], 90 * C[0] * sc, 1 - u / .12); }
  }
}
// rosette fireworks: a tuanhua unfolds in the sky, rotating, then fades; also on the emissive layer
const FW = {};
export function fireworks(g, C, t, list) {
  FW.p = FW.p || tuanhua(1.2, PAL.red);
  for (const [t0, x, y, s] of list) {
    const u = t - t0; if (u < 0 || u > 1.8) continue;
    const open = eo(Math.min(1, u / .4)), a = 1 - seg(u, 1.0, 1.8);
    const M = mul(C, mul(T(x, y + u * 30), mul(R(u * .5), S(s * (.1 + .9 * open)))));
    g.save(); g.globalAlpha = a; put(g, FW.p, M, { shadow: .5 }); g.restore();
    E.save(); E.globalAlpha = a * .7; put(E, FW.p, M, { img: transmitOf(FW.p, '#ff9a5a'), shadow: 0 }); E.restore();
    if (u < .15) { const c = pt(C, [x, y]); flash(c[0], c[1], 300 * C[0] * s, (1 - u / .15) * .8); }
  }
}
// snow spray: white scraps kicked up from (x0,y0)
export function spray(g, C, t, t0, x0, y0, n = 14, spread = 160, size = 9, seed = 3) { burst(g, C, t, t0, x0, y0, n, '#eef0f8', spread, size, seed); }
// steam swirl: a cream cut-cloud trail rising along a path (world coordinates), progress u 0..1
export function steamTrail(g, C, pts, u, col = '#efe8f4', width = 26) {
  if (u <= 0) return;
  const c = curve(pts, false, 6), n = Math.max(2, Math.floor(c.length * clamp(u)));
  g.save(); g.setTransform(...C); g.fillStyle = col; paperShadow(g, C[0], .6);
  for (let i = 0; i < n - 1; i++) { const a = c[i], w = width * (.5 + .5 * Math.sin(i * .25)) * (1 - .3 * i / c.length); g.beginPath(); g.arc(a[0] + Math.sin(i * .5) * 10, a[1], w, 0, 7); g.fill(); }
  g.restore();
  // swirl cuts (dark holes) along the trail so it reads as a cut cloud
  g.save(); g.setTransform(...C); g.fillStyle = 'rgba(20,24,50,.55)';
  for (let i = 4; i < n - 2; i += 9) { const a = c[i]; g.beginPath(); for (let k = 0; k <= 30; k++) { const q = k / 30, an = q * 4.5, rr = 11 * (1 - q * .85); g[k ? 'lineTo' : 'moveTo'](a[0] + Math.cos(an) * rr, a[1] + Math.sin(an) * rr); } g.lineWidth = 3; g.strokeStyle = 'rgba(20,24,50,.55)'; g.stroke(); }
  g.restore();
}
// a flat red sheet piece (for cutting inserts)
export function sheetPiece(w, h, col = PAL.red, seed = 5) { return piece([0, 0, w, h], g => fill(g, q => trace(q, Pl([[0, 0], [w, 0], [w, h], [0, h]], true, .5, seed)), col), { ss: 1.5, seed, col }); }
