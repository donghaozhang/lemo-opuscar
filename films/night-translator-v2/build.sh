#!/bin/sh
# Rebuild 《深夜翻译官》 from source: sh films/night-translator/build.sh
# Needs the library's core tier (setup.sh deps), the VSCO 2 CE and VCSL sample libraries (tools/fetch.sh instruments …)
# and ffmpeg 7+ on PATH (the system 6.x under-reports loudnorm length).
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$(cd "$HERE/../.." && pwd)}
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
cd "$LIB"
PY="$LIB/.venv/bin/python"
node "$HERE/tools/dump_timeline.mjs"                                          # 1. cue sheet → timeline.json
node core/render/events.mjs "$HERE"                                           # 2. picture events → events.json
"$PY" "$HERE/music/score.py"                                                  # 3. photoplay piano score
"$PY" "$HERE/tools/cuecheck.py"                                               # 4. picture hits ↔ score / trap box (0 ms)
"$PY" "$HERE/mix.py"                                                          # 5. score + trap box + projector → out/mix.wav
node "$HERE/tools/subs.mjs" && "$PY" core/render/srt.py "$HERE/out/srt.json" "$HERE/night-translator.srt"   # 6. intertitles → .srt
node core/render/readcheck.mjs "$HERE" --q textsOnly=1                        # 7. every card long enough to read
node core/render/video.mjs "$HERE" --fps 24 --workers 4 --out "$HERE/out/video.mp4"                         # 8. render
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/out/master.mp4" 24 1                # 9. −14 LUFS master
ffmpeg -loglevel error -y -i "$HERE/out/master.mp4" -c:v libx264 -preset slow -crf 24 -tune grain -pix_fmt yuv420p -c:a copy -movflags +faststart "$HERE/night-translator.mp4"   # 10. grain encode
node core/render/still.mjs "$HERE" 59.6 --out "$HERE/out" --prefix poster_ && cp "$HERE/out/poster_59.6.jpg" "$HERE/poster.jpg"
