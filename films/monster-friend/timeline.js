// 《我的怪兽朋友》 timeline: the single source of truth for picture, score, foley, subtitles and checks.
// Seconds at 24 fps; cuts and hits on whole frames; tempos frame-exact (72 bpm = 20 f, 60 = 24 f, 120 = 12 f).
export const FPS = 24;
export const DUR = 140.0;
const F = n => n / FPS;

// Music sections: id, start, bpm, beats
export const SECS = [
  { id: 'city', t: 0.0, bpm: 72, beats: 31 },     // lonely: clarinet lilt in A minor, sparse ukulele
  { id: 'night', t: 26.0, bpm: 60, beats: 30 },   // magic: music box (the theme hinted), glockenspiel, clarinet
  { id: 'trouble', t: 56.0, bpm: 120, beats: 48 },// ukulele strum in C, woodblock, shaker, toy piano
  { id: 'hush', t: 80.0, bpm: 60, beats: 20 },    // recorder alone, then the music box winding down, a full beat of nothing at 95
  { id: 'finale', t: 100.0, bpm: 120, beats: 50 },// the theme in full
  { id: 'lullaby', t: 125.0, bpm: 60, beats: 15 },// music box reprise, clarinet low
];
export const secOf = id => SECS.find(s => s.id === id);
export const beatT = (id, b) => { const s = secOf(id); return s.t + b * 60 / s.bpm; };

// Shots (start times); a shot ends where the next begins. Page turns (0.6 s) end the shot they are listed in.
export const SHOT = {
  s01: 0.0,     // ECU purple crayon tip mid-stroke; pull back: the truck's wheels
  s02: 3.0,     // full page: the city draws itself and colours; balloon; title; words
  s03: 9.0,     // push to the window: Dou Dou shy → PAGE TURN 11.4–12.0
  s04: 12.0,    // full page: the kindergarten draws itself
  s05: 16.0,    // medium: Dou Dou at the gate, a child runs past and waves
  s06: 19.5,    // close-up: the mouth opens, nothing comes; words
  s07: 23.0,    // OTS teacher: Dou Dou small at the gate → PAGE TURN 25.4–26.0
  s08: 26.0,    // night: the bedroom draws itself; lamp; the wash comes down
  s09: 30.0,    // insert: the crayon box; the purple one taken
  s10: 33.0,    // the monster drawn line by line and coloured; words
  s11: 41.0,    // the wash passes the page: the wax eyes shine; pupils; blink; looks
  s12: 44.0,    // medium: an arm out of the book; climbs off; lands; jaw drops
  s13: 47.5,    // CU Dou Dou gasps, blanket; the monster shrinks to a mouse
  s14: 50.0,    // two-shot: squeak; peek; giggle; POP back to child size; words
  s15: 53.0,    // CU monster delighted, hugs his head → PAGE TURN 55.4–56.0
  s16: 56.0,    // morning insert: the backpack; the monster squeezes in; the zip; words
  s17: 59.0,    // tight follow: the walk, the street drawing itself; sun; the eyes glance; words
  s18: 63.0,    // truck along the classroom table; the backpack unzips by itself
  s19: 66.0,    // medium: the cat-sized monster eats the crayons; yellow last
  s20: 70.0,    // CU: nose twitch; sneeze: colour burst; children look up; words
  s21: 73.0,    // sandpit: a mound with eyes; a shovel pats it; giggle
  s22: 76.5,    // CU Dou Dou laughing behind his hands; the bell; the face falls → PAGE TURN 79.4–80.0
  s23: 80.0,    // full page: the playground; Ni Ni alone under the tree
  s24: 84.0,    // tilt up her gaze: the balloon in the branches; words
  s25: 87.0,    // two-shot: the monster nudges; Dou Dou leans back, feet skidding
  s26: 90.0,    // CU held: freeze; the shrink to a bean; the looks; words
  s27: 96.0,    // medium two-shot: breath; step; the crayon out; 你好 drawn in the air; Ni Ni looks up
  s28: 100.0,   // wide: GROW to fill the page; lift; the balloon freed
  s29: 104.0,   // CU Ni Ni laughs; the balloon back; twinkle
  s30: 107.0,   // medium: the burp; the yellow crayon pops out; words
  s31: 110.0,   // locked close on the ground: Ni Ni draws the yellow monster; it blinks, shakes, hops
  s32: 115.0,   // wide: the two monsters play; words
  s32b: 119.0,  // cut-in two-shot: the children laugh
  s32c: 120.5,  // wide again: the ride
  s33: 122.0,   // close two-shot: the balloon between them → PAGE TURN 124.4–125.0
  s34: 125.0,   // night again: the wash; yawn; shrink; climbs into the book; the book closes; words
  s35: 131.0,   // PAGE TURN 131.0–131.6 to the last page: four figures drawn; 我的朋友 lettered
  s36: 136.0,   // the last page held; the purple crayon set down; the boil calms; end
  end: DUR,
};
export const shotAt = t => { let k = 's01'; for (const [n, s] of Object.entries(SHOT)) if (n !== 'end' && t >= s) k = n; return k; };
export const shotEnd = k => { const ks = Object.keys(SHOT), i = ks.indexOf(k); return SHOT[ks[i + 1]]; };

