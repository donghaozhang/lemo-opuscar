// Part A: 0–30.5 s. Scissors → the scrap becomes snow → title over the village at dusk → the street → the gate → folding dumplings → 小雪 → cutting → four bowls → the roof view
import * as X from './common.js';
const { PAL, canvas, fillPaper, paperShadow, noShadow, piece, fill, cut, trace, Pl, P, ellipsePoly, curve, put, mul, T, S, R, ap, beginLight, pool, lightRect, applyLight, glowWindow, bloom, E, textPiece, strip, seal, ink,
  drawGirl, drawScissors, buildGirl, walkPose, drawFolk, kit, HOUSES, HERO, GATE, GROUND, NIGHT, lanternPiece, sheetPiece, kitchenKit, KPAL, drawClockHands, foldedSheet, nianCut, CR, W, H, cam, st, E_, pt, mixPose, shake, pop, drawVillage, drawMountain, roadAt, wallBg, burst, flash, spray, mountainKit,
  TT, tb, TITLE, clamp, lerp, seg, ss, eio, eo, ei, back, hash, track, rosette, plum, crescentRows, cutTaper, sawRow } = X;
export const EV = [];
export const SHOTS = {};
const ev = (t, type, extra = {}) => EV.push({ t, type, ...extra });

// ---------- scissors on the folded sheet: the scallop edge is cut; progress 0..1 along the right half ----------
const SN = [TT.snip1, TT.snip2, TT.snip3, TT.snip4];
function macroProg(t) { let p = .03 * seg(t, -.1, .05); for (const s of SN) p += .235 * eo(seg(t, s - .14, s + .03)); return Math.min(.97, p); }
const edgePt = u => { const a = -Math.PI / 2 + Math.PI * u, k = Math.abs(Math.cos(a * 8)), r = CR - 10 * (1 - Math.pow(k, .6)); return { p: [Math.cos(a) * r, Math.sin(a) * r], ang: a + Math.PI / 2 }; };
const MAC = {};
function buildMacro() { if (MAC.sheet) return; MAC.sheet = foldedSheet(0, 1.6); MAC.sheet1 = foldedSheet(1, 1.6); }
export function shotMacro(g, t) {
  buildMacro();
  const u = macroProg(t), tip = edgePt(u);
  const z = 2.3 - .15 * seg(t, 0, 2.3), cx = lerp(tip.p[0], 160, .45), cy = lerp(tip.p[1], -40, .45);
  const C = cam(cx, cy, z);
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); fillPaper(g, 'rice', 0, 0, W, H, [z * 1.4, 0, 0, z * 1.4, C[4], C[5]], 'rgba(120,80,60,.12)'); g.restore();
  // a warm lamp halo on the table
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); const gr = g.createRadialGradient(700, 300, 100, 900, 540, 1500); gr.addColorStop(0, 'rgba(255,210,140,.12)'); gr.addColorStop(1, 'rgba(60,20,10,.4)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.restore();
  // the sheet: stack thickness (two layers) + the uncut sheet; the cut so far = the stage-1 sheet revealed through circles along the path
  const M = mul(C, T(0, 0));
  g.save(); g.setTransform(...M); for (let i = 2; i >= 1; i--) { g.fillStyle = i % 2 ? '#9c1418' : '#b51a1c'; g.fillRect(i * 1.2 + 0, -CR - 50 + i * 1.5, CR + 50, 2 * CR + 100); } g.restore();
  put(g, MAC.sheet, M, { shadow: 1.4 });
  // reveal the cut: the slit opened along the edge so far (cream line) + the offcut outside it already loosened
  g.save(); g.setTransform(...M); g.strokeStyle = '#efe4c8'; g.lineWidth = 3.4; g.lineJoin = 'round'; g.beginPath();
  for (let i = 0; i <= 60; i++) { const q = edgePt(u * i / 60).p; g[i ? 'lineTo' : 'moveTo'](q[0], q[1]); } g.stroke();
  g.strokeStyle = 'rgba(90,10,14,.55)'; g.lineWidth = 1.2; g.translate(1.5, 2); g.stroke(); g.restore();
  // scraps: one small scrap per snip; the 4th is the big one that becomes the snowflake
  SN.forEach((s, k) => {
    if (t < s) return; const v = t - s, p0 = edgePt(macroProg(s)).p, big = k === 3;
    const x = p0[0] + 40 * v + Math.sin(v * 6 + k) * 24, y = p0[1] + 30 + (big ? 900 : 320) * v * v, r = v * 3 + k, sc = (big ? 2.4 : 1) * (1 + v * .6);
    g.save(); g.setTransform(...mul(C, mul(T(x, y), mul(R(r), S(sc))))); paperShadow(g, z, 2 + v * 4);
    g.beginPath(); g.moveTo(-18, -6); g.lineTo(16, -14); g.lineTo(8, 14); g.closePath(); g.fillStyle = PAL.red; g.fill(); g.restore();
  });
  // scissors: blades close 0.12 s before each snip; the rivet sits behind the cutting point along the direction of travel
  let open = .55; for (const s of SN) { if (t > s - .12 && t < s) open = lerp(.55, .03, (t - s + .12) / .12); else if (t >= s && t < s + .3) open = lerp(.03, .55, (t - s) / .3); }
  const ca = Math.cos(tip.ang), sa = Math.sin(tip.ang), bk = 150;
  drawScissors(g, mul(C, mul(T(tip.p[0] - ca * bk, tip.p[1] - sa * bk), S(5.6))), tip.ang, open, { shadow: 3 });
  if (t < .25) { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = `rgba(0,0,0,${1 - t / .25})`; g.fillRect(0, 0, W, H); g.restore(); }
}
SN.forEach(s => ev(s, 'snip', { big: 1 }));
ev(TT.scrapFall, 'whoosh');

