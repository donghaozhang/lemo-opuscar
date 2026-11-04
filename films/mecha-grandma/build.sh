#!/bin/sh
# Rebuild 《机甲外婆》 from source: sh films/mecha-grandma/build.sh
# Needs the library's core + music tiers (setup.sh deps music) and ffmpeg 7+ on PATH.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$(cd "$HERE/../.." && pwd)}
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
cd "$LIB"
PY="$LIB/.venv/bin/python"
node "$HERE/tools/dump_timeline.mjs"                                          # cue sheet + shot list → timeline.json
node core/render/events.mjs "$HERE"
"$PY" "$HERE/music/score.py"                                                  # the synth city-pop score
"$PY" "$HERE/tools/cuecheck.py"                                               # sync points and cuts on the grid
"$PY" "$HERE/mix.py"                                                          # score + Foley + beds → out/mix.wav
node "$HERE/tools/subs.mjs" && "$PY" core/render/srt.py "$HERE/out/srt.json" "$HERE/mecha-grandma.srt"
node core/render/readcheck.mjs "$HERE" --q textsOnly=1
node core/render/video.mjs "$HERE" --fps 24 --workers 4 --out "$HERE/out/video.mp4"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/out/master.mp4" 24 0
# two-pass encodes to the size targets (1080p < 95 MB, 720p < 28 MB)
ffmpeg -y -loglevel error -i "$HERE/out/master.mp4" -c:v libx264 -preset slow -b:v 4600k -pass 1 -passlogfile /tmp/mg1080 -an -f null /dev/null
ffmpeg -y -loglevel error -i "$HERE/out/master.mp4" -c:v libx264 -preset slow -b:v 4600k -maxrate 7000k -bufsize 9000k -pass 2 -passlogfile /tmp/mg1080 -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart "$HERE/mecha-grandma.mp4"
ffmpeg -y -loglevel error -i "$HERE/out/master.mp4" -vf scale=1280:720:flags=lanczos -c:v libx264 -preset slow -b:v 1300k -pass 1 -passlogfile /tmp/mg720 -an -f null /dev/null
ffmpeg -y -loglevel error -i "$HERE/out/master.mp4" -vf scale=1280:720:flags=lanczos -c:v libx264 -preset slow -b:v 1300k -maxrate 2200k -bufsize 3000k -pass 2 -passlogfile /tmp/mg720 -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart "$HERE/mecha-grandma-720p.mp4"
