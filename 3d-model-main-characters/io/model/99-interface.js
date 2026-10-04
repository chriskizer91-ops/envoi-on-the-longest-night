
 const _tp = new THREE.Vector3();

 // ---------- the Model Build Spec interface, as the game model has it ----------
 // Hit and cue times (0 to 1) as the battle demo times them (the game model's, unchanged).
 const TIMES = {
  lunge: { hits: [0.36] }, combo: { hits: [0.17, 0.37, 0.6] },
  throw: { hits: [0.87], cues: [0.44] }, crescent: { hits: [0.733, 0.788, 0.842, 0.896, 0.95], cues: [0.18, 0.6] },
  briar: { hits: [0.613], cues: [0.45] }, mend: { hits: [0.6] },
  moon: { hits: [0.407, 0.521, 0.636], cues: [0.3, 0.389] }, summon: { cues: [0.3, 0.569] }, transform: { cues: [0.55] }
 };
 const ACTIONS = {};
 for (const n in ACTS) {
  const d = ACTS[n], q = TIMES[n] || {};
  ACTIONS[n] = Object.freeze({ dur: d.dur, hits: Object.freeze((q.hits || []).slice()), cues: Object.freeze((q.cues || []).slice()), hold: !!d.hold, interrupt: !!d.interrupt });
 }
 Object.freeze(ACTIONS);
 // named points in world space: the game model's (chest, head, hit or tip, flame, handL, handR) and, for labels and close
 // views, her parts: hatTip, horn, charm, glasses, eye, ponytail, scrunchie, coat, dress, sash, boot, necklace, bracelet, dagger
 const GLASS = rimC[1].slice(), EYE = frameAt(0.34, -0.07, 0).p;
 function anchor(name, out) {
  out = out || new THREE.Vector3();
  const at = (b, x, y, z) => { b.updateWorldMatrix(true, false); return b.localToWorld(out.set(x, y, z)); };
  switch (name) {
   case 'hit': case 'tip': dagger.updateWorldMatrix(true, false); return dagger.localToWorld(out.copy(tipL));
   case 'flame': return flame.getWorldPosition(out);
   case 'head': return at(headB, 0, 0, 0.05);
   case 'handL': return at(wrists[1], 0, -0.03, 0.002);
   case 'handR': return at(wrists[0], 0, -0.03, 0.002);
   case 'hatTip': return at(hatA2, -0.05, 0.02, 0.01);
   case 'horn': return at(hatB, 0.215, 0.115, -0.02);
   case 'charm': return at(hatB, 0, 0.085, 0.135);
   case 'glasses': return at(headB, GLASS[0], GLASS[1], GLASS[2]);
   case 'eye': return at(headB, EYE[0], EYE[1], EYE[2]);
   case 'ponytail': return at(hairB, 0, -0.06, -0.02);
   case 'scrunchie': return at(hairA, 0, -0.01, -0.012);
   case 'coat': return at(coatL[1], 0, -0.1, 0.02);
   case 'dress': return at(pelvis, 0.08, -0.62, 0.22);
   case 'sash': return at(pelvis, 0.012, 0.035, 0.104);
   case 'boot': return at(knees[1], 0, -0.2, 0.05);
   case 'necklace': return at(chest, 0, 1.145 - chB[1], 0.128);
   case 'bracelet': return at(elbows[1], 0, -0.19, 0);
   case 'dagger': return at(dagger, 0, 0, 0.15);
   default: return chest.getWorldPosition(out);
  }
 }
 // state: trance (0 to 1) brings in the starlight cloak, ghost wings and crescent aura (the same as m.trance)
 const state = {};
 Object.defineProperty(state, 'trance', { enumerable: true, get: () => trance, set: (v) => { trance = cl(v, 0, 1); } });
 // a party member does not fade; at 0 she is hidden, anything above shows her
 let fade = 1;
 function setFade(f) {
  const was = fade > 0.001; fade = cl(Number.isFinite(+f) ? +f : 1, 0, 1);
  const now = fade > 0.001; if (now !== was) { root.visible = now; fx.visible = now; }
 }

 return {
  root, skeleton, bones, animate, flameLight: fLight, flame, fx,
  play, cast() { return play('cast'); }, lunge() { return play('lunge'); }, moonlight() { return play('moon'); },
  guard(on) { guardOn = !!on; },
  reset() { act = null; guardOn = false; gW = 0; trance = 0; },
  set trance(v) { trance = cl(v, 0, 1); }, get trance() { return trance; },
  ACTIONS, anchor, setFade, get fade() { return fade; },
  get state() { return state; }, set state(v) { if (v) Object.assign(state, v); },
  get busy() { return !!act && !(act.def.hold && act.t >= act.dur); },
  get action() { return act ? act.type : ''; },
  get casting() { return !!act && act.type === 'cast'; },
  get progress() { return act ? Math.min(1, act.t / act.dur) : -1; },
  get dash() { return dashV; },
  get lift() { return liftV; },
  get moon() { return moonKv; },
  tip(out) { return dagger.localToWorld((out || _tp).copy(tipL)); },
  flamePos(out) { return flame.getWorldPosition(out || _tp); },
  chestPos(out) { return chest.getWorldPosition(out || _tp); },
  // for the study page: the rim's strength (0 to 1), and the detail it was built at
  set rim(v) { U.rim.value = .3 * cl(v, 0, 2); }, detail: DET, strands: HAIR_STRANDS
 };
}
