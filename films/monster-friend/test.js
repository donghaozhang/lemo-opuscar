// Test pages: ?test=model (turnaround, key poses, the monster's sizes, palette) · ?test=faces (expression sheets) · ?test=page&n=1 (a page of the book)
import { layer, clear, line, fill, text, handCircle, ellipse, CAM } from './crayon.js';
import { group, clearGroup } from './rig.js';
import { kid, head, monster, EXPR, MEXPR, crayonStick } from './chars.js';
import { PAL } from './pal.js';
const C = group(), BG = layer(), TX = layer();
const K = PAL.crayon, INK = K.ink;
const FONT = 'ZCOOL KuaiLe';
function label(s, x, y, size = 28, o = {}) { text(TX, s, x, y, { size, col: INK, p: .9, font: FONT, ...o }); }
function rule(x0, y0, x1, y1, seed) { line(BG, [[x0, y0], [x1, y1]], { w: 3, col: K.sky, p: .55, seed, wob: 1.5 }); }
function ground(x0, x1, y, seed) { line(BG, [[x0, y], [x1, y]], { w: 4, col: K.green, p: .6, seed, wob: 2 }); }

export function test(comp, t, which, Q) {
  clearGroup(C); clear(BG); clear(TX);
  CAM.x = 960; CAM.y = 540; CAM.s = 1;
  if (which === 'model') modelPage(Q);
  else if (which === 'faces') facesPage(Q);
  else if (which === 'hide') { monster(C, { x: 960, y: 700, s: 1.3, pose: 'hide', expr: 'mischief', look: [.5, -.2], seed: 600 }); }
  comp.paperCam(0, 0, 1);
  comp.begin();
  comp.crayon(BG.c);
  comp.group(C);
  comp.crayon(TX.c);
  comp.finish({ vig: .18 });
}

// Dou Dou's and Ni Ni's defaults
export const DD = { hair: 'bowl', shirt: K.orange, bottom: K.sky, hairCol: K.brown };
export const NN = { hair: 'pigtails', shirt: K.yellow, dress: true, hairCol: K.ink, ribbons: true };

function modelPage(Q) {
  label('《我的怪兽朋友》 造型表 · model sheet', 40, 56, 42, { align: 'left' });
  label('蜡笔儿童绘本 · 2.6 个头高 · 轮廓永远是靛蓝 · 12 支蜡笔', 900, 54, 22, { align: 'left', p: .6 });
  const Y1 = 440;
  // Dou Dou turnaround
  label('豆豆 Dou Dou', 60, 100, 28, { align: 'left' });
  [['front', '正面'], ['q', '3/4'], ['side', '侧面'], ['back', '背面']].forEach(([vw, lab], i) => {
    const x = 120 + i * 145;
    kid(C, { ...DD, x, y: Y1, s: .9, view: vw, expr: 'neutral', backpack: vw !== 'front', seed: 1000 + i * 37 });
    label(lab, x, Y1 + 42, 22);
  });
  ground(50, 610, Y1 + 2, 11);
  // Ni Ni turnaround
  label('妮妮 Ni Ni', 700, 100, 28, { align: 'left' });
  [['front', '正面'], ['q', '3/4'], ['side', '侧面'], ['back', '背面']].forEach(([vw, lab], i) => {
    const x = 760 + i * 145;
    kid(C, { ...NN, x, y: Y1, s: .9, view: vw, expr: 'smile', seed: 1200 + i * 37 });
    label(lab, x, Y1 + 42, 22);
  });
  ground(690, 1250, Y1 + 2, 12);
  rule(650, 80, 650, 500, 3); rule(1290, 80, 1290, 500, 4);
  // Scale ladder: the monster next to Dou Dou at five sizes (drawn big to small so the small ones stay in front)
  label('大小跟着勇气走', 1320, 100, 28, { align: 'left' });
  label('怕 → 豆子 · 老鼠 · 猫 · 孩子 · 巨大 ← 勇敢', 1320, 132, 19, { align: 'left', p: .6 });
  const sizes = [[1.45, 'huge', 1790], [.95, 'child', 1620], [.42, 'cat', 1520], [.14, 'mouse', 1465], [.055, 'bean', 1432]];
  sizes.forEach(([s, lab, x], i) => { monster(C, { x, y: Y1, s: s * .78, expr: i > 2 ? 'scared' : i === 0 ? 'proud' : 'happy', seed: 1500 + i * 29, look: [-.4, 0] }); });
  kid(C, { ...DD, x: 1370, y: Y1, s: .78, view: 'q', expr: 'curious', seed: 1400 });
  label('每种大小都在豆豆身边出现过', 1600, Y1 + 42, 18, { p: .55 });
  ground(1310, 1900, Y1 + 2, 13);
  rule(40, 500, 1880, 500, 5);
  // key poses row
  const Y2 = 830;
  label('关键动作 key poses', 60, 540, 28, { align: 'left' });
  const poses = [
    ['walk', 0, '走 (书包)', { backpack: true, view: 'side', peek: true, peekLook: [.3, -.3] }],
    ['cover', 0, '捂嘴 (害羞)', { view: 'front', expr: 'shy' }],
    ['lean', 0, '被推 (害怕)', { view: 'q', expr: 'scared' }],
    ['hold', 0, '递蜡笔「你好」', { view: 'side', expr: 'brave', hold: 'crayon' }],
    ['reach', 0, '伸手 (够气球)', { view: 'front', expr: 'determined' }],
    ['sit', 0, '坐 (画画)', { view: 'side', expr: 'curious', hold: 'crayon', arms: { R: [[4, -100], [40, -70], [60, -40]] } }],
  ];
  poses.forEach(([pose, ph, lab, o], i) => {
    const x = 120 + i * 158;
    kid(C, { ...DD, x, y: Y2, s: .86, pose, ph, ...o, seed: 2000 + i * 41 });
    label(lab, x, Y2 + 40, 21);
  });
  ground(50, 960, Y2 + 2, 14);
  rule(985, 510, 985, 1060, 6);
  // monster poses
  label('怪兽 the monster', 1010, 540, 28, { align: 'left' });
  const mp = [['stand', 'happy', '站'], ['eat', 'chew', '吃蜡笔'], ['pre', 'pre', '要打喷嚏'], ['nudge', 'mischief', '推一把'], ['lift', 'proud', '举起'], ['climb', 'sleepy', '爬回书里']];
  mp.forEach(([pose, ex, lab], i) => {
    const x = 1080 + i * 158;
    const o = { x, y: Y2, s: .58, pose: pose === 'pre' ? 'stand' : pose, expr: ex, seed: 3000 + i * 31, cheeks: ex === 'pre' ? 1 : 0 };
    const m = monster(C, o);
    if (pose === 'eat') crayonStick(C, p => p, m.handL[0] + 4, m.handL[1] - 14, -1.2, .8, 3101, K.sky);
    label(lab, x, Y2 + 40, 20);
  });
  ground(1000, 1900, Y2 + 2, 15);
  // palette
  Object.entries(K).forEach(([k, c], i) => {
    const x = 60 + i * 76, y = 905;
    fill(BG, [[x, y], [x + 56, y], [x + 56, y + 66], [x, y + 66]], { col: c, p: .8, seed: 300 + i, gap: 9, w: 11 });
    if (k === 'white') line(BG, [[x, y], [x + 56, y], [x + 56, y + 66], [x, y + 66], [x, y]], { w: 3, col: K.sky, p: .4, seed: 350 });
    label(k, x + 28, y + 92, 19);
  });
  label('十二支蜡笔 · 白色是蜡笔防染 · 唯一一种水彩：群青（夜页）', 500, 1050, 21, { p: .7 });
  // yellow mini monster, hide, hug
  monster(C, { x: 1150, y: 1030, s: .56, mini: true, col: K.yellow, expr: 'delighted', seed: 3300 });
  label('妮妮的黄怪兽', 1150, 1060, 19);
  monster(C, { x: 1420, y: 1030, s: .6, pose: 'hide', expr: 'mischief', look: [.5, 0], seed: 3400 });
  label('藏进沙坑', 1420, 1060, 19);
  monster(C, { x: 1720, y: 1030, s: .52, pose: 'hug', expr: 'delighted', seed: 3500 });
  label('抱', 1720, 1060, 19);
}

