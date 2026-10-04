// build.mjs: builds the cutscene's two files from copies/ and src/.
//   finale-opening.js              the module the game calls: everything inside one function scope, so none of its copies
//                                  (Sol, Halcyon, Noctara, the cutscene Io...) can clash with the game's own models of the
//                                  same names; it defines only window.CUTSCENES['finale-opening']. three.js r128 is not
//                                  inside: the game has it.
//   Finale_Opening_Cutscene.html   the page for Chris's phone: one file, the module and the page's own start screen and
//                                  end card inside, the game's two fonts inside, and three.js from cdnjs.
// Usage, from this folder: node tools/build.mjs [artifactOut]  (with artifactOut, also the page without its outer
// document tags, for publishing). Reports each file's size, and the module's size shrunk with esbuild if it is installed
// (npm install --prefix ../../../tools).
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const dir = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const repo = path.resolve(dir, '../../..');
const ID = 'finale-opening', PAGE = 'Finale_Opening_Cutscene.html', TITLE = "The finale's opening";
// in the order they must be defined (each is one function, so the order only matters for reading)
const PARTS = ['copies/cinema.js', 'copies/io-cutscene.js', 'copies/sol.js', 'copies/halcyon.js', 'copies/noctara.js',
  'src/moonwell.js', 'src/cast.js', 'src/words.js', 'src/scene.js', 'src/sound.js', 'src/player.js'];
const read = (p) => fs.readFileSync(path.join(dir, p), 'utf8');
let mod = '// ' + ID + '.js: the cutscene "' + TITLE + '", for the game: window.CUTSCENES[\'' + ID + '\'] = { title, seconds, play(container, opts), prepare(container, opts) }.\n' +
  '// Built by tools/build.mjs from copies/ and src/ (edit those, not this). Needs three.js r128 (global THREE). See README.md.\n' +
  '(function () {\n';
for (const p of PARTS) mod += '\n/* ---------- ' + p + ' ---------- */\n' + read(p).replace(/\s+$/, '') + '\n';
mod += '\nwindow.CUTSCENES = window.CUTSCENES || {};\n' +
  'window.CUTSCENES[\'' + ID + '\'] = makeCutscene({ id: \'' + ID + '\', title: ' + JSON.stringify(TITLE) + ', scene: cutsceneScene, words: cutsceneWords, place: cutscenePlace, cast: cutsceneCast, sound: makeMoonwellSounds, sfx: (snd) => ({ play: (id, o) => snd.play(id, o) }) });\n' +
  '})();\n';
fs.writeFileSync(path.join(dir, ID + '.js'), mod);
const kb = (n) => (n / 1024).toFixed(0) + ' KB';
console.log('wrote ' + ID + '.js (' + kb(Buffer.byteLength(mod)) + ')');
try {
  const require = createRequire(path.join(repo, 'tools', 'package.json'));
  const esbuild = require('esbuild');
  const min = esbuild.transformSync(mod, { minify: true, target: 'es2019' }).code;
  const zlib = await import('zlib');
  console.log('  shrunk with esbuild: ' + kb(Buffer.byteLength(min)) + ', and ' + kb(zlib.gzipSync(min).length) + ' compressed');
} catch (e) { console.log('  (esbuild not installed: npm install --prefix tools, from the repository\'s top folder, to see the shrunk size)'); }

// the page: the game's two fonts inside (the game's offline build does the same), so it needs nothing from the web but three.js
const NM = path.join(repo, 'tools', 'node_modules', '@fontsource');
const face = (family, file, weight, style) => {
  const f = path.join(NM, file); if (!fs.existsSync(f)) return '';
  return '@font-face{font-family:"' + family + '";font-style:' + style + ';font-weight:' + weight + ';font-display:swap;src:url(data:font/woff2;base64,' + fs.readFileSync(f).toString('base64') + ') format("woff2")}';
};
const fonts = [face('IM Fell English', 'im-fell-english/files/im-fell-english-latin-400-normal.woff2', 400, 'normal'),
  face('IM Fell English', 'im-fell-english/files/im-fell-english-latin-400-italic.woff2', 400, 'italic'),
  face('Atkinson Hyperlegible', 'atkinson-hyperlegible/files/atkinson-hyperlegible-latin-400-normal.woff2', 400, 'normal'),
  face('Atkinson Hyperlegible', 'atkinson-hyperlegible/files/atkinson-hyperlegible-latin-700-normal.woff2', 700, 'normal')].join('\n');
if (!fonts.trim()) console.log('  (the fonts are not installed: npm install --prefix tools; the page falls back to Georgia and the system face)');
let html = read('src/page.html');
html = html.replace('/*FONTS*/', fonts).replace('/*CSS*/', read('src/page.css'));
html = html.replace('<script src="./' + ID + '.js"></script>', () => '<script>\n' + mod.replace(/<\/script/gi, '<\\/script') + '</script>');
html = html.replace('<script src="./page.js"></script>', () => '<script>\n' + read('src/page.js').replace(/<\/script/gi, '<\\/script') + '</script>');
if (/src="\.\//.test(html)) throw new Error('a local file was not put inside the page');
fs.writeFileSync(path.join(dir, PAGE), html);
console.log('wrote ' + PAGE + ' (' + kb(Buffer.byteLength(html)) + ')');
const art = process.argv[2];
if (art) {
  const body = html.replace(/^[\s\S]*?<head>\s*/, '').replace(/<meta charset="utf-8">\s*<meta name="viewport"[^>]*>\s*/, '').replace(/<\/head>\s*<body>\s*/, '\n').replace(/\s*<\/body>\s*<\/html>\s*$/, '\n');
  fs.writeFileSync(art, body); console.log('wrote ' + art + ' (' + kb(Buffer.byteLength(body)) + ')');
}
