// Sets and props: the square at night (front), behind the screen (back), dawn; the booth frame, the crowd, the oil lamp, jug, phone, bench, rack, plaques and the placard.
// World units per set; the show cloth maps into each world through RECT_F / RECT_B.
import { piece, fill, cut, cutLine, ink, within, smooth, poly, lattice, coin, cloud, beads, beadLine, plum, meander, strata, cutTaper, DYE, canvas } from './carve.js';
import { mul, T, R, S, ap, set, dp, scaleOf } from './rig.js';
import { mulberry, vnoise, clamp, lerp, seg } from '/core/lib.js';

export const W = 1920, H = 1080;
export const RECT_F = [560, 250, 1360, 700];      // the show cloth in the square world (800×450 = cloth × 0.41667)
export const RECT_B = [160, 90, 1060, 596];       // the show cloth seen from behind (900×506 = cloth × 0.46875), mirrored
export const SF = (RECT_F[2] - RECT_F[0]) / 1920, SB = (RECT_B[2] - RECT_B[0]) / 1920;
// cloth → world matrices
export const clothF = () => [SF, 0, 0, SF, RECT_F[0], RECT_F[1]];
export const clothB = () => [-SB, 0, 0, SB, RECT_B[2], RECT_B[1]];
export const LAMP_B = [610, 62];                  // where the oil lamp hangs backstage (world B)
export const cloth2B = (x, y) => [RECT_B[2] - x * SB, RECT_B[1] + y * SB];
export const cloth2F = (x, y) => [RECT_F[0] + x * SF, RECT_F[1] + y * SF];

