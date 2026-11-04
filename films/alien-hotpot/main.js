// 外星人来吃火锅 — Sci-Fi Sitcom Toon. Picture = render(t); all timing from timeline.js.
import { clamp, lerp, seg, ss, eo, ei, eio, back, hash, TAU } from '/core/lib.js';
import { W, H, INK, init, frame, g, push, pop, translate, rotate, scale, shape, fillOnly, stroke, ell, arc, rr, rect, spline, dot, text, screenRect, S, noodle, reset, quad, bands } from './toon.js';
import { LATE, C, light, mix, mul, liu, zug, pip, translator, cell, pot, saucer, hexCoin, coin, chopsticks, tripe, puff, hand, sweat } from './chars.js';
import { NIGHT, MORNING, city, alley, rain, zhuanrang, renzheng, interior, counter, table, stool, counterTop, menuBoard, sign, FONT, SHOP, SHOPIN } from './sets.js';
import { DUR, q, SECS, sec, beat, SHOTS, shotAt, LINES, WHO, HITS, DIPS, DIPS2, FOLEY, dipFoley, TITLE, TAGS } from './timeline.js';

init(document.getElementById('c'));
const J = async f => { try { const r = await fetch(f); if (r.ok) return await r.json(); } catch (e) { } return null; };
const DURS = (await J('voices/dur.json')) || {}, LIPS = (await J('voices/lips.json')) || {};
const LINE = Object.fromEntries(LINES.map(l => [l.id, l]));
const vdur = id => DURS[id] ?? LINE[id].syl * (LINE[id].who === 'ZUG' ? .26 : LINE[id].who === 'PIP' ? .12 : .2);

// —— lip sync (stepped at 12 fps) ——
function talk(who, t) {
  const tq = q(t);
  for (const L of LINES) {
    if (L.who !== who) continue;
    if (tq >= L.t && tq < L.t + vdur(L.id)) {
      const k = Math.floor((tq - L.t) * 24), lp = LIPS[L.id];
      const o = lp ? (lp.o[k] ?? 0) : .5 * (1 + Math.sin(tq * 20)) / 2, b = lp ? (lp.b[k] ?? .5) : .5;
      return { o, w: .8 + .4 * b - .15 * o, talking: true, u: (tq - L.t) / vdur(L.id) };
    }
  }
  return { o: 0, w: 1, talking: false };
}
const blinkAt = (t, list, d = .14) => list.some(b => t >= b && t < b + d);
const idleBlink = (t, seed, every = 3.1) => { const k = Math.floor(t / every), ph = t - k * every, at = hash(k * 3.7 + seed) * (every - .3); return ph > at && ph < at + .14; };
const breath = (t, f = .3) => 1 + .01 * Math.sin(q(t) * TAU * f);
const pulse = (t, t0, d = .5) => { const u = (t - t0) / d; return u < 0 || u > 1 ? 0 : Math.sin(u * Math.PI); };
const landSq = (t, tl, a = .22) => { const u = t - tl; if (u < 0 || u > .6) return 1; return 1 - a * Math.exp(-u * 8) * Math.cos(u * 28); };
const K12 = t => Math.floor(t * 12);

// —— camera ——
function cam(cx, cy, z, rot = 0, shake = 0, t = 0) {
  reset(); translate(W / 2, H / 2);
  if (shake) { const f = Math.floor(t * 24); translate((hash(f) - .5) * shake * 2, (hash(f + 77) - .5) * shake * 2); }
  scale(z); if (rot) rotate(rot); translate(-cx, -cy);
}
const mv = (t, t0, t1, a, b, e = ss) => lerp(a, b, e(seg(t, t0, t1)));
const decay = (t, t0, a, k = 6) => t < t0 ? 0 : a * Math.exp(-(t - t0) * k);

// —— light ——
const NIGHT_OUT = () => light('#8088d8', .32);
const ROOM = () => light('#ffe9c8', .06);
const tintK = (k, col = '#6ff4ff', dark = 0) => c => { let x = k ? mix(mul(c, col, .5 * k), col, .1 * k) : c; return dark ? mix(x, '#0b0a1a', dark) : x; };
function roomPal(k = 0, dark = 0) { const K = tintK(k, '#6ff4ff', dark); return { K, P: { wallU: K('#e6d8b4'), wallUS: K('#c9b88e'), tile: K('#2f5d5a'), tileS: K('#244a48'), floor: K('#6b3a2e'), floorS: K('#57302a') } }; }
function fuelLight(k) { if (k <= 0) { ROOM(); return; } light('#6ff4ff', .38 * k); }

// —— poses ——
const LIU_C = { x: 330, y: 820, face: 1 };
const LIU_T = { x: 1040, y: 905, face: 1 };
const ZUG_T = { x: 790, y: 960, sit: 1, face: 1 };
const PIP_T = { x: 1405, y: 772, face: -1 };
const POT = [1040, 668, .78];
function L(t, o = {}) {
  const m = talk('LIU', t);
  return { ...LIU_C, lid: .42, look: [0, 0], blink: idleBlink(t, 1, 3.6), sq: breath(t, .25), mouth: { sm: -.25, hum: m.talking ? m.o : 0 }, ...o };
}
function Z(t, o = {}) {
  const m = talk('ZUG', t);
  return { ...ZUG_T, lid: .56, look: [0, 0], blink: idleBlink(t, 2, 4.2), sq: breath(t, .2), mouth: { o: m.o * .8, w: m.w, sm: -.08 }, headTilt: m.talking ? (m.o - .3) * .05 : 0, ...o };
}
function Pp(t, o = {}) {
  const m = talk('PIP', t);
  return { ...PIP_T, t, lid: .06, look: [0, 0], jit: 1.5, blink: idleBlink(t, 3, 2.2), sq: breath(t, .5), mouth: { o: m.o * 1.15, w: m.w, sm: -.4 }, headTilt: m.talking ? (m.o - .3) * .1 : 0, ...o };
}

// —— the shop, drawn in depth order ——
function shop(t, o = {}) {
  const { K, P } = roomPal(o.k || 0, o.dark || 0);
  interior(t, { P, dark: 0, menuHi: o.menuHi ?? -1, tubeOff: o.tubeOff, door: o.door, outside: o.outside, noSign: o.noSign });
  if (o.behind) o.behind(K);
  if (o.liu === 'counter') liu(o.liuP);
  counter({ K });
  if (o.counterTop) o.counterTop(K);
  if (o.stools !== false) { stool(1405, 790, 170, K); }
  if (o.zug) zug(o.zug);
  if (o.liu === 'table') liu(o.liuP);
  if (o.pip) pip(o.pip);
  if (o.table !== false) table({ K });
  if (o.pot !== false) pot(POT[0], POT[1], POT[2], { t, heat: o.heat ?? 1, boil: o.boil ?? 1, steam: o.steam ?? 1, pick: o.pick, sides: o.liu === 'table' });
  for (const f of LATE.splice(0)) f();
  if (o.front) o.front(K);
}
// the coins on the counter top seen from above
const COINS = [[700, 520], [860, 540], [1020, 520]];

