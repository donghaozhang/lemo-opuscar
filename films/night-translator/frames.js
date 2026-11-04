// Look development: the model sheet (both robots, expressions, key poses) through the full pipeline.
// ?scene=frames.modelSheet
import { Redraw } from './engine/redraw.js';
import { FilmPost } from './engine/film.js';
import { theatre } from './engine/cards.js';
import { setFrame, S as IS, grey } from './engine/ink.js';
import { xiaoYi, laoJiao } from './robots.js';
import { setMask } from './mask.js';
const FW = 1440, FH = 1080;
export function modelSheet(g, t) {
  const c = document.createElement('canvas'); c.width = FW; c.height = FH; const f = c.getContext('2d');
  const m = document.createElement('canvas'); m.width = FW; m.height = FH; const mg = m.getContext('2d'); setMask(mg);
  setFrame(0); IS.sepLine = .5;
  f.fillStyle = grey(.86); f.fillRect(0, 0, FW, FH);
  const lab = (x, y, s) => { f.save(); f.setTransform(1, 0, 0, 1, 0, 0); f.fillStyle = grey(.15); f.font = '700 26px "Noto Serif SC"'; f.textAlign = 'center'; f.fillText(s, x, y); f.restore(); };
  // Xiao Yi: four expressions
  const ex = [['平静', {}], ['担心', { brow: 1, ex: .6, ey: .6 }], ['被砸', { brow: -1, squash: .8, ant: 1.2 }], ['开心', { bulb: 1, blink: .45, ant: .4 }]];
  ex.forEach(([n, o], i) => { xiaoYi(f, { x: 170 + i * 210, y: 470, s: 1.5, armL: { t: [-60, -40] }, armR: { t: [60, -40] }, ...o }); lab(170 + i * 210, 520, n); });
  // key poses: reaching, carrying overhead, tripped
  xiaoYi(f, { x: 170, y: 990, s: 1.5, armL: { t: [-80, -150] }, armR: { t: [70, -30] }, ex: -1, ey: -.8 }); lab(170, 1040, '伸手');
  xiaoYi(f, { x: 400, y: 990, s: 1.5, tilt: .22, armL: { t: [-26, -197] }, armR: { t: [26, -197] }, brow: 1, ex: .8, ey: -.6 }); lab(400, 1040, '冲刺');
  xiaoYi(f, { x: 600, y: 990, s: 1.5, tilt: 1.42, blink: 1, brow: -1 }); lab(640, 1040, '摔倒');
  // Lao Jiao: reading (lens out) and stamping
  laoJiao(f, { x: 1000, y: 990, s: 1.5, dir: -1, lean: -.16, lensOut: .9, pen: [-70, -150], stamp: [-30, -130] }); lab(980, 1040, '老校 · 审读');
  laoJiao(f, { x: 1290, y: 990, s: 1.5, dir: -1, lean: .1, head: .2, glint: 1, pen: [-80, -260], stamp: [40, -150] }); lab(1290, 1040, '举笔');
  lab(530, 60, '小译 Xiao Yi'); lab(1140, 60, '老校 Lao Jiao');
  const rd = new Redraw(FW, FH).render(c, { frame: 0, h1: .55, h2: .72, h3: .86 });
  const dev = new FilmPost(FW, FH).render(rd, { frame: 3, strength: .35, sepia: .2 }, m);
  theatre(g, 1920, 1080, { x: 240, y: 0, w: FW, h: FH }, .5, 1);
  g.drawImage(dev, 240, 0);
  setMask(null);
}
