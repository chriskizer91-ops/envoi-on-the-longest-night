// Builds each demo shell in demos/ into one self-contained page in dist/: local scripts and
// stylesheets are inlined, and image paths under art/ inside them become data URIs. three.js
// stays a cdnjs <script> tag. Usage: node tools/build.mjs [--min] [demos/name.html ...]  (default: all)
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const R = path.resolve(new URL('..', import.meta.url).pathname);
const MIME = { webp: 'image/webp', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg' };
function inlineArt(code) {
  return code.replace(/"(art\/[^"]+\.(webp|png|jpe?g))"/g, (m, p, ext) => {
    const f = path.join(R, p);
    if (!fs.existsSync(f)) return m;
    return '"data:' + MIME[ext] + ';base64,' + fs.readFileSync(f).toString('base64') + '"';
  });
}
// --min minifies each script with esbuild (the game's build, to stay inside a page's size); the source stays readable
const MIN = process.argv.includes('--min');
const args = process.argv.slice(2).filter((a) => a !== '--min');
const esbuild = MIN ? createRequire(import.meta.url)(path.join(R, 'tools/node_modules/esbuild')) : null;
const files = args.length ? args : fs.readdirSync(path.join(R, 'demos')).filter((f) => f.endsWith('.html')).map((f) => 'demos/' + f);
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
  const out = path.join(R, 'dist', path.basename(src));
  fs.writeFileSync(out, html);
  console.log(path.relative(R, out), (fs.statSync(out).size / 1048576).toFixed(2) + ' MB');
  // the Artifact publisher wraps the page in its own doctype, head and body, so that copy leaves them out
  const title = (html.match(/<title>[^<]*<\/title>/) || [''])[0];
  const art = title + '\n' + html
    .replace(/<title>[^<]*<\/title>\n?/, '')
    .replace(/<!doctype html>\n?|<html[^>]*>\n?|<\/html>\n?|<head>\n?|<\/head>\n?|<body>\n?|<\/body>\n?/gi, '')
    .replace(/<meta charset="utf-8">\n?|<meta name="viewport"[^>]*>\n?/g, '');
  const aout = path.join(R, 'dist', path.basename(src, '.html') + '.artifact.html');
  fs.writeFileSync(aout, art);
}
