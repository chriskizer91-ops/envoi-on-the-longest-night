// build.mjs: builds the scene test into one file. Local scripts and the stylesheet go inside the page, Io's portrait
// goes in as a data address; three.js stays a cdnjs <script> tag and the fonts come from Google Fonts, as for every page
// in the project. Usage, from this folder: node tools/build.mjs [artifactOut]. Writes Prologue_In_Ios_Garden.html here;
// with artifactOut, also the same page without its outer document tags, for publishing.
import fs from 'fs';
import path from 'path';
const dir = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const portrait = 'data:image/webp;base64,' + fs.readFileSync(path.join(dir, 'portrait-io.webp')).toString('base64');
let html = fs.readFileSync(path.join(dir, 'cutscene.html'), 'utf8');
html = html.replace(/<script src="(\.\/[^"]+\.js)"><\/script>/g, (m, p) => {
  let js = fs.readFileSync(path.resolve(dir, p), 'utf8').replace(/<\/script/gi, '<\\/script');
  js = js.split("'./portrait-io.webp'").join("'" + portrait + "'");
  return '<script>\n/* 3d-cutscenes/' + p.slice(2) + ' */\n' + js + '\n</script>';
});
html = html.replace(/<link rel="stylesheet" href="(\.\/[^"]+\.css)">/g, (m, p) => '<style>\n' + fs.readFileSync(path.resolve(dir, p), 'utf8') + '\n</style>');
if (html.includes('./portrait-io.webp')) throw new Error('the portrait was not put inside the page');
const out = path.join(dir, 'Prologue_In_Ios_Garden.html');
fs.writeFileSync(out, html);
console.log('wrote ' + path.relative(process.cwd(), out) + ' (' + (html.length / 1024).toFixed(0) + ' KB)');
const art = process.argv[2];
if (art) {
  const body = html.replace(/^[\s\S]*?<head>\s*/, '').replace(/<meta charset="utf-8">\s*<meta name="viewport"[^>]*>\s*/, '').replace(/<\/head>\s*<body>\s*/, '\n').replace(/\s*<\/body>\s*<\/html>\s*$/, '\n');
  fs.writeFileSync(art, body); console.log('wrote ' + art + ' (' + (body.length / 1024).toFixed(0) + ' KB)');
}
