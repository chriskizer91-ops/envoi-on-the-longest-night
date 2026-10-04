// The arena at the northern crossroads (art/arena/13-northern-crossroads.avif: Chris's combat background 13, at his
// "Strong" squeeze): gate 15, Halcyon's ambush, on the old road north to the shipyard. The live ground is the frosted
// dead grass and moss of the cold moor; a dead tree frames the shot on the right; a little snow, frost glints, a cold
// wind, and a storm here is a blizzard (`frozen`); birds. The shape of a place is explained in arena-river-glade.js.
window.ARENAS = window.ARENAS || {};
window.ARENAS['crossroads'] = {
  id: 'crossroads',
  name: 'The northern crossroads',
  image: "art/arena/13-northern-crossroads.avif",
  camera: { h: 2, z: 18, pitch: 4.3, fov: 38 },
  sky: [[0, 0.243], [0.05, 0.233], [0.1, 0.267], [0.15, 0.267], [0.2, 0.276], [0.25, 0.267], [0.3, 0.257], [0.35, 0.248], [0.4, 0.222], [0.45, 0.21], [0.5, 0.233], [0.55, 0.271], [0.6, 0.305], [0.65, 0.328], [0.7, 0.343], [0.75, 0.357], [0.8, 0.376], [0.85, 0.39], [0.9, 0.386], [0.93, 0.33], [0.95, 0.343], [0.975, 0.324], [1, 0.333]],
  ground: [[0, 0.65], [1, 0.65]],
  frozen: true,
  floor: { kind: 'dead', density: 1, short: [0.08, 0.22], tall: [0.45, 0.9], cells: [0.12, 0.2, 0.18], debris: 'frost', bits: [0xc8c0b0, 0x9a8a6a, 0xb8c4d8, 0x6a5e48], dust: 0xb0aca0 },
  tree: { kind: 'dead', u: 0.99, v: 0.82, scale: 1.1 },
  night: { hs: '#7472a8', lc: '#c0c8ff' },
  air: { mist: 0.55, snow: 0.12, glints: 220, fly: 'birds', fall: '' },
  wild: 0.25,
  summon: [0.4, -11], summonFrom: 'the moonlight',
  envoiAt: [0.6, -1.8],
};
