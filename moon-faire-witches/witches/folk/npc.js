// npc.js: a painted person ready for the game: stands, blinks, fidgets, turns to face the player, talks, and plays emotes.
// three.js r128, global THREE. Load before this file: jester_tex.js, jester_kit.js, lod.js, person-kit.js (and window.MF_FACE_PLAIN),
// then the data made by people/kit/build_npcs.py: npcs.js (window.MF_NPCS), npc_tex.js (window.MF_NPC_TEX), emotes.js (window.MF_EMOTES).
//
//   const npc = await MF_NPC.make('old-lamp-seller');     // ids: MF_NPC.list()
//   scene.add(npc.root); npc.root.position.set(x, 0, z);  // metres, y up; npc.root.rotation.y turns them (0 faces +z)
//   npc.update(dt);                                       // every frame
//   npc.face(playerX, playerZ);                           // turn to face a point on the ground
//   npc.greet();                                          // their own hello
//   npc.talk(true); ... npc.talk(false);                  // while their words are on screen
//   npc.emote('laugh');                                   // any name in npc.emotes
//   await npc.walkTo(x, z);  await npc.runTo(x, z);       // walk or run to a point on the ground; npc.stop() ends it
//   npc.sit();  npc.stand();                              // sit on a seat the scene provides (see npc.seat()), and get up
//   npc.headTop(vec3);                                    // a point just above the head, for a speech mark
//   MF_NPC.make('old-lamp-seller', { weight: 'full' })    // or 'half'. Left out, a person is built with a quarter of the triangles
(function () {
  'use strict';
  const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  async function make(id, o) {
    o = o || {}; const D = window.MF_NPCS.people[id]; if (!D) throw new Error('no person called ' + id);
    const T = window.MF_NPC_TEX[D.skin], WS = (window.MF_NPCS.weights || {})[D.shapeId] || {}, wk = o.weight || 'quarter', wt = WS[wk] ? WS[wk].weight : null;      // the game uses a quarter of the triangles (Chris, November 13); o.weight 'half' or 'full' asks for more
    const person = Object.assign(D.person(), D.scale || {}, wt ? { weight: wt } : null), W = D.wiring || {};
    const prepared = await window.MF_PERSON.prepare(person, { body: T.body, face: T.face, fit: D.fit, faceFit: D.faceFit, skin: D.skinColour, SKIN: D.SKIN });
    const J = window.MF_PERSON.make(person, prepared, o.opts); J.fx.remove(J.spellLight); J.fx.visible = false;
    const stool = J.root.getObjectByName('stool'); if (stool) stool.traverse((m) => { if (m !== stool) m.visible = false; });      // the template conjures a stool to sit on; a person sits on whatever the scene gives them
    const E = window.MF_EMOTES(J.FP), all = Object.keys(E);
    for (const n of all) J.defAction('e_' + n, E[n].dur, E[n].keys, { outro: E[n].outro == null ? 0.4 : E[n].outro });
    const has = (n) => all.indexOf(n) >= 0, loops = (W.talk || ['talk_calm']).filter(has), fidgets = (W.fidgets || []).filter(has), pace = W.pace || 1;
    let seed = hash(id) || 1; const rnd = () => { seed ^= seed << 13; seed >>>= 0; seed ^= seed >>> 17; seed ^= seed << 5; seed >>>= 0; return seed / 4294967296; };
    const st = { t: rnd() * 10, talking: false, loop: 0, turn: null, fidget: 3 + rnd() * 8, fade: 0, from: J.bones.map((b) => b.quaternion.clone()), go: null, phase: 0, wb: 0, rb: 0, v: 0 };
    const WALK = 0.84, RUN = 2.3, arrive = (ok) => { const g = st.go; st.go = null; if (g && g.done) g.done(ok); };
    const cut = () => { J.bones.forEach((b, i) => st.from[i].copy(b.quaternion)); st.fade = 1; };          // remember the pose, so a move that is cut short melts into the next
    const start = (n) => { if (J.busy) cut(); return J.play('e_' + n, true); };
    const npc = {
      id, name: D.name, who: D.who, root: J.root, fx: J.fx, model: J, wiring: W, weight: wt ? wk : 'full', triangles: Object.values(J.partTris).reduce((a, b) => a + b, 0),
      emotes: all.filter((n) => !/^(talk|fidget)_/.test(n)),
      update(dt) {
        dt = Math.min(dt || 0, 0.05); st.t += dt * pace;
        // walking or running to a point: stand up first if seated, turn to the way they are going, and keep the feet in step with the ground covered
        const size = J.root.scale.y; let want = 0, run = 0;
        if (st.go) {
          if (J.stanceNow || J.stance) { if (J.stance) J.setStance(''); }
          else { const p = J.root.position, dx = st.go.x - p.x, dz = st.go.z - p.z, far = Math.hypot(dx, dz);
            if (far < 0.04) arrive(true);
            else { run = st.go.run ? 1 : 0; const top = (run ? RUN : WALK) * pace * size; want = Math.min(top, Math.max(0.25, far * 3)); st.turn = null;
              let d = Math.atan2(dx, dz) - J.root.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); J.root.rotation.y += Math.sign(d) * Math.min(Math.abs(d), 7 * dt); if (Math.abs(d) > 1.2) want = 0;      // turn on the spot before setting off the other way
              st.v += (want - st.v) * Math.min(1, dt * 7); const step = Math.min(far, st.v * dt); p.x += dx / far * step; p.z += dz / far * step; } }
        }
        if (!st.go) st.v += (0 - st.v) * Math.min(1, dt * 9);
        st.wb += ((st.v > 0.05 ? 1 : 0) - st.wb) * Math.min(1, dt * 8); st.rb += (run - st.rb) * Math.min(1, dt * 5);
        if (st.wb > 0.001) st.phase += dt * Math.max(2.0, st.v / size * (7.66 * (1 - st.rb) + 4.2 * st.rb));
        if (st.turn != null) { let d = st.turn - J.root.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); const step = 3.2 * dt; if (Math.abs(d) <= step) { J.root.rotation.y = st.turn; st.turn = null; } else J.root.rotation.y += Math.sign(d) * step; }
        if (st.talking && !J.busy && loops.length) J.play('e_' + loops[st.loop++ % loops.length], true);
        if (!st.talking && !J.busy && fidgets.length && !st.go) { st.fidget -= dt; if (st.fidget <= 0) { J.play('e_' + fidgets[Math.floor(rnd() * fidgets.length)], true); st.fidget = 7 + rnd() * 10; } }
        J.animate(st.phase, st.wb, st.t, dt * pace, st.rb);
        if (st.fade > 0) { st.fade = Math.max(0, st.fade - dt / 0.28); const k = st.fade * st.fade * (3 - 2 * st.fade); J.bones.forEach((b, i) => { b.quaternion.slerp(st.from[i], k); }); }
      },
      talk(on) { on = !!on; if (on === st.talking) return; st.talking = on; st.fidget = 5 + rnd() * 6; if (!on && /^e_talk_/.test(J.action)) { cut(); J.stop(); } },
      emote(name) { return has(name) ? start(name) : false; },
      greet() { return npc.emote(has(W.greet) ? W.greet : 'nod'); },
      face(x, z) { if (!st.go) st.turn = Math.atan2(x - J.root.position.x, z - J.root.position.z); },
      // walk (or run) to a point on the ground. Returns a promise that settles true on arriving, false if something else took over first
      walkTo(x, z, opt) { arrive(false); return new Promise((done) => { st.go = { x, z, run: !!(opt && opt.run), done }; }); },
      runTo(x, z) { return npc.walkTo(x, z, { run: true }); },
      stop() { arrive(false); },
      // sit on a seat the scene provides: its top is at npc.seat().height, npc.seat().back behind where they stand. stand() gets them up
      sit() { arrive(false); return J.setStance('sit_chair'); }, stand() { return J.setStance(''); },
      seat() { const k = J.root.scale.y, a = J.root.rotation.y, b = 0.36 * J.root.scale.z; return { x: J.root.position.x - Math.sin(a) * b, z: J.root.position.z - Math.cos(a) * b, height: 0.452 * k, back: b }; },
      get sitting() { return J.stance === 'sit_chair'; }, get seated() { return J.stanceNow === 'sit_chair' && J.stanceProgress > 0.98; }, get moving() { return !!st.go; },
      headTop(out) { J.root.updateMatrixWorld(true); return (out || new THREE.Vector3()).set(0, 1.80, 0).applyMatrix4(J.root.matrixWorld); },
      get busy() { return J.busy; }, get talking() { return st.talking; }, get doing() { return J.action ? J.action.replace(/^e_/, '') : ''; },
      dispose() { J.root.traverse((m) => { if (m.geometry) m.geometry.dispose(); }); for (const x of (J.debug.textures || [])) x.dispose(); if (prepared.bodyTex) prepared.bodyTex.dispose(); },
    };
    return npc;
  }
  window.MF_NPC = { make, list: () => Object.keys(window.MF_NPCS.people), info: (id) => window.MF_NPCS.people[id] };
})();
