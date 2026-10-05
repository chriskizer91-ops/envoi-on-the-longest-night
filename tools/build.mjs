// Builds each demo shell in demos/ into one self-contained page in dist/: local scripts and
// stylesheets are inlined, and image paths under art/ inside them become data URIs, as do "./" image paths, read from
// the page's own folder (a demo's own test pictures, which stay out of the game's art/). Chris's songs (art/music/*.webm)
// go inside the page too. A page can name art folders to keep beside the copy to publish instead, to stay under the 16 MB
// a published page may be: <meta name="beside" content="art/music art/keepsakes"> (the game: its songs and the
// keepsakes' pictures). Its <name>.artifact.html then reads them from beside it (ART_BASE ''): publish it with the files
// <name>.beside.json lists, at the same paths. Every other page has everything inside. three.js
// stays a cdnjs <script> tag, and the fonts come from Google Fonts, unless --offline puts them inside
// the page too (the file Chris keeps, which must work with no internet).
// --split leaves the art out of the page instead: it stays art/... beside it, copied into dist/<name>-split/ (the
// published game, which is over the 16 MB a published page may be: a small page with its pictures as files beside it).
// Usage: node tools/build.mjs [--min] [--offline] [--split] [demos/name.html ...]  (default: every demo, and the game
// from putting-it-all-together/, which Mooncart's collect-games picks up as dist/game.html)
// It fails (exit 1, every page still written) on art left outside a page: a path in single quotes or backticks, or one
// naming a file that isn't there, stays a path the page would look for beside itself (only --split leaves art outside on
// purpose). And on sizes, counted in bytes, for the pages it is given by name (as each README builds a page to publish):
// a copy to publish over the 16,000,000 a published page may be; with --offline, the file Chris keeps over his 30 MB
// (30,000,000), its copy to publish then being one never to publish. Building every page (no page named: Mooncart's build,
// which takes the full pages) it prints a size over a limit without failing on it (the game is published from --min).
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const R = path.resolve(new URL('..', import.meta.url).pathname);
const MIME = { webp: 'image/webp', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', avif: 'image/avif', webm: 'audio/webm' };
const SPLIT = process.argv.includes('--split'), used = new Set(), beside = new Set();
// a file from a folder the page keeps beside it stays a marked path until the two copies are written: inside the page,
// or beside the published copy
const MARK = '@@beside@@', MARK_RE = /@@beside@@(art\/[^"'`]+\.(webp|png|jpe?g|avif|webm))/g;
let besideDirs = [];
function inlineArt(code, dir) {
  return code.replace(/"((?:art\/|\.\/)[^"]+\.(webp|png|jpe?g|avif|webm))"/g, (m, p, ext) => {
    const own = p.startsWith('./'), f = own ? path.resolve(dir, p) : path.join(R, p);
    if (!fs.existsSync(f)) return m;
    if (SPLIT && !own) { used.add(p); return m; }
    if (!own && besideDirs.some((d) => p.startsWith(d + '/'))) { beside.add(p); return '"' + MARK + p + '"'; }
    return '"data:' + MIME[ext] + ';base64,' + fs.readFileSync(f).toString('base64') + '"';
  });
}
// --min minifies each script with esbuild (the game's build, to stay inside a page's size); the source stays readable
const MIN = process.argv.includes('--min'), OFFLINE = process.argv.includes('--offline');
const PAGE_MAX = 16000000, KEEP_MAX = 30000000, problems = [], notes = [], bytes = (n) => n.toLocaleString('en-US') + ' bytes';
// an art path the build left as a path: quoted ('…', "…" or `…`) or in a stylesheet's url(…), not one marked to go
// beside the published copy. It is looked for in what the page will read: its scripts without their comments and its
// markup and styles without theirs, since a comment may name an example path (stills.js does)
const NM_ESBUILD = path.join(R, 'tools/node_modules/esbuild');
let esb; // esbuild, once looked for: null when it isn't installed
// a script without its comments: as esbuild leaves it (every string kept), when it is installed. A plain build needs
// nothing installed (Mooncart builds this repository with plain `node tools/build.mjs` in a fresh clone, no npm install),
// so without it a simpler rule takes them out: strings, /* */ and // comments matched from the left, so a quote or a //
// inside a string stays. Only a regex literal holding a quote or // can fool it. (Each pattern loops rather than
// recursing, so a string of many megabytes, such as a picture inside the page, can't run it out of stack)
function noComments(js) {
  if (esb === undefined) { try { esb = createRequire(import.meta.url)(NM_ESBUILD); } catch (e) { esb = null; } }
  if (esb) { try { return esb.transformSync(js, { minify: true, legalComments: 'none' }).code; } catch (e) { /* not a plain script: the simpler rule */ } }
  return js.replace(/("[^"\\\n]*(?:\\.[^"\\\n]*)*"|'[^'\\\n]*(?:\\.[^'\\\n]*)*'|`[^`\\]*(?:\\.[^`\\]*)*`)|\/\*[^*]*\*+(?:[^/*][^*]*\*+)*\/|\/\/[^\n]*/g, (m, str) => str || ' ');
}
function readable(html) {
  const code = [];
  const markup = html.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, (m, js) => { code.push(noComments(js)); return ''; });
  return code.concat(markup.replace(/<!--[\s\S]*?-->/g, '').replace(/\/\*[\s\S]*?\*\//g, '')).join('\n');
}
const LEFT_RE = /(["'`])((?:\.{1,2}\/)*art\/[^"'`\s]*?\.(?:webp|png|jpe?g|avif|webm)|\.\/[^"'`\s]*?\.(?:webp|png|jpe?g|avif|webm))\1|url\(\s*((?:\.{1,2}\/)*art\/[^)"'\s]+?\.(?:webp|png|jpe?g|avif|webm))\s*\)/g;
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
const esbuild = MIN ? createRequire(import.meta.url)(NM_ESBUILD) : null;
const over = (p) => (args.length ? problems : notes).push(p);
const files = args.length ? args : fs.readdirSync(path.join(R, 'demos')).filter((f) => f.endsWith('.html')).map((f) => 'demos/' + f)
  .concat('putting-it-all-together/game.html');
fs.mkdirSync(path.join(R, 'dist'), { recursive: true });
for (const rel of files) {
  const src = path.resolve(R, rel), dir = path.dirname(src);
  let html = fs.readFileSync(src, 'utf8');
  besideDirs = ((html.match(/<meta name="beside" content="([^"]*)">/) || [])[1] || '').split(/\s+/).filter(Boolean);
  html = html.replace(/<meta name="beside" content="[^"]*">\n?/, '');
  html = html.replace(/<script src="(\.\.?\/[^"]+\.js)"><\/script>/g, (m, p) => {
    let code = inlineArt(fs.readFileSync(path.resolve(dir, p), 'utf8'), dir);
    if (esbuild) code = esbuild.transformSync(code, { minify: true, target: 'es2019', legalComments: 'none' }).code;
    return '<script>\n/* ' + path.relative(R, path.resolve(dir, p)) + ' */\n' + code.replace(/<\/script/gi, '<\\/script') + '\n</script>';
  });
  html = html.replace(/<link rel="stylesheet" href="(\.\.?\/[^"]+\.css)">/g, (m, p) => '<style>\n' + fs.readFileSync(path.resolve(dir, p), 'utf8') + '\n</style>');
  if (OFFLINE) html = offline(html);
  if (!SPLIT) {
    const left = [...new Set([...readable(html).matchAll(LEFT_RE)].map((m) => m[2] || m[3]))];
    if (left.length) problems.push(rel + ': art left outside the page, which would look for it beside itself: ' + left.join(', ') + ' (only a path in double quotes, to a file that is there, goes inside the page, or beside its published copy in a folder its <meta name="beside"> names)');
  }
  // split: the page's art paths stay as they are, read from beside the page (ART_BASE '')
  if (SPLIT) html = html.replace(/<body>\n?/, (b) => b + '<script>window.ART_BASE = \'\';</script>\n');
  const dir_ = SPLIT ? path.join(R, 'dist', path.basename(src, '.html') + '-split') : path.join(R, 'dist');
  fs.mkdirSync(dir_, { recursive: true });
  const out = path.join(dir_, path.basename(src));
  fs.writeFileSync(out, html.replace(MARK_RE, (m, p, ext) => 'data:' + MIME[ext] + ';base64,' + fs.readFileSync(path.join(R, p)).toString('base64')));
  const size = fs.statSync(out).size;
  console.log(path.relative(R, out), (size / 1048576).toFixed(2) + ' MB' + (OFFLINE ? ' (' + bytes(size) + ', the file to keep: up to ' + bytes(KEEP_MAX) + ')' : ''));
  if (OFFLINE && size > KEEP_MAX) over(path.relative(R, out) + ' is ' + bytes(size) + ': over the ' + bytes(KEEP_MAX) + ' (30 MB) the file Chris keeps may be');
  // the copy to publish: its songs and keepsake pictures beside it, read from beside the page (ART_BASE '')
  let pub = html.replace(MARK_RE, (m, p) => p);
  if (beside.size && !SPLIT) pub = pub.replace(/<body>\n?/, (b) => b + '<script>window.ART_BASE = \'\';</script>\n');
  // the Artifact publisher wraps the page in its own doctype, head and body, so that copy leaves them out
  const title = (pub.match(/<title>[^<]*<\/title>/) || [''])[0];
  const art = title + '\n' + pub
    .replace(/<title>[^<]*<\/title>\n?/, '')
    .replace(/<!doctype html>\n?|<html[^>]*>\n?|<\/html>\n?|<head>\n?|<\/head>\n?|<body>\n?|<\/body>\n?/gi, '')
    .replace(/<meta charset="utf-8">\n?|<meta name="viewport"[^>]*>\n?/g, '');
  const aout = path.join(dir_, path.basename(src, '.html') + '.artifact.html');
  fs.writeFileSync(aout, art);
  const asize = fs.statSync(aout).size;
  console.log('  ' + path.relative(R, aout) + ': ' + bytes(asize) + (OFFLINE ? ' (an --offline build’s: never publish it)' : ', to publish (up to ' + bytes(PAGE_MAX) + ')'));
  if (!OFFLINE && asize > PAGE_MAX) over(path.relative(R, aout) + ' is ' + bytes(asize) + ': over the ' + bytes(PAGE_MAX) + ' a published page may be');
  if (beside.size) {
    const list = [...beside].sort(), total = list.reduce((a, p) => a + fs.statSync(path.join(R, p)).size, 0);
    fs.writeFileSync(path.join(dir_, path.basename(src, '.html') + '.beside.json'), JSON.stringify(list, null, 1));
    console.log('  ' + path.relative(R, aout) + ': ' + list.length + ' files to publish beside it (' + besideDirs.join(', ') + '), ' + (total / 1048576).toFixed(2) + ' MB (listed in ' + path.basename(src, '.html') + '.beside.json)');
    beside.clear();
  }
  if (SPLIT) {
    let total = 0;
    for (const p of used) { const to = path.join(dir_, p); fs.mkdirSync(path.dirname(to), { recursive: true }); fs.copyFileSync(path.join(R, p), to); total += fs.statSync(to).size; }
    fs.writeFileSync(path.join(dir_, 'files.json'), JSON.stringify([...used].sort(), null, 1));
    console.log('  ' + used.size + ' art files beside it, ' + (total / 1048576).toFixed(2) + ' MB (listed in files.json)');
    used.clear();
  }
}
for (const p of notes) console.log('! ' + p + ' (building every page, this doesn’t stop the build: build the page by name to publish it)');
for (const p of problems) console.log('✗ ' + p);
if (problems.length) process.exitCode = 1;
