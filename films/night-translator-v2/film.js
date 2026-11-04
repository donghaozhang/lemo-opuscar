// 《深夜翻译官》 v2 — film assembly.
// Frame: the shot paints a tonal 4:3 frame (+ the red colour mask) → Redraw (ink, wash steps, boiling hatch) → iris →
// FilmPost (silver/sepia print, period tint per sequence, grain, flicker, weave, scratches, burn; keeps the red) →
// dust/hair → the story burn → the 4:3 gate between the curtains. Cards skip Redraw. Motion is hand-crank sampled.
import { Redraw } from './engine/redraw.js';
import { FilmPost, damage } from './engine/film.js';
import { intertitle, iris, theatre, CARD_BG, CARD_FG } from './engine/cards.js';
import { setFrame, S as IS, grey } from './engine/ink.js';
import { SEC, DUR as D, HIT, secAt, shotAt, SHOTS, TINT } from './timeline.js';
import { CARDS, TITLE_EN, TITLE_ZH, REELS } from './cardspecs.js';
import { setMask, maskAlpha } from './mask.js';
import { xiaoYi } from './robots.js';
import { K, clamp, lerp, ss, seg } from './lib.js';
import * as SH from './shots2.js';
import * as C2 from './cards2.js';

export const DUR = D;
const W = 1920, H = 1080, FW = 1440, FH = 1080, GATE = { x: 240, y: 0, w: FW, h: FH };
const mk = () => { const c = document.createElement('canvas'); c.width = FW; c.height = FH; return c; };
const fc = mk(), fg = fc.getContext('2d'), mc = mk(), mg = mc.getContext('2d');
const scratch = mk(), sg = scratch.getContext('2d');
let RD = null, FP = null;

// per-section print: str = damage, sepia, fps = motion sampling, crank = projector speed feel
const LOOK = {
  COLD: { str: .55, sepia: .08, fps: 16 }, TITLE: { str: .5, sepia: .16, fps: 16 }, ESTAB: { str: .5, sepia: .08, fps: 16 }, SAY: { str: .5, sepia: .12, fps: 16 },
  GULP: { str: .5, sepia: .08, fps: 16 }, WEST: { str: .5, sepia: .1, fps: 16 }, ROMA: { str: .5, sepia: .1, fps: 16 }, MONS: { str: .55, sepia: .08, fps: 16 },
  MONT: { str: .65, sepia: .1, fps: 20, crank: 1.3 }, JAM: { str: .7, sepia: .06, fps: 18, crank: 1.15 }, SHOUT: { str: .85, sepia: .05, fps: 20, crank: 1.4 },
  FIRE: { str: .9, sepia: .05, fps: 20, crank: 1.4 }, TENDER: { str: .32, sepia: .25, fps: 16 }, SAY2: { str: .3, sepia: .28, fps: 16 },
  DAWN: { str: .28, sepia: .3, fps: 16 }, LAST: { str: .3, sepia: .33, fps: 16 }, END: { str: .4, sepia: .3, fps: 16 },
};
function lookAt(t, sec) {
  const L = { crank: 1, ...LOOK[sec.name] };
  if (sec.name === 'FIRE' && t > HIT.heal - .2) { const h = ss(seg(t, HIT.heal - .2, HIT.heal + 1.5)); L.str = lerp(.9, .4, h); L.sepia = lerp(.05, .2, h); L.crank = lerp(1.4, 1, h); L.fps = 16; }
  return L;
}
// the story burn: the reel smoulders from the spark, burns in through the race, heals after the catch
export const burnAt = t => K([[HIT.spark, 0], [HIT.silence1, .12], [SEC.SHOUT.t1, .28], [SEC.FIRE.t0 + 3, .34], [HIT.ljGrab, .4], [HIT.trip, .62], [HIT.catch, .72], [HIT.heal, .55], [HIT.heal + 1.1, 0, 'eo']], t);
let BF = null; const BW = 240, BH = 180, bc = document.createElement('canvas'); bc.width = BW; bc.height = BH; const bgc = bc.getContext('2d'); const bimg = bgc.createImageData(BW, BH);
function burnField() {
  if (BF) return BF;
  const h = (x, y) => { const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); };
  const vn = (x, y) => { const i = Math.floor(x), j = Math.floor(y), u = x - i, v = y - j, a = u * u * (3 - 2 * u), b = v * v * (3 - 2 * v); return (h(i, j) * (1 - a) + h(i + 1, j) * a) * (1 - b) + (h(i, j + 1) * (1 - a) + h(i + 1, j + 1) * a) * b; };
  BF = new Float32Array(BW * BH);
  for (let y = 0; y < BH; y++) for (let x = 0; x < BW; x++) {
    let n = 0, a = .5, f = 1 / 14; for (let o = 0; o < 4; o++) { n += a * vn(x * f + o * 7, y * f + o * 3); a *= .5; f *= 2.1; }
    BF[y * BW + x] = Math.min(Math.min(x, BW - 1 - x) / BH, Math.min(y, BH - 1 - y) / BH) * 1.25 + (n - .5) * .32;
  }
  return BF;
}
function drawBurn(g, amt, frame) {
  if (amt <= .004) return;
  const F = burnField(), d = bimg.data, thr = amt * .17, flick = .85 + .15 * Math.sin(frame * 1.7);
  for (let i = 0; i < BW * BH; i++) {
    const v = F[i] - thr + Math.sin(frame * .9 + i * .013) * .004;
    let r = 0, gg = 0, b = 0, a = 0;
    if (v < 0) { const k = clamp(-v / .05); r = 22 * (1 - k) + 10; gg = 14 * (1 - k) + 7; b = 8; a = 255; }
    else if (v < .035) { const k = 1 - v / .035; r = 255; gg = 236 * k + 200 * (1 - k); b = 190 * k + 120 * (1 - k); a = 255 * k * flick; }
    else if (v < .09) { const k = 1 - (v - .035) / .055; r = 70; gg = 40; b = 20; a = 150 * k * k; }
    d[i * 4] = r; d[i * 4 + 1] = gg; d[i * 4 + 2] = b; d[i * 4 + 3] = a;
  }
  bgc.putImageData(bimg, 0, 0);
  g.save(); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(bc, GATE.x, GATE.y, FW, FH); g.restore();
}

