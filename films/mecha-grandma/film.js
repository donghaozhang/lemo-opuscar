// 《机甲外婆》 — film assembly: painted plates at load, the shot for time t (cel layers on the colour canvas g, light on
// the glow canvas e), tape accents (power-on, tracking noise), and the texts on screen (for readcheck and the .srt).
import { canvas, W, H } from './cel.js';
import * as PL from './plates.js';
import { DUR as D, SHOTS, shotAt, HIT, SEC, TXT } from './timeline.js';
import * as SA from './shotsA.js';
import * as SB from './shotsB.js';
import * as SC from './shotsC.js';
const mods = [SA, SB, SC];
const FN = Object.assign({}, ...mods);
export const DUR = D;
// —— plates (painted once) ——
const A = {};
{
  const st = PL.streetPlate(4800, 700, 3, 'night'); A.streetRaw = st; A.street = PL.smear(st, 16, 8); A.refl = PL.reflectPlate(A.street, 340, .8);
  A.sky = PL.skylinePlate(3840, 560, 9, 'night'); A.skyDawn = PL.skylinePlate(3840, 560, 5, 'dawn');
  A.far = PL.tallFar(3200); A.near = PL.tallNear(st, 3600);
  A.storm = PL.skyPlate('storm'); A.dawnSky = PL.skyPlate('dawn');
  A.tower = PL.towerPlate(4200, 'storm'); A.towerDawn = PL.towerPlate(4200, 'dawn');
}
let lastTexts = [];
export function renderFilm(g, e, ov, t) {
  const sh = shotAt(t), fn = FN[sh.name];
  const S = { t, lt: t - sh.t0, u: (t - sh.t0) / (sh.t1 - sh.t0), g, e, ov, A, sh };
  const over = fn ? (fn(S) || {}) : {};
  lastTexts = over.texts || [];
  const out = { ...over }; delete out.texts;
  // tape accents: power-on at the very start; tracking noise when the drone's scan locks on
  if (t < .6) out.power = Math.min(1, t / .6);
  const tr = HIT.lock; if (t >= tr - 1 / 48 && t < tr + 8 / 24) out.track = 1 - .5 * ((t - tr) * 24 / 8);
  return out;
}
// texts on screen at t: computed by drawing the shot into a scratch pair (cheap enough for readcheck)
const [sc1, sg1] = canvas(W, H), [sc2, sg2] = canvas(W, H), [sc3, sg3] = canvas(W, H);
const TEXT_SHOTS = new Set(['title', 'photo', 'chat', 'hud', 'oldPhoto', 'endCard', 'snap', 'apartment', 'arrive']);
export function texts(t) {
  const sh = shotAt(t); if (!TEXT_SHOTS.has(sh.name)) return [];
  for (const x of [sg1, sg2]) { x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, W, H); }
  const fn = FN[sh.name]; const over = fn ? (fn({ t, lt: t - sh.t0, u: (t - sh.t0) / (sh.t1 - sh.t0), g: sg1, e: sg2, ov: sg3, A, sh }) || {}) : {};
  return (over.texts || []).filter(b => b.x1 > 0 && b.x0 < W && b.y1 > 0 && b.y0 < H);
}
export function events() {
  const ev = [];
  for (const k in SEC) ev.push({ t: SEC[k].t0, type: 'section', name: k });
  for (const k in HIT) ev.push({ t: HIT[k], type: 'hit', name: k });
  for (const s of SHOTS) ev.push({ t: s.t0, type: 'cut', name: s.name });
  return ev.sort((a, b) => a.t - b.t);
}
