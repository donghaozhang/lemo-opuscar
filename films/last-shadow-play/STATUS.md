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
