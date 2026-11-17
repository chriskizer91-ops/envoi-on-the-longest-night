// make-places.mjs: the walking places as the 3D game builds them, taken down for the 3D map (Chris, November 17:
// the map should show each place as it really is, in less detail than the game).
// It builds every place with the game's own engine (moon-faire-witches/world3d/engine/, in a headless browser), and
// from each takes: the shape of its ground, where its cobbles, earth, paving and water lie, everything solid that
// stands in it (houses, walls, bridges, jetties, rocks, snow, ice: small things left out, heavy ones made lighter),
// its trees, each where the game has it, and its lamps. It writes
//   map/place-models.js                    what the map needs of each place, and the shapes themselves (packed)
//   art/aethermoor-place-layers.webp       the textures those places use, 128 x 128 squares, eight to a row
//   art/aethermoor-place-grounds.webp      for each place a square of where its cobbles (red), earth (green) and
//                                          paving (blue) lie, and under it a square of its water (white)
// Nothing is copied into the game or changed there: the 3D world's branch is only read.
// Usage: node moon-faire-witches/world-map/tools/make-places.mjs --src <a checkout of the 3D world's branch> [--made <folder of made textures>] [--only a,b]
import fs from 'fs'; import path from 'path'; import zlib from 'zlib'; import vm from 'vm'; import { fileURLToPath } from 'url'; import { createRequire } from 'module'; import { execSync } from 'child_process';
const HERE = path.dirname(fileURLToPath(import.meta.url)), JOB = path.join(HERE, '..'), R = path.join(JOB, '../..');
const sharp = createRequire(path.join(R, 'tools/'))('sharp'), { chromium } = createRequire('/opt/npm-tools/node_modules/')('playwright');
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const SRC = path.resolve(arg('--src') || R), W = path.join(SRC, 'moon-faire-witches/world3d'), MADE = arg('--made') ? path.resolve(arg('--made')) : path.join(SRC, 'moon-faire-witches/texture-packs/made');
const only = (arg('--only') || '').split(',').filter(Boolean);
const BK = 0.75, KX = 0.04 * BK, KZ = 0.05 * BK; // map units to a metre; to a painting's pixel across and down
const TILE = 128, GW = 256, GH = 192;
let from = ''; try { from = execSync('git -C ' + JSON.stringify(SRC) + ' rev-parse --short HEAD').toString().trim(); } catch (e) { /* not a checkout */ }

// where each place stands on the map, and how far it may spread before it would meet its neighbour
const G = {}; G.window = G; vm.runInNewContext(fs.readFileSync(path.join(JOB, 'map/places.js'), 'utf8'), G);
const AT = Object.fromEntries(Object.entries(G.MapPlaces.PLACES).map(([id, p]) => [id, p.at]));
const reach = (id) => { let d = 1e9; for (const k in AT) if (k !== id) d = Math.min(d, Math.max(Math.abs(AT[k][0] - AT[id][0]), Math.abs(AT[k][1] - AT[id][1]))); return Math.min(d * 0.5, 80); };

// the game's engine, with a little more handed back from a built place (the page's copy only; the files are not changed)
let world = fs.readFileSync(path.join(W, 'engine/world.js'), 'utf8');
const mark = 'return { scene, U, M, walkable, walkH, terrain,';
if (!world.includes(mark)) throw new Error('the 3D world\'s engine has changed: world.js no longer ends as this tool expects');
world = world.replace(mark, 'return { __EXT: [WX0, WY0, WX1, WY1], __MR: MR, __MAT: MAT, __WATER: WATER, __tex: tex, scene, U, M, walkable, walkH, terrain,');
const js = (f) => '<script>' + fs.readFileSync(f, 'utf8').replace(/<\/script/g, '<\\/script') + '</scr' + 'ipt>';
const placeFiles = fs.readdirSync(path.join(W, 'places')).filter((f) => f.endsWith('.js')).map((f) => path.join(W, 'places', f));
const html = '<!doctype html><canvas id="c" width="64" height="64"></canvas>' + [path.join(R, 'tools/node_modules/three/build/three.min.js'), path.join(SRC, 'moon-faire-witches/witches/meshopt_simplifier.js'), path.join(SRC, 'src/game/maps.js'), path.join(SRC, 'envoi-final-draft/items/items.js'), path.join(W, 'engine/core.js'), path.join(W, 'engine/paint.js')].map(js).join('') +
  '<script>' + world.replace(/<\/script/g, '<\\/script') + '</scr' + 'ipt>' + placeFiles.map(js).join('');
