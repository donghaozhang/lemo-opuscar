#!/bin/sh
# Review pass: contact sheets at 1 fps from a rendered film (24 frames per sheet, 4 columns), plus loudness and black-frame checks.
# Usage from the library root: sh films/ink-dragon/tools/review.sh <film.mp4> <out dir> [pass name]
set -e
F=$1; OUT=$2; NAME=${3:-pass}
mkdir -p "$OUT/frames"
ffmpeg -y -loglevel error -i "$F" -vf fps=1 -q:v 3 "$OUT/frames/${NAME}_%03d.jpg"
cd "$OUT/frames"
PY=$(cd "$(dirname "$0")/../../.." 2>/dev/null && pwd)/.venv/bin/python
[ -x "$PY" ] || PY=$(cd "$(dirname "$F")/../.." && pwd)/.venv/bin/python
n=0; set -- ${NAME}_*.jpg
while [ $# -gt 0 ]; do
  n=$((n + 1)); files=""; i=0
  while [ $# -gt 0 ] && [ $i -lt 24 ]; do files="$files $1"; shift; i=$((i + 1)); done
  "$PY" "$(dirname "$PY")/../../core/render/sheet.py" "../${NAME}_sheet$n.jpg" $files --cols 4 --w 480 > /dev/null
done
cd - > /dev/null
echo "sheets: $OUT/${NAME}_sheet1..$n.jpg"
echo "--- loudness (ebur128) ---"; ffmpeg -hide_banner -nostats -i "$F" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|LRA|Peak):" | head -3
echo "--- black frames (blackdetect) ---"; ffmpeg -hide_banner -nostats -i "$F" -vf blackdetect=d=0.04:pix_th=0.10 -an -f null - 2>&1 | grep blackdetect || echo "none"
