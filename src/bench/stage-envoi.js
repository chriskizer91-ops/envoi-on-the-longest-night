// stage-envoi.js: Envoi's battle staging for the bench, after the page script of
// reference/demos/envoi-letter-wyrm-model-preview.html. Io, the Witch, summons it and Sol's blade lights its heart; the
// seal breaks and it coils into the Folding Ward, which takes a wraith's blow whole. On its turn it wraps the wraith,
// burns from tail to head as a ring of fire and drops its heart for the Last Word, and the wraith is released as a
// pale moth. Battle rules: lore answer 12 (docs/lore/lore-answers-2026-10-01.md). Its numbers are the bible's
// level 1 strike (8 hits of 180, then 1,800), growing x1.2 with each of Io's levels, with a 25% swing; placeholders
// until the battle steps.
window.STAGES = window.STAGES || {};
window.STAGES.envoi = (function () {
  'use strict';
  const HIT = 180, LAST = 1800, FOE_HIT = 120;
  const FOE_ATK = { wraith: 'sweep', wisp: 'flicker', halcyon: 'gloamCleave', noctara: 'crownShards' };
  const S = {
    level: 10, total: 0, msg: '', msgT: 0,
    sum: null,          // summon choreography: Sol's cut and the Heat she spends
    foe: null,          // the wraith's attack on the ward
    gone: -1,           // seconds since the wraith was released, -1 while it stands
    seq: null, seqT: 0, // Play both turns
    spent: false,       // the ward took its hit
  };
  let THREE = null, V1, V2, V3, beam, beamPos, beamGlow = [], sparks = [], moth = null, mothGlow = null, mothT = -1, mothP;
  const ink = []; // the dark splash when a blow lands on the ward: drops of the wraith's darkness thrown off the paper
  const mul = () => Math.pow(1.2, S.level - 1);
  const fmt = (n) => Math.round(n).toLocaleString('en-US');

  // A floating number or word over an actor, without the hurt reaction ctx.damage plays. Made at once (no timer),
  // so the reactions this stage plays keep their order even when a headless check steps the clock by hand.
  function float(ctx, id, text, style, dx) {
    const a = ctx.actors[id]; if (!a || !a.visible || !a.m) return;
    const p = ctx.toScreen(a.head(new THREE.Vector3())); if (p[2] > 1) return;
    const d = document.createElement('div'); d.className = 'dmg'; d.textContent = text;
    if (style) Object.assign(d.style, style);
    d.style.left = (p[0] + (dx === undefined ? (Math.random() - 0.5) * 26 : dx)) + 'px'; d.style.top = p[1] + 'px';
    d.addEventListener('animationend', () => d.remove());
    ctx.stage.appendChild(d);
  }
  const WARD = { color: '#fff1c8', textShadow: '0 0 8px #ff9a2e, 0 2px 0 #4a1e08', fontSize: '19px', fontStyle: 'italic' };
  const HEAT = { color: '#ffd9a0', textShadow: '0 0 8px #ff7a1a, 0 2px 0 #3a1a10', fontSize: '17px' };
  const BIG = { color: '#ffe6a6', textShadow: '0 0 12px #ff8a1e, 0 0 3px #ff5a10, 0 2px 0 #4a1a08', fontSize: '34px' };
  function say(text, sec) { S.msg = text; S.msgT = sec || 2; }

  function wardUp(ctx) {
    const m = ctx.subject.m; if (!m) return false;
    if ('warded' in m) return !!m.warded;
    const a = m.action; return (a === 'summon' || a === 'appear') && m.progress >= 0.74;
  }
  function anchor(ctx, name, out) { const m = ctx.subject.m; return m.anchor(name, out); }
  function foe(ctx) { return (ctx.foe && ctx.foe()) || ctx.actors.wraith; }

  // ---------- the summon: Io's summon, Sol's blade lighting the heart, the Heat it spends ----------
  function startSummon(ctx) {
    S.sum = { cut: false, lit: false }; S.spent = false;
    const w = ctx.actors.witch, s = ctx.actors.sol;
    if (w && w.visible) w.play('summon', true);
    if (s && s.m && s.m.state) { s.m.state.heat = 0.85; s.m.state.sunburn = 1; }
  }
  function stepSummon(ctx) {
    const sub = ctx.subject, a = sub.action, p = sub.progress;
    if (!S.sum || (a !== 'summon' && a !== 'appear')) return;
    const s = ctx.actors.sol;
    // flareCut lands at 0.55 of its 1.7 s: started at 0.27 of the 5.2 s summon it lands as the heart lights, at 0.45
    if (!S.sum.cut && p >= 0.27) { S.sum.cut = true; if (s && s.visible) s.play('flareCut', true); }
    if (!S.sum.lit && p >= 0.45) {
      S.sum.lit = true;
      if (s && s.m && s.m.state) { const h = Math.round(100 * (s.m.state.heat || 0)); s.m.state.heat = 0; s.m.state.sunburn = 0; if (h > 0 && s.visible) float(ctx, 'sol', '−' + h + ' Heat', HEAT, 0); }
    }
  }
  function stepBeam(ctx, t) {
    const sub = ctx.subject, a = sub.action, p = sub.progress, s = ctx.actors.sol;
    const k = (a === 'summon' || a === 'appear') && s && s.visible && s.m.anchor ? ctx.smooth(0.405, 0.44, p) * (1 - ctx.smooth(0.49, 0.54, p)) : 0;
    const on = k > 0.01;
    beam.visible = on; for (const g of beamGlow) g.visible = on; for (const q of sparks) q.visible = on;
    if (!on) return;
    s.m.anchor('hit', V1); anchor(ctx, 'heart', V2);
    V3.subVectors(V2, V1); const len = V3.length() || 1;
    const side = new THREE.Vector3().subVectors(ctx.camera.position, V1).cross(V3).normalize().multiplyScalar(0.11 + 0.05 * k);
    const P = beamPos;
    P[0] = V1.x - side.x; P[1] = V1.y - side.y; P[2] = V1.z - side.z; P[3] = V1.x + side.x; P[4] = V1.y + side.y; P[5] = V1.z + side.z;
    P[6] = V2.x - side.x; P[7] = V2.y - side.y; P[8] = V2.z - side.z; P[9] = V2.x + side.x; P[10] = V2.y + side.y; P[11] = V2.z + side.z;
    beam.geometry.attributes.position.needsUpdate = true;
    beam.material.opacity = k;
    beamGlow[0].position.copy(V1); beamGlow[0].scale.setScalar(0.7 + 0.15 * Math.sin(t * 23)); beamGlow[0].material.opacity = k;
    beamGlow[1].position.copy(V2); beamGlow[1].scale.setScalar(1.6 * k + 0.2 * Math.sin(t * 17)); beamGlow[1].material.opacity = k;
    sparks.forEach((q, i) => { const f = (t * 1.6 + i / sparks.length) % 1; q.position.copy(V1).addScaledVector(V3, f); q.position.y += Math.sin(f * Math.PI) * 0.25 * Math.sin(i * 2.1); q.scale.setScalar(0.22 + 0.1 * Math.sin(t * 31 + i)); q.material.opacity = k * Math.sin(f * Math.PI); });
  }

  // ---------- the dark splash: ink-dark drops burst off the ward where the blow lands and fall to the cobbles ----------
  function splash(p, cam) {
    // thrown out over the paper toward the party's side (the camera), so the splash reads in front of the wall
    const tx = cam.x - p.x, tz = cam.z - p.z, tl = Math.hypot(tx, tz) || 1;
    for (const d of ink) {
      const a = Math.random() * Math.PI * 2, sp = 1.2 + Math.random() * 2.4;
      d.s.position.set(p.x + (Math.random() - 0.5) * 0.3, p.y + (Math.random() - 0.5) * 0.3, p.z + (Math.random() - 0.5) * 0.3);
      d.v.set(Math.cos(a) * sp + tx / tl * 1.8, 0.6 + Math.random() * 2.6, Math.sin(a) * sp + tz / tl * 1.8);
      d.life = 0; d.max = 0.7 + Math.random() * 0.6; d.r = 0.22 + Math.random() * 0.34; d.s.visible = true;
    }
  }
  function stepInk(rdt) {
    for (const d of ink) {
      if (!d.s.visible) continue;
      d.life += rdt; if (d.life >= d.max) { d.s.visible = false; continue; }
      d.v.y -= 7 * rdt; d.s.position.addScaledVector(d.v, rdt);
      if (d.s.position.y < 0.03) { d.s.position.y = 0.03; d.v.set(0, 0, 0); }
      const f = d.life / d.max; d.s.scale.setScalar(d.r * (1 + 1.4 * f)); d.s.material.opacity = 0.92 * (1 - f * f);
    }
  }

  // ---------- the wraith attacks: the ward takes it all, or the party takes it ----------
  function startFoe(ctx) {
    const w = foe(ctx); if (!w || !w.m) return;
    const back = S.gone >= 0;
    if (back) { comeBack(ctx); }
    S.foe = { wait: back ? 1.9 : 0, hit: false, started: false };
  }
  function stepFoe(ctx, rdt) {
    const F = S.foe, w = foe(ctx); if (!F || !w) return;
    if (F.wait > 0) { F.wait -= rdt; return; }
    // each foe swings its own basic attack at the ward, and the blow lands at that attack's first hit
    const atk = FOE_ATK[w.id] || 'sweep', at = (w.m.ACTIONS && w.m.ACTIONS[atk] && w.m.ACTIONS[atk].hits[0]) || 0.5;
    if (!F.started) { F.started = true; w.play(atk, true); return; }
    if (!F.hit && w.action === atk && w.progress >= at) {
      F.hit = true;
      if (wardUp(ctx)) {
        ctx.subject.play('block', true); S.spent = true;
        const m = ctx.subject.m, at = m.anchor(m.ACTIONS && 'warded' in m ? 'ward' : 'chest', new THREE.Vector3()); ctx.ring(at, 'hit'); splash(at, ctx.camera.position);
        float(ctx, 'witch', 'Warded', WARD, -6); float(ctx, 'sol', 'Warded', WARD, 6);
        say('Warded: the Folding Ward takes the whole blow', 2.4);
      } else {
        const n = FOE_HIT * mul();
        ctx.damage('witch', ctx.swing(n, 0.25)); ctx.damage('sol', ctx.swing(n, 0.25), '', 90);
        say(S.spent ? 'The ward is spent: the party takes the blow' : 'No ward up: the party takes the blow', 2.4);
      }
    }
    if (F.hit && w.action !== atk) S.foe = null;
  }

  // ---------- the strike: nine hits on the wraith, then it is released as a pale moth ----------
  function startStrike(ctx) {
    S.total = 0; S.foe = null; S.spent = true;
    if (S.gone >= 0) comeBack(ctx);
    const w = ctx.actors.witch; if (w && w.visible && !w.busy) w.play('cast', true);
  }
  function hitFoe(ctx, n, last) {
    const w = foe(ctx); if (!w || !w.visible) return;
    S.total += n;
    if (last) {
      float(ctx, foe(ctx).id, fmt(n), BIG, 0);
      w.play('die', true); S.gone = 0; mothT = -0.7;
    } else {
      float(ctx, foe(ctx).id, fmt(n));
      if (S.gone < 0) w.play('hurt', true);
    }
  }
  function comeBack(ctx) { const w = foe(ctx); if (w && w.m) w.play('appear', true); S.gone = -1; }

  // the pale moth: a soul going home
  function mothTex() {
    const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
    g.translate(64, 60);
    const wing = (sx, up) => {
      g.save(); g.scale(sx, 1); g.beginPath();
      if (up) { g.moveTo(3, -4); g.bezierCurveTo(16, -44, 58, -52, 60, -22); g.bezierCurveTo(61, -4, 32, 6, 3, 3); }
      else { g.moveTo(3, 3); g.bezierCurveTo(26, 6, 48, 26, 36, 46); g.bezierCurveTo(24, 58, 9, 32, 3, 9); }
      g.closePath();
      const gr = g.createRadialGradient(4, 0, 3, 4, 0, 64);
      gr.addColorStop(0, 'rgba(255,253,244,1)'); gr.addColorStop(0.6, 'rgba(240,236,252,0.95)'); gr.addColorStop(1, 'rgba(204,198,238,0.85)');
      g.fillStyle = gr; g.fill(); g.lineWidth = 1.6; g.strokeStyle = 'rgba(176,166,214,0.75)'; g.stroke();
      g.fillStyle = 'rgba(186,170,226,0.55)'; g.beginPath(); g.arc(up ? 36 : 26, up ? -22 : 28, up ? 6 : 4.5, 0, Math.PI * 2); g.fill();
      g.restore();
    };
    wing(1, true); wing(-1, true); wing(1, false); wing(-1, false);
    g.fillStyle = '#fbf6ea'; g.beginPath(); g.ellipse(0, 6, 4.2, 19, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(240,232,214,0.95)'; g.lineWidth = 1.4;
    for (const s of [-1, 1]) { g.beginPath(); g.moveTo(s * 1.5, -11); g.quadraticCurveTo(s * 8, -26, s * 15, -30); g.stroke(); }
    const t = new THREE.CanvasTexture(c); return t;
  }
  function stepMoth(ctx, rdt, t) {
    const w = foe(ctx);
    if (mothT < -0.9 || !w) { moth.visible = mothGlow.visible = false; return; }
    mothT += rdt;
    if (mothT < 0) { moth.visible = mothGlow.visible = false; if (mothT > -0.05 || !mothP.init) { w.chest(mothP); mothP.init = true; } return; }
    const k = mothT / 3.4; if (k >= 1) { mothT = -1; mothP.init = false; moth.visible = mothGlow.visible = false; return; }
    moth.visible = mothGlow.visible = true;
    const fadeIn = ctx.smooth(0, 0.12, k), fadeOut = 1 - ctx.smooth(0.72, 1, k);
    moth.position.set(mothP.x + Math.sin(mothT * 1.7) * 0.35 + mothT * 0.12, mothP.y + 0.2 + mothT * 0.95, mothP.z + Math.cos(mothT * 1.3) * 0.2);
    const flap = 0.28 + 0.72 * Math.abs(Math.cos(t * 7.5));
    moth.scale.set(0.86 * flap, 0.7, 1); moth.material.opacity = fadeIn * fadeOut;
    mothGlow.position.copy(moth.position); mothGlow.scale.setScalar(1.3 + 0.1 * Math.sin(t * 5)); mothGlow.material.opacity = 0.55 * fadeIn * fadeOut;
  }
  function stepRelease(ctx, rdt) {
    if (S.gone < 0) return;
    S.gone += rdt;
    const w = foe(ctx);
    // back from the dark a little after its release, so the next strike has a target
    if (w && S.gone > 4.4 && !S.seq && !S.foe) comeBack(ctx);
  }

  // ---------- Play both turns: summon, a hit on the ward, then the strike ----------
  const SEQ = [[0, 'summon'], [5.7, 'wardHit'], [8.3, 'envoi']];
  function run(ctx, name) {
    if (name === 'summon') { startSummon(ctx); ctx.subject.play('summon', true); }
    else if (name === 'wardHit') startFoe(ctx);
    else if (name === 'envoi') { startStrike(ctx); ctx.subject.play('envoi', true); }
  }
  function stepSeq(ctx, rdt) {
    if (!S.seq) return;
    S.seqT += rdt;
    while (S.seq.length && S.seqT >= S.seq[0][0]) run(ctx, S.seq.shift()[1]);
    if (!S.seq.length && ctx.subject.action === 'envoi' && ctx.subject.progress >= 1) S.seq = null;
  }

  function resetAll(ctx) {
    S.sum = null; S.foe = null; S.seq = null; S.msgT = 0; S.spent = false;
    if (S.gone >= 0) comeBack(ctx);
    mothT = -1;
  }

  return {
    init(ctx) {
      THREE = ctx.THREE; V1 = new THREE.Vector3(); V2 = new THREE.Vector3(); V3 = new THREE.Vector3(); mothP = new THREE.Vector3(); mothP.init = false;
      // Sol's blade light: a soft amber streak from her blade tip to the heart lantern, with sparks running along it
      const c = document.createElement('canvas'); c.width = 64; c.height = 8; const g = c.getContext('2d');
      const gr = g.createLinearGradient(0, 0, 64, 0); gr.addColorStop(0, 'rgba(255,160,60,0)'); gr.addColorStop(0.32, 'rgba(255,190,100,0.55)'); gr.addColorStop(0.5, 'rgba(255,248,224,1)'); gr.addColorStop(0.68, 'rgba(255,190,100,0.55)'); gr.addColorStop(1, 'rgba(255,160,60,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 64, 8);
      const geo = new THREE.BufferGeometry(); beamPos = new Float32Array(12);
      geo.setAttribute('position', new THREE.BufferAttribute(beamPos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 1, 1], 2)); geo.setIndex([0, 2, 1, 1, 2, 3]);
      beam = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), color: 0xffc070, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
      beam.frustumCulled = false; beam.visible = false; beam.renderOrder = 4; ctx.scene.add(beam);
      const amber = ctx.radialTex('rgba(255,244,214,1)', 'rgba(255,170,70,0.5)', 'rgba(255,120,30,0)');
      const spr = (col) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: amber, color: col, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); s.visible = false; s.renderOrder = 5; ctx.scene.add(s); return s; };
      beamGlow = [spr(0xffd08a), spr(0xffe0a8)];
      for (let i = 0; i < 7; i++) sparks.push(spr(0xffc070));
      moth = new THREE.Sprite(new THREE.SpriteMaterial({ map: mothTex(), transparent: true, depthWrite: false })); moth.visible = false; moth.renderOrder = 6; ctx.scene.add(moth);
      mothGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: ctx.radialTex('rgba(255,255,250,0.9)', 'rgba(226,222,255,0.35)', 'rgba(200,196,255,0)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      mothGlow.visible = false; mothGlow.renderOrder = 5; ctx.scene.add(mothGlow);
      const inkTex = ctx.radialTex('rgba(10,4,18,0.96)', 'rgba(26,10,40,0.6)', 'rgba(26,10,40,0)');
      for (let i = 0; i < 40; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: inkTex, color: i % 5 ? 0xffffff : 0x9dffc0, transparent: true, depthWrite: false, depthTest: false })); sp.visible = false; sp.renderOrder = 6; ctx.scene.add(sp); ink.push({ s: sp, v: new THREE.Vector3(), life: 0, max: 1, r: 0.2 }); }
      this.setLevel(ctx, S.level);
    },
    onBuild(ctx) { if (THREE) resetAll(ctx); },
    beforePlay(ctx, name) {
      if (name !== 'bothTurns') S.seq = null;
      if (name === 'bothTurns') { resetAll(ctx); S.seq = SEQ.map((e) => e.slice()); S.seqT = 0; run(ctx, S.seq.shift()[1]); }
      else if (name === 'summon' || name === 'appear') startSummon(ctx);
      else if (name === 'wardHit') startFoe(ctx);
      else if (name === 'envoi') startStrike(ctx);
      else if (name === 'leave' || name === 'die') { S.sum = null; S.spent = false; }
    },
    onAction(ctx, a) { if (a === 'appear' && !S.sum) startSummon(ctx); },
    update(ctx, rdt, t) {
      const sub = ctx.subject, m = sub.m, w = foe(ctx);
      // the strike wraps the wraith wherever it stands
      if (m && m.state && w) m.state.reach = Math.max(0.5, Math.hypot(w.x - sub.x, w.z - sub.z));
      if (S.msgT > 0) S.msgT -= rdt;
      stepSeq(ctx, rdt);
      stepSummon(ctx);
      stepBeam(ctx, t);
      stepFoe(ctx, rdt);
      stepInk(rdt);
      stepRelease(ctx, rdt);
      stepMoth(ctx, rdt, t);
    },
    onHit(ctx, a, i) {
      const m = ctx.subject.m;
      if (a === 'summon' || a === 'appear') { ctx.ring(m.anchor('seal', new THREE.Vector3()), 'cue'); say('Seal Break', 1.0); return true; }
      if (a === 'envoi') {
        ctx.ring(m.anchor('hit', new THREE.Vector3()), 'hit');
        const last = i >= (m.ACTIONS.envoi.hits.length - 1);
        hitFoe(ctx, ctx.swing((last ? LAST : HIT) * mul(), 0.25), last);
        return true;
      }
      return true;
    },
    onCue(ctx, a, i) {
      const m = ctx.subject.m;
      if ((a === 'summon' || a === 'appear') && i === 0) ctx.ring(m.anchor('heart', new THREE.Vector3()), 'hit');
      if ((a === 'summon' || a === 'appear') && i === 1) ctx.ring(m.anchor('warded' in m ? 'ward' : 'chest', new THREE.Vector3()), 'cue');
    },
    wide(ctx) {
      // Envoi is huge: on a narrow screen the Close view frames everyone, as the Full view does; on any screen the camera
      // pulls back whenever it is summoned, strikes, takes a blow on the ward or leaves, so the whole wyrm is in the shot
      if (ctx.stage.clientWidth < 600) return true;
      const a = ctx.subject.action;
      return !!(S.seq || S.foe || S.gone >= 0 || mothT > -0.9 || ['summon', 'appear', 'envoi', 'block', 'leave', 'die'].includes(a));
    },
    label(ctx) {
      const sub = ctx.subject, a = sub.action, p = sub.progress;
      if (S.msgT > 0) return S.msg;
      if (S.seq && !a) return 'Play both turns';
      if (a === 'summon' || a === 'appear') {
        if (p < 0.4) return 'Summon: the letters fold in';
        if (p < 0.56) return 'Heart Lantern: Sol lights it';
        if (p < 0.72) return 'Seal Break';
        if (p < 1) return 'Folding Ward';
        return 'Folding Ward: it takes the next attack whole';
      }
      if (a === 'envoi') {
        if (p < 0.12) return 'Envoi';
        if (p < 0.85) return 'Letting Go: a ring of fire';
        if (p < 0.93) return 'Last Word';
        if (p < 1) return 'Rising Away';
        return 'Sent: ' + fmt(S.total) + ' in all. Envoi has burned away';
      }
      if (a === 'leave' || a === 'die') return p < 1 ? 'Leave: it burns away quietly' : 'Burned away quietly. Press Summon';
      if (a === 'block') return 'The ward takes the hit';
      if (!a && S.spent && wardUp(ctx) === false && sub.m && sub.m.ACTIONS) return 'The ward is spent. Envoi waits for its turn';
      return null;
    },
    setLevel(ctx, v) {
      S.level = v;
      const k = mul(), all = (8 * HIT + LAST) * k;
      const b = Array.prototype.find.call(document.querySelectorAll('#panel .acts button'), (e) => e.firstChild && e.firstChild.textContent === 'Envoi');
      if (b && b.querySelector('small')) b.querySelector('small').textContent = '9 hits, about ' + fmt(Math.round(all / 100) * 100);
    },
  };
})();