// ---------- title over the village at dusk; the scrap falls through the frame and joins the snow ----------
const TI = {};
function buildTitle() {
  if (TI.l) return;
  TI.l = [...TITLE].map((c, i) => textPiece(c, 150, PAL.red, 'Ma Shan Zheng', 400, 40 + i));
  TI.top = strip(1200, 21); TI.seal = seal('春', 96, 23);
  TI.w = TI.l.reduce((s, p) => s + p.w - 24 + 10, 0);
}
const dusk = (i, t) => .7;
export function shotTitleWide(g, t) {
  buildTitle();
  const u = eio(seg(t, TT.scrapFall, 5.4));
  const C = cam(1760, lerp(150, 560, u), .58);
  const tx = drawVillage(g, C, t, { mode: 'dusk', winI: dusk, flowers: (i) => (i === 1 || i === 3 || i === 4) ? 1 : 0, gateLit: false, lanternsLit: true, crackers: false, bloom: .35, snowOpt: { speed: .8 } });
  // the scrap: tumbles down from the top centre, shrinking, and settles into the snowfall as a tiny red flake
  const v = seg(t, TT.scrapFall, 6.0), sx = 960 + Math.sin(v * 9) * 90 * (1 - v), sy = -60 + 1150 * ei(Math.min(1, v * 1.05)), sc = lerp(2.4, .18, eo(v));
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.translate(sx, sy); g.rotate(v * 11); g.scale(sc, sc); paperShadow(g, 1, 2);
  g.beginPath(); g.moveTo(-26, -8); g.lineTo(22, -18); g.lineTo(10, 20); g.closePath(); g.fillStyle = PAL.red; g.fill(); g.restore();
  // title: strips slide in, then the seven cut letters pop on 12 fps steps, then the seal
  const texts = [];
  if (t >= TT.titleIn - .35) {
    const sl = E_(t, TT.titleIn - .35, TT.titleIn), y0 = 150;
    put(g, TI.top, [1, 0, 0, 1, 360 - (1 - sl) * 1400, y0 - 70], { shadow: 1 });
    put(g, TI.top, [1, 0, 0, -1, 360 + (1 - sl) * 1400, y0 + 290], { shadow: 1 });
    let x = 960 - TI.w / 2;
    TI.l.forEach((p, i) => { const s = pop(t, TT.titleIn + i / 3, 1.18); if (s) put(g, p, [s, 0, 0, s, x + (1 - s) * p.w / 2, y0 + (1 - s) * p.h / 2], { shadow: 1.4 }); x += p.w - 24 + 10; });
    if (t >= TT.seal) { const s = pop(t, TT.seal, 1.5); put(g, TI.seal, [s, 0, 0, s, 960 + TI.w / 2 + 30 - 48 * (s - 1), y0 + 150 - 48 * (s - 1)], { shadow: 1 }); }
    if (t >= TT.titleIn) texts.push({ id: 'title', text: TITLE, x0: 960 - TI.w / 2, y0, x1: 960 + TI.w / 2, y1: y0 + 195 });
  }
  return texts;
}
[...TITLE].forEach((c, i) => ev(TT.titleIn + i / 3, 'letter'));
ev(TT.seal, 'stamp'); ev(TT.titleIn - .35, 'place');

