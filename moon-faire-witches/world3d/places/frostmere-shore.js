// frostmere-shore.js: Frostmere's shore in 3D. Its painting (reference/art/walk/wilds/walk-frostmere-shore.png, 1536 x 1024)
// is the middle, laid out in the painting's own pixels as src/game/maps.js keeps the walking map: the snowy cobbled road
// in from the west (from the frozen camp), its fork below the rocks, the road on north between the pines (to the frozen
// pass), the side path up to the sheltered hollow among the rocks, the trodden way east to the boathouse and its barrels,
// and the jetty running out over the ice in two sections on snow-capped posts, the cold lantern hanging where it turns.
// East and south lies the mere, frozen: dark ice cracked with white lines and drifted with crusts of snow, walkable as it
// looks; further out the ice gives way to open black water, which is water. Round the painting the shore goes on, one
// painting's width and height each way (Chris, November 16: wild places are wide open fields in heavy fog, with pockets
// to find): snowy spruces, bare white birches, snow-capped rocks and frozen reeds. Places to find: the old net rack on the
// north shore, the stumps of an old jetty in the ice on the south shore, a boat frozen into the ice, a rocky islet out on
// the mere, a fishing hole cut in the ice, the open water's edge. Two pockets: behind the boathouse (round its west end),
// and the top of the rocky knoll south of the fork (a path round its back). The sheltered hollow at the side path's end
// has a cold hearth. No warm light anywhere here: only the cold lantern's blue-white. (No keepsake lies in this place:
// envoi-final-draft/items/items.js has none at home here.)
// Where Io can walk: the walking map's own walk and block areas, unchanged, plus all the open ground and ice inside
// open.bounds, less the open water and everything solid (every trunk, rock, post, the boathouse, the boat).
// The texture ids are the texture pack's (texture-packs/wilds-north/frostmere-shore/inventory.md).
// Heights are metres: the road and the shore are 0; the ice lies level at -0.6; the jetty's deck is at 0.3; the side
// path climbs to the hollow (+1.5); the knoll's top is +2.3; past the painting the ground rolls (about 2 m up and down)
// and the road north climbs toward the pass.
(function (G) {
  'use strict';
  const P = G.W3D_PLACES = G.W3D_PLACES || {};
  const ID = 'frostmere-shore';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ss = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const SX = 0.04, SZ = 0.05;
  const ICE = -0.6, WATER = -0.72, DECK = 0.3;
  const inPoly = (poly, x, y) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
  const edgeDist = (poly, x, y) => { let d = 1e9; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [ax, ay] = poly[j], [bx, by] = poly[i], dx = bx - ax, dy = by - ay, t = clamp(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1), 0, 1); d = Math.min(d, Math.hypot(x - ax - t * dx, y - ay - t * dy)); } return d; };
  const lineDist = (L, x, y) => { let d = 1e9; for (let i = 1; i < L.length; i++) { const [ax, ay] = L[i - 1], [bx, by] = L[i], dx = bx - ax, dy = by - ay, t = clamp(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1), 0, 1); d = Math.min(d, Math.hypot(x - ax - t * dx, y - ay - t * dy)); } return d; };

  // ---- the mere: its shore (the land is west of this line), traced from the painting, and on past it north and south ----
  const SHORE = [[1180, -1100], [1215, -860], [1190, -600], [1250, -360], [1170, -150], [1112, -20], [1100, 100], [1040, 112], [975, 110], [946, 122],
    [938, 168], [968, 202], [1050, 240], [1098, 300], [1110, 365], [1138, 425], [1140, 470], [1118, 545], [1080, 606], [1000, 628], [900, 640],
    [800, 650], [730, 665], [668, 700], [636, 760], [610, 820], [600, 900], [640, 950], [760, 958], [840, 985], [880, 1024], [830, 1200],
    [700, 1450], [600, 1650], [520, 1860], [470, 2200]];
  const MERE = SHORE.concat([[3200, 2200], [3200, -1100]]);
  // the open water further out, where the ice gives way (it comes in to the shore past the place's north and south ends)
  const OPEN = [[1240, -1100], [1262, -862], [1450, -760], [1800, -640], [2050, -400], [1960, -100], [2010, 250], [1940, 600], [2040, 950], [1880, 1300],
    [1500, 1560], [1000, 1700], [700, 1780], [560, 1840], [490, 2200], [3200, 2200], [3200, -1100]];
  // the fishing hole cut in the ice
  const HOLE = { c: [1190, 1110], r: 0.75 };
  const HOLEP = Array.from({ length: 12 }, (_, i) => { const a = i / 12 * Math.PI * 2; return [Math.round(HOLE.c[0] + Math.cos(a) * HOLE.r / SX), Math.round(HOLE.c[1] + Math.sin(a) * HOLE.r / SZ)]; });
  // the crusts of snow lying on the ice, in rings and patches (the painting's), and more past it: [x, y, rx, ry, hole]
  const CRUST = [[1390, 260, 150, 80, 0.45], [1300, 320, 80, 45, 0.5], [1500, 120, 90, 60, 0], [1250, 130, 110, 30, 0], [1170, 650, 140, 60, 0], [1420, 690, 150, 80, 0.4],
    [1280, 790, 90, 60, 0.6], [1470, 940, 140, 90, 0.5], [1290, 990, 140, 50, 0], [980, 920, 100, 40, 0], [870, 760, 80, 30, 0], [1080, 300, 60, 40, 0],
    [1540, 420, 70, 40, 0], [1650, -300, 160, 80, 0.4], [1500, -600, 120, 70, 0], [1800, 300, 150, 90, 0.5], [1700, 1100, 160, 80, 0.4], [1300, 1350, 150, 70, 0],
    [1000, 1500, 120, 60, 0.4], [1600, 600, 120, 60, 0], [1400, -150, 90, 50, 0], [1850, 800, 110, 60, 0]];

  // ---- the trails past the painting: centre lines in pixels, half widths (m), and their ground ----
  const TRAILS = [
    { id: 'west', w: 1.5, road: true, pts: [[10, 622], [-200, 640], [-450, 612], [-700, 648], [-950, 622], [-1200, 640], [-1430, 632]] },
    { id: 'north', w: 1.5, road: true, pts: [[776, 8], [792, -160], [745, -350], [800, -560], [765, -760], [782, -948]] },
    { id: 'shore-north', w: 0.7, pts: [[792, -300], [930, -360], [1060, -400], [1110, -430]] },
    { id: 'shore-south', w: 0.7, pts: [[260, 630], [300, 800], [380, 1000], [460, 1250], [560, 1420], [640, 1470]] },
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
  const trailDist = (x, y) => { let d = 1e9; for (const t of TRAILS) for (let i = 1; i < t.pts.length; i++) d = Math.min(d, segDist(x, y, t.pts[i - 1], t.pts[i])); return d; };

  // ---- the places to find, and the pockets ----
  const RACK = [1090, -440];                       // the old net rack on the north shore
  const STUMPS = [[700, 1458], [760, 1470], [820, 1482], [880, 1494], [700, 1500], [760, 1512], [820, 1524]];   // the old jetty's stumps
  const BOAT = { c: [1650, 820], a: 0.5 };          // the boat frozen into the ice
  const ISLET = { c: [1720, 160], rx: 120, ry: 70 }; // the rocky islet
  const KNOLL = { c: [640, 562], rx: 130, ry: 64, h: 1.7 };   // the rocky knoll south of the fork (a pocket on its top)
  const HEARTH = [292, 196];                        // the cold hearth in the sheltered hollow
  // the strip behind the boathouse (a pocket): from its west end round to the rocks north of it
  const BEHIND = [[820, 470], [820, 396], [860, 380], [960, 370], [1004, 392], [1006, 420], [990, 420], [986, 404], [845, 404], [840, 470]];

  // ---- the ground ----
  const W3D = () => G.W3D;
  const roll = (x, y, t) => (W3D().vnoise(x / 420, y / 420) - 0.5) * 4.5 + t * (W3D().vnoise(x / 140, y / 140) - 0.5) * 1.3;
  const outOf = (x, y) => Math.hypot(Math.max(0, -x, x - 1536), Math.max(0, -y, y - 1024));
  const inMere = (x, y) => inPoly(MERE, x, y);
  function land(x, y) {
    let h = 0;
    // the rise north-west of the fork, up to the sheltered hollow
    h += 1.6 * ss(470, 150, y) * ss(520, 300, x);
    // the road north climbs toward the pass, past the painting's top
    h += 3.2 * ss(0, -900, y) * (1 - ss(1050, 1200, x));
    // the knoll south of the fork: a rocky rise, its top level
    const e = Math.hypot((x - KNOLL.c[0]) / KNOLL.rx, (y - KNOLL.c[1]) / KNOLL.ry);
    if (e < 1.5) h += KNOLL.h * (1 - ss(0.62, 1.32, e));
    // rolling ground past the painting, gentler along the trails
    const out = outOf(x, y), kr = ss(0, 300, out);
    if (kr > 0) h += kr * roll(x, y, ss(25, 90, trailDist(x, y))) * (0.3 + 0.7 * ss(40, 140, trailDist(x, y)));
    return h;
  }
  function ground(x, y) {
    if (inMere(x, y)) {
      // the ice: level, coming up to the shore in its last half metre; the islet stands out of it
      const d = edgeDist(SHORE, x, y);
      let h = d < 16 ? land(x, y) * 0 + ICE * ss(0, 16, d) : ICE;
      const ie = Math.hypot((x - ISLET.c[0]) / ISLET.rx, (y - ISLET.c[1]) / ISLET.ry);
      if (ie < 1.3) h += (1.3 + (W3D().vnoise(x / 40, y / 40) - 0.5) * 0.5 - ICE) * (1 - ss(0.55, 1.3, ie));
      return h;
    }
    const d = edgeDist(SHORE, x, y);
    return land(x, y) * ss(0, 40, d);
  }
  // the walking map's own walk areas, and the jetty's (its sixth area, from x 938 out over the ice)
  let WB = null;
  const mapWalk = () => WB || (WB = (((G.MAPS || {})[ID] || { walk: [] }).walk).map((p) => { let a = 1e9, b = 1e9, c = -1e9, e = -1e9; for (const [x, y] of p) { a = Math.min(a, x); b = Math.min(b, y); c = Math.max(c, x); e = Math.max(e, y); } return { p, b: [a, b, c, e] }; }));
  const walkDist = (x, y) => { let d = 1e9; for (const q of mapWalk()) { if (inPoly(q.p, x, y)) return 0; if (x > q.b[0] - d && x < q.b[2] + d && y > q.b[1] - d && y < q.b[3] + d) d = Math.min(d, edgeDist(q.p, x, y)); } return d; };
  const jettyPoly = () => { const w = mapWalk(); return w.length > 4 ? w[4].p : []; };
  const onJetty = (x, y) => x >= 926 && inPoly(jettyPoly(), x, y);

  // ---- snow-capped boulders on the painting [x, y, size] ----
  const BOULDERS = [
    [130, 50, 1.8], [40, 130, 1.2], [380, 60, 1.6], [470, 22, 1.3], [440, 195, 1.8], [520, 92, 1.3], [640, 265, 1.2], [200, 310, 1.6], [230, 420, 1.7],
    [60, 470, 1.3], [300, 360, 1.3], [60, 760, 1.6], [180, 700, 1.3], [270, 672, 1.1], [60, 980, 1.5], [180, 900, 1.2],
    [835, 592, 1.1], [882, 602, 1.2], [930, 596, 1.0], [975, 592, 0.9], [750, 712, 1.3], [660, 875, 2.3], [895, 850, 1.6],
    [1040, 1000, 1.1], [610, 962, 1.4], [520, 990, 1.3], [1040, 50, 1.6], [1090, 40, 1.2], [1010, 200, 1.3], [1060, 330, 1.2], [1030, 380, 1.1],
    [1068, 405, 1.2], [1100, 450, 0.9], [880, 262, 1.4], [905, 330, 1.1], [745, 410, 1.3], [785, 395, 1.1], [330, 465, 1.0], [140, 520, 1.0],
  ];
  // pale dry reeds frozen into the ice along the shore [x, y]
  const REEDS = [[1060, 590], [1035, 612], [1092, 575], [1212, 582], [1232, 602], [680, 690], [702, 660], [650, 722], [742, 800], [782, 842], [762, 902],
    [822, 932], [862, 980], [962, 1002], [1022, 82], [1062, 92], [1000, 250], [1042, 300], [1082, 322], [962, 142], [1112, 252], [620, 680], [802, 962],
    [1150, 200], [1130, 330], [700, 950], [880, 1060], [800, 1150], [740, 1300], [1180, -130], [1210, -420], [1230, -700], [640, 1600]];

  P[ID] = {
    id: ID, name: "Frostmere's shore", painting: "art/walk/walk-frostmere-shore.avif", size: [1536, 1024],
    mapId: ID, paintingPng: 'reference/art/walk/wilds/walk-frostmere-shore.png',
    extent: [-1536, -1024, 3072, 2048],
    // where Io may roam: the shore and the ice, out to the open water (which closes it in on the east)
    open: { bounds: [[-1432, 600], [-1440, 200], [-1450, -300], [-1250, -760], [-800, -900], [-200, -860], [400, -900], [760, -948], [820, -948], [1300, -900],
      [2400, -900], [2400, 2000], [500, 2000], [0, 1900], [-600, 1960], [-1200, 1760], [-1450, 1200], [-1430, 900], [-1432, 670]] },
    // the wall check (tools/walls-test.mjs): from the fork in the painting's middle (the north way out is more than the check's
    // 90 seconds' walk from the start at the west edge), to every end of the painting's paths, both ways out, every place to
    // find and both pockets
    checks: { from: [560, 430], goals: [
      ['the fork', 560, 420], ['the road’s top edge (north)', 776, 12], ['the sheltered hollow (its cold hearth)', 300, 220],
      ['the boathouse’s barrels', 880, 540], ['the boathouse’s door, on its landing', 1000, 455], ['where the jetty turns, under the cold lantern', 1200, 535],
      ['the jetty’s end', 1405, 580], ['out on the ice below the jetty', 1300, 700], ['the lone mooring post', 704, 770],
      ['the way on to the frozen camp (the west exit)', -1420, 632], ['the way on to the frozen pass (the north exit)', 782, -940],
      ['the old net rack (north shore)', 1060, -400], ['the old jetty’s stumps (south shore)', 640, 1470], ['the boat frozen in the ice', 1650, 760],
      ['the rocky islet', 1720, 150], ['the fishing hole', 1190, 1070], ['the open water’s edge', 1900, 450],
      ['behind the boathouse (pocket)', 930, 388], ['the top of the knoll (pocket)', 640, 556]] },
    // the trees: on the painting from the painting itself (snow-laden spruces, a few bare birches); past it in clumps with
    // clearings, spruces and birches. None on the ice.
    treeGen: { dark: 0.3, step: 44, fir: 1, firSouth: 1, thorn: 0.18,
      out: { density: 0.62, clump: 460, clear: 0.33, kinds: [0, 0.78, 0.22], size: [0.95, 1.5] },
      roads: [],
      keepOut: (function () {
        const k = [[840, 380, 1020, 500], [250, 140, 340, 260], [1000, -500, 1180, -360], [560, 1400, 960, 1560], [530, 495, 770, 630]];
        // the mere: every cell of it (the ice is open; trees stand only on the shore)
        for (let y = -1100; y < 2200; y += 40) for (let x = 400; x < 3200; x += 40) if ([[x, y], [x + 40, y], [x, y + 40], [x + 40, y + 40]].some(([a, b]) => inPoly(MERE, a, b))) k.push([x - 6, y - 6, x + 46, y + 46]);
        return k;
      })() },
    // the ground: snowy cobbles on the road, trodden snow along it, deep snow everywhere else, the mere's dark ice
    ground: { cob: 'road_cobbles_snow', dirt: 'snow_trodden_trail', grass: 'shared_snow', pave: 'shared_lake_ice', rep: [3.2, 7.5, 3.4, 6.0],
      grassTint: [1.16, 1.12, 1.0], dirtTint: [1.05, 1.02, 1.0], cobTint: [1.0, 1.0, 1.04], paveTint: [1.0, 1.0, 1.05] },
    surfaces: { stone: 'cliff_rock_frozen', dry: 'cliff_rock_frozen', timber: 'shared_planks_wall', planks: 'shared_planks_wall', roof: 'shared_snow',
      wood: 'shared_planks_wall', deck: 'jetty_planks_snow', pave: 'road_cobbles_snow', cloth: 'shared_planks_wall', soil: 'snow_trodden_trail', rock: 'cliff_rock_frozen',
      leaves: 'fir_foliage_snowladen', firs: 'fir_foliage_snowladen', bark: 'shared_snow' },
    tints: { leaves: 0xe8eeff, firs: 0xf2f6ff, bush: 0xd8def2, wood: 0xc0b0a8, rock: 0xffffff, stone: 0xffffff, planks: 0xd0c4c0, roof: 0xf0f2ff, deck: 0xf4f4ff },
    extraMats: {
      snow: { tex: 'shared_snow', rep: 2.2, tint: 0xeef0ff, shade: 0.3 },
      ice: { tex: 'shared_ice', rep: 1.4, tint: 0xd8e6ff, emis: 0x10182c, shade: 0.2 },
      floe: { tex: 'lake_ice_snowcrust', rep: 3.0, tint: 0xe0e6ff, shade: 0.3 },
      reed: { tint: 0xb8a888, shade: 0.4, side: 'double' },
      rope: { tint: 0x8a7462, shade: 0.4 },
      coldglass: { tint: 0xd8e8ff, lit: 0, cut: false },
      hull: { tex: 'jetty_planks_snow', rep: 1.6, tint: 0xb0a4a4, shade: 0.4, side: 'double' },
      net: { tint: 0x6a6070, shade: 0.4, side: 'double' },
    },
    night: { fog: [0.18, 0.186, 0.34], fogNear: 10, fogFar: 42, far: 90, hills: false, sky: [0.6, 0.6, 0.76], moon: [0.42, 0.46, 0.62] },
    textures: [
      { id: 'road_cobbles_snow', made: "./../texture-packs/made/road_cobbles_snow.png", stand: "./../texture-packs/wilds-north/frostmere-shore/stand-in/road_cobbles_snow.png" },
      { id: 'shared_snow', made: "./../texture-packs/made/shared_snow.png", stand: "./../texture-packs/north/frozen-pass/stand-in/shared_snow.png" },
      { id: 'snow_trodden_trail', made: "./../texture-packs/made/snow_trodden_trail.png", stand: "./../texture-packs/wilds-north/frozen-camp/stand-in/snow_trodden_trail.png" },
      { id: 'shared_lake_ice', made: "./../texture-packs/made/shared_lake_ice.png", stand: "./../texture-packs/wilds-north/frostmere-shore/stand-in/shared_lake_ice.png" },
      { id: 'lake_ice_snowcrust', made: "./../texture-packs/made/lake_ice_snowcrust.png", stand: "./../texture-packs/wilds-north/frostmere-shore/stand-in/lake_ice_snowcrust.png" },
      { id: 'jetty_planks_snow', made: "./../texture-packs/made/jetty_planks_snow.png", stand: "./../texture-packs/wilds-north/frostmere-shore/stand-in/jetty_planks_snow.png" },
      { id: 'shared_planks_wall', made: "./../texture-packs/made/shared_planks_wall.png", stand: "./../texture-packs/bogmire-dawnroost/bogmire/stand-in/shared_planks_wall.png" },
      { id: 'cliff_rock_frozen', made: "./../texture-packs/made/cliff_rock_frozen.png", stand: "./../texture-packs/wilds-north/frozen-camp/stand-in/cliff_rock_frozen.png" },
      { id: 'fir_foliage_snowladen', made: "./../texture-packs/made/fir_foliage_snowladen.png", stand: "./../texture-packs/wilds-north/frozen-camp/stand-in/fir_foliage_snowladen.png" },
      { id: 'shared_water_dark', made: "./../texture-packs/made/shared_water_dark.png", stand: "./../texture-packs/wickhollow/jetty/stand-in/shared_water_dark.png" },
      { id: 'shared_ice', made: "./../texture-packs/made/shared_ice.png", stand: "./../texture-packs/north/frozen-pass/stand-in/shared_ice.png" },
    ],
    ground_h: ground,
    // where Io's feet stand: the jetty's deck (a step up onto it from the shore), else the ground and the ice
    walk_h(x, y) { if (onJetty(x, y)) return DECK * ss(926, 944, x) + ground(x, y) * (1 - ss(926, 944, x)); return ground(x, y); },
    // the open water, and the fishing hole
    water: [
      { poly: OPEN, level: () => WATER, tex: 'shared_water_dark', rep: 7, flow: [0.004, 0.002], bed: -6.0 },
      { poly: HOLEP, level: () => WATER, tex: 'shared_water_dark', rep: 2, flow: [0.002, 0.001], bed: -4.0 },
    ],
    lawns: [],
    noRocks: [[-2000, -2000, 4000, 3000]],
    // the edge of the open ground is the woods' own thicket on the land, the open water on the mere
    start: [50, 622], startFace: Math.PI / 2, startYaw: -1.45,
    exits: [
      { rect: [-1442, 596, -1420, 668], label: 'The frozen camp' },
      { rect: [744, -960, 820, -938], label: 'The frozen pass' },
    ],
    // the roads (cobbles, trodden snow along their edges), the footpaths (trodden snow), the strip behind the boathouse and
    // the path up the knoll's back
    walkAdd: TRAILS.map((t) => ({ poly: ribbon(t.pts, t.w + 0.6), ground: 'dirt' })).concat(TRAILS.filter((t) => t.road).map((t) => ({ poly: ribbon(t.pts, t.w), ground: 'cob' })))
      .concat([{ poly: BEHIND, ground: 'dirt' }]),
    // the mere's ice, its crusts of snow (some ringing a hole of dark ice), the cold hearth's ring of trodden snow
    groundPatches: [{ poly: MERE, kind: 'pave' }].concat(...CRUST.map(([x, y, rx, ry, hole]) => {
      const el = (k) => Array.from({ length: 16 }, (_, i) => { const a = i / 16 * Math.PI * 2, w = 1 + 0.18 * Math.sin(a * 3 + x) * Math.cos(a * 2 + y); return [Math.round(x + Math.cos(a) * rx * k * w), Math.round(y + Math.sin(a) * ry * k * w)]; });
      return hole ? [{ poly: el(1), kind: 'grass' }, { poly: el(hole), kind: 'pave' }] : [{ poly: el(1), kind: 'grass' }];
    })).concat([{ poly: [[262, 176], [322, 176], [326, 222], [262, 226]], kind: 'dirt' }]),
    items: {},
    // the boathouse: a small timber hut, its ridge east-west, its door on the east end facing the jetty, a small
    // shuttered window in its long south wall (no light in it: no warm light anywhere here)
    buildings: [
      { id: 'boathouse', name: 'the boathouse', fp: [848, 408, 990, 480], walls: [{ t: 'planks', h: 2.3 }], roof: { ridge: 'ew', rise: 1.7, over: 0.45 },
        doors: [{ side: 'e', y: 452, w: 1.1, h: 1.95, plain: true, light: false }],
        windows: [{ side: 's', x: 888, y: 1.0, w: 0.6, h: 0.55, dark: true }] },
    ],
    // the boathouse door's landing, joining the jetty
    decks: [{ r: [990, 434, 1014, 484], y: DECK, boards: 'ns', stilts: false }],
    walls: [],
    steps: [],
    lamps: [],
    // the barrels along the boathouse's front, the last one by the jetty
    props: [{ k: 'barrel', at: [866, 492] }, { k: 'barrel', at: [884, 494] }, { k: 'barrel', at: [902, 495] }, { k: 'barrel', at: [924, 526] }],
    flowers: [],
    // the moonlight lying on the ice and the snow (the cold lantern's is added in extra)
    lights: [
      [1300, 700, 260, 0.35, 'moon'], [1400, 300, 240, 0.35, 'moon'], [600, 450, 220, 0.25, 'moon'], [1650, 820, 160, 0.3, 'moon'], [1720, 160, 160, 0.3, 'moon'],
      [1190, 1110, 120, 0.35, 'moon'], [300, 210, 120, 0.3, 'moon'], [1090, -420, 140, 0.3, 'moon'], [760, 1480, 160, 0.3, 'moon'],
    ],
    trees: ID,
    // the painting's own trees by the paths: the little pine at the road's west end, the pine below the road, the little
    // pine at the hollow's mouth, the big pine beside the path up to the hollow, the pine beside the way to the boathouse,
    // the pine on the knoll; and the bare birches in their clumps
    extraTrees: [[26, 732, 0.7, 1, 11], [325, 660, 0.9, 1, 12], [276, 294, 0.6, 1, 13], [482, 346, 1.4, 1, 14], [736, 545, 0.9, 1, 15], [598, 532, 1.0, 1, 16],
      [120, 300, 0.9, 2, 21], [146, 330, 0.8, 2, 22], [100, 362, 0.85, 2, 23], [170, 420, 0.8, 2, 24], [950, 40, 0.8, 2, 25], [976, 72, 0.7, 2, 26],
      [930, 62, 0.75, 2, 27], [60, 820, 0.9, 2, 28], [84, 862, 0.8, 2, 29], [40, 905, 0.85, 2, 30], [420, 645, 0.8, 2, 31], [446, 668, 0.75, 2, 32],
      [300, 880, 0.9, 2, 33], [330, 905, 0.8, 2, 34], [990, 20, 0.7, 2, 35], [1680, 150, 0.8, 2, 36], [1760, 175, 0.7, 1, 37], [1090, -480, 1.0, 1, 38]],

    // ---- what the engine has no field for: the jetty and its posts, the cold lantern, snow on the boathouse's roof and its
    // icicles, the boulders, the reeds, the mooring post, the places to find, the two pockets ----
    extra(K) {
      const { B, X, Z, M } = K, W = G.W3D, TAU = Math.PI * 2, T3 = G.THREE;
      const TH = K.terrain;
      const R = W.rand(8123);
      const soft = (fn) => { B.solid = false; fn(); B.solid = true; };
      const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
      const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
      const Q = (k, a, b, c, d, want, uv, col) => { const n = cross(sub(b, a), sub(d, a)); if (dot(n, want) < 0) B.quad(k, b, a, d, c, uv, col); else B.quad(k, a, b, c, d, uv, col); };
      const V3 = (a) => new T3.Vector3(a[0], a[1], a[2]);
      const UPV = new T3.Vector3(0, 1, 0), _q = new T3.Quaternion(), _d = new T3.Vector3();
      const rod = (k, a, b, r, col, seg) => { _d.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]); const L = _d.length(); if (L < 1e-4) return; _d.multiplyScalar(1 / L); _q.setFromUnitVectors(UPV, _d); const g = new T3.CylinderGeometry(r, r, L, seg || 5, 1, true); g.translate(0, L / 2, 0); B.geom(k, g, new T3.Matrix4().compose(V3(a), _q, new T3.Vector3(1, 1, 1)), col, [0.5, L]); g.dispose(); };
      const SNOW = [1.0, 1.0, 1.04], ICEC = [1.0, 1.04, 1.1];
      const lump = (x, y, z, sx, sy, sz, rot) => soft(() => B.geom('snow', K.ico[Math.floor(R() * 3)], new T3.Matrix4().compose(new T3.Vector3(x, y, z), new T3.Quaternion().setFromEuler(new T3.Euler(0, rot == null ? R() * TAU : rot, 0)), new T3.Vector3(sx, sy, sz)), SNOW, 1.2));
      const coneG = new T3.ConeGeometry(1, 1, 5, 1, true); coneG.rotateX(Math.PI);
      const icicle = (x, y, z, len, r) => soft(() => B.geom('ice', coneG, new T3.Matrix4().compose(new T3.Vector3(x, y - len / 2, z), new T3.Quaternion(), new T3.Vector3(r, len, r)), ICEC, [0.3, len]));
      function boulder(px, py, s, solid) {
        const x = X(px), z = Z(py), y = TH(px, py), rot = R() * TAU;
        if (!solid) B.solid = false;
        B.geom('rock', K.rockG[Math.floor(R() * 3)], new T3.Matrix4().compose(new T3.Vector3(x, y - s * 0.25, z), new T3.Quaternion().setFromEuler(new T3.Euler(0, rot, 0)), new T3.Vector3(s, s * 0.95, s)), [1.35, 1.32, 1.4], 1.2);
        B.solid = true;
        lump(x, y + s * 0.4, z, s * 0.8, s * 0.42, s * 0.78, rot);
        if (solid) K.addBlock(K.circlePx(px, py, s * 0.78, 10));
        K.shadeMarks.push(['dot', px, py, s / SX * 1.1, 0.72]);
      }
      // a clump of pale dry reeds, frozen into the ice or the snow
      function reeds(px, py, n) {
        const x = X(px), z = Z(py), y = TH(px, py), r = W.rand(Math.abs(px * 31 + py * 7));
        soft(() => {
          for (let k = 0; k < (n || 14); k++) {
            const b = r() * TAU, lean = 0.08 + r() * 0.3, hh = 0.9 + r() * 0.9, ww = 0.025, bx = x + (r() - 0.5) * 0.7, bz = z + (r() - 0.5) * 0.5, la = r() * TAU;
            const top = [bx + Math.cos(la) * lean, y + hh, bz + Math.sin(la) * lean];
            B.tri('reed', [bx - Math.sin(b) * ww, y - 0.05, bz + Math.cos(b) * ww], [bx + Math.sin(b) * ww, y - 0.05, bz - Math.cos(b) * ww], top, [[0, 0], [0.1, 0], [0.05, 1]], [1.6, 1.5, 1.25]);
            if (r() < 0.45) B.tri('reed', [top[0] - 0.02, top[1] - 0.18, top[2]], [top[0] + 0.02, top[1] - 0.18, top[2]], [top[0], top[1] + 0.02, top[2]], [[0, 0], [0.1, 0], [0.05, 1]], [1.1, 0.95, 0.75]);
          }
        });
      }
      // a post standing in the ice, its top snow-capped
      const post = (px, py, top, r, solid) => { const x = X(px), z = Z(py); B.solid = solid !== false; B.cyl('wood', x, ICE - 0.6, z, r, r * 0.92, top - ICE + 0.6, 8, [0.62, 0.52, 0.48], [1.2, 1.8]); B.solid = true; lump(x, top + 0.02, z, r * 1.05, 0.12, r * 1.05); if (solid !== false) K.addBlock(K.circlePx(px, py, r + 0.04, 8)); };

      // ---- the jetty: planks across its two sections (each board from the walking map's edges at its x), a beam along each
      // side, posts down into the ice on both sides, snow lying along the boards ----
      {
        const J = jettyPoly(), x0 = 940, x1 = 1424;
        const span = (x) => { const ys = []; for (let i = 0, j = J.length - 1; i < J.length; j = i++) { const [ax, ay] = J[j], [bx, by] = J[i]; if ((ax <= x) !== (bx <= x)) ys.push(ay + (by - ay) * (x - ax) / (bx - ax)); } ys.sort((a, b) => a - b); return ys.length >= 2 ? [ys[0], ys[ys.length - 1]] : null; };
        let prev = null;
        for (let px = x0; px < x1; px += 6.2) {
          const s0 = span(px + 0.5), s1 = span(px + 5.7); if (!s0 || !s1) continue;
          const xa = X(px), xb = X(px + 5.8), k = 0.9 + R() * 0.2;
          soft(() => B.quad('deck', [xa, DECK, Z(s0[1] + 1)], [xb, DECK, Z(s1[1] + 1)], [xb, DECK, Z(s1[0] - 1)], [xa, DECK, Z(s0[0] - 1)], [xa, Z(s0[1]), xb, Z(s0[0])], [k, k, k * 1.02]));
          // the boards' edges, seen from the ice
          soft(() => { B.quad('wood', [xa, DECK - 0.12, Z(s0[1] + 1)], [xb, DECK - 0.12, Z(s1[1] + 1)], [xb, DECK, Z(s1[1] + 1)], [xa, DECK, Z(s0[1] + 1)], [0, 0, 0.24, 0.12], [0.6, 0.55, 0.55]); B.quad('wood', [xb, DECK - 0.12, Z(s1[0] - 1)], [xa, DECK - 0.12, Z(s0[0] - 1)], [xa, DECK, Z(s0[0] - 1)], [xb, DECK, Z(s1[0] - 1)], [0, 0, 0.24, 0.12], [0.6, 0.55, 0.55]); });
          // snow drifted along the boards' edges, now and then
          if (R() < 0.35) lump((xa + xb) / 2, DECK, Z(s0[1]) - 0.1, 0.22, 0.05, 0.12);
          if (R() < 0.25) lump((xa + xb) / 2, DECK, Z(s0[0]) + 0.1, 0.2, 0.05, 0.1);
          prev = [px, s0];
        }
        void prev;
        // the posts: along both sides, every two and a half metres or so, standing out of the ice past the deck
        const postsAt = [972, 1024, 1060, 1118, 1176, 1260, 1330, 1380, 1428];
        for (const px of postsAt) {
          const s = span(Math.min(px, x1 - 2)); if (!s) continue;
          post(px, s[1] + 5, DECK + 0.55 + R() * 0.25, 0.15);
          if (px !== 1176) post(px, s[0] - 5, DECK + 0.5 + R() * 0.25, 0.15);
        }
        // the beams under the deck's edges and the bracing between posts, seen from the ice
        for (let px = x0; px < x1 - 20; px += 40) {
          const a = span(px), b = span(px + 40); if (!a || !b) continue;
          soft(() => { rod('wood', [X(px), DECK - 0.22, Z(a[1])], [X(px + 40), DECK - 0.22, Z(b[1])], 0.08, [0.55, 0.48, 0.45], 4); rod('wood', [X(px), DECK - 0.22, Z(a[0])], [X(px + 40), DECK - 0.22, Z(b[0])], 0.08, [0.55, 0.48, 0.45], 4); });
          soft(() => rod('wood', [X(px), ICE + 0.1, Z(a[1]) + 0.05], [X(px + 40), DECK - 0.25, Z(b[1]) + 0.05], 0.05, [0.5, 0.44, 0.42], 4));
        }
        K.shadeMarks.push(['poly', J.filter((p) => p[0] > x0 - 4), 0.8]);
      }
      // ---- the cold lantern: an iron lantern with a blue-white light, hanging from a post's arm where the jetty turns ----
      {
        const px = 1184, py = 506, x = X(px), z = Z(py), top = DECK + 2.6;
        B.cyl('wood', x, ICE - 0.6, z, 0.15, 0.13, top - ICE + 0.6, 8, [0.62, 0.52, 0.48], [1.2, 2.6]);
        K.addBlock(K.circlePx(px, py, 0.2, 8));
        B.box('wood', x + 0.45, top - 0.12, z, 1.0, 0.12, 0.12, 0, [0.62, 0.52, 0.48]);
        soft(() => { rod('wood', [x + 0.05, top - 0.75, z], [x + 0.6, top - 0.12, z], 0.04, [0.6, 0.5, 0.46], 4); lump(x, top, z, 0.17, 0.06, 0.17); lump(x + 0.45, top + 0.0, z, 0.5, 0.05, 0.08, 0); });
        const lx = x + 0.82, ly = top - 0.75;
        soft(() => {
          B.box('iron', lx, ly + 0.36, z, 0.025, 0.36, 0.025, 0);
          B.box('iron', lx, ly - 0.03, z, 0.26, 0.05, 0.26, 0); B.box('iron', lx, ly + 0.3, z, 0.3, 0.06, 0.3, 0);
          B.cyl('iron', lx, ly + 0.36, z, 0.16, 0.02, 0.14, 4);
          for (const [dx, dz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) B.box('iron', lx + dx * 0.1, ly, z + dz * 0.1, 0.025, 0.3, 0.025, 0);
          B.box('coldglass', lx, ly, z, 0.2, 0.3, 0.2, 0, [1.3, 1.45, 1.7]);
          lump(lx, ly + 0.38, z, 0.17, 0.05, 0.17);
        });
        K.halo(lx, ly + 0.15, z, 1.6, [0.4, 0.55, 0.85]); K.halo(lx, ly + 0.15, z, 5.0, [0.12, 0.17, 0.3]);
        K.light(M.px(lx), M.py(z) + 12, 150, 0.75, 'moon');
        K.lamps3d.push({ x: lx, y: ly + 0.15, z, c: 0xa8c4ff, k: 1.1 });
      }

      // ---- the boathouse: a stone footing, snow heavy on its roof (thick along the eaves, lumps on the ridge), icicles at
      // the eaves, a plank door frame on its east end ----
      {
        const b = P[ID].buildings[0], [px0, py0, px1, py1] = b.fp, x0 = X(px0), x1 = X(px1), z0 = Z(py0), z1 = Z(py1), cz = (z0 + z1) / 2, d = z1 - z0, w = x1 - x0;
        const base = TH((px0 + px1) / 2, py1 + 4), E = base + 2.3, rise = 1.7, o = 0.45, ye = E - o * rise / (d / 2);
        // the footing
        for (const [cx, cz_, ww, dd] of [[(x0 + x1) / 2, z1 + 0.02, w + 0.1, 0.12], [(x0 + x1) / 2, z0 - 0.02, w + 0.1, 0.12], [x0 - 0.02, cz, 0.12, d + 0.1], [x1 + 0.02, cz, 0.12, d + 0.1]]) B.box('stone', cx, base - 0.5, cz_, ww, 0.75, dd, 0, [1.3, 1.25, 1.3]);
        soft(() => {
          // the snow: a thick slab along each eave, a rounded ridge, and the slopes' snow
          for (const [ze, sgn] of [[z0 - o, -1], [z1 + o, 1]]) {
            B.box('snow', (x0 + x1) / 2, ye - 0.12, ze - sgn * 0.12, w + 2 * o + 0.1, 0.24, 0.42, 0, SNOW);
            for (let x = x0 - o + 0.1; x < x1 + o - 0.1; x += 0.2 + R() * 0.25) icicle(x, ye - 0.1, ze, 0.15 + R() * 0.55, 0.035 + R() * 0.02);
          }
          for (let x = x0 - o + 0.3; x < x1 + o; x += 0.55) lump(x, E + rise + 0.05, cz, 0.45, 0.22, 0.5);
          for (const sgn of [-1, 1]) Q('snow', [x0 - o - 0.05, ye + 0.08, cz + sgn * (d / 2 + o + 0.05)], [x1 + o + 0.05, ye + 0.08, cz + sgn * (d / 2 + o + 0.05)], [x1 + o + 0.05, E + rise + 0.14, cz], [x0 - o - 0.05, E + rise + 0.14, cz], [0, 1, sgn * 0.8], [x0, 0, x1, d], SNOW);
        });
      }
      for (const pr of P[ID].props) if (pr.k === 'barrel') { const x = X(pr.at[0]), z = Z(pr.at[1]), y = TH(pr.at[0], pr.at[1]); lump(x, y + 0.9, z, 0.32, 0.09, 0.32); }

      // ---- the boulders, the reeds, the lone mooring post in the ice ----
      for (const [px, py, s] of BOULDERS) boulder(px, py, s, true);
      for (const [px, py] of REEDS) reeds(px, py, 14);
      post(704, 790, ICE + 1.5, 0.16);
      // more snowy boulders and reeds along the trails and the shore past the painting
      {
        const r = W.rand(90);
        for (const t of TRAILS) for (let i = 1; i < t.pts.length; i++) {
          const [ax, ay] = t.pts[i - 1], [bx, by] = t.pts[i], L = Math.hypot((bx - ax) * SX, (by - ay) * SZ);
          for (let s = 6 + r() * 8; s < L; s += 13 + r() * 15) {
            const f = s / L, cx = ax + (bx - ax) * f, cy = ay + (by - ay) * f, nx = -(by - ay) * SZ / L, nz = (bx - ax) * SX / L, sd = r() < 0.5 ? -1 : 1, sz = 0.7 + r() * 1.1, off = (t.w + 1.5 + sz + r() * 2) * sd;
            const px = cx + nx * off / SX, py = cy + nz * off / SZ;
            if ((px > -40 && px < 1576 && py > -40 && py < 1064) || trailDist(px, py) < (sz + 0.4) / SX + 20 || inMere(px, py)) continue;
            boulder(px, py, sz, true);
          }
        }
        // the shore past the painting: rocks and reeds along it every so often
        for (let i = 1; i < SHORE.length; i++) {
          const [ax, ay] = SHORE[i - 1], [bx, by] = SHORE[i], L = Math.hypot((bx - ax) * SX, (by - ay) * SZ);
          for (let s = r() * 6; s < L; s += 5 + r() * 7) {
            const f = s / L, px = ax + (bx - ax) * f + (r() - 0.5) * 30, py = ay + (by - ay) * f + (r() - 0.5) * 30;
            if ((px > -40 && px < 1576 && py > -40 && py < 1064) || trailDist(px, py) < 50) continue;
            if (r() < 0.45) boulder(px, py, 0.6 + r() * 0.9, true); else reeds(px, py, 10);
          }
        }
      }

      // ---- the cold hearth in the sheltered hollow: a ring of stones, the black of an old fire, a log to sit on ----
      {
        const [px, py] = HEARTH, x = X(px), z = Z(py), y = TH(px, py);
        for (let i = 0; i < 11; i++) { const a = i / 11 * TAU, s = 0.24 + R() * 0.06; B.geom('rock', K.rockG[i % 3], new T3.Matrix4().compose(new T3.Vector3(x + Math.cos(a) * 0.62, y - 0.05, z + Math.sin(a) * 0.52), new T3.Quaternion().setFromEuler(new T3.Euler(0, a, 0)), new T3.Vector3(s * 1.1, s * 0.7, s)), [1.4, 1.35, 1.4], 0.6); }
        soft(() => { for (let i = 0; i < 3; i++) { const a = i * 2.1; rod('wood', [x + Math.cos(a) * 0.35, y + 0.04, z + Math.sin(a) * 0.3], [x - Math.cos(a) * 0.15, y + 0.12, z - Math.sin(a) * 0.12], 0.06, [0.3, 0.26, 0.26], 5); } lump(x, y - 0.02, z, 0.4, 0.06, 0.35); });
        // a log to sit on, low, along the hollow's west side (she steps over the hearth's low ring and the log)
        const g = new T3.CylinderGeometry(0.15, 0.15, 1.3, 8); g.rotateX(Math.PI / 2);
        B.geom('wood', g, new T3.Matrix4().makeTranslation(X(268), TH(268, 212) + 0.1, Z(212)), [0.75, 0.62, 0.55], [1.0, 1.3]); g.dispose();
        lump(X(268), TH(268, 212) + 0.25, Z(212), 0.12, 0.05, 0.55, 0);
      }

      // ---- behind the boathouse (a pocket): an upturned boat on trestles and a woodpile under the eaves ----
      {
        const px = 930, py = 360, x = X(px), z = Z(py), y = TH(px, py);
        // the boat: an upturned hull of planks, against the rocks
        const hull = new T3.SphereGeometry(1, 10, 6, 0, TAU, 0, Math.PI / 2);
        B.geom('hull', hull, new T3.Matrix4().compose(new T3.Vector3(x, y + 0.6, z - 0.3), new T3.Quaternion(), new T3.Vector3(1.9, 0.5, 0.6)), [1, 1, 1], [3, 1.5]); hull.dispose();
        lump(x, y + 1.05, z - 0.3, 1.5, 0.1, 0.4, 0);
        for (const dx of [-1.1, 1.1]) for (const dz of [-0.45, -0.15]) B.box('wood', x + dx, y, z + dz - 0.3, 0.07, 0.6, 0.07, 0, [0.6, 0.5, 0.45]);
        // the woodpile against the boathouse's back wall
        for (let row = 0; row < 3; row++) for (let i = 0; i < 6 - row; i++) { const g = new T3.CylinderGeometry(0.11, 0.11, 0.5, 7); g.rotateX(Math.PI / 2); B.geom('wood', g, new T3.Matrix4().makeTranslation(X(870) + i * 0.24 + row * 0.12, TH(870, 400) + 0.12 + row * 0.21, Z(400)), [0.8, 0.62, 0.5], [0.7, 0.8]); g.dispose(); }
        lump(X(870) + 0.6, TH(870, 400) + 0.72, Z(400), 0.8, 0.1, 0.4, 0);
      }

      // ---- the knoll south of the fork (a pocket on its top): a ring of snowy rocks round it but on its south-east, where a
      // path climbs round its back; a pine and a flat stone to sit on at the top ----
      {
        const [cx, cy] = KNOLL.c;
        for (let i = 0; i < 16; i++) {
          const a = i / 16 * TAU; if (a > 0.15 && a < 1.1) continue;   // the way up, on its south-east
          boulder(cx + Math.cos(a) * KNOLL.rx * 0.95, cy + Math.sin(a) * KNOLL.ry * 0.95, 0.75 + R() * 0.45, true);
        }
        const x = X(cx + 20), z = Z(cy + 6), y = TH(cx + 20, cy + 6);
        B.box('stone', x, y - 0.2, z, 1.1, 0.55, 0.6, 0.3, [1.4, 1.35, 1.4]); lump(x, y + 0.34, z, 0.5, 0.06, 0.28, 0.3);
      }

      // ---- the old net rack on the north shore: two rows of posts with poles across, tattered nets hanging frozen ----
      {
        const [px, py] = RACK;
        for (let i = 0; i < 4; i++) for (const dy of [-14, 14]) { const qx = px + i * 34, qy = py + dy, x = X(qx), z = Z(qy), y = TH(qx, qy); B.box('wood', x, y - 0.3, z, 0.14, 2.3, 0.14, 0, [0.62, 0.52, 0.48]); lump(x, y + 2.0, z, 0.1, 0.05, 0.1); K.addBlock(K.circlePx(qx, qy, 0.12, 6)); }
        for (const dy of [-14, 14]) { const y = TH(px, py) + 1.85; soft(() => rod('wood', [X(px) - 0.2, y, Z(py + dy)], [X(px + 102) + 0.2, y, Z(py + dy)], 0.05, [0.6, 0.5, 0.46], 5)); }
        soft(() => {
          for (let i = 0; i < 3; i++) for (const dy of [-14, 14]) {
            const xa = X(px + i * 34 + 3), xb = X(px + (i + 1) * 34 - 3), z = Z(py + dy), y = TH(px, py) + 1.85, sag = 0.2 + R() * 0.3, low = 0.6 + R() * 0.5;
            B.quad('net', [xa, y - low, z], [xb, y - low - sag, z], [xb, y, z], [xa, y, z], [0, 0, 1, 1], [1, 1, 1]);
            lump((xa + xb) / 2, y + 0.02, z, 0.6, 0.05, 0.08, 0);
            for (let k = 0; k < 4; k++) icicle(xa + (xb - xa) * (k + 0.5) / 4, y - low - sag * (k + 0.5) / 4, z, 0.12 + R() * 0.2, 0.02);
          }
        });
        reeds(px + 60, py + 50, 12); boulder(px - 40, py + 30, 0.9, true);
      }

      // ---- a signpost at each way out: a post, and a board pointing on ----
      for (const [px, py, dir] of [[-1380, 598, -1], [740, -900, 0]]) {
        const x = X(px), z = Z(py), y = TH(px, py);
        B.box('wood', x, y - 0.3, z, 0.14, 2.1, 0.14, 0, [0.7, 0.56, 0.46]);
        // the board faces whoever comes along the trail toward it
        const ry = dir ? Math.PI / 2 : 0, oz = dir ? 0 : 0.1, ox = dir ? 0.1 : 0;
        B.box('planks', x + ox, y + 1.3, z + oz, 1.0, 0.4, 0.06, ry, [1.4, 1.22, 1.05]);
        lump(x, y + 1.8, z, 0.1, 0.05, 0.1); lump(x + ox, y + 1.71, z + oz, dir ? 0.05 : 0.5, 0.04, dir ? 0.5 : 0.05, 0);
        K.addBlock(K.circlePx(px, py, 0.2, 8));
      }
      // ---- the old jetty's stumps in the ice off the south shore, its deck long gone ----
      for (const [px, py] of STUMPS) post(px, py, ICE + 0.35 + R() * 0.5, 0.15);

      // ---- the boat frozen into the ice: a rowing boat, its hull half sunk, an oar across it, snow in it ----
      {
        const [px, py] = BOAT.c, x = X(px), z = Z(py), a = BOAT.a, c = Math.cos(a), s = Math.sin(a);
        const hull = new T3.SphereGeometry(1, 12, 6, 0, TAU, Math.PI / 2, Math.PI / 2);
        B.geom('hull', hull, new T3.Matrix4().compose(new T3.Vector3(x, ICE + 0.5, z), new T3.Quaternion().setFromEuler(new T3.Euler(0, -a, 0.12)), new T3.Vector3(2.1, 0.6, 0.75)), [1, 1, 1], [3.5, 1.5]); hull.dispose();
        // the gunwale, a thwart, the snow lying in it, an oar laid across
        soft(() => {
          const ring = new T3.TorusGeometry(1, 0.035, 4, 24); ring.rotateX(Math.PI / 2);
          B.geom('wood', ring, new T3.Matrix4().compose(new T3.Vector3(x, ICE + 0.52, z), new T3.Quaternion().setFromEuler(new T3.Euler(0, -a, 0.12)), new T3.Vector3(2.1, 1, 0.75)), [0.7, 0.6, 0.55], 1); ring.dispose();
          // the snow drifted in it, filling its bottom
          B.geom('snow', K.ico[1], new T3.Matrix4().compose(new T3.Vector3(x, ICE + 0.22, z), new T3.Quaternion().setFromEuler(new T3.Euler(0, -a, 0.12)), new T3.Vector3(1.85, 0.16, 0.62)), SNOW, 1.2);
          B.box('wood', x, ICE + 0.38, z, 0.25, 0.06, 1.4, -a, [0.7, 0.6, 0.55]);
          lump(x - c * 0.5, ICE + 0.4, z + s * 0.5, 1.0, 0.16, 0.45, -a);
          rod('wood', [x - c * 1.6 - s * 0.4, ICE + 0.6, z + s * 1.6 - c * 0.4], [x + c * 1.4 + s * 0.6, ICE + 0.65, z - s * 1.4 + c * 0.6], 0.04, [0.72, 0.6, 0.5], 5);
        });
        K.addBlock([[-2.15, -0.8], [2.15, -0.8], [2.15, 0.8], [-2.15, 0.8]].map(([lx, lz]) => [M.px(x + lx * c + lz * s), M.py(z - lx * s + lz * c)]));
        // the ice heaved up round it
        for (let i = 0; i < 6; i++) { const b = i / 6 * TAU; soft(() => B.geom('floe', K.rockG[i % 3], new T3.Matrix4().compose(new T3.Vector3(x + Math.cos(b) * 2.0, ICE - 0.05, z + Math.sin(b) * 0.95), new T3.Quaternion().setFromEuler(new T3.Euler(0.3, b, 0)), new T3.Vector3(0.5, 0.18, 0.35)), [1, 1, 1], 1)); }
      }

      // ---- the rocky islet out on the mere: snowy rocks round its shore, a birch and a spruce on it (trees in extraTrees) ----
      { const r = W.rand(201); for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + r() * 0.4; boulder(ISLET.c[0] + Math.cos(a) * ISLET.rx * 0.9, ISLET.c[1] + Math.sin(a) * ISLET.ry * 0.9, 0.7 + r() * 0.7, true); } reeds(ISLET.c[0] - ISLET.rx - 10, ISLET.c[1] + 20, 12); }

      // ---- the fishing hole cut in the ice: its rim of broken ice, a stool, a short rod propped on a forked stick ----
      {
        const [px, py] = HOLE.c, x = X(px), z = Z(py), y = ICE;
        for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; soft(() => B.geom('floe', K.rockG[i % 3], new T3.Matrix4().compose(new T3.Vector3(x + Math.cos(a) * (HOLE.r + 0.15), y - 0.02, z + Math.sin(a) * (HOLE.r + 0.15)), new T3.Quaternion().setFromEuler(new T3.Euler(0.2, a, 0)), new T3.Vector3(0.28, 0.1, 0.2)), [1.05, 1.05, 1.1], 1)); }
        const sx = x - 1.3, sz = z + 0.4;
        for (const [dx, dz] of [[-0.15, -0.15], [0.15, -0.15], [0, 0.17]]) soft(() => rod('wood', [sx + dx * 1.3, y, sz + dz * 1.3], [sx, y + 0.42, sz], 0.025, [0.65, 0.52, 0.45], 4));
        B.cyl('wood', sx, y + 0.42, sz, 0.2, 0.2, 0.05, 10, [0.75, 0.62, 0.52]); lump(sx, y + 0.47, sz, 0.18, 0.04, 0.18);
        soft(() => { rod('wood', [x - 0.9, y, z - 0.6], [x - 0.9, y + 0.5, z - 0.6], 0.02, [0.6, 0.5, 0.45], 4); rod('wood', [x - 1.1, y + 0.05, z - 0.65], [x + 0.2, y + 0.8, z - 0.2], 0.018, [0.7, 0.6, 0.5], 4); rod('rope', [x + 0.2, y + 0.8, z - 0.2], [x + 0.15, WATER, z - 0.05], 0.004, null, 3); });
        K.addBlock(K.circlePx(M.px(sx), M.py(sz), 0.28, 8));
      }

      // ---- the open water's edge: floes of ice and crust adrift along it, the sheet's broken edge ----
      {
        const r = W.rand(301);
        for (let i = 1; i < OPEN.length - 3; i++) {
          const [ax, ay] = OPEN[i - 1], [bx, by] = OPEN[i], L = Math.hypot((bx - ax) * SX, (by - ay) * SZ);
          for (let s = r() * 3; s < L; s += 2.2 + r() * 3.5) {
            const f = s / L, px = ax + (bx - ax) * f, py = ay + (by - ay) * f;
            if (!inPoly(MERE, px, py)) continue;
            // out on the water (east of the edge), small floes; on the edge, the broken sheet
            const out = 20 + r() * 90, ox = px + out * 0.9, oy = py + (r() - 0.5) * 40, sz = 0.5 + r() * 1.3;
            soft(() => B.box('floe', X(ox), WATER - 0.08, Z(oy), sz * 1.4, 0.16, sz, r() * TAU, [1, 1, 1.04]));
            soft(() => B.box('floe', X(px), ICE - 0.12, Z(py), 0.9 + r() * 1.2, 0.14, 0.5 + r() * 0.8, r() * TAU, [1.02, 1.02, 1.06]));
          }
        }
      }

      // ---- the mist: low banks of cold blue over the ice and between the trees ----
      {
        const r = W.rand(171);
        for (let i = 0; i < 52; i++) {
          const px = -1400 + r() * 4000, py = -900 + r() * 2800;
          if (px > 40 && px < 1500 && py > 40 && py < 980) continue;
          K.halo(X(px), TH(px, py) + 0.8, Z(py), 8 + r() * 7, [0.11, 0.13, 0.22]);
        }
        for (const [px, py, s] of [[1300, 300, 10], [1450, 800, 11], [1100, 900, 9], [1500, 520, 9], [200, 900, 8], [400, 60, 7], [1300, 40, 9]]) K.halo(X(px), TH(px, py) + 0.6, Z(py), s, [0.12, 0.14, 0.24]);
      }
      coneG.dispose();
    },
  };
})(window);
