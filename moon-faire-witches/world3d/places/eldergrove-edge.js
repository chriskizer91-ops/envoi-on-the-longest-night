// eldergrove-edge.js: Eldergrove's edge in 3D. Its painting (reference/art/walk/wilds/walk-eldergrove-edge.png, 1536 x 1024)
// is the middle, laid out in the painting's own pixels as src/game/maps.js keeps the walking map: the wide pebbly earth
// track from the west (the northern camp) to the east (the cold moor); the giant elder at the top, its vast trunk rising
// into the fog, its mossy roots spread over the ground and the dark hollow between two of them that the side path leads
// into; the ring of seven standing stones on the top right (one carved with a moon, one with a sun), the trail round its
// west side and behind it; the ruin on the bottom left (the round arch the path goes under, its broken walls, the pillar
// carved with a sun, fallen blocks); the firs and the bare twisted trees, frosted; the fallen mossy logs and their pale
// mushrooms; boulders, bracken, and the red and frosted undergrowth. Round it the place goes on, one painting's width and
// height each way (Chris, November 16: wild places are wide open fields in heavy fog, with pockets to find): toward the
// grove in the north and north-west the old giants stand thicker, their trunks lost in the fog; toward the moor in the
// east the trees give out onto frosted heather and stones. The track runs on west to the northern camp and east to the
// cold moor, and trails lead out to places to find: the grove's threshold between two giants (where the way into the
// deep grove is closed by their roots), the elder giants in the north-west, a boundary stone by the west track, the
// ruined well at the end of the path south from the arch, a fallen giant in the south-east, and a cairn on the moor's
// edge. Two pockets hide off the paths: a ring of frosted rocks past the boulder where the trail behind the stones gives
// out (its way in on the west, behind the boulder), and a small roofless room in the ruin west of the arch (its way in
// on the north, behind a fallen block). No keepsake lies here.
// Where Io can walk: the walking map's own walk and block areas, unchanged, plus all the open ground inside open.bounds,
// less the water and everything solid (every trunk and root, the firs' low boughs, the stones, the boulders, the ruin's
// walls, the logs, the bushes, the thicket the engine grows along the open ground's edge).
// The texture ids are the texture pack's (texture-packs/wilds-south/eldergrove-edge/inventory.md), with the shared ones
// where they were made (dawnroost-road, ember-line-road) and the frosted ones of the northern camp and the cold moor.
// Heights are metres: the track is 0; the ground swells a little toward the great elder's foot; past the painting it
// rolls (about 2 m up and down), gentler along the track and the trails, and the places to find sit on level ground.
(function (G) {
  'use strict';
  const P = G.W3D_PLACES = G.W3D_PLACES || {};
  const ID = 'eldergrove-edge';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ss = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const SX = 0.04, SZ = 0.05;
  const rnd = (seed) => { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1e6) / 1e6; }; };
  const inPoly = (poly, x, y) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
  const edgeDist = (poly, x, y) => { let d = 1e9; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [ax, ay] = poly[j], [bx, by] = poly[i], dx = bx - ax, dy = by - ay, t = clamp(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1), 0, 1); d = Math.min(d, Math.hypot(x - ax - t * dx, y - ay - t * dy)); } return d; };
  const mDist = (ax, ay, bx, by) => Math.hypot((ax - bx) * SX, (ay - by) * SZ);

  // ---- the track on past the painting (earth and pebbles), and the trails: centre lines in pixels, half widths (m) ----
  const ROAD = [
    { id: 'west', w: 1.7, pts: [[30, 470], [-150, 470], [-350, 444], [-560, 470], [-800, 500], [-1000, 482], [-1146, 470]] },
    { id: 'east', w: 1.7, pts: [[1510, 593], [1700, 600], [1900, 562], [2100, 560], [2300, 600], [2500, 640], [2716, 620]] },
  ];
  const TRAILS = [
    { id: 'grove', w: 0.8, pts: [[1052, 104], [1000, 0], [900, -150], [770, -330], [650, -520], [576, -690]] },
    { id: 'giants', w: 0.75, pts: [[-350, 444], [-380, 250], [-430, 60], [-400, -110], [-250, -250], [0, -330], [200, -420], [420, -520], [650, -520]] },
    { id: 'well', w: 0.8, pts: [[550, 1010], [570, 1150], [530, 1300], [522, 1418]] },
    { id: 'fallen', w: 0.75, pts: [[580, 1440], [800, 1420], [1100, 1384], [1400, 1366], [1578, 1384]] },
    { id: 'cairn', w: 0.7, pts: [[2100, 560], [2200, 450], [2290, 384]] },
  ];
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
  const trailDist = (x, y) => Math.min(lineDist(TRAILS, x, y), lineDist(ROAD, x, y) - 40);

  // ---- the great elder: its trunk's middle and radius at the foot (m), the hollow (an alcove between x0 and x1, from
  // the bark in to its back at y), and its roots: [from (px), through, to, radius at the trunk (m)] ----
  const ELDER = { c: [556, 132], R: 5.4, hollow: { x0: 518, x1: 594, back: 186, top: 3.1 } };
  const ROOTS = [
    [[470, 200], [380, 236], [300, 330], 1.0], [[440, 170], [300, 190], [96, 292], 0.95], [[430, 140], [220, 130], [0, 196], 0.85], [[480, 210], [440, 250], [362, 336], 0.8],
    [[498, 232], [486, 262], [486, 306], 0.55], [[616, 230], [636, 270], [650, 322], 0.6], [[650, 200], [700, 240], [764, 330], 0.85], [[680, 160], [760, 170], [904, 262], 0.9],
    [[670, 100], [730, 80], [820, 56], 0.8], [[440, 90], [380, 60], [290, 30], 0.75],
  ];
  // the other giants: past the painting toward the grove, and two whose roots reach into the painting's foot: [x, y, R m, seed]
  const GIANTS = [[420, -778, 4.6, 1], [722, -782, 4.6, 2], [-520, -220, 4.4, 3], [150, -570, 4.0, 4], [-900, -600, 4.2, 5], [1300, -650, 3.8, 6],
    [1340, 1150, 4.0, 7], [110, 1150, 4.0, 8], [-700, 1300, 3.6, 9]];
  // the ring of seven standing stones: [x, y (foot), width, depth, height (m), turn, carving]
  const RING = [[1038, 238, 1.9, 0.9, 3.6, 0.1, null], [1100, 186, 1.9, 0.85, 3.5, -0.05, null], [1184, 198, 2.6, 1.0, 4.8, 0, 'moon'], [1270, 220, 2.0, 0.9, 3.4, -0.15, null],
    [1360, 290, 2.3, 1.0, 4.0, -0.35, null], [1097, 308, 2.2, 0.95, 3.8, 0.05, null], [1256, 336, 2.6, 1.0, 4.2, -0.1, 'sun']];

  // ---- the ruin: walls [from, to, height (m), thickness (m)], the arch, the sun pillar, the outer pillar ----
  // (walk pass 2: its opening two pixels wider each side, 420 to 480, as wide as the 2D walk through it)
  const ARCH = { x0: 384, x1: 512, y: 659, open: [420, 480], t: 1.3, h: 4.4, oh: 3.3 };
  const RUIN = [
    [[300, 662], [384, 662], 2.2, 0.9], [[262, 668], [300, 664], 1.3, 0.9],                    // west of the arch (the west room's south wall)
    [[340, 646], [336, 528], 2.6, 0.9],                                                       // the west return, north of the arch
    [[262, 668], [262, 576], 1.6, 0.8], [[296, 572], [326, 570], 1.4, 0.8],                   // the west room's west and north walls (its way in between)
    [[512, 660], [566, 652], 2.4, 0.9], [[546, 640], [552, 534], 2.2, 0.9],                   // east of the arch, and its return north
    [[566, 600], [636, 606], 1.4, 0.8],                                                       // the broken wall east
  ];
  const SUNPIL = { at: [521, 728], w: 1.6, d: 0.8, h: 3.6 };
  const OUTPIL = { at: [620, 718], w: 1.3, d: 1.1, h: 2.9 };
  const BLOCKS = [[236, 742, 0.9], [272, 760, 0.7], [214, 592, 0.8], [252, 578, 0.6], [610, 560, 0.8], [640, 646, 0.7], [580, 780, 0.6], [372, 512, 0.7], [312, 540, 0.8]];

  // ---- the places to find, and the two pockets ----
  const THRESH = { c: [572, -700] };                               // the grove's threshold, between the two first giants
  const BOUND = { at: [-600, 404] };                               // the boundary stone, on the west track's north verge
  const WELL = { c: [522, 1470], r: 1.5 };                         // the ruined well
  const FALLEN = { root: [1660, 1420], top: [2290, 1290] };        // the fallen giant
  const CAIRN = { c: [2300, 330] };                                // the cairn on the moor's edge
  const NOOK = { c: [1452, 60], r: 2.6, gap: Math.PI };            // pocket: the ring of frosted rocks, its way in on the west
  const ROOM = { c: [300, 622] };                                  // pocket: the ruin's west room
  const FLATS = [[THRESH.c[0], THRESH.c[1] + 30, 6], [BOUND.at[0], BOUND.at[1], 3], [WELL.c[0], WELL.c[1] - 20, 6.5], [CAIRN.c[0], CAIRN.c[1] + 30, 5],
    [(FALLEN.root[0] + FALLEN.top[0]) / 2, (FALLEN.root[1] + FALLEN.top[1]) / 2, 16], [NOOK.c[0], NOOK.c[1], 4.5]];
  // the moor: frosted heather east of here (the ground's pave), with only a few wind-bent trees
  const MOOR = [[1960, -1100], [2100, -560], [2000, -120], [2080, 300], [1990, 720], [2070, 1100], [1970, 1500], [2060, 2100], [3600, 2100], [3600, -1100]];

  // ---- the ground ----
  const W3D = () => G.W3D;
  const vn = (x, y) => (W3D() ? W3D().vnoise(x, y) : 0.5);
  const roll = (x, y, t) => (vn(x / 420, y / 420) - 0.5) * 4.4 + t * (vn(x / 140, y / 140) - 0.5) * 1.2;
  function base(x, y) {
    const out = Math.hypot(Math.max(0, -x, x - 1536), Math.max(0, -y, y - 1024)), k = ss(0, 300, out);
    let h = k > 0 ? k * roll(x, y, ss(25, 90, trailDist(x, y))) : 0;
    // the ground swells toward the great elder's foot
    h += 0.7 * (1 - ss(5.5, 15, mDist(x, y, ELDER.c[0], ELDER.c[1])));
    return h;
  }
  const flatH = FLATS.map(() => null);
  function ground(x, y) {
    let h = base(x, y);
    for (let i = 0; i < FLATS.length; i++) {
      const [fx, fy, fr] = FLATS[i], d = mDist(x, y, fx, fy);
      if (d < fr + 6) { if (flatH[i] == null) flatH[i] = base(fx, fy); h += (flatH[i] - h) * (1 - ss(fr, fr + 6, d)); }
    }
    return h;
  }

  // ---- the painting's boulders [x, y, size], its bare twisted trees [x, y, size, seed, lean x, lean z], its own firs and the
  // giants' kin past it [x, y, size, kind, seed] ----
  // (walk pass 2: the boulder north-east of the giants a few pixels east and a little smaller, off the 2D walk's edge; the small
  // one that stood on the cobbled path in the south-east, where the painting has no boulder, moved to the ferns at its south edge)
  const ROCKS = [
    [886, 410, 1.5], [924, 466, 1.0], [790, 428, 0.7], [1122, 40, 0.7], [1326, 130, 1.05], [1210, 472, 0.8], [1450, 486, 1.2], [460, 316, 1.3], [430, 360, 0.8],
    [500, 350, 0.6], [244, 340, 1.1], [316, 360, 0.7], [690, 360, 0.6], [1055, 805, 1.6], [1035, 975, 1.4], [1250, 830, 0.9], [176, 690, 0.9], [120, 870, 1.3],
    [760, 640, 0.8], [650, 905, 1.2], [818, 590, 0.7], [1404, 656, 0.6], [1500, 860, 1.1],
  ];
  const BARE = [[64, 780, 2.0, 1, 0.15, -0.1], [905, 985, 2.2, 2, -0.1, -0.2], [1478, 186, 1.9, 3, -0.2, 0.1], [190, 40, 1.6, 4, 0.1, 0.1], [1420, 760, 1.6, 5, 0, -0.2],
    [740, 840, 1.5, 6, 0.1, 0], [-200, 700, 1.8, 7, 0, 0], [2000, 700, 1.7, 8, -0.4, 0.05], [2420, 120, 1.5, 9, -0.35, 0], [2550, 1100, 1.6, 10, -0.4, 0.1],
    [2250, 900, 1.3, 11, -0.3, 0], [900, -300, 1.8, 12, 0, 0.1], [-300, 1200, 1.7, 13, 0.1, -0.1]];
  const BIG = [[930, 352, 1.5, 1, 11], [966, 722, 1.6, 1, 12], [1466, 330, 1.5, 1, 13], [830, 70, 1.4, 1, 14], [1300, 10, 1.3, 1, 15], [40, 130, 1.3, 1, 16],
    [60, 600, 1.2, 1, 17], [300, 900, 1.3, 1, 18], [700, 1000, 1.2, 1, 19], [1200, 930, 1.3, 1, 20], [1530, 980, 1.2, 1, 21], [820, 720, 1.0, 1, 22]];

  // ---- the walking map's own walk areas (for keeping things off them) ----
  let WB = null;
  const mapWalk = () => WB || (WB = (((G.MAPS || {})[ID] || { walk: [] }).walk).map((p) => { let a = 1e9, b = 1e9, c = -1e9, e = -1e9; for (const [x, y] of p) { a = Math.min(a, x); b = Math.min(b, y); c = Math.max(c, x); e = Math.max(e, y); } return { p, b: [a, b, c, e] }; }));
  const walkDist = (x, y) => { let d = 1e9; for (const q of mapWalk()) { if (inPoly(q.p, x, y)) return 0; if (x > q.b[0] - d && x < q.b[2] + d && y > q.b[1] - d && y < q.b[3] + d) d = Math.min(d, edgeDist(q.p, x, y)); } return d; };
  const pathDist = (x, y) => Math.min(walkDist(x, y), lineDist(ROAD, x, y) - 1.7 / SX - 18, lineDist(TRAILS, x, y) - 0.8 / SX - 8);
  // keep-out boxes: the elder and its roots, the ring, the ruin, the logs, the places to find, the pockets
  const PLACES = [[400, 0, 720, 250], [990, 30, 1420, 370], [230, 500, 660, 800], [1000, 670, 1380, 790], [380, -900, 770, -620], [-680, 360, -520, 450],
    [420, 1380, 620, 1540], [1600, 1220, 2340, 1480], [2200, 250, 2400, 420], [1380, -10, 1530, 140]];
  const nearPlace = (x, y, m) => PLACES.some((k) => x > k[0] - (m || 0) && x < k[2] + (m || 0) && y > k[1] - (m || 0) && y < k[3] + (m || 0));
  const nearRock = (x, y, m) => ROCKS.some((r) => mDist(x, y, r[0], r[1]) < r[2] + (m || 0));
  const onRoot = (x, y, m) => ROOTS.some(([a, b, c, r]) => Math.min(segDist(x, y, a, b), segDist(x, y, b, c)) * SX < r + (m || 0)) || mDist(x, y, ELDER.c[0], ELDER.c[1]) < ELDER.R + 1 + (m || 0);
  const nearGiant = (x, y, m) => GIANTS.some(([gx, gy, R]) => mDist(x, y, gx, gy) < R + 2.5 + (m || 0));
  // trees lining the track and the trails past the painting, every so often each side (firs and bare twisted trees; none on
  // the moor), so the way runs through the wood and not across a field
  const LINING = (() => {
    const out = [], r = rnd(929);
    for (const t of ROAD.concat(TRAILS)) {
      let side = 1;
      for (let i = 1; i < t.pts.length; i++) {
        const [ax, ay] = t.pts[i - 1], [bx, by] = t.pts[i], L = mDist(ax, ay, bx, by);
        for (let s = 2 + r() * 4; s < L; s += 4 + r() * 5) {
          const f = s / L, cx = ax + (bx - ax) * f, cy = ay + (by - ay) * f, nx = -(by - ay) * SZ / L, nz = (bx - ax) * SX / L, off = (t.w + 1.5 + r() * 2.6) * side;
          const x = Math.round(cx + nx * off / SX), y = Math.round(cy + nz * off / SZ), fir = r() < 0.5, size = fir ? 1.0 + r() * 0.6 : 1.1 + r() * 0.6; side = -side;
          if ((x > -40 && x < 1576 && y > -40 && y < 1064) || pathDist(x, y) < 12 || nearPlace(x, y, 20) || nearRock(x, y, 1.5) || nearGiant(x, y, 1) || inPoly(MOOR, x, y)) continue;
          if (out.some((o) => mDist(x, y, o[0], o[1]) < 3.5)) continue;
          out.push([x, y, +size.toFixed(2), fir ? 1 : 2, Math.floor(r() * 1000)]);
        }
      }
    }
    return out;
  })();

  // ---- the undergrowth: red, frosted and violet, along the paths' edges ----
  const FLOWERS_ALL = (() => {
    const out = [], r = rnd(5309), kinds = ['fruit', 'fruit', 'white', 'white', 'violet', 'mix'];
    const ok = (x, y, rr) => { const d = pathDist(x, y); return d > rr / SX + 6 && d < 130 && !nearPlace(x, y, 6) && !nearRock(x, y, rr + 0.4) && !onRoot(x, y, rr) && !nearGiant(x, y) && !inPoly(MOOR, x, y); };
    for (let i = 0; i < 900 && out.length < 130; i++) { const x = -40 + r() * 1616, y = -40 + r() * 1104, rr = 0.45 + r() * 0.45; if (ok(x, y, rr)) out.push([Math.round(x), Math.round(y), +rr.toFixed(2), kinds[Math.floor(r() * kinds.length)]]); }
    for (const t of ROAD.concat(TRAILS)) for (let i = 1; i < t.pts.length; i++) {
      const [ax, ay] = t.pts[i - 1], [bx, by] = t.pts[i], L = mDist(ax, ay, bx, by);
      for (let s = r() * 6; s < L; s += 8 + r() * 8) {
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
  // the moor's own stones
  const MOOR_ROCKS = (() => { const r = rnd(77), out = []; for (let i = 0; i < 60 && out.length < 26; i++) { const x = 2120 + r() * 600, y = -700 + r() * 2400, s = 0.6 + r() * 1.1; if (lineDist(ROAD, x, y) > 110 && lineDist(TRAILS, x, y) > 60 && mDist(x, y, CAIRN.c[0], CAIRN.c[1]) > 8) out.push([Math.round(x), Math.round(y), +s.toFixed(2)]); } return out; })();
  const MIST = [[200, 300, 9], [760, 300, 8], [1400, 420, 8], [300, 800, 9], [1100, 900, 9], [820, 60, 7], [1200, 600, 7], [572, -700, 10], [-520, -220, 10],
    [150, -570, 9], [522, 1470, 8], [1950, 1350, 10], [2300, 330, 9], [-600, 404, 8], [-900, 100, 10], [-800, 1000, 10], [300, 1500, 10], [1300, -350, 10],
    [2500, -300, 10], [2500, 1500, 10], [1800, 200, 9], [1000, 1250, 9], [-200, -600, 10], [1700, -500, 10]];

  P[ID] = {
    id: ID, name: 'Eldergrove’s edge', painting: "art/walk/walk-eldergrove-edge.avif", size: [1536, 1024],
    mapId: ID, paintingPng: 'reference/art/walk/wilds/walk-eldergrove-edge.png',
    // (the open ground runs on past the way onto the moor, so its far edge is lost in the fog)
    extent: [-1536, -1024, 3500, 2048],
    open: { bounds: [[-1130, 520], [-1180, 150], [-1150, -300], [-1000, -650], [-600, -800], [-100, -820], [300, -880], [840, -880], [1300, -820], [1800, -780],
      [2300, -800], [2650, -560], [2720, -100], [2690, 400], [2724, 560], [2724, 680], [2760, 1000], [2700, 1450], [2500, 1780], [2000, 1840], [1400, 1800],
      [900, 1860], [300, 1820], [-300, 1840], [-900, 1760], [-1150, 1400], [-1200, 900], [-1160, 520]] },
    // the wall check: from the track in the painting's middle, to the start, the hollow, the side path's foot, the ring
    // (inside, behind the moon stone, the trail round its west), under the arch, the path south, both ways on, every
    // place to find and both pockets
    checks: { from: [760, 520], goals: [
      ['the start, at the painting’s west edge', 50, 470], ['in the great elder’s hollow', 556, 204], ['the side path up to the elder', 560, 330],
      ['inside the ring of stones', 1150, 290], ['behind the moon stone', 1182, 96], ['the trail round the ring’s west side', 962, 230],
      ['under the ruined arch', 450, 620], ['the path south, at the painting’s foot', 550, 1000],
      ['the way on to the northern camp (the west exit)', -1140, 470], ['the way on to the cold moor (the east exit)', 2712, 620],
      ['the grove’s threshold (north)', 572, -688], ['the elder giants (north-west)', -400, -110], ['the boundary stone (west)', -600, 450],
      ['the ruined well (south)', 522, 1420], ['the fallen giant (south-east)', 1576, 1384], ['the cairn on the moor’s edge (east)', 2290, 390],
      ['in the ring of frosted rocks (pocket, north-east)', 1452, 60], ['in the ruin’s west room (pocket)', 305, 604]] },
    // the trees: on the painting from the painting itself (firs and bare twisted trees, a few broad ones); past it in clumps,
    // firs and bare trees, thicker toward the grove; none on the moor but a few wind-bent ones (set by hand)
    treeGen: { dark: 0.3, step: 56, fir: 0.6, firSouth: 0.6, thorn: 0.45,
      out: { density: 0.6, clump: 460, clear: 0.33, kinds: [0.12, 0.48, 0.4], size: [1.1, 1.7] },
      roads: [],
      keepOut: PLACES.concat([[1960, -1100, 3600, 2100]])
        .concat(ROCKS.map(([x, y, s]) => [x - s / SX * 0.9, y - s / SZ * 0.9, x + s / SX * 0.9, y + s / SZ * 0.9]))
        .concat(GIANTS.map(([x, y, R]) => [x - (R + 2) / SX, y - (R + 2) / SZ, x + (R + 2) / SX, y + (R + 2) / SZ]))
        .concat(BIG.map(([x, y, s]) => [x - 1.3 * s / SX, y - 1.3 * s / SZ, x + 1.3 * s / SX, y + 1.3 * s / SZ]))
        .concat(BARE.map(([x, y, s]) => [x - 1.4 * s / SX, y - 1.4 * s / SZ, x + 1.4 * s / SX, y + 1.4 * s / SZ]))
        .concat(ROOTS.map(([a, b, c]) => [Math.min(a[0], b[0], c[0]) - 20, Math.min(a[1], b[1], c[1]) - 20, Math.max(a[0], b[0], c[0]) + 20, Math.max(a[1], b[1], c[1]) + 20])) },
    // the ground: the pebbly earth track (the walk, the track on and the trails), moss and small stones along its verges, the
    // red and frosted undergrowth everywhere else, frosted heather on the moor
    ground: { cob: 'shared_dirt_track', dirt: 'shared_forest_floor', grass: 'frosted_undergrowth', pave: 'moor_heather_frost', rep: [1.9, 3.0, 2.6, 3.2],
      grassTint: [0.62, 0.64, 0.74], cobTint: [0.95, 0.9, 0.92], dirtTint: [0.78, 0.8, 0.9], paveTint: [0.8, 0.82, 0.9] },
    surfaces: { stone: 'eldergrove_ruin_stone', dry: 'eldergrove_ruin_stone', timber: 'eldergrove_elder_bark', planks: 'log_bark_mossy', roof: 'log_bark_mossy',
      wood: 'eldergrove_dead_bark', deck: 'shared_dirt_track', pave: 'shared_dirt_track', cloth: 'frosted_undergrowth', soil: 'frozen_earth_path',
      rock: 'boulder_mossy_frost', leaves: 'wilds_oak_leaves', firs: 'fir_foliage_frosted', bark: 'eldergrove_dead_bark' },
    tints: { leaves: 0xc8d8e8, firs: 0xc8d8e4, bush: 0xc0d0dc, wood: 0xc8c0cc },
    extraMats: {
      elder: { tex: 'eldergrove_elder_bark', rep: 2.4, shade: 0.5 },
      log: { tex: 'log_bark_mossy', rep: 1.6, shade: 0.5 },
      monolith: { tex: 'boulder_mossy_frost', rep: 2.2, tint: 0xe4e4f0, shade: 0.45 },
      bracken: { tint: 0x7e4c36, side: 'double', shade: 0.6 },
      fern: { tint: 0x5a7e7a, side: 'double', shade: 0.6 },
      glowcap: { tint: 0xb8dcff, lit: 0, glow: 0, side: 'double' },
      endgrain: { tint: 0xb8a8a0, shade: 0.5 },
      dark: { tint: 0x0c0a10, lit: 0, glow: 0, cut: false, side: 'double' },
    },
    // the same heavy cold fog as the Thornwood: only so much is drawn at once; no far hills (the fog is the edge)
    night: { fog: [0.17, 0.18, 0.33], fogNear: 10, fogFar: 42, far: 90, hills: false, sky: [0.6, 0.62, 0.76], moon: [0.42, 0.46, 0.64] },
    textures: [
      { id: 'shared_dirt_track', made: "./../texture-packs/made-web/shared_dirt_track.webp", stand: "./../texture-packs/wilds-south/eldergrove-edge/stand-in/shared_dirt_track.png" },
      { id: 'shared_forest_floor', made: "./../texture-packs/made-web/shared_forest_floor.webp", stand: "./../texture-packs/wilds-south/dawnroost-road/stand-in/shared_forest_floor.png" },
      { id: 'frozen_earth_path', made: "./../texture-packs/made-web/frozen_earth_path.webp", stand: "./../texture-packs/wilds-north/cold-moor/stand-in/frozen_earth_path.png" },
      { id: 'frosted_undergrowth', made: "./../texture-packs/made-web/frosted_undergrowth.webp", stand: "./../texture-packs/wilds-north/northern-camp/stand-in/frosted_undergrowth.png" },
      { id: 'moor_heather_frost', made: "./../texture-packs/made-web/moor_heather_frost.webp", stand: "./../texture-packs/wilds-north/cold-moor/stand-in/moor_heather_frost.png" },
      { id: 'eldergrove_elder_bark', made: "./../texture-packs/made-web/eldergrove_elder_bark.webp", stand: "./../texture-packs/wilds-south/eldergrove-edge/stand-in/eldergrove_elder_bark.png" },
      { id: 'eldergrove_dead_bark', made: "./../texture-packs/made-web/eldergrove_dead_bark.webp", stand: "./../texture-packs/wilds-south/eldergrove-edge/stand-in/eldergrove_dead_bark.png" },
      { id: 'eldergrove_ruin_stone', made: "./../texture-packs/made-web/eldergrove_ruin_stone.webp", stand: "./../texture-packs/wilds-south/eldergrove-edge/stand-in/eldergrove_ruin_stone.png" },
      { id: 'boulder_mossy_frost', made: "./../texture-packs/made-web/boulder_mossy_frost.webp", stand: "./../texture-packs/wilds-north/northern-camp/stand-in/boulder_mossy_frost.png" },
      { id: 'fir_foliage_frosted', made: "./../texture-packs/made-web/fir_foliage_frosted.webp", stand: "./../texture-packs/wilds-north/northern-camp/stand-in/fir_foliage_frosted.png" },
      { id: 'log_bark_mossy', made: "./../texture-packs/made-web/log_bark_mossy.webp", stand: "./../texture-packs/wilds-north/northern-camp/stand-in/log_bark_mossy.png" },
      { id: 'wilds_oak_leaves', made: "./../texture-packs/made-web/wilds_oak_leaves.webp", stand: "./../texture-packs/wilds-south/dawnroost-road/stand-in/wilds_oak_leaves.png" },
    ],
    ground_h: ground,
    walk_h: ground,
    water: [],
    lawns: [],
    start: [50, 470], startFace: Math.PI / 2, startYaw: -Math.PI / 2,
    exits: [
      { rect: [-1150, 430, -1128, 510], label: 'The northern camp' },
      { rect: [2700, 575, 2722, 665], label: 'The cold moor' },
    ],
    // the track on and the trails (earth and pebbles down the middle, moss along the verges)
    walkAdd: ROAD.map((t) => ({ poly: ribbon(t.pts, t.w + 0.7), ground: 'dirt' })).concat(ROAD.map((t) => ({ poly: ribbon(t.pts, t.w), ground: 'cob' })))
      .concat(TRAILS.map((t) => ({ poly: ribbon(t.pts, t.w + 0.4), ground: 'dirt' }))).concat(TRAILS.map((t) => ({ poly: ribbon(t.pts, t.w), ground: 'cob' }))),
    groundPatches: [{ poly: MOOR, kind: 'pave' }],
    items: {},
    buildings: [],
    walls: [],
    steps: [],
    lamps: [],
    props: ROCKS.concat(MOOR_ROCKS).map(([x, y, s]) => ({ k: 'rock', at: [x, y], size: s })),
    get flowers() { return flowersNow(); },
    // the lights for the light map: no warm light anywhere here; the moon in the clearings, and the mushrooms' faint cold glow
    lights: [
      [556, 300, 200, 0.35, 'moon'], [1160, 260, 200, 0.45, 'moon'], [450, 600, 160, 0.3, 'moon'], [700, 160, 90, 0.4, 'moon'], [110, 340, 80, 0.35, 'moon'],
      [1110, 735, 90, 0.35, 'moon'], [1500, 920, 80, 0.35, 'moon'], [800, 520, 260, 0.2, 'moon'], [572, -700, 160, 0.4, 'moon'], [522, 1470, 140, 0.4, 'moon'],
      [2300, 330, 200, 0.35, 'moon'], [1452, 60, 90, 0.5, 'moon'], [300, 622, 70, 0.45, 'moon'], [-600, 404, 110, 0.3, 'moon'], [2400, 600, 400, 0.25, 'moon'],
    ],
    trees: ID,
    extraTrees: BIG.map((b) => b.slice()).concat(LINING).concat([[2200, -400, 1.2, 2, 61], [2480, 300, 1.1, 2, 62], [2350, 1300, 1.2, 2, 63], [2600, -650, 1.0, 2, 64],
      [2150, 1650, 1.1, 1, 65], [2240, 800, 0.9, 1, 66], [2600, 820, 1.0, 2, 67], [2180, 120, 0.9, 1, 68]]),

    // ---- what the engine has no field for: the great elder (its trunk, hollow and roots), the other giants, the ring of
    // standing stones, the ruin, the bare twisted trees, the fallen logs and their mushrooms, bracken, ferns, the places to
    // find, the two pockets, the firs' low boughs (solid), and the mist ----
    extra(K) {
      const { B, X, Z } = K, W = G.W3D, TAU = Math.PI * 2, TH = K.terrain;
      const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
      const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
      const norm = (a) => { const L = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / L, a[1] / L, a[2] / L]; };
      const Q = (k, a, b, c, d, want, uv, col) => { const n = cross(sub(b, a), sub(d, a)); if (dot(n, want) < 0) B.quad(k, b, a, d, c, uv, col); else B.quad(k, a, b, c, d, uv, col); };
      const at = (px, py, dy) => [X(px), TH(px, py) + (dy || 0), Z(py)];
      const M2px = (x) => K.M.px(x), M2py = (z) => K.M.py(z);
      function seg(A, Bp, ra, rb, n, col, k) {
        const d = sub(Bp, A), L = Math.hypot(d[0], d[1], d[2]), dir = mul(d, 1 / L);
        const u = norm(cross(Math.abs(dir[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0], dir)), v = cross(dir, u);
        const ring = (c, r, t) => add(c, add(mul(u, Math.cos(t) * r), mul(v, Math.sin(t) * r)));
        for (let i = 0; i < n; i++) { const t0 = i / n * TAU, t1 = (i + 1) / n * TAU; B.quad(k || 'wood', ring(A, ra, t0), ring(A, ra, t1), ring(Bp, rb, t1), ring(Bp, rb, t0), [t0 * ra, 0, t1 * ra, L], col); }
      }
      function disc(c, n, r, sides, k, col) {
        const u = norm(cross(Math.abs(n[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0], n)), v = cross(n, u);
        for (let i = 0; i < sides; i++) { const a = i / sides * TAU, b = (i + 1) / sides * TAU; B.tri(k, c, add(c, add(mul(u, Math.cos(a) * r), mul(v, Math.sin(a) * r))), add(c, add(mul(u, Math.cos(b) * r), mul(v, Math.sin(b) * r))), [[0, 0], [r, 0], [0, r]], col); }
      }
      const logAB = (A, Bp, r, col, n) => { seg(A, Bp, r, r * 0.94, n || 8, col, 'log'); const d = norm(sub(Bp, A)); disc(A, mul(d, -1), r, n || 8, 'endgrain'); disc(Bp, d, r * 0.94, n || 8, 'endgrain'); };
      const rock = (px, py, sz, solid, col) => { B.geom('rock', K.rockG[Math.floor(Math.abs(Math.sin(px * 12.9 + py * 7.3)) * 3) % 3], new THREE.Matrix4().compose(new THREE.Vector3(X(px), TH(px, py) - sz * 0.2, Z(py)), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, (px * 0.37 + py * 0.11) % TAU, 0)), new THREE.Vector3(sz, sz, sz)), col || null, 1.2); if (solid) K.addBlock(K.circlePx(px, py, sz * 0.8, 8)); else B.solids.pop(); };
      const mound = (px, py, rr, r, solid, kind) => {
        const x = X(px), z = Z(py), y = TH(px, py), h = rr * (0.6 + r() * 0.3);
        B.geom('leafBush', K.ico[Math.floor(r() * 3)], new THREE.Matrix4().compose(new THREE.Vector3(x, y + h * 0.35, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, r() * TAU, 0)), new THREE.Vector3(rr, h, rr)), [0.85, 0.88, 0.95], 2.0);
        if (kind) for (let i = 0; i < Math.max(2, Math.round(rr * 2.5)); i++) { const a = r() * TAU, d = r() * rr * 0.6, cx = x + Math.cos(a) * d, cz = z + Math.sin(a) * d, cy = y + h * (0.6 + r() * 0.5), sz = 0.35 + r() * 0.2, t = r() * Math.PI; B.quad('fl_' + kind, [cx - Math.cos(t) * sz, cy - sz * 0.6, cz - Math.sin(t) * sz], [cx + Math.cos(t) * sz, cy - sz * 0.6, cz + Math.sin(t) * sz], [cx + Math.cos(t) * sz, cy + sz, cz + Math.sin(t) * sz], [cx - Math.cos(t) * sz, cy + sz, cz - Math.sin(t) * sz], [0, 0, 1, 1]); }
        if (solid) K.addBlock(K.circlePx(px, py, rr * 0.75, 8)); else B.solids.pop();
      };
      const fern = (px, py, s, r, k) => {
        const x = X(px), z = Z(py), y = TH(px, py), n = 7 + Math.floor(r() * 4), a0 = r() * TAU;
        for (let i = 0; i < n; i++) {
          const a = a0 + i / n * TAU + (r() - 0.5) * 0.4, L = (0.42 + r() * 0.28) * s, w = 0.09 * s, ca = Math.cos(a), sa = Math.sin(a);
          const mid = [x + ca * L * 0.5, y + 0.5 * s, z + sa * L * 0.5], tip = [x + ca * L, y + 0.22 * s, z + sa * L], c = 0.8 + r() * 0.35, cc = [c, c, c], c2 = [c * 0.9, c * 0.9, c * 0.9];
          B.tri(k || 'fern', [x, y + 0.02, z], [mid[0] - sa * w, mid[1], mid[2] + ca * w], mid, [[0, 0], [0.1, 0.5], [0, 0.5]], cc);
          B.tri(k || 'fern', [x, y + 0.02, z], mid, [mid[0] + sa * w, mid[1], mid[2] - ca * w], [[0, 0], [0, 0.5], [0.1, 0.5]], cc);
          B.tri(k || 'fern', [mid[0] - sa * w, mid[1], mid[2] + ca * w], tip, mid, [[0, 0.5], [0, 1], [0.05, 0.5]], c2);
          B.tri(k || 'fern', mid, tip, [mid[0] + sa * w, mid[1], mid[2] - ca * w], [[0.05, 0.5], [0, 1], [0.1, 0.5]], c2);
        }
      };
      const tuft = (px, py, n, hgt, col, r) => {
        const x = X(px), z = Z(py), y = TH(px, py);
        for (let i = 0; i < n; i++) { const a = r() * TAU, lean = 0.12 + r() * 0.3, h = hgt * (0.7 + r() * 0.5), w = 0.04 + r() * 0.03, bx = x + (r() - 0.5) * 0.6, bz = z + (r() - 0.5) * 0.5, ox = Math.cos(a), oz = Math.sin(a);
          B.tri('fern', [bx - oz * w, y, bz + ox * w], [bx + oz * w, y, bz - ox * w], [bx + ox * lean, y + h, bz + oz * lean], [[0, 0], [0.1, 0], [0.05, 1]], col); }
      };
      // a pale mushroom cap growing out of bark (a flattened half-disc) facing n, glowing faintly
      const shelf = (c, n, r) => { const u = norm(cross([0, 1, 0], n)); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI, b = (i + 1) / 6 * Math.PI; const pa = add(c, add(mul(u, Math.cos(a) * r), mul(n, Math.sin(a) * r))), pb = add(c, add(mul(u, Math.cos(b) * r), mul(n, Math.sin(b) * r))); B.tri('glowcap', c, pa, pb, [[0, 0], [1, 0], [0, 1]]); } };
      const toad = (px, py, s, dy) => { const x = X(px), z = Z(py), y = TH(px, py) + (dy || 0); B.cyl('glowcap', x, y - 0.02, z, 0.04 * s, 0.035 * s, 0.2 * s, 5, [0.8, 0.85, 0.9]); B.solids.pop(); B.cyl('glowcap', x, y + 0.17 * s, z, 0.16 * s, 0.02, 0.08 * s, 7, null); B.solids.pop(); };
      const ringBlock = (c, r0, r1, gap, gw) => {
        const rm = (r0 + r1) / 2, hw = (r1 - r0) / 2, ga = gw / rm + hw / rm, pts = [], n = 28, pt = (a, r) => [c[0] + Math.cos(a) * r / SX, c[1] + Math.sin(a) * r / SZ];
        for (let i = 0; i <= n; i++) pts.push(pt(gap + ga + (TAU - 2 * ga) * i / n, r1));
        for (let i = n; i >= 0; i--) pts.push(pt(gap + ga + (TAU - 2 * ga) * i / n, r0));
        K.addBlock(pts);
        for (const e of [gap + ga, gap - ga]) { const q = pt(e, rm); K.addBlock(K.circlePx(q[0], q[1], hw, 12)); }
      };
      function standingStone(sx, sy, w, d, h, ry, seed, col, k) {
        const base = TH(sx, sy) - 0.3, g = new THREE.BoxGeometry(1, 1, 1, 3, 9, 2), p = g.attributes.position;
        const hh = (a, b, c) => { const s = Math.sin(a * 127.1 + b * 311.7 + c * 74.7 + seed) * 43758.5453; return s - Math.floor(s); };
        for (let i = 0; i < p.count; i++) {
          const x = p.getX(i), y = p.getY(i), z = p.getZ(i), t = y + 0.5; let yy = t;
          if (t > 0.72) yy -= (x * x) * 0.9 * ss(0.72, 1, t);
          const n = (hh(x, y, z) - 0.5) * 0.06;
          p.setXYZ(i, x * (1 - 0.14 * t) * w + n, yy * h + n, z * d * (1 - 0.12 * t) + n * 0.5);
        }
        g.computeVertexNormals();
        B.geom(k || 'monolith', g, new THREE.Matrix4().compose(new THREE.Vector3(X(sx), base, Z(sy)), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(1, 1, 1)), col || [1.0, 1.0, 1.05], [w, h]);
        g.dispose();
        return base;
      }
      // a sun carved on a face (a ring, a boss and twelve rays) or a crescent moon, a hand proud of the face
      function sun(c, n, R, col, k) {
        const u = norm(cross([0, 1, 0], n)), v = [0, 1, 0], p = (a, r) => add(add(c, mul(u, Math.cos(a) * r)), mul(v, Math.sin(a) * r));
        for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, b = (i + 1) / 16 * TAU; Q(k, p(a, R * 0.42), p(b, R * 0.42), p(b, R * 0.56), p(a, R * 0.56), n, [0, 0, 0.2, 0.2], col); B.tri(k, c, p(a, R * 0.3), p(b, R * 0.3), [[0, 0], [0.1, 0], [0, 0.1]], col); }
        for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, w = 0.11; B.tri(k, p(a + w, R * 0.64), p(a - w, R * 0.64), p(a, R), [[0, 0], [0.1, 0], [0.05, 0.2]], col); }
      }
      function moon(c, n, R, col, k) {
        const u = norm(cross([0, 1, 0], n)), v = [0, 1, 0], p = (a, r, o) => add(add(c, mul(u, Math.cos(a) * r + (o || 0))), mul(v, Math.sin(a) * r)), N = 14;
        for (let i = 0; i < N; i++) {
          const ta = Math.PI * 0.5 + Math.PI * i / N, tb = Math.PI * 0.5 + Math.PI * (i + 1) / N, wa = 0.42 * Math.sin(Math.PI * i / N), wb = 0.42 * Math.sin(Math.PI * (i + 1) / N);
          Q(k, p(ta, R), p(tb, R), p(tb, R * (1 - wb)), p(ta, R * (1 - wa)), n, [0, 0, 0.2, 0.2], col);
        }
      }

      // ---- the great elder: the vast trunk, its foot flaring into the roots, rising into the fog, the hollow between two
      // roots on its south face ----
      {
        const [cx, cy] = ELDER.c, x = X(cx), z = Z(cy), y = TH(cx, cy + 100), H = ELDER.hollow, col = [0.92, 0.9, 0.95];
        const RINGS = [[-0.8, 1.22], [0.6, 1.08], [1.8, 1.0], [H.top, 0.95], [5.5, 0.88], [9, 0.8], [15, 0.73], [24, 0.68], [36, 0.64]];
        const hl = X(H.x0) - x, hr = X(H.x1) - x, aL = Math.atan2(Math.sqrt(Math.max(0, ELDER.R ** 2 - hl * hl)), hl), aR = Math.atan2(Math.sqrt(Math.max(0, ELDER.R ** 2 - hr * hr)), hr);
        const ANG = []; for (let i = 0; i < 36; i++) ANG.push(i / 36 * TAU); ANG.push(aL, aR); ANG.sort((a, b) => a - b);
        const inHollow = (a0, a1) => a0 >= aR - 1e-6 && a1 <= aL + 1e-6;
        const wob = (a, h) => 1 + 0.07 * Math.sin(a * 7 + h * 0.3) + 0.05 * Math.sin(a * 13 + 1.7) + 0.04 * Math.sin(a * 3 - h * 0.2);
        // the bark's front at the hollow's two sides, for each ring (so the bark meets the hollow's walls exactly)
        const front = (k, hx) => z + Math.sqrt(Math.max(0, (ELDER.R * RINGS[k][1]) ** 2 - hx * hx));
        const P_ = (a, k) => {
          const [h, s] = RINGS[k];
          if (k <= 3 && Math.abs(a - aL) < 1e-6) return [x + hl, y + h, front(k, hl)];
          if (k <= 3 && Math.abs(a - aR) < 1e-6) return [x + hr, y + h, front(k, hr)];
          const inS = a > aR && a < aL, r = ELDER.R * s * (k <= 3 && inS ? 1 : wob(a, h));
          // the opening's top comes to a point (the ring at its top rises toward the middle)
          const lift = k === 3 && inS ? 0.9 * (1 - Math.abs(a - Math.PI / 2) / ((aL - aR) / 2)) : 0;
          return [x + Math.cos(a) * r, y + h + lift, z + Math.sin(a) * r];
        };
        for (let k = 0; k < RINGS.length - 1; k++) for (let i = 0; i < ANG.length; i++) {
          const a0 = ANG[i], a1 = i + 1 < ANG.length ? ANG[i + 1] : ANG[0] + TAU;
          if (k < 3 && inHollow(a0, a1)) continue;
          const pa = P_(a0, k), pb = P_(a1, k), pc = P_(a1, k + 1), pd = P_(a0, k + 1);
          Q('elder', pa, pb, pc, pd, [Math.cos((a0 + a1) / 2), 0, Math.sin((a0 + a1) / 2)], [a0 * ELDER.R, RINGS[k][0], a1 * ELDER.R, RINGS[k + 1][0]], col);
        }
        // the hollow: its sides, its back and its pointed roof, dark inside
        const xL = X(H.x0), xR = X(H.x1), xM = (xL + xR) / 2, zB = Z(H.back), top = y + H.top, peak = y + H.top + 0.9, zP = z + ELDER.R * 0.95 + 0.05;
        const dk = [0.16, 0.14, 0.18];
        // its two sides, ring by ring from the back out to the bark's front
        for (let k = 0; k < 3; k++) {
          const ya = y + RINGS[k][0], yb2 = y + RINGS[k + 1][0];
          Q('elder', [xL, ya, zB], [xL, ya, front(k, hl)], [xL, yb2, front(k + 1, hl)], [xL, yb2, zB], [1, 0, 0], [zB, ya, front(k, hl), yb2], dk);
          Q('elder', [xR, ya, zB], [xR, ya, front(k, hr)], [xR, yb2, front(k + 1, hr)], [xR, yb2, zB], [-1, 0, 0], [zB, ya, front(k, hr), yb2], dk);
        }
        // its back, and its pointed roof up to the bark's front
        Q('dark', [xL, y - 0.8, zB], [xR, y - 0.8, zB], [xR, top, zB], [xL, top, zB], [0, 0, 1], [0, 0, 1, 1]);
        B.tri('dark', [xL, top, zB], [xR, top, zB], [xM, peak, zB], [[0, 0], [1, 0], [0.5, 1]]);
        Q('elder', [xL, top, zB], [xL, top, front(3, hl)], [xM, peak, zP], [xM, peak, zB], [1, -1, 0], [0, 0, 1, 1], dk);
        Q('elder', [xR, top, zB], [xR, top, front(3, hr)], [xM, peak, zP], [xM, peak, zB], [-1, -1, 0], [0, 0, 1, 1], dk);
        // solid: the trunk round the hollow (its sides and back), as one outline
        {
          const pts = [], n = 40, Rb = ELDER.R * 1.2;
          const A0 = Math.atan2(Math.sqrt(Math.max(0, Rb * Rb - (X(H.x1 + 2) - x) ** 2)), X(H.x1 + 2) - x), A1 = Math.atan2(Math.sqrt(Math.max(0, Rb * Rb - (X(H.x0 - 2) - x) ** 2)), X(H.x0 - 2) - x);
          for (let i = 0; i <= n; i++) { const a = A1 + (A0 + TAU - A1) * i / n; pts.push([M2px(x + Math.cos(a) * Rb), M2py(z + Math.sin(a) * Rb)]); }
          pts.push([H.x1 + 2, H.back - 4], [H.x0 - 2, H.back - 4]);
          K.addBlock(pts);
        }
        // the roots: great mossy limbs over the ground, from the trunk's foot out
        for (const [a, b, c, R] of ROOTS) {
          const A = at(a[0], a[1], 0.7 * R), Bm = at(b[0], b[1], 0.35 * R), C = at(c[0], c[1], -0.1);
          seg(A, Bm, R, R * 0.62, 7, col, 'elder'); seg(Bm, C, R * 0.62, 0.08, 6, col, 'elder');
          K.addBlock(ribbon([a, b], R * 0.85)); K.addBlock(ribbon([b, [b[0] + (c[0] - b[0]) * 0.7, b[1] + (c[1] - b[1]) * 0.7]], R * 0.5));
        }
        // the pale mushrooms on its east side and on the roots, glowing faintly cold
        const r = rnd(7);
        for (const [hx, hy, hz, n] of [[0.94, 1.6, 0.35, 5], [0.9, 2.4, 0.15, 4], [0.97, 0.9, 0.55, 3], [-0.95, 1.3, 0.3, 3]]) {
          const a = Math.atan2(hz, hx), rr = ELDER.R * wob(a, hy), c = [x + Math.cos(a) * rr, y + hy, z + Math.sin(a) * rr], nn = [Math.cos(a), 0, Math.sin(a)];
          for (let i = 0; i < n; i++) shelf(add(c, [0, i * 0.28 - 0.3, (r() - 0.5) * 0.4]), nn, 0.22 + r() * 0.14);
          K.halo(c[0] + nn[0] * 0.6, c[1], c[2] + nn[2] * 0.6, 2.2, [0.12, 0.2, 0.36]);
        }
        K.shadeMarks.push(['dot', cx, cy + 40, 200, 0.55]);
      }

      // ---- the other giants: trunks lost in the fog, flared feet, roots; the two at the threshold with roots across the
      // gap between them ----
      for (const [gx, gy, R, seed] of GIANTS) {
        const x = X(gx), z = Z(gy), y = TH(gx, gy), r = rnd(seed * 31), col = [0.88, 0.86, 0.92];
        const g = new THREE.CylinderGeometry(1, 1, 1, 22, 6, true), p = g.attributes.position;
        for (let i = 0; i < p.count; i++) { const a = Math.atan2(p.getZ(i), p.getX(i)), t = p.getY(i) + 0.5, rr = (1 + 0.35 * Math.pow(1 - t, 3)) * (1 - 0.3 * t) * (1 + 0.07 * Math.sin(a * 7 + seed) + 0.05 * Math.sin(a * 13 + t * 3)); p.setXYZ(i, Math.cos(a) * rr * R, t * 34 - 0.6, Math.sin(a) * rr * R); }
        g.computeVertexNormals(); B.geom('elder', g, new THREE.Matrix4().makeTranslation(x, y, z), col, [3, 4]); B.solids.pop(); g.dispose();
        K.addBlock(K.circlePx(gx, gy, R * 1.3, 18));
        for (let i = 0; i < 7; i++) {
          const a = i / 7 * TAU + r() * 0.5, L = R + 2.2 + r() * 2.2, A = [x + Math.cos(a) * R * 0.9, y + 1.4, z + Math.sin(a) * R * 0.9], Bm = [x + Math.cos(a) * (R + 1.2), y + 0.5, z + Math.sin(a) * (R + 1.2)], C = [x + Math.cos(a) * L, y - 0.2, z + Math.sin(a) * L];
          seg(A, Bm, 0.85, 0.55, 6, col, 'elder'); seg(Bm, C, 0.55, 0.07, 5, col, 'elder');
          const bp = [M2px(Bm[0]), M2py(Bm[2])], cp = [M2px(C[0] * 0.7 + Bm[0] * 0.3), M2py(C[2] * 0.7 + Bm[2] * 0.3)];
          if (pathDist(cp[0], cp[1]) > 14 && pathDist(bp[0], bp[1]) > 14) K.addBlock(ribbon([bp, cp], 0.45));
        }
        K.shadeMarks.push(['dot', gx, gy, R / SX * 1.5, 0.55]);
      }
      // the threshold: a worn stone sill between the two first giants, and their roots grown across the way beyond it
      {
        const [tx, ty] = THRESH.c, y = TH(tx, ty);
        B.solid = false; B.box('monolith', X(tx), y - 0.25, Z(ty + 6), 2.4, 0.33, 1.1, 0, [0.9, 0.9, 0.98]); B.solid = true;
        const col = [0.88, 0.86, 0.92];
        for (const [a, b, h, R] of [[[470, -760], [680, -790], 0.9, 0.5], [[480, -790], [670, -750], 0.5, 0.42], [[500, -740], [650, -770], 1.5, 0.35], [[470, -820], [690, -810], 0.6, 0.6]]) {
          seg(at(a[0], a[1], h), at(b[0], b[1], h + 0.3), R, R * 0.8, 6, col, 'elder');
        }
        K.addBlock(W.rectPoly([470, -830, 690, -735]));
        for (let i = 0; i < 4; i++) toad(tx - 50 + i * 30, ty - 30 + (i % 2) * 12, 1.3);
        // (and the moor's own stones run on past its way on, into the fog)
        for (const [mx, my, ms] of [[2820, 560, 1.4], [2900, 700, 1.1], [3000, 600, 1.8], [3150, 720, 1.3], [3080, 480, 1.0], [3250, 620, 1.6]]) rock(mx, my, ms, false);
        K.halo(X(tx), y + 1.2, Z(ty - 40), 4, [0.08, 0.12, 0.22]);
      }

      // ---- the ring of seven standing stones ----
      for (const [sx, sy, w, d, h, ry, carve] of RING) {
        const cy = sy - d / 2 / SZ, y0 = standingStone(sx, cy, w, d, h, ry, sx * 0.1, carve ? [1.02, 1.02, 1.08] : null);
        const n = [Math.sin(ry), 0, Math.cos(ry)], c = add([X(sx), y0 + h * 0.62, Z(cy)], mul(n, d / 2 * (1 - 0.12 * 0.62) + 0.03));
        if (carve === 'moon') moon(c, n, 0.62, [1.3, 1.3, 1.4], 'monolith');
        if (carve === 'sun') sun(c, n, 0.6, [1.3, 1.28, 1.2], 'monolith');
        if (!((G.MAPS[ID].block) || []).some((b) => inPoly(b, sx, sy - 6))) K.addBlock(K.circlePx(sx, cy, Math.min(w, 2.0) * 0.5, 10));
        K.shadeMarks.push(['dot', sx, sy, w / SX * 0.6, 0.65]);
      }
      // the rocks at the stones' feet, and the fallen branch over the undergrowth below them
      {
        const r = rnd(17);
        for (const [sx, sy, w] of RING) for (let i = 0; i < 2; i++) { const px = sx + (r() - 0.5) * w / SX * 1.4, py = sy + 4 + r() * 10; if (walkDist(px, py) > 8) rock(px, py, 0.2 + r() * 0.2, false); }
        const A = at(1196, 432, 0.25), Bq = at(1316, 498, 0.18);
        seg(A, Bq, 0.16, 0.08, 5, [0.85, 0.82, 0.86], 'wood');
        for (let i = 0; i < 4; i++) { const p0 = add(A, mul(sub(Bq, A), 0.2 + i * 0.2)); seg(p0, add(p0, [(r() - 0.5) * 1.2, 0.5 + r() * 0.6, (r() - 0.5) * 1.2]), 0.05, 0.01, 3, [0.85, 0.82, 0.86], 'wood'); }
      }

      // ---- the ruin: the round arch the path goes under, broken walls, the sun pillar, the outer pillar, fallen blocks,
      // and the cobbles of the arch's threshold ----
      {
        const r = rnd(29), wallBox = (x, z, L, h, t, ry, g, u0) => B.box('stone', x, g - 0.4, z, L, h + 0.4, t, ry, [0.9, 0.9, 0.96], { u0 });
        for (const [a, b, h, t] of RUIN) {
          const A = [X(a[0]), Z(a[1])], Bp = [X(b[0]), Z(b[1])], dx = Bp[0] - A[0], dz = Bp[1] - A[1], L = Math.hypot(dx, dz), ry = Math.atan2(-dz, dx), n = Math.max(1, Math.ceil(L / 0.8));
          for (let i = 0; i < n; i++) { const f = (i + 0.5) / n, x = A[0] + dx * f, z = A[1] + dz * f, g = TH(M2px(x), M2py(z)), hh = h * (0.4 + 0.6 * Math.abs(Math.sin(i * 1.9 + h * 2.3))) + r() * 0.25; wallBox(x, z, L / n + 0.02, hh, t, ry, g, i * L / n); }
          K.addBlock(ribbon([a, b], t / 2 + 0.05));
        }
        // the arch: two piers and the wall above the opening, the round arch's ring of voussoirs proud of each face
        const zc = Z(ARCH.y), g = TH((ARCH.x0 + ARCH.x1) / 2, ARCH.y), oL = X(ARCH.open[0]), oR = X(ARCH.open[1]), x0 = X(ARCH.x0), x1 = X(ARCH.x1), ow = oR - oL, rr = ow / 2, ocx = (oL + oR) / 2, spring = g + ARCH.oh - rr;
        B.box('stone', (x0 + oL) / 2, g - 0.4, zc, oL - x0, ARCH.h + 0.4, ARCH.t, 0, [0.95, 0.95, 1]);
        B.box('stone', (oR + x1) / 2, g - 0.4, zc, x1 - oR, ARCH.h - 0.5 + 0.4, ARCH.t, 0, [0.95, 0.95, 1]);
        B.solid = false;
        const NA = 10;
        for (let i = 0; i < NA; i++) {
          const t0 = Math.PI * i / NA, t1 = Math.PI * (i + 1) / NA, p0 = [ocx - Math.cos(t0) * rr, spring + Math.sin(t0) * rr], p1 = [ocx - Math.cos(t1) * rr, spring + Math.sin(t1) * rr];
          // the wall above the curve, up to the top, between these two angles
          for (const [zz, nz] of [[zc + ARCH.t / 2, 1], [zc - ARCH.t / 2, -1]]) Q('stone', [p0[0], p0[1], zz], [p1[0], p1[1], zz], [p1[0], g + ARCH.h - (p1[0] > ocx + rr * 0.6 ? 0.5 : 0), zz], [p0[0], g + ARCH.h - (p0[0] > ocx + rr * 0.6 ? 0.5 : 0), zz], [0, 0, nz], [p0[0], p0[1], p1[0], g + ARCH.h], [0.95, 0.95, 1]);
          // the soffit
          Q('stone', [p0[0], p0[1], zc - ARCH.t / 2], [p1[0], p1[1], zc - ARCH.t / 2], [p1[0], p1[1], zc + ARCH.t / 2], [p0[0], p0[1], zc + ARCH.t / 2], [ocx - p0[0], spring - p0[1], 0], [0, 0, 1, ARCH.t], [0.7, 0.7, 0.76]);
          // the voussoirs, a hand proud of the south face
          const q0 = [ocx - Math.cos(t0) * (rr + 0.4), spring + Math.sin(t0) * (rr + 0.4)], q1 = [ocx - Math.cos(t1) * (rr + 0.4), spring + Math.sin(t1) * (rr + 0.4)], zf = zc + ARCH.t / 2 + 0.08;
          Q('stone', [p0[0], p0[1], zf], [p1[0], p1[1], zf], [q1[0], q1[1], zf], [q0[0], q0[1], zf], [0, 0, 1], [0, 0, 0.5, 0.4], i % 2 ? [0.82, 0.82, 0.88] : [1.0, 1.0, 1.05]);
        }
        // the top of the wall over the arch
        B.box('stone', ocx, g + ARCH.h - 0.02, zc, ow + 0.02, 0.02, ARCH.t, 0, [0.9, 0.9, 0.95], { noFront: true, noBack: true, noSides: true });
        B.solid = true;
        K.addBlock(W.rectPoly([ARCH.x0, ARCH.y - ARCH.t / 2 / SZ, ARCH.open[0] - 2, ARCH.y + ARCH.t / 2 / SZ]));
        K.addBlock(W.rectPoly([ARCH.open[1] + 2, ARCH.y - ARCH.t / 2 / SZ, ARCH.x1, ARCH.y + ARCH.t / 2 / SZ]));
        // the sun pillar and the outer pillar
        {
          const [px, py] = SUNPIL.at, y = TH(px, py);
          B.box('stone', X(px), y - 0.4, Z(py), SUNPIL.w, SUNPIL.h + 0.4, SUNPIL.d, 0, [1.0, 1.0, 1.04]);
          B.box('stone', X(px), y + SUNPIL.h, Z(py), SUNPIL.w + 0.2, 0.3, SUNPIL.d + 0.2, 0, [0.85, 0.85, 0.9]);
          sun([X(px), y + SUNPIL.h * 0.6, Z(py) + SUNPIL.d / 2 + 0.02], [0, 0, 1], 0.55, [1.25, 1.22, 1.16], 'stone');
          K.addBlock(W.rectPoly([px - SUNPIL.w / 2 / SX, py - SUNPIL.d / 2 / SZ, px + SUNPIL.w / 2 / SX, py + SUNPIL.d / 2 / SZ]));
          const [qx, qy] = OUTPIL.at, y2 = TH(qx, qy);
          for (let i = 0; i < 5; i++) B.box('stone', X(qx) + (r() - 0.5) * 0.15, y2 - 0.4 + i * 0.66, Z(qy), OUTPIL.w - i * 0.05, 0.66 + (i ? 0 : 0.4), OUTPIL.d - i * 0.04, (r() - 0.5) * 0.1, [0.92, 0.92, 0.98], { u0: i });
          K.addBlock(W.rectPoly([qx - OUTPIL.w / 2 / SX, qy - OUTPIL.d / 2 / SZ, qx + OUTPIL.w / 2 / SX, qy + OUTPIL.d / 2 / SZ]));
        }
        // fallen blocks
        for (const [bx, by, s] of BLOCKS) { const y = TH(bx, by); B.box('stone', X(bx), y - 0.15, Z(by), s, s * 0.75, s * 0.9, (bx * 0.3) % 1.5, [0.88, 0.88, 0.94]); if (s * 0.6 > 0.35) K.addBlock(K.circlePx(bx, by, s * 0.55, 8)); }
        K.shadeMarks.push(['rect', 384, 646, 512, 672, 0.6]);
      }

      // ---- the bare twisted trees, frosted ----
      function deadTree(px, py, s, seed, lean, big) {
        const r = rnd(seed * 7919 + 13), x = X(px), z = Z(py), y0 = TH(px, py) - 0.3, k = 0.82 + r() * 0.16, col = [k, k * 0.97, k * 1.04];
        let p = [x, y0, z], dir = norm([(lean ? lean[0] : 0) + (r() - 0.5) * 0.3, 1, (lean ? lean[1] : 0) + (r() - 0.5) * 0.3]);
        const H = (3.2 + r() * 1.4) * s, NT = big ? 4 : 3, pts = [];
        let rad = 0.3 * s;
        for (let i = 0; i < (big ? 5 : 3); i++) { const a = i / (big ? 5 : 3) * TAU + r(); seg(add(p, [Math.cos(a) * 0.85 * s, -0.35, Math.sin(a) * 0.85 * s]), add(p, [0, 0.9 * s, 0]), 0.08 * s, rad * 0.8, 4, col, 'wood'); }
        for (let i = 0; i < NT; i++) { const np = add(p, mul(dir, H / NT)), nr = rad * 0.76; seg(p, np, rad, nr, big ? 7 : 6, col, 'wood'); pts.push([np, nr, dir]); p = np; rad = nr; dir = norm(add(dir, [(r() - 0.5) * 0.55, 0.05, (r() - 0.5) * 0.55])); }
        const NL = (big ? 5 : 3) + Math.floor(r() * 2.5);
        for (let j = 0; j < NL; j++) {
          const from = j < 2 ? pts[pts.length - 1] : pts[Math.max(0, pts.length - 2 - Math.floor(r() * 2))];
          const a = j / NL * TAU + r() * 0.9, out = 0.7 + r() * 0.8;
          let d = norm([Math.cos(a) * out + from[2][0] * 0.3, 0.8 + r() * 0.4, Math.sin(a) * out + from[2][2] * 0.3]), q = from[0], lr = from[1] * (0.6 + r() * 0.15), L = (1.3 + r() * 0.8) * s * (big ? 1.15 : 1);
          for (let i = 0; i < (big ? 4 : 3); i++) {
            const nq = add(q, mul(d, L)), nlr = Math.max(0.018, lr * 0.62);
            seg(q, nq, lr, nlr, lr > 0.09 ? 5 : 3, col, 'wood');
            if (r() < 0.7) { const td = norm(add(d, [(r() - 0.5) * 1.8, (r() - 0.3) * 1.2, (r() - 0.5) * 1.8])); seg(nq, add(nq, mul(td, L * (0.45 + r() * 0.35))), nlr * 0.8, 0.008, 3, [1.2, 1.22, 1.32], 'wood'); }
            q = nq; lr = nlr; L *= 0.78; d = norm(add(d, [(r() - 0.5) * 1.0, (r() - 0.62) * 0.55, (r() - 0.5) * 1.0]));
          }
        }
        if (big) K.shadeMarks.push(['dot', px, py, 18 * s, 0.72]);
        K.addBlock(K.circlePx(px, py, 0.32 * s, 12));
      }
      for (const [px, py, s, seed, lx, lz] of BARE) deadTree(px, py, s, seed, [lx, lz], s >= 1.8);

      // ---- the fallen mossy logs and their pale mushrooms: the long one at the west edge, the two below the track ----
      {
        const r = rnd(37);
        for (const [a, b, R] of [[[6, 300], [222, 410], 0.5], [[1026, 728], [1214, 706], 0.55], [[1226, 700], [1350, 762], 0.48]]) {
          const A = at(a[0], a[1], R * 0.7), Bq = at(b[0], b[1], R * 0.7);
          logAB(A, Bq, R, [0.95, 0.95, 1.0], 9);
          for (let i = 0; i < 4; i++) { const t = 0.2 + r() * 0.6, c = add(add(A, mul(sub(Bq, A), t)), [0, R * 0.85, 0]); toad(M2px(c[0]), M2py(c[2]), 1.1 + r() * 0.5, R * 1.6); }
          K.addBlock(ribbon([a, b], R + 0.05));
          K.halo((A[0] + Bq[0]) / 2, (A[1] + Bq[1]) / 2 + 0.8, (A[2] + Bq[2]) / 2, 2.4, [0.1, 0.16, 0.3]);
        }
      }

      // ---- bracken (rust) and ferns along the paths' edges, and frosted grass tufts ----
      {
        const r = rnd(43);
        for (let i = 0; i < 560; i++) {
          const px = -60 + r() * 1660, py = -60 + r() * 1150, d = pathDist(px, py);
          if (d < 10 || d > 100 || nearRock(px, py, 0.3) || onRoot(px, py, 0.2) || nearPlace(px, py, -12) || r() > 0.33) continue;
          fern(px, py, 0.8 + r() * 0.6, r, r() < 0.55 ? 'bracken' : 'fern');
        }
        for (const t of ROAD.concat(TRAILS)) for (let i = 1; i < t.pts.length; i++) {
          const [ax, ay] = t.pts[i - 1], [bx, by] = t.pts[i], L = mDist(ax, ay, bx, by);
          for (let s = r() * 5; s < L; s += 5 + r() * 6) { const f = s / L, nx = -(by - ay) * SZ / L, nz = (bx - ax) * SX / L, off = (t.w + 0.5 + r() * 1.8) * (r() < 0.5 ? -1 : 1), px = ax + (bx - ax) * f + nx * off / SX, py = ay + (by - ay) * f + nz * off / SZ;
            if (pathDist(px, py) < 6 || nearGiant(px, py, -2)) continue;
            if (inPoly(MOOR, px, py)) tuft(px, py, 9, 0.8, [1.1, 1.12, 1.25], r); else fern(px, py, 0.8 + r() * 0.5, r, r() < 0.55 ? 'bracken' : 'fern'); }
        }
        for (const [x, y] of [[1400, 500], [1380, 470], [300, 470], [60, 380], [1500, 520], [760, 380]]) tuft(x, y, 10, 0.9, [1.1, 1.12, 1.25], r);
      }

      // ---- the boundary stone by the west track: a moon and a sun carved on it, back to back ----
      {
        const [px, py] = BOUND.at, y0 = standingStone(px, py, 1.1, 0.5, 1.9, 0, 4.4, [0.95, 0.96, 1.0]);
        sun([X(px), y0 + 1.35, Z(py) + 0.27], [0, 0, 1], 0.3, [1.3, 1.28, 1.2], 'monolith');
        moon([X(px), y0 + 1.35, Z(py) - 0.27], [0, 0, -1], 0.32, [1.3, 1.3, 1.4], 'monolith');
        K.addBlock(K.circlePx(px, py, 0.58, 10));
        const r = rnd(47); for (let i = 0; i < 4; i++) fern(px + (r() - 0.5) * 80, py - 10 - r() * 30, 0.9, r, 'bracken');
      }

      // ---- the ruined well (south): a round wall of the ruin's stone, broken on one side, dark inside, an old post ----
      {
        const [cx, cy] = WELL.c, y = TH(cx, cy), x = X(cx), z = Z(cy), N = 16;
        for (let i = 0; i < N; i++) { const a0 = i / N * TAU, a1 = (i + 1) / N * TAU, am = (a0 + a1) / 2, hh = i === 5 || i === 6 ? 0.35 : 0.85 + 0.15 * Math.sin(i * 2.1), xm = x + Math.cos(am) * WELL.r, zm = z + Math.sin(am) * WELL.r;
          B.box('stone', xm, y - 0.4, zm, WELL.r * TAU / N + 0.05, hh + 0.4, 0.45, -am + Math.PI / 2, [0.92, 0.92, 0.98], { u0: i * 0.6 }); }
        B.solid = false; disc([x, y + 0.2, z], [0, 1, 0], WELL.r - 0.2, 14, 'dark'); B.solid = true;
        seg([x + WELL.r + 0.4, y - 0.2, z - 0.4], [x + WELL.r + 0.35, y + 2.2, z - 0.4], 0.12, 0.1, 5, [0.85, 0.82, 0.86], 'wood');
        seg([x + WELL.r + 0.35, y + 2.1, z - 0.4], [x, y + 2.2, z - 0.1], 0.08, 0.07, 4, [0.85, 0.82, 0.86], 'wood');
        K.addBlock(K.circlePx(cx, cy, WELL.r + 0.25, 16));
        K.addBlock(K.circlePx(cx + (WELL.r + 0.4) / SX, cy - 8, 0.16, 6));
        const r = rnd(53); for (let i = 0; i < 6; i++) rock(cx + (r() - 0.5) * 140, cy + 20 + r() * 50, 0.18 + r() * 0.2, false, [0.85, 0.85, 0.92]);
      }

      // ---- the fallen giant (south-east): a huge elder trunk lying along the forest floor, its root plate torn up, its
      // broken top among the trees; pale mushrooms along it ----
      {
        const [ax, ay] = FALLEN.root, [bx, by] = FALLEN.top, r = rnd(59), R = 1.5, col = [0.88, 0.86, 0.92];
        const A = at(ax, ay, R * 0.75), Bq = at(bx, by, R * 0.5);
        seg(A, add(A, mul(sub(Bq, A), 0.5)), R, R * 0.85, 12, col, 'elder'); seg(add(A, mul(sub(Bq, A), 0.5)), Bq, R * 0.85, R * 0.6, 11, col, 'elder');
        disc(Bq, norm(sub(Bq, A)), R * 0.6, 11, 'endgrain');
        const dir = norm(sub(A, Bq)), side = norm(cross(dir, [0, 1, 0]));
        // the root plate, torn up on edge: a disc of earth and stones with short thick roots curling out of it
        B.geom('soil', K.ico[2], new THREE.Matrix4().compose(new THREE.Vector3(A[0] + dir[0] * 0.6, A[1] + 0.2, A[2] + dir[2] * 0.6), new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dir[0], 0, dir[2])), new THREE.Vector3(2.9, 0.7, 2.6)), [0.42, 0.4, 0.44], 1.5); B.solids.pop();
        for (let i = 0; i < 9; i++) { const t = i / 9 * TAU + r() * 0.3, rad = 2.0 + r() * 0.6, o = add(mul(side, Math.cos(t) * rad), [0, Math.sin(t) * rad * 0.85 + 0.3, 0]), m = add(add(A, o), mul(dir, 0.9)); seg(add(A, mul(o, 0.6)), m, 0.32, 0.18, 5, col, 'elder'); seg(m, add(m, add(mul(o, 0.25), mul(dir, 0.6 + r() * 0.6))), 0.18, 0.04, 4, col, 'elder'); }
        for (let i = 0; i < 10; i++) { const t = 0.15 + r() * 0.7, c = add(add(A, mul(sub(Bq, A), t)), [0, R * (0.95 - t * 0.35), 0]); toad(M2px(c[0]), M2py(c[2]), 1.4 + r() * 0.6, c[1] - TH(M2px(c[0]), M2py(c[2]))); }
        K.addBlock(ribbon([FALLEN.root, FALLEN.top], R * 0.95)); K.addBlock(K.circlePx(ax, ay, 3.0, 14));
        K.shadeMarks.push(['dot', (ax + bx) / 2, (ay + by) / 2, 260, 0.7]);
        K.halo((A[0] + Bq[0]) / 2, (A[1] + Bq[1]) / 2 + 1.5, (A[2] + Bq[2]) / 2, 4, [0.1, 0.15, 0.28]);
      }

      // ---- the cairn on the moor's edge: a heap of stones, tall, frosted ----
      {
        const [cx, cy] = CAIRN.c, r = rnd(67), x = X(cx), z = Z(cy), y = TH(cx, cy);
        let yy = y - 0.3;
        for (const [n, rr, s] of [[9, 1.25, 0.62], [7, 0.95, 0.55], [6, 0.65, 0.5], [4, 0.38, 0.42], [1, 0, 0.42]]) {
          for (let i = 0; i < n; i++) { const a = i / n * TAU + r(); B.geom('rock', K.rockG[i % 3], new THREE.Matrix4().compose(new THREE.Vector3(x + Math.cos(a) * rr, yy + s * 0.5, z + Math.sin(a) * rr), new THREE.Quaternion().setFromEuler(new THREE.Euler(r(), r() * TAU, r())), new THREE.Vector3(s, s, s)), [1.05, 1.05, 1.12], 1.0); B.solids.pop(); }
          yy += s * 0.75;
        }
        K.addBlock(K.circlePx(cx, cy, 1.7, 12));
      }

      // ---- pocket: the ring of frosted rocks past the boulder where the trail behind the stones gives out, its way in on
      // the west, behind that boulder; inside, pale mushrooms in the moonlight ----
      {
        const [cx, cy] = NOOK.c, r = rnd(71);
        for (let i = 0; i < 14; i++) { const a = NOOK.gap + 0.62 + (TAU - 1.24) * i / 13, d = NOOK.r + (r() - 0.5) * 0.2; rock(cx + Math.cos(a) * d / SX, cy + Math.sin(a) * d / SZ, 0.8 + r() * 0.3, false, [1.05, 1.05, 1.12]); }
        ringBlock(NOOK.c, NOOK.r - 0.65, NOOK.r + 0.75, NOOK.gap, 0.35);
        for (let i = 0; i < 8; i++) toad(cx + (r() - 0.5) * 70, cy + (r() - 0.5) * 50, 0.9 + r() * 0.6);
        fern(cx + 20, cy + 10, 0.9, r, 'bracken'); fern(cx - 15, cy - 15, 0.8, r, 'fern');
        K.halo(X(cx), TH(cx, cy) + 0.3, Z(cy), 3, [0.1, 0.16, 0.3]);
        // the screen in front of the way in: a mound of frosted shrub beside the boulder
        mound(cx - (NOOK.r + 2.4) / SX, cy + 26, 1.1, r, true, 'white');
      }

      // ---- pocket: the ruin's west room: inside, an old stone basin, frosted, with a little moonlight in it ----
      {
        const [cx, cy] = ROOM.c, y = TH(cx, cy), r = rnd(79);
        const bx = 290, by = 642;
        B.cyl('stone', X(bx), y - 0.2, Z(by), 0.34, 0.45, 0.85, 10, [0.95, 0.95, 1.0]);
        B.solid = false; disc([X(bx), y + 0.62, Z(by)], [0, 1, 0], 0.36, 10, 'glowcap', [0.16, 0.22, 0.36]); B.solid = true;
        K.addBlock(K.circlePx(bx, by, 0.45, 10));
        K.halo(X(bx), y + 0.8, Z(by), 1.4, [0.12, 0.2, 0.36]);
        for (let i = 0; i < 3; i++) fern(cx + 8 + (r() - 0.5) * 30, cy - 20 + (r() - 0.5) * 30, 0.6, r, 'bracken');
        // the fallen block that screens its way in (on the north, between the west wall and the broken north wall), and a red shrub
        B.box('stone', X(281), TH(281, 540) - 0.15, Z(540), 1.15, 0.8, 0.9, 0.4, [0.88, 0.88, 0.94]); K.addBlock(K.circlePx(281, 540, 0.6, 8));
        mound(236, 526, 0.75, r, true, 'fruit');
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

      // ---- the mist ----
      for (const [px, py, s] of MIST) K.halo(X(px), TH(px, py) + s * 0.1, Z(py), s, [0.11, 0.15, 0.27]);
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
