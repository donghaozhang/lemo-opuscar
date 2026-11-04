// Intertitle cards. level: 0 = one heavy rule (a shout, text shakes), 1 = double rule + stepped corners + fans
// (narration), 2 = + vines and small flowers (tender). CJK in Noto Serif SC; Latin in Playfair Display SC / Old Standard TT.
export const ZH = 'Noto Serif SC';
export const CARDS = {
  GOAL:  { level: 1, seed: 3, lines: [{ text: '天亮之前，', font: ZH, size: 96, weight: 700 }, { text: '全部译完。', font: ZH, size: 96, weight: 700 }], gap: 1.45 },
  SHOUT: { level: 0, seed: 5, shake: 1.6, lines: [{ text: '硝酸胶片——', font: ZH, size: 104, weight: 900 }, { text: '一点就着！', font: ZH, size: 104, weight: 900 }], gap: 1.42 },
  LAST:  { level: 2, seed: 7, lines: [{ text: '您刚才看的，', font: ZH, size: 84, weight: 700 }, { text: '就是最后一卷。', font: ZH, size: 84, weight: 700 }], gap: 1.55 },
  END:   { level: 2, seed: 9, lines: [{ text: '完', font: ZH, size: 210, weight: 900 }, { text: 'THE END', font: 'Playfair Display SC', size: 50, weight: 700, spacing: 14 }], gap: 1.3 },
};
// The title card (drawn by film.js with the blind gag)
export const TITLE_EN = [{ text: 'THE NIGHT TRANSLATOR', font: 'Playfair Display SC', size: 86, weight: 900, spacing: 4 },
  { text: 'a Photoplay in One Reel', font: 'Old Standard TT', size: 46, italic: true }];
export const TITLE_ZH = [{ text: '《深夜翻译官》', font: ZH, size: 138, weight: 900 },
  { text: '一卷默片', font: ZH, size: 50, weight: 700, spacing: 18 }];
// The returned page (insert)
export const PAGE_EN = 'Break a leg!';
export const PAGE_BAD = '摔断一条腿！';
export const PAGE_FIX = '祝你演出顺利！';
// Props lettering
export const PROPS = { seal: '译毕', bucket: '消防', todo: '待译', done: '已译', can: 'No. 1000', archive: '片库' };

// Subtitles (.srt) = the cards, as they appear on screen
export const SUBS = [
  ['titleZh', '《深夜翻译官》'],
  ['GOAL', '天亮之前，全部译完。'],
  ['pageEn', 'Break a leg!'],
  ['pageBad', '摔断一条腿！'],
  ['pageFix', '祝你演出顺利！'],
  ['SHOUT', '硝酸胶片——一点就着！'],
  ['LAST', '您刚才看的，就是最后一卷。'],
  ['END', '完'],
];
