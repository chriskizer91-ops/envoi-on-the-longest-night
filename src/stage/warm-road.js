// The Warm Road (art/backdrops/battle-warm-road.webp, art request 03, number 4): a crossing of the old roads along the
// Ember Line in the western riverlands, its cobbles veined with sunstone light, a waymarker with a glowing ember crystal,
// and a watchtower on the hill beyond. Band 2's wild fights. The camera is the Thornwood bridge's (12 degree lens, 25
// degree pitch, 54 painting pixels a meter). The two lanterns and the waymarker's crystal light the road. Nothing stands
// in front of it, so no cutouts are needed. `summon` is where Lunara rises: the moonlight over the road. The build
// inlines `image`.
window.SCENES = window.SCENES || {};
window.SCENES['warm-road'] = {
  id: 'warm-road',
  name: 'The Warm Road',
  image: "art/backdrops/battle-warm-road.webp",
  width: 1448, height: 1086, fov: 12, pitch: 25, ppm: 54,
  lamps: [0, 1, 2],
  summon: [760, 470], summonFrom: 'the moonlight',
  envoiAt: [745, 740],
  layout: {
    lights: [
      { base: [109, 551], at: [145, 464], c: '#ffb45a', i: 1.5, d: 8 },
      { base: [453, 435], at: [453, 297], c: '#ffb050', i: 1.4, d: 7 },
      { base: [1362, 333], at: [1333, 268], c: '#ffb45a', i: 1.2, d: 6 },
    ],
    occ: [],
    start: [725, 700],
  },
};
