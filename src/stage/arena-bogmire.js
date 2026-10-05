// The arena at Bogmire (art/arena/03-bogmire-lantern-banks.avif: Chris's combat background 03, at his "Strong"
// squeeze): gate 5, the great wraith, at Bogmire's dark heart. The painting's grassy bank is covered by live black water
// that mirrors the painting, and the fight is on a boardwalk on stilts over it (`water.deck`: its slabs [x0, x1, z0, z1]
// in metres, a square on stilts and a walk out to it), with reeds and rushes along the water's edges (`water.edges`:
// how far from the fight's middle they grow, across, how far back, and how far from the camera). Two lanterns on posts
// still burn low at the platform's near corners. Every lamp and window of the town in the painting is dark while the
// great wraith has its stolen lamplight (`warm`: where they are), and they light again as it flies home (`windows`: the
// lamps it flies to). Mist lies thick on the fen; marsh lights drift over the water; bats. The shape of a place is
// explained in arena-river-glade.js.
window.ARENAS = window.ARENAS || {};
window.ARENAS['bogmire'] = {
  id: 'bogmire',
  name: 'Bogmire’s boardwalk',
  image: "art/arena/03-bogmire-lantern-banks.avif",
  camera: { h: 2, z: 18, pitch: 4.3, fov: 38 },
  sky: [[0, 0.319], [0.05, 0.314], [0.1, 0.295], [0.15, 0.295], [0.2, 0.319], [0.25, 0.3], [0.3, 0.328], [0.35, 0.328], [0.4, 0.314], [0.45, 0.319], [0.5, 0.333], [0.55, 0.326], [0.6, 0.343], [0.65, 0.346], [0.7, 0.352], [0.75, 0.352], [0.8, 0.347], [0.85, 0.357], [0.89, 0.321], [0.95, 0.352], [1, 0.355]],
  ground: [[0, 0.65], [1, 0.65]],
  floor: { kind: 'reeds', where: 'edges', density: 0.9, short: [0.9, 1.4], tall: [1.4, 2.3], cells: [0.12, 0.2, 0.2], debris: 'wood', bits: [0x5a4a40, 0x6a5a4c, 0x4a3c34, 0x3c3028], dust: 0x7a7470, chip: 0.7 },
  water: {
    y: -0.34, color: '#06050b',
    deck: [[-5.5, 7.5, -10.5, 3.0], [-4.3, -1.9, 3.0, 13]],
    edges: [11, -16, 34],
  },
  lanterns: [[-5.3, 2.8], [7.3, 2.8]],
  night: { hg: '#262a26', hi: 1.0 },
  air: { mist: 1.2, fireflies: 70, ffColor: [0.55, 1, 0.55], fly: 'bats', fall: '' },
  warm: { box: [0.42, 0.28, 1, 0.64] },
  windows: [[0.48, 0.46], [0.6, 0.445], [0.63, 0.44], [0.69, 0.455], [0.75, 0.46], [0.8, 0.42], [0.84, 0.405], [0.87, 0.43], [0.9, 0.44], [0.85, 0.46], [0.93, 0.47]],
  summon: [0.4, -12.5], summonFrom: 'the black water',
  envoiAt: [0.6, -1.8],
};