// ---- the title card (v1's blind gag)
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
    for (const l of TITLE_EN) { g.font = `${l.italic ? 'italic ' : ''}${l.weight ?? 400} ${l.size}px "${l.font}"`; g.fillStyle = CARD_FG; g.textAlign = 'center'; g.textBaseline = 'middle'; g.letterSpacing = (l.spacing ?? 0) + 'px'; g.fillText(l.text, FW / 2, y); g.letterSpacing = '0px'; y += l.size * 1.7; }
    g.fillRect(FW / 2 - 160, bottom - 300, 320, 2);
    g.restore();
    g.fillStyle = grey(.42); g.fillRect(inner.x0, bottom - 10, inner.x1 - inner.x0, 12);
    g.strokeStyle = grey(.75); g.lineWidth = 3; g.beginPath(); g.moveTo(FW / 2, bottom + 2); g.lineTo(FW / 2, bottom + 18); g.stroke();
    g.beginPath(); g.arc(FW / 2, bottom + 30, 12, 0, 7); g.stroke();
  }
  g.fillStyle = grey(.34); g.fillRect(inner.x0 - 6, inner.y0 - rollR, inner.x1 - inner.x0 + 12, rollR * 2);
  g.fillStyle = grey(.6); g.fillRect(inner.x0 - 6, inner.y0 - rollR + 3, inner.x1 - inner.x0 + 12, 3);
  const gy = K([[0, 1420], [HIT.peek - .35, 1420], [HIT.peek, 1225, 'eo'], [HIT.lookUs - .15, 1225], [HIT.lookUs + .1, 1140, 'back'], [HIT.drop - .1, 1140], [HIT.drop + .35, 1440, 'ei']], t);
  const ringY = bottom + 30;
  const st = { x: 830, y: gy, s: 2, roll: 0, t,
    ex: K([[HIT.peek, -.6], [HIT.lookUs - .1, -.6], [HIT.lookUs, 0, 'snap'], [HIT.grab - .25, 0], [HIT.grab - .1, -.6], [HIT.snap + .1, -.6], [HIT.snap + .35, 0], [HIT.drop, 0]], t),
    ey: K([[HIT.peek, -.9], [HIT.lookUs - .1, -.9], [HIT.lookUs, 0, 'snap'], [HIT.grab - .25, 0], [HIT.grab - .1, -.7], [HIT.snap + .05, -1], [HIT.snap + .35, 0]], t),
    blink: K([[HIT.lookUs + .45, 0], [HIT.lookUs + .52, 1], [HIT.lookUs + .6, 0]], t), wide: K([[HIT.snap, 1], [HIT.snap + .05, 1.35, 'eo'], [HIT.nod, 1]], t),
    brow: K([[HIT.snap, 0], [HIT.snap + .05, .9], [HIT.nod, .9], [HIT.nod + .3, 0]], t), tilt: K([[HIT.nod - .1, 0], [HIT.nod + .08, .18], [HIT.nod + .3, 0, 'spring']], t),
    squash: K([[HIT.snap, 1], [HIT.snap + .05, .86, 'eo'], [HIT.snap + .3, 1.04], [HIT.snap + .5, 1, 'spring']], t),
    ant: Math.sin((t - HIT.snap) * 24) * K([[HIT.snap, 0], [HIT.snap + .05, 1.2], [HIT.snap + 1.2, 0]], t), shadow: 0,
    bulb: K([[HIT.nod, 0], [HIT.nod + .15, 1], [HIT.drop, 1], [HIT.drop + .2, 0]], t) };
  const ringL = [(FW / 2 - st.x) / 2, (ringY - st.y) / 2];
  const armUp = K([[HIT.grab - .35, 0], [HIT.grab - .05, 1, 'eio'], [HIT.snap + .02, 1], [HIT.snap + .25, 0, 'eo']], t);
  st.armL = { t: [lerp(-56, ringL[0], armUp), lerp(-30, ringL[1], armUp)], open: K([[HIT.grab - .1, .8], [HIT.grab, .1]], t) };
  st.armR = { t: [60, -30] };
  IS.mode = 'ink'; IS.sepLine = 1; IS.lineScale = 1;
  xiaoYi(g, st);
  IS.mode = 'tonal'; IS.sepLine = .5;
}

