// make-try.mjs: the page where Chris tries three small ideas he hasn't said yes to (handoff/tasks.md, I06, I08 and I12):
// words that move on by themselves (a reading setting beside the words' speed, which starts on there), a door's sound
// when Io walks from one map to the next, and Buy 10 in the herb shops. It is the built game exactly as built, with its
// own title and one line before the game starts that switches the three on (window.ENVOI_TRY, read by src/game/game.js).
// The game itself has them off, and plays as it did. Build the game first.
// Usage: node tools/build.mjs --min putting-it-all-together/game.html && node tools/make-try.mjs
// Writes dist/try.html (to open here) and dist/try.artifact.html (to publish, with the files dist/try.beside.json lists
// beside it at the same paths, the game's songs and keepsake pictures). Check it with node tools/try-test.mjs.
import fs from 'fs';
import path from 'path';

const R = path.resolve(new URL('..', import.meta.url).pathname), dist = path.join(R, 'dist');
const TITLE = 'Envoi: Polish to Try', SWITCHES = { words: true, door: true, buy10: true };
for (const [from, to] of [['game.html', 'try.html'], ['game.artifact.html', 'try.artifact.html']]) {
  const src = path.join(dist, from);
  if (!fs.existsSync(src)) { console.error('build the game first: no dist/' + from); process.exit(1); }
  const html = fs.readFileSync(src, 'utf8');
  if (!/<title>[^<]*<\/title>/.test(html)) { console.error('no <title> in dist/' + from); process.exit(1); }
  const out = html.replace(/<title>[^<]*<\/title>/, () => '<title>' + TITLE + '</title>\n<script>window.ENVOI_TRY = ' + JSON.stringify(SWITCHES) + ';</script>');
  fs.writeFileSync(path.join(dist, to), out);
  console.log('dist/' + to, (fs.statSync(path.join(dist, to)).size / 1048576).toFixed(2) + ' MB');
}
// the published copy reads the songs and the keepsakes' pictures from beside it, as the game's does
const beside = path.join(dist, 'game.beside.json'), mine = path.join(dist, 'try.beside.json');
if (fs.existsSync(beside)) {
  fs.copyFileSync(beside, mine);
  console.log('  dist/try.artifact.html: publish it with the ' + JSON.parse(fs.readFileSync(mine, 'utf8')).length + ' files dist/try.beside.json lists beside it, at the same paths');
} else if (fs.existsSync(mine)) fs.unlinkSync(mine);
