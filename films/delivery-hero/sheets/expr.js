// expression sheets: ?sheet=expr&who=rider (12) | who=kidlady (4 + 5), busts with labels
import { C } from '../px.js';
import { bust } from '../face.js';
import { text } from '../font.js';
const who = new URLSearchParams(location.search).get('who') || 'rider';
const LIST = who === 'rider'
  ? [['rider', 'sleepy'], ['rider', 'startled'], ['rider', 'determined'], ['rider', 'dread'], ['rider', 'deadpan'], ['rider', 'tired'], ['rider', 'hesitant'], ['rider', 'soft'], ['rider', 'sing'], ['rider', 'wink'], ['rider', 'scared'], ['rider', 'happy']]
  : [['kid', 'sadWet'], ['kid', 'surprised'], ['kid', 'happy'], ['kid', 'joy'], ['lady', 'surprised'], ['lady', 'soft'], ['lady', 'wistful'], ['lady', 'tearful'], ['lady', 'overjoyed']];
export function draw(fb) {
  fb.gradV(0, 0, 320, 180, [C.dslate, C.night]);
  const cols = who === 'rider' ? 6 : 5, cw = Math.floor(320 / cols), s = who === 'rider' ? 1.45 : 1.6;
  LIST.forEach(([w, e], i) => {
    const x = (i % cols) * cw, y = Math.floor(i / cols) * 90;
    const b = bust(w, e, s, { w: cw, h: 78, wet: e === 'sadWet' });
    fb.blit(b.spr, x, y + 2);
    fb.rect(x, y + 78, cw, 12, C.ink);
    text(fb, e, x + 3, y + 80, C.silver, { size: 8 });
  });
}
