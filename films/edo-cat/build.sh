#!/bin/sh
# Rebuild 江户猫追鱼记 from scratch: sh films/edo-cat/build.sh  (from any directory; needs Node 20+, ffmpeg 7+, the library .venv)
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$(cd "$HERE/../.." && pwd)}
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
cd "$LIB"
PY="$LIB/.venv/bin/python"
node core/render/events.mjs "$HERE"                                   # timeline → events.json (sections, hits, shots, foley, subtitles)
"$PY" "$HERE/music/score.py"                                          # original score → music/score.wav
"$PY" "$HERE/mix.py"                                                  # foley + ambience + score → mix.wav
"$PY" "$HERE/subs.py" && "$PY" core/render/srt.py "$HERE/out/subs.json" "$HERE/edo-cat.srt"
node core/render/video.mjs "$HERE" --fps 24 --workers 3 --out "$HERE/out/video.mp4"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/mix.wav" "$HERE/edo-cat.mp4" 24 0   # −14 LUFS, grain 0 (the paper is the grain)
