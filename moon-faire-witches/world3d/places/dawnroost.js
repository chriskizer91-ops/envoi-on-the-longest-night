// dawnroost.js: Dawnroost, the Warden waystation, in 3D, laid out on its painting (reference/art/walk/walk-dawnroost.png,
// 1536 x 1024) in the painting's own pixels, as src/game/maps.js keeps the walking map. Where Io can walk is that map's own
// walk and block areas, unchanged (MAPS.dawnroost); everything here stands round them, plus two pockets of its own.
// The texture ids are the texture pack's (texture-packs/bogmire-dawnroost/dawnroost/inventory.md).
// A walled yard on a wooded hill: the curtain walls with their towers and merlons, the north gate up to the living node,
// the round tower, the main gate out to the forest road, the Warden hall, the stables, the cottage, the forge, the yard
// well, and through the gateway in the east wall the dock where the Magpie ties up (her mooring kept clear).
// Heights are metres: the yard is 0. The painting looks down at a slant, so a tall thing's foot is lower in it than its top:
// each wall stands where its foot is painted, not its merlons. Past the walls the hill falls away (to the forest road in
// the south, down to the dark water in the east) and rises in the north toward the living node.
(function (G) {
  'use strict';
  const P = G.W3D_PLACES = G.W3D_PLACES || {};
  const ss = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
  const inPoly = (poly, x, y) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
  const SX = 0.04, SZ = 0.05;   // metres a pixel, across and down (as the engine's map)

  // ---- the ground: flat inside the walls; past each wall's outer face the hill falls away, and rises to the north ----
  function ground(x, y) {
    let h = 0;
    if (y < 130) h += 1.3 * ss(130, -80, y) * (1 - ss(1120, 1260, x));                    // up toward the living node
    const dW = (66 - x) * SX;                                                              // past the west wall
    const dS = (y - 832) * SZ;                                                             // past the south wall
    const dE = (x - 1300) * SX;                                                            // past the east wall, to the water
    const dSW = (-(x - 86) * SX * 0.7932 + (y - 632) * SZ * 0.6089) - 0.8;                 // past the south-west wall
    const dSE = ((x - 1170) * SX * 0.4504 + (y - 812) * SZ * 0.8929) - 1.0;                // past the south-east wall
    h -= Math.max(2.4 * ss(0, 6, dW), 2.8 * ss(0, 12, dS), 2.4 * ss(0, 6, dSW), 3.1 * ss(0, 2.5, dE), 2.6 * ss(0, 6, dSE));
    return h;
  }

  // ---- the dock: a timber deck on posts over the water, level with the gateway ----
  const DECK = [[1294, 194], [1426, 194], [1508, 256], [1508, 406], [1294, 406]];
  const DECK_Y = 0.05;
  // the dark water at the top right, round and under the dock (it goes on past the painting's edge)
  const WATER = [[1330, 210], [1332, 140], [1385, 118], [1432, 62], [1438, -420], [2000, -420], [2000, 640], [1700, 600], [1536, 560],
    [1470, 526], [1400, 522], [1340, 496], [1330, 440]];

  // ---- pocket one: the stair up the inside of the north wall, from the back lane behind the Warden hall (its foot tucked
  // in the corner by the north gate's west tower, behind a flowering bush), to the wall-walk; its west end is the
  // kettle-helm's ----
  const WALL_TOP = 4.6;                              // the curtain walls' top, where the wall-walk is
  const STAIR = { x0: 300, x1: 498, n: 23 };          // the treads climb west from x1 (foot) to x0 (top), against the wall
  const STAIR_RUN = (STAIR.x1 - STAIR.x0) / STAIR.n, STAIR_RISE = WALL_TOP / STAIR.n;
  // the two walls under the wall-walk, 2 m thick: the north-west one (from the corner pier at A to B) and the north one
  // from B to WW_EAST (past it the north wall is built whole). Each is two solid faces 0.4 m thick with the walk between
  // them (k from -0.6 to 0.6 m across the wall), so Io can't step onto it from the ground or off it into the air.
  const CH_A = [86, 186], CH_B = [225, 150], WW_EAST = 318, NORTH_Y = 150;
  const CH_D = (() => { const dx = (CH_B[0] - CH_A[0]) * SX, dz = (CH_B[1] - CH_A[1]) * SZ, L = Math.hypot(dx, dz); return { L, d: [dx / L, dz / L], n: [-dz / L, dx / L] }; })();
  const chPt = (s, k) => [CH_A[0] + (CH_D.d[0] * s + CH_D.n[0] * k) / SX, CH_A[1] + (CH_D.d[1] * s + CH_D.n[1] * k) / SZ];
  const WALLWALK = [chPt(0.95, -0.6), chPt(CH_D.L, -0.6), [WW_EAST, NORTH_Y - 12], [WW_EAST, 194], [298, 194], [298, NORTH_Y + 12], chPt(CH_D.L, 0.6), chPt(0.95, 0.6)];
  const STAIRBAND = [[298, 172], [498, 172], [498, 194], [298, 194]];
  const LANDING = [[496, 170], [518, 170], [518, 208], [496, 208]];
  // the forge's floor, under its roof, inside its walls (the forge is open at the front: Io can walk in to the hearth)
  const FORGE = { x0: 992, y0: 532, x1: 1196, y1: 664, E: 3.0, rise: 2.4, over: 0.5 };
  const FORGE_FLOOR = [[1001, 540], [1187, 540], [1187, 664], [1001, 664]];
  // pocket two: the cottage's front garden, through a gap in the hedge beside the main gate's west tower
  const GARDEN_WAY = [[588, 676], [588, 700], [520, 700], [520, 676]];
  const GARDEN = [[524, 676], [524, 774], [366, 774], [366, 682], [400, 682], [400, 694], [506, 694], [506, 676]];

  // where Io's feet stand: the wall-walk, the stair's treads, the dock's deck, or the ground (the engine lays its own
  // gentle unevenness on that, away from the walk)
  function walkH(x, y) {
    if (inPoly(WALLWALK, x, y)) return WALL_TOP;
    if (x >= STAIR.x0 - 2 && x <= STAIR.x1 && y >= 168 && y <= 198) return Math.min(WALL_TOP, (Math.floor((STAIR.x1 - x) / STAIR_RUN) + 1) * STAIR_RISE);
    if (inPoly(DECK, x, y)) return DECK_Y;
    return ground(x, y);
  }

  // ---- the curtain walls (centre lines, in pixels): their foot where the painting's walls meet the ground ----
  // The engine builds these (P.walls); extra() adds their merlons. The two under the wall-walk are built in extra() (the
  // wall-walk's ground lies on their top).
  const CURTAIN = [
    { id: 'west', pts: [[86, 186], [86, 632]], t: 1.6 },
    { id: 'south-west', pts: [[86, 632], [252, 805]], t: 1.6 },
    { id: 'south, west of the gate', pts: [[252, 812], [526, 812]], t: 2.0 },
    { id: 'south, east of the gate', pts: [[766, 812], [1170, 812]], t: 2.0 },
    { id: 'south-east', pts: [[1170, 812], [1284, 766]], t: 2.0 },
    { id: 'east, south of the gateway', pts: [[1284, 766], [1276, 368]], t: 1.6 },
    { id: 'east, north of the gateway', pts: [[1272, 274], [1272, 150]], t: 2.0 },
    { id: 'east of the round tower', pts: [[1040, 205], [1272, 205]], t: 2.0 },
    { id: 'north, east of the gate', pts: [[702, 150], [960, 150]], t: 2.0 },
  ];
  const WALKWALLS = [
    { id: 'north-west', pts: [CH_A, CH_B], t: 2.0 },
    { id: 'north, under the wall-walk', pts: [CH_B, [WW_EAST, NORTH_Y]], t: 2.0 },
    { id: 'north, west of the gate', pts: [[WW_EAST, NORTH_Y], [536, NORTH_Y]], t: 2.0, whole: true },
  ];

  // things standing where the engine's ground is uneven (away from the 2D walk): extra() sets them on that ground
  const LOOSE = { barrels: [[522, 650], [1008, 414]], crates: [[1050, 412], [732, 360], [300, 650], [314, 618]], pots: [[430, 702], [476, 702]] };
  const LOOSE_FLOWERS = [[380, 708, 0.6, 'mix'], [496, 708, 0.55, 'violet'], [376, 760, 0.6, 'white'], [512, 760, 0.6, 'mix'], [440, 770, 0.5, 'violet'],
    [880, 735, 0.6, 'mix'], [800, 760, 0.55, 'white'], [1000, 760, 0.6, 'violet'], [340, 760, 0.5, 'mix']];

  P.dawnroost = {
    id: 'dawnroost', name: 'Dawnroost', painting: "art/walk/walk-dawnroost.avif", size: [1536, 1024],
    mapId: 'dawnroost', paintingPng: 'reference/art/walk/walk-dawnroost.png',
    // the wall check (tools/walls-test.mjs): from the start on the forest road, to each edge, door, yard and pocket
    checks: { from: [645, 990], goals: [
      ['the north gate, up to the living node (north edge)', 619, 8], ['the forest road (south edge)', 641, 1016],
      ['the Warden hall’s door', 340, 452], ['the lane behind the hall (west end)', 190, 226], ['the weapon racks (west)', 160, 558],
      ['the forecourt by the round tower', 900, 200], ['the stables’ yard', 900, 472], ['the yard well', 788, 640],
      ['the forge’s open front', 1080, 708], ['the lane east of the stables', 1170, 420], ['the dock, the Magpie’s mooring', 1400, 320],
      ['the dock’s east rail', 1484, 330], ['in the forge, by the hearth', 1078, 640],
      ['the wall-walk’s west end (pocket)', 124, 178], ['the cottage garden (pocket)', 392, 756]] },
    // the trees from the painting (tools/make-trees.mjs): no tree on the walls, the towers, the paddock or the dock
    treeGen: { dark: 0.6, fir: 0.5, firSouth: 0.62,
      keepOut: [[60, 100, 1300, 200], [920, 80, 1095, 240], [40, 150, 130, 660], [60, 600, 150, 700], [120, 660, 210, 760], [180, 730, 280, 850],
        [240, 770, 1310, 860], [1235, 130, 1320, 800], [1150, 740, 1310, 840], [1280, 170, 1530, 470], [760, 395, 1135, 462], [500, 680, 800, 860]],
      roads: [[590, -700, 648, 0], [588, 1024, 700, 1800]] },
    // the ground's textures, and how many metres each repeats over
    ground: { cob: 'shared_cobbles_town', grass: 'dawn_grass_flowers', dirt: 'shared_dirt_track', pave: 'stable_straw', rep: [3.2, 3.4, 4.0, 2.4], grassTint: [0.95, 1.0, 1.0] },
    // each texture: Chris's made one if the page carries it (texture-packs/made/), else the pack's stand-in. Written out in
    // full, so the offline build finds the pictures and puts them inside the file.
    textures: [
      { id: 'shared_cobbles_town', made: "./../texture-packs/made/shared_cobbles_town.png", stand: "./../texture-packs/wickhollow/wickhollow/stand-in/shared_cobbles_town.png" },
      { id: 'dawn_grass_flowers', made: "./../texture-packs/made/dawn_grass_flowers.png", stand: "./../texture-packs/bogmire-dawnroost/dawnroost/stand-in/dawn_grass_flowers.png" },
      { id: 'stable_straw', made: "./../texture-packs/made/stable_straw.png", stand: "./../texture-packs/bogmire-dawnroost/dawnroost/stand-in/stable_straw.png" },
      { id: 'shared_wall_castle', made: "./../texture-packs/made/shared_wall_castle.png", stand: "./../texture-packs/bogmire-dawnroost/dawnroost/stand-in/shared_wall_castle.png" },
      { id: 'shared_stone_wall_rough', made: "./../texture-packs/made/shared_stone_wall_rough.png", stand: "./../texture-packs/wickhollow/wickhollow/stand-in/shared_stone_wall_rough.png" },
      { id: 'shared_roof_tiles_red', made: "./../texture-packs/made/shared_roof_tiles_red.png", stand: "./../texture-packs/wickhollow/wickhollow/stand-in/shared_roof_tiles_red.png" },
      { id: 'wick_wall_timber_plaster', made: "./../texture-packs/made/wick_wall_timber_plaster.png", stand: "./../texture-packs/wickhollow/wickhollow/stand-in/wick_wall_timber_plaster.png" },
      { id: 'shared_boardwalk_planks', made: "./../texture-packs/made/shared_boardwalk_planks.png", stand: "./../texture-packs/bogmire-dawnroost/bogmire/stand-in/shared_boardwalk_planks.png" },
      { id: 'shared_water_dark', made: "./../texture-packs/made/shared_water_dark.png", stand: "./../texture-packs/bogmire-dawnroost/bogmire/stand-in/shared_water_dark.png" },
      { id: 'shared_rock_cliff', made: "./../texture-packs/made/shared_rock_cliff.png", stand: "./../texture-packs/arenas/crossroads/stand-in/shared_rock_cliff.png" },
      { id: 'shared_dirt_track', made: "./../texture-packs/made/shared_dirt_track.png", stand: "./../texture-packs/wickhollow/thornwood/stand-in/shared_dirt_track.png" },
      { id: 'wilds_oak_leaves', made: "./../texture-packs/made/wilds_oak_leaves.png", stand: "./../texture-packs/wilds-south/dawnroost-road/stand-in/wilds_oak_leaves.png" },
      { id: 'wilds_fir_boughs', made: "./../texture-packs/made/wilds_fir_boughs.png", stand: "./../texture-packs/wilds-south/dawnroost-road/stand-in/wilds_fir_boughs.png" },
      { id: 'shared_bark_oak', made: "./../texture-packs/made/shared_bark_oak.png", stand: "./../texture-packs/wickhollow/cottage/stand-in/shared_bark_oak.png" },
    ],
    // which texture each kind of surface uses: the hall, the cottage and the forge of rough stone, the curtain walls,
    // towers and gates of dressed castle stone ('dry'), the stall floors of straw ('pave')
    surfaces: { stone: 'shared_stone_wall_rough', dry: 'shared_wall_castle', timber: 'wick_wall_timber_plaster', roof: 'shared_roof_tiles_red',
      planks: 'shared_boardwalk_planks', wood: 'shared_boardwalk_planks', deck: 'shared_boardwalk_planks', pave: 'stable_straw',
      soil: 'shared_dirt_track', rock: 'shared_rock_cliff', leaves: 'wilds_oak_leaves', firs: 'wilds_fir_boughs', bark: 'shared_bark_oak' },
    tints: { leaves: 0xd0f4ea, firs: 0xb8d4cc, bush: 0xd8f8ec },
    ground_h: ground,
    walk_h: walkH,
    water: [{ poly: WATER, level: () => -3.4, tex: 'shared_water_dark', rep: 6, flow: [0.004, 0.002], bed: -5.6 }],
    lawns: [],
    start: [645, 990], startFace: Math.PI,
    // the roads out (the walking map's exits)
    exits: [
      { rect: [590, 0, 648, 18], label: 'The living node' },
      { rect: [592, 1006, 690, 1024], label: 'The forest road' },
    ],

    // ---- the buildings. Footprints in pixels [x0, y0, x1, y1], each just off the walk (the stables' back stops at the
    // lane behind them, so it is shallower than painted); the fronts face south ----
    buildings: [
      { id: 'hall', name: 'the Warden hall', fp: [142, 246, 524, 442], walls: [{ t: 'stone', h: 3.4 }], roof: { ridge: 'ew', rise: 3.6, over: 0.45 },
        doors: [{ side: 's', x: 337, w: 1.5, h: 2.6, arch: true, double: true }],
        windows: [{ side: 's', x: 189, y: 1.0, w: 1.0, h: 1.2 }, { side: 's', x: 472, y: 1.0, w: 1.0, h: 1.2 }, { side: 'w', y: 330, z: 1.1, w: 0.8, h: 1.0, dark: true }],
        lanterns: [{ side: 's', x: 301, y: 2.3 }, { side: 's', x: 373, y: 2.3 }],
        dormers: [{ side: 's', x: 190, w: 1.3 }, { side: 's', x: 265, w: 1.3 }, { side: 's', x: 340, w: 1.3 }, { side: 's', x: 407, w: 1.3 }, { side: 's', x: 472, w: 1.3 }],
        chimneys: [{ x: 225, y: 268, w: 0.95, d: 0.95, h: 8 }, { x: 316, y: 268, w: 0.95, d: 0.95, h: 8 }, { x: 393, y: 268, w: 0.95, d: 0.95, h: 8 }, { x: 481, y: 268, w: 0.95, d: 0.95, h: 8 }] },
      { id: 'stables', name: 'the stables', fp: [762, 266, 1030, 400], walls: [{ t: 'stone', h: 3.2 }], roof: { ridge: 'ew', rise: 2.6, over: 0.5 }, open: 's', posts: [],
        lanterns: [{ side: 's', x: 822, y: 2.85 }, { side: 's', x: 895, y: 2.85 }, { side: 's', x: 970, y: 2.85 }, { side: 's', x: 779, y: 1.9 }, { side: 's', x: 1013, y: 1.9 }],
        chimneys: [{ x: 822, y: 282, w: 0.9, d: 0.9, h: 6 }] },
      { id: 'stables-lean', name: 'the stables’ lean-to', fp: [1032, 296, 1074, 398], walls: [{ t: 'planks', h: 2.4 }], roof: { ridge: 'ns', rise: 0.9, over: 0.3, lean: 'w' },
        doors: [{ side: 's', x: 1053, w: 0.9, h: 1.9, plank: true }] },
      { id: 'cottage', name: 'the cottage', fp: [342, 532, 440, 676], walls: [{ t: 'stone', h: 2.8 }], roof: { ridge: 'ew', rise: 2.4, over: 0.4 },
        windows: [{ side: 's', x: 382, y: 1.0, w: 0.9, h: 1.0 }, { side: 'w', y: 600, z: 1.0, w: 0.7, h: 0.8 }] },
      { id: 'cottage-wing', name: 'the cottage’s front', fp: [400, 532, 506, 690], walls: [{ t: 'stone', h: 2.0 }, { t: 'timber', h: 1.0 }], roof: { ridge: 'ns', rise: 3.0, over: 0.4 },
        doors: [{ side: 's', x: 452, w: 1.1, h: 2.2, arch: true }], lanterns: [{ side: 's', x: 427, y: 1.9 }, { side: 's', x: 477, y: 1.9 }] },
      { id: 'forge-wing', name: 'the forge’s wood store', fp: [1196, 548, 1256, 712], walls: [{ t: 'stone', h: 2.6 }], roof: { ridge: 'ns', rise: 1.4, over: 0.4, lean: 'w' }, open: 's',
        posts: [1200, 1252] },
    ],

    // ---- walls along lines: the curtain walls (the engine builds them; extra() adds merlons, towers, gates), and the
    // paddock's fence (only its line here, for the layout check: extra() builds its posts and rails) ----
    walls: CURTAIN.map((w) => ({ pts: w.pts, h: WALL_TOP, t: w.t, tex: 'dry', drop: true }))
      .concat([{ pts: [[767, 404], [767, 441], [860, 450], [1124, 450]], h: 0, t: 0.15, tex: 'dry' }]),
    // lamps: five of the walking map's seven iron lamp posts (DAWN_LAMPS); the two on the dock's east rail, and the two
    // pillars where the road climbs to the node, are built in extra(), their pools of light kept off the painting's edge
    // (past the edge the light map's last pixels go on for ever)
    lamps: [
      { at: [546, 275], kind: 'post' }, { at: [692, 275], kind: 'post' }, { at: [551, 521], kind: 'post' }, { at: [706, 504], kind: 'post' },
      { at: [1314, 363], kind: 'post' },
    ],
    // small things: barrels, crates, anvils, the barrel and posts on the dock, and the grey boulders of the hillside
    props: [
      { k: 'barrel', at: [240, 455] }, { k: 'barrel', at: [262, 457] }, { k: 'barrel', at: [280, 449] }, { k: 'barrel', at: [396, 455] },
      { k: 'barrel', at: [138, 214] }, { k: 'barrel', at: [160, 222] }, { k: 'barrel', at: [148, 226] },
      { k: 'barrel', at: [118, 552] }, { k: 'barrel', at: [124, 572] },
      { k: 'barrel', at: [722, 392] }, { k: 'barrel', at: [975, 666] }, { k: 'barrel', at: [1237, 297] },
      { k: 'barrel', at: [732, 612] }, { k: 'barrel', at: [1341, 390], y: DECK_Y },
      { k: 'crates', at: [850, 582] },
      { k: 'anvil', at: [1037, 682] }, { k: 'anvil', at: [1128, 688] },
      // the hillside's boulders and cliffs
      ...[[40, 120, 1.8], [118, 70, 1.6], [232, 46, 1.9], [292, 74, 1.5], [452, 26, 1.4], [522, 64, 1.5], [360, 96, 1.2], [1130, 62, 1.6], [1210, 34, 1.8], [1180, 112, 1.3],
        [48, 704, 1.8], [40, 790, 2.0], [92, 860, 2.2], [76, 890, 1.6], [150, 950, 1.5], [24, 1000, 1.8], [250, 946, 1.4], [280, 980, 1.2], [330, 840, 1.0],
        [440, 916, 1.7], [462, 990, 1.8], [534, 920, 1.1], [760, 968, 1.9], [810, 950, 1.6], [860, 990, 1.8], [980, 926, 1.9], [1040, 918, 1.7], [1090, 950, 1.4],
        [1056, 864, 1.1], [1170, 880, 1.8], [1240, 870, 1.6], [1400, 920, 1.9], [1470, 950, 2.0], [1510, 900, 1.6], [1330, 1000, 1.6], [1380, 1010, 1.3],
        [1340, 600, 1.4], [1380, 680, 1.6], [1330, 520, 1.2], [-60, 400, 2.0], [-90, 760, 2.2], [1620, 760, 2.0], [-40, 1100, 2.0], [1600, 1080, 2.0]]
        .map(([x, y, s]) => ({ k: 'rock', at: [x, y], size: s })),
    ],
    // flower beds and flowering bushes: [x, y, radius in metres, colours]
    flowers: [
      [200, 456, 0.6, 'mix'], [470, 460, 0.55, 'mix'], [440, 458, 0.5, 'white'],                     // along the hall's front
      [548, 300, 0.8, 'white'], [550, 360, 0.8, 'mix'], [548, 412, 0.7, 'white'],                    // between the hall and the road
      [528, 173, 0.5, 'mix'],                                                                        // at the stair's foot, hiding it
      [180, 196, 0.5, 'violet'], [760, 175, 0.45, 'white'], [860, 175, 0.45, 'mix'], [700, 175, 0.45, 'mix'],   // along the north wall's foot
      [556, 548, 0.8, 'white'], [558, 592, 0.8, 'white'], [552, 632, 0.75, 'mix'], [546, 656, 0.9, 'white'],   // the hedge by the road, hiding the garden's way in
      [700, 530, 0.7, 'mix'], [708, 586, 0.75, 'white'], [856, 534, 0.6, 'mix'], [854, 592, 0.45, 'violet'], [728, 508, 0.45, 'mix'],   // round the well
      [966, 586, 0.6, 'white'], [962, 630, 0.55, 'mix'], [1170, 520, 0.6, 'mix'],                    // by the forge
      [700, 296, 0.6, 'white'], [690, 360, 0.6, 'mix'], [1100, 400, 0.55, 'white'],                   // by the stables
      [1228, 382, 0.5, 'white'], [1224, 420, 0.5, 'violet'],                                        // by the gateway
      [1100, 750, 0.55, 'mix'],                                                                      // along the south wall's foot
    ],
    // the lights for the light map: [x, y, radius px, strength, colour]. The lamps', lanterns' and windows' own are added.
    lights: [
      [895, 412, 120, 0.3, 'warm'], [337, 470, 90, 0.5, 'warm'], [452, 712, 60, 0.4, 'warm'], [645, 862, 120, 0.5, 'warm'],
    ],
    trees: 'dawnroost',
    // pockets to find, past the 2D walk: the stair up the north wall to the wall-walk (its foot behind a bush in the
    // corner by the north gate's west tower), and the cottage's front garden (through a gap in the hedge by the main gate)
    walkAdd: [
      { poly: LANDING, ground: 'cob' }, { poly: STAIRBAND, ground: 'cob' }, { poly: WALLWALK, ground: 'cob' },
      { poly: GARDEN_WAY, ground: 'dirt' }, { poly: GARDEN, ground: 'grass' }, { poly: FORGE_FLOOR, ground: 'dirt' },
    ],
    // the keepsake that lies here: the kettle-helm, at the west end of the wall-walk above the Wardens' hall (in 3D up on
    // the wall itself; the 2D game keeps it in the lane below). The hall gauntlets are a gift, not in the world.
    items: { 'kettle-helm': [118, 178] },
    // the painting's own trees that stand close to a path (make-trees.mjs keeps its trees 30 px off the walk): the two
    // over the cottage, the pines between the well and the forge, the tree by the forge's wood store
    extraTrees: [[392, 521, 0.62, 0, 21], [466, 521, 0.6, 0, 22], [905, 702, 0.95, 1, 23], [872, 716, 0.8, 1, 24], [808, 716, 0.85, 1, 25], [1222, 522, 0.75, 0, 26]],

    // ---- what the engine has no field for: the merlons, towers and gates, the wall-walk and its stair, the round
    // tower, the banners, the stables' arches, the forge's hearth and chimney, the yard well, the weapon racks and
    // chained posts, the paddock fence, the dock with its crane, the gold-lit cracks down the road, the hillside steps ----
    extra(K) {
      const { B, X, Z, gh } = K, TAU = Math.PI * 2;
      const V = (x, y, z) => new THREE.Vector3(x, y, z);
      const CENTRE = [X(768), Z(470)];
      const WARM = [1.0, 0.72, 0.42];
      // a triangle facing n (both its windings are worked out here)
      const faceTri = (k, a, b, c, n, col) => {
        const e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], e2 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
        const nn = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
        if (nn[0] * n[0] + nn[1] * n[1] + nn[2] * n[2] < 0) B.tri(k, a, c, b, [[0, 0], [0, 1], [1, 0]], col); else B.tri(k, a, b, c, [[0, 0], [1, 0], [0, 1]], col);
      };
      // a round beam from a to b (posts, braces, the crane's arm)
      const beamG = new THREE.CylinderGeometry(1, 1, 1, 6, 1, true); beamG.translate(0, 0.5, 0);
      const beam = (k, a, b, r, col) => { const d = V(b[0] - a[0], b[1] - a[1], b[2] - a[2]), L = d.length(); const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), d.normalize()); B.geom(k, beamG, new THREE.Matrix4().compose(V(a[0], a[1], a[2]), q, V(r, L, r)), col, [1, L]); };
      // a wall's geometry in metres: start, direction, length, its turn, and the normal pointing out of the town
      const wallFrame = (pts, t) => {
        const ax = X(pts[0][0]), az = Z(pts[0][1]), bx = X(pts[1][0]), bz = Z(pts[1][1]), dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz);
        let n = [dz / L, -dx / L]; const mx = (ax + bx) / 2 - CENTRE[0], mz = (az + bz) / 2 - CENTRE[1]; if (n[0] * mx + n[1] * mz < 0) n = [-n[0], -n[1]];
        return { ax, az, bx, bz, dx: dx / L, dz: dz / L, L, ry: Math.atan2(-dz, dx), n, t };
      };
      // merlons along a wall's outer edge, on its top
      const merlons = (f, top, from, to) => {
        const a = from || 0, b = to == null ? f.L : to, m = Math.max(1, Math.floor((b - a) / 1.15));
        for (let j = 0; j < m; j++) { const s = a + (b - a) * (j + 0.5) / m, off = f.t / 2 - 0.22; B.box('dry', f.ax + f.dx * s + f.n[0] * off, top, f.az + f.dz * s + f.n[1] * off, 0.62, 0.72, 0.42, f.ry, [0.92, 0.92, 0.98]); }
      };
      // a whole wall (for the two under the wall-walk): boxes in steps, as the engine builds its walls
      const wallBody = (f, bot, top) => {
        const n = Math.max(1, Math.ceil(f.L / 1.6)), seg = f.L / n;
        for (let i = 0; i < n; i++) { const s = (i + 0.5) * seg; B.box('dry', f.ax + f.dx * s, bot, f.az + f.dz * s, seg + 0.02, top - bot, f.t, f.ry, null, { u0: i * seg }); K.shadeMarks.push(['dot', K.M.px(f.ax + f.dx * s), K.M.py(f.az + f.dz * s), 14, 0.75]); }
      };
      // a square tower or pier (pixels), with merlons round its top
      const tower = (x0, y0, x1, y1, top, merl) => {
        const cx = (X(x0) + X(x1)) / 2, cz = (Z(y0) + Z(y1)) / 2, w = X(x1) - X(x0), d = Z(y1) - Z(y0);
        B.box('dry', cx, -3, cz, w, top + 3, d, 0);
        B.box('dry', cx, top - 0.05, cz, w + 0.16, 0.14, d + 0.16, 0, [0.8, 0.8, 0.86]);
        if (merl !== false) {
          const side = (ax, az, bx, bz, nx, nz) => { const L = Math.hypot(bx - ax, bz - az), m = Math.max(2, Math.round(L / 1.0)), ry = Math.atan2(-(bz - az), bx - ax);
            for (let j = 0; j < m; j++) { const s = (j + 0.5) / m; B.box('dry', ax + (bx - ax) * s - nx * 0.2, top + 0.09, az + (bz - az) * s - nz * 0.2, 0.5, 0.7, 0.36, ry, [0.92, 0.92, 0.98]); } };
          const xa = cx - w / 2, xb = cx + w / 2, za = cz - d / 2, zb = cz + d / 2;
          side(xa, za, xb, za, 0, -1); side(xa, zb, xb, zb, 0, 1); side(xa, za, xa, zb, -1, 0); side(xb, za, xb, zb, 1, 0);
        }
        K.shadeMarks.push(['rect', x0, y0, x1, y1, 0.62]);
        return { cx, cz, w, d, top };
      };
      // a lantern on top of a pier or tower, with its pool of light below
      const topLantern = (px, py, y, light, lx, ly) => { B.box('dry', X(px), y, Z(py), 0.42, 0.25, 0.42, 0, [0.85, 0.85, 0.9]); K.lantern(X(px), y + 0.27, Z(py), null, 1.1); K.light(lx == null ? px : lx, ly == null ? py + 10 : ly, light || 130, 0.95, 'warm'); };
      // a lantern on a wall's face (normal n, metres), with its pool of light
      const wallLantern = (px, py, n, y, light) => { const x = X(px) + n[0] * 0.32, z = Z(py) + n[1] * 0.32; K.lantern(x, y, z, [n[0], 0, n[1]], 0.95); K.light(px + n[0] * 20, py + n[1] * 20, light || 110, 0.85, 'warm'); };
      // a Warden banner: deep blue cloth with a pointed end and a gold sun, on a short iron rod, against a wall facing n
      const BLUE = [0.42, 1.1, 2.9], GOLD = [17, 13.5, 1.6];
      const banner = (px, py, n, top, w, h) => {
        const t = [n[1], -n[0]], c = [X(px) + n[0] * 0.07, Z(py) + n[1] * 0.07], ry = Math.atan2(-t[1], t[0]), y0 = top - h, n3 = [n[0], 0, n[1]];
        B.box('iron', c[0], y0, c[1], w, h, 0.03, ry, BLUE);
        const L = [c[0] - t[0] * w / 2, y0, c[1] - t[1] * w / 2], Rr = [c[0] + t[0] * w / 2, y0, c[1] + t[1] * w / 2], tip = [c[0], y0 - w * 0.42, c[1]];
        faceTri('iron', L, Rr, tip, n3, BLUE); faceTri('iron', L, Rr, tip, [-n[0], 0, -n[1]], BLUE);
        B.box('iron', c[0], top, c[1], w + 0.25, 0.06, 0.06, ry, [1.4, 1.2, 1.0]);
        // the sun: a star of sixteen points round a disc
        const sc = [c[0] + n[0] * 0.025, top - h * 0.45, c[1] + n[1] * 0.025], R0 = w * 0.17, R1 = w * 0.3, R2 = w * 0.2;
        for (let i = 0; i < 16; i++) {
          const a0 = i / 16 * TAU, a1 = (i + 1) / 16 * TAU, r0 = i % 2 ? R2 : R1, r1 = (i + 1) % 2 ? R2 : R1;
          const p = (a, r) => [sc[0] + t[0] * Math.cos(a) * r, sc[1] + Math.sin(a) * r, sc[2] + t[1] * Math.cos(a) * r];
          faceTri('iron', [sc[0], sc[1], sc[2]], p(a0, r0), p(a1, r1), n3, GOLD);
        }
        void R0;
      };

      // ---- the pockets' beds and pots are solid, so Io walks round them (the flowers themselves are in `flowers`) ----
      for (const [px, py, rm] of [[380, 708, 0.6], [496, 708, 0.55], [376, 760, 0.6], [512, 760, 0.6], [440, 770, 0.5], [528, 173, 0.5]]) K.addBlock(K.circlePx(px, py, rm * 0.85, 8));
      for (const [px, py] of [[430, 702], [476, 702]]) K.addBlock(K.circlePx(px, py, 0.3, 8));

      // a stone rim round an arch: a tube along the half circle, centre (cx, cy) metres, in the plane z
      const archRim = (k, cx, cy, z, r, rad, col) => {
        const pts = []; for (let j = 0; j <= 16; j++) { const a = Math.PI * j / 16; pts.push(V(cx - Math.cos(a) * r, cy + Math.sin(a) * r, z)); }
        const tube = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, rad, 5, false); B.geom(k, tube, new THREE.Matrix4(), col || [1.05, 1.02, 1.08], 1); tube.dispose();
      };

      // ---- the curtain walls: merlons on the engine's walls; the two under the wall-walk, whole ----
      for (const w of CURTAIN) merlons(wallFrame(w.pts, w.t), WALL_TOP);
      for (const w of WALKWALLS) {
        const f = wallFrame(w.pts, w.t);
        if (w.whole) { wallBody(f, -2.9, WALL_TOP); merlons(f, WALL_TOP); continue; }
        // the core under the walk is not solid (she stands on it); the two faces are
        B.solid = false; wallBody(Object.assign({}, f, { t: 1.2 }), -2.9, WALL_TOP); B.solid = true;
        const inside = [-f.n[0], -f.n[1]];   // f.n points out of the town
        const face = (k0, k1, s0, s1) => { const km = (k0 + k1) / 2, s = (s0 + s1) / 2; B.box('dry', f.ax + f.dx * s + inside[0] * km, -2.9, f.az + f.dz * s + inside[1] * km, s1 - s0, WALL_TOP + 2.9 + 0.01, k1 - k0, f.ry, [0.96, 0.96, 1.0]); };
        face(-1.0, -0.6, 0, f.L);                                                         // the outer face (the merlons stand on it)
        if (w.id === 'north-west') face(0.6, 1.0, 0, f.L - 0.4); else face(0.6, 1.0, -0.2, X(298) - f.ax);   // the inner face (open where the stair lands)
        merlons(f, WALL_TOP, w.id === 'north-west' ? 1.0 : 0, null);
      }
      // the stair's open side toward the lane, and the top landing's west face: she climbs only by the treads
      K.addBlock([[289, 195], [482, 195], [482, 201], [289, 201]]);
      K.addBlock([[289, 169], [297.5, 169], [297.5, 201], [289, 201]]);

      // ---- towers and piers along the walls ----
      tower(64, 168, 108, 204, WALL_TOP + 1.2); topLantern(86, 186, WALL_TOP + 1.2, 110, 132, 204);        // the north-west corner
      tower(68, 344, 104, 376, WALL_TOP + 0.9); topLantern(86, 360, WALL_TOP + 0.9, 100, 126, 362);         // the west wall's two piers
      tower(68, 528, 104, 560, WALL_TOP + 0.9); topLantern(86, 544, WALL_TOP + 0.9, 100, 126, 546);
      tower(232, 790, 272, 826, WALL_TOP + 1.2); topLantern(252, 808, WALL_TOP + 1.2, 130, 270, 784);       // the south-west corner
      tower(212, 106, 242, 132, WALL_TOP + 1.3); tower(380, 106, 410, 132, WALL_TOP + 1.3); tower(820, 106, 850, 132, WALL_TOP + 1.3);   // the north wall's towers (out to the north)
      tower(356, 828, 388, 856, WALL_TOP + 1.2); tower(457, 828, 481, 852, WALL_TOP + 1.0);                 // the south wall's buttress towers (out to the south)
      tower(912, 828, 946, 856, WALL_TOP + 1.3); tower(1024, 828, 1062, 856, WALL_TOP + 1.3); tower(1130, 828, 1168, 856, WALL_TOP + 1.3);
      tower(1264, 746, 1304, 786, WALL_TOP + 1.2); topLantern(1284, 766, WALL_TOP + 1.2, 150);              // the south-east corner
      tower(1252, 134, 1292, 166, WALL_TOP + 1.2); topLantern(1272, 150, WALL_TOP + 1.2, 140);              // the north-east corner, over the dock
      tower(1258, 268, 1286, 287, WALL_TOP + 0.6, false); topLantern(1272, 278, WALL_TOP + 0.6, 150);       // the gateway's two piers
      tower(1262, 359, 1292, 377, WALL_TOP + 0.6, false); topLantern(1277, 368, WALL_TOP + 0.6, 150);
      tower(1226, 196, 1258, 222, WALL_TOP + 1.0);                                                         // where the wall turns south by the gateway

      // ---- the north gate: two towers, the arch between them, a lantern each side of the way through ----
      const NG = { x0: 536, x1: 702, a0: 588, a1: 650, y0: 108, y1: 186, top: 7.0 };
      tower(NG.x0, NG.y0, NG.a0, NG.y1, NG.top); tower(NG.a1, NG.y0, NG.x1, NG.y1, NG.top);
      {
        const N = 30, xa = X(NG.a0), xb = X(NG.a1), r = (xb - xa) / 2, mid = (xa + xb) / 2, spring = 2.9, zc = (Z(NG.y0) + Z(NG.y1)) / 2, d = Z(NG.y1) - Z(NG.y0);
        for (let j = 0; j < N; j++) { const x0 = xa + (xb - xa) * j / N, x1 = xa + (xb - xa) * (j + 1) / N, dx = Math.min(Math.abs(x0 - mid), Math.abs(x1 - mid)), bot = spring + Math.sqrt(Math.max(0, r * r - dx * dx)); B.box('dry', (x0 + x1) / 2, bot, zc, x1 - x0 + 0.005, NG.top - bot, d - 0.1, 0, [0.95, 0.95, 1]); }
        // the arch's stone rim on both faces
        for (const zf of [Z(NG.y0) - 0.06, Z(NG.y1) + 0.06]) archRim('dry', mid, spring, zf, r + 0.08, 0.13);
        for (let j = 0; j < 4; j++) { const x = xa + (xb - xa) * (j + 0.5) / 4; for (const zf of [Z(NG.y0) + 0.2, Z(NG.y1) - 0.2]) B.box('dry', x, NG.top + 0.09, zf, 0.5, 0.7, 0.36, 0, [0.92, 0.92, 0.98]); }
        wallLantern(553, NG.y1, [0, 1], 2.4, 120); wallLantern(686, NG.y1, [0, 1], 2.4, 120);
        K.light(619, 190, 110, 0.6, 'warm');
      }

      // ---- the main gate: two towers either side of the road out, lanterns on their tops and faces, the doors open ----
      const MG = [[526, 766, 597, 838], [695, 766, 766, 838]], MG_TOP = 6.6;
      for (const r of MG) tower(r[0], r[1], r[2], r[3], MG_TOP);
      topLantern(561, 772, MG_TOP, 150, 561, 740); topLantern(730, 772, MG_TOP, 150, 730, 740);
      wallLantern(561, 838, [0, 1], 2.6, 120); wallLantern(730, 838, [0, 1], 2.6, 120);
      // the doors, swung in against the way's two sides: planks bound with iron
      for (const [x0, x1] of [[597.2, 599.6], [692.4, 694.8]]) {
        const cx = (X(x0) + X(x1)) / 2, w = X(x1) - X(x0), za = Z(792), zb = Z(836);
        B.box('planks', cx, 0, (za + zb) / 2, w, 3.5, zb - za, 0, [0.62, 0.5, 0.45]);
        for (const y of [0.5, 1.7, 2.9]) B.box('iron', cx, y, (za + zb) / 2, w + 0.04, 0.12, zb - za - 0.1, 0);
      }

      // ---- the round tower, at the north wall's east end: tall, with merlons round its top and two lit slit windows ----
      {
        const cx = X(1007), cz = Z(160), r = 3.1, top = 10.4;
        B.cyl('dry', cx, -3, cz, r, r, top + 3, 28, [0.95, 0.95, 1], [TAU * r, top + 3]);
        const disc = new THREE.CircleGeometry(r, 28); disc.rotateX(-Math.PI / 2); B.geom('dry', disc, new THREE.Matrix4().makeTranslation(cx, top, cz), [0.7, 0.7, 0.76], 2); disc.dispose();
        B.cyl('dry', cx, top - 0.3, cz, r + 0.15, r + 0.15, 0.3, 28, [0.85, 0.85, 0.9], [TAU * r, 0.3], true);
        for (let i = 0; i < 18; i++) { const a = i / 18 * TAU; B.box('dry', cx + Math.cos(a) * (r - 0.1), top, cz + Math.sin(a) * (r - 0.1), 0.62, 0.75, 0.42, -a + Math.PI / 2, [0.92, 0.92, 0.98]); }
        for (const [a, y] of [[Math.PI / 2 - 0.15, 4.4], [Math.PI / 2 + 0.2, 7.4], [Math.PI / 2 + 0.85, 6.0]]) {
          const n = [Math.cos(a), Math.sin(a)], t = [-n[1], n[0]], p = [cx + n[0] * (r + 0.03), cz + n[1] * (r + 0.03)];
          const q = (u, v) => [p[0] + t[0] * u, y + v, p[1] + t[1] * u];
          B.quad('wood', q(-0.32, -0.1), q(0.32, -0.1), q(0.32, 1.05), q(-0.32, 1.05), [0, 0, 0.64, 1.15], [0.45, 0.36, 0.32]);
          const p2 = [p[0] + n[0] * 0.01, p[1] + n[1] * 0.01], q2 = (u, v) => [p2[0] + t[0] * u, y + v, p2[1] + t[1] * u];
          B.quad('win', q2(-0.22, 0), q2(0.22, 0), q2(0.22, 0.95), q2(-0.22, 0.95), [0, 0, 1, 1]);
          K.halo(p[0] + n[0] * 0.25, y + 0.5, p[1] + n[1] * 0.25, 1.1, [1.0, 0.68, 0.36]);
        }
        K.shadeMarks.push(['dot', 1007, 160, 90, 0.6]);
      }

      // ---- the wall-walk's stair: treads of castle stone climbing west against the north wall, a solid mass under them ----
      {
        const za = Z(170), zb = Z(197); B.solid = false;
        for (let i = 0; i < STAIR.n; i++) {
          const xb = STAIR.x1 - i * STAIR_RUN, xa = xb - STAIR_RUN, top = (i + 1) * STAIR_RISE;
          B.box('dry', (X(xa) + X(xb)) / 2, -0.4, (za + zb) / 2, X(xb) - X(xa) + 0.01, top + 0.4, zb - za, 0, [1.0, 0.98, 1.02]);
          B.box('dry', (X(xa) + X(xb)) / 2, top - 0.06, zb + 0.03, X(xb) - X(xa) + 0.01, 0.06, 0.08, 0, [1.15, 1.12, 1.15]);   // the tread's lip
        }
        // the landing at the top, on the wall
        B.box('dry', (X(296) + X(WW_EAST)) / 2, -0.4, (Z(NORTH_Y + 12) + zb) / 2, X(WW_EAST) - X(296), WALL_TOP + 0.4, zb - Z(NORTH_Y + 12), 0);
        B.solid = true;
        K.shadeMarks.push(['rect', STAIR.x0, 170, STAIR.x1, 198, 0.7]);
      }

      // ---- banners: on the north wall, by the round tower, on the hall, on the west wall and outside the gates ----
      banner(488, 170, [0, 1], 4.3, 1.1, 1.6); banner(757, 170, [0, 1], 4.1, 1.25, 2.3); banner(1175, 225, [0, 1], 4.1, 1.25, 2.3);
      banner(265, 442, [0, 1], 3.2, 0.85, 1.9); banner(406, 442, [0, 1], 3.2, 0.85, 1.9);
      banner(106, 500, [1, 0], 3.9, 1.2, 2.2);
      banner(111, 658, [-0.7932, 0.6089], 4.0, 1.25, 2.3);
      banner(500, 832, [0, 1], 4.2, 1.5, 2.6); banner(791, 832, [0, 1], 4.2, 1.5, 2.6);

      // ---- the stables: three stone arches into the stalls, straw on their floors, the stall walls between ----
      {
        const zf = Z(400), D = 0.45, E = 3.2, spring = 1.75;
        const piers = [[762, 795], [849, 868], [922, 943], [997, 1030]], opens = [[795, 849], [868, 922], [943, 997]], FL = 0.32, STRAW = [0.3, 0.25, 0.2];
        for (const [a, b] of piers) B.box('stone', (X(a) + X(b)) / 2, -0.3, zf - D / 2, X(b) - X(a), E + 0.3, D, 0);
        // the stalls' floor: a low stone plinth (the ground under a roof is left uneven by the engine), straw on it and
        // spilling out in front of each arch
        const x0 = X(762), x1 = X(1030), zb = Z(266);
        B.box('stone', (x0 + x1) / 2, -0.4, (zb + zf) / 2 + 0.25, x1 - x0, FL + 0.4, zf - zb + 0.5, 0, [0.75, 0.72, 0.72]);
        for (const [a, b] of opens) {
          const xa = X(a), xb = X(b), r = (xb - xa) / 2, mid = (xa + xb) / 2, N = 22;
          for (let j = 0; j < N; j++) { const xj0 = xa + (xb - xa) * j / N, xj1 = xa + (xb - xa) * (j + 1) / N, dx = Math.min(Math.abs(xj0 - mid), Math.abs(xj1 - mid)), bot = spring + Math.sqrt(Math.max(0, r * r - dx * dx)); B.box('stone', (xj0 + xj1) / 2, bot, zf - D / 2, xj1 - xj0 + 0.005, E - bot, D, 0); }
          archRim('dry', mid, spring, zf + 0.04, r + 0.06, 0.1, [1.1, 1.05, 1.1]);
          B.quad('pave', [xa - 0.2, FL + 0.012, zf + 0.5], [xb + 0.2, FL + 0.012, zf + 0.5], [xb + 0.05, FL + 0.012, zf - 0.2], [xa - 0.05, FL + 0.012, zf - 0.2], [xa, zf, xb, zf + 0.7], STRAW);
          // the stall's gate, shut: planks bound with iron, across the arch
          B.box('planks', mid, FL, zf - 0.22, xb - xa - 0.06, 1.3, 0.08, 0, [0.62, 0.5, 0.44]);
          for (const y of [FL + 0.25, FL + 1.05]) B.box('iron', mid, y, zf - 0.17, xb - xa - 0.1, 0.07, 0.03, 0);
          B.box('wood', mid, FL + 1.3, zf - 0.22, xb - xa - 0.02, 0.08, 0.12, 0, [0.55, 0.44, 0.4]);
        }
        // inside: the straw floor, the walls' inner faces (the engine's walls face outward), the stall walls between
        B.quad('pave', [x0 + 0.2, FL + 0.01, zf - 0.2], [x1 - 0.2, FL + 0.01, zf - 0.2], [x1 - 0.2, FL + 0.01, zb + 0.2], [x0 + 0.2, FL + 0.01, zb + 0.2], [x0, zb, x1, zf], STRAW);
        B.quad('stone', [x0, -0.3, zb + 0.02], [x1, -0.3, zb + 0.02], [x1, E, zb + 0.02], [x0, E, zb + 0.02], [x0, -0.3, x1, E], [0.6, 0.56, 0.56]);
        B.quad('stone', [x0 + 0.02, -0.3, zf], [x0 + 0.02, -0.3, zb], [x0 + 0.02, E, zb], [x0 + 0.02, E, zf], [zf, -0.3, zb, E], [0.6, 0.56, 0.56]);
        B.quad('stone', [x1 - 0.02, -0.3, zb], [x1 - 0.02, -0.3, zf], [x1 - 0.02, E, zf], [x1 - 0.02, E, zb], [zb, -0.3, zf, E], [0.6, 0.56, 0.56]);
        for (const px of [858, 932]) B.box('planks', X(px), FL, (zb + zf) / 2 - 0.2, 0.12, 1.5, zf - zb - 0.5, 0, [0.55, 0.45, 0.4]);
        // a hay rack and a feed trough at the back of each stall
        for (const [a, b] of opens) { const mx = (X(a) + X(b)) / 2; B.box('wood', mx, FL + 1.1, zb + 0.35, X(b) - X(a) - 0.4, 0.6, 0.4, 0, [0.6, 0.5, 0.42]); B.box('pave', mx, FL + 1.5, zb + 0.35, X(b) - X(a) - 0.6, 0.35, 0.3, 0, STRAW); B.box('wood', mx, FL, zb + 0.4, 1.2, 0.5, 0.5, 0, [0.55, 0.45, 0.4]); }
      }

      // ---- the paddock fence: dark posts with two rails ----
      {
        const line = [[767, 404], [767, 441], [860, 450], [1124, 450]], col = [0.5, 0.4, 0.36];
        for (let k = 1; k < line.length; k++) {
          const a = line[k - 1], b = line[k], ax = X(a[0]), az = Z(a[1]), bx = X(b[0]), bz = Z(b[1]), L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(L / 1.6)), ry = Math.atan2(-(bz - az), bx - ax);
          for (let i = 0; i <= n; i++) { const f = i / n; B.box('wood', ax + (bx - ax) * f, -0.2, az + (bz - az) * f, 0.18, 1.35, 0.18, ry, col); }
          for (const y of [0.45, 0.92]) B.box('wood', (ax + bx) / 2, y, (az + bz) / 2, L, 0.1, 0.07, ry, col);
          const nx = -(bz - az) / L * 0.14, nz = (bx - ax) / L * 0.14;
          K.addBlock([[ax + nx, az + nz], [bx + nx, bz + nz], [bx - nx, bz - nz], [ax - nx, az - nz]].map(([x, z]) => [K.M.px(x), K.M.py(z)]));
        }
      }

      // ---- the forge: the inner faces of its walls, the stone hearth with its fire, the tall chimney, the bench ----
      {
        const x0 = X(FORGE.x0), x1 = X(FORGE.x1), zb = Z(FORGE.y0), zf = Z(FORGE.y1), E = FORGE.E, T = 0.35, cx = (x0 + x1) / 2, cz = (zb + zf) / 2, w = x1 - x0, d = zf - zb;
        B.box('stone', cx, -0.4, zb + T / 2, w, E + 0.4, T, 0);                                     // the back wall
        B.box('stone', x0 + T / 2, -0.4, cz, T, E + 0.4, d, 0); B.box('stone', x1 - T / 2, -0.4, cz, T, E + 0.4, d, 0);   // the two ends
        for (const px of [998, 1042, 1088, 1190]) B.box('wood', X(px), -0.2, zf - 0.15, 0.24, E + 0.2, 0.24, 0, [0.8, 0.7, 0.62]);
        B.box('wood', cx, E - 0.3, zf - 0.15, w, 0.3, 0.26, 0, [0.7, 0.6, 0.55]);
        // the roof, ridge east to west, and its gables
        { const o = FORGE.over, rise = FORGE.rise, sl = rise / (d / 2), ye = E - o * sl, yr = E + rise, L = w + 2 * o, sln = Math.hypot(d / 2 + o, rise + o * sl);
          B.quad('roof', [x1 + o, ye, zb - o], [x0 - o, ye, zb - o], [x0 - o, yr, cz], [x1 + o, yr, cz], [0, 0, L, sln]);
          B.quad('roof', [x0 - o, ye, zf + o], [x1 + o, ye, zf + o], [x1 + o, yr, cz], [x0 - o, yr, cz], [0, 0, L, sln]);
          B.box('roof', cx, yr - 0.08, cz, L, 0.2, 0.22, 0, [0.7, 0.66, 0.66]);
          for (const [x, sx] of [[x0, -1], [x1, 1]]) { faceTri('stone', [x, E, zb], [x, E, zf], [x, yr, cz], [sx, 0, 0]); faceTri('stone', [x, E, zb], [x, E, zf], [x, yr, cz], [-sx, 0, 0]); } }
        wallLantern(1004, FORGE.y1 - 3, [0, 1], 2.3, 90);
        K.shadeMarks.push(['rect', FORGE.x0, FORGE.y0, FORGE.x1, FORGE.y1, 0.62]);
        const hx = X(1130), hz = Z(646);
        B.box('stone', hx, 0, hz, 2.7, 2.3, 1.1, 0, [0.9, 0.86, 0.86]);
        B.box('stone', hx, 0, hz - 0.25, 1.5, 9.0, 1.25, 0, [0.92, 0.9, 0.92]);                       // the chimney, up through the roof
        B.box('stone', hx, 9.0, hz - 0.25, 1.7, 0.16, 1.45, 0, [0.6, 0.58, 0.62]);
        B.quad('glass', [hx - 0.7, 0.35, hz + 0.56], [hx + 0.7, 0.35, hz + 0.56], [hx + 0.7, 1.45, hz + 0.56], [hx - 0.7, 1.45, hz + 0.56], [0, 0, 1, 1], [0.05, 0.018, 0.012]);
        B.box('glass', hx, 0.36, hz + 0.6, 1.2, 0.2, 0.1, 0, [1.5, 0.5, 0.14]);                       // the coals in its mouth
        B.box('glass', hx - 0.15, 0.5, hz + 0.58, 0.5, 0.16, 0.06, 0.2, [2.0, 0.9, 0.3]); B.box('glass', hx + 0.25, 0.48, hz + 0.58, 0.35, 0.12, 0.06, -0.3, [1.8, 0.75, 0.25]);
        K.halo(hx, 0.9, hz + 0.9, 3.0, [1.0, 0.52, 0.22]); K.lamps3d.push({ x: hx, y: 1.0, z: hz + 1.2, c: 0xff7a30, k: 2.0 });
        K.light(1130, 676, 170, 1.5, 'forge');
        B.box('wood', X(1030), 0, Z(553), 1.8, 0.85, 0.75, 0, [0.6, 0.48, 0.42]);                       // the workbench, and tools on the wall
        for (let i = 0; i < 6; i++) B.box('iron', X(1012) + i * 0.32, 1.3 + (i % 2) * 0.15, zb + T + 0.03, 0.06, 0.7, 0.04, 0);
        // the grindstone on its frame
        const gx = X(1183), gz = Z(694);
        for (const dx of [-0.32, 0.32]) B.box('wood', gx + dx, 0, gz, 0.1, 0.75, 0.5, 0, [0.6, 0.48, 0.42]);
        const wheel = new THREE.CylinderGeometry(0.5, 0.5, 0.18, 18); wheel.rotateZ(Math.PI / 2); B.geom('stone', wheel, new THREE.Matrix4().makeTranslation(gx, 0.85, gz), [1.0, 0.95, 0.9], 1); wheel.dispose();
        beam('iron', [gx - 0.45, 0.85, gz], [gx + 0.45, 0.85, gz], 0.04);
        // the wood store: its inner faces, and logs stacked under its roof
        const wx0 = X(1196), wx1 = X(1256), wzb = Z(548), wzf = Z(712);
        B.quad('stone', [wx0, -0.3, wzb + 0.02], [wx1, -0.3, wzb + 0.02], [wx1, 2.6, wzb + 0.02], [wx0, 2.6, wzb + 0.02], [wx0, -0.3, wx1, 2.6], [0.55, 0.5, 0.5]);
        B.quad('stone', [wx1 - 0.02, -0.3, wzb], [wx1 - 0.02, -0.3, wzf], [wx1 - 0.02, 2.6, wzf], [wx1 - 0.02, 2.6, wzb], [wzb, -0.3, wzf, 2.6], [0.55, 0.5, 0.5]);
        const log = new THREE.CylinderGeometry(0.13, 0.13, 1.4, 7); log.rotateX(Math.PI / 2);
        for (let row = 0; row < 5; row++) for (let i = 0; i < 8 - (row % 2); i++) B.geom('wood', log, new THREE.Matrix4().makeTranslation(wx0 + 0.3 + i * 0.27 + (row % 2) * 0.13, 0.13 + row * 0.24, wzf - 1.0), [0.75, 0.55, 0.42], 1);
        log.dispose();
      }

      // ---- the yard well: a round stone well, its water glowing pale blue-white, a small shingled roof on two posts
      // with a windlass, a bench and a crate beside it ----
      {
        const cx = X(780), cz = Z(552), wr = 1.35, wh = 0.95;
        B.cyl('dry', cx, -0.2, cz, wr, wr, wh + 0.2, 22, [0.95, 0.93, 0.98], [TAU * wr, wh]);
        const inner = new THREE.CylinderGeometry(wr - 0.28, wr - 0.28, wh, 22, 1, true); inner.scale(-1, 1, 1);
        B.geom('dry', inner, new THREE.Matrix4().makeTranslation(cx, wh / 2, cz), [0.6, 0.6, 0.66], [TAU * wr, wh]); inner.dispose();
        const rim = new THREE.RingGeometry(wr - 0.3, wr + 0.05, 24, 1); rim.rotateX(-Math.PI / 2);
        B.geom('dry', rim, new THREE.Matrix4().makeTranslation(cx, wh, cz), [0.9, 0.9, 0.95], 2); rim.dispose();
        const disc = new THREE.CircleGeometry(wr - 0.28, 24); disc.rotateX(-Math.PI / 2);
        B.geom('moonwater', disc, new THREE.Matrix4().makeTranslation(cx, wh - 0.3, cz), [1.15, 1.2, 1.35], 1); disc.dispose();
        K.halo(cx, wh + 0.1, cz, 2.4, [0.32, 0.48, 0.75]); K.lamps3d.push({ x: cx, y: wh + 0.4, z: cz, c: 0x8ab8ff, k: 1.4 });
        K.light(780, 548, 130, 0.75, 'moon');
        // the roof's posts, the windlass, and the little gabled roof
        for (const sx of [-1, 1]) B.box('wood', cx + sx * (wr + 0.05), -0.1, cz, 0.16, 2.55, 0.16, 0, [0.6, 0.48, 0.42]);
        beam('wood', [cx - wr - 0.05, 1.55, cz], [cx + wr + 0.05, 1.55, cz], 0.09, [0.62, 0.5, 0.44]);
        B.box('wood', cx + wr + 0.15, 1.3, cz, 0.06, 0.32, 0.06, 0, [0.6, 0.48, 0.42]);
        beam('iron', [cx, 1.55, cz], [cx, 1.0, cz], 0.012);
        const rx0 = cx - wr - 0.45, rx1 = cx + wr + 0.45, rz0 = cz - 1.0, rz1 = cz + 1.0, ye = 2.35, yr = 3.15, RC = [0.55, 0.62, 0.62];
        B.quad('roof', [rx1, ye, rz0], [rx0, ye, rz0], [rx0, yr, cz], [rx1, yr, cz], [0, 0, rx1 - rx0, 1.3], RC);
        B.quad('roof', [rx0, ye, rz1], [rx1, ye, rz1], [rx1, yr, cz], [rx0, yr, cz], [0, 0, rx1 - rx0, 1.3], RC);
        B.box('wood', cx, yr - 0.08, cz, rx1 - rx0, 0.12, 0.14, 0, [0.5, 0.4, 0.36]);
        for (const sx of [-1, 1]) { const x = cx + sx * (wr + 0.05); faceTri('wood', [x, ye, rz0 + 0.1], [x, ye, rz1 - 0.1], [x, yr - 0.05, cz], [sx, 0, 0], [0.55, 0.45, 0.4]); faceTri('wood', [x, ye, rz0 + 0.1], [x, ye, rz1 - 0.1], [x, yr - 0.05, cz], [-sx, 0, 0], [0.55, 0.45, 0.4]); }
        K.bench(X(796), 0, Z(606), 0);
        K.shadeMarks.push(['dot', 780, 552, 45, 0.7]);
      }

      // ---- the training yard: the weapon racks, the chained posts and the tall post ----
      {
        const rack = (x0, x1, py) => {
          const z = Z(py), col = [0.58, 0.46, 0.4];
          for (const px of [x0, x1]) B.box('wood', X(px), 0, z, 0.14, 1.75, 0.14, 0, col);
          for (const y of [0.45, 1.35]) B.box('wood', (X(x0) + X(x1)) / 2, y, z, X(x1) - X(x0), 0.08, 0.1, 0, col);
          for (let x = X(x0) + 0.22, i = 0; x < X(x1) - 0.1; x += 0.24, i++) {
            if (i % 3 === 2) { B.box('iron', x, 0.3, z + 0.05, 0.07, 1.25, 0.02, 0, [2.2, 2.2, 2.6]); B.box('wood', x, 1.48, z + 0.05, 0.22, 0.05, 0.05, 0, col); }
            else { B.cyl('wood', x, 0.05, z + 0.05, 0.025, 0.025, 2.1, 5, [0.7, 0.55, 0.45]); B.cyl('iron', x, 2.15, z + 0.05, 0.05, 0.0, 0.28, 5, [2.2, 2.2, 2.6]); }
          }
          K.shadeMarks.push(['dot', (x0 + x1) / 2, py, 30, 0.75]);
        };
        rack(148, 206, 528); rack(156, 216, 588);
        const post = (px, py, h) => { B.cyl('wood', X(px), -0.2, Z(py), 0.17, 0.15, h + 0.2, 8, [0.6, 0.48, 0.42]); B.cyl('iron', X(px), h, Z(py), 0.18, 0.18, 0.08, 8); };
        const chain = (a, b, h) => { const c = new THREE.QuadraticBezierCurve3(V(X(a[0]), h, Z(a[1])), V((X(a[0]) + X(b[0])) / 2, h - 0.35, (Z(a[1]) + Z(b[1])) / 2), V(X(b[0]), h, Z(b[1]))); const tube = new THREE.TubeGeometry(c, 10, 0.03, 4, false); B.geom('iron', tube, new THREE.Matrix4(), [1.6, 1.6, 1.8], 1); tube.dispose(); };
        post(231, 518, 1.1); post(256, 518, 1.1); chain([231, 518], [256, 518], 0.95);
        post(256, 588, 1.1); post(307, 588, 1.1); chain([216, 588], [256, 588], 0.95); chain([256, 588], [307, 588], 0.95);
        post(321, 540, 2.4);
      }

      // ---- the dock: the deck, its rails, the frame of posts and braces in the water, the crane, crates and moorings ----
      {
        const dy = DECK_Y, pts = DECK.map(([x, y]) => [X(x), Z(y)]);
        // the deck's top, a fan of triangles facing up, its planks' uv in metres; then its edge beams
        for (let i = 1; i < pts.length - 1; i++) { const a = pts[0], b = pts[i], c = pts[i + 1]; B.tri('deck', [a[0], dy, a[1]], [c[0], dy, c[1]], [b[0], dy, b[1]], [[a[0], a[1]], [c[0], c[1]], [b[0], b[1]]]); }
        for (let i = 0; i < pts.length; i++) {
          const a = pts[i], b = pts[(i + 1) % pts.length], ry = Math.atan2(-(b[1] - a[1]), b[0] - a[0]), L = Math.hypot(b[0] - a[0], b[1] - a[1]);
          B.box('wood', (a[0] + b[0]) / 2, dy - 0.4, (a[1] + b[1]) / 2, L, 0.4, 0.22, ry, [0.6, 0.48, 0.42]);
        }
        const rail = (a, b) => { const ax = X(a[0]), az = Z(a[1]), bx = X(b[0]), bz = Z(b[1]), L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(L / 1.5)), ry = Math.atan2(-(bz - az), bx - ax);
          for (let i = 0; i <= n; i++) B.box('wood', ax + (bx - ax) * i / n, dy, az + (bz - az) * i / n, 0.14, 1.1, 0.14, ry, [0.58, 0.46, 0.4]);
          for (const y of [0.5, 0.98]) B.box('wood', (ax + bx) / 2, dy + y, (az + bz) / 2, L, 0.08, 0.07, ry, [0.6, 0.48, 0.42]); };
        rail([1300, 197], [1424, 197]); rail([1424, 197], [1505, 257]); rail([1505, 257], [1505, 404]);
        // the frame under the deck, standing in the water
        for (const x of [1300, 1350, 1400, 1450, 1500]) for (const y of [200, 268, 336, 402]) {
          if (!inPoly(DECK, x, y)) continue;
          B.cyl('wood', X(x), -5.6, Z(y), 0.2, 0.2, dy - 0.2 + 5.6, 7, [0.55, 0.44, 0.4]);
        }
        const zS = Z(402);
        for (const [xa, xb] of [[1300, 1350], [1350, 1400], [1400, 1450], [1450, 1500]]) {
          beam('wood', [X(xa), -3.0, zS], [X(xb), dy - 0.45, zS], 0.08, [0.55, 0.44, 0.4]); beam('wood', [X(xb), -3.0, zS], [X(xa), dy - 0.45, zS], 0.08, [0.55, 0.44, 0.4]);
          B.box('wood', (X(xa) + X(xb)) / 2, -1.6, zS, X(xb) - X(xa), 0.2, 0.2, 0, [0.55, 0.44, 0.4]);
        }
        // the stone pier below the dock's south edge
        B.box('dry', X(1400), -5.6, Z(440), 2.4, 4.6, 2.0, 0, [0.8, 0.8, 0.85]); B.box('dry', X(1400), -5.6, Z(462), 1.8, 3.8, 1.4, 0, [0.75, 0.75, 0.8]);
        // the crane: a post on a round foot, its arm out over the water, the rope and hook
        const cx = X(1360), cz = Z(224);
        B.cyl('wood', cx, dy, cz, 0.6, 0.55, 0.45, 12, [0.6, 0.48, 0.42]);
        B.box('wood', cx, dy + 0.4, cz, 0.36, 3.4, 0.36, 0, [0.62, 0.5, 0.44]);
        const tip = [X(1484), 4.7, Z(186)];
        beam('wood', [cx, 3.2, cz], tip, 0.15, [0.62, 0.5, 0.44]);
        beam('wood', [cx, 1.6, cz], [cx + (tip[0] - cx) * 0.35, 3.75, cz + (tip[2] - cz) * 0.35], 0.08, [0.6, 0.48, 0.42]);
        beam('iron', tip, [tip[0], 2.0, tip[2]], 0.02);
        const hook = new THREE.TorusGeometry(0.16, 0.035, 5, 10, Math.PI * 1.4); B.geom('iron', hook, new THREE.Matrix4().makeTranslation(tip[0], 1.85, tip[2]), [1.4, 1.4, 1.5], 1); hook.dispose();
        const coil = new THREE.TorusGeometry(0.3, 0.07, 5, 12); coil.rotateX(Math.PI / 2); B.geom('wood', coil, new THREE.Matrix4().makeTranslation(X(1350), dy + 0.08, Z(242)), [0.9, 0.78, 0.6], 1); coil.dispose();
        for (const [x, y, s, h] of [[1394, 256, 0.9, 0.8], [1420, 258, 0.8, 0.75], [1432, 228, 0.8, 0.7], [1405, 224, 0.75, 0.7], [1396, 256, 0.6, 0.5]]) B.box('wood', X(x), dy + (s === 0.6 ? 0.8 : 0), Z(y), s, h, s, 0.15, [0.85, 0.7, 0.55]);
        // the mooring posts
        for (const x of [1363, 1447]) { B.cyl('wood', X(x), dy, Z(390), 0.22, 0.22, 0.95, 9, [0.6, 0.48, 0.42]); B.cyl('iron', X(x), dy + 0.95, Z(390), 0.25, 0.2, 0.1, 9); }
        K.shadeMarks.push(['poly', DECK, 0.85]);
      }

      // ---- the gold-lit cracks down the road from the north gate to the forest road ----
      {
        const path = [[619, -60], [619, 120], [623, 220], [628, 380], [633, 520], [638, 680], [641, 820], [644, 960], [641, 1100]];
        const R = K.R; let seed = 0;
        // one crack: a crooked line of short glowing pieces between the cobbles
        const crack = (px, py) => {
          let x = X(px), z = Z(py), a = Math.PI / 2 + (R() - 0.5) * 1.6; const n = 2 + Math.floor(R() * 3), w = 0.012 + R() * 0.012, col = [0.4 + R() * 0.2, 0.22 + R() * 0.1, 0.055];
          for (let i = 0; i < n; i++) {
            const len = 0.07 + R() * 0.12, x2 = x + Math.cos(a) * len, z2 = z + Math.sin(a) * len, nx = -Math.sin(a) * w, nz = Math.cos(a) * w;
            const y1 = K.terrain(K.M.px(x), K.M.py(z)) + 0.03, y2 = K.terrain(K.M.px(x2), K.M.py(z2)) + 0.03;
            B.quad('glass', [x - nx, y1, z - nz], [x + nx, y1, z + nz], [x2 + nx, y2, z2 + nz], [x2 - nx, y2, z2 - nz], [0, 0, 1, 1], col);
            x = x2; z = z2; a += (R() - 0.5) * 1.6;
          }
        };
        for (let k = 1; k < path.length; k++) {
          const [ax, ay] = path[k - 1], [bx, by] = path[k], L = Math.hypot(bx - ax, by - ay);
          for (let s = 0; s < L; s += 3 + R() * 6) {
            const px = ax + (bx - ax) * s / L + (R() - 0.5) * 7, py = ay + (by - ay) * s / L;
            crack(px, py); if (R() < 0.35) crack(px + (R() - 0.5) * 6, py + (R() - 0.5) * 4);
            if (seed++ % 14 === 0 && py > 40 && py < 975) K.light(px, py, 24, 0.25, 'warm');
          }
        }
      }

      // ---- the things on uneven ground (barrels, crates, pots, flower beds), set on the engine's ground ----
      {
        const T = (px, py) => K.terrain(px, py);
        for (const [px, py] of LOOSE.barrels) { const x = X(px), z = Z(py), y = T(px, py) - 0.05; B.cyl('wood', x, y, z, 0.33, 0.33, 0.9, 10, [0.75, 0.55, 0.42], [2.1, 0.9]); B.cyl('iron', x, y + 0.15, z, 0.345, 0.345, 0.06, 10, null, null, true); B.cyl('iron', x, y + 0.7, z, 0.345, 0.345, 0.06, 10, null, null, true); K.shadeMarks.push(['dot', px, py, 14, 0.7]); }
        for (const [px, py] of LOOSE.crates) { const x = X(px), z = Z(py), y = T(px, py) - 0.05; B.box('wood', x, y, z, 0.8, 0.6, 0.7, 0.2, [0.85, 0.7, 0.55]); B.box('wood', x + 0.1, y + 0.6, z - 0.05, 0.6, 0.5, 0.55, -0.15, [0.8, 0.65, 0.5]); K.shadeMarks.push(['dot', px, py, 18, 0.68]); }
        for (const [px, py] of LOOSE.pots) { const x = X(px), z = Z(py), y = T(px, py) - 0.03; B.cyl('stone', x, y, z, 0.2, 0.28, 0.42, 9, [1.3, 0.75, 0.55]); for (const r_ of [0, 1.57]) B.quad('fl_mix', [x - Math.cos(r_) * 0.35, y + 0.3, z - Math.sin(r_) * 0.35], [x + Math.cos(r_) * 0.35, y + 0.3, z + Math.sin(r_) * 0.35], [x + Math.cos(r_) * 0.35, y + 0.85, z + Math.sin(r_) * 0.35], [x - Math.cos(r_) * 0.35, y + 0.85, z - Math.sin(r_) * 0.35], [0, 0, 1, 1]); }
        const blobCol = (cy, r) => (v) => { const t = Math.max(0, Math.min(1, (v.y - cy) / r * 0.5 + 0.5)), k = 0.42 + 0.68 * t; return [k * 0.95, k, k * 1.02]; };
        for (const [fx, fy, rr, kind] of LOOSE_FLOWERS) {
          const x = X(fx), z = Z(fy), y = T(fx, fy), h = rr * 0.75;
          B.geom('leafBush', K.ico[(fx + fy) % 3], new THREE.Matrix4().compose(V(x, y + h * 0.55, z), new THREE.Quaternion(), V(rr, h, rr)), blobCol(y + h * 0.55, h), 2.2);
          for (let i = 0, n = Math.max(2, Math.round(rr * 4)); i < n; i++) {
            const a = K.R() * TAU, d = K.R() * rr * 0.75, cx_ = x + Math.cos(a) * d, cz_ = z + Math.sin(a) * d, hh = y + h * (0.6 + K.R() * 0.6), s = 0.45 + K.R() * 0.25, r2 = K.R() * Math.PI;
            B.quad('fl_' + kind, [cx_ - Math.cos(r2) * s, hh - s * 0.6, cz_ - Math.sin(r2) * s], [cx_ + Math.cos(r2) * s, hh - s * 0.6, cz_ + Math.sin(r2) * s], [cx_ + Math.cos(r2) * s, hh + s, cz_ + Math.sin(r2) * s], [cx_ - Math.cos(r2) * s, hh + s, cz_ - Math.sin(r2) * s], [0, 0, 1, 1]);
          }
          K.shadeMarks.push(['dot', fx, fy, rr / SX * 1.1, 0.6]);
        }
      }

      // ---- the two iron lamp posts on the dock's east rail (DAWN_LAMPS), and the two lamp pillars where the road climbs
      // to the node, as the engine builds its lamps, with their light pools kept inside the painting ----
      for (const [px, py, lx] of [[1504, 273, 1462], [1504, 378, 1462]]) {
        const x = X(px), z = Z(py), y = DECK_Y;
        B.box('iron', x, y, z, 0.26, 0.3, 0.26, 0); B.cyl('iron', x, y + 0.3, z, 0.06, 0.045, 2.7, 6); B.box('iron', x, y + 2.94, z, 0.3, 0.06, 0.06, 0);
        K.lantern(x, y + 3.02, z, null, 1.1); K.light(lx, py, 66, 1.1, 'warm'); K.addBlock(K.circlePx(px, py, 0.22, 8));
      }
      for (const px of [572, 665]) {
        const py = 24, x = X(px), z = Z(py), y = walkH(px, py);
        B.box('dry', x, y - 0.3, z, 0.62, 1.75, 0.62, 0, [0.95, 0.93, 0.98]); B.box('dry', x, y + 1.45, z, 0.76, 0.14, 0.76, 0, [0.8, 0.78, 0.84]);
        K.lantern(x, y + 1.62, z, null, 1.05); K.light(px, 60, 62, 0.9, 'warm'); K.addBlock(K.circlePx(px, py, 0.42, 8));
      }

      // ---- the rough stone steps down the hillside outside the south-west wall, and the path between them ----
      {
        const steps = (pts) => { for (const [px, py] of pts) { const y = K.terrain(px, py); B.box('dry', X(px), y - 0.35, Z(py), 1.3, 0.5, 0.45, 0.6, [0.85, 0.82, 0.86]); } };
        steps([[190, 744], [182, 752], [174, 760], [166, 768], [158, 776], [150, 784], [142, 792]]);
        steps([[300, 912], [292, 922], [284, 932], [276, 942], [268, 952], [260, 962]]);
      }
    },
  };
})(window);
