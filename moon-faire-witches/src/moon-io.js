// moon-io.js: Moon Faire's Io (the Herbal Witch, at her light weights, build/io_plus.js) behind the face every model in
// Envoi's battles has: root, fx, animate(phase, wb, t, dt), play(name, force), ACTIONS (dur, hits, cues), anchor(name, out),
// flamePos(out), guard(on), reset(), busy, action, progress, state. Nothing in her model is changed here.
// makeMoonIo({ weight: 'lightest' | 'light' | 'full', practice: false }). practice: true keeps her own grey practice friends
// and target dummy, which her spells were built around; a fight hides them, because it has real ones.
// Her spells are built to land a set distance in front of her (near, metres): a fight walks her there first.
function makeMoonIo(opts) {
  'use strict';
  opts = opts || {};
  const m = window.MF_WITCHES.io.raw(opts.weight || 'lightest');
  const S = m.shots;
  // hits and cues as fractions of each move. Her own spells: the seconds Moon Faire's fight reads (game/fight/actors.js);
  // the new moves: the moments their lights start and land (src/io-new-moves.frag.js).
  const SEC = {
    crescent: { hits: [2.38], cues: [1.1], near: 1.4 }, thorn: { hits: [2.62], cues: [1.8], near: 1.4 }, salve: { hits: [5.4], cues: [2.4], near: 1.3 },
    garden: { hits: [7.5], cues: [3.5] }, guardian: { hits: [13.02], cues: [7.0, 11.6], near: 1.8 }, revive: { hits: [6.4], cues: [3.0], near: 1.3 },
    cradle: { hits: [2.9, 3.5, 4.1], cues: [0.6] },
    e_throw: { cues: [0.60], hits: [0.60] }, e_raise: { cues: [0.55, 1.38], hits: [1.6] }, e_grasp: { cues: [0.5], hits: [1.15] },
    e_bless: { cues: [0.5, 0.95], hits: [1.5] }, e_sky: { cues: [0.75], hits: [1.9] }, e_moon: { cues: [0.6, 1.6], hits: [2.0, 2.3, 2.6] },
    hit: { hits: [], cues: [] }, win: { hits: [1.05], cues: [] }, down: { hits: [], cues: [], hold: 4.2 },
    herb: { hits: [3.0], cues: [] }, curtsey: {}, twirl: {}, wave: {}, hat: {}, sickle: {},
  };
  const ACTIONS = {};
  for (const n in SEC) { const d = S[n] || 1, q = SEC[n]; ACTIONS[n] = Object.freeze({ dur: d, hits: (q.hits || []).map((x) => x / d), cues: (q.cues || []).map((x) => x / d), hold: !!q.hold, interrupt: n === 'hit', near: q.near || 0 }); }
  ACTIONS.e_guard = Object.freeze({ dur: 0.6, hits: [], cues: [], hold: true, interrupt: false, near: 0 });
  // Envoi's battle screen asks every hero for its own move names: each is played by the nearest move of hers
  const ALIAS = { transform: 'e_sky', hurt: 'hit', block: 'hit', victory: 'win', kneel: 'down', summon: 'e_sky', cast: 'e_bless', throw: 'e_throw', mend: 'e_bless', moon: 'e_moon', combo: 'crescent', briar: 'e_grasp', lunge: 'crescent', guardStep: 'e_guard' };
  for (const k in ALIAS) if (!ACTIONS[k]) ACTIONS[k] = ACTIONS[ALIAS[k]];
  ACTIONS.rise = Object.freeze({ dur: 1.4, hits: [], cues: [], hold: false, interrupt: false, near: 0 });
  Object.freeze(ACTIONS);
  const A = {
    root: m.root, fx: null, model: m, witch: true, ACTIONS, state: {}, trance: 0, moon: 0, dash: 0, flameLight: { intensity: 0 },
    action: null, stance: null, weight: opts.weight || 'lightest', triangles: m.triangles, practice: !!opts.practice, frozen: false,
  };
  let cur = null, guarding = false, downHeld = false;
  A.play = (name, force) => {
    if (name === 'rise') { if (cur === 'down') A.down(false); else m.play('idle'); return true; }       // she gets up: her fall's own move finishes
    if (ALIAS[name] && !SEC[name]) name = ALIAS[name];
    if (name === 'down' && cur === 'down') return true;
    if (!ACTIONS[name]) return false;
    if (cur && !force && cur !== 'e_guard' && cur !== 'down') return false;
    downHeld = false; A.frozen = false;
    m.play(name); cur = name; A.action = name === 'down' ? 'kneel' : name; if (name !== 'e_guard') guarding = false;
    return true;
  };
  Object.defineProperty(A, 'progress', { get() { if (!cur) return -1; const a = ACTIONS[cur]; return Math.min(1, m.moveT / a.dur); } });
  Object.defineProperty(A, 'busy', { get() { return !!cur && cur !== 'e_guard' && !(cur === 'down' && downHeld); } });
  Object.defineProperty(A, 'actionName', { get() { return cur; } });
  Object.defineProperty(A, 'time', { get() { return cur ? m.moveT : 0; } });
  A.guard = (on) => { guarding = !!on; if (on) A.play('e_guard', true); else if (cur === 'e_guard') { cur = null; A.action = null; m.play('idle'); } };
  A.down = (on) => { if (on) { A.play('down', true); } else if (cur === 'down') { downHeld = false; A.frozen = false; } };       // getting up: her own move finishes
  A.reset = () => { cur = null; A.action = null; guarding = false; downHeld = false; A.frozen = false; m.play('idle'); };
  const _v = new THREE.Vector3(), _inv = new THREE.Matrix4();
  // points on her, in the world
  A.anchor = (name, out) => {
    out = out || new THREE.Vector3(); m.root.updateMatrixWorld(true); const SK = m.SK;
    switch (name) {
      case 'head': SK.head.getWorldPosition(out); out.y += 0.12; return out;
      case 'crown': SK.head.getWorldPosition(out); out.y += 0.45; return out;
      case 'handR': case 'flame': case 'palm': return SK.handR.getWorldPosition(out);
      case 'handL': return SK.handL.getWorldPosition(out);
      case 'feet': return out.copy(m.root.position);
      case 'hit': case 'chest': default: SK.spine3.getWorldPosition(out); out.y += 0.02; return out;
    }
  };
  A.flamePos = (out) => A.anchor('handR', out);
  // a point given in her own space (her spells' places: +z in front of her), in the world
  A.local = (x, y, z, out) => (out || new THREE.Vector3()).set(x, y, z).applyMatrix4(m.root.matrixWorld);
  A.animate = (phase, wb, t, dt) => {
    if (cur && cur !== 'e_guard') {
      const a = ACTIONS[cur];
      if (cur === 'down' && m.moveT >= SEC.down.hold && !downHeld && A.busy) { downHeld = true; }
      if (m.move !== cur) { cur = null; A.action = null; }       // her move has run out: she is back at idle
    }
    if (!cur) { const want = A.stance || (wb > 0.5 ? (A.walkRun ? 'jog' : 'walk') : 'idle'); if (m.move !== want) m.play(want); }       // stance: a held one of hers ('kneel', 'squat', 'hover', 'read')
    const freeze = cur === 'down' && downHeld;
    m.animate(freeze ? 0 : dt);
    if (!A.practice && m.spellFx) { m.spellFx.dummy.visible = false; m.spellFx.ally.visible = false; m.spellFx.ally2.visible = false; const FA = m.wood && m.wood.FALLEN; if (FA) { if (FA.isObject3D) FA.visible = false; else if (FA.G) FA.G.visible = false; } }
    // her seeds' threads face the camera (FXVIEW), when the page says where the camera is
    if (A.camera && m.spellFx && m.spellFx.view) { _inv.copy(m.root.matrixWorld).invert(); _v.copy(A.camera.position).applyMatrix4(_inv).normalize(); m.spellFx.view.copy(_v); }
  };
  A.reset();
  return A;
}
