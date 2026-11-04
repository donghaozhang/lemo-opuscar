// main.js — director for 《蒸笼爵士》: shot table, tempo map, global actor states (continuity across cuts), cameras, light grade
// (night / lamp / dawn changes the whole frame), snow, title cards (= subtitles), iris, film post; window.EV / SUBS / TEXTS / TIMELINE.
import * as T from './toon.js';
import { P, steam, glove, ribbon } from './parts.js';
import * as C from './cast.js';
import { makeFilm, post, GATE } from './film.js';
import { LANE, KIT } from './bgs.js';
import { clamp, lerp, hash, TAU } from '/core/lib.js';
const { shape, stroke, ell, arc, spline, quad, rr, rect, push, pop, translate, rotate, scale, dot } = T;

const Q = new URLSearchParams(location.search);
const cv = document.getElementById('c');
await document.fonts.ready;
for (const f of ['60px Huang', '40px XiaoWei']) await document.fonts.load(f, '王记包子开门啦蒸笼爵士完上海弄堂凌晨四点忘了上弦六点开门号外');
const F = makeFilm(cv); T.init(F.scene); const sg = F.sg;
const BGM = await (await fetch('./bg/bg.json')).json();
const IMG = {};
await Promise.all(['lane', 'kitchen'].map(k => new Promise(res => { const im = new Image(); im.onload = res; im.src = `./bg/${k}.png`; IMG[k] = im; })));

// ———————————————— shots and tempo ————————————————
const SHOT_D = [
  ['s01', 4.0],
  ['s02', 5.0], ['s03', 10 / 3], ['s04', 10 / 3], ['s05', 2.5], ['s06', 10 / 3], ['s07', 5 / 3], ['s08', 10 / 3], ['s09', 2.0],
  ['s10', 4], ['s11', 4], ['s12', 3], ['s13', 4], ['s14', 3], ['s15', 3], ['s16', 4], ['s17', 3], ['s18', 4], ['s19', 2], ['s20', 2], ['s21', 4],
  ['s22', 1.5],
  ['s23', 10 / 3], ['s24', 10 / 3], ['s25', 10 / 3], ['s26', 10 / 3], ['s27', 35 / 6], ['s28', 2.5],
  ['s29', 3.0], ['s30', 6.0], ['s31', 2.0], ['s32', 3.0],
  ['s33', 3.5], ['s34', 3.0], ['s35', 3.0], ['s36', 3.0], ['s37', 2.0], ['s38', 2.5], ['s39', 3.5],
  ['s40', 10 / 3], ['s41', 10 / 3], ['s42', 25 / 6], ['s43', 25 / 6], ['s44', 2.5],
];
const SH = {}; { let t = 0; for (const [id, d] of SHOT_D) { SH[id] = { id, t0: +t.toFixed(4), d, t1: +(t + d).toFixed(4) }; t += d; } }
const DUR = +SHOT_D.reduce((a, [, d]) => a + d, 0).toFixed(3);
const at = (id, lt) => +(SH[id].t0 + lt).toFixed(4);
const SECT = [
  { id: 'title', t: 0, bpm: 120 }, { id: 'sleepy', t: SH.s02.t0, bpm: 72 }, { id: 'countin', t: SH.s09.t0, bpm: 120 },
  { id: 'number', t: SH.s10.t0, bpm: 120 }, { id: 'stop', t: SH.s22.t0, bpm: 0 }, { id: 'chase', t: SH.s23.t0, bpm: 144 },
  { id: 'solo', t: SH.s29.t0, bpm: 72 }, { id: 'warm', t: SH.s33.t0, bpm: 72 }, { id: 'ring', t: SH.s37.t0, bpm: 0 },
  { id: 'finale', t: SH.s38.t0, bpm: 144 }, { id: 'end', t: DUR, bpm: 0 },
];
const secAt = t => { let s = SECT[0]; for (const x of SECT) if (t >= x.t) s = x; return s; };
const beats = t => { const s = secAt(t); return s.bpm ? (t - s.t) * s.bpm / 60 : 0; };
const tq = t => Math.floor(t * 12 + 1e-6) / 12;                    // characters on twos
const beatT = (sec, n) => { const s = SECT.find(x => x.id === sec); return +(s.t + n * 60 / s.bpm).toFixed(4); };
// breathing: an extreme on every beat; amplitude per section (×3 at the peak); frozen in the stop / ring
function breath(t, amp = .055) { const s = secAt(t); if (!s.bpm || s.id === 'solo') return { sx: 1, sy: 1 }; const c = Math.cos(TAU * beats(tq(t))); return { sx: 1 - c * amp * .6, sy: 1 + c * amp }; }
const hop = (t, a = 14) => { const s = secAt(t); if (!s.bpm) return 0; const b = beats(tq(t)); return -Math.abs(Math.sin(Math.PI * b)) * a; };
const ss = x => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
const eo = x => 1 - (1 - clamp(x, 0, 1)) ** 2, ei = x => clamp(x, 0, 1) ** 2;
const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
const PEAK = () => 1;

// ———————————————— events, cards (subtitles), texts ————————————————
const EV = [], SUBS = [], CARDS = [], HITS = [];
const ev = (t, type, o = {}) => EV.push({ t: +(+t).toFixed(4), type, ...o });
const hit = (name, t, sec, beat) => HITS.push({ name, t: +(+t).toFixed(4), sec, beat });
function CARD(id, lt0, lt1, text, o = {}) { const t0 = at(id, lt0), t1 = at(id, lt1); CARDS.push({ t0, t1, text, ...o }); SUBS.push({ t0, t1, text }); }

