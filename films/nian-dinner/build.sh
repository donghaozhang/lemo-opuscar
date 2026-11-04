#!/bin/sh
# Rebuild 《年兽来吃年夜饭》 from scratch: sh films/nian-dinner/build.sh (runs from any directory; in skill mode set LIB=<library folder>)
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$(cd "$HERE/../.." && pwd)}
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
cd "$LIB"
PY=.venv/bin/python; D=$HERE
export PLAYWRIGHT_CHROME=${PLAYWRIGHT_CHROME:-}
# 0. fonts (OFL, from npm @fontsource, not in git): Noto Serif SC 700 + Ma Shan Zheng 400
if [ ! -f "$D/fonts/noto-serif-sc-chinese-simplified-700-normal.woff2" ]; then
  tmp=$(mktemp -d); (cd "$tmp" && npm pack @fontsource/noto-serif-sc@5.3.1 @fontsource/ma-shan-zheng@5.3.1 --silent >/dev/null && for f in *.tgz; do mkdir -p "${f%.tgz}" && tar xzf "$f" -C "${f%.tgz}"; done)
  cp "$tmp"/fontsource-noto-serif-sc-*/package/files/noto-serif-sc-chinese-simplified-700-normal.woff2 "$tmp"/fontsource-noto-serif-sc-*/package/files/noto-serif-sc-latin-700-normal.woff2 \
     "$tmp"/fontsource-ma-shan-zheng-*/package/files/ma-shan-zheng-chinese-simplified-400-normal.woff2 "$tmp"/fontsource-ma-shan-zheng-*/package/files/ma-shan-zheng-latin-400-normal.woff2 "$D/fonts/"
  rm -rf "$tmp"
fi
# 1. sample libraries the score uses (CC0): erhu (karoryfer), zheng + percussion (vcsl), flute + cymbals + gong + bass drum (vsco2ce)
for lib in karoryfer vcsl vsco2ce; do [ -d core/audio/instruments/$lib ] || sh tools/fetch.sh instruments $lib; done
node "$D/tools/timeline.mjs"                                        # 2. timeline.js → timeline.json (sections, hits, banners)
node core/render/events.mjs "$D"                                    # 3. the page's events → events.json (foley hit points)
$PY "$D/music/score.py"                                             # 4. original score → music/score.wav
$PY "$D/mix.py"                                                     # 5. foley + ambience + score → out/mix.wav
$PY "$D/tools/cuecheck.py" || echo "cuecheck: some hits are off (see above)"
$PY "$D/subs.py"                                                    # 6. banners → nian-dinner.srt
node core/render/video.mjs "$D" --fps 24 --workers 4 --out "$D/out/video.mp4"   # 7. 3474 frames
sh core/render/mux.sh "$D/out/video.mp4" "$D/out/mix.wav" "$D/nian-dinner.mp4" 24 0   # 8. mux, −14 LUFS, no grain (the paper fibres are the texture)
node core/render/readcheck.mjs "$D" || echo "readcheck: see above"
$PY "$D/tools/check_final.py" "$D/nian-dinner.mp4"                  # 9. loudness, true peak, blackdetect, CJK glyph check
node core/render/still.mjs "$D" 110.5 --q 'nosub=1&poster=1' --prefix P_ --out "$D/out/t" && cp "$D/out/t/P_110.5.jpg" "$D/poster.jpg"
