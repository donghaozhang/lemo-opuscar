// v2 intertitles. kind: 'narr' (deco double rule), 'say' (dialogue cartouche with speaker), 'shout' (heavy rule, shakes),
// 'tender' (vines), 'end' (完 + credits), and the three genre reel cards (the films' own English titles).
export const ZH = 'Noto Serif SC', BRUSH = 'Ma Shan Zheng';
export const CARDS = {
  SAY:   { kind: 'say', who: '老校', lines: [{ text: '天亮之前——', size: 82 }, { text: '一个字也不许错。', size: 96 }] },
  SHOUT: { kind: 'shout', level: 0, seed: 5, shake: 1.6, lines: [{ text: '硝酸胶片——', font: ZH, size: 104, weight: 900 }, { text: '一点就着！', font: ZH, size: 104, weight: 900 }], gap: 1.42 },
  SAY2:  { kind: 'say', who: '老校', lines: [{ text: '……不错。', size: 120 }] },
  LAST:  { kind: 'tender', level: 2, seed: 7, lines: [{ text: '您刚看的这一卷——', font: ZH, size: 80, weight: 700 }, { text: '正是第一千卷。', font: ZH, size: 92, weight: 700 }], gap: 1.6 },
  END:   { kind: 'end' },
};
export const END_LINES = [{ text: '完', font: ZH, size: 220, weight: 900 }, { text: 'THE END', font: 'Playfair Display SC', size: 46, weight: 700, spacing: 14 },
  { text: '翻译　小译　·　校对　老校', font: ZH, size: 40, weight: 700 }];
export const TITLE_EN = [{ text: 'THE NIGHT TRANSLATOR', font: 'Playfair Display SC', size: 86, weight: 900, spacing: 4 },
  { text: 'a Photoplay in One Reel', font: 'Old Standard TT', size: 46, italic: true }];
export const TITLE_ZH = [{ text: '《深夜翻译官》', font: ZH, size: 138, weight: 900 }, { text: '一卷默片', font: ZH, size: 50, weight: 700, spacing: 18 }];
// the three reels: their own English card, the literal translation, the red correction
export const REELS = {
  WEST: { head: 'Reel 117 · "Six-Gun Sunset" · Title 4', card: ['HOLD YOUR', 'HORSES!'], en: 'Hold your horses!', bad: '抓住你的马！', fix: '别急！' },
  ROMA: { head: 'Reel 512 · "Moonlight Waltz" · Title 9', card: ["I'm head", 'over heels!'], en: "I'm head over heels!", bad: '我头在脚跟上！', fix: '我神魂颠倒！' },
  MONS: { head: 'Reel 864 · "The Thing from the Fog" · Title 2', card: ["It's raining", 'cats and dogs!'], en: "It's raining cats and dogs!", bad: '天上下猫下狗！', fix: '倾盆大雨！' },
};
export const PROPS = { seal: '译毕', bucket: '消防', can: 'No. 1000' };
