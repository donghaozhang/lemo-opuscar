# 《中秋的灯》 The Mid-Autumn Lantern

**The film.** On Mid-Autumn night in a fishing village on a rocky coast, a girl, A-Yue, cuts a red paper rabbit lantern for her
father, a fisherman due home for the festival; three mooncakes wait in a box, and an old lighthouse stands dark on the headland.
Fog rolls in and swallows the moon; the radio says the boats cannot find the harbour mouth. Her mother runs to the pier;
A-Yue carries her tiny lantern up the cliff and sets it in the dead lamp-room's window, where it is far too small, and she sits
and cries. Then a click below: the villagers have followed her with their festival lanterns, and they line the cliff path and the
gallery until a chain of light burns through the fog. Her father sees the line and steers home; the moon returns; the family shares
the three mooncakes under it. The last shot pulls out of the lamp to a table in a dark room, with a faded old rabbit lantern beside it.
Paper-cut Lightbox style (纸雕灯影), 141.5 s, 1920×1080, 24 fps, Simplified Chinese on screen, no voice-over.

**How it was made.** Everything is drawn in code (`films/moon-lanterns/` on this branch; one command, `build.sh`, rebuilds it):
a Canvas2D compositor stacks cut-paper sheets in a shallow box with a warm backlight (pulp mottle, per-layer translucency),
soft cast shadows from each sheet onto the next, per-layer depth of field and bloom; the figures are jointed silhouettes with cut
faces (eyes with paper pupils, lids, brows, mouth) whose expressions are swapped on a blink. One timeline (`src/timeline.mjs`,
five tempos) drives the 33 shots, the subtitles, the score and the Foley. The score is original, played on sampled instruments
(Salamander piano as a felt piano; VSCO 2 CE and VCSL strings, harp, hand chimes, a small gong) and modelled or synthesized ones
(music box, pipa, guqin, a bamboo flute); the Foley and beds are procedural. Fonts: Ma Shan Zheng and Noto Serif SC (OFL).
Treatment, model/expression sheets, contact sheets and credits: `films/moon-lanterns/` (`TREATMENT.md`, `stills/`, `CREDITS`).

**Files.** `final.mp4` (1080p, H.264, 46.7 MB), `final-720p.mp4` (1280×720, 11.9 MB, for phones), `poster.jpg`, `subtitles.srt`
(the radio's two lines and the closing line; paper text on screen is not subtitled).

**Checks run and their results.**

| Check | Result |
|---|---|
| Two full renders, two complete review passes on 1 fps contact sheets (`stills/contact_pass1.jpg`, `contact_pass2.jpg`) and 0.2 s strips of the key actions (`stills/strips_pass1.jpg`) | pass 1 fixed the fog-curtain streak, the end subtitle's ground, the chain's light, the ear gag's framing; pass 2 clean |
| Cue check (`tools/cuecheck.py`): every visual hit vs. the sound placed for it, and vs. the page's exported events | 84 cues, worst offset 0.0 ms; events.json matches the timeline |
| Reading time (`core/render/readcheck.mjs`, CJK 4.5 cps + 1.5 s) | title 4.48 s held (2.39 s needed), caption 4.32 s held (3.34 s needed); subtitles each ≥ 3.9 s |
| Loudness (`core/render/mux.sh` two-pass loudnorm; `ffmpeg ebur128`) | final.mp4 −14.1 LUFS, true peak −1.2 dBTP, LRA 11.8 LU; final-720p.mp4 −14.1 LUFS, true peak −2.2 dBTP |
| Black frames (`ffmpeg blackdetect`, 0.2 s, 98 %) | only the fade-in (0–0.33 s) and the fade-out (140.7–141.5 s) |
| CJK glyphs (`tools/glyphcheck.py`) | all 54 on-screen characters have glyphs (the middle dot of the caption comes from Noto Serif SC as the per-glyph fallback); no .notdef boxes seen on the contact sheets |
| Subtitle ground (`tools/subcheck.py`) | 98.6 %, 98.8 %, 98.7 % dark under the three cues (the closing cue sits on a faint band under the box) |
| Sign-off grep (`lemo ?lab`, `opus 5\.5`) | nothing in the project folder; no watermark |
| Durations | 141.5 s picture and audio; format 1920×1080 at 24 fps |

The owner is responsible for the materials used in the film; every third-party asset and its licence is listed in `films/moon-lanterns/CREDITS`.
