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
