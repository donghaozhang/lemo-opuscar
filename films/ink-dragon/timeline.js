// 《墨龙借雨》 timeline: the single source of truth for picture, score, foley, subtitles and checks.
// Every time is in seconds at 24 fps; cuts and hits sit on whole frames, tempos are frame-exact (60 bpm = 24 f, 72 = 20 f, 96 = 15 f, 120 = 12 f).
export const FPS = 24;
export const DUR = 132.0;
const F = n => n / FPS;

// Music sections: id, start, bpm, beats
export const SECS = [
  { id: 'night', t: 0.0, bpm: 60, beats: 30 },     // free guqin over a 1 s grid
  { id: 'into', t: 30.0, bpm: 72, beats: 24 },     // pulse: into the painting
  { id: 'cloud', t: 50.0, bpm: 96, beats: 40 },    // the argument
  { id: 'hush', t: 75.0, bpm: 60, beats: 7 },      // literal silence
  { id: 'dive', t: 82.0, bpm: 120, beats: 20 },    // sacrifice
  { id: 'rain', t: 92.0, bpm: 120, beats: 24 },    // rain and dance
  { id: 'dawn', t: 104.0, bpm: 60, beats: 18 },
  { id: 'seal', t: 122.0, bpm: 60, beats: 10 },
];
export const secOf = id => SECS.find(s => s.id === id);
export const beatT = (id, b) => { const s = secOf(id); return s.t + b * 60 / s.bpm; };

// Shots (start times). Each shot's end is the next shot's start.
export const SHOT = {
  s01: 0.0,                 // ECU inkstone lip, the drop
  s02: 3.5,                 // top-down: landing, bloom, the dragon forms, eye opens
  s03: 8.0,                 // desk-level low angle: shake, stretch, sneeze, look
  s04: 13.0,                // studio wide at night (lamp): the dragon sets off up the sheet
  s04b: 15.0,               // side view two-shot: the dragon tiptoes past the sleeping painter's face, steps on the fingers, the snort
  s04c: 17.4,               // studio wide again: it hurries on to the painting
  s05a: 19.0,               // close-up: the dragon looks down at the village, worried
  s05: 20.5,                // push into the painting: the drought, the colophon
  s06: 25.0,                // insert incense → close-up: eye to the village, the breath, the dive
  s07: 30.0,                // inside: travelling along the scroll, foreground pines passing
  s07b: 33.5,               // close-up in flight: wind in the whiskers, eyes ahead
  s07c: 35.5,               // high wide: the handscroll pan, the dragon small over the mist
  s08: beatT('into', 10),   // 38.333 dry river tracking, the boat
  s09: beatT('into', 17),   // 44.167 tilt up the pine cliff
  s10: 50.0,                // insert incense half
  s11: beatT('cloud', 5),   // 53.125 the summit wide: arrival
  s11l: beatT('cloud', 7),  // 54.375 medium two-shot: lands, looks up
  s11m: beatT('cloud', 10), // 56.25 the tap; close-up of the cloud's face: mumble, bubble pops
  s11n: beatT('cloud', 12), // 57.5 reaction close-up: puzzled dragon
  s11o: beatT('cloud', 13), // 58.125 medium: bite and tug
  s11p: beatT('cloud', 17), // 60.625 wide: yank, flung, lands on its head
  s11q: beatT('cloud', 20), // 62.5 medium: walks back, puffs up, inhales
  s11r: beatT('cloud', 23), // 64.375 close-up: the roar that squeaks
  s11s: beatT('cloud', 25), // 65.625 close-up cloud: one eye opens
  s11t: beatT('cloud', 26), // 66.25 wide: the gust, blown off
  s11u: beatT('cloud', 29), // 68.125 medium: climbs back, hovers, pants, looks down
  s11b: beatT('cloud', 31), // 69.375 cut-in: the child's bowl
  s11c: beatT('cloud', 33), // 70.625 close-up: eye up to the cloud, the brow settles, rises
  s12: 75.0,                // silence: high wide above the cloud
  s12b: 77.5,               // close-up: looks back at the village, a breath, a small nod
  s12c: 80.5,               // medium: curls into the drop
  s13: 82.0,                // the dive stroke
  s13b: 82.5,               // inside the cloud: the body unravels into ink threads that become the first drops
  s14: 86.0,                // close on the cloud: bloom, wake, thunder
  s15: 92.0,                // rain: tilt down to the village
  s16: 104.0,               // insert: the red drop lands in the inkstone
  s16b: 105.5,              // dawn: studio wide, the room pales
  s16c: 107.5,              // side view: the painter stirs and lifts the head
  s16d: 110.0,              // close: the painter's face wakes, looks at the painting
  s17: 112.0,               // insert: wet painting, fingertip
  s18: 118.0,               // the painter writes the title, seal
  s19: 126.0,               // the inkstone: a small dragon
  end: DUR,
};
export const shotAt = t => { let k = 's01'; for (const [n, s] of Object.entries(SHOT)) if (n !== 'end' && t >= s) k = n; return k; };
export const shotEnd = k => { const ks = Object.keys(SHOT), i = ks.indexOf(k); return SHOT[ks[i + 1]]; };

