// model sheet: turnaround (side R / side L), key poses, scale (u1 / u2), e-bike, props, palette
import { C, FB, RGB, NPAL } from '../px.js';
import { figure, POSES } from '../rig.js';
import { ebike, dog, umbrella, bowl, bag, trafficLight, floodBlob, savePoint } from '../props.js';
import { bust } from '../face.js';
import { text } from '../font.js';
const L = (fb, s, x, y) => text(fb, s, x, y, C.silver, { size: 8, shadow: C.ink });
export function draw(fb, t) {
  fb.gradV(0, 0, 320, 180, [C.dslate, C.night]);
  fb.rect(0, 150, 320, 30, C.ink);
  // row 1: rider turnaround + poses (u=1)
  figure(fb, 'rider', POSES.stand, 14, 70, {}); figure(fb, 'rider', POSES.stand, 34, 70, { face: -1 });
  figure(fb, 'rider', POSES.walk0, 56, 70, {}); figure(fb, 'rider', POSES.shock, 76, 70, { sweat: 1 });
  figure(fb, 'rider', POSES.crouch, 96, 70, {}); figure(fb, 'rider', POSES.stand, 116, 70, { coat: 1, hood: 1 });
  const bk = ebike(fb, 150, 70, { light: 1 }); figure(fb, 'rider', POSES.ride, bk.seat[0] + 1, bk.seat[1] + 11.5, {});
  L(fb, '小满 u1', 4, 72);
  // kid + lady + dog
  figure(fb, 'kid', POSES.stand, 186, 70, { wet: 1 }); figure(fb, 'kid', POSES.shiver, 202, 70, { wet: 1 });
  umbrella(fb, 222, 58, .7, 1, 0); figure(fb, 'kid', POSES.holdUp, 220, 70, {});
  figure(fb, 'lady', POSES.hunch, 244, 70, { face: -1 }); figure(fb, 'lady', POSES.stand, 262, 70, { face: -1 });
  dog(fb, 296, 70, 'bark', t);
  // row 2: medium scale u2 + busts
  figure(fb, 'rider', POSES.stand, 30, 146, { u: 2, expr: 'determined' });
  figure(fb, 'rider', POSES.holdUp, 74, 146, { u: 2, expr: 'sing' });
  figure(fb, 'kid', POSES.holdUp, 112, 146, { u: 2, expr: 'joy' });
  figure(fb, 'lady', POSES.stand, 146, 146, { u: 2, expr: 'soft', face: -1 });
  const b = bust('rider', 'determined', 2.3); fb.blit(b.spr, 168, 76);
  const b2 = bust('lady', 'tearful', 2.3); fb.blit(b2.spr, 238, 76);
  bowl(fb, 296, 140, .8, t);
  // palette strip
  for (let i = 0; i < NPAL; i++) fb.rect(4 + i * 6, 172, 6, 6, i);
  L(fb, 'palette · protected 32–38', 4, 160);
}
