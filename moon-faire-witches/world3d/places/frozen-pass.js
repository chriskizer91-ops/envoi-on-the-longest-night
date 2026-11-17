// frozen-pass.js: the frozen pass in 3D. Its painting (reference/art/walk/walk-frozen-pass.png, 1536 x 1024) is the
// middle, laid out in the painting's own pixels as src/game/maps.js keeps the walking map: the snowbound road climbing
// north to Misthollow, crossing the frozen river on a short stone causeway between four snow-capped pillars; south of
// it the iron lamp with its lantern hung out on a curled bracket (the only warm light) and someone's abandoned sled and
// crate (the camp); the frozen river coming in from the west, joined by the frozen waterfall from the north-east and
// running away south; rock columns heaped with snow on every side, heavy snowy pines, bare bushes, mist in the hollows.
// Round it the pass goes on, one painting's width and height each way, under heavy fog (Chris, November 16: wild places
// are wide open fields with pockets to find): the road climbs on north to Misthollow and falls away south to
// Frostmere's shore, marked with snow poles; the ground rises to rock on either side. The frozen river is walkable ice
// (it looks it), up the gorge to the west under a natural rock arch, and down past the camp to a frozen pool in the
// south-east with a broken cart on its shore. Places to find: the frozen falls
// (and, up a trail from the road, the still river at their top), an old wayhouse with its roof fallen in by the north
// road, the rock arch, the frozen pool. Two pockets: a hollow among the rocks west of the lamp, its way in round the
// back, where the Pass Bell lies in the snow; and a grotto behind the falls' lower curtain of ice.
// Where Io can walk: the walking map's own walk and block areas, unchanged, plus all the open ground inside open.bounds,
// less everything solid (every trunk, rock column, the pillars and parapets, the sled, the lamp, a thicket of snowy bushes along the edge) and ground too steep to climb (the falls, the cliffs).
// Heights are metres: the causeway's deck is 0; the road climbs north (about 4 m by the way out) and falls south (about
// 3 m); the ice lies a little over 2 m below the road, higher up the gorge to the west, lower to the south-east; the
// falls step down from their river 4.2 m up to a ledge, and from it to the pool; the ground rises to either side.
// The texture ids are the texture pack's (texture-packs/north/frozen-pass/inventory.md) and their nearest stand-ins.
(function (G) {
  'use strict';
  const P = G.W3D_PLACES = G.W3D_PLACES || {};
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ss = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const SX = 0.04, SZ = 0.05, TAU = Math.PI * 2;
  // a builder with K.B's parts that sends each piece to the far patch where it stands (K.far: patches past the fog aren't
  // drawn): a box or a cylinder by its foot, a quad or a triangle by its middle, a geometry by the middle of where it ends
  // up. Same materials, same solids; its `solid` works as K.B's does (false while building what Io walks through)
  const farBuilder = (K) => {
    const F = { solid: true }, box3 = new THREE.Box3(), mid = new THREE.Vector3();
    const via = (x, z, f) => { const b = K.far(x, z), s = b.solid; b.solid = F.solid; f(b); b.solid = s; };
    F.box = (k, x, y, z, ...a) => via(x, z, (b) => b.box(k, x, y, z, ...a));
    F.cyl = (k, x, y, z, ...a) => via(x, z, (b) => b.cyl(k, x, y, z, ...a));
    F.quad = (k, p, q, r, s, ...a) => via((p[0] + r[0]) / 2, (p[2] + r[2]) / 2, (b) => b.quad(k, p, q, r, s, ...a));
    F.tri = (k, p, q, r, ...a) => via((p[0] + q[0] + r[0]) / 3, (p[2] + q[2] + r[2]) / 3, (b) => b.tri(k, p, q, r, ...a));
    F.geom = (k, geo, m4, ...a) => { geo.computeBoundingBox(); box3.copy(geo.boundingBox).applyMatrix4(m4).getCenter(mid); via(mid.x, mid.z, (b) => b.geom(k, geo, m4, ...a)); };
    return F;
  };
  // the engine's own noise and seeded random, copied so this file also loads in the tools (no W3D there)
  const hash = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
  const vnoise = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf); return (hash(xi, yi) * (1 - u) + hash(xi + 1, yi) * u) * (1 - v) + (hash(xi, yi + 1) * (1 - u) + hash(xi + 1, yi + 1) * u) * v; };
  const rand = (seed) => { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1e6) / 1e6; }; };
  const inPoly = (poly, x, y) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
  const edgeDist = (poly, x, y) => { let d = 1e9; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [ax, ay] = poly[j], [bx, by] = poly[i], dx = bx - ax, dy = by - ay, t = clamp(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1), 0, 1); d = Math.min(d, Math.hypot(x - ax - t * dx, y - ay - t * dy)); } return d; };
  // the same in metres (x and y scaled), for distances that must be true on the ground
  const edgeDistM = (poly, x, y) => { let d = 1e9; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const ax = poly[j][0] * SX, ay = poly[j][1] * SZ, dx = poly[i][0] * SX - ax, dy = poly[i][1] * SZ - ay, px = x * SX - ax, py = y * SZ - ay, t = clamp((px * dx + py * dy) / (dx * dx + dy * dy || 1), 0, 1); d = Math.min(d, Math.hypot(px - t * dx, py - t * dy)); } return d; };
  const bbox = (p) => { let a = 1e9, b = 1e9, c = -1e9, e = -1e9; for (const [x, y] of p) { a = Math.min(a, x); b = Math.min(b, y); c = Math.max(c, x); e = Math.max(e, y); } return [a, b, c, e]; };
  // (the ground goes on about 28 m past each way out, so where it ends is lost in the fog and the trees there)
  const EXT = [-2100, -1480, 3640, 2510];

  // a band either side of a centre line, `hw` metres (a number, or one for each point) from it
  const ribbon = (pts, hw) => {
    const L = [], R = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], w = Array.isArray(hw) ? hw[i] : hw;
      let dx = (b[0] - a[0]) * SX, dz = (b[1] - a[1]) * SZ; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
      L.push([Math.round(pts[i][0] - dz * w / SX), Math.round(pts[i][1] + dx * w / SZ)]);
      R.push([Math.round(pts[i][0] + dz * w / SX), Math.round(pts[i][1] - dx * w / SZ)]);
    }
    return L.concat(R.reverse());
  };
  const segM = (x, y, a, b) => { const ax = a[0] * SX, az = a[1] * SZ, dx = b[0] * SX - ax, dz = b[1] * SZ - az, px = x * SX - ax, pz = y * SZ - az, t = clamp((px * dx + pz * dz) / (dx * dx + dz * dz || 1), 0, 1); return Math.hypot(px - t * dx, pz - t * dz); };
  const lineDist = (L, x, y) => { let d = 1e9; for (const t of L) for (let i = 1; i < t.pts.length; i++) d = Math.min(d, segM(x, y, t.pts[i - 1], t.pts[i])); return d; };

  // ---- the road: the painting's own (its 2D walk is the road there) and on past it, north and south ----
  const ROAD_LINE = [{ pts: [[774, 0], [790, 120], [810, 210], [800, 262], [774, 300], [774, 530], [772, 600], [782, 700], [790, 800], [795, 900], [790, 1024]] }];
  const ROADS = [
    { id: 'north', pts: [[776, 30], [768, -200], [724, -420], [744, -650], [790, -905]], w: [3.3, 2.7, 2.6, 2.6, 2.6] },
    { id: 'south', pts: [[790, 994], [800, 1250], [762, 1500], [790, 1750], [782, 1950]], w: [4.3, 3.0, 2.7, 2.7, 2.7] },
  ];
  // past each way out the road runs on, bending away into the trees (seen, not walked: the way out is where it goes on)
  const BEYOND = [
    { pts: [[790, -905], [800, -1080], [720, -1260], [690, -1470]], w: 2.6 },
    { pts: [[782, 1950], [784, 2110], [860, 2300], [900, 2500]], w: 2.7 },
  ];
  const roadDist = (x, y) => Math.min(lineDist(ROAD_LINE, x, y), lineDist(ROADS, x, y), lineDist(BEYOND, x, y));
  // the road's own height along the pass: level at the causeway, climbing north, falling south
  const roadLevel = (y) => 0.7 * ss(280, 0, y) + 3.3 * ss(0, -905, y) + 0.8 * ss(-905, -1480, y) - 0.4 * ss(560, 1024, y) - 2.3 * ss(1024, 1950, y) - 0.6 * ss(1950, 2500, y);
  // trails of trodden snow: up onto the high ground to the falls' top, and from the south road down to the river
  const TRAILS = [
    { id: 'falls-top', w: 0.85, pts: [[770, -140], [900, -170], [1040, -150], [1150, -70], [1212, 40], [1222, 100]] },
    { id: 'river', w: 0.85, pts: [[800, 1262], [1000, 1205], [1180, 1130], [1300, 1070]] },
  ];
  const trailDist = (x, y) => lineDist(TRAILS, x, y);

  // ---- the frozen river: its banks traced from the painting, and on past it ----
  // the west reach: [x, north bank y, south bank y], west to east (an island of snow and rocks in it at the painting's edge)
  const WR = [[-1380, 250, 400], [-1150, 210, 352], [-900, 205, 360], [-650, 245, 395], [-400, 222, 372], [-200, 186, 336], [0, 178, 336], [60, 186, 382],
    [150, 244, 420], [250, 298, 438], [350, 328, 442], [450, 352, 448], [550, 366, 455], [650, 374, 466]];
  const WEST = WR.map(([x, n]) => [x, n]).concat(WR.slice().reverse().map(([x, , s]) => [x, s]));
  const ISLAND = { c: [140, 244], rx: 88, ry: 40 };
  // the east reach from the causeway to the falls' pool and away south (the painting's, traced)
  const EAST = [[894, 384], [920, 394], [980, 406], [1060, 418], [1130, 426], [1180, 412], [1214, 396], [1226, 398], [1322, 398], [1342, 396],
    [1390, 406], [1402, 440], [1372, 482], [1338, 522], [1302, 572], [1296, 640], [1296, 720], [1290, 800], [1172, 800], [1180, 700], [1168, 640], [1118, 600],
    [1050, 570], [980, 546], [920, 520], [894, 500]];
  // on south-east past the painting to the frozen pool, and out of the open ground
  const SE_LINE = [[1234, 780], [1262, 900], [1370, 1050], [1540, 1190], [1790, 1330]];
  const SE = ribbon(SE_LINE, [3.2, 3.0, 3.0, 3.0, 3.6]);
  const POOL = { c: [2050, 1430], rx: 270, ry: 150 };
  const ellipse = (c, rx, ry, n, wob, seed) => Array.from({ length: n }, (_, i) => { const a = i / n * TAU, k = 1 + (wob || 0) * (hash(seed || 1, i) - 0.5) * 2; return [Math.round(c[0] + Math.cos(a) * rx * k), Math.round(c[1] + Math.sin(a) * ry * k)]; });
  const POOLP = ellipse(POOL.c, POOL.rx, POOL.ry, 20, 0.1, 5);
  const SE2 = ribbon([[2290, 1470], [2600, 1540], [2900, 1590]], 2.8);
  // the falls: the still river above them (it comes out of the mountain in the north), the ledge between their two steps,
  // and the grotto behind the lower step's curtain of ice
  const UPPER = ribbon([[1268, 150], [1266, 40], [1290, -150], [1262, -330]], [2.7, 2.6, 2.6, 2.4]);
  const FALLS = [1205, 140, 1400, 400];                         // the falls' box: steep ice, except the ledge and the grotto
  const LEDGE = [[1212, 192], [1392, 192], [1394, 330], [1214, 330]];
  const GROTTO = [[1232, 352], [1328, 352], [1328, 398], [1232, 398]];
  // the ice's height, river by river: the west reach higher up its gorge, the east reach and the pool below the falls,
  // lower to the south-east; the still river above the falls 4.2 m up
  const westLevel = (x) => -2.2 + 0.8 * ss(650, -1400, x);
  const seLevel = (x, y) => -2.3 - 1.4 * ss(780, 1330, y) - 0.5 * ss(1900, 2900, x);
  const upLevel = (y) => 4.2 + 0.4 * ss(150, -330, y);
  const RIVERS = [WEST, EAST, SE, POOLP, SE2, UPPER];
  const LEVELS = [(x) => westLevel(clamp(x, -1400, 650)), () => -2.3, seLevel, seLevel, seLevel, (x, y) => upLevel(clamp(y, -330, 150))];
  const RB = RIVERS.map(bbox);
  const level = (x, y) => { for (let i = 0; i < RIVERS.length; i++) { const b = RB[i]; if (x >= b[0] && x <= b[2] && y >= b[1] && y <= b[3] && inPoly(RIVERS[i], x, y)) return LEVELS[i](x, y); } return -2.3; };
  const fallsH = (x, y) => {
    if (y < 150) return 4.2;
    if (y < 192) return 4.2 - 2.8 * ss(150, 192, y);
    if (y < 335) return 1.4;
    return 1.4 - 3.7 * ss(335, 352, y);
  };
  // how far (m) a point is outside the river (0 inside), and whether it's in it
  // (capped at 30 m: nothing uses more, and the cap keeps the ground smooth where a river's box is left out); riverNear
  // also gives the nearest river's ice height, for its banks
  const riverNear = (x, y) => { let d = 30, k = -1; for (let i = 0; i < RIVERS.length; i++) { const b = RB[i]; if (x < b[0] - 760 || x > b[2] + 760 || y < b[1] - 610 || y > b[3] + 610) continue; if (inPoly(RIVERS[i], x, y)) return { d: 0, lv: LEVELS[i](x, y) }; const e = edgeDistM(RIVERS[i], x, y); if (e < d) { d = e; k = i; } } return { d, lv: k < 0 ? -2.3 : LEVELS[k](x, y) }; };
  const riverDist = (x, y) => riverNear(x, y).d;
  // every river within 30 m, each with its distance and ice height (or the one it's in)
  const riverAll = (x, y) => { const out = []; for (let i = 0; i < RIVERS.length; i++) { const b = RB[i]; if (x < b[0] - 760 || x > b[2] + 760 || y < b[1] - 610 || y > b[3] + 610) continue; if (inPoly(RIVERS[i], x, y)) return [{ d: 0, lv: LEVELS[i](x, y) }]; out.push({ d: edgeDistM(RIVERS[i], x, y), lv: LEVELS[i](x, y) }); } return out; };

  // ---- the places to find, and the two pockets ----
  const LAMP = { at: [590, 680] };                              // the iron lamp (its foot is the walking map's block)
  const SLED = { c: [905, 660] };                               // the sled and its crate (inside the walking map's block)
  const WAYHOUSE = { c: [580, -575], w: 4.6, d: 4.0 };         // the old wayhouse by the north road, roof fallen in, door east
  const ARCH = { x: -820 };                                     // the natural rock arch over the river's gorge
  const CART = { at: [2010, 1262] };                            // the broken cart on the frozen pool's north shore
  const BELL = { c: [470, 640], r: 1.9 };                       // pocket: the hollow among the rocks west of the lamp
  const CAUSEWAY = [652, 300, 892, 530];                        // the crossing: road level, solid down to the ice either side
  // where no tree grows past the painting: [x, y, radius m]
  const KEEP = [[WAYHOUSE.c[0], WAYHOUSE.c[1], 6], [ARCH.x, 300, 5], [CART.at[0], CART.at[1], 4], [BELL.c[0], BELL.c[1], 3.5], [1270, -330, 4]];

  // ---- the ground ----
  // the high ground north-east (the falls cut into it): a cliff over the road and the river in the painting, a gentler
  // slope past it
  const plateau = (x, y) => { const k = ss(1450, 1750, x), south = ss(395 + 40 * k, 340 - 220 * k, y); return (ss(840, 1160, x) + (ss(960, 1040, x) * south - ss(840, 1160, x)) * ss(-120, 0, y)) * ss(3700, 3200, x); };
  const highWest = (x, y) => ss(620, 440, x) * ss(345, 260, y) * ss(-200, 60, y) * ss(-320, -40, x);                     // and north-west, north of the river (in the painting's rows)
  // how far (m) a point is from the walking map's own walk (0 inside it)
  let WALK2 = null;
  const walkDist = (x, y) => {
    if (!WALK2) WALK2 = (((G.MAPS || {})['frozen-pass'] || { walk: [] }).walk).map((p) => ({ p, b: bbox(p) }));
    let d = 1e9; for (const q of WALK2) { if (x < q.b[0] - 160 || x > q.b[2] + 160 || y < q.b[1] - 160 || y > q.b[3] + 160) continue; if (inPoly(q.p, x, y)) return 0; d = Math.min(d, edgeDistM(q.p, x, y)); } return d;
  };
  function ground(x, y) {
    const rl = roadLevel(y);
    // the causeway: the road's level, its sides straight down to the ice
    if (x > CAUSEWAY[0] && x < CAUSEWAY[2] && y > CAUSEWAY[1] && y < CAUSEWAY[3]) return rl;
    // the falls: their two steps and the ledge between; the grotto behind the lower curtain
    if (x > FALLS[0] - 20 && x < FALLS[2] + 20 && y > FALLS[1] - 20 && y < FALLS[3]) {
      if (inPoly(GROTTO, x, y)) return -2.3;
      if (x > FALLS[0] && x < FALLS[2] && y > FALLS[1] && y < 352) return fallsH(x, y);
    }
    // the river: the ice is level (the island a low hump of snow in it)
    const rs = riverAll(x, y), rn = rs.length && rs[0].d === 0 ? rs[0] : null, dv = rn ? 0 : rs.reduce((m, q) => Math.min(m, q.d), 30);
    if (rn) { if ((x - ISLAND.c[0]) ** 2 / ISLAND.rx ** 2 + (y - ISLAND.c[1]) ** 2 / ISLAND.ry ** 2 < 1) return rn.lv + 0.7 * (1 - ss(0.4, 1, Math.hypot((x - ISLAND.c[0]) / ISLAND.rx, (y - ISLAND.c[1]) / ISLAND.ry))) + 0.05; return rn.lv; }
    // the pass's sides rise away from the road and the river (the valleys), rolling, with the high ground to the north
    const dr = roadDist(x, y), valley = Math.min(dr, dv * 1.5 + 5), side = Math.min(5.5, 0.17 * Math.max(0, valley - 7));
    let h = rl + side + (vnoise(x / 380 + 4.1, y / 380 + 8.7) - 0.5) * 3.0 * ss(5, 16, valley) + 4.2 * plateau(x, y) + 2.4 * highWest(x, y);
    // the banks come down to the ice over 6 m or more (as far as it takes to keep them under about 32 degrees)
    // (from every river near, the lowest: so where two rivers at different heights are about as near, nothing jumps)
    { let hb = h; for (const q of rs) { if (q.d >= 29.5) continue; const lv = q.lv + 0.25; if (h > lv) { const wb = Math.min(29.5, Math.max(6, (h - lv) / 0.42)); if (q.d < wb) hb = Math.min(hb, lv + (h - lv) * ss(0, wb, q.d)); } } h = hb; }
    // the walking map's own walk keeps the road's level (and the ground just round it)
    if (x > -200 && x < 1740 && y > -200 && y < 1230) { const dw = walkDist(x, y); if (dw < 4) h += (rl - h) * (1 - ss(0.5, 4, dw)); }
    // the wayhouse stands on a level pad
    const wd = Math.max(Math.abs(x - WAYHOUSE.c[0]) * SX - WAYHOUSE.w / 2, Math.abs(y - WAYHOUSE.c[1]) * SZ - WAYHOUSE.d / 2);
    if (wd < 8) { const pad = roadLevel(WAYHOUSE.c[1]) + 0.35; h = pad + (h - pad) * ss(1, 8, wd); }
    return h;
  }

  // ---- the trees past the painting: snowy pines (and a few bare trees) in clumps with clearings, thickening away from
  // the road and the river (none on the painting itself: its trees come from the painting, tools/make-trees.mjs) ----
  const BOUNDS = [[-1360, 560], [-1400, 200], [-1440, -100], [-1360, -420], [-1150, -700], [-800, -880], [-300, -830], [200, -900], [600, -880], [726, -912],
    [854, -912], [1000, -880], [1300, -900], [1600, -700], [1900, -840], [2400, -820], [2800, -600], [2900, -150], [2860, 300], [2920, 800], [2900, 1300],
    [2780, 1720], [2300, 1880], [1700, 1830], [1100, 1900], [866, 1948], [698, 1948], [300, 1880], [-300, 1900], [-900, 1800], [-1300, 1520], [-1350, 1000]];
  const OUT_TREES = (() => {
    const r = rand(4040), T = [], STEP = 58;
    for (let gy = EXT[1] + 10; gy < EXT[3]; gy += STEP) for (let gx = EXT[0] + 10; gx < EXT[2]; gx += STEP) {
      const x = Math.round(gx + (r() - 0.5) * STEP * 0.9), y = Math.round(gy + (r() - 0.5) * STEP * 0.9), u = r(), k = r(), s = r(), seed = Math.floor(r() * 1000);
      if (x > -30 && x < 1566 && y > -30 && y < 1054) continue;
      const dr = roadDist(x, y), dt = trailDist(x, y), dv = riverDist(x, y);
      if (dr < 4.6 || dt < 2.4 || dv < 1.8) continue;
      if (KEEP.some(([cx, cy, rr]) => Math.hypot((x - cx) * SX, (y - cy) * SZ) < rr)) continue;
      const n = vnoise(x / 480 + 1.3, y / 480 + 6.1) * 0.7 + vnoise(x / 150 + 2.2, y / 150) * 0.3;
      const outside = !inPoly(BOUNDS, x, y) && edgeDist(BOUNDS, x, y) > 260 ? 0.55 : 1;
      const dens = 0.9 * outside * (n < 0.44 ? 0.04 : Math.min(1, (n - 0.44) / 0.18)) * ss(3.5, 20, Math.min(dr, dt + 5, dv + 4));
      if (u > dens) continue;
      T.push([x, y, +(1.0 + s * 0.6).toFixed(2), k < 0.84 ? 1 : 2, seed]);
    }
    // past each way out, the woods close in round the road as it bends away
    for (const [i, b] of BEYOND.entries()) {
      const [ex, ey] = b.pts[0], [nx, ny] = b.pts[1], L = Math.hypot((nx - ex) * SX, (ny - ey) * SZ), fx = (nx - ex) * SX / L, fz = (ny - ey) * SZ / L;
      for (let k = 0; k < 70; k++) {
        const d = 6 + r() * 24, a = (r() - 0.5) * 2.4, ca = Math.cos(a), sa = Math.sin(a), mx = (fx * ca - fz * sa) * d, mz = (fx * sa + fz * ca) * d;
        const x = Math.round(ex + mx / SX), y = Math.round(ey + mz / SZ), s = r(), kd = r(), seed = Math.floor(r() * 1000) + i * 1000;
        if (x < EXT[0] + 10 || x > EXT[2] - 10 || y < EXT[1] + 10 || y > EXT[3] - 10 || lineDist([b], x, y) < b.w + 1.6) continue;
        if (T.some((t) => Math.hypot((t[0] - x) * SX, (t[1] - y) * SZ) < 2.2)) continue;
        T.push([x, y, +(1.0 + s * 0.55).toFixed(2), kd < 0.8 ? 1 : 2, seed]);
      }
    }
    // by hand: the pine screening the bell's hollow's way in
    T.push([BELL.c[0] - 92, BELL.c[1] + 74, 1.15, 1, 601]);
    return T;
  })();
  // the painting's own snowy pines: its woods are white with snow, which the tree tool (it looks for dark woods) mostly
  // misses, so they are set here, in clumps off the road, the ice, the falls and the pockets, as thick as the painting's
  const PAINT_TREES = (() => {
    const r = rand(7171), T = [], STEP = 52;
    const MAPW = () => (((G.MAPS || {})['frozen-pass'] || { walk: [] }).walk);
    for (let gy = 10; gy < 1024; gy += STEP) for (let gx = 10; gx < 1536; gx += STEP) {
      const x = Math.round(gx + (r() - 0.5) * STEP * 0.85), y = Math.round(gy + (r() - 0.5) * STEP * 0.85), u = r(), k = r(), s = r(), seed = Math.floor(r() * 1000) + 3000;
      if (MAPW().some((p) => inPoly(p, x, y) || edgeDistM(p, x, y) < 2.6) || riverDist(x, y) < 1.2) continue;
      if (x > FALLS[0] - 30 && x < FALLS[2] + 30 && y > FALLS[1] - 40 && y < FALLS[3] + 20) continue;
      if (x > CAUSEWAY[0] - 40 && x < CAUSEWAY[2] + 40 && y > CAUSEWAY[1] - 30 && y < CAUSEWAY[3] + 30) continue;
      if (Math.hypot((x - BELL.c[0]) * SX, (y - BELL.c[1]) * SZ) < 4.6 || (x > 800 && x < 1000 && y > 570 && y < 790)) continue;
      const n = vnoise(x / 200 + 3.3, y / 200 + 7.7);
      if (u > (n < 0.32 ? 0.12 : 0.62)) continue;
      T.push([x, y, +(0.95 + s * 0.45).toFixed(2), k < 0.9 ? 1 : 2, seed]);
    }
    return T;
  })();

  P['frozen-pass'] = {
    id: 'frozen-pass', name: 'The frozen pass', painting: "art/walk/walk-frozen-pass.avif", size: [1536, 1024],
    mapId: 'frozen-pass', paintingPng: 'reference/art/walk/walk-frozen-pass.png',
    extent: EXT,
    open: { bounds: BOUNDS },
    // the wall check (tools/walls-test.mjs): from the causeway's south end to the start, both ways out, the lamp, the
    // sled camp, out on the ice either side of the causeway, the falls' pool, the ledge's view from the falls' top, every
    // place to find and both pockets (the keepsake is walked to as well)
    checks: { from: [774, 545], goals: [
      ['the start, on the road south', 790, 990], ['by the lamp', 615, 650], ['the sled camp', 840, 640], ['across the causeway, north', 774, 280],
      ['the way on to Misthollow (north)', 790, -900], ['the way on to Frostmere’s shore (south)', 782, 1942],
      ['out on the ice, west of the causeway', 560, 412], ['out on the ice, east of the causeway', 960, 470], ['the falls’ pool', 1300, 430],
      ['in the grotto behind the falls (pocket)', 1262, 372], ['the still river at the falls’ top', 1262, 100], ['the old wayhouse, inside', 570, -575],
      ['under the rock arch (west)', -820, 300], ['the frozen pool (south-east)', 2050, 1440], ['by the broken cart', 2060, 1250],
      ['in the hollow west of the lamp (pocket)', 470, 652]] },
    // the trees: on the painting from the painting itself (its snowy pines, a few bare); past it, OUT_TREES above
    treeGen: { dark: 0.38, step: 50, fir: 1, firSouth: 1, thorn: 0.1, out: { density: 0 },
      keepOut: [[1180, 0, 1420, 460], [640, 280, 900, 560], [820, 570, 980, 760], [400, 560, 560, 720]] },
    // the ground: the pass road's paving with snow packed between, trodden snow on its edges and the trails, deep snow
    // everywhere else, the river's ice
    ground: { cob: 'frozenpass_road_snowy', dirt: 'snow_trodden_trail', grass: 'shared_snow', pave: 'shared_ice', rep: [3.0, 3.2, 2.8, 5.0], grassTint: [0.97, 0.95, 0.86] },
    surfaces: { stone: 'shared_stone_wall_frosted', dry: 'shared_stone_wall_frosted', timber: 'shared_stone_wall_frosted', planks: 'eldergrove_dead_bark', roof: 'shared_rock_cliff_snowy',
      wood: 'eldergrove_dead_bark', deck: 'frozenpass_road_snowy', pave: 'frozenpass_road_snowy', cloth: 'shared_snow', soil: 'snow_trodden_trail', rock: 'shared_rock_cliff_snowy',
      leaves: 'shared_snow', firs: 'fir_foliage_snowladen', bark: 'thorn_bark_black' },
    extraMats: { snowcap: { tex: 'shared_snow', rep: 2.2, tint: 0xf2f4ff, shade: 0.5 }, icefall: { tex: 'frozen_waterfall_ice', rep: 3.0, tint: 0xc8d4f0, shade: 0.3 },
      cliff: { tex: 'cliff_rock_frozen', rep: 2.6, tint: 0xd8dcec, shade: 0.6 } },
    tints: { leaves: 0xf0f2ff, firs: 0xc8d4e8, bush: 0xeef0ff, wood: 0xc0b0a8 },
    // heavy pale fog: only so much is drawn at once; no far hills (the fog is the edge)
    night: { fog: [0.2, 0.215, 0.36], fogNear: 10, fogFar: 42, far: 90, hills: false, sky: [0.6, 0.62, 0.74], moon: [0.44, 0.47, 0.62] },
    textures: [
      { id: 'frozenpass_road_snowy', made: "./../texture-packs/made-web/frozenpass_road_snowy.webp", stand: "./../texture-packs/north/frozen-pass/stand-in/frozenpass_road_snowy.png" },
      { id: 'shared_snow', made: "./../texture-packs/made-web/shared_snow.webp", stand: "./../texture-packs/north/frozen-pass/stand-in/shared_snow.png" },
      { id: 'shared_ice', made: "./../texture-packs/made-web/shared_ice.webp", stand: "./../texture-packs/north/frozen-pass/stand-in/shared_ice.png" },
      { id: 'shared_rock_cliff_snowy', made: "./../texture-packs/made-web/shared_rock_cliff_snowy.webp", stand: "./../texture-packs/north/frozen-pass/stand-in/shared_rock_cliff_snowy.png" },
      { id: 'snow_trodden_trail', made: "./../texture-packs/made-web/snow_trodden_trail.webp", stand: "./../texture-packs/wilds-north/frozen-camp/stand-in/snow_trodden_trail.png" },
      { id: 'fir_foliage_snowladen', made: "./../texture-packs/made-web/fir_foliage_snowladen.webp", stand: "./../texture-packs/wilds-north/frozen-camp/stand-in/fir_foliage_snowladen.png" },
      { id: 'frozen_waterfall_ice', made: "./../texture-packs/made-web/frozen_waterfall_ice.webp", stand: "./../texture-packs/wilds-north/frozen-camp/stand-in/frozen_waterfall_ice.png" },
      { id: 'cliff_rock_frozen', made: "./../texture-packs/made-web/cliff_rock_frozen.webp", stand: "./../texture-packs/wilds-north/frozen-camp/stand-in/cliff_rock_frozen.png" },
      { id: 'shared_stone_wall_frosted', made: "./../texture-packs/made-web/shared_stone_wall_frosted.webp", stand: "./../texture-packs/north/moonwell/stand-in/shared_stone_wall_frosted.png" },
      { id: 'eldergrove_dead_bark', made: "./../texture-packs/made-web/eldergrove_dead_bark.webp", stand: "./../texture-packs/wilds-south/eldergrove-edge/stand-in/eldergrove_dead_bark.png" },
      { id: 'thorn_bark_black', made: "./../texture-packs/made-web/thorn_bark_black.webp", stand: "./../texture-packs/wickhollow/thornwood/stand-in/thorn_bark_black.png" },
    ],
    ground_h: ground,
    walk_h: ground,
    water: [],
    lawns: [],
    thicket: true,
    start: [790, 990], startFace: Math.PI, startYaw: 0,
    // the ways on, where the road reaches the open ground's edge
    exits: [
      { rect: [728, -918, 852, -896], label: 'Misthollow' },
      { rect: [698, 1938, 866, 1960], label: 'Frostmere’s shore' },
    ],
    // the road on past the painting (paving down the middle, trodden snow along its edges), the trails, and the river's
    // ice (open ground: walkable; laid as walkable ground so it stays level)
    walkAdd: ROADS.map((t) => ({ poly: ribbon(t.pts, t.w.map((w) => w + 0.8)), ground: 'dirt' })).concat(ROADS.map((t) => ({ poly: ribbon(t.pts, t.w), ground: 'cob' })))
      .concat(TRAILS.map((t) => ({ poly: ribbon(t.pts, t.w), ground: 'dirt' })))
      .concat([WEST, EAST, SE, POOLP, SE2, UPPER, LEDGE, GROTTO].map((p) => ({ poly: p, ground: 'grass' }))),
    // the ice laid over the river, the falls and the ledge; the island's snow; the road past the ways out
    groundPatches: [WEST, EAST, SE, POOLP, SE2, UPPER, LEDGE, GROTTO, [[FALLS[0], FALLS[1]], [FALLS[2], FALLS[1]], [FALLS[2], 400], [FALLS[0], 400]]].map((p) => ({ poly: p, kind: 'pave' }))
      .concat([{ poly: ellipse(ISLAND.c, ISLAND.rx * 0.9, ISLAND.ry * 0.85, 14, 0.12, 9), kind: 'grass' }])
      .concat(BEYOND.map((b) => ({ poly: ribbon(b.pts, b.w + 0.8), kind: 'dirt' }))).concat(BEYOND.map((b) => ({ poly: ribbon(b.pts, b.w), kind: 'cob' }))),
    // the keepsake, in its pocket: the Pass Bell, in the snow in the hollow among the rocks west of the lamp
    items: { 'pass-bell': [474, 652] },
    buildings: [],
    walls: [],
    steps: [],
    lamps: [],
    props: [],
    flowers: [],
    // moonlight lying on the ice and the open snow (the lamp adds its own in extra())
    lights: [
      [500, 410, 200, 0.4, 'moon'], [1050, 480, 220, 0.42, 'moon'], [1290, 300, 200, 0.5, 'moon'], [1270, 60, 160, 0.4, 'moon'], [-400, 290, 240, 0.4, 'moon'],
      [ARCH.x, 300, 200, 0.45, 'moon'], [POOL.c[0], POOL.c[1], 300, 0.5, 'moon'], [WAYHOUSE.c[0], WAYHOUSE.c[1], 150, 0.3, 'moon'], [1500, 1150, 240, 0.35, 'moon'],
      [350, 800, 200, 0.25, 'moon'], [780, 1500, 200, 0.25, 'moon'], [760, -400, 200, 0.25, 'moon'],
    ],
    trees: 'frozen-pass',
    extraTrees: OUT_TREES.concat(PAINT_TREES),

    // ---- what the engine has no field for: the causeway, its pillars and parapets, the lamp, the sled and its crate,
    // the rock columns, the frozen falls and the grotto, the snow poles, the bare bushes, the places to find, the bell's
    // hollow and the mist ----
    extra(K) {
      const { X, Z } = K, W = G.W3D, TH = K.terrain;
      // what each part below is built into: K.B for the causeway, the lamp and the frozen falls (big things at the
      // painting's middle, and the ones that glow); FAR for everything else, each piece into the far patch where it
      // stands, so it isn't drawn once it's past the fog
      const FAR = farBuilder(K);
      let B = K.B;
      const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
      const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
      const norm = (a) => { const L = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / L, a[1] / L, a[2] / L]; };
      const px = (x) => K.M.px(x), py = (z) => K.M.py(z);
      const M4 = (x, y, z, ry, sx, sy, sz, rx, rz) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx || 0, ry, rz || 0)), new THREE.Vector3(sx, sy, sz));
      const MAP = (G.MAPS || {})['frozen-pass'] || { walk: [] };
      const onWalk = (x, y, m) => MAP.walk.some((p) => inPoly(p, x, y) || edgeDist(p, x, y) < m);
      const lump = (() => { const g = new THREE.IcosahedronGeometry(1, 0), p = g.attributes.position, r = W.rand(919), seen = {}; for (let i = 0; i < p.count; i++) { const key = p.getX(i).toFixed(3) + ',' + p.getY(i).toFixed(3) + ',' + p.getZ(i).toFixed(3), k = seen[key] || (seen[key] = 0.82 + r() * 0.3); p.setXYZ(i, p.getX(i) * k, p.getY(i) * k, p.getZ(i) * k); } g.computeVertexNormals(); return g; })();
      // rock columns: a few shapes of rough six-sided column, to be scaled
      const colG = [0, 1, 2].map((v) => { const g = new THREE.CylinderGeometry(0.5, 0.56, 1, 6, 2), p = g.attributes.position, r = W.rand(70 + v); for (let i = 0; i < p.count; i++) { const y = p.getY(i), k = 0.86 + r() * 0.28; p.setXYZ(i, p.getX(i) * k, y, p.getZ(i) * k); } g.translate(0, 0.5, 0); g.computeVertexNormals(); return g; });
      function seg(A, Bp, ra, rb, n, col, k) {
        const d = sub(Bp, A), L = Math.hypot(d[0], d[1], d[2]), dir = mul(d, 1 / L);
        const u = norm(cross(Math.abs(dir[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0], dir)), v = cross(dir, u);
        const ring = (c, r, t) => add(c, add(mul(u, Math.cos(t) * r), mul(v, Math.sin(t) * r)));
        for (let i = 0; i < n; i++) { const t0 = i / n * TAU, t1 = (i + 1) / n * TAU; B.quad(k || 'wood', ring(A, ra, t0), ring(A, ra, t1), ring(Bp, rb, t1), ring(Bp, rb, t0), [t0 * ra, 0, t1 * ra, L], col); }
      }
      // one rock column: its foot sunk into the ground, snow heaped on its top
      const column = (x0, y0, w, h, ry, seed, opt) => {
        opt = opt || {};
        const x = X(x0), z = Z(y0), g = (opt.base != null ? opt.base : TH(x0, y0)) - 0.6, c = 0.88 + hash(seed, 1) * 0.16;
        B.geom(opt.mat || 'rock', colG[seed % 3], M4(x, g, z, ry, w, h + 0.6, w * (0.82 + hash(seed, 2) * 0.3)), [c, c, c * 1.04], [w * 1.6, h]);
        if (opt.snow !== false) { B.solid = false; B.geom('snowcap', lump, M4(x, g + h + 0.6, z, ry, w * 0.6, 0.22 + w * 0.12, w * 0.55), null, 1.1); B.solid = true; }
        if (opt.solid !== false) K.addBlock(K.circlePx(x0, y0, w * 0.5, 8));
      };
      // a mass of columns round (cx, cy), rx by ry metres, heights hmin to hmax (taller toward its middle)
      const massif = (cx, cy, rx, ry, n, hmin, hmax, seed, keepOff) => {
        const r = W.rand(seed);
        for (let i = 0; i < n; i++) {
          const a = r() * TAU, d = Math.sqrt(r()), qx = cx + Math.cos(a) * d * rx / SX, qy = cy + Math.sin(a) * d * ry / SZ;
          if (keepOff && keepOff(qx, qy)) continue;
          const w = 1.1 + r() * 1.3, h = hmin + (hmax - hmin) * (1 - d * 0.6) * (0.6 + r() * 0.4);
          column(qx, qy, w, h, r() * TAU, Math.floor(r() * 1e4));
          K.shadeMarks.push(['dot', qx, qy, w / SX * 0.9, 0.7]);
        }
      };
      // nothing solid on the road, the trails, the causeway, the lamp's nook and the sled's clearing; nor on the ice
      const offPath = (x, y) => onWalk(x, y, 14) || roadDist(x, y) < 4.2 || trailDist(x, y) < 1.8;
      const offIce = (x, y) => offPath(x, y) || riverDist(x, y) < 0.6;
      const ringBlock = (c, r0, r1, gap, gw) => {
        const rm = (r0 + r1) / 2, hw = (r1 - r0) / 2, ga = gw + hw / rm, pts = [], n = 28, at = (a, r) => [c[0] + Math.cos(a) * r / SX, c[1] + Math.sin(a) * r / SZ];
        for (let i = 0; i <= n; i++) pts.push(at(gap + ga + (TAU - 2 * ga) * i / n, r1));
        for (let i = n; i >= 0; i--) pts.push(at(gap + ga + (TAU - 2 * ga) * i / n, r0));
        K.addBlock(pts);
        for (const e of [gap + ga, gap - ga]) { const q = at(e, rm); K.addBlock(K.circlePx(q[0], q[1], hw, 12)); }
      };

      // ---- the causeway over the river: its paved deck is the road (the ground); low parapets between the four tall
      // snow-capped pillars, and stone sides down to the ice ----
      {
        const ice = -2.3, PH = 1.0;
        const pillar = (x0, x1, y0, y1, top) => {
          const cx = X((x0 + x1) / 2), cz = Z((y0 + y1) / 2), w = (x1 - x0) * SX, d = (y1 - y0) * SZ;
          B.box('stone', cx, ice - 0.3, cz, w, top - ice + 0.3, d, 0, [0.95, 0.95, 1.0]);
          B.box('stone', cx, top, cz, w + 0.2, 0.2, d + 0.2, 0, [0.82, 0.82, 0.9]);
          B.box('stone', cx, top + 0.2, cz, w * 0.7, 0.3, d * 0.7, 0, [0.9, 0.9, 0.96]);
          B.solid = false; B.geom('snowcap', lump, M4(cx, top + 0.5, cz, 0.4, w * 0.5, 0.32, d * 0.5), null, 1.2); B.solid = true;
        };
        // the pillars (the walking map's fronts), and the parapets between them along the deck's edges
        pillar(664, 698, 304, 346, 2.3); pillar(851, 885, 304, 346, 2.3); pillar(656, 693, 448, 522, 2.1); pillar(850, 886, 448, 520, 2.1);
        for (const [x0, x1] of [[677, 689], [859, 871]]) {
          const cx = X((x0 + x1) / 2), z0 = Z(346), z1 = Z(448), w = (x1 - x0) * SX;
          B.box('stone', cx, ice - 0.3, (z0 + z1) / 2, w, PH - ice + 0.3, z1 - z0, 0, [0.9, 0.9, 0.96], { u0: 0 });
          B.box('snowcap', cx, PH, (z0 + z1) / 2, w * 0.9, 0.12, z1 - z0, 0, null);
        }
        // the sides of the causeway down to the ice, between the pillars' feet, with two small dark culverts each side
        // (they stand out over the ground's step down to the ice, so it doesn't show)
        for (const [x0, x1] of [[634, 677], [871, 912]]) {
          const cx = X((x0 + x1) / 2), z0 = Z(304), z1 = Z(524);
          B.box('stone', cx, ice - 0.3, (z0 + z1) / 2, (x1 - x0) * SX, -0.04 - ice + 0.3, z1 - z0, 0, [0.82, 0.82, 0.9]);
          for (const zf of [0.35, 0.65]) { const zc = z0 + (z1 - z0) * zf, xo = x0 < 700 ? X(x0) - 0.03 : X(x1) + 0.03; B.solid = false; B.box('soil', xo, ice + 0.02, zc, 0.04, 0.75, 1.0, 0, [0.08, 0.08, 0.1]); B.solid = true; }
          B.solid = false; B.box('snowcap', cx, -0.06, (z0 + z1) / 2, (x1 - x0) * SX * 0.95, 0.08, z1 - z0, 0, null); B.solid = true;
        }
        K.addBlock(W.rectPoly([632, 306, 689, 532])); K.addBlock(W.rectPoly([858, 306, 914, 532]));
        for (const p of [[664, 306, 698, 346], [851, 306, 885, 346], [656, 448, 693, 522], [850, 448, 886, 520]]) K.addBlock(W.rectPoly(p));
        K.shadeMarks.push(['rect', 652, 300, 892, 530, 0.7]);
      }

      // ---- the iron lamp: a post with a curled bracket, its lantern hung out east over the road's edge, lit ----
      {
        const [lx0, ly0] = LAMP.at, x = X(lx0), z = Z(ly0), g = TH(lx0, ly0), H = 3.0;
        B.box('iron', x, g, z, 0.32, 0.25, 0.32, 0); B.cyl('iron', x, g + 0.25, z, 0.08, 0.05, H - 0.25, 7);
        B.box('iron', x, g + H, z, 0.14, 0.1, 0.14, 0); B.cyl('iron', x, g + H + 0.1, z, 0.06, 0.0, 0.25, 6);
        B.solid = false;
        B.box('iron', x + 0.36, g + H - 0.2, z, 0.72, 0.05, 0.05, 0);
        const sc = new THREE.TorusGeometry(0.2, 0.025, 4, 10, Math.PI * 1.4); B.geom('iron', sc, M4(x + 0.25, g + H - 0.42, z, 0, 1, 1, 1), null, 1); sc.dispose();
        B.box('iron', x + 0.68, g + H - 0.55, z, 0.03, 0.35, 0.03, 0);
        K.lantern(x + 0.68, g + H - 0.95, z, null, 1.05, false);
        B.solid = true;
        K.light(lx0 + 22, ly0 - 30, 170, 1.25, 'warm'); K.light(lx0 + 50, ly0 - 30, 100, 0.5, 'warm');
        K.addBlock(K.circlePx(lx0, ly0, 0.22, 8));
      }

      B = FAR;
      // ---- the sled: its bed of planks on curled iron runners, a chain trailing, the crate beside it ----
      {
        const [sx, sy] = SLED.c, g = TH(sx, sy), ry = 0.42, c = Math.cos(ry), s = Math.sin(ry), P_ = (lx, lz) => [X(sx) + lx * c + lz * s, Z(sy) - lx * s + lz * c], col = [0.85, 0.7, 0.58];
        for (const lz of [-0.48, 0.48]) {
          const a = P_(-1.25, lz), b = P_(1.05, lz); B.box('iron', (a[0] + b[0]) / 2, g + 0.02, (a[1] + b[1]) / 2, 2.3, 0.06, 0.06, ry);
          const fr = P_(-1.32, lz); const cg = new THREE.TorusGeometry(0.22, 0.03, 4, 8, Math.PI); B.geom('iron', cg, M4(fr[0], g + 0.24, fr[1], ry + Math.PI / 2, 1, 1, 1, 0, Math.PI / 2), null, 1); cg.dispose();
          for (const lx of [-0.8, 0, 0.8]) { const q = P_(lx, lz); B.box('wood', q[0], g + 0.05, q[1], 0.08, 0.32, 0.08, ry, col); }
          const rl = P_(-0.1, lz); B.box('wood', rl[0], g + 0.62, rl[1], 1.9, 0.07, 0.06, ry, col);
        }
        for (let i = 0; i < 8; i++) { const q = P_(-0.95 + i * 0.27, 0); B.box('wood', q[0], g + 0.36, q[1], 0.24, 0.05, 1.1, ry, [0.8 + (i % 2) * 0.08, 0.66, 0.55]); }
        for (const lx of [-0.95, 0.95]) for (const lz of [-0.48, 0.48]) { const q = P_(lx, lz); B.box('wood', q[0], g + 0.36, q[1], 0.06, 0.32, 0.06, ry, col); }
        B.solid = false;
        const cA = P_(-1.35, 0.1); let cp = [cA[0], g + 0.3, cA[1]]; for (let i = 0; i < 9; i++) { const np = [cp[0] - 0.22 - i * 0.02, g + 0.04, cp[2] + 0.14 + Math.sin(i) * 0.05]; seg(cp, np, 0.025, 0.025, 4, [0.5, 0.5, 0.55], 'iron'); cp = np; }
        B.geom('snowcap', lump, M4(X(sx) + 0.1, g + 0.42, Z(sy), ry, 0.8, 0.1, 0.45), null, 1);
        B.solid = true;
        // the crate, a little north of it
        const cx = X(894), cz = Z(612), cg2 = TH(894, 612);
        B.box('wood', cx, cg2 - 0.05, cz, 0.85, 0.75, 0.75, 0.15, [0.82, 0.66, 0.52]); B.box('wood', cx, cg2 + 0.7, cz, 0.9, 0.06, 0.8, 0.15, [0.7, 0.56, 0.46]);
        B.solid = false; B.geom('snowcap', lump, M4(cx, cg2 + 0.78, cz, 0.15, 0.42, 0.1, 0.36), null, 1); B.solid = true;
        // the snowy rocks by it (the walking map's blocks)
        for (const [rx, ry_, s_] of [[843, 612, 0.55], [838, 729, 0.5], [872, 753, 0.75]]) { B.geom('rock', K.rockG[(rx + ry_) % 3], M4(X(rx), TH(rx, ry_) - 0.1, Z(ry_), rx * 0.1, s_, s_ * 0.8, s_), null, 1); B.solid = false; B.geom('snowcap', lump, M4(X(rx), TH(rx, ry_) + s_ * 0.45, Z(ry_), 0, s_ * 0.8, 0.18, s_ * 0.7), null, 1); B.solid = true; }
        K.light(870, 690, 70, 0.3, 'moon');
      }

      // ---- the rock columns: the painting's masses round the river and along the pass's sides, and more past it ----
      {
        const M = [
          // the painting: north-west highland and its cliff over the river
          [300, 160, 7.5, 5.5, 26, 2.5, 6.0, 1], [100, 60, 3.6, 2.4, 8, 2.5, 4.5, 2], [520, 270, 4.0, 2.6, 10, 2.5, 4.8, 3], [640, 330, 1.8, 1.4, 4, 2.2, 3.6, 4],
          // south-west: the big mass and the smaller ones
          [150, 600, 6.0, 4.6, 20, 2.6, 5.5, 5], [440, 575, 1.4, 1.2, 3, 1.8, 3.0, 6], [500, 720, 2.2, 1.6, 4, 1.6, 3.0, 7], [360, 830, 2.6, 1.2, 4, 1.4, 2.6, 8],
          [600, 850, 1.6, 1.2, 3, 1.6, 2.8, 9], [260, 860, 1.4, 1.0, 2, 1.4, 2.4, 10], [40, 920, 2.4, 2.0, 5, 2.0, 4.0, 11],
          // north-east: the mass round the falls, and east of them
          [1060, 200, 6.0, 7.0, 30, 2.8, 6.5, 12], [1470, 260, 2.8, 8.0, 22, 2.8, 6.0, 13], [1320, 60, 1.6, 2.0, 5, 2.4, 4.0, 14],
          [960, 410, 2.4, 0.9, 5, 1.4, 2.6, 15], [920, 290, 1.4, 1.6, 3, 2.4, 4.0, 16],
          // south-east: by the river going south, and beyond
          [1110, 640, 2.2, 3.2, 8, 2.4, 4.6, 17], [1320, 580, 1.4, 2.6, 5, 2.4, 4.0, 18], [1050, 800, 2.6, 3.0, 8, 2.2, 4.2, 19], [1360, 940, 2.4, 2.0, 5, 2.0, 3.6, 20],
          [1500, 1000, 1.6, 1.6, 3, 2.0, 3.4, 21],
          // past the painting: the rock rising on either side of the pass, and masses here and there
          [-500, 0, 6, 4, 14, 3, 6, 30], [-900, 520, 4, 3, 8, 2.5, 4.5, 31], [-1100, -350, 5, 4, 10, 3, 5.5, 32], [-300, -500, 5, 4, 10, 3, 5.5, 33],
          [-700, 1150, 5, 3.6, 10, 2.5, 5, 34], [-200, 1500, 4, 3, 8, 2.5, 4.5, 35], [300, 1250, 4, 3, 8, 2.2, 4.2, 36], [1200, 1550, 4, 3, 8, 2.5, 4.5, 37],
          [1700, 1700, 4, 3, 8, 2.5, 4.5, 38], [2500, 1150, 5, 4, 10, 3, 5.5, 39], [2600, 400, 6, 5, 14, 3, 6, 40], [2100, -300, 6, 5, 14, 3, 6, 41],
          [1700, -500, 4, 3, 8, 3, 5, 42], [1150, -600, 4, 3, 8, 2.5, 4.5, 43], [400, -300, 4, 3, 8, 2.5, 4.5, 44], [1900, 500, 4, 3, 8, 2.5, 4.5, 45],
          [2300, 900, 3, 2.5, 6, 2.5, 4.5, 46], [-1200, 900, 4, 3, 8, 2.5, 4.5, 47], [2800, -350, 4, 3, 8, 3, 5, 48], [1450, -230, 2.4, 2.4, 6, 3, 5, 49],
        ];
        for (const [cx, cy, rx, ry, n, h0, h1, sd] of M) massif(cx, cy, rx, ry, n, h0, h1, 500 + sd, offIce);
        // the cliffs along the river: a row of tall columns on its north bank (west reach) and round the falls' pool
        const r = W.rand(808);
        for (let x0 = 180; x0 < 640; x0 += 30 + r() * 20) { let n = 0, yb = 0; for (const [x, nb] of WR) if (Math.abs(x - x0) < 120) { yb += nb; n++; } yb = n ? yb / n : 330; const qy = yb - 20 - r() * 12; if (offIce(x0, qy)) continue; column(x0, qy, 1.2 + r() * 0.8, 2.6 + r() * 2.4, r() * TAU, Math.floor(r() * 1e4)); }
        for (let x0 = 900; x0 < 1200; x0 += 32 + r() * 18) { const qy = 380 - 8 * Math.sin(x0 * 0.01) - r() * 14; if (offIce(x0, qy)) continue; column(x0, qy, 1.2 + r() * 0.8, 3.0 + r() * 2.8, r() * TAU, Math.floor(r() * 1e4)); }
        // and the north edge of the plateau where it stands over the road
        for (let y0 = -110; y0 < 300; y0 += 34 + r() * 16) { const qx = 968 + r() * 30 + (y0 < 0 ? -y0 * 0.25 : 0); if (offPath(qx, y0)) continue; column(qx, y0, 1.3 + r() * 0.7, 2.8 + r() * 2.0, r() * TAU, Math.floor(r() * 1e4)); }
        // the jams of rock where the river leaves the open ground (west, and south-east)
        for (let i = 0; i < 14; i++) { const qx = -1330 - r() * 60, qy = 240 + r() * 150; column(qx, qy, 1.4 + r() * 1.0, 1.6 + r() * 2.6, r() * TAU, Math.floor(r() * 1e4)); }
        for (let i = 0; i < 12; i++) { const qx = 2790 + r() * 80, qy = 1540 + r() * 110; column(qx, qy, 1.3 + r() * 1.0, 1.5 + r() * 2.4, r() * TAU, Math.floor(r() * 1e4)); }
        K.addBlock(W.rectPoly([-1400, 230, -1326, 410])); K.addBlock(W.rectPoly([2786, 1500, 2910, 1680]));
        // the cliff the still river comes out of, north of the falls
        for (let i = 0; i < 9; i++) { const qx = 1200 + i * 18 + r() * 10, qy = -350 - r() * 40; column(qx, qy, 1.5 + r() * 0.8, 4.0 + r() * 2.5, r() * TAU, Math.floor(r() * 1e4), { base: 4.6 }); }
      }

      B = K.B;   // (the falls and the grotto glow)
      // ---- the frozen falls: curtains of ice columns down the two steps from the still river, the ledge between, the
      // pool at their foot; the grotto behind the lower curtain, its way in at the east end ----
      {
        const r = W.rand(909);
        // a curtain of hanging ice: tapering columns from `top` down to `bot` (metres) along x0..x1 at y (px)
        // (thin tapering columns, pale, two rows deep; the longest reach the foot, and short stubs of ice stand under
        // the shorter ones)
        const curtain = (x0, x1, yy, top, bot, step, gapFrom) => {
          for (const row of [0, 1]) for (let qx = x0 + row * step * 0.5; qx < x1; qx += step * (0.7 + r() * 0.6)) {
            if (gapFrom != null && qx > gapFrom) continue;
            const w = 0.14 + r() * 0.2, len = Math.min(top - bot, (top - bot) * (row ? 0.35 + r() * 0.4 : 0.6 + r() * 0.42)), x = X(qx), z = Z(yy + (row ? -7 : 0) + (r() - 0.5) * 5), k = 1.25 + r() * 0.3;
            const cg = new THREE.ConeGeometry(w, len, 6, 1); cg.rotateX(Math.PI);
            B.geom('icefall', cg, M4(x, top - len / 2, z, r() * TAU, 1, 1, 1), [k, k * 1.04, k * 1.12], [w * 4, len]); cg.dispose();
            if (len < top - bot - 0.6 && r() < 0.6) { const sh = Math.min(0.9, (top - bot - len) * 0.5), sg = new THREE.ConeGeometry(w * 1.3, sh, 6, 1); B.geom('icefall', sg, M4(x, bot + sh / 2, z, r() * TAU, 1, 1, 1), [k, k * 1.04, k * 1.1], [w * 4, sh]); sg.dispose(); }
          }
        };
        // the upper step (river to ledge) and the lower step (ledge to pool); the lower one's west part stands out from
        // the rock, the grotto behind it
        curtain(1214, 1392, 168, 4.4, 1.3, 6);
        curtain(1344, 1394, 372, 1.5, -2.35, 5.5);
        curtain(1226, 1340, 396, 1.45, -2.35, 5.5, 1300);
        // the ledge's lip, and the rock over the grotto: a slab, high (nothing solid at her height)
        B.solid = false;
        B.box('cliff', X(1272), 1.0, Z(375), X(1330) - X(1214), 0.55, (398 - 352) * SZ + 0.3, 0, [0.85, 0.88, 0.95]);
        B.geom('snowcap', lump, M4(X(1270), 1.6, Z(378), 0, 2.6, 0.2, 1.2), null, 1.4);
        // the faces of the steps behind the ice (rock), and the falls' frozen sheet on the steep ground
        B.box('cliff', X(1300), -2.4, Z(349), X(1400) - X(1200), 3.8, 0.4, 0, [0.7, 0.72, 0.8]);
        B.box('icefall', X(1300), 1.3, Z(186), X(1396) - X(1210), 2.95, 0.3, 0, [1.25, 1.3, 1.42]);
        B.box('icefall', X(1370), -2.35, Z(362), X(1398) - X(1342), 3.8, 0.25, 0, [1.15, 1.2, 1.32]);
        B.solid = true;
        K.addBlock(W.rectPoly([1214, 386, 1300, 402])); K.addBlock(W.rectPoly([1338, 360, 1398, 380]));
        // the grotto: a faint glow off the ice, and an old lantern frozen into the ice at the back, cold
        K.halo(X(1262), -1.2, Z(368), 3.0, [0.18, 0.3, 0.5]); K.light(1262, 380, 90, 0.5, 'moon');
        B.box('iron', X(1250), -2.3, Z(358), 0.24, 0.04, 0.24, 0.5); B.box('glass', X(1250), -2.26, Z(358), 0.18, 0.26, 0.18, 0.5, [0.35, 0.45, 0.6]); B.box('iron', X(1250), -2.0, Z(358), 0.26, 0.05, 0.26, 0.5);
        for (let i = 0; i < 7; i++) { const qx = 1236 + r() * 76, cg = new THREE.ConeGeometry(0.06 + r() * 0.06, 0.4 + r() * 0.6, 5, 1); cg.rotateX(Math.PI); B.solid = false; B.geom('icefall', cg, M4(X(qx), 0.45, Z(360 + r() * 30), 0, 1, 1, 1), null, 1); B.solid = true; cg.dispose(); }
        K.halo(X(1300), 2.5, Z(260), 5.0, [0.14, 0.2, 0.34]); K.halo(X(1300), 4.6, Z(150), 4.0, [0.12, 0.18, 0.3]);
      }

      B = FAR;   // (from here on)
      // ---- snow poles: tall marker poles beside the road past the painting, so the way shows under snow ----
      {
        let side = 1;
        for (const rd of ROADS) for (let i = 1; i < rd.pts.length; i++) {
          const [ax, ay] = rd.pts[i - 1], [bx, by] = rd.pts[i], L = Math.hypot((bx - ax) * SX, (by - ay) * SZ);
          for (let s = 8; s < L; s += 15) {
            const f = s / L, cx = ax + (bx - ax) * f, cy = ay + (by - ay) * f; if (cy > -40 && cy < 1064) continue;
            const w = rd.w[i] + 1.3, nx = -(by - ay) * SZ / L, nz = (bx - ax) * SX / L, qx = cx + nx * w * side / SX, qy = cy + nz * w * side / SZ; side = -side;
            if (trailDist(qx, qy) < 2) continue;
            const x = X(qx), z = Z(qy), g = TH(qx, qy);
            B.box('wood', x, g - 0.3, z, 0.09, 2.9, 0.09, 0, [0.75, 0.62, 0.52]);
            B.solid = false; B.box('wood', x, g + 2.05, z, 0.1, 0.35, 0.1, 0, [1.6, 0.4, 0.3]); B.box('wood', x, g + 1.45, z, 0.1, 0.25, 0.1, 0, [1.6, 0.4, 0.3]); B.solid = true;
            K.addBlock(K.circlePx(qx, qy, 0.12, 6));
          }
        }
      }

      // ---- bare bushes with snow along their twigs ----
      const shrub = (x0, y0, s, seed) => {
        const r = W.rand(seed), x = X(x0), z = Z(y0), g = TH(x0, y0) - 0.05, col = [0.6, 0.52, 0.52];
        for (let i = 0; i < 8; i++) {
          const a = i / 8 * TAU + r(), up = 0.6 + r() * 0.7, L = (0.6 + r() * 0.5) * s, d = norm([Math.cos(a) * 0.5, up, Math.sin(a) * 0.5]), tip = add([x, g, z], mul(d, L));
          seg([x, g, z], tip, 0.035 * s, 0.01, 3, col, 'bark');
          const m = add([x, g, z], mul(d, L * 0.6)), d2 = norm(add(d, [(r() - 0.5) * 1.2, 0.3, (r() - 0.5) * 1.2])); seg(m, add(m, mul(d2, L * 0.5)), 0.02 * s, 0.006, 3, col, 'bark');
        }
        B.solid = false; B.geom('snowcap', lump, M4(x, g + 0.05, z, 0, 0.55 * s, 0.18, 0.5 * s), null, 1); B.solid = true;
      };
      {
        const SH = [[930, 590, 1.2], [975, 615, 1.1], [1010, 690, 1.0], [560, 600, 1.1], [610, 570, 0.8], [940, 770, 0.9], [1150, 760, 1.1], [650, 830, 0.9], [890, 850, 1.0],
          [720, 220, 0.9], [905, 250, 1.0], [470, 250, 0.9], [1130, 360, 1.0], [600, 980, 1.0], [880, 960, 1.0], [200, 960, 0.9], [940, 300, 0.8], [280, 470, 0.9],
          [-200, 600, 1.2], [1500, 1300, 1.1], [600, 1400, 1.0], [1000, -300, 1.0], [400, -700, 1.1], [2200, 1100, 1.1], [-600, -200, 1.0], [2600, 1700, 1.0]];
        for (const [i, [x0, y0, s]] of SH.entries()) if (!onWalk(x0, y0, 6)) shrub(x0, y0, s, 70 + i);
      }

      // ---- snow mounds: soft heaps along the road's edges and round the rocks ----
      {
        const r = W.rand(313);
        for (let i = 0; i < 160; i++) {
          const x0 = -600 + r() * 2800, y0 = -600 + r() * 2300, s = 0.6 + r() * 0.9;
          if (offIce(x0, y0) || riverDist(x0, y0) < 2 || (x0 > FALLS[0] - 30 && x0 < FALLS[2] + 30 && y0 > FALLS[1] - 30 && y0 < FALLS[3] + 10)) continue;
          B.solid = s > 1.0; B.geom('snowcap', K.ico[i % 3], M4(X(x0), TH(x0, y0) - s * 0.25, Z(y0), r() * TAU, s, s * 0.45, s * 0.85), null, 1.5); B.solid = true;
          if (s > 1.0) K.addBlock(K.circlePx(x0, y0, s * 0.6, 8));
        }
      }

      // ---- the old wayhouse by the north road: four walls of stone, its roof fallen in (a few rafters left), its door
      // on the east toward the road, snow drifted inside, a cold hearth ----
      {
        const [cx, cy] = WAYHOUSE.c, x = X(cx), z = Z(cy), w = WAYHOUSE.w, d = WAYHOUSE.d, base = roadLevel(cy) + 0.35, T_ = 0.5, r = W.rand(23);
        const wall = (x0, z0, x1, z1, hgt, gapAt, gapW) => {
          const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(2, Math.round(L / 0.7)), ry = Math.atan2(-(z1 - z0), x1 - x0);
          for (let i = 0; i < n; i++) {
            const f = (i + 0.5) / n; if (gapAt != null && Math.abs(f * L - gapAt) < gapW / 2) continue;
            const hh = hgt(f) + r() * 0.15, qx = x0 + (x1 - x0) * f, qz = z0 + (z1 - z0) * f;
            B.box('stone', qx, base - 0.4, qz, L / n + 0.02, hh + 0.4, T_, ry, [0.9 + r() * 0.1, 0.9, 0.96], { u0: i * L / n });
            if (r() < 0.6) { B.solid = false; B.box('snowcap', qx, base + hh, qz, L / n * 0.9, 0.08, T_ * 0.9, ry, null); B.solid = true; }
          }
        };
        const x0 = x - w / 2, x1 = x + w / 2, z0 = z - d / 2, z1 = z + d / 2;
        wall(x0, z0, x1, z0, (f) => 2.2 + 1.0 * (1 - Math.abs(f - 0.5) * 2));            // the north wall's gable, broken
        wall(x0, z1, x1, z1, (f) => 1.6 + 0.6 * f);
        wall(x0, z0 + 0.25, x0, z1 - 0.25, (f) => 2.0 - 0.8 * f);
        wall(x1, z0 + 0.25, x1, z1 - 0.25, () => 2.1, d / 2, 1.2);                       // the door, east
        B.solid = false;
        for (const [i, f] of [0.2, 0.55, 0.85].entries()) { const rz = z0 + d * f; seg([x0 + 0.1, base + 2.0 - i * 0.2, rz], [x1 - 0.6 - i * 0.4, base + 0.3 + i * 0.6, rz + 0.2], 0.08, 0.07, 5, [0.6, 0.5, 0.45], 'wood'); }
        B.box('stone', x0 + 0.55, base, z0 + 0.6, 0.9, 1.1, 0.6, 0, [0.8, 0.78, 0.82]); B.box('soil', x0 + 0.55, base + 0.2, z0 + 0.92, 0.5, 0.45, 0.04, 0, [0.12, 0.1, 0.1]);
        B.geom('snowcap', K.ico[1], M4(x - 0.4, base - 0.2, z + 0.5, 0, 1.4, 0.45, 1.2), null, 1.5);
        B.solid = true;
        K.addBlock(K.circlePx(px(x0 + 0.55), py(z0 + 0.6), 0.5, 8));
        K.shadeMarks.push(['rect', px(x0), py(z0), px(x1), py(z1), 0.68]);
      }

      // ---- the natural rock arch over the river's gorge: two masses on the banks, a span of rock between, high ----
      {
        const ax = ARCH.x, r = W.rand(37); let nb = 0, sb = 0; for (let i = 1; i < WR.length; i++) if (WR[i][0] >= ax) { const [xa, na, sa] = WR[i - 1], [xb, nbb, sbb] = WR[i], f = (ax - xa) / (xb - xa); nb = na + (nbb - na) * f; sb = sa + (sbb - sa) * f; break; }
        const lv = westLevel(ax);
        for (const [yy, dir] of [[nb - 30, -1], [sb + 30, 1]]) { for (let i = 0; i < 6; i++) column(ax + (r() - 0.5) * 110, yy + dir * r() * 50, 1.6 + r() * 0.8, 4.5 + r() * 2.5, r() * TAU, Math.floor(r() * 1e4), { base: lv + 0.4 }); }
        B.solid = false;
        const NA = 9, za = Z(nb - 30), zb = Z(sb + 30);
        for (let i = 0; i <= NA; i++) { const t = i / NA, zz = za + (zb - za) * t, yy = lv + 5.2 + 1.6 * Math.sin(Math.PI * t), s = 1.5 + r() * 0.5; B.geom('rock', K.rockG[i % 3], M4(X(ax) + (r() - 0.5) * 0.6, yy, zz, r() * TAU, s * 1.2, s * 0.8, s), [0.9, 0.92, 1.0], 1.6); if (r() < 0.8) B.geom('snowcap', lump, M4(X(ax), yy + s * 0.55, zz, 0, s * 0.8, 0.25, s * 0.7), null, 1.2); }
        // icicles hanging under it
        for (let i = 0; i < 12; i++) { const t = 0.2 + r() * 0.6, zz = za + (zb - za) * t, yy = lv + 4.6 + 1.6 * Math.sin(Math.PI * t), len = 0.6 + r() * 1.2, cg = new THREE.ConeGeometry(0.08 + r() * 0.1, len, 5, 1); cg.rotateX(Math.PI); B.geom('icefall', cg, M4(X(ax) + (r() - 0.5) * 2, yy - len / 2, zz, 0, 1, 1, 1), null, 1); cg.dispose(); }
        B.solid = true;
      }

      // ---- the broken cart on the frozen pool's north shore: tipped on its side, a wheel off, half under snow ----
      {
        const [cx, cy] = CART.at, x = X(cx), z = Z(cy), g = TH(cx, cy), ry = 0.35, col = [0.78, 0.64, 0.52];
        B.geom('planks', new THREE.BoxGeometry(2.4, 0.08, 1.3), M4(x, g + 0.55, z, ry, 1, 1, 1, 0, 0.5), col, 1);
        B.geom('planks', new THREE.BoxGeometry(2.4, 0.5, 0.06), M4(x - 0.3, g + 0.85, z - 0.6, ry, 1, 1, 1, 0, 0.5), col, 1);
        B.geom('planks', new THREE.BoxGeometry(2.4, 0.5, 0.06), M4(x + 0.3, g + 0.25, z + 0.6, ry, 1, 1, 1, 0, 0.5), col, 1);
        const wg = new THREE.TorusGeometry(0.5, 0.06, 4, 12); B.geom('wood', wg, M4(x + 1.0, g + 0.5, z + 0.9, ry, 1, 1, 1, 0, 0), col, 1); B.geom('wood', wg, M4(x - 1.6, g + 0.06, z - 0.3, 0.2, 1, 1, 1, Math.PI / 2, 0), col, 1); wg.dispose();
        B.solid = false; B.box('wood', x + 1.8, g + 0.2, z + 0.3, 1.8, 0.08, 0.08, ry + 0.5, col); B.geom('snowcap', K.ico[0], M4(x, g + 0.1, z, ry, 1.6, 0.4, 1.0), null, 1.4); B.solid = true;
        K.addBlock(K.circlePx(cx, cy, 1.35, 10));
      }

      // ---- pocket: the hollow among the rocks west of the lamp, its way in round the back (south-west) behind a pine;
      // the Pass Bell in the snow in it; the lamp's light just reaches it ----
      {
        const [cx, cy] = BELL.c, R = BELL.r, gap = 2.36, r = W.rand(57);
        for (let i = 0; i < 11; i++) {
          const a = gap + 0.68 + (TAU - 1.36) * i / 10, d = R + 0.7, qx = cx + Math.cos(a) * d / SX, qy = cy + Math.sin(a) * d / SZ;
          column(qx, qy, 1.1 + r() * 0.5, 1.8 + r() * 1.6, r() * TAU, Math.floor(r() * 1e4), { solid: false });
        }
        ringBlock(BELL.c, R - 0.05, R + 1.4, gap, 0.38);
        // icicles off the tallest rocks' lips, over the hollow
        for (let i = 0; i < 8; i++) { const a = gap + 1.2 + r() * 3.6, d = R + 0.1, qx = cx + Math.cos(a) * d / SX, qy = cy + Math.sin(a) * d / SZ, len = 0.4 + r() * 0.7, cg = new THREE.ConeGeometry(0.05 + r() * 0.05, len, 5, 1); cg.rotateX(Math.PI); B.solid = false; B.geom('icefall', cg, M4(X(qx), TH(qx, qy) + 1.7 - len / 2, Z(qy), 0, 1, 1, 1), null, 1); B.solid = true; cg.dispose(); }
        K.light(cx + 30, cy, 70, 0.35, 'warm');
      }

      // ---- the mist: low banks lying in the hollows and over the ice (soft glows, drawn last) ----
      {
        const MIST = [[60, 820, 9], [150, 960, 9], [1250, 780, 10], [1150, 880, 9], [1400, 700, 8], [300, 360, 8], [1050, 470, 8], [-500, 300, 10], [-1100, 300, 10],
          [ARCH.x, 300, 8], [1600, 1250, 10], [POOL.c[0], POOL.c[1], 12], [2600, 1550, 10], [-600, 900, 10], [-300, 1600, 10], [400, 1400, 9], [1300, 1700, 10],
          [2200, 600, 10], [2500, -100, 10], [1700, -300, 10], [1270, -150, 8], [400, -500, 10], [-900, -400, 10], [1000, -700, 9], [2700, 1200, 9]];
        for (const [x0, y0, s] of MIST) K.halo(X(x0), TH(x0, y0) + s * 0.08, Z(y0), s, [0.15, 0.18, 0.3]);
      }
      lump.dispose(); for (const g of colG) g.dispose();
    },
  };
})(window);
