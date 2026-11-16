// kit.js: a small battle stage for the Moon Faire witches' pages, made of Envoi's own parts: an arena (src/fx/arena.js and a
// place from src/stage/arena-*.js: Chris's painting far off, drawn sharp behind, live ground in front), Envoi's battle effects
// (src/fx/battle-fx.js, src/fx/io-spells.js) and sound (src/battle/sound.js), and the battle screen's camera rules
// (src/battle/screen.js: a shot is a crop of the arena's locked frame, never zoomed past half as far again as its widest).
// It has no rules, turns or menus: a page tells its actors what to do. three.js r128 (global THREE).
//   const K = makeKit({ stage, paint, gl, arena: 'river-glade', ui: () => panelHeight, test })
//   K.actor(key, model, { home: [x, z], tall, shadow, yawBias, side })  -> a fighter (pos, home, yaw, m ...)
//   K.wait(s), K.until(fn), K.untilP(model, fraction), K.moveTo(a, x, z, speed), K.faceTo(a, b), K.goHome(a)
//   K.shotAt(p, zoom), K.shotBoth(a, b, zoom), K.shotFit(points, zoom), K.rest()  (the whole group)
//   K.hurt(f, n, { big, heal, from }), K.num(f, text, kind), K.shake(px), K.hitStop(s)
//   K.ui.banner(text), K.ui.cap(text), K.ui.flash(color, a, s), K.ui.cinematic(on), K.ui.vignette(a)
//   K.setLook('mf' | 'envoi'): the Moon Faire witches' own light (sRGB, a soft studio reflected in them) or Envoi's
function makeKit(cfg) {
  'use strict';
  const TAU = Math.PI * 2, clamp = (v, a, b) => (v < a ? a : v > b ? b : v), rnd = (a, b) => a + Math.random() * (b - a);
  const V = () => new THREE.Vector3();
  const ARENA = window.ARENAS[cfg.arena || 'river-glade'];
  const AF = window.makeArenaField(ARENA);
  const IW = AF.frame[0], IH = AF.frame[1], FOV = AF.camera.fov;
  const DPR = Math.min(window.devicePixelRatio || 1, 2), SHARP = cfg.sharp || 0.75;
  const REDUCED = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const stage = cfg.stage, paintCv = cfg.paint, paintCtx = paintCv.getContext('2d');
  const fullCam = AF.camera.clone(); fullCam.updateMatrixWorld(); fullCam.updateProjectionMatrix();
  const camera = fullCam.clone();
  const tmpV = V();
  const toPx = (p) => { tmpV.copy(p).project(fullCam); return [(tmpV.x + 1) / 2 * IW, (1 - tmpV.y) / 2 * IH]; };
  const ZK = AF.ppm / 54 * 1.2, ZMAX = cfg.zmax || 1.5, ZP = cfg.zoom || 1;   // the battle screen keeps 1.5, so the painting is never blown up; a page may allow more

  // ---------- the clock: waits resolve as the fight's time runs, so a hit-stop holds everything ----------
  const clock = { t: 0, stop: 0, scale: 1 };
  const waits = [];
  const wait = (sec) => new Promise((res) => waits.push({ at: clock.t + sec, res }));
  const until = (fn) => new Promise((res) => waits.push({ fn, res }));
  const untilP = (m, u) => until(() => m.progress < 0 || m.progress >= u);
  const untilT = (m, sec) => until(() => !m.busy || (m.time || 0) >= sec);
  function tickWaits() { for (let i = waits.length - 1; i >= 0; i--) { const w = waits[i]; if (w.fn ? w.fn() : clock.t >= w.at) { waits.splice(i, 1); w.res(); } } }
  const hitStop = (sec) => { if (!REDUCED) clock.stop = Math.max(clock.stop, sec); };

  // ---------- the camera: every shot is a point on the painting plus a zoom (screen.js) ----------
  const view = { w: 1, h: 1, uiH: 0, s2: 1 };
  const cam = { cx: IW * 0.4, cy: IH * 0.62, s: 1, tx: IW * 0.4, ty: IH * 0.62, ts: 1, k: 3 };
  const shk = { amp: 0, x: 0, y: 0 };
  let renderer = null, lastTf = '';
  const paintImg = new Image();
  function layout() {
    view.w = stage.clientWidth; view.h = stage.clientHeight; view.uiH = cfg.ui ? cfg.ui() : 0;
    if (renderer) renderer.setSize(view.w, view.h);
    paintCv.width = Math.round(view.w * DPR); paintCv.height = Math.round(view.h * DPR); lastTf = '';
  }
  function shot(cx, cy, s, k) { cam.tx = cx; cam.ty = cy; cam.ts = s; cam.k = k || 3; }
  // ZP: a page's own push in (the witches' pages come in closer than a fight does, as far as both still fit across)
  function shotAt(p, s, k, lift) { const q = toPx(tmpV.set(p.x, lift === undefined ? 1.0 : lift, p.z)); shot(q[0], q[1], (s || 1.4) * ZP / ZK, k); }
  function shotBoth(a, b, zoom, k) {
    const pa = toPx(tmpV.set(a.x, 1.1, a.z)), pb = toPx(tmpV.set(b.x, 1.1, b.z));
    const needW = Math.abs(pa[0] - pb[0]) + 175 * ZK, needH = 250 * ZK, availH = Math.max(120, view.h - view.uiH - 50);
    shot((pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2 - 18, Math.min((view.w - 16) / needW * Math.min(1, zoom || 1), availH / needH * (zoom || 1) * ZP), k);
  }
  function shotFit(pts, zoom, k) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const p of pts) { const q = toPx(tmpV.set(p.x, p.y || 0, p.z)); x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); }
    const availH = Math.max(120, view.h - view.uiH - 40), s = Math.min((view.w - 16) / (x1 - x0 + 120 * ZK), availH / (y1 - y0 + 70 * ZK)) * (zoom || 1);
    let cy = (y0 + y1) / 2; const sMin = Math.max(view.w / IW, view.h / IH), sE = Math.min(Math.max(s, sMin), sMin * ZMAX); if ((y1 - y0 + 70 * ZK) * sE > availH) cy = y1 + 20 * ZK - availH / 2 / sE;
    shot((x0 + x1) / 2, cy, s, k);
  }
  const ptsOf = (list) => { const pts = []; for (const f of list) pts.push({ x: f.pos.x, y: 0, z: f.pos.z }, { x: f.pos.x, y: f.tall, z: f.pos.z }); return pts; };
  const rest = (k) => shotFit(ptsOf(actors.filter((a) => a.shown)), 1, k || 2);
  function applyCam(rdt) {
    const k = REDUCED ? 1 : 1 - Math.exp(-rdt * cam.k);
    cam.cx += (cam.tx - cam.cx) * k; cam.cy += (cam.ty - cam.cy) * k; cam.s += (cam.ts - cam.s) * k;
    const sMin = Math.max(view.w / IW, view.h / IH), S2 = Math.min(Math.max(sMin, cam.s), sMin * ZMAX);
    const midY = (view.h - view.uiH) / 2 + 20;
    shk.amp *= Math.exp(-rdt * 7); shk.x = (Math.random() - 0.5) * 2 * shk.amp; shk.y = (Math.random() - 0.5) * 2 * shk.amp;
    let ox = cam.cx * S2 - view.w / 2 + shk.x, oy = cam.cy * S2 - midY + shk.y;
    ox = clamp(ox, 0, IW * S2 - view.w); oy = clamp(oy, 0, IH * S2 - view.h);
    ox = Math.round(ox * DPR) / DPR; oy = Math.round(oy * DPR) / DPR;
    camera.setViewOffset(IW * S2, IH * S2, ox, oy, view.w, view.h); view.s2 = S2;
    const tf = ox + ',' + oy + ',' + S2.toFixed(5) + ',' + view.w + ',' + view.h;
    if (tf !== lastTf && paintImg.complete && paintImg.naturalWidth) {
      paintCtx.imageSmoothingEnabled = true; paintCtx.imageSmoothingQuality = 'high';
      paintCtx.drawImage(paintImg, ox / S2, oy / S2, view.w / S2, view.h / S2, 0, 0, paintCv.width, paintCv.height);
      lastTf = tf;
    }
  }
  const shake = (px) => { if (!REDUCED) shk.amp = Math.max(shk.amp, px); };
  function toScreen(p) { tmpV.copy(p).project(camera); return [(tmpV.x + 1) / 2 * view.w, (1 - tmpV.y) / 2 * view.h, tmpV.z]; }

  // ---------- the scene ----------
  renderer = new THREE.WebGLRenderer({ canvas: cfg.gl, alpha: true, antialias: true, preserveDrawingBuffer: !!cfg.test });
  renderer.setPixelRatio(DPR * SHARP); renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  scene.add(AF.root); scene.fog = AF.fog;
  const FX = window.makeBattleFX(), IOS = window.makeIoSpells ? window.makeIoSpells(FX) : null;
  scene.add(FX.grp);
  const SND = window.makeBattleSound ? window.makeBattleSound() : { init() {}, sfx: new Proxy({}, { get: () => () => {} }) };
  // Envoi's lights, following the arena's night (a cloud over the moon, a storm)
  const ENV = new THREE.Group(); scene.add(ENV);
  const hemi = new THREE.HemisphereLight(0x756aa8, 0x33262f, 1.1), moon = new THREE.DirectionalLight(0xb8c0ff, 0.62), fill = new THREE.DirectionalLight(0xffdcc0, 0.42);
  moon.position.set(-5, 9, -12); fill.position.set(2, 5, 10); ENV.add(hemi, moon, fill);
  // the witches' own look (Moon Faire's stage, src/stage.js): drawn as on their own pages, in sRGB, with a soft studio in
  // their shine, while the arena, the foes and the effects keep Envoi's look. The renderer stays as Envoi's; each witch
  // material turns its own colour to sRGB at its last step (WITCH.srgb), so nothing else in the fight changes
  const WITCH = { srgb: true, env: cfg.witchEnv || 1.6 };
  let studio = null;
  (function env() {
    const es = new THREE.Scene(), g = new THREE.SphereGeometry(10, 32, 16), col = [];
    const top = new THREE.Color(0.26, 0.23, 0.38), mid = new THREE.Color(0.10, 0.08, 0.13), bot = new THREE.Color(0.03, 0.022, 0.035), c = new THREE.Color();
    for (let i = 0; i < g.attributes.position.count; i++) { const y = g.attributes.position.getY(i) / 10; if (y > 0) c.copy(mid).lerp(top, Math.pow(y, 0.7)); else c.copy(mid).lerp(bot, Math.pow(-y, 0.5)); col.push(c.r, c.g, c.b); }
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    es.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
    const panel = (x, y, z, w, h, r, gg, b) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(r, gg, b), side: THREE.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 1, 0); es.add(m); };
    panel(4, 6, 5, 4, 3, 5.0, 4.2, 3.4); panel(-6, 3, 2, 2, 4, 0.8, 0.9, 1.6); panel(-2, 5, -7, 5, 2.5, 2.4, 1.1, 3.6); panel(6, 1.5, -3, 1.5, 3, 1.4, 0.7, 1.2);
    const pm = new THREE.PMREMGenerator(renderer); studio = pm.fromScene(es, 0.03).texture; pm.dispose();
  })();
  // a light that follows whatever spell is brightest near a witch (one light, never added or removed while playing)
  const spellLight = new THREE.PointLight(0xb070ff, 0, 7, 2); spellLight.position.set(0, -50, 0); scene.add(spellLight);
  let look = cfg.look || 'mf';
  const witchMats = [], allWitch = [];
  function witchMat(q) {
    if (allWitch.includes(q)) return; allWitch.push(q);
    if ('envMap' in q && (q.isMeshStandardMaterial || q.isMeshPhysicalMaterial)) { witchMats.push(q); q.userData.env0 = q.envMapIntensity; }
    const prev = q.onBeforeCompile, prevKey = q.customProgramCacheKey;
    q.onBeforeCompile = function (sh, r) { if (prev) prev.call(this, sh, r); if (WITCH.srgb) sh.fragmentShader = sh.fragmentShader.replace('#include <encodings_fragment>', 'gl_FragColor = LinearTosRGB( gl_FragColor );'); };
    q.customProgramCacheKey = function () { return (prevKey ? prevKey.call(this) : '') + (WITCH.srgb ? '|srgb' : '|lin'); };
  }
  function setLook(name) {
    look = name === 'envoi' ? 'envoi' : 'mf';
    WITCH.srgb = look === 'mf';
    for (const m of witchMats) { m.envMap = look === 'mf' ? studio : null; m.envMapIntensity = (m.userData.env0 == null ? 1 : m.userData.env0) * WITCH.env; }
    for (const m of allWitch) m.needsUpdate = true;
    return look;
  }

  // ---------- actors ----------
  const radialTex = (inner, mid, outer) => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), gr = x.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, inner); gr.addColorStop(0.45, mid); gr.addColorStop(1, outer || 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); };
  const shadowTex = radialTex('rgba(10,4,16,0.62)', 'rgba(10,4,16,0.3)', 'rgba(10,4,16,0)');
  function disc(r) { const m = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 2), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.renderOrder = 1; scene.add(m); return m; }
  const actors = [];
  const faceYaw = (a, b) => Math.atan2(b.x - a.x, b.z - a.z);
  function actor(key, m, o) {
    o = o || {};
    const home = { x: o.home[0], z: o.home[1], yaw: 0 };
    const a = { key, m, pos: { x: home.x, z: home.z }, home, yaw: 0, tyaw: 0, phase: 0, wb: 0, target: null, speed: 0, res: null, tall: o.tall || 2, side: o.side || 'hero',
      yawBias: o.yawBias || 0, off: 0, offV: 0, kick: null, shown: o.shown !== false, look: o };
    a.shadow = disc(o.shadow || 0.6); a.shadow.scale.set(1, 0.8, 1);
    scene.add(m.root); if (m.fx) scene.add(m.fx);
    if (o.witch) { m.root.traverse((x) => { if (x.material) for (const q of (Array.isArray(x.material) ? x.material : [x.material])) witchMat(q); }); setLook(look); }
    m.root.visible = a.shown;
    actors.push(a);
    return a;
  }
  function restYaw(a) { const foes = actors.filter((f) => f.side !== a.side && f.shown && f.side !== 'summon'); const t = foes[0]; return t ? faceYaw(a.pos, t.pos) + a.yawBias : a.home.yaw; }
  function settle() { for (const a of actors) { a.home.yaw = restYaw(a); a.yaw = a.tyaw = a.home.yaw; } }
  function moveTo(a, x, z, speed) { return new Promise((res) => { if (a.res) a.res(); a.target = { x, z }; a.speed = speed || 2.4; a.res = res; }); }
  const faceTo = (a, b) => { a.tyaw = faceYaw(a.pos, b.pos || b); };
  const toward = (from, to, dist) => { const dx = to.x - from.x, dz = to.z - from.z, d = Math.hypot(dx, dz) || 1; return { x: to.x - dx / d * dist, z: to.z - dz / d * dist }; };
  async function walkNear(a, t, dist, speed) { const p = toward(a.pos, t.pos, dist); if (Math.hypot(p.x - a.pos.x, p.z - a.pos.z) > 0.05) await moveTo(a, p.x, p.z, speed || 2.4); faceTo(a, t); await wait(0.25); }
  async function goHome(a, speed) { if (Math.hypot(a.pos.x - a.home.x, a.pos.z - a.home.z) > 0.05) await moveTo(a, a.home.x, a.home.z, speed || 2.4); a.tyaw = a.home.yaw; }
  function stepActor(a, dt) {
    let moved = 0;
    if (a.target) {
      const dx = a.target.x - a.pos.x, dz = a.target.z - a.pos.z, d = Math.hypot(dx, dz), st = Math.min(d, a.speed * dt);
      if (d > 1e-4) { a.pos.x += dx / d * st; a.pos.z += dz / d * st; a.tyaw = Math.atan2(dx, dz); moved = st; }
      if (d - st < 1e-3) { a.target = null; const r = a.res; a.res = null; if (r) r(); }
    }
    let dy = a.tyaw - a.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); a.yaw += dy * Math.min(1, dt * 8);
    // a blow knocks a body back along the line from whoever struck it, and it steadies again
    if (a.kick) { a.kick.t += dt; const u = a.kick.t, k = u < 0.12 ? u / 0.12 : Math.exp(-(u - 0.12) * 4.5); a.off = a.kick.d * k; if (u > 1.6) { a.kick = null; a.off = 0; } }
    return moved;
  }
  const chest = (f) => (f.m.anchor ? f.m.anchor('chest', V()) : V().set(f.pos.x, 1.2, f.pos.z));
  const head = (f) => f.m.anchor('head', V());

  // ---------- numbers, captions, the banner, flashes ----------
  const layer = document.createElement('div'); layer.className = 'nums'; stage.appendChild(layer);
  const nums = [];
  function num(f, text, kind) {
    const d = document.createElement('div'); d.className = 'num ' + (kind || 'hit'); d.textContent = text; d.style.opacity = 0; layer.appendChild(d);
    const p = head(f); p.y += 0.25; nums.push({ d, p, t: 0, dx: rnd(-14, 14) }); stepNums(0);
  }
  function stepNums(dt) {
    for (let i = nums.length - 1; i >= 0; i--) { const n = nums[i]; n.t += dt; const q = toScreen(n.p), up = 40 * Math.min(1, n.t / 0.6);
      n.d.style.transform = 'translate(' + (q[0] + n.dx).toFixed(1) + 'px,' + (q[1] - up).toFixed(1) + 'px) translate(-50%,-50%)'; n.d.style.opacity = n.t > 1.3 ? Math.max(0, 1 - (n.t - 1.3) / 0.4) : 1;
      if (n.t > 1.7) { n.d.remove(); nums.splice(i, 1); } }
  }
  function hurt(f, n, o) {
    o = o || {};
    if (o.heal) { num(f, '+' + n, 'heal'); return; }
    num(f, String(n), o.big ? 'big' : 'hit');
    if (f.m.ACTIONS && f.m.ACTIONS.hurt && !(f.m.busy && f.m.action && f.m.action !== 'hurt' && f.m.action !== 'idle')) f.m.play('hurt', true);
    const from = o.from ? o.from.pos : null, dir = from ? Math.sign(f.pos.x - from.x) || 1 : 1;
    f.kick = { t: 0, d: dir * (o.big ? 0.42 : 0.22) };
    const p = chest(f); FX.burst(p, [1, 0.9, 0.8], o.big ? 40 : 18, o.big ? 4 : 2.6); FX.flashLight(p, 0xffeedd, o.big ? 4 : 2, 0.25, 6);
    SND.sfx.hit(o.big ? 1.2 : 0.8); shake(o.big ? 12 : 6); hitStop(o.big ? 0.1 : 0.05);
  }
  const $ = (id) => document.getElementById(id);
  const ui = {
    banner(text, sec) { const b = $('banner'); if (!b) return; b.textContent = text; b.classList.add('on'); clearTimeout(b._t); b._t = setTimeout(() => b.classList.remove('on'), (sec || 2.2) * 1000); },
    cap(text) { const c = $('cap'); if (!c) return; c.textContent = text || ''; c.classList.toggle('on', !!text); },
    flash(color, a, sec) { const f = $('flash'); if (!f) return; f.style.transition = 'none'; f.style.background = color; f.style.opacity = a; void f.offsetWidth; f.style.transition = 'opacity ' + (sec || 0.4) + 's ease-out'; f.style.opacity = 0; },
    cinematic(on) { stage.classList.toggle('cine', !!on); },
    vignette(a) { const v = $('vig'); if (v) v.style.opacity = a; },
  };

  // ---------- the frame ----------
  let fxKids = -1, last = 0, running = false;
  const hooks = [];       // a page's own per-frame work (its effects): fn(dt, t)
  const _sl = V();
  function frame(rdt, quiet) {
    let dt = Math.min(rdt, 0.05);
    if (clock.stop > 0) { clock.stop -= dt; dt = 0; } else dt *= clock.scale;
    clock.t += dt;
    tickWaits();
    let bright = 0;
    for (const a of actors) {
      const mv = stepActor(a, dt);
      a.phase += mv * 4.2; a.wb += ((mv > 1e-4 ? 1 : 0) - a.wb) * Math.min(1, dt * 10);
      const ox = a.off * Math.cos(0), oz = 0;
      a.m.root.position.set(a.pos.x + ox, 0, a.pos.z + oz); a.m.root.rotation.y = a.yaw;
      if (a.m.state && a.side === 'summon') { const t = actors.find((f) => f.side === 'foe' && f.shown); if (t) { const c = chest(t); a.m.state.target = { x: c.x, y: c.y, z: c.z }; } }
      a.m.animate(a.phase, a.wb, clock.t, dt);
      a.shadow.position.set(a.pos.x + ox, 0.006, a.pos.z + oz); a.shadow.visible = a.m.root.visible;
      if (a.m.spellLight && a.m.spellLight.intensity > bright) { bright = a.m.spellLight.intensity; a.m.spellLight.getWorldPosition(_sl); spellLight.color.copy(a.m.spellLight.color); }
    }
    spellLight.intensity = bright; if (bright > 0) spellLight.position.copy(_sl); else spellLight.position.set(0, -50, 0);
    const pointScale = IH * (view.s2 || 1) / (Math.max(1, view.h) * Math.tan(FOV / 2 * Math.PI / 180));
    FX.update(dt, clock.t, pointScale);
    for (const h of hooks) h(dt, clock.t, pointScale);
    AF.update(clock.t, dt);
    const L = AF.light;
    hemi.color.copy(L.hemiSky); hemi.groundColor.copy(L.hemiGround); hemi.intensity = L.hemiI;
    moon.position.copy(L.dir).multiplyScalar(30); moon.color.copy(L.color); moon.intensity = L.I;
    fill.color.copy(L.fillC); fill.intensity = L.fillI;
    applyCam(rdt);
    stepNums(rdt);
    if (!quiet) renderer.render(scene, camera);
  }
  function loop(now) { if (!running) return; const rdt = last ? (now - last) / 1000 : 0; last = now; frame(rdt); requestAnimationFrame(loop); }
  // tests: run the clock in fixed steps without the screen's refreshes; between steps the page's own promises move on,
  // and only the last step is drawn
  async function step(sec, fps) { const d = 1 / (fps || 30), n = Math.max(1, Math.round(sec / d)); for (let i = 0; i < n; i++) { frame(d, i < n - 1); await new Promise((r) => setTimeout(r, 0)); } }

  layout();
  window.addEventListener('resize', () => { layout(); });
  paintImg.onload = () => { lastTf = ''; AF.setPainting(paintImg); };
  paintImg.src = ARENA.image;
  setLook(look);

  const K = { WITCH, THREE, AF, ARENA, scene, camera, renderer, FX, IOS, SND, clock, view, actors, wait, until, untilP, untilT, hitStop, shake, shotAt, shotBoth, shotFit, rest, actor, settle,
    moveTo, faceTo, walkNear, goHome, restYaw, chest, head, hurt, num, ui, setLook, get look() { return look; }, layout, toScreen, step, ptsOf, toward, faceYaw,
    onFrame: (fn) => hooks.push(fn),
    ready: () => paintImg.complete && paintImg.naturalWidth > 0,
    compile() { for (const a of actors) a.m.root.visible = true; renderer.compile(scene, camera); for (const a of actors) a.m.root.visible = a.shown; },
    start() { if (cfg.test) return; running = true; last = 0; requestAnimationFrame(loop); } };
  return K;
}
