# 《愚公移山》 — The Old Man Who Moved the Mountains

A 145-second woodcut novel (Woodcut Print style, 1920×1080, 24 fps, no voice). Ninety-year-old Yu Gong's door faces a wall of rock; every trip to market is a long detour cut by the knife across a map. He sets his family and a gap-toothed seven-year-old with a tiny basket to carry the two mountains to the sea, a year per round trip, while the same plate is re-cut through four seasons and the notch they dig turns out to be a scratch. The Wise Old Man laughs and plucks one blade of grass. The answer comes in a held close-up over one low string: sons, grandsons, an endless line of carriers peeled over the old man's face. The mountain's stone face takes fright, Heaven's light breaks, a true silence falls, and two giants rise. Then the carver's own knife clears the mountains from the block, and the film's only colour, sunrise red, appears on the open road south. The scoffer is left speechless, and the boy runs down the new road with his one pebble. The captions are short lines from 《列子·汤问》, letterpress in the paper margin. Everything was made in code. Every plate is carved stroke by stroke by a canvas engine and printed through a WebGL ink-and-paper shader. The cast is a carved 2-D rig, with three-quarter close-up faces whose eyes and brows act. The score was written to the cue map: VSCO 2 CE and VCSL low strings, timpani, tam-tam, woodblock and frame drum (CC0), plus a synthesised log drum, struck metal and folk drone. The Foley (knife, picks, baskets, earth, sea, wind, giants) is synthesised and placed from the picture's event list. Fonts: Noto Serif SC (OFL).

**Checks on the delivered files:**
- **Loudness:** −14.1 LUFS integrated, true peak −1.1 dBTP (1080p) and −1.3 dBTP (720p).
- **Black frames:** blackdetect (d ≥ 0.5 s, pix_th 0.10) found none. The 1.7 s silence plate is black wood with grain, not a black frame.
- **Cue check:** all 45 cuts sit on their section's beat grid, and all 19 score cues land on their picture hits; worst offset 0.0 ms. The pre-giant silence measures digital silence (−240 dBFS) in the mix. The near-silence before the answer is 18.5 dB below the film's average.
- **Reading time:** readcheck passed 22 of 23 on-screen texts. The one it flags, 操蛇之神闻之，惧其不已也, is on screen for 4.04 s against 4.01 s needed; at its 0.1 s sampling step readcheck measures 4.00 s.
- **CJK glyphs:** all 144 distinct characters are present in the loaded font subsets at both weights.
- **Size:** final.mp4 86 MB (< 95 MB), final-720p.mp4 26 MB (< 28 MB).
- **Reviews:** three full renders with two review passes; the 1 fps contact sheets are in `films/moving-mountains/stills/`.
- **Credits:** no LemoLab credit or watermark anywhere.

Source, treatment, build script and credits are in `films/moving-mountains/`.
