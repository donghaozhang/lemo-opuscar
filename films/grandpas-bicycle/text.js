// ---------- the annotation layer: hand notes, measured labels, titles, subtitles ----------
const PAPERC = '#f1e9da', INKT = '#2b2420', BROWNT = '#4a3a2c';
const FONT_HAND = '"Long Cang"', FONT_SERIF = '"Noto Serif SC"', FONT_MONO = '"IBM Plex Mono"';
// text registry for readcheck: every drawn text pushes its full box here when visible (reset per frame by render)
let TXT = [];
const regText = (id, text, x0, y0, x1, y1) => { TXT.push({ id, text, x0, y0, x1, y1 }); };

// handwriting, revealed left to right like writing, drawn twice over a paper halo
function hand(ctx, id, txt, x, y, p, o = {}) {
  if (p <= 0) return;
  const size = o.size || 44, align = o.align || 'left';
  ctx.save(); ctx.font = `400 ${size}px ${FONT_HAND}`; ctx.textAlign = align; ctx.textBaseline = 'middle';
  const w = ctx.measureText(txt).width, x0 = align === 'right' ? x - w : align === 'center' ? x - w / 2 : x;
  if (o.rot) { ctx.translate(x, y); ctx.rotate(o.rot); ctx.translate(-x, -y); }
  ctx.beginPath(); ctx.rect(x0 - 8, y - size * .7, (w + 16) * eo(p), size * 1.4); ctx.clip();
  ctx.shadowColor = rgba(PAPERC, .95); ctx.shadowBlur = Math.max(8, size * .3);
  ctx.fillStyle = rgba(o.col || BROWNT, o.a ?? .92); ctx.fillText(txt, x, y); ctx.fillText(txt, x, y);
  ctx.restore();
  if (p >= 1 && !o.noreg) regText(id, txt, x0 - 4, y - size * .6, x0 + w + 4, y + size * .6);
}
// measured label: mono, wide tracking
function mono(ctx, id, txt, x, y, p, o = {}) {
  if (p <= 0) return;
  const size = o.size || 26;
  ctx.save(); ctx.font = `500 ${size}px ${FONT_MONO}`; ctx.letterSpacing = `${Math.round(size * .18)}px`; ctx.textAlign = o.align || 'left'; ctx.textBaseline = 'middle';
  const w = ctx.measureText(txt).width, x0 = o.align === 'right' ? x - w : o.align === 'center' ? x - w / 2 : x;
  ctx.beginPath(); ctx.rect(x0 - 6, y - size, (w + 12) * eo(p), size * 2); ctx.clip();
  ctx.shadowColor = rgba(PAPERC, .95); ctx.shadowBlur = 10;
  ctx.fillStyle = rgba(o.col || BROWNT, o.a ?? .9); ctx.fillText(txt, x, y); ctx.fillText(txt, x, y);
  ctx.restore();
  if (p >= 1 && !o.noreg) regText(id, txt, x0 - 4, y - size * .7, x0 + w + 4, y + size * .7);
}
// serif: titles and the two spoken lines
function serif(ctx, id, txt, x, y, p, o = {}) {
  if (p <= 0) return;
  const size = o.size || 40, wgt = o.w || 400;
  ctx.save(); ctx.font = `${wgt} ${size}px ${FONT_SERIF}`; ctx.letterSpacing = `${o.track ?? Math.round(size * .06)}px`; ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'middle';
  const w = ctx.measureText(txt).width, x0 = o.align === 'left' ? x : o.align === 'right' ? x - w : x - w / 2;
  ctx.beginPath(); ctx.rect(x0 - 10, y - size * .8, (w + 20) * (o.wipe === false ? 1 : eo(p)), size * 1.6); ctx.clip();
  ctx.globalAlpha *= (o.wipe === false ? ss(p) : 1);
  ctx.shadowColor = rgba(PAPERC, 1); ctx.shadowBlur = Math.max(10, size * .4);
  ctx.fillStyle = rgba(o.col || INKT, o.a ?? .85); ctx.fillText(txt, x, y); ctx.fillText(txt, x, y);
  ctx.restore();
  if (p >= 1 && !o.noreg) regText(id, txt, x0 - 6, y - size * .7, x0 + w + 6, y + size * .7);
}
// a pen leader line that grows from the label to the thing
function leaderL(ctx, x0, y0, x1, y1, p, bend = 20, a = .7, col = BROWNT) {
  if (p <= 0) return;
  const pts = qcurve(x0, y0, x1, y1, bend, 16), m = Math.max(1, Math.round(16 * clamp(p)));
  ctx.save(); ctx.beginPath(); for (let i = 0; i <= m; i++) i ? ctx.lineTo(pts[i][0], pts[i][1]) : ctx.moveTo(pts[i][0], pts[i][1]);
  ctx.strokeStyle = rgba(col, a); ctx.lineWidth = 1.8; ctx.lineCap = 'round'; ctx.stroke();
  if (p >= 1) { ctx.beginPath(); ctx.arc(x1, y1, 3.2, 0, 7); ctx.fillStyle = rgba(col, a); ctx.fill(); }
  ctx.restore();
}
// a dimension line with ticks at both ends, drawn end to end
function dimL(ctx, x0, y0, x1, y1, p, a = .7) {
  if (p <= 0) return;
  const q = eo(p), ex = lerp(x0, x1, q), ey = lerp(y0, y1, q), dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L * 9, ny = dx / L * 9;
  ctx.save(); ctx.strokeStyle = rgba(BROWNT, a); ctx.lineWidth = 1.8; ctx.lineCap = 'round'; ctx.setLineDash([9, 7]);
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(ex, ey); ctx.stroke(); ctx.setLineDash([]);
  ctx.beginPath(); ctx.moveTo(x0 + nx, y0 + ny); ctx.lineTo(x0 - nx, y0 - ny); if (p >= 1) { ctx.moveTo(x1 + nx, y1 + ny); ctx.lineTo(x1 - nx, y1 - ny); } ctx.stroke();
  ctx.restore();
}
// a tally: short pencil strokes, n of them
function tally(ctx, x, y, n, p, size = 26) {
  ctx.save(); ctx.strokeStyle = rgba(BROWNT, .85); ctx.lineWidth = 2.4; ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) { const q = seg(p, i / n, (i + .8) / n); if (q <= 0) break; ctx.beginPath(); ctx.moveTo(x + i * size * .5 + 2, y - size * .5); ctx.lineTo(x + i * size * .5 - 2 + 0 * q, y - size * .5 + size * eo(q)); ctx.stroke(); }
  ctx.restore();
}
// a note: leader from the label to the anchor, then the handwriting
function noteAt(ctx, id, txt, ax, ay, lx, ly, t, t0, t1, o = {}) {
  const f = t1 ? 1 - ss(seg(t, t1 - .4, t1)) : 1; if (t < t0 || f <= 0) return;
  ctx.save(); ctx.globalAlpha *= f;
  if (!o.noLeader) leaderL(ctx, lx + (o.lead ?? 0), ly + (o.leadY ?? 22), ax, ay, seg(t, t0, t0 + .55), o.bend ?? 18);
  hand(ctx, id, txt, lx, ly, seg(t, t0 + .25, t0 + .25 + (o.dur ?? Math.max(.9, txt.length * .14))), o);
  ctx.restore();
}
// subtitles: the two spoken lines, serif at the bottom over a paper halo
function drawSubs(ctx, t, SUBS) {
  for (const s of SUBS) {
    const f = ss(seg(t, s.t0, s.t0 + .3)) * (1 - ss(seg(t, s.t1 - .35, s.t1))); if (f <= 0) continue;
    ctx.save(); ctx.globalAlpha = f;
    serif(ctx, 'sub_' + s.t0, s.text, 960, 1006, 1, { size: 40, w: 400, a: .8, noreg: true, track: 3 });
    ctx.restore();
  }
}
