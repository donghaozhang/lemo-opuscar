#!/bin/sh
# Rebuild 《最后一场皮影戏》 from scratch. Clone mode: sh films/last-shadow-play/build.sh (from anywhere). Skill mode: put LIB=<library path> at the top.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$(cd "$HERE/../.." && pwd)}
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
cd "$LIB"
PY=.venv/bin/python
node "$HERE/tools/timeline.mjs"                                                   # 1. timeline → timeline.json (score, foley, checks)
node core/render/events.mjs "$HERE"                                               # 2. picture events → events.json
$PY "$HERE/music/score.py"                                                        # 3. original gong-and-drum score (core/audio/sampler + pluck) → music/score.wav
$PY "$HERE/mix.py"                                                                # 4. procedural foley + ambience + music ducking → out/mix.wav
$PY "$HERE/tools/cuecheck.py"                                                     # 5. every cue on the grid
$PY "$HERE/tools/cues.py" && $PY core/render/srt.py "$HERE/out/cues.json" "$HERE/last-shadow-play.srt"   # 6. subtitles
node core/render/video.mjs "$HERE" --fps 24 --workers 3 --out "$HERE/out/video.mp4"   # 7. frame-by-frame render (3360 frames)
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/last-shadow-play.mp4" 24 2      # 8. mux, two-pass loudnorm −14 LUFS, grain 2
node core/render/still.mjs "$HERE" 0 --q 'test=poster' --prefix poster --out "$HERE/out/st" && cp "$HERE/out/st/poster0.jpg" "$HERE/poster.jpg"
