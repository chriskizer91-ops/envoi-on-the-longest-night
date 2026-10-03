// Builds each demo shell in demos/ into one self-contained page in dist/: local scripts and
// stylesheets are inlined, and image paths under art/ inside them become data URIs. three.js
// stays a cdnjs <script> tag, and the fonts come from Google Fonts, unless --offline puts them inside
// the page too (the file Chris keeps, which must work with no internet).
// --split leaves the art out of the page instead: it stays art/... beside it, copied into dist/<name>-split/ (the
// published game, which is over the 16 MB a published page may be: a small page with its pictures as files beside it).
// Usage: node tools/build.mjs [--min] [--offline] [--split] [demos/name.html ...]  (default: every demo, and the game
// from putting-it-all-together/, which Mooncart's collect-games picks up as dist/game.html)
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const R = path.resolve(new URL('..', import.meta.url).pathname);
const MIME = { webp: 'image/webp', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg' };
const SPLIT = process.argv.includes('--split'), used = new Set();
function inlineArt(code) {
  return code.replace(/"(art\/[^"]+\.(webp|png|jpe?g))"/g, (m, p, ext) => {
    const f = path.join(R, p);
    if (!fs.existsSync(f)) return m;
    if (SPLIT) { used.add(p); return m; }
    return '"data:' + MIME[ext] + ';base64,' + fs.readFileSync(f).toString('base64') + '"';
  });
}
// --min minifies each script with esbuild (the game's build, to stay inside a page's size); the source stays readable
const MIN = process.argv.includes('--min'), OFFLINE = process.argv.includes('--offline');
const args = process.argv.slice(2).filter((a) => a !== '--min' && a !== '--offline' && a !== '--split');
const NM = path.join(R, 'tools/node_modules');
// --offline: three.js r128 and the two fonts (IM Fell English, Atkinson Hyperlegible) from npm, inside the page
function offline(html) {
  const three = fs.readFileSync(path.join(NM, 'three/build/three.min.js'), 'utf8');
  html = html.replace(/<script src="https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/three\.js\/r128\/three\.min\.js"><\/script>/, () => '<script>\n/* three.js r128 */\n' + three.replace(/<\/script/gi, '<\\/script') + '\n</script>');
  const face = (family, file, weight, style) => '@font-face{font-family:"' + family + '";font-style:' + style + ';font-weight:' + weight + ';font-display:swap;src:url(data:font/woff2;base64,' +
    fs.readFileSync(path.join(NM, '@fontsource', file)).toString('base64') + ') format("woff2")}';
  const fonts = [
    face('IM Fell English', 'im-fell-english/files/im-fell-english-latin-400-normal.woff2', 400, 'normal'),
    face('IM Fell English', 'im-fell-english/files/im-fell-english-latin-400-italic.woff2', 400, 'italic'),
    face('Atkinson Hyperlegible', 'atkinson-hyperlegible/files/atkinson-hyperlegible-latin-400-normal.woff2', 400, 'normal'),
    face('Atkinson Hyperlegible', 'atkinson-hyperlegible/files/atkinson-hyperlegible-latin-700-normal.woff2', 700, 'normal'),
  ].join('\n');
  html = html.replace(/<link rel="preconnect"[^>]*>\n?/g, '').replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^"]*">/, () => '<style>\n' + fonts + '\n</style>');
  // anything still fetched from the web (the w3.org names are namespaces, not addresses)
  const left = html.replace(/data:[^"')]+/g, '').match(/https?:\/\/(?!www\.w3\.org)[^\s"'<>)]+/g);
  if (left) console.log('  note: the page still names ' + left.length + ' web addresses, such as ' + left[0]);
  return html;
}
const esbuild = MIN ? createRequire(import.meta.url)(path.join(R, 'tools/node_modules/esbuild')) : null;
const files = args.length ? args : fs.readdirSync(path.join(R, 'demos')).filter((f) => f.endsWith('.html')).map((f) => 'demos/' + f)
  .concat('putting-it-all-together/game.html');
fs.mkdirSync(path.join(R, 'dist'), { recursive: true });
for (const rel of files) {
  const src = path.resolve(R, rel), dir = path.dirname(src);
  let html = fs.readFileSync(src, 'utf8');
  html = html.replace(/<script src="(\.\.?\/[^"]+\.js)"><\/script>/g, (m, p) => {
    let code = inlineArt(fs.readFileSync(path.resolve(dir, p), 'utf8'));
    if (esbuild) code = esbuild.transformSync(code, { minify: true, target: 'es2019', legalComments: 'none' }).code;
    return '<script>\n/* ' + path.relative(R, path.resolve(dir, p)) + ' */\n' + code.replace(/<\/script/gi, '<\\/script') + '\n</script>';
  });
  html = html.replace(/<link rel="stylesheet" href="(\.\.?\/[^"]+\.css)">/g, (m, p) => '<style>\n' + fs.readFileSync(path.resolve(dir, p), 'utf8') + '\n</style>');
  if (OFFLINE) html = offline(html);
  // split: the page's art paths stay as they are, read from beside the page (ART_BASE '')
  if (SPLIT) html = html.replace(/<body>\n?/, (b) => b + '<script>window.ART_BASE = \'\';</script>\n');
  const dir_ = SPLIT ? path.join(R, 'dist', path.basename(src, '.html') + '-split') : path.join(R, 'dist');
  fs.mkdirSync(dir_, { recursive: true });
  const out = path.join(dir_, path.basename(src));
  fs.writeFileSync(out, html);
  console.log(path.relative(R, out), (fs.statSync(out).size / 1048576).toFixed(2) + ' MB');
  // the Artifact publisher wraps the page in its own doctype, head and body, so that copy leaves them out
  const title = (html.match(/<title>[^<]*<\/title>/) || [''])[0];
  const art = title + '\n' + html
    .replace(/<title>[^<]*<\/title>\n?/, '')
    .replace(/<!doctype html>\n?|<html[^>]*>\n?|<\/html>\n?|<head>\n?|<\/head>\n?|<body>\n?|<\/body>\n?/gi, '')
    .replace(/<meta charset="utf-8">\n?|<meta name="viewport"[^>]*>\n?/g, '');
  const aout = path.join(dir_, path.basename(src, '.html') + '.artifact.html');
  fs.writeFileSync(aout, art);
  if (SPLIT) {
    let bytes = 0;
    for (const p of used) { const to = path.join(dir_, p); fs.mkdirSync(path.dirname(to), { recursive: true }); fs.copyFileSync(path.join(R, p), to); bytes += fs.statSync(to).size; }
    fs.writeFileSync(path.join(dir_, 'files.json'), JSON.stringify([...used].sort(), null, 1));
    console.log('  ' + used.size + ' art files beside it, ' + (bytes / 1048576).toFixed(2) + ' MB (listed in files.json)');
    used.clear();
  }
}
