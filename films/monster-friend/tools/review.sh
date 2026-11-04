#!/bin/sh
# Review pass: contact sheets at 1 fps from a rendered film (24 frames per sheet, 4 columns), plus loudness and black-frame checks.
# Usage from the library root: sh films/monster-friend/tools/review.sh <film.mp4> <out dir> [pass name]
set -e
LIB=$(cd "$(dirname "$0")/../../.." && pwd)
F=$(cd "$(dirname "$1")" && pwd)/$(basename "$1"); OUT=$(mkdir -p "$2" && cd "$2" && pwd); NAME=${3:-pass}
mkdir -p "$OUT/frames"
[ -n "$(ls "$OUT/frames" 2>/dev/null)" ] || ffmpeg -y -loglevel error -i "$F" -vf fps=1 -q:v 3 "$OUT/frames/${NAME}_%03d.jpg"
cd "$OUT/frames"
PY=$LIB/.venv/bin/python
n=0; set -- ${NAME}_*.jpg
while [ $# -gt 0 ]; do
  n=$((n + 1)); files=""; i=0
  while [ $# -gt 0 ] && [ $i -lt 24 ]; do files="$files $1"; shift; i=$((i + 1)); done
  "$PY" "$LIB/core/render/sheet.py" "../${NAME}_sheet$n.jpg" $files --cols 4 --w 480 > /dev/null
done
cd - > /dev/null
echo "sheets: $OUT/${NAME}_sheet1..$n.jpg"
echo "--- loudness (ebur128) ---"; ffmpeg -hide_banner -nostats -i "$F" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|LRA|Peak):" | head -3
echo "--- black frames (blackdetect) ---"; ffmpeg -hide_banner -nostats -i "$F" -vf blackdetect=d=0.04:pix_th=0.10 -an -f null - 2>&1 | grep blackdetect || echo "none"
