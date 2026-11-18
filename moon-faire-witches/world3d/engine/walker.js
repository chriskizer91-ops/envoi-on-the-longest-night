// walker.js: Moon Faire's Io walking a 3D place of Envoi, on a phone.
//   W3D.walk({ place, canvas, root })   builds the place (world.js), puts Io in it and runs it
//   api.switchTo(place, px, py, yaw)    on to another place on the same page (the zone pages, world3d/game/)
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
    const root = opt.root, cv = opt.canvas;
    let place = opt.place;   // let: a zone page walks on to other places (switchTo)
    // (the reskin job, November 17) The laptop is the main screen: there the picture is drawn at the screen's full sharpness
    // (up to twice over), textures keep their detail at a slant (16x), and surfaces get grain and relief (core.js). A phone
    // (a touch screen with no mouse) keeps the lighter settings. ?quality=high or ?quality=phone forces either.
    const QP = (location.search.match(/[?&]quality=(high|phone)/) || [])[1];
    const PHONE = QP ? QP === 'phone' : (window.matchMedia && matchMedia('(pointer: coarse)').matches && !matchMedia('(any-pointer: fine)').matches);
    W3D.quality = PHONE ? 'phone' : 'high';
    const DPR0 = TEST ? 1 : PHONE ? Math.min(window.devicePixelRatio || 1, 1.75) : Math.min(Math.max(window.devicePixelRatio || 1, 1), 2);
    let dpr = PHONE ? Math.min(DPR0, 1.5) : DPR0;
    const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: TEST });
    renderer.setPixelRatio(dpr); renderer.outputEncoding = THREE.sRGBEncoding; renderer.setClearColor(0x0a0b18, 1);
    const say = opt.say || (() => {});
    say('Building ' + place.name + '…');
    let P = await W3D.buildPlace(place, renderer);
    let scene = P.scene, M = P.M, placeKids = new Set(scene.children);   // the place's own; what's added after is the walker's

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
    let md = P.U.uMoonDir.value;
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
    // the camera starts south of her looking north, as the painting does, unless the place says otherwise (startYaw)
    const C = { yaw: place.startYaw || 0, pitch: 0.62, dist: 7.0, aim: 1.15, auto: 0, top: false };
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
    // ---- nothing built is ever seen through (the reskin job, November 17) ----
    // Before, a wall between the camera and Io thinned away, so houses went see-through. Now the camera keeps a clear line
    // to her instead: it looks along the line from her head to where it wants to be, and if a house, a roof, a wall or a deck
    // is in the way it comes in to just this side of it, or rises to look over. So the walls stay whole.
    const _head = new THREE.Vector3(), _q = new THREE.Vector3(), _d = new THREE.Vector3(), _r = new THREE.Vector3(), _u = new THREE.Vector3();
    // how far along the line from her head to `to` the camera can go before something built is in the way (0 to 1): the
    // line itself and four more a hand's width round it (so the camera never grazes a wall either), against the real walls
    // and roofs (world.js: sight), stopping a little short of the first
    function clearTo(head, to) {
      _d.copy(to).sub(head); const L = _d.length(); if (L < 0.01 || !P.sight) return 1;
      _r.set(_d.z, 0, -_d.x); if (_r.lengthSq() < 1e-6) _r.set(1, 0, 0); _r.normalize().multiplyScalar(0.3); _u.crossVectors(_d, _r).normalize().multiplyScalar(0.3);
      const ex = _d.x / L * 0.35, ey = _d.y / L * 0.35, ez = _d.z / L * 0.35;   // look a little past it, too
      let t = 1;
      for (const [a, b] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const tx = to.x + ex + _r.x * a + _u.x * b, ty = to.y + ey + _r.y * a + _u.y * b, tz = to.z + ez + _r.z * a + _u.z * b;
        const h = P.sight.hit(head.x, head.y, head.z, tx, ty, tz); if (h < t) t = h;
      }
      if (t >= 1) return 1;
      return clamp((t * (L + 0.35) - 0.4) / L, 0, 1);
    }
    function wantAt(aim, yaw, pitch, dist, out) {
      const cp = Math.cos(pitch); out.set(aim.x + Math.sin(yaw) * cp * dist, aim.y + Math.sin(pitch) * dist, aim.z + Math.cos(yaw) * cp * dist);
      const gy = P.terrain(M.px(out.x), M.py(out.z)) + 1.2; if (out.y < gy) out.y = gy;
      return out;
    }
    const _w = new THREE.Vector3(), _best = new THREE.Vector3(); let boxed = false;
    // (the last resort) is the point inside a wall, a house or a roof? As the camera's first check was (the Moonwell's wish)
    function insideSolid(v) {
      for (const s of P.camSolids || []) {
        if (s.thin || v.y < s.y0 - 0.25 || v.y > s.y1 + 0.25 || v.x < s.b[0] - 0.3 || v.x > s.b[2] + 0.3 || v.z < s.b[1] - 0.3 || v.z > s.b[3] + 0.3) continue;
        if (W3D.inPoly(s.p, v.x, v.z) || W3D.edgeDist(s.p, v.x, v.z) < 0.3) return true;
      }
      return false;
    }
    function placeCamera(dt, snap) {
      const p = pos(), ah = view.ahead || 0;
      const aimAt = (yaw) => new THREE.Vector3(p.x - Math.sin(yaw) * ah, p.y + C.aim, p.z - Math.cos(yaw) * ah);
      let aim = aimAt(C.yaw);
      const want = new THREE.Vector3();
      _head.set(p.x, p.y + 1.45, p.z);
      // where it wants to be. If the line to her isn't clear: first look from a little higher (over the wall); then swing
      // round to the nearest side that is clear (the view turns with it, so the thumb still walks her the way it looks);
      // then look from right above her; failing all, come in to this side of whatever is in the way
      let bestD = -1, bestClear = 0, bestYaw = C.yaw;
      const tryAt = (yaw, pitch, handicap) => {
        wantAt(aimAt(yaw), yaw, pitch, C.dist, _w);
        const t = clearTo(_head, _w), dClear = t * _w.distanceTo(_head);
        if (dClear - handicap > bestD) { bestD = dClear - handicap; bestClear = dClear; bestYaw = yaw; _best.copy(_head).addScaledVector(_d, t); }   // (_d: clearTo's line)
        return t >= 0.999;
      };
      let ok = tryAt(C.yaw, C.pitch, 0);
      if (!ok && !guide.on) {
        for (const up of [0.2, 0.4]) { if (C.pitch + up > 1.25) break; if (tryAt(C.yaw, C.pitch + up, up * 3)) { ok = true; break; } }
        if (!ok && bestClear < C.dist * 0.5) for (const dy of [0.5, -0.5, 1.0, -1.0, 1.6, -1.6, 2.3, -2.3, Math.PI]) { if (tryAt(C.yaw + dy, C.pitch, 1.2 + Math.abs(dy) * 0.4) || tryAt(C.yaw + dy, Math.min(1.25, C.pitch + 0.3), 2.0 + Math.abs(dy) * 0.4)) { ok = true; break; } }
        if (!ok && bestClear < C.dist * 0.45) for (const pt of [1.0, 1.2, 1.4]) { if (pt <= C.pitch + 0.4) continue; if (tryAt(C.yaw, pt, 1.0)) { ok = true; break; } }
      }
      // The last resort: she is boxed in (under a hull on its cradle, inside a shed, under a low deck), with no clear line
      // to her longer than a couple of metres from anywhere. Then the camera goes where it wanted to, as it used to, and
      // what stands between thins away, as it used to (world.js: cutw). Nowhere else is anything built seen through.
      boxed = !guide.on && !ok && bestClear < (boxed ? 2.6 : 2.0);
      P.U.uCutW.value = boxed ? 1 : 0;
      if (boxed) {
        wantAt(aim, C.yaw, C.pitch, C.dist, want);
        if (insideSolid(want)) { const d = want.clone().sub(aim); for (let t = 0.92; t > 0.12; t -= 0.06) { const v = aim.clone().addScaledVector(d, t); if (!insideSolid(v)) { want.copy(v); break; } } }
      } else {
        want.copy(_best);
        if (bestYaw !== C.yaw) { const dy = bestYaw - C.yaw; C.yaw += dy * (snap ? 1 : Math.min(1, dt * 2.5)); C.auto = Math.max(C.auto || 0, 1.2); aim = aimAt(C.yaw); }
      }
      const k = snap ? 1 : 1 - Math.exp(-dt * 7);
      camPos.lerp(want, k); camAim.lerp(aim, snap ? 1 : 1 - Math.exp(-dt * 10));
      // on its way there it never cuts a corner through anything either
      if (!boxed) { const t2 = clearTo(_head, camPos); if (t2 < 0.999) camPos.copy(_head).addScaledVector(_d, t2); }   // (_d: clearTo's line from her head to camPos)
      // close in, it looks at her rather than past her
      const near = boxed ? 0 : 1 - clamp((camPos.distanceTo(_head) - 1.5) / 3, 0, 1);
      cam.position.copy(camPos); cam.lookAt(_q.copy(camAim).lerp(_head, near * 0.85));
    }

    // ---- the guide: the painting from straight above, laid over the 3D ----
    const top = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 400);
    const guide = { on: false };
    let pW = M.W * M.SX, pH = M.H * M.SZ;
    let paintTex = new THREE.TextureLoader().load(place.paintingSrc);
    const paintPlane = new THREE.Mesh(new THREE.PlaneGeometry(pW, pH), new THREE.MeshBasicMaterial({ map: paintTex, transparent: true, opacity: 0.55, depthTest: false, depthWrite: false }));
    paintPlane.rotation.x = -Math.PI / 2; paintPlane.position.set(0, 30, 0); paintPlane.renderOrder = 20; paintPlane.visible = false; scene.add(paintPlane);
    // the "where can she walk" view: the walking grid laid over the 3D from above, green where she can stand
    let walkPlane = null;
    function walkView(on) {
      if (on && !walkPlane) {
        const [a, b, c, d] = P.walkRect, t = new THREE.CanvasTexture(P.walkPic()); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.LinearFilter; t.generateMipmaps = false;
        walkPlane = new THREE.Mesh(new THREE.PlaneGeometry(M.x(c) - M.x(a), M.z(d) - M.z(b)), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthTest: false, depthWrite: false }));
        walkPlane.rotation.x = -Math.PI / 2; walkPlane.position.set((M.x(a) + M.x(c)) / 2, 30.5, (M.z(b) + M.z(d)) / 2); walkPlane.renderOrder = 20; scene.add(walkPlane);
      }
      if (walkPlane) walkPlane.visible = !!on;
    }
    const marker = new THREE.Mesh(new THREE.RingGeometry(0.7, 1.05, 24), new THREE.MeshBasicMaterial({ color: 0xffe6a0, depthTest: false, transparent: true }));
    marker.rotation.x = -Math.PI / 2; marker.renderOrder = 21; marker.visible = false; scene.add(marker);
    function fitTop() {
      const W = root.clientWidth, H = root.clientHeight, asp = W / H;
      let hw = pW / 2 * 1.03, hh = hw / asp; if (hh < pH / 2 * 1.03) { hh = pH / 2 * 1.03; hw = hh * asp; }
      top.left = -hw; top.right = hw; top.top = hh; top.bottom = -hh; top.position.set(0, 120, 0); top.up.set(0, 0, -1); top.lookAt(0, 0, 0); top.updateProjectionMatrix();
    }
    let fog0 = [P.U.uFogNear.value, P.U.uFogFar.value];
    function setGuide(on, paint) { guide.on = on; paintPlane.visible = on && paint !== false && paint !== 'walk'; marker.visible = on && paint !== false; walkView(on && paint === 'walk'); P.U.uFogNear.value = on ? 1e4 : fog0[0]; P.U.uFogFar.value = on ? 2e4 : fog0[1]; if (opt.onGuide) opt.onGuide(on); if (on) fitTop(); }

    // ---- the thumb and the keys ----
    const ring = opt.ring, dot = opt.dot;
    const input = { x: 0, y: 0, mag: 0, keys: {}, move: null, look: null };
    const RAD = 58;
    cv.addEventListener('pointerdown', (e) => {
      const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      // a mouse only turns the camera, anywhere on the screen (the keys walk her): the thumb's ring is for fingers (Chris,
      // November 17: on the laptop the joystick popping up made it harder to move about)
      if (e.pointerType !== 'mouse' && x < r.width / 2 && !input.move) { input.move = { id: e.pointerId, x0: x, y0: y }; input.x = input.y = input.mag = 0; if (ring) { ring.style.display = 'block'; ring.style.left = x + 'px'; ring.style.top = y + 'px'; dot.style.transform = 'translate(-50%,-50%)'; } }
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
    // The keys (Chris, November 17): a direction key walks her; tapped twice quickly and held, she runs, and keeps running
    // while any direction key is down; Shift is a sprint, faster than the run. F: the Flipbook look on and off.
    const MOVE_KEYS = { arrowleft: 1, arrowright: 1, arrowup: 1, arrowdown: 1, a: 1, d: 1, w: 1, s: 1 };
    const run = { on: false, key: null, t: -1e9 };
    const anyMoveKey = () => Object.keys(MOVE_KEYS).some((k) => input.keys[k]);
    window.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      if (MOVE_KEYS[k] && !e.repeat && !input.keys[k]) { const now = performance.now(); if (run.key === k && now - run.t < 340) run.on = true; run.key = k; run.t = now; }
      if (k === 'f' && !e.repeat && !e.ctrlKey && !e.metaKey && !e.altKey) setLook({ flip: !look.flip });
      if (MOVE_KEYS[k] && k.startsWith('arrow')) e.preventDefault();
      input.keys[k] = true;
    });
    window.addEventListener('keyup', (e) => { input.keys[e.key.toLowerCase()] = false; if (!anyMoveKey()) run.on = false; });
    window.addEventListener('blur', () => { input.keys = {}; run.on = false; });
    const keyMove = () => {
      const k = input.keys; let x = 0, y = 0;
      if (k.arrowleft || k.a) x -= 1; if (k.arrowright || k.d) x += 1; if (k.arrowup || k.w) y -= 1; if (k.arrowdown || k.s) y += 1;
      const L = Math.hypot(x, y); return L ? { x: x / L, y: y / L, mag: k.shift ? 1.3 : run.on ? 1 : 0.6 } : null;
    };

    // ---- each frame ----
    const NATURAL = { walk: 0.62 * 1.7, jog: 1.25 * 1.7 };   // her own steps' speeds, in metres a second (moon-io-walker.js)
    const SPEED = { walk: 1.3, jog: 3.0, sprint: 5.2 };   // (sprint: the keys' Shift)
    let exitShown = null, scripted = null, busy = false;   // busy: between two places (switchTo)
    // the keepsakes found so far (kept on the phone between visits; not in a test run)
    const FOUND_KEY = 'envoi3d-found';
    let found = {}; if (!TEST) try { found = JSON.parse(localStorage.getItem(FOUND_KEY) || '{}') || {}; } catch (e) { found = {}; }
    for (const it of P.items) if (found[it.id]) { it.got = true; P.takeItem(it); }
    const keep = () => { if (!TEST) try { localStorage.setItem(FOUND_KEY, JSON.stringify(found)); } catch (e) { /* the phone won't keep it: fine */ } };
    function tick(dt, t) {
      if (busy) return;
      // where she wants to go, from the thumb (or the keys), turned by the camera
      let ix = input.x, iy = input.y, mag = input.mag; const km = keyMove(); if (km && !input.move) { ix = km.x; iy = km.y; mag = km.mag; }
      if (scripted) { ix = scripted.x; iy = scripted.y; mag = scripted.mag; }
      const fx = -Math.sin(C.yaw), fz = -Math.cos(C.yaw), rx = Math.cos(C.yaw), rz = -Math.sin(C.yaw);
      let mx = rx * ix + fx * -iy, mz = rz * ix + fz * -iy; const ml = Math.hypot(mx, mz);
      const go = mag > 0.14 && ml > 0;
      const jog = mag > 0.82, want = go ? (mag > 1.15 ? SPEED.sprint : jog ? SPEED.jog : SPEED.walk * clamp(mag / 0.65, 0.45, 1)) : 0;
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
      const rate = io.moving ? clamp(io.speed / (io.jog ? NATURAL.jog : NATURAL.walk), 0.6, 2.3) : 1;
      A.camera = cam; A.animate(0, io.moving ? 1 : 0, t, dt * rate);
      blob.position.set(p.x, io.y + 0.03, p.z);
      // the lamps nearest her light her
      const L = P.lamps.map((l) => ({ l, d: (l.x - p.x) ** 2 + (l.y - p.y - 1) ** 2 + (l.z - p.z) ** 2 })).sort((a, b) => a.d - b.d);
      near.forEach((lt, i) => { const q = L[i]; if (!q) { lt.intensity = 0; return; } lt.position.set(q.l.x, q.l.y, q.l.z); lt.color.setHex(q.l.c); lt.intensity = 1.5 * q.l.k; lt.distance = 8 + q.l.k * 2; });
      key.target.position.copy(p); key.position.copy(p).addScaledVector(md, 20);
      rim.target.position.copy(p); rim.position.set(p.x - Math.sin(C.yaw) * 10, p.y + 6, p.z - Math.cos(C.yaw) * 10);
      placeCamera(dt, false);
      fill.target.position.copy(p); fill.position.copy(cam.position);
      // a road out: say where it goes (the next place is its own page); on a zone page, the page's own check (opt.onFrame)
      // takes the roads out instead, each frame
      const ex = P.exits.find((e) => io.px >= e.rect[0] - 6 && io.px <= e.rect[2] + 6 && io.py >= e.rect[1] - 6 && io.py <= e.rect[3] + 6);
      if (opt.onFrame) opt.onFrame(dt, ex || null);
      else { if (ex && ex !== exitShown && opt.toast) opt.toast(ex.label + ': coming next, a place of its own'); exitShown = ex || null; }
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

    // ---- the two looks (Chris, November 17): as painted, and the Flipbook look of the 3D models and the battle
    // (moon-faire-witches/src/flipbook.js, unchanged): the 3D drawn on a grid of rows down the screen, every pixel taking
    // the nearest of 64 colours (32 from the place's own painting, 32 of the witches'), enlarged with hard pixels. The
    // fineness is how many rows: Chris likes it very fine, so it starts near the top. A small button beside the map's
    // opens the two settings; they are kept on the device (envoi3d-look). ?look=flipbook&rows=540 sets them from the address.
    const LOOK_KEY = 'envoi3d-look', ROWS = [160, 720];
    const look = { flip: false, rows: 600 };
    if (!TEST) try { const q = JSON.parse(localStorage.getItem(LOOK_KEY) || 'null'); if (q && typeof q === 'object') { look.flip = !!q.flip; if (+q.rows) look.rows = clamp(+q.rows, ROWS[0], ROWS[1]); } } catch (e) { /* as painted */ }
    { const m = location.search.match(/[?&]look=(flipbook|painted)/); if (m) look.flip = m[1] === 'flipbook'; const r = location.search.match(/[?&]rows=(\d+)/); if (r) look.rows = clamp(+r[1], ROWS[0], ROWS[1]); }
    let FB = null;
    if (G.makeFlipbook) {
      FB = G.makeFlipbook(renderer, { rows: look.rows });
      // her own materials are three.js's, which write to the Flipbook's small picture in its colour space: the same as the screen's
      const srt = renderer.setRenderTarget.bind(renderer);
      renderer.setRenderTarget = (tg, a, b) => { if (tg && tg.texture && tg.texture.encoding !== THREE.sRGBEncoding) tg.texture.encoding = THREE.sRGBEncoding; return srt(tg, a, b); };
    }
    // the place's own colours, from its painting (flipbook.js takes them the first time it is handed a painting)
    function lookColours() {
      if (!FB || !place.paintingSrc) return;
      const im = new Image(); im.onload = () => { try { const c = document.createElement('canvas'); c.width = c.height = 8; FB.paint(c.getContext('2d'), im, 0, 0, im.naturalWidth, im.naturalHeight, 8, 8); } catch (e) { /* the witches' colours */ } }; im.src = place.paintingSrc;
    }
    lookColours();
    let lookUI = null;
    function setLook(q) {
      if (q.flip != null) look.flip = !!q.flip && !!FB;
      if (q.rows != null) look.rows = clamp(Math.round(+q.rows) || 600, ROWS[0], ROWS[1]);
      if (!TEST) try { localStorage.setItem(LOOK_KEY, JSON.stringify(look)); } catch (e) { /* kept while the page is open */ }
      if (lookUI) lookUI.show();
    }
    function drawFrame() {
      if (guide.on || !look.flip || !FB) { renderer.render(scene, guide.on ? top : cam); return; }
      // never finer than the screen can show: a row is at least a pixel and a half of the canvas
      FB.on = true; FB.rows = Math.min(look.rows, Math.max(ROWS[0], Math.floor(cv.height / 1.5)));
      FB.render(scene, cam); renderer.setClearColor(0x0a0b18, 1);
    }
    // the settings: one small round button left of the map's, and a small panel under it (made here, so every page has it)
    if (FB && root && !TEST) {
      const st = document.createElement('style');
      st.textContent = '#lookbtn{position:absolute;top:calc(12px + env(safe-area-inset-top,0px));right:calc(68px + env(safe-area-inset-right,0px));z-index:4;appearance:none;width:46px;height:46px;border-radius:23px;border:1px solid rgba(214,222,255,.45);background:rgba(14,14,36,.62);display:grid;place-items:center;padding:0;cursor:pointer}' +
        '#lookbtn svg{width:22px;height:22px}#lookbtn.on{background:rgba(70,60,130,.8);border-color:rgba(200,190,255,.75)}' +
        '#lookpanel{position:absolute;top:calc(66px + env(safe-area-inset-top,0px));right:calc(12px + env(safe-area-inset-right,0px));z-index:5;display:none;width:232px;box-sizing:border-box;padding:12px 14px;border-radius:16px;border:1px solid rgba(214,222,255,.4);background:rgba(14,12,34,.9);color:#ece8ff;font:15px/1.3 "Atkinson Hyperlegible",system-ui,sans-serif}' +
        '#lookpanel.open{display:block}#lookpanel label{display:flex;align-items:center;justify-content:space-between;gap:10px;cursor:pointer}' +
        '#lookpanel input[type=checkbox]{width:20px;height:20px;accent-color:#a895ff}#lookpanel .fine{margin-top:12px;display:none}#lookpanel.flip .fine{display:block}' +
        '#lookpanel input[type=range]{width:100%;margin:6px 0 0;accent-color:#a895ff}#lookpanel small{display:flex;justify-content:space-between;color:#b8b4e0;font-size:12px;margin-top:2px}';
      document.head.appendChild(st);
      const btn = document.createElement('button'); btn.id = 'lookbtn'; btn.setAttribute('aria-label', 'The look: settings');
      btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="#eee8ff" stroke-width="1.7" stroke-linecap="round"><path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2.2"/><circle cx="8" cy="17" r="2.2"/></svg>';
      const pan = document.createElement('div'); pan.id = 'lookpanel';
      pan.innerHTML = '<label>Flipbook look <input type="checkbox" id="lookflip"></label><div class="fine"><span>Fineness</span><input type="range" id="lookrows" min="' + ROWS[0] + '" max="' + ROWS[1] + '" step="20"><small><span>chunky</span><span>very fine</span></small></div>';
      root.appendChild(btn); root.appendChild(pan);
      const cb = pan.querySelector('#lookflip'), rg = pan.querySelector('#lookrows');
      lookUI = { show() { cb.checked = look.flip; rg.value = look.rows; pan.classList.toggle('flip', look.flip); btn.classList.toggle('on', look.flip); } };
      btn.addEventListener('click', () => pan.classList.toggle('open'));
      cb.addEventListener('change', () => setLook({ flip: cb.checked }));
      rg.addEventListener('input', () => setLook({ rows: rg.value }));
      cv.addEventListener('pointerdown', () => pan.classList.remove('open'));
      lookUI.show();
    }

    let last = null, clock = 0;
    function frame(now) {
      const dt = last == null ? 0 : Math.min(0.05, (now - last) / 1000); last = now; clock += dt;
      if (!busy) { tick(dt, clock); drawFrame(); measure(now); }
      requestAnimationFrame(frame);
    }
    window.addEventListener('resize', layout);
    layout(); placeCamera(0, true);
    P.precompile(renderer, cam);
    if (!TEST) requestAnimationFrame(frame);

    // ---- on to another place, on the same page (the zone pages, world3d/game/): the old place is taken down whole
    // (P.dispose) and the next built in its stead. The renderer, Io and her lights, the camera, the thumb, the keepsakes
    // found and the page all stay. Io stands at (px, py), or the nearest spot she fits, facing yaw, the camera behind her ----
    function nearestFit(px, py) {
      if (fits(px, py)) return [px, py];
      for (let r = 4; r <= 160; r += 4) for (let i = 0, n = Math.ceil(r * 1.5); i < n; i++) { const a = i / n * Math.PI * 2, x = px + Math.cos(a) * r, y = py + Math.sin(a) * r; if (fits(x, y)) return [x, y]; }
      return place.start.slice();
    }
    // everything the place has, sent to the screen's memory at once (under the zone page's fade), so nothing stutters in
    // as she turns: drawn once into a single pixel, every mesh shown and none culled
    function warm() {
      const was = [];
      for (const k of placeKids) k.traverse((o) => { if (o.isMesh) { was.push([o, o.visible, o.frustumCulled]); o.visible = true; o.frustumCulled = false; } });
      renderer.setScissorTest(true); renderer.setScissor(0, 0, 1, 1); renderer.render(scene, cam); renderer.setScissorTest(false);
      for (const [o, v, f] of was) { o.visible = v; o.frustumCulled = f; }
    }
    async function switchTo(next, px, py, yaw) {
      busy = true; setGuide(false);
      const env = scene.environment, mine = scene.children.filter((o) => !placeKids.has(o) && o !== walkPlane);
      for (const o of mine) scene.remove(o);
      if (walkPlane) { walkPlane.geometry.dispose(); walkPlane.material.map.dispose(); walkPlane.material.dispose(); walkPlane = null; }
      paintTex.dispose(); scene.environment = null; P.dispose();
      api.teardown = Object.assign({}, renderer.info.memory);   // what's left with no place at all (the checks read it)
      place = next; P = await W3D.buildPlace(place, renderer);
      scene = P.scene; M = P.M; placeKids = new Set(scene.children);
      scene.environment = env; for (const o of mine) scene.add(o);
      md = P.U.uMoonDir.value; fog0 = [P.U.uFogNear.value, P.U.uFogFar.value];
      cam.far = (place.night && place.night.far) || 800; cam.updateProjectionMatrix();
      pW = M.W * M.SX; pH = M.H * M.SZ; paintTex = new THREE.TextureLoader().load(place.paintingSrc); lookColours();
      paintPlane.material.map = paintTex; paintPlane.geometry.dispose(); paintPlane.geometry = new THREE.PlaneGeometry(pW, pH);
      for (const it of P.items) if (found[it.id]) { it.got = true; P.takeItem(it); }
      exitShown = null;
      const at = nearestFit(px, py); io.px = at[0]; io.py = at[1]; io.y = P.walkH(io.px, io.py); if (yaw != null) io.yaw = yaw;
      C.yaw = io.yaw + Math.PI; C.auto = 0; placeCamera(0, true);
      P.precompile(renderer, cam); warm();
      api.P = P; api.items = P.items; perf.frames = 0; perf.t0 = performance.now(); busy = false;
      return P;
    }

    // the page's hooks, for headless stills and the checks (?test: the clock only moves when told)
    const api = {
      P, A, io, C, cam, renderer, guide: setGuide, numbers, switchTo, warm, nearestFit, isBusy: () => busy,
      step(sec, fps, draw) { const n = Math.max(1, Math.round(sec * (fps || 30))); for (let i = 0; i < n; i++) { clock += 1 / (fps || 30); tick(1 / (fps || 30), clock); } if (draw !== false && !busy) drawFrame(); return numbers(); },
      render() { if (!busy) drawFrame(); }, setLook, look,
      setIo(px, py, yaw) { io.px = px; io.py = py; io.y = P.walkH(px, py); if (yaw != null) io.yaw = yaw; placeCamera(0, true); },
      setCam(yaw, pitch, dist) { if (yaw != null) C.yaw = yaw; C.pitch = pitch != null ? pitch : view.pitch; C.pitchSet = pitch != null; C.dist = dist != null ? dist : view.dist; C.auto = 99; placeCamera(0, true); },
      push(x, y, mag) { scripted = x == null ? null : { x, y, mag: mag == null ? 0.7 : mag }; },
      fits, items: P.items,
    };
    window.__w3d = api;
    return api;
  };
})(window);
