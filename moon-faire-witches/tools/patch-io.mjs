// patch-io.mjs: makes build/io_plus.js, Moon Faire's Io at her light weights (witches/io_lod.js, unchanged) with the new
// moves of src/io-new-moves.frag.js added. Every place a piece goes must be found exactly once, or nothing is written.
// Usage: node moon-faire-witches/tools/patch-io.mjs
import fs from 'fs';
import path from 'path';
const D = path.resolve(new URL('..', import.meta.url).pathname);
let s = fs.readFileSync(path.join(D, 'witches/io_lod.js'), 'utf8');
const frag = fs.readFileSync(path.join(D, 'src/io-new-moves.frag.js'), 'utf8');
const [helpers, blocks] = frag.split('//@@BLOCKS@@');
const NEW = { e_throw: 1.5, e_raise: 2.4, e_grasp: 1.9, e_bless: 2.1, e_sky: 2.8, e_moon: 3.2 };
function rep(a, b) {
  const n = s.split(a).length - 1;
  if (n !== 1) throw new Error('found ' + n + ' times: ' + a.slice(0, 80));
  s = s.replace(a, () => b);
}
rep("hit: 1.6, down: 5.6, win: 3.8 }", "hit: 1.6, down: 5.6, win: 3.8, " + Object.entries(NEW).map(([k, v]) => k + ': ' + v).join(', ') + " }");
rep("'cradle', 'hit', 'down', 'win'],", "'cradle', 'hit', 'down', 'win', " + Object.keys(NEW).concat(['e_guard']).map((k) => "'" + k + "'").join(', ') + "],");
rep("'thorn', 'revive', 'cradle'];", "'thorn', 'revive', 'cradle', " + Object.keys(NEW).map((k) => "'" + k + "'").join(', ') + "];");
rep("  // one frame of a move: returns her face { eyes, mouth }\n  function body(N, T, dt) {",
  "  // ---- new moves (moon-faire-witches/src/io-new-moves.frag.js) ----\n" + helpers.split('\n').filter((l) => !l.startsWith('//')).map((l) => '  ' + l).join('\n') +
  "\n  // one frame of a move: returns her face { eyes, mouth }\n  function body(N, T, dt) {");
rep("    // ----- Silverleaf Salve (H5, H6, I1)", "    // ---- new moves (moon-faire-witches/src/io-new-moves.frag.js) ----\n" + blocks.replace(/^\n+/, '') + "    // ----- Silverleaf Salve (H5, H6, I1)");
fs.mkdirSync(path.join(D, 'build'), { recursive: true });
fs.writeFileSync(path.join(D, 'build/io_plus.js'), s);
console.log('build/io_plus.js', (s.length / 1024).toFixed(0) + ' KB, new moves:', Object.keys(NEW).concat(['e_guard']).join(' '));
