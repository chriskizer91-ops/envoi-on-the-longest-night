// northern-camp.js: the northern camp in 3D. Its painting (reference/art/walk/wilds/walk-northern-camp.png, 1536 x 1024) is
// the middle, laid out in the painting's own pixels as src/game/maps.js keeps the walking map: the landing ground of
// frosted grass inside its four stakes and sagging rope, where the airship comes down; the camp (the big ridge tent with
// its flaps tied open and a lantern lit inside, the small closed tent, the stone fire ring with its fire, the stumps
// round it, the firewood, the barrels and the sack, the open crate, the lantern hanging from its post); the earth road
// east into the forest, the path north to the lit hollow under the great mossy boulder and the trail on north-west past
// it; the path south between the heather to the plank bridge over the dark, half-frozen stream; the fallen log, the
// frosted firs, the bare white birches, the dead snag and the mossy boulders.
// Round it the cold northern country goes on, one painting each way (Chris, November 16: wild places are wide open
// fields in heavy fog, with pockets to find): rolling ground under clumps of frosted firs with clearings between, trails
// out to places to find (a hunters' lean-to against a rock in the north, a half-frozen pond with a little jetty in the
// north-west, a ring of birches round a standing boulder in the west, a woodcutters' clearing in the south, a waymarker
// cairn on the road east), and the road east to Eldergrove's edge, its one way on. Two pockets: inside the lit hollow
// under the great boulder (past the walking map's mouth of it), and the sheltered strip behind the big tent where the
// camp keeps its spare bedding.
// No keepsake lives here (envoi-final-draft/items/items.js has none whose home is the northern camp), so no shimmer.
// Where Io can walk: the walking map's own walk and block areas, unchanged, plus all the open ground inside open.bounds,
// less the stream, the pond and everything solid (every trunk and fir, boulder, stake, stump, tent, the bridge's rails,
// the hedge of frosted scrub just inside the open ground's edge).
// The texture ids are the texture pack's (texture-packs/wilds-north/northern-camp/inventory.md).
// Heights are metres: the camp, the landing ground and the paths are 0; the stream lies 0.8 below in a shallow bed;
// the bridge's deck sits a hand above the path; past the painting the ground rolls (about 2 m up and down), gentler
// along the trails.
(function (G) {
  'use strict';
  const P = G.W3D_PLACES = G.W3D_PLACES || {};
  const ID = 'northern-camp';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ss = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const SX = 0.04, SZ = 0.05;
  const inPoly = (poly, x, y) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
  const edgeDist = (poly, x, y) => { let d = 1e9; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const ax = poly[j][0], ay = poly[j][1], dx = poly[i][0] - ax, dy = poly[i][1] - ay, t = clamp(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1), 0, 1); d = Math.min(d, Math.hypot(x - ax - t * dx, y - ay - t * dy)); } return d; };
  const bboxOf = (poly) => { let a = 1e9, b = 1e9, c = -1e9, d = -1e9; for (const [x, y] of poly) { a = Math.min(a, x); b = Math.min(b, y); c = Math.max(c, x); d = Math.max(d, y); } return [a, b, c, d]; };

  // ---- the stream: traced from the painting (it rises among the rocks south of the landing ground, runs east under the
  // bridge, widens into a pool of ice and stones and leaves the painting's foot going south-east); past the painting it
  // winds on south-east out of the open ground ----
  const STREAM = [
    // the north bank, west to east
    [452, 702], [468, 684], [500, 671], [545, 664], [612, 662], [672, 672], [692, 694], [712, 718], [745, 734], [790, 750], [850, 760], [895, 772],
    [912, 788], [960, 800], [1010, 806], [1060, 814], [1116, 826], [1160, 848], [1200, 872], [1240, 900], [1290, 925], [1340, 945], [1385, 985], [1405, 1024],
    [1470, 1150], [1580, 1320], [1700, 1500], [1820, 1680], [1930, 1860], [2010, 2060],
    // the south bank, east to west
    [1850, 2060], [1760, 1860], [1640, 1680], [1510, 1500], [1380, 1320], [1250, 1160], [1110, 1024], [1095, 980], [1070, 945], [1030, 915], [990, 900],
    [951, 882], [900, 866], [855, 848], [810, 836], [770, 826], [738, 818], [722, 803], [705, 790], [650, 803], [611, 803], [575, 795], [544, 787],
    [500, 776], [461, 753], [446, 725]];
  const SB = bboxOf(STREAM);
  const LEVEL = -0.8;
  // the plank bridge: the walking map's own quad for it, and the deck's height (a hand above the path, bowed a little)
  const BRIDGE = [[798, 734], [882, 748], [838, 846], [746, 832]];
  const BR_N = [(798 + 882) / 2, (734 + 748) / 2], BR_S = [(838 + 746) / 2, (846 + 832) / 2];
  const segDist = (x, y, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], t = clamp(((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy || 1), 0, 1); return Math.hypot(x - a[0] - t * dx, y - a[1] - t * dy); };
  const bridgeT = (x, y) => { const dx = BR_S[0] - BR_N[0], dy = BR_S[1] - BR_N[1]; return clamp(((x - BR_N[0]) * dx + (y - BR_N[1]) * dy) / (dx * dx + dy * dy), 0, 1); };
  const deckY = (x, y) => 0.14 + 0.16 * Math.sin(Math.PI * bridgeT(x, y));

  // ---- the trails past the painting: centre lines in pixels, and their half widths (m). The painting's own paths are
  // the walking map's walk areas; these carry them on to the way out and to the places to find. ----
  const TRAILS = [
    { id: 'road', w: 1.3, pts: [[1520, 516], [1700, 524], [1880, 500], [2060, 522], [2240, 542], [2420, 516], [2600, 506], [2712, 516]] },
    { id: 'north', w: 0.8, pts: [[1012, 62], [990, -60], [1012, -200], [955, -360], [985, -520], [1000, -630]] },
    { id: 'pond', w: 0.8, pts: [[365, 140], [352, 20], [255, -120], [100, -250], [-80, -330], [-230, -400]] },
    { id: 'south', w: 0.9, pts: [[770, 1010], [758, 1120], [700, 1260], [728, 1420], [790, 1560]] },
    { id: 'west', w: 0.8, pts: [[70, 440], [-80, 452], [-260, 430], [-440, 470], [-640, 462]] },
  ];
  // the road as it runs on past the way out into the fog (seen, not walked: the way out is at the open ground's edge)
  const ROAD_ON = { w: 1.3, pts: [[2712, 516], [2860, 522], [3060, 510]] };
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
  const trailDist = (x, y) => { let d = 1e9; for (const t of TRAILS.concat([ROAD_ON])) for (let i = 1; i < t.pts.length; i++) d = Math.min(d, segDist(x, y, t.pts[i - 1], t.pts[i])); return d; };

  // ---- the places to find, and the two pockets ----
  const LEANTO = { at: [1000, -690] };                          // the hunters' lean-to, open to the south
  const POND = { c: [-430, -445], rx: 170, ry: 115 };           // the half-frozen pond, its jetty off the east shore
  const BIRCHES = { c: [-800, 460], r: 6.5 };                   // the ring of birches round a standing boulder
  const WOODCUT = { c: [800, 1640] };                           // the woodcutters' clearing
  const WAYMARK = { at: [2250, 476] };                          // the waymarker cairn on the road east
  const BOULDER = { c: [1210, 72], rx: 4.35, ry: 4.7, rz: 3.25, back: 0.95 };   // the great boulder: its middle (px), its half sizes, how deep its hollow goes (m from its middle)
  const HOLLOW = [[1188, 156], [1232, 156], [1233, 100], [1210, 94], [1187, 100]];   // inside the lit hollow
  const TENTBACK = { at: [705, 222] };                          // the strip behind the big tent
  const ellipse = (c, rx, ry, n, wob) => Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2, k = 1 + (wob || 0) * Math.sin(a * 3 + 1.3) * Math.cos(a * 2); return [Math.round(c[0] + Math.cos(a) * rx * k), Math.round(c[1] + Math.sin(a) * ry * k)]; });
  const PONDP = ellipse(POND.c, POND.rx, POND.ry, 22, 0.1);
  // level places: [x, y, radius (m)], the ground flat there (the pond's hollow, the clearings)
  const FLATS = [[POND.c[0], POND.c[1], 13], [LEANTO.at[0], LEANTO.at[1] + 30, 6], [BIRCHES.c[0], BIRCHES.c[1], 9], [WOODCUT.c[0], WOODCUT.c[1], 9], [WAYMARK.at[0], WAYMARK.at[1], 3]];

  // ---- the camp: the tents (front middle in pixels, the way the front faces (radians: 0 south, -pi/2 west), width,
  // depth, ridge height (m)), the fire ring, the stumps, the lantern post ----
  // the canvas's stand-in is a dim mauve (the painting's canvas by night): lifted toward the painting's cream here
  const CANVAS = [3.0, 3.3, 2.5];
  const BIGTENT = { fm: [682, 322], a: -0.45, w: 3.9, d: 4.0, h: 2.6, open: true };
  const SMALLTENT = { fm: [890, 352], a: -1.2, w: 2.8, d: 3.4, h: 1.95, open: false };
  const FIRE = { c: [801, 397], rx: 1.75, rz: 1.38 };
  const STUMPS = [[724, 390, 0.32, 0.5], [746, 422, 0.3, 0.45], [828, 432, 0.31, 0.48], [852, 360, 0.28, 0.42]];
  const POST = { at: [856, 333], h: 3.0 };
  const STAKES = [[120, 305], [541, 306], [567, 589], [111, 589]];

  // ---- the painting's firs, birches and boulders: [x, y (where the trunk stands), size] ----
  const FIRS = [[70, 140, 1.35], [190, 178, 1.45], [530, 168, 1.3], [618, 196, 0.95], [790, 172, 1.2], [667, 42, 1.1], [773, 72, 1.0], [1060, 380, 1.15],
    [1452, 372, 2.2], [1440, 92, 1.2], [1522, 112, 1.2], [14, 292, 1.1], [14, 542, 1.0], [730, 645, 1.1], [1040, 736, 1.25], [1350, 830, 1.35], [1492, 752, 1.25],
    [1482, 950, 1.3], [270, 900, 1.35], [130, 966, 1.5], [560, 1006, 1.1], [345, 706, 0.75], [12, 940, 1.2], [1300, 78, 0.9], [1037, 86, 0.5], [1020, 205, 0.55],
    [430, 120, 1.0], [325, 60, 1.2], [880, 40, 0.9]];
  const BIRCH_CLUMPS = [[862, 112, 3, 1.0], [1398, 122, 3, 0.95], [48, 738, 3, 0.9], [930, 32, 2, 0.8]];
  const ROCKS = [[44, 160, 1.6], [708, 150, 1.5], [580, 236, 0.9], [476, 24, 1.1], [900, 172, 1.5], [1164, 440, 1.6], [1504, 424, 1.1], [380, 720, 1.2],
    [576, 782, 1.25], [728, 690, 1.35], [288, 968, 1.5], [504, 880, 1.1], [1032, 926, 0.95], [1256, 870, 1.3], [995, 752, 1.15], [1168, 704, 1.2],
    [1262, 660, 1.0], [1345, 395, 0.9], [1528, 300, 1.0], [960, 470, 0.85], [1100, 640, 0.8], [180, 680, 0.8]];
  // stones standing out of the stream, ringed with ice: [x, y, size]
  const STREAM_STONES = [[611, 696, 0.75], [555, 678, 0.45], [973, 830, 0.5], [1044, 860, 0.55], [1098, 872, 0.42], [1301, 952, 0.6], [1352, 980, 0.45],
    [880, 806, 0.38], [690, 760, 0.4], [1180, 905, 0.5], [1520, 1200, 0.6], [1650, 1420, 0.55]];
  // reeds and cattails at the stream's edges: [x, y, spread (m)]
  const REEDS = [[1170, 820, 1.2], [1202, 846, 0.9], [632, 640, 1.1], [462, 740, 0.8], [1142, 950, 0.9], [1430, 1000, 0.8], [760, 868, 0.6], [905, 792, 0.6],
    [-560, -480, 1.0], [-300, -380, 0.8], [-520, -360, 0.9], [-440, -560, 0.9]];
  // clumps of frosted grass on the landing ground: [x, y]
  const TUFTS = [[300, 420], [380, 440], [200, 360], [460, 520], [160, 500], [500, 380], [260, 560], [420, 330], [330, 610], [88, 460], [560, 450]];
  // the low banks of cold blue mist lying between the trees: [x, y, size m]
  const MIST = [[300, 760, 8], [1200, 960, 9], [1400, 200, 7], [80, 300, 7], [-430, -445, 10], [-800, 460, 9], [800, 1640, 9], [1000, -690, 8],
    [2250, 470, 8], [-300, 900, 10], [400, -600, 10], [1800, -300, 10], [2400, 1000, 10], [1700, 1300, 9], [200, 1500, 10], [-1000, -300, 10],
    [-900, 1200, 10], [2600, -500, 9], [1900, 700, 8], [600, -250, 9], [1300, 1250, 9], [-200, 200, 9]];

  // ---- the ground ----
  const W3D = () => G.W3D;
  const roll = (x, y, t) => (W3D().vnoise(x / 420, y / 420) - 0.5) * 4.2 + t * (W3D().vnoise(x / 140, y / 140) - 0.5) * 1.2;
  const streamOut = (x, y) => (x < SB[0] - 80 || x > SB[2] + 80 || y < SB[1] - 80 || y > SB[3] + 80) ? 999 : inPoly(STREAM, x, y) ? 0 : edgeDist(STREAM, x, y);
  const flatK = [];
  // the ground's height under any point (metres)
  function ground(x, y) {
    let h = 0;
    // the stream's shallow bed (no bank by the bridge, whose deck meets the paths)
    const d = streamOut(x, y);
    if (d < 70) { const nb = Math.min(segDist(x, y, BR_N, BR_S), 999); h -= 0.72 * (1 - ss(0, 40, d)) * ss(30, 90, nb); }
    // rolling ground past the painting: none on it, gentler along the trails and the stream
    const out = Math.hypot(Math.max(0, -x, x - 1536), Math.max(0, -y, y - 1024)), k = ss(0, 300, out) * ss(50, 200, d);
    if (k > 0) h += k * roll(x, y, ss(25, 90, trailDist(x, y)));
    // the level places: the ground there settles to its height at the middle
    for (let i = 0; i < FLATS.length; i++) {
      const [fx, fy, fr] = FLATS[i], fd = Math.hypot((x - fx) * SX, (y - fy) * SZ);
      if (fd < fr + 6) { if (flatK[i] == null) { const o = Math.hypot(Math.max(0, -fx, fx - 1536), Math.max(0, -fy, fy - 1024)); flatK[i] = ss(0, 300, o) * roll(fx, fy, 1); } h += (flatK[i] - h) * (1 - ss(fr, fr + 6, fd)); }
    }
    return h;
  }
  const pondLevel = () => { ground(POND.c[0], POND.c[1]); return flatK[0] - 0.42; };

  // the walking map's own walk areas (for keeping things off them), with their boxes
  let WB = null;
  const mapWalk = () => WB || (WB = (((G.MAPS || {})[ID] || { walk: [] }).walk).map((p) => ({ p, b: bboxOf(p) })));

  P[ID] = {
    id: ID, name: 'The northern camp', painting: "art/walk/walk-northern-camp.avif", size: [1536, 1024],
    mapId: ID, paintingPng: 'reference/art/walk/wilds/walk-northern-camp.png',
    // the cold country: one painting each way round the painting; where Io may roam inside it (the firs close it in)
    extent: [-1536, -1024, 3072, 2048],
    open: { bounds: [[-1120, 300], [-1180, 0], [-1220, -350], [-1080, -700], [-700, -820], [-200, -780], [300, -840], [800, -800], [1300, -860],
      [1800, -800], [2300, -840], [2700, -700], [2800, -300], [2760, 200], [2712, 470], [2712, 570], [2780, 1000], [2820, 1450], [2650, 1800],
      [2100, 1860], [1500, 1800], [900, 1860], [300, 1800], [-300, 1840], [-900, 1760], [-1200, 1500], [-1150, 1000], [-1220, 700], [-1120, 440]] },
    // the wall check (tools/walls-test.mjs): from the start by the fire, to the rest spot, the landing ground, the hollow's
    // mouth and inside it, the north-west trail's end, the bridge, the south path's foot, every place to find, the space
    // behind the big tent, and the way out east
    checks: { from: [662, 420], goals: [
      ['the rest spot, by the fire', 790, 446], ['the landing ground, where the airship comes down', 336, 455], ['the hollow’s mouth, under the great boulder', 1210, 166],
      ['inside the lit hollow (pocket)', 1210, 112], ['the north-west trail’s end', 1012, 62], ['the middle of the plank bridge', 815, 790],
      ['the south path, past the bridge', 770, 1004], ['behind the big tent (pocket)', TENTBACK.at[0], TENTBACK.at[1]],
      ['the way on to Eldergrove’s edge (the east exit)', 2704, 516], ['the hunters’ lean-to (north)', 1000, -668],
      ['the end of the pond’s jetty (north-west)', -335, -438], ['the ring of birches (west)', -800, 500], ['the woodcutters’ clearing (south)', 800, 1600],
      ['the waymarker cairn on the road east', 2250, 510]] },
    // the trees: the painting's own firs are placed by hand (extraTrees: its undergrowth is as dark as its firs, so the
    // painting can't tell them apart); past it, frosted firs in clumps with clearings between, a few dead snags among them.
    // None in the places to find; the trails keep their own way through.
    treeGen: { dark: 2, step: 60,
      out: { density: 0.74, clump: 380, clear: 0.33, kinds: [0, 0.9, 0.1], size: [1.0, 1.75] },
      roads: [[2712, 490, 3072, 545]],
      keepOut: [[POND.c[0] - 260, POND.c[1] - 190, POND.c[0] + 230, POND.c[1] + 190], [LEANTO.at[0] - 140, LEANTO.at[1] - 120, LEANTO.at[0] + 140, LEANTO.at[1] + 140],
        [BIRCHES.c[0] - 230, BIRCHES.c[1] - 170, BIRCHES.c[0] + 230, BIRCHES.c[1] + 170], [WOODCUT.c[0] - 230, WOODCUT.c[1] - 170, WOODCUT.c[0] + 230, WOODCUT.c[1] + 170],
        [WAYMARK.at[0] - 70, WAYMARK.at[1] - 60, WAYMARK.at[0] + 70, WAYMARK.at[1] + 40]] },
    // the ground: packed earth on the road and the camp floor, frosted grass along its verges and over the landing ground,
    // frosted undergrowth everywhere else, frost and ice along the stream's banks
    ground: { cob: 'shared_dirt_track', dirt: 'shared_grass_frosted', grass: 'frosted_undergrowth', pave: 'stream_ice_edge', rep: [2.0, 3.2, 2.6, 2.2],
      grassTint: [0.92, 0.92, 1.0], dirtTint: [0.95, 0.97, 1.05] },
    // what each kind of surface is made of here (the camp has no houses: the unused kinds point at its own textures)
    surfaces: { stone: 'boulder_mossy_frost', dry: 'boulder_mossy_frost', timber: 'tent_canvas', planks: 'bridge_planks_frost', roof: 'tent_canvas',
      wood: 'log_bark_mossy', deck: 'bridge_planks_frost', pave: 'bridge_planks_frost', cloth: 'tent_canvas', soil: 'shared_dirt_track', rock: 'boulder_mossy_frost',
      leaves: 'frosted_undergrowth', firs: 'fir_foliage_frosted', bark: 'shared_bark_pine' },
    tints: { leaves: 0xdfe2f2, firs: 0xe2eaff, bush: 0xdde0f0, wood: 0xc0b2b4 },
    // the white birch bark (plain: the birch stand-in is bold stripes), the fallen log's mossy bark, the ice along the water,
    // frosted grass, reeds
    extraMats: { birch: { tint: 0xc9c9d4, shade: 0.5 }, birchMark: { tint: 0x2c2830, shade: 0.5 },
      // the boulders' stand-in is much yellower than the painting's grey granite: cooled a little here
      rock: { tex: 'boulder_mossy_frost', rep: 1.8, tint: 0xc0c6e6, shade: 0.7 }, stone: { tex: 'boulder_mossy_frost', rep: 1.2, tint: 0xc0c6e6, shade: 0.35 }, boughs: { tex: 'fir_foliage_frosted', rep: 1.2, tint: 0xe8eeff, shade: 0.5 }, logbark: { tex: 'log_bark_mossy', rep: 1.4, tint: 0xd0c8d0, shade: 0.6 },
      ice: { tex: 'stream_ice_edge', rep: 1.6, tint: 0xe4ecff, spec: 0.6, shade: 0.35 }, tuft: { tex: 'shared_grass_frosted', rep: 0.8, tint: 0xf2f4ff, side: 'double', shade: 0.4 },
      reed: { tint: 0x5a4e46, side: 'double', shade: 0.5 }, cattail: { tint: 0x3e2c24, shade: 0.5 }, rope: { tint: 0xc4b49c, shade: 0.4 }, ash: { tint: 0x3a3638, shade: 0.6 }, cut: { tint: 0xb89c80, shade: 0.5 } },
    // heavy cold fog, as in the Thornwood: only so much is drawn at once; no far hills (the fog is the edge)
    night: { fog: [0.18, 0.185, 0.338], fogNear: 10, fogFar: 42, far: 90, hills: false, sky: [0.58, 0.58, 0.72], moon: [0.4, 0.44, 0.6] },
    textures: [
      { id: 'shared_dirt_track', made: "./../texture-packs/made-web/shared_dirt_track.webp", stand: "./../texture-packs/wilds-north/northern-camp/stand-in/shared_dirt_track.png" },
      { id: 'shared_grass_frosted', made: "./../texture-packs/made-web/shared_grass_frosted.webp", stand: "./../texture-packs/north/crossroads/stand-in/shared_grass_frosted.png" },
      { id: 'frosted_undergrowth', made: "./../texture-packs/made-web/frosted_undergrowth.webp", stand: "./../texture-packs/wilds-north/northern-camp/stand-in/frosted_undergrowth.png" },
      { id: 'stream_ice_edge', made: "./../texture-packs/made-web/stream_ice_edge.webp", stand: "./../texture-packs/wilds-north/northern-camp/stand-in/stream_ice_edge.png" },
      { id: 'shared_water_dark', made: "./../texture-packs/made-web/shared_water_dark.webp", stand: "./../texture-packs/wickhollow/jetty/stand-in/shared_water_dark.png" },
      { id: 'boulder_mossy_frost', made: "./../texture-packs/made-web/boulder_mossy_frost.webp", stand: "./../texture-packs/wilds-north/northern-camp/stand-in/boulder_mossy_frost.png" },
      { id: 'bridge_planks_frost', made: "./../texture-packs/made-web/bridge_planks_frost.webp", stand: "./../texture-packs/wilds-north/northern-camp/stand-in/bridge_planks_frost.png" },
      { id: 'log_bark_mossy', made: "./../texture-packs/made-web/log_bark_mossy.webp", stand: "./../texture-packs/wilds-north/northern-camp/stand-in/log_bark_mossy.png" },
      { id: 'fir_foliage_frosted', made: "./../texture-packs/made-web/fir_foliage_frosted.webp", stand: "./../texture-packs/wilds-north/northern-camp/stand-in/fir_foliage_frosted.png" },
      { id: 'tent_canvas', made: "./../texture-packs/made-web/tent_canvas.webp", stand: "./../texture-packs/wilds-north/northern-camp/stand-in/tent_canvas.png" },
      // the firs' own bark (shared_bark_pine) has no stand-in yet: the oak's, until it does
      { id: 'shared_bark_pine', made: "./../texture-packs/made-web/shared_bark_pine.webp", stand: "./../texture-packs/wickhollow/cottage/stand-in/shared_bark_oak.png" },
    ],
    ground_h: ground,
    // where Io's feet stand: the ground, or the bridge's deck
    walk_h(x, y) {
      if (x >= 740 && x <= 890 && y >= 728 && y <= 852 && inPoly(BRIDGE, x, y)) return deckY(x, y);
      return ground(x, y);
    },
    water: [
      { poly: STREAM, level: () => LEVEL, tex: 'shared_water_dark', rep: 4, flow: [0.012, 0.006], bed: -2.6 },
      { poly: PONDP, level: () => pondLevel(), tex: 'shared_water_dark', rep: 5, flow: [0.002, 0.001], bed: -4.0 },
    ],
    lawns: [],
    // no boulders strewn along the bridge's ends, the pond's jetty, or where the stream runs outside the open ground
    noRocks: [[700, 700, 920, 880], [-360, -480, -200, -400], [1700, 1780, 2200, 2100]],
    // the open ground's edge is closed by a hedge of frosted scrub built in extra()
    thicket: false,
    start: [662, 420], startFace: 1.78, startYaw: -1.37,
    // the way on, where the road reaches the open ground's east edge
    exits: [
      { rect: [2692, 482, 2712, 552], label: 'Eldergrove’s edge' },
    ],
    // the trails (earth down the middle, frosted grass along the edges), and the floor of the lit hollow
    walkAdd: TRAILS.map((t) => ({ poly: ribbon(t.pts, t.w + 0.55), ground: 'dirt' })).concat(TRAILS.map((t) => ({ poly: ribbon(t.pts, t.w), ground: 'cob' })))
      .concat([{ poly: HOLLOW, ground: 'cob' }]),
    // frosted grass over the landing ground (the walking map's ground there is all one), earth in the clearings
    groundPatches: [
      { poly: [[58, 300], [100, 280], [200, 256], [320, 246], [440, 250], [560, 268], [590, 320], [598, 420], [590, 560], [560, 630], [300, 640], [110, 632], [60, 596], [56, 420]], kind: 'dirt' },
      { poly: ellipse(WOODCUT.c, 150, 110, 16, 0.15), kind: 'dirt' },
      { poly: ellipse([LEANTO.at[0], LEANTO.at[1] + 20], 80, 50, 12, 0.1), kind: 'cob' },
      { poly: ribbon(ROAD_ON.pts, ROAD_ON.w + 0.55), kind: 'dirt' }, { poly: ribbon(ROAD_ON.pts, ROAD_ON.w), kind: 'cob' },
    ],
    items: {},
    buildings: [],
    walls: [],
    steps: [],
    lamps: [],
    // the pond's little jetty, off its east shore
    get jetties() { return [{ r: [-352, -452, -214, -424], y: pondLevel() + 0.5, posts: true }]; },
    props: [],
    flowers: [],
    // the lights for the light map: [x, y, radius px, strength, colour]. The fire, the lanterns and the hollow's glow are
    // added in extra(); these are the moonlight on the stream, the landing ground and the clearings.
    lights: [
      [600, 720, 150, 0.4, 'moon'], [1000, 850, 170, 0.45, 'moon'], [1300, 960, 150, 0.4, 'moon'], [336, 455, 260, 0.32, 'moon'], [POND.c[0], POND.c[1], 220, 0.5, 'moon'],
      [BIRCHES.c[0], BIRCHES.c[1], 190, 0.42, 'moon'], [WOODCUT.c[0], WOODCUT.c[1], 170, 0.32, 'moon'], [LEANTO.at[0], LEANTO.at[1] + 40, 120, 0.25, 'moon'],
      [WAYMARK.at[0], WAYMARK.at[1] + 30, 120, 0.3, 'moon'], [1600, 1300, 150, 0.35, 'moon'],
    ],
    trees: ID,
    extraTrees: FIRS.map(([x, y, s], i) => [x, y, s, 1, 101 + i * 37]),

    // ---- what the engine has no field for: the tents, the fire ring and its stumps, the firewood, the barrels, the crate,
    // the lantern post, the landing ground's stakes and rope, the plank bridge, the great boulder and its lit hollow, the
    // fallen log, the dead snag, the birches, the scrub, the reeds, the stream's ice and stones, the places to find, the
    // pockets, the hedge at the open ground's edge, and the mist ----
    extra(K) {
      const { B, X, Z } = K, W = G.W3D, TAU = Math.PI * 2, TH = K.terrain;
      const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
      const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
      const norm = (a) => { const L = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / L, a[1] / L, a[2] / L]; };
      const PX = (x) => K.M.px(x), PY = (z) => K.M.py(z);
      // a quad that faces the way `want` points, whichever order its corners came in
      const Q = (k, a, b, c, d, want, uv, col) => { const n = cross(sub(b, a), sub(d, a)); if (dot(n, want) < 0) B.quad(k, b, a, d, c, uv, col); else B.quad(k, a, b, c, d, uv, col); };
      const walkDist = (x, y) => { let d = 1e9; for (const q of mapWalk()) { if (W.inPoly(q.p, x, y)) return 0; if (x > q.b[0] - d && x < q.b[2] + d && y > q.b[1] - d && y < q.b[3] + d) d = Math.min(d, W.edgeDist(q.p, x, y)); } return d; };
      const pathDist = (x, y) => Math.min(walkDist(x, y), trailDist(x, y) - 42);
      const inWater = (x, y) => streamOut(x, y) < 8 || W.inPoly(PONDP, x, y);
      const inBounds = (x, y) => W.inPoly(P[ID].open.bounds, x, y);
      const placeKeep = [[POND.c, 280, 200], [LEANTO.at, 150, 130], [BIRCHES.c, 240, 170], [WOODCUT.c, 230, 170], [WAYMARK.at, 70, 60], [[1210, 90], 140, 110]];
      const nearPlace = (x, y) => placeKeep.some(([c, rx, ry]) => Math.abs(x - c[0]) < rx && Math.abs(y - c[1]) < ry);
      // thin things Io walks through (ropes, twigs, reeds, guy lines) don't count as solid
      const soft = (fn) => { B.solid = false; fn(); B.solid = true; };
      const rockAt = (px, py, sz, solid, col, sq, y) => {
        const go = () => B.geom('rock', K.rockG[Math.floor(Math.abs(Math.sin(px * 12.9 + py * 7.3)) * 3) % 3], new THREE.Matrix4().compose(new THREE.Vector3(X(px), (y != null ? y : TH(px, py)) - sz * 0.2, Z(py)),
          new THREE.Quaternion().setFromEuler(new THREE.Euler(0, (px * 0.37 + py * 0.11) % TAU, 0)), new THREE.Vector3(sz, sz * (sq || 1), sz)), col || null, 1.2);
        if (solid) { go(); K.addBlock(K.circlePx(px, py, sz * 0.8, 8)); } else soft(go);
      };
      // a flat disc (a cut log's end), facing `dir`
      const disc = (k, c, dir, rad, n, col) => { const d = norm(dir), u = norm(cross(Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0], d)), v = cross(d, u); for (let i = 0; i < n; i++) { const a = i / n * TAU, b = (i + 1) / n * TAU, p = (t) => add(c, add(mul(u, Math.cos(t) * rad), mul(v, Math.sin(t) * rad))); const A = p(a), Bq = p(b), nn = cross(sub(A, c), sub(Bq, c)); if (dot(nn, d) < 0) B.tri(k, c, Bq, A, [[0, 0], [rad, 0], [0, rad]], col); else B.tri(k, c, A, Bq, [[0, 0], [rad, 0], [0, rad]], col); } };
      // a tapered tube from A to Bp (n sides), its bark's uv in metres
      function seg(k, A, Bp, ra, rb, n, col) {
        const d = sub(Bp, A), L = Math.hypot(d[0], d[1], d[2]), dir = mul(d, 1 / L);
        const u = norm(cross(Math.abs(dir[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0], dir)), v = cross(dir, u);
        const ring = (c, r, t) => add(c, add(mul(u, Math.cos(t) * r), mul(v, Math.sin(t) * r)));
        for (let i = 0; i < n; i++) {
          const t0 = i / n * TAU, t1 = (i + 1) / n * TAU;
          B.quad(k, ring(A, ra, t0), ring(A, ra, t1), ring(Bp, rb, t1), ring(Bp, rb, t0), [t0 * Math.max(ra, 0.15), 0, t1 * Math.max(ra, 0.15), L], col);
        }
      }
      // a frosted shrub: a low lump of undergrowth with little amber flowers, white frost or heather on it
      const shrub = (px, py, rr, r, solid, kind) => {
        const x = X(px), z = Z(py), y = TH(px, py), h = rr * (0.5 + r() * 0.3);
        B.geom('leafBush', K.ico[Math.floor(r() * 3)], new THREE.Matrix4().compose(new THREE.Vector3(x, y + h * 0.3, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, r() * TAU, 0)), new THREE.Vector3(rr, h, rr)), [0.8, 0.82, 0.92], 2.0);
        const n = Math.max(1, Math.round(rr * 2)), fk = kind || ['fl_sun', 'fl_white', 'fl_violet'][Math.floor(r() * 3)];
        for (let i = 0; i < n; i++) {
          const a = r() * TAU, d = r() * rr * 0.6, cx = x + Math.cos(a) * d, cz = z + Math.sin(a) * d, cy = y + h * (0.6 + r() * 0.5), sz = 0.3 + r() * 0.18, t = r() * Math.PI;
          B.quad(fk, [cx - Math.cos(t) * sz, cy - sz * 0.6, cz - Math.sin(t) * sz], [cx + Math.cos(t) * sz, cy - sz * 0.6, cz + Math.sin(t) * sz], [cx + Math.cos(t) * sz, cy + sz, cz + Math.sin(t) * sz], [cx - Math.cos(t) * sz, cy + sz, cz - Math.sin(t) * sz], [0, 0, 1, 1], fk === 'fl_sun' ? [1.0, 0.62, 0.3] : fk === 'fl_white' ? [0.62, 0.68, 0.88] : null);
        }
        if (solid) K.addBlock(K.circlePx(px, py, rr * 0.7, 8));
      };
      // ---- a ridge tent: two canvas slopes, a back, a front (its flaps tied open, or laced shut), poles, guy lines ----
      function tent(T) {
        const a = T.a, f = [Math.sin(a), 0, Math.cos(a)], rr = [Math.cos(a), 0, -Math.sin(a)];
        const y0 = TH(T.fm[0], T.fm[1]) - 0.05, fm = [X(T.fm[0]), y0, Z(T.fm[1])], bm = add(fm, mul(f, -T.d));
        const FL = add(fm, mul(rr, -T.w / 2)), FR = add(fm, mul(rr, T.w / 2)), BL = add(bm, mul(rr, -T.w / 2)), BR = add(bm, mul(rr, T.w / 2));
        const RF = add(fm, [0, T.h, 0]), RB = add(bm, [0, T.h, 0]);
        const sl = Math.hypot(T.w / 2, T.h), col = CANVAS, dark = CANVAS.map((v) => v * 0.62);
        // the slopes (the canvas sags a little between the ridge and the eaves)
        const sag = (A, Bq, t) => add(add(A, mul(sub(Bq, A), t)), [0, -0.06 * Math.sin(Math.PI * t), 0]);
        for (const [E1, E2] of [[FL, BL], [FR, BR]]) {
          const out = norm(sub(E1, fm)); out[1] = 0.6;
          for (let i = 0; i < 3; i++) { const t0 = i / 3, t1 = (i + 1) / 3; Q('cloth', sag(E1, RF, t0), sag(E2, RB, t0), sag(E2, RB, t1), sag(E1, RF, t1), out, [0, t0 * sl / 2.5, T.d / 2.5, t1 * sl / 2.5], col); }
        }
        B.tri('cloth', BL, BR, RB, [[0, 0], [T.w / 2.5, 0], [T.w / 5, T.h / 2.5]], dark);
        if (T.open) {
          // the flaps tied back: the front's two outer thirds, and a dark doorway between them with the lantern's glow
          const ML = add(fm, mul(rr, -T.w * 0.2)), MR = add(fm, mul(rr, T.w * 0.2)), RM = add(fm, [0, T.h * 0.92, 0]);
          B.tri('cloth', FL, ML, RF, [[0, 0], [T.w * 0.12, 0], [T.w / 5, T.h / 2.5]], col); B.tri('cloth', MR, FR, RF, [[0, 0], [T.w * 0.12, 0], [0, T.h / 2.5]], col);
          // the rolled flaps, and the ties
          for (const s of [-1, 1]) { const p = add(fm, mul(rr, s * T.w * 0.22)); seg('cloth', add(p, mul(f, 0.08)), add(add(p, mul(f, 0.08)), [s * rr[0] * 0.25, T.h * 0.62, s * rr[2] * 0.25]), 0.09, 0.07, 5, [1.9, 1.8, 1.7]); }
          // inside: the groundsheet, the back lit warm, a lantern hanging from the ridge pole
          const IL = add(add(fm, mul(f, -0.25)), mul(rr, -T.w * 0.42)), IR = add(add(fm, mul(f, -0.25)), mul(rr, T.w * 0.42));
          Q('cloth', add(IL, [0, 0.04, 0]), add(IR, [0, 0.04, 0]), add(add(IR, mul(f, -T.d + 0.5)), [0, 0.04, 0]), add(add(IL, mul(f, -T.d + 0.5)), [0, 0.04, 0]), [0, 1, 0], [0, 0, 2, 2], [0.55, 0.42, 0.36]);
          const bl = add(BL, mul(f, 0.06)), br = add(BR, mul(f, 0.06)), rb = add(RB, mul(f, 0.06));
          { const nn = cross(sub(bl, br), sub(rb, br)); if (dot(nn, f) > 0) B.tri('glass', br, bl, rb, [[0, 0], [1, 0], [0.5, 1]], [0.42, 0.24, 0.12]); else B.tri('glass', bl, br, rb, [[0, 0], [1, 0], [0.5, 1]], [0.42, 0.24, 0.12]); }
          const lp = add(add(fm, mul(f, -T.d * 0.55)), [0, T.h - 0.75, 0]);
          K.lantern(lp[0], lp[1], lp[2], null, 0.6, true);
          K.light(PX(lp[0] + f[0] * 2.4), PY(lp[2] + f[2] * 2.4), 70, 0.5, 'warm');
        } else {
          B.tri('cloth', FL, FR, RF, [[0, 0], [T.w / 2.5, 0], [T.w / 5, T.h / 2.5]], col);
          // the laced seam down the middle of the shut front
          soft(() => B.box('rope', fm[0], y0, fm[2], 0.03, T.h * 0.95, 0.03, a, null));
        }
        // the poles: the ridge, and one up each end
        soft(() => { seg('wood', add(RF, [0, 0.03, 0]), add(RB, [0, 0.03, 0]), 0.045, 0.045, 5, [0.7, 0.6, 0.55]); seg('wood', fm, add(RF, [0, 0.22, 0]), 0.045, 0.04, 5, [0.7, 0.6, 0.55]); seg('wood', bm, add(RB, [0, 0.2, 0]), 0.045, 0.04, 5, [0.7, 0.6, 0.55]); });
        // guy lines to pegs, out from each end of the ridge and the eaves
        soft(() => {
          for (const [from, to] of [[RF, add(add(fm, mul(f, 1.6)), [0, 0, 0])], [RB, add(bm, mul(f, -1.6))], [add(FL, [0, 0.3, 0]), add(add(FL, mul(rr, -0.9)), mul(f, 0.5))], [add(FR, [0, 0.3, 0]), add(add(FR, mul(rr, 0.9)), mul(f, 0.5))], [add(BL, [0, 0.3, 0]), add(add(BL, mul(rr, -0.9)), mul(f, -0.5))], [add(BR, [0, 0.3, 0]), add(add(BR, mul(rr, 0.9)), mul(f, -0.5))]]) {
            const g = [to[0], TH(PX(to[0]), PY(to[2])), to[2]];
            seg('rope', from, add(g, [0, 0.12, 0]), 0.012, 0.012, 3); B.box('wood', g[0], g[1] - 0.1, g[2], 0.05, 0.25, 0.05, 0, [0.7, 0.6, 0.55]);
          }
        });
        // solid: the tent's footprint
        K.addBlock([FL, FR, BR, BL].map((p) => [PX(p[0]), PY(p[2])]));
        K.shadeMarks.push(['poly', [FL, FR, BR, BL].map((p) => [PX(p[0]), PY(p[2])]), 0.7]);
        return { f, rr, fm, bm };
      }

      // ---- the camp ----
      const big = tent(BIGTENT); tent(SMALLTENT);
      // the fire ring: rounded stones round a burning fire (the walking map's own block is the ring)
      {
        const [cx, cy] = FIRE.c, x = X(cx), z = Z(cy), y = TH(cx, cy), r = W.rand(5);
        soft(() => { for (let i = 0; i < 16; i++) { const t = i / 16 * TAU + r() * 0.1, s = 0.38 + r() * 0.12; B.geom('stone', K.rockG[i % 3], new THREE.Matrix4().compose(new THREE.Vector3(x + Math.cos(t) * FIRE.rx, y + 0.02, z + Math.sin(t) * FIRE.rz), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, t, 0)), new THREE.Vector3(s, s * 0.9, s * 0.8)), [0.95, 0.92, 0.9], 1); } });
        B.quad('ash', [x - 1.3, y + 0.03, z + 1.0], [x + 1.3, y + 0.03, z + 1.0], [x + 1.3, y + 0.03, z - 1.0], [x - 1.3, y + 0.03, z - 1.0], [0, 0, 1, 1]);
        // logs burning in the middle, crossed
        soft(() => { for (const t of [0.3, 1.9, 3.5, 5.0]) seg('wood', [x + Math.cos(t) * 0.7, y + 0.05, z + Math.sin(t) * 0.55], [x + Math.cos(t) * 0.1, y + 0.35, z + Math.sin(t) * 0.08], 0.1, 0.08, 5, [0.55, 0.45, 0.42]); });
        K.fire(cx, cy, 1.1);
      }
      // the stumps used as seats (the first three are the walking map's own blocks)
      for (const [px, py, rad, h] of STUMPS) {
        const x = X(px), z = Z(py), y = TH(px, py) - 0.1;
        seg('wood', [x, y, z], [x, y + h + 0.1, z], rad, rad * 0.95, 9, [0.85, 0.78, 0.76]);
        disc('cut', [x, y + h + 0.1, z], [0, 1, 0], rad * 0.95, 9);
        K.addBlock(K.circlePx(px, py, rad + 0.04, 10));
      }
      // the firewood: split logs heaped behind the fire, by the big tent
      {
        const cx = 795, cy = 334, r = W.rand(9), x0 = X(cx), z0 = Z(cy), y0 = TH(cx, cy);
        for (let row = 0; row < 3; row++) for (let i = 0; i < 5 - row; i++) {
          const off = (i - (4 - row) / 2) * 0.24, yy = y0 + 0.11 + row * 0.2, rot = 0.4 + (r() - 0.5) * 0.25;
          const ax = x0 + Math.cos(rot) * off, az = z0 - Math.sin(rot) * off, dx = Math.sin(rot) * 0.55, dz = Math.cos(rot) * 0.55;
          seg('wood', [ax - dx, yy, az - dz], [ax + dx, yy, az + dz], 0.11, 0.11, 5, [0.9, 0.78, 0.66]);
          disc('cut', [ax + dx, yy, az + dz], [dx, 0, dz], 0.11, 5); disc('cut', [ax - dx, yy, az - dz], [-dx, 0, -dz], 0.11, 5);
        }
        K.addBlock(K.circlePx(cx, cy, 0.75, 10));
      }
      // the barrels on their sides and a sack, by the small tent; the open crate in front of them
      {
        for (const [px, py, rot] of [[896, 390, 0.2], [926, 396, -0.15]]) {
          const x = X(px), z = Z(py), y = TH(px, py), g = new THREE.CylinderGeometry(0.33, 0.33, 0.85, 10, 1);
          B.geom('wood', g, new THREE.Matrix4().compose(new THREE.Vector3(x, y + 0.32, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, rot, 0, 'YXZ')), new THREE.Vector3(1, 1, 1)), [0.85, 0.66, 0.5], [2.1, 0.9]);
          g.dispose();
          for (const s of [-0.3, 0.3]) { const h = new THREE.CylinderGeometry(0.345, 0.345, 0.05, 10, 1, true); B.geom('iron', h, new THREE.Matrix4().compose(new THREE.Vector3(x + Math.sin(rot) * s, y + 0.32, z + Math.cos(rot) * s), new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, rot, 0, 'YXZ')), new THREE.Vector3(1, 1, 1)), null, 1); h.dispose(); }
          K.addBlock(K.circlePx(px, py, 0.45, 8));
        }
        const sx = X(912), sz = Z(378), sy = TH(912, 378);
        B.geom('cloth', K.ico[2], new THREE.Matrix4().compose(new THREE.Vector3(sx, sy + 0.32, sz), new THREE.Quaternion(), new THREE.Vector3(0.36, 0.42, 0.3)), [1.5, 1.25, 1.0], 1);
        // the crate: four sides and a floor, open at the top, a lid leaning on it, a few things inside
        const cx = X(912), cz = Z(432), cy = TH(912, 432), ry = 0.15;
        B.box('wood', cx, cy, cz, 0.95, 0.06, 0.7, ry, [0.95, 0.8, 0.62]);
        for (const [dx, dz, w, d] of [[0, 0.32, 0.95, 0.06], [0, -0.32, 0.95, 0.06], [0.45, 0, 0.06, 0.7], [-0.45, 0, 0.06, 0.7]]) B.box('wood', cx + dx * Math.cos(ry) + dz * Math.sin(ry), cy, cz - dx * Math.sin(ry) + dz * Math.cos(ry), w, 0.6, d, ry, [0.95, 0.8, 0.62]);
        B.box('wood', cx + 0.62, cy, cz + 0.1, 0.06, 0.62, 0.75, ry + 0.2, [0.9, 0.76, 0.6], { solid: false });
        B.box('cloth', cx - 0.15, cy + 0.35, cz, 0.35, 0.28, 0.3, 0.4, [0.75, 0.62, 0.52]); B.cyl('stone', cx + 0.2, cy + 0.35, cz + 0.05, 0.12, 0.1, 0.3, 7, [1.2, 0.8, 0.6]);
        K.addBlock(K.circlePx(912, 432, 0.6, 10));
      }
      // the lantern post: a rough wooden post, an arm out west toward the fire, the lantern hanging from it, lit
      {
        const [px, py] = POST.at, x = X(px), z = Z(py), y = TH(px, py);
        seg('wood', [x, y - 0.3, z], [x + 0.03, y + POST.h, z], 0.13, 0.11, 7, [0.85, 0.75, 0.7]);
        seg('wood', [x + 0.05, y + POST.h - 0.18, z], [x - 0.72, y + POST.h - 0.12, z], 0.06, 0.055, 5, [0.85, 0.75, 0.7]);
        seg('wood', [x, y + POST.h - 0.75, z], [x - 0.4, y + POST.h - 0.16, z], 0.04, 0.04, 4, [0.85, 0.75, 0.7]);
        K.lantern(x - 0.62, y + POST.h - 0.72, z, null, 0.95, true);
        K.light(px - 18, py + 10, 125, 1.0, 'warm');
        K.addBlock(K.circlePx(px, py, 0.2, 8));
      }
      // round the fire: a kettle on a stone, a bucket by the small tent, a bedroll by the big tent's door
      B.cyl('iron', X(770), TH(770, 410) + 0.02, Z(410), 0.16, 0.13, 0.22, 8);
      B.cyl('wood', X(872), TH(872, 400), Z(400), 0.2, 0.24, 0.38, 8, [0.85, 0.7, 0.55]);
      K.addBlock(K.circlePx(872, 400, 0.26, 8));
      {
        const p = add(big.fm, add(mul(big.f, 0.5), mul(big.rr, -1.5))), g = new THREE.CylinderGeometry(0.2, 0.2, 1.0, 8, 1);
        B.geom('cloth', g, new THREE.Matrix4().compose(new THREE.Vector3(p[0], TH(PX(p[0]), PY(p[2])) + 0.18, p[2]), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -BIGTENT.a + Math.PI / 2, Math.PI / 2, 'YXZ')), new THREE.Vector3(1, 1, 1)), [1.1, 1.0, 1.25], 1); g.dispose();
      }

      // ---- the landing ground: four thick stakes, a twisted rope sagging between them (she steps over it) ----
      {
        const top = 1.55, at = 1.3, low = 0.55;
        for (const [px, py] of STAKES) {
          const x = X(px), z = Z(py), y = TH(px, py);
          seg('wood', [x, y - 0.3, z], [x, y + top, z], 0.24, 0.22, 8, [0.85, 0.75, 0.7]);
          B.cyl('soil', x, y + top - 0.01, z, 0.22, 0.2, 0.06, 8, [1.2, 1.0, 0.85]);
          soft(() => seg('rope', [x, y + at - 0.08, z], [x, y + at + 0.08, z], 0.25, 0.25, 8));
        }
        soft(() => {
          for (let s = 0; s < 4; s++) {
            const [ax, ay] = STAKES[s], [bx, by] = STAKES[(s + 1) % 4], N = 14;
            const pt = (t) => { const px = ax + (bx - ax) * t, py = ay + (by - ay) * t; return [X(px), TH(px, py) + at - (at - low) * Math.sin(Math.PI * t), Z(py)]; };
            for (let i = 0; i < N; i++) seg('rope', pt(i / N), pt((i + 1) / N), 0.035, 0.035, 4);
          }
        });
        for (const [px, py] of TUFTS) {
          const r = W.rand(Math.abs(px * 7 + py)), x = X(px), z = Z(py), y = TH(px, py);
          for (let i = 0; i < 9; i++) {
            const a = r() * TAU, lean = 0.12 + r() * 0.3, h = 0.32 + r() * 0.3, w = 0.04 + r() * 0.03, bx = x + (r() - 0.5) * 0.7, bz = z + (r() - 0.5) * 0.5, ox = Math.cos(a), oz = Math.sin(a);
            B.tri('tuft', [bx - oz * w, y, bz + ox * w], [bx + oz * w, y, bz - ox * w], [bx + ox * lean, y + h, bz + oz * lean], [[0, 0], [0.1, 0], [0.05, 1]]);
          }
        }
      }

      // ---- the plank bridge: a frosted plank deck on two beams, a post at each corner, a rail along each side ----
      {
        const N = 12, n0 = BRIDGE[0], n1 = BRIDGE[1], s1 = BRIDGE[2], s0 = BRIDGE[3];
        const lerp2 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
        for (let i = 0; i < N; i++) {
          const t0 = i / N + 0.006, t1 = (i + 1) / N - 0.006, a = lerp2(n0, s0, t0), b = lerp2(n1, s1, t0), c = lerp2(n1, s1, t1), d = lerp2(n0, s0, t1);
          const ya = deckY((a[0] + b[0]) / 2, (a[1] + b[1]) / 2), yb = deckY((c[0] + d[0]) / 2, (c[1] + d[1]) / 2), k = 0.92 + 0.12 * Math.sin(i * 2.3);
          const P4 = [[a[0] - 6, a[1]], [b[0] + 6, b[1]], [c[0] + 6, c[1]], [d[0] - 6, d[1]]].map(([px, py], j) => [X(px), (j < 2 ? ya : yb), Z(py)]);
          Q('planks', P4[0], P4[1], P4[2], P4[3], [0, 1, 0], [0, 0, Math.hypot(P4[1][0] - P4[0][0], P4[1][2] - P4[0][2]), 0.3], [k, k, k * 1.03]);
          // the planks' edges
          Q('planks', P4[0], P4[1], add(P4[1], [0, -0.07, 0]), add(P4[0], [0, -0.07, 0]), [0, 0, -1], [0, 0, 3, 0.07], [0.7, 0.7, 0.75]);
        }
        // the two beams under it, from bank to bank
        for (const [a, b] of [[n0, s0], [n1, s1]]) { const ia = lerp2(a, b === s0 ? n1 : n0, 0.15), ib = lerp2(b, b === s0 ? s1 : s0, 0.15); seg('wood', [X(ia[0]), 0.0, Z(ia[1])], [X(ib[0]), 0.0, Z(ib[1])], 0.13, 0.13, 6, [0.75, 0.68, 0.66]); }
        // the posts (just outside the deck's corners) and the rails between them
        const POSTS = [[788, 735], [893, 748], [847, 846], [738, 833]];
        for (const [px, py] of POSTS) {
          const x = X(px), z = Z(py), y = Math.min(TH(px, py), 0) - 0.6;
          seg('wood', [x, y, z], [x, deckY(px, py) + 1.0, z], 0.12, 0.11, 7, [0.85, 0.78, 0.76]);
          B.cyl('soil', x, deckY(px, py) + 0.99, z, 0.11, 0.1, 0.03, 7, [1.2, 1.0, 0.85]);
          K.addBlock(K.circlePx(px, py, 0.16, 8));
        }
        for (const [i, j] of [[0, 3], [1, 2]]) {
          const [ax, ay] = POSTS[i], [bx, by] = POSTS[j], M = 6;
          for (let k = 0; k < M; k++) {
            const t0 = k / M, t1 = (k + 1) / M, pa = [ax + (bx - ax) * t0, ay + (by - ay) * t0], pb = [ax + (bx - ax) * t1, ay + (by - ay) * t1];
            seg('wood', [X(pa[0]), deckY(pa[0], pa[1]) + 0.86, Z(pa[1])], [X(pb[0]), deckY(pb[0], pb[1]) + 0.86, Z(pb[1])], 0.045, 0.045, 5, [0.85, 0.78, 0.76]);
            seg('wood', [X(pa[0]), deckY(pa[0], pa[1]) + 0.45, Z(pa[1])], [X(pb[0]), deckY(pb[0], pb[1]) + 0.45, Z(pb[1])], 0.035, 0.035, 4, [0.8, 0.74, 0.72]);
          }
          // solid: the rail (Io stays on the deck, or off it on the banks)
          const dx = bx - ax, dy = by - ay, L = Math.hypot(dx * SX, dy * SZ), nx = -dy * SZ / L * 0.06 / SX, ny = dx * SX / L * 0.06 / SZ;
          K.addBlock([[ax + nx, ay + ny], [bx + nx, by + ny], [bx - nx, by - ny], [ax - nx, ay - ny]]);
        }
        K.shadeMarks.push(['poly', [[n0[0] - 4, n0[1] + 20], [n1[0] + 4, n1[1] + 20], [s1[0] + 4, s1[1] + 14], [s0[0] - 4, s0[1] + 14]], 0.75]);
      }

      // ---- the great mossy boulder, and the lit hollow under its south face (a pocket: the walking map stops at its
      // mouth; here she can walk in under the rock). One lumpy mass, its south face pressed in where the hollow is; its
      // outside is solid, its hollow open. ----
      {
        const C = BOULDER.c, RX = BOULDER.rx, RY = BOULDER.ry, RZ = BOULDER.rz, cx = X(C[0]), cz = Z(C[1]), y0 = TH(C[0], C[1]) - 0.7;
        const g = new THREE.SphereGeometry(1, 56, 32), p = g.attributes.position;
        // how far a point (local metres) lies in the hollow: 1 well inside it, 0 outside
        const inHollow = (x, yw, z) => z > 0 ? (1 - ss(0.72, 1.3, Math.abs(x))) * (1 - ss(1.95, 2.75, yw)) : 0;
        for (let i = 0; i < p.count; i++) {
          const dx = p.getX(i), dy = p.getY(i), dz = p.getZ(i);
          const k = 0.9 + W.vnoise(dx * 2.3 + 5, dz * 2.3 + dy * 1.9 + 3) * 0.2 + (W.vnoise(dx * 7 + 1, dy * 7 + dz * 5) - 0.5) * 0.06;
          const x = dx * RX * k, y = dy * RY * k * (dy > 0.6 ? 0.92 : 1), yw = y0 + y - TH(C[0], C[1]);
          let z = dz * RZ * k;
          const h = inHollow(x, yw, z); if (h > 0) z += (Math.min(z, BOULDER.back) - z) * h;
          p.setXYZ(i, x, y, z);
        }
        g.computeVertexNormals();
        const col = (v) => { const lx = v.x - cx, lz = v.z - cz, h = inHollow(lx, v.y - TH(C[0], C[1]), lz + 0.6); const k = 1 - 0.62 * h; return [k * 0.98, k, k * 1.05]; };
        soft(() => {
          B.geom('rock', g, new THREE.Matrix4().makeTranslation(cx, y0, cz), col, [Math.PI * 2 * RX, Math.PI * RY]);
          // the rocks either side of its mouth (the walking map's own), and stones fallen inside
          rockAt(1170, 168, 0.75, false); rockAt(1249, 170, 0.68, false);
          const r = W.rand(1210); for (let i = 0; i < 5; i++) rockAt(1194 + r() * 32, 100 + r() * 14, 0.16 + r() * 0.1, false);
        });
        g.dispose();
        // solid: the boulder all round the hollow (its footprint, less the hollow's notch), and the two rocks at its mouth
        const n = 30, ex = BOULDER.rx * 0.97 / SX, ez = BOULDER.rz * 0.97 / SZ, nh = 0.95 / SX, tr = Math.acos(nh / ex), tl = Math.PI - tr, back = C[1] + BOULDER.back / SZ;
        const foot = []; for (let i = 0; i <= n; i++) { const t = tl + (Math.PI * 2 - (tl - tr)) * i / n; foot.push([C[0] + Math.cos(t) * ex, C[1] + Math.sin(t) * ez]); }
        foot.push([C[0] + nh, back], [C[0] - nh, back]);
        K.addBlock(foot);
        K.addBlock(K.circlePx(1170, 168, 0.5, 8)); K.addBlock(K.circlePx(1249, 170, 0.48, 8));
        // the lantern set on a flat stone at the back of the hollow, and its glow spilling out onto the path
        const lx = X(1210), lz = Z(back + 8), ly = TH(1210, back + 8);
        B.box('stone', lx, ly, lz, 0.5, 0.22, 0.4, 0.3, [0.8, 0.8, 0.85]);
        K.lantern(lx, ly + 0.4, lz, null, 0.75);
        K.light(1210, 140, 100, 0.95, 'warm');
        K.shadeMarks.push(['dot', 1210, C[1], 110, 0.72]);
      }

      // ---- the fallen log: long, mossy, lying in the undergrowth south-west of the stream ----
      {
        const A = [X(322), TH(322, 866) + 0.35, Z(866)], Bp = [X(588), TH(588, 806) + 0.3, Z(806)];
        seg('logbark', A, Bp, 0.44, 0.36, 9, [0.95, 0.95, 1.0]);
        disc('cut', A, sub(A, Bp), 0.43, 9, [0.85, 0.8, 0.78]); disc('cut', Bp, sub(Bp, A), 0.35, 9, [0.85, 0.8, 0.78]);
        soft(() => { for (const [t, len] of [[0.3, 1.0], [0.55, 0.8], [0.8, 0.7]]) { const p = add(A, mul(sub(Bp, A), t)); seg('logbark', p, add(p, [0.3, len, -0.2]), 0.08, 0.02, 4); } });
        K.addBlock(ribbon([[322, 866], [588, 806]], 0.45));
      }

      // ---- the dead snag east of the north path: a dark broken trunk, leaning ----
      {
        const x = X(1332), z = Z(348), y = TH(1332, 348) - 0.2, col = [0.62, 0.56, 0.58];
        const top = [x - 1.2, y + 5.2, z - 0.6];
        seg('logbark', [x, y, z], top, 0.3, 0.16, 7, col);
        seg('logbark', add([x, y, z], mul(sub(top, [x, y, z]), 0.55)), add(add([x, y, z], mul(sub(top, [x, y, z]), 0.55)), [0.9, 1.0, 0.2]), 0.09, 0.03, 4, col);
        seg('logbark', add([x, y, z], mul(sub(top, [x, y, z]), 0.75)), add(add([x, y, z], mul(sub(top, [x, y, z]), 0.75)), [-0.6, 0.9, 0.5]), 0.07, 0.02, 4, col);
        for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.4; seg('logbark', [x + Math.cos(a) * 0.9, y - 0.1, z + Math.sin(a) * 0.7], [x, y + 0.7, z], 0.06, 0.2, 4, col); }
        K.addBlock(K.circlePx(1332, 348, 0.36, 8));
      }

      // ---- the birches: clumps of thin white stems with fine bare twigs ----
      function birch(px, py, s, seed, stems) {
        const r = W.rand(seed * 7919 + 3), x0 = X(px), z0 = Z(py), y0 = TH(px, py) - 0.2;
        for (let k = 0; k < (stems || 1); k++) {
          const a0 = r() * TAU, bx = x0 + (stems > 1 ? Math.cos(a0) * 0.35 : 0), bz = z0 + (stems > 1 ? Math.sin(a0) * 0.3 : 0);
          const H = (6.5 + r() * 3) * s, lean = [Math.cos(a0) * 0.12 + (r() - 0.5) * 0.1, 1, Math.sin(a0) * 0.12 + (r() - 0.5) * 0.1], rad = (0.11 + r() * 0.04) * s;
          let p = [bx, y0, bz], d = norm(lean), rr = rad;
          const pts = [];
          for (let i = 0; i < 3; i++) {
            const np = add(p, mul(d, H / 3)), nr = rr * 0.72; seg('birch', p, np, rr, nr, 6); pts.push([np, nr]);
            // the dark marks across the white bark
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
        K.shadeMarks.push(['dot', px, py, 26 * s, 0.75]);
      }
      for (const [px, py, n, s] of BIRCH_CLUMPS) birch(px, py, s, px + py, n);

      // ---- the stream: thin ice along its edges and round its stones, the stones themselves, reeds and cattails ----
      {
        const r = W.rand(404), y = LEVEL + 0.015;
        const rim = (poly, w0, w1, skip) => {
          for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
            const [ax, ay] = poly[j], [bx, by] = poly[i], L = Math.hypot((bx - ax) * SX, (by - ay) * SZ); if (L < 0.01) continue;
            let nx = -(by - ay) * SZ / L, nz = (bx - ax) * SX / L;
            if (!W.inPoly(poly, (ax + bx) / 2 + nx * 0.6 / SX, (ay + by) / 2 + nz * 0.6 / SZ)) { nx = -nx; nz = -nz; }
            const n = Math.max(1, Math.round(L / 1.6));
            for (let k = 0; k < n; k++) {
              const t0 = k / n, t1 = (k + 1) / n, pa = [ax + (bx - ax) * t0, ay + (by - ay) * t0], pb = [ax + (bx - ax) * t1, ay + (by - ay) * t1];
              if (skip && (skip(pa[0], pa[1]) || skip(pb[0], pb[1]))) continue;
              const wa = w0 + r() * (w1 - w0), wb = w0 + r() * (w1 - w0), lv = y;
              const A = [X(pa[0]) - nx * 0.25, lv, Z(pa[1]) - nz * 0.25], Bq = [X(pb[0]) - nx * 0.25, lv, Z(pb[1]) - nz * 0.25];
              Q('ice', A, Bq, [Bq[0] + nx * wb, lv, Bq[2] + nz * wb], [A[0] + nx * wa, lv, A[2] + nz * wa], [0, 1, 0], [A[0], A[2], A[0] + 1.6, A[2] + wa]);
            }
          }
        };
        rim(STREAM, 0.5, 1.3, (x_, y_) => y_ > 1900);
        // round each stone, a collar of ice
        for (const [px, py, s] of STREAM_STONES) {
          rockAt(px, py, s, true, [0.95, 0.97, 1.02], 0.8, LEVEL - 0.1);
          const x = X(px), z = Z(py), N = 9, ri = s * 0.75, ro = s * 1.25 + 0.2;
          for (let i = 0; i < N; i++) { const a = i / N * TAU, b = (i + 1) / N * TAU; B.quad('ice', [x + Math.cos(a) * ri, y, z + Math.sin(a) * ri], [x + Math.cos(b) * ri, y, z + Math.sin(b) * ri], [x + Math.cos(b) * ro, y, z + Math.sin(b) * ro], [x + Math.cos(a) * ro, y, z + Math.sin(a) * ro], [0, 0, 1, 0.4]); }
        }
        // the pond's rim of ice too
        const pl = pondLevel() + 0.015;
        for (let i = 0; i < PONDP.length; i++) {
          const [ax, ay] = PONDP[i], [bx, by] = PONDP[(i + 1) % PONDP.length], [cx, cy] = POND.c, ka = 0.82 + r() * 0.08, kb = 0.82 + r() * 0.08;
          if (ax > -360 && ay > -470 && ay < -410) continue;
          const A = [X(ax), pl, Z(ay)], Bq = [X(bx), pl, Z(by)], A2 = [X(cx + (ax - cx) * ka), pl, Z(cy + (ay - cy) * ka)], B2 = [X(cx + (bx - cx) * kb), pl, Z(cy + (by - cy) * kb)];
          Q('ice', A, Bq, B2, A2, [0, 1, 0], [A[0], A[2], A[0] + 2, A[2] + 1.5]);
        }
        // reeds and cattails, at the stream's and the pond's edges
        soft(() => {
          for (const [px, py, sp] of REEDS) {
            const rr = W.rand(Math.abs(px * 3 + py * 7)), x = X(px), z = Z(py), base = Math.max(px < 0 ? pondLevel() : LEVEL, TH(px, py)) - 0.05;
            for (let i = 0; i < 14; i++) {
              const bx = x + (rr() - 0.5) * sp * 1.6, bz = z + (rr() - 0.5) * sp, a = rr() * TAU, h = 0.9 + rr() * 0.8, w = 0.035, lean = 0.1 + rr() * 0.3;
              B.tri('reed', [bx - Math.sin(a) * w, base, bz + Math.cos(a) * w], [bx + Math.sin(a) * w, base, bz - Math.cos(a) * w], [bx + Math.cos(a) * lean, base + h, bz + Math.sin(a) * lean], [[0, 0], [1, 0], [0.5, 1]]);
              if (i % 4 === 0) { const tx = bx + Math.cos(a) * lean * 0.85, tz = bz + Math.sin(a) * lean * 0.85; B.cyl('cattail', tx, base + h * 0.72, tz, 0.035, 0.035, 0.2, 5); }
            }
          }
        });
      }

      // ---- the painting's mossy boulders ----
      for (const [px, py, sz] of ROCKS) rockAt(px, py, sz, true, [1.0, 1.0, 1.04], 0.85);

      // ---- the mossy boulders' companions: small stones half sunk along the paths' edges ----
      {
        const r = W.rand(99), peb = new THREE.IcosahedronGeometry(1, 0); peb.scale(1, 0.6, 1);
        soft(() => {
          for (let i = 0; i < 300; i++) {
            const px = r() * 1536, py = r() * 1024, wd = walkDist(px, py);
            if (wd < 3 || wd > 16 || inWater(px, py) || W.inPoly(BRIDGE, px, py)) continue;
            const sz = 0.14 + r() * 0.18;
            B.geom('rock', peb, new THREE.Matrix4().compose(new THREE.Vector3(X(px), TH(px, py) - sz * 0.2, Z(py)), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, r() * TAU, 0)), new THREE.Vector3(sz, sz, sz)), [0.95, 0.95, 1.0], 0.6);
          }
        });
        peb.dispose();
      }

      // ---- frosted scrub: low lumps of undergrowth with amber flowers, white frost or heather, along the paths' edges
      // on the painting, and along the trails past it ----
      const nearSolid = (px, py) => FIRS.some((t) => Math.hypot(px - t[0], py - t[1]) < 40 * t[2]) || ROCKS.some((q) => Math.hypot(px - q[0], py - q[1]) < 30 * q[2]);
      const campKeep = (px, py) => (px > 600 && px < 1010 && py > 200 && py < 480) || (px > 60 && px < 600 && py > 280 && py < 640) || (px > 1090 && px < 1330 && py > 0 && py < 200) || W.inPoly(BRIDGE, px, py);
      {
        const r = W.rand(777), STEP = 44;
        for (let gy = -40; gy < 1064; gy += STEP) for (let gx = -40; gx < 1576; gx += STEP) {
          const px = gx + (r() - 0.5) * STEP, py = gy + (r() - 0.5) * STEP, rr = 0.55 + r() * 0.6, keep = r();
          const wd = pathDist(px, py);
          if (wd < rr / SX + 4 || wd > 130 || inWater(px, py) || streamOut(px, py) < 20 || campKeep(px, py) || nearSolid(px, py)) continue;
          if (keep > 0.5) continue;
          shrub(px, py, rr, r, rr > 0.95);
        }
        for (const t of TRAILS) for (let i = 1; i < t.pts.length; i++) {
          const [ax, ay] = t.pts[i - 1], [bx, by] = t.pts[i], L = Math.hypot((bx - ax) * SX, (by - ay) * SZ);
          for (let s = r() * 4; s < L; s += 3 + r() * 4) {
            const f = s / L, cx = ax + (bx - ax) * f, cy = ay + (by - ay) * f, nx = -(by - ay) * SZ / L, nz = (bx - ax) * SX / L, rr = 0.6 + r() * 0.55, off = (t.w + 0.7 + rr + r() * 1.4) * (r() < 0.5 ? -1 : 1);
            const px = cx + nx * off / SX, py = cy + nz * off / SZ;
            if ((px >= -40 && px <= 1576 && py >= -40 && py <= 1064) || pathDist(px, py) < rr / SX + 3 || inWater(px, py) || !inBounds(px, py) || nearPlace(px, py) || r() > 0.7) continue;
            shrub(px, py, rr, r, rr > 0.95);
          }
        }
      }

      // ---- the pocket behind the big tent: a sheltered strip between its back and the scrub, the camp's spare bedding
      // and a pack kept there under a tarp; the way in round the tent's west corner ----
      {
        const r = W.rand(212), [tx, ty] = TENTBACK.at;
        // the scrub that closes it on the north and the east
        for (const [px, py, rr] of [[676, 188, 0.95], [710, 182, 1.05], [744, 188, 1.0], [776, 204, 0.95], [800, 236, 0.85], [648, 202, 0.85]]) shrub(px, py, rr, r, true, 'fl_white');
        // the bedrolls and the pack, on a tarp
        const x = X(tx), z = Z(ty), y = TH(tx, ty);
        B.quad('cloth', [x - 1.0, y + 0.03, z + 0.5], [x + 1.0, y + 0.03, z + 0.55], [x + 1.0, y + 0.03, z - 0.55], [x - 1.0, y + 0.03, z - 0.5], [0, 0, 2, 1], [1.1, 1.15, 1.35]);
        for (const [dx, col] of [[-0.45, [1.4, 1.0, 0.9]], [0.05, [1.05, 1.1, 1.45]]]) { const g = new THREE.CylinderGeometry(0.22, 0.22, 0.9, 8, 1); B.geom('cloth', g, new THREE.Matrix4().compose(new THREE.Vector3(x + dx, y + 0.24, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)), new THREE.Vector3(1, 1, 1)), col, 1); g.dispose(); }
        B.box('cloth', x + 0.6, y, z - 0.05, 0.45, 0.6, 0.32, 0.3, [1.3, 1.05, 0.85]); B.box('cloth', x + 0.6, y + 0.6, z - 0.05, 0.47, 0.1, 0.34, 0.3, [1.15, 0.92, 0.78], { solid: false });
        K.addBlock(K.circlePx(tx + 15, ty, 0.35, 8));
      }

      // ---- the hunters' lean-to in the north: a ridge pole on two forked posts, a canvas roof sloping from it down to the
      // ground at the back, its sides closed with fir boughs, against a great rock; open to the south, a cold fire pit and
      // a log for a bench in front of it ----
      {
        const [cx, cy] = LEANTO.at, x = X(cx), z = Z(cy), y = TH(cx, cy), r = W.rand(61);
        const W2 = 1.8, hf = 2.3, zf = z + 0.9, zb = zf - 2.6, yb = y + 0.05;
        // the rock behind it
        B.geom('rock', K.rockG[0], new THREE.Matrix4().compose(new THREE.Vector3(x + 0.3, y + 0.4, zb - 1.0), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0.4, 0)), new THREE.Vector3(3.4, 3.4, 1.7)), [1.0, 1.0, 1.04], 2.2);
        // the forked posts and the ridge pole
        for (const s2 of [-1, 1]) {
          seg('wood', [x + s2 * W2, y - 0.2, zf], [x + s2 * W2, y + hf + 0.1, zf], 0.08, 0.07, 6, [0.85, 0.76, 0.7]);
          soft(() => seg('wood', [x + s2 * W2, y + hf - 0.1, zf], [x + s2 * (W2 + 0.25), y + hf + 0.35, zf + 0.05], 0.04, 0.03, 4, [0.85, 0.76, 0.7]));
        }
        soft(() => {
          seg('wood', [x - W2 - 0.4, y + hf, zf], [x + W2 + 0.4, y + hf, zf], 0.07, 0.065, 6, [0.85, 0.76, 0.7]);
          // the rafters, down from the ridge pole to the ground at the back
          for (let i = 0; i <= 4; i++) { const xx = x - W2 + 0.1 + i * (W2 * 2 - 0.2) / 4; seg('wood', [xx, y + hf + 0.04, zf + 0.12], [xx, yb - 0.1, zb - 0.1], 0.04, 0.04, 4, [0.85, 0.76, 0.7]); }
          // the canvas over them, sagging a little between the rafters
          const N = 4;
          for (let i = 0; i < N; i++) {
            const t0 = i / N, t1 = (i + 1) / N, P_ = (xx, t) => [xx, y + hf + 0.1 + (yb - y - hf - 0.1) * t - 0.08 * Math.sin(Math.PI * t), zf + 0.2 + (zb - 0.15 - zf - 0.2) * t];
            Q('cloth', P_(x - W2 - 0.25, t0), P_(x + W2 + 0.25, t0), P_(x + W2 + 0.25, t1), P_(x - W2 - 0.25, t1), [0, 1, 0.5], [0, t0 * 1.4, 1.6, t1 * 1.4], CANVAS);
          }
          // its sides: canvas triangles from the ridge pole down to the ground at the back, fir boughs heaped at their feet
          for (const s2 of [-1, 1]) {
            const xx = x + s2 * (W2 + 0.12);
            Q('cloth', [xx, y - 0.05, zf + 0.15], [xx, y + hf + 0.08, zf + 0.15], [xx, yb - 0.05, zb - 0.1], [xx, y - 0.05, zf + 0.1], [s2, 0, 0], [0, 0, 2.6, 2.3], CANVAS.map((v) => v * 0.8));
            for (let i = 0; i < 3; i++) B.geom('boughs', K.ico[i % 3], new THREE.Matrix4().compose(new THREE.Vector3(xx + s2 * 0.25, y + 0.1, zf - 0.4 - i * 0.8), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, r() * 3, 0)), new THREE.Vector3(0.5, 0.45, 0.55)), [0.8, 0.85, 0.9], 1.2);
          }
          // inside, under the low back of the roof: a bed of boughs and a rolled hide
          B.geom('boughs', K.ico[1], new THREE.Matrix4().compose(new THREE.Vector3(x + 0.3, y + 0.05, zb + 0.9), new THREE.Quaternion(), new THREE.Vector3(1.2, 0.16, 0.6)), [0.7, 0.75, 0.8], 1.5);
          const g = new THREE.CylinderGeometry(0.18, 0.18, 0.8, 8, 1); B.geom('cloth', g, new THREE.Matrix4().compose(new THREE.Vector3(x - 0.9, y + 0.18, zb + 1.0), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, Math.PI / 2)), new THREE.Vector3(1, 1, 1)), [1.2, 0.95, 0.8], 1); g.dispose();
        });
        // solid: the rock, the low back of the roof (too low to stand under), its bough sides, the posts
        K.addBlock([[cx - 85, PY(zb - 2.4)], [cx + 95, PY(zb - 2.4)], [cx + 95, PY(zb + 0.15)], [cx - 85, PY(zb + 0.15)]]);
        K.addBlock([[PX(x - W2 - 0.4), PY(zb)], [PX(x + W2 + 0.4), PY(zb)], [PX(x + W2 + 0.4), PY(zf - 0.75)], [PX(x - W2 - 0.4), PY(zf - 0.75)]]);
        for (const s2 of [-1, 1]) { K.addBlock([[PX(x + s2 * W2 - 0.35), PY(zb)], [PX(x + s2 * W2 + 0.45), PY(zb)], [PX(x + s2 * W2 + 0.45), PY(zf - 0.05)], [PX(x + s2 * W2 - 0.35), PY(zf - 0.05)]]); K.addBlock(K.circlePx(PX(x + s2 * W2), PY(zf), 0.13, 6)); }
        // the cold fire pit in front, ringed with stones, and the bench log beside it
        const fx = x + 2.2, fz = zf + 1.5, fy = TH(PX(fx), PY(fz));
        B.quad('ash', [fx - 0.6, fy + 0.03, fz + 0.5], [fx + 0.6, fy + 0.03, fz + 0.5], [fx + 0.6, fy + 0.03, fz - 0.5], [fx - 0.6, fy + 0.03, fz - 0.5], [0, 0, 1, 1]);
        soft(() => { for (let i = 0; i < 9; i++) { const t = i / 9 * TAU, s = 0.22 + r() * 0.08; B.geom('stone', K.rockG[i % 3], new THREE.Matrix4().compose(new THREE.Vector3(fx + Math.cos(t) * 0.75, fy, fz + Math.sin(t) * 0.6), new THREE.Quaternion(), new THREE.Vector3(s, s, s)), [0.95, 0.95, 1.0], 1); } });
        for (const [a, b] of [[[-0.2, 0.4], [0.3, -0.1]], [[0.25, 0.35], [-0.2, -0.15]]]) seg('wood', [fx + a[0], fy + 0.06, fz + a[1]], [fx + b[0], fy + 0.12, fz + b[1]], 0.06, 0.05, 5, [0.35, 0.3, 0.3]);
        K.addBlock(K.circlePx(PX(fx), PY(fz), 0.85, 10));
        seg('logbark', [fx + 1.6, fy + 0.25, fz - 0.9], [fx + 1.8, fy + 0.25, fz + 1.0], 0.25, 0.24, 7);
        disc('cut', [fx + 1.6, fy + 0.25, fz - 0.9], [-0.1, 0, -1], 0.25, 7); disc('cut', [fx + 1.8, fy + 0.25, fz + 1.0], [0.1, 0, 1], 0.24, 7);
        K.addBlock(ribbon([[PX(fx + 1.6), PY(fz - 0.9)], [PX(fx + 1.8), PY(fz + 1.0)]], 0.3));
        K.shadeMarks.push(['dot', cx, PY(zb + 0.6), 30, 0.72]);
      }

      // ---- the half-frozen pond in the north-west: the engine lays its water and the jetty; birches lean over it, and an
      // old boat lies upturned on its north shore ----
      {
        birch(-560, -560, 0.9, 77, 2); birch(-250, -540, 0.85, 78, 1); birch(-620, -330, 0.8, 79, 2);
        // an old upturned boat drawn up on the north shore
        const bx = X(-420), bz = Z(-585), by = TH(-420, -585), L = 3.4, Wb = 1.1;
        const hull = new THREE.CylinderGeometry(Wb / 2, Wb / 2, L, 10, 1, false, 0, Math.PI); hull.rotateZ(Math.PI / 2);
        B.geom('planks', hull, new THREE.Matrix4().compose(new THREE.Vector3(bx, by + 0.02, bz), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0.2, 0)), new THREE.Vector3(1, 0.75, 1)), [0.8, 0.78, 0.82], [2, 3]); hull.dispose();
        K.addBlock(W.rectPoly([-420 - 45, -585 - 14, -420 + 45, -585 + 14]));
      }

      // ---- the ring of birches in the west, round a lone standing boulder ----
      {
        const [cx, cy] = BIRCHES.c, r = W.rand(88);
        for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + 0.3 + (r() - 0.5) * 0.25, d = BIRCHES.r + (r() - 0.5) * 1.2; if (Math.cos(a) > 0.88) continue; birch(cx + Math.cos(a) * d / SX, cy + Math.sin(a) * d / SZ, 0.85 + r() * 0.3, 900 + i, 1 + Math.floor(r() * 2)); }
        // the stone: tall, grey, leaning a little, rounded at its shoulders
        {
          const sw = 1.5, sd = 0.9, sh = 3.1, base = TH(cx, cy) - 0.3, gs = new THREE.BoxGeometry(1, 1, 1, 3, 9, 2), pp = gs.attributes.position;
          const hh = (a, b, c) => { const v = Math.sin(a * 127.1 + b * 311.7 + c * 74.7 + 7) * 43758.5453; return v - Math.floor(v); };
          for (let i = 0; i < pp.count; i++) { const a = pp.getX(i), b = pp.getY(i), c = pp.getZ(i), t = b + 0.5, wk = 1 - 0.28 * t; let yy = t; if (t > 0.78) yy -= a * a * 0.6 * ss(0.78, 1, t); const n = (hh(a, b, c) - 0.5) * 0.08; pp.setXYZ(i, a * wk * sw + n + t * 0.25, yy * sh + n, c * sd * (1 - 0.2 * t) + n * 0.5); }
          gs.computeVertexNormals();
          B.geom('rock', gs, new THREE.Matrix4().compose(new THREE.Vector3(X(cx), base, Z(cy)), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0.5, 0)), new THREE.Vector3(1, 1, 1)), [1.0, 1.02, 1.06], [sw * 1.5, sh]);
          gs.dispose();
          K.addBlock(K.circlePx(cx, cy, 0.95, 10));
        }
        for (let i = 0; i < 6; i++) { const a = r() * TAU, d = 2 + r() * 2.5; rockAt(cx + Math.cos(a) * d / SX, cy + Math.sin(a) * d / SZ, 0.25 + r() * 0.2, false); }
        K.shadeMarks.push(['dot', cx, cy, 40, 0.7]);
      }

      // ---- the woodcutters' clearing in the south: stumps of felled firs, the chopping block with its axe, a sawbuck
      // holding a log, a stack of split wood, chips on the ground ----
      {
        const [cx, cy] = WOODCUT.c, r = W.rand(55);
        for (const [dx, dy, rad] of [[-120, -60, 0.4], [110, -80, 0.45], [150, 40, 0.38], [-150, 50, 0.42], [40, 100, 0.36], [-70, -40, 0.35]]) {
          const px = cx + dx, py = cy + dy, x = X(px), z = Z(py), y = TH(px, py) - 0.1;
          seg('wood', [x, y, z], [x, y + 0.5, z], rad, rad * 0.95, 9, [0.85, 0.78, 0.76]);
          disc('cut', [x, y + 0.5, z], [0, 1, 0], rad * 0.95, 9);
          K.addBlock(K.circlePx(px, py, rad + 0.04, 10));
        }
        // the chopping block and the axe in it
        { const x = X(cx), z = Z(cy), y = TH(cx, cy) - 0.05; seg('wood', [x, y, z], [x, y + 0.6, z], 0.38, 0.36, 9, [0.9, 0.8, 0.75]); disc('cut', [x, y + 0.6, z], [0, 1, 0], 0.36, 9);
          seg('wood', [x + 0.05, y + 0.62, z], [x + 0.35, y + 1.25, z + 0.25], 0.025, 0.025, 4, [0.95, 0.8, 0.6]); B.box('iron', x + 0.02, y + 0.55, z - 0.02, 0.06, 0.14, 0.22, 0.6, null, { solid: false });
          K.addBlock(K.circlePx(cx, cy, 0.45, 10)); }
        // the sawbuck: two crossed pairs of legs and a log across them
        { const px = cx + 70, py = cy - 20, x = X(px), z = Z(py), y = TH(px, py);
          for (const dz of [-0.5, 0.5]) for (const s of [-1, 1]) seg('wood', [x + s * 0.45, y - 0.05, z + dz], [x - s * 0.3, y + 1.0, z + dz], 0.05, 0.05, 4, [0.85, 0.75, 0.68]);
          seg('logbark', [x - 0.1, y + 0.72, z - 1.3], [x - 0.05, y + 0.74, z + 1.3], 0.22, 0.2, 8);
          K.addBlock(W.rectPoly([px - 14, py - 28, px + 14, py + 28])); }
        // the stack of split wood between two stakes
        { const px = cx - 90, py = cy + 10, x = X(px), z = Z(py), y = TH(px, py);
          for (let row = 0; row < 5; row++) for (let i = 0; i < 9; i++) { const xx = x - 1.1 + i * 0.26 + (row % 2) * 0.12, yy = y + 0.12 + row * 0.22; if (xx > x + 1.1) continue; seg('wood', [xx, yy, z - 0.45], [xx, yy, z + 0.45], 0.11, 0.11, 5, [0.95, 0.85, 0.75]); disc('cut', [xx, yy, z + 0.45], [0, 0, 1], 0.11, 5); disc('cut', [xx, yy, z - 0.45], [0, 0, -1], 0.11, 5); }
          for (const s of [-1, 1]) seg('wood', [x + s * 1.25, y - 0.2, z], [x + s * 1.25, y + 1.4, z], 0.06, 0.05, 5, [0.8, 0.7, 0.62]);
          K.addBlock(W.rectPoly([px - 33, py - 11, px + 33, py + 11])); }
        // chips scattered pale round the block
        soft(() => { for (let i = 0; i < 40; i++) { const a = r() * TAU, d = 0.4 + r() * 2.2, x = X(cx) + Math.cos(a) * d, z = Z(cy) + Math.sin(a) * d, y = TH(cx, cy) + 0.02, s = 0.06 + r() * 0.05; B.quad('cut', [x - s, y, z + s * 0.5], [x + s, y, z + s * 0.5], [x + s, y, z - s * 0.5], [x - s, y, z - s * 0.5], [0, 0, 0.1, 0.1]); } });
      }

      // ---- the waymarker on the road east: a cairn of stones with a post in it, two blank boards pointing the ways ----
      {
        const [px, py] = WAYMARK.at, x = X(px), z = Z(py), y = TH(px, py), r = W.rand(31);
        soft(() => { for (let i = 0; i < 14; i++) { const lv = Math.floor(i / 5), a = i * 2.4, d = (0.7 - lv * 0.22) * (0.8 + r() * 0.3), s = 0.38 - lv * 0.08; B.geom('stone', K.rockG[i % 3], new THREE.Matrix4().compose(new THREE.Vector3(x + Math.cos(a) * d, y + lv * 0.32, z + Math.sin(a) * d * 0.8), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, a, 0)), new THREE.Vector3(s, s * 0.8, s)), [0.95, 0.95, 1.0], 1); } });
        seg('wood', [x, y - 0.2, z], [x, y + 2.3, z], 0.08, 0.07, 6, [0.85, 0.76, 0.7]);
        for (const [s, hh] of [[1, 2.0], [-1, 1.7]]) { B.box('wood', x + s * 0.42, y + hh, z + 0.02, 0.8, 0.2, 0.05, s > 0 ? 0.05 : -0.08, [0.95, 0.85, 0.75], { solid: false }); B.tri('wood', [x + s * 0.82, y + hh, z + 0.05], [x + s * 0.82, y + hh + 0.2, z + 0.05], [x + s * 0.98, y + hh + 0.1, z + 0.05], [[0, 0], [0, 0.2], [0.16, 0.1]], [0.95, 0.85, 0.75]); }
        K.addBlock(K.circlePx(px, py, 0.85, 10));
      }

      // ---- solid: the firs (their lowest boughs come down to about Io's knees, so she walks round them, not through) ----
      {
        const all = ((G.W3D_TREES || {})[ID] || []).concat(P[ID].extraTrees || []);
        for (const [tx, ty, s, kind] of all) if (kind === 1 && tx > -1536 && tx < 3072) K.addBlock(K.circlePx(tx, ty, Math.min(0.62 * s, 1.15), 8));
      }

      // ---- a hedge of frosted scrub along the open ground's edge: lumps in one or two rows just inside it, solid, broken
      // only by the stream and the way out ----
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
            if (inWater(px, py) || streamOut(px, py) < 24 || atExit(px, py) || pathDist(px, py) < 24) continue;
            const rr = 1.05 + r() * 0.6, h = rr * (0.8 + r() * 0.5), y = TH(px, py), x = X(px), z = Z(py);
            B.geom('leafBush', lump, new THREE.Matrix4().compose(new THREE.Vector3(x, y + h * 0.35, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, r() * TAU, 0)), new THREE.Vector3(rr, h, rr)), [0.74, 0.76, 0.86], 2.0);
            const t = r() * Math.PI, sz = 0.36, cy = y + h * 1.0, fk = r() < 0.5 ? 'fl_white' : 'fl_sun';
            B.quad(fk, [x - Math.cos(t) * sz, cy - sz * 0.6, z - Math.sin(t) * sz], [x + Math.cos(t) * sz, cy - sz * 0.6, z + Math.sin(t) * sz], [x + Math.cos(t) * sz, cy + sz, z + Math.sin(t) * sz], [x - Math.cos(t) * sz, cy + sz, z - Math.sin(t) * sz], [0, 0, 1, 1], fk === 'fl_sun' ? [1.0, 0.62, 0.3] : [0.62, 0.68, 0.88]);
            K.addBlock(K.circlePx(px, py, rr * 0.8, 8));
          }
        }
        lump.dispose();
        // and where the stream leaves the open ground, a tangle of fallen firs across it, so its way out looks closed too
        for (const [ax, ay, bx, by] of [[1960, 1770, 1730, 1820], [1990, 1830, 1760, 1790]]) seg('logbark', [X(ax), TH(ax, ay) + 0.4, Z(ay)], [X(bx), TH(bx, by) + 0.5, Z(by)], 0.38, 0.3, 8);
      }

      // ---- the mist: low banks of cold blue lying between the trees (soft glows, drawn last) ----
      for (const [px, py, s] of MIST) K.halo(X(px), TH(px, py) + s * 0.1, Z(py), s, [0.13, 0.17, 0.3]);
    },
  };
})(window);
