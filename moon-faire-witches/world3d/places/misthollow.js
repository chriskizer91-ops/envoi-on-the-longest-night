// misthollow.js: Misthollow, the town of pale towers high on the peaks, in 3D, laid out on its painting
// (reference/art/walk/walk-misthollow.png, 1536 x 1024) in the painting's own pixels, as src/game/maps.js keeps the walking
// map. Where Io can walk is that map's own walk and block areas (MAPS.misthollow), and, since Chris's rule of November 16
// (anywhere that looks walkable is walkable), every bit of ground that isn't steep or built on; everything here stands
// round the walk. The texture ids are the texture pack's (texture-packs/north/misthollow/inventory.md).
// Heights are metres. The lower square is 0; the great stair climbs to the upper square (2.7); the street climbs on north
// from there to the dead Moonwell (5.1 at the painting's top edge); the chapel yard is the street's height beside it; the
// steps between the pines climb to the ledge behind Sorrel's shop (3.8), the steps east of the street to the east terrace
// (3.6). The west stairs climb from the upper square to the snowy way (4.5 to 5.2), then the second flight to the lit
// landing and the balcony bridge (7.8), and the stair beside the tall tower to the keep's door (10.4). Round the town the
// mountain falls away in cliffs to a sea of mist far below (-8.5).
(function (G) {
  'use strict';
  const P = G.W3D_PLACES = G.W3D_PLACES || {};
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lin = (a, b, v) => clamp((v - a) / (b - a), 0, 1);
  const ss = (a, b, v) => { const t = lin(a, b, v); return t * t * (3 - 2 * t); };
  const inPoly = (poly, x, y) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
  const edgeDist = (poly, x, y) => { let d = 1e9; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [ax, ay] = poly[j], [bx, by] = poly[i], dx = bx - ax, dy = by - ay, t = clamp(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1), 0, 1); d = Math.min(d, Math.hypot(x - ax - t * dx, y - ay - t * dy)); } return d; };
  const hash = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
  const vn = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf); return (hash(xi, yi) * (1 - u) + hash(xi + 1, yi) * u) * (1 - v) + (hash(xi, yi + 1) * (1 - u) + hash(xi + 1, yi + 1) * u) * v; };

  // ---- the levels (metres) ----
  const LU = 2.7, LEDGE = 3.8, EAST = 3.6, NORTH_E = 5.4, LAND = 7.8, TOPL = 10.4, CASTLE = 9.4, DEEP = -20, MIST = -14;
  const street = (y) => LU + 2.4 * Math.min(1.4, Math.max(0, (606 - y) / 606));
  const CHAPEL = street(296) + 0.55;
  const way = (y) => 4.5 + 0.7 * lin(500, 340, y);                       // the snowy way up the west stairs
  const exitH = (y) => -3.6 * lin(966, 1082, y);                          // the stair down to the frozen pass
  // the west stairs' second flight, slanting up north-west from the snowy way to the lit landing: its edges and treads
  const F2 = { yb: 340, yt: 262, n: 13, h0: 5.2, h1: LAND };
  const f2L = (y) => y < 318 ? 245 + (y - 262) * (17 / 56) : 262 + (y - 318) * (8 / 22);
  const f2R = (y) => y < 317 ? 291 + (y - 262) * (16 / 55) : 320;
  const f2Ramp = (y) => F2.h0 + (F2.h1 - F2.h0) * lin(F2.yb, F2.yt, y);
  const f2Tread = (y) => F2.h0 + (F2.h1 - F2.h0) * Math.min(F2.n, Math.max(0, Math.ceil((F2.yb - y) / (F2.yb - F2.yt) * F2.n))) / F2.n;
  const inF2 = (x, y) => y >= F2.yt && y <= F2.yb && x >= f2L(y) - 2 && x <= f2R(y) + 2;

  // the stone stairs, each going up north from its foot (y1, height h0) to its head (y0, height h1) in n treads. Built in
  // extra as solid steps; each tread's top is the height at its back edge, so the slope under them never shows
  const STAIRS = [
    { r: [240, 500, 292, 594], n: 10, h0: LU, h1: LU + 1.8 },                 // the west stairs' first flight
    { r: [300, 110, 338, 204], n: 14, h0: LAND, h1: TOPL },                   // the stair beside the tall tower, up to the keep's door
    { r: [556, 296, 598, 322], n: 3, h0: street(322), h1: CHAPEL },           // the chapel's steps
    { r: [616, 470, 671, 600], n: 7, h0: LU, h1: LEDGE },                     // the steps between the pines, west of the street
    { r: [861, 540, 914, 598], n: 5, h0: LU, h1: EAST },                      // the steps east of the street
    { r: [454, 698, 524, 790], n: 15, h0: 0, h1: LU },                        // the great stair: the west flight,
    { r: [614, 698, 909, 790], n: 15, h0: 0, h1: LU },                        // the middle flight,
    { r: [1006, 698, 1070, 812], n: 16, h0: 0, h1: LU },                      // the east flight
    { r: [668, 966, 862, 1082], n: 12, h0: -3.6, h1: 0 },                     // the stair down toward the frozen pass
    { r: [1104, 140, 1172, 300], n: 20, h0: EAST, h1: CASTLE },               // the castle's great stair, north-east
  ];
  const stairAt = (x, y) => STAIRS.find((t) => x >= t.r[0] - 1 && x <= t.r[2] + 1 && y >= t.r[1] && y <= t.r[3]);
  const stairRamp = (t, y) => t.h0 + (t.h1 - t.h0) * (t.r[3] - y) / (t.r[3] - t.r[1]);
  const stairTread = (t, y) => t.h0 + (t.h1 - t.h0) * Math.min(t.n, Math.max(0, Math.ceil((t.r[3] - y) / (t.r[3] - t.r[1]) * t.n - 1e-6))) / t.n;

  // the balcony bridge's deck (west of the landing, over the cleft), and past its west end the rock it springs from
  const BRIDGE = { r: [50, 216, 246, 260], y: LAND };

  // the town's rock: inside it the town's own levels; outside it the mountain falls away in cliffs to the mist. Traced round
  // the painting's cliff tops: the rock spur north-west, the cleft under the balcony bridge, the cliffs west of the west
  // stairs, the west terrace's corner, the cliff-top ledge past the iron gate, under the south wall, the east wall's corner,
  // the raised block east of the inn, the east terraces, the castle's crag
  const ROCK = [[20, -420], [20, 200], [30, 262], [70, 274], [104, 262], [110, 206], [228, 206], [236, 262],
    [250, 340], [256, 420], [242, 498], [234, 596], [230, 680], [226, 760], [236, 860],
    [220, 936], [206, 992], [200, 1040], [600, 1040], [640, 1096], [890, 1096], [930, 1040], [1336, 1040], [1328, 992], [1318, 944], [1244, 872], [1268, 790], [1270, 590],
    [1340, 540], [1440, 470], [1476, 300], [1476, -420]];
  // the sea of mist, where the cliffs have fallen below it (a still, pale surface the engine draws as water)
  const MIST_POLY = [[-470, -430], [-175, -430], [-175, 230], [-120, 400], [-40, 480], [30, 500], [40, 560], [40, 1100], [60, 1195], [1466, 1195],
    [1500, 1010], [1466, 800], [1466, 590], [1540, 540], [1640, 470], [1676, 300], [1676, -430], [2010, -430], [2010, 1460], [-470, 1460]];

  // the town's own levels at any point (before the cliffs fall away round it)
  function town(x, y) {
    const st = stairAt(x, y); if (st) return stairRamp(st, y) - 0.06;
    // south of the lower square: the stair down to the frozen pass, and the mountainside below the south wall
    if (y > 966 && x > 664 && x < 866) return exitH(y);
    if (y > 984) return -1.2 - 6 * lin(984, 1050, y);                    // the steep bank below the south wall
    // the great stair's three flights, the parapet blocks and gateposts between them
    if (y > 698 && y < 812 && x >= 1006 && x <= 1070) return LU * (1 - lin(698, 812, y));
    if (y > 698 && y < 790 && ((x >= 454 && x <= 524) || (x >= 614 && x <= 909))) return LU * (1 - lin(698, 790, y));
    if (y > 690 && y < 790 && ((x > 430 && x < 454) || (x > 524 && x < 614) || (x > 909 && x < 1006))) return LU;
    if (y > 690 && y < 832 && x > 1070 && x < 1093) return LU;
    if (y > 790) return 0;                                                 // the lower square, the ledge past the gate, behind the east wall
    // (each terrace's edge lies at its wall's upper face, so the ground's slope down it stays behind the wall)
    if (y > 698) {
      if (x <= 432) return 0.2;                                            // the hollow under the west terrace's wall
      if (x < 1173) return LU * (1 - lin(700, 792, y));                    // the snowy bank behind the east pine
      return y < 717 ? EAST : 0;                                           // the raised block east of the inn, and under it
    }
    if (y > 590) {
      if (x < 390 && y > 660) return 0.2;
      if (x < 432 && y > 690) return 0.2;
      if (x < 300 && y > 594 + (x - 240) * 0.9) return 0.2;              // under the west terrace's corner
      if (x >= 1173) return EAST;
      return LU;                                                           // the upper square
    }
    // north of the upper square: the street, east of it, west of it
    if (x >= 696 && x <= 834) return street(y);
    if (x > 834) return east(x, y);
    return west(x, y);
  }
  function east(x, y) {
    if (x <= 946 && y >= 536) return LU + (EAST - LU) * lin(598, 540, y);   // the steps east of the street, and the bank by them
    if (x > 940 && x < 1184 && y > 490) return LU;                          // under the Lantern House
    if (y >= 292) return EAST;                                              // the east terrace
    if (x > 1090 && x < 1186 && y >= 140) return EAST + (CASTLE - EAST) * lin(300, 140, y);  // the castle's great stair, and under its walls
    if (x > 1000 && y < 150) return CASTLE;                                 // the castle's terrace
    return NORTH_E;                                                         // behind the terrace's balustrade
  }
  function west(x, y) {
    // the west stairs: the first flight, the snowy way, the second flight, the lit landing, the stair to the keep's door
    if (x <= 300 && y >= 498) return LU + 1.8 * lin(594, 500, y);
    if (x <= 316 && y >= 340) return way(y);
    if (y >= F2.yt && y < F2.yb + 2 && x <= f2R(y) + (y > 284 ? -4 : 8)) return f2Ramp(y);   // (east of it, the ledge's step lies under the treads)
    if (x <= 300 && y >= 150) return x < 120 && y > 200 ? LAND - 0.12 : LAND;   // the landing; the rock beside the bridge's west end
    if (x >= 296 && x <= 342 && y >= 108 && y <= 206) return LAND + (TOPL - LAND) * lin(206, 108, y);
    if (x >= 280 && x <= 352 && y < 108) return TOPL;
    if (x < 296) return LAND - 0.1 + 0.8 * lin(205, 90, y) + 7 * lin(74, 4, y);   // the snowy shelf above the bridge, the crag behind it
    // the tall tower's terrace, and below its wall the ledge behind Sorrel's shop
    if ((x <= 452 && y < 234) || (x <= 424 && y < 284)) return LAND;
    if (y >= 470 && x >= 576) return LU + (LEDGE - LU) * lin(600, 470, y);  // the steps between the pines, and the pines
    if (y >= 440 && x < 576) return LU + (LEDGE - LU) * ss(560, 440, y);    // under Sorrel's house
    if (y >= 350 || x < 428) return LEDGE;
    // the chapel, its steps, its yard; the hall and the house by the chapel
    if (x >= 536 && x <= 642 && y >= 140 && y <= 296) return CHAPEL;
    if (x >= 550 && x <= 602 && y > 296 && y <= 324) return street(324) + (CHAPEL - street(324)) * lin(324, 296, y);
    return Math.max(street(y), LEDGE);
  }
  // the ground's height under any point of the painting (metres): the town, and round it the cliffs down into the mist
  function ground(x, y) {
    let h = town(x, y);
    // the cleft under the balcony bridge
    if (x > 106 && x < 234 && y > 198 && y < 430) h -= 14 * ss(200, 226, y) * ss(106, 134, x) * ss(234, 206, x) * (1 - ss(330, 430, y));
    if (!inPoly(ROCK, x, y)) {
      const d = edgeDist(ROCK, x, y), s = 0.42 * ss(0, 70, d) + 0.58 * lin(70, 330, d);   // a sheer cliff, then a steep slope of pines
      h = h * (1 - s) + DEEP * s + (vn(x / 140, y / 140) - 0.5) * 1.2 * s;
    }
    return h;
  }


  // ---- the lines of wall and balustrade (built in extra): points in pixels, just off the walk ----
  // kind 'bal': a balustrade (a plinth, small posts, a rail, snow on it) standing on the higher side, its wall going down to
  // the lower; 'wall': a plain parapet wall; over: how far it stands above the higher side (metres)
  const LINES = [
    // the balcony bridge and the lit landing (walk pass 2: the landing's west side and its corners a pixel or two out, off the
    // 2D walk's edge)
    { kind: 'bal', pts: [[100, 219], [234, 219], [234, 193], [274, 155], [292, 162]], posts: [[100, 219], [170, 219], [234, 219], [274, 155]] },
    { kind: 'bal', pts: [[52, 257], [238, 257], [236, 266], [252, 316], [262, 342]], posts: [[52, 257], [94, 257], [170, 257], [238, 257], [262, 342]] },
    // the stair beside the tall tower: its west parapet, and round the top landing
    { kind: 'wall', pts: [[293, 172], [293, 106], [282, 104], [282, 24]], over: 0.9 },
    { kind: 'wall', pts: [[344, 160], [344, 106], [354, 104], [354, 30]], over: 0.9 },
    // the second flight's west balustrade and its east wall
    { kind: 'wall', pts: [[299, 262], [315, 313], [327, 317], [327, 342], [320, 346], [320, 436]], over: 0.8 },   // (walk pass 2: its corner at the flight's head three pixels north, off the treads)
    // the tall tower's terrace: its south wall over the ledge, and its east side
    { kind: 'bal', pts: [[310, 294], [434, 294], [434, 240], [460, 240], [460, 234]], posts: [[330, 294], [393, 294], [434, 294], [434, 240], [460, 240]] },
    // the chapel ledge's balustrade, and the wall between the house by the chapel and the tower's terrace
    { kind: 'bal', pts: [[438, 352], [700, 352]], posts: [[438, 352], [522, 352], [625, 352], [700, 352]] },
    // the street's low walls
    { kind: 'wall', pts: [[701, 4], [701, 114]], over: 0.75 }, { kind: 'wall', pts: [[701, 122], [701, 213]], over: 0.75 },
    { kind: 'wall', pts: [[701, 352], [701, 594]], over: 0.75 },
    { kind: 'wall', pts: [[829, 4], [829, 114]], over: 0.75 }, { kind: 'wall', pts: [[829, 122], [829, 324]], over: 0.75 },
    { kind: 'wall', pts: [[829, 336], [829, 594]], over: 0.75 },
    // the east terrace's north balustrade (the ground behind it is higher), with a gap for the castle's great stair
    { kind: 'bal', pts: [[834, 302], [1097, 302]], posts: [[834, 302], [920, 302], [1010, 302], [1097, 302]] },
    { kind: 'bal', pts: [[1179, 302], [1496, 302]], posts: [[1179, 302], [1260, 302], [1340, 302], [1420, 302], [1496, 302]] },
    { kind: 'wall', pts: [[1097, 302], [1097, 144]], over: 0.9 }, { kind: 'wall', pts: [[1179, 302], [1179, 144]], over: 0.9 },
    { kind: 'bal', pts: [[1000, 148], [1097, 148]], posts: [[1000, 148]] }, { kind: 'bal', pts: [[1179, 148], [1354, 148]], posts: [[1266, 148]] },
    { kind: 'bal', pts: [[1460, 148], [1476, 148]] },
    // the upper square's west terrace, over the hollow (walk pass 2: its two north-south runs two pixels west, off the walk)
    { kind: 'bal', pts: [[237, 601], [279, 639], [295, 648], [295, 665], [383, 665], [383, 695], [437, 695]], posts: [[237, 601], [295, 648], [295, 665], [341, 665], [383, 665], [383, 695]] },
    // the raised block east of the inn
    { kind: 'bal', pts: [[1169, 630], [1169, 728], [1268, 728]], posts: [[1169, 640], [1169, 728], [1218, 728], [1268, 728]] },
    // the lower square: west (the lamp pillar, the iron gate's wall), south (either side of the stair down), east
    { kind: 'bal', pts: [[436, 786], [348, 852]], posts: [[436, 786], [398, 814]] },   // (walk pass 2: two pixels north-west, off the walk)
    { kind: 'bal', pts: [[342, 866], [306, 893], [296, 901]], posts: [[306, 893], [296, 901]] },
    { kind: 'bal', pts: [[262, 918], [224, 937], [220, 978], [650, 978]], posts: [[262, 918], [224, 937], [220, 978], [320, 978], [420, 978], [500, 978], [600, 978]] },
    { kind: 'bal', pts: [[880, 978], [1310, 980], [1312, 944], [1200, 868]], posts: [[1060, 978], [1140, 978], [1220, 979], [1310, 980], [1312, 944], [1256, 906]] },
    { kind: 'bal', pts: [[1174, 857], [1090, 815]], posts: [[1132, 836]] },
  ];

  P.misthollow = {
    id: 'misthollow', name: 'Misthollow', painting: "art/walk/walk-misthollow.avif", size: [1536, 1024],
    mapId: 'misthollow', paintingPng: 'reference/art/walk/walk-misthollow.png',
    // the wall check (tools/walls-test.mjs): from the top of the stair from the frozen pass, to every exit, door and pocket
    checks: { from: [768, 950], goals: [
      ['the dead Moonwell (north edge)', 765, 8], ['the frozen pass (south edge)', 765, 1018], ['Sorrel’s shop', 470, 628],
      ['the Lantern House’s door', 1000, 657], ['the chapel door', 577, 300], ['the chapel yard', 680, 236], ['the top of the steps between the pines', 644, 478],
      ['the top of the steps east of the street', 888, 546], ['the bench by the west stairs', 300, 610], ['the snowy way', 292, 420], ['the lit landing', 268, 222],
      ['the balcony bridge’s end', 112, 238], ['the keep’s door, up the stair by the tall tower', 319, 62], ['the lower square’s west corner', 250, 958],
      ['the lower square’s east corner', 1280, 952], ['the frozen trough', 386, 892],
      ['past the iron gate: the hollow under the west terrace (pocket)', 284, 740], ['the snowy shelf above the bridge (pocket)', 88, 104],
      ['down the bank behind the east pine (pocket)', 1220, 770], ['the castle’s door, up its great stair', 1137, 124], ['the tall tower’s door', 395, 262]] },
    // the trees: the painting's snowy pines (its dark blue), firs nearly all; none in the street or on the squares
    treeGen: { dark: 0.4, step: 40, fir: 0.94, firSouth: 0.94, keepOut: [[690, -500, 840, 30], [236, -70, 470, 300], [40, 186, 252, 300], [880, 196, 1012, 304], [990, -170, 1360, 160], [1340, 130, 1476, 240], [1090, 130, 1190, 310], [470, -330, 700, 120], [500, -200, 560, -100], [840, -300, 1000, 110]],
      roads: [[668, 1024, 862, 1200]], out: { density: 0.55, clump: 220, clear: 0.3, kinds: [0.04, 0.92, 0.04], size: [0.9, 1.4] } },
    // the ground: frosted setts on the street and the squares, trodden snow round them, deep snow everywhere else
    ground: { cob: 'shared_setts_frosted', grass: 'shared_snow', dirt: 'snow_trodden_trail', pave: 'shared_setts_frosted', rep: [2.4, 4.5, 3.6, 2.4], grassTint: [0.84, 0.86, 0.95] },
    // which texture each kind of surface uses: pale frosted block stone for every wall, tower and stair; blue slate roofs;
    // the Lantern House's timber bay; snowy pines
    surfaces: { stone: 'shared_stone_wall_frosted', dry: 'shared_stone_wall_frosted', timber: 'wick_wall_timber_plaster', planks: 'shared_planks_wall',
      roof: 'misthollow_roof_blue_slate', wood: 'shared_boardwalk_planks', deck: 'shared_setts_frosted', pave: 'shared_setts_frosted', cloth: 'camp_tent_canvas',
      soil: 'shared_snow', rock: 'shared_rock_cliff_snowy', leaves: 'fir_foliage_snowladen', firs: 'fir_foliage_snowladen', bark: 'eldergrove_dead_bark' },
    // snow, ice, and the cliffs' rock, for what extra builds
    extraMats: { snow: { tex: 'shared_snow', rep: 2.2, tint: 0xdfe4f4, shade: 0.35 }, ice: { tex: 'shared_ice', rep: 1.2, tint: 0xd8e4ff, shade: 0.3 },
      cliff: { tex: 'shared_rock_cliff_snowy', rep: 4, shade: 0.5 } },
    tints: { leaves: 0xd6dcf2, firs: 0xd4dbf4, bush: 0xd6dcf0, wood: 0xa89ca4 },
    // a frosty night: a cold sky light, the moon a little brighter on the snow, a pale mist for fog
    night: { sky: [0.84, 0.86, 1.0], moon: [0.5, 0.52, 0.68], ground: [0.11, 0.11, 0.16], fog: [0.24, 0.26, 0.37], fogNear: 24, fogFar: 92 },
    // each texture: Chris's made one if the page carries it (texture-packs/made/), else the stand-in. Written out in full, so
    // the offline build finds the pictures and puts them inside the file.
    textures: [
      { id: 'shared_setts_frosted', made: "./../texture-packs/made-web/shared_setts_frosted.webp", stand: "./../texture-packs/north/misthollow/stand-in/shared_setts_frosted.png" },
      { id: 'misthollow_roof_blue_slate', made: "./../texture-packs/made-web/misthollow_roof_blue_slate.webp", stand: "./../texture-packs/north/misthollow/stand-in/misthollow_roof_blue_slate.png" },
      { id: 'shared_snow', made: "./../texture-packs/made-web/shared_snow.webp", stand: "./../texture-packs/north/frozen-pass/stand-in/shared_snow.png" },
      { id: 'snow_trodden_trail', made: "./../texture-packs/made-web/snow_trodden_trail.webp", stand: "./../texture-packs/wilds-north/frozen-camp/stand-in/snow_trodden_trail.png" },
      { id: 'shared_stone_wall_frosted', made: "./../texture-packs/made-web/shared_stone_wall_frosted.webp", stand: "./../texture-packs/north/moonwell/stand-in/shared_stone_wall_frosted.png" },
      { id: 'shared_rock_cliff_snowy', made: "./../texture-packs/made-web/shared_rock_cliff_snowy.webp", stand: "./../texture-packs/north/frozen-pass/stand-in/shared_rock_cliff_snowy.png" },
      { id: 'shared_ice', made: "./../texture-packs/made-web/shared_ice.webp", stand: "./../texture-packs/north/frozen-pass/stand-in/shared_ice.png" },
      { id: 'fir_foliage_snowladen', made: "./../texture-packs/made-web/fir_foliage_snowladen.webp", stand: "./../texture-packs/wilds-north/frozen-camp/stand-in/fir_foliage_snowladen.png" },
      { id: 'wick_wall_timber_plaster', made: "./../texture-packs/made-web/wick_wall_timber_plaster.webp", stand: "./../texture-packs/wickhollow/wickhollow/stand-in/wick_wall_timber_plaster.png" },
      { id: 'shared_planks_wall', made: "./../texture-packs/made-web/shared_planks_wall.webp", stand: "./../texture-packs/bogmire-dawnroost/bogmire/stand-in/shared_planks_wall.png" },
      { id: 'shared_boardwalk_planks', made: "./../texture-packs/made-web/shared_boardwalk_planks.webp", stand: "./../texture-packs/bogmire-dawnroost/bogmire/stand-in/shared_boardwalk_planks.png" },
      { id: 'camp_tent_canvas', made: "./../texture-packs/made-web/camp_tent_canvas.webp", stand: "./../texture-packs/wilds-south/warm-roads-camp/stand-in/camp_tent_canvas.png" },
      { id: 'eldergrove_dead_bark', made: "./../texture-packs/made-web/eldergrove_dead_bark.webp", stand: "./../texture-packs/wilds-south/eldergrove-edge/stand-in/eldergrove_dead_bark.png" },
    ],
    ground_h: ground,
    // where Io's feet stand: the ground, the second flight's treads (the balcony bridge is a deck, below)
    walk_h(x, y) {
      if (inF2(x, y)) return f2Tread(y);
      const st = stairAt(x, y); if (st) return stairTread(st, y);
      return ground(x, y);
    },
    // the sea of mist below the cliffs
    water: [{ poly: MIST_POLY, level: () => MIST, tex: 'shared_snow', rep: 16, flow: [0.0016, 0.0007], bed: DEEP - 2, tint: 0xb4bcdc }],
    noRocks: [[-470, -430, 2010, 1460]],
    lawns: [],
    // no thicket: the town's edges are its walls, its cliffs and the crag above the shelf
    thicket: false,
    start: [768, 950], startFace: Math.PI,
    // the doors out (the walking map's exits), and what is past them
    exits: [
      { rect: [712, 0, 818, 18], label: 'The dead Moonwell' },
      { rect: [670, 1006, 860, 1024], label: 'The frozen pass' },
    ],
    // the balcony bridge: a paved deck over the cleft, west from the lit landing to the rock past its end
    decks: [{ r: BRIDGE.r, y: BRIDGE.y, stilts: false }],

    // ---- the buildings. Footprints in pixels [x0, y0, x1, y1]; the front faces south. Pale block stone, blue slate roofs
    // (snow along their ridges and eaves, and icicles, are added in extra) ----
    buildings: [
      // Sorrel's shop: two storeys, a cross gable over the shop, the green awning and the window of bottles (in extra)
      { id: 'sorrel', name: 'Sorrel’s shop', fp: [310, 440, 578, 584], walls: [{ t: 'stone', h: 3.3 }, { t: 'stone', h: 2.7 }], roof: { ridge: 'ew', rise: 4.2, over: 0.5 },
        doors: [{ side: 's', x: 527, w: 1.3, h: 2.5, arch: true }],
        windows: [{ side: 's', x: 340, y: 1.2, w: 0.8, h: 1.1 }, { side: 's', x: 340, y: 4.0, w: 0.8, h: 1.1 }, { side: 's', x: 455, y: 4.0, w: 1.0, h: 1.3 },
          { side: 's', x: 556, y: 4.0, w: 0.7, h: 1.0 }, { side: 'w', y: 470, z: 4.0, w: 0.8, h: 1.0, dark: true }, { side: 'w', y: 540, z: 1.2, w: 0.8, h: 1.0 }],
        lanterns: [{ side: 's', x: 527, y: 3.05 }], dormers: [{ side: 's', x: 556, w: 1.3 }],
        chimneys: [{ x: 382, y: 466, w: 0.9, d: 0.9, h: 2.6 }, { x: 548, y: 470, w: 0.8, d: 0.8, h: 2.0 }] },
      // the Lantern House, the last inn with a fire lit: its west part with the door and its lantern, and its east part with
      // the timber-framed upper floor
      { id: 'inn-west', name: 'the Lantern House', fp: [946, 482, 1040, 646], walls: [{ t: 'stone', h: 3.1 }, { t: 'timber', h: 2.4 }], roof: { ridge: 'ns', rise: 3.3, over: 0.45 },
        doors: [{ side: 's', x: 1000, w: 1.3, h: 2.4, arch: true }], lanterns: [{ side: 's', x: 1000, y: 2.95 }],
        windows: [{ side: 's', x: 1000, y: 3.75, w: 0.8, h: 1.0 }, { side: 'w', y: 600, z: 1.1, w: 0.8, h: 1.0 }, { side: 'w', y: 540, z: 3.7, w: 0.8, h: 1.0 }],
        chimneys: [{ x: 972, y: 520, w: 0.9, d: 0.9, h: 2.6 }] },
      { id: 'inn-east', name: 'the Lantern House, east', fp: [1040, 470, 1180, 634], walls: [{ t: 'stone', h: 3.1 }, { t: 'timber', h: 2.8 }], roof: { ridge: 'ew', rise: 3.6, over: 0.5 },
        windows: [{ side: 's', x: 1074, y: 0.9, w: 0.9, h: 1.15 }, { side: 's', x: 1116, y: 0.9, w: 0.9, h: 1.15 }, { side: 's', x: 1084, y: 3.7, w: 0.9, h: 1.25 },
          { side: 's', x: 1130, y: 3.7, w: 0.9, h: 1.25 }, { side: 's', x: 1160, y: 0.9, w: 0.7, h: 1.0, dark: true }, { side: 'e', y: 560, z: 3.7, w: 0.8, h: 1.0 }],
        chimneys: [{ x: 1152, y: 500, w: 1.0, d: 1.0, h: 3.0 }] },
      // the small chapel: a steep stone gable, its arched door up three steps, its window of coloured glass, the bell-cote
      { id: 'chapel', name: 'the chapel', fp: [538, 140, 640, 296], floor: CHAPEL, walls: [{ t: 'stone', h: 6.6 }], roof: { ridge: 'ns', rise: 4.8, over: 0.35 },
        doors: [{ side: 's', x: 577, w: 1.5, h: 2.8, arch: true, double: true }],
        windows: [{ side: 's', x: 577, y: 3.8, w: 1.0, h: 1.8, colour: true }, { side: 'e', y: 240, z: 2.0, w: 0.7, h: 1.9, colour: true }, { side: 'e', y: 180, z: 2.0, w: 0.7, h: 1.9, colour: true },
          { side: 'w', y: 240, z: 2.0, w: 0.7, h: 1.9, colour: true }], belfry: true },
      // the house by the chapel, behind the ledge's balustrade
      { id: 'chapel-house', name: 'the house by the chapel', fp: [438, 262, 548, 344], walls: [{ t: 'stone', h: 3.2 }], roof: { ridge: 'ns', rise: 3.4, over: 0.4 },
        doors: [{ side: 's', x: 470, w: 1.0, h: 2.1, light: false }], windows: [{ side: 's', x: 518, y: 1.1, w: 0.8, h: 0.9, dark: true }],
        dormers: [{ side: 'e', y: 300, w: 1.1 }], chimneys: [{ x: 446, y: 280, w: 0.8, d: 0.8, h: 2.0 }] },
      // the hall north of it, its west side on the tall tower's terrace
      { id: 'west-hall', name: 'the hall behind the chapel', fp: [462, -60, 534, 236], walls: [{ t: 'stone', h: 4.2 }, { t: 'stone', h: 3.8 }], roof: { ridge: 'ns', rise: 3.0, over: 0.3 },
        windows: [{ side: 's', x: 498, y: 4.8, w: 0.8, h: 1.4, dark: true }, { side: 'e', y: 120, z: 5.0, w: 0.7, h: 1.3 }, { side: 'e', y: 190, z: 1.4, w: 0.7, h: 1.2, dark: true }, { side: 'w', y: 150, z: 5.0, w: 0.7, h: 1.3, dark: true }] },
      // the square tower behind the chapel, by the street's north lamps
      { id: 'chapel-tower', name: 'the tower behind the chapel', fp: [592, 24, 682, 112], walls: [{ t: 'stone', h: 6.0 }, { t: 'stone', h: 5.5 }], roof: { ridge: 'ns', rise: 4.2, over: 0.3 },
        windows: [{ side: 's', x: 637, y: 8.0, w: 0.7, h: 1.4 }, { side: 'e', y: 70, z: 8.0, w: 0.7, h: 1.4, dark: true }, { side: 's', x: 620, y: 3.0, w: 0.6, h: 1.0, dark: true }] },
      // north of the painting, either side of the street on to the Moonwell
      { id: 'north-west', fp: [534, -300, 698, 22], walls: [{ t: 'stone', h: 4.0 }, { t: 'stone', h: 3.5 }], roof: { ridge: 'ns', rise: 3.6, over: 0.4 },
        windows: [{ side: 'e', y: -100, z: 4.6, w: 0.7, h: 1.1 }, { side: 'e', y: -200, z: 1.2, w: 0.7, h: 1.0, dark: true }] },
      { id: 'nw-house', fp: [356, -160, 462, 40], walls: [{ t: 'stone', h: 4.0 }, { t: 'stone', h: 3.4 }], roof: { ridge: 'ew', rise: 3.2, over: 0.4 },
        windows: [{ side: 's', x: 380, y: 4.6, w: 0.7, h: 1.0 }, { side: 's', x: 430, y: 1.2, w: 0.7, h: 1.0, dark: true }] },
      { id: 'castle-east', fp: [1352, -140, 1476, 70], floor: CASTLE, walls: [{ t: 'stone', h: 4.4 }, { t: 'stone', h: 3.8 }], roof: { ridge: 'ew', rise: 3.2, over: 0.35 },
        windows: [{ side: 's', x: 1380, y: 5.2, w: 0.7, h: 1.2, dark: true }, { side: 's', x: 1440, y: 1.3, w: 0.7, h: 1.2 }] },
      { id: 'east-north', fp: [846, -200, 908, 100], walls: [{ t: 'stone', h: 4.5 }, { t: 'stone', h: 4.0 }], roof: { ridge: 'ns', rise: 2.8, over: 0.3 },
        windows: [{ side: 'w', y: 40, z: 5.0, w: 0.7, h: 1.2 }, { side: 'w', y: -60, z: 1.4, w: 0.7, h: 1.1, dark: true }, { side: 's', x: 877, y: 5.0, w: 0.6, h: 1.1, dark: true }] },
      // the castle on the crag north-east: its great arched door at the head of its stair
      { id: 'castle', name: 'the castle', fp: [1000, -150, 1352, 82], floor: CASTLE, walls: [{ t: 'stone', h: 5.0 }, { t: 'stone', h: 4.6 }], roof: { ridge: 'ew', rise: 4.0, over: 0.35 },
        doors: [{ side: 's', x: 1137, w: 1.9, h: 3.2, arch: true, double: true }],
        windows: [{ side: 's', x: 1050, y: 1.4, w: 0.8, h: 1.4, dark: true }, { side: 's', x: 1090, y: 6.0, w: 0.8, h: 1.4 }, { side: 's', x: 1186, y: 6.0, w: 0.8, h: 1.4 },
          { side: 's', x: 1230, y: 1.4, w: 0.8, h: 1.4 }, { side: 's', x: 1290, y: 6.0, w: 0.8, h: 1.4, dark: true }, { side: 's', x: 1137, y: 6.2, w: 1.1, h: 1.6, colour: true }],
        lanterns: [{ side: 's', x: 1108, y: 2.9 }, { side: 's', x: 1166, y: 2.9 }] },
      // the house on the east terrace with its arched door, behind the inn
      { id: 'east-house', name: 'the house on the east terrace', fp: [994, 342, 1096, 438], walls: [{ t: 'stone', h: 3.4 }, { t: 'stone', h: 2.6 }], roof: { ridge: 'ew', rise: 2.8, over: 0.4 },
        doors: [{ side: 's', x: 1045, w: 1.3, h: 2.5, arch: true, light: false }], windows: [{ side: 's', x: 1012, y: 3.9, w: 0.7, h: 0.9 }, { side: 's', x: 1078, y: 3.9, w: 0.7, h: 0.9, dark: true }] },
      // the house at the east terrace's far end, by the cliff
      { id: 'east-end', name: 'the house at the terrace’s end', fp: [1196, 404, 1276, 500], walls: [{ t: 'stone', h: 3.4 }, { t: 'stone', h: 2.4 }], roof: { ridge: 'ns', rise: 3.0, over: 0.4 },
        doors: [{ side: 's', x: 1214, w: 1.0, h: 2.2, light: false }], windows: [{ side: 's', x: 1252, y: 1.1, w: 0.7, h: 0.9 }, { side: 'w', y: 450, z: 3.9, w: 0.7, h: 0.9, dark: true }],
        chimneys: [{ x: 1262, y: 430, w: 0.8, d: 0.8, h: 2.0 }] },
    ],

    walls: [],
    steps: [],
    // lamps: square stone pillars with an iron lantern on top (the walking map's eleven: three up each side of the street, the
    // two over the great stair, the two on the south wall's pedestals, the one on the lit landing), and the two on the
    // lower square's corner pillars
    lamps: [
      { at: [697, 118], kind: 'pillar', h: 2.5 }, { at: [833, 118], kind: 'pillar', h: 2.5 }, { at: [697, 333], kind: 'pillar', h: 2.5 }, { at: [834, 330], kind: 'pillar', h: 2.5 },
      { at: [697, 595], kind: 'pillar', h: 2.5 }, { at: [835, 595], kind: 'pillar', h: 2.5 }, { at: [598, 693], kind: 'pillar', h: 1.7 }, { at: [925, 693], kind: 'pillar', h: 1.7 },
      { at: [560, 952], kind: 'pillar', h: 1.25, y: 1.05 }, { at: [971, 952], kind: 'pillar', h: 1.25, y: 1.05 }, { at: [283, 255], kind: 'post', h: 2.3 },
      { at: [346, 860], kind: 'pillar', h: 1.9, y: 0.2 }, { at: [1185, 862], kind: 'pillar', h: 1.9, y: 0.05 },
    ],
    // small things: the bench and the barrel by the west stairs, the barrels and crates under the great stair and by the south
    // lamps, the inn's barrels and crate, the barrels inside the east wall, the crates by the frozen trough
    props: [
      { k: 'bench', at: [349, 604], face: 0 }, { k: 'barrel', at: [390, 612] },
      { k: 'barrel', at: [540, 798] }, { k: 'barrel', at: [556, 812] }, { k: 'barrel', at: [538, 818] }, { k: 'crates', at: [614, 808] },
      { k: 'barrel', at: [906, 800] }, { k: 'barrel', at: [976, 812] }, { k: 'barrel', at: [984, 796] }, { k: 'crates', at: [956, 822] },
      { k: 'barrel', at: [527, 961] }, { k: 'barrel', at: [1004, 959] },
      { k: 'barrel', at: [1030, 648] }, { k: 'barrel', at: [1062, 650] }, { k: 'crates', at: [1112, 648] },
      { k: 'barrel', at: [1112, 836] }, { k: 'barrel', at: [1134, 850] }, { k: 'barrel', at: [1156, 862] },
      { k: 'crates', at: [404, 846] },
      { k: 'bench', at: [1226, 760], face: Math.PI },
    ],
    flowers: [],
    // the lights for the light map: [x, y, radius px, strength, colour]. The lamps' and windows' own are added for them.
    lights: [
      [440, 620, 110, 0.85, 'warm'], [527, 610, 80, 0.5, 'warm'], [1000, 662, 110, 0.75, 'warm'], [1095, 652, 90, 0.55, 'warm'], [577, 320, 60, 0.35, 'warm'],
    ],
    trees: 'misthollow',
    // the painting's own trees close to the paths (make-trees.mjs keeps its trees 30 px off the walk): the pines either side
    // of the steps between the pines, the pine by the east steps, the pines either side of the great stair, the pine east of
    // the street, the pine by the snowy way, the bare trees by the street, and the pines that hide the pockets
    extraTrees: [[598, 590, 0.95, 1, 11], [674, 492, 1.05, 1, 12], [930, 572, 0.95, 1, 13], [410, 782, 1.05, 1, 14], [1122, 792, 1.0, 1, 15],
      [846, 286, 1.15, 1, 16], [228, 528, 0.95, 1, 17], [692, 206, 1.1, 2, 18], [882, 296, 0.9, 2, 19], [126, 184, 0.9, 1, 20], [38, 170, 1.0, 1, 21],
      [170, 112, 0.85, 1, 22], [252, 840, 0.8, 1, 23], [246, 760, 0.85, 1, 24], [1196, 616, 0.8, 1, 25], [1236, 640, 0.7, 1, 26], [520, 256, 0.75, 1, 27],
      // down the cliffs west and east, where the painting has them
      [40, 420, 1.3, 1, 31], [120, 470, 1.4, 1, 32], [196, 446, 1.2, 1, 33], [60, 530, 1.35, 1, 34], [180, 540, 1.25, 1, 35], [100, 610, 1.4, 1, 36],
      [24, 700, 1.3, 1, 37], [150, 720, 1.4, 1, 38], [196, 800, 1.2, 1, 39], [60, 840, 1.4, 1, 40], [150, 890, 1.3, 1, 41], [30, 960, 1.35, 1, 42],
      [120, 990, 1.4, 1, 43], [190, 950, 1.2, 1, 44], [90, 380, 1.2, 1, 45], [200, 650, 1.1, 1, 46],
      [1310, 392, 1.2, 1, 51], [1390, 420, 1.3, 1, 52], [1500, 456, 1.35, 1, 53], [1324, 520, 1.25, 1, 54], [1430, 560, 1.4, 1, 55], [1500, 620, 1.35, 1, 56],
      [1350, 650, 1.3, 1, 57], [1460, 700, 1.4, 1, 58], [1300, 770, 1.2, 1, 59], [1400, 800, 1.35, 1, 60], [1500, 780, 1.3, 1, 61], [1350, 880, 1.3, 1, 62],
      [1460, 900, 1.4, 1, 63], [1520, 980, 1.3, 1, 64], [1380, 990, 1.35, 1, 65], [1300, 1000, 1.1, 1, 66],
      // on the crag above the shelf
      [40, 40, 1.2, 1, 71], [110, 28, 1.3, 1, 72], [186, 46, 1.15, 1, 73], [250, 24, 1.2, 1, 74], [150, 70, 0.9, 1, 75]],
    // pockets past the 2D walk, found by looking: the rock past the balcony bridge's west end, and the path up from it
    // behind the pines to the snowy shelf above the bridge; the cliff-top ledge past the iron gate in the lower square's
    // west wall, to the hollow under the west terrace; the snowy bank down behind the east pine, under the raised block
    walkAdd: [
      { poly: [[50, 254], [50, 200], [56, 160], [70, 128], [96, 104], [128, 98], [150, 116], [134, 146], [112, 168], [100, 196], [98, 222], [108, 222], [108, 254]], ground: 'dirt' },
      { poly: [[266, 924], [294, 910], [298, 880], [294, 850], [300, 816], [314, 784], [326, 752], [306, 726], [272, 718], [246, 736], [240, 780], [250, 830], [256, 880], [258, 914]], ground: 'dirt' },
      { poly: [[1100, 704], [1160, 704], [1160, 736], [1250, 740], [1258, 782], [1200, 800], [1150, 808], [1110, 800], [1098, 760]], ground: 'dirt' },
    ],
    // the Misthollow Cowl lies at the end of the balcony bridge in the 2D game; in 3D it lies past the bridge's end, up the
    // path behind the pines, at the top of the snowy shelf
    items: { 'misthollow-cowl': [88, 104] },

    // ---- everything the engine has no field for: the towers, the balcony bridge's arch, the balustrades and walls, the great
    // stair's parapets and gateposts, the shop front, the inn's sign, the banners, the street's inlaid stars, snow and icicles,
    // the trough, the wagon wheels, the cliffs' rocks ----
    extra(K) {
      const { B, X, Z, TAU, M } = K, T3 = G.THREE;
      const R = G.W3D.rand(53);
      const STONE = [1.14, 1.12, 1.2], STONE_D = [0.98, 0.96, 1.04], PALE = [1.5, 1.5, 1.6], SNOW = [1.05, 1.07, 1.14], IRON = null;
      const gh = K.gh, ter = K.terrain, wh = K.walkH;
      const V3 = (a) => new T3.Vector3(a[0], a[1], a[2]);
      const ico0 = new T3.IcosahedronGeometry(1, 0), sph = new T3.IcosahedronGeometry(1, 1);
      const UP = new T3.Vector3(0, 1, 0), _q = new T3.Quaternion(), _d = new T3.Vector3();
      // a thing she walks through or that never stands in her way (snow caps, cloth, icicles)
      const soft = (fn) => { B.solid = false; fn(); B.solid = true; };
      // a round rod from a to b
      const rod = (k, a, b, r, col, seg) => { _d.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]); const L = _d.length(); if (L < 1e-4) return; _d.multiplyScalar(1 / L); _q.setFromUnitVectors(UP, _d); const g = new T3.CylinderGeometry(r, r, L, seg || 5, 1, true); g.translate(0, L / 2, 0); B.geom(k, g, new T3.Matrix4().compose(V3(a), _q, new T3.Vector3(1, 1, 1)), col, [0.4, L]); g.dispose(); };
      // a flat thing on a wall: centre c, along tangent t, w wide, h tall (facing t x up)
      const onWall = (k, c, t, w, h, col, uv) => { const a = [c[0] - t[0] * w / 2, c[1], c[2] - t[2] * w / 2], b = [c[0] + t[0] * w / 2, c[1], c[2] + t[2] * w / 2]; B.quad(k, a, b, [b[0], b[1] + h, b[2]], [a[0], a[1] + h, a[2]], uv || [0, 0, 1, 1], col); };
      const ball = (x, y, z, r, k, col) => B.geom(k || 'snow', sph, new T3.Matrix4().compose(new T3.Vector3(x, y + r, z), new T3.Quaternion(), new T3.Vector3(r, r, r)), col || [0.92, 0.93, 1.0], 0.5);
      const snowLump = (x, y, z, sx, sy, sz) => soft(() => B.geom('snow', K.ico[Math.floor(R() * 3)], new T3.Matrix4().compose(new T3.Vector3(x, y, z), new T3.Quaternion().setFromEuler(new T3.Euler(0, R() * TAU, 0)), new T3.Vector3(sx, sy, sz)), SNOW, 1.5));

      // ---- walls and balustrades along LINES: a wall from the lower side up to the higher, and on the higher side a
      // balustrade (a plinth, small posts, a rail with snow on it) or a plain parapet ----
      const sideH = (px, py, nx, nz, d) => ter(M.px(X(px) + nx * d), M.py(Z(py) + nz * d));
      function line(L) {
        const t = L.kind === 'bal' ? 0.34 : 0.46;
        for (let k = 1; k < L.pts.length; k++) {
          const [ax, ay] = L.pts[k - 1], [bx, by] = L.pts[k], A = [X(ax), Z(ay)], Bp = [X(bx), Z(by)];
          const dx = Bp[0] - A[0], dz = Bp[1] - A[1], len = Math.hypot(dx, dz), ry = Math.atan2(-dz, dx), nx = -dz / len, nz = dx / len;
          const n = Math.max(1, Math.ceil(len / 1.1));
          for (let i = 0; i < n; i++) {
            const f = (i + 0.5) / n, x = A[0] + dx * f, z = A[1] + dz * f, px = M.px(x), py = M.py(z), seg = len / n + 0.03;
            const h1 = sideH(px, py, nx, nz, 0.7), h2 = sideH(px, py, -nx, -nz, 0.7), hi = Math.max(h1, h2, wh(px, py)), lo = Math.max(Math.min(h1, h2, ter(px, py)), hi - 4.2);   // down to the lower ground, or 4 m down a cliff
            const top = hi + (L.kind === 'bal' ? 0.42 : (L.over || 0.8));
            B.box('stone', x, lo - 0.4, z, seg, top - lo + 0.4, t + (L.kind === 'bal' ? 0.06 : 0), ry, STONE_D, { u0: i * seg });
            soft(() => B.box('snow', x, top, z, seg, 0.08, t + 0.12, ry, SNOW));
            if (L.kind === 'bal') {
              for (let s = -seg / 2 + 0.16; s < seg / 2; s += 0.3) { const bx_ = x + Math.cos(ry) * s, bz_ = z - Math.sin(ry) * s; B.box('stone', bx_, top + 0.08, bz_, 0.1, 0.46, 0.1, ry, STONE, { noTop: true }); }
              B.box('stone', x, top + 0.54, z, seg, 0.13, t + 0.04, ry, STONE);
              soft(() => B.box('snow', x, top + 0.67, z, seg, 0.07, t + 0.1, ry, SNOW));
            }
          }
        }
        for (const [px, py] of L.posts || []) post(px, py, L.kind === 'bal' ? 1.38 : 1.1);
      }
      // a square post with a round stone finial and snow on it (walk pass 2: its cap, a hand wider than the post at her
      // shoulder, isn't counted as solid, so the walk beside a post reaches the post itself, as in the 2D game)
      function post(px, py, hgt, base) {
        const x = X(px), z = Z(py), lo = Math.min(ter(px, py), ter(px + 8, py), ter(px - 8, py), ter(px, py + 7), ter(px, py - 7)) - 0.4;
        const g = base != null ? base : Math.max(ter(px, py), wh(px, py), ter(px + 8, py), ter(px - 8, py), ter(px, py + 7), ter(px, py - 7));
        B.box('stone', x, lo, z, 0.5, g + hgt - lo, 0.5, 0, STONE);
        soft(() => { B.box('stone', x, g + hgt, z, 0.62, 0.12, 0.62, 0, STONE_D); ball(x, g + hgt + 0.12, z, 0.17); });
        soft(() => B.box('snow', x, g + hgt + 0.12, z, 0.58, 0.06, 0.58, 0, SNOW));
      }
      for (const L of LINES) line(L);

      // ---- a round tower of pale stone: its windows, a corbelled band, a cone of blue slate with snow round its foot ----
      function tower(o) {
        const x = X(o.at[0]), z = Z(o.at[1]), r = o.r, foot = o.foot != null ? o.foot : o.base - 6, top = o.base + o.h;
        B.cyl('stone', x, foot, z, r, r, top - foot, 18, STONE, [TAU * r, top - foot], true);
        B.cyl('stone', x, top - 0.5, z, r, r + 0.22, 0.5, 18, STONE_D, null, true);
        B.cyl('stone', x, top, z, r + 0.22, r + 0.22, 0.14, 18, STONE_D);
        B.cyl('roof', x, top + 0.1, z, r + 0.5, 0.03, o.cone, 18, [1, 1, 1], [TAU * r, o.cone], true);
        soft(() => { B.cyl('snow', x, top + 0.06, z, r + 0.56, r + 0.3, 0.34, 18, SNOW, null, true); B.cyl('iron', x, top + o.cone - 0.1, z, 0.05, 0.01, 1.0, 5); });
        for (const [a, hh, lit, w] of o.wins || []) {
          const n = [Math.cos(a), 0, Math.sin(a)], t = [Math.sin(a), 0, -Math.cos(a)], ww = w || 0.62, c = [x + n[0] * (r + 0.04), o.base + hh, z + n[2] * (r + 0.04)];
          onWall('stone', [c[0] - n[0] * 0.02, c[1] - 0.12, c[2] - n[2] * 0.02], t, ww + 0.34, 1.5, STONE_D, [0, 0, ww + 0.34, 1.5]);
          onWall(lit ? 'win' : 'winDark', c, t, ww, 1.15);
          if (lit) K.halo(c[0] + n[0] * 0.25, c[1] + 0.6, c[2] + n[2] * 0.25, 1.1, [1.0, 0.68, 0.36]);
        }
        if (o.door != null) {
          const a = o.door, n = [Math.cos(a), 0, Math.sin(a)], t = [Math.sin(a), 0, -Math.cos(a)], c = [x + n[0] * (r + 0.05), o.base, z + n[2] * (r + 0.05)];
          onWall('stone', [c[0] - n[0] * 0.02, c[1], c[2] - n[2] * 0.02], t, 1.7, 2.8, STONE_D, [0, 0, 1.7, 2.8]);
          onWall('doorArch', c, t, 1.2, 2.3);
          if (o.doorLamp) { K.lantern(c[0] + n[0] * 0.3 + t[0] * 0.95, o.base + 2.3, c[2] + n[2] * 0.3 + t[2] * 0.95, n, 0.8); K.light(M.px(c[0] + n[0] * 1.2), M.py(c[2] + n[2] * 1.2), 90, 0.6); }
        }
      }
      // the tall tower west of the chapel, on its terrace above the west stairs; the keep at the head of the stair beside it,
      // its door at the stair's top; the tower east of the street; the tower by the castle; and towers past the painting's
      // top edge, for the town's skyline
      tower({ at: [395, 205], r: 2.3, base: LAND, foot: LEDGE - 0.5, h: 13.5, cone: 6.0, door: Math.PI / 2, doorLamp: true,
        wins: [[1.2, 3.5, true], [2.2, 7.0, false], [1.0, 10.0, true], [0.2, 6.0, false], [2.8, 11.0, false]] });
      tower({ at: [300, -12], r: 2.0, base: TOPL, foot: LAND - 2, h: 8.5, cone: 5.0, door: 1.18, doorLamp: true, wins: [[1.6, 4.5, true], [0.6, 6.5, false], [2.4, 6.0, false]] });
      tower({ at: [948, 250], r: 2.1, base: NORTH_E, foot: EAST - 0.5, h: 12.5, cone: 5.6, wins: [[1.57, 3.5, false], [2.4, 6.5, true], [1.2, 9.5, false], [0.6, 6.0, true]] });
      tower({ at: [1408, 186], r: 2.1, base: CASTLE, foot: EAST, h: 11.0, cone: 5.6, wins: [[1.57, 3.0, true], [2.6, 6.5, false], [0.9, 8.0, false]] });
      tower({ at: [1010, -40], r: 1.8, base: CASTLE, foot: CASTLE - 1, h: 13.5, cone: 4.8, wins: [[1.57, 9.0, true]] });
      tower({ at: [1300, -60], r: 1.8, base: CASTLE, foot: CASTLE - 1, h: 14.5, cone: 4.8, wins: [[1.57, 10.0, false], [2.4, 7.0, true]] });
      tower({ at: [520, -150], r: 2.0, base: street(-150), h: 14.0, cone: 5.0, wins: [[1.57, 6.0, true], [0.7, 10.0, false]] });
      tower({ at: [960, -260], r: 2.2, base: street(-260), h: 16.0, cone: 5.6, wins: [[1.57, 8.0, false], [2.5, 12.0, true]] });

      // ---- the balcony bridge: under its deck a wall of stone over the cleft, with the great arch through it ----
      {
        const x0 = X(56), x1 = X(244), y1 = LAND - 0.16, bot = -12, ax0 = X(118), ax1 = X(214), ar = (ax1 - ax0) / 2, am = (ax0 + ax1) / 2, spring = LAND - 1.3 - ar;
        const sh = new T3.Shape(); sh.moveTo(x0, bot); sh.lineTo(x1, bot); sh.lineTo(x1, y1); sh.lineTo(x0, y1); sh.lineTo(x0, bot);
        const hole = new T3.Path(); hole.moveTo(ax0, bot); hole.lineTo(ax0, spring); hole.absarc(am, spring, ar, Math.PI, 0, true); hole.lineTo(ax1, bot); hole.lineTo(ax0, bot); sh.holes.push(hole);
        const eg = new T3.ExtrudeGeometry(sh, { depth: Z(BRIDGE.r[3]) - Z(BRIDGE.r[1]), bevelEnabled: false, curveSegments: 16 });
        B.geom('stone', eg, new T3.Matrix4().makeTranslation(0, 0, Z(BRIDGE.r[1])), STONE_D, 1); eg.dispose();
        // the arch's ring of voussoirs, standing a little proud on the south face
        const ring = new T3.Shape(); ring.absarc(0, 0, ar + 0.55, 0, Math.PI, false); ring.absarc(0, 0, ar, Math.PI, 0, true);
        const rg = new T3.ExtrudeGeometry(ring, { depth: 0.2, bevelEnabled: false, curveSegments: 16 });
        B.geom('stone', rg, new T3.Matrix4().makeTranslation(am, spring, Z(BRIDGE.r[3]) - 0.02), STONE, 1); rg.dispose();
        // a cornice along the deck's south edge
        B.box('stone', (x0 + x1) / 2, y1 - 0.32, Z(BRIDGE.r[3]) + 0.12, x1 - x0, 0.32, 0.24, 0, STONE);
        K.shadeMarks.push(['rect', 56, 260, 244, 300, 0.7]);
      }

      // ---- the stone stairs: solid steps, a little snow at each tread's ends, a low cheek along each side ----
      for (const t of STAIRS) {
        const [px0, py0, px1, py1] = t.r, L = py1 - py0, xa = X(px0), xb = X(px1), bot = t.h0 - 0.45;
        for (let k = 1; k <= t.n; k++) {
          const ya = py1 - L * k / t.n, yb = py1 - L * (k - 1) / t.n, top = t.h0 + (t.h1 - t.h0) * k / t.n, za = Z(ya), zb = Z(yb), zc = (za + zb) / 2, dz = zb - za + 0.02;
          B.box('stone', (xa + xb) / 2, bot, zc, xb - xa, top - bot, dz, 0, [0.97, 0.95, 1.02], { u0: xa });
          B.box('stone', (xa + xb) / 2, top - 0.05, zb - 0.04, xb - xa + 0.02, 0.05, 0.08, 0, [1.12, 1.1, 1.18], { solid: false });
          for (const x of [xa - 0.15, xb + 0.15]) B.box('stone', x, bot, zc, 0.3, top - bot + 0.24, dz, 0, STONE_D, { solid: false });
          soft(() => { B.box('snow', xa + 0.2, top, zc, 0.4, 0.05, dz - 0.02, 0, SNOW); B.box('snow', xb - 0.16, top, zc, 0.32, 0.04, dz - 0.02, 0, SNOW); });
        }
      }

      // ---- the arched viaduct north-east, carrying the castle's terrace south over the ground behind the east terrace ----
      {
        const x0 = X(1206), x1 = X(1352), bot = NORTH_E - 1.2, y1 = CASTLE + 0.1, ax0 = X(1240), ax1 = X(1320), ar = (ax1 - ax0) / 2, am = (ax0 + ax1) / 2, spring = CASTLE - 0.9 - ar, zf = Z(244);
        const sh = new T3.Shape(); sh.moveTo(x0, bot); sh.lineTo(x1, bot); sh.lineTo(x1, y1); sh.lineTo(x0, y1); sh.lineTo(x0, bot);
        const hole = new T3.Path(); hole.moveTo(ax0, bot); hole.lineTo(ax0, spring); hole.absarc(am, spring, ar, Math.PI, 0, true); hole.lineTo(ax1, bot); hole.lineTo(ax0, bot); sh.holes.push(hole);
        const eg = new T3.ExtrudeGeometry(sh, { depth: 1.4, bevelEnabled: false, curveSegments: 14 });
        B.geom('stone', eg, new T3.Matrix4().makeTranslation(0, 0, zf - 1.4), STONE_D, 1); eg.dispose();
        const ring = new T3.Shape(); ring.absarc(0, 0, ar + 0.5, 0, Math.PI, false); ring.absarc(0, 0, ar, Math.PI, 0, true);
        const rg = new T3.ExtrudeGeometry(ring, { depth: 0.18, bevelEnabled: false, curveSegments: 14 });
        B.geom('stone', rg, new T3.Matrix4().makeTranslation(am, spring, zf - 0.02), STONE, 1); rg.dispose();
        // its parapet, snow along it, and the deck running back to the castle's terrace
        B.box('stone', (x0 + x1) / 2, y1, zf - 0.2, x1 - x0, 0.75, 0.36, 0, STONE);
        soft(() => B.box('snow', (x0 + x1) / 2, y1 + 0.75, zf - 0.2, x1 - x0 + 0.06, 0.07, 0.44, 0, SNOW));
        B.box('stone', (x0 + x1) / 2, bot, (Z(150) + zf - 1.4) / 2, x1 - x0, y1 - bot, zf - 1.4 - Z(150), 0, STONE_D, { noTop: true });
        B.box('pave', (x0 + x1) / 2, y1 - 0.05, (Z(150) + zf) / 2, x1 - x0, 0.05, zf - Z(150), 0, null, { solid: false });
        for (const px of [1206, 1352]) post(px, 244, 1.2, y1);
        K.shadeMarks.push(['rect', 1206, 244, 1352, 300, 0.75]);
      }

      // ---- the second flight of the west stairs: its treads slant up north-west from the snowy way to the lit landing ----
      {
        const L = F2.yb - F2.yt;
        for (let k = 1; k <= F2.n; k++) {
          const ya = F2.yb - L * k / F2.n, yb = F2.yb - L * (k - 1) / F2.n, top = F2.h0 + (F2.h1 - F2.h0) * k / F2.n, ym = (ya + yb) / 2;
          const xa = X(f2L(ym) - 2), xb = X(f2R(ym) + 2);
          B.box('stone', (xa + xb) / 2, LEDGE - 0.4, (Z(ya) + Z(yb)) / 2, xb - xa, top - LEDGE + 0.4, Z(yb) - Z(ya) + 0.02, 0, [0.97, 0.95, 1.02]);
          soft(() => { B.box('snow', xa + 0.25, top, (Z(ya) + Z(yb)) / 2, 0.5, 0.05, Z(yb) - Z(ya), 0, SNOW); B.box('snow', xb - 0.2, top, (Z(ya) + Z(yb)) / 2, 0.4, 0.04, Z(yb) - Z(ya), 0, SNOW); });
        }
      }

      // ---- the great stair: the parapet blocks between its flights (a lamp on each, a banner on its face), the side walls
      // and gateposts ----
      const banner = (x, z, yTop, len, face) => {
        // a navy banner with a white eight-pointed star, hanging from an iron bar
        const t = [Math.cos(face), 0, -Math.sin(face)], n = [Math.sin(face), 0, Math.cos(face)], w = 0.72;
        rod('iron', [x - t[0] * 0.5, yTop + 0.05, z - t[2] * 0.5], [x + t[0] * 0.5, yTop + 0.05, z + t[2] * 0.5], 0.03, IRON);
        soft(() => {
          const c = [x + n[0] * 0.02, yTop - len, z + n[2] * 0.02];
          onWall('cloth', c, t, w, len, [0.25, 0.45, 1.6], [0, 0, 1, 2]);
          const back = [x - n[0] * 0.02, yTop - len, z - n[2] * 0.02];
          B.quad('cloth', [back[0] + t[0] * w / 2, back[1], back[2] + t[2] * w / 2], [back[0] - t[0] * w / 2, back[1], back[2] - t[2] * w / 2], [back[0] - t[0] * w / 2, yTop, back[2] - t[2] * w / 2], [back[0] + t[0] * w / 2, yTop, back[2] + t[2] * w / 2], [0, 0, 1, 2], [0.25, 0.45, 1.6]);
          // the swallow-tail at the bottom
          B.tri('cloth', [c[0] - t[0] * w / 2, c[1], c[2] - t[2] * w / 2], [c[0], c[1] + 0.22, c[2]], [c[0] - t[0] * w / 2, c[1] - 0.18, c[2] - t[2] * w / 2], [[0, 0], [0.5, 0.2], [0, -0.2]], [0.25, 0.45, 1.6]);
          B.tri('cloth', [c[0] + t[0] * w / 2, c[1] - 0.18, c[2] + t[2] * w / 2], [c[0], c[1] + 0.22, c[2]], [c[0] + t[0] * w / 2, c[1], c[2] + t[2] * w / 2], [[1, -0.2], [0.5, 0.2], [1, 0]], [0.25, 0.45, 1.6]);
          // the star: eight points round a middle, pale
          const sc = [c[0] + n[0] * 0.015, c[1] + len * 0.58, c[2] + n[2] * 0.015], SC = [2.0, 2.6, 3.4];
          for (let i = 0; i < 8; i++) {
            const a0 = i / 8 * TAU, a1 = a0 + TAU / 16, a2 = a0 - TAU / 16, ro = i % 2 ? 0.17 : 0.25, ri = 0.06;
            const P2 = (a, r) => [sc[0] + t[0] * Math.cos(a) * r, sc[1] + Math.sin(a) * r, sc[2] + t[2] * Math.cos(a) * r];
            B.tri('cloth', P2(a2, ri), P2(a0, ro), P2(a1, ri), [[0, 0], [0.5, 1], [1, 0]], SC);
            B.tri('cloth', P2(a1, ri), P2(a0, ro), P2(a2, ri), [[0, 0], [0.5, 1], [1, 0]], SC);
          }
        });
      };
      {
        // the parapet blocks: stone from the lower square up to the upper square's level, a low parapet along their south edge
        for (const [x0, x1] of [[526, 612], [911, 982]]) {
          const a = X(x0), b = X(x1), z0 = Z(700), z1 = Z(790);
          B.box('stone', (a + b) / 2, -0.4, (z0 + z1) / 2, b - a, LU + 0.4, z1 - z0, 0, STONE_D, { noTop: true });
          B.box('stone', (a + b) / 2, LU, z1 - 0.25, b - a, 0.62, 0.5, 0, STONE);
          soft(() => B.box('snow', (a + b) / 2, LU + 0.62, z1 - 0.25, b - a + 0.08, 0.08, 0.6, 0, SNOW));
          B.box('stone', (a + b) / 2, LU - 0.3, z1 + 0.02, b - a + 0.1, 0.3, 0.16, 0, STONE);
        }
        banner(X(588), Z(790) + 0.06, LU - 0.2, 1.9, 0);
        banner(X(935), Z(790) + 0.06, LU - 0.2, 1.9, 0);
        // the flights' side walls, following the treads, and the gateposts at their heads and feet
        const side = (px, y0, y1, yTop) => {
          const n = 8;
          for (let i = 0; i < n; i++) {
            const ya = y0 + (y1 - y0) * i / n, yb = y0 + (y1 - y0) * (i + 1) / n, ym = (ya + yb) / 2, top = LU * (1 - lin(y0, yTop, ym)) + 0.85;
            B.box('stone', X(px), -0.4, (Z(ya) + Z(yb)) / 2, 0.62, top + 0.4, Z(yb) - Z(ya) + 0.02, 0, STONE_D);
            soft(() => B.box('snow', X(px), top, (Z(ya) + Z(yb)) / 2, 0.7, 0.07, Z(yb) - Z(ya) + 0.02, 0, SNOW));
          }
        };
        side(443, 700, 790, 790); side(533, 700, 790, 790); side(995, 700, 812, 812); side(1081, 700, 830, 830);
        for (const [px, py0, py1] of [[443, 695, 788], [533, 697, 788], [995, 699, 812], [1081, 697, 828]]) { post(px, py0, 1.5, LU); post(px, py1, 1.1, 0); }
        // the stair down to the frozen pass: its gateposts and its side walls going on down
        post(660, 972, 1.4, 0); post(870, 972, 1.4, 0);
        for (const px of [661, 869]) for (let i = 0; i < 6; i++) { const ya = 984 + i * 18, top = exitH(ya + 9) + 0.9; B.box('stone', X(px), -10, Z(ya + 9), 0.5, top + 10, 0.92, 0, STONE_D); soft(() => B.box('snow', X(px), top, Z(ya + 9), 0.58, 0.06, 0.92, 0, SNOW)); }
      }
      // the lamp pedestals on the south wall, and the south banners on their poles
      for (const px of [560, 971]) { B.box('stone', X(px), -0.5, Z(964), 1.2, 1.55, 2.4, 0, STONE); B.box('stone', X(px), 1.05, Z(964), 1.36, 0.1, 2.56, 0, STONE_D); }
      for (const px of [492, 1038]) { const x = X(px), z = Z(967); B.cyl('iron', x, 0, z, 0.06, 0.05, 4.0, 6); ball(x, 4.0, z, 0.08, 'iron'); rod('iron', [x, 3.75, z], [x, 3.75, z + 0.05], 0.02); banner(x, z + 0.08, 3.7, 2.4, 0); }
      // the chapel yard's banner, and the one east of the street
      for (const [px, py] of [[668, 343], [860, 342]]) { const x = X(px), z = Z(py), g = ter(px, py); B.cyl('iron', x, g, z, 0.06, 0.05, 4.2, 6); ball(x, g + 4.2, z, 0.08, 'iron'); banner(x, z + 0.08, g + 3.9, 2.3, 0); }

      // ---- the street's inlaid diamonds: pale stone set in the setts, a small star in each ----
      for (const [px, py] of [[765, 215], [765, 360], [766, 542], [765, 646], [1042, 846], [765, 906]]) {
        const x = X(px), z = Z(py), y = ter(px, py) + 0.02, r = 0.95, ri = 0.72;
        soft(() => {
          const D = (s) => [[x, y, z - s], [x + s, y, z], [x, y, z + s], [x - s, y, z]];
          const o = D(r), i = D(ri);
          for (let k = 0; k < 4; k++) { const a = o[k], b = o[(k + 1) % 4], c = i[(k + 1) % 4], d = i[k]; B.quad('stone', d, c, b, a, [0, 0, 1, 0.3], [1.5, 1.5, 1.6]); }
          for (let k = 0; k < 8; k++) { const a0 = k / 8 * TAU, ro = k % 2 ? 0.2 : 0.34; B.tri('stone', [x, y + 0.005, z], [x + Math.cos(a0 + 0.3) * 0.08, y + 0.005, z + Math.sin(a0 + 0.3) * 0.08], [x + Math.cos(a0) * ro, y + 0.005, z + Math.sin(a0) * ro], [[0, 0], [0.1, 0], [0.2, 0.2]], [1.7, 1.7, 1.8]); }
        });
      }

      // ---- Sorrel's shop front: the green awning, the window full of glowing bottles, the step along the front, pots ----
      {
        const zf = Z(584), x0 = X(386), x1 = X(494), g = LU;
        // the stone plinth along the front (between the walk and the wall), and the shop window's frame
        B.box('stone', (X(384) + X(576)) / 2, g - 0.3, zf + 0.45, X(576) - X(384), 0.42, 0.9, 0, STONE_D);
        onWall('wood', [(x0 + x1) / 2, g + 0.5, zf + 0.04], [1, 0, 0], x1 - x0 + 0.3, 2.0, [0.42, 0.34, 0.3], [0, 0, x1 - x0, 2]);
        onWall('glass', [(x0 + x1) / 2, g + 0.62, zf + 0.06], [1, 0, 0], x1 - x0 - 0.1, 1.75, [0.5, 0.36, 0.2]);
        // the bottles on three shelves, each glowing its own colour
        const COLS = [[0.5, 1.6, 0.7], [1.6, 0.9, 0.35], [0.6, 0.9, 1.7], [1.5, 0.5, 0.9], [1.5, 1.4, 0.5], [0.5, 1.4, 1.2]];
        for (let row = 0; row < 3; row++) {
          B.box('wood', (x0 + x1) / 2, g + 0.72 + row * 0.55, zf + 0.14, x1 - x0 - 0.2, 0.04, 0.2, 0, [0.5, 0.4, 0.34]);
          for (let bx = x0 + 0.25; bx < x1 - 0.15; bx += 0.26 + R() * 0.12) { const c = COLS[Math.floor(R() * COLS.length)], hh = 0.18 + R() * 0.16; soft(() => { B.box('glass', bx, g + 0.76 + row * 0.55, zf + 0.14, 0.11, hh, 0.11, 0, c); B.box('glass', bx, g + 0.76 + row * 0.55 + hh, zf + 0.14, 0.04, 0.08, 0.04, 0, [0.6, 0.5, 0.4]); }); }
        }
        // hanging herbs in the window
        for (let i = 0; i < 6; i++) soft(() => B.geom('leafBush', K.ico[i % 3], new T3.Matrix4().compose(new T3.Vector3(x0 + 0.35 + i * (x1 - x0 - 0.7) / 5, g + 2.15, zf + 0.22), new T3.Quaternion(), new T3.Vector3(0.12, 0.2, 0.1)), [0.7, 1.0, 0.7], 1));
        K.halo((x0 + x1) / 2, g + 1.4, zf + 0.6, 4.2, [0.9, 0.7, 0.4]);
        // the green awning, sloping out over the window, its scalloped edge
        const ya = g + 3.0, yb = g + 2.45, za = zf + 0.05, zb = zf + 1.35, n = 8, W = (x1 - x0 + 0.5) / n;
        soft(() => {
          for (let i = 0; i < n; i++) {
            const a = x0 - 0.25 + W * i, b = a + W, col = i % 2 ? [0.26, 1.0, 0.74] : [0.3, 1.15, 0.86];
            B.quad('cloth', [a, yb, zb], [b, yb, zb], [b, ya, za], [a, ya, za], [0, 0, W, 1.4], col);
            B.quad('cloth', [b, yb, zb], [a, yb, zb], [a, ya, za], [b, ya, za], [0, 0, W, 1.4], col);
            B.quad('cloth', [a, yb - 0.22, zb], [b, yb - 0.22, zb], [b, yb, zb], [a, yb, zb], [0, 0, W, 0.22], col);
            B.tri('cloth', [a, yb - 0.22, zb], [a + W / 2, yb - 0.36, zb], [b, yb - 0.22, zb], [[0, 0], [0.5, -0.2], [1, 0]], col);
          }
        });
        for (const xx of [x0 - 0.2, x1 + 0.2]) rod('iron', [xx, ya, za + 0.02], [xx, yb, zb], 0.02, IRON, 4);
        // pots of snowy herbs either side of the door, a barrel of brooms
        for (const [px, dz] of [[505, 0.5], [552, 0.55], [566, 0.7]]) { const x = X(px), z = zf + dz; B.cyl('stone', x, g + 0.1, z, 0.2, 0.26, 0.42, 9, [1.2, 0.8, 0.62]); soft(() => B.geom('leafBush', K.ico[px % 3], new T3.Matrix4().compose(new T3.Vector3(x, g + 0.68, z), new T3.Quaternion(), new T3.Vector3(0.3, 0.3, 0.3)), [0.75, 0.95, 0.8], 1)); snowLump(x, g + 0.86, z, 0.22, 0.08, 0.22); }
        // the cross gable over the shop: a gable wall standing up from the front with its own slate roof
        const gx0 = X(410), gx1 = X(500), gcx = (gx0 + gx1) / 2, E = LU + 6.0, gr = 2.6, gz0 = zf - 3.2, gz1 = zf + 0.02;
        B.tri('stone', [gx0, E, gz1], [gx1, E, gz1], [gcx, E + gr, gz1], [[0, E], [gx1 - gx0, E], [(gx1 - gx0) / 2, E + gr]], STONE);
        B.quad('roof', [gx0 - 0.35, E - 0.25, gz1 + 0.35], [gx0 - 0.35, E - 0.25, gz0], [gcx, E + gr + 0.05, gz0], [gcx, E + gr + 0.05, gz1 + 0.35], [0, 0, 3.5, 2.8]);
        B.quad('roof', [gx1 + 0.35, E - 0.25, gz0], [gx1 + 0.35, E - 0.25, gz1 + 0.35], [gcx, E + gr + 0.05, gz1 + 0.35], [gcx, E + gr + 0.05, gz0], [0, 0, 3.5, 2.8]);
        onWall('wood', [gcx, E + 0.25, gz1 + 0.03], [1, 0, 0], 1.0, 1.3, [0.42, 0.34, 0.3]); onWall('win', [gcx, E + 0.32, gz1 + 0.05], [1, 0, 0], 0.8, 1.1);
        K.halo(gcx, E + 0.9, gz1 + 0.3, 1.3, [1.0, 0.68, 0.36]);
        soft(() => { rod('snow', [gx0 - 0.35, E - 0.12, gz1 + 0.36], [gcx, E + gr + 0.18, gz1 + 0.36], 0.12, SNOW, 5); rod('snow', [gx1 + 0.35, E - 0.12, gz1 + 0.36], [gcx, E + gr + 0.18, gz1 + 0.36], 0.12, SNOW, 5); });
      }

      // ---- the Lantern House: its round hanging sign on a bracket, the crate stand, a lamp-lit bench ----
      {
        const x = X(946) - 0.1, z = Z(612), y = LU + 3.0;
        rod('iron', [x, y + 0.3, z], [x - 1.2, y + 0.3, z], 0.03, IRON); rod('iron', [x, y - 0.3, z], [x - 0.9, y + 0.3, z], 0.02, IRON);
        for (const dx of [-0.35, -1.0]) rod('iron', [x + dx, y + 0.3, z], [x + dx, y + 0.05, z], 0.012, IRON, 3);
        const disc = new T3.CylinderGeometry(0.42, 0.42, 0.06, 16); disc.rotateX(Math.PI / 2);
        B.geom('wood', disc, new T3.Matrix4().makeTranslation(x - 0.68, y - 0.42, z), [0.75, 0.6, 0.48], 1); disc.dispose();
        soft(() => { B.box('glass', x - 0.68, y - 0.5, z + 0.04, 0.16, 0.2, 0.02, 0, [1.4, 1.0, 0.5]); B.box('glass', x - 0.68, y - 0.5, z - 0.04, 0.16, 0.2, 0.02, 0, [1.4, 1.0, 0.5]); });
        snowLump(x - 0.68, y, z, 0.3, 0.07, 0.1);
      }

      // ---- snow on every roof's ridge and eaves, and icicles hanging from the eaves of the two lit houses ----
      for (const b of P.misthollow.buildings) {
        const [px0, py0, px1, py1] = b.fp, x0 = X(px0), x1 = X(px1), z0 = Z(py0), z1 = Z(py1), cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, w = x1 - x0, d = z1 - z0;
        const base = b.floor != null ? b.floor : gh((px0 + px1) / 2, py1 + 4), E = base + b.walls.reduce((s, l) => s + l.h, 0), rise = b.roof.rise, o = b.roof.over;
        soft(() => {
          if (b.roof.ridge === 'ns') {
            const s = rise / (w / 2), ye = E - o * s;
            B.box('snow', cx, E + rise + 0.02, cz, 0.42, 0.16, d + 2 * o + 0.1, 0, SNOW);
            for (const xe of [x0 - o, x1 + o]) B.box('snow', xe + (xe < cx ? 0.12 : -0.12), ye - 0.02, cz, 0.38, 0.14, d + 2 * o, 0, SNOW);
            for (const ze of [z0 - o, z1 + o]) { rod('snow', [x0 - o, ye + 0.08, ze], [cx, E + rise + 0.14, ze], 0.1, SNOW, 5); rod('snow', [x1 + o, ye + 0.08, ze], [cx, E + rise + 0.14, ze], 0.1, SNOW, 5); }
          } else {
            const s = rise / (d / 2), ye = E - o * s;
            B.box('snow', cx, E + rise + 0.02, cz, w + 2 * o + 0.1, 0.16, 0.42, 0, SNOW);
            for (const ze of [z0 - o, z1 + o]) B.box('snow', cx, ye - 0.02, ze + (ze < cz ? 0.12 : -0.12), w + 2 * o, 0.14, 0.38, 0, SNOW);
            for (const xe of [x0 - o, x1 + o]) { rod('snow', [xe, ye + 0.08, z0 - o], [xe, E + rise + 0.14, cz], 0.1, SNOW, 5); rod('snow', [xe, ye + 0.08, z1 + o], [xe, E + rise + 0.14, cz], 0.1, SNOW, 5); }
          }
          if (b.id === 'sorrel' || b.id.startsWith('inn')) {
            const s = rise / ((b.roof.ridge === 'ns' ? w : d) / 2), ye = E - o * s;
            const along = b.roof.ridge === 'ns' ? null : [x0 - o + 0.2, x1 + o - 0.2];
            if (along) for (let xx = along[0]; xx < along[1]; xx += 0.22 + R() * 0.3) { const L = 0.15 + R() * 0.45; B.cyl('ice', xx, ye - L, z1 + o - 0.05, 0.0, 0.035 + R() * 0.02, L, 4, [1.1, 1.15, 1.25]); }
          }
        });
      }

      // ---- the frozen trough by the west wall (a letter in a jar under the ice), its tub, and the crates ----
      {
        const x = X(386), z = Z(868), g = 0;
        B.box('stone', x, g, z, 1.5, 0.62, 0.7, 0, STONE_D);
        soft(() => B.box('ice', x, g + 0.5, z, 1.3, 0.08, 0.52, 0, [1.0, 1.08, 1.25]));
        soft(() => { B.box('glass', x + 0.25, g + 0.36, z, 0.12, 0.2, 0.12, 0, [0.6, 0.7, 0.9]); B.box('wood', x + 0.25, g + 0.44, z + 0.01, 0.15, 0.04, 0.09, 0.3, [1.6, 1.5, 1.3]); });
        B.cyl('wood', x - 1.0, g, z + 0.1, 0.32, 0.3, 0.55, 10, [0.72, 0.58, 0.48]); soft(() => B.cyl('ice', x - 1.0, g + 0.5, z + 0.1, 0.29, 0.29, 0.03, 10, [1, 1.08, 1.2]));
        snowLump(x - 0.4, g + 0.62, z, 0.5, 0.08, 0.3);
      }

      // ---- the wagon wheels against the south wall's outer face, either side of the stair down ----
      for (const px of [612, 918]) {
        const z = Z(984) + 0.25, x = X(px), g = ter(px, 1000);
        for (const [dx, tilt] of [[-0.35, 0.18], [0.45, -0.12]]) {
          const tor = new T3.TorusGeometry(0.62, 0.07, 5, 18); const m = new T3.Matrix4().compose(new T3.Vector3(x + dx, g + 0.66, z + 0.1), new T3.Quaternion().setFromEuler(new T3.Euler(tilt, 0, 0)), new T3.Vector3(1, 1, 1));
          B.geom('wood', tor, m, [0.6, 0.48, 0.4], 1); tor.dispose();
          for (let s = 0; s < 6; s++) { const a = s / 6 * Math.PI; rod('wood', [x + dx - Math.cos(a) * 0.6, g + 0.66 - Math.sin(a) * 0.6, z + 0.1], [x + dx + Math.cos(a) * 0.6, g + 0.66 + Math.sin(a) * 0.6, z + 0.1], 0.03, [0.6, 0.48, 0.4], 4); }
        }
      }

      // ---- the iron gate in the lower square's west wall, standing open onto the ledge ----
      {
        const ax = X(296), az = Z(901), bx = X(262), bz = Z(918);
        // one leaf swung open against the wall inside, its bars and its scrolled top
        soft(() => {
          const hx = bx, hz = bz, a = Math.atan2(az - bz, ax - bx) - 1.9, L = 1.25;
          const ex = hx + Math.cos(a) * L, ez = hz + Math.sin(a) * L;
          for (const y of [0.15, 1.0, 1.45]) rod('iron', [hx, y, hz], [ex, y, ez], 0.035, IRON, 4);
          for (let i = 0; i <= 8; i++) { const f = i / 8, x = hx + (ex - hx) * f, z = hz + (ez - hz) * f; rod('iron', [x, 0.05, z], [x, 1.62 + Math.sin(f * Math.PI) * 0.25, z], 0.024, IRON, 4); ball(x, 1.62 + Math.sin(f * Math.PI) * 0.25, z, 0.04, 'iron', null); }
        });
      }

      // ---- the hollow under the west terrace (the pocket past the gate): a niche in the wall with a candle, a stone seat ----
      {
        const x = X(332), z = Z(690), g = 0.2;
        B.box('stone', x + 1.3, g - 0.2, z, 1.4, 0.62, 0.5, 0, STONE); soft(() => B.box('snow', x + 1.3, g + 0.42, z, 1.4, 0.06, 0.5, 0, SNOW));
        onWall('winDark', [x, g + 1.4, Z(665) + 0.23], [1, 0, 0], 0.7, 0.9, [0.4, 0.4, 0.5]);
        soft(() => B.box('glass', x, g + 1.42, Z(665) + 0.33, 0.07, 0.14, 0.07, 0, [2.0, 1.4, 0.6]));
        K.halo(x, g + 1.6, Z(665) + 0.55, 0.9, [1.0, 0.7, 0.35]); K.light(332, 690, 70, 0.6, 'warm');
      }

      // ---- the cliffs' faces: snowy rock laid over the ground where it falls away round the town (a skirt following it down
      // from the cliff's lip), so the sheer drops read as rock, not smooth snow ----
      soft(() => {
        const RING = [6, 20, 38, 60, 88];
        for (let i = 0, j = ROCK.length - 1; i < ROCK.length; j = i++) {
          const [ax, ay] = ROCK[j], [bx, by] = ROCK[i], L = Math.hypot(bx - ax, by - ay);
          let nx = (by - ay) / L, ny = -(bx - ax) / L;
          if (inPoly(ROCK, (ax + bx) / 2 + nx * 4, (ay + by) / 2 + ny * 4)) { nx = -nx; ny = -ny; }
          const cleft = Math.max(ax, bx) < 240 && Math.min(ay, by) > 195 && Math.max(ay, by) < 280 && Math.min(ax, bx) > 100;   // the narrow cleft: shorter
          const DS = cleft ? RING.slice(0, 4) : RING, n = Math.max(1, Math.round(L / 30));
          for (let k = 0; k < n; k++) {
            const t0 = k / n, t1 = (k + 1) / n;
            for (let r = 0; r < DS.length - 1; r++) {
              const Pt = (t, d) => { const px = ax + (bx - ax) * t + nx * d, py = ay + (by - ay) * t + ny * d; return [X(px), ter(px, py) + 0.07, Z(py)]; };
              const q0 = Pt(t0, DS[r]), q1 = Pt(t1, DS[r]), q2 = Pt(t1, DS[r + 1]), q3 = Pt(t0, DS[r + 1]);
              const e1 = [q1[0] - q0[0], q1[1] - q0[1], q1[2] - q0[2]], e2 = [q3[0] - q0[0], q3[1] - q0[1], q3[2] - q0[2]], upn = e1[2] * e2[0] - e1[0] * e2[2];
              const u0 = L * 0.045 * t0, u1 = L * 0.045 * t1, v0 = DS[r] * 0.06, v1 = DS[r + 1] * 0.06;
              if (upn > 0) B.quad('cliff', q0, q1, q2, q3, [u0, v0, u1, v1], [1.02, 1.02, 1.08]); else B.quad('cliff', q1, q0, q3, q2, [u1, v0, u0, v1], [1.02, 1.02, 1.08]);
            }
          }
        }
      });

      // ---- the cliffs: outcrops of snowy rock down the mountainside, under the town's edges ----
      {
        const r = G.W3D.rand(211);
        B.solid = false;
        for (let i = 0; i < 300; i++) {
          const px = -300 + r() * 2150, py = -200 + r() * 1350;
          if (inPoly(ROCK, px, py)) continue;
          const d = edgeDist(ROCK, px, py); if (d < 34 || d > 330) continue;
          const h = ter(px, py); if (h < MIST - 0.5) continue;
          const s = 1.0 + r() * 1.6;
          B.geom('cliff', K.rockG[Math.floor(r() * 3)], new T3.Matrix4().compose(new T3.Vector3(X(px), h - s * 0.2, Z(py)), new T3.Quaternion().setFromEuler(new T3.Euler(r() * 0.25, r() * TAU, r() * 0.25)), new T3.Vector3(s * 1.2, s * 0.55, s)), [1.05, 1.05, 1.12], 1.6);
        }
        B.solid = true;
        // the mist: soft pale banks of it drifting along the cliffs' feet
        for (let i = 0; i < 70; i++) {
          const px = -300 + r() * 2150, py = -200 + r() * 1400;
          if (inPoly(ROCK, px, py) || edgeDist(ROCK, px, py) < 150) continue;
          K.halo(X(px), MIST + 1.5 + r() * 3.5, Z(py), 12 + r() * 14, [0.12, 0.13, 0.18]);
        }
      }

      // ---- the crag above the snowy shelf: rocks standing out of its snow ----
      soft(() => { const r = G.W3D.rand(97); for (let i = 0; i < 16; i++) { const px = 24 + r() * 250, py = 4 + r() * 44, h = ter(px, py), s = 0.6 + r() * 0.7;
        B.geom('cliff', K.rockG[i % 3], new T3.Matrix4().compose(new T3.Vector3(X(px), h - s * 0.25, Z(py)), new T3.Quaternion().setFromEuler(new T3.Euler(0.3, r() * TAU, 0)), new T3.Vector3(s * 1.3, s * 0.8, s)), [1.05, 1.05, 1.12], 1.6); } });

      // ---- snow drifts along the walls' feet and in the corners of the squares ----
      for (const [px, py, s] of [[712, 590, 1.0], [818, 590, 1.0], [626, 784, 0.9], [902, 786, 0.9], [444, 798, 0.8], [1086, 836, 0.8], [700, 360, 0.7], [826, 360, 0.7],
        [304, 600, 0.8], [596, 610, 0.7], [918, 610, 0.7], [1152, 668, 0.7], [236, 960, 0.8], [1296, 960, 0.8], [652, 962, 0.6], [878, 962, 0.6], [560, 334, 0.6], [690, 230, 0.7]]) {
        const x = X(px), z = Z(py), g = ter(px, py);
        snowLump(x, g - 0.05, z, 0.9 * s, 0.22 * s, 0.6 * s);
      }

      // ---- the little wooden lamp frame in the chapel yard's corner, by the bare tree ----
      {
        const x = X(652), z = Z(240), g = ter(652, 240);
        for (const dx of [-0.35, 0.35]) B.box('wood', x + dx, g, z, 0.1, 1.9, 0.1, 0, [0.6, 0.48, 0.42]);
        B.box('wood', x, g + 1.9, z, 0.95, 0.1, 0.16, 0, [0.6, 0.48, 0.42]); soft(() => B.box('snow', x, g + 2.0, z, 1.0, 0.06, 0.2, 0, SNOW));
        K.lantern(x, g + 1.3, z, null, 0.85, true); K.light(652, 250, 110, 0.9, 'warm');
      }
      ico0.dispose(); sph.dispose();
    },
  };
})(window);
