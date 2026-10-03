// battlefield.js: living battlefields (handoff, section 3): the painted battles answer the fight, as the wild meadow on
// the creature benches does (3d-model-new-character-ideas/bramble-horror/meadow.js), but in front of the paintings, so they
// keep their look. Every painting gets its own air: drifting ground mist, fireflies, snow, warm sparks off the Ember
// Line. Big blows send a shockwave through the mist and throw up dust and turf; roars and heavy blows put birds or bats
// up out of the painted trees and shake leaves (or snow) down; and a boss's second phase brings a red storm: embers
// rising, wind, rain and red lightning (the screen tints the painting's sky; see onLightning).
// three.js r128 (global THREE). makeBattlefield({ id, g(u, v) -> { x, z } on the floor, IW, IH, onLightning(k) })
//   -> { grp, update(dt, t), impact({ x, z }, k), roar(k), shake(px), storm(v 0 to 1), dispose() }
// Everything is a handful of draw calls: points for snow, fireflies, sparks, debris and embers, sprites for the mist and
// the birds, and lines for the rain. Nothing here changes how a fight plays.
function makeBattlefield(o) {
  'use strict';
  const TAU = Math.PI * 2, rnd = (a, b) => a + Math.random() * (b - a), cl = (v, a, b) => (v < a ? a : v > b ? b : v);
  // each painting's air: sky (the painting's skyline, in its pixels, for the red storm's wash), mist (0 to 1), fireflies (how many), snow (0 to 1), sparks (warm motes rising, how many),
  // fall: what a heavy blow shakes down ('leaf', 'snow' or nothing), fly: what a roar puts up ('birds', 'bats' or nothing)
  const AIR = {
    'night-square': { sky: 190, mist: 0.35, fireflies: 8, fall: 'leaf', fly: 'bats', leaf: [0.42, 0.3, 0.2] },
    'thornwood-bridge': { sky: 170, mist: 0.5, fireflies: 12, fall: 'leaf', fly: 'bats', leaf: [0.45, 0.16, 0.2] },
    'gloamwood-road': { sky: 120, mist: 0.6, fireflies: 18, fall: 'leaf', fly: 'bats', leaf: [0.32, 0.36, 0.2] },
    'warm-road': { sky: 180, mist: 0.3, fireflies: 14, sparks: 26, fall: 'leaf', fly: 'birds', leaf: [0.6, 0.36, 0.16] },
    'bogmire-boardwalk': { sky: 130, mist: 0.9, fireflies: 10, ffColor: [0.55, 1, 0.55], fly: 'bats' },
    'dawnroost-node': { sky: 160, mist: 0.2, sparks: 34, fly: 'birds' },
    'northern-crossroads': { sky: 160, mist: 0.5, snow: 0.25, fall: 'leaf', fly: 'birds', leaf: [0.4, 0.32, 0.22] },
    'frozen-road': { sky: 150, mist: 0.4, snow: 1, fall: 'snow', fly: 'birds' },
    'dead-moonwell': { sky: 230, mist: 0.7, snow: 0.6, fly: 'bats' },
  };
  const A = AIR[o.id] || { mist: 0.4, fly: 'bats' };
  const grp = new THREE.Group(); grp.name = 'Battlefield';
  // the floor the painting shows: its corners, front (the bottom of the picture) and back (a third of the way down)
  const f0 = o.g(0, o.IH), f1 = o.g(o.IW, o.IH), b0 = o.g(0, o.IH * 0.33), b1 = o.g(o.IW, o.IH * 0.33);
  const X0 = Math.min(f0.x, b0.x) - 2, X1 = Math.max(f1.x, b1.x) + 2, Z0 = Math.min(b0.z, b1.z), Z1 = Math.max(f0.z, f1.z) + 1;
  const cvs = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); return t; };
  const soft = cvs(64, 64, (g, w) => { const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.35, 'rgba(255,255,255,0.55)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, w, w); });
  const puffTex = cvs(128, 128, (g, w) => {
    for (let i = 0; i < 9; i++) { const x = w * rnd(0.3, 0.7), y = w * rnd(0.35, 0.65), r0 = w * rnd(0.18, 0.32), r = g.createRadialGradient(x, y, 0, x, y, r0); r.addColorStop(0, 'rgba(255,255,255,0.35)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, w, w); }
  });
  const disposables = [soft, puffTex];
  const keep = (x) => { disposables.push(x); return x; };

  // ---------- a pool of points: each with a place, a speed, a life and a color ----------
  function pool(n, size, opts) {
    const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), geo = keep(new THREE.BufferGeometry());
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const mat = keep(new THREE.PointsMaterial({ size, map: soft, vertexColors: true, transparent: true, depthWrite: false, blending: opts.add ? THREE.AdditiveBlending : THREE.NormalBlending, opacity: opts.opacity == null ? 1 : opts.opacity }));
    const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; pts.renderOrder = opts.order || 4; grp.add(pts);
    const P = []; for (let i = 0; i < n; i++) { P.push({ x: 0, y: -99, z: 0, vx: 0, vy: 0, vz: 0, life: 0, max: 1, c: [1, 1, 1], ph: Math.random() * TAU, on: false }); pos[i * 3 + 1] = -99; }
    let next = 0;
    return {
      P, pts,
      spawn(p) { const q = P[next]; next = (next + 1) % n; Object.assign(q, { vx: 0, vy: 0, vz: 0, life: 0, max: 1, grav: 0, drag: 0, flut: 0 }, p, { on: true }); return q; },
      write(fn) {
        for (let i = 0; i < n; i++) {
          const q = P[i]; if (!q.on) { pos[i * 3 + 1] = -99; continue; }
          const k = fn ? fn(q) : 1;
          pos[i * 3] = q.x; pos[i * 3 + 1] = q.y; pos[i * 3 + 2] = q.z;
          col[i * 3] = q.c[0] * k; col[i * 3 + 1] = q.c[1] * k; col[i * 3 + 2] = q.c[2] * k;
        }
        geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true;
      },
    };
  }
  // the falling and flying bits: debris (turf, dust, leaves, snow clumps) in normal blending, glows (sparks, embers) added
  const debris = pool(160, 0.16, {});
  const glows = pool(140, 0.13, { add: true, order: 5 });
  function stepPool(pl, dt, wind) {
    for (const q of pl.P) {
      if (!q.on) continue;
      q.life += dt; if (q.life >= q.max || q.y < -0.5) { q.on = false; continue; }
      q.vy -= (q.grav || 0) * dt;
      const dr = Math.exp(-(q.drag || 0) * dt); q.vx *= dr; q.vy *= dr; q.vz *= dr;
      q.x += (q.vx + wind * (q.blow || 0)) * dt + (q.flut ? Math.sin(q.life * 5 + q.ph) * q.flut * dt : 0); q.y += q.vy * dt; q.z += q.vz * dt;
      if (q.y < 0.02 && q.vy < 0) { if (q.settle) { q.y = 0.02; q.vx = q.vz = q.vy = 0; } else q.on = false; }
    }
  }
  const fade = (q) => { const u = q.life / q.max; return Math.min(1, u * 8) * (1 - Math.max(0, (u - 0.7) / 0.3)); };

  // ---------- the air that is always there ----------
  // drifting ground mist: soft puffs that a shockwave pushes away
  const mist = [];
  for (let i = 0; i < Math.round(9 * (A.mist || 0)); i++) {
    const m = new THREE.Sprite(keep(new THREE.SpriteMaterial({ map: puffTex, color: 0xb8c0e8, transparent: true, depthWrite: false, opacity: 0 })));
    const s = rnd(5, 9); m.scale.set(s, s * 0.45, 1); m.renderOrder = 3;
    m.userData = { x: rnd(X0, X1), z: rnd(Z0, Z1), y: rnd(0.5, 1.3), vx: 0, vz: 0, a: rnd(0.06, 0.12) * (0.6 + 0.6 * A.mist), drift: rnd(0.15, 0.4), ph: Math.random() * TAU };
    grp.add(m); mist.push(m);
  }
  // fireflies: little lights that wander and blink
  const ff = A.fireflies ? pool(A.fireflies, 0.11, { add: true, order: 5 }) : null;
  if (ff) for (const q of ff.P) Object.assign(q, { on: true, x: rnd(X0, X1), y: rnd(0.4, 2.4), z: rnd(Z0, Z1), c: A.ffColor || [1, 0.85, 0.4], max: 1e9, hx: 0, hz: 0 });
  // warm sparks off the Ember Line and the living node, rising and dying
  let sparkT = 0;
  // snow, falling the whole fight through
  const snowN = Math.round(360 * (A.snow || 0)), snow = snowN ? pool(snowN, 0.075, { opacity: 0.95, order: 4 }) : null;
  if (snow) for (const q of snow.P) Object.assign(q, { on: true, x: rnd(X0 - 4, X1 + 4), y: rnd(0, 16), z: rnd(Z0 - 10, Z1), c: [0.92, 0.94, 1], max: 1e9, vy: -rnd(0.5, 1.1), flut: rnd(0.2, 0.6), ph: Math.random() * TAU });

  // ---------- the creatures in the trees: birds or bats, put up by a roar ----------
  const birdTex = [0, 1].map((f) => cvs(64, 32, (g, w, h) => {
    g.fillStyle = A.fly === 'bats' ? '#120b18' : '#16131c'; g.beginPath();
    const up = f ? -9 : 7;
    if (A.fly === 'bats') { g.moveTo(32, 16); g.quadraticCurveTo(18, 16 + up, 2, 12 + up); g.lineTo(10, 18); g.lineTo(18, 16); g.lineTo(26, 20); g.lineTo(32, 18); g.lineTo(38, 20); g.lineTo(46, 16); g.lineTo(54, 18); g.lineTo(62, 12 + up); g.quadraticCurveTo(46, 16 + up, 32, 16); }
    else { g.moveTo(32, 18); g.quadraticCurveTo(20, 10 + up, 3, 14 + up); g.quadraticCurveTo(18, 14 + up * 0.5, 30, 21); g.lineTo(34, 21); g.quadraticCurveTo(46, 14 + up * 0.5, 61, 14 + up); g.quadraticCurveTo(44, 10 + up, 32, 18); }
    g.fill();
  }));
  disposables.push(...birdTex);
  const birds = [];
  for (let i = 0; i < 12; i++) {
    const s = new THREE.Sprite(keep(new THREE.SpriteMaterial({ map: birdTex[0], transparent: true, depthWrite: false })));
    s.visible = false; s.renderOrder = 6; grp.add(s); birds.push({ s, on: false, t: 0, vx: 0, vy: 0, vz: 0, flap: rnd(9, 13), size: 0 });
  }
  let birdsT = -9;
  function flush(k) {
    if (!A.fly || birdsT > -1) return; birdsT = 0;
    const n = Math.round(5 + 6 * cl(k, 0, 1)), side = Math.random() < 0.5 ? -1 : 1;
    for (let i = 0; i < n && i < birds.length; i++) {
      const b = birds[i], x = side < 0 ? rnd(X0, X0 + 6) : rnd(X1 - 6, X1), z = rnd(Z0, Z0 + 10);
      Object.assign(b, { on: true, t: -rnd(0, 0.5), x, y: rnd(5, 9), z, vx: -side * rnd(1.5, 4), vy: rnd(3, 6), vz: rnd(-3, -1), size: A.fly === 'bats' ? rnd(0.7, 1.1) : rnd(0.8, 1.2) });
    }
  }

  // ---------- the red storm of a boss's second phase: embers, wind, rain and red lightning ----------
  const RN = 220, rainPos = new Float32Array(RN * 6), rainGeo = keep(new THREE.BufferGeometry());
  rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
  const rainMat = keep(new THREE.LineBasicMaterial({ color: 0xffb0a0, transparent: true, opacity: 0, depthWrite: false }));
  const rain = new THREE.LineSegments(rainGeo, rainMat); rain.frustumCulled = false; rain.renderOrder = 6; grp.add(rain);
  const drops = []; for (let i = 0; i < RN; i++) drops.push({ x: rnd(X0 - 4, X1 + 4), y: rnd(0, 18), z: rnd(Z0 - 8, Z1), v: rnd(14, 19) });
  let storm = 0, stormTo = 0, boltT = rnd(2, 4), emberT = 0;

  // ---------- what the fight does to it ----------
  // a big blow lands at p: a shockwave rolls out through the mist, dust and turf fly
  function impact(p, k) {
    k = cl(k || 1, 0.3, 2.5);
    for (const m of mist) {
      const u = m.userData, dx = u.x - p.x, dz = u.z - p.z, d = Math.hypot(dx, dz) || 1;
      if (d < 9 * k) { const f = (1 - d / (9 * k)) * 4 * k; u.vx += dx / d * f; u.vz += dz / d * f; }
    }
    const dirt = o.id === 'frozen-road' || o.id === 'dead-moonwell' ? [0.86, 0.88, 0.95] : o.id === 'bogmire-boardwalk' ? [0.24, 0.18, 0.14] : [0.32, 0.25, 0.2];
    for (let i = 0; i < Math.round(26 * k); i++) {
      const a = Math.random() * TAU, sp = rnd(1.5, 4.5) * k;
      debris.spawn({ x: p.x + Math.cos(a) * 0.4, y: 0.1, z: p.z + Math.sin(a) * 0.4, vx: Math.cos(a) * sp, vy: rnd(2.5, 6) * Math.sqrt(k), vz: Math.sin(a) * sp, grav: 11, drag: 0.6, max: rnd(0.8, 1.4), c: dirt.map((c) => c * rnd(0.8, 1.15)) });
    }
    for (let i = 0; i < Math.round(14 * k); i++) {
      const a = Math.random() * TAU, sp = rnd(2, 5) * k;
      debris.spawn({ x: p.x, y: 0.2, z: p.z, vx: Math.cos(a) * sp, vy: rnd(0.3, 1.2), vz: Math.sin(a) * sp, grav: -0.2, drag: 2.2, max: rnd(1.2, 2), c: [0.55, 0.52, 0.5] });
    }
    if (k >= 1) shake(10 * k);
  }
  // a roar, or the ground shaking: whatever is in the trees comes down or goes up
  function roar(k) { flush(k || 1); shake(12 * (k || 1)); }
  let fallT = 0;
  function shake(px) {
    if (px < 9 || fallT > 0 || !A.fall) return; fallT = 0.8;
    const n = Math.round(cl(px / 10, 1, 2.5) * 14);
    for (let i = 0; i < n; i++) {
      const left = Math.random() < 0.5, x = left ? rnd(X0, X0 + 7) : rnd(X1 - 7, X1), z = rnd(Z0, Z1 * 0.6);
      if (A.fall === 'snow') debris.spawn({ x, y: rnd(5, 10), z, vy: -rnd(1, 2.5), grav: 3, drag: 0.4, flut: 0.3, max: rnd(2, 3.5), c: [0.95, 0.96, 1], blow: 0.4 });
      else debris.spawn({ x, y: rnd(4, 9), z, vy: -rnd(0.4, 0.9), grav: 0.6, drag: 1.6, flut: rnd(1.2, 2.4), ph: Math.random() * TAU, max: rnd(4, 6), c: (A.leaf || [0.4, 0.3, 0.2]).map((c) => c * rnd(0.75, 1.25)), blow: 1, settle: true });
    }
    if (Math.random() < 0.35) flush(0.5);
  }

  // ---------- every frame ----------
  function update(dt, t) {
    if (!(dt > 0)) dt = 0;
    const wind = 0.4 + 2.6 * storm + 0.3 * Math.sin(t * 0.37);
    fallT = Math.max(0, fallT - dt); if (birdsT > -1) { birdsT += dt; if (birdsT > 6) birdsT = -9; }
    // the mist drifts, and settles back after a shockwave
    for (const m of mist) {
      const u = m.userData, k = Math.exp(-dt * 0.8);
      u.vx *= k; u.vz *= k; u.x += (u.vx + u.drift * (0.6 + wind * 0.5)) * dt; u.z += u.vz * dt;
      if (u.x > X1 + 4) u.x = X0 - 4; if (u.x < X0 - 6) u.x = X1 + 3;
      m.position.set(u.x, u.y + 0.15 * Math.sin(t * 0.3 + u.ph), u.z);
      m.material.opacity = u.a * (0.75 + 0.25 * Math.sin(t * 0.21 + u.ph)) * (1 - 0.6 * storm);
    }
    if (ff) {
      for (const q of ff.P) {
        q.hx += (rnd(-1, 1) - q.hx) * dt * 0.6; q.hz += (rnd(-1, 1) - q.hz) * dt * 0.6;
        q.x += q.hx * 0.5 * dt; q.z += q.hz * 0.5 * dt; q.y = cl(q.y + Math.sin(t * 0.9 + q.ph) * 0.2 * dt, 0.3, 2.8);
        if (q.x < X0) q.x = X1; if (q.x > X1) q.x = X0; if (q.z < Z0) q.z = Z1; if (q.z > Z1) q.z = Z0;
      }
      ff.write((q) => Math.max(0, Math.sin(t * 1.7 + q.ph)) * (1 - storm));
    }
    if (snow) {
      for (const q of snow.P) {
        q.y += q.vy * (1 + storm) * dt; q.x += (Math.sin(t * 0.8 + q.ph) * q.flut + wind * 0.5) * dt;
        if (q.y < 0) { q.y = rnd(12, 16); q.x = rnd(X0 - 4, X1 + 4); q.z = rnd(Z0 - 10, Z1); }
        if (q.x > X1 + 6) q.x = X0 - 4;
      }
      snow.write(null);
    }
    if (A.sparks) {
      sparkT += dt * A.sparks * 0.25;
      while (sparkT > 1) { sparkT -= 1; glows.spawn({ x: rnd(X0 + 2, X1 - 2), y: rnd(0, 0.3), z: rnd(Z0 + 4, Z1), vy: rnd(0.4, 1.1), vx: rnd(-0.2, 0.2), flut: 0.4, max: rnd(2, 3.5), c: [1, rnd(0.45, 0.7), 0.2] }); }
    }
    // the red storm: embers off the ground, rain, and now and then red lightning
    storm += (stormTo - storm) * Math.min(1, dt * 0.8);
    if (storm > 0.02) {
      emberT += dt * 30 * storm;
      while (emberT > 1) { emberT -= 1; glows.spawn({ x: rnd(X0, X1), y: 0.1, z: rnd(Z0, Z1), vy: rnd(0.8, 2), vx: rnd(-0.3, 0.3) + wind * 0.3, flut: 0.6, max: rnd(1.5, 3), c: [1, rnd(0.2, 0.42), 0.1] }); }
      boltT -= dt; if (boltT < 0 && storm > 0.5) { boltT = rnd(3, 6.5); if (o.onLightning) o.onLightning(rnd(0.6, 1)); }
    }
    rainMat.opacity = 0.35 * storm; rain.visible = storm > 0.02;
    if (rain.visible) {
      for (let i = 0; i < RN; i++) {
        const d = drops[i]; d.y -= d.v * dt; d.x += wind * 0.6 * dt;
        if (d.y < 0) { d.y = rnd(14, 18); d.x = rnd(X0 - 4, X1 + 4); d.z = rnd(Z0 - 8, Z1); }
        rainPos.set([d.x, d.y, d.z, d.x - wind * 0.05, d.y + 0.55, d.z], i * 6);
      }
      rainGeo.attributes.position.needsUpdate = true;
    }
    stepPool(debris, dt, wind); stepPool(glows, dt, wind);
    debris.write(fade); glows.write(fade);
    // birds and bats, flapping away out of the picture
    for (const b of birds) {
      if (!b.on) continue;
      b.t += dt; if (b.t < 0) continue;
      b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt; b.vy += 1.2 * dt;
      b.s.visible = true; b.s.position.set(b.x, b.y, b.z);
      b.s.material.map = birdTex[Math.floor(b.t * b.flap) % 2]; b.s.scale.set(b.size, b.size * 0.5, 1);
      b.s.material.opacity = Math.min(1, b.t * 4) * (1 - cl((b.t - 3.5) / 1.5, 0, 1));
      if (b.t > 5) { b.on = false; b.s.visible = false; }
    }
  }
  function dispose() { for (const d of disposables) if (d && d.dispose) d.dispose(); for (const m of mist) m.material.dispose(); for (const b of birds) b.s.material.dispose(); }
  return { grp, update, impact, roar, shake, storm(v) { stormTo = cl(v, 0, 1); }, dispose, get air() { return A; } };
}
