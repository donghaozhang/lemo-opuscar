// 《深夜翻译官》 — the cue sheet. Single source of truth for picture, score, mix, subtitles and the cue check.
// Each section starts where the previous one ends; beats are in that section's tempo.
export const FPS = 24;

// [name, bpm, beats, cue-sheet mood]
const SECS = [
  ['TITLE',  96, 12,   'Introduction — the theme in octaves; the blind snaps up'],
  ['NIGHT',  72, 9,    'Misterioso — the archive at midnight'],
  ['GOAL',   72, 4.5,  'Misterioso cadence (card)'],
  ['WORK',  120, 15,   'Allegretto — the work theme, stride'],
  ['PAGE',  120, 8.5,  'Allegretto, thinned (the insert)'],
  ['HURRY', 152, 22,   'Hurry — galop; the jam; trill; silence'],
  ['SHOUT', 152, 8,    'Agitato — cluster, diminished tremolo (card)'],
  ['DASH',  160, 8.5,  'Agitato hurry — the dash'],
  ['CATCH', 160, 11,   'trip → SILENCE → hiss → rolled chord'],
  ['TENDER', 66, 7.5,  'Tenderly — the theme in major, waltz'],
  ['DAWN',   88, 11,   'Maestoso — the theme full; lamps'],
  ['LAST',   66, 4.5,  'Tenderly (card)'],
  ['END',    66, 4,    'final chord held; curtains close'],
];

export const SEC = {};
let t = 0;
for (const [name, bpm, beats, mood] of SECS) {
  const beat = 60 / bpm, dur = beat * beats;
  SEC[name] = { name, bpm, beats, beat, t0: t, t1: t + dur, dur, mood };
  t += dur;
}
export const DUR = +t.toFixed(4);
export const at = (name, b = 0) => SEC[name].t0 + b * SEC[name].beat;
export const secAt = tt => { for (const k in SEC) if (tt < SEC[k].t1) return SEC[k]; return SEC.END; };

// Named hits: the picture lands on these, the score and the effects write to them (tools/cuecheck.py compares).
export const HIT = {
  titleIn:   at('TITLE', .5),
  peek:      at('TITLE', 3),       // Xiao Yi's head rises over the card's lower edge
  lookUs:    at('TITLE', 4),       // looks at the audience
  grab:      at('TITLE', 4.75),    // grabs the pull ring of the English blind
  snap:      at('TITLE', 5),       // the blind snaps up → 《深夜翻译官》
  nod:       at('TITLE', 6),
  drop:      at('TITLE', 10),      // drops out of the card
  irisOpen:  at('NIGHT', .5),
  rollIn:    at('NIGHT', 1.5),
  park:      at('NIGHT', 5),
  lens:      at('NIGHT', 6),       // Lao Jiao raises its lens (glint)
  bell:      at('NIGHT', 7.5),     // the clock strikes twelve (one stroke)
  goal:      at('GOAL', 0),
  work:      at('WORK', 0),
  can1:      at('WORK', 1),        // grabs a can
  thread:    at('WORK', 2),
  type0:     at('WORK', 3),
  type1:     at('WORK', 5.5),
  ding:      at('WORK', 6),
  tube1:     at('WORK', 6.5),      // page 1 up the tube
  stamp1:    at('WORK', 8),
  tube2:     at('WORK', 9),        // page 2 up the tube
  recoil:    at('WORK', 10),
  scrib:     at('WORK', 10.5),
  throw:     at('WORK', 11),
  bonk:      at('WORK', 12),
  look:      at('WORK', 12.5),     // half iris; looks at us
  page:      at('PAGE', 0),
  strike:    at('PAGE', 3),        // red strike through the literal translation
  fix:       at('PAGE', 4),        // the right translation is written in
  hurry:     at('HURRY', 0),
  jam:       at('HURRY', 16),
  shake:     at('HURRY', 17),
  smoke:     at('HURRY', 18),
  silence1:  at('HURRY', 20),
  shout:     at('SHOUT', 0),
  dash:      at('DASH', 0),
  catchSec:  at('CATCH', 0),
  trip:      at('CATCH', 1.5),
  launch:    at('CATCH', 2),       // the can flies — SILENCE 2
  catch:     at('CATCH', 5),       // into the bucket — hiss + splash
  heal:      at('CATCH', 6),       // the burn retreats, rolled chord
  tender:    at('TENDER', 0),
  lift:      at('TENDER', 1),      // lifts the dripping can: No. 1000
  glance:    at('TENDER', 2.5),
  raise:     at('TENDER', 3.5),    // Lao Jiao raises its arm (Xiao Yi flinches)
  pat:       at('TENDER', 4.5),    // ... and pats its head (the echo gesture)
  pat2:      at('TENDER', 5),
  dawn:      at('DAWN', 0),
  seal:      at('DAWN', 1),        // red seal 「译毕」
  hoist:     at('DAWN', 3),        // Lao Jiao lifts Xiao Yi to the last slot
  slot:      at('DAWN', 4.5),      // the can slides in
  lamps:     at('DAWN', 5),        // the lamps come on, one per half beat (8 rows)
  last:      at('LAST', 0),
  end:       at('END', 0),
  curtainOut: at('END', 1),
  lampOff:   at('END', 3.6),
};
export const LAMP_ROWS = 8;
export const lampAt = i => HIT.lamps + i * SEC.DAWN.beat * .5;
