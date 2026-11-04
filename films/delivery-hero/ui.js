// ui.js — windows, dialog box with portrait + name tag, battle/system message, menus with a hand cursor, HUD (battery = HP, clock), icons
import { C, T, W, H, FB, clamp, eo, mod, bayer } from './px.js';
import { text, textW, wrap, LH } from './font.js';

export const SKIN = { fill: [C.navy, C.night], fillB: [C.night, C.deep] };
// layered rounded window: ink / white / silver, dithered fill
export function win(fb, x, y, w, h, o = {}) {
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  const fill = o.fill || SKIN.fill;
  fb.gradV(x + 3, y + 3, w - 6, h - 6, fill);
  // ink outer (corners cut)
  fb.rect(x + 2, y, w - 4, 1, C.ink); fb.rect(x + 2, y + h - 1, w - 4, 1, C.ink); fb.rect(x, y + 2, 1, h - 4, C.ink); fb.rect(x + w - 1, y + 2, 1, h - 4, C.ink);
  fb.px(x + 1, y + 1, C.ink); fb.px(x + w - 2, y + 1, C.ink); fb.px(x + 1, y + h - 2, C.ink); fb.px(x + w - 2, y + h - 2, C.ink);
  // white
  fb.rect(x + 2, y + 1, w - 4, 1, C.white); fb.rect(x + 1, y + 2, 1, h - 4, C.white);
  fb.rect(x + 2, y + h - 2, w - 4, 1, C.silver); fb.rect(x + w - 2, y + 2, 1, h - 4, C.silver);
  // silver inner + ink inner line
  fb.rect(x + 2, y + 2, w - 4, 1, C.silver); fb.rect(x + 2, y + 2, 1, h - 4, C.silver);
  fb.rect(x + 3, y + h - 3, w - 6, 1, C.steel); fb.rect(x + w - 3, y + 3, 1, h - 6, C.steel);
}
// slide-in helper: 0.3 s ease-out, integer px
export const slide = (t, t0, dist) => Math.round(dist * (1 - eo(clamp((t - t0) / .3, 0, 1))));

// typed text (cps chars/s); returns {done, shown}
export function typed(s, t, cps) { const n = Math.max(0, Math.floor(t * cps)); const chars = [...s]; return { shown: chars.slice(0, n).join(''), done: n >= chars.length }; }

