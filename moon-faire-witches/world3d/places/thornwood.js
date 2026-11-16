// thornwood.js: the Thornwood in 3D, laid out on its painting (reference/art/walk/walk-thornwood.png, 1536 x 1024) in the
// painting's own pixels, as src/game/maps.js keeps the walking map. Where Io can walk is that map's own walk and block
// areas, unchanged (MAPS.thornwood: the road, the moon stone's clearing, its tracks and Chris's trail into the dark woods
// south of the road); everything here stands round them.
// The texture ids are the texture pack's (texture-packs/wickhollow/thornwood/inventory.md).
// Heights are metres: the road and the woods are 0; the stream runs in a little rocky ravine, falling three times on its
// way south (-1.75 in the north, -3.3 at the painting's foot); the old bridge's deck rises 0.7 over it; the moon stone's
// clearing is a low mossy rise.
(function (G) {
  'use strict';
  const P = G.W3D_PLACES = G.W3D_PLACES || {};
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ss = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

  // ---- the stream: its west and east banks, [y, x] down the painting (traced from it; it runs on past both edges) ----
  const LB = [[-200, 300], [0, 300], [50, 305], [100, 312], [150, 322], [200, 326], [245, 332], [290, 310], [350, 300], [400, 295], [450, 290],
    [500, 292], [550, 296], [600, 302], [650, 318], [700, 330], [750, 335], [800, 330], [850, 340], [900, 345], [950, 358], [1000, 384], [1024, 396], [1300, 420]];
  const RB = [[-200, 470], [0, 445], [50, 455], [100, 450], [150, 460], [200, 470], [250, 470], [300, 462], [350, 468], [400, 470], [450, 480],
    [500, 485], [550, 480], [600, 470], [650, 470], [700, 482], [750, 490], [800, 490], [850, 515], [900, 540], [950, 560], [1000, 580], [1024, 590], [1300, 650]];
  const bank = (L, y) => { if (y <= L[0][0]) return L[0][1]; for (let i = 1; i < L.length; i++) if (y <= L[i][0]) { const [ya, xa] = L[i - 1], [yb, xb] = L[i]; return xa + (xb - xa) * (y - ya) / (yb - ya); } return L[L.length - 1][1]; };
  const STREAM = LB.map(([y, x]) => [x, y]).concat(RB.slice().reverse().map(([y, x]) => [x, y]));
  // its level along the painting: the little fall north of the bridge, the falls under it, and the falls by the south edge
  const level = (y) => -1.75 - 0.45 * ss(228, 262, y) - 0.55 * ss(598, 632, y) - 0.55 * ss(858, 902, y);

  // the ground's height under any point of the painting (metres)
  function ground(x, y) {
    const d = Math.max(bank(LB, y) - x, x - bank(RB, y));                          // pixels out from the stream (less than 0 in it)
    let h = -1.3 * (1 - ss(0, 55, d));                                               // its ravine
    h += 0.25 * (1 - ss(0.4, 1, Math.hypot((x - 1010) / 160, (y - 290) / 120)));    // the moon stone's mossy rise
    return h;
  }

  // ---- the old bridge: one stone arch over the stream, its deck rising 0.7 m between low parapets. In the painting its
  // deck bows north in the middle (the slant shows its rise that way) and the walking map follows it, so it does here too.
  const BR = { x0: 235, x1: 535, rise: 0.7 };
  const hump = (x) => Math.sin(Math.PI * clamp((x - BR.x0) / (BR.x1 - BR.x0), 0, 1));
  const deck = (x) => BR.rise * hump(x);
  const yN = (x) => 446 - 26 * hump(x), yS = (x) => 490 - 20 * hump(x);              // the parapets' inner faces (pixels)

  // ---- the moon stone, its rocks, and the painting's big boulders: [x, y, size] ----
  const STONE = { at: [1026, 293], w: 1.95, d: 0.85, h: 3.9 };
  const ROCKS = [
    // the west bank, north of the road
    [250, 70, 1.5], [214, 122, 1.1], [286, 176, 1.15], [292, 238, 0.9], [166, 300, 1.6], [254, 346, 1.35],
    // the east bank, north of the road, and the stones by the bridge's east end
    [506, 150, 1.4], [540, 330, 1.55], [610, 336, 1.45], [546, 404, 0.8], [640, 412, 0.85], [772, 402, 0.85],
    // the west bank, south of the road
    [266, 622, 1.3], [130, 752, 1.5], [276, 704, 1.2], [270, 782, 1.3], [190, 984, 1.6], [292, 952, 1.35],
    // the east bank, south of the road
    [506, 612, 1.1], [562, 628, 1.45], [526, 732, 1.35], [552, 802, 1.4], [600, 912, 1.6], [646, 898, 1.15],
    // the moon stone's foot (east of it), the mossy rock up the north-east track, the rock among the brambles east of the
    // fork, the rock north of the clearing
    [1072, 330, 1.1], [1096, 356, 0.9], [1060, 373, 0.7], [1046, 312, 0.6], [1316, 247, 1.0], [1400, 455, 1.1], [944, 86, 1.2],
  ];
  // the rocks west of the stone (the walking map's block): not solid themselves, the block already is
  const BLOCK_ROCKS = [[898, 272, 0.75], [926, 266, 0.7], [914, 288, 0.6], [934, 286, 0.55]];
  // the painting's big dead thorn trees: [x, y (where the trunk stands), size, seed, lean x, lean z]
  const GIANTS = [
    [668, 256, 2.3, 1, 0.1, -0.1], [150, 236, 1.8, 2, 0.15, 0], [12, 70, 2.0, 3, 0.25, 0.1], [870, 104, 1.7, 4, 0, -0.1],
    [1176, 118, 1.8, 5, -0.1, 0], [1478, 290, 2.3, 6, -0.3, 0], [840, 830, 2.6, 7, 0, -0.15], [1200, 624, 1.6, 8, 0, -0.35],
    [26, 556, 1.7, 9, 0.1, -0.4], [60, 962, 2.2, 10, 0.2, -0.1], [244, 934, 1.8, 11, 0, -0.1], [1484, 900, 2.3, 12, -0.2, -0.1],
    [1430, 830, 1.9, 13, -0.55, 0.05], [1050, 968, 2.0, 14, 0, -0.2], [700, 968, 1.9, 15, 0.1, -0.2], [1335, 650, 1.6, 16, 0, -0.2],
    [1290, 40, 1.9, 17, 0, 0.1], [560, 40, 1.7, 18, 0, 0.1],
  ];
  const STUMPS = [[182, 705, 1.0], [225, 725, 1.2]];
  // the clumps of small white flowers among the rocks: [x, y, radius (m), 'white']
  const FLOWERS = [
    [80, 362, 1.1, 'white'], [140, 380, 1.0, 'white'], [36, 330, 0.9, 'white'], [604, 384, 0.9, 'white'], [976, 302, 0.55, 'white'],
    [246, 656, 0.8, 'white'], [176, 526, 0.85, 'white'], [1236, 300, 0.7, 'white'], [570, 380, 0.6, 'white'], [1104, 320, 0.5, 'white'],
  ];
  // lily pads on the stream's pools [x, y, radius m], tufts of tall grass on its banks [x, y]
  const LILIES = [[330, 40, 0.5], [404, 184, 0.55], [392, 206, 0.45], [416, 200, 0.4], [312, 326, 0.5], [322, 338, 0.4], [410, 560, 0.5],
    [430, 588, 0.45], [440, 690, 0.5], [458, 706, 0.42], [330, 940, 0.5], [348, 956, 0.42], [570, 984, 0.5], [312, 70, 0.4]];
  const TUFTS = [[478, 292], [468, 342], [310, 280], [262, 806], [500, 872], [560, 586], [300, 900], [480, 230], [276, 160]];
  // the low banks of cold blue mist lying between the trees: [x, y, size m]
  const MIST = [[120, 72, 7], [60, 640, 9], [96, 800, 9], [20, 700, 7], [700, 792, 8], [952, 852, 8], [1050, 800, 7], [1372, 752, 9],
    [1320, 712, 7], [1130, 700, 6], [1490, 200, 7], [640, 160, 6], [820, 700, 7], [180, 860, 7], [1250, 950, 8], [600, 1000, 7],
    [1000, 120, 6], [1520, 640, 7], [-150, 600, 10], [1700, 760, 10], [800, -120, 10], [400, 1180, 10]];

  P.thornwood = {
    id: 'thornwood', name: 'The Thornwood', painting: "art/walk/walk-thornwood.avif", size: [1536, 1024],
    mapId: 'thornwood', paintingPng: 'reference/art/walk/walk-thornwood.png',
    // the wall check (tools/walls-test.mjs): from the start, to each edge, the bridge, the moon stone and every track's end
    checks: { from: [60, 456], goals: [
      ['the bridge, by its lantern', 383, 446], ['the moon stone (the clearing)', 1005, 362], ['round behind the moon stone (north)', 1000, 222],
      ['the north-west track’s end', 745, 136], ['the north-east track’s end', 1370, 172], ['the east track’s end', 1455, 398],
      ['the road to Bogmire (east edge)', 1530, 533], ['the end of Chris’s trail into the dark woods (south)', 1290, 815],
      ['back to Wickhollow (west edge)', 6, 430]] },
    // the trees from the painting (tools/make-trees.mjs): no firs in the Thornwood; the roads that go on past its edges
    // (the stream's rocky banks and the white flowers by the bridge's west end keep clear, as the painting shows them)
    treeGen: { dark: 0.5, step: 60, fir: 0, firSouth: 0, roads: [[-600, 400, 0, 462], [1536, 504, 2200, 562]],
      keepOut: [[990, 262, 1070, 322], [460, 80, 600, 400], [470, 560, 650, 1060], [190, 560, 300, 1060], [186, -40, 300, 400], [20, 300, 200, 400]] },
    // the ground: the earth road (on the walk), the clearing's moss along its edges, bramble everywhere else
    ground: { cob: 'shared_dirt_track', dirt: 'thorn_moss_ground', grass: 'thorn_bramble_ground', pave: 'wick_bridge_paving', rep: [3.0, 3.4, 2.6, 2.6], grassTint: [0.9, 0.86, 0.95] },
    // what each kind of surface is made of here (the Thornwood has no houses: the unused kinds point at its own textures)
    surfaces: { stone: 'shared_stone_wall_rough', dry: 'shared_stone_wall_rough', timber: 'shared_stone_wall_rough', planks: 'thorn_bark_black', roof: 'thorn_rock_mossy',
      wood: 'thorn_bark_black', deck: 'wick_bridge_paving', pave: 'wick_bridge_paving', cloth: 'thorn_moss_ground', soil: 'thorn_moss_ground', rock: 'thorn_rock_mossy',
      leaves: 'thorn_bramble_ground', firs: 'thorn_bramble_ground', bark: 'thorn_bark_black' },
    tints: { leaves: 0xe4dcea, firs: 0xe4dcea, bush: 0xeae2ee, wood: 0xd0c8d4 },
    // darker and mistier than the town: a cold blue fog close in
    night: { fog: [0.07, 0.08, 0.155], fogNear: 22, fogFar: 92, sky: [0.58, 0.58, 0.72], moon: [0.4, 0.44, 0.6] },
    textures: [
      { id: 'shared_dirt_track', made: "./../texture-packs/made/shared_dirt_track.png", stand: "./../texture-packs/wickhollow/thornwood/stand-in/shared_dirt_track.png" },
      { id: 'thorn_moss_ground', made: "./../texture-packs/made/thorn_moss_ground.png", stand: "./../texture-packs/wickhollow/thornwood/stand-in/thorn_moss_ground.png" },
      { id: 'thorn_bramble_ground', made: "./../texture-packs/made/thorn_bramble_ground.png", stand: "./../texture-packs/wickhollow/thornwood/stand-in/thorn_bramble_ground.png" },
      { id: 'shared_water_river', made: "./../texture-packs/made/shared_water_river.png", stand: "./../texture-packs/wickhollow/thornwood/stand-in/shared_water_river.png" },
      { id: 'thorn_rock_mossy', made: "./../texture-packs/made/thorn_rock_mossy.png", stand: "./../texture-packs/wickhollow/thornwood/stand-in/thorn_rock_mossy.png" },
      { id: 'thorn_bark_black', made: "./../texture-packs/made/thorn_bark_black.png", stand: "./../texture-packs/wickhollow/thornwood/stand-in/thorn_bark_black.png" },
      { id: 'wick_bridge_paving', made: "./../texture-packs/made/wick_bridge_paving.png", stand: "./../texture-packs/wickhollow/wickhollow/stand-in/wick_bridge_paving.png" },
      { id: 'shared_stone_wall_rough', made: "./../texture-packs/made/shared_stone_wall_rough.png", stand: "./../texture-packs/wickhollow/wickhollow/stand-in/shared_stone_wall_rough.png" },
    ],
    ground_h: ground,
    // where Io's feet stand: the ground, or the bridge's deck
    walk_h(x, y) {
      if (x >= 226 && x <= 544 && y >= 400 && y <= 505) return Math.max(ground(x, y), deck(x));
      return ground(x, y);
    },
    water: [
      { poly: STREAM, level, tex: 'shared_water_river', rep: 4, flow: [0.0, 0.05], bed: -4.4 },
    ],
    lawns: [],
    stream: { level, bank: (y) => [bank(LB, y), bank(RB, y)] },
    start: [60, 456], startFace: Math.PI / 2,
    // the ways out (the walking map's exits), and what is past them
    exits: [
      { rect: [0, 400, 18, 462], label: 'Wickhollow' },
      { rect: [1518, 504, 1536, 562], label: 'Bogmire' },
    ],
    buildings: [],
    // the bridge's wing walls, just off the road
    walls: [
      { pts: [[150, 425], [200, 435], [236, 437]], h: 0.8, t: 0.5, tex: 'stone' },
      { pts: [[530, 437], [590, 443]], h: 0.75, t: 0.5, tex: 'stone' },
    ],
    steps: [],
    lamps: [],
    props: ROCKS.map(([x, y, s]) => ({ k: 'rock', at: [x, y], size: s })).concat(BLOCK_ROCKS.map(([x, y, s]) => ({ k: 'rock', at: [x, y], size: s, solid: false }))),
    flowers: FLOWERS,
    // the lights for the light map: [x, y, radius px, strength, colour]. The bridge's lantern and the moon stone's own
    // are added in extra(); these are the moonlight glittering on the stream and lying in the clearing.
    lights: [
      [380, 150, 150, 0.45, 'moon'], [400, 760, 160, 0.45, 'moon'], [470, 960, 140, 0.4, 'moon'], [960, 300, 150, 0.32, 'moon'], [1200, 470, 140, 0.25, 'moon'],
    ],
    trees: 'thornwood',
    extraTrees: [],

    // ---- what the engine has no field for: the old bridge and its lantern, the moon stone, the dead thorn trees, the
    // stumps, the bramble, the grass tufts, the lily pads, the stones along the road, and the mist ----
    extra(K) {
      const { B, X, Z } = K, W3D = G.W3D, TAU = Math.PI * 2;
      const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
      const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
      const norm = (a) => { const L = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / L, a[1] / L, a[2] / L]; };
      // a quad that faces the way `want` points, whichever order its corners came in
      const Q = (k, a, b, c, d, want, uv, col) => { const n = cross(sub(b, a), sub(d, a)); if (dot(n, want) < 0) B.quad(k, b, a, d, c, uv, col); else B.quad(k, a, b, c, d, uv, col); };
      // how far a point is from the walking map's walk areas (0 inside one)
      const WALK = ((G.MAPS || {}).thornwood || { walk: [] }).walk;
      const walkDist = (x, y) => { let d = 1e9; for (const p of WALK) { if (W3D.inPoly(p, x, y)) return 0; d = Math.min(d, W3D.edgeDist(p, x, y)); } return d; };
      const inStream = (x, y) => x > bank(LB, y) - 6 && x < bank(RB, y) + 6;

      // a tapered branch from A to Bp (an open tube of n sides), its bark's uv in metres
      function seg(A, Bp, ra, rb, n, col) {
        const d = sub(Bp, A), L = Math.hypot(d[0], d[1], d[2]), dir = mul(d, 1 / L);
        const u = norm(cross(Math.abs(dir[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0], dir)), v = cross(dir, u);
        const ring = (c, r, t) => add(c, add(mul(u, Math.cos(t) * r), mul(v, Math.sin(t) * r)));
        for (let i = 0; i < n; i++) {
          const t0 = i / n * TAU, t1 = (i + 1) / n * TAU;
          B.quad('wood', ring(A, ra, t0), ring(A, ra, t1), ring(Bp, rb, t1), ring(Bp, rb, t0), [t0 * ra, 0, t1 * ra, L], col);
        }
      }

      // ---- the old bridge ----
      {
        const N = 30, PT = 8, PH = 0.85, UP = [0, 1, 0];
        const archY = (px) => { const u = (px - 385) / 100; return Math.abs(u) > 1 ? null : -2.6 + 2.35 * Math.sqrt(1 - u * u); };
        const bot = (px) => { const a = archY(px); return a == null ? -3.2 : a; };
        const xs = (i) => BR.x0 + (BR.x1 - BR.x0) * i / N;
        for (let i = 0; i < N; i++) {
          const pa = xs(i), pb = xs(i + 1), xa = X(pa), xb = X(pb), da = deck(pa) + 0.02, db = deck(pb) + 0.02, ba = bot(pa), bb = bot(pb);
          const nAi = Z(yN(pa)), nBi = Z(yN(pb)), nAo = Z(yN(pa) - PT), nBo = Z(yN(pb) - PT);
          const sAi = Z(yS(pa)), sBi = Z(yS(pb)), sAo = Z(yS(pa) + PT), sBo = Z(yS(pb) + PT);
          Q('pave', [xa, da, sAi], [xb, db, sBi], [xb, db, nBi], [xa, da, nAi], UP, [xa, sAi, xb, nAi]);
          // the north parapet: its inner face, its top, its outer face down to the arch (or into the bank)
          Q('stone', [xa, da, nAi], [xb, db, nBi], [xb, db + PH, nBi], [xa, da + PH, nAi], [0, 0, 1], [xa, da, xb, da + PH]);
          Q('stone', [xa, da + PH, nAi], [xb, db + PH, nBi], [xb, db + PH, nBo], [xa, da + PH, nAo], UP, [xa, 0, xb, 0.4], [0.86, 0.86, 0.9]);
          Q('stone', [xa, ba, nAo], [xb, bb, nBo], [xb, db + PH, nBo], [xa, da + PH, nAo], [0, 0, -1], [xa, ba, xb, da + PH]);
          // the south parapet
          Q('stone', [xa, da, sAi], [xb, db, sBi], [xb, db + PH, sBi], [xa, da + PH, sAi], [0, 0, -1], [xa, da, xb, da + PH]);
          Q('stone', [xa, da + PH, sAi], [xb, db + PH, sBi], [xb, db + PH, sBo], [xa, da + PH, sAo], UP, [xa, 0, xb, 0.4], [0.86, 0.86, 0.9]);
          Q('stone', [xa, ba, sAo], [xb, bb, sBo], [xb, db + PH, sBo], [xa, da + PH, sAo], [0, 0, 1], [xa, ba, xb, da + PH]);
          // the arch's underside
          if (archY(pa) != null && archY(pb) != null) Q('stone', [xa, ba, nAo], [xb, bb, nBo], [xb, bb, sBo], [xa, ba, sAo], [0, -1, 0], [xa, nAo, xb, sAo], [0.62, 0.62, 0.68]);
        }
        // the arch's ring of stones, a hand proud of each face
        const NV = 15;
        for (const side of [-1, 1]) {
          const fz = (px) => side < 0 ? Z(yN(px) - PT) - 0.05 : Z(yS(px) + PT) + 0.05;
          for (let k = 0; k < NV; k++) {
            const t0 = Math.PI * k / NV, t1 = Math.PI * (k + 1) / NV;
            const pt = (t, out) => { const px = 385 - (100 + out * 13) * Math.cos(t); return [X(px), -2.6 + (2.35 + out * 0.55) * Math.sin(t), fz(px)]; };
            const col = k % 2 ? [0.8, 0.79, 0.85] : [0.96, 0.94, 1.0];
            Q('stone', pt(t0, 0), pt(t1, 0), pt(t1, 1), pt(t0, 1), [0, 0, side], [k * 0.6, 0, k * 0.6 + 0.6, 0.55], col);
          }
        }
        // the four end posts, and the middle post on the north parapet with the lantern on it
        for (const [px, py] of [[247, yN(247) - 5], [523, yN(523) - 5], [247, yS(247) + 5], [523, yS(523) + 5]]) {
          const top = deck(px) + 1.2;
          B.box('stone', X(px), -1.2, Z(py), 0.64, top + 1.2, 0.64, 0, [0.95, 0.93, 0.98]);
          B.box('stone', X(px), top, Z(py), 0.76, 0.14, 0.76, 0, [0.8, 0.78, 0.84]);
          B.box('stone', X(px), top + 0.14, Z(py), 0.5, 0.1, 0.5, 0, [0.88, 0.86, 0.92]);
        }
        const lx = X(383), lz = Z(414), lb = deck(383);
        B.box('stone', lx, lb, lz, 0.6, 1.08, 0.6, 0, [0.95, 0.93, 0.98]);
        B.box('stone', lx, lb + 1.08, lz, 0.72, 0.12, 0.72, 0, [0.8, 0.78, 0.84]);
        K.lantern(lx, lb + 1.24, lz, null, 1.15);
        K.light(383, 432, 200, 1.35, 'warm');
        K.addBlock(K.circlePx(383, 414, 0.36, 8));
        // the abutments: stone into the banks under each end
        B.box('stone', X(262), -3.4, Z(466), 1.9, 3.3, 3.6, 0, [0.82, 0.8, 0.86]);
        B.box('stone', X(508), -3.4, Z(466), 1.9, 3.3, 3.6, 0, [0.82, 0.8, 0.86]);
        K.shadeMarks.push(['rect', 250, 492, 520, 520, 0.7]);
      }

      // ---- the moon stone: a tall standing stone, its south face cut with a crescent that holds a little moonlight ----
      {
        const [sx, sy] = STONE.at, base = K.gh(sx, sy) - 0.3;
        const g = new THREE.BoxGeometry(1, 1, 1, 3, 9, 2), p = g.attributes.position;
        const hh = (a, b, c) => { const s = Math.sin(a * 127.1 + b * 311.7 + c * 74.7) * 43758.5453; return s - Math.floor(s); };
        for (let i = 0; i < p.count; i++) {
          const x = p.getX(i), y = p.getY(i), z = p.getZ(i), t = y + 0.5;
          let w = 1 - 0.24 * t, yy = t;
          if (t > 0.8) yy -= (x * x) * 0.55 * ss(0.8, 1, t);                     // its rounded shoulders
          const n = (hh(x, y, z) - 0.5) * 0.06;
          p.setXYZ(i, x * w * STONE.w + n, yy * STONE.h + n, z * STONE.d * (1 - 0.18 * t) + n * 0.5);
        }
        g.computeVertexNormals();
        B.geom('rock', g, new THREE.Matrix4().compose(new THREE.Vector3(X(sx), base, Z(sy)), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0.05, 0)), new THREE.Vector3(1, 1, 1)), [0.98, 1.0, 1.06], [STONE.w, STONE.h]);
        g.dispose();
        // the crescent, opening east, on the south face two thirds up
        const ct = 0.66, cy = base + ct * STONE.h, cz = Z(sy) + STONE.d * (1 - 0.18 * ct) / 2 + 0.035, cx = X(sx) + 0.04, R = 0.42, NC = 16;
        const pt = (t, r) => [cx + Math.cos(t) * r, cy + Math.sin(t) * r, cz];
        for (let i = 0; i < NC; i++) {
          const ta = 0.95 + (TAU - 1.9) * i / NC, tb = 0.95 + (TAU - 1.9) * (i + 1) / NC;
          const wa = 0.2 * Math.sin(Math.PI * i / NC), wb = 0.2 * Math.sin(Math.PI * (i + 1) / NC);
          Q('glass', pt(ta, R), pt(tb, R), pt(tb, R - wb), pt(ta, R - wa), [0, 0, 1], [0, 0, 1, 1], [0.62, 0.78, 1.15]);
        }
        K.halo(cx, cy, cz + 0.1, 1.5, [0.2, 0.3, 0.55]);
        K.light(sx, sy + 26, 120, 0.6, 'moon');
        K.addBlock(W3D.rectPoly([sx - 25, sy - 10, sx + 25, sy + 10]));
        K.shadeMarks.push(['dot', sx, sy + 6, 30, 0.6]);
      }

      // ---- the dead thorn trees: twisted black trunks and bare thorny branches ----
      function deadTree(px, py, s, seed, lean, opt) {
        opt = opt || {};
        const r = W3D.rand(seed * 7919 + 13), x = X(px), z = Z(py), y0 = K.terrain(px, py) - 0.3;
        const k = 0.78 + r() * 0.2, col = [k, k * 0.95, k * 1.03];
        let p = [x, y0, z], dir = norm([(lean ? lean[0] : 0) + (r() - 0.5) * 0.3, 1, (lean ? lean[1] : 0) + (r() - 0.5) * 0.3]);
        const H = (3.0 + r() * 1.4) * s, NT = opt.big ? 4 : 3, pts = [];
        let rad = 0.3 * s;
        // roots, flaring out into the ground
        for (let i = 0; i < (opt.big ? 5 : 3); i++) { const a = i / (opt.big ? 5 : 3) * TAU + r(); seg(add(p, [Math.cos(a) * 1.4 * s * 0.6, -0.35, Math.sin(a) * 1.4 * s * 0.6]), add(p, [0, 0.9 * s, 0]), 0.08 * s, rad * 0.8, 4, col); }
        for (let i = 0; i < NT; i++) {
          const np = add(p, mul(dir, H / NT)), nr = rad * 0.76;
          seg(p, np, rad, nr, opt.big ? 7 : 6, col); pts.push([np, nr, dir]);
          p = np; rad = nr; dir = norm(add(dir, [(r() - 0.5) * 0.55, 0.05, (r() - 0.5) * 0.55]));
        }
        // the limbs: from the top and the upper trunk, out and up, twisting as they go, with thorny twigs off each joint
        const NL = (opt.big ? 5 : 3) + Math.floor(r() * 2.5);
        for (let j = 0; j < NL; j++) {
          const from = j < 2 ? pts[pts.length - 1] : pts[Math.max(0, pts.length - 2 - Math.floor(r() * 2))];
          const a = j / NL * TAU + r() * 0.9, out = 0.7 + r() * 0.8;
          let d = norm([Math.cos(a) * out + from[2][0] * 0.3, 0.8 + r() * 0.4, Math.sin(a) * out + from[2][2] * 0.3]);
          let q = from[0], lr = from[1] * (0.6 + r() * 0.15), L = (1.3 + r() * 0.8) * s * (opt.big ? 1.15 : 1);
          const NS = opt.big ? 4 : 3;
          for (let i = 0; i < NS; i++) {
            const nq = add(q, mul(d, L)), nlr = Math.max(0.018, lr * 0.62);
            seg(q, nq, lr, nlr, lr > 0.09 ? 5 : 3, col);
            const nt = (opt.far ? 1 : 1 + (r() < 0.65 ? 1 : 0));
            for (let t = 0; t < nt; t++) {
              const td = norm(add(d, [(r() - 0.5) * 1.8, (r() - 0.3) * 1.2, (r() - 0.5) * 1.8]));
              seg(nq, add(nq, mul(td, L * (0.45 + r() * 0.35))), nlr * 0.8, 0.008, 3, col);
            }
            q = nq; lr = nlr; L *= 0.78;
            d = norm(add(d, [(r() - 0.5) * 1.0, (r() - 0.62) * 0.55, (r() - 0.5) * 1.0]));
          }
        }
        K.shadeMarks.push(['dot', px, py, 18 * s, 0.72]);
        K.addBlock(K.circlePx(px, py, 0.32 * s, 8));
      }
      for (const [px, py, s, seed, lx, lz] of GIANTS) deadTree(px, py, s, seed, [lx, lz], { big: s >= 2 });
      // and more of them through the woods, on a jittered grid: off the walk, the stream, the stone and the giants
      {
        const r = W3D.rand(4242), STEP = 92;
        for (let gy = -320; gy < 1024 + 320; gy += STEP) for (let gx = -340; gx < 1536 + 340; gx += STEP) {
          const px = gx + (r() - 0.5) * STEP * 0.9, py = gy + (r() - 0.5) * STEP * 0.9, inside = px >= 0 && px < 1536 && py >= 0 && py < 1024;
          const s = 0.85 + r() * 0.6, seed = Math.floor(r() * 1e5), keep = r();
          if (keep > (inside ? 0.82 : 0.45)) continue;
          if (walkDist(px, py) < 24 + 10 * s || inStream(px, py)) continue;
          if (Math.hypot(px - STONE.at[0], py - STONE.at[1]) < 80) continue;
          if (GIANTS.some((g) => Math.hypot(px - g[0], py - g[1]) < 70 * g[2] / 2)) continue;
          if (ROCKS.some((q) => Math.hypot(px - q[0], py - q[1]) < 30 * q[2])) continue;
          deadTree(px, py, s, seed, [(r() - 0.5) * 0.3, (r() - 0.5) * 0.3], { far: !inside });
        }
      }

      // ---- broken stumps ----
      for (const [px, py, s] of STUMPS) {
        const r = W3D.rand(px * 3 + py), x = X(px), z = Z(py), y = K.gh(px, py) - 0.2, h = 1.0 * s, rad = 0.3 * s;
        seg([x, y, z], [x, y + h, z], rad, rad * 0.85, 7, [0.8, 0.76, 0.8]);
        for (let i = 0; i < 7; i++) { const a = i / 7 * TAU, b = (i + 1) / 7 * TAU, tip = h + 0.15 + r() * 0.35 * s; B.tri('wood', [x + Math.cos(a) * rad * 0.85, y + h, z + Math.sin(a) * rad * 0.85], [x + Math.cos(b) * rad * 0.85, y + h, z + Math.sin(b) * rad * 0.85], [x + Math.cos((a + b) / 2) * rad * 0.5, y + tip, z + Math.sin((a + b) / 2) * rad * 0.5], [[0, 0], [0.3, 0], [0.15, 0.4]], [0.7, 0.62, 0.62]); }
        B.quad('wood', [x - rad * 0.8, y + h - 0.02, z + rad * 0.3], [x + rad * 0.8, y + h - 0.02, z + rad * 0.3], [x + rad * 0.8, y + h - 0.02, z - rad * 0.5], [x - rad * 0.8, y + h - 0.02, z - rad * 0.5], [0, 0, 0.5, 0.5], [1.1, 0.9, 0.8]);
        K.addBlock(K.circlePx(px, py, rad + 0.05, 8));
      }

      // ---- bramble: low thorny mounds with dark red berries, along the road's edges and through the woods ----
      {
        const r = W3D.rand(777), STEP = 34;
        const mound = (px, py, rr) => {
          const x = X(px), z = Z(py), y = K.terrain(px, py), h = rr * (0.45 + r() * 0.25);
          B.geom('leafBush', K.ico[Math.floor(r() * 3)], new THREE.Matrix4().compose(new THREE.Vector3(x, y + h * 0.3, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, r() * TAU, 0)), new THREE.Vector3(rr, h, rr)), [0.82, 0.74, 0.8], 2.0);
          const n = Math.max(2, Math.round(rr * 2.5));
          for (let i = 0; i < n; i++) {
            const a = r() * TAU, d = r() * rr * 0.6, cx = x + Math.cos(a) * d, cz = z + Math.sin(a) * d, cy = y + h * (0.6 + r() * 0.5), sz = 0.35 + r() * 0.2, t = r() * Math.PI;
            B.quad('fl_fruit', [cx - Math.cos(t) * sz, cy - sz * 0.6, cz - Math.sin(t) * sz], [cx + Math.cos(t) * sz, cy - sz * 0.6, cz + Math.sin(t) * sz], [cx + Math.cos(t) * sz, cy + sz, cz + Math.sin(t) * sz], [cx - Math.cos(t) * sz, cy + sz, cz - Math.sin(t) * sz], [0, 0, 1, 1], [0.72, 0.3, 0.36]);
          }
          K.shadeMarks.push(['dot', px, py, rr / 0.04, 0.78]);
        };
        for (let gy = -200; gy < 1024 + 200; gy += STEP) for (let gx = -200; gx < 1536 + 200; gx += STEP) {
          const px = gx + (r() - 0.5) * STEP, py = gy + (r() - 0.5) * STEP, rr = 0.7 + r() * 0.6, keep = r();
          const wd = walkDist(px, py);
          if (wd < rr / 0.04 + 3 || inStream(px, py) || Math.hypot(px - STONE.at[0], py - STONE.at[1]) < 60) continue;
          if (ROCKS.some((q) => Math.hypot(px - q[0], py - q[1]) < 36 * q[2])) continue;
          // thick by the road and the tracks, thinner deep in the woods (where the trees' own bramble crowns are)
          if (keep > (wd < 110 ? 0.62 : 0.14)) continue;
          mound(px, py, rr);
        }
      }

      // ---- tufts of tall wild grass on the stream's banks ----
      for (const [px, py] of TUFTS) {
        const r = W3D.rand(px * 7 + py), x = X(px), z = Z(py), y = K.terrain(px, py);
        for (let i = 0; i < 9; i++) {
          const a = r() * TAU, lean = 0.15 + r() * 0.35, h = 0.7 + r() * 0.6, w = 0.05 + r() * 0.03, bx = x + (r() - 0.5) * 0.5, bz = z + (r() - 0.5) * 0.4;
          const ox = Math.cos(a), oz = Math.sin(a);
          B.tri('cloth', [bx - oz * w, y, bz + ox * w], [bx + oz * w, y, bz - ox * w], [bx + ox * lean, y + h, bz + oz * lean], [[0, 0], [0.1, 0], [0.05, 1]], [1.25, 1.3, 0.85]);
        }
      }

      // ---- lily pads on the stream's still pools ----
      for (const [px, py, rr] of LILIES) {
        const x = X(px), z = Z(py), y = level(py) + 0.03, NL = 10, a0 = (px * 13 + py) % 6, gap = 0.5;
        for (let i = 0; i < NL; i++) {
          const ta = a0 + gap / 2 + (TAU - gap) * i / NL, tb = a0 + gap / 2 + (TAU - gap) * (i + 1) / NL;
          B.tri('cloth', [x, y, z], [x + Math.cos(tb) * rr, y, z + Math.sin(tb) * rr], [x + Math.cos(ta) * rr, y, z + Math.sin(ta) * rr], [[0, 0], [rr, 0], [0, rr]], [0.62, 1.0, 0.7]);
        }
      }

      // ---- small loose stones half sunk along the road's edges ----
      {
        const r = W3D.rand(99);
        for (let i = 0; i < 260; i++) {
          const px = r() * 1536, py = 120 + r() * 760, wd = walkDist(px, py);
          if (wd < 3 || wd > 16 || inStream(px, py)) continue;
          const sz = 0.18 + r() * 0.22;
          B.geom('rock', K.rockG[Math.floor(r() * 3)], new THREE.Matrix4().compose(new THREE.Vector3(X(px), K.terrain(px, py) - sz * 0.25, Z(py)), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, r() * TAU, 0)), new THREE.Vector3(sz, sz, sz)), [0.95, 0.95, 1.0], 0.6);
        }
      }

      // ---- the mist: low banks of cold blue lying between the trees (soft glows, drawn last) ----
      for (const [px, py, s] of MIST) K.halo(X(px), K.terrain(px, py) + s * 0.08, Z(py), s, [0.11, 0.15, 0.27]);
    },
  };
})(window);
