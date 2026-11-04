#!/bin/sh
# 《最后一班渡船》 — one-command build: timeline → events → score → mix → frames → mux. Run from anywhere; set LIB in skill mode.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$(cd "$HERE/../.." && pwd)}
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PATH="$HERE/bin:$PATH"; export PATH      # ffmpeg 7+ (here: the imageio-ffmpeg build) ahead of the system's 6.x
PY="$LIB/.venv/bin/python"
cd "$LIB"
mkdir -p "$HERE/out"
node "$HERE/tools/timeline.mjs"
node core/render/events.mjs "$HERE" --out "$HERE/events.json"
$PY "$HERE/tools/cuecheck.py"
$PY "$HERE/tools/cjkcheck.py"
$PY "$HERE/score.py"
$PY "$HERE/mix.py"
$PY "$HERE/tools/srt.py" "$HERE/out/subtitles.srt"
node core/render/video.mjs "$HERE" --fps 24 --workers ${WORKERS:-2} --out "$HERE/out/video.mp4"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/last-ferry.mp4" 24 0
