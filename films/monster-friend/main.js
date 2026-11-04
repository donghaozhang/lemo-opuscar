// Entry: ?test=model|faces|page&n=1 opens a test page; otherwise renders the film
import { makeComp } from './gl.js';
import { BOIL } from './crayon.js';
const Q = new URLSearchParams(location.search);
const comp = makeComp(document.getElementById('gl'));
window.DUR = 1;
const CH = '我的怪兽朋友豆搬到了新城市幼儿园里一个字也说不出来晚上画只紫色大它就变小害怕勇敢第二天躲进书包能看见吃掉蜡笔打彩喷嚏妮气球挂在树吸口你好用黄两起玩笑回，。；';
await Promise.all([document.fonts.load('400 40px "ZCOOL KuaiLe"', CH), document.fonts.load('400 40px "Ma Shan Zheng"', CH)]);
const test = Q.get('test');
if (test) {
  const T = await import('./test.js');
  window.render = t => { BOIL.step = Math.floor(t * 12); T.test(comp, t, test, Q); };
} else {
  const M = await import('./film.js');
  window.DUR = M.DUR; window.EV = M.EV; window.TEXTS = M.texts;
  window.render = t => { BOIL.step = Math.floor(t * 12 + 1e-6); M.frame(comp, t); };
}
window.READY = true;
