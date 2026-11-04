# 《深夜翻译官》 The Night Translator — v2

A 147-second 1920s-style silent film (1920×1080, 24 fps, Simplified Chinese intertitles, no voice). In a film archive at night, the little tin robot 小译 must translate a thousand English-captioned reels into Chinese before dawn, under the red pen of the tall iron proofreader 老校. Three reels, a western, a romance and a monster picture, each produce a literal translation that 老校 corrects in red brush: 「抓住你的马！」→「别急！」, 「我头在脚跟上！」→「我神魂颠倒！」, 「天上下猫下狗！」→「倾盆大雨！」. The last reel, No. 1000, jams and catches fire, and the film you are watching starts to burn. After a race through the shelves and a catch in the fire bucket, the two robots dry the reel together. 老校 hands over its red pen, and at dawn 小译 stamps 「译毕」 itself.

## What changed from v1

- **Story:** 74 s → 147 s, with clear set-ups and pay-offs.
  - It opens on a cold open: a can rolls into the sleeping robot, then a tilt up a mountain of cans and a double take.
  - Each of the three genre reels has its own translation gag, built as a rule of three: the page bonks 小译, then it ducks, then it catches the page one-handed.
  - A montage of the night with a match cut.
  - A fire set piece: hot potato, a race with a ladder near-miss cross-cut with 老校 fetching the bucket, the silent flight, the catch.
  - A tender teamwork beat: drying the film, the red pen handed over, a pat instead of a bonk.
  - A dawn finale: the seal, the last empty slot (planted in a moonbeam at the start), the lamps coming on row by row, and the closing card 「您刚看的这一卷——正是第一千卷。」
- **Direction:** 13 shots → 58. Establishing wides, mediums, close-ups of faces with background depth of field, inserts of reels, pages and hands, cut-ins, irises, a tilt-up reveal, two tracking moves along the shelves with foreground parallax, a montage, a match cut and a pull-back. Shots run from 0.5 s to 6 s.
- **Animation:** idle breathing, anticipation crouches, squash and stretch, springy follow-through on the antenna and the monocle, eye widening and lids, brow acting.
  - 小译 does a headstand balanced on its antenna bulb.
  - 老校's monocle unfolds, pops and wobbles, and its pen flourishes and points.
- **Look:**
  - Period tinting per sequence: blue for night, then each reel its own tint (amber western, rose romance, green monster).
  - The fire is deliberately untinted and harsh so the red ink stays the only red; tender scenes are sepia and dawn is gold.
  - Lighting: lamp pools, a swinging lamp with moving light, moonbeams, aisle light pools, firelight, dawn beams with dust.
  - Intertitles in several layouts: a dialogue cartouche, a shout card, a tender card, an end card with credits, and three genre reel cards (wood type, script, blackletter).
- **Music and sound:** v1 was a solo piano. v2 is a pit band of 17 instruments (VSCO 2 CE, CC0) with a leitmotif for each robot: 小译's tune for clarinet, and 老校's dotted march for bassoon and cellos, which turns major when it approves. The cues run misterioso, a western pastiche, a romance parody, a comic monster misterioso, a galop, agitato for the fire, a valse lente that combines both themes, and a maestoso finale. A much fuller trap-box effects track, two real silences, and the projector as ambience.
- **Process:** the full film was rendered three times, with two complete review passes in between (`films/night-translator-v2/REVIEW.md`). They fixed 9 problems: the cold-open hook, black gaps, headstand and page-catch coverage, the reach of the catch, the burning-title insert, the aisle lighting, and the pen-handover insert.

## Checks on the delivered files

| Check | Result |
|---|---|
| Cue check (score sync points and cuts on the beat grid) | 134 cues, worst offset 0.0 ms |
| Reading time (`readcheck`, every card, reel card and page text) | 31 / 31 OK |
| Loudness, `final.mp4` | −14.1 LUFS integrated, true peak −1.9 dBTP |
| Loudness, `final-720p.mp4` | −14.2 LUFS integrated, true peak −2.3 dBTP |
| Black frames (`blackdetect`, ≥ 0.1 s) | two, both 0.17 s and planned: the iris opening on the first frames, and the iris between the fire and the tender scene |
| CJK glyphs | every card and page checked in frames from the final master; no missing-glyph boxes |
| No library sign-off | a grep finds no LemoLab sign-off in the project, and the end card was checked |
| `final.mp4` | 1920×1080, 24 fps, 84.9 MB (under 95 MB) |
| `final-720p.mp4` | 1280×720, 24 fps, 26.5 MB (under 28 MB) |

Source, treatment, review log, credits (all fonts OFL, all samples CC0) and a one-command `build.sh` are in `films/night-translator-v2/`.
