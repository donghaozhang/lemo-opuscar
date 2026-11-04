#!/bin/sh
# One command for the whole film: timeline → events → score → foley/mix → video → mux. Run anywhere; in skill mode set LIB.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$(cd "$HERE/../.." && pwd)}
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
# ffmpeg 7+ is needed by mux.sh; the pip wheel (imageio-ffmpeg) provides one when the system's is older
FFB=$("$LIB/.venv/bin/python" -c "import imageio_ffmpeg as f, os; print(os.path.dirname(f.get_ffmpeg_exe()))" 2>/dev/null || true)
if [ -n "$FFB" ]; then mkdir -p "$HERE/out/bin"; ln -sf "$FFB"/ffmpeg-* "$HERE/out/bin/ffmpeg"; export PATH="$HERE/out/bin:$PATH"; fi
cd "$HERE" && node export_timeline.mjs
cd "$LIB"
node core/render/events.mjs "$HERE"
"$LIB/.venv/bin/python" "$HERE/score.py"
"$LIB/.venv/bin/python" "$HERE/mix.py"
"$LIB/.venv/bin/python" "$HERE/cuecheck.py"
node "$HERE/export_subs.mjs"
"$LIB/.venv/bin/python" core/render/srt.py "$HERE/out/srt_cues.json" "$HERE/grandpas-bicycle.srt"
node core/render/video.mjs "$HERE" --fps 24 --workers "${WORKERS:-4}" --out "$HERE/out/video.mp4"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/grandpas-bicycle.mp4" 24 1
