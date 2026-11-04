// 愚公移山 — assembly: timeline → shots, captions in the margin, sound events, reading boxes
import * as WC from './engine/index.js';
import * as ST from './stage.js';
import { clamp } from '/core/lib.js';

const W = 1920, H = 1080;
export let DUR = 145, EV = [], CAPS = [], SHOTS = [];
export const BUF = [];
let TL;

export function buildTimeline(T) {
  let t = 0; const shots = [], secs = [];
  for (const s of T.secs) {
    const bl = 60 / s.bpm, t0 = t; let b = 0;
    for (const [id, nb] of s.shots) { shots.push({ id, sec: s.id, t0: t, t1: t + nb * bl, beat0: b, nb, bpm: s.bpm, bl }); t += nb * bl; b += nb; }
    secs.push({ id: s.id, name: s.name, bpm: s.bpm, t0, t1: t, beats: b });
  }
  const by = Object.fromEntries(shots.map(s => [s.id, s]));
  const caps = T.caps.map(([sid, o, d, text]) => ({ t0: by[sid].t0 + o, t1: by[sid].t0 + o + d, text }));
  return { shots, secs, caps, by, dur: t + T.tail };
}

export async function init(g, qs) {
  TL = buildTimeline(await (await fetch('timeline.json')).json());
  DUR = TL.dur; CAPS = TL.caps;
  for (let i = 0; i < 3; i++) BUF.push(WC.canvas(W, H));
  const A = await import('./shotsA.js'), B = await import('./shotsB.js');
  const DEF = { ...A.SHOTS, ...B.SHOTS };
  SHOTS = TL.shots.map((s, i) => ({ ...s, idx: i, ...(DEF[s.id] || DEF._missing) }));
  SHOTS[SHOTS.length - 1].t1 = DUR;
  EV = [];
  for (const s of SHOTS) { EV.push({ t: s.t0, type: 'cut', id: s.id, sec: s.sec }); if (s.ev) for (const e of s.ev(s)) EV.push({ ...e, t: s.t0 + e.lt, shot: s.id }); }
  for (const c of CAPS) EV.push({ t: c.t0, type: 'cap', text: c.text });
  for (const s of TL.secs) EV.push({ t: s.t0, type: 'sec', id: s.id, bpm: s.bpm, beats: s.beats, t1: s.t1 });
  EV.sort((a, b) => a.t - b.t);
}
export const shotAt = t => SHOTS.find(s => t >= s.t0 && t < s.t1) || SHOTS[SHOTS.length - 1];
export const shotById = id => SHOTS.find(s => s.id === id);
export function captionAt(t) {
  for (const s of CAPS) if (t >= s.t0 && t < s.t1) return { text: s.text, a: Math.min(clamp((t - s.t0) / .1), 1 - clamp((t - (s.t1 - .15)) / .15)) };
  return null;
}
export function TEXTS(t) {
  const out = [];
  for (const s of CAPS) if (t >= s.t0 && t < s.t1) out.push({ id: 'cap' + s.t0.toFixed(2), text: s.text, ...box(ST.CAP_BOX(s.text)) });
  const sh = shotAt(t);
  if (sh.texts) for (const x of sh.texts(t - sh.t0, sh)) out.push(x);
  return out;
}
const box = ([x0, y0, x1, y1]) => ({ x0, y0, x1, y1 });

export function render(g, t) {
  g.setTransform(1, 0, 0, 1, 0, 0);
  const s = shotAt(t);
  s.draw(g, t - s.t0, t, s);
}
// ---------------------------------------------------------------- a printed plate
// cam: {x,y,z}; draw(m, c) inside the camera; o: { cap (default true), jolt, plateAmt, inkSeed, ground }
export function plate(g, t, lt, sh, cam, draw, o = {}) {
  ST.begin(cam, { ground: o.ground ?? '#000' });
  draw(ST.m, ST.c);
  ST.end();
  if (o.cap !== false) { const cp = captionAt(t); if (cp) ST.caption(cp.text, cp.a); }
  if (o.extra) o.extra(ST.m, ST.c);
  const hard = o.hard ?? true;
  return ST.print(g, { seed: 3, inkSeed: o.inkSeed ?? (sh.idx * 7 + 1), reg: hard ? ST.regJolt(lt) : [3, 2], jolt: hard ? ST.jolt(lt) : [0, 0], plateAmt: o.plateAmt ?? 1 });
}
// the inked block itself (full bleed, wood colour in the grooves). mirror: the block reads backwards
export function block(g, cam, draw, o = {}) {
  ST.begin(cam, { full: true });
  if (o.mirror) { ST.m.translate(ST.PW / 2, 0); ST.m.scale(-1, 1); ST.m.translate(-ST.PW / 2, 0); }
  draw(ST.m, ST.c);
  ST.end();
  return ST.print(g, { mode: 'block', sheen: o.sheen ?? .16, wetX: o.wetX ?? -1, grainAng: .03, seed: 5 });
}
