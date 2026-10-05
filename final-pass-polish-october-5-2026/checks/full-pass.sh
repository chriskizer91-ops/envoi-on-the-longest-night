#!/usr/bin/env bash
# full-pass.sh: the final polish pass's whole check, in the order it ran before Chris's file went out (October 5,
# 2026). Every check that opens a browser takes the shared lock, one at a time (the machine has 4 cores). It goes on
# past a failure and ends with a summary; it exits 1 if anything failed.
#   1. the quick ones: every map, the balance, and this pass's checks that run in node;
#   2. the game built (--min), then this pass's browser checks on it, and the game test's steps: the default seven at a
#      Pixel 7a held sideways (915 x 412) and with Chrome's address bar showing (915 x 356), the controls, the scenes
#      and the night walks, the chapters, a band 3 wild fight, the Colossus, the keepsakes, the songs and the finale;
#   3. the faults the game test now catches (checks/tools/game-test-plants.mjs, which builds what it needs);
#   4. the page of polish to try, and the game with its four ideas off;
#   5. the map editor's page and its two checks; the new battles' demo, every arena;
#   6. the file Chris keeps (--min --offline), played with the internet blocked, and his copy of it: the same with the
#      four ideas on (window.ENVOI_TRY, as the file he sent), played with the internet blocked too, and the four checked
#      on the offline try page, which is his file but for its title;
#   7. the game built with --min again, so dist/ isn't left as the offline copy.
# Usage, from the repository's top folder: bash final-pass-polish-october-5-2026/checks/full-pass.sh [out-dir]
# (out-dir: /tmp/claude-0/full-pass by default: one log per check, their screenshots, and summary.txt). It takes about
# two and a half hours; SECTIONS="1 2" (or "3 4 5 6 7") runs only those parts, e.g. as two background jobs.
set -u
cd "$(dirname "$0")/../.." || exit 2
OUT=${1:-/tmp/claude-0/full-pass}
LOCK=/tmp/claude-0/browser.lock
C=final-pass-polish-october-5-2026/checks
mkdir -p "$OUT" "$(dirname "$LOCK")"
: > "$OUT/summary.txt"
fails=0; total=0
want() { [[ " ${SECTIONS:-1 2 3 4 5 6 7} " == *" $1 "* ]]; }
run() {
  local name=$1; shift
  local t0; t0=$(date +%s)
  total=$((total + 1))
  if "$@" > "$OUT/$name.log" 2>&1; then r='ok    '; else r='FAILED'; fails=$((fails + 1)); fi
  printf '%-30s %s %5ss  %s\n' "$name" "$r" "$(( $(date +%s) - t0 ))" "$(grep -v '^\s*$' "$OUT/$name.log" | tail -1 | cut -c1-150)" | tee -a "$OUT/summary.txt"
}
b() { flock "$LOCK" "$@"; } # a browser, one at a time
gt() { local name=$1; shift; run "$name" b node tools/game-test.mjs --out "$OUT/shots-$name" "$@"; }

echo "the full pass at $(git rev-parse --short HEAD), $(date -u '+%Y-%m-%d %H:%M') UTC" | tee -a "$OUT/summary.txt"

# 1. the quick ones
if want 1; then
run check-maps node tools/check-maps.mjs
run balance node tools/balance.mjs
for f in walking/arrivals game/chapter-start-rest game/moonlore-full game/keepsake-refill game/old-world-crossroads \
  game/old-world-facing battles/stoop-framing battles/last-word battles/downed-kneels battles/lunara-spot battles/numbers \
  battles/levelup-keepsakes battles/vow-guard battles/guard-tag battles/fps-line battles/first-lose \
  tools/apply-edits-shapes tools/check-edits-keepsakes tools/keepsakes-fight-pinned tools/build-guards; do
  run "${f//\//-}" node "$C/$f.mjs"
done
fi

