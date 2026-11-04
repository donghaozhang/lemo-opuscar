// bgs.js — cached watercolour backgrounds: the lane (弄堂) with Wang's shop, and the kitchen stage. Painted once at 1.25×; they never boil.
// World units: lane x 0..4400, y −1100 (sky) .. 1150 (snowy ground at y=900); kitchen x 0..2600, y 0..1500 (floor line y=1180).
import * as T from './toon.js';
import { P } from './parts.js';
import { wash, makeBG, withCanvas } from './bgkit.js';
import { mulberry } from '/core/lib.js';
const { ell, arc, rr, rect, spline, quad } = T;

export const LANE = { ground: 900, shopX: 1000, doorX: 820, winX: 1240, lampX: 1880, chimX: 1150 };
export function paintLane() {
  const bg = makeBG(-200, -1150, 4600, 1200, 1.25);
  withCanvas(bg, (g, raw) => {
    // night sky (darkest background grey) with a few stars
    wash(rect(-210, -1160, 4820, 900), '#4A4B4D', { line: false, seed: 3, edge: 0 });
    raw(); const r = mulberry(9); for (let i = 0; i < 90; i++) { g.fillStyle = 'rgba(230,232,232,.55)'; g.beginPath(); g.arc(-200 + r() * 4800, -1140 + r() * 700, 1.5 + r() * 2, 0, 7); g.fill(); }
    // far rooftops (silhouettes, tiled)
    for (let i = 0; i < 9; i++) { const x = -200 + i * 560, h = 120 + (i % 3) * 40; wash([[x, -420], [x + 120, -420 - h], [x + 440, -420 - h], [x + 560, -420]], '#55575A', { seed: 20 + i, lw: 2.4 }); }
    // the row of lane houses: brick walls
    wash(rect(-210, -430, 4820, 1340), '#77797B', { seed: 5 });
    raw(); for (let y = -420; y < 880; y += 34) for (let x = -200 + ((y / 34) % 2) * 40; x < 4600; x += 80) { g.strokeStyle = 'rgba(30,30,32,.16)'; g.lineWidth = 2; g.strokeRect(x, y, 80, 34); }
    // roof eaves with tiles and snow
    wash(rect(-210, -470, 4820, 60), '#3E4042', { seed: 6 });
    for (let x = -200; x < 4600; x += 40) wash(arc(x + 20, -470, 20, 14, Math.PI, Math.PI * 2, 8), '#4C4E50', { seed: x, edge: 0, lw: 1.6 });
    wash(spline([[-210, -478], [800, -492], [2000, -484], [3200, -494], [4610, -480], [4610, -470], [-210, -470]], true, 4), '#D9DADA', { seed: 7, lw: 2 });
    // chimney above the shop
    wash(rect(1100, -720, 110, 250), '#5E6062', { seed: 8 }); wash(rect(1086, -740, 138, 30), '#45474A', { seed: 9 }); wash(rect(1088, -752, 134, 14), '#DADBDB', { seed: 10, lw: 2 });
    // stone-gate (石库门) door frames along the lane, with pediments
    const gate = (x, w, h) => {
      wash(rect(x - 30, 900 - h - 20, w + 60, h + 20), '#9C9E9F', { seed: x + 1 });
      wash(spline([[x - 50, 900 - h - 20], [x + w / 2, 900 - h - 120], [x + w + 50, 900 - h - 20]], true, 6), '#A9ABAC', { seed: x + 2 });
      wash(arc(x + w / 2, 900 - h - 40, w * .3, 50, Math.PI, Math.PI * 2, 10), '#8A8C8E', { seed: x + 3 });
      wash(rect(x, 900 - h, w, h), '#3A3C3E', { seed: x + 4 });
      wash(rect(x + 8, 900 - h + 8, w / 2 - 12, h - 16), '#47494B', { seed: x + 5, lw: 2 }); wash(rect(x + w / 2 + 4, 900 - h + 8, w / 2 - 12, h - 16), '#47494B', { seed: x + 6, lw: 2 });
      raw(); g.fillStyle = '#9C9E9F'; g.beginPath(); g.arc(x + w / 2 - 14, 900 - h / 2, 7, 0, 7); g.arc(x + w / 2 + 14, 900 - h / 2, 7, 0, 7); g.fill();
    };
    gate(-60, 200, 420); gate(2300, 220, 430); gate(3100, 210, 420); gate(3900, 220, 430);
    // WANG'S SHOP: a narrow shopfront: door (left), window (right), sign board above
    wash(rect(700, 360, 760, 540), '#86888A', { seed: 30 });
    // sign board 王记包子 (painted)
    wash(rr(760, 260, 640, 110, 10), '#2E3032', { seed: 31 });
    wash(rr(774, 272, 612, 86, 6), '#2E3032', { seed: 32, edge: 0, lineCol: '#D0D1D1', lw: 3 });
    raw(); g.font = '78px Huang'; g.fillStyle = '#E8E9E9'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('王记包子', 1080, 318);
    // door with the hours card
    wash(rect(740, 470, 220, 430), '#4A4C4E', { seed: 33 });
    wash(rect(756, 486, 90, 400), '#55575A', { seed: 34, lw: 2 }); wash(rect(856, 486, 90, 400), '#55575A', { seed: 35, lw: 2 });
    wash(rr(770, 560, 160, 84, 4), '#E4E5E5', { seed: 36, lw: 2.4 });
    raw(); g.font = '42px XiaoWei'; g.fillStyle = '#1A1B1C'; g.fillText('六点开门', 850, 603);
    g.strokeStyle = '#1A1B1C'; g.lineWidth = 2; g.beginPath(); g.moveTo(810, 560); g.lineTo(850, 526); g.lineTo(890, 560); g.stroke();
    // frosted window (glows at night — the light is added per frame)
    wash(rect(1040, 470, 380, 280), '#2A2C2E', { seed: 37 });
    wash(rect(1056, 486, 348, 248), '#BFC0C0', { seed: 38, edge: .3 });
    raw(); g.strokeStyle = '#2A2C2E'; g.lineWidth = 10; g.beginPath(); g.moveTo(1230, 486); g.lineTo(1230, 734); g.moveTo(1056, 610); g.lineTo(1404, 610); g.stroke();
    // frost flowers on the panes
    const fr = mulberry(41); g.strokeStyle = 'rgba(250,250,250,.5)'; g.lineWidth = 2;
    for (let i = 0; i < 40; i++) { const x = 1060 + fr() * 340, y = 490 + fr() * 240; for (let k = 0; k < 5; k++) { const a = k / 5 * 6.28 + fr(); g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * 14, y + Math.sin(a) * 14); g.stroke(); } }
    wash(rect(1030, 750, 400, 22), '#DADBDB', { seed: 39, lw: 2 });   // snowy sill
    // laundry pole across the lane with frozen washing
    raw(); g.strokeStyle = '#2A2B2C'; g.lineWidth = 8; g.beginPath(); g.moveTo(1500, -120); g.lineTo(3600, -60); g.stroke();
    for (let i = 0; i < 6; i++) { const x = 1700 + i * 300; wash(rr(x, -110 + i * 8, 90, 140 + (i % 2) * 40, 8), i % 2 ? '#B3B5B6' : '#8F9193', { seed: 50 + i }); }
    // lamppost
    wash(rect(LANE.lampX - 10, 120, 20, 780), '#2D2E30', { seed: 60 });
    wash(spline([[LANE.lampX - 46, 120], [LANE.lampX - 30, 70], [LANE.lampX + 30, 70], [LANE.lampX + 46, 120]], true, 4), '#3A3C3E', { seed: 61 });
    wash(rect(LANE.lampX - 24, 120, 48, 50), '#E8E9E9', { seed: 62 });
    // snowy ground with footprints and drifts
    wash(rect(-210, 880, 4820, 330), '#C9CACA', { seed: 70 });
    for (let x = -200; x < 4600; x += 240) wash(ell(x + 120, 892, 130, 18), '#D8D9D9', { seed: x + 71, edge: 0, line: false });
    raw(); for (let i = 0; i < 26; i++) { const x = 1400 + i * 90, y = 980 + (i % 2) * 40; g.fillStyle = 'rgba(80,82,84,.25)'; g.beginPath(); g.ellipse(x, y, 16, 8, 0, 0, 7); g.fill(); }
    // snow on ledges
    for (const x of [-60, 2300, 3100, 3900]) wash(rect(x - 40, 474 - 30, 300, 14), '#DADBDB', { seed: x + 80, lw: 1.6 });
  });
  return bg;
}

