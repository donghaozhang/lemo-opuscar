#!/bin/sh
# Rebuild 《墨龙借雨》 from scratch: sh films/ink-dragon/build.sh  (from the library root; or set LIB to the library folder)
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$(cd "$HERE/../.." && pwd)}
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
cd "$LIB"
PY=$LIB/.venv/bin/python
echo "0/8 fonts (OFL, from npm)"; (cd "$HERE" && npm install --no-audit --no-fund --loglevel=error)
echo "1/8 timeline"; node "$HERE/tools/timeline.mjs"
echo "2/8 score"; $PY "$HERE/music/score.py"
echo "3/8 cue check"; $PY "$HERE/tools/cuecheck.py" --tol 75
echo "4/8 events + mix"; node core/render/events.mjs "$HERE" && $PY "$HERE/mix.py"
echo "5/8 render 3168 frames"; node core/render/video.mjs "$HERE" --fps 24 --workers 3 --out "$HERE/out/video.mp4"
echo "6/8 mux (−14 LUFS, no grain: the paper is in the shader)"; sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/ink-dragon.mp4" 24 0
echo "7/8 subtitles, poster"; $PY core/render/srt.py "$HERE/cues.json" "$HERE/ink-dragon.srt"
node core/render/still.mjs "$HERE" 100.5 --q poster=1 --out "$HERE/out" --prefix poster_ && cp "$HERE/out/poster_100.5.jpg" "$HERE/poster.jpg"
echo "8/8 checks"; node core/render/readcheck.mjs "$HERE"; node "$HERE/tools/glyphcheck.mjs"
echo done
