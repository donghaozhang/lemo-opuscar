// Model sheet and expression sheet (rendered with the film's real rigs): ?test=model | ?test=expr | ?test=monger
import { W, H, PAL, TX, cartouche, drawSeal } from './print.js';
import { figure, catSide, pose, gait, blend, catFace, fexpr, kitten, monger, MP, manGait, mongerFace, mexpr, kite, talons, fish, person, boat, bigPaw, bigHand } from './chars.js';
const label = (ctx, s, x, y, size = 30) => { ctx.save(); ctx.fillStyle = PAL.sumi; ctx.font = `600 ${size}px Serif`; ctx.textAlign = 'center'; ctx.fillText(s, x, y); ctx.restore(); };
export function testSheet(ctx, which, t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(TX.paper, 0, 0);
  if (which === 'model') {
    // cat turnaround-ish: side poses + face + kitten + palette
    const poses = [['stand', pose('stand')], ['sit', pose('sit')], ['crouch', pose('crouch')], ['sneak', gait('sneak', .2, 'sneak')], ['run·伸', gait('run', 0)], ['run·收', gait('run', .5)], ['leap', pose('leap')], ['slide', pose('slide')]];
    poses.forEach(([n, P], i) => { const x = 180 + (i % 4) * 420, y = 330 + Math.floor(i / 4) * 300; figure(ctx, A => catSide(A, x, y, 230, 1, P, { fish: n === 'sneak' ? 1 : 0, t })); label(ctx, n, x, y + 50, 26); });
    figure(ctx, A => catFace(A, 330, 860, 300, fexpr('neutral'), { t })); label(ctx, '猫', 330, 1050, 26);
    figure(ctx, A => kitten(A, 720, 1000, 220, { E: fexpr('hungry'), t })); label(ctx, '小猫', 720, 1050, 26);
    [-1, 0, 1].forEach((f, i) => figure(ctx, A => kite(A, 960 + i * 190, 880, 300, 1, f, { fish: i === 1 ? 1 : 0, claws: 1, t }))); label(ctx, '鸢', 1150, 1050, 26);
    figure(ctx, A => fish(A, [1500, 900], 300, 0, .1));
    const pal = ['#f7f0de', '#d39a45', '#4a4540', PAL.ai, PAL.prus, PAL.sky, PAL.beni, PAL.green, PAL.skin];
    pal.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(1700 + (i % 3) * 60, 820 + Math.floor(i / 3) * 60, 50, 50); ctx.strokeStyle = PAL.sumi; ctx.strokeRect(1700 + (i % 3) * 60, 820 + Math.floor(i / 3) * 60, 50, 50); });
  } else if (which === 'expr') {
    const ex = ['neutral', 'sly', 'determined', 'shocked', 'furious', 'awed', 'tender', 'surprised', 'wet', 'pant'];
    ex.forEach((n, i) => { const x = 200 + (i % 5) * 380, y = 250 + Math.floor(i / 5) * 470; figure(ctx, A => catFace(A, x, y, 300, fexpr(n), { t })); label(ctx, n, x, y + 200, 28); });
  } else if (which === 'monger') {
    const ex = ['neutral', 'yawn', 'take', 'furious', 'exhausted', 'agape', 'soft', 'sigh'];
    ex.forEach((n, i) => { const x = 200 + (i % 4) * 330, y = 200 + Math.floor(i / 4) * 480; figure(ctx, A => mongerFace(A, x, y, 230, mexpr(n), { t })); label(ctx, n, x, y + 320, 26); });
    const bp = [['stand', MP.stand, 'shoulder'], ['run', manGait('run', .1), 'hand'], ['yawn', MP.yawn, 'none'], ['kneel', MP.kneel, 'none'], ['lantern', MP.lantern, 'none'], ['crawl', MP.crawl, 'hand']];
    bp.forEach(([n, P, pole], i) => { const x = 1450 + (i % 2) * 260, y = 330 + Math.floor(i / 2) * 340; figure(ctx, A => monger(A, x, y, 300, 1, P, { pole, lantern: n === 'lantern', lit: true })); label(ctx, n, x, y + 34, 24); });
  } else if (which === 'kids') {
    ['hungry', 'eat', 'surprised', 'tender'].forEach((n, i) => figure(ctx, A => kitten(A, 250 + i * 450, 600, 320, { E: fexpr(n), t })));
    ['umbrella', 'cape', 'farmer', 'monk', 'fisher'].forEach((k, i) => figure(ctx, A => person(A, 200 + i * 300, 1000, 260, 1, k, .2)));
    figure(ctx, A => boat(A, 1700, 950, 360));
    figure(ctx, A => talons(A, 1650, 400, 300, (t % 2) / 2));
    figure(ctx, A => bigPaw(A, 1500, 700, 200, -.2, 1));
  }
  ctx.drawImage(TX.fiber, 0, 0);
}