// ———————————————— camera / drawing helpers ————————————————
let CAM = { x: 0, y: 0, z: 1 };
function setCam(c) { CAM = c; T.BASE.splice(0, 6, c.z, 0, 0, c.z, 960 - c.x * c.z, 540 - c.y * c.z); T.reset(); }
const w2s = (x, y) => [960 + (x - CAM.x) * CAM.z, 540 + (y - CAM.y) * CAM.z];
function bg(name, squash = 0, pivot = 1180) {
  const m = BGM[name], z = CAM.z; sg.save(); sg.setTransform(z, 0, 0, z, 960 - CAM.x * z, 540 - CAM.y * z);
  if (squash) { sg.translate(0, pivot); sg.scale(1 - squash * .4, 1 + squash); sg.translate(0, -pivot); }
  sg.drawImage(IMG[name], m.ox, m.oy, m.w, m.h); sg.restore();
}
// the light grade: exposure (whole frame) + practical lights (screen) — applied after the scene, so walls, ground and figures all change
let GRADE = null;
function applyGrade() {
  if (!GRADE) return; const { exp = 1, lights = [] } = GRADE;
  sg.save(); sg.setTransform(1, 0, 0, 1, 0, 0);
  if (exp < 1) { sg.globalCompositeOperation = 'multiply'; const v = Math.round(255 * exp); sg.fillStyle = `rgb(${v},${v},${v + 2})`; sg.fillRect(GATE.x, 0, GATE.w, 1080); }
  sg.globalCompositeOperation = 'screen';
  for (const L of lights) { const [x, y] = w2s(L.x, L.y), r = L.r * CAM.z; const gr = sg.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(255,255,250,${L.a})`); gr.addColorStop(.5, `rgba(255,255,250,${L.a * .35})`); gr.addColorStop(1, 'rgba(255,255,250,0)'); sg.fillStyle = gr; sg.fillRect(x - r, y - r, r * 2, r * 2); }
  sg.restore();
}
// snow in screen space (deterministic), density d, wind w
function snow(t, d = 1, w = .3, under = null) {
  sg.save(); sg.setTransform(1, 0, 0, 1, 0, 0);
  const n = Math.round(110 * d);
  for (let i = 0; i < n; i++) {
    const sp = 40 + hash(i * 3.1) * 70, sz = 2 + hash(i * 7.7) * 4.5;
    const y = ((hash(i) * 1200 + t * sp) % 1200) - 60, x = GATE.x + ((hash(i * 1.9) * GATE.w + t * sp * w + Math.sin(t * 1.3 + i) * 14) % GATE.w + GATE.w) % GATE.w;
    sg.fillStyle = 'rgba(252,252,250,.92)'; sg.beginPath(); sg.arc(x, y, sz, 0, 7); sg.fill();
  }
  sg.restore();
}
// period title card (subtitle): near-black plate, white double rule, dot-and-ring corners, XiaoWei
function card(text, cy, size = 46) {
  sg.save(); sg.setTransform(1, 0, 0, 1, 0, 0); sg.font = `${size}px XiaoWei`;
  const w = sg.measureText(text).width + 120, h = size + 54, x = 960 - w / 2, y = cy - h / 2;
  sg.fillStyle = 'rgba(12,12,13,.93)'; sg.beginPath(); sg.roundRect(x, y, w, h, 10); sg.fill();
  sg.strokeStyle = '#E8E9E8'; sg.lineWidth = 3; sg.beginPath(); sg.roundRect(x + 8, y + 8, w - 16, h - 16, 6); sg.stroke();
  sg.lineWidth = 1.5; sg.beginPath(); sg.roundRect(x + 15, y + 15, w - 30, h - 30, 4); sg.stroke();
  for (const [cx, cy2] of [[x + 15, y + 15], [x + w - 15, y + 15], [x + 15, y + h - 15], [x + w - 15, y + h - 15]]) { sg.fillStyle = '#E8E9E8'; sg.beginPath(); sg.arc(cx, cy2, 4, 0, 7); sg.fill(); sg.beginPath(); sg.arc(cx, cy2, 8, 0, 7); sg.stroke(); }
  sg.fillStyle = '#F2F2F1'; sg.textAlign = 'center'; sg.textBaseline = 'middle'; sg.fillText(text, 960, cy + 2);
  sg.restore();
  return { x0: x, y0: y, x1: x + w, y1: y + h };
}
// fat display lettering (Huang): white face, heavy ink outline, ink drop shadow; per-character hop
function fat(text, cx, cy, size, o = {}) {
  sg.save(); sg.setTransform(1, 0, 0, 1, 0, 0); sg.font = `${size}px Huang`; sg.textBaseline = 'middle';
  const chars = [...text], ws = chars.map(c => sg.measureText(c).width + (o.track || 0)), tw = ws.reduce((a, b) => a + b, 0);
  let x = cx - tw / 2;
  chars.forEach((c, i) => {
    const dy = o.hop ? o.hop(i) : 0, x0 = x + ws[i] / 2, sc = o.scale ? o.scale(i) : 1;
    if (sc > .01) {
      sg.save(); sg.translate(x0, cy + dy); sg.scale(sc, sc); sg.textAlign = 'center'; sg.lineJoin = 'round';
      sg.fillStyle = P.ink; sg.fillText(c, size * .07, size * .08);
      sg.lineWidth = size * .14; sg.strokeStyle = P.ink; sg.strokeText(c, 0, 0);
      sg.fillStyle = o.face || P.white; sg.fillText(c, 0, 0); sg.restore();
    }
    x += ws[i];
  });
  sg.restore();
  return { x0: cx - tw / 2, x1: cx + tw / 2, y0: cy - size * .7, y1: cy + size * .7 };
}
function iris(cx, cy, r) {
  sg.save(); sg.setTransform(1, 0, 0, 1, 0, 0); sg.fillStyle = '#000'; sg.beginPath(); sg.rect(0, 0, 1920, 1080); sg.arc(cx, cy, Math.max(0, r), 0, TAU, true); sg.fill('evenodd');
  if (r > 2) { sg.strokeStyle = '#000'; sg.lineWidth = 8; sg.beginPath(); sg.arc(cx, cy, r, 0, TAU); sg.stroke(); }
  sg.restore();
}
// a music note shape (steam notes)
function note(x, y, k = 1) { shape(ell(x, y, 14 * k, 10 * k), { fill: P.white, lw: T.S.lw * .7 }); shape(rect(x + 11 * k, y - 46 * k, 5 * k, 46 * k), { fill: P.white, lw: T.S.lw * .6 }); shape(spline([[x + 14 * k, y - 46 * k], [x + 34 * k, y - 34 * k], [x + 30 * k, y - 20 * k]], false, 4).concat([[x + 16 * k, y - 32 * k]]), { fill: P.white, lw: T.S.lw * .6 }); }
function zzz(x, y, t, k = 1) { for (let i = 0; i < 3; i++) { const ph = (t * .7 + i / 3) % 1; push(); translate(x + i * 24 * k + Math.sin(ph * 6 + i) * 10, y - ph * 120 * k); scale(k * (.6 + ph)); shape([[-12, -12], [12, -12], [-12, 12], [12, 12]], { closed: false, fill: null, lw: T.S.lw * .9 }); pop(); } }

// ———————————————— global actor states (functions of time) ————————————————
// bun inventory: the 8 buns of the night (7 + the best); where they are depends on t
const SEQ = { // key times
  nod: at('s06', 1.4), wake: SH.s07.t0, countIn: SH.s09.t0, band: SH.s10.t0, ratGrab: at('s21', 2.5), see: SH.s22.t0,
  topple: at('s25', 5 / 6), spill: SH.s26.t0, wind: at('s35', .8), dawn: at('s36', .6), ring: SH.s37.t0,
};
// Wang (kitchen): kneading, yawn, nod off; asleep until the ring
function wangState(t) {
  const lt = t - SH.s04.t0;
  if (t < SH.s04.t0 + 1.3) { const k = Math.floor(t * 2.4) % 2; return { ex: 'sleepy', must: -.2, arms: [{ x: 70, y: -230 + k * 14, hand: 'fist', front: true }, { x: 150, y: -244 + (1 - k) * 14, hand: 'fist', front: true }] }; }
  if (t < SH.s04.t1) { const y = ss(seg(lt, 1.3, 1.8)) - ss(seg(lt, 2.8, 3.3)); return { ex: 'yawn', must: .3, sy: 1 + y * .12, sx: 1 - y * .06, arms: [{ x: -120, y: -380 - y * 60, hand: 'fist' }, { x: 120, y: -380 - y * 60, hand: 'fist' }] }; }
  if (t < SEQ.nod) { const k = Math.floor(t * 2) % 2; return { ex: 'sleepy', must: -.4, head: { rot: .05 * k }, arms: [{ x: 80, y: -228, hand: 'open', front: true }, { x: 150, y: -236, hand: 'open', front: true }] }; }
  if (t < SEQ.ring) { const d = ss(seg(t, SEQ.nod, SEQ.nod + .5)); return { ex: 'asleep', must: -.8, cap: .6 * d, lean: .32 * d, head: { rot: .25 * d, dy: 30 * d, dx: 24 * d }, arms: [{ x: 120, y: -230 + 20 * d, hand: 'open', front: true }, { x: 190, y: -226 + 20 * d, hand: 'open', front: true }] }; }
  return { ex: 'surprised', must: 1 };
}
// table objects: dough, pin, cleaver; kettle on the stove; the steamer stack; clock; flame
function pinState(t) {
  const b = beats(tq(t)), s = secAt(t).id;
  if (t < SEQ.wake) return { x: 1200, ex: 'asleep', roll: 0, sy: 1 };
  if (t < SEQ.band) { const st = ss(seg(t, at('s08', .3), at('s08', 1.2))) - ss(seg(t, at('s08', 1.6), at('s08', 2.4))); return { x: 1200, ex: st > .1 ? 'yawn' : 'sleepy', sy: 1 + st * .25, sx: 1 - st * .1, roll: 0 }; }
  if (s === 'number') { const x = 1190 + Math.sin(b * Math.PI / 2) * 60; return { x, ex: 'happy', roll: b * .9, y: hop(t, 6) }; }
  return { x: 1200, ex: 'determined', roll: 0 };
}
function kettleState(t) {
  if (t < SEQ.wake) return { ex: 'asleep', steam: 'none' };
  if (t < SEQ.wake + .7) return { ex: 'wink', steam: 'lazy' };
  if (t < SEQ.band) return { ex: 'sleepy', steam: 'lazy' };
  if (t < SEQ.see) return { ex: 'happy', steam: 'lazy', y: hop(t, 8) };
  if (t < SH.s23.t0) return { ex: 'surprised', steam: 'up' };
  return { ex: 'angry', steam: 'up' };
}
function flameState(t) {
  if (t < SEQ.wake) return { ex: 'asleep', droop: .9, flare: 0 };
  if (t < SEQ.band) { const y = ss(seg(t, at('s08', .2), at('s08', 1.0))) - ss(seg(t, at('s08', 1.8), at('s08', 2.6))); return { ex: y > .2 ? 'yawn' : 'sleepy', droop: .7 - y * .6, flare: 0 }; }
  if (t < SEQ.see) return { ex: 'grin', droop: 0, flare: .4 + .4 * Math.abs(Math.sin(Math.PI * beats(tq(t)))) };
  return { ex: 'surprised', droop: 0, flare: 1 };
}
function steamerState(t) {
  const b = beats(tq(t));
  if (t < SEQ.wake) return { ex: 'asleep', gap: 2, breath: 0, lid: 0 };
  if (t < SEQ.band) { const inh = ss(seg(t, at('s08', .5), at('s08', 1.8))) - ss(seg(t, at('s08', 2.2), at('s08', 3.0))); return { ex: inh > .3 ? 'surprised' : 'sleepy', gap: 2 + inh * 26, breath: inh * .8, lid: 0 }; }
  if (t < SEQ.see) { const c = (1 + Math.cos(TAU * b)) / 2; return { ex: 'happy', gap: 4 + c * 14, breath: .5 + c * .5, lid: (Math.floor(b) % 2 === 1 ? Math.sin(Math.PI * (b % 1)) : 0) }; }
  return { ex: 'scared', gap: 8, breath: .3, lid: 0 };
}
function clockState(t) {
  if (t < SEQ.wind) return { ex: 'asleep', time: 4, stopped: 1 };
  if (t < SEQ.dawn) return { ex: 'surprised', time: 4, stopped: 0 };
  if (t < SEQ.ring) { const k = ss(seg(t, SEQ.dawn, SEQ.ring - .2)); return { ex: 'happy', time: 4 + 2 * k, stopped: 0 }; }
  return { ex: 'joy', time: 6, ring: 1 };
}
// dawn: the exposure of the kitchen (night .74 → morning 1.0) and the window's brightness
const dawnK = t => ss(seg(t, SEQ.dawn, SEQ.ring));

// draw the whole kitchen stage with everyone in it at time t (the camera is already set)
function kitchen(t, o = {}) {
  bg('kitchen', o.squash || 0);
  const br = breath(t, o.amp ?? .055), H = hop(t, o.hop ?? 0);
  const dk = dawnK(t);
  // the window: night dark → dawn bright (drawn over the painting)
  { const W_ = KIT.window, v = Math.round(lerp(78, 236, dk)); const [a, b] = w2s(W_.x, W_.y); sg.save(); sg.setTransform(1, 0, 0, 1, 0, 0); sg.fillStyle = `rgba(${v},${v},${v + 2},${.55 + .45 * dk})`; sg.fillRect(a + 6 * CAM.z, b + 6 * CAM.z, (W_.w - 12) * CAM.z, (W_.h - 12) * CAM.z); sg.restore(); }
  if (o.boyAtWindow) boyAtWindowInside(t, o.boyAtWindow);
  // clock on the shelf
  const cs = clockState(t); C.clock({ x: 600, y: 470, k: .62, t, sx: br.sx, sy: br.sy, ...cs });
  // stove + flame + kettle
  C.stove({ x: 1880, y: 1180, k: 1.1, glow: 1, sx: br.sx, sy: br.sy });
  const fs = flameState(t); C.flame({ x: 1880, y: 1136, k: .38, t, ...fs });
  const ks = kettleState(t); C.kettle({ x: 1880, y: 975 + (ks.y || 0), k: .7, t, sx: br.sx, sy: br.sy, ...ks });
  // steamer stack
  if (!o.noSteamer) { const st = steamerState(t); C.steamer({ x: 1640, y: 1180, k: .95, t, sx: br.sx, sy: br.sy, ...st, ...(o.steamer || {}) }); }
  // Wang
  if (!o.noWang) { const ws = wangState(t); C.wang({ x: 880, y: 1180, k: 1.3, ...ws, sx: (ws.sx || 1) * br.sx, sy: (ws.sy || 1) * br.sy }); }
  // dough on the table
  if (!o.noDough) { push(); shape(spline([[960, 962], [970, 930], [1040, 916], [1110, 930], [1120, 962]], true, 6), { fill: P.white, shade: () => T.fillOnly(ell(1080, 950, 40, 16), P.paper, { boil: 0 }) }); pop(); }
  // pin + cleaver on the table
  const ps = pinState(t); if (!o.noPin) C.pin({ x: ps.x, y: 960 + (ps.y || 0), k: .7, roll: ps.roll, ex: ps.ex, sx: (ps.sx || 1) * br.sx, sy: (ps.sy || 1) * br.sy });
  if (!o.noCleaver) C.cleaver({ x: 1440, y: 960 + hop(t, 10), k: .5, ex: t < SEQ.wake ? 'asleep' : t < SEQ.band ? 'sleepy' : t < SEQ.see ? 'grin' : 'determined', sx: br.sx, sy: br.sy });
  // the best bun on its saucer (until the rat grabs it)
  if (t < SEQ.ratGrab && t >= at('s15', 1.5)) { shape(ell(1520, 960, 46, 10), { fill: P.pale }); C.bun(1520, 954, .8, { best: true }); }
  if (o.extra) o.extra();
}
// the boy's face pressed to the frosted window, seen from inside (frost overlay + the rubbed peephole)
function boyAtWindowInside(t, k) {
  const W_ = KIT.window, [a, b] = w2s(W_.x, W_.y);
  sg.save(); sg.setTransform(1, 0, 0, 1, 0, 0); sg.beginPath(); sg.rect(a + 6 * CAM.z, b + 6 * CAM.z, (W_.w - 12) * CAM.z, (W_.h - 12) * CAM.z); sg.clip();
  push(); C.boy({ x: W_.x + 200, y: W_.y + 560, k: 1.1, ex: 'hungry', bag: false, scarf: t }); pop();
  sg.fillStyle = 'rgba(200,202,202,.45)'; sg.fillRect(a, b, W_.w * CAM.z, W_.h * CAM.z);
  sg.restore();
}

// ———————————————— the script: cards, events, hits ————————————————
// title
ev(0, 'bed', { name: 'wind', t1: SH.s04.t0, gain: .6 });
ev(.2, 'snowtick'); ev(1.0, 'puff'); ev(1.5, 'puff'); ev(2.0, 'puff'); ev(2.5, 'puff'); hit('title', 1.0, 'title', 2);
CARD('s02', .8, 5.0, '上海 · 弄堂 · 凌晨四点', { y: 960 });
ev(at('s03', 2.0), 'window');
ev(SH.s04.t0, 'bed', { name: 'stove', t1: SH.s16.t0, gain: .5 });
[0, .42, .83].forEach(x => ev(at('s04', x), 'dough'));
ev(at('s04', 1.3), 'yawn'); hit('yawn', at('s04', 1.3));
CARD('s05', .05, 2.5, '闹钟忘了上弦', { y: 960 });
ev(at('s05', .9), 'whoosh', { g: .4 });
ev(SEQ.nod, 'flop'); hit('nod', SEQ.nod);
[.4, 2.0].forEach(x => ev(at('s06', x + .8), 'snore')); ev(at('s07', .3), 'snore');
ev(SEQ.wake + .1, 'eye'); hit('wake', SEQ.wake + .1);
ev(at('s08', .3), 'stretch'); ev(at('s08', .6), 'inhale'); ev(at('s08', 2.2), 'exhale');
for (let i = 0; i < 4; i++) { ev(SH.s09.t0 + i * .5, 'tap'); } hit('countin', SH.s09.t0, 'countin', 0);
// the number
hit('band', SEQ.band, 'number', 0); ev(SEQ.band, 'puff');
for (let i = 0; i < 8; i++) ev(at('s11', i * .5), 'roll', { g: .6 });
for (let i = 0; i < 12; i++) ev(at('s12', i * .25), 'chop');
for (let i = 0; i < 8; i++) ev(at('s13', i * .5), 'pleat');
ev(at('s13', 3.0), 'hopin'); ev(at('s13', 3.5), 'hopin');
for (let i = 0; i < 6; i++) ev(at('s14', i * .5), i % 2 ? 'lid' : 'puff');
ev(at('s15', .5), 'pour', { d: 1.0 }); ev(at('s15', 1.5), 'plate'); hit('bestbun', at('s15', 1.5), 'number', 39);
ev(at('s16', .4), 'rub'); ev(at('s16', 1.5), 'growl'); ev(SH.s16.t0, 'bed', { name: 'wind', t1: SH.s17.t0, gain: .6 }); hit('growl', at('s16', 1.5), 'number', 45);
ev(at('s17', 1.0), 'growl', { g: .6 });
ev(at('s18', 1.0), 'morph'); hit('peak', SH.s18.t0, 'number', 56); ev(SH.s18.t0, 'puff');
ev(at('s19', .2), 'snore', { small: 1 });
ev(at('s20', .5), 'sniff'); ev(at('s20', 1.2), 'sniff');
for (let i = 0; i < 5; i++) ev(at('s21', i * .5), 'tiptoe');
ev(SEQ.ratGrab, 'grab'); hit('grab', SEQ.ratGrab, 'number', 77);
ev(SEQ.see, 'whistle'); hit('see', SEQ.see);
// chase
hit('chase', SH.s23.t0, 'chase', 0);
for (let i = 0; i < 8; i++) ev(at('s23', i * 10 / 24 * 2), 'scamper');
for (let i = 0; i < 8; i++) ev(at('s24', i * .4167), 'basket');
ev(SEQ.topple, 'topple'); hit('topple', SEQ.topple, 'chase', 18);
ev(at('s25', 1.4), 'door'); ev(at('s25', 1.5), 'tumble', { d: 1.5 });
for (let i = 0; i < 8; i++) ev(at('s26', .2 + i * .36), 'bunsnow');
for (let i = 0; i < 7; i++) { ev(at('s27', 5 / 6 + i * .625), 'catch'); hit('catch' + i, at('s27', 5 / 6 + i * .625), 'chase', 34 + i * 1.5); }
ev(at('s28', .3), 'skid'); ev(at('s28', 1.2), 'scamper'); ev(at('s28', .9), 'catch');
// the choice (solo clarinet, snow, wind)
ev(SH.s29.t0, 'bed', { name: 'wind', t1: SH.s33.t0, gain: .9 });
ev(at('s29', .6), 'breath'); ev(at('s30', 1.2), 'tick'); ev(at('s30', 1.95), 'tick'); ev(at('s30', 2.7), 'tick'); ev(at('s30', 3.6), 'growl', { g: .5 }); ev(at('s30', 4.6), 'tick');
for (let i = 0; i < 4; i++) ev(at('s32', .2 + i * .42), 'crunch');
ev(at('s32', 2.0), 'knock'); ev(at('s32', 2.35), 'knock'); hit('knock', at('s32', 2.0));
ev(at('s32', 2.36), 'silence', { t1: at('s32', 3.0) });
// pay-off
ev(SH.s33.t0, 'dooropen'); hit('dooropen', SH.s33.t0, 'warm', 0);
ev(SH.s33.t0, 'bed', { name: 'stove', t1: SH.s40.t0, gain: .4 });
for (let i = 0; i < 6; i++) ev(at('s33', 1.0 + i * .33), 'bunhop');
ev(at('s34', .5), 'tear'); ev(at('s34', 1.6), 'give'); hit('give', at('s34', 1.6));
for (let i = 0; i < 6; i++) ev(at('s35', .8 + i * .3), 'ratchet');
ev(at('s35', 2.6), 'ticking', { t1: SEQ.ring });
ev(SEQ.dawn, 'swell', { d: 1.8 }); ev(at('s36', .3), 'spin', { d: 1.8 });
ev(SEQ.ring, 'ring', { d: 1.9 }); hit('ring', SEQ.ring);
ev(at('s38', .2), 'take'); ev(at('s38', .25), 'boing');
ev(at('s39', 1.4), 'give'); ev(at('s39', 2.2), 'pat');
// finale
hit('finale', SH.s38.t0, 'finale', 0); ev(SH.s38.t0, 'whoosh', { g: .6 });
ev(SH.s40.t0, 'bed', { name: 'morning', t1: DUR, gain: .5 });
for (let i = 0; i < 8; i++) ev(at('s40', i * .4167), 'run');
ev(SH.s41.t0, 'paper'); for (let i = 0; i < 7; i++) ev(at('s41', .15 + i * .2), 'print');
CARD('s41', 0, 10 / 3, '王记包子 开门啦！', { hidden: 1 });
for (let i = 0; i < 10; i++) ev(at('s42', i * .4167), 'shuffle', { g: .5 });
for (let i = 0; i < 8; i++) ev(at('s43', i * .4167), 'knead');
ev(at('s43', 3.4), 'wink');
ev(at('s44', .3), 'morph'); ev(at('s44', 1.5), 'iris'); hit('iris', at('s44', 1.5), 'finale', 54);
CARD('s44', .5, 2.5, '完', { hidden: 1 });
SUBS.unshift({ t0: .9, t1: 4.0, text: '蒸笼爵士' });

// ———————————————— shots ————————————————
const shotList = SHOT_D.map(([id]) => SH[id]);
const shotAt = t => { for (const s of shotList) if (t < s.t1) return s; return shotList[shotList.length - 1]; };
let TXT = [];   // texts drawn this frame (for TEXTS)
const NIGHT_LANE = t => ({ exp: .66, lights: [{ x: LANE.winX, y: 610, r: 420, a: .35 }, { x: LANE.lampX, y: 150, r: 380, a: .35 }, { x: LANE.lampX, y: 900, r: 260, a: .18 }] });
const NIGHT_KIT = t => { const d = dawnK(t); return { exp: lerp(.74, 1, d), lights: [{ x: KIT.lamp.x, y: 170, r: 900, a: .32 * (1 - d * .5) }, { x: 1880, y: 1090, r: 420, a: .3 }, { x: KIT.window.x + 190, y: 410, r: 700, a: .45 * d }] }; };
const MORNING_LANE = t => ({ exp: 1, lights: [{ x: 2200, y: -600, r: 2200, a: .18 }] });

const SHOTS = {
  // title: an iris opens on a falling snowflake over the roofs; the chimney's steam forms the title, letters hop on the beat
  s01(t, lt) {
    setCam({ x: 1160, y: -760, z: .95 }); bg('lane'); snow(t, .8);
    // chimney puffs rising
    for (let i = 0; i < 6; i++) { const ph = (lt * .5 + i / 6) % 1; push(); const x = 1155 + Math.sin(ph * 5 + i) * 40, y = -760 - ph * 380; shape(ell(x, y, 30 + ph * 60, 22 + ph * 40), { fill: P.pale, lw: T.S.lw * .7, alpha: 1 - ph * .6 }); pop(); }
    GRADE = NIGHT_LANE(t);
    applyGrade(); GRADE = null;
    const b = beats(tq(t));
    const R = fat('蒸笼爵士', 960, 430, 190, { track: 16, scale: i => ss(seg(lt, 1.0 + i * .25, 1.35 + i * .25)), hop: i => -Math.abs(Math.sin(Math.PI * (b + i * .25))) * 18 });
    if (lt > 1.0) TXT.push({ id: 'title', text: '蒸笼爵士', ...R });
    // iris opens on the falling snowflake
    const r = lt < 1.2 ? ei(lt / 1.2) * 1000 : 2000; const fx = 980 + Math.sin(lt * 3) * 20, fy = 300 + lt * 40;
    if (lt < 1.2) { iris(fx, fy, r); sg.save(); sg.setTransform(1, 0, 0, 1, 0, 0); sg.fillStyle = P.white; sg.beginPath(); sg.arc(fx, fy, 9, 0, 7); sg.fill(); sg.restore(); }
  },
  // tilt down from the roofs to Wang's shop: sign, door card; place card
  s02(t, lt) {
    const y = lerp(-560, 520, ss(seg(lt, .2, 2.8))), z = lerp(.95, .8, ss(seg(lt, .2, 2.8)));
    setCam({ x: 1100, y, z }); bg('lane'); snow(t, 1);
    GRADE = NIGHT_LANE(t); applyGrade(); GRADE = null;
  },
  // tabletop push toward the glowing frosted window
  s03(t, lt) {
    const k = ss(seg(lt, 0, 3.2)); setCam({ x: lerp(1000, 1236, k), y: lerp(560, 612, k), z: lerp(.85, 2.1, k) }); bg('lane'); snow(t, 1.2);
    GRADE = { exp: .66, lights: [{ x: LANE.winX, y: 610, r: 420, a: .35 + .2 * k }] }; applyGrade(); GRADE = null;
  },
  // kitchen stage, wide: Wang kneads, yawns
  s04(t, lt) { setCam({ x: 1300, y: 760, z: .62 }); kitchen(t, { amp: .03 }); GRADE = NIGHT_KIT(t); },
  // insert: the alarm clock at 4:00, key unturned; Wang's glove passes below
  s05(t, lt) {
    setCam({ x: 600, y: 370, z: 2.3 }); kitchen(t, { amp: .02 });
    const gx = lerp(250, 980, seg(lt, .4, 1.6)); glove(gx, 520, 0, 'open', 1.4);
    GRADE = NIGHT_KIT(t);
  },
  // medium: Wang nods off into the dough; snore
  s06(t, lt) { setCam({ x: 960, y: 830, z: 1.5 }); kitchen(t, { amp: .03 }); if (t > SEQ.nod + .5) zzz(1040, 640, t, 1); GRADE = NIGHT_KIT(t); },
  // close-up: the kettle opens one eye (J: the snore)
  s07(t, lt) { setCam({ x: 1900, y: 880, z: 2.6 }); kitchen(t, { amp: .02 }); GRADE = NIGHT_KIT(t); },
  // medium group: the flame yawns, the pin stretches, the steamers inhale
  s08(t, lt) { setCam({ x: 1560, y: 920, z: 1.05 }); kitchen(t, { amp: .03 }); GRADE = NIGHT_KIT(t); },
  // close-up: the cleaver taps the count-in on the board
  s09(t, lt) {
    setCam({ x: 1440, y: 860, z: 2.4 });
    const tap = Math.floor(lt * 2), ph = (lt * 2) % 1;
    kitchen(t, { noCleaver: 1, amp: .02 });
    C.cleaver({ x: 1440, y: 960 - (ph < .5 ? (1 - ph * 2) * 26 : 0), k: .5, ex: tap >= 3 ? 'grin' : 'determined', tilt: ph < .3 ? -.2 : 0 });
    for (let i = 0; i <= Math.min(3, tap); i++) { const [x, y] = [1380 + i * 40, 800]; push(); translate(x, y); shape(ell(0, 0, 10, 10), { fill: i === tap && ph < .4 ? P.white : P.light, lw: T.S.lw * .6 }); pop(); }
    GRADE = NIGHT_KIT(t);
  },
  // the number: wide, everything dances
  s10(t, lt) { setCam({ x: 1300, y: 760, z: .62 }); kitchen(t, { amp: .07, hop: 10 }); GRADE = NIGHT_KIT(t); },
  // medium: the pin rolls the dough flat
  s11(t, lt) {
    setCam({ x: 1330, y: 880, z: 2.3 });
    kitchen(t, { noDough: 1, amp: .05 });
    const b = beats(tq(t)), w = 40 + Math.min(1, lt / 3) * 90;
    shape(spline([[1190 - w, 962], [1190 - w + 10, 950], [1190 + w - 10, 950], [1190 + w, 962]], true, 4), { fill: P.white });
    GRADE = NIGHT_KIT(t);
  },
  // medium: the cleaver chops the filling on eighths
  s12(t, lt) {
    setCam({ x: 1430, y: 870, z: 2.6 });
    kitchen(t, { noCleaver: 1, amp: .05 });
    const e = (lt * 4) % 1, up = e < .5 ? Math.sin(e * 2 * Math.PI / 2) : 0;
    shape(spline([[1350, 962], [1370, 944], [1420, 938], [1470, 946], [1490, 962]], true, 5), { fill: P.dmid });
    C.cleaver({ x: 1430, y: 960 - up * 40, k: .5, ex: 'grin', tilt: up * .25 });
    for (let i = 0; i < 4; i++) { const ph = (lt * 4 + i * .25) % 1; dot(1420 + Math.cos(i * 2) * ph * 80, 940 - Math.sin(ph * Math.PI) * 60, 5, P.dark); }
    GRADE = NIGHT_KIT(t);
  },
  // medium: the cleaver's gloves pleat a bun, one pleat per beat; the buns hop into the steamer
  s13(t, lt) {
    setCam({ x: 1380, y: 900, z: 2.2 });
    kitchen(t, { amp: .05 });
    const b = Math.floor(lt * 2);
    const bx = 1320, by = 958;
    if (lt < 3.0) { push(); translate(bx, by); scale(1 + .05 * Math.sin(lt * 12)); C.bun(0, 0, 1.1, {}); pop(); for (const s of [-1, 1]) glove(bx + s * 70, by - 40 - (b % 2 ? 10 : 0), s > 0 ? Math.PI : 0, b % 2 ? 'grab' : 'open', .9, { flip: s < 0 }); }
    for (const [h0, x0] of [[3.0, 1320], [3.5, 1260]]) if (lt > h0) { const k = clamp((lt - h0) / .45, 0, 1); C.bun(lerp(x0, 1640, k), lerp(958, 880, k) - Math.sin(k * Math.PI) * 160, .9, { rot: k * 6 }); }
    GRADE = NIGHT_KIT(t);
  },
  // the steamer stack breathes; lid lifts like a hat on the backbeat
  s14(t, lt) { setCam({ x: 1640, y: 900, z: 1.45 }); kitchen(t, { amp: .06 }); GRADE = NIGHT_KIT(t); },
  // the kettle pours and crowns the best bun; steam notes
  s15(t, lt) {
    setCam({ x: 1700, y: 900, z: 1.5 });
    kitchen(t, { amp: .05, extra: () => { for (let i = 0; i < 3; i++) { const ph = (lt * .7 + i / 3) % 1; note(2010 + Math.sin(ph * 6 + i) * 20 + i * 30, 760 - ph * 260, .9); } if (lt < 1.5) { const k = seg(lt, .7, 1.5); C.bun(lerp(1880, 1520, k), lerp(880, 954, k) - Math.sin(k * Math.PI) * 80, .8, { best: true }); } } });
    GRADE = NIGHT_KIT(t);
  },
  // outside: the newsboy at the frosted window rubs a peephole, watches, stomach growls
  s16(t, lt) {
    setCam({ x: 1330, y: 560, z: 1.25 }); bg('lane');
    // the window glows and the kitchen shadows dance behind the frost
    const b = beats(tq(t)); sg.save(); sg.setTransform(1, 0, 0, 1, 0, 0); const [a, c] = w2s(1056, 486); sg.fillStyle = `rgba(240,240,238,${.35 + .1 * Math.cos(TAU * b)})`; sg.fillRect(a, c, 348 * CAM.z, 248 * CAM.z); sg.restore();
    const rub = lt > .3 && lt < 1.3, pk = ss(seg(lt, .3, 1.3));
    if (pk > 0) { sg.save(); sg.setTransform(1, 0, 0, 1, 0, 0); const [px, py] = w2s(1300, 600); sg.fillStyle = 'rgba(60,60,62,.55)'; sg.beginPath(); sg.ellipse(px, py, 70 * pk * CAM.z, 50 * pk * CAM.z, 0, 0, 7); sg.fill(); sg.restore(); }
    const growl = lt > 1.5 && lt < 2.3;
    C.boy({ x: 1490, y: 900, k: 1.35, mirror: 1, lean: .12, ex: growl ? 'sad' : 'hungry', scarf: t, arms: rub ? [{ x: 150 + Math.sin(lt * 20) * 18, y: -230, hand: 'open', front: true }, { x: -60, y: -100, hand: 'open' }] : growl ? [{ x: 30, y: -100, hand: 'open', front: true }, { x: -30, y: -96, hand: 'open', front: true }] : [{ x: 120, y: -150, hand: 'open' }, { x: -60, y: -90, hand: 'open' }] });
    if (growl) { push(); translate(1490, 760); for (let i = 0; i < 3; i++) stroke(arc(0, 0, 40 + i * 20, 30 + i * 14, -.6, .6, 8), T.S.lw * .6); pop(); }
    snow(t, 1);
    GRADE = NIGHT_LANE(t);
  },
  // over the shoulder: the back of his cap and head in the foreground; inside, through the peephole, the kitchen dances
  s17(t, lt) {
    setCam({ x: 1500, y: 760, z: .62 });
    kitchen(t, { amp: .07, hop: 10 });
    GRADE = NIGHT_KIT(t); applyGrade(); GRADE = null;
    // frost over the whole view except a peephole
    sg.save(); sg.setTransform(1, 0, 0, 1, 0, 0); sg.fillStyle = 'rgba(205,207,207,.72)'; sg.beginPath(); sg.rect(GATE.x, 0, GATE.w, 1080); sg.ellipse(1060, 470, 380, 290, 0, 0, 7); sg.fill('evenodd');
    sg.strokeStyle = 'rgba(250,250,250,.5)'; sg.lineWidth = 3; for (let i = 0; i < 40; i++) { const x = GATE.x + hash(i) * GATE.w, y = hash(i * 2) * 1080; if (Math.hypot((x - 1060) / 380, (y - 470) / 290) < 1.05) continue; for (let k = 0; k < 5; k++) { const a = k / 5 * 6.28 + i; sg.beginPath(); sg.moveTo(x, y); sg.lineTo(x + Math.cos(a) * 22, y + Math.sin(a) * 22); sg.stroke(); } }
    sg.restore();
    // window frame bars
    sg.save(); sg.setTransform(1, 0, 0, 1, 0, 0); sg.fillStyle = '#2A2C2E'; sg.fillRect(GATE.x, 0, 40, 1080); sg.fillRect(GATE.x, 0, GATE.w, 40); sg.fillRect(1420, 0, 30, 1080); sg.restore();
    // OTS: back of the boy's head + shoulder, bottom-left foreground, at screen scale
    setCam({ x: 0, y: 0, z: 1 }); T.BASE.splice(0, 6, 1, 0, 0, 1, 0, 0); T.reset();
    C.boyBack({ x: 520, y: 1150, k: 2.4, lean: Math.sin(lt * 2) * .02 });
  },
  // peak: pull back, everything (background included) dances ×3; the dough rope morphs into a trombone
  s18(t, lt) {
    const z = lerp(1.1, .62, ss(seg(lt, 0, 1.6)));
    setCam({ x: 1300, y: 780, z });
    const b = beats(tq(t)), sq = Math.cos(TAU * b) * .025;
    kitchen(t, { amp: .15, hop: 22, squash: sq, extra: () => {
      // dough rope → trombone (transformation), played by the pin
      const k = ss(seg(lt, .6, 1.6)), x0 = 1180, y0 = 860;
      if (k < 1) stroke(spline([[x0 - 120, y0], [x0 - 40, y0 - 30 * (1 - k)], [x0 + 40, y0 + 20 * (1 - k)], [x0 + 120, y0]], false, 6), 18 * (1 - k * .5));
      if (k > .2) { push(); translate(x0, y0); scale(k); const sl = Math.sin(lt * 6) * 40;
        shape(rr(-140 - sl, -10, 180, 12, 6), { fill: P.white }); shape(rr(-140 - sl, 14, 180, 12, 6), { fill: P.white }); shape(spline([[-140 - sl, -10], [-170 - sl, 8], [-140 - sl, 26]], false, 5).concat([[-140 - sl, 14], [-152 - sl, 8], [-140 - sl, -2]]), { fill: P.white });
        shape(rr(30, -8, 120, 10, 5), { fill: P.white }); shape([[150, -30], [210, -60], [210, 50], [150, 20]], { fill: P.white }); pop(); }
    } });
    GRADE = NIGHT_KIT(t);
  },
  // insert: the clock is still at 4:00 (and still asleep)
  s19(t, lt) { setCam({ x: 600, y: 380, z: 2.3 }); kitchen(t, { amp: .07 }); zzz(640, 300, t, .8); GRADE = NIGHT_KIT(t); },
  // close-up: the rat hole — eyes, snout, sniff
  s20(t, lt) {
    setCam({ x: 2390, y: 1110, z: 3.0 }); kitchen(t, { amp: .02 });
    const out = ss(seg(lt, .3, 1.4));
    push(); sg.save(); sg.setTransform(1, 0, 0, 1, 0, 0); const [hx, hy] = w2s(2390, 1180); sg.beginPath(); sg.ellipse(hx, hy, 46 * CAM.z, 60 * CAM.z, 0, Math.PI, TAU); sg.clip();
    C.rat({ x: 2370 + out * 10, y: 1180 + (1 - out) * 50, k: .45, ex: 'sly', tail: 'q', headRot: Math.sin(lt * 14) * .08 * out }); sg.restore(); pop();
    GRADE = NIGHT_KIT(t);
  },
  // full: the rat tiptoes on the beats behind the dancers and grabs the best bun
  s21(t, lt) {
    setCam({ x: lerp(2150, 1700, ss(seg(lt, 0, 3))), y: 1000, z: 1.6 }); kitchen(t, { amp: .05 });
    const st = Math.floor(lt * 2), ph = (lt * 2) % 1, x = lerp(2340, 1580, Math.min(1, (st + ss(ph)) / 6));
    const grab = t >= SEQ.ratGrab;
    C.rat({ x: lt < 2.5 ? x : lerp(1580, 1700, seg(lt, 2.5, 4)), y: lt < 2.0 ? 1180 : 1180 - Math.sin(seg(lt, 2.0, 2.5) * Math.PI) * 220 - (lt > 2.8 ? 0 : 0) - (lt > 2.55 && lt < 2.8 ? 0 : 0), k: .5, ex: grab ? 'happy' : 'sly', tail: 'q', legs: [{ x: -22, y: -Math.abs(Math.sin(ph * Math.PI)) * 18 }, { x: 22, y: -Math.abs(Math.cos(ph * Math.PI)) * 18 }], arms: grab ? [{ x: -50, y: -60, hand: 'open', hk: .7 }, { x: 60, y: -150, hand: 'grab', hk: .7 }] : null });
    if (grab) C.bun(lerp(1580, 1700, seg(lt, 2.5, 4)) + 34, 1180 - 70 - 30, .55, { best: true });
    GRADE = NIGHT_KIT(t);
  },
  // close-up: the kettle sees — eyes pop, the steam whistles straight up (band stop: everything freezes)
  s22(t, lt) { setCam({ x: 1900, y: 880, z: 2.6 }); kitchen(SEQ.see + .01, { amp: 0 }); C.kettle({ x: 1880, y: 975, k: .7, ex: 'surprised', steam: 'up', t, sy: 1 + (lt < .15 ? .15 : 0) }); GRADE = NIGHT_KIT(t); },
  // the chase (144): wide stage; the rat runs with the bun, the pin rolls and the cleaver hops after it
  s23(t, lt) {
    setCam({ x: 1700, y: 920, z: .9 }); kitchen(t, { noPin: 1, noCleaver: 1, amp: .04 });
    const k = lt / (10 / 3), rx = lerp(1700, 1580, k), ry = 1180;
    runner('rat', t, lerp(2250, 1640, ss(k)), ry, .55, -1);
    C.pin({ x: lerp(1100, 1520, ss(k)), y: 1180, k: .75, roll: lt * 4, ex: 'angry' });
    C.cleaver({ x: lerp(1000, 1380, ss(k)), y: 1180 + hop(t, 40), k: .55, ex: 'angry' });
    GRADE = NIGHT_KIT(t);
  },
  // medium, tilt up the stack: the rat climbs, the stack sways like a concertina
  s24(t, lt) {
    const k = ss(seg(lt, 0, 3)); setCam({ x: 1650, y: lerp(1000, 760, k), z: 1.25 });
    const sw = Math.sin(lt * 7) * (.4 + lt * .4);
    kitchen(t, { noSteamer: 1, amp: .03 });
    C.steamer({ x: 1640, y: 1180, k: .95, ex: 'scared', gap: 10 + Math.sin(lt * 9) * 8, swayX: sw, t });
    const cy = lerp(1170, 770, k);
    C.rat({ x: 1640 + sw * 20 + Math.sin(lt * 14) * 10, y: cy, k: .5, ex: 'happy', tail: 'whip', t, arms: [{ x: -40, y: -150 + Math.sin(lt * 14) * 20, hand: 'grab', hk: .7 }, { x: 50, y: -150 - Math.sin(lt * 14) * 20, hand: 'grab', hk: .7 }] });
    C.bun(1640 + sw * 20 + 40, cy - 40, .5, { best: true });
    C.pin({ x: 1480, y: 1180, k: .7, ex: 'scared', roll: 0 }); C.kettle({ x: 1880, y: 975, k: .7, ex: 'scared', steam: 'up', t });
    GRADE = NIGHT_KIT(t);
  },
  // high angle, one shot: the stack topples toward the door; buns fly; the door bursts open
  s25(t, lt) {
    setCam({ x: 1000, y: 860, z: .72 });
    kitchen(t, { noSteamer: 1, amp: .03, extra: () => {
      const k = ei(seg(t, SEQ.topple, SEQ.topple + .9)); push(); translate(1640, 1180); rotate(-k * 1.45); translate(-1640, -1180);
      C.steamer({ x: 1640, y: 1180, k: .95, ex: 'scared', gap: 14 + k * 30, t }); pop();
      if (k > .3) for (let i = 0; i < 8; i++) { const ph = clamp((lt - 1.0 - i * .07) / 1.2, 0, 1); if (ph <= 0) continue; C.bun(lerp(1500 - i * 40, 200, ph), lerp(900, 1060, ph) - Math.sin(ph * Math.PI) * (200 + i * 20), .9, { rot: ph * 8, best: i === 7 }); }
      runner('rat', t, lerp(1500, 260, ss(seg(lt, 1.0, 3.3))), 1180, .5, -1);
    } });
    // the door bursts open (the dark gap of the lane)
    if (lt > 1.4) { push(); shape(rect(70, 420, 290, 760), { fill: P.dark }); shape([[70, 420], [10, 380], [10, 1220], [70, 1180]], { fill: P.dmid }); pop(); }
    GRADE = NIGHT_KIT(t);
  },
  // outside, tilt down with the fall: the buns tumble out of the door down the step into the snow
  s26(t, lt) {
    const k = ss(seg(lt, 0, 2.5)); setCam({ x: 1000, y: lerp(540, 820, k), z: 1.0 }); bg('lane');
    // open door
    push(); shape(rect(740, 470, 220, 430), { fill: P.ink }); shape([[740, 470], [690, 440], [690, 930], [740, 900]], { fill: P.dmid }); pop();
    for (let i = 0; i < 8; i++) { const ph = clamp((lt - i * .3) / 1.4, 0, 1); if (ph <= 0) continue; const x = lerp(850, 1150 + i * 70, ph), y = lerp(780, 900, ph) - Math.abs(Math.sin(ph * Math.PI * 2)) * (100 - ph * 70); C.bun(x, y, 1.0, { rot: ph * 10, best: i === 7 }); }
    runner('rat', t, lerp(860, 1500, ss(seg(lt, .8, 3.3))), 900, .55, 1);
    snow(t, 1.1);
    GRADE = NIGHT_LANE(t);
  },
  // trucking pan along the lane: the buns roll, the newsboy runs and stretches to catch each one on a note
  s27(t, lt) {
    const camx = lerp(1300, 3100, ss(seg(lt, 0, 5.6))); setCam({ x: camx, y: 680, z: .8 }); bg('lane');
    const bx = lerp(1250, 3200, lt / 5.833);
    for (let i = 0; i < 8; i++) { const ct = 5 / 6 + i * .625; if (lt > ct) continue; const x = bx + 180 + i * 90 - (i * 30), y = 900 - Math.abs(Math.sin(lt * 7 + i)) * 30; C.bun(x, y, 1.0, { rot: lt * 8 + i, best: i === 7 }); }
    const c0 = 5 / 6 - .2; const caught = Math.min(7, Math.max(0, Math.floor((lt - 5 / 6) / .625) + 1));
    const reach = ((lt - c0) % .625) < .25 && lt > c0 && lt < c0 + 7 * .625;
    runner('boy', t, bx, 900, 1.0, 1, { reach, caught });
    runner('rat', t, bx + 420, 900, .5, 1);
    snow(t, 1);
    GRADE = NIGHT_LANE(t);
  },
  // the rat skids on the ice, spins, flees; the best bun pops out of its grip into the boy's hands
  s28(t, lt) {
    setCam({ x: 3300, y: 720, z: 1.0 }); bg('lane');
    const sp = ss(seg(lt, .3, 1.0));
    C.rat({ x: lerp(3300, 3420, sp) + (lt > 1.2 ? (lt - 1.2) * 900 : 0), y: 900, k: .6, ex: lt < 1.2 ? 'scared' : 'squeeze', tail: 'whip', t, lean: lt < 1.0 ? Math.sin(lt * 30) * .4 : 0, mirror: lt > 1.2 ? 0 : (Math.floor(lt * 10) % 2) });
    if (lt < 1.4) { const k = seg(lt, .4, 1.4); C.bun(lerp(3360, 3120, k), 820 - Math.sin(k * Math.PI) * 180, 1.0, { best: true, rot: k * 8 }); }
    C.boy({ x: 3080, y: 900, k: 1.25, ex: lt > 1.4 ? 'joy' : 'surprised', scarf: t, arms: [{ x: -50, y: -100, hand: 'open', front: true }, { x: 60, y: -104, hand: 'open', front: true }] });
    stackInArms(3080, 900, 1.25, Math.min(8, lt > 1.4 ? 8 : 7));
    snow(t, 1);
    GRADE = NIGHT_LANE(t);
  },
  // quiet: arms full of buns in the empty lane; breath cloud; snow; the shop window glows behind
  s29(t, lt) {
    setCam({ x: 1700, y: 660, z: 1.1 }); bg('lane');
    C.boy({ x: 1700, y: 900, k: 1.3, ex: lt < 1.5 ? 'resolve' : 'hungry', scarf: 0, scarfDroop: .5, arms: [{ x: -50, y: -100, hand: 'open', front: true }, { x: 60, y: -104, hand: 'open', front: true }] });
    stackInArms(1700, 900, 1.3, 8);
    if (lt > .6 && lt < 2.2) { const k = seg(lt, .6, 2.2); push(); shape(ell(1640 - k * 80, 560 - k * 30, 30 + k * 40, 20 + k * 26), { fill: P.pale, lw: T.S.lw * .6, alpha: 1 - k }); pop(); }
    snow(t, .9, .1);
    GRADE = NIGHT_LANE(t);
  },
  // the held close-up: the last warm bun steams under his nose; glances on woodblock ticks; then the choice
  s30(t, lt) {
    const z = lerp(2.2, 2.55, lt / 6); setCam({ x: 1700, y: 680, z }); bg('lane');
    const g1 = lt < 1.2 ? 'tempted' : lt < 1.95 ? { ...C.EX.torn, eyes: { type: 'open', lx: -.9 } } : lt < 2.7 ? { ...C.EX.tempted, eyes: { type: 'open', lx: .1, ly: .7 } } : lt < 3.6 ? { ...C.EX.torn, eyes: { type: 'open', lx: -.9, ly: -.2 } } : lt < 4.6 ? 'sad' : 'resolve';
    C.boy({ x: 1700, y: 900, k: 1.3, ex: g1, scarf: 0, scarfDroop: lt < 4.6 ? 1 : 0, arms: [{ x: -40, y: -128, hand: 'open', front: true }, { x: 40, y: -130, hand: 'open', front: true }] });
    C.bun(1700, 900 - 132 * 1.3, 1.25, { best: true });
    push(); translate(1700 + 90, 900 - 160 * 1.3); steam(0, 0, 'lazy', t, .55); pop();
    snow(t, .5, .05);
    GRADE = { exp: .7, lights: [{ x: 1700, y: 560, r: 300, a: .18 }] };
  },
  // insert: the bun's steam curls up toward the lit shop
  s31(t, lt) {
    setCam({ x: 1500, y: 560, z: 1.6 }); bg('lane');
    C.bun(1700, 640, 1.5, { best: true });
    push(); stroke(spline([[1700, 580], [1660, 520], [1600, 500], [1520, 520], [1440, 560], [1360, 590]].map((p, i) => [p[0], p[1] + Math.sin(t * 3 + i) * 8]), false, 6), T.S.lw * 1.6); pop();
    snow(t, .6);
    GRADE = NIGHT_LANE(t);
  },
  // full: he walks to the door (sad-small steps → firm) and knocks twice
  s32(t, lt) {
    setCam({ x: 1000, y: 660, z: 1.05 }); bg('lane');
    const x = lerp(1500, 1040, ss(seg(lt, 0, 1.8))), st = Math.floor(lt * 2.4) % 2;
    const knock = [2.0, 2.35].some(k => lt >= k && lt < k + .12);
    C.boy({ x, y: 900, k: 1.25, mirror: 1, ex: 'resolve', scarf: t * .3, legs: lt < 1.8 ? [{ x: -26 + st * 16, y: -st * 10 }, { x: 26 - st * 16, y: -(1 - st) * 10 }] : null, arms: [{ x: -50, y: -100, hand: 'open', front: true }, knock ? { x: 160, y: -240, hand: 'fist', front: true } : { x: 60, y: -104, hand: 'open', front: true }] });
    stackInArms(x, 900, 1.25, 8, 1);
    if (knock) { push(); translate(960, 640); for (let i = 0; i < 3; i++) stroke([[30 + i * 10, -30 + i * 30], [60 + i * 14, -40 + i * 30]], T.S.lw * .8); pop(); }
    snow(t, .8);
    GRADE = NIGHT_LANE(t);
  },
  // the doorway two-shot: the door opens, the kitchen peeks out; he hands every bun back
  s33(t, lt) {
    setCam({ x: 960, y: 690, z: 1.2 }); bg('lane');
    push(); shape(rect(740, 470, 220, 430), { fill: P.dark }); shape([[740, 470], [690, 440], [690, 930], [740, 900]], { fill: P.mid }); pop();
    const peek = ss(seg(lt, .2, .9));
    C.kettle({ x: 850, y: 900, k: .62, ex: 'surprised', steam: 'lazy', t });
    C.pin({ x: 800, y: 700 + (1 - peek) * 60, k: .5, ex: 'surprised', roll: 0 });
    C.cleaver({ x: 920, y: 760 + (1 - peek) * 80, k: .42, ex: 'surprised', arms: [{ x: -80, y: -120, hand: 'open', hk: .9 }, { x: 140, y: -60, hand: 'open', hk: .9 }] });
    const n = 8 - Math.min(8, Math.max(0, Math.floor((lt - 1.0) / .33)));
    C.boy({ x: 1140, y: 900, k: 1.25, mirror: 1, ex: lt > 2.6 ? 'joy' : 'resolve', scarf: t * .4, arms: [{ x: -50, y: -100, hand: 'open', front: true }, { x: 90, y: -120, hand: 'open', front: true }] });
    stackInArms(1140, 900, 1.25, n, 1);
    for (let i = 0; i < 8; i++) { const ph = (lt - 1.0 - i * .33) / .3; if (ph > 0 && ph < 1) C.bun(lerp(1080, 960, ph), lerp(780, 800, ph) - Math.sin(ph * Math.PI) * 60, .9, { best: i === 7 }); }
    // the warm doorway light
    GRADE = { exp: .7, lights: [{ x: 850, y: 700, r: 360, a: .4 }, { x: LANE.lampX, y: 150, r: 380, a: .3 }] };
    snow(t, .6);
  },
  // close-up: the kettle sheds a tear of steam and slips him the best bun
  s34(t, lt) {
    setCam({ x: 900, y: 800, z: 2.2 }); bg('lane');
    push(); shape(rect(740, 470, 220, 430), { fill: P.dark }); pop();
    const give = ss(seg(lt, 1.2, 2.0));
    C.kettle({ x: 860, y: 900, k: .62, ex: 'teary', steam: lt < 1.2 ? 'sad' : 'heart', t, arms: [{ x: -100, y: -70, hand: 'open', hk: .85 }, { x: lerp(110, 190, give), y: -150, hand: 'open', hk: .85 }] });
    C.bun(lerp(930, 980, give), lerp(800, 790, give), .9, { best: true });
    GRADE = { exp: .75, lights: [{ x: 860, y: 780, r: 320, a: .4 }] };
  },
  // inside, the shelf: the pin and cleaver wind the stopped clock (ratchet); the clock wakes
  s35(t, lt) {
    setCam({ x: 610, y: 400, z: 2.3 });
    kitchen(t, { amp: .02, noPin: 1, noCleaver: 1 });
    const w = lt > .8 && lt < 2.6, turn = w ? (lt - .8) * 10 : 0;
    C.pin({ x: 470, y: 470, k: .45, ex: 'determined', roll: turn * .2, tilt: Math.sin(turn) * .15 });
    C.cleaver({ x: 780, y: 470, k: .34, ex: 'determined', arms: [{ x: -80, y: -120, hand: 'open', hk: .9 }, { x: -180 + Math.sin(turn) * 10, y: -170 + Math.cos(turn) * 10, hand: 'grab', hk: .9 }] });
    GRADE = NIGHT_KIT(t);
  },
  // insert: the hands spin 4 → 6; dawn floods the window, the whole frame lightens
  s36(t, lt) { setCam({ x: 600, y: 380, z: 2.4 }); kitchen(t, { amp: .03 }); GRADE = NIGHT_KIT(t); },
  // close-up: RING
  s37(t, lt) { setCam({ x: 600, y: 360, z: 2.9 }); kitchen(t, { amp: 0 }); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + lt; stroke([[600 + Math.cos(a) * 90, 300 + Math.sin(a) * 90], [600 + Math.cos(a) * 120, 300 + Math.sin(a) * 120]], T.S.lw); } GRADE = NIGHT_KIT(t); },
  // close-up: Wang wakes — the big take
  s38(t, lt) {
    setCam({ x: 900, y: 700, z: 2.0 }); kitchen(t, { noWang: 1, amp: .04 });
    const k = lt < .2 ? 0 : 1, pop_ = lt > .2 && lt < .45 ? 1.18 : 1;
    C.wang({ x: 880, y: 1180, k: 1.3, ex: lt < .2 ? 'asleep' : lt < 1.2 ? 'surprised' : 'joy', must: lt < .2 ? -.8 : 1, cap: lt > .2 && lt < .6 ? -1 : 0, sy: pop_, sx: 2 - pop_, head: lt < .2 ? { rot: .25, dy: 30, dx: 24 } : { dy: -30 * (pop_ - 1) * 4 }, arms: lt < .2 ? null : [{ x: -150, y: -330, hand: 'open' }, { x: 150, y: -330, hand: 'open' }] });
    // the perfect buns, steaming, on the table
    for (let i = 0; i < 4; i++) C.bun(1080 + i * 80, 958, .9);
    GRADE = NIGHT_KIT(t);
  },
  // morning two-shot at the door: Wang with a tray of buns, the honest boy; a second bun and a pat on the cap
  s39(t, lt) {
    setCam({ x: 1000, y: 660, z: 1.15 }); bg('lane');
    push(); shape(rect(740, 470, 220, 430), { fill: P.pale }); pop();
    const give = ss(seg(lt, 1.0, 1.6)), pat = lt > 2.0 && lt < 2.8;
    C.wang({ x: 860, y: 900, k: .95, ex: lt < 1.0 ? 'tender' : 'joy', must: 1, arms: [{ x: lerp(60, 180, give), y: -230, hand: 'open', front: true }, pat ? { x: 300, y: -330 + Math.sin(lt * 30) * 10, hand: 'open', front: true } : { x: 110, y: -150, hand: 'open' }] });
    C.bun(860 + lerp(60, 180, give) * .95 + 20, 900 - 245 * .95, .8, {});
    C.boy({ x: 1180, y: 900, k: 1.2, mirror: 1, ex: lt < 1.2 ? 'surprised' : 'joy', scarf: t, capTilt: pat ? Math.sin(lt * 30) * .1 : 0, arms: [{ x: -40, y: -150, hand: 'open', front: true }, { x: 80, y: -200, hand: 'open', front: true }] });
    C.bun(1180 - 50 * 1.2, 900 - 210 * 1.2, .8, { best: true });
    GRADE = MORNING_LANE(t);
  },
  // the morning lane: the boy runs, waving a newspaper (trucking)
  s40(t, lt) {
    const x = lerp(1400, 3000, lt / (10 / 3)); setCam({ x, y: 650, z: .95 }); bg('lane');
    runner('boy', t, x, 900, 1.15, 1, { paper: 1 });
    GRADE = MORNING_LANE(t);
  },
  // insert: the headline prints itself
  s41(t, lt) {
    setCam({ x: 960, y: 540, z: 1 }); T.BASE.splice(0, 6, 1, 0, 0, 1, 0, 0); T.reset();
    sg.save(); sg.setTransform(1, 0, 0, 1, 0, 0); sg.fillStyle = P.mid; sg.fillRect(GATE.x, 0, GATE.w, 1080); sg.restore();
    push(); translate(960, 560); rotate(-.04 + Math.sin(lt * 2) * .01);
    shape(rect(-560, -380, 1120, 760), { fill: P.paper });
    for (let i = 0; i < 10; i++) shape(rect(-500 + (i % 2) * 520, 60 + Math.floor(i / 2) * 56, 460, 12), { fill: P.light, stroke: false });
    shape(rect(-500, -330, 1000, 60), { fill: P.ink }); pop();
    sg.save(); sg.setTransform(1, 0, 0, 1, 0, 0); sg.translate(960, 560); sg.rotate(-.04 + Math.sin(lt * 2) * .01); sg.font = '44px XiaoWei'; sg.fillStyle = P.white; sg.textAlign = 'center'; sg.textBaseline = 'middle'; sg.fillText('申 江 晨 报', 0, -300); sg.restore();
    const n = Math.min(8, Math.floor(lt / .2) + 1);
    const R = fat('王记包子 开门啦！', 960, 470, 120, { scale: i => i < n ? 1 : 0 });
    TXT.push({ id: 'headline', text: '王记包子 开门啦！', ...R });
  },
  // pull-back to a packed medium-full: the queue at the shop, swinging on the beat
  s42(t, lt) {
    const z = lerp(1.6, .85, ss(seg(lt, 0, 1.8))); setCam({ x: 1150, y: 640, z }); bg('lane');
    push(); shape(rect(740, 470, 220, 430), { fill: P.pale }); pop();
    const br = breath(t, .08), b = beats(tq(t)), sw = Math.sin(Math.PI * b) * .08;
    const Qs = [['old', 1350], ['lady', 1520], ['worker', 1690], ['lady', 1860]];
    Qs.slice().reverse().forEach(([v, x], i) => C.neighbour({ x, y: 900, k: .9, v, ex: 'happy', lean: sw * (i % 2 ? 1 : -1), sx: br.sx, sy: br.sy }));
    C.wang({ x: 860, y: 900, k: .95, ex: 'joy', must: 1, lean: sw, sx: br.sx, sy: br.sy, arms: [{ x: 160, y: -240, hand: 'open', front: true }, { x: -120, y: -200, hand: 'open' }] });
    for (let i = 0; i < 3; i++) C.bun(860 + 140 + i * 40, 900 - 250, .6);
    C.boy({ x: 1130, y: 900, k: 1.1, ex: 'joy', scarf: t, lean: -sw, arms: [{ x: 80, y: -330 + Math.sin(TAU * b) * 20, hand: 'grab', front: true }, { x: -60, y: -120, hand: 'open' }] });
    newspaper(1130 + 80 * 1.1, 900 - 360 * 1.1, .7, Math.sin(TAU * b) * .2);
    GRADE = MORNING_LANE(t);
  },
  // final gag: the rat in an apron kneads at the table in time with the band, winks
  s43(t, lt) {
    setCam({ x: 1150, y: 870, z: 1.9 }); kitchen(t, { noWang: 1, noDough: 1, amp: .08 });
    const b = beats(tq(t)), k = Math.floor(b) % 2;
    shape(spline([[1080, 962], [1090, 928 - k * 8], [1150, 914 + k * 6], [1210, 928 - k * 8], [1220, 962]], true, 6), { fill: P.white });
    C.rat({ x: 1150, y: 960, k: .62, apron: 1, ex: lt > 3.4 ? 'wink' : 'happy', tail: 'curl', arms: [{ x: -40, y: -50 + k * 20, hand: 'fist', front: true }, { x: 50, y: -50 + (1 - k) * 20, hand: 'fist', front: true }], sy: 1 + (k ? .06 : -.04) });
    GRADE = { exp: 1, lights: [{ x: KIT.window.x + 190, y: 410, r: 700, a: .35 }] };
  },
  // the dough rises into 「完」; the iris closes on it
  s44(t, lt) {
    setCam({ x: 1150, y: 870, z: 1.9 }); kitchen(t, { noWang: 1, noDough: 1, amp: .08 });
    C.rat({ x: 1010, y: 960, k: .62, apron: 1, ex: 'joy', tail: 'curl', arms: [{ x: 80, y: -170, hand: 'open', front: true }, { x: -50, y: -60, hand: 'open' }] });
    GRADE = { exp: 1, lights: [{ x: KIT.window.x + 190, y: 410, r: 700, a: .35 }] }; applyGrade(); GRADE = null;
    const k = ss(seg(lt, .3, 1.1));
    const R = fat('完', 1060 + 0, 560 - k * 60, 300 * (.3 + .7 * k), { face: P.white });
    if (lt > .5) TXT.push({ id: 'end', text: '完', ...R });
    const r = lt < 1.5 ? 1200 : lerp(1200, 0, ei(seg(lt, 1.5, 2.3)));
    iris(1060, 500, r);
  },
};
// a runner: windmill legs, lean, speed lines; who = 'rat' | 'boy'
function runner(who, t, x, y, k, dir, o = {}) {
  const ph = t * (who === 'rat' ? 3.2 : 2.4) * TAU, R = who === 'rat' ? 16 : 30;
  const legs = [{ x: Math.cos(ph) * R, y: -Math.max(0, Math.sin(ph)) * R }, { x: Math.cos(ph + Math.PI) * R, y: -Math.max(0, Math.sin(ph + Math.PI)) * R }];
  for (let i = 0; i < 4; i++) { const yy = y - 60 * k - i * 40 * k; push(); stroke([[x - dir * (80 + i * 30) * k, yy], [x - dir * (180 + i * 40) * k, yy]], T.S.lw * .6); pop(); }
  if (who === 'rat') C.rat({ x, y, k, mirror: dir < 0 ? 1 : 0, lean: .25 * dir, ex: 'happy', tail: 'whip', t, legs, arms: [{ x: -50, y: -100, hand: 'grab', hk: .7 }, { x: 60, y: -130, hand: 'grab', hk: .7 }] });
  if (who === 'rat' && t < SEQ.spill + 2.5) C.bun(x + dir * 40 * k, y - 140 * k, .6 * k / .5, { best: true });
  if (who === 'boy') {
    const arms = o.reach ? [{ x: 280, y: -60, hand: 'grab', front: true, bend: -40 }, { x: -60, y: -160, hand: 'open' }] : o.paper ? [{ x: 60, y: -330, hand: 'grab', front: true }, { x: -70, y: -140, hand: 'open' }] : [{ x: 60, y: -160, hand: 'open', front: true }, { x: -60, y: -170, hand: 'open', front: true }];
    C.boy({ x, y, k, mirror: dir < 0 ? 1 : 0, lean: .2 * dir, ex: o.reach ? 'determined' : 'joy', scarf: t * 2, legs, arms });
    if (o.caught) stackInArms(x, y, k, o.caught);
    if (o.paper) newspaper(x + 60 * k, y - 360 * k, .7, Math.sin(t * 9) * .2);
  }
}
function stackInArms(x, y, k, n, mirror = 0) { for (let i = 0; i < n; i++) C.bun(x + ((i % 3) - 1) * 34 * k * (mirror ? -1 : 1), y - (100 + Math.floor(i / 3) * 26) * k, .55 * k, { best: i === 7 }); }
function newspaper(x, y, k, rot) { push(); translate(x, y); rotate(rot); scale(k); shape(rect(-70, -90, 140, 110), { fill: P.paper }); shape(rect(-60, -80, 120, 18), { fill: P.ink }); for (let i = 0; i < 4; i++) shape(rect(-60, -50 + i * 16, 120, 6), { fill: P.light, stroke: false }); pop(); }

// ———————————————— render ————————————————
const cutAt = shotList.map(s => s.t0);
function render(t) {
  t = clamp(t, 0, DUR - 1e-4);
  const s = shotAt(t), lt = t - s.t0;
  sg.setTransform(1, 0, 0, 1, 0, 0); sg.globalCompositeOperation = 'source-over'; sg.globalAlpha = 1; sg.fillStyle = '#000'; sg.fillRect(0, 0, 1920, 1080);
  T.init(F.scene); T.frame(t); TXT = []; GRADE = null;
  SHOTS[s.id](t, lt);
  applyGrade(); GRADE = null;
  // title cards (subtitles), popped on/off, bottom
  for (const c of CARDS) if (!c.hidden && t >= c.t0 && t < c.t1) { const R = card(c.text, c.y ?? 960); TXT.push({ id: 'card' + c.t0, text: c.text, ...R }); }
  const f = Math.round(t * 24), jump = cutAt.some(c => c > 0 && Math.round(c * 24) === f) ? 3 : 0;
  post(F, t, { jump });
}
window.DUR = DUR; window.render = render; window.EV = EV.sort((a, b) => a.t - b.t); window.SUBS = SUBS.sort((a, b) => a.t0 - b.t0);
window.TEXTS = t => { render(t); return TXT.map(x => ({ id: x.id, text: x.text, x0: x.x0, y0: x.y0, x1: x.x1, y1: x.y1 })); };
window.TIMELINE = { dur: DUR, shots: shotList, sections: SECT, hits: HITS };
window.READY = true;
