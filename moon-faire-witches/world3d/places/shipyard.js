// shipyard.js: Ysmera Brightkeel's shipyard in 3D, laid out on its painting (reference/art/walk/walk-shipyard.png,
// 1536 x 1024) in the painting's own pixels, as src/game/maps.js keeps the walking map. Where Io can walk is that map's own
// walk and block areas, unchanged (MAPS.shipyard); everything here stands round them, plus two pockets of its own.
// The texture ids are the texture pack's (texture-packs/north/shipyard/inventory.md).
// A walled yard on a rock in a dark, ice-strewn sea, at the end of a long stone bridge from the south: the curtain walls
// with their towers and fire baskets, the battlement along the south with a lamp on each corner pillar, the gatehouse's
// two round towers, the slip with its timber cradle (the Magpie's berth, kept clear), the two yard cranes, the timber
// stacks and scaffolds, the upper house, Old Gil's bunkhouse, the forge, the log shed, Pim's hall and workshop; down the
// west stairs the lower quay, the west dock and the boat landing in the cove; down the east stairs to the water, and the
// east quay with its crane.
// Heights are metres: the yard is 0. The sea lies at -2.6. The court behind the upper house is a metre up (its stair
// climbs from the terrace); the lower quay is at -1.9, the west dock and the boat landing at -2.0. The painting looks
// down at a slant, so a tall thing's foot is lower in it than its top: each wall stands where its foot is painted.
(function (G) {
  'use strict';
  const P = G.W3D_PLACES = G.W3D_PLACES || {};
  const ss = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
  const inPoly = (poly, x, y) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
  const edgeDist = (poly, x, y) => { let d = 1e9; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [ax, ay] = poly[j], [bx, by] = poly[i], dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1))); d = Math.min(d, Math.hypot(x - ax - t * dx, y - ay - t * dy)); } return d; };
  const inR = (r, x, y) => x >= r[0] && x <= r[2] && y >= r[1] && y <= r[3];
  const hash = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
  const vnoise = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf); return (hash(xi, yi) * (1 - u) + hash(xi + 1, yi) * u) * (1 - v) + (hash(xi, yi + 1) * (1 - u) + hash(xi + 1, yi + 1) * u) * v; };
  const rnd = (seed) => { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1e6) / 1e6; }; };
  const SX = 0.04, SZ = 0.05;   // metres a pixel, across and down (as the engine's map)

  const SEA = -2.6, BED = -6.0;
  const COURT_H = 1.0, LOWQ_H = -1.9, DOCK_H = -2.0, FLOAT_H = -2.3, LANDING_E = 0.8;
  const WALL_TOP = 3.4, BATTLE_TOP = 1.3;
  // the world reaches past the painting: the sea all round, and the bridge on south over it toward the crossroads
  const EXT = [-700, -620, 2236, 1700];

  // ---- the rock the yard stands on, where its walls, quays and cliffs meet the sea (the bridge runs on south) ----
  const ISLAND = [[130, 84], [1252, 84], [1392, 134], [1492, 200], [1494, 506], [1512, 506], [1512, 664], [1349, 664], [1347, 692],
    [1252, 694], [1250, 684], [1166, 684], [1166, 648], [1116, 648], [1112, 700], [1130, 762], [1104, 846], [1046, 896], [962, 920], [884, 930],
    [848, 958], [840, 1010], [837, 1060], [837, EXT[3] + 10], [689, EXT[3] + 10], [689, 1080], [636, 1058], [566, 1022], [506, 966],
    [444, 908], [364, 872], [304, 804], [288, 722], [292, 652], [252, 650], [252, 610], [207, 610], [207, 553], [212, 553], [212, 436],
    [182, 436], [182, 408], [84, 408], [84, 344], [72, 344], [66, 160]];
  // the yard: everything at the yard's level inside the walls (the terrace, the alleys, the balcony between the west
  // stairs, the east quay), cobbled and walkable wherever nothing stands; the houses are cut out of it (holes, below)
  const YARD_RING = [[160, 296], [205, 296], [205, 172], [296, 172], [296, 150], [418, 150], [418, 119], [1250, 119], [1376, 173], [1458, 232],
    [1458, 509], [1505, 509], [1505, 660], [1356, 660], [1356, 567], [1256, 567], [1256, 552], [1112, 552], [1112, 556], [372, 556],
    [362, 549], [362, 505], [319, 505], [319, 541], [294, 541], [294, 476], [212, 476], [212, 438], [184, 438], [184, 399], [91, 399],
    [91, 347], [110, 347], [160, 347]];
  // pocket one: the court behind the upper house, a metre up: its stair climbs from the terrace (tucked between the west
  // wall and the lean-to), and along the north wall behind the houses it runs to the crates stacked over the yard
  const COURT = [[107, 292], [107, 182], [168, 119], [418, 119], [418, 150], [296, 150], [296, 172], [205, 172], [205, 298], [160, 298], [160, 292]];
  const COURT_STAIR = [110, 292, 160, 344];
  // the lower quay down the west stairs, and the strip of it west of the main stair's foot
  const LOWQ = [[207, 553], [362, 553], [362, 650], [252, 650], [252, 610], [207, 610]];
  // the east landing at the top of the east stair, by the lamp on the east wall's pier
  const LANDING = [1396, 356, 1462, 420];
  // the gatehouse's ground, the forecourt and the bridge (the bridge's deck is the ground itself, between its parapets)
  const GATE = [606, 553, 916, 688];
  const BR = { x0: 689, x1: 837, y0: 686 };
  // the stairs: each a rect, its top and bottom height, and which way it goes down
  const STAIRS = {
    court: { r: COURT_STAIR, hi: COURT_H, lo: 0, down: 's', n: 6 },
    west: { r: [224, 476, 284, 556], hi: 0, lo: LOWQ_H, down: 's', n: 10 },
    west2: { r: [330, 508, 361, 588], hi: 0, lo: LOWQ_H, down: 's', n: 9 },
    boat: { r: [184, 436, 212, 462], hi: 0, lo: DOCK_H, down: 's', n: 7, mat: 'wood' },
    se1: { r: [1119, 552, 1166, 612], hi: 0, lo: -2.0, down: 's', n: 9 },
    se2: { r: [1188, 552, 1245, 684], hi: 0, lo: -2.1, down: 's', n: 15 },
    east: { r: [1396, 420, 1446, 506], hi: LANDING_E, lo: 0, down: 's', n: 5 },
    eastw: { r: [1376, 356, 1396, 394], hi: LANDING_E, lo: 0, down: 'w', n: 3 },
  };
  // each tread's height, top to bottom (n treads, n + 1 risers)
  const tops = (s) => Array.from({ length: s.n }, (_, i) => s.hi - (s.hi - s.lo) * (i + 1) / (s.n + 1));
  const treadTops = (s) => (s.down === 'w' || s.down === 'n') ? tops(s).reverse() : tops(s);
  // the ground under a stair: a ramp from its top to its foot, kept under the treads
  const stairGround = (s, x, y) => {
    const [x0, y0, x1, y1] = s.r, f = s.down === 's' ? (y - y0) / (y1 - y0) : s.down === 'n' ? (y1 - y) / (y1 - y0) : s.down === 'e' ? (x - x0) / (x1 - x0) : (x1 - x) / (x1 - x0);
    return s.hi - (s.hi - s.lo) * Math.max(0, Math.min(1, f)) - 0.35;
  };

  // ---- the ground's height under any point (metres) ----
  // the cliffs south of the battlement: rock falling from under the wall to the sea, rough
  const cliffH = (x, y) => { const d = edgeDist(ISLAND, x, y); return -2.45 + 1.7 * ss(0, 150, d) + (vnoise(x / 38, y / 38) - 0.5) * 0.9 + (vnoise(x / 11, y / 11) - 0.5) * 0.25; };
  function ground(x, y) {
    if (x >= BR.x0 && x <= BR.x1 && y >= BR.y0) return 0;                       // the forecourt and the bridge
    if (x < EXT[0] - 50 || x > EXT[2] + 50 || y < EXT[1] - 50 || y > EXT[3] + 50 || !inPoly(ISLAND, x, y)) return BED;
    for (const k in STAIRS) if (inR(STAIRS[k].r, x, y)) return stairGround(STAIRS[k], x, y);
    if (inPoly(COURT, x, y)) return COURT_H;
    if (inPoly(LOWQ, x, y)) return LOWQ_H;
    if (inR(LANDING, x, y)) return LANDING_E;
    if (inR(GATE, x, y)) return 0;
    if (x >= 1119 && x <= 1166 && y >= 612) return -2.0;
    if (x > 1166 && x < 1188 && y >= 552) return stairGround(STAIRS.se2, x, y);    // between the two water stairs                         // the landing at the foot of the west water stair
    if (x >= 1349) return 0;                                                     // the east quay
    if (y > 596 && x > 288) return cliffH(x, y);                                 // the cliffs south of the battlement
    if (y > 578 && x > 1248) return Math.min(-1.2, cliffH(x, y));                // the rocky shore below the east parapet
    return 0;
  }
  // where Io's feet stand: the ground (the decks, jetties and stairs are the engine's)
  const walkH = (x, y) => {
    const s = STAIRS.west2;
    if (inR(s.r, x, y)) return treadTops(s)[Math.min(s.n - 1, Math.floor((y - s.r[1]) / (s.r[3] - s.r[1]) * s.n))];
    return ground(x, y);
  };

  // the sea, all round: the world's whole extent less the rock (a ring with the rock cut out of it)
  const WATER = [[EXT[0] - 30, EXT[1] - 30], [EXT[2] + 30, EXT[1] - 30], [EXT[2] + 30, EXT[3] + 30], [EXT[0] - 30, EXT[3] + 30], [EXT[0] - 30, 160]]
    .concat(ISLAND.slice().reverse().map((p) => p.slice()), [[66, 160], [EXT[0] - 30, 160]]);

  // ---- the curtain walls (centre lines, pixels); the engine builds them, extra() adds merlons, snow and towers ----
  const CURTAIN = [
    { id: 'north', pts: [[148, 100], [1252, 100]], t: 1.6 },
    { id: 'north-west', pts: [[148, 100], [82, 172]], t: 1.6 },
    { id: 'west', pts: [[88, 172], [88, 344]], t: 1.6 },
    { id: 'north-east', pts: [[1252, 100], [1386, 150]], t: 1.6 },
    { id: 'east, by the north-east tower', pts: [[1386, 150], [1478, 214]], t: 1.6 },
    { id: 'east', pts: [[1478, 214], [1478, 504]], t: 1.6 },
  ];
  const BATTLE = [
    { id: 'battlement, west of the gate', pts: [[388, 577], [612, 577]], t: 1.8 },
    { id: 'battlement, east of the gate', pts: [[911, 581], [1092, 581]], t: 1.8 },
  ];

  // things standing on the yard's own level, out of the 2D walk
  const BARRELS = [[452, 126], [470, 122], [488, 128], [504, 122], [880, 124], [898, 128], [1078, 126], [1094, 122], [1206, 132], [1224, 126], [1240, 140],
    [1090, 292], [1080, 326], [1084, 338], [1286, 336], [434, 526], [450, 540], [540, 536], [556, 530], [936, 540], [952, 534], [990, 548],
    [550, 520], [141, 384]];
  const CRATES = [[1100, 128, 0.2], [1118, 140, -0.1], [878, 140, 0.05], [440, 530, 0.1], [470, 530, -0.2], [500, 520, 0.15], [522, 540, 0.05],
    [560, 392, 0.1], [584, 400, -0.15], [566, 430, 0.2], [598, 438, 0], [960, 520, -0.1], [976, 540, 0.12], [990, 512, 0.3], [1320, 140, 0.1], [1336, 160, -0.2]];

  // ---- the buildings. Footprints in pixels [x0, y0, x1, y1], each just off the walk; the fronts face south ----
