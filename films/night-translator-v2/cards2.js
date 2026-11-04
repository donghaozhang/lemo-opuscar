// v2 card designs (drawn straight into the 4:3 frame, not through Redraw). Each card returns its text boxes (film coords)
// so TEXTS can report exactly what is drawn.
import { decoBorder, intertitle, CARD_BG, CARD_FG } from './engine/cards.js';
import { grey } from './engine/ink.js';
import { END_LINES, ZH } from './cardspecs.js';
const FW = 1440, FH = 1080;
const H = n => { n = Math.sin(n * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); };
function fibre(g) { g.save(); g.globalAlpha = .06; for (let i = 0; i < 90; i++) { g.fillStyle = grey(.5 + H(i) * .3); g.fillRect(H(i + 7) * FW, H(i + 3) * FH, 1 + H(i) * 2, 1); } g.restore(); }
function text(g, s, font, x, y, o = {}) {
  g.save(); g.font = font; g.fillStyle = o.color ?? CARD_FG; g.textAlign = o.align ?? 'center'; g.textBaseline = 'middle';
  if (o.spacing) g.letterSpacing = o.spacing + 'px';
  if (o.rot) { g.translate(x, y); g.rotate(o.rot); x = 0; y = 0; }
  const w = g.measureText(s).width; g.fillText(s, x, y); g.restore(); return w;
}
const box = (id, s, cx, cy, w, size) => ({ id, text: s, x0: cx - w / 2, y0: cy - size * .6, x1: cx + w / 2, y1: cy + size * .6 });

