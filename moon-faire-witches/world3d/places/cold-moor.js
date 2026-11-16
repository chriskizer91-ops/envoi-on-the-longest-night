// cold-moor.js: the cold moor in 3D. Its painting (reference/art/walk/wilds/walk-cold-moor.png, 1536 x 1024) is the middle,
// laid out in the painting's own pixels as src/game/maps.js keeps the walking map: the old road of broken flagstones from
// Eldergrove's edge in the west to the northern crossroads in the east; the side path north to the ruined shepherd's hut
// (roofless walls of squared stone, its corner pillar, a doorway and a window gap in its back wall, a fallen roof beam
// inside) and the low curved drystone wall of its sheepfold with the capstone at its open end; the path south past the
// low rocky rise with the cairn on top; the frozen tarn in the north-east, its black ice cracked white, reeds and stones
// standing in it; the three cairns that mark the way; the moor of frosted heather and dead bracken, the grey boulders,
// the bare white birches and the low dark thorns.
// Round it the moor goes on, one painting each way (Chris, November 16: wild places are wide open fields in heavy fog,
// with pockets to find): wide, bleak, rolling ground, heather and bracken, boulders, a few bare thorny trees and dark
// thorns in small clumps, the old road on west and east with tall marker stones along it, and trails to places to find:
// a lone standing stone in the north, a tor of stacked granite slabs in the south, a broken field wall with a fallen gate
// in the north-east, a great lone thorn on a knoll in the south-west and a peat bog crossed by a plank walk in the
// south-east. Two pockets: the sheepfold (past the walking map's hut floor, through the hut), and a hollow among the
// rise's boulders behind the cairn, its way in round the back.
// The frozen tarn's ice is solid underfoot here: it looks walkable, so it is (Chris, November 16). Its stones are solid,
// its reeds not.
// No keepsake lives here (envoi-final-draft/items/items.js has none whose home is the cold moor), so no shimmer.
// Where Io can walk: the walking map's own walk and block areas, unchanged, plus all the open ground inside open.bounds,
// less the bog's water and everything solid (every boulder, wall, cairn, trunk and marker stone, the hedge of gorse and
// heather just inside the open ground's edge).
// The texture ids are the texture pack's (texture-packs/wilds-north/cold-moor/inventory.md).
// Heights are metres: the road and the painting's moor are 0; the tarn's ice lies 0.45 below; the rise swells 2 m east
// of the south path; past the painting the moor rolls in long swells (about 3 m up and down), gentler along the trails.
(function (G) {
  'use strict';
  const P = G.W3D_PLACES = G.W3D_PLACES || {};
  const ID = 'cold-moor';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ss = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const SX = 0.04, SZ = 0.05;
  const inPoly = (poly, x, y) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
  const edgeDist = (poly, x, y) => { let d = 1e9; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const ax = poly[j][0], ay = poly[j][1], dx = poly[i][0] - ax, dy = poly[i][1] - ay, t = clamp(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1), 0, 1); d = Math.min(d, Math.hypot(x - ax - t * dx, y - ay - t * dy)); } return d; };
  const bboxOf = (poly) => { let a = 1e9, b = 1e9, c = -1e9, d = -1e9; for (const [x, y] of poly) { a = Math.min(a, x); b = Math.min(b, y); c = Math.max(c, x); d = Math.max(d, y); } return [a, b, c, d]; };
  const segDist = (x, y, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], t = clamp(((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy || 1), 0, 1); return Math.hypot(x - a[0] - t * dx, y - a[1] - t * dy); };
  const ellipse = (c, rx, ry, n, wob) => Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2, k = 1 + (wob || 0) * Math.sin(a * 3 + 1.3) * Math.cos(a * 2); return [Math.round(c[0] + Math.cos(a) * rx * k), Math.round(c[1] + Math.sin(a) * ry * k)]; });

  // ---- the frozen tarn: its ice (with the frosted crust round its edge), traced from the painting ----
  const TARN = [[976, 128], [1048, 104], [1168, 80], [1288, 88], [1408, 104], [1452, 160], [1462, 240], [1424, 302], [1328, 336], [1248, 366], [1128, 376],
    [1008, 374], [962, 336], [958, 160]];
  const TB = bboxOf(TARN), ICE = -0.45;
  // ---- the rise: a low swell of big boulders east of the south path, the cairn on its north shoulder ----
  const RISE = { c: [905, 850], rx: 150, ry: 150, h: 1.1 };

  // ---- the trails past the painting: centre lines in pixels, their half widths (m), and whether they are the old
  // road's flagstones (the rest are trodden frozen earth) ----
  const TRAILS = [
    { id: 'road-west', w: 2.7, road: true, pts: [[16, 566], [-150, 560], [-330, 590], [-520, 562], [-720, 576], [-900, 560], [-1142, 566]] },
    { id: 'road-east', w: 2.2, road: true, pts: [[1520, 561], [1700, 576], [1880, 548], [2060, 570], [2240, 590], [2420, 562], [2600, 556], [2712, 561]] },
    { id: 'north', w: 0.8, pts: [[306, 178], [298, 40], [250, -120], [300, -300], [262, -450]] },
    { id: 'south', w: 0.9, pts: [[760, 1016], [772, 1150], [722, 1300], [782, 1450], [770, 1560]] },
    { id: 'north-east', w: 0.8, pts: [[1385, 92], [1440, -40], [1560, -190], [1690, -350], [1775, -470], [1785, -640]] },
    { id: 'south-west', w: 0.8, pts: [[-330, 615], [-380, 800], [-300, 1000], [-350, 1170]] },
    { id: 'south-east', w: 0.8, pts: [[2060, 590], [2100, 800], [2000, 1000], [2050, 1170]] },
  ];
  // the old road as it runs on past each way out into the fog (seen, not walked: the way out is at the open ground's edge)
  const ROAD_ON = [{ w: 2.7, pts: [[-1142, 566], [-1300, 560], [-1500, 572]] }, { w: 2.2, pts: [[2712, 561], [2860, 555], [3060, 566]] }];
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
  const trailDist = (x, y) => { let d = 1e9; for (const t of TRAILS.concat(ROAD_ON.map((r) => ({ road: true, pts: r.pts })))) for (let i = 1; i < t.pts.length; i++) d = Math.min(d, segDist(x, y, t.pts[i - 1], t.pts[i]) - (t.road ? 40 : 0)); return Math.max(0, d); };

  // ---- the places to find, and the pockets ----
  const NOOK_C = [962, 862];
  const STONE = { at: [262, -520] };                            // the lone standing stone, north
  const TOR = { c: [776, 1660] };                               // the tor of stacked slabs, south, on its knoll
  const WALL = { pts: [[1430, -470], [1560, -500], [1700, -510], [1790, -505], [1890, -520], [2010, -540], [2130, -560]], gate: 1780 };   // the broken field wall, north-east, and its gate
  const THORN = { at: [-350, 1250] };                           // the great lone thorn on its knoll, south-west
  const BOG = { c: [2050, 1310], rx: 140, ry: 105, walk: [2036, 1186, 2064, 1430] };   // the peat bog and its plank walk, south-east
  const FOLD = { at: [690, 262] };                              // inside the sheepfold (pocket)
  const NOOK = { c: NOOK_C, r: 2.6 };                       // the hollow among the rise's boulders (pocket), its way in on the south-east
  const BOGP = ellipse(BOG.c, BOG.rx, BOG.ry, 20, 0.14);
  // level places and knolls: [x, y, radius (m), raise (m)]: the ground settles there (and rises by `raise`)
  const FLATS = [[NOOK_C[0], NOOK_C[1], 2.4, 0], [STONE.at[0], STONE.at[1], 6, 0.8], [TOR.c[0], TOR.c[1], 9, 2.2], [THORN.at[0], THORN.at[1], 6, 1.4], [BOG.c[0], BOG.c[1], 11, 0], [WALL.gate, -505, 5, 0]];
  // marker stones along the old road past the painting: [x, y]
  const MARKERS = [[-180, 486], [-560, 640], [-940, 486], [1720, 503], [2090, 643], [2460, 491]];

  // ---- the hut and its fold: wall runs [from, to, lowest, highest (m), thickness (m)], ground lines in pixels ----
  const HUT_WALLS = [
    [[402, 172], [411, 226], 1.7, 2.5, 0.62],                   // the west wall, from the corner pillar back
    [[396, 166], [438, 163], 1.9, 2.7, 0.62], [[438, 163], [462, 161], 0.95, 1.05, 0.62], [[462, 161], [494, 158], 1.8, 2.6, 0.62],   // the back wall: its window gap,
    [[521, 157], [604, 150], 1.6, 2.8, 0.62],                   // its doorway (494 to 521), and on east
    [[604, 150], [607, 203], 1.2, 2.2, 0.62],                   // the east wall's stub
  ];
  const PILLAR = { at: [416, 236], w: 0.95, d: 0.85, h: 3.0 };
  const FOLD_WALL = [[523, 274], [580, 304], [650, 324], [730, 322], [785, 298], [802, 250], [788, 202], [745, 168], [680, 154], [606, 152]];
  const CAP = { at: [523, 272] };
  const CAIRNS = [[185, 468, 1.0], [1240, 505, 0.95], [918, 734, 1.15]];

  // ---- the painting's boulders, thorns, birches; stones and reeds in the tarn: [x, y, size] ----
  const ROCKS = [[40, 96, 1.4], [664, 388, 1.3], [48, 452, 1.15], [920, 264, 1.4], [828, 232, 0.9], [988, 70, 1.2], [1456, 120, 1.7], [1484, 296, 1.4],
    [1160, 424, 1.3], [1125, 400, 1.05], [568, 640, 1.5], [464, 592, 1.0], [228, 660, 1.1], [340, 860, 1.6], [430, 880, 1.4], [256, 922, 1.1], [500, 910, 1.0],
    [744, 766, 0.85], [1170, 940, 1.3], [1376, 956, 1.2], [1500, 982, 1.0], [80, 1000, 1.2], [1530, 660, 0.9]];
  // the rise's boulders, round the hollow among them (its own ring is built with it)
  const RISE_ROCKS = [[800, 830, 1.6], [866, 812, 1.7], [946, 796, 1.4], [905, 905, 1.5], [852, 952, 1.2], [1016, 790, 1.0], [1000, 700, 0.9], [1082, 996, 1.1]];
  const THORNS = [[60, 200, 1.0], [120, 112, 1.1], [170, 40, 0.85], [30, 330, 0.8], [120, 642, 0.9], [1215, 762, 1.15], [1400, 690, 1.1], [1500, 800, 1.2],
    [1468, 930, 0.95], [780, 60, 0.85]];
  const BIRCH_CLUMPS = [[60, 822, 3, 0.9], [150, 902, 2, 0.85], [1440, 70, 2, 0.9], [1496, 448, 2, 0.85], [1286, 890, 2, 0.9], [912, 214, 1, 0.75]];
  const TARN_STONES = [[1076, 122, 0.55], [1108, 144, 0.5], [1236, 114, 0.55], [1168, 290, 0.5], [1088, 340, 0.6], [1412, 332, 0.5], [962, 300, 0.45], [1344, 358, 0.55]];
  const TARN_REEDS = [[1112, 92, 0.9], [1308, 132, 0.8], [1376, 158, 1.0], [1008, 224, 1.0], [1060, 288, 1.1], [1120, 272, 0.8], [1220, 308, 0.9], [1264, 352, 0.9],
    [1432, 264, 0.8], [966, 330, 0.8]];
  // the low banks of cold mist lying over the moor: [x, y, size m]
  const MIST = [[1200, 230, 10], [300, 760, 9], [1000, 960, 9], [600, 300, 8], [STONE.at[0], STONE.at[1], 9], [TOR.c[0], TOR.c[1], 10], [1800, -500, 10],
    [THORN.at[0], THORN.at[1], 9], [BOG.c[0], BOG.c[1], 10], [-700, 300, 11], [-800, 900, 11], [2300, 200, 11], [2400, 1200, 11], [1500, 1500, 11],
    [0, 1500, 11], [600, -700, 11], [1300, -300, 10], [-300, -300, 10], [2600, -600, 10], [-1000, -600, 10], [2000, 300, 9]];

  // ---- the ground ----
  const W3D = () => G.W3D;
  const roll = (x, y, t) => (W3D().vnoise(x / 520, y / 520) - 0.5) * 6.0 + t * (W3D().vnoise(x / 160, y / 160) - 0.5) * 1.4;
  const tarnOut = (x, y) => (x < TB[0] - 70 || x > TB[2] + 70 || y < TB[1] - 70 || y > TB[3] + 70) ? 999 : inPoly(TARN, x, y) ? 0 : edgeDist(TARN, x, y);
  const flatK = [];
  // the ground's lie before the level places are settled
  function base(x, y) {
    let h = 0;
    // the tarn lies a little low, its ice flat
    const d = tarnOut(x, y); if (d < 60) h += ICE * (1 - ss(0, 60, d));
    // the rise
    const rr = Math.hypot((x - RISE.c[0]) / RISE.rx, (y - RISE.c[1]) / RISE.ry); if (rr < 1) h += RISE.h * (1 - ss(0.3, 1, rr));
    // the long swells past the painting: none on it, gentler along the trails
    const out = Math.hypot(Math.max(0, -x, x - 1536), Math.max(0, -y, y - 1024)), k = ss(0, 300, out);
    if (k > 0) h += k * roll(x, y, ss(25, 100, trailDist(x, y)));
    return h;
  }
  function ground(x, y) {
    let h = base(x, y);
    // the level places and the knolls: the ground there settles to its height at the middle (and rises by `up`)
    for (let i = 0; i < FLATS.length; i++) {
      const [fx, fy, fr, up] = FLATS[i], fd = Math.hypot((x - fx) * SX, (y - fy) * SZ);
      if (fd < fr + 9) {
        if (flatK[i] == null) flatK[i] = base(fx, fy);
        h += (flatK[i] - h) * (1 - ss(fr, fr + 9, fd)) + up * (1 - ss(fr * 0.4, fr + 9, fd));
      }
    }
    return h;
  }
  const bogLevel = () => { ground(BOG.c[0], BOG.c[1]); return flatK[4] - 0.35; };

  let WB = null;
  const mapWalk = () => WB || (WB = (((G.MAPS || {})[ID] || { walk: [] }).walk).map((p) => ({ p, b: bboxOf(p) })));
  // the walking map's side paths, clipped off the road (their earth is painted over the road's flagstones)
  const sidePath = (i, y0, y1) => ((((G.MAPS || {})[ID] || { walk: [] }).walk[i]) || []).map(([x, y]) => [x, clamp(y, y0, y1)]);

  P[ID] = {
    id: ID, name: 'The cold moor', painting: "art/walk/walk-cold-moor.avif", size: [1536, 1024],
    mapId: ID, paintingPng: 'reference/art/walk/wilds/walk-cold-moor.png',
    // the moor: one painting each way round the painting; where Io may roam inside it (gorse and heather close it in)
    extent: [-1536, -1024, 3072, 2048],
    open: { bounds: [[-1142, 500], [-1180, 200], [-1240, -300], [-1100, -700], [-700, -820], [-200, -780], [300, -840], [800, -800], [1300, -860],
      [1800, -820], [2300, -840], [2700, -700], [2800, -300], [2760, 200], [2712, 500], [2712, 625], [2780, 1000], [2820, 1450], [2650, 1800],
      [2100, 1860], [1500, 1800], [900, 1860], [300, 1800], [-300, 1840], [-900, 1760], [-1200, 1500], [-1150, 1000], [-1240, 760], [-1142, 630]] },
    // the wall check (tools/walls-test.mjs): from the road's middle, to the start, the cairns, the hut's floor and the fold,
    // the rise's cairn and the hollow among its boulders, out onto the tarn's ice, the south path's foot, every place to
    // find and both ways out
    checks: { from: [760, 560], goals: [
      ['the start, at the painting’s west edge', 50, 564], ['the cairn on the road’s north verge', 186, 500], ['the hut’s earth floor', 500, 240],
      ['inside the sheepfold (pocket)', FOLD.at[0], FOLD.at[1]], ['out through the hut’s back doorway', 508, 120], ['the cairn on the rise', 866, 676],
      ['the hollow among the rise’s boulders (pocket)', NOOK.c[0], NOOK.c[1]], ['the tarn’s shore', 1080, 445], ['out on the tarn’s ice', 1200, 220],
      ['the cairn by the tarn', 1240, 540], ['the south path, at the painting’s foot', 760, 1010],
      ['the way on to Eldergrove’s edge (the west exit)', -1134, 566], ['the way on to the northern crossroads (the east exit)', 2704, 561],
      ['the standing stone (north)', 262, -470], ['the tor (south)', 776, 1588], ['the gate in the broken wall (north-east)', WALL.gate, -470],
      ['the lone thorn (south-west)', -350, 1205], ['the plank walk over the bog (south-east)', 2050, 1310]] },
    // the trees: past the painting, small clumps of bare thorny trees, far apart (a moor, not a wood); none in the places to
    // find. The painting's low dark thorns (and a few more by the trails) are built in extra(), low and gnarled, as old
    // hawthorns are (the engine's leafy tree stands too tall and round for them).
    treeGen: { dark: 2, step: 80,
      out: { density: 0.36, clump: 260, clear: 0.5, kinds: [0, 0, 1], size: [0.75, 1.3] },
      roads: [[-1536, 500, -1142, 640], [2712, 500, 3072, 625]],
      keepOut: [[STONE.at[0] - 150, STONE.at[1] - 130, STONE.at[0] + 150, STONE.at[1] + 130], [TOR.c[0] - 250, TOR.c[1] - 200, TOR.c[0] + 250, TOR.c[1] + 200],
        [WALL.pts[0][0] - 60, -620, WALL.pts[WALL.pts.length - 1][0] + 60, -420], [THORN.at[0] - 170, THORN.at[1] - 150, THORN.at[0] + 170, THORN.at[1] + 150],
        [BOG.c[0] - 240, BOG.c[1] - 200, BOG.c[0] + 240, BOG.c[1] + 200]] },
    // the ground: the road's flagstones, frozen earth on the paths and the trails, frosted heather everywhere else, the
    // tarn's black ice
    ground: { cob: 'moor_road_flags', dirt: 'frozen_earth_path', grass: 'moor_heather_frost', pave: 'shared_lake_ice', rep: [3.2, 3.0, 2.4, 7.5],
      grassTint: [1.0, 1.0, 1.04], paveTint: [0.34, 0.36, 0.47] },
    // what each kind of surface is made of here: the hut's squared stone, the fold's and the cairns' drystone
    surfaces: { stone: 'shared_stone_wall_rough', dry: 'shared_drystone', timber: 'shared_stone_wall_rough', planks: 'jetty_planks_snow', roof: 'shared_drystone',
      wood: 'eldergrove_dead_bark', deck: 'jetty_planks_snow', pave: 'moor_road_flags', cloth: 'moor_bracken_heather', soil: 'frozen_earth_path', rock: 'boulder_mossy_frost',
      leaves: 'moor_heather_frost', firs: 'moor_heather_frost', bark: 'thorn_bark_black' },
    tints: { leaves: 0xc8c4dc, firs: 0xc8c4dc, bush: 0xd0cce2, wood: 0xb8acb4 },
    // the white birches (plain: the birch stand-in is bold stripes), dead bracken, reeds, the boulders' granite (its
    // stand-in is much yellower than the painting's), frost on the walls' tops
    extraMats: { birch: { tint: 0xc9c9d4, shade: 0.5 }, birchMark: { tint: 0x2c2830, shade: 0.5 }, bracken: { tex: 'moor_bracken_heather', rep: 1.2, tint: 0xe8d8d0, shade: 0.5 },
      reed: { tint: 0x5c5048, side: 'double', shade: 0.5 }, cattail: { tint: 0x3e2c24, shade: 0.5 }, cut: { tint: 0xb89c80, shade: 0.5 },
      rock: { tex: 'boulder_mossy_frost', rep: 1.8, tint: 0xc0c6e6, shade: 0.7 }, frost: { tint: 0x8a90a6, shade: 0.4 }, deck: { tex: 'jetty_planks_snow', rep: 2.2, tint: 0x67657a, shade: 0.6 },
      hawthorn: { tex: 'moor_heather_frost', rep: 1.6, tint: 0xb4b2cc, shade: 0.55 },
      tuft: { tex: 'moor_bracken_heather', rep: 0.8, tint: 0xf0e4d8, side: 'double', shade: 0.4 },
      frond: { tex: 'moor_bracken_heather', rep: 0.6, tint: 0xffe0c8, side: 'double', shade: 0.45 } },
    // heavy cold fog, as in the Thornwood; no far hills (the fog is the edge)
    night: { fog: [0.18, 0.185, 0.338], fogNear: 10, fogFar: 42, far: 90, hills: false, sky: [0.58, 0.58, 0.72], moon: [0.4, 0.44, 0.6] },
    textures: [
      { id: 'moor_road_flags', made: "./../texture-packs/made/moor_road_flags.png", stand: "./../texture-packs/wilds-north/cold-moor/stand-in/moor_road_flags.png" },
      { id: 'frozen_earth_path', made: "./../texture-packs/made/frozen_earth_path.png", stand: "./../texture-packs/wilds-north/cold-moor/stand-in/frozen_earth_path.png" },
      { id: 'moor_heather_frost', made: "./../texture-packs/made/moor_heather_frost.png", stand: "./../texture-packs/wilds-north/cold-moor/stand-in/moor_heather_frost.png" },
      { id: 'moor_bracken_heather', made: "./../texture-packs/made/moor_bracken_heather.png", stand: "./../texture-packs/wilds-north/cold-moor/stand-in/moor_bracken_heather.png" },
      { id: 'shared_lake_ice', made: "./../texture-packs/made/shared_lake_ice.png", stand: "./../texture-packs/wilds-north/frostmere-shore/stand-in/shared_lake_ice.png" },
      { id: 'boulder_mossy_frost', made: "./../texture-packs/made/boulder_mossy_frost.png", stand: "./../texture-packs/wilds-north/northern-camp/stand-in/boulder_mossy_frost.png" },
      { id: 'shared_stone_wall_rough', made: "./../texture-packs/made/shared_stone_wall_rough.png", stand: "./../texture-packs/wickhollow/wickhollow/stand-in/shared_stone_wall_rough.png" },
      { id: 'shared_drystone', made: "./../texture-packs/made/shared_drystone.png", stand: "./../texture-packs/wickhollow/jetty/stand-in/shared_drystone.png" },
      { id: 'shared_water_dark', made: "./../texture-packs/made/shared_water_dark.png", stand: "./../texture-packs/wickhollow/jetty/stand-in/shared_water_dark.png" },
      { id: 'thorn_bark_black', made: "./../texture-packs/made/thorn_bark_black.png", stand: "./../texture-packs/wickhollow/thornwood/stand-in/thorn_bark_black.png" },
      { id: 'eldergrove_dead_bark', made: "./../texture-packs/made/eldergrove_dead_bark.png", stand: "./../texture-packs/wilds-south/eldergrove-edge/stand-in/eldergrove_dead_bark.png" },
      { id: 'jetty_planks_snow', made: "./../texture-packs/made/jetty_planks_snow.png", stand: "./../texture-packs/wilds-north/frostmere-shore/stand-in/jetty_planks_snow.png" },
    ],
    ground_h: ground,
    walk_h: ground,
    water: [
      { poly: BOGP, level: () => bogLevel(), tex: 'shared_water_dark', rep: 5, flow: [0.002, 0.001], bed: -4.0, tint: 0xb8a898 },
    ],
    lawns: [],
    // no boulders strewn along the plank walk's ends
    noRocks: [[BOG.walk[0] - 30, BOG.walk[1] - 30, BOG.walk[2] + 30, BOG.walk[3] + 30]],
    // the open ground's edge is closed by a hedge of gorse and heather built in extra()
    thicket: false,
    start: [50, 564], startFace: Math.PI / 2, startYaw: -Math.PI / 2,
    // the ways on, where the old road reaches the open ground's edge
    exits: [
      { rect: [-1144, 510, -1124, 622], label: 'Eldergrove’s edge' },
      { rect: [2692, 512, 2712, 610], label: 'The northern crossroads' },
    ],
    // the trails: the old road's flagstones with earth verges, the others trodden frozen earth; the tarn's ice; the
    // sheepfold's floor
    walkAdd: TRAILS.map((t) => ({ poly: ribbon(t.pts, t.w + 0.5), ground: 'dirt' })).concat(TRAILS.filter((t) => t.road).map((t) => ({ poly: ribbon(t.pts, t.w), ground: 'cob' })))
      .concat([{ poly: TARN, ground: 'grass' }]),
    // frozen earth on the walking map's side paths (its ground there is all one with the road), black ice on the tarn
    get groundPatches() {
      return [
        { poly: sidePath(1, -9999, 446), kind: 'dirt' }, { poly: sidePath(2, 548, 9999), kind: 'dirt' }, { poly: sidePath(3, -9999, 512), kind: 'dirt' },
        { poly: [[548, 210], [604, 206], [700, 172], [784, 206], [798, 250], [780, 296], [720, 316], [640, 316], [570, 294]], kind: 'dirt' },
        { poly: TARN, kind: 'pave' },
      ].concat(ROAD_ON.map((r) => ({ poly: ribbon(r.pts, r.w + 0.5), kind: 'dirt' })), ROAD_ON.map((r) => ({ poly: ribbon(r.pts, r.w), kind: 'cob' })));
    },
    items: {},
    buildings: [],
    walls: [],
    steps: [],
    lamps: [],
    // the plank walk over the bog, on short stilts
    get decks() { return [{ r: BOG.walk, y: bogLevel() + 0.42, boards: 'ns', stilts: true, bottom: bogLevel() - 1.5, spacing: 1.8 }]; },
    props: [],
    flowers: [],
    // the lights for the light map: no lamps or fires on the moor, only moonlight lying on the ice, the road and the
    // places to find
    lights: [
      [1210, 230, 300, 0.55, 'moon'], [600, 560, 260, 0.3, 'moon'], [1200, 560, 240, 0.28, 'moon'], [500, 250, 160, 0.3, 'moon'], [900, 760, 170, 0.3, 'moon'],
      [STONE.at[0], STONE.at[1] + 30, 170, 0.45, 'moon'], [TOR.c[0], TOR.c[1], 220, 0.42, 'moon'], [WALL.gate, -480, 170, 0.35, 'moon'],
      [THORN.at[0], THORN.at[1], 170, 0.4, 'moon'], [BOG.c[0], BOG.c[1], 220, 0.3, 'moon'], [-600, 570, 200, 0.25, 'moon'], [2200, 570, 200, 0.25, 'moon'],
    ],
    trees: ID,
    extraTrees: [],

    // ---- what the engine has no field for: the hut, the sheepfold, the cairns, the rise and its hollow, the tarn's stones
    // and reeds, the birches, the heather and bracken, the marker stones, the places to find, the hedge at the open
    // ground's edge, and the mist ----
    extra(K) {
      const { B, X, Z } = K, W = G.W3D, TAU = Math.PI * 2, TH = K.terrain;
      const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
      const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
      const norm = (a) => { const L = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / L, a[1] / L, a[2] / L]; };
      const PX = (x) => K.M.px(x), PY = (z) => K.M.py(z);
      const Q = (k, a, b, c, d, want, uv, col) => { const n = cross(sub(b, a), sub(d, a)); if (dot(n, want) < 0) B.quad(k, b, a, d, c, uv, col); else B.quad(k, a, b, c, d, uv, col); };
      const walkDist = (x, y) => { let d = 1e9; for (const q of mapWalk()) { if (W.inPoly(q.p, x, y)) return 0; if (x > q.b[0] - d && x < q.b[2] + d && y > q.b[1] - d && y < q.b[3] + d) d = Math.min(d, W.edgeDist(q.p, x, y)); } return d; };
      const pathDist = (x, y) => Math.min(walkDist(x, y), trailDist(x, y) - 34);
      const inTarn = (x, y) => tarnOut(x, y) < 6;
      const inBog = (x, y) => W.inPoly(BOGP, x, y);
      const inBounds = (x, y) => W.inPoly(P[ID].open.bounds, x, y);
      const placeKeep = [[STONE.at, 130, 110], [TOR.c, 230, 180], [THORN.at, 150, 130], [BOG.c, 220, 190], [[WALL.gate, -505], 90, 70], [[680, 240], 160, 110], [NOOK.c, 110, 90]];
      const nearPlace = (x, y) => placeKeep.some(([c, rx, ry]) => Math.abs(x - c[0]) < rx && Math.abs(y - c[1]) < ry);
      const soft = (fn) => { B.solid = false; fn(); B.solid = true; };
      const rockAt = (px, py, sz, solid, col, sq, y) => {
        const go = () => B.geom('rock', K.rockG[Math.floor(Math.abs(Math.sin(px * 12.9 + py * 7.3)) * 3) % 3], new THREE.Matrix4().compose(new THREE.Vector3(X(px), (y != null ? y : TH(px, py)) - sz * 0.2, Z(py)),
          new THREE.Quaternion().setFromEuler(new THREE.Euler(0, (px * 0.37 + py * 0.11) % TAU, 0)), new THREE.Vector3(sz, sz * (sq || 0.85), sz)), col || [1.0, 1.0, 1.04], 1.2);
        if (solid) { go(); K.addBlock(K.circlePx(px, py, sz * 0.8, 8)); } else soft(go);
      };
      function seg(k, A, Bp, ra, rb, n, col) {
        const d = sub(Bp, A), L = Math.hypot(d[0], d[1], d[2]), dir = mul(d, 1 / L);
        const u = norm(cross(Math.abs(dir[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0], dir)), v = cross(dir, u);
        const ring = (c, r, t) => add(c, add(mul(u, Math.cos(t) * r), mul(v, Math.sin(t) * r)));
        for (let i = 0; i < n; i++) { const t0 = i / n * TAU, t1 = (i + 1) / n * TAU; B.quad(k, ring(A, ra, t0), ring(A, ra, t1), ring(Bp, rb, t1), ring(Bp, rb, t0), [t0 * Math.max(ra, 0.15), 0, t1 * Math.max(ra, 0.15), L], col); }
      }
      const disc = (k, c, dir, rad, n, col) => { const d = norm(dir), u = norm(cross(Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0], d)), v = cross(d, u); for (let i = 0; i < n; i++) { const a = i / n * TAU, b = (i + 1) / n * TAU, p = (t) => add(c, add(mul(u, Math.cos(t) * rad), mul(v, Math.sin(t) * rad))); const A = p(a), Bq = p(b), nn = cross(sub(A, c), sub(Bq, c)); if (dot(nn, d) < 0) B.tri(k, c, Bq, A, [[0, 0], [rad, 0], [0, rad]], col); else B.tri(k, c, A, Bq, [[0, 0], [rad, 0], [0, rad]], col); } };
      // a standing stone: tall, tapering, its shoulders rounded
      function standingStone(sx, sy, w, d, h, ry, seed, lean) {
        const base = TH(sx, sy) - 0.3, g = new THREE.BoxGeometry(1, 1, 1, 3, 9, 2), p = g.attributes.position;
        const hh = (a, b, c) => { const s = Math.sin(a * 127.1 + b * 311.7 + c * 74.7 + seed) * 43758.5453; return s - Math.floor(s); };
        for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), t = y + 0.5, wk = 1 - 0.26 * t; let yy = t; if (t > 0.8) yy -= x * x * 0.55 * ss(0.8, 1, t); const n = (hh(x, y, z) - 0.5) * 0.07; p.setXYZ(i, x * wk * w + n + t * (lean || 0), yy * h + n, z * d * (1 - 0.18 * t) + n * 0.5); }
        g.computeVertexNormals();
        B.geom('rock', g, new THREE.Matrix4().compose(new THREE.Vector3(X(sx), base, Z(sy)), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(1, 1, 1)), [1.0, 1.02, 1.06], [w * 1.5, h]);
        g.dispose();
      }
      // a heather cushion or a clump of dead bracken: low, Io walks through it
      const clump = (px, py, rr, r, mat) => soft(() => {
        const x = X(px), z = Z(py), y = TH(px, py);
        if (mat === 'bracken') {
          // a fan of rust-brown fronds arching out from the middle
          const n = 9 + Math.floor(r() * 5);
          for (let i = 0; i < n; i++) {
            const a = i / n * TAU + r() * 0.5, L = rr * (0.8 + r() * 0.5), w = 0.09 + r() * 0.05, ca = Math.cos(a), sa = Math.sin(a);
            const b0 = [x + ca * 0.06, y, z + sa * 0.06], m = [x + ca * L * 0.45, y + rr * (0.55 + r() * 0.3), z + sa * L * 0.45], tip = [x + ca * L, y + rr * 0.25, z + sa * L], side = [-sa * w, 0, ca * w], col = [1.25, 0.9, 0.62];
            B.quad('frond', add(b0, side), sub(b0, side), sub(m, side), add(m, side), [0, 0, 0.3, 0.5], col);
            B.tri('frond', add(m, side), sub(m, side), tip, [[0, 0], [0.3, 0], [0.15, 0.5]], col);
          }
        } else {
          const h = rr * (0.45 + r() * 0.2);
          B.geom('leafBush', K.ico[Math.floor(r() * 3)], new THREE.Matrix4().compose(new THREE.Vector3(x, y + h * 0.2, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, r() * TAU, 0)), new THREE.Vector3(rr, h, rr)), [0.92, 0.88, 1.02], 1.2);
          if (r() < 0.5) { const a = r() * TAU, sz = 0.24, cy = y + h * 0.95; B.quad('fl_violet', [x - Math.cos(a) * sz, cy - sz * 0.5, z - Math.sin(a) * sz], [x + Math.cos(a) * sz, cy - sz * 0.5, z + Math.sin(a) * sz], [x + Math.cos(a) * sz, cy + sz, z + Math.sin(a) * sz], [x - Math.cos(a) * sz, cy + sz, z - Math.sin(a) * sz], [0, 0, 1, 1], [0.8, 0.7, 0.95]); }
        }
      });
      // a gorse or heather bush: waist high, solid
      const bush = (px, py, rr, r) => {
        const x = X(px), z = Z(py), y = TH(px, py), h = rr * (0.6 + r() * 0.3);
        B.geom('leafBush', K.ico[Math.floor(r() * 3)], new THREE.Matrix4().compose(new THREE.Vector3(x, y + h * 0.3, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, r() * TAU, 0)), new THREE.Vector3(rr, h, rr)), [0.8, 0.78, 0.92], 2.0);
        K.addBlock(K.circlePx(px, py, rr * 0.75, 8));
      };

      // ---- the ruined shepherd's hut: roofless walls of squared stone, broken to uneven heights, frost on their tops;
      // its corner pillar by the open front; a fallen roof beam inside; rubble along the walls' feet ----
      const wallRun = (A, Bq, lo, hi, t, mat, seed, frost) => {
        const r = W.rand(seed), a = [X(A[0]), Z(A[1])], b = [X(Bq[0]), Z(Bq[1])], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz), ry = Math.atan2(-dz, dx), n = Math.max(1, Math.ceil(L / 0.42));
        for (let i = 0; i < n; i++) {
          const f = (i + 0.5) / n, x = a[0] + dx * f, z = a[1] + dz * f, g = TH(PX(x), PY(z)), hh = lo + (hi - lo) * W.vnoise(seed * 3.7 + f * L * 0.42, seed * 1.3) + (r() - 0.5) * 0.07;
          B.box(mat, x, g - 0.5, z, L / n + 0.03, hh + 0.5, t, ry, [0.95 - r() * 0.12, 0.95 - r() * 0.12, 1.0 - r() * 0.1], { u0: i * L / n });
          if (frost) soft(() => B.box('frost', x, g + hh, z, L / n + 0.04, 0.05, t + 0.04, ry, null));
        }
        K.addBlock(ribbon([A, Bq], t / 2 + 0.04));
      };
      HUT_WALLS.forEach(([A, Bq, lo, hi, t], i) => wallRun(A, Bq, lo, hi, t, 'stone', 11 + i * 7, true));
      {
        const [px, py] = PILLAR.at, x = X(px), z = Z(py), y = TH(px, py);
        B.box('stone', x, y - 0.4, z, PILLAR.w, PILLAR.h + 0.4, PILLAR.d, 0.05, [0.98, 0.98, 1.02]);
        B.box('stone', x + 0.05, y + PILLAR.h, z, PILLAR.w * 0.7, 0.3, PILLAR.d * 0.8, 0.3, [0.92, 0.92, 0.98]);
        soft(() => B.box('frost', x + 0.05, y + PILLAR.h + 0.3, z, PILLAR.w * 0.7 + 0.03, 0.05, PILLAR.d * 0.8 + 0.03, 0.3, null));
        K.addBlock(W.rectPoly([px - PILLAR.w / 2 / SX - 1, py - PILLAR.d / 2 / SZ - 1, px + PILLAR.w / 2 / SX + 1, py + PILLAR.d / 2 / SZ + 1]));
      }
      // the fallen beams: one inside the hut, one in the fold, lying on the ground
      seg('wood', [X(540), TH(540, 182) + 0.14, Z(182)], [X(596), TH(596, 210) + 0.3, Z(210)], 0.14, 0.13, 6, [0.85, 0.78, 0.76]);
      seg('wood', [X(560), TH(560, 250) + 0.13, Z(250)], [X(626), TH(626, 276) + 0.12, Z(276)], 0.13, 0.12, 6, [0.85, 0.78, 0.76]);
      // rubble along the walls' feet, inside and out, and the heap west of the path
      {
        const r = W.rand(17);
        for (let i = 0; i < 26; i++) { const t = r(), A = HUT_WALLS[Math.floor(r() * HUT_WALLS.length)], px = A[0][0] + (A[1][0] - A[0][0]) * t + (r() - 0.5) * 30, py = A[0][1] + (A[1][1] - A[0][1]) * t + 12 + r() * 18; if (walkDist(px, py) < 4) continue; rockAt(px, py, 0.18 + r() * 0.18, false, [0.95, 0.95, 1.0]); }
        for (let i = 0; i < 9; i++) soft(() => B.box('stone', X(290) + (r() - 0.5) * 1.6, TH(290, 300) - 0.1 + Math.floor(i / 4) * 0.25, Z(300) + (r() - 0.5) * 1.0, 0.5, 0.3, 0.32, r() * 3, [0.9, 0.9, 0.96]));
        K.addBlock(K.circlePx(290, 300, 0.85, 8));
      }

      // ---- the sheepfold: a low curved drystone wall from the hut round to its open end by the hut's front, a capstone
      // there; inside, a stone trough and a crook leaning on the wall (the fold is a pocket: in through the hut) ----
      for (let i = 1; i < FOLD_WALL.length; i++) wallRun(FOLD_WALL[i - 1], FOLD_WALL[i], 0.95, 1.25, 0.62, 'dry', 51 + i * 5, true);
      {
        const [px, py] = CAP.at, x = X(px), z = Z(py), y = TH(px, py);
        B.box('dry', x, y - 0.3, z, 0.9, 1.6, 0.9, 0.4, [0.95, 0.95, 1.0]);
        B.box('stone', x, y + 1.3, z, 1.2, 0.26, 1.0, 0.25, [0.9, 0.9, 0.96]);
        soft(() => B.box('frost', x, y + 1.56, z, 1.22, 0.05, 1.02, 0.25, null));
        K.addBlock(K.circlePx(px, py, 0.62, 10));
        const [fx, fy] = FOLD.at, tx = X(fx + 50), tz = Z(fy + 30), ty = TH(fx + 50, fy + 30);
        B.box('stone', tx, ty - 0.2, tz, 1.4, 0.65, 0.6, 0.3, [0.85, 0.85, 0.9]);
        soft(() => B.box('frost', tx, ty + 0.44, tz, 1.1, 0.04, 0.4, 0.3, [0.75, 0.8, 0.95]));
        K.addBlock(K.circlePx(fx + 50, fy + 30, 0.75, 8));
        const cx = X(780), cz = Z(232), cy = TH(780, 232);
        soft(() => { seg('wood', [cx - 0.2, cy, cz], [cx - 0.55, cy + 1.6, cz - 0.1], 0.025, 0.025, 4, [0.95, 0.85, 0.75]); seg('wood', [cx - 0.55, cy + 1.6, cz - 0.1], [cx - 0.75, cy + 1.75, cz - 0.1], 0.025, 0.025, 4, [0.95, 0.85, 0.75]); seg('wood', [cx - 0.75, cy + 1.75, cz - 0.1], [cx - 0.8, cy + 1.6, cz - 0.1], 0.025, 0.025, 4, [0.95, 0.85, 0.75]); });
      }

      // ---- the cairns: waist-high stacks of rounded stones narrowing to the top ----
      const cairn = (px, py, s, seed) => {
        const r = W.rand(seed), x = X(px), z = Z(py), y = TH(px, py) - 0.1;
        soft(() => {
          let yy = y, rad = 0.62 * s;
          for (let lv = 0; lv < 6; lv++) {
            const n = Math.max(1, Math.round(6 - lv * 1.1)), sz = (0.32 - lv * 0.03) * s;
            for (let i = 0; i < n; i++) { const a = i / n * TAU + lv * 0.7 + r() * 0.3, d = n === 1 ? 0 : rad; B.geom('dry', K.rockG[(i + lv) % 3], new THREE.Matrix4().compose(new THREE.Vector3(x + Math.cos(a) * d, yy + sz * 0.5, z + Math.sin(a) * d), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, a, 0)), new THREE.Vector3(sz * 1.1, sz * 0.85, sz)), [0.95, 0.95, 1.0], 0.8); }
            yy += sz * 1.2; rad *= 0.7;
          }
        });
        K.addBlock(K.circlePx(px, py, 0.62 * s + 0.15, 10));
        K.shadeMarks.push(['dot', px, py, 22 * s, 0.75]);
      };
      CAIRNS.forEach(([px, py, s], i) => cairn(px, py, s, 300 + i));

      // ---- the boulders: the painting's, the rise's, and a ring of them round the hollow on the rise (its way in on the
      // south-east, past the cairn's shoulder; a pocket) ----
      for (const [px, py, sz] of ROCKS.concat(RISE_ROCKS)) rockAt(px, py, sz, true);
      {
        const [cx, cy] = NOOK.c, r = W.rand(41), gap = 0.75;   // the gap faces south-east
        for (let i = 0; i < 9; i++) { const a = gap + 0.7 + (TAU - 1.4) * i / 8, d = NOOK.r + 0.6 + (r() - 0.5) * 0.3, s = 0.85 + r() * 0.35; rockAt(cx + Math.cos(a) * d / SX, cy + Math.sin(a) * d / SZ, s, false); }
        // solid: one smooth band round the ring (open at the gap, its ends rounded), so she slides round it
        {
          const r0 = NOOK.r - 0.1, r1 = NOOK.r + 1.3, rm = (r0 + r1) / 2, hw = (r1 - r0) / 2, ga = 0.42 + hw / rm, pts = [], n = 28, at = (a, rr) => [cx + Math.cos(a) * rr / SX, cy + Math.sin(a) * rr / SZ];
          for (let i = 0; i <= n; i++) pts.push(at(gap + ga + (TAU - 2 * ga) * i / n, r1));
          for (let i = n; i >= 0; i--) pts.push(at(gap + ga + (TAU - 2 * ga) * i / n, r0));
          K.addBlock(pts);
          for (const e of [gap + ga, gap - ga]) { const q = at(e, rm); K.addBlock(K.circlePx(q[0], q[1], hw, 12)); }
        }
        // inside: frost lying on the ground, and a little stone seat
        rockAt(cx - 20, cy - 8, 0.4, false, [1.05, 1.08, 1.15], 0.6);
        K.light(cx, cy, 70, 0.35, 'moon');
      }
      // stones and frost standing in the tarn's ice, reeds through it
      for (const [px, py, s] of TARN_STONES) rockAt(px, py, s, true, [0.98, 1.0, 1.06], 0.8, ICE);
      soft(() => {
        for (const [px, py, sp] of TARN_REEDS) {
          const rr = W.rand(Math.abs(px * 3 + py * 7)), x = X(px), z = Z(py), base = ICE - 0.05;
          for (let i = 0; i < 16; i++) {
            const bx = x + (rr() - 0.5) * sp * 1.6, bz = z + (rr() - 0.5) * sp, a = rr() * TAU, h = 1.0 + rr() * 0.9, w = 0.035, lean = 0.1 + rr() * 0.35;
            B.tri('reed', [bx - Math.sin(a) * w, base, bz + Math.cos(a) * w], [bx + Math.sin(a) * w, base, bz - Math.cos(a) * w], [bx + Math.cos(a) * lean, base + h, bz + Math.sin(a) * lean], [[0, 0], [1, 0], [0.5, 1]]);
            if (i % 5 === 0) B.cyl('cattail', bx + Math.cos(a) * lean * 0.85, base + h * 0.72, bz + Math.sin(a) * lean * 0.85, 0.035, 0.035, 0.2, 5);
          }
        }
      });

      // ---- the birches: clumps of thin white stems marked dark, with fine bare twigs ----
      function birch(px, py, s, seed, stems) {
        const r = W.rand(seed * 7919 + 3), x0 = X(px), z0 = Z(py), y0 = TH(px, py) - 0.2;
        for (let k = 0; k < (stems || 1); k++) {
          const a0 = r() * TAU, bx = x0 + (stems > 1 ? Math.cos(a0) * 0.35 : 0), bz = z0 + (stems > 1 ? Math.sin(a0) * 0.3 : 0);
          const H = (5.5 + r() * 2.5) * s, lean = [Math.cos(a0) * 0.14 + (r() - 0.5) * 0.1, 1, Math.sin(a0) * 0.14 + (r() - 0.5) * 0.1], rad = (0.1 + r() * 0.04) * s;
          let p = [bx, y0, bz], d = norm(lean), rr = rad; const pts = [];
          for (let i = 0; i < 3; i++) {
            const np = add(p, mul(d, H / 3)), nr = rr * 0.72; seg('birch', p, np, rr, nr, 6); pts.push([np, nr]);
            for (let m = 0; m < 3; m++) { const t = 0.1 + r() * 0.8, q = add(p, mul(d, H / 3 * t)), mr = rr + (nr - rr) * t + 0.004; seg('birchMark', q, add(q, mul(d, 0.05 + r() * 0.06)), mr, mr, 6); }
            p = np; rr = nr; d = norm(add(d, [(r() - 0.5) * 0.2, 0, (r() - 0.5) * 0.2]));
          }
          soft(() => {
            for (let j = 0; j < 5; j++) {
              const from = pts[Math.min(2, Math.floor(r() * 3))], a = r() * TAU, bd = norm([Math.cos(a), 0.9 + r() * 0.8, Math.sin(a)]), L = (0.9 + r() * 1.2) * s;
              const e = add(from[0], mul(bd, L)); seg('birch', from[0], e, from[1] * 0.6, 0.012, 3, [0.85, 0.85, 0.9]);
              for (let t = 0; t < 2; t++) { const td = norm(add(bd, [(r() - 0.5) * 1.6, r() * 0.6, (r() - 0.5) * 1.6])); seg('birch', e, add(e, mul(td, L * 0.5)), 0.012, 0.004, 3, [0.7, 0.7, 0.76]); }
            }
          });
          K.addBlock(K.circlePx(PX(bx), PY(bz), rad + 0.06, 8));
        }
        K.shadeMarks.push(['dot', px, py, 24 * s, 0.78]);
      }
      for (const [px, py, n, s] of BIRCH_CLUMPS) birch(px, py, s, px + py, n);

      // ---- a twisted, bare thorn: black trunk, crooked limbs, thorny twigs (the lone thorn's, and a few by the trails) ----
      function deadTree(px, py, s, seed, lean, big) {
        const r = W.rand(seed * 7919 + 13), x = X(px), z = Z(py), y0 = TH(px, py) - 0.3, k = 0.78 + r() * 0.2, col = [k, k * 0.95, k * 1.03];
        let p = [x, y0, z], dir = norm([(lean ? lean[0] : 0) + (r() - 0.5) * 0.3, 1, (lean ? lean[1] : 0) + (r() - 0.5) * 0.3]);
        const H = (3.0 + r() * 1.4) * s, NT = big ? 4 : 3, pts = []; let rad = 0.3 * s;
        for (let i = 0; i < (big ? 5 : 3); i++) { const a = i / (big ? 5 : 3) * TAU + r(); seg('wood', add(p, [Math.cos(a) * 0.85 * s, -0.35, Math.sin(a) * 0.85 * s]), add(p, [0, 0.9 * s, 0]), 0.08 * s, rad * 0.8, 4, col); }
        for (let i = 0; i < NT; i++) { const np = add(p, mul(dir, H / NT)), nr = rad * 0.76; seg('wood', p, np, rad, nr, big ? 7 : 6, col); pts.push([np, nr, dir]); p = np; rad = nr; dir = norm(add(dir, [(r() - 0.5) * 0.55, 0.05, (r() - 0.5) * 0.55])); }
        const NL = (big ? 6 : 3) + Math.floor(r() * 2.5);
        for (let j = 0; j < NL; j++) {
          const from = j < 2 ? pts[pts.length - 1] : pts[Math.max(0, pts.length - 2 - Math.floor(r() * 2))], a = j / NL * TAU + r() * 0.9, out = 0.7 + r() * 0.8;
          let d = norm([Math.cos(a) * out + from[2][0] * 0.3, 0.8 + r() * 0.4, Math.sin(a) * out + from[2][2] * 0.3]), q = from[0], lr = from[1] * (0.6 + r() * 0.15), L = (1.3 + r() * 0.8) * s * (big ? 1.15 : 1);
          for (let i = 0; i < (big ? 4 : 3); i++) {
            const nq = add(q, mul(d, L)), nlr = Math.max(0.018, lr * 0.62); seg('wood', q, nq, lr, nlr, lr > 0.09 ? 5 : 3, col);
            for (let t = 0; t < 1 + (r() < 0.65 ? 1 : 0); t++) { const td = norm(add(d, [(r() - 0.5) * 1.8, (r() - 0.3) * 1.2, (r() - 0.5) * 1.8])); seg('wood', nq, add(nq, mul(td, L * (0.45 + r() * 0.35))), nlr * 0.8, 0.008, 3, col); }
            q = nq; lr = nlr; L *= 0.78; d = norm(add(d, [(r() - 0.5) * 1.0, (r() - 0.62) * 0.55, (r() - 0.5) * 1.0]));
          }
        }
        K.addBlock(K.circlePx(px, py, 0.32 * s, 12));
        K.shadeMarks.push(['dot', px, py, 18 * s, 0.75]);
      }

      // ---- heather and dead bracken over the moor, thickest by the paths; gorse bushes here and there ----
      {
        const r = W.rand(777), STEP = 44;
        for (let gy = -40; gy < 1064; gy += STEP) for (let gx = -40; gx < 1576; gx += STEP) {
          const px = gx + (r() - 0.5) * STEP, py = gy + (r() - 0.5) * STEP, rr = 0.4 + r() * 0.4, keep = r(), wd = pathDist(px, py);
          if (wd < rr / SX + 3 || inTarn(px, py) || nearPlace(px, py) || keep > 0.5) continue;
          if (Math.hypot(px - 690, py - 240) < 150) continue;
          clump(px, py, rr, r, r() < 0.5 ? 'bracken' : 'leafBush');
        }
        // past the painting: clumps along the trails, and scattered wider over the moor
        for (const t of TRAILS) for (let i = 1; i < t.pts.length; i++) {
          const [ax, ay] = t.pts[i - 1], [bx, by] = t.pts[i], L = Math.hypot((bx - ax) * SX, (by - ay) * SZ);
          for (let s = r() * 3; s < L; s += 2.5 + r() * 3) {
            const f = s / L, cx = ax + (bx - ax) * f, cy = ay + (by - ay) * f, nx = -(by - ay) * SZ / L, nz = (bx - ax) * SX / L, rr = 0.4 + r() * 0.45, off = (t.w + 0.7 + rr + r() * 2.5) * (r() < 0.5 ? -1 : 1);
            const px = cx + nx * off / SX, py = cy + nz * off / SZ;
            if ((px >= -40 && px <= 1576 && py >= -40 && py <= 1064) || pathDist(px, py) < rr / SX + 3 || inBog(px, py) || !inBounds(px, py) || nearPlace(px, py)) continue;
            if (r() < 0.12) bush(px, py, 0.8 + r() * 0.4, r); else clump(px, py, rr, r, r() < 0.45 ? 'bracken' : 'leafBush');
          }
        }
        for (let i = 0; i < 420; i++) {
          const px = -1150 + r() * 3900, py = -850 + r() * 2700, rr = 0.45 + r() * 0.45;
          if ((px >= -40 && px <= 1576 && py >= -40 && py <= 1064) || !inBounds(px, py) || pathDist(px, py) < rr / SX + 4 || inBog(px, py) || nearPlace(px, py)) continue;
          if (r() < 0.1) bush(px, py, 0.8 + r() * 0.5, r); else clump(px, py, rr, r, r() < 0.45 ? 'bracken' : 'leafBush');
        }
        // tussocks of pale dry grass and bare frosted twigs by the paths on the painting
        for (let i = 0; i < 60; i++) {
          const px = r() * 1536, py = r() * 1024, wd = walkDist(px, py);
          if (wd < 4 || wd > 40 || inTarn(px, py) || nearPlace(px, py)) continue;
          const x = X(px), z = Z(py), y = TH(px, py);
          for (let k = 0; k < 7; k++) { const a = r() * TAU, lean = 0.12 + r() * 0.3, h = 0.4 + r() * 0.35, w = 0.04, bx = x + (r() - 0.5) * 0.5, bz = z + (r() - 0.5) * 0.4, ox = Math.cos(a), oz = Math.sin(a); B.tri('tuft', [bx - oz * w, y, bz + ox * w], [bx + oz * w, y, bz - ox * w], [bx + ox * lean, y + h, bz + oz * lean], [[0, 0], [0.1, 0], [0.05, 1]]); }
        }
      }

      // ---- the marker stones along the old road past the painting: tall and thin, frost on their heads ----
      MARKERS.forEach(([px, py], i) => { standingStone(px, py, 0.55, 0.38, 1.7 + (i % 3) * 0.2, 0.3 + i, 40 + i, 0.05); K.addBlock(K.circlePx(px, py, 0.4, 8)); });

      // ---- the lone standing stone in the north, on its low knoll, a few small stones round its foot ----
      {
        const [px, py] = STONE.at, r = W.rand(71);
        standingStone(px, py, 1.4, 0.75, 3.8, 0.25, 9, 0.1);
        K.addBlock(K.circlePx(px, py, 0.95, 10));
        for (let i = 0; i < 7; i++) { const a = r() * TAU, d = 1.6 + r() * 2.2; rockAt(px + Math.cos(a) * d / SX, py + Math.sin(a) * d / SZ, 0.2 + r() * 0.15, false); }
        K.shadeMarks.push(['dot', px, py + 6, 30, 0.7]);
      }

      // ---- the tor in the south: heaps of flat granite slabs stacked on its knoll, the tallest higher than a house ----
      {
        const [cx, cy] = TOR.c, r = W.rand(93);
        const stack = (px, py, n, w0, seed) => {
          const rr = W.rand(seed); let y = TH(px, py) - 0.4, w = w0;
          for (let i = 0; i < n; i++) {
            const h = 0.6 + rr() * 0.45, ox = (rr() - 0.5) * 0.5, oz = (rr() - 0.5) * 0.5;
            B.geom('rock', K.rockG[(seed + i) % 3], new THREE.Matrix4().compose(new THREE.Vector3(X(px) + ox, y + h * 0.45, Z(py) + oz), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rr() * 3, (rr() - 0.5) * 0.1)), new THREE.Vector3(w * (0.5 + rr() * 0.12), h * 0.82, w * (0.42 + rr() * 0.1))), [0.98, 1.0, 1.05], 1.6);
            y += h * 0.82; w *= 0.84 + rr() * 0.08;
          }
          K.addBlock(K.circlePx(px, py, w0 * 0.55, 10));
        };
        stack(cx, cy - 10, 7, 3.4, 1); stack(cx - 90, cy + 20, 5, 2.6, 2); stack(cx + 80, cy - 30, 4, 2.4, 3); stack(cx + 30, cy + 70, 3, 2.0, 4);
        for (let i = 0; i < 12; i++) { const a = r() * TAU, d = 3.5 + r() * 4, px = cx + Math.cos(a) * d / SX, py = cy + Math.sin(a) * d / SZ; if (py < cy - 40 || pathDist(px, py) < 30) continue; rockAt(px, py, 0.4 + r() * 0.5, true); }
        K.shadeMarks.push(['dot', cx, cy, 90, 0.7]);
      }

      // ---- the broken field wall in the north-east, running across the moor; where the trail crosses it, two gateposts
      // and the old gate fallen in the grass; elsewhere fallen to a heap she can step over ----
      {
        const r = W.rand(57), pts = WALL.pts;
        for (let i = 1; i < pts.length; i++) {
          const [ax, ay] = pts[i - 1], [bx, by] = pts[i], L = Math.hypot((bx - ax) * SX, (by - ay) * SZ), n = Math.ceil(L / 0.45);
          for (let k = 0; k < n; k++) {
            const t0 = k / n, t1 = (k + 1) / n, pa = [ax + (bx - ax) * t0, ay + (by - ay) * t0], pb = [ax + (bx - ax) * t1, ay + (by - ay) * t1], mx = (pa[0] + pb[0]) / 2;
            if (Math.abs(mx - WALL.gate) < 30) continue;   // the gateway
            const fallen = Math.abs(mx - 1560) < 40 || Math.abs(mx - 2010) < 50;   // two places where it has fallen to a low heap
            const hh = fallen ? 0.25 + r() * 0.08 : 0.85 + 0.45 * W.vnoise(i * 2.1 + k * 0.33, 7.7) + (r() - 0.5) * 0.06;
            const ry = Math.atan2(-(pb[1] - pa[1]) * SZ, (pb[0] - pa[0]) * SX), x = X((pa[0] + pb[0]) / 2), z = Z((pa[1] + pb[1]) / 2), g = TH((pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2);
            B.box('dry', x, g - 0.4, z, L / n + 0.03, hh + 0.4, fallen ? 0.9 : 0.6, ry, [0.95 - r() * 0.1, 0.95 - r() * 0.1, 1.0], { u0: k * L / n });
            if (!fallen) { soft(() => B.box('frost', x, g + hh, z, L / n + 0.04, 0.05, 0.64, ry, null)); K.addBlock(ribbon([pa, pb], 0.34)); }
          }
        }
        // the gateposts, and the gate lying in the grass beside the gap
        for (const s of [-1, 1]) { const px = WALL.gate + s * 32, py = -505 - s * 1, x = X(px), z = Z(py), y = TH(px, py); B.box('stone', x, y - 0.3, z, 0.45, 1.75, 0.45, 0, [0.95, 0.95, 1.0]); soft(() => B.box('frost', x, y + 1.45, z, 0.47, 0.05, 0.47, 0, null)); K.addBlock(K.circlePx(px, py, 0.32, 8)); }
        soft(() => {
          const gx = X(WALL.gate + 60), gz = Z(-470), gy = TH(WALL.gate + 60, -470) + 0.06;
          for (const dz of [-0.45, 0, 0.45]) B.box('wood', gx, gy, gz + dz, 2.2, 0.06, 0.1, 0.3, [0.85, 0.78, 0.74]);
          for (const dx of [-1.0, 0, 1.0]) B.box('wood', gx + dx * Math.cos(0.3), gy + 0.06, gz - dx * Math.sin(0.3), 0.1, 0.05, 1.1, 0.3, [0.8, 0.72, 0.68]);
        });
      }

      // ---- the great lone thorn in the south-west, on its knoll, a ring of stones half sunk round it ----
      {
        const [px, py] = THORN.at, r = W.rand(19);
        deadTree(px, py, 2.4, 1601, [0.25, 0.15], true);
        for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + r() * 0.2, d = 4.2; rockAt(px + Math.cos(a) * d / SX, py + Math.sin(a) * d / SZ, 0.35 + r() * 0.15, false, [0.95, 0.95, 1.02], 0.6); }
      }
      // a few more bare thorns along the trails past the painting
      {
        const r = W.rand(4242);
        for (const t of TRAILS) {
          let side = 1;
          for (let i = 1; i < t.pts.length; i++) {
            const [ax, ay] = t.pts[i - 1], [bx, by] = t.pts[i], L = Math.hypot((bx - ax) * SX, (by - ay) * SZ);
            for (let s = 8 + r() * 10; s < L; s += 28 + r() * 20) {
              const f = s / L, cx = ax + (bx - ax) * f, cy = ay + (by - ay) * f, nx = -(by - ay) * SZ / L, nz = (bx - ax) * SX / L, off = (t.w + 2.0 + r() * 3) * side;
              const px = cx + nx * off / SX, py = cy + nz * off / SZ; side = -side;
              if ((px >= -40 && px <= 1576 && py >= -40 && py <= 1064) || pathDist(px, py) < 30 || inBog(px, py) || !inBounds(px, py) || nearPlace(px, py)) continue;
              deadTree(px, py, 0.9 + r() * 0.5, Math.floor(r() * 1e5), [(px - cx) * 0.004, (py - cy) * 0.005], false);
            }
          }
        }
      }

      // ---- the peat bog in the south-east: dark water among tussocks; the engine lays the plank walk across it ----
      {
        const r = W.rand(23);
        soft(() => { for (let i = 0; i < 14; i++) { const a = r() * TAU, d = 0.7 + r() * 0.25, px = BOG.c[0] + Math.cos(a) * BOG.rx * d, py = BOG.c[1] + Math.sin(a) * BOG.ry * d; if (Math.abs(px - BOG.c[0]) < 30) continue; B.geom('bracken', K.ico[i % 3], new THREE.Matrix4().compose(new THREE.Vector3(X(px), bogLevel() + 0.05, Z(py)), new THREE.Quaternion(), new THREE.Vector3(0.6, 0.35, 0.6)), [0.9, 0.8, 0.7], 1.2); } });
      }

      // ---- the low dark thorns: a short twisted trunk, a few crooked limbs, and a wide flat crown of dark twigs speckled
      // with frost, low over the heather (the painting's own, and a few more by the trails past it) ----
      function hawthorn(px, py, s, seed) {
        const r = W.rand(seed * 977 + 5), x = X(px), z = Z(py), y0 = TH(px, py) - 0.2, col = [0.8, 0.76, 0.82];
        const lean = [(r() - 0.5) * 0.5, 1, (r() - 0.5) * 0.4], H = (1.4 + r() * 0.6) * s;
        let p = [x, y0, z], d = norm(lean), rad = 0.2 * s; const tops = [];
        for (let i = 0; i < 2; i++) { const np = add(p, mul(d, H / 2)), nr = rad * 0.75; seg('wood', p, np, rad, nr, 6, col); p = np; rad = nr; d = norm(add(d, [(r() - 0.5) * 0.7, 0, (r() - 0.5) * 0.7])); }
        for (let j = 0; j < 4; j++) { const a = j / 4 * TAU + r(), e = add(p, [Math.cos(a) * 1.0 * s, 0.35 * s + r() * 0.3, Math.sin(a) * 0.9 * s]); seg('wood', p, e, rad * 0.8, 0.05, 4, col); tops.push(e); }
        soft(() => {
          for (const t of tops.concat([add(p, [0, 0.45 * s, 0])])) B.geom('hawthorn', K.ico[Math.floor(r() * 3)], new THREE.Matrix4().compose(new THREE.Vector3(t[0], t[1] + 0.1, t[2]), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, r() * TAU, 0)), new THREE.Vector3(0.95 * s, 0.5 * s, 0.85 * s)), [0.7, 0.68, 0.82], 1.6);
        });
        K.addBlock(K.circlePx(px, py, Math.max(0.3, 0.55 * s), 10));
        K.shadeMarks.push(['dot', px, py, 40 * s, 0.72]);
      }
      THORNS.forEach(([px, py, s], i) => hawthorn(px, py, s, 211 + i));
      {
        const r = W.rand(919);
        for (const t of TRAILS) for (let i = 1; i < t.pts.length; i++) {
          const [ax, ay] = t.pts[i - 1], [bx, by] = t.pts[i], L = Math.hypot((bx - ax) * SX, (by - ay) * SZ);
          for (let s = 12 + r() * 16; s < L; s += 34 + r() * 24) {
            const f = s / L, cx = ax + (bx - ax) * f, cy = ay + (by - ay) * f, nx = -(by - ay) * SZ / L, nz = (bx - ax) * SX / L, off = (t.w + 3.0 + r() * 3) * (r() < 0.5 ? -1 : 1);
            const px = cx + nx * off / SX, py = cy + nz * off / SZ;
            if ((px >= -40 && px <= 1576 && py >= -40 && py <= 1064) || pathDist(px, py) < 50 || inBog(px, py) || !inBounds(px, py) || nearPlace(px, py)) continue;
            hawthorn(px, py, 0.9 + r() * 0.4, Math.floor(r() * 1e5));
          }
        }
      }

      // ---- a hedge of gorse and heather along the open ground's edge, broken only by the ways out ----
      {
        const OB = P[ID].open.bounds, r = W.rand(313), lump = new THREE.IcosahedronGeometry(1, 0);
        { const pp = lump.attributes.position, seen = {}; for (let i = 0; i < pp.count; i++) { const key = pp.getX(i).toFixed(3) + ',' + pp.getY(i).toFixed(3) + ',' + pp.getZ(i).toFixed(3), k = seen[key] || (seen[key] = 0.8 + r() * 0.35); pp.setXYZ(i, pp.getX(i) * k, pp.getY(i) * k, pp.getZ(i) * k); } lump.computeVertexNormals(); }
        const atExit = (x, y) => P[ID].exits.some((e) => x > e.rect[0] - 70 && x < e.rect[2] + 70 && y > e.rect[1] - 70 && y < e.rect[3] + 70);
        for (let i = 0, j = OB.length - 1; i < OB.length; j = i++) {
          const [ax, ay] = OB[j], [bx, by] = OB[i], L = Math.hypot((bx - ax) * SX, (by - ay) * SZ), tx = (bx - ax) * SX / L, tz = (by - ay) * SZ / L;
          let nx = -tz, nz = tx; if (!W.inPoly(OB, (ax + bx) / 2 + nx * 2 / SX, (ay + by) / 2 + nz * 2 / SZ)) { nx = -nx; nz = -nz; }
          for (let d = 0.4; d < L; d += 1.6 + r() * 0.5) for (const row of [0.8, 2.3]) {
            if (row > 1 && r() < 0.45) continue;
            const px = ax + (tx * d + nx * row + (r() - 0.5) * 0.6) / SX, py = ay + (tz * d + nz * row + (r() - 0.5) * 0.6) / SZ;
            if (atExit(px, py) || pathDist(px, py) < 24) continue;
            const rr = 1.05 + r() * 0.6, h = rr * (0.75 + r() * 0.45), y = TH(px, py), x = X(px), z = Z(py);
            B.geom('leafBush', lump, new THREE.Matrix4().compose(new THREE.Vector3(x, y + h * 0.35, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, r() * TAU, 0)), new THREE.Vector3(rr, h, rr)), [0.72, 0.7, 0.84], 2.0);
            if (r() < 0.5) { const t = r() * Math.PI, sz = 0.34, cy = y + h * 1.0; B.quad('fl_sun', [x - Math.cos(t) * sz, cy - sz * 0.6, z - Math.sin(t) * sz], [x + Math.cos(t) * sz, cy - sz * 0.6, z + Math.sin(t) * sz], [x + Math.cos(t) * sz, cy + sz, z + Math.sin(t) * sz], [x - Math.cos(t) * sz, cy + sz, z - Math.sin(t) * sz], [0, 0, 1, 1], [1.0, 0.82, 0.4]); }
            K.addBlock(K.circlePx(px, py, rr * 0.8, 8));
          }
        }
        lump.dispose();
      }

      // ---- the mist: low banks of cold blue lying over the moor (soft glows, drawn last) ----
      for (const [px, py, s] of MIST) K.halo(X(px), TH(px, py) + s * 0.1, Z(py), s, [0.13, 0.17, 0.3]);
    },
  };
})(window);
