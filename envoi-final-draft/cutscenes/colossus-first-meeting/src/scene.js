// scene.js: the Colossus, first met: the place, the cast and the shots, as data; player.js plays it.
// The first time the party meets the Bramble Colossus in the wilds, on the frozen road by Frostmere: it ends where its
// fight begins, everyone standing as the fight stands them and seen through the fight's own camera.
//
// Units are meters and seconds. The Colossus stands at the middle of the meadow (the field study's place for it), facing
// the party; the moon is high in the north-north-west, so the party walks north toward it. The fight's numbers come from
// the game: the frozen road's painting and camera (src/stage/frozen-road.js) and where the fight stands Io, Sol and the
// Colossus on it (src/game/fights.js, COLOSSUS_AT), about 8.5 m apart. The place is laid so that the Colossus is at its
// middle, so the battle's own origin is a little to the south-west of it (battle.at).
//
// A shot: { id, d (seconds), cam, focus, ap, exp, bars, fade, slow, shadow, do, sound, say }
//   cam    { from, to, at, at2, fov: [from, to], ease, shake, roll } or { orbit } or { battle: true, from, at, fov, glide }:
//          points are [x, y, z], 'moon', 'actor.part' (an anchor: head, chest, eye, bud, heart, crown, taste, ...) or
//          ['actor.part', dx, dy, dz]; a camera point given by an anchor is fixed where it is when the shot begins
//   focus  meters, a point or an anchor; ap: aperture (blur), or keys [[t, v], ...]; exp: exposure, or keys
//   bars   the letterbox, 1 (2.39 to 1) to 0 (open), or keys; fade: [[t, 0 to 1], ...]; slow: [[t, timescale], ...]
//   do     [t, who, 'walk', [[x, z], ...], speed] | [t, who, 'face', yaw or a point or someone] | [t, who, 'play', move]
//          | [t, who, 'guard', on] | [t, who, 'state', key, [[dt, v], ...]] | [t, who, 'taste', 'toward:someone']
//          | [t, who, 'target', someone] | [t, 'snd', 'quiet' | 'hush' | 'wind', value]
//   sound  [t, 'night', id, gain, { pan, far }] (the meadow's night) | [t, 'sfx', id, gain, { at }] (the scene's own)
//   say    [[t0, t1, key], ...]: a line from words.js (key.n for its nth part); it may run on past the shot's end
// Defines cutsceneScene() only.
function cutsceneScene() {
  'use strict';
  // the fight's painting camera, and where it stands everyone (painting pixels)
  const B = { scene: 'frozen-road', width: 1448, height: 1086, fov: 12, pitch: 25, ppm: 54, io: [638, 704], sol: [712, 738], slot: [974, 557] };
  const ground = (() => {
    const A = B.width / B.height, P = B.pitch * Math.PI / 180, D = (B.height / 2) / (B.ppm * Math.tan(B.fov / 2 * Math.PI / 180));
    const cam = new THREE.PerspectiveCamera(B.fov, A, D * .6, D * 1.6); cam.position.set(0, D * Math.sin(P), D * Math.cos(P)); cam.lookAt(0, 0, 0); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
    const rc = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit = new THREE.Vector3();
    return (p) => { rc.setFromCamera(new THREE.Vector2(p[0] / B.width * 2 - 1, 1 - p[1] / B.height * 2), cam); rc.ray.intersectPlane(plane, hit); return [hit.x, hit.z]; };
  })();
  const C0 = ground(B.slot), I0 = ground(B.io), S0 = ground(B.sol);
  const IO = [I0[0] - C0[0], I0[1] - C0[1]], SOL = [S0[0] - C0[0], S0[1] - C0[1]], MID = [(IO[0] + SOL[0]) / 2, (IO[1] + SOL[1]) / 2];
  const face = (p, q) => Math.atan2(q[0] - p[0], q[1] - p[1]);
  // their facing in the fight: toward each other, turned a little toward the camera (the fight's yawBias)
  const YAW = { colossus: face([0, 0], MID), io: face(IO, [0, 0]) - .38, sol: face(SOL, [0, 0]) - .3 };
  // Sol's guard step carries her about 0.57 m toward it, so she stops that far short of where the fight stands her
  const toC = face(SOL, [0, 0]), SOL_STOP = [SOL[0] - Math.sin(toC) * .57, SOL[1] - Math.cos(toC) * .57];

  const shots = [
    // 1. the frozen road under the moon, no stars: Io and Sol small, walking north through the frost, their breath steaming
    { id: 'road', d: 7.5, cam: { from: [-1.6, 5.8, 45], to: [-4.4, 3.1, 33.5], at: 'moon', at2: [-8.2, .6, -2], fov: [40, 34], ease: 'io', shake: .05 },
      focus: 'io.chest', ap: .14, exp: 1.42, fade: [[0, 0], [2.6, 1]],
      do: [[0, 'io', 'walk', [[-7.15, 19], [-6.7, 11], [-6.35, 7.4], IO], 1.12], [0, 'sol', 'walk', [[-5.75, 19.6], [-5.35, 12], SOL_STOP], 1.12]],
      sound: [[.6, 'night', 'owl', .9, { pan: -.6, far: .8 }]] },
    // 2. low through the frosted grass toward a hill of brambles beside the road: green where nothing else is, the snow
    //    melted round it, its berries glinting. From its far side, with the moon behind the camera: the two of them small on
    //    the road beyond, coming up toward it
    { id: 'thicket', d: 6, cam: { from: [-7.6, 1.05, -31.5], to: [-6.5, 1.0, -26.6], at: [-.6, 1.5, .4], at2: [-1, 1.4, .8], fov: [30, 28], ease: 'l', shake: .1 },
      focus: 'colossus.crown', ap: .32, exp: 1.5,
      say: [[.5, 8.4, 'thicket']], sound: [[1.4, 'night', 'ice', .7, { pan: .6, far: .7 }]] },
    // 3. close, as they would see it: one cane lifts and tastes the air, toward them; its heartbeat glows down the canes
    { id: 'taste', d: 4.4, cam: { from: [6.9, 1.45, 13.4], to: [6.1, 1.4, 12.5], at: [-3.4, 1.25, 6.4], at2: [-3.2, 1.3, 6.2], fov: [29, 27], ease: 'io', shake: .1 },
      focus: [-1, 1.4, 5], ap: .38, exp: 1.5, shadow: [-2.5, 0, 6],
      do: [[.3, 'colossus', 'taste', 6], [2.1, 'colossus', 'taste', 5]] },
    // 4. Io stops; Sol puts out an arm and draws her sword, its edge lighting amber; then the ground starts to shake
    { id: 'stop', d: 6.1, cam: { from: [-3.45, 1.32, 3.75], to: [-3.7, 1.28, 4.15], at: [-5.55, 1.22, 6.75], at2: [-5.6, 1.25, 6.6], fov: [34, 31], ease: 'io', shake: .12 },
      focus: [[0, 'sol.head'], [3.6, 'io.head']], ap: .9, exp: 1.45,
      do: [[.3, 'io', 'face', [0, 0], 1.4], [.9, 'sol', 'face', [0, 0], 2], [1.1, 'sol', 'play', 'kestrel'], [2.7, 'sol', 'play', 'guardStep'], [2.7, 'sol', 'guard', true],
        [2.6, 'sol', 'state', 'heat', [[0, 0], [1.4, .78]]], [4.7, 'io', 'play', 'block'], [5.85, 'colossus', 'play', 'appear'], [5.85, 'snd', 'quiet', true]],
      sound: [[2.65, 'sfx', 'blade', 1, { at: 'sol.chest' }], [4.5, 'sfx', 'rumble', 1]] },
    // 5. the ground splits round it; it heaves itself up out of the earth, every cane rising; the camera pulls back and up
    //    over the two of them to take in all 7.5 m of it
    { id: 'rises', d: 9, cam: { from: [-3.1, 1.55, 6.1], to: [-11.4, 3.5, 15.6], at: [-.3, .2, .3], at2: [-.4, 3.4, .2], fov: [44, 38], ease: 'io', shake: .16 },
      focus: [[0, [0, .3, 0]], [2.6, 'colossus.chest']], ap: .3, exp: 1.42, slow: [[0, .66], [5.4, .66], [6.6, 1]],
      do: [[1.2, 'colossus', 'target', 'sol'], [.4, 'io', 'guard', true]],
      say: [[1.2, 6.8, 'rises.0']] },
    // 6. the bud parts on its glowing heart, steam breathing out of it into the cold; the moon behind it
    { id: 'heart', d: 6, cam: { from: [5.6, 2.7, 11.6], to: [4.7, 3.2, 10.4], at: 'colossus.bud', at2: 'colossus.heart', fov: [27, 23], ease: 'io', shake: .08 },
      focus: 'colossus.heart', ap: 1.1, exp: 1.38,
      do: [[.25, 'colossus', 'play', 'alert'], [.6, 'colossus', 'state', 'open', [[0, 0], [2.4, .9]]]],
      say: [[.5, 5.8, 'rises.1']] },
    // 7. the camera settles behind the party into the battle's framing: Io and Sol lower left, the Colossus upper right;
    //    the letterbox opens; hold, then hand over
    { id: 'handover', d: 6, cam: { battle: true, from: [-9.5, 6.2, 21], at: [-2.6, 2.4, 1.6], fov: [30, 30], glide: [0, 4.6] },
      focus: 'sol.chest', ap: [[0, .45], [4, 0]], exp: 1.4, bars: [[0, 1], [4.2, 0]], shadow: [-3, 0, 3],
      do: [[.1, 'colossus', 'state', 'open', [[0, .9], [2.6, 0]]], [.2, 'colossus', 'target', 'io'], [.3, 'io', 'guard', false], [.3, 'io', 'face', YAW.io, 2.2], [.6, 'sol', 'guard', false], [.6, 'sol', 'face', YAW.sol, 2.2],
        [.8, 'sol', 'state', 'heat', [[0, .78], [3, .15]]], [1, 'snd', 'wind', .42]] }
  ];

  return {
    id: 'colossus-first-meeting', title: 'The Colossus, first met', alt: 'The frozen road by Frostmere at night, and a thicket beside it',
    place: {
      cold: true, frost: 1, wind: { x: .6, z: .2, level: .5 },
      // the frozen road, up from the south and bending north toward the pass, past the thicket's west side
      road: { width: 4.6, points: [[2, 150], [-1, 96], [-3.6, 52], [-5.6, 25], [-6.85, 8], [-7.95, -4], [-9.7, -18], [-13, -40], [-19, -75], [-28, -120], [-42, -180], [-60, -250]] }
    },
    cast: {
      colossus: { model: 'colossus', at: [0, 0], yaw: YAW.colossus, level: 18, pose: 'rest' },
      io: { model: 'io', at: [-7.55, 27], yaw: Math.PI, breathAt: .4 },
      sol: { model: 'sol', at: [-6.05, 27.7], yaw: Math.PI, breathAt: 1.9, state: { heat: 0 } }
    },
    shots,
    // where everyone stands when it hands over, also when it is skipped: as the fight stands them
    handover: {
      // (in the fight, while it waits, it is turned on Io: src/battle/screen.js aims every foe at her by default)
      colossus: { pose: 'base', state: { open: 0 }, target: 'io' },
      io: { at: IO, yaw: YAW.io },
      sol: { at: SOL, yaw: YAW.sol, state: { heat: .15 } }
    },
    // the fight's framing: its painting camera, the battle's origin in the place, and everyone standing in it (their
    // heights and the Colossus's width are the fight's: src/game/fights.js FOE_LOOK and hero)
    battle: {
      scene: B.scene, width: B.width, height: B.height, fov: B.fov, pitch: B.pitch, ppm: B.ppm, at: [-C0[0], 0, -C0[1]],
      field: [{ x: I0[0], z: I0[1], tall: 2.1 }, { x: S0[0], z: S0[1], tall: 1.9 }, { x: C0[0], z: C0[1], tall: 7.8, halfW: 5.4 }]
    },
    idleAt: 4.2
  };
}
