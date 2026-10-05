// maps.js: the ground-level maps traced for walking (plan step 18): the thirteen of art request 04, then the eight
// wilderness scenes at night (art request 12, Chris's pictures, October 5), which join each band's camp, where the
// Magpie lands, to its town: band 2 the Warm Roads camp, the Ember Line road and the forest road up to Dawnroost; band 3
// the northern camp, Eldergrove's edge and the cold moor to the crossroads; band 4 the frozen camp and Frostmere's shore
// up to the frozen pass. Nobody walks the world map since then (Chris, October 3: it is only for flying the Magpie).
// Every position is in the paintings' own 1536 x 1024 pixels, whatever size the image ships at. For each map:
//   walk:   polygons Io's feet can stand inside (their union): the painted ground she can see, the cobbles, paths, stairs,
//           decks and bridges, traced close to the painting (October 3, the paper-doll walk); block: polygons cut out of
//           them (wells, stalls, rocks, lamp posts' feet)
//   front:  pieces of the painting that stand up off the ground (lamp posts, trees, the well's frame), each { pts, base }:
//           the piece is drawn again over Io, or anyone, whose feet are above (behind) its base line
//   exits:  rectangles that take her to another map (`to`, arriving at `at` there, facing `dir`, or facing the viewer
//           when it isn't given). `to: 'world'` is a road out of the picture into the wide world, which she turns back
//           from, saying its line (`say`, a scene in script.js): the world map is only flown now
//   people: who stands where, how they look (`look`, a pixel figure from sprites.js) and what they say (`talk`, in
//           script.js); `role` makes them a shop or an inn
//   spots:  things to look at or use: `rest` (an inn bed or a camp: HP and MP back, and the game is saved), `well` (a
//           small well with a letter and a gift), `event` (a story beat or a set fight when she walks into `rect`),
//           `look`, `magpie` (where the Magpie moors at a dock; game.js shows it only while she's moored there), and
//           `node` (an Ember Line node on its road, with the world map's ids node1 to node3, so saves carry over: Sol
//           relights it once, and then it is dark) (the keepsakes' spots come from envoi-final-draft/items/items.js:
//           the game adds them, as `keepsake`)
//   kind:   'camp' for the three camps (a rest by the fire, a landing ground, no fights) and 'wild' for the five walks;
//           land: a camp's landing ground (its middle), where the Magpie sets down: game.js puts her spot there and
//           Io steps down 40 px south of it. (`music` on the scenes is read by nothing: game.js's MUSIC picks the songs)
//   wild:   random encounters on this map: the band, the battle backdrop, and the encounter rate
// Defines globalThis.MAPS.
(function (G) {
  'use strict';
  // a rough circle as a polygon, for wells and round things
  const ring = (cx, cy, r, n) => Array.from({ length: n || 14 }, (_, i) => { const a = i / (n || 14) * Math.PI * 2; return [Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r * 0.8)]; });
  // points along an ellipse's rim from angle a0 to a1 (degrees: 0 east, 90 south)
  const arc = (cx, cy, rx, ry, a0, a1, n) => Array.from({ length: n + 1 }, (_, i) => { const a = (a0 + (a1 - a0) * i / n) * Math.PI / 180; return [Math.round(cx + Math.cos(a) * rx), Math.round(cy + Math.sin(a) * ry)]; });
  // a lamp post (or any thin upright thing) standing on the walk: its foot is a block, and the post and its lantern a
  // front. x: the post's middle; base: where it stands; top: the lantern's top
  const lamp = (x, base, top) => ({ block: [[x - 8, base - 9], [x + 8, base - 9], [x + 8, base + 3], [x - 8, base + 3]], front: { pts: [[x - 11, top], [x + 11, top], [x + 11, top + 34], [x + 5, top + 40], [x + 6, base + 2], [x - 6, base + 2], [x - 5, top + 40], [x - 11, top + 34]], base } });
  const lampBlocks = (ls) => ls.map((l) => l.block), lampFronts = (ls) => ls.map((l) => l.front);
  // Wickhollow's lamps: the four round the Moonwell, and the one by the west stairs
  const WICK_LAMPS = [lamp(659, 392, 310), lamp(904, 392, 310), lamp(640, 595, 509), lamp(914, 595, 509), lamp(260, 590, 525)];
  // the frozen pass's one lamp, west of the road below the bridge (its lantern hangs out east on a bracket: a front of its own)
  const PASS_LAMPS = [lamp(590, 683, 563)];
  // Misthollow's lamps, each at the walk's edge: three up each side of the street (the middle one on the west side by
  // the chapel yard), the two over the great stair, the two on the lower square's south wall, and the one on the lit
  // landing of the west stairs
  const MIST_LAMPS = [lamp(697, 118, 18), lamp(697, 333, 202), lamp(697, 598, 476), lamp(833, 118, 18), lamp(834, 330, 200), lamp(835, 598, 476),
    lamp(598, 693, 637), lamp(925, 693, 637), lamp(560, 940, 889), lamp(971, 940, 889), lamp(283, 258, 187)];
  // Bogmire's lamps: two on the west dock's rail, one where the dock meets the west boardwalk, one at the square's
  // south-east corner, one where the east boardwalk turns south, and one on the south-east dock
  const BOG_LAMPS = [lamp(145, 482, 439), lamp(145, 620, 579), lamp(251, 462, 392), lamp(1007, 530, 481), lamp(1303, 432, 372), lamp(1460, 760, 724)];
  // the two lanterns still burning at the near corners of the fen's dark heart
  const HEART_LAMPS = [lamp(540, 688, 616), lamp(995, 690, 612)];
  // Dawnroost's lamps: the two inside the north gate, one either side of the road by the well and the Warden hall, the
  // one on the dock by the gateway, and the two on the dock's east rail
  const DAWN_LAMPS = [lamp(546, 278, 197), lamp(692, 278, 197), lamp(551, 524, 444), lamp(706, 507, 422), lamp(1314, 366, 318), lamp(1504, 276, 237), lamp(1504, 381, 331)];
  // the living node's lamps: one on each wall walk, at the top of its stairs
  const NODE_LAMPS = [lamp(158, 108, 64), lamp(1381, 109, 64)];
  // the shipyard's lamps: in the yard, on the battlement's corners and pillars, on the quays and by the stairs
  const SHIP_LAMPS = [lamp(597, 522, 471), lamp(917, 520, 465), lamp(374, 558, 518), lamp(310, 628, 587), lamp(226, 459, 409), lamp(1100, 562, 521), lamp(1177, 632, 588), lamp(1345, 630, 582), lamp(1463, 397, 360), lamp(1067, 279, 231)];
  // the jetty's lamps: the two on the quay at the head of the steps, and the four along the pier
  const JETTY_LAMPS = [lamp(678, 398, 342), lamp(858, 398, 342), lamp(672, 574, 492), lamp(858, 574, 492), lamp(672, 768, 686), lamp(857, 768, 684)];
  const MAPS = {
    wickhollow: {
      name: 'Wickhollow', src: "art/walk/walk-wickhollow-square.avif", band: 1, kind: 'town', music: 'town',
      start: [777, 600],
      walk: [
        // the square: from the big house's front and Nettie's stall, past the chapel steps and the forge, over the
        // stone bridge east; down the middle house's west side to its door; and the south road down to the cottage
        [[262, 405], [299, 400], [336, 401], [352, 389], [380, 389], [394, 408], [441, 409], [435, 384], [448, 374], [496, 378], [515, 407], [559, 406], [589, 389], [614, 373], [622, 296], [735, 296], [742, 275], [742, 232], [774, 211], [810, 232], [812, 275], [822, 294], [950, 292], [967, 351], [1004, 330], [1016, 355], [1046, 354], [1047, 331], [1075, 352], [1080, 372], [1114, 386], [1161, 361], [1197, 385], [1240, 376], [1300, 354], [1426, 334], [1536, 354], [1536, 396], [1416, 405], [1264, 429], [1256, 412], [1084, 411], [1078, 498], [1040, 500], [1038, 548], [1080, 560], [1086, 618], [1125, 620], [1128, 602], [1150, 602], [1160, 625], [1162, 670], [1040, 670], [1037, 598], [966, 598], [962, 645], [850, 655], [816, 700], [816, 1024], [745, 1024], [748, 685], [701, 642], [683, 662], [669, 628], [640, 608], [606, 610], [604, 581], [576, 583], [576, 550], [560, 523], [549, 517], [546, 478], [531, 471], [531, 517], [522, 547], [494, 530], [473, 499], [467, 574], [449, 576], [455, 482], [456, 471], [486, 476], [511, 519], [512, 468], [514, 455], [375, 458], [376, 507], [365, 504], [346, 495], [320, 488], [243, 440]],
        [[266, 255], [294, 255], [294, 410], [266, 410]], // the lane up the big house's west side
        [[244, 440], [307, 450], [318, 482], [303, 523], [300, 600], [290, 640], [272, 640], [190, 640], [188, 548], [223, 533], [246, 536]], // down the west stairs and the ramp beside them
        [[160, 630], [272, 630], [272, 700], [268, 745], [264, 775], [212, 775], [205, 738], [160, 738]], // the landing, and the steps down to the lane
        [[136, 698], [175, 690], [178, 742], [136, 745]], // round the tree to the lower jetty
        [[0, 706], [152, 706], [152, 760], [0, 760]], // the lower jetty
        [[205, 772], [308, 758], [312, 818], [745, 818], [770, 844], [757, 867], [697, 869], [614, 866], [459, 878], [301, 859], [276, 851], [220, 815]], // the lane under the garden fence
        [[452, 718], [482, 718], [501, 730], [567, 724], [586, 749], [541, 761], [546, 788], [484, 783], [488, 829], [454, 822], [455, 786], [381, 780], [378, 736]], // through the garden gate to the lower house's door
        [[432, 712], [502, 712], [502, 734], [432, 734]],
        [[1150, 659], [1245, 669], [1250, 692], [1256, 706], [1238, 716], [1162, 713], [1134, 696], [1110, 678], [1107, 654]], // the nook past the bench, behind the house by the east bridge (Chris, October 4, evening)
      ],
      block: [
        // the Moonwell's low wall and flower beds, a ring open to the south, and the well itself inside it
        [[738, 555], [716, 549], [691, 533], [671, 512], [659, 488], [655, 462], [659, 436], [671, 412], [691, 391], [716, 375], [745, 365], [780, 362], [809, 365], [838, 375], [863, 391], [883, 412], [895, 436], [899, 462], [895, 488], [883, 512], [863, 533], [838, 549], [813, 551], [810, 526], [820, 517], [838, 507], [851, 494], [860, 479], [863, 462], [860, 445], [851, 430], [838, 417], [820, 407], [799, 400], [777, 396], [755, 400], [734, 407], [716, 417], [703, 430], [694, 445], [691, 462], [694, 479], [703, 494], [716, 507], [734, 517], [751, 529]],
        [[821, 452], [818, 470], [808, 485], [794, 495], [775, 486], [760, 495], [746, 485], [736, 470], [733, 452], [736, 434], [746, 419], [760, 409], [777, 405], [794, 409], [808, 419], [818, 434], [821, 452]],
        [[1046, 632], [1093, 632], [1093, 662], [1046, 662]], // the bench by the middle house
        ...lampBlocks(WICK_LAMPS),
      ],
      front: [
        WICK_LAMPS[0].front,
        { pts: [[897, 312], [911, 312], [915, 344], [909, 350], [910, 394], [898, 394], [899, 350], [893, 344]], base: 392 }, // the Moonwell's north-east lamp post, as Chris redrew it
        { pts: [[640, 508], [647, 513], [653, 522], [646, 541], [645, 549], [646, 597], [634, 597], [637, 542], [633, 535], [632, 519]], base: 595 }, // the Moonwell's south-west lamp post, as Chris redrew it
        WICK_LAMPS[3].front,
        WICK_LAMPS[4].front,
        { pts: [[741, 355], [778, 335], [812, 355], [814, 405], [819, 410], [819, 484], [802, 484], [802, 410], [752, 410], [752, 484], [735, 484], [735, 410], [740, 405]], base: 484 }, // the Moonwell's iron frame
        { pts: [[962, 572], [1040, 572], [1044, 640], [1030, 672], [972, 672], [960, 640]], base: 672 }, // the pine by the middle house
        { pts: [[304, 466], [322, 449], [356, 500], [334, 532], [296, 532], [291, 497]], base: 530 }, // the dark tree by the west stairs
        { pts: [[152, 681], [190, 680], [202, 712], [180, 730], [140, 730], [128, 712]], base: 728 }, // the tree by the lower jetty
        { pts: [[401, 455], [422, 436], [424, 426], [427, 421], [432, 425], [435, 435], [455, 455]], base: 455 },
        { pts: [[1169, 720], [1222, 678], [1232, 675], [1240, 685], [1250, 686], [1258, 690], [1274, 711], [1279, 740], [1245, 753], [1169, 726]], base: 753 }, // the bushes in front of that nook
      ],
      exits: [
        { rect: [1514, 354, 1536, 396], to: 'thornwood', at: [60, 456], label: 'The Thornwood' },
        { rect: [745, 1006, 816, 1024], to: 'cottage', at: [567, 40], label: "Io's cottage" },
        { rect: [0, 706, 18, 760], to: 'jetty', at: [782, 50], label: 'The jetty' },
      ],
      people: [
        { id: 'nettie', name: 'Nettie', at: [568, 426], look: 'witch2', talk: 'nettie', role: 'shop' },
        { id: 'hilde', name: 'Hilde', at: [1015, 364], look: 'smith', talk: 'hilde' },
        { id: 'gretch', name: 'Mayor Gretch', at: [705, 594], look: 'elder', talk: 'gretch', face0: 'e' },
      ],
      spots: [
        { kind: 'rest', at: [777, 530], label: 'The Moonwell', note: 'Lunara sleeps here. Rest, and the game is saved.' },
        // (the Crescent Locket lies at the end of Chris's secret way up the tree and along the red roof's ridge, his pick
        // on October 4: the keepsakes' places are in envoi-final-draft/items/items.js)
      ],
    },
    // Io's cottage, in the woods south of the square, with her garden: where the story starts
    cottage: {
      name: "Io's cottage", src: "art/walk/walk-wickhollow-cottage.avif", band: 1, kind: 'town', music: 'home',
      start: [838, 520],
      walk: [
        // the lane down from the square between its two lamp pillars, the nook behind the pear tree, the bend west under
        // the stone kerb, and the path down the garden's west side to the foot of the stairs
        [[502, 0], [606, 0], [606, 122], [600, 132], [605, 160], [610, 180], [614, 200], [618, 225], [622, 245], [628, 262], [724, 264], [726, 287], [700, 290], [686, 300], [602, 300], [602, 337], [530, 339], [529, 372], [522, 375], [498, 357], [472, 352], [477, 482], [448, 481], [436, 368], [408, 389], [383, 410], [374, 432], [350, 440], [347, 500], [354, 530], [358, 570], [362, 640], [359, 668], [356, 720], [360, 762], [287, 762], [286, 668], [295, 640], [295, 545], [287, 515], [262, 490], [248, 445], [254, 387], [292, 376], [313, 364], [350, 353], [381, 343], [418, 326], [458, 305], [472, 296], [492, 278], [514, 255], [540, 232], [539, 200], [532, 175], [524, 160], [514, 135], [502, 122]],
        [[0, 397], [262, 397], [262, 442], [0, 442]], // over the footbridge, between the lamp pillars
        // round the foot of the stairs and along the curving path to the south road
        [[285, 755], [360, 755], [382, 768], [400, 776], [403, 798], [425, 806], [447, 817], [468, 838], [500, 855], [512, 868], [536, 890], [583, 920], [615, 935], [654, 950], [700, 957], [745, 960], [745, 1024], [686, 1024], [670, 1010], [655, 1000], [640, 990], [630, 980], [600, 973], [575, 969], [540, 962], [510, 950], [484, 938], [457, 926], [440, 915], [423, 897], [413, 871], [400, 845], [379, 819], [339, 792], [300, 772]],
        // the south road from the garden gate down to the bottom edge
        [[757, 744], [826, 744], [828, 760], [848, 772], [878, 790], [878, 810], [848, 826], [838, 870], [836, 920], [824, 945], [815, 975], [812, 1000], [812, 1024], [742, 1024], [742, 900], [748, 800], [757, 760]],
        // through the gate and up the stepping stones to the porch
        [[760, 645], [788, 636], [792, 600], [794, 500], [866, 500], [864, 600], [852, 640], [826, 652], [826, 757], [757, 757], [757, 652]],
        // the yard along the cottage's front, from the rose bower to the woodshed, and the porch
        [[440, 468], [528, 470], [528, 477], [645, 477], [645, 470], [686, 470], [690, 505], [810, 505], [810, 480], [878, 480], [878, 505], [950, 505], [952, 472], [1000, 472], [1002, 457], [1032, 457], [1032, 522], [1090, 528], [1090, 548], [1000, 548], [990, 538], [880, 532], [798, 530], [665, 530], [650, 505], [605, 505], [605, 494], [440, 494]],
        [[577, 485], [606, 485], [606, 685], [577, 685]], // the garden path between the lavender and the white beds
        [[1054, 540], [1146, 540], [1146, 657], [1054, 657]], // the cauldron's yard
        // the painting doesn't join the forest path to the garden: the way out is past the woodshed, through the
        // hollyhocks round the garden fence's north end and under the dark fir (she is hidden behind them), over the
        // mossy ground by the old oak, to the lantern post where the forest path starts
        [[1000, 456], [1079, 446], [1103, 427], [1204, 411], [1232, 394], [1300, 394], [1345, 400], [1400, 410], [1418, 426], [1428, 448], [1428, 500], [1424, 522], [1430, 542], [1440, 562], [1446, 582], [1452, 602], [1460, 622], [1468, 642], [1478, 660], [1492, 676], [1508, 690], [1522, 702], [1536, 710], [1536, 772], [1474, 772], [1466, 756], [1458, 738], [1446, 716], [1432, 696], [1424, 674], [1416, 652], [1404, 632], [1390, 610], [1378, 586], [1368, 564], [1350, 546], [1334, 524], [1326, 500], [1300, 476], [1240, 474], [1230, 464], [1168, 464], [1136, 478], [1108, 491], [1012, 494]],
      ],
      block: [
        [[1082, 592], [1130, 592], [1130, 604], [1082, 604]], [[1100, 610], [1142, 610], [1142, 642], [1100, 642]], // the cauldron's tripod and the stump
        [[1347, 459], [1364, 459], [1364, 471], [1347, 471]], // the lantern post's foot
      ],
      front: [
        { pts: [[463, 0], [498, 0], [498, 122], [463, 122]], base: 122 }, // the lane's west lamp pillar
        { pts: [[604, 0], [641, 0], [641, 122], [604, 122]], base: 122 }, // the lane's east lamp pillar
        { pts: [[592, 300], [610, 294], [624, 284], [640, 279], [660, 290], [680, 306], [692, 330], [690, 380], [660, 410], [600, 410], [590, 360]], base: 408 }, // the pear tree behind the potting bench
        { pts: [[186, 356], [206, 356], [206, 404], [212, 404], [212, 489], [179, 489], [179, 404], [186, 404]], base: 488 }, // the footbridge's east lamp pillar
        { pts: [[208, 408], [235, 404], [262, 412], [264, 450], [250, 480], [215, 482], [208, 450]], base: 480 }, // the white bush by the footbridge
        { pts: [[53, 352], [73, 352], [73, 404], [79, 404], [79, 482], [46, 482], [46, 404], [53, 404]], base: 480 }, // the footbridge's west lamp pillar
        { pts: [[0, 394], [20, 396], [47, 408], [47, 452], [0, 452]], base: 450 }, // the low wall and the rock west of the footbridge
        { pts: [[742, 690], [744, 664], [756, 647], [776, 637], [800, 635], [822, 641], [834, 655], [841, 672], [841, 757], [826, 757], [826, 690], [818, 672], [800, 662], [780, 662], [766, 670], [757, 690], [757, 757], [742, 757]], base: 757 }, // the garden gate's arch
        { pts: [[1076, 548], [1140, 548], [1140, 604], [1076, 604]], base: 603 }, // the cauldron on its tripod
        { pts: [[1098, 590], [1144, 590], [1144, 642], [1098, 642]], base: 641 }, // the stump
        { pts: [[1028, 456], [1100, 466], [1170, 478], [1170, 548], [1144, 548], [1138, 532], [1042, 532], [1042, 548], [1026, 548]], base: 546 }, // the drying rack and its herbs
        { pts: [[1096, 376], [1160, 376], [1160, 468], [1096, 470]], base: 468 }, // the hollyhocks and pots by the woodshed
        { pts: [[1152, 412], [1168, 412], [1168, 466], [1152, 466]], base: 465 }, // the garden fence's north end post
        { pts: [[1160, 336], [1218, 336], [1222, 380], [1235, 410], [1250, 398], [1262, 420], [1272, 460], [1280, 520], [1270, 545], [1172, 545], [1166, 480], [1160, 470]], base: 543 }, // the dark fir and the bushes beside it
        { pts: [[1349, 382], [1362, 382], [1362, 395], [1396, 397], [1398, 446], [1376, 446], [1374, 410], [1362, 410], [1362, 470], [1349, 470]], base: 469 }, // the lantern post at the forest path
      ],
      exits: [
        { rect: [500, 0, 604, 20], to: 'wickhollow', at: [788, 975], label: 'Wickhollow' },
        { rect: [680, 1004, 812, 1024], to: 'world', at: 'wickhollow', label: 'The world', say: 'roadOut' },
        { rect: [0, 397, 18, 442], to: 'world', at: 'wickhollow', label: 'The world', say: 'roadOut' },
        { rect: [1516, 722, 1536, 770], to: 'world', at: 'wickhollow', label: 'The world', say: 'roadOut' },
      ],
      people: [],
      spots: [
        { kind: 'rest', at: [838, 470], label: 'Home', note: "Io's own bed. Rest, and the game is saved." },
        { kind: 'look', at: [592, 466], label: 'The letters', note: 'A bundle of letters to the dead, tied with ribbon. Every year Io means to burn them on the longest night, and every year she doesn’t.' },
      ],
    },
    // the jetty on the lake west of the square, where Quill moors his old skiff, the Magpie
    jetty: {
      name: 'The jetty', src: "art/walk/walk-wickhollow-jetty.avif", band: 1, kind: 'town', music: 'town',
      start: [782, 60],
      walk: [
        // the lane down from the square, between its two lamp pillars, to the waterfront
        [[706, 0], [830, 0], [830, 110], [823, 116], [823, 196], [836, 200], [836, 340], [700, 340], [700, 200], [708, 194], [708, 116], [706, 110]],
        [[570, 158], [610, 150], [650, 146], [676, 150], [676, 192], [708, 196], [708, 254], [640, 256], [640, 244], [605, 244], [570, 246]], // the lamplit corner west of the lane
        [[823, 196], [855, 196], [862, 200], [935, 198], [938, 248], [908, 248], [908, 238], [872, 238], [872, 250], [836, 254], [836, 200]], // and the one east of it
        // the waterfront along the top of the quay wall, from the worn track by the willow to Quill's stall, round his
        // crates and barrels
        [[425, 345], [580, 340], [700, 336], [836, 336], [870, 338], [908, 334], [990, 334], [990, 345], [1040, 348], [1063, 352], [1063, 362], [1105, 362], [1105, 346], [1160, 346], [1160, 376], [1256, 376], [1258, 398], [1100, 400], [900, 403], [700, 403], [650, 397], [640, 390], [592, 388], [582, 378], [425, 378]],
        [[700, 398], [836, 398], [836, 450], [700, 450]], // the steps down to the pier
        [[700, 446], [838, 446], [842, 480], [872, 482], [872, 796], [660, 796], [660, 490], [700, 488]], // the pier, between the barrels at its head
      ],
      block: [...lampBlocks(JETTY_LAMPS)],
      front: [
        ...lampFronts(JETTY_LAMPS),
        { pts: [[682, 72], [702, 72], [702, 114], [708, 114], [708, 192], [676, 192], [676, 114], [682, 114]], base: 192 }, // the lane's west lamp pillar
        { pts: [[828, 72], [848, 72], [848, 114], [855, 114], [855, 192], [823, 192], [823, 114], [828, 114]], base: 192 }, // the lane's east lamp pillar
        { pts: [[612, 188], [634, 188], [634, 243], [640, 243], [640, 330], [605, 330], [605, 243], [612, 243]], base: 330 }, // the lamp on the west wall's end
        { pts: [[878, 188], [900, 188], [900, 236], [908, 236], [908, 322], [872, 322], [872, 236], [878, 236]], base: 322 }, // the lamp on the east wall's end
        { pts: [[715, 766], [739, 766], [739, 816], [715, 816]], base: 815 }, { pts: [[803, 766], [825, 766], [825, 816], [803, 816]], base: 815 }, // the two bollards at the pier's end
      ],
      exits: [
        { rect: [706, 0, 830, 20], to: 'wickhollow', at: [40, 740], label: 'Wickhollow' },
      ],
      people: [
        { id: 'quill', name: 'Quill', at: [1150, 385], look: 'sailor', talk: 'quill', role: 'shop' },
      ],
      spots: [
        { kind: 'magpie', at: [768, 760], label: 'The Magpie', note: 'Quill’s old skiff, moored at the end of the pier.' },
      ],
    },
    // the Thornwood: the road east from Wickhollow's bridge over the stream, past the moon stone, on to Bogmire. Wild.
    thornwood: {
      name: 'The Thornwood', src: "art/walk/walk-thornwood.avif", band: 1, kind: 'wild', music: 'wild',
      start: [60, 456],
      walk: [
        // the road: in from the west, over the old bridge between its parapets, through the fork below the moon stone's
        // clearing, and on east to Bogmire
        [[0, 400], [40, 400], [70, 404], [90, 414], [110, 428], [150, 432], [165, 440], [200, 444], [238, 448], [264, 448], [280, 442], [300, 436], [330, 428], [360, 424], [380, 423], [400, 424], [430, 428], [460, 434], [490, 442], [502, 448], [528, 448], [560, 450], [600, 452], [640, 455], [660, 466], [690, 474], [720, 480], [760, 478], [800, 470], [850, 468], [870, 452], [886, 440], [900, 400], [1000, 395], [1100, 395], [1150, 400], [1172, 420], [1178, 455], [1200, 466], [1240, 474], [1270, 486], [1286, 496], [1322, 512], [1360, 520], [1440, 516], [1470, 508], [1536, 504], [1536, 562], [1500, 562], [1470, 556], [1440, 566], [1400, 578], [1360, 580], [1320, 578], [1290, 574], [1260, 568], [1230, 560], [1203, 591], [1124, 611], [1034, 626], [1150, 516], [1120, 494], [1100, 486], [1080, 464], [1060, 455], [1040, 446], [1000, 446], [980, 450], [963, 481], [940, 481], [920, 493], [900, 510], [880, 513], [860, 538], [961, 617], [1182, 594], [1098, 641], [963, 654], [756, 589], [699, 568], [645, 557], [624, 540], [590, 521], [600, 512], [560, 506], [540, 500], [528, 482], [502, 482], [480, 478], [450, 472], [420, 468], [380, 467], [340, 469], [310, 474], [280, 480], [264, 482], [238, 484], [215, 488], [190, 494], [160, 498], [140, 496], [120, 486], [100, 482], [80, 480], [60, 476], [40, 470], [20, 464], [0, 462]],
        // the moon stone's clearing, up from the fork: west of the stone, and the cobbles behind the rocks there
        [[884, 446], [880, 410], [868, 390], [880, 372], [876, 360], [852, 350], [846, 334], [800, 324], [812, 306], [834, 296], [846, 280], [856, 262], [872, 254], [884, 244], [896, 232], [710, 127], [780, 126], [888, 148], [930, 164], [960, 182], [984, 188], [990, 230], [984, 252], [966, 268], [952, 290], [948, 316], [956, 336], [1000, 340], [1034, 344], [1032, 400], [960, 400]],
        // and east of it, the arm that bends back up to the stone's far side
        [[1090, 400], [1110, 386], [1130, 362], [1140, 330], [1136, 304], [1112, 292], [1100, 262], [1080, 252], [894, 213], [923, 184], [1100, 232], [1124, 197], [1064, 112], [1164, 184], [1190, 217], [1339, 172], [1369, 132], [1409, 186], [1200, 262], [1228, 268], [1250, 288], [1262, 310], [1313, 346], [1480, 385], [1469, 417], [1241, 378], [1192, 382], [1176, 402], [1170, 420], [1100, 420]],
        [[981, 643], [979, 684], [1001, 720], [1046, 751], [1075, 783], [1110, 800], [1153, 805], [1218, 819], [1275, 805], [1305, 795], [1307, 834], [1208, 856], [1092, 845], [1021, 811], [971, 754], [924, 655], [932, 625]],
      ],
      block: [
        [[880, 252], [940, 252], [944, 292], [884, 296]], // the rocks west of the stone
      ],
      front: [
        { pts: [[994, 196], [1010, 186], [1040, 186], [1056, 200], [1058, 306], [992, 306]], base: 305 }, // the moon stone
        { pts: [[876, 246], [944, 246], [948, 296], [876, 298]], base: 296 }, // the rocks west of it
        { pts: [[0, 436], [30, 432], [66, 448], [66, 500], [40, 560], [0, 560]], base: 560 }, // the dead tree over the road's west end
        { pts: [[1150, 520], [1180, 508], [1240, 512], [1290, 540], [1290, 600], [1240, 620], [1150, 620]], base: 620 }, // the dead tree over the road east of the fork
      ],
      exits: [
        { rect: [0, 400, 18, 462], to: 'wickhollow', at: [1490, 378], label: 'Wickhollow' },
        { rect: [1518, 504, 1536, 562], to: 'bogmire', at: [70, 368], label: 'Bogmire' },
      ],
      people: [],
      spots: [
        { kind: 'well', id: 'moonstone', at: [1010, 336], label: 'The moon stone', note: 'An old stone with the crescent cut deep in it. Someone has left something at its foot.' },
        // (the Warden's Brooch lies where Chris's trail into the dark woods south of the road gives out, his pick on
        // October 4, "in the spooky woods": items.js)
      ],
      wild: { band: 1, scene: 'thornwood-bridge', rate: 1 },
    },
    // Bogmire: the stilt town on the fen, its boardwalks round a market square. The great wraith has stolen its lamps.
    bogmire: {
      name: 'Bogmire', src: "art/walk/walk-bogmire.avif", band: 1, kind: 'town', music: 'town',
      start: [70, 368],
      walk: [
        // the landing platform at the west edge, where the Thornwood road comes in, and the west dock running south from
        // it (its three fingers for the punts are railed off)
        [[34, 341], [245, 341], [245, 391], [34, 391]],
        [[151, 385], [233, 385], [233, 638], [151, 638]],
        [[230, 389], [372, 389], [376, 413], [526, 413], [526, 450], [258, 450], [258, 432], [230, 432]], // the west boardwalk into the square
        [[331, 236], [368, 236], [368, 392], [331, 392]], // the stair up to the north-west house
        [[326, 218], [388, 218], [388, 212], [486, 212], [486, 216], [550, 216], [550, 211], [688, 211], [688, 245], [326, 247]], // its porch, and the bridge along to the next house's door
        [[524, 413], [527, 386], [548, 352], [596, 334], [948, 334], [990, 352], [1020, 382], [1024, 410], [1024, 536], [532, 536], [532, 452], [524, 450]], // the market square
        [[765, 0], [814, 0], [814, 338], [765, 338]], [[741, 119], [838, 119], [838, 146], [741, 146]], // the long walk north, to the fen's dark heart
        [[812, 205], [1012, 205], [1012, 234], [812, 234]], // the north-east house's porch
        [[1022, 410], [1302, 410], [1302, 450], [1022, 450]], // the east boardwalk
        [[1197, 298], [1231, 298], [1231, 413], [1197, 413]], [[1176, 292], [1190, 292], [1190, 281], [1240, 281], [1240, 302], [1176, 302]], // up the inn's stair to its door
        [[1259, 448], [1305, 448], [1305, 690], [1269, 690], [1269, 628], [1259, 628]], // south on the east side
        [[1266, 688], [1336, 688], [1336, 766], [1302, 766], [1302, 806], [1266, 806]], [[1334, 723], [1478, 723], [1478, 761], [1334, 761]], // the south-east dock
        [[856, 772], [1300, 772], [1300, 806], [856, 806]], [[1061, 726], [1090, 726], [1090, 774], [1061, 774]], // along the south-east houses
        [[757, 534], [812, 534], [812, 736], [790, 736], [790, 822], [757, 822]], [[722, 820], [823, 820], [823, 879], [722, 879]], // south from the square to the water stair
        [[638, 716], [722, 716], [722, 711], [758, 711], [758, 757], [638, 757]], // the bridge west
        [[609, 692], [643, 692], [643, 802], [609, 802]], [[370, 773], [643, 773], [643, 801], [370, 801]], [[370, 690], [402, 690], [402, 801], [370, 801]], // round the south-west house
        [[302, 727], [372, 727], [372, 772], [302, 772]], // the little dock
      ],
      block: [
        [[116, 339], [133, 339], [133, 351], [116, 351]], [[150, 347], [167, 347], [167, 361], [150, 361]], // the mooring post, and the mooring crane's foot
        [[172, 336], [207, 336], [207, 357], [172, 357]], [[219, 336], [247, 336], [247, 383], [229, 383], [229, 358], [219, 358]], [[243, 380], [260, 380], [260, 392], [243, 392]], // barrels and posts on the landing
        [[152, 614], [175, 614], [175, 645], [152, 645]], // the barrel at the dock's south end
        [[387, 210], [411, 210], [411, 228], [387, 228]], [[576, 205], [592, 205], [592, 219], [576, 219]], [[628, 205], [690, 205], [690, 225], [628, 225]], // a barrel, a planter and a bench on the porches
        [[966, 196], [993, 196], [993, 218], [966, 218]], // barrels on the north-east porch
        [[578, 334], [724, 334], [724, 460], [578, 460]], [[833, 334], [976, 334], [976, 458], [833, 458]], // the herb stall and the trader's stall
        [[756, 444], [806, 444], [806, 490], [793, 490], [793, 514], [758, 514], [758, 490], [756, 490]], // the lamp's planter and the notice board
        [[525, 472], [538, 472], [538, 485], [525, 485]], // the bollard where the boardwalk meets the square
        [[548, 528], [563, 528], [563, 540], [548, 540]], [[566, 531], [584, 531], [584, 545], [566, 545]], [[970, 527], [986, 527], [986, 540], [970, 540]], // the dark lanterns
        [[597, 503], [693, 503], [693, 540], [597, 540]], [[869, 502], [943, 502], [943, 540], [869, 540]], [[986, 522], [1024, 522], [1024, 540], [986, 540]], // two covered carts, a tub and crates
        [[1264, 404], [1298, 404], [1298, 431], [1264, 431]], // a barrel and a sack at the corner
        [[1300, 775], [1318, 775], [1318, 806], [1300, 806]], // a barrel by the south-east dock
        [[420, 762], [442, 762], [442, 780], [420, 780]], [[462, 762], [482, 762], [482, 780], [462, 780]], // planters by the south-west house
        [[1114, 762], [1164, 762], [1164, 783], [1114, 783]], // barrels by the south-east house
        [[856, 765], [891, 765], [891, 780], [856, 780]], [[895, 765], [916, 765], [916, 780], [895, 780]], [[966, 765], [988, 765], [988, 780], [966, 780]], [[988, 765], [1022, 765], [1022, 778], [988, 778]], // tables and planters by the south house
        [[735, 852], [780, 852], [780, 880], [735, 880]], [[712, 834], [725, 834], [725, 846], [712, 846]], // crates and a barrel on the water stair, and its lamp
        ...lampBlocks(BOG_LAMPS),
      ],
      front: [
        ...lampFronts(BOG_LAMPS),
        { pts: [[744, 358], [799, 358], [799, 401], [776, 403], [776, 424], [806, 432], [806, 492], [756, 492], [756, 432], [766, 424], [766, 403], [744, 401]], base: 490 }, // the lamp in the square, in its planter
        { pts: [[757, 470], [794, 470], [794, 515], [757, 515]], base: 513 }, // the notice board
        { pts: [[525, 428], [538, 428], [538, 485], [525, 485]], base: 483 }, // the bollard
        { pts: [[547, 495], [563, 495], [563, 541], [547, 541]], base: 539 }, { pts: [[565, 496], [584, 496], [584, 545], [565, 545]], base: 543 }, { pts: [[969, 495], [987, 495], [987, 540], [969, 540]], base: 537 }, // the dark lanterns
        { pts: [[150, 292], [168, 292], [168, 362], [150, 362]], base: 360 }, // the mooring crane's post
        { pts: [[710, 38], [744, 38], [744, 148], [729, 148], [729, 76], [710, 76]], base: 147 }, // the lamp pole by the long walk
        { pts: [[688, 814], [714, 814], [714, 796], [725, 796], [725, 846], [712, 846], [712, 842], [688, 842]], base: 844 }, // the lamp on the water stair
        { pts: [[735, 828], [780, 828], [780, 880], [735, 880]], base: 879 }, // crates and a barrel on the water stair
      ],
      exits: [
        { rect: [34, 341, 52, 391], to: 'thornwood', at: [1500, 532], label: 'The Thornwood' },
        { rect: [765, 0, 814, 18], to: 'bogmire-heart', at: [768, 980], label: "The fen's dark heart" },
      ],
      people: [
        { id: 'wenna', name: 'Old Wenna', at: [652, 470], look: 'elder', talk: 'wenna', role: 'shop' },
        { id: 'tobb', name: 'Tobb', at: [1184, 296], look: 'smith', talk: 'tobb', role: 'inn', face0: 'e' },
        { id: 'pell', name: 'Pell', at: [744, 354], look: 'child', talk: 'pell', face0: 'n' },
      ],
      spots: [
        { kind: 'rest', at: [1208, 281], label: 'The Lanternless Inn', note: 'Tobb keeps a bed for anyone who brings light. Rest, and the game is saved.' },
        { kind: 'well', id: 'bogwell', at: [711, 866], label: 'The water stair', note: 'A bucket on a rope, and something wrapped in oilcloth tied to it.' },
      ],
    },
    // the fen's dark heart: the drowned square north of Bogmire, where the great wraith sits on the stolen lamps (the gate)
    'bogmire-heart': {
      name: "The fen's dark heart", src: "art/walk/walk-bogmire-heart.avif", band: 1, kind: 'gate', music: 'dread',
      start: [768, 980],
      walk: [
        [[727, 660], [810, 660], [810, 1024], [727, 1024]], // the long walk in from Bogmire
        // the square, its broken corners and boards left out
        [[548, 308], [940, 308], [1035, 350], [1035, 668], [550, 668], [503, 618], [503, 342]],
        [[440, 428], [484, 428], [484, 450], [503, 450], [503, 505], [440, 505]], [[1053, 425], [1097, 425], [1097, 505], [1035, 505], [1035, 452], [1053, 452]], // the side decks
        [[735, 179], [801, 179], [801, 312], [735, 312]], // up to the drowned hall's door
      ],
      block: [
        [[500, 360], [541, 360], [541, 379], [500, 379]], [[500, 504], [541, 504], [541, 519], [500, 519]], [[500, 598], [531, 598], [531, 623], [500, 623]], [[549, 354], [566, 354], [566, 366], [549, 366]], [[549, 394], [566, 394], [566, 403], [549, 403]], // broken boards by the west rail
        [[1005, 405], [1040, 405], [1040, 428], [1005, 428]], [[1013, 448], [1040, 448], [1040, 458], [1013, 458]], [[999, 494], [1040, 494], [1040, 518], [999, 518]], // and by the east rail
        [[613, 647], [642, 647], [642, 670], [613, 670]], [[878, 647], [927, 647], [927, 670], [878, 670]], // and by the south rail
        [[690, 176], [741, 176], [741, 205], [690, 205]], [[795, 176], [813, 176], [813, 205], [795, 205]], // barrels at the hall's door
        ...lampBlocks(HEART_LAMPS),
      ],
      front: [...lampFronts(HEART_LAMPS)],
      exits: [
        { rect: [727, 1006, 810, 1024], to: 'bogmire', at: [790, 30], label: 'Bogmire' },
      ],
      people: [],
      spots: [
        { kind: 'event', id: 'greatWraith', rect: [500, 300, 1045, 620], fight: 'greatWraith', once: 'greatWraith' },
      ],
    },
    // Dawnroost, the Warden waystation: Sol's old home inside its walls, with the dock where the Magpie ties up
    dawnroost: {
      name: 'Dawnroost', src: "art/walk/walk-dawnroost.avif", band: 2, kind: 'town', music: 'town',
      start: [645, 990],
      walk: [
        [[590, 0], [648, 0], [648, 196], [590, 196]], // out through the north gate, up to the living node
        [[520, 192], [916, 184], [947, 217], [829, 207], [756, 232], [520, 232]], // the forecourt inside the gate
        [[108, 205], [540, 205], [540, 232], [528, 243], [140, 243], [140, 226], [108, 226]], // the lane behind the Warden hall
        [[579, 226], [674, 222], [732, 230], [670, 275], [661, 376], [677, 382], [677, 452], [619, 512], [565, 452], [565, 416], [579, 416]], // the road down from the gate
        // the yard in front of the Warden hall, from the hall's door down to the weapon racks and the chained posts, and
        // the way east to the road, behind the two trees over the cottage
        [[140, 470], [224, 470], [224, 471], [251, 471], [251, 468], [273, 468], [273, 460], [291, 460], [291, 450], [319, 450], [319, 446], [361, 446], [361, 450], [385, 450], [385, 464], [407, 464], [407, 450], [424, 450], [424, 474], [566, 474], [566, 456], [584, 456], [584, 516], [484, 516], [484, 505], [355, 505], [355, 516], [327, 516], [327, 548], [316, 548], [316, 572], [150, 572], [150, 540], [140, 540]],
        [[584, 456], [684, 456], [684, 500], [680, 560], [690, 628], [584, 628]], // the road past the well
        // the yard east of the road: past the paddock fence, round the well, to the forge
        [[662, 406], [762, 406], [763, 447], [859, 459], [1126, 459], [1138, 385], [1244, 456], [1244, 490], [1196, 490], [1196, 470], [1156, 470], [1156, 528], [1116, 528], [1116, 520], [1086, 520], [1086, 506], [1028, 506], [1028, 518], [990, 518], [990, 532], [982, 548], [948, 560], [948, 652], [684, 652], [684, 470], [662, 470]],
        [[584, 626], [690, 626], [690, 640], [948, 640], [948, 652], [840, 656], [840, 682], [776, 684], [764, 698], [584, 698]], // south of the well
        [[880, 640], [948, 640], [948, 646], [966, 646], [966, 667], [1164, 667], [1164, 720], [1022, 720], [1022, 709], [943, 709], [943, 692], [930, 690], [930, 664], [880, 662]], // between the pines to the forge's open front
        [[600, 696], [692, 696], [692, 848], [600, 848]], [[588, 840], [700, 840], [692, 900], [690, 1024], [592, 1024], [588, 900]], // out through the main gate, and the hill road
        // the lane east of the stables, round to the gateway in the east wall, and the dock
        [[918, 204], [1062, 245], [1198, 254], [1206, 300], [1252, 304], [1252, 358], [1195, 365], [1194, 470], [1152, 470], [1152, 340], [1080, 340], [1089, 299], [1049, 271], [972, 241], [882, 224]],
        [[1236, 288], [1302, 288], [1302, 356], [1236, 356]],
        [[1296, 204], [1424, 204], [1500, 258], [1500, 402], [1296, 402]],
      ],
      block: [
        ...lampBlocks(DAWN_LAMPS),
        [[126, 202], [174, 202], [174, 236], [126, 236]], // barrels behind the hall
        [[140, 470], [212, 470], [212, 540], [140, 540]], [[221, 482], [266, 482], [266, 528], [221, 528]], [[313, 486], [329, 486], [329, 548], [313, 548]], // the weapon rack, the chained posts and the tall post
        // the well among its flower beds, with its bench, a barrel and a crate
        [[682, 498], [744, 494], [744, 516], [822, 516], [826, 506], [840, 512], [868, 522], [872, 562], [866, 612], [826, 620], [770, 626], [724, 630], [690, 612], [680, 560]],
        [[966, 648], [984, 648], [984, 684], [966, 684]], [[984, 664], [992, 664], [992, 680], [984, 680]], [[1028, 664], [1042, 664], [1042, 674], [1028, 674]], [[1075, 664], [1089, 664], [1089, 678], [1075, 678]], // a barrel and the forge's posts
        [[1015, 668], [1059, 668], [1059, 695], [1015, 695]], [[1110, 672], [1147, 672], [1147, 702], [1110, 702]], [[1164, 668], [1202, 668], [1202, 720], [1164, 720]], // the anvils and the grindstone
        [[1224, 285], [1254, 285], [1254, 309], [1224, 309]], // a barrel by the gateway
        [[1340, 195], [1450, 195], [1450, 272], [1374, 272], [1374, 248], [1340, 248]], // the dock's crane and crates
        [[1328, 374], [1354, 374], [1354, 402], [1328, 402]], [[1353, 368], [1373, 368], [1373, 402], [1353, 402]], [[1437, 368], [1457, 368], [1457, 402], [1437, 402]], // a barrel and the mooring posts
      ],
      front: [
        ...lampFronts(DAWN_LAMPS),
        { pts: [[540, 40], [702, 40], [702, 194], [654, 194], [654, 128], [646, 116], [634, 110], [619, 107], [604, 110], [592, 116], [586, 128], [586, 194], [540, 194]], base: 192 }, // the north gate's arch
        { pts: [[578, 722], [602, 722], [602, 846], [578, 846]], base: 844 }, { pts: [[690, 722], [713, 722], [713, 846], [690, 846]], base: 844 }, // the main gate's open doors
        { pts: [[720, 646], [745, 646], [745, 702], [720, 702]], base: 700 }, // the lamp on the gate tower
        { pts: [[741, 475], [825, 475], [825, 522], [741, 522]], base: 520 }, // the well's roof
        { pts: [[1116, 482], [1156, 482], [1156, 536], [1116, 536]], base: 534 }, // the forge's chimney
        ...[214, 305, 382, 470].map((x) => ({ pts: [[x, 218], [x + 23, 218], [x + 23, 250], [x, 250]], base: 245 })), // the hall's chimneys
        { pts: [[366, 472], [414, 472], [428, 486], [430, 518], [352, 518], [352, 486]], base: 518 }, { pts: [[450, 480], [478, 480], [488, 494], [488, 520], [440, 520], [440, 494]], base: 518 }, // the trees over the cottage
        { pts: [[150, 542], [221, 542], [221, 554], [249, 554], [249, 544], [265, 544], [265, 554], [302, 554], [302, 544], [316, 544], [316, 590], [302, 590], [302, 576], [265, 576], [265, 590], [249, 590], [249, 576], [221, 576], [221, 596], [150, 596]], base: 590 }, // the second rack and its chained posts
        { pts: [[1351, 364], [1375, 364], [1375, 406], [1351, 406]], base: 403 }, { pts: [[1435, 364], [1459, 364], [1459, 406], [1435, 406]], base: 403 }, // the mooring posts
      ],
      exits: [
        { rect: [590, 0, 648, 18], to: 'dawnroost-node', at: [768, 990], label: 'The living node' },
        { rect: [592, 1006, 690, 1024], to: 'dawnroost-road', at: [762, 52], label: 'The forest road' },
      ],
      people: [
        { id: 'marta', name: 'Marta', at: [376, 462], look: 'elder', talk: 'marta', role: 'inn' },
        { id: 'brann', name: 'Brann', at: [1084, 690], look: 'smith', talk: 'brann', role: 'shop' },
        { id: 'tamsin', name: 'Tamsin', at: [880, 478], look: 'child', talk: 'tamsin' },
      ],
      spots: [
        { kind: 'rest', at: [340, 447], label: 'The Warden hall', note: 'The long hall where the Wardens slept. Rest, and the game is saved.' },
        { kind: 'well', id: 'dawnwell', at: [788, 634], label: 'The yard well', note: 'Tied to the windlass, a letter in a hand Sol knows.' },
        { kind: 'magpie', at: [1400, 300], label: 'The Magpie', note: 'Moored at the Warden dock.' },
      ],
    },
    // Dawnroost's living node: the sunstone in its walled court above the town (the gate, and where Envoi is made)
    'dawnroost-node': {
      name: "Dawnroost's living node", src: "art/walk/walk-dawnroost-node.avif", band: 2, kind: 'gate', music: 'dread',
      start: [768, 990],
      walk: [
        // the court: under the stairs, along the plant beds and benches, round the braziers and the sunstone's chained
        // dais (up its open front steps to the crystal), down past the barrels and the stall and rack to the gate wall
        [[207, 335], [271, 335], [272, 384], [308, 385], [311, 361], [349, 361], [360, 339], [362, 246], [428, 246], [428, 252], [508, 252], [508, 246], [540, 246], [540, 265], [591, 265], [591, 173], [642, 173], [643, 220], [657, 220], [684, 214], [692, 216], [706, 248], [721, 248], [723, 230], [815, 230], [817, 248], [831, 248], [846, 216], [854, 214], [880, 220], [895, 220], [896, 173], [950, 173], [950, 263], [995, 263], [995, 246], [1030, 246], [1030, 252], [1110, 252], [1110, 246], [1176, 246], [1175, 338], [1184, 361], [1222, 361], [1226, 386], [1260, 386], [1264, 335], [1329, 335], [1328, 395], [1318, 398], [1318, 428], [1284, 429], [1210, 432], [1198, 446], [1180, 462], [1158, 470], [1158, 655], [1110, 655], [1060, 650], [1047, 640], [1030, 632], [998, 626], [977, 637], [966, 630], [964, 616], [916, 616], [916, 624], [880, 626], [832, 628], [712, 628], [657, 627], [620, 624], [620, 616], [572, 616], [571, 630], [552, 630], [523, 626], [500, 634], [482, 640], [414, 646], [357, 646], [369, 634], [369, 556], [366, 540], [368, 515], [362, 482], [340, 466], [312, 448], [300, 425], [262, 420], [238, 410], [207, 405]],
        [[124, 109], [281, 109], [281, 150], [271, 156], [271, 338], [207, 338], [207, 158], [163, 156], [163, 147], [132, 146], [132, 125], [124, 124]], // up the west stairs to the wall walk
        [[1257, 109], [1404, 109], [1404, 124], [1378, 127], [1376, 148], [1331, 151], [1330, 338], [1265, 338], [1265, 130], [1257, 128]], // up the east stairs to the wall walk
        [[714, 618], [830, 618], [830, 834], [714, 834]], // through the gate
        [[699, 828], [835, 828], [838, 1024], [697, 1024]], // the road down to Dawnroost
        [[1156, 628], [1177, 630], [1186, 652], [1202, 657], [1211, 644], [1210, 626], [1218, 597], [1233, 579], [1286, 579], [1296, 569], [1294, 540], [1317, 550], [1337, 547], [1342, 562], [1348, 575], [1317, 575], [1319, 613], [1333, 621], [1364, 617], [1364, 641], [1366, 684], [1333, 698], [1321, 666], [1312, 657], [1273, 662], [1250, 687], [1212, 705], [1210, 682], [1176, 671], [1155, 653]],
      ],
      block: [
        [[541, 476], [597, 476], [597, 502], [541, 502]], [[938, 476], [996, 476], [996, 502], [938, 502]], // the banners' braziers
        ...lampBlocks(NODE_LAMPS),
      ],
      front: [
        ...lampFronts(NODE_LAMPS),
        // the banners on their braziers in the court
        { pts: [[566, 302], [577, 302], [578, 316], [596, 317], [596, 331], [590, 332], [590, 414], [596, 418], [599, 455], [598, 502], [539, 502], [539, 455], [548, 418], [554, 414], [554, 332], [547, 331], [547, 317], [565, 316]], base: 500 },
        { pts: [[960, 302], [971, 302], [972, 316], [990, 317], [990, 333], [983, 334], [983, 414], [990, 418], [997, 455], [996, 502], [937, 502], [937, 455], [941, 418], [946, 414], [946, 334], [939, 333], [939, 317], [958, 316]], base: 500 },
        // the braziers either side of the dais, and the two posts at the foot of its steps
        { pts: [[540, 166], [590, 166], [590, 240], [593, 264], [539, 264], [541, 240]], base: 262 },
        { pts: [[948, 166], [997, 166], [996, 240], [994, 262], [950, 262], [948, 240]], base: 260 },
        { pts: [[706, 194], [720, 194], [721, 247], [705, 247]], base: 246 }, { pts: [[817, 194], [830, 194], [831, 247], [816, 247]], base: 246 },
        // the lanterns on the stairs' newel posts, and the pot plants at the stairs' feet
        { pts: [[176, 125], [199, 125], [200, 158], [206, 158], [206, 190], [171, 190], [171, 158], [176, 158]], base: 157 },
        { pts: [[1336, 123], [1360, 123], [1360, 158], [1366, 158], [1366, 189], [1331, 189], [1331, 158], [1336, 158]], base: 157 },
        { pts: [[284, 317], [300, 317], [311, 332], [310, 350], [306, 352], [306, 383], [278, 383], [278, 352], [273, 348], [273, 332]], base: 382 },
        { pts: [[1236, 317], [1252, 317], [1262, 332], [1261, 350], [1257, 352], [1257, 383], [1230, 383], [1230, 352], [1225, 348], [1225, 332]], base: 382 },
        // the urns on the gateposts, the cypress and the pine by the court's south wall
        { pts: [[590, 559], [601, 559], [603, 572], [621, 575], [621, 618], [571, 618], [571, 575], [588, 572]], base: 617 },
        { pts: [[934, 559], [945, 559], [947, 572], [965, 575], [965, 618], [915, 618], [915, 575], [932, 572]], base: 617 },
        { pts: [[448, 612], [454, 624], [459, 633], [466, 654], [471, 676], [471, 700], [427, 700], [428, 676], [432, 654], [439, 633], [443, 624]], base: 700 },
        { pts: [[1090, 607], [1097, 622], [1102, 633], [1110, 654], [1114, 676], [1114, 700], [1068, 700], [1069, 676], [1074, 654], [1080, 633], [1084, 622]], base: 700 },
        // the gate: the wall over the arch, under its merlons
        { pts: [[657, 627], [679, 627], [679, 642], [699, 642], [699, 627], [720, 627], [720, 642], [757, 642], [757, 627], [779, 627], [779, 642], [816, 642], [816, 627], [838, 627], [838, 642], [859, 642], [859, 627], [880, 627], [880, 832], [832, 832], [832, 750], [826, 734], [812, 721], [796, 712], [772, 708], [748, 710], [730, 718], [718, 732], [712, 750], [712, 832], [657, 832]], base: 832 },
        { pts: [[1248, 688], [1242, 678], [1244, 664], [1256, 636], [1266, 617], [1279, 609], [1292, 620], [1303, 641], [1311, 652], [1347, 691], [1316, 674]], base: 688 },
        { pts: [[1291, 694], [1403, 621], [1411, 686], [1324, 708]], base: 708 },
      ],
      exits: [
        { rect: [699, 1004, 836, 1024], to: 'dawnroost', at: [626, 30], label: 'Dawnroost' },
      ],
      people: [],
      spots: [
        { kind: 'event', id: 'dawnroost', rect: [100, 160, 1440, 620], fight: 'dawnroost', once: 'dawnroost' },
      ],
    },
    // the northern crossroads: four old roads meet in a stone ring, with a well (Halcyon's ambush)
    crossroads: {
      name: 'The northern crossroads', src: "art/walk/walk-northern-crossroads.avif", band: 3, kind: 'wild', music: 'wild',
      start: [768, 990],
      walk: [
        // the stone ring, and the trodden earth between it and the well
        [[700, 318], [830, 318], [845, 333], [872, 342], [895, 362], [915, 388], [930, 416], [946, 438], [949, 470], [948, 528], [936, 552], [918, 574], [898, 594], [872, 612], [846, 626], [690, 628], [662, 614], [640, 598], [624, 579], [610, 562], [598, 544], [588, 527], [582, 500], [582, 458], [588, 430], [597, 404], [610, 380], [624, 360], [646, 343], [676, 333]],
        [[706, 0], [830, 0], [828, 130], [826, 252], [834, 262], [838, 292], [842, 330], [690, 334], [694, 292], [700, 262], [712, 250], [712, 130]], // the north road, between its gateposts, to the shipyard
        [[0, 440], [160, 440], [200, 436], [340, 437], [460, 437], [500, 433], [590, 432], [590, 512], [492, 504], [488, 495], [456, 495], [452, 505], [310, 507], [300, 525], [260, 530], [225, 536], [182, 528], [140, 536], [96, 534], [0, 530]], // the west road
        [[940, 438], [1005, 437], [1030, 441], [1062, 446], [1096, 450], [1125, 444], [1240, 440], [1536, 438], [1536, 538], [1240, 536], [1205, 530], [1150, 532], [1130, 524], [1098, 512], [1098, 498], [1070, 498], [1068, 514], [1040, 518], [1020, 527], [1000, 530], [940, 530]], // the east road
        [[690, 620], [840, 620], [832, 650], [830, 696], [812, 698], [810, 748], [836, 750], [852, 756], [852, 1024], [678, 1024], [680, 772], [700, 760], [714, 756], [712, 700], [700, 696], [700, 650]], // the south road, between its gateposts
        [[572, 512], [592, 512], [600, 545], [612, 565], [626, 582], [642, 600], [634, 620], [584, 622], [580, 596], [580, 558], [572, 546]], // to the well's lantern
      ],
      block: [],
      front: [
        // the old gateposts on the north and south roads
        { pts: [[681, 128], [706, 128], [713, 150], [713, 248], [650, 248], [650, 214], [680, 214], [680, 190]], base: 247 },
        { pts: [[828, 128], [853, 128], [855, 178], [856, 210], [890, 210], [892, 251], [822, 251], [822, 178]], base: 250 },
        { pts: [[677, 626], [699, 626], [701, 650], [702, 700], [714, 702], [714, 722], [660, 722], [660, 700], [676, 696], [676, 650]], base: 720 },
        { pts: [[834, 648], [858, 648], [859, 698], [898, 700], [898, 722], [812, 722], [812, 698], [833, 696]], base: 720 },
      ],
      exits: [
        { rect: [706, 0, 830, 18], to: 'shipyard', at: [760, 990], label: 'The shipyard' },
        { rect: [678, 1004, 852, 1024], to: 'world', at: 'crossroads', label: 'The world', say: 'crossroadsSouth' },
        { rect: [0, 440, 18, 530], to: 'cold-moor', at: [1486, 564], label: 'The cold moor' },
        { rect: [1518, 438, 1536, 538], to: 'world', at: 'crossroads', label: 'The world', say: 'crossroadsEast' },
      ],
      people: [],
      spots: [
        { kind: 'well', id: 'crosswell', at: [570, 598], label: 'The crossroads well', note: 'A lantern on a post, and a letter weighted under a stone on the well’s rim.' },
        { kind: 'event', id: 'halcyon', rect: [575, 355, 965, 585], fight: 'halcyon', once: 'halcyon' },
      ],
      wild: { band: 3, scene: 'northern-crossroads', rate: 1 },
    },
    // the shipyard: Ysmera Brightkeel's yard at the end of the long stone bridge, where the Magpie gets its last upgrade
    shipyard: {
      name: 'The shipyard', src: "art/walk/walk-shipyard.avif", band: 3, kind: 'town', music: 'town',
      start: [760, 990],
      walk: [
        // the yard: from the bunkhouse's doors, past the crates on the battlement, the gatehouse and the slip's foot,
        // round the timber and the cranes, to the hall's front and the stairs by the east tower
        [[294, 466], [332, 466], [368, 476], [421, 478], [421, 470], [451, 470], [451, 480], [477, 480], [479, 478], [489, 478], [490, 469], [508, 469], [508, 432], [521, 432], [521, 380], [514, 378], [514, 352], [507, 350], [507, 256], [590, 256], [590, 276], [563, 278], [570, 354], [631, 371], [624, 406], [548, 376], [548, 454], [611, 454], [616, 359], [645, 366], [633, 408], [627, 456], [642, 467], [886, 467], [898, 455], [972, 452], [972, 432], [986, 432], [976, 374], [1023, 374], [1023, 240], [1080, 240], [1080, 310], [1064, 310], [1064, 346], [1281, 354], [1258, 371], [1070, 369], [1069, 413], [1052, 416], [1052, 466], [1057, 474], [1057, 524], [1112, 524], [1112, 531], [1167, 531], [1170, 514], [1216, 514], [1219, 522], [1240, 522], [1247, 532], [1270, 532], [1296, 545], [1356, 545], [1356, 506], [1498, 506], [1498, 548], [1355, 548], [1355, 568], [1263, 568], [1263, 552], [1091, 552], [1091, 560], [1013, 560], [1005, 496], [946, 502], [925, 520], [909, 522], [904, 518], [888, 500], [872, 486], [858, 500], [842, 518], [836, 512], [814, 512], [814, 549], [712, 549], [712, 512], [690, 512], [684, 518], [666, 500], [650, 486], [634, 500], [618, 518], [610, 530], [575, 530], [575, 503], [529, 503], [529, 494], [507, 494], [507, 505], [484, 505], [481, 514], [421, 514], [421, 537], [398, 538], [398, 556], [386, 556], [386, 549], [361, 549], [361, 512], [330, 512], [322, 500], [294, 500]],
        [[713, 128], [813, 128], [813, 158], [799, 160], [799, 340], [790, 352], [790, 468], [736, 468], [736, 352], [729, 340], [729, 160], [713, 158]], // up the slip, under the cradle's beams
        [[738, 540], [790, 540], [790, 690], [738, 690]], // through the gatehouse
        [[709, 686], [816, 686], [816, 698], [822, 700], [822, 721], [704, 721], [704, 700], [709, 698]], [[719, 718], [805, 718], [805, 745], [719, 745]], // the gate's forecourt and the bridge's head
        [[708, 742], [810, 742], [810, 1024], [708, 1024]], // the long bridge, between its parapets
        [[330, 505], [361, 505], [361, 590], [330, 590]], // down the stair by the bunkhouse
        [[252, 552], [361, 552], [361, 646], [324, 646], [324, 622], [296, 622], [296, 646], [258, 646], [258, 612], [252, 612]], // the lower quay
        [[140, 614], [280, 614], [280, 650], [140, 650]], // the west pier
        [[224, 472], [284, 472], [284, 562], [224, 562]], // up the stair to the terrace west of the bunkhouse
        [[101, 346], [178, 346], [180, 364], [262, 366], [272, 372], [272, 398], [262, 400], [262, 442], [279, 446], [280, 476], [222, 476], [212, 468], [186, 466], [186, 384], [171, 384], [171, 398], [101, 398]], // the terrace
        [[184, 440], [212, 440], [212, 498], [170, 498], [170, 462], [184, 462]], // down the wooden steps to the boat landing
        [[1250, 356], [1448, 356], [1448, 418], [1446, 420], [1446, 508], [1396, 508], [1396, 394], [1250, 394]], // up the east stair, to the log shed
        [[1119, 545], [1166, 545], [1166, 640], [1119, 640]], [[1188, 545], [1245, 545], [1245, 676], [1188, 676]], // the stairs down to the water
        [[1355, 520], [1497, 520], [1497, 658], [1358, 658], [1358, 626], [1355, 626]], // the east quay
      ],
      block: [
        [[133, 371], [150, 371], [150, 396], [133, 396]], // the barrel on the terrace
        [[1362, 612], [1430, 612], [1430, 658], [1362, 658]], // the crane on the east quay
        ...lampBlocks(SHIP_LAMPS),
      ],
      front: [
        ...lampFronts(SHIP_LAMPS),
        // the gatehouse: its towers and the wall over the arch, with the arch left open
        { pts: [[612, 548], [620, 518], [650, 486], [684, 518], [690, 512], [712, 512], [712, 551], [814, 551], [814, 512], [836, 512], [842, 518], [872, 486], [906, 520], [911, 548], [911, 702], [839, 702], [839, 694], [803, 694], [803, 678], [793, 678], [793, 622], [784, 608], [764, 601], [744, 607], [735, 622], [735, 678], [724, 678], [724, 694], [688, 694], [688, 702], [612, 702]], base: 694 },
        // the cradle's two crossbeams over the slip
        { pts: [[700, 307], [827, 307], [827, 321], [700, 321]], base: 320 }, { pts: [[712, 334], [821, 334], [821, 353], [712, 353]], base: 352 },
        // the crane on the east quay, its jib and its hook
        { pts: [[1384, 540], [1398, 532], [1474, 518], [1484, 524], [1484, 540], [1474, 548], [1474, 610], [1456, 610], [1456, 556], [1430, 566], [1428, 600], [1432, 612], [1432, 658], [1358, 658], [1358, 612], [1384, 600]], base: 656 },
        // the mooring posts on the west pier's edge
        { pts: [[189, 634], [208, 634], [208, 696], [189, 696]], base: 694 }, { pts: [[266, 634], [282, 634], [282, 696], [266, 696]], base: 694 },
      ],
      exits: [
        { rect: [708, 1004, 810, 1024], to: 'crossroads', at: [770, 30], label: 'The crossroads' },
      ],
      people: [
        { id: 'ysmera', name: 'Ysmera Brightkeel', at: [765, 500], look: 'aurosi', talk: 'ysmera', portrait: 'shipmaster' },
        { id: 'pim', name: 'Pim', at: [1189, 532], look: 'gnome', talk: 'pim', role: 'shop' },
        { id: 'tock', name: 'Tock', at: [1000, 400], look: 'gnome', talk: 'tock' },
        { id: 'gil', name: 'Old Gil', at: [436, 482], look: 'elder', talk: 'gil', role: 'inn' },
      ],
      spots: [
        { kind: 'rest', at: [384, 486], label: 'The bunkhouse', note: 'Bunks for the yard’s hands, and two to spare. Rest, and the game is saved.' },
        { kind: 'magpie', at: [764, 240], label: 'The Magpie', note: 'Up on the slip, in Ysmera’s cradle.' },
      ],
    },
    // the frozen pass: the snowbound road over the frozen river, up through the northeast peaks to Misthollow. Wild.
    'frozen-pass': {
      name: 'The frozen pass', src: "art/walk/walk-frozen-pass.avif", band: 4, kind: 'wild', music: 'wild',
      start: [790, 990],
      walk: [
        // the road from the top edge down to the bridge: the cobbles and the trodden snow either side, between the rocks,
        // the pines and the bare trees
        [[684, 0], [864, 0], [862, 15], [868, 38], [884, 60], [898, 82], [912, 112], [924, 140], [926, 165], [937, 180], [940, 215], [936, 238], [928, 248], [900, 256], [886, 266], [884, 300], [885, 304], [849, 305], [849, 314], [699, 314], [699, 304], [693, 300], [688, 280], [700, 262], [716, 250], [713, 232], [712, 218], [745, 215], [757, 208], [756, 134], [724, 126], [722, 98], [705, 86], [701, 56], [689, 40]],
        // the bridge deck between its parapets and the four pillars at its ends
        [[699, 300], [849, 300], [849, 347], [857, 349], [857, 445], [849, 447], [849, 530], [694, 530], [694, 447], [690, 445], [690, 349], [699, 347]],
        // the road south of the bridge to the bottom edge, with the lamp's lit nook west of it and the sled's clearing east
        [[694, 520], [849, 520], [851, 548], [856, 575], [857, 592], [912, 592], [912, 640], [921, 651], [931, 659], [951, 667], [955, 690], [933, 706], [933, 734], [885, 734], [882, 800], [896, 820], [905, 850], [910, 880], [916, 905], [920, 928], [919, 946], [906, 962], [902, 985], [900, 1002], [902, 1024], [674, 1024], [674, 1010], [683, 1001], [683, 975], [689, 952], [697, 934], [697, 911], [672, 893], [665, 875], [645, 870], [645, 842], [658, 838], [658, 818], [642, 818], [641, 792], [616, 789], [608, 786], [606, 742], [598, 733], [580, 722], [577, 690], [578, 652], [586, 646], [586, 572], [590, 560], [600, 556], [650, 553], [690, 546], [692, 524]],
      ],
      block: [
        ...lampBlocks(PASS_LAMPS),
        [[826, 662], [838, 651], [852, 638], [872, 627], [877, 618], [877, 586], [912, 586], [912, 640], [921, 651], [931, 659], [951, 667], [955, 690], [933, 706], [927, 718], [904, 718], [872, 700], [846, 689], [828, 677]], // the sled and its crate
        [[834, 604], [852, 604], [854, 621], [833, 621]], [[829, 719], [847, 719], [848, 739], [828, 739]], [[858, 737], [887, 737], [888, 770], [857, 770]], // rocks in the snow by the sled
      ],
      front: [
        ...lampFronts(PASS_LAMPS),
        { pts: [[595, 568], [607, 566], [607, 560], [612, 560], [612, 572], [616, 579], [621, 584], [621, 592], [618, 607], [611, 611], [605, 611], [599, 606], [597, 592], [598, 582]], base: 683 }, // the lamp's lantern, hung out east on its bracket
        { pts: [[664, 304], [695, 304], [699, 318], [699, 348], [660, 348], [660, 318]], base: 347 }, { pts: [[853, 304], [881, 304], [886, 318], [886, 348], [848, 348], [848, 318]], base: 347 }, // the bridge's north pillars
        { pts: [[659, 445], [690, 445], [694, 458], [694, 524], [654, 524], [654, 458]], base: 523 }, { pts: [[853, 447], [882, 447], [886, 460], [886, 522], [848, 522], [848, 460]], base: 521 }, // and its south pillars
      ],
      exits: [
        { rect: [684, 0, 864, 18], to: 'misthollow', at: [768, 985], label: 'Misthollow' },
        { rect: [674, 1006, 902, 1024], to: 'frostmere-shore', at: [786, 52], label: "Frostmere's shore" },
      ],
      people: [],
      spots: [
        { kind: 'rest', at: [840, 672], label: 'The sled camp', note: 'Someone’s sled, left with a lamp burning. Camp here: HP and MP back, and the game is saved.' },
      ],
      wild: { band: 4, scene: 'frozen-road', rate: 1 },
    },
    // Misthollow: the town of pale towers on the peaks, whose Moonwell has gone dark
    misthollow: {
      name: 'Misthollow', src: "art/walk/walk-misthollow.avif", band: 4, kind: 'town', music: 'town',
      start: [768, 985],
      walk: [
        [[708, 0], [822, 0], [822, 610], [708, 610]], // the street up to the Moonwell, between its lamps and gateposts
        // the upper square: from the foot of the west stairs past the bench and Sorrel's shop, across the street's foot,
        // to the Lantern House's door and its yard; south to the tops of the great stair's three flights
        [[243, 588], [290, 588], [300, 586], [380, 586], [380, 612], [480, 612], [480, 616], [505, 616], [505, 612], [548, 612], [548, 614], [592, 614], [592, 602], [616, 602], [616, 596], [671, 596], [683, 600], [708, 606],
          [822, 606], [849, 600], [861, 598], [914, 598], [914, 605], [930, 605], [930, 636], [945, 636], [945, 661], [982, 661], [982, 651], [1019, 651], [1019, 663], [1150, 663], [1161, 666], [1161, 700],
          [1093, 700], [1093, 690], [1070, 690], [1070, 701], [1006, 701], [1006, 692], [984, 692], [984, 697], [941, 697], [941, 682], [909, 682], [909, 700], [614, 700], [612, 682], [585, 682], [585, 695], [542, 695], [542, 690], [524, 690], [524, 701], [454, 701], [454, 688], [432, 688], [432, 690], [391, 690], [391, 636], [366, 636], [366, 659], [303, 659], [303, 640], [296, 626], [284, 626], [280, 631], [243, 594]],
        [[454, 695], [524, 695], [524, 790], [454, 790]], [[614, 695], [909, 695], [909, 790], [614, 790]], [[1006, 695], [1070, 695], [1070, 812], [1006, 812]], // the great stair's flights
        // the lower square, from the west flight's foot round to the east corner, and the steps down to the landing yard
        [[230, 942], [305, 908], [305, 902], [325, 902], [328, 888], [364, 888], [368, 880], [416, 880], [416, 812], [434, 796], [434, 792], [454, 792], [454, 785], [524, 785], [524, 792], [542, 792], [542, 786], [984, 786], [984, 820], [1006, 820], [1006, 810], [1070, 810], [1070, 831], [1093, 831], [1093, 846], [1115, 846], [1122, 862], [1139, 862], [1145, 876], [1166, 876], [1169, 886], [1205, 886], [1208, 906], [1232, 908], [1300, 945], [1302, 962], [1290, 970],
          [990, 970], [990, 934], [953, 934], [953, 970], [878, 970], [878, 952], [862, 952], [862, 1024], [668, 1024], [668, 952], [652, 952], [652, 970], [578, 970], [578, 934], [542, 934], [542, 970], [250, 970], [248, 950], [230, 948]],
        // the west stairs: up from the upper square, the snowy way between the pines and the house, the landings and the
        // flights to the lit landing, the stair up to the tower door, and the balcony bridge west of the landing
        [[243, 594], [243, 520], [240, 518], [240, 498], [277, 494], [277, 400], [282, 368], [290, 356], [290, 337], [270, 337], [262, 318], [245, 262], [245, 252], [107, 252], [107, 224], [241, 224], [241, 196], [282, 162], [290, 178], [300, 178], [300, 58], [338, 58], [338, 206], [299, 206], [299, 240], [291, 246], [291, 262], [307, 317], [320, 318], [320, 338], [314, 340], [312, 368], [310, 400], [307, 400], [307, 494], [300, 504], [290, 518], [290, 594]],
        [[616, 600], [616, 505], [620, 470], [640, 466], [652, 482], [662, 500], [671, 506], [671, 600]], // the steps up between the pines west of the street
        [[861, 598], [861, 540], [912, 540], [914, 598]], // and the steps east of it
        // the yard east of the chapel, open to the street round the lamp post, and the ledge behind the balustrade to the chapel's steps
        [[556, 298], [596, 298], [596, 320], [640, 320], [640, 258], [667, 258], [667, 215], [708, 215], [708, 326], [687, 326], [687, 345], [556, 345]],
      ],
      block: [
        ...lampBlocks(MIST_LAMPS),
        [[662, 338], [673, 338], [673, 348], [662, 348]], // the chapel yard banner's pole
        [[326, 584], [372, 584], [372, 622], [326, 622]], [[378, 596], [401, 596], [401, 626], [378, 626]], // the bench and the barrel by the west stairs
        [[528, 780], [630, 780], [630, 828], [528, 828]], [[894, 780], [994, 780], [994, 834], [894, 834]], // barrels, crates and the banners' feet under the great stair
        [[514, 950], [540, 950], [540, 972], [514, 972]], [[991, 946], [1017, 946], [1017, 972], [991, 972]], // the barrels by the south lamps
        [[486, 962], [499, 962], [499, 972], [486, 972]], [[1032, 962], [1045, 962], [1045, 972], [1032, 972]], // the south banners' feet
      ],
      front: [
        ...lampFronts(MIST_LAMPS),
        { pts: [[663, 254], [672, 254], [672, 266], [686, 266], [686, 276], [682, 276], [682, 332], [671, 341], [671, 348], [665, 348], [665, 341], [654, 332], [654, 276], [651, 276], [651, 266], [663, 266]], base: 346 }, // the chapel yard's banner
        { pts: [[613, 328], [637, 328], [637, 385], [613, 385]], base: 346 }, // the balustrade's pillar on the chapel ledge
        { pts: [[676, 106], [700, 104], [710, 116], [713, 150], [710, 190], [702, 214], [676, 214]], base: 212 }, // the bare tree west of the street
        { pts: [[806, 122], [832, 110], [866, 116], [870, 292], [824, 292], [822, 200], [812, 160]], base: 290 }, // the pine east of it
        { pts: [[578, 426], [620, 426], [625, 520], [618, 600], [578, 600]], base: 598 }, { pts: [[638, 368], [680, 368], [685, 440], [676, 504], [640, 504], [632, 470]], base: 502 }, // the pines by the west steps
        { pts: [[906, 450], [954, 450], [958, 530], [950, 575], [906, 575]], base: 572 }, // the pine by the east steps
        { pts: [[392, 658], [428, 658], [433, 700], [433, 790], [372, 790], [372, 740], [388, 700]], base: 790 }, { pts: [[1094, 666], [1140, 666], [1146, 720], [1142, 798], [1094, 798]], base: 796 }, // the pines either side of the great stair
        { pts: [[432, 671], [455, 671], [455, 790], [432, 790]], base: 788 }, { pts: [[524, 688], [542, 688], [542, 790], [524, 790]], base: 788 }, // the gateposts of its side flights
        { pts: [[984, 686], [1006, 686], [1006, 820], [984, 820]], base: 818 }, { pts: [[1070, 674], [1093, 674], [1093, 831], [1070, 831]], base: 829 },
        { pts: [[489, 880], [499, 880], [499, 893], [511, 893], [511, 969], [497, 980], [488, 980], [473, 969], [473, 893], [489, 893]], base: 976 }, { pts: [[1033, 880], [1043, 880], [1043, 893], [1053, 893], [1053, 969], [1043, 980], [1034, 980], [1022, 969], [1022, 893], [1033, 893]], base: 976 }, // the south banners
        { pts: [[217, 218], [248, 218], [248, 282], [217, 282]], base: 254 }, // the balcony bridge's pillar by the lit landing
        { pts: [[218, 392], [282, 392], [284, 470], [277, 494], [240, 498], [238, 522], [218, 522]], base: 520 }, // the pine by the snowy way up the west stairs
      ],
      exits: [
        { rect: [712, 0, 818, 18], to: 'moonwell', at: [775, 990], label: 'The dead Moonwell' },
        { rect: [670, 1006, 860, 1024], to: 'frozen-pass', at: [777, 30], label: 'The frozen pass' },
      ],
      people: [
        { id: 'sorrel', name: 'Sorrel', at: [480, 630], look: 'witch2', talk: 'sorrel', role: 'shop' },
        { id: 'ede', name: 'Ede', at: [962, 676], look: 'elder', talk: 'ede', role: 'inn' },
        { id: 'watch', name: 'The watchwoman', at: [700, 802], look: 'smith', talk: 'watch' },
      ],
      spots: [
        { kind: 'rest', at: [1000, 662], label: 'The Lantern House', note: 'The last inn with a fire lit. Rest, and the game is saved.' },
        { kind: 'well', id: 'mistwell', at: [386, 890], label: 'A frozen trough', note: 'Under the ice, a letter in a jar.' },
      ],
    },
    // the dead Moonwell above Misthollow: the finale
    moonwell: {
      name: 'The dead Moonwell', src: "art/walk/walk-misthollow-moonwell.avif", band: 4, kind: 'gate', music: 'dread',
      start: [775, 990],
      walk: [
        // the round court: from the west lane and its stair up to the arch, past the north-west tower's door, up the
        // steps to the north door, past the north-east tower's door to the east lane and its stair; round the well on
        // its dais; down between the braziers, the steps and the street to the town
        [[226, 292], [230, 292], [230, 220], [293, 220], [293, 292], [310, 292], [310, 288], [340, 288], [348, 278], [381, 278], [381, 268], [453, 268], [453, 276], [495, 248], [495, 213], [522, 224], [540, 206], [543, 145], [556, 119], [562, 18], [598, 25], [589, 143], [618, 200], [707, 206], [707, 158], [830, 158], [830, 206], [995, 206], [995, 224], [1020, 224], [1020, 256], [1037, 262], [1037, 271], [1083, 271], [1083, 265], [1154, 265], [1154, 273], [1188, 273], [1190, 282], [1226, 282], [1226, 292], [1243, 292], [1243, 220], [1306, 220], [1306, 292], [1310, 292], [1310, 401], [1272, 401], [1260, 412], [1222, 412], [1218, 432], [1160, 429], [1130, 440], [1108, 458], [1102, 490], [1102, 608], [1016, 608], [1016, 728], [963, 728], [963, 684], [912, 684], [912, 728], [868, 728], [868, 745], [850, 745], [850, 847], [877, 847], [877, 1024], [658, 1024], [658, 847], [685, 847], [685, 745], [667, 745], [667, 728], [622, 728], [622, 684], [571, 684], [571, 728], [520, 728], [471, 643], [436, 608], [436, 490], [430, 455], [410, 437], [380, 429], [330, 431], [306, 436], [302, 414], [264, 414], [262, 401], [226, 401]],
        [[194, 614], [404, 660], [529, 689], [522, 719], [494, 708], [272, 674], [234, 673], [201, 688], [189, 755], [10, 754], [19, 631], [58, 607], [125, 608]],
        [[268, 385], [224, 407], [224, 492], [300, 557], [434, 564], [449, 477], [421, 412]],
        [[234, 184], [234, 235], [284, 235], [291, 215], [280, 123], [238, 124], [232, 197], [234, 236], [259, 276], [289, 238], [290, 215], [234, 264]],
      ],
      block: [
        [[705, 326], [767, 320], [830, 326], [880, 342], [900, 372], [898, 420], [890, 465], [892, 490], [890, 518], [866, 520], [845, 536], [800, 546], [767, 548], [734, 546], [690, 536], [670, 520], [646, 518], [645, 490], [645, 465], [636, 420], [634, 372], [655, 342]], // the dead Moonwell, with its broken fittings round its foot
        [[548, 718], [572, 718], [572, 730], [548, 730]], [[965, 718], [991, 718], [991, 730], [965, 730]], // the iron gateposts' feet
      ],
      front: [
        { pts: [[664, 256], [700, 250], [752, 246], [756, 236], [776, 236], [780, 246], [830, 250], [873, 256], [873, 392], [851, 392], [851, 292], [820, 270], [780, 262], [776, 312], [755, 312], [755, 262], [715, 270], [686, 292], [686, 392], [664, 392]], base: 546 }, // the well's iron frame and its ring
        { pts: [[626, 676], [664, 676], [664, 735], [626, 735]], base: 733 }, { pts: [[872, 676], [910, 676], [910, 735], [872, 735]], base: 733 }, // the braziers
        { pts: [[545, 614], [575, 614], [575, 744], [545, 744]], base: 742 }, { pts: [[962, 614], [995, 614], [995, 744], [962, 744]], base: 742 }, // the iron gateposts
        { pts: [[677, 118], [707, 118], [707, 206], [677, 206]], base: 204 }, { pts: [[830, 118], [860, 118], [860, 206], [830, 206]], base: 204 }, // the pillars by the north steps
        { pts: [[274, 682], [278, 570], [419, 532], [434, 528], [427, 750]], base: 682 },
        { pts: [[377, 569], [429, 524], [435, 473], [419, 446], [382, 429], [315, 441], [301, 417], [266, 412], [259, 399], [222, 402], [209, 493], [285, 580]], base: 580 },
        { pts: [[203, 776], [216, 696], [2, 694], [5, 789]], base: 789 },
        { pts: [[230, 184], [236, 165], [254, 156], [270, 152], [284, 164], [293, 177], [305, 176], [303, 51], [214, 59]], base: 184 },
        { pts: [[597, 94], [592, 81], [585, 66], [574, 60], [560, 64], [547, 83], [536, 48], [540, 0], [608, 1]], base: 94 },
        { pts: [[219, 542], [208, 589], [226, 621], [217, 624], [216, 641], [216, 660], [235, 675], [274, 666], [297, 544]], base: 675 },
        { pts: [[518, 670], [519, 616], [498, 606], [433, 608], [382, 621], [426, 703], [519, 719]], base: 719 },
        { pts: [[223, 702], [216, 647], [293, 591], [372, 613], [355, 735]], base: 735 },
      ],
      exits: [
        { rect: [660, 1006, 876, 1024], to: 'misthollow', at: [768, 30], label: 'Misthollow' },
      ],
      people: [],
      spots: [
        { kind: 'event', id: 'finale', rect: [640, 690, 895, 765], fight: 'finale', once: 'finale' }, // the head of the steps, between the braziers: the only way into the court
      ],
    },
    // warm-roads-camp: The Warm Roads camp (art request 12, at night), traced from reference/art/walk/wilds/walk-warm-roads-camp.png
    'warm-roads-camp': {
      name: "The Warm Roads camp", src: "art/walk/walk-warm-roads-camp.avif", band: 2, kind: 'camp', music: 'wild',
      start: [575, 466],
      walk: [
        // the landing ground inside its ropes (open on the east, where she steps over the rope to the camp), the grass east
        // of it (short of the gorse and the dark shrub by the west tent), the nook between the west tent and the low wall,
        // and the earth trail under the wall to the road
        [[124, 322], [180, 327], [250, 333], [325, 338], [400, 336], [475, 328], [514, 320], [548, 328], [564, 352], [570, 366], [574, 384], [584, 400], [592, 406], [586, 432], [600, 442], [650, 442], [660, 446], [660, 466], [618, 468], [604, 472], [598, 486], [600, 506], [640, 514], [682, 526], [720, 540], [745, 534], [760, 560], [740, 590], [720, 604], [690, 600], [670, 597], [650, 594], [625, 586], [604, 576], [590, 566], [572, 556], [572, 530], [556, 515], [530, 506], [500, 514], [400, 524], [300, 526], [200, 521], [100, 504], [104, 490], [111, 440], [117, 390], [123, 335]],
        // the camp: from the step at the hut's open door (not the flower beds either side of it) down past the west side of
        // the fire, behind the chest at the low wall's end, and out between that chest and the stumps to the road
        [[744, 330], [746, 318], [790, 318], [800, 326], [812, 338], [824, 350], [820, 360], [816, 400], [820, 418], [826, 432], [836, 442], [842, 456], [846, 470], [846, 500], [898, 502], [904, 532], [770, 536], [728, 532], [722, 500], [708, 488], [700, 482], [700, 468], [706, 466], [706, 436], [706, 404], [712, 398], [752, 398], [752, 356], [742, 344]],
        // the old road: from its west end below the camp, east under the lantern's wall, past the north path's mouth, and
        // off the right edge (its north side on the flagstones' edge, below the gorse and the heather)
        [[684, 560], [700, 550], [722, 542], [745, 534], [770, 530], [800, 526], [850, 524], [900, 522], [960, 521], [990, 518], [1010, 511], [1040, 506], [1070, 500], [1100, 493], [1140, 488], [1170, 484], [1195, 488], [1230, 488], [1250, 485], [1270, 480], [1290, 473], [1310, 466], [1330, 457], [1350, 450], [1370, 445], [1390, 433], [1410, 428], [1450, 424], [1490, 416], [1536, 409], [1536, 497], [1413, 497], [1392, 503], [1351, 523], [1310, 536], [1269, 552], [1207, 565], [1125, 577], [1042, 585], [960, 600], [900, 610], [840, 618], [800, 622], [760, 620], [722, 612], [705, 600], [690, 594], [684, 575]],
        // the north path: up from the road past the rock at its mouth, between the heather and the stones, to the flat
        // lookout rock at the top edge (she stops on its near half, so all of her stays in the picture)
        [[1100, 500], [1100, 462], [1093, 450], [1090, 437], [1068, 432], [1058, 425], [1046, 405], [1034, 362], [1020, 340], [1017, 320], [1011, 291], [1008, 262], [1017, 233], [1020, 204], [1017, 175], [1019, 160], [1018, 128], [1004, 114], [994, 100], [986, 84], [986, 54], [1060, 54], [1056, 80], [1048, 96], [1060, 116], [1066, 145], [1072, 175], [1080, 204], [1074, 233], [1081, 262], [1087, 291], [1090, 320], [1088, 358], [1088, 392], [1100, 404], [1112, 412], [1124, 422], [1132, 434], [1138, 448], [1146, 462], [1160, 478], [1170, 486], [1190, 490], [1195, 500]],
        // the south path: down from the road between the heather and the boulders, over the stream on its slab bridge, and
        // on south-west off the bottom edge
        [[764, 610], [840, 612], [844, 665], [882, 686], [915, 728], [949, 770], [949, 812], [946, 842], [941, 866], [938, 888], [934, 900], [932, 922], [928, 938], [918, 946], [908, 956], [904, 964], [898, 972], [889, 980], [881, 990], [879, 1024], [800, 1024], [800, 1008], [820, 998], [838, 986], [848, 975], [860, 963], [868, 954], [877, 940], [886, 922], [890, 900], [896, 888], [901, 870], [905, 849], [908, 846], [908, 828], [894, 826], [890, 812], [893, 776], [890, 755], [870, 752], [868, 740], [858, 734], [848, 728], [823, 690], [800, 676], [789, 665], [768, 640]],
        // the camp floor east of the fire, between the ring, the east tent's bedrolls, the crate and the stumps: she comes
        // in north of the ring, below the tent's west poles
        [[812, 406], [830, 407], [848, 413], [860, 422], [872, 440], [904, 444], [914, 450], [916, 460], [906, 468], [898, 474], [898, 482], [846, 482], [840, 470], [838, 456], [832, 442], [820, 432], [812, 428]],
        // the patch of trodden earth off the north path's west side, from the boulders' feet down to the stones by the
        // hut's fence, between the gorse and the path
        [[1030, 180], [1020, 179], [1000, 179], [992, 174], [974, 172], [966, 176], [963, 184], [964, 202], [970, 210], [990, 216], [1000, 228], [1012, 236], [1030, 236]],
      ],
      block: [
        [[100, 324], [152, 324], [152, 350], [100, 350]], // the north-west stake's foot and its stones
        [[506, 326], [548, 326], [548, 354], [506, 354]], // the north-east stake's foot
        [[520, 530], [570, 530], [570, 556], [520, 556]], // the south-east stake's foot
        [[712, 360], [752, 360], [752, 397], [712, 397]], // the chest by the west tent
        [[700, 400], [723, 400], [723, 424], [700, 424]], // the stool
        [[700, 468], [725, 468], [725, 487], [700, 487]], // the stump
        [[748, 452], [752, 441], [760, 434], [772, 430], [790, 429], [808, 430], [824, 434], [834, 443], [838, 455], [834, 468], [822, 477], [806, 482], [788, 483], [772, 481], [758, 474], [750, 464]], // the fire's stone ring
        [[722, 504], [770, 504], [770, 532], [722, 532]], // the chest at the low wall's end
        [[846, 480], [897, 480], [897, 502], [846, 502]], // the two stumps' feet east of the fire
      ],
      front: [
        { pts: [[761, 388], [818, 388], [818, 402], [822, 468], [815, 468], [810, 402], [802, 402], [804, 412], [804, 430], [776, 430], [776, 412], [780, 402], [771, 402], [766, 468], [759, 468], [763, 402], [761, 402]], base: 470 }, // the tripod and the kettle over the fire
        { pts: [[699, 450], [725, 450], [725, 487], [699, 487]], base: 486 }, // the stump
        { pts: [[727, 488], [768, 488], [768, 531], [727, 531]], base: 530 }, // the chest at the low wall's end
        { pts: [[711, 356], [753, 356], [753, 398], [711, 398]], base: 397 }, // the chest by the west tent
        { pts: [[841, 336], [849, 336], [862, 350], [860, 410], [819, 410], [826, 392], [838, 356]], base: 407 }, // the east tent's west poles
        { pts: [[847, 500], [847, 477], [853, 473], [853, 465], [857, 461], [857, 447], [861, 444], [867, 444], [871, 447], [871, 456], [875, 454], [883, 452], [891, 453], [895, 457], [895, 471], [904, 471], [907, 476], [906, 483], [895, 484], [895, 500]], base: 499 }, // the two stumps east of the fire, and the little rock beside the tall one
        { pts: [[537, 488], [556, 488], [556, 550], [537, 550]], base: 550 }, // the south-east stake
        { pts: [[75, 486], [97, 486], [97, 546], [75, 546]], base: 546 }, // the south-west stake
        { pts: [[1067, 435], [1089, 435], [1089, 449], [1067, 449]], base: 448 }, // the rock at the north path's mouth
        { pts: [[1090, 280], [1121, 280], [1121, 333], [1090, 333]], base: 332 }, // the wall's pillar beside the north path
        { pts: [[982, 118], [1004, 114], [1016, 124], [1018, 150], [1012, 162], [984, 162], [978, 140]], base: 160 }, // the boulders below the lookout
        { pts: [[1000, 178], [1000, 170], [1004, 165], [1012, 164], [1019, 166], [1021, 172], [1020, 178]], base: 177 }, // the boulder at the north path's west edge, by the yard
        { pts: [[852, 750], [851, 745], [853, 741], [858, 738], [864, 739], [866, 743], [866, 750]], base: 749 }, // the small boulder at the south path's west edge
        // the stones along the slab bridge's sides, each in front of her from its own foot, and the tall stones at its
        // north-west corner
        { pts: [[884, 829], [905, 827], [907, 846], [884, 848]], base: 847 }, { pts: [[882, 849], [901, 848], [902, 868], [882, 870]], base: 869 },
        { pts: [[877, 869], [893, 869], [895, 884], [877, 885]], base: 884 }, { pts: [[863, 880], [887, 880], [889, 902], [862, 903]], base: 902 },
        { pts: [[951, 833], [967, 833], [967, 848], [951, 848]], base: 848 }, { pts: [[946, 847], [964, 847], [964, 867], [945, 868]], base: 867 },
        { pts: [[941, 868], [958, 868], [958, 888], [940, 889]], base: 888 }, { pts: [[935, 889], [957, 889], [958, 911], [934, 912]], base: 911 },
        { pts: [[933, 913], [951, 913], [951, 930], [932, 930]], base: 929 },
        { pts: [[866, 798], [890, 798], [893, 828], [884, 848], [862, 848], [862, 826]], base: 846 },
        { pts: [[962, 60], [986, 60], [988, 80], [984, 100], [956, 100], [956, 80]], base: 99 }, // the lookout's west stones
        { pts: [[1058, 55], [1078, 55], [1078, 80], [1070, 100], [1048, 100], [1048, 84], [1056, 80]], base: 99 }, // and its east stones
      ],
      exits: [
        { rect: [1518, 412, 1536, 494], to: 'ember-line-road', at: [50, 592], label: 'The Ember Line road' },
      ],
      people: [],
      spots: [
        { kind: 'rest', at: [790, 500], label: 'The Warm Roads camp', note: 'A camp. Rest, and the game is saved.' },
      ],
      land: [318, 425],
    },
    // ember-line-road: The Ember Line road (art request 12, at night), traced from reference/art/walk/wilds/walk-ember-line-road.png
    'ember-line-road': {
      name: "The Ember Line road", src: "art/walk/walk-ember-line-road.avif", band: 2, kind: 'wild', music: 'wild',
      start: [50, 592],
      walk: [
        // the old road: in from the west edge, the flagstones and their trodden margins, past the ring's side path and the
        // node beside the road, to the foot of the bridge between its west pillars
        [[0, 553], [35, 551], [70, 546], [133, 538], [170, 532], [200, 524], [233, 514], [266, 505], [300, 497], [335, 490], [367, 487], [400, 486], [430, 481], [480, 478], [530, 474], [563, 469], [597, 465], [618, 459], [632, 450], [660, 446], [672, 458], [682, 476], [682, 524], [663, 525], [630, 531], [580, 537], [530, 542], [480, 545], [430, 549], [380, 556], [333, 567], [300, 574], [267, 583], [233, 593], [200, 599], [167, 608], [100, 620], [47, 627], [33, 632], [0, 633]],
        // the humped bridge's deck, between its parapets (the stream under it is never walkable)
        [[640, 452], [660, 444], [664, 432], [680, 421], [707, 408], [740, 397], [773, 389], [797, 384], [826, 383], [826, 433], [807, 434], [773, 445], [740, 456], [712, 474], [684, 474], [672, 480], [648, 470]],
        // and the road on from the bridge's east end, bending north to leave at the top edge
        [[951, 0], [1037, 0], [1042, 30], [1045, 60], [1047, 100], [1044, 150], [1042, 200], [1039, 230], [1034, 252], [1026, 275], [1014, 300], [1005, 325], [992, 350], [978, 372], [962, 390], [940, 402], [920, 412], [903, 417], [874, 413], [873, 428], [840, 430], [812, 433], [800, 400], [800, 384], [826, 382], [837, 362], [853, 350], [870, 340], [885, 328], [899, 300], [913, 275], [925, 250], [932, 227], [940, 200], [947, 175], [951, 150], [953, 100], [951, 50]],
        // the side path up from the road to the ring of standing stones, and the trodden clearing inside the ring, in front
        // of the node stone
        [[182, 233], [208, 229], [270, 229], [288, 226], [303, 230], [304, 262], [290, 268], [284, 280], [286, 294], [296, 302], [301, 325], [310, 350], [321, 375], [340, 400], [356, 425], [375, 450], [392, 475], [404, 506], [316, 506], [314, 475], [308, 450], [294, 425], [277, 400], [260, 375], [249, 350], [244, 325], [233, 304], [225, 290], [224, 263], [200, 259], [184, 257]],
        // the side path east from the road, past the flat rock and along the wall to the foot of the rise, with the trodden
        // ground on the outside of its bend, below the rocks at the node stone's foot
        [[1025, 205], [1075, 203], [1085, 207], [1130, 208], [1157, 205], [1210, 198], [1232, 199], [1242, 194], [1250, 190], [1258, 187], [1263, 184], [1267, 182], [1304, 182], [1304, 186], [1306, 191], [1318, 193], [1330, 195], [1335, 201], [1334, 207], [1328, 213], [1318, 216], [1310, 220], [1306, 224], [1300, 227], [1290, 231], [1278, 235], [1268, 235], [1245, 236], [1210, 243], [1157, 245], [1130, 247], [1100, 247], [1093, 243], [1056, 242], [1025, 247]],
        // the narrow trail up the rise, between the scrub and the pebbles, to the trodden strip beside the node stone at its top
        [[1262, 190], [1265, 184], [1269, 177], [1272, 174], [1281, 171], [1283, 169], [1290, 166], [1290, 160], [1296, 158], [1302, 156], [1304, 153], [1304, 126], [1308, 118], [1313, 116], [1325, 115], [1333, 118], [1334, 140], [1334, 163], [1324, 164], [1314, 166], [1311, 170], [1309, 176], [1305, 180], [1304, 186], [1300, 192]],
        // the bay of trodden ground south of the side path, between the wall's end and the gorse, down to the lower wall
        [[1216, 238], [1263, 232], [1263, 247], [1270, 252], [1274, 261], [1279, 268], [1279, 286], [1284, 290], [1300, 290], [1308, 293], [1313, 300], [1308, 308], [1296, 310], [1282, 308], [1280, 303], [1274, 298], [1266, 293], [1262, 289], [1254, 285], [1246, 280], [1238, 273], [1228, 269], [1216, 266]],
      ],
      block: [
        [[211, 210], [268, 210], [272, 236], [208, 236]], // the ring's node stone, and the rubble at its foot
        [[564, 440], [607, 440], [608, 460], [563, 460]], // the node stone beside the road
        [[1335, 156], [1373, 156], [1373, 177], [1335, 177]], // the node stone on the rise
      ],
      front: [
        { pts: [[208, 228], [207, 190], [210, 150], [216, 130], [228, 120], [245, 118], [258, 124], [266, 140], [270, 170], [271, 200], [272, 228]], base: 227 }, // the ring's node stone
        { pts: [[133, 288], [134, 250], [140, 225], [150, 212], [160, 209], [172, 214], [178, 230], [181, 260], [181, 288]], base: 287 }, // the big standing stone west of the clearing
        { pts: [[200, 304], [200, 270], [205, 262], [216, 261], [222, 268], [223, 304]], base: 303 }, // the short stone at the clearing's south-west corner
        { pts: [[304, 291], [305, 245], [310, 230], [320, 225], [330, 228], [334, 245], [336, 291]], base: 290 }, // the standing stone east of the clearing
        { pts: [[284, 292], [285, 278], [292, 272], [303, 273], [306, 285], [305, 293]], base: 292 }, // the rocks at its foot
        { pts: [[307, 349], [298, 336], [297, 326], [306, 316], [314, 311], [326, 314], [338, 322], [344, 334], [340, 346], [326, 351]], base: 350 }, // the dark shrub at the ring path's east edge
        { pts: [[562, 460], [561, 420], [564, 397], [572, 387], [590, 384], [602, 390], [607, 410], [609, 460]], base: 458 }, // the node stone beside the road
        { pts: [[683, 523], [683, 485], [688, 478], [707, 478], [712, 485], [712, 523]], base: 523 }, // the bridge's south-west pillar
        { pts: [[712, 474], [740, 457], [773, 445], [800, 437], [800, 468], [773, 478], [740, 490], [712, 506]], base: 505 }, // its south parapet, west half
        { pts: [[800, 437], [840, 431], [873, 429], [873, 456], [840, 460], [800, 468]], base: 465 }, // and east half
        { pts: [[874, 460], [874, 418], [880, 411], [898, 411], [903, 418], [903, 460]], base: 460 }, // the south-east pillar
        { pts: [[797, 381], [797, 345], [802, 337], [822, 337], [826, 345], [826, 381]], base: 381 }, // the north-east pillar
        { pts: [[1055, 248], [1056, 236], [1066, 229], [1080, 229], [1092, 236], [1092, 249]], base: 248 }, // the flat rock by the east side path
        { pts: [[1333, 176], [1332, 140], [1336, 115], [1345, 107], [1362, 106], [1371, 114], [1374, 140], [1375, 176]], base: 175 }, // the node stone on the rise
      ],
      exits: [
        { rect: [0, 556, 18, 630], to: 'warm-roads-camp', at: [1484, 456], label: 'The Warm Roads camp' },
        { rect: [952, 0, 1036, 18], to: 'dawnroost-road', at: [1000, 970], label: 'The forest road to Dawnroost' },
      ],
      people: [],
      spots: [
        { kind: 'node', id: 'node1', at: [240, 248], label: 'An Ember Line node' }, // in the ring of standing stones, at the end of the west side path
        { kind: 'node', id: 'node2', at: [585, 484], label: 'An Ember Line node' }, // beside the road, by the bridge
        { kind: 'node', id: 'node3', at: [1313, 160], label: 'An Ember Line node' }, // on the rise, at the end of the east side path
      ],
      wild: { band: 2, scene: 'warm-road', rate: 1 },
    },
    // dawnroost-road: The forest road to Dawnroost (art request 12, at night), traced from reference/art/walk/wilds/walk-dawnroost-forest-road.png
    'dawnroost-road': {
      name: "The forest road to Dawnroost", src: "art/walk/walk-dawnroost-forest-road.avif", band: 2, kind: 'wild', music: 'wild',
      start: [1000, 970],
      walk: [
        // the old Warm Road's mossy flagstones: in at the bottom edge, up past the lantern and the milestone, and out at the
        // top edge toward Dawnroost
        [[936, 1024], [924, 1000], [912, 975], [900, 950], [896, 925], [878, 900], [866, 875], [862, 850], [852, 825], [830, 800], [806, 775], [790, 750], [780, 725], [770, 700], [764, 675], [752, 650], [738, 625], [726, 604], [750, 578], [758, 552], [764, 526], [780, 506], [806, 500], [818, 475], [828, 450], [834, 425], [830, 400], [824, 375], [820, 350], [812, 325], [806, 300], [786, 275], [768, 250], [756, 225], [746, 200], [734, 175], [728, 150], [722, 125], [716, 100], [702, 75], [690, 50], [682, 25], [678, 0],
          [834, 0], [836, 25], [838, 50], [838, 75], [842, 100], [848, 125], [856, 150], [866, 175], [878, 200], [896, 225], [912, 250], [922, 275], [932, 300], [944, 325], [958, 350], [964, 375], [966, 400], [964, 425], [960, 450], [956, 475], [950, 500], [942, 525], [934, 550], [908, 575], [902, 600], [908, 625], [916, 650], [922, 675], [930, 700], [950, 725], [968, 750], [984, 775], [998, 800], [1010, 825], [1020, 850], [1040, 875], [1052, 900], [1064, 925], [1074, 950], [1080, 975], [1086, 1000], [1092, 1024]],
        // the lantern's lit verge east of the road: the grass under the lantern, west of the ferns at the post's foot
        [[896, 572], [930, 566], [960, 580], [988, 600], [984, 628], [964, 644], [954, 672], [954, 704], [958, 730], [962, 748], [930, 716], [912, 690], [900, 640]],
        // the trail west to the pool: from the road to the fork below the great oak, then on along the pool's south shore,
        // over its flat stones, to where it gives out among the rocks
        [[850, 398], [826, 402], [800, 408], [776, 416], [760, 420], [730, 426], [700, 430], [660, 436], [620, 432], [590, 428], [560, 424], [544, 440], [540, 470], [500, 490], [470, 504], [430, 516], [404, 526], [386, 516], [360, 512], [300, 512], [272, 514], [250, 522], [224, 524], [206, 528], [204, 546], [236, 544], [252, 550], [260, 564], [270, 572], [300, 572], [350, 570], [400, 566], [450, 560], [500, 552], [540, 545], [580, 530], [610, 520], [640, 500], [680, 490], [726, 486], [730, 466], [764, 462], [790, 470], [800, 500], [850, 500]],
        // the fork's other arm: north up the pool's east side, between its boulders and the great oak's roots
        [[610, 470], [560, 480], [520, 440], [506, 418], [502, 398], [478, 392], [458, 390], [452, 360], [440, 334], [420, 316], [404, 300], [400, 280], [420, 262], [450, 266], [466, 288], [472, 312], [480, 334], [494, 352], [510, 368], [530, 384], [552, 398], [586, 411], [610, 430]],
        // round the pool's north rim: past the reeds and along the flat stones at the water's edge
        [[470, 282], [452, 260], [424, 246], [396, 228], [350, 220], [310, 226], [270, 236], [232, 240], [206, 230], [176, 224], [154, 230], [148, 252], [154, 284], [156, 300], [160, 320], [204, 322], [210, 298], [250, 298], [285, 304], [326, 300], [330, 266], [362, 264], [364, 300], [368, 336], [404, 338], [412, 304], [430, 300]],
        // the trail east to the woodcutter's lean-to
        [[950, 366], [980, 372], [1010, 380], [1050, 386], [1080, 382], [1100, 374], [1116, 368], [1132, 418], [1100, 418], [1080, 422], [1060, 436], [1030, 442], [1000, 444], [970, 450], [950, 458]],
        // the woodcutter's clearing: round the chopping block, up to the log and the lean-to's west post, and the yard in
        // front of the firewood stack
        [[1112, 416], [1112, 376], [1116, 340], [1130, 314], [1152, 302], [1168, 300], [1222, 300], [1240, 296], [1262, 298], [1290, 292], [1302, 292], [1302, 342], [1336, 344], [1338, 398], [1348, 406], [1348, 420], [1340, 438], [1300, 448], [1250, 446], [1200, 442], [1182, 426], [1162, 418], [1132, 418]],
      ],
      block: [
        [[998, 660], [1020, 660], [1020, 676], [998, 676]], // the lantern post's foot
        [[1116, 344], [1130, 338], [1146, 342], [1152, 352], [1150, 368], [1124, 370], [1116, 360]], // the rocks in the moss at the clearing's corner
        [[1230, 376], [1246, 372], [1268, 372], [1282, 378], [1284, 388], [1266, 396], [1240, 396], [1226, 388]], // the chopping block
        [[1284, 362], [1297, 362], [1297, 373], [1284, 373]], // the axe's handle
        [[1280, 404], [1294, 398], [1320, 398], [1348, 408], [1348, 420], [1340, 436], [1306, 444], [1282, 430]], // the split logs
      ],
      front: [
        // the iron lantern on its post: the post, the arm and its brace, and the lantern hung from it
        { pts: [[962, 536], [980, 537], [999, 543], [999, 534], [1019, 534], [1019, 673], [996, 673], [999, 598], [984, 560], [980, 558], [982, 572], [992, 582], [992, 617], [976, 621], [958, 616], [957, 582], [969, 571], [972, 558], [962, 551]], base: 672 },
        { pts: [[1232, 340], [1236, 326], [1250, 322], [1268, 323], [1278, 330], [1280, 345], [1280, 370], [1284, 380], [1280, 390], [1262, 393], [1246, 396], [1230, 394], [1224, 386], [1228, 376], [1232, 360]], base: 392 }, // the chopping block
        { pts: [[1284, 309], [1295, 309], [1297, 370], [1285, 371]], base: 369 }, // the axe's handle
        { pts: [[1302, 300], [1316, 292], [1330, 282], [1376, 280], [1378, 343], [1302, 344]], base: 342 }, // the firewood stack
        { pts: [[1296, 386], [1312, 384], [1322, 392], [1336, 398], [1348, 404], [1350, 416], [1340, 420], [1340, 434], [1328, 440], [1306, 442], [1296, 436], [1284, 428], [1278, 418], [1280, 404], [1290, 396]], base: 440 }, // the split logs
        { pts: [[330, 302], [330, 284], [333, 266], [336, 252], [346, 244], [354, 246], [362, 256], [366, 270], [367, 290], [365, 304], [358, 318], [336, 318]], base: 314 }, // the reeds at the pool's north rim
        { pts: [[416, 372], [420, 362], [432, 357], [446, 359], [452, 368], [454, 384], [450, 398], [436, 402], [420, 398]], base: 400 }, // the boulder at the arm's west edge
      ],
      exits: [
        { rect: [936, 1006, 1092, 1024], to: 'ember-line-road', at: [995, 56], label: 'The Ember Line road' },
        { rect: [678, 0, 836, 18], to: 'dawnroost', at: [641, 985], dir: 'n', label: 'Dawnroost' },
      ],
      people: [],
      spots: [],
      wild: { band: 2, scene: 'warm-road', rate: 1 },
    },
    // northern-camp: The northern camp (art request 12, at night), traced from reference/art/walk/wilds/walk-northern-camp.png
    'northern-camp': {
      name: "The northern camp", src: "art/walk/walk-northern-camp.avif", band: 3, kind: 'camp', music: 'wild',
      start: [662, 420],
      walk: [
        // the landing ground: the frosted grass inside the four stakes' ropes (she steps over the ropes) and round them, up
        // to the bushes (round the heather clump on its west side), and the frosted trail a little way north from its bay
        [[58, 304], [64, 296], [84, 290], [100, 282], [108, 264], [136, 262], [176, 260], [200, 254], [250, 254], [290, 250], [314, 240], [320, 222], [320, 206], [334, 198], [342, 190], [348, 178], [350, 160], [344, 148], [342, 136], [356, 130], [372, 128], [378, 134], [384, 146], [392, 156], [394, 174], [388, 184], [384, 194], [378, 204], [384, 210], [398, 214], [408, 220], [412, 228], [430, 232], [438, 240], [444, 246], [466, 250], [486, 256], [520, 262], [554, 268], [566, 280], [572, 298], [580, 314], [612, 322], [624, 338], [660, 348], [700, 356], [714, 420], [714, 480], [708, 506], [696, 524], [684, 545], [664, 580], [630, 604], [600, 624], [560, 636], [480, 638], [400, 640], [300, 638], [200, 638], [130, 636], [100, 628], [92, 600], [62, 594], [62, 532], [98, 524], [102, 494], [92, 470], [60, 458], [58, 420]],
        // the camp: the trodden earth from the tents' fronts round the fire (the firewood, the stump and the lantern post
        // close off the patch behind it), and down to where the road and the bridge path leave
        [[618, 326], [660, 334], [695, 341], [727, 353], [760, 358], [790, 362], [812, 364], [835, 370], [850, 382], [858, 402], [857, 430], [878, 436], [878, 466], [846, 468], [852, 492], [880, 506], [870, 530], [846, 556], [832, 550], [814, 540], [796, 528], [750, 516], [705, 508], [690, 480], [650, 430], [618, 380]],
        // the road: east from the camp, past the north path's mouth, and off the right edge into the forest
        [[846, 500], [880, 506], [917, 521], [953, 532], [990, 535], [1027, 532], [1063, 528], [1100, 527], [1150, 528], [1190, 520], [1230, 508], [1260, 496], [1300, 486], [1344, 479], [1392, 474], [1440, 482], [1488, 486], [1536, 489], [1536, 543], [1488, 540], [1440, 546], [1392, 549], [1344, 554], [1296, 560], [1248, 569], [1200, 576], [1150, 583], [1104, 586], [1060, 591], [1008, 592], [975, 594], [940, 598], [900, 598], [868, 598], [862, 576], [848, 562], [840, 540]],
        // the north path: up from the road between the bushes to the lit hollow under the mossy boulder
        [[1240, 520], [1256, 498], [1257, 462], [1232, 440], [1218, 420], [1206, 380], [1192, 340], [1164, 300], [1136, 262], [1112, 228], [1120, 200], [1145, 190], [1160, 186], [1188, 182], [1190, 152], [1230, 152], [1232, 186], [1240, 200], [1226, 222], [1218, 260], [1229, 300], [1257, 340], [1279, 380], [1313, 420], [1353, 448], [1400, 476], [1340, 500], [1280, 520]],
        // the trail on from the hollow's mouth, north-west under the flowering bushes, to where it bends away into the
        // forest below the top edge (she stops short of the bend, so all of her stays in the picture)
        [[1180, 240], [1150, 246], [1103, 222], [1056, 202], [1038, 186], [1030, 172], [1014, 160], [998, 158], [971, 144], [958, 122], [956, 100], [964, 80], [984, 60], [1000, 50], [1030, 48], [1028, 62], [1016, 80], [1008, 100], [1020, 120], [1046, 138], [1082, 158], [1108, 178], [1140, 192], [1180, 196]],
        // the bridge path: down from the road between the frosted heather to the plank bridge
        [[843, 550], [870, 540], [975, 594], [950, 600], [938, 620], [924, 650], [915, 675], [905, 700], [898, 729], [884, 760], [796, 748], [815, 725], [828, 700], [846, 676], [858, 652], [864, 630], [868, 600], [862, 576]],
        // the plank bridge over the half-frozen stream, between its rails
        [[798, 734], [882, 748], [838, 846], [746, 832]],
        // and the path on past the bridge (it widens west below the bridge), off the bottom edge
        [[746, 826], [838, 840], [836, 860], [826, 880], [802, 900], [789, 920], [781, 940], [789, 960], [800, 980], [805, 1000], [800, 1024], [742, 1024], [732, 1000], [722, 980], [716, 962], [704, 952], [686, 944], [676, 928], [680, 914], [700, 906], [712, 896], [732, 880], [742, 860]],
      ],
      block: [
        [[108, 296], [132, 296], [132, 314], [108, 314]], [[530, 298], [553, 298], [553, 315], [530, 315]], // the landing ground's north stakes' feet
        [[99, 580], [124, 580], [124, 598], [99, 598]], [[554, 580], [580, 580], [580, 598], [554, 598]], // and its south stakes' feet
        [[849, 397], [844, 410], [831, 420], [812, 426], [790, 426], [771, 420], [758, 410], [753, 397], [758, 384], [771, 374], [790, 368], [812, 368], [831, 374], [844, 384]], // the fire's stone ring
        [[711, 377], [737, 377], [737, 404], [711, 404]], [[734, 408], [759, 408], [759, 436], [734, 436]], [[816, 419], [840, 419], [840, 445], [816, 445]], // the three stumps on its near side
      ],
      front: [
        { pts: [[109, 258], [131, 258], [132, 312], [108, 312]], base: 312 }, { pts: [[531, 258], [553, 258], [553, 313], [530, 313]], base: 313 }, // the north stakes
        { pts: [[132, 277], [200, 287], [267, 294], [330, 297], [400, 295], [470, 289], [530, 277], [530, 284], [470, 296], [400, 302], [330, 304], [267, 301], [200, 294], [132, 284]], base: 312 }, // the north rope between them
        { pts: [[100, 537], [124, 537], [124, 597], [99, 597]], base: 597 }, { pts: [[555, 536], [580, 536], [580, 597], [554, 597]], base: 597 }, // the south stakes
        { pts: [[124, 557], [200, 570], [290, 577], [390, 580], [470, 573], [555, 557], [555, 564], [470, 580], [390, 587], [290, 584], [200, 577], [124, 564]], base: 597 }, // the south rope between them
        { pts: [[735, 504], [750, 528], [770, 561], [778, 605], [772, 640], [742, 652], [728, 652], [684, 636], [682, 605], [704, 561], [721, 528]], base: 650 }, // the fir below the camp, west of the bridge path
        { pts: [[1034, 545], [1050, 570], [1066, 604], [1075, 652], [1082, 700], [1060, 720], [1046, 748], [1022, 748], [1008, 720], [978, 700], [984, 652], [1003, 604], [1018, 570]], base: 746 }, // the fir over the road's south edge, east of the bridge path
        { pts: [[1499, 510], [1510, 528], [1525, 550], [1536, 566], [1536, 660], [1411, 660], [1429, 600], [1460, 568], [1477, 550], [1490, 528]], base: 760 }, // the fir over the road at the right edge
        { pts: [[1037, 50], [1046, 66], [1048, 86], [1028, 88], [1027, 66]], base: 87 }, // the little fir at the trail's bend
        { pts: [[1022, 156], [1028, 172], [1036, 190], [1034, 206], [1008, 208], [1006, 190], [1014, 172]], base: 207 }, // and the one on its south-west edge
        { pts: [[1155, 155], [1188, 155], [1188, 184], [1155, 184]], base: 183 }, { pts: [[1232, 155], [1262, 155], [1262, 190], [1232, 190]], base: 189 }, // the rocks either side of the hollow's mouth
        { pts: [[776, 706], [796, 706], [796, 743], [776, 743]], base: 742 }, { pts: [[888, 727], [908, 727], [908, 777], [888, 777]], base: 776 }, // the bridge's north posts
        { pts: [[718, 802], [740, 802], [740, 847], [718, 847]], base: 846 }, { pts: [[835, 828], [853, 828], [853, 870], [835, 870]], base: 869 }, // and its south posts
        { pts: [[889, 742], [901, 748], [857, 842], [843, 836]], base: 836 }, // the bridge's east rail
      ],
      exits: [
        { rect: [1518, 489, 1536, 543], to: 'eldergrove-edge', at: [50, 470], label: "Eldergrove's edge" },
      ],
      people: [],
      spots: [
        { kind: 'rest', at: [790, 446], label: 'The northern camp', note: 'A camp. Rest, and the game is saved.' }, // at the fire, between its two front stumps
      ],
      land: [336, 455],
    },
    // eldergrove-edge: Eldergrove's edge (art request 12, at night), traced from reference/art/walk/wilds/walk-eldergrove-edge.png
    'eldergrove-edge': {
      name: "Eldergrove's edge", src: "art/walk/walk-eldergrove-edge.avif", band: 3, kind: 'wild', music: 'wild',
      start: [50, 470],
      walk: [
        // the earth path: in from the west, past the great hollow tree's side path and the ruined arch, down between the
        // boulders and the pine, past the stone ring's path, and out east to the cold moor
        [[0, 436], [40, 436], [100, 435], [160, 433], [220, 431], [280, 429], [330, 426], [370, 421], [400, 416], [440, 410], [480, 406], [520, 404], [560, 404], [600, 406], [640, 414], [680, 420], [700, 428], [728, 434], [744, 444], [756, 460], [772, 474], [792, 488], [812, 497], [850, 500], [900, 504], [950, 506], [990, 504], [1030, 498], [1060, 496], [1080, 496], [1150, 504], [1170, 516], [1210, 520], [1240, 525], [1270, 530], [1278, 546], [1300, 549], [1330, 556], [1380, 559], [1430, 557], [1480, 556], [1536, 556], [1536, 628], [1500, 630], [1450, 632], [1400, 634], [1382, 632], [1376, 616], [1346, 616], [1338, 628], [1300, 628], [1250, 622], [1200, 614], [1160, 608], [1120, 598], [1080, 592], [1040, 588], [1000, 584], [960, 578], [900, 578], [850, 576], [800, 570], [772, 560], [758, 548], [742, 539], [726, 534], [710, 528], [690, 516], [660, 502], [630, 496], [600, 492], [560, 484], [520, 476], [500, 462], [482, 449], [462, 452], [440, 463], [410, 470], [380, 480], [350, 488], [320, 498], [300, 504], [260, 508], [200, 506], [150, 505], [100, 505], [50, 503], [0, 504]],
        // the side path up to the great tree, and into the hollow at its foot
        [[500, 414], [502, 398], [522, 384], [534, 372], [550, 364], [548, 338], [514, 333], [506, 320], [510, 300], [520, 284], [522, 262], [522, 244], [590, 246], [586, 262], [578, 274], [580, 296], [598, 318], [616, 338], [628, 358], [636, 380], [640, 400], [644, 420], [520, 420]],
        [[522, 248], [520, 218], [524, 200], [534, 190], [576, 190], [586, 200], [590, 222], [592, 248]],
        // the side path north to the ring of standing stones
        [[1072, 512], [1074, 494], [1080, 470], [1084, 440], [1086, 400], [1084, 378], [1076, 360], [1066, 344], [1130, 334], [1214, 340], [1212, 354], [1192, 360], [1182, 378], [1176, 400], [1172, 422], [1160, 444], [1154, 470], [1152, 500], [1158, 514]],
        // the ground inside the ring, between its front stone and its sun stone, up to the feet of the moon stone and its
        // neighbour, and the strip behind the front stone's top
        [[1040, 338], [1042, 300], [1050, 262], [1062, 250], [1062, 216], [1076, 198], [1128, 195], [1146, 208], [1184, 212], [1186, 240], [1196, 258], [1216, 262], [1218, 344], [1200, 352], [1130, 340], [1080, 340]],
        // the trail round the west of the ring, past the pine, to the back of the stones
        [[1086, 344], [1070, 352], [1056, 345], [1036, 335], [1010, 326], [996, 322], [986, 310], [976, 300], [964, 282], [957, 260], [954, 236], [953, 212], [956, 190], [966, 168], [986, 148], [1008, 128], [1028, 108], [1046, 98], [1060, 96], [1068, 110], [1052, 124], [1036, 140], [1020, 158], [1006, 178], [1000, 200], [999, 226], [1002, 250], [1014, 270], [1030, 284], [1054, 296], [1070, 308], [1086, 324]],
        // the trail on behind the stones: below the little rock, behind the stone left of the moon stone and the moon stone
        // itself, and out east of it to its end at the boulder above the north-east stone
        [[1040, 104], [1060, 96], [1068, 110], [1086, 109], [1098, 98], [1112, 89], [1126, 79], [1150, 74], [1216, 74], [1246, 84], [1278, 96], [1302, 108], [1304, 124], [1262, 124], [1222, 120], [1216, 114], [1160, 114], [1130, 112], [1118, 124], [1102, 134], [1076, 136], [1060, 138], [1044, 130]],
        // the way down from the path behind the ruin, under the arch to its threshold
        [[384, 470], [440, 458], [440, 500], [462, 524], [478, 540], [478, 684], [420, 684], [420, 560], [408, 524], [392, 504]],
        // the cobbles and the earth path from the arch's threshold south, between the rocks and the ferns, off the bottom edge
        [[408, 674], [480, 668], [476, 700], [476, 740], [480, 756], [484, 770], [500, 779], [512, 786], [524, 795], [536, 803], [546, 812], [554, 822], [560, 832], [554, 848], [550, 870], [552, 890], [560, 905], [566, 925], [572, 946], [584, 962], [594, 982], [602, 1002], [610, 1024], [490, 1024], [488, 990], [486, 960], [462, 954], [448, 944], [446, 920], [450, 900], [455, 880], [460, 856], [458, 828], [440, 814], [420, 798], [410, 790], [404, 784], [398, 778], [384, 771], [373, 762], [372, 750], [377, 740], [390, 731], [397, 722], [400, 712], [396, 700], [396, 686]],
      ],
      block: [
        [[608, 403], [636, 403], [658, 416], [658, 430], [638, 430], [608, 423]], // the two rocks at the foot of the hollow tree's path
        [[1123, 504], [1147, 504], [1148, 520], [1123, 521]], // the rock at the foot of the stone ring's path
        [[1067, 240], [1126, 240], [1126, 324], [1067, 324]], // the ring's front stone
        [[1218, 310], [1296, 310], [1296, 354], [1218, 354]], // the ring's sun stone
        [[1013, 226], [1064, 226], [1064, 250], [1013, 250]], // the ring's west stone
        [[1074, 178], [1128, 178], [1128, 196], [1074, 196]], // the stone left of the moon stone
        [[1145, 190], [1217, 190], [1217, 209], [1145, 209]], // the moon stone
      ],
      front: [
        { pts: [[480, 242], [482, 150], [496, 100], [520, 70], [560, 60], [600, 70], [624, 100], [630, 150], [628, 242], [596, 242], [592, 200], [586, 168], [576, 140], [562, 120], [548, 116], [534, 126], [524, 146], [516, 170], [512, 200], [512, 242]], base: 240 }, // the great tree's bark round the hollow
        { pts: [[1015, 247], [1014, 200], [1018, 172], [1028, 152], [1040, 146], [1052, 150], [1060, 168], [1063, 200], [1063, 247]], base: 247 }, // the ring's west stone
        { pts: [[1077, 196], [1077, 184], [1078, 172], [1080, 158], [1082, 146], [1083, 138], [1085, 130], [1087, 122], [1089, 114], [1092, 110], [1095, 107], [1099, 104], [1102, 101], [1108, 99], [1114, 99], [1117, 102], [1120, 110], [1122, 120], [1123, 130], [1124, 140], [1125, 160], [1126, 196]], base: 196 }, // the stone left of the moon stone
        { pts: [[1149, 207], [1150, 189], [1151, 177], [1152, 163], [1154, 149], [1155, 136], [1157, 124], [1160, 112], [1164, 100], [1166, 92], [1170, 84], [1174, 80], [1178, 76], [1181, 72], [1188, 70], [1196, 69], [1202, 70], [1207, 73], [1210, 80], [1212, 92], [1213, 104], [1214, 130], [1215, 150], [1216, 207]], base: 206 }, // the moon stone
        { pts: [[1069, 322], [1069, 260], [1074, 232], [1086, 216], [1100, 212], [1114, 218], [1122, 236], [1125, 280], [1125, 322]], base: 321 }, // the ring's front stone
        { pts: [[1219, 351], [1219, 270], [1224, 245], [1240, 230], [1262, 226], [1282, 232], [1292, 250], [1294, 300], [1294, 351]], base: 350 }, // the ring's sun stone
        { pts: [[931, 230], [938, 250], [946, 262], [956, 272], [966, 282], [974, 292], [984, 304], [992, 316], [998, 334], [998, 352], [994, 372], [862, 372], [868, 340], [882, 310], [898, 280], [914, 254]], base: 372 }, // the pine by the trail round the ring
        { pts: [[384, 672], [384, 600], [386, 563], [393, 543], [415, 526], [442, 521], [470, 528], [496, 541], [508, 558], [512, 580], [498, 592], [498, 692], [478, 692], [479, 640], [479, 590], [476, 576], [468, 565], [455, 558], [437, 556], [424, 563], [422, 600], [422, 672]], base: 672 }, // the ruined arch
        { pts: [[484, 744], [484, 706], [494, 700], [494, 600], [500, 590], [520, 586], [545, 588], [556, 598], [558, 744]], base: 744 }, // the sun-carved pillar beside the arch
        { pts: [[969, 564], [978, 578], [990, 590], [995, 606], [1006, 618], [1014, 634], [1032, 648], [1042, 670], [1044, 700], [888, 700], [892, 680], [910, 652], [928, 624], [944, 600], [956, 584]], base: 740 }, // the pine below the path
      ],
      exits: [
        { rect: [0, 436, 18, 504], to: 'northern-camp', at: [1478, 512], label: 'The northern camp' },
        { rect: [1518, 556, 1536, 630], to: 'cold-moor', at: [50, 564], label: 'The cold moor' },
      ],
      people: [],
      spots: [],
      wild: { band: 3, scene: 'northern-crossroads', rate: 1 },
    },
    // cold-moor: The cold moor (art request 12, at night), traced from reference/art/walk/wilds/walk-cold-moor.png
    'cold-moor': {
      name: "The cold moor", src: "art/walk/walk-cold-moor.avif", band: 3, kind: 'wild', music: 'wild',
      start: [50, 564],
      walk: [
        // the old road of broken flagstones and its trodden verges: in at the west edge, past the cairn on its north verge
        // and the foot of the hut's path, on below the frozen tarn and a second cairn, and out at the east edge
        [[0, 510], [24, 511], [50, 504], [78, 503], [96, 508], [114, 500], [140, 495], [175, 493], [205, 491], [235, 486], [258, 477], [285, 471], [315, 464], [345, 457], [375, 450], [405, 443], [430, 425], [560, 428], [590, 438], [620, 444], [650, 446], [680, 452], [720, 461], [760, 469], [790, 477], [815, 490], [840, 498], [870, 497], [910, 500], [945, 503], [975, 506], [1040, 512], [1080, 520], [1110, 525], [1150, 527], [1200, 531], [1240, 536], [1280, 531], [1320, 529], [1350, 524], [1380, 522], [1410, 525], [1440, 525], [1470, 522], [1500, 520], [1536, 517],
         [1536, 605], [1500, 603], [1470, 609], [1440, 614], [1410, 618], [1380, 621], [1350, 623], [1320, 624], [1290, 620], [1260, 618], [1230, 618], [1200, 612], [1170, 620], [1140, 621], [1110, 622], [1080, 624], [1050, 621], [1020, 610], [990, 605], [960, 600], [930, 592], [900, 585], [870, 579], [840, 574], [800, 566], [775, 562], [700, 540], [640, 530], [615, 520], [585, 506], [550, 501], [510, 502], [470, 505], [440, 510], [410, 525], [380, 535], [350, 546], [320, 556], [290, 560], [265, 572], [240, 590], [200, 593], [150, 597], [120, 602], [90, 606], [60, 614], [30, 620], [0, 622]],
        // the side path north to the ruined shepherd's hut: up from the road and into the hut's open front, between its
        // corner pillar and the end of the sheepfold's wall, onto the earth floor (short of the rubble at the back wall's
        // foot and of the wall end's capstone); and the trodden branch that bends round the hut's west side
        [[405, 450], [412, 425], [409, 400], [407, 378], [410, 360], [405, 342], [392, 326], [372, 312], [362, 300], [352, 290], [340, 280], [326, 270], [308, 263], [302, 249], [293, 240], [286, 226], [284, 210], [286, 195], [291, 184], [300, 176], [312, 172], [324, 171], [334, 176], [332, 190], [324, 202], [321, 214], [326, 228], [336, 238], [350, 248], [372, 256], [396, 262], [420, 257], [438, 248], [442, 230], [444, 208], [454, 200], [470, 200], [495, 201], [515, 202], [526, 205], [529, 210], [543, 218], [548, 233], [534, 233], [522, 236], [516, 242], [508, 250], [495, 258], [494, 276], [492, 286], [470, 292], [465, 310], [462, 330], [470, 344], [478, 360], [490, 372], [502, 384], [516, 398], [530, 412], [548, 424], [575, 430], [600, 440], [600, 470], [405, 470]],
        // the side path south: down from the road to the frosted ground at the west foot of the cairn on the low rise
        // (short of the dead bracken beside it), then on down past the rise's rocks, with a little bay west at the bend,
        // and off the bottom edge (no exit there: the picture's edge stops her)
        [[622, 512], [632, 534], [645, 552], [657, 568], [672, 581], [695, 594], [713, 606], [725, 620], [737, 634], [748, 648], [758, 662], [752, 674], [740, 682], [722, 692], [705, 712], [680, 728], [660, 738], [645, 752], [625, 760], [608, 772], [588, 784], [568, 790], [560, 800], [550, 816], [520, 821], [470, 825], [466, 836], [478, 845], [505, 854], [528, 866], [545, 880], [552, 892], [564, 904], [600, 912], [628, 922], [645, 938], [660, 952], [672, 966], [680, 984], [688, 1000], [690, 1024],
         [830, 1024], [812, 1006], [805, 990], [797, 970], [790, 956], [773, 946], [760, 933], [740, 918], [726, 900], [707, 887], [683, 876], [645, 862], [640, 850], [640, 836], [648, 822], [640, 812], [637, 806], [660, 797], [676, 784], [700, 772], [712, 758], [722, 748], [740, 736], [762, 726], [780, 714], [798, 698], [830, 690], [856, 686], [866, 683], [870, 672], [856, 667], [848, 656], [846, 640], [836, 627], [824, 615], [808, 610], [790, 600], [779, 588], [774, 570], [770, 555], [700, 530], [640, 515]],
        // the short spur north from the road to the frozen tarn's shore, between the heather and the tarn's boulders
        [[988, 522], [992, 502], [1010, 493], [1040, 485], [1048, 471], [1052, 458], [1062, 446], [1072, 438], [1090, 437], [1097, 448], [1090, 462], [1082, 480], [1072, 496], [1068, 512], [1076, 530], [988, 530]],
      ],
      block: [],
      front: [
        { pts: [[904, 627], [933, 627], [940, 645], [946, 664], [958, 680], [965, 700], [968, 735], [962, 750], [876, 750], [868, 730], [870, 700], [879, 682], [888, 666], [897, 648]], base: 748 }, // the cairn on the low rise, at the south path's end
        { pts: [[393, 152], [418, 152], [425, 164], [437, 166], [438, 248], [392, 248]], base: 247 }, // the hut's corner pillar, beside its open front
        { pts: [[496, 300], [496, 257], [506, 251], [516, 243], [523, 237], [532, 235], [541, 236], [548, 241], [550, 250], [549, 300]], base: 300 }, // the end of the sheepfold's wall and its capstone, beside the hut's open front
      ],
      exits: [
        { rect: [0, 510, 18, 622], to: 'eldergrove-edge', at: [1484, 594], label: "Eldergrove's edge" },
        { rect: [1518, 517, 1536, 605], to: 'crossroads', at: [40, 485], dir: 'e', label: 'The northern crossroads' },
      ],
      people: [],
      spots: [],
      wild: { band: 3, scene: 'northern-crossroads', rate: 1 },
    },
    // frozen-camp: The frozen camp (art request 12, at night), traced from reference/art/walk/wilds/walk-frozen-camp.png
    'frozen-camp': {
      name: "The frozen camp", src: "art/walk/walk-frozen-camp.avif", band: 4, kind: 'camp', music: 'wild',
      start: [630, 452],
      walk: [
        // the shelf: the landing ground and the packed snow round it, west to the pine at the left edge (she steps over the
        // low ropes), the snow dip below it, behind the sled, the camp in front of the tents, and the trodden path east, past
        // the waterfall trail's mouth, off the right edge
        [[40, 290], [115, 290], [172, 292], [230, 287], [290, 280], [420, 268], [470, 266], [505, 274], [560, 276], [636, 278], [640, 336], [690, 344], [712, 368], [790, 352], [868, 338], [900, 348], [912, 372], [905, 410], [960, 460], [1048, 456], [1062, 472], [1082, 490], [1160, 494], [1265, 474], [1264, 458], [1292, 456], [1310, 462], [1314, 474], [1318, 490], [1360, 504], [1420, 514], [1462, 514], [1478, 522], [1500, 530], [1536, 524], [1536, 620], [1511, 606], [1445, 600], [1388, 594], [1358, 562], [1324, 552], [1295, 558], [1290, 566], [1240, 566], [1232, 552], [1150, 546], [1135, 554], [1068, 558], [1062, 580], [1040, 597], [960, 602], [925, 606], [840, 600], [760, 594], [742, 591], [724, 583], [723, 545], [653, 540], [580, 524], [578, 600], [565, 638], [500, 632], [451, 628], [418, 640], [404, 660], [394, 672], [392, 712], [380, 732], [344, 732], [338, 700], [330, 660], [256, 652], [208, 645], [200, 605], [175, 596], [139, 598], [110, 606], [80, 604], [74, 560], [68, 518], [72, 460], [78, 452], [78, 418], [70, 406], [63, 394], [63, 380], [56, 368], [46, 356], [37, 340], [30, 324], [20, 306], [16, 294]],
        // the snow lane north-west of the landing ground, winding up between the pines (just behind the tip of the one it
        // winds round) to the little clearing at its end, below the shrubs, the rock and the dark trees
        [[292, 290], [420, 284], [420, 205], [338, 200], [332, 178], [300, 176], [292, 150], [262, 128], [252, 112], [240, 98], [226, 92], [212, 91], [204, 84], [198, 74], [196, 62], [176, 58], [142, 56], [120, 56], [122, 80], [150, 92], [176, 98], [186, 106], [198, 116], [212, 128], [226, 152], [246, 174], [262, 194], [286, 198], [292, 210]],
        // the waterfall trail: up from the path between the thickets, round the frosted rocks to the frozen fall's foot,
        // and the little snow nook west of the rocks
        [[1160, 500], [1158, 470], [1170, 440], [1172, 400], [1160, 365], [1150, 330], [1150, 290], [1140, 256], [1128, 240], [1100, 236], [1060, 230], [1048, 200], [1044, 160], [1050, 128], [1070, 124], [1082, 150], [1100, 182], [1132, 196], [1146, 214], [1162, 236], [1220, 238], [1225, 205], [1232, 188], [1299, 188], [1305, 202], [1300, 240], [1284, 250], [1276, 272], [1240, 290], [1240, 345], [1250, 375], [1258, 420], [1265, 470], [1265, 500]],
        // the lookout path: down from the camp between the bushes to the snow and the flat rock tops at the bottom, up to
        // where their faces drop to the lower rocks (round the foot of the frosted boulder and the dark shrub on its west side)
        [[835, 590], [925, 590], [927, 650], [945, 700], [968, 750], [973, 800], [985, 815], [1008, 828], [1030, 850], [1050, 868], [1085, 882], [1105, 896], [1100, 914], [1075, 920], [1030, 922], [985, 924], [940, 924], [925, 914], [906, 912], [890, 918], [840, 920], [832, 934], [775, 934], [745, 922], [714, 908], [712, 882], [730, 870], [785, 868], [810, 857], [848, 853], [848, 826], [866, 823], [884, 818], [883, 800], [882, 750], [854, 700], [840, 650]],
      ],
      block: [
        [[94, 322], [126, 322], [126, 338], [94, 338]], [[480, 322], [512, 322], [512, 338], [480, 338]], // the landing ground's north stakes
        [[90, 580], [122, 580], [122, 597], [90, 597]], [[504, 580], [538, 580], [538, 597], [504, 597]], // and its south stakes
        [[556, 325], [585, 312], [700, 350], [714, 368], [714, 400], [655, 402], [556, 345]], // the sled
        [[757, 430], [764, 412], [780, 402], [803, 399], [826, 402], [842, 412], [850, 430], [842, 448], [826, 458], [803, 461], [780, 458], [764, 448]], // the fire's stone ring
        [[714, 396], [756, 396], [756, 414], [714, 414]], [[746, 384], [774, 384], [774, 399], [746, 399]], [[704, 424], [737, 424], [737, 442], [704, 442]], // the stumps west of the fire
        [[873, 444], [900, 444], [900, 462], [873, 462]], [[846, 470], [877, 470], [877, 489], [846, 489]], // and south-east of it
        [[842, 376], [878, 376], [878, 394], [842, 394]], // the barrel by the fire
        [[912, 352], [936, 352], [936, 372], [912, 372]], // the lantern post's foot
        [[882, 445], [930, 438], [958, 452], [960, 500], [920, 530], [866, 528], [862, 490]], // the firewood
        [[994, 877], [1031, 877], [1031, 901], [994, 901]], [[881, 895], [906, 895], [906, 916], [881, 916]], // rocks on the lookout
        [[729, 572], [740, 566], [756, 567], [761, 580], [729, 582]], // the snow-capped rock south-west of the fire
        [[338, 668], [345, 661], [355, 660], [361, 672], [356, 677], [339, 677]], // the rock in the snow dip
      ],
      front: [
        { pts: [[98, 272], [122, 272], [124, 300], [128, 318], [122, 336], [98, 336], [92, 318], [97, 300]], base: 334 }, // the landing ground's north-west stake
        { pts: [[484, 272], [508, 272], [511, 300], [514, 318], [508, 336], [484, 336], [478, 318], [482, 300]], base: 334 }, // its north-east stake
        { pts: [[122, 298], [300, 308], [482, 298], [482, 306], [300, 317], [122, 307]], base: 334 }, // the north rope between them
        { pts: [[94, 527], [118, 527], [121, 560], [126, 580], [120, 596], [94, 596], [88, 580], [92, 560]], base: 594 }, // its south-west stake
        { pts: [[510, 526], [534, 526], [536, 560], [542, 580], [534, 596], [510, 596], [504, 580], [508, 560]], base: 594 }, // its south-east stake
        { pts: [[118, 570], [310, 578], [508, 570], [508, 578], [310, 586], [118, 578]], base: 594 }, // the south rope between them
        { pts: [[552, 322], [572, 298], [592, 278], [600, 278], [600, 372], [552, 345]], base: 345 }, // the sled: its back end,
        { pts: [[600, 278], [636, 280], [650, 292], [650, 400], [600, 372]], base: 370 }, // its middle,
        { pts: [[650, 292], [680, 318], [690, 348], [706, 358], [710, 382], [690, 394], [660, 402], [650, 400]], base: 398 }, // and its front
        { pts: [[640, 226], [678, 226], [682, 280], [678, 328], [640, 330], [636, 280]], base: 328 }, // the barrels by the sled
        { pts: [[676, 262], [700, 232], [745, 172], [760, 168], [775, 175], [800, 205], [830, 240], [858, 280], [870, 330], [858, 340], [735, 366], [712, 366], [680, 330], [672, 300]], base: 340 }, // the big tent
        { pts: [[884, 280], [940, 280], [940, 296], [932, 300], [933, 368], [917, 368], [918, 300], [906, 300], [906, 334], [882, 334]], base: 366 }, // the lantern on its post
        { pts: [[842, 344], [878, 344], [882, 360], [880, 392], [842, 392], [838, 360]], base: 390 }, // the barrel by the fire
        { pts: [[803, 385], [809, 385], [814, 396], [820, 404], [824, 428], [788, 428], [792, 404], [798, 396]], base: 430 }, // the fire's flames, over her when she stands behind the ring
        { pts: [[905, 405], [918, 340], [935, 312], [990, 318], [1022, 330], [1048, 372], [1068, 420], [1066, 442], [1040, 452], [962, 460], [940, 440]], base: 412 }, // the small tent
        { pts: [[716, 376], [742, 376], [744, 412], [714, 412]], base: 412 }, { pts: [[748, 372], [772, 372], [774, 397], [746, 397]], base: 397 }, { pts: [[706, 402], [735, 402], [737, 440], [704, 440]], base: 440 }, // the stumps west of the fire
        { pts: [[871, 415], [900, 415], [902, 460], [868, 460]], base: 460 }, { pts: [[848, 450], [875, 450], [877, 487], [846, 487]], base: 487 }, // and south-east of it
        { pts: [[884, 445], [930, 434], [958, 448], [960, 500], [920, 502], [884, 478]], base: 470 }, { pts: [[862, 478], [918, 478], [922, 530], [866, 530], [860, 500]], base: 528 }, // the firewood: the stack, and the logs in front of it
        { pts: [[92, 18], [108, 34], [118, 56], [126, 80], [138, 104], [148, 130], [152, 162], [150, 200], [142, 240], [40, 240], [45, 150], [70, 60]], base: 245 }, // the big pine west of the snow lane
        { pts: [[188, 94], [200, 108], [214, 124], [226, 148], [248, 168], [242, 188], [240, 236], [185, 240], [126, 222], [145, 172], [160, 140], [176, 110]], base: 238 }, // the pine the lane winds round
        { pts: [[252, 184], [262, 188], [276, 196], [290, 204], [292, 246], [244, 246], [244, 200]], base: 245 }, // the little fir at the lane's bend
        { pts: [[1076, 84], [1110, 80], [1150, 88], [1168, 120], [1160, 160], [1132, 180], [1100, 178], [1080, 150]], base: 178 }, // the bare bush by the waterfall nook
        { pts: [[1064, 240], [1090, 234], [1120, 236], [1140, 246], [1146, 262], [1146, 340], [1064, 340]], base: 340 }, // the frosted bush below the nook
        { pts: [[72, 594], [88, 616], [108, 656], [136, 716], [124, 756], [22, 756], [30, 700], [52, 640]], base: 750 }, { pts: [[177, 590], [190, 610], [204, 650], [214, 700], [205, 734], [140, 734], [140, 690], [160, 630]], base: 728 }, // the pines below the landing ground's west end
        { pts: [[578, 600], [600, 540], [627, 519], [655, 560], [667, 640], [640, 700], [600, 700], [578, 660]], base: 690 }, // the pine east of the landing ground
        { pts: [[1150, 556], [1170, 542], [1195, 536], [1215, 544], [1232, 556], [1232, 605], [1150, 605]], base: 604 }, // the berry bush beside the path
        { pts: [[1284, 600], [1310, 560], [1324, 546], [1340, 565], [1355, 600], [1353, 640], [1284, 640]], base: 636 }, // the pine beside the path
      ],
      exits: [
        { rect: [1518, 524, 1536, 616], to: 'frostmere-shore', at: [50, 622], label: "Frostmere's shore" },
      ],
      people: [],
      spots: [
        { kind: 'rest', at: [800, 478], label: 'The frozen camp', note: 'A camp. Rest, and the game is saved.' },
      ],
      land: [306, 442],
    },
    // frostmere-shore: Frostmere's shore (art request 12, at night), traced from reference/art/walk/wilds/walk-frostmere-shore.png
    'frostmere-shore': {
      name: "Frostmere's shore", src: "art/walk/walk-frostmere-shore.avif", band: 4, kind: 'wild', music: 'wild',
      start: [50, 622],
      walk: [
        // the road in from the west edge to the fork below the rocks
        [[0, 589], [40, 587], [70, 581], [100, 575], [150, 567], [200, 564], [225, 558], [250, 553], [275, 544], [300, 535], [330, 526], [350, 519], [380, 509], [400, 499], [415, 486], [430, 468], [440, 452], [440, 432], [432, 420], [452, 410], [470, 396], [512, 396], [520, 410], [550, 414], [575, 402], [600, 392], [650, 392], [700, 402], [694, 425], [700, 440], [712, 446], [712, 470], [690, 468], [680, 465], [650, 461], [630, 452], [605, 445], [583, 451], [563, 461], [550, 476], [530, 488], [512, 499], [500, 516], [490, 532], [478, 550], [467, 570], [452, 588], [430, 592], [400, 595], [350, 594], [325, 597], [300, 600], [270, 610], [245, 618], [210, 626], [170, 632], [150, 638], [120, 646], [90, 652], [50, 655], [0, 657]],
        // the road from the fork up between the pines to the top edge
        [[560, 420], [575, 402], [590, 394], [605, 385], [620, 368], [640, 357], [660, 348], [674, 330], [690, 306], [698, 282], [706, 256], [726, 242], [745, 232], [758, 214], [762, 192], [758, 165], [756, 130], [755, 95], [752, 55], [746, 25], [740, 0], [812, 0], [816, 25], [822, 50], [834, 72], [843, 100], [846, 130], [848, 165], [849, 200], [838, 224], [822, 247], [808, 270], [792, 290], [778, 306], [766, 326], [756, 345], [738, 365], [718, 388], [702, 404], [694, 422], [680, 430], [600, 420]],
        // the side path from the fork up to the sheltered hollow among the rocks
        [[445, 440], [432, 420], [420, 408], [405, 398], [402, 380], [401, 360], [395, 345], [382, 332], [370, 318], [357, 304], [345, 293], [325, 285], [310, 278], [298, 268], [288, 256], [282, 244], [272, 232], [262, 220], [257, 205], [257, 185], [258, 168], [264, 155], [275, 148], [295, 146], [310, 150], [316, 162], [320, 180], [320, 215], [328, 230], [336, 246], [360, 250], [377, 252], [378, 282], [400, 287], [415, 292], [420, 305], [430, 316], [436, 330], [448, 342], [465, 352], [470, 370], [470, 396], [480, 420], [460, 440]],
        // the trodden way east from the fork to the boathouse, along its barrels (under them it takes in the top of the boulders' snow, so the way to the jetty is two people wide)
        [[680, 440], [700, 434], [715, 444], [730, 450], [750, 457], [777, 460], [790, 466], [797, 480], [810, 488], [827, 490], [848, 494], [852, 517], [880, 519], [886, 530], [912, 532], [914, 537], [934, 538], [935, 553], [945, 565], [900, 566], [860, 565], [830, 556], [818, 545], [805, 532], [790, 525], [770, 515], [755, 507], [745, 496], [730, 490], [712, 484], [700, 476], [688, 470], [680, 466]],
        // past the last barrel onto the jetty (the boathouse door's deck), and out along its planks to the end
        [[905, 566], [905, 539], [913, 538], [934, 538], [936, 530], [937, 519], [940, 506], [965, 494], [990, 482], [1000, 486], [1045, 487], [1080, 489], [1100, 491], [1160, 494], [1176, 498], [1177, 512], [1193, 513], [1197, 524], [1212, 528], [1300, 540], [1360, 553], [1422, 566], [1422, 600], [1360, 591], [1300, 578], [1240, 567], [1205, 562], [1188, 560], [1186, 546], [1165, 542], [1130, 532], [1100, 529], [1060, 523], [1040, 520], [1000, 519], [984, 519], [968, 522], [966, 552], [958, 559], [945, 565]],
      ],
      block: [],
      front: [
        { pts: [[27, 639], [29, 641], [30, 645], [31, 648], [33, 649], [39, 648], [40, 652], [40, 656], [44, 668], [50, 690], [50, 720], [30, 735], [12, 735], [0, 720], [0, 690], [8, 672], [14, 656], [19, 652], [20, 650], [23, 649], [24, 646], [25, 642]], base: 732 }, // the little pine at the road's west end
        { pts: [[326, 584], [330, 591], [330, 597], [338, 600], [344, 612], [346, 630], [346, 650], [330, 662], [318, 662], [304, 650], [304, 630], [308, 612], [314, 600], [320, 599], [321, 597], [322, 591]], base: 660 }, // the pine below the road
        { pts: [[273, 224], [278, 234], [284, 246], [290, 258], [296, 270], [300, 285], [292, 296], [258, 296], [254, 280], [258, 262], [263, 246], [268, 234]], base: 295 }, // the little pine at the hollow's mouth
        { pts: [[446, 256], [470, 248], [500, 250], [524, 272], [528, 300], [524, 335], [500, 348], [480, 350], [455, 343], [440, 333], [433, 312], [437, 290]], base: 348 }, // the big pine beside the path up to the hollow
        { pts: [[704, 412], [716, 393], [730, 379], [748, 367], [762, 361], [790, 362], [800, 380], [800, 410], [770, 440], [740, 445], [712, 440], [702, 427]], base: 440 }, // the snowy rocks between the road north and the way to the boathouse
        { pts: [[730, 466], [736, 476], [738, 479], [737, 481], [735, 486], [739, 487], [741, 489], [741, 496], [746, 497], [755, 499], [754, 506], [756, 512], [760, 530], [756, 545], [712, 545], [708, 525], [714, 505], [719, 490], [724, 476]], base: 545 }, // the pine beside the way to the boathouse (its tip's outline kept to the branches, not the cobbles beside them)
        { pts: [[838, 428], [874, 351], [978, 375], [940, 455], [940, 512], [848, 514], [846, 440]], base: 513 }, // the boathouse's roof and long wall (not its door end: she stands in front of that on the deck)
        { pts: [[913, 509], [936, 509], [938, 520], [937, 540], [913, 540], [912, 520]], base: 537 }, // the last barrel, by the jetty (its line a little above its foot, so she's in front when she stands at it)
        { pts: [[965, 498], [981, 498], [982, 590], [964, 590]], base: 590 }, { pts: [[1015, 493], [1033, 493], [1034, 580], [1014, 580]], base: 580 }, // the jetty's posts on its south side
        { pts: [[1110, 508], [1126, 508], [1126, 577], [1110, 577]], base: 577 }, { pts: [[1167, 519], [1186, 519], [1186, 600], [1167, 600]], base: 600 },
        { pts: [[1320, 539], [1341, 539], [1341, 633], [1320, 633]], base: 633 }, { pts: [[1423, 566], [1441, 566], [1442, 650], [1423, 650]], base: 650 },
        { pts: [[1193, 486], [1211, 486], [1211, 527], [1193, 527]], base: 524 }, // the post where the jetty turns (its line a little above its foot, as the barrel's)
        { pts: [[1177, 434], [1196, 433], [1222, 436], [1222, 481], [1202, 481], [1202, 452], [1192, 452], [1192, 511], [1177, 511]], base: 511 }, // the cold lantern on its post
      ],
      exits: [
        { rect: [0, 589, 18, 657], to: 'frozen-camp', at: [1478, 562], label: 'The frozen camp' },
        { rect: [740, 0, 812, 18], to: 'frozen-pass', at: [788, 990], dir: 'n', label: 'The frozen pass' },
      ],
      people: [],
      spots: [],
      wild: { band: 4, scene: 'frozen-road', rate: 1 },
    },
  };
  G.MAPS = MAPS;
})(typeof globalThis !== 'undefined' ? globalThis : window);
