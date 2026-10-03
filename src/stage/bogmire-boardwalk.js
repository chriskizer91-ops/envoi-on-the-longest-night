// Bogmire's dark boardwalk (art/backdrops/battle-bogmire-boardwalk.avif, art request 03, number 3): the town square on
// stilts where the great wraith waits (plan step 14). The camera is matched to the painting: the platform is a square
// about 20 m a side seen corner-on, which puts the pitch at about 26 degrees; the lamp posts (about 2.5 m) give 52
// painting pixels a meter; the lens is the Night square's long 12 degrees. Two lanterns still burn at the platform's
// near corners; every window is dark, because the great wraith has eaten the town's lamplight. `windows` are the
// painted windows that light again when it is beaten. `summon` is where Lunara rises: the black water behind the
// platform's far edge. The format is the Night square's (src/stage/night-square.js); the build inlines `image`.
window.SCENES = window.SCENES || {};
window.SCENES['bogmire-boardwalk'] = {
  id: 'bogmire-boardwalk',
  name: 'Bogmire, the dark boardwalk',
  image: "art/backdrops/battle-bogmire-boardwalk.avif",
  width: 1448, height: 1086, fov: 12, pitch: 26, ppm: 52,
  lamps: [0, 1],
  summon: [760, 378], summonFrom: 'the black water',
  windows: [[335, 275], [172, 409], [564, 244], [760, 160], [790, 160], [940, 180], [975, 178], [1027, 172], [1140, 315], [1223, 320], [1405, 395]],
  layout: {
    lights: [
      { base: [100, 712], at: [102, 628], c: '#ffb45a', i: 1.6, d: 7.5 },
      { base: [1243, 815], at: [1243, 735], c: '#ffb45a', i: 1.6, d: 7.5 },
    ],
    occ: [
      { name: 'lamp_left', base: [[58, 712], [116, 712]], polys: [
        [[58, 712], [58, 672], [69, 668], [69, 576], [78, 571], [87, 576], [87, 668], [114, 672], [116, 712]],
        [[87, 586], [104, 592], [108, 602], [115, 610], [115, 642], [106, 652], [96, 652], [90, 642], [90, 610], [87, 604]],
      ] },
      { name: 'lamp_right', base: [[1239, 815], [1295, 815]], polys: [
        [[1239, 815], [1239, 772], [1258, 766], [1260, 668], [1270, 662], [1281, 668], [1281, 766], [1294, 772], [1295, 815]],
        [[1260, 688], [1242, 696], [1236, 704], [1229, 712], [1229, 748], [1238, 758], [1250, 758], [1257, 748], [1257, 712], [1252, 704], [1260, 700]],
      ] },
    ],
    start: [720, 760],
  },
};