// —— helpers drawn in shots ——
function bigArm(from, to, s, skin, sleeve, { fist = false, ang = 0, hold = null } = {}) {
  shape(noodle(from, to, 0, 90 * s, 76 * s), { fill: sleeve, lw: 8 });
  if (hold) hold(to);
  hand(to[0], to[1], ang, 42 * s, skin, { fist, lw: 7 });
}
function drips(x, y, t, n = 4, spread = 80, h = 260) {
  for (let i = 0; i < n; i++) { const ph = (t * .9 + hash(i * 3.1)) % 1; dot(x + (hash(i * 7) - .5) * spread, y + ph * h, 5, '#bfe0ff'); }
}
function umbrella(x, y, s = 1) {
  push(); translate(x, y); scale(s);
  stroke([[0, 0], [0, 230]], 7); stroke(arc(-14, 230, 14, 14, 0, Math.PI, 8), 6);
  shape(spline([[-170, 10], [-120, -70], [0, -100], [120, -70], [170, 10], [114, -6], [56, 10], [0, -6], [-56, 10], [-114, -6]]), { fill: '#c8202a', lw: 7, shade: () => fillOnly(rect(0, -110, 200, 130), '#9a1820', { boil: .3 }) });
  pop();
}
function bowl(x, y, s = 1, { steam = 0, t = 0 } = {}) {
  push(); translate(x, y); scale(s);
  shape(spline([[-34, -10], [34, -10], [26, 18], [-26, 18]]), { fill: '#f4efe2', lw: 5, shade: () => fillOnly(rect(-40, 2, 80, 10), '#c8202a', { boil: .3 }) });
  shape(ell(0, -10, 34, 8, 16), { fill: C.broth, lw: 4 });
  if (steam) stroke(spline([[0, -20], [8, -36], [-6, -50], [6, -64]], false), 4, { line: 'rgba(255,255,255,.7)' });
  pop();
}
// queue people (simple, varied; big eyes like everyone)
const PCOL = ['#d9734e', '#4f8a8b', '#7a9be0', '#e0a83a', '#9a2f3b', '#6b5f9e', '#3b6fd6', '#c96aa0'];
function person(x, y, s, i, t, { look = [0, 0], up = 0 } = {}) {
  push(); translate(x, y + Math.sin(t * 2 + i) * 2); scale(s * (i % 2 ? 1 : -1), s);
  const h = 300 + (hash(i * 3) - .5) * 70, col = PCOL[i % PCOL.length], skin = ['#e9b48a', '#c98c63', '#f2c9a0', '#a8714a'][i % 4];
  for (const sx of [-1, 1]) shape(noodle([sx * 20, -h * .4], [sx * 22, -10], 0, 30, 26), { fill: '#3b3445', lw: 6 });
  shape(spline([[-52, -h * .78], [52, -h * .78], [62, -h * .36], [-62, -h * .36]]), { fill: col, lw: 6 });
  push(); translate(0, -h * .78 - 52); rotate(up * -.2);
  shape(ell(0, 0, 46, 52, 24), { fill: skin, lw: 6 });
  shape(spline([[-48, 0], [-44, -40], [0, -58], [44, -40], [48, -4], [20, -30], [-20, -30]]), { fill: ['#2a2433', '#5a3a2a', '#3b3445', '#a29db3'][i % 4], lw: 6 });
  for (const ex of [-2, 26]) { shape(ell(ex, 4 - up * 6, 13, 15, 16), { fill: C.white, lw: 4, shade: () => dot(ex + look[0] * 5, 4 - up * 10 + look[1] * 5, 3.5) }); }
  stroke(quad([4, 32], [14, 36], [24, 32], 6), 4);
  pop();
  if (i % 3 === 0) { push(); translate(40, -h * .55); shape(rr(-10, -30, 26, 44, 6), { fill: '#2a2433', lw: 4 }); pop(); }   // a phone
  pop();
}
// queue aliens: five new shapes, each with a tiny bowl
function creature(kind, x, y, s, t, i) {
  push(); translate(x, y); scale(s);
  const bob = Math.sin(t * 5 + i) * 4, cols = ['#ff9ecb', '#f3c84a', '#7a9be0', '#c96aa0', '#9ad06a'];
  const col = cols[kind % 5];
  if (kind % 5 === 0) {   // a three-eyed blob
    shape(spline([[-70, 0], [-80, -90], [-30, -170 + bob], [30, -170 + bob], [80, -90], [70, 0]]), { fill: col, lw: 6 });
    for (const ex of [-34, 0, 34]) shape(ell(ex, -110 + bob, 14, 17, 14), { fill: C.white, lw: 4, shade: () => dot(ex + 3, -108 + bob, 3.5) });
  } else if (kind % 5 === 1) {   // a tall cone with one eye
    shape([[-50, 0], [0, -260 + bob], [50, 0]], { fill: col, lw: 6 });
    shape(ell(0, -140 + bob, 22, 26, 16), { fill: C.white, lw: 4, shade: () => dot(4, -138 + bob, 4) });
  } else if (kind % 5 === 2) {   // a cube on legs
    for (const sx of [-1, 1]) stroke([[sx * 30, -40], [sx * 36, 0]], 6);
    shape(rr(-60, -160 + bob, 120, 120, 12), { fill: col, lw: 6 });
    for (const ex of [-22, 22]) shape(ell(ex, -110 + bob, 14, 17, 14), { fill: C.white, lw: 4, shade: () => dot(ex + 3, -108 + bob, 3.5) });
  } else if (kind % 5 === 3) {   // a jelly with tentacles
    for (let k = 0; k < 4; k++) stroke(spline([[-36 + k * 24, -40], [-40 + k * 24 + Math.sin(t * 6 + k) * 8, -20], [-34 + k * 24, 0]], false), 7, { line: col });
    shape(spline([[-60, -40], [-60, -110 + bob], [0, -150 + bob], [60, -110 + bob], [60, -40]]), { fill: col, lw: 6, alpha: .9 });
    for (const ex of [-20, 20]) shape(ell(ex, -90 + bob, 13, 16, 14), { fill: C.white, lw: 4, shade: () => dot(ex + 3, -88 + bob, 3.5) });
  } else {   // a tiny one with a huge antenna
    stroke(quad([0, -90 + bob], [30, -200], [0, -260], 8), 5); dot(0, -264, 10, '#ffd25a');
    shape(ell(0, -50 + bob, 46, 50, 20), { fill: col, lw: 6 });
    shape(ell(0, -58 + bob, 22, 26, 16), { fill: C.white, lw: 4, shade: () => dot(4, -56 + bob, 4) });
  }
  bowl(46, -70 + bob, .8);
  pop();
}

// —— title lettering ——
function titleArt(t, t0s, cx, cy, size = 170, pal = { f: '#fff1d6', sh: '#ff5a3c' }) {
  const chars = [...TITLE], groups = [0, 0, 0, 1, 2, 3, 3];
  const n = chars.length, sp = size * 1.02;
  for (let i = 0; i < n; i++) {
    const ta = t0s[groups[i]] + (i === 1 ? .04 : i === 2 ? .08 : i === 6 ? .04 : 0);
    const u = q(t) - ta; if (u < 0) continue;
    const pop_ = u < .25 ? [.3, 1.22, 1.08, .98][Math.min(3, Math.floor(u * 12))] : 1;   // 12 fps steps
    const x = cx + (i - (n - 1) / 2) * sp, y = cy + Math.sin(i * 1.9) * 14, rot = Math.sin(i * 2.3) * .07;
    push(); translate(x, y); scale(pop_); rotate(rot);
    text(chars[i], 12, 14, { font: `${size}px ${FONT}`, fill: pal.sh, outlineW: 26, outlineCol: INK });
    text(chars[i], 0, 0, { font: `${size}px ${FONT}`, fill: pal.f, outlineW: 22, outlineCol: INK });
    text(chars[i], 0, 0, { font: `${size}px ${FONT}`, fill: pal.f, outlineW: 4, outlineCol: pal.f });
    pop();
  }
}

// —— the translator screen, big ——
function screenText(lines) { return () => { lines.forEach(([s, y, sz, col, strike]) => { text(s, 0, y, { font: `${sz}px ${FONT}`, fill: col || C.scrTx }); if (strike) stroke([[-44, y], [44, y]], 4, { line: '#ff4a3a' }); }); }; }

