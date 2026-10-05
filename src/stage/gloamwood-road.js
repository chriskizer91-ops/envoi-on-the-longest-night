// The Gloamwood road (art/backdrops/battle-gloamwood-road.avif, art request 03, number 1): a cobbled clearing on the
// forest road out of Wickhollow, under old mossy oaks, with a moon-carved standing stone and the moonlit lake beyond.
// Band 1's wild fights on the world map, until nobody walked it (the wilderness scenes): now only a fight with no
// scene of its own (fights.js's default) uses it. The camera is the Thornwood bridge's (12 degree lens, 25 degree pitch, 54
// painting pixels a meter), which makes the two lanterns on their posts about 3 m tall. Both lanterns light the clearing.
// Nothing stands in front of it, so no cutouts are needed. `summon` is where Lunara rises: the moonlit water behind the
// clearing. The build inlines `image`.
window.SCENES = window.SCENES || {};
window.SCENES['gloamwood-road'] = {
  id: 'gloamwood-road',
  name: 'The Gloamwood road',
  image: "art/backdrops/battle-gloamwood-road.avif",
  width: 1448, height: 1086, fov: 12, pitch: 25, ppm: 54,
  lamps: [0, 1],
  summon: [990, 430], summonFrom: 'the moonlit water',
  envoiAt: [745, 740],
  layout: {
    lights: [
      { base: [123, 551], at: [167, 420], c: '#ffb45a', i: 1.6, d: 8 },
      { base: [1369, 580], at: [1321, 413], c: '#ffb45a', i: 1.6, d: 8 },
    ],
    occ: [],
    start: [725, 700],
  },
};
