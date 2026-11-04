// The single source of truth: music sections, beat grid, shots. Exported to events.json for the score, mix and checks.
export const SECS = [
  { id: 'A', name: 'dawn', t: 0, bpm: 90, beats: 44 },
  { id: 'B', name: 'kite', t: 0, bpm: 90, beats: 14 },
  { id: 'C', name: 'chase', t: 0, bpm: 132, beats: 85 },
  { id: 'C2', name: 'pass', t: 0, bpm: 144, beats: 30 },
  { id: 'D', name: 'wave', t: 0, bpm: 60, beats: 23 },
  { id: 'E', name: 'home', t: 0, bpm: 66, beats: 35 },
];
{ let t = 0; for (const s of SECS) { s.t = +t.toFixed(4); s.b = 60 / s.bpm; t += s.beats * s.b; } }
export const SEC = Object.fromEntries(SECS.map(s => [s.id, s]));
export const beat = (id, n) => SEC[id].t + n * SEC[id].b;
// shots: [id, section, beats, framing, note]
const LIST = [
  ['s01', 'A', 4, 'I', 'two fish, the paw'],
  ['s02', 'A', 8, 'W', 'dawn bridge, title'],
  ['s03', 'A', 4, 'M', 'under the bridge: cat + kitten'],
  ['s04', 'A', 3, 'C', 'kitten mews'],
  ['s05', 'A', 4, 'C', 'cat determined'],
  ['s06', 'A', 6, 'F', 'stall: sneak in'],
  ['s07', 'A', 3, 'C', 'yawn'],
  ['s08', 'A', 4, 'I', 'the hook'],
  ['s09', 'A', 3, 'M', 'freeze, he turns'],
  ['s10', 'A', 3, 'C', 'double take'],
  ['s11', 'A', 2, 'M', 'dash'],
  ['s12', 'B', 4, 'F', 'proud trot, shadow'],
  ['s13', 'B', 2, 'I', 'talons'],
  ['s14', 'B', 3, 'M', 'snatch'],
  ['s15', 'B', 3, 'C', 'shock → fury'],
  ['s16', 'B', 2, 'W', 'the chase begins'],
  ['s17', 'C', 4, 'S', 'slide to rain'],
  ['s18', 'C', 9, 'W', 'rain bridge'],
  ['s19', 'C', 4, 'M', 'umbrella slalom'],
  ['s20', 'C', 5, 'M', 'umbrella on his head'],
  ['s21', 'C', 4, 'C', 'wet shake'],
  ['s22', 'C', 4, 'S', 'slide to snow'],
  ['s23', 'C', 9, 'W', 'snow temple tilt'],
  ['s24', 'C', 4, 'C', 'sly'],
  ['s25', 'C', 5, 'M', 'pounce, slide, bell'],
  ['s26', 'C', 4, 'M', 'snowman'],
  ['s27', 'C', 3, 'I', 'kite eye'],
  ['s28', 'C', 3, 'S', 'slide to fields'],
  ['s29', 'C', 9, 'W', 'fields + Fuji'],
  ['s30', 'C', 4, 'M', 'through the rice'],
  ['s31', 'C', 4, 'M', 'paddy splash'],
  ['s32', 'C', 4, 'C', 'Fuji match'],
  ['s33', 'C', 3, 'C', 'panting'],
  ['s34', 'C', 3, 'S', 'slide to pass'],
  ['s35', 'C2', 10, 'W', 'pass tilt'],
  ['s36', 'C2', 4, 'M', 'pine climb'],
  ['s37', 'C2', 4, 'M', 'crawl'],
  ['s38', 'C2', 4, 'C', 'exhausted → agape'],
  ['s39', 'C2', 8, 'S', 'summit → sea'],
  ['s40', 'D', 4, 'W', 'the sea'],
  ['s41', 'D', 2, 'F', 'onto the boat'],
  ['s42', 'D', 2, 'I', 'claws open'],
  ['s43', 'D', 3, 'M', 'up the wave'],
  ['s44', 'D', 4, 'C', 'awe (silence)'],
  ['s45', 'D', 4, 'W', 'the catch above the border'],
  ['s46', 'D', 2, 'W', 'back onto the boat'],
  ['s47', 'D', 2, 'S', 'scroll rewinds'],
  ['s48', 'E', 5, 'W', 'dusk impression'],
  ['s49', 'E', 4, 'M', 'home with the fish'],
  ['s50', 'E', 4, 'C', 'kitten eats'],
  ['s51', 'E', 4, 'M', 'he looks down'],
  ['s52', 'E', 4, 'C', 'his soft smile'],
  ['s53', 'E', 3, 'I', 'the second fish'],
  ['s54', 'E', 3, 'C', 'surprised, slow blink'],
  ['s55', 'E', 4, 'W', 'dusk wide'],
  ['s56', 'E', 4, 'W', 'blocks lift: key line and seal'],
];
export const SHOTS = []; {
  const pos = {}; for (const s of SECS) pos[s.id] = 0;
  for (const [id, sec, beats, fr, note] of LIST) { const t0 = beat(sec, pos[sec]); pos[sec] += beats; SHOTS.push({ id, sec, b0: pos[sec] - beats, beats, t0: +t0.toFixed(4), t1: +beat(sec, pos[sec]).toFixed(4), fr, note }); }
  for (const s of SECS) if (pos[s.id] !== s.beats) throw new Error(`section ${s.id}: shots use ${pos[s.id]} beats, section has ${s.beats}`);
}
export const SH = Object.fromEntries(SHOTS.map(s => [s.id, s]));
export const DUR = +(SECS.at(-1).t + SECS.at(-1).beats * SECS.at(-1).b).toFixed(4);
export const q8 = t => Math.floor(t * 8 + 1e-6) / 8;
export const q12 = t => Math.floor(t * 12 + 1e-6) / 12;
// hit points that the music must land on (section, beat)
export const HIT = {
  paw: SH.s01.t0 + 1.0, hook: SH.s08.t0 + 1.4, take: SH.s10.t0 + SEC.A.b, shout: SH.s10.t0 + SEC.A.b * 1.5,
  stop: SH.s12.t0 + SEC.B.b * 2, snatch: SH.s13.t0 + SEC.B.b * .5, fury: SH.s15.t0 + SEC.B.b,
  umbrella: SH.s20.t0 + SEC.C.b * 2, bell: SH.s25.t0 + SEC.C.b * 3, snowdump: SH.s26.t0 + SEC.C.b, splash: SH.s31.t0 + SEC.C.b * 2,
  silence: SH.s44.t0 + 1, catch: SH.s45.t0 + 2, crash: SH.s46.t0, rewind: SH.s47.t0,
  gift: SH.s53.t0 + SEC.E.b, blink: SH.s54.t0 + SEC.E.b * 2, end: SH.s56.t0,
};