// ---------- the street: pan with parallax; a villager pastes a window flower; another carries lanterns ----------
const LAD = {};
function ladder() { if (LAD.p) return LAD.p; return LAD.p = piece([-40, -420, 40, 10], g => { for (const x of [-28, 28]) fill(g, q => trace(q, Pl([[x - 7, -410], [x + 7, -410], [x + 9, 0], [x - 9, 0]], true, .4, 301)), NIGHT.wall); for (let k = 0; k < 8; k++) { const y = -40 - k * 50; fill(g, q => trace(q, Pl([[-30, y - 5], [30, y - 5], [30, y + 5], [-30, y + 5]], true, .3, 302 + k)), NIGHT.wall); } }, { seed: 301, col: NIGHT.wall, ss: 2 }); }
export function shotStreet(g, t) {
  const V = kit(), x = lerp(1000, 1620, eio(seg(t, TT.village, TT.crackersHung - .3)));
  const C = cam(x, 690, 1.0);
  const pasted = t >= TT.village + 1.0;
  drawVillage(g, C, t, { mode: 'dusk', winI: dusk, flowers: (i) => i === 0 ? (pasted ? pop(t, TT.village + 1.0, 1.2) : 0) : (i === 1 || i === 3 || i === 4) ? 1 : 0, gateLit: false, crackers: false, bloom: .35,
    mid: gg => {
      // ladder against house 0, villager 1 on it, arm up with the flower until it is pasted
      const h = HOUSES[0], HM = mul(C, mul(T(h.x, GROUND + h.g), S(h.s)));
      put(gg, ladder(), mul(HM, mul(T(-160, 0), R(.12))), { shadow: .9 });
      const armUp = pasted ? -2.2 : -2.5 + .2 * Math.sin(st(t) * 4);
      drawFolk(gg, mul(HM, T(-150, -150)), 'v1', { flip: false, expr: pasted ? 'smile' : 'neutral', shF: armUp, elF: -.3, shB: -1.2, elB: -.8, handF: 'open', hipF: -.3, knF: .6, hipB: -.1, knB: .3, scale: .78, prop: pasted ? null : (q, M2) => put(q, V.flowerS, mul(M2, mul(T(10, 10), S(.24))), { shadow: .8 }) }, { shadow: .9 });
      // villager 2 walks right along the street with a pole of lanterns
      const wx = 1180 + 150 * (t - TT.village), ph = st(t) * 8;
      drawFolk(gg, mul(C, T(wx, GROUND + 16)), 'v2', { ...walkPose(ph, .5), expr: 'smile', shF: -2.6, elF: -.4, handF: 'hold', scale: .8, prop: (q, M2) => { put(q, V.lantern, mul(M2, mul(T(0, -120), S(.9))), { shadow: .8 }); put(q, V.lantern, mul(M2, mul(T(70, -120), S(.9))), { shadow: .8 }); q.save(); q.setTransform(...mul(M2, T(0, -124))); q.strokeStyle = NIGHT.wall; q.lineWidth = 5; q.beginPath(); q.moveTo(-10, 0); q.lineTo(110, 0); q.stroke(); q.restore(); } }, { shadow: .9 });
    } });
}
ev(TT.village + 1.0, 'pat'); ev(TT.village, 'windbed', { dur: 22, gain: .5 }); ev(TT.village + .3, 'bustle', { dur: 4.5 });
for (let k = 0; k < 6; k++) ev(TT.village + .2 + k * .36, 'step', { gain: .5 });

