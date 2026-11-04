// 《中秋的灯》: the page contract. One timeline (timeline.mjs) drives the shots, the subtitles and the events.
// ?from=a&to=b renders a span; ?nosub=1 hides the subtitles.
import { ss, seg, clamp } from '/core/lib.js';
import { W, H } from './engine.js';
import { cv } from './paper.js';
import * as T from './timeline.mjs';
import { SHOT } from './shots.js';

const Q = new URLSearchParams(location.search);
const FROM = Q.has('from') ? +Q.get('from') : 0, TO = Q.has('to') ? +Q.get('to') : T.DUR;
window.DUR = +(TO - FROM).toFixed(3);
const canvas = document.getElementById('c'); canvas.width = W; canvas.height = H;
const ctx = canvas.getContext('2d');
await Promise.all([document.fonts.load('40px MaShanZheng', '中秋的灯八月十五石崖渔村月'), document.fonts.load('500 40px NotoSerifSC', '大雾船只岸上有灯')]);

const plan = T.SHOTS.map(([id, start, tr]) => ({ id, start, tr }));
plan.forEach((s, i) => { s.end = i + 1 < plan.length ? plan[i + 1].start : T.DUR; });
const live = new Map();
function get(i) { const p = plan[i]; if (!live.has(p.id)) live.set(p.id, SHOT[p.id](p)); return live.get(p.id); }
const fA = cv(W, H), fB = cv(W, H);
function draw(i, t, target) { const s = get(i); s.update(t); s.S.render(target, t, { grade: s.grade ? s.grade(t) : undefined }); }

const sub = document.getElementById('sub'), zh = sub.querySelector('.zh');
export function R(t) {
  let i = plan.findIndex(p => t >= p.start && t < p.end); if (i < 0) i = plan.length - 1;
  const p = plan[i], tl = t - p.start;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
  if (i > 0 && p.tr === 'dissolve' && tl < T.DISSOLVE) {
    draw(i - 1, t, fA); draw(i, t, fB);
    ctx.drawImage(fA, 0, 0); ctx.globalAlpha = ss(tl / T.DISSOLVE); ctx.drawImage(fB, 0, 0); ctx.globalAlpha = 1;
  } else if (i > 0 && p.tr === 'curtain' && tl < 1.0) {   // a near sheet sweeps across: the new shot is revealed behind a soft edge moving right → left
    draw(i - 1, t, fA); draw(i, t, fB);
    ctx.drawImage(fA, 0, 0);
    const u = ss(tl / 1.0), edge = W * (1.15 - u * 1.3);
    const g = ctx.createLinearGradient(edge - 260, 0, edge + 60, 0); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    const m = cv(W, H), mx = m.getContext('2d'); mx.drawImage(fB, 0, 0); mx.globalCompositeOperation = 'destination-in'; mx.fillStyle = g; mx.fillRect(0, 0, W, H);
    ctx.drawImage(m, 0, 0);
    const fg = ctx.createLinearGradient(edge - 200, 0, edge + 80, 0); fg.addColorStop(0, 'rgba(150,165,185,0)'); fg.addColorStop(.6, 'rgba(150,165,185,.55)'); fg.addColorStop(1, 'rgba(150,165,185,0)');
    ctx.fillStyle = fg; ctx.fillRect(0, 0, W, H);
  } else { draw(i, t, canvas); }
  // fade in at the very start and out at the end
  const fade = Math.min(ss(seg(t, 0, .6)), 1 - ss(seg(t, T.HIT.fade, T.DUR - .2)));
  if (fade < .999) { ctx.fillStyle = `rgba(0,0,0,${1 - fade})`; ctx.fillRect(0, 0, W, H); }
  // subtitles
  let c = null, a = 0;
  for (const q of T.CUES) if (t > q.t0 && t < q.t1) { c = q; a = Math.min(ss(seg(t, q.t0, q.t0 + .25)), 1 - ss(seg(t, q.t1 - .25, q.t1))); }
  zh.textContent = c ? c.text.replace(/[，。]$/, '') : ''; sub.style.opacity = Q.has('nosub') ? 0 : a;
  const s = get(i); sub.style.bottom = (s.subBottom ? s.subBottom(t) : 64) + 'px';
}
window.render = t => R(FROM + t);
// sound / cue events for events.mjs (the mixer reads timeline.json; this is the same information, for the record)
window.EV = Object.entries(T.HIT).flatMap(([k, v]) => (Array.isArray(v) ? v.map((t, i) => ({ t, type: k, i })) : [{ t: v, type: k }])).sort((a, b) => a.t - b.t);
// every paper text on screen at t, for readcheck
window.TEXTS = t => {
  const out = [];
  for (const s of T.STRIPS) {
    if (t + FROM < s.t0 || t + FROM > s.t1) continue;
    const i = plan.findIndex(p => t + FROM >= p.start && t + FROM < p.end); if (i < 0) continue;
    const sh = get(i); if (!sh.textBox) continue; const b = sh.textBox(s.id, t + FROM); if (!b) continue;
    out.push({ id: s.id, text: s.text, x0: b[0], y0: b[1], x1: b[2], y1: b[3] });
  }
  return out;
};
window.READY = true;
