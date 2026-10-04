// Joins the model's parts (each a piece of one function's body, in file-name order) into ../colossus.js.
// Usage: node model/join.mjs   (from this folder or anywhere)
import fs from 'fs';
import path from 'path';
const dir = path.dirname(new URL(import.meta.url).pathname);
const parts = fs.readdirSync(dir).filter((f) => /^\d\d-.*\.js$/.test(f)).sort();
const out = parts.map((f) => fs.readFileSync(path.join(dir, f), 'utf8').replace(/\n*$/, '\n')).join('');
fs.writeFileSync(path.join(dir, '..', 'colossus.js'), out);
console.log('colossus.js', (out.length / 1024).toFixed(1) + ' KB from', parts.length, 'parts');
