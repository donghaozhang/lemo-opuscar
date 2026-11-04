// Shots: OPEN · HOME · GARAGE. Each painter gets S = { t, lt, u, g, e, A, sh } and returns post overrides + texts.
// Characters are sampled on twos (q12), performance beats on threes (q8); camera, light and rain on ones.
import { cel, path, poly, line, rgba, mix, airbrush, vgrad, TAU, W, H, LWK, rng } from './cel.js';
import { PAL } from './pal.js';
import { head } from './heads.js';
import { figure } from './people.js';
import { mech, lunchbox } from './mech.js';
import { rain, flare, lamp, speedLines } from './fx.js';
import { chromeTitle, glint, phoneChat } from './ui.js';
import { HIT, SEC, at, q12, q8, TXT } from './timeline.js';
import { K, clamp, lerp, ss, eo, ei, seg, hash } from './lib.js';

export const rainOn = (S, o = {}) => rain(S.g, S.e, Math.floor(S.t * 12), { n: o.n ?? 240, ang: o.ang ?? .22, a: o.a ?? .32, len: o.len, w: o.w });
export function flash(S, at0, dur = .18, k = 1) { const d = S.t - at0; if (d < 0 || d > dur * 3) return 0; const a = d < dur ? 1 : 1 - (d - dur) / (dur * 2); S.g.save(); S.g.fillStyle = rgba('#e8eeff', .55 * a * k); S.g.fillRect(0, 0, W, H); S.g.restore(); return a; }
export function wetFloor(g, y0, col = '#140c22') { vgrad(g, 0, y0, W, H - y0, [[0, mix(col, '#3a2a5a', .3)], [1, col]]); }
const P = PAL;

// ================================================================ OPEN
export function crane(S) {
  const { g, e, A, t, u } = S, k = ss(u);
  const fy = -lerp(0, A.far.h - H, k), ny = -lerp(0, A.near.h - H, Math.min(1, k * 1.04));
  g.drawImage(A.far.c, 0, fy); e.drawImage(A.far.e, 0, fy);
  flash(S, at('OPEN', 1.1), .12, .8);
  g.drawImage(A.near.c, 0, ny); e.drawImage(A.near.e, 0, ny);
  // the nearest layer: grandma's old apartment block slides up from below and stops on one warm window
  const by = lerp(H + 900, 120, ss(seg(u, .55, 1)));
  if (by < H) {
    g.save(); g.translate(1080, by);
    vgrad(g, 0, 0, 900, 1400, [[0, '#2a2236'], [1, '#1a1426']]);
    g.fillStyle = '#120c1c'; g.fillRect(-30, -20, 960, 26);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
      const wx = 70 + c * 210, wy = 90 + r * 300, warm = r === 1 && c === 1;
      g.fillStyle = warm ? '#ffcf86' : (hash(r * 4 + c) < .3 ? '#5a6aa8' : '#1a1830'); g.fillRect(wx, wy, 150, 190);
      if (warm) { e.fillStyle = rgba('#ffb060', .7); e.fillRect(1080 + wx, by + wy, 150, 190);
        // a silhouette knitting by the lamp, a red-check curtain
        g.fillStyle = '#7a4a3a'; g.beginPath(); g.ellipse(wx + 60, wy + 100, 22, 26, 0, 0, TAU); g.fill(); g.fillRect(wx + 30, wy + 124, 64, 66);
        g.fillStyle = '#c82a2a'; g.fillRect(wx + 112, wy, 38, 190); g.fillStyle = rgba('#ffffff', .5); for (let k2 = 0; k2 < 6; k2++) g.fillRect(wx + 112, wy + k2 * 32, 38, 6); }
      g.fillStyle = '#0c0814'; g.fillRect(wx - 6, wy + 190, 162, 12);
      if (hash(r + c * 7) < .5) { g.fillStyle = '#3a3448'; g.fillRect(wx + 20, wy + 202, 110, 30); }        // AC units
    }
    g.restore();
  }
  rainOn(S, { n: 300, a: .3 });
  return { power: Math.min(1, t / .6) };
}
export function title(S) {
  const { g, e, A, t, lt } = S;
  g.drawImage(A.storm.c, -200 - lt * 30, -160); e.drawImage(A.storm.e, -200 - lt * 30, -160);
  const lf = flash(S, HIT.title - .05, .14, 1.2);
  // 大黄 as a backlit silhouette behind the title, revealed by the lightning
  g.save(); g.globalAlpha = .9;
  mech(g, null, PAL.backlit, { x: 960, y: 1240, s: 1.55, eyes: 0, rim: '#ff9a5a', stamp: false, armL: { a1: .25, a2: -.1, pose: 'fist' }, armR: { a1: -.25, a2: .1, pose: 'fist' } });
  g.restore();
  if (lt > .1) { e.save(); e.globalCompositeOperation = 'lighter'; for (const k of [-1, 1]) { const gr = e.createRadialGradient(960 + k * 50 * 1.55, 1240 - 578 * 1.55, 0, 960 + k * 50 * 1.55, 1240 - 578 * 1.55, 70); gr.addColorStop(0, rgba('#ffd23f', .9)); gr.addColorStop(1, rgba('#ffd23f', 0)); e.fillStyle = gr; e.fillRect(0, 0, W, H); } e.restore(); }
  const tx = chromeTitle(g, e, TXT.title, 960, 430, 220, lt, { sweepAt: .9 });
  g.save(); g.font = 'italic 900 64px Kanit'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.strokeStyle = '#120a24'; g.lineWidth = 12; g.strokeText('MECHA GRANDMA', 960, 610); g.fillStyle = '#ffd23f'; g.fillText('MECHA GRANDMA', 960, 610); g.restore();
  glint(e, 1270, 360, K([[HIT.titleGlint - .1, 0], [HIT.titleGlint + .05, 1.2], [HIT.titleGlint + .4, 0]], t));
  rainOn(S, { n: 200, a: .25 });
  return { texts: tx };
}

