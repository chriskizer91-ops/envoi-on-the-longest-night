// wickhollow.js: Wickhollow's square in 3D, laid out on its painting (reference/art/walk/walk-wickhollow-square.png,
// 1536 x 1024) in the painting's own pixels, as src/game/maps.js keeps the walking map. Where Io can walk is that map's own
// walk and block areas, unchanged (MAPS.wickhollow); everything here stands round them.
// The texture ids are the texture pack's (texture-packs/wickhollow/wickhollow/inventory.md).
// Heights are metres: the square is 0; the west stairs go down to the landing and the lower jetty (-1.2), the lane under
// the garden fence and the gardens south of the square are lower still (-1.6), and the south road slopes down to them.
(function (G) {
  'use strict';
  const P = G.W3D_PLACES = G.W3D_PLACES || {};
  const ss = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); };

  // the lake on the west and the river on the east (traced from the painting; both run on past its edges)
  const LAKE = [[-200, -200], [108, -200], [112, 0], [122, 80], [112, 180], [138, 262], [160, 332], [230, 336], [232, 502], [150, 506], [134, 560],
    [140, 640], [128, 702], [160, 704], [158, 766], [120, 805], [104, 900], [78, 1024], [60, 1300], [-200, 1300]];
  const RIVER = [[1322, -200], [1446, -200], [1446, 0], [1440, 150], [1436, 300], [1478, 330], [1484, 470], [1540, 500], [1740, 500], [1740, 1300],
    [1436, 1300], [1428, 1024], [1418, 880], [1398, 760], [1380, 620], [1372, 500], [1366, 420], [1352, 330], [1330, 250], [1318, 120], [1316, 0]];
  // lawns and gardens: grass, and no trees but the painting's own few
  const LAWNS = [
    [[548, 0], [700, 0], [700, 236], [548, 236]], [[850, 0], [998, 0], [998, 236], [850, 236]],          // the churchyard
    [[330, 714], [745, 714], [745, 812], [330, 812]],                                                    // the lower house's garden
    [[830, 846], [1160, 846], [1160, 932], [830, 932]],                                                  // the cottage's garden
  ];

  // the ground's height under any point of the painting (metres)
  function ground(x, y) {
    let h = 0;
    if (x < 330) h = -1.2 * ss(548, 636, y) - 0.4 * ss(700, 772, y);              // the west stairs, the landing, the steps down
    else if (x < 745) h = -1.6 * ss(645, 712, y);                                    // the gardens south of the square
    else h = -1.6 * ss(x < 822 ? 668 : 700, 850, y);                                 // the south road, and the gardens east of it
    h -= 0.45 * ss(870, 1060, y);                                                    // on down toward Io's cottage
    if (x > 540 && x < 1005 && y < 296) h = Math.max(h, 0.35 * ss(296, 262, y));     // the churchyard, a step up behind its wall
    if (x >= 730 && x <= 820 && y < 296) h = Math.max(h, 0.9 * ss(292, 222, y));     // the chapel steps
    return h;
  }
  // the east bridge's deck: it rises half a metre over the river
  const BRIDGE = { x0: 1296, x1: 1536, y0: 322, y1: 436, rise: 0.55 };
  const deck = (x) => BRIDGE.rise * Math.sin(Math.PI * Math.max(0, Math.min(1, (x - BRIDGE.x0) / (BRIDGE.x1 - BRIDGE.x0))));
  // the river falls three times: its level along the painting (metres)
  const riverLevel = (y) => -2.5 - 0.45 * ss(150, 185, y) - 0.45 * ss(462, 498, y) - 0.5 * ss(720, 760, y);

  P.wickhollow = {
    id: 'wickhollow', name: 'Wickhollow', painting: "art/walk/walk-wickhollow-square.avif", size: [1536, 1024],
    mapId: 'wickhollow', paintingPng: 'reference/art/walk/walk-wickhollow-square.png',
    // the wall check (tools/walls-test.mjs): from where, to each edge and door
    checks: { from: [777, 590], goals: [
      ['the chapel door (north)', 776, 216], ['the forge (north-east)', 1010, 338], ['the bridge to the Thornwood (east edge)', 1530, 375],
      ['the nook behind the bridge house (east)', 1236, 696], ['the south road to Io’s cottage (south edge)', 780, 1018], ['the lower house’s door (south-west)', 464, 716],
      ['the lower jetty (west edge)', 6, 732], ['the lane under the garden fence (south-west)', 300, 830], ['Nettie’s door (north-west)', 366, 392], ['the lane by Nettie’s house (north-west)', 280, 262]] },
    // the trees from the painting (tools/make-trees.mjs): how dark a patch must be, and where no tree goes
    treeGen: { dark: 0.62, keepOut: [[690, -100, 860, 230]], roads: [[740, 1024, 822, 1800], [1536, 330, 2200, 410], [-600, 700, 0, 770]] },
    // the ground's textures, and how many metres each repeats over
    ground: { cob: 'shared_cobbles_town', grass: 'shared_grass_meadow', dirt: 'shared_dirt_track', pave: 'wick_bridge_paving', rep: [3.2, 4.0, 4.0, 2.6] },
    // each texture: Chris's made one if the page carries it (texture-packs/made/), else the pack's stand-in. Written out in
    // full, so the offline build finds the pictures and puts them inside the file.
    textures: [
      { id: 'shared_cobbles_town', made: "./../texture-packs/made/shared_cobbles_town.png", stand: "./../texture-packs/wickhollow/wickhollow/stand-in/shared_cobbles_town.png" },
      { id: 'shared_grass_meadow', made: "./../texture-packs/made/shared_grass_meadow.png", stand: "./../texture-packs/wickhollow/wickhollow/stand-in/shared_grass_meadow.png" },
      { id: 'shared_roof_tiles_red', made: "./../texture-packs/made/shared_roof_tiles_red.png", stand: "./../texture-packs/wickhollow/wickhollow/stand-in/shared_roof_tiles_red.png" },
      { id: 'shared_stone_wall_rough', made: "./../texture-packs/made/shared_stone_wall_rough.png", stand: "./../texture-packs/wickhollow/wickhollow/stand-in/shared_stone_wall_rough.png" },
      { id: 'wick_bridge_paving', made: "./../texture-packs/made/wick_bridge_paving.png", stand: "./../texture-packs/wickhollow/wickhollow/stand-in/wick_bridge_paving.png" },
      { id: 'wick_wall_timber_plaster', made: "./../texture-packs/made/wick_wall_timber_plaster.png", stand: "./../texture-packs/wickhollow/wickhollow/stand-in/wick_wall_timber_plaster.png" },
      { id: 'shared_boardwalk_planks', made: "./../texture-packs/made/shared_boardwalk_planks.png", stand: "./../texture-packs/wickhollow/jetty/stand-in/shared_boardwalk_planks.png" },
      { id: 'shared_drystone', made: "./../texture-packs/made/shared_drystone.png", stand: "./../texture-packs/wickhollow/jetty/stand-in/shared_drystone.png" },
      { id: 'shared_awning_stripes', made: "./../texture-packs/made/shared_awning_stripes.png", stand: "./../texture-packs/wickhollow/jetty/stand-in/shared_awning_stripes.png" },
      { id: 'shared_water_dark', made: "./../texture-packs/made/shared_water_dark.png", stand: "./../texture-packs/wickhollow/jetty/stand-in/shared_water_dark.png" },
      { id: 'shared_dirt_track', made: "./../texture-packs/made/shared_dirt_track.png", stand: "./../texture-packs/wickhollow/thornwood/stand-in/shared_dirt_track.png" },
      { id: 'shared_water_river', made: "./../texture-packs/made/shared_water_river.png", stand: "./../texture-packs/wickhollow/thornwood/stand-in/shared_water_river.png" },
      { id: 'wick_leaf_canopy', made: "./../texture-packs/made/wick_leaf_canopy.png", stand: "./../texture-packs/wickhollow/cottage/stand-in/wick_leaf_canopy.png" },
      { id: 'shared_bark_oak', made: "./../texture-packs/made/shared_bark_oak.png", stand: "./../texture-packs/wickhollow/cottage/stand-in/shared_bark_oak.png" },
      { id: 'thorn_rock_mossy', made: "./../texture-packs/made/thorn_rock_mossy.png", stand: "./../texture-packs/wickhollow/thornwood/stand-in/thorn_rock_mossy.png" },
    ],
    ground_h: ground,
    // where Io's feet stand: the ground, or a deck over the water
    walk_h(x, y) {
      if (x >= BRIDGE.x0 - 4 && y >= BRIDGE.y0 && y <= BRIDGE.y1) return Math.max(ground(x, y), deck(x));
      if (x < 160 && y > 700 && y < 766) return -1.22;
      return ground(x, y);
    },
    water: [
      { poly: LAKE, level: () => -2.3, tex: 'shared_water_dark', rep: 6, flow: [0.004, 0.002], bed: -3.4 },
      { poly: RIVER, level: riverLevel, tex: 'shared_water_river', rep: 4, flow: [0.0, 0.05], bed: -4.6 },
    ],
    lawns: LAWNS,
    bridge: BRIDGE, deck, riverLevel,
    start: [777, 600], startFace: Math.PI,
    // the doors out (the walking map's exits), and what is past them
    exits: [
      { rect: [1514, 354, 1536, 396], label: 'The Thornwood' },
      { rect: [745, 1006, 816, 1024], label: 'Io’s cottage' },
      { rect: [0, 706, 18, 760], label: 'The jetty' },
    ],

    // ---- the buildings. Footprints in pixels [x0, y0, x1, y1]; the front faces south unless `face` says otherwise.
    // walls: storeys from the bottom, each { t: texture key, h: metres }; roof: { ridge: 'ns' | 'ew', rise, over }
    // windows and doors are placed along a side, at a pixel `x` (or `y` on an east or west side), lit: a warm window
    buildings: [
      { id: 'nettie', name: 'Nettie’s house', fp: [298, 238, 430, 388], walls: [{ t: 'stone', h: 3.1 }, { t: 'timber', h: 2.7 }], roof: { ridge: 'ns', rise: 4.6, over: 0.45 },
        doors: [{ side: 's', x: 366, w: 1.5, h: 2.5, arch: true, double: true }],
        windows: [{ side: 's', x: 366, y: 3.6, w: 1.3, h: 1.2 }, { side: 's', x: 366, y: 7.0, w: 0.6, h: 0.7 }, { side: 'w', y: 300, z: 1.2, w: 0.8, h: 1.0 }, { side: 'w', y: 330, z: 3.8, w: 0.8, h: 1.0 }],
        lanterns: [{ side: 's', x: 327, y: 2.4 }, { side: 's', x: 405, y: 2.4 }, { side: 'w', y: 372, y2: 2.4 }],
        chimneys: [{ x: 425, y: 300, w: 0.9, d: 0.9, h: 2.4 }], beams: true },
      { id: 'nettie-wing', fp: [430, 250, 552, 372], walls: [{ t: 'stone', h: 3.1 }, { t: 'timber', h: 2.4 }], roof: { ridge: 'ew', rise: 3.4, over: 0.45 },
        doors: [{ side: 's', x: 480, w: 1.1, h: 2.2 }],
        windows: [{ side: 's', x: 444, y: 3.6, w: 0.85, h: 1.1 }, { side: 's', x: 488, y: 3.6, w: 0.85, h: 1.1 }, { side: 's', x: 535, y: 3.6, w: 0.8, h: 1.0 }, { side: 's', x: 452, y: 1.0, w: 0.8, h: 0.9 }],
        lanterns: [{ side: 's', x: 505, y: 2.3 }], flowerbox: { side: 's', x0: 438, x1: 520, y: 3.45 },
        chimneys: [{ x: 512, y: 262, w: 0.8, d: 0.8, h: 3.6 }], dormers: [{ side: 's', x: 452, w: 1.3 }] },
      { id: 'chapel', name: 'the chapel', fp: [704, -40, 848, 212], walls: [{ t: 'stone', h: 5.8 }], roof: { ridge: 'ns', rise: 4.6, over: 0.4 }, floor: 0.9,
        doors: [{ side: 's', x: 776, w: 1.7, h: 3.0, arch: true, double: true }],
        windows: [{ side: 's', x: 776, y: 3.6, w: 2.0, h: 2.0, rose: true }, { side: 's', x: 776, y: 6.4, w: 0.55, h: 0.9, arch: true, colour: true },
          { side: 'e', y: 120, z: 1.8, w: 0.8, h: 2.0, arch: true, colour: true }, { side: 'w', y: 120, z: 1.8, w: 0.8, h: 2.0, arch: true, colour: true },
          { side: 'e', y: 40, z: 1.8, w: 0.8, h: 2.0, arch: true, colour: true }, { side: 'w', y: 40, z: 1.8, w: 0.8, h: 2.0, arch: true, colour: true }],
        lanterns: [{ side: 's', x: 741, y: 2.6 }, { side: 's', x: 810, y: 2.6 }], belfry: true },
      { id: 'forge-shed', name: 'Hilde’s forge, the open side', fp: [960, 212, 1080, 330], walls: [{ t: 'stone', h: 3.0 }], open: 's', roof: { ridge: 'ew', rise: 1.8, over: 0.6, lean: 'n' },
        posts: [968, 1022, 1074], fire: [1010, 300], lanterns: [{ side: 's', x: 1010, y: 2.6, hang: true }] },
      { id: 'forge', name: 'Hilde’s forge', fp: [1080, 196, 1236, 359], walls: [{ t: 'stone', h: 2.8 }, { t: 'timber', h: 2.4 }], roof: { ridge: 'ns', rise: 4.2, over: 0.5 },
        hearth: { x: 1158, w: 2.6, h: 2.5 }, windows: [{ side: 's', x: 1158, y: 4.0, w: 0.8, h: 0.9 }],
        lanterns: [{ side: 's', x: 1110, y: 2.6 }], chimneys: [{ x: 1152, y: 230, w: 1.1, d: 1.1, h: 4.0 }], beams: true, sign: [1240, 338] },
      { id: 'east-a', name: 'the house by the bridge', fp: [1086, 418, 1162, 600], walls: [{ t: 'stone', h: 3.0 }, { t: 'timber', h: 2.4 }], roof: { ridge: 'ew', rise: 3.2, over: 0.45 },
        doors: [{ side: 's', x: 1140, w: 1.1, h: 2.3, red: true }], windows: [{ side: 's', x: 1110, y: 3.5, w: 0.8, h: 1.0 }, { side: 'w', y: 515, z: 3.6, w: 0.8, h: 1.0 }, { side: 'w', y: 560, z: 1.1, w: 0.8, h: 1.0 }],
        lanterns: [{ side: 's', x: 1122, y: 2.4 }] },
      { id: 'east-b', fp: [1162, 418, 1254, 652], walls: [{ t: 'stone', h: 3.0 }, { t: 'timber', h: 2.6 }], roof: { ridge: 'ns', rise: 3.8, over: 0.45 },
        windows: [{ side: 's', x: 1198, y: 1.1, w: 0.85, h: 1.05 }, { side: 's', x: 1198, y: 3.6, w: 0.85, h: 1.1 }, { side: 'w', y: 600, z: 3.6, w: 0.7, h: 0.9 }],
        chimneys: [{ x: 1236, y: 470, w: 0.8, d: 0.8, h: 2.6 }], roses: true },
      { id: 'lower', name: 'the lower house', fp: [378, 474, 546, 712], walls: [{ t: 'stone', h: 3.2 }, { t: 'timber', h: 2.5 }], roof: { ridge: 'ns', rise: 4.4, over: 0.45 },
        doors: [{ side: 's', x: 464, w: 1.2, h: 2.3, arch: true }],
        windows: [{ side: 's', x: 386, y: 1.1, w: 0.9, h: 1.1 }, { side: 's', x: 530, y: 1.1, w: 0.9, h: 1.1 }, { side: 's', x: 464, y: 3.7, w: 1.0, h: 1.1 }, { side: 'w', y: 572, z: 3.7, w: 0.8, h: 0.9 }],
        lanterns: [{ side: 's', x: 436, y: 2.3 }, { side: 's', x: 492, y: 2.3 }], chimneys: [{ x: 498, y: 500, w: 0.9, d: 0.9, h: 3.0 }], beams: true, dormers: [{ side: 'w', y: 572, w: 1.2 }] },
      { id: 'cottage-se', name: 'the cottage in the south-east garden', fp: [922, 690, 1090, 846], walls: [{ t: 'stone', h: 3.0 }], roof: { ridge: 'ew', rise: 3.4, over: 0.5 },
        doors: [{ side: 's', x: 972, w: 1.1, h: 2.2, green: true }], windows: [{ side: 's', x: 1042, y: 1.0, w: 1.1, h: 1.0 }],
        lanterns: [{ side: 's', x: 945, y: 2.2 }, { side: 's', x: 1000, y: 2.2 }], dormers: [{ side: 's', x: 972, w: 1.4 }], chimneys: [{ x: 1080, y: 700, w: 0.9, d: 0.9, h: 2.2 }], flowerbox: { side: 's', x0: 1018, x1: 1066, y: 0.85 } },
      { id: 'cottage-se-lean', fp: [1090, 730, 1132, 846], walls: [{ t: 'planks', h: 2.5 }], roof: { ridge: 'ns', rise: 1.0, over: 0.3, lean: 'e' }, windows: [{ side: 's', x: 1108, y: 1.2, w: 0.6, h: 0.7 }] },
      { id: 'shed', name: 'the garden shed', fp: [1166, 772, 1244, 868], walls: [{ t: 'planks', h: 2.6 }], roof: { ridge: 'ns', rise: 1.9, over: 0.35 },
        doors: [{ side: 's', x: 1186, w: 0.9, h: 2.0, plank: true }], windows: [{ side: 's', x: 1222, y: 1.2, w: 0.6, h: 0.6, dark: true }] },
    ],
    // Nettie's stall in front of her house
    stall: { front: [[560, 402], [614, 370]], depth: 1.9, counter: 1.0, top: 2.6 },

    // ---- walls: low garden walls, the churchyard wall, the banks. Each a line of points, a height, a thickness and a
    // texture ('stone' or 'dry'); top: what stands on it ('rail': the churchyard's iron, 'fence': pickets)
    walls: [
      { pts: [[548, 248], [702, 248]], h: 0.75, t: 0.55, tex: 'stone', top: 'rail', topH: 1.3 },
      { pts: [[848, 248], [1000, 248]], h: 0.75, t: 0.55, tex: 'stone', top: 'rail', topH: 1.3 },
      { pts: [[548, 248], [548, -60]], h: 0.6, t: 0.5, tex: 'stone', top: 'rail', topH: 1.3 },
      { pts: [[1000, 248], [1000, -60]], h: 0.6, t: 0.5, tex: 'stone', top: 'rail', topH: 1.3 },
      { pts: [[236, 190], [236, 336]], h: 0.9, t: 0.6, tex: 'dry', drop: true },                       // the lake wall by the lane
      { pts: [[232, 336], [232, 418]], h: 0.7, t: 0.6, tex: 'dry', drop: true },                       // a gap onto the upper jetty
      { pts: [[232, 472], [232, 504]], h: 0.7, t: 0.6, tex: 'dry', drop: true },
      { pts: [[236, 504], [168, 506], [168, 624]], h: 0.8, t: 0.6, tex: 'dry', drop: true },        // the west stairs' outer wall
      { pts: [[330, 806], [452, 806]], h: 0.55, t: 0.5, tex: 'dry', top: 'fence', topH: 0.95 },      // the garden fence on its wall
      { pts: [[490, 806], [742, 806]], h: 0.55, t: 0.5, tex: 'dry', top: 'fence', topH: 0.95 },
      { pts: [[330, 806], [330, 714], [300, 714]], h: 0.8, t: 0.5, tex: 'dry' },
      { pts: [[737, 700], [737, 806]], h: 0.9, t: 0.55, tex: 'dry' },
      { pts: [[737, 880], [737, 1060]], h: 0.9, t: 0.55, tex: 'dry' },                               // the south road's walls
      { pts: [[825, 704], [825, 1060]], h: 0.9, t: 0.55, tex: 'dry' },
      { pts: [[822, 936], [1250, 936]], h: 0.55, t: 0.5, tex: 'dry', top: 'fence', topH: 0.9 },      // the cottage garden's wall
      { pts: [[826, 704], [916, 704]], h: 0.7, t: 0.5, tex: 'dry' },
      { pts: [[1162, 726], [1162, 936]], h: 0.0, t: 0.15, tex: 'dry', top: 'fence', topH: 1.0 },
      { pts: [[1266, 662], [1266, 722]], h: 0.7, t: 0.5, tex: 'dry' },
      { pts: [[608, 618], [646, 618]], h: 0.0, t: 0.15, tex: 'dry', top: 'fence', topH: 0.9 },       // the little fence below the square
    ],
    // the stone steps (drawn over the ground's slope): [x0, y0, x1, y1], the way down ('s', 'n', 'w'), how many
    steps: [
      { r: [190, 548, 252, 638], down: 's', n: 9 },
      { r: [208, 742, 266, 774], down: 's', n: 3 },
      { r: [738, 222, 814, 294], down: 's', n: 6 },
      { r: [446, 712, 486, 724], down: 's', n: 1 },
    ],
    // the Moonwell: its ring of low wall and flower beds (open to the south), the well, its iron arch and lantern
    moonwell: { c: [777, 458], ring: [3.35, 4.85], gap: 0.36, well: 1.45, wellH: 0.95, benches: [{ a: Math.PI }, { a: 0 }] },
    // lamps: an iron post (`post`), a stone pillar with a lantern (`pillar`), or a lantern on a wall (in `buildings`)
    lamps: [
      { at: [659, 392], kind: 'post' }, { at: [904, 392], kind: 'post' }, { at: [640, 595], kind: 'post' }, { at: [914, 595], kind: 'post' },
      { at: [260, 590], kind: 'post' }, { at: [628, 256], kind: 'post' }, { at: [910, 256], kind: 'post' },
      { at: [182, 484], kind: 'post', y: 0 }, { at: [205, 740], kind: 'post' }, { at: [46, 700], kind: 'post', y: -1.22, short: true },
      { at: [735, 765], kind: 'post' }, { at: [735, 912], kind: 'post' }, { at: [826, 730], kind: 'post' },
      { at: [1347, 328], kind: 'pillar' }, { at: [1505, 328], kind: 'pillar' }, { at: [1347, 436], kind: 'pillar' }, { at: [1505, 436], kind: 'pillar' },
      { at: [290, 254], kind: 'post' },
    ],
    // the jetties: the lower one (walked on: the way to the jetty) and the upper one (Nettie's crates)
    jetties: [
      { r: [0, 704, 154, 764], y: -1.22, posts: true },
      { r: [56, 338, 236, 500], y: 0, posts: true },            // level with the lane, through the gap in the wall
      { r: [112, 300, 160, 340], y: 0, posts: true },
    ],
    // small things: benches, barrels, crates, the anvil, pots of flowers, gravestones, the statue, bushes and beds
    props: [
      { k: 'bench', at: [1069, 648], face: 0 },
      { k: 'anvil', at: [1026, 318] }, { k: 'barrel', at: [968, 322] }, { k: 'barrel', at: [1052, 336] }, { k: 'barrel', at: [1082, 358] }, { k: 'barrel', at: [1098, 380] },
      { k: 'barrel', at: [214, 482], y: 0 }, { k: 'barrel', at: [436, 402] }, { k: 'barrel', at: [1088, 840] },
      { k: 'crates', at: [208, 360], y: 0 }, { k: 'crates', at: [120, 410], y: 0 }, { k: 'crates', at: [200, 488], y: 0 }, { k: 'crates', at: [596, 396] }, { k: 'crates', at: [534, 400] },
      { k: 'pot', at: [727, 548] }, { k: 'pot', at: [826, 548] }, { k: 'pot', at: [320, 396] }, { k: 'pot', at: [410, 400] }, { k: 'pot', at: [1112, 612] }, { k: 'pot', at: [1050, 530] },
      { k: 'pot', at: [450, 722] }, { k: 'pot', at: [492, 722] }, { k: 'pot', at: [960, 850] }, { k: 'pot', at: [1000, 852] },
      { k: 'statue', at: [1102, 712] },
      { k: 'grave', at: [578, 78], cross: true }, { k: 'grave', at: [624, 74] }, { k: 'grave', at: [652, 108] }, { k: 'grave', at: [566, 126] }, { k: 'grave', at: [612, 150] }, { k: 'grave', at: [680, 150] },
      { k: 'grave', at: [948, 70] }, { k: 'grave', at: [976, 102], cross: true }, { k: 'grave', at: [904, 146] }, { k: 'grave', at: [962, 146] }, { k: 'grave', at: [880, 70] },
      { k: 'post', at: [706, 236], h: 2.2 }, { k: 'post', at: [846, 236], h: 2.2 }, { k: 'post', at: [702, 248], h: 1.6 }, { k: 'post', at: [848, 248], h: 1.6 },
      { k: 'sunflowers', at: [1124, 880] },
    ],
    // flower beds and bushes: [x, y, radius in metres, colours]
    flowers: [
      [612, 268, 1.0, 'mix'], [656, 266, 1.1, 'white'], [884, 266, 1.1, 'white'], [936, 268, 0.9, 'mix'], [722, 252, 0.7, 'mix'], [828, 252, 0.7, 'mix'],
      [1046, 150, 1.8, 'white'], [590, 168, 1.2, 'mix'], [990, 140, 1.4, 'white'],
      [392, 383, 0.45, 'mix'], [342, 383, 0.45, 'mix'], [514, 382, 0.6, 'mix'], [560, 290, 0.8, 'white'], [1278, 702, 1.3, 'white'], [1262, 738, 0.9, 'mix'],
      [336, 582, 1.0, 'white'], [360, 500, 1.2, 'white'], [356, 754, 0.9, 'white'], [342, 740, 1.0, 'violet'], [300, 690, 1.0, 'violet'], [602, 772, 1.0, 'mix'],
      [1180, 880, 1.0, 'mix'], [1060, 890, 1.0, 'violet'], [880, 870, 1.0, 'mix'], [940, 900, 1.1, 'mix'], [1000, 880, 0.9, 'violet'],
      [1060, 524, 0.7, 'mix'], [1062, 546, 0.55, 'mix'], [1170, 600, 0.9, 'mix'], [588, 598, 0.6, 'white'], [565, 600, 0.9, 'mix'],
      [850, 700, 1.1, 'white'], [880, 760, 0.9, 'mix'], [212, 520, 0.8, 'mix'], [1290, 230, 1.2, 'mix'], [1250, 180, 1.0, 'violet'],
    ],
    // the lights for the light map: [x, y, radius px, strength, colour]. The lamps' own are added from `lamps`.
    lights: [
      [1158, 352, 150, 1.5, 'forge'], [1010, 318, 80, 0.9, 'forge'], [777, 470, 130, 0.9, 'moonwell'], [776, 232, 90, 0.7, 'warm'],
      [366, 410, 70, 0.55, 'warm'], [480, 404, 60, 0.45, 'warm'], [464, 722, 60, 0.5, 'warm'], [972, 856, 60, 0.45, 'warm'], [1140, 618, 50, 0.4, 'warm'],
      [1198, 662, 50, 0.35, 'warm'], [1042, 852, 50, 0.35, 'warm'], [386, 722, 40, 0.3, 'warm'], [530, 722, 40, 0.3, 'warm'], [560, 404, 70, 0.4, 'warm'],
    ],
    trees: 'wickhollow',
    // pockets to find, past the 2D walk: a strip of garden down the lower house's west side, behind the white bush
    walkAdd: [{ poly: [[350, 498], [377, 498], [377, 690], [342, 692], [336, 650], [346, 600]], ground: 'grass' }],
    // where the 3D hides the keepsakes: the Crescent Locket's spot in the 2D game is on the lower house's roof (Chris's
    // secret way, October 4); in 3D it lies at the end of that hidden strip. The Forge Horseshoe keeps its nook.
    items: { 'crescent-locket': [358, 676] },
    // the painting's own garden trees that stand close to a path (make-trees.mjs keeps its trees 30 px off the walk):
    // the pine by the bench, the dark fir by the west stairs, the tree by the lower jetty, the lower house's garden
    extraTrees: [[1002, 640, 1.05, 1, 11], [332, 522, 0.78, 1, 12], [118, 690, 0.72, 0, 13], [640, 700, 1.05, 0, 14], [690, 690, 0.85, 1, 15],
      [880, 720, 0.85, 0, 16], [1270, 690, 0.75, 0, 17], [1100, 700, 0.6, 1, 18], [560, 642, 0.7, 0, 19]],
  };
})(window);
