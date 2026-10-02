// stage-witch.js: the battle staging of Io, the Witch, for the bench, ported from the battle in
// reference/demos/night-square-shadow-wraith.html. She stands in her battle place with Sol, facing the Shadow Wraith,
// and every command plays as in the battle, with its effects from src/fx/battle-fx.js at the times in her ACTIONS
// table: Attack runs up to the wraith, strikes three times and runs back; Flame Bolt, Crescent Blades, Nightbloom
// Briars, Lunar Mend, the summon, Lunar Trance and Moonlight bring their spells; Defend raises her guard and the
// shield while the wraith's Soul Bolts break on it. The original model has no ACTIONS, so this file keeps the same
// times (TIMES) and fires from them for both models: the before/after switch plays identically.
// Bench workarounds kept here: the bench passes walk phase 0, so gait() gives her a real stride from the distance
// she moves (as the battle does); and battle-fx.js uses a page-level `tmpV` it does not declare, so init() makes one.
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
  const NONE = { hits: [], cues: [] };
  const TAU = Math.PI * 2;
  const rnd = (a, b) => a + Math.random() * (b - a);
  let THREE = null, ctx = null, FX = null, flashEl = null, tranceBtn = null, WELL = null, HOME = null;
  const FL = { a: 0, dur: 1 }, TR = { on: false, vis: 0 }, SEEN = { act: '', p: -1 }, RISE = { pending: false, held: -1 };
  const timers = [];
  let clock = 0, blades = null, ATK = null, DEF = null;

  const W = () => ctx.subject, E = () => ctx.actors.wraith;
  const V = () => new THREE.Vector3();
  const posW = () => ({ x: W().x, z: W().z }), posE = () => ({ x: E().x, z: E().z });
  const chestW = () => W().chest(V()), chestE = () => E().chest(V());
  const timesOf = (m, a) => (m.ACTIONS && m.ACTIONS[a]) || TIMES[a] || NONE;
  const later = (sec, fn) => timers.push({ at: clock + sec, fn });
  const hitE = (n) => ctx.damage('wraith', ctx.swing(n, 0.07));
  const tipW = () => { const m = W().m; return m.anchor ? m.anchor('hit', V()) : m.tip(V()); }; // the dagger tip, on either model
  const flameW = () => W().m.flamePos(V());
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
    else if (a === 'hurt' && !DEF) { const p = chestW(); FX.slash(p, 0x5dff9d, rnd(2.4, 3.0), 1.5, 0.35); FX.burst(p, [0.3, 1, 0.55], 40, 3.6); FX.flashLight(p, 0x4dff90, 3, 0.3); ctx.damage(W().id, ctx.swing(190, 0.07)); }
    else if (a === 'block' && !DEF) { FX.burst(chestW(), [0.3, 1, 0.55], 22, 2.6); ctx.damage(W().id, ctx.swing(95, 0.07)); }
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
    stopDefend(); RISE.pending = false;
  }

  return {
    TIMES,
    // gives the subject a real walk phase: the bench passes 0, the battle passes the meters walked x 4.2
    gait(make) {
      return () => {
        const m = make(), anim = m.animate;
        let ph = 0, px = null, pz = null;
        const animate = (phase, wb, t, dt) => {
          const x = m.root.position.x, z = m.root.position.z;
          if (px !== null && !m.busy) ph += Math.hypot(x - px, z - pz) * 4.2;
          px = x; pz = z;
          return anim(ph, wb, t, dt);
        };
        return new Proxy(m, { get: (o, k) => (k === 'animate' ? animate : o[k]), set: (o, k, v) => { o[k] = v; return true; } });
      };
    },
    init(c) {
      ctx = c; THREE = c.THREE;
      if (window.tmpV === undefined) window.tmpV = new THREE.Vector3(); // battle-fx.js expects the battle page's tmpV
      FX = makeBattleFX(); c.scene.add(FX.grp);
      WELL = c.g(712, 725);
      flashEl = document.createElement('div');
      flashEl.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:1;opacity:0';
      c.stage.appendChild(flashEl);
      tranceBtn = [...document.querySelectorAll('button.tog')].find((b) => b.textContent === 'Trance') || null;
    },
    onBuild(c) { if (!ctx) return; abort(true); SEEN.act = ''; SEEN.p = -1; },
    beforePlay(c, name) {
      abort(false);
      const m = W().m;
      if (name === 'attack') attack('combo', 1.2);
      else if (name === 'lungeAt') attack('lunge', 2.1);
      else if (name === 'defend') defend();
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
      if (a !== SEEN.act || (a && p < SEEN.p - 1e-6)) { if (SEEN.act) end(SEEN.act); SEEN.act = a; SEEN.p = -1; if (a) start(a); }
      if (a) {
        const d = timesOf(m, a);
        (d.cues || []).forEach((h, i) => { if (SEEN.p < h && p >= h) { if (CUE_AT[a]) c.ring(CUE_AT[a](i), 'cue'); cue(a, i); } });
        (d.hits || []).forEach((h, i) => { if (SEEN.p < h && p >= h) { c.ring((HIT_AT[a] || chestE)(), 'hit'); hit(a, i); } });
        SEEN.p = p;
      }
      if (ATK && c.UI.walk) abort(false);
      if (ATK) stepAttack(rdt);
      if (DEF) stepDefend();
      stepRise();
      for (let i = timers.length - 1; i >= 0; i--) if (clock >= timers[i].at) { const f = timers[i].fn; timers.splice(i, 1); f(); }
      FX.update(rdt, t);
      if (FL.a > 0 || flashEl.style.opacity !== '0') { FL.a = Math.max(0, FL.a - rdt / FL.dur); flashEl.style.opacity = FL.a > 0 ? FL.a.toFixed(3) : '0'; }
    },
    // this stage marks and fires every hit itself (from the same table for both models), so the bench's default is off
    onHit() { return true; },
    wide() { return !!ATK || !!DEF; },
    label(c) {
      if (ATK) return (ATK.act === 'lunge' ? 'Lunge' : 'Attack') + (ATK.phase === 'back' ? ': back to her place' : '');
      if (DEF) return 'Defend: Soul Bolts break on her guard';
      if (RISE.pending) return 'Rise: she falls first';
      const a = c.subject.action;
      if (a === 'summon') return 'Summon: Io calls Lunara (Lunara is not on this bench)';
      if (a === 'kneel' && !c.subject.busy) return 'Kneel (KO). Press Rise to get up';
      if (!a && TR.vis > 0.5) return 'In Lunar Trance. Moonlight spends it';
      return null;
    },
    toggleTrance() { TR.on = !TR.on; },
  };
})();
