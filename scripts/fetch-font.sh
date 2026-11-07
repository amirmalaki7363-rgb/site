#!/bin/bash
# Download Vazirmatn Persian font locally
set -e
FONT_DIR=/home/z/my-project/public/fonts
mkdir -p "$FONT_DIR"
BASE="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/fonts/webfonts"
for w in Regular Medium SemiBold Bold ExtraBold; do
  if [ ! -s "$FONT_DIR/Vazirmatn-$w.woff2" ]; then
    curl -sL --fail -o "$FONT_DIR/Vazirmatn-$w.woff2" "$BASE/Vazirmatn-$w.woff2" && echo "OK Vazirmatn-$w" || echo "FAIL Vazirmatn-$w"
  fi
done
ls -la "$FONT_DIR"
