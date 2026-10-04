// motion.js: the short film, "In motion": about a minute and a half with no words. The Bramble Colossus as the battle
// shows it (standing tall, at the battle's level 10: darker, longer thorns, veins that glow at rest) rises, creeps across
// the meadow, opens, and shows three of its moves (Thorn Lance in slow motion, Maelstrom, Hammerfall), then stands
// against the moon. Data only, in the same shape as film.js (page.js plays either); cam.rel puts a shot's points in the
// Bramble's own frame (ahead is +z), so the camera rides along with it as it walks.
function makeFilm() {
  'use strict';
  // where it stands: [film seconds, x, z, heading]. It faces north-west, toward the moon so its front is lit, creeps about
  // 12 m that way, then turns a little further toward the moon, to its prey.
  const H0 = -2.3, H1 = -2.95, D = 12;
  const route = [[0, 0, 0, H0], [16.5, 0, 0, H0], [35, Math.sin(H0) * D, Math.cos(H0) * D, H0], [39.5, Math.sin(H0) * D, Math.cos(H0) * D, H1]];
  // a point ahead of where it stops, a little to its right, for the camera it walks toward
  const ahead = (f, r, y) => [Math.sin(H0) * (D + f) + Math.cos(H0) * r, y, Math.cos(H0) * (D + f) - Math.sin(H0) * r];
  const chapters = [
    {
      id: 'wake', title: 'It wakes', kicker: '', setup: { pose: 'base', frost: 1 },
      shots: [
        { d: 6, cam: { rel: true, from: [-1.6, 2.7, 9.6], to: [-1.1, 2.5, 8.9], at: 'bunch3', fov: [22, 20], ease: 'io', shake: .12 }, focus: 'bunch3', ap: 2.4, exp: 1.45, bars: .1,
          fade: [[0, 0], [2.5, 1]], act: [[2.4, 'taste']], night: [[1, 'ice', { pan: .5, far: .65 }]] },
        { d: 9, cam: { rel: true, from: [-14, 1.4, 16], to: [-11.5, 1.6, 13.5], at: [0, 3.4, 0], fov: [34, 32], ease: 'o', shake: .1 }, focus: 'chest', ap: .4, exp: 1.4, bars: .1,
          title: [.6, 5.2], act: [[5.4, 'alert']] }
      ]
    },
    {
      id: 'move', title: 'On the move', kicker: '', quiet: true, setup: { pose: 'base', frost: 1 },
      shots: [
        // alongside it, low in the grass, riding with it
        { d: 8, cam: { rel: true, from: [-15, 1.5, -2], to: [-15, 1.6, 2], at: [0, 3, 1], fov: [34, 34], ease: 'l', shake: .14 }, focus: [0, 2, 1], ap: .45, exp: 1.45, bars: .08 },
        // ahead of it, low, as it comes on
        { d: 6, cam: { from: ahead(13, 3.5, 1.2), to: ahead(12.2, 3.3, 1.15), at: ahead(0, 0, 3.8), fov: [38, 36], ease: 'l', shake: .1 }, focus: 'chest', ap: .6, exp: 1.45, bars: .08 },
        // from high in front: its legs stepping, the green ring coming with it
        { d: 5, cam: { rel: true, from: [-7, 10, 14], to: [-5, 12.5, 11], at: [0, 1, -3], fov: [44, 44], ease: 'io' }, focus: 'chest', ap: .15, exp: 1.35, bars: .08 },
        // low by a front leg as it stops and turns
        { d: 6.5, cam: { rel: true, from: [-6, .9, 9.5], to: [-5.4, .95, 8.8], at: [-2.4, .9, 4], fov: [36, 34], ease: 'io', shake: .12 }, focus: [-2.6, .5, 4.3], ap: 1, exp: 1.45, bars: .08 }
      ]
    },
    {
      id: 'hunt', title: 'The hunt', kicker: '', quiet: true, setup: { pose: 'base', frost: 1 },
      shots: [
        { d: 6.5, cam: { rel: true, from: [-3.4, 6.5, 10], to: [-2.8, 6.7, 8.6], at: 'heart', fov: [30, 26], ease: 'io', shake: .1 }, focus: 'heart', ap: .8, exp: 1.3, bars: .08, act: [[.5, 'bloom']] },
        { d: 8, cam: { rel: true, from: [-13, 2.2, 5], to: [-12.4, 2.4, 6], at: [0, 4, 4.5], fov: [40, 40], ease: 'l', shake: .1 }, focus: [0, 3, 5], ap: .4, exp: 1.35, bars: .08,
          act: [[1.6, 'lance']], slow: [[1.8, 1], [2.1, .2], [4.2, .2], [4.6, 1]] },
        { d: 7, cam: { rel: true, from: [-2, 1.3, 17], to: [-4.5, 1.6, 15.5], at: [0, 3, 0], fov: [44, 44], ease: 'l', shake: .15 }, focus: 'chest', ap: .3, exp: 1.35, bars: .08, act: [[.7, 'whirl']] },
        { d: 8, cam: { rel: true, from: [-19, 1.8, 10], to: [-19.5, 2, 9], at: [0, 5.6, 3.5], fov: [50, 50], ease: 'l', shake: .1 }, focus: [0, 2, 7], ap: .3, exp: 1.35, bars: .08,
          act: [[1, 'slam']], slow: [[2, 1], [2.25, .35], [3.1, .35], [3.4, 1]] }
      ]
    },
    {
      id: 'night', title: 'The long night', kicker: '', setup: { pose: 'base', frost: 1 },
      shots: [
        { d: 6, cam: { rel: true, orbit: { c: [0, 3.6, 0], r: 18, h: -.6, a0: -.4, a1: -.95 }, fov: [34, 34], ease: 'l', shake: .08 }, focus: 'chest', ap: .6, exp: 1.4, bars: .08,
          act: [[.6, 'alert'], [3.6, 'taste']], env: { open: [[0, 0], [1.5, 0], [3.5, .55]] }, night: [[3.5, 'owl', { pan: -.6, far: .75 }]] },
        // behind it, low, looking past it to the moon
        { d: 10, cam: { rel: true, from: [2.5, 1, -15], to: [6, 3, -32], at: [-1.5, 5.5, 0], fov: [42, 44], ease: 'io' }, focus: 'chest', ap: .1, exp: 1.25, bars: .1, env: { open: [[0, .55]] },
          fade: [[6, 1], [10, 0]], end: [7, 10], night: [[1, 'wolves', { pan: .5, far: .95 }]] }
      ]
    }
  ];
  const cards = {};
  const sheet = {
    name: 'Bramble Colossus', rows: [
      ['Height', '7.5 m to the top of the bud'], ['Across', '11 m at rest; its arms reach 9 m'], ['Where', 'the meadows below the frozen pass, by Frostmere'],
      ['Moves', 'on six rooted legs, a few metres a minute when it hunts; its roots tear free as each leg lifts'],
      ['Strikes', 'Thorn Lance, Maelstrom, Hammerfall, and more in Explore'], ['Fears', 'fire']]
  };
  let total = 0; for (const c of chapters) { c.start = total; for (const s of c.shots) { s.start = total; total += s.d; } c.end = total; }
  return { chapters, cards, sheet, total, route, wordless: true, level: 10 };
}
