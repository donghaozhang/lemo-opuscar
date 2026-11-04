# STATUS — 年兽来吃年夜饭 (films/nian-dinner)

Brief: CLOUD-BRIEF.md, taken whole. Style Red Paper-cut, Simplified Chinese, ~144 s, 1920×1080 @ 24 fps, no voice-over,
folk score (erhu, dizi, suona, zheng, pipa, woodblock, drums, gongs), foley from events, −14 LUFS. Nobody to ask: decisions in TREATMENT.md.

Environment: Node 22, ffmpeg 7+ static build installed to /usr/local/bin (system 6.1 was too old), Python 3.13 venv with numba,
sample libraries karoryfer + vcsl + vsco2ce fetched.

2026-11-04 10:14Z  treatment written (TREATMENT.md), setup done
2026-11-04 10:52Z  engine, characters, sets, all 43 shots written; model sheets, expression sheet and style frames in stills/
2026-11-04 11:03Z  first full render (v1) finished (exit=0)
2026-11-04 11:15Z  score, foley mix, cue check, srt; first full render muxed (v1); review pass 1 done (stills/review1_sheet1-4.jpg), fixes applied
2026-11-04 11:30Z  render v2 (after review pass 1) finished (exit=0)
2026-11-04 11:47Z  review pass 2 done (stills/review2_sheet1-4.jpg, review2_strips.jpg): folded-sheet compositing fix, bigger sneeze; final render v3 started
2026-11-04 11:57Z  final render (v3, after review pass 2) finished (exit=0)
2026-11-04 12:12Z  final render (v4, 147.75 s, credits fix) finished (exit=0)
2026-11-04 12:28Z  final render (v5, end-shot camera fix) finished (exit=0)
2026-11-04 12:35Z  final render v5 muxed; all checks OK (−14.0 LUFS / −1.3 dBTP, no black frames, readcheck OK, CJK glyphs OK); delivered to deliveries/nian-dinner/