// ---- cards: draw into g, return the text boxes (film coords)
function drawCard(g, sh, t) {
  const n = sh.name, sec = sh.sec, lt = t - sh.t0;
  if (n === 'reelCard') { const R = REELS[sh.opt.reel]; return ({ WEST: C2.westCard, ROMA: C2.romaCard, MONS: C2.monsCard })[sh.opt.reel](g, R.card, lt, sh.opt.reel + 'card'); }
  const spec = CARDS[sec];
  if (spec.kind === 'say') return C2.sayCard(g, spec, lt, sec);
  if (spec.kind === 'end') return C2.endCard(g, lt, 'END');
  return C2.engineCard(g, spec, lt, sec);
}
const IRIS_IN = { coldRoll: .8, estWide: .45, dryWide: .5 }, IRIS_OUT = { catchWide: .5 };
const isCard = sh => sh.name === 'card' || sh.name === 'reelCard';

export function renderFilm(g, t) {
  RD = RD || new Redraw(FW, FH); FP = FP || new FilmPost(FW, FH);
  const sec = secAt(t), sh = shotAt(t), look = lookAt(t, sec), frame = Math.floor(t * 24 + 1e-6);
  const ta = Math.max(sh.t0, Math.floor(t * look.fps + 1e-6) / look.fps);          // hand-cranked sampling, never before the cut
  for (const c of [fg, mg]) { c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.filter = 'none'; }
  mg.clearRect(0, 0, FW, FH); setMask(mg); maskAlpha(1);
  let src = fc, exposure = 1, res = null, tint = 'none', tintAmt = 0;
  setFrame(ta, { boil: 1 }); IS.sepLine = .5; IS.lineScale = 1;
  if (sh.name === 'title') {
    setMask(null); titleCard(fg, ta);
    exposure = K([[sh.t0, .6], [sh.t0 + .2, 1], [sh.t1 - .35, 1], [sh.t1, .45]], t);
  } else if (isCard(sh)) {
    setMask(null); drawCard(fg, sh, t);
    exposure = K([[sh.t0, .5], [sh.t0 + .15, 1], [sh.t1 - .2, 1], [sh.t1, .6]], t);
    if (sec.name === 'END') exposure = K([[sh.t0, .5], [sh.t0 + .2, 1], [HIT.lampOff - .3, 1], [HIT.lampOff, 0]], t);
    if (sh.name === 'reelCard') { tint = SH.reelTint(sh.opt.reel); tintAmt = .85; }
  } else {
    fg.fillStyle = '#fff'; fg.fillRect(0, 0, FW, FH);
    fg.save(); res = SH[sh.name](fg, ta, sh); fg.restore();
    tint = res.tint; tintAmt = res.tintAmt;
    src = RD.render(fc, { frame, h1: .55, h2: .72, h3: .86 });
    // irises: in/out per shot, plus any the shot asks for
    let r = res.iris ?? null;
    if (IRIS_IN[sh.name] && t < sh.t0 + IRIS_IN[sh.name]) { const k = ss(seg(t, sh.t0, sh.t0 + IRIS_IN[sh.name])); r = Math.min(r ?? 1e9, .5 + k * k * 1900); }
    if (IRIS_OUT[sh.name] && t > sh.t1 - IRIS_OUT[sh.name]) { const k = ss(seg(t, sh.t1 - IRIS_OUT[sh.name], sh.t1)); r = Math.min(r ?? 1e9, lerp(1900, .5, Math.sqrt(k))); }
    if (r != null && r < 1900) {
      fg.setTransform(1, 0, 0, 1, 0, 0); fg.drawImage(src, 0, 0); src = fc;
      iris(fg, FW, FH, res.focus[0], res.focus[1], r, 4); iris(mg, FW, FH, res.focus[0], res.focus[1], r, 4);
    }
  }
  const fp = { frame, strength: look.str, sepia: look.sepia, crank: look.crank, exposure, burn: 1 + burnAt(t) * 2, tint: TINT[tint] || TINT.none, tintAmt };
  if (isCard(sh) || sh.name === 'title') fp.halation = 1.4;
  const dev = FP.render(src, fp, res ? mc : null);
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

// ---- every text on screen at t, with its box in screen pixels (for readcheck)
const mctx = document.createElement('canvas').getContext('2d');
const toScreen = b => ({ ...b, x0: b.x0 + GATE.x, x1: b.x1 + GATE.x });
function lbox(id, text, font, x, cy, size) { mctx.font = font; const w = mctx.measureText(text).width; return { id, text, x0: x, y0: cy - size * .6, x1: x + w, y1: cy + size * .6 }; }
export function texts(t) {
  const sec = secAt(t), sh = shotAt(t);
  if (sh.name === 'title') {
    if (t < HIT.snap) return TITLE_EN.map((l, i) => toScreen({ ...C2engineBox(l, 940 - 470 + i * TITLE_EN[0].size * 1.7), id: 'titleEn' + i }));
    if (t > HIT.snap + .24 && t < sh.t1 - .45) { sg.setTransform(1, 0, 0, 1, 0, 0); return C2.engineCard(sg, { level: 1, seed: 2, lines: TITLE_ZH, gap: 1.5, dy: -10 }, 0, 'titleZh').map(toScreen); }
    return [];
  }
  if (isCard(sh)) {
    if (t < sh.t0 + .15 || t > sh.t1 - .2) return [];
    if (sec.name === 'END' && t > HIT.curtainOut + .8) return [];
    sg.setTransform(1, 0, 0, 1, 0, 0); return drawCard(sg, sh, t).map(toScreen);
  }
  if (['page', 'pageFix', 'pageHand'].includes(sh.name)) {
    const R = REELS[sh.opt.reel], out = [];
    // page layout (sets2.pageInsert): centre (720, 540), English baseline −130, literal baseline +100, brush correction baseline +320
    if (sh.name !== 'pageFix') { out.push(lbox(sh.opt.reel + 'en', R.en, '700 70px "Old Standard TT"', 310, 540 - 152, 70)); out.push(lbox(sh.opt.reel + 'bad', R.bad, '700 92px "Noto Serif SC"', 310, 540 + 70, 92)); }
    const fixT = { WEST: HIT.wFix, ROMA: HIT.rFix, MONS: HIT.mFix }[sh.opt.reel];
    if (sh.name !== 'page' && t >= fixT) out.push(lbox(sh.opt.reel + 'fix', R.fix, '400 150px "Ma Shan Zheng"', 340, 540 + 270, 150));
    return out.map(toScreen);
  }
  return [];
}
function C2engineBox(l, cy) { mctx.font = `${l.italic ? 'italic ' : ''}${l.weight ?? 400} ${l.size}px "${l.font}"`; const w = mctx.measureText(l.text).width; return { text: l.text, x0: FW / 2 - w / 2, y0: cy - l.size * .6, x1: FW / 2 + w / 2, y1: cy + l.size * .6 }; }
export { subtitleCues } from './subs.js';
export function events() {
  const ev = [];
  for (const k in SEC) ev.push({ t: SEC[k].t0, type: 'section', name: k });
  for (const k in HIT) ev.push({ t: HIT[k], type: 'hit', name: k });
  for (const s of SHOTS) ev.push({ t: s.t0, type: 'cut', name: s.name, sec: s.sec });
  return ev.sort((a, b) => a.t - b.t);
}
