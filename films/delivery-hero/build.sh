#!/bin/sh
# One-command rebuild of 《外卖勇者》 from source: sh films/delivery-hero/build.sh   (any directory)
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$(cd "$HERE/../.." && pwd)}
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
cd "$LIB"
PY="$LIB/.venv/bin/python"
# 0. glyph atlas (Fusion Pixel Font, OFL) for every character used; fails on a missing glyph (needs fonttools + brotli + pillow in tools/.venv)
[ -x "$HERE/tools/.venv/bin/python" ] || { python3 -m venv "$HERE/tools/.venv" && "$HERE/tools/.venv/bin/pip" install -q fonttools brotli pillow; }
"$HERE/tools/.venv/bin/python" "$HERE/tools/glyphs.py"
# 1. timeline + subtitles from the page, sound events
node "$HERE/tools/export.mjs"
node core/render/events.mjs "$HERE"
# 2. score, cue check, Foley mix
$PY "$HERE/music/score.py"
$PY "$HERE/tools/cuecheck.py"
$PY "$HERE/mix.py"
# 3. reading-time check, picture, mux (−14 LUFS, true peak −1.2 dBTP, no grain)
node core/render/readcheck.mjs "$HERE"
node core/render/video.mjs "$HERE" --fps 24 --workers 4 --out "$HERE/out/video.mp4"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/delivery-hero.mp4" 24 0
# 4. poster
node core/render/still.mjs "$HERE" 118.9 --prefix poster_ --out "$HERE/out" && cp "$HERE/out/poster_118.9.jpg" "$HERE/poster.jpg"
