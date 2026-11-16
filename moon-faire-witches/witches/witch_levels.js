// witch_levels.js: the Fox, the Ranger and Io at their lighter weights, each under her own name so that all four witches can be in one page.
// Their own pages each set window.WITCH_LOD, so two of them could not be loaded together. Here: MF_WITCHES.fox.make('light'), and so on.
// The levels and wrappers are copied from the project notes claude/fox-3d-light-levels-and-fight-test.md, claude/ranger-3d-light-levels-and-fight-test.md
// and claude/io-3d-light-levels-and-fight-test.md (numbers unchanged; Trim is left out because the game names no use for it).
// The Jester keeps her own file (models/jester/lod.js, window.WITCH_LOD) and is added to MF_WITCHES at the end.
(function () {
  'use strict';
  function simplify(g, ratio, err, prune) {
    const S = window.MeshoptSimplifier; if (!S || !S.supported || ratio >= 1) return;
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
  function meanColour(mat) {
    const c = new THREE.Color(1, 1, 1);
    try {
      const im = mat.map && mat.map.image;
      if (im && im.width) { const k = document.createElement('canvas'); k.width = k.height = 8; const g = k.getContext('2d'); g.drawImage(im, 0, 0, 8, 8); const d = g.getImageData(0, 0, 8, 8).data; let r = 0, gg = 0, b = 0; for (let i = 0; i < d.length; i += 4) { r += d[i]; gg += d[i + 1]; b += d[i + 2]; } c.setRGB(r / 64 / 255, gg / 64 / 255, b / 64 / 255).convertSRGBToLinear(); }
    } catch (e) { /* a picture that cannot be read keeps white */ }
    if (mat.color) c.multiply(mat.color);
    return c;
  }
  const SHARED = { matte: 1, metal: 1, gloss: 1 };
  function hooks(L) {
    const lod = Object.assign({}, L);
    lod.onGeometry = (key, g, B, K) => {
      if (L.merge && SHARED[key]) {
        const col = new Float32Array(B.n * 3);
        for (const [start, count, src] of B.src) { const c = meanColour(K.MATS[src] || K.MATS.cloth); for (let i = start; i < start + count; i++) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; } }
        g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      }
      const sp = L.simplify || {}, r = sp[key] != null ? sp[key] : sp['*'];
      if (r != null && r < 1) simplify(g, r, (L.errOf && L.errOf[key]) != null ? L.errOf[key] : L.err, L.prune && !(L.keepSpecks && L.keepSpecks[key]));
    };
    lod.material = (key, B, K) => {
      if (key === 'matte') return K.sheen(K.std({ vertexColors: true, roughness: 0.84, envMapIntensity: 0.3, side: THREE.DoubleSide }), '#8a7a70', 2.6, 0.25);
      if (key === 'metal') return K.std({ vertexColors: true, roughness: 0.3, metalness: 0.9, envMapIntensity: 1.3, side: THREE.DoubleSide });
      if (key === 'gloss') return K.std({ vertexColors: true, roughness: 0.34, envMapIntensity: 0.9 });
      return null;
    };
    lod.onMesh = (key, m) => { if (L.shadowOnly && !L.shadowOnly[key]) m.castShadow = false; if (L.normalScale && L.normalScale[key] != null && m.material.normalScale) m.material.normalScale.multiplyScalar(L.normalScale[key]); };
    return lod;
  }
  const FULL = { id: 'full', opts: { detail: 1, textureScale: 1 } };
  const set = (levels, build) => ({ LEVELS: levels, raw(level, extra) { const L = levels.find((x) => x.id === level) || levels[levels.length - 1]; const o = Object.assign({}, L.opts, extra || {}); if (L.lod) o.lod = hooks(L.lod); return build(o); } });

  // ---------------- the Fox ----------------
  const F_TINY = { stitch: 1, eyelet: 1, aglet: 1 };
  const F_BIG = { curl: 1, scalp: 1, ear: 1, face: 1, hand: 1, arm: 1, skin: 1, emerald: 1, torso: 1, patch: 1, leggings: 1, boot: 1, sole: 1, gear: 1, beltm: 1, frill: 1 };
  const FOX = set([FULL,
    { id: 'light', opts: { detail: 0.5, textureScale: 0.5 },
      lod: { hair: { keep: { bun: 0.5, halo: 0.4 }, sides: 3, seg: 0.55, turns: 0.7, thick: 1.3 },
        simplify: { curl: 1, face: 0.2, hand: 0.5, emerald: 0.4, boot: 0.4, bellm: 0.15, woodbead: 0.2, lace: 0.3, brass: 0.3, nail: 0.4, '*': 0.5 }, err: 0.01, errOf: { bellm: 0.05, woodbead: 0.05, lace: 0.05, brass: 0.05 }, prune: true, keepSpecks: { curl: 1, bellm: 1, woodbead: 1, lace: 1, brass: 1 }, skip: F_TINY,
        cloth: 0.34, clothMin: 6, pleatK: 2, clothH: 1 / 60, clothMaxSub: 2, clothIter: 2, bend: 0.6, shadowOnly: F_BIG } },
    { id: 'lightest', opts: { detail: 0.5, textureScale: 0.5 },
      lod: { hair: { keep: { bun: 0.32, halo: 0.24, hang: 0.8, bang: 0.7 }, sides: 3, seg: 0.45, turns: 0.6, minSeg: 5, thick: 1.6 },
        simplify: { curl: 1, face: 0.1, hand: 0.25, arm: 0.4, emerald: 0.25, torso: 0.5, patch: 0.5, metal: 0.12, gloss: 0.15, matte: 0.3, frame: 0.6, '*': 0.3 }, err: 0.03, errOf: { metal: 0.08, gloss: 0.08, frame: 0.004 }, prune: true, keepSpecks: { curl: 1, metal: 1, gloss: 1, frame: 1 }, skip: Object.assign({ nail: 1 }, F_TINY),
        merge: { leggings: 'matte', lace: 'matte', sole: 'matte', frill: 'matte', gearIn: 'matte', choker: 'matte', beltm: 'matte', bellm: 'metal', brass: 'metal', steel: 'metal', woodbead: 'gloss' },
        cloth: 0.25, clothMin: 5, pleatK: 1, clothH: 1 / 60, clothMaxSub: 2, clothIter: 2, bend: 0.3,
        shadowOnly: { curl: 1, face: 1, hand: 1, arm: 1, emerald: 1, torso: 1, patch: 1, boot: 1, gear: 1, matte: 1 } } }
  ], (o) => makeFox(o));

  // ---------------- the Ranger ----------------
  const R_TINY = { stitch: 1, eyelet: 1, aglet: 1, hole: 1 };
  const R_BIG = { face: 1, hair: 1, torso: 1, skin: 1, form: 1, hand: 1, handR: 1, armL: 1, armR: 1, leggings: 1, lacesl: 1, boot: 1, sole: 1, sock: 1, gear: 1, belt: 1, moon: 1, scab: 1, blade: 1, swordSteel: 1, sheath: 1 };
  const R_BEADS = { charmGold: 1, teal: 1, pearl: 1, amber: 1, crystal: 1, gold: 1, gearBrass: 1, hookBrass: 1, iron: 1, steel: 1, lace: 1, moon: 1, swordGold: 1, swordSteel: 1, knifeSteel: 1, knifeCord: 1, wire: 1, bowGem: 1, swordGem: 1, knifeGem: 1, gem: 1 };
  const RANGER = set([FULL,
    { id: 'light', opts: { detail: 0.5, textureScale: 0.5 },
      lod: { simplify: { face: 0.3, hair: 0.6, boot: 0.85, charmGold: 0.12, teal: 0.3, pearl: 0.4, amber: 0.5, moon: 0.6, lace: 0.3, iron: 0.3, steel: 0.35, gold: 0.35, hookBrass: 0.35, gearBrass: 0.5, swordSteel: 0.4, swordGold: 0.35, knifeSteel: 0.4, knifeCord: 0.4, bowWrap: 0.4, veins: 0.3, nail: 0.4, wire: 0.7, lock: 1, lens: 1, lacesl: 1, '*': 0.5 },
        err: 0.01, errOf: { charmGold: 0.06, teal: 0.05, pearl: 0.05, lace: 0.05, iron: 0.03, steel: 0.03, gold: 0.03, hookBrass: 0.03, wire: 0.004, moon: 0.004, boot: 0.004 }, prune: true, keepSpecks: R_BEADS, skip: R_TINY, shadowOnly: R_BIG, normalScale: { boot: 0.4 } } },
    { id: 'lightest', opts: { detail: 0.5, textureScale: 0.5 },
      lod: { simplify: { face: 0.15, hair: 0.4, hand: 0.5, handR: 0.5, torso: 0.6, boot: 0.5, moon: 0.45, metal: 0.11, gloss: 0.3, matte: 0.24, veins: 0.2, wire: 0.6, lock: 0.75, lens: 1, gem: 0.6, lacesl: 1, '*': 0.4 },
        err: 0.03, errOf: { metal: 0.08, gloss: 0.08, wire: 0.004, moon: 0.006, boot: 0.008 }, normalScale: { boot: 0.4 }, prune: true, keepSpecks: Object.assign({ metal: 1, gloss: 1, matte: 1 }, R_BEADS), skip: Object.assign({ nail: 1, pad: 1 }, R_TINY),
        merge: { gold: 'metal', charmGold: 'metal', gearBrass: 'metal', hookBrass: 'metal', steel: 'metal', iron: 'metal', blade: 'metal', swordSteel: 'metal', swordGold: 'metal', knifeBlade: 'metal', knifeSteel: 'metal',
          laceband: 'matte', lace: 'matte', keeperB: 'matte', bowWrap: 'matte', swordGrip: 'matte', scab: 'matte', scabStrap: 'matte', knifeCord: 'matte', sheath: 'matte', sole: 'matte', sock: 'matte', belt: 'matte', beltHole: 'matte',
          teal: 'gloss', pearl: 'gloss', amber: 'gloss', crystal: 'gloss' },
        shadowOnly: { face: 1, hair: 1, torso: 1, skin: 1, form: 1, hand: 1, handR: 1, armL: 1, armR: 1, leggings: 1, lacesl: 1, boot: 1, gear: 1, matte: 1, metal: 1, moon: 1 } } }
  ], (o) => makeRanger(o));

  // ---------------- Io ----------------
  const I_TINY = { stitch: 1, eyelet: 1, aglet: 1 };
  const I_BIG = { face: 1, tress: 1, tressIn: 1, hairmass: 1, torso: 1, skin: 1, arm: 1, hand: 1, handR: 1, skirt: 1, robe: 1, tulle: 1, boot: 1, sole: 1, sock: 1, felt: 1, brim: 1, horn: 1, cloth: 1, band: 1, wood: 1, bookOpen: 1, bookShut: 1 };
  const I_BEADS = { bead: 1, silver: 1, gold: 1, gearGold: 1, gearSilver: 1, propGold: 1, crystal: 1, wire: 1, lace: 1, moss: 1, fern: 1, sickleGold: 1 };
  const IO = set([FULL,
    { id: 'light', opts: { detail: 0.5, textureScale: 0.5 },
      lod: { hair: { sides: 2, sub: 0.8, wide: 1.15, twist: 0.2 }, simplify: { face: 0.3, robe: 0.45, skirt: 0.6, hairmass: 0.5, felt: 0.6, brim: 0.7, boot: 0.85, gearGold: 0.3, silver: 0.5, gold: 0.5, bead: 0.35, lace: 0.3, wood: 0.5, leather: 0.5, nail: 0.4, tress: 1, tressIn: 1, wire: 0.7, lens: 1, moss: 1, fern: 1, tulle: 1, '*': 0.5 },
        err: 0.01, errOf: { gearGold: 0.04, silver: 0.02, bead: 0.05, lace: 0.05, wire: 0.004, boot: 0.004 }, prune: true, keepSpecks: I_BEADS, skip: I_TINY, shadowOnly: I_BIG, normalScale: { boot: 0.4 } } },
    { id: 'lightest', opts: { detail: 0.5, textureScale: 0.5 },
      lod: { hair: { sides: 2, sub: 0.6, keep: 0.7, wide: 1.35, twist: 0 }, simplify: { face: 0.15, robe: 0.25, skirt: 0.4, hairmass: 0.35, felt: 0.4, brim: 0.5, boot: 0.5, hand: 0.5, handR: 0.5, torso: 0.6, silver: 0.35, gold: 0.4, metal: 0.15, gloss: 0.3, matte: 0.3, tress: 1, tressIn: 1, wire: 0.6, lens: 1, moss: 1, fern: 1, tulle: 1, '*': 0.4 },
        err: 0.03, errOf: { metal: 0.08, gloss: 0.08, silver: 0.03, wire: 0.004, boot: 0.008 }, prune: true, keepSpecks: Object.assign({ metal: 1, gloss: 1, matte: 1 }, I_BEADS), skip: Object.assign({ nail: 1, pad: 1 }, I_TINY), normalScale: { boot: 0.4 },
        merge: { gearSilver: 'metal', gearGold: 'metal', propGold: 'metal', cloth: 'matte', band: 'matte', lace: 'matte', leather: 'matte', wood: 'matte', propLeather: 'matte', propWood: 'matte', sole: 'matte', sock: 'matte', bead: 'gloss', crystal: 'gloss' },
        shadowOnly: { face: 1, tress: 1, tressIn: 1, hairmass: 1, torso: 1, skin: 1, arm: 1, hand: 1, handR: 1, skirt: 1, robe: 1, boot: 1, felt: 1, brim: 1, matte: 1 } } }
  ], (o) => makeIo(o));

  const J = { LEVELS: [{ id: 'full' }, { id: 'light' }, { id: 'lightest' }], raw(level, extra) { return window.WITCH_LOD.make(level, extra); } };
  window.MF_WITCHES = { jester: J, fox: FOX, ranger: RANGER, io: IO };
})();