# 2. the game, its browser checks, and the game test
if want 2; then
run build node tools/build.mjs --min putting-it-all-together/game.html
run walking-field-check b node "$C/walking/field-check.mjs"
run walking-field-check-356 b node "$C/walking/field-check.mjs" --size 915x356
run walking-still-walk b node "$C/walking/still-walk.mjs"
for f in game/title-fits game/short-screens game/esc-closes game/hidden-audio game/set-fights game/cutscene-audio battles/battle-fit battles/endings; do
  run "${f//\//-}" b node "$C/$f.mjs"
done
gt game-default --size 915x412
gt game-default-356 --size 915x356
gt game-controls-scenes-wilds --size 915x412 --steps title,new,controls,scenes,wilds
gt game-chapters --size 915x412 --steps title,chapters
gt game-wild-band3 --size 915x412 --steps title,new,wild --band 3 --level 13
gt game-colossus --size 915x412 --steps title,new,colossus
gt game-keepsakes --size 915x412 --steps title,new,keepsakes
gt game-songs --size 915x412 --steps title,new,songs
gt game-finale --size 915x412 --steps title,new,finale
fi

# 3. the faults the game test catches now (it builds the offline file and the game again itself)
if want 3; then run game-test-plants node "$C/tools/game-test-plants.mjs"; fi

# 4. the polish to try, and the game with the four off
if want 4; then
run build-again node tools/build.mjs --min putting-it-all-together/game.html
run make-try node tools/make-try.mjs
run try-test b node tools/try-test.mjs --size 915x412 --out "$OUT/shots-try"
run try-test-off b node tools/try-test.mjs dist/game.html --off --size 915x412 --out "$OUT/shots-try-off"
fi

# 5. the map editor, and every arena on the new battles' demo
if want 5; then
run build-map-editor node tools/build.mjs envoi-final-draft/map-editor/map-editor.html
run map-editor-page-test b node envoi-final-draft/map-editor/page-test.mjs --out "$OUT/shots-map-editor"
run tools-map-editor-copy b node "$C/tools/map-editor-copy.mjs"
run tools-map-editor-keepsake-places b node "$C/tools/map-editor-keepsake-places.mjs"
run build-arena node tools/build.mjs demos/arena.html
run arena-test b node tools/arena-test.mjs --size 915x412 --seed 5 --out "$OUT/shots-arena"
fi

# 6. the file Chris keeps, and his copy of it with the four ideas on, each played with the internet blocked
if want 6; then
run build-offline node tools/build.mjs --min --offline putting-it-all-together/game.html
gt game-offline --offline --size 915x412
KEEP="dist/Envoi on the Longest Night.html"
run make-chris-file node -e '
  const fs = require("fs"), html = fs.readFileSync("dist/game.html", "utf8");
  if (!/<title>[^<]*<\/title>/.test(html)) throw new Error("no <title>");
  fs.writeFileSync(process.argv[1], html.replace(/<\/title>/, () => "</title>\n<script>window.ENVOI_TRY = {\"steps\":true,\"words\":true,\"door\":true,\"buy10\":true};</script>"));
  console.log(process.argv[1] + ": " + fs.statSync(process.argv[1]).size.toLocaleString("en-US") + " bytes");' "$KEEP"
gt chris-file-offline "$KEEP" --offline --size 915x412
# try-test.mjs only plays a page titled as the try page: the offline try page is his file but for its title (checked
# byte for byte), so its test is his file's
run make-try-offline node tools/make-try.mjs
run chris-file-is-the-try-page node -e '
  const fs = require("fs"), a = fs.readFileSync("dist/try.html", "latin1"), b = fs.readFileSync(process.argv[1], "latin1");
  if (a.replace("<title>Envoi Polish to Try</title>", "<title>Envoi on the Longest Night</title>") !== b) throw new Error("his file is not the offline try page with the game title");
  console.log("his file is the offline try page, but for its title");' "$KEEP"
run chris-file-try-test b node tools/try-test.mjs dist/try.html --size 915x412 --out "$OUT/shots-chris-file-try"
fi

# 7. dist/ back to the copy to publish
if want 7; then run build-last node tools/build.mjs --min putting-it-all-together/game.html; fi

echo "$((total - fails)) of $total passed" | tee -a "$OUT/summary.txt"
[ "$fails" -eq 0 ]