// ================================================================ HOME (warm interior)
function room(g, e, t, o = {}) {
  const Pw = PAL.warm;
  vgrad(g, 0, 0, W, H, [[0, '#4a2e2a'], [.7, '#6a3e30'], [1, '#3a2220']]);
  // wallpaper stripes
  for (let x = 0; x < W; x += 60) { g.fillStyle = rgba('#000000', .06); g.fillRect(x, 0, 30, 760); }
  // window right: rain + blurred neon outside
  const wx = 1300, wy = 120;
  g.fillStyle = '#140c24'; g.fillRect(wx, wy, 520, 520);
  for (const [cx, cy, c] of [[1400, 300, '#ff3fa4'], [1640, 220, '#35e7ff'], [1720, 470, '#ffd23f'], [1460, 520, '#b36bff']]) { airbrush(g, cx, cy, 90, 60, c, .5); airbrush(e, cx, cy, 70, 50, c, .35); }
  g.strokeStyle = rgba('#cfe3ff', .35); g.lineWidth = 2; for (let i = 0; i < 40; i++) { const x = wx + hash(i) * 520, y = wy + ((hash(i + 5) * 520 + t * 260) % 520); g.beginPath(); g.moveTo(x, y); g.lineTo(x - 4, y + 28); g.stroke(); }
  g.fillStyle = '#2a1a16'; g.fillRect(wx - 20, wy - 20, 560, 24); g.fillRect(wx - 20, wy + 516, 560, 30); g.fillRect(wx + 250, wy, 20, 520);
  g.fillStyle = '#c8302a'; g.fillRect(wx - 70, wy - 30, 90, 600); g.fillStyle = rgba('#ffffff', .45); for (let k = 0; k < 12; k++) g.fillRect(wx - 70, wy - 30 + k * 50, 90, 8); for (let k = 0; k < 3; k++) g.fillRect(wx - 70 + k * 30, wy - 30, 8, 600);
  // floor
  vgrad(g, 0, 760, W, 320, [[0, '#5a3426'], [1, '#2a1610']]);
  // shelf with the photo
  g.fillStyle = '#3a2216'; g.fillRect(150, 300, 360, 18);
  g.fillStyle = '#8a6a3a'; g.fillRect(380, 196, 96, 104); g.fillStyle = '#d8c8a0'; g.fillRect(390, 206, 76, 84); g.fillStyle = '#f2b81e'; g.fillRect(420, 230, 36, 50);
  // the TV: typhoon warning
  g.fillStyle = '#2a2420'; g.fillRect(120, 470, 380, 290); g.fillStyle = '#1a1414'; g.fillRect(140, 490, 340, 230);
  if (o.tv !== false) { const blink = Math.floor(t * 2) % 2; g.fillStyle = blink ? '#c81e2a' : '#a81624'; g.fillRect(150, 500, 320, 210); g.fillStyle = '#ffffff'; g.font = '900 58px "Noto Sans SC"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(TXT.tv, 310, 590);
    g.font = '700 26px "Noto Sans SC"'; g.fillText('请勿外出', 310, 660); e.fillStyle = rgba('#ff3a3a', .45); e.fillRect(150, 500, 320, 210); }
  // the lamp
  g.fillStyle = '#3a2a1a'; g.fillRect(1090, 360, 12, 400); cel(g, poly([[1030, 380], [1160, 380], [1130, 300], [1060, 300]]), { f: '#f0c070', s: '#c08a40', l: '#4a2e10', lw: 2.4 });
  airbrush(g, 1095, 450, 420, 360, '#ffb860', .28); lamp(g, e, 1095, 390, 40, '#ffc070', .9);
}
function armchair(g, x, y, s) {
  g.save(); g.translate(x, y); g.scale(s, s);
  cel(g, path([[-210, 0], [-230, -330], [-160, -420], [160, -420], [230, -330], [210, 0]]), { f: '#5a7a5a', s: '#3a5a40', so: [-20, -10], l: '#1a2a1a', lw: 3 });
  cel(g, path([[-250, 20], [-260, -200], [-200, -230], [-170, 0]]), { f: '#6a8a6a', s: '#4a6a4a', so: [-10, -6], l: '#1a2a1a', lw: 3 });
  cel(g, path([[250, 20], [260, -200], [200, -230], [170, 0]]), { f: '#6a8a6a', s: '#4a6a4a', so: [-10, -6], l: '#1a2a1a', lw: 3 });
  g.restore();
}
export function apartment(S) {
  const { g, e, t, u } = S, z = lerp(1, 1.06, u);
  g.save(); g.translate(960, 540); g.scale(z, z); g.translate(-960, -540);
  room(g, e, t);
  armchair(g, 820, 900, 1.05);
  const tq = q12(t);
  g.save(); g.translate(800, 870); g.scale(.62, .62);
  figure(g, PAL.warm, 'g', { pose: 'sit', expr: 'neutral', look: [-.3, .3], E: { lid: .3 }, armL: [1.0 + Math.sin(tq * 9) * .08, .9], armR: [.9, 1.0 - Math.sin(tq * 9) * .08],
    hold: (gg, R, L) => { line(gg, [[R[0] - 10, R[1]], [L[0] + 40, L[1] - 60]], '#c08a40', 5); line(gg, [[L[0], L[1]], [R[0] + 50, R[1] - 50]], '#c08a40', 5);
      cel(gg, path([[(R[0] + L[0]) / 2 - 50, R[1] + 10], [(R[0] + L[0]) / 2 + 60, R[1] + 6], [(R[0] + L[0]) / 2 + 40, R[1] + 70], [(R[0] + L[0]) / 2 - 40, R[1] + 74]]), { f: '#e8a030', s: '#b07020', so: [-4, -4], l: '#4a2a08', lw: 2 }); } });
  g.restore();
  // the phone on the side table, dark
  g.fillStyle = '#3a2216'; g.fillRect(1000, 690, 160, 14); g.fillRect(1070, 700, 14, 120);
  g.fillStyle = '#16161e'; g.fillRect(1030, 676, 70, 16);
  g.restore();
  return {};
}
export function photo(S) {
  const { g, e, t, lt, u } = S;
  // bokeh behind
  vgrad(g, 0, 0, W, H, [[0, '#3a2420'], [1, '#1a0e0c']]);
  for (let i = 0; i < 14; i++) { const c = ['#ffb860', '#ff6a8a', '#ffd890', '#ff9a5a'][i % 4]; airbrush(g, hash(i) * W, hash(i + 9) * H, 60 + hash(i + 3) * 80, 60 + hash(i + 3) * 80, c, .35, .2); airbrush(e, hash(i) * W, hash(i + 9) * H, 50, 50, c, .2); }
  const out = oldPhoto(g, e, 960 + lerp(-20, 20, u), 540, 1.0, t, { slide: seg(t, HIT.photoSlide, HIT.photoSlide + 1.0) });
  return { texts: out };
}
// the 1979 photo: young 外婆 in a hard hat, thumbs up, in front of 大黄 (also used for the match cut at the end)
export function oldPhoto(g, e, x, y, s, t, o = {}) {
  g.save(); g.translate(x, y); g.scale(s, s); g.rotate(o.rot ?? -.03);
  cel(g, poly([[-430, -330], [430, -330], [430, 330], [-430, 330]]), { f: '#6a4a2a', s: '#4a301a', so: [-10, -10], l: '#2a1a0a', lw: 3 });
  g.fillStyle = '#efe4c8'; g.fillRect(-400, -300, 800, 600);
  g.save(); g.beginPath(); g.rect(-370, -270, 740, 470); g.clip();
  const SP = sepia(PAL.day);
  vgrad(g, -370, -270, 740, 470, [[0, '#d8c8a8'], [1, '#a89070']]);
  mech(g, null, SP, { x: 120, y: 420, s: .8, eyes: 0, stamp: false, armL: { a1: .2, a2: -.1, pose: 'open' }, armR: { a1: -.2, a2: .1, pose: 'open' } });
  g.save(); g.translate(-170, 60); g.scale(.78, .78);
  figure(g, SP, 'g', { expr: 'happy', E: { look: [.1, 0] }, armR: [2.5, .6], young: true });
  g.restore();
  // young 外婆's head with the hard hat, drawn over the figure's head
  g.save(); g.translate(-166, -170); g.scale(.82, .82); head(g, SP, 'g', { view: 'q', expr: 'happy', body: false, young: true, hardhat: true }); g.restore();
  g.restore();
  // the thumb: a small fist with the thumb up beside her
  cel(g, path([[-40, -110], [-6, -110], [-2, -70], [-44, -66]]), { f: SP.gskin.f, s: SP.gskin.s, so: [-3, -3], l: SP.gskin.l, lw: 2 });
  cel(g, path([[-30, -112], [-30, -160], [-14, -162], [-14, -112]]), { f: SP.gskin.f, l: SP.gskin.l, lw: 2 });
  g.font = '700 40px "Noto Sans SC"'; g.fillStyle = '#4a3a2a'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(TXT.photoOld, 0, 252);
  // a highlight sliding across the glass
  if (o.slide > 0 && o.slide < 1) { g.save(); g.globalCompositeOperation = 'lighter'; const sx = -500 + o.slide * 1000; const gr = g.createLinearGradient(sx - 120, 0, sx + 120, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.5, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(sx - 160, -330); g.lineTo(sx + 80, -330); g.lineTo(sx + 160, 330); g.lineTo(sx - 80, 330); g.fill(); g.restore(); }
  const M = g.getTransform(), p0 = M.transformPoint(new DOMPoint(-110, 228)), p1 = M.transformPoint(new DOMPoint(110, 276));
  g.restore();
  return [{ id: 'photo', text: TXT.photoOld, x0: p0.x, y0: p0.y, x1: p1.x, y1: p1.y }];
}
export function sepia(P0) {
  const out = {}, sp = c => { const n = parseInt(c.slice(1), 16), r = n >> 16 & 255, g = n >> 8 & 255, b = n & 255, l = .3 * r + .59 * g + .11 * b; return '#' + [l * 1.07 + 18, l * .95 + 8, l * .78].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join(''); };
  for (const [k, v] of Object.entries(P0)) out[k] = typeof v === 'string' ? sp(v) : Object.fromEntries(Object.entries(v).map(([kk, c]) => [kk, sp(c)]));
  out.mech = { f: '#d8b060', s: '#a08040', h: '#f0d890', l: '#4a3410' };
  return out;
}
export function phoneBuzz(S) {
  const { g, e, t, lt } = S, tq = q12(t);
  room(g, e, t);
  g.save(); g.translate(960, 760); g.scale(1.35, 1.35); g.translate(-960, -760);
  armchair(g, 760, 1080, 1.5);
  const look = K([[HIT.buzz, 0], [HIT.buzz + .25, 1]], tq), reach = K([[HIT.buzz + .5, 0], [HIT.buzz + 1.1, 1, 'eio']], tq);
  g.save(); g.translate(720, 1180); g.scale(.95, .95);
  figure(g, PAL.warm, 'g', { pose: 'sit', expr: look > .5 ? 'worried' : 'neutral', look: [lerp(-.3, .6, look), .1], glasses: 'down', armR: [lerp(.9, 1.6, reach), lerp(1.0, .2, reach)], armL: [1.0, .9] });
  g.restore();
  // the phone buzzing on the side table (motion lines), then in her hand
  const buzz = t > HIT.buzz && reach < .9 ? Math.sin(t * 90) * 4 : 0;
  g.fillStyle = '#3a2216'; g.fillRect(1180, 820, 260, 20);
  if (reach < .9) { g.fillStyle = '#16161e'; g.fillRect(1250 + buzz, 796, 120, 28); g.fillStyle = '#8fe07a'; g.fillRect(1262 + buzz, 800, 96, 20); e.fillStyle = rgba('#8fe07a', .6); e.fillRect(1262, 800, 96, 20);
    if (t > HIT.buzz) for (const k of [-1, 1]) { line(g, [[1310 + k * 80, 790], [1310 + k * 96, 776]], '#ffe0a0', 4); line(g, [[1310 + k * 86, 808], [1310 + k * 108, 806]], '#ffe0a0', 4); } }
  g.restore();
  return {};
}
export function chat(S) {
  const { g, e, t, lt, sh } = S, two = sh.opt.which === 2;
  const pal = two ? PAL.dawn : PAL.warm;
  if (two) { g.drawImage(S.A.dawnSky.c, -200, -200); e.drawImage(S.A.dawnSky.e, -200, -200); }
  else { vgrad(g, 0, 0, W, H, [[0, '#3a2420'], [1, '#1a0e0c']]); for (let i = 0; i < 10; i++) airbrush(g, hash(i) * W, hash(i + 2) * H, 90, 90, '#ffb860', .2, .2); }
  // her (or his) hand holding the phone
  const handC = two ? pal.jskin : pal.gskin;
  cel(g, path([[700, 1100], [720, 860], [800, 820], [880, 860], [900, 1100]]), { f: handC.f, s: handC.s, so: [-8, -4], l: handC.l, lw: 3 });
  const B = two ? [{ who: 'me', text: TXT.chat2[0], t: .25 }, { who: 'them', text: TXT.chat2[1], t: .9 }]
    : [{ who: 'me', text: TXT.chat1[0], t: .2 }, { who: 'them', text: TXT.chat1[1], t: 1.0 }, { who: 'them', text: TXT.chat1[2], t: 1.6 }, { who: 'them', text: TXT.chat1[3], t: 2.2 }];
  const out = phoneChat(g, e, 960, 560, 1.3, two ? '外婆' : '阿杰', B, lt);
  for (const k of [-1, 1]) cel(g, path([[960 + k * 250, 760], [960 + k * 200, 700], [960 + k * 236, 680], [960 + k * 280, 740]]), { f: handC.f, s: handC.s, so: [-4, -4], l: handC.l, lw: 3 });
  return { texts: out };
}
export function decide(S) {
  const { g, e, t, lt } = S, tq = q8(t);
  vgrad(g, 0, 0, W, H, [[0, '#5a3428'], [1, '#2a160e']]);
  airbrush(g, 1500, 300, 600, 500, '#ffb860', .3); for (let i = 0; i < 8; i++) airbrush(g, 1300 + hash(i) * 600, hash(i + 1) * 700, 60, 60, ['#ff6a8a', '#35e7ff'][i % 2], .25, .2);
  const up = K([[HIT.glasses - .15, 0], [HIT.glasses + .25, 1, 'eio']], tq), dec = t > HIT.decide;
  g.save(); g.translate(860, 470); g.scale(2.7, 2.7); LWK.k = .75;
  head(g, PAL.warm, 'g', { view: 'q', expr: dec ? 'resolute' : 'worried', glasses: up > .5 ? 'up' : 'down', E: dec ? { glint: K([[HIT.decide, 0], [HIT.decide + .12, 1], [HIT.decide + .5, 0]], t) } : {} });
  // her hand pushing the glasses up
  if (up > 0 && up < 1) { const hy = lerp(30, -70, up); cel(g, path([[86, hy + 10], [60, hy - 8], [40, hy + 6], [52, hy + 40], [90, hy + 60]]), { f: PAL.warm.gskin.f, s: PAL.warm.gskin.s, so: [-3, -3], l: PAL.warm.gskin.l, lw: 1.6 }); }
  LWK.k = 1; g.restore();
  return {};
}
export function kitchen(S) {
  const { g, e, t, lt } = S, tq = q12(t);
  vgrad(g, 0, 0, W, H, [[0, '#4a3a30'], [1, '#2a1e18']]);
  for (let i = 0; i < 6; i++) { g.fillStyle = rgba('#ffffff', .05); g.fillRect(0, 120 + i * 110, W, 4); }          // tiles
  g.fillStyle = '#6a4a32'; g.fillRect(0, 640, W, 440); g.fillStyle = '#8a6a4a'; g.fillRect(0, 630, W, 20);
  // bamboo steamer with dumplings
  cel(g, path([[300, 640], [300, 560], [700, 560], [700, 640]]), { f: '#d8b070', s: '#a8803a', so: [-10, -4], l: '#4a3010', lw: 3 });
  for (let i = 0; i < 6; i++) { const dx = 360 + (i % 3) * 110, dy = 590 - Math.floor(i / 3) * 0; if (t > HIT.lid - .9 + i * .12 && i > 2) continue; dumpling(g, PAL.warm, dx, dy - (i > 2 ? 30 : 0), 1); }
  for (let i = 0; i < 4; i++) { const u = (t * .7 + i / 4) % 1; g.fillStyle = rgba('#ffffff', .4 * (1 - u)); g.beginPath(); g.arc(420 + i * 70 + Math.sin(u * 6) * 20, 540 - u * 260, 30 + u * 50, 0, TAU); g.fill(); }
  // the tin: lid comes down at HIT.lid
  lunchboxOpen(g, PAL.warm, 1180, 600, 1.4, K([[HIT.lid - .2, 0], [HIT.lid, 1, 'ei']], t));
  // her hands with chopsticks moving dumplings across
  const m = seg(tq, S.sh.t0, HIT.lid - .3), hx = lerp(560, 1150, (m * 3) % 1), hy = 520 - Math.sin(((m * 3) % 1) * Math.PI) * 120;
  cel(g, path([[hx + 30, hy + 30], [hx + 200, hy - 40], [hx + 260, hy + 60], [hx + 90, hy + 120]]), { f: PAL.warm.gjacket.f, s: PAL.warm.gjacket.s, so: [-6, -6], l: PAL.warm.gjacket.l, lw: 3 });
  cel(g, path([[hx - 30, hy - 20], [hx + 40, hy - 30], [hx + 50, hy + 40], [hx - 20, hy + 50]]), { f: PAL.warm.gskin.f, s: PAL.warm.gskin.s, so: [-4, -4], l: PAL.warm.gskin.l, lw: 2.4 });
  line(g, [[hx - 10, hy - 10], [hx - 120, hy + 40]], '#c08a40', 6); line(g, [[hx, hy], [hx - 116, hy + 56]], '#c08a40', 6);
  if (m < .99) dumpling(g, PAL.warm, hx - 120, hy + 56, .8);
  return {};
}
export function dumpling(g, Pp, x, y, s) {
  g.save(); g.translate(x, y); g.scale(s, s);
  cel(g, path([[-44, 12], [-36, -14], [-12, -30], [12, -30], [36, -14], [44, 12], [0, 22]]), { f: Pp.dumpling.f, s: Pp.dumpling.s, so: [-5, -5], h: Pp.dumpling.h, ho: [3, 3], l: Pp.dumpling.l, lw: 2 });
  for (let k = -2; k <= 2; k++) line(g, [[k * 10, -28], [k * 12, -14]], Pp.dumpling.l, 1.4);
  g.restore();
}
function lunchboxOpen(g, Pp, x, y, s, lid) {
  g.save(); g.translate(x, y); g.scale(s, s);
  cel(g, poly([[-130, 0], [130, 0], [130, 110], [-130, 110]]), { f: Pp.tin.f, s: Pp.tin.s, so: [-10, -6], h: Pp.tin.h, ho: [4, 4], l: Pp.tin.l, lw: 2.6 });
  for (let i = 0; i < 4; i++) dumpling(g, Pp, -84 + i * 56, -6, .7);
  const ly = lerp(-200, -8, lid), la = lerp(-.5, 0, lid);
  g.save(); g.translate(-130, ly); g.rotate(la); cel(g, poly([[0, -10], [262, -10], [262, 14], [0, 14]]), { f: Pp.tin.f, s: Pp.tin.s, so: [-4, -4], h: Pp.tin.h, l: Pp.tin.l, lw: 2.6 }); g.restore();
  g.restore();
}
export function knot(S) {
  const { g, e, t } = S, tq = q12(t), k = K([[S.sh.t0, 0], [HIT.knot, 1, 'eio']], tq);
  vgrad(g, 0, 0, W, H, [[0, '#5a3a2a'], [1, '#2a180e']]);
  g.save(); g.translate(960, 640); g.scale(3.2, 3.2); lunchbox(g, PAL.warm, 0, 0, 1, {}); g.restore();
  // two hands pulling the cloth ears tight
  for (const s of [-1, 1]) {
    const hx = 960 + s * lerp(260, 200, k), hy = lerp(330, 380, k);
    cel(g, path([[hx + s * 260, hy + 120], [hx + s * 40, hy + 30], [hx, hy - 20], [hx - s * 60, hy + 10], [hx - s * 40, hy + 70], [hx + s * 120, hy + 160]]), { f: PAL.warm.gskin.f, s: PAL.warm.gskin.s, so: [-6, -6], l: PAL.warm.gskin.l, lw: 3 });
    cel(g, path([[hx + s * 260, hy + 120], [hx + s * 520, hy + 140], [hx + s * 520, hy + 360], [hx + s * 160, hy + 200]]), { f: PAL.warm.gjacket.f, s: PAL.warm.gjacket.s, so: [-8, -8], l: PAL.warm.gjacket.l, lw: 3 });
  }
  if (t > HIT.knot && t < HIT.knot + .15) { for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; line(g, [[960 + Math.cos(a) * 120, 540 + Math.sin(a) * 100], [960 + Math.cos(a) * 200, 540 + Math.sin(a) * 170]], '#ffe0a0', 6); } }
  return {};
}
export function liftBox(S) {
  const { g, e, t, lt } = S, tq = q12(t), up = K([[S.sh.t0, 0], [HIT.lift, 1, 'back']], tq);
  vgrad(g, 0, 0, W, H, [[0, '#5a3428'], [1, '#24140c']]); airbrush(g, 500, 300, 600, 500, '#ffb860', .3);
  g.save(); g.translate(900, 1280); g.scale(1.22, 1.22);
  figure(g, PAL.warm, 'g', { expr: up > .9 ? 'resolute' : 'tender', look: [.4, .4 - up * .4], armL: [lerp(.5, 1.0, up), lerp(.7, .9, up)], armR: [lerp(.4, .9, up), lerp(.8, 1.0, up)],
    hold: (gg, R, L) => lunchbox(gg, PAL.warm, (R[0] + L[0]) / 2 + 30, (R[1] + L[1]) / 2 - 50, 1.0, { steam: t }) });
  g.restore();
  return {};
}

