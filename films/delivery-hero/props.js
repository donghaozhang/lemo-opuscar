// props.js — e-bike, noodle bowl, phone, umbrella, dog, enemies (red light, flood blob, boss stairs), save point
import { C, T, FB, sprite, outline, clamp, lerp, hash, bayer } from './px.js';
import { text, textW } from './font.js';

const sh3 = (m) => (x, y, nx, ny) => { const l = -nx * .6 - ny * .8; return l > .45 ? m[2] : l < -.3 ? m[0] : m[1]; };
// —— e-bike, side view, facing right. (gx, gy) = ground under the bike centre. o: {u, light, spin (wheel phase), bounce, face}
export function ebike(fb, gx, gy, o = {}) {
  const u = o.u || 1, face = o.face || 1, f = sprite(Math.round(60 * u), Math.round(44 * u)), X = Math.round(30 * u), Y = Math.round(40 * u);
  const b = o.bounce || 0, P = (x, y) => [X + x * u, Y + y * u + (y < -6 ? b * u : 0)];
  const wheel = (cx) => {
    const [x, y] = P(cx, -5.5); f.disc(x, y, 5.5 * u, C.ink); f.disc(x, y, 4.2 * u, C.night); f.disc(x, y, 3.4 * u, C.ink);
    f.disc(x, y, 1.6 * u, C.steel);
    for (let k = 0; k < 3; k++) { const a = (o.spin || 0) + k * 2.094; f.line(x, y, x + Math.cos(a) * 3.3 * u, y + Math.sin(a) * 3.3 * u, C.slate); }
  };
  wheel(-12); wheel(12);
  // frame (step-through): rear hub → under seat → footboard → head tube
  const fr = [P(-12, -6), P(-8, -13), P(-3, -7), P(5, -7), P(9, -17)];
  for (let i = 0; i < fr.length - 1; i++) f.capsule(fr[i][0], fr[i][1], fr[i + 1][0], fr[i + 1][1], 1.6 * u, sh3([C.dslate, C.slate, C.steel]));
  // body panel (scooter shell): teal
  f.poly([P(-15, -10), P(-6, -15), P(1, -15), P(-2, -8), P(-12, -7)].map(p => p), sh3([C.teal, C.dgreen, C.green]));
  f.poly([P(5, -8), P(10, -20), P(13, -18), P(9, -7)], sh3([C.teal, C.dgreen, C.green]));
  // fender front
  f.poly([P(7, -11), P(15, -12), P(17, -8), P(15, -9)], C.dslate);
  // seat
  f.capsule(...P(-11, -16), ...P(-2, -16), 1.6 * u, C.ink);
  // handlebar + grip
  f.capsule(...P(10, -20), ...P(8, -23), 1 * u, C.ink); f.capsule(...P(8, -23), ...P(4, -23), 1 * u, C.ink);
  // headlight
  const hl = P(13.5, -18); f.ell(hl[0], hl[1], 1.8 * u, 1.5 * u, o.light ? C.white : C.steel);
  // tail light
  const tl = P(-16, -11); f.rect(tl[0], tl[1], 1.4 * u, 1.4 * u, C.red);
  // delivery box on the rack
  if (o.box !== false) {
    const [bx, by] = P(-20, -29);
    f.rect(bx, by, 14 * u, 13 * u, C.blue); f.rect(bx, by, 14 * u, 2 * u, C.cyan); f.rect(bx + 13 * u, by, 1 * u, 13 * u, C.navy); f.rect(bx, by + 12 * u, 14 * u, 1 * u, C.navy);
    f.rect(bx + 1 * u, by + 6 * u, 12 * u, Math.max(1, 1.3 * u), C.yellow);
    // bowl icon
    f.ell(bx + 7 * u, by + 4 * u, 2.3 * u, 1.2 * u, C.white);
    f.capsule(...P(-12, -16), ...P(-12, -16), 1, C.ink);
  }
  outline(f, C.ink);
  fb.blit(f, Math.round(gx - (face > 0 ? X : f.w - X)), Math.round(gy - Y), face < 0);
  return { seat: [gx + (-6.5 * u) * face, gy - 18 * u + b * u], bar: [gx + 6 * u * face, gy - 23 * u + b * u], light: [gx + 14 * u * face, gy - 18 * u + b * u] };
}
// headlight cone: relight a wedge ahead of the bike
export function headCone(fb, x, y, face, len, tab) {
  fb.relight(Math.round(face > 0 ? x : x - len), Math.round(y - len * .35), len, Math.round(len * .9), (X, Y) => {
    const dx = (X - x) * face; if (dx < 2) return null; const half = dx * .32 + 2, dy = Y - (y + dx * .12);
    if (Math.abs(dy) > half) return null; const k = 1 - dx / len - Math.abs(dy) / half * .4; return k > bayer(X, Y) * .9 ? tab : null;
  });
}
// —— noodle bowl in a delivery bag (held) ——
export function bag(fb, x, y, u = 1) {
  const f = sprite(Math.round(14 * u), Math.round(14 * u)), c = Math.round(7 * u);
  f.poly([[c - 5 * u, 4 * u], [c + 5 * u, 4 * u], [c + 4 * u, 12 * u], [c - 4 * u, 12 * u]], (X, Y) => X < c - 1 * u ? C.silver : C.white);
  f.rect(c - 5 * u, 6 * u, 10 * u, Math.max(1, u), C.red);   // bag stripe
  f.ell(c - 2.5 * u, 3 * u, 1.4 * u, 2.4 * u, C.ink); f.ell(c + 2.5 * u, 3 * u, 1.4 * u, 2.4 * u, C.ink);
  f.ell(c - 2.5 * u, 3 * u, .6 * u, 1.6 * u, T); f.ell(c + 2.5 * u, 3 * u, .6 * u, 1.6 * u, T);
  outline(f); fb.blit(f, Math.round(x - c), Math.round(y - 2 * u));
}
// open bowl of longevity noodles with steam (u scale; steam animated by t); egg + greens
export function bowl(fb, x, y, u, t, o = {}) {
  const f = sprite(Math.round(40 * u), Math.round(30 * u)), cx = Math.round(20 * u), cy = Math.round(18 * u);
  f.ell(cx, cy + 2 * u, 12 * u, 7 * u, (X, Y, nx, ny) => ny > .2 ? (nx < -.3 ? C.silver : C.white) : C.white);
  f.ell(cx, cy, 11 * u, 3.4 * u, C.tan);                               // broth
  for (let i = 0; i < 9; i++) { const a = i * .7; f.line(cx - 9 * u + i * 2 * u, cy - 1 * u + Math.sin(a) * u, cx - 8 * u + i * 2 * u, cy + 1.5 * u, C.sand); }
  f.ell(cx + 4 * u, cy - .5 * u, 2.4 * u, 1.4 * u, C.white); f.ell(cx + 4 * u, cy - .5 * u, 1 * u, .8 * u, C.amber);   // egg
  f.rect(cx - 6 * u, cy - 1 * u, 3 * u, 1 * u, C.lime); f.rect(cx - 2 * u, cy + .5 * u, 2 * u, 1 * u, C.green);
  // red rim pattern on the bowl
  for (let i = -10; i <= 10; i += 3) f.rect(cx + i * u, cy + 4 * u, Math.max(1, u), Math.max(1, u), C.crimson);
  outline(f);
  fb.blit(f, Math.round(x - cx), Math.round(y - cy));
  if (o.steam !== false) for (let k = 0; k < 3; k++) {     // steam wisps: stepped at 8 fps
    const ph = Math.floor(t * 8) / 8 + k * .7;
    for (let j = 0; j < 7; j++) { const yy = y - 5 * u - j * 2 * u - (ph % 1) * 4 * u; const xx = x + (k - 1) * 5 * u + Math.sin(j * .9 + ph * 3) * 1.5 * u; if ((j + k) % 2 === 0) fb.px(xx, yy, j < 3 ? C.white : C.silver); }
  }
}
// —— phone (big insert) is drawn in scenes; small phone in a hand ——
export function phoneSmall(fb, x, y, u, on, face = 1) {
  fb.rect(x - 1.6 * u, y - 3 * u, 3.4 * u, 5.4 * u, C.ink); if (on) fb.rect(x - 1 * u, y - 2.4 * u, 2.2 * u, 3.8 * u, C.glow);
}
// —— umbrella (protected red), open; (x,y) = handle grip; pop 0..1 opening; tilt degrees
export function umbrella(fb, x, y, u, pop = 1, tilt = 0) {
  const f = sprite(Math.round(44 * u), Math.round(40 * u)), cx = Math.round(22 * u), top = Math.round(8 * u);
  const sx = lerp(.25, 1, pop), sy = lerp(1.6, 1, pop);
  const R = 13 * u * sx, H = 8 * u * sy;
  f.ell(cx, top + H, R, H, (X, Y, nx, ny) => Y > top + H ? T : ((Math.floor((nx + 1) * 3) % 2) ? C.uR : C.uRL));
  // scalloped rim
  for (let i = -3; i <= 3; i++) f.ell(cx + i * R / 3.5, top + H, R / 7, 1.4 * u, C.uRD);
  f.vline(cx, top - 2 * u, top + H + 14 * u, C.silver); f.px(cx - 1 * u, top + H + 14 * u, C.silver); f.px(cx - 2 * u, top + H + 13 * u, C.silver);
  outline(f, C.ink);
  const a = tilt * Math.PI / 180; const hx = cx, hy = top + H + 14 * u;
  // rotate by nearest-neighbour around the handle
  const ca = Math.cos(a), sa = Math.sin(a);
  for (let j = 0; j < f.h; j++) for (let i = 0; i < f.w; i++) {
    const dx = i - hx, dy = j - hy; const sxp = Math.round(hx + dx * ca + dy * sa), syp = Math.round(hy - dx * sa + dy * ca);
    const c = f.get(sxp, syp); if (c !== T) fb.px(x + dx, y + dy, c);
  }
}
// closed folded umbrella (item / held)
export function umbrellaClosed(fb, x, y, u = 1) { fb.line(x, y, x + 2 * u, y - 10 * u, C.uRD); fb.line(x + 1, y, x + 2 * u + 1, y - 10 * u, C.uR); fb.px(x - 1, y + 1, C.silver); }