const tmp = path.join(fs.mkdtempSync('/tmp/make-places-'), 'page.html'); fs.writeFileSync(tmp, html);

// ---- in the page: build a place and take it down ----
async function take(id, lim, GW, GH) {
  const b64 = (a) => { const u = new Uint8Array(a.buffer, a.byteOffset, a.byteLength); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };
  const renderer = window.__r || (window.__r = new THREE.WebGLRenderer({ canvas: document.getElementById('c') }));
  await MeshoptSimplifier.ready;
  const place = window.W3D_PLACES[id], P = await W3D.buildPlace(place, renderer), M = P.M;
  // the ground taken: the game's own, no wider than the room the map has for it
  const E = P.__EXT, cx = place.size[0] / 2, cy = place.size[1] / 2;
  const rect = [Math.max(E[0], cx - lim[0]), Math.max(E[1], cy - lim[1]), Math.min(E[2], cx + lim[0]), Math.min(E[3], cy + lim[1])];
  const wm = (rect[2] - rect[0]) * M.SX, dm = (rect[3] - rect[1]) * M.SZ, cell = Math.max(1.3, Math.max(wm, dm) / 110), nx = Math.round(wm / cell), nz = Math.round(dm / cell);
  const inPoly = W3D.inPoly, water = (px, py) => P.__WATER.find((w) => px >= w.b[0] && px <= w.b[2] && py >= w.b[1] && py <= w.b[3] && inPoly(w.poly, px, py));
  // the ground's height at a spot, and whether water stands there (then the height is the water's top)
  const ground = (px, py) => { const t = P.terrain(px, py), w = water(px, py); if (w) { const l = w.level(py); if (t < l - 0.05) return [l, 1]; } return [t, 0]; };
  const H = new Int16Array((nx + 1) * (nz + 1));
  for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) H[j * (nx + 1) + i] = Math.round(ground(rect[0] + (rect[2] - rect[0]) * i / nx, rect[1] + (rect[3] - rect[1]) * j / nz)[0] * 100);
  // where the cobbles, earth and paving lie (the game's own picture of it), and the water
  const sp = document.createElement('canvas'); sp.width = GW; sp.height = GH * 2; const g = sp.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, GW, GH * 2);
  const MR = P.__MR, S = P.maps.splat, kx = S.width / (MR[2] - MR[0]), ky = S.height / (MR[3] - MR[1]);
  g.save(); g.beginPath(); g.rect(0, 0, GW, GH); g.clip();
  g.drawImage(S, 0, 0, S.width, S.height, (MR[0] - rect[0]) / (rect[2] - rect[0]) * GW, (MR[1] - rect[1]) / (rect[3] - rect[1]) * GH, (MR[2] - MR[0]) / (rect[2] - rect[0]) * GW, (MR[3] - MR[1]) / (rect[3] - rect[1]) * GH); g.restore();
  { const im = g.getImageData(0, GH, GW, GH), d = im.data; for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) { const v = ground(rect[0] + (rect[2] - rect[0]) * (x + 0.5) / GW, rect[1] + (rect[3] - rect[1]) * (y + 0.5) / GH)[1] * 255, k = (y * GW + x) * 4; d[k] = d[k + 1] = d[k + 2] = v; } g.putImageData(im, 0, GH); }
  // everything solid: by material, without the things too small or too thin to show on a map
  const texId = (t) => { for (const k in P.__tex) if (P.__tex[k] === t) return k; return null; };
  const keyOf = (m) => { for (const k in P.__MAT) if (P.__MAT[k] === m) return k; return null; };
  const SKIP = /^(water|shimmer|ground|sky|halos|hills|glass|coldglass|soil|produce|iron|rope|net|flame|ash|pebble|tuft|turf|frost|leafBush|oakLeaves|boughs|mush|glowcap|doorArch|doorArch2|rose|banner|dark|frond|bracken|hawthorn|fern|birchLeaf|birchMark|reed|cattail|endgrain|cut)$|^fl_/;
  const FLAT = { win: [1.0, 0.72, 0.36, 1], winColour: [1.0, 0.6, 0.4, 1], winDark: [0.1, 0.12, 0.2, 0], door: [0.3, 0.2, 0.14, 0], moonwater: [0.6, 0.78, 1.0, 1] };
  const groups = [], count = {};
  P.scene.updateMatrixWorld(true);
  P.scene.traverse((o) => {
    if (!o.geometry || !o.material || o.isInstancedMesh) return;
    const key = keyOf(o.material); if (!key || SKIP.test(key)) return;
    const mt = o.material, card = mt.defines && ('ALPHA_TEST' in mt.defines); if (card) return;
    const pa = o.geometry.attributes.position, ia = o.geometry.index, e = o.matrixWorld.elements, n = pa.count;
    // weld: one point for every spot (to the centimetre)
    const ids = new Map(), remap = new Uint32Array(n), pts = [];
    for (let i = 0; i < n; i++) {
      const x0 = pa.getX(i), y0 = pa.getY(i), z0 = pa.getZ(i), x = e[0] * x0 + e[4] * y0 + e[8] * z0 + e[12], y = e[1] * x0 + e[5] * y0 + e[9] * z0 + e[13], z = e[2] * x0 + e[6] * y0 + e[10] * z0 + e[14];
      const q = Math.round(x * 100) + ',' + Math.round(y * 100) + ',' + Math.round(z * 100); let v = ids.get(q);
      if (v === undefined) { v = pts.length / 3; ids.set(q, v); pts.push(x, y, z); } remap[i] = v;
    }
    const tn = (ia ? ia.count : n) / 3; let tris = [];
    const x0 = M.x(rect[0]), x1 = M.x(rect[2]), z0 = M.z(rect[1]), z1 = M.z(rect[3]);
    for (let t = 0; t < tn; t++) {
      const a = remap[ia ? ia.getX(t * 3) : t * 3], b = remap[ia ? ia.getX(t * 3 + 1) : t * 3 + 1], c = remap[ia ? ia.getX(t * 3 + 2) : t * 3 + 2]; if (a === b || b === c || a === c) continue;
      const mx = (pts[a * 3] + pts[b * 3] + pts[c * 3]) / 3, mz = (pts[a * 3 + 2] + pts[b * 3 + 2] + pts[c * 3 + 2]) / 3; if (mx < x0 + 3 || mx > x1 - 3 || mz < z0 + 3 || mz > z1 - 3) continue;
      tris.push(a, b, c);
    }
    // pieces that hang together; a piece smaller than a barrel is left out (a fence's rail, a twig, a pebble)
    const par = new Uint32Array(pts.length / 3); for (let i = 0; i < par.length; i++) par[i] = i;
    const find = (i) => { while (par[i] !== i) { par[i] = par[par[i]]; i = par[i]; } return i; };
    for (let t = 0; t < tris.length; t += 3) { const a = find(tris[t]), b = find(tris[t + 1]), c = find(tris[t + 2]); par[b] = a; par[c] = a; }
    const box = new Map();
    for (let t = 0; t < tris.length; t++) { const r = find(tris[t]), v = tris[t]; let bb = box.get(r); if (!bb) box.set(r, bb = [1e9, 1e9, 1e9, -1e9, -1e9, -1e9]); for (let k = 0; k < 3; k++) { bb[k] = Math.min(bb[k], pts[v * 3 + k]); bb[k + 3] = Math.max(bb[k + 3], pts[v * 3 + k]); } }
    const small = /^(wood|planks|bark|log|logbark|birch|cloth|canvas)$/.test(key) ? 1.5 : 0.9;
    const keep = (r) => { const bb = box.get(r), dx = bb[3] - bb[0], dy = bb[4] - bb[1], dz = bb[5] - bb[2], s = [dx, dy, dz].sort((p, q) => p - q); return Math.hypot(dx, dy, dz) >= small && s[1] >= 0.22; };
    const kept = []; for (let t = 0; t < tris.length; t += 3) if (keep(find(tris[t]))) kept.push(tris[t], tris[t + 1], tris[t + 2]);
    count[key] = (count[key] || 0) + kept.length / 3;
    if (!kept.length) return;
    const flat = FLAT[key], tid = flat ? null : texId(mt.uniforms.map && mt.uniforms.map.value), tint = mt.uniforms.uTint ? mt.uniforms.uTint.value : { r: 1, g: 1, b: 1 };
    groups.push({ key, tex: tid, tint: flat ? flat.slice(0, 3) : [tint.r, tint.g, tint.b], glow: flat ? flat[3] : 0, rep: mt.uniforms.uRep ? 1 / mt.uniforms.uRep.value.x : 2, pts: new Float32Array(pts), idx: new Uint32Array(kept) });
  });
  // one group for each material; the heavy ones made lighter (the map shows a place from far above)
  const byKey = {}; for (const gr of groups) { const k = gr.key + '|' + gr.tex + '|' + gr.tint.join(','); const m = byKey[k]; if (!m) byKey[k] = gr; else { const off = m.pts.length / 3, p = new Float32Array(m.pts.length + gr.pts.length); p.set(m.pts); p.set(gr.pts, m.pts.length); const ix = new Uint32Array(m.idx.length + gr.idx.length); ix.set(m.idx); for (let i = 0; i < gr.idx.length; i++) ix[m.idx.length + i] = gr.idx[i] + off; m.pts = p; m.idx = ix; } }
  const out = [], said = {};
  for (const gr of Object.values(byKey)) {
    let idx = gr.idx; const before = idx.length / 3;
    const want = /^(rock|snow|snowcap|ice|cliff|icefall|floe|monolith|elder)$/.test(gr.key) ? Math.max(700, before * 0.14) : before > 2500 ? Math.max(2500, before * 0.4) : before;
    if (want < before) idx = MeshoptSimplifier.simplify(idx, gr.pts, 3, Math.floor(want) * 3, 0.03, [])[0];
    // only the points still used, as whole centimetres from the painting's middle
    const used = new Map(), vs = [], ix = new Uint32Array(idx.length);
    for (let i = 0; i < idx.length; i++) { let v = used.get(idx[i]); if (v === undefined) { v = vs.length / 3; used.set(idx[i], v); vs.push(Math.round(gr.pts[idx[i] * 3] * 50), Math.round(gr.pts[idx[i] * 3 + 1] * 50), Math.round(gr.pts[idx[i] * 3 + 2] * 50)); } ix[i] = v; }
    said[gr.key] = (said[gr.key] || 0) + idx.length / 3;
    out.push({ key: gr.key, tex: gr.tex, tint: gr.tint.map((v) => Math.round(v * 100) / 100), glow: gr.glow, rep: Math.round(gr.rep * 100) / 100, n: vs.length / 3, v: b64(new Int16Array(vs)), i: b64(vs.length / 3 > 65535 ? ix : new Uint16Array(ix)), wide: vs.length / 3 > 65535 });
  }
  const inRect = (px, py, m) => px > rect[0] + m && px < rect[2] - m && py > rect[1] + m && py < rect[3] - m;
  const trees = ((window.W3D_TREES || {})[place.trees] || []).concat(place.extraTrees || []).filter((t) => inRect(t[0], t[1], 60)).map((t) => [Math.round(t[0]), Math.round(t[1]), Math.round((t[2] || 1) * 100), t[3] || 0]);
  const lamps = (P.lamps || []).filter((l) => inRect(M.px(l.x), M.py(l.z), 40)).map((l) => [Math.round(l.x * 10) / 10, Math.round(l.y * 10) / 10, Math.round(l.z * 10) / 10, l.c === 0x8ab8ff ? 1 : 0]);
  const gt = place.ground, res = { id, rect: rect.map(Math.round), grid: [nx, nz], mid: Math.round(P.terrain(cx, cy) * 100), h: b64(H), groups: out, trees, lamps,
    ground: { tex: [gt.cob, gt.grass, gt.dirt, gt.pave], rep: gt.rep, tint: [gt.cobTint || [1, 1, 1], gt.grassTint || [1, 1, 1], gt.dirtTint || [1, 1, 1], gt.paveTint || [1, 1, 1]] },
    textures: (place.textures || []).map((t) => [t.id, t.stand || '']), splat: sp.toDataURL('image/png'), said };
  P.dispose(); return res;
}

