// Export timeline.js → timeline.json (sections, hit times, banners, shots) for score.py, mix.py, cuecheck.py and subs.py
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const TL = await import(path.join(here, '..', 'timeline.js'));
const out = { dur: TL.DUR, secs: TL.SECS.map(s => ({ id: s.id, name: s.name, t: s.t, bpm: s.bpm, beats: s.beats, beat: s.beat, dur: s.dur })), hits: TL.T, banners: TL.BANNERS, shots: TL.SHOTS, title: TL.TITLE, end: TL.END };
fs.writeFileSync(path.join(here, '..', 'timeline.json'), JSON.stringify(out, null, 1));
console.log('timeline.json', 'DUR', TL.DUR, 'sections', TL.SECS.map(s => `${s.id}@${s.t.toFixed(2)}`).join(' '));
