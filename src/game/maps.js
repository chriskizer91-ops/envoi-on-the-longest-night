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
        [[515, 0], [620, 0], [620, 362], [515, 362]], // up to the square
        [[251, 349], [726, 349], [726, 478], [251, 478]], // the yard west of the cottage
        [[1019, 391], [1536, 391], [1536, 470], [1019, 470]], // the path east into the woods
        [[0, 380], [272, 380], [272, 460], [0, 460]], // the footbridge over the stream
        [[782, 455], [893, 455], [893, 500], [782, 500]], // the porch
        [[700, 452], [800, 452], [800, 497], [700, 497]], // from the yard to the porch
        [[880, 452], [1030, 452], [1030, 500], [880, 500]], // from the porch to the path east
        [[803, 480], [873, 480], [873, 670], [803, 670]], // the garden path
        [[747, 650], [840, 650], [840, 1024], [747, 1024]], // the gate and the way south
        [[279, 461], [372, 461], [372, 800], [279, 800]], // down the west side of the garden
        [[279, 800], [790, 800], [790, 870], [279, 870]],
        [[1326, 461], [1536, 461], [1536, 740], [1326, 740]], // the path bending south-east
      ],
      block: [[[530, 419], [656, 419], [656, 478], [530, 478]]], // the potting bench
      exits: [
        { rect: [515, 0, 620, 18], to: 'wickhollow', at: [788, 975], label: 'Wickhollow' },
        { rect: [747, 1006, 840, 1024], to: 'world', at: 'wickhollow', label: 'The world' },
        { rect: [0, 380, 18, 460], to: 'world', at: 'wickhollow', label: 'The world' },
        { rect: [1518, 391, 1536, 740], to: 'world', at: 'wickhollow', label: 'The world' },
      ],
      people: [],
      spots: [
        { kind: 'rest', at: [838, 470], label: 'Home', note: "Io's own bed. Rest, and the game is saved." },
        { kind: 'look', at: [592, 428], label: 'The letters', note: 'A bundle of letters to the dead, tied with ribbon. Every year Io means to burn them on the longest night, and every year she doesn’t.' },
      ],
    },
    // the jetty on the lake west of the square, where Quill moors his old skiff, the Magpie
    jetty: {
      name: 'The jetty', src: "art/walk/walk-wickhollow-jetty.webp", band: 1, kind: 'town', music: 'town',
      start: [782, 60],
      walk: [
        [[726, 0], [838, 0], [838, 405], [726, 405]], // the lane down from the square
        [[530, 321], [1298, 321], [1298, 405], [530, 405]], // the waterfront
        [[712, 398], [838, 398], [838, 461], [712, 461]], // the steps
        [[663, 447], [872, 447], [872, 782], [663, 782]], // the pier
        [[872, 475], [1103, 475], [1103, 510], [872, 510]],
        [[1068, 482], [1103, 482], [1103, 789], [1068, 789]],
        [[872, 761], [1103, 761], [1103, 789], [872, 789]],
      ],
      block: [[[1033, 209], [1298, 209], [1298, 360], [1033, 360]]], // the stall
      exits: [
        { rect: [726, 0, 838, 18], to: 'wickhollow', at: [40, 740], label: 'Wickhollow' },
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
        [[0, 418], [250, 425], [250, 495], [0, 498]], // the road from the west
        [[240, 430], [520, 430], [520, 480], [240, 480]], // the old bridge
        [[510, 440], [720, 450], [720, 550], [510, 535]],
        [[715, 458], [860, 440], [960, 385], [1010, 385], [1010, 500], [860, 560], [715, 555]], // up to the fork
        [[990, 412], [1120, 425], [1300, 470], [1536, 495], [1536, 570], [1300, 560], [1120, 505], [990, 495]], // the road east
        [[870, 300], [1040, 305], [1040, 350], [970, 405], [880, 410]], // the way up to the moon stone
        [[1050, 228], [1200, 228], [1262, 300], [1250, 475], [1180, 475], [1175, 330], [1130, 298], [1050, 298]], // round the stone and down again
      ],
      block: [],
      exits: [
        { rect: [0, 418, 18, 498], to: 'wickhollow', at: [1490, 378], label: 'Wickhollow' },
        { rect: [1518, 495, 1536, 570], to: 'bogmire', at: [70, 368], label: 'Bogmire' },
      ],
      people: [],
      spots: [
        { kind: 'well', id: 'moonstone', at: [960, 330], label: 'The moon stone', note: 'An old stone with the crescent cut deep in it. Someone has left something at its foot.' },
      ],
      wild: { band: 1, scene: 'thornwood-bridge', rate: 1 },
    },
    // Bogmire: the stilt town on the fen, its boardwalks round a market square. The great wraith has stolen its lamps.
    bogmire: {
      name: 'Bogmire', src: "art/walk/walk-bogmire.webp", band: 1, kind: 'town', music: 'town',
      start: [70, 368],
      walk: [
        [[30, 338], [255, 338], [255, 402], [30, 402]], // the west dock
        [[140, 338], [238, 338], [238, 645], [140, 645]], // down the west dock
        [[30, 456], [150, 456], [150, 484], [30, 484]], [[30, 522], [150, 522], [150, 553], [30, 553]], [[30, 587], [150, 587], [150, 618], [30, 618]], // its fingers
        [[235, 402], [530, 402], [530, 446], [235, 446]], // the west boardwalk into the square
        [[326, 228], [372, 228], [372, 405], [326, 405]], // the stair up to the north-west houses
        [[250, 205], [698, 205], [698, 246], [250, 246]],
        [[524, 330], [1028, 330], [1028, 540], [524, 540]], // the market square
        [[765, 0], [815, 0], [815, 335], [765, 335]], // the long walk north, to the fen's dark heart
        [[736, 100], [845, 100], [845, 152], [736, 152]],
        [[815, 205], [1024, 205], [1024, 246], [815, 246]],
        [[1020, 408], [1305, 408], [1305, 462], [1020, 462]], // the east boardwalk
        [[1192, 296], [1240, 296], [1240, 410], [1192, 410]], // the inn's stair
        [[1075, 244], [1380, 244], [1380, 302], [1075, 302]], // the inn's porch
        [[1255, 405], [1308, 405], [1308, 708], [1255, 708]], // south on the east side
        [[1305, 562], [1480, 562], [1480, 604], [1305, 604]],
        [[1300, 704], [1485, 704], [1485, 765], [1300, 765]],
        [[751, 535], [810, 535], [810, 815], [751, 815]], // south from the square
        [[715, 810], [824, 810], [824, 878], [715, 878]],
        [[373, 742], [751, 742], [751, 797], [373, 797]], [[634, 703], [751, 703], [751, 754], [634, 754]], // the south-west houses
        [[300, 725], [380, 725], [380, 768], [300, 768]],
        [[809, 756], [1310, 756], [1310, 800], [809, 800]], // the south-east houses
      ],
      block: [
        [[589, 330], [727, 330], [727, 446], [589, 446]], // the herb stall
        [[834, 330], [976, 330], [976, 456], [834, 456]], // the market stall
        [[750, 362], [802, 362], [802, 514], [750, 514]], // the lamp and its planter
      ],
      exits: [
        { rect: [30, 338, 46, 402], to: 'thornwood', at: [1500, 532], label: 'The Thornwood' },
        { rect: [765, 0, 815, 16], to: 'bogmire-heart', at: [768, 980], label: "The fen's dark heart" },
      ],
      people: [
        { id: 'wenna', name: 'Old Wenna', at: [655, 470], look: 'elder', talk: 'wenna', role: 'shop' },
        { id: 'tobb', name: 'Tobb', at: [1230, 270], look: 'smith', talk: 'tobb', role: 'inn' },
        { id: 'pell', name: 'Pell', at: [1000, 420], look: 'child', talk: 'pell' },
      ],
      spots: [
        { kind: 'rest', at: [1150, 270], label: 'The Lanternless Inn', note: 'Tobb keeps a bed for anyone who brings light. Rest, and the game is saved.' },
        { kind: 'well', id: 'bogwell', at: [780, 860], label: 'The water stair', note: 'A bucket on a rope, and something wrapped in oilcloth tied to it.' },
      ],
    },
    // the fen's dark heart: the drowned square north of Bogmire, where the great wraith sits on the stolen lamps (the gate)
    'bogmire-heart': {
      name: "The fen's dark heart", src: "art/walk/walk-bogmire-heart.webp", band: 1, kind: 'gate', music: 'dread',
      start: [768, 980],
      walk: [
        [[726, 676], [817, 676], [817, 1024], [726, 1024]], // the long walk in from Bogmire
        [[500, 300], [1045, 300], [1045, 684], [500, 684]], // the square
        [[733, 180], [803, 180], [803, 305], [733, 305]], // up to the drowned hall
        [[600, 168], [936, 168], [936, 206], [600, 206]],
      ],
      block: [],
      exits: [
        { rect: [726, 1006, 817, 1024], to: 'bogmire', at: [790, 30], label: 'Bogmire' },
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
        [[592, 0], [662, 0], [662, 205], [592, 205]], // out through the north gate, up to the living node
        [[85, 440], [525, 440], [525, 470], [595, 470], [595, 200], [700, 200], [700, 448], [1110, 448], [1110, 205], [1240, 205], [1240, 330], [1300, 330], [1300, 388], [1272, 388], [1272, 708], [700, 708], [700, 1024], [595, 1024], [595, 710], [254, 710], [85, 575]],
        [[1285, 210], [1520, 210], [1520, 405], [1285, 405]], // the dock
      ],
      block: [
        [[95, 460], [215, 460], [215, 595], [95, 595]], // the weapon racks
        [[225, 482], [325, 482], [325, 578], [225, 578]], // the posts and chains
        [[340, 520], [515, 520], [515, 678], [340, 678]], [[275, 600], [345, 600], [345, 668], [275, 668]], // the cottage and its crates
        ring(780, 538, 62), // the well
        [[975, 530], [1272, 530], [1272, 688], [975, 688]], // the forge
      ],
      exits: [
        { rect: [592, 0, 662, 16], to: 'dawnroost-node', at: [768, 990], label: 'The living node' },
        { rect: [595, 1006, 700, 1024], to: 'world', at: 'dawnroost', label: 'The world' },
      ],
      people: [
        { id: 'marta', name: 'Marta', at: [338, 462], look: 'elder', talk: 'marta', role: 'inn' },
        { id: 'brann', name: 'Brann', at: [1120, 712], look: 'smith', talk: 'brann', role: 'shop' },
        { id: 'tamsin', name: 'Tamsin', at: [880, 475], look: 'child', talk: 'tamsin' },
      ],
      spots: [
        { kind: 'rest', at: [300, 455], label: 'The Warden hall', note: 'The long hall where the Wardens slept. Rest, and the game is saved.' },
        { kind: 'well', id: 'dawnwell', at: [780, 615], label: 'The yard well', note: 'Tied to the windlass, a letter in a hand Sol knows.' },
        { kind: 'magpie', at: [1400, 300], label: 'The Magpie', note: 'Moored at the Warden dock.' },
      ],
    },
    // Dawnroost's living node: the sunstone in its walled court above the town (the gate, and where Envoi is made)
    'dawnroost-node': {
      name: "Dawnroost's living node", src: "art/walk/walk-dawnroost-node.webp", band: 2, kind: 'gate', music: 'dread',
      start: [768, 990],
      walk: [
        [[215, 232], [640, 232], [640, 268], [900, 268], [900, 232], [1325, 232], [1325, 395], [1440, 395], [1440, 595], [1300, 640], [838, 640], [838, 1024], [700, 1024], [700, 640], [280, 640], [100, 590], [100, 395], [215, 395]],
        [[196, 140], [272, 140], [272, 400], [196, 400]], [[1264, 140], [1334, 140], [1334, 400], [1264, 400]], // the stairs up to the walls
      ],
      block: [
        [[126, 405], [279, 405], [279, 545], [126, 545]], [[189, 587], [286, 587], [286, 640], [189, 640]], // the tent and the wagon
        [[1194, 419], [1397, 419], [1397, 573], [1194, 573]], // the tent and the rack
        [[540, 300], [605, 300], [605, 490], [540, 490]], [[930, 300], [995, 300], [995, 490], [930, 490]], // the banners and braziers
      ],
      exits: [
        { rect: [700, 1006, 838, 1024], to: 'dawnroost', at: [626, 30], label: 'Dawnroost' },
      ],
      people: [],
      spots: [
        { kind: 'event', id: 'dawnroost', rect: [100, 230, 1440, 600], fight: 'dawnroost', once: 'dawnroost' },
      ],
    },
    // the northern crossroads: four old roads meet in a stone ring, with a well (Halcyon's ambush)
    crossroads: {
      name: 'The northern crossroads', src: "art/walk/walk-northern-crossroads.webp", band: 3, kind: 'wild', music: 'wild',
      start: [768, 990],
      walk: [
        [[695, 0], [845, 0], [845, 340], [695, 340]], // north, to the shipyard
        [[0, 425], [600, 425], [600, 545], [0, 545]], // west
        [[940, 425], [1536, 425], [1536, 550], [940, 550]], // east
        [[665, 600], [860, 600], [860, 1024], [665, 1024]], // south
        ring(768, 470, 185, 20), // the stone ring
        [[440, 520], [610, 520], [610, 660], [440, 660]], // round the well
      ],
      block: [[[478, 545], [560, 545], [560, 625], [478, 625]]],
      exits: [
        { rect: [695, 0, 845, 16], to: 'shipyard', at: [760, 990], label: 'The shipyard' },
        { rect: [665, 1008, 860, 1024], to: 'world', at: 'crossroads', label: 'The world' },
        { rect: [0, 425, 16, 545], to: 'world', at: 'crossroads', label: 'The world' },
        { rect: [1520, 425, 1536, 550], to: 'world', at: 'crossroads', label: 'The world' },
      ],
      people: [],
      spots: [
        { kind: 'well', id: 'crosswell', at: [520, 650], label: 'The crossroads well', note: 'A lantern on a post, and a letter weighted under a stone on the well’s rim.' },
        { kind: 'event', id: 'halcyon', rect: [575, 355, 965, 585], fight: 'halcyon', once: 'halcyon' },
      ],
      wild: { band: 3, scene: 'northern-crossroads', rate: 1 },
    },
    // the shipyard: Ysmera Brightkeel's yard at the end of the long stone bridge, where the Magpie gets its last upgrade
    shipyard: {
      name: 'The shipyard', src: "art/walk/walk-shipyard.webp", band: 3, kind: 'town', music: 'town',
      start: [760, 990],
      walk: [
        [[105, 110], [1440, 110], [1440, 165], [1105, 165], [1105, 555], [810, 555], [810, 600], [720, 600], [720, 555], [340, 555], [340, 475], [105, 475]], // the yard
        [[715, 590], [810, 590], [810, 1024], [715, 1024]], // the bridge
        [[1100, 352], [1400, 352], [1400, 374], [1100, 374]], [[1060, 505], [1400, 505], [1400, 560], [1060, 560]], // the lanes east
        [[1114, 543], [1257, 543], [1257, 690], [1114, 690]], [[1257, 600], [1500, 600], [1500, 680], [1257, 680]], // down to the east dock
        [[220, 465], [285, 465], [285, 600], [220, 600]], [[110, 595], [285, 595], [285, 665], [110, 665]], // down to the west dock
      ],
      block: [
        [[185, 95], [482, 95], [482, 458], [300, 458], [300, 378], [185, 378]], // the houses
        [[628, 115], [902, 115], [902, 468], [628, 468]], // the slip
        [[520, 95], [640, 95], [640, 255], [520, 255]], [[914, 95], [1057, 95], [1057, 236], [914, 236]], // the cranes
        [[893, 236], [1029, 236], [1029, 371], [893, 371]], [[541, 377], [616, 377], [616, 452], [541, 452]], // timber and crates
      ],
      exits: [
        { rect: [715, 1006, 810, 1024], to: 'crossroads', at: [770, 30], label: 'The crossroads' },
      ],
      people: [
        { id: 'ysmera', name: 'Ysmera Brightkeel', at: [765, 500], look: 'aurosi', talk: 'ysmera', portrait: 'shipmaster' },
        { id: 'pim', name: 'Pim', at: [1189, 532], look: 'gnome', talk: 'pim', role: 'shop' },
        { id: 'tock', name: 'Tock', at: [1000, 400], look: 'gnome', talk: 'tock' },
        { id: 'gil', name: 'Old Gil', at: [432, 478], look: 'elder', talk: 'gil', role: 'inn' },
      ],
      spots: [
        { kind: 'rest', at: [380, 478], label: 'The bunkhouse', note: 'Bunks for the yard’s hands, and two to spare. Rest, and the game is saved.' },
        { kind: 'magpie', at: [765, 470], label: 'The Magpie', note: 'Up on the slip, in Ysmera’s cradle.' },
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
