// 2D overlay: chapter cards, the title, dialogue boxes with portraits, fades. Also window.TEXTS for readcheck.
import { SHOTS, T, LINES, TITLE, DUR, shotAt } from './timeline.js';
import { portrait } from './portraits.js';
import { clamp, seg, ss } from '/core/lib.js';

const cv = document.getElementById('ov'), g = cv.getContext('2d');
const W = 1920, H = 1080;
const COPPER = '#d9a46a', COPPER2 = '#b8793f', PAPER = '#f4ecdc', INKC = '#160e0c';
const CJK = "'Noto Serif SC'";

export async function overlayReady() {
  await Promise.all([`500 40px ${CJK}`, `700 40px ${CJK}`, '500 40px Cinzel', '500 40px "Cormorant Garamond"'].map(f => document.fonts.load(f)));
  for (const L of LINES) portrait(L.face);
}
function spaced(text, x, y, sp) { const ws = [...text].map(c => g.measureText(c).width), tot = ws.reduce((a, b) => a + b, 0) + sp * (ws.length - 1); let cx = x - tot / 2; [...text].forEach((c, i) => { g.fillText(c, cx + ws[i] / 2, y); cx += ws[i] + sp; }); return tot; }
function glowText(fn, col, blur) { g.save(); g.shadowColor = col; g.shadowBlur = blur; fn(); g.restore(); fn(); }
// thin copper rule with a small lozenge
function rule(cx, y, w, a) {
  g.save(); g.globalAlpha = a; g.lineWidth = 1.5;
  for (const s of [-1, 1]) { const gr = g.createLinearGradient(cx, 0, cx + s * w, 0); gr.addColorStop(0, 'rgba(217,164,106,1)'); gr.addColorStop(1, 'rgba(217,164,106,0)'); g.strokeStyle = gr; g.beginPath(); g.moveTo(cx + s * 14, y); g.lineTo(cx + s * w, y); g.stroke(); }
  g.fillStyle = COPPER; g.beginPath(); g.moveTo(cx, y - 6); g.lineTo(cx + 6, y); g.lineTo(cx, y + 6); g.lineTo(cx - 6, y); g.closePath(); g.fill();
  g.restore();
}

// —— Chapter card: warm ink, a Roman numeral in Cinzel above the two characters, a copper rule ——
function chapterCard(t, shot) {
  const lt = t - shot.a, L = shot.b - shot.a;
  const a0 = ss(seg(lt, .15, .7)), out = 1 - ss(seg(lt, L - .55, L - .05));
  const bg = g.createRadialGradient(W / 2, H / 2, 60, W / 2, H / 2, 1100); bg.addColorStop(0, '#2a1a14'); bg.addColorStop(1, '#0c0705');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.globalAlpha = a0 * out; g.fillStyle = COPPER; g.font = '500 30px Cinzel'; spaced(shot.num, W / 2, 446, 8);
  rule(W / 2, 490, 200 * (.4 + .6 * a0), a0 * out);
  g.fillStyle = PAPER; g.font = `500 76px ${CJK}`;
  glowText(() => spaced(shot.card, W / 2, 566 - (1 - a0) * 8, 28), 'rgba(255,190,120,.35)', 22);
  g.globalAlpha = 1;
}

// —— Title over the dawn wide ——
function title(t) {
  const a = ss(seg(t, T.title, T.title + .7)) * (1 - ss(seg(t, T.titleOut, T.titleOut + .5)));
  if (a <= 0) return;
  g.save(); g.textAlign = 'center'; g.textBaseline = 'middle';
  // a soft dark plate behind the characters so they read on the sky
  const y = 300; g.globalAlpha = a * .45; const pl = g.createLinearGradient(0, y - 120, 0, y + 130); pl.addColorStop(0, 'rgba(10,6,4,0)'); pl.addColorStop(.5, 'rgba(10,6,4,.8)'); pl.addColorStop(1, 'rgba(10,6,4,0)'); g.fillStyle = pl; g.fillRect(0, y - 120, W, 250);
  g.globalAlpha = a; g.font = `700 104px ${CJK}`;
  const gr = g.createLinearGradient(0, y - 60, 0, y + 60); gr.addColorStop(0, '#fff6e2'); gr.addColorStop(.6, '#efd9a8'); gr.addColorStop(1, '#c9975a');
  g.fillStyle = gr; glowText(() => spaced(TITLE, W / 2, y, 22), 'rgba(255,200,120,.5)', 36);
  rule(W / 2, y + 88, 300 * (.3 + .7 * a), a);
  g.restore();
}

