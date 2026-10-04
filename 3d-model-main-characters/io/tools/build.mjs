// build.mjs: builds the study page into one file. Local scripts and the stylesheet are put inside the page; three.js
// stays a cdnjs <script> tag and the fonts come from Google Fonts, as for every page in the project.
// Usage: node tools/build.mjs [artifactOut]   (from this folder's parent, io/). Writes Io_Main_Character_Study.html
// beside study.html; with artifactOut, also the same page without its outer document tags, for publishing.
import fs from 'fs';
import path from 'path';
const dir = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
execJoin();
let html = fs.readFileSync(path.join(dir, 'study.html'), 'utf8');
html = html.replace(/<script src="(\.\.?\/[^"]+\.js)"><\/script>/g, (m, p) => '<script>\n/* ' + path.relative(path.resolve(dir, '../..'), path.resolve(dir, p)) + ' */\n' + fs.readFileSync(path.resolve(dir, p), 'utf8').replace(/<\/script/gi, '<\\/script') + '\n</script>');
html = html.replace(/<link rel="stylesheet" href="(\.\/[^"]+\.css)">/g, (m, p) => '<style>\n' + fs.readFileSync(path.resolve(dir, p), 'utf8') + '\n</style>');
const out = path.join(dir, 'Io_Main_Character_Study.html');
fs.writeFileSync(out, html);
console.log('wrote ' + path.relative(process.cwd(), out) + ' (' + (html.length / 1024).toFixed(0) + ' KB)');
const art = process.argv[2];
if (art) {
 const body = html.replace(/^[\s\S]*?<head>\s*/, '').replace(/<meta charset="utf-8">\s*<meta name="viewport"[^>]*>\s*/, '').replace(/<\/head>\s*<body>\s*/, '\n').replace(/\s*<\/body>\s*<\/html>\s*$/, '\n');
 fs.writeFileSync(art, body); console.log('wrote ' + art + ' (' + (body.length / 1024).toFixed(0) + ' KB)');
}
function execJoin() {
 const md = path.join(dir, 'model'), parts = fs.readdirSync(md).filter((f) => /^\d\d-.*\.js$/.test(f)).sort();
 fs.writeFileSync(path.join(dir, 'io.js'), parts.map((f) => fs.readFileSync(path.join(md, f), 'utf8').replace(/\s+$/, '')).join('\n') + '\n');
}
