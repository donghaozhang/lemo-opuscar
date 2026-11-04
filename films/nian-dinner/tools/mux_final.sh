#!/bin/sh
# Mux the pre-normalised mix (−14 LUFS / −2 dBTP from mix.py) with the picture, no further loudness processing, no grain: sh tools/mux_final.sh video.mp4 mix.wav out.mp4 [crf=19]
set -e
V="$1"; A="$2"; O="$3"; CRF="${4:-19}"
ffmpeg -y -loglevel error -i "$V" -i "$A" -filter_complex "[0:v]fps=24,format=yuv420p[v];[1:a]aresample=48000[a]" -map "[v]" -map "[a]" -c:v libx264 -preset slow -crf "$CRF" -r 24 -c:a aac -b:a 256k -movflags +faststart -shortest "$O"
echo "$O"; ffmpeg -hide_banner -nostats -i "$O" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|LRA|Peak):" | head -3
