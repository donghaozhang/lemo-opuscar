# STATUS — 《墨龙借雨》 ink-dragon (cloud/film-2-fable)

Brief (from CLOUD-BRIEF.md): Chinese Ink Wash, 132 s, 1920×1080 24 fps, Simplified Chinese text, no voice, guqin-led
score, Foley for every action, −14 LUFS. Everything drawn in code; fonts from @fontsource (OFL). Deliver to
deliveries/ink-dragon/.

Environment: Node 22, Python 3.13 venv, ffmpeg 8 (static build on PATH; apt had 6.1), headless Chromium with WebGL2 on
SwiftShader (software), 4 cores. Sample libraries vsco2ce + vcsl fetched. Music tier (numba) installed.

| UTC | step | note |
|---|---|---|
| 07:53 | brief + treatment | TREATMENT.md written; fonts installed (ma-shan-zheng, noto-serif-sc, zhi-mang-xing) |
| 08:38 | engine + shots | dragon rig, studio, painting world, cloud, calligraphy, all 19 shots render (~1 s/frame); model sheet and style frames in stills/ |
| 08:41 | score + foley + mix | score.wav (guqin/xiao/drums), 234 events → mix.wav; cue check 44 cues, 41 within 40 ms, 3 soft slides ≤70 ms; first full render started |
| 08:52 | render 1 | frames 540 / 3168 |
| 09:02 | render 1 | frames 1260 / 3168 |
| 09:12 | render 1 | frames 1860 / 3168 |
| 09:22 | render 1 | frames 2460 / 3168 |
| 09:50 | review pass 1 + redesign | render 1 reviewed (6 sheets in stills/r1_sheet*.jpg): loudness fixed to −14.0 LUFS / −3.3 dBTP, incense insert redrawn, cloud face kept readable in the bloom; dragon rig redesigned per producer notes, model sheet + faces + style frames re-rendered |
| 10:03 | producer notes folded in | coverage broken into 41 shots (close-ups at every beat), paper-white eyes, lamp-lit night and warm dawn, side-view painter, the sacrifice beat (look back, breath, nod, one guqin note) and the body unravelling into rain threads; render 2 restarted |
| 11:07 | review pass 2 | render 2 reviewed (stills/r2_sheet*.jpg): coverage and close-ups read; readcheck OK (7/7), −14.0 LUFS / −3.3 dBTP, no black frames; fix round: pupil size, painter's back; final render next |
| 11:18 | final render | frames 540 / 3168 |
| 11:28 | final render | frames 1140 / 3168 |
| 11:38 | final render | frames 1800 / 3168 |
| 11:48 | final render | frames 2340 / 3168 |
| 11:58 | final render | frames 2880 / 3168 |
| 12:12 | final + delivery | final render muxed: −14.0 LUFS, TP −3.3 dBTP, no black frames; readcheck 7/7, cue check 45/45 within 75 ms, 31/31 glyphs; deliveries/ink-dragon: final.mp4 65 MB, final-720p.mp4 24 MB, poster, srt, README |
