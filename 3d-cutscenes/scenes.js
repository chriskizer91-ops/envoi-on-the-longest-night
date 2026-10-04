// scenes.js: the story scenes this test plays, as data; player.js plays them. One scene so far: the prologue, staged in
// Io's cottage garden (garden.js). Its words are the game's own (src/game/script.js, scenes.prologue), which are still
// placeholders for Chris's lore conversation; only the staging is new. The opening shot is the one art request 07 asks
// for in its first still: a pale moon in a sky with no stars, and a small figure in a magenta hat at a cottage door.
//
// Units are meters and seconds. The garden: the cottage's front wall at z -7 with the door in its middle, the flagstone
// path running +z to the gate between two lantern pillars at z 4.9, the lantern on its post by the path at x 1.25, z 1,
// the moon high in the -x, -z quarter (behind the cottage, seen from the gate).
//
// A scene: { id, title, where, cast: { id: { model, at: [x, z], yaw } }, shots: [...] }. A shot:
//   d        seconds
//   cam      { from, to: [x, y, z], at, at2: a point [x, y, z], 'moon' (far off toward it), an anchor 'actor.part' (head,
//              eye, chest, ...) or ['actor.part', dx, dy, dz] a little way off one; rel: 'actor' (from and to are in the
//              actor's own frame, riding with her: +z ahead, +x her left, y above her feet), fov: [from, to],
//              ease: 'l' | 'i' | 'o' | 'io', shake: handheld drift 0 to 1 }
//   focus    meters, a point or an anchor;  ap: aperture (blur);  exp: exposure
//   fade     [[t, 0 to 1], ...];  title: [t0, t1]
//   do       [[t, actor, 'walk', [[x, z], ...], speed] | [t, actor, 'play', move] | [t, actor, 'guard', on]]
//   say      [[t0, t1, who or null (narration), words, { hold }]]: hold waits at t1 for a tap, as the game's box does
//   sound    [[t, night sound, gain, { pan, far }]]: the field study's night sounds, made in code
//   lamps    true: the far lamps by the bridge flicker through this shot
function makeScenes() {
  'use strict';
  const prologue = {
    id: 'prologue', title: 'The longest night is coming', where: 'Wickhollow',
    cast: { io: { model: 'io', at: [-0.05, -6.45], yaw: 0 } },
    shots: [
      // the moon in a sky with no stars; down to the cottage, and Io small at her door
      { id: 'moon', d: 11, cam: { from: [3.4, 2.1, 13.5], to: [2.7, 2.35, 11.6], at: 'moon', at2: [0.15, 2.25, -6.5], fov: [40, 36], ease: 'io', shake: .06 },
        focus: 18, ap: .12, exp: 1.4, fade: [[0, 0], [3, 1]], title: [1.2, 6.4], sound: [[0.2, 'wind', .5]],
        say: [[6.2, 10.9, null, 'Wickhollow. The longest night of the year is three nights off.']] },
      // up past the gate pillar into the empty sky
      { id: 'sky', d: 8.5, cam: { from: [2.6, 0.7, 5.6], to: [2.45, 0.8, 5.2], at: [-10, 9, -18], at2: [-10.5, 10, -18.5], fov: [46, 43], ease: 'io', shake: .08 },
        focus: 26, ap: .08, exp: 1.5, sound: [[1.6, 'tawny', .9, { pan: -.55, far: .7 }]],
        say: [[0.6, 8, null, 'Every year the moon has come back from it. This year, the stars have already gone out.']] },
      // Io at her door, the warm room behind her
      { id: 'door', d: 10.5, cam: { from: [1.9, 1.95, 0.7], to: [0.8, 1.62, -2.6], at: [0, 2.3, -7], at2: [-0.05, 1.3, -6.45], fov: [40, 30], ease: 'io', shake: .07 },
        focus: 'io.head', ap: .55, exp: 1.5,
        say: [[0.6, 10.1, null, 'In the cottage below the square, Io, the village witch, keeps a bundle of letters to the dead that she has never burned.']] },
      // down the path to her lantern
      { id: 'walk', d: 8, cam: { from: [0.45, 1.05, 3.9], to: [0.4, 1.2, 3.1], at: 'io.chest', fov: [30, 28], ease: 'o', shake: .1 },
        focus: 'io.chest', ap: .9, exp: 1.5, do: [[0.2, 'io', 'walk', [[0, -3.4], [0.05, -0.1]], 1.05]] },
      // her face in the lantern light, close and nearly level with her eyes, so her face shows under her hat's brim
      { id: 'face', d: 5.5, cam: { rel: 'io', from: [0.36, 1.43, 1.05], to: [0.28, 1.42, 0.88], at: ['io.head', 0, 0.005, 0], fov: [26, 25], ease: 'io', shake: .08 },
        focus: 'io.eye', ap: 1.1, exp: 1.5 },
      // over her shoulder: the lamps by the bridge, far off, flickering
      { id: 'lamps', d: 9, lamps: true, cam: { rel: 'io', from: [-0.72, 1.86, -2.05], to: [-0.62, 1.82, -1.82], at: [17.5, 3.1, 34], fov: [26, 24], ease: 'io', shake: .07 },
        focus: [17.5, 3.1, 34], ap: .45, exp: 1.95,
        say: [[3.4, 8.6, 'io', 'The lamps by the bridge are flickering. I should go up to the square.', { hold: true }]] },
      // out through the gate, and up toward the square
      { id: 'gate', d: 10, cam: { from: [-1.0, 1.45, -2.4], to: [-0.7, 3.5, -3.9], at: 'io.chest', fov: [32, 36], ease: 'io', shake: .06 },
        focus: 'io.chest', ap: .4, exp: 1.5, fade: [[6.6, 1], [9.7, 0]], do: [[0.5, 'io', 'walk', [[0, 2.6], [0, 4.9], [0.35, 9.6]], 1.1]] }
    ]
  };
  for (const sc of [prologue]) {
    let t = 0; for (const s of sc.shots) { s.start = t; t += s.d; } sc.total = t;
  }
  return { prologue };
}
