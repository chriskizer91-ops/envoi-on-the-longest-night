// The arena on the dead Moonwell's court (art/arena/14-dead-moonwell.avif: Chris's combat background 14, at his
// "Strong" squeeze): the finale, Noctara and Halcyon, in Misthollow's great plaza on the longest night. The ground is
// the painting's own frosted flagstones, with a few rimed weeds in their cracks and frost glinting on them; no tree, no
// warmth: freezing mist, snow falling, bats. A blow throws up ice and stone chips. The stars come back over its sky at
// the ending (the battle screen draws them above the traced skyline). The shape of a place is explained in
// arena-river-glade.js.
window.ARENAS = window.ARENAS || {};
window.ARENAS['dead-moonwell'] = {
  id: 'dead-moonwell',
  name: 'The dead Moonwell',
  image: "art/arena/14-dead-moonwell.avif",
  camera: { h: 2, z: 18, pitch: 4.3, fov: 38 },
  sky: [[0, 0.328], [0.05, 0.286], [0.075, 0.271], [0.1, 0.324], [0.125, 0.355], [0.15, 0.29], [0.2, 0.295], [0.25, 0.3], [0.3, 0.267], [0.35, 0.252], [0.4, 0.222], [0.45, 0.205], [0.5, 0.224], [0.55, 0.257], [0.6, 0.295], [0.65, 0.319], [0.7, 0.346], [0.75, 0.357], [0.8, 0.371], [0.85, 0.319], [0.875, 0.29], [0.9, 0.352], [0.95, 0.386], [1, 0.395]],
  ground: [[0, 0.645], [1, 0.645]],
  frozen: true,
  floor: { kind: 'rime', density: 0.07, short: [0.05, 0.14], tall: [0.08, 0.2], cells: [0.2, 0.2, 0.2], debris: 'ice', bits: [0xc8d4e8, 0x9aa4b4, 0x7a7680, 0xe0e8f4], dust: 0xc0c8d8, chip: 0.6 },
  night: { hs: '#787cb4', hg: '#2a2a3a', lc: '#c8d2ff', li: 0.7, fill: '#d0d8ff', fi: 0.36 },
  air: { mist: 1.0, snow: 0.45, glints: 520, fly: 'bats', fall: '' },
  summon: [0.4, -14], summonFrom: 'the dead Moonwell',
  envoiAt: [0.6, -1.8],
  stars: true,
};
