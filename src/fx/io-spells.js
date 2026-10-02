// io-spells.js: the effects of Io's new healing spells (design decisions, October 2, 2026). Waxing Light heals both
// allies, Moonsteel gives Sol Heat and a moonlit blade, and Moth Veil wraps one ally in a barrier; Lunar Mend keeps its
// battle effect. Io's look and motions never change, so each spell plays one of her existing motions (SPELLS[id].motion)
// on the cue and hit times below, as her ACTIONS table does for her own moves: start the effect at the spell's first
// cue, and show its numbers at its hit. Built on battle-fx.js: makeIoSpells(fx) takes what makeBattleFX() returns and
// runs on its clock, sprites, particles and lights, so fx.update(dt, t) drives everything. Positions can be points or
// functions that return one, so the effects follow moving actors. three.js r128 (global THREE).
function makeIoSpells(fx) {
  'use strict';
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const sm = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const lerp = (a, b, t) => a + (b - a) * t;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const V3 = () => new THREE.Vector3();
  const pt = (f, out) => { const p = typeof f === 'function' ? f() : f; return (out || V3()).set(p.x, p.y || 0, p.z); };
  const cvs = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const _v2 = new THREE.Vector2();

  // The motion each spell plays, and when its effect starts (cues) and lands (hits), as fractions of that motion.
  const SPELLS = {
    // a crescent forms above the party and waxes full; the heal lands on both allies at mend's own hit time
    waxing: { name: 'Waxing Light', mp: 24, motion: 'mend', cues: [0.05], hits: [0.6], heal: 270 },
    // the crescent forms in her palm as her hand rises, leaves at the top of the cast and lands on Sol's blade
    moonsteel: { name: 'Moonsteel', mp: 18, motion: 'cast', cues: [0.08, 0.42], hits: [0.67], heat: 40, moonHit: 1.5, glow: 4 },
    // moths leave her hands from 0.2 to 0.5; the veil is whole when the last one settles
    veil: { name: 'Moth Veil', mp: 22, motion: 'cast', cues: [0.2], hits: [0.93], absorb: 0.35, turns: 2, spawnTo: 0.5 },
  };

  // ---------- Waxing Light: a thin crescent above the party waxes to a full moon, then soft light falls on both ----------
  function drawMoon(c, k) { // k: the lit fraction, from new (0) to full (1)
    const g = c.getContext('2d'), m = 64, R = 28;
    g.clearRect(0, 0, 128, 128);
    let gr = g.createRadialGradient(m, m, R * 0.7, m, m, 63);
    gr.addColorStop(0, 'rgba(236,240,255,' + (0.1 + 0.34 * k).toFixed(3) + ')'); gr.addColorStop(1, 'rgba(236,240,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128); // the halo grows as she fills
    g.fillStyle = 'rgba(170,186,255,0.12)'; g.beginPath(); g.arc(m, m, R, 0, TAU); g.fill(); // the dark of the moon, faintly
    g.save();
    g.beginPath(); g.arc(m, m, R, -Math.PI / 2, Math.PI / 2, false); // the lit limb, on the right
    g.ellipse(m, m, Math.max(0.01, R * Math.abs(1 - 2 * k)), R, 0, Math.PI / 2, -Math.PI / 2, k < 0.5); // back along the terminator
    g.closePath();
    g.shadowColor = 'rgba(255,246,222,0.95)'; g.shadowBlur = 9;
    gr = g.createRadialGradient(m + 9, m - 9, 2, m, m, R); gr.addColorStop(0, '#fffdf3'); gr.addColorStop(1, '#e6e3f7');
    g.fillStyle = gr; g.fill();
    g.clip(); g.shadowBlur = 0; g.fillStyle = 'rgba(146,146,194,0.24)'; // seas, only where she is lit
    for (const [x, y, r] of [[-8, -6, 7], [7, 5, 5], [-2, 11, 4], [11, -9, 3]]) { g.beginPath(); g.arc(m + x, m + y, r, 0, TAU); g.fill(); }
    g.restore();
  }
  // o: { sky: the point the moon hangs at, allies: [their chests], landIn: seconds until the heal lands }
  // Resolves when the heal lands; the caller shows the numbers then.
  function waxingLight(o) {
    const L = Math.max(0.5, o.landIn || 1), T = L + 0.8, c = cvs(128, 128), tex = new THREE.CanvasTexture(c);
    const moon = fx.sprite(tex, 0xffffff, THREE.AdditiveBlending, 7);
    const sky = V3(), p = V3(), allies = o.allies || [];
    let lastK = -1, fell = false, el = 0, landed = null;
    const done = new Promise((res) => { landed = res; });
    drawMoon(c, 0.07); moon.material.opacity = 0;
    fx.anim(T, (u, dt) => {
      el += dt || 0;
      pt(o.sky, sky);
      const k = lerp(0.07, 1, sm(0.15 * L, 0.72 * L, el));
      if (Math.abs(k - lastK) > 0.004) { drawMoon(c, k); tex.needsUpdate = true; lastK = k; }
      const appear = sm(0, 0.22 * L, el), gone = sm(L + 0.12, T, el), full = sm(0.7 * L, 0.8 * L, el);
      moon.position.copy(sky); moon.position.y += 0.25 * gone;
      moon.scale.setScalar(0.8 * (0.7 + 0.3 * appear) * (1 + 0.1 * full * (1 - gone)));
      moon.material.opacity = appear * (1 - gone);
      if (!fell && el >= 0.72 * L) { // the light starts to fall
        fell = true;
        for (const a of allies) { pt(a, p); fx.beam(p, 0xfff1d6, 0.95, 5, 0.3 * L + 0.75); }
      }
      if (fell && el < L) for (const a of allies) if (Math.random() < 0.6) {
        pt(a, p); fx.embers.emit(V3().set(p.x + rnd(-0.35, 0.35), sky.y - 0.2, p.z + rnd(-0.3, 0.3)), [1, 0.95, 0.8], 1, { speed: 0.1, dir: { x: 0, y: -2.2, z: 0 }, life: 0.8, grav: -0.6, drag: 0.4 });
      }
      if (landed && el >= L) { // the heal lands
        for (const a of allies) { pt(a, p); fx.burst(p, [1, 0.96, 0.82], 26, 1.8, { up: 1 }); fx.ring({ x: p.x, z: p.z }, 0xfff0c8, 0.2, 1.0, 0.6, 0.8); }
        fx.flashLight(sky, 0xfff4e0, 3, 0.5, 6);
        const f = landed; landed = null; f();
      }
    }, () => { fx.drop(moon); tex.dispose(); if (landed) landed(); });
    return done;
  }

  // ---------- Moonsteel: a silver crescent forms in Io's palm, flies to Sol's sword, and the blade glows ----------
  const BLADE_VS = [
    'uniform vec3 uA; uniform vec3 uB; uniform float uW;',
    'varying vec2 vQ;',
    'void main() {',
    '  vec3 P = mix(uA, uB, position.y);',
    '  vec3 s = cross(normalize(uB - uA), normalize(cameraPosition - P));', // a ribbon that always faces the camera
    '  float l = length(s); s = l > 1e-4 ? s / l : vec3(1.0, 0.0, 0.0);',
    '  vQ = position.xy;',
    '  gl_Position = projectionMatrix * viewMatrix * vec4(P + s * position.x * uW, 1.0);',
    '}'].join('\n');
  const BLADE_FS = [
    'uniform vec3 uColor; uniform float uOpacity; uniform float uTime;',
    'varying vec2 vQ;',
    'void main() {',
    '  float x = abs(vQ.x);',
    '  float glow = exp(-x * x * 30.0) + 0.4 * exp(-x * x * 4.0);',
    '  float ends = smoothstep(-0.1, 0.06, vQ.y) * smoothstep(1.1, 0.95, vQ.y);',
    '  float run = 0.8 + 0.2 * sin(vQ.y * 22.0 - uTime * 7.0);',
    '  gl_FragColor = vec4(uColor, clamp(glow * ends * run * uOpacity, 0.0, 1.0));',
    '}'].join('\n');
  // blade(outBase, outTip) fills the blade's two ends each frame; one draw call for as long as it glows
  function bladeGlow(blade, dur, color) {
    const N = 8, P = new Float32Array((N + 1) * 6), idx = [];
    for (let i = 0; i <= N; i++) for (let s = 0; s < 2; s++) P.set([s ? 1 : -1, lerp(-0.1, 1.1, i / N), 0], (i * 2 + s) * 3);
    for (let i = 0; i < N; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(P, 3)); geo.setIndex(idx);
    const U = { uA: { value: V3() }, uB: { value: V3() }, uW: { value: 0.075 }, uColor: { value: new THREE.Color(color || 0xcfe0ff) }, uOpacity: { value: 0 }, uTime: { value: 0 } };
    const mat = new THREE.ShaderMaterial({ uniforms: U, vertexShader: BLADE_VS, fragmentShader: BLADE_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; mesh.renderOrder = 6; fx.grp.add(mesh);
    let el = 0;
    return fx.anim(dur, (u, dt) => {
      el += dt || 0;
      blade(U.uA.value, U.uB.value);
      const k = sm(0, 0.25, el) * (1 - sm(dur - 0.8, dur, el)) * (0.85 + 0.15 * Math.sin(el * 6));
      U.uOpacity.value = k; U.uTime.value = el;
      if (Math.random() < 0.4 * k) fx.sparks.emit(V3().lerpVectors(U.uA.value, U.uB.value, Math.random()), [0.8, 0.88, 1], 1, { speed: 0.25, life: 0.4, spread: 0.02, grav: 0.4, drag: 3 });
    }, () => { fx.grp.remove(mesh); geo.dispose(); mat.dispose(); });
  }
  // o: { palm: where it forms, blade(outBase, outTip), releaseIn, landIn: seconds, glowFor: seconds }
  // Resolves when the crescent reaches the blade, which then glows silver-blue for glowFor seconds.
  function moonsteel(o) {
    const rel = Math.max(0.1, o.releaseIn || 0.5), land = Math.max(rel + 0.15, o.landIn || rel + 0.35);
    const cres = fx.sprite(fx.T.crescent, 0xdfe9ff, THREE.AdditiveBlending, 7);
    const from = V3(), to = V3(), mid = V3(), p = V3(), A = V3(), B = V3();
    let rot = 0, el = 0, launched = false;
    cres.scale.setScalar(0.001);
    return new Promise((arrive) => {
      fx.anim(land, (u, dt) => {
        el += dt || 0; const d = dt || 0;
        if (el < rel) { // forming: it grows and turns in her palm
          pt(o.palm, p); const k = sm(0, rel * 0.85, el);
          cres.position.copy(p); cres.scale.setScalar(0.03 + 0.17 * k); cres.material.opacity = k;
          rot += d * (2 + 4 * k);
          if (Math.random() < 0.4) fx.sparks.emit(p, [0.8, 0.88, 1], 1, { speed: 0.4, life: 0.35, spread: 0.04, grav: 0, drag: 3 });
        } else { // flying in a low arc to the middle of the blade
          if (!launched) { launched = true; pt(o.palm, from); }
          const e = sm(rel, land, el);
          o.blade(A, B); to.lerpVectors(A, B, 0.55);
          mid.copy(from).lerp(to, 0.5); mid.y += 0.35;
          const k0 = (1 - e) * (1 - e), k1 = 2 * (1 - e) * e, k2 = e * e;
          p.set(from.x * k0 + mid.x * k1 + to.x * k2, from.y * k0 + mid.y * k1 + to.y * k2, from.z * k0 + mid.z * k1 + to.z * k2);
          cres.position.copy(p); cres.scale.setScalar(0.2 - 0.06 * e); cres.material.opacity = 1;
          rot += d * 14;
          fx.embers.emit(p, [0.75, 0.85, 1], 2, { speed: 0.2, life: 0.35, grav: 0, drag: 4 });
        }
        cres.material.rotation = rot;
      }, () => {
        fx.drop(cres);
        o.blade(A, B); to.lerpVectors(A, B, 0.55);
        fx.burst(to, [0.85, 0.92, 1], 24, 2.2); fx.flashLight(to, 0xcfe0ff, 2.5, 0.35, 4);
        bladeGlow(o.blade, o.glowFor || SPELLS.moonsteel.glow);
        arrive();
      });
    });
  }

  // ---------- Moth Veil: pale moths spiral from her hands and settle into a dome of moth wings ----------
  function mothCanvas() { // one moth from above, for the flying moths
    const S = 64, c = cvs(S, S), g = c.getContext('2d');
    g.translate(S / 2, S / 2 + 2); g.shadowColor = 'rgba(222,212,255,0.95)'; g.shadowBlur = 5;
    for (const sd of [-1, 1]) {
      g.save(); g.scale(sd, 1);
      g.fillStyle = 'rgba(250,246,255,0.95)'; g.beginPath(); g.moveTo(1, -2); g.bezierCurveTo(9, -22, 28, -24, 29, -11); g.bezierCurveTo(28, -2, 14, 1, 1, 1); g.fill();
      g.fillStyle = 'rgba(228,218,255,0.9)'; g.beginPath(); g.moveTo(1, 1); g.bezierCurveTo(16, 2, 24, 12, 18, 21); g.bezierCurveTo(10, 25, 4, 13, 1, 4); g.fill();
      g.shadowBlur = 0; g.fillStyle = 'rgba(150,164,255,0.85)'; g.beginPath(); g.arc(17, -11, 3.2, 0, TAU); g.fill();
      g.restore();
    }
    g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(0, 1, 2.2, 10, 0, 0, TAU); g.fill();
    return c;
  }
  function wingTile() { // rows of spread moth wings, for the veil; tiles left to right
    const W = 256, H = 128, c = cvs(W, H), g = c.getContext('2d');
    const pair = (x, y, a) => {
      g.save(); g.translate(x, y); g.rotate(a); g.scale(1.15, 1.15);
      for (const sd of [-1, 1]) {
        g.save(); g.scale(sd, 1);
        const gr = g.createLinearGradient(0, 0, 30, -18); gr.addColorStop(0, 'rgba(255,255,255,0.6)'); gr.addColorStop(1, 'rgba(204,194,255,0.2)');
        g.fillStyle = gr; g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 1.2;
        g.beginPath(); g.moveTo(1, -1); g.bezierCurveTo(8, -20, 30, -24, 31, -10); g.bezierCurveTo(30, 0, 14, 2, 1, 1); g.closePath(); g.fill(); g.stroke();
        g.beginPath(); g.moveTo(1, 1); g.bezierCurveTo(16, 2, 24, 12, 17, 20); g.bezierCurveTo(9, 23, 3, 12, 1, 3); g.closePath(); g.fill(); g.stroke();
        g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 0.8;
        for (const [ex, ey] of [[26, -18], [29, -9], [20, -3], [17, 14]]) { g.beginPath(); g.moveTo(2, 0); g.quadraticCurveTo(ex * 0.5, ey * 0.3, ex, ey); g.stroke(); }
        g.fillStyle = 'rgba(186,198,255,0.65)'; g.beginPath(); g.arc(18, -11, 3, 0, TAU); g.fill();
        g.restore();
      }
      g.restore();
    };
    for (let row = 0; row < 2; row++) for (let i = 0; i < 4; i++) {
      const x = (i + 0.5 + (row % 2) * 0.5) * (W / 4), y = (row + 0.55) * (H / 2);
      for (const dx of [-W, 0, W]) pair(x + dx, y, row % 2 ? 0.15 : -0.15);
    }
    return c;
  }
  const mothT = new THREE.CanvasTexture(mothCanvas());
  const wingT = new THREE.CanvasTexture(wingTile()); wingT.wrapS = wingT.wrapT = THREE.RepeatWrapping;
  const domeGeo = new THREE.SphereGeometry(1, 40, 16, 0, TAU, 0, Math.PI / 2); // an upper hemisphere, scaled to the ally
  const MOTH_VS = [ // point sprites, one draw call for every moth in flight
    'attribute float aSize; attribute float aFlap; attribute float aAlpha; attribute float aSpin;',
    'uniform float uHalfH;',
    'varying float vFlap; varying float vAlpha; varying float vSpin;',
    'void main() {',
    '  vFlap = aFlap; vAlpha = aAlpha; vSpin = aSpin;',
    '  vec4 mv = modelViewMatrix * vec4(position, 1.0);',
    '  gl_PointSize = aSize * projectionMatrix[1][1] * uHalfH / max(0.05, -mv.z);',
    '  gl_Position = projectionMatrix * mv;',
    '}'].join('\n');
  const MOTH_FS = [
    'uniform sampler2D map; uniform vec3 uColor;',
    'varying float vFlap; varying float vAlpha; varying float vSpin;',
    'void main() {',
    '  vec2 q = gl_PointCoord - 0.5;',
    '  float c = cos(vSpin), s = sin(vSpin);',
    '  q = vec2(c * q.x - s * q.y, s * q.x + c * q.y);',
    '  q.x /= max(vFlap, 0.1);', // the wings beat: the moth narrows and widens
    '  if (abs(q.x) > 0.5 || abs(q.y) > 0.5) discard;',
    '  vec4 m = texture2D(map, vec2(q.x + 0.5, 0.5 - q.y));',
    '  gl_FragColor = vec4(uColor * m.rgb, m.a * vAlpha);',
    '}'].join('\n');
  const VEIL_VS = [
    'uniform vec3 uScale;',
    'varying vec2 vUv; varying vec3 vN; varying vec3 vV; varying vec3 vL;',
    'void main() {',
    '  vUv = uv; vL = position * uScale;',
    '  vec4 wp = modelMatrix * vec4(position, 1.0);',
    '  vN = normalize(normal / uScale); vV = cameraPosition - wp.xyz;',
    '  gl_Position = projectionMatrix * viewMatrix * wp;',
    '}'].join('\n');
  const VEIL_FS = [
    'uniform sampler2D map; uniform vec3 uColor; uniform float uOpacity; uniform float uTime; uniform vec3 uHit; uniform float uHitT;',
    'varying vec2 vUv; varying vec3 vN; varying vec3 vV; varying vec3 vL;',
    'void main() {',
    '  vec4 w = texture2D(map, vec2(vUv.x * 4.0 + uTime * 0.012, vUv.y * 2.0 - uTime * 0.02));',
    '  float rim = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.5);',
    '  float sh = 0.72 + 0.28 * sin(uTime * 2.6 + vUv.x * 31.4 + vUv.y * 9.0);', // the shimmer
    '  float crown = smoothstep(0.99, 0.82, vUv.y), base = smoothstep(0.0, 0.07, vUv.y);',
    '  float ring = 0.0;',
    '  if (uHitT >= 0.0) { float d = distance(vL, uHit) - uHitT * 2.4; ring = exp(-d * d * 36.0) * exp(-uHitT * 2.2); }', // the ripple, in meters
    '  float a = (w.a * 0.62 * sh * crown + rim * 0.45 + ring * 1.3) * base * uOpacity;',
    '  gl_FragColor = vec4(mix(uColor, vec3(1.0), clamp(ring, 0.0, 1.0) * 0.6) * (0.8 + 0.4 * w.r), clamp(a, 0.0, 1.0));',
    '}'].join('\n');
  // o: { hands: [where moths leave from], target: the ally's chest, feet: the ally's spot, height, radius,
  //      spawnFor: seconds the moths keep leaving, landIn: seconds until the last one settles }
  // Returns the veil: { up, alive, ready (a promise), strike(from) (a ripple, then it fades; a promise), dismiss() }.
  function mothVeil(o) {
    const N = 14, H = o.height || 2, R = o.radius || 0.72, spawn = Math.max(0.05, o.spawnFor || 0.4), land = Math.max(spawn + 0.3, o.landIn || 1);
    const hands = o.hands && o.hands.length ? o.hands : [o.target];
    // the moths in flight: one Points object
    const P = new Float32Array(N * 3), S = new Float32Array(N), F = new Float32Array(N), A = new Float32Array(N), W = new Float32Array(N);
    const mg = new THREE.BufferGeometry();
    mg.setAttribute('position', new THREE.BufferAttribute(P, 3)); mg.setAttribute('aSize', new THREE.BufferAttribute(S, 1));
    mg.setAttribute('aFlap', new THREE.BufferAttribute(F, 1)); mg.setAttribute('aAlpha', new THREE.BufferAttribute(A, 1)); mg.setAttribute('aSpin', new THREE.BufferAttribute(W, 1));
    const MU = { map: { value: mothT }, uColor: { value: new THREE.Color(0xf2ecff) }, uHalfH: { value: 400 } };
    const mm = new THREE.ShaderMaterial({ uniforms: MU, vertexShader: MOTH_VS, fragmentShader: MOTH_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    const pts = new THREE.Points(mg, mm); pts.frustumCulled = false; pts.renderOrder = 7; fx.grp.add(pts);
    pts.onBeforeRender = (r) => { r.getDrawingBufferSize(_v2); MU.uHalfH.value = _v2.y * 0.5; };
    // the veil: one dome
    const DU = { map: { value: wingT }, uColor: { value: new THREE.Color(0xdcd6ff) }, uOpacity: { value: 0 }, uTime: { value: 0 }, uScale: { value: new THREE.Vector3(R, H, R) }, uHit: { value: V3() }, uHitT: { value: -1 } };
    const dm = new THREE.ShaderMaterial({ uniforms: DU, vertexShader: VEIL_VS, fragmentShader: VEIL_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
    const dome = new THREE.Mesh(domeGeo, dm); dome.scale.set(R, H, R); dome.renderOrder = 6; dome.frustumCulled = false; fx.grp.add(dome);
    const moths = [];
    for (let i = 0; i < N; i++) {
      const f = i / (N - 1), y = 0.22 + 0.62 * ((i * 0.618) % 1), a = i * 2.39996, r = Math.sqrt(1 - y * y);
      moths.push({ t0: spawn * f, t1: land - 0.35 * (1 - f), hand: i % hands.length, from: V3(), spot: [Math.sin(a) * r, y, Math.cos(a) * r], ph: rnd(0, TAU), turn: i % 2 ? 1 : -1, out: false, settled: false });
    }
    const base = V3(), dest = V3(), p = V3(), ax = V3(), u1 = V3(), u2 = V3(), up = new THREE.Vector3(0, 1, 0);
    let el = 0, settled = 0, glow = 0, struckAt = -1, fadeFrom = -1, fadeLen = 0.8, gone = null, ready = null;
    const veil = { up: false, alive: true, target: o.target, ready: new Promise((res) => { ready = res; }) };
    veil.strike = (from) => {
      if (!veil.alive || struckAt >= 0) return Promise.resolve();
      pt(o.feet, base); const f = pt(from).sub(base); f.y = 0; if (f.lengthSq() < 1e-6) f.set(0, 0, 1); f.normalize();
      const y = Math.min(1.15, H * 0.55), rr = R * Math.sqrt(Math.max(0, 1 - (y / H) * (y / H)));
      DU.uHit.value.set(f.x * rr, y, f.z * rr); DU.uHitT.value = 0; struckAt = el; veil.up = false;
      const at = V3().set(base.x + f.x * rr, y, base.z + f.z * rr);
      fx.burst(at, [0.9, 0.9, 1], 30, 2.6); fx.flashLight(at, 0xdcd6ff, 2.5, 0.4, 4);
      return new Promise((res) => { gone = res; });
    };
    veil.dismiss = () => { if (veil.alive && fadeFrom < 0) { veil.up = false; fadeFrom = el; fadeLen = 0.4; } };
    fx.anim(1e9, (u, dt) => {
      el += dt || 0;
      pt(o.feet, base); dome.position.set(base.x, 0, base.z);
      // moths: out of her hands, a widening and closing spiral, then into the veil
      let flying = 0;
      moths.forEach((m, i) => {
        if (m.settled || el < m.t0) { A[i] = 0; return; }
        if (!m.out) { m.out = true; pt(hands[m.hand], m.from); }
        dest.set(base.x + m.spot[0] * R, m.spot[1] * H, base.z + m.spot[2] * R);
        const s = clamp((el - m.t0) / (m.t1 - m.t0), 0, 1), e = s * s * (3 - 2 * s);
        ax.subVectors(dest, m.from); if (ax.lengthSq() < 1e-6) ax.set(0, 0, 1); ax.normalize();
        u1.crossVectors(ax, up); if (u1.lengthSq() < 1e-6) u1.set(1, 0, 0); u1.normalize(); u2.crossVectors(ax, u1);
        const rad = 0.3 * Math.sin(Math.PI * s), ang = m.ph + m.turn * s * TAU * 1.3;
        p.lerpVectors(m.from, dest, e).addScaledVector(u1, Math.cos(ang) * rad).addScaledVector(u2, Math.sin(ang) * rad); p.y += 0.25 * Math.sin(Math.PI * s);
        P.set([p.x, p.y, p.z], i * 3);
        S[i] = lerp(0.15, 0.1, s); F[i] = 0.2 + 0.8 * Math.abs(Math.sin(el * 24 + m.ph)); W[i] = 0.5 * Math.sin(el * 6 + m.ph);
        A[i] = sm(0, 0.1, s) * (1 - sm(0.88, 1, s));
        if (s >= 1) { m.settled = true; settled++; A[i] = 0; if (settled === N) { veil.up = struckAt < 0 && fadeFrom < 0; ready(); } }
        else flying++;
        if (Math.random() < 0.3) fx.embers.emit(p, [0.85, 0.82, 1], 1, { speed: 0.1, life: 0.3, grav: 0, drag: 4 });
      });
      for (const k of ['position', 'aSize', 'aFlap', 'aAlpha', 'aSpin']) mg.attributes[k].needsUpdate = true;
      pts.visible = flying > 0;
      // the veil: it fills as the moths settle, shimmers while up, ripples where it is struck, then fades
      glow += (settled / N - glow) * Math.min(1, (dt || 0) * 6);
      let k = glow;
      if (struckAt >= 0) {
        const s = el - struckAt; DU.uHitT.value = s;
        k *= 1 + 1.6 * Math.exp(-s * 7);
        if (s > 0.45 && fadeFrom < 0) { fadeFrom = el; fadeLen = 0.8; }
      }
      if (fadeFrom >= 0) {
        const f = clamp((el - fadeFrom) / fadeLen, 0, 1); k *= 1 - f;
        if (Math.random() < 0.6 * (1 - f)) { const a = rnd(0, TAU), y = rnd(0.2, 0.9); fx.embers.emit(V3().set(base.x + Math.sin(a) * R * Math.sqrt(1 - y * y), y * H, base.z + Math.cos(a) * R * Math.sqrt(1 - y * y)), [0.88, 0.85, 1], 1, { speed: 0.2, life: 0.9, grav: 0.5, drag: 1.5 }); }
        if (f >= 1) { veil.alive = false; veil.up = false; return true; }
      }
      DU.uOpacity.value = k; DU.uTime.value = el;
      dome.scale.set(R, H, R).multiplyScalar(1 + (struckAt >= 0 ? 0.05 * Math.exp(-(el - struckAt) * 5) * Math.sin((el - struckAt) * 30) : 0));
      return false;
    }, () => {
      fx.grp.remove(pts); fx.grp.remove(dome); mg.dispose(); mm.dispose(); dm.dispose();
      if (ready) ready(); if (gone) gone();
    });
    return veil;
  }

  return { SPELLS, waxingLight, moonsteel, bladeGlow, mothVeil };
}
