// film.js: the field study's film: its chapters, shots, moves and words. Data only; page.js plays it.
// Units are meters and seconds. The colossus stands at the origin facing +z (south); the moon is high in the north-west,
// so shots from the south see it against the moon, and shots from the north see it moonlit.
// A shot: { d: seconds, cam: { from, to, at, at2 (or anchor names: 'heart', 'bud', 'hit', 'chest', 'crown', 'fruit',
//   'impact'), fov: [from, to], ease, shake (handheld, 0 to 1), orbit: { c, r, h, a0, a1 } }, focus: meters or an anchor,
//   ap: aperture, exp: exposure, slow: [[t, timescale], ...], act: [[t, move], ...], env: { xray, frost, open, wrath:
//   [[t, value], ...] }, say: [[t0, t1, words], ...], card: [t0, t1, card id], sound: [[t, name, gain], ...],
//   bars: letterbox (0 to .12), fade: [[t, 0 to 1], ...] }
// The narration is a proposal for Chris: what the field study says about the creature is drawn from the lore so far and
// the handoff's Thornheart idea, and is not canon until he says so (README.md lists what is new).
function makeFilm() {
  'use strict';
  const chapters = [
    {
      id: 'title', title: 'Frostmere', kicker: 'Below the frozen pass', setup: { pose: 'rest', frost: 1, xray: 0, open: 0 },
      shots: [
        { d: 15, cam: { from: [160, 60, -40], to: [40, 22, 70], at: [40, 20, -400], at2: [0, 4, 0], fov: [42, 36], ease: 'io' }, focus: 400, ap: .05, exp: 1.2, bars: .1,
          fade: [[0, 0], [3, 1]], title: [2.2, 12.5], sound: [[0, 'wind', .6]] }
      ]
    },
    {
      id: 'hill', title: 'A hill of brambles', kicker: 'Chapter one', setup: { pose: 'rest', frost: 1, xray: 0, open: 0 },
      shots: [
        { d: 13, cam: { from: [9, 2.2, 46], to: [4, 2.6, 24], at: [0, 2.2, 0], fov: [34, 30], ease: 'o', shake: .15 }, focus: 'crown', ap: .35, exp: 1.25,
          say: [[1, 12.5, 'Below the frozen pass the nights grow longer every year, and the cold comes a little further down from the peaks.']] },
        { d: 12, cam: { from: [-5, 1.05, 15], to: [-2, 1.15, 12.5], at: [0, 3.5, 0], fov: [40, 38], ease: 'io', shake: .12 }, focus: 'chest', ap: .9, exp: 1.3,
          say: [[.5, 11.5, 'Most things here are asleep, or gone. But in one meadow above Frostmere something has been growing for more than a hundred years.']] },
        { d: 13, cam: { orbit: { c: [0, 1.8, 0], r: 14, h: 2.6, a0: 2.4, a1: 1.6 }, fov: [30, 30], ease: 'l', shake: .08 }, focus: 'crown', ap: .7, exp: 1.3,
          say: [[.5, 6.5, 'From a distance it looks like a hill of brambles.'], [7, 12.5, 'It is one plant, and it is awake.']], act: [[8.5, 'taste']] }
      ]
    },
    {
      id: 'heart', title: 'A warm heart', kicker: 'Chapter two', setup: { pose: 'rest', frost: 1, xray: 0, open: 0 },
      shots: [
        { d: 12, cam: { from: [-8.4, 3.2, 9.6], to: [-6.2, 2.7, 7.6], at: 'heart', fov: [30, 26], ease: 'io', shake: .1 }, focus: 'heart', ap: 1.2, exp: 1.85,
          say: [[.5, 11.5, 'Bowed over the mound is a bud taller than a person. A seam of light shows where it is shut.']] },
        { d: 14, cam: { from: [8, 9, 14], to: [12, 14, 22], at: [0, 1, 0], fov: [42, 46], ease: 'io' }, focus: 'crown', ap: .2, exp: 1.25, env: { xray: [[1.5, 0], [3.5, 1]] }, card: [4, 13.5, 'heart'],
          say: [[.5, 6.5, 'Inside it is a heart: a blackberry the size of a barrel, beating twice every two seconds.'], [7, 13.5, 'Each beat runs down the spire and out through roots that reach under the whole meadow.']] },
        { d: 14, cam: { from: [26, 28, 34], to: [16, 34, 26], at: [0, 0, 0], fov: [48, 52], ease: 'io' }, focus: 40, ap: .08, exp: 1.25, env: { xray: [[0, 1], [3, 0]] },
          say: [[.5, 6.5, 'Its roots carry its warmth. The frost stops where they end.'], [7, 13.5, 'Inside that ring it is still spring: green grass and white flowers, in the middle of winter.']] }
      ]
    },
    {
      id: 'fruit', title: 'Fruit in the long night', kicker: 'Chapter three', setup: { pose: 'rest', frost: 1, xray: 0, open: 0 },
      shots: [
        { d: 12, cam: { from: [-3, 6.05, -6.7], to: [-2.2, 5.85, -5.4], at: 'bunch6', fov: [22, 19], ease: 'io', shake: .12 }, focus: 'bunch6', ap: 2.6, exp: 1.4,
          say: [[.5, 11.5, 'And it fruits. Green, red and black on the same cane, all winter long, every drupelet glossy in the moonlight.']] },
        { d: 12, cam: { from: [4, 1.2, -9], to: [6, 1.6, -7], at: [0, 2.4, 0], fov: [34, 32], ease: 'io', shake: .1 }, focus: 'crown', ap: 1.1, exp: 1.3,
          say: [[.5, 11.5, 'Warmth, light and food on the longest nights of the year. For anything cold and hungry there is nowhere else like it.']] }
      ]
    },
    {
      id: 'wake', title: 'It wakes', kicker: 'Chapter four', setup: { pose: 'rest', frost: 1, xray: 0, open: 0, prey: 'camera' },
      shots: [
        { d: 11, cam: { from: [1.5, 1.55, 17], to: [.6, 1.6, 10.5], at: [0, 2.6, 0], fov: [44, 44], ease: 'l', shake: .45, walk: true }, focus: 'crown', ap: .6, exp: 1.3, act: [[6.5, 'alert']],
          say: [[.5, 6, 'It has no eyes and no face.'], [6.5, 10.8, 'It feels warmth, and footsteps, through its roots.']] },
        { d: 9, cam: { from: [-14, 3, 12], to: [-15, 4, 14], at: [0, 4.5, 0], fov: [36, 36], ease: 'io', shake: .1 }, focus: 'chest', ap: .5, exp: 1.3, act: [[.2, 'alert']],
          say: [[.5, 8.5, 'Something has stepped inside its reach.']] }
      ]
    },
    {
      id: 'bloom', title: 'The bloom', kicker: 'Chapter five', setup: { pose: 'base', frost: 1, xray: 0, open: 0, prey: 'mark' },
      shots: [
        { d: 13, cam: { from: [13, 3.4, 9.5], to: [10.8, 3.9, 8], at: [.3, 6.2, .8], fov: [28, 25], ease: 'io', shake: .12 }, focus: 'heart', ap: .7, exp: 1.25, act: [[1, 'bloom']], env: { open: [[0, 0], [3.3, 0], [3.8, 1]] },
          say: [[.5, 6.5, 'First, it opens.'], [6.8, 12.8, 'The flower spreads, the heart shows, and a sweet glowing dust drifts out over the meadow.']] },
        { d: 10, cam: { from: [1.2, 6.2, 4.4], to: [.8, 6.6, 3.4], at: 'heart', fov: [30, 26], ease: 'io', shake: .08 }, focus: 'heart', ap: 2.2, exp: 1.2, env: { open: [[0, 1]] },
          say: [[.5, 9.5, 'Animals come toward the light. Very few walk away.']] }
      ]
    },
    {
      id: 'strike', title: 'The strike', kicker: 'Chapter six', setup: { pose: 'base', frost: 1, xray: 0, open: 0, prey: 'mark' },
      shots: [
        { d: 11, cam: { from: [-15, 2.2, 6], to: [-14, 2.4, 7], at: [0, 4, 4.5], fov: [40, 40], ease: 'l', shake: .1 }, focus: [0, 3, 5], ap: .4, exp: 1.25, act: [[3, 'lance']], slow: [[3.2, 1], [3.5, .18], [5.2, .18], [5.8, 1]], card: [6, 10.5, 'arm'],
          say: [[.5, 3, 'Its arms are canes nine metres long.'], [5.8, 10.8, 'The lead arm draws back, and spears down faster than an eye can follow.']] },
        { d: 10, cam: { from: [2.2, 3.4, 7.6], to: [1.6, 3.2, 7.1], at: 'hitmid', fov: [22, 20], ease: 'io', shake: .1 }, focus: 'hitmid', ap: 3, exp: 1.35,
          say: [[.5, 9.5, 'Its thorns hook backward, so whatever they catch cannot pull free.']] },
        { d: 12, cam: { from: [16, 3, 18], to: [17, 3.5, 20], at: [0, 4, 6], fov: [44, 44], ease: 'l', shake: .1 }, focus: [0, 2, 8], ap: .3, exp: 1.25, act: [[1, 'slam']],
          say: [[.3, 5.2, 'Threatened, it fights.'], [6, 11.8, 'Both arms twine into one club, rise eleven metres, and fall.']] }
      ]
    },
    {
      id: 'root', title: 'Where the tips touch', kicker: 'Chapter seven', setup: { pose: 'base', frost: 1, xray: 0, open: 0, prey: 'mark' },
      shots: [
        { d: 13, cam: { from: [9, 2, 16], to: [10, 2.4, 17], at: [0, 2, 8.2], fov: [40, 40], ease: 'l', shake: .1 }, focus: [0, 1.5, 8.2], ap: .4, exp: 1.25, act: [[1.5, 'briar']],
          say: [[.3, 5.5, 'A blackberry puts down roots wherever the tip of a cane touches the ground.'], [6.5, 12.8, 'This one can do it in a heartbeat.']] }
      ]
    },
    {
      id: 'rest', title: 'The long night', kicker: 'Chapter eight', setup: { pose: 'base', frost: 1, xray: 0, open: 0 },
      shots: [
        { d: 14, cam: { from: [-10, 3, -12], to: [-13, 4, -16], at: [0, 2.6, 0], fov: [36, 38], ease: 'io' }, focus: 'crown', ap: .5, exp: 1.25, act: [[1, 'rest']],
          say: [[.5, 6.5, 'By morning it is a hill of brambles again.'], [7, 13.5, 'The meadow stays green. The frost waits at the edge of its roots.']] },
        { d: 16, cam: { from: [30, 9, 46], to: [70, 26, 110], at: [0, 3, 0], fov: [40, 44], ease: 'io' }, focus: 60, ap: .05, exp: 1.2, bars: .1,
          fade: [[11, 1], [16, 0]], say: [[.5, 9, 'And the longest night is still coming.']], end: [10, 16] }
      ]
    }
  ];
  // field notes: the cards that slide in beside a shot, and the full sheet at the end and in Explore
  const cards = {
    heart: { title: 'The heart', rows: [['Size', 'about 1.2 m tall'], ['Beat', 'a double beat every 1.7 s'], ['Glow', 'from inside every drupelet'], ['Warmth', 'out through the roots, about 20 m']] },
    arm: { title: 'The lead arm', rows: [['Length', '9 m'], ['Thorns', 'hooked back toward the cane'], ['Strike', 'down through its prey and into the ground']] }
  };
  const sheet = {
    name: 'Bramble Colossus', latin: 'a working name', rows: [
      ['Height', '7.5 m to the top of the bud'], ['Across', '11 m at rest; its arms reach 9 m'], ['Where', 'the meadows below the frozen pass, by Frostmere'],
      ['Age', 'a century or more; it grows from a thicket like the Bramble Horror'], ['Heart', 'a giant blackberry, beating twice every 1.7 s'],
      ['Feeds', 'through its roots, on what its canes bring to the flower'], ['Senses', 'warmth and footsteps, through its roots'], ['Fears', 'fire']]
  };
  let total = 0; for (const c of chapters) { c.start = total; for (const s of c.shots) { s.start = total; total += s.d; } c.end = total; }
  return { chapters, cards, sheet, total };
}
