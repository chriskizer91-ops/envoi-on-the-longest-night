// cast.js: the models this cutscene may use, how each is built at each detail (light, phone, laptop), and what each
// needs from the player: a creature's move sounds and tremors, a person's walk, breath and footsteps. A new creature's
// first meeting adds its model here, with its sounds, and needs no new player.
// Defines cutsceneCast() only. Each entry: { kind: 'person' | 'creature', make(quality, castEntry), stride (walk-cycle
//   radians a metre), mouth ([across, up, ahead] from her head anchor, for her breath), steps (her footstep sound),
//   pose(actor, name), cue(actor, what, args), anchor(actor, part, out), after(model, actor, dt), sound(snd, id, o),
//   sounds ({ move: [[progress, sound, gain], ...] }), hitShake, cueShake ({ move: [[progress, shake, ground ring]] }),
//   warm (its warm ring's radius), heart (its heartbeat is heard close to) }.
function cutsceneCast() {
  'use strict';
  // the game's models are painted for a plain renderer: their colours are turned linear so they sit in the film camera's
  // light as they do in the game's, as the Io study puts the game's Io beside its own; they cast and take the moon's shadow
  function filmLight(m) {
    const seen = new Set();
    for (const g of [m.root, m.fx]) if (g) g.traverse((o) => {
      if (o.isMesh || o.isSkinnedMesh) { o.castShadow = true; o.receiveShadow = true; }
      if (!o.material) return;
      for (const mt of Array.isArray(o.material) ? o.material : [o.material]) {
        if (seen.has(mt)) continue; seen.add(mt);
        if (mt.color) mt.color.convertSRGBToLinear(); if (mt.emissive) mt.emissive.convertSRGBToLinear();
        for (const k of ['map', 'emissiveMap']) if (mt[k]) { mt[k].encoding = THREE.sRGBEncoding; mt[k].needsUpdate = true; }
        mt.needsUpdate = true;
      }
    });
    return m;
  }
  // Sol's blade sets its glow every frame in the game's colours; here they are turned linear after each frame as well
  function solBlade(m) {
    const mats = { edge: null, steel: null };
    m.root.traverse((o) => {
      if (!o.material) return;
      for (const mt of Array.isArray(o.material) ? o.material : [o.material]) {
        if (!mt.color || !mt.emissive) continue;
        if (mt.color.getHex() === 0xffe0a0 && Math.abs(mt.metalness - .2) < 1e-3) mats.edge = mt;
        if (mt.color.getHex() === 0xe0a24a && Math.abs(mt.metalness - .45) < 1e-3) mats.steel = mt;
      }
    });
    return mats;
  }
  const BRAMBLE_SOUNDS = {
    // the field study's (page.js, SOUNDS): wood, leaves, soil, roots and air, nothing that roars
    appear: [[0, 'shoots', .8], [.12, 'groan', 1], [.42, 'step', 1], [.45, 'step', .8], [.58, 'groan', .7], [.62, 'rustle', 1], [.66, 'breath', .8]],
    alert: [[.04, 'creak', .8], [.12, 'rustle', .8]],
    bloom: [[.08, 'bloom', 1], [.4, 'breath', .5]],
    rest: [[0, 'creak', .5], [.25, 'rustle', .5], [.5, 'breath', .45]]
  };
  return {
    colossus: {
      kind: 'creature', warm: 20, heart: true,
      // the game meets it at levels 16 to 20: its level darkens it and lengthens its thorns, as the fight's model does
      make: (q, c) => {
        const m = makeBrambleColossus({ shadows: true, detail: { light: .25, phone: .25, laptop: 1 }[q] || .25, level: c.level || 18 });
        m.state.frost = .55; m.state.wind = { x: .36, z: .12 };
        return m;
      },
      pose(a, name) {
        const m = a.m; m.reset(); m.state.open = 0; m.state.target = null;
        if (name === 'rest') m.play('rest', true);
      },
      sound: (snd, id, o) => snd.bramble(id, o),
      sounds: BRAMBLE_SOUNDS,
      // its blows and its waking shake the camera and run a ring of wind out through the grass
      hitShake: { lance: 1, slam: 1.7 },
      cueShake: { appear: [[.04, .7, 1.2], [.42, .6, 0], [.5, .8, .8], [.62, 1, 1.2]], alert: [[.22, .2, 0]] },
      cue(a, what, arg, E) {
        const m = a.m;
        // one cane lifts and tastes the air: the one whose tip is nearest to whoever it has felt
        if (what === 'taste') {
          let k = typeof arg[0] === 'number' ? arg[0] : -1;
          if (k < 0) {
            const t = E.actors[String(arg[0] || '').replace('toward:', '')], v = new THREE.Vector3(); let best = 1e9;
            for (let i = 0; i < 10; i++) { m.anchor('cane' + i, v); const d = t ? Math.hypot(v.x - t.x, v.z - t.z) - (i < 4 ? 3 : 0) : i; if (d < best) { best = d; k = i; } }
          }
          a.tasting = k; m.taste(k);
          if (E.snd) { E.snd.bramble('creak', { gain: .45, far: .1 }); E.snd.bramble('rustle', { gain: .35, far: .1 }); }
        } else if (what === 'target') {
          const t = E.actors[arg[0]]; m.state.target = t ? { x: t.x, y: 1.15, z: t.z } : null;
        } else if (what === 'pose') this.pose(a, arg[0]);
      },
      anchor(a, part, out) { if (part === 'taste') { a.m.anchor('cane' + (a.tasting >= 0 ? a.tasting : 7), out); return true; } return false; }
    },
    io: {
      kind: 'person', stride: 4.4, mouth: [0, -.075, .085], steps: 'step',
      // the cutscene Io (Chris's request: in cutscenes, her paper doll's face); her bones, clothes and moves are the game's
      make: (q) => makeIoCutscene({ detail: { light: .25, phone: .32, laptop: 1 }[q] || .32, shadows: true })
    },
    sol: {
      kind: 'person', stride: 4.2, mouth: [0, -.1, .1], steps: 'step',
      make: (q) => { const m = filmLight(makeSol({ detail: { light: .5, phone: .5, laptop: 1 }[q] || .5 })); m.blade = solBlade(m); return m; },
      after(m) { if (m.blade.edge) m.blade.edge.emissive.convertSRGBToLinear(); if (m.blade.steel) m.blade.steel.emissive.convertSRGBToLinear(); }
    }
  };
}
