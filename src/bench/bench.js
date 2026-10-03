// bench.js: the shared battle bench that every model's touch-up demo plugs into. The model stands in
// the Night square in its battle place, its opponents stand in theirs, and every action plays with hit
// markers and damage numbers. three.js r128 (global THREE). Defines window.Bench = { start(cfg) }.
(function () {
  'use strict';
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const wrapA = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  const faceYaw = (from, to) => Math.atan2(to.x - from.x, to.z - from.z);
  function el(tag, attrs, parent, text) {
    const e = document.createElement(tag);
    if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (text !== undefined) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }

  // Counts what a model costs to draw: body meshes, effect meshes, triangles, bones, textures.
  function budget(m) {
    let tri = 0, draws = 0, fxDraws = 0, plainBones = 0, texBytes = 0;
    const tex = new Set(), bones = new Set();
    const texOf = (mt) => { for (const k of ['map', 'normalMap', 'emissiveMap', 'alphaMap', 'roughnessMap', 'metalnessMap', 'bumpMap']) if (mt && mt[k] && mt[k].image && !tex.has(mt[k].image)) { tex.add(mt[k].image); const im = mt[k].image; texBytes += (im.width || 0) * (im.height || 0) * 4 * 1.33; } };
    m.root.traverse((o) => {
      if (o.isBone) plainBones++;
      if (o.isMesh) {
        draws++;
        const g = o.geometry, n = g.index ? g.index.count : g.attributes.position.count;
        tri += n / 3 * (o.isInstancedMesh ? o.count : 1);
        (Array.isArray(o.material) ? o.material : [o.material]).forEach(texOf);
        if (o.isSkinnedMesh) o.skeleton.bones.forEach((b) => bones.add(b));
      } else if (o.isPoints || o.isSprite || o.isLine) draws++;
    });
    if (m.fx) m.fx.traverse((o) => { if (o.isMesh || o.isPoints || o.isSprite || o.isLine) { fxDraws++; if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(texOf); } });
    return { triangles: Math.round(tri), drawCalls: draws, fxDrawCalls: fxDraws, bones: Math.max(bones.size, plainBones), textures: tex.size, texMB: texBytes / 1048576 };
  }

  // The 3D layer is a transparent canvas over the painting. Plain additive blending also adds to the canvas's alpha,
  // which turns a dim glow into an opaque dark patch over the painting; this keeps additive effects to light alone.
  function lightOnly(obj) {
    obj.traverse((o) => {
      if (!o.material) return;
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
        if (m.blending !== THREE.AdditiveBlending) continue;
        m.blending = THREE.CustomBlending; m.blendEquation = THREE.AddEquation; m.blendSrc = THREE.SrcAlphaFactor; m.blendDst = THREE.OneFactor;
        m.blendEquationAlpha = THREE.AddEquation; m.blendSrcAlpha = THREE.ZeroFactor; m.blendDstAlpha = THREE.OneFactor; m.needsUpdate = true;
      }
    });
  }

  function dispose(m) {
    for (const g of [m.root, m.fx]) if (g) g.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((mt) => mt.dispose());
    });
  }

  function start(cfg) {
    const SC = window.SCENES[cfg.scene || 'night-square'];
    const IW = SC.width, IH = SC.height, A = IW / IH, FOV = SC.fov, PITCH = SC.pitch * Math.PI / 180, PXM = SC.ppm;
    const DIST = (IH / 2) / (PXM * Math.tan(FOV / 2 * Math.PI / 180));
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const REDUCED = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    // ---------- page ----------
    document.title = cfg.title;
    const header = el('header', null, document.body);
    el('h1', null, header, cfg.title);
    if (cfg.blurb) el('p', null, header, cfg.blurb);
    const wrap = el('div', { class: 'wrap' }, document.body);
    const stage = el('main', { id: 'stage', 'aria-label': cfg.title }, wrap);
    const paintEl = el('img', { id: 'paint', alt: '', draggable: 'false' }, stage);
    const night = el('div', { id: 'night', 'aria-hidden': 'true' }, stage);
    const glCanvas = el('canvas', { id: 'gl', 'aria-hidden': 'true' }, stage);
    const overlay = el('canvas', { id: 'overlay', 'aria-hidden': 'true' }, stage);
    const flashEl = el('div', { id: 'flash', 'aria-hidden': 'true' }, stage);
    const now = el('div', { id: 'now', class: 'win', role: 'status', 'aria-live': 'polite' }, stage);
    const nowName = el('div', { id: 'nowName' }, now, 'Building the model');
    const bar = el('div', { id: 'bar' }, now), barFill = el('div', { id: 'barFill' }, bar);
    const panel = el('section', { id: 'panel', class: 'win', 'aria-label': 'Controls' }, wrap);
    const btns = {};
    let req = null;
    for (const grp of cfg.groups) {
      el('h2', null, panel, grp.title);
      const box = el('div', { class: 'acts' }, panel);
      for (const a of grp.acts) {
        const b = el('button', { type: 'button' }, box, (cfg.names && cfg.names[a]) || a);
        if (cfg.hints && cfg.hints[a]) el('small', null, b, cfg.hints[a]);
        b.addEventListener('click', () => { req = a; });
        btns[a] = b;
      }
    }
    const UI = { walk: false, guard: false, turn: false, view: 'close', after: true };
    el('h2', null, panel, 'Movement and look');
    const togs = el('div', { class: 'togs' }, panel);
    const setPressed = (e, on) => e.setAttribute('aria-pressed', on ? 'true' : 'false');
    function toggle(label, on, fn) { const b = el('button', { class: 'tog', type: 'button', 'aria-pressed': on ? 'true' : 'false' }, togs, label); let v = on; b.addEventListener('click', () => { v = !v; setPressed(b, v); fn(v); }); return { el: b, set(x) { v = x; setPressed(b, x); } }; }
    const walkTog = toggle(cfg.subject.walkLabel || 'Walk', false, (v) => { UI.walk = v; });
    toggle('Guard', false, (v) => { UI.guard = v; if (sub && sub.m.guard) sub.m.guard(v); });
    toggle('Turn', false, (v) => { UI.turn = v; });
    for (const t of cfg.toggles || []) toggle(t.label, !!t.value, (v) => t.onToggle(v, ctx));
    for (const c of cfg.cast || []) if (c.toggle !== false) toggle(c.name, c.visible !== false, (v) => { const a = actors[c.id]; if (a) a.setVisible(v); });
    for (const s of cfg.sliders || []) {
      const lab = el('label', { class: 'sl' }, panel); el('span', null, lab, s.label);
      const inp = el('input', { type: 'range', min: s.min, max: s.max, step: s.step, value: s.value }, lab);
      const out = el('output', null, lab, s.value + (s.unit || ''));
      inp.addEventListener('input', () => { out.textContent = inp.value + (s.unit || ''); s.onInput(+inp.value, ctx); });
    }
    const seg = el('div', { class: 'seg', role: 'group', 'aria-label': 'Camera' }, panel);
    const camBtns = [['close', 'Close'], ['full', 'Full'], ['square', 'Square']].map(([mode, label]) => {
      const b = el('button', { type: 'button', 'aria-pressed': mode === 'close' ? 'true' : 'false' }, seg, label);
      b.addEventListener('click', () => { UI.view = mode; camBtns.forEach((q) => setPressed(q, q === b)); });
      return b;
    });
    let vsBtns = null;
    if (cfg.subject.before) {
      const vs = el('div', { class: 'vs', role: 'group', 'aria-label': 'Model version' }, panel);
      vsBtns = [['before', 'Before'], ['after', 'After']].map(([k, label]) => {
        const b = el('button', { type: 'button', 'aria-pressed': k === 'after' ? 'true' : 'false' }, vs, label);
        b.addEventListener('click', () => { const after = k === 'after'; if (after !== UI.after) { UI.after = after; vsBtns.forEach((q) => setPressed(q, q === b)); buildSubject(); } });
        return b;
      });
    }
    el('h2', null, panel, 'Budget');
    const dl = el('dl', null, panel);
    const stat = {};
    for (const [k, label] of [['tri', 'Triangles'], ['draw', 'Draw calls'], ['bones', 'Bones'], ['tex', 'Textures'], ['height', 'Height'], ['ms', 'Build time']]) { el('dt', null, dl, label); stat[k] = el('dd', null, dl, '-'); }
    stat.height.textContent = cfg.subject.height || '-';
    if (cfg.note) el('p', { class: 'note' }, panel, cfg.note);

    // ---------- the painting's camera, exactly as the battle builds it ----------
    const fullCam = new THREE.PerspectiveCamera(FOV, A, DIST * 0.6, DIST * 1.6);
    fullCam.position.set(0, DIST * Math.sin(PITCH), DIST * Math.cos(PITCH)); fullCam.lookAt(0, 0, 0);
    fullCam.updateMatrixWorld(); fullCam.updateProjectionMatrix();
    const camera = fullCam.clone();
    const raycaster = new THREE.Raycaster(), ndc = new THREE.Vector2(), hitP = new THREE.Vector3(), tmpV = new THREE.Vector3();
    const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    function rayAt(u, v) { ndc.set(u / IW * 2 - 1, 1 - v / IH * 2); raycaster.setFromCamera(ndc, fullCam); return raycaster.ray; }
    function g(u, v) { rayAt(u, v).intersectPlane(floorPlane, hitP); return { x: hitP.x, z: hitP.z }; }
    function toPx(p) { tmpV.copy(p).project(fullCam); return [(tmpV.x + 1) / 2 * IW, (1 - tmpV.y) / 2 * IH]; }
    function cutout(poly, base) {
      const a = g(base[0][0], base[0][1]), b = g(base[1][0], base[1][1]);
      const dir = new THREE.Vector3(b.x - a.x, 0, b.z - a.z); if (dir.lengthSq() < 1e-8) dir.set(1, 0, 0); dir.normalize();
      const n = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();
      const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(n, new THREE.Vector3(a.x, 0, a.z));
      const pos = [];
      for (const p of poly) { const r = rayAt(p[0], p[1]), q = new THREE.Vector3(); if (!r.intersectPlane(plane, q)) r.at(DIST, q); pos.push(q.x, q.y, q.z); }
      const tri = THREE.ShapeUtils.triangulateShape(poly.map((p) => new THREE.Vector2(p[0], -p[1])), []);
      const idx = []; for (const t of tri) idx.push(t[0], t[1], t[2]);
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx);
      return geo;
    }
    function lampPos(base, at) {
      const b = g(base[0], base[1]);
      const p0 = new THREE.Vector3(b.x, 0, b.z).project(fullCam), p1 = new THREE.Vector3(b.x, 1, b.z).project(fullCam), p2 = new THREE.Vector3(b.x + 1, 0, b.z).project(fullCam);
      const vpm = (p1.y - p0.y) / 2 * IH, hpm = (p2.x - p0.x) / 2 * IW;
      return new THREE.Vector3(b.x + (at[0] - base[0]) / hpm, (base[1] - at[1]) / vpm, b.z);
    }
    function radialTex(inner, mid, outer) {
      const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), gr = x.createRadialGradient(64, 64, 0, 64, 64, 64);
      gr.addColorStop(0, inner); gr.addColorStop(0.45, mid); gr.addColorStop(1, outer || 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
      return new THREE.CanvasTexture(c);
    }

    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0x756aa8, 0x33262f, 1.1));
    const moon = new THREE.DirectionalLight(0xb8c0ff, 0.62); moon.position.set(-5, 9, -12); scene.add(moon);
    const fill = new THREE.DirectionalLight(0xffdcc0, 0.42); fill.position.set(2, 5, 10); scene.add(fill);
    for (const i of SC.lamps) { const L = SC.layout.lights[i]; const p = new THREE.PointLight(new THREE.Color(L.c), L.i, L.d, 2); p.position.copy(lampPos(L.base, L.at)); scene.add(p); }
    const depthMat = new THREE.MeshBasicMaterial({ colorWrite: false, side: THREE.DoubleSide });
    for (const o of SC.layout.occ) for (const poly of o.polys) { const m = new THREE.Mesh(cutout(poly, o.base), depthMat); m.renderOrder = -1; scene.add(m); }
    const sceneLights = []; scene.children.forEach((o) => { if (o.isLight) sceneLights.push({ o, i: o.intensity }); });
    const darkT = radialTex('rgba(10,4,16,0.62)', 'rgba(10,4,16,0.3)', 'rgba(10,4,16,0)');
    function disc(r) { const m = new THREE.Mesh(new THREE.CircleGeometry(r, 36), new THREE.MeshBasicMaterial({ map: darkT, transparent: true, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.renderOrder = 1; scene.add(m); return m; }

    // ---------- actors: the subject, its opponents and allies ----------
    // kind: 'spec' follows the Model Build Spec; 'witch', 'wraith' and 'goddess' are the older Night square interfaces.
    const actors = {};
    const _h = new THREE.Vector3();
    function placeOf(spec) { const p = g(spec.home[0], spec.home[1]); return { x: p.x, z: p.z, yaw: 0 }; }
    function makeActor(spec, isSubject) {
      const home = placeOf(spec);
      const a = {
        id: spec.id, spec, m: null, kind: spec.kind || 'spec', home, x: home.x, z: home.z, yaw: 0, wb: 0, ts: 1, wt: 0, visible: spec.visible !== false, shadow: disc(spec.shadow || 0.6), isSubject,
        build(make) {
          if (a.m) { scene.remove(a.m.root); if (a.m.fx) scene.remove(a.m.fx); dispose(a.m); }
          const t0 = performance.now();
          a.m = make();
          a.buildMs = performance.now() - t0;
          scene.add(a.m.root); if (a.m.fx) scene.add(a.m.fx);
          lightOnly(a.m.root); if (a.m.fx) lightOnly(a.m.fx);
          if (a.kind === 'goddess' && a.m.show) a.m.show();
          a.setVisible(a.visible);
        },
        setVisible(v) { a.visible = v; if (!a.m) return; a.m.root.visible = v; if (a.m.fx) a.m.fx.visible = v; a.shadow.visible = v; },
        animate(t, dt) {
          const m = a.m;
          m.root.position.set(a.x, 0, a.z); m.root.rotation.y = a.yaw;
          if (a.kind === 'wraith') m.animate(t, dt);
          else if (a.kind === 'goddess') m.update(t, dt);
          else m.animate(0, a.wb, t, dt);
          a.shadow.position.set(a.x, 0.006, a.z);
        },
        play(name, force) { const m = a.m; if (!m.play) return false; if (a.kind === 'goddess') { if (m[name]) { m[name](); return true; } return false; } return m.play(name, force); },
        head(out) {
          const m = a.m; out = out || _h;
          if (m.anchor) return m.anchor('head', out);
          if (m.headPos) return m.headPos(out);
          if (m.chestPos) { m.chestPos(out); out.y += 0.42; return out; }
          return out.set(a.x, 1.6, a.z);
        },
        chest(out) {
          const m = a.m; out = out || _h;
          if (m.anchor) return m.anchor('chest', out);
          if (m.chestPos) return m.chestPos(out);
          return out.set(a.x, 1.1, a.z);
        },
        get busy() { return !!a.m.busy; },
        get action() { return a.m.action || ''; },
        get progress() { return a.m.progress === undefined ? -1 : a.m.progress; },
      };
      a.shadow.scale.set(1, spec.shadowY || 0.8, 1);
      actors[spec.id] = a;
      return a;
    }
    const sub = makeActor(Object.assign({ id: cfg.subject.id }, cfg.subject), true);
    const cast = (cfg.cast || []).map((c) => makeActor(c, false));
    const faceOf = (spec) => { const t = spec.face ? actors[spec.face] : null; return t ? t.home : null; };

    function buildSubject() {
      const make = UI.after || !cfg.subject.before ? cfg.subject.make : cfg.subject.before;
      sub.build(make);
      sub.x = sub.home.x; sub.z = sub.home.z; sub.yaw = sub.home.yaw; S.prog = -1; shownAct = null;
      if (UI.guard && sub.m.guard) sub.m.guard(true);
      const B = budget(sub.m);
      stat.tri.textContent = B.triangles.toLocaleString('en-US');
      stat.draw.innerHTML = B.drawCalls + ' <small>+ up to ' + B.fxDrawCalls + ' for effects</small>';
      stat.bones.textContent = B.bones ? String(B.bones) : 'none (rigid joints)';
      stat.tex.textContent = B.textures + ' (' + B.texMB.toFixed(1) + ' MB)';
      stat.ms.textContent = Math.round(sub.buildMs) + ' ms on this device';
      if (cfg.stage && cfg.stage.onBuild) cfg.stage.onBuild(ctx);
      window.__bench && (window.__bench.budget = B);
    }

    // ---------- status window, hit rings, damage numbers ----------
    let shownAct = null, lastLabel = '';
    function label(text) { if (text !== lastLabel) { nowName.textContent = text; lastLabel = text; } }
    function setTicks(def) {
      for (const i of bar.querySelectorAll('i')) i.remove(); if (!def) return;
      for (const h of def.hits || []) { const i = el('i', null, bar); i.style.left = (h * 100).toFixed(1) + '%'; }
      for (const h of def.cues || []) { const i = el('i', { class: 'c' }, bar); i.style.left = (h * 100).toFixed(1) + '%'; }
    }
    const view = { w: 1, h: 1 };
    function toScreen(p) { tmpV.copy(p).project(camera); return [(tmpV.x + 1) / 2 * view.w, (1 - tmpV.y) / 2 * view.h, tmpV.z]; }
    function ring(p3, cls) { const p = toScreen(p3); if (p[2] > 1) return; const d = el('div', { class: cls || 'hit' }, stage); d.style.left = p[0] + 'px'; d.style.top = p[1] + 'px'; d.addEventListener('animationend', () => d.remove()); }
    function damage(id, n, cls, delay) {
      setTimeout(() => {
        const a = actors[id]; if (!a || !a.visible) return;
        const p = toScreen(a.head(new THREE.Vector3())); if (p[2] > 1) return;
        const d = el('div', { class: 'dmg ' + (cls || '') }, stage, typeof n === 'number' ? n.toLocaleString('en-US') : n);
        d.style.left = (p[0] + (Math.random() - 0.5) * 26) + 'px'; d.style.top = p[1] + 'px'; d.addEventListener('animationend', () => d.remove());
        if (cls !== 'heal' && !a.isSubject) a.play(a.guarding ? 'block' : 'hurt', true);
      }, delay || 0);
    }
    const swing = (n, k) => Math.round(n * (1 + (Math.random() * 2 - 1) * (k === undefined ? 0.1 : k)));

    // ---------- camera: a crop of the painting plus a zoom, as in the battle ----------
    const cam = { cx: IW / 2, cy: IH / 2, s: 2, tx: IW / 2, ty: IH / 2, ts: 2 };
    let renderer = null, lastTf = '';
    function layoutView() { view.w = stage.clientWidth; view.h = stage.clientHeight; if (renderer) renderer.setSize(view.w, view.h); overlay.width = Math.round(view.w * DPR); overlay.height = Math.round(view.h * DPR); }
    // a shake for heavy blows (a share of the view's height) and a flash of light where a big spell lands
    let shakeA = 0, shT = 0, flashA = 0;
    function applyCam(rdt) {
      const k = REDUCED ? 1 : 1 - Math.exp(-rdt * 4);
      cam.cx += (cam.tx - cam.cx) * k; cam.cy += (cam.ty - cam.cy) * k; cam.s += (cam.ts - cam.s) * k;
      const sMin = Math.max(view.w / IW, view.h / IH), S2 = Math.max(sMin, cam.s);
      let ox = cam.cx * S2 - view.w / 2, oy = cam.cy * S2 - view.h * 0.45;
      shT += rdt; ox += shakeA * view.h * Math.sin(shT * 73); oy += shakeA * view.h * .8 * Math.sin(shT * 59 + 1.3); shakeA *= Math.exp(-rdt * 8);
      if (flashA > .005) { flashA *= Math.exp(-rdt * 6); flashEl.style.opacity = flashA.toFixed(3); } else if (flashA > 0) { flashA = 0; flashEl.style.opacity = '0'; }
      ox = clamp(ox, 0, IW * S2 - view.w); oy = clamp(oy, 0, IH * S2 - view.h);
      ox = Math.round(ox * DPR) / DPR; oy = Math.round(oy * DPR) / DPR;
      camera.setViewOffset(IW * S2, IH * S2, ox, oy, view.w, view.h);
      const tf = 'translate3d(' + (-ox) + 'px,' + (-oy) + 'px,0) scale(' + S2.toFixed(5) + ')';
      if (tf !== lastTf) { paintEl.style.transform = tf; lastTf = tf; }
    }
    const subjectHeight = cfg.subject.frameHeight || 1.1;
    function frameShot() {
      const sp = toPx(tmpV.set(sub.x, subjectHeight, sub.z));
      const wideAct = (cfg.wide && cfg.wide[sub.action]) || (cfg.stage && cfg.stage.wide && cfg.stage.wide(ctx));
      const wide = UI.view === 'full' || (UI.view === 'close' && wideAct);
      if (UI.view === 'square') { cam.tx = IW / 2; cam.ty = IH / 2; cam.ts = 0; return; }
      if (wide) {
        let x0 = sp[0], x1 = sp[0], y0 = sp[1], y1 = sp[1], top = Infinity;
        for (const a of Object.values(actors)) {
          if (!a.visible) continue;
          const p = toPx(tmpV.set(a.x, 1.0, a.z)), q = toPx(tmpV.set(a.x, a.spec.tall || 2.2, a.z));
          x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); top = Math.min(top, q[1]);
        }
        cam.tx = (x0 + x1) / 2; cam.ty = (y0 + y1) / 2 - 18;
        cam.ts = Math.min((view.w - 16) / (x1 - x0 + 230), (view.h - 30) / (y1 - top + 150));
      } else { cam.tx = sp[0]; cam.ty = sp[1] - 6; cam.ts = clamp(0.58 * view.h / (cfg.subject.closeSpan || 110), 1, 8); }
    }

    // ---------- the subject: its home spot, a walk loop, and gliding back ----------
    const S = { prog: -1 };
    const LOOP = { x: 0, z: 0, r: cfg.subject.loopR || 1.0, a: 0 };
    function stepSubject(dt, t) {
      const m = sub.m;
      if (req) {
        if (UI.walk) { UI.walk = false; walkTog.set(false); }
        const name = req; req = null;
        if (cfg.stage && cfg.stage.beforePlay) cfg.stage.beforePlay(ctx, name);
        sub.play(name, true);
      }
      const restAct = m.action && !m.busy; // a hold action that has finished (die, kneel, victory)
      if (UI.walk && restAct) { const back = m.ACTIONS && (m.ACTIONS.appear ? 'appear' : m.ACTIONS.rise ? 'rise' : null); if (back) sub.play(back, true); else if (m.reset) m.reset(); }
      const busy = m.busy, hold = m.action && !m.busy;
      let tx = null, tz = null, speed = 0;
      if (busy && m.dash) { sub.x += Math.sin(sub.yaw) * m.dash * dt; sub.z += Math.cos(sub.yaw) * m.dash * dt; }
      if (UI.walk && !busy && !hold) {
        LOOP.a += dt * (cfg.subject.walkSpeed || 0.8) / LOOP.r;
        tx = LOOP.x + Math.sin(LOOP.a + 0.7) * LOOP.r; tz = LOOP.z + Math.cos(LOOP.a + 0.7) * LOOP.r; speed = cfg.subject.walkSpeed || 0.8;
      } else if (!busy && !hold && Math.hypot(sub.x - sub.home.x, sub.z - sub.home.z) > 0.06) {
        tx = sub.home.x; tz = sub.home.z; speed = Math.min(1.2, 0.3 + 2 * Math.hypot(sub.x - sub.home.x, sub.z - sub.home.z));
      }
      let tyaw;
      if (tx !== null) {
        tyaw = faceYaw(sub, { x: tx, z: tz });
        const go = Math.max(0, Math.cos(wrapA(tyaw - sub.yaw)));
        sub.x += Math.sin(sub.yaw) * speed * go * dt; sub.z += Math.cos(sub.yaw) * speed * go * dt;
        sub.wb = Math.min(1, sub.wb + dt * 2);
      } else {
        sub.wb = Math.max(0, sub.wb - dt * 2);
        tyaw = UI.turn && !busy && !hold ? sub.yaw + 0.9 : sub.home.yaw;
        if (sub.wb === 0 && !busy) LOOP.a = Math.atan2(sub.x - LOOP.x, sub.z - LOOP.z) - 0.7;
      }
      if (!busy || !m.dash) sub.yaw += wrapA(tyaw - sub.yaw) * (1 - Math.exp(-dt * (UI.turn && tx === null ? 0.65 : 3)));
      const tgt = actors[cfg.subject.target] || cast[0];
      if (tgt && m.state && cfg.subject.aim !== false) { tgt.chest(tmpV); m.state.target = { x: tmpV.x, y: tmpV.y, z: tmpV.z }; }
      sub.animate(t, dt);
      const a = sub.action, p = sub.progress;
      if (a !== shownAct) {
        if (shownAct && btns[shownAct]) btns[shownAct].removeAttribute('aria-current');
        shownAct = a; if (a && btns[a]) btns[a].setAttribute('aria-current', 'true');
        setTicks(a && m.ACTIONS ? m.ACTIONS[a] : null); S.prog = -1;
        if (a && cfg.stage && cfg.stage.onAction) cfg.stage.onAction(ctx, a);
      }
      if (a && m.ACTIONS && m.ACTIONS[a]) {
        const def = m.ACTIONS[a];
        (def.hits || []).forEach((h, i) => { if (S.prog < h && p >= h) onHit(a, i); });
        (def.cues || []).forEach((h, i) => { if (S.prog < h && p >= h && cfg.stage && cfg.stage.onCue) cfg.stage.onCue(ctx, a, i); });
        S.prog = p;
      }
      barFill.style.width = ((a ? p : (cfg.stage && cfg.stage.barValue ? cfg.stage.barValue(ctx) : 0)) * 100).toFixed(1) + '%';
      const custom = cfg.stage && cfg.stage.label ? cfg.stage.label(ctx) : null;
      const nm = (cfg.names && cfg.names[a]) || a;
      label(custom || (a ? (hold ? nm + '. Press ' + (cfg.subject.walkLabel || 'Walk') + ' to get up' : nm) : sub.wb > 0.5 ? (cfg.subject.walkLabel || 'Walking') : UI.guard ? 'Guarding' : 'Waiting'));
    }
    function onHit(a, i) {
      if (cfg.stage && cfg.stage.onHit && cfg.stage.onHit(ctx, a, i) !== false) return;
      ring(sub.m.anchor ? sub.m.anchor('hit', new THREE.Vector3()) : sub.chest(new THREE.Vector3()), 'hit');
      const t = cfg.subject.target || (cast[0] && cast[0].id); if (t) damage(t, swing(300));
    }

    function stepCast(rdt, t) {
      for (const a of cast) {
        if (!a.m) continue;
        const dt = rdt * a.ts; a.wt += dt;
        if (a.busy && a.m.dash) { a.x += Math.sin(a.yaw) * a.m.dash * dt; a.z += Math.cos(a.yaw) * a.m.dash * dt; }
        if (a.visible) a.animate(a.wt, dt);
      }
    }

    // ---------- shared helpers for stage hooks ----------
    let darkK = 0;
    const ctx = {
      THREE, scene, camera, fullCam, lightOnly, stage, overlay, night, actors, cast, cfg, UI, g, toPx, toScreen, ring, damage, swing, radialTex, smooth, clamp, faceYaw, wrapA, DPR, REDUCED,
      get subject() { return sub; },
      setDark(k) { darkK = k; night.style.opacity = (k * 0.97).toFixed(3); for (const L of sceneLights) L.o.intensity = L.i * (1 - 0.96 * k); },
      shake(a) { if (!REDUCED) shakeA = Math.max(shakeA, a); },
      flash(a, p3, color) { if (REDUCED) return; flashA = Math.max(flashA, a); if (p3) { const p = toScreen(p3); flashEl.style.setProperty('--fx', p[0] + 'px'); flashEl.style.setProperty('--fy', p[1] + 'px'); } flashEl.style.setProperty('--fc', color || 'rgba(225,205,255,.9)'); flashEl.style.opacity = flashA.toFixed(3); },
      get dark() { return darkK; },
      label, setPressed,
    };

    // ---------- start ----------
    function init() {
      paintEl.src = SC.image.startsWith('data:') ? SC.image : '../' + SC.image;
      renderer = new THREE.WebGLRenderer({ canvas: glCanvas, alpha: true, antialias: true });
      renderer.setPixelRatio(DPR); renderer.setClearColor(0x000000, 0); renderer.localClippingEnabled = true;
      layoutView();
      for (const a of cast) {
        a.build(a.spec.make);
        const f = faceOf(a.spec) || sub.home; a.home.yaw = faceYaw(a.home, f) + (a.spec.yawBias || 0); a.x = a.home.x; a.z = a.home.z; a.yaw = a.home.yaw;
      }
      { const f = faceOf(cfg.subject) || (cast[0] && cast[0].home) || { x: sub.home.x, z: sub.home.z + 1 }; sub.home.yaw = faceYaw(sub.home, f) + (cfg.subject.yawBias || 0); }
      LOOP.x = sub.home.x + 0.2; LOOP.z = sub.home.z - 0.5;
      buildSubject();
      if (cfg.stage && cfg.stage.init) cfg.stage.init(ctx);
      lightOnly(scene);
      new ResizeObserver(() => { layoutView(); }).observe(stage);
      frameShot(); cam.cx = cam.tx; cam.cy = cam.ty; cam.s = cam.ts; applyCam(1);
      let last = performance.now(), t = 0;
      function step(rdt) {
        t += rdt;
        stepSubject(rdt, t);
        if (cfg.stage && cfg.stage.update) cfg.stage.update(ctx, rdt, t);
        stepCast(rdt, t);
        frameShot(); applyCam(rdt);
      }
      function frame(now) {
        const rdt = DBG.freeze ? 0 : Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
        if (!DBG.freeze) step(rdt);
        renderer.render(scene, camera);
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
      // test hooks for headless checks: freeze the clock, then step it by hand
      window.__bench = Object.assign(window.__bench || {}, {
        ready: true, ctx, actors, cam, UI, DBG,
        play(name) { req = name; },
        advance(sec, fps) { const n = Math.max(1, Math.round(sec * (fps || 60))); for (let i = 0; i < n; i++) step(1 / (fps || 60)); cam.cx = cam.tx; cam.cy = cam.ty; cam.s = cam.ts; applyCam(1); renderer.render(scene, camera); },
        setView(mode) { UI.view = mode; },
        setAfter(after) { if (after !== UI.after) { UI.after = after; if (vsBtns) vsBtns.forEach((q, i) => setPressed(q, (i === 1) === after)); buildSubject(); } },
      });
    }
    const DBG = { freeze: false };
    window.__bench = window.__bench || {};
    setTimeout(() => {
      try { init(); }
      catch (err) { label('The scene could not start: ' + err.message + '. This page needs WebGL.'); console.error(err); }
    }, 30);
    return ctx;
  }

  window.Bench = { start, budget };
})();
