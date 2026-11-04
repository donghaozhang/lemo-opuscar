// The kitchen: top-down table (board, wrappers, bowl of filling, dumplings in their three folding stages), the wall with the clock and the round window from inside,
// the dinner table seen from the side with stools, bowls and a steaming pot. Everything is dyed paper.
import { PAL, piece, P, Pl, trace, fill, cut, cutTaper, inset, within, ellipsePoly, curve, rnd } from '../engine/paper.js';
import { sawRow, sawEdge, crescent, crescentRows, swirl, doubleSwirl, rosette, plum, coin, dots, taper, along, cloudCut } from '../engine/motifs.js';
import { mul, T, R, S, put } from '../engine/rig.js';

export const KPAL = { table: '#4a2a2a', board: '#e9dcc0', wrapper: '#f3e9d2', dumpling: '#f1e4c8', bowl: PAL.red, wall: '#1a2246', wood: '#5a3230', flour: '#f7f1e2', cream: '#f5ead4' };
const K = {};
// dumpling, top-down, three stages: 0 = flat wrapper (a circle), 1 = folded in half (a half moon with the edge pressed), 2 = pleated (crescent cuts along the rim), 3 = squashed (a wide blob with claw marks), 4 = giant pleated
export function dumplingPiece(stage, seed = 161, col = KPAL.dumpling) {
  const sz = stage === 4 ? 2.6 : 1;
  return piece([-70 * sz, -60 * sz, 70 * sz, 60 * sz], g => {
    g.scale(sz, sz);
    if (stage === 0) { fill(g, q => trace(q, P(ellipsePoly(0, 0, 46, 46, 0, 40).slice(0, -1), true, .5, seed)), col); dots(g, [[-14, -10], [12, -16], [4, 14], [-20, 16], [22, 8]], 2.2); }
    else if (stage === 1) { const o = P([...ellipsePoly(0, 8, 48, 40, 0, 30, Math.PI, Math.PI * 2).slice(0, -1), [48, 8], [-48, 8]], true, .5, seed); fill(g, q => trace(q, o), col); cutTaper(g, [[-40, 6], [0, 4], [40, 6]], 3); }
    else if (stage === 2 || stage === 4) {
      const o = P([...ellipsePoly(0, 12, 56, 44, 0, 30, Math.PI, Math.PI * 2).slice(0, -1), [52, 14], [30, 22], [0, 24], [-30, 22], [-52, 14]], true, .5, seed);
      fill(g, q => trace(q, o), col);
      // pleats: crescents along the top rim
      for (let k = -3; k <= 3; k++) { const a = -Math.PI / 2 + k * .36; crescent(g, Math.cos(a) * 36, 12 + Math.sin(a) * 28, 12, a - 1.1, a + 1.1, 3.4); }
      cutTaper(g, curve([[-44, 14], [0, 10], [44, 14]], false, 2), 2.6);
      if (stage === 4) for (const x of [-30, -8, 14]) cutTaper(g, [[x, -4], [x + 3, 6], [x, 16]], 2.4);   // claw marks on the giant one
    } else if (stage === 3) {
      const o = P([[-60, 0], [-50, -22], [-20, -30], [20, -28], [52, -20], [62, 2], [48, 18], [10, 24], [-30, 22], [-56, 14]], true, .8, seed);
      fill(g, q => trace(q, o), col);
      for (const x of [-26, -4, 18]) cutTaper(g, [[x, -14], [x + 3, 0], [x, 14]], 3);   // three claw slits
      crescent(g, 30, 4, 10, Math.PI * .2, Math.PI * .8, 2.5);
    }
  }, { seed, col, ss: 2, edge: 1 });
}
// a hand seen from above (origin = wrist): a palm with four fingers and a thumb; col = the person's paper
export function handTopPiece(col, seed, kind = 'open') {
  return piece([-50, -100, 50, 30], g => {
    const palm = P([[-26, 0], [-30, -40], [-20, -60], [20, -60], [30, -40], [26, 0]], true, .3, seed);
    fill(g, q => trace(q, palm), col);
    if (kind === 'open') for (let k = 0; k < 4; k++) { const x = -22 + k * 14.5, len = [-82, -94, -90, -76][k]; fill(g, q => trace(q, P([[x - 6, -56], [x + 6, -56], [x + 6, len], [x, len - 6], [x - 6, len]], true, .25, seed + k + 1)), col); cutTaper(g, [[x, -58], [x, -66]], 2); }
    else { fill(g, q => trace(q, P([[-28, -58], [30, -58], [32, -78], [22, -84], [-24, -84], [-32, -74]], true, .3, seed + 1)), col); for (let k = 0; k < 3; k++) cutTaper(g, [[-12 + k * 14, -60], [-12 + k * 14, -80]], 2.2); }
    fill(g, q => trace(q, P([[26, -30], [44, -46], [50, -60], [42, -62], [26, -50]], true, .25, seed + 7)), col);   // thumb
    cutTaper(g, [[-20, -8], [0, -10], [20, -8]], 2.4);   // cuff line
    sawRow(g, [[-26, -4], [26, -4]], 6, 5, 1, .7);
  }, { seed, col, ss: 2 });
}
// the Nian's paw from above (origin = wrist): a huge round pad with three claws
export function pawTopPiece(col = '#c4162c', seed = 171) {
  return piece([-120, -220, 120, 40], g => {
    const pad = P(ellipsePoly(0, -70, 80, 84, 0, 36).slice(0, -1), true, .5, seed);
    fill(g, q => trace(q, pad), col);
    for (let k = 0; k < 3; k++) { const x = -48 + k * 48; fill(g, q => trace(q, P([[x - 22, -130], [x + 22, -130], [x + 14, -190], [x, -206], [x - 14, -190]], true, .4, seed + k + 1)), col); cutTaper(g, [[x, -150], [x, -186]], 4); }
    crescent(g, 0, -60, 40, Math.PI * .15, Math.PI * .85, 9); swirl(g, 0, -90, 24, 1.5, 6, 0, 1);
    sawRow(g, [[-70, -4], [70, -4]], 14, 12, 1, .7);
    cutTaper(g, [[-60, -14], [0, -16], [60, -14]], 3);
  }, { seed, col, ss: 2 });
}
export function kitchenKit() {
  if (K.board) return K;
  K.board = piece([-420, -300, 420, 300], g => { fill(g, q => trace(q, P(ellipsePoly(0, 0, 400, 280, 0, 60).slice(0, -1), true, 1.2, 181)), KPAL.board); cutTaper(g, curve([[-380, -40], [0, -60], [380, -40]], false, 4), 3); cutTaper(g, curve([[-360, 80], [0, 60], [360, 80]], false, 4), 3); }, { seed: 181, col: KPAL.board, ss: 1, edge: 1 });
  K.flour = piece([-300, -200, 300, 200], g => { fill(g, q => trace(q, P(ellipsePoly(0, 0, 280, 180, 0, 50).slice(0, -1), true, 2, 183)), KPAL.flour); for (let k = 0; k < 30; k++) cut(g, q => q.arc(-240 + rnd(k, 183) * 480, -150 + rnd(k, 185) * 300, 1.5 + rnd(k, 187) * 2.5, 0, 7)); }, { seed: 183, col: KPAL.flour, ss: 1, edge: .5 });
  K.bowlTop = piece([-110, -110, 110, 110], g => { fill(g, q => q.arc(0, 0, 104, 0, 7), KPAL.bowl); cut(g, q => { q.arc(0, 0, 92, 0, 7); q.arc(0, 0, 86, 0, 7, true); }, 'evenodd'); fill(g, q => q.arc(0, 0, 82, 0, 7), '#d9b58c'); for (let k = 0; k < 14; k++) cut(g, q => q.arc(-60 + rnd(k, 191) * 120, -60 + rnd(k, 193) * 120, 3 + rnd(k, 195) * 4, 0, 7)); for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; plum(g, Math.cos(a) * 98, Math.sin(a) * 98, 5, a); } }, { seed: 191, col: KPAL.bowl, ss: 2 });
  K.pin = piece([-160, -24, 160, 24], g => { fill(g, q => trace(q, Pl([[-150, -18], [150, -18], [158, 0], [150, 18], [-150, 18], [-158, 0]], true, .4, 197)), KPAL.wood); cutTaper(g, [[-120, 0], [120, 0]], 2.6); }, { seed: 197, col: KPAL.wood, ss: 2 });
  K.dump = [0, 1, 2, 3, 4].map(s => dumplingPiece(s, 161 + s));
  K.dumpRow = [0, 1, 2, 3, 4, 5].map(s => dumplingPiece(2, 201 + s));
  K.handGirl = { open: handTopPiece('#e0352c', 211, 'open'), pinch: handTopPiece('#e0352c', 213, 'pinch') };
  K.handGm = { open: handTopPiece(PAL.red, 215, 'open'), pinch: handTopPiece(PAL.red, 217, 'pinch') };
  K.paw = pawTopPiece();
  // the wall clock: cream face on a red rim, 12 plum marks; hands are drawn live (red / gold)
  K.clock = piece([-130, -130, 130, 130], g => { fill(g, q => q.arc(0, 0, 124, 0, 7), PAL.red); cut(g, q => { q.arc(0, 0, 112, 0, 7); q.arc(0, 0, 106, 0, 7, true); }, 'evenodd'); fill(g, q => q.arc(0, 0, 104, 0, 7), KPAL.cream); for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2 - Math.PI / 2; if (k % 3 === 0) plum(g, Math.cos(a) * 86, Math.sin(a) * 86, 7, a); else cut(g, q => q.arc(Math.cos(a) * 88, Math.sin(a) * 88, 3.2, 0, 7)); } for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; crescent(g, Math.cos(a) * 118, Math.sin(a) * 118, 8, a + Math.PI - 1, a + Math.PI + 1, 2.5); } }, { seed: 221, col: PAL.red, ss: 2 });
  // round window seen from inside: an indigo rim; the pane is drawn live (dark at night, glowing at midnight)
  K.winRim = piece([-330, -330, 330, 330], g => { fill(g, q => { q.arc(0, 0, 326, 0, 7); q.arc(0, 0, 292, 0, 7, true); }, '#3b4a88'); for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2; crescent(g, Math.cos(a) * 309, Math.sin(a) * 309, 10, a + Math.PI - 1, a + Math.PI + 1, 3); } }, { seed: 223, col: '#3b4a88', ss: 1.5 });
  K.lattice = piece([-300, -300, 300, 300], g => { g.save(); g.beginPath(); g.arc(0, 0, 296, 0, 7); g.clip(); g.fillStyle = '#3b4a88'; for (let i = -2; i <= 2; i++) { g.fillRect(i * 110 - 6, -300, 12, 600); g.fillRect(-300, i * 110 - 6, 600, 12); } g.restore(); }, { seed: 225, col: '#3b4a88', ss: 1.5, edge: .8 });
  // side-view dinner table + stools + bowls + the pot
  K.tableSide = piece([-620, -40, 620, 300], g => { fill(g, q => trace(q, Pl([[-600, -30], [600, -30], [600, 20], [-600, 20]], true, .6, 231)), KPAL.wood); sawRow(g, [[-590, 10], [590, 10]], 10, 12, -1, .7); for (const x of [-520, 520]) fill(g, q => trace(q, Pl([[x - 22, 20], [x + 22, 20], [x + 26, 290], [x - 26, 290]], true, .4, 233)), KPAL.wood); cutTaper(g, [[-560, -6], [560, -6]], 2.4); }, { seed: 231, col: KPAL.wood, ss: 1 });
  K.stool = piece([-50, -10, 50, 150], g => { fill(g, q => trace(q, Pl([[-44, 0], [44, 0], [44, 18], [-44, 18]], true, .4, 235)), KPAL.wood); for (const x of [-32, 32]) fill(g, q => trace(q, Pl([[x - 8, 18], [x + 8, 18], [x + 10, 140], [x - 10, 140]], true, .4, 237)), KPAL.wood); crescentRows(g, -40, 2, 40, 16, 7, 2.5, 0, .7); }, { seed: 235, col: KPAL.wood, ss: 2 });
  K.bowlSide = piece([-50, -40, 50, 10], g => { fill(g, q => trace(q, P([[-46, -34], [46, -34], [36, 2], [-36, 2]], true, .4, 241)), PAL.red); cutTaper(g, [[-40, -24], [40, -24]], 2.4); for (let k = -2; k <= 2; k++) plum(g, k * 16, -10, 4.5); }, { seed: 241, col: PAL.red, ss: 2 });
  K.pot = piece([-130, -120, 130, 20], g => { fill(g, q => trace(q, P([[-120, -90], [120, -90], [110, 10], [-110, 10]], true, .5, 243)), '#8a0c20'); fill(g, q => trace(q, P([[-126, -100], [126, -100], [120, -86], [-120, -86]], true, .4, 245)), '#8a0c20'); fill(g, q => q.ellipse(0, -112, 22, 14, 0, 0, 7), '#8a0c20'); cutTaper(g, [[-100, -70], [100, -70]], 2.6); crescentRows(g, -110, -60, 110, 0, 12, 4, 0, .7); for (const s of [-1, 1]) fill(g, q => trace(q, P([[s * 120, -70], [s * 150, -76], [s * 150, -60], [s * 120, -54]], true, .4, 247)), '#8a0c20'); }, { seed: 243, col: '#8a0c20', ss: 2 });
  K.steam = [0, 1, 2].map(k => piece([-60, -200, 60, 10], g => { const pts = []; for (let i = 0; i <= 30; i++) { const u = i / 30; pts.push([Math.sin(u * 6 + k) * 22 * (1 - u * .4), -u * 190]); } cutTaper(g, pts, 1); fill(g, q => { for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1], w = 14 * (1 - i / pts.length * .7); q.moveTo(a[0] - w, a[1]); q.lineTo(b[0] - w, b[1]); q.lineTo(b[0] + w, b[1]); q.lineTo(a[0] + w, a[1]); q.closePath(); } }, '#e9e2f0'); for (let i = 2; i < 6; i++) cloudCut(g, pts[i * 5][0], pts[i * 5][1], 8, 1.6, i, i % 2 ? 1 : -1); }, { seed: 251 + k, col: '#e9e2f0', ss: 2, edge: .4 }));
  return K;
}
// clock hands at time hh:mm (drawn live; gold at twelve); M = clock piece transform
export function drawClockHands(g, M, hh, mm, gold = false) {
  const col = gold ? '#d9a93f' : '#8a0c20';
  const hand = (a, len, w) => { g.save(); g.setTransform(...mul(M, R(a))); g.shadowColor = 'rgba(40,10,10,.4)'; g.shadowBlur = 4; g.shadowOffsetX = 2; g.shadowOffsetY = 3; g.fillStyle = col; g.beginPath(); g.moveTo(-w, 8); g.lineTo(-w * .5, -len); g.lineTo(0, -len - 10); g.lineTo(w * .5, -len); g.lineTo(w, 8); g.closePath(); g.fill(); g.restore(); };
  hand((mm / 60) * Math.PI * 2, 84, 7); hand(((hh % 12) / 12 + mm / 720) * Math.PI * 2, 56, 9);
  g.save(); g.setTransform(...M); g.fillStyle = col; g.beginPath(); g.arc(0, 0, 9, 0, 7); g.fill(); g.restore();
}
