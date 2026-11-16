// lod.js: the cheaper versions of a witch. Each level is a set of switches handed to makeJester as opts.lod (see tools/patch_jester_lod.py for
// where the model reads them). Nothing here changes how she is built at full detail.
// Copied unchanged from the project doc claude/jester-3d-light-levels-and-fight-test.md ("The levels (lod.js)").
(function () {
  'use strict';
  // Take triangles out of a finished part. The simplifier only ever removes points, it never moves one or makes a new one, so the
  // painting on the part (its uv), its skin weights and anything else stored on each point stay exactly right.
  function simplify(g, ratio, err, prune) {
    const S = window.MeshoptSimplifier; if (!S || !S.supported || window.WITCH_LOD.thin === false || ratio >= 1) return;
    const src = g.index.array instanceof Uint32Array ? g.index.array : new Uint32Array(g.index.array), pos = g.attributes.position.array;
    const target = Math.max(3, Math.floor(src.length * ratio / 3) * 3);
    let out; try { out = S.simplify(src, pos, 3, target, err == null ? 0.02 : err, prune ? ['Prune'] : [])[0]; } catch (e) { return; }
    if (!out || out.length < 3) return;
    const nv = pos.length / 3, remap = new Int32Array(nv).fill(-1); let n = 0;
    for (let i = 0; i < out.length; i++) { const v = out[i]; if (remap[v] < 0) remap[v] = n++; }
    for (const name in g.attributes) {
      const a = g.attributes[name], k = a.itemSize, A = a.array, B = new A.constructor(n * k);
      for (let v = 0; v < nv; v++) { const r = remap[v]; if (r >= 0) for (let q = 0; q < k; q++) B[r * k + q] = A[v * k + q]; }
      g.setAttribute(name, new THREE.BufferAttribute(B, k, a.normalized));
    }
    const idx = n > 65535 ? new Uint32Array(out.length) : new Uint16Array(out.length);
    for (let i = 0; i < out.length; i++) idx[i] = remap[out[i]];
    g.setIndex(new THREE.BufferAttribute(idx, 1));
  }
  // the colour a painted cloth averages to, for parts that give up their own picture
  function meanColour(mat) {
    const c = new THREE.Color(1, 1, 1);
    try {
      const im = mat.map && mat.map.image;
      if (im && im.width) { const k = document.createElement('canvas'); k.width = k.height = 8; const g = k.getContext('2d'); g.drawImage(im, 0, 0, 8, 8); const d = g.getImageData(0, 0, 8, 8).data; let r = 0, gg = 0, b = 0; for (let i = 0; i < d.length; i += 4) { r += d[i]; gg += d[i + 1]; b += d[i + 2]; } c.setRGB(r / 64 / 255, gg / 64 / 255, b / 64 / 255).convertSRGBToLinear(); }
    } catch (e) { /* a picture that cannot be read keeps white */ }
    if (mat.color) c.multiply(mat.color);
    return c;
  }
  // level: { simplify: { part: share kept, '*': share kept }, err, prune, skip, merge, shadow: { part: false }, ... } -> opts.lod
  function hooks(L) {
    const lod = Object.assign({}, L);
    lod.onGeometry = (key, g, B, K) => {
      if (L.merge && (key === 'matte' || key === 'metal' || key === 'gloss')) {                 // merged parts wear their old colours as paint on each point
        const col = new Float32Array(B.n * 3);
        for (const [start, count, src] of B.src) { const c = meanColour(K.MATS[src] || K.MATS.cloth); for (let i = start; i < start + count; i++) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; } }
        g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      }
      const sp = L.simplify || {}, r = sp[key] != null ? sp[key] : sp['*'];
      if (r != null && r < 1) simplify(g, r, L.err, L.prune);
    };
    lod.material = (key, B, K) => {
      if (key === 'matte') return K.sheen(K.std({ vertexColors: true, roughness: 0.82, envMapIntensity: 0.35 }), '#7a6470', 2.6, 0.32);
      if (key === 'metal') return K.std({ vertexColors: true, roughness: 0.27, metalness: 1, envMapIntensity: 1.6 });
      if (key === 'gloss') return K.std({ vertexColors: true, roughness: 0.3, envMapIntensity: 1.1 });
      return null;
    };
    // shadows: the cheapest level throws hers from the few big parts only (the body, and the largest sheets of cloth)
    lod.onMesh = (key, m) => { if (L.shadowOnly && !L.shadowOnly[key]) m.castShadow = false; };
    const sheets = [];
    lod.onCloth = (c) => { if (!L.clothShadow) return; sheets.push(c); sheets.sort((a, b) => b.n - a.n); sheets.forEach((s, i) => s.meshes.forEach((m) => { if (i >= L.clothShadow) m.castShadow = false; })); };
    return lod;
  }
  const TINY = { stitch: 1, eyelet: 1, aglet: 1, bellslit: 1 };
  const LEVELS = [
    { id: 'full', name: 'Full', note: 'The model as it is today', opts: { detail: 1, textureScale: 1 } },
    { id: 'trim', name: 'Trim', note: 'Half the rings in every part, coarser cloth, the smallest fittings left off',
      opts: { detail: 0.5, textureScale: 0.75 }, shadowMap: 1024,
      lod: { simplify: { face: 0.5, ruffle: 0.5, fur: 1, '*': 0.8 }, err: 0.004, skip: TINY, tufts: 0.5, pleatK: 2, clothIter: 2, dropHidden: true } },
    { id: 'light', name: 'Light', note: 'Every part thinned again, cloth of a third the points', opts: { detail: 0.5, textureScale: 0.5 }, shadowMap: 512,
      lod: { simplify: { face: 0.2, ruffle: 0.2, hand: 0.5, boot: 0.4, '*': 0.5 }, err: 0.01, prune: true, skip: TINY, tufts: 0.2, cloth: 0.34, clothMin: 6, pleatK: 2, clothH: 1 / 60, clothMaxSub: 2, clothIter: 2, bend: 0.6, dropHidden: true,
        shadowOnly: { torso: 1, wine: 1, cloth: 1, leggings: 1, boot: 1, sole: 1, hand: 1, face: 1, hair: 1, cap: 1, velvet: 1, fur: 1, ruffle: 1, leather: 1 }, clothShadow: 8 } },
    { id: 'lightest', name: 'Lightest', note: 'Small parts share three plain materials, cloth of a quarter the points', opts: { detail: 0.5, textureScale: 0.5 },
      lod: { simplify: { face: 0.1, ruffle: 0.12, hand: 0.25, torso: 0.5, leggings: 0.5, '*': 0.3 }, err: 0.03, prune: true, skip: Object.assign({ nail: 1, sock: 1 }, TINY), tufts: 0.08,
        merge: { wine: 'matte', cloth: 'matte', sole: 'matte', lace: 'matte', hair: 'matte', cap: 'matte', velvet: 'matte', fur: 'matte', boot: 'gloss', leather: 'gloss', gem: 'gloss', pearl: 'metal', gold: 'metal' },
        cloth: 0.25, clothMin: 5, pleatK: 1, clothH: 1 / 60, clothMaxSub: 2, clothIter: 2, bend: 0.3, dropHidden: true,
        shadowOnly: { matte: 1, torso: 1, gloss: 1 }, clothShadow: 4 } }
  ];
  window.WITCH_LOD = { LEVELS, hooks, simplify, make(level, extra) { const L = typeof level === 'string' ? LEVELS.find((x) => x.id === level) : level; const o = Object.assign({}, L.opts, extra || {}); if (L.lod) o.lod = hooks(L.lod); return makeJester(o); } };
})();
