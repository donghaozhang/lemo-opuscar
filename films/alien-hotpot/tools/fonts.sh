#!/bin/sh
# Subset the OFL fonts to every character the film uses (Google Fonts CSS API, &text=), into fonts/.
set -e
HERE=$(cd "$(dirname "$0")/.." && pwd); cd "$HERE"
CH=$(cat *.js | python3 -c "import sys;s=sys.stdin.read();print(''.join(sorted(set(c for c in s if ord(c)>0x2000))))")
ASCII=' !"#$%&()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz%×·'
get() {  # family file text
  E=$(python3 -c "import urllib.parse,sys;print(urllib.parse.quote(sys.argv[1]))" "$3")
  U=$(curl -sS "https://fonts.googleapis.com/css2?family=$1&text=$E" | grep -o 'https://[^)]*' | head -1)
  curl -sS -o "fonts/$2" "$U"; echo "fonts/$2: $(wc -c < fonts/$2) bytes"
}
get 'ZCOOL+KuaiLe' zcool.ttf "$CH$ASCII"
get 'VT323' vt323.ttf "$ASCII"
printf '%s' "$CH" > fonts/chars.txt
