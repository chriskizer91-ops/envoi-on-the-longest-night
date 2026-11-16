// world.js: builds a 3D place of Envoi from its data (world3d/places/<id>.js) on the painting's own layout.
//   const P = await W3D.buildPlace(place, renderer)
//   P.scene, P.U (the shared night uniforms), P.walkable(px, py), P.walkH(px, py), P.M (pixels and metres),
//   P.update(t, cam, io) (the water, the lamps' flicker, what thins away between the camera and Io), P.stats, P.used
// Everything that stands still is merged by material (and the trees by patches of ground, so the ones out of view are
// skipped), so a whole place draws in a few dozen calls.
(function (G) {
  'use strict';
  const W3D = G.W3D;
  const { ss, clamp, inPoly, edgeDist, rand } = W3D;
  const TAU = Math.PI * 2;

  W3D.buildPlace = async function (place, renderer, opts) {
    opts = opts || {};
    const M = W3D.map({ w: place.size[0], h: place.size[1] });
    const U = W3D.night(M, place.night || {});
    const map2d = (window.MAPS || {})[place.mapId] || { walk: [], block: [] };
    const scene = new THREE.Scene();
    const { tex, used } = await W3D.loadTextures(place.textures, renderer);
    const T = (id) => tex[id];
    const X = M.x, Z = M.z, gh = place.ground_h;
    const R = rand(17);

    // ---- painted pictures ----
    const P = W3D.paint;
    const ct = (c, flip) => { const t = W3D.canvasTex(c, true); if (flip === false) t.flipY = false; t.anisotropy = 4; return t; };
    const pics = {
      win: ct(P.window()), winDark: ct(P.window({ dark: true })), winColour: ct(P.window({ colour: true })), rose: ct(P.rose()),
      door: ct(P.door()), doorArch: ct(P.door({ arch: true })), doorArch2: ct(P.door({ arch: true, double: true })),
      produce: ct(P.produce()), moonwater: ct(P.moonwater()), halo: ct(P.halo()),
    };
    const FLOWER_KINDS = ['mix', 'white', 'violet', 'sun', 'fruit'];
    for (const k of FLOWER_KINDS) pics['fl_' + k] = ct(P.flowers(k, 3 + FLOWER_KINDS.indexOf(k) * 7));

    // ---- materials ----
    const DS = THREE.DoubleSide, m = (o) => W3D.mat(U, o);
    // which texture each kind of surface uses: the place's own choice (place.surfaces), else Wickhollow's
    const SURF = Object.assign({ stone: 'shared_stone_wall_rough', dry: 'shared_drystone', timber: 'wick_wall_timber_plaster', planks: 'shared_boardwalk_planks',
      roof: 'shared_roof_tiles_red', wood: 'shared_boardwalk_planks', deck: 'shared_boardwalk_planks', pave: 'wick_bridge_paving', cloth: 'shared_awning_stripes',
      soil: 'shared_dirt_track', rock: 'thorn_rock_mossy', leaves: 'wick_leaf_canopy', bark: 'shared_bark_oak' }, place.surfaces || {});
    const ST = (k) => T(SURF[k]);
    const TINT = Object.assign({ leaves: 0xd8ffee, firs: 0xa8c8c0, bush: 0xd8ffe8, wood: 0xc0a088 }, place.tints || {});
    const MAT = {
      stone: m({ map: ST('stone'), rep: 2.4, cut: true, shade: 0.35 }),
      dry: m({ map: ST('dry'), rep: 1.5, cut: true, shade: 0.5 }),
      timber: m({ map: ST('timber'), rep: 3.0, cut: true, shade: 0.3 }),
      planks: m({ map: ST('planks'), rep: 2.0, repV: 2.0, cut: true, shade: 0.4 }),
      roof: m({ map: ST('roof'), rep: 2.0, cut: true, side: DS, shade: 0.15 }),
      wood: m({ map: ST('wood'), rep: 1.1, tint: TINT.wood, cut: true, shade: 0.5 }),
      deck: m({ map: ST('deck'), rep: 2.2, cut: true, shade: 0.6 }),
      pave: m({ map: ST('pave'), rep: 2.6, cut: true, shade: 0.6 }),
      iron: m({ tint: 0x2a2632, spec: 0.6, cut: true, shade: 0.5 }),
      cloth: m({ map: ST('cloth'), rep: 1, cut: true, side: DS, shade: 0.3 }),
      glass: m({ lit: 0, cut: true }),
      win: m({ map: pics.win, lit: 0 }), winDark: m({ map: pics.winDark, shade: 0.3 }), winColour: m({ map: pics.winColour, lit: 0 }), rose: m({ map: pics.rose, lit: 0 }),
      door: m({ map: pics.door, shade: 0.4 }), doorArch: m({ map: pics.doorArch, alphaTest: 0.5, shade: 0.4 }), doorArch2: m({ map: pics.doorArch2, alphaTest: 0.5, shade: 0.4 }),
      produce: m({ map: pics.produce, shade: 0.3 }), moonwater: m({ map: pics.moonwater, lit: 0 }),
      soil: m({ map: ST('soil'), rep: 1.5, tint: 0x6a5a50, shade: 0.7 }),
      rock: m({ map: ST('rock'), rep: 1.8, shade: 0.7, cut: true }),
      hills: m({ lit: 0, nofog: true, side: DS, glow: 0 }),
      leafBush: m({ map: ST('leaves'), rep: 1, tint: TINT.bush, cut: true, shade: 0.6 }),
    };
    for (const k of FLOWER_KINDS) MAT['fl_' + k] = m({ map: pics['fl_' + k], alphaTest: 0.5, side: DS, cut: true, shade: 0.5 });
    // the trees, with and without the thinning-away (it costs a little, so only the patches near Io's line of sight get it)
    const TREE_MAT = (cut) => ({
      leaves: m({ map: ST('leaves'), rep: 1, tint: TINT.leaves, cut, shade: 0.55 }),
      firs: m({ map: T(SURF.firs || SURF.leaves), rep: 1, tint: TINT.firs, cut, shade: 0.55 }),
      bark: m({ map: ST('bark'), rep: 1, cut, shade: 0.6 }),
    });
    const TM = { cut: TREE_MAT(true), whole: TREE_MAT(false) };

    // ---- where Io can walk: the walking map's own areas and blocks, and everything solid the 3D adds ----
    const bbox = (poly) => { let a = 1e9, b = 1e9, c = -1e9, d = -1e9; for (const [x, y] of poly) { a = Math.min(a, x); b = Math.min(b, y); c = Math.max(c, x); d = Math.max(d, y); } return [a, b, c, d]; };
    const withBox = (polys) => polys.map((p) => ({ p, b: bbox(p) }));
    const WALK = withBox(map2d.walk), BLOCK = withBox(map2d.block.slice());
    // pockets and ground beyond the 2D walk (place.walkAdd), and a wild place's open ground (place.open.bounds): Io can
    // go anywhere inside it but the water and anything solid
    const ADD = withBox((place.walkAdd || []).map((a) => a.poly || a)), OPEN = place.open ? place.open.bounds : null;
    const inAny = (L, x, y) => L.some((q) => x >= q.b[0] && x <= q.b[2] && y >= q.b[1] && y <= q.b[3] && inPoly(q.p, x, y));
    const addBlock = (poly) => BLOCK.push({ p: poly, b: bbox(poly) });
    const circlePx = (px, py, rm, n) => Array.from({ length: n || 10 }, (_, i) => { const a = i / (n || 10) * TAU; return [px + Math.cos(a) * rm / M.SX, py + Math.sin(a) * rm / M.SZ]; });
    for (const b of place.buildings) addBlock(W3D.rectPoly(b.fp));
    let walkGrid = null;  // made at the end, once everything solid is known: 1 where her feet can stand, a cell every 2 px
    const walkable = (x, y) => { if (!walkGrid) return inAny(WALK, x, y) && !inAny(BLOCK, x, y); const G = walkGrid, i = Math.floor((x - G.x0) / G.c), j = Math.floor((y - G.y0) / G.c); return i >= 0 && j >= 0 && i < G.w && j < G.h && G.d[j * G.w + i] === 1; };

    // the steps: each tread's top, so Io's feet stand on them
    const STEPS = (place.steps || []).map((s) => {
      const [x0, y0, x1, y1] = s.r, n = s.n, treads = [];
      for (let i = 0; i < n; i++) { const ya = y0 + (y1 - y0) * i / n, yb = y0 + (y1 - y0) * (i + 1) / n; treads.push({ ya, yb, top: gh((x0 + x1) / 2, (ya + yb) / 2) }); }
      return { x0, x1, y0, y1, treads };
    });
    const walkH = (x, y) => {
      for (const s of STEPS) if (x >= s.x0 && x <= s.x1 && y >= s.y0 && y <= s.y1) { const t = s.treads[Math.min(s.treads.length - 1, Math.floor((y - s.y0) / (s.y1 - s.y0) * s.treads.length))]; return t.top; }
      return place.walk_h(x, y);
    };

    const B = W3D.Builder();
    const lights = [];       // [px, py, radius px, strength, kind] for the light map
    const halos = [];        // [x, y, z, size, r, g, b]
    const shadeMarks = [];   // [px, py, radius px, darkness] for the shade map
    const WARM = [1.0, 0.72, 0.42];
    const lamps3d = [];      // every lantern and fire in the world, for the lights that move with Io

    // ---- the ground ----
    // the ground goes past the painting: by a margin of woods, or as far as a wild place's open ground (place.extent, px)
    const EXT = place.extent || [-460, -420, place.size[0] + 460, place.size[1] + 420];
    const WX0 = EXT[0], WY0 = EXT[1], WX1 = EXT[2], WY1 = EXT[3];
    // the painted maps (cobbles, lamplight, shade) cover the painting, or the whole extent when the place has one
    const MR = place.extent ? EXT : [0, 0, place.size[0], place.size[1]];
    U.uMapK.value.set(1 / (M.SX * (MR[2] - MR[0])), 1 / (M.SZ * (MR[3] - MR[1])), (M.CX - MR[0]) / (MR[2] - MR[0]), (M.CY - MR[1]) / (MR[3] - MR[1]));
    const vnoise = W3D.vnoise;
    const WATER = (place.water || []).map((w) => Object.assign({}, w, { b: bbox(w.poly) }));
    const inWater = (x, y) => WATER.find((w) => x >= w.b[0] && x <= w.b[2] && y >= w.b[1] && y <= w.b[3] && inPoly(w.poly, x, y));
    const nearWalkPx = (x, y, r) => WALK.some((q) => x >= q.b[0] - r && x <= q.b[2] + r && y >= q.b[1] - r && y <= q.b[3] + r && (inPoly(q.p, x, y) || edgeDist(q.p, x, y) < r));
    function terrain(x, y) {
      let h = gh(x, y);
      const w = inWater(x, y);
      if (w) { const d = edgeDist(w.poly, x, y); h = h + (w.bed - h) * ss(0, 30, d); }
      else if (!nearWalkPx(x, y, 40)) h += (vnoise(x / 60, y / 60) - 0.5) * 0.5 + (vnoise(x / 17, y / 17) - 0.5) * 0.12;
      return h;
    }
    const groundGeos = [];
    {
      const big = (X(WX1) - X(WX0)) * (Z(WY1) - Z(WY0)) > 12000, cell = big ? 0.9 : 0.7, x0 = X(WX0), x1 = X(WX1), z0 = Z(WY0), z1 = Z(WY1);
      const nx = Math.ceil((x1 - x0) / cell), nz = Math.ceil((z1 - z0) / cell), dx = (x1 - x0) / nx, dz = (z1 - z0) / nz;
      const H = new Float32Array((nx + 1) * (nz + 1));
      for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) H[j * (nx + 1) + i] = terrain(M.px(x0 + dx * i), M.py(z0 + dz * j));
      const h = (i, j) => H[Math.min(nz, Math.max(0, j)) * (nx + 1) + Math.min(nx, Math.max(0, i))];
      // one patch every 32 cells each way; normals from the heights round each corner, so patches meet without a seam
      const PC = 32;
      for (let pj = 0; pj < nz; pj += PC) for (let pi = 0; pi < nx; pi += PC) {
        const ni = Math.min(PC, nx - pi), nj = Math.min(PC, nz - pj), pos = [], nor = [], col = [], uv = [], idx = [];
        for (let j = 0; j <= nj; j++) for (let i = 0; i <= ni; i++) {
          const gi = pi + i, gj = pj + j, x = x0 + dx * gi, z = z0 + dz * gj, px = M.px(x), py = M.py(z);
          pos.push(x, h(gi, gj), z);
          const nx_ = -(h(gi + 1, gj) - h(gi - 1, gj)) / (2 * dx), nz_ = -(h(gi, gj + 1) - h(gi, gj - 1)) / (2 * dz), L = Math.hypot(nx_, 1, nz_);
          nor.push(nx_ / L, 1 / L, nz_ / L);
          const c = 0.9 + vnoise(px / 25, py / 25) * 0.2; col.push(c, c, c); uv.push(x, z);
        }
        for (let j = 0; j < nj; j++) for (let i = 0; i < ni; i++) { const a = j * (ni + 1) + i, b = a + 1, c = a + ni + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
        geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
        geo.setIndex(idx); geo.computeBoundingSphere(); groundGeos.push(geo);
      }
    }

    // ---- the water: a grid over each lake or river, at its level (a river's falls are where its level drops) ----
    const waterMeshes = [];
    for (const w of WATER) {
      const cell = 0.8;
      const bx0 = Math.max(WX0, w.b[0]), bx1 = Math.min(WX1, w.b[2]), by0 = Math.max(WY0, w.b[1]), by1 = Math.min(WY1, w.b[3]);
      const sx = cell / M.SX, sy = cell / M.SZ;
      const WB2 = W3D.Builder();
      for (let py = by0; py < by1; py += sy) for (let px = bx0; px < bx1; px += sx) {
        const inside = [[px, py], [px + sx, py], [px, py + sy], [px + sx, py + sy], [px + sx / 2, py + sy / 2]].some(([a, b]) => inPoly(w.poly, a, b) || edgeDist(w.poly, a, b) < 14);
        if (!inside) continue;
        const ya = w.level(py), yb = w.level(py + sy), xa = X(px), xb = X(px + sx), za = Z(py), zb = Z(py + sy);
        WB2.quad('w', [xa, yb, zb], [xb, yb, zb], [xb, ya, za], [xa, ya, za], [xa, zb, xb, za]);
      }
      const mesh = WB2.build({ w: W3D.waterMat(U, { water: T(w.tex), rep: w.rep, flow: w.flow, tint: w.tint }) }).w;
      if (mesh) { mesh.name = 'water'; waterMeshes.push(mesh); scene.add(mesh); }
    }

    // ---- helpers for the buildings ----
    const up = [0, 1, 0];
    const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
    // a flat thing on a wall: centre `c` (x, y, z), along tangent t, size w x h, facing t x up
    function onWall(k, c, t, w, h, col, uv) {
      const a = add3(c, mul(t, -w / 2)), b = add3(c, mul(t, w / 2));
      B.quad(k, a, b, add3(b, [0, h, 0]), add3(a, [0, h, 0]), uv || [0, 0, 1, 1], col);
    }
    // a gabled roof over (cx, cz), w across x, d along z: the ridge along z ('ns') or x ('ew'); lean: one slope only,
    // high on that side ('n', 's', 'e', 'w')
    function roof(k, cx, cz, w, d, E, rise, o, ridge, lean, col) {
      const x0 = cx - w / 2, x1 = cx + w / 2, z0 = cz - d / 2, z1 = cz + d / 2;
      if (lean) {
        const hi = E + rise, lo = E;
        if (lean === 'n') { const s = rise / d; B.quad(k, [x0 - o, lo - o * s, z1 + o], [x1 + o, lo - o * s, z1 + o], [x1 + o, hi + o * s, z0 - o], [x0 - o, hi + o * s, z0 - o], [x0, 0, x1, Math.hypot(d + 2 * o, rise)], col); }
        if (lean === 'w') { const s = rise / w; B.quad(k, [x1 + o, lo - o * s, z1 + o], [x1 + o, lo - o * s, z0 - o], [x0 - o, hi + o * s, z0 - o], [x0 - o, hi + o * s, z1 + o], [z0, 0, z1, Math.hypot(w + 2 * o, rise)], col); }
        return;
      }
      if (ridge === 'ns') {
        const s = rise / (w / 2), ye = E - o * s, yr = E + rise, L = d + 2 * o, sl = Math.hypot(w / 2 + o, rise + o * s);
        B.quad(k, [x0 - o, ye, z0 - o], [x0 - o, ye, z1 + o], [cx, yr, z1 + o], [cx, yr, z0 - o], [0, 0, L, sl], col);
        B.quad(k, [x1 + o, ye, z1 + o], [x1 + o, ye, z0 - o], [cx, yr, z0 - o], [cx, yr, z1 + o], [0, 0, L, sl], col);
        B.box(k, cx, yr - 0.08, cz, 0.22, 0.2, L, 0, [0.7, 0.66, 0.66]);
      } else {
        const s = rise / (d / 2), ye = E - o * s, yr = E + rise, L = w + 2 * o, sl = Math.hypot(d / 2 + o, rise + o * s);
        B.quad(k, [x1 + o, ye, z0 - o], [x0 - o, ye, z0 - o], [x0 - o, yr, cz], [x1 + o, yr, cz], [0, 0, L, sl], col);
        B.quad(k, [x0 - o, ye, z1 + o], [x1 + o, ye, z1 + o], [x1 + o, yr, cz], [x0 - o, yr, cz], [0, 0, L, sl], col);
        B.box(k, cx, yr - 0.08, cz, L, 0.2, 0.22, 0, [0.7, 0.66, 0.66]);
      }
    }
    const roofY = (b, x, z) => {
      const { cx, cz, w, d, E, rise, ridge } = b;
      return ridge === 'ns' ? E + rise * (1 - Math.abs(x - cx) / (w / 2)) : E + rise * (1 - Math.abs(z - cz) / (d / 2));
    };
    // a lantern: iron frame, warm glass, a halo; on a wall (bracket out along n) or on top of a post or pillar
    function lantern(x, y, z, n, size, hang) {
      const s = size || 1;
      if (n) B.box('iron', x - n[0] * 0.15, y + 0.33 * s, z - n[2] * 0.15, Math.abs(n[2]) > 0.5 ? 0.05 : 0.36, 0.05, Math.abs(n[0]) > 0.5 ? 0.05 : 0.36, 0, null);
      if (hang) B.box('iron', x, y + 0.3 * s, z, 0.03, 0.4, 0.03, 0);
      B.box('iron', x, y - 0.03 * s, z, 0.26 * s, 0.05 * s, 0.26 * s, 0);
      B.box('glass', x, y, z, 0.2 * s, 0.3 * s, 0.2 * s, 0, [1.6, 1.1, 0.62]);
      B.box('iron', x, y + 0.3 * s, z, 0.3 * s, 0.06 * s, 0.3 * s, 0);
      B.cyl('iron', x, y + 0.36 * s, z, 0.16 * s, 0.02, 0.14 * s, 4);
      for (const [dx, dz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) B.box('iron', x + dx * 0.1 * s, y, z + dz * 0.1 * s, 0.025, 0.3 * s, 0.025, 0);
      halos.push([x, y + 0.15 * s, z, 0.75 * s, WARM[0], WARM[1], WARM[2]]);
      lamps3d.push({ x, y: y + 0.15 * s, z, c: 0xffb070, k: 1 });
    }

    // ---- the buildings ----
    const SIDES = (x0, z0, x1, z1) => ({
      s: { o: [x0, 0, z1], t: [1, 0, 0], n: [0, 0, 1], len: x1 - x0 }, n: { o: [x1, 0, z0], t: [-1, 0, 0], n: [0, 0, -1], len: x1 - x0 },
      e: { o: [x1, 0, z1], t: [0, 0, -1], n: [1, 0, 0], len: z1 - z0 }, w: { o: [x0, 0, z0], t: [0, 0, 1], n: [-1, 0, 0], len: z1 - z0 },
    });
    const along = (S, side, f) => side === 's' || side === 'n' ? (X(f.x) - S.o[0]) * S.t[0] : (Z(f.y) - S.o[2]) * S.t[2];
    const TEXKEY = { stone: 'stone', timber: 'timber', planks: 'planks', dry: 'dry' };
    const built = [];
    for (const b of place.buildings) {
      const [px0, py0, px1, py1] = b.fp, x0 = X(px0), x1 = X(px1), z0 = Z(py0), z1 = Z(py1);
      const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, w = x1 - x0, d = z1 - z0, pxm = (px0 + px1) / 2;
      const base = b.floor != null ? b.floor : gh(pxm, py1 + 4);
      let low = base; for (const [a, c] of [[px0, py0], [px1, py0], [px0, py1], [px1, py1], [pxm, py0], [pxm, py1]]) low = Math.min(low, gh(a, c)); low -= 0.3;
      const S = SIDES(x0, z0, x1, z1);
      let y = base; const levels = [];
      b.walls.forEach((s, i) => { levels.push({ k: TEXKEY[s.t], y0: i === 0 ? low : y, y1: y + s.h }); y += s.h; });
      const E = y, top = levels[levels.length - 1].k, rise = b.roof.rise, ridge = b.roof.ridge;
      const info = { cx, cz, w, d, E, rise, ridge }; built.push(Object.assign({ b }, info));
      // walls
      for (const side of ['s', 'n', 'e', 'w']) {
        if (b.open === side) continue;
        const F = S[side], a = F.o, e = add3(F.o, mul(F.t, F.len));
        for (const L of levels) B.quad(L.k, [a[0], L.y0, a[2]], [e[0], L.y0, e[2]], [e[0], L.y1, e[2]], [a[0], L.y1, a[2]], [0, L.y0, F.len, L.y1]);
      }
      if (b.open) {   // the open side: posts, and the back wall shows through
        for (const px of b.posts || []) B.box('wood', X(px), low, z1 - 0.15, 0.24, E - low, 0.24, 0, [0.8, 0.7, 0.62]);
        B.box('wood', cx, E - 0.3, z1 - 0.15, w, 0.3, 0.26, 0, [0.7, 0.6, 0.55]);
      }
      // gables, or a lean-to's high wall
      if (b.roof.lean === 'n') {
        B.quad(top, [x1, E, z0], [x0, E, z0], [x0, E + rise, z0], [x1, E + rise, z0], [0, E, w, E + rise]);
        B.tri(top, [x1, E, z1], [x1, E, z0], [x1, E + rise, z0], [[0, E], [d, E], [d, E + rise]]);
        B.tri(top, [x0, E, z0], [x0, E, z1], [x0, E + rise, z0], [[0, E], [d, E], [0, E + rise]]);
      } else if (b.roof.lean === 'w') {
        B.tri(top, [x0, E, z1], [x1, E, z1], [x0, E + rise, z1], [[0, E], [w, E], [0, E + rise]]);
        B.tri(top, [x1, E, z0], [x0, E, z0], [x0, E + rise, z0], [[0, E], [w, E], [w, E + rise]]);
      } else if (ridge === 'ns') {
        B.tri(top, [x0, E, z1], [x1, E, z1], [cx, E + rise, z1], [[0, E], [w, E], [w / 2, E + rise]]);
        B.tri(top, [x1, E, z0], [x0, E, z0], [cx, E + rise, z0], [[0, E], [w, E], [w / 2, E + rise]]);
      } else {
        B.tri(top, [x1, E, z1], [x1, E, z0], [x1, E + rise, cz], [[0, E], [d, E], [d / 2, E + rise]]);
        B.tri(top, [x0, E, z0], [x0, E, z1], [x0, E + rise, cz], [[0, E], [d, E], [d / 2, E + rise]]);
      }
      roof('roof', cx, cz, w, d, E, rise, b.roof.over, ridge, b.roof.lean);
      // a dark band where the walls meet the ground, and the shade round the house on the ground
      shadeMarks.push(['rect', px0, py0, px1, py1, 0.62]);
      // doors
      for (const f of b.doors || []) {
        const F = S[f.side], a = along(S[f.side], f.side, f), c = add3(add3(F.o, mul(F.t, a)), mul(F.n, 0.04)); c[1] = base;
        const col = f.red ? [1.5, 0.55, 0.45] : f.green ? [0.55, 1.05, 0.8] : [1, 1, 1];
        onWall('stone', add3(c, mul(F.n, -0.01)), F.t, f.w + 0.5, f.h + 0.3, [0.75, 0.72, 0.75], [0, base, f.w + 0.5, base + f.h + 0.3]);
        onWall(f.arch ? (f.double ? 'doorArch2' : 'doorArch') : 'door', c, F.t, f.w, f.h, col);
        B.box('stone', c[0] + F.n[0] * 0.35, base - 0.4, c[2] + F.n[2] * 0.35, Math.abs(F.n[2]) > 0.5 ? f.w + 0.6 : 0.7, 0.42, Math.abs(F.n[0]) > 0.5 ? f.w + 0.6 : 0.7, 0, [0.85, 0.85, 0.9]);
        lights.push([M.px(c[0] + F.n[0]), M.py(c[2] + F.n[2]), 50, 0.25, 'warm']);
      }
      // windows
      for (const f of b.windows || []) {
        const F = S[f.side], a = along(F, f.side, f.side === 's' || f.side === 'n' ? f : { y: f.y }), sill = f.side === 's' || f.side === 'n' ? f.y : f.z;
        const c = add3(add3(F.o, mul(F.t, a)), mul(F.n, 0.05)); c[1] = base + sill;
        if (f.rose) {
          onWall('stone', add3(c, mul(F.n, -0.02)), F.t, f.w + 0.5, f.h + 0.5, [0.85, 0.82, 0.86], [0, 0, f.w + 0.5, f.h + 0.5]);
          onWall('rose', add3(c, [0, 0.25, 0]), F.t, f.w, f.h);
          halos.push([c[0] + F.n[0] * 0.3, c[1] + 0.25 + f.h / 2, c[2] + F.n[2] * 0.3, f.w * 1.6, 1.0, 0.62, 0.36]);
          continue;
        }
        const k = f.dark ? 'winDark' : f.colour ? 'winColour' : 'win';
        onWall('wood', add3(c, mul(F.n, -0.015)), F.t, f.w + 0.22, f.h + 0.22, [0.45, 0.36, 0.32], [0, 0, f.w + 0.22, f.h + 0.22]);
        onWall(k, add3(c, [0, 0.11, 0]), F.t, f.w, f.h);
        B.box('stone', c[0] + F.n[0] * 0.08, c[1] - 0.04, c[2] + F.n[2] * 0.08, Math.abs(F.n[2]) > 0.5 ? f.w + 0.36 : 0.2, 0.1, Math.abs(F.n[0]) > 0.5 ? f.w + 0.36 : 0.2, 0, [0.85, 0.85, 0.9]);
        if (!f.dark) {
          halos.push([c[0] + F.n[0] * 0.25, c[1] + 0.11 + f.h / 2, c[2] + F.n[2] * 0.25, Math.max(f.w, f.h) * 1.25, f.colour ? 0.9 : 1.0, f.colour ? 0.55 : 0.68, f.colour ? 0.45 : 0.36]);
          if (sill < 3) lights.push([M.px(c[0] + F.n[0] * 1.2), M.py(c[2] + F.n[2] * 1.2), 46, 0.3, 'warm']);
        }
      }
      // lanterns on the walls
      for (const f of b.lanterns || []) {
        const F = S[f.side], a = along(F, f.side, f.side === 's' || f.side === 'n' ? f : { y: f.y }), hgt = f.side === 's' || f.side === 'n' ? f.y : f.y2;
        const c = add3(add3(F.o, mul(F.t, a)), mul(F.n, f.hang ? 0.9 : 0.32));
        lantern(c[0], base + hgt, c[2], f.hang ? null : F.n, 0.85, f.hang);
        lights.push([M.px(c[0] + F.n[0] * 0.8), M.py(c[2] + F.n[2] * 0.8), 82, 0.5, 'warm']);
      }
      // chimneys
      for (const c of b.chimneys || []) {
        const x = X(c.x), z = Z(c.y), ry = roofY(info, x, z);
        B.box('stone', x, ry - 1.2, z, c.w, 1.2 + 0.7 + c.h * 0.35, c.d, 0, [0.9, 0.88, 0.92]);
        B.box('stone', x, ry + 0.7 + c.h * 0.35, z, c.w + 0.16, 0.14, c.d + 0.16, 0, [0.6, 0.58, 0.62]);
      }
      // dormers: a small gabled window out of the roof
      for (const f of b.dormers || []) {
        const F = S[f.side], a = along(F, f.side, f.side === 's' || f.side === 'n' ? f : { y: f.y });
        const front = add3(add3(F.o, mul(F.t, a)), mul(F.n, -0.25)), dw = f.w, dh = 1.35, dd = 1.8;
        const ctr = add3(front, mul(F.n, -dd / 2)), ry = Math.atan2(F.n[0], F.n[2]);
        B.box(top, ctr[0], E - 0.4, ctr[2], dw, dh + 0.4, dd, ry, null, { noBack: true });
        const dr = f.side === 's' || f.side === 'n' ? 'ns' : 'ew';
        roof('roof', ctr[0], ctr[2], dr === 'ns' ? dw : dd, dr === 'ns' ? dd : dw, E + dh - 0.05, 0.6, 0.15, dr);
        const wc = add3(front, mul(F.n, 0.04)); wc[1] = E + 0.15;
        onWall('wood', add3(wc, mul(F.n, -0.01)), F.t, 0.78, 0.92, [0.45, 0.36, 0.32]);
        onWall('win', add3(wc, [0, 0.07, 0]), F.t, 0.62, 0.78);
        halos.push([wc[0] + F.n[0] * 0.2, wc[1] + 0.45, wc[2] + F.n[2] * 0.2, 0.9, 1.0, 0.68, 0.36]);
      }
      // a flower box under the upper windows
      if (b.flowerbox) {
        const f = b.flowerbox, F = S[f.side], a0 = along(F, f.side, { x: f.x0 }), a1 = along(F, f.side, { x: f.x1 }), L = Math.abs(a1 - a0);
        const c = add3(add3(F.o, mul(F.t, (a0 + a1) / 2)), mul(F.n, 0.16)); c[1] = base + f.y - 0.25;
        B.box('wood', c[0], c[1], c[2], Math.abs(F.n[2]) > 0.5 ? L : 0.3, 0.26, Math.abs(F.n[0]) > 0.5 ? L : 0.3, 0, [0.7, 0.55, 0.45]);
        for (let s = 0; s < L; s += 0.45) { const p = add3(add3(F.o, mul(F.t, Math.min(a0, a1) + s + 0.22)), mul(F.n, 0.18)); B.quad('fl_mix', [p[0] - F.t[0] * 0.3, c[1] + 0.18, p[2] - F.t[2] * 0.3], [p[0] + F.t[0] * 0.3, c[1] + 0.18, p[2] + F.t[2] * 0.3], [p[0] + F.t[0] * 0.3, c[1] + 0.62, p[2] + F.t[2] * 0.3], [p[0] - F.t[0] * 0.3, c[1] + 0.62, p[2] - F.t[2] * 0.3], [0, 0, 1, 1]); }
      }
      // climbing roses on the front
      if (b.roses) { const F = S.s; for (let s = 0.3; s < F.len - 0.3; s += 0.7 + R() * 0.5) { const p = add3(add3(F.o, mul(F.t, s)), mul(F.n, 0.06)); const hh = 1.4 + R() * 2.2; onWall('fl_mix', [p[0], base, p[2]], F.t, 0.7, hh, null, [0, 0, 1, hh / 0.9]); } }
      // the chapel's bell-cote on the front of its ridge, with an iron cross
      if (b.belfry) {
        const bz = z1 - 0.8, by = E + rise - 0.9;
        B.box('stone', cx, by, bz, 1.3, 2.0, 1.2, 0, [0.95, 0.93, 0.97]);
        B.quad('winDark', [cx - 0.3, by + 0.8, bz + 0.61], [cx + 0.3, by + 0.8, bz + 0.61], [cx + 0.3, by + 1.7, bz + 0.61], [cx - 0.3, by + 1.7, bz + 0.61], [0, 0, 1, 1]);
        roof('roof', cx, bz, 1.5, 1.4, by + 2.0, 1.1, 0.1, 'ns');
        B.box('iron', cx, by + 3.1, bz + 0.6, 0.08, 1.0, 0.08, 0); B.box('iron', cx, by + 3.75, bz + 0.6, 0.5, 0.08, 0.08, 0);
      }
      // the forge's hearth: a stone hood, its fire, and a strong orange glow
      if (b.hearth) {
        const f = b.hearth, c = [X(f.x), base, z1];
        B.box('stone', c[0], base, c[2] + 0.3, f.w + 0.9, f.h + 0.7, 0.6, 0, [0.9, 0.86, 0.86]);
        B.quad('glass', [c[0] - f.w / 2, base + 0.1, c[2] + 0.61], [c[0] + f.w / 2, base + 0.1, c[2] + 0.61], [c[0] + f.w / 2, base + f.h, c[2] + 0.61], [c[0] - f.w / 2, base + f.h, c[2] + 0.61], [0, 0, 1, 1], [0.32, 0.1, 0.05]);
        B.box('glass', c[0], base + 0.1, c[2] + 0.5, f.w * 0.7, 0.55, 0.22, 0, [2.0, 0.95, 0.35]);
        halos.push([c[0], base + 0.6, c[2] + 0.8, 3.2, 1.0, 0.52, 0.22]); lamps3d.push({ x: c[0], y: base + 0.8, z: c[2] + 1.0, c: 0xff7a30, k: 2.2 });
        B.box('stone', c[0], base, c[2] + 1.1, f.w + 0.5, 0.25, 0.9, 0, [0.7, 0.66, 0.66]);
      }
      if (b.fire) { const fx = X(b.fire[0]), fz = Z(b.fire[1]); B.box('stone', fx, base, fz, 0.9, 0.7, 0.7, 0, [0.8, 0.75, 0.75]); B.box('glass', fx, base + 0.7, fz, 0.5, 0.25, 0.4, 0, [2.0, 0.9, 0.3]); halos.push([fx, base + 1.0, fz, 1.8, 1.0, 0.55, 0.25]); }
      if (b.sign) {
        const sx = X(b.sign[0]), sz = Z(b.sign[1]);
        B.box('iron', sx - 0.4, base + 3.3, sz, 0.9, 0.06, 0.06, 0); B.box('wood', sx - 0.2, base + 2.5, sz, 0.7, 0.75, 0.08, 0, [0.7, 0.55, 0.45]);
        B.box('iron', sx - 0.2, base + 2.75, sz + 0.05, 0.3, 0.3, 0.03, 0);
      }
    }

    // ---- Nettie's stall: a counter of fruit and bread under a striped awning ----
    if (place.stall) {
      const s = place.stall, [a, b] = s.front, f0 = [X(a[0]), Z(a[1])], f1 = [X(b[0]), Z(b[1])];
      const tx = f1[0] - f0[0], tz = f1[1] - f0[1], L = Math.hypot(tx, tz), t = [tx / L, 0, tz / L];
      let n = [tz / L, 0, -tx / L]; const toHouse = [X(364) - f0[0], Z(313) - f0[1]]; if (n[0] * toHouse[0] + n[2] * toHouse[1] > 0) n = mul(n, -1);
      const mid = [(f0[0] + f1[0]) / 2, 0, (f0[1] + f1[1]) / 2], ry = Math.atan2(n[0], n[2]), base = gh((a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
      const back = add3(mid, mul(n, -s.depth)), cnt = add3(mid, mul(n, -0.5));
      B.box('wood', cnt[0], base, cnt[2], L, s.counter, 1.0, ry, [0.75, 0.6, 0.5]);
      const pc = add3(mid, mul(n, -0.5)); pc[1] = base + s.counter + 0.01;
      B.quad('produce', add3(add3(pc, mul(t, -L / 2)), mul(n, 0.48)), add3(add3(pc, mul(t, L / 2)), mul(n, 0.48)), add3(add3(add3(pc, mul(t, L / 2)), mul(n, -0.48)), [0, 0.22, 0]), add3(add3(add3(pc, mul(t, -L / 2)), mul(n, -0.48)), [0, 0.22, 0]), [0, 0, 1, 1]);
      for (const [u, v] of [[-0.5, 0.05], [0.5, 0.05], [-0.5, -1], [0.5, -1]]) { const p = add3(add3(mid, mul(t, u * (L - 0.1))), mul(n, v * s.depth)); B.box('wood', p[0], base, p[2], 0.12, s.top, 0.12, ry, [0.7, 0.55, 0.45]); }
      const hi = base + s.top + 0.1, lo = base + s.top - 0.45, fr = add3(mid, mul(n, 0.55)), bk = add3(mid, mul(n, -s.depth));
      const A1 = add3(add3(fr, mul(t, -L / 2 - 0.15)), [0, lo, 0]), A2 = add3(add3(fr, mul(t, L / 2 + 0.15)), [0, lo, 0]), A3 = add3(add3(bk, mul(t, L / 2 + 0.15)), [0, hi, 0]), A4 = add3(add3(bk, mul(t, -L / 2 - 0.15)), [0, hi, 0]);
      B.quad('cloth', A1, A2, A3, A4, [0, 0, Math.round(L / 0.45), 1]);
      B.quad('cloth', add3(A1, [0, -0.3, 0]), add3(A2, [0, -0.3, 0]), A2, A1, [0, 0, Math.round(L / 0.45), 0.25]);
      // crates and baskets round it
      B.box('wood', back[0] + t[0] * (L / 2 + 0.4), base, back[2] + t[2] * (L / 2 + 0.4), 0.6, 0.5, 0.6, ry, [0.8, 0.65, 0.5]);
      const poly = [add3(add3(mid, mul(t, -L / 2)), mul(n, 0.1)), add3(add3(mid, mul(t, L / 2)), mul(n, 0.1)), add3(add3(back, mul(t, L / 2)), [0, 0, 0]), add3(add3(back, mul(t, -L / 2)), [0, 0, 0])].map((p) => [M.px(p[0]), M.py(p[2])]);
      addBlock(poly); shadeMarks.push(['poly', poly, 0.6]);
      lights.push([M.px(mid[0] + n[0]), M.py(mid[2] + n[2]), 60, 0.3, 'warm']);
    }

    // ---- walls along lines: stone, with iron railings or wooden pickets on top ----
    for (const wl of place.walls || []) {
      for (let k = 1; k < wl.pts.length; k++) {
        const [ax, ay] = wl.pts[k - 1], [bx, by] = wl.pts[k], A = [X(ax), Z(ay)], Bp = [X(bx), Z(by)];
        const dx = Bp[0] - A[0], dz = Bp[1] - A[1], L = Math.hypot(dx, dz), ry = Math.atan2(-dz, dx), n = Math.max(1, Math.ceil(L / 1.6));
        let postAt = 0;
        for (let i = 0; i < n; i++) {
          const f = (i + 0.5) / n, x = A[0] + dx * f, z = A[1] + dz * f, px = M.px(x), py = M.py(z), g = gh(px, py), seg = L / n + 0.02;
          const top = g + wl.h, bot = wl.drop ? -2.9 : g - 0.4;
          if (wl.h > 0) B.box(wl.tex === 'dry' ? 'dry' : 'stone', x, bot, z, seg, top - bot, wl.t, ry, null, { u0: i * seg });
          if (wl.top === 'rail') {
            B.box('iron', x, top + 0.12, z, seg, 0.04, 0.04, ry); B.box('iron', x, top + wl.topH - 0.18, z, seg, 0.04, 0.04, ry);
            for (let s = -seg / 2 + 0.065; s < seg / 2; s += 0.13) { const bx_ = x + Math.cos(ry) * s, bz_ = z - Math.sin(ry) * s; B.box('iron', bx_, top, bz_, 0.03, wl.topH, 0.03, ry); B.box('iron', bx_, top + wl.topH, bz_, 0.05, 0.08, 0.05, ry + 0.785); }
          }
          if (wl.top === 'fence') {
            B.box('wood', x, top + 0.18, z, seg, 0.07, 0.04, ry, [0.5, 0.4, 0.36]); B.box('wood', x, top + wl.topH - 0.25, z, seg, 0.07, 0.04, ry, [0.5, 0.4, 0.36]);
            for (let s = -seg / 2 + 0.09; s < seg / 2; s += 0.18) { const bx_ = x + Math.cos(ry) * s, bz_ = z - Math.sin(ry) * s; B.box('wood', bx_, top, bz_, 0.08, wl.topH, 0.035, ry, [0.55, 0.43, 0.38]); }
          }
          postAt += L / n;
          if (wl.top === 'rail' && (i === 0 || postAt > 3.6)) { postAt = 0; B.box('stone', A[0] + dx * (i / n), bot, A[1] + dz * (i / n), 0.5, top - bot + wl.topH + 0.15, 0.5, ry, [0.95, 0.93, 0.97]); }
          shadeMarks.push(['dot', px, py, 14, 0.75]);
        }
        if (wl.top === 'rail') B.box('stone', Bp[0], gh(bx, by) - 0.4, Bp[1], 0.5, wl.h + 0.4 + wl.topH + 0.15, 0.5, ry, [0.95, 0.93, 0.97]);
      }
    }

    // ---- stone steps ----
    for (const s of STEPS) {
      const xa = X(s.x0), xb = X(s.x1);
      for (const t of s.treads) {
        const za = Z(t.ya), zb = Z(t.yb);
        B.box('stone', (xa + xb) / 2, t.top - 0.5, (za + zb) / 2, xb - xa, 0.5, zb - za + 0.02, 0, [0.95, 0.93, 0.98]);
        B.box('stone', xa - 0.18, t.top - 0.5, (za + zb) / 2, 0.36, 0.8, zb - za + 0.02, 0, [0.8, 0.78, 0.82]);
        B.box('stone', xb + 0.18, t.top - 0.5, (za + zb) / 2, 0.36, 0.8, zb - za + 0.02, 0, [0.8, 0.78, 0.82]);
      }
    }

    // ---- the Moonwell ----
    if (place.moonwell) {
      const mw = place.moonwell, cx = X(mw.c[0]), cz = Z(mw.c[1]), [r0, r1] = mw.ring, N = 56;
      const a0 = Math.PI / 2 + mw.gap, a1 = Math.PI / 2 + TAU - mw.gap;
      const benchAt = (a) => (mw.benches || []).some((bb) => Math.abs(Math.atan2(Math.sin(a - bb.a), Math.cos(a - bb.a))) < 0.24);
      const P2 = (a, r, y) => [cx + Math.cos(a) * r, y, cz + Math.sin(a) * r];
      for (let i = 0; i < N; i++) {
        const aa = a0 + (a1 - a0) * i / N, ab = a0 + (a1 - a0) * (i + 1) / N, u0 = aa * r1, u1 = ab * r1, bench = benchAt((aa + ab) / 2);
        // the outer wall (a low ring of rounded stones), the inner kerb, and the bed of flowers between
        const ow = 0.55, iw = 0.42, rr = r1 - 0.32;
        B.quad('dry', P2(ab, r1, -0.2), P2(aa, r1, -0.2), P2(aa, r1, ow), P2(ab, r1, ow), [u1, -0.2, u0, ow]);
        B.quad('dry', P2(aa, rr, ow), P2(aa, r1, ow), P2(ab, r1, ow), P2(ab, rr, ow), [u0, 0, u1, 0.32]);
        B.quad('dry', P2(aa, rr, -0.2), P2(ab, rr, -0.2), P2(ab, rr, ow), P2(aa, rr, ow), [u0, -0.2, u1, ow]);
        B.quad('dry', P2(aa, r0, -0.2), P2(ab, r0, -0.2), P2(ab, r0, iw), P2(aa, r0, iw), [aa * r0, -0.2, ab * r0, iw]);
        B.quad('dry', P2(ab, r0, iw), P2(ab, r0 + 0.3, iw), P2(aa, r0 + 0.3, iw), P2(aa, r0, iw), [0, 0, 0.3, 0.3]);
        if (!bench) {
          B.quad('soil', P2(ab, r0 + 0.3, 0.36), P2(ab, rr, 0.36), P2(aa, rr, 0.36), P2(aa, r0 + 0.3, 0.36), [0, 0, 1, 1]);
          if (i % 2 === 0) { const am = (aa + ab) / 2, kk = FLOWER_KINDS[(i / 2) % 3]; const c = P2(am, (r0 + r1) / 2 - 0.1, 0.32), tt = [-Math.sin(am), 0, Math.cos(am)];
            for (const rot of [0, 1]) { const t2 = rot ? [Math.cos(am), 0, Math.sin(am)] : tt; B.quad('fl_' + kk, add3(c, mul(t2, -0.55)), add3(c, mul(t2, 0.55)), add3(add3(c, mul(t2, 0.55)), [0, 0.7, 0]), add3(add3(c, mul(t2, -0.55)), [0, 0.7, 0]), [0, 0, 1, 1]); } }
        } else B.quad('stone', P2(ab, r0 + 0.3, 0.02), P2(ab, rr, 0.02), P2(aa, rr, 0.02), P2(aa, r0 + 0.3, 0.02), [aa * 3.5, r0, ab * 3.5, rr], [0.8, 0.8, 0.85]);
      }
      for (const a of [a0, a1]) { const sgn = a === a0 ? -1 : 1; const t = [-Math.sin(a) * sgn, 0, Math.cos(a) * sgn]; B.quad('dry', P2(a, r1, -0.2), P2(a, r0, -0.2), P2(a, r0, 0.5), P2(a, r1, 0.5), [0, -0.2, r1 - r0, 0.5]); void t; }
      // the benches, facing the well
      for (const bb of mw.benches || []) { const c = P2(bb.a, (r0 + r1) / 2, 0); bench(c[0], 0, c[2], Math.atan2(-Math.cos(bb.a), -Math.sin(bb.a))); }
      // the well: a round stone wall, the glowing water, the iron arch and its lantern
      const wr = mw.well, wh = mw.wellH;
      B.cyl('stone', cx, -0.2, cz, wr, wr, wh + 0.2, 20, [0.95, 0.93, 0.98], [TAU * wr, wh], true);
      const inner = new THREE.CylinderGeometry(wr - 0.28, wr - 0.28, wh, 20, 1, true); inner.scale(-1, 1, 1);
      B.geom('stone', inner, new THREE.Matrix4().makeTranslation(cx, wh / 2, cz), [0.6, 0.6, 0.66], [TAU * wr, wh]); inner.dispose();
      const rim = new THREE.RingGeometry(wr - 0.3, wr + 0.06, 24, 1); rim.rotateX(-Math.PI / 2);
      B.geom('stone', rim, new THREE.Matrix4().makeTranslation(cx, wh, cz), [0.9, 0.9, 0.95], 2); rim.dispose();
      const disc = new THREE.CircleGeometry(wr - 0.28, 24); disc.rotateX(-Math.PI / 2);
      B.geom('moonwater', disc, new THREE.Matrix4().makeTranslation(cx, wh - 0.3, cz), [1.15, 1.2, 1.35], 1); disc.dispose();
      halos.push([cx, wh + 0.1, cz, 2.6, 0.32, 0.48, 0.75]); lamps3d.push({ x: cx, y: wh + 0.4, z: cz, c: 0x8ab8ff, k: 1.6 });
      for (const sx of [-1, 1]) { B.box('iron', cx + sx * (wr - 0.1), wh, cz, 0.12, 2.3, 0.12, 0); B.box('iron', cx + sx * (wr - 0.1), wh + 0.1, cz, 0.2, 0.12, 0.2, 0); }
      const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(cx - wr + 0.1, wh + 2.25, cz), new THREE.Vector3(cx, wh + 3.15, cz), new THREE.Vector3(cx + wr - 0.1, wh + 2.25, cz));
      const tube = new THREE.TubeGeometry(curve, 14, 0.055, 5, false); B.geom('iron', tube, new THREE.Matrix4(), null, 1); tube.dispose();
      for (const sx of [-1, 1]) { const sc = new THREE.TorusGeometry(0.22, 0.03, 4, 12, Math.PI * 1.5); B.geom('iron', sc, new THREE.Matrix4().makeTranslation(cx + sx * 0.55, wh + 2.45, cz), null, 1); sc.dispose(); }
      B.box('iron', cx, wh + 2.2, cz, 0.03, 0.55, 0.03, 0);
      lantern(cx, wh + 1.75, cz, null, 0.9);
      lights.push([mw.c[0], mw.c[1] - 10, 150, 0.6, 'moon'], [mw.c[0], mw.c[1], 70, 0.6, 'warm']);
      shadeMarks.push(['ring', mw.c[0], mw.c[1], (r0 - 0.2) / M.SX, (r1 + 0.35) / M.SX, 0.72]);
    }

    // a wooden bench with iron ends, facing `face` (0: south)
    function bench(x, y, z, face) {
      const c = Math.cos(face), s = Math.sin(face), P_ = (lx, lz) => [x + lx * c + lz * s, z - lx * s + lz * c];
      for (let i = 0; i < 4; i++) { const p = P_(0, -0.18 + i * 0.12); B.box('wood', p[0], y + 0.42, p[1], 1.5, 0.04, 0.1, face, [0.85, 0.65, 0.5]); }
      for (let i = 0; i < 3; i++) { const p = P_(0, -0.3); B.box('wood', p[0], y + 0.58 + i * 0.13, p[1], 1.5, 0.08, 0.035, face, [0.85, 0.65, 0.5]); }
      for (const sx of [-0.68, 0.68]) { const p = P_(sx, 0), q = P_(sx, -0.3); B.box('iron', p[0], y, p[1], 0.06, 0.45, 0.5, face); B.box('iron', q[0], y, q[1], 0.06, 0.95, 0.06, face); }
    }

    // ---- lamps on posts and stone pillars ----
    for (const l of place.lamps || []) {
      const x = X(l.at[0]), z = Z(l.at[1]), y = l.y != null ? l.y : walkH(l.at[0], l.at[1]);
      if (l.kind === 'pillar') {
        B.box('stone', x, y - 0.3, z, 0.62, 1.75, 0.62, 0, [0.95, 0.93, 0.98]); B.box('stone', x, y + 1.45, z, 0.76, 0.14, 0.76, 0, [0.8, 0.78, 0.84]);
        lantern(x, y + 1.62, z, null, 1.05);
        lights.push([l.at[0], l.at[1] - 6, 140, 1.15, 'warm']);
      } else {
        const hh = l.short ? 1.9 : 3.0;
        B.box('iron', x, y, z, 0.26, 0.3, 0.26, 0); B.cyl('iron', x, y + 0.3, z, 0.06, 0.045, hh - 0.3, 6);
        B.box('iron', x, y + hh - 0.06, z, 0.3, 0.06, 0.06, 0);
        lantern(x, y + hh + 0.02, z, null, 1.1);
        lights.push([l.at[0], l.at[1] - 4, 150, 1.25, 'warm']);
      }
      addBlock(circlePx(l.at[0], l.at[1], l.kind === 'pillar' ? 0.42 : 0.22, 8));
    }

    // ---- the jetties ----
    for (const j of place.jetties || []) {
      const [px0, py0, px1, py1] = j.r, x0 = X(px0), x1 = X(px1), z0 = Z(py0), z1 = Z(py1);
      B.box('deck', (x0 + x1) / 2, j.y - 0.18, (z0 + z1) / 2, x1 - x0, 0.18, z1 - z0, 0, null, { u0: 0 });
      const posts = []; for (let x = x0 + 0.2; x <= x1 - 0.1; x += 2.2) posts.push([x, z0 + 0.15], [x, z1 - 0.15]); posts.push([x1 - 0.15, z0 + 0.15], [x1 - 0.15, z1 - 0.15]);
      for (const [x, z] of posts) B.cyl('wood', x, -3.4, z, 0.15, 0.15, j.y + 3.4 + 0.45 * (R() > 0.4 ? 1 : 0.2), 7, [0.6, 0.48, 0.42]);
      shadeMarks.push(['rect', px0, py0, px1, py1, 0.82]);
    }

    // ---- the east bridge: a paved deck rising over one stone arch, low parapets, a lamp pillar at each corner ----
    if (place.bridge) {
      const br = place.bridge, x0 = X(br.x0), x1 = X(br.x1), zN = Z(br.y0 + 4), zS = Z(br.y1 - 4), NS = 16;
      const archX0 = X(1356), archX1 = X(1482), am = (archX0 + archX1) / 2, ah = (archX1 - archX0) / 2, spring = -2.9, crown = -0.35;
      const archY = (x) => { const u = (x - am) / ah; return Math.abs(u) >= 1 ? -3.6 : spring + (crown - spring) * Math.sqrt(1 - u * u); };
      const dy = (x) => place.deck(M.px(x)) + 0.02;
      for (let i = 0; i < NS; i++) {
        const xa = x0 + (x1 - x0) * i / NS, xb = x0 + (x1 - x0) * (i + 1) / NS, ya = dy(xa), yb = dy(xb);
        B.quad('pave', [xa, ya, zS], [xb, yb, zS], [xb, yb, zN], [xa, ya, zN], [xa, zS, xb, zN]);
        // the side faces down to the arch, and the arch's underside
        const ba = archY(xa), bb = archY(xb);
        B.quad('stone', [xa, ba, zS + 0.35], [xb, bb, zS + 0.35], [xb, yb + 0.85, zS + 0.35], [xa, ya + 0.85, zS + 0.35], [xa, ba, xb, ya + 0.85]);
        B.quad('stone', [xb, bb, zN - 0.35], [xa, ba, zN - 0.35], [xa, ya + 0.85, zN - 0.35], [xb, yb + 0.85, zN - 0.35], [xa, ba, xb, ya + 0.85]);
        if (ba > -3.5 || bb > -3.5) B.quad('stone', [xb, bb, zS + 0.35], [xa, ba, zS + 0.35], [xa, ba, zN - 0.35], [xb, bb, zN - 0.35], [xa, zS, xb, zN], [0.6, 0.6, 0.66]);
        // the parapets: inner faces and tops
        for (const [z, s] of [[zS, 1], [zN, -1]]) {
          const zi = z, zo = z + s * 0.35;
          if (s > 0) { B.quad('stone', [xb, yb, zi], [xa, ya, zi], [xa, ya + 0.85, zi], [xb, yb + 0.85, zi], [xa, ya, xb, ya + 0.85]); B.quad('stone', [xa, ya + 0.85, zi], [xb, yb + 0.85, zi], [xb, yb + 0.85, zo], [xa, ya + 0.85, zo], [xa, 0, xb, 0.35], [0.85, 0.85, 0.9]); }
          else { B.quad('stone', [xa, ya, zi], [xb, yb, zi], [xb, yb + 0.85, zi], [xa, ya + 0.85, zi], [xa, ya, xb, ya + 0.85]); B.quad('stone', [xb, yb + 0.85, zi], [xa, ya + 0.85, zi], [xa, ya + 0.85, zo], [xb, yb + 0.85, zo], [xa, 0, xb, 0.35], [0.85, 0.85, 0.9]); }
        }
      }
      B.box('stone', x0 + 0.2, -3.6, (zN + zS) / 2, 0.4, 3.58, zS - zN + 0.7, 0, [0.9, 0.9, 0.95]);
      shadeMarks.push(['rect', br.x0 + 40, br.y1 - 6, br.x1, br.y1 + 30, 0.7]);
    }

    // lumpy balls for the leaves, shaded smooth (each corner's normal points out from the middle, so the same corner of
    // two faces lights the same)
    const lumpy = (detail, seed, k0, k1, sy) => { const g = new THREE.IcosahedronGeometry(1, detail), p = g.attributes.position, n = g.attributes.normal, r = rand(seed), seen = {};
      for (let i = 0; i < p.count; i++) { const key = p.getX(i).toFixed(3) + p.getY(i).toFixed(3) + p.getZ(i).toFixed(3), k = seen[key] || (seen[key] = k0 + r() * k1); const x = p.getX(i), y = p.getY(i), z = p.getZ(i), L = Math.hypot(x, y, z); n.setXYZ(i, x / L, y / L, z / L); p.setXYZ(i, x * k, y * k * (sy || 1), z * k); }
      return g; };
    const ico = [0, 1, 2].map((v) => lumpy(1, 31 + v, 0.84, 0.28)), rockShapes = [0, 1, 2].map((v) => lumpy(1, 71 + v, 0.75, 0.4, 0.68));

    // ---- small things ----
    for (const pr of place.props || []) {
      const x = X(pr.at[0]), z = Z(pr.at[1]), y = pr.y != null ? pr.y : gh(pr.at[0], pr.at[1]);
      const solid = (r) => addBlock(circlePx(pr.at[0], pr.at[1], r, 8));
      if (pr.k === 'bench') { bench(x, y, z, pr.face || 0); }
      else if (pr.k === 'barrel') { B.cyl('wood', x, y, z, 0.33, 0.33, 0.9, 10, [0.75, 0.55, 0.42], [2.1, 0.9]); B.cyl('iron', x, y + 0.15, z, 0.345, 0.345, 0.06, 10, null, null, true); B.cyl('iron', x, y + 0.7, z, 0.345, 0.345, 0.06, 10, null, null, true); shadeMarks.push(['dot', pr.at[0], pr.at[1], 14, 0.7]); }
      else if (pr.k === 'crates') { B.box('wood', x, y, z, 0.8, 0.6, 0.7, 0.2, [0.85, 0.7, 0.55]); B.box('wood', x + 0.1, y + 0.6, z - 0.05, 0.6, 0.5, 0.55, -0.15, [0.8, 0.65, 0.5]); shadeMarks.push(['dot', pr.at[0], pr.at[1], 18, 0.68]); }
      else if (pr.k === 'anvil') { B.box('wood', x, y, z, 0.5, 0.45, 0.5, 0, [0.6, 0.45, 0.38]); B.box('iron', x, y + 0.45, z, 0.3, 0.2, 0.22, 0); B.box('iron', x, y + 0.65, z, 0.75, 0.16, 0.26, 0); B.cyl('iron', x + 0.45, y + 0.66, z, 0.1, 0.02, 0.14, 6); }
      else if (pr.k === 'pot') { B.cyl('stone', x, y, z, 0.2, 0.28, 0.42, 9, [1.3, 0.75, 0.55]); const kk = FLOWER_KINDS[Math.floor(R() * 3)]; for (const r_ of [0, 1.57]) B.quad('fl_' + kk, [x - Math.cos(r_) * 0.35, y + 0.3, z - Math.sin(r_) * 0.35], [x + Math.cos(r_) * 0.35, y + 0.3, z + Math.sin(r_) * 0.35], [x + Math.cos(r_) * 0.35, y + 0.85, z + Math.sin(r_) * 0.35], [x - Math.cos(r_) * 0.35, y + 0.85, z - Math.sin(r_) * 0.35], [0, 0, 1, 1]); }
      else if (pr.k === 'statue') { B.box('stone', x, y, z, 0.6, 0.8, 0.6, 0, [0.95, 0.95, 1]); B.cyl('stone', x, y + 0.8, z, 0.17, 0.12, 0.8, 8, [0.95, 0.95, 1]); const sg = new THREE.SphereGeometry(0.13, 8, 6); B.geom('stone', sg, new THREE.Matrix4().makeTranslation(x, y + 1.72, z), [0.95, 0.95, 1], 1); sg.dispose(); solid(0.4); }
      else if (pr.k === 'grave') {
        if (pr.cross) { B.box('stone', x, y - 0.2, z, 0.14, 1.35, 0.14, 0, [0.85, 0.85, 0.92]); B.box('stone', x, y + 0.75, z, 0.6, 0.14, 0.14, 0, [0.85, 0.85, 0.92]); }
        else { B.box('stone', x, y - 0.2, z, 0.55, 0.95, 0.14, (R() - 0.5) * 0.15, [0.8, 0.8, 0.88]); const top = new THREE.CylinderGeometry(0.275, 0.275, 0.14, 10, 1, false, 0, Math.PI); top.rotateZ(Math.PI / 2); top.rotateY(Math.PI / 2); B.geom('stone', top, new THREE.Matrix4().makeTranslation(x, y + 0.75, z), [0.8, 0.8, 0.88], 1); top.dispose(); }
      }
      else if (pr.k === 'post') { B.box('stone', x, y - 0.3, z, 0.55, (pr.h || 1.6) + 0.3, 0.55, 0, [0.95, 0.93, 0.98]); B.box('stone', x, y + (pr.h || 1.6), z, 0.68, 0.14, 0.68, 0, [0.8, 0.78, 0.84]); }
      else if (pr.k === 'rock') { const sz = pr.size || 1; B.geom('rock', rockShapes[Math.floor(R() * 3)], new THREE.Matrix4().compose(new THREE.Vector3(x, y - sz * 0.2, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, R() * TAU, 0)), new THREE.Vector3(sz, sz, sz)), null, 1.2); if (pr.solid !== false) solid(sz * 0.8); }
      else if (pr.k === 'sunflowers') { for (let i = 0; i < 5; i++) { const sx = x + (R() - 0.5) * 1.4, sz = z + (R() - 0.5) * 0.8, hh = 1.4 + R() * 0.6; B.box('leafBush', sx, y, sz, 0.05, hh, 0.05, 0, [0.6, 0.8, 0.5]); B.quad('fl_sun', [sx - 0.35, y + hh - 0.3, sz + 0.02], [sx + 0.35, y + hh - 0.3, sz + 0.02], [sx + 0.35, y + hh + 0.4, sz + 0.02], [sx - 0.35, y + hh + 0.4, sz + 0.02], [0, 0, 1, 1]); } }
    }

    // ---- the place's own things (tents, boats, campfires...): its data's extra(K) builds them with the same parts ----
    function extras() {
      if (typeof place.extra !== 'function') return;
      const K = { B, M, X, Z, gh, walkH, terrain, R, TAU, lantern, bench, addBlock, circlePx, lights, halos, shadeMarks, lamps3d, ico, rockG: rockShapes,
        light: (px, py, r, s, kind) => lights.push([px, py, r, s, kind || 'warm']),
        halo: (x, y, z, size, rgb) => halos.push([x, y, z, size, rgb[0], rgb[1], rgb[2]]),
        fire(px, py, size) { const x = X(px), z = Z(py), y = gh(px, py), s = size || 1; B.box('stone', x, y - 0.1, z, 0.9 * s, 0.25, 0.9 * s, 0.785, [0.6, 0.58, 0.6]); B.box('glass', x, y + 0.1, z, 0.45 * s, 0.35 * s, 0.45 * s, 0.3, [2.0, 0.85, 0.3]); B.box('glass', x, y + 0.3 * s, z, 0.25 * s, 0.35 * s, 0.25 * s, 1.1, [2.2, 1.2, 0.4]); halos.push([x, y + 0.5 * s, z, 2.6 * s, 1.0, 0.5, 0.2]); lights.push([px, py, 170 * s, 1.4, 'forge']); lamps3d.push({ x, y: y + 0.6, z, c: 0xff8a40, k: 1.8 }); addBlock(circlePx(px, py, 0.6 * s, 8)); },
      };
      place.extra(K);
    }

    // ---- flower beds and flowering bushes ----
    const blobCol = (cy, r) => (v) => { const t = clamp((v.y - cy) / r * 0.5 + 0.5, 0, 1); const k = 0.42 + 0.68 * t; return [k * 0.95, k, k * 1.02]; };
    for (const [fx, fy, rr, kind] of place.flowers || []) {
      const x = X(fx), z = Z(fy), y = gh(fx, fy), h = rr * 0.75;
      B.geom('leafBush', ico[(fx + fy) % 3], new THREE.Matrix4().compose(new THREE.Vector3(x, y + h * 0.55, z), new THREE.Quaternion(), new THREE.Vector3(rr, h, rr)), blobCol(y + h * 0.55, h), 2.2);
      const n = Math.max(2, Math.round(rr * 4));
      for (let i = 0; i < n; i++) {
        const a = R() * TAU, d = R() * rr * 0.75, cx_ = x + Math.cos(a) * d, cz_ = z + Math.sin(a) * d, hh = y + h * (0.6 + R() * 0.6), s = 0.45 + R() * 0.25, r2 = R() * Math.PI;
        B.quad('fl_' + kind, [cx_ - Math.cos(r2) * s, hh - s * 0.6, cz_ - Math.sin(r2) * s], [cx_ + Math.cos(r2) * s, hh - s * 0.6, cz_ + Math.sin(r2) * s], [cx_ + Math.cos(r2) * s, hh + s, cz_ + Math.sin(r2) * s], [cx_ - Math.cos(r2) * s, hh + s, cz_ - Math.sin(r2) * s], [0, 0, 1, 1]);
      }
      shadeMarks.push(['dot', fx, fy, rr / M.SX * 1.1, 0.6]);
    }

    // ---- rocks along the river's banks and the lake's ----
    {
      const rockG = rockShapes;
      for (const w of WATER) {
        const poly = w.poly;
        for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
          const [ax, ay] = poly[j], [bx, by] = poly[i], L = Math.hypot(X(bx) - X(ax), Z(by) - Z(ay));
          for (let s = 0; s < L; s += 1.1 + R() * 0.9) {
            const px = ax + (bx - ax) * s / L, py = ay + (by - ay) * s / L;
            if (px < WX0 || px > WX1 || py < WY0 || py > WY1 || nearWalkPx(px, py, 10)) continue;
            if (place.bridge && px > place.bridge.x0 && py > place.bridge.y0 - 10 && py < place.bridge.y1 + 10) continue;
            if (place.jetties && place.jetties.some((jt) => px > jt.r[0] - 8 && px < jt.r[2] + 8 && py > jt.r[1] - 8 && py < jt.r[3] + 8)) continue;
            const sz = 0.55 + R() * 0.9, y = Math.max(w.level(py) - 0.3, terrain(px, py) - sz * 0.3);
            B.geom('rock', rockG[Math.floor(R() * 3)], new THREE.Matrix4().compose(new THREE.Vector3(X(px) + (R() - 0.5) * 0.6, y, Z(py) + (R() - 0.5) * 0.6), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, R() * TAU, 0)), new THREE.Vector3(sz, sz, sz)), null, 1.2);
          }
        }
      }
    }

    extras();

    // ---- the trees, in patches ----
    const trees = ((window.W3D_TREES || {})[place.trees] || []).concat(place.extraTrees || []);
    const patches = {}, PATCH = 22;
    const cone = new THREE.ConeGeometry(1, 1, 9, 1, true), trunk = new THREE.CylinderGeometry(0.6, 1, 1, 6, 1, true);
    const limbG = new THREE.CylinderGeometry(0.22, 1, 1, 5, 1, true); limbG.translate(0, 0.5, 0);
    const UPV = new THREE.Vector3(0, 1, 0), _d = new THREE.Vector3(), _q = new THREE.Quaternion();
    // a limb from `base` along `dir` (a bare tree's trunk and branches): thick at the bottom, thin at the tip
    const limb = (TB, base, dir, len, r, col) => { _d.copy(dir).normalize(); _q.setFromUnitVectors(UPV, _d); TB.geom('bark', limbG, new THREE.Matrix4().compose(base, _q, new THREE.Vector3(r, len, r)), col, [1, len / 2]); };
    for (const [tx, ty, size, kind, seed] of trees) {
      const fir = kind === 1;
      const x = X(tx), z = Z(ty), y = terrain(tx, ty), key = Math.floor(x / PATCH) + ',' + Math.floor(z / PATCH);
      const TB = patches[key] || (patches[key] = W3D.Builder()), r = rand(seed + 1), far = tx < 0 || tx > place.size[0] || ty < 0 || ty > place.size[1];
      if (fir) {
        const H = (5.8 + r() * 2.6) * size, rb = (1.35 + r() * 0.4) * size;
        TB.geom('bark', trunk, new THREE.Matrix4().compose(new THREE.Vector3(x, y + 0.9, z), new THREE.Quaternion(), new THREE.Vector3(0.22 * size, 1.8, 0.22 * size)), [0.7, 0.6, 0.6], [1.5, 2]);
        for (let i = 0; i < 3; i++) {
          const cy = y + H * (0.3 + i * 0.24), cr = rb * (1 - i * 0.26), ch = H * (0.42 - i * 0.04);
          TB.geom('firs', cone, new THREE.Matrix4().compose(new THREE.Vector3(x, cy, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, r() * TAU, 0)), new THREE.Vector3(cr, ch, cr)), blobCol(cy, ch * 0.6), [3, 2]);
        }
        shadeMarks.push(['dot', tx, ty, rb / M.SX * 0.9, 0.55]);
      } else if (kind === 2) {
        // bare and thorny: a leaning trunk, crooked branches, and twigs off them
        const H = (2.4 + r() * 1.4) * size, lean = new THREE.Vector3((r() - 0.5) * 0.35, 1, (r() - 0.5) * 0.35), col = [0.62, 0.55, 0.58];
        const base = new THREE.Vector3(x, y - 0.2, z); limb(TB, base, lean, H + 0.2, 0.2 * size, col);
        const top = base.clone().addScaledVector(lean.clone().normalize(), H);
        const nb = 4 + Math.floor(r() * 3);
        for (let i = 0; i < nb; i++) {
          const a = r() * TAU, at = base.clone().lerp(top, 0.45 + r() * 0.55), d = new THREE.Vector3(Math.cos(a), 0.5 + r() * 0.9, Math.sin(a)), L = (1.2 + r() * 1.5) * size;
          limb(TB, at, d, L, 0.075 * size, col);
          const tip = at.clone().addScaledVector(d.clone().normalize(), L * (0.55 + r() * 0.3));
          for (let k = 0; k < 2; k++) limb(TB, tip, new THREE.Vector3(Math.cos(a + (r() - 0.5) * 2), 0.3 + r(), Math.sin(a + (r() - 0.5) * 2)), (0.5 + r() * 0.7) * size, 0.03 * size, col);
        }
        shadeMarks.push(['dot', tx, ty, 1.2 * size / M.SX, 0.7]);
      } else {
        const H = (2.6 + r() * 1.2) * size, cr = (1.45 + r() * 0.5) * size;
        TB.geom('bark', trunk, new THREE.Matrix4().compose(new THREE.Vector3(x, y + H / 2 - 0.2, z), new THREE.Quaternion(), new THREE.Vector3(0.24 * size, H + 0.4, 0.24 * size)), [0.75, 0.62, 0.58], [1.5, 3]);
        const nb = far ? 2 : 3;
        for (let i = 0; i < nb; i++) {
          const a = r() * TAU, d = i === 0 ? 0 : cr * 0.55, bx = x + Math.cos(a) * d, bz = z + Math.sin(a) * d, by = y + H + cr * (i === 0 ? 0.6 : 0.2 + r() * 0.35), br = cr * (i === 0 ? 1 : 0.68 + r() * 0.15);
          TB.geom('leaves', ico[(seed + i) % 3], new THREE.Matrix4().compose(new THREE.Vector3(bx, by, bz), new THREE.Quaternion().setFromEuler(new THREE.Euler(r(), r() * TAU, 0)), new THREE.Vector3(br, br * 0.82, br)), blobCol(by, br * 0.82), 2.6);
        }
        shadeMarks.push(['dot', tx, ty, cr / M.SX * 0.95, 0.5]);
      }
    }
    cone.dispose(); trunk.dispose(); limbG.dispose();
    // every trunk is solid: Io walks round it
    for (const [tx, ty, size] of trees) if (tx >= WX0 && tx <= WX1 && ty >= WY0 && ty <= WY1) addBlock(circlePx(tx, ty, 0.3 * size, 6));
    const treeMeshes = [];
    for (const key in patches) {
      const meshes = patches[key].build(TM.whole);
      for (const k in meshes) { const mesh = meshes[k]; mesh.userData.tree = k; scene.add(mesh); treeMeshes.push(mesh); }
    }

    // ---- far hills and snowy mountains round the world (they don't fog: they are the far edge) ----
    if (!(place.night && place.night.hills === false)) {
      const HB = B;
      const ring = (Rr, hmin, hmax, f, lowC, topC, snow) => {
        const N = 120, H = (i) => hmin + (hmax - hmin) * (0.55 * vnoise(i * f, 3.7) + 0.3 * vnoise(i * f * 2.7, 9.1) + 0.15 * vnoise(i * f * 7, 1.3));
        for (let i = 0; i < N; i++) {
          const a0 = i / N * TAU, a1 = (i + 1) / N * TAU, h0 = H(i), h1 = H(i + 1);
          const P0 = [Math.cos(a0) * Rr, -25, Math.sin(a0) * Rr], P1 = [Math.cos(a1) * Rr, -25, Math.sin(a1) * Rr];
          const T0 = [P0[0], h0, P0[2]], T1 = [P1[0], h1, P1[2]];
          const g = HB, k = 'hills';
          g.tri(k, P0, P1, T1, [[0, 0], [1, 0], [1, 1]], lowC); g.tri(k, P0, T1, T0, [[0, 0], [1, 1], [0, 1]], lowC);
          if (snow) { const s0 = [T0[0] * 1.001, h0 - 4, T0[2] * 1.001], s1 = [T1[0] * 1.001, h1 - 4, T1[2] * 1.001]; if (h0 > hmin + (hmax - hmin) * 0.5) g.tri(k, s0, s1, T1, [[0, 0], [1, 0], [1, 1]], topC); if (h1 > hmin + (hmax - hmin) * 0.5) g.tri(k, s0, T1, T0, [[0, 0], [1, 1], [0, 1]], topC); }
        }
      };
      ring(260, 25, 85, 0.13, [0.13, 0.13, 0.24], [0.36, 0.37, 0.52], true);
      ring(140, 6, 24, 0.31, [0.045, 0.06, 0.09], null, false);
    }

    // ---- the keepsakes that lie in this place (envoi-final-draft/items/items.js, read only): a shimmer, nothing else,
    // until Io walks into it. place.items moves one ({ id: [x, y] }, a pocket for it) or leaves it out ({ id: false }) ----
    const LOOT = (window.LOOT && window.LOOT.ITEMS) || [], moveTo = place.items || {};
    const items = LOOT.filter((it) => it.home === place.mapId && (moveTo[it.id] || it.at) && moveTo[it.id] !== false)
      .map((it) => ({ id: it.id, name: it.name, look: it.look, pic: it.pic, at: moveTo[it.id] || it.at }))
      .concat(place.extraItems || []);
    let shimmer = null;
    if (items.length) {
      const N = 14, pos = [], cor = [], seed = [], idx = [];
      items.forEach((it, k) => {
        it.x = X(it.at[0]); it.z = Z(it.at[1]); it.y = walkH(it.at[0], it.at[1]); it.k = k;
        for (let i = 0; i < N; i++) { const b = (k * N + i) * 4; for (let c = 0; c < 4; c++) { pos.push(it.x, it.y, it.z); seed.push(Math.random(), Math.random(), i === 0 ? 1 : 0); } cor.push(-1, -1, 1, -1, 1, 1, -1, 1); idx.push(b, b + 1, b + 2, b, b + 2, b + 3); }
      });
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('corner', new THREE.Float32BufferAttribute(cor, 2));
      g.setAttribute('seed', new THREE.Float32BufferAttribute(seed, 3)); g.setAttribute('live', new THREE.Float32BufferAttribute(new Array(pos.length / 3).fill(1), 1)); g.setIndex(idx);
      const mat = new THREE.ShaderMaterial({
        uniforms: { map: { value: pics.halo }, uTime: U.uTime },
        vertexShader: `attribute vec2 corner; attribute vec3 seed; attribute float live; uniform float uTime; varying vec2 vUv; varying float vA;
          void main(){
            vec3 p = position; float t = uTime * (0.35 + seed.y * 0.3) + seed.x * 10.0, f = fract(t);
            float a = seed.x * 6.283 + uTime * 0.6;
            if (seed.z < 0.5) p += vec3(cos(a) * (0.2 + 0.35 * seed.y), 0.08 + f * 1.5, sin(a) * (0.2 + 0.35 * seed.y)); else p.y += 0.05;
            vec4 mv = viewMatrix * vec4(p, 1.0);
            float tw = seed.z > 0.5 ? 1.3 + 0.2 * sin(uTime * 2.0) : (0.06 + 0.07 * seed.y) * sin(f * 3.1416) * (0.7 + 0.3 * sin(uTime * 9.0 + seed.x * 40.0));
            mv.xy += corner * tw * live;
            float d = length(mv.xyz);
            vA = live * (1.0 - smoothstep(7.0, 13.0, d)) * (seed.z > 0.5 ? 0.35 : 1.0);
            vUv = corner * 0.5 + 0.5; gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: 'uniform sampler2D map; varying vec2 vUv; varying float vA; void main(){ float a = texture2D(map, vUv).a; gl_FragColor = vec4(vec3(1.0, 0.92, 0.7) * a * a * vA, 1.0); }',
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      });
      shimmer = new THREE.Mesh(g, mat); shimmer.frustumCulled = false; shimmer.renderOrder = 6; shimmer.name = 'shimmer'; scene.add(shimmer);
    }
    // a keepsake found: its shimmer goes out
    function takeItem(it) { if (!shimmer) return; const a = shimmer.geometry.attributes.live, n = 14 * 4; for (let i = 0; i < n; i++) a.setX(it.k * n + i, 0); a.needsUpdate = true; }

    // ---- the meshes ----
    const meshes = B.build(MAT);
    for (const k in meshes) scene.add(meshes[k]);
    const grounds = groundGeos.map((g) => { const mesh = new THREE.Mesh(g, null); mesh.name = 'ground'; mesh.matrixAutoUpdate = false; scene.add(mesh); return mesh; });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(500, 32, 16), W3D.skyMat(U)); sky.frustumCulled = false; sky.renderOrder = -10; sky.name = 'sky'; scene.add(sky);

    // the halos: soft additive glows that always face the camera
    {
      const n = halos.length, pos = new Float32Array(n * 12), cor = new Float32Array(n * 8), sz = new Float32Array(n * 4), col = new Float32Array(n * 12), idx = [];
      halos.forEach((h, i) => { for (let k = 0; k < 4; k++) { pos.set([h[0], h[1], h[2]], i * 12 + k * 3); col.set([h[4], h[5], h[6]], i * 12 + k * 3); sz[i * 4 + k] = h[3]; } cor.set([-1, -1, 1, -1, 1, 1, -1, 1], i * 8); idx.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3); });
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('corner', new THREE.BufferAttribute(cor, 2)); g.setAttribute('hsize', new THREE.BufferAttribute(sz, 1)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setIndex(idx);
      const mat = new THREE.ShaderMaterial({
        uniforms: { map: { value: pics.halo }, uTime: U.uTime, uFog: U.uFog, uFogNear: U.uFogNear, uFogFar: U.uFogFar, uK: { value: 0.42 } },
        vertexShader: 'attribute vec2 corner; attribute float hsize; varying vec2 vUv; varying vec3 vC; varying float vF; uniform float uTime, uFogNear, uFogFar; void main(){ vec4 mv = viewMatrix * vec4(position,1.0); float fl = 0.92 + 0.08*sin(uTime*7.0 + position.x*3.1 + position.z*1.7); mv.xy += corner * hsize * 0.5 * fl; vUv = corner*0.5+0.5; vC = color; vF = 1.0 - smoothstep(uFogNear, uFogFar, -mv.z)*0.85; gl_Position = projectionMatrix * mv; }',
        fragmentShader: 'uniform sampler2D map; uniform float uK; varying vec2 vUv; varying vec3 vC; varying float vF; void main(){ float a = texture2D(map, vUv).a; a = a * a; gl_FragColor = vec4(vC * a * uK * vF, 1.0); }',
        vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      });
      const hm = new THREE.Mesh(g, mat); hm.frustumCulled = false; hm.renderOrder = 5; hm.name = 'halos'; scene.add(hm);
    }

    // ---- the painted maps: where the cobbles are, the lamps' warm light, the shade ----
    const CW = Math.min(1280, Math.round((MR[2] - MR[0]) / 2)), CH = Math.round(CW * (MR[3] - MR[1]) / (MR[2] - MR[0])), kx = CW / (MR[2] - MR[0]), ky = CH / (MR[3] - MR[1]);
    const mk = () => { const c = document.createElement('canvas'); c.width = CW; c.height = CH; const g = c.getContext('2d'); g.setTransform(1, 0, 0, 1, -MR[0] * kx, -MR[1] * ky); return c; };
    const path = (g, poly) => { g.beginPath(); poly.forEach(([x, y], i) => (i ? g.lineTo(x * kx, y * ky) : g.moveTo(x * kx, y * ky))); g.closePath(); };
    // the splat: red cobbles (the walk and a little round it, the yards in front of the houses), green earth, blue paving
    const splat = mk(); {
      const g = splat.getContext('2d'); g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#000'; g.fillRect(0, 0, CW, CH); g.restore();
      g.lineJoin = 'round';
      g.filter = 'blur(6px)'; g.strokeStyle = '#00ff00'; g.fillStyle = '#00ff00'; g.lineWidth = 34 * kx;
      for (const q of WALK) { path(g, q.p); g.fill(); g.stroke(); }
      g.lineWidth = 12 * kx; for (const a of place.walkAdd || []) { if ((a.ground || 'dirt') === 'dirt') { path(g, a.poly || a); g.fill(); g.stroke(); } }
      g.filter = 'blur(1.5px)'; g.globalCompositeOperation = 'lighter';
      g.strokeStyle = '#ff0000'; g.fillStyle = '#ff0000'; g.lineWidth = 16 * kx;
      for (const q of WALK) { path(g, q.p); g.fill(); g.stroke(); }
      g.lineWidth = 10 * kx; for (const a of place.walkAdd || []) { if (a.ground === 'cob') { path(g, a.poly); g.fill(); g.stroke(); } }
      for (const b of place.buildings) { g.fillRect((b.fp[0] - 10) * kx, (b.fp[1] - 10) * ky, (b.fp[2] - b.fp[0] + 20) * kx, (b.fp[3] - b.fp[1] + 20) * ky); }
      g.globalCompositeOperation = 'source-over'; g.filter = 'none';
      // under the cobbles, nothing green
      const im = g.getImageData(0, 0, CW, CH), d = im.data; for (let i = 0; i < d.length; i += 4) { d[i + 1] = Math.round(d[i + 1] * (1 - d[i] / 255)); } g.putImageData(im, 0, 0);
      for (const a of place.walkAdd || []) if (a.ground === 'grass') { g.fillStyle = '#000'; path(g, a.poly); g.fill(); }
      if (place.bridge) { g.fillStyle = 'rgba(0,0,255,1)'; g.fillRect(place.bridge.x0 * kx, place.bridge.y0 * ky, (place.bridge.x1 - place.bridge.x0) * kx, (place.bridge.y1 - place.bridge.y0) * ky); }
      for (const l of place.lawns || []) { g.fillStyle = '#000'; path(g, l); g.globalAlpha = 0.85; g.fill(); g.globalAlpha = 1; }
    }
    // the light map: warm pools round every lamp and lit door, orange round the forge, pale blue round the Moonwell
    const glow = mk(); {
      const g = glow.getContext('2d'); g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#000'; g.fillRect(0, 0, CW, CH); g.restore(); g.globalCompositeOperation = 'lighter';
      const C = { warm: [255, 168, 92], forge: [255, 120, 48], moon: [120, 170, 255] };
      for (const [x, y, r, s, k] of lights.concat(place.lights || [])) {
        const c = C[k === 'moonwell' ? 'moon' : k] || C.warm;
        g.save(); g.translate(x * kx, y * ky); g.scale(1, (M.SX / M.SZ) * (kx / ky) * (ky / kx));
        const gr = g.createRadialGradient(0, 0, 0, 0, 0, r * kx);
        const st = (f) => 'rgba(' + c.map((v) => Math.min(255, Math.round(v * s * f))).join(',') + ',1)';
        gr.addColorStop(0, st(1)); gr.addColorStop(0.3, st(0.72)); gr.addColorStop(0.62, st(0.36)); gr.addColorStop(1, 'rgba(0,0,0,1)');
        g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r * kx, 0, TAU); g.fill(); g.restore();
      }
    }
    // the shade: dark under the trees, round the houses' feet and under the Moonwell's walls; the woods past the painting darker
    const shade = mk(); {
      const g = shade.getContext('2d'); g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#fff'; g.fillRect(0, 0, CW, CH); g.restore();
      g.filter = 'blur(5px)';
      for (const s of shadeMarks) {
        const dark = s[s.length - 1], v = Math.round(255 * dark);
        g.fillStyle = 'rgb(' + v + ',' + v + ',' + v + ')'; g.strokeStyle = g.fillStyle;
        if (s[0] === 'rect') { g.lineWidth = 9 * kx; g.strokeRect(s[1] * kx, s[2] * ky, (s[3] - s[1]) * kx, (s[4] - s[2]) * ky); }
        else if (s[0] === 'dot') { g.save(); g.globalCompositeOperation = 'multiply'; g.beginPath(); g.ellipse(s[1] * kx, s[2] * ky, s[3] * kx, s[3] * kx * M.SX / M.SZ, 0, 0, TAU); g.fill(); g.restore(); }
        else if (s[0] === 'poly') { path(g, s[1]); g.fill(); }
        else if (s[0] === 'ring') { g.lineWidth = 6 * kx; g.beginPath(); g.ellipse(s[1] * kx, s[2] * ky, s[3] * kx, s[3] * kx * M.SX / M.SZ, 0, 0, TAU); g.stroke(); g.beginPath(); g.ellipse(s[1] * kx, s[2] * ky, s[4] * kx, s[4] * kx * M.SX / M.SZ, 0, 0, TAU); g.stroke(); }
      }
      g.filter = 'none';
    }
    const T_ = (c) => { const t = new THREE.CanvasTexture(c); t.flipY = false; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; return t; };
    U.uGlow.value = T_(glow); U.uShade.value = T_(shade);
    const groundTex = { cob: T(place.ground.cob), grass: T(place.ground.grass), dirt: T(place.ground.dirt), pave: T(place.ground.pave), splat: T_(splat), rep: place.ground.rep, grassTint: place.ground.grassTint };
    const groundMat = W3D.groundMat(U, groundTex); for (const g of grounds) g.material = groundMat;

    // ---- where her feet can stand, as a grid (a cell every 2 px): the walk areas and pockets (or a wild place's open
    // ground less its water), less everything solid ----
    {
      const c = 2, w = Math.ceil((WX1 - WX0) / c), h = Math.ceil((WY1 - WY0) / c);
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d');
      g.setTransform(1 / c, 0, 0, 1 / c, -WX0 / c, -WY0 / c);
      const fillP = (poly) => { g.beginPath(); poly.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fill(); };
      g.fillStyle = '#000'; g.fillRect(WX0, WY0, WX1 - WX0, WY1 - WY0);
      g.fillStyle = '#fff';
      if (OPEN) { fillP(OPEN); g.fillStyle = '#000'; for (const wt of WATER) fillP(wt.poly); g.fillStyle = '#fff'; }
      for (const q of WALK) fillP(q.p); for (const q of ADD) fillP(q.p);
      g.fillStyle = '#000'; for (const q of BLOCK) fillP(q.p);
      const d = g.getImageData(0, 0, w, h).data, grid = new Uint8Array(w * h);
      for (let i = 0; i < w * h; i++) grid[i] = d[i * 4] > 127 ? 1 : 0;
      walkGrid = { x0: WX0, y0: WY0, c, w, h, d: grid };
    }

    // ---- each frame ----
    const _v = new THREE.Vector3(), seg = new THREE.Vector3(), glowK0 = U.uGlowK.value;
    function update(t, cam, ioPos) {
      U.uTime.value = t;
      U.uGlowK.value = glowK0 * (1.0 + 0.025 * Math.sin(t * 6.3) + 0.015 * Math.sin(t * 11.7));
      if (cam && ioPos) {
        U.uCam.value.copy(cam.position); U.uIo.value.set(ioPos.x, ioPos.y + 1.0, ioPos.z); U.uCut.value = 1;
        // nothing past the fog is drawn (the trees' patches and the ground's)
        const far = U.uFogFar.value + 6;
        for (const mesh of cullables) { const s = mesh.geometry.boundingSphere; mesh.visible = s.center.distanceTo(cam.position) - s.radius < far; }
        // the tree patches near the line from the camera to Io get the thinning-away
        seg.subVectors(U.uIo.value, cam.position); const L2 = seg.lengthSq();
        for (const mesh of treeMeshes) {
          const s = mesh.geometry.boundingSphere; _v.copy(s.center).sub(cam.position); const tt = clamp(_v.dot(seg) / L2, 0, 1);
          _v.copy(cam.position).addScaledVector(seg, tt).sub(s.center); const near = _v.length() < s.radius + 3;
          const want = (near ? TM.cut : TM.whole)[mesh.userData.tree]; if (mesh.material !== want) mesh.material = want;
        }
      }
    }
    const cullables = treeMeshes.concat(grounds);
    // the counts, for the page's numbers
    let tris = 0; scene.traverse((o) => { if (o.isMesh && o.geometry) { const g = o.geometry; tris += (g.index ? g.index.count : g.attributes.position.count) / 3; } });
    const stats = { triangles: Math.round(tris), meshes: 0, trees: trees.length, lamps: (place.lamps || []).length, halos: halos.length };
    scene.traverse((o) => { if (o.isMesh) stats.meshes++; });
    // the see-through trees' shaders, made ready at the start so the first time they're needed doesn't stutter
    function precompile(renderer, cam) { for (const mesh of treeMeshes) mesh.material = TM.cut[mesh.userData.tree]; renderer.compile(scene, cam); for (const mesh of treeMeshes) mesh.material = TM.whole[mesh.userData.tree]; renderer.compile(scene, cam); }
    return { scene, U, M, walkable, walkH, terrain, update, precompile, stats, used, place, lamps: lamps3d, items, takeItem, maps: { splat, glow, shade }, exits: place.exits || [] };
  };
})(window);
