#!/bin/sh
# Final checks on a finished film: loudness (ebur128), black frames (blackdetect), duration, stream info. usage: sh tools/checks.sh film.mp4
F="$1"; [ -f "$F" ] || { echo "usage: sh tools/checks.sh film.mp4"; exit 2; }
HERE=$(cd "$(dirname "$0")/.." && pwd); PATH="$HERE/bin:$PATH"; export PATH
echo "== streams"; ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,sample_rate,channels -show_entries format=duration,size -of default=nw=1 "$F"
echo "== loudness (ebur128)"; ffmpeg -hide_banner -nostats -i "$F" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|LRA|Peak):" | head -3
echo "== black frames (blackdetect d=0.1 pic_th=0.98)"; ffmpeg -hide_banner -nostats -i "$F" -vf "blackdetect=d=0.1:pic_th=0.98" -an -f null - 2>&1 | grep -E "black_start" || echo "none"
echo "== silence (silencedetect -50dB, 2s)"; ffmpeg -hide_banner -nostats -i "$F" -af "silencedetect=n=-50dB:d=2" -vn -f null - 2>&1 | grep -E "silence_(start|end)" || echo "none over 2 s"
