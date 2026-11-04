import { makeComp, layerSet } from './comp.js';
import { DUR, SUBS } from './timeline.js';
import { clamp } from '/core/lib.js';
const q = new URLSearchParams(location.search);
const comp = makeComp(document.getElementById('c'));
const A = layerSet(), B = layerSet(), TMP = layerSet(), TMP2 = layerSet();
const mode = q.get('test');
// fonts: load the characters the film uses (the fontsource CSS is split by unicode range; loading by text pulls the right slices)
const CHARS = '墨龙借雨家山久旱盼云不肯醒来便自己做了还在砚里香尽之前须得，。';
await document.fonts.load('40px "Ma Shan Zheng"', CHARS);
await document.fonts.load('40px "Noto Serif SC"', CHARS);
window.NOSUB = q.has('nosub') || q.has('poster'); window.POSTER = q.has('poster');

let render;
if (mode) {
  const mod = await import('./test.js');
  window.DUR = 1;
  render = t => mod.render(t, A, B, TMP, TMP2, comp, mode, q);
} else {
  const S = await import('./shots.js');
  await S.init(TMP, TMP2);
  window.DUR = DUR;
  window.EV = S.events();
  window.TEXTS = t => S.texts(t);
  render = t => { A.clear(); B.clear(); const o = S.frame(t, A, B, TMP, TMP2) || {}; comp(A, B, o); };
}
window.render = render;
window.READY = true;
