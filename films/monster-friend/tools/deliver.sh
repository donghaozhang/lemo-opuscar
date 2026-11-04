#!/bin/sh
# Make the deliverables: deliveries/monster-friend/{final.mp4 (1080p, < 95 MB), final-720p.mp4 (< 28 MB), poster.jpg, subtitles.srt}
# The crayon grain is high-entropy (the −14 LUFS master is 35 Mbps at crf 19), so both files are two-pass rate-controlled; the audio is copied untouched.
# Usage from the library root: sh films/monster-friend/tools/deliver.sh <mastered film.mp4>
set -e
F=$1; D=deliveries/monster-friend; mkdir -p "$D"; P=${TMPDIR:-/tmp}/mf_pass
ffmpeg -y -loglevel error -i "$F" -c:v libx264 -preset slow -b:v 5000k -maxrate 5600k -bufsize 11M -pass 1 -passlogfile "$P-1080" -an -f null /dev/null
ffmpeg -y -loglevel error -i "$F" -c:v libx264 -preset slow -b:v 5000k -maxrate 5600k -bufsize 11M -pass 2 -passlogfile "$P-1080" -pix_fmt yuv420p -c:a copy -movflags +faststart "$D/final.mp4"
ffmpeg -y -loglevel error -i "$F" -vf scale=1280:720:flags=lanczos -c:v libx264 -preset slow -b:v 1250k -maxrate 1450k -bufsize 3M -pass 1 -passlogfile "$P-720" -an -f null /dev/null
ffmpeg -y -loglevel error -i "$F" -vf scale=1280:720:flags=lanczos -c:v libx264 -preset slow -b:v 1250k -maxrate 1450k -bufsize 3M -pass 2 -passlogfile "$P-720" -pix_fmt yuv420p -c:a copy -movflags +faststart "$D/final-720p.mp4"
cp films/monster-friend/monster-friend.srt "$D/subtitles.srt"
cp films/monster-friend/poster.jpg "$D/poster.jpg"
ls -la "$D"
