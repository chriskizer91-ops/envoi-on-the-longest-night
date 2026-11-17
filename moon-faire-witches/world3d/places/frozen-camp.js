// frozen-camp.js: the frozen camp in 3D. Its painting (reference/art/walk/wilds/walk-frozen-camp.png, 1536 x 1024) is the
// middle, laid out in the painting's own pixels as src/game/maps.js keeps the walking map: the snowy shelf where the
// airship lands, its landing ground fenced by four snow-capped stakes and a low rope; the camp (the big tent and the small
// one, the stone fire ring and its fire, the stumps round it, the loaded sled and its barrels, the firewood, the lantern
// on its post); the trodden trail east, its branch north to the frozen waterfall and the nook beside it; the snow lane
// winding up north-west between the pines; the path down south to the lookout's flat rock tops. Round the shelf the frozen
// country goes on, one painting's width and height each way (Chris, November 16: wild places are wide open fields in
// heavy fog, with pockets to find), in three steps: the shelf; the high country above the north cliff (the waterfall
// falls from it); the low country under the south cliffs (the lookout looks down on it). Trails go on to the way east to
// Frostmere's shore, up to the frozen pool at the waterfall's head, down to the low country, and west to a frozen tarn.
// Places to find: the waymark cairn at the fork in the east, the frozen pool at the waterfall's head, the broken sled in
// the low country below the lookout, the frozen pool under the small fall in the south-west, the frozen tarn in the west.
// Two pockets: behind the frozen waterfall's ice (a way in at its west end), and a ledge path from the lookout down the
// cliff face to the low country. (No keepsake lies in this place: envoi-final-draft/items/items.js has none at home here.)
// Where Io can walk: the walking map's own walk and block areas, unchanged, plus all the open ground inside open.bounds,
// less the pools' open water (there is none: they are frozen and walkable), ground steeper than about 40 degrees (the
// cliffs), and everything solid (every trunk, rock, column of the cliffs, tent, stake and crate).
// The texture ids are the texture pack's (texture-packs/wilds-north/frozen-camp/inventory.md).
// Heights are metres: the shelf is 0, falling gently south to the lookout (-1.3); the high country +8, the low country
// -7.5; past the painting the ground rolls (about 2 m up and down), gentler along the trails.
(function (G) {
  'use strict';
  const P = G.W3D_PLACES = G.W3D_PLACES || {};
  const ID = 'frozen-camp';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ss = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const SX = 0.04, SZ = 0.05;
  const UP = 8.0, LOW = -7.5;
  const inPoly = (poly, x, y) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
  const edgeDist = (poly, x, y) => { let d = 1e9; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [ax, ay] = poly[j], [bx, by] = poly[i], dx = bx - ax, dy = by - ay, t = clamp(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1), 0, 1); d = Math.min(d, Math.hypot(x - ax - t * dx, y - ay - t * dy)); } return d; };
  const lineDist = (L, x, y) => { let d = 1e9; for (let i = 1; i < L.length; i++) { const [ax, ay] = L[i - 1], [bx, by] = L[i], dx = bx - ax, dy = by - ay, t = clamp(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1), 0, 1); d = Math.min(d, Math.hypot(x - ax - t * dx, y - ay - t * dy)); } return d; };
  const lerpPts = (L, x) => { if (x <= L[0][0]) return L[0][1]; for (let i = 1; i < L.length; i++) if (x <= L[i][0]) { const [xa, ya] = L[i - 1], [xb, yb] = L[i]; return ya + (yb - ya) * (x - xa) / (xb - xa); } return L[L.length - 1][1]; };

  // ---- the north cliff: the line of its foot (y down the painting for each x), and where it is a sheer cliff (k 1) or
  // a gentle rise (k 0: west of the snow lane, and east past the painting, where the high country is reached on foot) ----
  const NFOOT = [[200, 124], [360, 120], [700, 118], [1000, 112], [1036, 102], [1150, 102], [1172, 120], [1411, 120], [1430, 98], [1536, 94], [1700, 112], [1900, 130]];
  const footN = (x) => lerpPts(NFOOT, x);
  const kN = (x) => ss(260, 380, x) * (1 - ss(1640, 1840, x));
  // ---- the south rim: the low country is inside this outline (the rim is its top edge), its cliff sheer between the
  // shelf's west end and the east trail's far branch, a gentle slope beyond ----
  const RIM = [[-1700, 860], [-600, 878], [-200, 870], [0, 868], [150, 878], [260, 898], [420, 905], [560, 885], [640, 880], [690, 900], [705, 950],
    [800, 964], [950, 960], [1060, 950], [1120, 930], [1130, 880], [1092, 830], [1032, 790], [1008, 740], [1032, 695], [1110, 668], [1250, 656],
    [1400, 652], [1536, 662], [1700, 700], [2000, 770], [3200, 770], [3200, 2200], [-1700, 2200]];
  const RIM_LINE = RIM.slice(0, 27);
  const kS = (x) => ss(-460, -200, x) * (1 - ss(1700, 1940, x));

  // ---- the ledge path (a pocket): from the lookout's west end west along the cliff face, just under the rim, down to the
  // low country by the small frozen fall, [x, y, height] ----
  const LEDGE = [[724, 914, -1.3], [692, 924, -1.7], [640, 912, -2.5], [560, 915, -3.6], [480, 927, -4.8], [400, 934, -5.9], [330, 934, -6.8], [296, 958, -7.4]];
  const LEDGE_W = 0.8;   // its half width (m)

  // ---- the trails past the painting: centre lines in pixels, and their half widths (m). The painting's own paths are
  // the walking map's walk areas; these carry them on to the way out and to the places to find. ----
  const TRAILS = [
    { id: 'east', w: 1.3, pts: [[1520, 570], [1700, 584], [1900, 562], [2100, 592], [2350, 622], [2600, 600], [2800, 572], [2962, 574]] },
    { id: 'north-east', w: 0.8, pts: [[2100, 592], [2060, 420], [1980, 220], [1900, 20], [1760, -110], [1580, -150], [1420, -100], [1330, -40]] },
    { id: 'high', w: 0.7, pts: [[150, 62], [130, -60], [210, -190], [420, -250], [700, -230], [980, -170], [1180, -90], [1300, -48]] },
    { id: 'south', w: 0.8, pts: [[2100, 592], [2130, 800], [2060, 1010], [1880, 1180], [1600, 1250], [1300, 1180], [1040, 1130], [900, 1110]] },
    { id: 'under', w: 0.7, pts: [[900, 1110], [700, 1100], [500, 1060], [370, 1036], [280, 1010]] },
    { id: 'west', w: 0.9, pts: [[24, 450], [-200, 468], [-450, 432], [-700, 452], [-830, 420]] },
    { id: 'south-west', w: 0.7, pts: [[-450, 432], [-520, 700], [-470, 980], [-280, 1140], [0, 1150], [280, 1010]] },
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
  // where along the ledge path a point is (0 at its top, 1 at its foot), and how far from its centre line (m)
  const LEDGE_POLY = ribbon(LEDGE.map((p) => [p[0], p[1]]), LEDGE_W);
  function ledgeAt(x, y) {
    let best = null, acc = 0; const segs = [];
    for (let i = 1; i < LEDGE.length; i++) { const a = LEDGE[i - 1], b = LEDGE[i], L = Math.hypot((b[0] - a[0]) * SX, (b[1] - a[1]) * SZ); segs.push(L); }
    for (let i = 1; i < LEDGE.length; i++) {
      const a = LEDGE[i - 1], b = LEDGE[i], dx = (b[0] - a[0]) * SX, dz = (b[1] - a[1]) * SZ, L = segs[i - 1];
      const t = clamp(((x - a[0]) * SX * dx + (y - a[1]) * SZ * dz) / (L * L), 0, 1), d = Math.hypot((x - a[0]) * SX - t * dx, (y - a[1]) * SZ - t * dz);
      if (!best || d < best.d) best = { d, h: a[2] + (b[2] - a[2]) * t };
      acc += L;
    }
    return best;
  }

  // ---- the places to find ----
  const CAIRN = [2130, 640];                       // the waymark cairn at the fork in the east
  const HEAD = { c: [1300, -20], rx: 150, ry: 70 }; // the frozen pool at the waterfall's head, on the high country
  const SLED2 = [900, 1150];                        // the broken sled, half buried, in the low country below the lookout
  const FALLPOOL = { c: [250, 985], rx: 90, ry: 40 }; // the frozen pool under the small fall, at the south-west cliff's foot
  const TARN = { c: [-900, 360], rx: 230, ry: 120 }; // the frozen tarn in the west
  const ellipse = (c, rx, ry, n, wob) => Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2, k = 1 + (wob || 0) * Math.sin(a * 3 + 1.3) * Math.cos(a * 2); return [Math.round(c[0] + Math.cos(a) * rx * k), Math.round(c[1] + Math.sin(a) * ry * k)]; });
  const HEADP = ellipse(HEAD.c, HEAD.rx, HEAD.ry, 18, 0.12), FALLP = ellipse(FALLPOOL.c, FALLPOOL.rx, FALLPOOL.ry, 16, 0.1), TARNP = ellipse(TARN.c, TARN.rx, TARN.ry, 22, 0.14);
  // ---- the frozen waterfall: its ice from x 1186 to 1411 down the north cliff, its foot at y 120; the pocket behind the
  // ice (between the rock and the ice pillars standing out from it), its way in at the west end ----
  const FALL = { x0: 1186, x1: 1411, foot: 120 };
  const PILLARS = [[1222, 164, 0.85], [1250, 170, 0.65], [1276, 166, 0.6], [1300, 171, 0.65], [1326, 166, 0.6], [1356, 168, 0.9], [1390, 162, 0.75]];
  const BEHIND = [[1192, 128], [1404, 126], [1404, 142], [1372, 148], [1238, 148], [1204, 154], [1196, 174], [1184, 174]];

  // ---- the ground ----
  const W3D = () => G.W3D;
  const roll = (x, y, t) => (W3D().vnoise(x / 420, y / 420) - 0.5) * 4.5 + t * (W3D().vnoise(x / 140, y / 140) - 0.5) * 1.3;
  const outOf = (x, y) => Math.hypot(Math.max(0, -x, x - 1536), Math.max(0, -y, y - 1024));
  let FLAT = null;   // the frozen pools' levels, once worked out
  function raw(x, y) {
    // the shelf: level, falling gently south to the lookout and the rim
    let h = -1.3 * ss(620, 880, y);
    // the high country above the north cliff: a sheer rise where kN is 1, a long gentle one where it is 0
    const k = kN(x), gC = ss(footN(x), footN(x) - 30, y), gG = ss(300, -320, y);
    const up = UP + (W3D().vnoise(x / 300 + 7, y / 300) - 0.5) * 2.4;
    h += (up - h) * (k * gC + (1 - k) * gG);
    // the low country under the south rim
    if (inPoly(RIM, x, y)) {
      const d = lineDist(RIM_LINE, x, y), s = kS(x), f = s * ss(0, 26, d) + (1 - s) * ss(0, 600, d);
      h += (LOW - h) * f;
    }
    // rolling ground past the painting, gentler along the trails
    const out = outOf(x, y), kr = ss(0, 300, out);
    if (kr > 0) h += kr * roll(x, y, ss(25, 90, trailDist(x, y))) * (0.35 + 0.65 * ss(40, 140, trailDist(x, y)));
    return h;
  }
  function ground(x, y) {
    if (!FLAT) FLAT = { head: raw(HEAD.c[0], HEAD.c[1]), fall: raw(FALLPOOL.c[0], FALLPOOL.c[1]), tarn: raw(TARN.c[0], TARN.c[1]) };
    // the ledge path down the cliff face
    if (inPoly(LEDGE_POLY, x, y)) { const L = ledgeAt(x, y); return L.h; }
    let h = raw(x, y);
    // the frozen pools lie level, in shallow hollows
    for (const [c, rx, ry, lv] of [[HEAD.c, HEAD.rx, HEAD.ry, FLAT.head], [FALLPOOL.c, FALLPOOL.rx, FALLPOOL.ry, FLAT.fall], [TARN.c, TARN.rx, TARN.ry, FLAT.tarn]]) {
      const e = Math.hypot((x - c[0]) / rx, (y - c[1]) / ry);
      if (e < 1.6) h += (lv - 0.35 - h) * (1 - ss(0.95, 1.6, e));
    }
    return h;
  }
  // the walking map's own walk areas (for keeping things off them), with their boxes
  let WB = null;
  const mapWalk = () => WB || (WB = (((G.MAPS || {})[ID] || { walk: [] }).walk).map((p) => { let a = 1e9, b = 1e9, c = -1e9, e = -1e9; for (const [x, y] of p) { a = Math.min(a, x); b = Math.min(b, y); c = Math.max(c, x); e = Math.max(e, y); } return { p, b: [a, b, c, e] }; }));
  const walkDist = (x, y) => { let d = 1e9; for (const q of mapWalk()) { if (inPoly(q.p, x, y)) return 0; if (x > q.b[0] - d && x < q.b[2] + d && y > q.b[1] - d && y < q.b[3] + d) d = Math.min(d, edgeDist(q.p, x, y)); } return d; };

  // ---- the camp's things, in pixels ----
  const BIGTENT = { c: [776, 302], w: 5.6, d: 4.2, h: 3.4, ry: 0.229 };     // its front faces a little east of south
  const SMALLTENT = { c: [986, 398], w: 2.8, d: 3.8, h: 2.25, ry: 1.317 };  // its ridge east-south-east, its door at that end
  const FIRE = { c: [803, 430], rx: 1.7, rz: 1.45 };
  const STUMPS = [[735, 404, 0.36], [760, 391, 0.3], [720, 433, 0.36], [886, 452, 0.34], [861, 479, 0.36]];
  const STAKES = [[110, 330], [496, 330], [106, 588], [521, 588]];
  const SLED = { c: [636, 357], len: 5.4, w: 1.7, ry: -0.434 };
  // snow-capped boulders on the painting: [x, y, size]; the two on the lookout and the one in the snow dip stand in the
  // walking map's blocks
  const BOULDERS = [
    [994 + 18, 889, 0.75], [893, 905, 0.55], [745, 575, 0.44], [350, 669, 0.4],
    // round the waterfall trail and the nook
    [1330, 300, 2.2], [1345, 228, 1.1], [1470, 440, 1.9], [1500, 170, 1.6], [1190, 205, 0.7], [1210, 60, 1.0], [1030, 70, 1.3],
    // along the east trail's south side, and by the lookout path
    [1090, 640, 1.2], [1250, 630, 1.0], [1420, 680, 1.4], [960, 640, 1.1], [720, 660, 1.3], [790, 760, 1.2], [1000, 690, 1.0],
    // the shelf's north edge, behind the camp, and west by the lane
    [600, 210, 1.3], [640, 255, 0.9], [960, 230, 1.0], [470, 160, 1.1], [40, 600, 1.0], [595, 665, 0.8],
    // the south-west slope above the rim
    [330, 820, 1.4], [440, 860, 1.2], [180, 830, 1.1], [60, 800, 1.3], [620, 830, 1.2],
  ];
  // bare frost-white bushes [x, y, size], and low dark bushes with red berries [x, y, radius m]
  const BARE = [[1120, 168, 0.55], [1104, 328, 0.6], [1475, 120, 0.55], [1510, 650, 0.5], [1430, 632, 0.45], [900, 120, 0.5], [600, 110, 0.45], [380, 860, 0.6],
    [1230, 880, 0.6], [1410, 840, 0.55], [80, 760, 0.5], [1080, 740, 0.5]];
  const BERRY = [[1192, 582, 1.0], [1214, 590, 0.8], [1120, 400, 0.9], [560, 230, 0.7], [700, 236, 0.6], [420, 760, 0.8], [962, 626, 0.6], [1010, 620, 0.7],
    [290, 690, 0.6], [1370, 420, 0.8], [2175, 674, 0.7], [-300, 520, 0.8]];

  P[ID] = {
    id: ID, name: 'The frozen camp', painting: "art/walk/walk-frozen-camp.avif", size: [1536, 1024],
    mapId: ID, paintingPng: 'reference/art/walk/wilds/walk-frozen-camp.png',
    // the frozen country: one painting each way round the painting; where Io may roam inside it (the woods close it in)
    extent: [-1536, -1024, 3072, 2048],
    open: { bounds: [[-1180, 300], [-1240, -100], [-1150, -500], [-900, -820], [-400, -880], [200, -840], [800, -900], [1400, -860], [2000, -900], [2500, -820],
      [2850, -500], [2900, 0], [2850, 400], [2960, 520], [2960, 640], [2860, 900], [2900, 1300], [2700, 1700], [2200, 1820], [1600, 1760], [1000, 1840],
      [400, 1780], [-200, 1840], [-800, 1760], [-1150, 1500], [-1240, 1000], [-1160, 600]] },
    // the wall check (tools/walls-test.mjs): from the start, to the camp, each end of the painting's paths, the way out,
    // and every place to find and both pockets
    checks: { from: [630, 452], goals: [
      ['the fire’s rest spot', 800, 478], ['the big tent’s door', 790, 368], ['the landing ground’s middle', 300, 455],
      ['the snow lane’s clearing (north-west)', 160, 78], ['the frozen waterfall’s foot', 1265, 210], ['the nook by the waterfall', 1080, 160],
      ['the lookout', 900, 925], ['the painting’s east edge', 1530, 570],
      ['the way on to Frostmere’s shore (the east exit)', 2950, 575],
      ['the waymark cairn at the fork (east)', 2100, 640], ['the frozen pool at the waterfall’s head (north, high)', 1300, 60],
      ['the broken sled below the lookout (south, low)', 900, 1105], ['the frozen pool under the small fall (south-west, low)', 250, 1030],
      ['the frozen tarn (west)', -900, 470],
      ['behind the frozen waterfall’s ice (pocket)', 1300, 136], ['halfway down the ledge path (pocket)', 560, 915]] },
    // the trees: on the painting from the painting itself (snow-laden spruces); past it in clumps with clearings between,
    // nearly all spruces, a few bare frosted ones. None on the cliffs' faces, on the frozen pools, by the places to find.
    treeGen: { dark: 0.3, step: 44, fir: 1, firSouth: 1, thorn: 0.06,
      out: { density: 0.6, clump: 460, clear: 0.33, kinds: [0, 0.9, 0.1], size: [0.95, 1.55] },
      roads: [],
      keepOut: (function () {
        const k = [[1186, -40, 1411, 200], [1040, 90, 1160, 250], [2040, 560, 2220, 720], [1100, -140, 1500, 80], [760, 1060, 1040, 1230], [130, 920, 370, 1060],
          [-1150, 210, -650, 510], [680, 860, 1130, 990], [340, 620, 430, 740]];
        // the cliffs' faces: along the north cliff's foot and the south rim
        for (let x = 330; x <= 1650; x += 40) { const y = footN(x); k.push([x - 30, y - 60, x + 30, y + 8]); }
        for (let i = 1; i < RIM_LINE.length; i++) { const [ax, ay] = RIM_LINE[i - 1], [bx, by] = RIM_LINE[i]; if (Math.min(ax, bx) < -260 || Math.max(ax, bx) > 1960) continue; const n = Math.ceil(Math.hypot(bx - ax, by - ay) / 36); for (let j = 0; j <= n; j++) { const x = ax + (bx - ax) * j / n, y = ay + (by - ay) * j / n; k.push([x - 26, y - 12, x + 26, y + 40]); } }
        for (const p of LEDGE) k.push([p[0] - 40, p[1] - 30, p[0] + 40, p[1] + 30]);
        return k;
      })() },
    // the ground: trodden snow on the walk and the trails, softer snow along their edges, deep smooth snow everywhere else,
    // and ice on the frozen pools
    ground: { cob: 'snow_trodden_trail', dirt: 'shared_snow', grass: 'shared_snow', pave: 'shared_ice', rep: [3.0, 7.5, 6.0, 3.2],
      grassTint: [1.16, 1.12, 1.0], dirtTint: [1.08, 1.04, 0.96], cobTint: [1.0, 0.98, 1.02], paveTint: [0.9, 0.98, 1.08] },
    // what each kind of surface is made of here
    surfaces: { stone: 'cliff_rock_frozen', dry: 'cliff_rock_frozen', timber: 'shared_planks_wall', planks: 'shared_planks_wall', roof: 'shared_snow',
      wood: 'shared_boardwalk_planks', deck: 'shared_boardwalk_planks', pave: 'snow_trodden_trail', cloth: 'tent_canvas', soil: 'shared_dirt_track', rock: 'cliff_rock_frozen',
      leaves: 'fir_foliage_snowladen', firs: 'fir_foliage_snowladen', bark: 'shared_snow' },
    tints: { leaves: 0xe8eeff, firs: 0xf2f6ff, bush: 0xd8def2, wood: 0xc8b0a0, rock: 0xffffff, cloth: 0xf0e0d0, stone: 0xffffff },
    // snow, ice and the cliffs' rock for what extra builds; the rope; the fire's glow
    extraMats: {
      snow: { tex: 'shared_snow', rep: 2.2, tint: 0xeef0ff, shade: 0.3 },
      ice: { tex: 'frozen_waterfall_ice', rep: 1.4, tint: 0xd8e6ff, emis: 0x10182c, shade: 0.2 },
      icefall: { tex: 'frozen_waterfall_ice', rep: 2.4, tint: 0xf4f8ff, emis: 0x22345a, shade: 0.15 },
      cliff: { tex: 'cliff_rock_frozen', rep: 3.0, tint: 0xffffff, shade: 0.55 },
      frost: { tint: 0xc8d2f0, shade: 0.3 },
      pebble: { tint: 0x6a6470, shade: 0.5 },
      rope: { tint: 0x8a7462, shade: 0.4 },
      flame: { tint: 0xffffff, lit: 0, cut: false, side: 'double' },
      dark: { tint: 0x120c0a, lit: 0, cut: false, side: 'double' },
    },
    // heavy cold fog: only so much is drawn at once; no far hills (the fog is the edge). Its colour the painting's cold
    // violet-blue mist; 1.3 times it is the sky's own colour low down, so the sky below the horizon meets the sky above it.
    night: { fog: [0.18, 0.186, 0.34], fogNear: 10, fogFar: 42, far: 90, hills: false, sky: [0.6, 0.6, 0.76], moon: [0.42, 0.46, 0.62] },
    textures: [
      { id: 'shared_snow', made: "./../texture-packs/made-web/shared_snow.webp", stand: "./../texture-packs/north/frozen-pass/stand-in/shared_snow.png" },
      { id: 'snow_trodden_trail', made: "./../texture-packs/made-web/snow_trodden_trail.webp", stand: "./../texture-packs/wilds-north/frozen-camp/stand-in/snow_trodden_trail.png" },
      { id: 'cliff_rock_frozen', made: "./../texture-packs/made-web/cliff_rock_frozen.webp", stand: "./../texture-packs/wilds-north/frozen-camp/stand-in/cliff_rock_frozen.png" },
      { id: 'frozen_waterfall_ice', made: "./../texture-packs/made-web/frozen_waterfall_ice.webp", stand: "./../texture-packs/wilds-north/frozen-camp/stand-in/frozen_waterfall_ice.png" },
      { id: 'fir_foliage_snowladen', made: "./../texture-packs/made-web/fir_foliage_snowladen.webp", stand: "./../texture-packs/wilds-north/frozen-camp/stand-in/fir_foliage_snowladen.png" },
      { id: 'tent_canvas', made: "./../texture-packs/made-web/tent_canvas.webp", stand: "./../texture-packs/wilds-north/northern-camp/stand-in/tent_canvas.png" },
      { id: 'shared_ice', made: "./../texture-packs/made-web/shared_ice.webp", stand: "./../texture-packs/north/frozen-pass/stand-in/shared_ice.png" },
      { id: 'shared_planks_wall', made: "./../texture-packs/made-web/shared_planks_wall.webp", stand: "./../texture-packs/bogmire-dawnroost/bogmire/stand-in/shared_planks_wall.png" },
      { id: 'shared_boardwalk_planks', made: "./../texture-packs/made-web/shared_boardwalk_planks.webp", stand: "./../texture-packs/wickhollow/jetty/stand-in/shared_boardwalk_planks.png" },
      { id: 'shared_dirt_track', made: "./../texture-packs/made-web/shared_dirt_track.webp", stand: "./../texture-packs/wilds-north/northern-camp/stand-in/shared_dirt_track.png" },
    ],
    ground_h: ground,
    // where Io's feet stand: the ground everywhere (the ledge path is cut into the ground itself)
    walk_h(x, y) { return ground(x, y); },
    water: [],
    lawns: [],
    noRocks: [],
    start: [630, 452], startFace: Math.PI / 2, startYaw: -Math.PI / 2,
    // the way on, where the east trail reaches the open ground's edge
    exits: [
      { rect: [2940, 534, 2962, 616], label: "Frostmere's shore" },
    ],
    // the trails (trodden down the middle, softer along the edges), the ledge path, the space behind the waterfall's ice,
    // and the landing ground left smooth
    walkAdd: TRAILS.map((t) => ({ poly: ribbon(t.pts, t.w + 0.6), ground: 'dirt' })).concat(TRAILS.map((t) => ({ poly: ribbon(t.pts, t.w), ground: 'cob' })))
      .concat([{ poly: LEDGE_POLY, ground: 'cob' }, { poly: BEHIND, ground: 'dirt' }]),
    groundPatches: [
      { poly: [[124, 336], [492, 336], [512, 580], [118, 584]], kind: 'grass' },
      { poly: HEADP, kind: 'pave' }, { poly: [[1270, 40], [1330, 40], [1340, 92], [1262, 92]], kind: 'pave' }, { poly: FALLP, kind: 'pave' }, { poly: TARNP, kind: 'pave' },
    ],
    items: {},
    buildings: [],
    walls: [],
    steps: [],
    lamps: [],
    // the barrels: two by the sled, one by the fire
    props: [{ k: 'barrel', at: [662, 304] }, { k: 'barrel', at: [655, 272] }, { k: 'barrel', at: [860, 386] }],
    flowers: [],
    // the moonlight lying on the open snow (the fire, the lantern and the tent's glow are added in extra)
    lights: [
      [300, 455, 260, 0.35, 'moon'], [1260, 230, 150, 0.45, 'moon'], [900, 900, 180, 0.35, 'moon'], [1300, -20, 200, 0.4, 'moon'], [-900, 360, 240, 0.4, 'moon'],
      [900, 1150, 180, 0.3, 'moon'], [250, 990, 140, 0.4, 'moon'], [2130, 640, 140, 0.3, 'moon'], [1300, 145, 110, 0.6, 'moon'],
    ],
    trees: ID,
    // the painting's own trees by the paths (make-trees keeps its trees 30 px off the walk): the big pine west of the snow
    // lane, the pine the lane winds round, the little fir at its bend, the pines below the landing ground's west end, the
    // pine east of the landing ground, the pine beside the east trail; and spruces by the places to find
    extraTrees: [[96, 230, 1.35, 1, 11], [196, 232, 1.15, 1, 12], [268, 240, 0.6, 1, 13], [80, 745, 1.25, 1, 14], [176, 728, 1.1, 1, 15], [624, 690, 1.25, 1, 16],
      [1320, 636, 0.95, 1, 17], [1000, 300, 1.0, 1, 19], [880, 250, 0.9, 1, 20],
      [2200, 560, 1.2, 1, 31], [2060, 680, 1.1, 1, 32], [1180, -140, 1.3, 1, 33], [1450, 20, 1.2, 1, 34], [-1050, 470, 1.3, 1, 36],
      [1080, 1180, 1.1, 1, 37], [720, 1180, 1.2, 1, 38], [140, 1060, 1.1, 1, 39]],

    // ---- what the engine has no field for: the cliffs' columns, the frozen waterfall, the tents, the fire, the stumps,
    // the sled, the firewood, the lantern post, the stakes and the rope, the boulders, the bushes, the places to find ----
    extra(K) {
      const { B, X, Z, M } = K, W = G.W3D, TAU = Math.PI * 2, T3 = G.THREE;
      const TH = K.terrain;
      const R = W.rand(4711);
      const soft = (fn) => { B.solid = false; fn(); B.solid = true; };
      const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
      const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
      const norm = (a) => { const L = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / L, a[1] / L, a[2] / L]; };
      // a quad that faces the way `want` points, whichever order its corners came in
      const Q = (k, a, b, c, d, want, uv, col) => { const n = cross(sub(b, a), sub(d, a)); if (dot(n, want) < 0) B.quad(k, b, a, d, c, uv, col); else B.quad(k, a, b, c, d, uv, col); };
      const V3 = (a) => new T3.Vector3(a[0], a[1], a[2]);
      const UPV = new T3.Vector3(0, 1, 0), _q = new T3.Quaternion(), _d = new T3.Vector3();
      // a round rod (open tube) from a to b
      const rod = (k, a, b, r, col, seg) => { _d.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]); const L = _d.length(); if (L < 1e-4) return; _d.multiplyScalar(1 / L); _q.setFromUnitVectors(UPV, _d); const g = new T3.CylinderGeometry(r, r, L, seg || 5, 1, true); g.translate(0, L / 2, 0); B.geom(k, g, new T3.Matrix4().compose(V3(a), _q, new T3.Vector3(1, 1, 1)), col, [0.5, L]); g.dispose(); };
      const SNOW = [1.0, 1.0, 1.04], ICE = [1.0, 1.04, 1.1];
      // a lump of snow (never in her way)
      const lump = (x, y, z, sx, sy, sz, rot) => soft(() => B.geom('snow', K.ico[Math.floor(R() * 3)], new T3.Matrix4().compose(new T3.Vector3(x, y, z), new T3.Quaternion().setFromEuler(new T3.Euler(0, rot == null ? R() * TAU : rot, 0)), new T3.Vector3(sx, sy, sz)), SNOW, 1.2));
      // an icicle hanging from (x, y, z), `len` long
      const hexG = new T3.CylinderGeometry(0.9, 1, 1, 6, 1, false);
      const coneG = new T3.ConeGeometry(1, 1, 5, 1, true); coneG.rotateX(Math.PI);   // point down
      const icicle = (x, y, z, len, r) => soft(() => B.geom('ice', coneG, new T3.Matrix4().compose(new T3.Vector3(x, y - len / 2, z), new T3.Quaternion(), new T3.Vector3(r, len, r)), ICE, [0.3, len]));

      // ---- a column of the cliffs: a rough six-sided pillar of dark rock from `bot` to `top`, a snow cap, icicles hanging
      // off the cap on the side `face` points (radians: the way it looks out, 0 south) ----
      function column(px, py, r, bot, top, face, opt) {
        opt = opt || {};
        const x = X(px), z = Z(py), rot = R() * TAU;
        // its foot goes down below the lowest ground round it, so it never stands on air
        for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; bot = Math.min(bot, TH(px + Math.cos(a) * r / SX, py + Math.sin(a) * r / SZ) - 0.6); }
        const h = top - bot, k = 1.25 + R() * 0.3;
        B.geom('cliff', hexG, new T3.Matrix4().compose(new T3.Vector3(x, bot + h / 2, z), new T3.Quaternion().setFromEuler(new T3.Euler((R() - 0.5) * 0.05, rot, (R() - 0.5) * 0.05)), new T3.Vector3(r, h, r)), [k, k * 0.98, k * 1.04], [TAU * r, h]);
        // the snow mounded on its top
        lump(x, top - 0.1, z, r * 0.94, 0.3 + R() * 0.22, r * 0.94, rot);
        // icicles off the cap, on its open side
        const n = opt.icicles == null ? 2 + Math.floor(R() * 4) : opt.icicles;
        for (let i = 0; i < n; i++) {
          const a = face + (R() - 0.5) * 1.6, rr = r * (0.92 + R() * 0.12);
          icicle(x + Math.sin(a) * rr, top - 0.02, z + Math.cos(a) * rr, 0.3 + R() * (opt.long ? 1.6 : 0.9), 0.05 + R() * 0.05);
        }
      }
      // a snow-capped boulder: dark rock under a thick snow cap
      function boulder(px, py, s, solid) {
        const x = X(px), z = Z(py), y = TH(px, py), rot = R() * TAU;
        if (!solid) B.solid = false;
        B.geom('rock', K.rockG[Math.floor(R() * 3)], new T3.Matrix4().compose(new T3.Vector3(x, y - s * 0.25, z), new T3.Quaternion().setFromEuler(new T3.Euler(0, rot, 0)), new T3.Vector3(s, s * 0.95, s)), [1.35, 1.32, 1.4], 1.2);
        B.solid = true;
        lump(x, y + s * 0.4, z, s * 0.8, s * 0.42, s * 0.78, rot);
        if (solid) K.addBlock(K.circlePx(px, py, s * 0.78, 10));
        K.shadeMarks.push(['dot', px, py, s / SX * 1.1, 0.72]);
      }
      // a low dark bush with clusters of red berries, snow on its top
      function berry(px, py, rr, solid) {
        const x = X(px), z = Z(py), y = TH(px, py), h = rr * (0.55 + R() * 0.2);
        B.solid = !!solid;
        B.geom('leafBush', K.ico[Math.floor(R() * 3)], new T3.Matrix4().compose(new T3.Vector3(x, y + h * 0.3, z), new T3.Quaternion().setFromEuler(new T3.Euler(0, R() * TAU, 0)), new T3.Vector3(rr, h, rr)), [0.55, 0.58, 0.7], 1.6);
        B.solid = true;
        const n = Math.max(3, Math.round(rr * 4));
        soft(() => {
          for (let i = 0; i < n; i++) {
            const a = R() * TAU, d = R() * rr * 0.7, cx = x + Math.cos(a) * d, cz = z + Math.sin(a) * d, cy = y + h * (0.55 + R() * 0.5), s2 = 0.22 + R() * 0.12, t = R() * Math.PI;
            B.quad('fl_fruit', [cx - Math.cos(t) * s2, cy - s2 * 0.6, cz - Math.sin(t) * s2], [cx + Math.cos(t) * s2, cy - s2 * 0.6, cz + Math.sin(t) * s2], [cx + Math.cos(t) * s2, cy + s2, cz + Math.sin(t) * s2], [cx - Math.cos(t) * s2, cy + s2, cz - Math.sin(t) * s2], [0, 0, 1, 1], [1.4, 0.35, 0.4]);
          }
        });
        lump(x, y + h * 0.95, z, rr * 0.7, h * 0.25, rr * 0.65);
        if (solid) K.addBlock(K.circlePx(px, py, rr * 0.7, 8));
      }
      // a bare bush of frost-white branches
      function bare(px, py, s) {
        const x = X(px), z = Z(py), y = TH(px, py), col = [1.2, 1.22, 1.3];
        for (let i = 0; i < 7; i++) {
          const a = R() * TAU, up = 0.6 + R() * 0.5, L = (0.9 + R() * 0.9) * s * 2;
          const tip = [x + Math.cos(a) * L * 0.55, y + L * up, z + Math.sin(a) * L * 0.55];
          soft(() => rod('frost', [x + (R() - 0.5) * 0.15, y - 0.1, z + (R() - 0.5) * 0.15], tip, 0.035 * s * 2, col, 4));
          for (let k = 0; k < 3; k++) { const b2 = a + (R() - 0.5) * 1.6; soft(() => rod('frost', tip, [tip[0] + Math.cos(b2) * 0.45 * s * 2, tip[1] + (0.2 + R() * 0.4) * s * 2, tip[2] + Math.sin(b2) * 0.45 * s * 2], 0.015 * s * 2, col, 3)); }
        }
        K.addBlock(K.circlePx(px, py, 0.35 * s * 2, 8));
      }

      // ---- the north cliff: two rows of columns along its foot (the front row from the shelf up to the high country, the
      // back row a little higher), none where the frozen waterfall hangs ----
      for (let px = 330; px <= 1720; px += 30 + R() * 22) {
        if (kN(px) < 0.5) continue;
        const fy = footN(px), r = 0.8 + R() * 0.7;
        if (px + r / SX > FALL.x0 - 4 && px - r / SX < FALL.x1 + 6) continue;
        const top = TH(px, fy - 50) + (R() - 0.35) * 1.6;
        column(px, fy - r / SZ * 0.55, r, TH(px, fy) - 0.6, top, 0, { long: true });
        if (R() < 0.75) { const r2 = 0.9 + R() * 0.7, px2 = px + (R() - 0.5) * 30; if (!(px2 + r2 / SX > FALL.x0 - 4 && px2 - r2 / SX < FALL.x1 + 6)) column(px2, fy - 22 - r2 / SZ * 0.5, r2, TH(px2, fy) - 0.4, top + 0.6 + R() * 1.4, 0, { long: true }); }
      }
      // ---- the south rim: columns standing up from the low country to just over the rim, their snow caps at the shelf's
      // edge; a second, lower row out in front. A gap where the ledge path goes down. ----
      {
        const onLedge = (px, py) => inPoly(LEDGE_POLY, px, py) || ledgeAt(px, py).d < LEDGE_W + 0.9;
        for (let i = 1; i < RIM_LINE.length; i++) {
          const [ax, ay] = RIM_LINE[i - 1], [bx, by] = RIM_LINE[i], L = Math.hypot((bx - ax) * SX, (by - ay) * SZ);
          // the outward side of this stretch (into the low country)
          let nx = (by - ay) * SZ / L, nz = -(bx - ax) * SX / L;
          if (!inPoly(RIM, (ax + bx) / 2 + nx * 1.5 / SX, (ay + by) / 2 + nz * 1.5 / SZ)) { nx = -nx; nz = -nz; }
          const face = Math.atan2(nx, nz);
          for (let s = R() * 1.2; s < L; s += 1.5 + R() * 0.9) {
            const f = s / L, cx = ax + (bx - ax) * f, cy = ay + (by - ay) * f;
            if (kS(cx) < 0.5) continue;
            const r = 0.75 + R() * 0.65, px = cx + nx * r * 0.6 / SX, py = cy + nz * r * 0.6 / SZ;
            if (onLedge(px, py) || onLedge(cx, cy)) continue;
            const rimH = TH(cx - nx * 1.2 / SX, cy - nz * 1.2 / SZ);
            column(px, py, r, LOW - 1.2, rimH + (R() - 0.3) * 1.1, face, { long: true });
            if (R() < 0.6) { const r2 = 0.8 + R() * 0.6, q = 1.8 + R() * 1.4, px2 = cx + nx * q / SX + (R() - 0.5) * 20, py2 = cy + nz * q / SZ; if (!onLedge(px2, py2)) column(px2, py2, r2, LOW - 1.2, rimH - 1.2 - R() * 2.4, face, { long: true }); }
          }
        }
        // the ledge path's outer edge: low columns along it, below its lip, so it reads as a shelf cut in the face
        for (let i = 1; i < LEDGE.length; i++) {
          const a = LEDGE[i - 1], b = LEDGE[i], L = Math.hypot((b[0] - a[0]) * SX, (b[1] - a[1]) * SZ);
          let nx = -(b[1] - a[1]) * SZ / L, nz = (b[0] - a[0]) * SX / L; if (nz < 0) { nx = -nx; nz = -nz; }   // outward: south
          for (let s = 0.6; s < L; s += 1.6 + R() * 0.6) {
            const f = s / L, cx = a[0] + (b[0] - a[0]) * f, cy = a[1] + (b[1] - a[1]) * f, lh = a[2] + (b[2] - a[2]) * f, r = 0.6 + R() * 0.35;
            column(cx + nx * (LEDGE_W + r + 0.15) / SX, cy + nz * (LEDGE_W + r + 0.15) / SZ, r, LOW - 1.2, lh - 0.25 - R() * 0.5, Math.atan2(nx, nz), { icicles: 2 });
            // and on its inner side the face it is cut into, from the path up to the shelf's edge
            if (lh < -1.9) { const ri = 0.55 + R() * 0.3, ix = cx - nx * (LEDGE_W + ri * 0.8) / SX, iy = cy - nz * (LEDGE_W + ri * 0.8) / SZ; column(ix, iy, ri, lh - 0.6, TH(ix - nx * 1.0 / SX, iy - nz * 1.4 / SZ) + R() * 0.5, Math.atan2(nx, nz), { icicles: 1 }); }
          }
        }
      }

      // ---- the frozen waterfall: blue-white ice down the cliff's face from the high country, great pillars of it standing
      // out in front (the pocket behind them), a heap of broken ice at their feet ----
      {
        const top = TH(1300, FALL.foot - 60), zf = Z(FALL.foot) - 0.15;
        // the rock of the cliff's face behind the ice
        for (let px = FALL.x0 - 8; px < FALL.x1 + 8; px += 20) { const xa = X(px), xb = X(px + 21), b = TH(px, FALL.foot) - 0.3; Q('cliff', [xa, b, zf - 0.05], [xb, b, zf - 0.05], [xb, top - 0.1, zf - 0.35], [xa, top - 0.1, zf - 0.35], [0, 0, 1], [xa, b, xb, top], [1.1, 1.08, 1.15]); }
        // the curtain: strands of ice hanging down the face, thick where they leave the lip, some reaching the ground
        {
          const sg = new T3.CylinderGeometry(1, 0.35, 1, 6, 1, false);
          for (let px = FALL.x0 + 4; px < FALL.x1 - 4; px += 13 + R() * 14) {
            const r = 0.12 + R() * 0.22, reach = R() < 0.6 ? 1 : 0.4 + R() * 0.4, b = TH(px, FALL.foot) - 0.2, t = top - 0.15, len = (t - b) * reach;
            B.solid = false;
            B.geom('icefall', sg, new T3.Matrix4().compose(new T3.Vector3(X(px), t - len / 2, zf + 0.1 + r * 0.6), new T3.Quaternion().setFromEuler(new T3.Euler(0, R() * TAU, 0)), new T3.Vector3(r, len, r * 0.8)), [0.9 + R() * 0.25, 0.95 + R() * 0.2, 1.05], [TAU * r, len]);
            B.solid = true;
          }
          sg.dispose();
        }
        // the lip at the top: the ice flowing over the cliff's edge onto the face
        soft(() => { for (let px = FALL.x0 - 4; px < FALL.x1 + 4; px += 16) { const xa = X(px), xb = X(px + 17), ze = Z(FALL.foot - 32); Q('icefall', [xa, TH(px, FALL.foot - 32) + 0.05, ze], [xb, TH(px + 17, FALL.foot - 32) + 0.05, ze], [xb, top - 0.12, zf - 0.3], [xa, top - 0.12, zf - 0.3], [0, 1, 0.3], [xa, ze, xb, zf], [1.0, 1.04, 1.1]); } });
        // the pillars: tall columns of ice, thick at the top where they hang from the lip, flaring at their feet
        for (const [px, py, r] of PILLARS) {
          const x = X(px), z = Z(py), b = TH(px, py) - 0.2, h = top - 0.3 - b;
          const g = new T3.CylinderGeometry(r * 1.15, r * 0.95, h, 8, 3, false), p = g.attributes.position;
          for (let i = 0; i < p.count; i++) { const yy = p.getY(i) / h + 0.5, wob = 1 + 0.18 * Math.sin(yy * 9 + px) + (yy < 0.12 ? 0.35 * (1 - yy / 0.12) : 0); p.setXYZ(i, p.getX(i) * wob, p.getY(i), p.getZ(i) * wob); }
          g.computeVertexNormals();
          B.geom('icefall', g, new T3.Matrix4().makeTranslation(x, b + h / 2, z), [1.05, 1.08, 1.12], [TAU * r, h]); g.dispose();
          // icicles hanging round each pillar's top, and a few short ones off the lip between them
          for (let i = 0; i < 3; i++) { const a = R() * TAU; icicle(x + Math.cos(a) * r * 1.2, top - 0.4, z + Math.sin(a) * r * 1.2, 0.8 + R() * 1.8, 0.1 + R() * 0.08); }
          K.addBlock(K.circlePx(px, py, r * 1.05, 10));
        }
        // a wall of ice from the last pillar east to the rock, so the space behind is reached only from the west end
        {
          const x0 = X(1390), x1 = X(FALL.x1 + 4), z0 = Z(150), z1 = Z(165), b = TH(1400, 160) - 0.2;
          B.box('icefall', (x0 + x1) / 2, b, (z0 + z1) / 2, x1 - x0, top - 0.4 - b, z1 - z0, 0, [1.0, 1.04, 1.1]);
        }
        // the heap of broken ice at their feet (low: she walks round it)
        for (let px = 1226; px < 1384; px += 12 + R() * 10) { const py = 178 + R() * 4, s = 0.35 + R() * 0.35; soft(() => B.geom('ice', K.rockG[Math.floor(R() * 3)], new T3.Matrix4().compose(new T3.Vector3(X(px), TH(px, py) - s * 0.3, Z(py)), new T3.Quaternion().setFromEuler(new T3.Euler(R(), R() * TAU, 0)), new T3.Vector3(s, s * 0.7, s)), ICE, 1)); }
        // the cold light of the ice, and its glow behind the pillars (the pocket)
        K.halo(X(1300), 2.2, Z(150), 6.5, [0.14, 0.2, 0.34]); K.halo(X(1240), 1.4, Z(134), 2.4, [0.2, 0.3, 0.55]); K.halo(X(1350), 1.6, Z(134), 2.6, [0.2, 0.3, 0.55]);
        K.light(1300, 140, 120, 0.8, 'moon');
        // in the pocket: a few great icicles hanging from the rock, and an old iron lantern someone left in a niche, cold
        for (let i = 0; i < 7; i++) icicle(X(1214 + i * 28), top - 1.5, Z(126), 1.6 + R() * 2.2, 0.12);
        soft(() => { const x = X(1392), z = Z(133), y = TH(1392, 133); B.box('cliff', x, y, z, 0.7, 0.5, 0.5, 0.2, [0.9, 0.9, 1.0]); B.box('iron', x, y + 0.5, z, 0.22, 0.04, 0.22, 0); B.box('glass', x, y + 0.54, z, 0.16, 0.24, 0.16, 0, [0.5, 0.65, 1.0]); B.box('iron', x, y + 0.78, z, 0.24, 0.04, 0.24, 0); });
        K.halo(X(1392), 0.9, Z(133) + 0.2, 0.8, [0.25, 0.35, 0.6]);
        K.addBlock(K.circlePx(1392, 133, 0.4, 8));
      }

      // ---- the camp ----
      // a ridge tent: walls of canvas to the eaves, a roof under thick snow with icicles at the edge, a gable at the back
      // and an open door at the front (its flaps tied back), crossed poles at the ridge's ends, the warm glow inside
      function tent(o) {
        const cx = X(o.c[0]), cz = Z(o.c[1]), y0 = TH(o.c[0], o.c[1]), c = Math.cos(o.ry), s = Math.sin(o.ry);
        const L = (lx, ly, lz) => [cx + lx * c + lz * s, y0 + ly, cz - lx * s + lz * c];
        const w = o.w / 2, d = o.d / 2, e = o.eave, h = o.h;
        const fwd = [s, 0, c], back = [-s, 0, -c], right = [c, 0, -s];
        const CAN = [1.6, 1.48, 1.3];
        soft(() => {
          // the side walls, the roof's two slopes (canvas, seen under the snow's edge)
          for (const sd of [-1, 1]) {
            Q('cloth', L(sd * w, -0.1, -d), L(sd * w, -0.1, d), L(sd * w, e, d), L(sd * w, e, -d), mul(right, sd), [0, 0, o.d, e + 0.1], CAN);
            Q('cloth', L(sd * w, e, -d), L(sd * w, e, d), L(0, h, d), L(0, h, -d), [sd * c * h, w, -sd * s * h], [0, 0, o.d, Math.hypot(w, h - e)], CAN);
            // the snow lying on it: a slab over the slope, overhanging the eave, its edge rounded
            const ov = 0.22, t = 0.16;
            Q('snow', L(sd * (w + ov), e - 0.12, -d - 0.12), L(sd * (w + ov), e - 0.12, d + 0.12), L(0, h + t, d + 0.12), L(0, h + t, -d - 0.12), [sd * c * h, w, -sd * s * h], [0, 0, o.d, w + 0.3], SNOW);
            Q('snow', L(sd * (w + ov), e - 0.12, -d - 0.12), L(sd * (w + ov), e - 0.12, d + 0.12), L(sd * (w + ov - 0.05), e - 0.12 - t, d + 0.12), L(sd * (w + ov - 0.05), e - 0.12 - t, -d - 0.12), mul(right, sd), [0, 0, o.d, t], SNOW);
            // icicles along the eave
            for (let z = -d; z <= d; z += 0.22 + R() * 0.25) { const p = L(sd * (w + ov - 0.04), e - 0.12 - t, z); icicle(p[0], p[1], p[2], 0.12 + R() * 0.4, 0.03 + R() * 0.02); }
          }
          // the snow along the ridge, and lumps where the snow has slid
          for (let z = -d; z <= d; z += 0.6) { const p = L(0, h + 0.1, z); lump(p[0], p[1], p[2], 0.42, 0.2, 0.42); }
          // the back gable, closed
          Q('cloth', L(-w, -0.1, -d), L(w, -0.1, -d), L(w, e, -d), L(-w, e, -d), back, [0, 0, o.w, e], CAN);
          B.tri('cloth', L(-w, e, -d), L(w, e, -d), L(0, h, -d), [[0, 0], [o.w, 0], [w, h - e]], CAN);
          // the front: the canvas either side of the door, the dark inside, the warm glow, the flaps tied back
          const dw = o.door * w;
          Q('cloth', L(-w, -0.1, d), L(-dw, -0.1, d), L(-dw * 0.3, h * 0.82, d), L(-w, e, d), fwd, [0, 0, w - dw, h], CAN);
          Q('cloth', L(dw, -0.1, d), L(w, -0.1, d), L(w, e, d), L(dw * 0.3, h * 0.82, d), fwd, [0, 0, w - dw, h], CAN);
          B.tri('cloth', L(-w, e, d), L(-dw * 0.3, h * 0.82, d), L(0, h, d), [[0, 0], [1, 0], [0.5, 0.5]], CAN);
          B.tri('cloth', L(dw * 0.3, h * 0.82, d), L(w, e, d), L(0, h, d), [[0, 0], [1, 0], [0.5, 0.5]], CAN);
          B.tri('cloth', L(-dw * 0.3, h * 0.82, d), L(dw * 0.3, h * 0.82, d), L(0, h, d), [[0, 0], [1, 0], [0.5, 0.5]], CAN);
          // inside, seen through the door: warm lamplight in the big tent, dark in the small one
          Q('glass', L(-dw, 0, d - 0.12), L(dw, 0, d - 0.12), L(dw * 0.3, h * 0.82, d - 0.12), L(-dw * 0.3, h * 0.82, d - 0.12), fwd, [0, 0, 1, 1], o.glow ? [0.62, 0.36, 0.17] : [0.1, 0.07, 0.07]);
          Q('glass', L(-dw * 0.55, 0.03, d - 0.1), L(dw * 0.55, 0.03, d - 0.1), L(dw * 0.25, h * 0.45, d - 0.1), L(-dw * 0.25, h * 0.45, d - 0.1), fwd, [0, 0, 1, 1], o.glow ? [0.9, 0.58, 0.28] : [0.12, 0.09, 0.08]);
          for (const sd of [-1, 1]) {
            // a flap: a triangle of canvas folded back against the front, tied
            Q('cloth', L(sd * dw, 0, d + 0.02), L(sd * (dw + 0.55), 0.15, d + 0.08), L(sd * (dw + 0.3), h * 0.55, d + 0.06), L(sd * dw * 0.4, h * 0.78, d + 0.02), fwd, [0, 0, 1, 1.5], [0.9, 0.84, 0.78]);
          }
        });
        // the poles: crossed at each end of the ridge, a little proud of it
        for (const zz of [-d - 0.06, d + 0.06]) for (const sd of [-1, 1]) { const a = L(sd * 0.32, -0.05, zz), b = L(-sd * 0.2, h + 0.5, zz); soft(() => rod('wood', a, b, 0.045, [0.7, 0.55, 0.42], 5)); }
        // the guy ropes and their pegs
        for (const [lx, lz] of [[-w - 0.6, -d + 0.4], [w + 0.6, -d + 0.4], [-w - 0.6, d - 0.6], [w + 0.6, d - 0.6]]) { const a = L(lx, 0.05, lz), b = L(Math.sign(lx) * (w + 0.1), e + 0.05, lz); soft(() => { rod('rope', a, b, 0.012, null, 3); B.box('wood', a[0], a[1] - 0.15, a[2], 0.06, 0.25, 0.06, 0, [0.6, 0.5, 0.4]); }); }
        // solid: the whole tent
        const fp = [[-w - 0.15, -d - 0.1], [w + 0.15, -d - 0.1], [w + 0.15, d + 0.05], [-w - 0.15, d + 0.05]].map(([lx, lz]) => { const p = L(lx, 0, lz); return [M.px(p[0]), M.py(p[2])]; });
        K.addBlock(fp); K.shadeMarks.push(['poly', fp, 0.7]);
        if (o.glow) { const g = L(0, 0.9, d + 0.3); K.halo(g[0], g[1], g[2], 2.4, [0.8, 0.5, 0.24]); const lp = L(0, 0, d + 1.0); K.light(M.px(lp[0]), M.py(lp[2]), 70, 0.45, 'warm'); K.lamps3d.push({ x: g[0], y: g[1], z: g[2], c: 0xffa860, k: 0.7 }); }
      }
      tent(Object.assign({ eave: 0.95, door: 0.42, glow: true }, BIGTENT));
      tent(Object.assign({ eave: 0.55, door: 0.5, glow: false }, SMALLTENT));

      // the fire ring: rounded stones round a bed of bare earth, logs burning in the middle, the snow melted round it
      {
        const [fx, fy] = FIRE.c, x = X(fx), z = Z(fy), y = TH(fx, fy);
        // the melted ring of earth round it, and the earth inside
        soft(() => {
          const N = 28;
          for (let i = 0; i < N; i++) {
            const a0 = i / N * TAU, a1 = (i + 1) / N * TAU, R0 = 0.0, R1 = 2.6;
            const P_ = (a, rr, k) => [x + Math.cos(a) * rr * (FIRE.rx / 1.7), y + 0.025 + k, z + Math.sin(a) * rr * (FIRE.rz / 1.7)];
            B.quad('soil', P_(a0, R0, 0), P_(a0, R1, -0.02), P_(a1, R1, -0.02), P_(a1, R0, 0), [0, 0, 1, 1], [1.0, 0.92, 0.85]);
            void a1;
          }
        });
        // the stones
        for (let i = 0; i < 18; i++) {
          const a = i / 18 * TAU, sx = x + Math.cos(a) * FIRE.rx * 0.82, sz = z + Math.sin(a) * FIRE.rz * 0.82, s = 0.3 + R() * 0.08;
          B.geom('pebble', K.rockG[i % 3], new T3.Matrix4().compose(new T3.Vector3(sx, y - 0.05, sz), new T3.Quaternion().setFromEuler(new T3.Euler(0, a, 0)), new T3.Vector3(s * 1.1, s * 0.75, s)), [1.0, 1.0, 1.0], 0.6);
          if (i % 3 === 0) lump(sx, y + s * 0.55, sz, s * 0.5, 0.06, s * 0.45);
        }
        // the logs, crossed, and the flames: crossed glowing blades, brighter at the core
        for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + 0.3; soft(() => rod('wood', [x + Math.cos(a) * 0.62, y + 0.05, z + Math.sin(a) * 0.55], [x - Math.cos(a) * 0.05, y + 0.42, z - Math.sin(a) * 0.05], 0.085, [0.62, 0.45, 0.34], 6)); }
        // the flames: tongues of fire, pale gold at the root, orange, then red at their tips
        const flameCol = (base, h) => (v) => { const t = clamp((v.y - base) / h, 0, 1); return [1.5 - 0.3 * t, 1.12 - 0.82 * t, 0.55 - 0.5 * t]; };
        soft(() => {
          const fl = new T3.ConeGeometry(1, 1, 7, 3, true);
          for (let i = 0; i < 9; i++) {
            const a = i / 9 * TAU + R(), d = i === 0 ? 0 : 0.12 + R() * 0.22, hh = i === 0 ? 1.05 : 0.45 + R() * 0.45, rr = i === 0 ? 0.24 : 0.09 + R() * 0.08;
            const fx_ = x + Math.cos(a) * d, fz_ = z + Math.sin(a) * d, base = y + 0.12;
            B.geom('flame', fl, new T3.Matrix4().compose(new T3.Vector3(fx_, base + hh / 2, fz_), new T3.Quaternion().setFromEuler(new T3.Euler((R() - 0.5) * 0.25, R() * TAU, (R() - 0.5) * 0.25)), new T3.Vector3(rr, hh, rr)), flameCol(base, hh), 1);
          }
          fl.dispose();
          // the embers under them
          B.geom('flame', K.rockG[0], new T3.Matrix4().compose(new T3.Vector3(x, y + 0.02, z), new T3.Quaternion(), new T3.Vector3(0.55, 0.12, 0.5)), [0.95, 0.3, 0.08], 1);
        });
        K.halo(x, y + 0.7, z, 3.0, [1.0, 0.55, 0.22]); K.halo(x, y + 0.45, z, 1.3, [1.0, 0.75, 0.4]);
        K.light(fx, fy + 6, 170, 0.62, 'warm'); K.light(fx, fy, 80, 0.4, 'forge');
        K.lamps3d.push({ x, y: y + 0.8, z, c: 0xff8a40, k: 2.0 });
        K.shadeMarks.push(['dot', fx, fy, 10, 0.8]);
      }
      // the stumps round the fire, snow on their tops
      for (const [px, py, r] of STUMPS) {
        const x = X(px), z = Z(py), y = TH(px, py), h = 0.42 + R() * 0.12;
        B.cyl('wood', x, y - 0.1, z, r, r * 0.92, h + 0.1, 9, [0.62, 0.46, 0.36], [1.6, 0.6]);
        soft(() => { B.cyl('wood', x, y + h, z, r * 0.9, r * 0.9, 0.012, 9, [1.2, 1.0, 0.8]); lump(x, y + h + 0.01, z, r * 0.8, 0.07, r * 0.75); });
        K.shadeMarks.push(['dot', px, py, 12, 0.75]);
      }
      // snow on the barrels' lids
      for (const pr of P[ID].props) if (pr.k === 'barrel') { const x = X(pr.at[0]), z = Z(pr.at[1]), y = TH(pr.at[0], pr.at[1]); lump(x, y + 0.9, z, 0.32, 0.09, 0.32); }
      // the loaded sled: wooden runners curling up at the front, a slatted bed, crates and bundles roped on, snow on top
      {
        const { len, w } = SLED, cx = X(SLED.c[0]), cz = Z(SLED.c[1]), y0 = TH(SLED.c[0], SLED.c[1]), c = Math.cos(SLED.ry), s = Math.sin(SLED.ry);
        const L = (lx, ly, lz) => [cx + lx * c + lz * s, y0 + ly, cz - lx * s + lz * c];
        const WOOD = [0.8, 0.6, 0.45];
        // the runners, each a bar along the ground and a curl at the front (east) end
        for (const sd of [-1, 1]) {
          const lz = sd * (w / 2 - 0.08), pts = [];
          for (let i = 0; i <= 10; i++) pts.push(L(-len / 2 + (len - 0.6) * i / 10, 0.08, lz));
          for (let i = 1; i <= 6; i++) { const a = i / 6 * Math.PI * 1.1; pts.push(L(len / 2 - 0.6 + Math.sin(a) * 0.42, 0.5 - Math.cos(a) * 0.42, lz)); }
          for (let i = 1; i < pts.length; i++) soft(() => rod('wood', pts[i - 1], pts[i], 0.055, WOOD, 5));
          // the uprights from the runner to the bed
          for (let i = 0; i < 5; i++) { const lx = -len / 2 + 0.3 + i * (len - 1.2) / 4; soft(() => rod('wood', L(lx, 0.08, lz), L(lx, 0.42, lz), 0.04, WOOD, 4)); }
        }
        // the bed of slats
        for (let i = 0; i < 9; i++) { const lx = -len / 2 + 0.25 + i * (len - 1.0) / 8; const p = L(lx, 0.42, 0); B.box('wood', p[0], p[1], p[2], 0.2, 0.06, w, SLED.ry + Math.PI / 2, WOOD); }
        // the load: three crates and a long bundle under a tarp, roped on, snow on top
        const crate = (lx, lz, bw, bh, bd, rot) => { const p = L(lx, 0.48, lz); B.box('planks', p[0], p[1], p[2], bw, bh, bd, SLED.ry + rot, [0.85, 0.7, 0.55]); lump(p[0], p[1] + bh, p[2], bw * 0.52, 0.1, bd * 0.5, SLED.ry + rot); return p; };
        crate(-1.7, -0.05, 1.0, 0.8, 1.2, 0.05); crate(-0.65, 0.1, 0.9, 0.95, 1.1, -0.04); crate(0.35, -0.2, 0.85, 0.6, 0.85, 0.1);
        { const p = L(1.05, 0.48, 0.25); B.box('cloth', p[0], p[1], p[2], 1.2, 0.45, 0.6, SLED.ry, [0.62, 0.58, 0.55]); lump(p[0], p[1] + 0.45, p[2], 0.6, 0.08, 0.3, SLED.ry); }
        for (const lx of [-1.9, -1.4, -0.4, 0.5]) soft(() => { rod('rope', L(lx, 0.45, -w / 2), L(lx, 1.3, 0), 0.02, null, 3); rod('rope', L(lx, 1.3, 0), L(lx, 0.45, w / 2), 0.02, null, 3); });
        // a lantern-pole at its back end, as on the painting's
        K.addBlock([[-len / 2 - 0.05, -w / 2 - 0.05], [len / 2 + 0.1, -w / 2 - 0.05], [len / 2 + 0.1, w / 2 + 0.05], [-len / 2 - 0.05, w / 2 + 0.05]].map(([lx, lz]) => { const p = L(lx, 0, lz); return [M.px(p[0]), M.py(p[2])]; }));
        K.shadeMarks.push(['dot', SLED.c[0], SLED.c[1], 60, 0.72]);
      }
      // the firewood: a stack of split logs with snow on it, and loose logs in front
      {
        const x0 = X(884), x1 = X(954), z = Z(472), y = TH(910, 470), LOGW = [0.95, 0.72, 0.55];
        for (let row = 0; row < 5; row++) {
          const n = 7 - row;
          for (let i = 0; i < n; i++) {
            const lx = x0 + 0.25 + (i + row * 0.5) * ((x1 - x0 - 0.5) / 6), ly = y + 0.14 + row * 0.24;
            const g = new T3.CylinderGeometry(0.13, 0.13, 1.6, 7); g.rotateX(Math.PI / 2);
            B.geom('wood', g, new T3.Matrix4().makeTranslation(lx, ly, z + (R() - 0.5) * 0.08), LOGW, [0.8, 1.6]); g.dispose();
            soft(() => { const cap = new T3.CircleGeometry(0.12, 7); B.geom('wood', cap, new T3.Matrix4().makeTranslation(lx, ly, z + 0.81), [1.35, 1.1, 0.85], 0.25); cap.dispose(); });
          }
        }
        lump((x0 + x1) / 2, y + 1.3, z, 1.5, 0.22, 0.85, 0);
        // two posts holding the stack's ends
        for (const xx of [x0 + 0.05, x1 - 0.05]) B.box('wood', xx, y - 0.2, z, 0.1, 1.55, 0.1, 0, [0.6, 0.48, 0.4]);
        // loose logs in front
        for (const [px, py, a] of [[888, 506, 0.4], [906, 514, -0.25], [896, 518, 0.7], [920, 506, 0.1]]) { const g = new T3.CylinderGeometry(0.12, 0.12, 1.05, 7); g.rotateZ(Math.PI / 2); B.geom('wood', g, new T3.Matrix4().compose(new T3.Vector3(X(px), TH(px, py) + 0.12, Z(py)), new T3.Quaternion().setFromEuler(new T3.Euler(0, a, 0)), new T3.Vector3(1, 1, 1)), LOGW, [0.8, 1.3]); g.dispose(); }
        lump(X(898), TH(898, 512) + 0.26, Z(512), 0.55, 0.08, 0.3);
        K.shadeMarks.push(['dot', 910, 480, 50, 0.72]);
      }
      // the lantern on its post: a wooden post, an arm out west, the lantern hanging from it
      {
        const px = 924, py = 362, x = X(px), z = Z(py), y = TH(px, py), hh = 2.7;
        B.box('wood', x, y - 0.3, z, 0.22, hh + 0.3, 0.22, 0, [0.62, 0.5, 0.44]);
        B.box('wood', x - 0.38, y + hh - 0.1, z, 0.9, 0.11, 0.11, 0, [0.62, 0.5, 0.44]);
        soft(() => { rod('wood', [x - 0.05, y + hh - 0.7, z], [x - 0.55, y + hh - 0.1, z], 0.04, [0.6, 0.48, 0.42], 4); lump(x, y + hh, z, 0.16, 0.06, 0.16); lump(x - 0.4, y + hh + 0.01, z, 0.45, 0.05, 0.08, 0); });
        K.lantern(x - 0.72, y + hh - 0.62, z, null, 0.95, true);
        K.light(px - 18, py + 8, 110, 0.6, 'warm');
      }

      // ---- the landing ground's stakes: thick posts with snow caps and rope bindings, and the low rope between them ----
      {
        const top = (px, py) => TH(px, py) + 1.55;
        for (const [px, py] of STAKES) {
          const x = X(px), z = Z(py), y = TH(px, py);
          B.cyl('wood', x, y - 0.3, z, 0.3, 0.27, 1.85, 9, [0.66, 0.52, 0.42], [1.8, 1.8]);
          lump(x, y + 1.55, z, 0.34, 0.2, 0.34);
          for (const yy of [0.32, 0.5, 1.1]) soft(() => B.cyl('rope', x, y + yy, z, 0.315, 0.315, 0.07, 9, null, null, true));
          K.shadeMarks.push(['dot', px, py, 14, 0.7]);
        }
        void top;
        // the rope: sagging between the stakes, low enough to step over (never in her way)
        const order = [0, 1, 3, 2, 0];
        for (let k = 1; k < order.length; k++) {
          const [ax, ay] = STAKES[order[k - 1]], [bx, by] = STAKES[order[k]];
          const pts = [];
          for (let i = 0; i <= 16; i++) { const f = i / 16, px = ax + (bx - ax) * f, py = ay + (by - ay) * f; pts.push([X(px), TH(px, py) + 0.48 - 0.24 * Math.sin(Math.PI * f), Z(py)]); }
          for (let i = 1; i < pts.length; i++) soft(() => rod('rope', pts[i - 1], pts[i], 0.022, null, 4));
        }
      }

      // ---- the boulders, the bushes ----
      for (const [px, py, s] of BOULDERS) boulder(px, py, s, true);
      for (const [px, py, s] of BARE) bare(px, py, s);
      for (const [px, py, rr] of BERRY) berry(px, py, rr, rr > 0.75 && walkDist(px, py) > rr / SX + 4);
      // more snowy boulders along the trails past the painting, every so often, and scattered in the woods
      {
        const r = W.rand(90);
        for (const t of TRAILS) {
          for (let i = 1; i < t.pts.length; i++) {
            const [ax, ay] = t.pts[i - 1], [bx, by] = t.pts[i], L = Math.hypot((bx - ax) * SX, (by - ay) * SZ);
            for (let s = 6 + r() * 8; s < L; s += 14 + r() * 16) {
              const f = s / L, cx = ax + (bx - ax) * f, cy = ay + (by - ay) * f, nx = -(by - ay) * SZ / L, nz = (bx - ax) * SX / L, sd = r() < 0.5 ? -1 : 1, sz = 0.7 + r() * 1.1, off = (t.w + 1.4 + sz + r() * 2) * sd;
              const px = cx + nx * off / SX, py = cy + nz * off / SZ;
              if ((px > -40 && px < 1576 && py > -40 && py < 1064) || trailDist(px, py) < (sz + 0.4) / SX + 20) continue;
              if (r() < 0.5) boulder(px, py, sz, true); else berry(px, py, 0.6 + r() * 0.5, false);
            }
          }
        }
      }

      // ---- the waymark cairn at the fork in the east: a heap of stones, a pole on top with a rag tied to it ----
      function cairn(px, py, s, pole) {
        const x = X(px), z = Z(py), y = TH(px, py);
        for (let i = 0; i < 9; i++) { const lv = i < 5 ? 0 : i < 8 ? 1 : 2, a = i * 2.4, rr = [0.55, 0.32, 0][lv] * s, ss_ = [0.42, 0.34, 0.28][lv] * s; B.geom('rock', K.rockG[i % 3], new T3.Matrix4().compose(new T3.Vector3(x + Math.cos(a) * rr, y + lv * 0.38 * s, z + Math.sin(a) * rr), new T3.Quaternion().setFromEuler(new T3.Euler(0, a, 0)), new T3.Vector3(ss_, ss_ * 0.8, ss_)), [1.5, 1.48, 1.55], 0.8); }
        lump(x, y + 0.95 * s, z, 0.3 * s, 0.1, 0.3 * s);
        if (pole) { B.box('wood', x, y + 0.6 * s, z, 0.07, 1.6, 0.07, 0, [0.6, 0.5, 0.42]); soft(() => { B.quad('cloth', [x + 0.04, y + 0.6 * s + 1.45, z], [x + 0.5, y + 0.6 * s + 1.38, z + 0.05], [x + 0.45, y + 0.6 * s + 1.05, z + 0.05], [x + 0.04, y + 0.6 * s + 1.15, z], [0, 0, 1, 1], [0.95, 0.5, 0.45]); B.quad('cloth', [x + 0.04, y + 0.6 * s + 1.15, z], [x + 0.45, y + 0.6 * s + 1.05, z + 0.05], [x + 0.5, y + 0.6 * s + 1.38, z + 0.05], [x + 0.04, y + 0.6 * s + 1.45, z], [0, 0, 1, 1], [0.95, 0.5, 0.45]); }); }
        K.addBlock(K.circlePx(px, py, 0.75 * s, 10));
      }
      cairn(CAIRN[0], CAIRN[1], 1.3, true);
      // a signpost where the east trail leaves: a post, and a board pointing on east
      {
        const px = 2880, py = 540, x = X(px), z = Z(py), y = TH(px, py);
        B.box('wood', x, y - 0.3, z, 0.14, 2.1, 0.14, 0, [0.7, 0.56, 0.46]);
        // the board faces whoever comes along the trail toward it
        B.box('planks', x - 0.1, y + 1.3, z, 1.0, 0.4, 0.06, Math.PI / 2, [1.4, 1.2, 1.0]);
        soft(() => { lump(x, y + 1.8, z, 0.1, 0.05, 0.1); lump(x - 0.1, y + 1.71, z, 0.05, 0.04, 0.5, 0); });
        K.addBlock(K.circlePx(px, py, 0.2, 8));
      }

      // ---- the frozen pool at the waterfall's head: flat ice in a hollow of the high country, snowy rocks round it, a
      // frozen stream from it to the cliff's lip; a cairn on its shore ----
      {
        const r = W.rand(141);
        for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + r() * 0.3; if (Math.abs(Math.sin(a)) > 0.7 && Math.sin(a) > 0) continue; boulder(HEAD.c[0] + Math.cos(a) * (HEAD.rx + 22), HEAD.c[1] + Math.sin(a) * (HEAD.ry + 18), 0.6 + r() * 0.6, true); }
        cairn(HEAD.c[0] - HEAD.rx - 40, HEAD.c[1] - 30, 1.0, false);
      }

      // ---- the broken sled, half buried in the low country below the lookout: a runner snapped and up-ended, a split crate,
      // a barrel on its side ----
      {
        const [px, py] = SLED2, x = X(px), z = Z(py), y = TH(px, py), a = 0.6, c = Math.cos(a), s = Math.sin(a);
        const L = (lx, ly, lz) => [x + lx * c + lz * s, y + ly, z - lx * s + lz * c];
        const WOOD = [0.6, 0.48, 0.4];
        for (let i = 0; i < 6; i++) { const lx = -1.4 + i * 0.5; const p = L(lx, 0.1, 0); B.box('wood', p[0], p[1], p[2], 0.18, 0.05, 1.4, a + Math.PI / 2 + (i === 4 ? 0.4 : 0), WOOD); }
        soft(() => { rod('wood', L(-1.6, 0.05, -0.62), L(1.0, 0.1, -0.62), 0.05, WOOD, 5); rod('wood', L(1.0, 0.1, -0.62), L(1.5, 1.2, -0.4), 0.05, WOOD, 5); rod('wood', L(-1.4, 0.05, 0.62), L(0.2, 0.3, 0.75), 0.05, WOOD, 5); });
        { const p = L(-0.6, 0.15, 0.1); B.box('planks', p[0], p[1], p[2], 0.9, 0.55, 0.8, a + 0.3, [0.75, 0.62, 0.5]); }
        { const g = new T3.CylinderGeometry(0.33, 0.33, 0.9, 10); g.rotateZ(Math.PI / 2); const p = L(0.9, 0.3, 0.9); B.geom('wood', g, new T3.Matrix4().compose(V3(p), new T3.Quaternion().setFromEuler(new T3.Euler(0, a + 0.7, 0)), new T3.Vector3(1, 1, 1)), [0.75, 0.55, 0.42], [2.1, 0.9]); g.dispose(); }
        // the snow drifted over half of it
        lump(...L(-1.0, 0.0, 0.3), 1.4, 0.45, 1.0); lump(...L(0.4, -0.05, -0.4), 1.1, 0.35, 0.8); lump(...L(1.2, 0.0, 0.5), 0.8, 0.3, 0.6);
        K.addBlock([[-1.8, -0.9], [1.7, -0.9], [1.7, 1.3], [-1.8, 1.3]].map(([lx, lz]) => { const p = L(lx, 0, lz); return [M.px(p[0]), M.py(p[2])]; }));
        K.shadeMarks.push(['dot', px, py, 60, 0.75]);
      }

      // ---- the frozen pool under the small fall in the south-west: the fall's ice down the cliff above it, rocks round ----
      {
        const top = TH(250, 880), foot = TH(250, 960), zf = Z(935);
        for (let px = 228; px < 274; px += 9) { const xa = X(px), xb = X(px + 10); Q('icefall', [xa, foot - 0.2, zf + 0.2 + R() * 0.2], [xb, foot - 0.2, zf + 0.2 + R() * 0.2], [xb, top + 0.4, zf - 1.1], [xa, top + 0.4, zf - 1.1], [0, 0.3, 1], [xa, foot, xb, top], [1.0, 1.05, 1.1]); }
        for (let i = 0; i < 6; i++) icicle(X(232 + i * 8), top + 0.3, zf - 0.9, 1.2 + R() * 1.6, 0.1);
        const r = W.rand(151);
        for (let i = 0; i < 9; i++) { const a = Math.PI * 0.05 + i / 8 * Math.PI * 0.9; boulder(FALLPOOL.c[0] + Math.cos(a) * (FALLPOOL.rx + 20), FALLPOOL.c[1] + Math.sin(a) * (FALLPOOL.ry + 16), 0.5 + r() * 0.5, true); }
        K.halo(X(250), foot + 1.5, zf + 0.6, 3.0, [0.14, 0.2, 0.34]);
      }

      // ---- the frozen tarn in the west: ice in a hollow, pale dry reeds frozen into its edge, a dead tree leaning over ----
      {
        const r = W.rand(161);
        for (let i = 0; i < 26; i++) {
          const a = r() * TAU, e = 0.92 + r() * 0.1, px = TARN.c[0] + Math.cos(a) * TARN.rx * e, py = TARN.c[1] + Math.sin(a) * TARN.ry * e, x = X(px), z = Z(py), y = TH(px, py);
          soft(() => { for (let k = 0; k < 9; k++) { const b = r() * TAU, lean = 0.1 + r() * 0.25, hh = 0.7 + r() * 0.7, ww = 0.03, bx = x + (r() - 0.5) * 0.5, bz = z + (r() - 0.5) * 0.4; B.tri('rope', [bx - Math.sin(b) * ww, y, bz + Math.cos(b) * ww], [bx + Math.sin(b) * ww, y, bz - Math.cos(b) * ww], [bx + Math.cos(b) * lean, y + hh, bz + Math.sin(b) * lean], [[0, 0], [0.1, 0], [0.05, 1]], [1.7, 1.5, 1.2]); } });
        }
        for (let i = 0; i < 7; i++) { const a = r() * TAU; boulder(TARN.c[0] + Math.cos(a) * (TARN.rx + 40), TARN.c[1] + Math.sin(a) * (TARN.ry + 30), 0.7 + r() * 0.7, true); }
        bare(TARN.c[0] + TARN.rx * 0.6, TARN.c[1] - TARN.ry - 20, 1.1);
      }

      // ---- the mist: low banks of cold blue lying between the trees and under the cliffs (soft glows, drawn last) ----
      {
        const r = W.rand(171);
        for (let i = 0; i < 46; i++) {
          const px = -1400 + r() * 4300, py = -900 + r() * 2800;
          if (px > 40 && px < 1500 && py > 40 && py < 980) continue;
          K.halo(X(px), TH(px, py) + 0.8, Z(py), 8 + r() * 6, [0.11, 0.13, 0.22]);
        }
        for (const [px, py, s] of [[900, 1000, 10], [400, 960, 9], [1300, 760, 10], [60, 900, 9], [1500, 860, 9], [700, 40, 7], [100, 160, 6]]) K.halo(X(px), TH(px, py) + 0.6, Z(py), s, [0.12, 0.14, 0.24]);
      }
      hexG.dispose(); coneG.dispose();
    },
  };
})(window);
