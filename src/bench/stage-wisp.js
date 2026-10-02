// stage-wisp.js: the wisp's battle staging for the bench. Its hits land on Io (the Witch) and Sol; Cling drains Io
// and heals the wisp by what it takes; Wail and Breath hit the whole party, and Breath leaves a frost rime at the edges.
// During Gutter, Io throws her flame at it and misses. Damage numbers are placeholders until the battle steps:
// a level 1 base that grows 20% a level (base x 1.2^(level - 1)), with a 25% swing.
window.STAGES = window.STAGES || {};
window.STAGES.wisp = (function () {
  const S = { frost: 0, level: 1, drain: [] };
  const BASE = { flicker: 50, cling: 30, wail: 40, breath: 45 };
  const PARTY = ['witch', 'sol'];
  const GROUP = ['wisp2', 'wisp3'];
  const RIME = { on: false, t: 0, edge: null };
  const BOLT = { k: 'idle', t: 0, from: null, to: null };
  let THREE, fx2, bolt = null, trail = [];

  const num = (base) => Math.round(base * Math.pow(1.2, S.level - 1));
  function apply(ctx) {
    const m = ctx.subject.m;
    if (m && m.state) { m.state.frost = S.frost; m.state.level = S.level; }
    for (const id of GROUP) { const a = ctx.actors[id]; if (a && a.m && a.m.state) a.m.state.level = S.level; }
  }

  // a frosted edge on the overlay, like Noctara's Frost Dust but brief
  function makeRime(w, h) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
    const gr = x.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.32, w / 2, h / 2, Math.hypot(w, h) * 0.56);
    gr.addColorStop(0, 'rgba(190,225,255,0)'); gr.addColorStop(0.65, 'rgba(170,215,255,0.14)'); gr.addColorStop(1, 'rgba(225,242,255,0.62)');
    x.fillStyle = gr; x.fillRect(0, 0, w, h);
    const L = Math.min(w, h);
    for (let i = 0; i < 1600; i++) {
      const side = i % 4, f = Math.random(), depth = Math.pow(Math.random(), 2.4) * L * 0.14;
      const px = side < 2 ? f * w : side === 2 ? depth : w - depth, py = side === 0 ? depth : side === 1 ? h - depth : f * h;
      const a = Math.random() * Math.PI, len = (2 + Math.random() * 8) * (1 - depth / (L * 0.14) * 0.6), al = 0.12 + 0.4 * (1 - depth / (L * 0.14));
      x.strokeStyle = 'rgba(235,248,255,' + al.toFixed(3) + ')'; x.lineWidth = 0.8 + Math.random();
      x.beginPath(); for (let k = 0; k < 3; k++) { const b = a + k * Math.PI / 3; x.moveTo(px - Math.cos(b) * len, py - Math.sin(b) * len); x.lineTo(px + Math.cos(b) * len, py + Math.sin(b) * len); } x.stroke();
    }
    return c;
  }
  function stepRime(ctx, rdt) {
    const ov = ctx.overlay, W = ov.width, H = ov.height;
    if (!RIME.on) return;
    RIME.t += rdt;
    const k = Math.min(1, RIME.t / 0.25) * (1 - ctx.smooth(0.6, 2.6, RIME.t));
    fx2.clearRect(0, 0, W, H);
    if (RIME.t > 2.6) { RIME.on = false; ov.style.opacity = '0'; return; }
    ov.style.opacity = '1';
    if (!RIME.edge || RIME.edge.width !== W || RIME.edge.height !== H) RIME.edge = makeRime(W, H);
    fx2.globalAlpha = k * 0.9; fx2.drawImage(RIME.edge, 0, 0); fx2.globalAlpha = 1;
  }

  // Io's flame, thrown at the wisp while it gutters
  function stepBolt(ctx, rdt) {
    const w = ctx.actors.witch, sub = ctx.subject;
    if (BOLT.k === 'wait' && w && w.m && w.m.action === 'throw' && w.progress >= 0.44) {
      BOLT.k = 'fly'; BOLT.t = 0; trail.length = 0;
      BOLT.from = w.m.flamePos ? w.m.flamePos(new THREE.Vector3()) : w.chest(new THREE.Vector3());
      BOLT.to = sub.m.anchor('chest', new THREE.Vector3());
      BOLT.to.add(BOLT.to.clone().sub(BOLT.from).setY(0).normalize().multiplyScalar(1.4));
    }
    const on = BOLT.k === 'fly';
    if (on) {
      BOLT.t += rdt;
      const k = BOLT.t / 0.34;
      if (k >= 1) BOLT.k = 'idle';
      const p = BOLT.from.clone().lerp(BOLT.to, Math.min(1, k)); p.y += Math.sin(Math.PI * Math.min(1, k)) * 0.25;
      trail.unshift(p.clone()); trail.length = Math.min(trail.length, 6);
      bolt.position.copy(p); bolt.material.opacity = 1 - ctx.smooth(0.8, 1, k);
    }
    bolt.visible = on;
    for (let i = 0; i < 5; i++) { const s = bolt.userData.tr[i]; s.visible = on && trail[i + 1]; if (s.visible) { s.position.copy(trail[i + 1]); s.material.opacity = bolt.material.opacity * (0.6 - i * 0.11); } }
  }

  return {
    init(ctx) {
      THREE = ctx.THREE; fx2 = ctx.overlay.getContext('2d');
      const st = document.createElement('style');
      st.textContent = '.dmg.miss{color:#e9f2ff;font-size:19px;font-style:italic;text-shadow:0 0 6px #000,0 2px 0 #222a44}';
      document.head.appendChild(st);
      const t = ctx.radialTex('rgba(255,240,255,1)', 'rgba(190,110,255,0.6)', 'rgba(120,40,220,0)');
      const spr = (s) => { const o = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, color: 0xe2b8ff, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending })); o.scale.setScalar(s); o.visible = false; o.renderOrder = 9; ctx.scene.add(o); return o; };
      bolt = spr(0.55); bolt.userData.tr = [0, 1, 2, 3, 4].map((i) => spr(0.42 - i * 0.06));
      ctx.lightOnly(bolt); bolt.userData.tr.forEach((s) => ctx.lightOnly(s));
      apply(ctx);
    },
    onBuild(ctx) { apply(ctx); },
    setFrost(ctx, v) { S.frost = v; apply(ctx); },
    setLevel(ctx, v) { S.level = v; apply(ctx); },
    update(ctx, rdt) { stepRime(ctx, rdt); if (bolt) stepBolt(ctx, rdt); },
    onAction(ctx, a) {
      if (a === 'gutter') { const w = ctx.actors.witch; if (w && w.visible && w.play('throw', true)) BOLT.k = 'wait'; }
    },
    onHit(ctx, a, i) {
      const m = ctx.subject.m, v = new THREE.Vector3();
      if (a === 'flicker') { ctx.ring(m.anchor('hit', v), 'hit'); ctx.damage('witch', ctx.swing(num(BASE.flicker), 0.25)); }
      else if (a === 'cling') { ctx.ring(m.anchor('hit', v), 'hit'); const n = ctx.swing(num(BASE.cling), 0.25); ctx.damage('witch', n); S.drain[i] = n; }
      else if (a === 'wail' || a === 'breath') {
        for (const id of PARTY) { const t = ctx.actors[id]; if (!t || !t.visible) continue; ctx.ring(t.chest(v), 'hit'); ctx.damage(id, ctx.swing(num(BASE[a]), 0.25), a === 'breath' ? 'ice' : '', id === 'sol' ? 90 : 0); }
        if (a === 'breath') { RIME.on = true; RIME.t = 0; }
      } else return false;
      return true;
    },
    onCue(ctx, a, i) {
      if (a === 'cling') { const n = S.drain[i] || num(BASE.cling); ctx.damage(ctx.subject.id, '+' + n.toLocaleString('en-US'), 'heal'); }
      if (a === 'gutter') ctx.damage(ctx.subject.id, 'Miss', 'miss');
    },
    wide(ctx) { const a = ctx.subject.action; return a === 'flicker' || a === 'cling' || a === 'wail' || a === 'breath' || a === 'gutter' || RIME.on; },
    label(ctx) {
      const a = ctx.subject.action, s = ctx.subject;
      if (a === 'die' && !s.busy) return 'Released: a moth rises. Press Appear';
      if (a === 'gutter' && s.progress > 0.25 && s.progress < 0.62) return 'Gutter: almost out';
      return null;
    },
  };
})();
