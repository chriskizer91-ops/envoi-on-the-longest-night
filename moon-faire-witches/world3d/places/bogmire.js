// bogmire.js: Bogmire, the stilt town on the fen, in 3D, laid out on its painting (reference/art/walk/walk-bogmire.png,
// 1536 x 1024) in the painting's own pixels, as src/game/maps.js keeps the walking map. Where Io can walk is that map's own
// walk and block areas, unchanged (MAPS.bogmire), the two pockets added here (walkAdd), and (Chris's rule, November 16,
// 11:22: anywhere that looks walkable is walkable) every board the 2D walk leaves out: the porches end to end, the inn's
// porch and the far east house's porch down a side stair, the east house's porch, the west dock's three fingers.
// The texture ids are the texture pack's (texture-packs/bogmire-dawnroost/bogmire/inventory.md).
// There is no dry ground in the town: everything stands on wooden stilts over still black water. Heights are metres: the
// boardwalks, the square and the docks are 0; the water lies 1.5 m below them. The north-west house and the small thatched
// house beside it stand on a porch 1.4 m up (the stair from the west boardwalk climbs to it), and the Lanternless Inn on a
// porch 1.5 m up (its stair climbs from the east boardwalk; a narrow stair at its east end goes down to the far east
// house's porch, between the inn's wing and that house, where the painting has its plank walk). The west dock's three
// fingers lie 0.1 m below it. Past the painting the fen goes on to low banks of marsh grass
// and dark woods; the long walk north runs out to them (to the fen's dark heart), and a causeway runs west from the
// landing (the Thornwood road).
(function (G) {
  'use strict';
  const P = G.W3D_PLACES = G.W3D_PLACES || {};

  const H_N = 1.4, H_I = 1.5;            // the north porch, and the inn's porch
  const WY = -1.5, BED = -2.4, BANK = -1.15;   // the water, its muddy bed, and the marsh banks past the painting
  const inR = (r, x, y) => x >= r[0] && x <= r[2] && y >= r[1] && y <= r[3];
  const NORTH = [248, 40, 704, 255], INN = [1084, 100, 1398, 317];
  // the stairs: x across, from the top (yt, the porch's edge) down to the bottom (yb, the boardwalk's edge), n treads; m,
  // how far past its sides Io's feet still take its height (pixels)
  const STAIRS = [
    { x0: 327, x1: 373, yt: 254, yb: 386, n: 10, h: H_N },   // up from the west boardwalk to the north-west house
    { x0: 1192, x1: 1236, yt: 316, yb: 400, n: 10, h: H_I }, // up from the east boardwalk to the inn
    { x0: 1372, x1: 1396, yt: 278, yb: 340, n: 9, h: H_I, m: 1 },  // down from the inn's porch's east end to the far east house's
  ];
  const stairH = (s, y) => s.h * Math.max(0, Math.min(s.n, Math.ceil((s.yb - y) / (s.yb - s.yt) * s.n))) / s.n;
  // the west dock's three fingers for the punts (0.1 m below the dock)
  const FINGERS = [[24, 456, 143, 480], [24, 520, 143, 544], [24, 584, 143, 608]];
  // Io's feet stand a hair (2 mm) over the boards: the engine takes feet at exactly the ground's own height to mean she
  // is on the ground itself, and under the fen's water that is its bed, 2.4 m down
  const FEET = 0.002;

  // the ground's height under any point of the painting (metres): the deck it is on, or the marsh banks past the town
  // (under the water the engine lays the fen's bed, whatever this says)
  function ground(x, y) {
    if (inR(NORTH, x, y)) return H_N;
    if (inR(INN, x, y)) return H_I;
    if (x > -40 && x < 1576 && y > -40 && y < 1064) return 0;
    return BANK;
  }

  // the fen: still black water over the whole painting and on past it, to low banks of marsh grass (an uneven shore)
  const FEN = [[-250, -180], [-120, -240], [0, -215], [150, -262], [330, -226], [520, -252], [700, -214], [880, -246], [1060, -210], [1240, -252],
    [1420, -222], [1600, -256], [1760, -190], [1790, -60], [1760, 120], [1802, 300], [1770, 500], [1810, 700], [1766, 900], [1796, 1080], [1750, 1222],
    [1600, 1262], [1420, 1226], [1240, 1266], [1060, 1230], [880, 1270], [700, 1236], [520, 1262], [340, 1230], [160, 1266], [0, 1240], [-150, 1220],
    [-250, 1100], [-222, 900], [-266, 700], [-232, 500], [-262, 300], [-226, 120], [-260, -40]];

  // the boardwalks, docks and porches: [x0, y0, x1, y1] in pixels, the deck's height, and which way its boards run ('ew':
  // boards laid east-west, across a walk going north-south; 'ns': the other way). They meet edge to edge.
  const DECKS = [
    [[20, 330, 252, 396], 0, 'ns'], [[-300, 345, 20, 390], 0, 'ns'],                                  // the landing, and the causeway west
    [[143, 396, 241, 662], 0, 'ew'],                                                                   // the west dock
    [[24, 456, 143, 480], -0.1, 'ns'], [[24, 520, 143, 544], -0.1, 'ns'], [[24, 584, 143, 608], -0.1, 'ns'], // its three fingers for the punts
    [[241, 396, 252, 455], 0, 'ns'], [[252, 386, 380, 455], 0, 'ns'], [[380, 402, 508, 455], 0, 'ns'],   // the west boardwalk
    [[250, 207, 470, 255], H_N, 'ns'], [[470, 204, 556, 255], H_N, 'ns'], [[556, 203, 702, 255], H_N, 'ns'], // the north porch and the bridge
    [[470, 60, 498, 204], H_N, 'ew'], [[376, 60, 470, 95], H_N, 'ns'],                                   // the side walk and the back deck (a pocket)
    [[759, -420, 820, 326], 0, 'ew'], [[734, 112, 759, 152], 0, 'ns'], [[820, 112, 845, 152], 0, 'ns'],  // the long walk north
    [[820, 200, 1030, 248], 0, 'ns'],                                                                  // the north-east house's porch
    [[1032, 400, 1310, 456], 0, 'ns'],                                                                 // the east boardwalk
    [[1086, 278, 1372, 316], H_I, 'ns'],                                                               // the inn's porch (its side stair east of it)
    [[1396, 300, 1536, 340], 0, 'ns'],                                                                 // the far east house's porch
    [[1256, 456, 1310, 686], 0, 'ew'],                                                                 // south on the east side
    [[1310, 580, 1486, 606], 0, 'ns'], [[1310, 492, 1330, 580], 0, 'ew'],                              // the east house's porch
    [[1256, 686, 1342, 812], 0, 'ew'], [[1342, 716, 1486, 768], 0, 'ns'],                              // the south-east dock
    [[1486, 726, 1532, 758], 0, 'ns'], [[1502, 758, 1532, 846], 0, 'ew'],                              // the punt landing past it (a pocket)
    [[850, 760, 1256, 812], 0, 'ns'], [[1052, 716, 1098, 760], 0, 'ew'],                               // along the south houses, and the passage
    [[752, 548, 818, 814], 0, 'ew'], [[716, 814, 830, 886], 0, 'ns'], [[818, 698, 850, 812], 0, 'ew'],  // south from the square, the water stair
    [[646, 706, 752, 760], 0, 'ns'],                                                                   // the bridge west
    [[607, 686, 646, 760], 0, 'ew'], [[364, 760, 646, 808], 0, 'ns'], [[364, 684, 404, 760], 0, 'ew'],  // round the south-west house
    [[296, 720, 364, 778], 0, 'ns'],                                                                   // the little dock
    [[1372, 340, 1420, 352], 0, 'ns'],                                                                 // the landing at the foot of the inn's side stair
  ];
  // the market square: one deck with its corners cut, boards east-west
  const SQUARE = [[508, 548], [508, 394], [528, 356], [580, 326], [962, 326], [1002, 346], [1032, 382], [1032, 548]];

  // the rope railings: posts every couple of metres (they go down into the water as stilts), rope slung between them.
  // [height, [[x, y], ...]]; a height of 's0', 's1' or 's2' follows that stair
  const RAILS = [
    [0, [[22, 331], [250, 331]]], [0, [[22, 397], [143, 397]]], [0, [[-300, 345], [20, 345], [20, 331]]], [0, [[-300, 390], [20, 390], [20, 397]]],
    // the west dock's west side, open where each finger leaves it
    [0, [[143, 397], [143, 456]]], [0, [[143, 480], [143, 520]]], [0, [[143, 544], [143, 584]]], [0, [[143, 608], [143, 662]]], [0, [[190, 662], [241, 662], [241, 456]]],
    [-0.1, [[143, 456], [24, 456], [24, 480], [143, 480]]], [-0.1, [[143, 520], [24, 520], [24, 544], [143, 544]]], [-0.1, [[143, 584], [24, 584], [24, 608], [143, 608]]],
    [0, [[241, 455], [508, 455]]], [0, [[252, 331], [252, 386], [327, 386]]], [0, [[373, 386], [380, 386], [380, 402], [508, 402]]],
    ['s0', [[327, 255], [327, 386]]], ['s0', [[373, 255], [373, 386]]],
    [H_N, [[250, 207], [250, 255], [327, 255]]], [H_N, [[373, 255], [702, 255], [702, 203]]],
    [H_N, [[498, 204], [498, 60], [376, 60], [376, 95]]],
    [0, [[508, 394], [528, 356], [580, 326], [759, 326]]], [0, [[820, 326], [962, 326], [1002, 346], [1032, 382], [1032, 400]]],
    [0, [[508, 455], [508, 548], [752, 548]]], [0, [[818, 548], [1032, 548], [1032, 456]]],
    [0, [[759, -420], [759, 112], [734, 112], [734, 152], [759, 152], [759, 326]]],
    [0, [[820, -420], [820, 112], [845, 112], [845, 152], [820, 152], [820, 200]]], [0, [[820, 248], [820, 326]]],
    [0, [[820, 200], [852, 200]]], [0, [[1000, 200], [1030, 200], [1030, 248], [906, 248]]], [0, [[884, 248], [820, 248]]],
    [0, [[1032, 400], [1192, 400]]], [0, [[1236, 400], [1310, 400], [1310, 456]]], [0, [[1032, 456], [1255, 456], [1255, 652]]],   // (walk pass 2: a pixel west, its posts off the 2D walk's edge)
    ['s1', [[1192, 316], [1192, 400]]], ['s1', [[1236, 316], [1236, 400]]],
    [H_I, [[1086, 278], [1086, 316], [1192, 316]]], [H_I, [[1236, 316], [1372, 316], [1372, 294]]],
    // the inn's side stair, both sides, its landing, and the far east house's porch (its ladder's gap, its east end)
    ['s2', [[1372, 316], [1372, 340]]], ['s2', [[1396, 300], [1396, 324]]],
    [0, [[1372, 340], [1372, 352], [1420, 352], [1420, 340], [1426, 340]]], [0, [[1446, 340], [1536, 340], [1536, 300]]],
    [0, [[1310, 456], [1310, 580]]], [0, [[1310, 606], [1310, 686], [1342, 686], [1342, 716], [1486, 716], [1486, 726]]],
    [0, [[1310, 493], [1330, 493]]],                                                                  // the north end of the east house's side walk
    [0, [[1310, 606], [1452, 606]]], [0, [[1472, 606], [1486, 606], [1486, 580]]],
    [0, [[1256, 812], [1342, 812], [1342, 768], [1486, 768], [1486, 758]]],
    [0, [[1486, 726], [1532, 726], [1532, 846]]], [0, [[1486, 758], [1502, 758], [1502, 846]]],
    [0, [[850, 812], [1256, 812]]], [0, [[1038, 760], [1052, 760], [1052, 716], [1098, 716]]],
    [0, [[752, 548], [752, 706]]], [0, [[752, 760], [752, 814], [716, 814], [716, 886], [720, 886]]], [0, [[738, 886], [830, 886], [830, 812], [850, 812]]],
    [0, [[818, 548], [818, 698], [844, 698]]],
    [0, [[607, 686], [646, 686], [646, 706], [752, 706]]], [0, [[646, 760], [752, 760]]], [0, [[646, 760], [646, 808], [524, 808]]], [0, [[500, 808], [364, 808], [364, 778]]],
    [0, [[404, 684], [364, 684], [364, 720], [296, 720], [296, 778], [314, 778]]], [0, [[334, 778], [364, 778]]],
  ];
  // ladders from the decks down to the water: [x, y, deck height, which way the deck's edge faces]
  const LADDERS = [[612, 255, H_N, 's'], [895, 248, 0, 's'], [1436, 340, 0, 's'], [1462, 606, 0, 's'], [170, 662, 0, 's'], [324, 778, 0, 's'],
    [512, 808, 0, 's'], [729, 886, 0, 's'], [1517, 846, 0, 's']];
  // the lanterns on wooden posts: [x, y, deck height, post height]; the walking map's six (BOG_LAMPS) first (walk pass 2: the
  // one by the east boardwalk two pixels north, inside its block on the walking map)
  const LAMPS = [[145, 482, 0, 1.75], [145, 620, 0, 1.75], [251, 462, 0, 1.75], [1007, 530, 0, 1.75], [1303, 430, 0, 1.75], [1460, 760, 0, 1.75],
    [354, 718, 0, 1.75], [1090, 312, H_I, 1.6], [718, 840, 0, 1.75]];

  // the reeds and lily pads, read from the painting (pale grey-green on the dark water): reeds [x, base y, half width px,
  // painted height px]; lilies [x, y, radius px]
  const REEDS = [[1024, 88, 16, 64], [1056, 88, 16, 64], [143, 200, 15, 104], [173, 200, 15, 104], [203, 200, 15, 104], [233, 200, 15, 104], [1478, 448, 14, 64],
    [1506, 448, 14, 64], [336, 568, 16, 88], [368, 568, 16, 88], [1065, 560, 17, 56], [1100, 560, 17, 56], [1135, 560, 17, 56], [1228, 560, 20, 32], [710, 656, 14, 56],
    [738, 656, 14, 56], [1498, 712, 12, 96], [1526, 712, 12, 96], [17, 960, 17, 152], [52, 960, 17, 152], [87, 960, 17, 152], [646, 904, 14, 80], [674, 904, 14, 80],
    [1361, 896, 17, 72], [1396, 896, 17, 72], [1431, 896, 17, 72], [557, 936, 13, 96], [584, 936, 13, 96], [611, 936, 13, 96], [1112, 920, 16, 80], [1144, 920, 16, 80],
    [278, 888, 14, 40], [306, 888, 14, 40], [855, 976, 15, 120], [884, 976, 15, 120], [913, 976, 15, 120], [981, 936, 13, 80], [1008, 936, 13, 80], [1035, 936, 13, 80],
    [1494, 976, 14, 112], [1522, 976, 14, 112], [327, 1024, 15, 96], [356, 1024, 15, 96], [385, 1024, 15, 96], [166, 1024, 14, 88], [195, 1024, 14, 88],
    [224, 1024, 14, 88], [253, 1024, 14, 88], [282, 1024, 14, 88],
    // by hand: the reeds between the north-west house and the thatched house (they half hide the side walk), and round the punt landing
    [522, 196, 14, 90], [548, 170, 12, 80], [1552, 790, 14, 100], [1552, 850, 14, 90], [1490, 868, 12, 70]];
  const LILIES = [[336, 4, 4], [352, 8, 8], [376, 8, 8], [472, 16, 16], [736, 10, 10], [736, 30, 10], [880, 4, 4], [1068, 8, 8], [684, 16, 4], [656, 28, 8], [892, 24, 4],
    [908, 28, 4], [940, 28, 12], [964, 28, 12], [1072, 124, 8], [4, 192, 4], [714, 185, 9], [714, 204, 9], [714, 223, 9], [734, 185, 9], [734, 204, 9], [734, 223, 9],
    [172, 208, 8], [196, 220, 12], [220, 220, 12], [216, 240, 8], [736, 252, 8], [712, 260, 12], [520, 273, 9], [520, 292, 9], [520, 311, 9], [552, 273, 9], [552, 292, 9],
    [552, 311, 9], [24, 296, 8], [300, 290, 10], [300, 310, 10], [432, 288, 8], [664, 290, 10], [664, 310, 10], [696, 290, 10], [696, 310, 10], [860, 288, 4], [992, 304, 16],
    [52, 312, 8], [444, 312, 4], [1044, 330, 10], [1044, 350, 10], [416, 340, 12], [448, 348, 12], [1060, 368, 12], [1092, 362, 10], [1092, 382, 10], [1116, 362, 10],
    [1116, 382, 10], [1338, 380, 10], [1358, 380, 10], [1372, 434, 10], [1372, 454, 10], [1396, 434, 10], [1396, 454, 10], [1460, 452, 12], [1508, 460, 12],
    [244, 488, 4], [1504, 492, 12], [266, 504, 10], [286, 504, 10], [480, 508, 12], [480, 532, 12], [244, 532, 4], [444, 532, 4], [412, 548, 12], [412, 572, 12],
    [436, 548, 12], [436, 572, 12], [1160, 548, 12], [354, 564, 10], [374, 564, 10], [912, 556, 4], [244, 568, 4], [488, 568, 8], [416, 588, 8], [504, 596, 4],
    [660, 632, 12], [296, 636, 8], [1364, 676, 12], [200, 689, 9], [200, 708, 9], [200, 727, 9], [660, 696, 8], [692, 700, 4], [226, 728, 10], [246, 728, 10],
    [48, 752, 8], [92, 772, 4], [248, 800, 8], [192, 816, 16], [1392, 828, 4], [140, 842, 10], [140, 863, 10], [140, 883, 10], [140, 904, 10],
    [140, 925, 10], [140, 945, 10], [140, 966, 10], [164, 842, 10], [164, 863, 10], [164, 883, 10], [164, 904, 10], [164, 925, 10], [164, 945, 10], [164, 966, 10],
    [188, 842, 10], [188, 863, 10], [188, 883, 10], [188, 904, 10], [188, 925, 10], [188, 945, 10], [188, 966, 10], [272, 844, 12], [312, 848, 8], [336, 860, 12],
    [220, 864, 4], [378, 868, 10], [378, 892, 10], [398, 868, 10], [398, 892, 10], [1216, 880, 8], [456, 876, 4], [256, 896, 16], [1056, 906, 8],
    [1056, 926, 8], [104, 915, 11], [104, 936, 11], [104, 957, 11], [1136, 914, 10], [1136, 934, 10], [1396, 920, 4], [447, 937, 9], [447, 956, 9], [447, 975, 9],
    [476, 937, 9], [476, 956, 9], [476, 975, 9], [505, 937, 9], [505, 956, 9], [505, 975, 9], [956, 944, 12], [980, 944, 12], [1004, 944, 12], [650, 946, 10],
    [650, 966, 10], [670, 946, 10], [670, 966, 10], [800, 946, 10], [800, 966, 10], [1026, 952, 10], [1046, 952, 10], [64, 956, 4], [1110, 964, 12], [1110, 988, 12],
    [1138, 964, 12], [1138, 988, 12], [840, 972, 12], [1388, 968, 4], [56, 972, 4], [1000, 980, 4], [44, 996, 12], [768, 994, 10], [768, 1014, 10], [800, 994, 10],
    [800, 1014, 10], [464, 1008, 16], [1158, 1008, 14], [1186, 1008, 14], [1528, 996, 4], [368, 1016, 8], [488, 1016, 8]];
  // the snags (broken dead stumps in the water): [x, y, height m]
  const SNAGS = [[1262, 940, 1.6], [1204, 990, 1.1], [1396, 940, 1.8], [1344, 996, 1.2], [422, 1000, 1.3], [1490, 960, 1.4], [300, 470, 1.0], [600, 1010, 1.0],
    [40, 240, 1.2], [1080, 40, 1.3], [640, 40, 1.1], [1530, 520, 1.2]];

  // Chris's rule (November 16, 11:22): everything that looks walkable is walkable. The boards the 2D walk leaves out, each
  // to a few pixels inside its rails (Io's feet stand at each deck's own height: walk_h). Rope rails don't stop her; where
  // two of these meet at different heights, a strip between them is left out, under a rail.
  const R4 = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  const MORE = [
    R4(36, 335, 248, 393), R4(147, 393, 237, 658),                                     // the landing, and the west dock to its south end
    R4(28, 460, 151, 476), R4(28, 524, 151, 540), R4(28, 588, 151, 604),                // the dock's three fingers
    [[245, 390], [376, 390], [376, 406], [512, 406], [512, 451], [245, 451]],            // the west boardwalk
    R4(254, 211, 698, 251),                                                             // the north-west house's porch and the bridge, end to end
    [[513, 398], [531, 362], [583, 331], [959, 331], [998, 350], [1027, 384], [1027, 543], [513, 543]],   // the market square
    R4(816, 204, 1026, 244),                                                            // the north-east house's porch
    R4(1036, 404, 1306, 452),                                                           // the east boardwalk
    // the inn's porch end to end, onto its side stair's top; down the stair to its landing, and onto the far east house's porch
    [[1090, 282], [1393, 282], [1393, 326], [1399, 326], [1399, 304], [1532, 304], [1532, 340], [1417, 340], [1417, 349], [1375, 349],
      [1375, 294], [1368, 294], [1368, 312], [1090, 312]],
    R4(1305, 583, 1482, 602), R4(1313, 496, 1327, 586),                                 // the east house's porch, and the side walk up its west wall
    [[1260, 690], [1338, 690], [1338, 720], [1482, 720], [1482, 764], [1338, 764], [1338, 808], [1260, 808]],   // the south-east dock
    R4(854, 764, 1260, 808), R4(1056, 720, 1094, 764),                                  // along the south houses, and the passage
    [[756, 552], [814, 552], [814, 702], [842, 702], [842, 764], [854, 764], [854, 808], [826, 808], [826, 882], [720, 882], [720, 818], [756, 818]],   // south from the square, round the barrels, the water stair
    [[611, 690], [642, 690], [642, 804], [368, 804], [368, 688], [400, 688], [400, 764], [611, 764]],   // round the south-west house
    R4(300, 724, 368, 774),                                                             // the little dock
  ];

  P.bogmire = {
    id: 'bogmire', name: 'Bogmire', painting: "art/walk/walk-bogmire.avif", size: [1536, 1024],
    mapId: 'bogmire', paintingPng: 'reference/art/walk/walk-bogmire.png',
    // the wall check (tools/walls-test.mjs): from the landing, to each edge, door and pocket
    checks: { from: [70, 368], goals: [
      ['the Thornwood road (west edge)', 40, 366], ['the long walk to the fen’s dark heart (north edge)', 790, 6], ['the north-west house’s door', 348, 225],
      ['the thatched house’s door', 610, 216], ['the north-east house’s door', 892, 212], ['the inn’s door (up its stair)', 1212, 288], ['Old Wenna’s stall', 652, 470],
      ['the south-east dock', 1470, 742], ['the south-east house’s door', 1196, 782], ['the south house’s door', 943, 782], ['the passage between the south houses', 1075, 732],
      ['the water stair', 790, 860], ['the south-west house’s door', 511, 782], ['the little dock', 310, 752], ['the west dock’s south end', 200, 630],
      ['the hag-stone’s back deck, behind the north-west house', 392, 79], ['the punt landing past the south-east dock', 1517, 836],
      // the boards opened on November 16 (anywhere that looks walkable is walkable): each one's far end
      ['the north-west porch’s west end, by the barrels', 262, 236], ['the north-east porch’s east end', 1018, 238],
      ['the inn’s porch, west end', 1094, 288], ['the inn’s porch, east end', 1340, 287], ['the far east house’s door (down the inn’s side stair)', 1439, 320],
      ['the landing at the side stair’s foot', 1386, 345], ['the east house’s door (its porch)', 1396, 594], ['the east house’s porch, east end', 1476, 594],
      ['up the east house’s side walk', 1320, 502], ['the west dock’s first finger', 34, 468], ['the second finger', 34, 532], ['the third finger', 34, 596],
      ['the south-east dock’s corner, past the barrel', 1330, 800], ['past the barrels south of the square', 836, 798]] },
    // the trees: the painting is all water, so its own are put by hand (extraTrees); past it, the banks' woods
    treeGen: { dark: 0.62, fir: 0.15, roads: [[-460, 335, 30, 400], [750, -420, 830, 0]],
      out: { density: 0.62, clump: 260, clear: 0.28, kinds: [0.55, 0.15, 0.3], size: [1.0, 1.6] } },
    // the ground (only the marsh banks past the painting show; the rest lies under the water)
    ground: { cob: 'bogmire_bank_grass', grass: 'bogmire_bank_grass', dirt: 'bogmire_bank_grass', pave: 'bogmire_bank_grass', rep: [4.0, 4.0, 4.0, 4.0], grassTint: [0.85, 0.92, 0.92] },
    // which texture each kind of surface uses. Bogmire has no stone walls, cobbles or plaster, so three of the engine's
    // surface kinds carry its own: 'timber' is the reed thatch (the thatched roofs, built in extra), 'dry' the dead wet
    // wood of the stilts and posts, and 'rock' the tussocks of marsh grass along the banks
    surfaces: { stone: 'shared_stone_wall_rough', planks: 'shared_planks_wall', roof: 'shared_roof_shingle', wood: 'shared_boardwalk_planks', deck: 'shared_boardwalk_planks',
      timber: 'shared_roof_thatch', dry: 'eldergrove_dead_bark', cloth: 'camp_tent_canvas', rock: 'bogmire_bank_grass', soil: 'bogmire_bank_grass', pave: 'shared_boardwalk_planks',
      leaves: 'wick_leaf_canopy', bark: 'eldergrove_dead_bark' },
    // the dark trees' blue-black leaves, the wet wood
    tints: { leaves: 0x7f98b0, firs: 0x7a96a0, bush: 0x8aa8a0, wood: 0xb49c8c },
    night: { fogNear: 24, fogFar: 100 },
    // each texture: Chris's made one if the page carries it (texture-packs/made/), else the stand-in. Written out in full, so
    // the offline build finds the pictures and puts them inside the file.
    textures: [
      { id: 'shared_boardwalk_planks', made: "./../texture-packs/made-web/shared_boardwalk_planks.webp", stand: "./../texture-packs/bogmire-dawnroost/bogmire/stand-in/shared_boardwalk_planks.png" },
      { id: 'shared_planks_wall', made: "./../texture-packs/made-web/shared_planks_wall.webp", stand: "./../texture-packs/bogmire-dawnroost/bogmire/stand-in/shared_planks_wall.png" },
      { id: 'shared_roof_shingle', made: "./../texture-packs/made-web/shared_roof_shingle.webp", stand: "./../texture-packs/bogmire-dawnroost/bogmire/stand-in/shared_roof_shingle.png" },
      { id: 'shared_roof_thatch', made: "./../texture-packs/made-web/shared_roof_thatch.webp", stand: "./../texture-packs/bogmire-dawnroost/bogmire/stand-in/shared_roof_thatch.png" },
      { id: 'shared_water_dark', made: "./../texture-packs/made-web/shared_water_dark.webp", stand: "./../texture-packs/bogmire-dawnroost/bogmire/stand-in/shared_water_dark.png" },
      { id: 'bogmire_bank_grass', made: "./../texture-packs/made-web/bogmire_bank_grass.webp", stand: "./../texture-packs/arenas/bogmire/stand-in/bogmire_bank_grass.png" },
      { id: 'shared_stone_wall_rough', made: "./../texture-packs/made-web/shared_stone_wall_rough.webp", stand: "./../texture-packs/wickhollow/wickhollow/stand-in/shared_stone_wall_rough.png" },
      { id: 'camp_tent_canvas', made: "./../texture-packs/made-web/camp_tent_canvas.webp", stand: "./../texture-packs/wilds-south/warm-roads-camp/stand-in/camp_tent_canvas.png" },
      { id: 'eldergrove_dead_bark', made: "./../texture-packs/made-web/eldergrove_dead_bark.webp", stand: "./../texture-packs/wilds-south/eldergrove-edge/stand-in/eldergrove_dead_bark.png" },
      { id: 'wick_leaf_canopy', made: "./../texture-packs/made-web/wick_leaf_canopy.webp", stand: "./../texture-packs/wickhollow/cottage/stand-in/wick_leaf_canopy.png" },
    ],
    ground_h: ground,
    // where Io's feet stand: the deck she is on, a stair's tread, or a finger of the west dock (a hair over each: FEET)
    walk_h(x, y) {
      for (const s of STAIRS) { const m = s.m != null ? s.m : 4; if (x >= s.x0 - m && x <= s.x1 + m && y > s.yt && y < s.yb) return stairH(s, y) + FEET; }
      for (const f of FINGERS) if (inR(f, x, y)) return -0.1 + FEET;
      return ground(x, y) + FEET;
    },
    water: [{ poly: FEN, level: () => WY, tex: 'shared_water_dark', rep: 6, flow: [0.003, 0.0015], bed: BED }],
    lawns: [],
    start: [70, 368], startFace: 2.4,
    // the doors out (the walking map's exits), and what is past them
    exits: [
      { rect: [34, 341, 52, 391], label: 'The Thornwood' },
      { rect: [765, 0, 814, 18], label: 'The fen’s dark heart' },
    ],

    // ---- the houses: dark board cabins on stilts. Footprints in pixels [x0, y0, x1, y1]; the fronts face south.
    // walls: storeys from the bottom; roof: { ridge: 'ns' | 'ew', rise, over }. The two thatched roofs are built in extra
    // (their roof here is a flat lid under the thatch)
    buildings: [
      { id: 'nw', name: 'the north-west house', fp: [258, 95, 470, 207], floor: H_N, walls: [{ t: 'planks', h: 2.6 }], roof: { ridge: 'ew', rise: 2.5, over: 0.5 },
        doors: [{ side: 's', x: 348, w: 1.1, h: 2.1 }],
        windows: [{ side: 's', x: 297, y: 0.95, w: 0.95, h: 0.9 }, { side: 's', x: 418, y: 1.1, w: 0.8, h: 0.8, dark: true }, { side: 'w', y: 150, z: 1.0, w: 0.7, h: 0.8, dark: true }],
        lanterns: [{ side: 's', x: 372, y: 2.0 }], chimneys: [{ x: 288, y: 118, w: 0.9, d: 0.9, h: 2.6 }] },
      { id: 'north', name: 'the thatched house north of the square', fp: [556, 122, 698, 203], floor: H_N, walls: [{ t: 'planks', h: 2.6 }], roof: { ridge: 'ew', rise: 0.01, over: 0 },
        doors: [{ side: 's', x: 610, w: 1.0, h: 2.0 }], windows: [{ side: 's', x: 657, y: 1.0, w: 0.85, h: 0.8 }],
        chimneys: [{ x: 664, y: 150, w: 0.8, d: 0.8, h: 7.2 }] },
      { id: 'ne', name: 'the north-east house', fp: [852, 105, 1000, 200], floor: 0, walls: [{ t: 'planks', h: 2.5 }], roof: { ridge: 'ew', rise: 2.0, over: 0.5 },
        doors: [{ side: 's', x: 892, w: 1.0, h: 2.0 }], windows: [{ side: 's', x: 958, y: 1.0, w: 0.95, h: 0.8 }, { side: 'e', y: 150, z: 1.0, w: 0.7, h: 0.7, dark: true }],
        chimneys: [{ x: 981, y: 128, w: 0.85, d: 0.85, h: 2.4 }] },
      { id: 'inn', name: 'the Lanternless Inn', fp: [1100, 150, 1305, 278], floor: H_I, walls: [{ t: 'planks', h: 3.0 }, { t: 'planks', h: 2.6 }], roof: { ridge: 'ns', rise: 4.6, over: 0.5 },
        doors: [{ side: 's', x: 1212, w: 1.4, h: 2.3, double: true, arch: true }],
        windows: [{ side: 's', x: 1145, y: 0.9, w: 0.95, h: 1.0 }, { side: 's', x: 1258, y: 0.9, w: 0.95, h: 1.0 }, { side: 's', x: 1164, y: 3.6, w: 0.8, h: 0.9 },
          { side: 's', x: 1208, y: 3.5, w: 1.1, h: 1.2 }, { side: 's', x: 1272, y: 3.6, w: 0.8, h: 0.9 }, { side: 's', x: 1222, y: 6.5, w: 0.8, h: 0.9 },
          { side: 'w', y: 200, z: 1.0, w: 0.8, h: 0.9 }, { side: 'w', y: 230, z: 3.6, w: 0.8, h: 0.9, dark: true }],
        lanterns: [{ side: 's', x: 1180, y: 2.15 }, { side: 's', x: 1244, y: 2.15 }],
        chimneys: [{ x: 1147, y: 192, w: 1.3, d: 1.3, h: 4.2 }] },
      { id: 'inn-wing', name: 'the inn’s east wing', fp: [1305, 175, 1392, 278], floor: H_I, walls: [{ t: 'planks', h: 3.4 }], roof: { ridge: 'ew', rise: 2.3, over: 0.45 },
        windows: [{ side: 's', x: 1346, y: 1.9, w: 0.9, h: 0.9 }, { side: 'e', y: 230, z: 1.0, w: 0.7, h: 0.8, dark: true }] },
      { id: 'far-east', name: 'the far east house', fp: [1400, 210, 1530, 300], floor: 0, walls: [{ t: 'planks', h: 2.5 }], roof: { ridge: 'ew', rise: 1.9, over: 0.5 },
        doors: [{ side: 's', x: 1439, w: 1.0, h: 2.0 }], windows: [{ side: 's', x: 1488, y: 1.0, w: 0.8, h: 0.75 }] },
      { id: 'east', name: 'the east house', fp: [1330, 492, 1468, 580], floor: 0, walls: [{ t: 'planks', h: 2.5 }], roof: { ridge: 'ew', rise: 1.9, over: 0.5 },
        doors: [{ side: 's', x: 1396, w: 1.0, h: 2.0 }], windows: [{ side: 's', x: 1362, y: 1.0, w: 0.85, h: 0.8 }, { side: 's', x: 1430, y: 1.0, w: 0.85, h: 0.8, dark: true }],
        chimneys: [{ x: 1424, y: 512, w: 0.8, d: 0.8, h: 2.2 }] },
      { id: 'se', name: 'the south-east house', fp: [1160, 652, 1256, 760], floor: 0, walls: [{ t: 'planks', h: 2.8 }, { t: 'planks', h: 2.2 }], roof: { ridge: 'ns', rise: 3.2, over: 0.45 },
        doors: [{ side: 's', x: 1192, w: 1.0, h: 2.1 }], windows: [{ side: 's', x: 1236, y: 1.0, w: 0.8, h: 0.85 }, { side: 's', x: 1208, y: 3.4, w: 0.75, h: 0.8 },
          { side: 's', x: 1208, y: 5.4, w: 0.55, h: 0.6, dark: true }] },
      { id: 'se-wing', fp: [1100, 676, 1160, 760], floor: 0, walls: [{ t: 'planks', h: 2.8 }], roof: { ridge: 'ew', rise: 1.6, over: 0.4 },
        windows: [{ side: 's', x: 1130, y: 1.0, w: 0.8, h: 0.8, dark: true }] },
      { id: 'south', name: 'the south house', fp: [844, 662, 1038, 762], floor: 0, walls: [{ t: 'planks', h: 2.6 }], roof: { ridge: 'ew', rise: 2.4, over: 0.55 },
        doors: [{ side: 's', x: 943, w: 1.1, h: 2.1 }], windows: [{ side: 's', x: 885, y: 0.95, w: 0.95, h: 0.9 }, { side: 's', x: 996, y: 0.95, w: 0.95, h: 0.9 }],
        lanterns: [{ side: 's', x: 966, y: 2.0 }], chimneys: [{ x: 953, y: 692, w: 0.9, d: 0.9, h: 2.4 }] },
      { id: 'sw', name: 'the south-west house', fp: [446, 662, 607, 760], floor: 0, walls: [{ t: 'planks', h: 2.6 }], roof: { ridge: 'ew', rise: 0.01, over: 0 },
        doors: [{ side: 's', x: 511, w: 1.0, h: 2.0 }], windows: [{ side: 's', x: 478, y: 1.0, w: 0.8, h: 0.8 }, { side: 's', x: 566, y: 1.0, w: 0.85, h: 0.8 }] },
      { id: 'sw-west', fp: [404, 650, 446, 760], floor: 0, walls: [{ t: 'planks', h: 2.8 }], roof: { ridge: 'ns', rise: 2.6, over: 0.4 },
        windows: [{ side: 's', x: 425, y: 1.0, w: 0.7, h: 0.8, dark: true }] },
    ],

    // no stone walls or steps in Bogmire: its railings are rope on posts, and its stairs wooden (both built in extra)
    walls: [], steps: [],
    // the lamps are lanterns on wooden posts, built in extra; this list is the engine's iron posts and stone pillars (none here)
    lamps: [],
    // small things: barrels, crates, planters, a bench (the walking map blocks each where it stands on the walk; walk pass 2:
    // the bench on the north porch and the barrel by the north-east porch a few pixels in, inside their blocks)
    props: [
      { k: 'barrel', at: [181, 346] }, { k: 'barrel', at: [198, 345] }, { k: 'barrel', at: [234, 347] }, { k: 'barrel', at: [238, 371] }, { k: 'barrel', at: [163, 630] },
      { k: 'barrel', at: [283, 216] }, { k: 'barrel', at: [399, 219] }, { k: 'pot', at: [584, 212] }, { k: 'bench', at: [659, 218], face: 0 },
      { k: 'barrel', at: [972, 207] }, { k: 'barrel', at: [983, 209] },
      { k: 'barrel', at: [1272, 418] }, { k: 'crates', at: [1005, 531] }, { k: 'barrel', at: [1309, 790] }, { k: 'barrel', at: [1124, 772] }, { k: 'barrel', at: [1150, 772] },
      { k: 'pot', at: [905, 772] }, { k: 'pot', at: [977, 772] }, { k: 'pot', at: [431, 771] }, { k: 'pot', at: [472, 771] },
      { k: 'crates', at: [748, 866] }, { k: 'barrel', at: [771, 860] },
      { k: 'barrel', at: [828, 742] }, { k: 'barrel', at: [838, 762] }, { k: 'barrel', at: [828, 782] },
      // (the two at the inn porch's east end stand a little west of its side stair's top)
      { k: 'barrel', at: [1160, 302] }, { k: 'barrel', at: [1336, 299] }, { k: 'barrel', at: [1354, 301] }, { k: 'barrel', at: [1106, 300] },
      { k: 'barrel', at: [586, 420] }, { k: 'barrel', at: [714, 420] },
      { k: 'barrel', at: [862, 396] }, { k: 'barrel', at: [884, 396] }, { k: 'barrel', at: [962, 420] }, { k: 'crates', at: [928, 412] },
      // potted herbs on the herb stall's counter and the porch tables
      { k: 'pot', at: [612, 440], y: 0.92 }, { k: 'pot', at: [636, 440], y: 0.92 }, { k: 'pot', at: [668, 440], y: 0.92 }, { k: 'pot', at: [694, 440], y: 0.92 },
      { k: 'pot', at: [873, 774], y: 0.78 }, { k: 'pot', at: [1005, 772], y: 0.78 }, { k: 'pot', at: [1135, 300], y: H_I + 0.78 }, { k: 'pot', at: [1300, 298], y: H_I + 0.78 },
      // tussocks of marsh grass in the water
      { k: 'rock', at: [1300, 990], y: WY - 0.25, size: 1.6 }, { k: 'rock', at: [40, 880], y: WY - 0.3, size: 1.3 }, { k: 'rock', at: [1500, 990], y: WY - 0.3, size: 1.2 },
      { k: 'rock', at: [215, 925], y: WY - 0.3, size: 1.4 },
    ],
    // the lights for the light map: [x, y, radius px, strength, colour]. The lanterns' own are added in extra.
    lights: [
      [1212, 300, 110, 0.6, 'warm'], [1150, 296, 70, 0.4, 'warm'], [1260, 298, 70, 0.4, 'warm'], [943, 784, 70, 0.4, 'warm'], [885, 776, 50, 0.3, 'warm'],
      [996, 776, 50, 0.3, 'warm'], [348, 222, 60, 0.35, 'warm'], [297, 220, 50, 0.3, 'warm'], [610, 214, 50, 0.3, 'warm'], [657, 214, 50, 0.3, 'warm'],
      [958, 212, 50, 0.3, 'warm'], [1236, 774, 50, 0.3, 'warm'], [1362, 592, 50, 0.3, 'warm'], [1488, 312, 50, 0.3, 'warm'], [478, 774, 50, 0.3, 'warm'], [566, 774, 50, 0.3, 'warm'],
    ],
    trees: 'bogmire',
    // the painting's own trees, by hand (all stand in the water): the dark tree in the north-west corner, the bare tree in
    // the north-east, and the dead trees (kind 2: bare and crooked)
    extraTrees: [[178, 196, 1.7, 0, 21], [118, 120, 1.25, 0, 22], [1500, 118, 1.8, 2, 23], [32, 196, 1.5, 2, 24], [84, 772, 1.35, 2, 25], [214, 926, 1.9, 2, 26],
      [562, 62, 1.4, 2, 27], [306, 626, 1.0, 2, 28], [1460, 1010, 1.3, 2, 29], [30, 520, 1.2, 2, 30]],
    // the pockets, past the 2D walk: the narrow side walk up the north-west house's east side, behind the reeds, to a little
    // back deck behind the house; and the punt landing past the end of the south-east dock, through a gap in its rail and
    // round behind the reeds
    walkAdd: [
      { poly: [[472, 214], [495, 214], [495, 66], [382, 66], [382, 92], [472, 92]], ground: 'cob' },
      { poly: [[1476, 731], [1528, 731], [1528, 842], [1506, 842], [1506, 753], [1476, 753]], ground: 'cob' },
    ].concat(MORE.map((poly) => ({ poly, ground: 'cob' }))),
    // where the 3D hides Bogmire's keepsakes: the Hag-Stone on the back deck behind the north-west house (in the 2D game it
    // lies out along the north-west boardwalk), the Bogstriders at the punt landing past the south-east dock's end
    items: { 'hag-stone': [390, 79], 'bogstriders': [1517, 834] },

    // ---- everything the engine has no field for: the boardwalks and their stilts, the rope railings, the stairs, ladders,
    // the thatched roofs, the lanterns on posts, the market's stalls, lamp, notice board and carts, the mooring crane, the
    // inn's balcony and sign, the punt, the reeds, lily pads and snags
    extra(K) {
      const { B, X, Z, R } = K, TAU = Math.PI * 2;
      const V3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);
      const UP = new THREE.Vector3(0, 1, 0), _q = new THREE.Quaternion(), _d = new THREE.Vector3();
      const mkRod = (seg) => { const g = new THREE.CylinderGeometry(1, 1, 1, seg, 1, true); g.translate(0, 0.5, 0); const n = g.toNonIndexed(); g.dispose(); return n; };
      const ROD5 = mkRod(5), ROD3 = mkRod(3);
      // a round rod from a to b (braces, ropes, chains, rails)
      function rod(k, a, b, r, col, thin) {
        _d.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]); const L = _d.length(); if (L < 1e-4) return; _d.multiplyScalar(1 / L); _q.setFromUnitVectors(UP, _d);
        B.geom(k, thin ? ROD3 : ROD5, new THREE.Matrix4().compose(V3(a), _q, new THREE.Vector3(r, L, r)), col, [0.4, L]);
      }
      const DECK = [0.82, 0.8, 0.8], EDGE = [0.58, 0.5, 0.47], STILT = [0.8, 0.74, 0.74], ROPE = [0.42, 0.34, 0.25];

      // every post and stilt stands somewhere: a stilt isn't put where a rail's post already stands
      const posts = new Map(), cellK = (x, z) => Math.floor(x / 0.8) + ',' + Math.floor(z / 0.8);
      const near = (x, z, r) => { const cx = Math.floor(x / 0.8), cz = Math.floor(z / 0.8); for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (const p of posts.get((cx + i) + ',' + (cz + j)) || []) if (Math.hypot(p[0] - x, p[1] - z) < r) return true; return false; };
      const mark = (x, z) => { const k = cellK(x, z); (posts.get(k) || posts.set(k, []).get(k)).push([x, z]); };

      // ---- the rope railings ----
      const railY = (h, px, py) => typeof h === 'number' ? h : stairH(STAIRS[+h.slice(1)], py) || 0;
      for (const [h, pts] of RAILS) {
        let prev = null;
        for (let k = 1; k < pts.length; k++) {
          const [ax, ay] = pts[k - 1], [bx, by] = pts[k], L = Math.hypot(X(bx) - X(ax), Z(by) - Z(ay)), n = Math.max(1, Math.round(L / 1.9));
          for (let i = k === 1 ? 0 : 1; i <= n; i++) {
            const px = ax + (bx - ax) * i / n, py = ay + (by - ay) * i / n, x = X(px), z = Z(py), y = railY(h, px, py);
            if (!near(x, z, 0.3)) {
              B.cyl('dry', x, BED - 0.2, z, 0.13, 0.115, y + 0.95 - BED + 0.2, 6, STILT, [0.8, 2]);
              B.cyl('cloth', x, y + 0.6, z, 0.135, 0.135, 0.09, 6, [0.4, 0.33, 0.26], null, true);
              mark(x, z);
            }
            const cur = [x, y + 0.72, z];
            if (prev) {
              // the rope, sagging between the posts
              const sag = Math.min(0.2, 0.06 * Math.hypot(cur[0] - prev[0], cur[2] - prev[2])), q = [];
              for (let s = 0; s <= 3; s++) { const t = s / 3; q.push([prev[0] + (cur[0] - prev[0]) * t, prev[1] + (cur[1] - prev[1]) * t - sag * 4 * t * (1 - t), prev[2] + (cur[2] - prev[2]) * t]); }
              for (let s = 1; s < q.length; s++) rod('cloth', q[s - 1], q[s], 0.022, ROPE, true);
              // a cross brace between every other pair of posts, under the deck
              if ((i + k) % 2 === 0 && typeof h === 'number') rod('dry', [prev[0], WY + 0.15, prev[2]], [cur[0], h - 0.3, cur[2]], 0.045, STILT);
            }
            prev = cur;
          }
        }
      }

      // ---- the decks: boards on top, an edge board round them, stilts along their edges ----
      const stiltsAlong = (ax, az, bx, bz, y) => {
        const L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(L / 2.2));
        for (let i = 0; i <= n; i++) { const x = ax + (bx - ax) * i / n, z = az + (bz - az) * i / n; if (near(x, z, 0.75)) continue; B.cyl('dry', x, BED - 0.2, z, 0.13, 0.13, y - 0.05 - BED + 0.2, 6, STILT, [0.8, 2], true); mark(x, z); }
      };
      function deck(r, y, dir, k, noStilts) {
        const off = (k % 4) * 0.003, yy = y + off, x0 = X(r[0]), x1 = X(r[2]), z0 = Z(r[1]), z1 = Z(r[3]), t = 0.24;
        if (dir === 'ew') B.quad('deck', [x0, yy, z1], [x1, yy, z1], [x1, yy, z0], [x0, yy, z0], [x0, z1, x1, z0], DECK);
        else B.quad('deck', [x1, yy, z1], [x1, yy, z0], [x0, yy, z0], [x0, yy, z1], [z1, x1, z0, x0], DECK);
        B.quad('wood', [x0, y - t, z1], [x1, y - t, z1], [x1, yy, z1], [x0, yy, z1], [x0, 0, x1, t], EDGE);
        B.quad('wood', [x1, y - t, z0], [x0, y - t, z0], [x0, yy, z0], [x1, yy, z0], [x0, 0, x1, t], EDGE);
        B.quad('wood', [x1, y - t, z1], [x1, y - t, z0], [x1, yy, z0], [x1, yy, z1], [z0, 0, z1, t], EDGE);
        B.quad('wood', [x0, y - t, z0], [x0, y - t, z1], [x0, yy, z1], [x0, yy, z0], [z0, 0, z1, t], EDGE);
        if (noStilts) return;
        const i = 0.12;
        stiltsAlong(x0 + i, z1 - i, x1 - i, z1 - i, y); stiltsAlong(x0 + i, z0 + i, x1 - i, z0 + i, y);
        stiltsAlong(x0 + i, z0 + i, x0 + i, z1 - i, y); stiltsAlong(x1 - i, z0 + i, x1 - i, z1 - i, y);
      }
      DECKS.forEach(([r, y, dir], k) => deck(r, y, dir, k));
      // the houses stand on platforms of their own
      P.bogmire.buildings.forEach((b, k) => deck(b.fp, b.floor, 'ns', k + 1));
      // the square: one deck, its corners cut
      {
        const pts = SQUARE.map(([px, py]) => [X(px), Z(py)]); let area = 0;
        for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; area += a[0] * b[1] - b[0] * a[1]; }
        const P2 = area > 0 ? pts.slice().reverse() : pts, cx = P2.reduce((s, p) => s + p[0], 0) / P2.length, cz = P2.reduce((s, p) => s + p[1], 0) / P2.length;
        for (let i = 0; i < P2.length; i++) {
          const a = P2[i], b = P2[(i + 1) % P2.length];
          B.tri('deck', [cx, 0.002, cz], [a[0], 0.002, a[1]], [b[0], 0.002, b[1]], [[cx, -cz], [a[0], -a[1]], [b[0], -b[1]]], DECK);
          // its edge board, facing out
          B.quad('wood', [a[0], -0.24, a[1]], [b[0], -0.24, b[1]], [b[0], 0.002, b[1]], [a[0], 0.002, a[1]], [0, 0, Math.hypot(b[0] - a[0], b[1] - a[1]), 0.24], EDGE);
          stiltsAlong(a[0], a[1], b[0], b[1], 0);
        }
        // a few stilts under the middle, seen between the posts from the water's edge
        for (let px = 560; px < 1000; px += 70) for (let py = 380; py < 540; py += 60) { const x = X(px), z = Z(py); B.cyl('dry', x, BED - 0.2, z, 0.15, 0.15, BED * -1 + 0.15, 6, STILT, [0.8, 2], true); }
      }

      // ---- the stairs: treads climbing north, a riser under each, the stringers along both sides, stilts under them ----
      for (const s of STAIRS) {
        const xa = X(s.x0), xb = X(s.x1), L = s.yb - s.yt;
        for (let k = 1; k <= s.n; k++) {
          const ya = s.yb - L * k / s.n, yb = s.yb - L * (k - 1) / s.n, top = s.h * k / s.n, lo = s.h * (k - 1) / s.n;
          B.box('deck', (xa + xb) / 2, top - 0.07, (Z(ya) + Z(yb)) / 2, xb - xa, 0.07, Z(yb) - Z(ya) + 0.03, 0, DECK);
          B.box('wood', (xa + xb) / 2, lo - 0.05, Z(yb) - 0.02, xb - xa - 0.1, top - lo, 0.04, 0, EDGE);
        }
        for (const x of [xa - 0.05, xb + 0.05]) {
          const z0 = Z(s.yt), z1 = Z(s.yb), sgn = x < (xa + xb) / 2 ? -1 : 1;
          const q = [[x, s.h - 0.3, z0], [x, -0.3, z1], [x, 0.05, z1], [x, s.h + 0.05, z0]];
          if (sgn < 0) B.quad('wood', q[0], q[1], q[2], q[3], [0, 0, z1 - z0, 0.35], EDGE); else B.quad('wood', q[1], q[0], q[3], q[2], [0, 0, z1 - z0, 0.35], EDGE);
          stiltsAlong(x, z0 + 0.2, x, z1 - 0.3, s.h * 0.5);
        }
      }

      // ---- ladders down to the water ----
      for (const [px, py, h, side] of LADDERS) {
        const x = X(px), z = Z(py) + (side === 's' ? 0.08 : -0.08), y0 = WY - 0.4, y1 = h + 0.45;
        for (const dx of [-0.22, 0.22]) B.box('wood', x + dx, y0, z, 0.06, y1 - y0, 0.06, 0, EDGE);
        for (let y = y0 + 0.25; y < h; y += 0.3) B.box('wood', x, y, z, 0.44, 0.04, 0.05, 0, EDGE);
      }

      // ---- the thatched roofs (the house north of the square, and the south-west house): two thick slopes of reed thatch,
      // a rolled ridge, board gables ----
      function thatch(b, rise, o) {
        const [px0, py0, px1, py1] = b.fp, x0 = X(px0), x1 = X(px1), z0 = Z(py0), z1 = Z(py1), cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, d = z1 - z0, w = x1 - x0;
        const E = b.floor + b.walls.reduce((s, l) => s + l.h, 0), s = rise / (d / 2), ye = E - o * s, yr = E + rise + 0.12, L = w + 2 * o, sl = Math.hypot(d / 2 + o, rise + o * s), T = [0.95, 0.95, 0.95], U = [0.45, 0.42, 0.42];
        const N = [[x1 + o, ye, z0 - o], [x0 - o, ye, z0 - o], [x0 - o, yr, cz], [x1 + o, yr, cz]], S = [[x0 - o, ye, z1 + o], [x1 + o, ye, z1 + o], [x1 + o, yr, cz], [x0 - o, yr, cz]];
        B.quad('timber', N[0], N[1], N[2], N[3], [0, 0, L, sl], T); B.quad('timber', S[0], S[1], S[2], S[3], [0, 0, L, sl], T);
        B.quad('timber', N[1], N[0], N[3], N[2], [0, 0, L, sl], U); B.quad('timber', S[1], S[0], S[3], S[2], [0, 0, L, sl], U);
        // the thatch's thick edge along the eaves and up the gables
        const th = 0.32;
        B.quad('timber', [x0 - o, ye - th, z1 + o], [x1 + o, ye - th, z1 + o], [x1 + o, ye, z1 + o], [x0 - o, ye, z1 + o], [0, 0, L, th], [0.7, 0.68, 0.68]);
        B.quad('timber', [x1 + o, ye - th, z0 - o], [x0 - o, ye - th, z0 - o], [x0 - o, ye, z0 - o], [x1 + o, ye, z0 - o], [0, 0, L, th], [0.7, 0.68, 0.68]);
        for (const [x, sg] of [[x0 - o, -1], [x1 + o, 1]]) {
          const SQ = [[x, ye - th, z1 + o], [x, yr - th, cz], [x, yr, cz], [x, ye, z1 + o]], NQ = [[x, yr - th, cz], [x, ye - th, z0 - o], [x, ye, z0 - o], [x, yr, cz]], C = [0.6, 0.58, 0.58];
          for (const q of [SQ, NQ]) { if (sg > 0) B.quad('timber', q[0], q[1], q[2], q[3], [0, 0, sl, th], C); else B.quad('timber', q[1], q[0], q[3], q[2], [0, 0, sl, th], C); }
        }
        B.box('timber', cx, yr - 0.22, cz, L, 0.42, 0.55, 0, [0.8, 0.78, 0.76]);
        // the gables at the east and west ends, of boards
        B.tri('planks', [x1, E, z1], [x1, E, z0], [x1, E + rise, cz], [[0, E], [d, E], [d / 2, E + rise]]);
        B.tri('planks', [x0, E, z0], [x0, E, z1], [x0, E + rise, cz], [[0, E], [d, E], [d / 2, E + rise]]);
      }
      const BLD = Object.fromEntries(P.bogmire.buildings.map((b) => [b.id, b]));
      thatch(BLD.north, 2.2, 0.45); thatch(BLD.sw, 2.4, 0.5);

      // the drying frame on the bridge's north edge, a cloth hung over it: behind it, and the house's corner, the narrow
      // side walk runs off north (the first pocket)
      {
        const xa = X(500), xb = X(554), z = Z(204), y = H_N;
        for (const x of [xa, xb]) B.cyl('dry', x, BED - 0.2, z, 0.12, 0.1, y + 2.1 - BED + 0.2, 6, STILT, [0.8, 2]);
        rod('wood', [xa - 0.1, y + 2.0, z], [xb + 0.1, y + 2.0, z], 0.05, EDGE);
        const n = 6;
        for (let i = 0; i < n; i++) {
          const a = xa + 0.1 + (xb - xa - 0.2) * i / n, b = xa + 0.1 + (xb - xa - 0.2) * (i + 1) / n, sa = 0.12 * Math.sin(Math.PI * i / n), sb = 0.12 * Math.sin(Math.PI * (i + 1) / n);
          B.quad('cloth', [a, y + 0.55 + sa, z + 0.02], [b, y + 0.55 + sb, z + 0.02], [b, y + 1.98, z + 0.02], [a, y + 1.98, z + 0.02], [a, 0, b, 1.4], [0.6, 0.66, 0.72]);
        }
      }

      // ---- the lanterns on wooden posts, each with its warm pool of light on the boards ----
      for (const [px, py, h, ph] of LAMPS) {
        const x = X(px), z = Z(py);
        B.cyl('dry', x, h - 0.05, z, 0.14, 0.12, ph, 7, STILT, [0.9, 2]);
        B.cyl('cloth', x, h + ph * 0.55, z, 0.15, 0.15, 0.12, 7, [0.6, 0.52, 0.42], null, true);
        B.box('wood', x, h + ph - 0.02, z, 0.34, 0.06, 0.34, 0, EDGE);
        K.lantern(x, h + ph + 0.06, z, null, 1.0);
        K.light(px, py - 4, 150, 1.25, 'warm');
        K.addBlock(K.circlePx(px, py, 0.2, 8));
      }
      // the lamp pole by the long walk: a tall post, an arm out west, a lantern hanging from it (walk pass 2: two pixels west,
      // off the 2D walk's edge)
      {
        const x = X(735), z = Z(146);
        B.cyl('dry', x, -0.05, z, 0.14, 0.11, 4.4, 7, STILT, [0.9, 3]);
        B.box('wood', x - 0.35, 4.0, z, 0.9, 0.1, 0.1, 0, EDGE); rod('wood', [x, 3.4, z], [x - 0.55, 4.0, z], 0.035, EDGE);
        rod('iron', [x - 0.7, 4.0, z], [x - 0.7, 3.65, z], 0.012, null, true);
        K.lantern(x - 0.7, 3.25, z, null, 0.95, true);
        K.light(720, 140, 150, 1.15, 'warm'); K.addBlock(K.circlePx(735, 146, 0.2, 8));
      }

      // ---- the market square ----
      // a stall: four posts, a cloth awning sloping down to the front with a hanging edge, a counter and a back table
      function stall(xa, xb, yf, yb, cloth, edge) {
        const x0 = X(xa), x1 = X(xb), zf = Z(yf), zb = Z(yb);
        for (const x of [x0 + 0.1, x1 - 0.1]) { B.box('wood', x, 0, zf - 0.1, 0.12, 2.3, 0.12, 0, EDGE); B.box('wood', x, 0, zb + 0.1, 0.12, 2.9, 0.12, 0, EDGE); }
        B.box('wood', (x0 + x1) / 2, 2.2, zf - 0.1, x1 - x0, 0.1, 0.1, 0, EDGE); B.box('wood', (x0 + x1) / 2, 2.8, zb + 0.1, x1 - x0, 0.1, 0.1, 0, EDGE);
        const n = Math.max(2, Math.round((x1 - x0) / 1.4)), W = (x1 - x0 + 0.4) / n;
        for (let i = 0; i < n; i++) {
          // the awning in panels (it sags a little between the poles), and its hanging edge
          const a = x0 - 0.2 + W * i, b = a + W, col = i % 2 ? cloth.map((c) => c * 0.9) : cloth;
          B.quad('cloth', [a, 2.25, zf + 0.25], [b, 2.25, zf + 0.25], [b, 2.95, zb - 0.05], [a, 2.95, zb - 0.05], [0, 0, W, zf - zb], col);
          for (let s = 0; s < 3; s++) { const u = a + W * s / 3, v = u + W / 3; B.quad('cloth', [u, 1.95, zf + 0.26], [v, 1.95, zf + 0.26], [v, 2.25, zf + 0.26], [u, 2.25, zf + 0.26], [0, 0, W / 3, 0.3], edge); B.tri('cloth', [u, 1.95, zf + 0.26], [v, 1.95, zf + 0.26], [(u + v) / 2, 1.82, zf + 0.26], [[0, 0], [1, 0], [0.5, -0.4]], edge); }
        }
        B.box('wood', (x0 + x1) / 2, 0, zf - 0.6, x1 - x0 - 0.6, 0.9, 0.7, 0, [0.8, 0.66, 0.56]);
        B.box('wood', (x0 + x1) / 2, 0, zb + 0.9, x1 - x0 - 1.2, 0.8, 0.6, 0, [0.72, 0.6, 0.52]);
        return { x0, x1, zf, zb };
      }
      const herb = stall(590, 720, 452, 346, [0.17, 0.32, 0.3], [0.34, 0.4, 0.16]);
      // herbs hanging in bunches from the awning's front, jars and baskets on the back table
      for (let i = 0; i < 8; i++) {
        const x = herb.x0 + 0.5 + (herb.x1 - herb.x0 - 1) * i / 7, z = herb.zf - 0.05;
        rod('cloth', [x, 2.2, z], [x, 1.85, z], 0.01, ROPE, true);
        B.geom('leafBush', K.ico[i % 3], new THREE.Matrix4().compose(new THREE.Vector3(x, 1.68, z), new THREE.Quaternion(), new THREE.Vector3(0.16, 0.24, 0.16)), [0.7, 0.85, 0.6], 1);
      }
      for (let i = 0; i < 7; i++) { const x = herb.x0 + 1.0 + i * 0.6, z = herb.zb + 0.9; B.cyl(i % 2 ? 'stone' : 'wood', x, 0.8, z, 0.11, 0.13, 0.22, 7, i % 2 ? [0.6, 0.8, 0.75] : [0.85, 0.7, 0.5]); }
      const trader = stall(842, 972, 450, 346, [0.38, 0.16, 0.23], [0.3, 0.13, 0.22]);
      // a sack and a few small goods on the trader's counter
      B.geom('cloth', K.ico[1], new THREE.Matrix4().compose(new THREE.Vector3(trader.x0 + 0.5, 0.35, trader.zf - 0.2), new THREE.Quaternion(), new THREE.Vector3(0.32, 0.4, 0.3)), [0.85, 0.78, 0.62], 1);
      for (let i = 0; i < 5; i++) B.box('wood', trader.x0 + 1.4 + i * 0.7, 0.9, trader.zf - 0.6, 0.4, 0.25, 0.3, i * 0.3, [0.85, 0.7, 0.55]);

      // the square's lamp: two lanterns on an iron post, standing in a big wooden tub of yellow flowers
      {
        const x = X(781), z = Z(466);
        B.cyl('wood', x, 0, z, 1.0, 0.95, 0.72, 16, [0.72, 0.58, 0.48], [3, 0.7]);
        for (const y of [0.12, 0.55]) B.cyl('iron', x, y, z, 1.0, 0.99, 0.06, 16, null, null, true);
        const soil = new THREE.CircleGeometry(0.9, 14); soil.rotateX(-Math.PI / 2); B.geom('soil', soil, new THREE.Matrix4().makeTranslation(x, 0.66, z), [0.45, 0.4, 0.35], 1); soil.dispose();
        for (let i = 0; i < 9; i++) { const a = i / 9 * TAU, r = i % 3 === 0 ? 0.25 : 0.6, fx = x + Math.cos(a) * r, fz = z + Math.sin(a) * r, s = 0.42;
          for (const t of [a, a + 1.57]) B.quad('fl_sun', [fx - Math.cos(t) * s, 0.6, fz - Math.sin(t) * s], [fx + Math.cos(t) * s, 0.6, fz + Math.sin(t) * s], [fx + Math.cos(t) * s, 1.25, fz + Math.sin(t) * s], [fx - Math.cos(t) * s, 1.25, fz - Math.sin(t) * s], [0, 0, 1, 1]); }
        B.cyl('iron', x, 0.6, z, 0.09, 0.06, 3.8, 8);
        B.box('iron', x, 3.55, z, 2.0, 0.07, 0.07, 0);
        for (const sx of [-1, 1]) { rod('iron', [x, 3.0, z], [x + sx * 0.7, 3.55, z], 0.025, null, true); K.lantern(x + sx * 0.95, 3.68, z, null, 1.1); }
        B.cyl('iron', x, 4.4, z, 0.08, 0.01, 0.35, 6);
        K.light(781, 448, 210, 1.5, 'warm');
      }
      // the notice board, with four notices pinned on it
      {
        const x = X(775), z = Z(506);
        for (const dx of [-0.45, 0.45]) B.box('wood', x + dx, 0, z, 0.08, 1.55, 0.08, 0, EDGE);
        B.box('wood', x, 0.75, z, 1.1, 0.75, 0.06, 0, [0.75, 0.6, 0.5]);
        B.box('wood', x, 1.5, z, 1.25, 0.06, 0.16, 0, EDGE);
        [[-0.27, 1.12], [0.22, 1.18], [-0.22, 0.86], [0.27, 0.88]].forEach(([dx, dy], i) => B.quad('cloth', [x + dx - 0.16, dy - 0.11, z + 0.035], [x + dx + 0.16, dy - 0.11, z + 0.035], [x + dx + 0.16, dy + 0.13, z + 0.035], [x + dx - 0.16, dy + 0.13, z + 0.035], [0, 0, 0.3, 0.3], [1.25 - i * 0.04, 1.2, 1.05]));
      }
      // the two covered handcarts at the square's south edge: a low cart, two wheels, its load under a pale cloth
      const wheel = new THREE.CylinderGeometry(0.42, 0.42, 0.08, 12); wheel.rotateX(Math.PI / 2);
      const cover = new THREE.CylinderGeometry(0.58, 0.58, 2.3, 9, 1, true, 0, Math.PI); cover.rotateZ(Math.PI / 2);
      for (const [px, py] of [[645, 521], [906, 521]]) {
        const x = X(px), z = Z(py);
        B.box('wood', x, 0.42, z, 2.4, 0.3, 1.15, 0, [0.75, 0.6, 0.5]);
        for (const sz of [-0.62, 0.62]) { B.geom('wood', wheel, new THREE.Matrix4().makeTranslation(x, 0.42, z + sz), [0.55, 0.45, 0.4], 1); }
        B.geom('cloth', cover, new THREE.Matrix4().makeTranslation(x, 0.72, z), [0.46, 0.46, 0.5], [2, 2]);
        for (const sz of [-0.4, 0.4]) rod('wood', [x - 1.2, 0.6, z + sz], [x - 2.0, 0.75, z + sz], 0.035, EDGE);
      }
      wheel.dispose(); cover.dispose();
      // the dark lanterns: the town's lights the wraith has taken, standing unlit on the boards
      for (const [px, py] of [[555, 535], [575, 538], [978, 534]]) {
        const x = X(px), z = Z(py), D = [0.42, 0.45, 0.55];
        B.box('iron', x, 0, z, 0.36, 0.06, 0.36, 0); B.box('iron', x, 0.06, z, 0.26, 0.42, 0.26, 0, D);
        for (const [dx, dz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) B.box('iron', x + dx * 0.13, 0.06, z + dz * 0.13, 0.04, 0.42, 0.04, 0);
        B.box('iron', x, 0.48, z, 0.36, 0.06, 0.36, 0); B.cyl('iron', x, 0.54, z, 0.18, 0.02, 0.16, 4);
      }
      // the bollard where the west boardwalk meets the square
      B.cyl('dry', X(531), -0.05, Z(479), 0.22, 0.2, 0.85, 8, STILT, [1, 1]);

      // ---- the landing: the mooring crane (two tall posts, a beam, a brace, a lantern on a chain), the mooring post, the
      // corner post ----
      {
        const xa = X(44), za = Z(334), xb = X(158), zb = Z(352);
        B.cyl('dry', xa, -0.05, za, 0.17, 0.15, 4.4, 8, STILT, [1, 3]); B.cyl('dry', xb, -0.05, zb, 0.18, 0.16, 4.4, 8, STILT, [1, 3]);
        rod('wood', [xa - 0.4, 4.05, za], [xb + 0.3, 4.05, zb], 0.11, EDGE);
        rod('wood', [xb, 3.0, zb], [xb - 1.2, 4.0, zb - 0.15], 0.06, EDGE);
        const lx = X(73), lz = za + (zb - za) * (73 - 44) / (158 - 44);
        rod('iron', [lx, 4.0, lz], [lx, 3.25, lz], 0.012, null, true);
        K.lantern(lx, 2.85, lz, null, 0.9, true);
        K.light(73, 338, 130, 1.0, 'warm');
        B.cyl('dry', X(124), -0.05, Z(345), 0.2, 0.18, 0.9, 8, STILT, [1, 1]); B.cyl('cloth', X(124), 0.55, Z(345), 0.22, 0.22, 0.14, 8, ROPE, null, true);
        B.cyl('dry', X(251), -0.05, Z(386), 0.18, 0.16, 1.3, 8, STILT, [1, 1]);
      }

      // ---- the inn: its balcony over the porch, its sign hanging from an arm off the west wall, tables on the porch ----
      {
        const x0 = X(1178), x1 = X(1285), zw = Z(278), zf = zw + 0.75, y = H_I + 3.0;
        B.box('deck', (x0 + x1) / 2, y - 0.15, (zw + zf) / 2, x1 - x0, 0.15, zf - zw, 0, DECK);
        for (let x = x0; x <= x1 + 0.01; x += (x1 - x0) / 10) B.box('wood', x, y, zf - 0.04, 0.06, 0.85, 0.06, 0, EDGE);
        B.box('wood', (x0 + x1) / 2, y + 0.85, zf - 0.04, x1 - x0 + 0.1, 0.07, 0.1, 0, EDGE);
        for (const x of [x0 + 0.2, x1 - 0.2]) rod('wood', [x, y - 0.9, zw], [x, y - 0.15, zf - 0.1], 0.05, EDGE);
        // its railing round both ends too, back to the wall: an upper balcony, reached from inside the inn only
        for (const x of [x0 + 0.03, x1 - 0.03]) {
          B.box('wood', x, y + 0.85, (zw + zf) / 2, 0.08, 0.07, zf - zw, 0, EDGE);
          for (const z of [zw + 0.2, zw + 0.45]) B.box('wood', x, y, z, 0.06, 0.85, 0.06, 0, EDGE);
        }
        const sx = X(1100), sz = Z(236), sy = H_I + 4.0;
        rod('wood', [sx, sy, sz], [X(1036), sy, sz], 0.07, EDGE); rod('wood', [sx, sy - 0.8, sz], [X(1080), sy, sz], 0.04, EDGE);
        for (const px of [1050, 1078]) rod('iron', [X(px), sy, sz], [X(px), sy - 0.55, sz], 0.012, null, true);
        B.box('wood', X(1064), sy - 1.35, sz, 1.15, 0.8, 0.07, 0, [0.85, 0.66, 0.5]);
        B.box('wood', X(1064), sy - 1.45, sz, 0.9, 0.12, 0.07, 0, [0.85, 0.66, 0.5]);
      }
      function table(px, py, y) {
        const x = X(px), z = Z(py);
        B.box('wood', x, y + 0.7, z, 1.1, 0.07, 0.7, 0, [0.8, 0.65, 0.52]);
        for (const [dx, dz] of [[-0.45, -0.27], [0.45, -0.27], [0.45, 0.27], [-0.45, 0.27]]) B.box('wood', x + dx, y, z + dz, 0.07, 0.7, 0.07, 0, EDGE);
      }
      table(1135, 300, H_I); table(1300, 298, H_I); table(873, 772, 0); table(1005, 771, 0);

      // ---- the water stair: a bucket on a rope from a little arm at the landing's edge ----
      {
        const x = X(716), z = Z(860);
        B.cyl('dry', x, -0.05, z, 0.08, 0.07, 1.5, 6, STILT, [0.5, 1.5]);
        rod('wood', [x, 1.4, z], [x - 0.7, 1.45, z], 0.04, EDGE);
        rod('cloth', [x - 0.68, 1.45, z], [x - 0.68, -0.55, z], 0.012, ROPE, true);
        B.cyl('wood', x - 0.68, -0.85, z, 0.15, 0.18, 0.32, 9, [0.7, 0.55, 0.45]);
        B.cyl('iron', x - 0.68, -0.65, z, 0.185, 0.185, 0.04, 9, null, null, true);
      }

      // ---- the punt, moored at the landing past the south-east dock ----
      {
        const x = X(1517), z = Z(880), y = WY - 0.12;
        B.box('wood', x, y, z, 1.1, 0.36, 3.3, 0, [0.62, 0.5, 0.44]);
        B.box('deck', x, y + 0.3, z, 0.8, 0.05, 2.9, 0, [0.7, 0.62, 0.58]);
        B.box('wood', x, y + 0.36, z - 0.5, 1.0, 0.06, 0.25, 0, EDGE); B.box('wood', x, y + 0.36, z + 0.7, 1.0, 0.06, 0.25, 0, EDGE);
        rod('wood', [x - 0.3, y + 0.4, z + 1.3], [x + 0.4, y + 0.45, z - 1.6], 0.03, EDGE);
        rod('cloth', [x, y + 0.36, z - 1.6], [X(1517), -0.05, Z(846)], 0.015, ROPE, true);
      }

      // ---- the reeds: tall pale blades standing in the water, a few with dark seed heads ----
      const reedClump = (x, z, rw, h, seed) => {
        const r = W3D.rand(seed), n = Math.max(12, Math.round(rw * 26));
        for (let i = 0; i < n; i++) {
          const a = r() * TAU, d = r() * rw, bx = x + Math.cos(a) * d, bz = z + Math.sin(a) * d * 0.7, hh = h * (0.55 + r() * 0.5), la = r() * TAU, lean = 0.08 + r() * 0.3, w = 0.045 + r() * 0.04;
          const tx = bx + Math.cos(la) * lean * hh * 0.4, tz = bz + Math.sin(la) * lean * hh * 0.4, ca = Math.cos(a + 1.57) * w, sa = Math.sin(a + 1.57) * w;
          const g = 0.75 + r() * 0.45, col = [0.27 * g, 0.38 * g, 0.28 * g];
          B.tri('cloth', [bx - ca, WY - 0.1, bz - sa], [bx + ca, WY - 0.1, bz + sa], [tx, WY + hh, tz], [[0, 0], [0.1, 0], [0.05, 1]], col);
          if (r() < 0.16) B.cyl('wood', bx + (tx - bx) * 0.7, WY + hh * 0.66, bz + (tz - bz) * 0.7, 0.045, 0.045, 0.24, 5, [0.42, 0.3, 0.26]);
        }
      };
      REEDS.forEach(([px, py, hw, hp], i) => reedClump(X(px), Z(py), Math.max(0.35, hw * 0.04), Math.max(1.2, Math.min(2.3, hp / 42)), 100 + i));
      // and on past the painting, scattered over the fen
      {
        const r = W3D.rand(77);
        for (let i = 0; i < 70; i++) {
          const px = -240 + r() * 2020, py = -230 + r() * 1480;
          if (px > -10 && px < 1546 && py > -10 && py < 1034) continue;
          if (K.terrain(px, py) > WY - 0.2) continue;
          if ((px > 740 && px < 840 && py < 0) || (py > 330 && py < 405 && px < 30)) continue;
          reedClump(X(px), Z(py), 0.4 + r() * 0.5, 1.3 + r() * 0.9, 300 + i);
        }
      }
      // ---- the lily pads, floating, some with a small pink flower ----
      const pad = new THREE.CircleGeometry(1, 8, 0.35, TAU - 0.35); pad.rotateX(-Math.PI / 2);
      const lilyAt = (x, z, rr, seed) => {
        const r = W3D.rand(seed), n = 1 + Math.round(rr * 4 * r() + rr * 2);
        for (let i = 0; i < n; i++) {
          const a = r() * TAU, d = r() * rr, s = 0.2 + r() * 0.2, px = x + Math.cos(a) * d, pz = z + Math.sin(a) * d;
          B.geom('leafBush', pad, new THREE.Matrix4().compose(new THREE.Vector3(px, WY + 0.02, pz), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, r() * TAU, 0)), new THREE.Vector3(s, 1, s)), [0.55, 0.78, 0.55], 0.6);
          if (r() < 0.22) { const fs = 0.12; for (const t of [0, 1.57]) B.quad('fl_mix', [px - Math.cos(t) * fs, WY + 0.02, pz - Math.sin(t) * fs], [px + Math.cos(t) * fs, WY + 0.02, pz + Math.sin(t) * fs], [px + Math.cos(t) * fs, WY + 0.2, pz + Math.sin(t) * fs], [px - Math.cos(t) * fs, WY + 0.2, pz - Math.sin(t) * fs], [0, 0, 1, 1], [1.4, 0.75, 0.85]); }
        }
      };
      LILIES.forEach(([px, py, rp], i) => lilyAt(X(px), Z(py), Math.max(0.2, rp * 0.04), 500 + i));
      { const r = W3D.rand(91); for (let i = 0; i < 90; i++) { const px = -240 + r() * 2020, py = -230 + r() * 1480; if (px > -10 && px < 1546 && py > -10 && py < 1034) continue; if (K.terrain(px, py) > WY - 0.2) continue; lilyAt(X(px), Z(py), 0.3 + r() * 0.6, 900 + i); } }
      pad.dispose();

      // ---- the snags: broken-off dead stumps standing up out of the water ----
      SNAGS.forEach(([px, py, h], i) => {
        const r = W3D.rand(700 + i), x = X(px), z = Z(py);
        B.cyl('dry', x, BED, z, 0.32, 0.18, h - BED + WY, 7, [0.75, 0.7, 0.72], [1.2, 2]);
        rod('dry', [x, WY + h * 0.6, z], [x + (r() - 0.5) * 1.4, WY + h + 0.4, z + (r() - 0.5) * 0.8], 0.06, [0.75, 0.7, 0.72]);
      });
      // the low dark bushes on their tussocks (south-east and south-west corners)
      for (const [px, py, s] of [[1300, 984, 1.3], [40, 874, 1.0], [1500, 984, 0.9]]) B.geom('leafBush', K.ico[(px >> 3) % 3], new THREE.Matrix4().compose(new THREE.Vector3(X(px), WY + 0.45 * s, Z(py)), new THREE.Quaternion(), new THREE.Vector3(1.1 * s, 0.75 * s, 1.0 * s)), [0.42, 0.5, 0.5], 2);
    },
  };
})(window);
