#!/bin/sh
# One command: 《中秋的灯》 (Paper-cut Lightbox), 141.5 s, 1920×1080, 24 fps
#   sh films/moon-lanterns/build.sh          timeline, picture, mix, master, poster, subtitles
#   sh films/moon-lanterns/build.sh 80 95    only a span (film seconds) → out/cut_80-95.mp4
# Needs the core and music tiers and the sample libraries salamander, vsco2ce, vcsl (see TECHNIQUE.md §1); fonts are in fonts/.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$(cd "$HERE/../.." && pwd)}
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY="$LIB/.venv/bin/python"; FPS=24; WORKERS=${WORKERS:-4}
cd "$LIB"
node "$HERE/tools/timeline.mjs"
"$PY" core/render/srt.py "$HERE/cues.json" "$HERE/moon-lanterns.srt"
if [ -n "$1" ]; then
  A=$1; B=$2; OUT="$HERE/out/cut_${A}-${B}.mp4"
  node core/render/video.mjs "$HERE" --fps $FPS --workers $WORKERS --q "from=$A&to=$B" --out "$HERE/out/cut.mp4"
  "$PY" "$HERE/mix.py" "$A" "$B"
  sh core/render/mux.sh "$HERE/out/cut.mp4" "$HERE/out/mix.wav" "$OUT" $FPS 1
  echo "→ $OUT"; exit 0
fi
node core/render/events.mjs "$HERE"
node core/render/video.mjs "$HERE" --fps $FPS --workers $WORKERS --out "$HERE/out/video.mp4"
"$PY" "$HERE/mix.py"
"$PY" "$HERE/tools/cuecheck.py"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/moon-lanterns.mp4" $FPS 1
node core/render/still.mjs "$HERE" 109.0 --q "nosub=1" --out "$HERE/out/stills"
ffmpeg -loglevel error -y -i "$HERE/out/stills/t_109.jpg" -q:v 3 "$HERE/poster.jpg"
echo "→ $HERE/moon-lanterns.mp4  $HERE/moon-lanterns.srt  $HERE/poster.jpg"