// ================================================================ GARAGE (storm light)
function garage(g, e, t, o = {}) {
  vgrad(g, 0, 0, W, H, [[0, '#14121e'], [1, '#22202e']]);
  for (let x = 0; x < W; x += 46) { g.fillStyle = rgba('#ffffff', .035); g.fillRect(x, 0, 18, 820); }           // corrugated wall
  g.fillStyle = '#1a1824'; g.fillRect(0, 820, W, 260);
  for (let x = 0; x < W; x += 160) { g.fillStyle = rgba('#000000', .25); g.fillRect(x, 820, 4, 260); }
  // a high window with rain, lightning behind
  g.fillStyle = '#2a2a48'; g.fillRect(1500, 80, 260, 140);
  // the bulb
  const sw = Math.sin(t * 1.7) * .12;
  g.save(); g.translate(900, 0); g.rotate(sw); line(g, [[0, 0], [0, 200]], '#0a0a10', 3); g.restore();
  const bx = 900 + Math.sin(sw) * 200, by = Math.cos(sw) * 200;
  lamp(g, e, bx, by + 14, 24, '#ffd890', o.bulb ?? .9);
  airbrush(g, bx, by + 300, 520, 420, '#ffd890', .12 * (o.bulb ?? .9));
}
export function garageWide(S) {
  const { g, e, t } = S;
  garage(g, e, t);
  // the tarp-covered hulk
  cel(g, path([[520, 830], [500, 420], [620, 240], [900, 180], [1180, 230], [1330, 420], [1320, 830]]), { f: '#4a5a4a', s: '#2e3a30', so: [-30, -20], h: '#6a7a68', l: '#141a14', lw: 3,
    clipFn: gg => { for (let k = 0; k < 7; k++) line(gg, [[560 + k * 110, 260 + k * 20], [600 + k * 100, 830]], rgba('#141a14', .5), 2.4); } });
  const lf = flash(S, HIT.flash1, .12, 1);
  // 外婆 in the doorway, backlit, with the lunchbox
  g.save(); g.translate(240, 900); g.scale(.42, .42);
  figure(g, PAL.storm, 'g', { expr: 'resolute', armL: [.7, .7], armR: [.6, .8], hold: (gg, R, L) => lunchbox(gg, PAL.storm, (R[0] + L[0]) / 2 + 20, (R[1] + L[1]) / 2 - 50, 1, { steam: t }) });
  g.restore();
  return {};
}
export function unveil(S) {
  const { g, e, t } = S, tq = q12(t), k = K([[HIT.tug, 0], [HIT.unveil + .4, 1, 'eo']], tq);
  garage(g, e, t, { bulb: .9 });
  const lf = flash(S, HIT.unveil, .15, 1.3);
  // 大黄, low angle
  g.save(); g.translate(960, 1260); g.scale(1.0, 1.0); g.transform(1, 0, 0, 1, 0, 0);
  mech(g, e, PAL.storm, { x: 0, y: 0, s: 1.75, eyes: 0, beacon: 0, armL: { a1: .2, a2: -.1, pose: 'open' }, armR: { a1: -.2, a2: .1, pose: 'open' }, rim: lf > .2 ? '#e8eeff' : null });
  g.restore();
  // the tarp: lifted off up and to the left, flapping
  if (k < 1) {
    const ox = lerp(0, -1400, k), oy = lerp(0, -900, k * k), rot = -k * .9;
    g.save(); g.translate(960 + ox, 400 + oy); g.rotate(rot);
    const fl = Math.sin(t * 20) * 30 * k;
    cel(g, path([[-520, 700 - k * 300], [-560, -200], [-200, -420 + fl], [300, -380], [560, -160 - fl], [520, 700 - k * 300]]), { f: '#4a5a4a', s: '#2e3a30', so: [-30, -20], h: '#6a7a68', l: '#141a14', lw: 3 });
    g.restore();
  }
  // 外婆's arm yanking the tarp corner (bottom left)
  if (k < .6) { const hx = lerp(260, 120, k), hy = lerp(980, 900, k); cel(g, path([[hx - 300, 1100], [hx - 60, hy + 20], [hx + 40, hy - 10], [hx + 30, hy + 60], [hx - 200, 1140]]), { f: PAL.storm.gjacket.f, s: PAL.storm.gjacket.s, so: [-6, -6], l: PAL.storm.gjacket.l, lw: 3 }); }
  return {};
}
// the cockpit interior: dome frame, dashboard, gauges, the bubble level, the lunchbox holder
export function cockpit(g, e, Pp, t, o = {}) {
  const lights = o.lights ?? 1;
  vgrad(g, 0, 0, W, H, [[0, o.bg0 || '#0c0c1a'], [1, o.bg1 || '#1a1a2a']]);
  if (o.outside) o.outside(g, e);
  // glass dome rim
  g.save(); g.strokeStyle = '#2a2834'; g.lineWidth = 120; g.beginPath(); g.arc(960, 640, 1060, Math.PI * 1.05, Math.PI * 1.95); g.stroke(); g.restore();
  // rain on the glass
  if (o.rainGlass) { g.save(); g.strokeStyle = rgba('#cfe3ff', .4); g.lineWidth = 3; for (let i = 0; i < 40; i++) { const x = hash(i) * W, y = (hash(i + 3) * H + t * (300 + hash(i) * 400)) % H; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 10, y + 50); g.stroke(); } g.restore(); }
  // the pilot
  if (o.pilot) o.pilot(g);
  // dashboard
  cel(g, path([[0, 820], [400, 760], [1520, 760], [1920, 820], [1920, 1080], [0, 1080]]), { f: Pp.mechDark.f, s: Pp.mechDark.s, so: [0, -14], h: Pp.mechDark.h, l: Pp.mechDark.l, lw: 3 });
  for (let i = 0; i < 4; i++) { const gx = 520 + i * 140, gy = 880; const G = new Path2D(); G.arc(gx, gy, 46, 0, TAU); cel(g, G, { f: '#101018', l: Pp.mechGrey.l, lw: 4 });
    const a = -2.2 + (o.needle ?? 1) * (1.2 + i * .5) * lights; line(g, [[gx, gy], [gx + Math.cos(a) * 36, gy + Math.sin(a) * 36]], lights > .3 ? '#ff6a3a' : '#5a3a3a', 4);
    if (lights > .3) { e.fillStyle = rgba('#ffb060', .5 * lights); e.beginPath(); e.arc(gx, gy, 44, 0, TAU); e.fill(); } }
  for (let i = 0; i < 6; i++) { const on = lights > .3 && (hash(i + Math.floor(t * 6)) > .3 || o.steady); const c = ['#4dff9a', '#ffd23f', '#ff3a4a'][i % 3]; g.fillStyle = on ? c : '#2a2a34'; g.fillRect(1100 + i * 50, 860, 34, 20); if (on) { e.fillStyle = rgba(c, .7); e.fillRect(1100 + i * 50, 860, 34, 20); } }
  // the radio screen
  g.fillStyle = '#0a0e0a'; g.fillRect(1100, 920, 300, 110);
  if (o.radio === 'static') { for (let i = 0; i < 300; i++) { g.fillStyle = rgba('#cfe6cf', hash(i + Math.floor(t * 24) * 13)); g.fillRect(1100 + hash(i * 3 + Math.floor(t * 24)) * 296, 920 + hash(i * 7 + Math.floor(t * 24)) * 106, 4, 3); } }
  else if (lights > .3) { g.fillStyle = '#4dff9a'; g.font = '700 40px "Noto Sans SC"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(TXT.dash, 1250, 975); e.fillStyle = rgba('#4dff9a', .4); e.fillRect(1100, 920, 300, 110); }
  // the bubble level (planted)
  levelGauge(g, e, 240, 900, 1, o.bubble ?? 0, lights);
  if (o.box) lunchbox(g, Pp, 1660, 700, 1.25, { steam: t, tilt: o.boxTilt ?? 0 });
}
export function levelGauge(g, e, x, y, s, bubble, lights = 1) {
  g.save(); g.translate(x, y); g.scale(s, s);
  cel(g, path([[-130, -40], [130, -40], [130, 40], [-130, 40]]), { f: '#2a2834', l: '#0a0a10', lw: 3 });
  const T = new Path2D(); T.roundRect(-110, -22, 220, 44, 22);
  g.fillStyle = lights > .3 ? '#d8f05a' : '#6a7a3a'; g.fill(T); if (lights > .3 && e) { e.save(); e.setTransform(g.getTransform()); e.fillStyle = rgba('#d8f05a', .45); e.fill(T); e.restore(); }
  g.strokeStyle = '#0a0a10'; g.lineWidth = 3; g.stroke(T);
  for (const k of [-1, 1]) line(g, [[k * 26, -22], [k * 26, 22]], '#0a0a10', 3);
  const bx = clamp(bubble, -1, 1) * 80; g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(bx, -4, 22, 13, 0, 0, TAU); g.fill(); g.strokeStyle = '#5a6a2a'; g.lineWidth = 2; g.stroke();
  g.restore();
}
const pilotG = (Pp, o) => g => { g.save(); g.translate(o.x ?? 860, o.y ?? 470); g.scale(o.s ?? 2.4, o.s ?? 2.4); LWK.k = .75; head(g, Pp, 'g', { view: 'q', expr: o.expr, look: o.look, E: o.E, light: o.light }); LWK.k = 1; g.restore(); };
export function cockpitIn(S) {
  const { g, e, t } = S, tq = q12(t), sit = K([[S.sh.t0, 1], [HIT.sit, 0, 'eo']], tq);
  cockpit(g, e, PAL.storm, t, { lights: 0, pilot: g2 => { g2.save(); g2.translate(0, sit * 200); pilotG(PAL.storm, { expr: 'resolute', look: [.3, .4] })(g2); g2.restore(); }, box: t > HIT.sit + .2 });
  if (t <= HIT.sit + .2) lunchbox(g, PAL.storm, lerp(1300, 1660, seg(tq, S.sh.t0, HIT.sit + .2)), lerp(900, 700, seg(tq, S.sh.t0, HIT.sit + .2)), 1.25, { steam: t });
  return {};
}
export function level(S) {
  const { g, e, t, sh } = S, tq = q12(t), gust = sh.opt.gust;
  const P0 = gust ? PAL.storm : PAL.storm;
  vgrad(g, 0, 0, W, H, [[0, '#14141e'], [1, '#22222e']]);
  for (let i = 0; i < 8; i++) airbrush(g, hash(i) * W, hash(i + 1) * H, 80, 80, ['#ffb060', '#4dff9a', '#ff3a4a'][i % 3], .25, .2);
  let bubble, tap = 0;
  if (!gust) { tap = t > HIT.tapLevel && t < HIT.tapLevel + .2 ? 1 : 0; bubble = K([[S.sh.t0, .7], [HIT.tapLevel, .7], [HIT.tapLevel + .5, 0, 'spring']], tq); }
  else bubble = K([[S.sh.t0, -.9], [S.sh.t0 + .3, .8], [HIT.level - .1, -.6], [HIT.level + .35, 0, 'spring']], tq);
  levelGauge(g, e, 960, 560, 3.2, bubble, 1);
  g.save(); g.font = '700 54px "Noto Sans SC"'; g.fillStyle = '#d8f05a'; g.textAlign = 'center'; g.fillText('水平', 960, 400); g.restore();
  // her finger tapping (plant) / her hand steadying the lunchbox (pay-off)
  if (!gust) { const fy = lerp(300, 470, tap ? 1 : K([[HIT.tapLevel - .3, 0], [HIT.tapLevel, 1, 'ei'], [HIT.tapLevel + .3, 0]], tq)); cel(g, path([[1060, fy - 260], [1120, fy - 250], [1080, fy], [1040, fy + 10], [1020, fy - 20]]), { f: P0.gskin.f, s: P0.gskin.s, so: [-4, -4], l: P0.gskin.l, lw: 3 }); }
  else { const tilt = K([[S.sh.t0, .5], [HIT.level, 0, 'spring']], tq); lunchbox(g, P0, 1500, 300, 1.6, { tilt, steam: t }); cel(g, path([[1300, 360], [1420, 330], [1440, 400], [1310, 420]]), { f: P0.gskin.f, s: P0.gskin.s, so: [-4, -4], l: P0.gskin.l, lw: 3 }); }
  return {};
}
export function cough(S) {
  const { g, e, t } = S, tq = q8(t);
  const on = t > HIT.smack + .05 ? 1 : (Math.abs(t - HIT.cough1) < .12 || Math.abs(t - HIT.cough2) < .12) ? .8 : 0;
  const annoyed = t > HIT.cough2 + .1 && t < HIT.smack + .3;
  const smackK = K([[HIT.smack - .25, 0], [HIT.smack, 1, 'ei'], [HIT.smack + .25, 0]], tq);
  const shake = t > HIT.smack && t < HIT.smack + .25 ? Math.sin(t * 120) * 10 : 0;
  g.save(); g.translate(shake, 0);
  cockpit(g, e, PAL.storm, t, { lights: on, steady: t > HIT.smack, box: true, pilot: pilotG(PAL.storm, { expr: annoyed ? 'fierce' : t > HIT.smack + .1 ? 'sly' : 'resolute', look: [.2, .5] }) });
  // her fist coming down on the dashboard
  if (smackK > .01) { const hx = 700, hy = lerp(520, 800, smackK); cel(g, path([[hx - 80, hy - 40], [hx + 60, hy - 50], [hx + 70, hy + 50], [hx - 70, hy + 60]]), { f: PAL.storm.gskin.f, s: PAL.storm.gskin.s, so: [-6, -6], l: PAL.storm.gskin.l, lw: 3 });
    cel(g, path([[hx - 80, hy - 40], [hx - 200, hy - 260], [hx - 60, hy - 300], [hx + 60, hy - 50]]), { f: PAL.storm.gjacket.f, s: PAL.storm.gjacket.s, so: [-6, -6], l: PAL.storm.gjacket.l, lw: 3 }); }
  if (t > HIT.smack && t < HIT.smack + .18) for (let i = 0; i < 12; i++) { const a = -Math.PI * (i / 11); line(g, [[700 + Math.cos(a) * 120, 800 + Math.sin(a) * 90], [700 + Math.cos(a) * 220, 800 + Math.sin(a) * 170]], '#ffe680', 7); }
  // the cough puffs (dark smoke from the vents)
  for (const c of [HIT.cough1, HIT.cough2]) { const d = t - c; if (d > 0 && d < .8) { g.fillStyle = rgba('#2a2a30', .6 * (1 - d / .8)); g.beginPath(); g.arc(200 + d * 200, 700 - d * 260, 60 + d * 140, 0, TAU); g.fill(); } }
  g.restore();
  return {};
}
export function eyesOn(S) {
  const { g, e, t } = S, k = K([[HIT.eyesOn, 0], [HIT.eyesOn + .25, 1, 'eo']], t);
  // impact frame for two frames, then the glow
  if (t < HIT.eyesOn + 2 / 24) { g.fillStyle = '#fff6d0'; g.fillRect(0, 0, W, H); speedLines(g, Math.floor(t * 24), { type: 'radial', cx: 960, cy: 540, n: 120, col: '#1a1020', a: .9 }); return {}; }
  g.save(); g.translate(960, 540 + 578 * 4.2 - 40); g.scale(4.2, 4.2); g.translate(0, 0);
  mech(g, e, PAL.storm, { x: 0, y: 0, s: 1, eyes: k, beacon: k, stamp: false });
  g.restore();
  for (const sx of [-1, 1]) flare(e, 960 + sx * 210, 500, .9 * k, '#ffd23f', { ghosts: sx > 0 });
  return {};
}
export function stepOut(S) {
  const { g, e, t, lt, A } = S, tq = q12(t);
  // the street outside, beyond the rolled-up door
  g.drawImage(A.street.c, -800, 140, A.street.w, A.street.h); e.drawImage(A.street.e, -800, 140, A.street.w, A.street.h);
  wetFloor(g, 840);
  const door = K([[HIT.door - .1, 0], [HIT.door + .25, 1, 'eo']], t);
  g.fillStyle = '#2a2834'; g.fillRect(0, 0, W, lerp(980, 60, door)); for (let y = 0; y < lerp(980, 60, door); y += 30) { g.fillStyle = rgba('#000000', .3); g.fillRect(0, y, W, 4); }
  g.fillStyle = '#14121a'; g.fillRect(0, 0, 160, H); g.fillRect(W - 160, 0, 160, H);
  const step = seg(tq, HIT.door + .2, S.sh.t1);
  mech(g, e, PAL.night, { x: 960, y: lerp(1500, 1360, step), s: lerp(1.5, 1.85, step), walk: step * 1.5, eyes: 1, beacon: (Math.floor(t * 4) % 2), steam: t, armL: { a1: .3, a2: -.2, pose: 'fist' }, armR: { a1: -.3, a2: .2, pose: 'fist' } });
  rainOn(S, { n: 260 });
  return { };
}
