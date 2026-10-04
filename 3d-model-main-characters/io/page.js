// page.js: Io's study page. It builds her garden (garden.js), Io (io.js) and the film camera (cinema.js), then either
// plays the tour (a minute and a half of close looks at each part of her, with words) or lets the viewer explore: orbit
// (mouse or touch), labels on her parts, close-ups, every move, her walk, her trance, the light, slow motion, the game's
// Io beside her for comparison, and the numbers behind the picture. Built for a laptop; on a phone it starts at the
// lighter Medium detail. ?q=medium|high|max sets the detail; ?test drives frames from window.__io instead of the clock.
(function () {
 'use strict';
 const $ = (id) => document.getElementById(id);
 const Qs = new URLSearchParams(location.search), TEST = Qs.has('test');
 const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private window */ } } };
 const PHONE = (window.matchMedia && matchMedia('(pointer: coarse)').matches) || Math.min(innerWidth, innerHeight) < 560;
 const QOK = ['medium', 'high', 'max'];
 const QUALITY = QOK.includes(Qs.get('q')) ? Qs.get('q') : QOK.includes(store.get('io-quality')) ? store.get('io-quality') : PHONE ? 'medium' : 'high';
 const QP = { medium: { detail: .5, px: 1.25, scale: .8, msaa: 2, garden: 'medium' }, high: { detail: 1, px: 1.5, scale: 1, msaa: 4, garden: 'high' }, max: { detail: 1, px: 2, scale: 1, msaa: 4, garden: 'max' } }[QUALITY];
 const V3 = (x, y, z) => new THREE.Vector3(x || 0, y || 0, z || 0);
 const cl = (v, a, b) => (v < a ? a : v > b ? b : v), lerp = (a, b, t) => a + (b - a) * t;
 const sm = (a, b, x) => { const t = cl((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
 const ease = (x) => x * x * (3 - 2 * x);
 let E = null; // the engine, once built

 // ---------- building it, in steps, so the loading line can move ----------
 const steps = [
  ['Lighting the lanterns', () => {
   const canvas = $('gl');
   const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', stencil: false });
   renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, QP.px));
   renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.info.autoReset = false;
   E = { renderer, canvas, ms: {} };
  }],
  ['Planting the garden', () => { const t = performance.now(); E.world = makeGarden(E.renderer, { quality: QP.garden }); E.ms.world = performance.now() - t; }],
  ['Dressing Io', () => {
   const t = performance.now(); E.io = makeIo({ detail: QP.detail, shadows: true }); E.ms.model = performance.now() - t;
   E.world.scene.add(E.io.root, E.io.fx);
  }],
  ['Setting up the camera', () => {
   E.camera = new THREE.PerspectiveCamera(32, 1, .05, 3000);
   E.cine = makeCinema(E.renderer, { scale: QP.scale, msaa: QP.msaa }); E.cine.sun(E.world.moonDir);
   E.cine.set({ exposure: 1.45, bloom: .45, rays: .22, grain: .025, vignette: .3, split: .08, saturation: 1, focus: 3, aperture: .8, maxBlur: 12 });
   resize(); window.addEventListener('resize', resize);
   E.camera.position.set(1.6, 1.7, 6.5); E.camera.lookAt(0, 1.1, 0);
  }],
  ['Waking her', () => { const t = performance.now(); E.renderer.compile(E.world.scene, E.camera); for (let i = 0; i < 40; i++) simulate(1 / 60); frame(1 / 60, true); E.ms.compile = performance.now() - t; }]
 ];
 function boot(i) {
  if (i >= steps.length) return ready();
  $('loadStep').textContent = steps[i][0];
  $('loadBar').style.width = Math.round(i / steps.length * 100) + '%';
  $('loadBar').parentNode.setAttribute('aria-valuenow', Math.round(i / steps.length * 100));
  setTimeout(() => {
   try { steps[i][1](); boot(i + 1); } catch (e) {
    console.error(e); $('loadStep').textContent = 'She could not appear here: ' + (e && e.message ? e.message : e) + '. The page needs a browser with WebGL 2, such as a current Chrome, Edge, Firefox or Safari.';
    window.__err = String(e && e.stack || e);
   }
  }, TEST ? 0 : 60);
 }
 function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  E.renderer.setSize(w, h, false); E.camera.aspect = w / h; E.camera.updateProjectionMatrix();
 }

 // ---------- her life on the page: idle, her walk along the path, her moves ----------
 const clock = { t: 0, slow: 1, paused: false };
 const io = { x: 0, z: 0, yaw: 0, phase: 0, walk: 0, walking: false, dir: 1, turn: 0, trance: 0, tranceTo: 0 };
 const HOME = { x: 0, z: 0 }, PATH = [-4.6, 3.6];
 function walkStep(dt) {
  const want = io.walking ? 1 : 0;
  if (io.walking) {
   // along the path toward the gate and back, turning round at each end
   const end = io.dir > 0 ? PATH[1] : PATH[0];
   if (io.turn > 0) { io.turn = Math.max(0, io.turn - dt); const target = io.dir > 0 ? 0 : Math.PI; io.yaw += Math.atan2(Math.sin(target - io.yaw), Math.cos(target - io.yaw)) * Math.min(1, dt * 3.2); }
   else if ((io.dir > 0 && io.z > end) || (io.dir < 0 && io.z < end)) { io.dir = -io.dir; io.turn = 1.1; }
  } else if (Math.abs(io.yaw) > 1e-3 && io.walk < .05) { io.yaw += Math.atan2(Math.sin(-io.yaw), Math.cos(-io.yaw)) * Math.min(1, dt * 2.5); }
  io.walk += (want * (io.turn > 0 ? .35 : 1) - io.walk) * Math.min(1, dt * 3);
  const sp = 1.1 * io.walk;
  io.x += Math.sin(io.yaw) * sp * dt; io.z += Math.cos(io.yaw) * sp * dt; io.phase += sp * dt * 4.4;
  E.io.root.position.set(io.x, E.world.heightAt(io.x, io.z), io.z); E.io.root.rotation.y = io.yaw;
 }
 function simulate(dt) {
  clock.t += dt;
  walkStep(dt);
  io.trance += (io.tranceTo - io.trance) * Math.min(1, dt * 2.2); E.io.trance = io.trance;
  E.io.animate(io.phase, io.walk, clock.t, dt);
  if (E.old && E.old.root.parent) { E.old.root.position.set(io.x - Math.cos(io.yaw) * 1.05, 0, io.z + Math.sin(io.yaw) * 1.05); E.old.root.rotation.y = io.yaw; E.old.trance = io.trance; E.old.animate(io.phase, io.walk, clock.t, dt); }
  E.world.update(clock.t, dt);
 }

 // ---------- the game's Io, beside her, for comparison ----------
 function makeOld() {
  const m = makeWitch({});
  // the game's model is painted for a plain renderer: its colours turned linear so it sits in this light as it does in the game's
  const seen = new Set();
  m.root.traverse((o) => {
   if (!o.isMesh) return;
   for (const mt of Array.isArray(o.material) ? o.material : [o.material]) {
    if (seen.has(mt)) continue; seen.add(mt);
    if (mt.color) mt.color.convertSRGBToLinear(); if (mt.emissive) mt.emissive.convertSRGBToLinear();
    for (const k of ['map', 'emissiveMap']) if (mt[k]) { mt[k].encoding = THREE.sRGBEncoding; mt[k].needsUpdate = true; }
    mt.needsUpdate = true; o.castShadow = true; o.receiveShadow = true;
   }
  });
  return m;
 }
 function setOld(on) {
  if (on && !E.old) E.old = makeOld();
  if (!E.old) return;
  if (on) { E.world.scene.add(E.old.root, E.old.fx); E.old.root.position.set(io.x - 1.05, 0, io.z); E.old.root.rotation.y = io.yaw; orbit.follow = null; orbit.gt.x = io.x - .52; orbit.gd = Math.max(orbit.gd, 3.8); }
  else { E.world.scene.remove(E.old.root, E.old.fx); orbit.gt.x = 0; }
 }

 // ---------- her moves ----------
 const MOVES = [['combo', 'Attack', 'three dagger strikes'], ['lunge', 'Lunge', 'one deep thrust'], ['throw', 'Flame Bolt', 'witchfire from her palm'], ['crescent', 'Crescent Blades', 'blades of moonlight'],
  ['briar', 'Nightbloom Briars', 'she calls them up'], ['mend', 'Lunar Mend', 'she heals'], ['moon', 'Moonlight', 'the moon’s beam'], ['summon', 'Summon', 'a summon from the well'],
  ['cast', 'Cast', 'Moonsteel, Harvest Moon'], ['transform', 'Lunar Trance', 'starlight and wings'], ['hurt', 'Hurt', 'a blow lands'], ['block', 'Block', 'she braces'],
  ['kneel', 'Kneel', 'knocked down'], ['rise', 'Rise', 'up again'], ['victory', 'Victory', 'after a win']];
 const timers = [];
 function later(sec, fn) { timers.push({ at: clock.t + sec, fn }); }
 function runTimers() { for (let i = timers.length - 1; i >= 0; i--) if (clock.t >= timers[i].at) { const f = timers[i].fn; timers.splice(i, 1); f(); } }
 function playMove(id) {
  const ms = [E.io]; if (E.old && E.old.root.parent) ms.push(E.old);
  if (id === 'transform') {
   if (io.tranceTo > .5) { setTrance(false); return; }
   for (const m of ms) m.play('transform', true);
   later(E.io.ACTIONS.transform.dur * .55, () => setTrance(true));
   return;
  }
  if (id === 'rise') { for (const m of ms) m.play('rise'); return; }
  for (const m of ms) m.play(id, true);
 }
 function setTrance(on) { io.tranceTo = on ? 1 : 0; $('tTrance').checked = on; }
 function buildMoves() {
  const box = $('moves');
  for (const [id, name, note] of MOVES) {
   const b = document.createElement('button'); b.type = 'button'; b.innerHTML = name + '<small>' + note + '</small>';
   b.addEventListener('click', () => playMove(id)); box.appendChild(b);
  }
 }

 // ---------- Explore: orbit, labels, close-ups ----------
 const orbit = { target: V3(0, 1.05, 0), gt: V3(0, 1.05, 0), dist: 3.4, gd: 3.4, theta: .35, gth: .35, phi: 1.5, gph: 1.5, auto: false, follow: null };
 let mode = 'start', drag = null;
 const _a = V3();
 function orbitStep(dt) {
  if (orbit.auto && !drag) orbit.gth += dt * .12;
  // a close-up follows the part it looks at as she moves
  if (orbit.follow) { E.io.anchor(orbit.follow, _a); orbit.gt.lerp(_a, Math.min(1, dt * 6)); }
  else if (io.walk > .02 || Math.hypot(io.x, io.z) > .01) { orbit.gt.x = lerp(orbit.gt.x, io.x - (E.old && E.old.root.parent ? .52 : 0), Math.min(1, dt * 3)); orbit.gt.z = lerp(orbit.gt.z, io.z, Math.min(1, dt * 3)); }
  const k = 1 - Math.exp(-dt * 7);
  orbit.theta += (orbit.gth - orbit.theta) * k; orbit.phi += (orbit.gph - orbit.phi) * k; orbit.dist += (orbit.gd - orbit.dist) * k; orbit.target.lerp(orbit.gt, k);
  placeCam(orbit.target, orbit.dist, orbit.theta, orbit.phi, 32);
  const dw = $('explore').hidden ? 0 : $('explore').offsetWidth, sw = window.innerWidth, sh = window.innerHeight, c = E.camera;
  if (dw > 0 && sw > 720) c.setViewOffset(sw, sh, dw / 2, 0, sw, sh);
  else if (dw > 0 && sw <= 720) c.setViewOffset(sw, sh, 0, $('explore').offsetHeight / 2.4, sw, sh);
  else if (c.view && c.view.enabled) c.clearViewOffset();
  E.cine.params.aperture = +$('sAp').value; E.cine.params.focus = orbit.dist;
 }
 function placeCam(tg, dist, th, ph, fov) {
  const c = E.camera, sp = Math.sin(ph);
  c.position.set(tg.x + Math.sin(th) * sp * dist, tg.y + Math.cos(ph) * dist, tg.z + Math.cos(th) * sp * dist);
  const gy = E.world.heightAt(c.position.x, c.position.z) + .06; if (c.position.y < gy) c.position.y = gy;
  c.lookAt(tg); if (c.fov !== fov) { c.fov = fov; c.updateProjectionMatrix(); }
 }
 const pts = new Map();
 function bindOrbit() {
  const cv = E.canvas, st = $('stage');
  st.classList.add('grab');
  cv.addEventListener('pointerdown', (e) => {
   if (mode !== 'explore') return;
   pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); cv.setPointerCapture(e.pointerId);
   drag = { pan: e.button === 2 || e.shiftKey }; st.classList.add('grabbing');
  });
  cv.addEventListener('pointermove', (e) => {
   const p = pts.get(e.pointerId); if (!p || !drag) return;
   const dx = e.clientX - p.x, dy = e.clientY - p.y;
   if (pts.size >= 2) {
    // two fingers: pinch to come closer, move together to slide
    const [a, b] = [...pts.values()], d0 = Math.hypot(a.x - b.x, a.y - b.y);
    p.x = e.clientX; p.y = e.clientY;
    const [a2, b2] = [...pts.values()], d1 = Math.hypot(a2.x - b2.x, a2.y - b2.y);
    if (d0 > 0 && d1 > 0) orbit.gd = cl(orbit.gd * d0 / d1, .22, 14);
    pan(dx * .5, dy * .5);
    return;
   }
   p.x = e.clientX; p.y = e.clientY;
   if (drag.pan) pan(dx, dy);
   else { orbit.gth -= dx * .006; orbit.gph = cl(orbit.gph - dy * .005, .25, 2.2); }
  });
  const up = (e) => { pts.delete(e.pointerId); if (!pts.size) { drag = null; st.classList.remove('grabbing'); } };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  cv.addEventListener('contextmenu', (e) => { if (mode === 'explore') e.preventDefault(); });
  cv.addEventListener('wheel', (e) => { if (mode !== 'explore') return; e.preventDefault(); orbit.gd = cl(orbit.gd * Math.exp(e.deltaY * .0012), .22, 14); }, { passive: false });
  cv.addEventListener('dblclick', () => { if (mode === 'explore') frontView(); });
 }
 function pan(dx, dy) {
  orbit.follow = null;
  const c = E.camera, r = V3().setFromMatrixColumn(c.matrix, 0), u = V3().setFromMatrixColumn(c.matrix, 1), k = orbit.dist * .0016;
  orbit.gt.addScaledVector(r, -dx * k).addScaledVector(u, dy * k); orbit.gt.y = cl(orbit.gt.y, .05, 2.6);
 }
 function frontView() { orbit.follow = null; orbit.gt.set(io.x - (E.old && E.old.root.parent ? .52 : 0), 1.05, io.z); orbit.gd = E.old && E.old.root.parent ? 3.9 : 3.4; orbit.gth = io.yaw + .35 + Math.round((orbit.gth - io.yaw - .35) / (Math.PI * 2)) * Math.PI * 2; orbit.gph = 1.5; }
 const CLOSE = [['head', 'Face', .62, .18, 1.52], ['eye', 'Eyes', .3, .1, 1.54], ['charm', 'Hat', .85, .45, 1.68], ['ponytail', 'Hair', .95, 2.6, 1.45], ['handR', 'Dagger', .5, -.55, 1.45], ['flame', 'Flame', .62, .75, 1.5], ['coat', 'Coat', 1.3, -.7, 1.5], ['boot', 'Boots', .85, .35, 1.6]];
 function buildClose() {
  const box = $('closeups');
  for (const [a, name, d, th, ph] of CLOSE) {
   const b = document.createElement('button'); b.type = 'button'; b.textContent = name;
   b.addEventListener('click', () => { orbit.follow = a; E.io.anchor(a, orbit.gt); orbit.gd = d; orbit.gth = io.yaw + th; orbit.gph = ph; $('tAuto').checked = orbit.auto = false; });
   box.appendChild(b);
  }
  const w = document.createElement('button'); w.type = 'button'; w.textContent = 'All of her'; w.addEventListener('click', frontView); box.appendChild(w);
 }
 // labels on her parts: what is new about each
 const LABELS = [
  ['charm', 'Hat', 'Velvet over a wired brim, with embroidered stars, a fuzzy band and the gold charm.'],
  ['horn', 'Horns', 'Ridged horn, twelve growth rings, polished.'],
  ['glasses', 'Glasses', 'Fine black frames with hinges; the glass reflects the night.'],
  ['eye', 'Eyes', 'A painted iris under a wet cornea; lashes and brows of single hairs.'],
  ['ponytail', 'Hair', 'Every lock where it was, each a bundle of fine strands with its own shine.'],
  ['scrunchie', 'Scrunchie', 'Gathered purple velvet.'],
  ['necklace', 'Necklace', 'A twisted black cord, a gold crescent and cross.'],
  ['coat', 'Coat', 'Velvet with gold-thread stars, a satin lining, braid and gold piping on every edge.'],
  ['sash', 'Sash', 'Grey satin with a gathered knot.'],
  ['dress', 'Dress', 'Black tulle with sequins that catch the light as she moves.'],
  ['dagger', 'Dagger', 'A ridged blade engraved with a crescent and stars; a wrapped grip.'],
  ['flame', 'Witchfire', 'A living flame with a white heart; it turns moon-white for her moon spells.'],
  ['bracelet', 'Bracelets', 'Two of silver, one of black cord.'],
  ['boot', 'Boots', 'Creased leather, stitched straps, real buckles, a crescent anklet.']
 ];
 const labEls = [];
 function buildLabels() {
  const box = $('labels');
  for (const [id, name, note] of LABELS) {
   const el = document.createElement('button'); el.type = 'button'; el.className = 'lab'; el.innerHTML = '<span><b>' + name + '</b> <em>' + note + '</em></span>';
   el.addEventListener('click', () => { const open = el.classList.toggle('open'); if (open) { orbit.follow = id; E.io.anchor(id, orbit.gt); orbit.gd = id === 'coat' || id === 'dress' ? 1.4 : id === 'ponytail' ? 1 : .7; } });
   box.appendChild(el); labEls.push({ id, el });
  }
 }
 const _p = V3();
 function labelsStep() {
  const show = mode === 'explore' && $('tLabels').checked;
  $('labels').hidden = !show; if (!show) return;
  const w = window.innerWidth, h = window.innerHeight, cam = E.camera.position, placed = [];
  for (const L of labEls) {
   E.io.anchor(L.id, _p);
   const far = _p.distanceTo(cam) > (orbit.dist < 1.2 ? 1.6 : 9);
   _p.project(E.camera);
   const x = (_p.x * .5 + .5) * w, y = (-_p.y * .5 + .5) * h;
   // one that would sit on a label already placed waits until the camera comes closer (an open one always shows)
   const crowd = !L.el.classList.contains('open') && placed.some((q) => Math.abs(q[1] - y) < 22 && Math.abs(q[0] - x) < 96);
   const vis = !far && !crowd && _p.z < 1 && Math.abs(_p.x) < 1.02 && Math.abs(_p.y) < 1.02;
   L.el.style.display = vis ? '' : 'none';
   if (vis) { placed.push([x, y]); L.el.style.transform = 'translate(' + (x - 6).toFixed(1) + 'px,' + y.toFixed(1) + 'px) translateY(-50%)'; }
  }
 }

 // ---------- the tour: shots of her parts, each with a few words ----------
 // A shot frames an anchor (it follows her as she moves) from a distance and an angle round her (th: 0 is in front of
 // her, phi: 1.57 is level), easing from its first values to its second; or it gives the camera's own path.
 const TOUR = [
  { name: 'The garden', d: 7.5, cam: (u) => ({ pos: V3(lerp(-.9, -.3, u), lerp(2.7, 1.62, u), lerp(12, 6.4, u)), look: V3(0, lerp(1.5, 1.15, u), lerp(-3, -.5, u)), fov: 34 }), title: true },
  { name: 'Io', d: 8, at: 'chest', dist: [3.3, 2.7], th: [.6, .2], ph: [1.5, 1.53], fov: 30, kick: 'Io, the Witch', words: 'The game’s Io: every bone, every fold and lock of hair, every move, where the game has them. Built again, finer.' },
  { name: 'Face', d: 8, at: 'head', dist: [.8, .58], th: [.38, .1], ph: [1.5, 1.55], fov: 28, kick: 'Her face', words: 'One smooth sculpt, with her nose and cheeks in it. Her blush is in the skin now, and lamplight glows warm through its edges.' },
  { name: 'Eyes', d: 7, at: 'eye', dist: [.34, .26], th: [.16, .02], ph: [1.54, 1.56], fov: 26, kick: 'Her eyes', words: 'A painted amber iris under a clear, wet cornea that catches the lanterns. Lashes and brows of single hairs.' },
  { name: 'Hair', d: 8, at: 'ponytail', dist: [1.05, .82], th: [2.75, 2.25], ph: [1.42, 1.48], fov: 30, moves: [['cast', 1.4]], kick: 'Her hair', words: 'Every lock where it was, each now a bundle of fine strands, darker at the roots, each with its own highlight. It swings as it did.' },
  { name: 'Hat', d: 7.5, at: 'charm', dist: [.95, .72], th: [.65, -.15], ph: [1.78, 1.7], fov: 30, kick: 'Her hat', words: 'Velvet with embroidered stars over a wired brim, a fuzzy band, ridged horns, a silver chain and the gold charm.' },
  { name: 'Coat', d: 8, at: 'coat', dist: [1.55, 1.25], th: [1.15, .75], ph: [1.5, 1.52], fov: 30, moves: [['throw', 2.2]], kick: 'Her coat', words: 'Velvet with stars worked in gold thread, a satin lining, a woven braid, gold piping on every edge. Her witchfire flies.' },
  { name: 'Dagger', d: 7, at: 'handR', dist: [.55, .4], th: [-.75, -.35], ph: [1.42, 1.48], fov: 28, kick: 'Her dagger', words: 'A ridged blade with a fuller, engraved with a crescent and stars; a wrapped grip, gold rings, a fluted pommel.' },
  { name: 'Flame', d: 7, at: 'flame', dist: [.62, .46], th: [.95, .65], ph: [1.5, 1.52], fov: 28, kick: 'Her witchfire', words: 'A living flame that sways and curls as the game’s does, with a white heart, rising sparks and a real light.' },
  { name: 'Boots', d: 7, at: 'boot', dist: [1.0, .78], th: [.5, .2], ph: [1.62, 1.6], fov: 28, kick: 'Dress and boots', words: 'Black tulle with sequins that catch the light as she moves. Creased leather boots, stitched straps, real buckles.' },
  { name: 'Moves', d: 10, at: 'chest', dist: [3.7, 3.2], th: [-.75, -.45], ph: [1.5, 1.52], fov: 30, moves: [['combo', .6], ['moon', 3.6]], kick: 'Her moves', words: 'Every move is the game’s own: the same keys, the same speed, the same hit times. Only how she is drawn has changed.' },
  { name: 'Trance', d: 9, at: 'chest', dist: [3.8, 3.3], th: [-.45, -.15], ph: [1.5, 1.5], fov: 30, moves: [['transform', .5]], trance: [2.0, 8.6], kick: 'Lunar Trance', words: 'Starlight in her coat, ghost moth wings, a crescent behind her.' },
  { name: 'Night', d: 6.5, cam: (u) => ({ pos: V3(lerp(-1.4, -2.6, u), lerp(1.55, 2.7, u), lerp(4.2, 10, u)), look: V3(0, 1.1, lerp(0, -2.5, u)), fov: 34 }), end: true }
 ];
 let tt = 0; const tstarts = []; { let s = 0; for (const sh of TOUR) { tstarts.push(s); s += sh.d; } }
 const TOTAL = TOUR.reduce((s, x) => s + x.d, 0);
 let shotNow = -1;
 const tcam = { pos: V3(), look: V3(), fov: 30, init: false };
 function shotAt(t) { for (let i = TOUR.length - 1; i >= 0; i--) if (t >= tstarts[i]) return i; return 0; }
 function enterShot(i) {
  shotNow = i; const s = TOUR[i];
  E.io.reset(); io.tranceTo = 0; io.trance = 0;
  for (const m of s.moves || []) m.done = false;
  $('caption').classList.remove('on');
  $('capKick').textContent = s.kick || ''; $('capWords').textContent = s.words || '';
  $('titlecard').hidden = !s.title;
  [...$('steps').children].forEach((el, k) => el.classList.toggle('now', k === i));
  tcam.init = tcam.init && !s.title;
 }
 function tourStep(dt) {
  if (!clock.paused) tt += dt;
  if (tt >= TOTAL) { tt = TOTAL; endTour(); return; }
  const i = shotAt(tt); if (i !== shotNow) enterShot(i);
  const s = TOUR[i], lt = tt - tstarts[i], u = ease(cl(lt / s.d, 0, 1));
  for (const m of s.moves || []) if (!m.done && lt >= m[1]) { m.done = true; if (m[0] === 'transform') E.io.play('transform', true); else E.io.play(m[0], true); }
  if (s.trance) io.tranceTo = lt >= s.trance[0] && lt < s.trance[1] ? 1 : 0;
  $('caption').classList.toggle('on', !!s.words && lt > .6 && lt < s.d - .7);
  let pos, look, fov;
  if (s.cam) { const c = s.cam(u); pos = c.pos; look = c.look; fov = c.fov; }
  else {
   E.io.anchor(s.at, _a); look = _a.clone();
   const d = lerp(s.dist[0], s.dist[1], u), th = lerp(s.th[0], s.th[1], u) + io.yaw, ph = lerp(s.ph[0], s.ph[1], u), sp = Math.sin(ph);
   pos = V3(look.x + Math.sin(th) * sp * d, look.y + Math.cos(ph) * d, look.z + Math.cos(th) * sp * d); fov = s.fov;
  }
  // the camera eases toward each shot's own path, so cuts are quick glides and a moving part stays steady in frame
  const k = tcam.init ? 1 - Math.exp(-dt * (lt < .9 ? 4.5 : 9)) : 1;
  tcam.pos.lerp(pos, k); tcam.look.lerp(look, k); tcam.fov = lerp(tcam.fov, fov, k); tcam.init = true;
  const c = E.camera; c.position.copy(tcam.pos); const gy = E.world.heightAt(c.position.x, c.position.z) + .06; if (c.position.y < gy) c.position.y = gy;
  c.lookAt(tcam.look); if (Math.abs(c.fov - tcam.fov) > 1e-3) { c.fov = tcam.fov; c.updateProjectionMatrix(); }
  if (c.view && c.view.enabled) c.clearViewOffset();
  E.cine.params.focus = c.position.distanceTo(tcam.look); E.cine.params.aperture = s.cam ? .5 : s.at === 'flame' || s.at === 'eye' ? .6 : 1.1;
  [...$('steps').children].forEach((el, k2) => { el.querySelector('i').style.width = (cl((tt - tstarts[k2]) / TOUR[k2].d, 0, 1) * 100) + '%'; });
 }
 function buildSteps() {
  const box = $('steps');
  TOUR.forEach((s, i) => {
   const b = document.createElement('button'); b.type = 'button'; b.className = 'stp'; b.setAttribute('role', 'listitem'); b.setAttribute('aria-label', s.name);
   b.innerHTML = '<span>' + s.name + '</span><b><i></i></b>'; b.addEventListener('click', () => { tt = tstarts[i] + .01; shotNow = -1; clock.paused = false; setPlayIcon(); });
   box.appendChild(b);
  });
 }
 function setPlayIcon() { const p = $('play'); p.innerHTML = clock.paused ? '&#9654;' : '&#10074;&#10074;'; p.setAttribute('aria-label', clock.paused ? 'Play' : 'Pause'); }
 function toTour() {
  mode = 'tour'; tt = 0; shotNow = -1; tcam.init = false; clock.paused = false; setPlayIcon();
  $('start').hidden = true; $('endcard').hidden = true; $('explore').hidden = true; document.body.classList.remove('drawer'); $('drawerBtn').hidden = true; $('bar').hidden = false; $('labels').hidden = true; $('stage').classList.remove('grab');
  setWalk(false); orbit.follow = null; if (E.old && E.old.root.parent) { setOld(false); $('tOld').checked = false; }
 }
 function endTour() {
  mode = 'end'; $('caption').classList.remove('on'); $('titlecard').hidden = true; $('bar').hidden = true;
  const info = E.stats || {};
  $('sheetRows').innerHTML = [['Her look', 'The game’s Io, unchanged: every bone, proportion, colour and move'], ['Triangles', fmt(info.tris) + ' (the game’s model: 99,000)'], ['Bones', '51, as in the game'], ['Hair', fmt(info.strands) + ' strands in her 98 locks'], ['Where', 'Her cottage garden in Wickhollow, at night']].map((r) => '<dt>' + r[0] + '</dt><dd>' + r[1] + '</dd>').join('');
  $('endcard').hidden = false;
 }
 const fmt = (n) => (n ? Math.round(n).toLocaleString('en-GB') : '…');
 function toExplore() {
  mode = 'explore'; clock.paused = false;
  $('start').hidden = true; $('endcard').hidden = true; $('bar').hidden = true; $('titlecard').hidden = true; $('caption').classList.remove('on');
  setDrawer(!PHONE || store.get('io-drawer') !== 'closed'); $('drawerBtn').hidden = false; $('stage').classList.add('grab');
  E.io.reset(); io.tranceTo = $('tTrance').checked ? 1 : 0;
  frontView(); orbit.theta = orbit.gth; orbit.phi = orbit.gph; orbit.dist = orbit.gd; orbit.target.copy(orbit.gt);
 }
 function setDrawer(open) { $('explore').hidden = !open; document.body.classList.toggle('drawer', open); $('drawerBtn').setAttribute('aria-expanded', String(open)); $('drawerBtn').textContent = open ? 'Hide' : 'Explore'; }

 // ---------- the numbers ----------
 const fpsS = { acc: 0, n: 0, fps: 60, slow: 0 };
 function statsStep(dt) {
  fpsS.acc += dt; fpsS.n++;
  if (fpsS.acc > .5) {
   fpsS.fps = fpsS.n / fpsS.acc; fpsS.acc = 0; fpsS.n = 0;
   if (!TEST && QUALITY !== 'medium' && mode !== 'start') { fpsS.slow = fpsS.fps < 22 ? fpsS.slow + 1 : 0; if (fpsS.slow === 10 && !store.get('io-hinted')) { store.set('io-hinted', '1'); hint('She is running slowly here. Explore, then Under the hood, has a lighter Detail setting.'); } }
  }
  if (!$('tStats').checked) { $('stats').hidden = true; return; }
  const i = E.renderer.info, s = E.stats || {};
  $('stats').hidden = false;
  $('stats').textContent = 'Detail ' + QUALITY + '  ' + fpsS.fps.toFixed(0) + ' fps\nIo: ' + fmt(s.tris) + ' triangles, 51 bones, ' + s.calls + ' draw calls\nHair: ' + fmt(s.strands) + ' strands\nThe frame: ' + fmt(i.render.triangles) + ' triangles, ' + i.render.calls + ' draw calls\nBuilt in: garden ' + Math.round(E.ms.world) + ' ms, Io ' + Math.round(E.ms.model) + ' ms';
 }
 function countIo() {
  let tris = 0, calls = 0;
  E.io.root.traverse((o) => { if (o.isMesh) { const g = o.geometry; tris += (g.index ? g.index.count : g.attributes.position.count) / 3; calls++; } });
  E.stats = { tris, calls, strands: E.io.strands || 0 };
 }
 function hint(t) { const h = $('hint'); h.textContent = t; h.hidden = false; setTimeout(() => { h.hidden = true; }, 9000); }

 // ---------- the frame ----------
 function frame(realDt, noDraw) {
  E.renderer.info.reset();
  const dt = clock.paused && mode === 'tour' ? 0 : Math.min(realDt, 1 / 20) * clock.slow;
  if (dt > 0) simulate(dt);
  runTimers();
  if (mode === 'tour') tourStep(realDt); else if (mode === 'explore' || mode === 'end' || mode === 'start') orbitStep(realDt);
  labelsStep();
  if (!noDraw) E.cine.render(E.world.scene, E.camera, realDt);
  statsStep(realDt);
 }
 let last = 0;
 function loop(now) {
  const dt = last ? Math.min(.1, (now - last) / 1000) : 1 / 60; last = now;
  frame(dt);
  requestAnimationFrame(loop);
 }

 // ---------- the controls ----------
 function setWalk(on) { io.walking = on; $('tWalk').checked = on; if (on) { orbit.follow = null; } }
 function setLook(name) {
  E.world.look(name);
  for (const b of $('lightSeg').children) b.setAttribute('aria-pressed', String(b.dataset.look === name));
  const st = name === 'studio';
  E.cine.set({ exposure: st ? 1.05 : name === 'moon' ? 1.75 : 1.45, split: st ? 0 : .08, rays: st ? 0 : .22, vignette: st ? .15 : .3 });
 }
 function bindUI() {
  $('goTour').addEventListener('click', toTour); $('again').addEventListener('click', toTour);
  $('goExplore').addEventListener('click', toExplore); $('endExplore').addEventListener('click', toExplore); $('toExplore').addEventListener('click', toExplore);
  $('backTour').addEventListener('click', toTour);
  $('play').addEventListener('click', () => { clock.paused = !clock.paused; setPlayIcon(); });
  $('drawerBtn').addEventListener('click', () => { const open = $('explore').hidden; setDrawer(open); store.set('io-drawer', open ? 'open' : 'closed'); });
  $('tWalk').addEventListener('change', (e) => setWalk(e.target.checked));
  $('tGuard').addEventListener('change', (e) => { E.io.guard(e.target.checked); if (E.old) E.old.guard(e.target.checked); });
  $('tTrance').addEventListener('change', (e) => setTrance(e.target.checked));
  $('tOld').addEventListener('change', (e) => setOld(e.target.checked));
  $('tAuto').addEventListener('change', (e) => { orbit.auto = e.target.checked; if (orbit.auto) orbit.follow = null; });
  $('sWind').addEventListener('input', (e) => { E.world.wind.value = +e.target.value; });
  for (const b of $('lightSeg').children) b.addEventListener('click', () => setLook(b.dataset.look));
  for (const b of $('speedSeg').children) b.addEventListener('click', () => { clock.slow = +b.dataset.slow; for (const o of $('speedSeg').children) o.setAttribute('aria-pressed', String(o === b)); });
  $('quality').value = QUALITY;
  $('quality').addEventListener('change', (e) => { store.set('io-quality', e.target.value); const u = new URL(location.href); u.searchParams.set('q', e.target.value); location.href = u.toString(); });
  window.addEventListener('keydown', (e) => {
   if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT')) return;
   if (e.code === 'Space' && mode === 'tour') { e.preventDefault(); clock.paused = !clock.paused; setPlayIcon(); }
   else if (e.code === 'ArrowRight' && mode === 'tour') { const i = shotAt(tt); if (i < TOUR.length - 1) { tt = tstarts[i + 1] + .01; } }
   else if (e.code === 'ArrowLeft' && mode === 'tour') { const i = shotAt(tt); tt = tstarts[Math.max(0, i - 1)] + .01; }
   else if (e.code === 'Escape' && mode === 'tour') toExplore();
  });
  // the tour's bar hides itself while the mouse rests
  let idle = 0; const wake = () => { $('bar').classList.remove('idle'); clearTimeout(idle); idle = setTimeout(() => $('bar').classList.add('idle'), 2600); };
  window.addEventListener('pointermove', wake); window.addEventListener('pointerdown', wake);
  if (PHONE) $('startNote').textContent = 'It runs at a lighter detail on a phone. Drag to look round her; pinch to come closer.';
 }
 function ready() {
  $('load').hidden = true; $('start').hidden = false; mode = 'start';
  buildMoves(); buildClose(); buildLabels(); buildSteps(); bindUI(); bindOrbit(); countIo(); setLook('night');
  orbit.gt.set(0, 1.15, 0); orbit.gd = 4.6; orbit.gth = .55; orbit.gph = 1.5; orbit.theta = .55; orbit.phi = 1.5; orbit.dist = 4.6; orbit.target.copy(orbit.gt); orbit.auto = true;
  window.__io = { ready: true, E, io, orbit, toTour, toExplore, setLook, setOld, playMove, setTrance, setWalk, frame, simulate, get mode() { return mode; }, set tt(v) { tt = v; shotNow = -1; }, get tt() { return tt; } };
  if (TEST) return;
  requestAnimationFrame(loop);
 }
 window.__io = { ready: false };
 boot(0);
})();
