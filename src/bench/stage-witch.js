// stage-witch.js: the battle staging of Io, the Witch, for the bench, ported from the battle in
// reference/demos/night-square-shadow-wraith.html. She stands in her battle place with Sol, facing the Shadow Wraith,
// and every command plays as in the battle, with its effects from src/fx/battle-fx.js at the times in her ACTIONS
// table: Attack runs up to the wraith, strikes three times and runs back; Flame Bolt, Crescent Blades, Nightbloom
// Briars, Lunar Mend, the summon, Lunar Trance and Moonlight bring their spells; Defend raises her guard and the
// shield while the wraith's Soul Bolts break on it. The original model has no ACTIONS, so this file keeps the same
// times (TIMES) and fires from them for both models: the before/after switch plays identically.
// Her new Moonlore (src/fx/io-spells.js) plays on her existing motions: Waxing Light on mend, Moonsteel and Moth Veil
// on cast. While one plays, its own effect, cue and hit times and name replace those of the motion. Moth Veil and the
// wraith's Shadow Grasp go to the target picked under the Moonlore buttons (Sol or Io), so the veil can be tested.
window.STAGES = window.STAGES || {};
window.STAGES.witch = (function () {
  'use strict';
  // the same hit and cue times as makeWitch().ACTIONS
  const TIMES = {
    lunge: { hits: [0.36] }, combo: { hits: [0.17, 0.37, 0.6] },
    throw: { hits: [0.87], cues: [0.44] }, crescent: { hits: [0.733, 0.788, 0.842, 0.896, 0.95], cues: [0.18, 0.6] },
    briar: { hits: [0.613], cues: [0.45] }, mend: { hits: [0.6] },
    moon: { hits: [0.407, 0.521, 0.636], cues: [0.3, 0.389] }, summon: { cues: [0.3, 0.569] }, transform: { cues: [0.55] },
  };
  const DUR = { mend: 1.9, cast: 1.4 }; // the motions her new spells play (the same on both models)
  const SPELL_OF = { waxing: 'waxing', moonsteel: 'moonsteel', mothveil: 'veil' }; // button id -> io-spells id
  const NONE = { hits: [], cues: [] };
  const TAU = Math.PI * 2;
  const rnd = (a, b) => a + Math.random() * (b - a);
  let THREE = null, ctx = null, FX = null, IO = null, flashEl = null, tranceBtn = null, WELL = null, HOME = null;
  const FL = { a: 0, dur: 1 }, TR = { on: false, vis: 0 }, SEEN = { act: '', p: -1 }, RISE = { pending: false, held: -1 };
  const VEIL = { target: 'sol', veil: null }, HEAT = { v: 0, hold: 0 }, QUIET = { hurt: false };
  const timers = [];
  let clock = 0, blades = null, ATK = null, DEF = null, SPELL = null, GR = null, marked = null, wideTill = 0;

  const W = () => ctx.subject, E = () => ctx.actors.wraith, SOL = () => ctx.actors.sol;
  const V = () => new THREE.Vector3();
  const posW = () => ({ x: W().x, z: W().z }), posE = () => ({ x: E().x, z: E().z });
  const posOf = (id) => () => ({ x: ctx.actors[id].x, z: ctx.actors[id].z });
  const chestOf = (id) => () => ctx.actors[id].chest(V());
  const chestW = () => W().chest(V()), chestE = () => E().chest(V());
  const timesOf = (m, a) => (SPELL && SPELL.motion === a ? IO.SPELLS[SPELL.id] : (m.ACTIONS && m.ACTIONS[a]) || TIMES[a] || NONE);
  const later = (sec, fn) => timers.push({ at: clock + sec, fn });
  const hitE = (n) => ctx.damage('wraith', ctx.swing(n, 0.07));
  const tipW = () => { const m = W().m; return m.anchor ? m.anchor('hit', V()) : m.tip(V()); }; // the dagger tip, on either model
  const flameW = () => W().m.flamePos(V());
  // a palm from her wrist bones, the same on both models (-1 her right, the dagger hand; 1 her left, the flame hand)
  const palm = (sd) => () => { const b = W().m.bones.find((x) => x.name === 'wrist' + sd); b.updateWorldMatrix(true, false); return b.localToWorld(V().set(0, -0.03, 0.002)); };
  // the line of Sol's blade, from near the guard to the tip (her anchors: 'blade' is mid-blade, 'hit' the tip)
  const T1 = { v: null };
  const solBlade = (A, B) => { const m = SOL().m; T1.v = T1.v || V(); m.anchor('blade', T1.v); m.anchor('hit', B); A.copy(T1.v).sub(B).multiplyScalar(0.8172).add(T1.v); };
  // where the rings mark a hit or a cue: blows at the dagger tip, spells where they land or leave from
  const HIT_AT = { combo: tipW, lunge: tipW, mend: chestW };
  const CUE_AT = { throw: flameW, summon: (i) => (i ? new THREE.Vector3(WELL.x, 1.1, WELL.z) : flameW()), crescent: chestW, transform: chestW, moon: chestE, briar: () => { const e = posE(); return new THREE.Vector3(e.x, 0.3, e.z); } };
  const down = (m) => !!m.action && !m.busy; // holding a finished kneel or victory
  function toward(from, to, dist) { const dx = to.x - from.x, dz = to.z - from.z, d = Math.hypot(dx, dz) || 1; return { x: to.x - dx / d * dist, z: to.z - dz / d * dist }; }
  function turn(a, yaw, dt) { a.yaw += ctx.wrapA(yaw - a.yaw) * Math.min(1, dt * 10); }

  // a white or tinted flash over the stage, as the battle's UI.flash
  function flash(color, peak, dur) { if (ctx.REDUCED) peak *= 0.3; flashEl.style.background = color; FL.a = Math.max(FL.a, peak); FL.dur = dur; }
  // a floating word like a damage number, without the hurt reaction a number brings
  function tag(id, text, cls) {
    const a = ctx.actors[id]; if (!a || !a.visible) return;
    const p = ctx.toScreen(a.head(V())); if (p[2] > 1) return;
    const d = document.createElement('div'); d.className = 'dmg ' + (cls || ''); d.textContent = text;
    d.style.left = (p[0] + (Math.random() - 0.5) * 26) + 'px'; d.style.top = (p[1] - 24) + 'px';
    d.addEventListener('animationend', () => d.remove()); ctx.stage.appendChild(d);
  }

  // ---------- the spells, at the start of an action, its cues and its hits ----------
  function start(a) {
    if (a === 'mend') { FX.rise(posW, [0.6, 1, 0.75], 1.5, 40, 0.55); FX.sigil(posW(), 0xb8ffd0, 1.8, 1.8, 1.5); }
    else if (a === 'summon') FX.sigil(posW(), 0xd8c8ff, 1.9, 2.6, -2);
    else if (a === 'transform') { FX.sigil(posW(), 0xdfe9ff, 2.3, 3.0, 2.5); FX.beam(posW(), 0xe6eeff, 1.5, 12, 2.6); FX.spiral(chestW, [0.8, 0.9, 1], 1.5, 90); }
    else if (a === 'hurt' && !DEF && !QUIET.hurt) { const p = chestW(); FX.slash(p, 0x5dff9d, rnd(2.4, 3.0), 1.5, 0.35); FX.burst(p, [0.3, 1, 0.55], 40, 3.6); FX.flashLight(p, 0x4dff90, 3, 0.3); ctx.damage(W().id, ctx.swing(190, 0.07)); }
    else if (a === 'block' && !DEF) { FX.burst(chestW(), [0.3, 1, 0.55], 22, 2.6); ctx.damage(W().id, ctx.swing(95, 0.07)); }
    QUIET.hurt = false;
  }
  function cue(a, i) {
    if (a === 'throw') {
      FX.projectile({ from: W().m.flamePos(V()), to: chestE, dur: 0.5, arc: 0.45, color: 0xe08cff, halo: 0x9a3cff, size: 0.34, trail: [0.8, 0.35, 1], light: 0xb455ff, lightI: 3 }).then(() => {
        const p = chestE(); FX.burst(p, [0.85, 0.4, 1], 60, 4.2); FX.ring(posE(), 0xc060ff, 0.2, 1.9, 0.6, 0.9); FX.flashLight(p, 0xc070ff, 4, 0.4, 7); hitE(330);
      });
    } else if (a === 'crescent' && i === 0) blades = FX.blades(chestW, 5);
    else if (a === 'crescent' && i === 1 && blades) {
      const list = blades; blades = null;
      list.forEach((b, k) => later(k * 0.13, () => FX.launchBlade(b, chestE, 0.32).then(() => {
        const p = chestE(); FX.slash(p, 0xcfe0ff, rnd(0, TAU), 0.9, 0.25); FX.burst(p, [0.7, 0.8, 1], 18, 2.8); hitE(88);
      })));
    } else if (a === 'briar') { const e = posE(); FX.sigil(e, 0xc070ff, 2.4, 1.8, 2); FX.briars(e, 1.7); FX.burst(new THREE.Vector3(e.x, 0.25, e.z), [0.75, 0.35, 1], 50, 3, { up: 1 }); }
    else if (a === 'moon' && i === 1) { FX.beam(posE(), 0xe6eeff, 3.4, 14, 1.9); FX.sigil(posE(), 0xdfe9ff, 3.4, 2.1, 3); }
    else if (a === 'summon' && i === 0) FX.projectile({ from: W().m.flamePos(V()), to: new THREE.Vector3(WELL.x, 1.1, WELL.z), dur: 0.7, arc: 1.7, color: 0xffffff, halo: 0xcfe0ff, size: 0.26, trail: [0.85, 0.9, 1], light: 0xe6eeff, lightI: 3 }).then(wellRises);
    else if (a === 'transform') {
      TR.on = true;
      const c = chestW(); FX.burst(c, [0.85, 0.92, 1], 100, 4.8, { spread: 0.25 }); FX.ring(posW(), 0xffffff, 0.3, 3.2, 0.8, 1); FX.ring(posW(), 0xbfd6ff, 0.3, 4.5, 1.1, 0.7);
      FX.flashLight(c, 0xe8f0ff, 5, 0.6, 7); flash('#ffffff', 0.65, 0.45);
    }
  }
  function hit(a, i) {
    if (a === 'combo' || a === 'lunge') {
      const big = a === 'lunge' || i === 2, p = chestE(), rot = a === 'lunge' ? 0.15 : [-0.5, 2.5, 0.15][i];
      FX.slash(p, 0xffffff, rot, big ? 1.3 : 1.05, 0.3); FX.burst(p, [1, 0.95, 0.8], big ? 40 : 26, big ? 4 : 3.2); FX.flashLight(p, 0xfff1d0, big ? 3 : 2, 0.2);
      hitE(a === 'lunge' ? 110 : [70, 75, 120][i]);
    } else if (a === 'briar') { FX.flashLight(chestE(), 0xb455ff, 3, 0.4); hitE(260); later(0.15, () => tag('wraith', 'Bound', 'dark')); }
    else if (a === 'mend') { ctx.damage(W().id, Math.round(380 * rnd(0.95, 1.05)), 'heal'); FX.burst(chestW(), [0.6, 1, 0.75], 30, 2, { up: 1 }); }
    else if (a === 'moon') {
      const p = chestE(); FX.burst(p, [0.85, 0.92, 1], 70, 5, { spread: 0.3 }); FX.ring(posE(), 0xe6eeff, 0.3, 3.2, 0.7, 1); FX.flashLight(p, 0xe8f0ff, 6, 0.5, 9);
      flash('#ffffff', 0.75 - i * 0.2, 0.35); hitE([420, 380, 450][i]);
    }
    // Flame Bolt and the Crescent Blades land when their projectiles arrive, at these same hit times
  }
  function end(a) {
    if (a === 'crescent' && blades) { for (const b of blades) if (b.state === 'orbit') { b.state = 'gone'; FX.drop(b.s); } blades = null; } // cut short before they flew
    if (a === 'moon') TR.on = false; // Moonlight spends the trance
  }
  function wellRises() {
    FX.ring(WELL, 0xe6eeff, 0.2, 2.6, 0.7, 1); FX.ring(WELL, 0xbfd6ff, 0.2, 4.2, 1.2, 0.8); FX.sigil(WELL, 0xdfe9ff, 4.4, 4.8, 1.2);
    FX.geyser(WELL, 2.6, [0.85, 0.9, 1]); FX.beam(WELL, 0xe6eeff, 2.4, 14, 2.4);
    for (const [dx, dz] of [[1.7, 1.0], [-1.7, 1.0], [1.7, -1.0], [-1.7, -1.0]]) FX.beam({ x: WELL.x + dx, z: WELL.z + dz }, 0xcfe0ff, 0.5, 10, 2.6);
    flash('#dfe8ff', 0.5, 0.5);
  }

  // ---------- her new Moonlore, on her existing motions (effects in src/fx/io-spells.js) ----------
  function spellCue(id, i, u) {
    const S = IO.SPELLS[id], dur = DUR[S.motion], left = (h) => Math.max(0.05, (h - u) * dur);
    if (id === 'waxing' && i === 0) {
      const w = W(), s = SOL();
      IO.waxingLight({ sky: () => V().set((w.x + s.x) / 2, 2.55, (w.z + s.z) / 2), allies: [chestW, chestOf('sol')], landIn: left(S.hits[0]) });
    } else if (id === 'moonsteel' && i === 0) {
      IO.moonsteel({ palm: flameW, blade: solBlade, releaseIn: left(S.cues[1]), landIn: left(S.hits[0]), glowFor: S.glow });
    } else if (id === 'veil') {
      const t = SPELL.target, tall = t === 'sol' ? 2.0 : 2.3;
      if (VEIL.veil) VEIL.veil.dismiss();
      VEIL.veil = IO.mothVeil({ hands: [palm(-1), palm(1)], target: chestOf(t), feet: posOf(t), height: tall, radius: 0.72, spawnFor: left(S.spawnTo), landIn: left(S.hits[0]) });
      VEIL.veil.on = t;
    }
  }
  function spellHit(id) {
    const S = IO.SPELLS[id];
    if (id === 'waxing') { for (const t of ['witch', 'sol']) ctx.damage(t, Math.round(S.heal * rnd(0.95, 1.05)), 'heal'); }
    else if (id === 'moonsteel') { tag('sol', '+' + S.heat + ' Heat', ''); HEAT.v = Math.min(1, HEAT.v + S.heat / 100); HEAT.hold = S.glow; wideTill = clock + S.glow; } // keep Sol's glowing blade in frame
  }
  const SPELL_RING = {
    waxing: { cue: () => [flameW()], hit: () => [chestW(), chestOf('sol')()] },
    moonsteel: { cue: () => [flameW()], hit: () => { const a = V(), b = V(); solBlade(a, b); return [a.lerp(b, 0.55)]; } },
    veil: { cue: () => [palm(1)()], hit: () => [chestOf(SPELL.target)()] },
  };
  function castSpell(id) {
    const m = W().m, S = IO.SPELLS[id];
    if (down(m)) m.reset();
    SPELL = { id, motion: S.motion, target: VEIL.target, shown: false };
    m.play(S.motion, true);
  }
  // the button that shows as playing: the spell's, not the motion's
  function markButton(label) {
    if (marked === label) return;
    for (const b of document.querySelectorAll('#panel .acts button')) {
      const t = b.firstChild && b.firstChild.nodeValue;
      if (label) { if (t === label) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); }
      else if (t === marked) b.removeAttribute('aria-current');
    }
    marked = label;
  }
  function spellTicks(S) {
    const bar = document.getElementById('bar'); if (!bar) return;
    for (const i of bar.querySelectorAll('i')) i.remove();
    for (const h of S.hits) { const i = document.createElement('i'); i.style.left = (h * 100).toFixed(1) + '%'; bar.appendChild(i); }
    for (const h of S.cues) { const i = document.createElement('i'); i.className = 'c'; i.style.left = (h * 100).toFixed(1) + '%'; bar.appendChild(i); }
  }

  // ---------- the wraith's Shadow Grasp on the target: the veil takes it if one is up ----------
  function grasp() {
    const t = VEIL.target, e = E();
    FX.sigil(posOf(t)(), 0x2dff7a, 2.0, 1.9, -2);
    e.play('grasp', true);
    GR = { t, stage: 0, at: 0 };
  }
  function stepGrasp(dt) {
    const e = E(), t = GR.t, p = posOf(t)();
    turn(e, GR.stage < 2 ? ctx.faceYaw(e, ctx.actors[t]) : e.home.yaw, dt); // the bench never turns a cast member, so the stage does
    if (GR.stage === 0 && (e.action !== 'grasp' || e.progress >= 0.5)) {
      FX.tendrils(p, 1.3); FX.burst(new THREE.Vector3(p.x, 0.2, p.z), [0.2, 0.9, 0.45], 50, 3, { up: 1 });
      GR.stage = 1; GR.at = clock + 0.12;
    } else if (GR.stage === 1 && clock >= GR.at) {
      const c = chestOf(t)(), v = VEIL.veil;
      FX.flashLight(c, 0x3cff8a, 3, 0.4);
      if (v && v.up && v.on === t) { v.strike(e.chest(V())); tag(t, 'Absorbed', 'ice'); VEIL.veil = null; }
      else if (t === 'sol') ctx.damage('sol', ctx.swing(250, 0.07));
      else { QUIET.hurt = true; W().m.play('hurt', true); ctx.damage(W().id, ctx.swing(250, 0.07)); }
      GR.stage = 2; GR.at = clock + 1.2;
    } else if (GR.stage === 2 && clock >= GR.at) { GR = null; e.yaw = e.home.yaw; }
  }

  // ---------- Attack: run up to the wraith, three blows, run back (as the battle does). Lunge runs up too, ----------
  // ---------- stopping farther out, since its own dash closes the last meter ----------
  function attack(act, dist) {
    const sub = W(), m = sub.m;
    if (down(m)) m.reset();
    HOME = HOME || { x: sub.home.x, z: sub.home.z, yaw: sub.home.yaw };
    const spot = toward(posW(), posE(), dist);
    // the bench walks a subject back to its home spot, so home becomes the spot until the blows are done
    sub.home.x = spot.x; sub.home.z = spot.z; sub.home.yaw = ctx.faceYaw(spot, posE());
    ATK = { phase: 'run', act, spot, wait: 0, lx: sub.x, lz: sub.z };
  }
  function restoreHome(snap) {
    if (!HOME) return;
    const sub = W(); sub.home.x = HOME.x; sub.home.z = HOME.z; sub.home.yaw = HOME.yaw;
    if (snap) { sub.x = HOME.x; sub.z = HOME.z; sub.yaw = HOME.yaw; }
    HOME = null;
  }
  function stepAttack(dt) {
    const sub = W(), m = sub.m;
    if (ATK.phase === 'run' || ATK.phase === 'back') {
      // she runs at the battle's 4.2 m/s; the bench has already nudged her toward the same spot this frame
      const nudged = Math.hypot(sub.x - ATK.lx, sub.z - ATK.lz);
      const tgt = ATK.phase === 'run' ? ATK.spot : ATK.home, dx = tgt.x - sub.x, dz = tgt.z - sub.z, d = Math.hypot(dx, dz), st = Math.min(d, Math.max(0, 4.2 * dt - nudged));
      if (d > 1e-4) { sub.x += dx / d * st; sub.z += dz / d * st; turn(sub, Math.atan2(dx, dz), dt); }
      sub.wb += (1 - sub.wb) * Math.min(1, dt * 10);
      ATK.lx = sub.x; ATK.lz = sub.z;
      if (d - st < 1e-3) { if (ATK.phase === 'run') { ATK.phase = 'face'; ATK.wait = 0.12; } else ATK = null; }
    } else if (ATK.phase === 'face') {
      turn(sub, ctx.faceYaw(sub, posE()), dt);
      if ((ATK.wait -= dt) <= 0) { m.play(ATK.act, true); ATK.phase = 'strike'; }
    } else if (ATK.phase === 'strike' && !m.busy) { ATK.home = { x: HOME.x, z: HOME.z }; restoreHome(false); ATK.phase = 'back'; ATK.lx = sub.x; ATK.lz = sub.z; }
  }

  // ---------- Defend: her guard and the shield, then the wraith's Soul Bolts break on it ----------
  function defend() {
    const m = W().m;
    if (down(m)) m.reset();
    if (m.guard) m.guard(true);
    FX.shield(true, posW(), ctx.faceYaw(posW(), posE()));
    DEF = { fired: 0, landed: 0, end: -1, t0: clock };
    later(0.8, () => { if (DEF) E().play('cast', true); });
  }
  function stepDefend() {
    const e = E();
    if (e.action === 'cast') while (DEF.fired < 3 && e.progress >= [0.35, 0.47, 0.59][DEF.fired]) {
      DEF.fired++;
      FX.projectile({ from: e.m.handPos(V()), to: chestW, dur: 0.55, arc: rnd(0.3, 0.9), side: rnd(-0.25, 0.25), color: 0x9dffc4, halo: 0x2cff7c, size: 0.2, trail: [0.25, 1, 0.5], light: 0x3cff8a, lightI: 2 }).then(() => {
        if (!DEF) return;
        const p = chestW(); FX.burst(p, [0.3, 1, 0.55], 22, 2.6); FX.shieldHit(); W().m.play('block', true); ctx.damage(W().id, ctx.swing(35, 0.07));
        if (++DEF.landed === 3) DEF.end = clock + 0.9;
      });
    }
    if ((DEF.end >= 0 && clock >= DEF.end) || clock - DEF.t0 > 5) stopDefend(); // the second test: the wraith was cut short
  }
  function stopDefend() { if (!DEF) return; DEF = null; const m = W().m; if (m.guard && !ctx.UI.guard) m.guard(false); FX.shield(false); }

  // ---------- Rise: from a kneel. Standing, she falls first, then gets up ----------
  function stepRise() {
    if (!RISE.pending) return;
    const m = W().m;
    if (m.action !== 'kneel') { RISE.pending = false; return; }
    if (m.busy) return;
    if (RISE.held < 0) RISE.held = clock;
    if (clock - RISE.held < 0.6) return;
    RISE.pending = false;
    if (m.ACTIONS && m.ACTIONS.rise) m.play('rise', true); else { m.reset(); if (ctx.UI.guard) m.guard(true); }
  }

  function abort(snapHome) {
    if (ATK) { ATK = null; restoreHome(snapHome); }
    stopDefend(); RISE.pending = false; SPELL = null;
  }

  // the target of Moth Veil and of the wraith's Shadow Grasp, picked under the Moonlore buttons
  function targetControl() {
    const head = [...document.querySelectorAll('#panel h2')].find((h) => h.textContent === 'Moonlore');
    if (!head || !head.nextElementSibling) return;
    const cap = document.createElement('h2'); cap.textContent = 'Target of Moth Veil and Shadow Grasp';
    const seg = document.createElement('div'); seg.className = 'seg'; seg.setAttribute('role', 'group'); seg.setAttribute('aria-label', cap.textContent);
    for (const [id, label] of [['sol', 'Sol'], ['witch', 'Io']]) {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = label; b.dataset.target = id;
      b.setAttribute('aria-pressed', id === VEIL.target ? 'true' : 'false');
      b.addEventListener('click', () => { VEIL.target = id; for (const q of seg.children) q.setAttribute('aria-pressed', q === b ? 'true' : 'false'); });
      seg.appendChild(b);
    }
    head.nextElementSibling.after(cap, seg);
  }

  return {
    TIMES,
    init(c) {
      ctx = c; THREE = c.THREE;
      FX = makeBattleFX(); c.scene.add(FX.grp);
      IO = makeIoSpells(FX);
      WELL = c.g(712, 725);
      flashEl = document.createElement('div');
      flashEl.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:1;opacity:0';
      c.stage.appendChild(flashEl);
      tranceBtn = [...document.querySelectorAll('button.tog')].find((b) => b.textContent === 'Trance') || null;
      targetControl();
    },
    onBuild(c) { if (!ctx) return; abort(true); SEEN.act = ''; SEEN.p = -1; },
    beforePlay(c, name) {
      if (name === 'wraithGrasp') { if (!GR) grasp(); return; } // the wraith's turn: whatever Io is doing goes on
      abort(false);
      const m = W().m;
      if (name === 'attack') attack('combo', 1.2);
      else if (name === 'lungeAt') attack('lunge', 2.1);
      else if (name === 'defend') defend();
      else if (SPELL_OF[name]) castSpell(SPELL_OF[name]);
      else if (name === 'rise') {
        const hasRise = !!(m.ACTIONS && m.ACTIONS.rise);
        if (m.action === 'rise') return; // already getting up
        if (m.action === 'kneel') {
          if (m.busy) { RISE.pending = true; RISE.held = -1; } // still falling: up once she lands (unless the rise below takes over now)
          else if (!hasRise) { m.reset(); if (c.UI.guard) m.guard(true); } // the old model has no rise: it snaps up
        }
        else { m.play('kneel', true); RISE.pending = true; RISE.held = -1; } // standing, she falls first; the bench's own rise request is then refused
      }
    },
    update(c, rdt, t) {
      clock += rdt;
      const sub = W(), m = sub.m;
      TR.vis += ((TR.on ? 1 : 0) - TR.vis) * Math.min(1, rdt * 3); // eased in and out as in the battle
      m.trance = TR.vis;
      if (tranceBtn) c.setPressed(tranceBtn, TR.on);
      const a = sub.action, p = sub.progress;
      if (SPELL && a !== SPELL.motion && SEEN.act === SPELL.motion) SPELL = null; // the spell's motion ended or was cut short
      if (a !== SEEN.act || (a && p < SEEN.p - 1e-6)) { if (SEEN.act) end(SEEN.act); SEEN.act = a; SEEN.p = -1; if (a && !(SPELL && SPELL.motion === a)) start(a); }
      if (a) {
        const d = timesOf(m, a), sp = SPELL && SPELL.motion === a ? SPELL : null;
        (d.cues || []).forEach((h, i) => {
          if (!(SEEN.p < h && p >= h)) return;
          if (sp) { for (const q of SPELL_RING[sp.id].cue()) c.ring(q, 'cue'); spellCue(sp.id, i, p); }
          else { if (CUE_AT[a]) c.ring(CUE_AT[a](i), 'cue'); cue(a, i); }
        });
        (d.hits || []).forEach((h, i) => {
          if (!(SEEN.p < h && p >= h)) return;
          if (sp) { for (const q of SPELL_RING[sp.id].hit()) c.ring(q, 'hit'); spellHit(sp.id, i); }
          else { c.ring((HIT_AT[a] || chestE)(), 'hit'); hit(a, i); }
        });
        SEEN.p = p;
      }
      if (SPELL && !SPELL.shown && a === SPELL.motion) { SPELL.shown = true; spellTicks(IO.SPELLS[SPELL.id]); }
      markButton(SPELL ? c.cfg.names[Object.keys(SPELL_OF).find((k) => SPELL_OF[k] === SPELL.id)] : null);
      if (ATK && c.UI.walk) abort(false);
      if (ATK) stepAttack(rdt);
      if (DEF) stepDefend();
      if (GR) stepGrasp(rdt);
      stepRise();
      // Sol's Heat from Moonsteel: held while her blade glows, then it cools so the bench can show it again
      if (HEAT.hold > 0) HEAT.hold -= rdt; else HEAT.v = Math.max(0, HEAT.v - rdt * 0.08);
      const sol = SOL(); if (sol && sol.m && sol.m.state) sol.m.state.heat = HEAT.v;
      if (VEIL.veil && !VEIL.veil.alive) VEIL.veil = null;
      for (let i = timers.length - 1; i >= 0; i--) if (clock >= timers[i].at) { const f = timers[i].fn; timers.splice(i, 1); f(); }
      FX.update(rdt, t);
      if (FL.a > 0 || flashEl.style.opacity !== '0') { FL.a = Math.max(0, FL.a - rdt / FL.dur); flashEl.style.opacity = FL.a > 0 ? FL.a.toFixed(3) : '0'; }
    },
    // this stage marks and fires every hit itself (from the same table for both models), so the bench's default is off
    onHit() { return true; },
    wide() { return !!ATK || !!DEF || !!GR || !!SPELL || clock < wideTill || !!(VEIL.veil && VEIL.veil.on === 'sol'); },
    label(c) {
      if (ATK) return (ATK.act === 'lunge' ? 'Lunge' : 'Attack') + (ATK.phase === 'back' ? ': back to her place' : '');
      if (DEF) return 'Defend: Soul Bolts break on her guard';
      const who = (id) => (id === 'sol' ? 'Sol' : 'Io');
      if (SPELL) return IO.SPELLS[SPELL.id].name + (SPELL.id === 'veil' ? ' on ' + who(SPELL.target) : SPELL.id === 'moonsteel' ? ' on Sol' : '');
      if (GR) return 'Shadow Grasp on ' + who(GR.t);
      if (RISE.pending) return 'Rise: she falls first';
      const a = c.subject.action;
      if (a === 'summon') return 'Summon: Io calls Lunara (Lunara is not on this bench)';
      if (a === 'kneel' && !c.subject.busy) return 'Kneel (KO). Press Rise to get up';
      if (!a && VEIL.veil && VEIL.veil.up) return 'Moth Veil on ' + who(VEIL.veil.on) + '. Shadow Grasp tests it';
      if (!a && TR.vis > 0.5) return 'In Lunar Trance. Moonlight spends it';
      return null;
    },
    toggleTrance() { TR.on = !TR.on; },
  };
})();
