// Subtitle cues (DOM-free, so tools/subs.mjs can build the .srt in Node): when each card's text is fully on screen.
import { SEC, HIT } from './timeline.js';
import { SUBS } from './cardspecs.js';
export function subtitleCues() {
  const S = Object.fromEntries(SUBS);
  return [
    { t0: HIT.snap + .24, t1: SEC.TITLE.t1 - .45, text: S.titleZh },
    { t0: SEC.GOAL.t0 + .15, t1: SEC.GOAL.t1 - .2, text: S.GOAL },
    { t0: SEC.PAGE.t0 + .3, t1: HIT.fix, text: `${S.pageEn}\n${S.pageBad}` },
    { t0: HIT.fix, t1: SEC.PAGE.t1, text: S.pageFix },
    { t0: SEC.SHOUT.t0 + .15, t1: SEC.SHOUT.t1 - .2, text: S.SHOUT },
    { t0: SEC.LAST.t0 + .15, t1: SEC.LAST.t1 - .2, text: S.LAST },
    { t0: SEC.END.t0 + .2, t1: HIT.lampOff - .3, text: S.END },
  ];
}
