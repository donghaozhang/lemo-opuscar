#!/bin/sh
# Make the deliverables: deliveries/ink-dragon/{final.mp4 (1080p, < 95 MB), final-720p.mp4 (< 28 MB), poster.jpg, subtitles.srt}
# Usage from the library root: sh films/ink-dragon/tools/deliver.sh <mastered film.mp4>
set -e
F=$1; D=deliveries/ink-dragon; mkdir -p "$D"
# 1080p under 95 MB: the mastered file re-encoded a notch smaller (the master is at crf 19 and lands just over), audio copied untouched
ffmpeg -y -loglevel error -i "$F" -c:v libx264 -preset slow -crf 21 -pix_fmt yuv420p -c:a copy -movflags +faststart "$D/final.mp4"
# 720p for phones: a smaller bitrate, same audio
ffmpeg -y -loglevel error -i "$F" -vf scale=1280:720:flags=lanczos -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p -c:a copy -movflags +faststart "$D/final-720p.mp4"
cp films/ink-dragon/ink-dragon.srt "$D/subtitles.srt"
cp films/ink-dragon/poster.jpg "$D/poster.jpg"
ls -la "$D"
du -m "$D/final.mp4" "$D/final-720p.mp4"