// ———————————————— the shots ————————————————
const SH = {};
SH.city = (t, u) => {
  NIGHT_OUT();
  cam(960, mv(u, 0, 4, 300, 560), mv(u, 0, 4, 1.0, 1.06), 0, 0, t);
  city(t, NIGHT, {
    streak: () => { const v = seg(t, 1.9, 3.7); if (v > 0 && v < 1) { const x = lerp(1640, 1240, v), y = lerp(-120, 470, ei(v)); stroke([[x + 60, y - 90], [x, y]], 6, { line: C.glow }); dot(x, y, 7, C.glowS); } },
  });
  rain(t, { n: 170 });
};
SH.alley = (t, u) => {
  NIGHT_OUT();
  cam(mv(u, 0, 3.5, 960, 990), mv(u, 0, 3.5, 540, 640), mv(u, 0, 3.5, 1.0, 1.28), 0, 0, t);
  alley(t, NIGHT, { flicker: true, door: (dx, dy) => zhuanrang(dx + 85, dy + 105, .55, { t }) });
  rain(t, { n: 150 });
};
SH.sign = (t, u) => {
  NIGHT_OUT();
  const [dx, dy] = SHOP.door;
  cam(dx + 85, dy + 108, mv(u, 0, 3, 5.4, 5.8), 0, 0, t);
  alley(t, NIGHT, { door: (dx, dy) => { zhuanrang(dx + 85, dy + 105, .55, { t, flap: 1 }); for (let i = 0; i < 9; i++) { const ph = (t * .35 + hash(i * 2.1)) % 1; const x = dx + 20 + hash(i * 5.1) * 130; dot(x, dy + 20 + ph * 170, 2.2, 'rgba(220,230,255,.8)'); fillOnly(rect(x - .7, dy + 20, 1.4, ph * 170), 'rgba(220,230,255,.35)', { boil: 0 }); } } });
  rain(t, { n: 60, len: 70 });
};
SH.shopWide = (t, u) => {
  ROOM();
  cam(mv(u, 0, 3, 960, 900), 520, mv(u, 0, 3, 1.0, 1.07), 0, 0, t);
  shop(t, { liu: 'counter', liuP: L(t, { look: [-.2, .9], lid: .5, armL: { h: [10, 120], bend: 10 }, armR: { h: [40, 110], bend: -10 } }), steam: .6, boil: .5 });
};
SH.coins = (t, u, d, s) => {
  ROOM();
  cam(960, 560, mv(u, 0, d, 1.0, 1.06), 0, 0, t);
  counterTop();
  const T = [HITS.clink1[0], HITS.clink2[0], HITS.clink3[0]];
  COINS.forEach(([x, y], i) => {
    const ts = T[i] - .45, v = eo(seg(t, ts, T[i]));
    if (t < ts) return;
    let cx = lerp(1500, x, v), cy = lerp(y + 60, y, v), edge = 0, a = 0;
    if (i === 2 && t > 16.0) { const w = seg(t, 16.0, 16.85); cx = lerp(x, 120, ei(w)); cy = lerp(y, y + 520, w * w); edge = .85; a = w * 8; }
    coin(cx, cy, 1.5, { edge, a });
  });
  // her hand pushing each coin in (sleeve from the right edge)
  for (let i = 0; i < 3; i++) {
    const ts = T[i] - .45, v = seg(t, ts, T[i] + .35); if (v <= 0 || v >= 1) continue;
    const hx = lerp(1600, COINS[i][0] + 70, eo(Math.min(1, v * 1.6))) + (v > .6 ? (v - .6) * 900 : 0);
    bigArm([2300, 700], [hx + 40, COINS[i][1] + 10], 1, C.lSkin, C.sleeve, { ang: Math.PI * .95 });
  }
};
SH.liuSigh = (t, u) => {
  ROOM();
  const sigh = seg(t, 17.8, 18.6);
  cam(345, 455, 2.55, 0, 0, t);
  shop(t, { liu: 'counter', liuP: L(t, { look: [-.1, .8], lid: lerp(.42, .7, ss(sigh)), bob: ss(sigh) * 10, headTilt: ss(sigh) * .06, mouth: { o: pulse(t, 17.9, .6) * .18, w: .6, sm: -.5 }, brow: { tilt: -.15, h: 0 }, armL: { h: [10, 120], bend: 10 }, armR: { h: [40, 110], bend: -10 } }), steam: .6 });
};
SH.fall = (t, u, d) => {
  NIGHT_OUT();
  const v = seg(t, 19.5, 21.75);
  const sx = lerp(1700, 1080, ei(v) * .9 + v * .1), sy = lerp(-260, 620, ei(v));
  cam(lerp(1300, 1100, v), lerp(120, 480, ss(v)), 1.25, 0, 3, t);
  city(t, NIGHT);
  const spin = Math.sin(t * 22) * .35;
  saucer(sx, sy, .34, { glow: hash(K12(t)) > .4 ? .9 : .2, tilt: spin, t, smoke: 1 });
  for (let i = 0; i < 4; i++) { const ph = (t * 3 + i * .25) % 1; dot(sx - 40 + ph * 90 * (i % 2 ? 1 : -1), sy + 20 + ph * 60, 4, '#ffd25a'); }
  rain(t, { n: 170 });
};
SH.liuUp = (t, u) => {
  const k = K12(t), off = k % 3 === 0;
  ROOM(); if (off) light('#000000', 0, .5);
  cam(360, 450, 1.75, 0, 4 + u * 10, t);
  const { K } = roomPal(0, off ? .55 : 0);
  shop(t, { dark: off ? .55 : 0, tubeOff: off, liu: 'counter', liuP: L(t, { look: [.2, -1], lid: .12, pupil: 3.5, brow: { tilt: -.3, h: 10 }, headTilt: -.12, armL: { h: [10, 120], bend: 10 }, armR: { h: [40, 110], bend: -10 } }), steam: .6 });
  for (let i = 0; i < 18; i++) { const ph = (u * 1.4 + hash(i)) % 1; dot(60 + hash(i * 3) * 800, 40 + ph * 700, 3, K('#d8cfba')); }
};
SH.impact = (t, u) => {
  const out = t > 22.6 && t < 22.9;
  NIGHT_OUT(); if (out) light('#000000', 0, .55);
  cam(980, 330, 1.05, 0, decay(t, 22.52, 40, 4), t);
  const v = seg(t, 22.5, 22.56);
  alley(t, NIGHT, { signOff: out, shopOff: out, winOff: out, neonOff: out, roof: () => { saucer(1000, lerp(-200, 96, v), .55, { glow: .3, tilt: .12, t, sq: landSq(t, 22.56, .35), smoke: 1 }); for (let i = 0; i < 6; i++) puff(1000 + (i - 2.5) * 70, 120, seg(t, 22.55, 23.2), -Math.PI / 2 + (i - 2.5) * .35, 1.2, '#8d89a3'); } });
  if (out) screenRect('#0b0a1a', .45);
  rain(t, { n: 150 });
};
SH.title = (t, u) => {
  NIGHT_OUT();
  cam(1000, mv(u, 0, 4, 120, 80), 1.18, 0, 0, t);
  alley(t, NIGHT, { roof: () => saucer(1000, 96, .55, { glow: .15, tilt: .12, t, smoke: 1 }) });
  rain(t, { n: 120 });
  g.setTransform(1, 0, 0, 1, 0, 0); reset();
  titleArt(t, [HITS.title1[0], HITS.title2[0], HITS.title3[0], HITS.title4[0]], 960, 470);
};
SH.roof = (t, u) => {
  NIGHT_OUT();
  cam(mv(u, 0, 4, 1010, 1050), mv(u, 0, 4, -10, -30), 1.85, 0, 0, t);
  const hatch = back(seg(t, 27.75, 28.1), 1.2);
  const zr = ss(seg(t, 27.95, 28.9));
  const zm = talk('ZUG', t), pm = talk('PIP', t);
  alley(t, NIGHT, {
    roof: () => {
      // Zug rising out of the cockpit, deadpan, holding the cell (the dish hides his legs)
      zug({ x: 985, y: lerp(260, 120, zr), s: .5, face: 1, lid: .6, look: [.3, .2], blink: blinkAt(t, [29.9]), mouth: { o: zm.o * .8, w: zm.w }, armR: { h: [30, 70], bend: -30, hold: hp => cell(hp[0] + 10, hp[1] - 10, .55, { glow: 0, level: 0, t }) }, armL: { h: [40, 80], bend: 20 } });
      saucer(1000, 96, .55, { glow: .1, tilt: .12, t, hatch, smoke: .6 });
      // Pip springs out at 29.85 and lands on the roof at 30.1
      if (t > 29.85) {
        const fv = seg(t, 29.85, 30.1), px = lerp(1020, 1150, fv), py = lerp(60, 118, fv) - Math.sin(fv * Math.PI) * 120;
        pip({ x: px, y: py, s: .5, face: -1, t, jit: t > 30.1 ? 5 : 0, sq: t < 30.1 ? 1.2 : landSq(t, 30.1, .3), look: [-.2, -.4], pupil: 3.5, brow: { tilt: -.6, h: 12 }, mouth: { o: pm.o * 1.3, w: pm.w, sm: -.7 }, armL: { h: [-30, -80], bend: 20 }, armR: { h: [30, -90], bend: -20 } });
      }
    }
  });
  rain(t, { n: 130 });
};
SH.cellRoof = (t, u) => {
  NIGHT_OUT();
  cam(960, 560, mv(u, 0, 4, 1.0, 1.08), 0, 0, t);
  bands(NIGHT.sky, -200, 1300);
  shape(spline([[-300, 900], [400, 760], [1000, 840], [1700, 720], [2300, 860], [2300, 1400], [-300, 1400]]), { fill: NIGHT.far, lw: 6 });
  // the chilli steam wisp drifting across (right → left), passing the cell at 33.25
  const wv = seg(t, 32.6, 34.1); const wx = lerp(1900, 100, wv);
  const fl = Math.max(0, 1 - Math.abs(t - 33.25) / .35);
  if (wv > 0 && wv < 1) for (let i = 0; i < 4; i++) puff(wx + i * 70, 500 + Math.sin(i + t) * 30, .35 + i * .1, Math.PI * .95, 1.6, mix('#ffffff', '#ff8a7a', .45));
  const tap = pulse(t, 34.0, .2) + pulse(t, 34.3, .2);
  cell(960, 600, 2.3, { glow: fl * .9, level: 0, t });
  text('能量 0%', 960, 300, { font: `40px ${FONT}`, fill: hash(K12(t)) > .5 && t < 33 ? '#ff4a3a' : '#ff8a7a', outlineW: 8, outlineCol: INK });
  // Zug's hands holding it, one finger tapping
  bigArm([-200, 1200], [690, 700], 1, C.zSkin, C.suit, { ang: 0 });
  bigArm([2100, 1200], [1230, 700 - tap * 60], 1, C.zSkin, C.suit, { ang: Math.PI, fist: tap > .2 });
  rain(t, { n: 120 });
};
SH.door = (t, u) => {
  ROOM();
  const open = eo(seg(t, 35.6, 36.2));
  cam(mv(u, 0, 3, 1240, 1270), 470, mv(u, 0, 3, 1.3, 1.36), 0, 0, t);
  const [dx, dy, dw, dh] = SHOPIN.door;
  shop(t, {
    pot: true, steam: .5, stools: true,
    door: () => {
      // the doorway opens onto the rain street; the two silhouettes stand in it
      if (open > 0) {
        shape(rect(dx + 6, dy + 6, dw - 12, dh - 6), { fill: '#1f2150', lw: 5, shade: () => { fillOnly(rect(dx, dy + 300, dw, 300), '#28296a', { boil: .3 }); for (let i = 0; i < 12; i++) { const x = dx + hash(i * 3.3) * dw, ph = (hash(i) + t * 1.4) % 1; fillOnly(rect(x, dy + ph * dh, 3, 30), 'rgba(190,200,255,.5)', { boil: 0 }); } } });
        light('#2a2a6a', .75);
        const step = ss(seg(t, 36.3, 37.6));
        zug({ x: dx + 92, y: dy + dh + 8, s: .82, face: -1, lid: .6, look: [0, .2], headTilt: -.18, blink: blinkAt(t, [37.4]), leg: sx => [0, 0] });
        pip({ x: dx + 168 - step * 6, y: dy + dh + 14, s: .82, face: -1, t, jit: 3, look: [-.4, 0], pupil: 3.5 });
        drips(dx + 100, dy + 150, t, 5, 120, 340); drips(dx + 170, dy + 330, t, 3, 70, 180);
        ROOM();
        // the door leaf swung inward (narrow, in perspective)
        shape([[dx + dw, dy], [dx + dw + 60 * open, dy - 30 * open], [dx + dw + 60 * open, dy + dh + 20 * open], [dx + dw, dy + dh]], { fill: '#6a4232', lw: 6 });
      }
    },
    front: () => {
      // over-the-shoulder: Liu's back, shoulder, collar, ear and bun in the foreground
      liu({ x: 830, y: 1250, s: 1.45, face: 1, back: true, headTilt: .05 + u * .02 });
    },
  });
};
SH.liuBlink = (t) => {
  ROOM();
  cam(345, 455, 2.55, 0, 0, t);
  shop(t, { liu: 'counter', liuP: L(t, { look: [1, -.1], lid: .45, blink: blinkAt(t, [38.7]), brow: { tilt: 0, h: 0 }, armL: { h: [10, 120], bend: 10 }, armR: { h: [40, 110], bend: -10 } }), steam: .6 });
};
SH.duoAsk = (t, u) => {
  ROOM();
  cam(mv(u, 0, 3.6, 880, 860), 470, 1.32, 0, 0, t);
  const lift = seg(t, 42.0, 42.4), ant = pulse(t, 41.7, .3);
  const zm = talk('ZUG', t);
  shop(t, {
    liu: 'counter', liuP: L(t, { look: [1, 0], lid: .45 }), steam: .6, pot: true,
    front: () => {
      zug({ x: 1020, y: 900, s: 1, face: -1, lid: .58, look: [-.6, .3], mouth: { o: zm.o * .8, w: zm.w }, blink: idleBlink(t, 5), armL: { h: [-14, 190], bend: 10 }, armR: { h: [20, 190], bend: -10 } });
      pip({ x: 760, y: 905, s: 1, face: -1, t, jit: 2, look: [.6, -.6], sq: 1 - ant * .06 + lift * .02, brow: { tilt: -.4, h: 8 }, tr: 0,
        armR: { h: [-40, lerp(30, -60, ss(lift))], bend: 20, hold: hp => translator(hp[0] - 30, hp[1] - 50, .6, { t, beep: t > 42.4 ? 1 : 0 }) }, armL: { h: [40, lerp(40, -50, ss(lift))], bend: -20 } });
    },
  });
};
SH.screen1 = (t, u) => {
  ROOM();
  cam(960, 540, mv(u, 0, 3.6, 1.0, 1.05), 0, t < 44.25 && t > 43.95 ? 8 : 0, t);
  screenRect(C.pSkin); fillOnly(ell(1500, 1100, 700, 500, 30), C.pSkinS, { boil: .3 });
  const sw = t >= HITS.screenSwap[0], gl = t > 43.95 && t < 44.25;
  translator(960, 560, 4.4, { t, beep: talk('TR', t).talking ? 1 : 0, screen: () => {
    if (t > 43.25) text('修理飞船', 0, sw ? -32 : -18, { font: `${sw ? 16 : 22}px ${FONT}`, fill: sw ? '#a87a3a' : C.scrTx });
    if (sw) { stroke([[-34, -32], [34, -32]], 3, { line: '#ff4a3a' }); text('最辣的', 8, -6, { font: `24px ${FONT}`, fill: '#ffd25a' }); stroke([[-46, -6], [-32, -6]], 3, { line: '#ffd25a' }); stroke([[-37, -11], [-32, -6], [-37, -1]], 3, { line: '#ffd25a' }); }
    if (gl) for (let i = 0; i < 6; i++) fillOnly(rect(-50 + hash(K12(t) + i) * 80, -46 + i * 9, 20 + hash(i) * 30, 5), '#ff4a3a', { boil: 0 });
  } });
  bigArm([1900, 1300], [1250, 860], 1, C.pSkin, C.pSkin, { ang: Math.PI * 1.1, fist: true });
};
SH.liuNod = (t, u) => {
  ROOM();
  cam(345, 455, 2.55, 0, 0, t);
  const nod = pulse(t, 47.0, .45);
  shop(t, { liu: 'counter', liuP: L(t, { look: [1, .1], lid: .38, browR: { tilt: -.25, h: 16 * seg(t, 46.75, 46.95) }, browL: { tilt: .05 }, headTilt: nod * .14, bob: nod * 8, armL: { h: [10, 120], bend: 10 }, armR: { h: [40, 110], bend: -10 } }), steam: .6 });
};
SH.menu = (t, u) => {
  ROOM();
  cam(800, mv(u, 0, 4.2, 240, 330), mv(u, 0, 4.2, 2.6, 2.75), 0, 0, t);
  const hi = t > 49.8 ? 3 : -1;
  shop(t, { liu: null, menuHi: hi, pot: false, table: false, stools: false });
  // her finger slides down the menu
  const fy = t < 49.3 ? lerp(200, 270, seg(t, 48.6, 49.3)) : lerp(270, 386, ss(seg(t, 49.3, 49.95)));
  bigArm([1150, 700], [1000, fy], .42, C.lSkin, C.sleeve, { ang: Math.PI * 1.05 });
};
SH.potIn = (t, u) => {
  ROOM();
  const dv = seg(t, 52.8, 53.15);
  cam(1040, mv(u, 0, 2.5, 600, 580), 2.3, 0, decay(t, 53.15, 10, 8), t);
  shop(t, { liu: null, pot: false, stools: false, front: () => {
    fillOnly(ell(1040, 470, 160, 160, 30), '#d6321f', { alpha: .25, boil: .3 });   // the lantern behind the steam
    pot(1040, lerp(600, 668, ei(dv)), .78, { t, heat: t > 53.45 ? 1 : 0, boil: t > 53.3 ? 1 : .3, steam: 1 });
    if (t < 53.5) for (const s of [-1, 1]) bigArm([1040 + s * 420, 300], [1040 + s * 180, lerp(590, 650, ei(dv)) - seg(t, 53.15, 53.5) * 120], .5, C.lSkin, C.sleeve, { ang: s < 0 ? 0 : Math.PI });
  } });
};
SH.cellBelt = (t, u) => {
  ROOM();
  const gl = ss(seg(t, 55.3, 56.2));
  cam(960, 540, mv(u, 0, 1.5, 1.0, 1.05), 0, 0, t);
  screenRect(C.suit); fillOnly(rect(1150, -100, 900, 1300), C.suitS, { boil: .3 });
  shape(rect(-100, 640, 2200, 110), { fill: C.boot, lw: 8 });
  for (let i = 0; i < 3; i++) { const ph = (t * .5 + i * .33) % 1; stroke(spline([[300 + i * 120, 900 - ph * 600], [330 + i * 120, 820 - ph * 600], [290 + i * 120, 740 - ph * 600]], false), 7, { line: `rgba(255,255,255,${.6 * (1 - ph)})` }); }
  cell(1100, 600, 1.9, { glow: gl, level: 0, t });
  shape(rr(860, 610, 480, 60, 14), { fill: C.boot, lw: 7 });   // the strap
};
SH.pipBite = (t, u) => {
  ROOM();
  cam(mv(u, 0, 2, 1290, 1280), 530, 1.9, 0, 0, t);
  const reach = ss(seg(t, 56.7, 57.4)), back_ = ss(seg(t, 57.4, 57.9)), bite = ss(seg(t, 58.1, 58.55));
  const open = t > 58.0 && t < 58.55 ? .9 : 0;
  shop(t, {
    liu: 'table', liuP: L(t, { ...LIU_T, cross: true, look: [-.8, .3], lid: .5 }),
    zug: Z(t, { look: [1, .3] }),
    pip: Pp(t, { look: [-.6, .6], lid: 0, pupil: 4, lean: -back_ * .15 + bite * .2, mouth: { o: open, w: 1.1, sm: 0 }, brow: { tilt: -.2, h: 10 },
      armR: { h: [lerp(60, 230, reach) - back_ * 150 - bite * 30, lerp(40, -10, reach) - back_ * 40], bend: -20, fist: true, hold: hp => chopsticks(hp[0], hp[1], lerp(-.2, .9, reach) - back_ * .9 - bite * .6, { L: 140, open: .1, food: back_ > .1 && t < 58.5 ? () => tripe(.6) : null }) } }),
    steam: .7,
  });
};
SH.pipCU = (t, u, d) => {
  // the cold silence: nothing moves but the boil… then the colour climbs, then the steam
  ROOM();
  cam(1400, 515 - u * 4, mv(u, 0, d, 2.35, 2.5), 0, t > 62.2 && t < 62.6 ? 6 : 0, t);
  const fl = ss(seg(t, 60.2, 62.0));
  const base = { ...PIP_T, t, jit: 0, look: [-.1, 0], lid: 0, pupil: t > 59.0 ? 2 : 4.5, brow: { tilt: -.55, h: t > 59.2 ? 16 : 6 }, mouth: { o: 0, sm: -.2, w: .6 }, sq: 1, blink: false, armR: { h: [40, 60], bend: -20 }, armL: { h: [-30, 60], bend: 20 } };
  if (t > 62.2) { base.closed = true; base.mouth = { o: .7, w: 1.25, sm: 0 }; base.brow = { tilt: .5, h: 4 }; }
  shop(t, { liu: null, pip: null, zug: null, steam: .4, front: () => {
    const sid = S.sid;
    pip({ ...base, flush: 0 });
    if (fl > 0) {
      // the red climbs from the scarf to the antennae (redraw clipped; same boil)
      const yLine = lerp(PIP_T.y - 120, PIP_T.y - 420, fl);
      g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
      const Y = (yLine - (515 - u * 4)) * mv(u, 0, d, 2.35, 2.5) + H / 2;
      g.beginPath(); g.rect(0, Y, W, H); g.clip();
      S.sid = sid; cam(1400, 515 - u * 4, mv(u, 0, d, 2.35, 2.5), 0, t > 62.2 && t < 62.6 ? 6 : 0, t);
      pip({ ...base, flush: 1 });
      g.restore();
    }
    if (t > 62.2) {
      const pv = [62.2, 62.35, 62.5];
      const hx = PIP_T.x, hy = PIP_T.y - 232;
      const jet = (x, y, t0, dir, sc) => { for (let k = 0; k < 5; k++) { const v = seg(t, t0 + k * .12, t0 + k * .12 + 1.0); if (v > 0 && v < 1) puff(x, y, v * .8, dir, sc * (.6 + .1 * k)); } };
      for (const s of [-1, 1]) jet(hx - s * 66, hy - 150, pv[0], -Math.PI / 2 - s * .35, .7);   // antenna tips
      for (const s of [-1, 1]) jet(hx - s * 88, hy - 4, pv[1], s < 0 ? -.25 : Math.PI + .25, .6);   // ears
    }
  } });
};
SH.zugBlink = (t) => {
  ROOM();
  cam(800, 450, 2.45, 0, 0, t);
  shop(t, { liu: null, zug: Z(t, { look: [1, 0], blink: blinkAt(t, [64.2]) }), steam: .4 });
};
SH.liuArms = (t) => {
  ROOM();
  cam(1066, 505, 2.45, 0, 0, t);
  shop(t, { liu: 'table', liuP: L(t, { ...LIU_T, cross: true, look: [1, .2], lid: .5, blink: blinkAt(t, [65.3]), brow: { tilt: .1 } }), steam: .3 });
};
SH.pipMore = (t, u) => {
  ROOM();
  const up = back(seg(t, 66.0, 66.35), 1.4);
  cam(1330, 520, 1.75, 0, 0, t);
  const m = talk('PIP', t);
  shop(t, {
    liu: 'table', liuP: L(t, { ...LIU_T, cross: true, look: [1, .2], lid: .5 }), zug: Z(t, { look: [1, 0] }),
    pip: Pp(t, { flush: lerp(1, .85, u / 2.5), jit: 0, lid: .35, look: [-.6, -.2], mouth: { o: m.o * .7, w: m.w * .8, sm: .3 }, brow: { tilt: -.1, h: 6 }, sq: landSq(t, 66.35, .15), happy: t > 67.6 ? 1 : 0,
      armR: { h: [lerp(40, 120, up), lerp(50, -110, up)], bend: -10, hold: hp => { push(); translate(hp[0] - 10, hp[1] - 30); shape(ell(0, 0, 70, 20, 24), { fill: C.plate, lw: 6 }); pop(); } }, armL: { h: [lerp(-30, -110, up), lerp(50, -110, up)], bend: 10 } }),
    steam: .5,
  });
};
const dipY = (t, list) => { let y = 0; for (const b of list) { const v = (t - b + .2) / .5; if (v >= 0 && v < 1) y = Math.sin(v * Math.PI); } return y; };
SH.tripe1 = (t, u) => {
  ROOM();
  cam(mv(u, 0, 3, 1000, 1020), 500, 1.35, 0, 0, t);
  const dip = ss(seg(t, 68.6, 68.9)), lift = back(seg(t, 70.3, 70.6), 1.2);
  const shrink = t > 70.3 ? 1 : 0;
  shop(t, {
    liu: 'table', liuP: L(t, { ...LIU_T, cross: true, look: [-1, .4], lid: .5, blink: blinkAt(t, [70.9]) }),
    zug: Z(t, { look: shrink ? [.6, -.4] : [1, .6], lid: shrink ? .5 : .6, armR: { late: true, h: [lerp(120, 170, dip) - lift * 110, lerp(-60, -10, dip) - lift * 110], bend: -20, fist: true, hold: hp => chopsticks(hp[0], hp[1], .75 - lift * 2.0, { L: 150, food: () => tripe(.75, 1, shrink) }) } }),
    pip: Pp(t, { flush: .8, jit: 2, look: [-1, .4] }),
    steam: .6,
  });
};
SH.liuShake = (t) => {
  ROOM();
  cam(1066, 505, 2.45, 0, 0, t);
  const sh = Math.sin((t - 71.5) * TAU * 2.2) * .13 * env(t, 71.5, 72.5);
  shop(t, { liu: 'table', liuP: L(t, { ...LIU_T, cross: true, headTilt: sh, look: [sh * 4, .1], lid: .58, brow: { tilt: .3, h: 0 }, mouth: { sm: -.6 } }), steam: .3 });
};
function env(t, a, b) { return Math.min(seg(t, a, a + .15), 1 - seg(t, b - .2, b)); }
SH.lesson = (t, u) => {
  ROOM();
  cam(mv(u, 0, 5, 1120, 1090), mv(u, 0, 5, 540, 560), mv(u, 0, 5, 1.75, 1.9), 0, 0, t);
  const dy = dipY(t, DIPS);
  const n = DIPS.filter(b => t >= b).length;
  // (Liu behind the pot, dipping into its right half)
  shop(t, {
    liu: 'table', liuP: L(t, { ...LIU_T, face: -1, look: [-.4, .8], lid: .5, blink: false, headTilt: dy * .05, bob: dy * 6,
      armR: { late: true, h: [70, lerp(-40, 0, dy)], bend: -20, fist: true, hold: hp => chopsticks(hp[0], hp[1], 1.0, { L: 110, food: () => tripe(.5) }) }, armL: { h: [-10, 120], bend: 10 } }),
    pip: Pp(t, { flush: .7, look: [-1, .6], jit: 1 }),
    steam: .5,
    front: () => { for (let i = 0; i < 8; i++) { const x = 960 + i * 36, y = 360; if (i < n) shape(ell(x, y, 11, 11, 12), { fill: i < 7 ? '#ffd25a' : '#ff5a3c', lw: 4 }); else shape(ell(x, y, 8, 8, 10), { lw: 3, line: 'rgba(34,20,50,.5)' }); } },
  });
};
SH.antenna = (t, u) => {
  ROOM();
  cam(860, 470, 1.6, 0, 0, t);
  const hop = Math.sin(seg(t, 78.4, 79.0) * Math.PI), placed = t > 78.6 ? (t > 78.9 ? 2 : 1) : 0;
  const m = talk('PIP', t);
  shop(t, {
    liu: null, zug: Z(t, { look: [.3, -.8], lid: .5, chop: placed ? 1 : 0, chopWig: placed ? Math.sin(t * 9) * .04 : 0, closed: t > 79.6, brow: { tilt: t > 79.6 ? .2 : 0 } }),
    steam: .4,
    front: () => {
      pip({ x: 1000, y: 702 - hop * 120, s: .9, face: -1, t, flush: .6, jit: 1, look: [.4, -.8], mouth: { o: m.o * 1.15, w: m.w, sm: .2 }, brow: { tilt: -.2, h: 12 }, sq: landSq(t, 79.0, .18),
        armR: { h: [60, -180 + hop * 30], bend: -10 }, armL: { h: [0, -190 + hop * 30], bend: 10 } });
      if (t > 79.3) translator(1100, 640, .6, { t, beep: dipY(t, [79.4, 79.9, 80.4]) > .5 ? 1 : 0 });
    },
  });
};
SH.mirror = (t, u) => {
  ROOM();
  cam(1010, 500, mv(u, 0, 4, 1.32, 1.4), 0, 0, t);
  const dy = dipY(t, DIPS2), dz = dipY(t - .04, DIPS2);
  shop(t, {
    liu: 'table', liuP: L(t, { ...LIU_T, face: -1, look: [-.2, .8], lid: .5, headTilt: dy * .05, armR: { late: true, h: [70, lerp(-40, 0, dy)], bend: -20, fist: true, hold: hp => chopsticks(hp[0], hp[1], 1.0, { L: 110, food: () => tripe(.5) }) }, armL: { h: [-10, 120], bend: 10 } }),
    zug: Z(t, { closed: true, chop: 1, chopWig: dz * .25, headTilt: dz * .05, brow: { tilt: .15 }, armR: { late: true, h: [150, lerp(-60, -10, dz)], bend: -20, fist: true, hold: hp => chopsticks(hp[0], hp[1], .8, { L: 130, food: () => tripe(.6) }) } }),
    pip: Pp(t, { flush: .5, look: [-1, .3], jit: 1, mouth: { o: 0, sm: .4 } }),
    steam: .5,
  });
};
SH.zugEat = (t, u, d) => {
  ROOM();
  cam(mv(u, 0, d, 830, 820), 440, mv(u, 0, d, 2.3, 2.6), 0, 0, t);
  const up = ss(seg(t, 84.9, 85.4)), eat = ss(seg(t, 85.4, 85.9));
  const sm = ss(seg(t, 87.5, 88.0));
  shop(t, { liu: null, zug: Z(t, { chop: 1, look: [.3, eat > .5 ? 0 : -.3], lid: eat > .5 && t < 86.4 ? .9 : .5, smile: sm, closed: t > 85.6 && t < 86.4,
    mouth: { o: Math.max(talk('ZUG', t).o * .7, t > 85.3 && t < 85.6 ? .6 : 0), w: .9, sm: -.08 },
    armR: { h: [lerp(190, 120, up) - eat * 60, lerp(30, -60, up) - eat * 100], bend: -20, fist: true, hold: hp => chopsticks(hp[0], hp[1], lerp(.4, -.9, eat), { L: 150, food: t < 85.6 ? () => tripe(.6) : null }) } }), steam: .3 });
};
SH.cellTable = (t, u) => {
  ROOM();
  const gl = .5 + .2 * Math.sin(t * 4), lev = mv(t, 88.4, 90.4, .12, .38);
  cam(960, 540, mv(u, 0, 2, 1.0, 1.06), 0, 0, t);
  screenRect(roomPal().P.wallU); fillOnly(rect(-100, 640, 2200, 600), '#a8683b', { boil: 0 });
  pot(380, 760, 1.6, { t, steam: 1 });
  cell(1250, 640, 2.0, { glow: gl, level: lev, t });
  shape(rr(1520, 330, 70, 300, 12), { fill: '#2c3c4a', lw: 6, shade: () => fillOnly(rect(1520, 630 - lev * 300, 70, 300), C.glow, { boil: .3 }) });
  text('能量', 1555, 300, { font: `36px ${FONT}`, fill: '#fff', outlineW: 8, outlineCol: INK });
};
SH.experiment = (t, u) => {
  const near = [90.6, 91.8].some(a => t > a && t < a + .6) ? 1 : 0;
  const nv = t < 90.6 ? 0 : ss(clamp(Math.sin((t - 90.6) / 1.2 * TAU - Math.PI / 2) * .5 + .5));
  const glow = .25 + .75 * nv;
  fuelLight(.15 * glow);
  cam(1230, 520, 1.6, 0, 0, t);
  const m = talk('PIP', t);
  shop(t, {
    k: .12 * glow,
    liu: 'table', liuP: L(t, { ...LIU_T, cross: true, look: [1, .3], lid: .5 }),
    pip: Pp(t, { flush: .3, look: [-.8, .4], jit: 3, mouth: { o: m.o * 1.2, w: m.w, sm: .2 }, brow: { h: 12, tilt: -.3 }, lean: -nv * .12,
      armR: { h: [lerp(60, 230, nv), lerp(-20, 10, nv)], bend: -10, hold: hp => cell(hp[0] + 10, hp[1] - 40, .55, { glow, level: .4, t }) } }),
    steam: .8,
  });
};
SH.whip = (t, u) => {
  ROOM();
  const xs = [[93.4, 800], [94.0, 800], [94.25, 1400], [94.7, 1400], [94.95, 1066], [95.4, 1066]];
  let x = 800; for (let i = 0; i < xs.length - 1; i++) if (t >= xs[i][0] && t < xs[i + 1][0]) x = lerp(xs[i][1], xs[i + 1][1], eio(seg(t, xs[i][0], xs[i + 1][0])));
  cam(x, 480, 2.0, 0, 0, t);
  shop(t, { liu: 'table', liuP: L(t, { ...LIU_T, cross: true, look: [-.2, .1], lid: .5 }), zug: Z(t, { look: [1, .5], lid: .2, pupil: 3.5, brow: { h: 12 } }), pip: Pp(t, { flush: .3, look: [-1, .3], lid: 0, jit: 4, brow: { h: 14 } }), steam: .6, k: .05 });
  // speed lines during the whips (on ones)
  const sp = [93.95, 94.3, 94.9].some(a => t > a && t < a + .3);
  if (sp) { g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = .35; g.strokeStyle = '#fff'; g.lineWidth = 6; for (let i = 0; i < 14; i++) { const y = hash(i * 3 + K12(t)) * H; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y + 10); g.stroke(); } g.globalAlpha = 1; }
};
SH.ladleSlide = (t, u) => {
  ROOM();
  const tilt = ss(seg(t, 96.4, 96.9));
  cam(lerp(1066, 1130, tilt), lerp(505, 690, tilt), lerp(2.45, 2.0, tilt), 0, 0, t);
  const sl = ss(seg(t, 96.7, 97.6));
  shop(t, { k: .05, liu: 'table', liuP: L(t, { ...LIU_T, look: [-.5, .9], lid: .55, blink: blinkAt(t, [95.9]), armR: { h: [lerp(60, 150, tilt), 120], bend: -10, fist: true } }), steam: .4,
    front: () => { push(); translate(lerp(1300, 1040, sl), 705); rotate(-.08); shape(noodle([0, 0], [-240, -10], 0, 18, 14), { fill: C.steel, lw: 6 }); shape(ell(-270, -10, 50, 20, 20), { fill: C.steel, lw: 6 }); pop(); } });
};
SH.fill = (t, u) => {
  const k = ss(seg(t, 99.0, 100.4));
  fuelLight(.2 + .8 * k);
  const jump = Math.sin(seg(t, 100.6, 101.2) * Math.PI);
  cam(1050, mv(u, 0, 4.5, 520, 500), mv(u, 0, 4.5, 1.3, 1.42), 0, decay(t, 100.4, 8, 5), t);
  const g3 = [98.4, 99.0, 99.6].map(a => pulse(t, a - .1, .5)).reduce((a, b) => a + b, 0);
  const lev = mv(t, 98.3, 100.4, .38, 1);
  shop(t, {
    k: .15 + .85 * k,
    liu: 'table', liuP: L(t, { ...LIU_T, cross: true, look: [-1, .4], lid: lerp(.5, .3, k) }),
    zug: Z(t, { look: [1, .6], lid: .5, armR: { h: [170, -60 + g3 * 30], bend: -30, hold: hp => { push(); translate(hp[0], hp[1]); rotate(.4 + g3 * .3); shape(noodle([0, 0], [120, 20], 0, 14, 12), { fill: C.steel, lw: 6 }); shape(ell(150, 30, 40, 18, 18), { fill: C.steel, lw: 6, shade: () => fillOnly(ell(150, 24, 30, 10, 14), C.broth, { boil: .3 }) }); pop(); } } }),
    pip: Pp(t, { flush: .2, jit: t > 100.4 ? 0 : 3, look: [-1, .4], y: PIP_T.y - jump * 110, sq: t > 101.2 ? landSq(t, 101.2) : 1 + jump * .2, happy: t > 100.4 ? 1 : 0, mouth: { o: t > 100.4 ? .6 : 0, sm: .8 },
      armR: t > 100.4 ? { h: [40, -150], bend: -10 } : undefined, armL: t > 100.4 ? { h: [-40, -150], bend: 10 } : undefined }),
    steam: .7,
    front: () => cell(1060, 560, .85, { glow: .4 + .6 * k + g3 * .1, level: lev, t }),
  });
  if (k > 0) screenRect(C.glow, .1 * k);
};
SH.coin2 = (t, u) => {
  const k = .5;
  light('#6ff4ff', .15);
  cam(960, 560, mv(u, 0, 2, 1.03, 1.08), 0, 0, t);
  counterTop(tintK(.25));
  coin(COINS[0][0], COINS[0][1], 1.5); coin(COINS[1][0], COINS[1][1], 1.5);
  const v = eo(seg(t, 102.5, 102.9));
  if (t > 102.5) hexCoin(lerp(1200, COINS[2][0], v), lerp(300, COINS[2][1], v), 1.4, { glow: 1 });
  if (t < 103.4) bigArm([1700, -300], [lerp(1300, COINS[2][0] + 90, v), lerp(240, COINS[2][1] - 60, v)], 1, C.zSkin, C.suit, { ang: Math.PI * .8 });
};
SH.climax = (t, u, d) => {
  ROOM();
  cam(345, mv(u, 0, d, 462, 455), mv(u, 0, d, 2.5, 2.85), 0, 0, t);
  const look = t < 105.9 ? [.2, .9] : t < 107.4 ? [1, -.1] : [.2, .9];
  const sm = ss(seg(t, 108.3, 109.1));
  shop(t, { liu: 'counter', liuP: L(t, { look, lid: t > 108.3 ? lerp(.45, .55, sm) : .45, blink: blinkAt(t, [105.5, 107.8]), mouth: { sm: lerp(-.25, .9, sm) }, brow: { tilt: lerp(.05, -.12, sm), h: sm * 4 }, armL: { h: [10, 120], bend: 10 }, armR: { h: [40, 110], bend: -10 } }), steam: .4,
    counterTop: () => hexCoin(420, SHOPIN.counterTop - 30, .5, { glow: 1 }) });
  // the coin's glow on her face: flat translucent rings from below
  shape(ell(380, 640, 260, 230, 30), { fill: C.glow, alpha: .12, stroke: false }); shape(ell(380, 640, 170, 150, 30), { fill: C.glow, alpha: .12, stroke: false });
};
SH.street = (t, u) => {
  NIGHT_OUT();
  cam(mv(u, 0, 4, 980, 1000), mv(u, 0, 4, 420, 380), 1.05, 0, 0, t);
  const pw = ss(seg(t, 110.4, 113.5));
  const pm = talk('PIP', t);
  alley(t, NIGHT, {
    roof: () => {
      saucer(1000, 96 - pw * 10, .55, { glow: .3 + .7 * pw, tilt: .12 * (1 - pw), t });
      pip({ x: 1040, y: 50 - pw * 10, s: .42, face: -1, t, look: [-.3, .8], happy: t > 112 ? 1 : 0, mouth: { o: pm.o * 1.1, w: pm.w, sm: .7 }, armR: { h: [20, -100 + Math.sin(t * 14) * 30], bend: -10, hold: hp => bowl(hp[0], hp[1] - 20, .9, { steam: 1, t }) } });
    },
  });
  ROOM(); light('#8088d8', .25);
  liu({ x: 990, y: 980, s: .62, face: 1, look: [.2, -1], lid: .35, headTilt: -.1, armR: { h: [20, -40], bend: -20, fist: true, hold: hp => umbrella(hp[0] - 10, hp[1] - 220, .8) } });
  if (pw > 0) screenRect(C.glow, .08 * pw);
  rain(t, { n: 140 });
};
SH.launch = (t, u) => {
  NIGHT_OUT();
  const v = t - 114.4;
  const y = v < 0 ? 96 : 96 - (v * v * 2600 + v * 400);
  cam(1000, mv(u, 0, 1.5, 60, -500, ei), 1.6, 0, decay(t, 114.4, 14, 3), t);
  alley(t, NIGHT, { roof: () => { saucer(1000, y, .55, { glow: 1, t, sq: v < 0 ? 1 : lerp(1.0, 1.5, clamp(v * 3)) }); if (v > 0) for (let i = 0; i < 5; i++) puff(1000 + (i - 2) * 70, 120, seg(t, 114.4, 115.4), Math.PI / 2 + (i - 2) * .5, 1.2, '#cfeaf0'); } });
  screenRect(C.glow, .12 * clamp(1 - v));
  rain(t, { n: 140 });
};
SH.cityUp = (t, u, d) => {
  NIGHT_OUT();
  cam(960, mv(u, 0, d, 560, 250), mv(u, 0, d, 1.05, 1.0), 0, 0, t);
  city(t, NIGHT, { streak: () => { const v = seg(t, 115.9, 117.9); if (v > 0 && v < 1) { const x = lerp(1060, 1500, v), y = lerp(560, -500, eo(v)); stroke([[x - 40, y + 140], [x, y]], 8, { line: C.glow }); dot(x, y, 9, C.glowS); } if (t > 117.9) { const tw = pulse(t, 117.95, .5); if (tw > 0) { for (let i = 0; i < 4; i++) stroke([[1500, -500], [1500 + Math.cos(i * Math.PI / 2) * 40 * tw, -500 + Math.sin(i * Math.PI / 2) * 40 * tw]], 5, { line: C.glowS }); } } } });
  rain(t, { n: 100 });
};
function morningAlley(t, o = {}) {
  alley(t, MORNING, { chimSteam: 1, door: (dx, dy) => { if (o.door) o.door(dx, dy); }, roof: o.roof, sky: o.sky });
}
function queue(t, x0, n, s, { look = [0, 0], up = 0, start = 0 } = {}) { for (let i = n - 1; i >= 0; i--) person(x0 - i * 120 * s, 980 + (i % 2) * 14, s, i + start, t, { look, up }); }
SH.morning = (t, u, d) => {
  light('#ffe0c0', .1);
  cam(mv(u, 0, d, 1000, 900), mv(u, 0, d, 560, 500), mv(u, 0, d, 1.3, .95), 0, 0, t);
  morningAlley(t, { door: (dx, dy) => { zhuanrang(dx + 85, dy + 105, .55, { t }); } });
  queue(t, 880, 12, .62, { look: [.6, 0] });
  for (let i = 0; i < 3; i++) { const ph = (t * .2 + i * .3) % 1; const bx = lerp(-200, 2200, ph), by = 120 + Math.sin(t * 3 + i) * 30 + i * 40; stroke([[bx - 20, by - 8 * Math.sin(t * 16 + i)], [bx, by], [bx + 20, by - 8 * Math.sin(t * 16 + i)]], 5); }
};
SH.signTear = (t, u) => {
  light('#ffe0c0', .1);
  const [dx, dy] = SHOP.door;
  cam(dx + 85, dy + 108, mv(u, 0, 5, 5.2, 5.5), 0, decay(t, 124.75, 3, 8), t);
  const rip = seg(t, 124.4, 124.6), slap = t >= 124.75;
  morningAlley(t, { door: (dx, dy) => {
    if (t < 124.4) zhuanrang(dx + 85, dy + 105, .55, { t });
    else if (rip < 1) { push(); translate(dx + 85 - rip * 120, dy + 105 + rip * 60); rotate(-rip * .9); zhuanrang(0, 0, .55 * (1 - rip * .3), { t }); pop(); }
    if (slap) { const sq = landSq(t, 124.75, .15); push(); translate(dx + 85, dy + 100); scale(sq, 2 - sq); renzheng(0, 0, .5); pop(); hexCoin(dx + 140, dy + 150, .22, { glow: .6 }); }
  } });
  // her hand (oversleeve) ripping, then slapping
  const hv = t < 124.4 ? seg(t, 123.6, 124.3) : t < 124.75 ? 1 - seg(t, 124.4, 124.75) * .4 : 1 - seg(t, 124.75, 125.3);
  if (hv > 0) bigArm([dx + 300, dy + 260], [dx + 140 - (t > 124.4 && t < 124.75 ? 60 : 0), dy + 100], .2, C.lSkin, C.sleeve, { ang: Math.PI * 1.1 });
};
SH.liuMorning = (t, u) => {
  light('#ffe0c0', .1);
  const [dx, dy, dw, dh] = SHOP.door;
  cam(dx + 85, dy + 160, 3.2, 0, 0, t);
  morningAlley(t, { door: (dx, dy) => { renzheng(dx + 85, dy + 100, .5); } });
  queue(t, dx - 40, 4, .62, { look: [1, 0] });
  liu({ x: dx + 100, y: dy + dh + 20, s: .62, face: -1, look: [-.8, .1], lid: .5, mouth: { sm: .55 }, blink: blinkAt(t, [128.3]), brow: { tilt: -.05, h: 2 }, armR: { h: [0, -60], bend: 20, fist: true, hold: hp => { push(); translate(hp[0], hp[1]); rotate(-1.2); shape(noodle([0, 0], [-170, 0], 0, 16, 12), { fill: C.steel, lw: 5 }); shape(ell(-196, 0, 36, 16, 16), { fill: C.steel, lw: 5 }); pop(); } } });
};
SH.fleet = (t, u, d) => {
  light('#ffe0c0', .1);
  const cy = mv(u, 0, 1.6, 600, -150);
  cam(980, cy, mv(u, 0, d, 1.0, .9), 0, 0, t);
  const fv = seg(t, 129.8, 132.4);
  morningAlley(t, { sky: () => {
    for (let i = 0; i < 12; i++) { const x = 300 + (i % 6) * 260 + (i > 5 ? 130 : 0), y = lerp(-1300 - i * 40, -560 + (i > 5 ? 140 : 0), eo(fv)) + Math.sin(t * 2 + i) * 10; saucer(x, y, .28 + (i % 3) * .04, { glow: .8, t, tilt: Math.sin(t + i) * .06, dent: i % 2 }); }
  } });
  queue(t, 880, 12, .62, { up: 1, look: [0, -1] });
};
SH.queue = (t, u, d) => {
  light('#ffe0c0', .1);
  cam(mv(u, 0, d, 1000, 200), 800, 1.45, 0, 0, t);
  morningAlley(t, { sky: () => { for (let i = 0; i < 5; i++) saucer(-400 + i * 330, -320 + (i % 2) * 60, .3, { glow: .3, t }); } });
  // the humans by the door, then the aliens with tiny bowls, Pip and Zug at their front
  queue(t, 880, 5, .62, { look: [-1, 0] });
  const ax = 880 - 5 * 75;
  zug({ x: ax - 10, y: 990, s: .5, face: 1, lid: .55, look: [1, 0], smile: .6, armR: { h: [40, 60], bend: -20, hold: hp => bowl(hp[0] + 10, hp[1] - 6, .8) } });
  pip({ x: ax - 120, y: 990, s: .5, face: 1, t, look: [1, -.2], happy: 1, mouth: { o: .3, sm: 1 }, armR: { h: [40, -40], bend: -20, hold: hp => bowl(hp[0], hp[1] - 10, .8) } });
  for (let i = 0; i < 12; i++) creature(i, ax - 260 - i * 150, 990 + (i % 2) * 10, .62 + (i % 3) * .08, t, i);
};
SH.liuLast = (t) => {
  light('#ffe0c0', .1);
  const [dx, dy, dw, dh] = SHOP.door;
  cam(dx + 85, dy + 160, 3.2, 0, 0, t);
  morningAlley(t, { door: (dx, dy) => { renzheng(dx + 85, dy + 100, .5); } });
  liu({ x: dx + 100, y: dy + dh + 20, s: .62, face: -1, look: [-.9, 0], lid: .52, blink: blinkAt(t, [136.3]), mouth: { sm: -.1 }, brow: { tilt: .05 } });
};
SH.screen2 = (t, u) => {
  light('#ffe0c0', .1);
  cam(960, 540, mv(u, 0, 3, 1.0, 1.05), 0, 0, t);
  screenRect(C.pSkin); fillOnly(ell(1500, 1100, 700, 500, 30), C.pSkinS, { boil: .3 });
  translator(960, 560, 4.4, { t, beep: talk('TR', t).talking ? 1 : 0, screen: () => { if (t > 137.6) { text('再来一盘', 0, -26, { font: `22px ${FONT}`, fill: C.scrTx }); text('× 200', 0, 2, { font: `22px VT323`, fill: '#ffd25a' }); } } });
};
SH.endCard = (t, u) => {
  NIGHT_OUT();
  reset(); screenRect('#1f2150');
  cam(960, 540, 1, 0, 0, t);
  bands(['#16173a', '#1f2150', '#28296a'], 0, 1080);
  hexCoin(960, 760, .9, { glow: .8 + .2 * Math.sin(t * 3) });
  reset();
  titleArt(t, [140.5, 140.5, 140.5, 140.5], 960, 430, 140);
  if (t > 141.2) sign('完', 960, 900, 60, '#fff1d6', { outline: 10 });
  rain(t, { n: 60 });
};

