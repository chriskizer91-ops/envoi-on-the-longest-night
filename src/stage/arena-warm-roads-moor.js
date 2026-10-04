// The arena on the Warm Roads' moor (art/arena/11-warm-roads-moor.avif: Chris's combat background 11, at his "Strong"
// squeeze): band 2's wild fights, levels 6 to 10, beside the old paved road of the Ember Line in the western riverlands.
// The live ground is the moor's: short moor grass, heather in bloom and gorse; a birch frames the shot on the right;
// warm sparks drift off the Ember Line, whose veins in the road and whose waymarker pulse faintly; birds roost on the
// moor. The shape of a place is explained in arena-river-glade.js.
window.ARENAS = window.ARENAS || {};
window.ARENAS['warm-roads-moor'] = {
  id: 'warm-roads-moor',
  name: 'The Warm Roads’ moor',
  image: "art/arena/11-warm-roads-moor.avif",
  camera: { h: 2, z: 18, pitch: 4.3, fov: 38 },
  sky: [[0, 0.295], [0.05, 0.29], [0.1, 0.286], [0.15, 0.281], [0.2, 0.295], [0.25, 0.286], [0.3, 0.267], [0.35, 0.243], [0.4, 0.222], [0.45, 0.207], [0.5, 0.222], [0.55, 0.252], [0.6, 0.29], [0.65, 0.319], [0.7, 0.333], [0.75, 0.349], [0.8, 0.355], [0.85, 0.352], [0.9, 0.362], [0.95, 0.371], [1, 0.376]],
  ground: [[0, 0.656], [1, 0.656]],
  floor: { kind: 'moor', density: 0.95, short: [0.08, 0.22], tall: [0.45, 0.95], cells: [0.06, 0.22, 0.2], debris: 'turf', bits: [0x76704a, 0x8a5a9a, 0xa09858, 0x5e4e36] },
  tree: { kind: 'birch', u: 0.98, v: 0.82 },
  air: { mist: 0.45, fireflies: 30, sparks: 10, fly: 'birds', fall: 'leaf', leaf: [0.5, 0.5, 0.2] },
  warm: { box: [0.58, 0.45, 0.96, 0.68], pulse: 0.16, speed: 1.1 },
  wild: 0.25,
  summon: [0.4, -11], summonFrom: 'the moonlight',
  envoiAt: [0.6, -1.8],
};
