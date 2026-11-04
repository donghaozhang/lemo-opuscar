// 《深夜翻译官》 — film assembly.
// Frame: shot paints a tonal 4:3 frame (+ a red colour mask) → Redraw (ink, wash steps, boiling hatch) → iris →
// FilmPost (silver/sepia print, grain, flicker, weave, scratches, burn; keeps the red) → dust/hair → the story burn
// (the reel itself catching fire) → the 4:3 gate between the curtains. Motion is sampled at 16 fps (20 in the hurry).
import { Redraw } from './engine/redraw.js';
import { FilmPost, damage } from './engine/film.js';
import { intertitle, iris, theatre, CARD_BG, CARD_FG } from './engine/cards.js';
import { setFrame, S as IS, grey } from './engine/ink.js';
import { SEC, DUR as D, HIT, secAt } from './timeline.js';
import { CARDS, TITLE_EN, TITLE_ZH, PAGE_EN, PAGE_BAD, PAGE_FIX, SUBS } from './cardspecs.js';
import { setMask, maskAlpha } from './mask.js';
import { xiaoYi } from './robots.js';
import { K, clamp, lerp, ss, seg, eo } from './lib.js';
import * as SH from './shots.js';

export const DUR = D;
const W = 1920, H = 1080, FW = 1440, FH = 1080, GATE = { x: 240, y: 0, w: FW, h: FH };
const mk = () => { const c = document.createElement('canvas'); c.width = FW; c.height = FH; return c; };
const fc = mk(), fg = fc.getContext('2d'), mc = mk(), mg = mc.getContext('2d');
let RD = null, FP = null;

// per-section print look: str = damage, sepia, fps = motion sampling, crank = projector speed feel
const LOOK = {
  TITLE: { str: .5, sepia: .16, fps: 16 }, NIGHT: { str: .5, sepia: .08, fps: 16 }, GOAL: { str: .5, sepia: .08, fps: 16 },
  WORK: { str: .5, sepia: .13, fps: 16 }, PAGE: { str: .45, sepia: .13, fps: 16 }, HURRY: { str: .72, sepia: .09, fps: 20, crank: 1.35 },
  SHOUT: { str: .85, sepia: .05, fps: 20, crank: 1.4 }, DASH: { str: .9, sepia: .05, fps: 20, crank: 1.4 }, CATCH: { str: .85, sepia: .06, fps: 20, crank: 1.3 },
  TENDER: { str: .34, sepia: .26, fps: 16 }, DAWN: { str: .3, sepia: .33, fps: 16 }, LAST: { str: .3, sepia: .35, fps: 16 }, END: { str: .4, sepia: .32, fps: 16 },
};
function lookAt(t, sec) {
  const L = { crank: 1, ...LOOK[sec.name] };
  if (sec.name === 'CATCH') { const h = ss(seg(t, HIT.heal - .2, HIT.heal + 1.2)); L.str = lerp(.85, .38, h); L.sepia = lerp(.06, .22, h); L.crank = lerp(1.3, 1, h); }
  return L;
}