// ---------- the gate: the firecracker string is hung (drops and swings), the lanterns are lit with a match ----------
export function shotGate(g, t, sh) {
  const V = kit(), C = cam(GATE.x + 40, 640, 1.12);
  const hung = t >= TT.crackersHung, lit = t >= TT.lanternLit;
  const swing = tt => hung ? .45 * Math.exp(-(tt - TT.crackersHung) * 1.6) * Math.cos((tt - TT.crackersHung) * 7) : 0;
  drawVillage(g, C, t, { mode: 'dusk', winI: dusk, flowers: () => 1, gateLit: lit, crackers: hung, crackerSwing: swing, bloom: .4,
    mid: gg => {
      const GM = mul(C, T(GATE.x, GROUND));
      put(gg, ladder(), mul(GM, mul(T(-60, 0), R(.1))), { shadow: .9 });
      // villager 2 on the ladder: holds the string up until it is hung, then lets go (arm drops) — the string before hanging is in his hand
      const u = E_(st(t), TT.crackersHung - .1, TT.crackersHung + .25);
      drawFolk(gg, mul(GM, T(-50, -200)), 'v2', { expr: hung ? 'smile' : 'neutral', shF: lerp(-2.9, -1.6, u), elF: lerp(-.2, -.9, u), shB: -1.0, elB: -.9, handF: 'hold', hipF: -.3, knF: .6, hipB: -.1, knB: .3, scale: .8, prop: hung ? null : (q, M2) => put(q, V.gate.crackers, mul(M2, mul(T(8, 20), S(.55, .25))), { shadow: .8 }) }, { shadow: .9 });
      // villager 1 at the right pillar with a match: strikes it at lanternLit − 0.4, lifts it to the lantern, the lantern lights
      const m = seg(t, TT.lanternLit - .5, TT.lanternLit - .05);
      drawFolk(gg, mul(GM, T(240, 0)), 'v1', { expr: lit ? 'smile' : 'neutral', shF: lerp(-1.4, -2.7, eio(m)), elF: -.3, shB: -.6, elB: -.9, handF: 'hold', scale: .85, lean: -.05, prop: (q, M2) => { if (t > TT.lanternLit - .7 && t < TT.lanternLit + .5) { q.save(); q.setTransform(...mul(M2, T(6, -8))); q.strokeStyle = '#e9dcc0'; q.lineWidth = 4; q.beginPath(); q.moveTo(0, 0); q.lineTo(0, -44); q.stroke(); q.fillStyle = '#ffcf6e'; q.beginPath(); q.ellipse(0, -52, 7, 12, 0, 0, 7); q.fill(); q.restore(); const c = pt(M2, [6, -60]); flash(c[0], c[1], 60, .8); } } }, { shadow: .9 });
    },
    after: gg => { if (lit) { const c = pt(mul(C, T(GATE.x + 170, GROUND - 236 + 48)), [0, 0]); flash(c[0], c[1], 260, Math.max(0, 1 - (t - TT.lanternLit) / .35) * .9); } } });
}
ev(TT.crackersHung, 'rustle'); ev(TT.crackersHung + .1, 'rattle'); ev(TT.lanternLit - .45, 'match'); ev(TT.lanternLit, 'glowon');

