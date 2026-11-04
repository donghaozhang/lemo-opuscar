#!/bin/sh
# Rebuild 《深夜翻译官》 v2 from source: sh films/night-translator-v2/build.sh
# Needs the library's core tier (setup.sh deps), the VSCO 2 CE and VCSL sample libraries (tools/fetch.sh instruments …)
# and ffmpeg 7+ on PATH (the system 6.x under-reports loudnorm length).
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$(cd "$HERE/../.." && pwd)}
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
cd "$LIB"
PY="$LIB/.venv/bin/python"
node "$HERE/tools/dump_timeline.mjs"                                          # 1. cue sheet + shot list → timeline.json
node core/render/events.mjs "$HERE"                                           # 2. picture events → events.json
"$PY" "$HERE/music/score.py"                                                  # 3. the pit band's score
"$PY" "$HERE/tools/cuecheck.py"                                               # 4. sync points and cuts on the grid (0 ms)
"$PY" "$HERE/mix.py"                                                          # 5. score + trap box + projector → out/mix.wav
node "$HERE/tools/subs.mjs" && "$PY" core/render/srt.py "$HERE/out/srt.json" "$HERE/night-translator-v2.srt"
node core/render/readcheck.mjs "$HERE" --q textsOnly=1                        # 6. every card and page long enough to read
node core/render/video.mjs "$HERE" --fps 24 --workers 4 --out "$HERE/out/video.mp4"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/out/master.mp4" 24 1
ffmpeg -loglevel error -y -i "$HERE/out/master.mp4" -c:v libx264 -preset slow -crf 26 -tune grain -pix_fmt yuv420p -c:a copy -movflags +faststart "$HERE/night-translator-v2.mp4"
ffmpeg -loglevel error -y -i "$HERE/out/master.mp4" -vf scale=1280:720:flags=lanczos -c:v libx264 -preset slow -crf 30 -tune grain -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart "$HERE/night-translator-v2-720p.mp4"
