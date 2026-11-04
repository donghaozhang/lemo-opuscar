#!/bin/sh
# One command rebuilds the film: voices → events → score → mix → subtitles → render → mux (−14 LUFS)
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$(cd "$HERE/../.." && pwd)}
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY="$LIB/.venv/bin/python"
cd "$LIB"
sh "$HERE/tools/fonts.sh"                                   # OFL fonts subset to the characters used
"$PY" "$HERE/voice.py"                                      # synthesised gibberish voices + lip-sync envelopes
node core/render/events.mjs "$HERE"                         # timeline → events.json
"$PY" "$HERE/music/score.py"                                # original synth score
"$PY" "$HERE/mix.py"                                        # foley + voices + ducked score + beds → out/mix.wav
node "$HERE/tools/srt.mjs"                                  # subtitles → alien-hotpot.srt
"$PY" "$HERE/tools/cuecheck.py"                             # every hit on its beat
node core/render/video.mjs "$HERE" --fps 24 --workers ${WORKERS:-4} --out "$HERE/out/video.mp4"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/alien-hotpot.mp4" 24 0