// ---- the story burn: the reel smoulders from the smoke, burns in from the edges through the dash, and heals after the catch
export const burnAt = t => K([[HIT.smoke, 0], [HIT.silence1, .14], [SEC.SHOUT.t1, .3], [HIT.dash + 1, .42], [HIT.trip, .62], [HIT.catch, .74], [HIT.heal, .55], [HIT.heal + 1.1, 0, 'eo']], t);
let BF = null; const BW = 240, BH = 180, bc = document.createElement('canvas'); bc.width = BW; bc.height = BH; const bg = bc.getContext('2d');
const bimg = bg.createImageData(BW, BH);
function burnField() {
  if (BF) return BF;
  const h = (x, y) => { const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); };
  const vn = (x, y) => { const i = Math.floor(x), j = Math.floor(y), u = x - i, v = y - j, a = u * u * (3 - 2 * u), b = v * v * (3 - 2 * v); return (h(i, j) * (1 - a) + h(i + 1, j) * a) * (1 - b) + (h(i, j + 1) * (1 - a) + h(i + 1, j + 1) * a) * b; };
  BF = new Float32Array(BW * BH);
  for (let y = 0; y < BH; y++) for (let x = 0; x < BW; x++) {
    let n = 0, a = .5, f = 1 / 14; for (let o = 0; o < 4; o++) { n += a * vn(x * f + o * 7, y * f + o * 3); a *= .5; f *= 2.1; }
    const ex = Math.min(x, BW - 1 - x) / BH, ey = Math.min(y, BH - 1 - y) / BH;     // distance to the frame edge
    BF[y * BW + x] = Math.min(ex, ey) * 1.25 + (n - .5) * .32;
  }
  return BF;
}
function drawBurn(g, amt, frame) {
  if (amt <= .004) return;
  const F = burnField(), d = bimg.data, thr = amt * .17, flick = .85 + .15 * Math.sin(frame * 1.7);
  for (let i = 0; i < BW * BH; i++) {
    const v = F[i] - thr + Math.sin(frame * .9 + i * .013) * .004;
    let r = 0, gg = 0, b = 0, a = 0;
    if (v < 0) { const k = clamp(-v / .05); r = 22 * (1 - k) + 10; gg = 14 * (1 - k) + 7; b = 8; a = 255; }               // burned through: charred
    else if (v < .035) { const k = 1 - v / .035; r = 255; gg = 236 * k + 200 * (1 - k); b = 190 * k + 120 * (1 - k); a = 255 * k * flick; }   // melting rim: blown-out white
    else if (v < .09) { const k = 1 - (v - .035) / .055; r = 70; gg = 40; b = 20; a = 150 * k * k; }                  // scorch
    d[i * 4] = r; d[i * 4 + 1] = gg; d[i * 4 + 2] = b; d[i * 4 + 3] = a;
  }
  bg.putImageData(bimg, 0, 0);
  g.save(); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(bc, GATE.x, GATE.y, FW, FH); g.restore();
}

