// stage-wraith.js: the Shadow Wraith's battle staging for the bench, after reference/demos/night-square-shadow-wraith.html.
// Soul Reaper swoops in on Sol (the last to hit it, in this bench), Soul Bolts fly from its hand at random party members,
// Shadow Grasp seizes Io (the Witch) with tendrils from the cobbles, and Eclipse raises a black sun and hits both. The great
// wraith also swallows lamplight (it heals) and breathes stolen fire on both. The black sun, rings, sigils, tendrils and
// bolts come from the shared effects brick (src/fx/battle-fx.js); the wraith draws its own trail, smoke, fire and the moth.
// Level and Great wraith rebuild the model; the original model plays through a small adapter (wrapOriginal) so the
// Before/After switch works with the older interface. The stage aims the wraith (state.target), so the page sets aim: false.
// Page options: ?level=1..20&great=1 (&play=<action> to start one)
window.STAGES = window.STAGES || {};
window.STAGES.wraith = (function () {
  'use strict';
  // A published page gets no query string, so a reload carries its options in sessionStorage; ?level=&great=&play= still work locally.
  const Q = new URLSearchParams(location.search);
  try { const kept = JSON.parse(sessionStorage.getItem('wraith-bench') || 'null'); sessionStorage.removeItem('wraith-bench'); if (kept) for (const k of ['level', 'great', 'play']) if (kept[k] && !Q.has(k)) Q.set(k, String(kept[k])); } catch (e) { /* storage blocked: start plain */ }
  const VAR = { level: Q.get('level') ? Math.max(1, Math.min(20, Math.round(+Q.get('level')) || 1)) : 0, great: Q.get('great') === '1' }; // 0: the model's own default
  const GREAT_ONLY = ['swallow', 'breath'];
  const PARTY = ['witch', 'sol'];
  const DMG = { sweep: 190, bolt: 70, grasp: 250, eclipse: 360, breath: 300, swallow: 1200 }; // the bible's numbers; the great wraith's are placeholders
  const rnd = (a, b) => a + Math.random() * (b - a);
  const scaleOf = (m) => (m && m.height ? m.height / 2.45 : 1);
  let FX = null, THREE = null, V1 = null, timer = 0, darkK = 0;
  const SW = { on: false, lastP: 0, fx: 0, fz: 0, tx: 0, tz: 0, yaw: 0, homeYaw: null };
  const ACT = { name: '', lastP: 0 };

  // The original model (src/models/originals/wraith.js) speaks the older interface: animate(t, dt), handPos, bladeTip.
  // This adapter gives it the spec's shape, with the hit times the battle demo waited for.
  function wrapOriginal(o) {
    const A = { sweep: [1.6, [0.5], [0.42]], cast: [1.6, [0.35, 0.47, 0.59], []], grasp: [1.8, [0.567], [0.5]], eclipse: [2.8, [0.745], [0.02, 0.62]], appear: [1.8, [], []], die: [2.8, [], [], true], hurt: [0.7, [], [], false, true] };
    const ACTIONS = {};
    for (const k in A) ACTIONS[k] = { dur: A[k][0], hits: A[k][1], cues: A[k][2], hold: !!A[k][3] || k === 'die', interrupt: !!A[k][4] || k === 'die' };
    return {
      root: o.root, fx: new window.THREE.Group(), ACTIONS, state: {}, height: 2.45,
      animate(phase, walk, t, dt) { o.animate(t, dt); },
      play(name, force) { return ACTIONS[name] ? o.play(name, force) : false; },
      guard() {}, reset() { o.reset(); }, setFade(f) { o.setFade(f); },
      get busy() { return o.busy; }, get action() { return o.action; }, get progress() { return o.progress; },
      get dash() { return 0; }, get lift() { return 0.3; },
      anchor(name, out) {
        out = out || new window.THREE.Vector3();
        if (name === 'hit' || name === 'tip') return o.bladeTip(out);
        if (name === 'blade') return o.bladeMid(out);
        if (name === 'hand' || name === 'bolt' || name === 'grasp') return o.handPos(out);
        if (name === 'head') { o.chestPos(out); out.y += 0.42; return out; }
        if (name === 'sun') return out.set(o.root.position.x, 3.2, o.root.position.z);
        return o.chestPos(out);
      },
    };
  }

  function chestOf(ctx, id) { const a = ctx.actors[id]; return a.chest(new THREE.Vector3()); }
  function partyUp(ctx) { return PARTY.filter((id) => ctx.actors[id] && ctx.actors[id].visible); }
  function blackSun(p, dur, size) { // the brick's black sun, scaled for the great wraith
    const s = FX.sprite(FX.T.sun, 0xffffff, THREE.NormalBlending, 6); s.position.copy(p);
    return FX.anim(dur, (u) => { const k = u < 0.45 ? Math.sin(u / 0.45 * Math.PI / 2) : u > 0.85 ? 1 - (u - 0.85) / 0.15 : 1; s.scale.setScalar((0.2 + 1.7 * k) * size); s.material.opacity = k; s.material.rotation = u * 1.5; }, () => FX.drop(s));
  }
  // the camera, the blob shadow and the readout follow the model's size; the great wraith is framed on its own,
  // since the bench's wide framing (all actors at 1 m) would crop its head
  let WIDE = null;
  function onBuild(ctx) {
    const sub = ctx.subject, S = scaleOf(sub.m), big = S > 1.5;
    if (!WIDE) WIDE = Object.assign({}, ctx.cfg.wide || {});
    ctx.cfg.wide = big ? {} : Object.assign({}, WIDE);
    ctx.cfg.subject.closeSpan = (big ? 175 : 130) * S; sub.spec.tall = 2.9 * S; sub.shadow.scale.set(S, 0.8 * S, 1);
    const dd = document.querySelectorAll('#panel dl dd');
    if (dd[4]) dd[4].textContent = big ? (2.45 * S).toFixed(1) + ' m to the hood tip (the great wraith)' : (2.45 * S).toFixed(2) + ' m to the hood tip';
  }
  function rebuild(ctx) {
    if (!ctx.UI.after) return;
    const sub = ctx.subject;
    if (sub.m && sub.m.reset) sub.m.reset();
    sub.build(ctx.cfg.subject.make);
    sub.x = sub.home.x; sub.z = sub.home.z; sub.yaw = SW.homeYaw !== null ? SW.homeYaw : sub.home.yaw;
    if (SW.homeYaw !== null) { sub.home.yaw = SW.homeYaw; SW.homeYaw = null; } SW.on = false;
    if (ctx.UI.guard && sub.m.guard) sub.m.guard(true);
    const B = window.Bench.budget(sub.m), dd = document.querySelectorAll('#panel dl dd');
    if (dd.length >= 6) {
      dd[0].textContent = B.triangles.toLocaleString('en-US');
      dd[1].innerHTML = B.drawCalls + ' <small>+ up to ' + B.fxDrawCalls + ' for effects</small>';
      dd[2].textContent = String(B.bones);
      dd[3].textContent = B.textures + ' (' + B.texMB.toFixed(1) + ' MB)';
      dd[5].textContent = Math.round(sub.buildMs) + ' ms on this device';
    }
    onBuild(ctx);
    if (window.__bench) window.__bench.budget = B;
  }
  function later(ctx) { clearTimeout(timer); timer = setTimeout(() => rebuild(ctx), 160); }
  const greatView = () => (window.innerWidth < 700 ? 'square' : 'close');
  // The bench frames the subject at the height the page gives it when it starts, so the great wraith gets its own page
  // load (?great=1, framed higher up); a great-wraith move asked for on the plain wraith carries over (?play=).
  function reload(great, play) {
    if (location.search) { // local file with options in the address: keep using it
      const q = new URLSearchParams(location.search);
      if (great) q.set('great', '1'); else q.delete('great');
      if (VAR.level) q.set('level', String(VAR.level)); else q.delete('level');
      if (play) q.set('play', play); else q.delete('play');
      const s = q.toString(); location.replace(location.pathname + (s ? '?' + s : '') + location.hash);
      return;
    }
    try { sessionStorage.setItem('wraith-bench', JSON.stringify({ great: great ? '1' : '', level: VAR.level || '', play: play || '' })); } catch (e) { /* storage blocked */ }
    location.reload();
  }
  function pickView(mode) { const b = document.querySelectorAll('#panel .seg button')[{ close: 0, full: 1, square: 2 }[mode]]; if (b) b.click(); }
  function button(text) { return Array.from(document.querySelectorAll('#panel button')).find((b) => b.textContent.trim() === text); }

  function stepSweep(ctx, rdt) {
    const sub = ctx.subject, a = sub.action, p = sub.progress;
    if (a === 'sweep' && p >= 0 && p < 0.4) {
      if (!SW.on || p < SW.lastP - 1e-4) {
        // swoop in to striking distance of Sol before the blade comes round
        const sol = ctx.actors.sol, S = scaleOf(sub.m), reach = 1.35 * S;
        SW.on = true; SW.fx = sub.x; SW.fz = sub.z;
        const dx = sol.x - sub.x, dz = sol.z - sub.z, d = Math.hypot(dx, dz) || 1, go = Math.max(0, d - reach);
        SW.tx = sub.x + dx / d * go; SW.tz = sub.z + dz / d * go; SW.yaw = Math.atan2(dx, dz);
        if (SW.homeYaw === null) SW.homeYaw = sub.home.yaw;
        sub.home.yaw = SW.yaw;
      }
      const k = ctx.smooth(0.02, 0.3, p);
      sub.x = SW.fx + (SW.tx - SW.fx) * k; sub.z = SW.fz + (SW.tz - SW.fz) * k;
      sub.yaw += ctx.wrapA(SW.yaw - sub.yaw) * Math.min(1, rdt * 12);
    } else if (SW.on && a !== 'sweep') { SW.on = false; if (SW.homeYaw !== null) { sub.home.yaw = SW.homeYaw; SW.homeYaw = null; } }
    SW.lastP = p;
  }

  return {
    wrapOriginal,
    opts() { return VAR.level ? { level: VAR.level, great: VAR.great } : { great: VAR.great }; },
    get level() { return VAR.level || (VAR.great ? 5 : 1); }, get great() { return VAR.great; },
    setLevel(v, ctx) { VAR.level = Math.round(v); later(ctx); },
    beforePlay(ctx, name) {
      // the great wraith's own moves: switch to it first
      if (!GREAT_ONLY.includes(name) || (VAR.great && ctx.UI.after)) return;
      if (!VAR.great) { reload(true, name); return; }
      if (!ctx.UI.after) { const b = button('After'); if (b) b.click(); }
    },
    setGreat(on) { if (!!on !== VAR.great) reload(!!on); },
    onBuild,
    init(ctx) {
      THREE = ctx.THREE; V1 = new THREE.Vector3();
      FX = window.makeBattleFX(); ctx.scene.add(FX.grp);
      const st = document.createElement('style');
      st.textContent = '.dmg.soul{color:#e4ffee;text-shadow:0 0 8px #22d86a,0 2px 0 #0a3a1e}.dmg.fire{color:#fff0d0;text-shadow:0 0 8px #ff9a30,0 2px 0 #4a2008}';
      document.head.appendChild(st);
      if (VAR.great) pickView(greatView());
      const pl = Q.get('play');
      if (pl) { Q.delete('play'); const s = Q.toString(); try { history.replaceState(null, '', location.pathname + (s ? '?' + s : '') + location.hash); } catch (e) { /* file pages may refuse */ } }
      if (pl && VAR.great) setTimeout(() => { if (window.__bench && window.__bench.play) window.__bench.play(pl); }, 300);
    },
    onAction(ctx, a) {
      const m = ctx.subject.m, S = scaleOf(m), w = ctx.actors.witch;
      ACT.name = a;
      if (a === 'eclipse') blackSun(m.anchor('sun', new THREE.Vector3()), 2.4 * (m.ACTIONS.eclipse.dur / 2.8), S > 2 ? S * 0.55 : S);
      if (a === 'grasp' && w && w.visible) FX.sigil({ x: w.x, z: w.z }, 0x2dff7a, 2.0, 1.9 * (m.ACTIONS.grasp.dur / 1.8), -2);
    },
    update(ctx, rdt, t) {
      FX.update(rdt, t);
      stepSweep(ctx, rdt);
      const sub = ctx.subject, a = sub.action, p = sub.progress;
      if (sub.m && sub.m.state) { // aim: Io, or between the two for the stolen fire
        const ids = partyUp(ctx), aim = a === 'breath' && ids.length ? ids : ['witch'].filter((id) => ctx.actors[id] && ctx.actors[id].visible);
        if (aim.length) { const c = new THREE.Vector3(); for (const id of aim) c.add(chestOf(ctx, id)); c.multiplyScalar(1 / aim.length); sub.m.state.target = { x: c.x, y: c.y, z: c.z }; }
      }
      if (a !== ACT.name || p < ACT.lastP - 1e-4) { if (a && a === ACT.name) this.onAction(ctx, a); ACT.name = a; }
      ACT.lastP = p;
      const dk = a === 'eclipse' ? ctx.smooth(0.02, 0.2, p) * (1 - ctx.smooth(0.8, 0.96, p)) * 0.5 : 0;
      darkK += (dk - darkK) * (1 - Math.exp(-rdt * 6));
      ctx.setDark(darkK);
    },
    onHit(ctx, a, i) {
      const m = ctx.subject.m, S = scaleOf(m), big = S > 2 ? 2.5 : 1;
      if (a === 'sweep') {
        const sol = ctx.actors.sol; if (!sol || !sol.visible) return true;
        const p = chestOf(ctx, 'sol');
        ctx.ring(m.anchor('hit', V1), 'hit');
        FX.slash(p, 0x5dff9d, rnd(2.4, 3.0), 1.5, 0.35); FX.burst(p, [0.3, 1, 0.55], 40, 3.6); FX.flashLight(p, 0x4dff90, 3, 0.3);
        ctx.damage('sol', ctx.swing(DMG.sweep * big, 0.07), 'soul');
      } else if (a === 'cast') {
        const ids = partyUp(ctx); if (!ids.length) return true;
        const id = ids[Math.floor(Math.random() * ids.length)];
        FX.projectile({ from: m.anchor('bolt', new THREE.Vector3()), to: () => chestOf(ctx, id), dur: 0.55, arc: rnd(0.3, 0.9) * Math.sqrt(S), side: rnd(-0.25, 0.25), color: 0x9dffc4, halo: 0x2cff7c, size: 0.2 * Math.sqrt(S), trail: [0.25, 1, 0.5], light: 0x3cff8a, lightI: 2 })
          .then(() => { const p = chestOf(ctx, id); FX.burst(p, [0.3, 1, 0.55], 22, 2.6); ctx.ring(p, 'hit'); ctx.damage(id, ctx.swing(DMG.bolt * big, 0.08), 'soul'); });
      } else if (a === 'grasp') {
        const w = ctx.actors.witch; if (!w || !w.visible) return true;
        const p = chestOf(ctx, 'witch');
        ctx.ring(p, 'hit'); FX.flashLight(p, 0x3cff8a, 3, 0.4);
        ctx.damage('witch', ctx.swing(DMG.grasp * big, 0.07), 'soul');
      } else if (a === 'eclipse') {
        for (const id of partyUp(ctx)) { const p = chestOf(ctx, id); FX.burst(p, [0.2, 1, 0.5], 80, 5); FX.flashLight(p, 0x3cff8a, 5, 0.5, 8); ctx.ring(p, 'hit'); ctx.damage(id, ctx.swing(DMG.eclipse * big, 0.06), 'soul'); }
      } else if (a === 'breath') {
        for (const id of partyUp(ctx)) { const p = chestOf(ctx, id); FX.burst(p, [1, 0.7, 0.3], 30, 3); FX.flashLight(p, 0xffa040, 3, 0.4, 6); ctx.ring(p, 'hit'); ctx.damage(id, ctx.swing(DMG.breath, 0.08), 'fire'); }
      } else if (a === 'swallow') {
        ctx.damage('wraith', '+' + ctx.swing(DMG.swallow, 0.05).toLocaleString('en-US'), 'heal');
      } else return false;
      return true;
    },
    onCue(ctx, a, i) {
      const m = ctx.subject.m, S = scaleOf(m), w = ctx.actors.witch;
      if (a === 'grasp' && w && w.visible) { FX.tendrils({ x: w.x, z: w.z }, 1.3); FX.burst(new THREE.Vector3(w.x, 0.2, w.z), [0.2, 0.9, 0.45], 50, 3, { up: 1 }); }
      if (a === 'eclipse' && i === 1) FX.ring({ x: ctx.subject.x, z: ctx.subject.z }, 0x2dff7a, 0.3, 6.5 * S, 0.9, 1);
    },
    label(ctx) {
      const s = ctx.subject, a = s.action;
      if (a === 'die') {
        const great = s.m && s.m.great;
        if (!s.busy) return (great ? 'Released: the stolen lights and the great moth have gone home' : 'Released: the moth has gone home') + '. Press Glide to call it back';
        return great ? 'Defeat: the stolen lights stream out, and a great moth rises' : 'Defeat: the robe falls empty, the soul goes home';
      }
      if (a === 'sweep' && s.progress < 0.32) return 'Soul Reaper: it swoops on Sol';
      return null;
    },
  };
})();
