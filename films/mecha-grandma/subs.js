// Subtitle cues (DOM-free): every Chinese text the audience reads on screen, while it is on screen.
import { SEC, HIT, SHOTS, TXT, at } from './timeline.js';
const sh = (n, w) => SHOTS.find(s => s.name === n && (w == null || s.opt.which === w));
export function subtitleCues() {
  const c = [], add = (t0, t1, text) => c.push({ t0, t1, text });
  add(HIT.title + .3, SEC.OPEN.t1, '《机甲外婆》');
  add(sh('apartment').t0, sh('apartment').t1, '电视：台风预警');
  add(sh('photo').t0 + .1, sh('photo').t1, '照片：1979 · 大黄');
  const ch = sh('chat', 1);
  add(ch.t0 + .2, ch.t0 + 1.0, '外婆：吃了吗？'); add(ch.t0 + 1.0, ch.t0 + 1.6, '阿杰：还在公司'); add(ch.t0 + 1.6, ch.t0 + 2.2, '阿杰：三天没下楼了'); add(ch.t0 + 2.2, ch.t1, '阿杰：没空吃');
  add(sh('billboard').t0, sh('billboard').t1, '广告牌：台风预警');
  const h1 = sh('hud', 1), h2 = sh('hud', 2);
  add(h1.t0 + .1, h1.t1, '无人机：未登记机甲　威胁等级：高');
  add(HIT.ident, h2.t1, '无人机：识别：饺子 ×24　威胁等级：外婆');
  add(sh('arrive').t0, sh('arrive').t1, '88F');
  add(sh('oldPhoto').t0 + .1, sh('oldPhoto').t1, '照片：1979 · 大黄');
  const c2 = sh('chat', 2);
  add(c2.t0 + .25, c2.t0 + .9, '阿杰：吃了。'); add(c2.t0 + .9, c2.t1, '外婆：好孩子');
  add(SEC.END.t0 + .3, SEC.END.t1, '《机甲外婆》 完');
  return c;
}