const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage(); page.on('pageerror', (e) => console.log('PAGE ERROR', e.message));
await page.goto('file://' + tmp);
const ids = (await page.evaluate(() => Object.keys(window.W3D_PLACES))).filter((id) => AT[id] && (!only.length || only.includes(id))).sort();
const places = {}, chunks = [], layers = [], standOf = {}; let at = 0, tris = 0;
const put = (b64) => { const b = Buffer.from(b64, 'base64'), pad = (4 - (at % 4)) % 4; if (pad) { chunks.push(Buffer.alloc(pad)); at += pad; } chunks.push(b); const o = at; at += b.length; return o; };
const layer = (id) => { if (!id) return -1; let i = layers.indexOf(id); if (i < 0) { layers.push(id); i = layers.length - 1; } return i; };
const tiles = [];
for (const id of ids) {
  const L = reach(id), r = await page.evaluate(([fn, id, lim, gw, gh]) => (0, eval)('(' + fn + ')')(id, lim, gw, gh), [take.toString(), id, [L / KX, L / KZ], GW, GH]);
  for (const [tid, stand] of r.textures) if (stand) standOf[tid] = path.join(W, stand);
  const n = r.groups.reduce((a, g) => a + (Buffer.from(g.i, 'base64').length / (g.wide ? 4 : 2)) / 3, 0); tris += n;
  places[id] = { rect: r.rect, grid: r.grid, mid: r.mid, h: put(r.h), tile: tiles.length, trees: r.trees.flat(), lamps: r.lamps.flat(),
    ground: { layers: r.ground.tex.map(layer), rep: r.ground.rep, tint: r.ground.tint },
    groups: r.groups.map((g) => ({ k: g.key, layer: layer(g.tex), tint: g.tint, glow: g.glow, rep: g.rep, n: g.n, v: put(g.v), i: put(g.i), in: Buffer.from(g.i, 'base64').length / (g.wide ? 4 : 2), wide: g.wide ? 1 : 0 })) };
  tiles.push(Buffer.from(r.splat.split(',')[1], 'base64'));
  console.log(id.padEnd(17) + String(Math.round(n)).padStart(6) + ' triangles · ' + String(r.trees.length).padStart(4) + ' trees · ' + r.lamps.length + ' lamps · ' + Object.entries(r.said).filter(([, v]) => v > 300).map(([k, v]) => k + ' ' + Math.round(v)).join(', '));
}
await browser.close(); fs.rmSync(path.dirname(tmp), { recursive: true, force: true });

