// One-time import: copies each model function and the Night square scene out of Chris's
// reference demos (reference/demos/*.html) into their own files, unchanged.
//   src/models/<id>.js            the working copy that touch-ups edit
//   src/models/originals/<id>.js  the untouched original, renamed make<Name>Original, for before/after
//   src/stage/night-square.js     the painting's camera, layout and lamp data
//   reference/art/backdrops/night-square.webp (the game's copy, art/backdrops/night-square.avif, is squeezed from it by
//   tools/compress.mjs --avif)
// Run from the repo root: node tools/import-models.mjs (existing working copies are kept; --force overwrites them)
import fs from 'fs';
const R = new URL('..', import.meta.url).pathname;
const read = (f) => fs.readFileSync(R + 'reference/demos/' + f, 'utf8').split('\n');
const ns = read('night-square-shadow-wraith.html');

// lines are 1-based [from, to] inclusive; each range is found by its first line, not by number
function slice(lines, startTest, endTest) {
  const a = lines.findIndex(startTest);
  if (a < 0) throw new Error('start not found');
  let b = a + 1; while (b < lines.length && !endTest(lines[b], b)) b++;
  return lines.slice(a, b);
}
const dedent = (L, n) => L.map((s) => (s.startsWith(' '.repeat(n)) ? s.slice(n) : s));
const header = (src) => `// Imported unchanged from reference/demos/${src}. three.js r128 (global THREE).\n`;

const models = {
  witch: { src: 'night-square-shadow-wraith.html', name: 'makeWitch', lines: dedent(slice(ns, (s) => s.startsWith('  function makeWitch() {'), (s) => s.startsWith('  function makeWraith() {')), 2) },
  wraith: { src: 'night-square-shadow-wraith.html', name: 'makeWraith', lines: dedent(slice(ns, (s) => s.startsWith('  function makeWraith() {'), (s) => s.startsWith('  function makeGoddess() {')), 2) },
  lunara: { src: 'night-square-shadow-wraith.html', name: 'makeGoddess', lines: dedent(slice(ns, (s) => s.startsWith('  function makeGoddess() {'), (s) => s.startsWith('  const $ = (id)')), 2) },
  sol: { src: 'sol-in-the-night-square.html', name: 'makeSol', lines: slice(read('sol-in-the-night-square.html'), (s) => s.startsWith('function makeSol('), (s) => s.startsWith('</script>')) },
  halcyon: { src: 'halcyon-in-the-night-square.html', name: 'makeHalcyon', lines: slice(read('halcyon-in-the-night-square.html'), (s) => s.startsWith('function makeHalcyon('), (s) => s.startsWith('function makeHalcyonV1(') || s.startsWith('</script>')) },
  envoi: { src: 'envoi-letter-wyrm-model-preview.html', name: 'makeEnvoi', lines: slice(read('envoi-letter-wyrm-model-preview.html'), (s) => s.startsWith('function makeEnvoi('), (s) => s.startsWith('</script>')) },
  noctara: { src: 'noctara-in-the-night-square.html', name: 'makeNoctara', lines: slice(read('noctara-in-the-night-square.html'), (s) => s.startsWith('function makeNoctara('), (s) => s.startsWith('</script>')) },
};
for (const [id, m] of Object.entries(models)) {
  while (m.lines.length && m.lines[m.lines.length - 1].trim() === '') m.lines.pop();
  const body = m.lines.join('\n') + '\n';
  if (!body.startsWith('function ' + m.name + '(')) throw new Error(id + ': unexpected start ' + body.slice(0, 40));
  // never overwrite a working copy: touch-ups live there. Pass --force to start a model over from its original.
  if (!fs.existsSync(R + `src/models/${id}.js`) || process.argv.includes('--force')) fs.writeFileSync(R + `src/models/${id}.js`, header(m.src) + body);
  fs.writeFileSync(R + `src/models/originals/${id}.js`, header(m.src) + body.replace('function ' + m.name + '(', 'function ' + m.name + 'Original('));
  console.log(id.padEnd(8), (body.length / 1024).toFixed(1) + ' KB');
}

// the Night square: painting, camera and layout
const layoutLine = ns.find((s) => s.includes('const LAYOUT = {'));
const LAYOUT = JSON.parse(layoutLine.slice(layoutLine.indexOf('{'), layoutLine.lastIndexOf('}') + 1));
const paintLine = ns.find((s) => s.includes("paintEl.src = 'data:image/webp;base64,"));
const b64 = paintLine.slice(paintLine.indexOf('base64,') + 7, paintLine.lastIndexOf("'"));
fs.writeFileSync(R + 'reference/art/backdrops/night-square.webp', Buffer.from(b64, 'base64'));
const scene = {
  id: 'night-square', name: 'The Night square', image: 'art/backdrops/night-square.avif',
  width: 1448, height: 1086, fov: 12, pitch: 24, ppm: 54,
  lamps: [0, 1, 2, 4, 5], layout: LAYOUT,
};
fs.writeFileSync(R + 'src/stage/night-square.js',
  '// The Night square painting: its matched camera (12° lens, 24° pitch, 54 painting pixels per meter),\n' +
  '// the foreground cutouts characters walk behind, and the lamps that light them. Imported from\n' +
  '// reference/demos/night-square-shadow-wraith.html. The build inlines `image` as a data URI.\n' +
  'window.SCENES = window.SCENES || {};\nwindow.SCENES[' + JSON.stringify(scene.id) + '] = ' + JSON.stringify(scene) + ';\n');
console.log('night-square.webp', (fs.statSync(R + 'reference/art/backdrops/night-square.webp').size / 1024).toFixed(0) + ' KB');
