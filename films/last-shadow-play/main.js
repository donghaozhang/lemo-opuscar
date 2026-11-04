// 《最后一场皮影戏》 — page entry: window.render(t), DUR, EV, TEXTS, READY
import { makeGL } from './gl.js';
import { canvas } from './carve.js';
import { buildMonkey, buildDemon, buildShowScenery } from './show.js';
import { buildMaster, buildBoy } from './people.js';
import { buildSets } from './sets.js';

const qs = new URLSearchParams(location.search);
const W = 1920, H = 1080;
const [trc, tr] = canvas(W, H), [frc, fr] = canvas(W, H), [glc, gl2] = canvas(W, H);
const GL = makeGL(document.getElementById('gl'));
await document.fonts.load('400 40px "Ma Shan Zheng"', '最后一场皮影戏三打白骨精完皮影说');
await document.fonts.load('600 40px "Noto Serif SC"', '村口入夜最后一场放下手机来搭把手爷灯交给你了');
await document.fonts.load('700 40px "Noto Serif SC"', '最后');
await document.fonts.load('600 40px "Cormorant Garamond"', 'ab');
const TEST = qs.get('test');
buildMonkey(); buildDemon(); buildShowScenery(); buildMaster(); buildBoy(); buildSets();
const film = TEST ? null : await import('./film.js');
const testMod = TEST ? await import('./test.js') : null;

function clear() { for (const g of [fr, gl2]) { g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H); g.globalAlpha = 1; g.filter = 'none'; g.globalCompositeOperation = 'source-over'; } tr.setTransform(1, 0, 0, 1, 0, 0); tr.globalAlpha = 1; tr.filter = 'none'; tr.globalCompositeOperation = 'source-over'; }
function render(t) {
  clear();
  if (testMod) {
    let o;
    if (TEST === 'model') o = testMod.modelSheet(tr, fr, qs.get('v'));
    else if (TEST === 'expr') o = testMod.exprSheet(tr, fr);
    else o = { lamps: [] };
    GL.render(trc, frc, glc, { time: t, ...o }); return;
  }
  const o = film.frame(t, tr, fr, gl2);
  GL.render(trc, frc, glc, { time: t, ...o });
}
window.render = render;
window.DUR = film ? film.DUR : 10;
window.EV = film ? film.events() : [];
window.TEXTS = film ? film.texts : () => [];
render(parseFloat(qs.get('t') ?? '12'));
window.READY = true;
