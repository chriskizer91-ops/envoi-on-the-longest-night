// page.js: the field study page. It builds the meadow (frostmere.js), the colossus (colossus.js) and the camera
// (cinema.js), then either plays the film (film.js: shots, moves, words) or lets the viewer explore: orbit, labels on
// its parts, every move, its roots, the night's frost and wind, slow motion, and the numbers behind the picture.
// It can walk: a film may give it a route, and in Explore it can wander. Its sounds and the night's come from sounds.js,
// all made in code, with a sound check to try each one. Built for a laptop; ?q=medium|high|max sets the detail, ?test
// drives frames from the test hooks (window.__fs) instead of the clock (add &sound to let it make sound).
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
      const t = performance.now(); E.model = makeBrambleColossus({ shadows: true, detail: QP.detail, level: film.level || 1 }); E.ms.model = performance.now() - t;
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
    moveStep(realDt, simDt);
    if (prey === 'camera') { const c = E.camera.position; m.state.target = { x: c.x, y: Math.max(1.1, c.y - .3), z: c.z }; } else m.state.target = null;
    m.animate(mv.phase, mv.walk, clock.sim, simDt);
    watchModel();
    if (snd) { snd.setQuiet(mode === 'film' && !!chapNow && !!chapNow.quiet); if (!(mode === 'film' && clock.paused)) snd.tick(realDt); }
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

  // ---------- where it stands: still, or creeping across the meadow ----------
  // film.route, if the film has one: [[film seconds, x, z, heading], ...], easing from each key to the next. In Explore it
  // can wander: turn toward somewhere new inside its ring, creep there, stop and taste the air. Its legs step as far as it
  // goes (the model's own creep, as the battle drives it: 4.2 of phase a metre) and its warm ring follows it, slowly.
  const mv = { x: 0, z: 0, yaw: 0, phase: 0, walk: 0, wander: false, goal: null, wait: 1.5, warm: V3() };
  const angD = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));
  function routeAt(t) {
    const R = film.route; if (!R || !R.length) return [0, 0, 0];
    if (t <= R[0][0]) return R[0].slice(1);
    for (let i = 0; i < R.length - 1; i++) { const a = R[i], b = R[i + 1]; if (t < b[0]) { const u = EASE.io((t - a[0]) / (b[0] - a[0])); return [lerp(a[1], b[1], u), lerp(a[2], b[2], u), a[3] + angD(a[3], b[3]) * u]; } }
    return R[R.length - 1].slice(1);
  }
  function wanderStep(dt) {
    if (E.model.action || dt <= 0) return;
    if (!mv.goal) { mv.wait -= dt; if (mv.wait > 0) return; const a = Math.random() * Math.PI * 2, r = 2 + Math.random() * 6; mv.goal = [Math.sin(a) * r, Math.cos(a) * r]; }
    const dx = mv.goal[0] - mv.x, dz = mv.goal[1] - mv.z, d = Math.hypot(dx, dz), turn = angD(mv.yaw, Math.atan2(dx, dz));
    if (d > .3 && Math.abs(turn) > .3) mv.yaw += Math.sign(turn) * Math.min(Math.abs(turn), .4 * dt);
    else { if (d > .3) mv.yaw += turn * Math.min(1, dt * .8); const st = Math.min(d, (.8 * sm(0, 1.5, d) + .06) * dt); mv.x += Math.sin(mv.yaw) * st; mv.z += Math.cos(mv.yaw) * st; }
    if (d < .12) { mv.goal = null; mv.wait = 3 + Math.random() * 5; E.model.taste(); bsfx('creak', .4); bsfx('rustle', .3); }
  }
  function moveStep(rdt, sdt) {
    const m = E.model, px = mv.x, pz = mv.z, pyaw = mv.yaw;
    if (mode === 'film') { const r = routeAt(ft); mv.x = r[0]; mv.z = r[1]; mv.yaw = r[2]; }
    else if (mode === 'explore' && mv.wander) wanderStep(sdt);
    const d = Math.hypot(mv.x - px, mv.z - pz), dy = Math.abs(angD(pyaw, mv.yaw)), jump = d > 3 || dy > 1, go = jump ? 0 : d + dy * 2.4, dt = mode === 'film' ? rdt : sdt;
    if (!jump) { const p0 = mv.phase; mv.phase += go * 4.2; stepSounds(p0, mv.phase); }
    if (dt > 0) mv.walk = go / dt > .05 ? 1 : 0;
    m.root.position.set(mv.x, E.world.heightAt(mv.x, mv.z), mv.z); m.root.rotation.y = mv.yaw;
    if (jump) mv.warm.copy(m.root.position); else mv.warm.lerp(m.root.position, 1 - Math.exp(-rdt / 4));
    E.world.setWarm(mv.warm);
    if (mode === 'explore' && !jump) { orbit.gt.x += mv.x - px; orbit.gt.z += mv.z - pz; orbit.target.x += mv.x - px; orbit.target.z += mv.z - pz; }
  }
  // its legs step in two sets: as a set comes down its tips go into the frost, as it lifts they tear their roots free
  function stepSounds(p0, p1) {
    if (E.model.action || mv.walk < .5) return;
    for (const g of [0, Math.PI]) { const a = Math.sin(p0 + g), b = Math.sin(p1 + g); if (a > 0 && b <= 0) bsfx('step', .8); else if (a <= 0 && b > 0) bsfx('pull', .55); }
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
  // the sounds of each move, at points through it (sounds.js: wood, leaves, soil, roots and air, nothing that roars)
  const SOUNDS = {
    appear: [[0, 'shoots', .8], [.12, 'groan', 1], [.42, 'step', 1], [.45, 'step', .8], [.58, 'groan', .7], [.62, 'rustle', 1], [.66, 'breath', .8]],
    alert: [[.04, 'creak', .8], [.12, 'rustle', .8]],
    bloom: [[.08, 'bloom', 1], [.4, 'breath', .5]],
    lance: [[.04, 'creak', .7], [.3, 'swish', .9], [.44, 'impact', 1], [.66, 'pull', .8]],
    slam: [[.06, 'groan', .55], [.3, 'creak', .7], [.42, 'swish', 1], [.5, 'heavy', 1], [.6, 'impact', .45], [.72, 'pull', .7]],
    whirl: [[.1, 'creak', .7], [.3, 'swish', .8], [.3, 'rustle', .8], [.42, 'swish', .9], [.54, 'swish', .9], [.66, 'swish', .8], [.78, 'rustle', .6]],
    volley: [[.2, 'creak', .7], [.36, 'swish', .9], [.48, 'swish', .9], [.56, 'thorns', 1]],
    devour: [[.14, 'swish', .8], [.2, 'creak', .8], [.42, 'creak', .7], [.5, 'gulp', 1], [.66, 'gulp', .8], [.76, 'gulp', .7], [.88, 'breath', .7]],
    briar: [[.2, 'creak', .7], [.3, 'impact', .8], [.44, 'shoots', 1], [.66, 'creak', .7]],
    enrage: [[.05, 'groan', 1], [.4, 'rustle', 1], [.42, 'breath', 1]],
    hurt: [[0, 'creak', .8], [.05, 'rustle', .7]], block: [[0, 'rustle', .6], [.1, 'creak', .5]],
    burn: [[0, 'sizzle', 1], [.05, 'creak', .8], [.1, 'rustle', .7]],
    rest: [[0, 'creak', .5], [.25, 'rustle', .5], [.5, 'breath', .45]],
    die: [[.09, 'crash', 1]]
  };
  // what a hit does to the meadow: how hard, and where (its impact point, a ring round it, or nothing)
  const HITS = { lance: [1, 'impact'], slam: [1.7, 'impact'], whirl: [.5, 'ring'], volley: [.6, 'impact'], devour: [.3, 'held'], briar: [1.1, 'impact'] };
  const _v = V3(), _v2 = V3();
  function watchModel() {
    const m = E.model, a = m.action, p = m.progress;
    if (a && (a !== lastAct || p < lastProg)) { lastProg = -1e-6; } // a move has started
    if (a) {
      for (const [u, name, g] of SOUNDS[a] || []) if (lastProg < u && p >= u) bsfx(name, g, name === 'heavy' || name === 'impact' ? m.anchor('impact', _v2) : null);
      const def = m.ACTIONS[a], H = HITS[a];
      for (const h of def.hits) if (lastProg < h && p >= h) {
        const k = H ? H[0] : .6;
        if (!H || H[1] === 'impact') { m.anchor('impact', _v); E.world.impact(_v.x, _v.z, k); }
        else if (H[1] === 'ring') E.world.impact(m.root.position.x, m.root.position.z, k);
        const d = E.camera.position.distanceTo(_v.set(0, 2, 6)); shake.k = Math.max(shake.k, k * cl(16 / d, .3, 1.2)); shake.t = 0;
        if (a === 'lance' || a === 'slam') clock.hitstop = .08;
      }
      for (const c of def.cues || []) if (lastProg < c && p >= c) {
        if (a === 'appear' || a === 'enrage' || a === 'die') { E.world.impact(m.root.position.x, m.root.position.z, a === 'die' ? 1.4 : 1.2); shake.k = Math.max(shake.k, .8); shake.t = 0; }
      }
    }
    lastAct = a; lastProg = a ? p : -1;
    // its heartbeat, heard only close to
    if (m.beats !== lastBeat) { lastBeat = m.beats; const d = E.camera.position.distanceTo(m.anchor('heart', _v)), g = cl(1.15 - d / 14, 0, .9); if (g > .05) bsfx('heart', g, _v); }
  }

  // ---------- sound: the Bramble's own and the night's (sounds.js) ----------
  let snd = null, soundOn = true;
  const SKEY = 'fs-sound-1';
  function startSound() {
    if (snd || (TEST && !Qs.has('sound')) || typeof makeFieldSounds !== 'function') return;
    try {
      snd = makeFieldSounds(); try { snd.load(JSON.parse(store.get(SKEY) || 'null')); } catch (e) { /* nothing saved */ }
      snd.init(); snd.setMuted(!soundOn); snd.setWind(+$('sWind').value);
    } catch (e) { snd = null; }
  }
  function saveSound() { if (snd) store.set(SKEY, JSON.stringify(snd.settings())); }
  function setSound(on) { soundOn = on; $('soundBtn').setAttribute('aria-pressed', String(on)); $('soundBtn').textContent = on ? 'Sound on' : 'Sound off'; if (snd) snd.setMuted(!on); }
  // one of the Bramble's sounds, placed for the ears: left or right in the picture, and nearer or further
  const _s = V3();
  function bsfx(name, g, at) {
    if (!snd || !soundOn) return;
    if (at) _s.copy(at); else _s.copy(E.model.root.position).setY(E.model.root.position.y + 2.5);
    _s.applyMatrix4(E.camera.matrixWorldInverse); const d = _s.length();
    snd.bramble(name, { gain: (g === undefined ? 1 : g) * cl(16 / Math.max(d, 1), .45, 1.15), pan: cl(_s.x / Math.max(d, 4) * 1.5, -.85, .85), far: cl((d - 10) / 60, 0, 1) });
  }

  // ---------- the sound check: every sound, to play, switch off and set how loud ----------
  let checkOpen = false, checkWasPaused = false;
  function openCheck() {
    if (!soundOn) setSound(true);
    startSound(); checkOpen = true; $('check').hidden = false; checkWasPaused = clock.paused;
    if (mode === 'film') { clock.paused = true; setPlayIcon(); }
    if (snd) snd.setHold(true);
    fillCheck(); $('checkClose').focus();
  }
  function closeCheck() {
    if (!checkOpen) return; checkOpen = false; $('check').hidden = true; if (snd) snd.setHold(false);
    if (mode === 'film' && !checkWasPaused) { clock.paused = false; setPlayIcon(); }
    saveSound();
  }
  function fillCheck() {
    const st = $('checkState');
    if (!snd) { st.textContent = 'This browser cannot make sound here.'; return; }
    if (!$('checkBramble').children.length) {
      for (const l of snd.list) (l.fam === 'bramble' ? $('checkBramble') : $('checkNight')).appendChild(checkRow(l));
      $('gBramble').addEventListener('input', (e) => snd.setGroup('bramble', +e.target.value));
      $('gNight').addEventListener('input', (e) => snd.setGroup('night', +e.target.value));
    }
    syncCheck();
    st.textContent = snd.ready ? '' : 'Making the sounds\u2026';
    if (!snd.ready) setTimeout(() => { if (checkOpen) fillCheck(); }, 300);
  }
  function checkRow(l) {
    const row = document.createElement('div'); row.className = 'ck'; row.dataset.id = l.id;
    row.innerHTML = (l.bed ? '<span class="play always" title="Always there">~</span>' : '<button type="button" class="play" aria-label="Play: ' + l.name + '">&#9654;</button>') +
      '<div class="ckt"><b>' + l.name + '</b><small>' + l.desc + '</small></div>' +
      '<label class="ckon"><input type="checkbox"> On</label><input class="lv" type="range" min="0" max="1.5" step="0.01" aria-label="How loud: ' + l.name + '">';
    const pb = row.querySelector('button.play');
    if (pb) pb.addEventListener('click', () => { if (!snd || !snd.ready) return; if (l.fam === 'bramble') snd.bramble(l.id, { far: .05, force: true }); else snd.night(l.id, { pan: 0, far: .45 }); });
    row.querySelector('.ckon input').addEventListener('change', (e) => { snd.setOn(l.id, e.target.checked); row.classList.toggle('off', !e.target.checked); });
    row.querySelector('.lv').addEventListener('input', (e) => snd.setLevel(l.id, +e.target.value));
    return row;
  }
  function syncCheck() {
    $('gBramble').value = snd.group('bramble'); $('gNight').value = snd.group('night');
    document.querySelectorAll('#check .ck').forEach((row) => { const id = row.dataset.id, on = snd.on(id); row.querySelector('.ckon input').checked = on; row.classList.toggle('off', !on); row.querySelector('.lv').value = snd.level(id); });
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
    for (const [t, name] of s.act || []) if (pst < t && st >= t && prev >= firedTo - 1e-6) { if (name === 'taste') { E.model.taste(); bsfx('creak', .45); bsfx('rustle', .35); } else E.model.play(name, true); }
    for (const [t, id, o] of s.night || []) if (pst < t && st >= t && snd) { if (id === 'hush') snd.hush(o); else snd.night(id, o); }
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
  // a point in a shot: [x, y, z] in the meadow, or in its own frame when the camera rides with it (rel), or an anchor's name
  const _Y = V3(0, 1, 0);
  function resolve(x, out, rel) {
    if (Array.isArray(x)) { out.fromArray(x); if (rel) out.applyAxisAngle(_Y, mv.yaw).add(E.model.root.position); return out; }
    if (typeof x === 'string') return E.model.anchor(x, out); return out.set(0, 3, 0);
  }
  function filmCamera(s, st) {
    const c = s.cam, u = cl(st / s.d, 0, 1), e = (EASE[c.ease] || EASE.io)(u), cam = E.camera, rel = !!c.rel;
    if (c.orbit) { const o = c.orbit, an = lerp(o.a0, o.a1, e) + (rel ? mv.yaw : 0); resolve(o.c, _b, rel); cam.position.set(_b.x + Math.sin(an) * o.r, _b.y + o.h, _b.z + Math.cos(an) * o.r); }
    else { resolve(c.from, cam.position, rel); cam.position.lerp(resolve(c.to, _a, rel), e); resolve(c.at, _b, rel); if (c.at2) _b.lerp(resolve(c.at2, _c, rel), e); }
    // a handheld drift, and a walk's sway when the camera is the prey stepping closer
    const hk = c.shake || 0, t = clock.real;
    if (c.walk) { cam.position.y += Math.abs(Math.sin(t * 3.6)) * .05 - .025; cam.position.x += Math.sin(t * 1.8) * .04; }
    cam.lookAt(_b);
    if (hk > 0) { _e.set((Math.sin(t * .9) * .6 + Math.sin(t * 2.3 + 1) * .3 + Math.sin(t * 5.1) * .1) * hk * .012, (Math.sin(t * .7 + 2) * .6 + Math.sin(t * 1.9) * .4) * hk * .014, Math.sin(t * .5 + 3) * hk * .006); _q.setFromEuler(_e); cam.quaternion.multiply(_q); }
    if (cam.view && cam.view.enabled) cam.clearViewOffset();
    cam.fov = c.fov ? lerp(c.fov[0], c.fov[1], e) : 36; cam.updateProjectionMatrix();
    focusTo(s.focus, cam, 0, rel);
  }
  let focusD = 12;
  function focusTo(f, cam, rate, rel) {
    let d;
    if (typeof f === 'number') d = f; else d = cam.position.distanceTo(resolve(f || [0, 3, 0], _d, rel));
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
      if (w) { $('capWords').textContent = w[2]; cap.classList.add('on'); } else cap.classList.remove('on');
    }
    const kick = !film.wordless && f.c.id !== 'title' && st < 6 && f.si === 0; $('caption').classList.toggle('kick', kick || !!w);
    $('capKick').textContent = f.c.id === 'title' || film.wordless ? '' : f.c.kicker + ' · ' + f.c.title;
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
  function frontView() { const th = mv.yaw - 1.2; orbit.gt.set(mv.x, 3.6, mv.z); orbit.gd = 21; orbit.gth = th + Math.round((orbit.gth - th) / (Math.PI * 2)) * Math.PI * 2; orbit.gph = 1.32; }
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
        if (id === 'taste') { if (m.action === 'rest' || !m.action) { m.taste(); bsfx('creak', .45); bsfx('rustle', .35); } return; }
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
  function labelPos(id, out) { if (id === 'roots') return E.model.root.localToWorld(out.set(9, .2, 7)); return E.model.anchor(id, out); }
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
    $('checkBtn').addEventListener('click', openCheck); $('goCheck').addEventListener('click', openCheck);
    $('checkClose').addEventListener('click', closeCheck);
    $('checkReset').addEventListener('click', () => { if (snd) { snd.reset(); syncCheck(); } });
    $('tWander').addEventListener('change', (e) => { mv.wander = e.target.checked; mv.goal = null; mv.wait = .5; if (mv.wander && E.model.action === 'rest') E.model.play('alert', true); });
    $('fullBtn').addEventListener('click', () => { const d = document; try { if (d.fullscreenElement) d.exitFullscreen(); else d.documentElement.requestFullscreen().catch(() => {}); } catch (e) { /* not here */ } });
    $('tXray').addEventListener('change', (e) => { E.model.state.xray = e.target.checked ? 1 : 0; });
    $('tOpen').addEventListener('change', (e) => { E.model.state.open = e.target.checked ? 1 : 0; });
    $('tWrath').addEventListener('change', (e) => { E.model.state.wrath = e.target.checked ? 1 : 0; });
    $('tScale').addEventListener('change', (e) => { E.scaleFig.visible = e.target.checked; if (e.target.checked) { orbit.gt.set(2.2, 2.2, 6.8); orbit.gd = 16; } });
    $('tAuto').addEventListener('change', (e) => { orbit.auto = e.target.checked; });
    $('tStats').addEventListener('change', (e) => { $('stats').hidden = !e.target.checked; });
    $('sFrost').addEventListener('input', (e) => { const v = +e.target.value; E.world.set({ frost: v }); E.model.state.frost = .55 * v; });
    $('sWind').addEventListener('input', (e) => { const v = +e.target.value; E.world.set({ wind: { x: v, z: v * .33 } }); E.model.state.wind = { x: v * .6, z: v * .2 }; if (snd) snd.setWind(v); });
    $('sMist').addEventListener('input', (e) => { E.world.set({ mist: +e.target.value }); });
    document.querySelectorAll('.seg button').forEach((b) => b.addEventListener('click', () => { clock.userSlow = +b.dataset.slow; document.querySelectorAll('.seg button').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); }));
    $('resetView').addEventListener('click', frontView);
    $('preyBtn').addEventListener('click', () => { prey = prey === 'camera' ? 'mark' : 'camera'; $('preyBtn').textContent = prey === 'camera' ? 'Its prey: you' : 'Its prey: in front'; });
    $('quality').value = QUALITY;
    $('quality').addEventListener('change', (e) => { store.set('fs-quality', e.target.value); const u = new URL(location.href); u.searchParams.set('q', e.target.value); location.href = u.toString(); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && checkOpen) { closeCheck(); return; }
      if (e.target && /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
      if (checkOpen) return;
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
  function togglePause() { if (checkOpen) return; clock.paused = !clock.paused; setPlayIcon(); }

  function ready() {
    $('loadBar').style.width = '100%';
    $('load').hidden = true; $('start').hidden = false; mode = 'start';
    buildChapters(); buildMoves(); buildLabels(); bindUI(); bindOrbit();
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
    get snd() { return snd; }, startSound() { startSound(); return !!snd; }, openCheck, closeCheck, mv,
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
