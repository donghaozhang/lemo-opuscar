#!/bin/sh
# One-command rebuild of 《蒸笼爵士》: sh films/steamer-jazz/build.sh   (any directory)
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$(cd "$HERE/../.." && pwd)}
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
cd "$LIB"
PY="$LIB/.venv/bin/python"
# 0. fonts: ZCOOL QingKe HuangYou + ZCOOL XiaoWei (OFL) from npm @fontsource, only the subset files covering the characters used
if [ ! -d "$HERE/fonts/src" ]; then mkdir -p "$HERE/fonts/src" && cd "$HERE/fonts/src" && for p in zcool-qingke-huangyou zcool-xiaowei; do npm pack "@fontsource/$p@5.3.0" -q >/dev/null && mkdir -p $p && tar xzf fontsource-$p-*.tgz -C $p; done; cd "$LIB"; fi
[ -x "$HERE/tools/.venv/bin/python" ] || { python3 -m venv "$HERE/tools/.venv" && "$HERE/tools/.venv/bin/pip" install -q fonttools brotli; }
"$HERE/tools/.venv/bin/python" "$HERE/tools/fonts.py"                  # CJK glyph check, part 1
# 1. sample packs for the band (CC0) and the music tier (numba for the banjo)
sh plugin/skills/lemo-opuscar/scripts/setup.sh deps music
for lib in vsco2ce vcsl freepats; do [ -d core/audio/instruments/$lib ] || sh tools/fetch.sh instruments $lib; done
# 2. paint the watercolour backgrounds once
node "$HERE/tools/paint.mjs"
# 3. timeline + subtitles, events, score, cue check, Foley + optical mix
node "$HERE/tools/export.mjs"
node core/render/events.mjs "$HERE"
$PY "$HERE/music/score.py"
$PY "$HERE/tools/cuecheck.py"
$PY "$HERE/mix.py"
# 4. checks, picture, mux (−14 LUFS, true peak −1.2 dBTP, film grain 3)
node core/render/readcheck.mjs "$HERE" --step 0.1
node "$HERE/tools/glyphcheck.mjs"
node core/render/video.mjs "$HERE" --fps 24 --workers 4 --out "$HERE/out/video.mp4"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/steamer-jazz.mp4" 24 3
node core/render/still.mjs "$HERE" 97.5 --prefix poster_ --out "$HERE/out" && cp "$HERE/out/poster_97.5.jpg" "$HERE/poster.jpg"
