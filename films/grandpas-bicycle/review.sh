#!/bin/sh
# Review pass: 1 fps contact sheets from the rendered video, plus 0.2 s strips of the key actions.
# usage: sh review.sh <video.mp4> <tag>   → stills/contact-<tag>-N.jpg, stills/strip-<tag>-<action>.jpg
set -e
HERE=$(cd "$(dirname "$0")" && pwd); LIB=${LIB:-$(cd "$HERE/../.." && pwd)}
V=$(cd "$(dirname "$1")" && pwd)/$(basename "$1"); TAG=${2:-pass}; T=$HERE/out/review-$TAG; rm -rf "$T"; mkdir -p "$T"
ffmpeg -v error -y -i "$V" -vf fps=1 -q:v 4 "$T/f_%03d.jpg"
cd "$T"; n=0; set --
for f in f_*.jpg; do set -- "$@" "$f"; n=$((n+1)); if [ $n -eq 27 ]; then k=$((k+1)); "$LIB/.venv/bin/python" "$LIB/core/render/sheet.py" "$HERE/stills/contact-$TAG-$k.jpg" "$@" --cols 3 --w 640; n=0; set --; fi; done
[ $n -gt 0 ] && k=$((k+1)) && "$LIB/.venv/bin/python" "$LIB/core/render/sheet.py" "$HERE/stills/contact-$TAG-$k.jpg" "$@" --cols 3 --w 640
# 0.2 s strips around the key actions (fall 1, the letting-go, the lift, the hand)
for a in "fall1 20.2" "letgo 37.6" "lift 103.6" "hand 121.6"; do set -- $a; name=$1; t0=$2
  ffmpeg -v error -y -ss "$t0" -i "$V" -t 2.0 -vf fps=5 -q:v 4 "$T/s_${name}_%02d.jpg"
  "$LIB/.venv/bin/python" "$LIB/core/render/sheet.py" "$HERE/stills/strip-$TAG-$name.jpg" "$T"/s_${name}_*.jpg --cols 5 --w 384
done
echo "sheets: $(ls "$HERE"/stills/contact-$TAG-*.jpg | wc -l)"
