import { W, H, PAL, TX, buildTextures } from './print.js';
import { testSheet } from './sheets_test.js';
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const QS = new URLSearchParams(location.search);
await document.fonts.load('400 40px Brush', '江户猫追鱼记'); await document.fonts.load('600 40px Serif', '江户猫追鱼记');
buildTextures();
window.DUR = 1;
window.render = t => testSheet(ctx, QS.get('test') || 'model', t);
window.READY = true;
