// screen.js: the battle screen (plan step 12). The Night square demo's battle (reference/demos/night-square-shadow-wraith.html)
// rebuilt on the finished models, the shared effects (src/fx/battle-fx.js) and the battle engine (src/battle/engine.js).
// The engine decides every number and every turn; this file plays each turn's log in the painted square: the models'
// own motions, the effects at their hit and cue times, the camera director, the music and sound (sound.js), and the
// numbers rising as each blow lands. The windows, menus, intro, Trance, Lunara and the ending follow the demo; Lunara
// now has her Embrace on arrival and Silver Requiem from her finished model, and the ending adds experience, sunstone
// shards and the level-up. The page holds the markup (demos/first-fight.html). three.js r128 (global THREE).
// Defines window.BattleScreen = { start(cfg) }.
(function () {
  'use strict';
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const faceYaw = (from, to) => Math.atan2(to.x - from.x, to.z - from.z);
  const $ = (id) => document.getElementById(id);
  const nf = (n) => Math.round(n).toLocaleString('en-US');

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

  function start(cfg) {
    const RL = window.BattleRules, BE = window.BattleEngine;
    const SC = window.SCENES['night-square'];
    const IW = SC.width, IH = SC.height, A = IW / IH, FOV = SC.fov, PITCH = SC.pitch * Math.PI / 180, PXM = SC.ppm;
    const DIST = (IH / 2) / (PXM * Math.tan(FOV / 2 * Math.PI / 180));
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const REDUCED = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const coarse = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
    const stage = $('stage'), paintCv = $('paint'), paintCtx = paintCv.getContext('2d'), glCanvas = $('gl');
    const paintImg = new Image();
    const LEVEL = cfg.level || 1;

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

    // home spots, the wraith's route in from the bridge, and the Moonwell (painting pixels, as in the demo)
    const HOME = { io: g(560, 812), wraith: g(860, 800) };
    HOME.io.yaw = faceYaw(HOME.io, HOME.wraith) - 0.38;
    HOME.wraith.yaw = faceYaw(HOME.wraith, HOME.io) + 0.38;
    const ROUTE = [[1185, 452], [1120, 520], [1000, 690], [860, 800]].map((p) => g(p[0], p[1]));
    const WELL = g(712, 725), LUN = { x: WELL.x, z: WELL.z - 0.9 };

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
    function shotAt(p, s, k, lift) { const q = toPx(tmpV.set(p.x, lift === undefined ? 1.1 : lift, p.z)); shot(q[0], q[1], s, k); }
    function followShot(getPos, s, k) { cam.follow = getPos; cam.fs = s; cam.k = k || 3; }
    function shotBoth(a, b, zoom, k) {
      const pa = toPx(tmpV.set(a.x, 1.1, a.z)), pb = toPx(tmpV.set(b.x, 1.1, b.z));
      const needW = Math.abs(pa[0] - pb[0]) + 175, needH = 250;
      const availH = Math.max(120, view.h - view.uiH - 50);
      const s = Math.min((view.w - 16) / needW, availH / needH) * (zoom || 1);
      shot((pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2 - 18, s, k);
    }
    // the wide shot: every point (with a height) in frame, for summons and big attacks
    function shotFit(pts, zoom, k) {
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      for (const p of pts) { const q = toPx(tmpV.set(p.x, p.y || 0, p.z)); x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); }
      const availH = Math.max(120, view.h - view.uiH - 40), s = Math.min((view.w - 16) / (x1 - x0 + 120), availH / (y1 - y0 + 70)) * (zoom || 1);
      shot((x0 + x1) / 2, (y0 + y1) / 2, s, k);
    }
    function addShake(px) { if (!REDUCED) shake.amp = Math.max(shake.amp, px); }
    function applyCam(rdt) {
      if (cam.follow) { const p = cam.follow(); const q = toPx(tmpV.set(p.x, 1.1, p.z)); cam.tx = q[0]; cam.ty = q[1]; cam.ts = cam.fs; }
      const k = REDUCED ? 1 : 1 - Math.exp(-rdt * cam.k);
      cam.cx += (cam.tx - cam.cx) * k; cam.cy += (cam.ty - cam.cy) * k; cam.s += (cam.ts - cam.s) * k;
      const sMin = Math.max(view.w / IW, view.h / IH), S = Math.max(sMin, cam.s);
      const midY = (view.h - view.uiH) / 2 + 20;
      shake.amp *= Math.exp(-rdt * 7);
      shake.x = (Math.random() - 0.5) * 2 * shake.amp; shake.y = (Math.random() - 0.5) * 2 * shake.amp;
      let ox = cam.cx * S - view.w / 2 + shake.x, oy = cam.cy * S - midY + shake.y;
      ox = clamp(ox, 0, IW * S - view.w); oy = clamp(oy, 0, IH * S - view.h);
      ox = Math.round(ox * DPR) / DPR; oy = Math.round(oy * DPR) / DPR;
      camera.setViewOffset(IW * S, IH * S, ox, oy, view.w, view.h);
      // the painting is drawn into a canvas the size of the stage, only the part the camera shows (bench.js)
      const tf = ox + ',' + oy + ',' + S.toFixed(5) + ',' + view.w + ',' + view.h;
      if (tf !== lastTf && paintImg.complete && paintImg.naturalWidth) {
        paintCtx.imageSmoothingEnabled = true; paintCtx.imageSmoothingQuality = 'high';
        paintCtx.drawImage(paintImg, ox / S, oy / S, view.w / S, view.h / S, 0, 0, paintCv.width, paintCv.height);
        lastTf = tf;
      }
    }
    function toScreen(p) { tmpV.copy(p).project(camera); return [(tmpV.x + 1) / 2 * view.w, (1 - tmpV.y) / 2 * view.h, tmpV.z]; }

    // ---------- effects and sound ----------
    const FX = window.makeBattleFX();
    const SND = window.makeBattleSound();

    // ---------- interface (the demo's windows and menus) ----------
    const UI = (() => {
      const cmdEl = $('cmd'), bannerEl = $('banner'), msgEl = $('msg'), numsEl = $('nums'), flashEl = $('flash'), vigEl = $('vignette');
      const HAND = '<svg class="hand" viewBox="0 0 26 16" aria-hidden="true"><path d="M1 5.5h10.5c.9 0 1.6.7 1.6 1.6v.1h9.3a1.6 1.6 0 0 1 0 3.2h-9.3v.3c0 .9-.7 1.6-1.6 1.6H11v.2c0 .9-.7 1.6-1.6 1.6H4.2A3.2 3.2 0 0 1 1 10.9Z" fill="#fff" stroke="#2c3160" stroke-width="1.2"/></svg>';
      let items = [], sel = 0, cb = null, bannerTO = 0, flashA = 0, flashDur = 0.3;
      const UI_MENU = () => !!cb;
      function render(list, title) {
        items = list; cmdEl.innerHTML = '';
        if (title) { const t = document.createElement('div'); t.className = 'title'; t.textContent = title; cmdEl.appendChild(t); }
        list.forEach((it, i) => {
          const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'menuitem');
          b.innerHTML = HAND + '<span class="lb"></span>' + (it.tag ? '<span class="mp"></span>' : '');
          b.querySelector('.lb').textContent = it.label; if (it.tag) b.querySelector('.mp').textContent = it.tag;
          if (it.hot) b.classList.add('hot'); if (it.disabled) b.disabled = true;
          b.addEventListener('click', () => pick(i));
          b.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse' && !it.disabled) setSel(i); });
          cmdEl.appendChild(b);
        });
        const first = list.findIndex((it) => !it.disabled); setSel(Math.max(0, first));
        if (!coarse) { const bs = cmdEl.querySelectorAll('button'); if (bs[sel]) bs[sel].focus({ preventScroll: true }); }
      }
      function setSel(i) { sel = i; cmdEl.querySelectorAll('button').forEach((b, k) => b.classList.toggle('sel', k === i)); }
      function move(d) {
        if (!cb || !items.length) return; let i = sel;
        for (let k = 0; k < items.length; k++) { i = (i + d + items.length) % items.length; if (!items[i].disabled) break; }
        setSel(i); const b = cmdEl.querySelectorAll('button')[i]; if (b && !coarse) b.focus({ preventScroll: true }); SND.sfx.menu();
      }
      function pick(i) { const it = items[i]; if (!it || it.disabled || !cb) return; const f = cb; SND.sfx.select(); f(it.id); }
      function open(list, title, fn) { cb = fn; render(list, title); }
      function waitMenu() { cb = null; items = []; cmdEl.innerHTML = '<div class="wait">Waiting…</div>'; }
      window.addEventListener('keydown', (e) => {
        if (!cb) return;
        if (e.key === 'ArrowDown') { move(1); e.preventDefault(); }
        else if (e.key === 'ArrowUp') { move(-1); e.preventDefault(); }
        else if (e.key === 'Enter' || e.key === ' ') { if (document.activeElement && document.activeElement.tagName === 'BUTTON' && cmdEl.contains(document.activeElement)) return; pick(sel); e.preventDefault(); }
        else if (e.key === 'Escape' || e.key === 'Backspace') { if (items.some((it) => it.id === 'back')) { SND.sfx.menu(); cb('back'); e.preventDefault(); } }
      });
      function banner(text, dur) { bannerEl.textContent = text; bannerEl.classList.add('on'); clearTimeout(bannerTO); bannerTO = setTimeout(() => bannerEl.classList.remove('on'), (dur || 1.4) * 1000); }
      function msg(text, low) { msgEl.textContent = text; msgEl.classList.toggle('low', !!low); msgEl.classList.add('on'); }
      function hideMsg() { msgEl.classList.remove('on'); }
      const nums = [];
      // a number is placed as soon as it is made, so it never shows for a frame in the corner
      function place(n) {
        const u = n.t / n.dur, s = toScreen(n.p), rise = 44 * (1 - Math.pow(1 - Math.min(1, u * 1.6), 3)), pop = u < 0.12 ? 1.4 - u * 3.3 : 1;
        n.el.style.transform = 'translate(' + (s[0] + n.dx).toFixed(1) + 'px,' + (s[1] - 34 - rise).toFixed(1) + 'px) translate(-50%,-50%) scale(' + pop.toFixed(3) + ')';
        n.el.style.opacity = String(u > 0.75 ? 1 - (u - 0.75) / 0.25 : 1);
      }
      function number(p, text, cls) {
        const el = document.createElement('div'); el.className = 'num' + (cls ? ' ' + cls : ''); el.textContent = String(text);
        const n = { el, p: new THREE.Vector3(p.x, p.y, p.z), t: 0, dur: 1.2, dx: rnd(-16, 16) };
        place(n); numsEl.appendChild(el); nums.push(n);
      }
      function flash(color, peak, dur) { if (REDUCED) peak *= 0.3; flashEl.style.background = color; flashA = Math.max(flashA, peak); flashDur = dur; }
      function vignette(v) { vigEl.style.opacity = String(v); }
      function tint(v) { $('tint').style.opacity = String(v); }
      function cinematic(on) { stage.classList.toggle('cine', !!on); }
      const el = { hp: $('hp'), hpm: $('hpm'), mp: $('mp'), mpm: $('mpm'), atb: $('atb'), tr: $('tr'), tag: $('tranceTag'), ehp: $('ehp'), lv: $('ioLv'), elv: $('foeLv'), ename: $('foeName') };
      el.atbI = el.atb.firstElementChild; el.trI = el.tr.firstElementChild;
      const last = {};
      const set = (k, v, fn) => { if (last[k] !== v) { last[k] = v; fn(v); } };
      // Io's window and the foe's, from the shown numbers (D), and the turn gauge straight from the engine
      function status() {
        if (!E) return;
        const io = E.hero('io'), d = D[io.key], foe = E.foes[0], df = D[foe.key];
        set('hp', d.hp, (v) => { el.hp.textContent = nf(v); el.hp.classList.toggle('low', v < io.maxHp * 0.5 && v >= io.maxHp * 0.25); el.hp.classList.toggle('crit', v < io.maxHp * 0.25); });
        set('hpm', io.maxHp, (v) => { el.hpm.textContent = '/' + nf(v); });
        set('mp', d.mp, (v) => { el.mp.textContent = v; }); set('mpm', io.maxMp, (v) => { el.mpm.textContent = '/' + v; });
        set('lv', io.level, (v) => { el.lv.textContent = 'Level ' + v; });
        set('elv', foe.level, (v) => { el.elv.textContent = 'Level ' + v; });
        set('ename', foe.name, (v) => { el.ename.textContent = v; });
        const atb = S.state !== 'battle' ? 0 : UI_MENU() ? 1 : Math.min(1, io.atb);
        set('atb', Math.round(atb * 300), () => { el.atbI.style.width = (atb * 100).toFixed(1) + '%'; el.atb.classList.toggle('full', atb >= 1); });
        set('tr', Math.round(d.tr * 300) + (d.inTrance ? 1000 : 0), () => { el.trI.style.width = (d.tr * 100).toFixed(1) + '%'; el.tr.classList.toggle('full', d.inTrance); });
        set('tag', d.inTrance, (v) => el.tag.classList.toggle('on', v));
        set('ehp', Math.round(df.hp / foe.maxHp * 400), () => { el.ehp.style.width = (df.hp / foe.maxHp * 100).toFixed(1) + '%'; });
      }
      function update(rdt) {
        for (let i = nums.length - 1; i >= 0; i--) {
          const n = nums[i]; n.t += rdt;
          if (n.t >= n.dur) { n.el.remove(); nums.splice(i, 1); continue; }
          place(n);
        }
        if (flashA > 0) { flashA = Math.max(0, flashA - rdt / flashDur); flashEl.style.opacity = String(flashA); }
      }
      function showBattle(on) { $('ui').hidden = !on; $('enemy').hidden = !on; }
      return {
        open, waitMenu, banner, msg, hideMsg, number, flash, vignette, tint, cinematic, status, update, showBattle,
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

    // ---------- the fighters ----------
    let scene = null;
    const V = () => new THREE.Vector3();
    function fighter(m, x, z, yaw) { return { m, pos: { x, z }, yaw, tyaw: yaw, phase: 0, wb: 0, target: null, speed: 0, res: null, spin: 0 }; }
    let IO = null, WR = null, LU = null; // the fighters: Io, the foe, Lunara
    function moveTo(a, x, z, speed) { return new Promise((res) => { if (a.res) a.res(); a.target = { x, z }; a.speed = speed; a.res = res; }); }
    function stepActor(a, dt) {
      let moved = 0;
      if (a.target) {
        const dx = a.target.x - a.pos.x, dz = a.target.z - a.pos.z, d = Math.hypot(dx, dz), st = Math.min(d, a.speed * dt);
        if (d > 1e-4) { a.pos.x += dx / d * st; a.pos.z += dz / d * st; a.tyaw = Math.atan2(dx, dz); moved = st; }
        if (d - st < 1e-3) { a.target = null; const r = a.res; a.res = null; if (r) r(); }
      }
      // a model's own lunges and knockbacks move it along its facing
      if (a.m.busy && a.m.dash && dt > 0) { a.pos.x += Math.sin(a.yaw) * a.m.dash * dt; a.pos.z += Math.cos(a.yaw) * a.m.dash * dt; }
      if (a.spin > 0) { const s = Math.min(a.spin, dt * 9); a.yaw += s; a.spin -= s; }
      else { let dy = a.tyaw - a.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); a.yaw += dy * Math.min(1, dt * 10); }
      return moved;
    }
    const chestW = () => IO.m.anchor('chest', V()), chestE = () => WR.m.anchor('chest', V());
    const posW = () => IO.pos, posE = () => WR.pos;
    function toward(from, to, dist) { const dx = to.x - from.x, dz = to.z - from.z, d = Math.hypot(dx, dz) || 1; return { x: to.x - dx / d * dist, z: to.z - dz / d * dist }; }
    const mid = (a, b) => ({ x: (a.x + b.x) / 2, z: (a.z + b.z) / 2 });

    // ---------- the battle: the engine's state, and the numbers shown so far ----------
    // The engine resolves each action at once; D holds what the player has been shown, and catches up blow by blow
    let E = null;
    const D = {};
    const S = { trace: [], state: 'boot', acting: false, t0: 0, tranceOn: false, guard: false, skip: false, auto: cfg.auto || null, rand: null, result: null };
    function newEngine() {
      const seed = cfg.seed || (1 + Math.floor(Math.random() * 1e9));
      S.rand = BE.rng(seed * 2654435761 + 97);
      const setup = cfg.setup(LEVEL);
      E = BE.create(Object.assign({ seed }, setup));
      for (const u of E.units) D[u.key] = { hp: u.hp, mp: u.mp, tr: u.trance || 0, inTrance: false };
      S.tranceOn = false; S.dealt = 0;
    }
    const unitOf = (key) => E.unit(key);

    // A move's events in order: show(k) brings on the next blow or heal (and whatever it caused), rest() the remainder
    function events(list) {
      let i = 0;
      const isBlow = (e) => e.t === 'hit' || e.t === 'heal';
      return {
        has() { for (let k = i; k < list.length; k++) if (isBlow(list[k])) return true; return false; },
        // the next blow, and every status event up to the blow after it
        show(o) {
          while (i < list.length && !isBlow(list[i])) apply(list[i++], o);
          if (i < list.length) apply(list[i++], o);
          while (i < list.length && !isBlow(list[i])) apply(list[i++], o);
        },
        rest(o) { while (i < list.length) apply(list[i++], o); },
        get list() { return list; },
      };
    }
    function apply(e, o) {
      o = o || {};
      if (e.t === 'hit') {
        const to = unitOf(e.to), from = unitOf(e.from), d = D[e.to];
        d.hp = Math.max(0, d.hp - e.n);
        const big = o.big || e.n >= 300 * RL.scale(from ? from.level : 1);
        if (to.side === 'foe') {
          S.dealt += e.n;
          UI.number(WR.m.anchor('chest', V()), nf(e.n), big ? 'big' : '');
          if (d.hp > 0) WR.m.play('hurt');
          const df = D[e.from]; if (df && !df.inTrance) df.tr = Math.min(0.99, df.tr + RL.TRANCE.dealt);
        } else {
          const guard = e.guard;
          if (E.lunara === 1 || o.embrace) FX.burst(chestW(), [0.8, 0.88, 1], 18, 2.2);
          UI.number(chestW(), nf(e.n), guard ? 'small' : '');
          if (d.hp <= 0) IO.m.play('kneel', true); else IO.m.play(guard ? 'block' : 'hurt', true);
          if (guard) FX.shieldHit();
          if (!d.inTrance && d.hp > 0) d.tr = Math.min(1, d.tr + e.n / to.maxHp * RL.TRANCE.taken);
        }
      } else if (e.t === 'heal') {
        const to = unitOf(e.to), d = D[e.to];
        d.hp = Math.min(to.maxHp, d.hp + e.n);
        UI.number(to.side === 'foe' ? chestE() : chestW(), nf(e.n), 'heal');
      } else if (e.t === 'tranceReady') {
        D[e.who].tr = 1; SND.sfx.chime(); FX.burst(chestW(), [1, 0.92, 1], 30, 2.5);
        UI.msg('Her Trance gauge is full.', true); setTimeout(() => UI.hideMsg(), 1500);
      } else if (e.t === 'bound') {
        UI.number(chestE().add(new THREE.Vector3(0, 0.45, 0)), 'Bound', 'word');
      } else if (e.t === 'down') {
        const u = unitOf(e.who);
        if (u.side === 'foe') { clock.scale = 0.25; clock.slowT = 1.2; UI.cinematic(true); }
      } else if (e.t === 'tranceEnds') {
        D[e.who].inTrance = false; D[e.who].tr = 0; S.tranceOn = false;
        if (o.quiet !== true) { UI.msg('Her Trance fades.', true); setTimeout(() => UI.hideMsg(), 1300); }
      }
    }
    // keep the shown numbers honest once a move has played
    function sync() {
      for (const u of E.units) { const d = D[u.key]; d.hp = u.hp; d.mp = u.mp; d.tr = u.trance; d.inTrance = u.inTrance; }
    }

    // ---------- Io's commands ----------
    async function doAttack(ev) {
      UI.banner('Attack');
      const spot = toward(IO.pos, WR.pos, 1.2);
      shotBoth(IO.pos, WR.pos, 1.12, 2.5);
      await moveTo(IO, spot.x, spot.z, 4.2);
      IO.tyaw = faceYaw(IO.pos, WR.pos); await wait(0.12);
      shotAt(mid(IO.pos, WR.pos), 1.8, 3);
      const m = IO.m; m.play('combo', true);
      const H = m.ACTIONS.combo.hits;
      for (let k = 0; k < H.length; k++) {
        await untilP(m, H[k] - 0.05); SND.sfx.swish();
        await untilP(m, H[k]);
        if (!ev.has()) continue;
        const big = k === 2, p = chestE();
        FX.slash(p, 0xffffff, [-0.5, 2.5, 0.15][k], big ? 1.3 : 1.05, 0.3); FX.burst(p, [1, 0.95, 0.8], big ? 40 : 26, big ? 4 : 3.2); FX.flashLight(p, 0xfff1d0, big ? 3 : 2, 0.2);
        SND.sfx.hit(big ? 1.2 : 0.9); addShake(big ? 9 : 5); hitStop(big ? 0.11 : 0.06); ev.show({ big });
      }
      await until(() => !m.busy);
      ev.rest();
      if (E.over === 'win') return;
      await moveTo(IO, HOME.io.x, HOME.io.z, 4.2); IO.tyaw = HOME.io.yaw;
    }
    async function doFlame(ev) {
      UI.banner('Flame Bolt');
      IO.tyaw = faceYaw(IO.pos, WR.pos); shotBoth(IO.pos, WR.pos, 1.05, 2.5); await wait(0.15);
      const m = IO.m; m.play('throw', true); SND.sfx.fire();
      await untilP(m, m.ACTIONS.throw.cues[0]);
      await FX.projectile({ from: m.flamePos(V()), to: chestE, dur: 0.5, arc: 0.45, color: 0xe08cff, halo: 0x9a3cff, size: 0.34, trail: [0.8, 0.35, 1], light: 0xb455ff, lightI: 3 });
      const p = chestE();
      FX.burst(p, [0.85, 0.4, 1], 60, 4.2); FX.ring(WR.pos, 0xc060ff, 0.2, 1.9, 0.6, 0.9); FX.flashLight(p, 0xc070ff, 4, 0.4, 7);
      SND.sfx.boom(0.8); addShake(10); hitStop(0.1); ev.show({ big: true });
      await until(() => !m.busy); ev.rest();
    }
    async function doCrescent(ev) {
      UI.banner('Crescent Blades');
      IO.tyaw = faceYaw(IO.pos, WR.pos); shotAt(IO.pos, 1.55, 2.5);
      const m = IO.m, C = m.ACTIONS.crescent.cues; m.play('crescent', true); SND.sfx.chime();
      await untilP(m, C[0]);
      const list = FX.blades(chestW, 5);
      await untilP(m, C[1]); shotBoth(IO.pos, WR.pos, 1.05, 3);
      const hits = [];
      for (let i = 0; i < 5; i++) {
        SND.sfx.blade();
        hits.push(FX.launchBlade(list[i], chestE, 0.32).then(() => {
          if (!ev.has()) return;
          const p = chestE(); FX.slash(p, 0xcfe0ff, rnd(0, TAU), 0.9, 0.25); FX.burst(p, [0.7, 0.8, 1], 18, 2.8);
          SND.sfx.hit(0.7); addShake(4); hitStop(0.04); ev.show();
        }));
        await wait(0.13);
      }
      await Promise.all(hits); await until(() => !m.busy); ev.rest();
    }
    async function doBriars(ev) {
      UI.banner('Nightbloom Briars');
      IO.tyaw = faceYaw(IO.pos, WR.pos); shotBoth(IO.pos, WR.pos, 1.05, 2.5); await wait(0.12);
      const m = IO.m; m.play('briar', true); SND.sfx.fire();
      await untilP(m, m.ACTIONS.briar.cues[0]);
      shotAt(WR.pos, 1.45, 3.2);
      FX.sigil(WR.pos, 0xc070ff, 2.4, 1.8, 2); FX.briars(WR.pos, 1.7);
      FX.burst(new THREE.Vector3(WR.pos.x, 0.25, WR.pos.z), [0.75, 0.35, 1], 50, 3, { up: 1 });
      SND.sfx.grasp(); await untilP(m, m.ACTIONS.briar.hits[0]);
      FX.flashLight(chestE(), 0xb455ff, 3, 0.4); SND.sfx.hit(1.1); addShake(10); hitStop(0.08);
      ev.show();
      await until(() => !m.busy); ev.rest();
    }
    async function doMend(ev) {
      UI.banner('Lunar Mend');
      shotAt(IO.pos, 1.8, 2.5);
      const m = IO.m; m.play('mend', true); SND.sfx.heal();
      FX.rise(() => IO.pos, [0.6, 1, 0.75], 1.5, 40, 0.55); FX.sigil(IO.pos, 0xb8ffd0, 1.8, 1.8, 1.5);
      await untilP(m, m.ACTIONS.mend.hits[0]);
      ev.show(); FX.burst(chestW(), [0.6, 1, 0.75], 30, 2, { up: 1 });
      await until(() => !m.busy); ev.rest();
    }
    async function doDefend(ev) {
      UI.banner('Defend'); IO.m.guard(true); S.guard = true; SND.sfx.guard();
      IO.tyaw = faceYaw(IO.pos, WR.pos); FX.shield(true, IO.pos, faceYaw(IO.pos, WR.pos));
      await wait(0.6); ev.rest();
    }
    async function doMoonlight(ev) {
      UI.banner('Moonlight', 2.2); UI.cinematic(true); UI.vignette(0.55);
      shotAt(IO.pos, 1.5, 2);
      const m = IO.m, A2 = m.ACTIONS.moon; m.play('moon', true); SND.sfx.moon();
      await untilP(m, A2.cues[0]);
      shotAt(WR.pos, 1.3, 3.2);
      await untilP(m, A2.cues[1]);
      FX.beam(WR.pos, 0xe6eeff, 3.4, 14, 1.9); FX.sigil(WR.pos, 0xdfe9ff, 3.4, 2.1, 3);
      for (let k = 0; k < A2.hits.length; k++) {
        await untilP(m, A2.hits[k]);
        if (!ev.has()) break;
        const p = chestE();
        FX.burst(p, [0.85, 0.92, 1], 70, 5, { spread: 0.3 }); FX.ring(WR.pos, 0xe6eeff, 0.3, 3.2, 0.7, 1); FX.flashLight(p, 0xe8f0ff, 6, 0.5, 9);
        UI.flash('#ffffff', 0.75 - k * 0.2, 0.35); SND.sfx.boom(1.1); addShake(14); hitStop(0.12);
        ev.show({ big: true, quiet: true });
      }
      await until(() => !m.busy);
      ev.rest({ quiet: true });
      UI.vignette(0); if (!E.over) UI.cinematic(false);
      S.tranceOn = false;
    }
    async function doTransform() {
      UI.banner('Lunar Trance', 2.8); UI.cinematic(true); UI.vignette(0.55); UI.tint(0.55);
      IO.tyaw = 0.15; shotAt(IO.pos, 1.95, 2.4);
      const m = IO.m; m.play('transform', true); SND.sfx.trance(); SND.sfx.moon();
      FX.sigil(IO.pos, 0xdfe9ff, 2.3, 3.0, 2.5); FX.beam(IO.pos, 0xe6eeff, 1.5, 12, 2.6);
      FX.spiral(chestW, [0.8, 0.9, 1], 1.5, 90);
      await untilP(m, m.ACTIONS.transform.cues[0]);
      S.tranceOn = true; D.io.inTrance = true;
      const c = chestW();
      FX.burst(c, [0.85, 0.92, 1], 100, 4.8, { spread: 0.25 }); FX.ring(IO.pos, 0xffffff, 0.3, 3.2, 0.8, 1); FX.ring(IO.pos, 0xbfd6ff, 0.3, 4.5, 1.1, 0.7);
      FX.flashLight(c, 0xe8f0ff, 5, 0.6, 7); UI.flash('#ffffff', 0.65, 0.45); SND.sfx.boom(0.7); SND.sfx.chime(); addShake(8);
      await until(() => !m.busy);
      UI.msg('The moon answers. She becomes Lunara’s vessel.', true); await wait(1.3); UI.hideMsg();
      UI.vignette(0); UI.cinematic(false); UI.tint(0);
      IO.tyaw = HOME.io.yaw;
    }
    // Lunara: Io calls her up from the Moonwell; she rises and closes her wings over the party (the Embrace heals and
    // shields), and waits behind the well for her strike
    async function doSummon(ev) {
      UI.banner('Summon: Lunara', 2.8);
      UI.cinematic(true); UI.vignette(0.6); UI.tint(0.6);
      IO.tyaw = faceYaw(IO.pos, LUN); shotAt(IO.pos, 1.7, 2.4);
      const m = IO.m; m.play('summon', true); SND.sfx.chime();
      FX.sigil(IO.pos, 0xd8c8ff, 1.9, 2.6, -2);
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
      // the wide shot: the whole of her, the well, Io and the wraith in frame
      const wideLun = () => shotFit([IO.pos, WR.pos, { x: LUN.x, y: 4.6, z: LUN.z }, { x: LUN.x, y: 0, z: LUN.z }], 1, 0.9);
      wideLun();
      await untilP(L, L.ACTIONS.appear.cues[1]);
      const hp = L.anchor('head', V());
      FX.burst(hp, [0.75, 1, 0.88], 90, 4.5, { spread: 0.9 }); FX.ring(LUN, 0xdfffee, 0.4, 4.6, 0.9, 0.8);
      UI.flash('#ffffff', 0.45, 0.4); SND.sfx.chime(); SND.sfx.boom(0.5); addShake(5);
      UI.msg('Lunara, the Pale Mother, rises from the Moonwell.', true);
      await until(() => !L.busy);
      UI.hideMsg();
      // the Embrace: her wings close over the party, then open; Io heals and is shielded until the strike
      L.play('embrace', true); SND.sfx.heal();
      await untilP(L, L.ACTIONS.embrace.cues[0]);
      FX.converge(() => L.anchor('chest', V()), [0.8, 1, 0.88], 1.0, 90); FX.rise(() => IO.pos, [0.75, 1, 0.85], 1.2, 40, 0.6);
      await untilP(L, L.ACTIONS.embrace.hits[0]);
      FX.sigil(IO.pos, 0xd8ffe8, 1.7, 2.2, 1.5); FX.ring(IO.pos, 0xd8ffe8, 0.2, 1.5, 0.8, 0.9);
      FX.burst(chestW(), [0.75, 1, 0.85], 30, 2, { up: 1 }); FX.flashLight(chestW(), 0xc8ffdc, 2.2, 0.8, 4);
      ev.show();
      UI.msg('Pale Mother’s Embrace: Io heals, and takes less harm until Lunara strikes.', true);
      await until(() => !L.busy); await wait(0.9); UI.hideMsg();
      ev.rest();
      UI.vignette(0); UI.cinematic(false); UI.tint(0);
      IO.tyaw = HOME.io.yaw;
    }
    // Silver Requiem, on Io's next turn: the moon gathers over her, six moonbeams fall, then Moonfall; she sinks home
    async function goddessStrike(ev) {
      const L = LU.m, R = L.ACTIONS.release;
      UI.banner('Lunara: Silver Requiem', 3.2); UI.cinematic(true); UI.vignette(0.75); UI.tint(0.65);
      shotFit([IO.pos, WR.pos, { x: LUN.x, y: 5.2, z: LUN.z }], 1, 2);
      L.play('charge', true); SND.sfx.moon();
      const orbP = () => L.anchor('orb', V());
      FX.converge(orbP, [0.85, 0.9, 1], 1.9, 110); FX.rise(() => LUN, [0.85, 0.9, 1], 1.9, 50, 1.4);
      await until(() => !L.busy);
      L.play('release', true); SND.sfx.blade(); FX.burst(orbP(), [0.9, 0.95, 1], 50, 3.5);
      await untilP(L, R.cues[0]);
      FX.projectile({ from: orbP(), to: () => new THREE.Vector3(WR.pos.x, 9.5, WR.pos.z), dur: 0.55, arc: 1.4, tex: L.moonTex, color: 0xffffff, halo: 0xcfe0ff, size: 1.0, trail: [0.8, 0.85, 1], light: 0xe6eeff, lightI: 4 });
      shotAt(WR.pos, 1.15, 3);
      for (let k = 0; k < 6; k++) {
        await untilP(L, R.hits[k]);
        if (!ev.has()) break;
        const a = rnd(0, TAU), r = rnd(0.3, 1.3), p = { x: WR.pos.x + Math.cos(a) * r, z: WR.pos.z + Math.sin(a) * r * 0.8 };
        FX.beam(p, 0xe6eeff, 0.9, 12, 0.55); FX.ring(p, 0xe6eeff, 0.1, 1.2, 0.5, 0.9); FX.burst(new THREE.Vector3(p.x, 0.3, p.z), [0.8, 0.88, 1], 26, 3, { up: 1 });
        SND.sfx.hit(0.8); addShake(6); hitStop(0.03); ev.show();
      }
      if (ev.has()) {
        await untilP(L, R.cues[1]);
        UI.banner('Moonfall', 1.6); SND.sfx.eclipse();
        const dur = (R.hits[6] - R.cues[1]) * R.dur;
        FX.ring(WR.pos, 0xdfe8ff, 3.5, 1.0, dur, 0.7); FX.moonfall(WR.pos, L.moonTex, dur);
        await untilP(L, R.hits[6]);
        const p = chestE();
        UI.flash('#ffffff', 1.0, 0.8); SND.sfx.boom(1.5); SND.sfx.boom(1.0); addShake(22); hitStop(0.25);
        FX.beam(WR.pos, 0xffffff, 5.4, 16, 1.6); FX.sigil(WR.pos, 0xe6eeff, 4.8, 1.9, 3);
        for (const [r1, d, op] of [[5.5, 0.9, 1], [7.5, 1.3, 0.7], [3.5, 0.6, 1]]) FX.ring(WR.pos, 0xffffff, 0.3, r1, d, op);
        FX.burst(p, [0.9, 0.95, 1], 160, 6.5, { spread: 0.6 }); FX.flashLight(p, 0xffffff, 10, 0.9, 13);
        ev.show({ big: true });
      }
      ev.rest();
      await wait(1.0);
      L.play('leave', true); FX.burst(L.anchor('head', V()), [0.75, 1, 0.88], 70, 3, { spread: 1.0 });
      if (!E.over) UI.msg('Lunara sinks back into the Moonwell.', true);
      await wait(1.6); UI.hideMsg();
      LU.on = false;
      UI.vignette(0); UI.tint(0); if (!E.over) UI.cinematic(false);
    }

    // ---------- the foe's attacks ----------
    async function eSweep(ev) {
      UI.banner('Soul Reaper');
      const W = WR.m, spot = toward(WR.pos, IO.pos, 1.75);
      shotBoth(IO.pos, WR.pos, 1.1, 2.5);
      await moveTo(WR, spot.x, spot.z, 3.4);
      WR.tyaw = faceYaw(WR.pos, IO.pos); await wait(0.15);
      shotAt(mid(IO.pos, WR.pos), 1.65, 3);
      W.play('sweep', true); SND.sfx.shriek(0.6);
      await untilP(W, W.ACTIONS.sweep.cues[0]); SND.sfx.swish();
      await untilP(W, W.ACTIONS.sweep.hits[0]);
      const p = chestW();
      FX.slash(p, 0x5dff9d, rnd(2.4, 3.0), 1.5, 0.35); FX.burst(p, [0.3, 1, 0.55], 40, 3.6); FX.flashLight(p, 0x4dff90, 3, 0.3);
      SND.sfx.hit(1.1); addShake(10); hitStop(0.09); ev.show();
      await until(() => !W.busy); ev.rest();
      await moveTo(WR, HOME.wraith.x, HOME.wraith.z, 3.2); WR.tyaw = HOME.wraith.yaw;
    }
    async function eBolts(ev) {
      UI.banner('Soul Bolts'); WR.tyaw = faceYaw(WR.pos, IO.pos); shotBoth(IO.pos, WR.pos, 1.0, 2.5);
      const W = WR.m; W.play('cast', true); SND.sfx.shriek(0.5);
      const hits = [];
      for (const u of W.ACTIONS.cast.hits) {
        await untilP(W, u); SND.sfx.fire();
        hits.push(FX.projectile({ from: W.anchor('bolt', V()), to: chestW, dur: 0.55, arc: rnd(0.3, 0.9), side: rnd(-0.25, 0.25), color: 0x9dffc4, halo: 0x2cff7c, size: 0.2, trail: [0.25, 1, 0.5], light: 0x3cff8a, lightI: 2 }).then(() => {
          if (!ev.has()) return;
          const p = chestW(); FX.burst(p, [0.3, 1, 0.55], 22, 2.6); SND.sfx.hit(0.7); addShake(5); hitStop(0.04); ev.show();
        }));
      }
      await Promise.all(hits); await until(() => !W.busy); ev.rest();
    }
    async function eGrasp(ev) {
      UI.banner('Shadow Grasp'); WR.tyaw = faceYaw(WR.pos, IO.pos); shotBoth(IO.pos, WR.pos, 1.0, 2.5);
      FX.sigil(IO.pos, 0x2dff7a, 2.0, 1.9, -2);
      const W = WR.m; W.play('grasp', true); SND.sfx.grasp();
      await untilP(W, W.ACTIONS.grasp.cues[0]); shotAt(IO.pos, 1.6, 3.5);
      FX.tendrils(IO.pos, 1.3); FX.burst(new THREE.Vector3(IO.pos.x, 0.2, IO.pos.z), [0.2, 0.9, 0.45], 50, 3, { up: 1 });
      await untilP(W, W.ACTIONS.grasp.hits[0]);
      FX.flashLight(chestW(), 0x3cff8a, 3, 0.4); SND.sfx.hit(1.2); addShake(12); hitStop(0.1); ev.show();
      await until(() => !W.busy); ev.rest();
    }
    async function eEclipse(ev) {
      UI.banner('Eclipse', 2.4); UI.cinematic(true); UI.vignette(0.9);
      WR.tyaw = faceYaw(WR.pos, IO.pos); shotAt(WR.pos, 1.25, 2);
      const W = WR.m, EC = W.ACTIONS.eclipse; W.play('eclipse', true); SND.sfx.eclipse(); SND.sfx.shriek(1.4);
      FX.blackSun(W.anchor('sun', V()), 2.4);
      await untilP(W, EC.cues[1]); shotBoth(IO.pos, WR.pos, 1.0, 3);
      FX.ring(WR.pos, 0x2dff7a, 0.3, 6.5, 0.9, 1);
      await untilP(W, EC.hits[0]);
      const p = chestW();
      FX.burst(p, [0.2, 1, 0.5], 80, 5); FX.flashLight(p, 0x3cff8a, 5, 0.5, 8); UI.flash('#0b2a16', 0.7, 0.4);
      SND.sfx.boom(1.3); addShake(16); hitStop(0.14); ev.show({ big: true });
      await until(() => !W.busy); ev.rest();
      UI.vignette(0); UI.cinematic(false);
    }

    const HERO_MOVES = { attack: doAttack, flame: doFlame, crescent: doCrescent, briars: doBriars, mend: doMend, defend: doDefend, moonlight: doMoonlight, lunara: doSummon };
    const FOE_MOVES = { sweep: eSweep, bolts: eBolts, grasp: eGrasp, eclipse: eEclipse };

    // ---------- playing a turn's log ----------
    // The log splits into parts, each starting at a move, a strike, a Trance or a turn; each part plays its own
    // choreography, and the blows inside it are shown at that choreography's hit times
    async function playLog(log) {
      const parts = [];
      for (const e of log) {
        if (['turn', 'move', 'strike', 'trance', 'charge'].includes(e.t) || !parts.length) parts.push([e]);
        else parts[parts.length - 1].push(e);
      }
      for (const part of parts) {
        const head = part[0], ev = events(part.slice(1));
        // Defend lasts until her next turn
        if (head.t === 'turn') { if (head.who === 'io' && S.guard) { S.guard = false; IO.m.guard(false); FX.shield(false); } ev.rest(); }
        else if (head.t === 'trance') { await doTransform(); ev.rest(); }
        else if (head.t === 'strike' && head.who === 'lunara') await goddessStrike(ev);
        else if (head.t === 'move') {
          const u = unitOf(head.who);
          if (u.side === 'hero' && HERO_MOVES[head.move]) { D[u.key].mp = u.mp; await HERO_MOVES[head.move](ev); }
          else if (u.side === 'foe' && FOE_MOVES[head.move]) await FOE_MOVES[head.move](ev);
          else { UI.banner(head.name); await wait(0.8); ev.rest(); }
        } else ev.rest();
        if (E.over && E.over !== 'win' && D.io.hp <= 0) break;
      }
      sync();
    }

    // ---------- turns ----------
    function menuMain(s) {
      const ok = (id) => s.options.find((o) => o.id === id);
      const list = [];
      const ml = ok('moonlight'); if (ml) list.push({ id: 'moonlight', label: 'Moonlight', hot: true });
      list.push({ id: 'attack', label: 'Attack' });
      list.push({ id: 'witchcraft', label: 'Witchcraft' });
      list.push({ id: 'moonlore', label: 'Moonlore' });
      const lun = ok('lunara'); list.push({ id: 'summon', label: 'Summon', disabled: !lun || !lun.ok });
      if (s.options.some((o) => o.herb && o.ok)) list.push({ id: 'item', label: 'Item' });
      list.push({ id: 'defend', label: 'Defend' });
      return list;
    }
    const spellItem = (s, id) => { const o = s.options.find((x) => x.id === id); return o ? { id, label: o.name, tag: o.mp + ' MP', disabled: !o.ok } : null; };
    function menuOf(s, which) {
      if (which === 'witchcraft') return ['flame', 'crescent', 'briars'].map((id) => spellItem(s, id)).filter(Boolean).concat([{ id: 'back', label: 'Back' }]);
      if (which === 'moonlore') return ['mend', 'waxing', 'moonsteel', 'mothveil'].map((id) => spellItem(s, id)).filter(Boolean).concat([{ id: 'back', label: 'Back' }]);
      if (which === 'summon') { const o = s.options.find((x) => x.id === 'lunara'); return [{ id: 'lunara', label: 'Lunara', tag: 'Once', disabled: !o || !o.ok }, { id: 'back', label: 'Back' }]; }
      if (which === 'item') return s.options.filter((o) => o.herb).map((o) => ({ id: o.id, label: o.name, disabled: !o.ok })).concat([{ id: 'back', label: 'Back' }]);
      return menuMain(s);
    }
    function chooseCommand(s) {
      return new Promise((res) => {
        if (S.auto && window.BattleSim) {
          setTimeout(() => { const [id, t] = window.BattleSim.POLICIES[S.auto](E, s, S.rand); res([id, t]); }, 250);
          return;
        }
        const onCmd = (id) => {
          if (['witchcraft', 'moonlore', 'summon', 'item'].includes(id)) return UI.open(menuOf(s, id), { witchcraft: 'Witchcraft', moonlore: 'Moonlore', summon: 'Summon', item: 'Item' }[id], onCmd);
          if (id === 'back') return UI.open(menuMain(s), null, onCmd);
          const o = s.options.find((x) => x.id === id);
          if (!o || !o.ok) return;
          // one foe and one hero here, so every command has its target already; the party's battles pick one
          res([id, o.targets[0]]);
        };
        UI.open(menuMain(s), null, onCmd);
      });
    }
    async function runTurn() {
      S.acting = true;
      const s = E.turn();
      if (s.type === 'choose') {
        await playLog(s.log);
        if (E.over) return finish();
        shotBoth(IO.pos, WR.pos, 1, 2);
        const [id, t] = await chooseCommand(s);
        UI.waitMenu();
        const log = E.choose(id, t);
        await playLog(log);
      } else await playLog(s.log);
      if (E.over) return finish();
      // anyone knocked out of place walks back
      const back = [];
      if (Math.hypot(IO.pos.x - HOME.io.x, IO.pos.z - HOME.io.z) > 0.05) back.push(moveTo(IO, HOME.io.x, HOME.io.z, 2.2).then(() => { IO.tyaw = HOME.io.yaw; }));
      if (Math.hypot(WR.pos.x - HOME.wraith.x, WR.pos.z - HOME.wraith.z) > 0.05) back.push(moveTo(WR, HOME.wraith.x, HOME.wraith.z, 2.2).then(() => { WR.tyaw = HOME.wraith.yaw; }));
      await Promise.all(back);
      shotBoth(IO.pos, WR.pos, 1, 2);
      S.acting = false;
    }
    function updateBattle(dt) {
      if (S.state !== 'battle' || S.acting) return;
      const log = E.tick(dt);
      if (log.length) { S.acting = true; playLog(log).then(() => { if (E.over) finish(); else S.acting = false; }); return; }
      if (E.ready()) runTurn();
    }

    // ---------- the story beats: the wraith comes in from the bridge; the end ----------
    let skipRes = null, skipP = Promise.resolve();
    const ws = (sec) => Promise.race([wait(sec), skipP]);
    async function intro(quick) {
      S.state = 'intro'; S.skip = false;
      skipP = new Promise((r) => { skipRes = r; });
      const W = WR.m;
      if (!quick) {
        $('skip').hidden = false;
        WR.pos = { x: ROUTE[0].x, z: ROUTE[0].z }; WR.yaw = WR.tyaw = faceYaw(ROUTE[0], ROUTE[1]);
        W.root.visible = false;
        shotAt(WR.pos, 1.45, 1.4); UI.msg('Something stirs in the Thornwood…');
        await ws(1.5);
        W.root.visible = true;
        if (!S.skip) {
          W.play('appear', true); SND.sfx.shriek(1.2);
          FX.burst(new THREE.Vector3(WR.pos.x, 1.4, WR.pos.z), [0.3, 1, 0.55], 60, 3); FX.ring(WR.pos, 0x3cff8a, 0.2, 2.2, 0.8, 1);
          await ws(1.7);
        }
        UI.hideMsg();
        if (!S.skip) { followShot(() => WR.pos, 1.3, 2.2); for (let i = 1; i < ROUTE.length && !S.skip; i++) await Promise.race([moveTo(WR, ROUTE[i].x, ROUTE[i].z, 2.5), skipP]); }
        $('skip').hidden = true;
        if (S.skip) { WR.target = null; WR.res = null; WR.pos = { x: HOME.wraith.x, z: HOME.wraith.z }; W.reset(); }
      } else {
        WR.pos = { x: HOME.wraith.x, z: HOME.wraith.z }; WR.yaw = WR.tyaw = HOME.wraith.yaw;
        W.root.visible = true; W.play('appear', true); SND.sfx.shriek(1.0);
        FX.burst(new THREE.Vector3(WR.pos.x, 1.4, WR.pos.z), [0.3, 1, 0.55], 50, 3);
      }
      W.root.visible = true;
      WR.tyaw = HOME.wraith.yaw; IO.tyaw = HOME.io.yaw;
      UI.showBattle(true); UI.status(); layoutView();
      shotBoth(IO.pos, WR.pos, 1, 2);
      IO.m.play('cast'); UI.msg('The Shadow Wraith attacks!'); SND.startMusic();
      await wait(1.4); UI.hideMsg();
      S.state = 'battle'; S.t0 = clock.t;
    }
    async function finish() {
      if (S.state === 'over') return;
      S.state = 'over'; S.acting = true; UI.waitMenu();
      const r = E.result(); S.result = r;
      const mark = (k) => S.trace.push([k, +clock.t.toFixed(2)]);
      mark('finish');
      if (r.outcome === 'win') {
        UI.cinematic(true); SND.stopMusic(1.2);
        await wait(0.3); clock.scale = 1; clock.slowT = 0;
        const W = WR.m;
        shotAt(WR.pos, 1.35, 2); W.play('die', true); SND.sfx.shriek(1.8); mark('die');
        for (let i = 0; i < 5; i++) { await wait(0.28); const p = chestE(); p.x += rnd(-0.3, 0.3); p.y += rnd(-0.5, 0.4); FX.burst(p, [0.3, 1, 0.55], 30, 3); }
        SND.sfx.boom(0.9);
        // the soul goes home: a pale moth rises out of the empty robe
        await untilP(W, 0.7); mark('moth');
        UI.msg('A pale moth rises from the empty robe and drifts down into the Moonwell.', true);
        await until(() => W.progress >= 0.99 || W.progress < 0);
        mark('released'); UI.hideMsg(); UI.cinematic(false); UI.hideEnemy(); SND.sfx.victory();
        shotAt(IO.pos, 1.75, 2); IO.tyaw = 0.25; IO.spin = TAU;
        IO.m.play('victory', true);
        await until(() => IO.m.action !== 'victory' || IO.m.progress >= 1);
        mark('victory'); await wait(0.9);
      } else {
        SND.stopMusic(1.0); SND.sfx.defeat();
        S.guard = false; IO.m.guard(false); FX.shield(false); if (IO.m.action !== 'kneel') IO.m.play('kneel', true); shotAt(IO.pos, 1.6, 2); UI.vignette(0.6);
        await wait(2.0);
      }
      mark('card'); showEnd(r);
    }
    // the end card: the battle time and damage dealt; on a win, the experience, the shards and the level-up
    function showEnd(r) {
      const win = r.outcome === 'win';
      $('endTitle').textContent = win ? 'Victory!' : 'Defeated';
      $('endText').textContent = win ? cfg.winText : cfg.loseText;
      const sec = (clock.t - S.t0), m = Math.floor(sec / 60), s = Math.floor(sec % 60);
      $('stTime').textContent = m + ':' + String(s).padStart(2, '0'); $('stDmg').textContent = nf(S.dealt);
      $('xpBox').hidden = !win; $('lvlBox').hidden = true;
      $('again').textContent = win ? 'Fight again' : 'Try again';
      if (win) {
        const io = E.hero('io');
        let lv = io.level, xp = (cfg.xp || 0) + r.xp, ups = 0;
        while (lv < RL.MAX_LEVEL && xp >= RL.xpNeed(lv)) { xp -= RL.xpNeed(lv); lv++; ups++; }
        $('xpGain').textContent = '+' + nf(r.xp); $('shardGain').textContent = '+' + nf(r.shards);
        $('xpNext').textContent = nf(xp) + ' of ' + nf(RL.xpNeed(lv)) + ' to level ' + (lv + 1);
        const bar = $('xpBar'); bar.style.transition = 'none'; bar.style.width = '0%'; void bar.offsetWidth; bar.style.transition = '';
        setTimeout(() => { bar.style.width = (100 * xp / RL.xpNeed(lv)).toFixed(1) + '%'; }, 120);
        if (ups) {
          const H = RL.HEROES.io, k0 = RL.scale(io.level), k1 = RL.scale(lv);
          $('lvlTitle').textContent = 'Io is level ' + lv + '!';
          $('lvlHp').textContent = nf(H.hp * k0) + ' → ' + nf(H.hp * k1);
          $('lvlMp').textContent = Math.round(H.mp * RL.mpScale(io.level)) + ' → ' + Math.round(H.mp * RL.mpScale(lv));
          $('lvlAtk').textContent = nf(330 * k0) + ' → ' + nf(330 * k1);
          $('lvlBox').hidden = false;
          SND.sfx.chime();
        }
      }
      $('end').hidden = false; if (!coarse) $('again').focus({ preventScroll: true });
    }
    async function rematch() {
      $('end').hidden = true; UI.vignette(0); UI.cinematic(false); UI.tint(0);
      IO.m.reset(); WR.m.reset(); FX.shield(false); S.guard = false;
      LU.m.reset(); LU.on = false; LU.m.root.visible = false; if (LU.m.fx) LU.m.fx.visible = false;
      IO.pos = { x: HOME.io.x, z: HOME.io.z }; IO.yaw = IO.tyaw = HOME.io.yaw; IO.target = null; IO.res = null; IO.spin = 0;
      WR.target = null; WR.res = null; WR.spin = 0;
      newEngine(); S.acting = false; UI.status();
      await intro(true);
    }

    // ---------- main loop ----------
    let shadowW = null, shadowE = null, glowW = null, glowE = null, glowG = null;
    const flameP = new THREE.Vector3();
    let last = 0, tranceVis = 0, fxKids = -1;
    function frame(now) {
      const rdt = last ? Math.min(0.05, Math.max(0, (now - last) / 1000)) : 0.016; last = now;
      if (clock.slowT > 0) { clock.slowT -= rdt; if (clock.slowT <= 0) clock.scale = 1; }
      let dt = rdt;
      if (clock.stop > 0) { clock.stop -= rdt; dt = 0; } else dt *= clock.scale;
      dt *= clock.turbo;
      clock.t += dt;
      tickWaits();
      updateBattle(dt);

      // Io
      const mw = stepActor(IO, dt);
      IO.phase += mw * 4.2; IO.wb += ((mw > 1e-4 ? 1 : 0) - IO.wb) * Math.min(1, dt * 10);
      tranceVis += ((S.tranceOn ? 1 : 0) - tranceVis) * Math.min(1, dt * 3);
      IO.m.trance = tranceVis;
      IO.m.root.position.set(IO.pos.x, 0, IO.pos.z); IO.m.root.rotation.y = IO.yaw;
      if (IO.m.state) { const c = chestE(); IO.m.state.target = { x: c.x, y: c.y, z: c.z }; }
      IO.m.animate(IO.phase, IO.wb, clock.t, dt);
      // the foe
      const me = stepActor(WR, dt);
      WR.phase += me * 4.2; WR.wb += ((me > 1e-4 ? 1 : 0) - WR.wb) * Math.min(1, dt * 10);
      WR.m.root.position.set(WR.pos.x, 0, WR.pos.z); WR.m.root.rotation.y = WR.yaw;
      if (WR.m.state) { const c = chestW(); WR.m.state.target = { x: c.x, y: c.y, z: c.z }; }
      WR.m.animate(WR.phase, WR.wb, clock.t, dt);
      // Lunara, while she is up
      if (LU.on || LU.m.busy) {
        stepActor(LU, dt);
        LU.m.root.position.set(LU.pos.x, 0, LU.pos.z); LU.m.root.rotation.y = LU.yaw;
        if (LU.m.state) { const c = chestE(); LU.m.state.target = { x: c.x, y: c.y, z: c.z }; }
        LU.m.animate(0, 0, clock.t, dt);
      } else if (LU.m.root.visible && LU.m.gone) { LU.m.root.visible = false; if (LU.m.fx) LU.m.fx.visible = false; LU.shadow.visible = false; }

      shadowW.position.set(IO.pos.x, 0.006, IO.pos.z); const ls = 1 - (IO.m.lift || 0) * 1.6; shadowW.scale.set(ls, ls * 0.8, 1);
      const eFade = WR.m.action === 'die' && WR.m.progress >= 0 ? 1 - WR.m.progress : WR.m.root.visible ? 1 : 0;
      shadowE.position.set(WR.pos.x, 0.006, WR.pos.z); shadowE.material.opacity = 0.7 * eFade;
      IO.m.flamePos(flameP); glowW.position.set(flameP.x, 0.012, flameP.z);
      glowW.material.opacity = (0.14 + IO.m.flameLight.intensity * 0.1) * (1 - (IO.m.moon || 0));
      glowE.position.set(WR.pos.x, 0.012, WR.pos.z); glowE.material.opacity = shadowE.material.opacity * 0.45;
      LU.shadow.position.set(LU.pos.x, 0.006, LU.pos.z);
      glowG.material.opacity += (((LU.on ? 0.55 : 0)) - glowG.material.opacity) * Math.min(1, rdt * 2);

      FX.update(dt, clock.t);
      if (FX.grp.children.length !== fxKids) { lightOnly(FX.grp); fxKids = FX.grp.children.length; }
      applyCam(rdt);
      UI.status();
      UI.update(rdt);
      renderer.render(scene, camera);
      requestAnimationFrame(frame);
    }

    function init() {
      renderer = new THREE.WebGLRenderer({ canvas: glCanvas, alpha: true, antialias: true });
      renderer.setPixelRatio(DPR); renderer.setClearColor(0x000000, 0);
      scene = new THREE.Scene();
      scene.add(new THREE.HemisphereLight(0x756aa8, 0x33262f, 1.1));
      const moon = new THREE.DirectionalLight(0xb8c0ff, 0.62); moon.position.set(-5, 9, -12); scene.add(moon);
      const fill = new THREE.DirectionalLight(0xffdcc0, 0.42); fill.position.set(2, 5, 10); scene.add(fill);
      for (const i of SC.lamps) { const L = SC.layout.lights[i]; const p = new THREE.PointLight(new THREE.Color(L.c), L.i, L.d, 2); p.position.copy(lampPos(L.base, L.at)); scene.add(p); }
      const depthMat = new THREE.MeshBasicMaterial({ colorWrite: false, side: THREE.DoubleSide });
      for (const o of SC.layout.occ) for (const poly of o.polys) { const m = new THREE.Mesh(cutout(poly, o.base), depthMat); m.renderOrder = -1; scene.add(m); }
      scene.add(FX.grp);
      const add = (m) => { scene.add(m.root); if (m.fx) scene.add(m.fx); lightOnly(m.root); if (m.fx) lightOnly(m.fx); return m; };
      IO = fighter(add(cfg.makeIo()), HOME.io.x, HOME.io.z, HOME.io.yaw);
      WR = fighter(add(cfg.makeFoe()), ROUTE[0].x, ROUTE[0].z, 0);
      LU = fighter(add(cfg.makeLunara()), LUN.x, LUN.z, 0.3); LU.on = false;
      const dark = radialTex('rgba(10,4,16,0.62)', 'rgba(10,4,16,0.3)', 'rgba(10,4,16,0)');
      const light = radialTex('rgba(255,255,255,1)', 'rgba(255,255,255,0.28)');
      const disc = (r, map, color, add2, order) => { const m = new THREE.Mesh(new THREE.CircleGeometry(r, 36), new THREE.MeshBasicMaterial({ map, color, transparent: true, depthWrite: false, blending: add2 ? THREE.AdditiveBlending : THREE.NormalBlending })); m.rotation.x = -Math.PI / 2; m.renderOrder = order; scene.add(m); return m; };
      shadowW = disc(0.62, dark, 0xffffff, false, 1); shadowE = disc(0.8, dark, 0xffffff, false, 1); LU.shadow = disc(0.9, dark, 0xffffff, false, 1); LU.shadow.scale.set(1, 0.7, 1); LU.shadow.visible = false;
      glowW = disc(1.5, light, 0xa845ff, true, 2); glowE = disc(1.6, light, 0x2cff7a, true, 2); glowG = disc(3.2, light, 0xcfdcff, true, 2); glowG.position.set(WELL.x, 0.015, WELL.z); glowG.material.opacity = 0;
      lightOnly(scene);
      newEngine();
      layoutView(); shotAt(IO.pos, 1.35, 50); applyCam(1);
      // compile every shader up front (Lunara included), so her first rise doesn't stutter
      renderer.compile(scene, camera);
      LU.m.root.visible = false; if (LU.m.fx) LU.m.fx.visible = false;
      WR.m.root.visible = false;
      requestAnimationFrame(frame);

      const beginBtn = $('begin');
      const ready = () => { beginBtn.disabled = false; beginBtn.textContent = 'Begin the battle'; if (!coarse) beginBtn.focus({ preventScroll: true }); };
      paintImg.onload = () => { lastTf = ''; ready(); };
      paintImg.onerror = () => { beginBtn.textContent = 'The painting didn’t load. Reload to try again.'; };
      paintImg.src = SC.image.startsWith('data:') ? SC.image : '../' + SC.image;
      beginBtn.addEventListener('click', () => { SND.init(); $('start').hidden = true; intro(!!cfg.quickIntro); });
      $('skipBtn').addEventListener('click', () => { S.skip = true; if (skipRes) skipRes(); });
      $('again').addEventListener('click', () => { SND.init(); rematch(); });
      const snd = $('snd');
      snd.addEventListener('click', () => {
        SND.init(); const m = !SND.muted; SND.setMuted(m);
        snd.setAttribute('aria-pressed', String(!m)); snd.querySelector('span').textContent = m ? 'Sound off' : 'Sound on';
      });
      let tmr = 0;
      const onResize = () => { clearTimeout(tmr); tmr = setTimeout(layoutView, 100); };
      if (window.ResizeObserver) new ResizeObserver(onResize).observe(stage); else window.addEventListener('resize', onResize);

      // test hooks for headless checks
      window.__battle = {
        get state() { return S.state; }, get engine() { return E; }, get shown() { return D; }, get menuOpen() { return UI.menuOpen; },
        get result() { return S.result; }, get acting() { return S.acting; }, get trace() { return S.trace; },
        // a test shortcut: the foe down to n HP, shown and real
        weaken(n, who) { const f = who ? E.unit(who) : E.foes[0]; f.hp = Math.min(f.hp, n); D[f.key].hp = f.hp; },
        begin() { $('begin').click(); }, skip() { $('skipBtn').click(); }, pick(id) { return UI.pickId(id); }, again() { $('again').click(); },
        set turbo(v) { clock.turbo = v; }, get t() { return clock.t; }, set auto(p) { S.auto = p; },
      };
    }
    setTimeout(() => {
      try { init(); }
      catch (err) { console.error(err); const b = $('begin'); b.textContent = 'This battle needs WebGL, which isn’t available in this browser.'; }
    }, 30);
  }

  window.BattleScreen = { start };
})();
