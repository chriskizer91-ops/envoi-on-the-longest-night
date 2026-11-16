// cottage.js: Io's cottage in 3D, laid out on its painting (reference/art/walk/walk-wickhollow-cottage.png, 1536 x 1024) in
// the painting's own pixels, as src/game/maps.js keeps the walking map. Where Io can walk is that map's own walk and block
// areas, unchanged (MAPS.cottage), and two pockets past them (walkAdd); everything here stands round them.
// The texture ids are the texture pack's (texture-packs/wickhollow/cottage/inventory.md).
// Heights are metres: the yard and the garden are 0; the lane rises toward the square (0.8 at the top edge); the west path
// goes down to the head of the stairs (-0.3) and the stairs to the lower ground (-1.8), where the curving path runs; the
// south road falls from the garden gate to the same level; the pond lies at -0.5 and the stream falls four times on its
// way down the west side, from the pond's lip to the pool at the bottom.
(function (G) {
  'use strict';
  const P = G.W3D_PLACES = G.W3D_PLACES || {};
  const ss = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
  const inPoly = (poly, x, y) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
  const edgeDist = (poly, x, y) => { let d = 1e9; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [ax, ay] = poly[j], [bx, by] = poly[i], dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1))); d = Math.min(d, Math.hypot(x - ax - t * dx, y - ay - t * dy)); } return d; };

  // the lily pond north-west, and the stream that falls from its lip, under the footbridge and down the west side to the
  // pool at the bottom (traced from the painting; both run on past its edges)
  const POND = [[-200, 172], [40, 184], [100, 200], [150, 205], [205, 202], [240, 222], [272, 252], [300, 266], [306, 300], [296, 330], [268, 350], [218, 360],
    [172, 364], [150, 372], [112, 372], [92, 356], [70, 320], [50, 290], [20, 262], [-200, 262]];
  const STREAM = [[96, 360], [168, 360], [176, 384], [186, 402], [186, 446], [178, 470], [174, 505], [180, 540], [162, 580], [154, 620], [162, 660], [196, 700],
    [232, 740], [240, 800], [236, 860], [262, 900], [276, 960], [272, 1030], [272, 1300], [-200, 1300], [-200, 930], [30, 935], [95, 905], [140, 880], [150, 830],
    [122, 790], [100, 740], [80, 700], [70, 650], [64, 600], [66, 545], [72, 500], [78, 446], [80, 402], [88, 380]];
  const pondLevel = () => -0.5;
  // the stream's falls: from the pond's lip under the footbridge, below the footbridge, by the boulders, and into the pool
  const streamLevel = (y) => -0.52 - 0.78 * ss(352, 392, y) - 1.1 * ss(468, 532, y) - 0.6 * ss(598, 646, y) - 0.4 * ss(808, 858, y);
  const BANKS = [{ poly: POND, level: pondLevel }, { poly: STREAM, level: streamLevel }];

  // the ground's height under any point of the painting (metres), before the banks
  function base(x, y) {
    let h = 0.8 * ss(310, 0, y) * ss(330, 450, x);                                     // the lane rises toward the square
    const west = y < 662 ? -0.3 * ss(440, 662, y) : -0.3 - 1.5 * Math.min(1, (y - 662) / 98);  // the west path and its stairs
    const low = -1.8 * ss(742, 772, y), road = -1.8 * ss(760, 980, y);                  // below the garden wall; the south road
    const south = low + (road - low) * ss(640, 742, x);
    const t = ss(378, 394, x);                                                         // the garden's west wall holds the garden up
    return h + west * (1 - t) + south * t;
  }
  // and the banks: within 26 px of the pond or the stream the ground falls to just above the water
  function ground(x, y) {
    let h = base(x, y);
    if (x > 330) return h;
    for (const w of BANKS) {
      const lip = w.level(y) + 0.35;
      if (inPoly(w.poly, x, y)) { h = Math.min(h, lip); continue; }
      const d = edgeDist(w.poly, x, y); if (d < 26) h = Math.min(h, lip + (h - lip) * ss(0, 26, d));
    }
    return h;
  }

  // the footbridge's deck over the stream (its planks are level with the path at both ends)
  const DECK = { x0: 34, x1: 224, y0: 392, y1: 448 };

  // pockets past the 2D walk, found by looking: a grassy strip from the lane's corner up the cottage's west wall (behind
  // the bush there) and along its back to a quiet corner behind the woodshed, under the lantern on the cottage's side;
  // and a hollow in the woods under the garden wall, in off the curving path between the trees, to the old stump
  const POCKETS = [
    { poly: [[703, 292], [703, 170], [1096, 166], [1104, 250], [1096, 330], [1010, 330], [1010, 194], [726, 194], [726, 292]], ground: 'grass' },
    { poly: [[616, 960], [636, 912], [650, 874], [668, 846], [700, 838], [724, 852], [724, 892], [706, 902], [686, 894], [670, 904], [664, 960]], ground: 'dirt' },
  ];
  // the 3D ground has a little roll wherever it is more than 40 px from the 2D walk (engine/world.js, terrain); her feet
  // follow the same roll in the pockets, so she stands on the grass there, not in it
  const WALK2D = () => ((G.MAPS || {}).cottage || { walk: [] }).walk;
  const nearWalk = (x, y, r) => WALK2D().some((p) => inPoly(p, x, y) || edgeDist(p, x, y) < r);
  const roll = (x, y) => (G.W3D.vnoise(x / 60, y / 60) - 0.5) * 0.5 + (G.W3D.vnoise(x / 17, y / 17) - 0.5) * 0.12;

  P.cottage = {
    id: 'cottage', name: 'Io’s cottage', painting: "art/walk/walk-wickhollow-cottage.avif", size: [1536, 1024],
    mapId: 'cottage', paintingPng: 'reference/art/walk/walk-wickhollow-cottage.png',
    // the wall check (tools/walls-test.mjs): from the start, to every exit, the door, the yards and the pockets
    checks: { from: [830, 610], goals: [
      ['the cottage door', 842, 486], ['the lane up to Wickhollow (north edge)', 554, 8], ['the footbridge to the world (west edge)', 8, 420],
      ['the south road (south edge)', 780, 1018], ['the curving path’s end (south edge)', 700, 1016], ['the forest path (east edge)', 1528, 740],
      ['the letters on the potting bench', 592, 484], ['under the rose bower', 460, 410], ['the nook behind the pear tree', 570, 320],
      ['the foot of the stairs', 322, 772], ['the cauldron’s yard', 1100, 560], ['the lantern post by the old oak', 1386, 440],
      ['the corner behind the woodshed (pocket)', 1060, 296], ['the hollow under the garden wall (pocket)', 704, 860]] },
    // the trees from the painting (tools/make-trees.mjs): no generated tree in the old oak's ground (it is built whole in
    // extra) or in the white blossom bush north-west of the lane; the roads stay open past the painting's edges
    treeGen: { dark: 0.6, step: 43, fir: 0.12, firSouth: 0.2, out: { density: 0.62, size: [0.95, 1.35] },
      keepOut: [[1190, -80, 1540, 476], [360, 120, 480, 262]],
      roads: [[502, -800, 606, 0], [-800, 397, 0, 442], [690, 1024, 812, 1800], [1536, 704, 2300, 772]] },
    // the ground's textures, and how many metres each repeats over: the worn cobble paths in pinkish earth, the garden's
    // grass, the mossy forest floor round the paths, and the town's cobbles (laid on the lane at the top, in extra)
    ground: { cob: 'cottage_path', grass: 'shared_grass_meadow', dirt: 'shared_forest_floor', pave: 'shared_cobbles_town', rep: [2.8, 4.0, 3.2, 2.6] },
    surfaces: { roof: 'cottage_roof_moss', cloth: 'shared_bark_oak', pave: 'shared_cobbles_town' },
    textures: [
      { id: 'cottage_path', made: "./../texture-packs/made/cottage_path.png", stand: "./../texture-packs/wickhollow/cottage/stand-in/cottage_path.png" },
      { id: 'cottage_roof_moss', made: "./../texture-packs/made/cottage_roof_moss.png", stand: "./../texture-packs/wickhollow/cottage/stand-in/cottage_roof_moss.png" },
      { id: 'wick_leaf_canopy', made: "./../texture-packs/made/wick_leaf_canopy.png", stand: "./../texture-packs/wickhollow/cottage/stand-in/wick_leaf_canopy.png" },
      { id: 'shared_bark_oak', made: "./../texture-packs/made/shared_bark_oak.png", stand: "./../texture-packs/wickhollow/cottage/stand-in/shared_bark_oak.png" },
      { id: 'shared_cobbles_town', made: "./../texture-packs/made/shared_cobbles_town.png", stand: "./../texture-packs/wickhollow/wickhollow/stand-in/shared_cobbles_town.png" },
      { id: 'shared_grass_meadow', made: "./../texture-packs/made/shared_grass_meadow.png", stand: "./../texture-packs/wickhollow/wickhollow/stand-in/shared_grass_meadow.png" },
      { id: 'shared_stone_wall_rough', made: "./../texture-packs/made/shared_stone_wall_rough.png", stand: "./../texture-packs/wickhollow/wickhollow/stand-in/shared_stone_wall_rough.png" },
      { id: 'wick_wall_timber_plaster', made: "./../texture-packs/made/wick_wall_timber_plaster.png", stand: "./../texture-packs/wickhollow/wickhollow/stand-in/wick_wall_timber_plaster.png" },
      { id: 'shared_boardwalk_planks', made: "./../texture-packs/made/shared_boardwalk_planks.png", stand: "./../texture-packs/wickhollow/jetty/stand-in/shared_boardwalk_planks.png" },
      { id: 'shared_drystone', made: "./../texture-packs/made/shared_drystone.png", stand: "./../texture-packs/wickhollow/jetty/stand-in/shared_drystone.png" },
      { id: 'shared_water_dark', made: "./../texture-packs/made/shared_water_dark.png", stand: "./../texture-packs/wickhollow/jetty/stand-in/shared_water_dark.png" },
      { id: 'shared_water_river', made: "./../texture-packs/made/shared_water_river.png", stand: "./../texture-packs/wickhollow/thornwood/stand-in/shared_water_river.png" },
      { id: 'shared_dirt_track', made: "./../texture-packs/made/shared_dirt_track.png", stand: "./../texture-packs/wickhollow/thornwood/stand-in/shared_dirt_track.png" },
      { id: 'thorn_rock_mossy', made: "./../texture-packs/made/thorn_rock_mossy.png", stand: "./../texture-packs/wickhollow/thornwood/stand-in/thorn_rock_mossy.png" },
      { id: 'shared_forest_floor', made: "./../texture-packs/made/shared_forest_floor.png", stand: "./../texture-packs/wilds-south/dawnroost-road/stand-in/shared_forest_floor.png" },
    ],
    ground_h: ground,
    // where Io's feet stand: the ground, the footbridge's deck, and the pockets' little roll
    walk_h(x, y) {
      if (x >= DECK.x0 - 4 && x <= DECK.x1 + 4 && y >= DECK.y0 && y <= DECK.y1) return 0;
      let h = ground(x, y);
      if (POCKETS.some((p) => inPoly(p.poly, x, y)) && !nearWalk(x, y, 40)) h += roll(x, y);
      return h;
    },
    water: [
      { poly: POND, level: pondLevel, tex: 'shared_water_dark', rep: 5, flow: [0.003, 0.002], bed: -1.7, tint: 0x8890b8 },
      { poly: STREAM, level: streamLevel, tex: 'shared_water_river', rep: 4, flow: [0.0, 0.05], bed: -4.4 },
    ],
    // lawns: the garden's beds, the grass round the cottage, the yards at the top: grass, and no generated trees
    lawns: [
      [[388, 497], [574, 497], [574, 742], [388, 742]],                                                          // lavender and white beds
      [[609, 508], [648, 508], [662, 534], [788, 534], [786, 636], [756, 649], [754, 742], [609, 742]],          // the vegetables
      [[870, 538], [990, 542], [1050, 552], [1050, 662], [1158, 662], [1158, 742], [832, 742], [830, 657], [854, 643], [868, 600]], // delphiniums and the south-east corner
      [[606, 304], [686, 304], [700, 294], [728, 292], [728, 468], [606, 468]],                                  // round the potting bench and the rain barrel
      [[612, 96], [800, 96], [800, 258], [630, 258], [622, 238], [616, 210], [612, 180]],                        // the lavender patch north of the cottage
      [[0, 40], [476, 40], [476, 96], [0, 96]], [[628, 40], [880, 40], [880, 96], [628, 96]],                    // the yards at the top
    ],
    // pockets past the 2D walk (see POCKETS)
    walkAdd: POCKETS,
    // the 2D walk starts on the porch; here she starts a few steps down the garden path, facing her door, so the camera
    // behind her shows the cottage rather than its wall
    start: [830, 610], startFace: Math.PI,
    // the doors out (the walking map's exits), and what is past them
    exits: [
      { rect: [500, 0, 604, 20], label: 'Wickhollow' },
      { rect: [680, 1004, 812, 1024], label: 'The world' },
      { rect: [0, 397, 18, 442], label: 'The world' },
      { rect: [1516, 704, 1536, 770], label: 'The world' },
    ],

    // ---- the buildings. Footprints in pixels [x0, y0, x1, y1]; the front faces south.
    buildings: [
      // Io's cottage: stone walls, a steep mossy roof with its gable to the garden (the round window is built in extra), the
      // arched plank door with a lantern by it, a small lit window, and the tall chimney on the east slope
      { id: 'cottage', name: 'Io’s cottage', fp: [728, 196, 952, 478], walls: [{ t: 'stone', h: 3.0 }], roof: { ridge: 'ns', rise: 4.3, over: 0.55 },
        doors: [{ side: 's', x: 842, w: 1.35, h: 2.35, arch: true }],
        windows: [{ side: 's', x: 913, y: 1.0, w: 0.8, h: 0.95 }, { side: 'w', y: 420, z: 1.1, w: 0.7, h: 0.9 }, { side: 'w', y: 300, z: 1.1, w: 0.7, h: 0.9 },
          { side: 'n', x: 840, y: 1.1, w: 0.8, h: 0.9 }],
        lanterns: [{ side: 's', x: 797, y: 2.15 }], chimneys: [{ x: 936, y: 252, w: 1.0, d: 1.0, h: 7.5 }] },
      // the low wing on its east side, under a lean-to roof, with its lit window over the bench
      { id: 'cottage-wing', fp: [952, 262, 1004, 446], walls: [{ t: 'stone', h: 2.3 }], roof: { ridge: 'ns', rise: 0.7, over: 0.3, lean: 'w' },
        windows: [{ side: 's', x: 978, y: 0.95, w: 0.8, h: 0.85 }], lanterns: [{ side: 'e', y: 300, y2: 2.3 }] },
      // the woodshed lean-to, open to the south and full of logs (in extra)
      { id: 'woodshed', name: 'the woodshed', fp: [1006, 334, 1086, 436], walls: [{ t: 'planks', h: 2.2 }], open: 's', roof: { ridge: 'ew', rise: 0.8, over: 0.35, lean: 'n' },
        posts: [1011, 1046, 1081] },
      // the bottoms of the square's houses along the top edge (the rest of them is past the painting)
      { id: 'top-west-a', fp: [30, -240, 246, 36], walls: [{ t: 'stone', h: 3.2 }, { t: 'timber', h: 2.6 }], roof: { ridge: 'ew', rise: 3.6, over: 0.45 },
        doors: [{ side: 's', x: 82, w: 1.1, h: 2.2 }], windows: [{ side: 's', x: 132, y: 1.0, w: 0.9, h: 1.0 }, { side: 's', x: 200, y: 1.0, w: 0.9, h: 1.0 }, { side: 's', x: 150, y: 3.9, w: 0.8, h: 0.9 }] },
      { id: 'top-west-b', fp: [250, -240, 460, 38], walls: [{ t: 'stone', h: 3.2 }, { t: 'timber', h: 2.6 }], roof: { ridge: 'ew', rise: 3.6, over: 0.45 },
        doors: [{ side: 's', x: 368, w: 1.2, h: 2.3 }], windows: [{ side: 's', x: 308, y: 1.0, w: 0.9, h: 1.0 }, { side: 's', x: 420, y: 1.0, w: 0.8, h: 1.0 }, { side: 's', x: 368, y: 3.9, w: 0.8, h: 0.9 }],
        lanterns: [{ side: 's', x: 340, y: 2.3 }] },
      { id: 'top-east', fp: [638, -240, 856, 36], walls: [{ t: 'stone', h: 3.2 }, { t: 'timber', h: 2.6 }], roof: { ridge: 'ew', rise: 3.6, over: 0.45 },
        doors: [{ side: 's', x: 730, w: 1.1, h: 2.2 }], windows: [{ side: 's', x: 678, y: 1.0, w: 1.0, h: 1.0 }, { side: 's', x: 785, y: 1.0, w: 0.9, h: 1.0 }, { side: 's', x: 730, y: 3.9, w: 0.8, h: 0.9 }],
        flowerbox: { side: 's', x0: 662, x1: 694, y: 0.95 } },
    ],

    // ---- walls: low drystone walls, the pond's kerb, the garden's walls with their pickets, and the little fences
    walls: [
      { pts: [[52, 120], [218, 120]], h: 0.9, t: 0.55, tex: 'dry' },                                          // along the top: the west houses' wall
      { pts: [[346, 104], [458, 104]], h: 0.0, t: 0.15, tex: 'dry', top: 'fence', topH: 1.1 },
      { pts: [[644, 120], [782, 120]], h: 0.0, t: 0.15, tex: 'dry', top: 'fence', topH: 1.0 },
      { pts: [[782, 120], [880, 120]], h: 0.9, t: 0.55, tex: 'dry' },
      { pts: [[188, 386], [248, 375], [288, 363], [308, 351], [346, 340]], h: 0.7, t: 0.55, tex: 'dry', drop: true },   // the pond's stone kerb
      { pts: [[346, 340], [376, 330], [412, 313], [450, 293], [482, 268], [503, 246]], h: 0.6, t: 0.55, tex: 'dry' },
      { pts: [[634, 250], [700, 250]], h: 0.0, t: 0.12, tex: 'dry', top: 'fence', topH: 0.9 },              // round the lavender patch
      { pts: [[533, 386], [604, 386]], h: 0.0, t: 0.12, tex: 'dry', top: 'fence', topH: 1.1 },              // behind the potting bench
      { pts: [[384, 428], [384, 534]], h: 0.0, t: 0.15, tex: 'dry', top: 'fence', topH: 1.0 },              // the garden: west fence,
      { pts: [[386, 534], [386, 745]], h: 0.6, t: 0.5, tex: 'dry', drop: true },                           // west wall over the stairs,
      { pts: [[386, 745], [708, 745]], h: 0.55, t: 0.5, tex: 'dry', top: 'fence', topH: 0.95, drop: true }, // south wall with pickets,
      { pts: [[876, 745], [1162, 745]], h: 0.55, t: 0.5, tex: 'dry', top: 'fence', topH: 0.95, drop: true },
      { pts: [[1162, 476], [1162, 745]], h: 0.35, t: 0.4, tex: 'dry', top: 'fence', topH: 1.0 },          // and the east side
      { pts: [[880, 554], [1048, 554], [1048, 640], [880, 640], [880, 554]], h: 0.0, t: 0.12, tex: 'dry', top: 'fence', topH: 0.75 }, // the delphinium bed's rails
    ],
    // the stone stairs on the west path, down to the lower ground
    steps: [{ r: [287, 662, 361, 760], down: 's', n: 8 }],
    // the lamps are all the painting's own: stone pillars by the lane, the footbridge and the gate, a lantern post at the
    // forest path, built in extra (taller than the engine's pillars, as painted)
    lamps: [],
    // small things: the tubs and pots along the cottage front and on the potting bench, the bench under the wing's window,
    // the barrel by the woodshed, and the mossy boulders
    props: [
      { k: 'pot', at: [700, 492] }, { k: 'pot', at: [722, 495] }, { k: 'pot', at: [762, 496] }, { k: 'pot', at: [784, 492] }, { k: 'pot', at: [804, 495] },
      { k: 'pot', at: [888, 494] }, { k: 'pot', at: [912, 492] }, { k: 'pot', at: [936, 495] },
      { k: 'pot', at: [546, 452], y: 0.93 }, { k: 'pot', at: [566, 449], y: 0.93 }, { k: 'pot', at: [614, 451], y: 0.93 }, { k: 'pot', at: [556, 442], y: 1.42 }, { k: 'pot', at: [600, 442], y: 1.42 },
      { k: 'bench', at: [978, 460], face: 0 },
      { k: 'barrel', at: [1032, 444] },
      { k: 'rock', at: [585, 778], size: 1.3 }, { k: 'rock', at: [618, 800], size: 0.8 }, { k: 'rock', at: [305, 965], size: 1.9 }, { k: 'rock', at: [960, 905], size: 1.2 },
      { k: 'rock', at: [100, 168], size: 1.2 }, { k: 'rock', at: [244, 214], size: 1.3 }, { k: 'rock', at: [24, 280], size: 1.1 }, { k: 'rock', at: [370, 296], size: 0.9 },
      { k: 'rock', at: [28, 560], size: 1.5 }, { k: 'rock', at: [215, 520], size: 1.2 }, { k: 'rock', at: [232, 604], size: 1.4 }, { k: 'rock', at: [246, 690], size: 1.0 },
      { k: 'rock', at: [70, 780], size: 1.6 }, { k: 'rock', at: [24, 680], size: 1.2 }, { k: 'rock', at: [1075, 228], size: 1.0 }, { k: 'rock', at: [1435, 760], size: 1.1 },
    ],
    // flower beds and bushes: [x, y, radius in metres, colours]
    flowers: [
      [415, 186, 2.2, 'white'], [446, 232, 1.3, 'white'], [150, 62, 1.5, 'white'], [112, 78, 0.9, 'mix'], [300, 66, 0.8, 'mix'], [820, 72, 0.9, 'white'], // the north
      [650, 226, 0.55, 'violet'], [672, 214, 0.55, 'violet'], [692, 228, 0.5, 'violet'], [661, 202, 0.45, 'violet'],                          // the lavender patch
      [232, 474, 1.0, 'white'], [372, 470, 0.45, 'mix'], [370, 560, 0.4, 'white'], [372, 640, 0.4, 'mix'],                                 // by the footbridge and the west fence
      [694, 238, 0.6, 'white'],                                                                                                          // the bush at the lavender fence's end (the first pocket's way in, behind it)
      [682, 726, 1.0, 'white'], [646, 728, 0.8, 'mix'], [896, 722, 1.0, 'white'], [928, 728, 0.8, 'mix'],                                  // either side of the gate
      [966, 694, 0.8, 'white'], [1018, 698, 0.8, 'violet'], [1066, 692, 0.9, 'violet'], [1118, 700, 0.8, 'mix'],                          // the garden's south-east corner
      [626, 520, 0.5, 'white'], [644, 528, 0.45, 'white'], [622, 536, 0.4, 'white'],                                                     // white flowers by the vegetables
      [640, 822, 0.8, 'violet'], [612, 852, 0.6, 'violet'], [660, 930, 0.7, 'white'], [612, 958, 0.6, 'white'],                           // the south woods, and the hollow's way in
      [1290, 500, 0.7, 'violet'], [1120, 282, 0.7, 'white'], [740, 146, 0.8, 'mix'],
      [432, 780, 0.8, 'mix'], [470, 800, 1.0, 'white'], [522, 822, 1.2, 'mix'], [562, 850, 1.0, 'white'], [596, 880, 0.8, 'mix'],         // shrubs between the
      [380, 900, 1.2, 'mix'], [452, 966, 1.1, 'white'], [530, 1004, 1.2, 'mix'], [348, 840, 0.9, 'white'],                              // curving path and the garden, and south of it
      // the lavender bed and the white globe bed
      ...[418, 442, 466, 490, 514, 538, 560].flatMap((x, i) => [[x, 514 + (i % 2) * 3, 0.48, 'violet'], [x + 6, 540, 0.48, 'violet'], [x, 566 - (i % 2) * 3, 0.46, 'violet']]),
      ...[420, 446, 472, 498, 524, 550].flatMap((x, i) => [[x, 614, 0.5, 'white'], [x + 10, 640 + (i % 2) * 4, 0.52, 'white'], [x, 666, 0.48, 'white']]),
    ],
    // the lights for the light map: [x, y, radius px, strength, colour]. The lanterns' and windows' own are added for them.
    lights: [
      [842, 500, 90, 0.55, 'warm'], [978, 476, 50, 0.35, 'warm'], [460, 470, 70, 0.5, 'warm'], [1020, 320, 70, 0.4, 'warm'],
    ],
    trees: 'cottage',
    // the painting's own trees close to a path (make-trees.mjs keeps its trees 30 px off the walk): the pear tree behind the
    // potting bench, the dark fir beside the woodshed, and the trees either side of the hollow's way in
    extraTrees: [[648, 384, 0.72, 0, 21], [1216, 524, 1.12, 1, 22], [606, 912, 0.85, 0, 23], [684, 940, 0.8, 0, 24], [1290, 600, 0.95, 0, 25], [500, 790, 0.85, 0, 26]],

    // ---- the place's own things, built with the engine's parts ----
    extra(K) {
      const { B, X, Z, gh, TAU } = K, T3 = G.THREE;
      const R = (s) => { let v = s >>> 0 || 1; return () => { v ^= v << 13; v ^= v >>> 17; v ^= v << 5; return ((v >>> 0) % 1e6) / 1e6; }; };
      const r = R(41);
      const UP = new T3.Vector3(0, 1, 0);
      // a round stick (or a tapered limb) from a to b, in metres
      const stick = (k, a, b, r0, r1, col, seg, uv) => {
        const A = new T3.Vector3(...a), Bv = new T3.Vector3(...b), d = Bv.clone().sub(A), L = d.length();
        const g = new T3.CylinderGeometry(r1, r0, L, seg || 6, 1, true);
        const m = new T3.Matrix4().compose(A.clone().addScaledVector(d, 0.5), new T3.Quaternion().setFromUnitVectors(UP, d.normalize()), new T3.Vector3(1, 1, 1));
        B.geom(k, g, m, col, uv || [2 * Math.PI * Math.max(r0, r1), L]); g.dispose();
      };
      // a flat round thing lying at height y
      const disc = (k, x, y, z, rad, seg, col) => { const g = new T3.CircleGeometry(rad, seg || 10); g.rotateX(-Math.PI / 2); B.geom(k, g, new T3.Matrix4().makeTranslation(x, y, z), col, 2 * rad); g.dispose(); };
      // an upright card (a flower cluster, a stem's flowers), turned by `a`
      const card = (k, x, y, z, w, h, a, col) => { const c = Math.cos(a) * w / 2, s = Math.sin(a) * w / 2; B.quad(k, [x - c, y, z + s], [x + c, y, z - s], [x + c, y + h, z - s], [x - c, y + h, z + s], [0, 0, 1, 1], col); };
      const blob = (k, g, x, y, z, sx, sy, sz, col, uv) => B.geom(k, g, new T3.Matrix4().compose(new T3.Vector3(x, y, z), new T3.Quaternion().setFromEuler(new T3.Euler(0, r() * TAU, 0)), new T3.Vector3(sx, sy, sz)), col, uv);
      const shadeBy = (cy, h, k0) => (v) => { const t = Math.max(0, Math.min(1, (v.y - cy) / h * 0.5 + 0.5)); const k = (k0 || 0.42) + 0.68 * t; return [k * 0.95, k, k * 1.02]; };
      const ico0 = new T3.IcosahedronGeometry(1, 0), ico1 = K.ico[0], ico1b = K.ico[1], ico1c = K.ico[2];
      const WARM = [1.0, 0.68, 0.36];

      // ---- the lane at the top: the town's cobbles, between its two tall lamp pillars; and the yards along the houses ----
      const pave = (x0, y0, x1, y1, cell, col) => {
        const nx = Math.max(1, Math.round((X(x1) - X(x0)) / cell)), nz = Math.max(1, Math.round((Z(y1) - Z(y0)) / cell));
        for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
          const pa = x0 + (x1 - x0) * i / nx, pb = x0 + (x1 - x0) * (i + 1) / nx, qa = y0 + (y1 - y0) * j / nz, qb = y0 + (y1 - y0) * (j + 1) / nz;
          const h = (px, py) => K.terrain(px, py) + 0.03;
          B.quad('pave', [X(pa), h(pa, qb), Z(qb)], [X(pb), h(pb, qb), Z(qb)], [X(pb), h(pb, qa), Z(qa)], [X(pa), h(pa, qa), Z(qa)], [X(pa), Z(qb), X(pb), Z(qa)], col);
        }
      };
      pave(498, -160, 610, 126, 0.55, [0.92, 0.9, 0.92]); pave(30, 38, 466, 84, 0.6, [0.78, 0.76, 0.8]); pave(632, 38, 860, 80, 0.6, [0.78, 0.76, 0.8]);

      // ---- tall stone pillars with a lantern on top: the lane's two, the footbridge's two and the garden gate's two ----
      const pillar = (px, py, w, d, top, y0, lsize) => {
        const x = X(px), z = Z(py), g = y0 != null ? y0 : gh(px, py);
        B.box('stone', x, g - 0.5, z, w, top + 0.5, d, 0, [0.95, 0.93, 0.98]);
        B.box('stone', x, g + top, z, w + 0.16, 0.16, d + 0.16, 0, [0.8, 0.78, 0.84]);
        K.lantern(x, g + top + 0.18, z, null, lsize || 1.1);
        K.light(px, py + 8, 150, 1.15);
        K.addBlock([[px - w / 2 / 0.04, py - d / 2 / 0.05], [px + w / 2 / 0.04, py - d / 2 / 0.05], [px + w / 2 / 0.04, py + d / 2 / 0.05], [px - w / 2 / 0.04, py + d / 2 / 0.05]]);
        return g + top;
      };
      pillar(480, 112, 1.1, 0.75, 2.75); pillar(624, 112, 1.1, 0.75, 2.75);
      pillar(62, 456, 0.8, 0.6, 1.2, 0, 1.0); pillar(197, 456, 0.8, 0.6, 1.2, 0, 1.0);
      // the gate: two pillars, a round stone arch between them over the path, and the two leaves of the gate standing open
      pillar(726, 745, 1.1, 0.8, 2.4, null, 1.0); pillar(858, 745, 1.1, 0.8, 2.4, null, 1.0);
      {
        const gx = X(792), gz = Z(745), g = gh(792, 745), spring = g + 2.0, ri = 1.78, ro = 2.18;
        const sh = new T3.Shape(); sh.absarc(0, 0, ro, 0, Math.PI, false); sh.absarc(0, 0, ri, Math.PI, 0, true);
        const eg = new T3.ExtrudeGeometry(sh, { depth: 0.56, bevelEnabled: false, curveSegments: 14 });
        B.geom('stone', eg, new T3.Matrix4().makeTranslation(gx, spring, gz - 0.28), [0.92, 0.9, 0.95], 1); eg.dispose();
        for (const jx of [745, 839]) B.box('stone', X(jx), g - 0.3, gz, 0.4, 2.3, 0.56, 0, [0.85, 0.83, 0.88]);
        for (const hx of [751, 833]) {
          const lx = X(hx);
          B.box('wood', lx, g + 0.05, gz - 0.62, 0.06, 1.45, 1.2, 0, [0.62, 0.5, 0.44]);
          for (let k = 0; k < 6; k++) B.box('wood', lx, g + 0.05, gz - 0.12 - k * 0.2, 0.08, 1.55 + (k === 2 || k === 3 ? 0.1 : 0), 0.12, 0, [0.55, 0.43, 0.38]);
        }
        K.shadeMarks.push(['rect', 712, 737, 872, 753, 0.7]);
      }

      // ---- the footbridge: a plank deck on log beams over the stream, stone ends, and a low parapet on the pond side ----
      {
        const x0 = X(DECK.x0), x1 = X(DECK.x1), z0 = Z(DECK.y0), z1 = Z(DECK.y1), cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
        B.box('deck', cx, -0.16, cz, x1 - x0, 0.16, z1 - z0, 0, null);
        for (const zz of [z0 + 0.35, z1 - 0.35]) stick('wood', [x0 + 0.5, -0.32, zz], [x1 - 0.5, -0.32, zz], 0.18, 0.18, [0.55, 0.45, 0.4], 7);
        for (const [a, b] of [[DECK.x0, 82], [180, DECK.x1]]) B.box('dry', X((a + b) / 2), -2.6, cz, X(b) - X(a), 2.44, z1 - z0 + 0.3, 0, [0.85, 0.85, 0.9]);
        B.box('dry', X(96), -0.4, Z(390), X(186) - X(6), 0.95, 0.32, 0, [0.9, 0.9, 0.95]);
        K.shadeMarks.push(['rect', DECK.x0, DECK.y1, DECK.x1, DECK.y1 + 20, 0.7]);
      }

      // ---- the lantern post where the forest path starts: a wooden post, an arm, and the lantern hung from it ----
      {
        const px = 1355, py = 465, x = X(px), z = Z(py), g = gh(px, py), ax = X(1386);
        B.box('wood', x, g - 0.3, z, 0.2, 3.2, 0.2, 0, [0.6, 0.48, 0.4]);
        B.box('wood', (x + ax) / 2 + 0.05, g + 2.72, z, ax - x + 0.2, 0.12, 0.12, 0, [0.6, 0.48, 0.4]);
        stick('wood', [x, g + 2.2, z], [x + 0.55, g + 2.72, z], 0.05, 0.05, [0.6, 0.48, 0.4], 4);
        K.lantern(ax, g + 2.0, z, null, 0.9, true);
        K.light(1386, 470, 150, 1.2);
      }

      // ---- the cottage: its round window in the gable, the barge boards, roses climbing the front, smoke from the chimney ----
      {
        const zf = Z(478) + 0.06, cx = X(842), cy = 5.05, g = gh(842, 482);
        const ring = new T3.RingGeometry(0.72, 0.98, 22, 1); B.geom('stone', ring, new T3.Matrix4().makeTranslation(cx, g + cy, zf + 0.02), [0.9, 0.88, 0.92], 1); ring.dispose();
        const gl = new T3.CircleGeometry(0.73, 22); B.geom('glass', gl, new T3.Matrix4().makeTranslation(cx, g + cy, zf), [1.7, 1.12, 0.6], 1); gl.dispose();
        B.box('wood', cx, g + cy - 0.73, zf + 0.03, 0.09, 1.46, 0.05, 0, [0.35, 0.26, 0.22]); B.box('wood', cx, g + cy - 0.045, zf + 0.03, 1.46, 0.09, 0.05, 0, [0.35, 0.26, 0.22]);
        K.halo(cx, g + cy, zf + 0.3, 1.9, [1.0, 0.66, 0.34]);
        // the dark barge boards up the gable's edges, and the beam across its foot
        const x0 = X(728) - 0.55, x1 = X(952) + 0.55, E = g + 3.0 - 0.55 * 4.3 / 4.48, top = g + 7.3, zb = Z(478) + 0.6;
        stick('wood', [x0, E, zb], [cx, top + 0.05, zb], 0.11, 0.11, [0.42, 0.32, 0.28], 4); stick('wood', [x1, E, zb], [cx, top + 0.05, zb], 0.11, 0.11, [0.42, 0.32, 0.28], 4);
        B.box('wood', cx, g + 2.95, Z(478) + 0.08, X(952) - X(728), 0.16, 0.12, 0, [0.42, 0.32, 0.28]);
        // roses and ivy up the front, either side of the door and window, and along the west wall
        const roseCard = (x, z, h, a) => { card('fl_mix', x, g, z, 0.75, h, a, [1.15, 0.85, 0.95]); };
        for (let px = 732; px < 806; px += 9 + r() * 6) roseCard(X(px), Z(478) + 0.08, 1.6 + r() * 1.5, 0);
        for (let px = 884; px < 948; px += 12 + r() * 8) if (Math.abs(px - 913) > 14) roseCard(X(px), Z(478) + 0.08, 1.0 + r() * 1.2, 0);
        for (let py = 290; py < 474; py += 12 + r() * 8) if (Math.abs(py - 420) > 12 && Math.abs(py - 300) > 12) roseCard(X(728) - 0.08, Z(py), 1.4 + r() * 1.6, Math.PI / 2);
        for (let i = 0; i < 8; i++) blob('leafBush', ico1, X(734 + i * 9), g + 0.4 + r() * 2.0, Z(478) + 0.12, 0.38, 0.5, 0.12, shadeBy(g + 1.2, 1.4, 0.7), 1.2);
        // a wisp of smoke over the chimney
        for (let i = 0; i < 4; i++) K.halo(X(936) + i * 0.25, g + 8.0 + i * 0.75, Z(252) - i * 0.15, 1.1 + i * 0.5, [0.16, 0.16, 0.22]);
      }

      // ---- the rain barrel at the cottage's west corner, with its downpipe from the eaves ----
      {
        const px = 668, py = 450, x = X(px), z = Z(py), g = gh(px, py);
        B.cyl('wood', x, g, z, 0.5, 0.55, 1.15, 14, [0.72, 0.55, 0.44], [3.2, 1.15]);
        for (const hy of [0.18, 0.62, 1.02]) B.cyl('iron', x, g + hy, z, 0.515 + hy * 0.04, 0.52 + hy * 0.04, 0.07, 14, null, null, true);
        disc('iron', x, g + 1.08, z, 0.48, 14, [0.5, 0.6, 0.8]);
        stick('iron', [X(712), g + 2.55, z], [X(712), g + 1.45, z], 0.05, 0.05, null, 5); stick('iron', [X(712), g + 1.45, z], [x + 0.25, g + 1.2, z], 0.05, 0.05, null, 5);
        K.shadeMarks.push(['dot', px, py, 16, 0.65]);
      }

      // ---- the potting bench: a table of pots, a shelf over it, the stool, and the bundle of letters ----
      {
        const g = gh(582, 452), x0 = X(534), x1 = X(630), cx = (x0 + x1) / 2, zf = Z(458), zb = Z(442), W = [0.68, 0.52, 0.42];
        B.box('wood', cx, g + 0.86, (zf + zb) / 2, x1 - x0, 0.08, zf - zb + 0.1, 0, W);
        B.box('wood', cx, g + 0.24, (zf + zb) / 2, x1 - x0 - 0.2, 0.05, zf - zb - 0.1, 0, [0.6, 0.46, 0.38]);
        for (const xx of [x0 + 0.1, x1 - 0.1]) for (const zz of [zf - 0.05, zb + 0.05]) B.box('wood', xx, g, zz, 0.1, 0.86, 0.1, 0, [0.6, 0.46, 0.38]);
        for (const xx of [x0 + 0.1, x1 - 0.1]) B.box('wood', xx, g + 0.9, zb - 0.02, 0.1, 0.9, 0.1, 0, [0.6, 0.46, 0.38]);
        B.box('wood', cx, g + 1.36, zb + 0.02, x1 - x0, 0.06, 0.32, 0, W);
        // the stool
        B.cyl('wood', X(574), g + 0.42, Z(469), 0.2, 0.2, 0.06, 10, W); for (const [dx, dz] of [[-0.1, -0.08], [0.1, -0.08], [0, 0.11]]) B.box('wood', X(574) + dx, g, Z(469) + dz, 0.05, 0.42, 0.05, 0, [0.6, 0.46, 0.38]);
        // the letters to the dead, tied with a ribbon
        const lx = X(592), lz = Z(454), ly = g + 0.94;
        B.box('wood', lx, ly, lz, 0.32, 0.1, 0.22, 0.25, [1.7, 1.6, 1.42]); B.box('wood', lx, ly - 0.005, lz, 0.05, 0.115, 0.235, 0.25, [1.5, 0.32, 0.36]);
        K.shadeMarks.push(['rect', 534, 442, 630, 460, 0.65]);
      }

      // ---- the rose bower over the path to the lane, with a lantern hung under it ----
      {
        const g = gh(460, 452), xl = X(430), xr = X(490), cx = (xl + xr) / 2, rad = (xr - xl) / 2;
        for (const pz of [Z(440), Z(462)]) {
          for (const xx of [xl, xr]) B.box('wood', xx, g - 0.2, pz, 0.12, 2.0, 0.12, 0, [0.55, 0.43, 0.38]);
          const tor = new T3.TorusGeometry(rad, 0.05, 4, 14, Math.PI); B.geom('wood', tor, new T3.Matrix4().makeTranslation(cx, g + 1.8, pz), [0.55, 0.43, 0.38], 1); tor.dispose();
        }
        const LEAF = (y) => (v) => { const k = 0.75 + 0.5 * Math.max(0, Math.min(1, (v.y - y) / 0.4 + 0.5)); return [0.8 * k, 1.15 * k, 0.8 * k]; };
        for (let i = 0; i <= 10; i++) {
          const a = Math.PI * i / 10, x = cx + Math.cos(a) * rad, y = g + 1.8 + Math.sin(a) * rad;
          if (i % 2 === 0) blob('leafBush', ico1b, x, y - 0.05, Z(451), 0.2, 0.18, 0.5, LEAF(y), 1);
          for (const pz of [Z(440), Z(462)]) card('fl_mix', x, y - 0.3, pz + (pz > Z(451) ? 0.1 : -0.1), 0.5, 0.5, r() * 0.6 - 0.3, [1.35, 0.95, 1.05]);
        }
        for (const xx of [xl, xr]) for (let y = 0.2; y < 1.8; y += 0.5) { blob('leafBush', ico1c, xx, g + y, Z(451), 0.16, 0.24, 0.42, LEAF(g + y), 1); for (const pz of [Z(440), Z(462)]) card('fl_mix', xx, g + y - 0.25, pz + (pz > Z(451) ? 0.1 : -0.1), 0.5, 0.55, 0, [1.35, 0.95, 1.05]); }
        K.lantern(cx, g + 1.95, Z(451), null, 0.8, true);
      }

      // ---- the stepping stones from the gate up to the porch, set in moss ----
      for (const [sx, sy, sr] of [[836, 510, 0.42], [818, 526, 0.36], [846, 538, 0.4], [824, 554, 0.42], [848, 568, 0.34], [826, 584, 0.42], [846, 600, 0.36], [818, 612, 0.4],
        [838, 628, 0.38], [806, 640, 0.4], [790, 660, 0.42], [810, 676, 0.36], [790, 694, 0.4], [808, 712, 0.38]]) disc('dry', X(sx), gh(sx, sy) + 0.035, Z(sy), sr, 9, [1.2, 1.18, 1.15]);

      // ---- the garden's beds: low timber frames, soil, the vegetables and the tall blue delphiniums ----
      const frame = (x0, y0, x1, y1) => {
        const a = X(x0), b = X(x1), c = Z(y0), d = Z(y1), g = gh((x0 + x1) / 2, (y0 + y1) / 2), F = [0.6, 0.47, 0.4];
        B.box('wood', (a + b) / 2, g - 0.1, c, b - a, 0.38, 0.1, 0, F); B.box('wood', (a + b) / 2, g - 0.1, d, b - a, 0.38, 0.1, 0, F);
        B.box('wood', a, g - 0.1, (c + d) / 2, 0.1, 0.38, d - c, 0, F); B.box('wood', b, g - 0.1, (c + d) / 2, 0.1, 0.38, d - c, 0, F);
        B.quad('soil', [a, g + 0.2, d], [b, g + 0.2, d], [b, g + 0.2, c], [a, g + 0.2, c], [a, d, b, c], [0.8, 0.75, 0.75]);
      };
      frame(404, 500, 572, 588); frame(404, 600, 572, 682); frame(612, 544, 700, 602); frame(706, 544, 786, 602); frame(612, 612, 784, 678); frame(884, 558, 1044, 636);
      for (const [x0, y0, x1, y1] of [[616, 548, 696, 598], [710, 548, 782, 598], [616, 616, 780, 674]]) {
        for (let py = y0 + 9; py < y1; py += 15) for (let px = x0 + 9; px < x1; px += 19) {
          const g = gh(px, py) + 0.2, s = 0.3 + r() * 0.1;
          blob('leafBush', ico1, X(px) + (r() - 0.5) * 0.2, g + s * 0.3, Z(py), s, s * 0.6, s, (v) => { const k = 0.7 + 0.6 * Math.max(0, Math.min(1, (v.y - g) / (s * 0.8))); return [0.72 * k, 1.25 * k, 0.62 * k]; }, 0.8);
        }
      }
      for (let py = 576; py < 636; py += 30) for (let px = 900; px < 1036; px += 20) {
        const x = X(px + (r() - 0.5) * 8), z = Z(py + (r() - 0.5) * 6), g = gh(px, py) + 0.2, hh = 1.2 + r() * 0.5;
        blob('leafBush', ico0, x, g + 0.2, z, 0.35, 0.3, 0.35, shadeBy(g + 0.2, 0.3, 0.5), 1);
        B.box('leafBush', x, g, z, 0.04, hh, 0.04, 0, [0.55, 0.8, 0.55]);
        for (const a of [0.3, 1.87]) card('fl_violet', x, g + hh * 0.45, z, 0.32, hh * 0.6, a, [0.62, 0.82, 1.55]);
      }

      // ---- the drying rack of herbs, the cauldron on its tripod, and the stump ----
      {
        const g = gh(1092, 510), x0 = X(1036), x1 = X(1148), z0 = Z(508), z1 = Z(512), top = g + 1.95;
        stick('wood', [x0, g - 0.1, z0], [x0, top + 0.1, z0], 0.07, 0.07, [0.58, 0.46, 0.4], 6); stick('wood', [x1, g - 0.1, z1], [x1, top + 0.1, z1], 0.07, 0.07, [0.58, 0.46, 0.4], 6);
        stick('wood', [x0 - 0.1, top, z0], [x1 + 0.1, top, z1], 0.045, 0.045, [0.58, 0.46, 0.4], 5);
        const HERB = [[0.9, 0.72, 1.35], [1.4, 1.38, 1.3], [0.65, 0.95, 0.62], [1.0, 0.62, 1.15], [1.35, 1.3, 1.2], [0.7, 0.9, 0.6], [0.85, 0.7, 1.3]];
        const cone = new T3.ConeGeometry(0.17, 0.75, 7, 1, true); cone.rotateX(Math.PI);
        HERB.forEach((c, i) => {
          const f = (i + 0.7) / (HERB.length + 0.4), x = x0 + (x1 - x0) * f, z = z0 + (z1 - z0) * f;
          B.box('iron', x, top - 0.25, z, 0.015, 0.25, 0.015, 0);
          B.geom('leafBush', cone, new T3.Matrix4().makeTranslation(x, top - 0.62, z), c, 1);
          card(i % 2 ? 'fl_white' : 'fl_violet', x, top - 0.98, z + 0.06, 0.36, 0.7, 0.2, c);
        });
        cone.dispose();
        // the tripod: three legs to a point, a chain, and the iron cauldron hung under it
        const tx = X(1106), tz = Z(598), tg = gh(1106, 598), apex = [tx, tg + 1.85, tz];
        for (const [lx, ly] of [[1088, 602], [1124, 602], [1106, 593]]) stick('wood', [X(lx), tg - 0.05, Z(ly)], apex, 0.05, 0.035, [0.55, 0.43, 0.38], 5);
        B.box('iron', tx, tg + 0.95, tz, 0.02, 0.9, 0.02, 0);
        const pot = new T3.SphereGeometry(0.36, 12, 7, 0, TAU, Math.PI * 0.28, Math.PI * 0.72); B.geom('iron', pot, new T3.Matrix4().makeTranslation(tx, tg + 0.62, tz), null, 1); pot.dispose();
        const rim = new T3.TorusGeometry(0.31, 0.035, 4, 14); rim.rotateX(Math.PI / 2); B.geom('iron', rim, new T3.Matrix4().makeTranslation(tx, tg + 0.92, tz), null, 1); rim.dispose();
        disc('leafBush', tx, tg + 0.86, tz, 0.29, 12, [0.35, 0.55, 0.4]);
        stick('iron', [tx - 0.31, tg + 0.92, tz], [tx, tg + 1.2, tz], 0.012, 0.012, null, 3); stick('iron', [tx + 0.31, tg + 0.92, tz], [tx, tg + 1.2, tz], 0.012, 0.012, null, 3);
        // the stump, and a smaller one in the south-east woods
        for (const [sx, sy, sr, sh] of [[1121, 627, 0.68, 0.62], [1288, 556, 0.5, 0.45], [694, 878, 0.55, 0.5]]) {
          const x = X(sx), z = Z(sy), g2 = gh(sx, sy);
          B.cyl('cloth', x, g2 - 0.2, z, sr * 1.15, sr, sh + 0.2, 12, [0.8, 0.72, 0.68], [2 * Math.PI * sr, sh]);
          disc('wood', x, g2 + sh + 0.001, z, sr, 12, [0.95, 0.78, 0.6]);
          for (let k = 0; k < 4; k++) { const a = k * 1.57 + r(); stick('cloth', [x + Math.cos(a) * sr * 0.8, g2 + 0.15, z + Math.sin(a) * sr * 0.8], [x + Math.cos(a) * (sr + 0.5), g2 - 0.15, z + Math.sin(a) * (sr + 0.5)], 0.14, 0.06, [0.8, 0.72, 0.68], 5, [0.8, 0.6]); }
          K.addBlock(K.circlePx(sx, sy, sr + 0.1, 10));
        }
        K.shadeMarks.push(['dot', 1106, 598, 26, 0.6], ['dot', 1121, 627, 22, 0.6]);
      }

      // ---- the woodshed's stacked logs, the hollyhocks beside it, and the broom by the door ----
      {
        const x0 = X(1010) + 0.2, x1 = X(1082) - 0.2, zf = Z(436) - 0.25, g = gh(1046, 430);
        const end = new T3.CircleGeometry(0.13, 7);
        for (let row = 0; row < 6; row++) for (let x = x0 + (row % 2) * 0.13; x < x1; x += 0.27) {
          const y = g + 0.14 + row * 0.24, c = 0.8 + r() * 0.35;
          B.geom('wood', end, new T3.Matrix4().makeTranslation(x, y, zf), [1.2 * c, 0.95 * c, 0.7 * c], 0.3);
        }
        end.dispose();
        B.box('wood', (x0 + x1) / 2, g, zf - 0.6, x1 - x0, 1.56, 1.18, 0, [0.5, 0.38, 0.32]);
        for (const [hx, hy] of [[1094, 420], [1107, 413], [1121, 410], [1136, 407], [1150, 404], [1100, 400], [1128, 396]]) {
          const x = X(hx), z = Z(hy), hg = gh(hx, hy), hh = 1.6 + r() * 0.6;
          B.box('leafBush', x, hg, z, 0.05, hh, 0.05, 0, [0.5, 0.75, 0.5]);
          blob('leafBush', ico0, x, hg + 0.25, z, 0.32, 0.32, 0.32, shadeBy(hg + 0.25, 0.3, 0.5), 1);
          for (const a of [0.4, 1.97]) card('fl_mix', x, hg + hh * 0.35, z, 0.36, hh * 0.68, a, [1.45, 0.72, 1.05]);
        }
        // the broom, leaning on the wall by the door
        const bx = X(740), bz = Z(478) + 0.22, bg = gh(740, 486);
        stick('wood', [bx + 0.05, bg + 0.35, bz + 0.12], [bx - 0.05, bg + 1.55, bz - 0.12], 0.025, 0.025, [0.6, 0.48, 0.4], 4);
        const brs = new T3.ConeGeometry(0.17, 0.5, 8, 1, true); B.geom('soil', brs, new T3.Matrix4().makeTranslation(bx + 0.06, bg + 0.25, bz + 0.14), [2.2, 1.9, 1.1], 1); brs.dispose();
      }

      // ---- the pond's lily pads and reeds, and the stream's pool ----
      {
        const pad = new T3.CircleGeometry(1, 9, 0.3, TAU - 0.6);
        const pads = [[20, 215], [46, 228], [72, 254], [30, 248], [160, 248], [186, 236], [172, 270], [210, 262], [232, 290], [250, 304], [200, 300], [172, 344], [192, 352], [230, 330], [258, 330], [126, 236], [96, 214], [140, 300], [110, 330],
          [130, 900], [152, 926], [176, 962], [200, 990], [228, 1004], [60, 964], [92, 990], [24, 992], [208, 940]];
        for (const [px, py] of pads) {
          const y = (py < 400 ? pondLevel() : streamLevel(py)) + 0.025, s = 0.26 + r() * 0.2;
          B.geom('leafBush', pad, new T3.Matrix4().compose(new T3.Vector3(X(px), y, Z(py)), new T3.Quaternion().setFromEuler(new T3.Euler(-Math.PI / 2, 0, r() * TAU)), new T3.Vector3(s, s, s)), [0.55, 0.85, 0.6], 0.6);
          if (r() < 0.3) card(r() < 0.5 ? 'fl_white' : 'fl_mix', X(px), y, Z(py), 0.3, 0.22, r() * 3, [1.3, 1.0, 1.2]);
        }
        pad.dispose();
        for (const [px, py, n] of [[276, 272, 9], [292, 300, 8], [282, 336, 7], [138, 170, 7], [192, 174, 8], [54, 318, 7], [312, 280, 6], [108, 718, 8], [132, 742, 6], [42, 884, 7], [238, 772, 7], [250, 880, 6], [160, 170, 5]]) {
          // a clump in the water stands up out of it; one on the bank, out of the ground
          const wl = inPoly(POND, px, py) ? pondLevel() : inPoly(STREAM, px, py) ? streamLevel(py) : null, g = wl == null ? gh(px, py) : Math.min(gh(px, py), wl);
          for (let i = 0; i < n; i++) {
            const x = X(px) + (r() - 0.5) * 0.9, z = Z(py) + (r() - 0.5) * 0.7, hh = 0.9 + r() * 0.9, a = r() * 3;
            card('leafBush', x, g - 0.1, z, 0.08, hh, a, [0.5, 0.68, 0.5]); card('leafBush', x, g - 0.1, z, 0.08, hh, a + 1.57, [0.5, 0.68, 0.5]);
            if (r() < 0.45) B.box('wood', x, g + hh - 0.1, z, 0.06, 0.24, 0.06, 0, [0.6, 0.38, 0.3]);
          }
        }
      }

      // ---- the fallen mossy log in the south-east woods, and little pale mushrooms ----
      {
        const a = [X(872), gh(872, 832) + 0.3, Z(832)], b = [X(1004), gh(1004, 896) + 0.35, Z(896)];
        stick('cloth', a, b, 0.45, 0.38, [0.78, 0.82, 0.72], 9, [2.8, 6]);
        for (let i = 0; i < 5; i++) { const f = 0.15 + i * 0.17; blob('leafBush', ico0, a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f + 0.38, a[2] + (b[2] - a[2]) * f, 0.42, 0.14, 0.32, [0.6, 0.85, 0.6], 1); }
        const ring = Array.from({ length: 11 }, (_, i) => { const a = i / 11 * TAU + 0.3; return [694 + Math.cos(a) * 1.25 / 0.04, 878 + Math.sin(a) * 1.25 / 0.05]; });
        for (const [mx, my] of [[1256, 382], [1268, 392], [1302, 388], [1438, 612], [1446, 626], [902, 842], [916, 852], [930, 880], [1290, 572], [1276, 548], [1072, 300], [1084, 312], [1040, 318], ...ring]) {
          const g = K.terrain(mx, my), s = 0.6 + r() * 0.6;
          B.box('stone', X(mx), g - 0.02, Z(my), 0.035 * s, 0.13 * s, 0.035 * s, 0, [1.1, 1.05, 1.0]);
          B.cyl('stone', X(mx), g + 0.1 * s, Z(my), 0.1 * s, 0.02 * s, 0.07 * s, 7, [1.25, 1.12, 1.0]);
        }
      }

      // ---- the corner behind the woodshed (the first pocket): a stone seat under the lantern, a little mossy yard ----
      {
        const g = K.terrain(1050, 262);
        B.box('stone', X(1050), g - 0.2, Z(258), 1.4, 0.62, 0.5, 0, [0.9, 0.9, 0.95]);
        B.box('stone', X(1050), g + 0.42, Z(258), 1.6, 0.1, 0.6, 0, [0.95, 0.95, 1.0]);
        K.addBlock([[1032, 252], [1068, 252], [1068, 264], [1032, 264]]);
        K.light(1040, 300, 80, 0.5);
      }

      // ---- the old oak east of the cottage: a huge twisting trunk leaning north-west, its boughs, its crown over the
      // north-east, grey moss hanging, and its roots (none across the path) ----
      {
        const bx = 1478, by = 452, g = gh(bx, by), P0 = [X(bx), g - 0.4, Z(by)], BARK = [0.78, 0.7, 0.66];
        const mid = [X(1462), g + 3.2, Z(420)], fork = [X(1448), g + 5.0, Z(392)];
        stick('cloth', P0, mid, 1.55, 1.25, BARK, 12, [9, 4]); stick('cloth', mid, fork, 1.25, 1.0, BARK, 12, [7, 3]);
        const limbs = [
          [fork, [X(1300), g + 7.6, Z(330)], 0.85, 0.45], [fork, [X(1262), g + 6.2, Z(392)], 0.7, 0.35], [fork, [X(1482), g + 9.2, Z(276)], 0.85, 0.42],
          [fork, [X(1540), g + 8.2, Z(352)], 0.6, 0.3], [[X(1300), g + 7.6, Z(330)], [X(1150), g + 9.4, Z(230)], 0.45, 0.22], [[X(1482), g + 9.2, Z(276)], [X(1440), g + 11.0, Z(126)], 0.42, 0.22],
          [[X(1300), g + 7.6, Z(330)], [X(1330), g + 10.2, Z(190)], 0.4, 0.2], [[X(1262), g + 6.2, Z(392)], [X(1196), g + 7.2, Z(420)], 0.35, 0.15],
        ];
        for (const [a, b, r0, r1] of limbs) stick('cloth', a, b, r0, r1, BARK, 8, [2 * Math.PI * r0, 3]);
        // the roots, spreading north, east and south of the trunk (the path is on its west)
        for (const ang of [-1.3, -0.6, 0.1, 0.8, 1.5, 2.2]) {
          const L = 2.2 + r() * 1.4, ex = P0[0] + Math.cos(ang) * (1.4 + L), ez = P0[2] + Math.sin(ang) * (1.4 + L);
          stick('cloth', [P0[0] + Math.cos(ang) * 0.9, g + 0.6, P0[2] + Math.sin(ang) * 0.9], [ex, K.terrain(K.M.px(ex), K.M.py(ez)) - 0.1, ez], 0.5, 0.12, BARK, 6, [2, L]);
        }
        K.addBlock(K.circlePx(bx, by, 1.6, 12));
        // its crown: great clumps of leaves over the north-east
        const crown = [[1300, 300, 8.6, 3.6], [1180, 232, 9.6, 3.4], [1236, 150, 10.4, 3.8], [1360, 196, 11.4, 4.0], [1470, 140, 11.6, 4.0], [1500, 260, 10.6, 3.6],
          [1420, 330, 9.6, 3.4], [1340, 60, 10.4, 3.8], [1500, 30, 10.0, 3.6], [1230, 30, 9.6, 3.4], [1250, 360, 7.8, 2.6], [1530, 380, 9.2, 3.0], [1140, 120, 8.8, 3.0], [1400, -40, 10.0, 3.6]];
        crown.forEach(([cx, cy, h, rad], i) => blob('leafBush', [ico1, ico1b, ico1c][i % 3], X(cx), g + h, Z(cy), rad, rad * 0.72, rad, shadeBy(g + h, rad * 0.72, 0.35), rad * 1.4));
        // grey-green moss hanging from the boughs
        for (let i = 0; i < 40; i++) {
          const [cx, cy, h, rad] = crown[i % crown.length], a = r() * TAU, d = rad * (0.4 + r() * 0.5);
          const x = X(cx) + Math.cos(a) * d, z = Z(cy) + Math.sin(a) * d * 0.9, hh = 1.4 + r() * 2.2;
          B.box('leafBush', x, g + h - rad * 0.55 - hh, z, 0.12, hh, 0.03, r() * 3, [0.6, 0.72, 0.62]);
        }
        K.shadeMarks.push(['dot', 1380, 240, 170, 0.55], ['dot', 1478, 452, 50, 0.5]);
      }
      ico0.dispose();
    },
  };
})(window);
