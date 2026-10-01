#!/usr/bin/env bash
# Pulls each model function out of the reference demos into build/, unchanged,
# and fetches three.js r128 from npm (the CDN is not reachable from the cloud sandbox).
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
demos="$here/../../reference/demos"
out="$here/build"
mkdir -p "$out"
grab() { awk -v start="$2" 'index($0, start) == 1 { f = 1 } f && /^<\/script>/ { exit } f { print }' "$demos/$1"; }
{
  echo "'use strict';"
  awk '/^  function makeWitch\(\) \{/ { f = 1 } /^  const \$ = \(id\)/ { exit } f { print }' "$demos/night-square-shadow-wraith.html"
  echo "window.makeWitch = makeWitch; window.makeWraith = makeWraith; window.makeGoddess = makeGoddess;"
} > "$out/ns_models.js"
grab sol-in-the-night-square.html '// sol.js:' > "$out/sol.js"
grab halcyon-in-the-night-square.html '// halcyon.js (v2):' > "$out/halcyon.js"
grab envoi-letter-wyrm-model-preview.html 'function makeEnvoi(' > "$out/envoi.js"
grab noctara-in-the-night-square.html '// noctara.js:' > "$out/noctara.js"
if [ ! -f "$out/three.min.js" ]; then
  (cd "$out" && npm pack three@0.128.0 --silent >/dev/null && tar xzf three-0.128.0.tgz package/build/three.min.js && mv package/build/three.min.js . && rm -rf package three-0.128.0.tgz)
fi
wc -c "$out"/*.js
