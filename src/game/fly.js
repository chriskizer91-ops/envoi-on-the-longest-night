// fly.js: flying the Magpie (plan step 19), after Chris's world travel demo (reference/demos/the-magpie-over-aethermoor.html):
// the skiff in 3D (src/models/magpie.js) over the far view of the night atlas, the follow camera at the demo's oblique
// pitch (52 degrees) with zoom, tap-to-fly and steering, the stops' banners, docking and take-off, the drifting clouds,
// and its music. The map is 12 atlas pixels a meter, as in the demo, so it is 384 m across; the ship cruises at the
// demo's 4.5 m a second, about 7 m up. A band the ship can't reach yet lies under cold mist, and she turns back from it.
// Fly.create(host, opts) -> { fly(from) -> Promise<landing id | null>, stop() }
//   opts: image (the far view's URL), clouds (the clouds' URL), landings: { id: { name, at: [x, y] (atlas px), band,
//   need() } }, open(band) -> bool, bandAt(x, y), mask (WORLD_MASK, for the mini-map), music(id), sfx(id)
// Needs THREE (r128) and makeMagpie. Defines window.Fly.
(function () {
  'use strict';
  function el(tag, attrs, parent, text) { const e = document.createElement(tag); if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]); if (text !== undefined) e.textContent = text; if (parent) parent.appendChild(e); return e; }
  const PPM = 12, WW = 4608, WH = 3072, MW = WW / PPM, MH = WH / PPM;
  const CRUISE = 4.5, ALT = 7, TURN = 1.5, SHIP_SCALE = 1.6, PITCH = 52 * Math.PI / 180;
  // atlas pixels to the ground plane (x east, z south), and back
  const toW = (x, y) => new THREE.Vector3(x / PPM - MW / 2, 0, y / PPM - MH / 2);
  const toPx = (v) => [(v.x + MW / 2) * PPM, (v.z + MH / 2) * PPM];

  function create(host, opts) {
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const root = el('div', { class: 'fly', hidden: '' }, host);
    const cv = el('canvas', { class: 'fly-cv', 'aria-hidden': 'true' }, root);
    const labels = el('div', { class: 'fly-labels', 'aria-hidden': 'true' }, root);
    const plate = el('div', { class: 'field-plate win', role: 'status', 'aria-live': 'polite' }, root, 'The Magpie');
    const mini = el('canvas', { class: 'mini', role: 'img', 'aria-label': 'Map of the world' }, root), mg = mini.getContext('2d');
    const zoomBox = el('div', { class: 'fly-zoom', role: 'group', 'aria-label': 'Zoom' }, root);
    const zin = el('button', { type: 'button', 'aria-label': 'Closer' }, zoomBox, '+'), zout = el('button', { type: 'button', 'aria-label': 'Farther' }, zoomBox, '−');
    const card = el('div', { class: 'fly-card win', hidden: '' }, root);
    const cardName = el('h3', null, card), cardBtn = el('button', { type: 'button', class: 'go' }, card, 'Land here');
    const stayBtn = el('button', { type: 'button', class: 'go alt fly-stay' }, root, 'Land where we took off');
    const hint = el('p', { class: 'fly-hint' }, root, 'Tap the map to fly there, or steer with the arrows. Fly close to a lit stop to land.');
    const pad = el('div', { class: 'pad', role: 'group', 'aria-label': 'Steer' }, root);
    const held = new Set();
    for (const [d, label, glyph] of [['n', 'Faster', '▲'], ['w', 'Turn left', '◀'], ['e', 'Turn right', '▶'], ['s', 'Slower', '▼']]) {
      const b = el('button', { type: 'button', class: 'pad-' + d, 'aria-label': label }, pad, glyph);
      const on = (e) => { e.preventDefault(); held.add(d); target = null; }, off = () => held.delete(d);
      b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointerleave', off); b.addEventListener('pointercancel', off);
    }
    const KEYS = { ArrowUp: 'n', ArrowDown: 's', ArrowLeft: 'w', ArrowRight: 'e', w: 'n', s: 's', a: 'w', d: 'e' };
    const onKey = (e) => { if (root.hidden) return; const d = KEYS[e.key]; if (d) { held.add(d); target = null; e.preventDefault(); } else if ((e.key === 'Enter' || e.key === ' ') && !card.hidden) { cardBtn.click(); e.preventDefault(); } };
    const onKeyUp = (e) => { const d = KEYS[e.key]; if (d) held.delete(d); };
    window.addEventListener('keydown', onKey); window.addEventListener('keyup', onKeyUp);

    // ---------- the scene ----------
    let renderer = null, scene, camera, ship, ground, mist, clouds = [], ready = false;
    const banners = {};
    function build() {
      renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true });
      renderer.setPixelRatio(DPR); renderer.setClearColor(0x05030c, 1);
      scene = new THREE.Scene();
      scene.fog = new THREE.Fog(0x0b0820, 120, 260);
      camera = new THREE.PerspectiveCamera(20, 1, 1, 900);
      scene.add(new THREE.HemisphereLight('#9aa8ff', '#1c1830', 0.95));
      const moon = new THREE.DirectionalLight('#d2d8ff', 1.1); moon.position.set(40, 60, -40); scene.add(moon);
      // the ground: the far view of the night atlas
      const tex = new THREE.TextureLoader().load(opts.image); tex.anisotropy = 4; tex.minFilter = THREE.LinearMipmapLinearFilter;
      ground = new THREE.Mesh(new THREE.PlaneGeometry(MW, MH), new THREE.MeshBasicMaterial({ map: tex }));
      ground.rotation.x = -Math.PI / 2; scene.add(ground);
      // the cold mist over the bands not open yet: a soft veil just above the ground
      const vc = document.createElement('canvas'); vc.width = 288; vc.height = 192;
      const mt = new THREE.CanvasTexture(vc); mt.minFilter = THREE.LinearFilter;
      mist = new THREE.Mesh(new THREE.PlaneGeometry(MW, MH), new THREE.MeshBasicMaterial({ map: mt, transparent: true, depthWrite: false }));
      mist.rotation.x = -Math.PI / 2; mist.position.y = 0.6; mist.userData = { canvas: vc, tex: mt, key: '' }; scene.add(mist);
      // the Magpie
      ship = makeMagpie({ lit: true }); ship.root.scale.setScalar(SHIP_SCALE); scene.add(ship.root); scene.add(ship.fx);
      // the painted night clouds (Chris's, from 20-min), drifting a little above the ship
      const ct = new THREE.TextureLoader().load(opts.clouds);
      for (let i = 0; i < 26; i++) {
        const t = ct.clone(); t.needsUpdate = true; t.repeat.set(1 / 3, 1 / 2); const k = i % 6; t.offset.set((k % 3) / 3, k < 3 ? 0.5 : 0);
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, opacity: 0.55, fog: true }));
        const w = 16 + (i * 7) % 12; s.scale.set(w, w * 0.66, 1);
        s.position.set((Math.random() - 0.5) * MW, 13 + Math.random() * 6, (Math.random() - 0.5) * MH);
        scene.add(s); clouds.push({ s, v: 0.6 + Math.random() * 0.5 });
      }
      // the stops: a banner each, and a glow on the ground
      for (const id in opts.landings) banners[id] = el('div', { class: 'fly-banner' }, labels, opts.landings[id].name);
      ready = true; layout();
    }
    function layout() {
      if (!renderer) return;
      const w = root.clientWidth, h = root.clientHeight; if (!w || !h) return;
      renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    }
    const ro = new ResizeObserver(layout); ro.observe(root);

    // ---------- flying ----------
    const S = { pos: new THREE.Vector3(), yaw: 0, speed: 0, alt: 0, mode: 'idle', zoom: 1, from: null };
    let target = null, resolveFly = null, near = null, raf = 0, last = 0, mistNote = 0;
    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit = new THREE.Vector3();
    cv.addEventListener('pointerdown', (e) => {
      if (S.mode !== 'fly') return;
      const r = cv.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera); if (ray.ray.intersectPlane(plane, hit)) target = hit.clone();
    });
    zin.addEventListener('click', () => { S.zoom = Math.max(0.5, S.zoom / 1.35); });
    zout.addEventListener('click', () => { S.zoom = Math.min(3.2, S.zoom * 1.35); });
    const openAt = (v) => { const [x, y] = toPx(v); const b = opts.bandAt(x, y); return b > 0 && opts.open(b); };
    // what the mist she turns back from is: a band the Magpie can't reach yet needs more lift; the mist off every band
    // (band 0, the open sea's) never lifts, whatever she is fitted with
    const mistLine = (v) => { const [x, y] = toPx(v); return opts.bandAt(x, y) > 0 ? 'Cold mist: the Magpie needs more lift to fly into it.' : 'Cold mist that never lifts: the Magpie turns back.'; };
    const landingsOpen = () => Object.entries(opts.landings).filter(([, L]) => opts.open(L.band) && (!L.need || L.need()));
    cardBtn.addEventListener('click', () => { if (near && S.mode === 'fly') land(near); });
    stayBtn.addEventListener('click', () => { if (S.mode === 'fly' && S.from) land(S.from); });
    async function land(id) {
      S.mode = 'land'; card.hidden = true; target = toW(...opts.landings[id].at); S.landing = id;
      if (opts.sfx) opts.sfx('ship-land');
    }

    function fly(from) {
      if (!ready) build();
      root.hidden = false; layout();
      const L = opts.landings[from];
      // no stop is near yet, so the one she rises from offers to land again even when she came down there by its card
      S.pos.copy(toW(...L.at)); S.alt = 0.5; S.yaw = Math.PI / 2; S.speed = 0; S.mode = 'takeoff'; S.from = from; target = null; near = null; held.clear();
      if (opts.music) opts.music('flight'); if (opts.sfx) opts.sfx('ship-takeoff');
      hint.hidden = false; setTimeout(() => { hint.hidden = true; }, 6000);
      last = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
      return new Promise((res) => { resolveFly = res; });
    }
    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      step(dt); render(now);
      if (!root.hidden) raf = requestAnimationFrame(frame);
    }
    function step(dt) {
      let turn = 0, climb = 0;
      if (S.mode === 'takeoff') { S.alt += dt * 3; climb = 1; S.speed = Math.min(CRUISE, S.speed + dt * 2); if (S.alt >= ALT) { S.alt = ALT; S.mode = 'fly'; } }
      else if (S.mode === 'fly' || S.mode === 'land') {
        // landing, she makes for the stop whatever is touched meanwhile (the pad and the arrows let go of a tapped point)
        if (S.mode === 'land') target = toW(...opts.landings[S.landing].at);
        let want = S.speed;
        if (held.size && S.mode === 'fly') {
          if (held.has('w')) turn = TURN; if (held.has('e')) turn = -TURN;
          want = held.has('n') ? CRUISE * 1.6 : held.has('s') ? CRUISE * 0.35 : CRUISE;
        } else if (target) {
          const dx = target.x - S.pos.x, dz = target.z - S.pos.z, d = Math.hypot(dx, dz);
          const ang = Math.atan2(dx, dz); let diff = ang - S.yaw; while (diff > Math.PI) diff -= Math.PI * 2; while (diff < -Math.PI) diff += Math.PI * 2;
          turn = Math.max(-TURN, Math.min(TURN, diff * 2.5));
          // she slows to a halt short of a tapped point; landing, she comes all the way in, since she only comes down
          // within 1.5 m of the stop
          const landing = S.mode === 'land';
          want = d < 3 && !landing ? 0 : Math.min(CRUISE, d * 0.8);
          if (d < 0.6 && !landing) { target = null; want = 0; }
        } else want = 0;
        S.speed += (want - S.speed) * Math.min(1, dt * 1.6);
        S.yaw += turn * dt;
        const nx = S.pos.x + Math.sin(S.yaw) * S.speed * dt, nz = S.pos.z + Math.cos(S.yaw) * S.speed * dt;
        const next = new THREE.Vector3(nx, 0, nz);
        // the cold mist turns her back; the map's edge holds her in
        if (!openAt(next) && S.mode === 'fly') { S.yaw += Math.PI * 0.75 * dt * 4; S.speed *= 0.9; target = null; if (performance.now() - mistNote > 3000) { mistNote = performance.now(); plate.textContent = mistLine(next); if (opts.sfx) opts.sfx('wind'); } }
        else { S.pos.x = Math.max(-MW / 2 + 4, Math.min(MW / 2 - 4, nx)); S.pos.z = Math.max(-MH / 2 + 4, Math.min(MH / 2 - 4, nz)); }
        if (S.mode === 'land') {
          const d = Math.hypot(target.x - S.pos.x, target.z - S.pos.z);
          if (d < 1.5) { S.alt -= dt * 3; climb = -1; if (S.alt <= 0.5) { S.alt = 0.5; finish(S.landing); return; } }
        } else {
          // the nearest open stop within reach offers to land
          let best = null, bd = 9;
          for (const [id, L] of landingsOpen()) { const p = toW(...L.at), d = Math.hypot(p.x - S.pos.x, p.z - S.pos.z); if (d < bd) { bd = d; best = id; } }
          if (best !== near) { near = best; card.hidden = !near; if (near) { cardName.textContent = opts.landings[near].name; cardBtn.textContent = near === S.from ? 'Land again here' : 'Land here'; } }
          if (performance.now() - mistNote > 3000) { const [x, y] = toPx(S.pos); plate.textContent = opts.regionName ? opts.regionName(x, y) : 'The Magpie'; }
        }
      }
      ship.root.position.set(S.pos.x, S.alt, S.pos.z); ship.root.rotation.y = S.yaw;
      ship.update(dt, S.speed, turn, climb, 0);
      for (const c of clouds) { c.s.position.x += c.v * dt; if (c.s.position.x > MW / 2 + 20) c.s.position.x = -MW / 2 - 20; }
    }
    function finish(id) {
      S.mode = 'idle'; card.hidden = true; root.hidden = true; cancelAnimationFrame(raf);
      const r = resolveFly; resolveFly = null; if (r) r(id);
    }
    function render(now) {
      if (!renderer) return;
      // the follow camera: the demo's oblique view, the ship a little below the middle, pulled back with the zoom
      const w = root.clientWidth, h = root.clientHeight, portrait = h > w;
      const span = (portrait ? 46 : 70) * S.zoom; // meters across the view
      const vfov = camera.fov * Math.PI / 180, hfov = 2 * Math.atan(Math.tan(vfov / 2) * camera.aspect);
      const dist = span / 2 / Math.tan(hfov / 2);
      // keep the view inside the painting: near its edges the camera stops and the ship moves on toward them
      const halfW = span / 2, halfD = span / camera.aspect * 0.62;
      const look = new THREE.Vector3(Math.max(-MW / 2 + halfW, Math.min(MW / 2 - halfW, S.pos.x)), S.alt * 0.4, Math.max(-MH / 2 + halfD * 0.8, Math.min(MH / 2 - halfD * 1.1, S.pos.z - 2)));
      camera.position.set(look.x, look.y + Math.sin(PITCH) * dist, look.z + Math.cos(PITCH) * dist);
      camera.lookAt(look); camera.far = dist * 2.5; camera.updateProjectionMatrix();
      scene.fog.near = dist * 0.9; scene.fog.far = dist * 2.4;
      drawMist(now);
      renderer.render(scene, camera);
      // the stops' banners, over their places
      const v = new THREE.Vector3();
      for (const id in banners) {
        const L = opts.landings[id], b = banners[id], ok = opts.open(L.band) && (!L.need || L.need());
        v.copy(toW(...L.at)); v.y = 2; v.project(camera);
        const on = ok && v.z < 1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1;
        b.hidden = !on; if (on) { b.style.transform = 'translate(' + ((v.x + 1) / 2 * w).toFixed(1) + 'px,' + ((1 - v.y) / 2 * h).toFixed(1) + 'px) translate(-50%,-120%)'; b.classList.toggle('near', id === near); }
      }
      drawMini(now);
    }
    function drawMist(now) {
      const key = [1, 2, 3, 4].map((b) => (opts.open(b) ? 1 : 0)).join('');
      const U = mist.userData; if (U.key === key) { mist.material.opacity = 0.82 + 0.1 * Math.sin(now / 1500); return; }
      U.key = key; const g = U.canvas.getContext('2d'), im = g.createImageData(288, 192);
      for (let j = 0; j < 192; j++) for (let i = 0; i < 288; i++) { const b = opts.bandAt(i * 16 + 8, j * 16 + 8), o = (j * 288 + i) * 4, fog = !(b && opts.open(b)); im.data[o] = 168; im.data[o + 1] = 178; im.data[o + 2] = 210; im.data[o + 3] = fog ? 205 : 0; }
      g.putImageData(im, 0, 0); U.tex.needsUpdate = true;
    }
    let miniBase = null;
    function drawMini(now) {
      const r = mini.getBoundingClientRect(), DPRm = Math.min(window.devicePixelRatio || 1, 3), w = Math.round(r.width * DPRm), h = Math.round(w * WH / WW);
      if (!w) return; if (mini.width !== w || mini.height !== h) { mini.width = w; mini.height = h; miniBase = null; }
      if (!miniBase && opts.mask) {
        const M = opts.mask; miniBase = document.createElement('canvas'); miniBase.width = M.w; miniBase.height = M.h; const bg = miniBase.getContext('2d'), im = bg.createImageData(M.w, M.h);
        let i = 0, val = M.first; for (const run of M.rle.split(',')) { const n = parseInt(run, 36); for (let k = 0; k < n; k++, i++) { const o = i * 4; im.data[o] = val ? 74 : 14; im.data[o + 1] = val ? 88 : 30; im.data[o + 2] = val ? 70 : 70; im.data[o + 3] = 255; } val = 1 - val; }
        bg.putImageData(im, 0, 0);
      }
      if (miniBase) mg.drawImage(miniBase, 0, 0, w, h);
      mg.globalAlpha = 0.8; mg.drawImage(mist.userData.canvas, 0, 0, w, h); mg.globalAlpha = 1;
      const k = w / WW;
      for (const [, L] of landingsOpen()) { mg.fillStyle = '#ffd36e'; mg.beginPath(); mg.arc(L.at[0] * k, L.at[1] * k, 2.4 * DPRm, 0, Math.PI * 2); mg.fill(); }
      const [x, y] = toPx(S.pos), p = 0.5 + 0.5 * Math.sin(now / 180);
      mg.fillStyle = '#9fc8ff'; mg.beginPath(); mg.arc(x * k, y * k, (2.6 + p) * DPRm, 0, Math.PI * 2); mg.fill();
    }
    return {
      root, fly, get state() { return S; },
      flyTo(id) { target = toW(...opts.landings[id].at); },
      stop() { cancelAnimationFrame(raf); ro.disconnect(); window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKeyUp); if (renderer) { renderer.dispose(); renderer.forceContextLoss(); } },
    };
  }
  window.Fly = { create };
})();
