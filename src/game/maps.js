// maps.js: the ground-level maps (art request 04) traced for walking (plan step 18). Every position is in the paintings'
// own 1536 x 1024 pixels, whatever size the image ships at. For each map:
//   walk:   polygons Io's feet can stand inside (their union): the painted ground she can see, the cobbles, paths, stairs,
//           decks and bridges, traced close to the painting (October 3, the paper-doll walk); block: polygons cut out of
//           them (wells, stalls, rocks, lamp posts' feet)
//   front:  pieces of the painting that stand up off the ground (lamp posts, trees, the well's frame), each { pts, base }:
//           the piece is drawn again over Io, or anyone, whose feet are above (behind) its base line
//   exits:  rectangles that take her to another map (`to`, arriving at `at` there) or out to the world map (`to: 'world'`)
//   people: who stands where, how they look (`look`, a pixel figure from sprites.js) and what they say (`talk`, in
//           script.js); `role` makes them a shop or an inn
//   spots:  things to look at or use: `rest` (an inn bed or a camp: HP and MP back, and the game is saved), `well` (a
//           small well with a letter and a gift), `event` (a story beat or a set fight when she walks into `rect`)
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
      name: 'Wickhollow', src: "art/walk/walk-wickhollow-square.webp", band: 1, kind: 'town', music: 'town',
      start: [777, 600],
      walk: [
        // the square: from the big house's front and Nettie's stall, past the chapel steps and the forge, over the
        // stone bridge east; down the middle house's west side to its door; and the south road down to the cottage
        [[262, 405], [345, 405], [500, 402], [512, 418], [560, 412], [612, 405], [622, 395], [625, 300], [735, 296], [742, 275], [742, 232], [810, 232], [812, 275], [822, 294], [950, 292], [955, 350], [1075, 352], [1080, 372], [1240, 376], [1300, 354], [1536, 354], [1536, 396], [1300, 398], [1256, 414], [1080, 412], [1078, 498], [1040, 500], [1038, 548], [1080, 560], [1086, 618], [1125, 620], [1128, 602], [1150, 602], [1160, 625], [1162, 670], [1040, 670], [1037, 598], [966, 598], [962, 645], [850, 655], [816, 700], [816, 1024], [745, 1024], [745, 625], [690, 612], [600, 612], [565, 600], [565, 458], [375, 458], [282, 458], [262, 452]],
        [[266, 255], [294, 255], [294, 410], [266, 410]], // the lane up the big house's west side
        [[244, 440], [282, 440], [282, 505], [300, 505], [300, 600], [290, 640], [272, 640], [190, 640], [188, 548], [244, 548]], // down the west stairs and the ramp beside them
        [[160, 630], [272, 630], [272, 700], [268, 745], [264, 775], [212, 775], [205, 738], [160, 738]], // the landing, and the steps down to the lane
        [[136, 698], [175, 690], [178, 742], [136, 745]], // round the tree to the lower jetty
        [[0, 706], [152, 706], [152, 760], [0, 760]], // the lower jetty
        [[205, 772], [280, 772], [312, 818], [745, 818], [745, 846], [725, 848], [292, 848], [272, 826], [220, 815]], // the lane under the garden fence
        [[452, 718], [482, 718], [486, 822], [454, 822]], [[432, 712], [502, 712], [502, 734], [432, 734]], // through the garden gate to the lower house's door
      ],
      block: [
        // the Moonwell's low wall and flower beds, a ring open to the south, and the well itself inside it
        [...arc(777, 462, 122, 100, 105, 435, 22), ...arc(777, 462, 86, 64, 435, 105, 22)],
        [...arc(777, 452, 44, 47, 0, 360, 16)],
        [[1046, 632], [1093, 632], [1093, 662], [1046, 662]], // the bench by the middle house
        ...lampBlocks(WICK_LAMPS),
      ],
      front: [
        ...lampFronts(WICK_LAMPS),
        { pts: [[740, 333], [814, 333], [814, 405], [819, 410], [819, 484], [802, 484], [802, 410], [752, 410], [752, 484], [735, 484], [735, 410], [740, 405]], base: 484 }, // the Moonwell's iron frame
        { pts: [[962, 572], [1040, 572], [1044, 640], [1030, 672], [972, 672], [960, 640]], base: 672 }, // the pine by the middle house
        { pts: [[282, 446], [352, 446], [356, 500], [334, 532], [296, 532], [282, 505]], base: 530 }, // the dark tree by the west stairs
        { pts: [[130, 664], [200, 664], [202, 712], [180, 730], [140, 730], [128, 712]], base: 728 }, // the tree by the lower jetty
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
      ],
    },
    // Io's cottage, in the woods south of the square, with her garden: where the story starts
    cottage: {
      name: "Io's cottage", src: "art/walk/walk-wickhollow-cottage.webp", band: 1, kind: 'town', music: 'home',
      start: [838, 520],
      walk: [
        // the lane down from the square between its two lamp pillars, the nook behind the pear tree, the bend west under
        // the stone kerb, and the path down the garden's west side to the foot of the stairs
        [[500, 0], [604, 0], [604, 122], [598, 132], [603, 160], [608, 180], [612, 200], [616, 225], [620, 245], [626, 262], [722, 264], [724, 287], [698, 290], [684, 300], [600, 300], [600, 337], [528, 339], [527, 372], [520, 375], [496, 357], [470, 352], [442, 356], [404, 361], [386, 374], [377, 398], [372, 432], [348, 440], [345, 500], [352, 530], [356, 570], [360, 640], [357, 668], [354, 720], [358, 762], [285, 762], [284, 668], [293, 640], [293, 545], [285, 515], [260, 490], [258, 445], [262, 397], [290, 376], [311, 364], [348, 353], [379, 343], [416, 326], [456, 305], [470, 296], [490, 278], [512, 255], [538, 232], [537, 200], [530, 175], [522, 160], [512, 135], [500, 122]],
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
        [[1000, 456], [1086, 456], [1100, 432], [1224, 428], [1232, 394], [1300, 394], [1345, 400], [1400, 410], [1418, 426], [1428, 448], [1428, 500], [1424, 522], [1430, 542], [1440, 562], [1446, 582], [1452, 602], [1460, 622], [1468, 642], [1478, 660], [1492, 676], [1508, 690], [1522, 702], [1536, 710], [1536, 772], [1474, 772], [1466, 756], [1458, 738], [1446, 716], [1432, 696], [1424, 674], [1416, 652], [1404, 632], [1390, 610], [1378, 586], [1368, 564], [1350, 546], [1334, 524], [1326, 500], [1300, 476], [1240, 474], [1230, 464], [1168, 464], [1124, 466], [1104, 480], [1000, 480]],
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
        { rect: [680, 1004, 812, 1024], to: 'world', at: 'wickhollow', label: 'The world' },
        { rect: [0, 397, 18, 442], to: 'world', at: 'wickhollow', label: 'The world' },
        { rect: [1516, 722, 1536, 770], to: 'world', at: 'wickhollow', label: 'The world' },
      ],
      people: [],
      spots: [
        { kind: 'rest', at: [838, 470], label: 'Home', note: "Io's own bed. Rest, and the game is saved." },
        { kind: 'look', at: [592, 466], label: 'The letters', note: 'A bundle of letters to the dead, tied with ribbon. Every year Io means to burn them on the longest night, and every year she doesn’t.' },
      ],
    },
    // the jetty on the lake west of the square, where Quill moors his old skiff, the Magpie
    jetty: {
      name: 'The jetty', src: "art/walk/walk-wickhollow-jetty.webp", band: 1, kind: 'town', music: 'town',
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
      name: 'The Thornwood', src: "art/walk/walk-thornwood.webp", band: 1, kind: 'wild', music: 'wild',
      start: [60, 456],
      walk: [
        // the road: in from the west, over the old bridge between its parapets, through the fork below the moon stone's
        // clearing, and on east to Bogmire
        [[0, 400], [40, 400], [70, 404], [90, 414], [110, 428], [150, 432], [165, 440], [200, 444], [238, 448], [264, 448], [280, 442], [300, 436], [330, 428], [360, 424], [380, 423], [400, 424], [430, 428], [460, 434], [490, 442], [502, 448], [528, 448], [560, 450], [600, 452], [640, 455], [660, 466], [690, 474], [720, 480], [760, 478], [800, 470], [850, 468], [870, 452], [886, 440], [900, 400], [1000, 395], [1100, 395], [1150, 400], [1172, 420], [1178, 455], [1200, 466], [1240, 474], [1270, 486], [1286, 496], [1322, 512], [1360, 520], [1440, 516], [1470, 508], [1536, 504], [1536, 562], [1500, 562], [1470, 556], [1440, 566], [1400, 578], [1360, 580], [1320, 578], [1290, 574], [1260, 568], [1230, 560], [1200, 552], [1170, 532], [1150, 516], [1120, 494], [1100, 486], [1080, 464], [1060, 455], [1040, 446], [1000, 446], [980, 450], [960, 464], [940, 481], [920, 493], [900, 510], [880, 513], [860, 538], [820, 545], [780, 550], [730, 548], [700, 540], [670, 530], [640, 520], [600, 512], [560, 506], [540, 500], [528, 482], [502, 482], [480, 478], [450, 472], [420, 468], [380, 467], [340, 469], [310, 474], [280, 480], [264, 482], [238, 484], [215, 488], [190, 494], [160, 498], [140, 496], [120, 486], [100, 482], [80, 480], [60, 476], [40, 470], [20, 464], [0, 462]],
        // the moon stone's clearing, up from the fork: west of the stone, and the cobbles behind the rocks there
        [[884, 446], [880, 410], [868, 390], [880, 372], [876, 360], [852, 350], [846, 334], [800, 324], [812, 306], [834, 296], [846, 280], [856, 262], [872, 254], [884, 244], [896, 232], [900, 200], [920, 184], [960, 182], [984, 188], [990, 230], [984, 252], [966, 268], [952, 290], [948, 316], [956, 336], [1000, 340], [1034, 344], [1032, 400], [960, 400]],
        // and east of it, the arm that bends back up to the stone's far side
        [[1090, 400], [1110, 386], [1130, 362], [1140, 330], [1136, 304], [1112, 292], [1100, 262], [1080, 252], [1058, 248], [1058, 236], [1100, 232], [1142, 236], [1148, 256], [1200, 262], [1228, 268], [1250, 288], [1262, 310], [1262, 340], [1240, 354], [1212, 362], [1192, 382], [1176, 402], [1170, 420], [1100, 420]],
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
      ],
      wild: { band: 1, scene: 'thornwood-bridge', rate: 1 },
    },
    // Bogmire: the stilt town on the fen, its boardwalks round a market square. The great wraith has stolen its lamps.
    bogmire: {
      name: 'Bogmire', src: "art/walk/walk-bogmire.webp", band: 1, kind: 'town', music: 'town',
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
      name: "The fen's dark heart", src: "art/walk/walk-bogmire-heart.webp", band: 1, kind: 'gate', music: 'dread',
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
      name: 'Dawnroost', src: "art/walk/walk-dawnroost.webp", band: 2, kind: 'town', music: 'town',
      start: [645, 990],
      walk: [
        [[590, 0], [648, 0], [648, 196], [590, 196]], // out through the north gate, up to the living node
        [[520, 192], [756, 192], [756, 232], [520, 232]], // the forecourt inside the gate
        [[108, 205], [540, 205], [540, 232], [528, 243], [140, 243], [140, 226], [108, 226]], // the lane behind the Warden hall
        [[580, 230], [662, 230], [662, 380], [678, 386], [678, 456], [566, 456], [566, 420], [580, 420]], // the road down from the gate
        // the yard in front of the Warden hall, from the hall's door down to the weapon racks and the chained posts, and
        // the way east to the road, behind the two trees over the cottage
        [[140, 470], [224, 470], [224, 471], [251, 471], [251, 468], [273, 468], [273, 460], [291, 460], [291, 450], [319, 450], [319, 446], [361, 446], [361, 450], [385, 450], [385, 464], [407, 464], [407, 450], [424, 450], [424, 474], [566, 474], [566, 456], [584, 456], [584, 516], [484, 516], [484, 505], [355, 505], [355, 516], [327, 516], [327, 548], [316, 548], [316, 572], [150, 572], [150, 540], [140, 540]],
        [[584, 456], [684, 456], [684, 500], [680, 560], [690, 628], [584, 628]], // the road past the well
        // the yard east of the road: past the paddock fence, round the well, to the forge
        [[662, 406], [762, 406], [762, 456], [1244, 456], [1244, 490], [1196, 490], [1196, 470], [1156, 470], [1156, 528], [1116, 528], [1116, 520], [1086, 520], [1086, 506], [1028, 506], [1028, 518], [990, 518], [990, 532], [982, 548], [948, 560], [948, 652], [684, 652], [684, 470], [662, 470]],
        [[584, 626], [690, 626], [690, 640], [948, 640], [948, 652], [840, 656], [840, 682], [776, 684], [764, 698], [584, 698]], // south of the well
        [[880, 640], [948, 640], [948, 646], [966, 646], [966, 667], [1164, 667], [1164, 720], [1022, 720], [1022, 709], [943, 709], [943, 692], [930, 690], [930, 664], [880, 662]], // between the pines to the forge's open front
        [[600, 696], [692, 696], [692, 848], [600, 848]], [[588, 840], [700, 840], [692, 900], [690, 1024], [592, 1024], [588, 900]], // out through the main gate, and the hill road
        // the lane east of the stables, round to the gateway in the east wall, and the dock
        [[1080, 254], [1198, 254], [1206, 300], [1252, 304], [1252, 358], [1194, 358], [1194, 470], [1152, 470], [1152, 340], [1080, 340]],
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
        { rect: [592, 1006, 690, 1024], to: 'world', at: 'dawnroost', label: 'The world' },
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
      name: "Dawnroost's living node", src: "art/walk/walk-dawnroost-node.webp", band: 2, kind: 'gate', music: 'dread',
      start: [768, 990],
      walk: [
        // the court: under the stairs, along the plant beds and benches, round the braziers and the sunstone's chained
        // dais (up its open front steps to the crystal), down past the barrels and the stall and rack to the gate wall
        [[207, 335], [271, 335], [272, 384], [308, 385], [311, 361], [349, 361], [360, 339], [362, 246], [428, 246], [428, 252], [508, 252], [508, 246], [540, 246], [540, 265], [591, 265], [591, 173], [642, 173], [643, 220], [657, 220], [684, 214], [692, 216], [706, 248], [721, 248], [723, 230], [815, 230], [817, 248], [831, 248], [846, 216], [854, 214], [880, 220], [895, 220], [896, 173], [950, 173], [950, 263], [995, 263], [995, 246], [1030, 246], [1030, 252], [1110, 252], [1110, 246], [1176, 246], [1175, 338], [1184, 361], [1222, 361], [1226, 386], [1260, 386], [1264, 335], [1329, 335], [1328, 395], [1318, 398], [1318, 428], [1284, 429], [1210, 432], [1198, 446], [1180, 462], [1158, 470], [1158, 655], [1110, 655], [1060, 650], [1047, 640], [1030, 632], [998, 626], [977, 637], [966, 630], [964, 616], [916, 616], [916, 624], [880, 626], [832, 628], [712, 628], [657, 627], [620, 624], [620, 616], [572, 616], [571, 630], [552, 630], [523, 626], [500, 634], [482, 640], [414, 646], [357, 646], [369, 634], [369, 556], [366, 540], [368, 515], [362, 482], [340, 466], [312, 448], [300, 425], [262, 420], [238, 410], [207, 405]],
        [[124, 109], [281, 109], [281, 150], [271, 156], [271, 338], [207, 338], [207, 158], [163, 156], [163, 147], [132, 146], [132, 125], [124, 124]], // up the west stairs to the wall walk
        [[1257, 109], [1404, 109], [1404, 124], [1378, 127], [1376, 148], [1331, 151], [1330, 338], [1265, 338], [1265, 130], [1257, 128]], // up the east stairs to the wall walk
        [[714, 618], [830, 618], [830, 834], [714, 834]], // through the gate
        [[699, 828], [835, 828], [838, 1024], [697, 1024]], // the road down to Dawnroost
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
      name: 'The northern crossroads', src: "art/walk/walk-northern-crossroads.webp", band: 3, kind: 'wild', music: 'wild',
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
        { rect: [678, 1004, 852, 1024], to: 'world', at: 'crossroads', label: 'The world' },
        { rect: [0, 440, 18, 530], to: 'world', at: 'crossroads', label: 'The world' },
        { rect: [1518, 438, 1536, 538], to: 'world', at: 'crossroads', label: 'The world' },
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
      name: 'The shipyard', src: "art/walk/walk-shipyard.webp", band: 3, kind: 'town', music: 'town',
      start: [760, 990],
      walk: [
        // the yard: from the bunkhouse's doors, past the crates on the battlement, the gatehouse and the slip's foot,
        // round the timber and the cranes, to the hall's front and the stairs by the east tower
        [[294, 466], [332, 466], [368, 476], [421, 478], [421, 470], [451, 470], [451, 480], [477, 480], [479, 478], [489, 478], [490, 469], [508, 469], [508, 432], [521, 432], [521, 380], [514, 378], [514, 352], [507, 350], [507, 256], [590, 256], [590, 276], [563, 278], [563, 372], [548, 376], [548, 454], [611, 454], [636, 462], [642, 467], [886, 467], [898, 455], [972, 452], [972, 432], [986, 432], [986, 374], [1023, 374], [1023, 240], [1080, 240], [1080, 310], [1064, 310], [1064, 346], [1069, 360], [1069, 413], [1052, 416], [1052, 466], [1057, 474], [1057, 524], [1112, 524], [1112, 531], [1167, 531], [1170, 514], [1216, 514], [1219, 522], [1240, 522], [1247, 532], [1270, 532], [1296, 545], [1356, 545], [1356, 506], [1498, 506], [1498, 548], [1355, 548], [1355, 568], [1263, 568], [1263, 552], [1091, 552], [1091, 560], [1013, 560], [1013, 492], [925, 492], [925, 520], [909, 522], [904, 518], [888, 500], [872, 486], [858, 500], [842, 518], [836, 512], [814, 512], [814, 549], [712, 549], [712, 512], [690, 512], [684, 518], [666, 500], [650, 486], [634, 500], [618, 518], [610, 530], [575, 530], [575, 503], [529, 503], [529, 494], [507, 494], [507, 505], [484, 505], [481, 514], [421, 514], [421, 537], [398, 538], [398, 556], [386, 556], [386, 549], [361, 549], [361, 512], [330, 512], [322, 500], [294, 500]],
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
      name: 'The frozen pass', src: "art/walk/walk-frozen-pass.webp", band: 4, kind: 'wild', music: 'wild',
      start: [790, 990],
      walk: [
        [[712, 0], [842, 0], [845, 310], [700, 310]], // up to Misthollow
        [[700, 300], [845, 300], [845, 505], [700, 505]], // the bridge over the frozen river
        [[620, 495], [900, 495], [905, 1024], [680, 1024], [640, 760]],
        [[565, 535], [640, 535], [650, 725], [575, 725]], // the lamp
      ],
      block: [[[588, 598], [616, 598], [616, 690], [588, 690]]],
      exits: [
        { rect: [712, 0, 842, 16], to: 'misthollow', at: [768, 985], label: 'Misthollow' },
        { rect: [680, 1008, 905, 1024], to: 'world', at: 'frozenPass', label: 'The world' },
      ],
      people: [],
      spots: [
        { kind: 'rest', at: [870, 590], label: 'The sled camp', note: 'Someone’s sled, left with a lamp burning. Camp here: HP and MP back, and the game is saved.' },
      ],
      wild: { band: 4, scene: 'frozen-road', rate: 1 },
    },
    // Misthollow: the town of pale towers on the peaks, whose Moonwell has gone dark
    misthollow: {
      name: 'Misthollow', src: "art/walk/walk-misthollow.webp", band: 4, kind: 'town', music: 'town',
      start: [768, 1000],
      walk: [
        [[700, 0], [836, 0], [860, 560], [680, 560]], // the street up to the Moonwell
        [[680, 540], [860, 540], [860, 610], [680, 610]],
        [[390, 600], [1010, 600], [1010, 715], [390, 715]], // the upper square
        [[615, 700], [908, 700], [908, 790], [615, 790]], // the great stair
        [[340, 780], [1210, 780], [1300, 965], [265, 965]], // the lower square
        [[670, 960], [866, 960], [866, 1024], [670, 1024]],
      ],
      block: [
        [[530, 775], [628, 775], [628, 824], [530, 824]], [[894, 782], [978, 782], [978, 831], [894, 831]], // barrels
        [[475, 880], [503, 880], [503, 978], [475, 978]], [[1020, 880], [1047, 880], [1047, 978], [1020, 978]], // the banners
      ],
      exits: [
        { rect: [700, 0, 836, 16], to: 'moonwell', at: [775, 990], label: 'The dead Moonwell' },
        { rect: [670, 1008, 866, 1024], to: 'frozen-pass', at: [777, 30], label: 'The frozen pass' },
      ],
      people: [
        { id: 'sorrel', name: 'Sorrel', at: [524, 620], look: 'witch2', talk: 'sorrel', role: 'shop' },
        { id: 'ede', name: 'Ede', at: [999, 640], look: 'elder', talk: 'ede', role: 'inn' },
        { id: 'watch', name: 'The watchwoman', at: [700, 860], look: 'smith', talk: 'watch' },
      ],
      spots: [
        { kind: 'rest', at: [960, 650], label: 'The Lantern House', note: 'The last inn with a fire lit. Rest, and the game is saved.' },
        { kind: 'well', id: 'mistwell', at: [380, 900], label: 'A frozen trough', note: 'Under the ice, a letter in a jar.' },
      ],
    },
    // the dead Moonwell above Misthollow: the finale
    moonwell: {
      name: 'The dead Moonwell', src: "art/walk/walk-misthollow-moonwell.webp", band: 4, kind: 'gate', music: 'dread',
      start: [775, 990],
      walk: [
        [[420, 200], [1130, 200], [1150, 420], [1100, 560], [930, 620], [890, 700], [660, 700], [620, 620], [440, 560], [400, 420]], // the court
        [[663, 690], [887, 690], [887, 1024], [663, 1024]], // the stair up from the town
        [[720, 100], [815, 100], [815, 210], [720, 210]],
      ],
      block: [ring(768, 432, 140, 18)],
      exits: [
        { rect: [663, 1008, 887, 1024], to: 'misthollow', at: [768, 30], label: 'Misthollow' },
      ],
      people: [],
      spots: [
        { kind: 'event', id: 'finale', rect: [560, 560, 980, 680], fight: 'finale', once: 'finale' },
      ],
    },
  };
  G.MAPS = MAPS;
})(typeof globalThis !== 'undefined' ? globalThis : window);
