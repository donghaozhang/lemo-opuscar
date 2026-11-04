// The people backstage: 爷爷 the master and 小满 the boy, carved like the show puppets but with expression pieces that turn, slide or swap
// (brow on a rivet, a sliding lid, a sliding pupil, a swapped mouth strip). World units; built seated, facing right, hips at the origin; flipped by the pose.
import { piece, fill, cut, cutLine, ink, within, smooth, poly, scalesOpen, lattice, coin, cloud, beads, beadLine, plum, meander, cutTaper, DYE } from './carve.js';
import { mul, T, R, S, ap, set, dp, ik, ribbon, rivet, scaleOf } from './rig.js';
import { clamp } from '/core/lib.js';

const GREY = '#8d8275';
// ================= the master =================
export const GJ = { neck: [30, -200], shF: [34, -184], shB: [-8, -190], elbow: [0, 125], wrist: [0, 115], hipF: [8, 0], knee: [168, 12], beard: [42, -16] };
const GUA = 125, GFA = 115, GHR = 30;
function masterHead() {
  return piece([-78, -150, 86, 24], g => {
    // skullcap (felt, ink) with a carved band; hair wisps at the back
    const cap = q => smooth(q, [[-44, -84], [-40, -108], [-20, -126], [10, -130], [40, -122], [52, -104], [50, -88], [30, -92], [0, -96], [-24, -92]]);
    fill(g, DYE.ink, cap); within(g, cap, () => { meander(g, -40, -90, 48, 4.2, 1.1); for (let k = 0; k < 5; k++) cutLine(g, 1, q => { q.moveTo(-30 + k * 14, -110); q.quadraticCurveTo(-24 + k * 14, -120, -16 + k * 14, -112); }); });
    ink(g, 2, cap);
    // the back of the head and the ear
    const back = q => smooth(q, [[-40, -86], [-50, -70], [-50, -46], [-40, -24], [-28, -10], [-12, -6], [-10, -24], [-14, -50], [-16, -74]]);
    fill(g, DYE.ink, back); within(g, back, () => { for (let k = 0; k < 6; k++) cutLine(g, .9, q => { q.moveTo(-18 - k * 3, -70 + k * 4); q.quadraticCurveTo(-36 - k * 2, -56 + k * 6, -30 - k * 2, -30 + k * 6); }); });
    const ear = q => smooth(q, [[-16, -70], [-30, -74], [-36, -58], [-30, -42], [-18, -42]]);
    fill(g, DYE.skin, ear); within(g, ear, () => { cutLine(g, 1.2, q => { q.moveTo(-28, -68); q.quadraticCurveTo(-32, -56, -24, -48); }); }); ink(g, 1.6, ear);
    // open-cut face: the profile is a hide strip; the inside stays a hole
    const face = q => smooth(q, [[-10, -8], [8, -4], [24, -8], [34, -20], [38, -34], [48, -46], [54, -56], [50, -62], [40, -64], [36, -76], [30, -88], [22, -96], [6, -98], [-12, -92], [-16, -70], [-14, -40], [-12, -24]]);
    ink(g, 2.8, face);
    // wrinkles and the nose line, thin ink strips inside the hole
    ink(g, 1.2, q => { q.moveTo(40, -46); q.quadraticCurveTo(30, -36, 30, -28); });            // nasolabial
    ink(g, 1.1, q => { q.moveTo(14, -70); q.lineTo(6, -72); q.moveTo(14, -66); q.lineTo(7, -64); });   // crow's feet
    ink(g, 1.1, q => { q.moveTo(8, -84); q.quadraticCurveTo(18, -88, 28, -84); });              // forehead line
    ink(g, 1.4, q => { q.moveTo(43, -48); q.quadraticCurveTo(50, -50, 48, -56); });             // nostril
    ink(g, 1.3, q => { q.moveTo(36, -26); q.lineTo(26, -24); });                                 // lip line (upper)
    // eye ring (the almond outline) as a thin strip; the pupil, lid and brow are drawn live
    g.save(); g.lineWidth = 1.5; g.strokeStyle = DYE.ink; g.beginPath(); g.ellipse(26, -62, 11, 5.4, -.08, 0, Math.PI * 2); g.stroke(); g.restore();
  }, { seed: 61, ss: 5 });
}
function masterTorso() {
  return piece([-70, -245, 90, 20], g => {
    const j = q => smooth(q, [[-40, 14], [-56, -60], [-58, -130], [-44, -180], [-16, -202], [22, -206], [46, -196], [60, -170], [62, -120], [58, -60], [54, 12]]);
    fill(g, DYE.teal, j);
    within(g, j, () => { lattice(g, -60, -150, 64, 10, 12, 2.6); for (let y = -190; y > -200; y -= 4) cutLine(g, 1, q => { q.moveTo(-20, y); q.lineTo(30, y); }); for (let y = -170; y < 0; y += 24) { coin(g, 40, y, 4.2); } });
    g.save(); g.beginPath(); j(g); g.clip(); ink(g, 8, j, DYE.hide2); g.restore();
    const neck = q => poly(q, [[6, -196], [40, -200], [44, -232], [12, -236]]); fill(g, DYE.skin, neck); ink(g, 1.8, neck);
    const collar = q => smooth(q, [[-10, -204], [26, -208], [44, -198], [36, -186], [10, -180], [-14, -186]]);
    fill(g, DYE.hide, collar); ink(g, 1.6, collar);
    ink(g, 2.2, j);
  }, { seed: 62 });
}
function masterLap() {    // thighs forward to the knee, seated
  return piece([-30, -30, 200, 60], g => {
    const l = q => smooth(q, [[-20, -14], [40, -24], [120, -22], [180, -10], [190, 30], [120, 44], [40, 40], [-24, 30]]);
    fill(g, DYE.teal, l); within(g, l, () => lattice(g, -20, -20, 190, 44, 12, 2.6)); ink(g, 2.2, l);
  }, { seed: 63 });
}
function masterShin() {   // from the knee down to the floor, a cloth shoe
  return piece([-30, -10, 40, 220], g => {
    const s = q => smooth(q, [[-18, 0], [20, 0], [18, 100], [14, 180], [-14, 182], [-18, 100]]);
    fill(g, DYE.teal, s); within(g, s, () => { for (let y = 20; y < 170; y += 20) cutLine(g, 1.4, q => { q.moveTo(-14, y); q.lineTo(14, y); }); }); ink(g, 2, s);
    const shoe = q => smooth(q, [[-16, 178], [16, 176], [34, 190], [36, 204], [-16, 206]]);
    fill(g, DYE.ink, shoe); within(g, shoe, () => cutLine(g, 1.2, q => { q.moveTo(-12, 192); q.lineTo(28, 194); })); ink(g, 1.6, shoe);
  }, { seed: 64 });
}
function masterUA() { return piece([-34, -34, 34, 150], g => { const s = q => smooth(q, [[-24, 0], [24, 0], [26, 70], [22, 124], [-22, 124], [-26, 70]]); fill(g, DYE.hide, s); within(g, s, () => { for (let y = 20; y < 120; y += 18) cutLine(g, 1.6, q => { q.moveTo(-22, y); q.quadraticCurveTo(0, y + 6, 22, y); }); }); ink(g, 2.2, s); const sh = q => q.arc(0, 0, 19, 0, 7); fill(g, DYE.teal, sh); cloud(g, 0, 0, 11, 0, 1.6); ink(g, 2, sh); }, { seed: 65 }); }
function masterFA() { return piece([-30, -30, 30, 150], g => { fill(g, DYE.hide, q => q.arc(0, 0, 20, 0, 7)); ink(g, 1.8, q => q.arc(0, 0, 20, 0, 7)); const s = q => smooth(q, [[-20, 6], [20, 6], [24, 60], [26, 110], [-26, 112], [-24, 60]]); fill(g, DYE.hide, s); within(g, s, () => { for (let y = 24; y < 100; y += 18) cutLine(g, 1.6, q => { q.moveTo(-22, y); q.quadraticCurveTo(0, y + 6, 22, y); }); }); ink(g, 2.2, s); const cuff = q => poly(q, [[-26, 100], [26, 100], [28, 122], [-28, 122]]); fill(g, DYE.teal, cuff); within(g, cuff, () => meander(g, -24, 116, 26, 4, 1.2)); ink(g, 1.8, cuff); }, { seed: 66 }); }
// hands: wrist at the origin, fingers toward +y. 'grip' = fist around a rod (rod runs along +x through the fist), 'open' = fingers spread, 'pinch'
function hand(kind, K = 1) {
  return piece([-40 * K, -14 * K, 46 * K, 86 * K], g => {
    g.scale(K, K);
    if (kind === 'grip') {
      const p = q => smooth(q, [[-18, -2], [18, -2], [26, 14], [28, 40], [20, 56], [-2, 60], [-20, 50], [-24, 24]]);
      fill(g, DYE.skin, p);
      within(g, p, () => { for (let k = 0; k < 4; k++) cutLine(g, 1.4, q => { q.moveTo(-14 + k * 10, 24); q.quadraticCurveTo(-10 + k * 10, 40, -16 + k * 10, 54); }); cutLine(g, 1.2, q => { q.moveTo(-22, 20); q.quadraticCurveTo(-4, 10, 8, 20); }); });
      ink(g, 2, p);
      const th = q => smooth(q, [[-16, 4], [-30, 14], [-34, 30], [-26, 38], [-18, 26]]); fill(g, DYE.skin, th); ink(g, 1.8, th);
    } else if (kind === 'open') {
      const p = q => smooth(q, [[-16, -2], [16, -2], [22, 14], [22, 34], [4, 40], [-14, 36], [-20, 18]]);
      fill(g, DYE.skin, p); ink(g, 2, p);
      [[-14, 34, -.5], [-2, 38, -.2], [10, 36, .1], [20, 30, .4]].forEach(([x, y, a], i) => { const L = i === 3 ? 30 : 40 - Math.abs(i - 1.5) * 4; const f = q => { q.moveTo(x - 5, y); q.lineTo(x - 4 + Math.sin(a) * L, y + Math.cos(a) * L); q.lineTo(x + 4 + Math.sin(a) * L, y + Math.cos(a) * L); q.lineTo(x + 5, y); q.closePath(); }; fill(g, DYE.skin, f); ink(g, 1.6, f); cutLine(g, 1, q => { q.moveTo(x - 3 + Math.sin(a) * L * .5, y + Math.cos(a) * L * .5); q.lineTo(x + 3 + Math.sin(a) * L * .5, y + Math.cos(a) * L * .5 + 1); }); });
      const th = q => smooth(q, [[-16, 4], [-32, 12], [-38, 28], [-30, 34], [-20, 24]]); fill(g, DYE.skin, th); ink(g, 1.8, th);
    } else {   // pinch
      const p = q => smooth(q, [[-16, -2], [16, -2], [22, 14], [22, 34], [6, 44], [-10, 40], [-20, 18]]);
      fill(g, DYE.skin, p); ink(g, 2, p);
      const f = q => smooth(q, [[-2, 36], [10, 34], [26, 54], [22, 64], [8, 54]]); fill(g, DYE.skin, f); ink(g, 1.6, f);
      const th = q => smooth(q, [[-16, 4], [-30, 16], [-20, 46], [-6, 60], [2, 54], [-10, 40], [-14, 20]]); fill(g, DYE.skin, th); ink(g, 1.8, th);
      for (let k = 0; k < 2; k++) cutLine(g, 1.2, q => { q.moveTo(0 + k * 8, 28); q.quadraticCurveTo(4 + k * 8, 36, -2 + k * 8, 40); });
    }
  }, { seed: 67 + (kind === 'grip' ? 0 : kind === 'open' ? 1 : 2) });
}
let GP = null;
export function buildMaster() { if (GP) return GP; GP = { head: masterHead(), torso: masterTorso(), lap: masterLap(), shin: masterShin(), ua: masterUA(), fa: masterFA(), grip: hand('grip'), open: hand('open'), pinch: hand('pinch') }; return GP; }

