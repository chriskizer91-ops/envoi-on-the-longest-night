// The arena on Frostmere's shore (art/arena/05-frostmere-lake.avif: Chris's combat background 05, at his "Strong"
// squeeze): band 4's wild fights, levels 16 to 20, and the Bramble Colossus, by the frozen lake below the Ironspire
// Peaks. The live ground is frosted meadow grass, rime catching the moon; a snow-laden pine frames the shot on the
// right; snow falls lightly, and a storm here is a blizzard (`frozen`), not rain. The shape of a place is explained in
// arena-river-glade.js.
window.ARENAS = window.ARENAS || {};
window.ARENAS['frostmere'] = {
  id: 'frostmere',
  name: 'Frostmere’s shore',
  image: "art/arena/05-frostmere-lake.avif",
  camera: { h: 2, z: 18, pitch: 4.3, fov: 38 },
  sky: [[0, 0.295], [0.05, 0.273], [0.1, 0.295], [0.15, 0.29], [0.2, 0.267], [0.25, 0.295], [0.3, 0.269], [0.35, 0.257], [0.4, 0.222], [0.45, 0.205], [0.5, 0.224], [0.55, 0.257], [0.6, 0.295], [0.65, 0.319], [0.7, 0.357], [0.75, 0.349], [0.8, 0.376], [0.85, 0.371], [0.9, 0.386], [0.95, 0.395], [1, 0.4]],
  ground: [[0, 0.654], [1, 0.654]],
  frozen: true,
  floor: { kind: 'frost', density: 1, short: [0.07, 0.2], tall: [0.5, 1.05], debris: 'frost', bits: [0xc8d4e8, 0x6e8a6a, 0xa8b4c4, 0x5e6a56], dust: 0xc4ccdc },
  tree: { kind: 'pine', u: 1.16, v: 0.8, near: 1.05, snow: true, tint: 0xa8b4c0 },
  night: { hs: '#7a78b0', lc: '#c4ccff' },
  air: { mist: 0.6, snow: 0.3, glints: 320, fly: 'birds', fall: 'snow' },
  wild: 0.25,
  summon: [0.4, -11], summonFrom: 'the moonlight',
  envoiAt: [0.6, -1.8],
};
