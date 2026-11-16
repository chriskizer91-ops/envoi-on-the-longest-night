// trance.js: the glow a witch takes on in her trance and in her strongest move, made in code: a light of her colour,
// her own surfaces lit from within along their edges, a low mist turning round her feet, and square motes like pixels
// rising off her and drifting up. Chris, November 15: "the Jester doing Curtain Call ... glowing purple or purple mist
// or pixel particles"; both witches get one, each in her own colour.
//   const tr = makeTrance(scene, actor, { color: 0xb05cff, colors: [...], mist: true })
//   tr.set(0 to 1) eases toward that level; tr.update(dt, t, pointScale) every frame (kit.onFrame does it); tr.level
// The actor is a kit actor (its model's root is lit; its pos is followed). Nothing is added or removed while it runs.
function makeTrance(scene, actor, o) {
  'use strict';
  o = o || {};
  const COL = new THREE.Color(o.color || 0xb05cff);
  const SHADES = (o.colors || [0xb05cff, 0x8a3cff, 0xe0a8ff, 0xff6ad5, 0xffffff]).map((c) => new THREE.Color(c));
  const N = o.motes || 150, H = o.height || 2.2;
  let level = 0, want = 0;
  // the motes: hard-edged squares, so they read as pixels, each rising from round her feet and fading out above her
  const sq = (() => { const c = document.createElement('canvas'); c.width = c.height = 8; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(1, 1, 6, 6); const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; return t; })();
  const pos = new Float32Array(N * 3), col = new Float32Array(N * 3), M = [];
  for (let i = 0; i < N; i++) M.push({ a: Math.random() * 6.283, r: 0.25 + Math.random() * 0.55, y: Math.random() * H, v: 0.35 + Math.random() * 0.75, w: (Math.random() - 0.5) * 1.6, c: SHADES[i % SHADES.length] });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const pm = new THREE.PointsMaterial({ size: o.size || 0.055, map: sq, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true, opacity: 0 });
  const pts = new THREE.Points(g, pm); pts.frustumCulled = false; pts.renderOrder = 5; scene.add(pts);
  // the mist: soft round clouds of her colour turning slowly low round her
  const soft = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  const mist = [];
  if (o.mist !== false) for (let i = 0; i < 9; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: soft, color: COL, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 })); s.renderOrder = 4; scene.add(s); mist.push({ s, a: i / 9 * 6.283, r: 0.55 + 0.35 * Math.random(), y: 0.12 + 0.45 * Math.random(), k: 0.7 + 0.6 * Math.random() }); }
  // her light, and her own surfaces lit from within
  const light = new THREE.PointLight(COL, 0, 5, 2); scene.add(light);
  const mats = [];
  actor.m.root.traverse((x) => { if (!x.material) return; for (const m of (Array.isArray(x.material) ? x.material : [x.material])) if (m.emissive && !mats.some((q) => q.m === m)) mats.push({ m, e: m.emissive.clone(), i: m.emissiveIntensity == null ? 1 : m.emissiveIntensity }); });
  const tmp = new THREE.Color();
  function update(dt, t) {
    level += (want - level) * Math.min(1, dt * (want > level ? 2.5 : 1.5));
    const k = level, px = actor.m.root.position.x, pz = actor.m.root.position.z;
    pts.visible = k > 0.01; pm.opacity = Math.min(1, k * 1.2);
    if (pts.visible) {
      for (let i = 0; i < N; i++) { const q = M[i]; q.y += q.v * dt * (0.6 + 0.8 * k); q.a += q.w * dt; if (q.y > H) { q.y = 0; q.r = 0.25 + Math.random() * 0.55; }
        const r = q.r * (1 + 0.35 * q.y / H); pos[i * 3] = px + Math.cos(q.a) * r; pos[i * 3 + 1] = q.y; pos[i * 3 + 2] = pz + Math.sin(q.a) * r;
        const fade = Math.sin(Math.PI * q.y / H), tw = 0.6 + 0.4 * Math.sin(t * 9 + i); col[i * 3] = q.c.r * fade * tw; col[i * 3 + 1] = q.c.g * fade * tw; col[i * 3 + 2] = q.c.b * fade * tw; }
      g.attributes.position.needsUpdate = true; g.attributes.color.needsUpdate = true;
    }
    for (const m of mist) { m.a += dt * 0.35 * m.k; m.s.visible = k > 0.01; m.s.position.set(px + Math.cos(m.a) * m.r, m.y + 0.06 * Math.sin(t * 1.3 + m.a), pz + Math.sin(m.a) * m.r * 0.8); m.s.scale.setScalar(1.3 * m.k); m.s.material.opacity = 0.22 * k * (0.7 + 0.3 * Math.sin(t * 2 + m.a)); }
    light.intensity = 1.5 * k * (0.85 + 0.15 * Math.sin(t * 6)); light.position.set(px, 1.25, pz + 0.3);
    // a tint from within, not a wash: her own colours still read through it (the first strength turned her pink-white)
    const glow = 0.12 * k * (0.8 + 0.2 * Math.sin(t * 5));
    for (const q of mats) { tmp.copy(q.e).lerp(COL, Math.min(1, 0.3 * k)); q.m.emissive.copy(tmp); q.m.emissiveIntensity = q.i + glow; }
  }
  return { set(v) { want = Math.max(0, Math.min(1, v)); }, update, get level() { return level; } };
}
