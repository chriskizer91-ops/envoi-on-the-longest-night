// stage-noctara.js: Noctara's battle staging for the bench, ported from reference/demos/noctara-in-the-night-square.html.
// Blackout: the light leaves, Halcyon strikes the Witch in the dark (only her cold blue eyes and blade show),
// and the damage lands when the light returns. Frost Dust: the party slows, then takes the damage as time
// speeds back up. Void Sphere hits the whole party; Crown Shards hit one target three times.
window.STAGES = window.STAGES || {};
window.STAGES.noctara = (function () {
  const BO = { dark: 0, k: 'idle' };
  const FR = { on: false, t: 0, dur: 10, thaw: 1.6, slow: 1, flakes: [], hits: 0 };
  const TRN = 16;
  let eyes, bladeGlow, trail, trGeo, trPos, trCol, tipH, midH, frostEdge = null, fx2 = null;
  const PARTY = ['witch', 'sol'];
  let THREE, V1, V2;

  function knightHome(ctx) { const k = ctx.actors.halcyon; if (!k) return; k.x = k.home.x; k.z = k.home.z; k.yaw = k.home.yaw; }

  function makeFrostEdge(w, h) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
    const gr = x.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.hypot(w, h) * 0.56);
    gr.addColorStop(0, 'rgba(190,225,255,0)'); gr.addColorStop(0.62, 'rgba(170,215,255,0.16)'); gr.addColorStop(1, 'rgba(225,242,255,0.7)');
    x.fillStyle = gr; x.fillRect(0, 0, w, h);
    const L = Math.min(w, h);
    for (let i = 0; i < 2600; i++) {
      const side = i % 4, f = Math.random(), depth = Math.pow(Math.random(), 2.2) * L * 0.16;
      const px = side === 0 ? f * w : side === 1 ? f * w : side === 2 ? depth : w - depth;
      const py = side === 0 ? depth : side === 1 ? h - depth : f * h;
      const a = Math.random() * Math.PI, len = (2 + Math.random() * 9) * (1 - depth / (L * 0.16) * 0.6), al = 0.12 + 0.4 * (1 - depth / (L * 0.16));
      x.strokeStyle = 'rgba(235,248,255,' + al.toFixed(3) + ')'; x.lineWidth = 0.8 + Math.random();
      x.beginPath(); for (let k = 0; k < 3; k++) { const b = a + k * Math.PI / 3; x.moveTo(px - Math.cos(b) * len, py - Math.sin(b) * len); x.lineTo(px + Math.cos(b) * len, py + Math.sin(b) * len); } x.stroke();
      if (Math.random() < 0.25) { const r = 6 + Math.random() * 22, q = x.createRadialGradient(px, py, 0, px, py, r); q.addColorStop(0, 'rgba(220,240,255,' + (al * 0.5).toFixed(3) + ')'); q.addColorStop(1, 'rgba(220,240,255,0)'); x.fillStyle = q; x.fillRect(px - r, py - r, r * 2, r * 2); }
    }
    return c;
  }

  function stepFrost(ctx, rdt, t) {
    let cover = 0, shatter = 0;
    if (FR.on) {
      FR.t += rdt;
      const end = FR.dur, total = end + FR.thaw;
      cover = Math.min(1, FR.t / 1.2) * (FR.t < end ? 1 : 1 - (FR.t - end) / FR.thaw);
      shatter = FR.t < end ? 0 : (FR.t - end) / FR.thaw;
      FR.slow = FR.t < end ? 1 - 0.72 * Math.min(1, FR.t / 1.0) : 0.28 + 0.72 * Math.min(1, shatter);
      const tick = [0.15, 0.45, 0.75];
      while (FR.hits < 3 && shatter >= tick[FR.hits]) { for (const id of PARTY) ctx.damage(id, ctx.swing(680, 0.08), 'ice', id === 'sol' ? 120 : 0); ctx.shake(0.005); FR.hits++; }
      if (FR.t >= total) { FR.on = false; FR.slow = 1; }
    } else FR.slow = 1;
    for (const id of PARTY) if (ctx.actors[id]) ctx.actors[id].ts = FR.slow;
    const ov = ctx.overlay, W = ov.width, H = ov.height;
    fx2.clearRect(0, 0, W, H);
    if (cover <= 0.001 && !FR.on) { ov.style.opacity = '0'; return; }
    ov.style.opacity = '1';
    if (!frostEdge || frostEdge.width !== W || frostEdge.height !== H) frostEdge = makeFrostEdge(W, H);
    fx2.globalAlpha = cover * 0.9; fx2.drawImage(frostEdge, 0, 0); fx2.globalAlpha = 1;
    for (const f of FR.flakes) {
      f.y += f.v * rdt * 0.6; f.x += Math.sin(t * 0.4 + f.ph) * 0.0006;
      if (f.y > 1.02) { f.y = -0.02; f.x = Math.random(); }
      if (shatter > 0) { const dx = f.x - 0.5, dy = f.y - 0.5; f.ox += dx * rdt * 1.6 * shatter; f.oy += dy * rdt * 1.6 * shatter; }
      const px = (f.x + f.ox) * W, py = (f.y + f.oy) * H, a = cover * (0.45 + 0.55 * Math.sin(t * 2 + f.ph) ** 2), s = f.s * ctx.DPR;
      fx2.fillStyle = 'rgba(225,242,255,' + a.toFixed(3) + ')';
      if (f.star) { fx2.fillRect(px - s * 2.2, py - 0.5 * ctx.DPR, s * 4.4, ctx.DPR); fx2.fillRect(px - 0.5 * ctx.DPR, py - s * 2.2, ctx.DPR, s * 4.4); }
      fx2.beginPath(); fx2.arc(px, py, s, 0, Math.PI * 2); fx2.fill();
    }
  }

  function stepKnight(ctx, rdt, t) {
    const kn = ctx.actors.halcyon, mo = ctx.subject, witch = ctx.actors.witch;
    if (!kn || !kn.m) return;
    const a = mo.action, p = mo.progress;
    if (a === 'blackout' && kn.visible) {
      if (BO.k === 'idle' && p >= 0.36) {
        // out of the dark, from her flank, straight at the Witch
        const dx = mo.x - witch.home.x, dz = mo.z - witch.home.z, d = Math.hypot(dx, dz);
        kn.x = witch.home.x + dx / d * 1.45; kn.z = witch.home.z + dz / d * 1.45 + 0.75;
        kn.yaw = ctx.faceYaw(kn, witch.home); kn.play('severance', true); BO.k = 'strike';
      }
      if (BO.k === 'strike' && p >= 0.68) { if (kn.m.reset) kn.m.reset(); knightHome(ctx); BO.k = 'back'; }
    } else if (BO.k !== 'idle') { if (BO.k === 'strike') { if (kn.m.reset) kn.m.reset(); knightHome(ctx); } BO.k = 'idle'; }
    if (kn.m.setFade) kn.m.setFade(1 - 0.94 * ctx.clamp((BO.dark - 0.2) / 0.5, 0, 1));
    // in the dark only her cold blue eyes and blade show
    const glow = kn.visible ? ctx.clamp((BO.dark - 0.35) / 0.4, 0, 1) : 0;
    if (kn.m.anchor) {
      kn.m.anchor('eye', V1); const ry = kn.yaw, rx = Math.cos(ry), rz = -Math.sin(ry);
      eyes.forEach((e, i) => { e.visible = glow > 0.01; e.position.set(V1.x - rx * 0.06 * i + Math.sin(ry) * 0.02, V1.y, V1.z - rz * 0.06 * i + Math.cos(ry) * 0.02); e.scale.setScalar(0.06 + 0.008 * Math.sin(t * 9)); e.material.opacity = glow; });
      kn.m.anchor('hit', V1); kn.m.anchor('blade', V2);
      bladeGlow.forEach((s, i) => { const f = i / 4; s.visible = glow > 0.01; s.position.copy(V2).lerp(V1, -0.8 + 1.8 * f); s.scale.setScalar(0.24 + 0.05 * Math.sin(t * 11 + i)); s.material.opacity = glow * 0.85; });
      const tOn = BO.k === 'strike' && kn.progress > 0.28 && kn.progress < 0.66 ? glow : 0;
      if (tOn > 0 && !trail.visible) for (let i = 0; i < TRN; i++) { tipH[i].copy(V1); midH[i].copy(V2); }
      trail.visible = tOn > 0;
      if (trail.visible) {
        for (let i = TRN - 1; i > 0; i--) { tipH[i].copy(tipH[i - 1]); midH[i].copy(midH[i - 1]); }
        tipH[0].copy(V1); midH[0].copy(V2);
        for (let i = 0; i < TRN; i++) { const k = tOn * Math.pow(1 - i / (TRN - 1), 1.5); trPos.set([tipH[i].x, tipH[i].y, tipH[i].z, midH[i].x, midH[i].y, midH[i].z], i * 6); trCol.set([0.75 * k, 0.88 * k, k, 0.2 * k, 0.4 * k, k], i * 6); }
        trGeo.attributes.position.needsUpdate = true; trGeo.attributes.color.needsUpdate = true;
      }
    }
  }

  return {
    init(ctx) {
      THREE = ctx.THREE; V1 = new THREE.Vector3(); V2 = new THREE.Vector3();
      fx2 = ctx.overlay.getContext('2d');
      for (let i = 0; i < 190; i++) FR.flakes.push({ x: Math.random(), y: Math.random(), s: 0.6 + Math.random() * 2.6, v: 0.004 + Math.random() * 0.012, ph: Math.random() * Math.PI * 2, star: Math.random() < 0.14, ox: 0, oy: 0 });
      const blueT = ctx.radialTex('rgba(200,230,255,1)', 'rgba(90,150,255,0.55)', 'rgba(40,80,255,0)');
      const blueSpr = () => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: blueT, color: 0x9cc4ff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); s.visible = false; ctx.scene.add(s); return s; };
      eyes = [blueSpr(), blueSpr()]; bladeGlow = [blueSpr(), blueSpr(), blueSpr(), blueSpr(), blueSpr()];
      trPos = new Float32Array(TRN * 2 * 3); trCol = new Float32Array(TRN * 2 * 3); const trIdx = [];
      for (let i = 0; i < TRN - 1; i++) { const a = i * 2; trIdx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      trGeo = new THREE.BufferGeometry(); trGeo.setAttribute('position', new THREE.BufferAttribute(trPos, 3)); trGeo.setAttribute('color', new THREE.BufferAttribute(trCol, 3)); trGeo.setIndex(trIdx);
      trail = new THREE.Mesh(trGeo, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
      trail.frustumCulled = false; trail.visible = false; ctx.scene.add(trail);
      tipH = []; midH = []; for (let i = 0; i < TRN; i++) { tipH.push(new THREE.Vector3()); midH.push(new THREE.Vector3()); }
      knightHome(ctx);
    },
    update(ctx, rdt, t) {
      const a = ctx.subject.action, p = ctx.subject.progress;
      const dk = a === 'blackout' ? ctx.smooth(0.17, 0.3, p) * (1 - ctx.smooth(0.78, 0.88, p)) : 0;
      BO.dark += (dk - BO.dark) * (1 - Math.exp(-rdt * 14));
      ctx.setDark(BO.dark);
      stepKnight(ctx, rdt, t);
      stepFrost(ctx, rdt, t);
    },
    onHit(ctx, a, i) {
      const mo = ctx.subject.m, v = new THREE.Vector3();
      if (a === 'voidSphere') { ctx.ring(mo.anchor('orb', v), 'hit'); ctx.shake(0.016); if (ctx.flash) ctx.flash(0.75, v); for (const id of PARTY) ctx.damage(id, ctx.swing(2100, 0.06), '', id === 'sol' ? 90 : 0); }
      else if (a === 'crownShards') { ctx.ring(mo.anchor('impact', v), 'hit'); ctx.shake(0.004); ctx.damage('witch', ctx.swing(540, 0.08)); }
      else if (a === 'blackout') { ctx.shake(0.012); ctx.damage('witch', ctx.actors.halcyon && ctx.actors.halcyon.visible ? ctx.swing(2450, 0.04) : 1500, 'dark'); }
      else return false;
      return true;
    },
    onCue(ctx, a, i) {
      if (a === 'frostDust') { FR.on = true; FR.t = 0; FR.hits = 0; for (const f of FR.flakes) { f.ox = 0; f.oy = 0; } ctx.subject.m.state.frost = FR.dur + FR.thaw; }
      if (a === 'blackout' && i === 1 && ctx.actors.halcyon && ctx.actors.halcyon.visible) ctx.ring(ctx.actors.halcyon.m.anchor('hit', new THREE.Vector3()), 'cue blue');
    },
    wide() { return FR.on; },
    barValue() { return FR.on ? 1 - FR.t / (FR.dur + FR.thaw) : 0; },
    label(ctx) {
      const a = ctx.subject.action;
      if (a === 'die' && !ctx.subject.busy) return 'Gone into the night. Press Appear';
      if (a === 'blackout' && BO.dark > 0.5) return 'Blackout, dark';
      if (!a && FR.on) { const left = Math.max(0, FR.dur - FR.t); return left > 0 ? 'Frost Dust: the party is slowed, ' + Math.ceil(left) + ' s' : 'Frost Dust: thawing'; }
      return null;
    },
    setFrostLength(s) { FR.dur = s; },
  };
})();
