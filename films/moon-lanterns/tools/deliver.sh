#!/bin/sh
# Copies the finished film into deliveries/moon-lanterns/: final.mp4 (1080p, < 95 MB), final-720p.mp4 (< 28 MB), poster.jpg, subtitles.srt
set -e
LIB=/home/user/lemo-opuscar; HERE=$LIB/films/moon-lanterns; D=$LIB/deliveries/moon-lanterns
mkdir -p "$D"
cp "$HERE/moon-lanterns.mp4" "$D/final.mp4"
cp "$HERE/moon-lanterns.srt" "$D/subtitles.srt"
cp "$HERE/poster.jpg" "$D/poster.jpg"
# phones: 1280×720, CRF 24, AAC 160 k; a look-ahead limiter at -2.4 dB keeps the true peak under -1 dBTP after the AAC encode
ffmpeg -loglevel error -y -i "$HERE/moon-lanterns.mp4" -vf scale=1280:720 -c:v libx264 -preset slow -crf 24 -pix_fmt yuv420p -af "alimiter=limit=0.76:attack=4:release=60:level=false" -c:a aac -b:a 160k -movflags +faststart "$D/final-720p.mp4"
ls -la "$D"
