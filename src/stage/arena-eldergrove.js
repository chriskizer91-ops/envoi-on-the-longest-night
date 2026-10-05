// The arena in Eldergrove's clearing (art/arena/02-eldergrove-clearing.avif: Chris's combat background 02, at his
// "Strong" squeeze): band 3's wild fights, levels 11 to 15, the Bramble Horror among them, in the first-age wood of the
// northwest forests. The live ground is the wood's: grass, ferns, clover and moss; a great old oak frames the shot on
// the right; mist lies in the clearing and fireflies drift over it; the embers glowing in the ancient trees' hollows
// pulse. The shape of a place is explained in arena-river-glade.js.
window.ARENAS = window.ARENAS || {};
window.ARENAS['eldergrove'] = {
  id: 'eldergrove',
  name: 'Eldergrove’s clearing',
  image: "art/arena/02-eldergrove-clearing.avif",
  camera: { h: 2, z: 18, pitch: 4.3, fov: 38 },
  sky: [[0, 0.262], [0.05, 0.267], [0.1, 0.276], [0.15, 0.286], [0.2, 0.3], [0.25, 0.29], [0.275, 0.276], [0.3, 0.29], [0.35, 0.281], [0.4, 0.238], [0.45, 0.212], [0.5, 0.238], [0.55, 0.281], [0.6, 0.305], [0.65, 0.328], [0.7, 0.349], [0.75, 0.338], [0.8, 0.3], [0.85, 0.281], [0.9, 0.3], [0.95, 0.333], [1, 0.347]],
  ground: [[0, 0.674], [1, 0.674]],
  floor: { kind: 'wood', density: 1, cells: [0.1, 0.06, 0.14], debris: 'turf' },
  tree: { kind: 'oak', u: 1.01, v: 0.82, scale: 1.2 },
  air: { mist: 0.9, fireflies: 130, fly: 'bats', fall: 'leaf', leaf: [0.28, 0.4, 0.2] },
  warm: { box: [0.2, 0.36, 1, 0.66], pulse: 0.14, speed: 0.9 },
  wild: 0.25,
  summon: [0.4, -11], summonFrom: 'the moonlight',
  envoiAt: [0.6, -1.8],
};
