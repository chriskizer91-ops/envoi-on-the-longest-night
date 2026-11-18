// make-tree-mids.mjs: makes a middle model of each of Chris's trees, about a quarter as detailed as his detailed one,
// for trees too far off to need every leaf and too near for his light model (Chris, November 17). Reads
// art/trees/<id>.glb and writes art/trees/<id>_mid.glb, the same kind of file (two parts, bark and foliage, a colour
// and a direction at every corner, in metres), so it can be used wherever his own two are.
// How a tree is thinned (his models are made of many separate pieces: a trunk, boughs and twigs; leaves and clumps):
//   bark     the trunk and the biggest boughs are kept whole, the smaller ones dropped (the dead snag, which is all
//            boughs, keeps nearly half its triangles so it still looks like a snag)
//   foliage  about 1 leaf or clump in 5 is kept, evenly through the crown, and each kept one is made bigger about its
//            own middle, so the crown stays as full to the eye
// Usage: node moon-faire-witches/world-map/tools/make-tree-mids.mjs [--share 0.26]   (the share of triangles to keep)
import fs from 'fs';
import path from 'path';
const R = path.resolve(new URL('../../..', import.meta.url).pathname);
const DIR = path.join(R, 'moon-faire-witches/world-map/art/trees');
const IDS = ['tree_spruce', 'tree_ponderosa', 'tree_oak', 'tree_cottonwood', 'tree_aspen', 'tree_willow', 'tree_mesquite', 'tree_snag'];
const si = process.argv.indexOf('--share'), SHARE = si >= 0 ? +process.argv[si + 1] : 0.26;
function read(file) {
  const b = fs.readFileSync(file), jl = b.readUInt32LE(12), j = JSON.parse(b.slice(20, 20 + jl).toString()), bin = b.slice(20 + jl + 8);
  const acc = (k) => { const a = j.accessors[k], bv = j.bufferViews[a.bufferView], off = (bv.byteOffset || 0) + (a.byteOffset || 0), n = { VEC3: 3, SCALAR: 1 }[a.type] * a.count;
    return a.componentType === 5126 ? new Float32Array(bin.buffer.slice(bin.byteOffset + off, bin.byteOffset + off + n * 4)) : new Uint16Array(bin.buffer.slice(bin.byteOffset + off, bin.byteOffset + off + n * 2)); };
  return { json: j, parts: j.meshes[0].primitives.map((p) => ({ material: p.material, name: j.materials[p.material].name, P: acc(p.attributes.POSITION), N: acc(p.attributes.NORMAL), C: acc(p.attributes.COLOR_0), I: acc(p.indices) })) };
}
// the separate pieces of a part: triangles joined through shared corners (corners at the same place count as one)
function pieces(part) {
  const n = part.P.length / 3, key = new Map(), w = new Int32Array(n);
  for (let i = 0; i < n; i++) { const k = Math.round(part.P[i * 3] * 2000) + ',' + Math.round(part.P[i * 3 + 1] * 2000) + ',' + Math.round(part.P[i * 3 + 2] * 2000); if (!key.has(k)) key.set(k, key.size); w[i] = key.get(k); }
  const par = Int32Array.from({ length: key.size }, (_, i) => i), find = (x) => { while (par[x] !== x) { par[x] = par[par[x]]; x = par[x]; } return x; };
  for (let t = 0; t < part.I.length; t += 3) { const a = find(w[part.I[t]]); par[find(w[part.I[t + 1]])] = a; par[find(w[part.I[t + 2]])] = a; }
  const by = new Map();
  for (let t = 0; t < part.I.length; t += 3) { const r = find(w[part.I[t]]); if (!by.has(r)) by.set(r, []); by.get(r).push(t); }
  return [...by.values()].map((tris) => {
    const corners = new Set(); for (const t of tris) for (let k = 0; k < 3; k++) corners.add(part.I[t + k]);
    const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9], mid = [0, 0, 0];
    for (const i of corners) for (let c = 0; c < 3; c++) { const v = part.P[i * 3 + c]; lo[c] = Math.min(lo[c], v); hi[c] = Math.max(hi[c], v); mid[c] += v / corners.size; }
    return { tris, corners, mid, size: Math.hypot(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]) };
  });
}
// a part rebuilt from some of its pieces, each made `grow(piece)` times bigger about its own middle
function rebuild(part, kept, grow) {
  const P = [], N = [], C = [], I = [];
  for (const pc of kept) {
    const g = grow(pc), map = new Map();
    for (const i of pc.corners) { map.set(i, P.length / 3); for (let c = 0; c < 3; c++) { P.push(pc.mid[c] + (part.P[i * 3 + c] - pc.mid[c]) * g); N.push(part.N[i * 3 + c]); C.push(part.C[i * 3 + c]); } }
    for (const t of pc.tris) for (let k = 0; k < 3; k++) I.push(map.get(part.I[t + k]));
  }
  return { material: part.material, name: part.name, P: Float32Array.from(P), N: Float32Array.from(N), C: Float32Array.from(C), I: Uint16Array.from(I) };
}
function thin(model) {
  const total = model.parts.reduce((a, p) => a + p.I.length / 3, 0), bark = model.parts.find((p) => p.name === 'bark'), leaf = model.parts.find((p) => p.name === 'foliage');
  const out = [];
  // bark: the biggest pieces first, until its share is spent (the trunk always; a bare tree is all boughs, so it keeps more)
  const barkBudget = leaf ? total * SHARE * 0.42 : total * Math.max(SHARE, 0.45), bp = pieces(bark).sort((a, b) => b.size - a.size), keptBark = [];
  let used = 0; for (const pc of bp) { if (keptBark.length && used + pc.tris.length > barkBudget) continue; keptBark.push(pc); used += pc.tris.length; }
  out.push(rebuild(bark, keptBark, () => 1));
  if (leaf) {
    // foliage: every so-manyth piece, in the model's own order (which runs through the crown bough by bough), so the kept
    // ones are spread evenly; each grown so the crown keeps its fullness (leaves more than clumps, which would balloon)
    const lp = pieces(leaf), want = Math.max(1, total * SHARE - used), f = Math.min(1, want / (leaf.I.length / 3)), kept = [];
    let acc = 0; for (const pc of lp) { acc += f; if (acc >= 1) { acc -= 1; kept.push(pc); } }
    const g = Math.min(2.6, 1.15 / Math.sqrt(f));
    out.push(rebuild(leaf, kept, (pc) => (pc.tris.length <= 4 ? g : 1 + (g - 1) * 0.55)));
  }
  return out;
}
function writeGlb(file, src, parts, name) {
  const views = [], accessors = [], chunks = []; let off = 0;
  const add = (arr, target, type, comp, minmax) => {
    const buf = Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength), pad = (4 - (buf.length % 4)) % 4;
    views.push({ buffer: 0, byteOffset: off, byteLength: buf.length, target }); chunks.push(buf, Buffer.alloc(pad)); off += buf.length + pad;
    const a = { bufferView: views.length - 1, componentType: comp, count: arr.length / (type === 'VEC3' ? 3 : 1), type };
    if (minmax) { const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9]; for (let i = 0; i < arr.length; i++) { lo[i % 3] = Math.min(lo[i % 3], arr[i]); hi[i % 3] = Math.max(hi[i % 3], arr[i]); } a.min = lo; a.max = hi; }
    accessors.push(a); return accessors.length - 1;
  };
  const prims = parts.map((p) => ({ attributes: { POSITION: add(p.P, 34962, 'VEC3', 5126, true), NORMAL: add(p.N, 34962, 'VEC3', 5126), COLOR_0: add(p.C, 34962, 'VEC3', 5126) }, indices: add(p.I, 34963, 'SCALAR', 5123), material: p.material }));
  const tris = parts.reduce((a, p) => a + p.I.length / 3, 0), asset = Object.assign({}, src.nodes[0].extras.asset, { lod: 'mid', tris, madeBy: 'tools/make-tree-mids.mjs, from ' + name + '.glb (about a quarter of its triangles)' });
  const json = { asset: { version: '2.0', generator: 'envoi world-map make-tree-mids' }, scene: 0, scenes: [{ nodes: [0] }], nodes: [{ name: name + '_mid', mesh: 0, extras: { asset } }],
    meshes: [{ name: name + '_mid', primitives: prims }], materials: src.materials, accessors, bufferViews: views, buffers: [{ byteLength: off }] };
  let jb = Buffer.from(JSON.stringify(json)); jb = Buffer.concat([jb, Buffer.alloc((4 - (jb.length % 4)) % 4, 0x20)]);
  const bin = Buffer.concat(chunks), head = Buffer.alloc(12), jh = Buffer.alloc(8), bh = Buffer.alloc(8);
  head.writeUInt32LE(0x46546c67, 0); head.writeUInt32LE(2, 4); head.writeUInt32LE(12 + 8 + jb.length + 8 + bin.length, 8);
  jh.writeUInt32LE(jb.length, 0); jh.writeUInt32LE(0x4e4f534a, 4); bh.writeUInt32LE(bin.length, 0); bh.writeUInt32LE(0x004e4942, 4);
  fs.writeFileSync(file, Buffer.concat([head, jh, jb, bh, bin]));
  return tris;
}
for (const id of IDS) {
  const model = read(path.join(DIR, id + '.glb')), total = model.parts.reduce((a, p) => a + p.I.length / 3, 0), parts = thin(model);
  const tris = writeGlb(path.join(DIR, id + '_mid.glb'), model.json, parts, id);
  console.log(id.padEnd(16) + String(total).padStart(5) + ' triangles -> ' + String(tris).padStart(4) + ' (' + Math.round(100 * tris / total) + '%): ' + parts.map((p) => p.name + ' ' + p.I.length / 3).join(', ') + ' · ' + (fs.statSync(path.join(DIR, id + '_mid.glb')).size / 1024).toFixed(0) + ' KB');
}
