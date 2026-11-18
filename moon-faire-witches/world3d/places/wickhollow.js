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

  // ---- Chris's secret way (October 4), in 3D (walk pass 2): up the old oak at the lower house's north-east corner and along
  // the red roof's ridge. In the 2D game it is the N of narrow strokes drawn over the lower house's roof: the right stroke
  // (the oak, out over the roof), the middle one (down across the roof's slope) and the left one (the ridge, to the gable's
  // peak). In 3D they are walked as drawn, each at its own height over the roof: the oak's branch (the right stroke) and a
  // ladder laid up the roof from its end (the middle one) to a walk of planks along the ridge (the left one). The way up to
  // the branch is the oak's long limb, which comes down to the ground along the house's back wall at its north-west corner.
  // The lower house is built in two halves for it: the front half (y 580 to 712) is the engine's building; the back half
  // (y 474 to 580), with the same walls, gable and roof, is built in extra, so the strokes over it aren't inside a footprint.
  const LOW = ground(462, 716);                                              // the lower house's floor (-1.6, the gardens' level)
  const LH = { x0: 378, y0: 474, x1: 546, y1: 712, split: 580, E: LOW + 3.2 + 2.5, rise: 4.4, over: 0.45 };
  const WAY = {
    ridge: LH.E + LH.rise + 0.2,                // the planks' tops along the ridge (8.7)
    fork: 6.0,                                  // the oak's fork, and the branch out over the roof (the roof under it is 5.9 at most)
    limb: [378, 466, 505, 474],                 // the limb's walkable band: from the ground at x 380 up to the fork at x 505
    forkR: [505, 466, 532, 484],                // the fork, where the limb meets the branch
    ridgeX: [446, 476], ridgeY0: 480,           // the ridge walk's band, from 480 (six pixels in from the back wall's line)
    branchX: 510, branchY1: 524,                // the branch: the right stroke, x 510 to 533, down to y 524
    foot: [526, 543], head: [478, 492],         // the ladder: its foot on the branch's end, its head on the ridge walk
  };
  const inRect = (r, x, y) => x >= r[0] && x <= r[2] && y >= r[1] && y <= r[3];
  const ladderT = (x, y) => {
    const ax = (WAY.foot[0] - LH.x0) * 0.04, az = WAY.foot[1] * 0.05, bx = (WAY.head[0] - LH.x0) * 0.04 - ax, bz = WAY.head[1] * 0.05 - az;
    return Math.max(0, Math.min(1, (((x - LH.x0) * 0.04 - ax) * bx + (y * 0.05 - az) * bz) / (bx * bx + bz * bz)));
  };
  // where her feet are on the secret way (metres), or null off it
  function wayH(x, y) {
    if (y >= LH.y0 && y < LH.split && x >= LH.x0 && x <= LH.x1) {             // over the back half's roof
      if (x <= WAY.ridgeX[1]) return WAY.ridge;
      if (x >= WAY.branchX && y <= WAY.branchY1) return WAY.fork;
      return WAY.fork + (WAY.ridge - WAY.fork) * ladderT(x, y);
    }
    if (inRect(WAY.forkR, x, y)) return WAY.fork;
    if (x >= WAY.limb[0] && x < WAY.limb[2] && y >= WAY.limb[1] && y < WAY.limb[3]) return WAY.fork * Math.max(0, Math.min(1, (x - 380) / (WAY.limb[2] - 380)));
    return null;
  }

  P.wickhollow = {
    id: 'wickhollow', name: 'Wickhollow', painting: "art/walk/walk-wickhollow-square.avif", size: [1536, 1024],
    mapId: 'wickhollow', paintingPng: 'reference/art/walk/walk-wickhollow-square.png',
    // the wall check (tools/walls-test.mjs): from where, to each edge and door
    checks: { from: [777, 590], goals: [
      ['the chapel door (north)', 776, 216], ['the forge (north-east)', 1010, 338], ['the bridge to the Thornwood (east edge)', 1530, 375],
      ['the nook behind the bridge house (east)', 1236, 696], ['the south road to Io’s cottage (south edge)', 780, 1018], ['the lower house’s door (south-west)', 464, 716],
      ['the lower jetty (west edge)', 6, 732], ['the lane under the garden fence (south-west)', 300, 830], ['Nettie’s door (north-west)', 366, 392], ['the lane by Nettie’s house (north-west)', 280, 262],
      ['the lower house’s ridge, up the old oak and along the roof (Chris’s secret way)', 460, 568], ['the strip down the lower house’s west side (pocket)', 358, 676]] },
    // the trees from the painting (tools/make-trees.mjs): how dark a patch must be, and where no tree goes
    treeGen: { dark: 0.62, keepOut: [[690, -100, 860, 230]], roads: [[740, 1024, 822, 1800], [1536, 330, 2200, 410], [-600, 700, 0, 770]] },
    // the ground's textures, and how many metres each repeats over
    ground: { cob: 'shared_cobbles_town', grass: 'shared_grass_meadow', dirt: 'shared_dirt_track', pave: 'wick_bridge_paving', rep: [3.2, 4.0, 4.0, 2.6] },
    // each texture: Chris's made one if the page carries it (texture-packs/made/), else the pack's stand-in. Written out in
    // full, so the offline build finds the pictures and puts them inside the file.
    textures: [
      { id: 'shared_cobbles_town', made: "./../texture-packs/made-web/shared_cobbles_town.webp", stand: "./../texture-packs/wickhollow/wickhollow/stand-in/shared_cobbles_town.png" },
      { id: 'shared_grass_meadow', made: "./../texture-packs/made-web/shared_grass_meadow.webp", stand: "./../texture-packs/wickhollow/wickhollow/stand-in/shared_grass_meadow.png" },
      { id: 'shared_roof_tiles_red', made: "./../texture-packs/made-web/shared_roof_tiles_red.webp", stand: "./../texture-packs/wickhollow/wickhollow/stand-in/shared_roof_tiles_red.png" },
      { id: 'shared_stone_wall_rough', made: "./../texture-packs/made-web/shared_stone_wall_rough.webp", stand: "./../texture-packs/wickhollow/wickhollow/stand-in/shared_stone_wall_rough.png" },
      { id: 'wick_bridge_paving', made: "./../texture-packs/made-web/wick_bridge_paving.webp", stand: "./../texture-packs/wickhollow/wickhollow/stand-in/wick_bridge_paving.png" },
      { id: 'wick_wall_timber_plaster', made: "./../texture-packs/made-web/wick_wall_timber_plaster.webp", stand: "./../texture-packs/wickhollow/wickhollow/stand-in/wick_wall_timber_plaster.png" },
      { id: 'shared_boardwalk_planks', made: "./../texture-packs/made-web/shared_boardwalk_planks.webp", stand: "./../texture-packs/wickhollow/jetty/stand-in/shared_boardwalk_planks.png" },
      { id: 'shared_drystone', made: "./../texture-packs/made-web/shared_drystone.webp", stand: "./../texture-packs/wickhollow/jetty/stand-in/shared_drystone.png" },
      { id: 'shared_awning_stripes', made: "./../texture-packs/made-web/shared_awning_stripes.webp", stand: "./../texture-packs/wickhollow/jetty/stand-in/shared_awning_stripes.png" },
      { id: 'shared_water_dark', made: "./../texture-packs/made-web/shared_water_dark.webp", stand: "./../texture-packs/wickhollow/jetty/stand-in/shared_water_dark.png" },
      { id: 'shared_dirt_track', made: "./../texture-packs/made-web/shared_dirt_track.webp", stand: "./../texture-packs/wickhollow/thornwood/stand-in/shared_dirt_track.png" },
      { id: 'shared_water_river', made: "./../texture-packs/made-web/shared_water_river.webp", stand: "./../texture-packs/wickhollow/thornwood/stand-in/shared_water_river.png" },
      { id: 'wick_leaf_canopy', made: "./../texture-packs/made-web/wick_leaf_canopy.webp", stand: "./../texture-packs/wickhollow/cottage/stand-in/wick_leaf_canopy.png" },
      { id: 'shared_bark_oak', made: "./../texture-packs/made-web/shared_bark_oak.webp", stand: "./../texture-packs/wickhollow/cottage/stand-in/shared_bark_oak.png" },
      { id: 'thorn_rock_mossy', made: "./../texture-packs/made-web/thorn_rock_mossy.webp", stand: "./../texture-packs/wickhollow/thornwood/stand-in/thorn_rock_mossy.png" },
    ],
    ground_h: ground,
    // where Io's feet stand: the ground, or a deck over the water
    walk_h(x, y) {
      const w = wayH(x, y); if (w != null) return w;
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
      // (walk pass 2: Nettie's west wall two pixels east and her wing's front two pixels north, so the window sills on them
      // don't stand over the lane and the square's edge)
      { id: 'nettie', name: 'Nettie’s house', fp: [300, 238, 430, 388], walls: [{ t: 'stone', h: 3.1 }, { t: 'timber', h: 2.7 }], roof: { ridge: 'ns', rise: 4.6, over: 0.45 },
        doors: [{ side: 's', x: 366, w: 1.5, h: 2.5, arch: true, double: true }],
        windows: [{ side: 's', x: 366, y: 3.6, w: 1.3, h: 1.2 }, { side: 's', x: 366, y: 7.0, w: 0.6, h: 0.7 }, { side: 'w', y: 300, z: 1.2, w: 0.8, h: 1.0 }, { side: 'w', y: 330, z: 3.8, w: 0.8, h: 1.0 }],
        lanterns: [{ side: 's', x: 327, y: 2.4 }, { side: 's', x: 405, y: 2.4 }, { side: 'w', y: 372, y2: 2.4 }],
        chimneys: [{ x: 425, y: 300, w: 0.9, d: 0.9, h: 2.4 }], beams: true },
      { id: 'nettie-wing', fp: [430, 250, 552, 370], walls: [{ t: 'stone', h: 3.1 }, { t: 'timber', h: 2.4 }], roof: { ridge: 'ew', rise: 3.4, over: 0.45 },
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
        windows: [{ side: 's', x: 1158, y: 4.0, w: 0.8, h: 0.9 }],   // (its hearth is built in extra, set into the wall)
        lanterns: [{ side: 's', x: 1110, y: 2.6 }], chimneys: [{ x: 1152, y: 230, w: 1.1, d: 1.1, h: 4.0 }], beams: true, sign: [1240, 338] },
      { id: 'east-a', name: 'the house by the bridge', fp: [1086, 418, 1162, 600], walls: [{ t: 'stone', h: 3.0 }, { t: 'timber', h: 2.4 }], roof: { ridge: 'ew', rise: 3.2, over: 0.45 },
        doors: [{ side: 's', x: 1140, w: 1.1, h: 2.3, red: true }], windows: [{ side: 's', x: 1110, y: 3.5, w: 0.8, h: 1.0 }, { side: 'w', y: 515, z: 3.6, w: 0.8, h: 1.0 }, { side: 'w', y: 560, z: 1.1, w: 0.8, h: 1.0 }],
        lanterns: [{ side: 's', x: 1122, y: 2.4 }] },
      { id: 'east-b', fp: [1162, 418, 1254, 652], walls: [{ t: 'stone', h: 3.0 }, { t: 'timber', h: 2.6 }], roof: { ridge: 'ns', rise: 3.8, over: 0.45 },
        windows: [{ side: 's', x: 1198, y: 1.1, w: 0.85, h: 1.05 }, { side: 's', x: 1198, y: 3.6, w: 0.85, h: 1.1 }, { side: 'w', y: 600, z: 3.6, w: 0.7, h: 0.9 }],
        chimneys: [{ x: 1236, y: 470, w: 0.8, d: 0.8, h: 2.6 }], roses: true },
      // the lower house's front half (walk pass 2): its back half, y 474 to 580, is built in extra with the same walls and roof,
      // so the secret way's strokes over it can be walked; its chimney is there, and its west window and dormer are here, at 596
      { id: 'lower', name: 'the lower house', fp: [378, 580, 546, 712], walls: [{ t: 'stone', h: 3.2 }, { t: 'timber', h: 2.5 }], roof: { ridge: 'ns', rise: 4.4, over: 0.45 },
        doors: [{ side: 's', x: 464, w: 1.2, h: 2.3, arch: true }],
        windows: [{ side: 's', x: 386, y: 1.1, w: 0.9, h: 1.1 }, { side: 's', x: 530, y: 1.1, w: 0.9, h: 1.1 }, { side: 's', x: 464, y: 3.7, w: 1.0, h: 1.1 }, { side: 'w', y: 596, z: 3.7, w: 0.8, h: 0.9 }],
        lanterns: [{ side: 's', x: 436, y: 2.3 }, { side: 's', x: 492, y: 2.3 }], beams: true, dormers: [{ side: 'w', y: 596, w: 1.2 }] },
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
      { r: [190, 548, 252, 638], down: 's', n: 9, cheeks: [true, false] },   // (walk pass 2: open on the east, where the 2D walk goes on
      // down beside the steps, past the lamp, on ground as high as the treads)
      { r: [208, 742, 266, 774], down: 's', n: 3 },
      { r: [738, 222, 814, 294], down: 's', n: 6 },
      { r: [446, 712, 486, 724], down: 's', n: 1 },
    ],
    // the Moonwell: its ring of low wall and flower beds (open to the south), the well, its iron arch and lantern
    moonwell: { c: [777, 458], ring: [3.35, 4.85], gap: 0.36, well: 1.45, wellH: 0.95, benches: [{ a: Math.PI }, { a: 0 }] },
    // lamps: an iron post (`post`), a stone pillar with a lantern (`pillar`), or a lantern on a wall (in `buildings`)
    lamps: [
      // (walk pass 2: the lamps the walking map has blocks for stand in the middle of their blocks, a few pixels north of where
      // they stood; the one by the steps to the lower jetty off the walk's corner, the one at the lane's head just north of it)
      { at: [659, 389], kind: 'post' }, { at: [904, 389], kind: 'post' }, { at: [640, 592], kind: 'post' }, { at: [914, 592], kind: 'post' },
      { at: [260, 587], kind: 'post' }, { at: [628, 256], kind: 'post' }, { at: [910, 256], kind: 'post' },
      { at: [182, 484], kind: 'post', y: 0 }, { at: [199, 747], kind: 'post' }, { at: [46, 700], kind: 'post', y: -1.22, short: true },
      { at: [735, 765], kind: 'post' }, { at: [735, 912], kind: 'post' }, { at: [826, 730], kind: 'post' },
      { at: [1347, 328], kind: 'pillar' }, { at: [1505, 328], kind: 'pillar' }, { at: [1347, 436], kind: 'pillar' }, { at: [1505, 436], kind: 'pillar' },
      { at: [290, 248], kind: 'post' },
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
      // (walk pass 2: the barrels by the forge, by Nettie's door, the crates by her stall and the pots by the Moonwell and the
      // lower house's door a few pixels off the 2D walk; the crates that stood on the street before the stall, where the
      // painting has none, are gone)
      { k: 'anvil', at: [1026, 318] }, { k: 'barrel', at: [968, 322] }, { k: 'barrel', at: [1060, 328] }, { k: 'barrel', at: [1082, 358] }, { k: 'barrel', at: [1096, 370] },
      { k: 'barrel', at: [214, 482], y: 0 }, { k: 'barrel', at: [431, 402] }, { k: 'barrel', at: [1088, 840] },
      { k: 'crates', at: [208, 360], y: 0 }, { k: 'crates', at: [120, 410], y: 0 }, { k: 'crates', at: [200, 488], y: 0 }, { k: 'crates', at: [534, 398] },
      { k: 'pot', at: [727, 546] }, { k: 'pot', at: [826, 546] }, { k: 'pot', at: [320, 396] }, { k: 'pot', at: [410, 400] }, { k: 'pot', at: [1112, 612] }, { k: 'pot', at: [1050, 530] },
      { k: 'pot', at: [424, 718] }, { k: 'pot', at: [508, 720] }, { k: 'pot', at: [960, 850] }, { k: 'pot', at: [1000, 852] },
      { k: 'statue', at: [1102, 712] },
      { k: 'grave', at: [578, 78], cross: true }, { k: 'grave', at: [624, 74] }, { k: 'grave', at: [652, 108] }, { k: 'grave', at: [566, 126] }, { k: 'grave', at: [612, 150] }, { k: 'grave', at: [680, 150] },
      { k: 'grave', at: [948, 70] }, { k: 'grave', at: [976, 102], cross: true }, { k: 'grave', at: [904, 146] }, { k: 'grave', at: [962, 146] }, { k: 'grave', at: [880, 70] },
      { k: 'post', at: [706, 236], h: 2.2 }, { k: 'post', at: [846, 236], h: 2.2 }, { k: 'post', at: [702, 248], h: 1.6 }, { k: 'post', at: [848, 248], h: 1.6 },
      { k: 'sunflowers', at: [1124, 880] },
    ],
    // flower beds and bushes: [x, y, radius in metres, colours] (walk pass 2: the white bush at the lower house's north-west
    // corner a little smaller and just south of the square's walk, where it still closes the north end of the pocket down the
    // house's west side, with the dark fir; the small one by the bridge house three pixels north)
    flowers: [
      [612, 268, 1.0, 'mix'], [656, 266, 1.1, 'white'], [884, 266, 1.1, 'white'], [936, 268, 0.9, 'mix'], [722, 252, 0.7, 'mix'], [828, 252, 0.7, 'mix'],
      [1046, 150, 1.8, 'white'], [590, 168, 1.2, 'mix'], [990, 140, 1.4, 'white'],
      [392, 383, 0.45, 'mix'], [342, 383, 0.45, 'mix'], [514, 382, 0.6, 'mix'], [560, 290, 0.8, 'white'], [1278, 702, 1.3, 'white'], [1262, 738, 0.9, 'mix'],
      [322, 590, 0.8, 'white'], [360, 522, 0.8, 'white'], [356, 754, 0.9, 'white'], [342, 740, 1.0, 'violet'], [300, 690, 1.0, 'violet'], [602, 772, 1.0, 'mix'],
      [1180, 880, 1.0, 'mix'], [1060, 890, 1.0, 'violet'], [880, 870, 1.0, 'mix'], [940, 900, 1.1, 'mix'], [1000, 880, 0.9, 'violet'],
      [1060, 524, 0.7, 'mix'], [1062, 543, 0.55, 'mix'], [1170, 600, 0.9, 'mix'], [588, 598, 0.6, 'white'], [565, 600, 0.9, 'mix'],
      [850, 700, 1.1, 'white'], [880, 760, 0.9, 'mix'], [212, 520, 0.8, 'mix'], [1290, 230, 1.2, 'mix'], [1250, 180, 1.0, 'violet'],
    ],
    // the lights for the light map: [x, y, radius px, strength, colour]. The lamps' own are added from `lamps`.
    lights: [
      [1158, 352, 150, 1.5, 'forge'], [1010, 318, 80, 0.9, 'forge'], [777, 470, 130, 0.9, 'moonwell'], [776, 232, 90, 0.7, 'warm'],
      [366, 410, 70, 0.55, 'warm'], [480, 404, 60, 0.45, 'warm'], [464, 722, 60, 0.5, 'warm'], [972, 856, 60, 0.45, 'warm'], [1140, 618, 50, 0.4, 'warm'],
      [1198, 662, 50, 0.35, 'warm'], [1042, 852, 50, 0.35, 'warm'], [386, 722, 40, 0.3, 'warm'], [530, 722, 40, 0.3, 'warm'], [560, 404, 70, 0.4, 'warm'],
    ],
    trees: 'wickhollow',
    // the old oak's leaves (it is built in extra, with the secret way): the same leaf texture and tint as the engine's trees
    extraMats: { oakLeaves: { tex: 'wick_leaf_canopy', rep: 1, tint: 0xd8ffee, shade: 0.55 } },
    // pockets to find, past the 2D walk: a strip of garden down the lower house's west side, behind the white bush
    walkAdd: [{ poly: [[350, 534], [377, 534], [377, 690], [342, 692], [336, 650], [346, 600]], ground: 'grass' }],   // (from 534, south of the bush)
    // where the 3D hides the keepsakes: the Crescent Locket's spot in the 2D game is on the lower house's roof (Chris's
    // secret way, October 4); in 3D it lies at the end of that hidden strip. The Forge Horseshoe keeps its nook.
    items: { 'crescent-locket': [358, 676] },
    // the painting's own garden trees that stand close to a path (make-trees.mjs keeps its trees 30 px off the walk):
    // the pine by the bench, the dark fir by the west stairs, the tree by the lower jetty, the lower house's garden
    extraTrees: [[1002, 640, 1.05, 1, 11], [332, 522, 0.78, 1, 12], [118, 690, 0.72, 0, 13], [640, 700, 1.05, 0, 14], [690, 690, 0.85, 1, 15],
      [880, 720, 0.85, 0, 16], [1270, 690, 0.75, 0, 17], [1100, 700, 0.6, 1, 18], [560, 642, 0.7, 0, 19]],

    extra(K) {
      const { B, X, Z } = K, T3 = G.THREE, UP = new T3.Vector3(0, 1, 0);
      const BARK = [0.62, 0.52, 0.5], PLANK = [0.72, 0.6, 0.52];
      // a round length of wood from a to b (metres), r0 thick at a and r1 at b
      const cyl = new T3.CylinderGeometry(1, 1, 1, 8, 1, true); cyl.translate(0, 0.5, 0);
      const pole = (k, a, b, r0, r1, col) => {
        const d = new T3.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), L = d.length(), g = new T3.CylinderGeometry(r1, r0, 1, 8, 1, true); g.translate(0, 0.5, 0);
        B.geom(k, g, new T3.Matrix4().compose(new T3.Vector3(a[0], a[1], a[2]), new T3.Quaternion().setFromUnitVectors(UP, d.normalize()), new T3.Vector3(1, L, 1)), col, [1.2, L / 1.5]); g.dispose();
      };
      // a flat board from a to b (metres, its top's middle line), w wide, t thick, lying level across
      const board = (k, a, b, w, t, col) => {
        const d = new T3.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), L = d.length(), g = new T3.BoxGeometry(w, t, L); g.translate(0, -t / 2, L / 2);
        const yaw = Math.atan2(d.x, d.z), pitch = -Math.asin(d.y / L);
        B.geom(k, g, new T3.Matrix4().compose(new T3.Vector3(a[0], a[1], a[2]), new T3.Quaternion().setFromEuler(new T3.Euler(pitch, yaw, 0, 'YXZ')), new T3.Vector3(1, 1, 1)), col, [w, L]); g.dispose();
      };
      B.solid = false;   // everything here is walked on or over; where she can't go is blocked below, cell by cell

      // ---- Hilde's hearth, set into the forge's front wall (walk pass 2): the engine's stood 0.6 m out from the wall, over the
      // 2D walk, where the painting's hearth is an arch in the wall. Its stone surround, the fire's glow and flames, a low
      // hearthstone in front, and the fire's light ----
      {
        const hx = X(1158), z1 = Z(359), g = K.gh(1158, 363), hw = 2.6, hh = 2.5;
        B.box('stone', hx, g, z1 - 0.25, hw + 0.9, hh + 0.7, 0.6, 0, [0.9, 0.86, 0.86]);
        B.quad('glass', [hx - hw / 2, g + 0.1, z1 + 0.06], [hx + hw / 2, g + 0.1, z1 + 0.06], [hx + hw / 2, g + hh, z1 + 0.06], [hx - hw / 2, g + hh, z1 + 0.06], [0, 0, 1, 1], [0.32, 0.1, 0.05]);
        B.box('glass', hx, g + 0.1, z1 + 0.02, hw * 0.7, 0.55, 0.22, 0, [2.0, 0.95, 0.35]);
        B.box('stone', hx, g - 0.1, z1 + 0.45, hw + 0.5, 0.2, 0.8, 0, [0.7, 0.66, 0.66]);
        K.halo(hx, g + 0.6, z1 + 0.5, 3.2, [1.0, 0.52, 0.22]); K.lamps3d.push({ x: hx, y: g + 0.8, z: z1 + 0.8, c: 0xff7a30, k: 2.2 });
      }

      // ---- the lower house's back half (y 474 to 580): the same walls, north gable, roof and ridge as the engine's front half,
      // which runs on south from 580 (each texture carries on across the join) ----
      const x0 = X(LH.x0), x1 = X(LH.x1), zN = Z(LH.y0), zS = Z(LH.split), cx = (x0 + x1) / 2, w = x1 - x0, E = LH.E, rise = LH.rise, o = LH.over;
      const lo = LOW - 0.3, mid = LOW + 3.2, dB = zS - zN, dF = Z(LH.y1) - zS;
      // (the reskin job, November 17: each wall's picture is laid as the engine lays the front half's, K.layWall with that
      // building's own starts, so the stone carries on across the join and the timber frame's bays are whole; and the
      // timber storey's corner posts and beams go round the back half too)
      const LY = K.lays.lower || {}, WR = K.wear.lower || {};   // (and the pictures the front half wears)
      for (const [k, ya, yb] of [[WR.stone || 'stone', lo, mid], [WR.timber || 'timber', mid, E]]) {
        B.quad(k, [x1, ya, zN], [x0, ya, zN], [x0, yb, zN], [x1, yb, zN], K.layWall(k, w, ya, yb, LY.n));              // the back wall
        B.quad(k, [x0, ya, zN], [x0, ya, zS], [x0, yb, zS], [x0, yb, zN], K.layWall(k, dB, ya, yb, LY.w, -dB));       // the west wall's back half
        B.quad(k, [x1, ya, zS], [x1, ya, zN], [x1, yb, zN], [x1, yb, zS], K.layWall(k, dB, ya, yb, LY.e, dF));        // the east wall's back half
      }
      {
        const gk = WR.gable || 'timber', q = K.layWall(gk, w, E, E + (E - mid), LY.n), vk = (q[3] - q[1]) / (E - mid);
        B.tri(gk, [x1, E, zN], [x0, E, zN], [cx, E + rise, zN], [[q[0], q[1]], [q[2], q[1]], [(q[0] + q[2]) / 2, q[1] + rise * vk]]);
        const POST = K.have('shared_beam_oak') ? [1, 1, 1] : [0.95, 0.9, 0.9];
        for (const qx of [x0, x1]) B.box('post', qx, mid, zN, 0.26, E - mid, 0.26, 0, POST);
        for (const yb of [mid - 0.1, E - 0.12]) {
          B.box('beam', cx, yb, zN - 0.03, w + 0.3, 0.22, 0.14, 0, POST);
          B.box('beam', x1 + 0.03, yb, (zN + zS) / 2, 0.14, 0.22, dB, 0, POST); B.box('beam', x0 - 0.03, yb, (zN + zS) / 2, 0.14, 0.22, dB, 0, POST);
        }
      }
      {
        const sl = rise / (w / 2), ye = E - o * sl, yr = E + rise, za = zN - o, zb = zS - o, len = Math.hypot(w / 2 + o, rise + o * sl), LF = dF + 2 * o;
        B.quad('roof', [x0 - o, ye, za], [x0 - o, ye, zb], [cx, yr, zb], [cx, yr, za], [-dB, 0, 0, len]);
        B.quad('roof', [x1 + o, ye, zb], [x1 + o, ye, za], [cx, yr, za], [cx, yr, zb], [LF, 0, LF + dB, len]);
        B.box('roof', cx, yr - 0.08, (za + zb) / 2, 0.22, 0.2, zb - za, 0, [0.7, 0.66, 0.66]);
        // its chimney, on the west slope (where the painting has the house's other chimney), clear of the strokes
        const chx = X(420), chz = Z(492), ry = E + rise * (1 - Math.abs(chx - cx) / (w / 2));
        B.box('stone', chx, ry - 1.2, chz, 0.6, 1.2 + 0.7 + 1.05, 0.6, 0, [0.9, 0.88, 0.92]);
        B.box('stone', chx, ry + 0.7 + 1.05, chz, 0.76, 0.14, 0.76, 0, [0.6, 0.58, 0.62]);
      }
      K.shadeMarks.push(['rect', LH.x0, LH.y0, LH.x1, LH.split, 0.62]);

      // ---- the old oak at the house's north-east corner: its trunk, its fork at 6 m, and its crown over the corner ----
      // (its trunk stands just north of the fork's boards, its roots and upper limbs away from them, the crown over the corner)
      const tx = X(520), tz = Z(461), F = WAY.fork;
      pole('bark', [tx, -0.4, tz], [tx - 0.08, F - 0.15, tz + 0.08], 0.4, 0.33, BARK);
      for (const [dx, dz] of [[-0.55, 0.05], [-0.25, -0.22], [0.3, -0.2], [0.36, 0.08]]) pole('bark', [tx + dx, -0.3, tz + dz], [tx + dx * 0.2, 1.0, tz + dz * 0.2], 0.12, 0.24, BARK);
      for (const [dx, dy, dz, r] of [[0.8, 3.4, -1.0, 0.2], [0.2, 4.2, -1.4, 0.17], [1.3, 3.0, -0.3, 0.18], [-0.5, 3.8, -1.1, 0.16]]) pole('bark', [tx - 0.05, F - 0.6, tz - 0.05], [tx + dx, F + dy, tz + dz], 0.24, r, BARK);
      const leafCol = (cy, h) => (v) => { const t = Math.max(0, Math.min(1, (v.y - cy) / h * 0.5 + 0.5)), k = 0.42 + 0.68 * t; return [k * 0.95, k, k * 1.02]; };
      for (const [dx, dy, dz, r] of [[0.8, 9.6, -1.1, 2.3], [0.2, 10.4, -2.0, 2.0], [1.9, 8.9, -0.2, 1.8], [-0.9, 9.4, -1.5, 1.6], [1.4, 10.6, -2.7, 1.7]])
        B.geom('oakLeaves', K.ico[Math.abs(Math.round(dx * 3 + dz)) % 3], new T3.Matrix4().compose(new T3.Vector3(tx + dx, dy, tz + dz), new T3.Quaternion().setFromEuler(new T3.Euler(0.3, dx, 0)), new T3.Vector3(r, r * 0.82, r)), leafCol(dy, r * 0.82), 2.6);

      // ---- the limb: from the fork down west along the back wall, its tip on the ground at the house's north-west corner;
      // knots and old nailed slats on it every few steps for her feet ----
      const lz = Z(470), limbTop = (px) => F * Math.max(0, Math.min(1, (px - 380) / (WAY.limb[2] - 380)));
      pole('bark', [X(WAY.limb[2] + 6), F - 0.32, lz], [X(376), -0.22, lz], 0.32, 0.17, BARK);
      for (let px = 392; px < WAY.limb[2]; px += 7) B.box('wood', X(px), limbTop(px) - 0.07, lz, 0.1, 0.07, 0.42, 0, PLANK);
      // the fork: a few boards across it, where the limb meets the branch
      board('wood', [X(506), F, Z(475)], [X(531), F, Z(475)], 0.62, 0.07, PLANK);
      // ---- the branch: from the fork south over the roof's east slope, boards laid along it ----
      pole('bark', [X(522), F - 0.27, Z(468)], [X(521), F - 0.3, Z(528)], 0.28, 0.2, BARK);
      board('wood', [X(512.5), F, Z(476)], [X(512.5), F, Z(526)], 0.3, 0.06, PLANK);
      board('wood', [X(530.5), F, Z(476)], [X(530.5), F, Z(526)], 0.3, 0.06, PLANK);
      board('wood', [X(521.5), F, Z(476)], [X(521.5), F, Z(526)], 0.3, 0.06, PLANK);
      // ---- the ladder: its foot on the branch's end, its head on the ridge walk; two rails and rungs ----
      {
        const fa = [X(WAY.foot[0]), F, Z(WAY.foot[1])], fb = [X(WAY.head[0]), WAY.ridge, Z(WAY.head[1])];
        const d = [fb[0] - fa[0], fb[1] - fa[1], fb[2] - fa[2]], L = Math.hypot(...d), side = [-d[2], 0, d[0]], sL = Math.hypot(side[0], side[2]), sd = [side[0] / sL, 0, side[2] / sL];
        for (const s_ of [-0.27, 0.27]) board('wood', [fa[0] + sd[0] * s_, fa[1] - 0.04, fa[2] + sd[2] * s_], [fb[0] + sd[0] * s_, fb[1] - 0.04, fb[2] + sd[2] * s_], 0.08, 0.12, [0.66, 0.54, 0.46]);
        for (let t = 0.04; t < 1; t += 0.3 / L) { const p = [fa[0] + d[0] * t, fa[1] + d[1] * t, fa[2] + d[2] * t]; board('wood', [p[0] - sd[0] * 0.3, p[1], p[2] - sd[2] * 0.3], [p[0] + sd[0] * 0.3, p[1], p[2] + sd[2] * 0.3], 0.07, 0.05, PLANK); }
        // a board along its middle under the rungs, so her feet are on wood all the way
        board('wood', [fa[0], fa[1] - 0.05, fa[2]], [fb[0], fb[1] - 0.05, fb[2]], 0.34, 0.04, [0.6, 0.5, 0.44]);
      }
      // ---- the ridge walk: planks along the ridge's top on little trestles, from the back gable to the front half's ridge ----
      {
        const rx = X(461), r0 = Z(WAY.ridgeY0 + 1), r1 = Z(LH.split - 2), yr = E + rise;
        board('wood', [rx, WAY.ridge, r0], [rx, WAY.ridge, r1], 0.82, 0.07, PLANK);
        for (let z = r0 + 0.3; z < r1; z += 1.2) for (const sx of [-1, 1]) pole('wood', [rx + sx * 0.36, yr - 0.5, z], [rx + sx * 0.36, WAY.ridge - 0.07, z], 0.05, 0.05, [0.55, 0.45, 0.4]);
      }

      // ---- where she can't go on and round the secret way: the house's back half but for the three strokes (each at its own
      // height), and a band of the square's edge along the limb and round the oak's foot, so nobody steps from the cobbles up
      // onto the limb or the fork. Blocked cell by cell (2 px, on the walk grid's own cells), in runs ----
      const MAP = (G.MAPS || {}).wickhollow, inP = W3D.inPoly;
      const on2D = (x, y) => MAP.walk.some((p) => inP(p, x, y)) && !MAP.block.some((p) => inP(p, x, y));
      const open = (x, y) => {
        if (inRect(WAY.forkR, x, y)) return true;
        if (x >= WAY.limb[0] && x < WAY.limb[2] && y >= WAY.limb[1] && y < WAY.limb[3]) return true;
        if (y >= LH.y0 && y < LH.split && x >= LH.x0 && x <= LH.x1) return (y >= WAY.ridgeY0 || x >= WAY.branchX) && on2D(x, y);
        return false;
      };
      // (the bands round the limb and the oak's foot are 8 or 9 px: further than her feet can reach across in a step)
      // (every zone's corners are even, on the grid's own cells)
      const ZONES = [[LH.x0, LH.y0, LH.x1, LH.split], [378, 458, 506, 466], [506, 456, 534, 466], [532, 456, 542, 484]];   // the house, the limb's north side, the oak's foot (north, east)
      for (const [a, b, c, d] of ZONES) for (let y = b; y < d; y += 2) {
        let run = null;
        for (let x = a; x < c; x += 2) {
          const shut = !open(x + 1, y + 1);
          if (shut && run == null) run = x;
          if (!shut && run != null) { K.addBlock(W3D.rectPoly([run, y, x, y + 2])); run = null; }
        }
        if (run != null) K.addBlock(W3D.rectPoly([run, y, c, y + 2]));
      }
      B.solid = true;
      cyl.dispose();
    },
  };
})(window);
