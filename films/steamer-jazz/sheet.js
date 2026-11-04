// sheet.js — model sheet (?sheet=model), expression sheet (?sheet=expr), backgrounds (?sheet=bg&bg=kitchen)
import * as T from './toon.js';
import { P } from './parts.js';
import * as C from './cast.js';
import { paintLane, paintKitchen } from './bgs.js';
import { drawBG } from './bgkit.js';
const q = new URLSearchParams(location.search), kind = q.get('sheet');
const cv = document.getElementById('c'); T.init(cv);
const label = (s, x, y) => { const g = T.g; g.setTransform(1, 0, 0, 1, 0, 0); g.font = '26px XiaoWei, serif'; g.fillStyle = P.ink; g.textAlign = 'center'; g.fillText(s, x, y); };
await document.fonts.ready; for (const f of ['40px Huang', '40px XiaoWei']) await document.fonts.load(f, '王记包子六点开门面粉蒸笼爵士');
function bgFill() { const g = T.g; g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = P.light; g.fillRect(0, 0, 1920, 1080); g.fillStyle = P.mid; g.fillRect(0, 760, 1920, 320); }
const DRAW = {
  export(t) { if (window.EXPORT) return; const L = paintLane(), K = paintKitchen(); window.EXPORT = { lane: { url: L.cv.toDataURL('image/png'), ox: L.ox, oy: L.oy, w: L.w, h: L.h }, kitchen: { url: K.cv.toDataURL('image/png'), ox: K.ox, oy: K.oy, w: K.w, h: K.h } }; },
  bg(t) { const g = T.g; g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#000'; g.fillRect(0, 0, 1920, 1080); const which = q.get('bg'); const B = which === 'lane' ? (window._L ||= paintLane()) : (window._K ||= paintKitchen()); T.init(cv); const cam = { x: +(q.get('cx') || (which === 'lane' ? 2200 : 1300)), y: +(q.get('cy') || (which === 'lane' ? 0 : 700)), z: +(q.get('z') || (which === 'lane' ? .4 : .7)) }; drawBG(g, B, cam); },
  model(t) {
    bgFill(); T.frame(t);
    C.wang({ x: 190, y: 700, k: 1.1, ex: 'neutral', must: 0 });
    C.wang({ x: 470, y: 700, k: 1.1, ex: 'asleep', must: -1, cap: .6, head: { rot: .25, dy: 20 } });
    C.boy({ x: 730, y: 700, k: 1.3, ex: 'hungry', scarf: t });
    C.rat({ x: 960, y: 700, k: 1.3, ex: 'sly', tail: 'q' });
    C.rat({ x: 1150, y: 700, k: 1.1, ex: 'happy', apron: 1 });
    C.kettle({ x: 1400, y: 700, k: 1.0, ex: 'surprised', steam: 'up', t });
    C.clock({ x: 1700, y: 700, k: 1.2, ex: 'asleep', stopped: 1, time: 4 });
    C.pin({ x: 220, y: 1040, k: .9, ex: 'happy' });
    C.cleaver({ x: 520, y: 1060, k: .75, ex: 'determined' });
    C.stove({ x: 800, y: 1060, k: .9 }); C.flame({ x: 800, y: 1060 - 186 * .9, k: .9, ex: 'sleepy', droop: .7, t });
    C.steamer({ x: 1120, y: 1060, k: .75, ex: 'happy', breath: .8, gap: 10 });
    C.bun(1380, 1000, 1.3, {}); C.bun(1520, 1000, 1.3, { best: true });
    C.flame({ x: 1720, y: 1060, k: .9, ex: 'grin', flare: 1, t });
  },
  expr(t) {
    bgFill(); T.frame(t);
    const who = q.get('who') || 'wang', g = T.g;
    const L = { wang: ['neutral', 'sleepy', 'asleep', 'yawn', 'surprised', 'joy', 'tender', 'angry'], boy: ['hungry', 'tempted', 'torn', 'resolve', 'surprised', 'joy', 'scared', 'sad'], obj: ['sly', 'scared', 'squeeze', 'wink', 'teary', 'surprised', 'determined', 'happy'] }[who];
    L.forEach((e, i) => {
      const cx = 240 + (i % 4) * 480, cy = i < 4 ? 270 : 810;
      g.save(); g.beginPath(); g.rect(cx - 236, cy - 266, 472, 532); g.clip(); g.fillStyle = i % 2 ? P.light : P.pale; g.fillRect(cx - 236, cy - 266, 472, 532);
      if (who === 'wang') C.wang({ x: cx, y: cy + 560, k: 1.9, ex: e, must: e === 'joy' ? 1 : e === 'sleepy' || e === 'asleep' ? -.7 : e === 'angry' ? -.3 : 0, cap: e === 'asleep' ? .5 : 0 });
      if (who === 'boy') C.boy({ x: cx, y: cy + 520, k: 2.4, ex: e, scarf: 0, scarfDroop: e === 'sad' || e === 'torn' ? 1 : 0 });
      if (who === 'obj') [() => C.rat({ x: cx - 40, y: cy + 420, k: 2.6, ex: e, tail: 'q' }), () => C.rat({ x: cx - 40, y: cy + 420, k: 2.6, ex: e, tail: 'whip', t }), () => C.cleaver({ x: cx, y: cy + 380, k: 1.9, ex: e }), () => C.flame({ x: cx, y: cy + 160, k: 2.0, ex: e, t }), () => C.kettle({ x: cx, y: cy + 230, k: 1.9, ex: e }), () => C.steamer({ x: cx, y: cy + 300, k: 1.7, ex: e }), () => C.pin({ x: cx, y: cy + 300, k: 1.9, ex: e, roll: 0 }), () => C.clock({ x: cx, y: cy + 250, k: 2.0, ex: e, time: 6 })][i]();
      g.restore(); T.g.setTransform(1, 0, 0, 1, 0, 0);
      g.fillStyle = P.ink; g.fillRect(cx - 236, cy + 222, 472, 44); g.font = '30px XiaoWei, serif'; g.fillStyle = P.white; g.textAlign = 'center'; g.fillText(e, cx, cy + 254);
    });
  },
};
window.DUR = 1; window.render = t => DRAW[kind](+(q.get('t') || t)); window.READY = true;
