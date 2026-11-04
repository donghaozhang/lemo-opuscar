// Export the timeline (sections, shots, hits, subtitles, silences) to timeline.json for the score, the mixer and the checks.
// Run from the library root: node films/ink-dragon/tools/timeline.mjs
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
const here = path.dirname(fileURLToPath(import.meta.url));
const T = await import(path.join(here, '..', 'timeline.js'));
const out = { fps: T.FPS, dur: T.DUR, secs: T.SECS, shot: T.SHOT, hit: T.HIT, subs: T.SUBS, silence: T.SILENCE, write: T.WRITE };
writeFileSync(path.join(here, '..', 'timeline.json'), JSON.stringify(out, null, 1));
// cues for the .srt
writeFileSync(path.join(here, '..', 'cues.json'), JSON.stringify(T.SUBS.map(s => ({ t0: s.t0, t1: s.t1, text: s.text })), null, 1));
console.log('timeline.json, cues.json written');
