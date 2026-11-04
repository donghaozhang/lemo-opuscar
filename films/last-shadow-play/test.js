// Sheets drawn with the real engine: ?test=model (model sheet), ?test=expr (expression sheet), ?test=frame&f=... (style frames)
import { canvas, DYE } from './carve.js';
import { camM, set, ap, mul, T, S } from './rig.js';
import { drawMonkey, drawDemon, MREST, DREST, buildShowScenery, SGROUND, MLEG } from './show.js';
import { drawMaster, drawBoy, GREST, BREST } from './people.js';
import { buildSets, drawCrowd, drawLamp, drawPlacard } from './sets.js';

const W = 1920, H = 1080;
function label(fr, text, x, y, size = 30, col = '#f3e2bf') { fr.save(); fr.setTransform(1, 0, 0, 1, 0, 0); fr.font = `600 ${size}px "Noto Serif SC"`; fr.fillStyle = col; fr.textAlign = 'center'; fr.textBaseline = 'middle'; fr.shadowColor = 'rgba(0,0,0,.6)'; fr.shadowBlur = 6; fr.fillText(text, x, y); fr.restore(); }
const EVEN = { lamps: [{ x: 960, y: 540, I: 1.1, hot: 0, sigB: 1600, sigC: 100, col: [1, .8, .52] }], amb: [.16, .12, .08], expo: 1.5, vign: .25, bloom: .18, cam: [960, 540, 1] };

