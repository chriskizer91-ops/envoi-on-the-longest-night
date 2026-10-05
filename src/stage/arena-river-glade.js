// The arena at Wickhollow's river glade (art/arena/01-wickhollow-river-glade.avif: Chris's combat background 01, at his
// "Strong" squeeze, from envoi-game-pass-3/battle-backgrounds/img/01-q20.avif): band 1's wild fights, levels 1 to 5, in
// the Gloamwood round Wickhollow. Every arena place has this shape (src/fx/arena.js reads it):
// - `image`: the painting (the build puts it inside the page); the camera is the one the paintings were made for
//   (Colossus in the Meadow's: eye height, a 38 degree lens, the horizon 61% down), set 2 m up and 18 m back from
//   the middle of the fight;
// - `sky` and `ground`: the painting's skyline (where the sky ends) and the near edge of its open ground (where the
//   clearing begins), traced across it as [across, down] in fractions of the picture, so the live sheet over the
//   painting knows its sky, its far things and its ground;
// - `floor`: the live ground in front (the kind of tufts, their tint, how dense, how tall in the trampled clearing
//   and round it, what a blow throws up), `tree`: the live tree that frames the shot, `air`: mist, fireflies, snow,
//   frost glints, warm sparks, what a roar puts up (birds or bats) and what a heavy blow shakes down;
// - `summon` and `envoiAt`: where Lunara rises and where Envoi coils, in metres (x across; z toward the camera: a negative z is farther away);
//   `warm`: a box of the painting whose warm lights can pulse or go dark; `wild`: the chance of rain or a storm in a
//   wild fight here. Here: the glade's own grass and clover, an old oak on the right, mist off the river, fireflies.
window.ARENAS = window.ARENAS || {};
window.ARENAS['river-glade'] = {
  id: 'river-glade',
  name: 'Wickhollow’s river glade',
  image: "art/arena/01-wickhollow-river-glade.avif",
  camera: { h: 2, z: 18, pitch: 4.3, fov: 38 },
  sky: [[0, 0.314], [0.05, 0.295], [0.1, 0.286], [0.15, 0.271], [0.2, 0.295], [0.25, 0.286], [0.3, 0.26], [0.35, 0.243], [0.4, 0.222], [0.45, 0.203], [0.5, 0.228], [0.55, 0.257], [0.6, 0.295], [0.65, 0.333], [0.7, 0.349], [0.75, 0.359], [0.8, 0.376], [0.9, 0.371], [1, 0.381]],
  ground: [[0, 0.65], [1, 0.65]],
  floor: { kind: 'meadow', density: 1, debris: 'turf' },
  tree: { kind: 'oak', u: 0.99, v: 0.82 },
  air: { mist: 0.8, fireflies: 90, fly: 'bats', fall: 'leaf', leaf: [0.3, 0.42, 0.2] },
  wild: 0.25,
  summon: [0.4, -11], summonFrom: 'the moonlight',
  envoiAt: [0.6, -1.8],
};
