// make-demos.mjs: the chapter demos (Chris, October 3: "the start of the game, gate 5, gate 10, gate 15, and the approach
// to the final battle"): copies of the built game that each open at one chapter (src/game/game.js CHAPTERS). Each is the
// game exactly as built, with its own title and one line before the game starts that names its chapter; its title screen
// offers only to begin that chapter or carry on from its save. Build the game first.
// Usage: node tools/build.mjs --min putting-it-all-together/game.html && node tools/make-demos.mjs
// Writes dist/demo-<id>.html (to open here) and dist/demo-<id>.artifact.html (to publish).
import fs from 'fs';
import path from 'path';

const R = path.resolve(new URL('..', import.meta.url).pathname), dist = path.join(R, 'dist');
// the CHAPTERS index each demo opens at, and its page title
const DEMOS = [
  { id: 'start', chapter: 0, title: 'Envoi from the Start' },
  { id: 'gate-5', chapter: 1, title: 'Envoi at Gate 5' },
  { id: 'gate-10', chapter: 2, title: 'Envoi at Gate 10' },
  { id: 'gate-15', chapter: 3, title: 'Envoi at Gate 15' },
  { id: 'finale', chapter: 4, title: 'Envoi before the Finale' },
];
for (const [from, ext] of [['game.html', '.html'], ['game.artifact.html', '.artifact.html']]) {
  const src = path.join(dist, from);
  if (!fs.existsSync(src)) { console.error('build the game first: no dist/' + from); process.exit(1); }
  const html = fs.readFileSync(src, 'utf8');
  if (!/<title>[^<]*<\/title>/.test(html)) { console.error('no <title> in dist/' + from); process.exit(1); }
  for (const d of DEMOS) {
    const out = html.replace(/<title>[^<]*<\/title>/, '<title>' + d.title + '</title>\n<script>window.ENVOI_CHAPTER = ' + d.chapter + ';</script>');
    const to = path.join(dist, 'demo-' + d.id + ext);
    fs.writeFileSync(to, out);
    console.log(path.relative(R, to), (fs.statSync(to).size / 1048576).toFixed(2) + ' MB');
  }
}
