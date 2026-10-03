// screen.js: the battle screen (plan steps 12 and 13). The Night square demo's battle (reference/demos/night-square-shadow-wraith.html)
// rebuilt on the finished models, the shared effects (src/fx/battle-fx.js, io-spells.js) and the battle engine
// (src/battle/engine.js), for a party of one or two (Io, Sol) against up to three foes (wraiths, wisps, frost wisps).
// The engine decides every number and every turn; this file plays each turn's log in the painted square: the models'
// own motions, the effects at their hit and cue times, the camera director, the music and sound (sound.js), and the
// numbers rising as each blow lands. The windows, menus, intro, Trance, Lunara and the ending follow the demo; Lunara
// has her Embrace and Silver Requiem from her finished model, Sol her Heat, Sword Arts and Dawnbreaker, and the ending
// adds experience, sunstone shards and the level-up. The page holds the markup and the fight's config
// (demos/first-fight.html, demos/party.html). three.js r128 (global THREE). Defines window.BattleScreen = { start(cfg), markup() }.
// In the game (cfg.game = { onEnd(result) }) the fight begins as soon as its painting loads, the end card's button says
// Continue and hands the result back, and start() returns { stop() }, which shuts the fight down (its loop, listeners,
// renderer and models) so the next fight can start on the same page; markup() gives the stage's inner markup to build it.
(function () {
  'use strict';
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const faceYaw = (from, to) => Math.atan2(to.x - from.x, to.z - from.z);
  const $ = (id) => document.getElementById(id);
  const nf = (n) => Math.round(n).toLocaleString('en-US');
  function el(tag, attrs, parent, text) { const e = document.createElement(tag); if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]); if (text !== undefined) e.textContent = text; if (parent) parent.appendChild(e); return e; }

  // The 3D layer is a transparent canvas over the painting: additive effects must add light only, not alpha (bench.js)
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
    const RL = window.BattleRules, BE = window.BattleEngine;
    const SC = window.SCENES[cfg.scene || 'night-square'];
    const IW = SC.width, IH = SC.height, A = IW / IH, FOV = SC.fov, PITCH = SC.pitch * Math.PI / 180, PXM = SC.ppm;
    const DIST = (IH / 2) / (PXM * Math.tan(FOV / 2 * Math.PI / 180));
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    // the frame rate: the screen's own (measured), or a cap of 60, 45 or 30 frames a second for phones that stutter in
    // the busiest moments. Frames are paced to the screen's refreshes, so 45 and 30 stay even on a 90 Hz phone. The
    // choice is kept in this browser; fps counts the fight's frames for the end card
    const PACE = { cap: 0, due: 0, hz: 0, deltas: [], prev: 0, fps: { n: 0, t: 0, secN: 0, secT: 0, low: 0 } };
    // 30 by default (Chris, October 3): steady on any phone, and it suits the retro look
    PACE.cap = 30;
    try { const v = localStorage.getItem('envoi.fps'); if (v !== null) PACE.cap = +v || 0; } catch (e) { /* storage blocked: 30 */ }
    const REDUCED = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const coarse = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
    const stage = $('stage'), paintCv = $('paint'), paintCtx = paintCv.getContext('2d'), glCanvas = $('gl');
    const paintImg = new Image();
    const PICK = { level: cfg.level || 1, pack: cfg.pack || 0 }; // the fight chosen on the start card (the party page)

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

    // the wraith's route in from the bridge (the first fight), and the Moonwell, where Lunara rises
    const ROUTE = [[1185, 452], [1120, 520], [1000, 690], [860, 800]].map((p) => g(p[0], p[1]));
    const WELL = g(...(SC.summon || [712, 725])), LUN = { x: WELL.x, z: WELL.z - 0.9 };
    const SUMMON_FROM = SC.summonFrom || 'the Moonwell';

    // ---------- camera director: every shot is a point on the painting plus a zoom ----------
    const view = { w: 1, h: 1, uiH: 0 };
    const cam = { cx: 1185, cy: 430, s: 1.4, tx: 1185, ty: 430, ts: 1.4, k: 3, follow: null, fs: 1.5 };
    const shake = { amp: 0, x: 0, y: 0 };
    let renderer = null, lastTf = '';
    function layoutView() {
      view.w = stage.clientWidth; view.h = stage.clientHeight;
      const ui = $('ui'); view.uiH = ui.hidden ? 0 : ui.offsetHeight + 12;
      stage.style.setProperty('--uih', (ui.hidden ? 0 : ui.offsetHeight + 8) + 'px');
      if (renderer) renderer.setSize(view.w, view.h);
      paintCv.width = Math.round(view.w * DPR); paintCv.height = Math.round(view.h * DPR); lastTf = '';
    }
    function shot(cx, cy, s, k) { cam.follow = null; cam.tx = cx; cam.ty = cy; cam.ts = s; cam.k = k || 3; }
    // a giant foe (the great wraith) is framed by its whole height: close-ups on it aim higher and pull back
    const bigAt = (p) => foes.find((f) => f.pos === p && f.tall > 3);
    function shotAt(p, s, k, lift) {
      const big = lift === undefined && bigAt(p);
      if (big) { lift = big.tall * 0.45; s /= 1.7; }
      const q = toPx(tmpV.set(p.x, lift === undefined ? 1.1 : lift, p.z)); shot(q[0], q[1], s, k);
    }
    function followShot(getPos, s, k) { cam.follow = getPos; cam.fs = s; cam.k = k || 3; }
    function shotBoth(a, b, zoom, k) {
      if (bigAt(a) || bigAt(b)) { const pts = []; for (const p of [a, b]) { const f = bigAt(p); pts.push({ x: p.x, y: 0, z: p.z }, { x: p.x, y: f ? f.tall : 2.2, z: p.z }); } shotFit(pts, Math.min(1, zoom), k); return; }
      const pa = toPx(tmpV.set(a.x, 1.1, a.z)), pb = toPx(tmpV.set(b.x, 1.1, b.z));
      const needW = Math.abs(pa[0] - pb[0]) + 175, needH = 250;
      const availH = Math.max(120, view.h - view.uiH - 50);
      const s = Math.min((view.w - 16) / needW, availH / needH) * (zoom || 1);
      shot((pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2 - 18, s, k);
    }
    // the wide shot: every point (with a height) in frame, for summons, big attacks and the whole field
    function shotFit(pts, zoom, k) {
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      for (const p of pts) { const q = toPx(tmpV.set(p.x, p.y || 0, p.z)); x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); }
      const availH = Math.max(120, view.h - view.uiH - 40), s = Math.min((view.w - 16) / (x1 - x0 + 120), availH / (y1 - y0 + 70)) * (zoom || 1);
      shot((x0 + x1) / 2, (y0 + y1) / 2, s, k);
    }
    // everyone still standing, heads included
    function shotField(k) {
      const pts = [];
      for (const f of standing()) {
        pts.push({ x: f.pos.x, y: 0, z: f.pos.z }, { x: f.pos.x, y: f.tall, z: f.pos.z });
        const w = (f.look && f.look.halfW) || 0; // a sprawling foe (the Bramble Horror's canes) is framed by its width too
        if (w) pts.push({ x: f.pos.x + w, y: 0, z: f.pos.z }, { x: f.pos.x - w, y: 0, z: f.pos.z });
      }
      if (pts.length) shotFit(pts, 1, k || 2);
    }
    function addShake(px) { if (!REDUCED) shake.amp = Math.max(shake.amp, px); if (BF) BF.shake(px); }
    function applyCam(rdt) {
      if (cam.follow) { const p = cam.follow(); const q = toPx(tmpV.set(p.x, 1.1, p.z)); cam.tx = q[0]; cam.ty = q[1]; cam.ts = cam.fs; }
      const k = REDUCED ? 1 : 1 - Math.exp(-rdt * cam.k);
      cam.cx += (cam.tx - cam.cx) * k; cam.cy += (cam.ty - cam.cy) * k; cam.s += (cam.ts - cam.s) * k;
      const sMin = Math.max(view.w / IW, view.h / IH), S2 = Math.max(sMin, cam.s);
      const midY = (view.h - view.uiH) / 2 + 20;
      shake.amp *= Math.exp(-rdt * 7);
      shake.x = (Math.random() - 0.5) * 2 * shake.amp; shake.y = (Math.random() - 0.5) * 2 * shake.amp;
      let ox = cam.cx * S2 - view.w / 2 + shake.x, oy = cam.cy * S2 - midY + shake.y;
      ox = clamp(ox, 0, IW * S2 - view.w); oy = clamp(oy, 0, IH * S2 - view.h);
      ox = Math.round(ox * DPR) / DPR; oy = Math.round(oy * DPR) / DPR;
      camera.setViewOffset(IW * S2, IH * S2, ox, oy, view.w, view.h);
      // the painting is drawn into a canvas the size of the stage, only the part the camera shows (bench.js)
      const tf = ox + ',' + oy + ',' + S2.toFixed(5) + ',' + view.w + ',' + view.h + ',' + TOWN.ver;
      if (tf !== lastTf && paintImg.complete && paintImg.naturalWidth) {
        paintCtx.imageSmoothingEnabled = true; paintCtx.imageSmoothingQuality = 'high';
        paintCtx.drawImage(paintImg, ox / S2, oy / S2, view.w / S2, view.h / S2, 0, 0, paintCv.width, paintCv.height);
        drawTown(ox, oy, S2);
        lastTf = tf;
      }
    }
    // the red storm over the painting's sky in a boss's second phase (the Colossus's Wrath): a red wash down to the
    // painting's skyline, wherever the camera is, and red lightning now and then
    const SKY = { v: 0, to: 0, bolt: 0 };
    const skyTo = (v) => { SKY.to = v; };
    function lightning(k) {
      if (SKY.v < 0.3) return;
      SKY.bolt = k; UI.flash('#ff7a5a', 0.28 * k, 0.3); addShake(5 * k);
      setTimeout(() => SND.sfx.boom(0.5 + 0.5 * k), 350 + Math.random() * 500);
    }
    function stepSky(rdt) {
      SKY.v += (SKY.to - SKY.v) * Math.min(1, rdt * 0.6); SKY.bolt = Math.max(0, SKY.bolt - rdt * 3);
      const el2 = $('sky'); if (!el2) return;
      const a = Math.min(1, SKY.v * 0.85 + SKY.bolt * 0.5);
      el2.style.opacity = a > 0.003 ? a.toFixed(3) : '0';
      // the painting's skyline on screen: its row, through the camera as it stands
      if (a > 0.003) { const q = g(IW / 2, (BF && BF.air.sky) || 190), y = toScreen(tmpV.set(q.x, 0, q.z))[1]; el2.style.setProperty('--skyline', Math.max(40, y + 50).toFixed(0) + 'px'); }
    }
    // the painted windows that light again when a scene's stolen lamplight comes home (Bogmire): warm glows drawn over
    // the painting, each fading in when its light arrives
    const TOWN = { a: (SC.windows || []).map(() => 0), to: (SC.windows || []).map(() => 0), ver: 0, stars: 0, starsTo: 0, field: null };
    function stepTown(rdt) {
      let changed = false;
      if (Math.abs(TOWN.starsTo - TOWN.stars) > 0.003) { TOWN.stars += (TOWN.starsTo - TOWN.stars) * Math.min(1, rdt * 0.8); changed = true; }
      for (let i = 0; i < TOWN.a.length; i++) { const d = TOWN.to[i] - TOWN.a[i]; if (Math.abs(d) > 0.004) { TOWN.a[i] += d * Math.min(1, rdt * 2.4); changed = true; } else if (d) { TOWN.a[i] = TOWN.to[i]; changed = true; } }
      if (changed) TOWN.ver++;
    }
    // the stars coming back over the painted sky at the end (the scene's `sky` box), brighter ones with a soft glow
    function drawStars(ox, oy, S2) {
      const sk = SC.sky; if (!sk || TOWN.stars < 0.01) return;
      if (!TOWN.field) { TOWN.field = []; for (let i = 0; i < 260; i++) TOWN.field.push([sk[0] + Math.random() * (sk[2] - sk[0]), sk[1] + Math.pow(Math.random(), 1.3) * (sk[3] - sk[1]), Math.random()]); }
      const c = paintCtx; c.save(); c.globalCompositeOperation = 'lighter';
      for (const [u, v, b] of TOWN.field) {
        const x = (u * S2 - ox) * DPR, y = (v * S2 - oy) * DPR, a = TOWN.stars * (0.35 + 0.65 * b), r = (0.6 + 1.6 * b * b) * DPR * Math.max(1, S2 * 0.8);
        if (b > 0.8) { const g = c.createRadialGradient(x, y, 0, x, y, r * 5); g.addColorStop(0, 'rgba(220,230,255,' + (0.35 * a).toFixed(3) + ')'); g.addColorStop(1, 'rgba(220,230,255,0)'); c.fillStyle = g; c.fillRect(x - r * 5, y - r * 5, r * 10, r * 10); }
        c.fillStyle = 'rgba(245,248,255,' + a.toFixed(3) + ')'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
      }
      c.restore();
    }
    function drawTown(ox, oy, S2) {
      drawStars(ox, oy, S2);
      if (!TOWN.a.some((a) => a > 0.01)) return;
      const c = paintCtx; c.save(); c.globalCompositeOperation = 'lighter';
      SC.windows.forEach(([u, v], i) => {
        const a = TOWN.a[i]; if (a <= 0.01) return;
        const x = (u * S2 - ox) * DPR, y = (v * S2 - oy) * DPR, r = 13 * S2 * DPR;
        let g = c.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, 'rgba(255,236,190,' + (0.95 * a).toFixed(3) + ')'); g.addColorStop(0.45, 'rgba(255,176,90,' + (0.6 * a).toFixed(3) + ')'); g.addColorStop(1, 'rgba(255,140,60,0)');
        c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
        const R = r * 3.2; g = c.createRadialGradient(x, y, 0, x, y, R);
        g.addColorStop(0, 'rgba(255,170,80,' + (0.22 * a).toFixed(3) + ')'); g.addColorStop(1, 'rgba(255,150,60,0)');
        c.fillStyle = g; c.fillRect(x - R, y - R, R * 2, R * 2);
      });
      c.restore();
    }
    function toScreen(p) { tmpV.copy(p).project(camera); return [(tmpV.x + 1) / 2 * view.w, (1 - tmpV.y) / 2 * view.h, tmpV.z]; }

    // ---------- effects and sound ----------
    const FX = window.makeBattleFX();
    const IOS = window.makeIoSpells ? window.makeIoSpells(FX) : null;
    const SND = cfg.sound || window.makeBattleSound();
    // listeners on the window, kept so stop() can take them off again
    const offs = []; let ro = null;
    const on = (t, ty, fn) => { t.addEventListener(ty, fn); offs.push([t, ty, fn]); };

    // ---------- the fighters and the battle's state ----------
    const F = {};                 // fighter by the engine's unit key
    let heroes = [], foes = [];
    let LU = null;                // Lunara
    let EN = null;                // Envoi, when the page has it (from Dawnroost on)
    let BF = null;                // the living battlefield (battlefield.js): the painting's air, and how it answers the fight
    let E = null;                 // the engine
    const D = {};                 // what the player has been shown so far, per unit
    const S = { trace: [], state: 'boot', acting: false, t0: 0, skip: false, auto: cfg.auto || null, rand: null, result: null, dealt: 0, guard: {}, rime: 0, rimeOn: false, choosing: null, known: false };
    const standing = () => heroes.concat(foes).filter((f) => !f.out && f.m.root.visible);
    const living = (side) => (side === 'hero' ? heroes : foes).filter((f) => D[f.key] && D[f.key].hp > 0 && !f.out);
    // the heroes the foes can reach: Sol is out of reach while she hovers for Kestrel Stoop
    const reach = () => living('hero').filter((h) => !D[h.key].aloft);
    // a foe the party doesn't know yet goes by what they see (the ambush: the Gloam Knight, until Sol knows her stance)
    const shownName = (u) => (cfg.alias && cfg.alias[u.id] && !S.known ? cfg.alias[u.id] : u.name);

    // ---------- interface: the demo's windows and menus, for a party ----------
    const UI = (() => {
      const cmdEl = $('cmd'), bannerEl = $('banner'), msgEl = $('msg'), numsEl = $('nums'), flashEl = $('flash'), vigEl = $('vignette'), markEl = $('marker');
      const HAND = '<svg class="hand" viewBox="0 0 26 16" aria-hidden="true"><path d="M1 5.5h10.5c.9 0 1.6.7 1.6 1.6v.1h9.3a1.6 1.6 0 0 1 0 3.2h-9.3v.3c0 .9-.7 1.6-1.6 1.6H11v.2c0 .9-.7 1.6-1.6 1.6H4.2A3.2 3.2 0 0 1 1 10.9Z" fill="#fff" stroke="#2c3160" stroke-width="1.2"/></svg>';
      let items = [], sel = 0, cb = null, onSel = null, bannerTO = 0, flashA = 0, flashDur = 0.3, markOn = null;
      function render(list, title) {
        items = list; cmdEl.innerHTML = '';
        if (title) el('div', { class: 'title' }, cmdEl, title);
        list.forEach((it, i) => {
          const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'menuitem');
          b.innerHTML = HAND + '<span class="lb"></span>' + (it.tag ? '<span class="mp"></span>' : '');
          b.querySelector('.lb').textContent = it.label; if (it.tag) b.querySelector('.mp').textContent = it.tag;
          if (it.hot) b.classList.add('hot'); if (it.disabled) b.disabled = true;
          b.addEventListener('click', () => pick(i));
          b.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse' && !it.disabled) setSel(i); });
          cmdEl.appendChild(b);
        });
        let first = list.findIndex((it) => it.first && !it.disabled);
        if (first < 0) first = Math.max(0, list.findIndex((it) => !it.disabled));
        setSel(first);
        if (!coarse) { const bs = cmdEl.querySelectorAll('button'); if (bs[sel]) bs[sel].focus({ preventScroll: true }); }
      }
      function setSel(i) { sel = i; cmdEl.querySelectorAll('button').forEach((b, k) => b.classList.toggle('sel', k === i)); if (onSel) onSel(items[i]); }
      function move(d) {
        if (!cb || !items.length) return; let i = sel;
        for (let k = 0; k < items.length; k++) { i = (i + d + items.length) % items.length; if (!items[i].disabled) break; }
        setSel(i); const b = cmdEl.querySelectorAll('button')[i]; if (b && !coarse) b.focus({ preventScroll: true }); SND.sfx.menu();
      }
      function pick(i) { const it = items[i]; if (!it || it.disabled || !cb) return; const f = cb; SND.sfx.select(); f(it.id); }
      function open(list, title, fn, selFn) { cb = fn; onSel = selFn || null; render(list, title); }
      function waitMenu() { cb = null; onSel = null; items = []; cmdEl.innerHTML = '<div class="wait">Waiting…</div>'; mark(null); }
      on(window, 'keydown', (e) => {
        if (!cb) return;
        if (e.key === 'ArrowDown') { move(1); e.preventDefault(); }
        else if (e.key === 'ArrowUp') { move(-1); e.preventDefault(); }
        else if (e.key === 'Enter' || e.key === ' ') { if (document.activeElement && document.activeElement.tagName === 'BUTTON' && cmdEl.contains(document.activeElement)) return; pick(sel); e.preventDefault(); }
        else if (e.key === 'Escape' || e.key === 'Backspace') { if (items.some((it) => it.id === 'back')) { SND.sfx.menu(); cb('back'); e.preventDefault(); } }
      });
      function banner(text, dur) { bannerEl.textContent = text; bannerEl.classList.add('on'); clearTimeout(bannerTO); bannerTO = setTimeout(() => bannerEl.classList.remove('on'), (dur || 1.4) * 1000); }
      function msg(text, low) { msgEl.textContent = text; msgEl.classList.toggle('low', !!low); msgEl.classList.add('on'); }
      function hideMsg() { msgEl.classList.remove('on'); }
      let noteTO = 0;
      function note(text, sec) { msg(text, true); clearTimeout(noteTO); noteTO = setTimeout(hideMsg, (sec || 1.5) * 1000); }
      // a number is placed as soon as it is made, so it never shows for a frame in the corner
      const nums = [];
      function place(n) {
        const u = n.t / n.dur, s = toScreen(n.p), rise = 44 * (1 - Math.pow(1 - Math.min(1, u * 1.6), 3)), pop = u < 0.12 ? 1.4 - u * 3.3 : 1;
        n.el.style.transform = 'translate(' + (s[0] + n.dx).toFixed(1) + 'px,' + (s[1] - 34 - rise - n.dy).toFixed(1) + 'px) translate(-50%,-50%) scale(' + pop.toFixed(3) + ')';
        n.el.style.opacity = String(u > 0.75 ? 1 - (u - 0.75) / 0.25 : 1);
      }
      function number(p, text, cls, dy) {
        const e = document.createElement('div'); e.className = 'num' + (cls ? ' ' + cls : ''); e.textContent = String(text);
        const n = { el: e, p: new THREE.Vector3(p.x, p.y, p.z), t: 0, dur: 1.2, dx: rnd(-16, 16), dy: dy || 0 };
        place(n); numsEl.appendChild(e); nums.push(n);
      }
      // the arrow over the fighter a menu is pointing at
      function mark(f) { markOn = f; markEl.hidden = !f; }
      function flash(color, peak, dur) { if (REDUCED) peak *= 0.3; flashEl.style.background = color; flashA = Math.max(flashA, peak); flashDur = dur; }
      function vignette(v) { vigEl.style.opacity = String(v); }
      function tint(v) { $('tint').style.opacity = String(v); }
      function cinematic(on) { stage.classList.toggle('cine', !!on); }
      // the party's window: each hero's HP, MP or Heat, turn gauge and Trance; the foes' window: each name and HP
      const rows = {};
      function buildWindows() {
        for (const k in rows) delete rows[k];
        const st = $('status'); st.textContent = ''; st.classList.toggle('solo', heroes.length === 1);
        for (const h of heroes) {
          const u = E.unit(h.key), r = el('div', { class: 'hero' }, st);
          const nm = el('div', { class: 'name' }, r); el('span', null, nm, u.name); const lv = el('small', null, nm, 'Level ' + u.level); const tg = el('span', { class: 'ttag' }, nm, 'Trance');
          const line = el('div', { class: 'stat' }, r);
          el('span', { class: 'lbl' }, line, 'HP'); const hp = el('span', { class: 'v' }, line); const hpm = el('span', { class: 'm' }, line);
          const second = el('span', { class: 'sec' }, line); el('span', { class: 'lbl' }, second, h.key === 'sol' ? 'Heat' : 'MP'); const sv = el('span', { class: 'sv' }, second);
          const gs = el('div', { class: 'gs' }, r);
          const ga = el('div', { class: 'gw' }, gs); el('span', null, ga, 'Turn'); const atb = el('div', { class: 'gauge atb' }, ga); el('i', null, atb);
          const gb = el('div', { class: 'gw' }, gs); el('span', null, gb, 'Trance'); const tr = el('div', { class: 'gauge tr' }, gb); el('i', null, tr);
          rows[h.key] = { r, lv, tg, hp, hpm, sv, atb, tr, last: {} };
        }
        const en = $('enemy'); en.textContent = '';
        for (const f of foes) {
          const u = E.unit(f.key), r = el('div', { class: 'foe' }, en);
          const nm = el('div', { class: 'ename' }, r), label = el('span', null, nm, shownName(u)); el('small', null, nm, 'Level ' + u.level);
          const cold = u.def.rage ? el('small', { class: 'cold' }, nm, '') : null;
          // a boss with a second phase (the Colossus's Wrath at half its HP): a mark on its bar, and its phase and heart
          const two = !!u.def.moves.enrage, phase = two ? el('small', { class: 'phase' }, nm, '') : null;
          const ga = el('div', { class: 'gauge' }, r), i = el('i', { class: 'ehp' }, ga);
          if (two) { el('b', { class: 'wmark', 'aria-hidden': 'true' }, ga); r.classList.add('boss'); }
          const heart = u.def.heart ? el('div', { class: 'heart', hidden: '' }, r, 'Heart bare: blows land double') : null;
          rows[f.key] = { r, i, label, cold, phase, heart, last: {} };
        }
      }
      const set = (row, k, v, fn) => { if (row.last[k] !== v) { row.last[k] = v; fn(v); } };
      function status() {
        if (!E) return;
        for (const h of heroes) {
          const u = E.unit(h.key), d = D[h.key], R = rows[h.key]; if (!R || !u) continue;
          set(R, 'hp', d.hp, (v) => { R.hp.textContent = nf(v); R.hp.classList.toggle('low', v < u.maxHp * 0.5 && v >= u.maxHp * 0.25); R.hp.classList.toggle('crit', v < u.maxHp * 0.25); R.r.classList.toggle('down', v <= 0); });
          set(R, 'hpm', u.maxHp, (v) => { R.hpm.textContent = '/' + nf(v); });
          if (h.key === 'sol') set(R, 'heat', d.heat + (d.inTrance ? 1000 : 0), () => { R.sv.textContent = d.heat; R.sv.classList.toggle('burn', d.heat >= 70 || d.inTrance); });
          else set(R, 'mp', d.mp, (v) => { R.sv.textContent = v; });
          set(R, 'lv', u.level, (v) => { R.lv.textContent = 'Level ' + v; });
          const atb = S.state !== 'battle' || d.hp <= 0 ? 0 : (S.choosing === h.key ? 1 : Math.min(1, u.atb));
          set(R, 'atb', Math.round(atb * 200), () => { R.atb.firstChild.style.width = (atb * 100).toFixed(1) + '%'; R.atb.classList.toggle('full', atb >= 1); });
          set(R, 'tr', Math.round(d.tr * 200) + (d.inTrance ? 1000 : 0), () => { R.tr.firstChild.style.width = (Math.min(1, d.tr) * 100).toFixed(1) + '%'; R.tr.classList.toggle('full', d.inTrance); });
          set(R, 'tag', d.inTrance, (v) => R.tg.classList.toggle('on', v));
          set(R, 'turn', S.choosing === h.key, (v) => R.r.classList.toggle('turn', v));
        }
        for (const f of foes) {
          const u = E.unit(f.key), d = D[f.key], R = rows[f.key]; if (!R || !u) continue;
          set(R, 'hp', Math.round(d.hp / u.maxHp * 400), () => { R.i.style.width = (d.hp / u.maxHp * 100).toFixed(1) + '%'; R.r.classList.toggle('down', d.hp <= 0); });
          // the finale's deepening cold: how much harder her blows (and Halcyon's) land now
          if (R.phase) set(R, 'wrath', !!f.wrathShown, (v) => { R.phase.textContent = v ? 'Wrath' : ''; R.r.classList.toggle('wrath', v); });
          if (R.heart) set(R, 'heart', !!f.openShown && d.hp > 0, (v) => { R.heart.hidden = !v; });
          if (R.cold) set(R, 'cold', u.acted, (v) => { R.cold.textContent = v ? 'Cold +' + Math.round(u.rage * v * 100) + '%' : ''; const c = $('cold'); if (c) c.style.opacity = String(Math.min(0.95, 0.07 * v)); });
        }
      }
      function update(rdt) {
        for (let i = nums.length - 1; i >= 0; i--) {
          const n = nums[i]; n.t += rdt;
          if (n.t >= n.dur) { n.el.remove(); nums.splice(i, 1); continue; }
          place(n);
        }
        if (flashA > 0) { flashA = Math.max(0, flashA - rdt / flashDur); flashEl.style.opacity = String(flashA); }
        if (markOn) {
          const s = toScreen(tmpV.set(markOn.pos.x, markOn.tall + 0.2 + (markOn.m.lift || 0), markOn.pos.z));
          markEl.style.transform = 'translate(' + s[0].toFixed(1) + 'px,' + s[1].toFixed(1) + 'px) translate(-50%,-100%)';
        }
      }
      function showBattle(on) { $('ui').hidden = !on; $('enemy').hidden = !on; }
      return {
        open, waitMenu, banner, msg, hideMsg, note, number, mark, flash, vignette, tint, cinematic, status, update, showBattle, buildWindows,
        rename(key, text) { if (rows[key] && rows[key].label) rows[key].label.textContent = text; },
        hideEnemy() { $('enemy').hidden = true; }, get menuOpen() { return !!cb; },
        pickId(id) { const i = items.findIndex((it) => it.id === id); if (i >= 0) pick(i); return i >= 0; },
      };
    })();

    // ---------- game clock: hit-stop, slow motion, awaitable waits ----------
    const clock = { t: 0, scale: 1, stop: 0, slowT: 0, turbo: 1 };
    const waits = [];
    const wait = (sec) => new Promise((res) => waits.push({ at: clock.t + sec, res }));
    const until = (fn) => new Promise((res) => waits.push({ fn, res }));
    function tickWaits() { for (let i = waits.length - 1; i >= 0; i--) { const w = waits[i]; if (w.fn ? w.fn() : clock.t >= w.at) { waits.splice(i, 1); w.res(); } } }
    const hitStop = (sec) => { if (!REDUCED) clock.stop = Math.max(clock.stop, sec); };
    const untilP = (m, u) => until(() => m.progress < 0 || m.progress >= u);
    const V = () => new THREE.Vector3();

    // ---------- fighters ----------
    let scene = null;
    function fighter(key, m, look, home) {
      return {
        key, m, look, kind: look.kind, tall: look.tall || 2, pos: { x: home.x, z: home.z }, home, yaw: home.yaw, tyaw: home.yaw,
        phase: 0, wb: 0, target: null, speed: 0, res: null, spin: 0, aim: null, aimAt: null, stop: look.stop || 0.9, out: false, trance: 0,
      };
    }
    function moveTo(a, x, z, speed) { return new Promise((res) => { if (a.res) a.res(); a.target = { x, z }; a.speed = speed; a.res = res; }); }
    function stepActor(a, dt) {
      let moved = 0;
      if (a.target) {
        const dx = a.target.x - a.pos.x, dz = a.target.z - a.pos.z, d = Math.hypot(dx, dz), st = Math.min(d, a.speed * dt);
        if (d > 1e-4) { a.pos.x += dx / d * st; a.pos.z += dz / d * st; a.tyaw = Math.atan2(dx, dz); moved = st; }
        if (d - st < 1e-3) { a.target = null; const r = a.res; a.res = null; if (r) r(); }
      }
      // a model's own lunges and knockbacks move it; a lunge at a foe runs along the line to it and stops short of it
      if (a.m.busy && a.m.dash && dt > 0) {
        let d = a.m.dash * dt, dx = Math.sin(a.yaw), dz = Math.cos(a.yaw);
        if (a.aim && d > 0) { const ex = a.aim.pos.x - a.pos.x, ez = a.aim.pos.z - a.pos.z, r = Math.hypot(ex, ez); if (r > 1e-3) { dx = ex / r; dz = ez / r; } d = Math.min(d, Math.max(0, r - a.stop - ((a.aim.look && a.aim.look.reach) || 0))); }
        a.pos.x += dx * d; a.pos.z += dz * d;
      }
      if (a.spin > 0) { const s = Math.min(a.spin, dt * 9); a.yaw += s; a.spin -= s; }
      else { let dy = a.tyaw - a.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); a.yaw += dy * Math.min(1, dt * 10); }
      return moved;
    }
    const chest = (f) => f.m.anchor('chest', V());
    const head = (f) => f.m.anchor('head', V());
    function toward(from, to, dist) { const dx = to.x - from.x, dz = to.z - from.z, d = Math.hypot(dx, dz) || 1; return { x: to.x - dx / d * dist, z: to.z - dz / d * dist }; }
    const mid = (a, b) => ({ x: (a.x + b.x) / 2, z: (a.z + b.z) / 2 });
    const io = () => F.io;
    const firstFoe = () => living('foe')[0] || foes[0];
    function faceTo(a, b) { a.tyaw = faceYaw(a.pos, b.pos); }
    async function runUp(a, t, dist, speed) {
      const spot = toward(a.pos, t.pos, dist + ((t.look && t.look.reach) || 0));
      await moveTo(a, spot.x, spot.z, speed || 4.2);
      faceTo(a, t); await wait(0.12);
    }
    async function goHome(a, speed) { if (Math.hypot(a.pos.x - a.home.x, a.pos.z - a.home.z) > 0.05) await moveTo(a, a.home.x, a.home.z, speed || 4.2); a.tyaw = a.home.yaw; }

    // ---------- the engine, and the numbers shown so far ----------
    // The engine resolves each action at once; D holds what the player has been shown, and catches up blow by blow
    function newEngine() {
      const seed = cfg.seed || (1 + Math.floor(Math.random() * 1e9));
      S.rand = BE.rng(seed * 2654435761 + 97);
      E = BE.create(Object.assign({ seed }, cfg.fight(PICK.level, PICK.pack)));
      for (const k in D) delete D[k];
      for (const u of E.units) D[u.key] = { hp: u.hp, mp: u.mp, heat: u.heat || 0, tr: u.trance || 0, inTrance: false };
      S.dealt = 0; S.guard = {}; S.choosing = null;
    }
    function sync() {
      for (const u of E.units) { const d = D[u.key]; d.hp = u.hp; d.mp = u.mp; d.heat = u.heat || 0; d.tr = u.inTrance ? 1 : u.trance; d.inTrance = u.inTrance; }
    }

    // A move's events in order: show() brings on the next blow or heal (and whatever it caused), rest() the remainder
    function events(list) {
      let i = 0;
      const isBlow = (e) => e.t === 'hit' || e.t === 'heal' || e.t === 'miss' || e.t === 'revive' || e.t === 'ward';
      return {
        has() { for (let k = i; k < list.length; k++) if (isBlow(list[k])) return true; return false; },
        peek() { for (let k = i; k < list.length; k++) if (isBlow(list[k])) return list[k]; return null; },
        show(o) {
          while (i < list.length && !isBlow(list[i])) apply(list[i++], o);
          if (i < list.length) apply(list[i++], o);
          while (i < list.length && !isBlow(list[i])) apply(list[i++], o);
        },
        // a blow on everyone at once: every blow of the same kind in a row
        showAll(o) { const e = this.peek(); if (!e) return; const t = e.t; while (this.peek() && this.peek().t === t) this.show(o); },
        rest(o) { while (i < list.length) apply(list[i++], o); },
        get list() { return list; },
      };
    }
    const word = (f, text, cls) => UI.number(head(f), text, cls || 'word', 18);
    function apply(e, o) {
      o = o || {};
      const to = e.to ? F[e.to] : null, who = e.who ? F[e.who] : null;
      if (e.t === 'hit') {
        const from = E.unit(e.from), d = D[e.to], u = E.unit(e.to);
        d.hp = Math.max(0, d.hp - e.n);
        const big = o.big || e.n >= 300 * RL.scale(from ? from.level : 1);
        if (u.side === 'foe') {
          S.dealt += e.n;
          // the Colossus's bare heart: the blow lands there, double
          if (e.weak) {
            const hp = to.m.anchor('heart', V()); UI.number(hp, nf(e.n), 'big weak'); word(to, 'Weak point!', 'weak');
            FX.ring(hp, 0xff7aa8, 0.1, 1.2, 0.35, 1); FX.flashLight(hp, 0xff5a8a, 3, 0.25);
            if (!S.heartSeen) { S.heartSeen = true; UI.note('Its heart is bare: every blow lands double while its flower is open.', 2.6); }
          } else UI.number(chest(to), nf(e.n), big ? 'big' : '');
          if (d.hp > 0 && !(u.vow > 0) && !u.charging) to.m.play('hurt');
          const df = D[e.from]; if (df && !df.inTrance && from && from.side === 'hero') df.tr = Math.min(0.99, df.tr + RL.TRANCE.dealt);
        } else {
          if (E.lunara === 1) FX.burst(chest(to), [0.8, 0.88, 1], 18, 2.2);
          UI.number(chest(to), nf(e.n), e.guard ? 'small' : '');
          if (d.hp <= 0) to.m.play('kneel', true); else to.m.play(e.guard ? 'block' : 'hurt', true);
          if (e.guard && to.key === 'io') FX.shieldHit();
          if (to.key === 'sol' && !d.inTrance) d.heat = Math.min(100, d.heat + 10);
          if (!d.inTrance && d.hp > 0) d.tr = Math.min(1, d.tr + e.n / u.maxHp * RL.TRANCE.taken);
        }
      } else if (e.t === 'heal') {
        const u = E.unit(e.to), d = D[e.to];
        d.hp = Math.min(u.maxHp, d.hp + e.n);
        UI.number(chest(to), nf(e.n), 'heal');
      } else if (e.t === 'revive') {
        D[e.who].hp = e.n; who.m.play('rise', true); UI.number(chest(who), nf(e.n), 'heal'); word(who, 'Back up', 'heal');
      } else if (e.t === 'miss') word(to, e.aloft ? 'Out of reach' : 'Miss');
      else if (e.t === 'hover') D[e.who].aloft = true;
      else if (e.t === 'ward') wardHit();
      else if (e.t === 'tranceReady') {
        D[e.who].tr = 1; SND.sfx.chime(); FX.burst(chest(who), [1, 0.92, 1], 30, 2.5);
        UI.note(E.unit(e.who).name + '’s Trance gauge is full.');
      } else if (e.t === 'bound') word(to, 'Bound');
      else if (e.t === 'sundered') word(to, 'Sundered');
      else if (e.t === 'sever') word(to, 'Severed');
      else if (e.t === 'severed') word(to, 'Can’t be healed');
      else if (e.t === 'cover') word(who, 'Guard');
      else if (e.t === 'counter') word(who, 'Counter');
      else if (e.t === 'scorch') {
        who.m.play(e.heart ? 'hurt' : 'burn', true);
        if (e.broke && who.kind === 'colossus') { who.charged = false; who.openShown = false; word(who, 'Bloom broken'); UI.note(e.heart ? 'A great blow to its bare heart: it shuts its flower, and the bloom is broken.' : 'The fire makes it recoil and shut its flower: the bloom is broken.', 2.4); }
        else if (e.broke) { who.charged = false; word(who, 'Lure broken'); UI.note('The flame breaks the lure. Its prey is free.', 2); }
        else { word(who, 'Recoils'); if (!S.scorchSeen) { S.scorchSeen = true; UI.note('It fears fire: the flame makes it recoil, and its next turn comes later.', 2.4); } }
      } else if (e.t === 'cane') {
        if (who.m.sever) who.m.sever();
        word(who, 'Cane severed');
        if (!S.caneSeen) { S.caneSeen = true; UI.note('A heavy blade blow severs a cane. Every cane it loses takes some force from its blows.', 2.6); }
      } else if (e.t === 'held') { word(to, 'Held'); UI.note(E.unit(e.to).name + ' is dragged to its crown. Her turn starts over.', 2.2); }
      else if (e.t === 'sap') {
        if (e.what === 'heat') { D[e.to].heat = Math.max(0, D[e.to].heat - e.n); if (e.n) word(to, '−' + e.n + ' Heat', 'heat'); }
        else { D[e.to].mp = Math.max(0, D[e.to].mp - e.n); if (e.n) word(to, '−' + e.n + ' MP'); }
      }
      else if (e.t === 'oath') word(who, 'Warden’s Oath');
      else if (e.t === 'open') { who.openShown = true; }
      else if (e.t === 'shut') { who.openShown = false; }
      else if (e.t === 'charmed') word(to, 'Charmed');
      else if (e.t === 'wrath') { who.wrathShown = true; if (who.m.state) who.m.state.wrath = 1; if (BF) { BF.storm(1); BF.roar(1.2); } skyTo(1); }
      else if (e.t === 'heat') { D[e.to].heat = Math.min(100, D[e.to].heat + e.n); word(to, '+' + e.n + ' Heat', 'heat'); }
      else if (e.t === 'mp') { D[e.to].mp = Math.min(E.unit(e.to).maxMp, D[e.to].mp + e.n); word(to, '+' + e.n + ' MP', 'heal'); }
      else if (e.t === 'burn') { D[e.to].hp = Math.max(1, D[e.to].hp - e.n); UI.number(chest(to), nf(e.n), 'burn'); }
      else if (e.t === 'might') { for (const f of living('hero')) word(f, 'Blows +' + Math.round(e.n * 100) + '%', 'heat'); UI.note('Every blow the party lands is ' + Math.round(e.n * 100) + '% harder for the rest of the fight.', 2.2); }
      else if (e.t === 'frost') { S.rimeOn = true; }
      else if (e.t === 'frostEnds') { S.rimeOn = false; if (e.by === 'envoi') UI.note('Envoi’s fire ends the frost’s slow.', 1.8); }
      else if (e.t === 'down') {
        const u = E.unit(e.who);
        if (u.side === 'foe') {
          D[e.who].hp = 0; who.out = true; const da = who.look.downAct || 'die'; if (da !== 'none') who.m.play(da, true); SND.sfx.shriek(0.9);
          if (who.look.downNote) UI.note(who.look.downNote, 2.6);
          if (!living('foe').length) { clock.scale = 0.25; clock.slowT = 1.2; UI.cinematic(true); }
        } else { D[e.who].hp = 0; D[e.who].inTrance = false; D[e.who].tr = 0; who.trance = 0; if (who.m.action !== 'kneel') who.m.play('kneel', true); }
      } else if (e.t === 'tranceEnds') {
        D[e.who].inTrance = false; D[e.who].tr = 0;
        if (!o.quiet) UI.note(E.unit(e.who).name + '’s Trance fades.', 1.3);
      }
    }

    // ---------- melee: a blow lands on a foe ----------
    function strikeFx(t, big, color, rot) {
      const p = chest(t);
      FX.slash(p, color || 0xffffff, rot === undefined ? rnd(-0.6, 2.6) : rot, big ? 1.3 : 1.05, 0.3); FX.burst(p, [1, 0.95, 0.8], big ? 40 : 26, big ? 4 : 3.2); FX.flashLight(p, 0xfff1d0, big ? 3 : 2, 0.2);
      SND.sfx.hit(big ? 1.2 : 0.9); addShake(big ? 9 : 5); hitStop(big ? 0.11 : 0.06);
      if (big && BF && t.pos) BF.impact(t.pos, 0.55);
    }
    // a hero's move that runs up to its foe, plays its motion, lands each blow at the motion's hit times, and runs back
    async function melee(h, t, ev, act, dist, o) {
      o = o || {};
      shotBoth(h.pos, t.pos, 1.12, 2.5);
      await runUp(h, t, dist);
      if (t.tall > 3) shotFit([{ x: h.pos.x, y: 0, z: h.pos.z }, { x: h.pos.x, y: 2.2, z: h.pos.z }, { x: t.pos.x, y: 0, z: t.pos.z }, { x: t.pos.x, y: t.tall * 0.75, z: t.pos.z }], 1.1, 3);
      else shotAt(mid(h.pos, t.pos), o.zoom || 1.8, 3);
      h.aim = t; const m = h.m; m.play(act, true);
      const H = m.ACTIONS[act].hits;
      for (let k = 0; k < H.length; k++) {
        await untilP(m, H[k] - 0.04); SND.sfx.swish();
        await untilP(m, H[k]);
        if (!ev.has() || countering(ev)) continue;
        if (ev.peek().t === 'miss') { ev.show(); continue; }
        const tgt = F[ev.peek().to] || t, big = k === H.length - 1 && (o.bigLast || H.length > 1);
        strikeFx(tgt, big || o.big, o.color, o.rots ? o.rots[k] : undefined);
        ev.show({ big: big || o.big });
      }
      await until(() => !m.busy);
      h.aim = null;
      await counterBlow(h, ev);
      ev.rest();
      if (E.over === 'win') return;
      await goHome(h);
    }
    // Warden's Vow: a physical blow on Halcyon in her stance brings her counter, after the hero's own blows
    const countering = (ev) => ev.list.some((e) => e.t === 'counter') && ev.peek() && ev.peek().t === 'hit' && E.unit(ev.peek().to).side === 'hero';
    async function counterBlow(h, ev) {
      const c = ev.list.find((e) => e.t === 'counter'); if (!c || !ev.has()) return;
      const f = F[c.who]; if (!f) return;
      UI.banner('Warden’s Vow: Counter', 1.4);
      faceTo(f, h); shotAt(mid(h.pos, f.pos), 1.7, 3);
      f.aim = h; f.m.play('counter', true); SND.sfx.swish();
      await untilP(f.m, f.m.ACTIONS.counter.hits[0]);
      const p = chest(h);
      FX.slash(p, 0x9ec4ff, rnd(-0.6, 2.6), 1.2, 0.3); FX.burst(p, [0.6, 0.75, 1], 32, 3.4); FX.flashLight(p, 0x8fb8ff, 3, 0.3);
      SND.sfx.hit(1.1); addShake(9); hitStop(0.09);
      ev.show();
      await until(() => !f.m.busy); f.aim = null;
      if (E.unit(f.key).vow > 0 && !E.over) f.m.play('vowStance', true);
    }

    // ---------- Io ----------
    const IO_MOVES = {
      attack: (h, t, ev) => melee(h, t, ev, 'combo', 1.2, { rots: [-0.5, 2.5, 0.15] }),
      async flame(h, t, ev) {
        faceTo(h, t); shotBoth(h.pos, t.pos, 1.05, 2.5); await wait(0.15);
        const m = h.m; m.play('throw', true); SND.sfx.fire();
        await untilP(m, m.ACTIONS.throw.cues[0]);
        const proj = { from: m.flamePos(V()), dur: 0.5, arc: 0.45, color: 0xe08cff, halo: 0x9a3cff, size: 0.34, trail: [0.8, 0.35, 1], light: 0xb455ff, lightI: 3 };
        if (ev.peek() && ev.peek().t === 'miss') { FX.projectile(Object.assign(proj, { to: () => chest(t).add(new THREE.Vector3(0.9, 0.4, 0.6)) })); await wait(0.45); ev.show(); }
        else {
          await FX.projectile(Object.assign(proj, { to: () => chest(t) }));
          const p = chest(t);
          FX.burst(p, [0.85, 0.4, 1], 60, 4.2); FX.ring(t.pos, 0xc060ff, 0.2, 1.9, 0.6, 0.9); FX.flashLight(p, 0xc070ff, 4, 0.4, 7);
          SND.sfx.boom(0.8); addShake(10); hitStop(0.1); ev.show({ big: true });
        }
        await until(() => !m.busy); ev.rest();
      },
      async crescent(h, t, ev) {
        faceTo(h, t); shotAt(h.pos, 1.55, 2.5);
        const m = h.m, C = m.ACTIONS.crescent.cues; m.play('crescent', true); SND.sfx.chime();
        await untilP(m, C[0]);
        const list = FX.blades(() => chest(h), 5);
        await untilP(m, C[1]); shotBoth(h.pos, t.pos, 1.05, 3);
        const hits = [];
        for (let i = 0; i < 5; i++) {
          SND.sfx.blade();
          hits.push(FX.launchBlade(list[i], () => chest(t), 0.32).then(() => {
            if (!ev.has()) return;
            if (ev.peek().t === 'miss') { ev.show(); return; }
            const p = chest(t); FX.slash(p, 0xcfe0ff, rnd(0, TAU), 0.9, 0.25); FX.burst(p, [0.7, 0.8, 1], 18, 2.8);
            SND.sfx.hit(0.7); addShake(4); hitStop(0.04); ev.show();
          }));
          await wait(0.13);
        }
        await Promise.all(hits); await until(() => !m.busy); ev.rest();
      },
      async briars(h, t, ev) {
        faceTo(h, t); shotBoth(h.pos, t.pos, 1.05, 2.5); await wait(0.12);
        const m = h.m; m.play('briar', true); SND.sfx.fire();
        await untilP(m, m.ACTIONS.briar.cues[0]);
        shotAt(t.pos, 1.45, 3.2);
        FX.sigil(t.pos, 0xc070ff, 2.4, 1.8, 2); FX.briars(t.pos, 1.7);
        FX.burst(new THREE.Vector3(t.pos.x, 0.25, t.pos.z), [0.75, 0.35, 1], 50, 3, { up: 1 });
        SND.sfx.grasp(); await untilP(m, m.ACTIONS.briar.hits[0]);
        FX.flashLight(chest(t), 0xb455ff, 3, 0.4); SND.sfx.hit(1.1); addShake(10); hitStop(0.08);
        ev.show();
        await until(() => !m.busy); ev.rest();
      },
      // in her Trance (Twin Moons) the heal lands on both
      async mend(h, t, ev) {
        const all = healed(ev);
        if (all.length > 1) shotField(2.5); else shotAt(t.pos, 1.8, 2.5);
        const m = h.m; m.play('mend', true); SND.sfx.heal();
        for (const f of all) { FX.rise(() => f.pos, [0.6, 1, 0.75], 1.5, 40, 0.55); FX.sigil(f.pos, 0xb8ffd0, 1.8, 1.8, 1.5); }
        await untilP(m, m.ACTIONS.mend.hits[0]);
        while (ev.peek() && ev.peek().t === 'heal') { FX.burst(chest(F[ev.peek().to]), [0.6, 1, 0.75], 30, 2, { up: 1 }); ev.show(); }
        await until(() => !m.busy); ev.rest();
      },
      async waxing(h, t, ev) {
        const W2 = IOS.SPELLS.waxing, m = h.m, dur = m.ACTIONS.mend.dur;
        shotField(2.5);
        m.play('mend', true); SND.sfx.heal();
        const allies = living('hero');
        await untilP(m, W2.cues[0]);
        const p = allies.length > 1 ? mid(allies[0].pos, allies[1].pos) : h.pos;
        IOS.waxingLight({ sky: () => V().set(p.x, 2.9, p.z), allies: allies.map((f) => () => chest(f)), landIn: (W2.hits[0] - W2.cues[0]) * dur });
        await untilP(m, W2.hits[0]);
        while (ev.peek() && ev.peek().t === 'heal') ev.show();
        await until(() => !m.busy); ev.rest();
      },
      async moonsteel(h, t, ev) {
        const M2 = IOS.SPELLS.moonsteel, m = h.m, dur = m.ACTIONS.cast.dur;
        faceTo(h, t); shotBoth(h.pos, t.pos, 1.05, 2.5);
        m.play('cast', true); SND.sfx.chime();
        await untilP(m, M2.cues[0]);
        const T1 = V(), blade = (A2, B2) => { t.m.anchor('blade', T1); t.m.anchor('hit', B2); A2.copy(T1).sub(B2).multiplyScalar(0.8172).add(T1); };
        IOS.moonsteel({ palm: () => h.m.flamePos(V()), blade, releaseIn: (M2.cues[1] - M2.cues[0]) * dur, landIn: (M2.hits[0] - M2.cues[0]) * dur, glowFor: M2.glow });
        await untilP(m, M2.hits[0]);
        SND.sfx.blade(); ev.rest();
        await until(() => !m.busy);
      },
      // Harvest Moon: a warm full moon swells over her palm and sinks into Sol; her blade glows amber
      async harvest(h, t, ev) {
        const M2 = IOS.SPELLS.harvest, m = h.m, dur = m.ACTIONS.cast.dur;
        faceTo(h, t); shotBoth(h.pos, t.pos, 1.05, 2.5);
        m.play('cast', true); SND.sfx.chime();
        await untilP(m, M2.cues[0]);
        const T1 = V(), blade = (A2, B2) => { t.m.anchor('blade', T1); t.m.anchor('hit', B2); A2.copy(T1).sub(B2).multiplyScalar(0.8172).add(T1); };
        IOS.harvestMoon({ palm: () => h.m.flamePos(V()), chest: () => chest(t), feet: () => t.pos, blade, releaseIn: (M2.cues[1] - M2.cues[0]) * dur, landIn: (M2.hits[0] - M2.cues[0]) * dur, glowFor: M2.glow });
        await untilP(m, M2.hits[0]);
        SND.sfx.fire(); ev.rest();
        await until(() => !m.busy);
      },
      async defend(h, t, ev) {
        UI.banner('Defend'); h.m.guard(true); S.guard[h.key] = true; SND.sfx.guard();
        const f = firstFoe(); if (f) faceTo(h, f);
        FX.shield(true, h.pos, f ? faceYaw(h.pos, f.pos) : h.yaw);
        await wait(0.6); ev.rest();
      },
      async moonlight(h, t, ev) {
        UI.cinematic(true); UI.vignette(0.55);
        shotAt(h.pos, 1.5, 2);
        const m = h.m, A2 = m.ACTIONS.moon; m.play('moon', true); SND.sfx.moon();
        await untilP(m, A2.cues[0]);
        shotAt(t.pos, 1.3, 3.2);
        await untilP(m, A2.cues[1]);
        FX.beam(t.pos, 0xe6eeff, 3.4, 14, 1.9); FX.sigil(t.pos, 0xdfe9ff, 3.4, 2.1, 3);
        for (let k = 0; k < A2.hits.length; k++) {
          await untilP(m, A2.hits[k]);
          if (!ev.has()) break;
          const p = chest(t);
          FX.burst(p, [0.85, 0.92, 1], 70, 5, { spread: 0.3 }); FX.ring(t.pos, 0xe6eeff, 0.3, 3.2, 0.7, 1); FX.flashLight(p, 0xe8f0ff, 6, 0.5, 9);
          UI.flash('#ffffff', 0.75 - k * 0.2, 0.35); SND.sfx.boom(1.1); addShake(14); hitStop(0.12);
          ev.show({ big: true, quiet: true });
        }
        await until(() => !m.busy);
        ev.rest({ quiet: true });
        UI.vignette(0); if (!E.over) UI.cinematic(false);
      },
      lunara: (h, t, ev) => summonLunara(h, t, ev),
      envoi: (h, t, ev) => summonEnvoi(h, t, ev),
      flee: (h, t, ev) => flee(h, t, ev),
    };
    // whoever a move heals, from its events
    const healed = (ev) => { const ks = new Set(ev.list.filter((e) => e.t === 'heal').map((e) => e.to)); const out = [...ks].map((k) => F[k]).filter(Boolean); return out.length ? out : [io()]; };

    // ---------- Sol ----------
    const SOL_MOVES = {
      attack: (h, t, ev) => melee(h, t, ev, 'combo', 1.3, { rots: [-0.5, 2.5, 0.15], color: 0xffd9a0 }),
      flareCut: (h, t, ev) => melee(h, t, ev, 'flareCut', 1.5, { big: true, color: 0xffb060, zoom: 1.7 }),
      sunder: (h, t, ev) => melee(h, t, ev, 'sunder', 1.4, { big: true, color: 0xffc880 }),
      emberRush: (h, t, ev) => melee(h, t, ev, 'emberRush', 2.7, { color: 0xff9a40, zoom: 1.5, bigLast: true }),
      solarCrest: (h, t, ev) => melee(h, t, ev, 'solarCrest', 2.1, { big: true, color: 0xffe08a, zoom: 1.4 }),
      daybreak: (h, t, ev) => melee(h, t, ev, 'daybreak', 1.4, { color: 0xfff0b0, bigLast: true }),
      async highNoon(h, t, ev) {
        UI.cinematic(true); UI.vignette(0.45);
        await melee(h, t, ev, 'highNoon', 2.6, { color: 0xfff6c8, bigLast: true, zoom: 1.4 });
        UI.flash('#fff3d0', 0.6, 0.5);
        UI.vignette(0); if (!E.over) UI.cinematic(false);
      },
      flee: (h, t, ev) => flee(h, t, ev),
      async guard(h, t, ev) {
        UI.banner('Guard'); SND.sfx.guard();
        const f = firstFoe(); if (f) faceTo(h, f);
        h.m.play('guardStep', true); h.m.guard(true); S.guard[h.key] = true;
        await until(() => !h.m.busy); ev.rest();
      },
      // Kestrel Stoop, turn one: she springs up and hangs in the air; the stoop comes on her next turn
      async stoopRise(h, t, ev) {
        faceTo(h, t); shotFit([h.pos, t.pos, { x: h.pos.x, y: 4.6, z: h.pos.z }], 1, 2.4);
        h.aimAt = t; h.m.play('stoopRise', true); SND.sfx.swish();
        await untilP(h.m, 0.95);
        UI.note('Sol hangs in the air like a kestrel, out of reach. She stoops on her next turn.', 2.2);
        ev.rest();
      },
      async stoop(h, t, ev) {
        D[h.key].aloft = false;
        faceTo(h, t); shotFit([h.pos, t.pos, { x: h.pos.x, y: 4.2, z: h.pos.z }], 1, 3);
        h.aim = t; h.m.play('stoop', true); SND.sfx.swish();
        await untilP(h.m, h.m.ACTIONS.stoop.hits[0]);
        if (ev.has() && !countering(ev)) { const p = chest(t); strikeFx(t, true, 0xffe8a0); FX.ring(t.pos, 0xffd070, 0.3, 3.5, 0.7, 1); FX.flashLight(p, 0xffe0a0, 6, 0.5, 8); UI.flash('#fff1c8', 0.55, 0.35); SND.sfx.boom(1.2); addShake(16); ev.show({ big: true }); }
        await until(() => !h.m.busy); h.aim = null; h.aimAt = null;
        await counterBlow(h, ev); ev.rest();
        if (E.over !== 'win') await goHome(h);
      },
      // the story command in Halcyon's fights: Sol calls to her by the name Halcyon gave her, and Halcyon falters,
      // losing her next turn
      async kestrel(h, t, ev) {
        UI.cinematic(true); UI.vignette(0.4);
        faceTo(h, t); faceTo(t, h); shotBoth(h.pos, t.pos, 1.1, 2.4);
        h.m.play('kestrel', true); SND.sfx.chime();
        UI.msg(cfg.kestrelLine || 'Sol calls to her by the name she gave her: “Kestrel!”', true);
        await untilP(h.m, 0.45);
        t.m.play('stagger', true); word(t, 'Falters'); FX.ring(t.pos, 0xffd9a0, 0.2, 1.8, 0.7, 0.8);
        await until(() => !h.m.busy); await wait(1.4);
        UI.msg(shownName(E.unit(t.key)) + ' falters. She will lose her next turn.', true);
        await wait(1.8); UI.hideMsg();
        ev.rest();
        UI.vignette(0); UI.cinematic(false);
      },
    };

    // ---------- Flee: the party turns and runs; from a pack it can fail ----------
    async function flee(h, t, ev) {
      const e = ev.list.find((x) => x.t === 'flee'), ok = !!(e && e.ok);
      shotField(2); SND.sfx.swish();
      const runners = living('hero');
      for (const f of runners) { const away = { x: f.pos.x + (f.pos.x - firstFoe().pos.x) * 0.25, z: f.pos.z + (f.pos.z - firstFoe().pos.z) * 0.25 }; moveTo(f, away.x, away.z, ok ? 4.5 : 2.5); }
      await wait(ok ? 1.1 : 0.9);
      if (ok) UI.msg('The party gets away.', true);
      else { UI.note('Couldn’t get away!', 1.6); await Promise.all(runners.map((f) => goHome(f, 3))); }
      ev.rest();
    }

    // ---------- herbs, for either hero ----------
    async function useHerb(h, hd, ev) {
      UI.banner(hd.name);
      // Ember-star Lily warms the whole party; the others glow green on whoever they're for
      const warm = hd.herb === 'emberLily';
      const tg = warm ? living('hero') : ev.list.map((e) => F[e.to || e.who]).filter((f) => f && f.side === 'hero');
      if (h.key === 'io') h.m.play('cast', true);
      await wait(0.45);
      for (const t of tg.length ? [...new Set(tg)] : [h]) { FX.rise(() => t.pos, warm ? [1, 0.7, 0.35] : [0.75, 1, 0.8], 0.9, 30, 0.5); FX.sigil(t.pos, warm ? 0xffc070 : 0xd8ffe0, 1.4, 1.2, 1.2); }
      SND.sfx.heal(); await wait(0.4);
      ev.rest(); await wait(0.5);
    }

    // ---------- Trance ----------
    async function transform(h) {
      const isIo = h.key === 'io';
      UI.banner(isIo ? 'Lunar Trance' : 'Dawnbreaker', 2.8); UI.cinematic(true); UI.vignette(0.55); UI.tint(isIo ? 0.55 : 0.3);
      shotAt(h.pos, 1.95, 2.4);
      const m = h.m; m.play('transform', true); SND.sfx.trance(); if (isIo) SND.sfx.moon(); else SND.sfx.fire();
      if (isIo) { FX.sigil(h.pos, 0xdfe9ff, 2.3, 3.0, 2.5); FX.beam(h.pos, 0xe6eeff, 1.5, 12, 2.6); FX.spiral(() => chest(h), [0.8, 0.9, 1], 1.5, 90); }
      else { FX.sigil(h.pos, 0xffd28a, 2.3, 3.0, 2.5); FX.beam(h.pos, 0xffe6a8, 1.5, 12, 2.6); FX.spiral(() => chest(h), [1, 0.85, 0.5], 1.5, 90); }
      const cue = (m.ACTIONS.transform.cues && m.ACTIONS.transform.cues[0]) || 0.55;
      await untilP(m, cue);
      D[h.key].inTrance = true;
      const c = chest(h);
      FX.burst(c, isIo ? [0.85, 0.92, 1] : [1, 0.85, 0.5], 100, 4.8, { spread: 0.25 }); FX.ring(h.pos, 0xffffff, 0.3, 3.2, 0.8, 1);
      FX.flashLight(c, isIo ? 0xe8f0ff : 0xffe0a0, 5, 0.6, 7); UI.flash('#ffffff', 0.6, 0.45); SND.sfx.boom(0.7); SND.sfx.chime(); addShake(8);
      await until(() => !m.busy);
      UI.msg(isIo ? 'The moon answers. She becomes Lunara’s vessel.' : 'Her blade burns white: the sun at its height.', true); await wait(1.2); UI.hideMsg();
      UI.vignette(0); UI.cinematic(false); UI.tint(0);
      h.tyaw = h.home.yaw;
    }

    // ---------- Lunara ----------
    // Io calls her up from the Moonwell; she rises and closes her wings over the party (the Embrace heals, revives
    // and shields), and waits behind the well for her strike on Io's next turn
    async function summonLunara(h, t, ev) {
      UI.banner('Summon: Lunara', 2.8);
      UI.cinematic(true); UI.vignette(0.6); UI.tint(0.6);
      h.tyaw = faceYaw(h.pos, LUN); shotAt(h.pos, 1.7, 2.4);
      const m = h.m; m.play('summon', true); SND.sfx.chime();
      FX.sigil(h.pos, 0xd8c8ff, 1.9, 2.6, -2);
      await untilP(m, m.ACTIONS.summon.cues[0]);
      await FX.projectile({ from: m.flamePos(V()), to: new THREE.Vector3(WELL.x, 1.1, WELL.z), dur: 0.7, arc: 1.7, color: 0xffffff, halo: 0xcfe0ff, size: 0.26, trail: [0.85, 0.9, 1], light: 0xe6eeff, lightI: 3 });
      shotAt(WELL, 1.5, 2.6);
      SND.sfx.moon(); SND.sfx.boom(0.6);
      FX.ring(WELL, 0xe6eeff, 0.2, 2.6, 0.7, 1); FX.ring(WELL, 0xbfd6ff, 0.2, 4.2, 1.2, 0.8); FX.sigil(WELL, 0xdfe9ff, 4.4, 4.8, 1.2);
      FX.geyser(WELL, 2.6, [0.85, 0.9, 1]); FX.beam(WELL, 0xe6eeff, 2.4, 14, 2.4);
      for (const [dx, dz] of [[1.7, 1.0], [-1.7, 1.0], [1.7, -1.0], [-1.7, -1.0]]) FX.beam({ x: WELL.x + dx, z: WELL.z + dz }, 0xcfe0ff, 0.5, 10, 2.6);
      UI.flash('#dfe8ff', 0.5, 0.5); addShake(8);
      await wait(0.4);
      const L = LU.m;
      LU.pos.x = LUN.x; LU.pos.z = LUN.z; LU.yaw = LU.tyaw = 0.3;
      L.root.visible = true; if (L.fx) L.fx.visible = true; LU.shadow.visible = true; LU.on = true;
      L.play('appear', true);
      // the wide shot: the whole of her, the well and everyone in the fight
      shotFit(standing().map((f) => f.pos).concat([{ x: LUN.x, y: 4.6, z: LUN.z }, { x: LUN.x, y: 0, z: LUN.z }]), 1, 0.9);
      await untilP(L, L.ACTIONS.appear.cues[1]);
      FX.burst(L.anchor('head', V()), [0.75, 1, 0.88], 90, 4.5, { spread: 0.9 }); FX.ring(LUN, 0xdfffee, 0.4, 4.6, 0.9, 0.8);
      UI.flash('#ffffff', 0.45, 0.4); SND.sfx.chime(); SND.sfx.boom(0.5); addShake(5);
      UI.msg('Lunara, the Pale Mother, rises from ' + SUMMON_FROM + '.', true);
      await until(() => !L.busy);
      UI.hideMsg();
      // the Embrace: her wings close over the party, then open: the party heals, the fallen rise, and blows are softened
      L.play('embrace', true); SND.sfx.heal();
      await untilP(L, L.ACTIONS.embrace.cues[0]);
      FX.converge(() => L.anchor('chest', V()), [0.8, 1, 0.88], 1.0, 90);
      for (const f of heroes) FX.rise(() => f.pos, [0.75, 1, 0.85], 1.2, 40, 0.6);
      await untilP(L, L.ACTIONS.embrace.hits[0]);
      for (const f of heroes) { FX.sigil(f.pos, 0xd8ffe8, 1.7, 2.2, 1.5); FX.ring(f.pos, 0xd8ffe8, 0.2, 1.5, 0.8, 0.9); FX.burst(chest(f), [0.75, 1, 0.85], 30, 2, { up: 1 }); FX.flashLight(chest(f), 0xc8ffdc, 2.2, 0.8, 4); }
      while (ev.has()) ev.show();
      UI.msg(heroes.length > 1 ? 'Pale Mother’s Embrace: the party heals, and takes less harm until Lunara strikes.' : 'Pale Mother’s Embrace: Io heals, and takes less harm until Lunara strikes.', true);
      await until(() => !L.busy); await wait(0.9); UI.hideMsg();
      ev.rest();
      UI.vignette(0); UI.cinematic(false); UI.tint(0);
      h.tyaw = h.home.yaw;
    }
    // Silver Requiem: the moon gathers over her, six moonbeams fall on the foes, then Moonfall on Io's chosen foe
    async function lunaraStrike(ev) {
      const L = LU.m, R = L.ACTIONS.release;
      UI.banner('Lunara: Silver Requiem', 3.2); UI.cinematic(true); UI.vignette(0.75); UI.tint(0.65);
      shotFit(standing().map((f) => f.pos).concat([{ x: LUN.x, y: 5.2, z: LUN.z }]), 1, 2);
      L.play('charge', true); SND.sfx.moon();
      const orbP = () => L.anchor('orb', V());
      FX.converge(orbP, [0.85, 0.9, 1], 1.9, 110); FX.rise(() => LUN, [0.85, 0.9, 1], 1.9, 50, 1.4);
      await until(() => !L.busy);
      L.play('release', true); SND.sfx.blade(); FX.burst(orbP(), [0.9, 0.95, 1], 50, 3.5);
      await untilP(L, R.cues[0]);
      // the engine lists six beams and then Moonfall; if the foes fell early, the list stops there
      const hits = ev.list.filter((e) => e.t === 'hit'), beams = Math.min(6, hits.length), moonfall = hits.length === 7 ? F[hits[6].to] : null;
      const sky = moonfall || F[(hits[hits.length - 1] || {}).to] || firstFoe();
      FX.projectile({ from: orbP(), to: () => new THREE.Vector3(sky.pos.x, 9.5, sky.pos.z), dur: 0.55, arc: 1.4, tex: L.moonTex, color: 0xffffff, halo: 0xcfe0ff, size: 1.0, trail: [0.8, 0.85, 1], light: 0xe6eeff, lightI: 4 });
      shotField(3);
      for (let k = 0; k < beams; k++) {
        await untilP(L, R.hits[k]);
        const t = F[ev.peek().to] || sky;
        const a = rnd(0, TAU), r = rnd(0.2, 0.8), p = { x: t.pos.x + Math.cos(a) * r, z: t.pos.z + Math.sin(a) * r * 0.8 };
        FX.beam(p, 0xe6eeff, 0.9, 12, 0.55); FX.ring(p, 0xe6eeff, 0.1, 1.2, 0.5, 0.9); FX.burst(new THREE.Vector3(p.x, 0.3, p.z), [0.8, 0.88, 1], 26, 3, { up: 1 });
        SND.sfx.hit(0.8); addShake(6); hitStop(0.03); ev.show();
      }
      if (moonfall) {
        const t = moonfall;
        await untilP(L, R.cues[1]);
        UI.banner('Moonfall', 1.6); SND.sfx.eclipse(); shotAt(t.pos, 1.15, 3);
        const dur = (R.hits[6] - R.cues[1]) * R.dur;
        FX.ring(t.pos, 0xdfe8ff, 3.5, 1.0, dur, 0.7); FX.moonfall(t.pos, L.moonTex, dur);
        await untilP(L, R.hits[6]);
        const p = chest(t);
        UI.flash('#ffffff', 1.0, 0.8); SND.sfx.boom(1.5); SND.sfx.boom(1.0); addShake(22); hitStop(0.25);
        FX.beam(t.pos, 0xffffff, 5.4, 16, 1.6); FX.sigil(t.pos, 0xe6eeff, 4.8, 1.9, 3);
        for (const [r1, d, op] of [[5.5, 0.9, 1], [7.5, 1.3, 0.7], [3.5, 0.6, 1]]) FX.ring(t.pos, 0xffffff, 0.3, r1, d, op);
        FX.burst(p, [0.9, 0.95, 1], 160, 6.5, { spread: 0.6 }); FX.flashLight(p, 0xffffff, 10, 0.9, 13);
        ev.show({ big: true });
      }
      ev.rest();
      await wait(1.0);
      L.play('leave', true); FX.burst(L.anchor('head', V()), [0.75, 1, 0.88], 70, 3, { spread: 1.0 });
      if (!E.over) UI.msg('Lunara sinks back into ' + SUMMON_FROM + '.', true);
      await wait(1.6); UI.hideMsg();
      LU.on = false;
      UI.vignette(0); UI.tint(0); if (!E.over) UI.cinematic(false);
    }

    // ---------- Envoi, the Letter Wyrm (from Dawnroost on), after its bench stage (src/bench/stage-envoi.js) ----------
    // Io's letters fold into the wyrm, Sol's blade lights its heart lantern (spending all her Heat), the seal breaks and
    // it coils into the Folding Ward, which takes the next enemy attack whole. When Io's gauge next fills it wraps its
    // foe, burns from tail to head as a ring of fire and drops its heart for the Last Word; Io still takes her turn
    const ENV = { beam: null, beamPos: null, glow: [], sparks: [], ink: [], ward: null, V1: null, V2: null, V3: null };
    const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
    function initEnvoi() {
      ENV.V1 = V(); ENV.V2 = V(); ENV.V3 = V();
      // Sol's blade light: a soft amber streak from her blade tip to the heart lantern, with sparks running along it
      const c = document.createElement('canvas'); c.width = 64; c.height = 8; const x = c.getContext('2d');
      const gr = x.createLinearGradient(0, 0, 64, 0); gr.addColorStop(0, 'rgba(255,160,60,0)'); gr.addColorStop(0.32, 'rgba(255,190,100,0.55)'); gr.addColorStop(0.5, 'rgba(255,248,224,1)'); gr.addColorStop(0.68, 'rgba(255,190,100,0.55)'); gr.addColorStop(1, 'rgba(255,160,60,0)');
      x.fillStyle = gr; x.fillRect(0, 0, 64, 8);
      const geo = new THREE.BufferGeometry(); ENV.beamPos = new Float32Array(12);
      geo.setAttribute('position', new THREE.BufferAttribute(ENV.beamPos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 1, 1], 2)); geo.setIndex([0, 2, 1, 1, 2, 3]);
      ENV.beam = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), color: 0xffc070, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
      ENV.beam.frustumCulled = false; ENV.beam.visible = false; ENV.beam.renderOrder = 4; scene.add(ENV.beam);
      const amber = radialTex('rgba(255,244,214,1)', 'rgba(255,170,70,0.5)', 'rgba(255,120,30,0)');
      const spr = (col) => { const q = new THREE.Sprite(new THREE.SpriteMaterial({ map: amber, color: col, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); q.visible = false; q.renderOrder = 5; scene.add(q); return q; };
      ENV.glow = [spr(0xffd08a), spr(0xffe0a8)];
      for (let i = 0; i < 7; i++) ENV.sparks.push(spr(0xffc070));
      // the dark splash when a blow lands on the ward: drops of the foe's darkness thrown off the paper
      const inkTex = radialTex('rgba(10,4,18,0.96)', 'rgba(26,10,40,0.6)', 'rgba(26,10,40,0)');
      for (let i = 0; i < 40; i++) { const q = new THREE.Sprite(new THREE.SpriteMaterial({ map: inkTex, color: i % 5 ? 0xffffff : 0x9dffc0, transparent: true, depthWrite: false, depthTest: false })); q.visible = false; q.renderOrder = 6; scene.add(q); ENV.ink.push({ s: q, v: V(), life: 0, max: 1, r: 0.2 }); }
      // where foes aim while the ward is up: the front of the coiled wall
      ENV.ward = { key: 'envoi', pos: { x: 0, z: 0 }, tall: 3, m: { anchor: (n, o) => EN.m.anchor('ward', o || V()) } };
    }
    function envoiHome() { EN.pos = { x: EN.home.x, z: EN.home.z }; EN.yaw = EN.tyaw = faceYaw(EN.home, firstFoe().pos) - 0.5; }
    function envoiHide() {
      EN.on = false; EN.m.reset(); EN.m.root.visible = false; if (EN.m.fx) EN.m.fx.visible = false; EN.shadow.visible = false;
      ENV.beam.visible = false; for (const q of ENV.glow.concat(ENV.sparks)) q.visible = false;
    }
    function stepEnvoi(dt, rdt) {
      const M = EN.m;
      if (EN.on || M.busy) {
        stepActor(EN, dt);
        M.root.position.set(EN.pos.x, 0, EN.pos.z); M.root.rotation.y = EN.yaw;
        if (M.state) {
          const t = EN.wrap && !EN.wrap.out ? EN.wrap : firstFoe();
          if (t) { const c = chest(t); M.state.target = { x: c.x, y: c.y, z: c.z }; M.state.reach = Math.max(2, Math.hypot(t.pos.x - EN.pos.x, t.pos.z - EN.pos.z)); }
        }
        M.animate(0, 0, clock.t, dt);
        EN.shadow.position.set(EN.pos.x, 0.006, EN.pos.z);
        M.anchor('ward', ENV.V1); ENV.ward.pos.x = ENV.V1.x; ENV.ward.pos.z = ENV.V1.z;
      }
      // the blade light, while the heart is lit
      const a = M.action, p = M.progress, s = F.sol;
      const k = EN.on && a === 'summon' && s && !s.out ? smooth(0.405, 0.44, p) * (1 - smooth(0.49, 0.54, p)) : 0, on = k > 0.01;
      ENV.beam.visible = on; for (const q of ENV.glow.concat(ENV.sparks)) q.visible = on;
      if (on) {
        const V1 = s.m.anchor('hit', ENV.V1), V2 = M.anchor('heart', ENV.V2), V3 = ENV.V3.subVectors(V2, V1);
        const side = V().subVectors(camera.position, V1).cross(V3).normalize().multiplyScalar(0.11 + 0.05 * k), P = ENV.beamPos;
        P[0] = V1.x - side.x; P[1] = V1.y - side.y; P[2] = V1.z - side.z; P[3] = V1.x + side.x; P[4] = V1.y + side.y; P[5] = V1.z + side.z;
        P[6] = V2.x - side.x; P[7] = V2.y - side.y; P[8] = V2.z - side.z; P[9] = V2.x + side.x; P[10] = V2.y + side.y; P[11] = V2.z + side.z;
        ENV.beam.geometry.attributes.position.needsUpdate = true; ENV.beam.material.opacity = k;
        const t = clock.t;
        ENV.glow[0].position.copy(V1); ENV.glow[0].scale.setScalar(0.7 + 0.15 * Math.sin(t * 23)); ENV.glow[0].material.opacity = k;
        ENV.glow[1].position.copy(V2); ENV.glow[1].scale.setScalar(1.6 * k + 0.2 * Math.sin(t * 17)); ENV.glow[1].material.opacity = k;
        ENV.sparks.forEach((q, i) => { const f = (t * 1.6 + i / ENV.sparks.length) % 1; q.position.copy(V1).addScaledVector(V3, f); q.position.y += Math.sin(f * Math.PI) * 0.25 * Math.sin(i * 2.1); q.scale.setScalar(0.22 + 0.1 * Math.sin(t * 31 + i)); q.material.opacity = k * Math.sin(f * Math.PI); });
      }
      // the splash's drops fall to the cobbles
      for (const d of ENV.ink) {
        if (!d.s.visible) continue;
        d.life += rdt; if (d.life >= d.max) { d.s.visible = false; continue; }
        d.v.y -= 7 * rdt; d.s.position.addScaledVector(d.v, rdt);
        if (d.s.position.y < 0.03) { d.s.position.y = 0.03; d.v.set(0, 0, 0); }
        const f = d.life / d.max; d.s.scale.setScalar(d.r * (1 + 1.4 * f)); d.s.material.opacity = 0.92 * (1 - f * f);
      }
      if (!EN.on && !M.busy && M.root.visible) envoiHide();
    }
    // a blow lands on the Folding Ward: it shudders, throws off the foe's darkness, and the party takes nothing
    function wardHit() {
      if (!EN || !EN.on) return;
      const p = EN.m.anchor('ward', V()), c = camera.position, tx = c.x - p.x, tz = c.z - p.z, tl = Math.hypot(tx, tz) || 1;
      EN.m.play('block', true);
      FX.ring(p, 0xffd9a0, 0.2, 2.2, 0.5, 1); FX.flashLight(p, 0xffc070, 3, 0.4);
      for (const d of ENV.ink) {
        const a = Math.random() * TAU, sp = 1.2 + Math.random() * 2.4;
        d.s.position.set(p.x + (Math.random() - 0.5) * 0.3, p.y + (Math.random() - 0.5) * 0.3, p.z + (Math.random() - 0.5) * 0.3);
        d.v.set(Math.cos(a) * sp + tx / tl * 1.8, 0.6 + Math.random() * 2.6, Math.sin(a) * sp + tz / tl * 1.8);
        d.life = 0; d.max = 0.7 + Math.random() * 0.6; d.r = 0.22 + Math.random() * 0.34; d.s.visible = true;
      }
      for (const h of reach()) word(h, 'Warded', 'ward');
      SND.sfx.hit(1.0); addShake(8); hitStop(0.08);
    }
    const envoiShot = (extra, k) => shotFit(standing().map((f) => f.pos).concat([{ x: EN.pos.x, y: 6.4, z: EN.pos.z }, { x: EN.pos.x, y: 0, z: EN.pos.z }], extra || []), 1, k || 1);
    async function summonEnvoi(h, t, ev) {
      const M = EN.m, A = M.ACTIONS.summon, s = F.sol;
      UI.banner('Summon: Envoi', 2.8);
      UI.cinematic(true); UI.vignette(0.55); UI.tint(0.45);
      envoiHome(); EN.wrap = t;
      h.tyaw = faceYaw(h.pos, EN.pos); shotAt(h.pos, 1.7, 2.4);
      h.m.play('summon', true); SND.sfx.chime();
      FX.sigil(h.pos, 0xffd9a0, 1.9, 2.6, -2);
      await untilP(h.m, h.m.ACTIONS.summon.cues[0]);
      // the letters leave her hand and fold into the wyrm where it will stand
      await FX.projectile({ from: h.m.flamePos(V()), to: () => new THREE.Vector3(EN.pos.x, 1.6, EN.pos.z), dur: 0.6, arc: 1.2, color: 0xfff1d8, halo: 0xffb45a, size: 0.24, trail: [1, 0.85, 0.6], light: 0xffc890, lightI: 3 });
      M.root.visible = true; if (M.fx) M.fx.visible = true; EN.shadow.visible = true; EN.on = true;
      M.play('summon', true); SND.sfx.fire();
      envoiShot(null, 1.2);
      UI.msg('Io’s letters to the dead fold into Envoi, the Letter Wyrm.', true);
      // Sol cuts toward the heart lantern as it lights: her blade spends all her Heat
      await untilP(M, 0.27);
      if (s && !s.out) { s.tyaw = faceYaw(s.pos, EN.pos); s.m.play('flareCut', true); SND.sfx.swish(); }
      await untilP(M, A.cues[0]);
      UI.hideMsg();
      const heat = Math.round(D.sol ? D.sol.heat : 0), u = E.unit('sol');
      if (s && D.sol && !(u && u.inTrance)) { D.sol.heat = 0; if (heat > 0) word(s, '−' + heat + ' Heat', 'heat'); }
      FX.ring(M.anchor('heart', V()), 0xffd08a, 0.2, 2.4, 0.6, 1); SND.sfx.boom(0.6); addShake(5);
      UI.banner('Heart Lantern', 1.2);
      await untilP(M, A.hits[0]);
      FX.ring(M.anchor('seal', V()), 0xfff1c8, 0.2, 3, 0.7, 1); UI.flash('#fff1c8', 0.4, 0.35); SND.sfx.boom(1.0); addShake(9);
      UI.banner('Seal Break', 1.2);
      await untilP(M, A.cues[1]);
      FX.ring(M.anchor('ward', V()), 0xffe0a8, 0.3, 3.6, 0.8, 0.9);
      UI.banner('Folding Ward', 1.6);
      UI.msg('The Folding Ward: Envoi will take the next attack whole.', true);
      await until(() => !M.busy); await wait(0.6); UI.hideMsg();
      ev.rest();
      UI.vignette(0); UI.cinematic(false); UI.tint(0);
      h.tyaw = h.home.yaw;
      if (s && !s.out) await goHome(s);
    }
    // Envoi is made (lore answer 11): after Dawnroost, Io admits she never burned her letters to the dead, folds them
    // into the wyrm, and Sol lights its heart at the living node. Between battles it folds away
    async function envoiMade() {
      const io = F.io, s = F.sol, M = EN.m, A = M.ACTIONS.summon;
      for (const h of heroes) if (D[h.key].hp <= 0) { h.m.play('rise', true); D[h.key].hp = 1; }
      await wait(0.6);
      UI.cinematic(true); UI.vignette(0.45);
      EN.pos = { x: EN.home.x, z: EN.home.z }; EN.yaw = EN.tyaw = faceYaw(EN.home, centerOf(heroes.map((h) => h.pos))) - 0.5;
      io.tyaw = faceYaw(io.pos, EN.pos); if (s) s.tyaw = faceYaw(s.pos, EN.pos);
      shotBoth(io.pos, EN.pos, 1, 2);
      UI.msg(cfg.envoiLines[0], true); await wait(3.2);
      io.m.play('summon', true); SND.sfx.chime();
      await untilP(io.m, io.m.ACTIONS.summon.cues[0]);
      await FX.projectile({ from: io.m.flamePos(V()), to: () => new THREE.Vector3(EN.pos.x, 1.6, EN.pos.z), dur: 0.7, arc: 1.2, color: 0xfff1d8, halo: 0xffb45a, size: 0.24, trail: [1, 0.85, 0.6], light: 0xffc890, lightI: 3 });
      M.root.visible = true; if (M.fx) M.fx.visible = true; EN.shadow.visible = true; EN.on = true;
      M.play('summon', true); SND.sfx.fire();
      envoiShot(null, 1.2);
      UI.msg(cfg.envoiLines[1], true);
      await untilP(M, 0.27);
      if (s && D.sol.hp > 0) { s.m.play('flareCut', true); SND.sfx.swish(); }
      await untilP(M, A.cues[0]);
      FX.ring(M.anchor('heart', V()), 0xffd08a, 0.2, 2.4, 0.6, 1); SND.sfx.boom(0.6); addShake(5);
      await untilP(M, A.hits[0]);
      FX.ring(M.anchor('seal', V()), 0xfff1c8, 0.2, 3, 0.7, 1); UI.flash('#fff1c8', 0.4, 0.35); SND.sfx.boom(1.0); addShake(8);
      await until(() => !M.busy); await wait(1.0);
      UI.msg(cfg.envoiLines[2], true); await wait(2.6);
      EN.on = false; M.play('leave', true);
      await until(() => !M.busy); envoiHide(); await wait(0.4);
      UI.hideMsg(); UI.vignette(0); UI.cinematic(false);
    }
    // the strike: it wraps its foe, eight blows as the ring of fire catches from the tail up, then the Last Word
    async function envoiStrike(ev) {
      const M = EN.m, A = M.ACTIONS.envoi;
      const hits = ev.list.filter((e) => e.t === 'hit'), tgt = F[(hits[0] || {}).to] || firstFoe();
      EN.wrap = tgt;
      UI.banner('Envoi', 2.4); UI.cinematic(true); UI.vignette(0.6); UI.tint(0.4);
      envoiShot([{ x: tgt.pos.x, y: tgt.tall, z: tgt.pos.z }], 1.5);
      io().m.play('cast', true);
      M.play('envoi', true); SND.sfx.fire();
      // the engine lists eight blows and then the Last Word; if the foes fell early, the list stops there
      for (let k = 0; k < hits.length; k++) {
        const last = k === hits.length - 1 && hits.length === A.hits.length;
        await untilP(M, A.hits[last ? A.hits.length - 1 : Math.min(k, A.hits.length - 2)]);
        const t = F[hits[k].to] || tgt, p = chest(t);
        if (last) {
          UI.banner('Last Word', 1.6); UI.flash('#fff1c8', 0.9, 0.7); SND.sfx.boom(1.5); SND.sfx.boom(1.0); addShake(20); hitStop(0.22);
          FX.ring(t.pos, 0xffd08a, 0.3, 5.5, 0.9, 1); FX.burst(p, [1, 0.8, 0.5], 140, 6, { spread: 0.6 }); FX.flashLight(p, 0xffd0a0, 9, 0.8, 12);
          ev.show({ big: true });
        } else {
          if (k === 0) UI.banner('Letting Go', 1.6);
          FX.burst(p, [1, 0.75, 0.4], 26, 3); FX.flashLight(p, 0xffb060, 2.5, 0.25); SND.sfx.hit(0.8); addShake(5); hitStop(0.03);
          ev.show();
        }
      }
      ev.rest();
      await until(() => M.progress < 0 || M.progress >= 1);
      if (!E.over) UI.msg('Envoi has burned away, its letters sent.', true);
      await wait(1.2); UI.hideMsg();
      EN.on = false; EN.wrap = null; envoiHide();
      UI.vignette(0); UI.tint(0); if (!E.over) UI.cinematic(false);
    }

    // ---------- the foes ----------
    const blowTarget = (ev) => (ev.peek() && F[ev.peek().to]) || (EN && EN.on && ev.list.some((e) => e.t === 'ward') ? ENV.ward : null) || reach()[0] || living('hero')[0] || io();
    const WRAITH_MOVES = {
      async sweep(f, ev) {
        const t = blowTarget(ev), W = f.m, spot = toward(f.pos, t.pos, f.look.near || 1.75), k = f.look.fxScale || 1;
        shotBoth(t.pos, f.pos, 1.1, 2.5);
        await moveTo(f, spot.x, spot.z, 3.4);
        faceTo(f, t); await wait(0.15);
        if (f.tall > 3) shotBoth(t.pos, f.pos, 1.1, 3); else shotAt(mid(t.pos, f.pos), 1.65, 3);
        W.play('sweep', true); SND.sfx.shriek(0.6);
        await untilP(W, W.ACTIONS.sweep.cues[0]); SND.sfx.swish();
        await untilP(W, W.ACTIONS.sweep.hits[0]);
        const p = chest(blowTarget(ev));
        FX.slash(p, 0x5dff9d, rnd(2.4, 3.0), 1.5 * Math.sqrt(k), 0.35); FX.burst(p, [0.3, 1, 0.55], 40, 3.6); FX.flashLight(p, 0x4dff90, 3, 0.3);
        SND.sfx.hit(1.1); addShake(10 * k); hitStop(0.09); ev.show();
        await until(() => !W.busy); ev.rest();
        await goHome(f, 3.2);
      },
      async bolts(f, ev) {
        const t = blowTarget(ev); faceTo(f, t); shotField(2.5);
        const W = f.m; W.play('cast', true); SND.sfx.shriek(0.5);
        const aims = ev.list.filter((e) => e.t === 'hit').map((e) => F[e.to]), hits = [];
        for (const u of W.ACTIONS.cast.hits) {
          await untilP(W, u); SND.sfx.fire();
          const tt = aims[hits.length] || t;
          hits.push(FX.projectile({ from: W.anchor('bolt', V()), to: () => chest(tt), dur: 0.55, arc: rnd(0.3, 0.9), side: rnd(-0.25, 0.25), color: 0x9dffc4, halo: 0x2cff7c, size: 0.2, trail: [0.25, 1, 0.5], light: 0x3cff8a, lightI: 2 }).then(() => {
            if (!ev.has()) return;
            const p = chest(F[ev.peek().to] || tt); FX.burst(p, [0.3, 1, 0.55], 22, 2.6); SND.sfx.hit(0.7); addShake(5); hitStop(0.04); ev.show();
          }));
        }
        await Promise.all(hits); await until(() => !W.busy); ev.rest();
      },
      async grasp(f, ev) {
        const t = blowTarget(ev); faceTo(f, t); shotBoth(t.pos, f.pos, 1.0, 2.5);
        FX.sigil(t.pos, 0x2dff7a, 2.0, 1.9, -2);
        const W = f.m; W.play('grasp', true); SND.sfx.grasp();
        await untilP(W, W.ACTIONS.grasp.cues[0]); shotAt(t.pos, 1.6, 3.5);
        FX.tendrils(t.pos, 1.3); FX.burst(new THREE.Vector3(t.pos.x, 0.2, t.pos.z), [0.2, 0.9, 0.45], 50, 3, { up: 1 });
        await untilP(W, W.ACTIONS.grasp.hits[0]);
        FX.flashLight(chest(blowTarget(ev)), 0x3cff8a, 3, 0.4); SND.sfx.hit(1.2); addShake(12); hitStop(0.1); ev.show();
        await until(() => !W.busy); ev.rest();
      },
      async eclipse(f, ev) {
        UI.cinematic(true); UI.vignette(0.9);
        const t = blowTarget(ev); faceTo(f, t); shotAt(f.pos, 1.25, 2);
        const W = f.m, EC = W.ACTIONS.eclipse, k = f.look.fxScale || 1; W.play('eclipse', true); SND.sfx.eclipse(); SND.sfx.shriek(1.4);
        FX.blackSun(W.anchor('sun', V()), 2.4 * (EC.dur / 2.8), k > 1 ? k * 0.55 : 1);
        await untilP(W, EC.cues[1]); shotField(3);
        FX.ring(f.pos, 0x2dff7a, 0.3, 6.5 * k, 0.9, 1);
        await untilP(W, EC.hits[0]);
        for (const h of reach()) { const p = chest(h); FX.burst(p, [0.2, 1, 0.5], 80, 5); FX.flashLight(p, 0x3cff8a, 5, 0.5, 8); }
        UI.flash('#0b2a16', 0.7, 0.4); SND.sfx.boom(1.3); addShake(16); hitStop(0.14);
        ev.showAll({ big: true });
        await until(() => !W.busy); ev.rest();
        UI.vignette(0); UI.cinematic(false);
      },
    };
    // the great wraith's own two: the town's stolen fire breathed on the party, and the lamplight it drinks to heal
    Object.assign(WRAITH_MOVES, {
      async breath(f, ev) {
        const W = f.m, A = W.ACTIONS.breath, tg = reach(), mid = centerOf((tg.length ? tg : living('hero')).map((h) => h.pos));
        f.aimAt = { pos: mid, look: {}, m: { anchor: (n, o) => (o || V()).set(mid.x, 1.1, mid.z) } };
        faceTo(f, { pos: mid }); shotField(2.5);
        W.play('breath', true); SND.sfx.shriek(0.8);
        await untilP(W, A.cues[0]); SND.sfx.fire(); addShake(5);
        for (let k = 0; k < A.hits.length; k++) {
          await untilP(W, A.hits[k]);
          for (const h of reach()) { const p = chest(h); FX.burst(p, [1, 0.7, 0.3], k ? 18 : 30, 3); FX.flashLight(p, 0xffa040, 3, 0.4, 6); }
          SND.sfx.fire(); addShake(k ? 5 : 9); hitStop(0.06);
          if (k === 0) ev.showAll();
        }
        await until(() => !W.busy); f.aimAt = null; ev.rest();
      },
      async swallow(f, ev) {
        const W = f.m, A = W.ACTIONS.swallow;
        shotAt(f.pos, 0.95, 2.4, f.tall * 0.55);
        W.play('swallow', true); SND.sfx.grasp();
        await untilP(W, A.cues[0]);
        FX.converge(() => W.anchor('heart', V()), [1, 0.78, 0.4], 1.3, 90);
        await untilP(W, A.hits[0]);
        FX.burst(W.anchor('heart', V()), [1, 0.82, 0.45], 50, 3.4); FX.flashLight(W.anchor('heart', V()), 0xffb45a, 4, 0.6, 8); SND.sfx.heal();
        ev.show();
        await until(() => !W.busy); ev.rest();
      },
    });
    const WISP_MOVES = {
      async flicker(f, ev) {
        const t = blowTarget(ev); faceTo(f, t); shotBoth(t.pos, f.pos, 1.0, 2.6);
        f.aim = t; const W = f.m; W.play('flicker', true); SND.sfx.fire();
        await untilP(W, W.ACTIONS.flicker.hits[0]);
        const p = chest(blowTarget(ev)); FX.burst(p, [0.85, 0.5, 1], 30, 3); FX.flashLight(p, 0xb070ff, 2.5, 0.3); SND.sfx.hit(0.8); addShake(5); hitStop(0.05);
        ev.show();
        await until(() => !W.busy); f.aim = null; ev.rest();
      },
      // it latches on and drinks: each sip a blow on its prey, then a heal on itself
      async cling(f, ev) {
        const t = blowTarget(ev); faceTo(f, t); shotBoth(t.pos, f.pos, 1.15, 2.6);
        f.aim = t; const W = f.m, A2 = W.ACTIONS.cling; W.play('cling', true); SND.sfx.grasp();
        for (let k = 0; k < A2.hits.length; k++) {
          await untilP(W, A2.hits[k]);
          if (ev.has() && ev.peek().t === 'hit') { const p = chest(blowTarget(ev)); FX.burst(p, [0.75, 0.45, 1], 16, 2); SND.sfx.hit(0.6); ev.show(); }
          await untilP(W, A2.cues[k]);
          if (ev.peek() && ev.peek().t === 'heal') ev.show();
        }
        await until(() => !W.busy); f.aim = null; ev.rest();
      },
      async wail(f, ev) {
        shotField(2.5); const W = f.m; W.play('wail', true); SND.sfx.shriek(0.9);
        await untilP(W, W.ACTIONS.wail.hits[0]);
        for (const h of reach()) FX.burst(chest(h), [0.8, 0.6, 1], 26, 2.6);
        addShake(8); hitStop(0.06); ev.showAll();
        await until(() => !W.busy); ev.rest();
      },
      async breath(f, ev) {
        shotField(2.5); const W = f.m; W.play('breath', true); SND.sfx.fire();
        await untilP(W, W.ACTIONS.breath.hits[0]);
        for (const h of reach()) { const p = chest(h); FX.burst(p, [0.7, 0.9, 1], 30, 2.8); FX.flashLight(p, 0x9fd8ff, 2.5, 0.4); }
        addShake(7); hitStop(0.05); ev.showAll(); ev.rest();
        UI.note('Frost: the party’s turns come slower for a while.', 1.6);
        await until(() => !W.busy);
      },
      async gutter(f, ev) {
        shotAt(f.pos, 1.6, 2.6, 0.5); const W = f.m; W.play('gutter', true);
        await untilP(W, W.ACTIONS.gutter.cues[0]); word(f, 'Guttering');
        await until(() => !W.busy); ev.rest();
      },
    };

    // ---------- Halcyon, the Gloam Knight ----------
    // Her model carries her own effects (the blade's cold trail and sparks, Light-Drinker's streams, Black Noon's black
    // sun and swirls); the screen moves her to her targets and lands the engine's blows at her hit times
    const HAL_BLUE = 0x9ec4ff;
    const warded = (ev) => !!(EN && EN.on && ev.list.some((e) => e.t === 'ward'));
    function halHitFx(t, big) {
      const p = chest(t);
      FX.slash(p, HAL_BLUE, rnd(-0.6, 2.6), big ? 1.4 : 1.15, 0.3); FX.burst(p, [0.6, 0.75, 1], big ? 44 : 30, big ? 4 : 3.2); FX.flashLight(p, 0x8fb8ff, big ? 4 : 3, 0.3);
      SND.sfx.hit(big ? 1.2 : 1.0); addShake(big ? 12 : 9); hitStop(big ? 0.11 : 0.08);
    }
    // a blade blow on one hero: she closes to `dist` (her own lunge carries her the rest), strikes, and walks back
    async function halMelee(f, ev, act, dist, o) {
      o = o || {};
      const t = blowTarget(ev), W = f.m;
      shotBoth(t.pos, f.pos, 1.1, 2.5);
      await runUp(f, t, dist, 4.6);
      shotAt(mid(t.pos, f.pos), 1.6, 3);
      f.aim = t; if (o.drink) f.aimAt = t;
      W.play(act, true); SND.sfx.swish();
      await untilP(W, W.ACTIONS[act].hits[0]);
      if (ev.has()) { halHitFx(blowTarget(ev), o.big); ev.show(); }
      if (o.drink) {
        // the stolen light streams up into her blade: she heals by what she took, and drinks Sol's Heat or Io's MP
        await untilP(W, 0.62);
        if (ev.peek() && ev.peek().t === 'heal') { FX.converge(() => W.anchor('blade', V()), [0.75, 0.85, 1], 0.6, 50); SND.sfx.heal(); ev.show(); }
      }
      await until(() => !W.busy); f.aim = null; f.aimAt = null; ev.rest();
      await goHome(f, 3.6);
    }
    const HALCYON_MOVES = {
      gloamCleave: (f, ev) => halMelee(f, ev, 'gloamCleave', 2.0, { big: true }),
      // she lunges from a few strides off at whoever is lowest; the cut leaves them Severed
      severance: (f, ev) => halMelee(f, ev, 'severance', 4.2),
      lightDrinker: (f, ev) => halMelee(f, ev, 'lightDrinker', 1.5, { drink: true }),
      // a wide arc of dusk through both heroes
      async duskArc(f, ev) {
        const W = f.m, tg = reach(), c = centerOf((tg.length ? tg : living('hero')).map((h) => h.pos));
        shotField(2.5);
        const spot = toward(f.pos, c, 2.0); await moveTo(f, spot.x, spot.z, 4.6); faceTo(f, { pos: c }); await wait(0.1);
        shotField(3);
        W.play('duskArc', true); SND.sfx.swish();
        await untilP(W, W.ACTIONS.duskArc.hits[0]);
        if (warded(ev)) halHitFx(ENV.ward, true); else for (const h of reach()) halHitFx(h);
        FX.ring(c, HAL_BLUE, 0.4, 3.2, 0.6, 0.8);
        ev.showAll();
        await until(() => !W.busy); ev.rest();
        await goHome(f, 3.6);
      },
      // Sol's own stance: until her next turn she counters every physical blow; magic doesn't set it off
      async vowStance(f, ev) {
        const W = f.m; shotAt(f.pos, 1.6, 2.6);
        W.play('vowStance', true); SND.sfx.guard();
        await until(() => !W.busy || W.progress >= 0.95);
        word(f, 'Warden’s Vow');
        UI.note(S.vowSeen ? 'Warden’s Vow: she counters any physical blow until her next turn.' : 'Warden’s Vow: until her next turn she counters every physical blow. Magic doesn’t set it off.', 2.4);
        S.vowSeen = true;
        await wait(0.8); ev.rest();
      },
      // the charged blow, released: the black sun falls on the whole party
      async blackNoon(f, ev) {
        const W = f.m, A = W.ACTIONS.blackNoon, tg = reach(), c = centerOf((tg.length ? tg : living('hero')).map((h) => h.pos));
        UI.cinematic(true); UI.vignette(0.85);
        shotField(2.2);
        const spot = toward(f.pos, c, 3.0); await moveTo(f, spot.x, spot.z, 4.6); faceTo(f, { pos: c });
        W.play('blackNoon', true); SND.sfx.eclipse();
        await untilP(W, A.hits[0] - 0.08); SND.sfx.swish();
        await untilP(W, A.hits[0]);
        for (const h of warded(ev) ? [ENV.ward] : reach()) { const p = chest(h); FX.burst(p, [0.5, 0.6, 1], 80, 5); FX.flashLight(p, 0x7fa0ff, 5, 0.5, 8); }
        UI.flash('#0a0c1e', 0.8, 0.5); SND.sfx.boom(1.5); addShake(20); hitStop(0.18);
        ev.showAll({ big: true });
        await until(() => !W.busy); ev.rest();
        UI.vignette(0); if (!E.over) UI.cinematic(false);
        await goHome(f, 3.6);
      },
    };
    // ---------- Noctara the Starless (the finale, plan step 17), after her bench stage (src/bench/stage-noctara.js) ----------
    // Her model carries its own effects (the crown's shards, the void orb, the frost dust, the light leaving). The screen
    // aims them, darkens the world for Blackout while Halcyon strikes unseen, and lets Frost Dust's blow land as it thaws
    const darkTo = (v, sec) => { const d = $('dark'); if (!d) return; d.style.transition = 'opacity ' + (sec || 0.4) + 's'; d.style.opacity = String(v); };
    const NOCTARA_MOVES = {
      async crownShards(f, ev) {
        const W = f.m, A = W.ACTIONS.crownShards, aims = ev.list.filter((e) => e.t === 'hit').map((e) => F[e.to]);
        f.aimAt = aims[0] || blowTarget(ev); shotField(2.5);
        W.play('crownShards', true); SND.sfx.chime();
        for (let k = 0; k < A.hits.length; k++) {
          f.aimAt = aims[k] || f.aimAt;
          await untilP(W, A.hits[k]);
          if (ev.has()) { const p = chest(blowTarget(ev)); FX.burst(p, [0.8, 0.7, 1], 26, 3); FX.flashLight(p, 0xb69cff, 2.5, 0.3); SND.sfx.hit(0.8); addShake(6); hitStop(0.04); ev.show(); }
        }
        await until(() => !W.busy); f.aimAt = null; ev.rest();
      },
      // the void orb, gathered a turn ahead: it opens over the party and collapses on everyone
      async voidSphere(f, ev) {
        const W = f.m, A = W.ACTIONS.voidSphere;
        UI.cinematic(true); UI.vignette(0.7); shotField(2.2);
        W.play('voidSphere', true); SND.sfx.eclipse();
        await untilP(W, A.hits[0]);
        for (const h of warded(ev) ? [ENV.ward] : reach()) { const p = chest(h); FX.burst(p, [0.7, 0.5, 1], 70, 4.6); FX.flashLight(p, 0x9a6cff, 5, 0.5, 8); }
        UI.flash('#1a0830', 0.85, 0.5); SND.sfx.boom(1.5); addShake(20); hitStop(0.16);
        ev.showAll({ big: true });
        await until(() => !W.busy); ev.rest();
        UI.vignette(0); if (!E.over) UI.cinematic(false);
      },
      // the party slows; the blow waits in the frost and lands as it thaws
      async frostDust(f, ev) {
        const W = f.m; shotField(2.5);
        W.play('frostDust', true); SND.sfx.chime();
        await untilP(W, 0.45); ev.rest();
        UI.note('Frost Dust: the party slows. Its blow lands as the frost thaws.', 2.6);
        await until(() => !W.busy);
      },
      // the light leaves; Halcyon strikes out of the dark; the damage shows as the light comes back
      async blackout(f, ev) {
        const W = f.m, bo = ev.list.find((e) => e.t === 'blackout'), h = bo ? F[bo.by] : null, t = blowTarget(ev);
        shotField(2.5); W.play('blackout', true); SND.sfx.eclipse();
        await untilP(W, 0.17); darkTo(0.95, 0.5); UI.tint(0.8);
        await untilP(W, 0.36);
        if (h && t && F[t.key] && D[h.key].hp > 0) { const s2 = toward(h.pos, t.pos, 1.4); h.pos = { x: s2.x, z: s2.z }; faceTo(h, t); h.aim = t; h.m.play('severance', true); }
        await untilP(W, 0.6);
        UI.flash('#9cc4ff', 0.3, 0.25); SND.sfx.swish(); SND.sfx.hit(1.3); addShake(14); hitStop(0.1);
        await untilP(W, 0.8); darkTo(0, 0.6); UI.tint(0);
        if (t && F[t.key]) halHitFx(t, true);
        ev.showAll({ big: true });
        if (h) { h.aim = null; if (h.m.reset) h.m.reset(); h.pos = { x: h.home.x, z: h.home.z }; h.yaw = h.tyaw = h.home.yaw; }
        await until(() => !W.busy); ev.rest();
      },
    };
    // Frost Dust's blow, landing as the frost thaws
    async function thaw(hd, ev) {
      apply(hd); shotField(2.5);
      for (const h of warded(ev) ? [ENV.ward] : reach()) { const p = chest(h); FX.burst(p, [0.8, 0.92, 1], 40, 3.6); FX.flashLight(p, 0xbfe0ff, 3, 0.4, 6); }
      UI.flash('#e6f4ff', 0.45, 0.35); SND.sfx.hit(1.1); addShake(10); hitStop(0.08);
      ev.showAll(); await wait(0.8); ev.rest();
    }

    // ---------- the Bramble Horror (Chris's bench, reference/demos/bramble-horror-bench.html) ----------
    // Rooted: it never moves. Its canes orient on its prey (state.target, from aimAt), lash out, hook and drag; its own model
    // carries the sap, the berry juice, the leaves and the feeding glow. Its prey is carried in its canes while it holds her
    const BERRY = 0xff4d7a;
    function thornFx(t, big) {
      const p = chest(t);
      FX.slash(p, BERRY, rnd(-0.6, 2.6), big ? 1.35 : 1.1, 0.3); FX.burst(p, [0.95, 0.35, 0.5], big ? 40 : 26, big ? 3.8 : 3); FX.flashLight(p, 0xff6080, big ? 3 : 2, 0.3);
      SND.sfx.hit(big ? 1.2 : 0.95); addShake(big ? 11 : 7); hitStop(big ? 0.1 : 0.06);
    }
    const BRAMBLE_MOVES = {
      async strike(f, ev) {
        const t = blowTarget(ev), W = f.m; f.aimAt = t;
        shotBoth(t.pos, f.pos, 1.05, 2.6);
        W.play('strike', true); SND.sfx.swish();
        await untilP(W, W.ACTIONS.strike.hits[0]);
        if (ev.has()) { thornFx(blowTarget(ev), true); ev.show(); }
        await until(() => !W.busy); f.aimAt = null; ev.rest();
      },
      async sweep(f, ev) {
        const W = f.m; shotField(2.5);
        W.play('sweep', true); SND.sfx.swish();
        await untilP(W, W.ACTIONS.sweep.hits[0]);
        if (warded(ev)) thornFx(ENV.ward, true); else for (const h of reach()) thornFx(h);
        addShake(9); ev.showAll();
        await until(() => !W.busy); ev.rest();
      },
      // its canes take the lured hero, lift her on each squeeze and drag her to the crown; then it lets her drop
      async grab(f, ev) {
        const t = blowTarget(ev), W = f.m, A = W.ACTIONS.grab, real = !!F[t.key] && t.side === 'hero';
        f.aimAt = t; shotBoth(t.pos, f.pos, 1.0, 2.4);
        if (real) { t.chestH = chest(t).y - (t.y || 0); t.heldBy = f; }
        W.play('grab', true); SND.sfx.grasp();
        for (let k = 0; k < A.hits.length; k++) {
          await untilP(W, A.hits[k]);
          if (ev.has()) { thornFx(blowTarget(ev), k === A.hits.length - 1); ev.show(); }
        }
        await until(() => !W.busy); f.aimAt = null; ev.rest();
        if (real) { await until(() => !t.heldBy && !(t.y > 0.01)); if (D[t.key].hp > 0) await goHome(t, 3); }
      },
      // it feeds through its roots: each pulse a blow on its prey, then a heal of what it took
      async consume(f, ev) {
        const t = blowTarget(ev), W = f.m, A = W.ACTIONS.consume;
        f.aimAt = t; shotBoth(t.pos, f.pos, 1.0, 2.4);
        W.play('consume', true); SND.sfx.grasp();
        for (let k = 0; k < A.hits.length; k++) {
          await untilP(W, A.hits[k]);
          if (ev.peek() && ev.peek().t !== 'heal') { const p = chest(blowTarget(ev)); FX.burst(p, [0.95, 0.3, 0.55], 22, 2.4); FX.flashLight(p, 0xff3d8a, 2.4, 0.3); SND.sfx.hit(0.8); addShake(5); ev.show(); }
          await untilP(W, A.cues[k]);
          if (ev.peek() && ev.peek().t === 'heal') { FX.burst(W.anchor('hollow', V()), [1, 0.35, 0.6], 20, 2); SND.sfx.heal(); ev.show(); }
        }
        await until(() => !W.busy); f.aimAt = null; ev.rest();
      },
      // canes stabbed into the soil; thorned shoots burst up round the prey and close over her
      async undergrowth(f, ev) {
        const t = blowTarget(ev), W = f.m, A = W.ACTIONS.undergrowth;
        f.aimAt = t; shotBoth(t.pos, f.pos, 1.0, 2.4);
        W.play('undergrowth', true); SND.sfx.grasp();
        await untilP(W, A.cues[0]); addShake(9); hitStop(0.05); SND.sfx.boom(0.6);
        if (!warded(ev)) FX.briars(t.pos, 1.9);
        for (let k = 0; k < A.hits.length; k++) {
          await untilP(W, A.hits[k]);
          if (ev.has()) { thornFx(blowTarget(ev), true); FX.burst(new THREE.Vector3(t.pos.x, 0.25, t.pos.z), [0.6, 0.3, 0.35], 40, 3, { up: 1 }); ev.show(); }
        }
        await until(() => !W.busy); f.aimAt = null; ev.rest();
      },
    };
    // the Lure: it holds its fruit out to one hero, who walks a few steps toward it; the Grab comes on its next turn
    async function lureTurn(f, hd, ev) {
      const W = f.m, t = hd.to ? F[hd.to] : null;
      UI.banner('Lure', 2.2); if (t) { f.aimAt = t; shotBoth(t.pos, f.pos, 1.0, 2.2); } else shotAt(f.pos, 1.2, 2.2);
      W.play('lure', true); SND.sfx.chime(); f.charged = true;
      await untilP(W, W.ACTIONS.lure.hits[0]);
      if (t) {
        word(t, 'Lured');
        const fruit = W.anchor('lure', V()), p = { x: t.pos.x + (fruit.x - t.pos.x) * 0.35, z: t.pos.z + (fruit.z - t.pos.z) * 0.35 };
        moveTo(t, p.x, p.z, 0.9);
        UI.note(E.unit(t.key).name + ' is drawn to the fruit, and her turn gauge stops. It will Grab her on its next turn. Fire breaks the lure.', 3.2);
      }
      await until(() => !W.busy); await wait(0.4); ev.rest();
    }

    // ---------- the Bramble Colossus (3d-model-new-character-ideas/bramble-colossus): the last band's great wild foe ----------
    // Rooted, and as big as a house. Its canes reach for their prey (state.target, from aimAt); its own model draws the
    // shockwaves, the split ground, the flung thorns, Thornwood's shoots and the life it drinks. In Devour its prey is
    // carried in its arms (heldBy, as in the Bramble Horror's Grab) and hidden while she is inside its shut bud. Between its
    // turns the engine says whether its bud is open, its heart bare to blows that land double, and the model holds it open
    // (state.open)
    function quake(p, k) {
      FX.ring(p, 0xffd9c8, 0.3, 3.4 * k, 0.8, 0.8);
      FX.burst(new THREE.Vector3(p.x, 0.15, p.z), [0.5, 0.42, 0.36], Math.round(44 * k), 3.2, { up: 1 });
      addShake(12 * k); SND.sfx.boom(0.6 + 0.4 * k);
      if (BF) BF.impact(p, k);
    }
    // the party's middle, for the moves that fall on everyone
    function partyAim() {
      const tg = reach(), c = centerOf((tg.length ? tg : living('hero')).map((h) => h.pos));
      return { pos: c, look: {}, m: { anchor: (n, o) => (o || V()).set(c.x, 1.1, c.z) } };
    }
    // a wave of blows on everyone: the engine tags each hero's blow with its wave
    function showWave(ev, i, o) { while (ev.peek() && (ev.peek().wave === i || ev.peek().t !== 'hit')) ev.show(o); }
    const COLOSSUS_MOVES = {
      // the lead arm draws back high and spears down through its prey into the ground
      async lance(f, ev) {
        const t = blowTarget(ev), W = f.m, A = W.ACTIONS.lance; f.aimAt = t;
        shotBoth(t.pos, f.pos, 1, 2.4);
        W.play('lance', true); SND.sfx.grasp();
        await untilP(W, A.cues[0]); SND.sfx.swish();
        await untilP(W, A.hits[0]);
        if (ev.has()) { const tt = blowTarget(ev); thornFx(tt, true); quake(tt.pos, 0.7); hitStop(0.12); ev.show({ big: true }); }
        await until(() => !W.busy); f.aimAt = null; ev.rest();
      },
      // Hammerfall: both arms twine into one club and hang while the heart blazes, then fall on the prey; the ground splits
      // and a shockwave runs out over the whole party
      async slam(f, ev) {
        const t = blowTarget(ev), W = f.m, A = W.ACTIONS.slam; f.aimAt = t;
        shotBoth(t.pos, f.pos, 0.95, 2.2);
        W.play('slam', true); SND.sfx.grasp();
        await untilP(W, A.cues[0]); FX.converge(() => W.anchor('heart', V()), [1, 0.35, 0.5], 0.7, 70); SND.sfx.eclipse();
        await untilP(W, A.hits[0]);
        if (ev.has()) { const tt = blowTarget(ev); thornFx(tt, true); quake(tt.pos, 1.25); UI.flash('#ffd8c8', 0.35, 0.3); hitStop(0.12); ev.show({ big: true }); }
        await untilP(W, A.hits[1]);
        if (ev.has()) { shotField(3); for (const h of reach()) FX.burst(chest(h), [0.7, 0.58, 0.48], 26, 2.8); addShake(10); SND.sfx.hit(0.9); ev.showAll(); }
        await until(() => !W.busy); f.aimAt = null; ev.rest();
      },
      // Maelstrom: it winds round, then every cane whirls round it twice at three heights, four blows on the whole party
      async whirl(f, ev) {
        const W = f.m, A = W.ACTIONS.whirl; f.aimAt = partyAim();
        shotField(2.2);
        W.play('whirl', true); SND.sfx.grasp();
        await untilP(W, A.cues[0]); SND.sfx.swish();
        for (let k = 0; k < A.hits.length; k++) {
          await untilP(W, A.hits[k]);
          if (!ev.has()) continue;
          if (warded(ev)) { thornFx(ENV.ward, true); ev.show(); continue; }
          for (const h of reach()) thornFx(h, k === A.hits.length - 1);
          SND.sfx.swish(); addShake(7 + 2 * k); showWave(ev, k);
        }
        await until(() => !W.busy); f.aimAt = null; ev.rest();
      },
      // Thorn Volley: two whip-cracks fling its thorns high, and they rain on the party in three waves
      async volley(f, ev) {
        const W = f.m, A = W.ACTIONS.volley; f.aimAt = partyAim();
        shotField(2.4);
        W.play('volley', true); SND.sfx.swish();
        for (const c of A.cues) { await untilP(W, c); SND.sfx.swish(); addShake(4); }
        for (let k = 0; k < A.hits.length; k++) {
          await untilP(W, A.hits[k]);
          if (!ev.has()) continue;
          if (warded(ev)) { thornFx(ENV.ward, true); ev.show(); continue; }
          for (const h of reach()) { thornFx(h, false); FX.burst(new THREE.Vector3(h.pos.x + rnd(-0.8, 0.8), 0.1, h.pos.z + rnd(-0.8, 0.8)), [0.55, 0.45, 0.38], 16, 2, { up: 1 }); }
          showWave(ev, k);
        }
        await until(() => !W.busy); f.aimAt = null; ev.rest();
      },
      // Thornwood: its canes stab the soil, the ground splits toward the prey, and shoots as tall as young trees burst up
      // round her and squeeze
      async briar(f, ev) {
        const t = blowTarget(ev), W = f.m, A = W.ACTIONS.briar; f.aimAt = t;
        shotBoth(t.pos, f.pos, 1, 2.4);
        W.play('briar', true); SND.sfx.grasp();
        await untilP(W, A.cues[0]); quake(t.pos, 0.6); hitStop(0.05);
        if (!warded(ev)) FX.briars(t.pos, 2.4);
        for (let k = 0; k < A.hits.length; k++) {
          await untilP(W, A.hits[k]);
          if (ev.has()) { const tt = blowTarget(ev); thornFx(tt, true); FX.burst(new THREE.Vector3(tt.pos.x, 0.25, tt.pos.z), [0.6, 0.3, 0.35], 40, 3, { up: 1 }); ev.show({ big: k === A.hits.length - 1 }); }
        }
        await until(() => !W.busy); f.aimAt = null; ev.rest();
      },
      // Devour, the bloom's end: its arms seize the charmed hero and lift her into the flower, which shuts; three gulps,
      // each a blow and then a heal, while ribbons of stolen life spiral down the spire; then it bursts open and sets her
      // back where she stood
      async devour(f, ev) {
        const t = blowTarget(ev), W = f.m, A = W.ACTIONS.devour, real = !!F[t.key] && t.side === 'hero';
        f.aimAt = t; shotBoth(t.pos, f.pos, 0.95, 2.2);
        if (real) { t.chestH = chest(t).y - (t.y || 0); t.heldBy = f; }
        W.play('devour', true); SND.sfx.grasp();
        await untilP(W, A.hits[0]);
        if (ev.has()) { thornFx(blowTarget(ev), true); ev.show(); }
        followShot(() => W.anchor('bud', V()), 1.1, 2.4);
        for (let k = 1; k < A.hits.length; k++) {
          await untilP(W, A.hits[k]);
          if (ev.peek() && ev.peek().t !== 'heal') { const p = W.anchor('bloom', V()); FX.burst(p, [0.95, 0.3, 0.55], 26, 2.4); FX.flashLight(p, 0xff3d8a, 3, 0.3); SND.sfx.hit(0.85); addShake(6); ev.show(); }
          await untilP(W, A.cues[k - 1]);
          if (ev.peek() && ev.peek().t === 'heal') { FX.burst(W.anchor('heart', V()), [1, 0.35, 0.6], 22, 2); SND.sfx.heal(); ev.show(); }
        }
        await untilP(W, A.cues[A.cues.length - 1]); shotBoth(t.pos, f.pos, 0.95, 2.4); SND.sfx.boom(0.6);
        await until(() => !W.busy); f.aimAt = null; ev.rest();
        if (real) { await until(() => !t.heldBy && !(t.y > 0.01)); if (D[t.key].hp > 0) await goHome(t, 3); }
      },
      // Wrath, its second phase at half its HP: it curls in on itself, then bursts open in a ring of red light
      async enrage(f, ev) {
        const W = f.m, A = W.ACTIONS.enrage;
        UI.cinematic(true); shotAt(f.pos, 0.85, 2.2, f.tall * 0.55);
        W.play('enrage', true); SND.sfx.grasp();
        await untilP(W, A.cues[0]);
        W.state.wrath = 1; f.wrathShown = true;
        FX.ring(f.pos, 0xff4a2a, 0.5, 7.5, 1.1, 1); FX.flashLight(W.anchor('heart', V()), 0xff4a2a, 5, 0.8, 14);
        UI.flash('#ff5a3a', 0.45, 0.6); SND.sfx.eclipse(); SND.sfx.shriek(1.3); addShake(16); hitStop(0.1);
        UI.note('Its Wrath: it is quicker and hits harder now. Its flower has burst open, and its heart is bare.', 3);
        await until(() => !W.busy); ev.rest();
        UI.cinematic(false);
      },
    };
    // Siren Bloom: the flower opens wide on its heart and pours pollen over the party, who step toward it, charmed. On its
    // next turn it Devours the one it chose. Fire, or a big blow to the bare heart, breaks the bloom
    async function bloomTurn(f, hd, ev) {
      const W = f.m, A = W.ACTIONS.bloom, t = hd.to ? F[hd.to] : null;
      UI.banner(hd.name, 2.4); f.aimAt = partyAim(); shotBoth(t ? t.pos : f.aimAt.pos, f.pos, 0.95, 2.2);
      W.play('bloom', true); SND.sfx.chime(); f.charged = true;
      await untilP(W, A.cues[0]);
      FX.converge(() => W.anchor('bloom', V()), [1, 0.7, 0.85], 1, 60);
      await untilP(W, A.hits[0]);
      const fl = W.anchor('bloom', V());
      for (const h of reach()) { FX.burst(chest(h), [1, 0.75, 0.9], 20, 1.6); const p = { x: h.pos.x + (fl.x - h.pos.x) * 0.22, z: h.pos.z + (fl.z - h.pos.z) * 0.22 }; moveTo(h, p.x, p.z, 0.8); }
      ev.rest();
      if (t) f.aimAt = t;
      UI.note('Its pollen charms the party: their turns come at half speed. It will Devour ' + (t ? E.unit(t.key).name : 'one of them') + ' on its next turn. Fire, or a big blow to its bare heart, breaks the bloom.', 3.6);
      await until(() => !W.busy); await wait(0.3);
    }

    // ---------- any foe's move, from its model's own motion: how a new mob plays before it has choreography of its own ----------
    // The move's `act` in rules.js names the model's action (the move's own name by default). The foe walks up to its prey
    // first if its look says how near it strikes from (`near`), plays the action, and the engine's blows land at the
    // action's hit times, in its look's colors (`hitColor`, `hitRGB`). A move on the whole party lands wave by wave
    async function anyMove(f, hd, ev) {
      const W = f.m, u = E.unit(f.key), m = u.def.moves[hd.move] || {}, act = m.act || hd.move, A = W.ACTIONS && W.ACTIONS[act];
      if (!A) { await wait(0.8); ev.rest(); return; }
      const k = f.look.fxScale || 1, color = f.look.hitColor || 0xfff1d0, rgb = f.look.hitRGB || [1, 0.9, 0.75];
      const all = m.target === 'all', self = m.target === 'self', t = all || self ? null : blowTarget(ev);
      const fx = (h, big) => { const p = chest(h); FX.slash(p, color, rnd(-0.6, 2.6), (big ? 1.35 : 1.1) * Math.sqrt(k), 0.3); FX.burst(p, rgb, big ? 40 : 26, big ? 3.8 : 3); FX.flashLight(p, color, big ? 3 : 2, 0.3); SND.sfx.hit(big ? 1.2 : 0.9); addShake((big ? 10 : 6) * k); hitStop(big ? 0.1 : 0.05); };
      const walks = !!(f.look.near && t && t.pos);
      if (walks) { const spot = toward(f.pos, t.pos, f.look.near); shotBoth(t.pos, f.pos, 1.1, 2.5); await moveTo(f, spot.x, spot.z, f.look.speed || 3.4); faceTo(f, t); await wait(0.1); }
      if (all) { f.aimAt = partyAim(); shotField(2.4); } else if (self) shotAt(f.pos, 1.2, 2.4); else { f.aimAt = t; shotBoth(t.pos, f.pos, 1.05, 2.5); }
      W.play(act, true); if (!self) SND.sfx.swish();
      const H = A.hits && A.hits.length ? A.hits : [0.5];
      for (let i = 0; i < H.length; i++) {
        await untilP(W, H[i]);
        if (!ev.has()) continue;
        const last = i === H.length - 1;
        if (warded(ev)) { fx(ENV.ward, true); ev.show(); continue; }
        if (self) { const p = chest(f); FX.burst(p, rgb, 30, 2.6); if (ev.peek().t === 'heal') SND.sfx.heal(); ev.show(); continue; }
        if (all) { for (const h of reach()) fx(h, last); if (H.length > 1) showWave(ev, i); else ev.showAll(); continue; }
        fx(blowTarget(ev), last && H.length > 1); ev.show({ big: last && H.length > 1 });
      }
      await until(() => !W.busy); f.aimAt = null; ev.rest();
      if (walks && D[f.key].hp > 0) await goHome(f, f.look.speed || 3.2);
    }

    // her lost turn after Kestrel: she hesitates, and the moment passes
    async function hesitate(f, ev) {
      UI.banner('Hesitates', 1.6); shotAt(f.pos, 1.5, 2.4);
      f.m.play('stagger', true);
      UI.note(shownName(E.unit(f.key)) + ' hesitates, and her turn passes.', 2);
      await wait(1.8); ev.rest();
    }

    // a foe gathers a charged blow (Black Noon, Void Sphere): it can be seen coming, and lands on the foe's next turn.
    // Its ground glow pulses until then
    async function chargeTurn(f, hd, ev) {
      if (!f) { ev.rest(); return; }
      UI.banner(hd.name, 2.2); shotAt(f.pos, 1.2, 2.4);
      const W = f.m; if (W.ACTIONS && W.ACTIONS.blackNoonCharge) W.play('blackNoonCharge', true); else if (W.ACTIONS && W.ACTIONS.charge) W.play('charge', true); else if (W.ACTIONS && W.ACTIONS.cast) W.play('cast', true);
      FX.ring(f.pos, 0xc49cff, 0.3, 3.2 * (f.look.fxScale || 1), 1.2, 0.9); FX.converge(() => chest(f), [0.8, 0.65, 1], 1.3, 80);
      SND.sfx.eclipse(); f.charged = true;
      UI.note(shownName(E.unit(f.key)) + ' gathers ' + hd.name + '. It falls on its next turn.', 2.6);
      await wait(1.8); ev.rest();
    }

    // ---------- playing a turn's log ----------
    // The log splits into parts, each starting at a move, a strike, a Trance, a herb or a turn; each part plays its
    // own choreography, and the blows inside it are shown at that choreography's hit times
    const OWN_BANNER = { defend: 1, guard: 1, lunara: 1, envoi: 1 };
    async function playLog(log) {
      const parts = [];
      for (const e of log) {
        if (['turn', 'move', 'strike', 'trance', 'charge', 'herb', 'stagger'].includes(e.t) || !parts.length) parts.push([e]);
        else parts[parts.length - 1].push(e);
      }
      for (const part of parts) {
        const hd = part[0], ev = events(part.slice(1));
        if (hd.t === 'turn') {
          // Defend and Guard last until the hero's next turn
          if (S.guard[hd.who]) { S.guard[hd.who] = false; F[hd.who].m.guard(false); if (hd.who === 'io') FX.shield(false); }
          ev.rest();
        } else if (hd.t === 'trance') { await transform(F[hd.who]); ev.rest(); }
        else if (hd.t === 'strike' && hd.who === 'lunara') await lunaraStrike(ev);
        else if (hd.t === 'strike' && hd.who === 'envoi' && EN) await envoiStrike(ev);
        else if (hd.t === 'herb') await useHerb(F[hd.who], hd, ev);
        else if (hd.t === 'charge') await (F[hd.who] && F[hd.who].kind === 'bramble' ? lureTurn(F[hd.who], hd, ev) : F[hd.who] && F[hd.who].kind === 'colossus' ? bloomTurn(F[hd.who], hd, ev) : chargeTurn(F[hd.who], hd, ev));
        else if (hd.t === 'stagger') await hesitate(F[hd.who], ev);
        else if (hd.t === 'move') {
          const f = F[hd.who], u = E.unit(hd.who), t = hd.target ? F[hd.target] : null;
          if (u.side === 'hero') {
            D[u.key].mp = u.mp;
            const fn = (f.key === 'sol' ? SOL_MOVES : IO_MOVES)[hd.move];
            if (!OWN_BANNER[hd.move]) UI.banner(hd.name, hd.move === 'moonlight' || hd.move === 'highNoon' ? 2.2 : 1.4);
            if (fn) await fn(f, t || firstFoe(), ev); else { await wait(0.8); ev.rest(); }
            if (f.key === 'sol') D.sol.heat = u.heat;
          } else {
            if (hd.released) f.charged = false;
            UI.banner(hd.name, hd.move === 'eclipse' ? 2.4 : 1.4);
            // each kind of foe with choreography of its own; any other (a new mob) plays its moves from its model (anyMove)
            const table = { wisp: WISP_MOVES, halcyon: HALCYON_MOVES, bramble: BRAMBLE_MOVES, colossus: COLOSSUS_MOVES, noctara: NOCTARA_MOVES, wraith: WRAITH_MOVES }[f.kind], fn = table && table[hd.move];
            if (fn) await fn(f, ev); else await anyMove(f, hd, ev);
          }
        } else if (hd.t === 'frostEnds' && ev.has()) await thaw(hd, ev);
        else { apply(hd); ev.rest(); } // anything between turns, such as the frost wearing off
        if (E.over === 'lose' && !living('hero').length) break;
      }
      sync();
    }

    // ---------- choosing a command, and its target ----------
    function menuMain(s) {
      const h = s.unit, has = (id) => s.options.find((o) => o.id === id), list = [];
      if (h.id === 'io') {
        if (has('moonlight')) list.push({ id: 'moonlight', label: 'Moonlight', hot: true });
        list.push({ id: 'attack', label: 'Attack' }, { id: 'witchcraft', label: 'Witchcraft' }, { id: 'moonlore', label: 'Moonlore' });
        const sums = ['lunara', 'envoi'].map(has).filter(Boolean);
        list.push({ id: 'summon', label: 'Summon', disabled: !sums.some((o) => o.ok) });
      } else {
        // Kestrel, once Sol knows the knight
        if (has('kestrel') && has('kestrel').ok) list.push({ id: 'kestrel', label: 'Kestrel', tag: 'Once', hot: true });
        if (has('highNoon')) list.push({ id: 'highNoon', label: 'High Noon', hot: true });
        list.push(has('daybreak') ? { id: 'daybreak', label: 'Daybreak' } : { id: 'attack', label: 'Attack' });
        list.push({ id: 'arts', label: 'Sword Arts' });
      }
      if (s.options.some((o) => o.herb)) list.push({ id: 'item', label: 'Item', disabled: !s.options.some((o) => o.herb && o.ok) });
      list.push(h.id === 'io' ? { id: 'defend', label: 'Defend' } : { id: 'guard', label: 'Guard' });
      if (has('flee')) list.push({ id: 'flee', label: 'Flee' });
      return list;
    }
    const tagOf = (o) => (o.mp ? o.mp + ' MP' : o.heat ? (o.id === 'solarCrest' ? 'All' : '−' + o.heat) + ' Heat' : '');
    function menuOf(s, which) {
      const back = { id: 'back', label: 'Back' };
      const item = (id) => { const o = s.options.find((x) => x.id === id); return o ? { id, label: o.name, tag: tagOf(o), disabled: !o.ok } : null; };
      if (which === 'witchcraft') return ['flame', 'crescent', 'briars'].map(item).filter(Boolean).concat([back]);
      if (which === 'moonlore') return ['mend', 'waxing', 'moonsteel', 'harvest'].map(item).filter(Boolean).concat([back]);
      if (which === 'summon') return ['lunara', 'envoi'].map((id) => { const o = s.options.find((x) => x.id === id); return o ? { id, label: o.name, tag: o.ok ? 'Once' : o.why, disabled: !o.ok } : null; }).filter(Boolean).concat([back]);
      if (which === 'arts') return ['flareCut', 'sunder', 'emberRush', 'solarCrest', 'stoopRise'].map(item).filter(Boolean).concat([back]);
      if (which === 'item') return s.options.filter((o) => o.herb).map((o) => ({ id: o.id, label: o.name, disabled: !o.ok })).concat([back]);
      return menuMain(s);
    }
    const SUB = { witchcraft: 'Witchcraft', moonlore: 'Moonlore', summon: 'Summon', arts: 'Sword Arts', item: 'Item' };
    // the target list: foes with how hurt they are, or allies with their HP; an arrow marks the one pointed at
    function targetMenu(s, o, done, backTo) {
      const ts = o.targets.map((k) => F[k]).filter(Boolean);
      const list = ts.map((f) => {
        const u = E.unit(f.key), d = D[f.key];
        return { id: f.key, label: shownName(u), tag: u.side === 'foe' ? Math.round(100 * d.hp / u.maxHp) + '%' : nf(d.hp) + ' HP', first: false };
      });
      // the most hurt is pointed at first: the weakest foe, or the ally who needs it most
      let best = 0, bv = Infinity;
      ts.forEach((f, i) => { const v = D[f.key].hp / E.unit(f.key).maxHp; if (v < bv) { bv = v; best = i; } });
      if (list[best]) list[best].first = true;
      list.push({ id: 'back', label: 'Back' });
      UI.open(list, o.name, (id) => { UI.mark(null); if (id === 'back') return backTo(); done(id); }, (it) => UI.mark(it && F[it.id] ? F[it.id] : null));
    }
    function chooseCommand(s) {
      return new Promise((res) => {
        if (S.auto && window.BattleSim) {
          setTimeout(() => { const [id, t] = window.BattleSim.POLICIES[S.auto](E, s, S.rand); res([id, t]); }, 250);
          return;
        }
        const main = () => UI.open(menuMain(s), heroes.length > 1 ? s.unit.name : null, onCmd);
        const onCmd = (id) => {
          if (SUB[id]) return UI.open(menuOf(s, id), SUB[id], onCmd);
          if (id === 'back') return main();
          const o = s.options.find((x) => x.id === id);
          if (!o || !o.ok) return;
          if (o.targets.length > 1) return targetMenu(s, o, (t) => res([id, t]), main);
          res([id, o.targets[0]]);
        };
        main();
      });
    }
    async function runTurn() {
      S.acting = true;
      const s = E.turn();
      if (s.type === 'choose') {
        await playLog(s.log);
        if (E.over) return finish();
        // Sol knows the knight: from her third turn, half her HP, or her Warden's Vow (the engine offers Kestrel then)
        if (cfg.alias && !S.known && s.unit.id === 'sol' && s.options.some((o) => o.id === 'kestrel' && o.ok)) await recognize();
        S.choosing = s.unit.key;
        // the whole field while a command and a target are chosen, every foe in frame
        if (foes.length > 1 || heroes.length > 1) shotField(2); else shotBoth(F[s.unit.key].pos, firstFoe().pos, 1, 2);
        const [id, t] = await chooseCommand(s);
        S.choosing = null; UI.waitMenu();
        const log = E.choose(id, t);
        await playLog(log);
      } else await playLog(s.log);
      if (E.over) return finish();
      // anyone knocked out of place walks back (not a fallen hero, and not Sol hanging in the air)
      await Promise.all(standing().filter((f) => D[f.key].hp > 0 && f.m.action !== 'stoopRise' && !(E.unit(f.key) && (E.unit(f.key).lured || E.unit(f.key).charmed))).map((f) => goHome(f, 2.2)));
      shotField(2);
      S.acting = false;
    }
    function updateBattle(dt) {
      if (S.state !== 'battle' || S.acting) return;
      const log = E.tick(dt);
      if (log.length) { S.acting = true; playLog(log).then(() => { if (E.over) finish(); else S.acting = false; }); return; }
      if (E.ready()) runTurn();
    }

    // ---------- the story beats: the foes arrive; the end ----------
    let skipRes = null, skipP = Promise.resolve();
    const ws = (sec) => Promise.race([wait(sec), skipP]);
    async function intro(quick) {
      S.state = 'intro'; S.skip = false;
      skipP = new Promise((r) => { skipRes = r; });
      if (cfg.bridge && foes.length === 1 && !quick) {
        // the first fight: the wraith crosses the bridge from the Thornwood, the camera following it to its place
        const f = foes[0], W = f.m;
        $('skip').hidden = false;
        f.pos = { x: ROUTE[0].x, z: ROUTE[0].z }; f.yaw = f.tyaw = faceYaw(ROUTE[0], ROUTE[1]);
        shotAt(f.pos, 1.45, 1.4); UI.msg('Something stirs in the Thornwood…');
        await ws(1.5);
        W.root.visible = true;
        if (!S.skip) {
          W.play('appear', true); SND.sfx.shriek(1.2);
          FX.burst(new THREE.Vector3(f.pos.x, 1.4, f.pos.z), [0.3, 1, 0.55], 60, 3); FX.ring(f.pos, 0x3cff8a, 0.2, 2.2, 0.8, 1);
          await ws(1.7);
        }
        UI.hideMsg();
        if (!S.skip) { followShot(() => f.pos, 1.3, 2.2); for (let i = 1; i < ROUTE.length && !S.skip; i++) await Promise.race([moveTo(f, ROUTE[i].x, ROUTE[i].z, 2.5), skipP]); }
        $('skip').hidden = true;
        if (S.skip) { f.target = null; f.res = null; f.pos = { x: f.home.x, z: f.home.z }; W.reset(); }
      } else {
        // the foes rise where they stand, with a line of story before and after when the page has one
        for (const f of foes) { f.pos = { x: f.home.x, z: f.home.z }; f.yaw = f.tyaw = f.home.yaw; }
        const told = cfg.introMsg && !quick, said = (x) => (typeof x === 'function' ? x(E.foes) : x);
        if (told) { $('skip').hidden = false; shot(IW / 2, IH * 0.4, 0, 1.4); UI.msg(said(cfg.introMsg)); await ws(2.6); }
        shotField(3);
        for (const f of foes) {
          f.m.root.visible = true; f.m.play('appear', true);
          FX.burst(new THREE.Vector3(f.pos.x, f.tall * 0.6, f.pos.z), f.look.appearColor || (f.kind === 'wisp' ? [0.8, 0.6, 1] : [0.3, 1, 0.55]), 40, 2.6);
          await wait(0.25);
        }
        SND.sfx.shriek(1.0); if (BF) BF.roar(foes.some((f) => f.tall > 3) ? 1.2 : 0.6);
        await wait(0.6);
        if (told && cfg.introAfter && !S.skip) { UI.msg(said(cfg.introAfter), true); await ws(2.6); }
        UI.hideMsg(); $('skip').hidden = true;
      }
      for (const f of foes) { f.m.root.visible = true; f.tyaw = f.home.yaw; }
      for (const h of heroes) h.tyaw = h.home.yaw;
      UI.showBattle(true); UI.buildWindows(); UI.status(); layoutView();
      shotField(2);
      io().m.play('cast'); UI.msg(cfg.attackText ? cfg.attackText(E.foes) : 'The foes attack!'); SND.startMusic();
      await wait(1.4); UI.hideMsg();
      S.state = 'battle'; S.t0 = clock.t;
    }
    // the stolen lamplight flies home: a light from the beaten foe's heart to each dark window, which glows again
    async function relightTown(from) {
      const W = SC.windows; if (!W || !W.length) return;
      shot(IW / 2, IH * 0.42, 0, 1.6);
      UI.msg(cfg.winLightsText || 'The stolen lamplight flies home.', true);
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -2.5), arrivals = [];
      W.forEach(([u, v], i) => {
        const to = new THREE.Vector3(); if (!rayAt(u, v).intersectPlane(plane, to)) return;
        arrivals.push(wait(i * 0.16).then(() => FX.projectile({ from: from.clone(), to: () => to, dur: 0.85 + Math.random() * 0.35, arc: 1.2 + Math.random(), side: rnd(-0.3, 0.3), color: 0xffe2a8, halo: 0xff9a40, size: 0.2, trail: [1, 0.78, 0.4], light: 0xffb45a, lightI: 2 }))
          .then(() => { TOWN.to[i] = 1; SND.sfx.chime(); }));
      });
      await Promise.all(arrivals);
      await wait(1.6); UI.hideMsg();
    }
    async function finish() {
      if (S.state === 'over') return;
      S.state = 'over'; S.acting = true; UI.waitMenu(); S.rimeOn = false;
      const r = E.result(); S.result = r;
      // Envoi still warding when the fight ends: it burns away quietly
      if (EN && EN.on) { EN.on = false; EN.m.play('leave', true); }
      // and Lunara, if she is still up, sinks away
      if (LU && LU.on) { LU.on = false; LU.m.play('leave', true); }
      const mark = (k) => S.trace.push([k, +clock.t.toFixed(2)]);
      mark('finish');
      if (r.outcome === 'win' && cfg.finale) await finaleEnding(mark);
      else if (r.outcome === 'win') {
        UI.cinematic(true); SND.stopMusic(1.2);
        await wait(0.3); clock.scale = 1; clock.slowT = 0;
        // the last foe to fall: the robe falls empty (or the flame goes out), and the soul goes home as a pale moth
        const lastF = foes.filter((f) => f.m.action === 'die').sort((a, b) => a.m.progress - b.m.progress)[0] || foes[0];
        shotAt(lastF.pos, lastF.tall > 3 ? 0.8 : 1.35, 2, lastF.tall * 0.5);
        for (let i = 0; i < 4; i++) { await wait(0.28); const p = chest(lastF); p.x += rnd(-0.3, 0.3); p.y += rnd(-0.4, 0.3); FX.burst(p, lastF.look.appearColor || (lastF.kind === 'wisp' ? [0.8, 0.6, 1] : [0.3, 1, 0.55]), 26, 3); }
        SND.sfx.boom(0.9); mark('die');
        await until(() => lastF.m.progress >= 0.7 || lastF.m.progress < 0); mark('moth');
        UI.msg((typeof cfg.winMoth === 'function' ? cfg.winMoth(E.foes) : cfg.winMoth) || 'A pale moth rises and drifts down into the Moonwell: the soul has gone home.', true);
        await until(() => foes.every((f) => f.m.progress >= 0.99 || f.m.progress < 0 || f.m.action !== 'die'));
        mark('released'); UI.hideMsg();
        if (cfg.winLights) { const src = foes.find((f) => f.look.lights) || lastF; await relightTown(src.m.anchor('heart', V())); mark('relit'); }
        if (cfg.winEnvoi && EN) { UI.hideEnemy(); await envoiMade(); mark('envoi'); }
        UI.cinematic(false); UI.hideEnemy(); SND.sfx.victory();
        const up = living('hero');
        shotField(2);
        for (const h of up) { h.tyaw = 0.25; h.spin = TAU; h.m.play('victory', true); }
        await until(() => up.every((h) => h.m.action !== 'victory' || h.m.progress >= 1));
        mark('victory'); await wait(0.9);
      } else if (r.outcome === 'retreat') await retreatEnding(mark);
      else if (r.outcome === 'fled') { SND.stopMusic(1.0); await wait(1.2); UI.hideMsg(); }
      else if (cfg.spared) await sparedEnding(mark);
      else {
        SND.stopMusic(1.0); SND.sfx.defeat();
        for (const h of heroes) { h.m.guard(false); if (h.m.action !== 'kneel') h.m.play('kneel', true); }
        FX.shield(false); shotField(2); UI.vignette(0.6);
        await wait(2.0);
      }
      mark('card'); showEnd(r);
    }

    // ---------- the ending (lore answer 10): Envoi's last strike is the real sending. The letters burn for good and their
    // light rises; the stars come back; Noctara is not killed but becomes night with stars in it; Halcyon's blade warms,
    // and she goes home as a moth rising ----------
    async function finaleEnding(mark) {
      const L = cfg.endingLines || [], io = F.io, s = F.sol;
      const noc = foes.find((f) => E.unit(f.key).id === 'noctara'), hal = foes.find((f) => E.unit(f.key).id === 'halcyon');
      UI.cinematic(true); UI.hideEnemy(); SND.stopMusic(2);
      await wait(0.4); clock.scale = 1; clock.slowT = 0; darkTo(0, 0.4); UI.tint(0); S.rimeOn = false;
      for (const h of heroes) if (D[h.key].hp <= 0) { h.m.play('rise', true); D[h.key].hp = 1; }
      if (noc) { noc.m.play('hurt', true); shotAt(noc.pos, 1.0, 1.6); }
      if (L[0]) { UI.msg(L[0], true); await wait(3.2); }
      // Io calls Envoi one last time, and it wraps the Starless
      if (EN && noc) {
        const M = EN.m;
        EN.pos = { x: EN.home.x, z: EN.home.z }; EN.yaw = EN.tyaw = faceYaw(EN.home, noc.pos) - 0.5; EN.wrap = noc;
        io.tyaw = faceYaw(io.pos, EN.pos); io.m.play('summon', true); SND.sfx.chime();
        await untilP(io.m, io.m.ACTIONS.summon.cues[0]);
        await FX.projectile({ from: io.m.flamePos(V()), to: () => new THREE.Vector3(EN.pos.x, 1.6, EN.pos.z), dur: 0.7, arc: 1.2, color: 0xfff1d8, halo: 0xffb45a, size: 0.26, trail: [1, 0.85, 0.6], light: 0xffc890, lightI: 3 });
        M.root.visible = true; if (M.fx) M.fx.visible = true; EN.shadow.visible = true; EN.on = true;
        M.play('summon', true); SND.sfx.fire(); envoiShot([{ x: noc.pos.x, y: noc.tall, z: noc.pos.z }], 1.2);
        await untilP(M, 0.27); if (s && D.sol.hp > 0) { s.m.play('flareCut', true); SND.sfx.swish(); }
        await until(() => !M.busy);
        if (L[1]) UI.msg(L[1], true);
        M.play('envoi', true); SND.sfx.fire();
        const A = M.ACTIONS.envoi;
        for (let k = 0; k < A.hits.length; k++) {
          await untilP(M, A.hits[k]);
          const p = chest(noc), last = k === A.hits.length - 1;
          FX.burst(p, [1, 0.8, 0.5], last ? 140 : 26, last ? 6 : 3); FX.flashLight(p, 0xffd0a0, last ? 9 : 2.5, last ? 0.8 : 0.25, last ? 12 : 6);
          if (last) { UI.flash('#fff1c8', 0.95, 0.9); SND.sfx.boom(1.5); addShake(20); } else { SND.sfx.hit(0.7); addShake(4); }
        }
        // the letters' light rises into the sky, and the stars come back
        for (let i = 0; i < 18; i++) { const a = rnd(0, TAU), r = rnd(0.2, 2.2); FX.beam({ x: noc.pos.x + Math.cos(a) * r, z: noc.pos.z + Math.sin(a) * r }, 0xfff0c8, 0.25, 16, 2.4 + rnd(0, 1.2)); }
        FX.rise(() => noc.pos, [1, 0.9, 0.7], 3.2, 90, 2.4);
        await until(() => M.progress < 0 || M.progress >= 1);
        EN.on = false; EN.wrap = null; envoiHide();
      }
      mark('sending');
      TOWN.starsTo = 1; shot(IW / 2, IH * 0.3, 0, 0.9);
      if (L[2]) { UI.msg(L[2], true); await wait(3.6); }
      // Noctara becomes night with stars in it
      if (noc) { shotAt(noc.pos, 0.9, 1.4); noc.m.play('die', true); SND.sfx.moon(); }
      if (L[3]) { UI.msg(L[3], true); await wait(4.2); }
      mark('night');
      // Halcyon's blade warms, and she goes home as a moth rising
      if (hal) { shotAt(hal.pos, 1.3, 1.4); hal.m.play('die', true); SND.sfx.chime(); }
      if (L[4]) { UI.msg(L[4], true); await wait(5.2); }
      mark('home');
      UI.hideMsg(); SND.sfx.victory();
      const up = living('hero'); shotField(1.5);
      for (const h of up) { h.tyaw = 0.25; h.m.play('victory', true); }
      if (L[5]) { UI.msg(L[5], true); await wait(3.4); UI.hideMsg(); }
      UI.cinematic(false);
    }

    // ---------- Halcyon's ambush: Sol knows her; she retreats, or spares them; Sol learns Kestrel Stoop ----------
    const knight = () => foes.find((f) => cfg.alias && cfg.alias[E.unit(f.key).id]) || foes[0];
    // Sol knows the stance, not the face (lore answer 2): the knight's name becomes Halcyon, and Kestrel opens
    async function recognize() {
      S.known = true;
      const f = knight(), u = E.unit(f.key), s = F.sol, L = cfg.knowLines || [];
      UI.rename(f.key, u.name);
      UI.cinematic(true); UI.vignette(0.4);
      if (s && D.sol.hp > 0) { faceTo(s, f); shotBoth(s.pos, f.pos, 1.1, 2.2); } else shotAt(f.pos, 1.4, 2.2);
      SND.sfx.chime();
      UI.msg((u.vowed && L.vow) || L[0] || 'Sol knows that stance.', true); await wait(3.2);
      if (L[1]) { UI.msg(L[1], true); await wait(3.4); }
      UI.hideMsg(); UI.vignette(0); UI.cinematic(false);
      if (S.state === 'battle') UI.note('Kestrel: once, Sol can call to her.', 2.2);
    }
    // Sol learns Kestrel Stoop: the fight stirred a memory. She springs up and hangs in the air like a kestrel
    async function learnStoop(mark) {
      const s = F.sol, L = cfg.stoopLines || []; if (!s) return;
      if (D.sol.hp <= 0) { s.m.play('rise', true); D.sol.hp = 1; await wait(1.1); }
      s.m.guard(false); s.tyaw = s.home.yaw; shotFit([s.pos, { x: s.pos.x, y: 4.6, z: s.pos.z }], 1, 1.6);
      if (L[0]) { UI.msg(L[0], true); await wait(3.6); }
      s.m.play('stoopRise', true); SND.sfx.swish();
      FX.ring(s.pos, 0xffd070, 0.3, 2.6, 0.8, 1); FX.rise(() => s.pos, [1, 0.8, 0.45], 1.4, 40, 0.5);
      await untilP(s.m, 0.6); SND.sfx.chime(); UI.banner('Sol learns Kestrel Stoop', 2.8);
      if (L[1]) UI.msg(L[1], true);
      await wait(2.8); UI.hideMsg();
      if (mark) mark('stoop');
    }
    // brought down to 20% of her HP, Halcyon steps back and the dark takes her (her model's retreat)
    async function retreatEnding(mark) {
      const f = knight(), L = cfg.retreatLines || [];
      UI.cinematic(true); SND.stopMusic(1.4);
      await wait(0.4); clock.scale = 1; clock.slowT = 0;
      for (const h of heroes) { h.m.guard(false); }
      FX.shield(false);
      if (!S.known) await recognize();
      UI.cinematic(true); faceTo(f, { pos: centerOf(heroes.map((h) => h.pos)) });
      shotAt(f.pos, 1.3, 2);
      if (L[0]) { UI.msg(L[0], true); await wait(3.0); }
      f.m.play('retreat', true); SND.sfx.eclipse();
      if (L[1]) UI.msg(L[1], true);
      await until(() => !f.m.busy); f.out = true; mark('retreat');
      await wait(1.2); UI.hideMsg(); UI.hideEnemy();
      await learnStoop(mark);
      UI.cinematic(false);
    }
    // the party falls: Sol drags herself up and stands over Io, and Halcyon sees her old squire and leaves (lore answer 2)
    async function sparedEnding(mark) {
      const f = knight(), s = F.sol, i = io(), L = cfg.sparedLines || [];
      SND.stopMusic(1.2); SND.sfx.defeat();
      for (const h of heroes) { h.m.guard(false); if (h.m.action !== 'kneel') h.m.play('kneel', true); }
      FX.shield(false); UI.cinematic(true); UI.vignette(0.45);
      await wait(1.6); clock.scale = 1; clock.slowT = 0;
      if (!S.known) await recognize();
      UI.cinematic(true); UI.vignette(0.45);
      // she walks toward Io, blade low
      shotBoth(i.pos, f.pos, 1, 1.6);
      if (L[0]) UI.msg(L[0], true);
      const near = toward(f.pos, i.pos, 2.3); await moveTo(f, near.x, near.z, 1.5); faceTo(f, i);
      // Sol gets up and stands between them
      if (s) {
        s.m.play('rise', true); D.sol.hp = 1; await wait(0.8);
        if (L[1]) UI.msg(L[1], true);
        const p = toward(f.pos, i.pos, 0.95); await moveTo(s, p.x, p.z, 2.0); faceTo(s, f); s.m.guard(true);
        shotBoth(s.pos, f.pos, 1.2, 2);
        await wait(2.4);
      }
      mark('stand');
      f.m.play('stagger', true);
      if (L[2]) { UI.msg(L[2], true); await wait(3.4); }
      f.m.play('retreat', true); SND.sfx.eclipse();
      if (L[3]) UI.msg(L[3], true);
      await until(() => !f.m.busy); f.out = true; mark('retreat');
      await wait(1.2); UI.hideMsg(); UI.hideEnemy(); UI.vignette(0);
      await learnStoop(mark);
      UI.cinematic(false);
    }
    // the end card: the battle time and damage dealt; on a win, the experience, the shards and the level-up
    function showEnd(r) {
      const win = r.outcome === 'win' || r.outcome === 'retreat', T = cfg.endTitles || {}, X = cfg.endTexts || {};
      $('endTitle').textContent = T[r.outcome] || (win ? 'Victory!' : r.outcome === 'fled' ? 'Got away' : 'Defeated');
      $('endText').textContent = X[r.outcome] || (win ? cfg.winText : r.outcome === 'fled' ? 'The party slips away. A fight that is fled gives nothing.' : cfg.loseText);
      const sec = (clock.t - S.t0), m = Math.floor(sec / 60), s = Math.floor(sec % 60);
      $('stTime').textContent = m + ':' + String(s).padStart(2, '0'); $('stDmg').textContent = nf(S.dealt);
      const F = PACE.fps, fl = $('stFps');
      if (fl) fl.textContent = F.t > 2000 ? 'Frame rate: ' + Math.round(F.n * 1000 / F.t) + ' a second on average, ' + Math.round(F.low || F.n * 1000 / F.t) + ' in the slowest second (' + (PACE.cap ? 'capped at ' + PACE.cap : 'no cap') + ').' : '';
      $('xpBox').hidden = !win; $('lvlBox').hidden = true;
      $('again').textContent = cfg.game ? 'Continue' : win || r.outcome === 'fled' ? 'Fight again' : 'Try again';
      if (win) {
        const lead = E.unit(heroes[0].key);
        let lv = lead.level, xp = (cfg.xp || 0) + r.xp, ups = 0;
        while (lv < RL.MAX_LEVEL && xp >= RL.xpNeed(lv)) { xp -= RL.xpNeed(lv); lv++; ups++; }
        $('xpGain').textContent = '+' + nf(r.xp); $('shardGain').textContent = '+' + nf(r.shards);
        $('xpNext').textContent = lv >= RL.MAX_LEVEL ? 'the highest level' : nf(xp) + ' of ' + nf(RL.xpNeed(lv)) + ' to level ' + (lv + 1);
        const bar = $('xpBar'); bar.style.transition = 'none'; bar.style.width = '0%'; void bar.offsetWidth; bar.style.transition = '';
        setTimeout(() => { bar.style.width = (lv >= RL.MAX_LEVEL ? 100 : 100 * xp / RL.xpNeed(lv)).toFixed(1) + '%'; }, 120);
        if (ups) {
          const k0 = RL.scale(lead.level), k1 = RL.scale(lv), dl = $('lvlList');
          $('lvlTitle').textContent = (heroes.length > 1 ? 'The party is level ' : 'Io is level ') + lv + '!';
          dl.textContent = '';
          for (const h of heroes) { const H = RL.HEROES[h.key]; el('dt', null, dl, H.name + '’s HP'); el('dd', null, dl, nf(H.hp * k0) + ' → ' + nf(H.hp * k1)); }
          el('dt', null, dl, 'Io’s MP'); el('dd', null, dl, Math.round(RL.HEROES.io.mp * RL.mpScale(lead.level)) + ' → ' + Math.round(RL.HEROES.io.mp * RL.mpScale(lv)));
          el('dt', null, dl, 'Flame Bolt'); el('dd', null, dl, nf(330 * k0) + ' → ' + nf(330 * k1));
          $('lvlBox').hidden = false;
          SND.sfx.chime();
        }
      }
      $('end').hidden = false; if (!coarse) $('again').focus({ preventScroll: true });
    }

    // ---------- building the fight: the heroes once, the foes for each fight ----------
    let shadowTex = null, lightTex = null;
    const disc = (r, map, color, add2, order) => { const m = new THREE.Mesh(new THREE.CircleGeometry(r, 36), new THREE.MeshBasicMaterial({ map, color, transparent: true, depthWrite: false, blending: add2 ? THREE.AdditiveBlending : THREE.NormalBlending })); m.rotation.x = -Math.PI / 2; m.renderOrder = order; scene.add(m); return m; };
    const addModel = (m) => { scene.add(m.root); if (m.fx) scene.add(m.fx); lightOnly(m.root); if (m.fx) lightOnly(m.fx); return m; };
    function centerOf(list) { let x = 0, z = 0; for (const p of list) { x += p.x; z += p.z; } return { x: x / list.length, z: z / list.length }; }
    function buildFoes() {
      for (const f of foes) { scene.remove(f.m.root); if (f.m.fx) scene.remove(f.m.fx); dispose(f.m); scene.remove(f.shadow); if (f.glow) scene.remove(f.glow); delete F[f.key]; }
      foes = [];
      const units = E.foes, slots = cfg.slots.slice(0, units.length).map((p) => g(p[0], p[1]));
      const heroC = centerOf(heroes.map((h) => h.home));
      units.forEach((u, i) => {
        const look = cfg.foeLook[u.id], m = addModel(cfg.makeFoe(u.id, u.level, i));
        const home = slots[i]; home.yaw = faceYaw(home, heroC) + (look.yawBias === undefined ? 0.4 : look.yawBias);
        const f = fighter(u.key, m, look, home); f.side = 'foe';
        f.shadow = disc(look.shadow || 0.7, shadowTex, 0xffffff, false, 1); f.shadow.scale.set(1, 0.8, 1);
        if (look.glow) f.glow = disc(look.glow[0], lightTex, look.glow[1], true, 2);
        if (m.state && look.state) Object.assign(m.state, look.state(u));
        m.root.visible = false;
        F[u.key] = f; foes.push(f);
      });
      const foeC = centerOf(foes.map((f) => f.home));
      for (const h of heroes) { h.home.yaw = faceYaw(h.home, foeC) + (h.look.yawBias === undefined ? -0.35 : h.look.yawBias); h.yaw = h.tyaw = h.home.yaw; }
      lightOnly(scene);
    }
    function resetHeroes() {
      for (const h of heroes) {
        if (h.m.reset) h.m.reset();
        h.m.guard(false); h.pos = { x: h.home.x, z: h.home.z }; h.yaw = h.tyaw = h.home.yaw; h.target = null; h.res = null; h.spin = 0; h.aim = null; h.aimAt = null; h.trance = 0; h.out = false; h.heldBy = null; h.y = 0; h.vy = 0;
        if (h.inside) { h.inside = false; h.m.root.visible = true; if (h.m.fx) h.m.fx.visible = true; }
        if (h.m.state) { h.m.state.heat = 0; h.m.state.sunburn = 0; h.m.state.trance = 0; }
      }
      FX.shield(false); S.rimeOn = false;
      if (BF) BF.storm(0); skyTo(0); SKY.v = 0;
      for (let i = 0; i < TOWN.a.length; i++) TOWN.a[i] = TOWN.to[i] = 0; TOWN.stars = TOWN.starsTo = 0; TOWN.ver++;
      darkTo(0, 0.1); { const c = $('cold'); if (c) c.style.opacity = '0'; }
      for (const f of foes) f.charged = false;
      LU.m.reset(); LU.on = false; LU.m.root.visible = false; if (LU.m.fx) LU.m.fx.visible = false; LU.shadow.visible = false;
      if (EN) { envoiHide(); EN.wrap = null; for (const d of ENV.ink) d.s.visible = false; }
    }
    async function begin(quick) {
      $('start').hidden = true; $('end').hidden = true;
      PACE.fps = { n: 0, t: 0, secN: 0, secT: 0, low: 0, prev: 0 };
      UI.vignette(0); UI.cinematic(false); UI.tint(0); UI.showBattle(false);
      newEngine(); resetHeroes(); buildFoes();
      S.acting = false; S.state = 'intro';
      await intro(quick);
    }

    // ---------- the start card's choices (the party page): the party's level and the pack ----------
    function buildPicker() {
      const box = $('picker'); if (!box || !cfg.packs) return;
      box.hidden = false;
      const lv = $('pickLevel'), out = $('pickLevelOut'), sel = $('pickPack');
      const note = () => { const n = $('pickNote'); if (n && cfg.pickNote) n.textContent = cfg.pickNote(PICK.level); };
      lv.min = cfg.levels[0]; lv.max = cfg.levels[1]; lv.value = PICK.level; out.textContent = PICK.level;
      lv.addEventListener('input', () => { PICK.level = +lv.value; out.textContent = PICK.level; note(); });
      cfg.packs.forEach((p, i) => el('option', { value: String(i) }, sel, p.name));
      if (cfg.packs.length < 2 && sel.closest('label')) sel.closest('label').hidden = true;
      sel.value = String(PICK.pack); sel.addEventListener('change', () => { PICK.pack = +sel.value; note(); });
      note();
    }

    // ---------- main loop ----------
    let last = 0, fxKids = -1, glowG = null, rimeEdge = null;
    const heldV = new THREE.Vector3();
    const flameP = new THREE.Vector3();
    function frame(now) {
      if (S.dead) return;
      if (pace(now)) { requestAnimationFrame(frame); return; }
      const rdt = last ? Math.min(0.05, Math.max(0, (now - last) / 1000)) : 0.016; last = now;
      countFrame(now);
      if (clock.slowT > 0) { clock.slowT -= rdt; if (clock.slowT <= 0) clock.scale = 1; }
      let dt = rdt;
      if (clock.stop > 0) { clock.stop -= rdt; dt = 0; } else dt *= clock.scale;
      dt *= clock.turbo;
      clock.t += dt;
      tickWaits();
      updateBattle(dt);

      for (const f of heroes.concat(foes)) {
        const mv = stepActor(f, dt);
        // held in the Bramble Horror's canes: carried to where its canes hold her chest, lifted on each squeeze; dropped, she falls
        if (f.heldBy) {
          const H = f.heldBy.m.holding || 0;
          if (H > 0.01) { f.heldBy.m.anchor('held', heldV); f.pos.x += (heldV.x - f.pos.x) * H; f.pos.z += (heldV.z - f.pos.z) * H; f.y = Math.max(0, heldV.y - (f.chestH || 1.1)) * H; f.vy = 0; }
          else if (!f.heldBy.m.busy) f.heldBy = null;
        }
        if (!f.heldBy && f.y > 0) { f.vy = (f.vy || 0) - 9.8 * dt; f.y = Math.max(0, f.y + f.vy * dt); if (!f.y) f.vy = 0; }
        if ((f.kind === 'bramble' || f.kind === 'colossus') && f.m.state && E) { const u = E.unit(f.key); if (u) f.m.state.wilt = 1 - D[f.key].hp / u.maxHp; }
        // the Colossus holds its bud open while its heart is bare
        if (f.kind === 'colossus' && f.m.state) f.m.state.open += ((f.openShown && !f.out ? 1 : 0) - f.m.state.open) * Math.min(1, dt * 3);
        // inside the Colossus's shut bud, its prey is out of sight
        if (f.side === 'hero') { const inside = !!(f.heldBy && f.heldBy.m.inside > 0.5); if (inside !== !!f.inside) { f.inside = inside; f.m.root.visible = !inside; if (f.m.fx) f.m.fx.visible = !inside; } }
        f.phase += mv * 4.2; f.wb += ((mv > 1e-4 ? 1 : 0) - f.wb) * Math.min(1, dt * 10);
        const d = D[f.key];
        f.trance += (((d && d.inTrance) ? 1 : 0) - f.trance) * Math.min(1, dt * 3);
        if (f.key === 'io') f.m.trance = f.trance;
        if (f.m.state) {
          const t = f.aim || f.aimAt || (f.side === 'hero' ? firstFoe() : io());
          if (t && t !== f) { const c = chest(t); f.m.state.target = { x: c.x, y: c.y, z: c.z }; }
          if (f.key === 'sol' && d) { f.m.state.heat = d.heat / 100; f.m.state.sunburn = d.heat >= 70 || d.inTrance ? 1 : 0; f.m.state.trance = f.trance; }
        }
        f.m.root.position.set(f.pos.x, f.y || 0, f.pos.z); f.m.root.rotation.y = f.yaw;
        f.m.animate(f.phase, f.wb, clock.t, dt);
        const dying = f.m.action === 'die' && f.m.progress >= 0, fade = dying ? 1 - f.m.progress : f.m.root.visible ? 1 : 0;
        f.shadow.position.set(f.pos.x, 0.006, f.pos.z); f.shadow.material.opacity = 0.7 * fade;
        if (f.key === 'io') { f.m.flamePos(flameP); f.glow.position.set(flameP.x, 0.012, flameP.z); f.glow.material.opacity = (0.14 + f.m.flameLight.intensity * 0.1) * (1 - (f.m.moon || 0)) * (d && d.hp > 0 ? 1 : 0.3) * (f.inside ? 0 : 1); }
        else if (f.glow) { f.glow.position.set(f.pos.x, 0.012, f.pos.z); f.glow.material.opacity = (f.charged ? 0.45 + 0.35 * Math.sin(clock.t * 5) : 0.32) * fade; }
      }
      // Lunara, while she is up
      if (LU.on || LU.m.busy) {
        stepActor(LU, dt);
        LU.m.root.position.set(LU.pos.x, 0, LU.pos.z); LU.m.root.rotation.y = LU.yaw;
        if (LU.m.state) { const t = firstFoe(); if (t) { const c = chest(t); LU.m.state.target = { x: c.x, y: c.y, z: c.z }; } }
        LU.m.animate(0, 0, clock.t, dt);
      } else if (LU.m.root.visible && LU.m.gone) { LU.m.root.visible = false; if (LU.m.fx) LU.m.fx.visible = false; LU.shadow.visible = false; }
      LU.shadow.position.set(LU.pos.x, 0.006, LU.pos.z);
      if (EN) stepEnvoi(dt, rdt);
      glowG.material.opacity += ((LU.on ? 0.55 : 0) - glowG.material.opacity) * Math.min(1, rdt * 2);
      stepRime(rdt);
      stepTown(rdt);

      FX.update(dt, clock.t);
      if (BF) BF.update(dt, clock.t);
      stepSky(rdt);
      if (FX.grp.children.length !== fxKids) { lightOnly(FX.grp); fxKids = FX.grp.children.length; }
      applyCam(rdt);
      UI.status();
      UI.update(rdt);
      renderer.render(scene, camera);
      requestAnimationFrame(frame);
    }
    // true when this refresh is skipped to hold the frame-rate cap; it also measures the screen's own rate
    function pace(now) {
      const d = PACE.prev ? now - PACE.prev : 0; PACE.prev = now;
      if (d > 2 && d < 100) {
        PACE.deltas.push(d); if (PACE.deltas.length > 90) PACE.deltas.shift();
        if (PACE.deltas.length >= 30 && (PACE.deltas.length % 30 === 0 || !PACE.hz)) {
          const a = PACE.deltas.slice().sort((x, y) => x - y), f = 1000 / a[a.length >> 1];
          const hz = [30, 48, 50, 60, 72, 75, 90, 100, 120, 144, 165, 240].find((r) => Math.abs(r - f) < 3) || Math.round(f);
          if (hz !== PACE.hz) { PACE.hz = hz; fpsLabel(); }
        }
      }
      if (!PACE.cap || (PACE.hz && PACE.cap >= PACE.hz - 3)) { PACE.due = 0; return false; }
      const iv = 1000 / PACE.cap;
      if (PACE.due && now < PACE.due - 3) return true;
      PACE.due = PACE.due && now - PACE.due < iv ? PACE.due + iv : now + iv;
      return false;
    }
    function countFrame(now) {
      const F = PACE.fps;
      if (S.state !== 'intro' && S.state !== 'battle' && S.state !== 'over') { F.prev = 0; return; }
      const d = F.prev ? now - F.prev : 0; F.prev = now;
      if (!d || d > 250) return; // a hidden tab or a stall before the first frame
      F.n++; F.t += d; F.secN++; F.secT += d;
      if (F.secT >= 1000) { const f = F.secN * 1000 / F.secT; F.low = F.low ? Math.min(F.low, f) : f; F.secN = 0; F.secT = 0; }
    }
    function fpsOptions() { const o = [0]; if (!PACE.hz || PACE.hz > 66) o.push(60); o.push(45, 30); return o; }
    function fpsLabel() {
      const b = $('fps'); if (!b) return;
      const n = PACE.cap && !(PACE.hz && PACE.cap >= PACE.hz - 3) ? PACE.cap : PACE.hz;
      b.querySelector('span').textContent = n ? n + ' fps' : 'fps';
      b.setAttribute('aria-label', 'Frame rate: ' + (PACE.cap ? 'capped at ' + PACE.cap : 'the screen’s own' + (PACE.hz ? ', ' + PACE.hz : '')) + ' frames a second. Tap to change.');
    }

    // frost at the screen's edges while the party is slowed (Frost Breath), as the wisp's bench drew it
    function stepRime(rdt) {
      const ov = $('rime'); if (!ov) return;
      S.rime += ((S.rimeOn ? 1 : 0) - S.rime) * Math.min(1, rdt * 3);
      if (S.rime < 0.01) { if (ov.style.opacity !== '0') ov.style.opacity = '0'; return; }
      const W = Math.max(2, Math.round(view.w * DPR / 2)), H = Math.max(2, Math.round(view.h * DPR / 2));
      if (!rimeEdge || rimeEdge.width !== W || rimeEdge.height !== H) {
        ov.width = W; ov.height = H; rimeEdge = { width: W, height: H };
        const x = ov.getContext('2d'), gr = x.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.32, W / 2, H / 2, Math.hypot(W, H) * 0.56);
        gr.addColorStop(0, 'rgba(190,225,255,0)'); gr.addColorStop(0.65, 'rgba(170,215,255,0.14)'); gr.addColorStop(1, 'rgba(225,242,255,0.62)');
        x.fillStyle = gr; x.fillRect(0, 0, W, H);
        const L = Math.min(W, H);
        for (let i = 0; i < 900; i++) {
          const side = i % 4, f = Math.random(), depth = Math.pow(Math.random(), 2.4) * L * 0.14;
          const px = side < 2 ? f * W : side === 2 ? depth : W - depth, py = side === 0 ? depth : side === 1 ? H - depth : f * H;
          const a = Math.random() * Math.PI, len = (2 + Math.random() * 6) * (1 - depth / (L * 0.14) * 0.6), al = 0.12 + 0.4 * (1 - depth / (L * 0.14));
          x.strokeStyle = 'rgba(235,248,255,' + al.toFixed(3) + ')'; x.lineWidth = 0.8;
          x.beginPath(); for (let k = 0; k < 3; k++) { const b = a + k * Math.PI / 3; x.moveTo(px - Math.cos(b) * len, py - Math.sin(b) * len); x.lineTo(px + Math.cos(b) * len, py + Math.sin(b) * len); } x.stroke();
        }
      }
      ov.style.opacity = (S.rime * 0.9).toFixed(3);
    }

    function init() {
      for (const id of ['cold', 'dark']) if (!$(id)) { const d = el('div', { id, class: 'fill', 'aria-hidden': 'true' }); stage.insertBefore(d, $('flash')); }
      if (!$('sky')) stage.insertBefore(el('div', { id: 'sky', class: 'fill', 'aria-hidden': 'true' }), glCanvas);
      renderer = new THREE.WebGLRenderer({ canvas: glCanvas, alpha: true, antialias: true });
      renderer.setPixelRatio(DPR); renderer.setClearColor(0x000000, 0);
      scene = new THREE.Scene();
      shadowTex = radialTex('rgba(10,4,16,0.62)', 'rgba(10,4,16,0.3)', 'rgba(10,4,16,0)');
      lightTex = radialTex('rgba(255,255,255,1)', 'rgba(255,255,255,0.28)');
      scene.add(new THREE.HemisphereLight(0x756aa8, 0x33262f, 1.1));
      const moon = new THREE.DirectionalLight(0xb8c0ff, 0.62); moon.position.set(-5, 9, -12); scene.add(moon);
      const fill = new THREE.DirectionalLight(0xffdcc0, 0.42); fill.position.set(2, 5, 10); scene.add(fill);
      for (const i of SC.lamps) { const L = SC.layout.lights[i]; const p = new THREE.PointLight(new THREE.Color(L.c), L.i, L.d, 2); p.position.copy(lampPos(L.base, L.at)); scene.add(p); }
      const depthMat = new THREE.MeshBasicMaterial({ colorWrite: false, side: THREE.DoubleSide });
      for (const o of SC.layout.occ) for (const poly of o.polys) { const m = new THREE.Mesh(cutout(poly, o.base), depthMat); m.renderOrder = -1; scene.add(m); }
      scene.add(FX.grp);
      if (window.makeBattlefield) { BF = makeBattlefield({ id: SC.id, g, IW, IH, onLightning: lightning }); scene.add(BF.grp); }
      // the heroes, in their places
      for (const hc of cfg.heroes) {
        const p = g(hc.home[0], hc.home[1]); p.yaw = 0;
        const h = fighter(hc.id, addModel(hc.make()), hc, p);
        h.side = 'hero';
        h.shadow = disc(hc.shadow || 0.6, shadowTex, 0xffffff, false, 1); h.shadow.scale.set(1, 0.8, 1);
        if (hc.id === 'io') h.glow = disc(1.5, lightTex, 0xa845ff, true, 2);
        F[hc.id] = h; heroes.push(h);
      }
      LU = fighter('lunara', addModel(cfg.makeLunara()), { kind: 'lunara', tall: 4.3 }, { x: LUN.x, z: LUN.z, yaw: 0.3 }); LU.on = false;
      LU.shadow = disc(0.9, shadowTex, 0xffffff, false, 1); LU.shadow.scale.set(1, 0.7, 1); LU.shadow.visible = false;
      glowG = disc(3.2, lightTex, 0xcfdcff, true, 2); glowG.position.set(WELL.x, 0.015, WELL.z); glowG.material.opacity = 0;
      if (cfg.makeEnvoi) {
        // as on its bench: between the party and the foes, nudged off Io so its coils keep clear of her
        const ep = SC.envoiAt ? g(...SC.envoiAt) : g(720, 790); if (!SC.envoiAt) { ep.x += 0.55; ep.z -= 0.3; } ep.yaw = 0;
        EN = fighter('envoi', addModel(cfg.makeEnvoi()), { kind: 'envoi', tall: 6.4 }, ep); EN.on = false;
        EN.shadow = disc(1.6, shadowTex, 0xffffff, false, 1); EN.shadow.scale.set(1, 0.6, 1); EN.shadow.position.set(ep.x, 0.006, ep.z);
        initEnvoi();
      }
      lightOnly(scene);
      newEngine(); buildFoes();
      layoutView(); shotAt(heroes[0].pos, 1.35, 50); applyCam(1);
      // compile every shader up front (Lunara and the foes included), so the first summon doesn't stutter
      for (const f of foes) f.m.root.visible = true;
      renderer.compile(scene, camera);
      LU.m.root.visible = false; if (LU.m.fx) LU.m.fx.visible = false;
      if (EN) envoiHide();
      for (const f of foes) f.m.root.visible = false;
      requestAnimationFrame(frame);
      buildPicker();

      const beginBtn = $('begin');
      const ready = () => {
        if (cfg.game) { $('start').hidden = true; SND.init(); begin(!!cfg.quickIntro); return; }
        beginBtn.disabled = false; beginBtn.textContent = 'Begin the battle'; if (!coarse) beginBtn.focus({ preventScroll: true }); };
      paintImg.onload = () => { lastTf = ''; ready(); };
      paintImg.onerror = () => { beginBtn.textContent = 'The painting didn’t load. Reload to try again.'; };
      paintImg.src = SC.image.startsWith('data:') ? SC.image : '../' + SC.image;
      beginBtn.addEventListener('click', () => { SND.init(); begin(!!cfg.quickIntro); });
      $('skipBtn').addEventListener('click', () => { S.skip = true; if (skipRes) skipRes(); });
      $('again').addEventListener('click', () => { if (cfg.game) { cfg.game.onEnd(S.result); return; } SND.init(); begin(true); });
      const change = $('change');
      if (change) { change.hidden = !cfg.packs; change.addEventListener('click', () => { $('end').hidden = true; $('start').hidden = false; UI.showBattle(false); S.state = 'boot'; }); }
      const fpsB = $('fps');
      if (fpsB) {
        fpsLabel();
        fpsB.addEventListener('click', () => {
          const o = fpsOptions(), i = o.indexOf(PACE.cap);
          PACE.cap = o[(i + 1) % o.length]; PACE.due = 0; fpsLabel();
          try { localStorage.setItem('envoi.fps', String(PACE.cap)); } catch (e) { /* not kept */ }
        });
      }
      const snd = $('snd');
      if (snd) snd.addEventListener('click', () => {
        SND.init(); const m = !SND.muted; SND.setMuted(m);
        snd.setAttribute('aria-pressed', String(!m)); snd.querySelector('span').textContent = m ? 'Sound off' : 'Sound on';
      });
      let tmr = 0;
      const onResize = () => { clearTimeout(tmr); tmr = setTimeout(layoutView, 100); };
      if (window.ResizeObserver) { ro = new ResizeObserver(onResize); ro.observe(stage); } else on(window, 'resize', onResize);

      // test hooks for headless checks
      window.__battle = {
        get state() { return S.state; }, get engine() { return E; }, get shown() { return D; }, get menuOpen() { return UI.menuOpen; },
        get result() { return S.result; }, get acting() { return S.acting; }, get trace() { return S.trace; }, get pickState() { return PICK; },
        begin() { $('begin').click(); }, skip() { $('skipBtn').click(); }, pick(id) { return UI.pickId(id); }, again() { $('again').click(); },
        set turbo(v) { clock.turbo = v; }, get t() { return clock.t; }, set auto(p) { S.auto = p; }, get pace() { return { cap: PACE.cap, hz: PACE.hz, fps: PACE.fps }; },
        setFight(level, pack) { PICK.level = level; if (pack !== undefined) PICK.pack = pack; },
        // a test shortcut: a unit down to n HP, shown and real (the first foe by default)
        weaken(n, who) { const f = who ? E.unit(who) : E.foes[0]; f.hp = Math.min(f.hp, n); D[f.key].hp = f.hp; },
      };
    }
    setTimeout(() => {
      if (S.dead) return;
      try { init(); }
      catch (err) { console.error(err); const b = $('begin'); b.textContent = 'This battle needs WebGL, which isn’t available in this browser.'; if (cfg.game && cfg.game.onError) cfg.game.onError(err); }
    }, 30);
    // the game's teardown: the loop stops, the listeners come off, and the GPU and the models are let go
    function stop() {
      if (BF) { BF.dispose(); BF = null; }
      S.dead = true; SND.stopMusic(0.3);
      for (const [t, ty, fn] of offs) t.removeEventListener(ty, fn);
      if (ro) ro.disconnect();
      for (const f of heroes.concat(foes)) dispose(f.m);
      if (LU) dispose(LU.m); if (EN) dispose(EN.m);
      if (renderer) { renderer.dispose(); renderer.forceContextLoss(); renderer = null; }
      if (window.__battle && window.__battle.engine === E) window.__battle = null;
    }
    return { stop };
  }

  // the stage's inner markup, as the demo pages write it, for the game to build a battle in (cfg.game)
  function markup() {
    return '<canvas id="paint" aria-hidden="true"></canvas><div id="tint" class="fill"></div><canvas id="gl" aria-hidden="true"></canvas>' +
      '<canvas id="rime" aria-hidden="true"></canvas><div id="vignette" class="fill"></div><div id="flash" class="fill"></div>' +
      '<div id="barT" class="bar"></div><div id="barB" class="bar"></div><div id="enemy" class="win" hidden></div>' +
      '<div id="banner" class="win" aria-live="polite"></div><div id="msg" class="win" role="status"></div><div id="nums" aria-hidden="true"></div>' +
      '<div id="marker" aria-hidden="true" hidden><svg viewBox="0 0 22 18"><path d="M2 2h18L11 16Z" fill="currentColor" stroke="#2c3160" stroke-width="1.6" stroke-linejoin="round"/></svg></div>' +
      '<div id="ui" hidden><div id="cmd" class="win" role="menu" aria-label="Commands"></div><div id="status" class="win" aria-label="The party"></div></div>' +
      '<div id="skip" hidden><button type="button" class="skipb" id="skipBtn">Skip intro</button></div>' +
      '<div id="start" class="overlay"><div class="card win"><button type="button" class="go" id="begin" disabled>Setting the scene…</button></div></div>' +
      '<div id="end" class="overlay" hidden><div class="card win"><h2 id="endTitle">Victory!</h2><p id="endText"></p>' +
      '<div class="stats"><div><b id="stTime">0:00</b><span>Battle time</span></div><div><b id="stDmg">0</b><span>Damage dealt</span></div></div>' +
      '<div class="xp" id="xpBox" hidden><div class="stats"><div><b id="xpGain">+0</b><span>Experience</span></div><div><b id="shardGain">+0</b><span>Sunstone shards</span></div></div>' +
      '<div class="row"><span>Next level</span><b id="xpNext"></b></div><div class="gauge"><i id="xpBar"></i></div></div>' +
      '<div class="lvl" id="lvlBox" hidden><h3 id="lvlTitle">Level up!</h3><dl id="lvlList"></dl><p>Every move hits and heals about 20% harder.</p></div>' +
      '<div class="btns"><button type="button" class="go" id="again">Continue</button></div></div></div>';
  }

  window.BattleScreen = { start, markup };
})();