function facesPage(Q) {
  label('表情表 · expression sheet', 40, 58, 44, { align: 'left' });
  label('眼白 + 靛蓝瞳孔 + 上眼皮 + 下眼皮 + 眉毛 · 每个表情一眼就能分开', 620, 56, 24, { align: 'left', p: .6 });
  // Dou Dou: 7 expressions, big heads
  label('豆豆', 60, 118, 30, { align: 'left' });
  const dd = [['shy', '害羞'], ['scared', '害怕'], ['curious', '好奇'], ['brave', '勇敢'], ['giggle', '偷笑'], ['laughing', '大笑'], ['sad', '难过'], ['sleepy', '困了']];
  dd.forEach(([e, lab], i) => {
    const x = 150 + i * 232;
    head(C, { ...DD, x, y: 260, s: 1.45, view: i % 3 === 1 ? 'q' : 'front', expr: e, seed: 4000 + i * 41 });
    label(lab, x, 400, 26);
  });
  rule(40, 430, 1880, 430, 7);
  // Ni Ni: 4 expressions
  label('妮妮', 60, 470, 30, { align: 'left' });
  const nn = [['sad', '难过 (气球)'], ['surprised', '惊讶'], ['smile', '微笑'], ['laughing', '大笑']];
  nn.forEach(([e, lab], i) => {
    const x = 150 + i * 232;
    head(C, { ...NN, x, y: 610, s: 1.45, view: i === 1 ? 'q' : 'front', expr: e, seed: 5000 + i * 41 });
    label(lab, x, 750, 26);
  });
  rule(1080, 440, 1080, 790, 8);
  // monster: faces (big)
  label('怪兽', 1110, 470, 30, { align: 'left' });
  const mm = [['happy', '开心'], ['mischief', '捣蛋'], ['scared', '害怕'], ['delighted', '乐开花']];
  mm.forEach(([e, lab], i) => {
    const x = 1190 + i * 200;
    monster(C, { x, y: 760, s: .75, expr: e, seed: 6000 + i * 31, look: e === 'mischief' ? [.5, .2] : undefined });
    label(lab, x, 800, 24);
  });
  rule(40, 820, 1880, 820, 9);
  const mm2 = [['surprised', '惊讶'], ['sad', '难过'], ['pre', '要打喷嚏'], ['sneeze', '阿嚏！'], ['chew', '嚼'], ['proud', '得意'], ['sleepy', '困了'], ['asleep', '睡着']];
  mm2.forEach(([e, lab], i) => {
    const x = 150 + i * 232;
    monster(C, { x, y: 1040, s: .7, expr: e, seed: 7000 + i * 31, cheeks: e === 'pre' ? 1 : e === 'chew' ? .7 : 0 });
    label(lab, x, 1068, 24);
  });
}
