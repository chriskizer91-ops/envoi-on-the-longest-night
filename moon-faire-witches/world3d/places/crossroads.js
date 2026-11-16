// crossroads.js: the northern crossroads in 3D. Its painting (reference/art/walk/walk-northern-crossroads.png, 1536 x 1024)
// is the middle, laid out in the painting's own pixels as src/game/maps.js keeps the walking map: four old paved roads
// meeting in a ring of stone with a compass star set in it (the open ground of Halcyon's ambush), the well with its
// lantern on its post south-west of the ring, the fallen waymarker with its amber rune north-east of it, the broken
// gateposts on the north and south roads, the ruined walls and pillar stumps along the west and east roads, the frozen
// pond, the snowy north edge, boulders, snow-dusted rock outcrops and dark pines at the corners.
// Round it the moor goes on, one painting's width and height each way, under heavy fog (Chris, November 16: wild places
// are wide open fields with pockets to find): the four roads run on, paved, with waymarks beside them and old field walls
// along them, the north road to the shipyard, the west road to the cold moor, the south and east roads out to the world;
// a signpost stands where they meet. Pines and bare thorny trees thicken away from the roads. Places to find: a ruined
// watchtower on a rise in the north-east, the frozen tarn the painting's pond is the edge of (its ice is walkable), an old
// sheepfold in the south-west, a broken arch the south road runs under, a cairn on a hill in the south-east. Two pockets:
// a watcher's nook behind the north-east outcrop (a cold campfire), and a ring of thorn off the east road where an old
// waymark hides the Crossroads Pennant.
// Where Io can walk: the walking map's own walk areas, unchanged, plus all the open ground inside open.bounds, less
// everything solid (every trunk, rock, wall, post and the well; a thicket just inside the open ground's edge). Halcyon's
// fight (the event rect [575, 355, 965, 585]) has nothing solid in it.
// Heights are metres: the painting's roads and ring are 0; the moor rolls past the painting (about 2 m up and down), the
// north rises toward the shipyard, the tarn lies in a level hollow, the tower and the cairn stand on rises.
// The texture ids are the texture pack's (texture-packs/north/crossroads/inventory.md) and their nearest stand-ins.
(function (G) {
  'use strict';
  const P = G.W3D_PLACES = G.W3D_PLACES || {};
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ss = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const SX = 0.04, SZ = 0.05, TAU = Math.PI * 2;
  // the engine's own noise and seeded random, copied so this file also loads in the tools (no W3D there)
  const hash = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
  const vnoise = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf); return (hash(xi, yi) * (1 - u) + hash(xi + 1, yi) * u) * (1 - v) + (hash(xi, yi + 1) * (1 - u) + hash(xi + 1, yi + 1) * u) * v; };
  const rand = (seed) => { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1e6) / 1e6; }; };
  const inPoly = (poly, x, y) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
  const edgeDist = (poly, x, y) => { let d = 1e9; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [ax, ay] = poly[j], [bx, by] = poly[i], dx = bx - ax, dy = by - ay, t = clamp(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1), 0, 1); d = Math.min(d, Math.hypot(x - ax - t * dx, y - ay - t * dy)); } return d; };
  // (the ground goes on about 28 m past each way out, so where it ends is lost in the fog and the trees there)
  const EXT = [-2100, -1480, 3640, 2510];

  // ---- the roads past the painting: centre lines (px) and half widths (m) at each point. Each starts inside the
  // painting at its road's own width there and narrows to about 2 m; each ends at the open ground's edge, its way out ----
  const ROADS = [
    { id: 'north', pts: [[768, 30], [772, -160], [750, -360], [714, -540], [728, -720], [766, -916]], w: [2.45, 2.25, 2.15, 2.1, 2.1, 2.1] },
    { id: 'west', pts: [[30, 485], [-200, 489], [-430, 472], [-660, 500], [-900, 518], [-1150, 492], [-1394, 482]], w: [2.2, 2.1, 2.0, 2.0, 2.0, 2.0, 2.0] },
    { id: 'east', pts: [[1506, 488], [1760, 492], [1990, 470], [2262, 486], [2530, 512], [2780, 494], [2934, 490]], w: [2.45, 2.2, 2.05, 2.0, 2.0, 2.0, 2.0] },
    { id: 'south', pts: [[765, 994], [768, 1200], [775, 1400], [775, 1560], [750, 1760], [770, 1950]], w: [3.4, 2.7, 2.4, 2.4, 2.3, 2.3] },
  ];
  // past each way out the road runs on, bending away into the trees (seen, not walked: the way out is where it goes on)
  const BEYOND = [
    { pts: [[766, -916], [770, -1080], [850, -1260], [900, -1470]], w: 2.1 },
    { pts: [[-1394, 482], [-1600, 486], [-1800, 420], [-2090, 400]], w: 2.0 },
    { pts: [[2934, 490], [3140, 494], [3340, 560], [3630, 590]], w: 2.0 },
    { pts: [[770, 1950], [772, 2110], [700, 2300], [660, 2500]], w: 2.3 },
  ];
  // the trails of trodden earth from the roads to the places to find (half width, m)
  const TRAILS = [
    { id: 'tower', w: 0.85, pts: [[724, -600], [880, -650], [1080, -612], [1262, -540], [1392, -497]] },
    { id: 'tarn', w: 0.85, pts: [[-430, 476], [-425, 380], [-392, 300], [-336, 228]] },
    { id: 'fold', w: 0.85, pts: [[-662, 505], [-690, 650], [-702, 790], [-700, 846]] },
    { id: 'cairn', w: 0.85, pts: [[2262, 496], [2292, 700], [2222, 950], [2122, 1170], [2072, 1262]] },
  ];
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
  // a line `off` metres to one side of a centre line (+: the right hand going along it, seen from above with north up)
  const offsetLine = (pts, off) => pts.map((p, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let dx = (b[0] - a[0]) * SX, dz = (b[1] - a[1]) * SZ; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
    return [p[0] - dz * off / SX, p[1] + dx * off / SZ];
  });
  // how far (metres) a point is from a set of centre lines
  const segM = (x, y, a, b) => { const ax = a[0] * SX, az = a[1] * SZ, dx = b[0] * SX - ax, dz = b[1] * SZ - az, px = x * SX - ax, pz = y * SZ - az, t = clamp((px * dx + pz * dz) / (dx * dx + dz * dz || 1), 0, 1); return Math.hypot(px - t * dx, pz - t * dz); };
  const lineDist = (L, x, y) => { let d = 1e9; for (const t of L) for (let i = 1; i < t.pts.length; i++) d = Math.min(d, segM(x, y, t.pts[i - 1], t.pts[i])); return d; };
  // the painting's own four roads, as centre lines, so the woods keep off them too
  const PAINTED = [{ pts: [[768, 0], [768, 1024]] }, { pts: [[0, 485], [1536, 488]] }];
  const roadDist = (x, y) => Math.min(lineDist(ROADS, x, y), lineDist(PAINTED, x, y), lineDist(BEYOND, x, y));
  const trailDist = (x, y) => lineDist(TRAILS, x, y);

  // ---- the places to find, and the two pockets ----
  const RING = { c: [765, 473], r: 7.35 };                      // the stone ring where the roads meet (Halcyon's ambush)
  const FIGHT = [575, 355, 965, 585];                           // her fight's open ground: nothing solid in it
  const WELL = { c: [520, 612], r: 1.0 };                       // the crossroads well (the spot 'crosswell' is its lantern's side)
  const RUNE = { a: [952, 340], b: [1040, 296] };               // the fallen waymarker: its broken foot and its top
  const SIGN = [906, 648];                                      // the signpost, where the south and east roads part
  const TOWER = { c: [1480, -470], r: 3.3, t: 0.75 };           // the ruined watchtower on its rise (north-east)
  const FOLD = { c: [-700, 942], r: 5.0 };                      // the old sheepfold (south-west), its gate on the north
  const ARCH = { c: [775, 1480] };                              // the broken arch the south road runs under
  const CAIRN = { c: [2050, 1332] };                            // the cairn on its hill (south-east)
  const NOOK = { c: [1650, 205], r: 2.7 };                      // pocket: the watcher's nook behind the north-east outcrop
  const PENNANT = { c: [2640, 318], r: 2.4 };                   // pocket: the ring of thorn off the east road, the old waymark in it
  // the tarn: the painting's frozen pond is its east end (walkable ice)
  const TARN = [[232, 104], [222, 150], [170, 176], [96, 178], [10, 186], [-90, 200], [-200, 206], [-300, 184], [-372, 128], [-376, 64], [-320, 14],
    [-220, -10], [-120, 2], [-20, 30], [70, 48], [150, 52], [208, 70]];
  const TARN_LEVEL = -0.4;
  // where no tree grows past the painting: [x, y, radius m]
  const KEEP = [[TOWER.c[0], TOWER.c[1], 8], [FOLD.c[0], FOLD.c[1], 8], [CAIRN.c[0], CAIRN.c[1], 6.5], [ARCH.c[0], ARCH.c[1], 7], [NOOK.c[0], NOOK.c[1], 5.5],
    [PENNANT.c[0], PENNANT.c[1], 4.5], [1960, -60, 4], [-1000, 140, 4.5], [2400, 1700, 5], [-300, 1500, 4.5], [400, -620, 4.5], [2700, -500, 4.5], [1400, 1100, 4], [-1050, -500, 4.5]];

  // ---- the ground ----
  const roll = (x, y, t) => (vnoise(x / 420 + 7.3, y / 420 + 2.1) - 0.5) * 4.2 + t * (vnoise(x / 140, y / 140) - 0.5) * 1.2;
  const bump = (x, y, c, rx, ry, h) => h * (1 - ss(0.25, 1, Math.hypot((x - c[0]) / rx, (y - c[1]) / ry)));
  function ground(x, y) {
    let h = 2.4 * ss(0, -900, y) - 0.8 * ss(1024, 1950, y);                 // the north rises toward the shipyard; the south falls away
    const out = Math.hypot(Math.max(0, -x, x - 1536), Math.max(0, -y, y - 1024)), k = ss(0, 300, out);
    if (k > 0) h += k * roll(x, y, ss(3, 12, roadDist(x, y)));             // rolling moor past the painting, gentler by the roads
    h += bump(x, y, TOWER.c, 320, 260, 1.8) + bump(x, y, CAIRN.c, 300, 240, 2.6);
    // the tarn lies in a level hollow
    if (x > -460 && x < 320 && y > -90 && y < 290) { const d = inPoly(TARN, x, y) ? 0 : edgeDist(TARN, x, y); h += (TARN_LEVEL - h) * (1 - ss(0, 70, d)); }
    return h;
  }

  // ---- the snow: the north edge of the painting and everything north of it lies under thin snow; patches elsewhere ----
  const snowLine = (x) => {
    const C = [[-1600, 300], [-900, 250], [-300, 230], [0, 205], [250, 200], [450, 170], [700, 150], [850, 150], [1000, 175], [1200, 240], [1350, 300], [1536, 300], [2000, 270], [2600, 300], [3100, 260]];
    let y = C[C.length - 1][1]; for (let i = 1; i < C.length; i++) if (x <= C[i][0]) { const [xa, ya] = C[i - 1], [xb, yb] = C[i]; y = ya + (yb - ya) * (x - xa) / (xb - xa); break; }
    return y + (vnoise(x / 90, 3.3) - 0.5) * 70;
  };
  const SNOW = (() => { const p = [[EXT[0] - 20, EXT[1] - 20], [EXT[2] + 20, EXT[1] - 20]]; for (let x = EXT[2] + 20; x >= EXT[0] - 20; x -= 40) p.push([x, Math.round(snowLine(x))]); return p; })();
  const blob = (c, rx, ry, seed) => Array.from({ length: 12 }, (_, i) => { const a = i / 12 * TAU, k = 0.75 + 0.5 * hash(seed, i); return [Math.round(c[0] + Math.cos(a) * rx * k), Math.round(c[1] + Math.sin(a) * ry * k)]; });
  const SNOW_BLOBS = [[1420, 230, 170, 90], [40, 820, 110, 120], [60, 900, 120, 80], [240, 960, 160, 80], [1170, 900, 140, 80], [1450, 840, 120, 80], [1340, 760, 90, 60],
    [CAIRN.c[0], CAIRN.c[1], 160, 110], [-1100, 1300, 200, 140], [2500, 1500, 220, 150], [-500, 1700, 200, 120], [2700, 900, 160, 120], [1300, 1700, 200, 120], [-1200, 800, 160, 140]]
    .map(([x, y, rx, ry], i) => blob([x, y], rx, ry, i + 1));
  // where the snow begins it lies in patches: frosted grass showing through it in places, just north of its line
  const SNOW_HOLES = (() => { const r = rand(77), H = []; for (let x = EXT[0] + 60; x < EXT[2]; x += 150 + r() * 120) { const y = snowLine(x) - 40 - r() * 170, rx = 50 + r() * 70, ry = 30 + r() * 45; if (Math.abs(x - 768) < 140 && y > -980) continue; H.push(blob([Math.round(x), Math.round(y)], rx, ry, 300 + H.length)); } return H; })();

  // where Io may roam: an uneven edge inside the extent (the woods close it in), out to the four ways out
  const BOUNDS = [[-1394, 540], [-1420, 300], [-1440, 0], [-1380, -320], [-1220, -620], [-900, -860], [-420, -830], [100, -900], [560, -880], [702, -912],
    [832, -912], [1000, -880], [1500, -905], [2000, -840], [2500, -880], [2850, -620], [2950, -150], [2920, 300], [2934, 440], [2934, 540], [2890, 820],
    [2950, 1300], [2820, 1720], [2300, 1880], [1700, 1830], [1100, 1900], [840, 1948], [700, 1948], [300, 1880], [-300, 1900], [-900, 1800], [-1300, 1520],
    [-1360, 1000], [-1430, 720]];

  // ---- the trees past the painting: clumps of pines and bare thorny trees with clearings between, thickening away from
  // the roads (none on the painting itself: its trees come from the painting, tools/make-trees.mjs) ----
  const OUT_TREES = (() => {
    const r = rand(2026), T = [], STEP = 60;
    for (let gy = EXT[1] + 10; gy < EXT[3]; gy += STEP) for (let gx = EXT[0] + 10; gx < EXT[2]; gx += STEP) {
      const x = Math.round(gx + (r() - 0.5) * STEP * 0.9), y = Math.round(gy + (r() - 0.5) * STEP * 0.9), u = r(), k = r(), s = r(), seed = Math.floor(r() * 1000);
      if (x > -30 && x < 1566 && y > -30 && y < 1054) continue;
      const dr = roadDist(x, y), dt = trailDist(x, y);
      if (dr < 4.2 || dt < 2.4) continue;
      if (KEEP.some(([cx, cy, rr]) => Math.hypot((x - cx) * SX, (y - cy) * SZ) < rr)) continue;
      if (x > -460 && x < 320 && y > -90 && y < 290 && (inPoly(TARN, x, y) || edgeDist(TARN, x, y) < 50)) continue;
      const n = vnoise(x / 520 + 3.1, y / 520 + 1.7) * 0.7 + vnoise(x / 170 + 9.2, y / 170) * 0.3;
      // (well outside the open ground, beyond where anyone sees past the hedge, fewer)
      const outside = !inPoly(BOUNDS, x, y) && edgeDist(BOUNDS, x, y) > 260 ? 0.55 : 1;
      const dens = 0.95 * outside * (n < 0.36 ? 0 : Math.min(1, (n - 0.36) / 0.2)) * ss(3.5, 24, Math.min(dr, dt + 6));
      if (u > dens) continue;
      T.push([x, y, +(0.95 + s * 0.6).toFixed(2), k < (y < -150 ? 0.6 : 0.38) ? 1 : 2, seed]);
    }
    // past each way out, the woods close in round the road as it bends away
    for (const [i, b] of BEYOND.entries()) {
      const [ex, ey] = b.pts[0], [nx, ny] = b.pts[1], L = Math.hypot((nx - ex) * SX, (ny - ey) * SZ), fx = (nx - ex) * SX / L, fz = (ny - ey) * SZ / L;
      for (let k = 0; k < 70; k++) {
        const d = 6 + r() * 24, a = (r() - 0.5) * 2.4, ca = Math.cos(a), sa = Math.sin(a), mx = (fx * ca - fz * sa) * d, mz = (fx * sa + fz * ca) * d;
        const x = Math.round(ex + mx / SX), y = Math.round(ey + mz / SZ), s = r(), kd = r(), seed = Math.floor(r() * 1000) + i * 1000;
        if (x < EXT[0] + 10 || x > EXT[2] - 10 || y < EXT[1] + 10 || y > EXT[3] - 10 || lineDist([b], x, y) < b.w + 1.6) continue;
        if (T.some((t) => Math.hypot((t[0] - x) * SX, (t[1] - y) * SZ) < 2.2)) continue;
        T.push([x, y, +(1.0 + s * 0.55).toFixed(2), kd < 0.5 ? 1 : 2, seed]);
      }
    }
    // by hand: a pine screening the watcher's nook's way in, and two by the thorn ring's
    T.push([NOOK.c[0] - 40, NOOK.c[1] - 125, 1.2, 1, 501], [NOOK.c[0] + 70, NOOK.c[1] - 88, 1.1, 1, 502]);
    return T;
  })();

  P.crossroads = {
    id: 'crossroads', name: 'The northern crossroads', painting: "art/walk/walk-northern-crossroads.avif", size: [1536, 1024],
    mapId: 'crossroads', paintingPng: 'reference/art/walk/walk-northern-crossroads.png',
    // the open moor: one painting each way round the painting; where Io may roam inside it (the woods close it in)
    extent: EXT,
    open: { bounds: BOUNDS },
    // the wall check (tools/walls-test.mjs): from the compass star in the ring's middle to the start, each way out, the
    // well's lantern, the fallen waymarker, the signpost, every place to find and both pockets (the keepsake is walked to
    // as well)
    checks: { from: [765, 473], goals: [
      ['the start, on the south road', 768, 990], ['the well’s lantern', 590, 598], ['by the fallen waymarker’s rune', 1000, 350], ['the signpost', 935, 668],
      ['the way on to the shipyard (north)', 766, -905], ['the way on to the cold moor (west)', -1388, 482], ['the world, east', 2926, 490], ['the world, south', 770, 1942],
      ['inside the ruined watchtower (north-east)', 1490, -470], ['out on the frozen tarn (north-west)', -40, 120], ['inside the sheepfold (south-west)', -700, 960],
      ['under the broken arch (south)', 775, 1480], ['by the cairn (south-east)', 2080, 1280], ['in the watcher’s nook (pocket, north-east)', 1630, 189],
      ['in the ring of thorn (pocket, east)', 2640, 340]] },
    // the trees: on the painting from the painting itself (its dark pines, a few bare); past it, OUT_TREES above
    treeGen: { dark: 0.42, step: 58, fir: 1, firSouth: 1, thorn: 0.14, out: { density: 0 },
      keepOut: [[440, 520, 600, 660], [880, 250, 1080, 400], [560, 330, 980, 620], [860, 600, 960, 700], [-30, 40, 250, 190], [1500, 100, 1800, 300]] },
    // the ground: the old paving on the roads, frozen earth along their edges and on the trails, frosted moor grass
    // everywhere else, snow in the north and in patches (the deep snow: the patchy snow's stand-in is nearly as dark as
    // the frosted grass, so it doesn't read as snow; the patches of grass left showing make it patchy where it begins)
    ground: { cob: 'crossroads_road_paving', dirt: 'frozen_earth_path', grass: 'shared_grass_frosted', pave: 'shared_snow', rep: [3.2, 3.0, 2.6, 3.0], grassTint: [0.98, 0.94, 1.0] },
    surfaces: { stone: 'shared_stone_wall_frosted', dry: 'shared_drystone', timber: 'shared_stone_wall_frosted', planks: 'eldergrove_dead_bark', roof: 'shared_rock_cliff_snowy',
      wood: 'eldergrove_dead_bark', deck: 'crossroads_road_paving', pave: 'crossroads_road_paving', cloth: 'shared_grass_frosted', soil: 'frozen_earth_path', rock: 'shared_rock_cliff_snowy',
      leaves: 'crossroads_frost_moor', firs: 'fir_foliage_frosted', bark: 'thorn_bark_black' },
    extraMats: { ice: { tex: 'shared_ice', rep: 7, tint: 0xa4907e, shade: 0.6 }, snowcap: { tex: 'shared_snow', rep: 2.2, tint: 0xf4f6ff, shade: 0.5 } },
    tints: { leaves: 0xd8ccbc, firs: 0xa8b8c8, bush: 0xd4c8b8, wood: 0xc8b8b0 },
    // heavy cold fog: only so much is drawn at once; no far hills (the fog is the edge)
    night: { fog: [0.165, 0.172, 0.31], fogNear: 10, fogFar: 42, far: 90, hills: false, sky: [0.6, 0.6, 0.72], moon: [0.42, 0.45, 0.6] },
    textures: [
      { id: 'crossroads_road_paving', made: "./../texture-packs/made/crossroads_road_paving.png", stand: "./../texture-packs/north/crossroads/stand-in/crossroads_road_paving.png" },
      { id: 'shared_grass_frosted', made: "./../texture-packs/made/shared_grass_frosted.png", stand: "./../texture-packs/north/crossroads/stand-in/shared_grass_frosted.png" },
      { id: 'frozen_earth_path', made: "./../texture-packs/made/frozen_earth_path.png", stand: "./../texture-packs/wilds-north/cold-moor/stand-in/frozen_earth_path.png" },
      { id: 'shared_stone_wall_frosted', made: "./../texture-packs/made/shared_stone_wall_frosted.png", stand: "./../texture-packs/north/moonwell/stand-in/shared_stone_wall_frosted.png" },
      { id: 'shared_drystone', made: "./../texture-packs/made/shared_drystone.png", stand: "./../texture-packs/wickhollow/jetty/stand-in/shared_drystone.png" },
      { id: 'eldergrove_dead_bark', made: "./../texture-packs/made/eldergrove_dead_bark.png", stand: "./../texture-packs/wilds-south/eldergrove-edge/stand-in/eldergrove_dead_bark.png" },
      { id: 'thorn_bark_black', made: "./../texture-packs/made/thorn_bark_black.png", stand: "./../texture-packs/wickhollow/thornwood/stand-in/thorn_bark_black.png" },
      { id: 'crossroads_frost_moor', made: "./../texture-packs/made/crossroads_frost_moor.png", stand: "./../texture-packs/arenas/crossroads/stand-in/crossroads_frost_moor.png" },
      { id: 'shared_rock_cliff_snowy', made: "./../texture-packs/made/shared_rock_cliff_snowy.png", stand: "./../texture-packs/north/frozen-pass/stand-in/shared_rock_cliff_snowy.png" },
      { id: 'fir_foliage_frosted', made: "./../texture-packs/made/fir_foliage_frosted.png", stand: "./../texture-packs/wilds-north/northern-camp/stand-in/fir_foliage_frosted.png" },
      { id: 'shared_ice', made: "./../texture-packs/made/shared_ice.png", stand: "./../texture-packs/north/frozen-pass/stand-in/shared_ice.png" },
      { id: 'shared_snow', made: "./../texture-packs/made/shared_snow.png", stand: "./../texture-packs/north/frozen-pass/stand-in/shared_snow.png" },
    ],
    ground_h: ground,
    walk_h: ground,
    water: [],
    lawns: [],
    thicket: true,
    start: [768, 990], startFace: Math.PI, startYaw: 0,
    // the ways on, where the roads reach the open ground's edge
    exits: [
      { rect: [706, -926, 826, -902], label: 'The shipyard' },
      { rect: [-1406, 432, -1384, 532], label: 'The cold moor' },
      { rect: [2922, 440, 2944, 540], label: 'The world' },
      { rect: [700, 1938, 840, 1960], label: 'The world' },
    ],
    // the roads (paving down the middle, frozen earth along the edges), the trails, and the tarn's ice
    walkAdd: ROADS.map((t) => ({ poly: ribbon(t.pts, t.w.map((w) => w + 0.7)), ground: 'dirt' })).concat(ROADS.map((t) => ({ poly: ribbon(t.pts, t.w), ground: 'cob' })))
      .concat(TRAILS.map((t) => ({ poly: ribbon(t.pts, t.w), ground: 'dirt' }))).concat([{ poly: TARN, ground: 'grass' }]),
    // the snow, then the north road and the tower's trail laid again over it (patches are laid in order)
    groundPatches: [{ poly: SNOW, kind: 'pave' }].concat(SNOW_BLOBS.map((p) => ({ poly: p, kind: 'pave' }))).concat(SNOW_HOLES.map((p) => ({ poly: p, kind: 'grass' })))
      .concat(BEYOND.map((b) => ({ poly: ribbon(b.pts, b.w + 0.7), kind: 'dirt' }))).concat(BEYOND.map((b) => ({ poly: ribbon(b.pts, b.w), kind: 'cob' })))
      .concat([{ poly: ribbon(ROADS[0].pts, ROADS[0].w.map((w) => w + 0.7)), kind: 'dirt' }, { poly: ribbon(TRAILS[0].pts, TRAILS[0].w), kind: 'dirt' }, { poly: ribbon(TRAILS[1].pts, TRAILS[1].w), kind: 'dirt' },
        { poly: ribbon(ROADS[0].pts, ROADS[0].w), kind: 'cob' }, { poly: [[706, -4], [830, -4], [828, 130], [826, 252], [834, 262], [838, 292], [842, 330], [690, 334], [694, 292], [700, 262], [712, 250], [712, 130]], kind: 'cob' }]),
    // the keepsake, in its pocket: the Crossroads Pennant, tied to the old waymark in the ring of thorn off the east road
    items: { 'crossroads-pennant': [2640, 340] },
    buildings: [],
    walls: [],
    steps: [],
    lamps: [],
    props: [],
    flowers: [],
    // moonlight lying in the open places (the well's lantern and the rune add their own in extra())
    lights: [
      [765, 473, 260, 0.32, 'moon'], [-60, 100, 260, 0.5, 'moon'], [TOWER.c[0], TOWER.c[1], 160, 0.4, 'moon'], [FOLD.c[0], FOLD.c[1], 170, 0.35, 'moon'],
      [ARCH.c[0], ARCH.c[1], 150, 0.35, 'moon'], [CAIRN.c[0], CAIRN.c[1], 150, 0.4, 'moon'], [PENNANT.c[0], PENNANT.c[1], 90, 0.4, 'moon'], [400, 180, 160, 0.3, 'moon'],
      [1150, 160, 160, 0.3, 'moon'],
    ],
    trees: 'crossroads',
    extraTrees: OUT_TREES,

    // ---- what the engine has no field for: the ring's compass star, the gateposts and their walls, the ruined walls
    // and pillar stumps, the well and its lantern, the fallen waymarker and its rune, the signpost, the rocks and the
    // outcrops, the bare shrubs and dead trees, the grass, the tarn's ice, the waymarks and field walls along the roads,
    // the places to find, the two pockets and the mist ----
    extra(K) {
      const { B, X, Z } = K, W = G.W3D, TH = K.terrain;
      const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
      const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
      const norm = (a) => { const L = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / L, a[1] / L, a[2] / L]; };
      const px = (x) => K.M.px(x), py = (z) => K.M.py(z);
      const Q = (k, a, b, c, d, want, uv, col) => { const n = cross(sub(b, a), sub(d, a)); if (dot(n, want) < 0) B.quad(k, b, a, d, c, uv, col); else B.quad(k, a, b, c, d, uv, col); };
      const inFight = (x, y, m) => x > FIGHT[0] - m && x < FIGHT[2] + m && y > FIGHT[1] - m && y < FIGHT[3] + m;
      const M4 = (x, y, z, ry, sx, sy, sz) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(sx, sy, sz));
      // a cheap lumpy ball (20 faces), for snow caps and bushes far from the paths
      const lump = (() => { const g = new THREE.IcosahedronGeometry(1, 0), p = g.attributes.position, r = W.rand(919), seen = {}; for (let i = 0; i < p.count; i++) { const key = p.getX(i).toFixed(3) + ',' + p.getY(i).toFixed(3) + ',' + p.getZ(i).toFixed(3), k = seen[key] || (seen[key] = 0.82 + r() * 0.3); p.setXYZ(i, p.getX(i) * k, p.getY(i) * k, p.getZ(i) * k); } g.computeVertexNormals(); return g; })();
      // a rock: solid (its own outline) when it stands in Io's way
      const rock = (x0, y0, sz, solid, col, sy) => {
        const g = K.rockG[Math.floor(hash(x0 * 0.13, y0 * 0.17) * 3) % 3];
        if (!solid) B.solid = false;
        B.geom('rock', g, M4(X(x0), TH(x0, y0) - sz * 0.22, Z(y0), (x0 * 0.37 + y0 * 0.11) % TAU, sz, sz * (sy || 1), sz * 0.92), col || null, 1.2);
        B.solid = true;
        if (solid) K.addBlock(K.circlePx(x0, y0, sz * 0.78, 8));
      };
      // a ring of something solid (a C, open at `gap` in metres' angle, the way in `gw` either side), round c, r0 to r1 m
      const ringBlock = (c, r0, r1, gap, gw) => {
        const rm = (r0 + r1) / 2, hw = (r1 - r0) / 2, ga = gw + hw / rm, pts = [], n = 28, at = (a, r) => [c[0] + Math.cos(a) * r / SX, c[1] + Math.sin(a) * r / SZ];
        for (let i = 0; i <= n; i++) pts.push(at(gap + ga + (TAU - 2 * ga) * i / n, r1));
        for (let i = n; i >= 0; i--) pts.push(at(gap + ga + (TAU - 2 * ga) * i / n, r0));
        K.addBlock(pts);
        for (const e of [gap + ga, gap - ga]) { const q = at(e, rm); K.addBlock(K.circlePx(q[0], q[1], hw, 12)); }
      };
      // a tapered branch from A to Bp (an open tube of n sides), its bark's uv in metres
      function seg(A, Bp, ra, rb, n, col, k) {
        const d = sub(Bp, A), L = Math.hypot(d[0], d[1], d[2]), dir = mul(d, 1 / L);
        const u = norm(cross(Math.abs(dir[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0], dir)), v = cross(dir, u);
        const ring = (c, r, t) => add(c, add(mul(u, Math.cos(t) * r), mul(v, Math.sin(t) * r)));
        for (let i = 0; i < n; i++) { const t0 = i / n * TAU, t1 = (i + 1) / n * TAU; B.quad(k || 'wood', ring(A, ra, t0), ring(A, ra, t1), ring(Bp, rb, t1), ring(Bp, rb, t0), [t0 * ra, 0, t1 * ra, L], col); }
      }
      // a standing stone, rough and a little tapered (the painting's tall rock, the old waymark)
      function standingStone(sx, sy, w, d, h, ry, seed, col) {
        const base = TH(sx, sy) - 0.3, g = new THREE.BoxGeometry(1, 1, 1, 3, 7, 2), p = g.attributes.position;
        const hh = (a, b, c) => { const s = Math.sin(a * 127.1 + b * 311.7 + c * 74.7 + seed) * 43758.5453; return s - Math.floor(s); };
        for (let i = 0; i < p.count; i++) {
          const x = p.getX(i), y = p.getY(i), z = p.getZ(i), t = y + 0.5, wk = 1 - 0.28 * t; let yy = t;
          if (t > 0.78) yy -= (x * x) * 0.6 * ss(0.78, 1, t);
          const n = (hh(x, y, z) - 0.5) * 0.07;
          p.setXYZ(i, x * wk * w + n, yy * h + n, z * d * (1 - 0.2 * t) + n * 0.5);
        }
        g.computeVertexNormals();
        B.geom('rock', g, M4(X(sx), base, Z(sy), ry, 1, 1, 1), col || [1.0, 1.0, 1.06], [w, h]);
        g.dispose();
        K.addBlock(K.circlePx(sx, sy, Math.max(w, d) * 0.55, 8));
        return base;
      }

      // ---- the ring: its courses of stone (dark joints round it) and the compass star in its middle ----
      {
        const cx = X(RING.c[0]), cz = Z(RING.c[1]), y = 0.012, N = 72;
        const band = (r, w, col) => { for (let i = 0; i < N; i++) { const a0 = i / N * TAU, a1 = (i + 1) / N * TAU, p = (a, rr) => [cx + Math.cos(a) * rr, y, cz + Math.sin(a) * rr]; Q('pave', p(a0, r - w / 2), p(a1, r - w / 2), p(a1, r + w / 2), p(a0, r + w / 2), [0, 1, 0], [a0 * r, 0, a1 * r, w], col); } };
        band(2.0, 0.12, [0.42, 0.42, 0.5]); band(3.55, 0.09, [0.5, 0.5, 0.58]); band(5.05, 0.09, [0.5, 0.5, 0.58]); band(6.45, 0.09, [0.5, 0.5, 0.58]);
        band(7.2, 0.35, [1.08, 1.08, 1.14]); band(7.4, 0.06, [0.45, 0.45, 0.52]);
        // the star: eight points, the four long ones north, south, east and west; each half light, half dark
        for (let k = 0; k < 8; k++) {
          const a = k * Math.PI / 4 - Math.PI / 2, R = k % 2 ? 1.0 : 1.75, hb = Math.PI / 8, rb = 0.38, yy = y + 0.004;
          const tip = [cx + Math.cos(a) * R, yy, cz + Math.sin(a) * R], c0 = [cx, yy, cz];
          const l = [cx + Math.cos(a - hb) * rb, yy, cz + Math.sin(a - hb) * rb], r_ = [cx + Math.cos(a + hb) * rb, yy, cz + Math.sin(a + hb) * rb];
          B.tri('pave', c0, tip, l, [[0, 0], [R, 0], [0, rb]], [1.32, 1.32, 1.42]); B.tri('pave', c0, r_, tip, [[0, 0], [0, rb], [R, 0]], [0.5, 0.5, 0.6]);
        }
        for (let i = 0; i < 16; i++) { const a0 = i / 16 * TAU, a1 = (i + 1) / 16 * TAU; B.tri('pave', [cx, y + 0.006, cz], [cx + Math.cos(a1) * 0.2, y + 0.006, cz + Math.sin(a1) * 0.2], [cx + Math.cos(a0) * 0.2, y + 0.006, cz + Math.sin(a0) * 0.2], [[0, 0], [0.2, 0], [0, 0.2]], [0.6, 0.6, 0.7]); }
      }

      // ---- the gateposts on the north and south roads, each with a stub of broken wall on its outer side ----
      const post = (x0, y0, h, col) => {
        const x = X(x0), z = Z(y0), g = TH(x0, y0);
        B.box('stone', x, g - 0.3, z, 0.78, h + 0.3, 0.78, 0, col || [0.95, 0.95, 1.0]);
        B.box('stone', x, g + h, z, 0.94, 0.16, 0.94, 0, [0.82, 0.82, 0.9]);
        B.box('stone', x, g + h + 0.16, z, 0.62, 0.22, 0.62, 0, [0.88, 0.88, 0.95]);
        B.box('snowcap', x, g + h + 0.38, z, 0.52, 0.06, 0.52, 0, null);
        K.shadeMarks.push(['dot', x0, y0, 16, 0.7]);
      };
      // a run of cut-stone wall from a to b, broken: each block's height from the profile, some fallen out (gaps)
      const wallRun = (a, b, hmax, seed, opt) => {
        opt = opt || {};
        const r = W.rand(seed), A = [X(a[0]), Z(a[1])], Bp = [X(b[0]), Z(b[1])], dx = Bp[0] - A[0], dz = Bp[1] - A[1], L = Math.hypot(dx, dz), ry = Math.atan2(-dz, dx);
        const n = Math.max(1, Math.round(L / (opt.block || 0.85))), mat = opt.mat || 'stone', t = opt.t || 0.55;
        for (let i = 0; i < n; i++) {
          if (opt.gaps && r() < opt.gaps && i > 0 && i < n - 1) continue;
          const f = (i + 0.5) / n, x = A[0] + dx * f, z = A[1] + dz * f, g = TH(px(x), py(z));
          const hh = hmax * (opt.flat ? 0.8 + 0.2 * r() : 0.35 + 0.65 * Math.abs(Math.sin(i * 1.3 + seed))) + r() * 0.12;
          B.box(mat, x, g - 0.4, z, L / n + 0.03, hh + 0.4, t, ry, [0.9 + r() * 0.12, 0.9 + r() * 0.1, 0.96 + r() * 0.08], { u0: i * L / n });
          if (opt.cap && r() < 0.5) B.box('snowcap', x, g + hh, z, L / n * 0.8, 0.05, t * 0.8, ry, null);
        }
        // rubble fallen off it
        B.solid = false;
        for (let i = 0; i < (opt.rubble == null ? Math.round(L / 1.5) : opt.rubble); i++) { const f = r(), s = (r() < 0.5 ? -1 : 1) * (t / 2 + 0.2 + r() * 0.5); const x = A[0] + dx * f - dz / L * s, z = A[1] + dz * f + dx / L * s; if (opt.keepOff && opt.keepOff(px(x), py(z))) continue; const sz = 0.18 + r() * 0.16; B.box(mat, x, TH(px(x), py(z)) - 0.05, z, sz * 1.4, sz, sz, r() * 3, [0.85, 0.85, 0.92]); }
        B.solid = true;
      };
      {
        post(696, 238, 3.0); post(840, 240, 3.15, [0.92, 0.92, 0.98]); post(689, 711, 2.9, [0.9, 0.9, 0.96]); post(846, 711, 3.05);
        wallRun([684, 240], [652, 238], 1.35, 3, { rubble: 2 }); wallRun([852, 242], [892, 244], 1.25, 5, { rubble: 2 });
        wallRun([677, 712], [652, 714], 1.2, 7, { rubble: 2 }); wallRun([858, 712], [898, 714], 1.1, 9, { rubble: 2 });
      }

      // ---- the ruined walls and pillar stumps along the west and east roads (the painting's) ----
      {
        const off = (x, y) => inFight(x, y, 4) || (x > 0 && x < 1536 && y > 430 && y < 540);
        wallRun([318, 424], [458, 422], 1.15, 11, { keepOff: off }); post(474, 418, 1.55, [0.9, 0.9, 0.96]); wallRun([490, 420], [540, 418], 0.75, 12, { rubble: 1, keepOff: off });
        wallRun([318, 516], [452, 514], 0.95, 13, { keepOff: off }); post(472, 504, 1.25);
        wallRun([988, 428], [1062, 432], 1.0, 15, { keepOff: off }); post(1080, 428, 1.6, [0.92, 0.92, 0.98]); wallRun([1098, 434], [1146, 433], 0.7, 16, { rubble: 1, keepOff: off });
        wallRun([1006, 540], [1066, 538], 0.9, 17, { keepOff: off }); post(1084, 507, 1.35); wallRun([1102, 545], [1238, 546], 1.05, 18, { keepOff: off });
        // the painting's other stumps: north-west of the ring, by the waymarker, south-west of the well
        post(610, 312, 1.05, [0.88, 0.88, 0.94]); post(925, 334, 0.8, [0.86, 0.86, 0.92]); post(394, 690, 1.0, [0.86, 0.86, 0.92]);
      }

      // ---- the well: a round stone well, its wooden frame and windlass, the bucket, and the lantern hung off the frame's
      // east end; a letter weighted under a stone on its rim ----
      {
        const [wx, wy] = WELL.c, x = X(wx), z = Z(wy), g = TH(wx, wy), R = WELL.r, H = 0.85;
        B.cyl('stone', x, g - 0.3, z, R, R * 0.97, H + 0.3, 16, [0.96, 0.95, 1.0], [TAU * R, H]);
        const inner = new THREE.CylinderGeometry(R - 0.24, R - 0.24, H, 16, 1, true); inner.scale(-1, 1, 1);
        B.solid = false; B.geom('stone', inner, M4(x, g + H / 2, z, 0, 1, 1, 1), [0.5, 0.5, 0.56], [TAU * R, H]); inner.dispose();
        const rim = new THREE.RingGeometry(R - 0.26, R + 0.05, 20, 1); rim.rotateX(-Math.PI / 2); B.geom('stone', rim, M4(x, g + H + 0.01, z, 0, 1, 1, 1), [0.86, 0.86, 0.92], 2); rim.dispose();
        const dark = new THREE.CircleGeometry(R - 0.24, 16); dark.rotateX(-Math.PI / 2); B.geom('soil', dark, M4(x, g + H - 0.45, z, 0, 1, 1, 1), [0.12, 0.12, 0.16], 1); dark.dispose();
        B.solid = true;
        const col = [0.82, 0.72, 0.62], pw = X(wx - 30), pe = X(wx + 28);
        B.box('wood', pw, g - 0.3, z + 0.05, 0.17, 2.6, 0.17, 0.1, col); B.box('wood', pe, g - 0.3, z - 0.05, 0.17, 2.6, 0.17, -0.06, col);
        B.solid = false;
        B.box('wood', (pw + pe) / 2 + 0.25, g + 2.24, z, pe - pw + 0.9, 0.14, 0.16, 0, col);
        B.cyl('wood', (pw + pe) / 2, g + 1.3, z, 0.08, 0.08, 0.01, 6, col);
        { const wl = new THREE.CylinderGeometry(0.1, 0.1, pe - pw - 0.2, 8, 1); wl.rotateZ(Math.PI / 2); B.geom('wood', wl, M4((pw + pe) / 2, g + 1.3, z, 0, 1, 1, 1), col, 1); wl.dispose(); }
        B.box('wood', (pw + pe) / 2 - 0.2, g + 0.9, z, 0.02, 0.4, 0.02, 0, [0.7, 0.62, 0.5]);
        B.cyl('wood', (pw + pe) / 2 - 0.2, g + 0.6, z, 0.16, 0.19, 0.3, 8, [0.75, 0.6, 0.48]);
        // the lantern on its hook at the beam's east end, and its warm light
        const lx = pe + 0.55; B.box('iron', lx, g + 1.86, z, 0.03, 0.38, 0.03, 0);
        K.lantern(lx, g + 1.62, z, null, 0.85, false);
        K.light(wx + 40, wy - 4, 130, 1.05, 'warm'); K.light(wx + 70, wy - 24, 90, 0.4, 'warm');
        // the letter, and the stone on it
        B.quad('cloth', [x + 0.55, g + H + 0.02, z - 0.65], [x + 0.78, g + H + 0.02, z - 0.55], [x + 0.72, g + H + 0.02, z - 0.4], [x + 0.49, g + H + 0.02, z - 0.5], [0, 0, 1, 1], [3.2, 3.1, 2.8]);
        B.geom('rock', K.rockG[0], M4(x + 0.64, g + H + 0.04, z - 0.52, 0.4, 0.12, 0.1, 0.11), [0.9, 0.9, 0.95], 0.3);
        B.solid = true;
        K.addBlock(K.circlePx(wx, wy, R + 0.08, 14));
        K.addBlock(K.circlePx(wx - 30, wy, 0.16, 6)); K.addBlock(K.circlePx(wx + 28, wy, 0.16, 6));
        K.shadeMarks.push(['dot', wx, wy, 34, 0.7]);
      }

      // ---- the fallen waymarker: a carved pillar lying toppled, its top to the north-east, an amber rune glowing on it;
      // its broken foot and rubble round it (kept out of the fight's ground) ----
      {
        const A = [X(RUNE.a[0]), Z(RUNE.a[1])], Bp = [X(RUNE.b[0]), Z(RUNE.b[1])], dx = Bp[0] - A[0], dz = Bp[1] - A[1], L = Math.hypot(dx, dz), ry = Math.atan2(-dz, dx);
        const mx = (A[0] + Bp[0]) / 2, mz = (A[1] + Bp[1]) / 2, g = TH(px(mx), py(mz)) - 0.12;
        B.box('stone', mx, g, mz, L - 0.5, 0.72, 0.72, ry, [0.92, 0.92, 0.98]);
        B.box('stone', Bp[0] - dx / L * 0.25, g - 0.05, Bp[1] - dz / L * 0.25, 0.5, 0.9, 0.92, ry, [0.84, 0.84, 0.9]);
        B.box('stone', A[0] + dx / L * 0.32, g - 0.05, A[1] + dz / L * 0.32, 0.45, 0.82, 0.86, ry, [0.84, 0.84, 0.9]);
        // its carved band and the rune: a diamond of amber light on the top face, near its head
        const t = [dx / L, 0, dz / L], nrm = [-dz / L, 0, dx / L], rc = [Bp[0] - t[0] * 0.95, g + 0.725, Bp[1] - t[2] * 0.95];
        const dm = (a, b) => add(add(rc, mul(t, a)), mul(nrm, b));
        Q('glass', dm(-0.34, 0), dm(0, -0.22), dm(0.34, 0), dm(0, 0.22), [0, 1, 0], [0, 0, 1, 1], [2.1, 1.15, 0.42]);
        Q('glass', add(dm(-0.16, 0), [0, 0.004, 0]), add(dm(0, -0.1), [0, 0.004, 0]), add(dm(0.16, 0), [0, 0.004, 0]), add(dm(0, 0.1), [0, 0.004, 0]), [0, 1, 0], [0, 0, 1, 1], [2.6, 1.9, 1.0]);
        for (const s of [-1, 1]) { const a = add(add(rc, mul(t, -0.55)), mul(nrm, s * 0.3)), b = add(add(rc, mul(t, 0.55)), mul(nrm, s * 0.3)); Q('soil', add(a, mul(nrm, -0.03)), add(b, mul(nrm, -0.03)), add(b, mul(nrm, 0.03)), add(a, mul(nrm, 0.03)), [0, 1, 0], [0, 0, 1, 0.06], [0.3, 0.3, 0.36]); }
        K.halo(rc[0], rc[1] + 0.15, rc[2], 1.6, [1.0, 0.6, 0.22]);
        K.light(px(rc[0]), py(rc[2]) + 8, 95, 0.75, 'warm'); K.lamps3d.push({ x: rc[0], y: rc[1] + 0.3, z: rc[2], c: 0xffa050, k: 0.7 });
        K.addBlock([[px(A[0] - nrm[0] * 0.42), py(A[1] - nrm[2] * 0.42)], [px(Bp[0] - nrm[0] * 0.5), py(Bp[1] - nrm[2] * 0.5)], [px(Bp[0] + nrm[0] * 0.5), py(Bp[1] + nrm[2] * 0.5)], [px(A[0] + nrm[0] * 0.42), py(A[1] + nrm[2] * 0.42)]]);
        // rubble round its foot (small, nothing solid)
        const r = W.rand(404); B.solid = false;
        for (let i = 0; i < 16; i++) { const qx = 930 + r() * 90, qy = 336 + r() * 50, sz = 0.14 + r() * 0.22; B.box('stone', X(qx), TH(qx, qy) - 0.06, Z(qy), sz * 1.5, sz, sz * 1.2, r() * 3, [0.85, 0.85, 0.92]); }
        B.solid = true;
      }

      // ---- the signpost where the south and east roads part: four arms, to the shipyard, the cold moor and the world ----
      {
        const [sx, sy] = SIGN, x = X(sx), z = Z(sy), g = TH(sx, sy), col = [0.85, 0.74, 0.64];
        B.box('wood', x, g - 0.3, z, 0.17, 2.75, 0.17, 0, col);
        B.box('wood', x, g + 2.45, z, 0.24, 0.08, 0.24, 0, [0.7, 0.6, 0.52]);
        B.solid = false;
        const arm = (h, dirx, dirz, tilt) => {
          const L = 0.95, c = [x + dirx * (0.1 + L / 2), g + h, z + dirz * (0.1 + L / 2)], ry = Math.atan2(-dirz, dirx) + tilt;
          B.box('wood', c[0], c[1] - 0.11, c[2], L, 0.22, 0.045, ry, [0.9, 0.78, 0.66]);
          const tip = [x + dirx * (0.12 + L + 0.18), g + h, z + dirz * (0.12 + L + 0.18)], e0 = [x + dirx * (0.1 + L), g + h + 0.11, z + dirz * (0.1 + L)], e1 = [x + dirx * (0.1 + L), g + h - 0.11, z + dirz * (0.1 + L)];
          B.tri('wood', e0, e1, tip, [[0, 0], [0.22, 0], [0.11, 0.18]], [0.9, 0.78, 0.66]); B.tri('wood', e1, e0, tip, [[0, 0], [0.22, 0], [0.11, 0.18]], [0.9, 0.78, 0.66]);
        };
        arm(2.18, 0, -1, 0.06); arm(1.92, 1, 0, -0.08); arm(1.66, -1, 0, 0.1); arm(1.4, 0, 1, -0.05);
        B.solid = true;
        K.addBlock(K.circlePx(sx, sy, 0.16, 6));
        rock(sx - 12, sy + 10, 0.32, false); rock(sx + 10, sy + 8, 0.26, false);
      }

      // ---- the painting's boulders, its tall standing rock, and the snow-dusted outcrops at its corners ----
      const outcrop = (cx, cy, rad, n, hmax, seed, opt) => {
        opt = opt || {};
        const r = W.rand(seed);
        for (let i = 0; i < n; i++) {
          const a = i === 0 ? 0 : r() * TAU, d = i === 0 ? 0 : (0.35 + 0.65 * Math.sqrt(r())) * rad * 0.8, qx = cx + Math.cos(a) * d / SX, qy = cy + Math.sin(a) * d / SZ;
          if (opt.keepOff && opt.keepOff(qx, qy)) continue;
          const w = (0.75 + r() * 0.7) * (i === 0 ? 1.3 : 1), h = hmax * (i === 0 ? 1 : 0.4 + r() * 0.6), x = X(qx), z = Z(qy), g = TH(qx, qy), ry = r() * TAU;
          B.geom('rock', K.rockG[Math.floor(r() * 3)], M4(x, g + h * 0.42 - 0.35, z, ry, w, h * 0.74, w * 0.88), [0.92 + r() * 0.12, 0.92 + r() * 0.1, 1.0], 1.4);
          if (opt.snow !== false && r() < 0.8) { B.solid = false; B.geom('snowcap', lump, M4(x + (r() - 0.5) * 0.2, g + h * 0.8 - 0.32, z, ry, w * 0.62, 0.26 + r() * 0.1, w * 0.52), null, 1.2); B.solid = true; }
          K.addBlock(K.circlePx(qx, qy, w * 0.8, 9));
          K.shadeMarks.push(['dot', qx, qy, w / SX * 1.1, 0.72]);
        }
      };
      {
        const ROCKS = [[180, 35, 1.1], [215, 30, 0.9], [450, 312, 0.95], [505, 186, 0.75], [180, 268, 0.85], [55, 280, 0.6], [160, 338, 0.8], [350, 40, 0.75],
          [950, 86, 0.8], [1110, 210, 0.8], [1215, 324, 0.85], [1310, 316, 1.0], [1362, 342, 0.85], [1462, 372, 1.45], [1200, 52, 1.1], [1252, 92, 1.0],
          [320, 626, 0.8], [590, 748, 0.85], [612, 760, 0.55], [400, 822, 1.0], [480, 816, 1.15], [930, 618, 0.7], [1135, 756, 1.0], [890, 832, 0.75],
          [942, 896, 0.85], [1180, 610, 1.35], [1222, 652, 1.15], [1150, 640, 0.8], [660, 760, 0.5], [880, 760, 0.55], [256, 700, 0.6], [1030, 640, 0.45]];
        for (const [x0, y0, s] of ROCKS) rock(x0, y0, s, true);
        standingStone(355, 262, 0.95, 0.75, 2.7, 0.25, 7, [0.92, 0.94, 1.02]);
        // the corners' outcrops (in the painting), then more out on the moor, most in the snowy north
        const OUT = [[295, 100, 3.2, 5, 3.0], [1430, 185, 5.5, 9, 4.2], [1235, 72, 2.6, 3, 2.4], [42, 778, 3.2, 5, 3.6], [52, 905, 3.2, 4, 3.0], [245, 965, 4.4, 6, 3.4],
          [432, 922, 2.4, 3, 2.4], [1338, 752, 3.2, 5, 3.4], [1462, 836, 3.6, 6, 3.4], [1168, 902, 3.6, 5, 3.0], [1405, 965, 4.4, 6, 3.4],
          [-520, -380, 4, 6, 3.6], [180, -560, 3.4, 5, 3.0], [1180, -260, 3.6, 5, 3.4], [2200, -420, 4.2, 6, 3.8], [2650, 100, 3.4, 5, 3.2], [-1050, 160, 3.6, 5, 3.4],
          [-900, -620, 3.6, 5, 3.6], [1900, 760, 3.0, 4, 2.6], [-300, 1240, 3.4, 5, 3.0], [1250, 1550, 3.6, 5, 3.0], [2600, 1250, 3.4, 5, 3.0], [-1150, 1250, 3.4, 4, 3.0],
          [380, 1650, 3.0, 4, 2.6], [2350, 1720, 3.0, 4, 2.6], [-1200, -300, 3.2, 4, 3.2], [1800, -760, 3.2, 4, 3.2]];
        for (const [i, o] of OUT.entries()) outcrop(o[0], o[1], o[2], o[3], o[4], 100 + i, { keepOff: (x, y) => roadDist(x, y) < 3.6 || trailDist(x, y) < 1.8 });
      }

      // ---- bare black shrubs and the painting's dead trees ----
      const shrub = (x0, y0, s, seed) => {
        const r = W.rand(seed), x = X(x0), z = Z(y0), g = TH(x0, y0) - 0.05, col = [0.62, 0.55, 0.55];
        for (let i = 0; i < 7; i++) {
          const a = i / 7 * TAU + r(), up = 0.6 + r() * 0.6, L = (0.55 + r() * 0.45) * s, d = norm([Math.cos(a) * 0.55, up, Math.sin(a) * 0.55]);
          const tip = add([x, g, z], mul(d, L)); seg([x, g, z], tip, 0.035 * s, 0.01, 3, col, 'bark');
          const d2 = norm(add(d, [(r() - 0.5) * 1.2, 0.3, (r() - 0.5) * 1.2])); seg(add([x, g, z], mul(d, L * 0.6)), add(add([x, g, z], mul(d, L * 0.6)), mul(d2, L * 0.5)), 0.02 * s, 0.006, 3, col, 'bark');
        }
      };
      function deadTree(x0, y0, s, seed, lean) {
        const r = W.rand(seed * 7919 + 13), x = X(x0), z = Z(y0), y = TH(x0, y0) - 0.3, k = 0.78 + r() * 0.2, col = [k, k * 0.95, k * 1.03];
        let p = [x, y, z], dir = norm([(lean ? lean[0] : 0) + (r() - 0.5) * 0.3, 1, (lean ? lean[1] : 0) + (r() - 0.5) * 0.3]);
        const H = (3.0 + r() * 1.2) * s, pts = []; let rad = 0.28 * s;
        for (let i = 0; i < 3; i++) { const a = i / 3 * TAU + r(); seg(add(p, [Math.cos(a) * 0.8 * s, -0.35, Math.sin(a) * 0.8 * s]), add(p, [0, 0.8 * s, 0]), 0.07 * s, rad * 0.8, 4, col); }
        for (let i = 0; i < 3; i++) { const np = add(p, mul(dir, H / 3)), nr = rad * 0.74; seg(p, np, rad, nr, 6, col); pts.push([np, nr, dir]); p = np; rad = nr; dir = norm(add(dir, [(r() - 0.5) * 0.55, 0.05, (r() - 0.5) * 0.55])); }
        const NL = 4 + Math.floor(r() * 2);
        for (let j = 0; j < NL; j++) {
          const from = j < 2 ? pts[2] : pts[1], a = j / NL * TAU + r() * 0.9;
          let d = norm([Math.cos(a) * 0.9 + from[2][0] * 0.3, 0.75 + r() * 0.4, Math.sin(a) * 0.9 + from[2][2] * 0.3]), q = from[0], lr = from[1] * 0.62, L = (1.3 + r() * 0.7) * s;
          for (let i = 0; i < 3; i++) {
            const nq = add(q, mul(d, L)), nlr = Math.max(0.018, lr * 0.6); seg(q, nq, lr, nlr, lr > 0.08 ? 5 : 3, col);
            if (r() < 0.7) { const td = norm(add(d, [(r() - 0.5) * 1.8, (r() - 0.3) * 1.2, (r() - 0.5) * 1.8])); seg(nq, add(nq, mul(td, L * 0.5)), nlr * 0.8, 0.008, 3, col); }
            q = nq; lr = nlr; L *= 0.76; d = norm(add(d, [(r() - 0.5) * 1.0, (r() - 0.62) * 0.55, (r() - 0.5) * 1.0]));
          }
        }
        K.shadeMarks.push(['dot', x0, y0, 16 * s, 0.75]);
        K.addBlock(K.circlePx(x0, y0, 0.3 * s, 10));
      }
      {
        const SHRUBS = [[30, 22, 1.0], [470, 50, 1.1], [552, 86, 0.9], [520, 292, 0.9], [590, 410, 0.7], [985, 64, 1.0], [930, 18, 1.1], [1122, 318, 1.0], [1222, 392, 0.9],
          [1132, 622, 1.2], [1242, 598, 1.1], [574, 900, 1.1], [1300, 640, 0.8], [600, 1010, 0.9], [860, 600, 0.6], [290, 360, 0.8]];
        for (const [i, [x0, y0, s]] of SHRUBS.entries()) shrub(x0, y0, s, 50 + i);
        deadTree(1252, 868, 1.45, 1, [0.05, -0.1]); deadTree(76, 150, 1.0, 2, [0.1, 0]); deadTree(232, 232, 0.85, 3, [0, 0]);
        // past the painting, by the places to find
        deadTree(TOWER.c[0] + 170, TOWER.c[1] + 90, 1.4, 4, [-0.2, 0]); deadTree(FOLD.c[0] + 170, FOLD.c[1] - 30, 1.3, 5, [-0.25, 0.1]); deadTree(2190, 1100, 1.25, 6, [0, 0.15]);
        deadTree(PENNANT.c[0] - 80, PENNANT.c[1] - 70, 1.15, 7, [0.3, 0.1]); deadTree(-250, 330, 1.2, 8, [0, -0.1]);
      }

      // ---- tufts of dry golden grass, frost on their tips ----
      {
        const r = W.rand(606), tuft = (x0, y0, s) => {
          const x = X(x0), z = Z(y0), y = TH(x0, y0);
          for (let i = 0; i < 7; i++) { const a = r() * TAU, lean = 0.12 + r() * 0.3, h = (0.45 + r() * 0.4) * s, w = 0.045, bx = x + (r() - 0.5) * 0.4, bz = z + (r() - 0.5) * 0.35, ox = Math.cos(a), oz = Math.sin(a);
            B.tri('cloth', [bx - oz * w, y, bz + ox * w], [bx + oz * w, y, bz - ox * w], [bx + ox * lean, y + h, bz + oz * lean], [[0, 0], [0.1, 0], [0.05, 1]], [1.35, 1.2, 0.9]); }
        };
        for (let i = 0; i < 340; i++) {
          const x0 = -300 + r() * 2140, y0 = -250 + r() * 1500, s = 0.8 + r() * 0.5;
          if ((x0 > -10 && x0 < 1546 && y0 > -10 && y0 < 1034 && W.inPoly(SNOW, x0, y0)) || inFight(x0, y0, 10) || roadDist(x0, y0) < 2.8 || Math.hypot(x0 - WELL.c[0], y0 - WELL.c[1]) < 40) continue;
          if (x0 > -460 && x0 < 320 && y0 > -90 && y0 < 290 && W.inPoly(TARN, x0, y0)) continue;
          tuft(x0, y0, s);
        }
      }

      // ---- the tarn: its ice (Io walks on it), dry reeds along its shore, a fallen pine lying out across it ----
      {
        // the ice: the tarn's outline a little wider (its edge runs under the banks), laid flat
        const cx0 = TARN.reduce((s, p) => s + p[0], 0) / TARN.length, cy0 = TARN.reduce((s, p) => s + p[1], 0) / TARN.length;
        const shape = new THREE.Shape(TARN.map(([x0, y0]) => { const dx = x0 - cx0, dy = y0 - cy0, l = Math.hypot(dx * SX, dy * SZ) || 1; return new THREE.Vector2(X(x0 + dx * SX / l * 0.5 / SX), -Z(y0 + dy * SZ / l * 0.5 / SZ)); }));
        const ig = new THREE.ShapeGeometry(shape); ig.rotateX(-Math.PI / 2);
        B.solid = false; B.geom('ice', ig, M4(0, TARN_LEVEL + 0.025, 0, 0, 1, 1, 1), [0.95, 0.98, 1.04], 1); B.solid = true; ig.dispose();
        const r = W.rand(707);
        for (let i = 0; i < TARN.length; i += 1) {
          if (r() < 0.35) continue;
          const [x0, y0] = TARN[i], ox = X(x0), oz = Z(y0), g = TH(x0, y0);
          for (let k = 0; k < 9; k++) { const bx = ox + (r() - 0.5) * 1.2, bz = oz + (r() - 0.5) * 1.0, h = 0.7 + r() * 0.7, lean = (r() - 0.5) * 0.4; B.tri('cloth', [bx - 0.03, g, bz], [bx + 0.03, g, bz], [bx + lean, g + h, bz + lean * 0.5], [[0, 0], [0.1, 0], [0.05, 1]], [1.15, 1.0, 0.8]); }
        }
        // the fallen pine: its trunk lying out over the ice from the north shore, its stubs of branches
        const A = [X(-262), TARN_LEVEL + 0.32, Z(18)], Bt = [X(-96), TARN_LEVEL + 0.18, Z(132)], col = [0.7, 0.62, 0.6];
        seg(A, Bt, 0.32, 0.14, 7, col, 'bark');
        for (let i = 0; i < 9; i++) { const f2 = 0.15 + i * 0.09, p0 = add(A, mul(sub(Bt, A), f2)), d = norm([(r() - 0.5), 0.6 + r() * 0.6, (r() - 0.5)]); seg(p0, add(p0, mul(d, 0.5 + r() * 0.7)), 0.06, 0.015, 3, col, 'bark'); }
        const ln = [[-262, 18], [-96, 132]]; K.addBlock(ribbon(ln, 0.36));
        rock(-300, 40, 0.7, true); rock(214, 160, 0.55, true); rock(-350, 150, 0.6, true); rock(60, 190, 0.45, false);
      }

      // ---- waymarks: small carved stones beside the roads past the painting, every so often, either side ----
      const waymark = (x0, y0, ry, h) => {
        const x = X(x0), z = Z(y0), g = TH(x0, y0);
        B.box('stone', x, g - 0.3, z, 0.42, h + 0.3, 0.32, ry, [0.95, 0.95, 1.0]);
        B.box('stone', x, g + h, z, 0.3, 0.14, 0.24, ry, [0.88, 0.88, 0.95]);
        K.addBlock(K.circlePx(x0, y0, 0.26, 6));
      };
      {
        let side = 1;
        for (const rd of ROADS) {
          const L = offsetLine(rd.pts, 0);
          for (let i = 1; i < L.length; i++) {
            const [ax, ay] = L[i - 1], [bx, by] = L[i], seglen = Math.hypot((bx - ax) * SX, (by - ay) * SZ);
            for (let s = 9; s < seglen; s += 17) {
              const f = s / seglen, cx = ax + (bx - ax) * f, cy = ay + (by - ay) * f; if (cx > -40 && cx < 1576 && cy > -40 && cy < 1064) continue;
              const w = rd.w[i] + 1.15, nx = -(by - ay) * SZ / seglen, nz = (bx - ax) * SX / seglen, qx = cx + nx * w * side / SX, qy = cy + nz * w * side / SZ;
              if (trailDist(qx, qy) < 2 || Math.hypot(qx - ARCH.c[0], qy - ARCH.c[1]) < 140) continue;
              waymark(qx, qy, Math.atan2(-(by - ay) * SZ, (bx - ax) * SX), 0.95 + hash(qx, qy) * 0.3); side = -side;
            }
          }
        }
        // the one far down the east road by the thorn ring
        waymark(2600, 448, 0.05, 1.15);
      }

      // ---- old field walls of dry stone along stretches of the roads past the painting, broken, with gaps ----
      {
        // (offsetLine's + side is the right hand going along the road: north of the west road, south of the east road,
        // east of the north road)
        const along = (rd, i0, i1, off) => offsetLine(rd.pts, off).slice(i0, i1 + 1), lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
        const run = (pts, h, seed) => { for (let i = 1; i < pts.length; i++) wallRun(pts[i - 1], pts[i], h, seed + i, { mat: 'dry', t: 0.6, gaps: 0.18, flat: true, rubble: 2, cap: true }); };
        const W_ = ROADS[1], E_ = ROADS[2], N_ = ROADS[0], nW = offsetLine(W_.pts, 4.0);
        // the west road's north side, a gap where the tarn's trail leaves it; its south side further on
        run([nW[1], lerp(nW[1], nW[2], 0.84)], 0.85, 300);
        run([lerp(nW[2], nW[3], 0.16), nW[3]], 0.8, 310);
        run(along(W_, 4, 5, -4.0), 0.75, 320);
        // the east road's south side, and its north side far down (between it and the thorn ring)
        run(along(E_, 1, 2, 4.0), 0.85, 330);
        run(along(E_, 4, 5, -4.0), 0.7, 340);
        // the north road's west side
        run(along(N_, 1, 2, -4.0), 0.8, 350);
      }

      // ---- the ruined watchtower on its rise: a round stump of wall, broken to different heights, its doorway to the
      // west where the trail comes up; rubble inside and a fallen block outside ----
      {
        const [cx, cy] = TOWER.c, R = TOWER.r, T = TOWER.t, N = 22, x = X(cx), z = Z(cy), door = Math.atan2(Z(-497) - z, X(1392) - x), dw = 0.42, r = W.rand(91);
        for (let i = 0; i < N; i++) {
          const a = i / N * TAU, da = Math.atan2(Math.sin(a - door), Math.cos(a - door));
          if (Math.abs(da) < dw) continue;
          const rm = R - T / 2, wx = x + Math.cos(a) * rm, wz = z + Math.sin(a) * rm, gy = TH(px(wx), py(wz)) - 0.4;
          let h = 1.4 + 3.2 * (0.5 + 0.5 * Math.sin(i * 0.9 + 0.7)) * (0.7 + 0.3 * r());
          if (Math.abs(da) < dw + 0.35) h = Math.max(h, 3.2);   // the doorway's jambs stand
          if (Math.cos(a) > 0.75) h *= 0.35;                    // fallen on the east
          const segw = TAU * R / N + 0.05;
          B.box('stone', wx, gy, wz, segw, h + 0.4, T, -a + Math.PI / 2, [0.9 + r() * 0.1, 0.9 + r() * 0.08, 0.97], { u0: i * segw });
          if (h > 2) for (let k = 0; k < 2; k++) if (r() < 0.5) B.box('snowcap', wx, gy + h + 0.4, wz, segw * 0.7, 0.06, T * 0.8, -a + Math.PI / 2, null);
        }
        // a lintel stone over the door, fallen; rubble round
        B.solid = false;
        for (let i = 0; i < 24; i++) { const a = r() * TAU, d = (r() < 0.5 ? r() * (R - T - 0.4) : R + 0.4 + r() * 1.6), qx = x + Math.cos(a) * d, qz = z + Math.sin(a) * d, sz = 0.2 + r() * 0.3; if (Math.abs(Math.atan2(Math.sin(a - door), Math.cos(a - door))) < 0.5 && d > R - 1) continue; B.box('stone', qx, TH(px(qx), py(qz)) - 0.08, qz, sz * 1.5, sz, sz * 1.1, r() * 3, [0.85, 0.85, 0.92]); }
        B.solid = true;
        B.box('stone', x + R + 1.6, TH(px(x + R + 1.6), py(z + 0.5)) - 0.2, z + 0.5, 1.6, 0.7, 0.8, 0.6, [0.88, 0.88, 0.94]);
        ringBlock(TOWER.c, R - T - 0.05, R + 0.05, door, 0.25);
        K.addBlock(K.circlePx(px(x + R + 1.6), py(z + 0.5), 0.75, 8));
        K.shadeMarks.push(['ring', cx, cy, (R - T) / SX, (R + 0.3) / SX, 0.7]);
      }

      // ---- the old sheepfold: a round pen of dry stone, its gate on the north, a stone trough inside ----
      {
        const [cx, cy] = FOLD.c, R = FOLD.r, N = 30, x = X(cx), z = Z(cy), gate = -Math.PI / 2, gw = 0.2, r = W.rand(81);
        for (let i = 0; i < N; i++) {
          const a = i / N * TAU; if (Math.abs(Math.atan2(Math.sin(a - gate), Math.cos(a - gate))) < gw) continue;
          const wx = x + Math.cos(a) * R, wz = z + Math.sin(a) * R, h = 1.0 + r() * 0.25 - (i % 7 === 3 ? 0.5 : 0), segw = TAU * R / N + 0.04;
          B.box('dry', wx, TH(px(wx), py(wz)) - 0.3, wz, segw, h + 0.3, 0.62, -a + Math.PI / 2, [0.92, 0.9, 0.96]);
          if (r() < 0.45) B.box('snowcap', wx, TH(px(wx), py(wz)) + h, wz, segw * 0.8, 0.05, 0.5, -a + Math.PI / 2, null);
        }
        for (const s of [-1, 1]) { const a = gate + s * (gw + 0.06), wx = x + Math.cos(a) * R, wz = z + Math.sin(a) * R; B.box('stone', wx, TH(px(wx), py(wz)) - 0.3, wz, 0.5, 1.65, 0.5, 0, [0.95, 0.95, 1.0]); }
        ringBlock(FOLD.c, R - 0.36, R + 0.36, gate, gw * 0.62);
        // the trough and a broken hurdle leaning on the wall
        const tx = x + 1.6, tz = z + 2.2, tg = TH(px(tx), py(tz));
        B.box('stone', tx, tg - 0.2, tz, 1.7, 0.7, 0.6, 0.2, [0.88, 0.88, 0.94]); B.solid = false; B.box('ice', tx, tg + 0.45, tz, 1.4, 0.03, 0.38, 0.2, [0.95, 1, 1.05]); B.solid = true;
        K.addBlock(K.circlePx(px(tx), py(tz), 0.9, 8));
        B.solid = false; for (let k = 0; k < 4; k++) B.box('wood', x - 2.6 + k * 0.08, TH(px(x - 2.6), py(z - 2.4)), z - 2.4 + k * 0.35, 0.06, 1.0, 0.06, 0.3, [0.75, 0.62, 0.5]); B.box('wood', x - 2.5, TH(px(x - 2.5), py(z - 2)) + 0.7, z - 1.9, 0.06, 0.06, 1.3, 0.3, [0.75, 0.62, 0.5]); B.solid = true;
        rock(cx - 40, cy + 30, 0.45, false); rock(cx + 10, cy - 20, 0.35, false);
        K.shadeMarks.push(['ring', cx, cy, (R - 0.5) / SX, (R + 0.5) / SX, 0.72]);
      }

      // ---- the broken arch over the south road: two pillars, half an arch still standing on the west, its fallen
      // stones by the east pillar, and a stretch of broken wall either side ----
      {
        const [cx, cy] = ARCH.c, xw = X(cx - 76), xe = X(cx + 76), z = Z(cy), H = 3.4, r = W.rand(71);
        for (const [xx, hh] of [[xw, H], [xe, H - 0.6]]) { const g = TH(px(xx), cy); B.box('stone', xx, g - 0.3, z, 1.0, hh + 0.3, 1.0, 0, [0.95, 0.95, 1.0]); B.box('stone', xx, g + hh, z, 1.16, 0.18, 1.16, 0, [0.82, 0.82, 0.9]); K.addBlock(K.circlePx(px(xx), cy, 0.62, 10)); }
        const g0 = TH(cx, cy), span = (xe - xw) / 2, mid = (xw + xe) / 2, NV = 11;
        for (let k = 0; k < NV; k++) {
          if (k > 6) continue;                                    // the east half has fallen
          const t0 = Math.PI - Math.PI * k / NV, t1 = Math.PI - Math.PI * (k + 1) / NV, tm = (t0 + t1) / 2;
          const ax = mid + Math.cos(tm) * span, ay = g0 + H + 0.18 + Math.sin(tm) * span * 0.75, L = span * Math.PI / NV * 1.02;
          const vg = new THREE.BoxGeometry(L, 0.55, 0.9); vg.rotateZ(tm - Math.PI / 2); B.geom('stone', vg, M4(ax, ay, z, 0, 1, 1, 1), k % 2 ? [0.86, 0.86, 0.92] : [0.96, 0.96, 1.0], 1); vg.dispose();
        }
        B.solid = false; for (let i = 0; i < 6; i++) { const qx = xe + 0.9 + r() * 1.8, qz = z + (r() - 0.5) * 2.4; B.box('stone', qx, TH(px(qx), py(qz)) - 0.1, qz, 0.8, 0.5, 0.6, r() * 3, [0.88, 0.88, 0.94]); } B.solid = true;
        K.addBlock(K.circlePx(px(xe + 1.8), cy, 1.0, 8));
        wallRun([cx - 92, cy + 2], [cx - 230, cy + 6], 2.2, 61, { rubble: 3 }); wallRun([cx + 92, cy - 2], [cx + 200, cy - 6], 1.5, 62, { rubble: 3 });
      }

      // ---- the cairn on its hill: a cone of piled stones, a weathered pole standing out of its top ----
      {
        const [cx, cy] = CAIRN.c, x = X(cx), z = Z(cy), g = TH(cx, cy), r = W.rand(51);
        const layers = [[10, 1.35, 0.56, 0], [8, 0.95, 0.48, 0.5], [6, 0.58, 0.4, 0.95], [3, 0.25, 0.34, 1.35], [1, 0, 0.3, 1.7]];
        for (const [n, rr, s, hy] of layers) for (let i = 0; i < n; i++) { const a = i / n * TAU + r() * 0.4, qx = x + Math.cos(a) * rr, qz = z + Math.sin(a) * rr; B.geom('rock', K.rockG[i % 3], M4(qx, g + hy, qz, r() * TAU, s, s * 0.85, s), [0.92 + r() * 0.1, 0.92, 1.0], 0.8); }
        B.solid = false; B.box('wood', x, g + 1.6, z, 0.1, 1.9, 0.1, 0.3, [0.75, 0.66, 0.58]); B.box('wood', x, g + 3.0, z, 0.55, 0.06, 0.06, 0.3, [0.75, 0.66, 0.58]); B.solid = true;
        K.addBlock(K.circlePx(cx, cy, 1.75, 12));
        for (let i = 0; i < 7; i++) { const a = r() * TAU, d = 2.4 + r() * 2; rock(cx + Math.cos(a) * d / SX, cy + Math.sin(a) * d / SZ, 0.2 + r() * 0.2, false); }
      }

      // ---- pocket: the watcher's nook behind the north-east outcrop: a hollow ringed by rocks, its way in on the north
      // behind a pine; a cold campfire ring, charred logs, a log to sit on ----
      {
        const [cx, cy] = NOOK.c, R = NOOK.r, gap = -Math.PI / 2 - 0.25, r = W.rand(121);
        for (let i = 0; i < 15; i++) {
          const a = gap + 0.62 + (TAU - 1.24) * i / 14, d = R + 0.55 + (r() - 0.5) * 0.3, s = 0.85 + r() * 0.45;
          const qx = cx + Math.cos(a) * d / SX, qy = cy + Math.sin(a) * d / SZ, g = TH(qx, qy);
          B.geom('rock', K.rockG[i % 3], M4(X(qx), g + s * 0.5 - 0.3, Z(qy), r() * TAU, s, s * 1.15, s * 0.9), [0.92, 0.94, 1.0], 1.3);
          if (r() < 0.7) { B.solid = false; B.geom('snowcap', lump, M4(X(qx), g + s * 1.15 - 0.32, Z(qy), r() * TAU, s * 0.55, 0.22, s * 0.48), null, 1.2); B.solid = true; }
        }
        ringBlock(NOOK.c, R - 0.05, R + 1.35, gap, 0.36);
        const x = X(cx), z = Z(cy + 6), g = TH(cx, cy + 6);
        B.solid = false;
        for (let i = 0; i < 9; i++) { const a = i / 9 * TAU, qx = x + Math.cos(a) * 0.5, qz = z + Math.sin(a) * 0.5; B.geom('rock', K.rockG[i % 3], M4(qx, g - 0.02, qz, a, 0.16, 0.12, 0.14), [0.8, 0.8, 0.86], 0.4); }
        for (let i = 0; i < 3; i++) { const a = i / 3 * TAU + 0.4; seg([x + Math.cos(a) * 0.4, g + 0.06, z + Math.sin(a) * 0.4], [x - Math.cos(a) * 0.15, g + 0.18, z - Math.sin(a) * 0.15], 0.06, 0.05, 5, [0.25, 0.22, 0.22], 'bark'); }
        const sq = new THREE.CircleGeometry(0.35, 10); sq.rotateX(-Math.PI / 2); B.geom('soil', sq, M4(x, g + 0.015, z, 0, 1, 1, 1), [0.25, 0.24, 0.26], 1); sq.dispose();
        seg([x - 1.0, g + 0.2, z + 1.1], [x + 0.9, g + 0.22, z + 1.25], 0.2, 0.18, 7, [0.72, 0.62, 0.58], 'bark');
        B.solid = true;
        K.addBlock(K.circlePx(cx, cy + 6, 0.45, 8));
        K.addBlock(ribbon([[cx - 25, cy + 6 + 22], [cx + 22, cy + 6 + 25]], 0.24));
        // a thorny bush on the way in, beside the pine
        const m = (qx, qy, s) => { B.geom('leafBush', K.ico[Math.floor(r() * 3)], M4(X(qx), TH(qx, qy) + s * 0.2, Z(qy), r() * TAU, s, s * 0.6, s), [0.8, 0.72, 0.66], 2.0); K.addBlock(K.circlePx(qx, qy, s * 0.7, 8)); };
        m(cx + 40, cy - 112, 1.1);
      }

      // ---- pocket: the ring of thorn off the east road, its way in on the north-east round the back, an old waymark in
      // it, where the Crossroads Pennant is tied ----
      {
        const [cx, cy] = PENNANT.c, R = PENNANT.r, gap = -Math.PI / 4, r = W.rand(131);
        const m = (qx, qy, s, solid) => {
          const x = X(qx), z = Z(qy), g = TH(qx, qy), h = s * (0.55 + r() * 0.2);
          B.geom('leafBush', K.ico[Math.floor(r() * 3)], M4(x, g + h * 0.3, z, r() * TAU, s, h, s), [0.5, 0.44, 0.44], 2.0);
          for (let i = 0; i < 7; i++) { const a = r() * TAU, d = r() * s * 0.6; seg([x + Math.cos(a) * d, g + h * 0.3, z + Math.sin(a) * d], [x + Math.cos(a) * (d + 0.6), g + h * 1.1 + r() * 0.35, z + Math.sin(a) * (d + 0.6)], 0.035, 0.006, 3, [0.55, 0.48, 0.5], 'bark'); }
          for (let i = 0; i < 3; i++) { const a = r() * TAU, d = r() * s * 0.6, cx_ = x + Math.cos(a) * d, cz_ = z + Math.sin(a) * d, cy_ = g + h * (0.7 + r() * 0.4), sz = 0.3 + r() * 0.15, t = r() * Math.PI;
            B.quad('fl_fruit', [cx_ - Math.cos(t) * sz, cy_ - sz * 0.6, cz_ - Math.sin(t) * sz], [cx_ + Math.cos(t) * sz, cy_ - sz * 0.6, cz_ + Math.sin(t) * sz], [cx_ + Math.cos(t) * sz, cy_ + sz, cz_ + Math.sin(t) * sz], [cx_ - Math.cos(t) * sz, cy_ + sz, cz_ - Math.sin(t) * sz], [0, 0, 1, 1], [0.72, 0.3, 0.36]); }
          if (solid) K.addBlock(K.circlePx(qx, qy, s * 0.7, 8));
        };
        for (let i = 0; i < 12; i++) { const a = gap + 0.72 + (TAU - 1.44) * i / 11, d = R + 0.55; m(cx + Math.cos(a) * d / SX, cy + Math.sin(a) * d / SZ, 1.15 + r() * 0.35, false); }
        rock(cx - 50, cy + 52, 1.0, false); rock(cx + 40, cy + 56, 0.85, false);
        ringBlock(PENNANT.c, R - 0.1, R + 1.25, gap, 0.36);
        standingStone(cx, cy - 22, 0.48, 0.34, 1.45, 0.3, 11, [0.95, 0.95, 1.02]);
        // the screen before the way in
        m(cx + (R + 3.0) * Math.cos(gap) / SX + 10, cy + (R + 3.0) * Math.sin(gap) / SZ - 6, 1.3, true);
      }

      // ---- the mist: low banks of cold blue lying in the hollows (soft glows, drawn last) ----
      {
        const MIST = [[120, 120, 9], [-200, 100, 10], [60, 760, 9], [380, 860, 8], [1300, 860, 9], [1250, 200, 8], [-700, 300, 10], [-900, 1100, 10], [-300, 1500, 10],
          [400, 1300, 9], [1200, 1300, 10], [2000, 900, 10], [2500, 1500, 10], [2600, 0, 10], [1900, -500, 10], [1000, -400, 9], [200, -700, 10], [-600, -500, 10],
          [-1100, 400, 9], [2400, 300, 9], [1600, 1700, 9], [-1100, 1600, 9], [2800, 1100, 9], [-1200, -200, 9], [1100, 1700, 9]];
        for (const [x0, y0, s] of MIST) K.halo(X(x0), TH(x0, y0) + s * 0.08, Z(y0), s, [0.12, 0.15, 0.27]);
      }
      lump.dispose();
    },
  };
})(window);
