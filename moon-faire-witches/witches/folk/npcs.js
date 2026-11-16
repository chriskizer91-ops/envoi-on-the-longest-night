// Made by people/kit/build_npcs.py. The people are stand-ins, not Moon Faire lore: names and words are Chris's to change.
window.MF_NPCS = { people: {
  "old-lamp-seller": { name: "Lamp-seller", who: "A small woman in an ochre kerchief who has sold oil lamps and wicks at the fair all her life.", shapes: "made by hand", shapeId: "lampseller", skin: "lampseller-A", fit: {"front": [0.99383, 1.01175, 0.00309, -0.00156], "back": [0.99383, 1.01175, 0.00309, -0.00156]}, faceFit: [1, 0, 0], skinColour: "#bd7c67", scale: {"height": 0.91, "build": [1.08, 1.06], "head": [1.04, 0.99, 1]},
    wiring: {"talk": ["talk_calm"], "greet": "beckon", "fidgets": ["fidget_hands"], "pace": 0.83, "likes": ["nod", "beckon", "think"], "moods": {"yes": "nod", "no": "shake_head", "happy": "laugh", "unsure": "think", "upset": "sad", "thanks": "greet_bow", "bye": "nod"}},
    SKIN: (function () {
const SKIN = {
 "skin": "#b9917a",
 "flat": {
  "hair": "#6f6a64",
  "sleeve": "#465034",
  "soles": "#2a1d16"
 },
 "rough": {
  "belt": 0.45,
  "boots": 0.55,
  "hair": 0.95
 },
 "seam": 0.2
};
      return SKIN; })(),
    person: function () {
// The worked example for the person kit, made by hand (no API): an old lamp-seller.
// One line was the brief: "An old woman who sells lamps: grey hair in a bun under an ochre kerchief, a moss-green bodice,
// a long rust skirt and a cream apron."
const PERSON = {
  name: 'Lamp-seller',
  height: 0.94, build: [1.08, 1.06], head: [1.04, 0.97, 1],
  skin: '#c9967c',
  colors: { torso: '#3f4a2e', sleeve: '#3f4a2e', forearm: '#d9cfb9', legs: '#4a3b32', boots: '#2b1f1a' },
  parts: { skirt: { color: '#8a4226', rough: 0.95 }, apron: '#e3d9c2', hair: '#9a9590', kerchief: { color: '#c58f2e', pattern: { kind: 'dots', color: '#f0deb0', n: 6 } }, belt: '#2b1f1a' },
  face(F) {
    F.lips('#b08078', 0.75); F.brows('#a8a29c', 0.75, 13); F.eyes('#6b5a3c', 0.6);
    F.lines(0.85); F.underEye(0.3); F.blush('#c06a5c', 0.14); F.mole(640, 590, 6);
  },
  make(K) {
    // a long skirt from the waist to the ankles, swinging with the legs
    K.shell('skirt', [[1.05, 0.116, 0.092, 0.092], [0.98, 0.150, 0.125, 0.130], [0.86, 0.185, 0.160, 0.170], [0.60, 0.230, 0.200, 0.215], [0.34, 0.265, 0.230, 0.245], [0.16, 0.285, 0.245, 0.262]], K.w.skirt, { n: 28 });
    // an apron over the front of it, and a belt
    K.panel('apron', [[1.035, 0.132, 0.112], [0.86, 0.198, 0.174], [0.60, 0.244, 0.214], [0.38, 0.272, 0.238]], -52, 52, K.w.skirt);
    K.shell('belt', [[1.075, 0.126, 0.104, 0.102], [1.035, 0.140, 0.120, 0.116]], K.w.torso);
    // grey hair close to the head, with a bun at the back
    K.panel('hair', [[1.640, 0.030, 0.040, 0.040, 0, -0.010], [1.615, 0.066, 0.078, 0.082], [1.560, 0.079, 0.092, 0.096], [1.500, 0.078, 0.086, 0.094], [1.450, 0.066, 0.070, 0.086]], 62, 298, K.w.head, { n: 22 });
    K.ball('hair', [0, 1.505, -0.105], [0.046, 0.044, 0.040], K.w.head);
    // a kerchief over the top of the head, tied under the bun
    K.panel('kerchief', [[1.662, 0.012, 0.014, 0.014, 0, 0.004], [1.648, 0.050, 0.060, 0.062], [1.615, 0.074, 0.092, 0.090], [1.575, 0.084, 0.103, 0.100], [1.545, 0.086, 0.100, 0.102]], -62, 242, K.w.head, { n: 26 });
    K.panel('kerchief', [[1.662, 0.012, 0.014, 0.014, 0, 0.004], [1.648, 0.050, 0.060, 0.062], [1.615, 0.074, 0.092, 0.090], [1.575, 0.084, 0.103, 0.100], [1.545, 0.086, 0.100, 0.102]], 238, 300, K.w.head, { n: 8 });
  },
};
      return PERSON; } },
  "pie-seller": { name: "Pie seller", who: "A sturdy middle-aged woman who sells hot meat pies from a cart by the gate.", shapes: "made by hand", shapeId: "lampseller", skin: "lampseller-B", fit: {"front": [1.00617, 1.01058, -0.00309, -0.00053], "back": [1.00309, 1.01058, -0.00219, -0.00053]}, faceFit: [1, 0, 0], skinColour: "#78412d", scale: {"height": 0.95, "build": [1.15, 1.12], "head": [0.98, 0.99, 0.96]},
    wiring: {"talk": ["talk_lively", "talk_calm"], "greet": "wave", "fidgets": ["fidget_shift", "fidget_hands"], "pace": 1, "likes": ["beckon", "laugh", "point"], "moods": {"yes": "nod", "no": "shake_head", "happy": "laugh", "unsure": "shrug", "upset": "cross", "thanks": "thanks", "bye": "wave"}},
    SKIN: (function () {
const SKIN = {
 "skin": "#78412d",
 "rough": {
  "hair": 0.9
 }
};
      return SKIN; })(),
    person: function () {
// The worked example for the person kit, made by hand (no API): an old lamp-seller.
// One line was the brief: "An old woman who sells lamps: grey hair in a bun under an ochre kerchief, a moss-green bodice,
// a long rust skirt and a cream apron."
const PERSON = {
  name: 'Lamp-seller',
  height: 0.94, build: [1.08, 1.06], head: [1.04, 0.97, 1],
  skin: '#c9967c',
  colors: { torso: '#3f4a2e', sleeve: '#3f4a2e', forearm: '#d9cfb9', legs: '#4a3b32', boots: '#2b1f1a' },
  parts: { skirt: { color: '#8a4226', rough: 0.95 }, apron: '#e3d9c2', hair: '#9a9590', kerchief: { color: '#c58f2e', pattern: { kind: 'dots', color: '#f0deb0', n: 6 } }, belt: '#2b1f1a' },
  face(F) {
    F.lips('#b08078', 0.75); F.brows('#a8a29c', 0.75, 13); F.eyes('#6b5a3c', 0.6);
    F.lines(0.85); F.underEye(0.3); F.blush('#c06a5c', 0.14); F.mole(640, 590, 6);
  },
  make(K) {
    // a long skirt from the waist to the ankles, swinging with the legs
    K.shell('skirt', [[1.05, 0.116, 0.092, 0.092], [0.98, 0.150, 0.125, 0.130], [0.86, 0.185, 0.160, 0.170], [0.60, 0.230, 0.200, 0.215], [0.34, 0.265, 0.230, 0.245], [0.16, 0.285, 0.245, 0.262]], K.w.skirt, { n: 28 });
    // an apron over the front of it, and a belt
    K.panel('apron', [[1.035, 0.132, 0.112], [0.86, 0.198, 0.174], [0.60, 0.244, 0.214], [0.38, 0.272, 0.238]], -52, 52, K.w.skirt);
    K.shell('belt', [[1.075, 0.126, 0.104, 0.102], [1.035, 0.140, 0.120, 0.116]], K.w.torso);
    // grey hair close to the head, with a bun at the back
    K.panel('hair', [[1.640, 0.030, 0.040, 0.040, 0, -0.010], [1.615, 0.066, 0.078, 0.082], [1.560, 0.079, 0.092, 0.096], [1.500, 0.078, 0.086, 0.094], [1.450, 0.066, 0.070, 0.086]], 62, 298, K.w.head, { n: 22 });
    K.ball('hair', [0, 1.505, -0.105], [0.046, 0.044, 0.040], K.w.head);
    // a kerchief over the top of the head, tied under the bun
    K.panel('kerchief', [[1.662, 0.012, 0.014, 0.014, 0, 0.004], [1.648, 0.050, 0.060, 0.062], [1.615, 0.074, 0.092, 0.090], [1.575, 0.084, 0.103, 0.100], [1.545, 0.086, 0.100, 0.102]], -62, 242, K.w.head, { n: 26 });
    K.panel('kerchief', [[1.662, 0.012, 0.014, 0.014, 0, 0.004], [1.648, 0.050, 0.060, 0.062], [1.615, 0.074, 0.092, 0.090], [1.575, 0.084, 0.103, 0.100], [1.545, 0.086, 0.100, 0.102]], 238, 300, K.w.head, { n: 8 });
  },
};
      return PERSON; } },
  "ballad-singer": { name: "Ballad singer", who: "A young woman who sings old songs on a small stage between the stalls each night.", shapes: "made by hand", shapeId: "lampseller", skin: "lampseller-C", fit: {"front": [1.00926, 1.01998, -0.00528, -0.00295], "back": [1.00617, 1.0188, -0.00309, -0.00289]}, faceFit: [1, 0, 0], skinColour: "#e5b8ae", scale: {"height": 0.98, "build": [0.98, 0.97], "head": [1.04, 1, 1.03]},
    wiring: {"talk": ["talk_calm", "talk_lively"], "greet": "greet_bow", "fidgets": ["fidget_look", "fidget_hands"], "pace": 1.08, "likes": ["greet_bow", "think", "sad"], "moods": {"yes": "nod", "no": "shake_head", "happy": "laugh", "unsure": "think", "upset": "sad", "thanks": "greet_bow", "bye": "wave"}},
    SKIN: (function () {
const SKIN = {
 "skin": "#e5b8ae"
};
      return SKIN; })(),
    person: function () {
// The worked example for the person kit, made by hand (no API): an old lamp-seller.
// One line was the brief: "An old woman who sells lamps: grey hair in a bun under an ochre kerchief, a moss-green bodice,
// a long rust skirt and a cream apron."
const PERSON = {
  name: 'Lamp-seller',
  height: 0.94, build: [1.08, 1.06], head: [1.04, 0.97, 1],
  skin: '#c9967c',
  colors: { torso: '#3f4a2e', sleeve: '#3f4a2e', forearm: '#d9cfb9', legs: '#4a3b32', boots: '#2b1f1a' },
  parts: { skirt: { color: '#8a4226', rough: 0.95 }, apron: '#e3d9c2', hair: '#9a9590', kerchief: { color: '#c58f2e', pattern: { kind: 'dots', color: '#f0deb0', n: 6 } }, belt: '#2b1f1a' },
  face(F) {
    F.lips('#b08078', 0.75); F.brows('#a8a29c', 0.75, 13); F.eyes('#6b5a3c', 0.6);
    F.lines(0.85); F.underEye(0.3); F.blush('#c06a5c', 0.14); F.mole(640, 590, 6);
  },
  make(K) {
    // a long skirt from the waist to the ankles, swinging with the legs
    K.shell('skirt', [[1.05, 0.116, 0.092, 0.092], [0.98, 0.150, 0.125, 0.130], [0.86, 0.185, 0.160, 0.170], [0.60, 0.230, 0.200, 0.215], [0.34, 0.265, 0.230, 0.245], [0.16, 0.285, 0.245, 0.262]], K.w.skirt, { n: 28 });
    // an apron over the front of it, and a belt
    K.panel('apron', [[1.035, 0.132, 0.112], [0.86, 0.198, 0.174], [0.60, 0.244, 0.214], [0.38, 0.272, 0.238]], -52, 52, K.w.skirt);
    K.shell('belt', [[1.075, 0.126, 0.104, 0.102], [1.035, 0.140, 0.120, 0.116]], K.w.torso);
    // grey hair close to the head, with a bun at the back
    K.panel('hair', [[1.640, 0.030, 0.040, 0.040, 0, -0.010], [1.615, 0.066, 0.078, 0.082], [1.560, 0.079, 0.092, 0.096], [1.500, 0.078, 0.086, 0.094], [1.450, 0.066, 0.070, 0.086]], 62, 298, K.w.head, { n: 22 });
    K.ball('hair', [0, 1.505, -0.105], [0.046, 0.044, 0.040], K.w.head);
    // a kerchief over the top of the head, tied under the bun
    K.panel('kerchief', [[1.662, 0.012, 0.014, 0.014, 0, 0.004], [1.648, 0.050, 0.060, 0.062], [1.615, 0.074, 0.092, 0.090], [1.575, 0.084, 0.103, 0.100], [1.545, 0.086, 0.100, 0.102]], -62, 242, K.w.head, { n: 26 });
    K.panel('kerchief', [[1.662, 0.012, 0.014, 0.014, 0, 0.004], [1.648, 0.050, 0.060, 0.062], [1.615, 0.074, 0.092, 0.090], [1.575, 0.084, 0.103, 0.100], [1.545, 0.086, 0.100, 0.102]], 238, 300, K.w.head, { n: 8 });
  },
};
      return PERSON; } },
  "fortune-teller": { name: "Fortune-teller", who: "A tall, thin fortune-teller who reads palms and cards in a dim tent at the edge of the fair.", shapes: "shapes by Fable 5.2", shapeId: "fortune-fable", skin: "fortune-A", fit: {"front": [1.02023, 1.00467, -0.01077, -0.00121], "back": [1.02023, 1.0035, -0.01077, -0.00115]}, faceFit: [1, 0, 0], skinColour: "#c7b0b2", scale: {"height": 1.05, "build": [0.93, 0.94], "head": [1, 1, 1]},
    wiring: {"talk": ["talk_calm"], "greet": "beckon", "fidgets": ["fidget_hands"], "pace": 0.94, "likes": ["think", "beckon", "point"], "moods": {"yes": "nod", "no": "refuse", "happy": "nod", "unsure": "think", "upset": "cross", "thanks": "greet_bow", "bye": "greet_bow"}},
    SKIN: (function () {
const SKIN = {
 "front": {
  "scale": [
   1.04,
   1
  ],
  "move": [
   0,
   0.01
  ]
 },
 "back": {
  "scale": [
   1.04,
   1
  ],
  "move": [
   0,
   0.01
  ]
 },
 "skin": "#d9c1bc",
 "flat": {
  "hair": "#17131a",
  "soles": "#1c161a"
 },
 "rough": {
  "gold": 0.35,
  "boots": 0.5,
  "hair": 0.85
 },
 "seam": 0.2,
 "move": {
  "scarf": [
   0,
   -0.012,
   0
  ],
  "gold": [
   0,
   -0.012,
   0
  ]
 }
};
      return SKIN; })(),
    person: function () {
const PERSON = {
  name: 'Fortune-teller',
  height: 1.10,
  build: [0.93, 0.94],
  head: [0.97, 1.02, 1],
  skin: '#e6d3c8',
  colors: { torso: '#1b2a66', sleeve: '#1b2a66', forearm: '#1b2a66', legs: '#191a2c', boots: '#221a24', soles: '#120e14' },
  parts: {
    robe: { color: '#1b2a66', rough: 0.85 },
    hem: { color: '#b8923a', rough: 0.6 },
    sash: { color: '#3d1838', rough: 0.7, pattern: { kind: 'hoops', color: '#d2a43a', n: 3 } },
    scarf: { color: '#5b2a57', rough: 0.9 },
    hair: { color: '#0e0c12', rough: 0.55 },
    gold: { color: '#c9a03c', metal: 1, rough: 0.4 },
  },
  face(F) {
    F.pale(0.55);
    F.air(356, 304, 84, 48, '#2a1a3c', 0.6, 'multiply');
    F.air(668, 304, 84, 48, '#2a1a3c', 0.6, 'multiply');
    F.eyeshadow('#1c1230', 1);
    F.underEye(0.4);
    F.brows('#0e0c12', 0.9, 12);
    F.eyes('#5f8a76', 0.8);
    F.stroke([[296, 300], [356, 276], [420, 304]], '#0e0a14', 0.8, 7);
    F.stroke([[604, 304], [668, 276], [728, 300]], '#0e0a14', 0.8, 7);
    F.stroke([[300, 316], [258, 292]], '#0e0a14', 0.8, 7);
    F.stroke([[724, 316], [766, 292]], '#0e0a14', 0.8, 7);
    F.lips('#5a1c38', 0.95);
    F.lines(0.2);
    F.mole(628, 610, 5);
  },
  make(K) {
    K.shell('robe', [[1.305, 0.147, 0.090, 0.099], [1.215, 0.144, 0.117, 0.104], [1.14, 0.131, 0.106, 0.099], [1.05, 0.118, 0.095, 0.095]], K.w.torso, { n: 28 });
    K.shell('robe', [[1.05, 0.118, 0.095, 0.095], [0.95, 0.160, 0.108, 0.118], [0.87, 0.178, 0.114, 0.131], [0.79, 0.186, 0.130, 0.142], [0.60, 0.198, 0.172, 0.182], [0.47, 0.205, 0.192, 0.202], [0.30, 0.215, 0.202, 0.212], [0.12, 0.225, 0.212, 0.222]], K.w.skirt, { n: 30 });
    K.shell('hem', [[0.17, 0.231, 0.218, 0.228], [0.118, 0.234, 0.221, 0.231]], K.w.skirt, { n: 30 });
    K.shell('sash', [[1.10, 0.134, 0.110, 0.108], [1.06, 0.130, 0.108, 0.106], [1.01, 0.145, 0.112, 0.116]], K.w.torso, { n: 28 });
    K.ball('sash', [0.092, 1.05, 0.090], [0.030, 0.027, 0.022], K.w.torso);
    K.panel('sash', [[1.015, 0.145, 0.112, 0.116], [0.95, 0.171, 0.120, 0.129], [0.87, 0.189, 0.126, 0.142], [0.79, 0.197, 0.142, 0.153], [0.68, 0.205, 0.167, 0.177]], 24, 48, K.w.skirt, { n: 6 });
    K.tube('robe', [[0.213, 1.065, -0.008], [0.240, 0.965, -0.008], [0.270, 0.855, -0.008]], [0.057, 0.061, 0.070], K.w.bone('farmL'));
    K.tube('robe', [[-0.213, 1.065, -0.008], [-0.240, 0.965, -0.008], [-0.270, 0.855, -0.008]], [0.057, 0.061, 0.070], K.w.bone('farmR'));
    K.hair('hair', 'long', { underHat: true });
    K.shell('scarf', [[1.670, 0.012, 0.014, 0.014, 0, 0.004], [1.660, 0.046, 0.056, 0.058], [1.640, 0.070, 0.086, 0.086], [1.620, 0.084, 0.102, 0.100], [1.604, 0.091, 0.109, 0.107], [1.588, 0.093, 0.111, 0.109]], K.w.head, { n: 28, capFirst: true });
    K.panel('scarf', [[1.588, 0.093, 0.111, 0.109], [1.55, 0.092, 0.108, 0.110], [1.51, 0.090, 0.100, 0.109], [1.47, 0.089, 0.094, 0.106]], 74, 286, K.w.head, { n: 22 });
    K.shell('gold', [[1.600, 0.100, 0.118, 0.116], [1.588, 0.101, 0.119, 0.117]], K.w.head, { n: 28 });
    K.ball('scarf', [0, 1.50, -0.116], [0.024, 0.020, 0.018], K.w.head);
    K.tube('scarf', [[0.010, 1.495, -0.124], [0.038, 1.42, -0.134], [0.052, 1.35, -0.134]], [0.014, 0.016, 0.011], K.w.hair);
    K.tube('gold', [[-0.055, 1.32, 0.084], [-0.030, 1.28, 0.108], [0, 1.25, 0.120], [0.030, 1.28, 0.108], [0.055, 1.32, 0.084]], [0.004, 0.004, 0.004, 0.004, 0.004], K.w.torso);
    K.ball('gold', [0, 1.238, 0.121], [0.015, 0.019, 0.008], K.w.torso);
  },
};
      return PERSON; } },
  "old-lamplighter": { name: "Old lamplighter", who: "An elderly woman in a red dress and headscarf who walks the fair at dusk, lighting and trimming the lanterns along the stalls.", shapes: "shapes by Fable 5.2", shapeId: "fortune-fable", skin: "fortune-B", fit: {"front": [1.01734, 1.00701, -0.00997, -0.00133], "back": [1.02023, 1.00701, -0.01077, -0.00133]}, faceFit: [1, 0, 0], skinColour: "#af7353", scale: {"height": 1.02, "build": [0.96, 0.96], "head": [1, 1, 1]},
    wiring: {"talk": ["talk_calm"], "greet": "wave", "fidgets": ["fidget_look", "fidget_shift"], "pace": 0.85, "likes": ["point", "nod", "wave"], "moods": {"yes": "nod", "no": "shake_head", "happy": "laugh", "unsure": "shrug", "upset": "sad", "thanks": "thanks", "bye": "wave"}},
    SKIN: (function () {
const SKIN = {
 "skin": "#af7353",
 "flat": {
  "hair": "#7a736a"
 },
 "seam": 0.2,
 "move": {
  "scarf": [
   0,
   -0.012,
   0
  ],
  "gold": [
   0,
   -0.012,
   0
  ]
 },
 "rough": {
  "hair": 0.95
 }
};
      return SKIN; })(),
    person: function () {
const PERSON = {
  name: 'Fortune-teller',
  height: 1.10,
  build: [0.93, 0.94],
  head: [0.97, 1.02, 1],
  skin: '#e6d3c8',
  colors: { torso: '#1b2a66', sleeve: '#1b2a66', forearm: '#1b2a66', legs: '#191a2c', boots: '#221a24', soles: '#120e14' },
  parts: {
    robe: { color: '#1b2a66', rough: 0.85 },
    hem: { color: '#b8923a', rough: 0.6 },
    sash: { color: '#3d1838', rough: 0.7, pattern: { kind: 'hoops', color: '#d2a43a', n: 3 } },
    scarf: { color: '#5b2a57', rough: 0.9 },
    hair: { color: '#0e0c12', rough: 0.55 },
    gold: { color: '#c9a03c', metal: 1, rough: 0.4 },
  },
  face(F) {
    F.pale(0.55);
    F.air(356, 304, 84, 48, '#2a1a3c', 0.6, 'multiply');
    F.air(668, 304, 84, 48, '#2a1a3c', 0.6, 'multiply');
    F.eyeshadow('#1c1230', 1);
    F.underEye(0.4);
    F.brows('#0e0c12', 0.9, 12);
    F.eyes('#5f8a76', 0.8);
    F.stroke([[296, 300], [356, 276], [420, 304]], '#0e0a14', 0.8, 7);
    F.stroke([[604, 304], [668, 276], [728, 300]], '#0e0a14', 0.8, 7);
    F.stroke([[300, 316], [258, 292]], '#0e0a14', 0.8, 7);
    F.stroke([[724, 316], [766, 292]], '#0e0a14', 0.8, 7);
    F.lips('#5a1c38', 0.95);
    F.lines(0.2);
    F.mole(628, 610, 5);
  },
  make(K) {
    K.shell('robe', [[1.305, 0.147, 0.090, 0.099], [1.215, 0.144, 0.117, 0.104], [1.14, 0.131, 0.106, 0.099], [1.05, 0.118, 0.095, 0.095]], K.w.torso, { n: 28 });
    K.shell('robe', [[1.05, 0.118, 0.095, 0.095], [0.95, 0.160, 0.108, 0.118], [0.87, 0.178, 0.114, 0.131], [0.79, 0.186, 0.130, 0.142], [0.60, 0.198, 0.172, 0.182], [0.47, 0.205, 0.192, 0.202], [0.30, 0.215, 0.202, 0.212], [0.12, 0.225, 0.212, 0.222]], K.w.skirt, { n: 30 });
    K.shell('hem', [[0.17, 0.231, 0.218, 0.228], [0.118, 0.234, 0.221, 0.231]], K.w.skirt, { n: 30 });
    K.shell('sash', [[1.10, 0.134, 0.110, 0.108], [1.06, 0.130, 0.108, 0.106], [1.01, 0.145, 0.112, 0.116]], K.w.torso, { n: 28 });
    K.ball('sash', [0.092, 1.05, 0.090], [0.030, 0.027, 0.022], K.w.torso);
    K.panel('sash', [[1.015, 0.145, 0.112, 0.116], [0.95, 0.171, 0.120, 0.129], [0.87, 0.189, 0.126, 0.142], [0.79, 0.197, 0.142, 0.153], [0.68, 0.205, 0.167, 0.177]], 24, 48, K.w.skirt, { n: 6 });
    K.tube('robe', [[0.213, 1.065, -0.008], [0.240, 0.965, -0.008], [0.270, 0.855, -0.008]], [0.057, 0.061, 0.070], K.w.bone('farmL'));
    K.tube('robe', [[-0.213, 1.065, -0.008], [-0.240, 0.965, -0.008], [-0.270, 0.855, -0.008]], [0.057, 0.061, 0.070], K.w.bone('farmR'));
    K.hair('hair', 'long', { underHat: true });
    K.shell('scarf', [[1.670, 0.012, 0.014, 0.014, 0, 0.004], [1.660, 0.046, 0.056, 0.058], [1.640, 0.070, 0.086, 0.086], [1.620, 0.084, 0.102, 0.100], [1.604, 0.091, 0.109, 0.107], [1.588, 0.093, 0.111, 0.109]], K.w.head, { n: 28, capFirst: true });
    K.panel('scarf', [[1.588, 0.093, 0.111, 0.109], [1.55, 0.092, 0.108, 0.110], [1.51, 0.090, 0.100, 0.109], [1.47, 0.089, 0.094, 0.106]], 74, 286, K.w.head, { n: 22 });
    K.shell('gold', [[1.600, 0.100, 0.118, 0.116], [1.588, 0.101, 0.119, 0.117]], K.w.head, { n: 28 });
    K.ball('scarf', [0, 1.50, -0.116], [0.024, 0.020, 0.018], K.w.head);
    K.tube('scarf', [[0.010, 1.495, -0.124], [0.038, 1.42, -0.134], [0.052, 1.35, -0.134]], [0.014, 0.016, 0.011], K.w.hair);
    K.tube('gold', [[-0.055, 1.32, 0.084], [-0.030, 1.28, 0.108], [0, 1.25, 0.120], [0.030, 1.28, 0.108], [0.055, 1.32, 0.084]], [0.004, 0.004, 0.004, 0.004, 0.004], K.w.torso);
    K.ball('gold', [0, 1.238, 0.121], [0.015, 0.019, 0.008], K.w.torso);
  },
};
      return PERSON; } },
  "old-night-watchman": { name: "Old night-watchman", who: "An old night-watchman who walks the fair rows after dark, checking stall shutters and lamps.", shapes: "shapes by Fable 5.2", shapeId: "watchman-fable", skin: "watchman-A", fit: {"front": [1.01852, 1.01302, -0.01056, -0.00553], "back": [1.01543, 1.01302, -0.00707, -0.00553]}, faceFit: [1, 0, 0], skinColour: "#4f2a1d", scale: {"height": 1.01, "build": [1.1, 1.08], "head": [1, 1, 1]},
    wiring: {"talk": ["talk_calm", "talk_gruff"], "greet": "nod", "fidgets": ["fidget_look"], "pace": 0.88, "likes": ["point", "nod", "cross"], "moods": {"yes": "nod", "no": "shake_head", "happy": "nod", "unsure": "think", "upset": "cross", "thanks": "nod", "bye": "wave"}},
    SKIN: (function () {
const SKIN = {
 "skin": "#6b4030",
 "flat": {
  "hair": "#5a5855",
  "soles": "#1e1b18"
 },
 "rough": {
  "boots": 0.5,
  "belt": 0.45,
  "brass": 0.35,
  "hair": 0.95
 },
 "move": {
  "hat": [
   0,
   -0.03,
   0
  ],
  "band": [
   0,
   -0.03,
   0
  ]
 }
};
      return SKIN; })(),
    person: function () {
const PERSON = {
  name: 'Night-watchman',
  height: 1.02,
  build: [1.1, 1.08],
  skin: '#5a3a27',
  colors: { torso: '#6c7076', sleeve: '#6c7076', forearm: '#6c7076', legs: '#2c2a2d', boots: '#151313', soles: '#0b0a0a' },
  parts: {
    coat: { color: '#6c7076', rough: 0.95 },
    belt: { color: '#231a15', rough: 0.5 },
    brass: { color: '#c79a3a', rough: 0.35, metal: 1 },
    scarf: { color: '#a8241f', rough: 0.95 },
    hat: { color: '#27222a', rough: 1 },
    band: { color: '#6e1f1c', rough: 0.8 },
    hair: '#cfccc5',
    beard: '#e2dfd8',
    boot: { color: '#151313', rough: 0.5 },
  },
  face(F) {
    F.lips('#7a4a44', 0.5); F.brows('#ffffff', 0.9, 20); F.eyes('#3a2616', 0.7);
    F.lines(0.8); F.underEye(0.45); F.beard('#ffffff', 1, 'beard');
    F.mole(742, 430, 6);
  },
  make(K) {
    K.shell('coat', [[1.31, 0.150, 0.096, 0.100], [1.25, 0.152, 0.130, 0.106], [1.20, 0.152, 0.140, 0.110], [1.14, 0.150, 0.134, 0.108], [1.06, 0.146, 0.120, 0.106], [1.02, 0.144, 0.114, 0.106]], K.w.torso, { n: 28 });
    K.shell('coat', [[1.05, 0.154, 0.127, 0.115], [0.95, 0.172, 0.132, 0.132], [0.87, 0.186, 0.136, 0.142], [0.79, 0.198, 0.152, 0.160], [0.68, 0.212, 0.176, 0.184], [0.56, 0.222, 0.194, 0.202], [0.47, 0.228, 0.202, 0.210], [0.43, 0.230, 0.204, 0.212]], K.w.skirt, { n: 30 });
    K.shell('belt', [[1.088, 0.160, 0.136, 0.124], [1.035, 0.165, 0.138, 0.127]], K.w.torso, { n: 28 });
    K.ball('brass', [0, 1.062, 0.139], [0.024, 0.020, 0.008], K.w.torso);
    K.tube('brass', [[0.11, 1.04, 0.118], [0.11, 1.00, 0.128], [0.11, 0.985, 0.136], [0.11, 0.93, 0.138], [0.11, 0.915, 0.138]], [0.005, 0.006, 0.028, 0.030, 0.014], K.w.skirt);
    K.shell('scarf', [[1.400, 0.060, 0.064, 0.062], [1.386, 0.082, 0.086, 0.082], [1.360, 0.094, 0.098, 0.096], [1.335, 0.096, 0.102, 0.100], [1.312, 0.086, 0.098, 0.100]], K.w.torso, { n: 24 });
    K.tube('scarf', [[0.035, 1.37, 0.092], [0.050, 1.31, 0.112], [0.056, 1.22, 0.150], [0.058, 1.13, 0.146], [0.058, 1.105, 0.142]], [0.022, 0.024, 0.024, 0.025, 0.020], K.w.torso);
    K.tube('scarf', [[-0.040, 1.37, -0.085], [-0.060, 1.31, -0.112], [-0.065, 1.22, -0.125], [-0.065, 1.16, -0.122]], [0.022, 0.024, 0.024, 0.020], K.w.torso);
    K.panel('hair', [[1.61, 0.076, 0.088, 0.092], [1.56, 0.079, 0.092, 0.096], [1.52, 0.078, 0.086, 0.094], [1.49, 0.071, 0.076, 0.088]], 92, 268, K.w.head, { n: 20 });
    K.beard('beard', 'short');
    K.ball('beard', [0, 1.425, 0.070], [0.040, 0.028, 0.032], K.w.head);
    K.shell('hat', [[1.800, 0.070, 0.078, 0.078], [1.788, 0.081, 0.092, 0.091], [1.740, 0.086, 0.100, 0.098], [1.680, 0.090, 0.106, 0.104], [1.630, 0.093, 0.110, 0.108], [1.592, 0.095, 0.113, 0.111]], K.w.head, { n: 28, capFirst: true });
    K.shell('hat', [[1.598, 0.093, 0.111, 0.109], [1.594, 0.125, 0.143, 0.139], [1.588, 0.148, 0.166, 0.160]], K.w.head, { n: 28 });
    K.shell('band', [[1.630, 0.101, 0.118, 0.116], [1.602, 0.103, 0.121, 0.119]], K.w.head, { n: 28 });
    K.tube('boot', [[0.085, 0.335, 0], [0.085, 0.30, 0], [0.085, 0.275, 0]], [0.058, 0.062, 0.058], K.w.bone('shinL'));
    K.tube('boot', [[-0.085, 0.335, 0], [-0.085, 0.30, 0], [-0.085, 0.275, 0]], [0.058, 0.062, 0.058], K.w.bone('shinR'));
  },
};
      return PERSON; } },
  "chestnut-roaster": { name: "Chestnut roaster", who: "A cheerful middle-aged man who roasts chestnuts over a brazier at the fair gate.", shapes: "shapes by Fable 5.2", shapeId: "watchman-fable", skin: "watchman-B", fit: {"front": [1.01543, 1.04013, -0.00837, -0.01274], "back": [1.01235, 1.04013, -0.00747, -0.01274]}, faceFit: [1, 0, 0], skinColour: "#d99c8d", scale: {"height": 1.04, "build": [1.1, 1.08], "head": [1, 1, 1]},
    wiring: {"talk": ["talk_lively"], "greet": "beckon", "fidgets": ["fidget_hands", "fidget_shift"], "pace": 1.05, "likes": ["laugh", "beckon", "wave"], "moods": {"yes": "nod", "no": "shake_head", "happy": "laugh", "unsure": "shrug", "upset": "sad", "thanks": "thanks", "bye": "wave"}},
    SKIN: (function () {
const SKIN = {
 "skin": "#cd927c",
 "flat": {
  "soles": "#2a1d16",
  "hair": "#7c4528"
 },
 "rough": {
  "boots": 0.5,
  "belt": 0.5,
  "brass": 0.35,
  "boot": 0.5,
  "hair": 0.9
 },
 "seam": 0.2,
 "move": {
  "hat": [
   0,
   -0.035,
   0
  ],
  "band": [
   0,
   -0.035,
   0
  ]
 }
};
      return SKIN; })(),
    person: function () {
const PERSON = {
  name: 'Night-watchman',
  height: 1.02,
  build: [1.1, 1.08],
  skin: '#5a3a27',
  colors: { torso: '#6c7076', sleeve: '#6c7076', forearm: '#6c7076', legs: '#2c2a2d', boots: '#151313', soles: '#0b0a0a' },
  parts: {
    coat: { color: '#6c7076', rough: 0.95 },
    belt: { color: '#231a15', rough: 0.5 },
    brass: { color: '#c79a3a', rough: 0.35, metal: 1 },
    scarf: { color: '#a8241f', rough: 0.95 },
    hat: { color: '#27222a', rough: 1 },
    band: { color: '#6e1f1c', rough: 0.8 },
    hair: '#cfccc5',
    beard: '#e2dfd8',
    boot: { color: '#151313', rough: 0.5 },
  },
  face(F) {
    F.lips('#7a4a44', 0.5); F.brows('#ffffff', 0.9, 20); F.eyes('#3a2616', 0.7);
    F.lines(0.8); F.underEye(0.45); F.beard('#ffffff', 1, 'beard');
    F.mole(742, 430, 6);
  },
  make(K) {
    K.shell('coat', [[1.31, 0.150, 0.096, 0.100], [1.25, 0.152, 0.130, 0.106], [1.20, 0.152, 0.140, 0.110], [1.14, 0.150, 0.134, 0.108], [1.06, 0.146, 0.120, 0.106], [1.02, 0.144, 0.114, 0.106]], K.w.torso, { n: 28 });
    K.shell('coat', [[1.05, 0.154, 0.127, 0.115], [0.95, 0.172, 0.132, 0.132], [0.87, 0.186, 0.136, 0.142], [0.79, 0.198, 0.152, 0.160], [0.68, 0.212, 0.176, 0.184], [0.56, 0.222, 0.194, 0.202], [0.47, 0.228, 0.202, 0.210], [0.43, 0.230, 0.204, 0.212]], K.w.skirt, { n: 30 });
    K.shell('belt', [[1.088, 0.160, 0.136, 0.124], [1.035, 0.165, 0.138, 0.127]], K.w.torso, { n: 28 });
    K.ball('brass', [0, 1.062, 0.139], [0.024, 0.020, 0.008], K.w.torso);
    K.tube('brass', [[0.11, 1.04, 0.118], [0.11, 1.00, 0.128], [0.11, 0.985, 0.136], [0.11, 0.93, 0.138], [0.11, 0.915, 0.138]], [0.005, 0.006, 0.028, 0.030, 0.014], K.w.skirt);
    K.shell('scarf', [[1.400, 0.060, 0.064, 0.062], [1.386, 0.082, 0.086, 0.082], [1.360, 0.094, 0.098, 0.096], [1.335, 0.096, 0.102, 0.100], [1.312, 0.086, 0.098, 0.100]], K.w.torso, { n: 24 });
    K.tube('scarf', [[0.035, 1.37, 0.092], [0.050, 1.31, 0.112], [0.056, 1.22, 0.150], [0.058, 1.13, 0.146], [0.058, 1.105, 0.142]], [0.022, 0.024, 0.024, 0.025, 0.020], K.w.torso);
    K.tube('scarf', [[-0.040, 1.37, -0.085], [-0.060, 1.31, -0.112], [-0.065, 1.22, -0.125], [-0.065, 1.16, -0.122]], [0.022, 0.024, 0.024, 0.020], K.w.torso);
    K.panel('hair', [[1.61, 0.076, 0.088, 0.092], [1.56, 0.079, 0.092, 0.096], [1.52, 0.078, 0.086, 0.094], [1.49, 0.071, 0.076, 0.088]], 92, 268, K.w.head, { n: 20 });
    K.beard('beard', 'short');
    K.ball('beard', [0, 1.425, 0.070], [0.040, 0.028, 0.032], K.w.head);
    K.shell('hat', [[1.800, 0.070, 0.078, 0.078], [1.788, 0.081, 0.092, 0.091], [1.740, 0.086, 0.100, 0.098], [1.680, 0.090, 0.106, 0.104], [1.630, 0.093, 0.110, 0.108], [1.592, 0.095, 0.113, 0.111]], K.w.head, { n: 28, capFirst: true });
    K.shell('hat', [[1.598, 0.093, 0.111, 0.109], [1.594, 0.125, 0.143, 0.139], [1.588, 0.148, 0.166, 0.160]], K.w.head, { n: 28 });
    K.shell('band', [[1.630, 0.101, 0.118, 0.116], [1.602, 0.103, 0.121, 0.119]], K.w.head, { n: 28 });
    K.tube('boot', [[0.085, 0.335, 0], [0.085, 0.30, 0], [0.085, 0.275, 0]], [0.058, 0.062, 0.058], K.w.bone('shinL'));
    K.tube('boot', [[-0.085, 0.335, 0], [-0.085, 0.30, 0], [-0.085, 0.275, 0]], [0.058, 0.062, 0.058], K.w.bone('shinR'));
  },
};
      return PERSON; } },
  "fair-baker": { name: "Fair Baker", who: "A stout, cheerful baker who sells warm loaves and buns from his oven cart at the night fair.", shapes: "shapes by Fable 5.2", shapeId: "baker-fable", skin: "baker-A", fit: {"front": [1.10494, 1.0412, -0.05247, -0.00596], "back": [1.11111, 1.0412, -0.05556, -0.00596]}, faceFit: [1, 0, 0], skinColour: "#d0826c", scale: {},
    wiring: {"talk": ["talk_lively", "talk_calm"], "greet": "wave", "fidgets": ["fidget_shift"], "pace": 0.96, "likes": ["laugh", "thanks", "beckon"], "moods": {"yes": "nod", "no": "shake_head", "happy": "laugh", "unsure": "think", "upset": "sad", "thanks": "thanks", "bye": "wave"}},
    SKIN: (function () {
const SKIN = {
 "skin": "#d0826c",
 "flat": {
  "hair": "#5a3b28",
  "soles": "#2a1d16"
 },
 "rough": {
  "boots": 0.5,
  "apron": 0.9,
  "cap": 0.9
 },
 "seam": 0.2,
 "move": {
  "cap": [
   0,
   -0.045,
   0
  ],
  "capband": [
   0,
   -0.045,
   0
  ],
  "beard": [
   0,
   0.005,
   -0.012
  ]
 },
 "size": {
  "beard": [
   0.9,
   0.88,
   0.72
  ]
 }
};
      return SKIN; })(),
    person: function () {
const PERSON = {
  name: 'Baker',
  height: 1.0,
  build: [1.28, 1.26],
  head: [1.04, 1, 1.02],
  skin: '#d8a184',
  colors: { torso: '#c9a26b', sleeve: '#c9a26b', forearm: 'skin', legs: '#5b3d27', boots: '#2e211a', soles: '#1c1512' },
  parts: {
    shirt: { color: '#c9a26b', rough: 0.9 },
    roll: { color: '#d9b98a', rough: 0.9 },
    apron: { color: '#efe6d0', rough: 0.95 },
    tie: { color: '#d6c9a8', rough: 0.9 },
    towel: { color: '#e9dfc8', pattern: { kind: 'hoops', color: '#a8452f', n: 5 } },
    cap: { color: '#f5f2ea', rough: 0.95 },
    capband: { color: '#e3ded1', rough: 0.9 },
    hair: '#6b4326',
    beard: '#6b4326',
  },
  face(F) {
    F.lips('#a8655a', 0.5); F.brows('#5a381f', 0.85, 20); F.eyes('#5b4630', 0.6);
    F.lines(0.35); F.blush('#c8402f', 0.42);
    F.air(518, 485, 48, 42, '#c8503f', 0.18, 'multiply');
    F.beard('#6b4326', 0.85, 'beard');
    F.stroke([[236, 300], [206, 288]], '#6a4030', 0.35, 5);
    F.stroke([[788, 300], [818, 288]], '#6a4030', 0.35, 5);
    F.air(735, 400, 42, 20, '#ffffff', 0.22, 'screen');
  },
  make(K) {
    K.shell('shirt', [[1.312, 0.147, 0.086, 0.099], [1.26, 0.146, 0.112, 0.104], [1.215, 0.144, 0.122, 0.106], [1.14, 0.140, 0.134, 0.102], [1.04, 0.140, 0.150, 0.102], [0.95, 0.166, 0.146, 0.124], [0.87, 0.184, 0.130, 0.138], [0.78, 0.180, 0.118, 0.132]], K.w.torso, { n: 28 });
    K.panel('apron', [[1.258, 0.150, 0.128, 0.11], [1.215, 0.156, 0.138, 0.11], [1.14, 0.152, 0.146, 0.11], [1.06, 0.150, 0.160, 0.11]], -36, 36, K.w.torso, { n: 16 });
    K.panel('apron', [[1.048, 0.150, 0.161, 0.11], [0.95, 0.176, 0.158, 0.12], [0.87, 0.194, 0.148, 0.13], [0.78, 0.200, 0.150, 0.13], [0.64, 0.206, 0.170, 0.13], [0.50, 0.212, 0.190, 0.13]], -62, 62, K.w.skirt, { n: 26 });
    K.shell('tie', [[1.078, 0.152, 0.169, 0.112], [1.040, 0.153, 0.171, 0.112]], K.w.torso, { n: 28 });
    K.ball('tie', [0, 1.058, -0.120], [0.024, 0.015, 0.011], K.w.torso);
    K.tube('tie', [[0.008, 1.054, -0.121], [0.022, 0.99, -0.128], [0.032, 0.94, -0.140]], [0.006, 0.006, 0.007], K.w.torso);
    K.tube('tie', [[-0.008, 1.054, -0.121], [-0.020, 1.0, -0.127], [-0.026, 0.96, -0.137]], [0.006, 0.006, 0.007], K.w.torso);
    K.tube('tie', [[-0.088, 1.252, 0.110], [-0.080, 1.308, 0.090], [-0.064, 1.348, 0.034], [-0.040, 1.360, -0.042], [0, 1.362, -0.064], [0.040, 1.360, -0.042], [0.064, 1.348, 0.034], [0.080, 1.308, 0.090], [0.088, 1.252, 0.110]], [0.008, 0.008, 0.008, 0.008, 0.008, 0.008, 0.008, 0.008, 0.008], K.w.torso);
    K.panel('towel', [[1.050, 0.164, 0.176, 0.128], [0.94, 0.192, 0.170, 0.140], [0.83, 0.206, 0.162, 0.150]], 66, 98, K.w.skirt, { n: 10 });
    K.tube('roll', [[0.203, 1.102, -0.008], [0.208, 1.083, -0.008], [0.213, 1.064, -0.008]], [0.053, 0.058, 0.054], K.w.bone('uarmL'));
    K.tube('roll', [[-0.203, 1.102, -0.008], [-0.208, 1.083, -0.008], [-0.213, 1.064, -0.008]], [0.053, 0.058, 0.054], K.w.bone('uarmR'));
    K.hair('hair', 'short', { underHat: true });
    K.beard('beard', 'full');
    K.ball('beard', [0, 1.422, 0.052], [0.066, 0.040, 0.050], K.w.head);
    K.shell('cap', [[1.632, 0.094, 0.110, 0.108], [1.660, 0.112, 0.122, 0.124, 0, -0.004], [1.700, 0.118, 0.124, 0.130, 0, -0.010], [1.735, 0.100, 0.104, 0.112, 0, -0.014], [1.752, 0.055, 0.058, 0.062, 0, -0.016]], K.w.head, { n: 24, capLast: true });
    K.shell('capband', [[1.632, 0.094, 0.110, 0.108], [1.590, 0.097, 0.114, 0.112]], K.w.head, { n: 24 });
  },
};
      return PERSON; } },
  "ribbon-dyer": { name: "Ribbon Dyer", who: "An old, quiet dyer who boils and sells dyed ribbons and cloth lengths from a steaming stall at the fair.", shapes: "shapes by Fable 5.2", shapeId: "baker-fable", skin: "baker-B", fit: {"front": [1.0216, 1.0078, -0.01145, -0.00039], "back": [1.0216, 1.0078, -0.01015, -0.00039]}, faceFit: [1, 0, 0], skinColour: "#af9f83", scale: {"height": 0.97, "build": [1.12, 1.12], "head": [1.06, 1, 1.04]},
    wiring: {"talk": ["talk_calm"], "greet": "greet_bow", "fidgets": ["fidget_hands", "fidget_shift"], "pace": 0.8, "likes": ["think", "shrug", "nod"], "moods": {"yes": "nod", "no": "shake_head", "happy": "nod", "unsure": "shrug", "upset": "sad", "thanks": "greet_bow", "bye": "nod"}},
    SKIN: (function () {
const SKIN = {
 "front": {
  "scale": [
   1.03,
   1.03
  ],
  "move": [
   0,
   0.015
  ]
 },
 "back": {
  "scale": [
   1.03,
   1.03
  ],
  "move": [
   0,
   0.015
  ]
 },
 "skin": "#a8917f",
 "flat": {
  "hair": "#4e4a47",
  "soles": "#2a2522",
  "beard": "#857f78"
 },
 "rough": {
  "boots": 0.5,
  "hair": 0.95,
  "beard": 0.95
 },
 "seam": 0.25,
 "move": {
  "cap": [
   0,
   -0.035,
   0
  ],
  "capband": [
   0,
   -0.035,
   0
  ],
  "beard": [
   0,
   0.04,
   -0.06
  ]
 },
 "size": {
  "beard": [
   0.05,
   0.05,
   0.05
  ]
 }
};
      return SKIN; })(),
    person: function () {
const PERSON = {
  name: 'Baker',
  height: 1.0,
  build: [1.28, 1.26],
  head: [1.04, 1, 1.02],
  skin: '#d8a184',
  colors: { torso: '#c9a26b', sleeve: '#c9a26b', forearm: 'skin', legs: '#5b3d27', boots: '#2e211a', soles: '#1c1512' },
  parts: {
    shirt: { color: '#c9a26b', rough: 0.9 },
    roll: { color: '#d9b98a', rough: 0.9 },
    apron: { color: '#efe6d0', rough: 0.95 },
    tie: { color: '#d6c9a8', rough: 0.9 },
    towel: { color: '#e9dfc8', pattern: { kind: 'hoops', color: '#a8452f', n: 5 } },
    cap: { color: '#f5f2ea', rough: 0.95 },
    capband: { color: '#e3ded1', rough: 0.9 },
    hair: '#6b4326',
    beard: '#6b4326',
  },
  face(F) {
    F.lips('#a8655a', 0.5); F.brows('#5a381f', 0.85, 20); F.eyes('#5b4630', 0.6);
    F.lines(0.35); F.blush('#c8402f', 0.42);
    F.air(518, 485, 48, 42, '#c8503f', 0.18, 'multiply');
    F.beard('#6b4326', 0.85, 'beard');
    F.stroke([[236, 300], [206, 288]], '#6a4030', 0.35, 5);
    F.stroke([[788, 300], [818, 288]], '#6a4030', 0.35, 5);
    F.air(735, 400, 42, 20, '#ffffff', 0.22, 'screen');
  },
  make(K) {
    K.shell('shirt', [[1.312, 0.147, 0.086, 0.099], [1.26, 0.146, 0.112, 0.104], [1.215, 0.144, 0.122, 0.106], [1.14, 0.140, 0.134, 0.102], [1.04, 0.140, 0.150, 0.102], [0.95, 0.166, 0.146, 0.124], [0.87, 0.184, 0.130, 0.138], [0.78, 0.180, 0.118, 0.132]], K.w.torso, { n: 28 });
    K.panel('apron', [[1.258, 0.150, 0.128, 0.11], [1.215, 0.156, 0.138, 0.11], [1.14, 0.152, 0.146, 0.11], [1.06, 0.150, 0.160, 0.11]], -36, 36, K.w.torso, { n: 16 });
    K.panel('apron', [[1.048, 0.150, 0.161, 0.11], [0.95, 0.176, 0.158, 0.12], [0.87, 0.194, 0.148, 0.13], [0.78, 0.200, 0.150, 0.13], [0.64, 0.206, 0.170, 0.13], [0.50, 0.212, 0.190, 0.13]], -62, 62, K.w.skirt, { n: 26 });
    K.shell('tie', [[1.078, 0.152, 0.169, 0.112], [1.040, 0.153, 0.171, 0.112]], K.w.torso, { n: 28 });
    K.ball('tie', [0, 1.058, -0.120], [0.024, 0.015, 0.011], K.w.torso);
    K.tube('tie', [[0.008, 1.054, -0.121], [0.022, 0.99, -0.128], [0.032, 0.94, -0.140]], [0.006, 0.006, 0.007], K.w.torso);
    K.tube('tie', [[-0.008, 1.054, -0.121], [-0.020, 1.0, -0.127], [-0.026, 0.96, -0.137]], [0.006, 0.006, 0.007], K.w.torso);
    K.tube('tie', [[-0.088, 1.252, 0.110], [-0.080, 1.308, 0.090], [-0.064, 1.348, 0.034], [-0.040, 1.360, -0.042], [0, 1.362, -0.064], [0.040, 1.360, -0.042], [0.064, 1.348, 0.034], [0.080, 1.308, 0.090], [0.088, 1.252, 0.110]], [0.008, 0.008, 0.008, 0.008, 0.008, 0.008, 0.008, 0.008, 0.008], K.w.torso);
    K.panel('towel', [[1.050, 0.164, 0.176, 0.128], [0.94, 0.192, 0.170, 0.140], [0.83, 0.206, 0.162, 0.150]], 66, 98, K.w.skirt, { n: 10 });
    K.tube('roll', [[0.203, 1.102, -0.008], [0.208, 1.083, -0.008], [0.213, 1.064, -0.008]], [0.053, 0.058, 0.054], K.w.bone('uarmL'));
    K.tube('roll', [[-0.203, 1.102, -0.008], [-0.208, 1.083, -0.008], [-0.213, 1.064, -0.008]], [0.053, 0.058, 0.054], K.w.bone('uarmR'));
    K.hair('hair', 'short', { underHat: true });
    K.beard('beard', 'full');
    K.ball('beard', [0, 1.422, 0.052], [0.066, 0.040, 0.050], K.w.head);
    K.shell('cap', [[1.632, 0.094, 0.110, 0.108], [1.660, 0.112, 0.122, 0.124, 0, -0.004], [1.700, 0.118, 0.124, 0.130, 0, -0.010], [1.735, 0.100, 0.104, 0.112, 0, -0.014], [1.752, 0.055, 0.058, 0.062, 0, -0.016]], K.w.head, { n: 24, capLast: true });
    K.shell('capband', [[1.632, 0.094, 0.110, 0.108], [1.590, 0.097, 0.114, 0.112]], K.w.head, { n: 24 });
  },
};
      return PERSON; } },
  "farm-lad": { name: "Farm lad", who: "A cheerful young farmhand who carts hay and feed for the fair's ponies and stays on at night to help.", shapes: "shapes by Fable 5.2", shapeId: "farmhand-fable", skin: "farmhand-A", fit: {"front": [1.00617, 1.01945, -0.00309, -0.00195], "back": [1.00309, 1.01945, -0.00089, -0.00195]}, faceFit: [1, 0, 0], skinColour: "#d99789", scale: {"height": 1.01, "build": [1, 0.98], "head": [1.02, 1, 1]},
    wiring: {"talk": ["talk_lively"], "greet": "wave", "fidgets": ["fidget_shift", "fidget_look", "fidget_hands"], "pace": 1.15, "likes": ["wave", "laugh", "surprised"], "moods": {"yes": "nod", "no": "shake_head", "happy": "laugh", "unsure": "shrug", "upset": "sad", "thanks": "thanks", "bye": "wave"}},
    SKIN: (function () {
const SKIN = {
 "skin": "#d99789",
 "flat": {
  "hair": "#7b5a38",
  "straw": "#d6a85a",
  "button": "#5a3a24",
  "soles": "#2a1d16"
 },
 "rough": {
  "boots": 0.6,
  "straw": 0.9
 },
 "seam": 0.2,
 "move": {
  "straw": [
   0,
   -0.035,
   0
  ],
  "band": [
   0,
   -0.035,
   0
  ]
 }
};
      return SKIN; })(),
    person: function () {
const PERSON = {
  name: 'Farm lad',
  height: 0.98,
  build: [1.03, 1.0],
  skin: '#d3a17f',
  colors: {
    torso: '#c9982f', sleeve: '#c9982f', forearm: 'skin', legs: '#5b4030',
    boots: { color: '#46332a', rough: 1, pattern: { kind: 'dots', color: '#7d6548', n: 5 } },
    soles: '#6e5740',
  },
  parts: {
    shirt: { color: '#c9982f', rough: 0.9 },
    waistcoat: { color: '#4f6b3a', rough: 0.95 },
    kerchief: { color: '#a8452f', rough: 0.85 },
    button: { color: '#3a2a1c', rough: 0.4 },
    hair: '#c9a66b',
    straw: { color: '#dcbc68', rough: 0.95, pattern: { kind: 'hoops', color: '#b8953f', n: 10 } },
    band: { color: '#6b4a2e', rough: 0.8 },
    patch: { color: '#9a7a52', rough: 1 },
  },
  face(F) {
    F.lips('#b88a78', 0.7); F.brows('#a8845a', 0.85, 19); F.eyes('#5d7a8a', 0.65);
    F.blush('#c8654f', 0.22); F.freckles(70, '#9a5a3a', 0.55);
    F.air(518, 465, 95, 60, '#c8705a', 0.18, 'multiply');
  },
  make(K) {
    K.shell('shirt', [[1.305, 0.147, 0.090, 0.098], [1.27, 0.147, 0.124, 0.102], [1.225, 0.148, 0.146, 0.104], [1.16, 0.148, 0.146, 0.104], [1.06, 0.150, 0.140, 0.106], [0.95, 0.162, 0.136, 0.118], [0.87, 0.176, 0.134, 0.129], [0.79, 0.180, 0.134, 0.132]], K.w.torso, { n: 28 });
    K.panel('waistcoat', [[1.345, 0.086, 0.070, 0.076], [1.335, 0.135, 0.090, 0.096], [1.31, 0.157, 0.102, 0.108], [1.27, 0.157, 0.135, 0.112], [1.225, 0.158, 0.157, 0.114], [1.16, 0.158, 0.157, 0.114], [1.06, 0.160, 0.151, 0.116], [0.95, 0.172, 0.147, 0.128], [0.875, 0.186, 0.145, 0.139]], 20, 340, K.w.torso, { n: 28 });
    K.ball('button', [0.066, 1.19, 0.143], [0.012, 0.012, 0.009], K.w.torso);
    K.ball('button', [0.066, 1.11, 0.140], [0.012, 0.012, 0.009], K.w.torso);
    K.ball('button', [0.066, 1.03, 0.137], [0.012, 0.012, 0.009], K.w.torso);
    K.shell('kerchief', [[1.39, 0.058, 0.058, 0.058], [1.36, 0.067, 0.067, 0.064], [1.335, 0.076, 0.074, 0.068]], K.w.torso, { n: 20 });
    K.ball('kerchief', [0, 1.338, 0.080], [0.017, 0.014, 0.014], K.w.torso);
    K.tube('kerchief', [[0.004, 1.335, 0.086], [0.010, 1.305, 0.104], [0.016, 1.272, 0.134]], [0.010, 0.009, 0.006], K.w.torso);
    K.tube('shirt', [[0.203, 1.10, -0.008], [0.209, 1.078, -0.008], [0.215, 1.056, -0.008]], [0.056, 0.061, 0.056], K.w.bone('uarmL'));
    K.tube('shirt', [[-0.203, 1.10, -0.008], [-0.209, 1.078, -0.008], [-0.215, 1.056, -0.008]], [0.056, 0.061, 0.056], K.w.bone('uarmR'));
    K.ball('patch', [0.085, 0.545, 0.042], [0.036, 0.042, 0.018], K.w.bone('thighL'));
    K.panel('hair', [[1.615, 0.080, 0.094, 0.094], [1.56, 0.081, 0.094, 0.097], [1.51, 0.078, 0.088, 0.094], [1.475, 0.068, 0.074, 0.086]], 66, 294, K.w.head, { n: 22 });
    K.shell('straw', [[1.705, 0.066, 0.078, 0.078], [1.692, 0.082, 0.096, 0.095], [1.65, 0.090, 0.106, 0.104], [1.604, 0.092, 0.110, 0.108]], K.w.head, { n: 26, capFirst: true });
    K.shell('straw', [[1.604, 0.090, 0.108, 0.106], [1.600, 0.140, 0.154, 0.156, 0, -0.006], [1.604, 0.185, 0.194, 0.200, 0, -0.012], [1.618, 0.220, 0.224, 0.234, 0, -0.016]], K.w.head, { n: 32 });
    K.shell('band', [[1.636, 0.099, 0.116, 0.114], [1.610, 0.101, 0.119, 0.117]], K.w.head, { n: 26 });
  },
};
      return PERSON; } },
  "gate-keeper": { name: "Gate keeper", who: "A stern middle-aged man in a flat hat and waistcoat who takes the coins at the fair gate and watches who comes and goes after dark.", shapes: "shapes by Fable 5.2", shapeId: "farmhand-fable", skin: "farmhand-B", fit: {"front": [1.00926, 1.00801, -0.00528, -0.00138], "back": [1.00926, 1.00801, -0.00528, -0.00138]}, faceFit: [1, 0, 0], skinColour: "#4e291c", scale: {},
    wiring: {"talk": ["talk_gruff"], "greet": "beckon", "fidgets": ["fidget_look"], "pace": 1, "likes": ["cross", "refuse", "point"], "moods": {"yes": "nod", "no": "refuse", "happy": "nod", "unsure": "think", "upset": "cross", "thanks": "nod", "bye": "point"}},
    SKIN: (function () {
const SKIN = {
 "skin": "#5e3222",
 "flat": {
  "hair": "#2f2b29",
  "button": "#8c6b3c",
  "patch": "#4d5238",
  "soles": "#2a2523"
 },
 "rough": {
  "boots": 0.5,
  "hair": 0.95
 },
 "seam": 0.2,
 "move": {
  "straw": [
   0,
   -0.03,
   0
  ],
  "band": [
   0,
   -0.03,
   0
  ]
 }
};
      return SKIN; })(),
    person: function () {
const PERSON = {
  name: 'Farm lad',
  height: 0.98,
  build: [1.03, 1.0],
  skin: '#d3a17f',
  colors: {
    torso: '#c9982f', sleeve: '#c9982f', forearm: 'skin', legs: '#5b4030',
    boots: { color: '#46332a', rough: 1, pattern: { kind: 'dots', color: '#7d6548', n: 5 } },
    soles: '#6e5740',
  },
  parts: {
    shirt: { color: '#c9982f', rough: 0.9 },
    waistcoat: { color: '#4f6b3a', rough: 0.95 },
    kerchief: { color: '#a8452f', rough: 0.85 },
    button: { color: '#3a2a1c', rough: 0.4 },
    hair: '#c9a66b',
    straw: { color: '#dcbc68', rough: 0.95, pattern: { kind: 'hoops', color: '#b8953f', n: 10 } },
    band: { color: '#6b4a2e', rough: 0.8 },
    patch: { color: '#9a7a52', rough: 1 },
  },
  face(F) {
    F.lips('#b88a78', 0.7); F.brows('#a8845a', 0.85, 19); F.eyes('#5d7a8a', 0.65);
    F.blush('#c8654f', 0.22); F.freckles(70, '#9a5a3a', 0.55);
    F.air(518, 465, 95, 60, '#c8705a', 0.18, 'multiply');
  },
  make(K) {
    K.shell('shirt', [[1.305, 0.147, 0.090, 0.098], [1.27, 0.147, 0.124, 0.102], [1.225, 0.148, 0.146, 0.104], [1.16, 0.148, 0.146, 0.104], [1.06, 0.150, 0.140, 0.106], [0.95, 0.162, 0.136, 0.118], [0.87, 0.176, 0.134, 0.129], [0.79, 0.180, 0.134, 0.132]], K.w.torso, { n: 28 });
    K.panel('waistcoat', [[1.345, 0.086, 0.070, 0.076], [1.335, 0.135, 0.090, 0.096], [1.31, 0.157, 0.102, 0.108], [1.27, 0.157, 0.135, 0.112], [1.225, 0.158, 0.157, 0.114], [1.16, 0.158, 0.157, 0.114], [1.06, 0.160, 0.151, 0.116], [0.95, 0.172, 0.147, 0.128], [0.875, 0.186, 0.145, 0.139]], 20, 340, K.w.torso, { n: 28 });
    K.ball('button', [0.066, 1.19, 0.143], [0.012, 0.012, 0.009], K.w.torso);
    K.ball('button', [0.066, 1.11, 0.140], [0.012, 0.012, 0.009], K.w.torso);
    K.ball('button', [0.066, 1.03, 0.137], [0.012, 0.012, 0.009], K.w.torso);
    K.shell('kerchief', [[1.39, 0.058, 0.058, 0.058], [1.36, 0.067, 0.067, 0.064], [1.335, 0.076, 0.074, 0.068]], K.w.torso, { n: 20 });
    K.ball('kerchief', [0, 1.338, 0.080], [0.017, 0.014, 0.014], K.w.torso);
    K.tube('kerchief', [[0.004, 1.335, 0.086], [0.010, 1.305, 0.104], [0.016, 1.272, 0.134]], [0.010, 0.009, 0.006], K.w.torso);
    K.tube('shirt', [[0.203, 1.10, -0.008], [0.209, 1.078, -0.008], [0.215, 1.056, -0.008]], [0.056, 0.061, 0.056], K.w.bone('uarmL'));
    K.tube('shirt', [[-0.203, 1.10, -0.008], [-0.209, 1.078, -0.008], [-0.215, 1.056, -0.008]], [0.056, 0.061, 0.056], K.w.bone('uarmR'));
    K.ball('patch', [0.085, 0.545, 0.042], [0.036, 0.042, 0.018], K.w.bone('thighL'));
    K.panel('hair', [[1.615, 0.080, 0.094, 0.094], [1.56, 0.081, 0.094, 0.097], [1.51, 0.078, 0.088, 0.094], [1.475, 0.068, 0.074, 0.086]], 66, 294, K.w.head, { n: 22 });
    K.shell('straw', [[1.705, 0.066, 0.078, 0.078], [1.692, 0.082, 0.096, 0.095], [1.65, 0.090, 0.106, 0.104], [1.604, 0.092, 0.110, 0.108]], K.w.head, { n: 26, capFirst: true });
    K.shell('straw', [[1.604, 0.090, 0.108, 0.106], [1.600, 0.140, 0.154, 0.156, 0, -0.006], [1.604, 0.185, 0.194, 0.200, 0, -0.012], [1.618, 0.220, 0.224, 0.234, 0, -0.016]], K.w.head, { n: 32 });
    K.shell('band', [[1.636, 0.099, 0.116, 0.114], [1.610, 0.101, 0.119, 0.117]], K.w.head, { n: 26 });
  },
};
      return PERSON; } },
  "fortune-teller-opus": { name: "Fortune-teller", who: "A tall, thin fortune-teller who reads palms and cards in a dim tent at the edge of the fair.", shapes: "shapes by Opus 5.5", shapeId: "fortune-opus", skin: "fortune-A", fit: {"front": [1.02023, 1.00467, -0.01077, -0.00121], "back": [1.02023, 1.0035, -0.01077, -0.00115]}, faceFit: [1, 0, 0], skinColour: "#c7b0b2", scale: {"height": 1.05, "build": [0.92, 0.95], "head": [1, 1, 1]},
    wiring: {"talk": ["talk_calm"], "greet": "beckon", "fidgets": ["fidget_hands"], "pace": 0.94, "likes": ["think", "beckon", "point"], "moods": {"yes": "nod", "no": "refuse", "happy": "nod", "unsure": "think", "upset": "cross", "thanks": "greet_bow", "bye": "greet_bow"}},
    SKIN: (function () {
const SKIN = {
 "skin": "#d6c8ca",
 "flat": {
  "soles": "#1c1618",
  "hair": "#17131a"
 },
 "rough": {
  "boots": 0.5,
  "gold": 0.35,
  "sash": 0.8,
  "hair": 0.85
 },
 "seam": 0.2,
 "move": {
  "scarf": [
   0,
   -0.018,
   0
  ],
  "gold": [
   0,
   -0.018,
   0
  ]
 }
};
      return SKIN; })(),
    person: function () {
const PERSON = {
  name: 'Fortune-teller',
  height: 1.08,
  build: [0.92, 0.95],
  head: [0.97, 1.03, 1],
  skin: '#e8d6cc',
  colors: { torso: '#1f2a5c', sleeve: '#1f2a5c', forearm: '#1f2a5c', legs: '#1a1a24', boots: '#1c1418', soles: '#120e10' },
  parts: {
    robe: { color: '#1f2a5c', rough: 0.85 },
    sash: { color: '#3a1530', rough: 0.6, pattern: { kind: 'hoops', color: '#c9a23a', n: 3 } },
    gold: { color: '#c9a23a', metal: 1, rough: 0.35 },
    hair: { color: '#0e0b10', rough: 0.6 },
    scarf: { color: '#5e2346', rough: 0.8 },
  },
  face(F) {
    F.pale(0.45);
    F.eyeshadow('#1c0e22', 1);
    F.air(356, 290, 78, 30, '#1e0c24', 0.9, 'multiply');
    F.air(668, 290, 78, 30, '#1e0c24', 0.9, 'multiply');
    F.air(356, 296, 60, 20, '#140818', 0.6, 'multiply');
    F.air(668, 296, 60, 20, '#140818', 0.6, 'multiply');
    F.stroke([[304, 308], [356, 286], [408, 296]], '#08040a', 1, 10);
    F.stroke([[616, 296], [668, 286], [720, 308]], '#08040a', 1, 10);
    F.stroke([[406, 296], [436, 280]], '#08040a', 0.9, 6);
    F.stroke([[618, 296], [588, 280]], '#08040a', 0.9, 6);
    F.stroke([[316, 324], [356, 334], [396, 324]], '#140a16', 0.7, 6);
    F.stroke([[628, 324], [668, 334], [708, 324]], '#140a16', 0.7, 6);
    F.brows('#0e0a10', 0.9, 12);
    F.eyes('#5b6b5a', 0.75);
    F.underEye(0.3);
    F.lips('#5e2438', 0.8);
    F.blush('#a0607a', 0.06);
    F.mole(610, 600, 5);
  },
  make(K) {
    K.shell('robe', [[1.06, 0.120, 0.096, 0.094], [0.95, 0.160, 0.108, 0.118], [0.87, 0.186, 0.118, 0.134], [0.70, 0.202, 0.165, 0.175], [0.47, 0.212, 0.196, 0.202], [0.25, 0.224, 0.206, 0.212], [0.06, 0.234, 0.216, 0.222]], K.w.skirt, { n: 30 });
    K.shell('sash', [[1.11, 0.126, 0.102, 0.098], [1.075, 0.129, 0.105, 0.102], [1.04, 0.133, 0.109, 0.107]], K.w.torso, { n: 28 });
    K.tube('sash', [[0.07, 1.05, 0.125], [0.08, 0.95, 0.142], [0.09, 0.80, 0.168]], [0.022, 0.020, 0.018], K.w.skirt);
    K.ball('gold', [0.09, 0.765, 0.172], [0.020, 0.026, 0.020], K.w.skirt);
    K.tube('robe', [[0.211, 1.07, -0.008], [0.245, 0.95, -0.008], [0.280, 0.82, -0.008]], [0.056, 0.064, 0.077], K.w.bone('farmL'));
    K.tube('robe', [[-0.211, 1.07, -0.008], [-0.245, 0.95, -0.008], [-0.280, 0.82, -0.008]], [0.056, 0.064, 0.077], K.w.bone('farmR'));
    K.tube('gold', [[0.274, 0.842, -0.008], [0.281, 0.817, -0.008]], [0.084, 0.087], K.w.bone('farmL'));
    K.tube('gold', [[-0.274, 0.842, -0.008], [-0.281, 0.817, -0.008]], [0.084, 0.087], K.w.bone('farmR'));
    K.hair('hair', 'long', { underHat: true });
    K.shell('scarf', [[1.690, 0.012, 0.014, 0.014, 0, -0.010], [1.682, 0.050, 0.058, 0.064, 0, -0.010], [1.665, 0.078, 0.090, 0.098, 0, -0.008], [1.640, 0.092, 0.106, 0.112, 0, -0.004], [1.615, 0.097, 0.113, 0.114], [1.595, 0.097, 0.114, 0.113]], K.w.head, { n: 28, capFirst: true });
    K.panel('scarf', [[1.596, 0.099, 0.116, 0.116], [1.56, 0.100, 0.116, 0.118], [1.52, 0.098, 0.106, 0.118]], 75, 285, K.w.head, { n: 20 });
    K.shell('gold', [[1.603, 0.106, 0.123, 0.122], [1.591, 0.106, 0.123, 0.122]], K.w.head, { n: 28 });
    K.ball('scarf', [0, 1.55, -0.136], [0.032, 0.028, 0.022], K.w.head);
    K.tube('scarf', [[0.005, 1.54, -0.142], [0.015, 1.46, -0.148], [0.025, 1.38, -0.150]], [0.016, 0.014, 0.010], K.w.hair);
    K.tube('gold', [[-0.055, 1.345, 0.035], [-0.03, 1.29, 0.09], [0, 1.255, 0.108], [0.03, 1.29, 0.09], [0.055, 1.345, 0.035]], [0.003, 0.003, 0.003, 0.003, 0.003], K.w.bone('spine3'));
    K.ball('gold', [0, 1.238, 0.114], [0.018, 0.020, 0.006], K.w.bone('spine3'));
  },
};
      return PERSON; } },
  "old-lamplighter-opus": { name: "Old lamplighter", who: "An elderly woman in a red dress and headscarf who walks the fair at dusk, lighting and trimming the lanterns along the stalls.", shapes: "shapes by Opus 5.5", shapeId: "fortune-opus", skin: "fortune-B", fit: {"front": [1.01734, 1.00701, -0.00997, -0.00133], "back": [1.02023, 1.00701, -0.01077, -0.00133]}, faceFit: [1, 0, 0], skinColour: "#af7353", scale: {"height": 1.02, "build": [0.96, 0.96], "head": [1, 1, 1]},
    wiring: {"talk": ["talk_calm"], "greet": "wave", "fidgets": ["fidget_look", "fidget_shift"], "pace": 0.85, "likes": ["point", "nod", "wave"], "moods": {"yes": "nod", "no": "shake_head", "happy": "laugh", "unsure": "shrug", "upset": "sad", "thanks": "thanks", "bye": "wave"}},
    SKIN: (function () {
const SKIN = {
 "skin": "#af7353",
 "flat": {
  "hair": "#7a736a"
 },
 "move": {
  "scarf": [
   0,
   -0.03,
   0
  ],
  "gold": [
   0,
   -0.03,
   0
  ]
 },
 "rough": {
  "hair": 0.95
 }
};
      return SKIN; })(),
    person: function () {
const PERSON = {
  name: 'Fortune-teller',
  height: 1.08,
  build: [0.92, 0.95],
  head: [0.97, 1.03, 1],
  skin: '#e8d6cc',
  colors: { torso: '#1f2a5c', sleeve: '#1f2a5c', forearm: '#1f2a5c', legs: '#1a1a24', boots: '#1c1418', soles: '#120e10' },
  parts: {
    robe: { color: '#1f2a5c', rough: 0.85 },
    sash: { color: '#3a1530', rough: 0.6, pattern: { kind: 'hoops', color: '#c9a23a', n: 3 } },
    gold: { color: '#c9a23a', metal: 1, rough: 0.35 },
    hair: { color: '#0e0b10', rough: 0.6 },
    scarf: { color: '#5e2346', rough: 0.8 },
  },
  face(F) {
    F.pale(0.45);
    F.eyeshadow('#1c0e22', 1);
    F.air(356, 290, 78, 30, '#1e0c24', 0.9, 'multiply');
    F.air(668, 290, 78, 30, '#1e0c24', 0.9, 'multiply');
    F.air(356, 296, 60, 20, '#140818', 0.6, 'multiply');
    F.air(668, 296, 60, 20, '#140818', 0.6, 'multiply');
    F.stroke([[304, 308], [356, 286], [408, 296]], '#08040a', 1, 10);
    F.stroke([[616, 296], [668, 286], [720, 308]], '#08040a', 1, 10);
    F.stroke([[406, 296], [436, 280]], '#08040a', 0.9, 6);
    F.stroke([[618, 296], [588, 280]], '#08040a', 0.9, 6);
    F.stroke([[316, 324], [356, 334], [396, 324]], '#140a16', 0.7, 6);
    F.stroke([[628, 324], [668, 334], [708, 324]], '#140a16', 0.7, 6);
    F.brows('#0e0a10', 0.9, 12);
    F.eyes('#5b6b5a', 0.75);
    F.underEye(0.3);
    F.lips('#5e2438', 0.8);
    F.blush('#a0607a', 0.06);
    F.mole(610, 600, 5);
  },
  make(K) {
    K.shell('robe', [[1.06, 0.120, 0.096, 0.094], [0.95, 0.160, 0.108, 0.118], [0.87, 0.186, 0.118, 0.134], [0.70, 0.202, 0.165, 0.175], [0.47, 0.212, 0.196, 0.202], [0.25, 0.224, 0.206, 0.212], [0.06, 0.234, 0.216, 0.222]], K.w.skirt, { n: 30 });
    K.shell('sash', [[1.11, 0.126, 0.102, 0.098], [1.075, 0.129, 0.105, 0.102], [1.04, 0.133, 0.109, 0.107]], K.w.torso, { n: 28 });
    K.tube('sash', [[0.07, 1.05, 0.125], [0.08, 0.95, 0.142], [0.09, 0.80, 0.168]], [0.022, 0.020, 0.018], K.w.skirt);
    K.ball('gold', [0.09, 0.765, 0.172], [0.020, 0.026, 0.020], K.w.skirt);
    K.tube('robe', [[0.211, 1.07, -0.008], [0.245, 0.95, -0.008], [0.280, 0.82, -0.008]], [0.056, 0.064, 0.077], K.w.bone('farmL'));
    K.tube('robe', [[-0.211, 1.07, -0.008], [-0.245, 0.95, -0.008], [-0.280, 0.82, -0.008]], [0.056, 0.064, 0.077], K.w.bone('farmR'));
    K.tube('gold', [[0.274, 0.842, -0.008], [0.281, 0.817, -0.008]], [0.084, 0.087], K.w.bone('farmL'));
    K.tube('gold', [[-0.274, 0.842, -0.008], [-0.281, 0.817, -0.008]], [0.084, 0.087], K.w.bone('farmR'));
    K.hair('hair', 'long', { underHat: true });
    K.shell('scarf', [[1.690, 0.012, 0.014, 0.014, 0, -0.010], [1.682, 0.050, 0.058, 0.064, 0, -0.010], [1.665, 0.078, 0.090, 0.098, 0, -0.008], [1.640, 0.092, 0.106, 0.112, 0, -0.004], [1.615, 0.097, 0.113, 0.114], [1.595, 0.097, 0.114, 0.113]], K.w.head, { n: 28, capFirst: true });
    K.panel('scarf', [[1.596, 0.099, 0.116, 0.116], [1.56, 0.100, 0.116, 0.118], [1.52, 0.098, 0.106, 0.118]], 75, 285, K.w.head, { n: 20 });
    K.shell('gold', [[1.603, 0.106, 0.123, 0.122], [1.591, 0.106, 0.123, 0.122]], K.w.head, { n: 28 });
    K.ball('scarf', [0, 1.55, -0.136], [0.032, 0.028, 0.022], K.w.head);
    K.tube('scarf', [[0.005, 1.54, -0.142], [0.015, 1.46, -0.148], [0.025, 1.38, -0.150]], [0.016, 0.014, 0.010], K.w.hair);
    K.tube('gold', [[-0.055, 1.345, 0.035], [-0.03, 1.29, 0.09], [0, 1.255, 0.108], [0.03, 1.29, 0.09], [0.055, 1.345, 0.035]], [0.003, 0.003, 0.003, 0.003, 0.003], K.w.bone('spine3'));
    K.ball('gold', [0, 1.238, 0.114], [0.018, 0.020, 0.006], K.w.bone('spine3'));
  },
};
      return PERSON; } },
  "old-night-watchman-opus": { name: "Old night-watchman", who: "An old night-watchman who walks the fair rows after dark, checking stall shutters and lamps.", shapes: "shapes by Opus 5.5", shapeId: "watchman-opus", skin: "watchman-A", fit: {"front": [1.01852, 1.01302, -0.01056, -0.00553], "back": [1.01543, 1.01302, -0.00707, -0.00553]}, faceFit: [1, 0, 0], skinColour: "#4f2a1d", scale: {"height": 1.01, "build": [1.1, 1.08], "head": [1, 1, 1]},
    wiring: {"talk": ["talk_calm", "talk_gruff"], "greet": "nod", "fidgets": ["fidget_look"], "pace": 0.88, "likes": ["point", "nod", "cross"], "moods": {"yes": "nod", "no": "shake_head", "happy": "nod", "unsure": "think", "upset": "cross", "thanks": "nod", "bye": "wave"}},
    SKIN: (function () {
const SKIN = {
 "skin": "#6e4230",
 "flat": {
  "soles": "#231c18"
 },
 "rough": {
  "boots": 0.5,
  "belt": 0.45,
  "brass": 0.3,
  "hatband": 0.8
 },
 "seam": 0.2,
 "move": {
  "hat": [
   0,
   -0.03,
   0
  ],
  "hatband": [
   0,
   -0.03,
   0
  ]
 }
};
      return SKIN; })(),
    person: function () {
const PERSON = {
  name: 'Night-watchman',
  height: 0.98,
  build: [1.1, 1.08],
  head: [1, 1, 1],
  skin: '#5e3b28',
  colors: { torso: '#5f6266', sleeve: '#5f6266', forearm: '#5f6266', legs: '#2e2a28', boots: { color: '#161417', rough: 0.4 }, soles: '#0c0b0b' },
  parts: {
    coat: { color: '#5f6266', rough: 0.95 },
    coatTrim: { color: '#3a3c40', rough: 0.95 },
    scarf: { color: '#a3241e', rough: 0.95, pattern: { kind: 'hoops', color: '#7e1915', n: 4 } },
    hat: { color: '#23201e', rough: 0.95 },
    hatband: { color: '#3d2418', rough: 0.6 },
    brass: { color: '#b8923a', metal: 1, rough: 0.35 },
    belt: { color: '#1c1613', rough: 0.4 },
    hair: { color: '#b9b4ac', rough: 0.95 },
    beard: { color: '#cfcac2', rough: 0.95 },
  },
  face(F) {
    F.lips('#6b3f38', 0.5); F.brows('#d0ccc4', 0.8, 16); F.eyes('#3a2618', 0.7);
    F.lines(0.85); F.underEye(0.45); F.blush('#7a3a2c', 0.08);
    F.beard('#d6d2ca', 0.75, 'beard'); F.mole(380, 560, 5);
  },
  make(K) {
    K.shell('coat', [[1.36, 0.070, 0.070, 0.074], [1.32, 0.150, 0.100, 0.102], [1.25, 0.148, 0.132, 0.106], [1.215, 0.148, 0.136, 0.108], [1.14, 0.142, 0.128, 0.106], [1.04, 0.142, 0.118, 0.108], [0.99, 0.154, 0.116, 0.115]], K.w.torso, { n: 28 });
    K.shell('coat', [[1.06, 0.146, 0.114, 0.112], [0.95, 0.169, 0.116, 0.126], [0.87, 0.186, 0.122, 0.138], [0.79, 0.196, 0.152, 0.168], [0.65, 0.212, 0.186, 0.202], [0.52, 0.226, 0.200, 0.215], [0.44, 0.232, 0.206, 0.222]], K.w.skirt, { n: 30 });
    K.shell('coatTrim', [[0.52, 0.236, 0.210, 0.225], [0.44, 0.242, 0.216, 0.232]], K.w.skirt, { n: 30 });
    K.shell('belt', [[1.075, 0.158, 0.132, 0.122], [0.99, 0.170, 0.134, 0.130]], K.w.torso, { n: 28 });
    K.ball('brass', [0, 1.032, 0.140], [0.022, 0.026, 0.008], K.w.torso);
    K.shell('scarf', [[1.385, 0.066, 0.068, 0.068], [1.36, 0.084, 0.086, 0.088], [1.345, 0.112, 0.094, 0.096], [1.335, 0.130, 0.102, 0.102]], K.w.torso, { n: 26 });
    K.tube('scarf', [[0.05, 1.335, 0.110], [0.065, 1.25, 0.152], [0.075, 1.17, 0.152], [0.078, 1.105, 0.146]], [0.022, 0.020, 0.020, 0.018], K.w.torso);
    K.shell('hat', [[1.585, 0.094, 0.110, 0.108], [1.64, 0.092, 0.108, 0.106], [1.72, 0.088, 0.103, 0.101], [1.79, 0.083, 0.097, 0.095], [1.80, 0.080, 0.094, 0.092]], K.w.head, { n: 28, capLast: true });
    K.shell('hat', [[1.596, 0.103, 0.119, 0.117], [1.592, 0.130, 0.148, 0.144], [1.582, 0.150, 0.172, 0.166]], K.w.head, { n: 28 });
    K.shell('hatband', [[1.64, 0.101, 0.117, 0.115], [1.598, 0.103, 0.119, 0.117]], K.w.head, { n: 28 });
    K.ball('brass', [0, 1.62, 0.124], [0.013, 0.013, 0.006], K.w.head);
    K.hair('hair', 'short', { underHat: true });
    K.beard('beard', 'short');
    K.tube('coatTrim', [[0.252, 0.92, -0.008], [0.268, 0.86, -0.008]], [0.044, 0.038], K.w.bone('farmL'));
    K.tube('coatTrim', [[-0.252, 0.92, -0.008], [-0.268, 0.86, -0.008]], [0.044, 0.038], K.w.bone('farmR'));
  },
};
      return PERSON; } },
  "chestnut-roaster-opus": { name: "Chestnut roaster", who: "A cheerful middle-aged man who roasts chestnuts over a brazier at the fair gate.", shapes: "shapes by Opus 5.5", shapeId: "watchman-opus", skin: "watchman-B", fit: {"front": [1.01543, 1.04013, -0.00837, -0.01274], "back": [1.01235, 1.04013, -0.00747, -0.01274]}, faceFit: [1, 0, 0], skinColour: "#d99c8d", scale: {"height": 1.04, "build": [1.1, 1.08], "head": [1, 1, 1]},
    wiring: {"talk": ["talk_lively"], "greet": "beckon", "fidgets": ["fidget_hands", "fidget_shift"], "pace": 1.05, "likes": ["laugh", "beckon", "wave"], "moods": {"yes": "nod", "no": "shake_head", "happy": "laugh", "unsure": "shrug", "upset": "sad", "thanks": "thanks", "bye": "wave"}},
    SKIN: (function () {
const SKIN = {
 "skin": "#c98f79",
 "flat": {
  "hair": "#7c4528",
  "soles": "#2a1d16"
 },
 "rough": {
  "boots": 0.5,
  "belt": 0.5,
  "brass": 0.3,
  "hair": 0.9
 },
 "move": {
  "hat": [
   0,
   -0.04,
   0
  ],
  "hatband": [
   0,
   -0.04,
   0
  ]
 }
};
      return SKIN; })(),
    person: function () {
const PERSON = {
  name: 'Night-watchman',
  height: 0.98,
  build: [1.1, 1.08],
  head: [1, 1, 1],
  skin: '#5e3b28',
  colors: { torso: '#5f6266', sleeve: '#5f6266', forearm: '#5f6266', legs: '#2e2a28', boots: { color: '#161417', rough: 0.4 }, soles: '#0c0b0b' },
  parts: {
    coat: { color: '#5f6266', rough: 0.95 },
    coatTrim: { color: '#3a3c40', rough: 0.95 },
    scarf: { color: '#a3241e', rough: 0.95, pattern: { kind: 'hoops', color: '#7e1915', n: 4 } },
    hat: { color: '#23201e', rough: 0.95 },
    hatband: { color: '#3d2418', rough: 0.6 },
    brass: { color: '#b8923a', metal: 1, rough: 0.35 },
    belt: { color: '#1c1613', rough: 0.4 },
    hair: { color: '#b9b4ac', rough: 0.95 },
    beard: { color: '#cfcac2', rough: 0.95 },
  },
  face(F) {
    F.lips('#6b3f38', 0.5); F.brows('#d0ccc4', 0.8, 16); F.eyes('#3a2618', 0.7);
    F.lines(0.85); F.underEye(0.45); F.blush('#7a3a2c', 0.08);
    F.beard('#d6d2ca', 0.75, 'beard'); F.mole(380, 560, 5);
  },
  make(K) {
    K.shell('coat', [[1.36, 0.070, 0.070, 0.074], [1.32, 0.150, 0.100, 0.102], [1.25, 0.148, 0.132, 0.106], [1.215, 0.148, 0.136, 0.108], [1.14, 0.142, 0.128, 0.106], [1.04, 0.142, 0.118, 0.108], [0.99, 0.154, 0.116, 0.115]], K.w.torso, { n: 28 });
    K.shell('coat', [[1.06, 0.146, 0.114, 0.112], [0.95, 0.169, 0.116, 0.126], [0.87, 0.186, 0.122, 0.138], [0.79, 0.196, 0.152, 0.168], [0.65, 0.212, 0.186, 0.202], [0.52, 0.226, 0.200, 0.215], [0.44, 0.232, 0.206, 0.222]], K.w.skirt, { n: 30 });
    K.shell('coatTrim', [[0.52, 0.236, 0.210, 0.225], [0.44, 0.242, 0.216, 0.232]], K.w.skirt, { n: 30 });
    K.shell('belt', [[1.075, 0.158, 0.132, 0.122], [0.99, 0.170, 0.134, 0.130]], K.w.torso, { n: 28 });
    K.ball('brass', [0, 1.032, 0.140], [0.022, 0.026, 0.008], K.w.torso);
    K.shell('scarf', [[1.385, 0.066, 0.068, 0.068], [1.36, 0.084, 0.086, 0.088], [1.345, 0.112, 0.094, 0.096], [1.335, 0.130, 0.102, 0.102]], K.w.torso, { n: 26 });
    K.tube('scarf', [[0.05, 1.335, 0.110], [0.065, 1.25, 0.152], [0.075, 1.17, 0.152], [0.078, 1.105, 0.146]], [0.022, 0.020, 0.020, 0.018], K.w.torso);
    K.shell('hat', [[1.585, 0.094, 0.110, 0.108], [1.64, 0.092, 0.108, 0.106], [1.72, 0.088, 0.103, 0.101], [1.79, 0.083, 0.097, 0.095], [1.80, 0.080, 0.094, 0.092]], K.w.head, { n: 28, capLast: true });
    K.shell('hat', [[1.596, 0.103, 0.119, 0.117], [1.592, 0.130, 0.148, 0.144], [1.582, 0.150, 0.172, 0.166]], K.w.head, { n: 28 });
    K.shell('hatband', [[1.64, 0.101, 0.117, 0.115], [1.598, 0.103, 0.119, 0.117]], K.w.head, { n: 28 });
    K.ball('brass', [0, 1.62, 0.124], [0.013, 0.013, 0.006], K.w.head);
    K.hair('hair', 'short', { underHat: true });
    K.beard('beard', 'short');
    K.tube('coatTrim', [[0.252, 0.92, -0.008], [0.268, 0.86, -0.008]], [0.044, 0.038], K.w.bone('farmL'));
    K.tube('coatTrim', [[-0.252, 0.92, -0.008], [-0.268, 0.86, -0.008]], [0.044, 0.038], K.w.bone('farmR'));
  },
};
      return PERSON; } },
  "fair-baker-opus": { name: "Fair Baker", who: "A stout, cheerful baker who sells warm loaves and buns from his oven cart at the night fair.", shapes: "shapes by Opus 5.5", shapeId: "baker-opus", skin: "baker-A", fit: {"front": [1.10494, 1.0412, -0.05247, -0.00596], "back": [1.11111, 1.0412, -0.05556, -0.00596]}, faceFit: [1, 0, 0], skinColour: "#d0826c", scale: {},
    wiring: {"talk": ["talk_lively", "talk_calm"], "greet": "wave", "fidgets": ["fidget_shift"], "pace": 0.96, "likes": ["laugh", "thanks", "beckon"], "moods": {"yes": "nod", "no": "shake_head", "happy": "laugh", "unsure": "think", "upset": "sad", "thanks": "thanks", "bye": "wave"}},
    SKIN: (function () {
const SKIN = {
  skin: '#cf8a72',
  flat: { soles: '#2a1d16' },
  rough: { boots: 0.5 },
  move: { cap: [0, -0.04, 0] },
};
      return SKIN; })(),
    person: function () {
const PERSON = {
  name: 'Baker',
  height: 1.0,
  build: [1.28, 1.24],
  head: [1.06, 1.02, 1.02],
  skin: '#d9a58a',
  colors: { torso: '#b48a5a', sleeve: '#b48a5a', forearm: 'skin', legs: '#5b3d27', boots: '#2f2219', soles: '#1e1611' },
  parts: {
    shirt: { color: '#b48a5a', rough: 0.9 },
    roll: { color: '#c39a68', rough: 0.9 },
    trousers: { color: '#5b3d27', rough: 0.95 },
    apron: { color: '#ece2c8', rough: 0.95 },
    pocket: { color: '#c9b48a', pattern: { kind: 'stripes', color: '#a8463a', n: 4 } },
    hair: '#5a3a22',
    beard: '#5a3a22',
    cap: { color: '#f4f1ea', rough: 0.95 },
  },
  face(F) {
    F.blush('#d0503c', 0.42);
    F.air(518, 490, 45, 40, '#d06050', 0.22, 'color');
    F.beard('#5a3a22', 0.95, 'beard');
    F.brows('#4a2f1c', 0.95, 22);
    F.eyes('#5a4030', 0.6);
    F.lips('#b06a5a', 0.4);
    F.lines(0.4);
    F.underEye(0.2);
    F.stroke([[430, 560], [415, 620], [440, 680]], '#8a5040', 0.3, 7);
    F.stroke([[606, 560], [621, 620], [596, 680]], '#8a5040', 0.3, 7);
  },
  make(K) {
    K.shell('shirt', [[1.345, 0.062, 0.062, 0.066], [1.332, 0.118, 0.080, 0.090], [1.312, 0.146, 0.090, 0.100], [1.215, 0.148, 0.128, 0.108], [1.14, 0.142, 0.150, 0.104], [1.04, 0.152, 0.165, 0.104], [0.96, 0.162, 0.150, 0.118], [0.92, 0.168, 0.138, 0.124]], K.w.torso, { n: 28 });
    K.shell('trousers', [[0.99, 0.174, 0.166, 0.128], [0.93, 0.182, 0.158, 0.136], [0.87, 0.192, 0.145, 0.142], [0.80, 0.196, 0.132, 0.140], [0.74, 0.190, 0.120, 0.130]], K.w.skirt, { n: 28 });
    K.shell('apron', [[1.008, 0.184, 0.182, 0.136], [0.962, 0.190, 0.176, 0.144]], K.w.torso, { n: 28 });
    K.panel('apron', [[0.975, 0.198, 0.190], [0.90, 0.207, 0.178], [0.80, 0.214, 0.180], [0.68, 0.226, 0.198], [0.55, 0.236, 0.212], [0.45, 0.240, 0.220]], -62, 62, K.w.skirt, { n: 24 });
    K.panel('apron', [[1.25, 0.152, 0.124], [1.215, 0.156, 0.138], [1.14, 0.150, 0.160], [1.04, 0.160, 0.175], [1.012, 0.162, 0.170]], -40, 40, K.w.torso, { n: 16 });
    K.panel('pocket', [[0.88, 0.220, 0.190], [0.83, 0.223, 0.192], [0.78, 0.225, 0.194]], -25, 25, K.w.skirt, { n: 10 });
    K.tube('apron', [[0.092, 1.25, 0.114], [0.086, 1.318, 0.092], [0.066, 1.358, 0.010], [0.045, 1.368, -0.055], [0, 1.372, -0.072]], [0.007, 0.007, 0.007, 0.007, 0.007], K.w.torso);
    K.tube('apron', [[-0.092, 1.25, 0.114], [-0.086, 1.318, 0.092], [-0.066, 1.358, 0.010], [-0.045, 1.368, -0.055], [0, 1.372, -0.072]], [0.007, 0.007, 0.007, 0.007, 0.007], K.w.torso);
    K.ball('apron', [0, 0.985, -0.166], [0.032, 0.018, 0.012], K.w.bone('hips'));
    K.tube('apron', [[0.005, 0.98, -0.166], [0.015, 0.92, -0.168], [0.025, 0.86, -0.170]], [0.008, 0.010, 0.006], K.w.bone('hips'));
    K.shell('roll', [[1.13, 0.060, 0.058, 0.058, 0.195, -0.008], [1.105, 0.068, 0.066, 0.066, 0.202, -0.008], [1.075, 0.062, 0.060, 0.060, 0.210, -0.008]], K.w.bone('uarmL'), { n: 16 });
    K.shell('roll', [[1.13, 0.060, 0.058, 0.058, -0.195, -0.008], [1.105, 0.068, 0.066, 0.066, -0.202, -0.008], [1.075, 0.062, 0.060, 0.060, -0.210, -0.008]], K.w.bone('uarmR'), { n: 16 });
    K.hair('hair', 'short', { underHat: true });
    K.beard('beard', 'short');
    K.shell('cap', [[1.588, 0.096, 0.114, 0.110], [1.625, 0.094, 0.112, 0.108], [1.645, 0.106, 0.122, 0.120], [1.675, 0.112, 0.128, 0.126], [1.705, 0.102, 0.116, 0.114], [1.725, 0.072, 0.082, 0.082], [1.735, 0.020, 0.020, 0.020]], K.w.head, { n: 28, capLast: true });
  },
};
      return PERSON; } },
  "ribbon-dyer-opus": { name: "Ribbon Dyer", who: "An old, quiet dyer who boils and sells dyed ribbons and cloth lengths from a steaming stall at the fair.", shapes: "shapes by Opus 5.5", shapeId: "baker-opus", skin: "baker-B", fit: {"front": [1.0216, 1.0078, -0.01145, -0.00039], "back": [1.0216, 1.0078, -0.01015, -0.00039]}, faceFit: [1, 0, 0], skinColour: "#af9f83", scale: {"height": 0.97, "build": [1.12, 1.1], "head": [1.06, 1, 1.04]},
    wiring: {"talk": ["talk_calm"], "greet": "greet_bow", "fidgets": ["fidget_hands", "fidget_shift"], "pace": 0.8, "likes": ["think", "shrug", "nod"], "moods": {"yes": "nod", "no": "shake_head", "happy": "nod", "unsure": "shrug", "upset": "sad", "thanks": "greet_bow", "bye": "nod"}},
    SKIN: (function () {
const SKIN = {
 "front": {
  "scale": [
   1.04,
   1.01
  ],
  "move": [
   0,
   0.01
  ]
 },
 "back": {
  "scale": [
   1.04,
   1.01
  ],
  "move": [
   0,
   0.01
  ]
 },
 "skin": "#a8917f",
 "flat": {
  "hair": "#4e4a47",
  "beard": "#857f78",
  "soles": "#231c18"
 },
 "rough": {
  "boots": 0.5,
  "apron": 0.8,
  "hair": 0.95,
  "beard": 0.95
 },
 "seam": 0.25,
 "move": {
  "cap": [
   0,
   -0.03,
   0
  ]
 },
 "size": {
  "beard": [
   0.94,
   0.85,
   0.9
  ]
 }
};
      return SKIN; })(),
    person: function () {
const PERSON = {
  name: 'Baker',
  height: 1.0,
  build: [1.28, 1.24],
  head: [1.06, 1.02, 1.02],
  skin: '#d9a58a',
  colors: { torso: '#b48a5a', sleeve: '#b48a5a', forearm: 'skin', legs: '#5b3d27', boots: '#2f2219', soles: '#1e1611' },
  parts: {
    shirt: { color: '#b48a5a', rough: 0.9 },
    roll: { color: '#c39a68', rough: 0.9 },
    trousers: { color: '#5b3d27', rough: 0.95 },
    apron: { color: '#ece2c8', rough: 0.95 },
    pocket: { color: '#c9b48a', pattern: { kind: 'stripes', color: '#a8463a', n: 4 } },
    hair: '#5a3a22',
    beard: '#5a3a22',
    cap: { color: '#f4f1ea', rough: 0.95 },
  },
  face(F) {
    F.blush('#d0503c', 0.42);
    F.air(518, 490, 45, 40, '#d06050', 0.22, 'color');
    F.beard('#5a3a22', 0.95, 'beard');
    F.brows('#4a2f1c', 0.95, 22);
    F.eyes('#5a4030', 0.6);
    F.lips('#b06a5a', 0.4);
    F.lines(0.4);
    F.underEye(0.2);
    F.stroke([[430, 560], [415, 620], [440, 680]], '#8a5040', 0.3, 7);
    F.stroke([[606, 560], [621, 620], [596, 680]], '#8a5040', 0.3, 7);
  },
  make(K) {
    K.shell('shirt', [[1.345, 0.062, 0.062, 0.066], [1.332, 0.118, 0.080, 0.090], [1.312, 0.146, 0.090, 0.100], [1.215, 0.148, 0.128, 0.108], [1.14, 0.142, 0.150, 0.104], [1.04, 0.152, 0.165, 0.104], [0.96, 0.162, 0.150, 0.118], [0.92, 0.168, 0.138, 0.124]], K.w.torso, { n: 28 });
    K.shell('trousers', [[0.99, 0.174, 0.166, 0.128], [0.93, 0.182, 0.158, 0.136], [0.87, 0.192, 0.145, 0.142], [0.80, 0.196, 0.132, 0.140], [0.74, 0.190, 0.120, 0.130]], K.w.skirt, { n: 28 });
    K.shell('apron', [[1.008, 0.184, 0.182, 0.136], [0.962, 0.190, 0.176, 0.144]], K.w.torso, { n: 28 });
    K.panel('apron', [[0.975, 0.198, 0.190], [0.90, 0.207, 0.178], [0.80, 0.214, 0.180], [0.68, 0.226, 0.198], [0.55, 0.236, 0.212], [0.45, 0.240, 0.220]], -62, 62, K.w.skirt, { n: 24 });
    K.panel('apron', [[1.25, 0.152, 0.124], [1.215, 0.156, 0.138], [1.14, 0.150, 0.160], [1.04, 0.160, 0.175], [1.012, 0.162, 0.170]], -40, 40, K.w.torso, { n: 16 });
    K.panel('pocket', [[0.88, 0.220, 0.190], [0.83, 0.223, 0.192], [0.78, 0.225, 0.194]], -25, 25, K.w.skirt, { n: 10 });
    K.tube('apron', [[0.092, 1.25, 0.114], [0.086, 1.318, 0.092], [0.066, 1.358, 0.010], [0.045, 1.368, -0.055], [0, 1.372, -0.072]], [0.007, 0.007, 0.007, 0.007, 0.007], K.w.torso);
    K.tube('apron', [[-0.092, 1.25, 0.114], [-0.086, 1.318, 0.092], [-0.066, 1.358, 0.010], [-0.045, 1.368, -0.055], [0, 1.372, -0.072]], [0.007, 0.007, 0.007, 0.007, 0.007], K.w.torso);
    K.ball('apron', [0, 0.985, -0.166], [0.032, 0.018, 0.012], K.w.bone('hips'));
    K.tube('apron', [[0.005, 0.98, -0.166], [0.015, 0.92, -0.168], [0.025, 0.86, -0.170]], [0.008, 0.010, 0.006], K.w.bone('hips'));
    K.shell('roll', [[1.13, 0.060, 0.058, 0.058, 0.195, -0.008], [1.105, 0.068, 0.066, 0.066, 0.202, -0.008], [1.075, 0.062, 0.060, 0.060, 0.210, -0.008]], K.w.bone('uarmL'), { n: 16 });
    K.shell('roll', [[1.13, 0.060, 0.058, 0.058, -0.195, -0.008], [1.105, 0.068, 0.066, 0.066, -0.202, -0.008], [1.075, 0.062, 0.060, 0.060, -0.210, -0.008]], K.w.bone('uarmR'), { n: 16 });
    K.hair('hair', 'short', { underHat: true });
    K.beard('beard', 'short');
    K.shell('cap', [[1.588, 0.096, 0.114, 0.110], [1.625, 0.094, 0.112, 0.108], [1.645, 0.106, 0.122, 0.120], [1.675, 0.112, 0.128, 0.126], [1.705, 0.102, 0.116, 0.114], [1.725, 0.072, 0.082, 0.082], [1.735, 0.020, 0.020, 0.020]], K.w.head, { n: 28, capLast: true });
  },
};
      return PERSON; } }
},
  // lighter builds of each set of shapes (people/kit/make_weights.py): parts left off and the share of each part kept
  weights: {"baker-fable": {"full": {"triangles": 10821}, "half": {"weight": {"drop": [], "keep": {"head": 0.85, "hands": 0.4, "boots": 0.22, "soles": 0.12, "torso": 0.25, "legs": 0.5, "sleeve": 0.7, "forearm": 0.7, "shirt": 0.7, "apron": 0.9, "tie": 0.3, "towel": 1.0, "roll": 0.6, "hair": 1.0, "beard": 0.9, "cap": 1.0, "capband": 1.0}, "rest": 0.6, "scale": 0.9964563592521561}, "triangles": 5506}, "quarter": {"weight": {"drop": [], "keep": {"head": 0.54, "hands": 0.2, "boots": 0.13, "soles": 0.05, "torso": 0.11, "legs": 0.33, "sleeve": 0.4, "forearm": 0.45, "shirt": 0.35, "apron": 0.6, "tie": 0.11, "towel": 0.6, "roll": 0.35, "hair": 0.8, "beard": 0.6, "cap": 0.8, "capband": 0.9}, "rest": 0.3, "scale": 0.8264950668043511}, "triangles": 2741}}, "baker-opus": {"full": {"triangles": 10909}, "half": {"weight": {"drop": [], "keep": {"head": 0.85, "hands": 0.4, "boots": 0.25, "soles": 0.12, "torso": 0.3, "legs": 0.6, "trousers": 0.7, "apron": 0.7, "shirt": 0.8, "sleeve": 0.7, "forearm": 0.8, "cap": 0.9, "hair": 0.9, "beard": 1.0, "roll": 0.6, "pocket": 0.6}, "rest": 0.6, "scale": 0.9246365914286316}, "triangles": 5451}, "quarter": {"weight": {"drop": [], "keep": {"head": 0.48, "hands": 0.2, "boots": 0.15, "soles": 0.07, "torso": 0.11, "legs": 0.3, "trousers": 0.38, "apron": 0.34, "shirt": 0.42, "sleeve": 0.33, "forearm": 0.45, "cap": 0.58, "hair": 0.55, "beard": 0.8, "roll": 0.28, "pocket": 0.25}, "rest": 0.3, "scale": 0.8579932460367892}, "triangles": 2701}}, "farmhand-fable": {"full": {"triangles": 11335}, "half": {"weight": {"drop": [], "keep": {"head": 0.85, "hands": 0.48, "boots": 0.28, "soles": 0.14, "torso": 0.3, "legs": 0.78, "sleeve": 0.78, "forearm": 0.78, "shirt": 0.58, "waistcoat": 0.68, "button": 0.18, "kerchief": 0.68, "patch": 0.28, "hair": 0.9, "straw": 0.95, "band": 0.8}, "rest": 0.6, "scale": 0.9246365914286316}, "triangles": 5618}, "quarter": {"weight": {"drop": [], "keep": {"head": 0.56, "hands": 0.2, "boots": 0.12, "soles": 0.06, "torso": 0.16, "legs": 0.45, "sleeve": 0.45, "forearm": 0.45, "shirt": 0.28, "waistcoat": 0.36, "button": 0.09, "kerchief": 0.38, "patch": 0.14, "hair": 0.6, "straw": 0.8, "band": 0.5}, "rest": 0.35, "scale": 0.8264950668043511}, "triangles": 2872}}, "farmhand-opus": {"full": {"triangles": 11117}, "half": {"weight": {"drop": ["torso"], "keep": {"head": 0.9, "hands": 0.45, "boots": 0.3, "soles": 0.15, "sleeve": 0.7, "forearm": 0.7, "legs": 0.7, "shirt": 0.75, "belt": 1.0, "vest": 0.7, "brass": 0.25, "kerchief": 0.6, "patch": 0.4, "hair": 1.0, "straw": 1.0, "band": 1.0}, "rest": 0.6, "scale": 0.9246365914286316}, "triangles": 5456}, "quarter": {"weight": {"drop": ["torso"], "keep": {"head": 0.43, "hands": 0.2, "boots": 0.15, "soles": 0.07, "sleeve": 0.4, "forearm": 0.4, "legs": 0.4, "shirt": 0.55, "belt": 0.8, "vest": 0.4, "brass": 0.08, "kerchief": 0.3, "patch": 0.2, "hair": 0.7, "straw": 0.65, "band": 1.0}, "rest": 0.35, "scale": 0.8906918381147568}, "triangles": 2784}}, "fortune-fable": {"full": {"triangles": 11133}, "half": {"weight": {"drop": ["legs"], "keep": {"head": 0.95, "hands": 0.45, "boots": 0.32, "soles": 0.12, "torso": 0.72, "sleeve": 0.8, "forearm": 0.8, "robe": 0.68, "hem": 1.0, "sash": 0.6, "hair": 0.7, "scarf": 0.68, "gold": 0.6}, "rest": 0.6, "scale": 0.8906918381147568}, "triangles": 5645}, "quarter": {"weight": {"drop": ["legs"], "keep": {"head": 0.68, "hands": 0.22, "boots": 0.16, "soles": 0.07, "torso": 0.38, "sleeve": 0.5, "forearm": 0.5, "robe": 0.38, "hem": 0.8, "sash": 0.3, "hair": 0.4, "scarf": 0.43, "gold": 0.3}, "rest": 0.35, "scale": 0.7387703469494953}, "triangles": 2819}}, "fortune-opus": {"full": {"triangles": 10885}, "half": {"weight": {"drop": ["legs"], "keep": {"head": 0.9, "hands": 0.5, "boots": 0.3, "soles": 0.15, "torso": 0.6, "sleeve": 0.7, "forearm": 0.7, "robe": 0.7, "sash": 0.6, "gold": 0.5, "hair": 0.6, "scarf": 0.6}, "rest": 0.6, "scale": 0.9246365914286316}, "triangles": 5363}, "quarter": {"weight": {"drop": ["legs"], "keep": {"head": 0.6, "hands": 0.22, "boots": 0.12, "soles": 0.08, "torso": 0.3, "sleeve": 0.4, "forearm": 0.4, "robe": 0.4, "sash": 0.35, "gold": 0.25, "hair": 0.35, "scarf": 0.35}, "rest": 0.35, "scale": 0.8264950668043511}, "triangles": 2672}}, "lampseller": {"full": {"triangles": 9769}, "half": {"weight": {"drop": ["legs"], "keep": {"head": 0.95, "hands": 0.4, "boots": 0.25, "soles": 0.15, "torso": 0.6, "sleeve": 0.9, "forearm": 0.9, "skirt": 1.0, "apron": 1.0, "belt": 1.0, "hair": 0.9, "kerchief": 0.9}, "rest": 0.6, "scale": 0.8906918381147568}, "triangles": 4863}, "quarter": {"weight": {"drop": ["legs"], "keep": {"head": 0.65, "hands": 0.18, "boots": 0.12, "soles": 0.06, "torso": 0.3, "sleeve": 0.6, "forearm": 0.6, "skirt": 0.8, "apron": 0.8, "belt": 0.7, "hair": 0.6, "kerchief": 0.6}, "rest": 0.4, "scale": 0.7387703469494953}, "triangles": 2483}}, "watchman-fable": {"full": {"triangles": 11093}, "half": {"weight": {"drop": ["torso"], "keep": {"head": 1.0, "hands": 0.5, "hat": 0.9, "band": 0.8, "coat": 0.8, "scarf": 0.7, "beard": 0.8, "hair": 0.7, "brass": 0.5, "belt": 0.7, "sleeve": 0.75, "forearm": 0.75, "legs": 0.5, "boots": 0.3, "boot": 0.5, "soles": 0.15}, "rest": 0.6, "scale": 0.8906918381147568}, "triangles": 5549}, "quarter": {"weight": {"drop": ["torso"], "keep": {"head": 0.6, "hands": 0.22, "hat": 0.7, "band": 0.6, "coat": 0.55, "scarf": 0.45, "beard": 0.5, "hair": 0.5, "brass": 0.25, "belt": 0.5, "sleeve": 0.5, "forearm": 0.5, "legs": 0.35, "boots": 0.15, "boot": 0.35, "soles": 0.07}, "rest": 0.4, "scale": 0.7387703469494953}, "triangles": 2762}}, "watchman-opus": {"full": {"triangles": 10817}, "half": {"weight": {"drop": [], "keep": {"head": 0.9, "hands": 0.45, "boots": 0.3, "soles": 0.15, "torso": 0.45, "sleeve": 0.8, "forearm": 0.8, "legs": 0.4, "coat": 0.8, "coatTrim": 0.8, "belt": 0.7, "brass": 0.4, "scarf": 0.8, "hat": 0.95, "hatband": 0.8, "hair": 0.8, "beard": 1.0}, "rest": 0.6, "scale": 0.8906918381147568}, "triangles": 5491}, "quarter": {"weight": {"drop": [], "keep": {"head": 0.52, "hands": 0.21, "boots": 0.23, "soles": 0.07, "torso": 0.2, "sleeve": 0.45, "forearm": 0.45, "legs": 0.22, "coat": 0.45, "coatTrim": 0.5, "belt": 0.4, "brass": 0.2, "scarf": 0.45, "hat": 0.75, "hatband": 0.5, "hair": 0.5, "beard": 0.7}, "rest": 0.4, "scale": 0.7669252891075882}, "triangles": 2725}}} };
