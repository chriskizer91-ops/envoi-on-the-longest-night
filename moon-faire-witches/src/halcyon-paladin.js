// halcyon-paladin.js: the new Halcyon (Chris, November 16, 2026): "Halcyon ... a woman ... looks like Io, at least the body
// model of Io. There's a paladin outfit. Put the simple model of Io in the paladin outfit and repaint her face and give her a
// code glow aura" ... "if she's glowing and her face is kind of obscured by something, it might be enough."
//
// Moon Faire's base doll (Io's body, witches/doll/doll.js) wearing the paladin outfit as its light model (C8, about 50,000
// triangles, witches/doll/C8_light.js), behind the face Envoi's battle asks of Halcyon's model: root, fx, animate(phase, wb, t,
// dt), play(name, force), ACTIONS with Halcyon's own move names (dur, hits, cues), anchor(name, out), guard, reset, busy,
// action, progress, state. Nothing in the doll is changed; her moves are the doll's own (Io's), named for Halcyon's.
// Made in code on top: a pale glow round her, motes rising, and a light over her face that hides it.
// makeHalcyonPaladin({ detail, glow: 0 to 1 }).
function makeHalcyonPaladin(opts) {
  'use strict';
  opts = opts || {};
  const m = window.makeDoll({ doll: true, textures: window.DOLL_TEX, detail: opts.detail });
  const LIGHT = window.DOLLLIGHT && window.DOLLLIGHT.C8;
  m.wardrobe.wear('C8', false, { light: true, keep: (LIGHT && LIGHT.keep) || [] });
  const lit = window.DOLLLIGHT_USE(m, 'C8', true);
  const S = m.shots;

  // ---- her moves: Halcyon's names, played by the doll's own moves (seconds; hits and cues as the blows land) ----
  // A held stance ('kneel', 'hover') has no end of its own: it is held for the seconds given, then she stands.
  const PLAN = {
    gloamCleave: { move: 'crescent', hits: [2.38], cues: [1.1] },
    severance: { move: 'crescent', hits: [2.38], cues: [1.1] },
    lightDrinker: { move: 'crescent', hits: [2.38], cues: [1.1] },
    blackNoon: { move: 'crescent', hits: [2.38], cues: [1.1] },
    duskArc: { move: 'sickle', hits: [1.9], cues: [0.9] },
    counter: { move: 'sickle', hits: [1.6], cues: [] },
    vowStance: { move: 'kneel', dur: 1.6, hits: [], cues: [0.6] },
    blackNoonCharge: { move: 'hover', dur: 2.0, hits: [], cues: [0.8] },
    appear: { move: 'hover', dur: 2.0, hits: [], cues: [] },
    stagger: { move: 'kneel', dur: 1.2, hits: [], cues: [] },
    kneel: { move: 'kneel', dur: 1.7, hits: [], cues: [], hold: true },
    die: { move: 'kneel', dur: 2.6, hits: [], cues: [], hold: true },
    retreat: { move: 'walk', dur: 2.6, hits: [], cues: [] },
    hurt: { move: null, dur: 0.6, hits: [], cues: [], feel: 'hit' },
    block: { move: null, dur: 0.45, hits: [], cues: [], feel: 'stern' },
  };
  const ACTIONS = {};
  for (const n in PLAN) {
    const q = PLAN[n], d = q.dur || S[q.move] || 1;
    ACTIONS[n] = Object.freeze({ dur: d, hits: q.hits.map((x) => x / d), cues: q.cues.map((x) => x / d), hold: !!q.hold, interrupt: n === 'hurt' || n === 'block' });
  }
  Object.freeze(ACTIONS);

  // ---- her glow, made in code: a soft light round her, motes rising, and a light over her face ----
  const THREE = window.THREE, fx = new THREE.Group(); fx.name = 'halcyonGlow';
  const radial = (stops) => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64); for (const [k, col] of stops) g.addColorStop(k, col); x.fillStyle = g; x.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); return t; };
  const sprite = (tex, opacity, depthTest) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest, blending: THREE.AdditiveBlending, opacity })); s.renderOrder = 6; fx.add(s); return s; };
  const aura = sprite(radial([[0, 'rgba(210,228,255,0.7)'], [0.45, 'rgba(160,195,255,0.3)'], [1, 'rgba(120,160,255,0)']]), 0.7, true);
  // the light over her face: white at its heart, so her face cannot be seen through it, gold at its edge
  const veil = sprite(radial([[0, 'rgba(255,255,255,1)'], [0.32, 'rgba(255,246,225,0.95)'], [0.6, 'rgba(255,214,150,0.4)'], [1, 'rgba(255,200,120,0)']]), 1, true);
  const halo = opts.halo ? sprite(radial([[0, 'rgba(255,240,200,0)'], [0.62, 'rgba(255,240,200,0)'], [0.72, 'rgba(255,232,180,0.8)'], [0.8, 'rgba(255,220,160,0)'], [1, 'rgba(255,220,160,0)']]), 0.7, true) : null;
  const N = 36, mg = new THREE.BufferGeometry(), mp = new Float32Array(N * 3), mc = new Float32Array(N * 3), M = [];
  const COLS = [new THREE.Color(0xdfe9ff), new THREE.Color(0xa9c6ff), new THREE.Color(0xffe2a8), new THREE.Color(0xffffff)];
  for (let i = 0; i < N; i++) M.push({ y: Math.random() * 2.2, a: Math.random() * 6.283, r: 0.25 + Math.random() * 0.5, v: 0.25 + Math.random() * 0.45, w: (Math.random() - 0.5) * 1.2, c: COLS[i % COLS.length] });
  mg.setAttribute('position', new THREE.BufferAttribute(mp, 3)); mg.setAttribute('color', new THREE.BufferAttribute(mc, 3));
  const dot = (() => { const c = document.createElement('canvas'); c.width = c.height = 8; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(1, 1, 6, 6); const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; return t; })();
  const motes = new THREE.Points(mg, new THREE.PointsMaterial({ size: 0.045, map: dot, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.9 }));
  motes.frustumCulled = false; motes.renderOrder = 6; fx.add(motes);
  const light = new THREE.PointLight(0xbcd2ff, 1.1, 4, 2); fx.add(light);
  // her outline glows: a second skin of her light model, a little larger, drawn only from behind and as light, on her own bones
  const bodyMesh = m.root.children.find((o) => o.isSkinnedMesh && o.name === 'light_C8');
  const shell = new THREE.SkinnedMesh(bodyMesh.geometry, new THREE.MeshBasicMaterial({ color: 0xa9c8ff, transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.BackSide, skinning: true }));
  shell.material.onBeforeCompile = (sh) => { sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', 'vec3 transformed = vec3( position ) + normal * 0.022;'); };
  shell.material.customProgramCacheKey = () => 'halcyonShell';
  shell.name = 'halcyonShell'; shell.frustumCulled = false; shell.renderOrder = 5; m.root.add(shell); shell.bind(m.skeleton, new THREE.Matrix4());
  // her face's own paint, a shade paler and cooler than Io's (under the light it is hardly seen)
  if (m.meshes.face && m.meshes.face.material && m.meshes.face.material.color) m.meshes.face.material.color.multiply(new THREE.Color(0.86, 0.9, 1.0));

  const A = {
    root: m.root, fx, model: m, paladin: true, ACTIONS, state: { drink: 0, charge: 0, crack: 0, sink: 0 }, action: null, glow: opts.glow == null ? 1 : opts.glow,
    triangles: (lit && lit.tris) || 50000,
  };
  let cur = null, curT = 0, guarding = false, held = false, feelT = 0;
  A.play = (name, force) => {
    const q = PLAN[name]; if (!q) return false;
    if (cur && !force && !held) return false;
    held = false; cur = name; curT = 0; A.action = name;
    if (q.move) m.play(q.move);
    if (q.feel) { m.setFeel(q.feel); feelT = q.dur || 0.6; }
    return true;
  };
  Object.defineProperty(A, 'progress', { get() { if (!cur) return -1; return Math.min(1, curT / ACTIONS[cur].dur); } });
  Object.defineProperty(A, 'busy', { get() { return !!cur && !held; } });
  A.guard = (on) => { guarding = !!on; };
  A.reset = () => { cur = null; held = false; A.action = null; m.setFeel(null); m.play('idle'); };
  const _v = new THREE.Vector3(), _f = new THREE.Vector3();
  A.anchor = (name, out) => {
    out = out || new THREE.Vector3(); m.root.updateMatrixWorld(true); const SK = m.SK;
    switch (name) {
      case 'head': SK.head.getWorldPosition(out); out.y += 0.12; return out;
      case 'crown': SK.head.getWorldPosition(out); out.y += 0.45; return out;
      case 'blade': case 'handR': return SK.handR.getWorldPosition(out);
      case 'handL': return SK.handL.getWorldPosition(out);
      case 'feet': return out.copy(m.root.position);
      case 'hit': case 'chest': default: SK.spine3.getWorldPosition(out); out.y += 0.02; return out;
    }
  };
  A.animate = (phase, wb, t, dt) => {
    dt = dt || 0;
    if (cur) {
      curT += dt; const a = ACTIONS[cur], q = PLAN[cur];
      if (curT >= a.dur) { if (a.hold) { held = true; curT = a.dur; } else { cur = null; A.action = null; } }
      else if (q.move && m.move !== q.move && q.dur) m.play(q.move);       // a held stance stays held for its seconds
    }
    if (feelT > 0) { feelT -= dt; if (feelT <= 0) m.setFeel(null); }
    if (!cur) { const want = wb > 0.5 ? 'walk' : 'idle'; if (m.move !== want) m.play(want); }
    m.animate(dt);
    // Io's own practice friends and target, which her spells were built round, are not Halcyon's
    if (m.spellFx) { m.spellFx.dummy.visible = false; m.spellFx.ally.visible = false; m.spellFx.ally2.visible = false; const FA = m.wood && m.wood.FALLEN; if (FA) { if (FA.isObject3D) FA.visible = false; else if (FA.G) FA.G.visible = false; } }
    // the glow follows her: round her body, over her face, a ring above her head; the motes rise round her
    const g = A.glow; fx.visible = m.root.visible && g > 0.01;
    if (!fx.visible) return;
    m.root.updateMatrixWorld(true);
    m.SK.spine3.getWorldPosition(_v); aura.position.copy(_v); aura.scale.set(1.5, 2.3, 1); aura.material.opacity = 0.6 * g * (0.9 + 0.1 * Math.sin((t || 0) * 2.1));
    light.position.copy(_v); light.intensity = 1.1 * g;
    m.SK.head.getWorldPosition(_v); _f.set(0, 0, 1).applyQuaternion(m.root.quaternion);
    veil.position.copy(_v).addScaledVector(_f, 0.11); veil.position.y += 0.06; veil.scale.setScalar(0.34 + 0.015 * Math.sin((t || 0) * 3.3)); veil.material.opacity = Math.min(1, 1.2 * g);
    if (halo) { halo.position.copy(_v); halo.position.y += 0.32; halo.scale.setScalar(0.62); halo.material.opacity = 0.7 * g; }
    shell.material.opacity = 0.32 * g * (0.85 + 0.15 * Math.sin((t || 0) * 2.6));
    const px = m.root.position.x, pz = m.root.position.z;
    for (let i = 0; i < N; i++) {
      const q = M[i]; q.y += q.v * dt; q.a += q.w * dt; if (q.y > 2.3) { q.y = 0; q.r = 0.25 + Math.random() * 0.5; }
      mp[i * 3] = px + Math.cos(q.a) * q.r; mp[i * 3 + 1] = q.y; mp[i * 3 + 2] = pz + Math.sin(q.a) * q.r;
      const fade = Math.sin(Math.PI * q.y / 2.3) * g; mc[i * 3] = q.c.r * fade; mc[i * 3 + 1] = q.c.g * fade; mc[i * 3 + 2] = q.c.b * fade;
    }
    mg.attributes.position.needsUpdate = true; mg.attributes.color.needsUpdate = true;
  };
  // her pictures decoded: a page may wait for this before showing her
  A.ready = window.DOLLLIGHT_PREP ? window.DOLLLIGHT_PREP(m, 'C8') : Promise.resolve();
  A.reset();
  return A;
}