export const KIT = { floor: 1180, table: { x: 1250, y: 960, w: 620 }, shelf: { x: 560, y: 470 }, stove: { x: 1880, y: 1180 }, window: { x: 2080, y: 260, w: 380, h: 300 }, door: { x: 150, y: 420 }, hole: { x: 2390, y: 1180 }, lamp: { x: 1250, y: 120 } };
export function paintKitchen() {
  const bg = makeBG(-100, -100, 2700, 1560, 1.25);
  withCanvas(bg, (g, raw) => {
    // back wall: mid-grey plaster upper, tiled dado lower
    wash(rect(-110, -110, 2820, 760), '#8A8C8E', { seed: 1, line: false });
    raw(); for (let x = -100; x < 2700; x += 120) { g.fillStyle = 'rgba(255,255,255,.05)'; g.fillRect(x, -100, 50, 750); }
    for (let x = -60; x < 2700; x += 120) for (let y = -60; y < 600; y += 120) { g.fillStyle = 'rgba(25,26,28,.14)'; g.beginPath(); g.arc(x, y, 9, 0, 7); g.fill(); }   // wallpaper dots
    wash(rect(-110, 640, 2820, 30), '#5A5C5E', { seed: 2 });
    wash(rect(-110, 670, 2820, 520), '#9EA0A1', { seed: 3, line: false });
    raw(); g.strokeStyle = 'rgba(30,31,33,.25)'; g.lineWidth = 2;
    for (let y = 670; y < 1190; y += 52) { g.beginPath(); g.moveTo(-100, y); g.lineTo(2700, y); g.stroke(); }
    for (let x = -100; x < 2700; x += 52) { g.beginPath(); g.moveTo(x, 670); g.lineTo(x, 1180); g.stroke(); }
    // ceiling beam + hanging oil lamp
    wash(rect(-110, -110, 2820, 70), '#3A3C3E', { seed: 4 });
    raw(); g.strokeStyle = '#1D1E20'; g.lineWidth = 4; g.beginPath(); g.moveTo(KIT.lamp.x, -40); g.lineTo(KIT.lamp.x, 70); g.stroke();
    wash(spline([[KIT.lamp.x - 60, 140], [KIT.lamp.x - 40, 80], [KIT.lamp.x + 40, 80], [KIT.lamp.x + 60, 140]], true, 4), '#4A4C4E', { seed: 5 });
    wash(ell(KIT.lamp.x, 168, 26, 34), '#E9EAEA', { seed: 6 });
    // the door (left) with the hours card seen from inside (mirrored card: just its back)
    wash(rect(70, 420, 290, 760), '#4D4F51', { seed: 7 });
    wash(rect(92, 444, 116, 700), '#5A5C5E', { seed: 8, lw: 2 }); wash(rect(222, 444, 116, 700), '#5A5C5E', { seed: 9, lw: 2 });
    raw(); g.fillStyle = '#B9BABA'; g.beginPath(); g.arc(320, 800, 12, 0, 7); g.fill();
    // frosted window (upper right): bright at dawn, dark-grey at night (the grade + practicals do the rest)
    const Wn = KIT.window;
    wash(rect(Wn.x - 20, Wn.y - 20, Wn.w + 40, Wn.h + 40), '#3A3C3E', { seed: 10 });
    wash(rect(Wn.x, Wn.y, Wn.w, Wn.h), '#6E7072', { seed: 11, edge: .25 });
    raw(); g.strokeStyle = '#3A3C3E'; g.lineWidth = 12; g.beginPath(); g.moveTo(Wn.x + Wn.w / 2, Wn.y); g.lineTo(Wn.x + Wn.w / 2, Wn.y + Wn.h); g.moveTo(Wn.x, Wn.y + Wn.h / 2); g.lineTo(Wn.x + Wn.w, Wn.y + Wn.h / 2); g.stroke();
    const fr = mulberry(12); g.strokeStyle = 'rgba(235,236,236,.4)'; g.lineWidth = 2;
    for (let i = 0; i < 26; i++) { const x = Wn.x + 10 + fr() * (Wn.w - 20), y = Wn.y + 10 + fr() * (Wn.h - 20); for (let k = 0; k < 5; k++) { const a = k / 5 * 6.28 + fr(); g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * 12, y + Math.sin(a) * 12); g.stroke(); } }
    // shelf for the clock and jars
    wash(rect(380, 470, 420, 22), '#45474A', { seed: 13 });
    wash(rr(420, 400, 60, 70, 8), '#7C7E80', { seed: 14 }); wash(rr(700, 380, 70, 90, 10), '#6A6C6E', { seed: 15 });
    // hanging utensils rail
    raw(); g.strokeStyle = '#2B2C2E'; g.lineWidth = 6; g.beginPath(); g.moveTo(880, 380); g.lineTo(1640, 380); g.stroke();
    for (let i = 0; i < 6; i++) wash(ell(940 + i * 130, 450 + (i % 2) * 10, 30, 46), i % 2 ? '#6A6C6E' : '#7E8082', { seed: 16 + i });
    // flour sacks by the wall
    wash(spline([[520, 1180], [500, 1000], [560, 940], [640, 950], [670, 1010], [660, 1180]], true, 5), '#BDBEBE', { seed: 23 });
    raw(); g.font = '40px XiaoWei'; g.fillStyle = 'rgba(20,20,22,.6)'; g.textAlign = 'center'; g.fillText('面粉', 586, 1070);
    // the dough table (centre)
    const Tb = KIT.table;
    wash(rect(Tb.x - Tb.w / 2, Tb.y, Tb.w, 40), '#5C5E60', { seed: 24 });
    wash(rect(Tb.x - Tb.w / 2 + 30, Tb.y + 40, 30, 1180 - Tb.y - 40), '#4A4C4E', { seed: 25 }); wash(rect(Tb.x + Tb.w / 2 - 60, Tb.y + 40, 30, 1180 - Tb.y - 40), '#4A4C4E', { seed: 26 });
    wash(rect(Tb.x - Tb.w / 2 + 40, Tb.y + 130, Tb.w - 80, 16), '#55575A', { seed: 27 });
    // skirting + rat hole (lower right)
    wash(rect(-110, 1150, 2820, 30), '#4A4C4E', { seed: 28 });
    wash([...arc(KIT.hole.x, 1180, 46, 60, Math.PI, Math.PI * 2, 12)], '#121314', { seed: 29 });
    // checker floor in perspective
    wash(rect(-110, 1180, 2820, 390), '#6E7072', { seed: 30, line: false });
    raw(); for (let row = 0; row < 6; row++) { const y0 = 1180 + row * 64, y1 = y0 + 64; for (let c = -14; c < 30; c++) { if ((c + row) % 2) continue; const x0 = 1300 + (c - 8) * (110 + row * 14), x1 = x0 + 110 + row * 14; g.fillStyle = 'rgba(28,29,31,.45)'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y0); g.lineTo(x1 + (x1 - 1300) * .12, y1); g.lineTo(x0 + (x0 - 1300) * .12, y1); g.fill(); } }
  });
  return bg;
}
