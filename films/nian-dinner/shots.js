// The film: every shot as a function of time, the events for the mixer, the texts for readcheck
import { PAL, canvas, fillPaper, paperShadow, noShadow, transmitOf, piece, fill, trace, Pl, P, ellipsePoly, curve } from './engine/paper.js';
import { put, mul, T, S, R, ap } from './engine/rig.js';
import { beginLight, pool, lightRect, lightImage, applyLight, glowWindow, bloom, rays, addMasked, E, L } from './engine/light.js';
import { drawBanners, textPiece, strip, seal, ink } from './engine/hud.js';
import { drawGirl, drawScissors, buildGirl, walkPose, GJ } from './chars/girl.js';
import { drawNian, buildNian, NPOSE, NJ, runPose } from './chars/nian.js';
import { drawFolk, buildFolk } from './chars/folk.js';
import { kit, HOUSES, HERO, GATE, GROUND, NIGHT, drawSnowfall, lanternPiece } from './sets/village.js';
import { mountainKit } from './sets/mountain.js';
import { kitchenKit, drawClockHands, KPAL } from './sets/kitchen.js';
import { nianCut, foldedSheet, CR } from './sets/papercut.js';
import { W, H, cam, st, E_, pt, mixPose, shake, pop, sky, drawVillage, drawMountain, roadAt, wallBg, burst, flash, crackerBurst, fireworks, spray, steamTrail, sheetPiece } from './sets/world.js';
import { tuanhua } from './engine/tuanhua.js';
import { DUR, T as TT, SECS, tb, BANNERS, TITLE, END, shotAt } from './timeline.js';
import { clamp, lerp, seg, ss, eio, eo, ei, back, hash, vnoise, track, spring } from '/core/lib.js';
import * as A from './shots/partA.js';
import * as B from './shots/partB.js';
import * as Cc from './shots/partC.js';
import * as D from './shots/partD.js';

export function start(g, qs) {
  const SHOT = { ...A.SHOTS, ...B.SHOTS, ...Cc.SHOTS, ...D.SHOTS };
  const [TXc, TX] = canvas(W, H);
  let TEXTS = [];
  function render(t) {
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.filter = 'none'; noShadow(g);
    const sh = shotAt(t);
    TEXTS = [];
    const fn = SHOT[sh.name];
    if (!fn) { g.fillStyle = '#1c2446'; g.fillRect(0, 0, W, H); ink(g, sh.name, 960, 540, 60, '#fff'); }
    else { const tx = fn(g, t, sh); if (tx) TEXTS.push(...tx); }
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.filter = 'none'; noShadow(g);
    if (qs.get('nosub') !== '1') TEXTS.push(...drawBanners(g, t, BANNERS));
    if (qs.get('poster') === '1') D.poster(g);
  }
  window.TEXTS = t => { render(t); return TEXTS.map(x => ({ ...x })); };
  window.EV = [...A.EV, ...B.EV, ...Cc.EV, ...D.EV].sort((a, b) => a.t - b.t);
  window.SUBS = BANNERS;
  window.DUR = DUR; window.render = render; window.READY = true;
}
