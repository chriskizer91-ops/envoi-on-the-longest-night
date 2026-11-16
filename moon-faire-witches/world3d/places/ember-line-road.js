// ember-line-road.js: the Ember Line road in 3D. Its painting (reference/art/walk/wilds/walk-ember-line-road.png,
// 1536 x 1024) is the middle, laid out in the painting's own pixels as src/game/maps.js keeps the walking map: the old
// Warm Road (flagstones with amber in their seams) in from the west, over the stream on its humped stone bridge and on
// north; the three Ember Line nodes (squat old stones with a pale glassy eye near the top, gone dim and cold): in the ring
// of standing stones at the end of the west side path, beside the road by the bridge, and on the rise at the end of the
// east side path; the stream in its little valley with its falls; the low dry-stone walls with their old posts; heather,
// gorse, boulders and birches. Round it the moor goes on one painting each way in fog (Chris, November 16: wild places are
// wide open fields, with pockets to find): the road on west to the Warm Roads camp and north to the forest road to
// Dawnroost, and places to find: an old row of standing stones in the north-west, a ruined shieling in the east, a lone
// birch on its knoll in the north-east, the falls and the pool where the stream drops in the south-east (stepping stones
// below it), a dark copse of firs in the south-west, stepping stones over the stream in the north, and a milestone on the
// west road. Two pockets: the hollow behind the big boulder north of the road, and the clearing inside the dark copse.
// Where Io can walk: the walking map's own walk and block areas, unchanged, plus all the open ground inside open.bounds,
// less the stream and everything solid (every boulder, standing stone, trunk, gorse bush and wall; the bridge's parapets
// and pillars). No keepsake lives here (envoi-final-draft/items/items.js has none whose home is this map).
// The texture ids are the texture pack's (texture-packs/wilds-south/ember-line-road/inventory.md).
// Heights are metres: the road and the moor are 0; the stream runs in its valley, falling on its way south-east (its water
// -1.25 in the north, -2.3 at the painting's foot, -3.3 below the falls); the bridge's deck rises 0.75 over it; the east
// node's rise is a metre up; past the painting the moor rolls (about 2 m up and down), gentler along the trails, and the
// road keeps nearly level.
(function (G) {
  'use strict';
  const P = G.W3D_PLACES = G.W3D_PLACES || {};
  const ID = 'ember-line-road';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ss = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const SX = 0.04, SZ = 0.05;
  const W3D = () => G.W3D;
  const mDist = (ax, ay, bx, by) => Math.hypot((ax - bx) * SX, (ay - by) * SZ);
  const segDist = (x, y, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], t = clamp(((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy || 1), 0, 1); return Math.hypot(x - a[0] - t * dx, y - a[1] - t * dy); };
  // the same in metres (the painting's pixels are 4 cm across and 5 cm down), and where along the segment (0 to 1)
  const segM = (x, y, a, b) => { const ax = a[0] * SX, az = a[1] * SZ, dx = (b[0] - a[0]) * SX, dz = (b[1] - a[1]) * SZ, px = x * SX, pz = y * SZ, t = clamp(((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz || 1), 0, 1); return [Math.hypot(px - ax - t * dx, pz - az - t * dz), t]; };
  const lineDist = (x, y, pts) => { let d = 1e9; for (let i = 1; i < pts.length; i++) d = Math.min(d, segDist(x, y, pts[i - 1], pts[i])); return d; };
  // a band either side of a centre line, `hw` metres from it (or each point's own half width)
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
  const ellipse = (c, rx, ry, n, wob) => Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2, k = 1 + (wob || 0) * Math.sin(a * 3 + 1.3) * Math.cos(a * 2); return [Math.round(c[0] + Math.cos(a) * rx * k), Math.round(c[1] + Math.sin(a) * ry * k)]; });
  const circleM = (c, r, n) => ellipse(c, r / SX, r / SZ, n || 20, 0);

  // ---- the stream: its middle line and half width (m), north to south-east. On the painting traced from it; past it,
  // it comes from the north and goes on south-east out of the open ground, over the falls into the pool ----
  const SL = [[330, -1150, 1.3], [360, -900, 1.3], [420, -650, 1.3], [440, -420, 1.3], [462, -200, 1.4], [482, 0, 1.5], [505, 60, 1.4], [550, 130, 1.35],
    [595, 205, 1.5], [635, 275, 1.5], [680, 345, 1.45], [722, 410, 1.3], [770, 470, 1.2], [810, 525, 1.3], [860, 575, 1.45], [920, 615, 1.55], [990, 668, 1.55],
    [1055, 728, 1.45], [1125, 780, 1.45], [1200, 830, 1.5], [1275, 872, 1.5], [1350, 912, 1.5], [1430, 958, 1.45], [1500, 1000, 1.5], [1580, 1040, 1.5],
    [1700, 1110, 1.5], [1790, 1165, 1.6], [1860, 1215, 3.0], [1930, 1265, 3.8], [2010, 1320, 2.6], [2080, 1370, 1.6], [2200, 1460, 1.6], [2380, 1600, 1.6],
    [2580, 1760, 1.6], [2780, 1920, 1.6], [3000, 2100, 1.6]];
  const SPTS = SL.map((p) => [p[0], p[1]]), SHW = SL.map((p) => p[2]);
  const STREAM = ribbon(SPTS, SHW);
  // how far a point is outside the stream's banks (m; less than 0 in the water)
  const streamD = (x, y) => { let best = 1e9; for (let i = 1; i < SL.length; i++) { if (Math.abs(y - SL[i][1]) > 400 && Math.abs(y - SL[i - 1][1]) > 400) continue; const [d, t] = segM(x, y, SL[i - 1], SL[i]); best = Math.min(best, d - (SL[i - 1][2] + (SL[i][2] - SL[i - 1][2]) * t)); } return best; };
  // the water's level down the painting: the little falls in the painting, the big falls below it, falling on south
  const level = (y) => -1.25 - 0.2 * ss(110, 135, y) - 0.15 * ss(215, 240, y) - 0.25 * ss(725, 750, y) - 0.2 * ss(755, 780, y) - 0.25 * ss(950, 975, y)
    - 0.8 * ss(1150, 1190, y) - 0.45 * ss(1420, 1700, y) - 0.4 * ss(1750, 2100, y);
  // the stepping stones: over the stream in the north, and below the pool in the south-east (each from bank to bank)
  const FORDS = [{ a: [384, -450], b: [496, -450], n: 6 }, { a: [2110, 1300], b: [1990, 1430], n: 6 }];

  // ---- the road on past the painting, and the trails to the places to find: centre lines (px), half widths (m) ----
  const ROAD_W = { w: 1.75, pts: [[30, 593], [-200, 602], [-450, 578], [-700, 608], [-950, 590], [-1140, 590]] };
  const ROAD_N = { w: 1.75, pts: [[994, 10], [1000, -200], [962, -420], [990, -640], [1000, -862]] };
  const ROAD_ON = [[[-1140, 590], [-1350, 586], [-1560, 580]], [[1000, -862], [1006, -1050]]];   // and on past the ways out, into the fog
  const TRAILS = [
    ROAD_W, ROAD_N,
    { id: 'row', w: 0.65, pts: [[184, 244], [40, 220], [-160, 160], [-340, 40], [-470, -120], [-560, -300], [-600, -420]] },
    { id: 'north-ford', w: 0.6, pts: [[970, -330], [760, -380], [580, -440], [500, -450]] },
    { id: 'north-ford-west', w: 0.6, pts: [[380, -450], [220, -420], [40, -330], [-160, -240], [-400, -160], [-470, -120]] },
    { id: 'shieling', w: 0.65, pts: [[1334, 132], [1480, 110], [1700, 60], [1920, 10], [2120, -30], [2180, -40]] },
    { id: 'knoll', w: 0.6, pts: [[976, -480], [1200, -520], [1420, -560], [1560, -580]] },
    { id: 'falls', w: 0.65, pts: [[1300, 304], [1400, 440], [1530, 640], [1660, 860], [1770, 1040], [1860, 1120], [1980, 1160], [2070, 1230], [2140, 1290]] },
    { id: 'south', w: 0.65, pts: [[1960, 1460], [1800, 1470], [1500, 1500], [1100, 1530], [700, 1500], [300, 1450], [100, 1430], [-50, 1440]] },
    { id: 'copse', w: 0.65, pts: [[150, 628], [165, 720], [160, 840], [130, 1000], [60, 1180], [0, 1330], [-50, 1440], [-110, 1440]] },
  ];
  const trailDist = (x, y) => { let d = 1e9; for (const t of TRAILS) d = Math.min(d, lineDist(x, y, t.pts)); return d; };
  const ROADS_ALL = [ROAD_W.pts.concat(ROAD_ON[0].slice(1)), ROAD_N.pts.concat(ROAD_ON[1].slice(1)), [[0, 593], [300, 535], [640, 480]], [[850, 410], [940, 300], [994, 10]]];
  const roadDist = (x, y) => Math.min(...ROADS_ALL.map((r) => lineDist(x, y, r)));

  // ---- the bridge: the deck between its four corner pillars; the north parapet bows north in the middle as the
  // painting draws it (the walking map follows the bow), the south one runs straight ----
  const PIL = { nw: [640, 434], ne: [811, 372], se: [888, 452], sw: [697, 513] };
  const BR = { rise: 0.75, n: 24 };
  const lerp2 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  // the inner faces of the parapets at t (0 the west end, 1 the east), in px
  const brN = (t) => { const p = lerp2(PIL.nw, PIL.ne, t); return [p[0] + 9 * (1 - t), p[1] + 6 - 18 * Math.pow(Math.sin(Math.PI * t), 0.7)]; };
  const brS = (t) => { const p = lerp2(PIL.sw, PIL.se, t); return [p[0] + 2, p[1] - 9]; };
  const DECK = (() => { const N = [], S = []; for (let i = 0; i <= BR.n; i++) { N.push(brN(i / BR.n)); S.push(brS(i / BR.n)); } return N.concat(S.reverse()).map((p) => p.map(Math.round)); })();
  const inPoly = (poly, x, y) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
  // where along the bridge a point is (0 to 1), from the west end's middle to the east end's
  const BW = lerp2(PIL.nw, PIL.sw, 0.5), BE = lerp2(PIL.ne, PIL.se, 0.5);
  const brT = (x, y) => { const dx = (BE[0] - BW[0]) * SX, dz = (BE[1] - BW[1]) * SZ; return clamp(((x - BW[0]) * SX * dx + (y - BW[1]) * SZ * dz) / (dx * dx + dz * dz), 0, 1); };
  const deckH = (t) => BR.rise * Math.sin(Math.PI * t);

  // ---- the nodes, the ring's stones, and the places to find ----
  const NODES = [{ at: [240, 222], w: 1.7, d: 0.85, h: 3.2, eye: 2.35, seed: 1 }, { at: [585, 452], w: 1.45, d: 0.8, h: 2.3, eye: 1.7, seed: 2 }, { at: [1354, 168], w: 1.25, d: 0.75, h: 2.1, eye: 1.55, seed: 3 }];
  const RING = [[160, 208, 0.8, 2.0], [100, 256, 0.75, 1.9], [155, 286, 1.0, 2.6], [211, 298, 0.7, 1.2], [318, 210, 0.75, 2.2], [322, 288, 0.8, 2.3], [392, 268, 0.75, 2.4],
    [84, 200, 0.5, 0.8], [362, 228, 0.5, 0.9], [270, 186, 0.45, 0.7]];
  const ROW = { a: [-470, -150], b: [-640, -470], n: 7 };          // the old row of standing stones
  const SHIELING = { c: [2200, -40], w: 4.4, d: 3.4 };            // the ruined shieling
  const KNOLL = { c: [1600, -600] };                             // the lone birch on its knoll
  const FALLS = { at: [1820, 1170], pool: [1930, 1265] };         // the falls and the pool below
  const COPSE = { c: [-300, 1440], r: 9.5, gap: 0.4 };            // the dark copse, its way in on the east
  const MILE = { at: [-480, 545] };                              // the milestone on the west road
  const HOLLOW = { c: [520, 268] };                              // behind the big boulder, north of the road

  // ---- the ground ----
  const roll = (x, y, t) => (W3D().vnoise(x / 420 + 2.3, y / 420 + 5.1) - 0.5) * 4.2 + t * (W3D().vnoise(x / 140 + 9.7, y / 140) - 0.5) * 1.2;
  function ground(x, y) {
    const sd = streamD(x, y), lv = level(y), W = 1.6 + 1.1 * (-lv);
    let h = (lv + 0.3) * (1 - ss(-0.3, W, sd));                                     // the stream's valley
    h += 1.05 * (1 - ss(0.25, 1, Math.hypot((x - 1345) / 175, (y - 160) / 120)));   // the east node's rise
    // rolling moor past the painting: none on it or by the stream, gentler along the trails, the road nearly level
    const out = Math.hypot(Math.max(0, -x, x - 1536), Math.max(0, -y, y - 1024)), k = ss(0, 300, out) * ss(3, 14, sd), rd = roadDist(x, y);
    if (k > 0) h += k * (0.3 + 0.7 * ss(40, 240, rd)) * roll(x, y, ss(30, 100, trailDist(x, y)));
    h += 2.6 * (1 - ss(0.2, 1, Math.hypot((x - KNOLL.c[0]) / 330, (y - KNOLL.c[1]) / 260)));   // the knoll
    if (rd < 70) h = Math.max(h, -0.05 - 3 * ss(15, 70, rd));                           // (the road on its low bank by the stream)
    if (x > 560 && x < 980 && y > 300 && y < 600) {                                       // and level where it meets the bridge's ends
      const e = Math.min(segM(x, y, brN(0), brS(0))[0], segM(x, y, brN(1), brS(1))[0]);
      if (e < 2.4) h = Math.max(h, -0.04 - 1.4 * ss(0.5, 2.4, e));
    }
    return h;
  }

  // the walking map's own walk areas (for keeping things off them), with their boxes
  let WB = null;
  const mapWalk = () => WB || (WB = (((G.MAPS || {})[ID] || { walk: [] }).walk).map((p) => { let a = 1e9, b = 1e9, c = -1e9, e = -1e9; for (const [x, y] of p) { a = Math.min(a, x); b = Math.min(b, y); c = Math.max(c, x); e = Math.max(e, y); } return { p, b: [a, b, c, e] }; }));

  // the painting's boulders: [x, y (their foot), size (m)]
  const BOULDERS = [
    [60, 362, 1.5], [112, 410, 1.1], [26, 404, 0.9], [176, 76, 1.3], [40, 120, 0.9], [300, 40, 1.0],
    [482, 206, 1.6], [580, 336, 1.7], [432, 390, 0.8], [520, 96, 1.0], [430, 120, 0.8],
    [722, 58, 1.5], [662, 110, 0.9], [704, 274, 1.1], [760, 160, 0.9], [860, 120, 0.9], [880, 250, 0.8],
    [1062, 440, 2.0], [1150, 470, 0.9], [1202, 34, 1.1], [1372, 34, 1.2], [1090, 60, 0.9], [1440, 60, 0.8],
    [1404, 222, 1.1], [1470, 300, 0.9], [1382, 646, 1.9], [1452, 532, 1.3], [1520, 600, 0.9],
    [812, 626, 1.7], [852, 732, 1.2], [842, 846, 1.4], [760, 910, 0.9], [1132, 950, 1.5], [1302, 820, 1.0], [1198, 700, 0.9], [1100, 640, 0.9],
    [1000, 560, 0.9], [960, 760, 0.9], [1040, 860, 1.0], [1240, 990, 1.1], [1420, 830, 0.9],
    [240, 800, 1.2], [60, 870, 0.9], [40, 930, 1.1], [320, 700, 0.8], [520, 760, 0.8], [600, 880, 0.9], [430, 1000, 0.8],
  ];
  const BIRCHES = [[40, 34, 0.9, 1], [116, 802, 1.15, 2], [1268, 584, 1.1, 2], [1462, 398, 1.0, 1], [1478, 192, 1.1, 2], [926, 852, 1.0, 1], [1500, 690, 0.9, 1]];

  P[ID] = {
    id: ID, name: 'The Ember Line road', painting: "art/walk/walk-ember-line-road.avif", size: [1536, 1024],
    mapId: ID, paintingPng: 'reference/art/walk/wilds/walk-ember-line-road.png',
    // the open moor: one painting each way round the painting; where Io may roam inside it (the heath closes it in)
    extent: [-1536, -1024, 3072, 2048],
    open: { bounds: [[-1140, 560], [-1180, 300], [-1120, -100], [-1190, -500], [-1000, -820], [-500, -860], [0, -800], [500, -870], [962, -862], [1040, -862],
      [1500, -840], [2000, -880], [2500, -780], [2780, -500], [2730, -50], [2800, 400], [2760, 900], [2820, 1350], [2700, 1800], [2200, 1850], [1700, 1780],
      [1200, 1840], [700, 1780], [200, 1830], [-300, 1800], [-800, 1840], [-1150, 1650], [-1100, 1200], [-1180, 900], [-1140, 620]] },
    // the wall check (tools/walls-test.mjs): from the road by the bridge's node, to the start, each node, over the bridge,
    // the side paths' ends, both ways out, every place to find and both pockets
    checks: { from: [560, 520], goals: [
      ['the start, at the west edge', 50, 592], ['the ring’s node (west side path’s end)', 240, 250], ['the node by the road', 585, 486], ['over the bridge (east end)', 840, 420],
      ['the east side path, by the flat rock', 1080, 222], ['the rise’s node (east)', 1316, 150], ['the bay below the rise', 1260, 270], ['the road’s top edge', 994, 12],
      ['the way on to the Warm Roads camp (west)', -1130, 590], ['the way on to the forest road to Dawnroost (north)', 1000, -852],
      ['the old row of standing stones (north-west)', -600, -420], ['over the stepping stones in the north', 440, -450], ['the ruined shieling (east)', 2200, -40],
      ['the birch on its knoll (north-east)', 1560, -580], ['the falls (south-east)', 1850, 1150], ['over the stepping stones below the pool', 1990, 1440],
      ['the dark copse’s clearing (pocket)', -300, 1440], ['the milestone (west road)', -480, 575], ['the hollow behind the boulder (pocket)', 545, 290]] },
    // the trees: none from the painting (its birches are built by hand in extra); past it, clumps of birch and a few dark
    // firs, the dark copse's firs in its ring (extra adds them). None at the places to find.
    treeGen: { dark: 9, step: 84, fir: 0, firSouth: 0,
      out: { density: 0.6, clump: 600, clear: 0.47, kinds: [0.74, 0.26, 0], size: [0.72, 1.02] },
      roads: [],
      keepOut: [[-40, -40, 1580, 1070], [-760, -560, -380, -60], [2000, -200, 2400, 120], [1400, -760, 1780, -420], [1700, 1050, 2200, 1500], [-620, 1180, 20, 1700], [-640, 450, -340, 650]] },
    // the ground: earth on the side paths and the trails, worn grass round them and in the ring, heather moor everywhere
    // else, the Warm Road's flagstones laid as paving
    ground: { cob: 'shared_dirt_track', dirt: 'shared_grass_meadow', grass: 'wilds_heath_ground', pave: 'shared_warm_road', rep: [1.9, 3.2, 3.4, 3.4], grassTint: [1.0, 0.96, 1.02], dirtTint: [0.74, 0.76, 0.62] },
    surfaces: { stone: 'ember_bridge_stone', dry: 'shared_drystone', timber: 'ember_bridge_stone', planks: 'shared_boardwalk_planks', roof: 'shared_grass_meadow',
      wood: 'shared_bark_oak', deck: 'shared_boardwalk_planks', pave: 'shared_warm_road', cloth: 'shared_grass_meadow', soil: 'shared_dirt_track', rock: 'wilds_boulder_stone',
      leaves: 'wilds_birch_leaves', firs: 'wilds_fir_boughs', bark: 'shared_bark_birch' },
    tints: { leaves: 0xd8e8cc, firs: 0xa8bcb0, bush: 0xdce8d0, wood: 0xb89a88 },
    // the moor's fog: the camp's warm violet, as heavy as the Thornwood's
    night: { fog: [0.19, 0.16, 0.3], fogNear: 10, fogFar: 42, far: 90, hills: false, sky: [0.62, 0.58, 0.68], moon: [0.42, 0.42, 0.56] },
    textures: [
      { id: 'shared_warm_road', made: "./../texture-packs/made/shared_warm_road.png", stand: "./../texture-packs/wilds-south/warm-roads-camp/stand-in/shared_warm_road.png" },
      { id: 'shared_grass_meadow', made: "./../texture-packs/made/shared_grass_meadow.png", stand: "./../texture-packs/wilds-south/warm-roads-camp/stand-in/shared_grass_meadow.png" },
      { id: 'wilds_heath_ground', made: "./../texture-packs/made/wilds_heath_ground.png", stand: "./../texture-packs/wilds-south/ember-line-road/stand-in/wilds_heath_ground.png" },
      { id: 'shared_dirt_track', made: "./../texture-packs/made/shared_dirt_track.png", stand: "./../texture-packs/wilds-south/eldergrove-edge/stand-in/shared_dirt_track.png" },
      { id: 'ember_bridge_stone', made: "./../texture-packs/made/ember_bridge_stone.png", stand: "./../texture-packs/wilds-south/ember-line-road/stand-in/ember_bridge_stone.png" },
      { id: 'shared_bark_birch', made: "./../texture-packs/made/shared_bark_birch.png", stand: "./../texture-packs/wilds-south/warm-roads-camp/stand-in/shared_bark_birch.png" },
      { id: 'wilds_birch_leaves', made: "./../texture-packs/made/wilds_birch_leaves.png", stand: "./../texture-packs/wilds-south/ember-line-road/stand-in/wilds_birch_leaves.png" },
      { id: 'wilds_boulder_stone', made: "./../texture-packs/made/wilds_boulder_stone.png", stand: "./../texture-packs/wilds-south/ember-line-road/stand-in/wilds_boulder_stone.png" },
      { id: 'shared_drystone', made: "./../texture-packs/made/shared_drystone.png", stand: "./../texture-packs/wilds-south/ember-line-road/stand-in/shared_drystone.png" },
      { id: 'shared_water_river', made: "./../texture-packs/made/shared_water_river.png", stand: "./../texture-packs/wilds-south/ember-line-road/stand-in/shared_water_river.png" },
      { id: 'shared_boardwalk_planks', made: "./../texture-packs/made/shared_boardwalk_planks.png", stand: "./../texture-packs/wickhollow/jetty/stand-in/shared_boardwalk_planks.png" },
      { id: 'shared_bark_oak', made: "./../texture-packs/made/shared_bark_oak.png", stand: "./../texture-packs/wilds-south/dawnroost-road/stand-in/shared_bark_oak.png" },
      { id: 'wilds_fir_boughs', made: "./../texture-packs/made/wilds_fir_boughs.png", stand: "./../texture-packs/wilds-south/dawnroost-road/stand-in/wilds_fir_boughs.png" },
    ],
    ground_h: ground,
    // where Io's feet stand: the ground (the engine stands her on it as it shapes it), the bridge's humped deck, the
    // stepping stones' tops
    walk_h(x, y) {
      if (x > 620 && x < 905 && y > 355 && y < 525 && inPoly(DECK, x, y)) return Math.max(ground(x, y), deckH(brT(x, y)) + 0.02);
      for (const f of FORDS) { const [d, t] = segM(x, y, f.a, f.b); if (d < 0.75 && t > 0.001 && t < 0.999) return Math.max(ground(x, y), level(y) + 0.25); }
      return ground(x, y);
    },
    water: [{ poly: STREAM, level, tex: 'shared_water_river', rep: 4, flow: [0.02, 0.04], bed: -6.0 }],
    lawns: [],
    // no rocks along the banks at the bridge, the stepping stones, the falls and pool (laid by hand), or where the stream
    // runs out of the open ground
    noRocks: [[600, 300, 960, 600], [330, -520, 560, -380], [1700, 1080, 2160, 1480], [200, -1200, 600, -880], [2400, 1700, 3100, 2200]],
    start: [50, 592], startFace: Math.PI / 2, startYaw: -Math.PI / 2,
    // the ways on, where the roads reach the open ground's edge
    exits: [
      { rect: [-1150, 552, -1130, 628], label: 'The Warm Roads camp' },
      { rect: [960, -872, 1040, -852], label: 'The forest road to Dawnroost' },
    ],
    // the trails (earth down the middle, worn grass along the edges; the roads' middles are paved, below), the bridge's
    // deck between its parapets, the stepping stones, the pockets
    walkAdd: TRAILS.map((t) => ({ poly: ribbon(t.pts, t.w + 0.6), ground: 'dirt' })).concat(TRAILS.slice(2).map((t) => ({ poly: ribbon(t.pts, t.w), ground: 'cob' })))
      .concat([{ poly: DECK, ground: 'grass' }])
      .concat(FORDS.map((f) => ({ poly: ribbon([f.a, f.b], 0.7), ground: 'grass' })))
      .concat([{ poly: circleM(HOLLOW.c, 1.6, 14), ground: 'grass' }, { poly: circleM(COPSE.c, COPSE.r - 2.2, 18), ground: 'grass' }]),
    // the Warm Road's flagstones on the painting's road (its two walk areas and the bridge's deck) and on along it past
    // the painting, and worn grass in the ring of standing stones
    groundPatches: [
      { poly: ((G.MAPS || {})[ID] || { walk: [[]] }).walk[0], kind: 'pave' },
      { poly: ((G.MAPS || {})[ID] || { walk: [[], [], []] }).walk[2], kind: 'pave' },
      { poly: ribbon(ROAD_W.pts.concat(ROAD_ON[0].slice(1)), ROAD_W.w), kind: 'pave' },
      { poly: ribbon(ROAD_N.pts.concat(ROAD_ON[1].slice(1)), ROAD_N.w), kind: 'pave' },
      { poly: ellipse([240, 262], 165, 70, 22, 0.08), kind: 'dirt' },
    ],
    items: {},
    buildings: [],
    // the low dry-stone walls (built in extra, H their height, with capstones, end pillars and their old wooden posts; h: 0
    // keeps the engine from building them and lets check-layout check them)
    walls: [
      { pts: [[-160, 448], [0, 445], [120, 442], [238, 446]], h: 0, H: 0.85, t: 0.5, tex: 'dry', ends: [1, 0] },      // west, north of the road
      { pts: [[396, 452], [420, 384], [480, 344], [532, 338]], h: 0, H: 0.85, t: 0.5, tex: 'dry' },                   // west of the stream, north of the road
      { pts: [[355, 632], [450, 626], [546, 622]], h: 0, H: 0.85, t: 0.5, tex: 'dry', ends: [1, 0] },                 // south of the road
      { pts: [[564, 642], [620, 668], [682, 702]], h: 0, H: 0.85, t: 0.5, tex: 'dry', ends: [0, 0] },
      { pts: [[700, 726], [748, 760]], h: 0, H: 0.8, t: 0.5, tex: 'dry', ends: [0, 1] },
      { pts: [[352, 966], [450, 946], [560, 936], [672, 926]], h: 0, H: 0.85, t: 0.5, tex: 'dry', ends: [1, 0] },     // the painting's foot
      { pts: [[690, 930], [790, 942]], h: 0, H: 0.8, t: 0.5, tex: 'dry', ends: [0, 1] },
      { pts: [[932, 480], [1000, 520], [1100, 548], [1230, 590]], h: 0, H: 0.85, t: 0.5, tex: 'dry' },              // east of the bridge
      { pts: [[1066, 286], [1150, 280], [1198, 264]], h: 0, H: 0.9, t: 0.55, tex: 'dry', ends: [0, 1] },             // below the east side path
      { pts: [[1250, 318], [1272, 323]], h: 0, H: 0.9, t: 0.55, tex: 'dry', ends: [0, 1] },                           // the lower wall, a gap
      { pts: [[1388, 357], [1450, 384]], h: 0, H: 0.9, t: 0.55, tex: 'dry' },                                          // where the trail goes down
      { pts: [[806, 104], [810, 180], [815, 254]], h: 0, H: 0.85, t: 0.5, tex: 'dry' },                              // east of the stream, north
      { pts: [[1142, 18], [1150, 94]], h: 0, H: 0.85, t: 0.5, tex: 'dry' },
      { pts: [[1436, 732], [1536, 738], [1546, 738]], h: 0, H: 0.85, t: 0.5, tex: 'dry', ends: [0, 1] },             // (a gap where the trail goes on)
      { pts: [[1644, 744], [1720, 748]], h: 0, H: 0.85, t: 0.5, tex: 'dry', ends: [1, 1] },
    ],
    // the old wooden posts standing in the walls: [x, y, height (m)]
    posts: [[250, 444, 1.3], [555, 626, 1.4], [692, 714, 1.3], [681, 920, 1.3], [1060, 288, 1.3], [1430, 732, 1.3], [1240, 316, 1.2]],
    steps: [],
    lamps: [],
    props: [],
    flowers: [],
    // the lights for the light map: [x, y, radius px, strength, colour]. The road's and the nodes' are added in extra;
    // these are the moonlight lying in the clearings and on the water.
    lights: [
      [240, 255, 200, 0.35, 'moon'], [600, 180, 180, 0.45, 'moon'], [940, 640, 180, 0.42, 'moon'], [1300, 880, 200, 0.45, 'moon'], [1300, 210, 150, 0.25, 'moon'],
      [1930, 1265, 230, 0.55, 'moon'], [-560, -300, 220, 0.4, 'moon'], [2200, -40, 160, 0.35, 'moon'], [1600, -600, 200, 0.4, 'moon'], [-300, 1440, 180, 0.3, 'moon'],
      [440, -450, 160, 0.42, 'moon'],
    ],
    trees: ID,
    extraTrees: [],

    // ---- what the engine has no field for: the bridge, the nodes and the ring's standing stones, the walls, boulders,
    // birches, gorse and heather, the falls, the places to find and the pockets ----
    extra(K) {
      const { B, X, Z } = K, W = G.W3D, TAU = Math.PI * 2, TH = K.terrain, PL = P[ID];
      const V3 = (x, y, z) => new THREE.Vector3(x, y, z), QY = (a) => new THREE.Quaternion().setFromEuler(new THREE.Euler(0, a, 0));
      const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
      const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
      const norm = (a) => { const L = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / L, a[1] / L, a[2] / L]; };
      const Q = (k, a, b, c, d, want, uv, col) => { const n = cross(sub(b, a), sub(d, a)); if (dot(n, want) < 0) B.quad(k, b, a, d, c, uv, col); else B.quad(k, a, b, c, d, uv, col); };
      const walkDist = (x, y) => { let d = 1e9; for (const q of mapWalk()) { if (W.inPoly(q.p, x, y)) return 0; if (x > q.b[0] - d && x < q.b[2] + d && y > q.b[1] - d && y < q.b[3] + d) d = Math.min(d, W.edgeDist(q.p, x, y)); } return d; };
      const pathDist = (x, y) => Math.min(walkDist(x, y), trailDist(x, y) - 30);
      const inBounds = (x, y) => W.inPoly(PL.open.bounds, x, y);
      const inPaint = (x, y, m) => x > -m && x < 1536 + m && y > -m && y < 1024 + m;
      const lumpLow = (seed, sy) => { const g = new THREE.IcosahedronGeometry(1, 0), p = g.attributes.position, r = W.rand(seed), seen = {}; for (let i = 0; i < p.count; i++) { const key = p.getX(i).toFixed(3) + ',' + p.getY(i).toFixed(3) + ',' + p.getZ(i).toFixed(3), k = seen[key] || (seen[key] = 0.8 + r() * 0.35); p.setXYZ(i, p.getX(i) * k, p.getY(i) * k * (sy || 1), p.getZ(i) * k); } g.computeVertexNormals(); return g; };
      const ROCK_LOW = [lumpLow(501, 0.7), lumpLow(502, 0.7), lumpLow(503, 0.7)], BUSH_LOW = [lumpLow(601), lumpLow(602), lumpLow(603)];
      const rock = (px, py, sz, o) => {
        o = o || {};
        const pick = Math.floor(Math.abs(Math.sin(px * 12.9 + py * 7.3)) * 3) % 3, g = o.low ? ROCK_LOW[pick] : K.rockG[pick];
        const y = (o.y != null ? o.y : TH(px, py)) - sz * (o.sink != null ? o.sink : 0.22);
        B.geom('rock', g, new THREE.Matrix4().compose(V3(X(px), y, Z(py)), QY((px * 0.37 + py * 0.11) % TAU), V3(sz * (o.sx || 1), sz * (o.sy || 1.32), sz * (o.sz || 1))), o.col || [0.88, 0.88, 0.94], 1.2);
        if (sz > 0.9 && o.shade !== false) K.shadeMarks.push(['dot', px, py, sz * 0.85 / SX, 0.72]);
      };
      function seg(k, A, Bp, ra, rb, n, col) {
        const d = sub(Bp, A), L = Math.hypot(d[0], d[1], d[2]), dir = mul(d, 1 / L);
        const u = norm(cross(Math.abs(dir[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0], dir)), v = cross(dir, u);
        const ring = (c, r, t) => add(c, add(mul(u, Math.cos(t) * r), mul(v, Math.sin(t) * r)));
        for (let i = 0; i < n; i++) { const t0 = i / n * TAU, t1 = (i + 1) / n * TAU; B.quad(k, ring(A, ra, t0), ring(A, ra, t1), ring(Bp, rb, t1), ring(Bp, rb, t0), [t0 * ra * 1.5, A[1], t1 * ra * 1.5, Bp[1]], col); }
      }
      const card = (k, x, y, z, s, t, col) => { for (const a of [t, t + Math.PI / 2]) B.quad(k, [x - Math.cos(a) * s, y - s * 0.55, z - Math.sin(a) * s], [x + Math.cos(a) * s, y - s * 0.55, z + Math.sin(a) * s], [x + Math.cos(a) * s, y + s, z + Math.sin(a) * s], [x - Math.cos(a) * s, y + s, z - Math.sin(a) * s], [0, 0, 1, 1], col); };
      const BUSHC = { gorse: [0.72, 0.84, 0.55], heather: [0.82, 0.58, 0.86], green: [0.66, 0.78, 0.64], dark: [0.42, 0.48, 0.5] };
      const FLC = { gorse: ['fl_white', [1.7, 0.95, 0.22]], heather: ['fl_violet', [1.35, 0.8, 1.4]], green: ['fl_white', [1.05, 1.05, 1.1]], dark: ['fl_violet', [0.9, 0.7, 1.1]] };
      const bush = (px, py, rr, kind, r, low) => {
        const x = X(px), z = Z(py), y = TH(px, py), h = rr * (0.6 + r() * 0.3), g = low ? BUSH_LOW[Math.floor(r() * 3)] : K.ico[Math.floor(r() * 3)];
        B.geom('leafBush', g, new THREE.Matrix4().compose(V3(x, y + h * 0.32, z), QY(r() * TAU), V3(rr, h, rr)), BUSHC[kind], 2.0);
        const n = low ? 1 : Math.max(3, Math.round(rr * 5)), [fk, fc] = FLC[kind];
        for (let i = 0; i < n; i++) { const a = r() * TAU, d = r() * rr * 0.7; card(fk, x + Math.cos(a) * d, y + h * (0.75 + r() * 0.45), z + Math.sin(a) * d, 0.3 + r() * 0.14, r() * Math.PI, fc); }
        if (rr > 0.7) K.shadeMarks.push(['dot', px, py, rr / SX, 0.78]);
      };
      const tuft = (px, py, n, hh, col, yy) => {
        const r = W.rand(Math.abs(px * 7 + py * 3) + 1), x = X(px), z = Z(py), y = yy != null ? yy : TH(px, py);
        for (let i = 0; i < n; i++) { const a = r() * TAU, lean = 0.12 + r() * 0.3, h = hh * (0.7 + r() * 0.5), w = 0.04 + r() * 0.03, bx = x + (r() - 0.5) * 0.5, bz = z + (r() - 0.5) * 0.4, ox = Math.cos(a), oz = Math.sin(a);
          B.tri('cloth', [bx - oz * w, y, bz + ox * w], [bx + oz * w, y, bz - ox * w], [bx + ox * lean, y + h, bz + oz * lean], [[0, 0], [0.1, 0], [0.05, 1]], col || [0.75, 0.85, 0.5]); }
      };
      const leaves = (px, py, y, n, spread, seed) => { const r = W.rand(seed); for (let i = 0; i < n; i++) { const x = X(px) + (r() - 0.5) * spread, z = Z(py) + (r() - 0.5) * spread * 0.8, rr = 0.18 + r() * 0.16; for (let j = 0; j < 7; j++) { const a0 = j / 7 * TAU, a1 = (j + 1) / 7 * TAU; B.tri('cloth', [x, y, z], [x + Math.cos(a1) * rr, y, z + Math.sin(a1) * rr], [x + Math.cos(a0) * rr, y, z + Math.sin(a0) * rr], [[0, 0], [1, 0], [0, 1]], [0.55, 0.85, 0.6]); } } };
      const birch = (px, py, s, nT, seed, lean) => {
        const r = W.rand(seed * 7919 + 17), x = X(px), z = Z(py), y0 = TH(px, py) - 0.15, col = [0.95, 0.95, 1.0];
        for (let t = 0; t < nT; t++) {
          const a = (t / nT) * TAU + r() * 1.2, sp = nT > 1 ? 0.18 + r() * 0.14 : 0.06, H = (4.6 + r() * 2.0) * s * (t ? 0.82 : 1);
          const base = [x + Math.cos(a) * 0.12 * (nT > 1 ? 1 : 0), y0, z + Math.sin(a) * 0.12 * (nT > 1 ? 1 : 0)];
          const dir = norm([Math.cos(a) * sp + (lean ? lean[0] : 0), 1, Math.sin(a) * sp + (lean ? lean[1] : 0)]);
          let p = base, rad = 0.13 * s; const pts = [];
          for (let i = 0; i < 3; i++) { const d2 = norm(add(dir, [(r() - 0.5) * 0.14, 0, (r() - 0.5) * 0.14])), np = add(p, mul(d2, H / 3)), nr = rad * 0.72; seg('bark', p, np, rad, nr, 6, col); pts.push(np); p = np; rad = nr; }
          for (let i = 0; i < 4; i++) {
            const from = add(pts[0], mul(sub(pts[2], pts[0]), 0.35 + r() * 0.6)), ba = r() * TAU, bd = norm([Math.cos(ba), 0.55 + r() * 0.5, Math.sin(ba)]), L = (0.9 + r() * 0.8) * s, to = add(from, mul(bd, L));
            seg('bark', from, to, 0.04 * s, 0.015, 4, [0.85, 0.85, 0.9]);
            const cr = (0.75 + r() * 0.45) * s;
            B.geom('leafBush', K.ico[Math.floor(r() * 3)], new THREE.Matrix4().compose(V3(to[0], to[1] + cr * 0.15, to[2]), QY(r() * TAU), V3(cr, cr * 0.72, cr)), [0.5, 0.6, 0.45], 2.0);
          }
          const top = pts[2], cr = (0.85 + r() * 0.4) * s;
          B.geom('leafBush', K.ico[Math.floor(r() * 3)], new THREE.Matrix4().compose(V3(top[0], top[1] - cr * 0.2, top[2]), QY(r() * TAU), V3(cr, cr * 0.8, cr)), [0.52, 0.62, 0.46], 2.0);
        }
        K.addBlock(K.circlePx(px, py, 0.22 * s + (nT > 1 ? 0.12 : 0), 8));
        K.shadeMarks.push(['dot', px, py, 1.6 * s / SX, 0.66]);
      };
      const post = (px, py, h, rr, col) => { const yy = TH(px, py); B.cyl('wood', X(px), yy - 0.3, Z(py), rr, rr * 0.88, h + 0.3, 7, col || [0.75, 0.62, 0.55], [1.2, h]); return yy; };
      // a standing stone: a deformed box, narrowing upward, its shoulders rounded; an eye (a node) on its south face
      function standingStone(sx, sy, w, d, h, ry, seed, col, eye) {
        const base = TH(sx, sy) - 0.3, g = new THREE.BoxGeometry(1, 1, 1, 3, 9, 2), p = g.attributes.position;
        const hh = (a, b, c) => { const s = Math.sin(a * 127.1 + b * 311.7 + c * 74.7 + seed) * 43758.5453; return s - Math.floor(s); };
        for (let i = 0; i < p.count; i++) {
          const x = p.getX(i), y = p.getY(i), z = p.getZ(i), t = y + 0.5, wk = 1 - 0.2 * t; let yy = t;
          if (t > 0.78) yy -= (x * x) * 0.6 * ss(0.78, 1, t);
          const n = (hh(x, y, z) - 0.5) * 0.07;
          p.setXYZ(i, x * wk * w + n, yy * h + n, z * d * (1 - 0.15 * t) + n * 0.5);
        }
        g.computeVertexNormals();
        B.geom('rock', g, new THREE.Matrix4().compose(V3(X(sx), base, Z(sy)), QY(ry), V3(1, 1, 1)), col || [1.0, 1.0, 1.06], [w, h]);
        g.dispose();
        if (eye) {
          // the eye: a pale glassy disc in a ring of darker stone, near the top of the south face, a faint silver gleam
          const et = eye / h, cy = base + 0.3 + eye, cz = Z(sy) + d * (1 - 0.15 * et) / 2 + 0.03, cx = X(sx), R = Math.min(0.19, w * 0.12), NC = 16;
          const pt = (a, r, dz) => [cx + Math.cos(a) * r, cy + Math.sin(a) * r, cz + (dz || 0)];
          for (let i = 0; i < NC; i++) { const a0 = i / NC * TAU, a1 = (i + 1) / NC * TAU;
            Q('rock', pt(a0, R * 1.4, 0.01), pt(a1, R * 1.4, 0.01), pt(a1, R, 0.03), pt(a0, R, 0.03), [0, 0, 1], [0, 0, 0.3, 0.1], [0.5, 0.48, 0.55]);
            B.tri('glass', pt(0, 0, 0.045), pt(a0, R, 0.03), pt(a1, R, 0.03), [[0, 0], [1, 0], [0, 1]], [0.3, 0.34, 0.45]); }
          for (let i = 0; i < 8; i++) { const a0 = i / 8 * TAU, a1 = (i + 1) / 8 * TAU, gx = -R * 0.35, gy = R * 0.35, gr = R * 0.18; B.tri('glass', [cx + gx, cy + gy, cz + 0.05], [cx + gx + Math.cos(a0) * gr, cy + gy + Math.sin(a0) * gr, cz + 0.05], [cx + gx + Math.cos(a1) * gr, cy + gy + Math.sin(a1) * gr, cz + 0.05], [[0, 0], [1, 0], [0, 1]], [0.8, 0.85, 1.0]); }
          K.halo(cx, cy, cz + 0.12, 0.9, [0.1, 0.12, 0.2]);
          K.light(sx, sy + 16, 70, 0.4, 'moon');
        }
        K.shadeMarks.push(['dot', sx, sy + 4, w * 0.9 / SX, 0.7]);
        return base;
      }

      // ================= the bridge: the humped deck, its parapets, the arch, the four pillars =================
      {
        const N = BR.n, PH = 0.85, PT = 0.36, UP = [0, 1, 0], SC = [1.55, 1.52, 1.62], ST = [1.4, 1.38, 1.46];
        const P3 = (p, y) => [X(p[0]), y, Z(p[1])];
        // the arch: from t 0.2 to 0.84 along the bridge, round over the stream; below it the stone goes down into the
        // banks (the abutments) to the valley's floor
        const ARCH = [0.14, 0.78], archY = (t) => { const u = (t - (ARCH[0] + ARCH[1]) / 2) / ((ARCH[1] - ARCH[0]) / 2); return Math.abs(u) >= 1 ? null : -2.4 + 2.35 * Math.sqrt(1 - u * u); };
        const bot = (t, p) => { const a = archY(t); return a == null ? Math.min(TH(p[0], p[1]), 0) - 0.6 : a; };
        // the outside of each parapet: 0.36 m out from its inner face, square to the bridge
        const out = (p, q, side) => { const dx = (q[0] - p[0]) * SX, dz = (q[1] - p[1]) * SZ, L = Math.hypot(dx, dz) || 1, nx = -dz / L * side, nz = dx / L * side; return [p[0] + nx * PT / SX, p[1] + nz * PT / SZ]; };
        for (let i = 0; i < N; i++) {
          const t0 = i / N, t1 = (i + 1) / N, d0 = deckH(t0) + 0.02, d1 = deckH(t1) + 0.02;
          const n0 = brN(t0), n1 = brN(t1), s0 = brS(t0), s1 = brS(t1);
          const no0 = out(n0, n1, -1), no1 = out(n1, brN(Math.min(1, t1 + 1 / N)), -1), so0 = out(s0, s1, 1), so1 = out(s1, brS(Math.min(1, t1 + 1 / N)), 1);
          // the deck: the Warm Road's flagstones go on over it
          Q('pave', P3(s0, d0), P3(s1, d1), P3(n1, d1), P3(n0, d0), UP, [t0 * 7.8, 0, t1 * 7.8, 4.0]);
          // the north parapet: inner face, top, outer face down to the arch (or the bank)
          Q('stone', P3(n0, d0), P3(n1, d1), P3(n1, d1 + PH), P3(n0, d0 + PH), [0, 0, 1], [t0 * 7.8, d0, t1 * 7.8, d0 + PH], SC);
          Q('stone', P3(n0, d0 + PH), P3(n1, d1 + PH), P3(no1, d1 + PH), P3(no0, d0 + PH), UP, [t0 * 7.8, 0, t1 * 7.8, 0.4], ST);
          Q('stone', P3(no0, bot(t0, no0)), P3(no1, bot(t1, no1)), P3(no1, d1 + PH), P3(no0, d0 + PH), [0, 0, -1], [t0 * 7.8, bot(t0, no0), t1 * 7.8, d0 + PH], SC);
          // the south parapet
          Q('stone', P3(s0, d0), P3(s1, d1), P3(s1, d1 + PH), P3(s0, d0 + PH), [0, 0, -1], [t0 * 7.8, d0, t1 * 7.8, d0 + PH], SC);
          Q('stone', P3(s0, d0 + PH), P3(s1, d1 + PH), P3(so1, d1 + PH), P3(so0, d0 + PH), UP, [t0 * 7.8, 0, t1 * 7.8, 0.4], ST);
          Q('stone', P3(so0, bot(t0, so0)), P3(so1, bot(t1, so1)), P3(so1, d1 + PH), P3(so0, d0 + PH), [0, 0, 1], [t0 * 7.8, bot(t0, so0), t1 * 7.8, d0 + PH], SC);
          // the arch's underside, between the two faces
          if (archY(t0) != null && archY(t1) != null) Q('stone', P3(no0, archY(t0)), P3(no1, archY(t1)), P3(so1, archY(t1)), P3(so0, archY(t0)), [0, -1, 0], [t0 * 7.8, 0, t1 * 7.8, 4], [0.9, 0.9, 0.98]);
        }
        // the arch's ring of stones, a hand proud of each face
        for (const side of [-1, 1]) {
          const NV = 15, f = side < 0 ? (t) => out(brN(t), brN(Math.min(1, t + 0.02)), -1) : (t) => out(brS(t), brS(Math.min(1, t + 0.02)), 1);
          for (let k = 0; k < NV; k++) {
            const ta = Math.PI * k / NV, tb = Math.PI * (k + 1) / NV, mid = (ARCH[0] + ARCH[1]) / 2, half = (ARCH[1] - ARCH[0]) / 2;
            const pt = (a, o) => { const t = mid - Math.cos(a) * half * (1 + o * 0.07), p = f(clamp(t, 0, 1)); return [X(p[0]), -2.4 + (2.35 + o * 0.45) * Math.sin(a), Z(p[1]) + side * 0.05]; };
            Q('stone', pt(ta, 0), pt(tb, 0), pt(tb, 1), pt(ta, 1), [0, 0, side], [k * 0.6, 0, k * 0.6 + 0.6, 0.5], k % 2 ? [1.3, 1.28, 1.36] : [1.6, 1.56, 1.66]);
          }
        }
        // the pillars at the four corners, with their cap stones
        for (const key of ['nw', 'ne', 'se', 'sw']) {
          const [px, py] = PIL[key], t = key === 'nw' || key === 'sw' ? 0 : 1, top = deckH(t) + 1.35, g = Math.min(TH(px, py), 0) - 0.8;
          B.box('stone', X(px), g, Z(py), 0.8, top - g, 0.8, 0, [1.6, 1.56, 1.66]);
          B.box('stone', X(px), top, Z(py), 0.95, 0.16, 0.95, 0, [1.35, 1.32, 1.4]);
          B.box('stone', X(px), top + 0.16, Z(py), 0.62, 0.12, 0.62, 0, [1.45, 1.42, 1.5]);
        }
        // solid: the parapets (so the deck is reached only from the road at its ends)
        const strip = (f, side) => { const a = [], b = []; for (let i = 0; i <= N; i++) { const t = i / N, p = f(t), q = f(Math.min(1, t + 1 / N)); a.push(p); b.push(out(p, q, side)); } return a.concat(b.reverse()).map((p) => [p[0] - (side < 0 ? 0 : 0), p[1]]); };
        K.addBlock(strip(brN, -1)); K.addBlock(strip(brS, 1));
        K.shadeMarks.push(['poly', [brS(0), brS(1), out(brS(1), brS(1), 1), [PIL.se[0], PIL.se[1] + 30], [PIL.sw[0], PIL.sw[1] + 30]], 0.7]);
        // the amber in the deck's seams, a little warm light
        for (const t of [0.2, 0.5, 0.8]) { const p = lerp2(lerp2(brN(t), brS(t), 0.5), lerp2(brN(t), brS(t), 0.5), 0); K.light(p[0], p[1], 60, 0.2, 'warm'); }
      }

      // ================= the three Ember Line nodes, and the ring's plain standing stones =================
      for (const nd of NODES) standingStone(nd.at[0], nd.at[1], nd.w, nd.d, nd.h, (nd.seed - 2) * 0.06, nd.seed * 7.7, [1.02, 1.0, 1.08], nd.eye);
      for (const [i, [px, py, w, h]] of RING.entries()) { standingStone(px, py, w, w * 0.62, h, (i * 1.7) % 1 - 0.5, i * 3.1 + 11, [0.95, 0.97, 1.02]); }
      // rubble at the nodes' feet
      { const r = W.rand(777); for (const [px, py, n] of [[240, 238, 7], [585, 466, 4], [1354, 182, 6]]) for (let i = 0; i < n; i++) { const a = r() * Math.PI + (r() < 0.3 ? Math.PI : 0), d = 0.9 + r() * 0.5; const qx = px + Math.cos(a) * d / SX, qy = py + Math.sin(a) * d * 0.6 / SZ; if (walkDist(qx, qy) < 4) continue; rock(qx, qy, 0.22 + r() * 0.12, { shade: false }); } }

      // ================= the dry-stone walls: their bodies, capstones, end pillars and posts =================
      {
        const r = W.rand(733), WC = [1.9, 1.85, 2.0];
        for (const wl of PL.walls) {
          for (let k = 1; k < wl.pts.length; k++) {
            const [ax, ay] = wl.pts[k - 1], [bx, by] = wl.pts[k], L = Math.hypot((bx - ax) * SX, (by - ay) * SZ), ry = Math.atan2(-(by - ay) * SZ, (bx - ax) * SX), n = Math.max(1, Math.ceil(L / 1.1));
            for (let i = 0; i < n; i++) { const f = (i + 0.5) / n, px = ax + (bx - ax) * f, py = ay + (by - ay) * f, g = TH(px, py), hh = wl.H * (0.88 + r() * 0.14); B.box('dry', X(px), g - 0.45, Z(py), L / n + 0.03, hh + 0.45, wl.t, ry, WC, { u0: i * L / n }); K.shadeMarks.push(['dot', px, py, 12, 0.85]); }
            for (let s = 0.25; s < L; s += 0.42 + r() * 0.12) { const f = s / L, px = ax + (bx - ax) * f, py = ay + (by - ay) * f; B.box('dry', X(px), TH(px, py) + wl.H * 0.95 - 0.04, Z(py), 0.38 + r() * 0.12, 0.16 + r() * 0.1, wl.t + 0.06, ry + (r() - 0.5) * 0.3, [1.7, 1.66, 1.8]); }
          }
          for (const [e, [px, py]] of [wl.pts[0], wl.pts[wl.pts.length - 1]].entries()) { if (wl.ends && !wl.ends[e]) continue; const g = TH(px, py); B.box('dry', X(px), g - 0.45, Z(py), 0.72, wl.H + 0.8, 0.72, 0, [2.0, 1.96, 2.1]); B.box('dry', X(px), g + wl.H + 0.35, Z(py), 0.84, 0.14, 0.84, 0, [1.6, 1.56, 1.7]); K.addBlock(K.circlePx(px, py, 0.45, 8)); }
        }
        for (const [px, py, h] of PL.posts) post(px, py, h, 0.13, [0.62, 0.52, 0.46]);
      }

      // ================= the painting's boulders, birches, gorse and heather; the stream's reeds, leaves and falls =====
      for (const [px, py, s] of BOULDERS) rock(px, py, s * 1.3, { sink: 0.3 });
      for (const [px, py, s, n] of BIRCHES) birch(px, py, s, n, Math.round(px + py));
      // the flat rock by the east side path, and the dark shrub at the ring path's edge
      { const x = X(1074), z = Z(240), y = TH(1074, 240); B.geom('rock', K.rockG[1], new THREE.Matrix4().compose(V3(x, y - 0.25, z), QY(0.4), V3(0.95, 0.42, 0.7)), [0.95, 0.95, 1.0], 1.2); }
      bush(328, 340, 0.62, 'dark', W.rand(5));
      {
        const r = W.rand(2026), STEP = 46, nearRock = (px, py) => BOULDERS.some((b) => Math.hypot(px - b[0], py - b[1]) < 34 * b[2]);
        const keep = (px, py) => streamD(px, py) > 1.0 && !inPoly(DECK, px, py) && !(px > 60 && px < 420 && py > 150 && py < 320) && mDist(px, py, HOLLOW.c[0], HOLLOW.c[1]) > 2.5;
        for (let gy = -30; gy < 1060; gy += STEP) for (let gx = -30; gx < 1570; gx += STEP) {
          const px = gx + (r() - 0.5) * STEP, py = gy + (r() - 0.5) * STEP, rr = 0.45 + r() * 0.55, roll_ = r();
          if (roll_ > 0.6 || !keep(px, py) || nearRock(px, py)) continue;
          if (walkDist(px, py) < rr / SX + 6) continue;
          bush(px, py, rr, r() < 0.55 ? 'gorse' : 'heather', r);
        }
        // reeds and floating leaves along the stream, on the painting
        for (let i = 0; i < 46; i++) { const k = 4 + Math.floor(r() * 18), a = SL[k], b = SL[k + 1], f = r(), cx = a[0] + (b[0] - a[0]) * f, cy = a[1] + (b[1] - a[1]) * f, hw = a[2], dx = (b[0] - a[0]) * SX, dz = (b[1] - a[1]) * SZ, L = Math.hypot(dx, dz), side = r() < 0.5 ? -1 : 1, nx = -dz / L * side, nz = dx / L * side;
          const px = cx + nx * (hw + 0.15 + r() * 0.3) / SX, py = cy + nz * (hw + 0.15 + r() * 0.3) / SZ; if (inPoly(DECK, px, py) || walkDist(px, py) < 6) continue; tuft(px, py, 8, 1.0, [0.7, 0.82, 0.55]); }
        for (let i = 0; i < 26; i++) { const k = 4 + Math.floor(r() * 18), a = SL[k], b = SL[k + 1], f = r(), px = a[0] + (b[0] - a[0]) * f + (r() - 0.5) * 30, py = a[1] + (b[1] - a[1]) * f; if (inPoly(DECK, px, py) || streamD(px, py) > -0.3) continue; leaves(px, py, level(py) + 0.02, 1, 0.1, i * 31 + 7); }
        // the little falls: white water and a glint
        for (const [px, py] of [[552, 122], [600, 228], [1040, 737], [1112, 767], [1420, 962]]) { const y = level(py); K.halo(X(px), y + 0.2, Z(py), 1.6, [0.25, 0.3, 0.45]); for (let j = 0; j < 4; j++) { const x = X(px) + (j - 1.5) * 0.3, z = Z(py); B.quad('glass', [x - 0.12, y - 0.15, z + 0.2], [x + 0.12, y - 0.15, z + 0.2], [x + 0.12, y + 0.2, z - 0.15], [x - 0.12, y + 0.2, z - 0.15], [0, 0, 1, 1], [0.5, 0.55, 0.7]); } }
      }

      // ================= the roads' amber seams: a faint warm light along them =================
      for (const pts of [[[0, 593], [150, 562], [300, 535], [450, 515], [600, 500]], [[860, 405], [900, 330], [940, 230], [960, 120], [990, 20]], ROAD_W.pts.slice(1), ROAD_N.pts.slice(1)])
        for (const [px, py] of pts) K.light(px, py, 60, 0.18, 'warm');

      // ================= past the painting: boulders, gorse and heather scattered over the moor ===============
      function nearLandmark(px, py) {
        return mDist(px, py, -555, -310) < 12 || mDist(px, py, SHIELING.c[0], SHIELING.c[1]) < 7 || mDist(px, py, KNOLL.c[0], KNOLL.c[1]) < 6 ||
          mDist(px, py, FALLS.pool[0], FALLS.pool[1]) < 9 || mDist(px, py, COPSE.c[0], COPSE.c[1]) < COPSE.r + 2 || mDist(px, py, MILE.at[0], MILE.at[1]) < 3;
      }
      {
        const r = W.rand(9090), STEP = 70;
        for (let gy = -1000; gy < 2040; gy += STEP) for (let gx = -1520; gx < 3060; gx += STEP) {
          const px = gx + (r() - 0.5) * STEP, py = gy + (r() - 0.5) * STEP, u = r(), rr = 0.5 + r() * 0.7;
          if (inPaint(px, py, 30) || !inBounds(px, py) || streamD(px, py) < 1.2) continue;
          const pd = pathDist(px, py), near = pd < 140, dens = 0.18 + 0.35 * W.vnoise(px / 300 + 4, py / 300);
          if (u > dens || pd < rr / SX + 10 || nearLandmark(px, py)) continue;
          if (r() < 0.42) rock(px, py, 0.6 + r() * 1.3, { low: !near });
          else bush(px, py, rr, r() < 0.55 ? 'gorse' : 'heather', r, !near);
        }
        // the stream's banks past the painting: reeds here and there
        for (let k = 0; k < SL.length - 1; k++) { if (inPaint(SL[k][0], SL[k][1], 0)) continue; for (let j = 0; j < 3; j++) { const a = SL[k], b = SL[k + 1], f = r(), cx = a[0] + (b[0] - a[0]) * f, cy = a[1] + (b[1] - a[1]) * f, dx = (b[0] - a[0]) * SX, dz = (b[1] - a[1]) * SZ, L = Math.hypot(dx, dz), s = r() < 0.5 ? -1 : 1; const px = cx - dz / L * s * (a[2] + 0.3) / SX, py = cy + dx / L * s * (a[2] + 0.3) / SZ; if (inBounds(px, py) && pathDist(px, py) > 20) tuft(px, py, 7, 1.0, [0.7, 0.82, 0.55]); } }
      }

      // ================= the old row of standing stones in the north-west: seven, one fallen, one leaning ============
      {
        const r = W.rand(31);
        for (let i = 0; i < ROW.n; i++) {
          const f = i / (ROW.n - 1), px = ROW.a[0] + (ROW.b[0] - ROW.a[0]) * f + (r() - 0.5) * 10, py = ROW.a[1] + (ROW.b[1] - ROW.a[1]) * f, h = 1.5 + r() * 0.9 - f * 0.3;
          if (i === 4) { const x = X(px), z = Z(py), y = TH(px, py); B.box('rock', x, y - 0.25, z, 0.7, 0.55, h, 0.6, [0.9, 0.92, 0.98]); K.addBlock(K.circlePx(px, py, h * 0.45, 8)); continue; }
          standingStone(px, py, 0.7 + r() * 0.25, 0.45, h, 0.6 + (r() - 0.5) * 0.4, i * 5.3, [0.92, 0.95, 1.0]);
          K.addBlock(K.circlePx(px, py, 0.42, 8));
        }
        for (let i = 0; i < 5; i++) { const px = -555 + (r() - 0.5) * 200, py = -310 + (r() - 0.5) * 260; rock(px, py, 0.3 + r() * 0.25); }
        K.halo(X(-555), TH(-555, -310) + 1, Z(-310), 9, [0.12, 0.12, 0.22]);
      }
      // ================= the stepping stones (both fords) =================
      for (const f of FORDS) for (let i = 0; i < f.n; i++) { const t = (i + 0.5) / f.n, px = f.a[0] + (f.b[0] - f.a[0]) * t, py = f.a[1] + (f.b[1] - f.a[1]) * t + (i % 2 ? 4 : -4), lv = level(py); B.cyl('rock', X(px), lv - 1.2, Z(py), 0.46, 0.4, 1.45, 8, [0.9, 0.92, 0.98], [3.0, 1.2]); }

      // ================= the ruined shieling in the east: four broken dry-stone walls, a doorway, a fallen beam, a
      // cold hearth inside ======
      {
        const [cx_, cy_] = SHIELING.c, x = X(cx_), z = Z(cy_), y = TH(cx_, cy_), Wd = SHIELING.w, D = SHIELING.d, r = W.rand(4321), WC = [1.8, 1.76, 1.9];
        const wall = (ax, az, bx, bz, hs, gap) => { const L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(L / 0.8)), ry = Math.atan2(-(bz - az), bx - ax);
          for (let i = 0; i < n; i++) { const f = (i + 0.5) / n; if (gap && Math.abs(f - 0.5) < gap) continue; const wx = ax + (bx - ax) * f, wz = az + (bz - az) * f, g = TH(K.M.px(wx), K.M.py(wz)), hh = hs[Math.min(hs.length - 1, Math.floor(f * hs.length))] * (0.85 + r() * 0.25); B.box('dry', wx, g - 0.4, wz, L / n + 0.03, hh + 0.4, 0.55, ry, WC, { u0: i * L / n }); } };
        wall(x - Wd / 2, z - D / 2, x + Wd / 2, z - D / 2, [1.6, 1.5, 1.2, 0.6]);
        wall(x - Wd / 2, z - D / 2, x - Wd / 2, z + D / 2, [1.5, 1.1, 0.5]);
        wall(x + Wd / 2, z - D / 2, x + Wd / 2, z + D / 2, [1.3, 1.4, 1.0]);
        wall(x - Wd / 2, z + D / 2, x + Wd / 2, z + D / 2, [1.1, 0.9, 1.2, 1.0], 0.16);
        seg('wood', [x - Wd / 2 + 0.2, y + 1.4, z - D / 2 + 0.2], [x + 0.6, y + 0.1, z + 0.8], 0.12, 0.1, 6, [0.6, 0.5, 0.45]);
        for (let i = 0; i < 7; i++) { const a = i / 7 * TAU; B.geom('rock', ROCK_LOW[i % 3], new THREE.Matrix4().compose(V3(x - 0.9 + Math.cos(a) * 0.45, y - 0.05, z - 0.6 + Math.sin(a) * 0.4), QY(a), V3(0.2, 0.18, 0.2)), [0.6, 0.56, 0.58], 0.6); }
        for (let i = 0; i < 8; i++) rock(cx_ + (r() - 0.5) * 160, cy_ + (r() - 0.5) * 120, 0.25 + r() * 0.2, { col: [1.0, 1.0, 1.05] });
        birch(cx_ + 110, cy_ - 60, 1.05, 2, 2211, [-0.1, 0.1]);
        bush(cx_ - 120, cy_ + 40, 0.75, 'gorse', r); bush(cx_ + 70, cy_ + 70, 0.6, 'heather', r);
        K.shadeMarks.push(['rect', cx_ - Wd / 2 / SX, cy_ - D / 2 / SZ, cx_ + Wd / 2 / SX, cy_ + D / 2 / SZ, 0.7]);
      }
      // ================= the lone birch on its knoll in the north-east, a flat stone to sit on under it ==========
      {
        const [kx, ky] = KNOLL.c;
        birch(kx, ky, 1.5, 3, 1600, [0.25, 0.05]);
        const x = X(kx - 50), z = Z(ky + 30), y = TH(kx - 50, ky + 30); B.box('stone', x, y - 0.3, z, 1.5, 0.75, 0.6, 0.3, [0.95, 0.95, 1.0]);
        for (const [ox, oy, s] of [[90, 40, 0.9], [-110, -30, 0.7], [40, -70, 0.6]]) rock(kx + ox, ky + oy, s);
        const r = W.rand(1601); for (let i = 0; i < 8; i++) { const a = r() * TAU, d = 2.5 + r() * 3; bush(kx + Math.cos(a) * d / SX, ky + Math.sin(a) * d / SZ, 0.35 + r() * 0.2, 'green', r); }
      }
      // ================= the falls and the pool in the south-east =================
      {
        const [fx, fy] = FALLS.at, r = W.rand(1818);
        // the lip of rock the water falls over, and the white water below it
        for (let i = 0; i < 9; i++) { const f = (i - 4) / 4, px = fx + f * 46, py = fy - f * 34; if (streamD(px, py) > 0.6) continue; rock(px, py, 0.55 + r() * 0.3, { y: level(py - 20) - 0.25, shade: false }); }
        for (let i = 0; i < 6; i++) { const f = (i - 2.5) / 2.5, px = fx + 10 + f * 34, py = fy + 12 - f * 26, x = X(px), z = Z(py), top = level(fy - 30), botY = level(fy + 40); B.quad('glass', [x - 0.3, botY, z + 0.5], [x + 0.3, botY, z + 0.5], [x + 0.3, top + 0.05, z - 0.1], [x - 0.3, top + 0.05, z - 0.1], [0, 0, 1, 1], [0.55, 0.6, 0.78]); }
        K.halo(X(fx + 20), level(fy + 30) + 0.4, Z(fy + 30), 4, [0.25, 0.3, 0.48]);
        // rocks round the pool, reeds, leaves on it, a birch leaning over
        const [pxp, pyp] = FALLS.pool;
        for (let i = 0; i < 22; i++) { const a = r() * TAU, rr = 4.2 + r() * 1.2, px = pxp + Math.cos(a) * rr / SX, py = pyp + Math.sin(a) * rr / SZ; if (streamD(px, py) < 0.2 || pathDist(px, py) < 26) continue; rock(px, py, 0.55 + r() * 0.7); }
        for (let i = 0; i < 10; i++) { const a = r() * TAU, rr = 3.4 + r() * 0.6, px = pxp + Math.cos(a) * rr / SX, py = pyp + Math.sin(a) * rr / SZ; if (streamD(px, py) < 0 || pathDist(px, py) < 20) continue; tuft(px, py, 9, 1.1, [0.7, 0.82, 0.55]); }
        leaves(pxp, pyp, level(pyp) + 0.02, 16, 5.5, 1919);
        birch(pxp - 85, pyp + 90, 1.15, 2, 1930, [0.3, -0.2]);
      }
      // ================= the dark copse in the south-west: a ring of dark firs round a mossy clearing, its way in on
      // the east between two boulders (a pocket: a fallen log, shelf mushrooms, white flowers) ========
      {
        const [cx_, cy_] = COPSE.c, r = W.rand(4040), n = 22;
        for (let i = 0; i < n; i++) {
          const a = i / n * TAU, da = Math.atan2(Math.sin(a), Math.cos(a)); if (Math.abs(da) < COPSE.gap / 2) continue;
          for (const ring of [COPSE.r, COPSE.r + 2.6]) { if (ring > COPSE.r && r() < 0.35) continue; const rr = ring + (r() - 0.5) * 1.2, px = cx_ + Math.cos(a + (ring > COPSE.r ? 0.14 : 0)) * rr / SX, py = cy_ + Math.sin(a + (ring > COPSE.r ? 0.14 : 0)) * rr / SZ;
            PL.extraTrees.push([Math.round(px), Math.round(py), +(1.0 + r() * 0.35).toFixed(2), 1, 4000 + i * 7 + (ring > COPSE.r ? 3 : 0)]); }
          // undergrowth between the trunks, so the ring is closed but for its way in
          const px = cx_ + Math.cos(a + 0.14) * (COPSE.r + 0.6) / SX, py = cy_ + Math.sin(a + 0.14) * (COPSE.r + 0.6) / SZ;
          bush(px, py, 1.05 + r() * 0.3, 'dark', r);
        }
        // the way in: two boulders either side of the gap
        for (const s of [-1, 1]) { const a = s * (COPSE.gap / 2 + 0.08); rock(cx_ + Math.cos(a) * (COPSE.r + 0.8) / SX, cy_ + Math.sin(a) * (COPSE.r + 0.8) / SZ, 1.1); }
        // inside: the fallen log with its shelf mushrooms, white flowers, moonlight
        { const A = [X(cx_ - 60), TH(cx_ - 60, cy_ + 40) + 0.25, Z(cy_ + 40)], Bp = [X(cx_ + 30), TH(cx_ + 30, cy_ + 60) + 0.22, Z(cy_ + 60)];
          seg('wood', A, Bp, 0.28, 0.22, 8, [0.62, 0.55, 0.5]); K.addBlock(ribbon([[cx_ - 60, cy_ + 40], [cx_ + 30, cy_ + 60]], 0.32));
          for (let i = 0; i < 6; i++) { const f = 0.15 + i * 0.13, p = add(A, mul(sub(Bp, A), f)), sh = new THREE.CylinderGeometry(0.16, 0.12, 0.05, 8, 1, false, 0, Math.PI); B.geom('wood', sh, new THREE.Matrix4().compose(V3(p[0], p[1] + 0.05 + (i % 2) * 0.08, p[2] + 0.26), QY(Math.PI), V3(1, 1, 1)), [1.3, 1.1, 0.8], 1); sh.dispose(); } }
        for (let i = 0; i < 8; i++) { const a = r() * TAU, d = r() * (COPSE.r - 3); bush(cx_ + Math.cos(a) * d / SX, cy_ + Math.sin(a) * d / SZ, 0.3, 'green', r); }
        K.halo(X(cx_), TH(cx_, cy_) + 1.5, Z(cy_), 8, [0.1, 0.12, 0.2]);
      }
      // ================= the milestone on the west road =================
      {
        const [mx, my] = MILE.at, x = X(mx), z = Z(my), y = TH(mx, my);
        B.box('stone', x, y - 0.3, z, 0.55, 1.35, 0.4, 0.05, [1.0, 0.98, 1.02]);
        const top = new THREE.CylinderGeometry(0.275, 0.275, 0.4, 10, 1, false, 0, Math.PI); top.rotateZ(Math.PI / 2); top.rotateY(Math.PI / 2); B.geom('stone', top, new THREE.Matrix4().compose(V3(x, y + 1.05, z), QY(0.05), V3(1, 1, 1)), [1.0, 0.98, 1.02], 1); top.dispose();
        const GOLD = [0.5, 0.4, 0.2], cz = z + 0.21, cy = y + 0.75;
        for (let i = 0; i < 8; i++) { const b0 = i / 8 * TAU, b1 = (i + 1) / 8 * TAU; B.tri('glass', [x, cy, cz], [x + Math.cos(b0) * 0.11, cy + Math.sin(b0) * 0.11, cz], [x + Math.cos(b1) * 0.11, cy + Math.sin(b1) * 0.11, cz], [[0, 0], [1, 0], [0, 1]], GOLD); }
        K.halo(x, cy, cz + 0.1, 0.5, [0.25, 0.18, 0.08]);
        rock(mx - 24, my - 6, 0.35); bush(mx + 32, my - 12, 0.55, 'gorse', W.rand(3));
      }
      // ================= the hollow behind the big boulder, north of the road: a ledge of grass between the boulder,
      // the wall and the stream's bank, white flowers, a flat stone; its way in from the west, past the wall's end ====
      {
        const [hx, hy] = HOLLOW.c, r = W.rand(5151);
        rock(hx + 80, hy - 18, 0.9);
        B.solid = false; B.box('rock', X(hx + 10), TH(hx + 10, hy) - 0.2, Z(hy), 1.2, 0.32, 0.8, 0.3, [0.85, 0.95, 0.85]); B.solid = true;
        for (const [px, py] of [[hx - 20, hy + 8], [hx + 26, hy - 16], [hx - 4, hy - 22]]) bush(px, py, 0.3, 'green', r);
        K.light(hx, hy, 70, 0.32, 'moon');
      }

      // ================= the mist: low banks lying in the hollows (soft glows, drawn last) =================
      for (const [px, py, s] of [[240, 250, 9], [700, 340, 9], [1100, 760, 9], [1500, 990, 9], [1930, 1265, 11], [-555, -310, 10], [2200, -40, 9], [1600, -600, 10],
        [-300, 1440, 10], [440, -450, 9], [2400, 600, 10], [-800, 200, 10], [300, -700, 9], [1200, 1500, 10], [-800, 1200, 9], [2600, -400, 9]]) K.halo(X(px), TH(px, py) + s * 0.08, Z(py), s, [0.14, 0.12, 0.24]);
    },
  };
})(window);