const BUILDINGS = [
    { id: 'upper', name: 'the upper house', fp: [296, 150, 418, 298], walls: [{ t: 'stone', h: 2.8 }, { t: 'timber', h: 2.8 }], roof: { ridge: 'ns', rise: 4.6, over: 0.45 },
      windows: [{ side: 's', x: 334, y: 3.3, w: 0.8, h: 1.1 }, { side: 's', x: 362, y: 3.3, w: 0.8, h: 1.1 }, { side: 's', x: 334, y: 5.9, w: 0.7, h: 0.9 }, { side: 's', x: 362, y: 5.9, w: 0.7, h: 0.9 },
        { side: 'n', x: 340, y: 2.5, w: 0.7, h: 0.9 }, { side: 'n', x: 390, y: 2.5, w: 0.7, h: 0.9, dark: true }],
      chimneys: [{ x: 404, y: 172, w: 0.9, d: 0.9, h: 3.4 }] },
    { id: 'upper-west', name: 'the upper house’s west wing', fp: [205, 172, 296, 298], walls: [{ t: 'stone', h: 2.6 }, { t: 'timber', h: 2.3 }], roof: { ridge: 'ew', rise: 3.0, over: 0.45 },
      doors: [{ side: 's', x: 258, w: 1.1, h: 2.2, arch: true }], windows: [{ side: 's', x: 228, y: 3.2, w: 0.8, h: 1.0 }, { side: 's', x: 276, y: 3.2, w: 0.8, h: 1.0 },
        { side: 'w', y: 236, z: 1.4, w: 0.7, h: 0.9 }, { side: 'n', x: 240, y: 2.4, w: 0.7, h: 0.9 }],
      lanterns: [{ side: 's', x: 238, y: 2.4 }], chimneys: [{ x: 218, y: 186, w: 0.9, d: 0.9, h: 3.0 }] },
    { id: 'upper-east', name: 'the upper house’s east wing', fp: [418, 238, 498, 312], walls: [{ t: 'stone', h: 2.4 }, { t: 'timber', h: 1.8 }], roof: { ridge: 'ew', rise: 2.4, over: 0.4 },
      doors: [{ side: 's', x: 444, w: 1.0, h: 2.1, plain: true }], windows: [{ side: 's', x: 474, y: 1.0, w: 0.8, h: 0.9 }, { side: 'e', y: 270, z: 1.0, w: 0.7, h: 0.9 }],
      lanterns: [{ side: 's', x: 460, y: 2.2 }] },
    { id: 'lean-to', name: 'the lean-to by the terrace', fp: [178, 298, 234, 345], walls: [{ t: 'stone', h: 2.3 }], roof: { ridge: 'ew', rise: 1.0, over: 0.3, lean: 'n' },
      doors: [{ side: 's', x: 220, w: 0.9, h: 1.9, plain: true }], windows: [{ side: 's', x: 194, y: 1.0, w: 0.6, h: 0.7 }] },
    { id: 'bunkhouse', name: 'Old Gil’s bunkhouse', fp: [282, 300, 360, 465], walls: [{ t: 'stone', h: 2.6 }, { t: 'timber', h: 2.0 }], roof: { ridge: 'ns', rise: 3.6, over: 0.45 },
      doors: [{ side: 's', x: 320, w: 1.4, h: 2.4, arch: true, double: true }], windows: [{ side: 's', x: 320, y: 3.1, w: 0.9, h: 1.0 }, { side: 'w', y: 420, z: 1.0, w: 0.7, h: 0.9 }, { side: 'w', y: 340, z: 3.2, w: 0.7, h: 0.8 }],
      lanterns: [{ side: 's', x: 296, y: 2.4 }, { side: 's', x: 344, y: 2.4 }], chimneys: [{ x: 300, y: 330, w: 0.9, d: 0.9, h: 2.6 }] },
    { id: 'bunkhouse-east', name: 'the bunkhouse’s long room', fp: [360, 340, 490, 466], walls: [{ t: 'stone', h: 2.6 }, { t: 'timber', h: 0.7 }], roof: { ridge: 'ew', rise: 3.0, over: 0.45 },
      doors: [{ side: 's', x: 436, w: 1.2, h: 2.3, arch: true }], windows: [{ side: 's', x: 382, y: 1.0, w: 0.9, h: 1.0 }, { side: 's', x: 470, y: 1.0, w: 0.9, h: 1.0 }, { side: 's', x: 408, y: 1.0, w: 0.6, h: 0.9 }],
      lanterns: [{ side: 's', x: 420, y: 2.2 }, { side: 's', x: 452, y: 2.2 }], dormers: [{ side: 's', x: 436, w: 1.2 }] },
    { id: 'forge-west', name: 'the forge’s open shed', fp: [1100, 198, 1205, 344], walls: [{ t: 'stone', h: 3.0 }], roof: { ridge: 'ew', rise: 2.4, over: 0.5 }, open: 's',
      posts: [1104, 1152, 1201] },
    { id: 'forge', name: 'the forge', fp: [1205, 178, 1300, 346], walls: [{ t: 'stone', h: 3.0 }, { t: 'timber', h: 1.4 }], roof: { ridge: 'ns', rise: 3.6, over: 0.5 }, open: 's',
      posts: [1209, 1296], chimneys: [{ x: 1290, y: 200, w: 1.3, d: 1.3, h: 4.4 }] },
    { id: 'log-shed', name: 'the log shed', fp: [1300, 252, 1452, 352], walls: [{ t: 'planks', h: 2.3 }], roof: { ridge: 'ew', rise: 1.1, over: 0.35, lean: 'n' }, open: 's',
      posts: [1304, 1378, 1448] },
    { id: 'hall', name: 'Pim’s hall', fp: [1072, 374, 1240, 509], walls: [{ t: 'stone', h: 2.5 }, { t: 'timber', h: 0.7 }], roof: { ridge: 'ew', rise: 3.2, over: 0.45 },
      doors: [{ side: 's', x: 1150, w: 1.3, h: 2.3, green: true, arch: true }],
      windows: [{ side: 's', x: 1094, y: 1.0, w: 0.9, h: 1.0 }, { side: 's', x: 1122, y: 1.0, w: 0.8, h: 1.0 }, { side: 's', x: 1180, y: 1.0, w: 0.8, h: 1.0 }, { side: 's', x: 1214, y: 1.0, w: 0.9, h: 1.0 },
        { side: 'w', y: 440, z: 1.0, w: 0.8, h: 0.9 }],
      lanterns: [{ side: 's', x: 1134, y: 2.3 }, { side: 's', x: 1166, y: 2.3 }], dormers: [{ side: 's', x: 1105, w: 1.3 }, { side: 's', x: 1190, w: 1.3 }],
      chimneys: [{ x: 1086, y: 400, w: 0.8, d: 0.8, h: 2.4 }, { x: 1226, y: 400, w: 0.8, d: 0.8, h: 2.4 }] },
    { id: 'hall-east', name: 'Pim’s hall, the east end', fp: [1240, 398, 1300, 520], walls: [{ t: 'stone', h: 2.4 }, { t: 'timber', h: 0.6 }], roof: { ridge: 'ns', rise: 2.2, over: 0.4 },
      windows: [{ side: 's', x: 1270, y: 1.0, w: 0.9, h: 1.0 }] },
    { id: 'workshop', name: 'Pim’s workshop', fp: [1300, 398, 1392, 501], walls: [{ t: 'stone', h: 1.2 }, { t: 'timber', h: 1.8 }], roof: { ridge: 'ew', rise: 1.8, over: 0.4 },
      windows: [{ side: 's', x: 1328, y: 0.9, w: 1.2, h: 1.5 }, { side: 's', x: 1366, y: 0.9, w: 1.2, h: 1.5 }, { side: 'e', y: 450, z: 2.0, w: 0.7, h: 0.6, dark: true }] },
];

  // a ring with holes in it (each hole wound the other way, joined to the ring by a cut of no width), so the yard's added
  // ground goes round the houses: the layout check counts the yard as walkable ground, and nothing solid stands on it
  const area = (r) => { let a = 0; for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += (r[j][0] - r[i][0]) * (r[j][1] + r[i][1]); return a; };
  const withHoles = (ring, holes) => {
    const out = area(ring) > 0 ? ring.slice() : ring.slice().reverse(), o0 = out[0];
    for (const h0 of holes) { const h = area(h0) > 0 ? h0.slice().reverse() : h0.slice(); out.push(o0, ...h, h[0], o0); }
    return out;
  };
  const YARD = withHoles(YARD_RING, BUILDINGS.map((b) => [[b.fp[0], b.fp[1]], [b.fp[2], b.fp[1]], [b.fp[2], b.fp[3]], [b.fp[0], b.fp[3]]]));

  // the snowy pines among the cliffs' crags, where the painting has them: [x, y, size, kind (1: a fir), seed]
  const PINES = [[426, 640, 0.5, 1, 1], [392, 664, 0.42, 1, 2], [590, 632, 0.52, 1, 3], [446, 752, 0.5, 1, 4], [522, 784, 0.46, 1, 5], [600, 700, 0.48, 1, 6],
    [584, 836, 0.5, 1, 7], [626, 892, 0.55, 1, 8], [480, 690, 0.42, 1, 9], [920, 640, 0.52, 1, 10], [962, 706, 0.5, 1, 11], [1004, 646, 0.45, 1, 12],
    [1056, 686, 0.52, 1, 13], [902, 772, 0.5, 1, 14], [962, 820, 0.46, 1, 15], [1092, 720, 0.44, 1, 16], [1020, 760, 0.42, 1, 17], [866, 860, 0.45, 1, 18], [656, 960, 0.44, 1, 19]];

  // the ice floes in the painting's sea (traced from its bright patches; past the painting extra() scatters more)
  const FLOES = [[[123,10],[137,0],[167,0],[167,22],[162,23],[154,23],[130,22],[124,16]],
    [[168,0],[170,0],[188,11],[188,15],[187,16],[181,19],[170,22],[168,22]],
    [[1422,14],[1424,12],[1437,2],[1441,0],[1455,0],[1455,34],[1444,30],[1422,20]],
    [[1456,0],[1511,0],[1511,45],[1506,45],[1501,44],[1456,34]],
    [[1512,1],[1523,0],[1535,0],[1535,35],[1527,42],[1522,45],[1512,45]],
    [[0,12],[15,4],[21,4],[31,8],[31,12],[20,18],[6,19],[0,18]],
    [[62,12],[70,7],[76,7],[84,11],[84,15],[74,18],[69,18],[62,16]],
    [[184,22],[196,10],[202,10],[219,17],[223,26],[204,33],[192,33],[184,28]],
    [[225,30],[228,25],[244,22],[250,22],[250,30],[244,34],[235,35],[225,35]],
    [[1475,52],[1478,49],[1482,49],[1486,50],[1490,53],[1491,54],[1491,55],[1475,55]],
    [[1475,56],[1497,56],[1497,61],[1492,61],[1487,60]],
    [[1414,64],[1422,58],[1427,56],[1452,56],[1455,58],[1455,73],[1438,74],[1414,68]],
    [[1456,58],[1457,58],[1462,62],[1462,66],[1461,68],[1456,72]],
    [[0,59],[10,58],[31,68],[32,73],[18,87],[12,92],[2,93],[0,92]],
    [[1512,61],[1525,58],[1535,58],[1535,93],[1529,95],[1518,95],[1512,94]],
    [[1498,77],[1506,62],[1507,61],[1511,61],[1511,94],[1509,94],[1498,82]],
    [[1458,102],[1472,90],[1489,91],[1495,96],[1494,102],[1476,109],[1465,109],[1458,106]],
    [[1512,129],[1526,121],[1530,120],[1535,120],[1535,151],[1530,153],[1520,153],[1512,149]],
    [[1504,140],[1509,132],[1511,130],[1511,149],[1510,149],[1504,145]],
    [[23,158],[28,158],[33,159],[33,165],[26,165],[23,163]],
    [[0,170],[9,170],[11,171],[22,182],[22,189],[12,203],[11,204],[0,204]],
    [[1520,262],[1521,260],[1530,257],[1534,257],[1534,261],[1528,266],[1524,267],[1520,267]],
    [[0,263],[2,262],[6,261],[15,261],[15,267],[8,278],[6,279],[0,279]],
    [[0,280],[6,280],[14,282],[14,286],[10,289],[5,291],[0,291]],
    [[0,324],[4,320],[12,315],[19,315],[24,331],[24,335],[6,335],[0,332]],
    [[0,338],[2,336],[24,336],[23,349],[20,351],[14,352],[10,352],[0,346]],
    [[0,385],[3,384],[11,384],[12,385],[12,389],[11,390],[6,390],[0,389]],
    [[0,397],[3,395],[11,395],[13,399],[13,409],[12,413],[2,415],[0,412]],
    [[0,431],[15,419],[28,418],[40,429],[40,434],[34,444],[19,447],[0,447]],
    [[0,448],[22,448],[32,451],[35,468],[27,477],[16,481],[5,480],[0,473]],
    [[42,424],[49,424],[50,425],[52,430],[52,437],[46,437],[42,430]],
    [[21,485],[32,478],[37,478],[55,486],[55,495],[51,497],[36,499],[21,492]],
    [[56,486],[59,486],[63,488],[63,492],[60,495],[56,495]],
    [[0,490],[2,489],[6,489],[10,493],[10,499],[6,499],[0,497]],
    [[76,509],[80,507],[91,507],[101,510],[100,515],[92,518],[84,518],[76,514]],
    [[39,514],[44,511],[48,511],[55,513],[55,517],[52,518],[39,518]],
    [[0,537],[2,536],[11,536],[11,540],[10,541],[7,542],[0,542]],
    [[15,572],[33,565],[44,566],[55,574],[55,583],[47,592],[19,594],[7,582]],
    [[18,609],[25,605],[29,605],[32,608],[32,612],[31,615],[20,615],[18,614]],
    [[35,673],[36,672],[46,672],[46,677],[44,678],[40,678],[35,677]],
    [[56,716],[63,709],[76,709],[81,710],[87,713],[97,727],[56,727]],
    [[56,728],[111,728],[111,759],[110,760],[74,772],[59,772],[56,766]],
    [[24,725],[27,723],[29,722],[55,718],[55,727],[24,727]],
    [[11,739],[14,735],[23,728],[55,728],[55,766],[48,765],[17,747],[11,743]],
    [[112,729],[122,736],[123,737],[123,743],[122,745],[115,755],[112,758]],
    [[256,738],[258,736],[270,728],[279,728],[279,752],[266,752],[258,746],[256,744]],
    [[1206,741],[1217,732],[1226,730],[1231,734],[1231,742],[1220,748],[1210,749],[1206,745]],
    [[1232,734],[1236,735],[1238,736],[1239,737],[1239,741],[1238,742],[1232,742]],
    [[1512,755],[1526,745],[1530,745],[1535,760],[1535,773],[1530,774],[1523,773],[1512,763]],
    [[1473,753],[1479,750],[1490,751],[1492,753],[1492,757],[1486,759],[1476,759],[1473,757]],
    [[141,764],[150,759],[156,759],[158,760],[158,766],[153,769],[145,770],[141,768]],
    [[1490,770],[1495,766],[1504,765],[1511,769],[1511,774],[1502,778],[1496,778],[1490,774]],
    [[86,781],[87,780],[100,773],[102,772],[107,770],[111,770],[111,783],[86,783]],
    [[86,784],[111,784],[111,793],[109,793],[88,788],[86,786]],
    [[112,784],[133,784],[133,785],[120,793],[112,793]],
    [[112,770],[134,778],[134,783],[112,783]],
    [[1456,797],[1463,790],[1474,786],[1490,790],[1511,805],[1509,822],[1470,823],[1457,822]],
    [[1441,802],[1443,799],[1450,797],[1455,797],[1455,819],[1453,819],[1442,815],[1441,806]],
    [[0,787],[4,787],[10,789],[10,793],[7,796],[4,797],[0,797]],
    [[241,820],[244,817],[269,796],[279,792],[279,836],[266,837],[258,836],[241,825]],
    [[280,792],[285,792],[295,796],[313,813],[316,821],[316,827],[308,835],[280,836]],
    [[1344,805],[1362,793],[1373,792],[1399,803],[1399,812],[1384,823],[1359,822],[1344,812]],
    [[37,803],[39,801],[48,800],[54,802],[54,807],[44,811],[40,811],[37,807]],
    [[44,816],[45,815],[49,812],[55,812],[55,822],[46,822],[44,820]],
    [[56,812],[58,812],[60,813],[63,815],[63,819],[57,822],[56,822]],
    [[1519,830],[1522,826],[1531,823],[1535,823],[1535,839],[1521,839],[1519,834]],
    [[1518,842],[1520,840],[1535,840],[1535,856],[1530,856],[1523,851],[1518,846]],
    [[1400,830],[1411,825],[1417,824],[1421,824],[1430,826],[1440,834],[1440,839],[1400,839]],
    [[1400,840],[1439,840],[1449,862],[1446,870],[1427,882],[1421,885],[1404,888],[1400,882]],
    [[1370,839],[1372,837],[1377,834],[1384,831],[1396,830],[1399,830],[1399,839]],
    [[1369,840],[1399,840],[1399,881],[1392,881],[1382,879],[1378,877],[1375,874],[1368,846]],
    [[1438,825],[1442,825],[1447,826],[1453,829],[1453,833],[1449,834],[1444,834],[1438,830]],
    [[0,833],[3,830],[12,830],[27,834],[29,837],[29,839],[0,839]],
    [[0,840],[29,840],[36,849],[36,854],[23,864],[18,864],[12,863],[0,859]],
    [[1456,833],[1458,831],[1462,831],[1472,832],[1476,835],[1476,839],[1456,839]],
    [[1456,840],[1476,840],[1473,845],[1461,849],[1456,849]],
    [[1444,842],[1445,840],[1455,840],[1455,849],[1453,849],[1444,847]],
    [[1254,853],[1272,842],[1285,842],[1287,844],[1287,856],[1270,863],[1260,863],[1254,857]],
    [[1288,845],[1294,848],[1295,849],[1295,853],[1294,854],[1292,855],[1288,855]],
    [[336,853],[344,848],[348,848],[359,855],[358,865],[354,869],[341,868],[336,862]],
    [[326,858],[330,855],[334,854],[335,854],[335,862],[326,862]],
    [[1288,869],[1293,862],[1297,860],[1338,850],[1343,850],[1343,895],[1318,895],[1288,883]],
    [[1319,896],[1343,896],[1343,908],[1334,906],[1322,903],[1321,902]],
    [[1280,875],[1281,873],[1282,872],[1287,869],[1287,883],[1286,883],[1284,882],[1280,879]],
    [[1344,896],[1375,896],[1368,901],[1359,907],[1354,908],[1344,908]],
    [[1344,850],[1358,853],[1363,856],[1369,862],[1383,886],[1383,891],[1376,895],[1344,895]],
    [[66,868],[101,852],[111,853],[111,890],[109,894],[94,895],[86,892],[62,876]],
    [[112,853],[115,853],[122,857],[140,873],[142,876],[141,883],[135,888],[112,890]],
    [[1456,872],[1458,870],[1490,854],[1495,852],[1507,852],[1511,854],[1511,895],[1456,895]],
    [[1456,896],[1511,896],[1511,935],[1509,935],[1503,934],[1457,906],[1456,904]],
    [[1438,896],[1455,896],[1455,904],[1454,904],[1445,903],[1438,897]],
    [[1434,890],[1435,888],[1447,876],[1453,873],[1455,873],[1455,895],[1434,895]],
    [[1512,855],[1514,855],[1533,873],[1535,875],[1535,895],[1514,895],[1512,891]],
    [[1512,898],[1514,896],[1535,896],[1535,944],[1531,944],[1522,942],[1512,935]],
    [[1064,876],[1081,859],[1086,859],[1093,863],[1093,870],[1081,879],[1077,881],[1064,882]],
    [[0,876],[1,875],[7,872],[23,872],[55,884],[55,895],[3,895],[0,891]],
    [[0,898],[2,896],[55,896],[55,951],[0,951]],
    [[0,952],[55,952],[55,960],[24,979],[19,982],[9,986],[4,986],[0,983]],
    [[56,896],[76,896],[77,900],[77,906],[73,933],[72,935],[62,951],[56,951]],
    [[56,884],[61,884],[65,887],[73,894],[74,895],[56,895]],
    [[1288,908],[1298,896],[1306,896],[1319,909],[1319,913],[1306,920],[1293,922],[1288,920]],
    [[1277,912],[1280,909],[1283,908],[1287,908],[1287,920],[1285,920],[1277,916]],
    [[1400,903],[1413,899],[1418,899],[1424,900],[1430,902],[1455,915],[1455,951],[1400,951]],
    [[1400,952],[1455,952],[1455,958],[1434,975],[1423,980],[1415,981],[1408,981],[1400,976]],
    [[1344,952],[1399,952],[1399,976],[1376,975],[1371,974],[1344,963]],
    [[1344,925],[1373,908],[1386,903],[1393,902],[1398,902],[1399,903],[1399,951],[1344,951]],
    [[1309,947],[1311,943],[1324,932],[1336,927],[1340,926],[1343,926],[1343,951],[1309,951]],
    [[1313,952],[1343,952],[1343,963],[1328,963],[1321,962]],
    [[1456,914],[1468,914],[1480,922],[1484,925],[1484,934],[1479,940],[1465,951],[1456,951]],
    [[959,913],[974,909],[980,909],[984,911],[983,916],[973,920],[968,920],[959,917]],
    [[1033,916],[1043,910],[1051,910],[1058,915],[1058,920],[1051,924],[1043,924],[1033,920]],
    [[1487,951],[1496,944],[1498,943],[1511,943],[1511,951]],
    [[1456,983],[1470,960],[1475,955],[1478,954],[1486,952],[1511,952],[1511,1007],[1456,1007]],
    [[1456,1008],[1511,1008],[1511,1023],[1456,1023]],
    [[1422,1005],[1424,1001],[1434,990],[1435,989],[1447,985],[1455,983],[1455,1007],[1422,1007]],
    [[1422,1008],[1455,1008],[1455,1023],[1444,1023],[1422,1010]],
    [[1512,952],[1532,952],[1535,955],[1535,1007],[1512,1007]],
    [[1512,943],[1514,943],[1518,944],[1521,946],[1526,950],[1527,951],[1512,951]],
    [[1512,1008],[1535,1008],[1535,1023],[1512,1023]],
    [[90,947],[94,944],[101,944],[101,948],[95,951],[90,951]],
    [[112,951],[123,948],[127,948],[140,949],[140,951]],
    [[112,952],[141,952],[144,954],[154,963],[154,968],[147,974],[118,990],[112,993]],
    [[56,970],[65,963],[74,959],[111,952],[111,993],[106,1000],[83,1007],[56,1007]],
    [[56,1008],[83,1008],[82,1012],[72,1017],[58,1017],[56,1015]],
    [[25,989],[32,982],[40,977],[54,971],[55,971],[55,1007],[35,1007],[25,994]],
    [[35,1008],[55,1008],[55,1015],[36,1012]],
    [[168,977],[174,974],[182,974],[192,979],[193,984],[183,989],[172,989],[168,987]],
    [[115,1007],[118,1003],[129,990],[145,988],[149,988],[160,990],[167,994],[167,1007]],
    [[112,1009],[113,1008],[167,1008],[167,1023],[112,1023]],
    [[100,1019],[102,1016],[106,1012],[111,1009],[111,1023],[100,1023]],
    [[168,994],[176,994],[181,995],[186,998],[187,1000],[187,1004],[186,1007],[168,1007]],
    [[168,1008],[186,1008],[192,1012],[192,1017],[190,1019],[184,1023],[168,1023]],
    [[224,1001],[231,1001],[242,1004],[242,1007],[224,1007]],
    [[224,1008],[242,1008],[245,1012],[245,1016],[243,1023],[229,1023],[224,1020]],
    [[214,1009],[215,1008],[223,1008],[223,1020],[214,1013]],
    [[0,1005],[1,1004],[5,1002],[11,1002],[22,1007],[0,1007]],
    [[0,1008],[23,1008],[26,1009],[27,1010],[27,1015],[25,1023],[0,1023]]];

  P.shipyard = {
    id: 'shipyard', name: 'The shipyard', painting: "art/walk/walk-shipyard.avif", size: [1536, 1024],
    mapId: 'shipyard', paintingPng: 'reference/art/walk/walk-shipyard.png',
    // the wall check (tools/walls-test.mjs): from the bridge's far end, to the way out, through the gate, round the yard,
    // down both sets of stairs, onto every quay and into both pockets
    checks: { from: [760, 990], goals: [
      ['the bridge’s end, to the crossroads (south edge)', 760, 1018], ['through the gatehouse', 764, 600], ['the yard, before the slip', 764, 485],
      ['the head of the slip, the Magpie’s berth', 764, 142], ['Old Gil’s bunkhouse door', 384, 486], ['the terrace by the west wall', 130, 360],
      ['the boat landing, down the wooden steps', 192, 486], ['the lower quay', 300, 600], ['the west dock’s end', 150, 632],
      ['the float past the west dock (a pocket)', 104, 650], ['the court behind the upper house (a pocket)', 150, 230], ['the door in the north wall (a pocket)', 258, 130],
      ['the north-west crane', 560, 262], ['the forge', 1150, 356], ['Pim’s hall door', 1150, 528], ['the log shed', 1330, 372],
      ['the east landing by the lamp', 1420, 380], ['the east quay and its crane', 1440, 560], ['the foot of the east water stair', 1216, 676],
      ['the landing below the west water stair', 1140, 632], ['the corner behind the forge', 1384, 222], ['the alley behind the bunkhouse', 440, 328]] },
    // no trees from the painting (the pines on the cliffs are placed by hand in extraTrees)
    treeGen: { dark: 2, keepOut: [[-2000, -2000, 4000, 4000]] },
    // the ground's textures: the yard's cobbles (and the bridge's), snow, the snowy rock of the cliffs, and the cobbles again
    ground: { cob: 'shared_cobbles_town', grass: 'shared_snow', dirt: 'shared_rock_cliff_snowy', pave: 'shared_cobbles_town', rep: [3.2, 4.0, 4.5, 3.2], grassTint: [1.0, 1.0, 1.0] },
    // each texture: Chris's made one if the page carries it (texture-packs/made/), else the pack's stand-in. Written out in
    // full, so the offline build finds the pictures and puts them inside the file.
    textures: [
      { id: 'shared_cobbles_town', made: "./../texture-packs/made-web/shared_cobbles_town.webp", stand: "./../texture-packs/wickhollow/wickhollow/stand-in/shared_cobbles_town.png" },
      { id: 'shared_snow', made: "./../texture-packs/made-web/shared_snow.webp", stand: "./../texture-packs/north/frozen-pass/stand-in/shared_snow.png" },
      { id: 'shared_rock_cliff_snowy', made: "./../texture-packs/made-web/shared_rock_cliff_snowy.webp", stand: "./../texture-packs/north/frozen-pass/stand-in/shared_rock_cliff_snowy.png" },
      { id: 'shared_stone_wall_frosted', made: "./../texture-packs/made-web/shared_stone_wall_frosted.webp", stand: "./../texture-packs/north/moonwell/stand-in/shared_stone_wall_frosted.png" },
      { id: 'shared_roof_slate_snow', made: "./../texture-packs/made-web/shared_roof_slate_snow.webp", stand: "./../texture-packs/north/shipyard/stand-in/shared_roof_slate_snow.png" },
      { id: 'shipyard_icy_sea', made: "./../texture-packs/made-web/shipyard_icy_sea.webp", stand: "./../texture-packs/north/shipyard/stand-in/shipyard_icy_sea.png" },
      { id: 'shared_boardwalk_planks', made: "./../texture-packs/made-web/shared_boardwalk_planks.webp", stand: "./../texture-packs/wickhollow/jetty/stand-in/shared_boardwalk_planks.png" },
      { id: 'wick_wall_timber_plaster', made: "./../texture-packs/made-web/wick_wall_timber_plaster.webp", stand: "./../texture-packs/wickhollow/wickhollow/stand-in/wick_wall_timber_plaster.png" },
      { id: 'fir_foliage_snowladen', made: "./../texture-packs/made-web/fir_foliage_snowladen.webp", stand: "./../texture-packs/wilds-north/frozen-camp/stand-in/fir_foliage_snowladen.png" },
      { id: 'shared_bark_oak', made: "./../texture-packs/made-web/shared_bark_oak.webp", stand: "./../texture-packs/wickhollow/cottage/stand-in/shared_bark_oak.png" },
      { id: 'shared_ice', made: "./../texture-packs/made-web/shared_ice.webp", stand: "./../texture-packs/north/frozen-pass/stand-in/shared_ice.png" },
    ],
    // which texture each kind of surface uses: the walls, towers and stone floors of frosted castle blocks, the timber
    // framing of the houses (the half-timbered bay has no stand-in yet: Wickhollow's timber and plaster stands in), the
    // snowy slate roofs, the planks of the docks and the slip, the snowy rock of the cliffs
    surfaces: { stone: 'shared_stone_wall_frosted', dry: 'shared_stone_wall_frosted', timber: 'wick_wall_timber_plaster', roof: 'shared_roof_slate_snow',
      planks: 'shared_boardwalk_planks', wood: 'shared_boardwalk_planks', deck: 'shared_boardwalk_planks', pave: 'shared_cobbles_town',
      soil: 'shared_rock_cliff_snowy', rock: 'shared_rock_cliff_snowy', leaves: 'fir_foliage_snowladen', firs: 'fir_foliage_snowladen', bark: 'shared_bark_oak' },
    // snow lying on the walls' tops and the floes, and the floes' icy sides
    extraMats: { snow: { tex: 'shared_snow', rep: 2.5, tint: 0xbab2a2, shade: 0.3 }, ice: { tex: 'shared_ice', rep: 1.6, tint: 0xa0a0a8, shade: 0.3 } },
    tints: { leaves: 0xe8f0ff, firs: 0xd8e4f4, bush: 0xe0eaff, wood: 0xc0a088 },
    // the north at night over the sea: no hills round it (all round is the sea, to the horizon), a sea mist
    night: { hills: false, fog: [0.05, 0.06, 0.12], fogNear: 22, fogFar: 78 },
    extent: EXT,
    bounds: YARD_RING, thicket: false,
    ground_h: ground,
    walk_h: walkH,
    water: [{ poly: WATER, level: () => SEA, tex: 'shipyard_icy_sea', rep: 7, flow: [0.003, 0.0015], bed: BED }],
    lawns: [],
    // the bridge's cobbles on past the painting; the cliffs' rock under their columns
    groundPatches: [{ poly: [[689, 1000], [837, 1000], [837, EXT[3] + 20], [689, EXT[3] + 20]], kind: 'cob' },
      { poly: [[288, 598], [604, 598], [604, 690], [688, 690], [688, 1100], [560, 1060], [440, 940], [300, 860], [270, 700]], kind: 'dirt' },
      { poly: [[918, 600], [1112, 604], [1150, 720], [1140, 860], [1060, 930], [900, 960], [838, 1060], [838, 690], [918, 690]], kind: 'dirt' },
      { poly: [[1252, 579], [1345, 579], [1345, 700], [1252, 700]], kind: 'dirt' }],
    noRocks: [[-3000, -3000, 5000, 5000]],
    start: [760, 990], startFace: Math.PI,
    // the way out (the walking map's exit): the long bridge south, to the crossroads
    exits: [{ rect: [708, 1004, 810, 1024], label: 'The crossroads' }],

    buildings: BUILDINGS,

    // ---- walls along lines: the curtain walls (extra() adds merlons, snow and towers), the battlement, the terrace's
    // parapet, the stairs' cheeks, the low wall above the east shore, and the bridge's parapets ----
    walls: CURTAIN.map((w) => ({ pts: w.pts, h: WALL_TOP, t: w.t, tex: 'dry', drop: true }))
      .concat(BATTLE.map((w) => ({ pts: w.pts, h: BATTLE_TOP, t: w.t, tex: 'dry', drop: true })))
      .concat([
        { pts: [[84, 344], [84, 406], [181, 406]], h: 0.85, t: 0.6, tex: 'dry', drop: true },        // the terrace's parapet
        { pts: [[180, 406], [180, 436]], h: 0.85, t: 0.3, tex: 'dry', drop: true },
        { pts: [[217, 478], [217, 552]], h: 0.9, t: 0.4, tex: 'dry', drop: true },                   // the west stair's cheek over the cove
        { pts: [[289, 478], [289, 547]], h: 0.85, t: 0.4, tex: 'dry', drop: true },                  // the balcony between the two west stairs
        { pts: [[289, 547], [325, 547]], h: 0.85, t: 0.4, tex: 'dry', drop: true },
        { pts: [[325, 547], [325, 514]], h: 0.85, t: 0.4, tex: 'dry', drop: true },
        { pts: [[1112.5, 604], [1112.5, 646]], h: 0.8, t: 0.4, tex: 'dry', drop: true },             // the west water stair's cheek
        { pts: [[1177, 556], [1177, 684]], h: 0.85, t: 0.85, tex: 'dry' },                         // between the two water stairs
        { pts: [[1250.5, 684], [1250.5, 574], [1347, 574], [1347, 662]], h: 0.85, t: 0.45, tex: 'dry', drop: true },   // above the east shore
        { pts: [[696.5, 690], [696.5, EXT[3]]], h: 0.85, t: 0.55, tex: 'dry', drop: true },              // the bridge's parapets
        { pts: [[829, 690], [829, EXT[3]]], h: 0.85, t: 0.55, tex: 'dry', drop: true },
      ]),
    // (the stair by the bunkhouse is built in extra(): the engine's cheek beside it would stand on the lower quay's walk)
    steps: Object.entries(STAIRS).filter(([k]) => k !== 'west2').map(([, s]) => ({ r: s.r, down: s.down, n: s.n, tops: treadTops(s), mat: s.mat || 'dry' })),
    // the slip's ramp (the Magpie's berth: nothing stands on it), the boat landing and the float past the west dock
    decks: [
      { r: [713, 128, 813, 158], y: 0.25, boards: 'ew', stilts: false },
      { r: [729, 158, 799, 346], y: 0.25, boards: 'ew', stilts: false },
      { r: [736, 346, 790, 470], y: 0.25, boards: 'ew', stilts: false },
      { r: [165, 462, 214, 502], y: DOCK_H, boards: 'ew', stilts: true, bottom: BED, rails: { sides: 'ws', kind: 'wood' } },
      { r: [86, 628, 128, 668], y: FLOAT_H, boards: 'ns', stilts: false },
    ],
    // the west dock: planks on posts out over the cove from the lower quay
    jetties: [{ r: [128, 608, 252, 660], y: DOCK_H, posts: false }],
    // the shipyard's lamps (SHIP_LAMPS in maps.js), where the walking map has them: two posts in the yard, one on the terrace,
    // one by the forge, one on the lower quay, one on the east shore's wall, one on each of the battlement's corner pillars,
    // one on the east landing by the east wall, one on the cheek between the two water stairs. The lamps off the walking
    // map's own (by the slip's head, by the upper house, behind the forge, on the bridge) are built in extra()
    lamps: [
      { at: [597, 519], kind: 'post' }, { at: [917, 517], kind: 'post' }, { at: [226, 456], kind: 'post' }, { at: [1067, 276], kind: 'post' },
      { at: [310, 625], kind: 'post', y: LOWQ_H }, { at: [1345, 628], kind: 'post', y: 0.85, h: 2.1 },
      { at: [374, 565], kind: 'post', y: BATTLE_TOP + 0.35, h: 0.9, short: true }, { at: [1104, 572], kind: 'post', y: BATTLE_TOP + 0.35, h: 0.9, short: true },
      { at: [1458, 396], kind: 'pillar', y: LANDING_E, h: 1.3 },
      { at: [1177, 629], kind: 'post', y: ground(1177, 636) + 0.85, h: 1.0, short: true },
    ],
    // small things on the yard's level: barrels and crates by the walls and round the work, the forge's two anvils
    props: BARRELS.map(([x, y]) => ({ k: 'barrel', at: [x, y] })).concat(CRATES.map(([x, y]) => ({ k: 'crates', at: [x, y] })), [
      { k: 'anvil', at: [1136, 330] }, { k: 'anvil', at: [1232, 332] },
    ]),
    flowers: [],
    // more warm light over the yard, as the painting has it (the lamps', lanterns', windows' and fires' own are added)
    lights: [[764, 470, 160, 0.4, 'warm'], [764, 260, 140, 0.3, 'warm'], [1180, 540, 110, 0.45, 'warm'], [560, 420, 130, 0.4, 'warm'], [980, 460, 130, 0.4, 'warm'],
      [440, 500, 120, 0.35, 'warm'], [1000, 230, 110, 0.3, 'warm'], [520, 230, 110, 0.3, 'warm'], [1300, 380, 110, 0.35, 'warm'], [1420, 560, 120, 0.35, 'warm'], [280, 600, 100, 0.35, 'warm'],
      [686, 330, 110, 0.35, 'warm'], [842, 330, 110, 0.35, 'warm'], [686, 180, 90, 0.3, 'warm'], [842, 180, 90, 0.3, 'warm']],
    trees: 'shipyard',
    // ground past the 2D walk: the yard itself (cobbled, walkable round everything that stands in it), the court behind the
    // upper house and its stair (a pocket), the lower quay, the east landing, the bridge's deck between its parapets, the
    // landing below the west water stair (the float past the west dock, the other pocket, is a deck)
    walkAdd: [
      { poly: YARD, ground: 'cob' }, { poly: COURT, ground: 'cob' }, { poly: [[110, 290], [160, 290], [160, 352], [110, 352]], ground: 'cob' },
      { poly: LOWQ, ground: 'cob' }, { poly: [[1396, 356], [1460, 356], [1460, 420], [1396, 420]], ground: 'cob' },
      { poly: [[704, 686], [822, 686], [822, 1024], [704, 1024]], ground: 'cob' }, { poly: [[1119, 612], [1166, 612], [1166, 646], [1119, 646]], ground: 'cob' },
    ],
    // the keepsake that lies here: the Dockhand's Gloves, at the end of the west dock, down in the cove: in 3D on the float
    // tied up past the dock's end, behind the big chained post
    items: { 'dockhand-gloves': [102, 650] },
    // the snowy pines on the cliffs, as the painting has them
    extraTrees: PINES,
    extra(K) { buildExtra(K); },
  };

  // ======================================================================================================================
  // what the engine has no field for
  function buildExtra(K) {
    const { B, X, Z, TAU } = K;
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    const R = rnd(41);
    const T = (px, py) => K.terrain(px, py);
    const WOOD = [0.62, 0.5, 0.44], DARKWOOD = [0.5, 0.4, 0.36], CRADLE = [0.82, 0.64, 0.5], ROPE = [1.25, 1.05, 0.78], STONE = [0.95, 0.95, 1.0];
    // a box between pixel corners, from y0 to y1 metres
    const bx = (k, x0, y0, x1, y1, ya, yb, col, opt) => B.box(k, (X(x0) + X(x1)) / 2, ya, (Z(y0) + Z(y1)) / 2, X(x1) - X(x0), yb - ya, Z(y1) - Z(y0), 0, col, opt);
    const block = (x0, y0, x1, y1) => K.addBlock([[x0, y0], [x1, y0], [x1, y1], [x0, y1]]);
    // a triangle facing n (both windings worked out here)
    const faceTri = (k, a, b, c, n, col) => {
      const e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], e2 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
      const nn = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
      if (nn[0] * n[0] + nn[1] * n[1] + nn[2] * n[2] < 0) B.tri(k, a, c, b, [[0, 0], [0, 1], [1, 0]], col); else B.tri(k, a, b, c, [[0, 0], [1, 0], [0, 1]], col);
    };
    // a round beam from a to b (metres): posts, braces, jibs
    const beamG = new THREE.CylinderGeometry(1, 1, 1, 6, 1, true); beamG.translate(0, 0.5, 0);
    const beam = (k, a, b, r, col) => { const d = V(b[0] - a[0], b[1] - a[1], b[2] - a[2]), L = d.length(); const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), d.normalize()); B.geom(k, beamG, new THREE.Matrix4().compose(V(a[0], a[1], a[2]), q, V(r, L, r)), col, [1, L]); };
    // a square timber from a to b (metres), w across
    const timber = (a, b, w, col) => { const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], L = Math.hypot(dx, dy, dz); const g = new THREE.BoxGeometry(w, L, w); g.translate(0, L / 2, 0); const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), V(dx / L, dy / L, dz / L)); B.geom('wood', g, new THREE.Matrix4().compose(V(a[0], a[1], a[2]), q, V(1, 1, 1)), col || WOOD, [1, L]); g.dispose(); };
    const P3 = (px, py, y) => [X(px), y, Z(py)];
    const CENTRE = [X(764), Z(350)];
    const lantern = (px, py, y, size) => { K.lantern(X(px), y, Z(py), null, size || 1.0); };
    const wallLantern = (px, py, n, y, light) => { const x = X(px) + n[0] * 0.32, z = Z(py) + n[1] * 0.32; K.lantern(x, y, z, [n[0], 0, n[1]], 0.9); K.light(px + n[0] * 20, py + n[1] * 20, light || 100, 0.85, 'warm'); };
    // an iron lamp post with its lantern, as the engine builds them, for the lamps off the walking map's own
    const lampPost = (px, py, y, h) => { const x = X(px), z = Z(py), hh = h || 3.0; B.box('iron', x, y, z, 0.26, 0.3, 0.26, 0); B.cyl('iron', x, y + 0.3, z, 0.06, 0.045, hh - 0.3, 6); B.box('iron', x, y + hh - 0.06, z, 0.3, 0.06, 0.06, 0); K.lantern(x, y + hh + 0.02, z, null, 1.1); K.light(px, py - 4, 150, 1.2, 'warm'); K.addBlock(K.circlePx(px, py, 0.22, 8)); };
    // a barrel and a crate, standing at y
    const barrel = (px, py, y, col) => { const x = X(px), z = Z(py); B.cyl('wood', x, y, z, 0.33, 0.33, 0.9, 10, col || [0.75, 0.55, 0.42], [2.1, 0.9]); B.cyl('iron', x, y + 0.15, z, 0.345, 0.345, 0.06, 10, null, null, true); B.cyl('iron', x, y + 0.7, z, 0.345, 0.345, 0.06, 10, null, null, true); K.shadeMarks.push(['dot', px, py, 14, 0.7]); };
    const crate = (px, py, y, s, rot, col) => { B.box('wood', X(px), y, Z(py), s, s * 0.8, s * 0.9, rot || 0, col || [0.85, 0.7, 0.55]); K.shadeMarks.push(['dot', px, py, s * 22, 0.72]); };
    // a coil of rope lying flat
    const coil = (x, y, z, rr) => { [1, 0.7].forEach((k, i) => { const g = new THREE.TorusGeometry(rr * k, 0.045, 4, 10); g.rotateX(Math.PI / 2); B.geom('wood', g, new THREE.Matrix4().makeTranslation(x, y + 0.045 + i * 0.07, z), ROPE, [1, 0.3]); g.dispose(); }); };
    // a sagging chain or rope between two points (metres): not solid
    const sag = (a, b, drop, r, k, col) => { const was = B.solid; B.solid = false; const c = new THREE.QuadraticBezierCurve3(V(...a), V((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - drop, (a[2] + b[2]) / 2), V(...b)); const tube = new THREE.TubeGeometry(c, 10, r, 4, false); B.geom(k || 'iron', tube, new THREE.Matrix4(), col || [1.4, 1.4, 1.6], 1); tube.dispose(); B.solid = was; };

    // ---- the curtain walls and the battlement: merlons on their outer edge, snow lying on their tops ----
    const wallFrame = (pts, t) => {
      const ax = X(pts[0][0]), az = Z(pts[0][1]), bx_ = X(pts[1][0]), bz = Z(pts[1][1]), dx = bx_ - ax, dz = bz - az, L = Math.hypot(dx, dz);
      let n = [dz / L, -dx / L]; const mx = (ax + bx_) / 2 - CENTRE[0], mz = (az + bz) / 2 - CENTRE[1]; if (n[0] * mx + n[1] * mz < 0) n = [-n[0], -n[1]];
      return { ax, az, dx: dx / L, dz: dz / L, L, ry: Math.atan2(-dz, dx), n, t };
    };
    const merlons = (f, top, size) => {
      const s = size || 1, m = Math.max(1, Math.floor(f.L / (1.25 * s)));
      for (let j = 0; j < m; j++) {
        const u = f.L * (j + 0.5) / m, off = f.t / 2 - 0.24 * s, x = f.ax + f.dx * u + f.n[0] * off, z = f.az + f.dz * u + f.n[1] * off;
        B.box('dry', x, top, z, 0.66 * s, 0.72 * s, 0.44 * s, f.ry, [0.92, 0.92, 0.98]);
        B.box('snow', x, top + 0.72 * s, z, 0.7 * s, 0.09, 0.48 * s, f.ry, null, { solid: false });
      }
      // the snow on the walk along the top, behind the merlons
      B.box('snow', f.ax + f.dx * f.L / 2 - f.n[0] * 0.18, top, f.az + f.dz * f.L / 2 - f.n[1] * 0.18, f.L, 0.06, f.t - 0.5, f.ry, null, { solid: false });
    };
    for (const w of CURTAIN) merlons(wallFrame(w.pts, w.t), WALL_TOP);
    for (const w of BATTLE) merlons(wallFrame(w.pts, w.t), BATTLE_TOP, 0.85);

    // ---- the towers along the walls: square, merlons round the top, a fire basket burning on each ----
    const brazier = (x, y, z, px, py) => {
      for (let i = 0; i < 3; i++) { const a = i / 3 * TAU; B.box('iron', x + Math.cos(a) * 0.22, y, z + Math.sin(a) * 0.22, 0.05, 0.42, 0.05, a); }
      B.cyl('iron', x, y + 0.4, z, 0.2, 0.42, 0.32, 9, null, null, true);
      B.box('glass', x, y + 0.55, z, 0.42, 0.22, 0.42, 0.3, [2.0, 0.8, 0.25]);
      B.box('glass', x, y + 0.66, z, 0.26, 0.42, 0.26, 1.0, [2.2, 1.1, 0.35]); B.box('glass', x + 0.08, y + 0.76, z - 0.04, 0.14, 0.38, 0.14, 0.4, [2.4, 1.6, 0.6]);
      K.halo(x, y + 0.85, z, 2.4, [1.0, 0.55, 0.22]); K.lamps3d.push({ x, y: y + 0.8, z, c: 0xff8a40, k: 1.6 });
      K.light(px, py, 150, 0.9, 'forge');
    };
    const tower = (x0, y0, x1, y1, top, fire, lightAt) => {
      const cx = (X(x0) + X(x1)) / 2, cz = (Z(y0) + Z(y1)) / 2, w = X(x1) - X(x0), d = Z(y1) - Z(y0);
      B.box('dry', cx, -3.2, cz, w, top + 3.2, d, 0, STONE);
      B.box('dry', cx, top - 0.05, cz, w + 0.18, 0.16, d + 0.18, 0, [0.8, 0.8, 0.86]);
      B.box('snow', cx, top + 0.11, cz, w - 0.3, 0.05, d - 0.3, 0, null, { solid: false });
      const side = (ax, az, bx_, bz, nx, nz) => { const L = Math.hypot(bx_ - ax, bz - az), m = Math.max(2, Math.round(L / 0.95)), ry = Math.atan2(-(bz - az), bx_ - ax);
        for (let j = 0; j < m; j++) { const s = (j + 0.5) / m, x = ax + (bx_ - ax) * s - nx * 0.2, z = az + (bz - az) * s - nz * 0.2; B.box('dry', x, top + 0.11, z, 0.5, 0.66, 0.36, ry, [0.92, 0.92, 0.98]); B.box('snow', x, top + 0.77, z, 0.54, 0.08, 0.4, ry, null, { solid: false }); } };
      const xa = cx - w / 2, xb = cx + w / 2, za = cz - d / 2, zb = cz + d / 2;
      side(xa, za, xb, za, 0, -1); side(xa, zb, xb, zb, 0, 1); side(xa, za, xa, zb, -1, 0); side(xb, za, xb, zb, 1, 0);
      if (fire) brazier(cx, top + 0.11, cz, lightAt ? lightAt[0] : (x0 + x1) / 2, lightAt ? lightAt[1] : y1 + 24);
      K.shadeMarks.push(['rect', x0, y0, x1, y1, 0.62]);
    };
    const TT = WALL_TOP + 1.7;
    tower(122, 70, 174, 126, TT + 0.3, true, [160, 150]);        // the north-west corner
    tower(48, 146, 102, 200, TT, true, [120, 200]);              // the west tower, over the court
    tower(514, 68, 566, 124, TT, true);                           // the north wall's three towers
    tower(898, 68, 950, 124, TT, true);
    tower(1228, 70, 1280, 126, TT, true);
    tower(1360, 124, 1412, 176, TT, true, [1360, 200]);           // the north-east tower
    tower(1452, 188, 1504, 240, TT + 0.3, true, [1440, 250]);     // the east corner

    // ---- the banners: navy cloth with a gold sun, swallow-tailed, on the north wall, its towers and the gatehouse ----
    const NAVY = [0.3, 0.55, 2.1], GOLD = [17, 13.5, 1.6];
    const banner = (x, z, n, top, w, h) => {
      const t = [n[1], -n[0]], c = [x + n[0] * 0.07, z + n[1] * 0.07], ry = Math.atan2(-t[1], t[0]), y0 = top - h, n3 = [n[0], 0, n[1]];
      B.box('iron', c[0], y0, c[1], w, h, 0.03, ry, NAVY, { solid: false });
      // the swallow tail: two points hanging below
      const L = [c[0] - t[0] * w / 2, y0, c[1] - t[1] * w / 2], Rr = [c[0] + t[0] * w / 2, y0, c[1] + t[1] * w / 2], M = [c[0], y0 + w * 0.22, c[1]];
      const tl = [c[0] - t[0] * w / 2, y0 - w * 0.4, c[1] - t[1] * w / 2], tr = [c[0] + t[0] * w / 2, y0 - w * 0.4, c[1] + t[1] * w / 2];
      for (const nn of [n3, [-n[0], 0, -n[1]]]) { faceTri('iron', L, M, tl, nn, NAVY); faceTri('iron', M, Rr, tr, nn, NAVY); faceTri('iron', L, [c[0], y0, c[1]], M, nn, NAVY); faceTri('iron', [c[0], y0, c[1]], Rr, M, nn, NAVY); }
      // gold trim along the bottom edges and the rod
      B.box('iron', c[0], top, c[1], w + 0.25, 0.06, 0.06, ry, [1.4, 1.2, 1.0], { solid: false });
      B.box('iron', c[0] + n[0] * 0.02, top - 0.12, c[1] + n[1] * 0.02, w, 0.05, 0.01, ry, GOLD, { solid: false });
      // the sun: a star of sixteen points
      const sc = [c[0] + n[0] * 0.025, top - h * 0.45, c[1] + n[1] * 0.025], R1 = w * 0.32, R2 = w * 0.2;
      for (let i = 0; i < 16; i++) {
        const a0 = i / 16 * TAU, a1 = (i + 1) / 16 * TAU, r0 = i % 2 ? R2 : R1, r1 = (i + 1) % 2 ? R2 : R1;
        const p = (a, r) => [sc[0] + t[0] * Math.cos(a) * r, sc[1] + Math.sin(a) * r, sc[2] + t[1] * Math.cos(a) * r];
        faceTri('iron', [sc[0], sc[1], sc[2]], p(a0, r0), p(a1, r1), n3, GOLD);
      }
    };
    banner(X(330), Z(117), [0, 1], 3.1, 1.0, 1.9); banner(X(420), Z(117), [0, 1], 3.1, 1.0, 1.9); banner(X(1050), Z(117), [0, 1], 3.1, 1.0, 1.9);
    banner(X(540), Z(125), [0, 1], 4.6, 1.0, 2.0); banner(X(924), Z(125), [0, 1], 4.6, 1.0, 2.0);

    // ---- the battlement's corner pillars, each with its lamp on top (the lamps are the engine's), and a mounting block ----
    bx('dry', 362, 557, 388, 598, -2.9, BATTLE_TOP + 0.35, STONE); bx('dry', 360, 555, 390, 600, BATTLE_TOP + 0.25, BATTLE_TOP + 0.4, [0.8, 0.8, 0.86]);
    bx('dry', 366, 549, 382, 557, -0.3, 0.42, [0.85, 0.85, 0.9]);
    bx('dry', 1092, 562, 1116, 602, -2.9, BATTLE_TOP + 0.35, STONE); bx('dry', 1090, 560, 1117, 604, BATTLE_TOP + 0.25, BATTLE_TOP + 0.4, [0.8, 0.8, 0.86]);
    bx('dry', 1092, 553, 1108, 562, -0.3, 0.42, [0.85, 0.85, 0.9]);

    // ---- the gatehouse: the wide block through the battlement, the gate's front between two round towers with snowy
    // cone roofs, the arched way through, lanterns either side, banners on the towers ----
    {
      const PX0 = 736, PX1 = 792, SPRING = 2.4, xa = X(PX0), xb = X(PX1), r = (xb - xa) / 2, mid = (xa + xb) / 2;
      // the arch through a block: slices across the way, each from the arch's curve up to `top`, drawn without the faces
      // between them (so a camera inside the masonry sees none of it), their undersides making the vault
      const archBlock = (y0, y1, bot0, top, opt) => {
        const za = Z(y0), zb = Z(y1), N = 17;
        for (let j = 0; j < N; j++) { const x0 = xa + (xb - xa) * j / N, x1 = xa + (xb - xa) * (j + 1) / N, dx = Math.min(Math.abs(x0 - mid), Math.abs(x1 - mid)), bot = bot0 != null ? bot0 : SPRING + Math.sqrt(Math.max(0, r * r - dx * dx)); B.box('dry', (x0 + x1) / 2, bot, (za + zb) / 2, x1 - x0 + 0.004, top - bot, zb - za, 0, STONE, Object.assign({ noSides: true, bottom: bot0 == null }, opt)); }
      };
      // the wide block (the battlement's line), and the front block between the towers
      bx('dry', 612, 557, PX0, 630, -2.9, 5.0, STONE); bx('dry', PX1, 557, 911, 630, -2.9, 5.0, STONE); archBlock(557, 630, null, 5.0, { noFront: true });
      bx('dry', 688, 630, PX0, 684, -2.9, 6.0, STONE); bx('dry', PX1, 630, 836, 684, -2.9, 6.0, STONE); archBlock(630, 684, null, 5.0, { noBack: true, noTop: true });
      bx('dry', PX0, 630, PX1, 684, 5.0, 6.0, STONE);
      bx('dry', 610, 555, 913, 632, 4.95, 5.1, [0.8, 0.8, 0.86]); bx('dry', 686, 628, 838, 686, 5.95, 6.1, [0.8, 0.8, 0.86]);
      // the arches' stone rims on the front and the back
      const archRim = (z, rr) => { const pts = []; for (let j = 0; j <= 16; j++) { const a = Math.PI * j / 16; pts.push(V(mid - Math.cos(a) * rr, SPRING + Math.sin(a) * rr, z)); } const tube = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, 0.14, 5, false); const was = B.solid; B.solid = false; B.geom('dry', tube, new THREE.Matrix4(), [1.05, 1.02, 1.08], 1); B.solid = was; tube.dispose(); };
      archRim(Z(684) + 0.05, r + 0.1); archRim(Z(557) - 0.05, r + 0.1);
      // merlons round the two blocks' tops
      const mrow = (ax, az, bx_, bz, top, n) => { const L = Math.hypot(bx_ - ax, bz - az), m = Math.max(2, Math.round(L / 1.1)), ry = Math.atan2(-(bz - az), bx_ - ax); for (let j = 0; j < m; j++) { const s = (j + 0.5) / m, x = ax + (bx_ - ax) * s + n[0] * -0.2, z = az + (bz - az) * s + n[1] * -0.2; B.box('dry', x, top, z, 0.55, 0.66, 0.36, ry, [0.92, 0.92, 0.98]); B.box('snow', x, top + 0.66, z, 0.6, 0.08, 0.4, ry, null, { solid: false }); } };
      mrow(X(612), Z(557), X(911), Z(557), 5.1, [0, -1]);
      mrow(X(692), Z(684), X(832), Z(684), 6.1, [0, 1]); mrow(X(692), Z(630), X(832), Z(630), 6.1, [0, -1]);
      // the gate's doors, swung back against the way's sides
      for (const [x0, x1] of [[734.4, 736.4], [791.6, 793.6]]) { bx('planks', x0, 646, x1, 682, 0, 3.0, [0.6, 0.48, 0.42]); for (const y of [0.5, 1.5, 2.5]) bx('iron', x0 - 0.3, 648, x1 + 0.3, 680, y, y + 0.1); }
      // the lanterns either side of the arch, and the light under it
      wallLantern(711, 684, [0, 1], 2.5, 120); wallLantern(817, 684, [0, 1], 2.5, 120);
      wallLantern(711, 557, [0, -1], 2.5, 100); wallLantern(817, 557, [0, -1], 2.5, 100);
      K.light(764, 620, 70, 0.55, 'warm');
      // the round towers
      for (const [px, py] of [[650, 652], [873, 652]]) {
        const cx = X(px), cz = Z(py), rr = 1.6, top = 6.7;
        B.cyl('dry', cx, -3.2, cz, rr, rr, top + 3.2, 20, STONE, [TAU * rr, top + 3.2]);
        B.cyl('dry', cx, top - 0.3, cz, rr + 0.15, rr + 0.15, 0.32, 20, [0.82, 0.82, 0.88], [TAU * rr, 0.3]);
        const cone = new THREE.ConeGeometry(rr + 0.32, 3.2, 12, 1, true); cone.translate(0, 1.6, 0);
        B.geom('roof', cone, new THREE.Matrix4().makeTranslation(cx, top + 0.02, cz), [1, 1, 1], [3, 2]); cone.dispose();
        B.cyl('iron', cx, top + 3.1, cz, 0.05, 0.02, 0.7, 5); B.cyl('iron', cx, top + 3.45, cz, 0.12, 0.12, 0.12, 6);
        // the lit window high on its south face, and a dark slit lower down
        const win = (y, w, h, lit) => { const p = [cx, y, cz + rr + 0.02]; B.quad('wood', [p[0] - w / 2 - 0.1, y - 0.1, p[2]], [p[0] + w / 2 + 0.1, y - 0.1, p[2]], [p[0] + w / 2 + 0.1, y + h + 0.1, p[2]], [p[0] - w / 2 - 0.1, y + h + 0.1, p[2]], [0, 0, 1, 1], [0.45, 0.36, 0.32]); B.quad(lit ? 'win' : 'winDark', [p[0] - w / 2, y, p[2] + 0.01], [p[0] + w / 2, y, p[2] + 0.01], [p[0] + w / 2, y + h, p[2] + 0.01], [p[0] - w / 2, y + h, p[2] + 0.01], [0, 0, 1, 1]); if (lit) K.halo(p[0], y + h / 2, p[2] + 0.25, 1.2, [1.0, 0.68, 0.36]); };
        win(5.0, 0.55, 0.85, true); win(1.0, 0.25, 0.7, false);
        banner(cx, cz + rr + 0.02, [0, 1], 4.3, 1.0, 2.3);
        K.shadeMarks.push(['dot', px, py, 46, 0.6]);
      }
    }

    // ---- the bridge: the posts at its head, a lamp pillar on each side, snow along its parapets, and piers under its
    // sides where it goes out over the sea ----
    bx('dry', 701, 723, 715, 741, -0.3, 1.35, STONE); bx('dry', 700, 723, 716, 741, 1.3, 1.45, [0.8, 0.8, 0.86]); B.box('snow', X(708), 1.45, Z(732), 0.6, 0.06, 1.0, 0, null, { solid: false });
    bx('dry', 809, 723, 823, 741, -0.3, 1.35, STONE); bx('dry', 808, 723, 824, 741, 1.3, 1.45, [0.8, 0.8, 0.86]); B.box('snow', X(816), 1.45, Z(732), 0.6, 0.06, 1.0, 0, null, { solid: false });
    for (const [px, side] of [[688, -1], [838, 1]]) {
      const py = 905;
      bx('dry', px - 10, py - 9, px + 10, py + 9, -2.9, 1.45, STONE); bx('dry', px - 12, py - 11, px + 12, py + 11, 1.42, 1.58, [0.8, 0.8, 0.86]);
      lantern(px, py, 1.75, 1.15); K.light(px - side * 30, py, 150, 1.2, 'warm'); K.addBlock(K.circlePx(px, py, 0.45, 8));
    }
    for (const px of [697, 829]) B.box('snow', X(px), 0.85, (Z(690) + Z(EXT[3])) / 2, 0.42, 0.05, Z(EXT[3]) - Z(690), 0, null, { solid: false });
    for (let py = 1000; py < EXT[3] - 40; py += 150) for (const px of [684, 842]) bx('dry', px - 8, py - 22, px + 8, py + 22, BED, 0.2, [0.85, 0.85, 0.9]);
    // lamp pillars on along the bridge past the painting, every forty metres
    for (const py of [1300, 1650]) for (const px of [688, 838]) { bx('dry', px - 10, py - 9, px + 10, py + 9, -2.9, 1.45, STONE); lantern(px, py, 1.75, 1.15); K.light(px, py, 140, 1.0, 'warm'); }

    // ---- the slip: the ramp's edge timbers and its two iron rails (the ramp is the Magpie's berth: nothing stands on it),
    // the cradle's two frames of posts and beams either side, the great curved arms, the crossbeams over the ramp ----
    {
      const was = B.solid; B.solid = false;
      for (const [x0, x1, y0, y1] of [[729, 799, 158, 346], [736, 790, 346, 470], [713, 813, 128, 158]]) {
        bx('wood', x0 - 3, y0, x0, y1, -0.05, 0.27, DARKWOOD); bx('wood', x1, y0, x1 + 3, y1, -0.05, 0.27, DARKWOOD);
      }
      for (const px of [748, 780]) bx('iron', px - 1, 160, px + 1, 468, 0.25, 0.3, [1.3, 1.3, 1.45]);
      B.solid = was;
      const STN = [172, 224, 276, 318, 346, 398, 448];
      for (const side of [-1, 1]) {
        const xi = side < 0 ? 718 : 810, xo = side < 0 ? 658 : 870, hi = 3.6, ho = 4.6;
        for (const py of STN) {
          bx('wood', xi - 3, py - 3, xi + 3, py + 3, -0.2, hi, CRADLE); bx('wood', xo - 3, py - 3, xo + 3, py + 3, -0.2, ho, CRADLE);
          timber(P3(xi, py, hi - 0.25), P3(xo, py, ho - 0.25), 0.2); timber(P3(xi, py, 1.9), P3(xo, py, 1.9), 0.16);
        }
        // beams along each row's top, and braces between the stations
        bx('wood', xi - 3, STN[0] - 3, xi + 3, STN[STN.length - 1] + 3, hi - 0.26, hi - 0.02, CRADLE);
        bx('wood', xo - 3, STN[0] - 3, xo + 3, STN[STN.length - 1] + 3, ho - 0.26, ho - 0.02, CRADLE);
        for (let i = 0; i < STN.length - 1; i++) { if (STN[i + 1] - STN[i] < 40) continue; timber(P3(xo, STN[i], 0.3), P3(xo, STN[i + 1], ho - 0.6), 0.14); timber(P3(xi, STN[i + 1], 0.3), P3(xi, STN[i], hi - 0.6), 0.14); }
        // scaffold planks at two heights between the rows, and a ladder up the outer row
        for (const [ya, yb, h] of [[224, 276, 1.95], [398, 448, 1.95]]) { const xm = (xi + xo) / 2; bx('planks', xm - 14, ya, xm + 14, yb, h, h + 0.06, [0.85, 0.74, 0.64], { solid: false }); }
        const lx = xo + side * 6;
        for (const dy of [-6, 6]) bx('wood', lx - 1.5, 372 + dy - 1, lx + 1.5, 372 + dy + 1, -0.1, 4.0, DARKWOOD);
        for (let h = 0.4; h < 4.0; h += 0.35) bx('wood', lx - 1.2, 365, lx + 1.2, 379, h, h + 0.05, DARKWOOD, { solid: false });
        // the great curved arms, sweeping up from the ramp's edge and out, as if round a hull
        const curve = (pts, rad) => { const c = new THREE.CatmullRomCurve3(pts.map(([px, py, y]) => V(X(px), y, Z(py)))); const tube = new THREE.TubeGeometry(c, 24, rad, 6, false); B.geom('wood', tube, new THREE.Matrix4(), [0.9, 0.7, 0.55], [1, 1]); tube.dispose(); };
        const m = (x) => 764 + side * (x - 764) * -1;   // mirror west to east
        const W1 = [[724, 452, 0.4], [704, 390, 1.5], [690, 310, 2.6], [694, 240, 3.3], [712, 182, 3.6]];
        const W2 = [[726, 444, 0.3], [714, 380, 1.0], [706, 310, 1.6], [708, 240, 2.1], [722, 186, 2.3]];
        const fix = (pts) => side < 0 ? pts : pts.map(([x, y, h]) => [m(x), y, h]);
        curve(fix(W1), 0.2); curve(fix(W2), 0.15);
        // the ribs across, at each station: from the inner post's top curving out to the outer post
        for (const py of [224, 276, 398]) { const a = side < 0 ? 718 : 810, b = side < 0 ? 690 : 838; curve([[a, py, 0.6], [b + side * 6, py, 1.8], [side < 0 ? 664 : 864, py, 3.6]], 0.1); }
        K.shadeMarks.push(['rect', side < 0 ? 652 : 806, 166, side < 0 ? 722 : 876, 454, 0.6]);
      }
      // the two crossbeams over the ramp, high enough to walk under
      for (const py of [318, 346]) bx('wood', 712, py - 5, 816, py + 5, 3.35, 3.68, DARKWOOD);
    }

    // ---- the yard's cranes: a wheeled timber base, a tall mast, a long jib, its chain and hook ----
    const crane = (px, py, tip, mastH, base, rot) => {
      const x = X(px), z = Z(py), c = Math.cos(rot), s = Math.sin(rot), L = (lx, lz) => [x + lx * c + lz * s, z - lx * s + lz * c];
      const bw = base[0], bd = base[1];
      // the base, on four iron wheels
      B.box('wood', x, 0.45, z, bw, 0.4, bd, rot, WOOD);
      for (const [lx, lz] of [[-bw / 2 + 0.35, -bd / 2 - 0.08], [bw / 2 - 0.35, -bd / 2 - 0.08], [-bw / 2 + 0.35, bd / 2 + 0.08], [bw / 2 - 0.35, bd / 2 + 0.08]]) {
        const p = L(lx, lz), wg = new THREE.CylinderGeometry(0.42, 0.42, 0.14, 12); wg.rotateX(Math.PI / 2); wg.rotateY(rot);
        B.geom('iron', wg, new THREE.Matrix4().makeTranslation(p[0], 0.42, p[1]), [1.1, 1.1, 1.2], 1); wg.dispose();
      }
      // the mast: two posts with ties, the winch drum between them
      const m0 = L(-0.3, 0), m1 = L(0.3, 0);
      for (const m_ of [m0, m1]) B.box('wood', m_[0], 0.8, m_[1], 0.26, mastH, 0.3, rot, WOOD);
      for (let h = 1.6; h < mastH; h += 1.3) B.box('wood', x, 0.8 + h, z, 0.86, 0.12, 0.2, rot, DARKWOOD, { solid: false });
      const drum = new THREE.CylinderGeometry(0.42, 0.42, 0.62, 12); drum.rotateZ(Math.PI / 2); drum.rotateY(rot);
      B.geom('wood', drum, new THREE.Matrix4().makeTranslation(x, 1.75, z), [0.78, 0.62, 0.5], 1); drum.dispose();
      const sp = new THREE.CylinderGeometry(0.62, 0.62, 0.06, 14); sp.rotateZ(Math.PI / 2); sp.rotateY(rot);
      for (const lx of [-0.34, 0.34]) { const p = L(lx, 0.05); B.geom('iron', sp, new THREE.Matrix4().makeTranslation(p[0], 1.75, p[1]), null, 1); }
      sp.dispose();
      // the counterweight at the back, the jib and its stay, the chain and the hook
      const back = L(0, bd / 2 - 0.4); B.box('stone', back[0], 0.85, back[1], 1.0, 0.8, 0.7, rot, [0.75, 0.72, 0.75]);
      const was = B.solid; B.solid = false;
      const foot = [x, 0.8 + mastH * 0.62, z], top = [x, 0.8 + mastH, z], T3 = [X(tip[0]), tip[2], Z(tip[1])];
      beam('wood', foot, T3, 0.17, [0.66, 0.52, 0.44]); beam('wood', [foot[0], foot[1] - 0.6, foot[2]], [T3[0], T3[1] - 0.5, T3[2]], 0.09, DARKWOOD);
      beam('iron', top, T3, 0.025, [1.2, 1.2, 1.3]);
      const hookY = tip[3];
      beam('iron', T3, [T3[0], hookY + 0.35, T3[2]], 0.035, [1.3, 1.3, 1.45]);
      B.box('iron', T3[0], hookY + 0.1, T3[2], 0.3, 0.3, 0.2, 0, [1.2, 1.2, 1.3]);
      const hook = new THREE.TorusGeometry(0.17, 0.04, 5, 10, Math.PI * 1.4); B.geom('iron', hook, new THREE.Matrix4().makeTranslation(T3[0], hookY - 0.1, T3[2]), [1.4, 1.4, 1.5], 1); hook.dispose();
      B.solid = was;
      K.shadeMarks.push(['dot', px, py, 46, 0.62]);
    };
    crane(566, 214, [652, 138, 8.3, 4.6], 6.4, [2.6, 3.2], 0);       // the north-west crane, its jib out over the cradle's head
    crane(1016, 192, [928, 132, 8.3, 4.8], 6.4, [2.6, 3.2], 0);      // the north-east crane
    crane(1398, 630, [1476, 600, 6.0, 1.95], 4.6, [2.4, 1.6], 0);    // the crane on the east quay

    // ---- the scaffold towers, an A-frame, the timber stacks, the workbench ----
    const lattice = (x0, y0, x1, y1, h) => {
      const c = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
      for (const [px, py] of c) bx('wood', px - 2, py - 2, px + 2, py + 2, -0.1, h, WOOD);
      const was = B.solid; B.solid = false;
      for (let y = 0.9; y < h; y += 0.9) for (let i = 0; i < 4; i++) { const a = c[i], b = c[(i + 1) % 4]; timber(P3(a[0], a[1], y), P3(b[0], b[1], y), 0.1, DARKWOOD); }
      for (let y = 0; y + 0.9 < h; y += 0.9) for (let i = 0; i < 4; i++) { const a = c[i], b = c[(i + 1) % 4]; timber(P3(a[0], a[1], y + 0.05), P3(b[0], b[1], y + 0.85), 0.07, DARKWOOD); }
      B.solid = was;
      bx('planks', x0 - 3, y0 - 3, x1 + 3, y1 + 3, h, h + 0.08, [0.8, 0.7, 0.62]);
      K.addBlock([[x0 - 2, y0 - 2], [x1 + 2, y0 - 2], [x1 + 2, y1 + 2], [x0 - 2, y1 + 2]]);
      K.shadeMarks.push(['rect', x0, y0, x1, y1, 0.65]);
    };
    lattice(602, 172, 624, 200, 4.2); lattice(932, 200, 954, 226, 3.6); lattice(1336, 182, 1358, 210, 4.4);
    // the A-frame by the north-west crane, a beam slung under it
    { const was = B.solid; B.solid = false; for (const dz of [-0.5, 0.5]) { timber(P3(608, 266, 0) .map((v, i) => i === 2 ? v + dz : v), [X(620), 2.4, Z(266) + dz], 0.12); timber([X(632), 0, Z(266) + dz], [X(620), 2.4, Z(266) + dz], 0.12); } bx('wood', 618, 256, 622, 276, 2.3, 2.45, DARKWOOD); B.solid = was; K.addBlock([[605, 254], [635, 254], [635, 278], [605, 278]]); }
    // the log pile on its trestles, logs lying north to south
    {
      const log = new THREE.CylinderGeometry(0.17, 0.17, 1, 7); log.rotateX(Math.PI / 2);
      for (const py of [300, 360]) { bx('wood', 896, py - 3, 964, py + 3, 0.0, 0.5, DARKWOOD); }
      for (let row = 0; row < 4; row++) for (let i = 0; i < 7 - row; i++) {
        const x = X(901) + 0.18 + row * 0.18 + i * 0.36, y = 0.68 + row * 0.31, len = Z(370) - Z(290) + (R() - 0.5) * 0.4;
        B.geom('wood', log, new THREE.Matrix4().compose(V(x, y, (Z(290) + Z(370)) / 2), new THREE.Quaternion(), V(1, 1, len)), [0.78 + R() * 0.12, 0.6, 0.46], [1, len]);
      }
      log.dispose(); block(894, 288, 966, 372); K.shadeMarks.push(['rect', 896, 290, 964, 370, 0.6]);
    }
    // the timber rack: planks leaning on a crossbar, and crates beside it
    {
      for (const px of [986, 1014]) bx('wood', px - 2, 294, px + 2, 298, -0.1, 2.6, WOOD);
      bx('wood', 984, 294, 1016, 298, 2.4, 2.55, DARKWOOD);
      for (let i = 0; i < 8; i++) { const px = 988 + i * 3.6; timber([X(px), 0, Z(316)], [X(px + 1), 2.5, Z(298)], 0.12, [0.72 + R() * 0.12, 0.58, 0.46]); }
      block(982, 292, 1018, 318);
      crate(996, 340, 0, 0.9, 0.1); crate(1010, 344, 0, 0.75, -0.2); crate(1002, 338, 0.72, 0.6, 0.3);
      block(986, 330, 1018, 354);
    }
    // timber on trestles south of the log pile: beams lying east to west
    {
      for (const px of [906, 962]) bx('wood', px - 3, 384, px + 3, 424, 0, 0.7, DARKWOOD);
      for (let row = 0; row < 3; row++) for (let i = 0; i < 4; i++) bx('wood', 898, 386 + i * 9, 970, 386 + i * 9 + 7, 0.7 + row * 0.2, 0.88 + row * 0.2, [0.78 + R() * 0.1, 0.62, 0.5]);
      block(896, 382, 972, 424);
      barrel(918, 438, 0); barrel(938, 440, 0); crate(956, 436, 0, 0.7, 0.2);
    }
    // the workbench, its vice and tools, a grindstone and a saw-horse with a beam on it
    {
      const tx = X(602), tz = Z(300);
      B.box('wood', tx, 0.82, tz, 2.4, 0.1, 0.9, 0, [0.85, 0.66, 0.52]);
      for (const [dx, dz] of [[-1.1, -0.38], [1.1, -0.38], [-1.1, 0.38], [1.1, 0.38]]) B.box('wood', tx + dx, 0, tz + dz, 0.1, 0.82, 0.1, 0, DARKWOOD);
      B.box('wood', tx, 0.22, tz, 2.2, 0.05, 0.8, 0, DARKWOOD);
      B.box('iron', tx - 0.8, 0.92, tz, 0.2, 0.16, 0.2, 0); for (let i = 0; i < 5; i++) B.box('iron', tx - 0.2 + i * 0.2, 0.92, tz - 0.2, 0.05, 0.03, 0.35, 0.2 * i);
      for (let i = 0; i < 6; i++) B.box('iron', tx - 0.6 + i * 0.25, 1.1, tz - 0.42, 0.05, 0.6, 0.03, 0, null, { solid: false });
      B.box('wood', tx, 0.9, tz - 0.45, 2.4, 1.0, 0.05, 0, DARKWOOD);
      const gx = X(630), gz = Z(320);
      for (const dx of [-0.3, 0.3]) B.box('wood', gx + dx, 0, gz, 0.1, 0.75, 0.5, 0, DARKWOOD);
      const wheel = new THREE.CylinderGeometry(0.45, 0.45, 0.16, 16); wheel.rotateZ(Math.PI / 2); B.geom('stone', wheel, new THREE.Matrix4().makeTranslation(gx, 0.82, gz), [1.0, 0.95, 0.9], 1); wheel.dispose();
      for (const dz of [-0.5, 0.5]) { B.box('wood', X(588), 0, Z(338) + dz, 0.1, 0.7, 0.1, 0.4, DARKWOOD); B.box('wood', X(612), 0, Z(338) + dz, 0.1, 0.7, 0.1, -0.4, DARKWOOD); }
      bx('wood', 582, 336, 618, 340, 0.68, 0.84, [0.8, 0.64, 0.5]);
      barrel(580, 300, 0); crate(640, 296, 0, 0.8, 0.1);
      block(574, 282, 646, 352); K.shadeMarks.push(['rect', 576, 286, 640, 348, 0.65]);
    }

    // ---- the forge: the inner faces of its open sheds, the two hearths with their fires, the chimney's hood, the log
    // shed's stacked logs ----
    {
      const inner = (x0, y0, x1, y1, h, col) => {
        const a = X(x0), b = X(x1), c = Z(y0), d = Z(y1);
        B.quad('stone', [a, -0.3, c + 0.02], [b, -0.3, c + 0.02], [b, h, c + 0.02], [a, h, c + 0.02], [a, -0.3, b, h], col);
        B.quad('stone', [a + 0.02, -0.3, d], [a + 0.02, -0.3, c], [a + 0.02, h, c], [a + 0.02, h, d], [d, -0.3, c, h], col);
        B.quad('stone', [b - 0.02, -0.3, c], [b - 0.02, -0.3, d], [b - 0.02, h, d], [b - 0.02, h, c], [c, -0.3, d, h], col);
      };
      inner(1100, 198, 1205, 344, 3.0, [0.6, 0.56, 0.56]); inner(1205, 178, 1300, 346, 3.0, [0.6, 0.56, 0.56]);
      // the open shed's hearth: a stone block, its fire, the iron hood over it
      const hx = X(1152), hz = Z(296);
      B.box('stone', hx, 0, hz, 1.6, 0.85, 1.1, 0, [0.85, 0.8, 0.8]);
      B.box('glass', hx, 0.85, hz, 0.9, 0.12, 0.6, 0, [1.8, 0.6, 0.18]); B.box('glass', hx - 0.1, 0.92, hz, 0.4, 0.22, 0.3, 0.4, [2.2, 1.0, 0.3]);
      B.box('iron', hx, 2.2, hz, 1.3, 0.5, 0.9, 0); B.box('iron', hx, 2.7, hz - 0.2, 0.5, 2.0, 0.5, 0);
      K.halo(hx, 1.2, hz + 0.3, 2.6, [1.0, 0.52, 0.22]); K.lamps3d.push({ x: hx, y: 1.2, z: hz + 0.6, c: 0xff7a30, k: 1.8 });
      K.light(1152, 330, 150, 1.4, 'forge');
      // the forge's great hearth: a stone forge with an arched fire mouth, its hood up into the chimney
      const fx = X(1250), fz = Z(296);
      B.box('stone', fx, 0, fz, 2.2, 1.1, 1.4, 0, [0.9, 0.86, 0.86]);
      B.box('stone', fx, 1.1, fz - 0.1, 2.0, 1.3, 1.2, 0, [0.88, 0.84, 0.86]);
      B.box('stone', fx, 2.4, fz - 0.25, 1.4, 3.2, 0.9, 0, [0.88, 0.84, 0.86]);
      B.quad('glass', [fx - 0.6, 1.1, fz + 0.51], [fx + 0.6, 1.1, fz + 0.51], [fx + 0.6, 2.0, fz + 0.51], [fx - 0.6, 2.0, fz + 0.51], [0, 0, 1, 1], [0.6, 0.18, 0.06]);
      B.box('glass', fx, 1.12, fz + 0.3, 1.0, 0.2, 0.42, 0, [2.0, 0.85, 0.28]); B.box('glass', fx + 0.2, 1.2, fz + 0.4, 0.4, 0.25, 0.2, 0.5, [2.4, 1.3, 0.45]);
      K.halo(fx, 1.5, fz + 0.9, 3.4, [1.0, 0.5, 0.2]); K.lamps3d.push({ x: fx, y: 1.5, z: fz + 1.2, c: 0xff7a30, k: 2.2 });
      K.light(1250, 336, 180, 1.6, 'forge');
      // a quench barrel, a rack of tongs, a bellows
      barrel(1190, 330, 0, [0.6, 0.48, 0.42]); B.cyl('glass', X(1190), 0.86, Z(330), 0.28, 0.28, 0.02, 10, [0.05, 0.08, 0.14]);
      for (let i = 0; i < 6; i++) B.box('iron', X(1110) + i * 0.3, 1.2 + (i % 2) * 0.15, Z(198) + 0.4, 0.05, 0.8, 0.04, 0, null, { solid: false });
      B.box('wood', X(1276), 0.5, Z(300), 0.7, 0.35, 1.1, 0.2, [0.6, 0.42, 0.34]);
      // the log shed: log ends stacked under its roof
      const log = new THREE.CylinderGeometry(0.15, 0.15, 1, 7); log.rotateX(Math.PI / 2);
      for (let row = 0; row < 6; row++) for (let i = 0; i < 18; i++) {
        const x = X(1312) + 0.17 + i * 0.32 + (row % 2) * 0.16, y = 0.15 + row * 0.27; if (x > X(1444)) continue;
        if (i % 6 === 5 && row > 3) continue;
        B.geom('wood', log, new THREE.Matrix4().compose(V(x, y, (Z(262) + Z(340)) / 2), new THREE.Quaternion(), V(1, 1, Z(340) - Z(262))), [0.82 + R() * 0.14, 0.62 + R() * 0.06, 0.46], [1, 3]);
      }
      log.dispose();
      inner(1300, 252, 1452, 352, 2.3, [0.55, 0.5, 0.48]);
      K.shadeMarks.push(['rect', 1100, 178, 1452, 352, 0.7]);
    }

    // ---- the stair by the bunkhouse, down to the lower quay: stone treads with no cheek on the quay's side ----
    { const st = STAIRS.west2, tt = treadTops(st), [x0, y0, x1, y1] = st.r;
      for (let i = 0; i < st.n; i++) { const ya = y0 + (y1 - y0) * i / st.n, yb = y0 + (y1 - y0) * (i + 1) / st.n; B.box('dry', (X(x0) + X(x1)) / 2, tt[i] - 0.5, (Z(ya) + Z(yb)) / 2, X(x1) - X(x0), 0.5, Z(yb) - Z(ya) + 0.02, 0, [0.95, 0.93, 0.98], { solid: false }); }}

    // ---- the east landing: a stone platform at the top of the east stair, its lamp by the east wall ----
    bx('dry', 1396, 356, 1462, 420, -0.3, LANDING_E, STONE, { solid: false }); bx('dry', 1394, 354, 1462, 422, LANDING_E - 0.08, LANDING_E + 0.02, [0.85, 0.85, 0.9], { solid: false });

    // ---- Pim's cart with its copper boiler, in the corner by the hall's east end ----
    {
      const cx = X(1328), cz = Z(526);
      B.box('wood', cx, 0.55, cz, 1.8, 0.4, 1.1, 0, [0.7, 0.55, 0.45]);
      for (const dz of [-0.62, 0.62]) { const wg = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 12); wg.rotateZ(Math.PI / 2); wg.rotateY(Math.PI / 2); B.geom('wood', wg, new THREE.Matrix4().makeTranslation(cx - 0.3, 0.5, cz + dz), DARKWOOD, 1); wg.dispose(); }
      B.cyl('iron', cx + 0.2, 0.95, cz, 0.42, 0.42, 1.0, 12, [2.6, 1.4, 0.8]); B.cyl('iron', cx + 0.2, 1.95, cz, 0.42, 0.12, 0.3, 12, [2.6, 1.4, 0.8]);
      beam('iron', [cx + 0.2, 2.2, cz], [cx + 0.7, 2.7, cz + 0.2], 0.05, [1.6, 1.0, 0.7]);
      B.box('glass', cx + 0.2, 1.2, cz + 0.43, 0.2, 0.2, 0.02, 0, [1.8, 0.8, 0.3]); K.halo(cx + 0.2, 1.3, cz + 0.6, 0.8, [1.0, 0.6, 0.3]);
      block(1302, 508, 1354, 543);
    }

    // ---- the court behind the upper house (a pocket): its stair's cheek, the crates stacked over the yard at its east
    // end, the old hoist by the west wall, the door in the north wall between two lanterns, crates and barrels ----
    {
      bx('dry', 160, 292, 178, 345, -0.3, COURT_H + 0.3, STONE); bx('dry', 158, 290, 180, 347, COURT_H + 0.28, COURT_H + 0.4, [0.8, 0.8, 0.86]);
      // the retaining wall at the court's east end, and the crates stacked on it
      bx('dry', 418, 119, 424, 150, -0.3, COURT_H + 0.25, STONE);
      crate(410, 126, COURT_H, 1.0, 0.05); crate(410, 142, COURT_H, 0.95, -0.1); crate(409, 133, COURT_H + 0.8, 0.85, 0.15); crate(428, 130, 0, 1.0, 0.1); crate(428, 146, 0, 0.9, -0.05); crate(429, 138, 0.8, 0.8, 0.2);
      block(398, 119, 438, 152);
      // the hoist: two posts and a beam out over the west wall, its rope and a crate hanging over the sea
      const hy = COURT_H;
      for (const py of [244, 272]) bx('wood', 128, py - 3, 134, py + 3, hy - 0.1, hy + 3.4, WOOD);
      bx('wood', 54, 252, 134, 264, hy + 3.3, hy + 3.55, DARKWOOD);
      { const was = B.solid; B.solid = false; timber(P3(131, 244, hy + 2.2), P3(110, 258, hy + 3.3), 0.1); timber(P3(131, 272, hy + 2.2), P3(110, 258, hy + 3.3), 0.1); B.solid = was; }
      { const was = B.solid; B.solid = false; B.cyl('iron', X(60), hy + 3.1, Z(258), 0.12, 0.12, 0.2, 8); beam('iron', [X(60), hy + 3.2, Z(258)], [X(60), hy + 0.2, Z(258)], 0.02, ROPE);
        B.box('wood', X(60), hy - 0.35, Z(258), 0.7, 0.55, 0.6, 0.3, [0.85, 0.7, 0.55]); B.solid = was; }
      block(124, 238, 138, 278);
      crate(122, 206, hy, 0.9, 0.2); crate(138, 200, hy, 0.75, -0.2); barrel(118, 222, hy); barrel(190, 132, hy); barrel(206, 128, hy); crate(232, 134, hy, 0.8, 0.1);
      block(110, 190, 148, 232); block(180, 122, 244, 144);
      // the door in the north wall, and the lanterns either side
      const dz = Z(116.5) + 0.03, dx_ = X(258);
      B.quad('stone', [dx_ - 0.85, hy - 0.2, dz], [dx_ + 0.85, hy - 0.2, dz], [dx_ + 0.85, hy + 2.6, dz], [dx_ - 0.85, hy + 2.6, dz], [0, 0, 1.7, 2.8], [0.8, 0.78, 0.82]);
      B.quad('doorArch', [dx_ - 0.6, hy, dz + 0.01], [dx_ + 0.6, hy, dz + 0.01], [dx_ + 0.6, hy + 2.3, dz + 0.01], [dx_ - 0.6, hy + 2.3, dz + 0.01], [0, 0, 1, 1]);
      bx('dry', 248, 117, 268, 124, hy - 0.3, hy + 0.12, [0.85, 0.85, 0.9]);
      wallLantern(240, 117, [0, 1], hy + 2.1, 90); wallLantern(276, 117, [0, 1], hy + 2.1, 90); wallLantern(394, 117, [0, 1], hy + 2.3, 90);
      K.light(150, 250, 80, 0.45, 'warm');
      // drifts of snow in the court's corners
      for (const [px, py, r] of [[112, 192, 1.4], [170, 124, 1.2], [112, 285, 0.9], [300, 124, 0.9]]) { const g = new THREE.SphereGeometry(1, 10, 5, 0, TAU, 0, Math.PI / 2); B.geom('snow', g, new THREE.Matrix4().compose(V(X(px), hy - 0.02, Z(py)), new THREE.Quaternion(), V(r, 0.28, r * 0.8)), null, 1); g.dispose(); }
    }

    // ---- the terrace: the lamp pillar at its west end, and the stair's rail down to the boat landing ----
    { bx('dry', 78, 346, 94, 360, -0.3, 1.25, STONE); lantern(86, 353, 1.42, 1.0); K.light(110, 365, 120, 1.0, 'warm');
      for (const [py, y] of [[438, 0.9], [459, -1.1]]) bx('wood', 180, py - 2, 184, py + 2, y - 1.0, y, WOOD);
      { const was = B.solid; B.solid = false; timber(P3(182, 438, 0.85), P3(182, 461, -1.15), 0.07); B.solid = was; }
      block(178, 434, 183.5, 461);
    }

    // ---- the west quays: the stone faces down into the cove, the lower quay's bollards, the west dock's posts and its
    // rail, the big chained post, the float past the dock's end (a pocket), the posts round the boat landing ----
    {
      bx('dry', 205, 553, 209, 610, BED, LOWQ_H + 0.02, STONE); bx('dry', 252, 646, 292, 652, BED, LOWQ_H + 0.02, STONE);
      bx('dry', 207, 549, 214, 556, BED, 0.9, STONE);
      for (const py of [570, 598]) { B.cyl('iron', X(212), LOWQ_H, Z(py), 0.17, 0.2, 0.55, 8, [1.1, 1.1, 1.2]); K.addBlock(K.circlePx(212, py, 0.22, 8)); }
      // the dock's posts: bands of rope round them, and the rail along its north edge
      const post = (px, py, top, rr, col) => { const x = X(px), z = Z(py); B.cyl('wood', x, BED, z, rr, rr * 0.93, top - BED, 8, col || [0.78, 0.62, 0.52], [TAU * rr, 0.35]); B.cyl('wood', x, top, z, rr * 0.93, rr * 0.75, 0.06, 8, DARKWOOD); for (const hy of [top - 0.35, top - 0.55]) B.cyl('iron', x, hy, z, rr + 0.03, rr + 0.03, 0.08, 8, [1.0, 1.0, 1.1], null, true); K.addBlock(K.circlePx(px, py, rr + 0.03, 8)); };
      for (const px of [133, 190, 246]) post(px, 611, DOCK_H + 1.05, 0.17);
      bx('wood', 128, 609, 252, 613, DOCK_H + 0.85, DOCK_H + 0.97, DARKWOOD); bx('wood', 128, 609, 252, 613, DOCK_H + 0.42, DOCK_H + 0.5, DARKWOOD, { solid: false });
      block(126, 606, 251, 613.5);
      for (const px of [133, 198, 250]) post(px, 662, DOCK_H + 1.3, 0.24);
      for (let px = 140; px < 252; px += 28) { B.cyl('wood', X(px), BED, Z(636), 0.14, 0.14, DOCK_H - 0.18 - BED, 6, [0.6, 0.48, 0.42]); }
      // the big post at the dock's west end, chained to it
      post(86, 611, DOCK_H + 2.6, 0.3, [0.72, 0.58, 0.5]);
      sag([X(86) + 0.2, DOCK_H + 1.9, Z(611)], [X(133), DOCK_H + 0.9, Z(611)], 0.35, 0.035);
      // crates and nets on the dock's west end, half hiding the float beyond
      crate(131, 621, DOCK_H, 0.62, 0.1); crate(132, 620, DOCK_H + 0.5, 0.48, -0.2); block(126, 613.5, 138.5, 628);
      coil(X(232), DOCK_H, Z(650), 0.3);
      // the float: planks on a raft of barrels, its line to the big post, its gangway down from the dock
      for (const [px, py] of [[92, 634], [122, 634], [92, 662], [122, 662]]) { const g = new THREE.CylinderGeometry(0.32, 0.32, 1.2, 9); g.rotateZ(Math.PI / 2); B.geom('wood', g, new THREE.Matrix4().makeTranslation(X(px), FLOAT_H - 0.35, Z(py)), [0.62, 0.48, 0.4], 1); g.dispose(); }
      sag([X(90), FLOAT_H + 0.1, Z(630)], [X(86), DOCK_H + 1.2, Z(614)], 0.15, 0.025, 'wood', ROPE);
      { const was = B.solid; B.solid = false; B.quad('deck', [X(126), FLOAT_H + 0.02, Z(642)], [X(132), DOCK_H + 0.01, Z(642)], [X(132), DOCK_H + 0.01, Z(658)], [X(126), FLOAT_H + 0.02, Z(658)], [0, 0, 0.3, 0.8]); B.solid = was; }
      crate(92, 662, FLOAT_H, 0.55, 0.3); coil(X(118), FLOAT_H, Z(664), 0.22); block(84, 654, 102, 670);
      // the lobster pots: little slatted crates
      for (const [px, py] of [[90, 640], [96, 646]]) { B.box('wood', X(px), FLOAT_H, Z(py), 0.45, 0.32, 0.36, 0.2, [0.7, 0.58, 0.46], { solid: false }); }
      block(86, 636, 100, 650);
      // a small lantern on a pole at the float's corner, the dockhands' own
      bx('wood', 86, 630, 90, 634, FLOAT_H, FLOAT_H + 1.5, DARKWOOD); bx('iron', 86, 631, 96, 633, FLOAT_H + 1.45, FLOAT_H + 1.5);
      K.lantern(X(95), FLOAT_H + 1.05, Z(632), null, 0.7, true); K.light(104, 646, 70, 0.7, 'warm');
      // the boat landing's mooring posts, and the posts standing alone in the cove
      for (const [px, py, top] of [[162, 470, -0.9], [162, 500, -0.9], [214, 503, -1.1]]) post(px, py, top, 0.18);
      for (const [px, py, top] of [[40, 362, -1.2], [56, 400, -1.4], [30, 420, -1.6], [120, 560, -1.6], [150, 540, -1.3], [70, 600, -1.8]]) post(px, py, top, 0.2);
    }

    // ---- the east water stairs: their stone faces and the landing's, rocks and snowy bushes on the shore beside them ----
    {
      bx('dry', 1117, 644, 1168, 648, BED, -1.98, STONE); bx('dry', 1186, 682, 1252, 686, BED, -2.08, STONE);
      const bush = (px, py, rr) => { const y = T(px, py), h = rr * 0.7; B.geom('leafBush', K.ico[(px + py) % 3], new THREE.Matrix4().compose(V(X(px), y + h * 0.45, Z(py)), new THREE.Quaternion(), V(rr, h, rr)), null, 2.2); B.box('snow', X(px), y + h * 0.9, Z(py), rr * 1.1, 0.12, rr * 0.9, 0.3, null, { solid: false }); };
      for (const [px, py, rr] of [[1272, 606, 0.8], [1300, 630, 0.9], [1330, 600, 0.6], [1262, 650, 0.7], [1318, 664, 0.8], [1290, 676, 0.6]]) bush(px, py, rr);
    }

    // ---- the east quay: its stone face, the timber fender with tall posts along its edges ----
    {
      bx('dry', 1349, 660, 1512, 664, BED, 0.02, STONE); bx('dry', 1506, 506, 1512, 664, BED, 0.02, STONE);
      for (let px = 1356; px <= 1508; px += 30) { B.cyl('wood', X(px), BED, Z(667), 0.17, 0.16, 0.7 - BED, 8, [0.74, 0.6, 0.5], [1, 0.35]); B.cyl('iron', X(px), 0.38, Z(667), 0.2, 0.2, 0.08, 8, null, null, true); K.addBlock(K.circlePx(px, 667, 0.2, 8)); }
      for (let py = 516; py < 660; py += 30) { B.cyl('wood', X(1513), BED, Z(py), 0.17, 0.16, 0.7 - BED, 8, [0.74, 0.6, 0.5], [1, 0.35]); K.addBlock(K.circlePx(1513, py, 0.2, 8)); }
      bx('wood', 1349, 664, 1514, 670, -0.6, -0.2, DARKWOOD, { solid: false }); bx('wood', 1510, 506, 1516, 670, -0.6, -0.2, DARKWOOD, { solid: false });
      coil(X(1490), 0, Z(530), 0.28);
    }

    // ---- the lamps off the walking map's own: two at the north wall's foot by the slip's head, one by the upper house's
    // east wing, one by the forge's back ----
    lampPost(730, 122, 0); lampPost(800, 122, 0); lampPost(497, 206, 0); lampPost(1186, 142, 0);

    // ---- the cliffs south of the battlement: close-packed columns of dark rock with snow on their tops, a few crags below
    // the east shore's wall, and stones at the water's edge ----
    {
      const crag = (px, py, sx, sy, sz, rot) => {
        const y = T(px, py), k = 0.82 + R() * 0.16;
        B.geom('rock', K.rockG[Math.floor(R() * 3)], new THREE.Matrix4().compose(V(X(px), y - sy * 0.25, Z(py)), new THREE.Quaternion().setFromEuler(new THREE.Euler((R() - 0.5) * 0.2, rot, (R() - 0.5) * 0.2)), V(sx, sy, sz)), [k, k, k * 1.06], 2.4);
        // snow lying on its top
        const cap = new THREE.SphereGeometry(1, 9, 4, 0, TAU, 0, Math.PI / 2); B.geom('snow', cap, new THREE.Matrix4().compose(V(X(px) + (R() - 0.5) * 0.3, y - sy * 0.25 + sy * 0.62, Z(py)), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rot, 0)), V(sx * 0.62, sy * 0.16, sz * 0.58)), null, 1.5); cap.dispose();
        K.shadeMarks.push(['dot', px, py, sx / SX * 0.8, 0.62]);
      };
      const r2 = rnd(77);
      // the cliffs are columns of dark rock, packed close, their flat tops stepping down to the sea, snow on each top
      const column = (px, py, rad, top, k) => {
        const x = X(px), z = Z(py), y0 = Math.min(T(px, py), top) - 1.6, h = top - y0, rot = r2() * TAU, n = 6;
        const g = new THREE.CylinderGeometry(rad * (0.86 + r2() * 0.1), rad, h, n, 1, true); g.rotateY(rot);
        B.geom('rock', g, new THREE.Matrix4().makeTranslation(x, y0 + h / 2, z), [k, k, k * 1.05], [TAU * rad, h]); g.dispose();
        // the column's flat top, and snow lying on most of them, not quite to the edge
        const lid = new THREE.CircleGeometry(rad * 0.93, n); lid.rotateX(-Math.PI / 2); lid.rotateY(rot);
        B.geom('rock', lid, new THREE.Matrix4().makeTranslation(x, top, z), [k * 0.9, k * 0.9, k], 1.2); lid.dispose();
        if (r2() < 0.72) { const cap = new THREE.CylinderGeometry(rad * 0.6, rad * 0.7, 0.12, n, 1, false); cap.rotateY(rot + 0.3);
          B.geom('snow', cap, new THREE.Matrix4().makeTranslation(x + (r2() - 0.5) * rad * 0.3, top + 0.03, z + (r2() - 0.5) * rad * 0.3), null, 1.4); cap.dispose(); }
      };
      for (let py = 606; py < 1070; py += 22) for (let px = 296; px < 1150; px += 26) {
        const x = px + (r2() - 0.5) * 20 + ((py / 22) % 2) * 13, y = py + (r2() - 0.5) * 14;
        if (x > BR.x0 - 10 && x < BR.x1 + 10) continue;
        if (!inPoly(ISLAND, x, y) || edgeDist(ISLAND, x, y) < 5) continue;
        if (inR(GATE, x, y) || (x > 1110 && y < 700) || (x < 372 && y < 655)) continue;
        if (PINES.some(([tx, ty]) => Math.hypot(tx - x, (ty - y) * 1.25) < 18)) continue;
        const rad = 0.62 + r2() * 0.55;
        if (x - rad / SX < 368 && y < 664) continue;                 // clear of the lower quay
        const d = edgeDist(ISLAND, x, y), up = ss(0, 170, d) * (0.6 + vnoise(x / 70, y / 70) * 0.8);
        const top = SEA + 0.8 + 3.0 * up + r2() * 0.9 + (y < 640 ? 0.6 : 0);
        column(x, y, rad, Math.min(top, -0.2), 0.62 + r2() * 0.2);
        K.shadeMarks.push(['dot', x, y, 16, 0.7]);
      }
      // stones and ice along the water's edge
      for (let i = 0, j = ISLAND.length - 1; i < ISLAND.length; j = i++) {
        const [ax, ay] = ISLAND[j], [bx_, by] = ISLAND[i], L = Math.hypot(X(bx_) - X(ax), Z(by) - Z(ay));
        if (ay < 600 && by < 600) continue;
        for (let s = 0; s < L; s += 1.3 + r2() * 1.2) {
          const px = ax + (bx_ - ax) * s / L, py = ay + (by - ay) * s / L;
          if (px > BR.x0 - 20 && px < BR.x1 + 20) continue;
          if ((px < 300 && py < 670) || (px > 1112 && py < 700 && px < 1260) || px > 1340) continue;
          const sz = 0.6 + r2() * 0.9;
          B.geom('rock', K.rockG[Math.floor(r2() * 3)], new THREE.Matrix4().compose(V(X(px) + (r2() - 0.5) * 0.8, SEA - 0.2, Z(py) + (r2() - 0.5) * 0.8), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, r2() * TAU, 0)), V(sz, sz * 0.8, sz)), [0.85, 0.85, 0.92], 1.2);
        }
      }
      // the rocky foot below the east parapet
      for (const [px, py, s] of [[1268, 586, 1.2], [1310, 590, 1.4], [1340, 640, 1.1], [1276, 690, 1.3], [1236, 700, 0.9], [1320, 700, 1.0]]) crag(px, py, s, s * 1.2, s, R() * TAU);
    }

    // ---- the sea's ice: the painting's floes where it has them, and more scattered on past it ----
    {
      const floe = (pts, top) => {
        // pts in metres [x, z], counter-clockwise or not: the top's fan, then the sides
        let cx = 0, cz = 0; for (const [x, z] of pts) { cx += x; cz += z; } cx /= pts.length; cz /= pts.length;
        const yb = SEA - 0.3, n = pts.length;
        for (let i = 0; i < n; i++) {
          const a = pts[i], b = pts[(i + 1) % n];
          faceTri('snow', [cx, top + 0.04, cz], [a[0], top, a[1]], [b[0], top, b[1]], [0, 1, 0]);
          const ex = b[0] - a[0], ez = b[1] - a[1], mx = (a[0] + b[0]) / 2 - cx, mz = (a[1] + b[1]) / 2 - cz;
          let nx = ez, nz = -ex; if (nx * mx + nz * mz < 0) { nx = -nx; nz = -nz; }
          const L = Math.hypot(nx, nz) || 1; nx /= L; nz /= L;
          const q = [[a[0], yb, a[1]], [b[0], yb, b[1]], [b[0], top, b[1]], [a[0], top, a[1]]];
          faceTri('ice', q[0], q[1], q[2], [nx, 0, nz]); faceTri('ice', q[0], q[2], q[3], [nx, 0, nz]);
        }
      };
      const was = B.solid; B.solid = false;
      const r3 = rnd(91);
      for (const poly of FLOES) {
        if (poly.some(([x, y]) => inPoly(ISLAND, x, y) || edgeDist(ISLAND, x, y) < 8)) continue;
        if (poly.some(([x, y]) => x > BR.x0 - 10 && x < BR.x1 + 10 && y > 900)) continue;
        floe(poly.map(([x, y]) => [X(x), Z(y)]), SEA + 0.12 + r3() * 0.1);
      }
      // past the painting: floes in loose packs, thinning toward the fog
      for (let py = EXT[1] + 20; py < EXT[3]; py += 46) for (let px = EXT[0] + 20; px < EXT[2]; px += 52) {
        const x = px + (r3() - 0.5) * 40, y = py + (r3() - 0.5) * 36;
        if (x > -20 && x < 1556 && y > -20 && y < 1044) continue;
        if (x > BR.x0 - 60 && x < BR.x1 + 60) continue;
        const pack = vnoise(x / 260, y / 260);
        if (r3() > pack * 1.15 - 0.15) continue;
        const rr = 0.7 + r3() * 2.6 * pack, n = 6 + Math.floor(r3() * 3), a0 = r3() * TAU, pts = [];
        for (let i = 0; i < n; i++) { const a = a0 + i / n * TAU, k = 0.7 + r3() * 0.45; pts.push([X(x) + Math.cos(a) * rr * k, Z(y) + Math.sin(a) * rr * k * 0.9]); }
        floe(pts, SEA + 0.1 + r3() * 0.12);
      }
      B.solid = was;
    }

    // ---- the sea on past the world's edge, to the horizon: a plain dark plane, as the fog leaves the water there ----
    {
      const SEA_FAR = [0.075, 0.08, 0.2], x0 = X(EXT[0]), x1 = X(EXT[2]), z0 = Z(EXT[1]), z1 = Z(EXT[3]), F = 450, y = SEA - 0.02;
      B.quad('glass', [-F, y, z0], [F, y, z0], [F, y, -F], [-F, y, -F], [0, 0, 1, 1], SEA_FAR);
      B.quad('glass', [-F, y, F], [F, y, F], [F, y, z1], [-F, y, z1], [0, 0, 1, 1], SEA_FAR);
      B.quad('glass', [-F, y, z1], [x0, y, z1], [x0, y, z0], [-F, y, z0], [0, 0, 1, 1], SEA_FAR);
      B.quad('glass', [x1, y, z1], [F, y, z1], [F, y, z0], [x1, y, z0], [0, 0, 1, 1], SEA_FAR);
    }
  }
})(window);