export function modelSheet(tr, fr, v = '1') {
  tr.setTransform(1, 0, 0, 1, 0, 0); tr.fillStyle = '#fff'; tr.fillRect(0, 0, W, H);
  const C = camM([960, 540, 1]);
  // ground lines
  // the master (seated), the boy (seated): world scale 1
  const gm = drawMaster(tr, C, { ...GREST, x: 360, y: 560, flip: -1, hF: [250, 70], hB: [230, 110], handF: 'grip', handB: 'pinch', expr: { brow: 0, browY: 0, lid: .15, pupil: [0, 0], mouth: 'line' } });
  const bb = drawBoy(tr, C, { ...BREST, x: 660, y: 620, flip: -1, hF: [150, 60], hB: [140, 90], handF: 'open', handB: 'grip', expr: { brow: 0, browY: 0, lid: 0, pupil: [0, 0], mouth: 'line' } });
  // show puppets at cloth scale ×1.15 (they are smaller than the people in the world)
  const Cs = mul(C, [1.15, 0, 0, 1.15, 0, 0]);
  const gy = 760;
  drawMonkey(tr, Cs, { ...MREST, x: 900 / 1.15, y: (gy - MLEG) / 1.15, flip: 1, hF: [60, 70], hB: [-30, 90], staffA: -1.1, head: -.05 });
  drawDemon(tr, Cs, { ...DREST, x: 1180 / 1.15, y: (gy - 150) / 1.15, flip: -1, form: 'maiden', hF: [40, 96], hB: [-16, 98] });
  drawDemon(tr, Cs, { ...DREST, x: 1480 / 1.15, y: (gy - 150) / 1.15, flip: -1, form: 'skull', basket: 0, hF: [70, 40], hB: [-10, 90], head: -.1 });
  // exploded Monkey King pieces (joint view) at the right
  const Ce = mul(C, [.9, 0, 0, .9, 0, 0]);
  drawMonkey(tr, Ce, { ...MREST, x: 1760 / .9, y: 470 / .9, flip: 1, hF: [90, -10], hB: [-70, -20], legF: -.5, legB: .5, staff: 0, head: .2, waist: .1 });
  // palette
  const sw = [['朱砂', DYE.red], ['金', DYE.gold], ['赭石', DYE.yellow], ['石绿', DYE.green], ['孔雀绿', DYE.jade], ['靛蓝', DYE.teal], ['生皮', DYE.hide], ['墨', DYE.ink]];
  sw.forEach(([n, c], i) => { const x = 1100 + i * 88, y = 110; tr.save(); tr.globalCompositeOperation = 'multiply'; tr.fillStyle = c; tr.fillRect(x, y, 70, 70); tr.strokeStyle = DYE.ink; tr.lineWidth = 2; tr.strokeRect(x, y, 70, 70); tr.restore(); label(fr, n, x + 35, y + 96, 20); });
  label(fr, '模型 · 最后一场皮影戏', 960, 40, 34);
  label(fr, '爷爷', 330, 1000, 28); label(fr, '小满', 640, 1000, 28); label(fr, '孙悟空', 900, 1000, 28); label(fr, '白骨精·村姑', 1180, 1000, 28); label(fr, '白骨精·骷髅', 1480, 1000, 28); label(fr, '关节与签子', 1760, 760, 24);
  label(fr, '色板（透光染色）', 1420, 72, 22);
  return { ...EVEN };
}
export function exprSheet(tr, fr) {
  tr.setTransform(1, 0, 0, 1, 0, 0); tr.fillStyle = '#fff'; tr.fillRect(0, 0, W, H);
  const M = [['平静', { brow: 0, browY: 0, lid: .15, pupil: [0, 0], mouth: 'line' }, 0, 0],
    ['惊讶', { brow: -.05, browY: 7, lid: 0, pupil: [1, 0], mouth: 'o' }, -.08, -.05],
    ['担忧', { brow: -.32, browY: 2, lid: .3, pupil: [0, 1], mouth: 'down' }, .14, .05],
    ['决心', { brow: .3, browY: -1, lid: .1, pupil: [2, 0], mouth: 'grim' }, -.1, -.04],
    ['欢喜', { brow: -.1, browY: 3, lid: .35, pupil: [1, 0], mouth: 'smile' }, -.05, 0],
    ['疲惫·痛', { brow: -.28, browY: 0, lid: .6, pupil: [-1, 2], mouth: 'grim' }, .28, .12]];
  const B = [['平静', { brow: 0, browY: 0, lid: 0, pupil: [0, 0], mouth: 'line' }, 0, 0],
    ['无聊', { brow: -.02, browY: 2, lid: .45, pupil: [-2, -3], mouth: 'down' }, .06, .02],
    ['惊讶', { brow: -.05, browY: 8, lid: 0, pupil: [2, -1], mouth: 'o' }, -.1, -.05],
    ['专注', { brow: .22, browY: -2, lid: .25, pupil: [3, 1], mouth: 'tongue' }, .1, .04],
    ['决心', { brow: .34, browY: -1, lid: .05, pupil: [3, 0], mouth: 'grim' }, -.08, -.03],
    ['欢喜', { brow: -.08, browY: 4, lid: .3, pupil: [1, 0], mouth: 'grin' }, -.12, -.04]];
  const z = 2.6;
  M.forEach(([n, e, head, rot], i) => {
    const cx = 160 + i * 320, cy = 300;
    const C = camM([0, 0, z]); tr.save(); tr.beginPath(); tr.rect(cx - 158, 60, 316, 440); tr.clip();
    drawMaster(tr, [C[0], 0, 0, C[3], cx + 30 * z * 1, cy + 200 * z], { ...GREST, x: 0, y: 0, flip: -1, head, rot, hF: [250, 70], hB: [230, 110], expr: e }, { rivets: false }); tr.restore();
    label(fr, n, cx, 520, 26);
  });
  B.forEach(([n, e, head, rot], i) => {
    const cx = 160 + i * 320, cy = 800;
    const C = camM([0, 0, z]); tr.save(); tr.beginPath(); tr.rect(cx - 158, 560, 316, 450); tr.clip();
    drawBoy(tr, [C[0], 0, 0, C[3], cx + 22 * z, cy + 134 * z], { ...BREST, x: 0, y: 0, flip: -1, head, rot, hF: [150, 60], hB: [140, 90], expr: e }, { rivets: false }); tr.restore();
    label(fr, n, cx, 1030, 26);
  });
  label(fr, '表情 · 眉片转、眼皮滑、瞳片滑、嘴片换', 960, 40, 30);
  return { ...EVEN, lamps: [{ x: 960, y: 540, I: 1.0, hot: 0, sigB: 2200, sigC: 100, col: [1, .8, .52] }], amb: [.3, .24, .16] };
}