// Page turns [t0, t1]: from page i to page i+1 (0.6 s each)
export const TURNS = [[11.4, 12.0], [25.4, 26.0], [55.4, 56.0], [79.4, 80.0], [124.4, 125.0], [131.0, 131.6]];
export const pageAt = t => { let p = 0; for (const [a] of TURNS) if (t >= a) p++; return p; };   // 0..6: city, kinder, night, morning/class, playground, night2, last

// Key actions (hits), all on whole frames or the grid
export const HIT = {
  crayonStart: 0.0, truck: 1.6, pageIn: 3.0, cityDraw0: 3.0, cityFill0: 5.0, balloon: 6.5, title: 7.0, words1: 8.0, push: 9.0, turn1: 11.4,
  kinderDraw0: 12.6, teacherWave: 15.0, gate: 16.0, childWave: 18.2, mouthOpen: 21.0, mouthClose: 21.8, ots: 23.0, turn2: 25.4,
  roomDraw0: 26.6, lamp: 28.0, wash0: 28.5, boxIn: 30.0, purple: beatT('night', 6.2) /* 32.2 */, draw0: 33.0, drawFill0: 37.0,
  washPage: 41.0, eyesShine: 42.0, pupils: 42.5, blink: 43.2, looks: 43.6,
  armOut: 44.5, climb: 45.3, land: 46.6, jaw: 47.0, gasp: 47.5, blanket: 48.0, shrink1: 48.6, squeak: 50.3, peek: 50.8, giggle: 51.5, pop: 52.2, hug: 54.0, turn3: 55.4,
  backpackIn: 56.6, squeeze: 57.2, zip: 58.6, walk: 59.0, sunUp: 60.0, eyesGlance: 61.0, table: 63.0, unzip: 65.0,
  crunch1: 66.5, crunch2: 67.3, crunch3: 68.1, crunch4: 68.9, crunchY: 69.5, twitch: 70.0, antic: 71.2, sneeze: 71.8, kidsLook: 72.6,
  sandpit: 73.0, pat: 74.8, giggle2: 75.4, laughCU: 76.5, bell: 78.8, faceFalls: 79.0, turn4: 79.4,
  playDraw0: 80.6, niniIn: 83.0, tilt: 84.0, balloonSeen: 86.0, nudge: 87.6, skid: 88.5,
  freeze: 90.0, shrink2: 91.0, lookBean: 92.5, lookNini: 93.8, lookCrayon: 95.0, breath: 96.0, step: 97.4, crayonOut: 98.0, nihao: 98.6, niniUp: 99.6,
  grow: 100.0, lift: 102.4, freed: 103.6, niniLaugh: 104.8, twinkle: 105.5, burp: 107.8, crayonPop: 108.2,
  draw2: 110.0, eyes2: 113.2, shake: 113.8, hop: 114.4, chase: 115.0, bounce: 117.5, ride: 118.5, twoShot: 119.0, turn5: 124.4,
  wash2: 125.6, yawn: 127.0, shrink3: 128.0, climbIn: 128.6, inBook: 130.0, bookCloses: 130.6, turn6: 131.0,
  lastDraw0: 131.6, letters: 134.6, crayonDown: 137.0,
};

// The book's printed words (subtitles): shown bottom-centre on a knock-out patch; 你好 is drawn in the air (not a subtitle) and 我的朋友 is lettered on the page
export const SUBS = [
  { id: 'L1', text: '豆豆搬到了新城市。', t0: 8.0, t1: 11.4 },
  { id: 'L2', text: '新的幼儿园里，豆豆一个字也说不出来。', t0: 20.0, t1: 25.4 },
  { id: 'L3', text: '晚上，豆豆画了一只紫色的大怪兽。', t0: 36.0, t1: 41.0 },
  { id: 'L4', text: '豆豆害怕，它就变小；豆豆勇敢，它就变大。', t0: 50.2, t1: 55.4 },
  { id: 'L5', text: '第二天，怪兽躲进了书包。只有豆豆能看见它。', t0: 57.0, t1: 63.0 },
  { id: 'L6', text: '怪兽吃掉了蜡笔，打了一个彩色的喷嚏。', t0: 71.6, t1: 76.8 },
  { id: 'L7', text: '妮妮的气球挂在树上了。', t0: 85.0, t1: 90.0 },
  { id: 'L8', text: '豆豆吸了一口气。', t0: 93.0, t1: 96.0 },
  { id: 'L9', text: '你好', t0: 98.6, t1: 100.6, kind: 'air' },
  { id: 'L10', text: '妮妮用黄色的蜡笔，也画了一只怪兽。', t0: 108.3, t1: 113.3 },
  { id: 'L11', text: '两只怪兽一起玩，两个朋友一起笑。', t0: 116.0, t1: 122.0 },
  { id: 'L12', text: '晚上，怪兽回到了书里。', t0: 126.0, t1: 131.0 },
  { id: 'L13', text: '我的朋友', t0: 134.6, t1: 140.0, kind: 'page' },
];
export const TITLE = { text: '我的怪兽朋友', t0: 7.0, t1: 11.4 };

// Literal silences: the whole bus at zero
export const SILENCE = [[48.6, 50.0], [95.0, 96.0], [139.0, 140.0]];