// ---- dialogue card: a cartouche with a speaker tab
export function sayCard(g, spec, t, id) {
  g.fillStyle = CARD_BG; g.fillRect(0, 0, FW, FH); fibre(g);
  g.save(); g.strokeStyle = CARD_FG;
  const cart = (m, lw) => { const x0 = m, y0 = m, x1 = FW - m, y1 = FH - m, r = 70; g.lineWidth = lw; g.beginPath();
    g.moveTo(x0 + r, y0); g.lineTo(x1 - r, y0); g.arc(x1, y0, r, Math.PI, Math.PI / 2, true); g.lineTo(x1, y1 - r); g.arc(x1, y1, r, -Math.PI / 2, Math.PI, true);
    g.lineTo(x0 + r, y1); g.arc(x0, y1, r, 0, -Math.PI / 2, true); g.lineTo(x0, y0 + r); g.arc(x0, y0, r, Math.PI / 2, 0, true); g.closePath(); g.stroke(); };
  cart(60, 5); cart(84, 1.8);
  // speaker tab
  g.fillStyle = CARD_BG; g.fillRect(FW / 2 - 130, 40, 260, 70); g.lineWidth = 2.4; g.strokeRect(FW / 2 - 130, 40, 260, 70);
  g.restore();
  const out = [];
  const tw = text(g, spec.who + '：', `700 46px "${ZH}"`, FW / 2, 76); out.push(box(id + 'who', spec.who + '：', FW / 2, 76, tw, 46));
  const total = spec.lines.reduce((s, l) => s + l.size * 1.5, 0); let y = FH / 2 - total / 2 + 30;
  spec.lines.forEach((l, i) => { const cy = y + l.size * .75; const w = text(g, l.text, `700 ${l.size}px "${ZH}"`, FW / 2, cy); out.push(box(id + i, l.text, FW / 2, cy, w, l.size)); y += l.size * 1.5; });
  // corner quotation marks
  text(g, '「', `400 120px "${ZH}"`, 200, 300, { color: grey(.6) }); text(g, '」', `400 120px "${ZH}"`, FW - 200, FH - 260, { color: grey(.6) });
  return out;
}
// ---- the genre reel cards (the films' own English titles)
export function westCard(g, lines, t, id) {
  g.fillStyle = '#0d0b09'; g.fillRect(0, 0, FW, FH);
  for (let p = 0; p < 4; p++) {                                   // three planks + a crosspiece
    const y = 170 + p * 190, v = .3 + H(p) * .08;
    g.fillStyle = grey(v); g.fillRect(150, y, FW - 300, 176);
    g.strokeStyle = grey(v - .12); g.lineWidth = 1.4;
    for (let k = 0; k < 9; k++) { g.beginPath(); const yy = y + 14 + k * 18; g.moveTo(150, yy); for (let x = 150; x <= FW - 150; x += 60) g.lineTo(x, yy + Math.sin(x * .02 + p + k) * 3); g.stroke(); }
    for (const x of [180, FW - 180]) for (const yy of [y + 30, y + 146]) { g.fillStyle = grey(.75); g.beginPath(); g.arc(x, yy, 7, 0, 7); g.fill(); }
  }
  const out = []; lines.forEach((s, i) => { const cy = 400 + i * 230; const w = text(g, s, '400 150px "Rye"', FW / 2, cy, { color: grey(.92), spacing: 4 }); out.push(box(id + i, s, FW / 2, cy, w, 150)); });
  return out;
}
export function romaCard(g, lines, t, id) {
  g.fillStyle = CARD_BG; g.fillRect(0, 0, FW, FH); fibre(g);
  g.save(); g.strokeStyle = CARD_FG;
  for (const [rx, ry, lw] of [[600, 420, 4], [575, 395, 1.6]]) { g.lineWidth = lw; g.beginPath(); g.ellipse(FW / 2, FH / 2, rx, ry, 0, 0, 7); g.stroke(); }
  const heart = (x, y, s) => { g.beginPath(); g.moveTo(x, y + s * .5); g.bezierCurveTo(x - s, y - s * .2, x - s * .45, y - s * .9, x, y - s * .35); g.bezierCurveTo(x + s * .45, y - s * .9, x + s, y - s * .2, x, y + s * .5); g.fillStyle = CARD_FG; g.fill(); };
  heart(FW / 2, 125, 36); heart(FW / 2, FH - 95, 36);
  for (const k of [-1, 1]) for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + k * (.5 + i * .17); g.beginPath(); g.ellipse(FW / 2 + Math.cos(a) * 600, FH / 2 + Math.sin(a) * 420, 9, 4, a, 0, 7); g.fillStyle = CARD_FG; g.fill(); }
  g.restore();
  const out = []; lines.forEach((s, i) => { const cy = 470 + i * 170; const w = text(g, s, '400 150px "Pinyon Script"', FW / 2, cy); out.push(box(id + i, s, FW / 2, cy, w, 150)); });
  return out;
}
export function monsCard(g, lines, t, id) {
  g.fillStyle = '#070807'; g.fillRect(0, 0, FW, FH);
  g.save(); g.fillStyle = grey(.85); g.beginPath();                  // a jagged expressionist frame
  const P = []; const N = 46;
  for (let i = 0; i < N; i++) { const u = i / N * Math.PI * 2, r = (i % 2 ? 560 : 610) + H(i) * 40; P.push([FW / 2 + Math.cos(u) * r * 1.12, FH / 2 + Math.sin(u) * r * .78]); }
  g.moveTo(P[0][0], P[0][1]); for (const p of P) g.lineTo(p[0], p[1]); g.closePath();
  const Q = P.map(([x, y]) => [FW / 2 + (x - FW / 2) * .93, FH / 2 + (y - FH / 2) * .9]); g.moveTo(Q[0][0], Q[0][1]); for (let i = Q.length - 1; i >= 0; i--) g.lineTo(Q[i][0], Q[i][1]); g.closePath();
  g.fill('evenodd'); g.restore();
  const sh = Math.sin(t * 40) * 2;
  const out = []; lines.forEach((s, i) => { const cy = 450 + i * 190; const w = text(g, s, '400 130px "UnifrakturMaguntia"', FW / 2 + sh, cy, { color: grey(.92), rot: -.04 + i * .06 }); out.push(box(id + i, s, FW / 2, cy, w, 130)); });
  return out;
}
export function endCard(g, t, id) {
  intertitle(g, FW, FH, { level: 2, seed: 9, lines: [] }, t);
  const out = []; let y = 420;
  END_LINES.forEach((l, i) => { const f = `${l.weight} ${l.size}px "${l.font}"`; const w = text(g, l.text, f, FW / 2, y, { spacing: l.spacing }); out.push(box(id + i, l.text, FW / 2, y, w + (l.spacing ?? 0) * l.text.length, l.size)); y += [210, 120, 0][i]; });
  return out;
}
// boxes of an engine intertitle spec (narr / shout / tender)
export function engineCard(g, spec, t, id) {
  intertitle(g, FW, FH, spec, t);
  const gap = spec.gap ?? 1.28, total = spec.lines.reduce((s, l) => s + l.size * gap, 0); let y = FH / 2 - total / 2 + (spec.dy ?? 0); const out = [];
  const m = g; spec.lines.forEach((l, i) => { m.save(); m.font = `${l.weight ?? 400} ${l.size}px "${l.font}"`; const w = m.measureText(l.text).width; m.restore(); out.push(box(id + i, l.text, FW / 2, y + l.size * gap / 2, w, l.size)); y += l.size * gap; });
  return out;
}
