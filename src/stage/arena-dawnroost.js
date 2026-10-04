// The arena in Dawnroost's yard (art/arena/12-dawnroost-living-node.avif: Chris's combat background 12, at his
// "Strong" squeeze): gate 10, the three wraiths drawn to the living node. The ground is the painting's own packed earth
// and old flagstones, with live weeds in their gaps; there is no tree, it is a yard. The node at the back of the yard
// burns and pulses (`warm`), throws its warm light on the fighters from behind the wraiths (`lights`: `dir` is where a
// light comes from), and sends warm sparks drifting over the yard; birds. A blow throws up stone chips and dust. The
// shape of a place is explained in arena-river-glade.js.
window.ARENAS = window.ARENAS || {};
window.ARENAS['dawnroost'] = {
  id: 'dawnroost',
  name: 'Dawnroost’s living node',
  image: "art/arena/12-dawnroost-living-node.avif",
  camera: { h: 2, z: 18, pitch: 4.3, fov: 38 },
  sky: [[0, 0.3], [0.05, 0.295], [0.1, 0.3], [0.15, 0.286], [0.2, 0.295], [0.25, 0.29], [0.3, 0.269], [0.35, 0.252], [0.4, 0.222], [0.45, 0.205], [0.5, 0.219], [0.55, 0.252], [0.6, 0.286], [0.65, 0.319], [0.7, 0.352], [0.75, 0.366], [0.8, 0.376], [0.85, 0.386], [0.875, 0.328], [0.9, 0.31], [0.925, 0.33], [0.95, 0.376], [1, 0.386]],
  ground: [[0, 0.656], [0.4, 0.66], [0.6, 0.662], [1, 0.656]],
  floor: { kind: 'weeds', density: 0.2, short: [0.06, 0.16], tall: [0.12, 0.3], cells: [0.14, 0.18, 0.24], debris: 'stone', bits: [0x6a6670, 0x7a7680, 0x585460, 0x5e5a4e], dust: 0x8a8274, chip: 0.6 },
  lights: [{ dir: [0.3, 0.35, -1], c: '#ffb050', i: 0.85 }],
  night: { fill: '#ffd0a8' },
  air: { mist: 0.3, sparks: 26, fly: 'birds', fall: '' },
  warm: { box: [0.5, 0.42, 0.7, 0.66], pulse: 0.2, speed: 1.3 },
  summon: [0.4, -11], summonFrom: 'the moonlight',
  envoiAt: [0.6, -1.8],
};