// ---------- top-down table: grandma's hands and 小雪's hands fold a dumpling in three moves ----------
function tableBg(g, C) {
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); fillPaper(g, 'indigo', 0, 0, W, H, C, 'rgba(40,16,14,.55)'); g.restore();
  const K = kitchenKit();
  put(g, K.board, mul(C, T(960, 560)), { shadow: 1.2 });
  put(g, K.flour, mul(C, mul(T(880, 600), S(1.1, 1))), { shadow: .4 });
}
function tableProps(g, C, rowN = 5, bowl = true) {
  const K = kitchenKit();
  if (bowl) put(g, K.bowlTop, mul(C, T(1450, 300)), { shadow: 1.4 });
  put(g, K.pin, mul(C, mul(T(560, 260), R(-.3))), { shadow: 1.2 });
  for (let k = 0; k < rowN; k++) put(g, K.dumpRow[k % 6], mul(C, mul(T(430 + k * 118, 860 - (k % 2) * 8), R(-.2 + .15 * (k % 3)))), { shadow: 1.1 });
}
export function shotFoldTD(g, t) {
  const K = kitchenKit(), C = cam(960, 600, 1.55);
  beginLight('rgb(232,220,206)');
  tableBg(g, C); tableProps(g, C, 5);
  // the dumpling in the centre: stage by hits
  const stg = t < TT.fold1 ? 0 : t < TT.fold2 ? 1 : 2, s = pop(t, [TT.fold1, TT.fold2, TT.fold3][stg] ?? -1, 1.12) || 1;
  const done = t >= TT.fold3, slide = eo(seg(st(t), TT.fold3, TT.fold3 + .5));
  const dx = done ? lerp(0, -520 + 5 * 118 - 480, slide) : 0, dy = done ? lerp(0, 300, slide) : 0;
  put(g, K.dump[stg], mul(C, mul(T(960 + dx, 560 + dy), S(2.3 * s))), { shadow: 1.3 });
  if (done && slide > .9) put(g, K.dump[0], mul(C, mul(T(960, 560), S(2.3 * (pop(t, TT.fold3 + .55, 1.1) || 1)))), { shadow: 1.3 });
  // hands (12 fps): grandma's from the top (rotated), 小雪's from the bottom
  const ts = st(t);
  const gmL = [[12.7, [780, 300, .3]], [TT.fold1 - .2, [850, 390, .45]], [TT.fold1, [890, 430, .6]], [TT.fold1 + .4, [870, 390, .5]], [TT.fold2, [800, 340, .3]], [16.3, [780, 300, .3]]];
  const gmR = [[12.7, [1140, 300, -.3]], [TT.fold1 - .2, [1070, 390, -.45]], [TT.fold1, [1030, 430, -.6]], [TT.fold1 + .4, [1050, 400, -.5]], [TT.fold2, [1120, 340, -.3]], [16.3, [1140, 300, -.3]]];
  const xL = [[12.7, [800, 980, -.2]], [TT.fold2 - .25, [860, 840, -.1]], [TT.fold2, [890, 740, 0]], [TT.fold2 + .5, [880, 790, -.1]], [TT.fold3, [910, 770, .1]], [TT.fold3 + .4, [780, 880, -.3]], [16.3, [800, 980, -.2]]];
  const xR = [[12.7, [1120, 980, .2]], [TT.fold2 - .25, [1060, 840, .1]], [TT.fold2, [1030, 740, 0]], [TT.fold2 + .5, [1040, 790, .1]], [TT.fold3, [1010, 770, -.1]], [TT.fold3 + .4, [1140, 880, .3]], [16.3, [1120, 980, .2]]];
  const tr = k => track(k)(ts);
  const [gl, gr, xl, xr] = [tr(gmL), tr(gmR), tr(xL), tr(xR)];
  const pinch = t > TT.fold2 - .1 && t < TT.fold3 + .2;
  put(g, K.handGm.open, mul(C, mul(T(gl[0], gl[1]), mul(R(Math.PI + gl[2]), S(1.7)))), { shadow: 1.6 });
  put(g, K.handGm.open, mul(C, mul(T(gr[0], gr[1]), mul(R(Math.PI + gr[2]), S(-1.7, 1.7)))), { shadow: 1.6 });
  put(g, K.handGirl[pinch ? 'pinch' : 'open'], mul(C, mul(T(xl[0], xl[1]), mul(R(xl[2]), S(1.4)))), { shadow: 1.6 });
  put(g, K.handGirl[pinch ? 'pinch' : 'open'], mul(C, mul(T(xr[0], xr[1]), mul(R(xr[2]), S(-1.4, 1.4)))), { shadow: 1.6 });
  pool(1000, 300, 1500, 'rgba(255,210,150,1)', .5);
  applyLight(g);
}
[TT.fold1, TT.fold2, TT.fold3].forEach(s => ev(s, 'pat'));
ev(TT.fold3 + .3, 'slide'); ev(12.7, 'roomtone', { dur: 10 });

// ---------- 小雪 close-up: she looks up from her cutting to the window ----------
export function shotGirlCU(g, t) {
  const K = kitchenKit(), z = 1.0 + .08 * seg(t, TT.lookUp - .5, TT.lookUp + 2), C = cam(960, 540, z);
  beginLight('rgb(205,196,214)');
  wallBg(g, C, 'rgba(6,8,22,.3)');
  // round window on the wall (dark pane at dusk, a little sky light), the rim, a lantern
  g.save(); g.setTransform(...C); g.fillStyle = '#2a3366'; g.beginPath(); g.arc(1380, 300, 296, 0, 7); g.fill(); g.restore();
  put(g, K.lattice, mul(C, T(1380, 300)), { shadow: .6 }); put(g, K.winRim, mul(C, T(1380, 300)), { shadow: 1.2 });
  const V = kit(); put(g, V.flowerS, mul(C, mul(T(1380, 300), S(.5))), { shadow: .6 });
  pool(...pt(C, [1380, 300]), 700 * z, 'rgba(160,175,240,1)', .45);
  // the girl, large, at the left; she holds the folded sheet and the scissors; head turns up at lookUp
  const up = E_(st(t), TT.lookUp, TT.lookUp + .35), smile = t > TT.lookUp + .9;
  const expr = t < TT.lookUp ? 'lookdown' : smile ? 'smile' : 'lookup';
  drawGirl(g, mul(C, mul(T(560, 1380), S(2.05))), { expr, head: lerp(.12, -.28, up), lean: lerp(.05, -.04, up), shF: lerp(-1.0, -1.1, up), elF: -1.45, handF: 'hold', shB: -.7, elB: -1.2, handB: 'hold', scissors: { ang: -.35, open: .25 }, propB: (q, M2) => put(q, foldedSheet(1, 1.2), mul(M2, mul(T(0, -10), mul(R(-.3), S(.26)))), { shadow: 1 }) });
  pool(300, 900, 900, 'rgba(255,200,140,1)', .5);
  applyLight(g); bloom(g, .3);
}
ev(TT.lookUp, 'cloth');

