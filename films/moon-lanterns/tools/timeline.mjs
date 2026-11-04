// Writes timeline.json (sections, hits, shots, cues) for mix.py and the checks, and cues.json for core/render/srt.py.
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const HERE = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const T = await import(path.join(HERE, 'src', 'timeline.mjs'));
const out = { DUR: T.DUR, SECS: T.SECS, HIT: T.HIT, SHOTS: T.SHOTS, DISSOLVE: T.DISSOLVE, CUES: T.CUES, STRIPS: T.STRIPS };
fs.writeFileSync(path.join(HERE, 'timeline.json'), JSON.stringify(out, null, 1));
fs.writeFileSync(path.join(HERE, 'cues.json'), JSON.stringify(T.CUES.map(c => ({ t0: c.t0, t1: c.t1, text: c.text })), null, 1));
console.log('DUR', T.DUR, 'sections', T.SECS.map(s => `${s.id}@${s.t.toFixed(3)}`).join(' '), 'shots', T.SHOTS.length);
