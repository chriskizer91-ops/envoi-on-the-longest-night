// make-zones.mjs: writes the zone pages of the 3D game (world3d/game/zone-<n>.html) from game/zones.js, each with
// whichever of its places are built in 3D (places/<id>.js, and places/<id>-trees.js when there is one), and each page's
// art list (game/zone-<n>-art.js: every texture picture its places use, named from game/, so the offline build finds
// them and puts them inside the file; the places name them from world3d/, one folder up). Run it again whenever a place
// is added or the zones are regrouped.
// Usage: node moon-faire-witches/world3d/tools/make-zones.mjs
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import crypto from 'crypto';
const D = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');   // world3d/
const MF = path.resolve(D, '..');                                                    // moon-faire-witches/
const box = { window: {} }; vm.runInNewContext(fs.readFileSync(path.join(D, 'game/zones.js'), 'utf8'), box);
const ZONES = box.window.W3D_ZONES;

const page = (n, Z, ids) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">
<title>Envoi in 3D: ${Z.name}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&family=Atkinson+Hyperlegible:wght@400;700&display=swap">
<link rel="stylesheet" href="./zone.css">
</head>
<body>
<!-- zone-${n}.html: made by world3d/tools/make-zones.mjs from game/zones.js (do not edit by hand). Its places: ${ids.join(', ') || 'none built yet'} -->
<div id="world"><canvas id="cv"></canvas><div id="ring"><div id="dot"></div></div>
  <button id="guide" aria-label="Show the painting from above"><svg viewBox="0 0 24 24" fill="none" stroke="#eee8ff" stroke-width="1.7" stroke-linejoin="round"><path d="M3 6.5 9 4l6 2.5L21 4v13.5L15 20l-6-2.5L3 20z"/><path d="M9 4v13.5M15 6.5V20"/></svg></button>
  <button id="again">Start again</button>
  <div id="numbers"></div><div id="toast"></div>
  <div id="card" class="card" role="dialog" aria-live="polite"><img id="cardpic" alt=""><div><b id="cardname"></b><p id="cardlook"></p></div></div>
  <div id="magpie" class="card" role="dialog" aria-live="polite"><div><b>The Magpie</b><p>Flying comes next.</p></div></div></div>
<div id="fade"><h1 id="fadename"></h1></div>
<div id="load"><div><h1>${Z.name}</h1><p id="loadmsg">Loading…</p></div></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="../../witches/meshopt_simplifier.js"></script>
<script src="../../witches/palette.js"></script>
<script src="../../witches/io_tex.js"></script>
<script src="../../build/io_plus.js"></script>
<script src="../../witches/witch_levels.js"></script>
<script src="../../src/moon-io.js"></script>
<script src="../../src/flipbook.js"></script>
<script src="../../../src/game/maps.js"></script>
<script src="../../../envoi-final-draft/items/items.js"></script>
<script src="../engine/core.js"></script>
<script src="../engine/paint.js"></script>
<script src="../engine/world.js"></script>
<script src="../engine/walker.js"></script>
<script src="./zones.js"></script>
<script src="./zone-${n}-art.js"></script>
${ids.map((id) => `<script src="../places/${id}.js"></script>` + (fs.existsSync(path.join(D, 'places', id + '-trees.js')) ? `\n<script src="../places/${id}-trees.js"></script>` : '')).join('\n')}
<script src="./zone.js"></script>
<script>
// zone ${n}: ${Z.name} (the 3D game, world3d/game/README.md)
W3D.zone(${n}).catch((e) => { console.error(e); document.getElementById('loadmsg').textContent = 'Something went wrong: ' + e.message; });
</script>
</body>
</html>
`;

for (const n of Object.keys(ZONES)) {
  const Z = ZONES[n], ids = Z.places.filter((id) => fs.existsSync(path.join(D, 'places', id + '.js')));
  // every texture picture the places name (as "./../texture-packs/..."), once each by its content
  const files = [], key = {}, byHash = {};
  for (const id of ids) {
    const src = fs.readFileSync(path.join(D, 'places', id + '.js'), 'utf8');
    // a stand-in is carried only where a texture needs it: where its own made texture isn't here (the reskin job,
    // November 17; a stand-in can serve another texture too, as the oak's bark does the northern camp's pines)
    const unused = new Set(), needed = new Set();
    for (const t of src.matchAll(/made: "\.\/\.\.\/(texture-packs\/[^"]+)", stand: "\.\/\.\.\/(texture-packs\/[^"]+)"/g)) (fs.existsSync(path.join(MF, t[1])) ? unused : needed).add(t[2]);
    for (const m of src.matchAll(/"\.\/\.\.\/(texture-packs\/[^"]+\.(?:png|jpe?g|webp|avif))"/g)) {
      const p = m[1], f = path.join(MF, p);
      if (key[p] != null || !fs.existsSync(f)) continue;
      if (unused.has(p) && !needed.has(p)) continue;
      const h = crypto.createHash('sha1').update(fs.readFileSync(f)).digest('hex');
      if (byHash[h] == null) { byHash[h] = files.length; files.push(p); }
      key[p] = byHash[h];
    }
  }
  const art = `// zone-${n}-art.js: made by world3d/tools/make-zones.mjs (do not edit by hand). The texture pictures of zone ${n}'s places,
// each named from this folder so the offline build puts it inside the file (zone.js reads them by the places' own paths).
(function (G) {
  const F = [
${files.map((p) => `    "./../../${p}",`).join('\n')}
  ];
  G.W3D_ART = {
${Object.keys(key).map((p) => `    '${p}': F[${key[p]}],`).join('\n')}
  };
})(window);
`;
  fs.writeFileSync(path.join(D, 'game', `zone-${n}-art.js`), art);
  fs.writeFileSync(path.join(D, 'game', `zone-${n}.html`), page(n, Z, ids));
  const bytes = files.reduce((a, p) => a + fs.statSync(path.join(MF, p)).size, 0);
  console.log(`zone ${n} (${Z.name}): ${ids.length} of ${Z.places.length} places built (${ids.join(', ') || 'none'}); ` +
    `${files.length} texture pictures (${(bytes / 1048576).toFixed(1)} MB), ${Object.keys(key).length} names`);
}