// —— Dialogue box: dark plate, copper frame with lozenge corners, name plate, portrait, typed text, caret ——
const BW = 1240, BH = 232, BX = (W - BW) / 2, BY = H - BH - 64;
function lineAlpha(t, L) { return ss(seg(t, L.t, L.t + .3)) * (1 - ss(seg(t, L.out - .3, L.out))); }
function dialog(t, L) {
  const a = lineAlpha(t, L); if (a <= 0) return;
  const y = BY + (1 - a) * 12;
  g.save(); g.globalAlpha = a;
  const bgr = g.createLinearGradient(0, y, 0, y + BH); bgr.addColorStop(0, 'rgba(26,16,12,.84)'); bgr.addColorStop(1, 'rgba(12,7,5,.9)');
  g.fillStyle = bgr; g.fillRect(BX, y, BW, BH);
  g.strokeStyle = 'rgba(217,164,106,.92)'; g.lineWidth = 2; g.strokeRect(BX + .5, y + .5, BW - 1, BH - 1);
  g.strokeStyle = 'rgba(217,164,106,.35)'; g.lineWidth = 1; g.strokeRect(BX + 7.5, y + 7.5, BW - 15, BH - 15);
  for (const [cx, cy] of [[BX, y], [BX + BW, y], [BX, y + BH], [BX + BW, y + BH]]) { g.fillStyle = COPPER; g.beginPath(); g.moveTo(cx, cy - 7); g.lineTo(cx + 7, cy); g.lineTo(cx, cy + 7); g.lineTo(cx - 7, cy); g.fill(); }
  // portrait (96 px canvas at 2×)
  const pc = portrait(L.face), px = BX + 26, py = y + 20, ps = 192;
  g.fillStyle = 'rgba(8,5,4,.9)'; g.fillRect(px - 2, py - 2, ps + 4, ps + 4);
  g.imageSmoothingEnabled = false; g.drawImage(pc, px, py, ps, ps); g.imageSmoothingEnabled = true;
  g.strokeStyle = 'rgba(217,164,106,.8)'; g.lineWidth = 1.5; g.strokeRect(px - 1.5, py - 1.5, ps + 3, ps + 3);
  // name plate
  g.font = `700 32px ${CJK}`; g.textAlign = 'left'; g.textBaseline = 'middle';
  const nw = g.measureText(L.who).width + 52, nx = px + ps + 30;
  g.fillStyle = COPPER; g.fillRect(nx, y - 24, nw, 48); g.fillStyle = COPPER2; g.fillRect(nx, y + 20, nw, 4);
  g.fillStyle = INKC; g.fillText(L.who, nx + 26, y + 1);
  // typed text: ~22 characters per second after the box has opened; the full text is what TEXTS reports
  const n = [...L.text].length, shown = Math.min(n, Math.floor(Math.max(0, t - L.t - .2) * 22));
  g.font = `500 46px ${CJK}`; g.fillStyle = PAPER; g.textBaseline = 'middle';
  g.fillText([...L.text].slice(0, shown).join(''), nx + 2, y + 112);
  if (shown >= n && Math.floor(t * 2.5) % 2 === 0) { g.fillStyle = COPPER; const tx = BX + BW - 54, ty = y + BH - 36; g.beginPath(); g.moveTo(tx - 9, ty - 5); g.lineTo(tx + 9, ty - 5); g.lineTo(tx, ty + 6); g.fill(); }
  g.restore();
}

// —— Fades: into and out of every chapter card, and the end ——
function blackout(t) {
  let a = 0;
  for (const s of SHOTS) if (s.card) { a = Math.max(a, ss(seg(t, s.a - .45, s.a))); a = Math.max(a, 1 - ss(seg(t, s.b, s.b + .6))); }
  a = Math.max(a, ss(seg(t, T.fade, DUR - .1)));
  if (a > 0) { g.fillStyle = `rgba(12,7,5,${a})`; g.fillRect(0, 0, W, H); }
}
export function drawOverlay(t) {
  const shot = shotAt(t);
  g.clearRect(0, 0, W, H);
  if (shot.card) { chapterCard(t, shot); blackout(t); return; }
  for (const L of LINES) dialog(t, L);
  title(t);
  blackout(t);
}
// readcheck contract: every text on screen with its box
export function texts(t) {
  const shot = shotAt(t), out = [];
  if (shot.card) { const lt = t - shot.a; if (lt > .15 && lt < shot.b - shot.a - .05) out.push({ id: shot.id, text: shot.card, x0: W / 2 - 200, y0: 500, x1: W / 2 + 200, y1: 640 }); return out; }
  for (const L of LINES) if (t >= L.t && t < L.out) out.push({ id: L.id, text: L.text, x0: BX, y0: BY, x1: BX + BW, y1: BY + BH });
  if (t >= T.title && t < T.titleOut) out.push({ id: 'title', text: TITLE, x0: W / 2 - 400, y0: 230, x1: W / 2 + 400, y1: 370 });
  return out;
}