// ================= square pieces (transmission) =================
function tree() {
  return piece([-260, -620, 260, 30], g => {
    const trunk = q => smooth(q, [[-30, 0], [30, 0], [22, -120], [34, -220], [20, -300], [4, -300], [-10, -220], [-28, -120]]);
    fill(g, DYE.brown, trunk); within(g, trunk, () => { for (let k = 1; k < 10; k++) cutLine(g, 1.5, q => { const y = -k * 28; q.moveTo(-20, y + 4); q.lineTo(0, y - 3); q.lineTo(20, y + 4); }); }); ink(g, 2, trunk);
    const lobes = [[-230, -330], [-190, -440], [-100, -520], [10, -560], [120, -530], [210, -450], [240, -340], [170, -250], [60, -220], [-60, -230], [-170, -260]];
    const cp = q => smooth(q, lobes);
    fill(g, '#2f5a3e', cp);
    within(g, cp, () => { const r = mulberry(8); for (let k = 0; k < 160; k++) { const a = r() * 6.28, rad = Math.sqrt(r()) * 200, x = Math.cos(a) * rad * 1.15, y = -390 + Math.sin(a) * rad * .8, ang = r() * 6.28, L = 10 + r() * 7; cut(g, q => { q.moveTo(x - Math.cos(ang) * L, y - Math.sin(ang) * L); q.quadraticCurveTo(x - Math.sin(ang) * 4, y + Math.cos(ang) * 4, x + Math.cos(ang) * L, y + Math.sin(ang) * L); q.quadraticCurveTo(x + Math.sin(ang) * 4, y - Math.cos(ang) * 4, x - Math.cos(ang) * L, y - Math.sin(ang) * L); }); } });
    ink(g, 2.2, cp);
    for (const [x0, y0, x1, y1] of [[0, -280, -120, -400], [0, -300, 110, -420], [0, -320, -20, -470]]) ink(g, 5, q => { q.moveTo(x0, y0); q.quadraticCurveTo((x0 + x1) / 2 + 20, (y0 + y1) / 2, x1, y1); }, DYE.brown);
  }, { ss: 1.3, seed: 81 });
}
function roofs() {
  return piece([0, -300, 900, 40], g => {
    for (const [x, w, h, k] of [[0, 300, 170, 0], [260, 360, 220, 1], [580, 320, 150, 2]]) {
      const wall = q => poly(q, [[x + 20, 0], [x + 20, -h + 60], [x + w - 20, -h + 60], [x + w - 20, 0]]);
      fill(g, '#5a4632', wall); within(g, wall, () => { for (let y = -h + 80, r = 0; y < -10; y += 16, r++) for (let xx = x + 24 + (r % 2) * 12; xx < x + w - 30; xx += 24) cut(g, q => q.rect(xx, y, 18, 8)); if (k === 1) { const win = q => q.rect(x + w / 2 - 36, -h + 100, 72, 60); fill(g, DYE.brown, win); within(g, win, () => lattice(g, x + w / 2 - 38, -h + 98, x + w / 2 + 38, -h + 162, 12, 2.2)); ink(g, 2, win); } });
      ink(g, 2, wall);
      const roof = q => poly(q, [[x - 10, -h + 64], [x + 40, -h], [x + w - 40, -h], [x + w + 10, -h + 64]]);
      fill(g, '#2e1a10', roof); within(g, roof, () => { for (let r = 0; r < 5; r++) for (let xx = x - 10 + (r % 2) * 9; xx < x + w + 10; xx += 18) cut(g, q => { const y = -h + 12 + r * 11; q.moveTo(xx - 6, y); q.arc(xx, y, 6, Math.PI, 0, true); q.closePath(); }); });
      ink(g, 2, roof); fill(g, '#2e1a10', q => poly(q, [[x - 16, -h + 62], [x + w + 16, -h + 62], [x + w + 12, -h + 70], [x - 12, -h + 70]]));
    }
  }, { ss: 1.3, seed: 82 });
}
function lantern() {
  return piece([-34, -50, 34, 56], g => {
    const b = q => smooth(q, [[-28, -24], [28, -24], [32, 0], [28, 26], [-28, 26], [-32, 0]]);
    fill(g, DYE.orange, b); within(g, b, () => { for (let x = -24; x < 28; x += 8) cutLine(g, 2.2, q => { q.moveTo(x, -24); q.quadraticCurveTo(x + 2, 0, x, 26); }); });
    ink(g, 1.8, b);
    fill(g, DYE.ink, q => poly(q, [[-16, -30], [16, -30], [14, -22], [-14, -22]])); fill(g, DYE.ink, q => poly(q, [[-14, 24], [14, 24], [12, 32], [-12, 32]]));
    for (let k = 0; k < 5; k++) ink(g, 1.4, q => { q.moveTo(-8 + k * 4, 32); q.lineTo(-10 + k * 5, 52); }, DYE.red);
    ink(g, 2, q => { q.moveTo(0, -30); q.lineTo(0, -48); });
  }, { seed: 83 });
}
function groundF() {
  return piece([0, 740, 1920, 1090], g => {
    const gp = q => poly(q, [[-10, 770], [400, 760], [900, 766], [1400, 758], [1930, 764], [1930, 1090], [-10, 1090]]);
    fill(g, '#5a4a36', gp);
    within(g, gp, () => { const r = mulberry(9); for (let k = 0; k < 120; k++) { const x = r() * 1920, y = 790 + r() * 290; cut(g, q => { q.ellipse(x, y, 6 + r() * 10, 2 + r() * 3, 0, 0, 7); }); } cutLine(g, 2, q => { q.moveTo(0, 785); q.lineTo(1920, 782); }); });
    ink(g, 2.4, q => { q.moveTo(-10, 770); q.lineTo(400, 760); q.lineTo(900, 766); q.lineTo(1400, 758); q.lineTo(1930, 764); }, '#2e1a0c');
  }, { ss: 1.2, seed: 84 });
}
function boothCloth() {   // the booth's skirt below the stage (dark cloth) and the roof above (tiles), drawn as hide
  return piece([480, 120, 1440, 780], g => {
    const skirt = q => poly(q, [[540, 700], [1380, 700], [1380, 770], [540, 770]]);
    fill(g, '#3a2418', skirt); within(g, skirt, () => { for (let x = 560; x < 1380; x += 40) cut(g, q => { q.rect(x, 720, 18, 28); }); });
    ink(g, 2, skirt);
    const roof = q => poly(q, [[500, 236], [600, 150], [1320, 150], [1420, 236]]);
    fill(g, '#2e1a10', roof); within(g, roof, () => { for (let r = 0; r < 6; r++) for (let x = 500 + (r % 2) * 10; x < 1420; x += 20) cut(g, q => { const y = 162 + r * 12; q.moveTo(x - 7, y); q.arc(x, y, 7, Math.PI, 0, true); q.closePath(); }); });
    ink(g, 2, roof);
  }, { ss: 1.3, seed: 85 });
}
function dog() {
  return piece([-70, -70, 90, 10], g => {
    const b = q => smooth(q, [[-56, -4], [-60, -30], [-40, -46], [0, -44], [30, -40], [50, -54], [66, -56], [70, -42], [60, -30], [44, -26], [40, -4], [30, -2], [26, -24], [0, -22], [-26, -24], [-30, -2], [-40, -2], [-42, -22]]);
    fill(g, DYE.ink, b); within(g, b, () => { for (let k = 0; k < 5; k++) cutTaper(g, [[-30 + k * 12, -40], [-28 + k * 12, -30]], 2); cut(g, q => q.arc(56, -46, 2.2, 0, 7)); });
    ink(g, 2.4, q => { q.moveTo(-56, -30); q.quadraticCurveTo(-70, -50, -62, -66); });
  }, { seed: 86 });
}
// ================= backstage pieces (transmission) =================
function bench() {
  return piece([-220, -20, 220, 110], g => {
    const top = q => poly(q, [[-210, -10], [210, -10], [214, 14], [-214, 14]]);
    fill(g, '#4a2e1a', top); within(g, top, () => { for (let x = -200; x < 200; x += 28) coin(g, x, 2, 4.2); }); ink(g, 2, top);
    for (const x of [-170, 150]) { const l = q => poly(q, [[x - 14, 14], [x + 14, 14], [x + 18, 96], [x - 18, 96]]); fill(g, '#4a2e1a', l); within(g, l, () => lattice(g, x - 18, 20, x + 18, 96, 10, 2)); ink(g, 2, l); }
    ink(g, 3, q => { q.moveTo(-184, 60); q.lineTo(168, 60); }, '#4a2e1a');
  }, { ss: 1.5, seed: 91 });
}
function jug() {
  return piece([-40, -70, 40, 24], g => {
    const b = q => smooth(q, [[-20, -58], [-12, -64], [12, -64], [20, -58], [30, -30], [28, 10], [10, 18], [-10, 18], [-28, 10], [-30, -30]]);
    fill(g, '#7a4a28', b); within(g, b, () => { coin(g, 0, -16, 9); cutLine(g, 1.6, q => { q.moveTo(-26, -40); q.quadraticCurveTo(0, -46, 26, -40); }); });
    ink(g, 2, b);
    ink(g, 3.4, q => { q.moveTo(-18, -56); q.quadraticCurveTo(-12, -80, 14, -62); }, '#7a4a28');
    ink(g, 3, q => { q.moveTo(26, -46); q.quadraticCurveTo(40, -50, 38, -36); }, '#7a4a28');
  }, { seed: 92 });
}
function phone() {   // ink slab with the screen cut out (so the backstage lamp shows through) + a little bright hole for the torch
  return piece([-22, -40, 22, 40], g => {
    const b = q => { const r = 6; q.moveTo(-18 + r, -36); q.lineTo(18 - r, -36); q.quadraticCurveTo(18, -36, 18, -36 + r); q.lineTo(18, 36 - r); q.quadraticCurveTo(18, 36, 18 - r, 36); q.lineTo(-18 + r, 36); q.quadraticCurveTo(-18, 36, -18, 36 - r); q.lineTo(-18, -36 + r); q.quadraticCurveTo(-18, -36, -18 + r, -36); q.closePath(); };
    fill(g, DYE.ink, b); cut(g, q => q.rect(-14, -30, 28, 58)); cut(g, q => q.arc(-10, -33, 1.6, 0, 7));
    ink(g, 1.4, b);
  }, { seed: 93, ss: 5 });
}
function post() {
  return piece([-50, -20, 50, 1120], g => {
    const p = q => poly(q, [[-38, 0], [38, 0], [40, 1100], [-40, 1100]]);
    fill(g, '#2a1408', p); within(g, p, () => { for (let y = 60; y < 1060; y += 90) { cloud(g, 0, y, 16, 0, 2, (y / 90) % 2 ? 1 : -1); } cutLine(g, 1.4, q => { q.moveTo(-28, 10); q.lineTo(-28, 1090); q.moveTo(28, 10); q.lineTo(28, 1090); }); });
    ink(g, 2.2, p);
  }, { ss: 1.2, seed: 94 });
}
function rack() {   // two spare puppets hanging on hooks: a general and a lady, small, lace-like
  return piece([-150, -40, 150, 330], g => {
    ink(g, 4, q => { q.moveTo(-140, 0); q.lineTo(140, 0); }, '#4a2e1a');
    for (const [x, col, k] of [[-70, DYE.red, 0], [60, DYE.jade, 1]]) {
      ink(g, 1.6, q => { q.moveTo(x, 0); q.lineTo(x, 30); });
      const head = q => smooth(q, [[x - 16, 44], [x + 2, 30], [x + 20, 44], [x + 22, 70], [x + 4, 86], [x - 14, 72]]);
      fill(g, DYE.skin, head); within(g, head, () => { cut(g, q => { q.ellipse(x + 8, 56, 5, 2.4, 0, 0, 7); }); }); ink(g, 1.6, head);
      const hat = q => smooth(q, [[x - 22, 44], [x - 10, 20 - k * 6], [x + 10, 16 - k * 4], [x + 26, 44]]); fill(g, k ? DYE.ink : DYE.gold, hat); within(g, hat, () => beadLine(g, x - 16, 38, x + 20, 38, 1.4, 5)); ink(g, 1.4, hat);
      const body = q => smooth(q, [[x - 30, 90], [x + 30, 90], [x + 44, 160], [x + 50, 280], [x - 50, 280], [x - 44, 160]]);
      fill(g, col, body); within(g, body, () => { lattice(g, x - 50, 100, x + 50, 280, 11, 2.4); }); g.save(); g.beginPath(); body(g); g.clip(); ink(g, 6, body, DYE.gold); g.restore(); ink(g, 1.8, body);
    }
  }, { ss: 1.5, seed: 95 });
}
function rodLabel(text) {   // a narrow hide label with the show's name cut out, carried on a rod
  const w = 520, h = 92;
  return piece([-w / 2 - 20, -h / 2 - 20, w / 2 + 20, h / 2 + 20], g => {
    const b = q => poly(q, [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2 + 12, 0], [w / 2, h / 2], [-w / 2, h / 2], [-w / 2 - 12, 0]]);
    fill(g, '#3a1a10', b); const band = q => { b(q); q.rect(-w / 2 + 14, -h / 2 + 14, w - 28, h - 28); }; fill(g, DYE.red, band); within(g, band, () => meander(g, -w / 2 + 20, -h / 2 + 9, w / 2 - 20, 4, 1.2));
    g.save(); g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '400 58px "Ma Shan Zheng"'; g.fillText(text, 0, 4); g.restore();
    ink(g, 2, b); ink(g, 1.4, q => q.rect(-w / 2 + 14, -h / 2 + 14, w - 28, h - 28));
  }, { ss: 2, seed: 96 });
}
export function plaque(w, h, lines, sealText) {
  return piece([-w / 2 - 30, -h / 2 - 30, w / 2 + 30, h / 2 + 30], g => {
    const outer = q => { const r = 26; q.moveTo(-w / 2 + r, -h / 2); q.lineTo(w / 2 - r, -h / 2); q.quadraticCurveTo(w / 2 + 14, -h / 2 - 14, w / 2, -h / 2 + r); q.lineTo(w / 2, h / 2 - r); q.quadraticCurveTo(w / 2 + 14, h / 2 + 14, w / 2 - r, h / 2); q.lineTo(-w / 2 + r, h / 2); q.quadraticCurveTo(-w / 2 - 14, h / 2 + 14, -w / 2, h / 2 - r); q.lineTo(-w / 2, -h / 2 + r); q.quadraticCurveTo(-w / 2 - 14, -h / 2 - 14, -w / 2 + r, -h / 2); q.closePath(); };
    fill(g, '#3a1a10', outer);
    const band = q => { outer(q); q.rect(-w / 2 + 26, -h / 2 + 26, w - 52, h - 52); };
    fill(g, DYE.red, band);
    within(g, band, () => { meander(g, -w / 2 + 30, -h / 2 + 20, w / 2 - 30, 5, 1.6); meander(g, -w / 2 + 30, h / 2 - 7, w / 2 - 30, 5, 1.6); for (let y = -h / 2 + 40; y < h / 2 - 30; y += 22) { coin(g, -w / 2 + 13, y, 6); coin(g, w / 2 - 13, y, 6); } });
    for (const [x, y] of [[-w / 2 + 13, -h / 2 + 13], [w / 2 - 13, -h / 2 + 13], [-w / 2 + 13, h / 2 - 13], [w / 2 - 13, h / 2 - 13]]) { fill(g, DYE.green, q => q.arc(x, y, 20, 0, 7)); cloud(g, x, y, 12, 0, 2, 1); ink(g, 2, q => q.arc(x, y, 20, 0, 7)); }
    ink(g, 2.5, outer); ink(g, 1.8, q => q.rect(-w / 2 + 26, -h / 2 + 26, w - 52, h - 52));
    g.save(); g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000'; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const L of lines) { g.font = L.font; g.letterSpacing = (L.ls || 0) + 'px'; g.fillText(L.text, L.x || 0, L.y); }
    g.restore();
    for (const L of lines) if (L.bars) for (let k = 0; k < L.bars; k++) { const x = L.x0 + (k + .5) * (L.x1 - L.x0) / L.bars; ink(g, 2.4, q => { q.moveTo(x, L.y - L.size * .45); q.lineTo(x + 5, L.y + L.size * .45); }, '#3a1a10'); }
    if (sealText) { const sx = w / 2 - 130, sy = h / 2 - 120; fill(g, '#b3261b', q => q.rect(sx, sy, 84, 84)); g.save(); g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000'; g.font = '400 36px "Ma Shan Zheng"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(sealText[0], sx + 42, sy + 24); g.fillText(sealText[1], sx + 42, sy + 62); g.restore(); ink(g, 2, q => q.rect(sx, sy, 84, 84)); }
  }, { ss: 2, seed: 97 });
}
let PR = null;
export function buildSets() {
  if (PR) return PR;
  PR = { tree: tree(), roofs: roofs(), lantern: lantern(), groundF: groundF(), booth: boothCloth(), dog: dog(), bench: bench(), jug: jug(), phone: phone(), post: post(), rack: rack(),
    label: rodLabel('三打白骨精'),
    title: plaque(1100, 360, [{ text: '最后一场皮影戏', font: '400 150px "Ma Shan Zheng"', y: 4, ls: 10, size: 150, bars: 7, x0: -500, x1: 500 }], ['皮', '影']),
    end: plaque(520, 420, [{ text: '完', font: '400 230px "Ma Shan Zheng"', y: 12, size: 230, bars: 2, x0: -110, x1: 110 }], null) };
  return PR;
}

