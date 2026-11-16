// jetty.js: the jetty in 3D, Wickhollow's waterfront on the lake west of the square, laid out on its painting
// (reference/art/walk/walk-wickhollow-jetty.png, 1536 x 1024) in the painting's own pixels, as src/game/maps.js keeps the
// walking map. Where Io can walk is that map's own walk and block areas, unchanged (MAPS.jetty), and two pockets past them;
// since Chris's rule (November 16, 11:22: anywhere that looks walkable is walkable), the whole pier to its edges and the
// plank arm round the mooring square too (the arm's east side a little wider, inside the square, to pass its posts).
// The texture ids are the texture pack's (texture-packs/wickhollow/jetty/inventory.md).
// Heights are metres: the waterfront and the quay are 0. The lane comes down from the square (1.5 at the painting's top
// edge); the two lamplit corners beside it stand 0.6 up, held by low walls with a lamp pillar at each inner end. Five steps
// go down from the quay to the pier (-1.0). The lake lies at -1.6.
// The Magpie moors at the pier's end (the walking map's spot, 768,760): it isn't built here, and nothing stands there.
(function (G) {
  'use strict';
  const P = G.W3D_PLACES = G.W3D_PLACES || {};
  const ss = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
  const inPoly = (poly, x, y) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
  // the distance from a point to an open line of points (pixels)
  const lineDist = (pts, x, y) => { let d = 1e9; for (let i = 1; i < pts.length; i++) { const [ax, ay] = pts[i - 1], [bx, by] = pts[i], dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1))); d = Math.min(d, Math.hypot(x - ax - t * dx, y - ay - t * dy)); } return d; };
  const rnd = (seed) => { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1e6) / 1e6; }; };
  // a strip of ground along a line of points, half `w` pixels either side (for the pockets)
  const band = (pts, w) => {
    const L = [], Rr = [];
    pts.forEach(([x, y], i) => {
      const [ax, ay] = pts[Math.max(0, i - 1)], [bx, by] = pts[Math.min(pts.length - 1, i + 1)], dx = bx - ax, dy = by - ay, n = Math.hypot(dx, dy) || 1;
      L.push([Math.round(x - dy / n * w), Math.round(y + dx / n * w)]); Rr.push([Math.round(x + dy / n * w), Math.round(y - dx / n * w)]);
    });
    return L.concat(Rr.reverse());
  };
  const ellipse = (cx, cy, rx, ry, n) => Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2; return [Math.round(cx + Math.cos(a) * rx), Math.round(cy + Math.sin(a) * ry)]; });

  // ---- the lake ----
  // its shore, traced from the painting: from the quay wall's east end east along the reeds and boulders, round the far
  // side (past the painting the lake is a wide bay with low wooded shores), and back along the willows and boulders in
  // the west to the quay wall's west end. The quay's own edge isn't a shore: its wall goes straight down into the water.
  const SHORE = [[1112, 486], [1150, 500], [1227, 508], [1310, 533], [1377, 558], [1452, 592], [1493, 612], [1536, 625], [1700, 642], [1860, 700],
    [1890, 1000], [1870, 1300], [1400, 1330], [800, 1320], [200, 1330], [-330, 1310], [-370, 1000], [-350, 600], [-330, 300], [-200, 286],
    [0, 297], [40, 294], [62, 297], [81, 310], [112, 335], [150, 347], [175, 354], [182, 390], [182, 435], [206, 466], [237, 497], [262, 510],
    [300, 512], [340, 506], [372, 482]];
  // the quay wall's foot, with the notch the steps stand in
  const QUAY = [[376, 412], [692, 412], [692, 452], [844, 452], [844, 412], [1108, 412]];
  const LAKE = QUAY.concat(SHORE);
  const LAKE_BOX = [-370, 286, 1890, 1330];
  const inLake = (x, y) => x > LAKE_BOX[0] && x < LAKE_BOX[2] && y > LAKE_BOX[1] && y < LAKE_BOX[3] && inPoly(LAKE, x, y);
  const WATER = -1.6, DECK = -1.0;
  // the pier, and the plank arm round the mooring square east of it (its north side, its east side, its south side), all at
  // the pier's height: [x0, y0, x1, y1] in pixels
  const PIER = [[650, 446, 884, 802], [882, 480, 1108, 508], [1064, 506, 1108, 772], [882, 768, 1108, 796]];
  const onPier = (x, y) => PIER.some((r) => x >= r[0] && x <= r[2] && y >= r[1] && y <= r[3]);

  // ---- the ground's height under any point of the painting (metres) ----
  const top = (y) => 0.6 + 0.0035 * Math.max(0, 250 - y);              // the lane above the walls, and the corners beside it
  function land(x, y) {
    const t = top(Math.min(y, 250));
    const wLane = ss(630, 650, x) * (1 - ss(874, 894, x));               // the lane, and the beds either side of it below the walls
    const wTer = ss(470, 520, x) * (1 - ss(1006, 1036, x));              // the two corners, up behind their walls
    const lane = t * (1 - ss(250, 336, y)), ter = t * (1 - ss(262, 274, y)), woods = t * (1 - ss(150, 240, y));
    let h = woods + (ter - woods) * wTer;
    h += (lane - h) * wLane;
    if (x > 690 && x < 848 && y > 400 && y < 460) h = -Math.min(1, (y - 400) / 56);      // the steps down to the pier
    // past the painting the lake's shores are low
    const far = Math.max(Math.max(ss(-40, -200, x), ss(1600, 1760, x)) * ss(150, 300, y), ss(1060, 1200, y));
    return h + (-0.9 - h) * far;
  }
  function ground(x, y) {
    if (inLake(x, y)) return -1.9;
    const h = land(x, y), d = lineDist(SHORE, x, y);
    return d < 60 ? -1.4 + (h + 1.4) * ss(0, 55, d) : h;              // the banks come down to the water
  }

  // ---- the pockets past the 2D walk ----
  // under the big west willow: the worn track goes on past its end, behind the hanging strands, round the trunk to a
  // hollow by the reeds (the Jetty Coin lies there)
  const WILLOW_PATH = band([[434, 362], [400, 360], [366, 366], [338, 380], [322, 404], [314, 430], [296, 450], [272, 452]], 14);
  const WILLOW_HOLLOW = ellipse(258, 448, 26, 20, 12);
  // behind Quill's stall: past the net rack at the waterfront's east end, up the side and into the little yard between
  // the stall's back and the wall
  const STALL_PATH = band([[1248, 386], [1290, 382], [1308, 360], [1308, 300], [1298, 266]], 14);
  const STALL_YARD = [[1112, 230], [1250, 230], [1250, 252], [1300, 252], [1300, 276], [1066, 276], [1066, 250], [1112, 250]];

  P.jetty = {
    id: 'jetty', name: 'The jetty', painting: "art/walk/walk-wickhollow-jetty.avif", size: [1536, 1024],
    mapId: 'jetty', paintingPng: 'reference/art/walk/walk-wickhollow-jetty.png',
    // the wall check (tools/walls-test.mjs): from the start, to the way up, the corners, both ends of the waterfront, down
    // the steps to the pier's end and corners, and into both pockets
    checks: { from: [782, 60], goals: [
      ['the lane up to Wickhollow (north edge)', 768, 4], ['the lamplit corner west of the lane', 590, 200], ['the corner east of the lane', 924, 222],
      ['the worn track under the willow (west end of the waterfront)', 432, 362], ['Quill’s stall (east end of the waterfront)', 1250, 388],
      ['the foot of the steps', 768, 470], ['the pier’s end, where the Magpie moors', 768, 760], ['the pier’s south-west corner', 664, 790],
      ['the pier’s south-east corner', 868, 790], ['the hollow under the west willow (a pocket)', 258, 448], ['the yard behind Quill’s stall (a pocket)', 1080, 252],
      // the boards opened on November 16 (anywhere that looks walkable is walkable): the pier's east edge, and the plank
      // arm round the mooring square to each of its corners
      ['the pier’s east edge', 876, 640], ['the plank arm’s north-east corner', 1078, 494], ['halfway down the arm’s east side', 1076, 640],
      ['the plank arm’s south-east corner', 1078, 782], ['along the arm’s south side', 940, 782]] },
    // the trees from the painting (tools/make-trees.mjs): not where the willows are (they're built here), not on the reedy
    // banks, not on the lane up to the square
    treeGen: { dark: 0.6, keepOut: [[30, 180, 440, 560], [1090, 380, 1640, 720], [1320, 170, 1640, 470]], roads: [[706, -800, 830, 0]] },
    // the ground's textures, and how many metres each repeats over (the stones here are a bit larger than the square's)
    ground: { cob: 'shared_cobbles_town', grass: 'shared_grass_meadow', dirt: 'shared_dirt_track', pave: 'shared_cobbles_town', rep: [3.8, 4.0, 4.0, 3.8] },
    // which texture each kind of surface uses: the quay's walls are rounded field stones, the pillars and steps dressed
    // stone, the pier and the posts planks
    surfaces: { stone: 'shared_stone_wall_rough', dry: 'shared_drystone', timber: 'shared_boardwalk_planks', planks: 'shared_boardwalk_planks', roof: 'shared_boardwalk_planks',
      wood: 'shared_boardwalk_planks', deck: 'shared_boardwalk_planks', pave: 'shared_cobbles_town', cloth: 'shared_awning_stripes', soil: 'shared_dirt_track',
      rock: 'thorn_rock_mossy', leaves: 'wick_leaf_canopy', bark: 'shared_bark_oak' },
    // each texture: Chris's made one if the page carries it (texture-packs/made/), else the pack's stand-in. Written out in
    // full, so the offline build finds the pictures and puts them inside the file.
    textures: [
      { id: 'shared_boardwalk_planks', made: "./../texture-packs/made/shared_boardwalk_planks.png", stand: "./../texture-packs/wickhollow/jetty/stand-in/shared_boardwalk_planks.png" },
      { id: 'shared_water_dark', made: "./../texture-packs/made/shared_water_dark.png", stand: "./../texture-packs/wickhollow/jetty/stand-in/shared_water_dark.png" },
      { id: 'shared_drystone', made: "./../texture-packs/made/shared_drystone.png", stand: "./../texture-packs/wickhollow/jetty/stand-in/shared_drystone.png" },
      { id: 'shared_awning_stripes', made: "./../texture-packs/made/shared_awning_stripes.png", stand: "./../texture-packs/wickhollow/jetty/stand-in/shared_awning_stripes.png" },
      { id: 'shared_cobbles_town', made: "./../texture-packs/made/shared_cobbles_town.png", stand: "./../texture-packs/wickhollow/wickhollow/stand-in/shared_cobbles_town.png" },
      { id: 'shared_grass_meadow', made: "./../texture-packs/made/shared_grass_meadow.png", stand: "./../texture-packs/wickhollow/wickhollow/stand-in/shared_grass_meadow.png" },
      { id: 'shared_stone_wall_rough', made: "./../texture-packs/made/shared_stone_wall_rough.png", stand: "./../texture-packs/wickhollow/wickhollow/stand-in/shared_stone_wall_rough.png" },
      { id: 'shared_dirt_track', made: "./../texture-packs/made/shared_dirt_track.png", stand: "./../texture-packs/wickhollow/thornwood/stand-in/shared_dirt_track.png" },
      { id: 'thorn_rock_mossy', made: "./../texture-packs/made/thorn_rock_mossy.png", stand: "./../texture-packs/wickhollow/thornwood/stand-in/thorn_rock_mossy.png" },
      { id: 'wick_leaf_canopy', made: "./../texture-packs/made/wick_leaf_canopy.png", stand: "./../texture-packs/wickhollow/cottage/stand-in/wick_leaf_canopy.png" },
      { id: 'shared_bark_oak', made: "./../texture-packs/made/shared_bark_oak.png", stand: "./../texture-packs/wickhollow/cottage/stand-in/shared_bark_oak.png" },
    ],
    ground_h: ground,
    // where Io's feet stand: the ground, or the pier's deck (the arm round the mooring square too)
    walk_h(x, y) { return onPier(x, y) ? DECK : ground(x, y); },
    water: [{ poly: LAKE, level: () => WATER, tex: 'shared_water_dark', rep: 6, flow: [0.004, 0.002], bed: -2.8 }],
    lawns: [],
    start: [782, 60], startFace: 0,
    // the way out (the walking map's exit), and what is past it
    exits: [{ rect: [706, 0, 830, 20], label: 'Wickhollow' }],
    // the pockets; and the pier to its edges, the plank arm round the mooring square (over the lake: 'grass' leaves the
    // ground's own map as it is)
    walkAdd: [{ poly: WILLOW_PATH, ground: 'dirt' }, { poly: WILLOW_HOLLOW, ground: 'dirt' }, { poly: STALL_PATH, ground: 'dirt' }, { poly: STALL_YARD, ground: 'dirt' },
      { poly: [[658, 449], [879, 449], [879, 797], [658, 797]], ground: 'grass' },
      { poly: [[879, 485], [1103, 485], [1103, 791], [879, 791], [879, 773], [1068, 773], [1068, 503], [879, 503]], ground: 'grass' }],
    // where the 3D hides the keepsakes: the Jetty Coin ("at the far end of the lakeshore walk, under the willows") lies in
    // the hollow under the west willow, at the end of the hidden path round its trunk
    items: { 'jetty-coin': [258, 448] },

    buildings: [],
    // ---- walls: each a line of points, a height, a thickness and a texture; `drop` takes it down into the lake ----
    walls: [
      // the quay wall along the waterfront's south edge, either side of the steps
      { pts: [[378, 410], [646, 410]], h: 0.45, t: 0.55, tex: 'dry', drop: true },
      { pts: [[882, 410], [1108, 410]], h: 0.45, t: 0.55, tex: 'dry', drop: true },
      // the low walls holding up the two lamplit corners, each to its lamp pillar by the lane
      { pts: [[524, 232], [524, 259], [609, 259]], h: 0.4, t: 0.55, tex: 'dry', drop: true },
      { pts: [[904, 259], [1004, 259], [1004, 234]], h: 0.4, t: 0.55, tex: 'dry', drop: true },
      // the short rail fence east of the east corner
      { pts: [[942, 230], [1036, 230]], h: 0, t: 0.15, tex: 'dry', top: 'fence', topH: 1.15 },
      // the wall behind Quill's stall, between its two stone pillars and on east
      { pts: [[1062, 212], [1227, 212]], h: 1.1, t: 0.5, tex: 'dry' },
      { pts: [[1251, 212], [1320, 212]], h: 1.1, t: 0.5, tex: 'dry' },
    ],
    // the steps down from the quay to the pier, between their stone cheeks (built in extra)
    steps: [{ r: [700, 404, 836, 452], down: 's', n: 5 }],
    // the jetty's lamps (JETTY_LAMPS in maps.js): the two at the head of the steps, on stone blocks, and the four on the pier.
    // The lane's pillars and the corners' pillars are built in extra, larger than the engine's.
    lamps: [
      { at: [678, 395], kind: 'post', short: true, y: 0.22 }, { at: [858, 395], kind: 'post', short: true, y: 0.22 },
      { at: [672, 571], kind: 'post' }, { at: [858, 571], kind: 'post' }, { at: [672, 765], kind: 'post' }, { at: [857, 765], kind: 'post' },
    ],
    // two strips hidden inside the quay wall: the engine lays boulders along a lake's edge but not along a jetty, and the
    // quay wall goes straight down into the water with none at its foot
    jetties: [{ r: [372, 405, 646, 415], y: -0.1 }, { r: [882, 405, 1112, 415], y: -0.1 }],
    // small things: barrels at the pier's head and by the stall, crates, the bench under the east wall, the stone posts in
    // the quay wall and in the wall behind the stall (the boulders along the shores are built in extra)
    props: [
      { k: 'barrel', at: [683, 472], y: DECK }, { k: 'barrel', at: [852, 466], y: DECK },
      { k: 'barrel', at: [1010, 328] }, { k: 'barrel', at: [1024, 310] },
      { k: 'crates', at: [1050, 333] }, { k: 'crates', at: [1244, 352] },
      { k: 'bench', at: [946, 314], face: 0 },
      { k: 'post', at: [456, 410], h: 0.85 }, { k: 'post', at: [540, 410], h: 0.85 }, { k: 'post', at: [963, 410], h: 0.85 }, { k: 'post', at: [1053, 410], h: 0.85 },
      { k: 'post', at: [1050, 212], h: 1.7 }, { k: 'post', at: [1239, 212], h: 1.7 },
    ],
    // flower beds and flowering shrubs: [x, y, radius in metres, colours]
    flowers: [
      [668, 298, 0.9, 'white'], [688, 326, 0.5, 'mix'], [856, 298, 0.6, 'mix'],                                            // the beds beside the lane below the walls
      [520, 300, 0.8, 'white'], [575, 312, 0.7, 'white'], [490, 284, 0.8, 'mix'], [610, 300, 0.5, 'violet'],                // under the west wall
      [540, 200, 1.1, 'violet'], [520, 160, 1.0, 'white'], [548, 236, 0.7, 'mix'], [600, 122, 1.0, 'white'], [650, 112, 0.8, 'mix'],   // round the west corner
      [960, 178, 1.0, 'violet'], [905, 172, 0.9, 'mix'], [1000, 300, 0.6, 'white'],                                        // round the east corner
      [470, 393, 0.45, 'mix'], [520, 395, 0.45, 'white'], [565, 396, 0.4, 'violet'],                                         // along the quay wall's top
      [428, 332, 0.9, 'white'], [412, 388, 0.8, 'violet'],                                                                  // at the track's end, hiding the way on
      [1340, 300, 1.0, 'violet'], [1350, 368, 0.9, 'white'], [1150, 450, 0.8, 'mix'], [1200, 455, 0.7, 'white'],            // by the stall and on the east bank
      [350, 340, 0.8, 'mix'], [470, 304, 0.7, 'white'],
    ],
    // the lights for the light map (the lamps' own are added from `lamps`, the pillars' and the stall's in extra): a little
    // moonlight in the hollow under the willow (the moon's glitter on the lake is the water's own)
    lights: [[258, 448, 70, 0.25, 'moon']],
    trees: 'jetty',
    // the painting's own trees close to the lane's top (make-trees.mjs keeps its trees 30 px off the walk)
    extraTrees: [[668, 22, 1.05, 0, 31], [870, 20, 1.0, 0, 32]],

    // ---- what the engine has no field for: the pier and the mooring square, the posts and their rope, the steps' cheeks,
    // the lamp pillars, Quill's stall and net rack, the willows, reeds, lily pads, the track's earth, and the pockets' things
    extra(K) {
      const { B, X, Z, gh, TAU } = K;
      const r = rnd(5);
      const ROPE = [1.3, 1.1, 0.78], POST = [0.78, 0.62, 0.52];
      const block = (x0, y0, x1, y1) => K.addBlock([[x0, y0], [x1, y0], [x1, y1], [x0, y1]]);
      // a coil of rope lying flat at (x, y, z)
      const coil = (x, y, z, rr) => {
        [1, 0.72, 0.45].forEach((k, i) => { const g = new THREE.TorusGeometry(rr * k, 0.045, 4, 12); g.rotateX(Math.PI / 2); B.geom('wood', g, new THREE.Matrix4().makeTranslation(x, y + 0.045 + i * 0.07, z), ROPE, [1, 0.3]); g.dispose(); });
      };
      // a round post standing in the lake from its bed to `t` (metres), rope bound round it, a coil on top if `c`
      const post = (px, py, t, rr, c) => {
        const x = X(px), z = Z(py);
        B.cyl('wood', x, -2.9, z, rr, rr * 0.93, t + 2.9, 8, POST, [TAU * rr, 0.35]);
        B.cyl('wood', x, t, z, rr * 0.93, rr * 0.78, 0.05, 8, [0.6, 0.48, 0.42], [TAU * rr, 0.1]);
        for (const hy of [t - 0.42, t - 0.6]) B.cyl('wood', x, hy, z, rr + 0.035, rr + 0.035, 0.1, 8, ROPE, [TAU * rr, 0.1], true);
        if (c) coil(x, t + 0.04, z, rr * 0.95);
        K.addBlock(K.circlePx(px, py, rr + 0.04, 8));
      };
      // a plank deck at the pier's height over [x0, y0, x1, y1], with beams under its long edges and piles every 2.4 m
      const deck = (x0, y0, x1, y1, alongX) => {
        const a = X(x0), b = X(x1), c = Z(y0), d = Z(y1);
        B.box('deck', (a + b) / 2, DECK - 0.2, (c + d) / 2, b - a, 0.2, d - c, 0, [0.95, 0.92, 0.94]);
        if (alongX) { for (const zz of [c + 0.1, d - 0.1]) B.box('wood', (a + b) / 2, DECK - 0.48, zz, b - a, 0.28, 0.2, 0, [0.6, 0.5, 0.45]); }
        else { for (const xx of [a + 0.12, b - 0.12]) B.box('wood', xx, DECK - 0.48, (c + d) / 2, 0.22, 0.28, d - c, 0, [0.6, 0.5, 0.45]); }
        const piles = b - a < 3 ? [[(a + b) / 2]] : [[a + 0.3], [(a + b) / 2], [b - 0.3]];
        if (alongX) for (let x = a + 1.2; x < b - 0.6; x += 2.4) B.cyl('wood', x, -2.9, (c + d) / 2, 0.15, 0.14, 2.9 + DECK - 0.45, 6, POST, [1, 0.35]);
        else for (const [xx] of piles) for (let z = c + 0.8; z < d - 0.4; z += 2.4) B.cyl('wood', xx, -2.9, z, 0.15, 0.14, 2.9 + DECK - 0.45, 6, POST, [1, 0.35]);
        K.shadeMarks.push(['rect', x0, y0, x1, y1, 0.8]);
      };

      // ---- the pier, and the narrow plank arm round the mooring square east of it (walkable since November 16: its east
      // side 0.4 m wider inside the square, so there's room to walk past its posts) ----
      deck(655, 446, 882, 800, false);
      deck(882, 482, 1106, 506, true); deck(1066, 506, 1106, 770, false); deck(882, 770, 1106, 794, true);
      // the posts: at the pier's corners and along its west edge, the two bollards at its end either side of where the
      // Magpie moors, the three standing alone in the water west of it, and the mooring square's
      for (const [px, py, t, rr, c] of [
        [648, 486, -0.05, 0.24, 1], [646, 556, -0.35, 0.2, 1], [646, 684, -0.35, 0.2, 1], [648, 806, 0.1, 0.3, 1], [878, 466, -0.2, 0.22, 1], [886, 806, 0.1, 0.3, 1],
        [727, 806, -0.4, 0.22, 0], [815, 806, -0.4, 0.22, 0],
        [580, 522, 0.25, 0.27, 0], [580, 642, 0.25, 0.27, 0], [577, 772, 0.25, 0.27, 0],
        [960, 526, 0.15, 0.26, 0], [1092, 478, -0.05, 0.24, 1], [1092, 548, -0.4, 0.2, 0], [1092, 596, -0.4, 0.2, 0], [1092, 646, -0.3, 0.22, 0],
        [1092, 738, -0.3, 0.22, 0], [1092, 806, 0.1, 0.28, 1], [990, 808, -0.1, 0.26, 0]]) post(px, py, t, rr, c);
      // a coil of rope lying on the pier's east edge
      coil(X(878), DECK, Z(606), 0.16);

      // ---- the steps' stone cheeks, from the lake's bed to just over the quay, each with a cap; the lamps' stone blocks ----
      for (const [x0, x1] of [[646, 698], [840, 882]]) {
        const a = X(x0), b = X(x1), c = Z(406), d = Z(446);
        B.box('stone', (a + b) / 2, -2.9, (c + d) / 2, b - a, 2.9 + 0.45, d - c, 0, [0.92, 0.9, 0.95]);
        B.box('stone', (a + b) / 2, 0.45, (c + d) / 2, b - a + 0.1, 0.12, d - c + 0.1, 0, [0.8, 0.78, 0.84]);
        // the dark plaque on the face toward the pier
        B.quad('stone', [(a + b) / 2 - 0.4, -0.75, d + 0.01], [(a + b) / 2 + 0.4, -0.75, d + 0.01], [(a + b) / 2 + 0.4, -0.15, d + 0.01], [(a + b) / 2 - 0.4, -0.15, d + 0.01], [0, 0, 0.8, 0.6], [0.45, 0.42, 0.48]);
        block(x0, 406, x1, 446);
      }
      for (const px of [678, 858]) B.box('stone', X(px), 0, Z(395), 0.52, 0.22, 0.44, 0, [0.9, 0.88, 0.94]);
      // the quay wall's two ends, turned down into the lake
      B.box('dry', X(376), -2.9, Z(447), 0.45, 3.35, 3.7, 0); block(370, 410, 382, 484);
      B.box('dry', X(1108), -2.9, Z(449), 0.45, 3.35, 3.9, 0); block(1102, 410, 1114, 488);

      // ---- the lamp pillars: the two where the lane comes between the corners, and one at each corner's wall, by the lane ----
      const pillar = (px, py, y0, y1, size) => {
        const x = X(px), z = Z(py);
        B.box('stone', x, y0, z, 1.1, y1 - y0, 1.0, 0, [0.95, 0.93, 0.98]);
        B.box('stone', x, y1, z, 1.22, 0.16, 1.14, 0, [0.8, 0.78, 0.84]);
        B.box('stone', x, y1 + 0.16, z, 0.6, 0.1, 0.55, 0, [0.8, 0.78, 0.84]);
        K.lantern(x, y1 + 0.3, z, null, size);
        K.light(px, py + 8, 160, 1.2, 'warm');
        block(px - 14, py - 10, px + 14, py + 10);
      };
      pillar(690, 178, gh(690, 178) - 0.3, gh(690, 178) + 2.0, 1.25);
      pillar(840, 179, gh(840, 179) - 0.3, gh(840, 179) + 2.0, 1.25);
      pillar(623, 259, -0.4, 1.9, 1.2);
      pillar(890, 258, -0.4, 1.9, 1.2);

      // ---- Quill's stall: four posts, a red-and-cream awning sloping to the front with its hanging edge, a table with a
      // lantern and jars, a big jar, a crate of bottles, a chest; the net rack beside it, and a bucket ----
      {
        const xa = X(1034), xb = X(1200), W = xb - xa, front = Z(344), back = Z(280), hi = 3.0, lo = 2.35;
        for (const [px, py, h] of [[1036, 333, lo], [1198, 336, lo], [1040, 288, hi], [1194, 290, hi]]) B.box('wood', X(px), 0, Z(py), 0.14, h, 0.14, 0, [0.7, 0.55, 0.45]);
        B.box('wood', (xa + xb) / 2, lo - 0.1, Z(335), W, 0.12, 0.12, 0, [0.65, 0.5, 0.42]);
        const A1 = [xa - 0.15, lo, front], A2 = [xb + 0.15, lo, front], A3 = [xb + 0.15, hi, back], A4 = [xa - 0.15, hi, back];
        B.quad('cloth', A1, A2, A3, A4, [0, 0, 2.5, 1]);
        B.quad('cloth', [A1[0], lo - 0.34, front], [A2[0], lo - 0.34, front], A2, A1, [0, 0, 2.5, 0.22]);
        B.quad('cloth', [A2[0], lo - 0.3, front], [A2[0], hi - 0.3, back], A3, A2, [0, 0, 0.3, 0.2]);
        B.quad('cloth', [A1[0], hi - 0.3, back], [A1[0], lo - 0.3, front], A1, A4, [0, 0, 0.3, 0.2]);
        // the table, its lantern and the jars on it
        const tx = X(1089), tz = Z(310);
        B.box('wood', tx, 0.84, tz, 3.0, 0.08, 1.0, 0, [0.85, 0.66, 0.52]);
        for (const [dx, dz] of [[-1.4, -0.42], [1.4, -0.42], [-1.4, 0.42], [1.4, 0.42]]) B.box('wood', tx + dx, 0, tz + dz, 0.09, 0.84, 0.09, 0, [0.6, 0.48, 0.42]);
        B.box('wood', tx, 0.25, tz, 2.8, 0.05, 0.85, 0, [0.6, 0.48, 0.42]);
        K.lantern(X(1074), 1.0, Z(307), null, 0.72); K.light(1076, 322, 120, 0.85, 'warm');
        for (const [px, py, rr, h] of [[1100, 304, 0.11, 0.26], [1111, 310, 0.09, 0.2], [1120, 302, 0.12, 0.3], [1058, 312, 0.1, 0.22], [1092, 314, 0.08, 0.16]]) B.cyl('stone', X(px), 0.92, Z(py), rr, rr * 0.75, h, 8, [1.15, 0.98, 0.82]);
        // the big jar by the back post
        B.cyl('stone', X(1150), 0, Z(298), 0.26, 0.36, 0.45, 10, [1.15, 0.9, 0.66]); B.cyl('stone', X(1150), 0.45, Z(298), 0.36, 0.17, 0.4, 10, [1.15, 0.9, 0.66]); B.cyl('stone', X(1150), 0.85, Z(298), 0.15, 0.17, 0.12, 10, [1.0, 0.8, 0.6]);
        // the crate of bottles in front, and the chest
        B.box('wood', X(1084), 0, Z(343), 0.95, 0.42, 0.55, 0.05, [0.85, 0.68, 0.52]);
        for (let i = 0; i < 6; i++) B.cyl('iron', X(1084) - 0.32 + (i % 3) * 0.32, 0.42, Z(343) - 0.12 + Math.floor(i / 3) * 0.24, 0.05, 0.03, 0.26, 6);
        B.box('wood', X(1170), 0, Z(352), 0.6, 0.5, 0.48, 0.1, [0.8, 0.62, 0.48]); B.box('iron', X(1170), 0.38, Z(352), 0.63, 0.05, 0.5, 0.1);
        K.shadeMarks.push(['poly', [[1030, 282], [1204, 282], [1204, 342], [1030, 342]], 0.66]);
        K.addBlock([[1030, 282], [1204, 282], [1204, 338], [1030, 338]]);
        block(1077, 337, 1091, 349); block(1162, 346, 1178, 358);
        // the net rack: two posts and a bar, two nets of rope hanging from it in a V
        for (const px of [1218, 1288]) { B.box('wood', X(px), 0, Z(326), 0.14, 2.6, 0.14, 0, [0.7, 0.55, 0.45]); block(px - 3, 323, px + 3, 329); }
        B.box('wood', X(1253), 2.42, Z(326), X(1294) - X(1212), 0.12, 0.12, 0, [0.65, 0.5, 0.42]);
        for (const [n0, n1] of [[1224, 1252], [1258, 1284]]) {
          const a = X(n0), b = X(n1), z = Z(326) + 0.08, N = 6;
          const bottom = (u) => 2.4 - (0.9 + 0.55 * Math.sin(Math.PI * u));
          for (let i = 0; i <= N; i++) { const u = i / N, x = a + (b - a) * u, y0 = bottom(u); B.box('wood', x, y0, z, 0.025, 2.4 - y0, 0.025, 0, ROPE); }
          for (let k = 1; k <= 4; k++) { const y = 2.4 - k * 0.3; let u0 = 1, u1 = 0; for (let i = 0; i <= 20; i++) { const u = i / 20; if (bottom(u) < y) { u0 = Math.min(u0, u); u1 = Math.max(u1, u); } } if (u1 > u0) B.box('wood', a + (b - a) * (u0 + u1) / 2, y, z, (b - a) * (u1 - u0), 0.025, 0.025, 0, ROPE); }
        }
        B.cyl('wood', X(1272), 0, Z(362), 0.24, 0.27, 0.42, 10, [0.75, 0.6, 0.48]); B.cyl('iron', X(1272), 0.3, Z(362), 0.275, 0.275, 0.05, 10, null, null, true);
        block(1265, 356, 1279, 368);
      }

      // ---- the pocket behind the stall: an old anchor against the wall, a coil of rope, crates, a small lantern ----
      {
        const ax = X(1150), az = Z(222), lean = new THREE.Matrix4().makeRotationX(-0.22), at = new THREE.Matrix4().makeTranslation(ax, 0, az);
        const part = (w, h, d, x, y, rz) => { const g = new THREE.BoxGeometry(w, h, d); g.rotateZ(rz || 0); g.translate(x, y, 0); B.geom('iron', g, at.clone().multiply(lean), null, [w + d, h]); g.dispose(); };
        part(0.1, 1.45, 0.1, 0, 0.9); part(0.95, 0.07, 0.07, 0, 1.38);
        const arms = new THREE.TorusGeometry(0.5, 0.055, 5, 12, Math.PI); arms.rotateZ(Math.PI); B.geom('iron', arms, at.clone().multiply(lean).multiply(new THREE.Matrix4().makeTranslation(0, 0.62, 0)), null, 1); arms.dispose();
        part(0.2, 0.26, 0.05, -0.47, 0.72, -0.5); part(0.2, 0.26, 0.05, 0.47, 0.72, 0.5);
        const ring = new THREE.TorusGeometry(0.13, 0.028, 4, 10); B.geom('iron', ring, at.clone().multiply(lean).multiply(new THREE.Matrix4().makeTranslation(0, 1.72, 0)), null, 1); ring.dispose();
        block(1140, 216, 1160, 228);
        coil(X(1098), gh(1098, 238), Z(238), 0.34); block(1088, 231, 1108, 245);
        B.box('wood', X(1270), 0, Z(240), 0.8, 0.6, 0.6, 0.15, [0.82, 0.66, 0.52]); B.box('wood', X(1268), 0.6, Z(240), 0.6, 0.45, 0.5, -0.1, [0.78, 0.62, 0.5]);
        block(1258, 232, 1282, 248);
        K.lantern(X(1200), 0.95, Z(220), [0, 0, 1], 0.6); K.light(1200, 240, 70, 0.55, 'warm');
      }

      // ---- the big grey boulders along the shores (the bank's own small ones are the engine's) ----
      for (const [px, py, sz] of [[25, 205, 1.5], [62, 226, 1.3], [98, 262, 1.5], [130, 300, 1.2], [156, 328, 1.0], [194, 396, 1.3], [200, 436, 1.3], [214, 486, 1.1],
        [292, 500, 0.9], [8, 262, 1.1], [1262, 452, 1.5], [1300, 488, 1.3], [1342, 440, 1.6], [1370, 506, 1.4], [1410, 424, 1.4], [1432, 500, 1.3], [1234, 492, 1.0]]) {
        const y = Math.max(K.terrain(px, py), WATER - 0.35), k = 0.82 + r() * 0.14;
        B.geom('rock', K.rockG[Math.floor(r() * 3)], new THREE.Matrix4().compose(new THREE.Vector3(X(px), y - sz * 0.2, Z(py)), new THREE.Quaternion().setFromEuler(new THREE.Euler((r() - 0.5) * 0.3, r() * TAU, (r() - 0.5) * 0.3)), new THREE.Vector3(sz, sz * 1.25, sz)), [k, k, k * 1.08], 3.2);
        K.addBlock(K.circlePx(px, py, sz * 0.8, 8));
        K.shadeMarks.push(['dot', px, py, sz / 0.04 * 0.9, 0.6]);
      }

      // ---- the weeping willows: a trunk and boughs, a dome of leaves, and a curtain of hanging strands round it ----
      const willow = (px, py, H, Rr, n, seed) => {
        const q = rnd(seed), x = X(px), z = Z(py), y = gh(px, py), col = [1.05, 0.95, 0.95];
        B.cyl('soil', x, y - 0.3, z, 0.42, 0.3, H * 0.55 + 0.3, 7, col, [3, 0.6]);
        for (let i = 0; i < 3; i++) {
          const a = q() * TAU, d = new THREE.Vector3(Math.cos(a), 1.1, Math.sin(a)).normalize(), g = new THREE.CylinderGeometry(0.1, 0.22, Rr * 0.75, 5, 1, true);
          g.translate(0, Rr * 0.375, 0); B.geom('soil', g, new THREE.Matrix4().compose(new THREE.Vector3(x, y + H * 0.5, z), new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d), new THREE.Vector3(1, 1, 1)), col, [2, 0.5]); g.dispose();
        }
        // the crown: a clump in the middle and a ring of smaller ones round it, the strands hanging from their edge
        const clump = (cx, cy, cz, sx, sy, k, i) => B.geom('leafBush', K.ico[(seed + i) % 3], new THREE.Matrix4().compose(new THREE.Vector3(cx, cy, cz), new THREE.Quaternion().setFromEuler(new THREE.Euler(q() * 0.4, q() * TAU, 0)), new THREE.Vector3(sx, sy, sx)), [0.74 * k, 0.94 * k, 0.6 * k], 2.4);
        clump(x, y + H - Rr * 0.3, z, Rr * 0.55, Rr * 0.42, 1, 0);
        for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + q() * 0.5, d = Rr * (0.5 + q() * 0.12); clump(x + Math.cos(a) * d, y + H - Rr * (0.5 + q() * 0.15), z + Math.sin(a) * d, Rr * (0.4 + q() * 0.1), Rr * 0.3, 0.9 + q() * 0.2, i + 1); }
        for (let i = 0; i < n; i++) {
          const a = (i + q() * 0.6) / n * TAU, rr = Rr * (0.82 + q() * 0.2), w = 0.8 + q() * 0.5;
          const tY = y + H - Rr * 0.5 - q() * 0.4, bY = y + 0.45 + q() * 1.7, t = [Math.sin(a), 0, -Math.cos(a)];
          const ct = [x + Math.cos(a) * rr, tY, z + Math.sin(a) * rr], cb = [x + Math.cos(a) * (rr + 0.35), bY, z + Math.sin(a) * (rr + 0.35)];
          const k = 0.85 + q() * 0.3, c = [0.8 * k, 1.02 * k, 0.6 * k];
          const L0 = [cb[0] - t[0] * w / 2, bY, cb[2] - t[2] * w / 2], R0 = [cb[0] + t[0] * w / 2, bY, cb[2] + t[2] * w / 2];
          B.quad('leafBush', L0, R0, [ct[0] + t[0] * w / 2, tY, ct[2] + t[2] * w / 2], [ct[0] - t[0] * w / 2, tY, ct[2] - t[2] * w / 2], [0, bY, w, tY], c);
          // the hem: two points hanging lower, so the curtain's edge is ragged
          const tip = (u, len) => [cb[0] + t[0] * w * u + Math.cos(a) * 0.08, bY - len, cb[2] + t[2] * w * u + Math.sin(a) * 0.08];
          const M0 = [cb[0], bY, cb[2]], l1 = 0.3 + q() * 0.6, l2 = 0.2 + q() * 0.5;
          B.tri('leafBush', M0, L0, tip(-0.25, Math.min(l1, bY - y - 0.15)), [[w / 2, bY], [0, bY], [w / 4, bY - l1]], c);
          B.tri('leafBush', R0, M0, tip(0.25, Math.min(l2, bY - y - 0.15)), [[w, bY], [w / 2, bY], [w * 0.75, bY - l2]], c);
        }
        K.addBlock(K.circlePx(px, py, 0.42, 8));
        K.shadeMarks.push(['dot', px, py, Rr / 0.04 * 0.9, 0.55]);
      };
      willow(150, 252, 7.0, 3.3, 28, 41);
      willow(285, 402, 8.5, 4.5, 40, 42);
      willow(1480, 430, 8.0, 4.0, 36, 43);

      // ---- reeds and cattails at the water's edge ----
      const reeds = (px, py, n, seed) => {
        const q = rnd(seed), x0 = X(px), z0 = Z(py), y0 = Math.max(K.terrain(px, py), -1.75);
        for (let i = 0; i < n; i++) {
          const a = q() * TAU, d = q() * 0.55, bx = x0 + Math.cos(a) * d, bz = z0 + Math.sin(a) * d, h = 0.8 + q() * 0.9, lx = (q() - 0.5) * 0.4, lz = (q() - 0.5) * 0.4;
          const w = 0.035 + q() * 0.03, ra = q() * Math.PI, ox = Math.cos(ra) * w, oz = Math.sin(ra) * w, c = [0.55 + q() * 0.2, 0.72 + q() * 0.15, 0.38];
          const A = [bx - ox, y0, bz - oz], Bv = [bx + ox, y0, bz + oz], T = [bx + lx, y0 + h, bz + lz];
          B.tri('leafBush', A, Bv, T, [[0, 0], [0.1, 0], [0.05, 1]], c); B.tri('leafBush', Bv, A, T, [[0, 0], [0.1, 0], [0.05, 1]], c);
          if (q() < 0.3) B.box('wood', bx + lx * 0.82, y0 + h * 0.74, bz + lz * 0.82, 0.07, 0.24, 0.07, 0, [0.55, 0.36, 0.28]);
        }
      };
      [[20, 292], [44, 298], [150, 348], [172, 362], [186, 418], [196, 456], [268, 508], [300, 510], [332, 502], [356, 488],
        [1126, 492], [1158, 500], [1190, 504], [1252, 512], [1330, 540], [1398, 566], [1440, 588], [1480, 606], [1514, 620]].forEach(([px, py], i) => reeds(px, py, 12, 60 + i));

      // ---- lily pads on the still water near the shores, a few with a white flower ----
      const pads = [[86, 380], [118, 398], [98, 432], [140, 446], [162, 472], [70, 470], [124, 520], [240, 530], [270, 544], [310, 532], [206, 520],
        [400, 436], [436, 452], [478, 440], [520, 458], [560, 444], [604, 452], [450, 486], [530, 492],
        [1150, 522], [1186, 532], [1220, 528], [1258, 548], [1300, 562], [1350, 578], [1420, 640], [1462, 660], [1500, 690], [1404, 700], [1440, 730], [1520, 760], [1490, 640]];
      for (const [px, py] of pads) {
        const rr = 0.25 + r() * 0.2, g = new THREE.CircleGeometry(rr, 9, 0.3, TAU - 0.6); g.rotateX(-Math.PI / 2);
        const x = X(px) + (r() - 0.5) * 0.4, z = Z(py) + (r() - 0.5) * 0.4;
        B.geom('leafBush', g, new THREE.Matrix4().compose(new THREE.Vector3(x, WATER + 0.02, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, r() * TAU, 0)), new THREE.Vector3(1, 1, 1)), [0.42, 0.7, 0.48], 1); g.dispose();
        if (r() < 0.25) for (const ra of [0, 1.57]) B.quad('fl_white', [x - Math.cos(ra) * 0.14, WATER + 0.02, z - Math.sin(ra) * 0.14], [x + Math.cos(ra) * 0.14, WATER + 0.02, z + Math.sin(ra) * 0.14], [x + Math.cos(ra) * 0.14, WATER + 0.24, z + Math.sin(ra) * 0.14], [x - Math.cos(ra) * 0.14, WATER + 0.24, z - Math.sin(ra) * 0.14], [0, 0, 1, 1]);
      }

      // ---- the worn earth track along the waterfront under the willow (the walk there is cobbled by the ground's own map) ----
      {
        // its outline: along the track's north and south edges with a soft wave, frayed at the east end where the cobbles start
        const out = [], cxy = [505, 362], wave = (t, a) => a * (Math.sin(t * 0.21) * 0.6 + Math.sin(t * 0.53 + 1.3) * 0.4);
        for (let x = 414; x <= 566; x += 8) out.push([x, 339 + wave(x, 3)]);
        for (let a = -1.3; a <= 1.3; a += 0.26) out.push([566 + Math.cos(a) * (22 + wave(a * 40, 9)), 362 + Math.sin(a) * 22]);
        for (let x = 566; x >= 414; x -= 8) out.push([x, 385 + wave(x + 50, 3)]);
        out.push([408, 362]);
        for (let i = 0; i < out.length; i++) {
          const a = out[i], b = out[(i + 1) % out.length], P3 = ([px, py]) => [X(px), gh(px, py) + 0.025, Z(py)];
          B.tri('soil', P3(cxy), P3(b), P3(a), [[X(cxy[0]), Z(cxy[1])], [X(b[0]), Z(b[1])], [X(a[0]), Z(a[1])]], [1.5, 1.46, 1.52]);
        }
      }
    },
  };
})(window);
