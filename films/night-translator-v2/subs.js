// Subtitle cues (DOM-free): when each card / page text is fully on screen. Chinese, with the reels' English lines.
import { SEC, HIT, SHOTS } from './timeline.js';
import { REELS, CARDS } from './cardspecs.js';
const shot = (name, reel) => SHOTS.find(s => s.name === name && (!reel || s.opt.reel === reel));
export function subtitleCues() {
  const c = [];
  const add = (t0, t1, text) => c.push({ t0, t1, text });
  add(HIT.snap + .24, SEC.TITLE.t1 - .45, '《深夜翻译官》');
  add(SEC.SAY.t0 + .15, SEC.SAY.t1 - .2, '老校：天亮之前——一个字也不许错。');
  for (const r of ['WEST', 'ROMA', 'MONS']) {
    const R = REELS[r], card = shot('reelCard', r), pg = shot(r === 'MONS' ? 'pageHand' : 'page', r), fx = r === 'MONS' ? pg : shot('pageFix', r);
    const fixT = { WEST: HIT.wFix, ROMA: HIT.rFix, MONS: HIT.mFix }[r];
    add(card.t0 + .1, card.t1, R.en);
    add(pg.t0 + .2, r === 'MONS' ? fixT : pg.t1, R.bad);
    add(fixT + .3, fx.t1, R.fix);
  }
  add(SEC.SHOUT.t0 + .15, SEC.SHOUT.t1 - .2, '硝酸胶片——一点就着！');
  add(SEC.SAY2.t0 + .15, SEC.SAY2.t1 - .2, '老校：……不错。');
  add(SEC.LAST.t0 + .15, SEC.LAST.t1 - .2, '您刚看的这一卷——正是第一千卷。');
  add(SEC.END.t0 + .2, HIT.curtainOut + .8, '完\n翻译 小译 · 校对 老校');
  return c;
}
