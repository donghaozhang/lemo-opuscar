#!/bin/sh
# 1 fps contact sheets of a rendered film (exact frames n = 24k, so no half-second offset): tools/sheet.sh film.mp4 outprefix
set -e
HERE=$(cd "$(dirname "$0")/.." && pwd); LIB=${LIB:-$(cd "$HERE/../.." && pwd)}
V=$1; P=$2; T=$(mktemp -d)
ffmpeg -v error -i "$V" -vf "select='not(mod(n\,24))',scale=320:-1" -fps_mode passthrough "$T/f_%04d.jpg"
n=$(ls $T | wc -l); i=0
for start in $(seq 1 50 $n); do
  i=$((i+1)); files=$(ls $T/f_*.jpg | sed -n "${start},$((start+49))p")
  "$LIB/.venv/bin/python" "$LIB/core/render/sheet.py" "${P}_$i.jpg" $files --cols 10 --w 320 >/dev/null
  echo "${P}_$i.jpg"
done
rm -rf "$T"
