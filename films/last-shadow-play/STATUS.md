# STATUS — 最后一场皮影戏

| UTC | step | note |
|---|---|---|
| 10:19 | brief | brief read; setup deps (core); ffmpeg 7 static from GitHub; OFL fonts via npm; headless Chrome renders |
| 10:19 | treatment | TREATMENT.md written: 48 shots, 140 s, cue map, sound table |
| 11:02 | look | engine (carve, compositor, rigs), five puppets, two sets; model sheet, expression sheet, six style frames in stills/; acting and shots drafted for all 48 shots |
| 11:22 | score+mix | score.py (gong-and-drum, banhu, suona once, flute, sanxian), mix.py foley; cuecheck 0 ms; first render running: ~13x60 frames of 3360 |
| 11:26 | render 1 | first full render at 240/1120 of 1120 frames per worker (3 workers); hand-over height and ember fixed for render 2; poster mode added |
| 12:05 | render 1 done | 3360 frames in 44 min; muxed; review pass 1 on contact sheets (stills/contact1_*.jpg): crowd two-shots too dark, walk-off fades to black, mix peaks too hot → fixed; render 2 queued after readcheck |
| 12:06 | review 1 | full-res key frames checked from render 1; entrance crash-zoom reframed (cap was clipped); readcheck running, render 2 queued behind it |
| 12:13 | render 2 | readcheck: three placards and the end plaque too short → extended; score/mix rebuilt; cuecheck 0 ms; render 2 started (3360 frames, 3 workers) |
| 12:23 | render 2 | frames done ≈ 2100 / 3360 |
| 12:34 | render 2 | frames done ≈ 7020 / 3360 |
| 12:44 | render 2 | frames done ≈ 16440 / 3360 |
| 12:54 | render 2 | frames done ≈ 27540 / 3360 |
| 13:03 | render 2 done | muxed: -14.0 LUFS, peak -1.8 dBFS; review pass 2 on stills/contact2_*.jpg: crowd two-shots, entrance, hand-over fixed; walk-off fade still blackdetected → softened; final render 3 next |
| 13:04 | render 2 | frames done ≈ 30780 / 3360 |
| 13:14 | render 2 | frames done ≈ 30780 / 3360 |
| 13:15 | render 3 (final) | frames done ≈ 2100 / 3360 |
| 13:24 | render 2 | frames done ≈ 30780 / 3360 |
| 13:25 | render 3 (final) | frames done ≈ 8160 / 3360 |
| 13:34 | render 2 | frames done ≈ 30780 / 3360 |
| 13:35 | render 3 (final) | frames done ≈ 18060 / 3360 |
| 13:44 | render 2 | frames done ≈ 30780 / 3360 |
| 13:45 | render 3 (final) | frames done ≈ 29700 / 3360 |
| 13:54 | render 2 | frames done ≈ 30780 / 3360 |
| 13:55 | render 3 (final) | frames done ≈ 30780 / 3360 |
| 13:57 | final | render 3 muxed: -14.0 LUFS, TP -1.8 dBTP, blackdetect only the pre-match 0.6 s; deliverables encoded (60.5 MB / 18.0 MB) and committed to deliveries/last-shadow-play/ |
