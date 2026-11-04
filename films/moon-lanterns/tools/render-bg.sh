#!/bin/sh
# full render in the background with STATUS.md lines every 10 minutes (committed and pushed), then the mix and the master
LIB=/home/user/lemo-opuscar; HERE=$LIB/films/moon-lanterns; LOG=$HERE/out/render.log
cd $LIB
node core/render/video.mjs "$HERE" --fps 24 --workers 4 --out "$HERE/out/video.mp4" > $LOG 2>&1 &
PID=$!
while kill -0 $PID 2>/dev/null; do
  sleep 600
  kill -0 $PID 2>/dev/null || break
  DONE=$(grep -oE "^w[0-9] [0-9]+/[0-9]+" $LOG | awk '{split($2,a,"/"); s[$1]=a[1]; t[$1]=a[2]} END {d=0; n=0; for (k in s) {d+=s[k]; n+=t[k]}; print d"/"n}')
  echo "- $(date -u +'%Y-%m-%d %H:%M') full render running: frames $DONE (per-worker progress, logged every 60 frames)" >> $HERE/STATUS.md
  git add -f $HERE/STATUS.md && git commit -q -m "moon-lanterns: render progress" && git push -q origin claude/moon-lanterns-film-4t96vh && git push -q origin HEAD:cloud/film-9-lantern
done
wait $PID; echo "render exit $?" >> $LOG
echo "- $(date -u +'%Y-%m-%d %H:%M') full render finished ($(tail -1 $LOG))" >> $HERE/STATUS.md