// ---- the title card: the English title on a black roller blind that Xiao Yi pulls; the Chinese underneath
function titleCard(g, t) {
  intertitle(g, FW, FH, { level: 1, seed: 2, lines: TITLE_ZH, gap: 1.5, dy: -10 }, t);
  const inner = { x0: 96, x1: FW - 96, y0: 96 };
  const bottom = K([[0, 940], [HIT.grab, 940], [HIT.grab + .1, 968, 'eo'], [HIT.snap, 968], [HIT.snap + .24, inner.y0 + 6, 'ei']], t);
  const rollR = 13 + (1 - (bottom - inner.y0) / (940 - inner.y0)) * 9;
  if (bottom > inner.y0 + 8) {
    g.save(); g.beginPath(); g.rect(inner.x0, inner.y0, inner.x1 - inner.x0, bottom - inner.y0); g.clip();
    g.fillStyle = '#121110'; g.fillRect(inner.x0, inner.y0, inner.x1 - inner.x0, bottom - inner.y0);
    g.strokeStyle = CARD_FG; g.lineWidth = 2; g.strokeRect(inner.x0 + 26, inner.y0 + 26, inner.x1 - inner.x0 - 52, 9999);
    let y = bottom - 470;
    for (const l of TITLE_EN) {
      g.font = `${l.italic ? 'italic ' : ''}${l.weight ?? 400} ${l.size}px "${l.font}"`; g.fillStyle = CARD_FG; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.letterSpacing = (l.spacing ?? 0) + 'px'; g.fillText(l.text, FW / 2, y); g.letterSpacing = '0px'; y += l.size * 1.7;
    }
    g.fillRect(FW / 2 - 160, bottom - 300, 320, 2);
    g.restore();
    // bottom rail + the pull ring
    g.fillStyle = grey(.42); g.fillRect(inner.x0, bottom - 10, inner.x1 - inner.x0, 12);
    g.strokeStyle = grey(.75); g.lineWidth = 3; g.beginPath(); g.moveTo(FW / 2, bottom + 2); g.lineTo(FW / 2, bottom + 18); g.stroke();
    g.beginPath(); g.arc(FW / 2, bottom + 30, 12, 0, 7); g.stroke();
  }
  // the roller at the top (fattens as the blind rolls up)
  g.fillStyle = grey(.34); g.fillRect(inner.x0 - 6, inner.y0 - rollR, inner.x1 - inner.x0 + 12, rollR * 2);
  g.fillStyle = grey(.6); g.fillRect(inner.x0 - 6, inner.y0 - rollR + 3, inner.x1 - inner.x0 + 12, 3);
  // Xiao Yi, on the card: peeks over the lower edge, looks at us, pulls the ring, nods, drops away
  const gy = K([[0, 1420], [HIT.peek - .35, 1420], [HIT.peek, 1225, 'eo'], [HIT.lookUs - .15, 1225], [HIT.lookUs + .1, 1140, 'eo'], [HIT.drop - .1, 1140], [HIT.drop + .35, 1440, 'ei']], t);
  const ringY = bottom + 30;
  const st = { x: 830, y: gy, s: 2, roll: 0,
    ex: K([[HIT.peek, -.6], [HIT.lookUs - .1, -.6], [HIT.lookUs, 0, 'snap'], [HIT.grab - .25, 0], [HIT.grab - .1, -.6], [HIT.snap + .1, -.6], [HIT.snap + .35, 0], [HIT.drop, 0]], t),
    ey: K([[HIT.peek, -.9], [HIT.lookUs - .1, -.9], [HIT.lookUs, 0, 'snap'], [HIT.grab - .25, 0], [HIT.grab - .1, -.7], [HIT.snap + .05, -1], [HIT.snap + .35, 0]], t),
    blink: K([[HIT.lookUs + .45, 0], [HIT.lookUs + .52, 1], [HIT.lookUs + .6, 0]], t),
    brow: K([[HIT.snap, 0], [HIT.snap + .05, .9], [HIT.nod, .9], [HIT.nod + .3, 0]], t),
    tilt: K([[HIT.nod - .1, 0], [HIT.nod + .08, .18], [HIT.nod + .3, 0]], t),
    squash: K([[HIT.snap, 1], [HIT.snap + .05, .86, 'eo'], [HIT.snap + .3, 1.04], [HIT.snap + .5, 1]], t),
    ant: Math.sin((t - HIT.snap) * 24) * K([[HIT.snap, 0], [HIT.snap + .05, 1.2], [HIT.snap + 1.2, 0]], t),
    bulb: K([[HIT.nod, 0], [HIT.nod + .15, 1], [HIT.drop, 1], [HIT.drop + .2, 0]], t) };
  const ringL = [(FW / 2 - st.x) / 2, (ringY - st.y) / 2];
  const armUp = K([[HIT.grab - .35, 0], [HIT.grab - .05, 1, 'eio'], [HIT.snap + .02, 1], [HIT.snap + .25, 0, 'eo']], t);
  st.armL = { t: [lerp(-56, ringL[0], armUp), lerp(-30, ringL[1], armUp)], open: K([[HIT.grab - .1, .8], [HIT.grab, .1]], t) };
  st.armR = { t: [60, -30] };
  IS.mode = 'ink'; IS.sepLine = 1;
  xiaoYi(g, st);
  IS.mode = 'tonal'; IS.sepLine = .5;
}

// ---- iris per section (film coordinates, through each shot's camera)
function irisAt(t, sec, shot) {
  const full = 1900;
  if (sec.name === 'NIGHT') { if (t < HIT.irisOpen) return { x: shot.focus[0], y: shot.focus[1], r: .5 }; const k = ss(seg(t, HIT.irisOpen, HIT.irisOpen + 1.9)); return { x: shot.focus[0], y: shot.focus[1], r: .5 + k * k * full }; }
  if (sec.name === 'WORK' && t > HIT.look) { const k = ss(seg(t, HIT.look, HIT.look + .45)); return { x: shot.focus[0], y: shot.focus[1], r: lerp(full, 300, k) }; }
  if (sec.name === 'PAGE') { const k = ss(seg(t, SEC.PAGE.t0, SEC.PAGE.t0 + .5)); return { x: 720, y: 560, r: lerp(260, 620, k) }; }
  if (sec.name === 'TENDER' && t > SEC.TENDER.t1 - .7) { const k = ss(seg(t, SEC.TENDER.t1 - .7, SEC.TENDER.t1)); return { x: shot.focus[0], y: shot.focus[1], r: lerp(full, 1, k) }; }
  if (sec.name === 'DAWN' && t < SEC.DAWN.t0 + .7) { const k = ss(seg(t, SEC.DAWN.t0, SEC.DAWN.t0 + .7)); return { x: shot.focus[0], y: shot.focus[1], r: lerp(1, full, k) }; }
  return null;
}