// —— dog 大黄: side view facing left by default. pose: 'stand','bark','sit','roll','wag'; t for tail
export function dog(fb, gx, gy, pose, t, o = {}) {
  const u = o.u || 1, f = sprite(Math.round(50 * u), Math.round(40 * u)), X = Math.round(25 * u), Y = Math.round(36 * u);
  const fur = sh3([C.brown, C.amber, C.yellow]), furD = sh3([C.dbrown, C.brown, C.tan]);
  const P = (x, y) => [X + x * u, Y + y * u];
  if (pose === 'roll') {     // belly up, legs waving
    const k = Math.sin(t * 14) * 1.5;
    f.ell(...P(0, -6), 11 * u, 6 * u, fur); f.ell(...P(0, -4), 8 * u, 3.5 * u, C.sand);
    for (const [lx, ph] of [[-7, 0], [-3, 1], [4, 2], [8, 3]]) f.capsule(...P(lx, -9), ...P(lx + Math.sin(t * 12 + ph) * 1.5, -15 + k * .4), 1.6 * u, furD);
    f.ell(...P(-12, -4), 5 * u, 4.5 * u, fur); f.ell(...P(-15, -3), 2.5 * u, 2 * u, C.tan); f.px(...P(-16.5, -4.5), C.ink);
    f.rect(...P(-12, -2), 2 * u, 1 * u, C.ink); f.ell(...P(-9, 0), 1.6 * u, 2.4 * u, C.pink);       // tongue
    outline(f); fb.blit(f, gx - X, gy - Y); return;
  }
  const bark = pose === 'bark', sit = pose === 'sit';
  const bob = bark ? (Math.floor(t * 8) % 2) : 0;
  // tail (wag)
  const wag = pose === 'wag' || sit ? Math.sin(t * 22) * 4 : bark ? -2 : 1;
  f.capsule(...P(9, -12), ...P(14, -18 + wag * .3), 1.5 * u, fur); f.capsule(...P(14, -18 + wag * .3), ...P(15 + wag * .4, -22), 1.2 * u, fur);
  // back legs
  if (sit) { f.ell(...P(6, -5), 5 * u, 5 * u, furD); }
  else { f.capsule(...P(6, -8), ...P(7, 0), 1.8 * u, furD); f.capsule(...P(-6, -8), ...P(-6, 0), 1.8 * u, furD); }
  // body
  f.ell(...P(sit ? 2 : 1, sit ? -9 : -10 - bob), 10 * u, sit ? 6.5 * u : 5.5 * u, fur);
  f.ell(...P(-1, sit ? -6 : -7), 6 * u, 2.2 * u, C.sand);
  // front legs
  f.capsule(...P(-4, -8), ...P(-4, 0), 1.8 * u, fur); f.capsule(...P(-8, -8), ...P(-8.5, 0), 1.8 * u, fur);
  // head
  const hx = -10, hy = (sit ? -17 : -15) - bob - (bark ? 1 : 0);
  f.ell(...P(hx, hy), 5.6 * u, 5 * u, fur);
  f.ell(...P(hx - 4.5, hy + 2), 3 * u, 2.4 * u, C.tan);                                   // muzzle
  f.rect(...P(hx - 7.5, hy + .6), 1.6 * u, 1.4 * u, C.ink);                                 // nose
  if (bark) { f.poly([P(hx - 7, hy + 3), P(hx - 2, hy + 3), P(hx - 6, hy + 6.5)], C.crimson); f.rect(...P(hx - 6, hy + 3), 3 * u, Math.max(1, .8 * u), C.white); }
  // ears: one up, one floppy
  f.poly([P(hx + 1, hy - 4), P(hx + 4, hy - 9), P(hx + 4.5, hy - 3)], furD);
  f.poly([P(hx - 2, hy - 4), P(hx - 5, hy - 3), P(hx - 4, hy + 1)], C.dbrown);
  // eye: angry brow when barking, happy arc when wagging
  const ex = P(hx - 2.5, hy - 1);
  if (pose === 'wag' || sit) { f.px(ex[0] - 1, ex[1], C.ink); f.px(ex[0], ex[1] - 1, C.ink); f.px(ex[0] + 1, ex[1], C.ink); }
  else { f.rect(ex[0], ex[1], Math.max(1, u), Math.max(2, 1.5 * u), C.ink); if (bark) f.line(ex[0] - 1.5 * u, ex[1] - 2.5 * u, ex[0] + 2 * u, ex[1] - 1.3 * u, C.ink); }
  if (o.tongue) f.ell(...P(hx - 5, hy + 4.5), 1.3 * u, 2 * u, C.pink);
  outline(f);
  fb.blit(f, Math.round(gx - X), Math.round(gy - Y), o.face === 1);
}

