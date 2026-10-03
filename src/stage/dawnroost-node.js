// Dawnroost's living node (art/backdrops/battle-dawnroost-node.webp, art request 03, number 5): the courtyard of the
// Warden waystation, with the living sunstone node burning at the back (plan step 15). The camera is the one Bogmire's
// painting matched (26 degree pitch, the long 12 degree lens, 52 pixels a meter): the courtyard is drawn the same way,
// and its crates and doors come out at their true size. The node lights the courtyard like a hearth; two braziers
// burn on the near corner towers, clear of the fighters, so no cutouts are needed. `summon` is where Lunara rises,
// `envoiAt` where Envoi is made after the fight, in front of the node. The build inlines `image`.
window.SCENES = window.SCENES || {};
window.SCENES['dawnroost-node'] = {
  id: 'dawnroost-node',
  name: "Dawnroost's living node",
  image: "art/backdrops/battle-dawnroost-node.webp",
  width: 1448, height: 1086, fov: 12, pitch: 26, ppm: 52,
  lamps: [0, 1, 2],
  summon: [640, 520], summonFrom: 'the moonlight',
  envoiAt: [830, 545],
  layout: {
    lights: [
      { base: [870, 425], at: [870, 300], c: '#ffb050', i: 2.6, d: 14 },
      { base: [160, 800], at: [157, 625], c: '#ffa040', i: 1.5, d: 8 },
      { base: [1283, 880], at: [1285, 712], c: '#ffa040', i: 1.5, d: 8 },
    ],
    occ: [],
    start: [700, 650],
  },
};