// the textures, in one picture
const avg = []; { const per = 8, rows = Math.ceil(layers.length / per), comp = [];
  for (let i = 0; i < layers.length; i++) {
    const made = path.join(MADE, layers[i] + '.png'), file = fs.existsSync(made) ? made : standOf[layers[i]];
    if (!file || !fs.existsSync(file)) throw new Error('no picture for the texture ' + layers[i]);
    const buf = await sharp(file).resize(TILE, TILE, { fit: 'fill' }).removeAlpha().png().toBuffer(), st = await sharp(buf).stats();
    avg.push(st.channels.slice(0, 3).map((c) => Math.round(c.mean))); comp.push({ input: buf, left: (i % per) * TILE, top: Math.floor(i / per) * TILE });
  }
  await sharp({ create: { width: per * TILE, height: rows * TILE, channels: 3, background: '#808080' } }).composite(comp).webp({ quality: 86 }).toFile(path.join(JOB, 'art/aethermoor-place-layers.webp'));
}
// the grounds, in one picture: six places to a row
{ const per = 6, rows = Math.ceil(tiles.length / per);
  await sharp({ create: { width: per * GW, height: rows * GH * 2, channels: 3, background: '#000' } }).composite(tiles.map((b, i) => ({ input: b, left: (i % per) * GW, top: Math.floor(i / per) * GH * 2 }))).webp({ quality: 90 }).toFile(path.join(JOB, 'art/aethermoor-place-grounds.webp'));
}
const bin = Buffer.concat(chunks), packed = zlib.gzipSync(bin, { level: 9 });
const out = { from, bk: BK, tile: TILE, per: 8, gw: GW, gh: GH, gper: 6, layers: layers.map((id, i) => ({ id, avg: avg[i] })), places, bytes: bin.length };
fs.writeFileSync(path.join(JOB, 'map/place-models.js'),
  '// place-models.js: the walking places as the 3D game builds them (moon-faire-witches/world3d/, at ' + from + '), taken down for the map by\n' +
  '// tools/make-places.mjs. Not written by hand: run the tool again when the places change.\n' +
  '// For each place: rect (the ground taken, in its painting\'s pixels), grid and h (the ground\'s height, a grid of whole centimetres),\n' +
  '// mid (the ground\'s height at the painting\'s middle), tile (its square in art/aethermoor-place-grounds.webp), ground (its four ground\n' +
  '// textures: cobbles, grass, earth, paving), groups (everything solid, by material: v and i are places in the packed shapes; points are\n' +
  '// whole 2 cm steps from the painting\'s middle), trees (x, y in pixels, size x 100, kind: 0 leafy, 1 fir, 2 bare), lamps (x, y, z in metres, 1 if moonlight).\n' +
  'window.MAP_PLACE_MODELS = ' + JSON.stringify(out) + ';\nwindow.MAP_PLACE_MODELS.packed = "' + packed.toString('base64') + '";\n');
console.log(ids.length + ' places · ' + Math.round(tris) + ' triangles · ' + layers.length + ' textures · shapes ' + Math.round(bin.length / 1024) + ' KB, packed ' + Math.round(packed.length / 1024) + ' KB · place-models.js ' + Math.round(fs.statSync(path.join(JOB, 'map/place-models.js')).size / 1024) + ' KB');
