// The paper-cut 小雪 makes all film long: the Nian's face, front view, cut from a sheet folded in half (mirror-symmetric), inside a round rosette border.
// stage 1: outer scalloped ring + sawtooth (what the inserts show first); stage 2: + horns and the eye; stage 3: everything (the unfold); half(stage) draws only x ≥ 0 (the folded sheet).
import { PAL, piece, P, Pl, trace, fill, cut, cutTaper, inset, within, ellipsePoly, curve, canvas, finishPaper } from '../engine/paper.js';
import { sawRow, sawEdge, crescent, crescentPts, crescentRows, swirl, doubleSwirl, rosette, plum, coin, dots, taper, along } from '../engine/motifs.js';
export const CR = 330;   // radius of the round cut
const PC = {};
// cut groups, each drawn for the right half (x ≥ 0) then mirrored by the caller
function groups(g, stage, col) {
  if (stage < 1) return;
  // —— stage 1: the ring: a scalloped outer edge (the fill), fine sawtooth inside the edge, a yang-cut band of lanterns (red lines left) ——
  const edge = []; for (let i = 0; i <= 60; i++) { const a = -Math.PI / 2 + Math.PI * i / 60; const k = Math.abs(Math.cos(a * 8)); edge.push([Math.cos(a) * (CR - 28 - 10 * k), Math.sin(a) * (CR - 28 - 10 * k)]); }
  sawRow(g, edge, 14, 11, 1, .7);
  // the band: cut the ring away except red spokes and small plums
  const r0 = CR * .74, r1 = CR * .86;
  cut(g, q => { q.moveTo(0, -r1); for (let i = 0; i <= 40; i++) { const a = -Math.PI / 2 + Math.PI * i / 40; q.lineTo(Math.cos(a) * r1, Math.sin(a) * r1); } for (let i = 40; i >= 0; i--) { const a = -Math.PI / 2 + Math.PI * i / 40; q.lineTo(Math.cos(a) * r0, Math.sin(a) * r0); } q.closePath(); });
  g.save(); g.globalCompositeOperation = 'source-over'; g.fillStyle = col; g.strokeStyle = col; g.lineWidth = CR * .018; g.lineCap = 'round';
  for (let k = 0; k < 7; k++) { const a = -Math.PI / 2 + Math.PI * (k + .5) / 7; g.beginPath(); g.moveTo(Math.cos(a) * (r0 - 2), Math.sin(a) * (r0 - 2)); g.lineTo(Math.cos(a) * (r1 + 2), Math.sin(a) * (r1 + 2)); g.stroke(); const c = [Math.cos(a) * (r0 + r1) / 2, Math.sin(a) * (r0 + r1) / 2]; g.beginPath(); g.arc(c[0], c[1], CR * .03, 0, 7); g.fill(); }
  g.beginPath(); for (let i = 0; i <= 40; i++) { const a = -Math.PI / 2 + Math.PI * i / 40; g[i ? 'lineTo' : 'moveTo'](Math.cos(a) * (r0 + 3), Math.sin(a) * (r0 + 3)); } g.stroke();
  g.beginPath(); for (let i = 0; i <= 40; i++) { const a = -Math.PI / 2 + Math.PI * i / 40; g[i ? 'lineTo' : 'moveTo'](Math.cos(a) * (r1 - 3), Math.sin(a) * (r1 - 3)); } g.stroke();
  g.restore();
  if (stage < 2) return;
  // —— stage 2: the horn (right half) and the eye ——
  const hpts = []; for (let i = 0; i <= 20; i++) { const u = i / 20, a = -2.4 + u * 2.2, r = 96 * (1 - u * .2); hpts.push([70 + Math.cos(a) * r, -150 + Math.sin(a) * r * .9]); }
  cutTaper(g, hpts, 12);   // the horn's inner line (yin cut) — the horn itself is red paper left inside the head circle
  for (let k = 1; k <= 4; k++) { const i = Math.floor(k / 5 * 20); crescent(g, hpts[i][0], hpts[i][1], 16, -2.2, -.8, 5); }
  const Ey = [92, -40];
  crescent(g, Ey[0], Ey[1] + 2, 40, Math.PI * 1.04, Math.PI * 1.96, 30);
  crescent(g, Ey[0], Ey[1] - 2, 38, Math.PI * .08, Math.PI * .92, 8);
  cut(g, q => q.arc(Ey[0] - 2, Ey[1], 18, 0, 7));
  const bc = curve([[Ey[0] - 44, Ey[1] - 70], [Ey[0], Ey[1] - 84], [Ey[0] + 44, Ey[1] - 66]], false, 3); cutTaper(g, bc, 9); sawRow(g, bc, 16, 11, -1, .7);
  if (stage < 3) return;
  // —— stage 3: the face outline (fur sawtooth as a yin ring around the head), nose, mouth with teeth, cheek swirls, whiskers ——
  const head = []; for (let i = 0; i <= 40; i++) { const a = -Math.PI / 2 + Math.PI * i / 40; head.push([Math.cos(a) * 214, 10 + Math.sin(a) * 200]); }
  cutTaper(g, head, 6); sawRow(g, head, 22, 16, 1, .7);
  plum(g, 0, 40, 22, 0);   // nose (on the fold line: the mirror completes it)
  swirl(g, 60, 66, 22, 1.6, 6, .4, 1);
  const lip = curve([[0, 120], [60, 128], [120, 118], [160, 96]], false, 3); cutTaper(g, lip, 6); sawRow(g, lip, 20, 16, 1, .7);
  doubleSwirl(g, 150, 30, 50, 6, .5);
  for (const [y, l] of [[60, 70], [84, 64], [108, 56]]) cutTaper(g, [[180, y], [180 + l * .5, y + 4], [180 + l, y + 12]], 4);
  for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + Math.PI * (k + .5) / 5; plum(g, Math.cos(a) * CR * .6, Math.sin(a) * CR * .6 + 10, 10, a); }
}
function outline() { const o = []; for (let i = 0; i <= 160; i++) { const a = i / 160 * Math.PI * 2, k = Math.abs(Math.cos(a * 8)); o.push([Math.cos(a) * (CR - 10 * (1 - Math.pow(k, .6))), Math.sin(a) * (CR - 10 * (1 - Math.pow(k, .6)))]); } return o; }
// the whole cut (both halves) at a stage
export function nianCut(stage = 3, K = 1.6, col = PAL.red) {
  const key = 'full' + stage + K + col; if (PC[key]) return PC[key];
  const p = piece([-CR - 12, -CR - 12, CR + 12, CR + 12], g => {
    g.__col = col;
    fill(g, q => trace(q, P(outline(), true, .5, 61)), col);
    for (const m of [1, -1]) { g.save(); g.scale(m, 1); g.beginPath(); g.rect(0, -CR - 20, CR + 20, 2 * CR + 40); g.clip(); groups(g, stage, col); g.restore(); }
    // the fold crease: a faint line down the middle (true to the craft)
    g.save(); g.globalCompositeOperation = 'source-over'; g.strokeStyle = 'rgba(80,6,10,.35)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(0, -CR); g.lineTo(0, CR); g.stroke(); g.restore();
  }, { ss: K, seed: 63 + stage, col });
  return PC[key] = p;
}
// the folded sheet: a rectangle folded in half (fold at the left), with the right half's cuts at a stage; width = CR + margin
export function foldedSheet(stage = 1, K = 1.6, col = PAL.red) {
  const key = 'half' + stage + K + col; if (PC[key]) return PC[key];
  const p = piece([-6, -CR - 60, CR + 60, CR + 60], g => {
    g.__col = col;
    // the uncut margin of the sheet: a rectangle; the cut follows the outline only once stage ≥ 1 (the outer scallop is the first cut)
    if (stage >= 1) { fill(g, q => { const o = outline().filter(p => p[0] >= -1); q.moveTo(0, -CR); for (const pt of o.filter(pt => pt[1] <= 0).sort((a, b) => a[1] - b[1])) ; trace(q, [[0, -CR - 50], [CR + 50, -CR - 50], [CR + 50, CR + 50], [0, CR + 50]]); }, col); cut(g, q => { trace(q, [[0, -CR - 60], [CR + 60, -CR - 60], [CR + 60, CR + 60], [0, CR + 60]]); const o = outline().filter(p => p[0] >= 0); q.moveTo(o[0][0], o[0][1]); for (const pt of o) q.lineTo(pt[0], pt[1]); q.closePath(); }, 'evenodd'); }
    else fill(g, q => trace(q, Pl([[0, -CR - 50], [CR + 50, -CR - 50], [CR + 50, CR + 50], [0, CR + 50]], true, .5, 70)), col);
    g.save(); g.beginPath(); g.rect(0, -CR - 20, CR + 20, 2 * CR + 40); g.clip(); groups(g, stage, col); g.restore();
    // the stack of the second layer under the fold: a darker offset edge on the right/bottom
  }, { ss: K, seed: 73 + stage, col });
  return PC[key] = p;
}
