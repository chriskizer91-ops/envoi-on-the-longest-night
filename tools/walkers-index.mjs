// walkers-index.mjs: lists every cut paper-doll sheet (art/walkers/<id>.avif or .webp, with the <id>.json that
// tools/cut-sheet.mjs writes) in src/walk/walkers.js, which the game and the demo pages load. Run it after cutting.
// Usage: node tools/walkers-index.mjs
import fs from 'fs';
import path from 'path';

const R = path.resolve(new URL('..', import.meta.url).pathname), dir = path.join(R, 'art/walkers');
const lines = [];
for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort()) {
  const id = f.slice(0, -5), m = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  const art = ['avif', 'webp'].map((x) => id + '.' + x).find((x) => fs.existsSync(path.join(dir, x)));
  if (!art) { console.error('no sheet for ' + id); process.exit(1); }
  // the art path in double quotes, so tools/build.mjs puts the picture inside the page
  const kind = m.still ? `still: { s: ${m.still.s}, w: ${m.still.w}, e: ${m.still.e}, n: ${m.still.n} }` : `stand: [${m.stand}]`;
  lines.push(`  ${id}: { src: "art/walkers/${art}", cols: ${m.cols}, rows: ${m.rows}, cell: [${m.cell}], foot: [${m.foot}], fig: ${m.fig}, ratio: ${m.ratio}, ${kind} },`);
}
const out = `// walkers.js: the painted paper dolls (art request 08), cut by tools/cut-sheet.mjs into even cells with the feet on one
// spot (foot), with the middle frame's height (fig) and the person's height beside Io's (ratio). Those who walk in the
// story's scenes have six frames in each of four rows (toward the viewer, left, right, away) and each row's standing
// frame (stand); everyone else stands in their place and only turns to talk, so theirs is one to three standing poses
// (still: the cell each facing shows). Written by tools/walkers-index.mjs; don't edit.
window.WALKERS = {
${lines.join('\n')}
};
`;
fs.writeFileSync(path.join(R, 'src/walk/walkers.js'), out);
console.log('src/walk/walkers.js: ' + lines.length + ' walkers');
