// The Thornwood bridge (art/backdrops/battle-thornwood-bridge.avif, art request 03, number 2): the paved landing before
// an old stone bridge on the way out of the Thornwood, walled in by black thorns and red berries. It is where the Bramble
// Horror waits (Chris's bench, reference/demos/bramble-horror-bench.html). The camera is the Night square's (12 degree
// lens, 25 degree pitch, 54 painting pixels a meter): the lamp post at the bridge's foot comes out about 3 m tall. Its
// lantern and the one hung under the arch light the landing. The thorns in the near corners stay clear of the fighters,
// so no cutouts are needed. `summon` is where Lunara rises: the moonlit river beyond the landing. The build inlines `image`.
window.SCENES = window.SCENES || {};
window.SCENES['thornwood-bridge'] = {
  id: 'thornwood-bridge',
  name: 'The Thornwood bridge',
  image: "art/backdrops/battle-thornwood-bridge.avif",
  width: 1448, height: 1086, fov: 12, pitch: 25, ppm: 54,
  lamps: [0, 1],
  summon: [700, 470], summonFrom: 'the river',
  envoiAt: [740, 560],
  layout: {
    lights: [
      { base: [587, 367], at: [580, 215], c: '#ffb45a', i: 1.8, d: 9 },
      { base: [932, 330], at: [932, 253], c: '#ffb45a', i: 1.2, d: 6 },
    ],
    occ: [],
    start: [720, 650],
  },
};
