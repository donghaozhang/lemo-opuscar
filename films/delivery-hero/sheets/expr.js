import { C, FB } from '../px.js';
import { bust, portrait } from '../face.js';
import { text } from '../font.js';
const SETS = { rider: ['sleepy', 'startled', 'determined', 'dread', 'deadpan', 'tired', 'hesitant', 'sing', 'wink'], kid: ['sadWet', 'joy', 'surprised', 'happy'], lady: ['surprised', 'wistful', 'tearful', 'overjoyed', 'soft'] };
export function draw(fb, t) {
  fb.gradV(0, 0, 320, 180, [C.dslate, C.night]);
  const who = new URLSearchParams(location.search).get('who') || 'rider';
  const list = SETS[who], s = +(new URLSearchParams(location.search).get('s') || 1.4);
  list.forEach((e, i) => {
    const b = bust(who, e, s, { wet: who === 'kid' && e === 'sadWet' });
    const cols = Math.min(list.length, 5), x = (i % cols) * 64, y = Math.floor(i / cols) * 88;
    fb.blit(b.spr, x + 2, y + 2);
    const pf = new FB(32, 32); pf.clear(C.night); portrait(who, e, { wet: e === 'sadWet' })(pf); fb.blit(pf, x + 2, y + 66 - 32 + 20 > 178 ? y + 40 : y + 54);
    text(fb, e, x + 36, y + 70, C.white, { size: 8, shadow: C.ink });
  });
}
