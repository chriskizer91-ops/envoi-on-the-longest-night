// stage-lunara.js: Lunara's battle staging for the bench. She rises behind the Night square's Moonwell; the Witch and Sol stand
// in their places and the Shadow Wraith faces them. The Moonwell's light, the Embrace's heal and veil on the party, and Silver
// Requiem's six moonbeams and Moonfall come from the shared battle effects (src/fx/battle-fx.js), timed to the model's hit and
// cue times, as goddessStrike does in reference/demos/night-square-shadow-wraith.html. The Before button wraps the original
// model (makeGoddessOriginal, the older show/appear/charge/release/leave interface) in a small adapter so the same staging runs.
window.STAGES = window.STAGES || {};
window.STAGES.lunara = (function () {
  const PARTY = ['witch', 'sol'];
  const HEAL = { witch: 840, sol: 912 };  // 60% of max HP at level 1 (the bible's Embrace)
  let THREE, FX, WELL, V1, V2, fx2 = null;
  const beams = [];                        // where this cast's six moonbeams fall, around the foe
  const veils = [];                        // the Embrace's veil on each ally: a pale sigil that holds until the strike
  const S = { flash: 0, dark: 0, veil: 0, moonfall: 0 };

  const foe = (ctx) => ctx.actors.wraith;
  const at = (a, y) => new THREE.Vector3(a.x, y || 0, a.z);
  const chestOf = (a) => a.chest(new THREE.Vector3());

  // The original Lunara, wrapped so the bench can drive it like the new one. The game raised it 0.95 m onto the well.
  function before() {
    const g = makeGoddessOriginal();
    g.show();
    const RH = [0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.78];
    const ACTIONS = {
      appear: { dur: 3.0, hits: [], cues: [0.02, 0.78], hold: false, interrupt: false },
      charge: { dur: 2.2, hits: [], cues: [0.08], hold: true, interrupt: false },
      release: { dur: 4.2, hits: RH, cues: [0.07, 0.56], hold: false, interrupt: false },
      leave: { dur: 2.6, hits: [], cues: [0.2], hold: true, interrupt: false },
    };
    let act = null;
    const state = { target: { x: 0, y: 1, z: 0 } };
    return {
      root: g.root, fx: g.fx, ACTIONS, moonTex: g.moonTex, state,
      animate(phase, walk, t, dt) {
        g.root.position.y = 0.95;
        if (act) { act.t += dt; if (act.t >= act.def.dur && !act.def.hold) act = null; }
        g.update(t, dt);
      },
      play(name) {
        const def = ACTIONS[name]; if (!def) return false;
        act = { name, def, t: 0 };
        if (name === 'appear') g.appear(3.0); else if (name === 'charge') g.charge(2.0); else if (name === 'release') g.release(0.7); else if (name === 'leave') g.leave(2.0);
        return true;
      },
      guard() {}, reset() { act = null; g.show(); }, setFade() {},
      get busy() { return !!act && !(act.def.hold && act.t >= act.def.dur); },
      get action() { return act ? act.name : ''; },
      get progress() { return act ? Math.min(1, act.t / act.def.dur) : -1; },
      get dash() { return 0; }, get lift() { return 0.95; },
      anchor(name, out) {
        out = out || new THREE.Vector3();
        if (name === 'orb') return g.orbPos(out);
        g.headPos(out);
        if (name === 'chest' || name === 'hit' || name === 'hand') out.y -= 0.85;
        return out;
      },
    };
  }

  function placeBeams(ctx) {
    const E = foe(ctx); beams.length = 0;
    for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2 + Math.random() * 0.6, r = 0.25 + Math.random() * 0.55; beams.push({ x: E.x + Math.cos(a) * r, z: E.z + Math.sin(a) * r * 0.8 }); }
  }
  function flash(k) { S.flash = Math.max(S.flash, k); }

  return {
    before,
    init(ctx) {
      THREE = ctx.THREE; V1 = new THREE.Vector3(); V2 = new THREE.Vector3();
      // battle-fx.js's geyser, rise, spiral and converge use a scratch vector `tmpV` that was a global in the Night square demo
      // and is not defined in the brick; give it one here rather than edit the shared file
      if (typeof window.tmpV === 'undefined') window.tmpV = new THREE.Vector3();
      FX = makeBattleFX(); ctx.scene.add(FX.grp);
      fx2 = ctx.overlay.getContext('2d');
      // she stands 0.9 m behind the well's centre, as the summon did in the Night square build, turned a little toward the foe
      const w = ctx.g(712, 725); WELL = new THREE.Vector3(w.x, 0, w.z);
      const s = ctx.subject; s.home.x = w.x; s.home.z = w.z - 0.9; s.x = s.home.x; s.z = s.home.z; s.home.yaw = 0.3; s.yaw = 0.3;
      for (const id of PARTY) {
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: FX.T.sigil, color: 0xcfeede, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
        sp.renderOrder = 7; sp.visible = false; ctx.scene.add(sp); veils.push({ id, sp });
      }
    },
    onBuild(ctx) { S.veil = 0; },
    onAction(ctx, a) { if (a === 'release') placeBeams(ctx); },
    update(ctx, rdt, t) {
      FX.update(rdt, t);
      const a = ctx.subject.action, p = ctx.subject.progress;
      // a little darker while she casts, as the battle tints the screen for a summon
      const dk = a === 'charge' ? 0.22 * ctx.smooth(0, 0.15, p) : a === 'release' ? 0.22 * (1 - ctx.smooth(0.86, 1, p)) : a === 'embrace' ? 0.15 * Math.sin(Math.PI * Math.min(1, p)) : 0;
      S.dark += (dk - S.dark) * (1 - Math.exp(-rdt * 6)); ctx.setDark(S.dark);
      // the veil holds on the party until her strike (or for a few seconds on the bench)
      S.veil = Math.max(0, S.veil - rdt / 6);
      for (const v of veils) {
        const al = ctx.actors[v.id], k = al && al.visible ? Math.min(1, S.veil * 3) : 0;
        v.sp.visible = k > 0.01;
        if (v.sp.visible) { al.chest(V1); v.sp.position.copy(V1); v.sp.scale.setScalar(1.25 + 0.05 * Math.sin(t * 3)); v.sp.material.opacity = 0.42 * k; v.sp.material.rotation = t * 0.4; }
      }
      // a white flash over the screen when the moon lands
      const ov = ctx.overlay, W = ov.width, H = ov.height;
      S.flash = Math.max(0, S.flash - rdt * 2.2);
      if (S.flash > 0.002) { ov.style.opacity = '1'; fx2.clearRect(0, 0, W, H); fx2.fillStyle = 'rgba(236,240,255,' + (0.55 * S.flash).toFixed(3) + ')'; fx2.fillRect(0, 0, W, H); }
      else if (ov.style.opacity !== '0') { fx2.clearRect(0, 0, W, H); ov.style.opacity = '0'; }
    },
    onCue(ctx, a, i) {
      const m = ctx.subject.m, E = foe(ctx);
      if (a === 'appear' && i === 0) { // the Moonwell's light
        FX.ring(WELL, 0xe6eeff, 0.2, 2.6, 0.7, 1); FX.ring(WELL, 0xbfd6ff, 0.2, 4.2, 1.2, 0.8); FX.sigil(WELL, 0xdfe9ff, 4.4, 3.6, 1.2);
        FX.geyser(WELL, 2.4, [0.85, 0.9, 1]); FX.beam(WELL, 0xe6eeff, 2.2, 14, 2.6);
        for (const [dx, dz] of [[1.7, 1.0], [-1.7, 1.0], [1.7, -1.0], [-1.7, -1.0]]) FX.beam({ x: WELL.x + dx, z: WELL.z + dz }, 0xcfe0ff, 0.5, 10, 2.6);
        FX.flashLight(new THREE.Vector3(WELL.x, 1.2, WELL.z), 0xdfe8ff, 3, 2.4, 9);
      }
      if (a === 'appear' && i === 1) { const h = m.anchor('head', new THREE.Vector3()); FX.burst(h, [0.75, 1, 0.88], 60, 3.5, { spread: 0.9 }); FX.ring(at(ctx.subject), 0xdfffee, 0.4, 4.2, 0.9, 0.8); flash(0.35); }
      if (a === 'embrace' && i === 0) { // the wings close: light gathers in her, and rises around the party
        FX.converge(() => m.anchor('chest', new THREE.Vector3()), [0.8, 1, 0.88], 1.0, 90);
        for (const id of PARTY) { const al = ctx.actors[id]; if (al && al.visible) FX.rise(() => at(al), [0.75, 1, 0.85], 1.2, 40, 0.6); }
      }
      if (a === 'charge' && i === 0) {
        const orb = () => m.anchor('orb', new THREE.Vector3());
        FX.converge(orb, [0.85, 0.9, 1], 1.9, 110); FX.rise(() => at(ctx.subject), [0.85, 0.9, 1], 1.9, 50, 1.4);
      }
      if (a === 'release' && i === 0) { // the moon is thrown up, to come down on the foe
        const from = m.anchor('orb', new THREE.Vector3());
        FX.projectile({ from, to: () => new THREE.Vector3(E.x, 9.5, E.z), dur: 0.55, arc: 1.4, tex: m.moonTex, color: 0xffffff, halo: 0xcfe0ff, size: 1.0, trail: [0.8, 0.85, 1], light: 0xe6eeff, lightI: 4 });
      }
      if (a === 'release' && i === 1) { // Moonfall begins: it lands on the last hit
        const d = m.ACTIONS.release, dur = (d.hits[6] - d.cues[1]) * d.dur;
        FX.ring(at(E), 0xdfe8ff, 3.5, 1.0, dur, 0.7); FX.moonfall(at(E), m.moonTex, dur); S.moonfall = 1;
      }
      if (a === 'leave' && i === 0) { const h = m.anchor('head', new THREE.Vector3()); FX.burst(h, [0.75, 1, 0.88], 70, 3, { spread: 1.0 }); }
    },
    onHit(ctx, a, i) {
      const E = foe(ctx);
      if (a === 'embrace') { // both allies heal 60% of max HP and take 40% less damage until her strike
        PARTY.forEach((id, k) => {
          const al = ctx.actors[id]; if (!al || !al.visible) return;
          const p = at(al);
          FX.sigil(p, 0xd8ffe8, 1.7, 2.2, 1.5); FX.ring(p, 0xd8ffe8, 0.2, 1.5, 0.8, 0.9);
          FX.burst(chestOf(al), [0.75, 1, 0.85], 30, 2, { up: 1 }); FX.flashLight(chestOf(al), 0xc8ffdc, 2.2, 0.8, 4);
          ctx.damage(id, ctx.swing(HEAL[id], 0.04), 'heal', k * 120);
          ctx.damage(id, 'Veil', 'heal', 650 + k * 120);
        });
        S.veil = 1;
        return true;
      }
      if (a === 'release' && i < 6) { // a moonbeam
        const b = beams[i] || { x: E.x, z: E.z };
        FX.beam(b, 0xe6eeff, 0.9, 12, 0.55); FX.ring(b, 0xe6eeff, 0.1, 1.2, 0.5, 0.9); FX.burst(new THREE.Vector3(b.x, 0.3, b.z), [0.8, 0.88, 1], 26, 3, { up: 1 });
        ctx.ring(new THREE.Vector3(b.x, 1.0, b.z), 'hit');
        ctx.damage('wraith', ctx.swing(150, 0.07));
        return true;
      }
      if (a === 'release' && i === 6) { // Moonfall
        const c = chestOf(E); S.moonfall = 0;
        FX.beam(at(E), 0xffffff, 5.4, 16, 1.6); FX.sigil(at(E), 0xe6eeff, 4.8, 1.9, 3);
        for (const [r1, d, op] of [[5.5, 0.9, 1], [7.5, 1.3, 0.7], [3.5, 0.6, 1]]) FX.ring(at(E), 0xffffff, 0.3, r1, d, op);
        FX.burst(c, [0.9, 0.95, 1], 160, 6.5, { spread: 0.6 }); FX.flashLight(c, 0xffffff, 10, 0.9, 13);
        ctx.ring(c, 'cue'); ctx.damage('wraith', ctx.swing(1150, 0.05), 'dark');
        flash(1); S.veil = Math.min(S.veil, 0.15);
        return true;
      }
      return false;
    },
    wide(ctx) { return S.veil > 0.2; },
    label(ctx) {
      const s = ctx.subject, a = s.action, p = s.progress;
      if (a === 'leave' && !s.busy) return 'Gone home up the moonlight. Press Rise';
      if (a === 'charge' && !s.busy) return 'Silver Requiem: the moon held high. Press Silver Requiem';
      if (a === 'release' && s.m.ACTIONS.release) {
        const h = s.m.ACTIONS.release.hits; let n = 0; for (let k = 0; k < 6; k++) if (p >= h[k]) n = k + 1;
        if (p < h[0]) return 'Silver Requiem';
        if (p < s.m.ACTIONS.release.cues[1]) return 'Silver Requiem: moonbeam ' + n + ' of 6';
        return p < h[6] ? 'Moonfall' : 'Moonfall lands';
      }
      if (!a && S.veil > 0.2) return 'The party is veiled: 40% less damage until her strike';
      return null;
    },
  };
})();