// —— subtitles: rounded heavy type, white with a black outline, a speaker pill ——
export const SUBS = LINES.map(l => {
  const d = vdur(l.id); let t1 = Math.max(l.t + 1.8, l.t + d + .6);
  return { id: l.id, who: l.who, t0: l.t, t1, text: l.sub };
});
// clip before the silent beats (the screen is clean when the silence plays)
for (const s of SUBS) { for (const cut of [58.65, 135.9]) if (s.t0 < cut && s.t1 > cut) s.t1 = cut; }
function subs(t) {
  const on = SUBS.filter(s => t >= s.t0 && t < s.t1);
  g.setTransform(1, 0, 0, 1, 0, 0);
  on.forEach((s, i) => {
    const old = i < on.length - 1, y = 1010 - (on.length - 1 - i) * 74;
    g.globalAlpha = old ? .7 : 1;
    g.font = `50px ${FONT}`; const w = g.measureText(s.text).width;
    const who = WHO[s.who]; g.font = `32px ${FONT}`; const pw = g.measureText(who.name).width + 34;
    const x0 = W / 2 - (w + pw + 18) / 2;
    // pill (boiling outline)
    reset(); shape(rr(x0, y - 50, pw, 52, 26), { fill: who.col, lw: 6 });
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = old ? .7 : 1;
    g.font = `32px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.strokeText(who.name, x0 + pw / 2, y - 22); g.fillText(who.name, x0 + pw / 2, y - 22);
    g.font = `50px ${FONT}`; g.textAlign = 'left'; g.lineJoin = 'round';
    g.lineWidth = 11 * 2; g.strokeStyle = INK; g.strokeText(s.text, x0 + pw + 18, y - 22);
    g.lineWidth = 3; g.strokeStyle = '#fff'; g.strokeText(s.text, x0 + pw + 18, y - 22);
    g.fillStyle = '#fff'; g.fillText(s.text, x0 + pw + 18, y - 22);
    g.globalAlpha = 1;
  });
}
// —— world tag (typed in) ——
function tag(t) {
  for (const T of TAGS) {
    if (t < T.t0 || t >= T.t1) continue;
    const n = Math.min([...T.text].length, Math.floor((t - T.t0) * 18) + 1), s = [...T.text].slice(0, n).join('');
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.font = `38px ${FONT}`; const w = g.measureText(T.text).width;
    g.fillStyle = 'rgba(20,14,32,.78)'; g.fillRect(50, 46, w + 60, 64);
    g.strokeStyle = T.col; g.lineWidth = 4; g.strokeRect(50, 46, w + 60, 64);
    g.fillStyle = T.col; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(s, 80, 80); if (K12(t) % 2) g.fillRect(84 + g.measureText(s).width, 62, 16, 36);
  }
}

window.DUR = DUR;
window.render = t => {
  frame(t); LATE.length = 0;
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  const s = shotAt(t);
  (SH[s.id] || (() => { }))(t, s.u, s.d, s);
  reset(); ROOM();
  tag(t); subs(t);
};
// every on-screen text meant to be read, for readcheck
window.TEXTS = t => {
  const s = shotAt(t).id, out = [];
  const box = (id, text, x0, y0, x1, y1) => out.push({ id, text, x0, y0, x1, y1 });
  for (const T of TAGS) if (t >= T.t0 && t < T.t1) box('tag' + T.t0, T.text, 50, 46, 700, 110);
  if (s === 'title' && t >= HITS.title1[0]) box('title', TITLE, 200, 340, 1720, 600);
  if (s === 'sign' || s === 'signTear' && t < 124.4) box('zr', '转让', 700, 300, 1200, 700);
  if (s === 'signTear' && t >= 124.75) box('rz', '外星人认证', 500, 250, 1400, 700);
  if (s === 'cellRoof') box('e0', '能量 0%', 760, 260, 1160, 340);
  if (s === 'cellTable') box('e1', '能量', 1480, 270, 1640, 330);
  if (s === 'screen1' && t > 43.25) box('scrA', '修理飞船', 600, 200, 1300, 500);
  if (s === 'screen1' && t >= HITS.screenSwap[0]) box('scrB', '最辣的', 600, 300, 1300, 600);
  if (s === 'menu') { box('menu0', '菜单', 700, 100, 1200, 260); if (t > 49.8) box('menu1', '最辣', 700, 600, 1300, 1000); }
  if (s === 'screen2' && t > 137.6) box('scr2', '再来一盘 × 200', 600, 200, 1300, 600);
  if (s === 'endCard' && t > 140.5) box('end', TITLE, 200, 300, 1720, 560);
  if (s === 'endCard' && t > 141.2) box('fin', '完', 900, 850, 1020, 950);
  return out;
};
// events for the score, the mix, the subtitles and the cue check
const EV = [];
for (const S_ of SECS) EV.push({ t: S_.t, type: 'cue', name: S_.id, bpm: S_.bpm, end: S_.end });
for (const l of LINES) EV.push({ t: l.t, type: 'line', id: l.id, who: l.who, dur: vdur(l.id) });
for (const [t_, name, gain, pan] of [...FOLEY, ...dipFoley()]) EV.push({ t: t_, type: 'fx', name, gain, pan });
for (const s of SUBS) EV.push({ t: s.t0, type: 'sub', t1: s.t1, text: s.text, who: WHO[s.who].name });
for (const [name, [t_, secId, b]] of Object.entries(HITS)) EV.push({ t: t_, type: 'hit', name, sec: secId, beat: b });
for (const [t_, id] of SHOTS) EV.push({ t: t_, type: 'shot', name: id });
EV.sort((a, b) => a.t - b.t);
window.EV = EV;
await document.fonts.load(`50px ${FONT}`); await document.fonts.load('40px VT323');
window.READY = true;
