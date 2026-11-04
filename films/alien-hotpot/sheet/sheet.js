// Model sheet (t < 1) and expression sheet (t >= 1), drawn with the film's own code
import { init, frame, push, pop, translate, scale, text, screenRect, g, INK } from '../toon.js';
import { liu, zug, pip, translator, cell, pot, saucer, hexCoin, coin, light, C, chopsticks, tripe } from '../chars.js';
init(document.getElementById('c'));
await document.fonts.load('40px "ZCOOL KuaiLe"'); await document.fonts.load('40px VT323');
const lab = (s, x, y, sz = 34) => text(s, x, y, { font: `${sz}px "ZCOOL KuaiLe"`, fill: INK });
window.DUR = 3;
window.render = t => {
  frame(t); light();
  const mode = Math.floor(t);
  screenRect('#efe4c8');
  if (mode === 0) {
    lab('造型表', 1300, 60, 44);
    // lineup (height compare)
    liu({ x: 230, y: 760, face: 1 }); liu({ x: 470, y: 760, face: -1, back: true });
    zug({ x: 760, y: 790, face: 1 }); zug({ x: 1000, y: 790, face: -1, lid: .2, brow: { tilt: -.3, h: 6 } });
    pip({ x: 1240, y: 760, face: 1, t }); pip({ x: 1420, y: 760, face: -1, t, flush: 1 });
    lab('刘姨 3/4', 230, 800); lab('背面', 470, 800); lab('祖格', 760, 800); lab('祖格 反向', 1000, 800); lab('皮皮', 1240, 800); lab('皮皮 吃辣后', 1420, 800);
    translator(1660, 300, 1, { t, beep: 1 }); lab('翻译器', 1660, 420);
    cell(1660, 620, 1, { glow: 1, level: .7, t }); lab('能源舱', 1660, 760);
    // props row
    pot(330, 960, .6, { t }); saucer(820, 960, .5, { glow: .8, t }); hexCoin(1160, 960, .7); coin(1300, 960, .8); coin(1400, 960, .8, { edge: .5 });
    push(); translate(1500, 980); chopsticks(0, 0, -.3, { food: () => tripe(.8) }); pop();
  } else {
    lab('表情表（特写尺寸）', 960, 44, 40);
    // heads at close-up size, each in its own box (screen-space clip)
    const box = (i, j, name, draw) => {
      const x = 20 + i * 270, y = 80 + j * 330, w = 260, h = 300;
      g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.beginPath(); g.rect(x, y, w, h); g.clip();
      g.fillStyle = '#e6d8b4'; g.fillRect(x, y, w, h); draw(x + w / 2, y + h / 2); g.restore();
      g.setTransform(1, 0, 0, 1, 0, 0); g.lineWidth = 4; g.strokeStyle = INK; g.strokeRect(x, y, w, h);
      lab(name, x + w / 2, y + 22, 26);
    };
    const L = [['平静', {}], ['眨眼', { blink: true }], ['挑眉', { lid: .3, browR: { tilt: -.25, h: 16 }, browL: { tilt: .05, h: 2 } }], ['不行', { lid: .55, headTilt: -.15, look: [-.7, 0], brow: { tilt: .3 }, mouth: { sm: -.6 } }],
      ['看向门', { lid: .4, look: [1, -.1], brow: { tilt: -.15, h: 4 } }], ['微笑', { lid: .45, mouth: { sm: .9 }, brow: { tilt: -.1, h: 4 } }], ['眯眼笑', { happy: 1, mouth: { sm: 1, o: .25 } }]];
    L.forEach(([n, P], i) => box(i, 0, '刘姨 ' + n, (cx, cy) => liu({ ...P, x: cx - 30, y: cy + 372 * 1.25 + 10, s: 1.25 })));
    const Z = [['冷淡', {}], ['眨眼', { blink: true }], ['惊', { lid: .02, pupil: 3, brow: { h: 18, tilt: -.2 } }], ['嘴角一翘', { smile: 1, lid: .5 }], ['专注闭眼', { closed: true, brow: { tilt: .2 } }], ['说话', { mouth: { o: .5, w: .8 } }], ['抬眼', { look: [0, -1], lid: .4 }]];
    Z.forEach(([n, P], i) => box(i, 1, '祖格 ' + n, (cx, cy) => zug({ ...P, x: cx - 30, y: cy + 640 + 10, s: 1.0 })));
    const Pp = [['紧张', { jit: 4, t }], ['吓呆', { pupil: 2.5, lid: 0, mouth: { o: .12 }, brow: { tilt: -.6, h: 14 } }], ['辣到', { flush: 1, closed: true, mouth: { o: .8, w: 1.3 }, brow: { tilt: .4 } }], ['开心', { happy: 1, mouth: { o: .5, sm: 1 }, brow: { tilt: -.2, h: 10 } }],
      ['尖叫', { pupil: 3, mouth: { o: 1, w: 1.2 }, brow: { tilt: -.5, h: 18 } }], ['发现', { look: [.8, .3], mouth: { o: .4, sm: .3 }, brow: { h: 14 } }], ['再来一盘', { flush: .8, lid: .3, mouth: { o: .15, sm: .6 }, brow: { tilt: -.1, h: 4 } }]];
    Pp.forEach(([n, P], i) => box(i, 2, '皮皮 ' + n, (cx, cy) => pip({ t, ...P, x: cx, y: cy + 232 * 1.0 + 60, s: 1.0 })));
  }
};
window.READY = true;
