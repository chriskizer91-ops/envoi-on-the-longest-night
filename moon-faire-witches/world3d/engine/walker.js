// walker.js: Moon Faire's Io walking a 3D place of Envoi, on a phone.
//   W3D.walk({ place, canvas, root })   builds the place (world.js), puts Io in it and runs it
// On the phone: drag anywhere on the left half of the screen to walk (a small ring shows where the thumb went; push far
// and she jogs), drag on the right half to turn the camera. Nothing else is on screen but one button, which shows the
// painting from above over the 3D, as a guide (with the frame rate and the counts under it).
// On a computer: the arrow keys or WASD, Shift to jog, and the mouse the same as a thumb.
// The camera follows her from behind and above, and slowly swings round behind her as she turns.
// Her model, its looks and its moves are Moon Faire's own (src/moon-io.js, at its lightest); only where she stands, which
// way she faces and how fast her steps go are set here.
(function (G) {
  'use strict';
  const W3D = G.W3D;
  const { clamp } = W3D;
  const TEST = /[?&]test\b/.test(location.search);

  W3D.walk = async function (opt) {
    const root = opt.root, cv = opt.canvas, place = opt.place;
    const DPR0 = Math.min(window.devicePixelRatio || 1, TEST ? 1 : 1.75);
    let dpr = Math.min(DPR0, 1.5);
    const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: TEST });
    renderer.setPixelRatio(dpr); renderer.outputEncoding = THREE.sRGBEncoding; renderer.setClearColor(0x0a0b18, 1);
    const say = opt.say || (() => {});
    say('Building ' + place.name + '…');
    const P = await W3D.buildPlace(place, renderer);
    const scene = P.scene, M = P.M;

    // ---- Io ----
    say('Bringing Io…');
    const es = new THREE.Scene(), sg = new THREE.SphereGeometry(10, 24, 12), scol = [];
    { const top = new THREE.Color(0.22, 0.21, 0.36), mid = new THREE.Color(0.09, 0.08, 0.13), bot = new THREE.Color(0.03, 0.022, 0.035), c = new THREE.Color();
      for (let i = 0; i < sg.attributes.position.count; i++) { const y = sg.attributes.position.getY(i) / 10; if (y > 0) c.copy(mid).lerp(top, Math.pow(y, 0.7)); else c.copy(mid).lerp(bot, Math.pow(-y, 0.5)); scol.push(c.r, c.g, c.b); }
      sg.setAttribute('color', new THREE.Float32BufferAttribute(scol, 3)); es.add(new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
      const panel = (x, y, z, w, h, r, gg, b) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(r, gg, b), side: THREE.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 1, 0); es.add(m); };
      panel(4, 6, 5, 4, 3, 4.2, 3.9, 3.8); panel(-6, 3, 2, 2, 4, 0.8, 0.9, 1.6); panel(-2, 5, -7, 5, 2.5, 2.2, 1.2, 3.6);
      const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(es, 0.03).texture; pm.dispose(); }
    const A = makeMoonIo({ weight: 'lightest' }); A.walkRun = false; scene.add(A.root);
    // her triangles as drawn (her spells' props stay hidden while she walks)
    const ioDrawn = () => { const shown = (o) => { for (let q = o; q; q = q.parent) if (!q.visible) return false; return true; }; let n = 0; A.root.traverse((o) => { if (o.isMesh && o.geometry && shown(o)) n += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; }); return Math.round(n); };
    // her light: the moon from above, a cool sky, a violet rim, a soft fill from the camera, and the three lamps nearest her
    const md = P.U.uMoonDir.value;
    scene.add(new THREE.HemisphereLight(0x8a92c8, 0x261c2a, 0.55));
    const key = new THREE.DirectionalLight(0xc0c8ff, 0.6); key.position.copy(md).multiplyScalar(20); scene.add(key); scene.add(key.target);
    const rim = new THREE.DirectionalLight(0xc8a8ff, 0.35); scene.add(rim); scene.add(rim.target);
    const fill = new THREE.DirectionalLight(0xc0c8ff, 0.22); scene.add(fill); scene.add(fill.target);
    const near = [0, 1, 2].map(() => { const l = new THREE.PointLight(0xffb070, 0, 9, 2); scene.add(l); return l; });
    // her soft shadow
    const blobT = new THREE.CanvasTexture(W3D.paint.blob());
    const blob = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.3), new THREE.MeshBasicMaterial({ map: blobT, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
    blob.rotation.x = -Math.PI / 2; blob.renderOrder = 2; scene.add(blob);

    // ---- where she is ----
    const io = { px: place.start[0], py: place.start[1], y: 0, yaw: place.startFace != null ? place.startFace : Math.PI, speed: 0, jog: false, moving: false };
    io.y = P.walkH(io.px, io.py);
    const pos = () => new THREE.Vector3(M.x(io.px), io.y, M.z(io.py));
    // her feet fit wherever the walking map lets her stand: her middle and four points a hand's width round it
    const FOOT = 0.12;
    const fits = (px, py) => P.walkable(px, py) && P.walkable(px + FOOT / M.SX, py) && P.walkable(px - FOOT / M.SX, py) && P.walkable(px, py + FOOT / M.SZ) && P.walkable(px, py - FOOT / M.SZ);
    function stepBy(dx, dz) {
      const tryAt = (ax, az) => { const qx = io.px + ax / M.SX, qy = io.py + az / M.SZ; if (fits(qx, qy)) { io.px = qx; io.py = qy; return true; } return false; };
      if (tryAt(dx, dz)) return 1;
      // slide along the wall: the part of the step along it, then a little round the corner
      if (Math.abs(dx) > 1e-4 && tryAt(dx, 0)) return 0.7;
      if (Math.abs(dz) > 1e-4 && tryAt(0, dz)) return 0.7;
      const L = Math.hypot(dx, dz);
      // round the corner: turned a little more each try, either way
      for (const a of [0.35, -0.35, 0.7, -0.7, 1.05, -1.05, 1.4, -1.4]) { const c = Math.cos(a), s = Math.sin(a); for (const k of [1, 0.5]) if (tryAt((dx * c - dz * s) * k, (dx * s + dz * c) * k)) return 0.5 * k; }
      // over a sliver where two of the walking map's areas meet (as the 2D walk does, up to about 4 px)
      for (const k of [2, 3, 4, 5]) if (tryAt(dx * k, dz * k)) return 1;
      return L > 0 ? 0 : 1;
    }

    // ---- the camera ----
    const cam = new THREE.PerspectiveCamera(60, 1, 0.1, (place.night && place.night.far) || 800);
    const C = { yaw: 0, pitch: 0.62, dist: 7.0, aim: 1.15, auto: 0, top: false };
    let view = { fov: 60, dist: 7, pitch: 0.62 };
    function layout() {
      const W = root.clientWidth, H = root.clientHeight; renderer.setSize(W, H, false);
      const asp = W / H; cam.aspect = asp;
      // upright: a taller view and a higher camera, so the square shows round her; on its side: wider and lower
      view = asp < 1 ? { fov: 64, dist: 7.4, pitch: 0.5, ahead: 2.6 } : { fov: 46, dist: 6.6, pitch: 0.42, ahead: 1.6 };
      cam.fov = view.fov; cam.updateProjectionMatrix(); C.dist = view.dist; if (!C.pitchSet) C.pitch = view.pitch;
      if (guide.on) fitTop();
    }
    const camPos = new THREE.Vector3(), camAim = new THREE.Vector3();
    function placeCamera(dt, snap) {
      const p = pos(), ah = view.ahead || 0, aim = new THREE.Vector3(p.x - Math.sin(C.yaw) * ah, p.y + C.aim, p.z - Math.cos(C.yaw) * ah);
      const cp = Math.cos(C.pitch), want = new THREE.Vector3(aim.x + Math.sin(C.yaw) * cp * C.dist, aim.y + Math.sin(C.pitch) * C.dist, aim.z + Math.cos(C.yaw) * cp * C.dist);
      const gpx = M.px(want.x), gpy = M.py(want.z), gy = P.terrain(gpx, gpy) + 1.2; if (want.y < gy) want.y = gy;
      const k = snap ? 1 : 1 - Math.exp(-dt * 7);
      camPos.lerp(want, k); camAim.lerp(aim, snap ? 1 : 1 - Math.exp(-dt * 10));
      cam.position.copy(camPos); cam.lookAt(camAim);
    }

    // ---- the guide: the painting from straight above, laid over the 3D ----
    const top = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 400);
    const guide = { on: false };
    const pW = M.W * M.SX, pH = M.H * M.SZ;
    const paintTex = new THREE.TextureLoader().load(place.paintingSrc);
    const paintPlane = new THREE.Mesh(new THREE.PlaneGeometry(pW, pH), new THREE.MeshBasicMaterial({ map: paintTex, transparent: true, opacity: 0.55, depthTest: false, depthWrite: false }));
    paintPlane.rotation.x = -Math.PI / 2; paintPlane.position.set(0, 30, 0); paintPlane.renderOrder = 20; paintPlane.visible = false; scene.add(paintPlane);
    const marker = new THREE.Mesh(new THREE.RingGeometry(0.7, 1.05, 24), new THREE.MeshBasicMaterial({ color: 0xffe6a0, depthTest: false, transparent: true }));
    marker.rotation.x = -Math.PI / 2; marker.renderOrder = 21; marker.visible = false; scene.add(marker);
    function fitTop() {
      const W = root.clientWidth, H = root.clientHeight, asp = W / H;
      let hw = pW / 2 * 1.03, hh = hw / asp; if (hh < pH / 2 * 1.03) { hh = pH / 2 * 1.03; hw = hh * asp; }
      top.left = -hw; top.right = hw; top.top = hh; top.bottom = -hh; top.position.set(0, 120, 0); top.up.set(0, 0, -1); top.lookAt(0, 0, 0); top.updateProjectionMatrix();
    }
    const fog0 = [P.U.uFogNear.value, P.U.uFogFar.value];
    function setGuide(on, paint) { guide.on = on; paintPlane.visible = on && paint !== false; marker.visible = on && paint !== false; P.U.uFogNear.value = on ? 1e4 : fog0[0]; P.U.uFogFar.value = on ? 2e4 : fog0[1]; if (opt.onGuide) opt.onGuide(on); if (on) fitTop(); }

    // ---- the thumb and the keys ----
    const ring = opt.ring, dot = opt.dot;
    const input = { x: 0, y: 0, mag: 0, keys: {}, move: null, look: null };
    const RAD = 58;
    cv.addEventListener('pointerdown', (e) => {
      const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      if (x < r.width / 2 && !input.move) { input.move = { id: e.pointerId, x0: x, y0: y }; input.x = input.y = input.mag = 0; if (ring) { ring.style.display = 'block'; ring.style.left = x + 'px'; ring.style.top = y + 'px'; dot.style.transform = 'translate(-50%,-50%)'; } }
      else if (!input.look) input.look = { id: e.pointerId, x, y };
      cv.setPointerCapture(e.pointerId); e.preventDefault();
    });
    cv.addEventListener('pointermove', (e) => {
      const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      if (input.move && e.pointerId === input.move.id) {
        let dx = x - input.move.x0, dy = y - input.move.y0; const L = Math.hypot(dx, dy);
        if (L > RAD) { dx *= RAD / L; dy *= RAD / L; }
        input.x = dx / RAD; input.y = dy / RAD; input.mag = Math.min(1, L / RAD);
        if (dot) dot.style.transform = 'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + dy + 'px))';
      } else if (input.look && e.pointerId === input.look.id) {
        C.yaw -= (x - input.look.x) * 0.0065; C.pitch = clamp(C.pitch + (y - input.look.y) * 0.004, 0.06, 1.25); C.pitchSet = true; C.auto = 1.2;
        input.look.x = x; input.look.y = y;
      }
    });
    const lift = (e) => {
      if (input.move && e.pointerId === input.move.id) { input.move = null; input.x = input.y = input.mag = 0; if (ring) ring.style.display = 'none'; }
      if (input.look && e.pointerId === input.look.id) input.look = null;
    };
    cv.addEventListener('pointerup', lift); cv.addEventListener('pointercancel', lift);
    window.addEventListener('keydown', (e) => { input.keys[e.key.toLowerCase()] = true; });
    window.addEventListener('keyup', (e) => { input.keys[e.key.toLowerCase()] = false; });
    const keyMove = () => {
      const k = input.keys; let x = 0, y = 0;
      if (k.arrowleft || k.a) x -= 1; if (k.arrowright || k.d) x += 1; if (k.arrowup || k.w) y -= 1; if (k.arrowdown || k.s) y += 1;
      const L = Math.hypot(x, y); return L ? { x: x / L, y: y / L, mag: k.shift ? 1 : 0.6 } : null;
    };

    // ---- each frame ----
    const NATURAL = { walk: 0.62 * 1.7, jog: 1.25 * 1.7 };   // her own steps' speeds, in metres a second (moon-io-walker.js)
    const SPEED = { walk: 1.3, jog: 3.0 };
    let exitShown = null, scripted = null;
    // the keepsakes found so far (kept on the phone between visits; not in a test run)
    const FOUND_KEY = 'envoi3d-found';
    let found = {}; if (!TEST) try { found = JSON.parse(localStorage.getItem(FOUND_KEY) || '{}') || {}; } catch (e) { found = {}; }
    for (const it of P.items) if (found[it.id]) { it.got = true; P.takeItem(it); }
    const keep = () => { if (!TEST) try { localStorage.setItem(FOUND_KEY, JSON.stringify(found)); } catch (e) { /* the phone won't keep it: fine */ } };
    function tick(dt, t) {
      // where she wants to go, from the thumb (or the keys), turned by the camera
      let ix = input.x, iy = input.y, mag = input.mag; const km = keyMove(); if (km && !input.move) { ix = km.x; iy = km.y; mag = km.mag; }
      if (scripted) { ix = scripted.x; iy = scripted.y; mag = scripted.mag; }
      const fx = -Math.sin(C.yaw), fz = -Math.cos(C.yaw), rx = Math.cos(C.yaw), rz = -Math.sin(C.yaw);
      let mx = rx * ix + fx * -iy, mz = rz * ix + fz * -iy; const ml = Math.hypot(mx, mz);
      const go = mag > 0.14 && ml > 0;
      const jog = mag > 0.82, want = go ? (jog ? SPEED.jog : SPEED.walk * clamp(mag / 0.65, 0.45, 1)) : 0;
      io.speed += (want - io.speed) * Math.min(1, dt * (want > io.speed ? 7 : 10));
      if (go) { mx /= ml; mz /= ml; const ty = Math.atan2(mx, mz); let d = ty - io.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); io.yaw += d * Math.min(1, dt * 11); }
      let moved = 0;
      if (io.speed > 0.02) {
        const sx = Math.sin(io.yaw), sz = Math.cos(io.yaw), step = io.speed * dt;
        // in small steps, so a fast frame can't carry her through a thin wall
        const n = Math.max(1, Math.ceil(step / 0.08));
        for (let i = 0; i < n; i++) moved += stepBy(sx * step / n, sz * step / n) * step / n;
        // the camera swings slowly round behind her as she turns (not when she walks toward it)
        if (go && C.auto <= 0) { const side = Math.sin(io.yaw - (C.yaw + Math.PI)); const facing = Math.cos(io.yaw - (C.yaw + Math.PI)); if (facing > -0.3) C.yaw += Math.atan2(Math.sin(io.yaw + Math.PI - C.yaw), Math.cos(io.yaw + Math.PI - C.yaw)) * Math.min(1, dt * 0.45) * Math.abs(side) * (io.speed / SPEED.jog * 0.6 + 0.3); }
      }
      if (C.auto > 0) C.auto -= dt;
      io.moving = io.speed > 0.08 && moved > 0.0005; io.jog = io.speed > (SPEED.walk + SPEED.jog) / 2;
      const gy = P.walkH(io.px, io.py); io.y += (gy - io.y) * Math.min(1, dt * 14);
      // her model
      const p = pos();
      A.root.position.copy(p); A.root.rotation.set(0, io.yaw, 0);
      A.walkRun = io.jog;
      const rate = io.moving ? clamp(io.speed / (io.jog ? NATURAL.jog : NATURAL.walk), 0.6, 1.6) : 1;
      A.camera = cam; A.animate(0, io.moving ? 1 : 0, t, dt * rate);
      blob.position.set(p.x, io.y + 0.03, p.z);
      // the lamps nearest her light her
      const L = P.lamps.map((l) => ({ l, d: (l.x - p.x) ** 2 + (l.y - p.y - 1) ** 2 + (l.z - p.z) ** 2 })).sort((a, b) => a.d - b.d);
      near.forEach((lt, i) => { const q = L[i]; if (!q) { lt.intensity = 0; return; } lt.position.set(q.l.x, q.l.y, q.l.z); lt.color.setHex(q.l.c); lt.intensity = 1.5 * q.l.k; lt.distance = 8 + q.l.k * 2; });
      key.target.position.copy(p); key.position.copy(p).addScaledVector(md, 20);
      rim.target.position.copy(p); rim.position.set(p.x - Math.sin(C.yaw) * 10, p.y + 6, p.z - Math.cos(C.yaw) * 10);
      placeCamera(dt, false);
      fill.target.position.copy(p); fill.position.copy(cam.position);
      // a road out: say where it goes (the next place is its own page)
      const ex = P.exits.find((e) => io.px >= e.rect[0] - 6 && io.px <= e.rect[2] + 6 && io.py >= e.rect[1] - 6 && io.py <= e.rect[3] + 6);
      if (ex && ex !== exitShown && opt.toast) opt.toast(ex.label + ': coming next, a place of its own'); exitShown = ex || null;
      // walking into a keepsake's shimmer finds it
      for (const it of P.items) if (!it.got && Math.hypot(it.x - p.x, it.z - p.z) < 1.1 && Math.abs(it.y - io.y) < 1.5) { it.got = true; found[it.id] = 1; keep(); P.takeItem(it); if (opt.onItem) opt.onItem(it); }
      marker.position.set(p.x, 31, p.z);
      P.update(t, cam, p);
    }

    // ---- frame rate, and a lighter screen if the phone needs it ----
    const perf = { frames: 0, t0: performance.now(), fps: 0, ms: 0, slow: 0 };
    function measure(now) {
      perf.frames++;
      if (now - perf.t0 >= 1000) {
        perf.fps = perf.frames * 1000 / (now - perf.t0); perf.ms = 1000 / perf.fps; perf.frames = 0; perf.t0 = now;
        if (!TEST) {
          if (perf.fps < 27) { if (++perf.slow >= 2 && dpr > 1) { dpr = Math.max(1, dpr - 0.25); renderer.setPixelRatio(dpr); layout(); perf.slow = 0; } } else perf.slow = 0;
          if (perf.fps > 55 && dpr < DPR0) { dpr = Math.min(DPR0, dpr + 0.25); renderer.setPixelRatio(dpr); layout(); }
        }
        if (opt.onStats) opt.onStats(numbers());
      }
    }
    function numbers() { const i = renderer.info.render; return { fps: Math.round(perf.fps), ms: +perf.ms.toFixed(1), triangles: i.triangles, calls: i.calls, dpr, world: P.stats.triangles, io: ioDrawn() }; }

    let last = null, clock = 0;
    function frame(now) {
      const dt = last == null ? 0 : Math.min(0.05, (now - last) / 1000); last = now; clock += dt;
      tick(dt, clock); renderer.render(scene, guide.on ? top : cam); measure(now);
      requestAnimationFrame(frame);
    }
    window.addEventListener('resize', layout);
    layout(); placeCamera(0, true);
    P.precompile(renderer, cam);
    if (!TEST) requestAnimationFrame(frame);

    // the page's hooks, for headless stills and the checks (?test: the clock only moves when told)
    const api = {
      P, A, io, C, cam, renderer, guide: setGuide, numbers,
      step(sec, fps, draw) { const n = Math.max(1, Math.round(sec * (fps || 30))); for (let i = 0; i < n; i++) { clock += 1 / (fps || 30); tick(1 / (fps || 30), clock); } if (draw !== false) renderer.render(scene, guide.on ? top : cam); return numbers(); },
      render() { renderer.render(scene, guide.on ? top : cam); },
      setIo(px, py, yaw) { io.px = px; io.py = py; io.y = P.walkH(px, py); if (yaw != null) io.yaw = yaw; placeCamera(0, true); },
      setCam(yaw, pitch, dist) { if (yaw != null) C.yaw = yaw; C.pitch = pitch != null ? pitch : view.pitch; C.pitchSet = pitch != null; C.dist = dist != null ? dist : view.dist; C.auto = 99; placeCamera(0, true); },
      push(x, y, mag) { scripted = x == null ? null : { x, y, mag: mag == null ? 0.7 : mag }; },
      fits, items: P.items,
    };
    window.__w3d = api;
    return api;
  };
})(window);
