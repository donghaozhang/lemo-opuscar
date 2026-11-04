// 愚公移山 · test sheets: ?test=cast | expr | perf
import * as WC from './engine/index.js';
import * as ST from './stage.js';
import { drawFig, EXPR } from './chars.js';
import { T, S, mul } from './rig.js';
const { m, c } = ST;
export function test(g, name, t, qs) {
  if (name === 'cast') {
    ST.begin({});
    // a pale sky band behind the upper half so silhouettes read both on white and on black
    m.fillStyle = '#fff'; m.fillRect(0, 0, ST.PW, 300);
    const row = [['yugong', { expr: 'neutral' }], ['yugong', { expr: 'resolve', lean: .32, a1: -1.0, e1: -.6 }], ['son', { a1: -2.6, e1: -.3, expr: 'resolve', lean: -.1 }], ['grandson', { a1: .5, e1: -1.2, expr: 'smile' }], ['boy', { expr: 'grin', a1: -2.4, e1: .2 }], ['zhisou', { expr: 'sneer', a1: -1.1, e1: -1.3 }]];
    row.forEach(([who, p], i) => drawFig(m, mul(T(150 + i * 300, 860), S(1)), who, { lean: who === 'yugong' ? .3 : 0, ...p }));
    ST.end(); ST.print(g);
  }
  if (name === 'expr') return exprSheet(g, qs.get('who'), qs.get('big'));
  if (name === 'world') {
    const p = qs.get('p'), lt = +(qs.get('lt') ?? 9);
    ST.begin({ x: +(qs.get('cx') ?? ST.PW / 2), y: +(qs.get('cy') ?? ST.PH / 2), z: +(qs.get('z') ?? 1) });
    if (p === 'mountains') { WD.drawMountains(m, lt, 0, 3); WD.notch(m, 1); }
    if (p === 'cottage') WD.drawCottage(m, lt, 0, 3, { door: .7 });
    ST.end(); ST.print(g); return;
  }
  if (name === 'perf') {
    const t0 = performance.now();
    for (let i = 0; i < 5; i++) { ST.begin({}); drawFig(m, T(900, 860), 'yugong', { expr: 'laugh' }); ST.end(); ST.print(g, { inkSeed: i }); }
    const gl = ST.printer().canvas.getContext('webgl2'); gl.finish();
    console.warn('perf ms/frame', (performance.now() - t0) / 5);
  }
}
import { drawFace, FX } from './faces.js';
import * as WD from './world.js';
export function exprSheet(g, who, big) {
  ST.begin({});
  const E = Object.entries(FX[who]);
  if (big) { drawFace(m, mul(T(ST.PW / 2, 470), S(.95)), who, FX[who][big]); }
  else E.forEach(([k, e], i) => drawFace(m, mul(T(130 + i * 260 + (7 - E.length) * 130, 400), S(.3)), who, e));
  ST.end(); ST.print(g);
}
