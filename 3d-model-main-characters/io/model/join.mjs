// join.mjs: writes ../io.js from the numbered parts in this folder, in order. Usage: node join.mjs
import fs from 'fs';
import path from 'path';
const dir = path.dirname(new URL(import.meta.url).pathname);
const parts = fs.readdirSync(dir).filter((f) => /^\d\d-.*\.js$/.test(f)).sort();
const out = parts.map((f) => fs.readFileSync(path.join(dir, f), 'utf8').replace(/\s+$/, '')).join('\n') + '\n';
fs.writeFileSync(path.join(dir, '../io.js'), out);
console.log('io.js: ' + parts.length + ' parts, ' + (out.length / 1024).toFixed(1) + ' KB');
