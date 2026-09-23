#!/bin/sh
# Prints resume.pdf and one PDF per focus from index.html with headless
# Chrome, so the PDFs are always the page's own print layout and can't drift
# from it. The focus names come from LENSES in script.js.
#
#   sh tools/build-pdfs.sh
#
# Run it after any edit to index.html, script.js or the print rules in
# style.css, then commit the PDFs with the edit.

set -e
cd "$(dirname "$0")/.."

CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
PAGE="file://$(pwd | sed 's/ /%20/g')/index.html"
PROFILE="$(mktemp -d)"
trap 'rm -rf "$PROFILE"' EXIT
mkdir -p pdf

LENSES=$(sed -n 's/^  \([a-z][a-z0-9-]*\): *{ *name:.*/\1/p' script.js)
[ -n "$LENSES" ] || { echo "no focuses found in script.js" >&2; exit 1; }

size() { stat -f %z "$1" 2>/dev/null || stat -c %s "$1" 2>/dev/null || echo 0; }

for lens in $LENSES; do
  if [ "$lens" = all ]; then out=resume.pdf; else out="pdf/resume-$lens.pdf"; fi
  rm -f "$out"
  "$CHROME" --headless --disable-gpu --no-first-run --use-mock-keychain \
    --user-data-dir="$PROFILE" --no-pdf-header-footer \
    --print-to-pdf="$out" "$PAGE?for=$lens" >/dev/null 2>&1 &
  pid=$!
  # Headless Chrome sometimes writes the PDF and then never exits, so don't
  # wait on it: wait for the file to stop growing, then close it.
  last=-1; n=0
  while [ $n -lt 60 ]; do
    sleep 0.5; n=$((n + 1))
    now=$(size "$out")
    if [ "$now" -gt 0 ] && [ "$now" = "$last" ]; then break; fi
    kill -0 $pid 2>/dev/null || { [ "$now" -gt 0 ] && break; }
    last=$now
  done
  kill $pid 2>/dev/null || true
  wait $pid 2>/dev/null || true
  [ -s "$out" ] || { echo "failed to print $out" >&2; exit 1; }

  if command -v pdfinfo >/dev/null; then
    pages=$(pdfinfo "$out" | awk '/^Pages:/ {print $2}')
    echo "$out  $pages page(s)"
    [ "$pages" = 1 ] || echo "  ^ runs past one page, trim something" >&2
  else
    echo "$out"
  fi
done
