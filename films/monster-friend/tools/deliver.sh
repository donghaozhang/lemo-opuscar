#!/bin/sh
# Make the deliverables: deliveries/monster-friend/{final.mp4 (1080p, < 95 MB), final-720p.mp4 (< 28 MB), poster.jpg, subtitles.srt}
# Usage from the library root: sh films/monster-friend/tools/deliver.sh <mastered film.mp4>
set -e
F=$1; D=deliveries/monster-friend; mkdir -p "$D"
# 1080p under 95 MB: the mastered file re-encoded at crf 21, audio copied untouched (it carries the −14 LUFS master)
ffmpeg -y -loglevel error -i "$F" -c:v libx264 -preset slow -crf 21 -pix_fmt yuv420p -c:a copy -movflags +faststart "$D/final.mp4"
# 720p for phones: same audio
ffmpeg -y -loglevel error -i "$F" -vf scale=1280:720:flags=lanczos -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p -c:a copy -movflags +faststart "$D/final-720p.mp4"
cp films/monster-friend/monster-friend.srt "$D/subtitles.srt"
cp films/monster-friend/poster.jpg "$D/poster.jpg"
ls -la "$D"
du -m "$D/final.mp4" "$D/final-720p.mp4"
