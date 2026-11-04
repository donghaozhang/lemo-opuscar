// timeline.js → timeline.json (for the score, the mix and the cue check)
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const D = join(dirname(fileURLToPath(import.meta.url)), '..');
const T = await import(join(D, 'timeline.js'));
writeFileSync(join(D, 'timeline.json'), JSON.stringify({ SEC: T.SEC, HIT: T.HIT, DUR: T.DUR, SHOTS: T.SHOTS, TXT: T.TXT }, null, 1));
console.log('timeline.json', T.DUR, 's');
