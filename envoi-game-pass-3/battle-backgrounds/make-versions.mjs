// make-versions.mjs: the squeezed versions of Chris's combat backgrounds that the Battle Backgrounds page switches between,
// made from the originals in reference/art/battle-backgrounds/ (kept untouched), and versions.js, the page's list of them.
// A version already made is kept. Run from the repository's top folder:
//   node envoi-game-pass-3/battle-backgrounds/make-versions.mjs
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const R = path.resolve(new URL('../..', import.meta.url).pathname), here = path.join(R, 'envoi-game-pass-3/battle-backgrounds');
const sharp = createRequire(path.join(R, 'tools/package.json'))('sharp');
// the squeezes, from the gentlest to the strongest: [id, width, AVIF quality]
const LEVELS = [['q60', 1448, 60], ['q45', 1448, 45], ['q30', 1448, 30], ['q20', 1448, 20], ['q12', 1448, 12], ['q6', 1448, 6], ['h15', 1024, 15], ['t15', 724, 15]];
const src = path.join(R, 'reference/art/battle-backgrounds');
const out = {};
fs.mkdirSync(path.join(here, 'img'), { recursive: true });
for (const f of fs.readdirSync(src).filter((f) => f.endsWith('.png')).sort()) {
  const n = f.slice(0, 2); out[n] = {};
  for (const [lv, w, q] of LEVELS) {
    const to = path.join(here, 'img', n + '-' + lv + '.avif');
    if (!fs.existsSync(to)) await sharp(path.join(src, f)).resize({ width: w, kernel: 'lanczos3' }).avif({ quality: q, effort: 6 }).toFile(to);
    out[n][lv] = fs.statSync(to).size;
  }
  console.log(n, LEVELS.map(([lv]) => Math.round(out[n][lv] / 1024)).join(' '), 'KB');
}
// each path in double quotes, so tools/build.mjs puts the pictures inside the page
const lines = Object.entries(out).map(([n, v]) => '  \'' + n + '\': { ' + LEVELS.map(([lv]) => lv + ': ["./img/' + n + '-' + lv + '.avif", ' + v[lv] + ']').join(', ') + ' },');
fs.writeFileSync(path.join(here, 'versions.js'), `// versions.js: every squeezed version of each combat background, as [picture, bytes]. Written by make-versions.mjs;
// don't edit by hand.
window.BG_VERSIONS = {
${lines.join('\n')}
};
`);
console.log('versions.js written');
