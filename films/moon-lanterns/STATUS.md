# 《中秋的灯》 production status

## Brief (summed up from CLOUD-BRIEF.md)

- Style: Paper-cut Lightbox (`styles/paper-lantern`), all invariants of its STYLE.md kept.
- Topic: Mid-Autumn night in a fishing village on a rocky coast. A-Yue (阿月) cuts a paper rabbit lantern for her father, a fisherman due home; a mooncake box with three cakes (set-up); an old dark lighthouse on the headland (set-up). Fog swallows the moon, the radio says the boats cannot find the harbour mouth, the mother runs to the pier, A-Yue carries her tiny lantern up to the dark lighthouse, it is far too small, she cries (the low point). Villagers follow with festival lanterns and line the cliff path and the gallery until a chain of light burns through the fog (the showpiece). Her father sees it and steers home; the moon returns; the family shares the mooncakes; last shot: the lit lamp on a table in a dark room.
- Format: 1920×1080, 24 fps, 100–150 s. Target 140 s.
- Language: Simplified Chinese on every paper strip and in the .srt; Ma Shan Zheng (OFL) for titles, Noto Serif SC for subtitles. No voice-over, no TTS (none available on this VM).
- Sound: original score in the style's palette (felt piano, music box, guzheng/pipa, bamboo flute, soft strings; no drum kit), Foley of paper and light plus sea, wind, foghorn, radio crackle, boat engine. Mix −14 LUFS, true peak ≤ −1 dBTP.
- No storyboard review; no owner material; decide everything, write it into TREATMENT.md, never stop.
- Git: push every step to `cloud/film-9-lantern`; STATUS.md lines every ~10 min during long renders; deliver to `deliveries/moon-lanterns/`.

## Environment

- Ubuntu VM, 4 CPUs, no GPU: WebGL2 runs on SwiftShader. ffmpeg 6.1 (system) was too old → static ffmpeg 9.0.2 (imageio-ffmpeg wheel) installed to /usr/local/bin/ffmpeg.
- Core tier installed; music tier installed; sample libraries salamander, vsco2ce, vcsl fetched.
- Fonts in `fonts/`: MaShanZheng-Regular.ttf, NotoSerifSC[wght].ttf (both OFL, from github.com/google/fonts).

## Log (UTC)

- 2026-11-04 11:50 brief read, toolchain set up.
- 2026-11-04 12:27 engine (Canvas2D compositor), motifs, rig; model, expression and action sheets rendered to stills/
- 2026-11-04 13:02 all 33 shots built and checked on stills; staging fixes; next: score and Foley (mix.py)
- 2026-11-04 13:17 score, Foley and mix written (mix.py, 84 cues at 0 ms); first full render started (4 workers, 3396 frames)
- 2026-11-04 13:27 full render running: frames 600/3396 (per-worker progress, logged every 60 frames)
- 2026-11-04 13:37 full render running: frames 1200/3396 (per-worker progress, logged every 60 frames)
- 2026-11-04 13:47 full render running: frames 1620/3396 (per-worker progress, logged every 60 frames)
- 2026-11-04 13:57 full render running: frames 1860/3396 (per-worker progress, logged every 60 frames)
