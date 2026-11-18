// dawnroost-road.js: the forest road to Dawnroost in 3D. Its painting (reference/art/walk/wilds/walk-dawnroost-forest-road.png,
// 1536 x 1024) is the middle, laid out in the painting's own pixels as src/game/maps.js keeps the walking map: the old
// Warm Road's mossy flagstones running north through the forest, the iron lantern on its post and the milestone carved
// with a sun beside it, the trail west to the still pool under the great oak (its flat stones, reeds and lily pads, the
// arm north between its boulders and the oak's roots), the trail east to the woodcutter's clearing (the lean-to of split
// logs, the firewood stack under it, the chopping block and its axe, the split logs, a loose log), the big fallen mossy
// log with its shelf mushrooms, the painting's oaks, firs, birches and mossy boulders, and the violet and orange
// undergrowth. Round it the forest goes on, one painting's width and height each way (Chris, November 16: wild places are
// wide open fields in heavy fog, with pockets to find): rolling ground, clumps of oaks and firs with clearings between,
// the road on north to Dawnroost and south to the Ember Line road, and trails out to places to find: a ring of pale
// mushrooms in a mossy clearing in the west, the charcoal burners' old kiln in the south-west, an old Wardens' sun shrine
// in the north-west (with its lantern), a second milestone on the road north, a stack of felled timber in the east, a
// hollow oak older than the road in the north-east, and a spring under a rock in the south-east. Two pockets hide off the
// trails: a fern hollow ringed by boulders west of the pool (its way in on the west, round the back), and the woodcutter's
// cache behind the lean-to, ringed by bramble (its way in on the north). No keepsake lies here.
// Where Io can walk: the walking map's own walk and block areas, unchanged, plus all the open ground inside open.bounds,
// less the water and everything solid (every trunk and the firs' low boughs, the boulders, the bushes, the logs, the
// lean-to and its stack, the kiln, the shrine, the stones, the thicket the engine grows along the open ground's edge).
// The texture ids are the texture pack's (texture-packs/wilds-south/dawnroost-road/inventory.md), with the group's
// shared ones where they were made (ember-line-road, warm-roads-camp) and the jetty's dark water for the pool.
// Heights are metres: the painting is level at 0 (the pool lies 0.3 below it); past the painting the ground rolls (about
// 2 m up and down), gentler along the road and the trails, and the places to find sit on level ground.
(function (G) {
  'use strict';
  const P = G.W3D_PLACES = G.W3D_PLACES || {};
  const ID = 'dawnroost-road';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ss = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const SX = 0.04, SZ = 0.05;
  const rnd = (seed) => { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1e6) / 1e6; }; };
  const inPoly = (poly, x, y) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
  const edgeDist = (poly, x, y) => { let d = 1e9; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [ax, ay] = poly[j], [bx, by] = poly[i], dx = bx - ax, dy = by - ay, t = clamp(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1), 0, 1); d = Math.min(d, Math.hypot(x - ax - t * dx, y - ay - t * dy)); } return d; };
  const mDist = (ax, ay, bx, by) => Math.hypot((ax - bx) * SX, (ay - by) * SZ);

  // ---- the road on past the painting (the old Warm Road's flagstones), and the trails (earth): centre lines in pixels,
  // half widths in metres ----
  const ROAD = [
    { id: 'north', w: 2.7, pts: [[756, 30], [748, -100], [716, -230], [692, -360], [712, -500], [758, -640], [784, -770]] },
    { id: 'south', w: 2.7, pts: [[1014, 1000], [1030, 1130], [1012, 1270], [962, 1400], [936, 1540], [958, 1680], [990, 1786]] },
  ];
  const TRAILS = [
    { id: 'west', w: 0.85, pts: [[214, 540], [120, 562], [0, 580], [-150, 600], [-300, 588], [-462, 566]] },
    { id: 'charcoal', w: 0.75, pts: [[-560, 642], [-575, 800], [-610, 950], [-640, 1100], [-650, 1236]] },
    { id: 'shrine', w: 0.75, pts: [[694, -400], [600, -462], [492, -540], [410, -590]] },
    { id: 'loop', w: 0.75, pts: [[152, 236], [70, 150], [10, 40], [-50, -100], [-30, -260], [80, -420], [240, -560], [330, -604]] },
    { id: 'east', w: 0.85, pts: [[1340, 410], [1450, 446], [1600, 436], [1750, 404], [1900, 414], [2030, 410]] },
    { id: 'oak', w: 0.75, pts: [[2030, 410], [2080, 250], [2060, 40], [2000, -160], [1966, -340]] },
    { id: 'oak-road', w: 0.75, pts: [[1966, -340], [1820, -372], [1700, -520], [1400, -640], [1100, -662], [880, -642], [790, -640]] },
    { id: 'spring', w: 0.75, pts: [[1030, 1180], [1200, 1232], [1380, 1270], [1550, 1310], [1700, 1380], [1806, 1412]] },
  ];
  // a band either side of a centre line, `hw` metres from it
  const ribbon = (pts, hw) => {
    const L = [], R = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      let dx = (b[0] - a[0]) * SX, dz = (b[1] - a[1]) * SZ; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
      L.push([Math.round(pts[i][0] - dz * hw / SX), Math.round(pts[i][1] + dx * hw / SZ)]);
      R.push([Math.round(pts[i][0] + dz * hw / SX), Math.round(pts[i][1] - dx * hw / SZ)]);
    }
    return L.concat(R.reverse());
  };
  const segDist = (x, y, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], t = clamp(((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy || 1), 0, 1); return Math.hypot(x - a[0] - t * dx, y - a[1] - t * dy); };
  const lineDist = (L, x, y) => { let d = 1e9; for (const t of L) for (let i = 1; i < t.pts.length; i++) d = Math.min(d, segDist(x, y, t.pts[i - 1], t.pts[i])); return d; };
  const trailDist = (x, y) => Math.min(lineDist(TRAILS, x, y), lineDist(ROAD, x, y) - 50);

  // ---- the places to find, the two pockets, and the pool ----
  const FAIRY = { c: [-560, 560], r: 3.6 };                       // the ring of pale mushrooms
  const KILN = { c: [-650, 1330], r: 2.1 };                       // the charcoal burners' old kiln, its mouth to the north
  const SHRINE = { at: [372, -650] };                             // the Wardens' sun shrine, facing south over its clearing
  const STONE2 = { at: [588, -300] };                             // the second milestone, on the road's west verge
  const FELLED = { c: [2120, 472] };                              // the felled timber, beside the east trail's bend
  const OAK = { c: [1966, -446], r: 1.9 };                        // the hollow oak, its hollow facing south
  const SPRING = { c: [1880, 1376], rx: 58, ry: 40 };             // the spring under its rock
  const FERN = { c: [-200, 240], r: 3.0, gap: Math.PI };          // pocket: the fern hollow, its way in on the west
  const CACHE = { c: [1572, 252], r: 2.7, gap: -Math.PI / 2 };    // pocket: the woodcutter's cache, its way in on the north
  // the level ground each place sits on: [x, y, radius (m)]
  const FLATS = [[FAIRY.c[0], FAIRY.c[1], 6], [KILN.c[0], KILN.c[1] - 20, 6.5], [SHRINE.at[0], SHRINE.at[1] + 40, 5.5], [FELLED.c[0] - 40, FELLED.c[1] - 20, 6.5],
    [OAK.c[0], OAK.c[1] + 30, 5.5], [SPRING.c[0] - 30, SPRING.c[1], 6.5], [FERN.c[0], FERN.c[1], 5], [CACHE.c[0], CACHE.c[1], 4.5], [STONE2.at[0], STONE2.at[1], 2.5]];
  const ellipse = (c, rx, ry, n, wob) => Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2, k = 1 + (wob || 0) * Math.sin(a * 3 + 1.3) * Math.cos(a * 2); return [Math.round(c[0] + Math.cos(a) * rx * k), Math.round(c[1] + Math.sin(a) * ry * k)]; });
  // the still pool under the great oak, traced from the painting (kept off the walking map's flat stones and trails)
  const POOL = [[164, 328], [204, 327], [214, 312], [245, 308], [290, 309], [326, 306], [346, 314], [360, 340], [384, 356], [396, 380], [390, 402], [370, 418],
    [358, 444], [338, 470], [316, 490], [288, 500], [250, 502], [218, 494], [198, 476], [182, 450], [173, 420], [170, 390], [164, 358], [160, 340]];
  const SPRINGP = ellipse(SPRING.c, SPRING.rx, SPRING.ry, 16, 0.12);

  // ---- the ground ----
  const W3D = () => G.W3D;
  const vn = (x, y) => (W3D() ? W3D().vnoise(x, y) : 0.5);
  const roll = (x, y, t) => (vn(x / 420, y / 420) - 0.5) * 4.4 + t * (vn(x / 140, y / 140) - 0.5) * 1.2;
  function base(x, y) {
    const out = Math.hypot(Math.max(0, -x, x - 1536), Math.max(0, -y, y - 1024)), k = ss(0, 300, out);
    return k > 0 ? k * roll(x, y, ss(25, 90, trailDist(x, y))) : 0;
  }
  const flatH = FLATS.map(() => null);
  // the ground's height under any point (metres)
  function ground(x, y) {
    let h = base(x, y);
    for (let i = 0; i < FLATS.length; i++) {
      const [fx, fy, fr] = FLATS[i], d = mDist(x, y, fx, fy);
      if (d < fr + 6) { if (flatH[i] == null) flatH[i] = base(fx, fy); h += (flatH[i] - h) * (1 - ss(fr, fr + 6, d)); }
    }
    return h;
  }
  const springLevel = () => ground(SPRING.c[0], SPRING.c[1]) - 0.3;

  // ---- the painting's boulders: [x, y, size] (walk pass 2: the one at 433, 382 three pixels west, off the 2D walk's edge) ----
  const ROCKS = [
    [257, 190, 1.7], [121, 385, 1.8], [150, 470, 1.4], [22, 52, 1.4], [20, 465, 1.2], [742, 305, 0.8], [446, 225, 1.1], [532, 245, 1.2], [618, 378, 1.4],
    [433, 382, 1.0], [410, 452, 1.7], [418, 690, 1.9], [603, 772, 1.9], [618, 590, 1.5], [628, 664, 1.0], [518, 884, 1.7], [232, 892, 1.3], [165, 588, 1.1],
    [815, 872, 0.6], [1092, 165, 1.8], [1100, 236, 1.2], [1260, 498, 1.0], [1348, 748, 1.3], [1190, 985, 1.6], [1052, 692, 0.65], [1350, 980, 0.9],
    [880, 140, 0.9], [940, 60, 0.7],
    // round the pool's rim, where the painting has them (the engine lays none there). Walk pass 2: the one on the west rim
    // was on the flat stone the 2D walk crosses, now on the round stone below it; the south one four pixels north, off the
    // stepping stones
    [380, 352, 0.75], [398, 410, 0.85], [364, 470, 0.7], [150, 334, 0.6], [168, 430, 0.75], [196, 492, 0.6], [334, 502, 0.6],
  ];
  // the painting's own great trees, and some past it: [x, y (where the trunk stands), size, kind (0 oak, 1 fir), seed]
  const BIG = [
    [588, 292, 2.4, 0, 11], [345, 178, 1.8, 0, 21], [100, 108, 1.9, 0, 22], [158, 992, 2.2, 0, 23], [325, 940, 1.5, 0, 24], [1440, 1000, 2.0, 0, 25],
    [1528, 470, 1.6, 0, 26], [1285, 150, 1.7, 0, 27], [862, 985, 1.2, 1, 28],   // (walk pass 2: this fir stood on the cobbled road; now in the dark growth west of it)
    [50, 700, 1.3, 1, 31], [612, 960, 1.4, 1, 32], [1165, 800, 0.8, 1, 33], [1050, 330, 0.75, 1, 34], [745, 832, 0.7, 1, 35], [436, 604, 0.7, 1, 36],
    [1500, 600, 1.3, 1, 37], [1500, 360, 1.3, 1, 38],
    // past the painting: great oaks along the road and by the places to find
    [560, -180, 2.3, 0, 41], [920, -420, 2.1, 0, 42], [470, -380, 1.9, 0, 43], [1180, 1160, 2.2, 0, 44], [820, 1340, 2.0, 0, 45], [1150, 1560, 1.9, 0, 46],
    [-380, 420, 2.1, 0, 47], [-760, 700, 2.0, 0, 48], [2250, 300, 2.1, 0, 49], [1700, -300, 2.0, 0, 50], [-500, 1450, 1.9, 0, 51], [2050, 1250, 1.9, 0, 52],
  ];
  const BIRCHES = [[40, 340, 1.0], [530, 742, 1.0], [1470, 205, 1.05], [24, 872, 0.9], [860, -120, 1.0], [612, -520, 1.1], [1120, 1420, 1.0], [-260, 520, 1.0],
    [1640, 470, 0.95], [-420, 680, 1.0], [2180, -120, 1.0]];

  // where Io may roam: the open forest's edge (the woods close it in); the road's ends are the ways on
  const BOUNDS = [[-1150, 300], [-1180, -100], [-1100, -500], [-800, -700], [-300, -740], [200, -760], [650, -760], [720, -772], [850, -772], [1300, -770],
    [1800, -740], [2300, -760], [2650, -600], [2720, -100], [2680, 400], [2760, 900], [2700, 1400], [2500, 1700], [2000, 1760], [1100, 1770], [1056, 1792],
    [924, 1792], [880, 1770], [300, 1740], [-300, 1780], [-900, 1700], [-1150, 1400], [-1200, 900], [-1150, 500]];

  // ---- the walking map's own walk areas (for keeping things off them), with their boxes ----
  let WB = null;
  const mapWalk = () => WB || (WB = (((G.MAPS || {})[ID] || { walk: [] }).walk).map((p) => { let a = 1e9, b = 1e9, c = -1e9, e = -1e9; for (const [x, y] of p) { a = Math.min(a, x); b = Math.min(b, y); c = Math.max(c, x); e = Math.max(e, y); } return { p, b: [a, b, c, e] }; }));
  const walkDist = (x, y) => { let d = 1e9; for (const q of mapWalk()) { if (inPoly(q.p, x, y)) return 0; if (x > q.b[0] - d && x < q.b[2] + d && y > q.b[1] - d && y < q.b[3] + d) d = Math.min(d, edgeDist(q.p, x, y)); } return d; };
  // pixels from the nearest path: the walking map's, the road on, or a trail (their edges)
  const pathDist = (x, y) => Math.min(walkDist(x, y), lineDist(ROAD, x, y) - 2.7 / SX - 18, lineDist(TRAILS, x, y) - 0.85 / SX - 8);
  // keep-out boxes round the places to find and the pockets
  const PLACES = [[-680, 440, -440, 680], [-780, 1220, -520, 1440], [270, -740, 470, -560], [530, -340, 640, -260], [1980, 400, 2260, 540], [1860, -540, 2070, -340],
    [1760, 1290, 2000, 1460], [-300, 150, -100, 330], [1470, 100, 1670, 335], [1180, 500, 1540, 790], [1150, 140, 1480, 470], [140, 230, 480, 560], [930, 520, 1160, 720]];
  const nearPlace = (x, y, m) => PLACES.some((k) => x > k[0] - (m || 0) && x < k[2] + (m || 0) && y > k[1] - (m || 0) && y < k[3] + (m || 0));
  const nearRock = (x, y, m) => ROCKS.some((r) => mDist(x, y, r[0], r[1]) < r[2] + (m || 0));
  // trees lining the road and the trails past the painting, every so often each side (oaks and firs), so the way is a
  // forest road and not a ride through a field
  const LINING = (() => {
    const out = [], r = rnd(919);
    for (const t of ROAD.concat(TRAILS)) {
      let side = 1;
      for (let i = 1; i < t.pts.length; i++) {
        const [ax, ay] = t.pts[i - 1], [bx, by] = t.pts[i], L = mDist(ax, ay, bx, by);
        for (let s = 2 + r() * 4; s < L; s += 4 + r() * 5) {
          const f = s / L, cx = ax + (bx - ax) * f, cy = ay + (by - ay) * f, nx = -(by - ay) * SZ / L, nz = (bx - ax) * SX / L, off = (t.w + (t.w > 2 ? 1.6 : 1.4) + r() * 2.6) * side;
          const x = Math.round(cx + nx * off / SX), y = Math.round(cy + nz * off / SZ), fir = r() < 0.4, size = fir ? 1.0 + r() * 0.6 : 1.2 + r() * 0.7; side = -side;
          if ((x > -40 && x < 1576 && y > -40 && y < 1064) || pathDist(x, y) < 12 || nearPlace(x, y, 20) || nearRock(x, y, 1.5) || !inPoly(BOUNDS, x, y)) continue;
          if (BIG.some((b) => mDist(x, y, b[0], b[1]) < 5) || out.some((o) => mDist(x, y, o[0], o[1]) < 3.5)) continue;
          out.push([x, y, +size.toFixed(2), fir ? 1 : 0, Math.floor(r() * 1000)]);
        }
      }
    }
    return out;
  })();

  // ---- the undergrowth: violet and orange flowering shrubs and white flowers along the paths' edges ----
  const FLOWERS_ALL = (() => {
    const out = [], r = rnd(4711), kinds = ['violet', 'violet', 'violet', 'sun', 'sun', 'white', 'white', 'mix'];
    const ok = (x, y, rr) => { const d = pathDist(x, y); return d > rr / SX + 6 && d < 130 && !inPoly(POOL, x, y) && edgeDist(POOL, x, y) > 20 && !nearPlace(x, y, 10) && !nearRock(x, y, rr + 0.4) && !BIG.some((b) => mDist(x, y, b[0], b[1]) < 0.4 * b[2] + rr + 0.3); };
    for (let i = 0; i < 900 && out.length < 150; i++) {
      const x = -40 + r() * 1616, y = -40 + r() * 1104, rr = 0.45 + r() * 0.45;
      if (ok(x, y, rr)) out.push([Math.round(x), Math.round(y), +rr.toFixed(2), kinds[Math.floor(r() * kinds.length)]]);
    }
    // and along the road and trails past the painting
    for (const t of ROAD.concat(TRAILS)) for (let i = 1; i < t.pts.length; i++) {
      const [ax, ay] = t.pts[i - 1], [bx, by] = t.pts[i], L = mDist(ax, ay, bx, by);
      for (let s = r() * 6; s < L; s += 7 + r() * 8) {
        const f = s / L, cx = ax + (bx - ax) * f, cy = ay + (by - ay) * f, nx = -(by - ay) * SZ / L, nz = (bx - ax) * SX / L, rr = 0.45 + r() * 0.4;
        const off = (t.w + rr + 0.9 + r() * 2.2) * (r() < 0.5 ? -1 : 1), x = cx + nx * off / SX, y = cy + nz * off / SZ;
        if (x > -40 && x < 1576 && y > -40 && y < 1064) continue;
        if (ok(x, y, rr)) out.push([Math.round(x), Math.round(y), +rr.toFixed(2), kinds[Math.floor(r() * kinds.length)]]);
      }
    }
    // (the engine picks a bush's shape by (x + y) % 3, which is negative north-west of the painting: nudge those)
    for (const f of out) if (f[0] + f[1] < 0) f[0] -= (f[0] + f[1]) % 3;
    return out;
  })();
  // no bush right against a tree's trunk (the two would make one ragged solid with sharp corners that catch her): asked
  // for once the trees are loaded (the engine asks when it builds the place)
  let FLOWERS = null;
  const flowersNow = () => {
    if (FLOWERS) return FLOWERS;
    const T = (G.W3D_TREES || {})[ID];
    const all = (T || []).concat(P[ID].extraTrees || []);
    const out = FLOWERS_ALL.filter(([x, y, rr]) => !all.some(([tx, ty, s]) => Math.abs(tx - x) < 80 && Math.abs(ty - y) < 64 && mDist(x, y, tx, ty) < 0.32 * s + rr + 0.7));
    if (T) FLOWERS = out;
    return out;
  };

  // the painting's lily pads [x, y, radius m]
  const LILIES = [[214, 346, 0.45], [236, 352, 0.4], [300, 356, 0.45], [334, 352, 0.4], [322, 376, 0.42], [366, 392, 0.38], [348, 420, 0.45], [326, 446, 0.4],
    [300, 470, 0.42], [270, 482, 0.38], [228, 470, 0.36], [266, 420, 0.32]];
  // low banks of cold mist lying between the trees: [x, y, size m]
  const MIST = [[120, 640, 8], [400, 820, 8], [1300, 860, 8], [1250, 120, 7], [80, 120, 7], [1460, 700, 7], [-560, 560, 9], [-650, 1330, 9], [372, -620, 8],
    [2120, 470, 9], [1966, -400, 8], [1880, 1376, 8], [-300, 100, 10], [-900, 300, 10], [-800, 1000, 10], [300, 1400, 10], [1400, 1500, 10], [2400, 900, 10],
    [2500, -200, 10], [1300, -400, 9], [200, -700, 10], [-700, -500, 10], [1700, 200, 9], [700, 1150, 9], [2300, 1600, 10], [-200, 1700, 10]];

  P[ID] = {
    id: ID, name: 'The forest road to Dawnroost', painting: "art/walk/walk-dawnroost-forest-road.avif", size: [1536, 1024],
    mapId: ID, paintingPng: 'reference/art/walk/wilds/walk-dawnroost-forest-road.png',
    // the open forest: one painting each way round the painting; where Io may roam inside it (the woods close it in)
    extent: [-1536, -1024, 3072, 2048],
    open: { bounds: BOUNDS },
    // the wall check (tools/walls-test.mjs): from the road at the pool trail's fork, to the start, the lantern, the
    // milestone, the pool's two shores, the great oak, the woodcutter's clearing and the fallen log, both ways on, every
    // place to find and both pockets
    checks: { from: [880, 450], goals: [
      ['the start, where the road comes in from the south', 1000, 970], ['the iron lantern on its post', 960, 640], ['the milestone with the sun', 1070, 716],
      ['the pool’s north rim, on its flat stones', 250, 285], ['the pool’s south shore', 262, 545], ['under the great oak, up the arm', 470, 300],
      ['the woodcutter’s chopping block', 1210, 420], ['the fallen mossy log', 1290, 540],
      ['the way on to Dawnroost (the north exit)', 784, -764], ['the way on to the Ember Line road (the south exit)', 990, 1780],
      ['the ring of pale mushrooms (west)', -560, 560], ['the charcoal burners’ old kiln (south-west)', -650, 1250], ['the old sun shrine (north-west)', 372, -604],
      ['the second milestone (north)', 650, -290], ['the felled timber (east)', 2040, 420], ['the hollow oak (north-east)', 1966, -376], ['the spring (south-east)', 1806, 1410],
      ['in the fern hollow (pocket, west)', -200, 240], ['in the woodcutter’s cache (pocket, east)', 1572, 234]] },
    // the trees: on the painting from the painting itself (oaks and firs); past it in clumps with clearings between, oaks and
    // firs, bigger. None on the pool, the clearings and the places to find; the painting's great trees are set by hand.
    treeGen: { dark: 0.4, step: 50, fir: 0.3, firSouth: 0.3, thorn: 0,
      out: { density: 0.55, clump: 480, clear: 0.34, kinds: [0.6, 0.4, 0], size: [1.15, 1.75] },
      roads: [],
      keepOut: PLACES.concat(ROCKS.map(([x, y, s]) => [x - s / SX * 0.9, y - s / SZ * 0.9, x + s / SX * 0.9, y + s / SZ * 0.9]))
        .concat(BIG.map(([x, y, s, k]) => { const r = (k ? 1.3 : 1.7) * s; return [x - r / SX, y - r / SZ, x + r / SX, y + r / SZ]; }))
        .concat(BIRCHES.map(([x, y]) => [x - 30, y - 24, x + 30, y + 24])) },
    // the ground: the road's mossy flagstones (the walk and the road on), earth on the trails and the verges, the violet
    // undergrowth everywhere else
    ground: { cob: 'dawnroost_mossy_road', dirt: 'shared_dirt_track', grass: 'wilds_heath_ground', pave: 'shared_forest_floor', rep: [2.0, 2.4, 3.0, 3.0],
      grassTint: [0.46, 0.52, 0.6], dirtTint: [1.0, 0.9, 0.8] },
    surfaces: { stone: 'wilds_boulder_stone', dry: 'shared_drystone', timber: 'shared_bark_oak', planks: 'wilds_mossy_log', roof: 'wilds_mossy_log',
      wood: 'shared_bark_oak', deck: 'dawnroost_mossy_road', pave: 'dawnroost_mossy_road', cloth: 'shared_forest_floor', soil: 'shared_forest_floor',
      rock: 'wilds_boulder_stone', leaves: 'wilds_oak_leaves', firs: 'wilds_fir_boughs', bark: 'shared_bark_oak' },
    tints: { leaves: 0xd8f4ee, firs: 0xc4e0d8, bush: 0xc8e4dc, wood: 0xc8b0a8 },
    extraMats: {
      log: { tex: 'wilds_mossy_log', rep: 1.6, shade: 0.5 },
      birch: { tex: 'shared_bark_birch', rep: 1.2, tint: 0xe8e8f0, shade: 0.5 },
      birchLeaf: { tex: 'wilds_birch_leaves', rep: 1, tint: 0xd0ece0, shade: 0.55 },
      fern: { tint: 0x5e8e7e, side: 'double', shade: 0.6 },
      mush: { tint: 0xe6e0ea, emis: 0x1c1826, shade: 0.4 },
      glowcap: { tint: 0xb8dcff, lit: 0, glow: 0 },
      endgrain: { tint: 0xc8a888, shade: 0.5 },
    },
    // the same heavy cold fog as the Thornwood: only so much is drawn at once; no far hills (the fog is the edge)
    night: { fog: [0.16, 0.175, 0.31], fogNear: 10, fogFar: 42, far: 90, hills: false, sky: [0.58, 0.6, 0.72], moon: [0.4, 0.44, 0.6] },
    textures: [
      { id: 'dawnroost_mossy_road', made: "./../texture-packs/made-web/dawnroost_mossy_road.webp", stand: "./../texture-packs/wilds-south/dawnroost-road/stand-in/dawnroost_mossy_road.png" },
      { id: 'shared_dirt_track', made: "./../texture-packs/made-web/shared_dirt_track.webp", stand: "./../texture-packs/wilds-south/eldergrove-edge/stand-in/shared_dirt_track.png" },
      { id: 'wilds_heath_ground', made: "./../texture-packs/made-web/wilds_heath_ground.webp", stand: "./../texture-packs/wilds-south/ember-line-road/stand-in/wilds_heath_ground.png" },
      { id: 'shared_forest_floor', made: "./../texture-packs/made-web/shared_forest_floor.webp", stand: "./../texture-packs/wilds-south/dawnroost-road/stand-in/shared_forest_floor.png" },
      { id: 'shared_bark_oak', made: "./../texture-packs/made-web/shared_bark_oak.webp", stand: "./../texture-packs/wilds-south/dawnroost-road/stand-in/shared_bark_oak.png" },
      { id: 'wilds_oak_leaves', made: "./../texture-packs/made-web/wilds_oak_leaves.webp", stand: "./../texture-packs/wilds-south/dawnroost-road/stand-in/wilds_oak_leaves.png" },
      { id: 'wilds_fir_boughs', made: "./../texture-packs/made-web/wilds_fir_boughs.webp", stand: "./../texture-packs/wilds-south/dawnroost-road/stand-in/wilds_fir_boughs.png" },
      { id: 'wilds_mossy_log', made: "./../texture-packs/made-web/wilds_mossy_log.webp", stand: "./../texture-packs/wilds-south/dawnroost-road/stand-in/wilds_mossy_log.png" },
      { id: 'wilds_boulder_stone', made: "./../texture-packs/made-web/wilds_boulder_stone.webp", stand: "./../texture-packs/wilds-south/ember-line-road/stand-in/wilds_boulder_stone.png" },
      { id: 'wilds_birch_leaves', made: "./../texture-packs/made-web/wilds_birch_leaves.webp", stand: "./../texture-packs/wilds-south/ember-line-road/stand-in/wilds_birch_leaves.png" },
      { id: 'shared_drystone', made: "./../texture-packs/made-web/shared_drystone.webp", stand: "./../texture-packs/wilds-south/ember-line-road/stand-in/shared_drystone.png" },
      { id: 'shared_bark_birch', made: "./../texture-packs/made-web/shared_bark_birch.webp", stand: "./../texture-packs/wilds-south/warm-roads-camp/stand-in/shared_bark_birch.png" },
      { id: 'shared_water_dark', made: "./../texture-packs/made-web/shared_water_dark.webp", stand: "./../texture-packs/wickhollow/jetty/stand-in/shared_water_dark.png" },
    ],
    ground_h: ground,
    walk_h: ground,
    water: [
      { poly: POOL, level: () => -0.3, tex: 'shared_water_dark', rep: 5, flow: [0.003, 0.002], bed: -1.4 },
      // (its bed is a little below its own level, wherever the rolling ground puts it)
      { poly: SPRINGP, level: () => springLevel(), tex: 'shared_water_dark', rep: 4, flow: [0.004, 0.006], get bed() { return springLevel() - 1.0; } },
    ],
    lawns: [],
    // no boulders the engine lays round the spring's south lip (its trail comes to the water there), nor round the pool
    // (the painting's own are among ROCKS)
    noRocks: [[1790, 1310, 1970, 1440], [140, 290, 420, 520]],
    start: [1000, 970], startFace: Math.PI, startYaw: 0,
    // the ways on, where the road reaches the open ground's edge
    exits: [
      { rect: [724, -782, 844, -756], label: 'Dawnroost' },
      { rect: [930, 1774, 1050, 1798], label: 'The Ember Line road' },
    ],
    // the road on (flagstones down the middle, earth along its verges) and the trails (earth)
    walkAdd: ROAD.map((t) => ({ poly: ribbon(t.pts, t.w + 0.7), ground: 'dirt' })).concat(ROAD.map((t) => ({ poly: ribbon(t.pts, t.w), ground: 'cob' })))
      .concat(TRAILS.map((t) => ({ poly: ribbon(t.pts, t.w), ground: 'dirt' }))),
    // the walking map's side trails and the woodcutter's yard are earth, not the road's flagstones (with a band round
    // each edge, over the flagstones' blur)
    groundPatches: (() => {
      const W = ((G.MAPS || {})[ID] || { walk: [] }).walk, out = [];
      for (const p of W.slice(1)) {
        out.push({ poly: p, kind: 'dirt' });
        for (let i = 0, j = p.length - 1; i < p.length; j = i++) { const [ax, ay] = p[j], [bx, by] = p[i], L = Math.hypot(bx - ax, by - ay) || 1, nx = -(by - ay) / L * 9, ny = (bx - ax) / L * 9; out.push({ poly: [[ax - nx, ay - ny], [bx - nx, by - ny], [bx + nx, by + ny], [ax + nx, ay + ny]], kind: 'dirt' }); }
      }
      return out;
    })(),
    items: {},
    buildings: [],
    walls: [],
    steps: [],
    lamps: [],
    props: ROCKS.map(([x, y, s]) => ({ k: 'rock', at: [x, y], size: s })),
    get flowers() { return flowersNow(); },
    // the lights for the light map: [x, y, radius px, strength, colour]. The lantern's and the shrine's are added in
    // extra(); these are the moonlight on the pool, the road and the clearings.
    lights: [
      [270, 400, 160, 0.5, 'moon'], [222, 398, 60, 0.6, 'moon'], [780, 300, 200, 0.3, 'moon'], [1250, 380, 170, 0.35, 'moon'], [900, 820, 180, 0.25, 'moon'],
      [FAIRY.c[0], FAIRY.c[1], 160, 0.45, 'moon'], [KILN.c[0], KILN.c[1], 150, 0.35, 'moon'], [FELLED.c[0], FELLED.c[1], 150, 0.35, 'moon'],
      [SPRING.c[0], SPRING.c[1], 140, 0.5, 'moon'], [OAK.c[0], OAK.c[1] + 60, 140, 0.35, 'moon'], [FERN.c[0], FERN.c[1], 90, 0.5, 'moon'],
      [740, -300, 220, 0.25, 'moon'], [990, 1450, 220, 0.25, 'moon'],
    ],
    trees: ID,
    // (and past each way on, where the road ends, the woods close in)
    extraTrees: BIG.map((b) => b.slice()).concat(LINING).concat([[690, -850, 1.7, 0, 81], [790, -886, 1.6, 1, 82], [884, -846, 1.8, 0, 83], [748, -950, 1.9, 0, 84],
      [846, -960, 1.5, 1, 85], [916, 1860, 1.7, 0, 86], [996, 1884, 1.6, 1, 87], [1072, 1852, 1.8, 0, 88], [950, 1960, 1.9, 0, 89], [1050, 1966, 1.5, 1, 90]]),

    // ---- what the engine has no field for: the pool's flat stones, reeds and lily pads, the great oak's roots, the
    // birches, the lantern on its post, the milestone, the fallen log, the woodcutter's lean-to and all round it, ferns,
    // the places to find, the two pockets, the firs' low boughs (solid), and the mist ----
    extra(K) {
      const { B, X, Z } = K, W = G.W3D, TAU = Math.PI * 2, TH = K.terrain;
      const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
      const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
      const norm = (a) => { const L = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / L, a[1] / L, a[2] / L]; };
      const Q = (k, a, b, c, d, want, uv, col) => { const n = cross(sub(b, a), sub(d, a)); if (dot(n, want) < 0) B.quad(k, b, a, d, c, uv, col); else B.quad(k, a, b, c, d, uv, col); };
      const at = (px, py, dy) => [X(px), TH(px, py) + (dy || 0), Z(py)];
      // a tapered tube from A to Bp (n sides, open), its uv in metres
      function seg(A, Bp, ra, rb, n, col, k) {
        const d = sub(Bp, A), L = Math.hypot(d[0], d[1], d[2]), dir = mul(d, 1 / L);
        const u = norm(cross(Math.abs(dir[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0], dir)), v = cross(dir, u);
        const ring = (c, r, t) => add(c, add(mul(u, Math.cos(t) * r), mul(v, Math.sin(t) * r)));
        for (let i = 0; i < n; i++) { const t0 = i / n * TAU, t1 = (i + 1) / n * TAU; B.quad(k || 'wood', ring(A, ra, t0), ring(A, ra, t1), ring(Bp, rb, t1), ring(Bp, rb, t0), [t0 * ra, 0, t1 * ra, L], col); }
      }
      // a disc facing `n` (the end of a log, a mushroom's cap)
      function disc(c, n, r, sides, k, col) {
        const u = norm(cross(Math.abs(n[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0], n)), v = cross(n, u);
        for (let i = 0; i < sides; i++) { const a = i / sides * TAU, b = (i + 1) / sides * TAU; B.tri(k, c, add(c, add(mul(u, Math.cos(a) * r), mul(v, Math.sin(a) * r))), add(c, add(mul(u, Math.cos(b) * r), mul(v, Math.sin(b) * r))), [[0, 0], [r, 0], [0, r]], col); }
      }
      // a log lying from A to Bp (metres), its two ends cut
      const logAB = (A, Bp, r, col, n) => { seg(A, Bp, r, r * 0.94, n || 8, col, 'log'); const d = norm(sub(Bp, A)); disc(A, mul(d, -1), r, n || 8, 'endgrain'); disc(Bp, d, r * 0.94, n || 8, 'endgrain'); };
      const rock = (px, py, sz, solid, col) => { B.geom('rock', K.rockG[Math.floor(Math.abs(Math.sin(px * 12.9 + py * 7.3)) * 3) % 3], new THREE.Matrix4().compose(new THREE.Vector3(X(px), TH(px, py) - sz * 0.2, Z(py)), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, (px * 0.37 + py * 0.11) % TAU, 0)), new THREE.Vector3(sz, sz, sz)), col || null, 1.2); if (solid) K.addBlock(K.circlePx(px, py, sz * 0.8, 8)); };
      const mound = (px, py, rr, r, solid, kind) => {
        const x = X(px), z = Z(py), y = TH(px, py), h = rr * (0.6 + r() * 0.3);
        B.geom('leafBush', K.ico[Math.floor(r() * 3)], new THREE.Matrix4().compose(new THREE.Vector3(x, y + h * 0.35, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, r() * TAU, 0)), new THREE.Vector3(rr, h, rr)), [0.8, 0.86, 0.84], 2.0);
        if (kind) for (let i = 0; i < Math.max(2, Math.round(rr * 2.5)); i++) { const a = r() * TAU, d = r() * rr * 0.6, cx = x + Math.cos(a) * d, cz = z + Math.sin(a) * d, cy = y + h * (0.6 + r() * 0.5), sz = 0.35 + r() * 0.2, t = r() * Math.PI; B.quad('fl_' + kind, [cx - Math.cos(t) * sz, cy - sz * 0.6, cz - Math.sin(t) * sz], [cx + Math.cos(t) * sz, cy - sz * 0.6, cz + Math.sin(t) * sz], [cx + Math.cos(t) * sz, cy + sz, cz + Math.sin(t) * sz], [cx - Math.cos(t) * sz, cy + sz, cz - Math.sin(t) * sz], [0, 0, 1, 1]); }
        if (solid) K.addBlock(K.circlePx(px, py, rr * 0.75, 8)); else B.solids.pop();
      };
      // a fern: fronds fanning out and arching over from one root
      const fern = (px, py, s, r) => {
        const x = X(px), z = Z(py), y = TH(px, py), n = 7 + Math.floor(r() * 4), a0 = r() * TAU;
        for (let i = 0; i < n; i++) {
          const a = a0 + i / n * TAU + (r() - 0.5) * 0.4, L = (0.42 + r() * 0.28) * s, w = 0.09 * s, ca = Math.cos(a), sa = Math.sin(a);
          const mid = [x + ca * L * 0.5, y + 0.5 * s, z + sa * L * 0.5], tip = [x + ca * L, y + 0.22 * s, z + sa * L];
          const k = 0.8 + r() * 0.35;
          B.tri('fern', [x, y + 0.02, z], [mid[0] - sa * w, mid[1], mid[2] + ca * w], mid, [[0, 0], [0.1, 0.5], [0, 0.5]], [k, k, k]);
          B.tri('fern', [x, y + 0.02, z], mid, [mid[0] + sa * w, mid[1], mid[2] - ca * w], [[0, 0], [0, 0.5], [0.1, 0.5]], [k, k, k]);
          B.tri('fern', [mid[0] - sa * w, mid[1], mid[2] + ca * w], tip, mid, [[0, 0.5], [0, 1], [0.05, 0.5]], [k * 0.9, k * 0.9, k * 0.9]);
          B.tri('fern', mid, tip, [mid[0] + sa * w, mid[1], mid[2] - ca * w], [[0.05, 0.5], [0, 1], [0.1, 0.5]], [k * 0.9, k * 0.9, k * 0.9]);
        }
      };
      // tall grass or reeds
      const tuft = (px, py, n, hgt, col, r) => {
        const x = X(px), z = Z(py), y = TH(px, py);
        for (let i = 0; i < n; i++) { const a = r() * TAU, lean = 0.12 + r() * 0.3, h = hgt * (0.7 + r() * 0.5), w = 0.04 + r() * 0.03, bx = x + (r() - 0.5) * 0.6, bz = z + (r() - 0.5) * 0.5, ox = Math.cos(a), oz = Math.sin(a);
          B.tri('fern', [bx - oz * w, y, bz + ox * w], [bx + oz * w, y, bz - ox * w], [bx + ox * lean, y + h, bz + oz * lean], [[0, 0], [0.1, 0], [0.05, 1]], col); }
      };
      const lily = (px, py, rr, y) => {
        const x = X(px), z = Z(py), NL = 9, a0 = Math.abs(px * 13 + py) % 6, gap = 0.5;
        for (let i = 0; i < NL; i++) { const ta = a0 + gap / 2 + (TAU - gap) * i / NL, tb = a0 + gap / 2 + (TAU - gap) * (i + 1) / NL; B.tri('fern', [x, y, z], [x + Math.cos(tb) * rr, y, z + Math.sin(tb) * rr], [x + Math.cos(ta) * rr, y, z + Math.sin(ta) * rr], [[0, 0], [rr, 0], [0, rr]], [0.55, 0.78, 0.6]); }
      };
      // something solid: a ring (a C, open at `gap`, the way in `gw` metres either side) round c, from r0 to r1 metres
      const ringBlock = (c, r0, r1, gap, gw) => {
        const rm = (r0 + r1) / 2, hw = (r1 - r0) / 2, ga = gw / rm + hw / rm, pts = [], n = 28, pt = (a, r) => [c[0] + Math.cos(a) * r / SX, c[1] + Math.sin(a) * r / SZ];
        for (let i = 0; i <= n; i++) pts.push(pt(gap + ga + (TAU - 2 * ga) * i / n, r1));
        for (let i = n; i >= 0; i--) pts.push(pt(gap + ga + (TAU - 2 * ga) * i / n, r0));
        K.addBlock(pts);
        for (const e of [gap + ga, gap - ga]) { const q = pt(e, rm); K.addBlock(K.circlePx(q[0], q[1], hw, 12)); }
      };
      // a round-topped standing stone (the milestones), returns its foot's height
      function standingStone(sx, sy, w, d, h, ry, seed, col) {
        const base = TH(sx, sy) - 0.3, g = new THREE.BoxGeometry(1, 1, 1, 3, 9, 2), p = g.attributes.position;
        const hh = (a, b, c) => { const s = Math.sin(a * 127.1 + b * 311.7 + c * 74.7 + seed) * 43758.5453; return s - Math.floor(s); };
        for (let i = 0; i < p.count; i++) {
          const x = p.getX(i), y = p.getY(i), z = p.getZ(i), t = y + 0.5; let yy = t;
          if (t > 0.72) yy -= (x * x) * 0.9 * ss(0.72, 1, t);
          const n = (hh(x, y, z) - 0.5) * 0.05;
          p.setXYZ(i, x * (1 - 0.1 * t) * w + n, yy * h + n, z * d + n * 0.5);
        }
        g.computeVertexNormals();
        B.geom('stone', g, new THREE.Matrix4().compose(new THREE.Vector3(X(sx), base, Z(sy)), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(1, 1, 1)), col || [1.0, 1.0, 1.05], [w, h]);
        g.dispose();
        return base;
      }
      // a sun carved on a face: a ring, a boss, and twelve rays, a hand proud of the face (centre c, facing n)
      function sun(c, n, R, col) {
        const u = norm(cross([0, 1, 0], n)), v = [0, 1, 0], p = (a, r) => add(add(c, mul(u, Math.cos(a) * r)), mul(v, Math.sin(a) * r));
        for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, b = (i + 1) / 16 * TAU; Q('stone', p(a, R * 0.42), p(b, R * 0.42), p(b, R * 0.56), p(a, R * 0.56), n, [0, 0, 0.2, 0.2], col); B.tri('stone', c, p(a, R * 0.3), p(b, R * 0.3), [[0, 0], [0.1, 0], [0, 0.1]], col); }
        for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, w = 0.11; B.tri('stone', p(a + w, R * 0.64), p(a - w, R * 0.64), p(a, R), [[0, 0], [0.1, 0], [0.05, 0.2]], col); }
      }
      // a birch: a slim white trunk, a few dark twigs, small pale crowns
      const birch = (px, py, s, seed) => {
        const r = rnd(seed), x = X(px), z = Z(py), y = TH(px, py) - 0.2, H = (6.2 + r() * 1.6) * s, lx = (r() - 0.5) * 0.5, lz = (r() - 0.5) * 0.5;
        const top = [x + lx, y + H, z + lz];
        seg([x, y, z], top, 0.15 * s, 0.05 * s, 7, [1, 1, 1], 'birch');
        for (let i = 0; i < 5; i++) { const t = 0.45 + r() * 0.45, p0 = [x + lx * t, y + H * t, z + lz * t], a = r() * TAU; seg(p0, add(p0, [Math.cos(a) * 1.3 * s, 0.8 + r() * 0.6, Math.sin(a) * 1.3 * s]), 0.04, 0.012, 3, [0.45, 0.4, 0.42], 'wood'); }
        for (let i = 0; i < 3; i++) { const a = r() * TAU, d = i ? 0.8 * s : 0, br = (1.0 + r() * 0.5) * s, cy = y + H * (0.68 + i * 0.12);
          B.geom('birchLeaf', K.ico[(seed + i) % 3], new THREE.Matrix4().compose(new THREE.Vector3(x + lx * 0.8 + Math.cos(a) * d, cy, z + lz * 0.8 + Math.sin(a) * d), new THREE.Quaternion().setFromEuler(new THREE.Euler(r(), r() * TAU, 0)), new THREE.Vector3(br, br * 1.1, br)), null, 2.0); B.solids.pop(); }
        K.addBlock(K.circlePx(px, py, 0.2 * s, 6));
        K.shadeMarks.push(['dot', px, py, 18 * s, 0.7]);
      };
      // a shelf mushroom on a log's side: a flattened half-disc
      const shelf = (c, n, r) => { const u = norm(cross([0, 1, 0], n)); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI, b = (i + 1) / 6 * Math.PI; const pa = add(c, add(mul(u, Math.cos(a) * r), mul(n, Math.sin(a) * r))), pb = add(c, add(mul(u, Math.cos(b) * r), mul(n, Math.sin(b) * r))); B.tri('mush', c, pa, pb, [[0, 0], [1, 0], [0, 1]]); B.tri('mush', c, add(pb, [0, -0.06, 0]), add(pa, [0, -0.06, 0]), [[0, 0], [1, 0], [0, 1]], [0.7, 0.66, 0.7]); } };
      // a small toadstool (cap and stalk)
      const toad = (px, py, s, k) => { const x = X(px), z = Z(py), y = TH(px, py); B.cyl(k === 'glowcap' ? 'glowcap' : 'mush', x, y - 0.02, z, 0.035 * s, 0.03 * s, 0.16 * s, 5, null); B.solids.pop(); B.cyl(k || 'mush', x, y + 0.14 * s, z, 0.13 * s, 0.02, 0.07 * s, 7, null); B.solids.pop(); };

      // ---- the still pool: its flat stones (on the walk, under her feet), the reeds, the lily pads, the glint ----
      {
        B.solid = false;
        const SLABS = [[178, 300, 1.1, 0.2], [214, 280, 1.2, -0.1], [246, 286, 1.0, 0.15], [276, 292, 1.0, 0.05], [306, 300, 0.9, -0.2], [188, 266, 0.9, 0.3],
          [372, 322, 1.4, 0.1], [396, 326, 0.9, -0.2], [218, 532, 1.0, 0.1], [246, 536, 1.1, -0.15], [276, 540, 1.0, 0.2], [306, 536, 0.9, 0.0], [264, 556, 0.9, 0.3],
          [292, 560, 0.9, -0.1], [338, 528, 0.8, 0.2]];
        for (const [px, py, s, ry] of SLABS) B.box('stone', X(px), TH(px, py) - 0.12, Z(py), 0.95 * s, 0.2, 0.7 * s, ry, [0.95, 0.95, 1.02]);
        B.solid = true;
        const r = rnd(3);
        tuft(346, 292, 22, 1.3, [0.75, 0.85, 0.7], r); tuft(356, 304, 14, 1.1, [0.75, 0.85, 0.7], r);
        tuft(222, 462, 18, 1.2, [0.75, 0.85, 0.7], r); tuft(238, 484, 12, 1.0, [0.75, 0.85, 0.7], r);
        for (const [px, py, rr] of LILIES) lily(px, py, rr, -0.27);
        K.halo(X(222), 0.2, Z(398), 1.6, [0.22, 0.3, 0.5]);
      }

      // ---- the great oak by the pool: a thicker, flared foot and its roots over the ground ----
      {
        const [px, py] = BIG[0], x = X(px), z = Z(py), y = TH(px, py), r = rnd(5), col = [0.9, 0.85, 0.85];
        seg([x, y - 0.3, z], [x, y + 2.2, z], 1.05, 0.62, 10, col, 'bark');
        const ROOTS = [[-2.6, 1.4], [-1.6, 2.2], [0.3, 2.6], [1.7, 2.0], [2.6, 0.9], [-2.4, -0.6], [2.2, -1.0]];
        for (const [dx, dz] of ROOTS) {
          const end = [x + dx, y - 0.15, z + dz], mid = [x + dx * 0.45, y + 0.35 + r() * 0.2, z + dz * 0.45];
          seg([x, y + 0.9, z], mid, 0.42, 0.26, 6, col, 'bark'); seg(mid, end, 0.26, 0.06, 5, col, 'bark');
          K.addBlock(ribbon([[px, py], [px + dx * 0.75 / SX, py + dz * 0.75 / SZ]], 0.28));
        }
        K.addBlock(K.circlePx(px, py, 1.05, 12));
        K.shadeMarks.push(['dot', px, py - 30, 150, 0.6]);
      }

      // ---- the birches ----
      BIRCHES.forEach(([px, py, s], i) => birch(px, py, s, 300 + i * 17));

      // ---- the iron lantern on its wooden post, its arm reaching west over the road's lit verge ----
      {
        const px = 1009, py = 667, x = X(px), z = Z(py), y = TH(px, py), H = 3.0;
        B.box('wood', x, y - 0.3, z, 0.24, H + 0.4, 0.24, 0, [0.72, 0.6, 0.55]);
        B.box('wood', x - 0.55, y + H - 0.12, z, 1.3, 0.13, 0.13, 0, [0.72, 0.6, 0.55]);
        // the brace, from the post up to the arm
        const b0 = [x - 0.06, y + H - 0.95, z], b1 = [x - 0.62, y + H - 0.14, z];
        seg(b0, b1, 0.055, 0.05, 4, [0.72, 0.6, 0.55], 'wood');
        B.box('iron', x - 1.08, y + H - 0.4, z, 0.03, 0.3, 0.03, 0);
        K.lantern(x - 1.08, y + H - 0.82, z, null, 1.05, false);
        K.light(974, 646, 150, 1.15, 'warm');
        K.shadeMarks.push(['dot', px, py, 10, 0.7]);
      }

      // ---- the milestone: a round-topped stone with a sun carved on the face toward the road, a rock at its foot ----
      {
        const px = 1094, py = 652, w = 1.7, d = 0.62, h = 2.5, ry = -0.45;
        const y0 = standingStone(px, py, w, d, h, ry, 3.3);
        const n = [Math.sin(ry), 0, Math.cos(ry)], c = add([X(px), y0 + 1.75, Z(py)], mul(n, d / 2 + 0.02));
        sun(c, n, 0.5, [1.25, 1.2, 1.12]);
        K.addBlock(K.circlePx(px, py, 0.82, 10));
        K.shadeMarks.push(['dot', px, py + 6, 26, 0.65]);
      }

      // ---- the big fallen log east of the milestone: roots torn up at its north-west end, shelf mushrooms on its side ----
      {
        const A = [1218, 562], Bp = [1516, 736], r = rnd(9), R = 0.62;
        const a = at(A[0], A[1], R * 0.75), b = at(Bp[0], Bp[1], R * 0.7);
        logAB(a, b, R, [0.95, 0.95, 0.95], 10);
        const dir = norm(sub(b, a)), side = norm(cross(dir, [0, 1, 0]));
        for (let i = 0; i < 9; i++) { const t = i / 9 * TAU, o = add(mul(side, Math.cos(t) * (1.3 + r() * 0.6)), [0, Math.sin(t) * (1.0 + r() * 0.4) + 0.3, 0]); seg(a, add(add(a, o), mul(dir, -(0.2 + r() * 0.5))), 0.16, 0.03, 4, [0.8, 0.75, 0.75], 'wood'); }
        // the shelf mushrooms, on the side toward the road (south-west)
        for (let i = 0; i < 9; i++) { const t = 0.32 + r() * 0.36, c = add(add(a, mul(sub(b, a), t)), add(mul(side, -(R + 0.02)), [0, (r() - 0.3) * 0.5, 0])); shelf(c, mul(side, -1), 0.14 + r() * 0.12); }
        K.addBlock(ribbon([A, Bp], R + 0.05)); K.addBlock(K.circlePx(A[0], A[1], 1.3, 10));
        K.shadeMarks.push(['dot', 1360, 660, 120, 0.72]);
      }

      // ---- the woodcutter's clearing: the lean-to of split logs on log posts (open to the south-west, high at the front),
      // the firewood stack under it, the chopping block and its axe, the split logs, the loose log ----
      {
        const FL = [1250, 288], FR = [1396, 362], BL = [1292, 236], BR = [1446, 300], HF = 2.55, HB = 1.25, col = [0.9, 0.86, 0.86];
        const lerp2 = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
        const post = (p, h) => { const g = at(p[0], p[1]); seg(add(g, [0, -0.25, 0]), add(g, [0, h, 0]), 0.14, 0.12, 6, col, 'log'); K.addBlock(K.circlePx(p[0], p[1], 0.16, 8)); };
        post(FL, HF); post(FR, HF); post(BL, HB); post(BR, HB); post(lerp2(FL, FR, 0.5), HF);
        const yF = Math.max(TH(FL[0], FL[1]), TH(FR[0], FR[1])), yB = Math.max(TH(BL[0], BL[1]), TH(BR[0], BR[1]));
        // the beams along the front and the back, the braces from the corner posts
        const P3 = (p, y) => [X(p[0]), y, Z(p[1])];
        logAB(P3(FL, yF + HF), P3(FR, yF + HF), 0.13, col, 6); logAB(P3(BL, yB + HB), P3(BR, yB + HB), 0.12, col, 6);
        seg(P3(FL, yF + HF - 1.0), P3(lerp2(FL, FR, 0.18), yF + HF), 0.06, 0.05, 4, col, 'log'); seg(P3(FR, yF + HF - 1.0), P3(lerp2(FL, FR, 0.82), yF + HF), 0.06, 0.05, 4, col, 'log');
        // the roof: split logs side by side, from the front beam down to the back beam
        const NR = 8;
        for (let i = 0; i < NR; i++) {
          const t = (i + 0.5) / NR, a = lerp2(FL, BL, t), b = lerp2(FR, BR, t), y = yF + HF + (yB + HB - yF - HF) * t + 0.2;
          const A = P3(a, y), Bq = P3(b, y), d = norm(sub(Bq, A));
          logAB(sub(A, mul(d, 0.45)), add(Bq, mul(d, 0.45)), 0.17, [0.85 + 0.1 * (i % 2), 0.85, 0.85], 7);
        }
        // the firewood stack under it: split logs seen end-on
        {
          const x0 = X(1308), x1 = X(1376), zF = Z(340), zB = Z(306), y = TH(1342, 330), h = 1.35;
          B.box('wood', (x0 + x1) / 2, y - 0.1, (zF + zB) / 2, x1 - x0, h + 0.1, zF - zB - 0.05, 0, [0.6, 0.5, 0.45]);
          const r = rnd(12);
          for (let row = 0; row < 4; row++) for (let i = 0; i < 9; i++) { const cx = x0 + 0.2 + i * (x1 - x0 - 0.4) / 8 + (row % 2) * 0.12, cy = y + 0.17 + row * 0.32; if (cx > x1 - 0.12) continue; disc([cx, cy, zF + 0.02], [0, 0, 1], 0.15 + r() * 0.03, 6, 'endgrain', [0.95 + r() * 0.15, 0.9, 0.85]); }
          K.addBlock(W.rectPoly([1306, 304, 1378, 342]));
        }
        // under the roof's low back: closed (the space behind the stack is too low to stand in)
        // (walk pass 2: its front at the stack's face, y 342, not three pixels out on the 2D walk)
        K.addBlock([[1262, 278], [1292, 232], [1450, 298], [1450, 322], [1400, 360], [1380, 342], [1306, 342], [1306, 290]]);
        // the chopping block: a sawn stump, the axe leaning on it
        {
          const px = 1256, py = 382, x = X(px), z = Z(py), y = TH(px, py);
          B.cyl('log', x, y - 0.2, z, 0.56, 0.5, 0.95, 10, [0.9, 0.85, 0.85]);
          B.solids.pop();
          disc([x, y + 0.751, z], [0, 1, 0], 0.5, 10, 'endgrain', [1.05, 0.95, 0.85]);
          const ax = X(1290), az = Z(370), ay = TH(1290, 370);
          seg([ax, ay, az], [ax - 0.12, ay + 1.05, az - 0.05], 0.03, 0.028, 4, [1.1, 0.9, 0.7], 'wood');
          B.box('iron', ax - 0.12, ay + 0.98, az - 0.05, 0.08, 0.2, 0.26, 0.2);
        }
        // the split logs on the ground, and the loose log by the lean-to
        {
          const r = rnd(14);
          for (let i = 0; i < 6; i++) { const cx = 1312 + (r() - 0.5) * 50, cy = 420 + (r() - 0.5) * 30, a = r() * Math.PI, L = 0.8 + r() * 0.3, c = at(cx, cy, 0.12 + (i > 3 ? 0.2 : 0)); const d = [Math.cos(a) * L / 2, 0, Math.sin(a) * L / 2]; logAB(sub(c, d), add(c, d), 0.12, [1, 0.95, 0.9], 5); }
          logAB(at(1170, 283, 0.22), at(1228, 285, 0.22), 0.24, [0.95, 0.95, 0.95], 7);
          K.addBlock(ribbon([[1170, 283], [1228, 285]], 0.28));
        }
        K.shadeMarks.push(['poly', [[1262, 280], [1300, 236], [1446, 300], [1400, 360]], 0.62]);
      }

      // ---- ferns: under the trees along the paths' edges, and round the places to find ----
      {
        const r = rnd(21);
        for (let i = 0; i < 520; i++) {
          const px = -60 + r() * 1660, py = -60 + r() * 1150, d = pathDist(px, py);
          if (d < 10 || d > 90 || inPoly(POOL, px, py) || nearRock(px, py, 0.3) || nearPlace(px, py, -10) || r() > 0.35) continue;
          fern(px, py, 0.6 + r() * 0.45, r);
        }
        for (const t of TRAILS) for (let i = 1; i < t.pts.length; i++) {
          const [ax, ay] = t.pts[i - 1], [bx, by] = t.pts[i], L = mDist(ax, ay, bx, by);
          for (let s = r() * 5; s < L; s += 4 + r() * 5) { const f = s / L, nx = -(by - ay) * SZ / L, nz = (bx - ax) * SX / L, off = (t.w + 0.4 + r() * 1.6) * (r() < 0.5 ? -1 : 1), px = ax + (bx - ax) * f + nx * off / SX, py = ay + (by - ay) * f + nz * off / SZ; if (pathDist(px, py) < 6) continue; fern(px, py, 0.6 + r() * 0.4, r); }
        }
      }

      // ---- the ring of pale mushrooms in its mossy clearing (west): they glow a little, cold ----
      {
        const [cx, cy] = FAIRY.c, r = rnd(31);
        for (let i = 0; i < 30; i++) { const a = i / 30 * TAU + (r() - 0.5) * 0.12, d = FAIRY.r + (r() - 0.5) * 0.35, px = cx + Math.cos(a) * d / SX, py = cy + Math.sin(a) * d / SZ; toad(px, py, 0.9 + r() * 0.7, 'glowcap'); }
        for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.3; K.halo(X(cx) + Math.cos(a) * FAIRY.r, TH(cx, cy) + 0.2, Z(cy) + Math.sin(a) * FAIRY.r, 1.6, [0.14, 0.22, 0.4]); }
        K.halo(X(cx), TH(cx, cy) + 0.4, Z(cy), 7, [0.06, 0.09, 0.16]);
        // a mossy stump and an old stone at the ring's edge
        rock(cx + 150, cy - 70, 0.7, true); B.cyl('log', X(cx - 140), TH(cx - 140, cy + 60) - 0.2, Z(cy + 60), 0.42, 0.36, 0.75, 8); B.solids.pop(); K.addBlock(K.circlePx(cx - 140, cy + 60, 0.45, 8));
      }

      // ---- the charcoal burners' old kiln (south-west): a low ring of drystone round a black heap, its mouth to the
      // north, stumps of the trees they felled round the clearing ----
      {
        const [cx, cy] = KILN.c, y = TH(cx, cy), r = rnd(41), N = 18, gap = -Math.PI / 2;
        for (let i = 0; i < N; i++) {
          const a = gap + 0.55 + (TAU - 1.1) * (i + 0.5) / N, x = X(cx) + Math.cos(a) * KILN.r, z = Z(cy) + Math.sin(a) * KILN.r, hh = 0.75 + Math.abs(Math.sin(i * 2.3)) * 0.45;
          B.box('dry', x, y - 0.3, z, 0.8, hh + 0.3, 0.55, -a + Math.PI / 2, [0.85, 0.82, 0.86]);
        }
        B.geom('soil', K.ico[1], new THREE.Matrix4().compose(new THREE.Vector3(X(cx), y - 0.35, Z(cy)), new THREE.Quaternion(), new THREE.Vector3(1.6, 0.85, 1.6)), [0.32, 0.3, 0.32], 1.5); B.solids.pop();
        ringBlock(KILN.c, KILN.r - 0.4, KILN.r + 0.4, gap, 0.6);
        K.addBlock(K.circlePx(cx, cy, 1.5, 10));
        for (const [dx, dy] of [[-160, -40], [140, 30], [-90, 120], [110, -110], [20, 150]]) { const px = cx + dx, py = cy + dy; B.cyl('log', X(px), TH(px, py) - 0.2, Z(py), 0.36, 0.3, 0.65, 8, [0.9, 0.85, 0.85]); B.solids.pop(); disc([X(px), TH(px, py) + 0.451, Z(py)], [0, 1, 0], 0.3, 8, 'endgrain'); K.addBlock(K.circlePx(px, py, 0.38, 8)); }
        for (let i = 0; i < 8; i++) rock(cx + (r() - 0.5) * 260, cy + 60 + r() * 80, 0.2 + r() * 0.2, false, [0.6, 0.58, 0.62]);
      }

      // ---- the old Wardens' sun shrine (north-west): a stone pillar with a sun on its face, a lantern on an iron hook,
      // a stone seat ----
      {
        const [px, py] = SHRINE.at, x = X(px), z = Z(py), y = TH(px, py);
        B.box('stone', x, y - 0.3, z, 1.5, 0.55, 1.0, 0, [0.85, 0.85, 0.9]);
        B.box('stone', x, y + 0.25, z, 0.75, 2.1, 0.6, 0, [1.0, 1.0, 1.04]);
        B.box('stone', x, y + 2.35, z, 0.95, 0.18, 0.8, 0, [0.85, 0.85, 0.9]);
        sun([x, y + 1.6, z + 0.32], [0, 0, 1], 0.32, [1.25, 1.2, 1.1]);
        B.box('iron', x + 0.55, y + 2.2, z + 0.1, 0.45, 0.04, 0.04, 0); B.box('iron', x + 0.75, y + 1.95, z + 0.1, 0.03, 0.25, 0.03, 0);
        K.lantern(x + 0.75, y + 1.62, z + 0.1, null, 0.8, false);
        K.light(px + 20, py + 26, 110, 0.85, 'warm');
        K.addBlock(W.rectPoly([px - 20, py - 12, px + 20, py + 12]));
        // the seat, facing the shrine
        const sy = py + 96, sz = Z(sy); B.box('stone', x - 0.7, TH(px, sy) - 0.2, sz, 0.35, 0.62, 0.35, 0); B.box('stone', x + 0.7, TH(px, sy) - 0.2, sz, 0.35, 0.62, 0.35, 0);
        B.box('stone', x, TH(px, sy) + 0.42, sz, 1.9, 0.12, 0.5, 0, [0.95, 0.95, 1]);
        K.addBlock(W.rectPoly([px - 26, sy - 6, px + 26, sy + 6]));
        const r = rnd(51); for (let i = 0; i < 5; i++) mound(px + (r() - 0.5) * 140, py - 10 - r() * 30, 0.45 + r() * 0.2, r, true, 'white');
      }

      // ---- the second milestone, on the road north ----
      {
        const [px, py] = STONE2.at, ry = Math.PI / 2 - 0.1;
        const y0 = standingStone(px, py, 1.2, 0.5, 1.9, ry, 7.7, [0.95, 0.96, 1.0]);
        const n = [Math.sin(ry), 0, Math.cos(ry)];
        sun(add([X(px), y0 + 1.4, Z(py)], mul(n, 0.27)), n, 0.36, [1.2, 1.15, 1.1]);
        K.addBlock(K.circlePx(px, py, 0.62, 10));
      }

      // ---- the felled timber (east): great trunks stacked beside the trail, chocked, a sawhorse by them ----
      {
        const [cx, cy] = FELLED.c, r = rnd(61), y = TH(cx, cy), L = 6.4, x0 = X(cx) - L / 2, x1 = X(cx) + L / 2, z = Z(cy);
        const LAY = [[-0.9, 0.42], [0, 0.45], [0.9, 0.4], [-0.45, 0.4], [0.45, 0.42], [0, 0.38]];
        LAY.forEach(([dz, R], i) => { const yy = y + R + (i < 3 ? 0 : i < 5 ? 0.72 : 1.42) - 0.1, sh = (r() - 0.5) * 0.6; logAB([x0 + sh, yy, z + dz], [x1 + sh, yy, z + dz], R, [0.95, 0.92, 0.9], 9); });
        for (const sx of [-2.2, 2.2]) for (const sz of [-1.45, 1.45]) B.box('wood', X(cx) + sx, y - 0.1, z + sz, 0.2, 0.55, 0.25, 0, [0.8, 0.7, 0.65]);
        // the sawhorse
        const sx = X(cx) - 4.6, sz = z + 1.6;
        for (const dx of [-0.55, 0.55]) { seg([sx + dx - 0.3, y, sz - 0.25], [sx + dx + 0.1, y + 0.95, sz], 0.05, 0.05, 4, [0.9, 0.8, 0.7], 'wood'); seg([sx + dx + 0.3, y, sz + 0.25], [sx + dx - 0.1, y + 0.95, sz], 0.05, 0.05, 4, [0.9, 0.8, 0.7], 'wood'); }
        logAB([sx - 0.9, y + 1.0, sz], [sx + 0.9, y + 1.0, sz], 0.14, [1, 0.95, 0.9], 6);
        K.addBlock(W.rectPoly([cx - L / 2 / SX - 8, cy - 1.45 / SZ, cx + L / 2 / SX + 8, cy + 1.45 / SZ]));
        K.addBlock(K.circlePx(cx - 4.6 / SX, cy + 1.6 / SZ, 0.75, 8));
        K.shadeMarks.push(['dot', cx, cy, 100, 0.7]);
      }

      // ---- the hollow oak (north-east): older than the road, a great gnarled trunk with a dark hollow at its foot facing
      // the trail, its roots over the ground, its crown lost in the fog ----
      {
        const [px, py] = OAK.c, x = X(px), z = Z(py), y = TH(px, py), r = rnd(71), col = [0.85, 0.8, 0.82], RR = OAK.r;
        // the trunk: flared at the foot, ridged; on its south face the bark opens round the hollow, a dark alcove with a
        // pointed top
        const RINGS = [[-0.6, 1.32], [0.6, 1.14], [1.4, 1.05], [2.2, 1.0], [4.0, 0.9], [6.5, 0.8], [9.0, 0.72]], HW = 0.62, NA = 22;
        const wob = (a, h) => 1 + 0.08 * Math.sin(a * 5 + h * 0.5) + 0.05 * Math.sin(a * 11 + 0.7);
        const fr = (k) => z + Math.sqrt(Math.max(0, (RR * RINGS[k][1]) ** 2 - HW * HW));
        const aR = Math.acos(HW / RR), aL = Math.PI - aR;
        const ANG = []; for (let i = 0; i < NA; i++) ANG.push(i / NA * TAU); ANG.push(aL, aR); ANG.sort((a, b) => a - b);
        const Pv = (a, k) => {
          const [h, s] = RINGS[k];
          if (k <= 3 && Math.abs(a - aL) < 1e-6) return [x - HW, y + h, fr(k)];
          if (k <= 3 && Math.abs(a - aR) < 1e-6) return [x + HW, y + h, fr(k)];
          const inS = a > aR && a < aL, rr = RR * s * (k <= 3 && inS ? 1 : wob(a, h)), lift = k === 3 && inS ? 0.6 * (1 - Math.abs(a - Math.PI / 2) / ((aL - aR) / 2)) : 0;
          return [x + Math.cos(a) * rr, y + h + lift, z + Math.sin(a) * rr];
        };
        for (let k = 0; k < RINGS.length - 1; k++) for (let i = 0; i < ANG.length; i++) {
          const a0 = ANG[i], a1 = i + 1 < ANG.length ? ANG[i + 1] : ANG[0] + TAU;
          if (k < 3 && a0 >= aR - 1e-6 && a1 <= aL + 1e-6) continue;
          Q('bark', Pv(a0, k), Pv(a1, k), Pv(a1, k + 1), Pv(a0, k + 1), [Math.cos((a0 + a1) / 2), 0, Math.sin((a0 + a1) / 2)], [a0 * RR, RINGS[k][0], a1 * RR, RINGS[k + 1][0]], col);
        }
        // the hollow's sides, back and pointed roof, dark
        const zB = z + RR * 0.35, top = y + RINGS[3][0], peak = top + 0.6, dk = [0.12, 0.1, 0.12];
        for (let k = 0; k < 3; k++) {
          const ya = y + RINGS[k][0], yb = y + RINGS[k + 1][0];
          Q('bark', [x - HW, ya, zB], [x - HW, ya, fr(k)], [x - HW, yb, fr(k + 1)], [x - HW, yb, zB], [1, 0, 0], [0, 0, 1, 1], dk);
          Q('bark', [x + HW, ya, zB], [x + HW, ya, fr(k)], [x + HW, yb, fr(k + 1)], [x + HW, yb, zB], [-1, 0, 0], [0, 0, 1, 1], dk);
        }
        Q('glass', [x - HW, y - 0.6, zB], [x + HW, y - 0.6, zB], [x + HW, top, zB], [x - HW, top, zB], [0, 0, 1], [0, 0, 1, 1], [0.012, 0.01, 0.016]);
        B.tri('glass', [x - HW, top, zB], [x + HW, top, zB], [x, peak, zB], [[0, 0], [1, 0], [0.5, 1]], [0.012, 0.01, 0.016]);
        Q('bark', [x - HW, top, zB], [x - HW, top, fr(3)], [x, peak, z + RR + 0.02], [x, peak, zB], [1, -1, 0], [0, 0, 1, 1], dk);
        Q('bark', [x + HW, top, zB], [x + HW, top, fr(3)], [x, peak, z + RR + 0.02], [x, peak, zB], [-1, -1, 0], [0, 0, 1, 1], dk);
        // the great limbs, going up into the fog, and the crown
        for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + r(), b0 = [x, y + 7.0 + r() * 1.5, z], b1 = add(b0, [Math.cos(a) * 3.6, 2.4 + r() * 1.5, Math.sin(a) * 3.6]); seg(b0, b1, 0.5, 0.2, 6, col, 'bark');
          B.geom('leafBush', K.ico[i % 3], new THREE.Matrix4().compose(new THREE.Vector3(b1[0], b1[1] + 1.2, b1[2]), new THREE.Quaternion().setFromEuler(new THREE.Euler(r(), r() * TAU, 0)), new THREE.Vector3(3.4, 2.6, 3.4)), [0.72, 0.8, 0.78], 2.6); B.solids.pop(); }
        B.geom('leafBush', K.ico[0], new THREE.Matrix4().compose(new THREE.Vector3(x, y + 11.5, z), new THREE.Quaternion(), new THREE.Vector3(4.6, 3.2, 4.6)), [0.72, 0.8, 0.78], 2.6); B.solids.pop();
        // the roots
        for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.2 + (r() - 0.5) * 0.3; if (Math.abs(Math.atan2(Math.sin(a - Math.PI / 2), Math.cos(a - Math.PI / 2))) < 0.45) continue; const end = [x + Math.cos(a) * (RR + 2.6), y - 0.2, z + Math.sin(a) * (RR + 2.6)], mid = [x + Math.cos(a) * (RR + 0.6), y + 0.45, z + Math.sin(a) * (RR + 0.6)];
          seg([x + Math.cos(a) * RR * 0.6, y + 1.3, z + Math.sin(a) * RR * 0.6], mid, 0.55, 0.32, 6, col, 'bark'); seg(mid, end, 0.32, 0.06, 5, col, 'bark');
          K.addBlock(ribbon([[M2px(mid[0]), M2py(mid[2])], [M2px(end[0] * 0.7 + mid[0] * 0.3), M2py(end[2] * 0.7 + mid[2] * 0.3)]], 0.3)); }
        K.addBlock(K.circlePx(px, py, RR * 1.32, 16));
        K.shadeMarks.push(['dot', px, py, 140, 0.6]);
        for (let i = 0; i < 6; i++) toad(px + (r() - 0.5) * 90, py + 40 + r() * 40, 0.8 + r() * 0.5);
      }

      // ---- the spring (south-east): water welling up under a rock and lying in a little pool ringed with stones ----
      {
        const [cx, cy] = SPRING.c, r = rnd(81);
        rock(cx + 10, cy - 58, 2.1, true, [0.95, 0.95, 1]); rock(cx + 76, cy - 36, 1.5, true); rock(cx - 50, cy - 66, 1.3, true); rock(cx + 96, cy + 16, 1.1, true);
        for (let i = 0; i < 5; i++) fern(cx + (r() - 0.5) * 180, cy - 70 - r() * 30, 1.0, r);
        tuft(cx - 70, cy + 20, 12, 1.0, [0.75, 0.85, 0.7], r);
        lily(cx + 15, cy + 8, 0.35, springLevel() + 0.03); lily(cx - 20, cy - 6, 0.3, springLevel() + 0.03);
        K.halo(X(cx), springLevel() + 0.2, Z(cy), 3, [0.12, 0.18, 0.32]);
      }

      // ---- pocket: the fern hollow (west of the pool): a ring of mossy boulders, its way in round the back on the west;
      // inside, a flat stone like a seat, pale mushrooms and white flowers in a patch of moonlight ----
      {
        const [cx, cy] = FERN.c, r = rnd(91);
        for (let i = 0; i < 15; i++) { const a = FERN.gap + 0.6 + (TAU - 1.2) * i / 14, d = FERN.r + (r() - 0.5) * 0.2; rock(cx + Math.cos(a) * d / SX, cy + Math.sin(a) * d / SZ, 0.85 + r() * 0.3, false); }
        ringBlock(FERN.c, FERN.r - 0.7, FERN.r + 0.8, FERN.gap, 0.35);
        B.solid = false; B.box('stone', X(cx + 10), TH(cx, cy) - 0.1, Z(cy - 12), 1.1, 0.42, 0.7, 0.3, [0.95, 0.98, 0.95]); B.solid = true;
        for (let i = 0; i < 7; i++) fern(cx + (r() - 0.5) * 80, cy + (r() - 0.5) * 60, 0.8, r);
        for (let i = 0; i < 9; i++) toad(cx + (r() - 0.5) * 90, cy + (r() - 0.5) * 70, 0.7 + r() * 0.5, 'glowcap');
        K.halo(X(cx), TH(cx, cy) + 0.3, Z(cy), 3.2, [0.1, 0.16, 0.3]);
        // the screen in front of the way in
        mound(cx - (FERN.r + 2.6) / SX, cy - 20, 1.2, r, true); mound(cx - (FERN.r + 2.3) / SX, cy + 26, 1.0, r, true, 'violet');
      }

      // ---- pocket: the woodcutter's cache (behind the lean-to): a ring of bramble, its way in on the north; inside, an
      // old lantern still lit on a stump, a basket and a spare axe ----
      {
        const [cx, cy] = CACHE.c, r = rnd(101);
        for (let i = 0; i < 12; i++) { const a = CACHE.gap + 0.75 + (TAU - 1.5) * i / 11, d = CACHE.r + 0.15; mound(cx + Math.cos(a) * d / SX, cy + Math.sin(a) * d / SZ, 1.15 + r() * 0.3, r, false, i % 3 ? null : 'sun'); }
        ringBlock(CACHE.c, CACHE.r - 0.55, CACHE.r + 0.95, CACHE.gap, 0.35);
        const x = X(cx), z = Z(cy + 8), y = TH(cx, cy);
        B.cyl('log', x, y - 0.2, z, 0.34, 0.3, 0.75, 8, [0.9, 0.85, 0.85]); B.solids.pop(); disc([x, y + 0.551, z], [0, 1, 0], 0.3, 8, 'endgrain');
        K.addBlock(K.circlePx(cx, cy + 8, 0.36, 8));
        K.lantern(x, y + 0.72, z, null, 0.7, false);
        K.light(cx, cy + 10, 70, 0.7, 'warm');
        B.cyl('wood', x + 0.8, y, z + 0.3, 0.26, 0.32, 0.4, 8, [1.3, 1.05, 0.7]); B.solids.pop();
        seg([x - 0.5, y, z + 0.2], [x - 0.7, y + 0.8, z + 0.05], 0.025, 0.025, 4, [1.1, 0.9, 0.7], 'wood'); B.box('iron', x - 0.7, y + 0.72, z + 0.05, 0.08, 0.18, 0.22, 0.3);
      }

      // ---- the firs' low boughs reach the ground: solid round each fir (short of the paths) ----
      {
        const all = ((G.W3D_TREES || {})[ID] || []).concat(P[ID].extraTrees || []);
        for (const [tx, ty, s, kind] of all) {
          if (kind !== 1) continue;
          const room = (pathDist(tx, ty) - 4) * SX, rr = Math.min(0.85 * s, room);
          if (rr > 0.35) K.addBlock(K.circlePx(tx, ty, rr, 8));
        }
      }

      // ---- the mist: low banks of cold blue lying between the trees (soft glows, drawn last) ----
      for (const [px, py, s] of MIST) K.halo(X(px), TH(px, py) + s * 0.1, Z(py), s, [0.11, 0.15, 0.26]);

      function M2px(x) { return K.M.px(x); }
      function M2py(z) { return K.M.py(z); }
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