const SHOTS = { NIGHT: SH.night, WORK: SH.desk, HURRY: SH.desk, PAGE: SH.pageShot, DASH: SH.dash, CATCH: SH.catchShot, TENDER: SH.tender, DAWN: SH.dawn };
export function renderFilm(g, t) {
  RD = RD || new Redraw(FW, FH); FP = FP || new FilmPost(FW, FH);
  const sec = secAt(t), look = lookAt(t, sec), frame = Math.floor(t * 24 + 1e-6);
  const ta = Math.floor(t * look.fps + 1e-6) / look.fps;            // hand-cranked motion sampling
  for (const c of [fg, mg]) { c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.filter = 'none'; }
  mg.clearRect(0, 0, FW, FH); setMask(mg); maskAlpha(1);
  let src = fc, exposure = 1, shot = null;
  const card = CARDS[sec.name];
  setFrame(ta, { boil: 1 }); IS.sepLine = .5; IS.lineScale = 1;
  if (sec.name === 'TITLE') {
    setMask(null); titleCard(fg, ta);
    exposure = K([[0, .2], [.25, 1], [SEC.TITLE.t1 - .45, 1], [SEC.TITLE.t1, 0]], t);
  } else if (card) {
    setMask(null); intertitle(fg, FW, FH, card, t - sec.t0);
    exposure = K([[sec.t0, .5], [sec.t0 + .15, 1], [sec.t1 - .2, 1], [sec.t1, .6]], t);
    if (sec.name === 'END') exposure = K([[sec.t0, .5], [sec.t0 + .2, 1], [HIT.lampOff - .3, 1], [HIT.lampOff, 0]], t);
  } else {
    fg.fillStyle = '#fff'; fg.fillRect(0, 0, FW, FH);
    fg.save(); shot = SHOTS[sec.name](fg, ta, sec.name); fg.restore();
    src = RD.render(fc, { frame, h1: .55, h2: .72, h3: .86 });
  }
  const ir = shot && irisAt(ta, sec, shot);
  if (ir) {
    if (src !== fc) { fg.setTransform(1, 0, 0, 1, 0, 0); fg.drawImage(src, 0, 0); src = fc; }
    iris(fg, FW, FH, ir.x, ir.y, ir.r, 4); iris(mg, FW, FH, ir.x, ir.y, ir.r, 4);
  }
  const fp = { frame, strength: look.str, sepia: look.sepia, crank: look.crank, exposure, burn: 1 + burnAt(t) * 2 };
  if (card || sec.name === 'TITLE') fp.halation = 1.4;
  const dev = FP.render(src, fp, shot ? mc : null);
  const curtain = 1 - ss(seg(t, HIT.curtainOut, HIT.curtainOut + 1.6));
  theatre(g, W, H, GATE, Math.max(.3, FP.mean * exposure), curtain);
  g.save(); g.beginPath(); g.roundRect(GATE.x, GATE.y, GATE.w, GATE.h, 22); g.clip();
  g.drawImage(dev, GATE.x, GATE.y);
  damage(g, GATE.x, GATE.y, FW, FH, frame, look.str);
  drawBurn(g, burnAt(t), frame);
  g.restore();
  if (curtain < 1) curtainsOver(g, curtain, Math.max(.55, FP.mean * exposure));
}