// Key actions (hits), all on the grid or on whole frames
export const HIT = {
  dropFall: 3.0, dropLand: F(86), bloom: F(88), tailCurl: 4.5, headLift: 6.0, eyeOpen: 7.0,
  shake: 8.5, stretch: 10.5, sneeze: F(271), lookAround: 12.0,
  snort: 16.5, tiptoe0: 15.0, colophon: 20.5,
  ashFlake1: F(629), eyeToVillage: 27.0, inhale: 28.0, dive: F(706),             // 26.208, 29.417
  ripple: 30.0, ridgePass: 34.0,
  boat: 41.0, slow: 42.5, cliffDrum: 46.0, snoreJ: beatT('into', 22),            // 48.333
  ashFlake2: 51.0, snore2: 52.0,
  land: beatT('cloud', 7), throat: beatT('cloud', 9), tap: beatT('cloud', 10), mumble: beatT('cloud', 11), roll: beatT('cloud', 12),
  bite: beatT('cloud', 13), tug0: beatT('cloud', 14), yank: beatT('cloud', 17), flung: beatT('cloud', 18), landHead: beatT('cloud', 19),
  puff: beatT('cloud', 20), inhale2: beatT('cloud', 22), roar: beatT('cloud', 23), cloudEye: beatT('cloud', 25), gust: beatT('cloud', 26),
  blownOff: beatT('cloud', 27), climbBack: beatT('cloud', 29), eyeUp: beatT('cloud', 33), browSettle: beatT('cloud', 36), rise: beatT('cloud', 37),
  drip2: 78.0, lookBack: 77.8, breath: 79.0, nod: 80.0, lastNote: 81.3, curl: 80.5,
  diveStroke: 82.0, rollStart: F(1973), bloomIn: 86.0, wake: beatT('dive', 11), lookBelly: beatT('dive', 14), thunder: beatT('dive', 16), firstDrops: beatT('dive', 18),
  rainWide: 92.0, pinesDrip: 94.0, riverFill: beatT('rain', 8), boatFloat: beatT('rain', 11), bowlFill: beatT('rain', 12), drink: beatT('rain', 14), dance: beatT('rain', 15), redDrop: beatT('rain', 22),
  plip: 104.0, brighten: 106.0, stir: 107.5, headUp: 109.0, lookPainting: 110.5,
  touch: 114.0, eyeInkstone: 116.0,
  brushUp: 118.0, dip: F(2851), write0: 119.5, write1: 123.5, sealPress: 125.0,
  inkPush: 126.0, eyeOpen2: 128.0, eyeClose2: 129.5, snore3: 130.0, dryOut: 130.5,
};

// Title strokes: 墨龙借雨 written 119.5–123.5, one character per second, each stroke on a guqin pluck (filled in by glyph.js at init)
export const WRITE = { t0: 119.5, t1: 123.5 };

// Inscriptions (subtitles): id, text, t0, t1, placement hint (shot decides the exact spot)
export const SUBS = [
  { id: 'L1', text: '家山久旱，盼雨。', t0: 20.5, t1: 25.0, kind: 'colophon' },
  { id: 'L2', text: '香尽之前，须借得雨来。', t0: 25.5, t1: 29.4 },
  { id: 'L3', text: '云不肯醒。', t0: 71.0, t1: 75.0 },
  { id: 'L4', text: '借不来，便自己做雨。', t0: 76.0, t1: 81.5 },
  { id: 'L5', text: '雨来了。', t0: 97.0, t1: 101.5 },
  { id: 'L6', text: '墨龙借雨', t0: 119.5, t1: 126.0, kind: 'title' },
  { id: 'L7', text: '墨还在砚里。', t0: 128.0, t1: 131.5 },
];

// Literal silences: the whole bus at zero
export const SILENCE = [[75.0, 81.2], [130.0, 132.0]];