// ================= the boy =================
export const BJ = { neck: [22, -134], shF: [26, -122], shB: [-4, -126], elbow: [0, 84], wrist: [0, 78], knee: [120, 6], tuft: [-30, -116] };
const BUA = 84, BFA = 78, BHR = 24;
function boyHead() {
  return piece([-70, -140, 70, 26], g => {
    // hair: ink, round, with a parting cut and the tuft base
    const hair = q => smooth(q, [[-46, -40], [-54, -70], [-46, -100], [-24, -118], [6, -122], [34, -112], [44, -96], [30, -98], [8, -102], [-14, -96], [-30, -80], [-34, -56], [-36, -36]]);
    fill(g, DYE.ink, hair); within(g, hair, () => { for (let k = 0; k < 7; k++) cutLine(g, .9, q => { q.moveTo(-20 + k * 7, -116); q.quadraticCurveTo(-30 + k * 6, -100, -28 + k * 5, -70); }); });
    const face = q => smooth(q, [[-20, -4], [4, 6], [22, 2], [36, -12], [40, -30], [46, -44], [48, -52], [42, -58], [40, -72], [34, -88], [20, -100], [0, -104], [-20, -98], [-32, -78], [-36, -50], [-34, -24]]);
    ink(g, 2.8, face);
    const ear = q => smooth(q, [[-30, -72], [-44, -76], [-50, -60], [-44, -46], [-32, -44]]);
    fill(g, DYE.skin, ear); within(g, ear, () => cutLine(g, 1.2, q => { q.moveTo(-42, -70); q.quadraticCurveTo(-46, -58, -38, -50); })); ink(g, 1.6, ear);
    ink(g, 1.3, q => { q.moveTo(38, -44); q.quadraticCurveTo(44, -46, 43, -52); });      // nostril
    ink(g, 1.3, q => { q.moveTo(32, -24); q.lineTo(24, -22); });                          // lip line
    g.save(); g.lineWidth = 1.5; g.strokeStyle = DYE.ink; g.beginPath(); g.ellipse(22, -60, 12, 7, -.05, 0, Math.PI * 2); g.stroke(); g.restore();
    fill(g, DYE.red, q => q.arc(14, -36, 5, 0, 7));   // a round cheek mark (a dyed patch)
  }, { seed: 71, ss: 5 });
}
function boyTorso() {
  return piece([-56, -170, 70, 20], g => {
    const j = q => smooth(q, [[-34, 12], [-46, -50], [-44, -100], [-30, -130], [-4, -142], [26, -142], [46, -128], [52, -96], [48, -50], [44, 12]]);
    fill(g, DYE.jade, j); within(g, j, () => { for (let y = -120; y < 10; y += 16) for (let x = -40 + (y / 16 % 2) * 8; x < 50; x += 16) plum(g, x, y, 3); });
    ink(g, 2.2, j);
    const neckB = q => poly(q, [[4, -136], [34, -138], [36, -162], [8, -164]]); fill(g, DYE.skin, neckB); ink(g, 1.6, neckB);
    const scarf = q => smooth(q, [[-20, -142], [30, -146], [44, -130], [30, -112], [20, -90], [8, -112], [-14, -118]]);
    fill(g, DYE.yellow, scarf); within(g, scarf, () => { for (let k = 0; k < 4; k++) cutLine(g, 1.2, q => { q.moveTo(-10 + k * 10, -140); q.lineTo(-4 + k * 10, -116); }); }); ink(g, 1.8, scarf);
    const pocket = q => poly(q, [[14, -40], [44, -42], [42, -8], [12, -6]]);
    ink(g, 1.6, pocket);
  }, { seed: 72 });
}
function boyLap() { return piece([-30, -30, 150, 50], g => { const l = q => smooth(q, [[-16, -12], [40, -20], [100, -18], [136, -8], [140, 24], [100, 36], [40, 34], [-20, 26]]); fill(g, DYE.teal, l); within(g, l, () => lattice(g, -20, -20, 140, 36, 10, 2.2)); ink(g, 2, l); }, { seed: 73 }); }
function boyShin() { return piece([-24, -10, 36, 150], g => { const s = q => smooth(q, [[-14, 0], [16, 0], [14, 70], [10, 110], [-10, 112], [-14, 70]]); fill(g, DYE.teal, s); within(g, s, () => { for (let y = 16; y < 100; y += 16) cutLine(g, 1.2, q => { q.moveTo(-10, y); q.lineTo(10, y); }); }); ink(g, 1.8, s); const shoe = q => smooth(q, [[-12, 110], [12, 108], [26, 120], [26, 132], [-12, 134]]); fill(g, DYE.red, shoe); within(g, shoe, () => cutLine(g, 1, q => { q.moveTo(-8, 122); q.lineTo(20, 124); })); ink(g, 1.5, shoe); }, { seed: 74 }); }
function boyUA() { return piece([-26, -26, 26, 100], g => { const s = q => smooth(q, [[-18, 0], [18, 0], [19, 50], [16, 84], [-16, 84], [-19, 50]]); fill(g, DYE.jade, s); within(g, s, () => { for (let y = 14; y < 80; y += 14) cutLine(g, 1.4, q => { q.moveTo(-16, y); q.quadraticCurveTo(0, y + 5, 16, y); }); }); ink(g, 2, s); const sh = q => q.arc(0, 0, 19, 0, 7); fill(g, DYE.yellow, sh); cloud(g, 0, 0, 10, 0, 1.5); ink(g, 1.8, sh); }, { seed: 75 }); }
function boyFA() { return piece([-24, -24, 24, 100], g => { fill(g, DYE.jade, q => q.arc(0, 0, 15, 0, 7)); ink(g, 1.6, q => q.arc(0, 0, 15, 0, 7)); const s = q => smooth(q, [[-15, 4], [15, 4], [18, 44], [19, 76], [-19, 78], [-18, 44]]); fill(g, DYE.jade, s); within(g, s, () => { for (let y = 18; y < 70; y += 14) cutLine(g, 1.4, q => { q.moveTo(-16, y); q.quadraticCurveTo(0, y + 5, 16, y); }); }); ink(g, 2, s); const cuff = q => poly(q, [[-19, 66], [19, 66], [20, 82], [-20, 82]]); fill(g, DYE.yellow, cuff); ink(g, 1.6, cuff); }, { seed: 76 }); }
let BP = null;
export function buildBoy() { if (BP) return BP; BP = { head: boyHead(), torso: boyTorso(), lap: boyLap(), shin: boyShin(), ua: boyUA(), fa: boyFA(), grip: hand('grip', .72), open: hand('open', .72), pinch: hand('pinch', .72) }; return BP; }