// ---------- cutting insert: the scissors cut the horn and the eye into the folded sheet ----------
const CUTI = {};
function buildCutIns() { if (CUTI.a) return; CUTI.a = foldedSheet(1, 1.6); CUTI.b = foldedSheet(2, 1.6); }
const HORN = (() => { const h = []; for (let i = 0; i <= 20; i++) { const u = i / 20, a = -2.4 + u * 2.2, r = 96 * (1 - u * .2); h.push([70 + Math.cos(a) * r, -150 + Math.sin(a) * r * .9]); } const E = []; for (let i = 0; i <= 16; i++) { const a = Math.PI * 1.04 + Math.PI * .92 * i / 16; E.push([92 + Math.cos(a) * 40, -38 + Math.sin(a) * 40]); } return h.concat(E); })();
const HL = (() => { const L = [0]; for (let i = 1; i < HORN.length; i++) L.push(L[i - 1] + Math.hypot(HORN[i][0] - HORN[i - 1][0], HORN[i][1] - HORN[i - 1][1])); return L; })();
function hornAt(u) { const s = clamp(u) * HL[HL.length - 1]; let i = 0; while (i < HL.length - 2 && HL[i + 1] < s) i++; const f = (s - HL[i]) / (HL[i + 1] - HL[i] || 1), a = HORN[i], b = HORN[i + 1]; return { p: [lerp(a[0], b[0], f), lerp(a[1], b[1], f)], ang: Math.atan2(b[1] - a[1], b[0] - a[0]), s }; }
const SN2 = [TT.snipA, TT.snipB, TT.snipC, TT.snipD];
function cutProg(t) { let p = .02; for (const s of SN2) p += .245 * eo(seg(t, s - .14, s + .03)); return Math.min(1, p); }
const [MKc, MK] = canvas(W, H);
export function shotCutIns(g, t) {
  buildCutIns();
  const u = cutProg(t), tip = hornAt(u), z = 2.0, C = cam(lerp(110, tip.p[0], .3), lerp(-80, tip.p[1], .3), z);
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); fillPaper(g, 'rice', 0, 0, W, H, [z * 1.4, 0, 0, z * 1.4, C[4], C[5]], 'rgba(120,80,60,.14)'); g.restore();
  g.save(); g.setTransform(...C); for (let i = 2; i >= 1; i--) { g.fillStyle = i % 2 ? '#9c1418' : '#b51a1c'; g.fillRect(i * 1.2, -CR - 50 + i * 1.5, CR + 50, 2 * CR + 100); } g.restore();
  put(g, CUTI.a, C, { shadow: 1.4 });
  // the part already cut: the stage-2 sheet shows through circles along the path up to the tip
  MK.setTransform(1, 0, 0, 1, 0, 0); MK.globalCompositeOperation = 'source-over'; MK.clearRect(0, 0, W, H);
  MK.setTransform(...C); MK.beginPath(); const n = Math.floor(tip.s / 8); for (let k = 0; k <= n; k++) { const q = hornAt(k * 8 / HL[HL.length - 1]).p; MK.moveTo(q[0] + 30, q[1]); MK.arc(q[0], q[1], 30, 0, 7); } MK.fillStyle = '#000'; MK.fill();
  MK.globalCompositeOperation = 'source-in'; put(MK, CUTI.b, C, { shadow: 0 });
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'destination-out'; g.drawImage(MKc, 0, 0); g.globalCompositeOperation = 'source-over'; g.drawImage(MKc, 0, 0); g.restore();
  // the paper under the holes: the table shows through; redraw the rice paper behind via the mask? (the holes are already transparent → we need the table there)
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'destination-over'; fillPaper(g, 'rice', 0, 0, W, H, [z * 1.4, 0, 0, z * 1.4, C[4], C[5]], 'rgba(120,80,60,.14)'); g.restore();
  burst(g, C, t, TT.snipB + .05, tip.p[0], tip.p[1] + 30, 3, PAL.red, 60, 7, 11); burst(g, C, t, TT.snipD + .05, tip.p[0], tip.p[1] + 30, 3, PAL.red, 60, 7, 13);
  let open = .5; for (const s of SN2) { if (t > s - .12 && t < s) open = lerp(.5, .03, (t - s + .12) / .12); else if (t >= s && t < s + .3) open = lerp(.03, .5, (t - s) / .3); }
  const ca = Math.cos(tip.ang), sa = Math.sin(tip.ang), bk = 120;
  drawScissors(g, mul(C, mul(T(tip.p[0] - ca * bk, tip.p[1] - sa * bk), S(4.6))), tip.ang, open, { shadow: 3 });
  // the girl's far hand holding the sheet at the edge
  const K = kitchenKit(); put(g, K.handGirl.open, mul(C, mul(T(300, 330), mul(R(-2.2), S(1.4)))), { shadow: 2 });
}
SN2.forEach(s => ev(s, 'snip'));

