#!/bin/sh
# Frame strips at 0.2 s for the key actions, extracted from a rendered video (no re-render): sh tools/strips.sh out/video.mp4
V="$1"; HERE=$(cd "$(dirname "$0")/.." && pwd); PATH="$HERE/bin:$PATH"; export PATH; PY="${LIB:-$HERE/../..}/.venv/bin/python"
O="$HERE/stills/strips"; mkdir -p "$O"; rm -f "$O"/*.jpg
strip() {   # name start end
  n=$1; a=$2; b=$3; i=0; t=$a; files=""
  while [ "$(echo "$t <= $b" | bc)" = 1 ]; do f="$O/${n}_$(printf %02d $i).jpg"; ffmpeg -v error -y -ss "$t" -i "$V" -frames:v 1 -q:v 3 "$f"; files="$files $f"; t=$(echo "$t + 0.2" | bc); i=$((i+1)); done
  $PY "${LIB:-$HERE/../..}/core/render/sheet.py" "$HERE/stills/strip_$n.jpg" $files --cols 6 --w 320
}
strip boatdown 2.3 4.3
strip candy 42.4 44.2
strip goose 59.4 61.0
strip lantern1 64.2 65.6
strip blow 78.0 79.6
strip relight 100.5 102.1
strip gutter 112.2 113.6
strip revive 115.2 116.8
strip door 118.3 119.9
strip gift 144.4 146.0