// ================= live expression features (drawn inside the face hole, head-local coordinates) =================
// e = {brow (rad, + = back end up = anger/resolve, − = worried), browY (px raised), lid 0..1, pupil [dx,dy], mouth name}
const EYES = { master: { cx: 26, cy: -62, rx: 11, ry: 5.4, browX: 36, browY: -74, browL: 24, mouthX: 36, mouthY: -26 }, boy: { cx: 22, cy: -60, rx: 12, ry: 7, browX: 34, browY: -74, browL: 24, mouthX: 32, mouthY: -24 } };
export function drawFace(g, Mhead, who, e, K) {
  const E = EYES[who], M = Mhead;
  g.save(); g.globalCompositeOperation = 'multiply'; set(g, M);
  g.fillStyle = DYE.ink; g.strokeStyle = DYE.ink; g.lineCap = 'round';
  // pupil (clipped to the eye) and the lid (a dark cap sliding down)
  g.save(); g.beginPath(); g.ellipse(E.cx, E.cy, E.rx, E.ry, -.08, 0, Math.PI * 2); g.clip();
  const px = E.cx + clamp(e.pupil?.[0] ?? 0, -6, 6) + 1.5, py = E.cy + clamp(e.pupil?.[1] ?? 0, -3, 3);
  g.beginPath(); g.arc(px, py, who === 'boy' ? 4.2 : 3.6, 0, Math.PI * 2); g.fill();
  const lid = clamp(e.lid ?? 0, 0, 1);
  if (lid > 0) { g.beginPath(); g.rect(E.cx - E.rx - 2, E.cy - E.ry - 2, E.rx * 2 + 4, 2 + lid * (E.ry * 2 + 2)); g.fill(); }
  g.restore();
  if (lid > .05) { g.lineWidth = 1.6; g.beginPath(); const yy = E.cy - E.ry + lid * E.ry * 2; g.moveTo(E.cx - E.rx, yy); g.quadraticCurveTo(E.cx, yy + (1 - lid) * 2, E.cx + E.rx, yy); g.stroke(); }
  // brow: a tapered strip, pivot at the front end
  g.save(); g.translate(E.browX, E.browY - (e.browY ?? 0)); g.rotate(e.brow ?? 0);
  g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(-E.browL * .5, -4.5, -E.browL, -1); g.lineTo(-E.browL, 1.6); g.quadraticCurveTo(-E.browL * .5, -1.2, 0, 2.4); g.closePath(); g.fill();
  g.restore();
  // mouth
  const mx = E.mouthX, my = E.mouthY, m = e.mouth || 'line';
  g.lineWidth = 1.8;
  if (m === 'line') { g.beginPath(); g.moveTo(mx, my); g.lineTo(mx - 12, my + 1); g.stroke(); }
  else if (m === 'smile') { g.beginPath(); g.moveTo(mx, my); g.quadraticCurveTo(mx - 8, my + 4, mx - 16, my - 4); g.stroke(); g.beginPath(); g.moveTo(mx - 20, my - 12); g.quadraticCurveTo(mx - 24, my - 4, mx - 20, my + 2); g.stroke(); }
  else if (m === 'grin') { g.beginPath(); g.moveTo(mx + 1, my - 1); g.quadraticCurveTo(mx - 8, my + 7, mx - 18, my - 4); g.quadraticCurveTo(mx - 8, my + 2, mx + 1, my - 1); g.fill(); g.beginPath(); g.moveTo(mx - 22, my - 12); g.quadraticCurveTo(mx - 26, my - 4, mx - 22, my + 2); g.stroke(); }
  else if (m === 'open') { g.beginPath(); g.moveTo(mx + 1, my - 3); g.quadraticCurveTo(mx - 6, my - 2, mx - 10, my + 2); g.quadraticCurveTo(mx - 6, my + 12, mx + 2, my + 8); g.closePath(); g.fill(); }
  else if (m === 'o') { g.beginPath(); g.ellipse(mx - 3, my + 2, 3.2, 4.6, 0, 0, Math.PI * 2); g.fill(); }
  else if (m === 'grim') { g.lineWidth = 2.4; g.beginPath(); g.moveTo(mx + 1, my); g.lineTo(mx - 16, my - 1); g.stroke(); g.lineWidth = 1.2; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(mx - 2 - k * 4, my - 3); g.lineTo(mx - 2 - k * 4, my + 2); g.stroke(); } }
  else if (m === 'down') { g.beginPath(); g.moveTo(mx + 1, my - 2); g.quadraticCurveTo(mx - 8, my - 4, mx - 14, my + 4); g.stroke(); }
  else if (m === 'tongue') { g.beginPath(); g.moveTo(mx + 1, my - 1); g.lineTo(mx - 12, my); g.stroke(); g.fillStyle = DYE.red; g.beginPath(); g.ellipse(mx + 1, my + 5, 3.4, 5, .5, 0, Math.PI * 2); g.fill(); g.strokeStyle = DYE.ink; g.lineWidth = 1.1; g.stroke(); }
  g.restore();
}

