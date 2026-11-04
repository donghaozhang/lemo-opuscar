// timeline.js → timeline.json (sections with times, hits) for score.py, mix.py and cuecheck.py
import fs from 'fs'; import { createRequire } from 'module';
const T = createRequire(import.meta.url)('./timeline.js');
fs.writeFileSync('timeline.json', JSON.stringify({ secs: T.SECS, dur: T.DUR, hits: T.HT }, null, 1));
console.log('timeline.json', T.DUR, 's,', Object.keys(T.HT).length, 'hits');
