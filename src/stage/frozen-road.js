// The frozen road (art/backdrops/battle-frozen-road.webp, art request 03, number 7): the snowbound paved road up through
// the northeast peaks to Misthollow, beside a frozen river and its old stone bridge, under snow-heavy pines. Band 4's wild
// fights. The camera is the Thornwood bridge's (12 degree lens, 25 degree pitch, 54 painting pixels a meter). The warm
// lantern on the left and the cold blue one on the right light the road. Nothing stands in front of it, so no cutouts
// are needed. `summon` is where Lunara rises: the frozen river. The build inlines `image`.
window.SCENES = window.SCENES || {};
window.SCENES['frozen-road'] = {
  id: 'frozen-road',
  name: 'The frozen road',
  image: "art/backdrops/battle-frozen-road.webp",
  width: 1448, height: 1086, fov: 12, pitch: 25, ppm: 54,
  lamps: [0, 1],
  summon: [650, 420], summonFrom: 'the frozen river',
  envoiAt: [745, 740],
  layout: {
    lights: [
      { base: [123, 464], at: [145, 326], c: '#ffb45a', i: 1.5, d: 8 },
      { base: [1384, 681], at: [1355, 522], c: '#9fc8ff', i: 1.4, d: 7 },
    ],
    occ: [],
    start: [725, 700],
  },
};
