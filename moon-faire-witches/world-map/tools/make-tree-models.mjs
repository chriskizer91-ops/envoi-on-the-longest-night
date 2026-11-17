// make-tree-models.mjs: packs the tree models in art/trees/ (Chris's, from his Field & Forest · Forest Builder: eight
// trees, each as a detailed model, <id>.glb, and a light one, <id>_far.glb; art/LABELS.md lists them) into
// map/tree-models.js, which the 3D map reads to draw real trees as the view comes close.
// Each model is plain: corners with a direction and a colour, in two parts (bark, foliage), no pictures. Packed small:
// places as 16-bit numbers, directions and colours as 8-bit. The models' colours are stored the way a screen shows
// them (they come as light values, much darker in number).
// Usage: node moon-faire-witches/world-map/tools/make-tree-models.mjs
import fs from 'fs';
import path from 'path';
const R = path.resolve(new URL('../../..', import.meta.url).pathname);
const DIR = path.join(R, 'moon-faire-witches/world-map/art/trees');
const IDS = ['tree_spruce', 'tree_ponderosa', 'tree_oak', 'tree_cottonwood', 'tree_aspen', 'tree_willow', 'tree_mesquite', 'tree_snag'];
function read(file) {
  const b = fs.readFileSync(file), jl = b.readUInt32LE(12), j = JSON.parse(b.slice(20, 20 + jl).toString()), bin = b.slice(20 + jl + 8);
  const acc = (k) => { const a = j.accessors[k], bv = j.bufferViews[a.bufferView], off = (bv.byteOffset || 0) + (a.byteOffset || 0), n = { VEC3: 3, SCALAR: 1 }[a.type] * a.count;
    if (a.componentType === 5126) return new Float32Array(bin.buffer.slice(bin.byteOffset + off, bin.byteOffset + off + n * 4));
    if (a.componentType === 5123) return new Uint16Array(bin.buffer.slice(bin.byteOffset + off, bin.byteOffset + off + n * 2));
    throw new Error('an accessor of a kind this tool does not read: ' + a.componentType); };
  const pos = [], nrm = [], col = [], part = [], idx = []; let base = 0;
  for (const p of j.meshes[0].primitives) {
    const P = acc(p.attributes.POSITION), N = acc(p.attributes.NORMAL), C = acc(p.attributes.COLOR_0), I = acc(p.indices), leaf = j.materials[p.material].name === 'foliage' ? 1 : 0;
    for (let i = 0; i < P.length / 3; i++) { pos.push(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]); nrm.push(N[i * 3], N[i * 3 + 1], N[i * 3 + 2]); col.push(C[i * 3], C[i * 3 + 1], C[i * 3 + 2]); part.push(leaf); }
    for (const i of I) idx.push(i + base); base += P.length / 3;
  }
  return { pos, nrm, col, part, idx, asset: j.nodes[0].extras.asset };
}
function pack(m) {
  const n = m.pos.length / 3, t = m.idx.length / 3; if (n > 65535) throw new Error('too many corners for 16-bit numbering');
  let reach = 0; for (const v of m.pos) reach = Math.max(reach, Math.abs(v));
  const buf = Buffer.alloc(n * 6 + n * 4 + n * 4 + t * 6); let o = 0;
  for (const v of m.pos) { buf.writeInt16LE(Math.round(v / reach * 32767), o); o += 2; }
  for (let i = 0; i < n; i++) { for (let c = 0; c < 3; c++) buf.writeInt8(Math.max(-127, Math.min(127, Math.round(m.nrm[i * 3 + c] * 127))), o + c); o += 4; }
  const leaf = [0, 0, 0]; let leaves = 0;
  for (let i = 0; i < n; i++) { for (let c = 0; c < 3; c++) { const s = Math.pow(Math.max(0, Math.min(1, m.col[i * 3 + c])), 1 / 2.2); buf.writeUInt8(Math.round(s * 255), o + c); if (m.part[i]) leaf[c] += s; } buf.writeUInt8(m.part[i], o + 3); leaves += m.part[i]; o += 4; }
  for (const i of m.idx) { buf.writeUInt16LE(i, o); o += 2; }
  return { corners: n, triangles: t, reach: Math.round(reach * 1000) / 1000, leaf: leaves ? leaf.map((v) => Math.round(v / leaves * 1000) / 1000) : null, data: buf.toString('base64') };
}
const trees = {};
for (const id of IDS) {
  const near = read(path.join(DIR, id + '.glb')), far = read(path.join(DIR, id + '_far.glb'));
  let top = 0; for (let i = 1; i < near.pos.length; i += 3) top = Math.max(top, near.pos[i]);
  trees[id] = { name: near.asset.name, where: near.asset.where, tall: Math.round(top * 100) / 100, near: pack(near), far: pack(far) };
  console.log(id.padEnd(16) + near.asset.name.padEnd(16) + (top.toFixed(1) + ' m tall').padEnd(13) + 'detailed ' + String(trees[id].near.triangles).padStart(5) + ' triangles · light ' + String(trees[id].far.triangles).padStart(4));
}
const out = `// tree-models.js: Chris's eight tree models from his Field & Forest · Forest Builder (art/trees/, listed in
// art/LABELS.md), packed by tools/make-tree-models.mjs. Not written by hand.
// Each tree: its name, where it grows (the Forest Builder's own note), how tall it stands in metres, and two models,
// near (detailed) and far (light). A model's data, base64: every corner's place (three 16-bit numbers, times
// reach / 32767 = metres), then every corner's direction (three 8-bit numbers and a spare), then every corner's
// colour (red, green, blue, and 1 for foliage or 0 for bark), then the triangles (three 16-bit corner numbers each).
// leaf: the foliage's average colour.
window.MAP_TREES = ${JSON.stringify(trees)};
`;
const f = path.join(R, 'moon-faire-witches/world-map/map/tree-models.js'); fs.writeFileSync(f, out);
console.log('map/tree-models.js ' + (fs.statSync(f).size / 1024).toFixed(0) + ' KB');
