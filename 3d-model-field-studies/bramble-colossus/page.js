// page.js: the field study page. It builds the meadow (frostmere.js), the colossus (colossus.js) and the camera
// (cinema.js), then either plays the film (film.js: shots, moves, words) or lets the viewer explore: orbit, labels on
// its parts, every move, its roots, the night's frost and wind, slow motion, and the numbers behind the picture.
// Sounds come from the living battlefield's sfx.js, all made in code. Built for a laptop; ?q=medium|high|max sets the
// detail, ?test drives frames from the test hooks (window.__fs) instead of the clock.
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const Qs = new URLSearchParams(location.search), TEST = Qs.has('test');
  const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private window */ } } };
  const QUALITY = ['medium', 'high', 'max'].includes(Qs.get('q')) ? Qs.get('q') : (['medium', 'high', 'max'].includes(store.get('fs-quality')) ? store.get('fs-quality') : 'high');
  const QP = { medium: { detail: .55, px: 1, scale: .8, msaa: 2 }, high: { detail: 1, px: 1.5, scale: 1, msaa: 4 }, max: { detail: 1, px: 2, scale: 1, msaa: 4 } }[QUALITY];
  const V3 = (x, y, z) => new THREE.Vector3(x || 0, y || 0, z || 0);
  const cl = (v, a, b) => (v < a ? a : v > b ? b : v), lerp = (a, b, t) => a + (b - a) * t;
  const sm = (a, b, x) => { const t = cl((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const EASE = { l: (x) => x, i: (x) => x * x, o: (x) => 1 - (1 - x) * (1 - x), io: (x) => x * x * (3 - 2 * x) };
  const film = makeFilm();
  let E = null; // the engine, once built

  // ---------- building it, in steps, so the loading line can move ----------
  const steps = [
    ['Painting the sky', () => {
      const canvas = $('gl');
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', stencil: false });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, QP.px));
      renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.info.autoReset = false;
      E = { renderer, canvas, ms: {} };
    }],
    ['Growing the meadow', () => { const t = performance.now(); E.world = makeFrostmere(E.renderer, { quality: QUALITY }); E.ms.world = performance.now() - t; }],
    ['Growing the bramble', () => {
      const t = performance.now(); E.model = makeBrambleColossus({ shadows: true, detail: QP.detail }); E.ms.model = performance.now() - t;
      E.world.scene.add(E.model.root, E.model.fx); E.world.setWarm(E.model.root.position, 20);
    }],
    ['Setting up the camera', () => {
      E.camera = new THREE.PerspectiveCamera(36, 1, .12, 12000);
      E.cine = makeCinema(E.renderer, { scale: QP.scale, msaa: QP.msaa }); E.cine.sun(E.world.moonDir);
      E.scaleFig = makeFigure(); E.scaleFig.visible = false; E.world.scene.add(E.scaleFig);
      resize(); window.addEventListener('resize', resize);
      E.camera.position.set(40, 22, 70); E.camera.lookAt(0, 4, 0);
    }],
    ['Waking it', () => { const t = performance.now(); E.renderer.compile(E.world.scene, E.camera); pose('rest', 3); frame(1 / 30, 1 / 30); E.ms.compile = performance.now() - t; }]
  ];
  function boot(i) {
    if (i >= steps.length) return ready();
    $('loadStep').textContent = steps[i][0];
    $('loadBar').style.width = Math.round(i / steps.length * 100) + '%';
    $('loadBar').parentNode.setAttribute('aria-valuenow', Math.round(i / steps.length * 100));
    setTimeout(() => {
      try { steps[i][1](); boot(i + 1); } catch (e) {
        console.error(e); $('loadStep').textContent = 'It could not start here: ' + (e && e.message ? e.message : e) + '. It needs a browser with WebGL 2, such as a current Chrome, Edge, Firefox or Safari.';
        window.__err = String(e && e.stack || e);
      }
    }, TEST ? 0 : 60);
  }
  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    E.renderer.setSize(w, h, false); E.camera.aspect = w / h; E.camera.updateProjectionMatrix();
  }

  // ---------- a person, for scale: 1.75 m, plain and grey, as natural-history plates draw one ----------
  function makeFigure() {
    const g = new THREE.Group(), m = new THREE.MeshStandardMaterial({ color: new THREE.Color(.36, .37, .42), roughness: .85 });
    const body = new THREE.LatheGeometry([[0, 0], [.13, 0], [.15, .45], [.13, .85], [.18, 1.05], [.21, 1.3], [.17, 1.45], [.07, 1.5], [0, 1.52]].map((p) => new THREE.Vector2(p[0], p[1])), 20);
    const head = new THREE.SphereGeometry(.11, 20, 14); head.translate(0, 1.64, 0);
    for (const geo of [body, head]) { const mesh = new THREE.Mesh(geo, m); mesh.castShadow = mesh.receiveShadow = true; g.add(mesh); }
    for (const s of [-1, 1]) { const a = new THREE.Mesh(new THREE.CylinderGeometry(.045, .04, .62, 10), m); a.position.set(s * .23, 1.12, 0); a.rotation.z = s * .08; a.castShadow = true; g.add(a); }
    g.position.set(4.2, 0, 9.6); g.rotation.y = Math.PI + .3;
    return g;
  }

  // ---------- time ----------
  const clock = { sim: 0, real: 0, slow: 1, userSlow: 1, paused: false, hitstop: 0 };
  let mode = 'start';         // 'start' | 'film' | 'explore'
  const shake = { k: 0, t: 0 };
  function frame(realDt, forceSim, noDraw) {
    const w = E.world, m = E.model;
    let simDt = forceSim !== undefined ? forceSim : (clock.paused ? 0 : realDt * clock.slow * clock.userSlow);
    if (clock.hitstop > 0) { clock.hitstop -= realDt; simDt *= .05; }
    clock.sim += simDt; if (!clock.paused) clock.real += realDt;
    if (mode === 'film' && !clock.paused) filmStep(realDt);
    if (mode === 'explore') orbitStep(realDt);
    // its prey: the camera itself in some shots, else a point before it
    if (prey === 'camera') { const c = E.camera.position; m.state.target = { x: c.x, y: Math.max(1.1, c.y - .3), z: c.z }; } else m.state.target = null;
    m.animate(0, 0, clock.sim, simDt);
    watchModel();
    applyShake(realDt);
    if (noDraw) { if (shakeOff) E.camera.quaternion.copy(shakeOff); return; }
    w.update(clock.sim, simDt, E.camera);
    E.renderer.info.reset();
    E.cine.render(w.scene, E.camera, realDt);
    if (shakeOff) E.camera.quaternion.copy(shakeOff);
    labelsStep(); statsStep(realDt);
  }
  let shakeOff = null;
  const _q = new THREE.Quaternion(), _e = new THREE.Euler();
  function applyShake(dt) {
    // impacts: a quick tremor that dies away (handheld drift is part of the shot itself)
    shake.k = Math.max(0, shake.k - dt * 1.8); shake.t += dt;
    if (shake.k > .001) {
      shakeOff = E.camera.quaternion.clone();
      const k = shake.k * shake.k * .03, t = shake.t * 40;
      _e.set(Math.sin(t * 1.3) * k, Math.sin(t * 1.7 + 1) * k, Math.sin(t * .9 + 2) * k * .5); _q.setFromEuler(_e); E.camera.quaternion.multiply(_q);
    } else shakeOff = null;
  }
  let lastNow = 0;
  function loop(now) {
    const dt = lastNow ? Math.min(.05, (now - lastNow) / 1000) : 1 / 60; lastNow = now;
    if (E && E.cine) frame(dt);
    requestAnimationFrame(loop);
  }

  // ---------- poses, prey ----------
  let prey = 'mark';
  function pose(name, settle) {
    const m = E.model; m.reset();
    if (name === 'rest') m.play('rest', true);
    const n = Math.round((settle || 2.5) * 30); for (let i = 0; i < n; i++) { clock.sim += 1 / 30; m.animate(0, 0, clock.sim, 1 / 30); }
    lastAct = m.action; lastProg = m.progress;
  }

  // ---------- what the model does: sounds, shockwaves through the grass, tremors ----------
  let lastAct = '', lastProg = -1, lastBeat = 0;
  const SOUNDS = {
    appear: [[0, 'rumble', 1], [.6, 'roar', 1]], alert: [[.05, 'creak', .9], [.2, 'rustle', .7]], bloom: [[.25, 'bloom', 1], [.4, 'pollen', .8]],
    lance: [[.3, 'swoosh', .8]], slam: [[.1, 'growl', .9], [.36, 'creak', .8]], whirl: [[.2, 'whirl', 1]], volley: [[.38, 'whip', 1], [.5, 'whip', 1]],
    devour: [[.18, 'grab', 1]], briar: [[.3, 'rumble', .9]], enrage: [[.4, 'roar', 1]], hurt: [[0, 'growl', .7]], burn: [[0, 'sizzle', 1]], die: [[.48, 'crash', 1]], rest: [[0, 'creak', .5]]
  };
  const HITS = { lance: ['smash', 1, 'impact'], slam: ['slam', 1.7, 'impact'], whirl: ['whip', .5, 'ring'], volley: ['thorns', .6, 'impact'], devour: ['gulp', .3, 'held'], briar: ['shoots', 1.1, 'impact'] };
  const _v = V3();
  function watchModel() {
    const m = E.model, a = m.action, p = m.progress;
    if (a && (a !== lastAct || p < lastProg)) { lastProg = -1e-6; } // a move has started
    if (a) {
      for (const [u, name, g] of SOUNDS[a] || []) if (lastProg < u && p >= u) sfx(name, g);
      const def = m.ACTIONS[a], H = HITS[a];
      for (const h of def.hits) if (lastProg < h && p >= h) {
        if (H) sfx(H[0], .9);
        const k = H ? H[1] : .6;
        if (!H || H[2] === 'impact') { m.anchor('impact', _v); E.world.impact(_v.x, _v.z, k); }
        else if (H[2] === 'ring') E.world.impact(m.root.position.x, m.root.position.z, k);
        const d = E.camera.position.distanceTo(_v.set(0, 2, 6)); shake.k = Math.max(shake.k, k * cl(16 / d, .3, 1.2)); shake.t = 0;
        if (a === 'lance' || a === 'slam') clock.hitstop = .08;
      }
      for (const c of def.cues || []) if (lastProg < c && p >= c) {
        if (a === 'appear' || a === 'enrage' || a === 'die') { E.world.impact(m.root.position.x, m.root.position.z, a === 'die' ? 1.4 : 1.2); shake.k = Math.max(shake.k, .8); shake.t = 0; }
      }
    }
    lastAct = a; lastProg = a ? p : -1;
    // its heartbeat, heard close to
    if (m.beats !== lastBeat) { lastBeat = m.beats; const d = E.camera.position.distanceTo(m.anchor('heart', _v)); if (d < 22) sfx('heartbeat', cl(1.3 - d / 18, .08, 1)); }
  }

  // ---------- sound and the narrator ----------
  let snd = null, soundOn = true, voiceOn = false;
  function sfx(name, g) { if (snd && soundOn && snd.ready) { try { snd.play(name, { gain: g === undefined ? 1 : g }); } catch (e) { /* a sound it does not have */ } } }
  function startSound() {
    if (snd || TEST || typeof makeFightSound !== 'function') return;
    try { snd = makeFightSound(); snd.init(); snd.ambience({ wind: .55, gust: .35, rain: 0, wrath: 0, night: 0 }); } catch (e) { snd = null; }
  }
  function setSound(on) { soundOn = on; $('soundBtn').setAttribute('aria-pressed', String(on)); $('soundBtn').textContent = on ? 'Sound on' : 'Sound off'; if (snd) snd.setMuted(!on); }
  let voice = null;
  function pickVoice() {
    if (!('speechSynthesis' in window)) return null;
    const vs = speechSynthesis.getVoices().filter((v) => /^en/i.test(v.lang));
    const pref = ['Daniel', 'Google UK English Male', 'Arthur', 'Microsoft Ryan', 'Microsoft George', 'Oliver', 'Alex', 'Google UK English Female', 'Samantha'];
    for (const p of pref) { const v = vs.find((x) => x.name.indexOf(p) >= 0); if (v) return v; }
    return vs[0] || null;
  }
  function say(text) {
    if (!voiceOn || !('speechSynthesis' in window)) return;
    try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); voice = voice || pickVoice(); if (voice) u.voice = voice; u.rate = .9; u.pitch = .92; speechSynthesis.speak(u); } catch (e) { /* no voice here */ }
  }
  function setVoice(on) {
    voiceOn = on && 'speechSynthesis' in window; $('voiceBtn').setAttribute('aria-pressed', String(voiceOn)); $('voiceBtn').textContent = voiceOn ? 'Narrator on' : 'Narrator off';
    if (!voiceOn && 'speechSynthesis' in window) speechSynthesis.cancel();
    if (!('speechSynthesis' in window)) $('voiceBtn').hidden = true;
  }

  // ---------- the film ----------
  let ft = 0, shotNow = null, chapNow = null, sayNow = null, driftOnly = false;
  const flat = []; film.chapters.forEach((c, ci) => c.shots.forEach((s, si) => flat.push({ c, ci, s, si })));
  function shotAt(t) { for (const f of flat) if (t >= f.s.start && t < f.s.start + f.s.d) return f; return flat[flat.length - 1]; }
  function keyed(list, t, def) { if (!list || !list.length) return def; let v = list[0][1]; for (const [k, x] of list) { if (t >= k) v = x; } for (let i = 0; i < list.length - 1; i++) { const [a, va] = list[i], [b, vb] = list[i + 1]; if (t >= a && t < b) return lerp(va, vb, (t - a) / (b - a)); } return v; }
  function setup(c) {
    const s = c.setup || {};
    prey = s.prey || 'mark';
    pose(s.pose || 'base', 3);
    E.model.state.xray = s.xray || 0; E.model.state.open = s.open || 0; E.model.state.wrath = 0;
    E.world.set({ frost: s.frost === undefined ? 1 : s.frost }); E.model.state.frost = .55 * (s.frost === undefined ? 1 : s.frost);
    E.scaleFig.visible = false;
  }
  function seek(t) {
    ft = cl(t, 0, film.total - .01); const f = shotAt(ft);
    chapNow = null; shotNow = null; firedTo = f.s.start; enterShot(f, true); firedTo = ft;
  }
  let firedTo = 0;
  function enterShot(f, jump) {
    if (chapNow !== f.c) { chapNow = f.c; setup(f.c); markChapter(); }
    shotNow = f; clearCard();
    if (jump && f.s.start < ft) { /* acts before the seek point are skipped: a chapter always begins at its start */ }
  }
  function filmStep(dt) {
    const prev = ft; ft += dt;
    if (driftOnly && ft > film.chapters[0].end - 1.5) ft = 3; // behind the start screen the opening shot drifts on
    if (ft >= film.total) { ft = film.total - .001; endFilm(); return; }
    const f = shotAt(ft); if (f !== shotNow) enterShot(f);
    const s = f.s, st = ft - s.start, pst = prev - s.start;
    // moves and sounds on cue
    for (const [t, name] of s.act || []) if (pst < t && st >= t && prev >= firedTo - 1e-6) { if (name === 'taste') E.model.taste(); else E.model.play(name, true); }
    for (const [t, name, g] of s.sound || []) if (pst < t && st >= t) { if (name === 'wind' && snd) snd.ambience({ wind: g, gust: .35, rain: 0, wrath: 0, night: 0 }); }
    clock.slow = keyed(s.slow, st, 1);
    const env = s.env || {};
    if (env.xray) E.model.state.xray = keyed(env.xray, st, 0);
    if (env.open) E.model.state.open = keyed(env.open, st, 0);
    filmCamera(s, st);
    filmLook(s, st);
    filmWords(f, s, st);
    $('clock').textContent = fmt(ft) + ' / ' + fmt(film.total);
    updateChapters();
  }
  const _a = V3(), _b = V3(), _c = V3(), _d = V3();
  function resolve(x, out) { if (Array.isArray(x)) return out.fromArray(x); if (typeof x === 'string') return E.model.anchor(x, out); return out.set(0, 3, 0); }
  function filmCamera(s, st) {
    const c = s.cam, u = cl(st / s.d, 0, 1), e = (EASE[c.ease] || EASE.io)(u), cam = E.camera;
    if (c.orbit) { const o = c.orbit, an = lerp(o.a0, o.a1, e); cam.position.set(o.c[0] + Math.sin(an) * o.r, o.c[1] + o.h, o.c[2] + Math.cos(an) * o.r); _b.fromArray(o.c); }
    else { cam.position.fromArray(c.from).lerp(_a.fromArray(c.to), e); resolve(c.at, _b); if (c.at2) _b.lerp(resolve(c.at2, _c), e); }
    // a handheld drift, and a walk's sway when the camera is the prey stepping closer
    const hk = c.shake || 0, t = clock.real;
    if (c.walk) { cam.position.y += Math.abs(Math.sin(t * 3.6)) * .05 - .025; cam.position.x += Math.sin(t * 1.8) * .04; }
    cam.lookAt(_b);
    if (hk > 0) { _e.set((Math.sin(t * .9) * .6 + Math.sin(t * 2.3 + 1) * .3 + Math.sin(t * 5.1) * .1) * hk * .012, (Math.sin(t * .7 + 2) * .6 + Math.sin(t * 1.9) * .4) * hk * .014, Math.sin(t * .5 + 3) * hk * .006); _q.setFromEuler(_e); cam.quaternion.multiply(_q); }
    if (cam.view && cam.view.enabled) cam.clearViewOffset();
    cam.fov = c.fov ? lerp(c.fov[0], c.fov[1], e) : 36; cam.updateProjectionMatrix();
    focusTo(s.focus, cam);
  }
  let focusD = 12;
  function focusTo(f, cam, rate) {
    let d;
    if (typeof f === 'number') d = f; else d = cam.position.distanceTo(resolve(f || [0, 3, 0], _d));
    focusD += (d - focusD) * (1 - Math.exp(-(rate || 5) * (1 / 60))); if (Math.abs(focusD - d) > d * .5) focusD = d;
    E.cine.params.focus = focusD;
  }
  function filmLook(s, st) {
    const P = E.cine.params;
    P.aperture = s.ap === undefined ? .5 : s.ap; P.exposure = s.exp || 1.25;
    P.bars += ((s.bars || .06) - P.bars) * .05;
    P.fade = s.fade ? keyed(s.fade, st, 1) : 1;
    // the film's own title, and the end
    const tc = !driftOnly && s.title && st >= s.title[0] && st < s.title[1]; $('titlecard').hidden = !tc;
    const en = s.end && st >= s.end[0]; if (en && $('endcard').hidden) showSheet();
  }
  function filmWords(f, s, st) {
    if (driftOnly) { $('caption').classList.remove('on', 'kick'); return; }
    let w = null; for (const x of s.say || []) if (st >= x[0] && st < x[1]) w = x;
    if (w !== sayNow) {
      sayNow = w; const cap = $('caption');
      if (w) { $('capWords').textContent = w[2]; cap.classList.add('on'); say(w[2]); } else cap.classList.remove('on');
    }
    const kick = f.c.id !== 'title' && st < 6 && f.si === 0; $('caption').classList.toggle('kick', kick || !!w);
    $('capKick').textContent = f.c.id === 'title' ? '' : f.c.kicker + ' · ' + f.c.title;
    if (s.card) { const on = st >= s.card[0] && st < s.card[1]; if (on && $('card').hidden) showCard(s.card[2]); if (!on && !$('card').hidden) clearCard(); }
  }
  function showCard(id) { const c = film.cards[id]; if (!c) return; $('cardTitle').textContent = c.title; $('cardRows').innerHTML = c.rows.map((r) => '<dt>' + r[0] + '</dt><dd>' + r[1] + '</dd>').join(''); $('card').hidden = false; }
  function clearCard() { $('card').hidden = true; }
  function showSheet() { $('sheetName').textContent = film.sheet.name; $('sheetRows').innerHTML = film.sheet.rows.map((r) => '<dt>' + r[0] + '</dt><dd>' + r[1] + '</dd>').join(''); $('endcard').hidden = false; $('caption').classList.remove('on', 'kick'); }
  function endFilm() { clock.paused = true; setPlayIcon(); showSheet(); }
  const fmt = (t) => Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
  // the chapter strip
  function buildChapters() {
    const box = $('chapters'); box.innerHTML = '';
    film.chapters.forEach((c, i) => {
      const b = document.createElement('button'); b.className = 'chap'; b.type = 'button'; b.setAttribute('role', 'listitem'); b.style.flexGrow = String(c.end - c.start);
      b.innerHTML = '<span>' + (i ? c.title : 'Opening') + '</span><b><i></i></b>'; b.setAttribute('aria-label', 'Play from ' + (i ? c.title : 'the opening'));
      b.addEventListener('click', () => { if (mode !== 'film') toFilm(); $('endcard').hidden = true; seek(c.start); clock.paused = false; setPlayIcon(); });
      box.appendChild(b);
    });
  }
  function updateChapters() { film.chapters.forEach((c, i) => { const el = $('chapters').children[i]; if (!el) return; el.querySelector('i').style.width = (cl((ft - c.start) / (c.end - c.start), 0, 1) * 100) + '%'; el.classList.toggle('now', c === chapNow); }); }
  function markChapter() { updateChapters(); }
  function setPlayIcon() { const p = $('play'); p.innerHTML = clock.paused ? '&#9654;' : '&#10074;&#10074;'; p.setAttribute('aria-label', clock.paused ? 'Play' : 'Pause'); }

  // ---------- Explore: orbit, labels, every move ----------
  const orbit = { target: V3(0, 3.6, 0), gt: V3(0, 3.6, 0), dist: 21, gd: 21, theta: -1.2, gth: -1.2, phi: 1.32, gph: 1.32, auto: false };
  function orbitStep(dt) {
    if (orbit.auto && !drag) orbit.gth += dt * .06;
    const k = 1 - Math.exp(-dt * 7);
    orbit.theta += (orbit.gth - orbit.theta) * k; orbit.phi += (orbit.gph - orbit.phi) * k; orbit.dist += (orbit.gd - orbit.dist) * k; orbit.target.lerp(orbit.gt, k);
    const c = E.camera, sp = Math.sin(orbit.phi);
    c.position.set(orbit.target.x + Math.sin(orbit.theta) * sp * orbit.dist, orbit.target.y + Math.cos(orbit.phi) * orbit.dist, orbit.target.z + Math.cos(orbit.theta) * sp * orbit.dist);
    const gy = E.world.heightAt(c.position.x, c.position.z) + .25; if (c.position.y < gy) c.position.y = gy;
    c.lookAt(orbit.target); c.fov = 36; c.updateProjectionMatrix();
    // keep what it looks at in the middle of the part of the screen the drawer leaves free
    const dw = $('explore').hidden ? 0 : $('explore').offsetWidth, sw = window.innerWidth, sh = window.innerHeight;
    if (dw > 0 && sw > 720) c.setViewOffset(sw, sh, dw / 2, 0, sw, sh); else if (c.view && c.view.enabled) c.clearViewOffset();
    const P = E.cine.params; P.exposure = 1.5; P.bars += (0 - P.bars) * .1; P.fade = 1; P.aperture = +$('sAp').value;
    focusTo(orbit.target.toArray(), c, 8);
  }
  let drag = null;
  function bindOrbit() {
    const cv = E.canvas, st = $('stage');
    cv.addEventListener('pointerdown', (e) => { if (mode !== 'explore') return; drag = { x: e.clientX, y: e.clientY, pan: e.button === 2 || e.shiftKey }; cv.setPointerCapture(e.pointerId); st.classList.add('grabbing'); });
    cv.addEventListener('pointermove', (e) => {
      if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY;
      if (drag.pan) { const c = E.camera, r = V3().setFromMatrixColumn(c.matrix, 0), u = V3().setFromMatrixColumn(c.matrix, 1), k = orbit.dist * .0016; orbit.gt.addScaledVector(r, -dx * k).addScaledVector(u, dy * k); orbit.gt.y = cl(orbit.gt.y, .2, 12); }
      else { orbit.gth -= dx * .005; orbit.gph = cl(orbit.gph - dy * .004, .18, 1.66); }
    });
    const up = () => { drag = null; st.classList.remove('grabbing'); };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('contextmenu', (e) => { if (mode === 'explore') e.preventDefault(); });
    cv.addEventListener('wheel', (e) => { if (mode !== 'explore') return; e.preventDefault(); orbit.gd = cl(orbit.gd * Math.exp(e.deltaY * .0012), 1.2, 140); }, { passive: false });
    cv.addEventListener('dblclick', () => { if (mode === 'explore') frontView(); });
  }
  function frontView() { orbit.gt.set(0, 3.6, 0); orbit.gd = 21; orbit.gth = -1.2 + Math.round((orbit.gth + 1.2) / (Math.PI * 2)) * Math.PI * 2; orbit.gph = 1.32; }
  const MOVES = [['rest', 'Rest', 'a hill of brambles'], ['alert', 'Wake', 'every cane rises'], ['taste', 'Taste the air', 'one cane lifts'], ['bloom', 'Siren Bloom', 'the flower opens'],
    ['lance', 'Thorn Lance', 'one arm spears down'], ['slam', 'Hammerfall', 'both arms as one club'], ['whirl', 'Maelstrom', 'every cane whirls'], ['volley', 'Thorn Volley', 'thorns flung high'],
    ['devour', 'Devour', 'lifted into the flower'], ['briar', 'Thornwood', 'shoots from the soil'], ['enrage', 'Wrath', 'its second phase'], ['burn', 'Scorch', 'its fear of fire'],
    ['hurt', 'Hurt', 'it flinches'], ['die', 'Felled', 'then it grows back']];
  function buildMoves() {
    const box = $('moves');
    for (const [id, name, note] of MOVES) {
      const b = document.createElement('button'); b.type = 'button'; b.innerHTML = name + '<small>' + note + '</small>';
      b.addEventListener('click', () => {
        const m = E.model;
        if (id === 'taste') { if (m.action === 'rest' || !m.action) m.taste(); return; }
        if (id === 'die' && m.action === 'die') { m.play('appear', true); return; }
        if (id === 'enrage') { m.play('enrage', true); setTimeout(() => { m.state.wrath = 1; $('tWrath').checked = true; }, 1400); return; }
        m.play(id, true);
      });
      box.appendChild(b);
    }
  }
  // labels on its parts
  const LABELS = [
    ['bud', 'Bud', 'Five crimson sepals round five rose petals; taller than a person.'],
    ['heart', 'Heart', 'A blackberry the size of a barrel, lit from inside. Bare only while the bud is open.'],
    ['chest', 'Spire', 'Three old canes braided round each other, grey with age.'],
    ['hit', 'Lead arm', 'A cane 9 m long, the one that lances.'],
    ['hitmid', 'Prickles', 'Hooked back toward the base and flattened where they grow, on the cane’s five angles.'],
    ['cane2', 'Mane', 'Two great canes arched back over it.'],
    ['cane7', 'Legs', 'Six canes arched over the soil; their tips have rooted.'],
    ['fruit', 'Fruit', 'Green, red and black together, all winter.'],
    ['crown', 'Root mound', 'Twisted roots and dead grey canes over the hollow where it feeds.'],
    ['roots', 'Roots', 'Under the meadow, out to about 20 m. The frost stops where they end.']
  ];
  const labEls = [];
  function buildLabels() {
    const box = $('labels');
    for (const [id, name, note] of LABELS) {
      const el = document.createElement('button'); el.type = 'button'; el.className = 'lab'; el.innerHTML = '<span><b>' + name + '</b> <em>' + note + '</em></span>';
      el.addEventListener('click', () => { const open = el.classList.toggle('open'); if (open) { const p = labelPos(id, V3()); orbit.gt.copy(p); orbit.gd = id === 'roots' ? 30 : id === 'crown' ? 9 : 6.5; if (id === 'roots') { $('tXray').checked = true; E.model.state.xray = 1; } } });
      box.appendChild(el); labEls.push({ id, el });
    }
  }
  function labelPos(id, out) { if (id === 'roots') return out.set(9, .2, 7); return E.model.anchor(id, out); }
  const _p = V3();
  function labelsStep() {
    const show = mode === 'explore' && $('tLabels').checked;
    $('labels').hidden = !show; if (!show) return;
    const w = window.innerWidth, h = window.innerHeight;
    for (const L of labEls) {
      labelPos(L.id, _p); _p.project(E.camera);
      const vis = _p.z < 1 && Math.abs(_p.x) < 1.05 && Math.abs(_p.y) < 1.05 && (L.id !== 'heart' || E.model.open > .5) && (L.id !== 'roots' || E.model.state.xray > .5);
      L.el.style.display = vis ? '' : 'none';
      if (vis) L.el.style.transform = 'translate(' + ((_p.x * .5 + .5) * w - 6).toFixed(1) + 'px,' + ((-_p.y * .5 + .5) * h).toFixed(1) + 'px) translateY(-50%)';
    }
  }

  // ---------- the numbers ----------
  const fpsS = { acc: 0, n: 0, fps: 60, slow: 0 };
  function statsStep(dt) {
    fpsS.acc += dt; fpsS.n++;
    if (fpsS.acc > .5) {
      fpsS.fps = fpsS.n / fpsS.acc; fpsS.acc = 0; fpsS.n = 0;
      // a hint, once, if it runs too slowly here
      if (!TEST && QUALITY !== 'medium' && mode !== 'start') { fpsS.slow = fpsS.fps < 22 ? fpsS.slow + 1 : 0; if (fpsS.slow === 10 && !store.get('fs-hinted')) { store.set('fs-hinted', '1'); hint('It is running slowly on this machine. Explore, then Under the hood, has a lighter Detail setting.'); } }
      if (!$('stats').hidden) {
        const r = E.renderer, i = r.info, s = E.cine.size;
        $('stats').textContent = [
          Math.round(fpsS.fps) + ' frames a second', 'drawn this frame: ' + (i.render.triangles / 1e6).toFixed(2) + ' M triangles in ' + i.render.calls + ' draw calls',
          'the bramble: ' + (E.model.stats.triangles / 1e6).toFixed(2) + ' M triangles, ' + E.model.stats.bones + ' bones, ' + E.model.stats.drawCalls + ' draw calls',
          'the meadow: ' + E.world.stats.grass.toLocaleString() + ' blades of grass, ' + E.world.stats.trees.toLocaleString() + ' trees',
          'built in ' + Math.round(E.ms.world) + ' ms (meadow) + ' + Math.round(E.ms.model) + ' ms (bramble)', 'picture ' + s.w + ' × ' + s.h + ', detail ' + QUALITY, 'textures in memory: ' + i.memory.textures + ', geometries: ' + i.memory.geometries
        ].join('\n');
      }
    }
  }
  function hint(t) { const h = $('hint'); h.textContent = t; h.hidden = false; setTimeout(() => { h.hidden = true; }, 9000); }

  // ---------- modes and controls ----------
  function toFilm(fromStart) {
    driftOnly = false; mode = 'film'; $('explore').hidden = true; $('stage').classList.remove('grab'); $('labels').hidden = true; $('bar').hidden = false; $('modeBtn').textContent = 'Explore';
    $('caption').hidden = false; clock.userSlow = 1; clock.paused = false; setPlayIcon();
    if (fromStart || ft >= film.total - .1) seek(0); else seek(chapNow ? chapNow.start : 0);
  }
  function toExplore() {
    driftOnly = false; mode = 'explore'; $('explore').hidden = false; $('stage').classList.add('grab'); $('modeBtn').textContent = 'Film'; $('endcard').hidden = true; $('titlecard').hidden = true; clearCard();
    $('caption').classList.remove('on', 'kick'); $('caption').hidden = true; clock.slow = 1; clock.paused = false; setPlayIcon();
    prey = 'mark'; E.model.state.xray = $('tXray').checked ? 1 : 0; E.model.state.open = $('tOpen').checked ? 1 : 0; E.model.state.wrath = $('tWrath').checked ? 1 : 0; E.scaleFig.visible = $('tScale').checked;
    // start from where the film's camera is, and glide to the orbit
    const c = E.camera.position, t = orbit.gt; const off = c.clone().sub(t); orbit.dist = off.length(); orbit.theta = Math.atan2(off.x, off.z); orbit.phi = Math.acos(cl(off.y / orbit.dist, -1, 1)); orbit.target.copy(t);
    frontView(); orbit.gth = orbit.theta + Math.atan2(Math.sin(orbit.gth - orbit.theta), Math.cos(orbit.gth - orbit.theta));
    E.cine.params.bars = 0;
  }
  function bindUI() {
    $('goFilm').addEventListener('click', () => { startSound(); $('start').hidden = true; toFilm(true); });
    $('goExplore').addEventListener('click', () => { startSound(); $('start').hidden = true; $('bar').hidden = false; toExplore(); });
    $('again').addEventListener('click', () => { $('endcard').hidden = true; toFilm(true); });
    $('endExplore').addEventListener('click', () => { $('endcard').hidden = true; toExplore(); });
    $('backFilm').addEventListener('click', () => toFilm());
    $('modeBtn').addEventListener('click', () => (mode === 'explore' ? toFilm() : toExplore()));
    $('play').addEventListener('click', togglePause);
    $('soundBtn').addEventListener('click', () => { startSound(); setSound(!soundOn); });
    $('voiceBtn').addEventListener('click', () => setVoice(!voiceOn));
    $('fullBtn').addEventListener('click', () => { const d = document; try { if (d.fullscreenElement) d.exitFullscreen(); else d.documentElement.requestFullscreen().catch(() => {}); } catch (e) { /* not here */ } });
    $('tXray').addEventListener('change', (e) => { E.model.state.xray = e.target.checked ? 1 : 0; });
    $('tOpen').addEventListener('change', (e) => { E.model.state.open = e.target.checked ? 1 : 0; });
    $('tWrath').addEventListener('change', (e) => { E.model.state.wrath = e.target.checked ? 1 : 0; });
    $('tScale').addEventListener('change', (e) => { E.scaleFig.visible = e.target.checked; if (e.target.checked) { orbit.gt.set(2.2, 2.2, 6.8); orbit.gd = 16; } });
    $('tAuto').addEventListener('change', (e) => { orbit.auto = e.target.checked; });
    $('tStats').addEventListener('change', (e) => { $('stats').hidden = !e.target.checked; });
    $('sFrost').addEventListener('input', (e) => { const v = +e.target.value; E.world.set({ frost: v }); E.model.state.frost = .55 * v; });
    $('sWind').addEventListener('input', (e) => { const v = +e.target.value; E.world.set({ wind: { x: v, z: v * .33 } }); E.model.state.wind = { x: v * .6, z: v * .2 }; });
    $('sMist').addEventListener('input', (e) => { E.world.set({ mist: +e.target.value }); });
    document.querySelectorAll('.seg button').forEach((b) => b.addEventListener('click', () => { clock.userSlow = +b.dataset.slow; document.querySelectorAll('.seg button').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); }));
    $('resetView').addEventListener('click', frontView);
    $('preyBtn').addEventListener('click', () => { prey = prey === 'camera' ? 'mark' : 'camera'; $('preyBtn').textContent = prey === 'camera' ? 'Its prey: you' : 'Its prey: in front'; });
    $('quality').value = QUALITY;
    $('quality').addEventListener('change', (e) => { store.set('fs-quality', e.target.value); const u = new URL(location.href); u.searchParams.set('q', e.target.value); location.href = u.toString(); });
    document.addEventListener('keydown', (e) => {
      if (e.target && /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
      if (e.code === 'Space' && mode !== 'start') { e.preventDefault(); togglePause(); }
      if (e.key === 'e' || e.key === 'E') { if (mode === 'film') toExplore(); else if (mode === 'explore') toFilm(); }
      if (mode === 'film' && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) { const i = film.chapters.indexOf(chapNow) + (e.key === 'ArrowRight' ? 1 : -1); const c = film.chapters[cl(i, 0, film.chapters.length - 1)]; $('endcard').hidden = true; seek(c.start); }
      if (mode === 'explore' && (e.key === 'l' || e.key === 'L')) { $('tLabels').checked = !$('tLabels').checked; }
      if (mode === 'explore' && (e.key === 'x' || e.key === 'X')) { $('tXray').checked = !$('tXray').checked; E.model.state.xray = $('tXray').checked ? 1 : 0; }
    });
    // the bar fades when the mouse is still
    let idleT = 0; const wake = () => { $('bar').classList.remove('idle'); clearTimeout(idleT); idleT = setTimeout(() => { if (mode === 'film' && !clock.paused) $('bar').classList.add('idle'); }, 2600); };
    document.addEventListener('pointermove', wake); document.addEventListener('keydown', wake);
  }
  function togglePause() { clock.paused = !clock.paused; setPlayIcon(); if (clock.paused && 'speechSynthesis' in window) speechSynthesis.pause(); else if ('speechSynthesis' in window) speechSynthesis.resume(); }

  function ready() {
    $('loadBar').style.width = '100%';
    $('load').hidden = true; $('start').hidden = false; mode = 'start';
    buildChapters(); buildMoves(); buildLabels(); bindUI(); bindOrbit(); setVoice(false);
    // behind the start screen: a slow drift over the meadow
    startDrift();
    if (!TEST) requestAnimationFrame(loop);
    window.__ready = true;
  }
  function startDrift() { seek(0); mode = 'film'; E.cine.params.bars = 0; clock.paused = false; ft = 4; driftOnly = true; }

  // ---------- test hooks ----------
  window.__fs = {
    get E() { return E; }, film,
    stats: () => ({ worldMs: E && Math.round(E.ms.world), modelMs: E && Math.round(E.ms.model), compileMs: E && Math.round(E.ms.compile), quality: QUALITY }),
    seek(t) { driftOnly = false; mode = 'film'; $('start').hidden = true; seek(t); return shotAt(ft).c.id; },
    // play the film from the start of the shot that holds t up to t without drawing, then draw (the moves happen)
    at(t, draw) { driftOnly = false; mode = 'film'; $('start').hidden = true; const f = shotAt(t); seek(f.s.start); while (ft < t - 1e-6) frame(Math.min(1 / 30, t - ft), undefined, true); if (draw !== false) return this.step(1, 1 / 30); return { ft }; },
    explore() { $('start').hidden = true; toExplore(); },
    sim(sec) { for (let t = 0; t < sec; t += 1 / 30) frame(1 / 30, undefined, true); return true; },
    step(n, dt) { for (let i = 0; i < (n || 1); i++) frame(dt || 1 / 30); E.renderer.getContext().finish(); return { ft, mode, calls: E.renderer.info.render.calls, tris: E.renderer.info.render.triangles }; },
    view(v) { // Explore only: set the orbit directly
      if (v.explore) { this.explore(); }
      if (v.orbit) { const o = v.orbit; orbit.gt.fromArray(o.t || [0, 3.6, 0]); orbit.target.copy(orbit.gt); orbit.gd = orbit.dist = o.d || 20; orbit.gth = orbit.theta = o.th || 0; orbit.gph = orbit.phi = o.ph || 1.3; }
      if (v.act) E.model.play(v.act, true); if (v.state) Object.assign(E.model.state, v.state); if (v.ap !== undefined) $('sAp').value = v.ap;
      if (v.labels !== undefined) $('tLabels').checked = v.labels;
      return this.step(v.frames || 2, v.dt);
    }
  };
  boot(0);
})();
