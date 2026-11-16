// moon-jester.js: Moon Faire's Jester (her light model, MF_WITCHES.jester) for Envoi's battle screen. She was built to the
// same model spec as Envoi's heroes, so this only gives her the generic move names the screen asks every hero for, played
// by her own: hurt (her laughing or dusting-off hit, in turn), block, kneel and rise (her kneeling stance), victory (her
// bow), and guard (she has none: catching blows is how she defends). Everything else is her own model.
//   makeMoonJester({ weight }) -> the model, with those names added
function makeMoonJester(opts) {
  'use strict';
  opts = opts || {};
  const J = window.MF_WITCHES.jester.raw(opts.weight || 'lightest');
  const play0 = J.play.bind(J);
  let hitN = 0, kneeling = false;
  const A = Object.assign({}, J.ACTIONS);
  A.hurt = J.ACTIONS.hit_laugh; A.block = J.ACTIONS.hit_dust; A.victory = J.ACTIONS.bow; A.transform = J.ACTIONS.dance;       // her Trance, the Doom Dance, opens with her dance
  A.kneel = Object.freeze({ dur: 1.0, hits: [], cues: [], hold: true, interrupt: true }); A.rise = Object.freeze({ dur: 1.0, hits: [], cues: [], hold: false, interrupt: false });
  const W = Object.create(J);
  Object.defineProperty(W, 'ACTIONS', { value: Object.freeze(A) });
  W.play = function (name, force) {
    if (name === 'kneel' || name === 'die') { if (!kneeling) { kneeling = true; if (J.stop) J.stop(); J.setStance('kneel'); } return true; }
    if (name === 'rise') { kneeling = false; J.setStance(''); return true; }
    if (kneeling) return false;
    if (name === 'hurt') name = hitN++ % 2 ? 'hit_dust' : 'hit_laugh';
    else if (name === 'block') name = 'hit_dust';
    else if (name === 'victory') name = 'bow';
    else if (name === 'transform') name = 'dance';
    if (!J.ACTIONS[name]) return false;
    return play0(name, force);
  };
  W.guard = function () {};
  Object.defineProperty(W, 'action', { get() { return kneeling ? 'kneel' : J.action; } });
  Object.defineProperty(W, 'busy', { get() { return !kneeling && J.busy; } });
  Object.defineProperty(W, 'progress', { get() { return kneeling ? -1 : J.progress; } });
  W.raw = J; W.witch = true;
  W.flameLight = { intensity: 0 };
  return W;
}
