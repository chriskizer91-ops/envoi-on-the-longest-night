// The dead Moonwell (art/backdrops/battle-dead-moonwell.avif, art request 03, number 8): the square of Misthollow, where
// Noctara waits with Halcyon at her side for the finale (plan step 17). The great round well stands dark at the back, the
// moon is going out behind the towers, and two braziers burn low at the plaza's near corners. The camera is the one
// Bogmire's painting matched (26 degree pitch, the long 12 degree lens) at 54 painting pixels a meter, which makes the
// braziers about 2.6 m and the well about 4 m across. The braziers stand clear of the fighters, so no cutouts are needed.
// `summon` is where Lunara rises: the dead Moonwell itself. `envoiAt` is where Envoi folds in, between the party and the
// foes. `sky` is the band of painted sky where the stars come back at the end. The build inlines `image`.
window.SCENES = window.SCENES || {};
window.SCENES['dead-moonwell'] = {
  id: 'dead-moonwell',
  name: 'The dead Moonwell',
  image: "art/backdrops/battle-dead-moonwell.avif",
  width: 1448, height: 1086, fov: 12, pitch: 26, ppm: 54,
  lamps: [0, 1],
  summon: [720, 420], summonFrom: 'the dead Moonwell',
  envoiAt: [700, 640],
  sky: [0, 0, 1448, 330],
  layout: {
    lights: [
      { base: [173, 887], at: [171, 757], c: '#ffa040', i: 1.7, d: 9 },
      { base: [1277, 887], at: [1277, 757], c: '#ffa040', i: 1.7, d: 9 },
    ],
    occ: [],
    start: [720, 650],
  },
};
