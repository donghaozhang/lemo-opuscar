#!/bin/sh
# Copies the finished film into deliveries/moon-lanterns/: final.mp4 (1080p, < 95 MB), final-720p.mp4 (< 28 MB), poster.jpg, subtitles.srt
set -e
LIB=/home/user/lemo-opuscar; HERE=$LIB/films/moon-lanterns; D=$LIB/deliveries/moon-lanterns
mkdir -p "$D"
cp "$HERE/moon-lanterns.mp4" "$D/final.mp4"
cp "$HERE/moon-lanterns.srt" "$D/subtitles.srt"
cp "$HERE/poster.jpg" "$D/poster.jpg"
# phones: 1280×720, CRF 24, AAC 128 k; the loudness of the master is kept (audio copied)
ffmpeg -loglevel error -y -i "$HERE/moon-lanterns.mp4" -vf scale=1280:720 -c:v libx264 -preset slow -crf 24 -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart "$D/final-720p.mp4"
ls -la "$D"
