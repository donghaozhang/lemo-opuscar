# 《年兽来吃年夜饭》 — Red Paper-cut, 147.75 s, 1920×1080 @ 24 fps

**The film.** New Year's Eve in a snowy northern village. Everyone pastes red window flowers and hangs firecrackers to keep the Nian away; 小雪, whose parents are stuck on the mountain road, cuts a folded sheet all evening and leaves a bowl of dumplings outside the gate. The lonely Nian follows the smell down the mountain, sneezes at every window flower, dives into a snowdrift at the first firecracker, eats the whole bowl in one gulp, squashes a dumpling with its paw and makes one the size of a pillow. When the bus is stuck in a drift, the Nian runs up the road, lifts it onto its back and carries it down before midnight; at the gate the villagers light the firecracker string, the music stops, and 小雪 unfolds the paper-cut she has been cutting all film long: the Nian's own face. The fuse is pinched out, the parents step down, the gong strikes twelve, every window flower glows, and the Nian is squeezed in at the table with its giant dumpling. She pastes the cut on the window; from outside, a beast glows among the flowers and the scraps of her scissors fall as snow. No voice-over; four storyteller banners (Simplified Chinese) are burned in and exported as `subtitles.srt`.

**How it was made.** Everything is drawn in code (Canvas 2D) in the library's Red Paper-cut grammar: every piece is red or indigo paper with sawtooth, crescent, swirl and plum cuts, an inset double outline, paper grain, cut edges and paper shadows; characters are jointed cut-outs with swappable face pieces stepped at 12 fps, the camera and weather on ones; night is a light map with warm lantern pools, and the midnight backlight (holes at full light, bloom, rays) is saved for the last twenty seconds. One timeline (`timeline.js`: nine sections, 56–136 bpm, every hit as section + beat) drives the picture, the original score (erhu, dizi, zheng, pipa, an own-synthesis suona, woodblock, frame drum, bass drum, cymbals, gongs; D gong pentatonic), the procedural foley (210 events from the page) and the subtitles. Source and `build.sh` are in `films/nian-dinner/` on the branch; `CREDITS` there lists the fonts (Noto Serif SC, Ma Shan Zheng; OFL) and the CC0 sample libraries (VSCO 2 CE, VCSL, Karoryfer).

**Checks run (final file).**

| Check | Result |
|---|---|
| Loudness / true peak (ffmpeg ebur128 on `final.mp4`) | I = −14.0 LUFS, LRA 11.7 LU, true peak −1.3 dBTP (OK; the mix is pre-normalised to −14 LUFS with a 4× oversampled true-peak limiter at −2.6 dBTP and a 15 kHz low-pass, because the AAC encode overshoots on content above 15 kHz; the mux applies no loudness processing) |
| Black frames (`blackdetect d=0.08 pix_th=0.05`) | none |
| Frames / duration | 3546 frames, 147.750 s, 1920×1080, 24/1 (no decode errors) |
| Cue check (picture hits vs. onsets in the mix, ±40 ms, 24 hits) | 22 of 24 within 40 ms (worst of those 39 ms); the sneeze and the second gulp read +72 / +63 ms against the mix because those foley sounds have a slow build by design (the "hah" before the "choo"); against the score alone all 24 land within 40 ms |
| Reading time (`readcheck.mjs`: title, four banners, end card, credits) | all 7 texts OK (e.g. title needs 3.06 s, gets 4.64 s; the longest banner needs 4.97 s, gets 5.10 s) |
| CJK glyph check (rendered frames at every text time scanned for missing-glyph boxes) | OK at all 6 text times (Noto Serif SC and Ma Shan Zheng self-hosted, no missing-glyph boxes) |
| Review passes | 2 full passes at 1 fps (`stills/review1_sheet1-4.jpg`, `stills/review2_sheet1-4.jpg`) plus 0.2 s strips of ten key actions (`stills/review2_strips.jpg`); fixes after each pass, final render after the second |
| Sign-off grep (`lemo ?lab|opus 5\.5`) | nothing outside the library's own files |
| 720p file | 1280×720, 19.2 MB, same AAC stream as the 1080p file (−14.0 LUFS, −1.3 dBTP) |

Files: `final.mp4` (1080p, 75.7 MB, H.264 CRF 19, AAC 256 kb/s), `final-720p.mp4` (19.2 MB), `poster.jpg`, `subtitles.srt`, this README.
