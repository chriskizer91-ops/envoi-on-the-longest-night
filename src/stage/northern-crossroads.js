// The northern crossroads (art/backdrops/battle-northern-crossroads.avif, art request 03, number 6): a ruined crossroads
// in the empty northern wilds, where Halcyon ambushes the party on the way to the shipyard (plan step 16). The camera is
// matched to the paved circle where the four roads meet: its rings come out about 0.39 times as tall as they are wide,
// which puts the pitch at about 23 degrees; the well and its lantern post give about 58 painting pixels a meter; the lens
// is the Night square's long 12 degrees. The lantern on the well's post and the ember left in the toppled waymarker
// light the ground; the road lantern far up on the right is too far off to reach the fight. Nothing stands in front of
// the circle, so no cutouts are needed. `summon` is where Lunara rises: the moonlight behind the circle. `envoiAt` is
// where Envoi folds in, between the party and the knight. The format is the Night square's; the build inlines `image`.
window.SCENES = window.SCENES || {};
window.SCENES['northern-crossroads'] = {
  id: 'northern-crossroads',
  name: 'The northern crossroads',
  image: "art/backdrops/battle-northern-crossroads.avif",
  width: 1448, height: 1086, fov: 12, pitch: 23, ppm: 58,
  lamps: [0, 1],
  summon: [700, 470], summonFrom: 'the moonlight',
  envoiAt: [745, 560],
  layout: {
    lights: [
      { base: [1357, 775], at: [1357, 687], c: '#ffb45a', i: 1.7, d: 8 },
      { base: [242, 432], at: [238, 416], c: '#ff8a3a', i: 0.9, d: 4.5 },
      { base: [1388, 228], at: [1385, 160], c: '#ffb45a', i: 1.2, d: 6 },
    ],
    occ: [],
    start: [735, 600],
  },
};
