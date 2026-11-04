#!/bin/sh
# contact sheet at 1 fps from a finished film: sh tools/contact.sh film.mp4 out.jpg
LIB=/home/user/lemo-opuscar; T=$(mktemp -d)
ffmpeg -loglevel error -y -i "$1" -vf "fps=1,scale=480:-2" "$T/f_%03d.jpg"
$LIB/.venv/bin/python $LIB/core/render/sheet.py "$2" $T/f_*.jpg --cols 8 --w 240
rm -rf "$T"
