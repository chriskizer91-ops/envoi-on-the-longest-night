// moonwell.js: the dead Moonwell above Misthollow in 3D, the finale's place (a gate: the place only, no one in it), laid
// out on its painting (reference/art/walk/walk-misthollow-moonwell.png, 1536 x 1024) in the painting's own pixels, as
// src/game/maps.js keeps the walking map (MAPS.moonwell, unchanged). The texture ids are the pack's
// (texture-packs/north/moonwell/inventory.md).
// Heights are metres. The round court is 0. The great dead well stands on a dais of two low rings (0.18 and 0.36). Four
// steps go up north to the keep's door (0.9); in the north-west and north-east corners a stair climbs through an arch to
// a landing (2.0) and on up to a door (3.4). South, six steps go down between the two fire bowls to the street (-1.2),
// which slopes on down to Misthollow. The walled gardens under the court's south walls lie at -1.5: a short stair goes
// down into each from the yard behind its tower.
// The painting is near enough mirror-symmetric about x = 768, so much of the east half is the west half mirrored (mx).
(function (G) {
  'use strict';
  const P = G.W3D_PLACES = G.W3D_PLACES || {};
  const ss = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const rnd = (seed) => { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1e6) / 1e6; }; };
  const mx = (x) => 1536 - x;
  const mirror = (poly) => poly.map(([x, y]) => [mx(x), y]).reverse();
  const LOW = -1.5;   // the frozen gardens

  // ---- the dead well: its middle, its stone ring (radius, mouth), its rim's top, the dais's two rings and heights ----
  const WELL = { c: [769, 455], r: 4.1, mouth: 3.28, top: 2.32, dais: [7.0, 5.9], tier: [0.18, 0.36] };
  const daisH = (x, y) => { const r = Math.hypot((x - WELL.c[0]) * 0.04, (y - WELL.c[1]) * 0.05); return r < WELL.dais[1] ? WELL.tier[1] : r < WELL.dais[0] ? WELL.tier[0] : null; };

  // ---- the flights of steps (built in extra, walked by walk_h): [x0, y0 (top edge), x1, y1 (foot), height at the top,
  // height at the foot, treads]. Under each the ground is a ramp a little below the treads ----
  const FLIGHTS = [
    [705, 156, 831, 206, 0.9, 0, 4],                                                  // up to the keep's door
    [676, 778, 860, 848, 0, -1.2, 6],                                                 // down between the fire bowls to the street
    [224, 206, 292, 290, 2.0, 0, 10], [224, 60, 292, 123, 3.4, 2.0, 7],               // the north-west stair, below and above its arch
    [mx(292), 206, mx(224), 290, 2.0, 0, 10], [mx(292), 60, mx(224), 123, 3.4, 2.0, 7], // the north-east stair
    [119, 762, 171, 800, 0, LOW, 6], [1289, 762, 1335, 800, 0, LOW, 6],               // down into the frozen gardens
  ];
  // the ground under each flight, and a little round it (its walls stand on it)
  const BANDS = [[700, 837], [668, 868], [215, 301], [215, 301], [mx(301), mx(215)], [mx(301), mx(215)], [112, 178], [1282, 1342]];
  const treadAt = (x, y) => { for (const f of FLIGHTS) if (x >= f[0] && x <= f[2] && y >= f[1] && y <= f[3]) { const i = Math.min(f[6] - 1, Math.floor((y - f[1]) / (f[3] - f[1]) * f[6])); return f[4] - (f[4] - f[5]) * (i + 1) / (f[6] + 1); } return null; };
  const rampAt = (f, y) => { const t = (y - f[1]) / (f[3] - f[1]); return f[4] + (f[5] - f[4]) * t - 0.35 * Math.sin(Math.PI * t); };

  // ---- the ground's height under any point of the painting (metres) ----
  // the court's south edge, where the ground drops to the gardens behind the walls
  const edgeY = (x) => { const u = x < 768 ? x : mx(x); return u < 274 ? 768 : u < 437 ? 760 : 744; };
  // the street: court level above the steps, then sloping on down to Misthollow
  const fall = (y) => (y > 1100 ? 0.006 * (y - 1100) : 0) + (y > 1240 ? 0.045 * (y - 1240) : 0);   // past the painting the mountain falls away south
  const streetH = (y) => -1.2 - 0.45 * ss(848, 1100, y) - fall(y);
  const inStreet = (x, y) => (y > 841 && x >= 648 && x <= 888) || (y >= 744 && x >= 668 && x <= 868);
  // the corner stairs' landings
  const stairLanding = (y) => (y < 60 ? 3.4 : y < 123 ? null : y < 206 ? 2.0 : null);
  function ground(x, y) {
    if (Math.hypot((x - WELL.c[0]) * 0.04, (y - WELL.c[1]) * 0.05) < WELL.r - 0.1) return -9;   // down the dead well
    for (let i = 0; i < FLIGHTS.length; i++) { const f = FLIGHTS[i], b = BANDS[i]; if (x >= b[0] && x <= b[1] && y >= f[1] && y <= f[3]) return rampAt(f, y); }
    if (inStreet(x, y)) return y < 778 ? 0 : streetH(y);
    const u = x < 768 ? x : mx(x);
    if (u >= 215 && u <= 301 && y < 206) { const h = stairLanding(y); if (h != null) return h; }
    if (x > 700 && x < 837 && y < 156) return 0.9;                                  // the keep's door
    const e = edgeY(x);
    if (y > e) return LOW * ss(e, e + 8, y) - 0.4 * ss(958, 966, y) - fall(y);
    return 0;
  }

  // ---- the walls (engine `walls`): the court's south parapets, the yard walls over the gardens, the street's walls, the
  // gardens' south wall, the lanes' and stairs' walls, and the walls that close the painting's edges ----
  const WALLS = [
    { pts: [[437, 738], [636, 738]], h: 0.95, t: 0.45, tex: 'stone', drop: true },                 // the court's south parapet, west
    { pts: [[mx(636), 738], [mx(437), 738]], h: 0.95, t: 0.45, tex: 'stone', drop: true },         // and east
    { pts: [[-80, 764], [114, 764]], h: 0.95, t: 0.45, tex: 'stone', drop: true },                 // the west yard's wall over the garden
    { pts: [[176, 764], [275, 764]], h: 0.95, t: 0.45, tex: 'stone', drop: true },
    { pts: [[1261, 764], [1284, 764]], h: 0.95, t: 0.45, tex: 'stone', drop: true },               // the east yard's
    { pts: [[1340, 764], [1616, 764]], h: 0.95, t: 0.45, tex: 'stone', drop: true },
    // the garden stairs' inner sides (their outer sides are open to the strips of garden below the yard walls)
    { pts: [[176, 768], [176, 804]], h: 0.75, t: 0.4, tex: 'stone', drop: true },
    { pts: [[1284, 768], [1284, 804]], h: 0.75, t: 0.4, tex: 'stone', drop: true },
    { pts: [[672, 748], [672, 841], [652, 841], [652, 1110]], h: 0.9, t: 0.45, tex: 'stone', drop: true },          // the street's west wall
    { pts: [[mx(652), 1110], [mx(652), 841], [mx(672), 841], [mx(672), 748]], h: 0.9, t: 0.45, tex: 'stone', drop: true }, // and east
    { pts: [[105, 958], [652, 958]], h: 2.2, t: 0.5, tex: 'stone', drop: true },                   // the gardens' south walls
    { pts: [[mx(652), 958], [1345, 958]], h: 2.2, t: 0.5, tex: 'stone', drop: true },
    { pts: [[1500, 958], [1640, 958]], h: 2.2, t: 0.5, tex: 'stone', drop: true },
    { pts: [[218, 8], [218, 432]], h: 2.4, t: 0.4, tex: 'stone', drop: true },                    // the west lane's high wall, by its stair
    { pts: [[300, 8], [300, 284]], h: 1.3, t: 0.4, tex: 'stone', drop: true },                    // the west stair's east wall
    { pts: [[mx(218), 432], [mx(218), 8]], h: 2.4, t: 0.4, tex: 'stone', drop: true },            // the east lane's, and its stair's
    { pts: [[mx(300), 276], [mx(300), 8]], h: 1.3, t: 0.4, tex: 'stone', drop: true },
    { pts: [[4, 604], [4, 764]], h: 1.2, t: 0.45, tex: 'stone' },                                  // the west yard's end, at the painting's edge
    { pts: [[4, 768], [4, 805]], h: 2.2, t: 0.45, tex: 'stone', drop: true },                      // the west garden's end
    { pts: [[1532, 604], [1532, 764]], h: 1.2, t: 0.45, tex: 'stone' },                            // the east yard's and garden's ends
    { pts: [[1532, 768], [1532, 958]], h: 2.2, t: 0.45, tex: 'stone', drop: true },
  ];

  // ---- the pockets and the ground past the 2D walk that should be laid like it ----
  const W = (G.MAPS && G.MAPS.moonwell) ? G.MAPS.moonwell.walk : [];
  const WALK_ADD = [
    // the close behind the arch east of the keep (a pocket): through the arch, to the door at its end
    { poly: [[940, 214], [996, 214], [996, 12], [940, 12]], ground: 'cob' },
    // the frozen gardens (a pocket each side): the stair down from the yard behind each tower
    { poly: [[121, 748], [169, 748], [169, 808], [121, 808]], ground: 'cob' },
    { poly: [[1291, 748], [1333, 748], [1333, 808], [1291, 808]], ground: 'cob' },
    // the east yards behind the east tower, laid as the west ones are in the 2D walk (its yard and its way behind the tower)
    ...(W.length > 2 ? [{ poly: mirror(W[2]), ground: 'cob' }, { poly: mirror(W[1]), ground: 'cob' }] : []),
    // the east stair above the 2D walk, and both stairs' upper flights and top landings, to their doors
    { poly: [[mx(292), 232], [mx(232), 232], [mx(232), 12], [mx(292), 12]], ground: 'cob' },
    { poly: [[232, 130], [292, 130], [292, 12], [232, 12]], ground: 'cob' },
    // the north-west alley's last few steps to its door
    { poly: [[557, 30], [595, 30], [595, 12], [557, 12]], ground: 'cob' },
  ];

  P.moonwell = {
    id: 'moonwell', name: 'The dead Moonwell', painting: "art/walk/walk-misthollow-moonwell.avif", size: [1536, 1024],
    mapId: 'moonwell', paintingPng: 'reference/art/walk/walk-misthollow-moonwell.png',
    // the wall check (tools/walls-test.mjs): from the start, to the way out, every door, the well, the stairs and lanes,
    // and both pockets
    checks: { from: [775, 990], goals: [
      ['Misthollow (the street’s foot, south edge)', 768, 1018], ['the head of the steps, between the fire bowls', 768, 742],
      ['the dead Moonwell’s carved face', 769, 556], ['the keep’s door (north)', 768, 158], ['the north-west alley, through its arch', 576, 24],
      ['the north-west tower’s door', 420, 274], ['the north-east tower’s door', 1114, 272],
      ['the west stair’s landing, under its arch', 262, 140], ['the top of the west stair, at its door', 262, 20],
      ['the east lane', 1280, 380], ['the top of the east stair, at its door', 1274, 20],
      ['the yard behind the west tower', 330, 480], ['the west house’s door (the 2D way behind the tower)', 100, 640],
      ['the yard behind the east tower', 1200, 500], ['the east house’s door', 1452, 640],
      ['the close behind the east arch (a pocket)', 967, 30], ['the west frozen garden, by its well (a pocket)', 170, 880],
      ['the east frozen garden, by its well (a pocket)', 1250, 900], ['the gardens south of the court (west)', 560, 850]] },
    // no trees from the painting (its dark is stone and shadow, not woods): the frosted shrubs are placed by hand
    // (extraTrees); past the castle, snowy firs on the mountain
    treeGen: { dark: 2, keepOut: [[-250, -340, 1786, 1080]], roads: [[656, 1024, 880, 1500]],
      out: { density: 0.55, clump: 240, clear: 0.4, kinds: [0, 1, 0.12], size: [1.0, 1.5] } },
    // the ground's textures and how many metres each repeats over: the court's frosted setts, the street's, the gardens'
    // thin snow on dark earth (as the "grass", untinted)
    ground: { cob: 'moonwell_court_setts', grass: 'moonwell_garden_frost', dirt: 'shared_setts_frosted', pave: 'shared_setts_frosted', rep: [3.0, 3.6, 2.6, 1.9], grassTint: [1, 1, 1] },
    // every wall is the pale frosted castle block; slate under snow on the roofs; frosted planks for wood
    surfaces: { stone: 'shared_stone_wall_frosted', dry: 'shared_stone_wall_frosted', timber: 'shared_stone_wall_frosted', planks: 'bridge_planks_frost',
      roof: 'shared_roof_slate_snow', wood: 'bridge_planks_frost', deck: 'bridge_planks_frost', pave: 'shared_setts_frosted', cloth: 'shared_setts_frosted',
      soil: 'moonwell_garden_frost', rock: 'shared_rock_cliff_snowy', leaves: 'fir_foliage_frosted', firs: 'fir_foliage_snowladen', bark: 'shared_snow' },
    tints: { leaves: 0xc4d2ee, firs: 0xb4c4dc, bush: 0xb8c8e6, wood: 0x9a92a4 },
    // cold: a bluer sky light, a paler moon, blue mist, and only the two fire bowls warm
    night: { sky: [0.66, 0.69, 0.88], moon: [0.44, 0.48, 0.66], ground: [0.14, 0.14, 0.21], fog: [0.085, 0.095, 0.17], fogNear: 26, fogFar: 100 },
    extraMats: {
      snow: { tex: 'shared_snow', rep: 2.2, shade: 0.4 },
      banner: { tex: 'banner_cloth', tint: 0x2c3a78, side: 'double', shade: 0.3 },     // plain navy: no texture of its own yet
    },
    textures: [
      { id: 'moonwell_court_setts', made: "./../texture-packs/made/moonwell_court_setts.png", stand: "./../texture-packs/north/moonwell/stand-in/moonwell_court_setts.png" },
      { id: 'moonwell_garden_frost', made: "./../texture-packs/made/moonwell_garden_frost.png", stand: "./../texture-packs/north/moonwell/stand-in/moonwell_garden_frost.png" },
      { id: 'shared_stone_wall_frosted', made: "./../texture-packs/made/shared_stone_wall_frosted.png", stand: "./../texture-packs/north/moonwell/stand-in/shared_stone_wall_frosted.png" },
      { id: 'shared_roof_slate_snow', made: "./../texture-packs/made/shared_roof_slate_snow.png", stand: "./../texture-packs/north/shipyard/stand-in/shared_roof_slate_snow.png" },
      { id: 'shared_setts_frosted', made: "./../texture-packs/made/shared_setts_frosted.png", stand: "./../texture-packs/north/misthollow/stand-in/shared_setts_frosted.png" },
      { id: 'shared_snow', made: "./../texture-packs/made/shared_snow.png", stand: "./../texture-packs/north/frozen-pass/stand-in/shared_snow.png" },
      { id: 'shared_rock_cliff_snowy', made: "./../texture-packs/made/shared_rock_cliff_snowy.png", stand: "./../texture-packs/north/frozen-pass/stand-in/shared_rock_cliff_snowy.png" },
      { id: 'fir_foliage_frosted', made: "./../texture-packs/made/fir_foliage_frosted.png", stand: "./../texture-packs/wilds-north/northern-camp/stand-in/fir_foliage_frosted.png" },
      { id: 'fir_foliage_snowladen', made: "./../texture-packs/made/fir_foliage_snowladen.png", stand: "./../texture-packs/wilds-north/frozen-camp/stand-in/fir_foliage_snowladen.png" },
      { id: 'bridge_planks_frost', made: "./../texture-packs/made/bridge_planks_frost.png", stand: "./../texture-packs/wilds-north/northern-camp/stand-in/bridge_planks_frost.png" },
    ],
    ground_h: ground,
    // where Io's feet stand: a tread, the well's dais, or the ground
    walk_h(x, y) {
      const t = treadAt(x, y); if (t != null) return t;
      const d = daisH(x, y); if (d != null) return d;
      return ground(x, y);
    },
    water: [],
    lawns: [],
    start: [775, 990], startFace: Math.PI,
    // where she may roam: the painting, less the strips south of the gardens' walls (beyond them) and the little yards
    // behind the lanes' high walls (shut in), with the street open to its foot; the castle closes every other edge
    bounds: [[218, 3], [1318, 3], [1318, 432], [1533, 432], [1533, 956], [886, 956], [886, 1021], [650, 1021], [650, 956], [3, 956], [3, 432], [218, 432]],
    thicket: false,
    exits: [{ rect: [660, 1006, 876, 1024], label: 'Misthollow' }],
    walkAdd: WALK_ADD,
    // the ground laid by hand: the court's setts over the whole upper level, the street's setts down the street
    groundPatches: [
      { poly: [[219, 0], [1317, 0], [1317, 604], [1532, 604], [1532, 762], [1262, 762], [1262, 720], [1100, 735], [858, 740], [858, 778], [678, 778], [678, 740], [437, 735], [274, 720], [274, 762], [4, 762], [4, 604], [219, 604]], kind: 'cob' },
      { poly: [[656, 776], [880, 776], [880, 1500], [656, 1500]], kind: 'pave' },
    ],

    // ---- the houses round the court (slate roofs under snow; no window lit) ----
    buildings: [
      { id: 'nw-hall', name: 'the hall north-west of the court', fp: [-220, -60, 135, 322], walls: [{ t: 'stone', h: 7.5 }], roof: { ridge: 'ew', rise: 3.0, over: 0.4 },
        windows: [{ side: 's', x: 48, y: 2.8, w: 0.6, h: 1.5, dark: true }, { side: 's', x: 48, y: 5.4, w: 0.6, h: 1.2, dark: true }, { side: 'e', y: 60, z: 4.6, w: 0.6, h: 1.3, dark: true }, { side: 'e', y: 200, z: 4.6, w: 0.6, h: 1.3, dark: true }],
        chimneys: [{ x: 86, y: 250, w: 1.1, d: 1.1, h: 3.0 }] },
      { id: 'west-house', name: 'the west house', fp: [-170, 322, 150, 600], walls: [{ t: 'stone', h: 6.0 }], roof: { ridge: 'ns', rise: 4.2, over: 0.4 },
        doors: [{ side: 's', x: 100, w: 1.6, h: 2.7, arch: true, double: true, light: false }],
        windows: [{ side: 's', x: 100, y: 4.0, w: 0.7, h: 1.3, dark: true }, { side: 's', x: 30, y: 1.3, w: 0.6, h: 1.2, dark: true }] },
      { id: 'west-house-wing', fp: [150, 432, 221, 600], walls: [{ t: 'stone', h: 4.2 }], roof: { ridge: 'ew', rise: 1.8, over: 0.35 },
        windows: [{ side: 's', x: 186, y: 1.3, w: 0.6, h: 1.1, dark: true }] },
      { id: 'ne-hall', name: 'the hall north-east of the court', fp: [mx(135), -60, mx(-220), 322], walls: [{ t: 'stone', h: 7.5 }], roof: { ridge: 'ew', rise: 3.0, over: 0.4 },
        windows: [{ side: 's', x: mx(48), y: 2.8, w: 0.6, h: 1.5, dark: true }, { side: 's', x: mx(48), y: 5.4, w: 0.6, h: 1.2, dark: true }, { side: 'w', y: 60, z: 4.6, w: 0.6, h: 1.3, dark: true }, { side: 'w', y: 200, z: 4.6, w: 0.6, h: 1.3, dark: true }],
        chimneys: [{ x: mx(86), y: 250, w: 1.1, d: 1.1, h: 3.0 }] },
      { id: 'east-house', name: 'the east house', fp: [mx(150), 322, mx(-170), 600], walls: [{ t: 'stone', h: 6.0 }], roof: { ridge: 'ns', rise: 4.2, over: 0.4 },
        doors: [{ side: 's', x: 1452, w: 1.6, h: 2.7, arch: true, double: true, light: false }],
        windows: [{ side: 's', x: 1452, y: 4.0, w: 0.7, h: 1.3, dark: true }, { side: 's', x: 1510, y: 1.3, w: 0.6, h: 1.2, dark: true }] },
      { id: 'east-house-wing', fp: [mx(221), 432, mx(150), 600], walls: [{ t: 'stone', h: 4.2 }], roof: { ridge: 'ew', rise: 1.8, over: 0.35 },
        windows: [{ side: 's', x: mx(186), y: 1.3, w: 0.6, h: 1.1, dark: true }] },
      { id: 'sw-house', name: 'the house by the west garden', fp: [-45, 805, 105, 1085], floor: LOW, walls: [{ t: 'stone', h: 4.6 }], roof: { ridge: 'ns', rise: 3.2, over: 0.4 },
        doors: [{ side: 'e', y: 900, w: 1.1, h: 2.2, arch: true, light: false }], windows: [{ side: 's', x: 30, y: 4.4, w: 0.6, h: 1.0, dark: true }, { side: 'e', y: 840, z: 1.3, w: 0.6, h: 1.0, dark: true }],
        chimneys: [{ x: 40, y: 830, w: 0.9, d: 0.9, h: 2.4 }] },
      { id: 'se-house', name: 'the house by the east garden', fp: [1345, 800, 1500, 1085], floor: LOW, walls: [{ t: 'stone', h: 4.6 }], roof: { ridge: 'ns', rise: 3.2, over: 0.4 },
        doors: [{ side: 'w', y: 900, w: 1.1, h: 2.2, arch: true, light: false }], windows: [{ side: 's', x: 1422, y: 4.4, w: 0.6, h: 1.0, dark: true }, { side: 'w', y: 840, z: 1.3, w: 0.6, h: 1.0, dark: true }],
        chimneys: [{ x: 1448, y: 820, w: 0.9, d: 0.9, h: 2.4 }] },
      // past the painting: houses either side of the street going down to Misthollow
      { id: 'street-w', fp: [500, 1092, 632, 1250], walls: [{ t: 'stone', h: 5.0 }], roof: { ridge: 'ew', rise: 2.6, over: 0.4 },
        windows: [{ side: 'e', y: 1140, z: 1.4, w: 0.6, h: 1.1, dark: true }, { side: 'e', y: 1200, z: 1.4, w: 0.6, h: 1.1, dark: true }] },
      { id: 'street-e', fp: [904, 1092, 1036, 1250], walls: [{ t: 'stone', h: 5.0 }], roof: { ridge: 'ew', rise: 2.6, over: 0.4 },
        windows: [{ side: 'w', y: 1140, z: 1.4, w: 0.6, h: 1.1, dark: true }, { side: 'w', y: 1200, z: 1.4, w: 0.6, h: 1.1, dark: true }] },
    ],
    walls: WALLS,
    steps: [],
    lamps: [],
    jetties: [],
    // small things: the barrel in the west yard, crates by it and in the nook by the north-west tower, in the east yard
    props: [
      { k: 'barrel', at: [14, 616] }, { k: 'crates', at: [312, 212] }, { k: 'barrel', at: [1380, 612] }, { k: 'crates', at: [1515, 616] },
      { k: 'barrel', at: [mx(312), 214] },
    ],
    flowers: [],
    // the two fire bowls' warm light is added in extra
    lights: [],
    trees: 'moonwell',
    // the painting's frosted shrubs: [x, y, size, kind (2: bare), seed]
    extraTrees: [
      [240, 700, 0.8, 2, 11], [1268, 700, 0.8, 2, 12], [328, 262, 0.62, 2, 13], [mx(328), 262, 0.62, 2, 14], [518, 190, 0.78, 2, 15], [mx(518), 190, 0.78, 2, 16],
      [170, 128, 0.75, 2, 17], [178, 312, 0.7, 2, 18], [mx(170), 128, 0.75, 2, 19], [mx(178), 312, 0.7, 2, 20], [322, 160, 0.95, 2, 21], [mx(322), 160, 0.95, 2, 22],
      [596, 712, 0.5, 2, 23], [mx(596), 712, 0.5, 2, 24], [447, 645, 0.48, 2, 25], [1059, 633, 0.55, 2, 26],
      // the west garden and the garden south of the court
      [72, 786, 0.6, 2, 31], [250, 905, 0.8, 2, 33], [300, 880, 0.72, 2, 34], [352, 928, 0.6, 2, 35], [420, 872, 0.82, 2, 36],
      [478, 790, 0.7, 2, 37], [545, 862, 0.86, 2, 38], [610, 800, 0.6, 2, 39], [470, 930, 0.6, 2, 40], [628, 880, 0.5, 2, 41],
      // the east garden
      [1466, 786, 0.55, 2, 51], [1516, 880, 0.55, 2, 52], [1210, 905, 0.8, 2, 53], [1150, 930, 0.6, 2, 54], [1104, 872, 0.82, 2, 55], [1058, 790, 0.7, 2, 56],
      [992, 862, 0.86, 2, 57], [926, 800, 0.6, 2, 58], [1066, 930, 0.6, 2, 59], [908, 880, 0.5, 2, 60],
      // low ones along the gardens' walls
      [118, 938, 0.45, 2, 61], [230, 942, 0.42, 2, 62], [600, 944, 0.45, 2, 63], [640, 780, 0.42, 2, 64], [452, 762, 0.4, 2, 65], [1516, 940, 0.4, 2, 66], [1180, 944, 0.45, 2, 67], [1020, 944, 0.42, 2, 68], [896, 780, 0.42, 2, 69], [1084, 762, 0.4, 2, 70],
      // in the pot by the door at the end of the close behind the east arch
      [984, 20, 0.36, 2, 71],
    ],

    // ---- what the engine has no field for: the dead well and its dais, the keep, the towers, the halls past the court,
    // the arches, the stairs, the fire bowls, the gateposts, the pillars, planters, small wells, banners, snow on every
    // top, and the eclipsed moon ----
    extra(K) {
      const { B, X, Z, gh, TAU } = K;
      const r = rnd(9);
      const STONE = [1.1, 1.1, 1.18], DARK = [0.7, 0.7, 0.78], TRIM = [0.95, 0.95, 1.04], PALE = [1.0, 1.0, 1.1], SNOW = [0.7, 0.72, 0.82], DOOR = [0.55, 0.5, 0.58];
      const IRON = [0.85, 0.85, 0.95];
      const ryOf = (n) => Math.atan2(n[0], n[2]);
      // a flat piece facing out along n ([nx, 0, nz]), its bottom middle at (x, y, z), w wide and h tall
      const face = (k, x, y, z, n, w, h, col, uv) => {
        const t = [n[2], 0, -n[0]];
        B.quad(k, [x - t[0] * w / 2, y, z - t[2] * w / 2], [x + t[0] * w / 2, y, z + t[2] * w / 2], [x + t[0] * w / 2, y + h, z + t[2] * w / 2], [x - t[0] * w / 2, y + h, z - t[2] * w / 2], uv || [0, 0, 1, 1], col);
      };
      // a dark arched window (or a door) with its stone surround, on a wall facing n
      const windowAt = (x, y, z, n, w, h, door) => {
        face('stone', x + n[0] * 0.02, y - 0.12, z + n[2] * 0.02, n, w + 0.3, h + 0.26, DARK, [0, 0, w + 0.3, h + 0.26]);
        face(door ? (door === 2 ? 'doorArch2' : 'doorArch') : 'winDark', x + n[0] * 0.045, y, z + n[2] * 0.045, n, w, h, door ? DOOR : null);
        if (!door) B.box('stone', x + n[0] * 0.1, y - 0.14, z + n[2] * 0.1, w + 0.3, 0.1, 0.2, ryOf(n), TRIM);
      };
      const snowBox = (x, y, z, w, d, ry) => B.box('snow', x, y, z, w, 0.07, d, ry || 0, SNOW, { solid: false });   // the thing under it is solid enough
      // a row of merlons along a wall top from (ax, az) to (bx, bz) at height y
      const merlons = (ax, az, bx, bz, y, depth) => {
        const L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(L / 1.2)), ry = Math.atan2(-(bz - az), bx - ax);
        for (let i = 0; i < n; i++) { const f = (i + 0.5) / n, x = ax + (bx - ax) * f, z = az + (bz - az) * f; B.box('stone', x, y, z, 0.62, 0.62, depth || 0.5, ry, STONE); snowBox(x, y + 0.62, z, 0.68, (depth || 0.5) + 0.06, ry); }
      };
      // a block of the castle: stone from below the ground to `top`, merlons on the sides named, snow on its top
      const castle = (x0, y0, x1, y1, base, top, sides) => {
        const a = X(x0), b = X(x1), c = Z(y0), d = Z(y1);
        B.box('stone', (a + b) / 2, base, (c + d) / 2, b - a, top - base, d - c, 0, STONE);
        B.box('stone', (a + b) / 2, top - 0.9, (c + d) / 2, b - a + 0.3, 0.3, d - c + 0.3, 0, TRIM);
        B.quad('snow', [a, top + 0.02, d], [b, top + 0.02, d], [b, top + 0.02, c], [a, top + 0.02, c], [a, d, b, c], SNOW);
        if (sides.includes('s')) merlons(a + 0.3, d - 0.25, b - 0.3, d - 0.25, top);
        if (sides.includes('n')) merlons(a + 0.3, c + 0.25, b - 0.3, c + 0.25, top);
        if (sides.includes('w')) merlons(a + 0.25, c + 0.3, a + 0.25, d - 0.3, top);
        if (sides.includes('e')) merlons(b - 0.25, c + 0.3, b - 0.25, d - 0.3, top);
        K.shadeMarks.push(['rect', x0, y0, x1, y1, 0.6]);
      };
      // a round tower: walls from y0 to y1, a corbelled crenellated top, snow on its roof; windows at [angle, height]
      const tower = (px, py, rad, y0, y1, o) => {
        const x = X(px), z = Z(py), H = y1 - y0;
        B.cyl('stone', x, y0, z, rad, rad, H, 32, STONE, [TAU * rad, H], true);
        for (const by of o.bands || []) B.cyl('stone', x, by, z, rad + 0.1, rad + 0.1, 0.3, 32, TRIM, [TAU * rad, 0.3], true);
        if (o.plinth != null) { B.cyl('stone', x, y0, z, rad + 0.35, rad + 0.35, o.plinth - y0, 32, DARK, [TAU * rad, o.plinth - y0], true); B.cyl('stone', x, o.plinth, z, rad + 0.35, rad, 0.35, 32, TRIM, [TAU * rad, 0.35], true); }
        B.cyl('stone', x, y1 - 0.6, z, rad, rad + 0.32, 0.6, 32, TRIM, [TAU * rad, 0.6], true);
        B.cyl('stone', x, y1, z, rad + 0.32, rad + 0.32, 0.8, 32, STONE, [TAU * rad, 0.8], true);
        const roofG = new THREE.CircleGeometry(rad + 0.3, 24); roofG.rotateX(-Math.PI / 2); B.geom('snow', roofG, new THREE.Matrix4().makeTranslation(x, y1 + 0.5, z), SNOW, 2 * (rad + 0.3)); roofG.dispose();
        const N = Math.round(TAU * (rad + 0.32) / 1.25);
        for (let i = 0; i < N; i++) { const a = (i + 0.5) / N * TAU, R = rad + 0.1, mxx = x + Math.cos(a) * R, mzz = z + Math.sin(a) * R, ry = Math.atan2(-Math.cos(a), -Math.sin(a)); B.box('stone', mxx, y1 + 0.8, mzz, 0.62, 0.65, 0.45, ry, STONE); snowBox(mxx, y1 + 1.45, mzz, 0.68, 0.5, ry); }
        for (const [a, wy, ww, wh] of o.windows || []) windowAt(x + Math.cos(a) * (rad + 0.01), wy, z + Math.sin(a) * (rad + 0.01), [Math.cos(a), 0, Math.sin(a)], ww || 0.5, wh || 1.2);
        if (o.door) { const [a, dy] = o.door; windowAt(x + Math.cos(a) * (rad + 0.01), dy, z + Math.sin(a) * (rad + 0.01), [Math.cos(a), 0, Math.sin(a)], 1.3, 2.5, 1); }
        for (const [a, top, len] of o.banners || []) banner(x + Math.cos(a) * (rad + 0.1), top, z + Math.sin(a) * (rad + 0.1), [Math.cos(a), 0, Math.sin(a)], 1.4, len);
        K.addBlock(K.circlePx(px, py, rad + 0.06, 24));
        K.shadeMarks.push(['dot', px, py, (rad + 0.6) / 0.04, 0.55]);
      };
      // a small round turret with a pointed slate cap
      const turret = (px, py, rad, y0, y1) => {
        const x = X(px), z = Z(py);
        B.cyl('stone', x, y0, z, rad, rad, y1 - y0, 16, STONE, [TAU * rad, y1 - y0], true);
        B.cyl('stone', x, y1 - 0.3, z, rad + 0.12, rad + 0.12, 0.3, 16, TRIM, [TAU * rad, 0.3], true);
        B.cyl('roof', x, y1, z, rad + 0.18, 0.02, rad * 2.4, 16, [1, 1, 1], [TAU * rad, rad * 2.4], true);
        B.cyl('iron', x, y1 + rad * 2.4 - 0.05, z, 0.04, 0.0, 0.6, 5);
        windowAt(x, y1 - 2.4, z + rad + 0.01, [0, 0, 1], 0.36, 0.9);
        K.addBlock(K.circlePx(px, py, rad + 0.05, 14));
      };
      // a crescent moon, opening to the right before turning by `rot`, in the plane facing n
      const crescentG = (R) => {
        const d = 0.32, R2 = 0.8, hx = (1 - R2 * R2 + d * d) / (2 * d), hy = Math.sqrt(1 - hx * hx), a0 = Math.atan2(hy, hx), b0 = Math.atan2(hy, hx - d);
        const s = new THREE.Shape(); const N = 14;
        for (let i = 0; i <= N; i++) { const a = a0 + (TAU - 2 * a0) * i / N; const px = Math.cos(a) * R, py = Math.sin(a) * R; if (i) s.lineTo(px, py); else s.moveTo(px, py); }
        for (let i = 1; i < N; i++) { const a = (TAU - b0) - (TAU - 2 * b0) * i / N; s.lineTo((d + Math.cos(a) * R2) * R, Math.sin(a) * R2 * R); }
        return new THREE.ShapeGeometry(s, 2);
      };
      const placeFlat = (k, geo, x, y, z, n, rot, col) => {
        const t = new THREE.Vector3(n[2], 0, -n[0]), up = new THREE.Vector3(0, 1, 0), nn = new THREE.Vector3(n[0], 0, n[2]);
        const m4 = new THREE.Matrix4().makeBasis(t, up, nn).setPosition(x, y, z).multiply(new THREE.Matrix4().makeRotationZ(rot || 0));
        B.geom(k, geo, m4, col, 1); geo.dispose();
      };
      // a navy banner with a pale crescent, hanging from an iron rod on a wall facing n, from `top` down `len`
      function banner(x, top, z, n, w, len) {
        const t = [n[2], 0, -n[0]], cx = x + n[0] * 0.08, cz = z + n[2] * 0.08;
        const L = (u, y) => [cx + t[0] * u, y, cz + t[2] * u];
        B.box('iron', cx, top, cz, w + 0.35, 0.06, 0.06, ryOf(n), IRON);
        for (const u of [-w / 2 - 0.17, w / 2 + 0.17]) { const p = L(u, top); B.cyl('iron', p[0], top - 0.04, p[2], 0.05, 0.0, 0.14, 5); }
        B.quad('banner', L(-w / 2, top - len + 0.45), L(w / 2, top - len + 0.45), L(w / 2, top), L(-w / 2, top), [0, 0, 1, 1]);
        B.tri('banner', L(-w / 2, top - len + 0.45), L(0, top - len), L(w / 2, top - len + 0.45), [[0, 0], [0.5, 0], [1, 0]]);
        // the silver band near its top, and the crescent
        B.quad('snow', L(-w / 2 + 0.08, top - 0.42), L(w / 2 - 0.08, top - 0.42), L(w / 2 - 0.08, top - 0.3), L(-w / 2 + 0.08, top - 0.3), [0, 0, 1, 0.1], [0.85, 0.85, 0.95]);
        const c = L(0, top - len * 0.55); placeFlat('snow', crescentG(w * 0.26), c[0] + n[0] * 0.02, c[1], c[2] + n[2] * 0.02, n, -0.9, PALE);
        const c2 = L(0, top - len * 0.55); placeFlat('snow', crescentG(w * 0.26), c2[0] - n[0] * 0.02, c2[1], c2[2] - n[2] * 0.02, [-n[0], 0, -n[2]], -0.9 + Math.PI, PALE);
      }
      // a round stone planter, frosty earth in it (a shrub from extraTrees stands in it)
      const planter = (px, py, rr, hh) => {
        const x = X(px), z = Z(py), y = gh(px, py);
        B.cyl('stone', x, y - 0.2, z, rr * 0.92, rr, hh + 0.2, 16, STONE, [TAU * rr, hh]);
        B.cyl('stone', x, y + hh, z, rr + 0.08, rr + 0.08, 0.12, 16, TRIM, [TAU * rr, 0.12]);
        const sg = new THREE.CircleGeometry(rr - 0.05, 14); sg.rotateX(-Math.PI / 2); B.geom('soil', sg, new THREE.Matrix4().makeTranslation(x, y + hh + 0.06, z), [1.2, 1.2, 1.3], 2 * rr); sg.dispose();
        K.addBlock(K.circlePx(px, py, rr + 0.06, 12));
        K.shadeMarks.push(['dot', px, py, rr / 0.04 * 1.1, 0.6]);
      };
      // a square stone pillar with a cap, from y0 to y1; a stone finial and an iron spike on top if `fin`
      const pillar = (px, py, w, y0, y1, fin) => {
        const x = X(px), z = Z(py);
        B.box('stone', x, y0, z, w, y1 - y0, w, 0, STONE);
        B.box('stone', x, y1, z, w + 0.16, 0.16, w + 0.16, 0, TRIM, { solid: false }); snowBox(x, y1 + 0.16, z, w + 0.1, w + 0.1);
        if (fin) { B.box('stone', x, y1 + 0.16, z, w * 0.55, 0.35, w * 0.55, 0, STONE); const bg = new THREE.SphereGeometry(w * 0.32, 8, 6); B.geom('stone', bg, new THREE.Matrix4().makeTranslation(x, y1 + 0.51 + w * 0.28, z), TRIM, 1); bg.dispose(); B.cyl('iron', x, y1 + 0.5 + w * 0.55, z, 0.05, 0.0, 0.6, 5, IRON); }
      };

      // ==== the dead Moonwell ====
      {
        const x = X(WELL.c[0]), z = Z(WELL.c[1]), wr = WELL.r, top = WELL.top;
        // the dais: two low rings of setts (walked on)
        B.solid = false;
        B.cyl('stone', x, -0.25, z, WELL.dais[0] + 0.22, WELL.dais[0], 0.25 + WELL.tier[0], 64, [1.3, 1.3, 1.4], [TAU * WELL.dais[0], 0.4], true);
        B.cyl('stone', x, 0, z, WELL.dais[1] + 0.18, WELL.dais[1], WELL.tier[1], 56, [1.3, 1.3, 1.4], [TAU * WELL.dais[1], 0.36], true);
        for (const [ra, rb, y] of [[WELL.dais[1], WELL.dais[0], WELL.tier[0]], [wr, WELL.dais[1], WELL.tier[1]]]) {
          const rg = new THREE.RingGeometry(ra, rb, 64, 1); rg.rotateX(-Math.PI / 2);
          B.geom('pave', rg, new THREE.Matrix4().makeTranslation(x, y + 0.005, z), [0.95, 0.95, 1.02], 2 * rb); rg.dispose();
        }
        B.solid = true;
        // the stone ring: a plinth, the wall, the carved band, and a rim of big blocks round the black mouth
        B.cyl('stone', x, WELL.tier[1] - 0.1, z, wr + 0.22, wr + 0.22, 0.42, 48, DARK, [TAU * wr, 0.42], true);
        B.cyl('stone', x, WELL.tier[1] + 0.32, z, wr + 0.22, wr, 0.14, 48, TRIM, [TAU * wr, 0.14], true);
        B.cyl('stone', x, WELL.tier[1], z, wr, wr, top - WELL.tier[1] - 0.3, 48, STONE, [TAU * wr, top], true);
        B.cyl('stone', x, 1.0, z, wr + 0.03, wr + 0.03, 0.85, 48, [0.4, 0.42, 0.56], [TAU * wr, 0.85], true);
        B.cyl('stone', x, 0.92, z, wr + 0.07, wr + 0.07, 0.08, 48, TRIM, [TAU * wr, 0.08], true);
        B.cyl('stone', x, 1.85, z, wr + 0.07, wr + 0.07, 0.08, 48, TRIM, [TAU * wr, 0.08], true);
        const NB = 22;
        for (let i = 0; i < NB; i++) {
          const a = (i + 0.5) / NB * TAU, rm = (WELL.mouth + wr + 0.12) / 2, bx = x + Math.cos(a) * rm, bz = z + Math.sin(a) * rm, ry = Math.atan2(-Math.cos(a), -Math.sin(a));
          const k = 0.92 + r() * 0.16, sag = r() * 0.04;
          B.box('stone', bx, top - 0.32 - sag, bz, TAU * rm / NB - 0.05, 0.32, wr + 0.12 - WELL.mouth, ry, [k, k, k * 1.05]);
          if (r() < 0.55) snowBox(bx + Math.cos(a) * 0.1, top - sag, bz + Math.sin(a) * 0.1, TAU * rm / NB * (0.4 + r() * 0.5), 0.5, ry);
        }
        // the shaft: stone going down into black, and a black floor far below
        const shaft = new THREE.CylinderGeometry(WELL.mouth, WELL.mouth, 8.6, 36, 6, true); shaft.scale(-1, 1, 1);
        B.geom('stone', shaft, new THREE.Matrix4().makeTranslation(x, top - 4.3, z), (v) => { const k = Math.pow(clamp01((v.y + 0.6) / 2.9), 1.6) * 0.62; return [k, k, k * 1.1]; }, [TAU * WELL.mouth, 8.6]); shaft.dispose();
        const floor = new THREE.CircleGeometry(WELL.mouth + 0.02, 28); floor.rotateX(-Math.PI / 2);
        B.geom('hills', floor, new THREE.Matrix4().makeTranslation(x, top - 8.5, z), [0.004, 0.004, 0.012], 1); floor.dispose();
        // dead: no water and no light; only the faintest cold shimmer far down
        K.halo(x, top - 6.0, z, 3.2, [0.07, 0.11, 0.22]);
        // the carved band: crescent moons and moths with spread wings, between little ribs, all round
        const moth = (R) => {
          const sh = [];
          for (const [cx, cy, rx, ry, rot] of [[-0.42, 0.12, 0.42, 0.24, 0.32], [0.42, 0.12, 0.42, 0.24, -0.32], [-0.3, -0.2, 0.26, 0.17, -0.5], [0.3, -0.2, 0.26, 0.17, 0.5], [0, -0.02, 0.07, 0.36, 0], [0, 0.32, 0.08, 0.08, 0]]) {
            const s = new THREE.Shape(); s.absellipse(cx * R, cy * R, rx * R, ry * R, 0, TAU, false, rot); sh.push(s);
          }
          return new THREE.ShapeGeometry(sh, 8);
        };
        const NM = 10, BR = wr + 0.05, BY = 1.42;
        for (let i = 0; i < NM; i++) {
          const a = Math.PI / 2 + i / NM * TAU, n = [Math.cos(a), 0, Math.sin(a)], px = x + n[0] * BR, pz = z + n[2] * BR;
          if (i === 0 || i === NM / 2) placeFlat('snow', moth(1.05), px, BY, pz, n, 0, PALE);
          else placeFlat('snow', crescentG(0.3), px, BY, pz, n, i % 2 ? 0.4 : Math.PI - 0.4, PALE);
          const ar = a + Math.PI / NM, rx = x + Math.cos(ar) * (wr + 0.04), rz = z + Math.sin(ar) * (wr + 0.04);
          B.box('stone', rx, 1.0, rz, 0.12, 0.85, 0.1, Math.atan2(-Math.sin(ar), Math.cos(ar)), TRIM);
        }
        // the twisted iron frame: a post on the rim each side, east and west, gnarled arms meeting over the mouth, a ring
        // hanging from where they meet, chains hanging from the arms
        B.solid = false;
        const postX = [x - (WELL.mouth + 0.45), x + (WELL.mouth + 0.45)], PT = top + 3.4;
        for (const pxx of postX) {
          B.box('iron', pxx, top - 0.05, z, 0.46, 0.22, 0.46, 0, IRON);
          B.box('iron', pxx, top, z, 0.24, 3.45, 0.24, 0, IRON);
          for (const cy of [top + 0.6, top + 2.3, PT - 0.2]) B.box('iron', pxx, cy, z, 0.34, 0.14, 0.34, 0, IRON);
          B.cyl('iron', pxx, PT + 0.05, z, 0.16, 0.0, 0.7, 6, IRON);
          const kn = new THREE.SphereGeometry(0.12, 6, 4); B.geom('iron', kn, new THREE.Matrix4().makeTranslation(pxx, PT + 0.15, z), IRON, 1); kn.dispose();
          B.box('iron', pxx, PT + 0.28, z, 0.5, 0.05, 0.05, 0, IRON);
          snowBox(pxx, PT - 0.06, z, 0.3, 0.3);
        }
        const apex = new THREE.Vector3(x, PT + 1.1, z);
        for (const sgn of [-1, 1]) {
          const px0 = x + sgn * (WELL.mouth + 0.45);
          const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(px0, PT - 0.15, z), new THREE.Vector3(px0 - sgn * 0.6, PT + 0.55, z + 0.12), new THREE.Vector3(x + sgn * 2.1, PT + 0.85, z - 0.1),
            new THREE.Vector3(x + sgn * 1.0, PT + 1.0, z + 0.08), apex]);
          const tube = new THREE.TubeGeometry(curve, 22, 0.085, 6, false); B.geom('iron', tube, new THREE.Matrix4(), IRON, 1); tube.dispose();
          const tube2 = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(curve.getPoints(10).map((p, i) => p.clone().add(new THREE.Vector3(0, Math.sin(i * 1.7) * 0.08, Math.cos(i * 1.7) * 0.08)))), 22, 0.04, 5, false);
          B.geom('iron', tube2, new THREE.Matrix4(), IRON, 1); tube2.dispose();
          // a broken twig off the arm, and a hook curling out at the post
          const tw = curve.getPoint(0.45), tg = new THREE.CylinderGeometry(0.015, 0.05, 0.7, 4); tg.translate(0, 0.35, 0);
          B.geom('iron', tg, new THREE.Matrix4().compose(tw, new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(sgn * 0.6, 1, 0.3).normalize()), new THREE.Vector3(1, 1, 1)), IRON, 1); tg.dispose();
          const hook = new THREE.TorusGeometry(0.2, 0.035, 4, 10, Math.PI * 1.3); B.geom('iron', hook, new THREE.Matrix4().makeTranslation(px0 + sgn * 0.25, PT + 0.45, z), IRON, 1); hook.dispose();
          // the chain, hanging from the arm
          const hp = curve.getPoint(0.32);
          for (let i = 0; i < 9; i++) { const lk = new THREE.TorusGeometry(0.075, 0.018, 4, 8); B.geom('iron', lk, new THREE.Matrix4().makeTranslation(hp.x, hp.y - 0.12 - i * 0.15, hp.z).multiply(new THREE.Matrix4().makeRotationY(i % 2 ? Math.PI / 2 : 0)).multiply(new THREE.Matrix4().makeRotationZ(Math.PI / 2)), IRON, 1); lk.dispose(); }
          snowBox(x + sgn * 2.1, PT + 0.9, z, 0.6, 0.16);
        }
        const kg = new THREE.SphereGeometry(0.18, 7, 5); B.geom('iron', kg, new THREE.Matrix4().makeTranslation(apex.x, apex.y, apex.z), IRON, 1); kg.dispose();
        const up = new THREE.CylinderGeometry(0.02, 0.06, 0.6, 4); up.translate(0, 0.3, 0); B.geom('iron', up, new THREE.Matrix4().compose(apex, new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0.35, 1, 0).normalize()), new THREE.Vector3(1, 1, 1)), IRON, 1); up.dispose();
        const lnk = new THREE.TorusGeometry(0.08, 0.02, 4, 8); B.geom('iron', lnk, new THREE.Matrix4().makeTranslation(apex.x, apex.y - 0.25, apex.z).multiply(new THREE.Matrix4().makeRotationY(Math.PI / 2)), IRON, 1); lnk.dispose();
        const ring = new THREE.TorusGeometry(0.34, 0.05, 6, 20); B.geom('iron', ring, new THREE.Matrix4().makeTranslation(apex.x, apex.y - 0.68, apex.z), IRON, 1); ring.dispose();
        B.solid = true;
        // its broken fittings: fallen rim blocks and a broken iron bar round its foot, inside the walking map's block
        const BLK = (G.MAPS && G.MAPS.moonwell) ? G.MAPS.moonwell.block[0] : null;
        const inBlk = (px, py) => { if (!BLK) return true; let c = false; for (let i = 0, j = BLK.length - 1; i < BLK.length; j = i++) { const [xi, yi] = BLK[i], [xj, yj] = BLK[j]; if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) c = !c; } return c; };
        B.solid = false;   // inside the walking map's block
        for (const [a, d, s] of [[-1.57, 5.6, 1], [-1.2, 5.2, 0.9], [-2.0, 5.5, 1.05], [-0.62, 4.75, 0.8], [-2.55, 4.75, 0.85], [0.18, 4.55, 0.7], [2.95, 4.55, 0.7], [-0.95, 6.2, 0.75],
          [-2.25, 6.1, 0.8], [-1.75, 6.5, 0.6], [-1.35, 6.4, 0.65], [2.55, 4.5, 0.55], [0.55, 4.45, 0.55]]) {
          const px = WELL.c[0] + Math.cos(a) * d / 0.04, py = WELL.c[1] + Math.sin(a) * d / 0.05;
          if (!inBlk(px, py) || !inBlk(px + 10, py) || !inBlk(px - 10, py) || !inBlk(px, py + 8) || !inBlk(px, py - 8)) continue;
          const bg = new THREE.BoxGeometry(0.95 * s, 0.32 * s, 0.75 * s); const k = 0.85 + r() * 0.15, y0 = daisH(px, py) || 0;
          B.geom('stone', bg, new THREE.Matrix4().compose(new THREE.Vector3(X(px), y0 + 0.12 * s, Z(py)), new THREE.Quaternion().setFromEuler(new THREE.Euler((r() - 0.5) * 0.5, r() * TAU, (r() - 0.5) * 0.6)), new THREE.Vector3(1, 1, 1)), [k, k, k * 1.05], 1); bg.dispose();
          if (r() < 0.5) snowBox(X(px), y0 + 0.28 * s, Z(py), 0.5 * s, 0.4 * s, r() * TAU);
        }
        B.solid = true;
        { const bar = new THREE.CylinderGeometry(0.05, 0.05, 2.2, 5); bar.rotateZ(Math.PI / 2 - 0.08); B.geom('iron', bar, new THREE.Matrix4().compose(new THREE.Vector3(x + 0.6, WELL.tier[1] + 0.06, z - 4.9), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0.4, 0)), new THREE.Vector3(1, 1, 1)), IRON, 1); bar.dispose(); }
        // the rubble of its old outer fittings, heaped along the edge of the ground the walking map keeps clear round it,
        // so that ground looks as closed as it is; stumps of broken iron posts among it
        if (BLK) {
          let post = 0; B.solid = false;   // all inside the walking map's block, which keeps her off it
          for (let i = 0, j = BLK.length - 1; i < BLK.length; j = i++) {
            const [ax, ay] = BLK[j], [bx, by] = BLK[i], L = Math.hypot((bx - ax) * 0.04, (by - ay) * 0.05);
            for (let s = 0.2; s < L; s += 0.55 + r() * 0.25) {
              let px = ax + (bx - ax) * s / L, py = ay + (by - ay) * s / L;
              const dx = WELL.c[0] - px, dy = WELL.c[1] - py, dl = Math.hypot(dx * 0.04, dy * 0.05);
              const sz = 0.28 + r() * 0.26, m = 1.4 * sz, inset = m + 0.1;
              px += dx * inset / dl; py += dy * inset / dl;   // in from the edge toward the well, by its own size
              const rr = Math.hypot((px - WELL.c[0]) * 0.04, (py - WELL.c[1]) * 0.05);
              if (rr < wr + 0.3 || !inBlk(px, py) || !inBlk(px + m / 0.04, py) || !inBlk(px - m / 0.04, py) || !inBlk(px, py + m / 0.05) || !inBlk(px, py - m / 0.05)) continue;
              const y0 = daisH(px, py) || 0, k = 0.8 + r() * 0.25;
              if (r() < 0.7) B.geom('stone', K.rockG[Math.floor(r() * 3)], new THREE.Matrix4().compose(new THREE.Vector3(X(px), y0 + sz * 0.25, Z(py)), new THREE.Quaternion().setFromEuler(new THREE.Euler((r() - 0.5) * 0.4, r() * TAU, 0)), new THREE.Vector3(sz * 1.3, sz, sz * 1.1)), [k * 1.05, k * 1.05, k * 1.12], 1.4);
              else { const bg = new THREE.BoxGeometry(sz * 2.2, sz * 0.8, sz * 1.4); B.geom('stone', bg, new THREE.Matrix4().compose(new THREE.Vector3(X(px), y0 + sz * 0.3, Z(py)), new THREE.Quaternion().setFromEuler(new THREE.Euler((r() - 0.5) * 0.6, r() * TAU, (r() - 0.5) * 0.7)), new THREE.Vector3(1, 1, 1)), [k, k, k * 1.05], 1); bg.dispose(); }
              if (r() < 0.35) snowBox(X(px), y0 + sz * 0.62, Z(py), sz * 0.9, sz * 0.7, r() * TAU);
              if (++post % 9 === 4) { B.box('iron', X(px) + 0.1, y0, Z(py) - 0.1, 0.12, 0.5 + r() * 0.5, 0.12, r(), IRON); }
            }
          }
          B.solid = true;
        }
        K.shadeMarks.push(['ring', WELL.c[0], WELL.c[1], (wr - 0.1) / 0.04, (wr + 0.5) / 0.04, 0.6]);
      }

      // ==== the keep in the north: its door at the top of the steps, the wings either side, banners ====
      castle(600, -300, 936, 152, -0.3, 17, 'swe');
      castle(624, 152, 704, 194, -0.3, 12.5, 'swe');
      castle(832, 152, 912, 194, -0.3, 12.5, 'swe');
      {
        const fz = Z(152), n = [0, 0, 1];
        // the door: a tall pointed double door in a carved surround, a crescent over it
        const dx = X(768);
        B.box('stone', dx - 1.55, 0.9, fz + 0.12, 0.42, 4.2, 0.26, 0, TRIM); B.box('stone', dx + 1.55, 0.9, fz + 0.12, 0.42, 4.2, 0.26, 0, TRIM);
        B.tri('stone', [dx - 1.76, 5.1, fz + 0.26], [dx + 1.76, 5.1, fz + 0.26], [dx, 6.5, fz + 0.26], [[0, 0], [3.5, 0], [1.75, 1.4]], TRIM);
        B.box('stone', dx, 5.0, fz + 0.12, 3.5, 0.16, 0.26, 0, TRIM);
        face('stone', dx, 0.9, fz + 0.02, n, 3.0, 4.1, DARK, [0, 0, 3, 4.1]);
        face('doorArch2', dx, 0.9, fz + 0.05, n, 2.5, 3.9, DOOR);
        placeFlat('snow', crescentG(0.28), dx, 5.65, fz + 0.28, n, -0.9, PALE);
        windowAt(dx, 8.4, fz + 0.01, n, 0.8, 1.8);
        for (const wx of [650, 886]) windowAt(X(wx), 13.6, fz + 0.01, n, 0.6, 1.5);
        // the wings: an arched window each, and the banners
        for (const [wx, bx] of [[664, 655], [872, 881]]) { windowAt(X(wx), 7.6, Z(194) + 0.01, n, 0.55, 1.4); banner(X(bx), 11.6, Z(194), n, 1.5, 4.6); }
        // the round buttresses where the wings meet the door's bay, full height
        for (const bx of [696, 840]) { B.cyl('stone', X(bx), -0.3, Z(154), 0.4, 0.4, 16.6, 12, STONE, [2.6, 16.6]); K.addBlock(K.circlePx(bx, 154, 0.42, 10)); }
        // the stone posts with finials either side of the steps
        for (const bx of [692, 844]) pillar(bx, 193, 0.5, -0.3, 2.3, true);
        // clay pots and a little barrel by the keep's corners
        for (const [px, py] of [[617, 176], [mx(617), 176]]) {
          B.cyl('stone', X(px), 0, Z(py), 0.22, 0.3, 0.55, 10, [1.15, 0.82, 0.68], [1.6, 0.55]); B.cyl('stone', X(px), 0.55, Z(py), 0.32, 0.32, 0.07, 10, [1.0, 0.72, 0.6], [1.6, 0.07]);
          const sg = new THREE.CircleGeometry(0.28, 9); sg.rotateX(-Math.PI / 2); B.geom('snow', sg, new THREE.Matrix4().makeTranslation(X(px), 0.6, Z(py)), [1, 1, 1], 1); sg.dispose();
          K.addBlock(K.circlePx(px, py, 0.34, 8));
        }
      }
      // the steps up to the keep's door, and every other flight: a block of stone per tread, from well down
      for (const f of FLIGHTS) {
        const [x0, y0, x1, y1, , , n] = f, xa = X(x0), xb = X(x1);
        for (let i = 0; i < n; i++) {
          const ya = y0 + (y1 - y0) * i / n, yb = y0 + (y1 - y0) * (i + 1) / n, top = f[4] - (f[4] - f[5]) * (i + 1) / (n + 1), za = Z(ya), zb = Z(yb);
          B.box('stone', (xa + xb) / 2, Math.min(f[4], f[5]) - 0.7, (za + zb) / 2, xb - xa, top - Math.min(f[4], f[5]) + 0.7, zb - za + 0.02, 0, [0.92, 0.92, 0.98]);
        }
      }

      // ==== the halls and the stair-heads past the court's north edge (closed doors at the ends of the ways north) ====
      castle(300, -300, 538, 128, -0.3, 12.5, 'swe'); castle(mx(538), -300, mx(300), 128, -0.3, 12.5, 'swe');
      castle(538, -300, 600, 6, -0.3, 11, 's'); castle(mx(600), -300, mx(538), 6, -0.3, 11, 's');
      castle(135, -220, 300, 6, -0.3, 9.6, 'swe'); castle(mx(300), -220, mx(135), 6, -0.3, 9.6, 'swe');
      for (const [px, fy] of [[576, 0], [mx(576), 0], [258, 3.4], [mx(258), 3.4]]) { windowAt(X(px), fy, Z(6) + 0.01, [0, 0, 1], 1.3, 2.5, 1); windowAt(X(px), fy + 4.2, Z(6) + 0.01, [0, 0, 1], 0.5, 1.2); }
      for (const [px, py] of [[420, 128], [mx(420), 128]]) windowAt(X(px), 9.0, Z(py) + 0.01, [0, 0, 1], 0.6, 1.4);

      // ==== the towers ====
      const S = Math.PI / 2, Nn = -Math.PI / 2, E = 0, Wd = Math.PI;
      tower(422, 205, 2.9, -0.3, 17.5, { bands: [6.2, 11.6], door: [S, 0], windows: [[S, 4.0], [S, 8.6, 0.5, 1.3], [S - 0.9, 7.4], [S + 0.9, 7.4], [S, 13.2], [E, 10]] });
      tower(mx(422), 205, 2.9, -0.3, 17.5, { bands: [6.2, 11.6], door: [S, 0], windows: [[S, 4.0], [S, 8.6, 0.5, 1.3], [S - 0.9, 7.4], [S + 0.9, 7.4], [S, 13.2], [Wd, 10]] });
      for (const px of [355, mx(355)]) tower(px, 778, 3.3, -2.9, 12.6, { plinth: -0.35, bands: [5.4], windows: [[S, 2.0], [S - 0.75, 5.6], [S + 0.75, 5.6], [Nn, 3.0], [Nn - 0.8, 6.6], [Nn + 0.8, 6.6], [px < 768 ? Wd : E, 8]],
        banners: [[S, 10.6, 4.4], [Nn, 10.6, 4.4]] });
      turret(266, 590, 0.85, -0.3, 7.6); turret(mx(266), 590, 0.85, -0.3, 7.6);
      turret(128, 120, 0.95, -0.3, 11.2); turret(mx(128), 120, 0.95, -0.3, 11.2);

      // ==== the arches: over the west and east stairs' landings, and over the ways north beside the keep ====
      const arch = (xa, oa, ob, xb, py, floor, open, top) => {
        const z = Z(py), d = 0.62;
        B.box('stone', (X(xa) + X(oa)) / 2, floor - 3, z, X(oa) - X(xa), top - floor + 3, d, 0, STONE);
        B.box('stone', (X(ob) + X(xb)) / 2, floor - 3, z, X(xb) - X(ob), top - floor + 3, d, 0, STONE);
        const a = X(oa), b = X(ob), m = (a + b) / 2, sp = floor + open, ap = sp + (b - a) * 0.45;
        B.box('stone', m, ap, z, b - a, top - ap, d, 0, STONE);
        for (const zf of [z + d / 2, z - d / 2]) {
          const fw = zf > z ? 1 : -1;
          const q = (p) => [p[0], p[1], zf + fw * 0.005];
          if (fw > 0) { B.tri('stone', q([a, sp, 0]), q([m, ap, 0]), q([a, ap, 0]), [[0, 0], [1, 1], [0, 1]], STONE); B.tri('stone', q([m, ap, 0]), q([b, sp, 0]), q([b, ap, 0]), [[0, 1], [1, 0], [1, 1]], STONE); }
          else { B.tri('stone', q([a, ap, 0]), q([m, ap, 0]), q([a, sp, 0]), [[0, 1], [1, 1], [0, 0]], STONE); B.tri('stone', q([b, ap, 0]), q([b, sp, 0]), q([m, ap, 0]), [[1, 1], [1, 0], [0, 1]], STONE); }
        }
        // the soffit under the point, and the arch's trim of voussoirs on its south face
        B.quad('stone', [a, sp, z + d / 2], [a, sp, z - d / 2], [m, ap, z - d / 2], [m, ap, z + d / 2], [0, 0, d, 1], DARK);
        B.quad('stone', [m, ap, z + d / 2], [m, ap, z - d / 2], [b, sp, z - d / 2], [b, sp, z + d / 2], [0, 0, d, 1], DARK);
        for (let i = 0; i <= 6; i++) { const t = i / 6, px_ = t < 0.5 ? a + (m - a) * t * 2 : m + (b - m) * (t - 0.5) * 2, py_ = t < 0.5 ? sp + (ap - sp) * t * 2 : ap - (ap - sp) * (t - 0.5) * 2; B.box('stone', px_, py_ - 0.1, z + d / 2 + 0.06, 0.32, 0.36, 0.12, 0, TRIM); }
        B.box('stone', (X(xa) + X(xb)) / 2, top, z, X(xb) - X(xa) + 0.2, 0.2, d + 0.2, 0, TRIM); snowBox((X(xa) + X(xb)) / 2, top + 0.2, z, X(xb) - X(xa) + 0.1, d + 0.1);
      };
      arch(214, 232, 292, 302, 183, 2.0, 2.9, 7.2); arch(mx(302), mx(292), mx(232), mx(214), 183, 2.0, 2.9, 7.2);
      arch(536, 555, 594, 604, 94, 0, 3.0, 6.4); arch(mx(604), mx(594), mx(555), mx(536), 94, 0, 3.0, 6.4);

      // ==== the head of the steps: the two fire bowls on their pillars (the only warm light), the iron gateposts ====
      for (const px of [650, mx(650)]) {
        const x = X(px), z = Z(748);
        B.box('stone', x, -2.9, z, 1.3, 2.9 + 1.5, 1.0, 0, STONE); B.box('stone', x, 1.5, z, 1.46, 0.16, 1.16, 0, TRIM);
        B.cyl('iron', x, 1.66, z, 0.22, 0.12, 0.25, 8, IRON); B.cyl('iron', x, 1.88, z, 0.16, 0.5, 0.36, 12, IRON); B.cyl('iron', x, 2.22, z, 0.5, 0.53, 0.05, 12, IRON, null, true);
        B.cyl('glass', x, 2.12, z, 0.42, 0.36, 0.12, 9, [1.6, 0.6, 0.22]);
        for (const [ox, oz, rr, hh, c] of [[0, 0, 0.3, 0.75, [2.0, 0.85, 0.3]], [0.13, 0.06, 0.17, 0.55, [2.2, 1.1, 0.4]], [-0.12, -0.05, 0.16, 0.5, [2.2, 1.1, 0.4]], [0.02, 0.1, 0.12, 0.42, [2.4, 1.6, 0.7]], [-0.05, -0.12, 0.13, 0.38, [2.3, 1.3, 0.5]]]) B.cyl('glass', x + ox, 2.2, z + oz, rr, 0.0, hh, 6, c);
        K.halo(x, 2.55, z, 2.6, [1.0, 0.55, 0.24]); K.halo(x, 2.3, z, 1.2, [1.0, 0.75, 0.4]);
        K.light(px, 742, 160, 1.15, 'forge'); K.lamps3d.push({ x, y: 2.5, z, c: 0xff8a40, k: 1.9 });
      }
      for (const px of [560, mx(560)]) {
        const x = X(px), z = Z(724);
        B.box('stone', x, -0.1, z, 0.5, 0.5, 0.44, 0, STONE); snowBox(x, 0.4, z, 0.46, 0.4);
        B.box('iron', x, 0.4, z, 0.2, 3.7, 0.2, 0, IRON);
        for (const cy of [1.0, 2.6, 3.9]) B.box('iron', x, cy, z, 0.3, 0.1, 0.3, 0, IRON);
        B.cyl('iron', x, 4.1, z, 0.13, 0.0, 0.62, 6, IRON); B.box('iron', x, 4.3, z, 0.46, 0.05, 0.05, 0, IRON); B.box('iron', x, 4.3, z, 0.05, 0.05, 0.46, 0, IRON);
      }

      // ==== the east bastion by the court's south-east corner: a little walled bed with a shrub in it ====
      {
        const a = X(1020), b = X(1098), c = Z(614), d = Z(662), H = 1.25;
        B.box('stone', (a + b) / 2, -0.2, (c + d) / 2, b - a, H + 0.2, d - c, 0, STONE);
        B.box('stone', (a + b) / 2, H, (c + d) / 2, b - a + 0.2, 0.14, d - c + 0.2, 0, TRIM);
        const sg = new THREE.PlaneGeometry(b - a - 0.4, d - c - 0.4); sg.rotateX(-Math.PI / 2); B.geom('soil', sg, new THREE.Matrix4().makeTranslation((a + b) / 2, H + 0.1, (c + d) / 2), [1.2, 1.2, 1.3], 1); sg.dispose();
        merlons(a + 0.3, d - 0.2, b - 0.3, d - 0.2, H + 0.14, 0.4); merlons(a + 0.2, c + 0.3, a + 0.2, d - 0.3, H + 0.14, 0.4); merlons(b - 0.2, c + 0.3, b - 0.2, d - 0.3, H + 0.14, 0.4);
        windowAt((a + b) / 2, 0.2, d + 0.01, [0, 0, 1], 0.45, 0.9);
      }

      // ==== the close behind the arch east of the keep (a pocket): a frozen stone trough against the keep's wall, an iron
      // fire bowl long gone cold, crates under snow, a frosted shrub in a pot by the door ====
      {
        const tx = X(943), tz0 = Z(36), tz1 = Z(82), ty = gh(943, 60);
        B.box('stone', tx, ty - 0.1, (tz0 + tz1) / 2, 0.55, 0.75, tz1 - tz0, 0, STONE);
        B.quad('snow', [tx - 0.2, ty + 0.55, tz1 - 0.08], [tx + 0.2, ty + 0.55, tz1 - 0.08], [tx + 0.2, ty + 0.55, tz0 + 0.08], [tx - 0.2, ty + 0.55, tz0 + 0.08], [0, 0, 0.4, tz1 - tz0], [0.72, 0.8, 1.0]);
        K.addBlock([[936, 34], [950, 34], [950, 84], [936, 84]]);
        const bx = X(986), bz = Z(48);
        B.box('stone', bx, -0.1, bz, 0.5, 0.9, 0.5, 0, STONE); B.box('stone', bx, 0.8, bz, 0.62, 0.1, 0.62, 0, TRIM, { solid: false });
        B.cyl('iron', bx, 0.9, bz, 0.12, 0.08, 0.16, 8, IRON); B.cyl('iron', bx, 1.04, bz, 0.1, 0.36, 0.28, 10, IRON);
        const ash = new THREE.CircleGeometry(0.32, 10); ash.rotateX(-Math.PI / 2); B.geom('snow', ash, new THREE.Matrix4().makeTranslation(bx, 1.26, bz), [0.6, 0.62, 0.7], 1); ash.dispose();
        K.addBlock(K.circlePx(986, 48, 0.36, 8));
        B.box('wood', X(988), 0, Z(76), 0.7, 0.55, 0.6, 0.15, [0.8, 0.7, 0.66]); B.box('wood', X(986), 0.55, Z(77), 0.55, 0.42, 0.48, -0.2, [0.75, 0.66, 0.62]); snowBox(X(986), 0.97, Z(77), 0.5, 0.42, -0.2);
        K.addBlock([[978, 69], [998, 69], [998, 84], [978, 84]]);
        B.cyl('stone', X(984), 0, Z(20), 0.24, 0.3, 0.5, 10, [1.15, 0.82, 0.68], [1.6, 0.5]); K.addBlock(K.circlePx(984, 20, 0.32, 8));
      }

      // ==== the walls' tops: snow along every wall, and square pillars on the yard walls and the gardens' south walls ====
      for (const wl of WALLS) for (let k = 1; k < wl.pts.length; k++) {
        const [ax, ay] = wl.pts[k - 1], [bx, by] = wl.pts[k], A = [X(ax), Z(ay)], Bp = [X(bx), Z(by)], dx = Bp[0] - A[0], dz = Bp[1] - A[1], L = Math.hypot(dx, dz), ry = Math.atan2(-dz, dx), n = Math.max(1, Math.ceil(L / 1.6));
        for (let i = 0; i < n; i++) { const f = (i + 0.5) / n, xx = A[0] + dx * f, zz = A[1] + dz * f, g = gh((ax + (bx - ax) * f), (ay + (by - ay) * f)); B.box('stone', xx, g + wl.h, zz, L / n + 0.03, 0.1, wl.t + 0.12, ry, TRIM, { solid: false }); snowBox(xx, g + wl.h + 0.1, zz, L / n + 0.02, wl.t + 0.08, ry); }
      }
      for (const [px, py, y0, y1] of [[4, 764, -0.4, 1.35], [114, 764, -0.4, 1.35], [176, 764, -0.4, 1.35], [274, 764, -0.4, 1.35], [mx(4), 764, -0.4, 1.35], [1284, 764, -0.4, 1.35], [1340, 764, -0.4, 1.35], [mx(274), 764, -0.4, 1.35],
        [135, 958, LOW - 0.3, 1.0], [285, 958, LOW - 0.3, 1.0], [400, 958, LOW - 0.3, 1.0], [520, 958, LOW - 0.3, 1.0], [mx(285), 958, LOW - 0.3, 1.0], [mx(400), 958, LOW - 0.3, 1.0], [mx(520), 958, LOW - 0.3, 1.0], [1250, 958, LOW - 0.3, 1.0],
        [437, 738, -0.4, 1.3], [mx(437), 738, -0.4, 1.3], [672, 839, -1.4, 0.0], [mx(672), 839, -1.4, 0.0]]) pillar(px, py, 0.62, y0, y1);
      // the tall stone gateposts with finials by the street, down in the gardens
      for (const px of [590, mx(590)]) { pillar(px, 940, 0.9, LOW - 0.3, LOW + 3.4, true); K.addBlock([[px - 12, 930], [px + 12, 930], [px + 12, 950], [px - 12, 950]]); }
      // the banners on the gardens' south walls (facing the town)
      for (const px of [478, mx(478)]) banner(X(px), LOW + 2.05, Z(958) + 0.26, [0, 0, 1], 1.15, 2.4);

      // ==== planters with frosted shrubs, the gardens' small wells, a stone bench in the west garden ====
      for (const [px, py, rr] of [[240, 700, 0.72], [1268, 700, 0.72], [328, 262, 0.68], [mx(328), 262, 0.68], [518, 190, 0.6], [mx(518), 190, 0.6], [170, 128, 0.62], [178, 312, 0.6], [mx(170), 128, 0.62], [mx(178), 312, 0.6]]) planter(px, py, rr, 0.62);
      for (const [px, py] of [[221, 832], [1306, 872]]) {
        const x = X(px), z = Z(py), y = gh(px, py);
        B.cyl('stone', x, y - 0.3, z, 1.0, 1.0, 1.25, 18, STONE, [6.3, 1.25], true);
        const rg = new THREE.RingGeometry(0.72, 1.06, 18, 1); rg.rotateX(-Math.PI / 2); B.geom('stone', rg, new THREE.Matrix4().makeTranslation(x, y + 0.95, z), TRIM, 2); rg.dispose();
        const inner = new THREE.CylinderGeometry(0.72, 0.72, 1.2, 18, 1, true); inner.scale(-1, 1, 1); B.geom('stone', inner, new THREE.Matrix4().makeTranslation(x, y + 0.35, z), [0.4, 0.4, 0.48], [4.5, 1.2]); inner.dispose();
        const ice = new THREE.CircleGeometry(0.73, 18); ice.rotateX(-Math.PI / 2); B.geom('snow', ice, new THREE.Matrix4().makeTranslation(x, y + 0.7, z), [0.75, 0.82, 1.0], 1.5); ice.dispose();
        B.box('wood', x, y + 0.95, z, 2.3, 0.12, 0.16, 0.6, [0.8, 0.72, 0.7]); B.box('wood', x, y + 1.07, z, 2.3, 0.12, 0.16, -0.7, [0.8, 0.72, 0.7]);
        K.addBlock(K.circlePx(px, py, 1.05, 14)); K.shadeMarks.push(['dot', px, py, 30, 0.6]);
      }
      { const x = X(170), z = Z(920), y = gh(170, 920); for (const dx of [-0.6, 0.6]) B.box('stone', x + dx, y - 0.1, z, 0.25, 0.5, 0.42, 0, STONE); B.box('stone', x, y + 0.4, z, 1.7, 0.12, 0.5, 0, TRIM); snowBox(x, y + 0.52, z, 1.2, 0.36); }

      // ==== the eclipsed moon: a dark disc over the sky's own moon, so only its edge burns round it ====
      {
        B.solid = false;
        const md = new THREE.Vector3(-0.45, 0.42, -0.79).normalize(), dg = new THREE.CircleGeometry(15.3, 40);
        B.geom('hills', dg, new THREE.Matrix4().compose(md.clone().multiplyScalar(495), new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), md.clone().negate()), new THREE.Vector3(1, 1, 1)), [0.004, 0.004, 0.012], 1);
        dg.dispose();
        B.solid = true;
      }
    },
  };
})(window);