export const DLG = { x: 4, y: 130, w: 312, h: 47 };
// dialog: {name, portrait(fb,x,y), text, t (since box open), cps, song}
export function dialog(fb, o) {
  const { x, y, w, h } = DLG; const t = o.t;
  const open = clamp(t / .12, 0, 1); if (open <= 0) return;
  const hh = Math.max(8, Math.round(h * open)), yy = y + Math.round((h - hh) / 2);
  win(fb, x, yy, w, hh);
  if (open < 1) return;
  let tx = x + 10;
  if (o.portrait) {
    fb.rect(x + 7, y + 6, 36, 36, C.ink); fb.rect(x + 8, y + 7, 34, 34, C.silver); fb.rect(x + 9, y + 8, 32, 32, C.night);
    const pf = new FB(32, 32); pf.clear(C.night); o.portrait(pf); for (let j = 0; j < 32; j++) for (let i = 0; i < 32; i++) { const c = pf.d[j * 32 + i]; if (c !== T) fb.px(x + 9 + i, y + 8 + j, c); }
    tx = x + 50;
  }
  if (o.name) {
    const nw = textW(o.name) + 12; win(fb, x + 4, y - 14, nw, 17, { fill: [C.plum, C.night] });
    text(fb, o.name, x + 10, y - 11, C.yellow, { shadow: C.ink });
  }
  const lines = wrap(o.text, w - (tx - x) - 12);
  const { shown, done } = typed(o.text, t - .15, o.cps || 12);
  let k = [...shown].length;
  lines.forEach((ln, i) => { const part = [...ln].slice(0, Math.max(0, k)).join(''); k -= [...ln].length; if (part) text(fb, part, tx, y + 9 + i * 16, o.col || C.white, { shadow: C.ink }); });
  if (done && Math.floor(t * 3) % 2 === 0 && !o.noArrow) arrow(fb, x + w - 14, y + h - 10);
}
export function arrow(fb, x, y) { for (let j = 0; j < 4; j++) fb.hline(x + j, x + 6 - j, y + j, C.white); fb.hline(x + 1, x + 5, y - 1, C.ink); }
// system / battle message: thin top window
export function msg(fb, s, t, o = {}) {
  const x = o.x ?? 4, w = o.w ?? (o.hud ? 228 : 312), y = o.y ?? 4, h = 19;
  const dy = slide(t, 0, -26); win(fb, x, y + dy, w, h);
  const { shown } = typed(s, t - .05, o.cps || 18);
  const tw = textW(s); text(fb, shown, x + Math.round((w - tw) / 2), y + 3 + dy, o.col || C.white, { shadow: C.ink });
}
// HUD: battery (HP) and clock, top right
export function hud(fb, bat, clock, o = {}) {
  const x = o.x ?? 236, y = o.y ?? 4, w = 80, h = 19;
  win(fb, x, y, w, h);
  // battery icon 11×7
  const bx = x + 6, by = y + 6, low = bat <= 15, col = bat <= 0 ? C.slate : low ? (o.blink ? C.red : C.hot) : C.lime;
  fb.frame(bx, by, 10, 7, C.white); fb.rect(bx + 10, by + 2, 1, 3, C.white);
  const fill = Math.round(8 * clamp(bat / 100, 0, 1)); if (fill > 0) fb.rect(bx + 1, by + 1, Math.max(1, fill), 5, col);
  text(fb, `${Math.max(0, Math.round(bat))}%`, bx + 13, y + 3, col === C.lime ? C.white : col, { shadow: C.ink });
  text(fb, clock, x + w - 6 - textW(clock), y + 3, o.clockCol || C.yellow, { shadow: C.ink });
}
// hand cursor 9×7
const HAND = ['..##.....', '.#ww#####', '#wwwwwww#', '#wwwww##.', '#wwwwww#.', '.#wwww#..', '..####...'];
export function hand(fb, x, y) { HAND.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] !== '.') fb.px(x + i, y + j, r[i] === '#' ? C.ink : C.white); }); }
// menu: items [{label, icon?, dim?, flash?}], cur (float index), bob (bool), t
export function menu(fb, x, y, items, cur, t, o = {}) {
  const lh = o.lh || 16, w = o.w || 86, h = items.length * lh + 10;
  win(fb, x, y, w, h);
  items.forEach((it, i) => {
    if (it.flash && Math.floor(t * 6) % 2 === 0) return;
    let ix = x + 16;
    if (it.icon) { it.icon(fb, ix, y + 6 + i * lh, it.dim); ix += 15; }
    text(fb, it.label, ix, y + 5 + i * lh, it.dim ? C.slate : it.col || C.white, { shadow: C.ink });
  });
  if (cur !== null && cur !== undefined) {
    const bobv = o.bob === false ? 0 : (Math.floor(t * 4) % 2);
    hand(fb, x + 4 - bobv, y + 8 + Math.round(cur * lh) - 1);
  }
  return { x, y, w, h };
}
// —— Icons 12×12 ——
export const ICON = {
  coat(fb, x, y, dim) { const a = dim ? C.slate : C.cyan, b = dim ? C.dslate : C.blue; fb.poly([[x + 4, y], [x + 8, y], [x + 11, y + 11], [x + 1, y + 11]], b); fb.poly([[x + 4, y], [x + 8, y], [x + 9, y + 6], [x + 3, y + 6]], a); fb.rect(x + 5, y, 2, 2, C.ink); },
  bank(fb, x, y, dim) { fb.rect(x + 2, y + 1, 8, 11, C.ink); fb.rect(x + 3, y + 2, 6, 9, dim ? C.dslate : C.slate); fb.rect(x + 5, y, 2, 1, C.steel); const l = dim ? C.steel : C.yellow; fb.line(x + 7, y + 3, x + 5, y + 6, l); fb.line(x + 5, y + 6, x + 7, y + 6, l); fb.line(x + 7, y + 6, x + 5, y + 9, l); },
  umbrella(fb, x, y, dim) { const r = dim ? C.slate : C.uR, rd = dim ? C.dslate : C.uRD; fb.ell(x + 6, y + 5, 6, 4.2, (X, Y) => Y > y + 4 ? rd : r); fb.rect(x, y + 5, 13, 1, T); fb.vline(x + 6, y + 4, y + 10, C.silver); fb.px(x + 5, y + 11, C.silver); fb.px(x + 4, y + 10, C.silver); fb.px(x + 6, y, C.ink); },
  light(fb, x, y, dim) { fb.rect(x + 3, y + 1, 6, 10, C.ink); fb.rect(x + 4, y + 2, 4, 8, dim ? C.dslate : C.glow); fb.rect(x + 5, y + 10, 2, 1, C.slate); },
  pat(fb, x, y) { heart(fb, x + 1, y + 2, C.pink); },
};
export function heart(fb, x, y, c = C.hot) { const R = ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...']; R.forEach((r, j) => { for (let i = 0; i < 7; i++) if (r[i] === '#') fb.px(x + i, y + j, c); }); fb.px(x + 1, y + 1, C.white); }
// damage / pop number that hops up
export function popNum(fb, s, x, y, t, col = C.white) {
  if (t < 0 || t > 1.4) return; const hop = t < .25 ? -Math.round(10 * Math.sin(t / .25 * Math.PI / 2)) : t < .4 ? -10 + Math.round((t - .25) / .15 * 4) : -6;
  if (t > 1.1 && Math.floor(t * 12) % 2) return;
  text(fb, s, x - Math.round(textW(s) / 2), y + hop, col, { outline: C.ink });
}
// quest box: big centred window with title line and body
export function questBox(fb, title, body, t, o = {}) {
  const w = o.w || 220, h = o.h || 46, x = o.x ?? Math.round((W - w) / 2), y = (o.y ?? 26) + slide(t, 0, -60);
  win(fb, x, y, w, h, { fill: [C.plum, C.night] });
  text(fb, title, x + 10, y + 6, C.yellow, { shadow: C.ink });
  const { shown } = typed(body, t - .35, o.cps || 12);
  text(fb, shown, x + 10, y + 24, C.white, { shadow: C.ink });
}
