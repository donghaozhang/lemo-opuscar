#!/bin/sh
# 愚公移山 — one-command build: fonts → events → score → Foley/mix → picture → mux (−14 LUFS) → 720p
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$(cd "$HERE/../.." && pwd)}
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
# ffmpeg 7+ is required by mux.sh; put a newer one first on PATH if the system one is older (FFMPEG_DIR=...)
[ -n "$FFMPEG_DIR" ] && PATH="$FFMPEG_DIR:$PATH"
cd "$LIB"
if [ ! -f "$HERE/fonts/fonts.css" ]; then
  T=$(mktemp -d); (cd "$T" && npm pack @fontsource/noto-serif-sc@5.3.1 -q && tar xzf fontsource-noto-serif-sc-5.3.1.tgz)
  python3 "$HERE/fonts/getfonts.py" "$T/package"
fi
node core/render/events.mjs "$HERE"
"$LIB/.venv/bin/python" "$HERE/music/score.py"
"$LIB/.venv/bin/python" "$HERE/mix.py"
node core/render/video.mjs "$HERE" --fps 24 --workers ${WORKERS:-4} --out "$HERE/out/video.mp4"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/out/master.mp4" 24 3
# delivery encodes: 1080p (CRF tuned for grain, < 95 MB) and 720p for phones (< 28 MB)
ffmpeg -y -loglevel error -i "$HERE/out/master.mp4" -c:v libx264 -preset slow -crf ${CRF:-24} -tune grain -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart "$HERE/moving-mountains.mp4"
ffmpeg -y -loglevel error -i "$HERE/out/master.mp4" -vf scale=1280:720:flags=lanczos -c:v libx264 -preset slow -crf ${CRF720:-27} -tune grain -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart "$HERE/moving-mountains-720p.mp4"
ls -la "$HERE"/moving-mountains*.mp4
