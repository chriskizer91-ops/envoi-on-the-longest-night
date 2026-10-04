// scene.js: the finale's opening: the place, the cast and the shots, as data; player.js plays it.
// The longest night, at Misthollow's dead Moonwell: the camera comes down out of a sky with no stars, past the moon going
// out, over the dark town, onto the court where Noctara the Starless waits at the well with Halcyon at her side; Io and
// Sol come up the stair; it ends where the last fight begins, everyone standing as the fight stands them and seen through
// the fight's own camera.
//
// Units are meters and seconds. The place is laid in the battle's own coordinates (moonwell.js): the court's middle is the
// battle's origin, north is -z, the well at (0, -5.5). The fight's numbers come from the game: the dead Moonwell's painting
// and camera (src/stage/dead-moonwell.js) and where the fight stands Io, Sol, Halcyon and Noctara on it (src/game/fights.js,
// kind 'finale'), turned toward each other as the battle turns them (src/battle/screen.js, the looks' yawBias).
//
// A shot: { id, d (seconds), cam, focus, ap, exp, bars, fade, slow, shadow, do, sound, say }
//   cam    { from, to, at, at2, fov: [from, to], ease, shake, roll } | { rel: someone, from, to, ... } (points round her,
//          [to her left, up, ahead]) | { spline: name } (one continuous move across shots, keyed in the film's own time:
//          splines below) | { battle: true, from, at, fov, glide }: points are [x, y, z], 'moon', 'actor.part' (an
//          anchor: head, chest, eye, blade, crown, flame, ...) or ['actor.part', dx, dy, dz]
//   focus  meters, a point or an anchor, or keys [[t, mark], ...]; ap: aperture (blur), or keys; exp: exposure, or keys
//   bars   the letterbox, 1 (2.39 to 1) to 0 (open), or keys; fade: [[t, 0 to 1], ...]
//   do     [t, who, 'walk', [[x, z], ...], speed] | [t, who, 'face', yaw or a point or someone] | [t, who, 'play', move]
//          | [t, who, 'guard', on] | [t, who, 'state', key, [[dt, v], ...]] | [t, who, 'reset'] | [t, 'snd', 'wind', v]
//   sound  [t, 'night', id, gain, { pan, far, secs }] (a bed's level, or one of the place's own sounds) | [t, 'sfx', id,
//          gain, { at }] (an effect, placed where something is)
//   say    [[t0, t1, key], ...]: a line from words.js; it may run on past the shot's end
// Defines cutsceneScene() only.
function cutsceneScene() {
  'use strict';
  // the fight's painting camera, and where it stands everyone (painting pixels)
  const B = { scene: 'dead-moonwell', width: 1448, height: 1086, fov: 12, pitch: 26, ppm: 54, io: [560, 762], sol: [630, 812], halcyon: [750, 690], noctara: [828, 642] };
  const ground = (() => {
    const A = B.width / B.height, P = B.pitch * Math.PI / 180, D = (B.height / 2) / (B.ppm * Math.tan(B.fov / 2 * Math.PI / 180));
    const cam = new THREE.PerspectiveCamera(B.fov, A, D * .6, D * 1.6); cam.position.set(0, D * Math.sin(P), D * Math.cos(P)); cam.lookAt(0, 0, 0); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
    const rc = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit = new THREE.Vector3();
    return (p) => { rc.setFromCamera(new THREE.Vector2(p[0] / B.width * 2 - 1, 1 - p[1] / B.height * 2), cam); rc.ray.intersectPlane(plane, hit); return [hit.x, hit.z]; };
  })();
  const IO = ground(B.io), SOL = ground(B.sol), HAL = ground(B.halcyon), NOC = ground(B.noctara);
  const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2], HEROES = mid(IO, SOL), FOES = mid(HAL, NOC);
  const face = (p, q) => Math.atan2(q[0] - p[0], q[1] - p[1]);
  // their facing in the fight: each side toward the other's middle, turned a little toward the camera (yawBias)
  const YAW = { io: face(IO, FOES) - .38, sol: face(SOL, FOES) - .3, halcyon: face(HAL, HEROES) + .15, noctara: face(NOC, HEROES) + .25 };
  // a point d meters from p, toward a compass bearing (degrees east of north) and a height (degrees up)
  const aim = (p, az, el, d) => { const a = az * Math.PI / 180, e = el * Math.PI / 180; return [p[0] + Math.sin(a) * Math.cos(e) * d, p[1] + Math.sin(e) * d, p[2] - Math.cos(a) * Math.cos(e) * d]; };
  // the moon (moonwell.js): 18 degrees west of north, 28 up; looking at Noctara along a bearing 20 degrees east of it puts
  // it up and to the left of her head, clear of the iron crescent over the well
  const MOON = { az: -18, el: 28 }, away = [Math.sin(MOON.az * Math.PI / 180) * -1, Math.cos(MOON.az * Math.PI / 180)];
  const NOCCAM = [2.15, 1.85].map((d, i) => { const b = (MOON.az + 20) * Math.PI / 180; return [NOC[0] - Math.sin(b) * d, i ? 1.1 : 1.0, NOC[1] + Math.cos(b) * d]; });
  // Io and Sol: up from the town's first terrace, up the stair, to its head, then to where the fight stands them
  const HEAD = { io: [-1.75, 14.4], sol: [-.45, 15.3] };

  // the one move down from the sky: the moon, a tilt down onto the peaks; down among Misthollow's towers and up its
  // street, terrace by terrace; over the last roofs, and down onto the court
  const D1 = [-14, 70, 300], D2 = [-13.2, 68.6, 291], D3 = [-11, 60, 266], D4 = [-4, 22, 205], D5 = [-1, -8, 150];
  const descent = [
    [0, D1, aim(D1, MOON.az, MOON.el, 300), 24],
    [4.5, D2, aim(D2, -17, 24.5, 300), 25],
    [12, D3, aim(D3, -6, 3.5, 320), 32],
    [17, D4, aim(D4, -3, -8, 200), 36],
    [21.5, D5, aim(D5, 0, 2, 200), 38],
    [26, [0, 6, 76], [0, 10, 0], 36],
    [30.5, [.3, 21, 40], [.3, 0, -1], 32],
    [36, [1.3, 8.4, 18.8], [.8, 1.3, 2.2], 30]
  ];

  const shots = [
    // 1. a sky with no stars, and the moon with a black disc crossing it; a slow tilt down onto the Ironspire peaks
    { id: 'moon', d: 12, cam: { spline: 'descent' }, focus: 600, ap: .04, exp: 1.5, fade: [[0, 0], [3.2, 1]],
      say: [[1.8, 10.8, 'goingOut']],
      sound: [[0, 'night', 'wind', 1.3, { secs: 2 }], [0, 'night', 'hush', .05, { secs: 1 }], [0, 'night', 'drone', 1, { secs: 4 }]] },
    // 2. still one move: gliding down over Misthollow's dark pale towers, mist rolling through its streets, not a window
    //    lit, snow drifting past the lens
    { id: 'misthollow', d: 14, cam: { spline: 'descent' }, focus: 120, ap: .08, exp: 1.5,
      sound: [[2, 'night', 'flap', .5, { pan: -.5, far: .6 }], [9, 'night', 'wind', 1, { secs: 4 }]] },
    // 3. descending onto the round court from high above: the black well at its heart, and two figures beside it
    { id: 'court', d: 10, cam: { spline: 'descent' }, focus: [[0, 'noctara.chest']], ap: [[0, .1], [7, .26]], exp: 1.48,
      do: [[6.7, 'io', 'walk', [[-1.45, 34], [-1.4, 26.8], [-1.6, 18], HEAD.io], 1.2], [6.7, 'sol', 'walk', [[-.25, 34.8], [-.2, 27], [-.35, 18.8], HEAD.sol], 1.2]],
      sound: [[1, 'night', 'wind', .75, { secs: 4 }], [2, 'night', 'hush', 1, { secs: 4 }], [5, 'night', 'fire', .35, { secs: 3 }]] },
    // 4. Halcyon, low and close: her blade, its cold blue edge, and up to her cold blue eyes
    { id: 'halcyon', d: 6, cam: { rel: 'halcyon', from: [-.62, 1.0, 1.85], to: [-.36, 1.66, 1.08], at: ['halcyon.chest', 0, .12, 0], at2: 'halcyon.eye', fov: [36, 26], ease: 'io', shake: .06 },
      focus: [[0, 'halcyon.blade'], [3.2, 'halcyon.eye']], ap: .9, exp: [[0, 1.75], [4, 1.55]], shadow: [HAL[0], 0, HAL[1]],
      sound: [[0, 'night', 'wind', .55, { secs: 1.5 }], [.6, 'night', 'crack', .7, { pan: .45 }]] },
    // 5. Noctara: her edge light against the dark, the night in her lining, her crown; she opens her arms and lifts her
    //    face, the eclipse over her
    { id: 'noctara', d: 8, cam: { from: NOCCAM[0], to: NOCCAM[1], at: ['noctara.head', 0, .02, 0], at2: ['noctara.head', 0, .1, 0], fov: [48, 44], ease: 'io', shake: .07 },
      focus: 'noctara.head', ap: .25, exp: 1.5, shadow: [NOC[0], 0, NOC[1]],
      do: [[.4, 'noctara', 'play', 'blackout']],
      say: [[1, 7.6, 'waits']],
      sound: [[1.2, 'sfx', 'rite', 1, { at: 'noctara.chest' }], [1.5, 'night', 'hush', .55, { secs: 3 }]] },
    // 6. Io and Sol, from behind them at the head of the stair: they come up into the court and stop; Sol's blade lights
    //    amber, and Io's witchfire burns up in her hand
    { id: 'arrive', d: 8, cam: { from: [-3.05, -1.85, 22.2], to: [-2.85, 1.05, 18.5], at: ['io.chest', .4, .2, 0], at2: [-.2, 1.5, 4.5], fov: [38, 34], ease: 'io', shake: .07 },
      focus: [[0, 'io.head'], [4, 'sol.chest'], [5.4, 'io.flame']], ap: .32, exp: 1.48, shadow: [-.8, 0, 12],
      do: [[4.1, 'sol', 'state', 'heat', [[0, 0], [1.6, .82]]], [5.3, 'io', 'play', 'cast']],
      sound: [[0, 'night', 'fire', .7, { secs: 2 }], [4.1, 'sfx', 'blade', 1, { at: 'sol.chest' }]] },
    // 7. across the court Halcyon slides into Warden's Vow, the stance she taught Sol, as Io and Sol walk up to her
    { id: 'vow', d: 3.4, cam: { from: [1.85, 1.2, 11.4], to: [1.7, 1.22, 11.0], at: ['halcyon.chest', 0, -.15, 0], fov: [22, 20], ease: 'io', shake: .05 },
      focus: 'halcyon.chest', ap: .7, exp: 1.5, shadow: [0, 0, 8],
      do: [[0, 'io', 'walk', [IO], 1.2], [0, 'sol', 'walk', [SOL], 1.05], [.35, 'halcyon', 'play', 'vowStance']],
      sound: [[.35, 'sfx', 'vow', 1, { at: 'halcyon.chest' }]] },
    // 7b. Sol knows it: the camera walks with her, close on her face, as she slows and stops and raises her guard
    { id: 'knows', d: 2.6, cam: { rel: 'sol', from: [.38, 1.6, 1.32], to: [.3, 1.6, 1.12], at: 'sol.head', fov: [24, 22], ease: 'io', shake: .05 },
      focus: 'sol.head', ap: 1, exp: 1.5, shadow: [-1.4, 0, 10],
      do: [[1.4, 'sol', 'guard', true]] },
    // 8. the four, wide and low across the frost: Io and Sol on one side, Noctara and Halcyon on the other, the dead well
    //    between them and the eclipse above; the camera settles into the battle's own framing and the letterbox opens
    { id: 'four', d: 8, cam: { battle: true, from: [-.5, 1.5, 17.6], at: [-.3, 3.1, 0], fov: [50, 50], glide: [.9, 6.1] },
      focus: [[0, [-.5, 1.4, 6.8]]], ap: [[0, .4], [5, 0]], exp: 1.48, bars: [[0, 1], [5.2, 0]], shadow: [-.5, 0, 6],
      do: [[0, 'halcyon', 'reset'], [.4, 'sol', 'guard', false], [.6, 'sol', 'state', 'heat', [[0, .82], [3.4, 0]]], [.2, 'io', 'face', YAW.io, 2.4], [.2, 'sol', 'face', YAW.sol, 2.4]],
      say: [[1.6, 8.2, 'begins']],
      sound: [[.6, 'night', 'bell', 1, { far: .85, pan: -.1 }], [1, 'night', 'wind', .6, { secs: 3 }]] }
  ];

  return {
    id: 'finale-opening', title: "The finale's opening", alt: 'The dead Moonwell above Misthollow on the longest night, the moon going out over the peaks',
    // (the eclipse closes from .38 to .66 of the way across the moon over the whole scene)
    place: { cold: true, wind: { x: .5, z: .2, level: .6 }, eclipse: [.38, .66], seconds: shots.reduce((n, s) => n + s.d, 0) },
    cast: {
      noctara: { model: 'noctara', at: NOC, yaw: YAW.noctara },
      halcyon: { model: 'halcyon', at: HAL, yaw: YAW.halcyon, breathAt: .8 },
      io: { model: 'io', at: [-1.5, 40.5], yaw: Math.PI, breathAt: .4 },
      sol: { model: 'sol', at: [-.25, 41.3], yaw: Math.PI, breathAt: 1.9, state: { heat: 0 } }
    },
    splines: { descent },
    shots,
    // where everyone stands when it hands over, also when it is skipped: as the fight stands them (the fight starts Sol's
    // Heat at nothing, src/battle/screen.js resetHeroes)
    handover: {
      noctara: { at: NOC, yaw: YAW.noctara },
      halcyon: { at: HAL, yaw: YAW.halcyon },
      io: { at: IO, yaw: YAW.io },
      sol: { at: SOL, yaw: YAW.sol, state: { heat: 0 } }
    },
    // the fight's framing: its painting camera, the battle's origin in the place (the court's middle), and everyone standing
    // in it (their heights are the fight's: src/game/fights.js, FOE_LOOK and the heroes)
    battle: {
      scene: B.scene, width: B.width, height: B.height, fov: B.fov, pitch: B.pitch, ppm: B.ppm, at: [0, 0, 0],
      field: [{ x: IO[0], z: IO[1], tall: 2.1 }, { x: SOL[0], z: SOL[1], tall: 1.9 }, { x: HAL[0], z: HAL[1], tall: 2.11 }, { x: NOC[0], z: NOC[1], tall: 2.5 }]
    },
    // (behind the start screen: the eclipse over the peaks)
    idleAt: 6
  };
}