// ================= front-layer objects (opaque, between the camera and the cloth) =================
// Booth frame around the show cloth (world F), with warm spill on the inner edges
export function drawBooth(g, C, spill = 1) {
  const [x0, y0, x1, y1] = RECT_F;
  g.save(); set(g, C);
  const lac = '#24100a', lac2 = '#3e140c', gold = '#8a6430';
  g.fillStyle = lac; g.fillRect(x0 - 70, y0 - 64, x1 - x0 + 140, 64); g.fillRect(x0 - 70, y1, x1 - x0 + 140, 40);
  g.fillStyle = lac2; g.fillRect(x0 - 70, y0 - 50, x1 - x0 + 140, 36);
  g.strokeStyle = gold; g.lineWidth = 2;
  for (let x = x0 - 40; x < x1 + 30; x += 60) { g.beginPath(); for (let i = 0; i <= 24; i++) { const a = i / 24 * Math.PI * 2.1, r = 14 * (1 - i / 24 * .75); const px = x + 30 + Math.cos(a) * r, py = y0 - 32 + Math.sin(a) * r * .7; if (i) g.lineTo(px, py); else g.moveTo(px, py); } g.stroke(); }
  g.beginPath(); g.moveTo(x0 - 70, y0 - 50); g.lineTo(x1 + 70, y0 - 50); g.moveTo(x0 - 70, y0 - 14); g.lineTo(x1 + 70, y0 - 14); g.moveTo(x0 - 70, y1 + 30); g.lineTo(x1 + 70, y1 + 30); g.stroke();
  for (const x of [x0 - 70, x1]) { const gr = g.createLinearGradient(x, 0, x + 70, 0); gr.addColorStop(0, '#160806'); gr.addColorStop(.5, '#3a110a'); gr.addColorStop(1, '#160806'); g.fillStyle = gr; g.fillRect(x, y0 - 64, 70, y1 - y0 + 104); g.strokeStyle = gold; g.lineWidth = 1.5; g.strokeRect(x + 10, y0 + 6, 50, y1 - y0 - 12); }
  g.globalCompositeOperation = 'lighter';
  const sp = (rx, ry, rw, rh, gx0, gy0, gx1, gy1) => { const gr = g.createLinearGradient(gx0, gy0, gx1, gy1); gr.addColorStop(0, `rgba(255,170,90,${.3 * spill})`); gr.addColorStop(1, 'rgba(255,150,70,0)'); g.fillStyle = gr; g.fillRect(rx, ry, rw, rh); };
  sp(x0, y0 - 50, x1 - x0, 50, 0, y0, 0, y0 - 50); sp(x0, y1, x1 - x0, 40, 0, y1, 0, y1 + 40); sp(x0 - 70, y0, 70, y1 - y0, x0, 0, x0 - 70, 0); sp(x1, y0, 70, y1 - y0, x1, 0, x1 + 70, 0);
  g.restore();
}
// Crowd: heads from behind, three rows (world F); state: {laugh 0..1, cheer 0..1, t}
const HEADS = (() => { const r = mulberry(31), out = []; const rows = [[1010, 74, 6, 1], [910, 54, 9, 0], [838, 42, 11, 0]]; rows.forEach(([y, rad, n, near], ri) => { for (let i = 0; i < n; i++) { const x = 120 + (i + .5) * (1680 / n) + (r() - .5) * 90 + (ri % 2) * 40; out.push({ x, y: y + (r() - .5) * 24, r: rad * (.85 + r() * .3), hat: r() < .3 ? 1 + Math.floor(r() * 2) : 0, child: ri === 1 && i === 4, ph: r() * 6, row: ri, near }); } }); return out; })();
export function drawCrowd(g, C, st = {}) {
  const laugh = st.laugh || 0, cheer = st.cheer || 0, t = st.t || 0, K = scaleOf(C);
  g.save(); set(g, C);
  for (const h of HEADS) {
    const bob = Math.sin(t * 2.2 + h.ph) * 4 * laugh + Math.abs(Math.sin(t * 5 + h.ph)) * 10 * cheer, tilt = Math.sin(t * 1.4 + h.ph) * .12 * laugh;
    g.save(); g.translate(h.x, h.y + bob); g.rotate(tilt);
    g.fillStyle = h.near ? '#070303' : '#0b0605';
    if (h.near) g.filter = 'blur(2.5px)';
    g.beginPath(); g.ellipse(0, 0, h.r * .82, h.r, 0, 0, 7); g.fill();
    g.beginPath(); g.ellipse(0, h.r * 1.3, h.r * 1.9, h.r * .95, 0, 0, 7); g.fill();
    if (h.hat === 1) { g.beginPath(); g.ellipse(0, -h.r * .7, h.r * 1.25, h.r * .3, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(0, -h.r * .9, h.r * .6, h.r * .45, 0, 0, 7); g.fill(); }
    if (h.hat === 2) { g.beginPath(); g.arc(h.r * .1, -h.r * .95, h.r * .3, 0, 7); g.fill(); }
    if (h.child) { g.beginPath(); g.ellipse(h.r * .2, -h.r * 1.5, h.r * .55, h.r * .62, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(h.r * .2, -h.r * .7, h.r * .8, h.r * .6, 0, 0, 7); g.fill(); if (laugh > .3) { g.lineWidth = h.r * .22; g.strokeStyle = g.fillStyle; g.lineCap = 'round'; g.beginPath(); g.moveTo(h.r * .5, -h.r * 1.0); g.lineTo(h.r * 1.3, -h.r * 1.9 - laugh * 6); g.stroke(); } }
    if (cheer > 0) { const a = cheer * (1 + .25 * Math.sin(t * 6 + h.ph)); g.lineWidth = h.r * .32; g.strokeStyle = g.fillStyle; g.lineCap = 'round'; for (const s of [-1, 1]) { if (s > 0 && h.ph > 4) continue; g.beginPath(); g.moveTo(s * h.r * 1.2, h.r * 1.2); g.lineTo(s * h.r * (1.4 + .3 * a), h.r * 1.2 - a * h.r * 3.4); g.stroke(); g.beginPath(); g.arc(s * h.r * (1.4 + .3 * a), h.r * 1.2 - a * h.r * 3.4, h.r * .28, 0, 7); g.fill(); } }
    g.restore();
  }
  // warm rims on the row nearest the stage (light from the screen)
  g.globalCompositeOperation = 'lighter';
  for (const h of HEADS) if (h.row === 2) { const bob = Math.sin(t * 2.2 + h.ph) * 4 * laugh + Math.abs(Math.sin(t * 5 + h.ph)) * 10 * cheer; const gr = g.createRadialGradient(h.x, h.y + bob - h.r * .6, h.r * .5, h.x, h.y + bob - h.r * .6, h.r * 1.1); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(.75, 'rgba(255,160,80,.22)'); gr.addColorStop(1, 'rgba(255,160,80,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(h.x, h.y + bob, h.r * .82, h.r, 0, 0, 7); g.fill(); }
  g.restore();
}
// Oil lamp (front layer): hanging dish lamp. x,y = the bowl centre in world; s scale; flame on the glow layer. hang = chain length above
export function drawLamp(g, glow, C, x, y, s, t, lit = 1, hang = 70, opt = {}) {
  const [vx, vy] = ap(C, x, y), K = scaleOf(C) * s;
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.translate(vx, vy); g.scale(K, K);
  g.fillStyle = '#120806'; g.strokeStyle = '#120806'; g.lineCap = 'round'; g.lineJoin = 'round';
  // chain / handle
  g.lineWidth = 2.6; g.beginPath(); g.moveTo(-26, -6); g.lineTo(0, -hang); g.lineTo(26, -6); g.stroke();
  if (hang > 20) { g.beginPath(); g.moveTo(0, -hang); g.lineTo(0, -hang - 40); g.stroke(); }
  // dish with a spout at the right
  g.beginPath(); g.moveTo(-36, -6); g.quadraticCurveTo(-34, 14, 0, 16); g.quadraticCurveTo(34, 14, 38, -6); g.lineTo(48, -10); g.lineTo(42, -4); g.lineTo(28, -2); g.lineTo(-28, -2); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(-6, 16); g.lineTo(6, 16); g.lineTo(7, 40); g.lineTo(-7, 40); g.closePath(); g.fill();
  g.beginPath(); g.ellipse(0, 40, 18, 6, 0, 0, 7); g.fill();
  g.lineWidth = 3; g.beginPath(); g.moveTo(36, -6); g.lineTo(44, -12); g.stroke();   // wick
  // warm rim on the lit side
  if (lit > 0) { g.globalCompositeOperation = 'lighter'; g.strokeStyle = `rgba(255,170,90,${.5 * lit})`; g.lineWidth = 1.6; g.beginPath(); g.moveTo(-34, -5); g.quadraticCurveTo(-32, 12, 0, 14); g.quadraticCurveTo(30, 12, 36, -5); g.stroke(); }
  g.restore();
  if (lit > 0) drawFlame(glow, vx + 44 * K, vy - 14 * K, K, t, lit, opt.gutter || 0);
}
export function drawFlame(glow, gx, gy, s, t, a = 1, gutter = 0) {
  if (a <= 0) return;
  const f = (1 + .08 * Math.sin(t * 31) + .06 * vnoise(t * 9) - .03) * (1 - gutter * .5 * Math.abs(Math.sin(t * 47))), sw = (vnoise(t * 5 + 3) - .5) * 5 * s * (1 + gutter * 3);
  const g = glow; g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'lighter'; g.globalAlpha = a;
  let gr = g.createRadialGradient(gx, gy - 18 * s, 0, gx, gy - 18 * s, 220 * s); gr.addColorStop(0, 'rgba(255,190,110,.5)'); gr.addColorStop(.25, 'rgba(255,150,70,.16)'); gr.addColorStop(1, 'rgba(255,120,40,0)');
  g.fillStyle = gr; g.fillRect(gx - 220 * s, gy - 240 * s, 440 * s, 440 * s);
  g.beginPath(); g.moveTo(gx - 7 * s, gy); g.quadraticCurveTo(gx - 9 * s, gy - 18 * s * f, gx + sw, gy - 40 * s * f); g.quadraticCurveTo(gx + 9 * s, gy - 18 * s * f, gx + 7 * s, gy); g.closePath();
  gr = g.createLinearGradient(0, gy, 0, gy - 40 * s); gr.addColorStop(0, 'rgba(120,150,255,.7)'); gr.addColorStop(.18, 'rgba(255,240,200,1)'); gr.addColorStop(.6, 'rgba(255,190,90,.95)'); gr.addColorStop(1, 'rgba(255,120,40,.2)');
  g.fillStyle = gr; g.fill();
  g.restore();
}
// match: a stick with a small flame, drawn on the front (stick) and glow (flame) layers; a = flame strength
export function drawMatch(g, glow, C, x, y, ang, s, t, a) {
  const [vx, vy] = ap(C, x, y), K = scaleOf(C) * s;
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.translate(vx, vy); g.rotate(ang); g.scale(K, K);
  g.strokeStyle = '#2a1a10'; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -52); g.stroke();
  g.fillStyle = '#3a1a10'; g.beginPath(); g.ellipse(0, -54, 3.6, 5, 0, 0, 7); g.fill();
  g.restore();
  if (a > 0) { const tip = [vx + Math.sin(-ang) * 0 - Math.sin(ang) * -56 * K, vy + Math.cos(ang) * -56 * K]; drawFlame(glow, tip[0], tip[1], K * .55, t * 1.3, a, .4); }
}
// phone torch / screen glow on the glow layer
export function phoneGlow(glow, C, x, y, s, a, torch = 0) {
  if (a <= 0) return;
  const [vx, vy] = ap(C, x, y), K = scaleOf(C) * s, g = glow;
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'lighter';
  let gr = g.createRadialGradient(vx, vy, 0, vx, vy, (120 + torch * 260) * K); gr.addColorStop(0, `rgba(190,215,255,${.5 * a})`); gr.addColorStop(.3, `rgba(150,180,240,${.14 * a})`); gr.addColorStop(1, 'rgba(120,160,255,0)');
  g.fillStyle = gr; g.fillRect(vx - 400 * K, vy - 400 * K, 800 * K, 800 * K);
  g.restore();
}
// dark backstage surround (front layer): the dark room beyond the pillars, with a soft gradient toward the lamp
export function drawBackRoom(g, C, lampV, k = 1) {
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  const gr = g.createRadialGradient(lampV[0], lampV[1], 100, lampV[0], lampV[1], 1500); gr.addColorStop(0, `rgba(10,5,3,0)`); gr.addColorStop(1, `rgba(6,3,2,${.75 * k})`);
  g.fillStyle = gr; g.fillRect(0, 0, W, H); g.restore();
}
// rods (soft, off the cloth): pts = anchors on the puppet (viewport), ends = butts (viewport)
export function drawRods(g, pts, ends, blur = 2.5, alpha = .66, w = 3.4) {
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'multiply'; g.filter = `blur(${blur}px)`; g.globalAlpha = alpha;
  pts.forEach((p, i) => { const e = ends[i]; if (!e) return; g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(e[0], e[1]); g.strokeStyle = '#2a1a10'; g.lineWidth = i === 0 ? w * 1.25 : w; g.lineCap = 'round'; g.stroke(); g.beginPath(); g.arc(p[0], p[1], w * 1.1, 0, Math.PI * 2); g.fillStyle = '#2a1a10'; g.fill(); });
  g.restore();
}
// storyteller's placard (front layer, viewport): Noto Serif SC 600 44 px, cream on dark lacquer, a small seal
export function drawPlacard(g, text, a = 1, slide = 0, y0 = 1080 - 60) {
  if (!text || a <= 0) return;
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = a;
  g.font = '600 44px "Noto Serif SC"'; g.letterSpacing = '3px';
  const tw = g.measureText(text).width, seal = 44, padL = 20, padR = 34, gap = 18;
  const w = padL + seal + gap + tw + padR, h = 70, x = 960 - w / 2, y = y0 - h + slide * 18;
  g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = 18; g.shadowOffsetY = 4;
  const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, 'rgba(46,22,14,.93)'); gr.addColorStop(.5, 'rgba(30,14,9,.93)'); gr.addColorStop(1, 'rgba(22,10,7,.93)');
  g.fillStyle = gr; rr(g, x, y, w, h, 6); g.fill(); g.shadowColor = 'transparent';
  g.strokeStyle = 'rgba(168,129,63,.8)'; g.lineWidth = 1.5; rr(g, x + 6, y + 6, w - 12, h - 12, 3); g.stroke();
  const sx = x + padL, sy = y + (h - seal) / 2;
  g.fillStyle = '#b3261b'; rr(g, sx, sy, seal, seal, 4); g.fill();
  g.strokeStyle = 'rgba(255,220,190,.55)'; g.lineWidth = 1.2; rr(g, sx + 3.5, sy + 3.5, seal - 7, seal - 7, 2); g.stroke();
  g.font = '400 30px "Ma Shan Zheng"'; g.letterSpacing = '0px'; g.fillStyle = '#f6dcc0'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('说', sx + seal / 2, sy + seal / 2 + 2);
  g.font = '600 44px "Noto Serif SC"'; g.letterSpacing = '3px'; g.fillStyle = '#f3e2bf'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(text, sx + seal + gap, y + h / 2 + 1);
  g.restore();
  return { x0: x, y0: y, x1: x + w, y1: y + h };
}
function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
