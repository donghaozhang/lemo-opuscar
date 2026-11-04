// Export timeline.js → timeline.json (sections, shots, events, lines) for the Python side (score, mix, srt, checks)
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const H = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TL = await import(path.join(H, 'timeline.js'));
const out = { DUR: TL.DUR, FPS: TL.FPS, SECS: TL.SECS, SHOTS: TL.SHOTS, T: TL.T, LINES: TL.LINES, TITLE: TL.TITLE };
fs.writeFileSync(path.join(H, 'timeline.json'), JSON.stringify(out, null, 1)); console.log('timeline.json', TL.DUR, 's', TL.SHOTS.length, 'shots');