// ================= pose → draw =================
// pose (both): {x, y, flip, rot (torso), head, hF:[dx,dy] from shF, hB, bendF, bendB, haF, haB, handF: 'grip'|'open'|'pinch', handB, shin (angle), lean, expr:{...}, beard:[...]}
export const GREST = { x: 0, y: 0, flip: -1, rot: .06, head: 0, hF: [150, 60], hB: [130, 90], bendF: 1, bendB: 1, haF: 0, haB: 0, handF: 'grip', handB: 'grip', shin: 0, expr: { brow: 0, browY: 0, lid: .15, pupil: [0, 0], mouth: 'line' }, beard: null };
export function drawMaster(g, Cam, pose, opt = {}) {
  const P = buildMaster(), p = { ...GREST, ...pose };
  const MW = mul(mul(T(p.x, p.y), S(p.flip, 1)), R(p.rot)), W = mul(Cam, MW), K = scaleOf(Cam);
  const sF = ap(MW, ...GJ.shF), sB = ap(MW, ...GJ.shB);
  const tF = ap(MW, GJ.shF[0] + p.hF[0], GJ.shF[1] + p.hF[1]), tB = ap(MW, GJ.shB[0] + p.hB[0], GJ.shB[1] + p.hB[1]);
  const [aF1, aF2] = ik(sF, tF, GUA, GFA + GHR, p.bendF * p.flip), [aB1, aB2] = ik(sB, tB, GUA, GFA + GHR, p.bendB * p.flip);
  const armM = (s, a1, a2, ha) => { const Mu = mul(Cam, mul(T(...s), R(a1))); const Mf = mul(Mu, mul(T(...GJ.elbow), R(a2 - a1))); const Mh = mul(Mf, mul(T(...GJ.wrist), R(ha))); return [Mu, Mf, Mh]; };
  const [MuF, MfF, MhF] = armM(sF, aF1, aF2, p.haF), [MuB, MfB, MhB] = armM(sB, aB1, aB2, p.haB);
  const Mroot = mul(Cam, mul(T(p.x, p.y), S(p.flip, 1)));     // hips (the lap does not rotate with the torso)
  const stA = (p.stand || 0) * Math.PI / 2 + (p.lapA || 0);
  const Mlap = mul(Mroot, R(stA)), Mshin = mul(Mlap, mul(T(...GJ.knee), R(p.shin - stA)));
  const Mhead = mul(W, mul(T(...GJ.neck), mul(S(p.headFlip || 1, 1), R(p.head))));
  g.save(); g.globalCompositeOperation = 'multiply'; if (opt.alpha != null) g.globalAlpha = opt.alpha;
  dp(g, MuB, P.ua); dp(g, MfB, P.fa); dp(g, MhB, P[p.handB]);
  dp(g, Mshin, P.shin); dp(g, Mlap, P.lap); dp(g, W, P.torso);
  // beard: three grey chains from the chin
  set(g, [1, 0, 0, 1, 0, 0]);
  const bb = ap(Mhead, ...GJ.beard), bd = p.beard || [], ha = p.rot + p.head;
  for (let k = 0; k < 3; k++) ribbon(g, [bb[0] - k * 9 * K * p.flip, bb[1] + k * 3 * K], Math.PI / 2 + (p.flip > 0 ? .3 : -.3) * (1 - k * .7) + ha * p.flip, 7, 12 * K, (k - 1) * .05 * p.flip, bd.map(v => v * p.flip), (6.5 - k * 1.2) * K, GREY, null, K, .8);
  dp(g, Mhead, P.head);
  drawFace(g, Mhead, 'master', p.expr, K);
  dp(g, MuF, P.ua); dp(g, MfF, P.fa); dp(g, MhF, P[p.handF]);
  g.restore();
  set(g, [1, 0, 0, 1, 0, 0]);
  const riv = [ap(W, ...GJ.neck), ap(W, ...GJ.shB), ap(W, ...GJ.shF), ap(MuB, ...GJ.elbow), ap(MfB, ...GJ.wrist), ap(MuF, ...GJ.elbow), ap(MfF, ...GJ.wrist), ap(Mlap, ...GJ.knee)];
  if (opt.rivets !== false) for (const q of riv) rivet(g, q[0], q[1], 3.6 * K);
  // grips: where a rod leaves the fist (viewport)
  return { gripF: ap(MhF, 0, 30), gripB: ap(MhB, 0, 30), M: { W, Mhead, MhF, MhB }, head: ap(Mhead, 10, -60) };
}
export const BREST = { x: 0, y: 0, flip: -1, rot: 0, head: 0, hF: [90, 70], hB: [80, 80], bendF: 1, bendB: 1, haF: 0, haB: 0, handF: 'open', handB: 'open', shin: .2, expr: { brow: 0, browY: 0, lid: 0, pupil: [0, 0], mouth: 'line' }, tuft: null };
export function drawBoy(g, Cam, pose, opt = {}) {
  const P = buildBoy(), p = { ...BREST, ...pose };
  const MW = mul(mul(T(p.x, p.y), S(p.flip, 1)), R(p.rot)), W = mul(Cam, MW), K = scaleOf(Cam);
  const sF = ap(MW, ...BJ.shF), sB = ap(MW, ...BJ.shB);
  const tF = ap(MW, BJ.shF[0] + p.hF[0], BJ.shF[1] + p.hF[1]), tB = ap(MW, BJ.shB[0] + p.hB[0], BJ.shB[1] + p.hB[1]);
  const [aF1, aF2] = ik(sF, tF, BUA, BFA + BHR, p.bendF * p.flip), [aB1, aB2] = ik(sB, tB, BUA, BFA + BHR, p.bendB * p.flip);
  const armM = (s, a1, a2, ha) => { const Mu = mul(Cam, mul(T(...s), R(a1))); const Mf = mul(Mu, mul(T(...BJ.elbow), R(a2 - a1))); const Mh = mul(Mf, mul(T(...BJ.wrist), R(ha))); return [Mu, Mf, Mh]; };
  const [MuF, MfF, MhF] = armM(sF, aF1, aF2, p.haF), [MuB, MfB, MhB] = armM(sB, aB1, aB2, p.haB);
  const stB = (p.stand || 0) * Math.PI / 2 + (p.lapA || 0);
  const Mroot = mul(Cam, mul(T(p.x, p.y), S(p.flip, 1))), MlapB = mul(Mroot, R(stB)), Mshin = mul(MlapB, mul(T(...BJ.knee), R(p.shin - stB)));
  const Mhead = mul(W, mul(T(...BJ.neck), mul(S(p.headFlip || 1, 1), R(p.head))));
  g.save(); g.globalCompositeOperation = 'multiply'; if (opt.alpha != null) g.globalAlpha = opt.alpha;
  dp(g, MuB, P.ua); dp(g, MfB, P.fa); dp(g, MhB, P[p.handB]);
  dp(g, Mshin, P.shin); dp(g, MlapB, P.lap); dp(g, W, P.torso);
  set(g, [1, 0, 0, 1, 0, 0]);
  const tb = ap(Mhead, ...BJ.tuft), td = p.tuft || [];
  ribbon(g, tb, (p.flip > 0 ? -1.9 : -1.25) + (p.rot + p.head) * p.flip, 5, 9 * K, -.22 * p.flip, td.map(v => v * p.flip), 3.6 * K, DYE.ink, null, K, .8);
  dp(g, Mhead, P.head);
  drawFace(g, Mhead, 'boy', p.expr, K);
  dp(g, MuF, P.ua); dp(g, MfF, P.fa); dp(g, MhF, P[p.handF]);
  g.restore();
  set(g, [1, 0, 0, 1, 0, 0]);
  const riv = [ap(W, ...BJ.neck), ap(W, ...BJ.shB), ap(W, ...BJ.shF), ap(MuB, ...BJ.elbow), ap(MfB, ...BJ.wrist), ap(MuF, ...BJ.elbow), ap(MfF, ...BJ.wrist), ap(MlapB, ...BJ.knee)];
  if (opt.rivets !== false) for (const q of riv) rivet(g, q[0], q[1], 3.2 * K);
  return { gripF: ap(MhF, 0, 22), gripB: ap(MhB, 0, 22), M: { W, Mhead, MhF, MhB }, head: ap(Mhead, 8, -60), pocket: ap(W, 28 * 1, -24) };
}
