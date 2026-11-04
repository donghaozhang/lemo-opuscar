// Model sheets and expression sheets, drawn with the real pieces: ?test=sheet_girl | sheet_nian | expr | frame_<name>
import { PAL, fillPaper, piece, fill, trace, Pl } from './engine/paper.js';
import { put, mul, T, S, R } from './engine/rig.js';
import { drawGirl, buildGirl, GJ, EXPRS, GIRL, GIRL_FAR, walkPose } from './chars/girl.js';
import { drawNian, buildNian, NPOSE, NJ, NEXPRS, NIAN, runPose } from './chars/nian.js';
import { ink, strip } from './engine/hud.js';

const INK = '#3a1410';
function panel(g, x0, y0, x1, y1, title) {
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.strokeStyle = 'rgba(58,20,16,.55)'; g.lineWidth = 1.5; g.strokeRect(x0 + 8, y0 + 8, x1 - x0 - 16, y1 - y0 - 16); g.restore();
  ink(g, title, x0 + 22, y0 + 40, 22, '#8e0f1c', 'left');
}
function rivet(g, x, y, r = 7) { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.beginPath(); g.arc(x, y, r, 0, 7); g.strokeStyle = '#1d4a8a'; g.lineWidth = 2; g.stroke(); g.beginPath(); g.arc(x, y, 2.2, 0, 7); g.fillStyle = '#1d4a8a'; g.fill(); g.restore(); }
function header(g, title, right) {
  put(g, strip(1920, 5, '#8f1016', 64), [1, 0, 0, 1, 0, 2], { shadow: .8 });
  ink(g, title, 26, 46, 30, '#fff1d6', 'left'); ink(g, right, 1894, 44, 20, '#fff1d6', 'right');
}
export function girlSheet(g) {
  const Gp = buildGirl();
  g.setTransform(1, 0, 0, 1, 0, 0); fillPaper(g, 'rice', 0, 0, 1920, 1080);
  header(g, '小雪 · 剪纸角色设定表', '年兽来吃年夜饭 · 红纸关节剪纸 · 12 fps');
  panel(g, 0, 66, 640, 700, '转面 · 侧面表演');
  const k = 1.3, by = 680;
  const r1 = drawGirl(g, [k, 0, 0, k, 170, by], { expr: 'smile' });
  for (const [n, p] of Object.entries(r1.joints)) if (!['eye', 'top', 'handF', 'handB'].includes(n)) rivet(g, p[0], p[1]);
  drawGirl(g, [k, 0, 0, k, 470, by], { flip: true, expr: 'neutral' });
  ink(g, '朝右（正片）', 170, 696, 16, INK); ink(g, '朝左（镜像）', 470, 696, 16, INK);
  ink(g, '蓝圈 = 铆钉关节', 620, 110, 14, '#1d4a8a', 'right');
  panel(g, 0, 700, 640, 1080, '纸与纹样');
  const chips = [[GIRL, '小雪红'], [PAL.red, '中国红'], [NIAN, '年兽红'], [GIRL_FAR, '远侧'], ['#f2e8d0', '米纸'], ['#1c2446', '夜纸'], ['#d9a93f', '金箔(午夜)']];
  chips.forEach(([c, n], i) => { const x = 30 + i * 86, y = 760, pc = piece([0, 0, 70, 50], q => fill(q, qq => trace(qq, Pl([[0, 0], [70, 0], [70, 50], [0, 50]], true, .5, i + 3)), c), { ss: 1, seed: i, col: c }); put(g, pc, [1, 0, 0, 1, x, y], { shadow: .8 }); ink(g, n, x + 35, y + 72, 14, INK); });
  // pieces
  panel(g, 640, 66, 1180, 560, '零件');
  const kb = 1.25, P = (p, x, y, pins, lab) => { put(g, p, [kb, 0, 0, kb, x, y]); for (const [px, py] of pins) rivet(g, x + px * kb, y + py * kb, 6); ink(g, lab, x, y + 36, 15, INK); };
  P(Gp.head.neutral, 760, 330, [[0, 0]], '头+帽');
  P(Gp.torso, 930, 330, [GJ.neck, GJ.shF, GJ.shB, GJ.hipF, GJ.hipB], '棉袄');
  P(Gp.uaF, 1060, 140, [[0, 0], GJ.elbow], '上臂'); P(Gp.faF.mitten, 1060, 260, [[0, 0]], '小臂+手套');
  P(Gp.thF, 700, 420, [[0, 0], GJ.knee], '大腿'); P(Gp.shF, 800, 420, [[0, 0]], '小腿+靴');
  { const M = [1.6, 0, 0, 1.6, 1000, 470]; put(g, Gp.bladeA, mul(M, R(-.25))); put(g, Gp.bladeB, mul(M, R(.25))); rivet(g, 1000, 470, 6); ink(g, '剪刀', 1000, 520, 15, INK); }
  // faces
  panel(g, 1180, 66, 1920, 560, '表情片 · 整片替换');
  const names = { neutral: '平静', smile: '微笑', surprise: '惊讶', sad: '难过', determined: '坚定', laugh: '大笑', worried: '担心', lookup: '抬眼', lookdown: '低眼' };
  EXPRS.forEach((e, i) => { const col = i % 5, row = Math.floor(i / 5), x = 1260 + col * 135, y = 300 + row * 230, kk = .9; put(g, Gp.head[e], [kk, 0, 0, kk, x, y]); ink(g, names[e], x + 2, y + 24, 15, INK); });
  // key poses
  panel(g, 640, 560, 1920, 1080, '关键姿势');
  const poses = [
    [{ expr: 'lookdown', shF: -1.0, elF: -1.4, handF: 'hold', scissors: { ang: -.4, open: .45 }, shB: -.6, elB: -1.1, handB: 'hold', head: .15 }, '剪窗花'],
    [{ expr: 'smile', lean: -.1, shF: -1.5, elF: -.3, shB: -1.4, elB: -.35, handF: 'open', handB: 'open', hipF: .05, hipB: -.05 }, '端碗'],
    [walkPose(1.2, .6, { expr: 'surprise' }), '走路'],
    [{ expr: 'determined', lean: -.06, shF: -2.3, elF: -.4, shB: -2.1, elB: -.5, handF: 'open', handB: 'open', hipF: -.2, knF: .1, hipB: .2, head: -.15 }, '举起剪纸'],
    [{ expr: 'laugh', lean: .12, head: -.2, shF: -.5, elF: -1.6, shB: -.3, elB: -1.4, hipF: -.1, hipB: .1 }, '大笑'],
  ];
  poses.forEach(([p, n], i) => { const x = 740 + i * 240, y = 1030; drawGirl(g, [1.0, 0, 0, 1.0, x, y], { ground: true, ...p }); ink(g, n, x, 1062, 16, INK); });
}
export function nianSheet(g) {
  const Np = buildNian();
  g.setTransform(1, 0, 0, 1, 0, 0); fillPaper(g, 'rice', 0, 0, 1920, 1080);
  header(g, '年兽 · 剪纸角色设定表', '深红纸 · 圆身短腿大爪 · 分量来自体积');
  panel(g, 0, 66, 1180, 640, '年兽侧面 · 与小雪同比例');
  const k = .42, ox = 600, oy = 610 - NJ.ground * k;
  const r = drawNian(g, [k, 0, 0, k, ox, oy], NPOSE.stand);
  for (const [n, p] of Object.entries(r.joints)) if (!['eye', 'nose', 'mouth', 'pawF', 'pawB'].includes(n)) rivet(g, p[0], p[1], 7);
  drawGirl(g, [k * 1.3, 0, 0, k * 1.3, 1060, 610], { flip: true, expr: 'surprise' });
  ink(g, '小雪 1 : 年兽 2.4', 1060, 636, 15, INK);
  ink(g, '蓝圈 = 铆钉关节', 1160, 630, 14, '#1d4a8a', 'right');
  panel(g, 1180, 66, 1920, 640, '表情片');
  const names = { lonely: '孤单', normal: '平常', sniff: '嗅', sneeze: '打喷嚏', panic: '惊慌', happy: '开心', eat: '吃', determined: '下定决心', soft: '温柔', curious: '好奇', lookup: '抬眼' };
  NEXPRS.forEach((e, i) => { const col = i % 4, row = Math.floor(i / 4), kk = .19, cx = 1215 + col * 180, cy = 120 + row * 175; put(g, Np.head[e], [kk, 0, 0, kk, cx + 300 * kk, cy + 440 * kk]); ink(g, names[e], cx + 80, cy + 160, 15, INK); });
  panel(g, 0, 640, 1920, 1080, '关键姿势');
  const poses = [[NPOSE.sit, '坐在山上'], [NPOSE.crouch, '蹑手蹑脚'], [NPOSE.panic, '惊慌'], [runPose(1.0), '奔跑'], [NPOSE.lift, '举起']];
  poses.forEach(([p, n], i) => { const kk = .27, x = 230 + i * 370, y = 1040 - NJ.ground * kk; drawNian(g, [kk, 0, 0, kk, x, y], p, { shadow: 1 }); ink(g, n, x, 1066, 16, INK); });
}
// expression sheet at close-up size: both characters' faces at the size they get in a CU (head ≥ 270 px)
export function exprSheet(g) {
  const Gp = buildGirl(), Np = buildNian();
  g.setTransform(1, 0, 0, 1, 0, 0); fillPaper(g, 'indigo', 0, 0, 1920, 1080, [1, 0, 0, 1, 0, 0], 'rgba(0,0,0,.2)');
  header(g, '表情表 · 特写尺寸', '眼睛：上眼睑月牙 + 下眼睑月牙 + 瞳孔镂空 + 眉');
  const names = { neutral: '平静', smile: '微笑', surprise: '惊讶', sad: '难过', determined: '坚定', laugh: '大笑', worried: '担心', lookup: '抬眼', lookdown: '低眼' };
  EXPRS.forEach((e, i) => { const x = 110 + i * 205, y = 330, kk = 1.25; put(g, Gp.head[e], [kk, 0, 0, kk, x, y], { shadow: 1 }); ink(g, names[e], x + 2, y + 40, 20, '#fff1d6'); });
  const nn = { lonely: '孤单', normal: '平常', sniff: '嗅', sneeze: '打喷嚏', panic: '惊慌', happy: '开心', eat: '吃', determined: '下定决心', soft: '温柔', curious: '好奇', lookup: '抬眼' };
  NEXPRS.forEach((e, i) => { const x = 10 + i * 174, y = 470, kk = .42; put(g, Np.head[e], [kk, 0, 0, kk, x + 300 * kk, y + 440 * kk], { shadow: 1 }); ink(g, nn[e], x + 90, y + 560, 20, '#fff1d6'); });
}
