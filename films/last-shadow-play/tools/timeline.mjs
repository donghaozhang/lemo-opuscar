// Export the timeline (sections, hits, shots, placards, plaques) to timeline.json for the Python tools
import { SECS, HIT, SHOTS, PLACARDS, PLAQUES, DUR } from '../timeline.js';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
fs.writeFileSync(path.join(here, '..', 'timeline.json'), JSON.stringify({ dur: DUR, secs: SECS, hit: HIT, shots: SHOTS, placards: PLACARDS, plaques: PLAQUES }, null, 1));
console.log('timeline.json', Object.keys(HIT).length, 'hits', SHOTS.length, 'shots');
