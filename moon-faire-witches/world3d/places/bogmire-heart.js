// bogmire-heart.js: the fen's dark heart in 3D, laid out on its painting (reference/art/walk/walk-bogmire-heart.png,
// 1536 x 1024) in the painting's own pixels, as src/game/maps.js keeps the walking map. Where Io can walk is that map's
// own walk and block areas, unchanged (MAPS['bogmire-heart']), and two pockets past them on the drowned hall's porch.
// Since Chris's rule (November 16, 11:22: anywhere that looks walkable is walkable) the whole north row of porches is
// walkable too, along the walkways behind the houses (narrow side strips join them to the porch fronts), the square to
// its rails, its side decks, the long walk's landing, and the west and east houses, over planks laid across from the
// side decks. The south-west and south-east houses stand alone in open water (closed by it), and the square's broken
// boards stay holes.
// The texture ids are the texture pack's (texture-packs/bogmire-dawnroost/bogmire-heart/inventory.md).
// Everything stands on stilts over the water. Heights are metres: the square, its side decks and the long walk in from
// Bogmire are 0; the drowned hall's porch and the row of houses along the north are 0.9 (six steps up from the square);
// the houses east, west and south are 0.4; the water lies at -1.8, its bed at -4. Past the painting the open water goes
// on about ten metres each way to low banks of dead trees and firs in the mist.
(function (G) {
  'use strict';
  const P = G.W3D_PLACES = G.W3D_PLACES || {};
  const ss = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
  const inPoly = (poly, x, y) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
  const edge = (poly, x, y) => { let d = 1e9; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [ax, ay] = poly[j], [bx, by] = poly[i], dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1))); d = Math.min(d, Math.hypot(x - ax - t * dx, y - ay - t * dy)); } return d; };

  const WATER_Y = -1.8, BED = -4.0, NORTH = 0.9, SIDE = 0.4;
  // the open water: past every edge of the painting by about ten metres, to an uneven bank
  const FEN = [[-230, -190], [120, -215], [520, -180], [900, -225], [1300, -190], [1770, -205], [1745, 160], [1785, 520], [1750, 880],
    [1775, 1230], [1300, 1210], [900, 1250], [700, 1235], [400, 1215], [-210, 1240], [-245, 860], [-215, 500], [-250, 150]];

  // ---- the decks on stilts: [x0, y0, x1, y1] in pixels, the top's height, the plank way ('ns': boards laid north to
  // south; else east to west) and the texture key ('deck': the square's mossy planks; 'planks': the boardwalk's) ----
  const DECKS = [
    // the north row: the drowned hall's porch, the houses either side, the walkways between them
    { r: [86, 96, 306, 210], y: NORTH }, { r: [300, 128, 432, 182], y: NORTH, ns: true }, { r: [424, 108, 600, 222], y: NORTH },
    { r: [592, 56, 942, 222], y: NORTH }, { r: [938, 108, 1110, 230], y: NORTH }, { r: [1104, 128, 1182, 182], y: NORTH, ns: true },
    { r: [1174, 154, 1302, 246], y: NORTH }, { r: [1298, 144, 1490, 246], y: NORTH },
    // the west and east houses, with their walkways toward the square
    { r: [36, 334, 262, 455], y: SIDE }, { r: [256, 403, 362, 449], y: SIDE, ns: true },
    { r: [1280, 338, 1506, 449], y: SIDE }, { r: [1280, 300, 1325, 340], y: SIDE }, { r: [1182, 405, 1286, 449], y: SIDE, ns: true },
    // the south-west and south-east houses
    { r: [42, 640, 342, 796], y: SIDE }, { r: [1185, 596, 1480, 776], y: SIDE },
    // the square's side decks, the long walk in from Bogmire (on past the painting to the bank) and its landing
    { r: [425, 413, 497, 538], y: 0 }, { r: [1043, 408, 1107, 548], y: 0 },
    { r: [720, 700, 815, 1262], y: 0 }, { r: [660, 985, 880, 1030], y: 0 },
  ];
  // the square itself: [x0, y0, x1, y1], built plank row by plank row round its broken boards
  const SQUARE = [493, 297, 1047, 702];
  // the broken boards (the walking map's blocks by the rails, and the painting's other gaps): water shows through
  const HOLES = [[497, 360, 541, 379], [497, 504, 541, 519], [497, 598, 531, 623], [549, 354, 566, 366], [549, 394, 566, 403],
    [1005, 405, 1047, 428], [1013, 448, 1047, 458], [999, 494, 1047, 518], [613, 647, 642, 670], [878, 647, 927, 670]];
  // the hall's steps: six treads down from its porch (0.9) to the square
  const STEPS = { x0: 729, x1: 807, y0: 222, y1: 300, n: 6 };
  const stepH = (y) => { const k = Math.min(STEPS.n - 1, Math.floor((y - STEPS.y0) / ((STEPS.y1 - STEPS.y0) / STEPS.n))); return NORTH * (STEPS.n - k) / (STEPS.n + 1); };
  // the side strips (November 16): narrow decks along a house's side, so the walkways behind the north row meet the porch
  // fronts (house-n1's west side, house-n2's east side, house-n3's west side)
  const STRIPS = [{ r: [412, 182, 424, 222], y: NORTH }, { r: [1110, 182, 1122, 230], y: NORTH }, { r: [1160, 182, 1174, 246], y: NORTH }];
  // the planks laid across (November 16), from the square's side decks to the walkways of the west and east houses: from
  // x0 to x1, the plank's top going from ya to yb (metres)
  const PLANKS = [{ x0: 360, x1: 432, y0: 418, y1: 434, ya: SIDE, yb: 0 }, { x0: 1100, x1: 1186, y0: 418, y1: 434, ya: 0, yb: SIDE }];
  const plankH = (p, x) => p.ya + (p.yb - p.ya) * Math.max(0, Math.min(1, (x - p.x0) / (p.x1 - p.x0)));
  const deckAt = (x, y) => { let best = null; for (const d of DECKS.concat(STRIPS)) { const [a, b, c, e] = d.r; if (x >= a && x <= c && y >= b && y <= e && (!best || d.y > best.y)) best = d; } return best; };
  // Io's feet stand a hair (2 mm) over the boards: the engine takes feet at exactly the ground's own height to mean she
  // is on the ground itself, and under the water that is the fen's bed, 4 m down
  const FEET = 0.002;
  const inSquare = (x, y) => x >= SQUARE[0] && x <= SQUARE[2] && y >= SQUARE[1] && y <= SQUARE[3];

  // the ground's height (metres): a deck's top where one stands (the houses' floors and anything set on a deck), else
  // the fen's bed, rising past the open water to the banks
  function ground(x, y) {
    const d = deckAt(x, y); if (d) return d.y;
    if (inSquare(x, y)) return 0;
    const s = inPoly(FEN, x, y) ? -edge(FEN, x, y) : edge(FEN, x, y);
    return BED + 2.6 * ss(-80, 10, s) + 0.7 * ss(10, 220, s);
  }
  // where Io's feet stand: the hall's steps, a plank laid across, else the deck she is on (the porches 0.9, the west and
  // east houses 0.4, the side decks and the long walk 0), else the square (0); a hair over each (FEET)
  function walkH(x, y) {
    if (y > STEPS.y0 && y < STEPS.y1 && x >= STEPS.x0 - 8 && x <= STEPS.x1 + 8) return stepH(y) + FEET;
    for (const p of PLANKS) if (x >= p.x0 && x <= p.x1 && y >= p.y0 - 3 && y <= p.y1 + 3) return plankH(p, x) + FEET;
    const d = deckAt(x, y);
    return (d ? d.y : 0) + FEET;
  }
  // the walkable boards past the 2D walk (Chris's rule, November 16), each a few pixels inside its rails and off the houses
  const R4 = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  const MORE = [
    // the north row (0.9): the north-west house's deck round its west side and front, the walkway behind to house-n1, down
    // its side strip to the porch fronts, along past the hall and house-n2, up its side strip to the walkway behind, along
    // to house-n3's side strip, down it to the fronts of house-n3 and the north-east house, and round the north-east house's
    // east side
    R4(90, 100, 155, 204), R4(90, 195, 302, 204), R4(271, 100, 302, 204), R4(302, 132, 428, 178), R4(416, 132, 429, 218),
    R4(416, 198, 940, 218), R4(596, 179, 940, 218), R4(940, 198, 1118, 225), R4(1106, 132, 1118, 225), R4(1106, 132, 1178, 178),
    R4(1164, 132, 1178, 241), R4(1164, 231, 1486, 241), R4(1440, 148, 1486, 241),
    // the square to its rails (the broken corners and boards left out: the corners here, the boards as the 2D map's blocks)
    [[557, 302], [960, 302], [1041, 338], [1041, 696], [499, 696], [499, 346]],
    R4(431, 417, 499, 534), R4(1041, 412, 1101, 544),                                   // the square's side decks
    R4(666, 989, 874, 1022),                                                            // the long walk's landing
    // the planks across, and the west and east houses (0.4): along their walkways, round their fronts and sides
    R4(356, 419, 433, 433), R4(1099, 419, 1188, 433),
    [[223, 338], [258, 338], [258, 409], [362, 409], [362, 443], [258, 443], [258, 449], [40, 449], [40, 437], [223, 437]],
    [[1186, 411], [1284, 411], [1284, 304], [1321, 304], [1321, 433], [1500, 433], [1500, 443], [1186, 443]],
  ];

  // the houses (the engine builds their walls, gables, roofs, windows and chimneys). Footprints in pixels: the south
  // side is the front, where the painting shows it. Every window is dark (no light in any of them); the doors are made
  // in extra() below, so that none of them lights the deck. `red`: the roof is old red-brown tiles, laid over in extra().
  const BUILDINGS = [
    // the drowned hall: its gabled middle with the plank door, and its two wings
    { id: 'hall', name: 'the drowned hall', fp: [708, 60, 826, 176], floor: NORTH, walls: [{ t: 'timber', h: 3.4 }], roof: { ridge: 'ns', rise: 2.6, over: 0.45 },
      windows: [{ side: 's', x: 767, y: 3.75, w: 1.2, h: 1.25, dark: true }] },
    { id: 'hall-west', name: 'the hall’s west wing', fp: [598, 80, 708, 176], floor: NORTH, walls: [{ t: 'timber', h: 3.0 }], roof: { ridge: 'ew', rise: 2.0, over: 0.45 },
      windows: [{ side: 's', x: 659, y: 1.85, w: 1.35, h: 1.25, dark: true }] },
    { id: 'hall-east', name: 'the hall’s east wing', fp: [826, 80, 936, 176], floor: NORTH, walls: [{ t: 'timber', h: 3.0 }], roof: { ridge: 'ew', rise: 2.0, over: 0.45 }, red: true,
      windows: [{ side: 's', x: 881, y: 1.85, w: 1.45, h: 1.25, dark: true }] },
    // the north row: the house in the north-west corner, the two either side of the hall, the red one and the one in the corner
    { id: 'house-nw', fp: [157, 104, 268, 192], floor: NORTH, walls: [{ t: 'timber', h: 3.4 }], roof: { ridge: 'ew', rise: 1.5, over: 0.4 },
      windows: [{ side: 's', x: 212, y: 2.25, w: 1.0, h: 1.1, dark: true }, { side: 'w', y: 150, z: 1.2, w: 0.8, h: 0.9, dark: true }],
      chimneys: [{ x: 225, y: 140, w: 0.8, d: 0.8, h: 2.6 }] },
    { id: 'house-n1', fp: [432, 115, 592, 195], floor: NORTH, walls: [{ t: 'timber', h: 2.4 }], roof: { ridge: 'ew', rise: 1.6, over: 0.4 },
      windows: [{ side: 's', x: 556, y: 0.6, w: 1.3, h: 0.95, dark: true }], chimneys: [{ x: 572, y: 150, w: 0.8, d: 0.8, h: 2.6 }] },
    { id: 'house-n2', fp: [945, 115, 1102, 195], floor: NORTH, walls: [{ t: 'timber', h: 2.4 }], roof: { ridge: 'ew', rise: 1.6, over: 0.4 },
      windows: [{ side: 's', x: 982, y: 0.6, w: 1.4, h: 1.1, dark: true }], chimneys: [{ x: 1015, y: 150, w: 0.8, d: 0.8, h: 2.6 }] },
    { id: 'house-n3', fp: [1180, 160, 1300, 228], floor: NORTH, walls: [{ t: 'timber', h: 2.2 }], roof: { ridge: 'ew', rise: 1.4, over: 0.4 }, red: true,
      windows: [{ side: 's', x: 1270, y: 0.5, w: 1.1, h: 1.2, dark: true }], chimneys: [{ x: 1243, y: 190, w: 0.7, d: 0.7, h: 1.6 }, { x: 1260, y: 192, w: 0.7, d: 0.7, h: 3.0 }] },
    { id: 'house-ne', fp: [1300, 150, 1437, 222], floor: NORTH, walls: [{ t: 'timber', h: 2.6 }], roof: { ridge: 'ew', rise: 2.0, over: 0.4 },
      windows: [{ side: 's', x: 1350, y: 0.9, w: 1.0, h: 1.4, dark: true }, { side: 's', x: 1398, y: 0.9, w: 1.1, h: 1.4, dark: true }],
      chimneys: [{ x: 1324, y: 180, w: 0.8, d: 0.8, h: 2.8 }] },
    // the west house (red roof), the east house
    { id: 'house-w', fp: [45, 340, 220, 434], floor: SIDE, walls: [{ t: 'timber', h: 2.8 }], roof: { ridge: 'ew', rise: 2.4, over: 0.45 }, red: true,
      windows: [{ side: 's', x: 86, y: 1.2, w: 0.95, h: 1.1, dark: true }, { side: 'e', y: 400, z: 1.3, w: 0.8, h: 0.9, dark: true }], chimneys: [{ x: 67, y: 384, w: 0.9, d: 0.9, h: 3.2 }] },
    { id: 'house-e', fp: [1325, 345, 1495, 430], floor: SIDE, walls: [{ t: 'timber', h: 2.9 }], roof: { ridge: 'ew', rise: 2.0, over: 0.45 },
      windows: [{ side: 's', x: 1444, y: 1.0, w: 1.2, h: 1.1, dark: true }, { side: 'w', y: 395, z: 1.3, w: 0.8, h: 0.9, dark: true }], chimneys: [{ x: 1472, y: 372, w: 0.9, d: 0.9, h: 2.8 }] },
    // the south-west house: its gabled front (red) and its lean wing (red); the south-east house: its gabled front, its wing
    { id: 'house-sw', fp: [85, 650, 215, 750], floor: SIDE, walls: [{ t: 'timber', h: 2.2 }], roof: { ridge: 'ns', rise: 2.6, over: 0.45 }, red: true,
      windows: [{ side: 's', x: 152, y: 0.9, w: 1.2, h: 1.3, dark: true }, { side: 'w', y: 700, z: 1.0, w: 0.8, h: 0.9, dark: true }], chimneys: [{ x: 196, y: 680, w: 0.8, d: 0.8, h: 2.4 }] },
    { id: 'house-sw-wing', fp: [215, 662, 305, 750], floor: SIDE, walls: [{ t: 'timber', h: 2.2 }], roof: { ridge: 'ew', rise: 1.5, over: 0.4 }, red: true,
      chimneys: [{ x: 230, y: 700, w: 0.7, d: 0.7, h: 1.8 }] },
    { id: 'house-se', fp: [1322, 640, 1453, 747], floor: SIDE, walls: [{ t: 'timber', h: 2.3 }], roof: { ridge: 'ns', rise: 2.3, over: 0.45 },
      windows: [{ side: 's', x: 1385, y: 0.55, w: 1.2, h: 1.2, dark: true }, { side: 'e', y: 690, z: 1.0, w: 0.8, h: 0.9, dark: true }], chimneys: [{ x: 1340, y: 672, w: 0.8, d: 0.8, h: 2.6 }] },
    { id: 'house-se-wing', fp: [1234, 662, 1322, 747], floor: SIDE, walls: [{ t: 'timber', h: 2.2 }], roof: { ridge: 'ew', rise: 1.4, over: 0.4 } },
  ];
  // the doors (made here, not by the engine, so none lights the deck): plank doors, or black empty doorways
  const DOORS = [
    { b: 'hall', x: 767, w: 1.5, h: 2.2, plank: true }, { b: 'house-nw', x: 212, w: 1.0, h: 1.9 }, { b: 'house-n1', x: 463, w: 1.2, h: 1.9 },
    { b: 'house-n2', x: 1067, w: 1.3, h: 1.9 }, { b: 'house-w', x: 149, w: 1.0, h: 1.9, plank: true }, { b: 'house-e', x: 1386, w: 1.05, h: 1.9, plank: true },
    { b: 'house-sw-wing', x: 247, w: 1.2, h: 1.8 }, { b: 'house-se-wing', x: 1289, w: 1.0, h: 1.75 },
  ];
  // the fishing nets hung along the fronts: [building, x0, x1]
  const NETS = [['hall-west', 604, 690], ['hall-east', 848, 912], ['house-n3', 1200, 1253], ['house-nw', 160, 196]];
  // the chimneys still trailing smoke (painting pixels of the chimney, from BUILDINGS)
  const SMOKE = ['house-nw', 'house-n1', 'house-ne', 'house-w', 'house-e', 'house-se', 'house-sw'];
  // posts standing alone in the open water: [x, y, height above the water, lean (radians), with a brace]; and broken
  // pilings, two posts with a cross-piece: [x0, y0, x1, y1]
  const MOORING = [[428, 392, 2.4, 0.04, 0], [414, 832, 2.6, 0.08, 1], [584, 878, 2.2, 0.0, 0], [592, 872, 1.6, 0.12, 0], [683, 898, 1.8, -0.22, 0], [852, 898, 1.8, 0.24, 0],
    [1073, 380, 1.5, 0.1, 0], [1108, 388, 2.2, -0.06, 0], [1123, 664, 2.0, 0.05, 0], [1352, 452, 1.4, 0.2, 0], [1478, 905, 1.2, -0.3, 0], [36, 960, 1.4, 0.15, 0]];
  const PILINGS = [[206, 990, 242, 994], [1112, 828, 1146, 832], [1166, 948, 1196, 952], [1328, 958, 1366, 960], [1330, 925, 1366, 928]];
  // lily pads, in clusters: [x, y, how many, spread px]
  const LILIES = [[40, 905, 9, 34], [96, 870, 4, 18], [330, 940, 7, 30], [400, 918, 8, 34], [514, 808, 5, 20], [880, 808, 3, 12], [900, 940, 6, 26],
    [1240, 900, 6, 24], [1480, 940, 9, 40], [1500, 640, 6, 30], [1510, 420, 5, 24], [1500, 30, 6, 30], [40, 120, 6, 30], [20, 500, 4, 20],
    [330, 300, 4, 18], [1210, 345, 4, 20], [1200, 520, 4, 18], [380, 560, 3, 14], [560, 760, 3, 14], [1040, 760, 3, 14], [280, 860, 4, 20]];
  // drifts of green mist over the water (glows): [x, y, size m]
  const MIST = [[350, 280, 9], [300, 880, 11], [420, 980, 9], [150, 520, 7], [1170, 260, 9], [1240, 760, 10], [1100, 950, 9], [600, 820, 8],
    [960, 800, 8], [1440, 520, 8], [60, 1000, 8], [1490, 60, 7], [40, 160, 7], [1500, 820, 8], [880, 250, 6], [620, 255, 6], [1100, 560, 6], [430, 620, 6],
    [-120, 420, 12], [1660, 520, 12], [760, -120, 12], [760, 1140, 12], [-100, 980, 12], [1640, 60, 12]];

  P['bogmire-heart'] = {
    id: 'bogmire-heart', name: 'The fen’s dark heart', painting: "art/walk/walk-bogmire-heart.avif", size: [1536, 1024],
    mapId: 'bogmire-heart', paintingPng: 'reference/art/walk/walk-bogmire-heart.png',
    // the wall check (tools/walls-test.mjs): from the long walk's foot, to the hall's door, the square's corners and
    // side decks, the two pockets on the hall's porch, and back out to Bogmire
    checks: { from: [768, 980], goals: [
      ['the drowned hall’s door (north)', 768, 186], ['the porch west, to the dark door (pocket)', 466, 211], ['the porch east, under the nets (pocket)', 924, 206],
      ['the west side deck', 448, 470], ['the east side deck', 1088, 466], ['the square’s north-west corner', 560, 330], ['the square’s north-east corner', 944, 330],
      ['the south-west lantern', 562, 654], ['the south-east lantern', 984, 654], ['Bogmire (the long walk, south edge)', 768, 1018],
      // the boards opened on November 16 (anywhere that looks walkable is walkable): each one's far end
      ['the north-west house’s door (along the walkway behind)', 212, 200], ['the north-west house’s deck, west end', 100, 110],
      ['the walkway behind the north row (west)', 360, 155], ['the walkway behind the north row (east)', 1140, 155],
      ['the north-east house’s porch', 1360, 236], ['round the north-east house’s east side', 1464, 160],
      ['the west house’s door (over the plank)', 149, 443], ['the west house’s deck, north end', 232, 352],
      ['the east house’s door (over the plank)', 1386, 438], ['the east house’s deck, north end', 1310, 312], ['the east house’s front, east end', 1468, 438],
      ['the west side deck’s south end', 465, 528], ['the east side deck’s south end', 1072, 538], ['the square by its south rail', 768, 692],
      ['the long walk’s landing, west', 676, 1005], ['the long walk’s landing, east', 864, 1005]] },
    // trees only past the painting, on the banks round the open water: dead and thorny, a few firs (no tree on the painting)
    treeGen: { dark: 2, step: 44, out: { density: 0.7, kinds: [0.1, 0.5, 0.4], size: [0.95, 1.45] }, roads: [[700, 1100, 835, 1500]] },
    // the ground's textures (only the banks past the water show), and how many metres each repeats over
    ground: { cob: 'heart_deck_mossy', grass: 'bogmire_bank_grass', dirt: 'thorn_moss_ground', pave: 'shared_boardwalk_planks', rep: [4.8, 4.0, 4.0, 6.0], grassTint: [0.42, 0.5, 0.5] },
    // which texture each kind of surface uses: the dark board walls, the mossy shingles, the boardwalk planks (decks),
    // the square's mossy deck, old wet posts (the walls' upright boards), the red tiles (laid over the red roofs, in
    // extra(), as 'cloth'), the banks' rocks, dead bark
    surfaces: { timber: 'shared_planks_wall', planks: 'shared_boardwalk_planks', roof: 'shared_roof_shingle', wood: 'shared_planks_wall', deck: 'heart_deck_mossy',
      cloth: 'heart_roof_red', stone: 'shared_stone_wall_rough', rock: 'thorn_rock_mossy', leaves: 'wilds_oak_leaves', firs: 'wilds_fir_boughs', bark: 'eldergrove_dead_bark' },
    tints: { wood: 0xa8a0a4, leaves: 0x7a9488, firs: 0x6a8484, bush: 0xa8c8b0 },
    // cold blue night with a green mist on the water; no far hills (the fen's dead woods close it in)
    night: { sky: [0.42, 0.46, 0.55], ground: [0.06, 0.07, 0.08], moon: [0.2, 0.23, 0.32], fog: [0.026, 0.048, 0.054], fogNear: 12, fogFar: 78, hills: false, glowK: 1.8 },
    textures: [
      { id: 'heart_deck_mossy', made: "./../texture-packs/made/heart_deck_mossy.png", stand: "./../texture-packs/bogmire-dawnroost/bogmire-heart/stand-in/heart_deck_mossy.png" },
      { id: 'heart_roof_red', made: "./../texture-packs/made/heart_roof_red.png", stand: "./../texture-packs/bogmire-dawnroost/bogmire-heart/stand-in/heart_roof_red.png" },
      { id: 'heart_water_open', made: "./../texture-packs/made/heart_water_open.png", stand: "./../texture-packs/bogmire-dawnroost/bogmire-heart/stand-in/heart_water_open.png" },
      { id: 'shared_boardwalk_planks', made: "./../texture-packs/made/shared_boardwalk_planks.png", stand: "./../texture-packs/bogmire-dawnroost/bogmire/stand-in/shared_boardwalk_planks.png" },
      { id: 'shared_planks_wall', made: "./../texture-packs/made/shared_planks_wall.png", stand: "./../texture-packs/bogmire-dawnroost/bogmire/stand-in/shared_planks_wall.png" },
      { id: 'shared_roof_shingle', made: "./../texture-packs/made/shared_roof_shingle.png", stand: "./../texture-packs/bogmire-dawnroost/bogmire/stand-in/shared_roof_shingle.png" },
      { id: 'bogmire_bank_grass', made: "./../texture-packs/made/bogmire_bank_grass.png", stand: "./../texture-packs/arenas/bogmire/stand-in/bogmire_bank_grass.png" },
      { id: 'thorn_moss_ground', made: "./../texture-packs/made/thorn_moss_ground.png", stand: "./../texture-packs/wickhollow/thornwood/stand-in/thorn_moss_ground.png" },
      { id: 'shared_stone_wall_rough', made: "./../texture-packs/made/shared_stone_wall_rough.png", stand: "./../texture-packs/wickhollow/wickhollow/stand-in/shared_stone_wall_rough.png" },
      { id: 'thorn_rock_mossy', made: "./../texture-packs/made/thorn_rock_mossy.png", stand: "./../texture-packs/wickhollow/thornwood/stand-in/thorn_rock_mossy.png" },
      { id: 'wilds_oak_leaves', made: "./../texture-packs/made/wilds_oak_leaves.png", stand: "./../texture-packs/wilds-south/dawnroost-road/stand-in/wilds_oak_leaves.png" },
      { id: 'wilds_fir_boughs', made: "./../texture-packs/made/wilds_fir_boughs.png", stand: "./../texture-packs/wilds-south/dawnroost-road/stand-in/wilds_fir_boughs.png" },
      { id: 'eldergrove_dead_bark', made: "./../texture-packs/made/eldergrove_dead_bark.png", stand: "./../texture-packs/wilds-south/eldergrove-edge/stand-in/eldergrove_dead_bark.png" },
    ],
    ground_h: ground,
    walk_h: walkH,
    water: [{ poly: FEN, level: () => WATER_Y, tex: 'heart_water_open', rep: 4.2, flow: [0.003, 0.0015], bed: BED }],
    lawns: [],
    start: [768, 980], startFace: Math.PI,
    // the way out (the walking map's exit)
    exits: [{ rect: [727, 1006, 810, 1024], label: 'Bogmire' }],
    buildings: BUILDINGS,
    walls: [],
    lamps: [],
    // pockets past the 2D walk, on the drowned hall's porch: slip past the barrels by the door, west under the nets to a
    // dark doorway, or east under the other nets to the hall's far corner
    walkAdd: [
      { poly: [[741, 206], [741, 218], [456, 218], [456, 200], [596, 200], [600, 181], [688, 181], [688, 206]], ground: 'cob' },
      { poly: [[795, 206], [813, 206], [826, 196], [836, 181], [932, 181], [932, 218], [795, 218]], ground: 'cob' },
    ].concat(MORE.map((poly) => ({ poly, ground: 'cob' }))),
    // the Fen-Heart Lamp: in the 2D game at the top of the hall's steps, where the great wraith sat; in 3D a few steps
    // on, still at the top of the square, at the end of the east pocket under the nets
    items: { 'fen-heart-lamp': [918, 204] },
    // barrels and crates on the porches (the hall door's barrels are the walking map's own blocks). Those on the porches
    // Io can walk now stand in the decks' corners, out of the way along them (November 16)
    props: [
      { k: 'barrel', at: [700, 192] }, { k: 'barrel', at: [732, 194] }, { k: 'barrel', at: [804, 193] },
      { k: 'barrel', at: [296, 201] }, { k: 'barrel', at: [52, 443] }, { k: 'barrel', at: [250, 347] }, { k: 'barrel', at: [1290, 316] },
      { k: 'barrel', at: [1230, 758] }, { k: 'barrel', at: [1462, 758] }, { k: 'barrel', at: [1218, 640] },
      { k: 'crates', at: [285, 762] }, { k: 'crates', at: [1478, 234] }, { k: 'crates', at: [1488, 439] },
    ],
    flowers: [],
    // the only warm light: the two lanterns at the square's near corners (their posts are built in extra())
    lights: [[540, 682, 140, 1.15, 'warm'], [995, 684, 140, 1.15, 'warm']],
    trees: 'bogmire-heart',
    extraTrees: [],

    // ---- everything the engine has no field for: the decks and their stilts, the square's broken boards, the rails,
    // the hall's steps, the doors, the red roofs, the nets, ladders, the two lantern posts, posts and pilings in the
    // water, lily pads, weed, chimney smoke and the drifts of mist ----
    extra(K) {
      const { B, X, Z, R, TAU } = K;
      const BOX = new THREE.BoxGeometry(1, 1, 1).toNonIndexed(), UP = new THREE.Vector3(0, 1, 0), XV = new THREE.Vector3(1, 0, 0);
      const POST = [0.62, 0.58, 0.62], ROPE = [1.5, 1.28, 0.95], MOSS = [0.42, 0.62, 0.46];
      // a thin beam from p to q (metres), t thick: rails, ropes, braces, net lines
      const beam = (k, p, q, t, col, t2) => {
        const a = new THREE.Vector3(...p), b = new THREE.Vector3(...q), d = b.clone().sub(a), L = d.length();
        const m = new THREE.Matrix4().compose(a.clone().add(b).multiplyScalar(0.5), new THREE.Quaternion().setFromUnitVectors(XV, d.normalize()), new THREE.Vector3(L, t, t2 || t));
        B.geom(k, BOX, m, col, [L, t]);
      };
      // a rope hung from p to q, sagging in the middle
      const rope = (p, q, sag, t) => { const n = 4; let prev = p; for (let i = 1; i <= n; i++) { const f = i / n, c = [p[0] + (q[0] - p[0]) * f, p[1] + (q[1] - p[1]) * f - sag * 4 * f * (1 - f), p[2] + (q[2] - p[2]) * f]; beam('wood', prev, c, t || 0.035, ROPE); prev = c; } };
      // a post from the fen's bed up to `top`, with rope bands
      const post = (x, z, top, r, bands, col, lean, under) => {
        r = r || 0.15; const h = top - BED;
        if (lean) { const m = new THREE.Matrix4().compose(new THREE.Vector3(x + Math.sin(lean[1]) * Math.sin(lean[0]) * h / 2, BED + h / 2 * Math.cos(lean[0]), z + Math.cos(lean[1]) * Math.sin(lean[0]) * h / 2),
          new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.cos(lean[1]) * lean[0], 0, -Math.sin(lean[1]) * lean[0])), new THREE.Vector3(1, 1, 1));
          const g = new THREE.CylinderGeometry(r * 0.85, r, h, 7, 1, true); B.geom('wood', g, m, col || POST, [TAU * r, h]); g.dispose(); return; }
        B.cyl('wood', x, BED, z, r, r * 0.88, h, 7, col || POST, null, true);
        if (!under) B.cyl('wood', x, top - 0.001, z, r * 0.88, r * 0.7, 0.06, 7, col || POST);
        for (const by of bands || []) B.cyl('wood', x, by, z, r + 0.025, r + 0.02, 0.13, 7, ROPE, [0.5, 0.13], true);
      };
      // ---- a slab of deck: top, and the four sides, its planks laid east to west (or north to south) ----
      const slab = (k, x0, z0, x1, z1, top, th, s, ns, col) => {
        const y0 = top - th;
        if (ns) B.quad(k, [x1, top, z1], [x1, top, z0], [x0, top, z0], [x0, top, z1], [z1 * s, x1 * s, z0 * s, x0 * s], col);
        else B.quad(k, [x0, top, z1], [x1, top, z1], [x1, top, z0], [x0, top, z0], [x0 * s, z1 * s, x1 * s, z0 * s], col);
        const sc = col ? col.map((v) => v * 0.7) : [0.7, 0.7, 0.7];
        B.quad(k, [x0, y0, z1], [x1, y0, z1], [x1, top, z1], [x0, top, z1], [x0 * s, y0 * s, x1 * s, top * s], sc);
        B.quad(k, [x1, y0, z0], [x0, y0, z0], [x0, top, z0], [x1, top, z0], [x1 * s, y0 * s, x0 * s, top * s], sc);
        B.quad(k, [x1, y0, z1], [x1, y0, z0], [x1, top, z0], [x1, top, z1], [z1 * s, y0 * s, z0 * s, top * s], sc);
        B.quad(k, [x0, y0, z0], [x0, y0, z1], [x0, top, z1], [x0, top, z0], [z0 * s, y0 * s, z1 * s, top * s], sc);
      };
      const PL = 2.0 / 6.0, DK = 2.2 / 4.8;   // the boardwalk's planks repeat every 6 m, the square's every 4.8 m
      // the stilts under a deck: a post at each corner and every few metres round its edge, braces between some, and a
      // few under the middle
      const stilts = (r, top, opts) => {
        opts = opts || {};
        const [px0, py0, px1, py1] = r, x0 = X(px0) + 0.2, x1 = X(px1) - 0.2, z0 = Z(py0) + 0.2, z1 = Z(py1) - 0.2, ut = top - 0.22;
        const nx = Math.max(1, Math.round((x1 - x0) / 2.6)), nz = Math.max(1, Math.round((z1 - z0) / 2.6));
        const south = [];
        for (let i = 0; i <= nx; i++) { const x = x0 + (x1 - x0) * i / nx; post(x, z1, ut, 0.16, R() < 0.6 ? [WATER_Y + 0.5 + R() * 0.6] : null, null, null, true); south.push(x); post(x, z0, ut, 0.15, null, null, null, true); }
        for (let j = 1; j < nz; j++) { const z = z0 + (z1 - z0) * j / nz; post(x0, z, ut, 0.15, null, null, null, true); post(x1, z, ut, 0.15, null, null, null, true); }
        if (opts.middle) for (let i = 1; i < nx; i += 2) for (let j = 1; j < nz; j += 2) post(x0 + (x1 - x0) * i / nx, z0 + (z1 - z0) * j / nz, ut, 0.14, null, null, null, true);
        // cross braces on the south face, between every other pair of posts
        for (let i = 0; i < south.length - 1; i += 2) { const a = south[i], b = south[i + 1], hi = ut - 0.15, lo = WATER_Y + 0.15;
          beam('wood', [a, hi, z1 + 0.18], [b, lo, z1 + 0.18], 0.1, POST); beam('wood', [a, lo, z1 + 0.2], [b, hi, z1 + 0.2], 0.1, POST); }
        // a beam under the deck's front edge
        beam('wood', [x0 - 0.2, ut - 0.12, z1 + 0.2], [x1 + 0.2, ut - 0.12, z1 + 0.2], 0.2, POST, 0.16);
        return south;
      };
      for (const d of DECKS) { const [px0, py0, px1, py1] = d.r; slab('planks', X(px0), Z(py0), X(px1), Z(py1), d.y, 0.24, PL, !!d.ns, [0.5, 0.5, 0.56]); }
      for (const d of DECKS.slice(0, 15)) stilts(d.r, d.y);
      stilts([425, 413, 497, 538], 0); stilts([1043, 408, 1107, 548], 0); stilts([660, 985, 880, 1030], 0);
      { // the long walk's stilts: in pairs every few metres, a brace across between each pair
        for (let py = 712; py <= 1255; py += 52) { const z = Z(py), xa = X(722) + 0.18, xb = X(813) - 0.18; post(xa, z, -0.22, 0.15, [WATER_Y + 0.6], null, null, true); post(xb, z, -0.22, 0.15, [WATER_Y + 0.6], null, null, true);
          beam('wood', [xa, -0.4, z], [xb, WATER_Y + 0.2, z], 0.09, POST); beam('wood', [xa, -0.35, z], [xb, -0.35, z], 0.16, POST, 0.12); }
      }

      // ---- the square: plank rows, half a metre each, broken where the painting's boards are gone ----
      const RW = 5, rows = Math.round((SQUARE[3] - SQUARE[1]) / RW);
      const cutNW = (y) => y < 342 ? 548 - (y - 308) * (45 / 34) - 6 : SQUARE[0];          // the broken north-west corner
      const cutNE = (y) => y < 350 ? 944 + (y - 300) * (95 / 42) + 16 : SQUARE[2];        // the broken north-east corner
      for (let i = 0; i < rows; i++) {
        const ya = SQUARE[1] + i * RW, yb = ya + RW, ym = ya + RW / 2;
        let segs = [[Math.max(SQUARE[0], Math.min(cutNW(ym), 560)), Math.min(SQUARE[2], Math.max(cutNE(ym), 930))]];
        for (const h of HOLES) { if (Math.min(yb, h[3]) - Math.max(ya, h[1]) < RW / 2) continue; const out = []; for (const [a, b] of segs) { if (h[2] <= a || h[0] >= b) { out.push([a, b]); continue; } if (h[0] > a + 4) out.push([a, h[0]]); if (h[2] < b - 4) out.push([h[2], b]); } segs = out; }
        const k = 0.64 + R() * 0.08, jitter = (R() - 0.5) * 0.012;
        for (const [a, b] of segs) slab('deck', X(a), Z(ya), X(b), Z(yb), jitter, 0.22, DK, false, [k, k, k * 1.03]);
      }
      // dark under each gap: the deck's shadow, so the lanterns' light doesn't show on the water through the broken boards
      for (const [a, b, c, d] of HOLES) { const x0 = X(Math.max(SQUARE[0] + 2, a - 8)), x1 = X(Math.min(SQUARE[2] - 2, c + 8)), z0 = Z(b - 8), z1 = Z(d + 8);
        B.quad('iron', [x0, -0.34, z1], [x1, -0.34, z1], [x1, -0.34, z0], [x0, -0.34, z0], [0, 0, 1, 1], [0.45, 0.45, 0.5]); }
      // the square's stilts: round its edge, and a few under the middle
      stilts(SQUARE, 0, { middle: true });
      // loose boards in the broken places: half sunk, tipped, or lying across a gap
      const loose = (px, py, len, yaw, pitch, roll, y) => { const m = new THREE.Matrix4().compose(new THREE.Vector3(X(px), y, Z(py)), new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch, yaw, roll, 'YXZ')), new THREE.Vector3(len, 0.06, 0.42));
        B.geom('deck', BOX, m, [0.62, 0.62, 0.66], [len * DK, 0.2]); };
      loose(990, 318, 2.6, 0.55, 0.0, 0.32, -0.45); loose(1018, 336, 1.8, -0.3, 0.0, -0.5, -0.9); loose(975, 305, 1.5, 0.1, 0.0, 0.15, -0.15);
      loose(520, 318, 2.0, -0.7, 0.0, 0.3, -0.4); loose(512, 620, 2.2, 1.1, 0.0, 0.42, -0.5); loose(520, 368, 1.4, 0.15, 0.0, -0.25, -0.35);
      loose(1025, 415, 1.6, 0.0, 0.0, 0.4, -0.5); loose(1020, 505, 1.3, 0.2, 0.0, -0.3, -0.45); loose(628, 660, 1.1, 0.1, 0.0, 0.5, -0.4); loose(900, 660, 1.6, -0.1, 0.0, -0.3, -0.35);
      loose(470, 650, 3.2, 0.95, 0.0, 0.5, -1.0); loose(1128, 456, 2.4, -0.55, 0.0, 0.45, -0.6);    // the leaning broken rail planks off the west and east decks

      // ---- the rails: short posts with two ropes between them; a few leaning or snapped. opt.dry: build nothing, only draw
      // the same random numbers (a rail changed on November 16 is built anew at the end, with its own: so every random
      // thing after it, here and in the engine, comes out as it did); opt.rand: the random numbers to use ----
      const rail = (pts, top, opt) => {
        opt = opt || {};
        const rr = opt.rand || R, dry = !!opt.dry;
        let prev = null;
        for (let k = 1; k < pts.length; k++) {
          const [ax, ay] = pts[k - 1], [bx, by] = pts[k], A = [X(ax), Z(ay)], Bp = [X(bx), Z(by)], L = Math.hypot(Bp[0] - A[0], Bp[1] - A[1]), n = Math.max(1, Math.round(L / 2.3));
          for (let i = k > 1 ? 1 : 0; i <= n; i++) {
            const x = A[0] + (Bp[0] - A[0]) * i / n, z = A[1] + (Bp[1] - A[1]) * i / n, snapped = rr() < (opt.broken || 0.08), hh = snapped ? 0.35 + rr() * 0.25 : 0.95 + rr() * 0.12;
            if (!dry) { B.cyl('wood', x, top - 0.25, z, 0.09, 0.08, hh + 0.25, 6, POST); B.cyl('wood', x, top + hh - 0.02, z, 0.08, 0.05, 0.05, 6, POST); }
            if (rr() < 0.6 && !dry) B.cyl('wood', x, top + hh * 0.55, z, 0.105, 0.1, 0.1, 6, ROPE, [0.4, 0.1], true);
            const here = { x, z, ok: !snapped };
            if (prev && prev.ok && here.ok && !(opt.gap && opt.gap(prev, here))) { const s1 = 0.12 + rr() * 0.08, s2 = 0.08 + rr() * 0.05; if (!dry) { rope([prev.x, top + 0.85, prev.z], [x, top + 0.85, z], s1); rope([prev.x, top + 0.45, prev.z], [x, top + 0.45, z], s2); } }
            else if (prev && (prev.ok || here.ok) && rr() < 0.7 && !dry) { const p0 = prev.ok ? prev : here, p1 = prev.ok ? here : prev; rope([p0.x, top + 0.85, p0.z], [p0.x + (p1.x - p0.x) * 0.5, top + 0.1, p0.z + (p1.z - p0.z) * 0.5], 0.05); }
            prev = here;
          }
        }
      };
      const DRY = { dry: true };
      rail([[496, 299], [496, 413]], 0); rail([[496, 538], [496, 699]], 0); rail([[1044, 352], [1044, 408]], 0); rail([[1044, 548], [1044, 699]], 0);
      rail([[540, 299], [727, 299]], 0); rail([[809, 299], [962, 299]], 0, { broken: 0.2 });
      rail([[540, 699], [720, 699]], 0); rail([[815, 699], [995, 699]], 0);
      // (the side decks' rails, opened since for the planks across: built anew at the end)
      rail([[496, 413], [428, 413], [428, 538], [496, 538]], 0, DRY); rail([[1044, 408], [1104, 408], [1104, 548], [1044, 548]], 0, { broken: 0.15, dry: true });
      rail([[722, 712], [722, 985]], 0); rail([[813, 712], [813, 985]], 0); rail([[722, 1030], [722, 1250]], 0); rail([[813, 1030], [813, 1250]], 0);
      rail([[662, 987], [662, 1028]], 0); rail([[878, 987], [878, 1028]], 0);
      // the porches' front rails (with gaps where the pockets meet the hall's steps). The walkways' south rails, and the front
      // rails where the side strips come down to them, changed on November 16, are built anew at the end
      rail([[300, 182], [432, 182]], NORTH, DRY); rail([[300, 128], [432, 128]], NORTH, { broken: 0.25 }); rail([[1104, 182], [1182, 182]], NORTH, DRY); rail([[1104, 128], [1182, 128]], NORTH);
      rail([[426, 221], [594, 221]], NORTH, DRY); rail([[596, 221], [722, 221]], NORTH); rail([[814, 221], [940, 221]], NORTH); rail([[940, 229], [1108, 229]], NORTH, DRY);
      rail([[88, 208], [304, 208]], NORTH); rail([[1176, 245], [1488, 245]], NORTH, { broken: 0.2, dry: true });
      rail([[38, 453], [260, 453]], SIDE); rail([[258, 447], [360, 447]], SIDE); rail([[258, 405], [360, 405]], SIDE); rail([[1282, 447], [1504, 447]], SIDE); rail([[1184, 447], [1284, 447]], SIDE); rail([[1184, 407], [1284, 407]], SIDE);
      rail([[44, 794], [178, 794]], SIDE); rail([[212, 794], [340, 794]], SIDE); rail([[1187, 774], [1322, 774]], SIDE); rail([[1360, 774], [1478, 774]], SIDE);
      rail([[44, 642], [44, 794]], SIDE); rail([[1478, 598], [1478, 774]], SIDE); rail([[1187, 598], [1187, 774]], SIDE, { broken: 0.2 });

      // the thick posts at the square's corners and where the long walk meets it, rope-bound
      for (const [px, py, hh] of [[493, 297, 1.5], [1047, 297, 1.6], [493, 702, 1.3], [1047, 702, 1.5], [695, 702, 1.4], [840, 702, 1.4], [712, 800, 1.2], [822, 800, 1.2],
        [700, 952, 1.0], [826, 952, 1.0], [668, 1000, 1.1], [872, 1000, 1.1], [727, 297, 1.1], [809, 297, 1.1], [716, 227, 2.2], [822, 227, 2.2]]) {
        const y0 = py < 230 ? NORTH : 0, top = y0 + hh, x = X(px), z = Z(py);
        post(x, z, top, 0.21, [y0 + 0.3, y0 + hh * 0.7, WATER_Y + 0.6], [0.66, 0.6, 0.64]);
        B.cyl('wood', x, top, z, 0.19, 0.16, 0.08, 7, [0.75, 0.7, 0.72]);
      }

      // ---- the hall's steps: six plank treads on two stringers, down from its porch to the square ----
      {
        const xa = X(STEPS.x0), xb = X(STEPS.x1), dy = (STEPS.y1 - STEPS.y0) / STEPS.n;
        for (let k = 0; k < STEPS.n; k++) { const ya = STEPS.y0 + k * dy, yb = ya + dy, h = stepH(ya + dy / 2); slab('planks', xa, Z(ya), xb, Z(yb), h, h + 0.3, PL, false, [0.5, 0.5, 0.56]); }
        for (const x of [xa - 0.08, xb + 0.08]) beam('wood', [x, NORTH - 0.1, Z(STEPS.y0)], [x, -0.12, Z(STEPS.y1)], 0.14, POST, 0.3);
        rail([[727, 236], [727, 296]], 0); rail([[809, 236], [809, 296]], 0);
      }

      // ---- the doors: plank doors and black empty doorways ----
      const BY = {}; for (const b of BUILDINGS) BY[b.id] = b;
      for (const d of DOORS) {
        const b = BY[d.b], z = Z(b.fp[3]) + 0.03, x = X(d.x), y = b.floor;
        B.box('wood', x, y - 0.02, z - 0.07, d.w + 0.26, d.h + 0.16, 0.1, 0, [0.42, 0.36, 0.36]);
        if (d.plank) B.quad('door', [x - d.w / 2, y, z + 0.01], [x + d.w / 2, y, z + 0.01], [x + d.w / 2, y + d.h, z + 0.01], [x - d.w / 2, y + d.h, z + 0.01], [0, 0, 1, 1], [0.5, 0.46, 0.5]);
        else B.quad('iron', [x - d.w / 2, y, z + 0.01], [x + d.w / 2, y, z + 0.01], [x + d.w / 2, y + d.h, z + 0.01], [x - d.w / 2, y + d.h, z + 0.01], [0, 0, 1, 1], [0.3, 0.3, 0.36]);
      }
      // the hall's porch under its gable: two posts and a beam across, a bracket each side
      { const b = BY.hall, z = Z(b.fp[3]) + 0.35, y = NORTH;
        for (const px of [713, 821]) { B.box('wood', X(px), y, z, 0.26, 3.1, 0.26, 0, [0.62, 0.56, 0.58]); beam('wood', [X(px), y + 2.6, z], [X(px) + (px < 767 ? 0.7 : -0.7), y + 3.1, z], 0.12, POST); }
        B.box('wood', X(767), y + 3.05, z, X(826) - X(708) + 0.3, 0.24, 0.3, 0, [0.6, 0.54, 0.56]); }

      // ---- the red roofs: old red-brown tiles laid over the engine's roof on the houses that have them ----
      for (const b of BUILDINGS) {
        if (!b.red) continue;
        const [px0, py0, px1, py1] = b.fp, x0 = X(px0), x1 = X(px1), z0 = Z(py0), z1 = Z(py1), cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, w = x1 - x0, d = z1 - z0;
        const E = b.floor + b.walls.reduce((a, s) => a + s.h, 0), rise = b.roof.rise, o = b.roof.over + 0.04, up = 0.07, T = 1 / 2.6;
        if (b.roof.ridge === 'ns') {
          const s = rise / (w / 2), ye = E - o * s + up, yr = E + rise + up, L = d + 2 * o, sl = Math.hypot(w / 2 + o, rise + o * s);
          B.quad('cloth', [x0 - o, ye, z0 - o], [x0 - o, ye, z1 + o], [cx, yr, z1 + o], [cx, yr, z0 - o], [0, 0, L * T, sl * T]);
          B.quad('cloth', [x1 + o, ye, z1 + o], [x1 + o, ye, z0 - o], [cx, yr, z0 - o], [cx, yr, z1 + o], [0, 0, L * T, sl * T]);
        } else {
          const s = rise / (d / 2), ye = E - o * s + up, yr = E + rise + up, L = w + 2 * o, sl = Math.hypot(d / 2 + o, rise + o * s);
          B.quad('cloth', [x1 + o, ye, z0 - o], [x0 - o, ye, z0 - o], [x0 - o, yr, cz], [x1 + o, yr, cz], [0, 0, L * T, sl * T]);
          B.quad('cloth', [x0 - o, ye, z1 + o], [x1 + o, ye, z1 + o], [x1 + o, yr, cz], [x0 - o, yr, cz], [0, 0, L * T, sl * T]);
        }
      }

      // ---- the fishing nets: hung in a sagging loop from two pegs, with corks along the bottom ----
      for (const [id, pa, pb] of NETS) {
        const b = BY[id], z = Z(b.fp[3]) + 0.07, xa = X(pa), xb = X(pb), y = b.floor, top = y + 2.3, low = y + 0.75, W = xb - xa;
        const at = (f) => [xa + W * f, top - (top - low) * 4 * f * (1 - f) * 1.0, z];
        B.box('wood', xa, top - 0.05, z - 0.04, 0.08, 0.12, 0.12, 0, POST); B.box('wood', xb, top - 0.05, z - 0.04, 0.08, 0.12, 0.12, 0, POST);
        beam('wood', [xa, top, z], [xb, top, z], 0.03, ROPE);
        const N = Math.max(6, Math.round(W / 0.35));
        for (let i = 0; i < N; i++) { const p = at(i / N), q = at((i + 1) / N); beam('wood', p, q, 0.035, ROPE); if (i % 2 === 0) B.box('wood', q[0], q[1] - 0.06, z + 0.02, 0.1, 0.1, 0.06, 0, [1.3, 1.0, 0.7]); }
        for (let i = 1; i < N; i++) { const f = i / N, p = at(f); beam('wood', [xa + W * Math.max(0, f - 0.18), top, z], p, 0.02, ROPE); beam('wood', [xa + W * Math.min(1, f + 0.18), top, z], p, 0.02, ROPE); }
      }

      // ---- ladders on the house decks, and the steps down to the water from the two south houses ----
      const ladder = (px, py, y, h, lean, face) => { const z = Z(py), x = X(px), dz = Math.sin(lean) * h, c = Math.cos(face), s = Math.sin(face);
        for (const side of [-0.22, 0.22]) beam('wood', [x + side * c, y, z + side * s], [x + side * c + dz * s * 0, y + h, z + side * s - dz], 0.06, POST);
        for (let r = 0.3; r < h; r += 0.32) { const f = r / h; beam('wood', [x - 0.22 * c, y + r, z - 0.22 * s - dz * f], [x + 0.22 * c, y + r, z + 0.22 * s - dz * f], 0.04, POST); } };
      ladder(292, 182, NORTH, 2.4, 0.25, 0); ladder(1460, 188, NORTH, 2.6, 0.22, 0); ladder(1196, 690, SIDE, 2.0, 0.2, 0);
      for (const [px0, px1, py0] of [[181, 211, 796], [1326, 1356, 776]]) for (let k = 0; k < 4; k++) { const y = SIDE - 0.4 * (k + 1), py = py0 + k * 7; slab('planks', X(px0), Z(py), X(px1), Z(py + 8), y, 0.08, PL, false, [0.55, 0.55, 0.62]); }

      // ---- the two lanterns still burning, on thick rope-bound posts at the square's near corners ----
      for (const [px, py] of [[540, 688], [995, 690]]) {
        const x = X(px), z = Z(py), top = 2.75;
        post(x, z, top, 0.22, [0.25, 0.65, 1.6, WATER_Y + 0.6], [0.7, 0.62, 0.64]);
        B.cyl('wood', x, top, z, 0.24, 0.2, 0.1, 7, [0.6, 0.55, 0.58]);
        K.lantern(x, top + 0.14, z, null, 1.15);
      }

      // ---- posts standing alone in the water, and broken pilings with their cross-pieces ----
      for (const [px, py, hh, lean, brace] of MOORING) {
        const x = X(px), z = Z(py), top = WATER_Y + hh;
        post(x, z, top, 0.17, null, POST, lean ? [lean, R() * TAU] : null);
        if (!lean) { B.cyl('wood', x, top - 0.6, z, 0.2, 0.2, 0.14, 7, ROPE, [0.5, 0.14], true); B.cyl('wood', x, top - 1.1, z, 0.2, 0.2, 0.12, 7, ROPE, [0.5, 0.12], true); }
        if (brace) beam('wood', [x + 0.15, top - 0.5, z], [x + 1.3, WATER_Y - 0.2, z + 0.2], 0.12, POST);
      }
      for (const [ax, ay, bx, by] of PILINGS) {
        const a = [X(ax), Z(ay)], b = [X(bx), Z(by)], ha = WATER_Y + 1.6 + R() * 0.5, hb = WATER_Y + 1.1 + R() * 0.6;
        post(a[0], a[1], ha, 0.16, [WATER_Y + 0.9]); post(b[0], b[1], hb, 0.15);
        beam('wood', [a[0], ha - 0.5, a[1]], [b[0], hb - 0.25, b[1]], 0.12, POST);
        rope([a[0], ha - 0.2, a[1]], [b[0], hb - 0.1, b[1]], 0.25);
      }

      // ---- lily pads on the water ----
      const pad = new THREE.CircleGeometry(1, 9, 0.35, TAU - 0.5); pad.rotateX(-Math.PI / 2);
      for (const [cx, cy, n, sp] of LILIES) for (let i = 0; i < n; i++) {
        const px = cx + (R() - 0.5) * 2 * sp, py = cy + (R() - 0.5) * 2 * sp * 0.8, s = 0.28 + R() * 0.3, g = 0.8 + R() * 0.4;
        B.geom('leafBush', pad, new THREE.Matrix4().compose(new THREE.Vector3(X(px), WATER_Y + 0.03, Z(py)), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, R() * TAU, 0)), new THREE.Vector3(s, 1, s)), [0.42 * g, 0.66 * g, 0.48 * g], 0.6);
      }
      pad.dispose();

      // ---- green weed and slime hanging from the deck edges and the posts ----
      const weed = (x, z, y, len) => { for (let i = 0; i < 3; i++) { const dx = (R() - 0.5) * 0.5, L = len * (0.5 + R() * 0.6); B.box('leafBush', x + dx, y - L, z + (R() - 0.5) * 0.08, 0.05 + R() * 0.05, L, 0.04, R() * 3, [MOSS[0] * 0.8, MOSS[1] * 0.8, MOSS[2] * 0.8]); } };
      for (const d of DECKS.concat([{ r: SQUARE, y: 0 }])) {
        const [px0, py0, px1, py1] = d.r, z = Z(py1) + 0.02, n = Math.round((px1 - px0) / 45);
        for (let i = 0; i < n; i++) if (R() < 0.55) weed(X(px0 + (px1 - px0) * (i + R()) / n), z, d.y - 0.22, 0.5 + R() * 0.9);
        for (const px of [px0, px1]) for (let py = py0 + 20; py < py1; py += 50) if (R() < 0.45) weed(X(px) + (px === px0 ? -0.02 : 0.02), Z(py), d.y - 0.22, 0.5 + R() * 0.8);
      }
      // ---- a thin trail of smoke from the chimneys that still have it ----
      for (const id of SMOKE) {
        const b = BY[id], c = b.chimneys[0], x = X(c.x), z = Z(c.y), E = b.floor + b.walls.reduce((a, s) => a + s.h, 0), rise = b.roof.rise;
        const [px0, py0, px1, py1] = b.fp, cx = (X(px0) + X(px1)) / 2, cz = (Z(py0) + Z(py1)) / 2;
        const ry = b.roof.ridge === 'ns' ? E + rise * (1 - Math.abs(x - cx) / ((X(px1) - X(px0)) / 2)) : E + rise * (1 - Math.abs(z - cz) / ((Z(py1) - Z(py0)) / 2));
        const top = ry + 0.7 + c.h * 0.35 + 0.15;
        for (let i = 0; i < 6; i++) K.halo(x + i * 0.32 + (R() - 0.5) * 0.3, top + i * 0.62, z - i * 0.12, 0.7 + i * 0.42, [0.14 - i * 0.012, 0.15 - i * 0.012, 0.19 - i * 0.014]);
      }
      // ---- drifts of green mist over the water ----
      for (const [px, py, s] of MIST) K.halo(X(px), WATER_Y + s * 0.2, Z(py), s * 1.5, [0.09, 0.24, 0.18]);

      // ---- November 16 (anywhere that looks walkable is walkable): the side strips, the planks across, the rails changed
      // for them (with random numbers of their own, so nothing else in the place changes), the broken boards kept holes ----
      {
        const LR = W3D.rand(1116);
        // the side strips: a deck along the house's side, posts under it
        for (const s of STRIPS) {
          const [px0, py0, px1, py1] = s.r, x0 = X(px0), x1 = X(px1), z0 = Z(py0), z1 = Z(py1);
          slab('planks', x0, z0, x1, z1, s.y, 0.24, PL, false, [0.5, 0.5, 0.56]);
          for (const [x, z] of [[x0 + 0.15, z1 - 0.15], [x1 - 0.15, z1 - 0.15], [x0 + 0.15, (z0 + z1) / 2]]) post(x, z, s.y - 0.22, 0.14, null, null, null, true);
        }
        // the walkways' south rails stop where the strips come down; the strips' outer sides; the porch fronts below them
        rail([[300, 182], [413, 182], [413, 221], [594, 221]], NORTH, { rand: LR });
        rail([[940, 229], [1121, 229], [1121, 182], [1161, 182], [1161, 245], [1488, 245]], NORTH, { broken: 0.15, rand: LR });
        // the side decks' rails, open where the planks come across
        rail([[496, 413], [428, 413]], 0, { rand: LR }); rail([[428, 438], [428, 538], [496, 538]], 0, { rand: LR });
        rail([[1044, 408], [1104, 408]], 0, { broken: 0.15, rand: LR }); rail([[1104, 438], [1104, 548], [1044, 548]], 0, { broken: 0.15, rand: LR });
        // the planks: two boards side by side from the house's walkway to the side deck, a batten under each end
        B.solid = false;
        for (const p of PLANKS) {
          for (const py of [p.y0 + 4, p.y1 - 4]) beam('planks', [X(p.x0), p.ya - 0.035, Z(py)], [X(p.x1), p.yb - 0.035, Z(py)], 0.07, [0.55, 0.55, 0.6], 0.36);
          for (const [px, h] of [[p.x0 + 3, p.ya], [p.x1 - 3, p.yb]]) beam('wood', [X(px), h - 0.1, Z(p.y0 - 1)], [X(px), h - 0.1, Z(p.y1 + 1)], 0.06, POST, 0.12);
        }
        B.solid = true;
        // the square's broken boards are holes, exactly as built (the walking map's blocks are a pixel or three short of some)
        for (const h of HOLES) K.addBlock(W3D.rectPoly(h));
      }
      BOX.dispose();
    },
  };
})(window);
