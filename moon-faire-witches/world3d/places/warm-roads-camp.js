// warm-roads-camp.js: the Warm Roads camp in 3D, where the airship lands. Its painting
// (reference/art/walk/wilds/walk-warm-roads-camp.png, 1536 x 1024) is the middle, laid out in the painting's own pixels as
// src/game/maps.js keeps the walking map: the roped landing ground on the west; the round stone hut dug into its heathery
// bank, its door open and lit, the sun carved over it; the two canvas tents, the chests, stumps and the stool round the
// cooking fire with its tripod and kettle; the lantern on its post; the low dry-stone walls; the old Warm Road (flagstones
// with amber in their seams) running east; the earth path north to the lookout, and south over the stream on its slab
// bridge. Round it the warm, dry moor goes on one painting each way in fog (Chris, November 16: wild places are wide open
// fields, with pockets to find): rolling heather and gorse, boulders, clumps of birch, the stream winding east and west,
// and places to find: the tor in the west, the cairn on its hill past the lookout, the old sheepfold in the south, the pool
// where the stream widens (with stepping stones over it), and the milestone and a broken cart along the road east, which
// is the way on to the Ember Line road. Two pockets: the nook behind the hut, and the ledge behind the boulders by the
// stream. The hut itself is open: Io can step inside.
// Where Io can walk: the walking map's own walk and block areas, unchanged, plus all the open ground inside open.bounds,
// less the stream and everything solid (every boulder, trunk, gorse bush, wall, tent, chest and stump, the hut's wall).
// No keepsake lives here (envoi-final-draft/items/items.js has none whose home is this map).
// The texture ids are the texture pack's (texture-packs/wilds-south/warm-roads-camp/inventory.md).
// Heights are metres: the camp, the road and the landing ground are 0; the stream runs a metre down in its little channel
// (its water at -0.95); the hut is dug into a bank that rises about a metre behind it; the lookout is a low mound; past
// the painting the moor rolls (about 2 m up and down), gentler along the trails, and the cairn stands on a hill 3 m up.
(function (G) {
  'use strict';
  const P = G.W3D_PLACES = G.W3D_PLACES || {};
  const ID = 'warm-roads-camp';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ss = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const SX = 0.04, SZ = 0.05;
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
  const W3D = () => G.W3D;
  const inPoly = (poly, x, y) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
  const mDist = (ax, ay, bx, by) => Math.hypot((ax - bx) * SX, (ay - by) * SZ);

  // ---- the stream: its middle and half width (px, down the painting) along it, west to east. On the painting traced
  // from it; past it, it winds on out of the open ground both ways, widening into the pool in the south-east ----
  const SC = [[-1800, 690, 28], [-1400, 642, 28], [-1000, 690, 28], [-700, 722, 26], [-400, 762, 26], [-150, 744, 24], [80, 758, 22],
    [230, 770, 20], [320, 780, 20], [420, 798, 20], [520, 820, 20], [610, 845, 20], [700, 862, 20], [800, 872, 20], [905, 880, 20],
    [1000, 880, 22], [1100, 895, 22], [1200, 915, 25], [1320, 932, 30], [1450, 955, 35], [1536, 972, 32], [1700, 1000, 26], [1900, 1015, 26],
    [2100, 1040, 28], [2230, 1080, 48], [2330, 1108, 88], [2440, 1114, 92], [2540, 1100, 48], [2650, 1095, 26], [2850, 1062, 28], [3100, 1040, 28], [3400, 1040, 28]];
  const streamAt = (x) => { if (x <= SC[0][0]) return [SC[0][1], SC[0][2]]; for (let i = 1; i < SC.length; i++) if (x <= SC[i][0]) { const [xa, ya, ha] = SC[i - 1], [xb, yb, hb] = SC[i], t = (x - xa) / (xb - xa); return [ya + (yb - ya) * t, ha + (hb - ha) * t]; } const l = SC[SC.length - 1]; return [l[1], l[2]]; };
  // how far a point is outside the stream's banks (px; less than 0 in the water)
  const streamD = (x, y) => { const [c, hw] = streamAt(x); return Math.abs(y - c) - hw; };
  const STREAM = SC.map(([x, y, h]) => [x, Math.round(y - h)]).concat(SC.slice().reverse().map(([x, y, h]) => [x, Math.round(y + h)]));
  const LEVEL = -0.95;
  // the stepping stones: one way over west of the camp, one at the pool's outflow
  const FORDS = [{ x: -700, n: 5 }, { x: 2650, n: 5 }];

  // ---- the trails past the painting: centre lines (px) and half widths (m). The painting's own paths are the walking
  // map's walk areas; these carry them on to the way out and to the places to find. The road is the old Warm Road. ----
  const ROAD = { w: 1.75, pts: [[1500, 453], [1700, 444], [1900, 418], [2100, 404], [2300, 426], [2500, 448], [2680, 440], [2752, 440]] };
  const ROAD_ON = [[2680, 440], [2752, 440], [2900, 436], [3080, 430]];          // and on past the way on, into the fog
  const TRAILS = [
    ROAD,
    { id: 'cairn', w: 0.7, pts: [[1022, 40], [1032, -120], [994, -300], [1024, -470], [1072, -610]] },
    { id: 'heath-north', w: 0.6, pts: [[228, 330], [196, 210], [160, 80], [130, -60], [40, -300], [-150, -400], [-330, -430]] },
    { id: 'tor', w: 0.7, pts: [[104, 430], [-60, 440], [-260, 402], [-480, 428], [-660, 392], [-730, 370]] },
    { id: 'tor-north', w: 0.6, pts: [[-330, -430], [-520, -300], [-700, -60], [-800, 160], [-800, 250]] },
    { id: 'fold', w: 0.7, pts: [[840, 1020], [806, 1140], [726, 1280], [630, 1420], [560, 1530]] },
    { id: 'fold-west', w: 0.6, pts: [[440, 1590], [250, 1560], [10, 1450], [-250, 1260], [-480, 1020], [-640, 830], [-700, 768]] },
    { id: 'ford-west', w: 0.6, pts: [[-700, 676], [-720, 520], [-724, 420]] },
    { id: 'pool', w: 0.6, pts: [[932, 948], [980, 1032], [1150, 1062], [1400, 1068], [1600, 1072], [1850, 1088], [2080, 1125], [2250, 1192], [2420, 1240], [2580, 1190], [2650, 1140]] },
    { id: 'cart', w: 0.6, pts: [[2650, 1050], [2660, 940], [2610, 780], [2500, 620], [2420, 478]] },
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
  const trailDist = (x, y) => { let d = 1e9; for (const t of TRAILS) for (let i = 1; i < t.pts.length; i++) d = Math.min(d, segDist(x, y, t.pts[i - 1], t.pts[i])); return d; };
  const lineDist = (x, y, pts) => { let d = 1e9; for (let i = 1; i < pts.length; i++) d = Math.min(d, segDist(x, y, pts[i - 1], pts[i])); return d; };
  const ROAD_ALL = ROAD.pts.concat(ROAD_ON.slice(2));
  const ellipse = (c, rx, ry, n, wob) => Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2, k = 1 + (wob || 0) * Math.sin(a * 3 + 1.3) * Math.cos(a * 2); return [Math.round(c[0] + Math.cos(a) * rx * k), Math.round(c[1] + Math.sin(a) * ry * k)]; });
  const circleM = (c, r, n) => ellipse(c, r / SX, r / SZ, n || 20, 0);

  // ---- the camp ----
  const HUT = { c: [760, 234], R: 4.1, t: 0.55, h: 2.6, door: 1.5224, gap: 0.178 };   // the round hut: middle, radius (m), wall, door's angle
  const HUT_FLOOR = circleM(HUT.c, HUT.R - HUT.t - 0.05, 22);
  const LOOK = { c: [1020, 22], R: 2.6 };                         // the lookout's round paving at the north path's end
  const FIRE = { c: [793, 456], rx: 1.36, rz: 0.95 };             // the fire's ring of stones (m)
  const TENTS = [{ x0: 610, x1: 695, y0: 386, y1: 430, open: 'e' }, { x0: 842, x1: 927, y0: 363, y1: 406, open: 'w' }];
  const STAKES = [[126, 337], [527, 340], [546, 543], [86, 543]];  // the landing ground's stakes: NW, NE, SE, SW
  const SLAB = { x0: 905, x1: 946, y0: 826, y1: 936 };             // the slab bridge's deck
  // ---- the places to find, and the pockets ----
  const TOR = { c: [-820, 300] };                                  // the tor: great boulders stacked on a knoll
  const CAIRN = { c: [1090, -700], hill: [1090, -690, 430, 330, 3.2] };   // the cairn on its hill
  const FOLD = { c: [520, 1650], r: 5.2, gap: -Math.PI / 2 };      // the old sheepfold: its way in on the north
  const POOL = { c: [2390, 1112] };                                // the pool where the stream widens
  const CART = { at: [2290, 506] };                                // the broken cart beside the road
  const MILE = { at: [1960, 372] };                                // the milestone
  const NOOK = [[598, 180], [626, 150], [668, 120], [712, 104], [744, 100], [768, 108], [770, 134], [736, 150], [700, 158], [668, 172], [648, 196], [622, 214], [600, 206]];   // behind the hut
  const LEDGE = { c: [712, 822] };                                 // the ledge behind the boulders, on the stream's north bank
  // the way along the stream's north bank to it, under the boulders (kept clear of the engine's bank rocks)
  const LEDGE_WAY = (() => { const top = [], bot = []; for (let x = 560; x <= 880; x += 20) { const [c, hw] = streamAt(x); top.push([x, Math.round(c - hw - 18)]); bot.push([x, Math.round(c - hw - 1)]); } return top.concat(bot.reverse()); })();

  // ---- the ground ----
  const roll = (x, y, t) => (W3D().vnoise(x / 420 + 7.1, y / 420) - 0.5) * 4.2 + t * (W3D().vnoise(x / 140, y / 140 + 3.3) - 0.5) * 1.2;
  const hutD = (x, y) => mDist(x, y, HUT.c[0], HUT.c[1]);
  function ground(x, y) {
    const sd = streamD(x, y);
    let h = -1.05 * (1 - ss(-4, 46, sd));                                            // the stream's channel
    // the heathery bank the hut is dug into, rising behind it (none inside the hut)
    const hd = hutD(x, y);
    if (hd > HUT.R - 0.2) h += 1.0 * (1 - ss(0.4, 1, Math.hypot((x - 770) / 270, (y - 70) / 135))) * ss(HUT.R - 0.2, HUT.R + 0.6, hd);
    h += 0.35 * (1 - ss(LOOK.R + 0.3, LOOK.R + 2.4, mDist(x, y, LOOK.c[0], LOOK.c[1])));   // the lookout's low mound, level on top
    // rolling moor past the painting: none on it or along the stream, gentler along the trails
    const out = Math.hypot(Math.max(0, -x, x - 1536), Math.max(0, -y, y - 1024)), k = ss(0, 300, out) * ss(60, 260, sd);
    if (k > 0) h += k * (0.3 + 0.7 * ss(40, 240, lineDist(x, y, ROAD_ALL))) * roll(x, y, ss(30, 100, trailDist(x, y)));   // (the road keeps nearly level)
    const [hx, hy, hrx, hry, hh] = CAIRN.hill;
    h += hh * (1 - ss(0.25, 1, Math.hypot((x - hx) / hrx, (y - hy) / hry)));          // the cairn's hill
    return h;
  }
  const level = () => LEVEL;

  // the walking map's own walk areas (for keeping things off them), with their boxes
  let WB = null;
  const mapWalk = () => WB || (WB = (((G.MAPS || {})[ID] || { walk: [] }).walk).map((p) => { let a = 1e9, b = 1e9, c = -1e9, e = -1e9; for (const [x, y] of p) { a = Math.min(a, x); b = Math.min(b, y); c = Math.max(c, x); e = Math.max(e, y); } return { p, b: [a, b, c, e] }; }));

  // the painting's boulders: [x, y (their foot), size (m)]
  const BOULDERS = [
    // north-west, round the faint path north
    [40, 282, 1.6], [122, 286, 1.1], [86, 168, 1.3], [462, 96, 0.8], [528, 98, 0.9], [552, 168, 1.5], [492, 214, 0.9], [634, 136, 1.2], [410, 104, 0.7],
    [300, 60, 1.0], [150, 40, 0.9],
    // round the lookout and down the north path's sides
    [948, 70, 1.0], [960, 106, 0.75], [1084, 94, 0.85], [1094, 62, 1.0], [952, 24, 1.1], [972, -16, 1.0], [1072, -16, 1.0], [1092, 22, 1.0],
    [976, 140, 1.0], [1004, 166, 0.32], [926, 112, 0.9], [1104, 40, 1.0], [1150, 72, 1.0], [1046, 446, 0.5],
    // north-east, between the north path and the right edge
    [1216, 222, 1.7], [1476, 292, 1.8], [1526, 232, 1.0], [1132, 380, 1.3], [1232, 392, 1.2], [1180, 160, 0.8], [1330, 150, 0.9], [1395, 380, 0.9],
    // south of the road, east
    [1370, 700, 2.0], [1300, 680, 1.0], [1030, 822, 1.3], [1244, 832, 1.3], [1470, 862, 1.2], [1520, 820, 1.0], [1150, 760, 0.8],
    // south-west, between the landing ground and the stream
    [60, 632, 1.3], [342, 644, 1.2], [384, 692, 1.8], [442, 732, 0.9], [532, 724, 1.2], [310, 830, 1.4], [652, 786, 1.5], [720, 776, 1.3], [586, 774, 1.0],
    [180, 640, 0.9], [258, 700, 1.0], [470, 650, 0.8],
    // south of the stream
    [240, 908, 2.0], [400, 912, 1.2], [520, 930, 1.3], [650, 940, 1.0], [1050, 934, 1.5], [1150, 984, 1.1], [1252, 990, 1.4], [1340, 1004, 1.2], [1000, 986, 0.8],
    [100, 960, 1.3], [760, 990, 1.0],
  ];
  // the painting's birches: [x, y, size, trunks]
  const BIRCHES = [[40, 206, 1.1, 2], [468, 110, 0.9, 1], [602, 104, 1.0, 2], [1256, 132, 0.95, 1], [1460, 258, 1.25, 2], [1372, 302, 0.95, 1],
    [140, 888, 1.15, 2], [1492, 702, 1.0, 1], [1515, 140, 0.9, 1]];

  P[ID] = {
    id: ID, name: 'The Warm Roads camp', painting: "art/walk/walk-warm-roads-camp.avif", size: [1536, 1024],
    mapId: ID, paintingPng: 'reference/art/walk/wilds/walk-warm-roads-camp.png',
    // the open moor: one painting each way round the painting; where Io may roam inside it (the heath closes it in)
    extent: [-1536, -1024, 3072, 2048],
    open: { bounds: [[-1130, 200], [-1180, -100], [-1100, -420], [-1150, -760], [-700, -830], [-200, -790], [300, -850], [800, -820], [1300, -870],
      [1800, -800], [2300, -850], [2720, -720], [2800, -300], [2750, 120], [2752, 400], [2752, 480], [2800, 800], [2780, 1250], [2820, 1600], [2500, 1820],
      [2000, 1760], [1500, 1830], [900, 1780], [400, 1840], [-150, 1780], [-700, 1820], [-1100, 1600], [-1160, 1150], [-1120, 760], [-1180, 480]] },
    // the wall check (tools/walls-test.mjs): from the road below the camp, to the start, the hut and inside it, the
    // landing ground, the lookout, the slab bridge, the way on, every place to find and both pockets
    checks: { from: [790, 560], goals: [
      ['the start, by the landing ground', 575, 466], ['the hut’s door', 766, 336], ['inside the hut', 748, 236], ['the landing ground’s middle', 318, 425],
      ['the lookout (north)', 1020, 62], ['over the slab bridge (south)', 925, 950], ['the south path’s end (the painting’s foot)', 840, 1015],
      ['the way on to the Ember Line road (east)', 2744, 440],
      ['the tor (west)', -730, 372], ['the cairn on its hill (north)', 1072, -630], ['the sheepfold (south)', 520, 1655], ['the pool (south-east)', 2420, 1240],
      ['over the stepping stones by the pool', 2650, 1040], ['over the stepping stones in the west', -700, 650], ['the broken cart (east)', 2400, 478], ['the milestone (east)', 1960, 405],
      ['the nook behind the hut (pocket)', 700, 134], ['the ledge by the stream (pocket)', 712, 824]] },
    // the trees: none from the painting (its few birches are built by hand in extra); past it, clumps of birch and a few
    // dark firs with wide clearings of heath between. None at the places to find.
    treeGen: { dark: 9, step: 84, fir: 0, firSouth: 0,
      out: { density: 0.62, clump: 620, clear: 0.47, kinds: [0.78, 0.22, 0], size: [0.72, 1.02] },
      roads: [],
      keepOut: [[-40, -40, 1580, 1070], [-1000, 150, -640, 460], [880, -880, 1300, -520], [330, 1480, 720, 1820], [2150, 980, 2700, 1330], [2150, 420, 2450, 600], [1880, 300, 2040, 460]] },
    // the ground: earth on the walk and the trails, worn grass round them (and on the landing ground), heather moor
    // everywhere else, the Warm Road's flagstones laid as paving
    ground: { cob: 'shared_dirt_track', dirt: 'shared_grass_meadow', grass: 'wilds_heath_ground', pave: 'shared_warm_road', rep: [1.9, 3.2, 3.4, 3.4], grassTint: [1.0, 0.96, 1.02], dirtTint: [0.74, 0.76, 0.62] },
    surfaces: { stone: 'shared_stone_wall_rough', dry: 'shared_drystone', timber: 'shared_stone_wall_rough', planks: 'shared_boardwalk_planks', roof: 'shared_grass_meadow',
      wood: 'shared_bark_oak', deck: 'shared_boardwalk_planks', pave: 'shared_warm_road', cloth: 'camp_tent_canvas', soil: 'shared_dirt_track', rock: 'wilds_boulder_stone',
      leaves: 'wilds_birch_leaves', firs: 'wilds_fir_boughs', bark: 'shared_bark_birch' },
    tints: { leaves: 0xd8e8cc, firs: 0xb0c4b8, bush: 0xdce8d0, wood: 0xb89a88 },
    // the hut's turf dome (the meadow grass, a little darker), never thinning from inside
    extraMats: { turf: { tex: 'shared_grass_meadow', rep: 1.8, tint: 0x8c9c6c, side: 'double', shade: 0.4 } },
    // the moor's fog: a warmer violet than the Thornwood's cold blue, as heavy, so only so much is drawn at once
    night: { fog: [0.19, 0.16, 0.3], fogNear: 10, fogFar: 42, far: 90, hills: false, sky: [0.62, 0.58, 0.68], moon: [0.42, 0.42, 0.56] },
    textures: [
      { id: 'shared_warm_road', made: "./../texture-packs/made/shared_warm_road.png", stand: "./../texture-packs/wilds-south/warm-roads-camp/stand-in/shared_warm_road.png" },
      { id: 'shared_grass_meadow', made: "./../texture-packs/made/shared_grass_meadow.png", stand: "./../texture-packs/wilds-south/warm-roads-camp/stand-in/shared_grass_meadow.png" },
      { id: 'wilds_heath_ground', made: "./../texture-packs/made/wilds_heath_ground.png", stand: "./../texture-packs/wilds-south/ember-line-road/stand-in/wilds_heath_ground.png" },
      { id: 'shared_dirt_track', made: "./../texture-packs/made/shared_dirt_track.png", stand: "./../texture-packs/wilds-south/eldergrove-edge/stand-in/shared_dirt_track.png" },
      { id: 'camp_tent_canvas', made: "./../texture-packs/made/camp_tent_canvas.png", stand: "./../texture-packs/wilds-south/warm-roads-camp/stand-in/camp_tent_canvas.png" },
      { id: 'shared_bark_birch', made: "./../texture-packs/made/shared_bark_birch.png", stand: "./../texture-packs/wilds-south/warm-roads-camp/stand-in/shared_bark_birch.png" },
      { id: 'wilds_birch_leaves', made: "./../texture-packs/made/wilds_birch_leaves.png", stand: "./../texture-packs/wilds-south/ember-line-road/stand-in/wilds_birch_leaves.png" },
      { id: 'wilds_boulder_stone', made: "./../texture-packs/made/wilds_boulder_stone.png", stand: "./../texture-packs/wilds-south/ember-line-road/stand-in/wilds_boulder_stone.png" },
      { id: 'shared_drystone', made: "./../texture-packs/made/shared_drystone.png", stand: "./../texture-packs/wilds-south/ember-line-road/stand-in/shared_drystone.png" },
      { id: 'shared_stone_wall_rough', made: "./../texture-packs/made/shared_stone_wall_rough.png", stand: "./../texture-packs/wickhollow/wickhollow/stand-in/shared_stone_wall_rough.png" },
      { id: 'shared_water_river', made: "./../texture-packs/made/shared_water_river.png", stand: "./../texture-packs/wilds-south/ember-line-road/stand-in/shared_water_river.png" },
      { id: 'shared_boardwalk_planks', made: "./../texture-packs/made/shared_boardwalk_planks.png", stand: "./../texture-packs/wickhollow/jetty/stand-in/shared_boardwalk_planks.png" },
      { id: 'shared_bark_oak', made: "./../texture-packs/made/shared_bark_oak.png", stand: "./../texture-packs/wilds-south/dawnroost-road/stand-in/shared_bark_oak.png" },
      { id: 'wilds_fir_boughs', made: "./../texture-packs/made/wilds_fir_boughs.png", stand: "./../texture-packs/wilds-south/dawnroost-road/stand-in/wilds_fir_boughs.png" },
    ],
    ground_h: ground,
    // where Io's feet stand: the ground (the engine stands her on it as it shapes it), the slab bridge's slabs, the
    // stepping stones' tops
    walk_h(x, y) {
      if (x >= SLAB.x0 - 8 && x <= SLAB.x1 + 8 && y >= SLAB.y0 - 6 && y <= SLAB.y1 + 6) return Math.max(ground(x, y), 0.03);
      for (const f of FORDS) if (Math.abs(x - f.x) <= 18) { const [c, hw] = streamAt(f.x); if (Math.abs(y - c) <= hw + 6) return LEVEL + 0.25; }
      return ground(x, y);
    },
    water: [{ poly: STREAM, level, tex: 'shared_water_river', rep: 4, flow: [0.04, 0.0], bed: -2.4 }],
    lawns: [],
    // no rocks along the banks under the slab bridge, at the stepping stones, or where the stream runs out of the open
    // ground (the pool's own are laid by hand)
    noRocks: [[830, 800, 1010, 960], [-740, 650, -660, 790], [2610, 1030, 2690, 1160], [-1700, 500, -1150, 900], [2760, 900, 3200, 1200], [2240, 1000, 2560, 1230]],
    start: [575, 466], startFace: Math.PI / 2, startYaw: -Math.PI / 2,
    // the way on, where the road reaches the open ground's edge
    exits: [{ rect: [2734, 400, 2754, 480], label: 'The Ember Line road' }],
    // the trails (earth down the middle, worn grass along the edges; the road's middle is paved, below), the hut's floor
    // (packed earth), the lookout's paving, the stepping stones, the pockets
    walkAdd: TRAILS.map((t) => ({ poly: ribbon(t.pts, t.w + 0.6), ground: 'dirt' })).concat(TRAILS.slice(1).map((t) => ({ poly: ribbon(t.pts, t.w), ground: 'cob' })))
      .concat([{ poly: HUT_FLOOR, ground: 'cob' }, { poly: circleM(LOOK.c, LOOK.R + 0.2, 20), ground: 'cob' }])
      .concat(FORDS.map((f) => { const [c, hw] = streamAt(f.x); return { poly: [[f.x - 16, Math.round(c - hw - 8)], [f.x + 16, Math.round(c - hw - 8)], [f.x + 16, Math.round(c + hw + 8)], [f.x - 16, Math.round(c + hw + 8)]], ground: 'grass' }; }))
      .concat([{ poly: NOOK, ground: 'grass' }, { poly: LEDGE_WAY, ground: 'grass' }, { poly: [[SLAB.x0, SLAB.y0], [SLAB.x1, SLAB.y0], [SLAB.x1, SLAB.y1], [SLAB.x0, SLAB.y1]], ground: 'grass' }]),
    // the Warm Road's flagstones on the painting's road and on along it east, and worn grass on the landing ground
    groundPatches: [
      { poly: ((G.MAPS || {})[ID] || { walk: [[], [], []] }).walk[2], kind: 'pave' },
      { poly: ribbon(ROAD_ALL, ROAD.w), kind: 'pave' },
      { poly: circleM(LOOK.c, LOOK.R, 26), kind: 'pave' },
      { poly: [[104, 318], [330, 330], [516, 318], [552, 334], [574, 384], [588, 420], [590, 470], [572, 530], [440, 528], [300, 532], [104, 512], [96, 420]], kind: 'dirt' },
    ],
    items: {},
    buildings: [],
    // the low dry-stone walls: round the camp, along the road on both sides, north of the road east of the north path,
    // and the old wall in the north-west. Built in extra (H: their height), lighter than the engine's walls would be, with
    // capstones and end pillars; h: 0 keeps the engine from building them and lets check-layout check them.
    walls: [
      { pts: [[612, 487], [662, 497], [704, 510]], h: 0, H: 0.8, t: 0.5, tex: 'dry' },                     // south of the tent nook
      { pts: [[574, 292], [640, 300]], h: 0, H: 0.85, t: 0.5, tex: 'dry' },                                  // west of the hut
      { pts: [[952, 222], [956, 262], [960, 300]], h: 0, H: 0.85, t: 0.5, tex: 'dry' },                      // by the yard, east of the hut
      { pts: [[922, 478], [962, 482], [1030, 486], [1070, 488]], h: 0, H: 0.8, t: 0.5, tex: 'dry' },          // north of the road, by the lantern
      { pts: [[1120, 318], [1200, 312], [1268, 304]], h: 0, H: 0.95, t: 0.55, tex: 'dry', ends: [1, 0] },     // north-east of the road
      { pts: [[1294, 316], [1370, 330], [1446, 352]], h: 0, H: 0.95, t: 0.55, tex: 'dry', ends: [0, 1] },
      { pts: [[1088, 618], [1150, 644], [1258, 684]], h: 0, H: 0.9, t: 0.55, tex: 'dry', ends: [0, 1] },      // south of the road, east
      { pts: [[1280, 694], [1312, 716]], h: 0, H: 0.9, t: 0.55, tex: 'dry' },
      { pts: [[506, 646], [580, 636], [660, 622]], h: 0, H: 0.85, t: 0.5, tex: 'dry', ends: [0, 1] },                      // south of the trail under the camp
      { pts: [[226, 144], [330, 138], [420, 154]], h: 0, H: 0.9, t: 0.55, tex: 'dry' },                      // the old wall in the north-west
      { pts: [[1420, 518], [1536, 522], [1600, 520]], h: 0, H: 0.85, t: 0.5, tex: 'dry' },                   // along the road's south side
    ],
    steps: [],
    // the lantern on its wooden post, by the road
    lamps: [{ at: [966, 464], kind: 'wood', h: 2.5 }],
    props: [],
    flowers: [],
    // the lights for the light map: [x, y, radius px, strength, colour]. The fire's, the hut's and the road's are added
    // in extra; these are the moonlight lying in the clearings and on the water.
    lights: [
      [318, 425, 260, 0.32, 'moon'], [640, 860, 180, 0.4, 'moon'], [1300, 930, 200, 0.42, 'moon'], [1020, 30, 130, 0.35, 'moon'], [1250, 250, 160, 0.22, 'moon'],
      [2390, 1112, 230, 0.55, 'moon'], [-820, 300, 200, 0.4, 'moon'], [1090, -700, 220, 0.42, 'moon'], [520, 1650, 200, 0.35, 'moon'], [2290, 500, 150, 0.3, 'moon'],
    ],
    trees: ID,
    extraTrees: [],

    // ---- what the engine has no field for: the hut, the tents, the fire and everything round it, the landing ground's
    // stakes and ropes, the lookout, the slab bridge, the walls' capstones and pillars, the boulders, birches, gorse and
    // heather, the places to find and the pockets ----
    extra(K) {
      const { X, Z } = K, W = G.W3D, TAU = Math.PI * 2, TH = K.terrain, PL = P[ID];
      // what each part below is built into: K.B for the hut, the fire, the tents and the camp's things round them, the
      // stream's little falls and the milestone (big things at the painting's middle, and the ones that glow or are lit);
      // FAR for everything else, each piece into the far patch where it stands, so it isn't drawn once it's past the fog
      const FAR = farBuilder(K);
      let B = K.B;
      const V3 = (x, y, z) => new THREE.Vector3(x, y, z), QY = (a) => new THREE.Quaternion().setFromEuler(new THREE.Euler(0, a, 0));
      const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
      const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
      const norm = (a) => { const L = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / L, a[1] / L, a[2] / L]; };
      // a quad that faces the way `want` points, whichever order its corners came in
      const Q = (k, a, b, c, d, want, uv, col) => { const n = cross(sub(b, a), sub(d, a)); if (dot(n, want) < 0) B.quad(k, b, a, d, c, uv, col); else B.quad(k, a, b, c, d, uv, col); };
      const walkDist = (x, y) => { let d = 1e9; for (const q of mapWalk()) { if (W.inPoly(q.p, x, y)) return 0; if (x > q.b[0] - d && x < q.b[2] + d && y > q.b[1] - d && y < q.b[3] + d) d = Math.min(d, W.edgeDist(q.p, x, y)); } return d; };
      const pathDist = (x, y) => Math.min(walkDist(x, y), trailDist(x, y) - 30);
      const inBounds = (x, y) => W.inPoly(PL.open.bounds, x, y);
      const inPaint = (x, y, m) => x > -m && x < 1536 + m && y > -m && y < 1024 + m;
      // low lumps (20 triangles): far boulders and bushes, where the fog hides their shape
      const lumpLow = (seed, sy) => { const g = new THREE.IcosahedronGeometry(1, 0), p = g.attributes.position, r = W.rand(seed), seen = {}; for (let i = 0; i < p.count; i++) { const key = p.getX(i).toFixed(3) + ',' + p.getY(i).toFixed(3) + ',' + p.getZ(i).toFixed(3), k = seen[key] || (seen[key] = 0.8 + r() * 0.35); p.setXYZ(i, p.getX(i) * k, p.getY(i) * k * (sy || 1), p.getZ(i) * k); } g.computeVertexNormals(); return g; };
      const ROCK_LOW = [lumpLow(501, 0.7), lumpLow(502, 0.7), lumpLow(503, 0.7)], BUSH_LOW = [lumpLow(601), lumpLow(602), lumpLow(603)];
      // a boulder: its foot at (px, py), `sz` metres; low: the 20-triangle shape; y: set its foot's height
      const rock = (px, py, sz, o) => {
        o = o || {};
        const pick = Math.floor(Math.abs(Math.sin(px * 12.9 + py * 7.3)) * 3) % 3, g = o.low ? ROCK_LOW[pick] : K.rockG[pick];
        const y = (o.y != null ? o.y : TH(px, py)) - sz * (o.sink != null ? o.sink : 0.22);
        B.geom('rock', g, new THREE.Matrix4().compose(V3(X(px), y, Z(py)), QY((px * 0.37 + py * 0.11) % TAU), V3(sz * (o.sx || 1), sz * (o.sy || 1.32), sz * (o.sz || 1))), o.col || [0.88, 0.88, 0.94], 1.2);
        if (sz > 0.9 && o.shade !== false) K.shadeMarks.push(['dot', px, py, sz * 0.85 / SX, 0.72]);
      };
      // a tapered branch from A to Bp (an open tube of n sides), its uv in metres
      function seg(k, A, Bp, ra, rb, n, col) {
        const d = sub(Bp, A), L = Math.hypot(d[0], d[1], d[2]), dir = mul(d, 1 / L);
        const u = norm(cross(Math.abs(dir[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0], dir)), v = cross(dir, u);
        const ring = (c, r, t) => add(c, add(mul(u, Math.cos(t) * r), mul(v, Math.sin(t) * r)));
        for (let i = 0; i < n; i++) { const t0 = i / n * TAU, t1 = (i + 1) / n * TAU; B.quad(k, ring(A, ra, t0), ring(A, ra, t1), ring(Bp, rb, t1), ring(Bp, rb, t0), [t0 * ra * 1.5, A[1], t1 * ra * 1.5, Bp[1]], col); }
      }
      // a flower card (two crossed quads) at (x, y, z)
      const card = (k, x, y, z, s, t, col) => { for (const a of [t, t + Math.PI / 2]) B.quad(k, [x - Math.cos(a) * s, y - s * 0.55, z - Math.sin(a) * s], [x + Math.cos(a) * s, y - s * 0.55, z + Math.sin(a) * s], [x + Math.cos(a) * s, y + s, z + Math.sin(a) * s], [x - Math.cos(a) * s, y + s, z - Math.sin(a) * s], [0, 0, 1, 1], col); };
      // a bush of the moor: gorse (dark green, orange-yellow flowers), heather (purple), or plain green; solid when it
      // stands taller than her ankles (the engine sees to that)
      const BUSHC = { gorse: [0.72, 0.84, 0.55], heather: [0.82, 0.58, 0.86], green: [0.66, 0.78, 0.64] };
      const FLC = { gorse: ['fl_white', [1.7, 0.95, 0.22]], heather: ['fl_violet', [1.35, 0.8, 1.4]], green: ['fl_white', [1.05, 1.05, 1.1]] };
      const bush = (px, py, rr, kind, r, low) => {
        const x = X(px), z = Z(py), y = TH(px, py), h = rr * (0.6 + r() * 0.3), g = low ? BUSH_LOW[Math.floor(r() * 3)] : K.ico[Math.floor(r() * 3)];
        B.geom('leafBush', g, new THREE.Matrix4().compose(V3(x, y + h * 0.32, z), QY(r() * TAU), V3(rr, h, rr)), BUSHC[kind], 2.0);
        const n = low ? 1 : Math.max(3, Math.round(rr * 5)), [fk, fc] = FLC[kind];
        for (let i = 0; i < n; i++) { const a = r() * TAU, d = r() * rr * 0.7; card(fk, x + Math.cos(a) * d, y + h * (0.75 + r() * 0.45), z + Math.sin(a) * d, 0.3 + r() * 0.14, r() * Math.PI, fc); }
        if (rr > 0.7) K.shadeMarks.push(['dot', px, py, rr / SX, 0.78]);
      };
      // a tuft of tall grass or reeds
      const tuft = (px, py, n, hh, col, yy) => {
        const r = W.rand(Math.abs(px * 7 + py * 3) + 1), x = X(px), z = Z(py), y = yy != null ? yy : TH(px, py);
        for (let i = 0; i < n; i++) { const a = r() * TAU, lean = 0.12 + r() * 0.3, h = hh * (0.7 + r() * 0.5), w = 0.04 + r() * 0.03, bx = x + (r() - 0.5) * 0.5, bz = z + (r() - 0.5) * 0.4, ox = Math.cos(a), oz = Math.sin(a);
          B.tri('cloth', [bx - oz * w, y, bz + ox * w], [bx + oz * w, y, bz - ox * w], [bx + ox * lean, y + h, bz + oz * lean], [[0, 0], [0.1, 0], [0.05, 1]], col || [0.75, 0.85, 0.5]); }
      };
      // a birch: one to three slim white trunks from one root, leaning apart, thin branches, airy crowns
      const birch = (px, py, s, nT, seed, lean) => {
        const r = W.rand(seed * 7919 + 17), x = X(px), z = Z(py), y0 = TH(px, py) - 0.15, col = [0.95, 0.95, 1.0];
        for (let t = 0; t < nT; t++) {
          const a = (t / nT) * TAU + r() * 1.2, sp = nT > 1 ? 0.18 + r() * 0.14 : 0.06, H = (4.6 + r() * 2.0) * s * (t ? 0.82 : 1);
          let base = [x + Math.cos(a) * 0.12 * (nT > 1 ? 1 : 0), y0, z + Math.sin(a) * 0.12 * (nT > 1 ? 1 : 0)];
          const dir = norm([Math.cos(a) * sp + (lean ? lean[0] : 0), 1, Math.sin(a) * sp + (lean ? lean[1] : 0)]);
          let p = base, rad = 0.13 * s; const NS = 3, pts = [];
          for (let i = 0; i < NS; i++) { const d2 = norm(add(dir, [(r() - 0.5) * 0.14, 0, (r() - 0.5) * 0.14])), np = add(p, mul(d2, H / NS)), nr = rad * 0.72; seg('bark', p, np, rad, nr, 6, col); pts.push(np); p = np; rad = nr; }
          // thin branches off the upper trunk, and the crowns on them
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
      // a post (a stake, a fence post), a stump, a chest, a crate
      const post = (px, py, h, rr, col, y) => { const yy = y != null ? y : TH(px, py); B.cyl('wood', X(px), yy - 0.3, Z(py), rr, rr * 0.88, h + 0.3, 7, col || [0.75, 0.62, 0.55], [1.2, h]); return yy; };
      const stump = (px, py, rr, h) => {
        const x = X(px), z = Z(py), y = TH(px, py) - 0.1;
        B.cyl('wood', x, y, z, rr * 1.08, rr, h + 0.1, 9, [0.82, 0.68, 0.58], [2.2, h]);
        const top = new THREE.CircleGeometry(rr * 0.98, 9); top.rotateX(-Math.PI / 2); B.geom('planks', top, new THREE.Matrix4().makeTranslation(x, y + h + 0.101, z), [1.2, 0.95, 0.78], 1); top.dispose();
        K.shadeMarks.push(['dot', px, py, rr * 1.4 / SX, 0.7]);
      };
      const IRON = [0.75, 0.72, 0.78];
      const chest = (px, py, w, d, h, ry, col) => {
        const x = X(px), z = Z(py), y = TH(px, py) - 0.05, c = col || [0.78, 0.6, 0.5];
        B.box('planks', x, y, z, w, h * 0.72, d, ry, c);
        B.box('planks', x, y + h * 0.72, z, w + 0.04, h * 0.28, d + 0.04, ry, [c[0] * 0.85, c[1] * 0.85, c[2] * 0.85]);
        const cs = Math.cos(ry), sn = Math.sin(ry);
        for (const u of [-0.32, 0.32]) { const ox = u * w * cs, oz = -u * w * sn; B.box('iron', x + ox, y - 0.01, z + oz, 0.07, h + 0.03, d + 0.06, ry, IRON, { noTop: false }); }
        B.box('iron', x, y + h * 0.62, z, w + 0.05, 0.12, 0.05, ry, [1.3, 1.15, 0.85]);   // the lock plate
        K.shadeMarks.push(['dot', px, py, w * 0.8 / SX, 0.7]);
      };
      const crate = (px, py, s, ry, y) => {
        const x = X(px), z = Z(py), yy = y != null ? y : TH(px, py) - 0.04, c = [0.86, 0.72, 0.58];
        B.box('planks', x, yy, z, s, s * 0.85, s, ry, c);
        const cs = Math.cos(ry), sn = Math.sin(ry);
        for (const [u, v] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const lx = u * s * 0.48, lz = v * s * 0.48; B.box('wood', x + lx * cs + lz * sn, yy, z - lx * sn + lz * cs, 0.07, s * 0.85 + 0.01, 0.07, ry, [0.62, 0.5, 0.42]); }
        return yy + s * 0.85;
      };

      // ================= the hut: a round dry-stone wall dug into its bank, a turf dome, the door open and lit =========
      {
        const [hx, hy] = HUT.c, cx = X(hx), cz = Z(hy), R = HUT.R, T = HUT.t, Hh = HUT.h, a0 = HUT.door + HUT.gap, a1 = HUT.door - HUT.gap + TAU, N = 40;
        const Rm = R - T / 2, sp = (a1 - a0) / N;
        for (let i = 0; i < N; i++) {
          const a = a0 + sp * (i + 0.5), x = cx + Math.cos(a) * Rm, z = cz + Math.sin(a) * Rm, ry = Math.atan2(-Math.cos(a), -Math.sin(a));
          const low = Math.min(TH(K.M.px(cx + Math.cos(a) * R), K.M.py(cz + Math.sin(a) * R)), 0) - 0.35;
          B.box('stone', x, low, z, sp * R + 0.08, Hh - low, T, ry, [0.92, 0.9, 0.96], { u0: i * sp * R });
        }
        // the doorway: two jamb stones, the lintel, the threshold, the sun carved above (faintly gold)
        const dir = (a, r) => [cx + Math.cos(a) * r, cz + Math.sin(a) * r];
        for (const s of [-1, 1]) { const a = HUT.door + s * (HUT.gap + 0.04), [x, z] = dir(a, Rm); B.box('stone', x, -0.2, z, 0.42, 2.25, T + 0.12, Math.atan2(-Math.cos(a), -Math.sin(a)), [1.0, 0.98, 1.02]); }
        const [lx, lz] = dir(HUT.door, Rm), lry = Math.atan2(-Math.cos(HUT.door), -Math.sin(HUT.door));
        B.box('stone', lx, 2.0, lz, 2.0, HUT.h - 2.0, T + 0.14, lry, [1.02, 1.0, 1.04]);
        B.box('stone', lx, -0.25, lz, 1.5, 0.28, T + 0.5, lry, [0.88, 0.86, 0.9], { solid: false });
        {
          const [sx, sz] = dir(HUT.door, Rm + (T + 0.14) / 2 + 0.015), n = [Math.cos(HUT.door), 0, Math.sin(HUT.door)], t = [-Math.sin(HUT.door), 0, Math.cos(HUT.door)], cy = 2.32, GOLD = [0.95, 0.75, 0.36];
          const P2 = (u, v) => [sx + t[0] * u + n[0] * 0.02, cy + v, sz + t[2] * u + n[2] * 0.02];
          for (let i = 0; i < 12; i++) { const b0 = i / 12 * TAU, b1 = (i + 1) / 12 * TAU; B.tri('glass', P2(0, 0), P2(Math.cos(b0) * 0.19, Math.sin(b0) * 0.19), P2(Math.cos(b1) * 0.19, Math.sin(b1) * 0.19), [[0, 0], [1, 0], [0, 1]], GOLD); }
          for (let i = 0; i < 12; i++) { const b = i / 12 * TAU, w = 0.04, L = i % 2 ? 0.34 : 0.42; B.quad('glass', P2(Math.cos(b) * 0.23 - Math.sin(b) * w, Math.sin(b) * 0.23 + Math.cos(b) * w), P2(Math.cos(b) * 0.23 + Math.sin(b) * w, Math.sin(b) * 0.23 - Math.cos(b) * w), P2(Math.cos(b) * L, Math.sin(b) * L), P2(Math.cos(b) * L, Math.sin(b) * L), [0, 0, 1, 1], GOLD); }
          K.halo(sx + n[0] * 0.25, cy, sz + n[2] * 0.25, 1.3, [0.45, 0.32, 0.12]);
        }
        // the plank door, standing open inward against the doorway's east side
        { const a = HUT.door - HUT.gap, [hx2, hz2] = dir(a, R - T - 0.02), inw = [-Math.cos(HUT.door), -Math.sin(HUT.door)], ry = Math.atan2(-inw[1], inw[0]);
          B.box('planks', hx2 + inw[0] * 0.62, 0.02, hz2 + inw[1] * 0.62, 1.24, 1.95, 0.07, ry, [0.9, 0.72, 0.58]); }
        // the turf dome on the wall, its eaves a little over, with heather and gorse growing on it
        {
          const Rr = R + 0.3, Hd = 1.75, g = new THREE.SphereGeometry(1, 26, 7, 0, TAU, 0, Math.PI / 2);
          B.solid = false;
          B.geom('turf', g, new THREE.Matrix4().compose(V3(cx, Hh - 0.12, cz), new THREE.Quaternion(), V3(Rr, Hd, Rr)), (v) => { const t = (v.y - Hh) / Hd; return [0.8 + t * 0.15, 0.86 + t * 0.12, 0.72 + t * 0.1]; }, [TAU * Rr, Hd * 2]); g.dispose();
          const rim = new THREE.CylinderGeometry(Rr, Rr - 0.05, 0.3, 26, 1, true); B.geom('turf', rim, new THREE.Matrix4().makeTranslation(cx, Hh - 0.25, cz), [0.8, 0.76, 0.72], [TAU * Rr, 0.3]); rim.dispose();
          const r = W.rand(4401);
          for (let i = 0; i < 22; i++) {
            const a = r() * TAU, f = 0.2 + r() * 0.72, rr = 0.35 + r() * 0.4, x = cx + Math.cos(a) * Rr * f, z = cz + Math.sin(a) * Rr * f, y = Hh - 0.12 + Hd * Math.sqrt(1 - f * f) - 0.08;
            const kind = r() < 0.45 ? 'gorse' : r() < 0.7 ? 'heather' : 'green';
            B.geom('leafBush', BUSH_LOW[i % 3], new THREE.Matrix4().compose(V3(x, y, z), QY(r() * TAU), V3(rr, rr * 0.55, rr)), BUSHC[kind], 1.6);
            card(FLC[kind][0], x, y + rr * 0.45, z, 0.28, r() * Math.PI, FLC[kind][1]);
          }
          B.solid = true;
        }
        // inside: a packed-earth floor (the ground), a rug, a low bed under a blanket, a little stone hearth with embers
        // and a pot, a table with a candle, a stool, sacks, a shelf of jars; a lantern hangs from the roof
        {
          const at = (ang, r) => [cx + Math.cos(ang) * r, cz + Math.sin(ang) * r];
          B.solid = false; B.quad('cloth', [cx - 1.0, 0.02, cz + 0.4], [cx + 1.0, 0.02, cz + 0.4], [cx + 1.0, 0.02, cz - 0.9], [cx - 1.0, 0.02, cz - 0.9], [0, 0, 2, 1.3], [0.85, 0.42, 0.36]); B.solid = true;
          // the bed, along the west wall
          { const [bx, bz] = at(Math.PI * 1.0, 2.55); B.box('planks', bx, 0, bz, 0.95, 0.42, 2.0, 0, [0.7, 0.55, 0.46]); B.box('cloth', bx, 0.42, bz + 0.1, 0.9, 0.14, 1.75, 0, [0.5, 0.48, 0.75]); B.box('cloth', bx, 0.42, bz - 0.8, 0.7, 0.18, 0.4, 0, [1.1, 1.05, 1.0]); }
          // the hearth at the back
          { const [fx, fz] = at(-Math.PI / 2, 2.6);
            for (let i = 0; i < 9; i++) { const a = i / 9 * TAU; B.geom('rock', ROCK_LOW[i % 3], new THREE.Matrix4().compose(V3(fx + Math.cos(a) * 0.55, -0.05, fz + Math.sin(a) * 0.45), QY(a), V3(0.22, 0.2, 0.2)), [0.8, 0.78, 0.8], 0.6); }
            B.cyl('glass', fx, 0.0, fz, 0.42, 0.36, 0.08, 9, [1.4, 0.45, 0.12]);
            B.cyl('iron', fx, 0.08, fz, 0.2, 0.24, 0.3, 9, [0.5, 0.48, 0.52]);
            K.halo(fx, 0.3, fz, 1.5, [0.9, 0.4, 0.12]); K.lamps3d.push({ x: fx, y: 0.5, z: fz, c: 0xff7a38, k: 0.9 });
            K.addBlock(K.circlePx(K.M.px(fx), K.M.py(fz), 0.7, 10)); }
          // the table and stool on the east side, a candle on it
          { const [tx, tz] = at(0.15, 2.35); B.box('planks', tx, 0.68, tz, 0.9, 0.06, 1.2, 0, [0.8, 0.62, 0.5]); for (const [u, v] of [[-0.38, -0.52], [0.38, -0.52], [0.38, 0.52], [-0.38, 0.52]]) B.box('wood', tx + u, 0, tz + v, 0.07, 0.68, 0.07, 0, [0.7, 0.55, 0.45]);
            B.cyl('glass', tx, 0.74, tz + 0.2, 0.03, 0.03, 0.16, 6, [1.4, 1.2, 0.9]); K.halo(tx, 0.95, tz + 0.2, 0.6, [1.0, 0.75, 0.4]);
            B.cyl('planks', tx - 0.75, 0, tz, 0.2, 0.2, 0.45, 8, [0.75, 0.6, 0.5]); }
          // sacks and a shelf of jars by the door, west side
          { const [sx, sz] = at(2.2, 2.9); for (let i = 0; i < 3; i++) B.geom('cloth', K.ico[i], new THREE.Matrix4().compose(V3(sx + (i - 1) * 0.4, 0.3, sz + (i % 2) * 0.25), QY(i), V3(0.25, 0.32, 0.22)), [0.9, 0.82, 0.62], 1);
            const [shx, shz] = at(-2.3, 3.2); B.box('planks', shx, 1.2, shz, 1.2, 0.05, 0.35, Math.atan2(-Math.cos(-2.3), -Math.sin(-2.3)), [0.75, 0.6, 0.5]);
            for (let i = 0; i < 4; i++) B.cyl('glass', shx + (i - 1.5) * 0.24, 1.25, shz, 0.07, 0.06, 0.2, 6, [0.25 + i * 0.05, 0.3, 0.42]); }
          B.box('iron', cx, 2.62, cz, 0.025, 1.75, 0.025, 0, null, { solid: false }); K.lantern(cx, 2.35, cz, null, 0.9, true);
          K.light(hx, hy + 8, 72, 1.05, 'warm');
        }
        K.light(766, 336, 58, 0.6, 'warm');
        K.halo(X(766), 1.0, Z(318) + 0.3, 2.0, [0.85, 0.5, 0.2]);
        K.shadeMarks.push(['dot', hx, hy + 70, 70, 0.75]);
      }

      // ================= the camp round the fire =================
      // the fire in its ring of stones, the iron tripod with the kettle over it
      {
        const [fx_, fy_] = FIRE.c, x = X(fx_), z = Z(fy_), y = 0, r = W.rand(911);
        for (let i = 0; i < 17; i++) { const a = i / 17 * TAU + r() * 0.1, sz = 0.28 + r() * 0.08; B.geom('rock', K.rockG[i % 3], new THREE.Matrix4().compose(V3(x + Math.cos(a) * FIRE.rx, y - 0.08, z + Math.sin(a) * FIRE.rz), QY(r() * TAU), V3(sz, sz * 0.85, sz)), [0.95, 0.9, 0.9], 0.8); }
        // ash, embers, logs and the flames
        const ash = new THREE.CircleGeometry(1, 14); ash.rotateX(-Math.PI / 2); B.geom('soil', ash, new THREE.Matrix4().compose(V3(x, 0.03, z), new THREE.Quaternion(), V3(FIRE.rx - 0.2, 1, FIRE.rz - 0.2)), [0.55, 0.5, 0.5], 1); ash.dispose();
        B.cyl('glass', x, 0.02, z, 0.48, 0.4, 0.08, 10, [1.0, 0.3, 0.07]);
        for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.3; seg('wood', [x + Math.cos(a) * 0.62, 0.08, z + Math.sin(a) * 0.5], [x + Math.cos(a) * 0.08, 0.3, z + Math.sin(a) * 0.06], 0.07, 0.05, 5, [0.5, 0.36, 0.32]); }
        for (let i = 0; i < 9; i++) { const a = i * Math.PI / 9 + r() * 0.3, w = 0.13 + r() * 0.08, c = Math.cos(a) * w, s = Math.sin(a) * w, ox = (r() - 0.5) * 0.36, oz = (r() - 0.5) * 0.3, hh = 0.42 + r() * 0.42, lx = (r() - 0.5) * 0.18, lz = (r() - 0.5) * 0.18;
          for (const [kk, f, col] of [[1, 1, [1.25, 0.38, 0.06]], [0.55, 0.62, [1.6, 0.95, 0.3]]]) { const p = [x + ox - c * kk, 0.12, z + oz - s * kk], q = [x + ox + c * kk, 0.12, z + oz + s * kk], tp = [x + ox + lx * f, 0.12 + hh * f, z + oz + lz * f]; B.tri('glass', p, q, tp, [[0, 0], [1, 0], [0.5, 1]], col); B.tri('glass', q, p, tp, [[0, 0], [1, 0], [0.5, 1]], col); } }
        K.halo(x, 0.55, z, 2.6, [1.0, 0.48, 0.16]); K.halo(x, 0.3, z, 1.1, [1.0, 0.68, 0.3]);
        K.lamps3d.push({ x, y: 0.8, z, c: 0xff8a40, k: 1.7 });
        K.light(fx_, fy_, 150, 1.15, 'forge'); K.light(fx_, fy_ - 6, 80, 0.6, 'warm');
        // the tripod and kettle
        const apex = [x, 1.95, z - 0.05];
        for (let i = 0; i < 3; i++) { const a = i / 3 * TAU + 0.5; seg('iron', [x + Math.cos(a) * 1.35, -0.05, z + Math.sin(a) * 1.0], apex, 0.035, 0.03, 4); }
        B.solid = false;
        B.box('iron', apex[0], 1.0, apex[2], 0.025, 0.95, 0.025, 0);
        const kettle = new THREE.SphereGeometry(0.28, 10, 7); kettle.scale(1, 0.82, 1); B.geom('iron', kettle, new THREE.Matrix4().makeTranslation(apex[0], 0.86, apex[2]), [0.6, 0.58, 0.62], 1); kettle.dispose();
        seg('iron', [apex[0] - 0.24, 0.95, apex[2]], [apex[0], 1.12, apex[2]], 0.012, 0.012, 3); seg('iron', [apex[0], 1.12, apex[2]], [apex[0] + 0.24, 0.95, apex[2]], 0.012, 0.012, 3);
        B.cyl('iron', apex[0] + 0.25, 0.9, apex[2], 0.04, 0.025, 0.14, 5);
        B.solid = true;
        K.shadeMarks.push(['ring', fx_, fy_, 34, 48, 0.75]);
      }
      // the two tents: canvas over an A of poles at each end and a ridge pole, the end toward the fire open on the
      // bedrolls and blankets inside, guy ropes to pegs
      for (const tn of TENTS) {
        const x0 = X(tn.x0), x1 = X(tn.x1), z0 = Z(tn.y0), z1 = Z(tn.y1), zc = (z0 + z1) / 2, H = 2.05, y = Math.min(TH(tn.x0, tn.y1), TH(tn.x1, tn.y1), 0.05) - 0.02, L = x1 - x0;
        B.solid = false;
        // the two slopes (each from the ridge down to the ground, a little past the poles)
        B.quad('cloth', [x0 - 0.05, y + 0.08, z1 + 0.05], [x1 + 0.05, y + 0.08, z1 + 0.05], [x1 + 0.12, y + H, zc], [x0 - 0.12, y + H, zc], [0, 0, L / 1.3, 1.5], [0.86, 0.88, 0.96]);
        B.quad('cloth', [x1 + 0.05, y + 0.08, z0 - 0.05], [x0 - 0.05, y + 0.08, z0 - 0.05], [x0 - 0.12, y + H, zc], [x1 + 0.12, y + H, zc], [0, 0, L / 1.3, 1.5], [0.72, 0.74, 0.82]);
        // the closed end
        const xe = tn.open === 'e' ? x0 : x1;
        B.tri('cloth', [xe, y + 0.08, z0], [xe, y + 0.08, z1], [xe, y + H, zc], [[0, 0], [1.6, 0], [0.8, 1.2]], [0.78, 0.8, 0.88]);
        // the bedrolls and a blanket inside
        for (const [dz, c] of [[-0.42, [0.48, 0.5, 0.82]], [0.42, [0.82, 0.5, 0.42]]]) { const roll = new THREE.CylinderGeometry(0.2, 0.2, L * 0.62, 9); roll.rotateZ(Math.PI / 2); B.geom('cloth', roll, new THREE.Matrix4().makeTranslation((x0 + x1) / 2 + (tn.open === 'e' ? 0.25 : -0.25), y + 0.2, zc + dz), c, [1, 1]); roll.dispose(); }
        B.box('cloth', (x0 + x1) / 2, y + 0.02, zc, L * 0.85, 0.06, 1.7, 0, [0.62, 0.55, 0.5]);
        B.solid = true;
        // the poles: an A at each end, the ridge pole, the guy ropes and pegs
        const PC = [0.72, 0.58, 0.48];
        for (const xe2 of [x0, x1]) for (const s of [-1, 1]) seg('wood', [xe2, y - 0.1, zc + s * 1.2], [xe2, y + H + 0.18, zc - s * 0.1], 0.04, 0.035, 5, PC);
        seg('wood', [x0 - 0.15, y + H, zc], [x1 + 0.15, y + H, zc], 0.035, 0.035, 5, PC);
        for (const xe2 of [x0 - 0.12, x1 + 0.12]) { const dx = xe2 < (x0 + x1) / 2 ? -0.9 : 0.9; seg('wood', [xe2, y + H, zc], [xe2 + dx, y + 0.05, zc], 0.012, 0.012, 3, [0.95, 0.85, 0.7]); B.box('wood', xe2 + dx, y - 0.1, zc, 0.06, 0.25, 0.06, 0, PC, { solid: false }); }
        K.addBlock([[tn.x0 - 6, tn.y0 - 3], [tn.x1 + 6, tn.y0 - 3], [tn.x1 + 6, tn.y1 + 3], [tn.x0 - 6, tn.y1 + 3]]);
        K.shadeMarks.push(['rect', tn.x0, tn.y0, tn.x1, tn.y1, 0.6], ['dot', (tn.x0 + tn.x1) / 2, (tn.y0 + tn.y1) / 2, 46, 0.62]);
      }
      // the chests, the stool, the stumps, the crates, the firewood (each filling its block on the walking map)
      chest(731, 376, 1.15, 0.72, 0.66, 0.08); crate(738, 390, 0.5, 0.4);                  // by the west tent
      B.cyl('planks', X(711), TH(711, 410), Z(410), 0.24, 0.22, 0.46, 8, [0.8, 0.64, 0.52]); B.cyl('wood', X(717), TH(717, 420), Z(420), 0.2, 0.24, 0.4, 9, [0.7, 0.62, 0.58]);   // the stool, a bucket
      chest(683, 446, 1.2, 0.72, 0.62, -0.05, [0.72, 0.56, 0.48]);                         // in the nook
      stump(712, 478, 0.4, 0.5);
      chest(746, 518, 1.3, 0.8, 0.7, 0.04); B.geom('cloth', K.ico[1], new THREE.Matrix4().compose(V3(X(764), 0.3, Z(526)), QY(0.4), V3(0.3, 0.36, 0.26)), [0.9, 0.8, 0.6], 1);   // at the wall's end, a sack
      stump(860, 494, 0.4, 0.42); stump(884, 493, 0.44, 0.62);                            // east of the fire
      crate(940, 432, 0.85, 0.15);                                                         // by the east tent
      { const top = crate(882, 296, 0.95, 0.1); crate(886, 296, 0.75, -0.2, top); crate(904, 318, 0.7, 0.3); }   // by the hut
      { const x = X(852), z = Z(318), y = TH(852, 318);                                     // the firewood pile
        for (let row = 0; row < 3; row++) for (let i = 0; i < 4 - row; i++) { const lg = new THREE.CylinderGeometry(0.13, 0.13, 1.1, 7); lg.rotateX(Math.PI / 2); B.geom('wood', lg, new THREE.Matrix4().makeTranslation(x - 0.4 + i * 0.27 + row * 0.13, y + 0.13 + row * 0.23, z), [0.82, 0.66, 0.55], [1, 1]); lg.dispose(); } }

      B = FAR;   // (from here on, but for the little falls and the milestone)
      // ================= the landing ground: four stakes with stones at their feet, thick ropes slung between ============
      {
        const r = W.rand(313), top = 1.25;
        for (const [px, py] of STAKES) {
          post(px, py, 1.45, 0.17, [0.72, 0.6, 0.52]);
          for (let i = 0; i < 4; i++) { const a = r() * TAU, d = 0.35 + r() * 0.3; rock(px + Math.cos(a) * d / SX, py + Math.sin(a) * d / SZ, 0.38 + r() * 0.2); }
        }
        B.solid = false;
        for (let i = 0; i < 4; i++) {
          const [ax, ay] = STAKES[i], [bx, by] = STAKES[(i + 1) % 4], A = [X(ax), TH(ax, ay) + top, Z(ay)], Bp = [X(bx), TH(bx, by) + top, Z(by)], n = 14;
          let prev = A;
          for (let k = 1; k <= n; k++) { const f = k / n, gx = ax + (bx - ax) * f, gy = ay + (by - ay) * f, sag = Math.sin(Math.PI * f) * 0.65, p = [A[0] + (Bp[0] - A[0]) * f, Math.max(TH(gx, gy) + 0.25, A[1] + (Bp[1] - A[1]) * f - sag), A[2] + (Bp[2] - A[2]) * f]; seg('wood', prev, p, 0.035, 0.035, 4, [1.05, 0.9, 0.7]); prev = p; }
        }
        B.solid = true;
      }

      // ================= the fence behind the hut: split rails between leaning posts =================
      {
        const PTS = [[770, 96], [806, 104], [836, 120], [862, 140], [886, 162], [906, 190]];
        for (const [px, py] of PTS) post(px, py, 1.25, 0.09, [0.62, 0.52, 0.46]);
        for (let i = 1; i < PTS.length; i++) { const [ax, ay] = PTS[i - 1], [bx, by] = PTS[i]; for (const hh of [0.55, 1.05]) seg('wood', [X(ax), TH(ax, ay) + hh, Z(ay)], [X(bx), TH(bx, by) + hh, Z(by)], 0.05, 0.05, 5, [0.66, 0.55, 0.48]); K.addBlock(ribbon([PTS[i - 1], PTS[i]], 0.14)); }
      }

      // ================= the dry-stone walls: their bodies, capstones and end pillars =================
      {
        const r = W.rand(733), WC = [1.9, 1.85, 2.0];
        for (const wl of PL.walls) {
          for (let k = 1; k < wl.pts.length; k++) {
            const [ax, ay] = wl.pts[k - 1], [bx, by] = wl.pts[k], L = Math.hypot((bx - ax) * SX, (by - ay) * SZ), ry = Math.atan2(-(by - ay) * SZ, (bx - ax) * SX), n = Math.max(1, Math.ceil(L / 1.1));
            for (let i = 0; i < n; i++) { const f = (i + 0.5) / n, px = ax + (bx - ax) * f, py = ay + (by - ay) * f, g = K.gh(px, py), hh = wl.H * (0.88 + r() * 0.14); B.box('dry', X(px), g - 0.4, Z(py), L / n + 0.03, hh + 0.4, wl.t, ry, WC, { u0: i * L / n }); K.shadeMarks.push(['dot', px, py, 12, 0.85]); }
            for (let s = 0.25; s < L; s += 0.42 + r() * 0.12) { const f = s / L, px = ax + (bx - ax) * f, py = ay + (by - ay) * f; B.box('dry', X(px), K.gh(px, py) + wl.H * 0.95 - 0.04, Z(py), 0.38 + r() * 0.12, 0.16 + r() * 0.1, wl.t + 0.06, ry + (r() - 0.5) * 0.3, [1.7, 1.66, 1.8]); }
          }
          for (const [e, [px, py]] of [wl.pts[0], wl.pts[wl.pts.length - 1]].entries()) { if (px >= 1536 || (wl.ends && !wl.ends[e])) continue; const g = K.gh(px, py); B.box('dry', X(px), g - 0.4, Z(py), 0.72, wl.H + 0.75, 0.72, 0, [2.0, 1.96, 2.1]); B.box('dry', X(px), g + wl.H + 0.35, Z(py), 0.84, 0.14, 0.84, 0, [1.6, 1.56, 1.7]); K.addBlock(K.circlePx(px, py, 0.45, 8)); }
        }
        // the wall's pillar beside the north path, and the old wooden posts standing in the walls
        { const g = K.gh(1106, 320); B.box('dry', X(1106), g - 0.4, Z(320), 0.75, 1.75, 0.7, 0, [2.0, 1.96, 2.1]); B.box('dry', X(1106), g + 1.35, Z(320), 0.86, 0.14, 0.8, 0, [1.6, 1.56, 1.7]); K.addBlock(K.circlePx(1106, 320, 0.45, 8)); }
        post(1281, 308, 1.4, 0.12, [0.6, 0.5, 0.45]); post(1078, 612, 1.3, 0.12, [0.6, 0.5, 0.45]); post(497, 648, 1.4, 0.12, [0.6, 0.5, 0.45]);
      }

      // ================= the lookout: a round paving of stones on its low mound, ringed by boulders ==============
      {
        const [lx, ly] = LOOK.c, cx = X(lx), cz = Z(ly), r = W.rand(1717);
        B.solid = false;
        for (let i = 0; i < 18; i++) { const a = i / 18 * TAU, x = cx + Math.cos(a) * (LOOK.R + 0.15), z = cz + Math.sin(a) * (LOOK.R + 0.15), s = 0.26 + r() * 0.08; B.geom('rock', K.rockG[i % 3], new THREE.Matrix4().compose(V3(x, TH(K.M.px(x), K.M.py(z)) - 0.08, z), QY(a), V3(s * 1.3, s * 0.9, s)), [1.05, 1.05, 1.1], 0.6); }
        B.solid = true;
        K.light(lx, ly, 120, 0.25, 'moon');
      }

      // ================= the slab bridge: flat slabs over the stream, upright stones along each side ============
      {
        const x = X((SLAB.x0 + SLAB.x1) / 2), w = X(SLAB.x1) - X(SLAB.x0), r = W.rand(4141), n = 5, z0 = Z(SLAB.y0), z1 = Z(SLAB.y1), dz = (z1 - z0) / n;
        B.solid = false;
        for (let i = 0; i < n; i++) B.box('dry', x + (r() - 0.5) * 0.08, -0.22, z0 + dz * (i + 0.5), w + (r() - 0.5) * 0.12, 0.25, dz - 0.05, (r() - 0.5) * 0.06, [1.25 + r() * 0.1, 1.24, 1.32]);
        B.solid = true;
        for (const py of [858, 902]) B.box('stone', x, LEVEL - 0.6, Z(py), w - 0.2, 1.3, 0.5, 0, [0.7, 0.7, 0.75], { solid: false });
        // the upright stones (the walking map's own, along its sides) and the tall ones at its north-west corner
        const UP = [[891, 838, 0.62], [886, 858, 0.55], [881, 877, 0.5], [873, 894, 0.62], [865, 912, 0.55], [961, 840, 0.55], [958, 858, 0.62], [954, 878, 0.5], [950, 898, 0.6], [947, 918, 0.5],
          [874, 812, 0.85], [884, 826, 0.7], [864, 832, 0.75]];
        for (const [px, py, s] of UP) { const y = Math.max(TH(px, py), LEVEL + 0.1); B.geom('rock', K.rockG[px % 3], new THREE.Matrix4().compose(V3(X(px), y - 0.2, Z(py)), QY(px * 0.7), V3(s * 0.5, s * 1.3, s * 0.42)), [1.15, 1.15, 1.2], 1.0); }
        K.shadeMarks.push(['rect', SLAB.x0, SLAB.y0, SLAB.x1, SLAB.y1, 0.75]);
      }

      // ================= the painting's boulders, birches, gorse and heather =================
      for (const [px, py, s] of BOULDERS) rock(px, py, s * 1.3, { sink: 0.3 });
      for (const [px, py, s, n] of BIRCHES) birch(px, py, s, n, Math.round(px + py));
      {
        // gorse and heather on a jittered grid over the painting, off the walk, the camp and the stream
        const r = W.rand(2026), STEP = 46, nearRock = (px, py) => BOULDERS.some((b) => Math.hypot(px - b[0], py - b[1]) < 34 * b[2]);
        const keep = (px, py) => hutD(px, py) > HUT.R + 0.8 && !(px > 590 && px < 960 && py > 330 && py < 540) && !(px > 90 && px < 580 && py > 300 && py < 560) && streamD(px, py) > 18 && mDist(px, py, LOOK.c[0], LOOK.c[1]) > LOOK.R + 0.8 && !W.inPoly(NOOK, px, py);
        for (let gy = -30; gy < 1060; gy += STEP) for (let gx = -30; gx < 1570; gx += STEP) {
          const px = gx + (r() - 0.5) * STEP, py = gy + (r() - 0.5) * STEP, rr = 0.45 + r() * 0.55, roll_ = r();
          if (roll_ > 0.62 || !keep(px, py) || nearRock(px, py)) continue;
          if (walkDist(px, py) < rr / SX + 6) continue;
          bush(px, py, rr, r() < 0.55 ? 'gorse' : 'heather', r);
        }
        // tufts of grass on the landing ground and reeds at the stream's edges
        for (let i = 0; i < 26; i++) { const px = 130 + r() * 420, py = 340 + r() * 180; tuft(px, py, 6, 0.35, [0.7, 0.75, 0.45]); }
        for (let i = 0; i < 40; i++) { const px = 200 + r() * 1336, [c, hw] = streamAt(px), py = c + (r() < 0.5 ? -1 : 1) * (hw + 2 + r() * 6); if (px > 880 && px < 970) continue; tuft(px, py, 8, 1.0, [0.7, 0.82, 0.55]); }
        // floating leaves on the water
        for (let i = 0; i < 30; i++) { const px = 220 + r() * 1300, [c, hw] = streamAt(px), py = c + (r() - 0.5) * hw * 1.2, x = X(px), z = Z(py), rr = 0.18 + r() * 0.14; if (px > 880 && px < 970) continue;
          for (let j = 0; j < 7; j++) { const a0 = j / 7 * TAU, a1 = (j + 1) / 7 * TAU; B.tri('cloth', [x, LEVEL + 0.02, z], [x + Math.cos(a1) * rr, LEVEL + 0.02, z + Math.sin(a1) * rr], [x + Math.cos(a0) * rr, LEVEL + 0.02, z + Math.sin(a0) * rr], [[0, 0], [1, 0], [0, 1]], [0.55, 0.85, 0.6]); } }
        // the stream's little falls: white water and a glint
        B = K.B;
        for (const [px, py] of [[600, 848], [1140, 902], [1320, 935]]) { K.halo(X(px), LEVEL + 0.3, Z(py), 1.4, [0.25, 0.3, 0.45]); for (let j = 0; j < 4; j++) { const x = X(px) + (j - 1.5) * 0.25, z = Z(py); B.quad('glass', [x - 0.1, LEVEL - 0.05, z + 0.15], [x + 0.1, LEVEL - 0.05, z + 0.15], [x + 0.1, LEVEL + 0.25, z - 0.1], [x - 0.1, LEVEL + 0.25, z - 0.1], [0, 0, 1, 1], [0.5, 0.55, 0.7]); } }
        B = FAR;
      }

      // ================= the road's amber seams: a faint warm light along it =================
      {
        const pts = [[700, 585], [800, 572], [900, 566], [1000, 556], [1100, 535], [1200, 522], [1300, 500], [1400, 466], [1500, 452]].concat(ROAD.pts.slice(1, -1));
        for (const [px, py] of pts) K.light(px, py, 60, 0.18, 'warm');
      }

      // ================= past the painting: boulders, gorse and heather scattered over the moor ===============
      {
        const r = W.rand(9090), STEP = 70;
        for (let gy = -1000; gy < 2040; gy += STEP) for (let gx = -1520; gx < 3060; gx += STEP) {
          const px = gx + (r() - 0.5) * STEP, py = gy + (r() - 0.5) * STEP, u = r(), rr = 0.5 + r() * 0.7;
          if (inPaint(px, py, 30) || !inBounds(px, py) || streamD(px, py) < 26) continue;
          const pd = pathDist(px, py), near = pd < 140;
          const dens = 0.18 + 0.35 * W.vnoise(px / 300 + 4, py / 300);
          if (u > dens) continue;
          if (pd < rr / SX + 10 || nearLandmark(px, py)) continue;
          if (r() < 0.42) rock(px, py, 0.6 + r() * 1.3, { low: !near });
          else bush(px, py, rr, r() < 0.55 ? 'gorse' : 'heather', r, !near);
        }
      }
      function nearLandmark(px, py) {
        return mDist(px, py, TOR.c[0], TOR.c[1]) < 9 || mDist(px, py, CAIRN.c[0], CAIRN.c[1]) < 7 || mDist(px, py, FOLD.c[0], FOLD.c[1]) < FOLD.r + 3 ||
          mDist(px, py, POOL.c[0], POOL.c[1]) < 9 || mDist(px, py, CART.at[0], CART.at[1]) < 6 || mDist(px, py, MILE.at[0], MILE.at[1]) < 3;
      }

      // ================= the tor in the west: great rounded boulders stacked on a knoll, a birch beside =========
      {
        const [tx, ty] = TOR.c, y = TH(tx, ty);
        const STACK = [[0, 0, 0, 3.0, 1], [2.2, 0.4, 0, 2.2, 1], [-2.0, -0.6, 0, 2.4, 1], [0.4, 1.9, 0.2, 2.0, 0.8], [-0.4, 3.4, -0.2, 1.4, 0.7], [1.2, -0.8, 1.8, 1.6, 0.8], [-1.4, 0.8, 1.6, 1.2, 0.7]];
        for (const [dx, dy, dz, s, sy] of STACK) B.geom('rock', K.rockG[Math.abs(Math.round(dx * 3)) % 3], new THREE.Matrix4().compose(V3(X(tx) + dx, y + dy - s * 0.15, Z(ty) + dz), QY(dx * 1.3 + dz), V3(s, s * sy, s * 0.95)), [0.95, 0.95, 1.0], 1.4);
        K.addBlock(ellipse([tx, ty], 3.4 / SX, 2.6 / SZ, 14, 0.1));
        for (const [ox, oy, s] of [[-110, 40, 0.8], [90, 50, 0.7], [60, -50, 0.6], [-80, -46, 0.7]]) rock(tx + ox, ty + oy, s);
        birch(tx + 120, ty - 10, 1.1, 2, 777, [0.15, 0]);
        const r = W.rand(55); for (let i = 0; i < 6; i++) { const a = r() * TAU, d = 4.5 + r() * 2; bush(tx + Math.cos(a) * d / SX, ty + Math.sin(a) * d / SZ, 0.6 + r() * 0.3, 'gorse', r); }
        K.shadeMarks.push(['dot', tx, ty, 110, 0.6]);
      }

      // ================= the cairn on its hill, past the lookout: a cone of stones, a tall slab set in it ======
      {
        const [cx_, cy_] = CAIRN.c, x = X(cx_), z = Z(cy_), y = TH(cx_, cy_), r = W.rand(808);
        for (let layer = 0; layer < 7; layer++) { const hh = layer * 0.3, rad = 1.65 * (1 - hh / 2.3), n = Math.max(1, Math.round(rad * 5.5)); for (let i = 0; i < n; i++) { const a = i / n * TAU + layer * 0.9 + r() * 0.3, rr = rad * (0.75 + r() * 0.3), s = 0.36 + r() * 0.16; B.geom('rock', layer < 2 ? ROCK_LOW[(i + layer) % 3] : K.rockG[(i + layer) % 3], new THREE.Matrix4().compose(V3(x + Math.cos(a) * rr, y + hh - 0.12, z + Math.sin(a) * rr), QY(r() * TAU), V3(s, s * 1.1, s)), [0.86 + r() * 0.12, 0.86 + r() * 0.1, 0.94], 0.8); } }
        B.box('stone', x + 0.1, y + 1.2, z, 0.55, 1.75, 0.24, 0.4, [1.0, 1.0, 1.06]);
        K.addBlock(K.circlePx(cx_, cy_, 1.9, 12));
        for (let i = 0; i < 5; i++) { const a = r() * TAU, d = 4 + r() * 3; rock(cx_ + Math.cos(a) * d / SX, cy_ + Math.sin(a) * d / SZ, 0.5 + r() * 0.5); }
        K.halo(x, y + 1.5, z, 7, [0.1, 0.12, 0.22]);
      }

      // ================= the old sheepfold in the south: a round dry-stone pen, tumbled in places, its way in on the
      // north; a fallen lintel and a lean-to of slabs inside (a corner out of the wind) =================
      {
        const [fx_, fy_] = FOLD.c, R = FOLD.r, r = W.rand(1212), n = 34, gw = 0.24;
        for (let i = 0; i < n; i++) {
          const a = i / n * TAU, da = Math.atan2(Math.sin(a - FOLD.gap), Math.cos(a - FOLD.gap)); if (Math.abs(da) < gw) continue;
          const x = X(fx_) + Math.cos(a) * R, z = Z(fy_) + Math.sin(a) * R, px = K.M.px(x), py = K.M.py(z), g = TH(px, py), tumble = 0.5 + 0.5 * Math.abs(Math.sin(i * 1.3)) + (i % 7 === 3 ? -0.45 : 0);
          B.box('dry', x, g - 0.35, z, TAU * R / n + 0.08, 1.05 * tumble + 0.35, 0.6, Math.atan2(-Math.cos(a), -Math.sin(a)), [1.85, 1.8, 1.95], { u0: i * 0.95 });
          if (tumble < 0.4) for (let j = 0; j < 3; j++) rock(px + (r() - 0.5) * 30, py + (r() - 0.5) * 24, 0.25 + r() * 0.15, { col: [0.9, 0.9, 0.95] });
        }
        // the gateposts either side of the way in
        for (const s of [-1, 1]) { const a = FOLD.gap + s * (gw + 0.06), x = X(fx_) + Math.cos(a) * R, z = Z(fy_) + Math.sin(a) * R, g = TH(K.M.px(x), K.M.py(z)); B.box('stone', x, g - 0.3, z, 0.45, 1.75, 0.45, a, [1.0, 0.98, 1.02]); }
        // the lean-to of slabs in the south-west corner
        { const a = Math.PI * 0.72, x = X(fx_) + Math.cos(a) * (R - 1.1), z = Z(fy_) + Math.sin(a) * (R - 1.1), g = TH(K.M.px(x), K.M.py(z)), ry = Math.atan2(-Math.cos(a), -Math.sin(a));
          B.box('dry', x + Math.cos(a) * 0.5, g - 0.2, z + Math.sin(a) * 0.5, 2.2, 1.5, 0.5, ry, [0.9, 0.9, 0.95]);
          B.solid = false; B.box('stone', x, g + 1.2, z, 2.4, 0.14, 1.5, ry, [0.85, 0.85, 0.9]); B.solid = true;
          for (const s of [-1, 1]) B.box('dry', x - Math.sin(a) * s * 1.05, g - 0.2, z + Math.cos(a) * s * 1.05, 0.4, 1.4, 1.2, ry, [0.9, 0.9, 0.95]); }
        // a birch by the wall's north-east, white flowers in the grass inside
        birch(fx_ + 170, fy_ - 40, 1.0, 1, 1313, [0.1, 0.05]);
        for (let i = 0; i < 6; i++) { const a = r() * TAU, d = r() * (R - 1.5); bush(fx_ + Math.cos(a) * d / SX, fy_ + Math.sin(a) * d / SZ, 0.32, 'green', r); }
        K.shadeMarks.push(['ring', fx_, fy_, R / SX - 12, R / SX + 12, 0.7]);
      }

      // ================= the pool where the stream widens: rocks round it, reeds, leaves, a birch leaning over =====
      {
        const [px0, py0] = POOL.c, r = W.rand(2323);
        for (let i = 0; i < 26; i++) { const x = 2230 + r() * 330, [c, hw] = streamAt(x), side = r() < 0.5 ? -1 : 1, py = c + side * (hw + 4 + r() * 10); if (Math.abs(x - 2650) < 30) continue; rock(x, py, 0.55 + r() * 0.8); }
        for (let i = 0; i < 12; i++) { const x = 2250 + r() * 300, [c, hw] = streamAt(x), py = c + (r() < 0.5 ? -1 : 1) * (hw + 2); tuft(x, py, 9, 1.1, [0.7, 0.82, 0.55]); }
        for (let i = 0; i < 18; i++) { const x = 2260 + r() * 280, [c, hw] = streamAt(x), py = c + (r() - 0.5) * hw * 1.5, X0 = X(x), Z0 = Z(py), rr = 0.2 + r() * 0.2;
          for (let j = 0; j < 7; j++) { const a0 = j / 7 * TAU, a1 = (j + 1) / 7 * TAU; B.tri('cloth', [X0, LEVEL + 0.02, Z0], [X0 + Math.cos(a1) * rr, LEVEL + 0.02, Z0 + Math.sin(a1) * rr], [X0 + Math.cos(a0) * rr, LEVEL + 0.02, Z0 + Math.sin(a0) * rr], [[0, 0], [1, 0], [0, 1]], [0.55, 0.85, 0.6]); } }
        birch(2300, 1010, 1.15, 2, 2300, [0.2, 0.35]);
        birch(2520, 1250, 1.0, 1, 2520, [-0.1, -0.3]);
        K.halo(X(px0), LEVEL + 0.4, Z(py0), 9, [0.14, 0.17, 0.3]);
      }
      // the stepping stones (both fords)
      for (const f of FORDS) {
        const [c, hw] = streamAt(f.x), n = f.n;
        for (let i = 0; i < n; i++) { const py = c - hw + (2 * hw) * (i + 0.5) / n, px = f.x + (i % 2 ? 6 : -6); B.cyl('rock', X(px), LEVEL - 1.0, Z(py), 0.46, 0.4, 1.25, 8, [0.9, 0.92, 0.98], [3.0, 1.2]); }
      }

      // ================= along the road east: the milestone, and the broken cart =================
      B = K.B;   // (its sun glints)
      {
        const [mx, my] = MILE.at, x = X(mx), z = Z(my), y = TH(mx, my);
        B.box('stone', x, y - 0.3, z, 0.55, 1.35, 0.4, 0.05, [1.0, 0.98, 1.02]);
        const top = new THREE.CylinderGeometry(0.275, 0.275, 0.4, 10, 1, false, 0, Math.PI); top.rotateZ(Math.PI / 2); top.rotateY(Math.PI / 2); B.geom('stone', top, new THREE.Matrix4().compose(V3(x, y + 1.05, z), QY(0.05), V3(1, 1, 1)), [1.0, 0.98, 1.02], 1); top.dispose();
        const GOLD = [0.5, 0.4, 0.2], cz = z + 0.21, cy = y + 0.75;
        for (let i = 0; i < 8; i++) { const b0 = i / 8 * TAU, b1 = (i + 1) / 8 * TAU; B.tri('glass', [x, cy, cz], [x + Math.cos(b0) * 0.11, cy + Math.sin(b0) * 0.11, cz], [x + Math.cos(b1) * 0.11, cy + Math.sin(b1) * 0.11, cz], [[0, 0], [1, 0], [0, 1]], GOLD); }
        K.halo(x, cy, cz + 0.1, 0.5, [0.25, 0.18, 0.08]);
        rock(mx - 22, my + 6, 0.35); bush(mx + 30, my - 10, 0.55, 'gorse', W.rand(3));
      }
      B = FAR;
      {
        // a two-wheeled cart, tipped forward on its shafts, one wheel broken off and lying in the heather, two crates and
        // a sack spilled from it
        const [cx_, cy_] = CART.at, x = X(cx_), z = Z(cy_), y = TH(cx_, cy_), ry = 0.35, cs = Math.cos(ry), sn = Math.sin(ry), C = [0.7, 0.56, 0.46];
        const L = (u, v, h) => [x + u * cs + v * sn, y + h, z - u * sn + v * cs];
        // the bed, tilted forward (its front on the ground)
        const tilt = 0.32, bed = new THREE.BoxGeometry(2.4, 0.14, 1.4);
        B.geom('planks', bed, new THREE.Matrix4().compose(V3(...L(0, 0, 0.55)), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, -tilt, 'YXZ')), V3(1, 1, 1)), C, 1); bed.dispose();
        for (const s of [-1, 1]) { const side = new THREE.BoxGeometry(2.4, 0.4, 0.07); B.geom('planks', side, new THREE.Matrix4().compose(V3(...L(0, s * 0.68, 0.78)), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, -tilt, 'YXZ')), V3(1, 1, 1)), [0.66, 0.52, 0.44], 1); side.dispose(); }
        // the shafts, resting on the ground ahead of it
        for (const s of [-0.45, 0.45]) seg('wood', L(-1.0, s, 0.2), L(-3.0, s * 0.8, 0.05), 0.06, 0.05, 5, [0.72, 0.58, 0.48]);
        // the wheel still on, and the one off in the heather
        const wheel = (p, rot, lying) => { const w = new THREE.TorusGeometry(0.62, 0.06, 5, 14); const m = new THREE.Matrix4().compose(V3(...p), lying ? new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)) : new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rot, 0)), V3(1, 1, 1)); B.geom('wood', w, m, [0.7, 0.56, 0.48], 1); w.dispose();
          for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI; const d = [Math.cos(a) * 0.6, Math.sin(a) * 0.6]; const e = lying ? [d[0], 0, d[1]] : [d[0] * Math.cos(rot), d[1], -d[0] * Math.sin(rot)]; seg('wood', add(p, mul(e, -1)), add(p, e), 0.03, 0.03, 3, [0.68, 0.55, 0.46]); } };
        wheel(L(0.3, 0.8, 0.62), ry, false);
        wheel(L(0.6, 2.0, 0.08), 0, true);
        seg('wood', L(0.3, -0.9, 0.62), L(0.3, 0.85, 0.62), 0.05, 0.05, 5, [0.6, 0.5, 0.44]);
        crate(cx_ + 52, cy_ + 20, 0.6, 0.6); crate(cx_ - 30, cy_ + 34, 0.55, -0.3);
        B.geom('cloth', K.ico[2], new THREE.Matrix4().compose(V3(...L(1.6, 0.6, 0.25)), QY(0.6), V3(0.32, 0.25, 0.42)), [0.9, 0.82, 0.62], 1);
        K.addBlock(ellipse([cx_, cy_], 1.9 / SX, 1.3 / SZ, 12, 0));
        K.shadeMarks.push(['dot', cx_, cy_, 60, 0.7]);
        bush(cx_ + 90, cy_ + 30, 0.8, 'gorse', W.rand(91)); rock(cx_ - 70, cy_ + 50, 0.9);
      }

      // ================= the pockets =================
      // the nook behind the hut: between the hut's back and its bank, round past the wall's west end; a stack of cut
      // turves, a log to sit on, white flowers. Boulders and gorse close it on the east, by the fence.
      {
        const r = W.rand(4646);
        for (let i = 0; i < 3; i++) for (let j = 0; j < 3 - i; j++) B.box('soil', X(640) + j * 0.5 + i * 0.25, TH(640, 150) + i * 0.24 - 0.05, Z(150) - 0.1, 0.46, 0.24, 0.5, 0.4, [0.55, 0.5, 0.45]);
        { const lg = new THREE.CylinderGeometry(0.2, 0.22, 1.8, 8); lg.rotateZ(Math.PI / 2); B.geom('wood', lg, new THREE.Matrix4().compose(V3(X(705), TH(705, 128) + 0.18, Z(128)), QY(0.25), V3(1, 1, 1)), [0.75, 0.62, 0.55], [1, 1]); lg.dispose(); }
        for (const [px, py] of [[684, 140], [722, 118], [658, 168]]) bush(px, py, 0.3, 'green', r);
        rock(760, 82, 1.2); rock(790, 120, 0.9); bush(744, 100, 0.85, 'gorse', r); bush(780, 140, 0.8, 'gorse', r);
        bush(598, 230, 0.75, 'gorse', r);     // half hiding the way in, by the wall's end
        K.light(700, 140, 70, 0.3, 'moon');
      }
      // the ledge behind the boulders by the stream: a flat shelf of rock on the north bank, under the big boulder, its way
      // in from the west along the water; a little mossy seat of stone, white flowers, the water just below
      {
        const [lx, ly] = LEDGE.c, r = W.rand(5151);
        bush(lx + 58, ly - 10, 0.7, 'gorse', r);
        B.solid = false; B.box('rock', X(lx), TH(lx, ly) - 0.25, Z(ly), 1.6, 0.3, 1.0, 0.2, [0.85, 0.95, 0.85]); B.solid = true;
        for (const [px, py] of [[lx - 20, ly - 6], [lx + 14, ly - 14]]) bush(px, py, 0.3, 'green', r);
        K.light(lx, ly, 70, 0.35, 'moon');
      }

      // ================= the mist: low banks lying in the hollows (soft glows, drawn last) =================
      for (const [px, py, s] of [[318, 430, 9], [-400, 760, 10], [600, 900, 8], [1300, 980, 9], [2390, 1112, 11], [-820, 500, 9], [1090, -500, 10], [520, 1450, 10],
        [2000, 200, 10], [2600, -400, 10], [-600, -600, 10], [200, -500, 9], [1600, 1500, 10], [-800, 1400, 10], [2400, 1600, 9], [1800, -200, 9]]) K.halo(X(px), TH(px, py) + s * 0.08, Z(py), s, [0.14, 0.12, 0.24]);
    },
  };
})(window);
