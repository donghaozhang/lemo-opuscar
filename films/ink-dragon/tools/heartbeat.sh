#!/bin/sh
# During a long render: every 10 minutes append a STATUS line (UTC, step, frames done / total) and commit + push it. Usage: sh heartbeat.sh <render.log> <step> <total>
LOG=$1; STEP=$2; TOTAL=$3; cd "$(dirname "$0")/../../.."
while ! grep -q '^EXIT' "$LOG"; do
  sleep 600
  grep -q '^EXIT' "$LOG" && break
  DONE=$(grep -E '^w[0-9]+ ' "$LOG" | awk '{split($2,a,"/"); s[$1]=a[1]} END {t=0; for (k in s) t+=s[k]; print t}')
  printf "| %s | %s | frames %s / %s |\n" "$(date -u +%H:%M)" "$STEP" "${DONE:-0}" "$TOTAL" >> films/ink-dragon/STATUS.md
  git add -f films/ink-dragon/STATUS.md && git commit -qm "ink-dragon: render progress" && git push -q origin cloud/film-2-fable
done
