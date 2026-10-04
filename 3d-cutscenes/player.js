// player.js: plays a story scene from scenes.js as a film. It builds Io's garden (garden.js), the high-detail Io with
// her face made like the paper doll's (io-cutscene.js) and the film camera (cinema.js), then runs the scene's shots:
// the camera's moves, focus and exposure, who walks where and does what, the narration in a lower third and spoken
// lines in the game's dialogue box, and the night's sounds (sounds.js). A spoken line can wait for a tap, as the game's
// box does: the camera holds, the people keep breathing. Everything Io does is her own motion, unchanged: her idle, her
// walk and her moves; the scene only says where she walks and when. Detail: ?q=light|phone|laptop (a phone starts at
// phone). ?test drives frames from window.__cs instead of the clock, for headless pictures.
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const Qs = new URLSearchParams(location.search), TEST = Qs.has('test');
  const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private window */ } } };
  const PHONE = (window.matchMedia && matchMedia('(pointer: coarse)').matches) || Math.min(innerWidth, innerHeight) < 560;
  const QOK = ['light', 'phone', 'laptop'];
  const QUALITY = QOK.includes(Qs.get('q')) ? Qs.get('q') : QOK.includes(store.get('cs-quality')) ? store.get('cs-quality') : PHONE ? 'phone' : 'laptop';
  const QP = {
    light: { name: 'Light', detail: .3, px: 1, scale: .7, msaa: 0, garden: 'medium', blur: 8, lampShadow: false },
    phone: { name: 'Phone', detail: .5, px: 1.25, scale: .8, msaa: 2, garden: 'medium', blur: 10, lampShadow: true },
    laptop: { name: 'Laptop', detail: 1, px: 1.5, scale: 1, msaa: 4, garden: 'high', blur: 12, lampShadow: true }
  }[QUALITY];
  const V3 = (x, y, z) => new THREE.Vector3(x || 0, y || 0, z || 0);
  const cl = (v, a, b) => (v < a ? a : v > b ? b : v), lerp = (a, b, t) => a + (b - a) * t;
  const sm = (a, b, x) => { const t = cl((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const wrapA = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  const EASE = { l: (x) => x, i: (x) => x * x, o: (x) => 1 - (1 - x) * (1 - x), io: (x) => x * x * (3 - 2 * x) };
  const SC = makeScenes().prologue;
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
    ['Planting the garden', () => {
      const t = performance.now(); E.world = makeGarden(E.renderer, { quality: QP.garden }); E.world.look('night'); E.ms.world = performance.now() - t;
      if (!QP.lampShadow) E.world.lamp.castShadow = false;
      E.lamps = makeFarLamps(E.world.scene); makeDoorway(E.world.scene);
    }],
    ['Dressing Io', () => {
      const t = performance.now(); E.io = makeIoCutscene({ detail: QP.detail, shadows: true }); E.ms.model = performance.now() - t;
      E.world.scene.add(E.io.root, E.io.fx);
      E.actors = { io: makeActor('io', E.io, SC.cast.io) };
      let tris = 0; E.io.root.traverse((o) => { if (o.isMesh) { const g = o.geometry; tris += (g.index ? g.index.count : g.attributes.position.count) / 3; } }); E.ioTris = tris;
    }],
    ['Setting up the camera', () => {
      E.camera = new THREE.PerspectiveCamera(36, 1, .05, 3000);
      E.cine = makeCinema(E.renderer, { scale: QP.scale, msaa: QP.msaa }); E.cine.sun(E.world.moonDir);
      E.cine.set({ exposure: 1.45, bloom: .45, rays: .22, grain: .025, vignette: .3, split: .08, saturation: 1, focus: 12, aperture: .5, maxBlur: QP.blur });
      resize(); window.addEventListener('resize', resize);
    }],
    ['Waking her', () => { const t = performance.now(); restart(); E.renderer.compile(E.world.scene, E.camera); frame(1 / 30, true); E.ms.compile = performance.now() - t; }]
  ];
  function boot(i) {
    if (i >= steps.length) return ready();
    $('loadStep').textContent = steps[i][0];
    $('loadBar').style.width = Math.round(i / steps.length * 100) + '%';
    $('loadBar').parentNode.setAttribute('aria-valuenow', Math.round(i / steps.length * 100));
    setTimeout(() => {
      try { steps[i][1](); boot(i + 1); } catch (e) {
        console.error(e); $('loadStep').textContent = 'The scene could not start here: ' + (e && e.message ? e.message : e) + '. It needs a browser with WebGL 2, such as a current Chrome, Edge, Firefox or Safari.';
        window.__err = String(e && e.stack || e);
      }
    }, TEST ? 0 : 60);
  }
  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    E.renderer.setSize(w, h, false); E.camera.aspect = w / h; E.camera.updateProjectionMatrix();
  }

  // ---------- the people in the scene: where they stand, where they walk ----------
  // An actor walks a path of points at her own pace (her walk cycle turns 4.4 radians a meter, as the game drives it),
  // turning toward each point and easing to a stop at the last. The model only ever gets what the game gives it:
  // its place, its facing, and animate(phase, walk, t, dt).
  function makeActor(id, m, c) { return { id, m, c, x: c.at[0], z: c.at[1], yaw: c.yaw || 0, phase: 0, walk: 0, speed: 1.05, path: null }; }
  function placeActor(a) { a.x = a.c.at[0]; a.z = a.c.at[1]; a.yaw = a.c.yaw || 0; a.phase = 0; a.walk = 0; a.path = null; a.m.reset(); }
  function actorStep(a, t, dt) {
    let want = 0;
    if (a.path) {
      let p = a.path[0];
      while (a.path.length > 1 && Math.hypot(p[0] - a.x, p[1] - a.z) < .4) { a.path.shift(); p = a.path[0]; }
      const dx = p[0] - a.x, dz = p[1] - a.z, d = Math.hypot(dx, dz);
      const ahead = dx * Math.sin(a.yaw) + dz * Math.cos(a.yaw);
      if (a.path.length === 1 && (d < .03 || ahead < .02)) a.path = null;
      else {
        want = a.path.length === 1 ? Math.min(1, d / .55) : 1;
        a.yaw += wrapA(Math.atan2(dx, dz) - a.yaw) * Math.min(1, dt * 4);
      }
    }
    a.walk += (want - a.walk) * Math.min(1, dt * 3.2);
    if (a.walk < 1e-3 && !a.path) a.walk = 0;
    const sp = a.speed * a.walk;
    a.x += Math.sin(a.yaw) * sp * dt; a.z += Math.cos(a.yaw) * sp * dt; a.phase += sp * dt * 4.4;
    a.m.root.position.set(a.x, E.world.heightAt(a.x, a.z), a.z); a.m.root.rotation.y = a.yaw;
    a.m.animate(a.phase, a.walk, t, dt);
  }

  // ---------- the prologue's far lamps: the lamps by the bridge, seen past the gate ----------
  function makeFarLamps(scene) {
    const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
    const q = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    q.addColorStop(0, 'rgba(255,255,255,1)'); q.addColorStop(.07, 'rgba(255,236,200,1)'); q.addColorStop(.13, 'rgba(255,190,120,.45)'); q.addColorStop(.4, 'rgba(255,160,80,.12)'); q.addColorStop(1, 'rgba(255,150,60,0)');
    g.fillStyle = q; g.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(c); tex.encoding = THREE.sRGBEncoding;
    const P = [[14.4, 3.0, 35.4], [16.7, 3.05, 34.5], [19.0, 3.1, 33.6], [21.3, 3.15, 32.7]];
    const lamps = P.map((p) => {
      const m = new THREE.SpriteMaterial({ map: tex, color: new THREE.Color(1, .66, .36), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
      const s = new THREE.Sprite(m); s.position.fromArray(p); s.scale.setScalar(1.6); scene.add(s); return { s, m };
    });
    // the mist round them, lit warm: the only sign of the bridge at that distance
    const c2 = document.createElement('canvas'); c2.width = c2.height = 64; const g2 = c2.getContext('2d');
    const q2 = g2.createRadialGradient(32, 32, 0, 32, 32, 32); q2.addColorStop(0, 'rgba(255,255,255,.7)'); q2.addColorStop(.5, 'rgba(255,255,255,.22)'); q2.addColorStop(1, 'rgba(255,255,255,0)');
    g2.fillStyle = q2; g2.fillRect(0, 0, 64, 64);
    const t2 = new THREE.CanvasTexture(c2);
    const hm = new THREE.SpriteMaterial({ map: t2, color: new THREE.Color(1, .55, .25), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, opacity: .16 });
    const haze = new THREE.Sprite(hm); haze.position.set(17.9, 3.4, 34); haze.scale.set(26, 9, 1); scene.add(haze);
    lamps.haze = hm;
    return lamps;
  }
  // her open door: the garden paints the warm room just behind the wall, where the wall hides it, so the scene adds
  // the same warm light a hair in front of it, where the doorway is (the windows are made the same way)
  function makeDoorway(scene) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(.9, 1.74), new THREE.MeshBasicMaterial({ color: new THREE.Color(1, .55, .25).convertSRGBToLinear().multiplyScalar(1.6) }));
    m.position.set(0, .87, -6.994); scene.add(m);
  }
  const LAMPS_AT = (SC.shots.find((s) => s.lamps) || { start: 1e9 }).start;
  function lampsStep(t) {
    const st = film.t - LAMPS_AT;
    let sum = 0;
    E.lamps.forEach((L, i) => {
      let k = 1 + .05 * Math.sin(t * 7.3 + i * 2.1) + .03 * Math.sin(t * 13.1 + i);
      if (st > 0) {
        // they gutter: deep, quick dips, one goes out and one sinks low
        const f = .5 + .5 * Math.sin(t * 21 + i * 4.7) * Math.sin(t * 8.3 + i * 1.3);
        k *= 1 - sm(0, 1.2, st) * .55 * f * f;
        if (i === 2) k *= 1 - .97 * sm(2.3, 2.9, st);
        if (i === 0) k *= 1 - .6 * sm(4.8, 5.6, st);
      }
      L.m.color.setRGB(1, .66, .36).multiplyScalar(3.2 * Math.max(0, k)); sum += Math.max(0, k);
    });
    E.lamps.haze.opacity = .16 * sum / E.lamps.length;
  }

  // ---------- the film: its clock, its shots, its lines ----------
  const film = { t: 0, shot: -1, hold: null, mode: 'start' };
  const LINES = [], CUES = [];
  for (const s of SC.shots) {
    for (const [t0, t1, who, words, o] of s.say || []) LINES.push({ a0: s.start + t0, a1: s.start + t1, who, words, hold: !!(o && o.hold), read: false });
    for (const d of s.do || []) CUES.push({ at: s.start + d[0], kind: 'do', d });
    for (const x of s.sound || []) CUES.push({ at: s.start + x[0], kind: 'sound', x });
  }
  const clock = { sim: 0 };
  function restart() {
    film.t = 0; film.shot = -1; film.hold = null; film.fired = -1;
    for (const L of LINES) L.read = false;
    for (const id in E.actors) placeActor(E.actors[id]);
    // settle her springs where she stands, before anything is drawn
    for (let i = 0; i < 45; i++) { clock.sim += 1 / 30; for (const id in E.actors) actorStep(E.actors[id], clock.sim, 1 / 30); }
    showWords(null, null); $('titlecard').hidden = true; E.cine.params.fade = 0;
    fps.frames = 0; fps.time = 0; fps.worst = 99; fps.win = []; fps.slow = 0;
  }
  function shotAt(t) { for (let i = SC.shots.length - 1; i >= 0; i--) if (t >= SC.shots[i].start) return i; return 0; }
  function keyed(list, t, def) {
    if (!list || !list.length) return def;
    if (t <= list[0][0]) return list[0][1];
    for (let i = 0; i < list.length - 1; i++) { const [a, va] = list[i], [b, vb] = list[i + 1]; if (t >= a && t < b) return lerp(va, vb, (t - a) / (b - a)); }
    return list[list.length - 1][1];
  }
  function filmStep(dt, autoRead) {
    if (film.hold) { if (autoRead) { film.hold.read = true; film.hold = null; } else return; }
    const prev = film.t; let t = Math.min(SC.total, prev + dt);
    for (const L of LINES) if (L.hold && !L.read && prev < L.a1 && t >= L.a1) { if (autoRead) L.read = true; else { t = L.a1; film.hold = L; } break; }
    film.t = t;
    for (const c of CUES) if (c.at > film.fired && c.at <= t) fire(c);
    film.fired = t;
    if (t >= SC.total - 1e-6) toEnd(false);
  }
  function fire(c) {
    if (c.kind === 'do') {
      const [, who, what, arg, sp] = c.d, a = E.actors[who]; if (!a) return;
      if (what === 'walk') { a.path = arg.map((p) => p.slice()); if (sp) a.speed = sp; }
      else if (what === 'play') a.m.play(arg, true);
      else if (what === 'guard') a.m.guard(!!arg);
    } else if (c.kind === 'sound') {
      const [, id, gain, o] = c.x;
      if (!snd || !snd.ready) return;
      if (id === 'wind') snd.setWind(gain); else snd.night(id, Object.assign({ gain }, o || {}));
    }
  }

  // ---------- the camera ----------
  const _a = V3(), _b = V3(), _c = V3(), _d = V3(), _q = new THREE.Quaternion(), _e = new THREE.Euler();
  let focusD = 12;
  function relPoint(id, p, out) {
    const a = E.actors[id], c = Math.cos(a.yaw), s = Math.sin(a.yaw);
    return out.set(a.x + p[0] * c + p[2] * s, E.world.heightAt(a.x, a.z) + p[1], a.z - p[0] * s + p[2] * c);
  }
  // a point: [x, y, z], 'moon' (far off toward it), 'actor.part' (one of her anchors), or ['actor.part', dx, dy, dz]
  function resolve(p, out) {
    if (Array.isArray(p) && typeof p[0] === 'string') return resolve(p[0], out).add(_d.set(p[1] || 0, p[2] || 0, p[3] || 0));
    if (Array.isArray(p)) return out.fromArray(p);
    if (p === 'moon') return out.copy(E.world.moonDir).multiplyScalar(60).add(E.camera.position);
    if (typeof p === 'string') { const [who, part] = p.split('.'); const a = E.actors[who]; if (a) return a.m.anchor(part || 'chest', out); }
    return out.set(0, 1.2, 0);
  }
  function cameraStep(realT, cut) {
    const s = SC.shots[film.shot], c = s.cam, cam = E.camera, st = film.t - s.start;
    const e = (EASE[c.ease] || EASE.io)(cl(st / s.d, 0, 1));
    if (c.rel) { relPoint(c.rel, c.from, cam.position); relPoint(c.rel, c.to, _a); cam.position.lerp(_a, e); }
    else cam.position.fromArray(c.from).lerp(_a.fromArray(c.to), e);
    const gy = E.world.heightAt(cam.position.x, cam.position.z) + .06; if (cam.position.y < gy) cam.position.y = gy;
    resolve(c.at, _b); if (c.at2) _b.lerp(resolve(c.at2, _c), e);
    cam.lookAt(_b);
    const hk = c.shake || 0;
    if (hk > 0) { const t = realT; _e.set((Math.sin(t * .9) * .6 + Math.sin(t * 2.3 + 1) * .3 + Math.sin(t * 5.1) * .1) * hk * .012, (Math.sin(t * .7 + 2) * .6 + Math.sin(t * 1.9) * .4) * hk * .014, Math.sin(t * .5 + 3) * hk * .006); _q.setFromEuler(_e); cam.quaternion.multiply(_q); }
    // a phone held upright sees less of the width, so the lens widens a little to keep the picture's subject
    const f = c.fov ? lerp(c.fov[0], c.fov[1], e) : 34, k = Math.sqrt(Math.max(1, (16 / 9) / cam.aspect));
    cam.fov = 2 * Math.atan(Math.tan(f * Math.PI / 360) * k) * 180 / Math.PI; cam.updateProjectionMatrix();
    // focus: pulled to its mark, quickly within a shot, at once on a cut
    const fd = typeof s.focus === 'number' ? s.focus : cam.position.distanceTo(resolve(s.focus || c.at, _c));
    focusD = cut ? fd : focusD + (fd - focusD) * .12;
    const P = E.cine.params;
    P.focus = focusD; P.aperture = s.ap === undefined ? .5 : s.ap; P.exposure = s.exp || 1.45;
    P.fade = s.fade ? keyed(s.fade, st, 1) : 1;
    // letterbox to a wide frame on a laptop; none on a phone held sideways (already wide) or upright
    P.bars = cam.aspect >= 1.2 ? cl((1 - cam.aspect / 2.2) / 2, 0, .1) : 0;
    $('titlecard').hidden = !(film.mode === 'play' && s.title && st >= s.title[0] && st < s.title[1]);
  }
  // the moon's shadow follows Io, so she casts one wherever she walks
  function moonStep() {
    const m = E.world.lights.moon, a = E.actors.io;
    m.target.position.set(a.x, .9, a.z); m.position.copy(E.world.moonDir).multiplyScalar(20).add(m.target.position);
  }

  // ---------- the words: narration in a lower third, spoken lines in the game's dialogue box ----------
  const PORTRAITS = { io: { name: 'Io', src: './portrait-io.webp' } };
  let shownN = null, shownS = null;
  function wordsStep() {
    let n = null, s = null;
    for (const L of LINES) {
      const on = (film.t >= L.a0 && film.t < L.a1) || film.hold === L;
      if (!on) continue;
      if (L.who) s = L; else n = L;
    }
    showWords(n, s);
  }
  function showWords(n, s) {
    if (n !== shownN) { shownN = n; if (n) $('capWords').textContent = n.words; $('caption').classList.toggle('on', !!n); }
    if (s !== shownS) {
      shownS = s; const box = $('talk');
      if (s) {
        const p = PORTRAITS[s.who];
        $('talkWho').textContent = p ? p.name : s.who; $('talkSaid').textContent = s.words;
        if (p) { $('talkFace').src = p.src; $('talkFace').parentNode.hidden = false; } else $('talkFace').parentNode.hidden = true;
        box.hidden = false;
      } else box.hidden = true;
    }
    $('talkNext').hidden = !(s && s.hold && !s.read);
  }
  function tapOn() {
    if (film.mode !== 'play') return;
    const L = film.hold || (shownS && shownS.hold ? shownS : null);
    if (!L) return;
    L.read = true; if (film.hold === L) film.hold = null;
    $('talkNext').hidden = true;
  }

  // ---------- sound: the field study's night, made in code ----------
  // The sounds are made while the start screen shows (a phone takes a few seconds), and heard from the first tap on:
  // a browser lets a page play sound only after one.
  let snd = null;
  function startSound() {
    if (TEST || typeof makeFieldSounds !== 'function') return;
    if (snd) { snd.init(); return; }
    try { snd = makeFieldSounds(); snd.init(); snd.setHold(true); snd.setWind(.5); } catch (e) { snd = null; }
  }

  // ---------- how fast this screen draws it ----------
  const fps = { frames: 0, time: 0, worst: 99, win: [], slow: 0 };
  function fpsStep(dt) {
    if (film.mode !== 'play' || TEST) return;
    fps.frames++; fps.time += dt;
    fps.win.push(dt); let s = 0; for (const x of fps.win) s += x; while (s > 1 && fps.win.length > 1) s -= fps.win.shift();
    if (fps.time > 3 && s >= .98) { const f = fps.win.length / s; fps.worst = Math.min(fps.worst, f); fps.slow = f < 20 ? fps.slow + dt : 0; }
    if (fps.slow > 6 && QUALITY !== 'light' && !fps.hinted) { fps.hinted = true; hint('It is drawing slowly here. The end of the scene offers a lighter version.'); }
  }

  // ---------- each frame ----------
  // realDt: the time since the last frame, kept to a tenth of a second so a stall never jumps the scene; rawDt: the
  // real time since the last frame, for measuring how fast this screen draws
  function frame(realDt, noDraw, autoRead, rawDt) {
    E.renderer.info.reset();
    const dt = Math.min(realDt, 1 / 10);
    clock.sim += dt;
    if (film.mode === 'play') filmStep(dt, !!autoRead);
    const si = shotAt(film.t), cut = si !== film.shot; film.shot = si;
    for (const id in E.actors) actorStep(E.actors[id], clock.sim, dt);
    E.world.update(clock.sim, dt);
    lampsStep(clock.sim); moonStep();
    cameraStep(clock.sim, cut);
    // behind the end card the picture comes back, dimmed
    if (film.mode === 'end') { film.endFade += (.32 - film.endFade) * Math.min(1, dt * 1.2); E.cine.params.fade = film.endFade; }
    wordsStep();
    if (!noDraw) E.cine.render(E.world.scene, E.camera, dt);
    fpsStep(rawDt === undefined ? realDt : rawDt);
  }
  let last = 0;
  function loop(now) {
    const raw = last ? (now - last) / 1000 : 1 / 60; last = now;
    if (E && E.cine) frame(Math.min(.1, raw), false, false, Math.min(raw, 2));
    requestAnimationFrame(loop);
  }

  // ---------- the start and the end ----------
  function play() {
    $('start').hidden = true; $('endcard').hidden = true; $('skip').hidden = false;
    restart(); film.mode = 'play';
  }
  function toEnd(skipped) {
    if (film.mode === 'end') return;
    film.mode = 'end'; film.hold = null; $('skip').hidden = true; $('titlecard').hidden = true;
    film.endFade = skipped ? E.cine.params.fade : 0;
    if (skipped) film.t = 3.4; // behind the end card, the opening view, as behind the start
    showWords(null, null);
    const f = fps.time > 2 ? Math.round(fps.frames / fps.time) : 0;
    const info = E.renderer.info.render, rows = [
      ['On this screen', f ? 'about ' + f + ' frames a second' + (fps.worst < 99 ? ' (the slowest moment ' + Math.round(fps.worst) + ')' : '') + ', at ' + QP.name + ' detail' : 'skipped before it could be measured, at ' + QP.name + ' detail'],
      ['Io', 'the high-detail Io with her face made like her paper doll’s, ' + Math.round(E.ioTris / 1000) + ' thousand triangles at this detail, walking and looking about with her own moves'],
      ['The scene', 'the game’s own prologue words, still placeholders, in seven shots. The shots are a short written list, so a new scene is mostly a new list'],
      ['Made from', 'Io’s garden, the Bramble Colossus film camera and its night sounds, all already in the project']
    ];
    $('endRows').innerHTML = rows.map((r) => '<dt>' + r[0] + '</dt><dd>' + r[1] + '</dd>').join('');
    const other = f && f < 24 && QUALITY !== 'light' ? 'light' : QUALITY === 'laptop' ? 'phone' : QUALITY === 'light' ? 'phone' : (f >= 45 ? 'laptop' : 'light');
    const b = $('otherQ'); b.dataset.q = other;
    b.innerHTML = { light: 'Lighter', phone: 'Phone detail', laptop: 'Sharper' }[other] + '<span>' + { light: 'for a slower phone', phone: 'what a phone gets first', laptop: 'the full detail, for a laptop' }[other] + '</span>';
    $('endcard').hidden = false;
    window.__ended = { fps: f, worst: fps.worst, skipped: !!skipped };
  }
  function hint(t) { const h = $('hint'); h.textContent = t; h.hidden = false; setTimeout(() => { h.hidden = true; }, 7000); }
  function bindUI() {
    $('go').addEventListener('click', () => { startSound(); play(); });
    $('again').addEventListener('click', () => { startSound(); play(); });
    $('otherQ').addEventListener('click', (e) => { const q = e.currentTarget.dataset.q; store.set('cs-quality', q); const u = new URL(location.href); u.searchParams.set('q', q); location.href = u.toString(); });
    $('skip').addEventListener('click', (e) => { e.stopPropagation(); toEnd(true); });
    $('talk').addEventListener('click', tapOn);
    $('stage').addEventListener('pointerdown', tapOn);
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'Enter') { if (film.mode === 'play') { e.preventDefault(); tapOn(); } }
      if (e.code === 'Escape' && film.mode === 'play') toEnd(true);
    });
    if (!PHONE) $('startNote').textContent = 'Made for the game on a phone; on a laptop it plays at full detail.';
  }
  function ready() {
    $('loadBar').style.width = '100%';
    if (TEST) document.body.classList.add('test');
    $('load').hidden = true; $('start').hidden = false;
    bindUI(); startSound();
    // behind the start screen: the opening shot, held near the moon
    film.mode = 'start'; film.t = 3.4;
    window.__cs.ready = true;
    if (!TEST) requestAnimationFrame(loop);
  }

  // ---------- test hooks ----------
  window.__cs = {
    ready: false, scene: SC, quality: QUALITY,
    get E() { return E; }, get film() { return film; },
    // play from the start up to t without drawing (lines that wait are read at once), then draw n frames
    at(t, n) { $('start').hidden = true; restart(); film.mode = 'play'; while (film.t < t - 1e-6 && film.mode === 'play') frame(Math.min(1 / 30, t - film.t), true, true); return this.step(n || 1); },
    // hold on the line that waits, as a player who has not tapped yet sees it
    hold(t) { $('start').hidden = true; restart(); film.mode = 'play'; while (film.t < t - 1e-6 && !film.hold && film.mode === 'play') frame(1 / 30, true, false); return this.step(2, 0, false); },
    step(n, dt, read) { for (let i = 0; i < (n || 1); i++) frame(dt || 1 / 30, false, read !== false); E.renderer.getContext().finish(); const r = E.renderer.info.render; return { t: film.t, shot: SC.shots[film.shot].id, calls: r.calls, tris: r.triangles, hold: !!film.hold }; },
    end() { toEnd(true); film.endFade = .32; return this.step(1); },
    stats: () => ({ worldMs: Math.round(E.ms.world), ioMs: Math.round(E.ms.model), compileMs: Math.round(E.ms.compile), ioTris: E.ioTris, quality: QUALITY })
  };
  boot(0);
})();