// ---------- four bowls: grandma sets the table; pull back to the two empty stools ----------
const RM = {};
function roomBits() { if (RM.lamp) return RM; RM.lamp = lanternPiece({ seed: 401 }); RM.sheet = sheetPiece(140, 170, PAL.red, 33); return RM; }
export function shotBowls(g, t) {
  const K = kitchenKit(), rb = roomBits(), u = eio(seg(t, TT.bowls + .6, TT.bowls + 3.2)), z = lerp(1.35, .82, u);
  const C = cam(lerp(820, 1080, u), lerp(760, 680, u), z);
  beginLight('rgb(200,192,210)');
  wallBg(g, C, 'rgba(6,8,22,.3)');
  // the round window at the back right, the lamp hanging from the beam
  g.save(); g.setTransform(...C); g.fillStyle = '#2a3366'; g.beginPath(); g.arc(1560, 300, 230, 0, 7); g.fill(); g.restore();
  put(g, K.lattice, mul(C, mul(T(1560, 300), S(.78))), { shadow: .5 }); put(g, K.winRim, mul(C, mul(T(1560, 300), S(.78))), { shadow: 1 });
  put(g, rb.lamp, mul(C, mul(T(1000, 60), S(2.2))), { shadow: 1 }); put(E, rb.lamp, mul(C, mul(T(1000, 60), S(2.2))), { shadow: 0, alpha: .5 });
  pool(...pt(C, [1000, 160]), 900 * z, 'rgba(255,200,140,1)', .75);
  // stools behind the table (the far side): four, the two under the window stay empty; grandma walks behind the table placing bowls; 小雪 sits on the near-left stool
  for (const x of [700, 960, 1220, 1480]) put(g, K.stool, mul(C, T(x, 860)), { shadow: .9 });
  const ts = st(t), bowls = [TT.bowls, TT.bowls + .5, TT.bowls + 1.0, TT.bowls + 1.5];
  const i = Math.min(3, Math.floor((t - TT.bowls + .5) / .5)), place = bowls.some(b => t > b - .35 && t < b + .1);
  const gx = 560 + 260 * clamp((t - TT.bowls + .5) / 2.0) * 3.0;
  drawFolk(g, mul(C, T(gx, 1000)), 'gm', { expr: 'smile', ...walkPose(ts * 7, place ? 0 : .3), shF: place ? -1.5 : -1.0, elF: place ? -.5 : -.8, handF: 'open', shB: -.6, elB: -1.2, handB: 'open', scale: 1.0, prop: (t > bowls[3] + .1) ? null : (q, M2) => put(q, K.bowlSide, mul(M2, mul(T(10, -8), S(.9))), { shadow: .8 }) });
  drawGirl(g, mul(C, T(700, 1000)), { expr: 'lookdown', hipF: -1.45, knF: 1.5, hipB: -1.35, knB: 1.45, shF: -1.0, elF: -1.4, handF: 'hold', shB: -.7, elB: -1.2, handB: 'hold', head: .15, scissors: { ang: -.4, open: .3 + .25 * Math.max(0, Math.sin(ts * 15)) }, scale: .95, y: -120, propB: (q, M2) => put(q, foldedSheet(1, 1.2), mul(M2, mul(T(0, -8), mul(R(-.3), S(.2)))), { shadow: .8 }) });
  put(g, K.tableSide, mul(C, T(1080, 790)), { shadow: 1.4 });
  bowls.forEach((tb0, k) => { if (t < tb0) return; const s = pop(t, tb0, 1.1); put(g, K.bowlSide, mul(C, mul(T(700 + k * 260, 758), S(s))), { shadow: 1 }); });
  applyLight(g); bloom(g, .35);
}
[0, .5, 1.0, 1.5].forEach(d => ev(TT.bowls + d, 'bowl'));
for (let k = 0; k < 7; k++) ev(TT.bowls - .5 + k * .45, 'step', { gain: .4 });