function curtainsOver(g, open, spill) {
  const cover = (1 - open) * (W / 2 + 10);
  if (cover < 1) return;
  const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  theatre(x, W, H, { x: W / 2, y: 0, w: 0, h: H }, spill, 1);
  g.save();
  g.drawImage(c, 0, 0, W / 2, H, cover - W / 2, 0, W / 2, H);
  g.drawImage(c, W / 2, 0, W / 2, H, W - cover, 0, W / 2, H);
  g.save(); g.beginPath(); g.rect(0, 0, cover, H); g.rect(W - cover, 0, cover, H); g.clip();
  g.globalCompositeOperation = 'screen';
  const fl = g.createRadialGradient(W / 2, H + 120, 60, W / 2, H + 120, 1250);
  fl.addColorStop(0, 'rgba(255,170,110,.42)'); fl.addColorStop(.55, 'rgba(170,70,50,.16)'); fl.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = fl; g.fillRect(0, 0, W, H); g.restore();
  for (const [x0, dir] of [[cover, -1], [W - cover, 1]]) { const gr = g.createLinearGradient(x0, 0, x0 + dir * 60, 0); gr.addColorStop(0, 'rgba(0,0,0,.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(Math.min(x0, x0 + dir * 60), 0, 60, H); }
  g.restore();
}

// ---- every text on screen at t, with its box (for readcheck) — full texts from their first visible frame
const mctx = document.createElement('canvas').getContext('2d');
function box(id, text, font, cx, cy, size) { mctx.font = font; const w = mctx.measureText(text).width; return { id, text, x0: GATE.x + cx - w / 2, y0: cy - size * .6, x1: GATE.x + cx + w / 2, y1: cy + size * .6 }; }
function cardBoxes(id, spec) {
  const gap = spec.gap ?? 1.28, total = spec.lines.reduce((s, l) => s + l.size * gap, 0); let y = FH / 2 - total / 2 + (spec.dy ?? 0); const out = [];
  spec.lines.forEach((l, i) => { out.push(box(id + i, l.text, `${l.weight ?? 400} ${l.size}px "${l.font}"`, FW / 2, y + l.size * gap / 2, l.size)); y += l.size * gap; });
  return out;
}
export function texts(t) {
  const sec = secAt(t);
  if (sec.name === 'TITLE') {
    if (t < HIT.snap) return TITLE_EN.map((l, i) => box('titleEn' + i, l.text, `${l.weight ?? 400} ${l.size}px "${l.font}"`, FW / 2, 940 - 470 + i * TITLE_EN[0].size * 1.7, l.size));
    if (t > HIT.snap + .24 && t < sec.t1 - .45) return cardBoxes('titleZh', { lines: TITLE_ZH, gap: 1.5, dy: -10 });
    return [];
  }
  if (CARDS[sec.name] && t > sec.t0 + .15 && t < sec.t1 - .2) return cardBoxes(sec.name, CARDS[sec.name]);
  if (sec.name === 'PAGE') {
    const out = [box('pageEn', PAGE_EN, '700 92px "Old Standard TT"', 720, 470, 92), box('pageBad', PAGE_BAD, '700 96px "Noto Serif SC"', 720, 650, 96)];
    if (t > HIT.fix + .9) out.push(box('pageFix', PAGE_FIX, '700 100px "Noto Serif SC"', 720, 830, 100));
    return out;
  }
  return [];
}
// subtitle cues = when each card text is fully on screen
export function subtitleCues() {
  const S = Object.fromEntries(SUBS);
  return [
    { t0: HIT.snap + .24, t1: SEC.TITLE.t1 - .45, text: S.titleZh },
    { t0: SEC.GOAL.t0 + .15, t1: SEC.GOAL.t1 - .2, text: S.GOAL },
    { t0: SEC.PAGE.t0 + .3, t1: HIT.strike, text: `${S.pageEn}\n${S.pageBad}` },
    { t0: HIT.fix + .4, t1: SEC.PAGE.t1, text: `${S.pageBad} → ${S.pageFix}` },
    { t0: SEC.SHOUT.t0 + .15, t1: SEC.SHOUT.t1 - .2, text: S.SHOUT },
    { t0: SEC.LAST.t0 + .15, t1: SEC.LAST.t1 - .2, text: S.LAST },
    { t0: SEC.END.t0 + .2, t1: HIT.lampOff - .3, text: S.END },
  ];
}
export function events() {
  const ev = [];
  for (const k in SEC) ev.push({ t: SEC[k].t0, type: 'section', name: k });
  for (const k in HIT) ev.push({ t: HIT[k], type: 'hit', name: k });
  ev.push(...SH.shotEvents());
  return ev.sort((a, b) => a.t - b.t);
}