// —— enemy: the red light that won't change (front view, with a face). state: 'red'|'green', mood: 'stern'|'smirk'|'shy'
export function trafficLight(fb, cx, gy, state, mood, t, count = 99) {
  const f = sprite(56, 110), X = 28;
  f.rect(X - 2, 40, 4, 66, C.dslate); f.rect(X - 1, 40, 1, 66, C.slate);            // pole
  f.rect(X - 10, 104, 20, 4, C.dslate);
  // housing
  f.rect(X - 13, 2, 26, 46, C.night); f.rect(X - 12, 3, 24, 44, C.dslate); f.rect(X - 12, 3, 2, 44, C.slate);
  // lamps
  const red = state === 'red';
  f.disc(X, 14, 8, red ? C.red : C.crimson);
  if (red) { f.disc(X - 2, 12, 3, C.pink); }
  f.disc(X, 36, 8, red ? C.dgreen : C.lime);
  if (!red) f.disc(X - 2, 34, 3, C.white);
  // face on the lit lamp
  const ly = red ? 14 : 36;
  if (mood === 'stern') { f.line(X - 6, ly - 4, X - 2, ly - 2, C.ink); f.line(X + 6, ly - 4, X + 2, ly - 2, C.ink); f.rect(X - 5, ly - 1, 2, 2, C.ink); f.rect(X + 3, ly - 1, 2, 2, C.ink); f.hline(X - 3, X + 3, ly + 4, C.ink); }
  if (mood === 'smirk') { f.line(X - 6, ly - 3, X - 2, ly - 3, C.ink); f.line(X + 6, ly - 4, X + 2, ly - 2, C.ink); f.rect(X - 5, ly - 1, 2, 1, C.ink); f.rect(X + 3, ly - 1, 2, 2, C.ink); f.line(X - 3, ly + 4, X + 3, ly + 2, C.ink); }
  if (mood === 'shy') { f.line(X - 6, ly - 3, X - 3, ly - 4, C.ink); f.line(X + 6, ly - 3, X + 3, ly - 4, C.ink); f.px(X - 4, ly, C.ink); f.px(X - 5, ly - 1, C.ink); f.px(X - 3, ly - 1, C.ink); f.px(X + 4, ly, C.ink); f.px(X + 3, ly - 1, C.ink); f.px(X + 5, ly - 1, C.ink); f.hline(X - 2, X + 2, ly + 4, C.ink); f.rect(X - 7, ly + 2, 2, 1, C.pink); f.rect(X + 5, ly + 2, 2, 1, C.pink); }
  // countdown display below
  f.rect(X - 11, 50, 22, 12, C.ink); const s = String(count).padStart(2, '0');
  text(f, s, X - textW(s) / 2, 50, red ? C.red : C.lime);
  // folded arms (stern) under the housing
  if (mood !== 'shy') { f.capsule(X - 14, 30, X - 4, 40, 2.2, C.slate); f.capsule(X + 14, 30, X + 4, 40, 2.2, C.steel); }
  outline(f);
  fb.blit(f, Math.round(cx - X), Math.round(gy - 108));
}
// —— enemy: flood blob 积水怪. rise 0..1, hit (flash), t
export function floodBlob(fb, cx, gy, rise, t, o = {}) {
  const hh = Math.round(46 * rise); if (hh <= 2) return;
  const f = sprite(96, 64), X = 48, Y = 62;
  const wob = (x) => Math.sin(x * .25 + t * 6) * 2 + Math.sin(x * .11 - t * 3) * 1.5;
  for (let x = -40; x <= 40; x++) {
    const env = Math.sqrt(Math.max(0, 1 - (x / 40) ** 2)); const top = Y - hh * env - wob(x) * env;
    for (let y = Math.floor(top); y < Y; y++) { const d = (y - top); f.px(X + x, y, d < 2 ? C.cyan : d < 6 ? C.blue : (bayer(X + x, y) < .5 ? C.navy : C.blue)); }
  }
  if (rise > .6) { // eyes (drain grates) and grin
    const ey = Y - hh * .62;
    for (const ex of [-12, 10]) { f.rect(X + ex - 4, ey - 3, 9, 7, C.ink); for (let k = 0; k < 4; k++) f.rect(X + ex - 3 + k * 2, ey - 2, 1, 5, C.slate); if (o.angry) f.line(X + ex - 5 * Math.sign(ex || 1), ey - 6, X + ex + 3 * Math.sign(ex || 1), ey - 4, C.ink); }
    f.poly([[X - 10, Y - hh * .32], [X + 10, Y - hh * .32], [X + 6, Y - hh * .2], [X - 6, Y - hh * .2]], C.ink);
  }
  outline(f);
  if (o.flash) for (let i = 0; i < f.d.length; i++) if (f.d[i] !== T && f.d[i] !== C.ink) f.d[i] = C.white;
  fb.blit(f, Math.round(cx - X), Math.round(gy - Y));
}
// —— save point: a floating gold-cyan rhombus (flat-shaded 3D, quantised), with sparkle
export function savePoint(fb, cx, cy, t, u = 1) {
  const a = Math.floor(t * 8) / 8 * Math.PI / 2; const bob = Math.round(Math.sin(t * 2.5) * 1.5);
  const pts = [0, 1, 2, 3].map(i => [Math.cos(a + i * Math.PI / 2) * 7 * u, Math.sin(a + i * Math.PI / 2) * 3 * u]);
  const top = [0, -11 * u], bot = [0, 11 * u];
  const faces = [];
  for (let i = 0; i < 4; i++) { const p = pts[i], q = pts[(i + 1) % 4]; faces.push({ tri: [top, p, q], z: (p[1] + q[1]) / 2, l: Math.cos(a + i * Math.PI / 2 + .8) }); faces.push({ tri: [bot, p, q], z: (p[1] + q[1]) / 2, l: Math.cos(a + i * Math.PI / 2 + .8) - .6 }); }
  faces.sort((A, B) => A.z - B.z);
  for (const F of faces) { if (F.z < -1) continue; const c = F.l > .5 ? C.white : F.l > 0 ? C.cyan : F.l > -.6 ? C.blue : C.navy; fb.poly(F.tri.map(([x, y]) => [cx + x, cy + y + bob]), c); }
  for (let k = 0; k < 4; k++) { const ph = (t * 1.3 + k * .25) % 1; const sx = cx + Math.sin(k * 2.4) * 10 * u, sy = cy + 10 * u - ph * 26 * u; if (Math.floor(t * 12 + k) % 3) { fb.px(sx, sy, C.white); fb.px(sx - 1, sy, C.cyan); fb.px(sx + 1, sy, C.cyan); fb.px(sx, sy - 1, C.cyan); fb.px(sx, sy + 1, C.cyan); } }
}