// ---------- the roof view: the mountain road far away; two headlights crawl and stop ----------
const RF = {};
function roofBits() { if (RF.roof) return RF; RF.roof = piece([-1200, -140, 1200, 160], g => { fill(g, q => trace(q, Pl([[-1200, 0], [-400, -60], [0, -80], [400, -60], [1200, 0], [1200, 150], [-1200, 150]], true, .5, 411)), NIGHT.houseDark); for (let k = 0; k < 4; k++) sawRow(g, [[-1180, 20 + k * 32], [1180, 20 + k * 32]], 10, 11, -1, .7); }, { seed: 411, col: NIGHT.houseDark, ss: 1 }); RF.cap = piece([-1200, -140, 1200, 20], g => fill(g, q => trace(q, P([[-1200, -4], [-400, -64], [0, -84], [400, -64], [1200, -4], [1200, 16], [400, -42], [0, -60], [-400, -42], [-1200, 16]], true, .8, 413)), NIGHT.roofSnow), { seed: 413, col: NIGHT.roofSnow, ss: 1, edge: .6 }); RF.chim = piece([-40, -160, 40, 10], g => { fill(g, q => trace(q, Pl([[-30, 0], [30, 0], [30, -140], [-30, -140]], true, .4, 415)), NIGHT.houseDark); crescentRows(g, -30, -130, 30, -10, 8, 3, 0, .7); }, { seed: 415, col: NIGHT.houseDark, ss: 2 }); return RF; }
export function roofView(g, t, o = {}) {
  const rb = roofBits(), Mk = mountainKit(), C = cam(960, 560, .5);
  const busU = o.busU ?? lerp(.3, .52, eio(seg(t, TT.roofView, TT.busStop)));
  drawMountain(g, C, t, { amb: o.amb || 'rgb(150,152,200)', bloom: .6,
    onRoad: gg => {
      const r = roadAt(busU), bm = mul(C, mul(T(r.x, r.y - 6), mul(R(r.ang), S(.22))));
      put(gg, Mk.bus, bm, { shadow: .5 }); for (const [ax, ay] of Mk.bus.axles) put(gg, Mk.bus.wheel, mul(bm, T(ax, ay)), { shadow: .4 });
      const lamp = pt(bm, Mk.bus.lamp), on = o.blink ? (Math.floor(t * 2) % 2 === 0) : true;
      if (on) { flash(lamp[0], lamp[1], 70, .9); pool(lamp[0] + 20, lamp[1], 200, 'rgba(255,230,170,1)', .8); for (const w of Mk.bus.wins) { const c = pt(bm, w); flash(c[0], c[1], 14, .6, '255,200,120'); } }
    },
    front: gg => {
      // the roof in the foreground: ridge, snow cap, chimney with a steam curl
      const RM2 = [1.0, 0, 0, 1.0, 960, 980];
      put(gg, rb.roof, RM2, { shadow: 1 }); put(gg, rb.cap, RM2, { shadow: .5 }); put(gg, rb.chim, mul(RM2, T(-520, -40)), { shadow: 1 });
      if (o.people) o.people(gg, RM2);
    } });
}
export function shotRoofView(g, t) {
  roofView(g, t, { people: (gg, RM2) => { const ts = st(t); drawGirl(gg, mul(RM2, T(-640, -40)), { expr: t < TT.busStop ? 'neutral' : 'worried', head: -.2, shF: -.5, elF: -.6, shB: -.4, elB: -.5, handF: 'mitten', lean: -.04, scale: 1.0 }); } });
}
ev(TT.roofView - .3, 'engine', { dur: 2.6 }); ev(TT.busStop, 'enginestop');
ev(TT.roofView, 'windbed', { dur: 4, gain: .9 });

Object.assign(SHOTS, { macro: shotMacro, titleWide: shotTitleWide, street: shotStreet, gate: shotGate, foldTD: shotFoldTD, girlCU: shotGirlCU, cutIns: shotCutIns, bowls: shotBowls, roofView: shotRoofView });
