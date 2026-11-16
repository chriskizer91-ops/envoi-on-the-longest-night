// thornwood.js: the Thornwood in 3D. Its painting (reference/art/walk/walk-thornwood.png, 1536 x 1024) is the middle,
// laid out in the painting's own pixels as src/game/maps.js keeps the walking map: the road over the old bridge and its
// lantern, the stream in its rocky ravine, the moon stone in its clearing, the painting's big dead thorn trees and
// boulders. Round it the wood goes on, one painting's width and height each way (Chris, November 16: wild places are wide
// open fields in heavy fog, with pockets to find): rolling ground, clumps of bare thorny trees with clearings between,
// trails out to the two ways on (Wickhollow in the west, Bogmire in the east), and places to find along them: a ring of
// standing stones and the stepping stones over the stream in the north, a wayside shrine in the north-east, a fallen thorn
// tree in the east, ruined walls in the south, a still pool in the south-west. The two keepsakes lie in hidden hollows.
// Where Io can walk: the walking map's own walk and block areas, unchanged, plus all the open ground inside open.bounds,
// less the stream, the pools and everything solid (every trunk, boulder and wall; the bridge's parapets; the stream's
// rocky banks).
// The texture ids are the texture pack's (texture-packs/wickhollow/thornwood/inventory.md).
// Heights are metres: the road and the painting's woods are 0; the stream runs in a little ravine, falling on its way
// south (-1.75 in the north, -4 past the painting's foot); the bridge's deck rises 0.7 over it; the moon stone's clearing
// is a low mossy rise; past the painting the ground rolls (about 2 m up and down), gentler along the trails.
(function (G) {
  'use strict';
  const P = G.W3D_PLACES = G.W3D_PLACES || {};
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ss = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const SX = 0.04, SZ = 0.05;

  // ---- the stream: its west and east banks, [y, x] down the painting (on the painting traced from it; past it, it
  // winds on north and south out of the open ground) ----
  const LB = [[-1100, 360], [-900, 380], [-700, 408], [-560, 420], [-400, 362], [-200, 312], [0, 300], [50, 305], [100, 312], [150, 322], [200, 326],
    [245, 332], [290, 310], [350, 300], [400, 295], [450, 290], [500, 292], [550, 296], [600, 302], [650, 318], [700, 330], [750, 335], [800, 330],
    [850, 340], [900, 345], [950, 358], [1000, 384], [1024, 396], [1150, 420], [1300, 432], [1450, 410], [1600, 382], [1750, 340], [1900, 302], [2100, 280]];
  const RB = [[-1100, 520], [-900, 532], [-700, 560], [-560, 574], [-400, 522], [-200, 482], [0, 445], [50, 455], [100, 450], [150, 460], [200, 470],
    [250, 470], [300, 462], [350, 468], [400, 470], [450, 480], [500, 485], [550, 480], [600, 470], [650, 470], [700, 482], [750, 490], [800, 490],
    [850, 515], [900, 540], [950, 560], [1000, 580], [1024, 590], [1150, 620], [1300, 640], [1450, 628], [1600, 600], [1750, 556], [1900, 520], [2100, 500]];
  const bank = (L, y) => { if (y <= L[0][0]) return L[0][1]; for (let i = 1; i < L.length; i++) if (y <= L[i][0]) { const [ya, xa] = L[i - 1], [yb, xb] = L[i]; return xa + (xb - xa) * (y - ya) / (yb - ya); } return L[L.length - 1][1]; };
  const STREAM = LB.map(([y, x]) => [x, y]).concat(RB.slice().reverse().map(([y, x]) => [x, y]));
  // the valley falls gently past the painting's foot; the stream's level: the little fall north of the bridge, the falls
  // under it, the falls by the painting's south edge and one more further south
  const valley = (y) => -0.6 * ss(1024, 2100, y);
  const level = (y) => valley(y) - 1.75 - 0.45 * ss(228, 262, y) - 0.55 * ss(598, 632, y) - 0.55 * ss(858, 902, y) - 0.3 * ss(1430, 1470, y);

  // ---- the trails past the painting: centre lines in pixels, and their half widths (m). The painting's own paths are the
  // walking map's walk areas; these carry them on to the ways out and to the places to find. ----
  const TRAILS = [
    { id: 'west', w: 1.0, pts: [[30, 431], [-80, 428], [-250, 400], [-420, 422], [-600, 468], [-780, 445], [-950, 388], [-1142, 366]] },
    { id: 'east', w: 1.0, pts: [[1520, 533], [1700, 560], [1880, 522], [2050, 472], [2200, 520], [2380, 598], [2560, 580], [2712, 548]] },
    { id: 'north', w: 0.7, pts: [[745, 134], [700, 40], [705, -100], [760, -260], [748, -400], [760, -455]] },
    { id: 'ford-east', w: 0.7, pts: [[650, -560], [578, -560]] },
    { id: 'ford-west', w: 0.7, pts: [[414, -560], [260, -480], [100, -300], [-100, -100], [-250, 150], [-292, 395]] },
    { id: 'east-track', w: 0.6, pts: [[1462, 400], [1600, 380], [1800, 300], [1985, 240]] },
    { id: 'shrine', w: 0.7, pts: [[2050, 472], [2010, 330], [1985, 240], [2020, 40], [2100, -120], [2150, -300], [2180, -405]] },
    { id: 'ruins', w: 0.7, pts: [[1880, 522], [1860, 760], [1750, 1050], [1560, 1300], [1380, 1460], [1310, 1505]] },
    { id: 'pool', w: 0.6, pts: [[-420, 422], [-470, 680], [-400, 950], [-420, 1195]] },
  ];
  // a band either side of a centre line, `hw` metres from it
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

  // ---- the places to find, and the two hollows where the keepsakes lie ----
  const RING = { c: [760, -560], r: 5.0 };                      // the ring of standing stones
  const FORD = { y: -560, xs: [431, 453, 475, 497, 519, 541, 563] };   // the stepping stones over the stream
  const SHRINE = { at: [2180, -470] };                          // the wayside shrine, facing south down its trail
  const FALLEN = { root: [2075, 212], top: [2310, 136] };       // the fallen thorn tree beside the shrine's trail
  const RUIN = [                                                // the ruined walls: [from, to, height (m)]
    [[1180, 1525], [1290, 1530], 1.5], [[1335, 1532], [1430, 1545], 1.25], [[1430, 1545], [1436, 1610], 1.1], [[1440, 1640], [1446, 1695], 0.6],
    [[1180, 1525], [1176, 1600], 0.85]];
  const POOL = { c: [-420, 1330], rx: 140, ry: 95 };             // the still pool
  const FROG = { c: [1482, 72], r: 3.2, gap: 0 };               // the frog-ring's hollow: a ring of boulders, way in on the east
  const BROOCH = { c: [1392, 905], r: 2.8, gap: Math.PI / 2 };  // the brooch's hollow: a ring of thorn, way in on the south
  const ellipse = (c, rx, ry, n, wob) => Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2, k = 1 + (wob || 0) * Math.sin(a * 3 + 1.3) * Math.cos(a * 2); return [Math.round(c[0] + Math.cos(a) * rx * k), Math.round(c[1] + Math.sin(a) * ry * k)]; });
  const POOLP = ellipse(POOL.c, POOL.rx, POOL.ry, 22, 0.12);
  const FROGP = ellipse([FROG.c[0] - 4, FROG.c[1] - 12], 1.15 / SX, 0.95 / SZ, 14, 0.1);

  // ---- the ground ----
  const W3D = () => G.W3D;
  let poolRim = null;
  const roll = (x, y, t) => (W3D().vnoise(x / 420, y / 420) - 0.5) * 4.5 + t * (W3D().vnoise(x / 140, y / 140) - 0.5) * 1.3;
  // the ground's height under any point (metres)
  function ground(x, y) {
    const d = Math.max(bank(LB, y) - x, x - bank(RB, y));                          // pixels out from the stream (less than 0 in it)
    let h = valley(y) - 1.3 * (1 - ss(0, 55, d));                                    // its ravine
    h += 0.25 * (1 - ss(0.4, 1, Math.hypot((x - 1010) / 160, (y - 290) / 120)));    // the moon stone's mossy rise
    // rolling ground past the painting: none on it and along the stream's valley, gentler along the trails
    const out = Math.hypot(Math.max(0, -x, x - 1536), Math.max(0, -y, y - 1024)), k = ss(0, 300, out) * ss(110, 400, d);
    if (k > 0) h += k * roll(x, y, ss(25, 90, trailDist(x, y)));
    // the pool lies in a level hollow
    const pd = Math.hypot((x - POOL.c[0]) * SX, (y - POOL.c[1]) * SZ);
    if (pd < 12) { if (poolRim == null) poolRim = valley(POOL.c[1]) + roll(POOL.c[0], POOL.c[1], 1); h += (poolRim - h) * (1 - ss(7, 12, pd)); }
    return h;
  }
  const poolLevel = () => { if (poolRim == null) ground(POOL.c[0], POOL.c[1]); return poolRim - 0.45; };
  const frogLevel = () => ground(FROG.c[0], FROG.c[1]) - 0.3;

  // the walking map's own walk areas (for keeping things off them), with their boxes
  let WB = null;
  const mapWalk = () => WB || (WB = (((G.MAPS || {}).thornwood || { walk: [] }).walk).map((p) => { let a = 1e9, b = 1e9, c = -1e9, e = -1e9; for (const [x, y] of p) { a = Math.min(a, x); b = Math.min(b, y); c = Math.max(c, x); e = Math.max(e, y); } return { p, b: [a, b, c, e] }; }));

  // ---- the old bridge: one stone arch over the stream, its deck rising 0.7 m between low parapets. In the painting its
  // deck bows north in the middle (the slant shows its rise that way) and the walking map follows it, so it does here too.
  const BR = { x0: 235, x1: 535, rise: 0.7 };
  const hump = (x) => Math.sin(Math.PI * clamp((x - BR.x0) / (BR.x1 - BR.x0), 0, 1));
  const deck = (x) => BR.rise * hump(x);
  const yN = (x) => 446 - 26 * hump(x), yS = (x) => 490 - 20 * hump(x);              // the parapets' inner faces (pixels)

  // ---- the moon stone, its rocks, and the painting's big boulders: [x, y, size] ----
  const STONE = { at: [1026, 293], w: 1.95, d: 0.85, h: 3.9 };
  const ROCKS = [
    // the west bank, north of the road
    [250, 70, 1.5], [214, 122, 1.1], [286, 176, 1.15], [292, 238, 0.9], [166, 300, 1.6], [254, 346, 1.35],
    // the east bank, north of the road, and the stones by the bridge's east end
    [506, 150, 1.4], [540, 330, 1.55], [610, 336, 1.45], [546, 404, 0.8], [640, 412, 0.85], [772, 402, 0.85],
    // the west bank, south of the road
    [266, 622, 1.3], [130, 752, 1.5], [276, 704, 1.2], [270, 782, 1.3], [190, 984, 1.6], [292, 952, 1.35],
    // the east bank, south of the road
    [506, 612, 1.1], [562, 628, 1.45], [526, 732, 1.35], [552, 802, 1.4], [600, 912, 1.6], [646, 898, 1.15],
    // the moon stone's foot (east of it), the mossy rock up the north-east track, the rock among the brambles east of the
    // fork, the rock north of the clearing
    [1072, 330, 1.1], [1096, 356, 0.9], [1060, 373, 0.7], [1046, 312, 0.6], [1316, 247, 1.0], [1400, 455, 1.1], [944, 86, 1.2],
  ];
  // the rocks west of the stone (the walking map's block): not solid themselves, the block already is
  const BLOCK_ROCKS = [[898, 272, 0.75], [926, 266, 0.7], [914, 288, 0.6], [934, 286, 0.55]];
  // the painting's big dead thorn trees: [x, y (where the trunk stands), size, seed, lean x, lean z]
  const GIANTS = [
    [668, 256, 2.3, 1, 0.1, -0.1], [150, 236, 1.8, 2, 0.15, 0], [12, 70, 2.0, 3, 0.25, 0.1], [870, 104, 1.7, 4, 0, -0.1],
    [1176, 118, 1.8, 5, -0.1, 0], [1478, 290, 2.3, 6, -0.3, 0], [840, 830, 2.6, 7, 0, -0.15], [1200, 624, 1.6, 8, 0, -0.35],
    [26, 556, 1.7, 9, 0.1, -0.4], [60, 962, 2.2, 10, 0.2, -0.1], [244, 934, 1.8, 11, 0, -0.1], [1484, 900, 2.3, 12, -0.2, -0.1],
    [1430, 830, 1.9, 13, -0.55, 0.05], [1050, 968, 2.0, 14, 0, -0.2], [700, 968, 1.9, 15, 0.1, -0.2], [1335, 650, 1.6, 16, 0, -0.2],
    [1290, 40, 1.9, 17, 0, 0.1], [560, 40, 1.7, 18, 0, 0.1],
    // past the painting: a few great ones by the trails and the places to find
    [-560, 330, 2.3, 21, 0.2, 0.1], [-1000, 470, 2.1, 22, 0, -0.2], [2290, 640, 2.2, 23, -0.2, 0], [2600, 460, 2.0, 24, 0, 0.2],
    [890, -560, 2.4, 25, -0.2, 0], [-246, 1266, 2.0, 26, -0.45, 0.1], [1100, 1650, 1.6, 27, 0, 0], [2060, -360, 1.9, 28, 0.15, 0],
    [1660, 1300, 2.1, 29, 0.2, 0], [80, -380, 2.0, 30, 0, 0.2], [1700, 120, 1.7, 31, 0, 0], [1600, 210, 1.4, 32, -0.2, 0],
  ];
  const STUMPS = [[182, 705, 1.0], [225, 725, 1.2], [-700, 520, 1.1], [1980, 600, 1.0], [700, -420, 0.9]];
  // the clumps of small white flowers among the rocks: [x, y, radius (m), 'white']
  const FLOWERS = [
    [80, 362, 1.1, 'white'], [140, 380, 1.0, 'white'], [36, 330, 0.9, 'white'], [604, 384, 0.9, 'white'], [976, 302, 0.55, 'white'],
    [246, 656, 0.8, 'white'], [176, 526, 0.85, 'white'], [1236, 300, 0.7, 'white'], [570, 380, 0.6, 'white'], [1104, 320, 0.5, 'white'],
    // by the shrine and round the ring of stones
    [2140, -440, 0.6, 'white'], [2222, -440, 0.55, 'white'], [700, -620, 0.7, 'white'], [830, -500, 0.6, 'white'],
  ];
  // lily pads on the stream's still pools and the pool's [x, y, radius m], tufts of tall grass on the banks [x, y]
  const LILIES = [[330, 40, 0.5], [404, 184, 0.55], [392, 206, 0.45], [416, 200, 0.4], [312, 326, 0.5], [322, 338, 0.4], [410, 560, 0.5],
    [430, 588, 0.45], [440, 690, 0.5], [458, 706, 0.42], [330, 940, 0.5], [348, 956, 0.42], [570, 984, 0.5], [312, 70, 0.4],
    [-470, 1300, 0.55], [-452, 1318, 0.45], [-360, 1356, 0.5], [-380, 1290, 0.4], [-500, 1350, 0.45]];
  const TUFTS = [[478, 292], [468, 342], [310, 280], [262, 806], [500, 872], [560, 586], [300, 900], [480, 230], [276, 160],
    [-560, 1300], [-290, 1350], [-420, 1452], [610, -540], [380, -590], [1440, 40], [1540, 100]];
  // the low banks of cold blue mist lying between the trees: [x, y, size m]
  const MIST = [[120, 72, 7], [60, 640, 9], [96, 800, 9], [20, 700, 7], [700, 792, 8], [952, 852, 8], [1050, 800, 7], [1372, 752, 9],
    [1320, 712, 7], [1130, 700, 6], [1490, 200, 7], [640, 160, 6], [820, 700, 7], [180, 860, 7], [1250, 950, 8], [600, 1000, 7],
    [1000, 120, 6], [1520, 640, 7], [-420, 1330, 10], [760, -560, 9], [-300, 700, 9], [-800, 200, 10], [-900, 1000, 10], [200, -700, 9],
    [1300, -500, 10], [1900, -200, 9], [2500, 200, 10], [2400, 1100, 10], [1800, 1500, 10], [1000, 1300, 10], [300, 1600, 10],
    [-1000, -400, 10], [2700, -500, 9], [1600, 900, 8], [-100, 1100, 9], [1100, -200, 8], [2200, 900, 9], [-600, -600, 9]];

  P.thornwood = {
    id: 'thornwood', name: 'The Thornwood', painting: "art/walk/walk-thornwood.avif", size: [1536, 1024],
    mapId: 'thornwood', paintingPng: 'reference/art/walk/walk-thornwood.png',
    // the open wood: one painting each way round the painting; where Io may roam inside it (the woods close it in)
    extent: [-1536, -1024, 3072, 2048],
    open: { bounds: [[-1142, 300], [-1180, 0], [-1240, -350], [-1100, -700], [-700, -800], [-200, -760], [300, -830], [800, -800], [1300, -860],
      [1800, -790], [2300, -840], [2700, -700], [2800, -300], [2760, 200], [2712, 480], [2712, 620], [2780, 1000], [2820, 1450], [2650, 1800],
      [2100, 1850], [1500, 1780], [900, 1860], [300, 1800], [-300, 1840], [-900, 1760], [-1200, 1500], [-1150, 1000], [-1240, 700], [-1142, 440]] },
    // the wall check (tools/walls-test.mjs): from the fork in the painting's middle (the far ways out are more than the
    // check's 90 seconds' walk from the start at the west edge), to the start, each way out, the bridge, the moon stone,
    // the painting's tracks' ends, every place to find and both hollows (the keepsakes are walked to as well)
    checks: { from: [870, 480], goals: [
      ['the start, at the painting’s west edge', 60, 456], ['the bridge, by its lantern', 383, 446], ['the moon stone (the clearing)', 1005, 362],
      ['round behind the moon stone (north)', 1000, 222], ['the north-east track’s end', 1370, 172], ['the east track’s end', 1455, 398],
      ['the end of Chris’s trail into the dark woods (south)', 1290, 815],
      ['the way on to Wickhollow (the west exit)', -1134, 366], ['the way on to Bogmire (the east exit)', 2704, 548],
      ['the ring of standing stones (north)', 760, -515], ['over the stepping stones (north-west)', 380, -560], ['the wayside shrine (north-east)', 2180, -435],
      ['the fallen thorn tree (east)', 2040, 250], ['inside the ruined walls (south)', 1310, 1590], ['the still pool (south-west)', -420, 1200],
      ['in the frog-ring’s hollow (north-east)', 1500, 90], ['in the brooch’s hollow (south-east)', 1392, 905]] },
    // the trees: on the painting from the painting itself (most of them bare and thorny); past it in clumps with clearings
    // between, nearly all bare and thorny, a few with crowns of bramble. None in the hollows and the places to find; the
    // woods close in past the ways out (the trails end at their edge).
    // (fewer, bigger trees than a town's: the engine draws a soft shade under every one, and each costs time while the
    // page loads)
    treeGen: { dark: 0.45, step: 74, fir: 0, firSouth: 0, thorn: 0.85,
      out: { density: 0.86, clump: 520, clear: 0.36, kinds: [0.1, 0, 0.9], size: [1.15, 2.0] },
      roads: [],
      keepOut: [[990, 262, 1070, 322], [460, 80, 600, 400], [470, 560, 650, 1060], [190, 560, 300, 1060], [186, -40, 300, 432], [20, 300, 200, 400],
        [1380, -40, 1640, 170], [1300, 830, 1490, 990], [590, -700, 930, -420], [2060, -580, 2300, -380], [2030, 90, 2350, 270], [1140, 1480, 1480, 1730],
        [-610, 1200, -230, 1460], [380, -620, 620, -500]] },
    // the ground: the earth road (on the walk and the trails), moss along its edges, bramble everywhere else
    ground: { cob: 'shared_dirt_track', dirt: 'thorn_moss_ground', grass: 'thorn_bramble_ground', pave: 'wick_bridge_paving', rep: [3.0, 3.4, 2.6, 2.6], grassTint: [0.9, 0.86, 0.95] },
    // what each kind of surface is made of here (the Thornwood has no houses: the unused kinds point at its own textures)
    surfaces: { stone: 'shared_stone_wall_rough', dry: 'shared_stone_wall_rough', timber: 'shared_stone_wall_rough', planks: 'thorn_bark_black', roof: 'thorn_rock_mossy',
      wood: 'thorn_bark_black', deck: 'wick_bridge_paving', pave: 'wick_bridge_paving', cloth: 'thorn_moss_ground', soil: 'thorn_moss_ground', rock: 'thorn_rock_mossy',
      leaves: 'thorn_bramble_ground', firs: 'thorn_bramble_ground', bark: 'thorn_bark_black' },
    tints: { leaves: 0xe4dcea, firs: 0xe4dcea, bush: 0xeae2ee, wood: 0xd0c8d4 },
    // heavy cold fog: only so much is drawn at once; no far hills (the fog is the edge). Its colour is pale (the painting's
    // cold blue mist), and 1.3 times it is the sky's own colour low down, so the sky below the horizon (where nothing is
    // drawn past the fog) meets the sky above it without a dark band.
    night: { fog: [0.18, 0.185, 0.338], fogNear: 10, fogFar: 42, far: 90, hills: false, sky: [0.58, 0.58, 0.72], moon: [0.4, 0.44, 0.6] },
    textures: [
      { id: 'shared_dirt_track', made: "./../texture-packs/made/shared_dirt_track.png", stand: "./../texture-packs/wickhollow/thornwood/stand-in/shared_dirt_track.png" },
      { id: 'thorn_moss_ground', made: "./../texture-packs/made/thorn_moss_ground.png", stand: "./../texture-packs/wickhollow/thornwood/stand-in/thorn_moss_ground.png" },
      { id: 'thorn_bramble_ground', made: "./../texture-packs/made/thorn_bramble_ground.png", stand: "./../texture-packs/wickhollow/thornwood/stand-in/thorn_bramble_ground.png" },
      { id: 'shared_water_river', made: "./../texture-packs/made/shared_water_river.png", stand: "./../texture-packs/wickhollow/thornwood/stand-in/shared_water_river.png" },
      { id: 'thorn_rock_mossy', made: "./../texture-packs/made/thorn_rock_mossy.png", stand: "./../texture-packs/wickhollow/thornwood/stand-in/thorn_rock_mossy.png" },
      { id: 'thorn_bark_black', made: "./../texture-packs/made/thorn_bark_black.png", stand: "./../texture-packs/wickhollow/thornwood/stand-in/thorn_bark_black.png" },
      { id: 'wick_bridge_paving', made: "./../texture-packs/made/wick_bridge_paving.png", stand: "./../texture-packs/wickhollow/wickhollow/stand-in/wick_bridge_paving.png" },
      { id: 'shared_stone_wall_rough', made: "./../texture-packs/made/shared_stone_wall_rough.png", stand: "./../texture-packs/wickhollow/wickhollow/stand-in/shared_stone_wall_rough.png" },
      { id: 'shared_water_dark', made: "./../texture-packs/made/shared_water_dark.png", stand: "./../texture-packs/wickhollow/jetty/stand-in/shared_water_dark.png" },
    ],
    ground_h: ground,
    // where Io's feet stand: the ground (the engine stands her on it as it shapes it), the bridge's deck, or the stepping
    // stones' tops
    walk_h(x, y) {
      if (x >= 226 && x <= 544 && y >= 400 && y <= 505) { const g = ground(x, y), d = deck(x); return d > g ? d : g; }
      if (y >= FORD.y - 18 && y <= FORD.y + 18 && x > bank(LB, y) - 4 && x < bank(RB, y) + 4) return level(y) + 0.25;
      return ground(x, y);
    },
    water: [
      { poly: STREAM, level, tex: 'shared_water_river', rep: 4, flow: [0.0, 0.05], bed: -6.0 },
      { poly: POOLP, level: () => poolLevel(), tex: 'shared_water_dark', rep: 6, flow: [0.003, 0.002], bed: -6.0 },
      { poly: FROGP, level: () => frogLevel(), tex: 'shared_water_dark', rep: 3, flow: [0.002, 0.001], bed: -6.0 },
    ],
    lawns: [],
    start: [60, 456], startFace: Math.PI / 2, startYaw: -Math.PI / 2,
    // the ways on, where the trails reach the open ground's edge
    exits: [
      { rect: [-1144, 330, -1124, 402], label: 'Wickhollow' },
      { rect: [2692, 510, 2712, 586], label: 'Bogmire' },
    ],
    // the trails (earth down the middle, moss along the edges), and the stepping stones over the stream
    walkAdd: TRAILS.map((t) => ({ poly: ribbon(t.pts, t.w + 0.55), ground: 'dirt' })).concat(TRAILS.map((t) => ({ poly: ribbon(t.pts, t.w), ground: 'cob' })))
      .concat([{ poly: [[bank(LB, FORD.y - 16) - 2, FORD.y - 16], [bank(RB, FORD.y - 16) + 2, FORD.y - 16], [bank(RB, FORD.y + 16) + 2, FORD.y + 16], [bank(LB, FORD.y + 16) - 2, FORD.y + 16]].map((p) => p.map(Math.round)), ground: 'grass' }]),
    // the keepsakes, each in its hollow: the Frog-Ring where the north-east track gives out, behind the boulders; the
    // Warden's Brooch where Chris's trail into the dark woods gives out, inside the thorn
    items: { 'frog-ring': [1505, 94], 'wardens-brooch': [1392, 905] },
    buildings: [],
    // the bridge's wing walls, just off the road
    walls: [
      { pts: [[150, 425], [200, 435], [236, 437]], h: 0.8, t: 0.5, tex: 'stone' },
      { pts: [[530, 437], [590, 443]], h: 0.75, t: 0.5, tex: 'stone' },
    ],
    steps: [],
    lamps: [],
    props: ROCKS.map(([x, y, s]) => ({ k: 'rock', at: [x, y], size: s })).concat(BLOCK_ROCKS.map(([x, y, s]) => ({ k: 'rock', at: [x, y], size: s, solid: false }))),
    flowers: FLOWERS,
    // the lights for the light map: [x, y, radius px, strength, colour]. The bridge's lantern and the moon stone's own
    // are added in extra(); these are the moonlight glittering on the stream and lying in the clearings.
    lights: [
      [380, 150, 150, 0.45, 'moon'], [400, 760, 160, 0.45, 'moon'], [470, 960, 140, 0.4, 'moon'], [960, 300, 150, 0.32, 'moon'], [1200, 470, 140, 0.25, 'moon'],
      [760, -560, 200, 0.5, 'moon'], [-420, 1330, 220, 0.55, 'moon'], [490, -560, 160, 0.45, 'moon'], [1310, 1590, 160, 0.3, 'moon'], [2180, -440, 120, 0.4, 'moon'],
      [1482, 72, 110, 0.4, 'moon'],
    ],
    trees: 'thornwood',
    extraTrees: [],

    // ---- what the engine has no field for: the old bridge and its lantern, the moon stone, the dead thorn trees, the
    // stumps, the bramble, the grass tufts, the lily pads, the stones along the road, the mist, the places to find, the two
    // hollows, and everything solid that keeps Io off the bridge's sides and the stream's rocky banks ----
    extra(K) {
      const { B, X, Z } = K, W = G.W3D, TAU = Math.PI * 2;
      const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
      const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
      const norm = (a) => { const L = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / L, a[1] / L, a[2] / L]; };
      // a quad that faces the way `want` points, whichever order its corners came in
      const Q = (k, a, b, c, d, want, uv, col) => { const n = cross(sub(b, a), sub(d, a)); if (dot(n, want) < 0) B.quad(k, b, a, d, c, uv, col); else B.quad(k, a, b, c, d, uv, col); };
      // how far a point is from the walking map's walk areas (0 inside one), and from the trails
      const walkDist = (x, y) => { let d = 1e9; for (const q of mapWalk()) { if (W.inPoly(q.p, x, y)) return 0; if (x > q.b[0] - d && x < q.b[2] + d && y > q.b[1] - d && y < q.b[3] + d) d = Math.min(d, W.edgeDist(q.p, x, y)); } return d; };
      const pathDist = (x, y) => Math.min(walkDist(x, y), trailDist(x, y) - 40);   // (40 px: the widest trail's half width, its moss and all)
      const inStream = (x, y) => x > bank(LB, y) - 6 && x < bank(RB, y) + 6;
      const inBounds = (x, y) => W.inPoly(P.thornwood.open.bounds, x, y);
      const TH = K.terrain;
      // something solid: a ring (a C, open at `gap`) round (cx, cy), from r0 to r1 metres
      const ringBlock = (c, r0, r1, gap, gw) => { const pts = [], n = 28; for (let i = 0; i <= n; i++) { const a = gap + gw + (TAU - 2 * gw) * i / n; pts.push([c[0] + Math.cos(a) * r1 / SX, c[1] + Math.sin(a) * r1 / SZ]); } for (let i = n; i >= 0; i--) { const a = gap + gw + (TAU - 2 * gw) * i / n; pts.push([c[0] + Math.cos(a) * r0 / SX, c[1] + Math.sin(a) * r0 / SZ]); } K.addBlock(pts); };
      const rock = (px, py, sz, solid, col) => { B.geom('rock', K.rockG[Math.floor(Math.abs(Math.sin(px * 12.9 + py * 7.3)) * 3) % 3], new THREE.Matrix4().compose(new THREE.Vector3(X(px), TH(px, py) - sz * 0.2, Z(py)), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, (px * 0.37 + py * 0.11) % TAU, 0)), new THREE.Vector3(sz, sz, sz)), col || null, 1.2); if (solid) K.addBlock(K.circlePx(px, py, sz * 0.8, 8)); };

      // a tapered branch from A to Bp (an open tube of n sides), its bark's uv in metres
      function seg(A, Bp, ra, rb, n, col) {
        const d = sub(Bp, A), L = Math.hypot(d[0], d[1], d[2]), dir = mul(d, 1 / L);
        const u = norm(cross(Math.abs(dir[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0], dir)), v = cross(dir, u);
        const ring = (c, r, t) => add(c, add(mul(u, Math.cos(t) * r), mul(v, Math.sin(t) * r)));
        for (let i = 0; i < n; i++) {
          const t0 = i / n * TAU, t1 = (i + 1) / n * TAU;
          B.quad('wood', ring(A, ra, t0), ring(A, ra, t1), ring(Bp, rb, t1), ring(Bp, rb, t0), [t0 * ra, 0, t1 * ra, L], col);
        }
      }

      // ---- the old bridge ----
      {
        const N = 30, PT = 8, PH = 0.85, UP = [0, 1, 0];
        const archY = (px) => { const u = (px - 385) / 100; return Math.abs(u) > 1 ? null : -2.6 + 2.35 * Math.sqrt(1 - u * u); };
        const bot = (px) => { const a = archY(px); return a == null ? -3.2 : a; };
        const xs = (i) => BR.x0 + (BR.x1 - BR.x0) * i / N;
        for (let i = 0; i < N; i++) {
          const pa = xs(i), pb = xs(i + 1), xa = X(pa), xb = X(pb), da = deck(pa) + 0.02, db = deck(pb) + 0.02, ba = bot(pa), bb = bot(pb);
          const nAi = Z(yN(pa)), nBi = Z(yN(pb)), nAo = Z(yN(pa) - PT), nBo = Z(yN(pb) - PT);
          const sAi = Z(yS(pa)), sBi = Z(yS(pb)), sAo = Z(yS(pa) + PT), sBo = Z(yS(pb) + PT);
          Q('pave', [xa, da, sAi], [xb, db, sBi], [xb, db, nBi], [xa, da, nAi], UP, [xa, sAi, xb, nAi]);
          // the north parapet: its inner face, its top, its outer face down to the arch (or into the bank)
          Q('stone', [xa, da, nAi], [xb, db, nBi], [xb, db + PH, nBi], [xa, da + PH, nAi], [0, 0, 1], [xa, da, xb, da + PH]);
          Q('stone', [xa, da + PH, nAi], [xb, db + PH, nBi], [xb, db + PH, nBo], [xa, da + PH, nAo], UP, [xa, 0, xb, 0.4], [0.86, 0.86, 0.9]);
          Q('stone', [xa, ba, nAo], [xb, bb, nBo], [xb, db + PH, nBo], [xa, da + PH, nAo], [0, 0, -1], [xa, ba, xb, da + PH]);
          // the south parapet
          Q('stone', [xa, da, sAi], [xb, db, sBi], [xb, db + PH, sBi], [xa, da + PH, sAi], [0, 0, -1], [xa, da, xb, da + PH]);
          Q('stone', [xa, da + PH, sAi], [xb, db + PH, sBi], [xb, db + PH, sBo], [xa, da + PH, sAo], UP, [xa, 0, xb, 0.4], [0.86, 0.86, 0.9]);
          Q('stone', [xa, ba, sAo], [xb, bb, sBo], [xb, db + PH, sBo], [xa, da + PH, sAo], [0, 0, 1], [xa, ba, xb, da + PH]);
          // the arch's underside
          if (archY(pa) != null && archY(pb) != null) Q('stone', [xa, ba, nAo], [xb, bb, nBo], [xb, bb, sBo], [xa, ba, sAo], [0, -1, 0], [xa, nAo, xb, sAo], [0.62, 0.62, 0.68]);
        }
        // the arch's ring of stones, a hand proud of each face
        const NV = 15;
        for (const side of [-1, 1]) {
          const fz = (px) => side < 0 ? Z(yN(px) - PT) - 0.05 : Z(yS(px) + PT) + 0.05;
          for (let k = 0; k < NV; k++) {
            const t0 = Math.PI * k / NV, t1 = Math.PI * (k + 1) / NV;
            const pt = (t, out) => { const px = 385 - (100 + out * 13) * Math.cos(t); return [X(px), -2.6 + (2.35 + out * 0.55) * Math.sin(t), fz(px)]; };
            const col = k % 2 ? [0.8, 0.79, 0.85] : [0.96, 0.94, 1.0];
            Q('stone', pt(t0, 0), pt(t1, 0), pt(t1, 1), pt(t0, 1), [0, 0, side], [k * 0.6, 0, k * 0.6 + 0.6, 0.55], col);
          }
        }
        // the four end posts, and the middle post on the north parapet with the lantern on it
        for (const [px, py] of [[247, yN(247) - 5], [523, yN(523) - 5], [247, yS(247) + 5], [523, yS(523) + 5]]) {
          const top = deck(px) + 1.2;
          B.box('stone', X(px), -1.2, Z(py), 0.64, top + 1.2, 0.64, 0, [0.95, 0.93, 0.98]);
          B.box('stone', X(px), top, Z(py), 0.76, 0.14, 0.76, 0, [0.8, 0.78, 0.84]);
          B.box('stone', X(px), top + 0.14, Z(py), 0.5, 0.1, 0.5, 0, [0.88, 0.86, 0.92]);
          K.addBlock(W.rectPoly([px - 8, py - 6, px + 8, py + 6]));
        }
        const lx = X(383), lz = Z(414), lb = deck(383);
        B.box('stone', lx, lb, lz, 0.6, 1.08, 0.6, 0, [0.95, 0.93, 0.98]);
        B.box('stone', lx, lb + 1.08, lz, 0.72, 0.12, 0.72, 0, [0.8, 0.78, 0.84]);
        K.lantern(lx, lb + 1.24, lz, null, 1.15);
        K.light(383, 436, 105, 0.85, 'warm');
        K.addBlock(K.circlePx(383, 414, 0.36, 8));
        // the abutments: stone into the banks under each end
        B.box('stone', X(262), -3.4, Z(466), 1.9, 3.3, 3.6, 0, [0.82, 0.8, 0.86]);
        B.box('stone', X(508), -3.4, Z(466), 1.9, 3.3, 3.6, 0, [0.82, 0.8, 0.86]);
        K.shadeMarks.push(['rect', 250, 492, 520, 520, 0.7]);
        // solid: the parapets (so the deck is reached only from the road), and the wing walls
        const strip = (f, off0, off1) => { const a = [], b = []; for (let x = BR.x0; x <= BR.x1; x += 10) { a.push([x, f(x) + off0]); b.push([x, f(x) + off1]); } return a.concat(b.reverse()); };
        K.addBlock(strip(yN, -9, 0)); K.addBlock(strip(yS, 0, 9));
        for (const wl of P.thornwood.walls) for (let i = 1; i < wl.pts.length; i++) K.addBlock(ribbon([wl.pts[i - 1], wl.pts[i]], wl.t / 2));
      }

      // ---- solid: the stream's rocky banks (Io stays on the bank top, except at the bridge and the stepping stones) ----
      for (const [ya, yb] of [[-1100, FORD.y - 26], [FORD.y + 26, 428], [488, 2100]]) {
        for (const side of [-1, 1]) {
          const a = [], b = [];
          for (let y = ya; y <= yb; y += Math.min(25, yb - y) || 25) {
            const e = side < 0 ? bank(LB, y) : bank(RB, y);
            a.push([e + side * 30, y]); b.push([e - side * 4, y]);
            if (y === yb) break;
          }
          K.addBlock(a.concat(b.reverse()));
        }
      }

      // ---- the moon stone: a tall standing stone, its south face cut with a crescent that holds a little moonlight ----
      function standingStone(sx, sy, w, d, h, ry, seed, col) {
        const base = TH(sx, sy) - 0.3, g = new THREE.BoxGeometry(1, 1, 1, 3, 9, 2), p = g.attributes.position;
        const hh = (a, b, c) => { const s = Math.sin(a * 127.1 + b * 311.7 + c * 74.7 + seed) * 43758.5453; return s - Math.floor(s); };
        for (let i = 0; i < p.count; i++) {
          const x = p.getX(i), y = p.getY(i), z = p.getZ(i), t = y + 0.5;
          const wk = 1 - 0.24 * t; let yy = t;
          if (t > 0.8) yy -= (x * x) * 0.55 * ss(0.8, 1, t);                     // its rounded shoulders
          const n = (hh(x, y, z) - 0.5) * 0.06;
          p.setXYZ(i, x * wk * w + n, yy * h + n, z * d * (1 - 0.18 * t) + n * 0.5);
        }
        g.computeVertexNormals();
        B.geom('rock', g, new THREE.Matrix4().compose(new THREE.Vector3(X(sx), base, Z(sy)), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(1, 1, 1)), col || [0.98, 1.0, 1.06], [w, h]);
        g.dispose();
        return base;
      }
      {
        const [sx, sy] = STONE.at, base = standingStone(sx, sy, STONE.w, STONE.d, STONE.h, 0.05, 0);
        // the crescent, opening east, on the south face two thirds up
        const ct = 0.66, cy = base + ct * STONE.h, cz = Z(sy) + STONE.d * (1 - 0.18 * ct) / 2 + 0.035, cx = X(sx) + 0.04, R = 0.42, NC = 16;
        const pt = (t, r) => [cx + Math.cos(t) * r, cy + Math.sin(t) * r, cz];
        for (let i = 0; i < NC; i++) {
          const ta = 0.95 + (TAU - 1.9) * i / NC, tb = 0.95 + (TAU - 1.9) * (i + 1) / NC;
          const wa = 0.2 * Math.sin(Math.PI * i / NC), wb = 0.2 * Math.sin(Math.PI * (i + 1) / NC);
          Q('glass', pt(ta, R), pt(tb, R), pt(tb, R - wb), pt(ta, R - wa), [0, 0, 1], [0, 0, 1, 1], [0.62, 0.78, 1.15]);
        }
        K.halo(cx, cy, cz + 0.1, 1.5, [0.2, 0.3, 0.55]);
        K.light(sx, sy + 26, 120, 0.6, 'moon');
        K.addBlock(W.rectPoly([sx - 25, sy - 10, sx + 25, sy + 10]));
        K.shadeMarks.push(['dot', sx, sy + 6, 30, 0.6]);
      }

      // ---- the moss of the clearing west of the moon stone, round the rocks there (the painting's; the walking map's
      // ground under it is all earth) ----
      {
        const M1 = [[856, 262], [872, 252], [886, 240], [900, 226], [930, 208], [960, 196], [986, 196], [990, 232], [984, 252], [966, 268], [952, 290], [946, 306],
          [900, 304], [870, 298], [850, 290], [848, 276]];
        const c = 0.3, h = (x, z) => TH(K.M.px(x), K.M.py(z)) + 0.03;
        for (let z = Z(196); z < Z(306); z += c) for (let x = X(848); x < X(990); x += c) {
          if (!W.inPoly(M1, K.M.px(x + c / 2), K.M.py(z + c / 2))) continue;
          Q('cloth', [x, h(x, z + c), z + c], [x + c, h(x + c, z + c), z + c], [x + c, h(x + c, z), z], [x, h(x, z), z], [0, 1, 0], [x, z, x + c, z + c], [0.6, 0.66, 0.58]);
        }
      }

      // ---- the dead thorn trees: twisted black trunks and bare thorny branches ----
      function deadTree(px, py, s, seed, lean, opt) {
        opt = opt || {};
        const r = W.rand(seed * 7919 + 13), x = X(px), z = Z(py), y0 = TH(px, py) - 0.3;
        const k = 0.78 + r() * 0.2, col = [k, k * 0.95, k * 1.03];
        let p = [x, y0, z], dir = norm([(lean ? lean[0] : 0) + (r() - 0.5) * 0.3, 1, (lean ? lean[1] : 0) + (r() - 0.5) * 0.3]);
        const H = (3.0 + r() * 1.4) * s, NT = opt.big ? 4 : 3, pts = [];
        let rad = 0.3 * s;
        // roots, flaring out into the ground
        for (let i = 0; i < (opt.big ? 5 : 3); i++) { const a = i / (opt.big ? 5 : 3) * TAU + r(); seg(add(p, [Math.cos(a) * 1.4 * s * 0.6, -0.35, Math.sin(a) * 1.4 * s * 0.6]), add(p, [0, 0.9 * s, 0]), 0.08 * s, rad * 0.8, 4, col); }
        for (let i = 0; i < NT; i++) {
          const np = add(p, mul(dir, H / NT)), nr = rad * 0.76;
          seg(p, np, rad, nr, opt.big ? 7 : 6, col); pts.push([np, nr, dir]);
          p = np; rad = nr; dir = norm(add(dir, [(r() - 0.5) * 0.55, 0.05, (r() - 0.5) * 0.55]));
        }
        // the limbs: from the top and the upper trunk, out and up, twisting as they go, with thorny twigs off each joint
        const NL = (opt.big ? 5 : 3) + Math.floor(r() * 2.5);
        for (let j = 0; j < NL; j++) {
          const from = j < 2 ? pts[pts.length - 1] : pts[Math.max(0, pts.length - 2 - Math.floor(r() * 2))];
          const a = j / NL * TAU + r() * 0.9, out = 0.7 + r() * 0.8;
          let d = norm([Math.cos(a) * out + from[2][0] * 0.3, 0.8 + r() * 0.4, Math.sin(a) * out + from[2][2] * 0.3]);
          let q = from[0], lr = from[1] * (0.6 + r() * 0.15), L = (1.3 + r() * 0.8) * s * (opt.big ? 1.15 : 1);
          const NS = opt.big ? 4 : 3;
          for (let i = 0; i < NS; i++) {
            const nq = add(q, mul(d, L)), nlr = Math.max(0.018, lr * 0.62);
            seg(q, nq, lr, nlr, lr > 0.09 ? 5 : 3, col);
            const nt = 1 + (r() < 0.65 ? 1 : 0);
            for (let t = 0; t < nt; t++) {
              const td = norm(add(d, [(r() - 0.5) * 1.8, (r() - 0.3) * 1.2, (r() - 0.5) * 1.8]));
              seg(nq, add(nq, mul(td, L * (0.45 + r() * 0.35))), nlr * 0.8, 0.008, 3, col);
            }
            q = nq; lr = nlr; L *= 0.78;
            d = norm(add(d, [(r() - 0.5) * 1.0, (r() - 0.62) * 0.55, (r() - 0.5) * 1.0]));
          }
        }
        if (opt.big) K.shadeMarks.push(['dot', px, py, 18 * s, 0.72]);   // (only under the great ones: each soft shade costs load time)
        K.addBlock(K.circlePx(px, py, 0.32 * s, 8));
      }
      for (const [px, py, s, seed, lx, lz] of GIANTS) deadTree(px, py, s, seed, [lx, lz], { big: s >= 2 });
      // more of them on the painting, on a jittered grid: off the walk, the stream, the stone and the giants; and along
      // the trails past it, every so often, so the way is lined with them
      const nearSolid = (px, py) => GIANTS.some((g) => Math.hypot(px - g[0], py - g[1]) < 70 * g[2] / 2) || ROCKS.some((q) => Math.hypot(px - q[0], py - q[1]) < 30 * q[2]);
      const nearPlace = (px, py) => P.thornwood.treeGen.keepOut.slice(6).some((k) => px > k[0] - 20 && px < k[2] + 20 && py > k[1] - 20 && py < k[3] + 20);
      {
        const r = W.rand(4242), STEP = 92;
        for (let gy = 0; gy < 1024; gy += STEP) for (let gx = 0; gx < 1536; gx += STEP) {
          const px = gx + r() * STEP, py = gy + r() * STEP, s = 0.85 + r() * 0.6, seed = Math.floor(r() * 1e5), keep = r();
          if (keep > 0.8) continue;
          if (walkDist(px, py) < 24 + 10 * s || inStream(px, py) || Math.hypot(px - STONE.at[0], py - STONE.at[1]) < 80 || nearSolid(px, py) || nearPlace(px, py)) continue;
          deadTree(px, py, s, seed, [(r() - 0.5) * 0.3, (r() - 0.5) * 0.3]);
        }
        for (const t of TRAILS) {
          let side = 1;
          for (let i = 1; i < t.pts.length; i++) {
            const [ax, ay] = t.pts[i - 1], [bx, by] = t.pts[i], L = Math.hypot((bx - ax) * SX, (by - ay) * SZ);
            for (let s = 4 + r() * 6; s < L; s += 8 + r() * 9) {
              const f = s / L, cx = ax + (bx - ax) * f, cy = ay + (by - ay) * f, nx = -(by - ay) * SZ / L, nz = (bx - ax) * SX / L, off = (t.w + 1.6 + r() * 2.5) * side;
              const px = cx + nx * off / SX, py = cy + nz * off / SZ; side = -side;
              if ((px >= -40 && px <= 1576 && py >= -40 && py <= 1064) || pathDist(px, py) < 26 || inStream(px, py) || !inBounds(px, py) || nearSolid(px, py) || nearPlace(px, py)) continue;
              deadTree(px, py, 1.0 + r() * 0.7, Math.floor(r() * 1e5), [(px - cx) * 0.004, (py - cy) * 0.005]);
            }
          }
        }
      }

      // ---- broken stumps ----
      for (const [px, py, s] of STUMPS) {
        const r = W.rand(Math.abs(px * 3 + py)), x = X(px), z = Z(py), y = TH(px, py) - 0.2, h = 1.0 * s, rad = 0.3 * s;
        seg([x, y, z], [x, y + h, z], rad, rad * 0.85, 7, [0.8, 0.76, 0.8]);
        for (let i = 0; i < 7; i++) { const a = i / 7 * TAU, b = (i + 1) / 7 * TAU, tip = h + 0.15 + r() * 0.35 * s; B.tri('wood', [x + Math.cos(a) * rad * 0.85, y + h, z + Math.sin(a) * rad * 0.85], [x + Math.cos(b) * rad * 0.85, y + h, z + Math.sin(b) * rad * 0.85], [x + Math.cos((a + b) / 2) * rad * 0.5, y + tip, z + Math.sin((a + b) / 2) * rad * 0.5], [[0, 0], [0.3, 0], [0.15, 0.4]], [0.7, 0.62, 0.62]); }
        B.quad('wood', [x - rad * 0.8, y + h - 0.02, z + rad * 0.3], [x + rad * 0.8, y + h - 0.02, z + rad * 0.3], [x + rad * 0.8, y + h - 0.02, z - rad * 0.5], [x - rad * 0.8, y + h - 0.02, z - rad * 0.5], [0, 0, 0.5, 0.5], [1.1, 0.9, 0.8]);
        K.addBlock(K.circlePx(px, py, rad + 0.05, 8));
      }

      // ---- bramble: low thorny mounds with dark red berries, along the paths' edges ----
      const mound = (px, py, rr, r, solid) => {
        const x = X(px), z = Z(py), y = TH(px, py), h = rr * (0.45 + r() * 0.25);
        B.geom('leafBush', K.ico[Math.floor(r() * 3)], new THREE.Matrix4().compose(new THREE.Vector3(x, y + h * 0.3, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, r() * TAU, 0)), new THREE.Vector3(rr, h, rr)), [0.82, 0.74, 0.8], 2.0);
        const n = Math.max(2, Math.round(rr * 2.5));
        for (let i = 0; i < n; i++) {
          const a = r() * TAU, d = r() * rr * 0.6, cx = x + Math.cos(a) * d, cz = z + Math.sin(a) * d, cy = y + h * (0.6 + r() * 0.5), sz = 0.35 + r() * 0.2, t = r() * Math.PI;
          B.quad('fl_fruit', [cx - Math.cos(t) * sz, cy - sz * 0.6, cz - Math.sin(t) * sz], [cx + Math.cos(t) * sz, cy - sz * 0.6, cz + Math.sin(t) * sz], [cx + Math.cos(t) * sz, cy + sz, cz + Math.sin(t) * sz], [cx - Math.cos(t) * sz, cy + sz, cz - Math.sin(t) * sz], [0, 0, 1, 1], [0.72, 0.3, 0.36]);
        }
        if (solid) K.addBlock(K.circlePx(px, py, rr * 0.7, 8));
      };
      {
        const r = W.rand(777), STEP = 36;
        for (let gy = -60; gy < 1024 + 60; gy += STEP) for (let gx = -60; gx < 1536 + 60; gx += STEP) {
          const px = gx + (r() - 0.5) * STEP, py = gy + (r() - 0.5) * STEP, rr = 0.7 + r() * 0.6, keep = r();
          const wd = walkDist(px, py);
          if (wd < rr / SX + 3 || wd > 110 || inStream(px, py) || Math.hypot(px - STONE.at[0], py - STONE.at[1]) < 60 || nearSolid(px, py) || nearPlace(px, py)) continue;
          if (keep > 0.6) continue;
          mound(px, py, rr, r, rr > 1.05);
        }
        // and along the trails past the painting
        for (const t of TRAILS) for (let i = 1; i < t.pts.length; i++) {
          const [ax, ay] = t.pts[i - 1], [bx, by] = t.pts[i], L = Math.hypot((bx - ax) * SX, (by - ay) * SZ);
          for (let s = r() * 4; s < L; s += 3.5 + r() * 4) {
            const f = s / L, cx = ax + (bx - ax) * f, cy = ay + (by - ay) * f, nx = -(by - ay) * SZ / L, nz = (bx - ax) * SX / L, rr = 0.7 + r() * 0.6, off = (t.w + 0.6 + rr + r() * 1.2) * (r() < 0.5 ? -1 : 1);
            const px = cx + nx * off / SX, py = cy + nz * off / SZ;
            if ((px >= -40 && px <= 1576 && py >= -40 && py <= 1064) || pathDist(px, py) < rr / SX + 3 || inStream(px, py) || !inBounds(px, py) || nearPlace(px, py) || r() > 0.7) continue;
            mound(px, py, rr, r, rr > 1.05);
          }
        }
      }

      // ---- tufts of tall wild grass on the banks ----
      for (const [px, py] of TUFTS) {
        const r = W.rand(Math.abs(px * 7 + py)), x = X(px), z = Z(py), y = TH(px, py);
        for (let i = 0; i < 9; i++) {
          const a = r() * TAU, lean = 0.15 + r() * 0.35, h = 0.7 + r() * 0.6, w = 0.05 + r() * 0.03, bx = x + (r() - 0.5) * 0.5, bz = z + (r() - 0.5) * 0.4;
          const ox = Math.cos(a), oz = Math.sin(a);
          B.tri('cloth', [bx - oz * w, y, bz + ox * w], [bx + oz * w, y, bz - ox * w], [bx + ox * lean, y + h, bz + oz * lean], [[0, 0], [0.1, 0], [0.05, 1]], [1.25, 1.3, 0.85]);
        }
      }

      // ---- lily pads on the still water ----
      const lily = (px, py, rr, y) => {
        const x = X(px), z = Z(py), NL = 10, a0 = Math.abs(px * 13 + py) % 6, gap = 0.5;
        for (let i = 0; i < NL; i++) {
          const ta = a0 + gap / 2 + (TAU - gap) * i / NL, tb = a0 + gap / 2 + (TAU - gap) * (i + 1) / NL;
          B.tri('cloth', [x, y, z], [x + Math.cos(tb) * rr, y, z + Math.sin(tb) * rr], [x + Math.cos(ta) * rr, y, z + Math.sin(ta) * rr], [[0, 0], [rr, 0], [0, rr]], [0.62, 1.0, 0.7]);
        }
      };
      for (const [px, py, rr] of LILIES) lily(px, py, rr, (W.inPoly(POOLP, px, py) ? poolLevel() : level(py)) + 0.03);

      // ---- small loose stones half sunk along the road's edges ----
      {
        const r = W.rand(99);
        for (let i = 0; i < 400; i++) {
          const px = r() * 1536, py = 120 + r() * 760, wd = walkDist(px, py);
          if (wd < 3 || wd > 16 || inStream(px, py)) continue;
          const sz = 0.18 + r() * 0.22;
          B.geom('rock', K.rockG[Math.floor(r() * 3)], new THREE.Matrix4().compose(new THREE.Vector3(X(px), TH(px, py) - sz * 0.25, Z(py)), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, r() * TAU, 0)), new THREE.Vector3(sz, sz, sz)), [0.95, 0.95, 1.0], 0.6);
        }
      }

      // ---- the ring of standing stones in the north: nine, two of them fallen, round a low flat stone ----
      {
        const [cx, cy] = RING.c, r = W.rand(31);
        for (let i = 0; i < 9; i++) {
          const a = i / 9 * TAU + 0.55, px = cx + Math.cos(a) * RING.r / SX, py = cy + Math.sin(a) * RING.r / SZ, w = 0.8 + r() * 0.35, h = 1.6 + r() * 0.8;
          if (i === 3 || i === 7) {
            // fallen: lying on its side, pointing out
            const x = X(px), z = Z(py), y = TH(px, py);
            B.box('stone', x, y - 0.15, z, 0.6, 0.55, h, -a + Math.PI / 2, [0.9, 0.92, 0.98]);
            K.addBlock(K.circlePx(px, py, h * 0.45, 8));
          } else {
            standingStone(px, py, w, 0.5, h, -a + Math.PI / 2, i * 3.1, [0.92, 0.95, 1.0]);
            K.addBlock(K.circlePx(px, py, 0.5, 8));
          }
        }
        const y = TH(cx, cy);
        B.cyl('stone', X(cx), y - 0.2, Z(cy), 0.9, 0.85, 0.5, 10, [0.85, 0.87, 0.94]);
        K.addBlock(K.circlePx(cx, cy, 0.9, 8));
        for (let i = 0; i < 6; i++) { const a = r() * TAU, d = 2 + r() * 4; rock(cx + Math.cos(a) * d / SX, cy + Math.sin(a) * d / SZ, 0.25 + r() * 0.2, false); }
      }

      // ---- the stepping stones over the stream, north-west of the ring ----
      for (const [i, px] of FORD.xs.entries()) {
        const py = FORD.y + (i % 2 ? 6 : -6), x = X(px), z = Z(py), top = level(py) + 0.25;
        B.cyl('rock', x, level(py) - 1.0, z, 0.5, 0.42, top - level(py) + 1.0, 8, [0.9, 0.92, 0.98], [3.0, 1.2]);
      }

      // ---- the wayside shrine in the north-east: a stone niche facing south, a crescent cut in its back ----
      {
        const [px, py] = SHRINE.at, x = X(px), z = Z(py), y = TH(px, py);
        B.box('stone', x, y - 0.3, z, 1.8, 0.7, 1.1, 0, [0.85, 0.86, 0.92]);
        B.box('stone', x, y + 0.4, z - 0.38, 1.4, 1.7, 0.32, 0, [0.95, 0.95, 1.0]);
        for (const sx of [-0.58, 0.58]) B.box('stone', x + sx, y + 0.4, z + 0.05, 0.26, 1.3, 0.6, 0, [0.9, 0.9, 0.96]);
        B.box('stone', x, y + 1.7, z - 0.1, 1.85, 0.24, 1.05, 0, [0.8, 0.8, 0.88]);
        B.box('stone', x, y + 1.94, z - 0.1, 1.3, 0.2, 0.8, 0, [0.85, 0.85, 0.92]);
        const cy = y + 1.15, cz = z - 0.38 + 0.165, NC = 12, R = 0.22;
        for (let i = 0; i < NC; i++) {
          const ta = 0.95 + (TAU - 1.9) * i / NC, tb = 0.95 + (TAU - 1.9) * (i + 1) / NC, wa = 0.1 * Math.sin(Math.PI * i / NC), wb = 0.1 * Math.sin(Math.PI * (i + 1) / NC);
          const pt = (t, rr) => [x + Math.cos(t) * rr, cy + Math.sin(t) * rr, cz];
          Q('glass', pt(ta, R), pt(tb, R), pt(tb, R - wb), pt(ta, R - wa), [0, 0, 1], [0, 0, 1, 1], [0.6, 0.76, 1.1]);
        }
        K.halo(x, cy, cz + 0.1, 1.0, [0.18, 0.27, 0.5]);
        K.addBlock(W.rectPoly([px - 24, py - 14, px + 24, py + 12]));
        rock(px - 40, py + 6, 0.5, true); rock(px + 44, py - 4, 0.6, true);
      }

      // ---- the fallen thorn tree in the east: a great trunk lying along the ground, its roots torn up ----
      {
        const [rx_, ry_] = FALLEN.root, [tx, ty] = FALLEN.top, r = W.rand(55), col = [0.8, 0.75, 0.8];
        const A = [X(rx_), TH(rx_, ry_) + 0.55, Z(ry_)], Bt = [X(tx), TH(tx, ty) + 0.3, Z(ty)];
        seg(A, add(A, mul(sub(Bt, A), 0.5)), 0.6, 0.45, 8, col); seg(add(A, mul(sub(Bt, A), 0.5)), Bt, 0.45, 0.2, 7, col);
        // the root plate, standing on edge, and roots reaching out of it
        const dir = norm(sub(A, Bt));
        for (let i = 0; i < 9; i++) { const a = i / 9 * TAU; const o = [Math.cos(a) * (1.4 + r() * 0.6), Math.sin(a) * (1.2 + r() * 0.5) + 0.6, 0]; const side = norm(cross(dir, [0, 1, 0])); const end = add(add(A, mul(side, o[0])), [0, o[1], 0]); seg(A, add(end, mul(dir, 0.3 + r() * 0.4)), 0.16, 0.03, 4, col); }
        B.geom('leafBush', K.ico[1], new THREE.Matrix4().compose(new THREE.Vector3(A[0] + dir[0] * 0.25, A[1] + 0.3, A[2] + dir[2] * 0.25), new THREE.Quaternion(), new THREE.Vector3(1.3, 1.2, 1.3)), [0.55, 0.45, 0.42], 1.5);
        // broken branches reaching up off it
        for (let i = 0; i < 6; i++) { const f = 0.35 + i * 0.1, p0 = add(A, mul(sub(Bt, A), f)); const d = norm([(r() - 0.5) * 0.8, 1, (r() - 0.5) * 0.8]); seg(p0, add(p0, mul(d, 1.2 + r() * 1.4)), 0.12, 0.02, 4, col); }
        K.addBlock(ribbon([FALLEN.root, FALLEN.top], 0.6)); K.addBlock(K.circlePx(rx_, ry_, 1.6, 10));
        K.shadeMarks.push(['dot', (rx_ + tx) / 2, (ry_ + ty) / 2, 120, 0.75]);
      }

      // ---- the ruined walls in the south: broken drystone, a doorway, rubble, a thorn tree grown up inside ----
      {
        const r = W.rand(77);
        for (const [a, b, h] of RUIN) {
          const A = [X(a[0]), Z(a[1])], Bp = [X(b[0]), Z(b[1])], dx = Bp[0] - A[0], dz = Bp[1] - A[1], L = Math.hypot(dx, dz), ry = Math.atan2(-dz, dx), n = Math.max(1, Math.ceil(L / 0.9));
          for (let i = 0; i < n; i++) {
            const f = (i + 0.5) / n, x = A[0] + dx * f, z = A[1] + dz * f, px = M2px(x), py = M2py(z), g = TH(px, py), hh = h * (0.45 + 0.55 * Math.abs(Math.sin(i * 1.7 + h * 3))) + r() * 0.2;
            B.box('stone', x, g - 0.4, z, L / n + 0.02, hh + 0.4, 0.6, ry, [0.88, 0.88, 0.94], { u0: i * L / n });
          }
          K.addBlock(ribbon([a, b], 0.35));
        }
        for (let i = 0; i < 12; i++) rock(1180 + r() * 260, 1540 + r() * 170, 0.22 + r() * 0.25, false, [0.85, 0.85, 0.92]);
        deadTree(1350, 1640, 1.3, 901, [0.1, -0.1]);
        mound(1215, 1640, 1.0, r, false); mound(1400, 1600, 0.9, r, false);
      }

      // ---- the still pool in the south-west: the engine lays the water and its rocks; a thorn tree leans over it ----
      {
        const band = (poly, w) => { const c = poly.reduce((s, p) => [s[0] + p[0] / poly.length, s[1] + p[1] / poly.length], [0, 0]); const out = poly.map(([x, y]) => { const dx = x - c[0], dy = y - c[1], l = Math.hypot(dx * SX, dy * SZ) || 1; return [x + dx * SX / l * w / SX, y + dy * SZ / l * w / SZ]; }); const inn = poly.map(([x, y]) => { const dx = x - c[0], dy = y - c[1], l = Math.hypot(dx * SX, dy * SZ) || 1; return [x - dx * SX / l * 0.15 / SX, y - dy * SZ / l * 0.15 / SZ]; }); return out.concat([out[0]], [inn[0]], inn.slice().reverse()); };
        K.addBlock(band(POOLP, 1.1));
        K.addBlock(band(FROGP, 0.25));
      }

      // ---- the frog-ring's hollow: a ring of mossy boulders where the north-east track gives out, its way in on the
      // east, behind a thorn thicket; a little frog pool inside ----
      {
        const [cx, cy] = FROG.c, r = W.rand(61);
        for (let i = 0; i < 17; i++) {
          const a = FROG.gap + 0.72 + (TAU - 1.44) * i / 16, d = FROG.r + (r() - 0.5) * 0.25, s = 0.62 + r() * 0.24;
          rock(cx + Math.cos(a) * d / SX, cy + Math.sin(a) * d / SZ, s, false, [0.95, 1.0, 0.95]);
        }
        ringBlock(FROG.c, FROG.r - 0.65, FROG.r + 0.75, FROG.gap, 0.3);
        // the screen in front of the way in
        mound(cx + (FROG.r + 3.2) / SX, cy - 8, 1.5, r, true); mound(cx + (FROG.r + 3.0) / SX, cy + 28, 1.2, r, true);
        deadTree(cx + (FROG.r + 4.2) / SX, cy + 6, 1.2, 611, [-0.3, 0]);
        lily(cx - 6, cy - 16, 0.35, frogLevel() + 0.03); lily(cx + 10, cy - 6, 0.3, frogLevel() + 0.03);
      }

      // ---- the brooch's hollow: a ring of thorn where Chris's trail into the dark woods gives out, its way in on the
      // south, round the back ----
      {
        const [cx, cy] = BROOCH.c, r = W.rand(71);
        for (let i = 0; i < 12; i++) {
          const a = BROOCH.gap + 0.85 + (TAU - 1.7) * i / 11, d = BROOCH.r + 0.1;
          mound(cx + Math.cos(a) * d / SX, cy + Math.sin(a) * d / SZ, 1.25 + r() * 0.35, r, false);
        }
        ringBlock(BROOCH.c, BROOCH.r - 0.6, BROOCH.r + 1.0, BROOCH.gap, 0.3);
        deadTree(cx - 70, cy + 40, 1.3, 711, [0.2, -0.2]); deadTree(cx + 20, cy - 66, 1.2, 712, [0, 0.3]);
      }

      // ---- the mist: low banks of cold blue lying between the trees (soft glows, drawn last) ----
      for (const [px, py, s] of MIST) K.halo(X(px), TH(px, py) + s * 0.1, Z(py), s, [0.13, 0.17, 0.3]);

      function M2px(x) { return K.M.px(x); }
      function M2py(z) { return K.M.py(z); }
    },
  };
})(window);
